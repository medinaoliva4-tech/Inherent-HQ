// La sugerencia sobre la caja del Chat: una tarjeta discreta encima del compositor (ícono, título, una línea de motivo, una
// acción principal y «Ahora no»). Solo propone: la acción corre por el registro de llm/acciones-os.js cuando la persona hace
// clic, y nada es irreversible. «Ahora no» se recuerda por persona y vuelve solo si cambia lo que la motivó (su huella).
// De dónde salen: el motor de Avisos (avisos-reglas/*). Una regla emite { …aviso, sugerencia: { titulo, linea, acciones } } y el
// Chat la muestra si la persona no la descartó (ver avisos-reglas/sugerencias.js · pr-imprimir-hoja). Otro módulo puede
// proponer una con sugerir().
// Puro hasta «Navegador» (lo prueba scripts/test-openui.mjs).
import { validarAccion } from './llm/acciones-os.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const corta = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const ICONOS = ['printer', 'spark', 'file-text', 'calendar', 'check', 'clipboard'];

// → { id, titulo, linea, icono, huella, acciones: [{ label, nombre, args }] (1 o 2) } o null si no hay nada que proponer.
export function normalizarSugerencia(s) {
  if (!s || typeof s !== 'object') return null;
  const id = corta(s.id, 160), titulo = corta(s.titulo, 120);
  if (!id || !titulo) return null;
  const acciones = (Array.isArray(s.acciones) ? s.acciones : []).map((a) => {
    const v = validarAccion(a?.accion, a?.args); return v ? { label: corta(a.label, 40) || 'Abrir', ...v } : null;
  }).filter(Boolean).slice(0, 2);
  if (!acciones.length) return null; // una sugerencia sin acción posible no se muestra
  return { id, titulo, linea: corta(s.linea, 200), icono: ICONOS.includes(s.icono) ? s.icono : 'spark', huella: corta(s.huella, 200), acciones };
}

// El HTML ya escapado. La primera acción es la principal; «Ahora no» siempre está.
export function sugerenciaHtml(s, icono = (n) => '') {
  const x = normalizarSugerencia(s); if (!x) return '';
  const b = (a, i) => `<button type="button" class="sg-b${i === 0 ? ' sg-pri' : ''}" data-gu-acc="${esc(a.nombre)}" data-gu-args="${esc(JSON.stringify(a.args))}" data-sg-hecho="${esc(x.id)}">${esc(a.label)}</button>`;
  return `<aside class="sg" role="status" aria-label="Sugerencia" data-sg="${esc(x.id)}"><span class="sg-ic" aria-hidden="true">${icono(x.icono)}</span><div class="sg-tx"><b>${esc(x.titulo)}</b>${x.linea ? `<span>${esc(x.linea)}</span>` : ''}</div><div class="sg-acts">${x.acciones.map(b).join('')}<button type="button" class="sg-b sg-no" data-sg-no="${esc(x.id)}">Ahora no</button></div></aside>`;
}

// Las sugerencias de una lista de Avisos (GET /api/avisos), en su orden, sin las descartadas (descartes: { id: huella }).
export function sugerenciasDeAvisos(items, descartes = {}) {
  return (Array.isArray(items) ? items : []).map((a) => (a?.sugerencia ? normalizarSugerencia({ ...a.sugerencia, id: a.clave || a.id || a.sugerencia.id, huella: a.huella ?? a.sugerencia.huella }) : null))
    .filter((s) => s && !(s.id in descartes && descartes[s.id] === s.huella));
}
// Descartar: se guarda la huella; con otra huella (cambió la grabación, la fecha…) vuelve a salir. Tope de 100.
export function descartar(descartes = {}, s) {
  const out = { ...descartes }; delete out[s.id]; out[s.id] = s.huella || '';
  return Object.fromEntries(Object.entries(out).slice(-100));
}

// ---------- Navegador ----------
const K = (email) => `os.sugerencias.${email || ''}`;
const leer = (email) => { try { return JSON.parse(localStorage.getItem(K(email)) || '{}') || {}; } catch { return {}; } };
const guardar = (email, d) => { try { localStorage.setItem(K(email), JSON.stringify(d)); } catch { /* sin memoria vuelve a salir */ } };

// La impresora (lucide «printer») no está en iconos.js: va aquí, con el mismo trazo.
const IMPRESORA = '<svg class="lni" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>';
export const iconoSugerencia = (n, icono) => (n === 'printer' ? IMPRESORA : icono ? icono(n) : '');
let estado = null; // { me, cola: [], icono, obs, quitar }
// La de más arriba de la cola, encima de la caja del Chat (#llm-compw · .lc-w, antes del formulario). El Chat repinta la caja
// cuando quiere; un observador la vuelve a poner sin tocar screens/llm.js.
function pintar() {
  if (!estado) return;
  const caja = document.querySelector('#llm-compw .lc-w'), s = estado.cola[0];
  document.querySelectorAll('.sg[data-sg]').forEach((n) => { if (!s || n.dataset.sg !== s.id || n.parentElement !== caja) n.remove(); });
  if (!caja || !s || caja.querySelector('.sg')) return;
  caja.insertAdjacentHTML('afterbegin', sugerenciaHtml(s, estado.icono));
}
// Propone una sugerencia (de una regla o de otro módulo). No corre nada: solo la pone en la cola.
export function sugerir(s) {
  const x = normalizarSugerencia(s); if (!x || !estado) return false;
  if (x.id in leer(estado.me?.email) && leer(estado.me?.email)[x.id] === x.huella) return false;
  estado.cola = [x, ...estado.cola.filter((y) => y.id !== x.id)].slice(0, 5); pintar(); return true;
}
export async function montarSugerencias(me, { api, icono } = {}) {
  if (estado || typeof document === 'undefined' || !me || me.role === 'client') return () => {};
  estado = { me, cola: [], icono: (n) => iconoSugerencia(n, icono) };
  const quitarDe = (id, hecho) => {
    const s = estado.cola.find((x) => x.id === id);
    if (s && !hecho) guardar(me.email, descartar(leer(me.email), s)); // «Ahora no»: se recuerda
    if (s && hecho) guardar(me.email, descartar(leer(me.email), s)); // la usó: tampoco vuelve con la misma huella
    estado.cola = estado.cola.filter((x) => x.id !== id); pintar();
  };
  const clic = (e) => {
    const no = e.target.closest?.('[data-sg-no]'); if (no) return quitarDe(no.dataset.sgNo, false);
    const si = e.target.closest?.('[data-sg-hecho]'); if (si) setTimeout(() => quitarDe(si.dataset.sgHecho, true), 0); // la acción la corre acciones-os.js
  };
  document.addEventListener('click', clic);
  const obs = new MutationObserver(() => { if (location.hash.startsWith('#/chat')) pintar(); });
  obs.observe(document.body, { childList: true, subtree: true });
  async function traer() {
    if (!api || !location.hash.startsWith('#/chat')) return;
    try { const r = await api('avisos'); const xs = sugerenciasDeAvisos(r.items, leer(me.email)); estado.cola = [...xs, ...estado.cola.filter((y) => !xs.some((x) => x.id === y.id))].slice(0, 5); pintar(); } catch { /* sin avisos no hay sugerencias */ }
  }
  const alCambiar = () => { if (location.hash.startsWith('#/chat')) traer(); };
  window.addEventListener('hashchange', alCambiar);
  const timer = setInterval(traer, 5 * 60e3);
  traer();
  return () => { obs.disconnect(); clearInterval(timer); window.removeEventListener('hashchange', alCambiar); document.removeEventListener('click', clic); document.querySelectorAll('.sg').forEach((n) => n.remove()); estado = null; };
}
