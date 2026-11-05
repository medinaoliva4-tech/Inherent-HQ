// Agent Area · piezas compartidas: la tabla de agentes (la usan el Agent Area y la pestaña Agents de cada área), crear un
// agente (desde una plantilla del método o en blanco) y empezar un trabajo. Un AGENTE es quien trabaja (tiene su workflow,
// su IA y sus conexiones); un TRABAJO es un encargo concreto que el agente hace, etapa por etapa, con tu aprobación.
import { tablero } from './tablero.js';
import { html, mount, ico, skel, toast, api, ask } from './core.js';
import { AREAS_AGENTE, ESTADOS_AGENTE, tipoDe } from './agentes-flujos.js';
import { abrirEnChat } from './areas.js';
import { modoDeArea } from './agentes-chat-datos.js';

export const areaNombre = (id) => AREAS_AGENTE.find(([k]) => k === id)?.[1] || 'Strategy';
const COLOR_AREA = { strategy: '--ui-m-strategy', marketing: '--ui-m-marketing', creative: '--ui-m-creative', consulting: '--ui-m-consulting', production: '--ui-m-production' };
export const colorArea = (id) => COLOR_AREA[id] || '--ui-m-strategy';
export const chipEstado = (e) => html`<span class="agx-est ${e}">${ESTADOS_AGENTE.find(([k]) => k === e)?.[1] || e}</span>`;
export const rutaAgente = (id, tab = '') => `#/ai/agentes/${id}${tab ? '/' + tab : ''}`;
// F4.5: un trabajo se abre en el Chat, en su pestaña de la ventana de agentes. La vista por etapas queda como historial.
export const rutaTrabajo = (agente, id) => `#/chat/trabajo/${id}`;
export const rutaEtapas = (agente, id) => `#/ai/agentes/${agente}/trabajos/${id}/etapas`;
const hace = (iso) => {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`;
};
// Las etapas de un agente como una fila de puntos de color (uno por etapa, del color de su tipo).
export const cadena = (etapas) => html`<span class="agx-chain" aria-label="${etapas.length} etapas">${etapas.map((e) => html`<i data-tt="${tipoDe(e.tipo).id}" title="${e.nombre} · ${tipoDe(e.tipo).nombre}${e.gate ? ' · aprueba el CEO' : ''}"></i>`)}</span>`;

// La lista de agentes, al estilo de la lista de automatizaciones de Kargul. opts.area fija el área (pestaña Agents de un área).
const pintarTablero = (nodo, trabajos, area) => { nodo.className = 'tb'; nodo.removeAttribute('role'); mount(nodo, html`${tablero(trabajos, { area }).map((c) => html`<section class="tb-c"><h2>${c.nombre}<span>${c.total}</span></h2>${c.trabajos.map((t) => html`<a class="tb-t" href="${rutaTrabajo(t.flujo.id, t.id)}"><b>${t.titulo}</b><span>${t.flujo.nombre}${t.cliente_nombre ? ` · ${t.cliente_nombre}` : ''}</span>${t.completo ? '' : html`<small>${t.etapas[t.activa]?.nombre || ''}</small>`}</a>`)}</section>`)}`); };

export async function pintarAgentes(el, me, alive, { area = '', titulo = 'Agentes', sub = '', cabecera = true } = {}) {
  if (cabecera) mount(el, skel('pagina'));
  const box = el;
  const [{ items, editor }, { items: trabajos }] = await Promise.all([api('agentes/workflows' + (area ? `?area=${area}` : '')), api('agentes/runs')]);
  if (!alive()) return;
  const esperan = trabajos.filter((t) => !t.completo && !t.archivado && t.etapas[t.activa]?.estado === 'revision' && (!area || t.flujo.area === area));
  const f = { q: '', area, estado: '', vista: '' };
  const cuenta = (k, v) => items.filter((a) => a[k] === v).length;

  const filas = () => items.filter((a) => (!f.area || a.area === f.area) && (!f.estado || a.estado === f.estado) && (!f.q || `${a.nombre} ${a.objetivo} ${a.descripcion}`.toLowerCase().includes(f.q.toLowerCase())));
  const chips = (k, opciones, todos) => html`<div class="agx-chips" role="group" aria-label="${k === 'area' ? 'Área' : 'Estado'}">
    <button type="button" data-fk="${k}" data-fv="" class="${f[k] ? '' : 'on'}">${todos}</button>
    ${opciones.filter(([v]) => cuenta(k, v)).map(([v, n]) => html`<button type="button" data-fk="${k}" data-fv="${v}" class="${f[k] === v ? 'on' : ''}">${n}<span>${cuenta(k, v)}</span></button>`)}</div>`;
  const pinta = () => {
    const xs = filas();
    mount(box, html`
      ${cabecera ? html`<div class="agx-hero"><div><h1>${titulo}</h1><p class="mut">${sub || 'Cada agente sigue su flujo de etapas. Le encargas un trabajo y lo hace paso a paso; tú apruebas cada paso.'}</p></div>
        ${editor ? html`<button class="btn" data-act="crear">${ico('plus', 14)} Crear agente</button>` : ''}</div>` : ''}
      ${esperan.length ? html`<div class="agx-espera"><span class="agx-espera-ic">${ico('bell', 15)}</span><div><b>${esperan.length} trabajo${esperan.length === 1 ? '' : 's'} esperando tu aprobación</b>
        <div class="agx-espera-l">${esperan.slice(0, 4).map((t) => html`<a href="${rutaTrabajo(t.flujo.id, t.id)}">${t.titulo}<span> · ${t.flujo.nombre} · ${t.etapas[t.activa].nombre}</span></a>`)}</div></div></div>` : ''}
      <div class="agx-chips agx-vista" role="group" aria-label="Vista"><button type="button" data-fk="vista" data-fv="" class="${f.vista ? '' : 'on'}">Agentes</button><button type="button" data-fk="vista" data-fv="tablero" class="${f.vista ? 'on' : ''}">Tablero</button></div>
      <div class="agx-bar" ${f.vista ? 'hidden' : ''}>
        <label class="agx-q">${ico('search', 15)}<input class="in" data-f="q" type="search" placeholder="Buscar agente" value="${f.q}" aria-label="Buscar agente"></label>
        ${area ? '' : chips('area', AREAS_AGENTE, 'Todas')}
        ${chips('estado', ESTADOS_AGENTE, 'Cualquier estado')}
        ${!cabecera && editor ? html`<button class="btn sm agx-crear" data-act="crear">${ico('plus', 14)} Crear agente</button>` : ''}
      </div>
      <div class="agx-tabla" role="table" aria-label="Agentes">
        <div class="agx-tr agx-th" role="row"><span>Agente</span>${area ? '' : html`<span>Área</span>`}<span>Etapas</span><span>Trabajos</span><span>Estado</span><span>Editado</span></div>
        ${xs.map((a) => html`<a class="agx-tr" role="row" href="${rutaAgente(a.id)}">
          <span class="agx-nom"><span class="agx-av" style="--c:var(${colorArea(a.area)})">${(a.nombre || '?').slice(0, 1)}</span><span><b>${a.nombre}</b><small>${a.objetivo || a.descripcion || 'Sin objetivo todavía'}</small></span></span>
          ${area ? '' : html`<span><span class="agx-area" style="--c:var(${colorArea(a.area)})">${areaNombre(a.area)}</span></span>`}
          <span class="agx-et">${cadena(a.etapas)}<small>${a.etapas.length}</small></span>
          <span class="agx-tr-j">${a.trabajos.esperando ? html`<span class="agx-wait" title="Esperan tu aprobación">${a.trabajos.esperando} por aprobar</span>` : a.trabajos.en_curso ? html`<span>${a.trabajos.en_curso} en curso</span>` : html`<span class="mut">${a.trabajos.completos ? `${a.trabajos.completos} hechos` : '—'}</span>`}</span>
          <span>${chipEstado(a.estado)}</span>
          <span class="mut">${hace(a.actualizado)}</span></a>`)}
        ${xs.length ? '' : html`<div class="agx-vacio mut">${items.length ? 'Ningún agente con esos filtros.' : editor ? 'Todavía no hay agentes aquí. Crea el primero.' : 'Todavía no hay agentes.'}</div>`}
      </div>
      <p class="mut sm agx-pie">${xs.length === items.length ? `${items.length} agentes` : `${xs.length} de ${items.length} agentes`}</p>`);
    if (f.vista) pintarTablero(box.querySelector('.agx-tabla'), trabajos, area);
  };
  box.onclick = (ev) => {
    const b = ev.target.closest('[data-fk],[data-act]'); if (!b || !box.contains(b)) return;
    if (b.dataset.act === 'crear') return crearAgente(me, { area: f.area || area });
    if (b.dataset.fk) { f[b.dataset.fk] = b.dataset.fv; pinta(); }
  };
  box.oninput = (ev) => { if (ev.target.dataset.f !== 'q') return; f.q = ev.target.value; const pos = ev.target.selectionStart; pinta(); const i = box.querySelector('[data-f=q]'); i?.focus(); i?.setSelectionRange(pos, pos); };
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
// F4.5: un trabajo nuevo no se crea aquí: se abre el Chat con «@agente » escrito, para platicar el plan con el contexto de ahí.
export function nuevoTrabajo(me, agente) { abrirEnChat(me.email, { modo: modoDeArea(agente.area), borrador: `@${agente.nombre} ` }); }
