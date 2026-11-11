#!/usr/bin/env node
// Desglose (breakdown) de un video por escena: cortes con ffmpeg, y por escena tipo de plano, texto en pantalla
// y efecto con un modelo de visión barato por LiteLLM. Sin IA (o si falla) queda lo que ffmpeg sabe medir:
// tiempos, ritmo, gancho/cuerpo/cierre y fundidos de entrada.
// El desglose se convierte en una receta de estilo (escenas_plantilla) para «Imitar este».
//
//   node code-os/video/desglose.mjs video.mp4 [--receta]
//   Variables: LITELLM_BASE (http://127.0.0.1:4000/v1), LITELLM_MASTER_KEY, VIDEO_NIVEL_VISION (vacío = sin IA)
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FF = () => process.env.VIDEO_FFMPEG || 'ffmpeg';
const FP = () => process.env.VIDEO_FFPROBE || 'ffprobe';
const ejecutar = (bin, args, opciones = {}) => new Promise((ok, mal) => execFile(bin, args, { maxBuffer: 64 * 1024 * 1024, encoding: 'buffer', ...opciones }, (e, out, err) => (e ? mal(new Error(`${bin}: ${String(err).trim().split('\n').at(-1)}`)) : ok({ out, err: String(err) }))));

export const PLANOS = ['primer plano', 'plano medio', 'plano general', 'detalle', 'b-roll', 'grafico'];
export const EFECTOS = ['ninguno', 'zoom-in', 'zoom-out', 'texto-animado', 'movimiento'];

/** Tiempos de corte (s) a partir de la salida de showinfo. Puro. */
export function leerCortes(stderr) {
  return [...String(stderr).matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1])).filter((t) => t > 0.05);
}

/** Planos [inicio, fin] desde los cortes; une los planos de menos de `minimo` s con el anterior. Puro. */
export function planos(cortes, duracion, minimo = 0.3) {
  const bordes = [0, ...[...new Set(cortes)].sort((a, b) => a - b).filter((t) => t < duracion - minimo), duracion];
  const out = [];
  for (let i = 0; i < bordes.length - 1; i++) {
    const [a, b] = [bordes[i], bordes[i + 1]];
    if (out.length && b - a < minimo) out.at(-1)[1] = b; else out.push([a, b]);
  }
  return out;
}

/** Gancho = primer plano, cierre = último, cuerpo = el resto. Ritmo en planos por minuto. Puro. */
export function armarDesglose({ fuente, duracion, ancho, alto, tramos, porEscena = [], metodo }) {
  const r3 = (n) => Math.round(n * 1000) / 1000;
  const escenas = tramos.map(([inicio, fin], i) => ({
    inicio: r3(inicio), fin: r3(fin), duracion: r3(fin - inicio),
    rol: i === 0 ? 'gancho' : i === tramos.length - 1 && tramos.length > 1 ? 'cierre' : 'cuerpo',
    plano: null, texto: null, posicion_texto: null, efecto: null, persona: null, fundido_entrada: false,
    ...porEscena[i],
  }));
  const media = duracion / Math.max(1, escenas.length);
  return {
    version: 1, fuente, duracion: r3(duracion), ancho, alto,
    formato: ancho && alto ? (ancho / alto < 0.8 ? '9:16' : ancho / alto > 1.3 ? '16:9' : '1:1') : null,
    metodo,
    ritmo: { escenas: escenas.length, duracion_media: r3(media), escenas_por_minuto: r3((escenas.length / duracion) * 60), lectura: media < 1.5 ? 'muy rápido' : media < 3 ? 'rápido' : media < 6 ? 'medio' : 'lento' },
    escenas,
  };
}

/** Luma media (0–255) de cada cuadro a `fps` cuadros por segundo, en una sola pasada de ffmpeg. */
async function serieLuma(ruta, fps = 10) {
  const { out } = await ejecutar(FF(), ['-v', 'error', '-i', ruta, '-an', '-vf', `fps=${fps},scale=16:16`, '-pix_fmt', 'gray', '-f', 'rawvideo', '-']);
  const serie = [];
  for (let i = 0; i + 256 <= out.length; i += 256) { let s = 0; for (let j = i; j < i + 256; j++) s += out[j]; serie.push(s / 256); }
  return serie;
}

/**
 * Cortes que el detector de escenas no ve: la entrada a negro (fundido) desde una toma oscura.
 * Marca un corte donde la luma cae a casi negro y después sube. Puro.
 */
export function cortesPorNegro(serie, fps = 10, negro = 6) {
  // arranque de un fundido desde negro: casi negro y en el cuadro siguiente sube fuerte (aunque la toma anterior ya fuera oscura)
  const out = [];
  for (let i = 1; i < serie.length - 1; i++) if (serie[i] < negro && serie[i] <= serie[i - 1] && serie[i + 1] > serie[i] + 15) out.push(i / fps);
  return out;
}

const lumaEn = (serie, t, fps = 10) => serie[Math.min(serie.length - 1, Math.max(0, Math.round(t * fps)))] ?? null;

/** Visión barata por LiteLLM: tipo de plano, texto en pantalla y efecto de un fotograma. */
export function crearVision({ base = process.env.LITELLM_BASE ?? 'http://127.0.0.1:4000/v1', key = process.env.LITELLM_MASTER_KEY ?? '', modelo = process.env.VIDEO_NIVEL_VISION ?? '', fetchImpl = fetch, timeoutMs = 45_000 } = {}) {
  if (!modelo || !key) return null;
  return async (jpg, { inicio, fin }) => {
    const ctrl = new AbortController(); const tt = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetchImpl(`${base.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: modelo, temperature: 0.1, max_tokens: 200, messages: [
          { role: 'system', content: 'Eres editor de video. Respondes SOLO un objeto JSON válido en español.' },
          { role: 'user', content: [
            { type: 'text', text: `Fotograma central de una escena de ${(fin - inicio).toFixed(1)} s. Devuelve {"plano": uno de ${JSON.stringify(PLANOS)}, "texto": "texto que aparece en pantalla o null", "posicion_texto": "arriba"|"centro"|"abajo"|null, "efecto": uno de ${JSON.stringify(EFECTOS)}, "persona": true|false}` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${readFileSync(jpg).toString('base64')}` } }] }] }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error?.message ?? `HTTP ${r.status}`);
      const m = String(j.choices?.[0]?.message?.content ?? '').match(/\{[\s\S]*\}/);
      const d = m ? JSON.parse(m[0]) : null;
      if (!d) throw new Error('respuesta sin JSON');
      return {
        plano: PLANOS.includes(d.plano) ? d.plano : null,
        texto: typeof d.texto === 'string' && d.texto.trim() && d.texto !== 'null' ? d.texto.trim().slice(0, 140) : null,
        posicion_texto: ['arriba', 'centro', 'abajo'].includes(d.posicion_texto) ? d.posicion_texto : null,
        efecto: EFECTOS.includes(d.efecto) ? d.efecto : null,
        persona: typeof d.persona === 'boolean' ? d.persona : null,
      };
    } finally { clearTimeout(tt); }
  };
}

/** Desglosa un video local. `vision` = función de crearVision() o null (sin IA). */
export async function desglosar(ruta, { umbral = 0.3, vision = crearVision(), maxEscenas = 40 } = {}) {
  const { out } = await ejecutar(FP(), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', ruta]);
  const info = JSON.parse(String(out));
  const duracion = Number(info.format?.duration ?? 0);
  const { ancho, alto } = { ancho: info.streams?.[0]?.width, alto: info.streams?.[0]?.height };
  const { err } = await ejecutar(FF(), ['-hide_banner', '-i', ruta, '-an', '-vf', `scale=320:-2,select='gt(scene\\,${umbral})',showinfo`, '-f', 'null', '-']);
  const serie = await serieLuma(ruta);
  const tramos = planos([...leerCortes(err), ...cortesPorNegro(serie)], duracion).slice(0, maxEscenas);
  const dir = mkdtempSync(join(tmpdir(), 'desglose-'));
  const porEscena = [];
  let conIA = 0, fallos = 0;
  try {
    for (const [i, [a, b]] of tramos.entries()) {
      const datos = {};
      // fundido de entrada: el arranque del plano es mucho más oscuro que su centro
      const [ya, ym] = [lumaEn(serie, a + 0.05), lumaEn(serie, Math.min(a + 1, (a + b) / 2))];
      datos.fundido_entrada = ya != null && ym != null && ym > 25 && ya < ym * 0.35;
      if (vision) {
        const jpg = join(dir, `e${i}.jpg`);
        await ejecutar(FF(), ['-v', 'error', '-ss', String((a + b) / 2), '-i', ruta, '-frames:v', '1', '-vf', 'scale=512:-2', '-q:v', '4', jpg]);
        try { Object.assign(datos, await vision(jpg, { inicio: a, fin: b })); conIA++; } catch { fallos++; }
      }
      porEscena.push(datos);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const metodo = conIA ? (fallos ? `ia-parcial (${fallos} escenas sin IA)` : 'ia') : 'sin-ia';
  return armarDesglose({ fuente: ruta.split('/').pop(), duracion, ancho, alto, tramos, porEscena, metodo });
}

const Y_TEXTO = { arriba: 0.2, centro: 0.5, abajo: 0.8 };

/** Desglose → receta de estilo: una plantilla por escena, en orden, con su duración (para imitar el ritmo). */
export function desgloseAReceta(d, { id = 'imitado', nombre = 'Imitado', descripcion, prompt, categoria } = {}) {
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  const sinIA = d.metodo === 'sin-ia'; // sin IA no se sabe si había texto: se conserva el del guion
  const escenas_plantilla = d.escenas.map((e) => {
    const capas = sinIA || e.texto || e.rol !== 'cuerpo' || e.efecto === 'texto-animado'
      ? [{ id: 'principal', tipo: 'texto', texto: '{texto}', y: Y_TEXTO[e.posicion_texto] ?? (e.rol === 'gancho' ? 0.5 : 0.8), tam: e.rol === 'gancho' ? 0.06 : 0.048 }] : [];
    const estilos = [];
    if (e.efecto === 'zoom-in') estilos.push({ tipo: 'zoom', desde: 1, hasta: 1.12, x: 0.5, y: 0.45 });
    if (e.efecto === 'zoom-out') estilos.push({ tipo: 'zoom', desde: 1.12, hasta: 1, x: 0.5, y: 0.45 });
    if (e.fundido_entrada) estilos.push({ tipo: 'transicion', entrada: 'fundido', duracion: 0.4 });
    if (capas.length) estilos.push({ tipo: 'animacion-texto', capa: 'principal', animacion: e.efecto === 'texto-animado' ? 'subir' : 'aparecer' });
    const que = [e.plano, e.texto ? `texto «${e.texto.slice(0, 40)}»` : null, e.efecto && e.efecto !== 'ninguno' ? e.efecto : null, e.fundido_entrada ? 'entra con fundido' : null].filter(Boolean).join(' · ');
    return { rol: e.rol, duracion: e.duracion, capas, estilos, referencia: `${fmt(e.inicio)}–${fmt(e.fin)} · ${e.duracion.toFixed(1)} s${que ? ` · ${que}` : ''}` };
  });
  return {
    id, nombre, categoria: categoria ?? (d.duracion <= 90 ? 'cortos' : 'largos'), formato: d.formato ?? undefined,
    descripcion: descripcion ?? `${d.escenas.length} escenas, ritmo ${d.ritmo.lectura} (${d.ritmo.duracion_media.toFixed(1)} s por escena).`,
    prompt: prompt ?? `Edita este video imitando el desglose de ${d.fuente}: mismo orden de escenas, mismo ritmo y los mismos recursos visuales.`,
    ejemplo: { textos: d.escenas.map((e) => e.texto ?? (e.rol === 'gancho' ? 'Gancho' : e.rol === 'cierre' ? 'Cierre' : 'Escena')) },
    escenas_plantilla,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [ruta, ...op] = process.argv.slice(2);
  if (!ruta) { console.error('uso: node desglose.mjs video.mp4 [--receta]'); process.exit(2); }
  const d = await desglosar(ruta);
  console.log(JSON.stringify(op.includes('--receta') ? { desglose: d, receta: desgloseAReceta(d) } : d, null, 2));
}
