// Agent Area · piezas compartidas: la tabla de agentes (la usan el Agent Area y la pestaña Agents de cada área), crear un
// agente (desde una plantilla del método o en blanco) y empezar un trabajo. Un AGENTE es quien trabaja (tiene su workflow,
// su IA y sus conexiones); un TRABAJO es un encargo concreto que el agente hace, etapa por etapa, con tu aprobación.
import { html, raw, mount, acts, ico, skel, toast, api, ask } from './core.js';
import { AREAS_AGENTE, ESTADOS_AGENTE, tipoDe } from './agentes-flujos.js';
import { cargarContexto } from './contexto.js';

export const areaNombre = (id) => AREAS_AGENTE.find(([k]) => k === id)?.[1] || 'Strategy';
const COLOR_AREA = { strategy: '--ui-m-strategy', marketing: '--ui-m-marketing', creative: '--ui-m-creative', consulting: '--ui-m-consulting', production: '--ui-m-production' };
export const colorArea = (id) => COLOR_AREA[id] || '--ui-m-strategy';
export const chipEstado = (e) => html`<span class="agx-est ${e}">${ESTADOS_AGENTE.find(([k]) => k === e)?.[1] || e}</span>`;
export const rutaAgente = (id, tab = '') => `#/ai/agentes/${id}${tab ? '/' + tab : ''}`;
export const rutaTrabajo = (agente, id) => `#/ai/agentes/${agente}/trabajos/${id}`;
const hace = (iso) => {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`;
};
export const cadena = (etapas) => html`<span class="ag-chain">${etapas.map((e, i) => html`${i ? html`<i></i>` : ''}<span class="ag-chain-n" style="--c:var(${tipoDe(e.tipo).color})" title="${e.nombre} · ${tipoDe(e.tipo).nombre}${e.gate ? ' · 🚦' : ''}">${ico(tipoDe(e.tipo).icono, 11)}</span>`)}</span>`;

// La tabla de agentes, al estilo de una lista de automatizaciones. opts.area fija el área (pestaña Agents de un área).
export async function pintarAgentes(el, me, alive, { area = '', titulo = 'Agentes', sub = '', cabecera = true } = {}) {
  if (cabecera) mount(el, skel('pagina'));
  const box = cabecera ? el : el;
  const [{ items, editor }, { items: trabajos }] = await Promise.all([api('agentes/workflows' + (area ? `?area=${area}` : '')), api('agentes/runs')]);
  if (!alive()) return;
  const esperan = trabajos.filter((t) => !t.completo && !t.archivado && t.etapas[t.activa]?.estado === 'revision' && (!area || t.flujo.area === area));
  const f = { q: '', area, estado: '' };

  const filas = () => items.filter((a) => (!f.area || a.area === f.area) && (!f.estado || a.estado === f.estado) && (!f.q || `${a.nombre} ${a.descripcion}`.toLowerCase().includes(f.q.toLowerCase())));
  const pinta = () => {
    const xs = filas();
    mount(box, html`
      ${cabecera ? html`<div class="agx-hero"><h1>${titulo}</h1><p class="mut">${sub || 'Un agente es su flujo de trabajo (etapas, IA y conexiones). Un trabajo o run es un encargo concreto que hace, etapa por etapa, con tu aprobación.'}</p></div>` : ''}
      ${esperan.length ? html`<div class="agx-espera card"><b>${ico('triangle-alert', 14)} ${esperan.length} trabajo${esperan.length === 1 ? '' : 's'} esperando tu aprobación</b>${esperan.slice(0, 4).map((t) => html`<a href="${rutaTrabajo(t.flujo.id, t.id)}">${t.titulo} <span class="mut">· ${t.flujo.nombre} · ${t.etapas[t.activa].nombre}</span></a>`)}</div>` : ''}
      <div class="agx-bar">
        ${area ? '' : html`<select class="in sm" data-f="area" aria-label="Área"><option value="">Todas las áreas</option>${AREAS_AGENTE.map(([k, n]) => html`<option value="${k}" ${f.area === k ? raw('selected') : ''}>${n}</option>`)}</select>`}
        <select class="in sm" data-f="estado" aria-label="Estado"><option value="">Todos los estados</option>${ESTADOS_AGENTE.map(([k, n]) => html`<option value="${k}" ${f.estado === k ? raw('selected') : ''}>${n}</option>`)}</select>
        <label class="agx-q">${ico('search', 14)}<input class="in sm" data-f="q" type="search" placeholder="Buscar" value="${f.q}"></label>
        ${editor ? html`<button class="btn sm" data-act="crear">${ico('plus', 14)} Crear agente</button>` : ''}
      </div>
      <div class="agx-tabla card" role="table">
        <div class="agx-tr agx-th" role="row"><span>Agente</span><span>Qué hace</span>${area ? '' : html`<span>Área</span>`}<span>Estado</span><span>En curso</span><span>Completados</span><span>Última edición</span></div>
        ${xs.map((a) => html`<a class="agx-tr" role="row" href="${rutaAgente(a.id)}">
          <span class="agx-nom"><span class="agx-av" style="--c:var(${colorArea(a.area)})">${ico('agents', 14)}</span><b>${a.nombre}</b></span>
          <span class="agx-desc">${a.objetivo || a.descripcion || '—'}</span>
          ${area ? '' : html`<span><span class="agx-area" style="--c:var(${colorArea(a.area)})">${areaNombre(a.area)}</span></span>`}
          <span>${chipEstado(a.estado)}</span>
          <span><b>${a.trabajos.en_curso}</b> <span class="mut">trabajos</span>${a.trabajos.esperando ? html` <span class="agx-dot" title="${a.trabajos.esperando} esperando aprobación"></span>` : ''}</span>
          <span><b>${a.trabajos.completos}</b> <span class="mut">trabajos</span></span>
          <span class="mut">${hace(a.actualizado)}</span></a>`)}
        ${xs.length ? '' : html`<div class="agx-vacio mut">${items.length ? 'Ningún agente con esos filtros.' : editor ? 'Todavía no hay agentes en esta área. Crea uno.' : 'Todavía no hay agentes.'}</div>`}
      </div>
      <p class="mut sm">Mostrando ${xs.length} de ${items.length} agentes</p>`);
  };
  acts(box, { crear: () => crearAgente(me, { area: f.area || area }) });
  box.addEventListener('input', (ev) => { const k = ev.target.dataset.f; if (!k) return; f[k] = ev.target.value; if (k === 'q') { const pos = ev.target.selectionStart; pinta(); const i = box.querySelector('[data-f=q]'); i?.focus(); i?.setSelectionRange(pos, pos); } else pinta(); });
  pinta();
}

// Crear un agente: desde un método (plantilla del repo o del PDF, se copia y queda independiente) o en blanco.
export async function crearAgente(me, { area = '' } = {}) {
  const { plantillas } = await api('agentes/plantillas');
  const v = await ask('Crear agente', [
    { k: 'desde', l: 'Empezar desde', t: 'select', v: '', opts: [['', 'En blanco'], ...plantillas.filter((p) => p.etapas.length).map((p) => [p.id, `Método · ${p.nombre} (${p.etapas.length} etapas)`])] },
    { k: 'nombre', l: 'Nombre (si es en blanco)', ph: 'Ej.: Auditor de marca' },
    { k: 'area', l: 'Área', t: 'select', v: area || 'strategy', opts: AREAS_AGENTE },
  ], 'Crear');
  if (!v) return;
  try {
    const { workflow } = await api('agentes/workflows', { method: 'POST', body: v.desde ? { plantilla: v.desde, area: v.area } : { nombre: v.nombre || 'Agente nuevo', area: v.area } });
    location.hash = rutaAgente(workflow.id, 'workflow');
  } catch (e) { toast(e.message, true); }
}

// Empezar un trabajo con un agente.
export async function nuevoTrabajo(me, agente) {
  const ctx = await cargarContexto(me).catch(() => []);
  const clientes = [['', 'Sin cliente (Inherent)'], ...ctx.filter((c) => c.slug && c.slug !== 'inherent').map((c) => [c.slug, c.name])];
  const v = await ask(`Nuevo trabajo · ${agente.nombre}`, [
    { k: 'titulo', l: 'Qué le encargas', ph: 'Ej.: Estrategia de crecimiento Q1', req: true },
    { k: 'objetivo', l: 'Objetivo', t: 'textarea', ph: '¿Qué tiene que lograr?' },
    { k: 'cliente', l: 'Cliente', t: 'select', opts: clientes },
  ], 'Empezar');
  if (!v) return;
  try {
    const { run } = await api('agentes/runs', { method: 'POST', body: { ...v, workflow: agente.id, cliente_nombre: ctx.find((c) => c.slug === v.cliente)?.name || '' } });
    location.hash = rutaTrabajo(agente.id, run.id);
  } catch (e) { toast(e.message, true); }
}
