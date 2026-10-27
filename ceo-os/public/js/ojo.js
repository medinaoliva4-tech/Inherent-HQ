// El ojo visual: ¿esta imagen se parece a la marca? Lo decide el puente de la compu (127.0.0.1:7357/ver, CLIP) comparando
// con el moodboard y con la descripción de la marca. Solo parecido, nunca calidad ni «bonito».
//   ojoEstado()           → { on, listo, cargando, disponible } (lee /health del puente)
//   verImagen(slug, {url | imagen}) → { parecido 0..1, refs } o null si el ojo no está
//   ojoChip(r)            → el chip «Se ve de la marca · 82%» / «No se parece» / nada
import { html, api, ico } from './core.js';
import { PUENTE } from './laya.js';

let est = { at: 0, v: null }, ctx = {};
const conTiempo = (url, init = {}, ms = 20000) => { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); return fetch(url, { ...init, signal: c.signal, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' }).finally(() => clearTimeout(t)); };

export async function ojoEstado(force = false) {
  if (!force && est.v && Date.now() - est.at < 15000) return est.v;
  let v = { on: false };
  try { const r = await conTiempo(PUENTE + '/health', {}, 3000); if (r.ok) { const j = await r.json(); v = { on: j.status === 'ok', ...(j.ojo || { disponible: false, listo: false }) }; } } catch { /* apagado */ }
  est = { at: Date.now(), v }; return v;
}
// El contexto de la marca (moodboard y descripción), una vez por marca y sesión.
async function contexto(slug) { return ctx[slug] || (ctx[slug] = await api(`ojo/contexto?profile=${encodeURIComponent(slug)}`).catch(() => ({ refs: [], texto: '' }))); }

// { url } (https) o { imagen } (base64, p. ej. una captura de Figma).
export async function verImagen(slug, { url, imagen }) {
  const e = await ojoEstado(); if (!e.on || !e.disponible) return null;
  const c = await contexto(slug);
  const r = await conTiempo(PUENTE + '/ver', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...(url ? { url } : { imagen }), refs: c.refs, texto: c.texto }) }, 60000);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `El ojo respondió ${r.status}`);
  return { parecido: j.parecido, refs: j.refs, at: new Date().toISOString() };
}
export const pct = (x) => `${Math.round(x * 100)}%`;
export const tonoOjo = (p) => (p == null ? '' : p >= 0.6 ? 'ok' : p >= 0.4 ? 'medio' : 'no');
export function ojoChip(r, { compact = false } = {}) {
  if (!r || r.parecido == null) return '';
  const t = tonoOjo(r.parecido), txt = t === 'ok' ? 'Se ve de la marca' : t === 'medio' ? 'Más o menos de la marca' : 'No se parece a la marca';
  return html`<span class="chip ojo-chip ${t}" title="${txt} · ${pct(r.parecido)}${r.refs ? ` · comparada con ${r.refs} ${r.refs === 1 ? 'imagen' : 'imágenes'} del moodboard` : ' · sin moodboard: solo la descripción de la marca'}">${ico('eye', 11)} ${compact ? pct(r.parecido) : `${txt} · ${pct(r.parecido)}`}</span>`;
}
