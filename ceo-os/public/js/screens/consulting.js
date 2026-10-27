// Consulting: el backend de un cliente. Lo útil para organizar sus operaciones, sus finanzas y su equipo (Operations OS y
// Money OS, inherent/02-METODO.md), y los encargos que le manda Estrategia (por ejemplo, «Crear el BMC de la empresa»): cada
// encargo es una tarea con su área y su cliente, y se trabaja en el Chat. Lo ve quien ve Estrategia (lo lleva el CEO con Strategy).
// Hoy vive como el Overview del workspace Consulting (#/ws/consulting/<cliente>/overview, lo monta screens/workspace.js con
// consultingOverview). render() sigue para las rutas viejas #/consulting[/<cliente>] (alias). Las finanzas de Inherent viven en
// Organización → Finanzas. Los 12 temas se quedan en la grilla hasta la Fase 2, cuando cada uno pasa a ser semilla de su herramienta.
import { html, mount, col, toast, ico, fdate, esc, initials, skel, $ } from '../core.js';
import { loadEstrategia, estrategiaNow } from '../stratlist.js';
import { datosEstrategia, avisoConsulting, pedidoDeEncargo, verTareas } from '../llm/paneles.js';
import { CONSULTING, alcanceConsulting, consultingAbierto, encargosDe } from '../llm/modos.js';
import { etapaLabel, etapaDe } from '../estrategia.js';
import { abrirEnChat } from '../areas.js';

export const esqueleto = () => skel('pagina');
const ALCANCE = { si: ['Growth Partnership', 'ok'], 'sin-finanzas': ['Growth Partnership · sin Finanzas', 'ok'], ficha: ['A la medida', ''], fuera: ['Fuera del alcance', 'fuera'], 'sin-ficha': ['Sin ficha', 'fuera'] };
// Inherent no es cliente de Consulting: sus finanzas y su operación viven en Organización.
const clientes = () => estrategiaNow().filter((c) => c.slug !== 'inherent');

// Abre el Chat en modo Consulting con este cliente y el pedido escrito en la caja (se manda cuando la persona quiere).
const alChat = (me, slug, pedido) => abrirEnChat(me.email, { modo: 'consulting', slug, borrador: pedido });

// Las rutas viejas: #/consulting (la lista) y #/consulting/<cliente> (el detalle, con el link para volver).
export async function render(el, { me, sub = [], alive }) {
  const slug = sub[0] ? decodeURIComponent(sub[0]) : '';
  if (!slug) {
    const [, tareas] = await Promise.all([loadEstrategia(), verTareas(me) ? col('tasks').list().catch(() => []) : []]);
    if (!alive()) return;
    return lista(el, me, tareas);
  }
  mount(el, html`<div class="cs"><a class="btn ghost sm" href="#/ws/consulting">${ico('arrow-left', 14)} Todos los clientes</a><div id="cs-det"></div></div>`);
  return consultingOverview($('#cs-det', el), { me, slug, alive });
}

// El detalle de un cliente: el alcance (avisoConsulting), la etapa de Hormozi si ya está, los encargos de Estrategia y los
// 12 temas. cabecera:false lo pinta sin su cabecera (el workspace ya trae el hero del cliente).
export async function consultingOverview(el, { me, slug, alive, cabecera = true }) {
  mount(el, html`<p class="loading">Cargando…</p>`);
  const [, tareas] = await Promise.all([loadEstrategia(), verTareas(me) ? col('tasks').list().catch(() => []) : []]);
  if (!alive() || !el.isConnected) return;
  const c = clientes().find((x) => x.slug === slug);
  if (!c) return mount(el, html`<div class="cs"><div class="empty"><b>No encontré ese cliente en Estrategia</b>${slug === 'inherent' ? 'Inherent no es cliente de Consulting: su operación y sus finanzas viven en Organización.' : 'Puede que no esté en tu alcance o que todavía no tenga estrategia.'}</div></div>`);
  const data = await datosEstrategia(slug).catch(() => ({ nombre: c.nombre, nivel: c.nivel }));
  if (!alive() || !el.isConnected) return;
  let enc = encargosDe(tareas, 'consulting', slug);
  // Con un nivel que no trae Consulting, los temas y los encargos no se trabajan: se escalan al CEO.
  const abierto = consultingAbierto(alcanceConsulting(data.nivel, data.ficha));
  const etapa = data.etapa?.n != null ? etapaDe(data.etapa.n) : null;

  const encargoHtml = (t) => html`<div class="cs-enc ${t.status === 'Hecha' ? 'hecho' : ''}"><span class="cs-enc-i">${ico(t.status === 'Hecha' ? 'check' : 'send', 14)}</span>
    <div class="cs-enc-t"><b>${t.title}</b><small>${t.status || 'Por empezar'}${t.due ? ` · vence ${fdate(t.due)}` : ''}${t.description ? ` · ${String(t.description).split('\n\n')[0]}` : ''}</small></div>
    ${t.status === 'Hecha' ? '' : !abierto ? html`<span class="cs-alc fuera">Fuera del alcance · escálalo al CEO</span>` : html`<button type="button" class="btn sm" data-c="hacer" data-id="${t.id}">${ico('chat-ia', 14)} Hacerlo en el Chat</button><button type="button" class="btn ghost sm" data-c="hecha" data-id="${t.id}">Hecha</button>`}</div>`;
  const etapaChip = etapa ? html`<span class="chip" title="${data.etapa?.confirmada ? 'Confirmada por el CEO' : 'Propuesta, sin confirmar'}">${ico('target', 12)} ${etapaLabel(etapa)}${data.etapa?.confirmada ? '' : ' · propuesta'}</span>` : '';
  const pintar = () => mount(el, html`<div class="cs">
    ${cabecera ? html`<header class="cs-head"><span class="cs-mono">${initials(data.nombre || c.nombre)}</span><div><h1>${data.nombre || c.nombre}</h1><p>${data.nivel?.nombre || 'Sin ficha de oferta'} · operaciones, finanzas y equipo</p>${etapaChip ? html`<div class="row" style="margin-top:6px">${etapaChip}</div>` : ''}</div>
      <a class="btn ghost sm" href="#/ws/strategy/${esc(slug)}/overview">${ico('target', 14)} Su estrategia</a></header>` : etapaChip ? html`<div class="row cs-etapa">${etapaChip}<span class="mut sm">La etapa la confirma el CEO en Strategy. Consulting la lee, no la cambia.</span></div>` : ''}
    ${avisoConsulting(data.nivel, data.ficha)}
    <section class="cs-sec"><div class="cs-sec-h"><h2>Encargos de Estrategia</h2><span class="mut sm">Lo que la estrategia pide que se haga aquí</span></div>
      ${!verTareas(me) ? html`<p class="mut sm">Los encargos viven en las tareas y tu perfil no las ve. Pídele al CEO que te abra Mis tareas.</p>` : enc.length ? html`<div class="cs-encs">${enc.map(encargoHtml)}</div>`
      : html`<div class="cs-vacio">${ico('send', 16)}<span>Cuando Estrategia mande algo (por ejemplo, «Crear el BMC de la empresa»), aparece aquí y en Mis tareas.</span></div>`}</section>
    ${abierto ? html`<div class="cs-grid">${CONSULTING.map(([id, g, ic, ts]) => html`<section class="cs-card" data-g="${id}"><h3>${ico(ic, 16)} ${g}</h3>
      ${ts.map(([t, q]) => html`<button type="button" class="cs-tema" data-c="tema" data-q="${q}"><span>${t}</span>${ico('right', 14)}</button>`)}</section>`)}</div>
    <p class="mut sm cs-pie">Cada tema abre el Chat en modo Consulting con este cliente. Si vas a pegar números del cliente, elige la IA de tu compu (privado).</p>` : ''}</div>`);
  pintar();

  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    if (b.dataset.c === 'tema') return abierto && alChat(me, slug, b.dataset.q);
    const t = enc.find((x) => x.id === b.dataset.id); if (!t) return;
    if (b.dataset.c === 'hacer') return abierto && alChat(me, slug, pedidoDeEncargo(t));
    if (b.dataset.c === 'hecha') {
      try { const n = await col('tasks').save({ ...t, status: 'Hecha' }); enc = encargosDe(enc.map((x) => (x.id === t.id ? { ...t, ...n, status: 'Hecha' } : x)), 'consulting', slug); toast('Encargo hecho'); pintar(); }
      catch (er) { toast(er.status === 403 ? 'Tu perfil no puede cambiar tareas' : er.message, true); }
    }
  });
}

// Todos los clientes: su nivel (si trae Operations OS y Money OS) y cuántos encargos tiene abiertos.
function lista(el, me, tareas) {
  const cs = clientes();
  mount(el, html`<div class="cs">
    <header class="cs-head"><div><h1>Consulting</h1><p>El backend de cada cliente: <em>sus operaciones, sus finanzas y su equipo</em>.</p></div></header>
    ${cs.length ? html`<div class="cs-clientes">${cs.map((c) => {
      const [l, cls] = ALCANCE[alcanceConsulting(c.nivel)], n = encargosDe(tareas, 'consulting', c.slug).filter((t) => t.status !== 'Hecha').length;
      return html`<a class="cs-cliente" href="#/ws/consulting/${esc(c.slug)}/overview"><span class="cs-mono">${initials(c.nombre)}</span><span class="cs-cliente-t"><b>${c.nombre}</b><small class="cs-alc ${cls}">${l}</small></span>${n ? html`<span class="cs-n" title="Encargos de Estrategia abiertos">${n}</span>` : ''}${ico('right', 15)}</a>`;
    })}</div>` : html`<div class="empty">Todavía no hay clientes que veas en Estrategia.</div>`}
    <p class="mut sm cs-pie">Operations OS y Money OS son de Growth Partnership. Las finanzas de Inherent están en Organización → Finanzas.</p></div>`);
}
