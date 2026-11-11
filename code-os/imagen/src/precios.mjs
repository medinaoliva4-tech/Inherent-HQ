// Estimador de costo. Regla de la skill gd-assets: sin precio leído no se estima.
import { readFileSync } from 'node:fs';

export const TABLA = JSON.parse(readFileSync(new URL('./precios.json', import.meta.url), 'utf8'));

export const parseTamano = (s) => { const m = /^(\d+)x(\d+)$/.exec(String(s)); if (!m) throw new Error(`tamaño inválido: ${s} (use ANCHOxALTO)`); return [Number(m[1]), Number(m[2])]; };

/** Devuelve { usd, aproximado, fuente } o { usd: null, motivo }. `precioUsd` fuerza el precio por imagen. */
export function precioPorImagen({ modelo, calidad = 'medium', tamano = '1024x1024', precioUsd, tabla = TABLA }) {
  if (typeof precioUsd === 'number') return { usd: precioUsd, aproximado: false, fuente: 'precio dado por la persona' };
  const m = tabla.modelos[modelo];
  if (!m) return { usd: null, motivo: `modelo ${modelo} sin precio leído` };
  if (m.por_imagen_fija !== undefined) return { usd: m.por_imagen_fija, aproximado: false, fuente: m.verificado };
  const [w, h] = parseTamano(tamano); const px = w * h;
  if (m.por_imagen_1024) {
    const base = m.por_imagen_1024[calidad];
    if (base === undefined) return { usd: null, motivo: `${modelo} sin precio leído para calidad "${calidad}"` };
    const aprox = px !== 1024 * 1024;
    return { usd: +(base * (aprox ? px / (1024 * 1024) : 1)).toFixed(5), aproximado: aprox, fuente: m.verificado + (aprox ? ' (escalado por píxeles, aproximado)' : '') };
  }
  if (m.por_imagen_resolucion) {
    const lado = Math.max(w, h); const nivel = lado <= 1024 ? '1K' : lado <= 2048 ? '2K' : '4K';
    const v = m.por_imagen_resolucion[nivel];
    if (v === undefined) return { usd: null, motivo: `${modelo} sin precio para ${nivel}` };
    return { usd: v, aproximado: false, fuente: `${m.verificado} (${nivel})` };
  }
  return { usd: null, motivo: 'sin tarifa' };
}

/** Costo real desde `usage` de OpenAI (tokens). null si no hay usage o tarifas. */
export function costoReal({ modelo, usage, tabla = TABLA }) {
  const t = tabla.modelos[modelo]?.tokens_usd_por_millon;
  if (!t || !usage) return null;
  const det = usage.input_tokens_details ?? {};
  const imgIn = det.image_tokens ?? 0; const txtIn = det.text_tokens ?? Math.max(0, (usage.input_tokens ?? 0) - imgIn);
  const out = usage.output_tokens ?? 0;
  if (!out && !imgIn && !txtIn) return null;
  return +((txtIn * t.texto_in + imgIn * t.imagen_in + out * t.imagen_out) / 1e6).toFixed(6);
}

export function estimarLote({ modelo, calidad, tamano, cantidad = 1, precioUsd }) {
  const p = precioPorImagen({ modelo, calidad, tamano, precioUsd });
  if (p.usd === null) return { ok: false, motivo: p.motivo, modelo, cantidad };
  return { ok: true, modelo, calidad, tamano, cantidad, por_imagen_usd: p.usd, total_usd: +(p.usd * cantidad).toFixed(5), aproximado: p.aproximado, fuente: p.fuente, leido: TABLA.leido };
}
