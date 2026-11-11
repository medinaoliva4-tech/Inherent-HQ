// Huellas para detectar contenido «quemado» (el mismo contenido visto en otras cuentas/plataformas).
//  · visual: dHash de 64 bits por fotograma (1 por segundo), sacado con ffmpeg; sin Python ni GPU.
//  · audio:  huella Chromaprint (fpcalc, de AcoustID). Detecta el mismo audio aunque cambie el video.
//  · texto:  parecido de la transcripción/gancho por tríos de palabras (Jaccard).
import { correr } from './util.mjs';

const ANCHO = 9, ALTO = 8, PX = ANCHO * ALTO;

/** dHash desde bytes en gris de 9×8: bit = el píxel es más claro que su vecino de la derecha. */
export function dhashDeBytes(buf, off = 0) {
  let h = 0n;
  for (let y = 0; y < ALTO; y++) {
    for (let x = 0; x < ANCHO - 1; x++) {
      h = (h << 1n) | (buf[off + y * ANCHO + x] > buf[off + y * ANCHO + x + 1] ? 1n : 0n);
    }
  }
  return h.toString(16).padStart(16, '0');
}

export async function dhashVideo(entrada, { ffmpeg = 'ffmpeg', segundos = 60, fps = 1, ejecutar = correr } = {}) {
  const { stdout } = await ejecutar(ffmpeg, [
    '-v', 'error', '-t', String(segundos), '-i', entrada,
    '-vf', `fps=${fps},scale=${ANCHO}:${ALTO}:flags=area,format=gray`,
    '-f', 'rawvideo', '-',
  ], { encoding: 'buffer', timeout: 180_000 });
  const out = [];
  for (let off = 0; off + PX <= stdout.length; off += PX) out.push(dhashDeBytes(stdout, off));
  return out;
}

const popcount = (x) => { let c = 0; while (x) { x &= x - 1n; c++; } return c; };
export const hamming = (a, b) => popcount(BigInt('0x' + a) ^ BigInt('0x' + b));

// Fotogramas planos (negro, blanco, color liso) dan hashes casi vacíos y parecen iguales entre sí: se descartan.
const informativo = (h) => { const c = popcount(BigInt('0x' + h)); return c >= 6 && c <= 58; };

/**
 * Parecido visual 0..1: fracción de fotogramas de un video que tienen un gemelo (Hamming ≤ tol) en el otro.
 * Se toma el lado más corto (un clip recortado de un video largo también cuenta como el mismo contenido).
 */
export function similitudVisual(A = [], B = [], tol = 10) {
  const a = A.filter(informativo), b = B.filter(informativo);
  if (a.length < 3 || b.length < 3) return 0;
  const cubre = (xs, ys) => xs.filter((x) => ys.some((y) => hamming(x, y) <= tol)).length / xs.length;
  const [corto, largo] = a.length <= b.length ? [a, b] : [b, a];
  return Math.round(cubre(corto, largo) * 1000) / 1000;
}

export async function huellaAudio(entrada, { fpcalc = 'fpcalc', segundos = 60, ejecutar = correr } = {}) {
  const { stdout } = await ejecutar(fpcalc, ['-raw', '-json', '-length', String(segundos), entrada], { timeout: 120_000 });
  const j = JSON.parse(stdout);
  return Array.isArray(j.fingerprint) ? j.fingerprint : null;
}

const pop32 = (x) => { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; };

/**
 * Parecido de audio 0..1 con desfase de hasta ±maxDesfase cuadros (~0.12 s cada uno).
 * Audio al azar coincide ~50 % de bits → 0; ≥ 90 % de bits iguales → 1.
 */
export function similitudAudio(fa, fb, { maxDesfase = 80, minTraslape = 20 } = {}) {
  if (!fa?.length || !fb?.length) return 0;
  let mejor = 0;
  for (let d = -maxDesfase; d <= maxDesfase; d++) {
    let bits = 0, n = 0;
    for (let i = Math.max(0, -d); i < fa.length && i + d < fb.length; i++) {
      bits += pop32((fa[i] ^ fb[i + d]) >>> 0); n++;
    }
    if (n < minTraslape) continue;
    mejor = Math.max(mejor, 1 - bits / (n * 32));
  }
  return Math.round(Math.min(1, Math.max(0, (mejor - 0.5) / 0.4)) * 1000) / 1000;
}

export function normalizarTexto(t = '') {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/).filter(Boolean);
}

export function similitudTexto(a = '', b = '', k = 3) {
  const tri = (t) => { const w = normalizarTexto(t); const s = new Set(); for (let i = 0; i + k <= w.length; i++) s.add(w.slice(i, i + k).join(' ')); return s; };
  const A = tri(a), B = tri(b);
  if (A.size < 3 || B.size < 3) return 0;
  let inter = 0; for (const x of A) if (B.has(x)) inter++;
  return Math.round((inter / Math.min(A.size, B.size)) * 1000) / 1000;
}

/**
 * Marca cada publicación contra todo lo que el radar ha visto (índice histórico + esta corrida).
 * fresco: no se parece a nada · visto: aparece en alguna otra cuenta/plataforma ·
 * quemado: aparece en ≥ `cuentasQuemado` otras cuentas/plataformas.
 * El audio solo cuenta aparte: el mismo audio puede ser música de tendencia, no contenido repetido.
 */
export function detectarQuemado(posts, indice = [], u = { visual: 0.6, audio: 0.7, texto: 0.5, cuentasQuemado: 2 }) {
  const todos = new Map();
  for (const x of indice) todos.set(x.clave, x);
  for (const p of posts) todos.set(p.clave, { clave: p.clave, plataforma: p.plataforma, cuenta: p.cuenta, url: p.url, ...(p.huellas ?? {}) });
  return posts.map((p) => {
    const h = p.huellas ?? {};
    const parecidos = [];
    for (const o of todos.values()) {
      if (o.clave === p.clave) continue;
      const s = {
        visual: similitudVisual(h.dhash, o.dhash),
        audio: similitudAudio(h.audio, o.audio),
        texto: similitudTexto(h.texto, o.texto),
      };
      if (s.visual >= u.visual || s.texto >= u.texto || s.audio >= u.audio) {
        parecidos.push({ clave: o.clave, plataforma: o.plataforma, cuenta: o.cuenta, url: o.url, ...s, solo_audio: s.visual < u.visual && s.texto < u.texto });
      }
    }
    const yo = `${p.plataforma}:${p.cuenta}`;
    const contenido = parecidos.filter((x) => !x.solo_audio);
    const otras = new Set(contenido.map((x) => `${x.plataforma}:${x.cuenta}`).filter((k) => k !== yo));
    const estado = otras.size >= u.cuentasQuemado ? 'quemado' : otras.size >= 1 ? 'visto' : 'fresco';
    return {
      ...p,
      quemado: {
        estado,
        es_quemado: estado === 'quemado',
        otras_cuentas: [...otras],
        mismo_audio_en: parecidos.filter((x) => x.solo_audio).map((x) => x.url ?? x.clave),
        parecidos: parecidos.sort((a, b) => Math.max(b.visual, b.texto) - Math.max(a.visual, a.texto)).slice(0, 10),
      },
    };
  });
}
