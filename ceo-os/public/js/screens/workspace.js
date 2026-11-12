import { avance } from '../estrategia-viva.js';
// La página de un workspace: #/ws/<ws>/<cliente>/<pestaña>[/<herramienta>[/<resto>]]. Arriba las pestañas del workspace, el
// hero del cliente (monograma, nivel, etapa si aplica, aprobación y el flujo compartido) y «Continuar en el Chat». Abajo, la
// grilla de herramientas de la pestaña (nombre, qué produce, estado, último entregable —una sola lectura de /api/entregables por
// grilla—, viene de / va a); el Overview suma el
// resumen del cliente en ese workspace, todas las herramientas por pestaña y la siguiente acción. Con una herramienta en la
// ruta, se monta su módulo (la tabla de montaje que antes vivía en la portada de Marcas; la clave 'shell' monta el Tool Shell con la
// vista de la herramienta) o, si es «Pronto», su ficha: qué recibe, qué produce, a qué alimenta y su prioridad. Sin cliente, el selector de contexto en grande. Los permisos los pone el servidor:
// aquí solo se refleja (puedeWs, puede() de cada herramienta y modulesFor de brandlist.js).
// Strategy (Fase 3a): Customer Bullseye, Business X-Ray y Offer Architect van al Tool Shell (vistas diana, xray y oferta); Growth Roadmap monta su
// propia hoja (monta 'roadmap'). El chat de Strategy de hoy (screens/strategy.js) ya no es la casa de ninguna: se abre por …/<herramienta>/chat[/<bloque>].
// Marketing (Fase 3b): el Viral Lab y Ads Intelligence montan su propia hoja (monta 'viral' y 'adsIntel'; cada una trae adentro la Investigación y las
// Variaciones de hoy); el Performance Center va al Tool Shell (vista 'rendimiento', un entregable por mes) y conserva «Instagram» (los analytics de siempre).
// Creative (Fase 3c): el Creative Direction Lab va al Tool Shell (vista 'direccion', un entregable por mes) y conserva «Ideas» y «Formatos» de hoy como sub-vistas
// (…/creative-direction-lab/ideas|formatos: ahí NO se monta el shell); Brand DNA y Moodboard montan su hoja ('dna' y 'moodboard'); en la marca personal siguen en meBrand.
// Fase 3e · P2: las vistas nuevas (radar, oportunidades, precios, organizacion, automatizacion, hooks, copy, funnel, rendimientoCreativo y repurposing) van al Tool Shell; el Funnel
// Builder conserva «Sitios y landings» (…/funnel-builder/sitios: techUI, sin shell); Commercial Diagnosis, Brand Consistency Checker y Production Planner montan su hoja
// ('comercial', 'consistencia' y 'planner'; no usan el shell).
// Production (Fase 3d): el Production Brief y el Shot List Builder van al Tool Shell (vistas brief y shotlist, un entregable por mes); el Review & Approval Studio monta su hoja ('review').
import { html, mount, col, api, ico, initials, skel, $, fdate, today } from '../core.js';
import { WORKSPACES, FLUJO, wsDe, pestanaDe, herramientaDe, deWorkspace, cadena, rutaHerramienta, puedeWs, veEstrategia, acc } from '../herramientas.js';
import { cargarContexto, contextoLista, contextoActual, ponerContexto, selectorHtml } from '../contexto.js';
import { abrirEnChat } from '../areas.js';
import { modulesFor } from '../brandlist.js';
import { estadoDe, separar, nombreDe } from '../element.js';
import { etapaLabel, etapaDe } from '../estrategia.js';
import { canEdit } from '../roleviews.js';
import { panelViva } from '../estrategia-viva-ui.js';
import { render as content } from './content.js';
import { render as strategy } from './strategy.js';
import { consultingOverview } from './consulting.js';
import { render as meBrand } from './me-brand.js';
import { brandBoard } from '../brand-board.js';
import { brandHome } from '../brand-home.js';
import { avatarUI } from '../avatar-ui.js';
import { brandBrief } from '../brand-brief.js';
import { formatosUI } from '../formatos-ui.js';
import { creacionUI } from '../creacion-ui.js';
import { designSystemUI } from '../design-system-ui.js';
import { disenoChat } from '../diseno-chat.js';
import { planMesUI } from '../plan-mes-ui.js';
import { campanasUI } from '../campanas-ui.js';
import { videoUI } from '../video-ui.js';
import { techUI } from '../tech-ui.js';
import { fallo, vacio as vacioOS } from '../visual.js';

export const esqueleto = () => skel('pagina');

// Las vistas de las herramientas con entregable (clave 'vista' del registro): cada una se carga cuando se abre su herramienta.
const VISTAS = {
  salud: () => import('../consulting/salud-ui.js'),
  causas: () => import('../consulting/causas-ui.js'),
  procesos: () => import('../consulting/procesos-ui.js'),
  escenarios: () => import('../consulting/escenarios-ui.js'),
  blueprint: () => import('../consulting/blueprint-ui.js'),
  impacto: () => import('../consulting/impacto-ui.js'),
  diana: () => import('../strategy/diana-ui.js'),
  xray: () => import('../strategy/xray-ui.js'),
  oferta: () => import('../strategy/oferta-ui.js'),
  rendimiento: () => import('../marketing/rendimiento-ui.js'),
  direccion: () => import('../creative/direccion-ui.js'),
  brief: () => import('../production/brief-ui.js'),
  shotlist: () => import('../production/shotlist-ui.js'),
  radar: () => import('../strategy/radar-ui.js'),
  oportunidades: () => import('../strategy/oportunidades-ui.js'),
  precios: () => import('../strategy/precios-ui.js'),
  organizacion: () => import('../consulting/organizacion-ui.js'),
  automatizacion: () => import('../consulting/automatizacion-ui.js'),
  hooks: () => import('../marketing/hooks-ui.js'),
  copy: () => import('../marketing/copy-ui.js'),
  funnel: () => import('../marketing/funnel-ui.js'),
  rendimientoCreativo: () => import('../creative/rendimiento-creativo-ui.js'),
  repurposing: () => import('../production/repurposing-ui.js'),
};
const reciente = (d) => String(d._meta?.updated_at || d._meta?.created_at || '');

const EST = { lista: 'Lista', parcial: 'Parcial', pronto: 'Pronto' };
// Un paso de FLUJO puede ser un texto o { id, nombre }; la pestaña guarda su paso igual.
const pasoId = (p) => (p && typeof p === 'object' ? p.id : p);
const pasoNombre = (p) => (p && typeof p === 'object' ? p.nombre || p.id : FLUJO.find((f) => f.id === p)?.nombre || p);
const nomTool = (id) => herramientaDe(id)?.nombre || id;
const herr = (x) => (typeof x === 'string' ? herramientaDe(x) : x);
// Qué módulo de Marcas monta cada clave de montaje: modulesFor(me, b) sigue diciendo si el perfil lo abre.
// (avatar ya no está: el Customer Avatar Studio es de Strategy y el servidor deja entrar a quien edita Contenido o Estrategia.)
const MOD_LEGADO = { brandHome: 'inicio', brief: 'brief', viral: 'investigacion', plan: 'plan', calendario: 'calendario', campanas: 'campanas', adsIntel: 'ads', brandBoard: 'marca', dna: 'marca', moodboard: 'marca', design: 'design', creacion: 'creacion', video: 'video', review: 'video' };
// El ciclo de Production (un ciclo por marca y mes): en qué fase cae el día de hoy.
const CICLO = [[1, 3, 'brief'], [4, 5, 'coordinar'], [6, 10, 'grabar'], [11, 11, 'último día de grabación'], [12, 15, 'editar'], [16, 19, 'cambios'], [20, 20, 'presentar']];
const diaCiclo = (dia) => (dia > 20 ? 'Ciclo del mes cerrado · se presentó el 20' : `Día ${dia} del ciclo · ${(CICLO.find(([a, z]) => dia >= a && dia <= z) || [])[2] || ''}`);
const porAprobar = (p) => estadoDe(p) === 'En revisión' || (p.por_aprobar === true && estadoDe(p) === 'En proceso');

export async function render(el, { me, sub = [], alive }) {
  const [ws0, slug0, pest0, tool0, ...resto] = sub;
  const W = wsDe(ws0 || '');
  if (!W) return mount(el, html`<div class="empty ws-vacio"><b>Ese workspace no existe</b>Elige uno:<div class="ws-links">${WORKSPACES.map((w) => html`<a class="btn ghost sm" href="#/ws/${w.id}">${ico(w.icono, 14)} ${w.nombre}</a>`)}</div></div>`);
  const ws = W.id;
  if (!puedeWs(me, ws)) return mount(el, html`${vacioOS({ icono: 'lock', titulo: `Tu perfil no abre ${W.nombre}`, linea: 'Pídele al CEO acceso en Equipo → Vistas por rol.' })}`);
  mount(el, esqueleto());
  await cargarContexto(me).catch(() => []);
  if (!alive()) return;
  const lista = contextoLista();
  const slug = slug0 ? decodeURIComponent(slug0) : '';
  const cab = html`<div class="ws-cab" style="--ws-c:var(${W.color})"><span class="ws-cab-ico">${ico(W.icono, 20)}</span><div><h1>${W.nombre}</h1><p class="mut">${W.sub}</p></div></div>`;
  // Sin cliente: el del contexto, o el selector en grande (al elegir, instalarContexto de app.js navega).
  if (!slug) {
    const ctx = contextoActual(me);
    if (ctx && lista.some((x) => x.slug === ctx)) return location.replace(`#/ws/${ws}/${ctx}/overview`);
    return mount(el, html`${cab}<div class="ws-vacio">${selectorHtml(me, { grande: true })}</div>`);
  }
  const b = lista.find((x) => x.slug === slug);
  if (slug === 'personal' && (me.role !== 'ceo' || !b)) return mount(el, html`${cab}${vacioOS({ icono: 'lock', titulo: 'La marca personal es solo del CEO', linea: 'Tu perfil no la ve.' })}`);
  if (!b) return mount(el, html`${cab}${vacioOS({ icono: 'inbox', titulo: 'No encontré ese cliente', linea: 'Puede que no esté entre tus clientes o que ya no esté activa.' })}<div class="ws-vacio">${selectorHtml(me, { grande: true })}</div>`);
  if (contextoActual(me) !== slug) ponerContexto(me, slug);

  const T0 = tool0 ? herramientaDe(tool0) : null;
  const tool = T0 && T0.ws === ws ? T0 : null;
  const pestana = (tool && pestanaDe(ws, tool.pestana)) || pestanaDe(ws, pest0 || '') || pestanaDe(ws, 'overview') || W.pestanas[0];
  const rutaPest = (p = pestana) => `#/ws/${ws}/${slug}/${p.id}`;
  const puede = (t) => (typeof t.puede === 'function' ? Boolean(t.puede(me, b)) : true);
  const visibles = (p) => deWorkspace(ws, p.id).filter(puede);

  // El hero necesita la estrategia en Strategy y Consulting (etapa y aprobación); se lee fresca.
  let est = null;
  if (ws === 'strategy' || ws === 'consulting') { est = await api(`estrategia/${encodeURIComponent(slug)}`).catch(() => null); if (!alive()) return; }

  mount(el, html`${tabs()}${hero()}<div id="ws-cuerpo"></div>`);
  // Una herramienta que cambia la estrategia (aprobar o reabrir, confirmar la etapa) avisa con window.dispatchEvent(new Event('os:estrategia')):
  // se lee otra vez y se repintan los chips del hero (etapa y «Estrategia aprobada»). El oyente se quita solo al salir de la pantalla.
  if (ws === 'strategy' || ws === 'consulting') {
    const fresca = async () => {
      if (!alive() || !el.isConnected) return window.removeEventListener('os:estrategia', fresca);
      const nueva = await api(`estrategia/${encodeURIComponent(slug)}`).catch(() => null);
      if (!nueva || !alive() || !el.isConnected) return;
      est = nueva;
      const chipsEl = $('.ws-hero .ws-chips', el); if (chipsEl) mount(chipsEl, html`${chips()}`);
    };
    window.addEventListener('os:estrategia', fresca);
  }
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-ws="chat"]')) return abrirEnChat(me.email, { modo: W.modo, slug });
    // La tarjeta entera lleva a la herramienta; los links de adentro (viene de / va a) siguen siendo links.
    const card = e.target.closest('.tool-card[data-href]');
    if (card && !e.target.closest('a')) location.hash = card.dataset.href;
  });
  // Los entregables del cliente en este workspace: UNA lectura por pintado (la comparten las tarjetas y el Overview de Consulting).
  // null si falla (sin permiso, sin ficha, sin red): quien la usa deja su texto de hoy.
  // Quien tiene Contenido en «resumen» solo lee el Performance Center (el servidor le niega la lista entera): a él se le pide solo esa herramienta.
  let entregables = null;
  const soloRendimiento = ws === 'marketing' && acc(me).content && !acc(me).contentFull;
  const leerEntregables = () => (entregables ||= api(`entregables?ws=${encodeURIComponent(ws)}&slug=${encodeURIComponent(slug)}${soloRendimiento ? '&tool=marketing-performance-center' : ''}`).catch(() => null));
  const cuerpo = $('#ws-cuerpo', el);
  if (tool) return herramienta(cuerpo, tool);
  if (pestana.id === 'overview') return overview(cuerpo);
  return pagina(cuerpo);

  // ---------- Pestañas, hero y flujo ----------
  function tabs() {
    return html`<nav class="ws-tabs" role="tablist" aria-label="${W.nombre}" style="--ws-c:var(${W.color})">${W.pestanas.map((p) => html`<a role="tab" class="${p.id === pestana.id ? 'on' : ''}" aria-selected="${p.id === pestana.id ? 'true' : 'false'}" href="${rutaPest(p)}">${p.nombre}</a>`)}</nav>`;
  }
  function chips() {
    const out = [];
    if (ws === 'strategy') { const e = est?.etapa?.n != null ? etapaDe(est.etapa.n) : null; out.push(html`<span class="chip" title="${e ? (est.etapa.confirmada ? 'Confirmada por el CEO' : 'Propuesta, sin confirmar') : 'La etapa sale del Business X-Ray'}">${ico('target', 12)} ${e ? etapaLabel(e) : 'Sin etapa'}</span>`); }
    if (ws === 'production') out.push(html`<span class="chip">${ico('cal', 12)} ${diaCiclo(+today().slice(8, 10))}</span>`);
    if (ws === 'strategy' || ws === 'consulting') out.push(est ? html`<span class="chip ${est.vivaAprobada ? 'lime' : ''}">${ico(est.vivaAprobada ? 'check' : 'edit', 12)} ${est.vivaAprobada ? 'Estrategia aprobada' : 'En construcción'}</span>` : html`<span class="chip" title="No pude leer la estrategia de este cliente">Sin estrategia</span>`);
    if (b.personal) out.push(html`<span class="chip dark" title="Solo la ve el CEO: ni la API ni el conector la entregan a nadie más">${ico('lock', 12)} Privado</span>`);
    return out;
  }
  function hero() {
    return html`<header class="ws-hero" style="--ws-c:var(${W.color})">
      <span class="ws-hero-mono ${b.personal ? 'priv' : ''}">${b.personal ? ico('lock', 18) : initials(b.name)}</span>
      <div class="ws-hero-t"><h1>${b.name}</h1><p>${b.nivel?.nombre || b.sub || ''}<span class="mut"> · ${W.nombre}</span></p><div class="ws-chips">${chips()}</div></div>
      <div class="sp"></div>
      <button type="button" class="btn" data-ws="chat">${ico('chat-ia', 14)} Continuar en el Chat</button>
    </header>`;
  }

  // ---------- La grilla ----------
  function chipsDe(lbl, ids = []) {
    if (!ids.length) return '';
    return html`<span class="tool-card-chip"><span class="mut sm">${lbl}</span>${ids.map((id) => { const t = herramientaDe(id); return t && t.ws === ws ? html`<a class="chip sm2" href="${rutaHerramienta(ws, slug, id)}">${t.nombre}</a>` : html`<span class="chip sm2" title="${t ? `En ${wsDe(t.ws)?.nombre || t.ws}` : ''}">${nomTool(id)}</span>`; })}</span>`;
  }
  function tarjeta(t) {
    return html`<article class="tool-card" data-est="${t.estado}" data-href="${rutaHerramienta(ws, slug, t.id)}">
      <span class="tool-card-ico">${ico(t.icono || 'target', 18)}</span>
      <div class="tool-card-t"><a href="${rutaHerramienta(ws, slug, t.id)}">${t.nombre}</a><span class="tool-card-est" data-est="${t.estado}">${EST[t.estado] || t.estado}</span></div>
      <p>${t.produce || ''}</p>
      <div class="tool-card-ult" data-tool="${t.id}"><span class="mut sm">Último entregable: —</span><span class="mut sm">⚠️ SIN DATOS: saldrá de ${t.monta === 'roadmap' ? 'la estrategia en vivo (viva.roadmap)' : 'deliverables (Fase 2)'}</span></div>
      <div class="tool-card-chips">${chipsDe('viene de', t.viene_de)}${chipsDe('va a', t.va_a)}</div></article>`;
  }
  // «Último entregable» de cada tarjeta. Si falla o el cliente no tiene entregables, queda el texto de hoy.
  async function ultimos(box) {
    if (!box.querySelector('.tool-card-ult')) return;
    const r = await leerEntregables();
    if (!r || !alive() || !box.isConnected) return;
    const por = new Map();
    for (const d of Array.isArray(r?.items) ? r.items : []) { if (d.archivado || !d.tool) continue; const p = por.get(d.tool); if (!p || reciente(d) > reciente(p)) por.set(d.tool, d); }
    for (const n of box.querySelectorAll('.tool-card-ult[data-tool]')) {
      const d = por.get(n.dataset.tool);
      // Una herramienta que ya guarda sus entregables (el shell, el Viral Lab, Ads Intelligence: traen su limpiar) no «saldrá» de nada: solo todavía no hay un borrador.
      if (!d) { if (typeof herramientaDe(n.dataset.tool)?.limpiar === 'function') mount(n, html`<span class="mut sm">Último entregable: —</span><span class="mut sm">⚠️ SIN DATOS: todavía no hay un borrador</span>`); continue; }
      const f = reciente(d);
      mount(n, html`<span class="mut sm">Último entregable</span><span class="sm tool-card-ult-d"><span class="chip sm2 tool-card-ult-e" data-estado="${d.estado || 'Borrador'}">${d.estado || 'Borrador'}</span> <span class="mut">v${d.version || 1}${f ? ` · ${fdate(f)}` : ''}</span></span>`);
    }
  }
  function grilla(ts) { return (ts.length ? html`<div class="ws-grid">${ts.map(tarjeta)}</div>` : html`<p class="mut sm">Sin herramientas que tu perfil abra en esta pestaña.</p>`); }
  function seccion(titulo, sub, cuerpo, extra = '') { return html`<section class="ws-sec ${extra}"><div class="ws-sec-h"><h2>${titulo}</h2>${sub ? html`<span class="mut sm">${sub}</span>` : ''}</div>${cuerpo}</section>`; }

  // La primera P1 de la cadena del workspace que ya se puede usar (lista o parcial).
  function siguienteTool() {
    const todas = deWorkspace(ws).filter(puede), first = todas[0];
    let ids = []; try { ids = first ? cadena(first.id) || [] : []; } catch { ids = []; }
    const ok = (t) => t && t.ws === ws && t.prioridad === 'P1' && t.estado !== 'pronto' && puede(t);
    return ids.map(herr).find(ok) || todas.find(ok) || null;
  }
  function siguiente() {
    const t = siguienteTool();
    return t ? html`<section class="ws-sec ws-next"><span class="lbl">Siguiente acción</span><a href="${rutaHerramienta(ws, slug, t.id)}">${ico(t.icono || 'target', 16)} ${t.nombre} ${ico('right', 14)}</a><span class="mut sm">${t.produce || ''}</span></section>` : '';
  }

  // ---------- Overview: el resumen del cliente en este workspace + todas las herramientas + la siguiente acción ----------
  async function overview(box) {
    // Solo lo importante: qué sigue y el resumen. Las herramientas viven en sus pestañas.
    mount(box, html`${siguiente()}<section class="ws-sec" id="ws-resumen"><div id="ws-res"></div></section>`);
    const r = $('#ws-res', box);
    if (ws === 'strategy') return resumenStrategy(r);
    if (ws === 'marketing') return brandHome(r, { me, b, alive });
    if (ws === 'creative') return brandBrief(r, { me, b, alive });
    if (ws === 'consulting') return consultingOverview(r, { me, slug, alive, cabecera: false, entregables: leerEntregables() });
    if (ws === 'production') return delivery(r);
  }
  function resumenStrategy(r) {
    if (!est) return mount(r, html`${fallo({ titulo: 'No pude leer la estrategia', linea: 'Puede que tu perfil no vea Estrategia o que este cliente no tenga carpeta todavía.' })}`);
    const hay = avance(est.viva || {}).n > 0;
    return mount(r, html`${hay ? '' : html`<div class="ws-vacia"><b>Todavía no hay estrategia de ${b.name}</b><p>Empieza por la siguiente acción o continúa en el Chat. Aquí aparecerá la meta y el plan.</p></div>`}
      <details class="ws-mas" ${hay ? 'open' : ''}><summary>${hay ? 'La estrategia en vivo' : 'Ver el mapa completo'}</summary><div class="lp-viva">${panelViva({ v: est.viva || {}, data: { ...est, slug }, bid: 'diagnostico', editable: false, esCeo: me.role === 'ceo', aprobada: Boolean(est.vivaAprobada) })}</div></details>`);
  }

  // ---------- Una pestaña: lo extra arriba y su grilla ----------
  async function pagina(box) {
    mount(box, html`<div id="ws-extra"></div>${seccion(pestana.nombre, pasoNombre(pestana.paso), grilla(visibles(pestana)))}`);
    ultimos(box).catch(() => {});
    const x = $('#ws-extra', box);
    if (ws === 'creative' && pestana.id === 'brief') return brandBrief(x, { me, b, alive });
    if (ws === 'creative' && pestana.id === 'review') return revision(x);
    if (ws === 'production' && pestana.id === 'delivery') return delivery(x);
    if (ws === 'marketing' && pestana.id === 'audience' && veEstrategia(me)) return mount(x, seccion('De Strategy, en solo lectura', 'La diana y los avatares se editan en Strategy; aquí se leen', html`<div class="ws-links"><a class="btn ghost sm" href="#/ws/strategy/${slug}/research/customer-bullseye">${ico('target', 14)} Ver la diana en Strategy</a><a class="btn ghost sm" href="#/ws/strategy/${slug}/research/customer-avatar-studio">${ico('eye', 14)} Avatares aprobados</a></div>`));
  }
  // Las piezas que el equipo mandó a aprobar (lista simple sobre content).
  async function piezasRevision() {
    const all = await col('content').list().catch(() => []);
    return separar(all.filter((c) => c.kind === 'post' && c.profile === slug)).vivos.filter(porAprobar).sort((a, z) => String(a.date || '9').localeCompare(String(z.date || '9')));
  }
  function listaPiezas(xs, vacio) { return (xs.length ? html`<ul class="ws-lista">${xs.map((p) => html`<li><span>${nombreDe(p, b.name)}</span><span class="mut sm">${p.format || ''}${p.date ? ` · ${fdate(p.date)}` : ' · sin fecha'}</span></li>`)}</ul>` : html`${vacioOS({ icono: 'inbox', titulo: 'Nada por aprobar', linea: `${vacio}`, compacto: true })}`); }
  async function revision(x) {
    mount(x, seccion('En revisión', 'Las piezas que el equipo mandó a aprobar', html`<p class="loading">Cargando…</p>`));
    const xs = await piezasRevision(); if (!alive() || !x.isConnected) return;
    mount(x, seccion('En revisión', 'Las piezas que el equipo mandó a aprobar', listaPiezas(xs, 'Las piezas llegan aquí cuando se mandan a aprobación desde Ideas o el Calendario.')));
  }
  // Delivery: el calendario de la marca (apaga Operativo y Planificación para quedarte con lo Programado) + lo por aprobar.
  async function delivery(x) {
    mount(x, seccion('Delivery', 'Lo programado y lo que espera el OK del cliente', html`<div id="ws-cal" data-island="1"></div><div id="ws-apr" style="margin-top:14px"></div>`));
    const cal = $('#ws-cal', x), apr = $('#ws-apr', x);
    piezasRevision().then((xs) => { if (alive() && apr.isConnected) mount(apr, html`<div class="ws-sec-h"><h3>Por aprobar</h3></div>${listaPiezas(xs, 'Cuando una pieza se manda a aprobación, aparece aquí y en el portal del cliente.')}`); });
    if (!modulesFor(me, b).includes('calendario')) return mount(cal, html`<p class="mut sm">Tu perfil no ve el calendario de esta marca.</p>`);
    return content(cal, { me, alive, fixed: b.slug, sub: ['calendario'], embed: { base: rutaPest(), only: ['calendario'], brand: b.name } });
  }

  // ---------- Una herramienta: su cabecera y el módulo que la monta (o su ficha si es «Pronto») ----------
  function head(t) {
    const de = (t.viene_de || []).map(nomTool).join(' · '), a = (t.va_a || []).map(nomTool).join(' · ');
    return html`<div class="tool-head" style="--ws-c:var(${W.color})"><a class="btn ghost sm" href="${rutaPest()}">${ico('arrow-left', 14)} ${pestana.nombre}</a>
      <div class="tool-head-t"><b>${ico(t.icono || 'target', 16)} ${t.nombre}</b><span class="mut sm">${de ? html`${de} → ` : ''}<strong>${t.nombre}</strong>${a ? html` → ${a}` : ''}</span></div>
      <span class="tool-card-est" data-est="${t.estado}">${EST[t.estado] || t.estado}</span></div>`;
  }
  function ficha(t) {
    const li = (ids = []) => (ids.length ? html`<ul>${ids.map((id) => { const x = herramientaDe(id); return html`<li>${x && x.ws === ws ? html`<a href="${rutaHerramienta(ws, slug, id)}">${x.nombre}</a>` : nomTool(id)}${x && x.ws !== ws ? html` <span class="mut sm">· ${wsDe(x.ws)?.nombre || x.ws}</span>` : ''}</li>`; })}</ul>` : html`<span class="mut">Nada: empieza desde cero.</span>`);
    return html`<section class="tool-ficha"><span class="tool-ficha-ico">${ico(t.icono || 'target', 22)}</span><span class="chip">Pronto</span><h2>${t.nombre}</h2><p>${t.produce || ''}</p>
      <dl class="tool-ficha-dl"><div><dt>Recibe</dt><dd>${li(t.viene_de)}</dd></div><div><dt>Produce</dt><dd>${t.produce || '—'}</dd></div><div><dt>Alimenta</dt><dd>${li(t.va_a)}</dd></div><div><dt>Prioridad</dt><dd>${t.prioridad || '—'}${t.aprueba ? html` <span class="mut sm">· aprueba ${t.aprueba === 'ceo' ? 'el CEO' : 'el COO'}</span>` : ''}</dd></div></dl>
      <p class="mut sm">Llega en la Fase ${ws === 'consulting' && t.prioridad === 'P1' ? '2' : '3'}. Mientras, lo que ya tengas se trabaja en el Chat.</p>
      <button type="button" class="btn" data-ws="chat">${ico('chat-ia', 14)} Continuar en el Chat</button></section>`;
  }
  // El bloque del chat de Strategy que pide la ruta, o '' si la ruta no es de un chat: …/chat · …/chat/<bloque> · (Fase 1) offer-architect/modelo|leads.
  function bloqueChat(t) {
    if (ws !== 'strategy' || !t.bloque_hz) return '';
    const viejo = t.id === 'offer-architect' && ['modelo', 'leads'].includes(resto[0]);
    if (resto[0] !== 'chat' && !viejo) return '';
    const pide = viejo ? resto[0] : resto[1];
    return t.id === 'offer-architect' && ['oferta', 'modelo', 'leads'].includes(pide) ? pide : t.bloque_hz;
  }
  async function herramienta(box, t) {
    const base = `#/ws/${ws}/${slug}/${pestana.id}/${t.id}`;
    mount(box, html`${head(t)}<div id="ws-tool"></div>`);
    const host = $('#ws-tool', box);
    if (!puede(t)) return mount(host, html`${vacioOS({ icono: 'lock', titulo: 'Tu perfil no abre esta herramienta', linea: 'Pídele al CEO acceso en Equipo → Vistas por rol.' })}`);
    if (t.estado === 'pronto' || !t.monta) return mount(host, ficha(t));
    // El chat de Strategy de hoy (puente/Hermes), intacto: solo por …/<herramienta>/chat[/<bloque>] (y por las rutas de la Fase 1 de Modelo y Leads).
    const chat = bloqueChat(t);
    if (chat) return strategy(host, { me, sub: [slug, chat], alive });
    // El Creative Direction Lab trae «Ideas» y «Formatos» de hoy como sub-vistas (resto[0]); cada una pide su módulo de Marcas.
    const subLab = t.id === 'creative-direction-lab' && ['ideas', 'formatos'].includes(resto[0]) ? resto[0] : '';
    // El Funnel Builder trae «Sitios y landings» (…/funnel-builder/sitios): esa sub-vista pide el módulo tech de Marcas; el embudo no.
    const sitios = t.id === 'funnel-builder' && resto[0] === 'sitios';
    const mod = subLab || (sitios ? 'tech' : MOD_LEGADO[t.monta]);
    if (mod && !modulesFor(me, b).includes(mod)) return mount(host, html`${vacioOS({ icono: 'lock', titulo: 'Tu perfil no abre esta herramienta', linea: `${b.personal ? 'En la marca personal no aplica.' : 'Pídele al CEO acceso a Contenido o a Clientes en Equipo → Vistas por rol.'}` })}`);
    const common = { me, alive, fixed: b.slug };
    const embed = (h, only, extra = {}) => { h.dataset.island = '1'; return content(h, { ...common, sub: [only], embed: { base, only: [only], brand: b.name, ...extra } }); };
    switch (t.monta) {
      // El Tool Shell: el marco común (estados, versiones, IA, criterios) con la vista de la herramienta en el centro.
      case 'shell': {
        const cargar = VISTAS[t.vista];
        if (!cargar) return mount(host, ficha(t));
        // Creative Direction Lab: la dirección del mes es el centro (shell con ciclo); «Ideas» y «Formatos» son las pantallas de siempre, sin shell.
        let sede = host;
        if (t.id === 'creative-direction-lab') {
          const sv = subLab, enlace = (id, nombre) => html`<a class="${sv === id ? 'on' : ''}" href="${id ? `${base}/${id}` : base}">${nombre}</a>`;
          mount(host, html`<nav class="ws-sub-tabs" aria-label="Dirección, ideas o formatos">${enlace('', 'Dirección')}${enlace('ideas', 'Ideas')}${enlace('formatos', 'Formatos')}</nav><div id="ws-cdl"></div>`);
          sede = $('#ws-cdl', host);
          if (sv === 'ideas') return embed(sede, 'postear');
          if (sv === 'formatos') return formatosUI(sede, { me, b, alive });
        }
        // Performance Center: el reporte del mes es el centro; «Instagram» es la pantalla de analytics de siempre (ahí se conecta la cuenta).
        if (t.id === 'marketing-performance-center') {
          const ig = resto[0] === 'instagram';
          mount(host, html`<nav class="ws-sub-tabs" aria-label="Reporte o Instagram"><a class="${ig ? '' : 'on'}" href="${base}">Reporte del mes</a><a class="${ig ? 'on' : ''}" href="${base}/instagram">Instagram</a></nav><div id="ws-mpc"></div>`);
          sede = $('#ws-mpc', host);
          if (ig) return modulesFor(me, b).includes('resultados') ? embed(sede, 'analytics') : mount(sede, html`${vacioOS({ icono: 'lock', titulo: 'Tu perfil no abre los analytics', linea: 'Pídele al CEO acceso a Contenido en Equipo → Vistas por rol.' })}`);
        }
        // Funnel Builder: el embudo es el centro; «Sitios y landings» son los sitios de siempre (techUI), sin shell.
        if (t.id === 'funnel-builder') {
          mount(host, html`<nav class="ws-sub-tabs" aria-label="Embudo o sitios y landings"><a class="${sitios ? '' : 'on'}" href="${base}">Embudo</a><a class="${sitios ? 'on' : ''}" href="${base}/sitios">Sitios y landings</a></nav><div id="ws-fnl"></div>`);
          sede = $('#ws-fnl', host);
          if (sitios) return techUI(sede, { me, b, alive });
        }
        mount(sede, esqueleto());
        let vista = null, toolShell = null;
        try { [{ vista }, { toolShell }] = await Promise.all([cargar(), import('../tool-shell.js')]); } catch (e) { console.error(e); }
        if (!alive() || !sede.isConnected) return;
        if (!vista || !toolShell) return mount(sede, html`${fallo({ titulo: `No pude abrir ${t.nombre}`, linea: 'Recarga la página; si sigue igual, lo que ya tengas se trabaja en el Chat.' })}`);
        return toolShell(sede, { me, tool: t, slug, b, alive, vista, resto });
      }
      // Growth Roadmap: su hoja propia (no usa el shell; su casa es viva.roadmap).
      case 'roadmap': {
        mount(host, esqueleto());
        let roadmapTool = null;
        try { ({ roadmapTool } = await import('../strategy/roadmap-ui.js')); } catch (e) { console.error(e); }
        if (!alive() || !host.isConnected) return;
        if (!roadmapTool) return mount(host, html`${fallo({ titulo: `No pude abrir ${t.nombre}`, linea: 'Recarga la página; si sigue igual, lo que ya tengas se trabaja en el Chat.' })}`);
        return roadmapTool(host, { me, slug, b, alive, resto });
      }
      // Viral Intelligence Lab y Ads Intelligence: su hoja propia (no usan el shell; sus entregables los guardan ellas por /api/entregables).
      case 'viral': case 'adsIntel': {
        const [archivo, nombre] = t.monta === 'viral' ? ['../marketing/viral-ui.js', 'viralTool'] : ['../marketing/ads-intel-ui.js', 'adsIntelTool'];
        mount(host, esqueleto());
        let hoja = null;
        try { hoja = (await import(archivo))[nombre]; } catch (e) { console.error(e); }
        if (!alive() || !host.isConnected) return;
        if (typeof hoja !== 'function') return mount(host, html`${fallo({ titulo: `No pude abrir ${t.nombre}`, linea: 'Recarga la página; si sigue igual, lo que ya tengas se trabaja en el Chat.' })}`);
        return hoja(host, { me, slug, b, alive, resto });
      }
      // Review & Approval Studio: su hoja propia (no usa el shell; vive en videos: revision, comentarios al segundo y aprobación).
      case 'review': {
        mount(host, esqueleto());
        let reviewTool = null;
        try { ({ reviewTool } = await import('../production/review-ui.js')); } catch (e) { console.error(e); }
        if (!alive() || !host.isConnected) return;
        if (typeof reviewTool !== 'function') return mount(host, html`${fallo({ titulo: `No pude abrir ${t.nombre}`, linea: 'Recarga la página; si sigue igual, lo que ya tengas se trabaja en el Chat.' })}`);
        return reviewTool(host, { me, slug, b, alive, resto });
      }
      // Commercial Diagnosis, Brand Consistency Checker y Production Planner: su hoja propia (no usan el shell; cada una guarda por sus rutas).
      case 'comercial': case 'consistencia': case 'planner': {
        const [archivo, nombre] = { comercial: ['../strategy/comercial-ui.js', 'comercialTool'], consistencia: ['../creative/consistencia-ui.js', 'consistenciaTool'], planner: ['../production/planner-ui.js', 'plannerTool'] }[t.monta];
        mount(host, esqueleto());
        let hoja = null;
        try { hoja = (await import(archivo))[nombre]; } catch (e) { console.error(e); }
        if (!alive() || !host.isConnected) return;
        if (typeof hoja !== 'function') return mount(host, html`${fallo({ titulo: `No pude abrir ${t.nombre}`, linea: 'Recarga la página; si sigue igual, lo que ya tengas se trabaja en el Chat.' })}`);
        return hoja(host, { me, slug, b, alive, resto });
      }
      case 'avatar': return avatarUI(host, { me, b, alive });
      case 'plan': return planMesUI(host, { me, b, alive, resto });
      case 'calendario': return embed(host, 'calendario');
      case 'campanas': return campanasUI(host, { me, b, alive, resto });
      // Brand DNA Studio y Moodboard Studio: su hoja propia (no usan el shell; viven en brand_boards con id = slug del cliente). La marca personal sigue en meBrand.
      case 'dna': case 'moodboard': {
        if (b.personal) return meBrand(host, { me, sub: resto, alive, embed: { base, only: ['roadmap', 'asociaciones'] } });
        const [archivo, nombre] = t.monta === 'dna' ? ['../creative/dna-ui.js', 'dnaTool'] : ['../creative/moodboard-ui.js', 'moodboardTool'];
        mount(host, esqueleto());
        let hoja = null;
        try { hoja = (await import(archivo))[nombre]; } catch (e) { console.error(e); }
        if (!alive() || !host.isConnected) return;
        if (typeof hoja !== 'function') return mount(host, html`${fallo({ titulo: `No pude abrir ${t.nombre}`, linea: 'Recarga la página; si sigue igual, lo que ya tengas se trabaja en el Chat.' })}`);
        return hoja(host, { me, slug, b, alive, resto });
      }
      case 'brandBoard': {
        if (b.personal) return meBrand(host, { me, sub: resto, alive, embed: { base, only: ['roadmap', 'asociaciones'] } });
        const acc = await col('accounts').get('acc-' + b.slug).catch(() => null);
        if (!alive() || !host.isConnected) return;
        return brandBoard({ el: host, me, id: b.slug, name: b.name, edit: canEdit(me, 'clients'), business: true, folder: acc?.assets || '' });
      }
      case 'design': return designSystemUI(host, { me, b, alive });
      case 'disenoChat': return disenoChat(host, { me, sub: [slug, ...resto], alive, brands: contextoLista() });
      case 'creacion': return creacionUI(host, { me, b, alive, rest: resto });
      case 'video': return videoUI(host, { me, b, alive });
      case 'brief': return brandBrief(host, { me, b, alive });
      case 'brandHome': return brandHome(host, { me, b, alive });
      default: return mount(host, ficha(t));
    }
  }
}
