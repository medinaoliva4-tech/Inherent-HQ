// Validación de un PNG generado: tamaño, canal alfa, fondo transparente, halo, paleta aproximada y peso.
import { cabeceraPng, decodificarPng } from './png.mjs';

export const hexARgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h); if (!m) throw new Error(`hex inválido: ${h}`); const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * opciones: { ancho, alto, transparente, paleta:[hex], tolerancia=60, minPaleta=0.8, maxBytes=8MB }
 * Devuelve { ok, checks:[{id, ok, detalle}], medidas }.
 */
export function validarPng(buf, o = {}) {
  const checks = []; const add = (id, ok, detalle) => checks.push({ id, ok, detalle });
  let cab;
  try { cab = cabeceraPng(buf); } catch (e) { return { ok: false, checks: [{ id: 'png', ok: false, detalle: e.message }], medidas: {} }; }
  add('png', true, `${cab.ancho}x${cab.alto}`);
  const maxBytes = o.maxBytes ?? 8 * 1024 * 1024;
  add('peso', buf.length <= maxBytes, `${buf.length} bytes (tope ${maxBytes})`);
  if (o.ancho && o.alto) add('tamano', cab.ancho === o.ancho && cab.alto === o.alto, `${cab.ancho}x${cab.alto}, pedido ${o.ancho}x${o.alto}`);
  const medidas = { ancho: cab.ancho, alto: cab.alto, bytes: buf.length, canalAlfa: cab.canalAlfa };
  let img;
  try { img = decodificarPng(buf); } catch (e) { add('decodificar', false, e.message); return { ok: false, checks, medidas }; }
  const { rgba } = img; const W = img.ancho; const H = img.alto; const N = W * H;

  const A = (i) => rgba[i * 4 + 3];
  let transp = 0; let semi = 0;
  for (let i = 0; i < N; i++) { const a = A(i); if (a === 0) transp++; else if (a < 255) semi++; }
  medidas.transparentePct = +(transp / N).toFixed(4);

  if (o.transparente) {
    add('canal_alfa', cab.canalAlfa, cab.canalAlfa ? 'tiene canal alfa' : 'NO tiene canal alfa (fondo opaco)');
    // Esquinas y borde: un recorte limpio deja transparentes casi todas las esquinas y buena parte del contorno.
    const esq = [0, W - 1, (H - 1) * W, N - 1].filter((i) => A(i) === 0).length;
    add('esquinas_transparentes', esq >= 3, `${esq}/4 esquinas transparentes`);
    add('fondo_transparente', transp / N >= 0.05, `${(100 * transp / N).toFixed(1)} % de píxeles transparentes (mín. 5 %)`);
    // Halo: píxeles de borde (alfa parcial o pegados a transparente) casi blancos cuando el objeto NO es claro.
    let borde = 0; let claros = 0; let lumSum = 0; let lumN = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x; const a = A(i); if (a === 0) continue;
      if (a === 255) { if (!(y % 3) && !(x % 3)) { lumSum += (rgba[i * 4] + rgba[i * 4 + 1] + rgba[i * 4 + 2]) / 3; lumN++; } }
      const vecinoTransp = A(i - 1) === 0 || A(i + 1) === 0 || A(i - W) === 0 || A(i + W) === 0;
      if (a < 255 || vecinoTransp) { borde++; if (Math.min(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]) >= 225) claros++; }
    }
    const lumInterior = lumN ? lumSum / lumN : 0;
    const fracHalo = borde ? claros / borde : 0;
    medidas.borde = borde; medidas.fracBordeClaro = +fracHalo.toFixed(3); medidas.lumInterior = Math.round(lumInterior);
    add('sin_halo', !(borde > 20 && fracHalo > 0.3 && lumInterior < 200), `${(100 * fracHalo).toFixed(0)} % del borde es casi blanco (interior luma ${Math.round(lumInterior)})`);
    if (borde === 0 && semi === 0 && transp > 0) add('suavizado', true, 'borde duro sin semitransparencia (sin halo posible)');
  }

  if (o.paleta?.length) {
    const pal = o.paleta.map(hexARgb); const tol = o.tolerancia ?? 60; let dentro = 0; let total = 0; const paso = Math.max(1, Math.floor(Math.sqrt(N / 40000)));
    const lejanos = new Map();
    for (let y = 0; y < H; y += paso) for (let x = 0; x < W; x += paso) {
      const i = y * W + x; if (A(i) < 128) continue; total++;
      const c = [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]]; const d = Math.min(...pal.map((p) => dist(c, p)));
      if (d <= tol) dentro++; else { const k = c.map((v) => Math.round(v / 32) * 32).join(','); lejanos.set(k, (lejanos.get(k) ?? 0) + 1); }
    }
    const frac = total ? dentro / total : 0; const min = o.minPaleta ?? 0.8;
    medidas.paletaPct = +frac.toFixed(3);
    medidas.fueraDePaleta = [...lejanos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => ({ rgb: k, pct: +(n / (total || 1)).toFixed(3) }));
    add('paleta', frac >= min, `${(100 * frac).toFixed(0)} % de los píxeles opacos a ≤${tol} de la paleta (mín. ${(100 * min).toFixed(0)} %)`);
  }
  return { ok: checks.every((c) => c.ok), checks, medidas };
}
