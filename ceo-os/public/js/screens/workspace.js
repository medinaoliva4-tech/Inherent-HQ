// La página de un workspace: #/ws/<ws>/<cliente>/<pestaña>[/<herramienta>[/<resto>]]. Arriba las pestañas del workspace, el
// hero del cliente (monograma, nivel, etapa si aplica, aprobación y el flujo compartido) y «Continuar en el Chat». Abajo, la
// grilla de herramientas de la pestaña (nombre, qué produce, estado, último entregable, viene de / va a); el Overview suma el
// resumen del cliente en ese workspace, todas las herramientas por pestaña y la siguiente acción. Con una herramienta en la
// ruta, se monta su módulo (la tabla de montaje que antes vivía en la portada de Marcas) o, si es «Pronto», su ficha: qué recibe, qué
// produce, a qué alimenta y su prioridad. Sin cliente, el selector de contexto en grande. Los permisos los pone el servidor:
// aquí solo se refleja (puedeWs, puede() de cada herramienta y modulesFor de brandlist.js).
import { html, mount, col, api, ico, initials, skel, $, fdate, today } from '../core.js';
import { WORKSPACES, FLUJO, wsDe, pestanaDe, herramientaDe, deWorkspace, cadena, rutaHerramienta, puedeWs } from '../herramientas.js';
import { cargarContexto, contextoLista, contextoActual, ponerContexto, selectorHtml } from '../contexto.js';
import { abrirEnChat } from '../areas.js';
import { modulesFor } from '../brandlist.js';
import { estadoDe, separar, nombreDe } from '../element.js';
import { etapaLabel, etapaDe } from '../estrategia.js';
import { canEdit } from '../roleviews.js';
import { panelViva } from '../estrategia-viva-ui.js';
import { render as content, bullseyeTool } from './content.js';
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
import { adsUI } from '../ads-ui.js';
import { techUI } from '../tech-ui.js';

export const esqueleto = () => skel('pagina');

const EST = { lista: 'Lista', parcial: 'Parcial', pronto: 'Pronto' };
// Un paso de FLUJO puede ser un texto o { id, nombre }; la pestaña guarda su paso igual.
const pasoId = (p) => (p && typeof p === 'object' ? p.id : p);
const pasoNombre = (p) => (p && typeof p === 'object' ? p.nombre || p.id : FLUJO.find((f) => f.id === p)?.nombre || p);
const nomTool = (id) => herramientaDe(id)?.nombre || id;
const herr = (x) => (typeof x === 'string' ? herramientaDe(x) : x);
// Qué módulo de Marcas monta cada clave de montaje: modulesFor(me, b) sigue diciendo si el perfil lo abre.
const MOD_LEGADO = { brandHome: 'inicio', avatar: 'icp', brief: 'brief', research: 'investigacion', plan: 'plan', calendario: 'calendario', campanas: 'campanas', tech: 'tech', ads: 'ads', analytics: 'resultados', brandBoard: 'marca', ideas: 'ideas', design: 'design', creacion: 'creacion', video: 'video' };
// El ciclo de Production (un ciclo por marca y mes): en qué fase cae el día de hoy.
const CICLO = [[1, 3, 'brief'], [4, 5, 'coordinar'], [6, 10, 'grabar'], [11, 11, 'último día de grabación'], [12, 15, 'editar'], [16, 19, 'cambios'], [20, 20, 'presentar']];
const diaCiclo = (dia) => (dia > 20 ? 'Ciclo del mes cerrado · se presentó el 20' : `Día ${dia} del ciclo · ${(CICLO.find(([a, z]) => dia >= a && dia <= z) || [])[2] || ''}`);
const porAprobar = (p) => estadoDe(p) === 'En revisión' || (p.por_aprobar === true && estadoDe(p) === 'En proceso');

export async function render(el, { me, sub = [], alive }) {
  const [ws0, slug0, pest0, tool0, ...resto] = sub;
  const W = wsDe(ws0 || '');
  if (!W) return mount(el, html`<div class="empty ws-vacio"><b>Ese workspace no existe</b>Elige uno:<div class="ws-links">${WORKSPACES.map((w) => html`<a class="btn ghost sm" href="#/ws/${w.id}">${ico(w.icono, 14)} ${w.nombre}</a>`)}</div></div>`);
  const ws = W.id;
  if (!puedeWs(me, ws)) return mount(el, html`<div class="empty"><b>Tu perfil no abre ${W.nombre}</b>Pídele al CEO acceso en Equipo → Vistas por rol.</div>`);
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
  if (slug === 'personal' && (me.role !== 'ceo' || !b)) return mount(el, html`${cab}<div class="empty"><b>La marca personal es solo del CEO</b>Tu perfil no la ve.</div>`);
  if (!b) return mount(el, html`${cab}<div class="empty"><b>No encontré ese cliente</b>Puede que no esté entre tus clientes o que ya no esté activa.</div><div class="ws-vacio">${selectorHtml(me, { grande: true })}</div>`);
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
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-ws="chat"]')) return abrirEnChat(me.email, { modo: W.modo, slug });
    // La tarjeta entera lleva a la herramienta; los links de adentro (viene de / va a) siguen siendo links.
    const card = e.target.closest('.tool-card[data-href]');
    if (card && !e.target.closest('a')) location.hash = card.dataset.href;
  });
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
    </header>
    <ol class="ws-flujo" aria-label="El flujo del trabajo">${FLUJO.map((p) => html`<li class="${pasoId(p) === pasoId(pestana.paso) ? 'on' : ''}">${pasoNombre(p)}</li>`)}</ol>`;
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
      <div class="tool-card-ult"><span class="mut sm">Último entregable: —</span><span class="mut sm">⚠️ SIN DATOS: saldrá de deliverables (Fase 2)</span></div>
      <div class="tool-card-chips">${chipsDe('viene de', t.viene_de)}${chipsDe('va a', t.va_a)}</div></article>`;
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
    mount(box, html`<section class="ws-sec" id="ws-resumen"><div id="ws-res"></div></section>${siguiente()}
      ${W.pestanas.map((p) => { const ts = visibles(p); return ts.length ? seccion(html`<a href="${rutaPest(p)}">${p.nombre}</a>`, pasoNombre(p.paso), grilla(ts)) : ''; })}`);
    const r = $('#ws-res', box);
    if (ws === 'strategy') return resumenStrategy(r);
    if (ws === 'marketing') return brandHome(r, { me, b, alive });
    if (ws === 'creative') return brandBrief(r, { me, b, alive });
    if (ws === 'consulting') return consultingOverview(r, { me, slug, alive, cabecera: false });
    if (ws === 'production') return delivery(r);
  }
  function resumenStrategy(r) {
    if (!est) return mount(r, html`<div class="empty sm"><b>No pude leer la estrategia</b>Puede que tu perfil no vea Estrategia o que este cliente no tenga carpeta todavía.</div>`);
    return mount(r, html`<div class="ws-sec-h"><h2>La estrategia en vivo</h2><span class="mut sm">Solo lectura: se trabaja en Business X-Ray, Offer Architect y Growth Roadmap</span></div>
      <div class="lp-viva">${panelViva({ v: est.viva || {}, data: { ...est, slug }, bid: 'diagnostico', editable: false, esCeo: me.role === 'ceo', aprobada: Boolean(est.vivaAprobada) })}</div>`);
  }

  // ---------- Una pestaña: lo extra arriba y su grilla ----------
  async function pagina(box) {
    mount(box, html`<div id="ws-extra"></div>${seccion(pestana.nombre, pasoNombre(pestana.paso), grilla(visibles(pestana)))}`);
    const x = $('#ws-extra', box);
    if (ws === 'creative' && pestana.id === 'brief') return brandBrief(x, { me, b, alive });
    if (ws === 'creative' && pestana.id === 'review') return revision(x);
    if (ws === 'production' && pestana.id === 'delivery') return delivery(x);
    if (ws === 'marketing' && pestana.id === 'audience') return mount(x, seccion('De Strategy, en solo lectura', 'La diana y los avatares se editan en Strategy; aquí se leen', html`<div class="ws-links"><a class="btn ghost sm" href="#/ws/strategy/${slug}/research/customer-bullseye">${ico('target', 14)} Ver la diana en Strategy</a><a class="btn ghost sm" href="#/ws/strategy/${slug}/research/customer-avatar-studio">${ico('eye', 14)} Avatares aprobados</a></div>`));
  }
  // Las piezas que el equipo mandó a aprobar (lista simple sobre content).
  async function piezasRevision() {
    const all = await col('content').list().catch(() => []);
    return separar(all.filter((c) => c.kind === 'post' && c.profile === slug)).vivos.filter(porAprobar).sort((a, z) => String(a.date || '9').localeCompare(String(z.date || '9')));
  }
  function listaPiezas(xs, vacio) { return (xs.length ? html`<ul class="ws-lista">${xs.map((p) => html`<li><span>${nombreDe(p, b.name)}</span><span class="mut sm">${p.format || ''}${p.date ? ` · ${fdate(p.date)}` : ' · sin fecha'}</span></li>`)}</ul>` : html`<div class="empty sm"><b>Nada por aprobar</b>${vacio}</div>`); }
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
      <p class="mut sm">Llega en la Fase ${ws === 'consulting' ? '2' : '3'}. Mientras, lo que ya tengas se trabaja en el Chat.</p>
      <button type="button" class="btn" data-ws="chat">${ico('chat-ia', 14)} Continuar en el Chat</button></section>`;
  }
  async function herramienta(box, t) {
    const base = `#/ws/${ws}/${slug}/${pestana.id}/${t.id}`;
    mount(box, html`${head(t)}<div id="ws-tool"></div>`);
    const host = $('#ws-tool', box);
    if (!puede(t)) return mount(host, html`<div class="empty"><b>Tu perfil no abre esta herramienta</b>Pídele al CEO acceso en Equipo → Vistas por rol.</div>`);
    if (t.estado === 'pronto' || !t.monta) return mount(host, ficha(t));
    const mod = t.monta === 'ideas' && resto[0] === 'formatos' ? 'formatos' : MOD_LEGADO[t.monta];
    if (mod && !modulesFor(me, b).includes(mod)) return mount(host, html`<div class="empty"><b>Tu perfil no abre esta herramienta</b>${b.personal ? 'En la marca personal no aplica.' : 'Pídele al CEO acceso a Contenido o a Clientes en Equipo → Vistas por rol.'}</div>`);
    const common = { me, alive, fixed: b.slug };
    const embed = (h, only, extra = {}) => { h.dataset.island = '1'; return content(h, { ...common, sub: [only], embed: { base, only: [only], brand: b.name, ...extra } }); };
    switch (t.monta) {
      case 'bullseye': return bullseyeTool(host, { slug, me, alive });
      case 'avatar': return avatarUI(host, { me, b, alive });
      case 'strategy': {
        const bloque = t.id === 'offer-architect' ? (['oferta', 'modelo', 'leads'].includes(resto[0]) ? resto[0] : 'oferta') : t.bloque_hz || 'diagnostico';
        return strategy(host, { me, sub: [slug, bloque], alive });
      }
      case 'research': return embed(host, 'research', { inspo: Boolean(b.personal), plat: resto[0] });
      case 'plan': return planMesUI(host, { me, b, alive, rest: resto });
      case 'calendario': return embed(host, 'calendario');
      case 'campanas': return campanasUI(host, { me, b, alive });
      case 'tech': { mount(host, html`<div class="ws-sec-h"><h2>Sitios y landings</h2></div><p class="mut sm" style="margin:0 0 14px">El Funnel Builder llega en la Fase 3; mientras, aquí viven los sitios y landings.</p><div id="ws-tech"></div>`); return techUI($('#ws-tech', host), { me, b, alive }); }
      case 'ads': return adsUI(host, { me, b, alive });
      case 'analytics': return embed(host, 'analytics');
      case 'brandBoard': {
        if (b.personal) return meBrand(host, { me, sub: resto, alive, embed: { base, only: ['roadmap', 'asociaciones'] } });
        const acc = await col('accounts').get('acc-' + b.slug).catch(() => null);
        if (!alive() || !host.isConnected) return;
        return brandBoard({ el: host, me, id: b.slug, name: b.name, edit: canEdit(me, 'clients'), business: true, folder: acc?.assets || '' });
      }
      case 'ideas': {
        const f = resto[0] === 'formatos';
        mount(host, html`<nav class="ws-sub-tabs" aria-label="Ideas o formatos"><a class="${f ? '' : 'on'}" href="${base}">Ideas</a><a class="${f ? 'on' : ''}" href="${base}/formatos">Formatos</a></nav><div id="ws-ideas"></div>`);
        const h = $('#ws-ideas', host);
        return f ? formatosUI(h, { me, b, alive }) : embed(h, 'postear');
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
