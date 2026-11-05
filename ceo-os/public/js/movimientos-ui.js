// La Hoja de Movimientos en pantalla: una tabla simple por cliente y área.
import { html, mount, col, ask, ico, toast, fdate, $ } from './core.js';
import { cargarContexto, contextoLista, nombreContexto } from './contexto.js';
import { AREAS_MOV, DECISIONES, limpiarMovimiento, errorMovimiento, filtrarMovimientos, resumenMovimientos } from './movimientos-datos.js';

const C = col('movimientos');
const q = (n) => `Q${Number(n || 0).toLocaleString('es-GT')}`;
const hoy = () => new Date().toISOString().slice(0, 10);

export async function pintarMovimientos(el, { me, area = '', cliente = '', alive = () => true }) {
  let filas = [], f = { cliente };
  await cargarContexto(me).catch(() => {});
  const clientes = () => contextoLista().filter((c) => c.slug);
  const form = (m = {}) => [
    { k: 'titulo', l: 'Qué se hizo', req: true, v: m.titulo || '' },
    ...(cliente ? [] : [{ k: 'client_slug', l: 'Cliente', t: 'select', req: true, v: m.client_slug || f.cliente, opts: clientes().map((c) => [c.slug, c.name]) }]),
    ...(area ? [] : [{ k: 'area', l: 'Área', t: 'select', v: m.area || 'strategy', opts: AREAS_MOV }]),
    { k: 'costo', l: 'Costo en quetzales', half: true, v: m.costo || '' }, { k: 'fecha', l: 'Fecha', t: 'date', half: true, v: m.fecha || hoy() },
    { k: 'espera', l: 'Qué esperamos', req: true, v: m.espera || '' }, { k: 'paso', l: 'Qué pasó', v: m.paso || '' },
    { k: 'decision', l: 'Decisión', t: 'select', v: m.decision || 'Pendiente', opts: DECISIONES.map((d) => [d, d]) },
  ];
  const guardar = async (v, prev) => {
    const m = limpiarMovimiento({ ...prev, ...v, area: area || v.area, client_slug: cliente || v.client_slug });
    const e = errorMovimiento(m); if (e) return toast(e, true);
    try { if (prev) await C.save({ ...prev, ...m }); else await C.create(m); await cargar(); } catch (er) { toast(er.message, true); }
  };
  function pintar() {
    if (!alive()) return;
    const xs = filtrarMovimientos(filas, { area, cliente: cliente || f.cliente }), r = resumenMovimientos(xs);
    mount(el, html`<div class="mv-bar">
      ${cliente ? '' : html`<select class="in" id="mv-cl" aria-label="Cliente"><option value="">Todos los clientes</option>${clientes().map((c) => html`<option value="${c.slug}" ${c.slug === f.cliente ? 'selected' : ''}>${c.name}</option>`)}</select>`}
      <p>${r.total} ${r.total === 1 ? 'movimiento' : 'movimientos'} · ${q(r.invertido)} invertidos · ${r.sinResultado} sin resultado</p><button class="btn" type="button" data-mv="nuevo">${ico('plus', 14)} Movimiento</button></div>
    ${xs.length ? html`<div class="mv-t"><table><thead><tr><th>Movimiento</th>${cliente ? '' : html`<th>Cliente</th>`}${area ? '' : html`<th>Área</th>`}<th>Costo</th><th>Esperábamos</th><th>Qué pasó</th><th>Decisión</th></tr></thead><tbody>
      ${xs.map((m) => html`<tr tabindex="0" data-mv="abrir" data-id="${m.id}"><td data-t="Movimiento"><b>${m.titulo}</b><small>${m.fecha ? fdate(m.fecha) : ''}</small></td>${cliente ? '' : html`<td data-t="Cliente">${nombreContexto(m.client_slug) || m.client_slug}</td>`}${area ? '' : html`<td data-t="Área">${(AREAS_MOV.find(([k]) => k === m.area) || [, ''])[1]}</td>`}<td data-t="Costo">${q(m.costo)}</td><td data-t="Esperábamos">${m.espera}</td><td data-t="Qué pasó">${m.paso || html`<span class="mv-falta">Falta el resultado</span>`}</td><td data-t="Decisión"><span class="mv-d" data-d="${m.decision}">${m.decision}</span></td></tr>`)}
    </tbody></table></div>` : html`<div class="empty"><b>Todavía no hay movimientos</b>Anota lo que se hace para crecer: qué se hizo, cuánto costó y qué esperan que pase.</div>`}`);
    const s = $('#mv-cl', el); if (s) s.onchange = () => { f.cliente = s.value; pintar(); };
  }
  async function cargar() { filas = await C.list(); pintar(); }
  el.onclick = async (e) => {
    const b = e.target.closest('[data-mv]'); if (!b) return;
    if (b.dataset.mv === 'nuevo') { const v = await ask('Nuevo movimiento', form()); if (v) guardar(v); return; }
    const m = filas.find((x) => x.id === b.dataset.id); if (!m) return;
    const v = await ask('Movimiento', form(m)); if (v) guardar(v, m);
  };
  el.onkeydown = (e) => { if (e.key === 'Enter' && e.target.matches('tr[data-mv]')) e.target.click(); };
  try { await cargar(); } catch (e) { if (alive()) mount(el, html`<div class="empty"><b>No pude abrir los movimientos</b>${e.message}</div>`); }
}
