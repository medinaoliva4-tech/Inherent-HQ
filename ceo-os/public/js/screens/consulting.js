// Consulting (#/consulting · #/consulting/<cliente>): el backend de un cliente. Lo útil para organizar sus operaciones, sus
// finanzas y su equipo (Operations OS y Money OS, inherent/02-METODO.md), y los encargos que le manda Estrategia (por
// ejemplo, «Crear el BMC de la empresa»): cada encargo es una tarea con su área y su cliente, y se trabaja en el Chat.
// Lo ve quien ve Estrategia (lo lleva el CEO con Strategy). Las finanzas de Inherent viven en Organización → Finanzas.
import { html, mount, col, toast, ico, fdate, esc, initials, skel } from '../core.js';
import { loadEstrategia, estrategiaNow } from '../stratlist.js';
import { datosEstrategia, avisoConsulting, pedidoDeEncargo } from '../llm/paneles.js';
import { CONSULTING, alcanceConsulting, encargosDe } from '../llm/modos.js';
import { abrirEnChat } from '../areas.js';

export const esqueleto = () => skel('pagina');
const ALCANCE = { si: ['Growth Partnership', 'ok'], ficha: ['A la medida', ''], fuera: ['Fuera del alcance', 'fuera'], 'sin-ficha': ['Sin ficha', 'fuera'] };
const verTareas = (me) => me.areas?.includes('work') || me.areas?.includes('operations');

// Abre el Chat en modo Consulting con este cliente y el pedido escrito en la caja (se manda cuando la persona quiere).
const alChat = (me, slug, pedido) => abrirEnChat(me.email, { modo: 'consulting', slug, borrador: pedido });

export async function render(el, { me, sub = [], alive }) {
  const slug = sub[0] ? decodeURIComponent(sub[0]) : '';
  const [, tareas] = await Promise.all([loadEstrategia(), verTareas(me) ? col('tasks').list().catch(() => []) : []]);
  if (!alive()) return;
  if (!slug) return lista(el, me, tareas);
  const c = estrategiaNow().find((x) => x.slug === slug);
  if (!c) return mount(el, html`<div class="cs"><a class="btn ghost sm" href="#/consulting">${ico('arrow-left', 14)} Todos los clientes</a><div class="empty">No encontré ese cliente.</div></div>`);
  const data = await datosEstrategia(slug).catch(() => ({ nombre: c.nombre, nivel: c.nivel }));
  if (!alive()) return;
  let enc = encargosDe(tareas, 'consulting', slug);

  const encargoHtml = (t) => html`<div class="cs-enc ${t.status === 'Hecha' ? 'hecho' : ''}"><span class="cs-enc-i">${ico(t.status === 'Hecha' ? 'check' : 'send', 14)}</span>
    <div class="cs-enc-t"><b>${t.title}</b><small>${t.status || 'Por empezar'}${t.due ? ` · vence ${fdate(t.due)}` : ''}${t.description ? ` · ${String(t.description).split('\n\n')[0]}` : ''}</small></div>
    ${t.status === 'Hecha' ? '' : html`<button type="button" class="btn sm" data-c="hacer" data-id="${t.id}">${ico('chat-ia', 14)} Hacerlo en el Chat</button><button type="button" class="btn ghost sm" data-c="hecha" data-id="${t.id}">Hecha</button>`}</div>`;
  const pintar = () => mount(el, html`<div class="cs">
    <a class="btn ghost sm" href="#/consulting">${ico('arrow-left', 14)} Todos los clientes</a>
    <header class="cs-head"><span class="cs-mono">${initials(data.nombre || c.nombre)}</span><div><h1>${data.nombre || c.nombre}</h1><p>${data.nivel?.nombre || 'Sin ficha de oferta'} · operaciones, finanzas y equipo</p></div>
      <a class="btn ghost sm" href="#/estrategia/${esc(slug)}">${ico('target', 14)} Su estrategia</a></header>
    ${avisoConsulting(data.nivel)}
    <section class="cs-sec"><div class="cs-sec-h"><h2>Encargos de Estrategia</h2><span class="mut sm">Lo que la estrategia pide que se haga aquí</span></div>
      ${!verTareas(me) ? html`<p class="mut sm">Tu perfil no ve las tareas: los encargos los ves en el Chat.</p>` : enc.length ? html`<div class="cs-encs">${enc.map(encargoHtml)}</div>`
      : html`<div class="cs-vacio">${ico('send', 16)}<span>Cuando Estrategia mande algo (por ejemplo, «Crear el BMC de la empresa»), aparece aquí y en Mis tareas.</span></div>`}</section>
    <div class="cs-grid">${CONSULTING.map(([id, g, ic, ts]) => html`<section class="cs-card" data-g="${id}"><h3>${ico(ic, 16)} ${g}</h3>
      ${ts.map(([t, q]) => html`<button type="button" class="cs-tema" data-c="tema" data-q="${q}"><span>${t}</span>${ico('right', 14)}</button>`)}</section>`)}</div>
    <p class="mut sm cs-pie">Cada tema abre el Chat en modo Consulting con este cliente. Si vas a pegar números del cliente, elige la IA de tu compu (privado).</p></div>`);
  pintar();

  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    if (b.dataset.c === 'tema') return alChat(me, slug, b.dataset.q);
    const t = enc.find((x) => x.id === b.dataset.id); if (!t) return;
    if (b.dataset.c === 'hacer') return alChat(me, slug, pedidoDeEncargo(t));
    if (b.dataset.c === 'hecha') {
      try { const n = await col('tasks').save({ ...t, status: 'Hecha' }); enc = encargosDe(enc.map((x) => (x.id === t.id ? { ...t, ...n, status: 'Hecha' } : x)), 'consulting', slug); toast('Encargo hecho'); pintar(); }
      catch (er) { toast(er.status === 403 ? 'Tu perfil no puede cambiar tareas' : er.message, true); }
    }
  });
}

// Todos los clientes: su nivel (si trae Operations OS y Money OS) y cuántos encargos tiene abiertos.
function lista(el, me, tareas) {
  const cs = estrategiaNow();
  mount(el, html`<div class="cs">
    <header class="cs-head"><div><h1>Consulting</h1><p>El backend de cada cliente: <em>sus operaciones, sus finanzas y su equipo</em>.</p></div></header>
    ${cs.length ? html`<div class="cs-clientes">${cs.map((c) => {
      const [l, cls] = ALCANCE[alcanceConsulting(c.nivel)], n = encargosDe(tareas, 'consulting', c.slug).filter((t) => t.status !== 'Hecha').length;
      return html`<a class="cs-cliente" href="#/consulting/${esc(c.slug)}"><span class="cs-mono">${initials(c.nombre)}</span><span class="cs-cliente-t"><b>${c.nombre}</b><small class="cs-alc ${cls}">${l}</small></span>${n ? html`<span class="cs-n" title="Encargos de Estrategia abiertos">${n}</span>` : ''}${ico('right', 15)}</a>`;
    })}</div>` : html`<div class="empty">Todavía no hay clientes que veas en Estrategia.</div>`}
    <p class="mut sm cs-pie">Operations OS y Money OS son de Growth Partnership. Las finanzas de Inherent están en Organización → Finanzas.</p></div>`);
}
