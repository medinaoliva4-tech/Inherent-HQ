// El panel de la derecha del Inherent LLM: cambia con el modo, como el panel de artifacts de Claude o el de Hermes.
//   Estrategia   → la estrategia en vivo del cliente (la misma de siempre, de solo lectura) y su tablero completo
//   Organización → tu día: lo que vence, los leads sin responder y atajos a Organización
//   Diseño       → el mes de la marca: piezas por estado, lo próximo y los atajos a Ideas, Plan y el chat con Figma
//   Consulting   → el cliente: si su nivel trae Operations OS y Money OS, y los temas para empezar
// Arriba de cada panel, «Cómo trabaja este modo»: el harness a la vista (reglas y criterios de aceptación).
import { html, api, col, ico, fdate, today, esc } from '../core.js';
import { panelViva } from '../estrategia-viva-ui.js';
import { avance } from '../estrategia-viva.js';
import { isWaiting } from '../ventas-flujo.js';
import { HARNESS, modoDe, CONSULTING, alcanceConsulting, encargosDe } from './modos.js';

// Cada modo guarda lo que leyó para no pedirlo en cada turno (se refresca después de cada respuesta).
const cache = new Map();
export const olvidarPanel = (k) => (k ? cache.delete(k) : cache.clear());
async function una(k, fn) { if (!cache.has(k)) cache.set(k, fn().catch((e) => { cache.delete(k); throw e; })); return cache.get(k); }

// Los datos de Estrategia de un cliente (los usa también el contexto del turno).
export const datosEstrategia = (slug) => una(`e:${slug}`, () => api(`estrategia/${encodeURIComponent(slug)}`));

const harnessHtml = (modo) => {
  const m = modoDe(modo), h = HARNESS[m.id];
  return html`<details class="lp-harness"><summary>${ico('target', 13)} Cómo trabaja este modo</summary>
    <p>${h.rol}</p><b>Criterios de aceptación</b><ul>${h.criterios.map((c) => html`<li>${c}</li>`)}</ul>
    <p class="lp-mut">Más las reglas de Inherent (principios, alcance contratado, evidencia o etiqueta) y la identidad de su SOUL.md.</p></details>`;
};
const vacio = (t, p) => html`<div class="lp-vacio"><b>${t}</b><p>${p}</p></div>`;

// → html del panel. o = { me, modo, slug, nombre }
export async function panelDe({ me, modo, slug, nombre }) {
  try {
    if (modo === 'estrategia') return html`${harnessHtml(modo)}${await panelEstrategia(me, slug)}`;
    if (modo === 'diseno') return html`${harnessHtml(modo)}${await panelDiseno(me, slug, nombre)}`;
    if (modo === 'consulting') return html`${harnessHtml(modo)}${await panelConsulting(me, slug)}`;
    return html`${harnessHtml(modo)}${await panelOrganizacion(me)}`;
  } catch (e) { return html`${harnessHtml(modo)}<div class="lp-err">No pude leer el panel: ${e.message}</div>`; }
}

async function panelEstrategia(me, slug) {
  if (!slug) return vacio('Elige un cliente', 'Abajo, junto al modo, elige de quién es la estrategia. El panel muestra la estrategia en vivo mientras la trabajan.');
  const data = await datosEstrategia(slug), v = data.viva || {}, a = avance(v);
  return html`<div class="lp-head"><div><span class="lp-k">Estrategia</span><h3>${data.nombre}</h3><span class="lp-mut">${data.nivel?.nombre || 'Sin ficha de oferta'} · ${a.n} de 5 pasos${data.vivaAprobada ? ' · Aprobada' : ''}</span></div>
      <a class="lp-btn" href="#/estrategia/${esc(slug)}" title="La pantalla de Estrategia de siempre: aprobar, editar la ficha y los documentos">Tablero ↗</a></div>
    ${data.nivel ? '' : html`<div class="lp-warn">Sin ficha de oferta, el agente bloquea a este cliente: el alcance contratado es el techo.</div>`}
    <div class="lp-viva">${panelViva({ v, data, bid: '', editable: false, esCeo: me.role === 'ceo', aprobada: Boolean(data.vivaAprobada) })}</div>`;
}

// El aviso del alcance de Consulting (lo usa también la pantalla de Consulting del Tablero).
export const avisoConsulting = (nivel) => {
  const a = alcanceConsulting(nivel);
  return a === 'sin-ficha' ? html`<div class="lp-warn">Sin ficha de oferta, el agente bloquea a este cliente: el alcance contratado es el techo.</div>`
    : a === 'fuera' ? html`<div class="lp-warn">Operations OS y Money OS son de Growth Partnership. Con ${nivel.nombre}, lo que se proponga va FUERA DEL ALCANCE.</div>`
    : a === 'ficha' ? html`<div class="lp-warn">A la medida: lo que incluye su ficha es el techo.</div>` : '';
};
// Los encargos abiertos de Estrategia para esta área y este cliente: tocarlos los manda al Chat como pedido.
export const pedidoDeEncargo = (t) => `Encargo de Estrategia: ${t.title}.${t.description ? ` ${String(t.description).split('\n\n')[0]}` : ''}`;
const verTareas = (me) => me.areas?.includes('work') || me.areas?.includes('operations');
async function encargosHtml(me, area, slug) {
  if (!verTareas(me)) return '';
  const xs = encargosDe(await col('tasks').list().catch(() => []), area, slug).filter((t) => t.status !== 'Hecha').slice(0, 6);
  return xs.length ? html`<section class="lp-sec"><span class="lp-k">Encargos de Estrategia</span>${xs.map((t) => html`<button type="button" class="lp-row lp-tema" data-a="sugerencia" data-t="${pedidoDeEncargo(t)}"><span class="lp-dot"></span><span class="lp-t">${t.title}</span><small>${t.status || 'Por empezar'}</small></button>`)}</section>` : '';
}
async function panelConsulting(me, slug) {
  if (!slug) return vacio('Elige un cliente', 'Abajo, junto al modo, elige de quién es el consulting. El panel muestra su alcance, los encargos de Estrategia y los temas para empezar.');
  const [data, enc] = await Promise.all([datosEstrategia(slug), encargosHtml(me, 'consulting', slug)]);
  return html`<div class="lp-head"><div><span class="lp-k">Consulting</span><h3>${data.nombre}</h3><span class="lp-mut">${data.nivel?.nombre || 'Sin ficha de oferta'}</span></div><a class="lp-btn" href="#/consulting/${esc(slug)}">Tablero ↗</a></div>
    ${avisoConsulting(data.nivel)}${enc}
    ${CONSULTING.map(([, g, , ts]) => html`<section class="lp-sec"><span class="lp-k">${g}</span>${ts.map(([t, q]) => html`<button type="button" class="lp-row lp-tema" data-a="sugerencia" data-t="${q}"><span class="lp-dot"></span><span class="lp-t">${t}</span></button>`)}</section>`)}`;
}

async function panelOrganizacion(me) {
  const hoy = today(), en7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const [tareas, leads] = await Promise.all([
    me.areas?.includes('work') || me.areas?.includes('home') ? col('tasks').list().catch(() => []) : [],
    me.areas?.includes('sales') ? col('leads').list().catch(() => []) : [],
  ]);
  const mias = tareas.filter((t) => String(t.assignee || '').toLowerCase() === me.email && t.status !== 'Hecha' && t.due && t.due <= en7).sort((a, b) => String(a.due).localeCompare(String(b.due))).slice(0, 8);
  const esperando = leads.filter(isWaiting).slice(0, 6);
  const fila = (t) => html`<a class="lp-row ${t.due < hoy ? 'tarde' : t.due === hoy ? 'hoy' : ''}" href="#/org/work"><span class="lp-dot"></span><span class="lp-t">${t.title || 'Tarea'}</span><small>${t.due < hoy ? 'Vencida' : t.due === hoy ? 'Hoy' : fdate(t.due)}</small></a>`;
  return html`<div class="lp-head"><div><span class="lp-k">Tu día</span><h3>${new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}</h3></div><a class="lp-btn" href="#/org/home">Hoy ↗</a></div>
    ${me.areas?.includes('sales') ? html`<section class="lp-sec"><span class="lp-k">Leads sin responder</span>${esperando.length ? esperando.map((l) => html`<a class="lp-row tarde" href="#/org/sales"><span class="lp-dot"></span><span class="lp-t">${l.name || 'Lead'}</span><small>${l.source || ''}</small></a>`) : html`<p class="lp-mut">Todo respondido.</p>`}</section>` : ''}
    <section class="lp-sec"><span class="lp-k">Tus tareas · próximos 7 días</span>${mias.length ? mias.map(fila) : html`<p class="lp-mut">Nada con fecha esta semana.</p>`}</section>
    <p class="lp-mut">Lo que el agente cree o cambie por el conector aparece aquí y en Organización.</p>`;
}

async function panelDiseno(me, slug, nombre) {
  if (!slug) return vacio('Elige una marca', 'Abajo, junto al modo, elige la marca. El panel muestra sus piezas del mes.');
  const mes = today().slice(0, 7);
  const piezas = (await col('content').list().catch(() => [])).filter((x) => x.profile === slug && x.kind !== 'research' && String(x.date || x.publish_date || '').startsWith(mes));
  const ESTADOS = ['Idea', 'En proceso', 'Listo', 'Publicado'];
  const n = (e) => piezas.filter((x) => (x.status || 'Idea') === e).length;
  const proximas = piezas.filter((x) => !['Publicado', 'Archivado'].includes(x.status)).sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))).slice(0, 6);
  return html`<div class="lp-head"><div><span class="lp-k">Diseño</span><h3>${nombre || slug}</h3><span class="lp-mut">${piezas.length} piezas este mes</span></div><a class="lp-btn" href="#/marcas/${esc(slug)}/ideas">Ideas ↗</a></div>
    <div class="lp-grid">${ESTADOS.map((e) => html`<div class="lp-stat"><b>${n(e)}</b><span>${e}</span></div>`)}</div>
    ${await encargosHtml(me, 'diseno', slug)}
    <section class="lp-sec"><span class="lp-k">Lo próximo</span>${proximas.length ? proximas.map((x) => html`<a class="lp-row" href="#/marcas/${esc(slug)}/ideas"><span class="lp-dot"></span><span class="lp-t">${x.title || 'Pieza'}</span><small>${x.status || 'Idea'}${x.date ? ` · ${fdate(x.date)}` : ''}</small></a>`) : html`<p class="lp-mut">Sin piezas con fecha este mes. Se crean en Ideas (con el plan del mes).</p>`}</section>
    <div class="lp-links"><a href="#/marcas/${esc(slug)}/plan">Plan del mes ↗</a><a href="#/marcas/${esc(slug)}/design">Design system ↗</a><a href="#/marcas/diseno/${esc(slug)}" title="El chat de Diseño de siempre, por el puente: diseña en Figma con Claude Code">Chat con Figma ↗</a></div>`;
}
