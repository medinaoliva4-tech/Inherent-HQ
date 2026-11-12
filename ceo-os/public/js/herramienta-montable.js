// El contrato «herramienta montable» (docs/herramienta-montable.md): una misma herramienta se ve en su área (con sus pasos, como
// timeline) y como artefacto en el panel del Chat, con UN solo dato. Las dos vistas leen con leer(slug) y se repintan con el
// mismo evento 'os:dato' { herramienta, slug } (lo emite quien guarda: la herramienta, guardarEnDestino de vacio-chat.js…).
// Las de departamentos viven en code-os/ui y se montan con iframe ?embed=1 (code-os/ui/docs/embebido.md): su dato es del puente.
// Puro hasta «Navegador» (lo prueba scripts/test-openui.mjs).
import { VACIOS } from './vacio-chat.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const CODE_OS = 'https://code.inherentglobal.com';
const ESTADOS = ['hecho', 'ahora', 'pendiente', 'bloqueado'];

// def: { id, nombre, origen: 'os' | 'code-os', pasos: [{ id, nombre }], leer(slug) → Promise<dato>, pasosDe(dato) → { <idPaso>: estado },
//        vacio(dato) → bool, area(dato, ctx) → html, artefacto(dato, ctx) → html }. Lo que falta toma un valor seguro.
export function definirMontable(def = {}) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(String(def.id || ''))) throw new Error('herramienta montable sin id');
  const origen = def.origen === 'code-os' ? 'code-os' : 'os';
  return {
    id: def.id, nombre: String(def.nombre || def.id), origen, pasos: (def.pasos || []).slice(0, 8).map((p) => ({ id: String(p.id), nombre: String(p.nombre || p.id) })),
    leer: def.leer || (async () => null), pasosDe: def.pasosDe || (() => ({})), vacio: def.vacio || ((d) => d == null),
    area: def.area || null, artefacto: def.artefacto || def.area || null, vacioChat: def.vacioChat || null,
  };
}
// Los pasos con su estado, listos para la timeline del área. El primero sin terminar es «ahora».
export function pasosConEstado(m, dato) {
  const e = m.pasosDe(dato) || {}; let ahora = false;
  return m.pasos.map((p) => { let s = ESTADOS.includes(e[p.id]) ? e[p.id] : ''; if (!s) { s = ahora ? 'pendiente' : 'ahora'; ahora = true; } else if (s === 'ahora') ahora = true; return { ...p, estado: s }; });
}
export const timelineHtml = (pasos) => `<ol class="gu-tl">${pasos.map((p) => `<li class="gu-tl-${p.estado}"><i aria-hidden="true"></i><div><b>${esc(p.nombre)}</b><span>${{ hecho: 'Hecho', ahora: 'En curso', pendiente: 'Pendiente', bloqueado: 'Bloqueado' }[p.estado]}</span></div></li>`).join('')}</ol>`;
// La URL del iframe de una herramienta de code-os/ui. herramienta= todavía no lo lee Embebido.tsx (pendiente en el doc).
export function srcEmbebido(id, { base = CODE_OS, slug = '' } = {}) {
  const u = new URL('/', base); u.searchParams.set('embed', '1'); u.searchParams.set('herramienta', id); if (slug) u.searchParams.set('cliente', slug);
  return u.toString();
}
// → el HTML de una vista. modo: 'area' (timeline + la herramienta) o 'artefacto' (compacto, para el panel del Chat).
export function vistaHtml(m, dato, { modo = 'area', slug = '' } = {}) {
  if (m.origen === 'code-os') return `<iframe class="hm-frame" src="${esc(srcEmbebido(m.id, { slug }))}" title="${esc(m.nombre)}" allow="clipboard-write"></iframe>`;
  const cuerpo = (modo === 'area' ? m.area : m.artefacto)?.(dato, { slug }) || '';
  return modo === 'area' ? `<div class="hm hm-area">${m.pasos.length ? timelineHtml(pasosConEstado(m, dato)) : ''}<div class="hm-cuerpo">${cuerpo}</div></div>` : `<div class="hm hm-artefacto"><b class="hm-t">${esc(m.nombre)}</b>${cuerpo}</div>`;
}

// ---------- Navegador ----------
// Monta la herramienta en `el` y la repinta cuando alguien guarda su dato. Sin dato y con vacioChat, monta el vacío conversacional.
export async function montar(el, m, { modo = 'area', slug = '' } = {}) {
  const ctrl = new AbortController();
  async function pintar() {
    const dato = await m.leer(slug).catch(() => null);
    if (m.vacio(dato) && m.vacioChat) { const { vacioChat } = await import('./vacio-chat.js'); return vacioChat(el, { ...m.vacioChat, slug }); }
    el.innerHTML = vistaHtml(m, dato, { modo, slug });
  }
  window.addEventListener('os:dato', (e) => { if (e.detail?.herramienta === m.id && (!slug || e.detail?.slug === slug)) pintar(); }, { signal: ctrl.signal });
  await pintar();
  return () => ctrl.abort();
}

// ---------- El ejemplo real: Referencias de video (Marcas · Referencias por pilar, /api/content/refs) ----------
export const REFERENCIAS_VIDEO = definirMontable({
  id: 'referencias-video', nombre: 'Referencias de video', origen: 'os',
  pasos: [{ id: 'platicar', nombre: 'Platicar qué buscamos' }, { id: 'pegar', nombre: 'Referencias por pilar' }, { id: 'similares', nombre: 'Similares que funcionaron' }, { id: 'desglose', nombre: 'Desglose con Claude' }],
  leer: async (slug) => { const { api } = await import('./core.js'); return api(`content/refs?profile=${encodeURIComponent(slug)}`); },
  vacio: (d) => !d || !Object.values(d.videos || {}).flat().length,
  pasosDe: (d) => {
    const n = Object.values(d?.videos || {}).flat().length, sim = Object.values(d?.result || {}).some((r) => r?.similar?.length), bd = Object.values(d?.breakdown || {}).some((b) => b?.items?.length);
    return { platicar: n ? 'hecho' : '', pegar: n ? 'hecho' : '', similares: sim ? 'hecho' : d?.status === 'running' ? 'ahora' : '', desglose: bd ? 'hecho' : '' };
  },
  area: (d) => `<dl class="gu-kv">${Object.entries(d?.videos || {}).map(([p, xs]) => `<dt>${esc(p)}</dt><dd>${xs.length} de 5</dd>`).join('')}</dl>`,
  vacioChat: VACIOS['referencias-video'],
});
