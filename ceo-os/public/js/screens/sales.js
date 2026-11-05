import { html, raw, mount, col, api, drawer, closeDrawer, ask, toast, acts, confirmAsk, Q, USD, fdate, fdateLong, today, $, $$, emblem , wizard, teamList, swap, ico, WORK_ROLES, roleName, isSummary, canEdit, roChip } from '../core.js';
import { hoursAt, svcHours, svcCost, svcPrice, svcAuto, pricesOf, marginOf, GROWTH, growthText, includesAt, daysAt } from '../cycle.js';
import { newProject } from '../create.js';
import { levelName } from '../levels.js';
import { createCatalog, CATS, lvName } from '../catalogo.js';
import { FLOW, stageLabel, flowIndex, isWaiting, createdAt, waitMs, waitTone, durText, salesMetrics, AFTER_REPLY, updateWaits } from '../ventas-flujo.js';
import { layaBox, juzgarLocal } from '../laya-ui.js';
import { PROB, estancado, sinSiguiente, ganadoEn, tasasReales, cascada, llevamos, pronostico, habilesQuedan, KINDS } from '../ventas-meta.js';
// Los símbolos de las listas inteligentes y del volumen, como íconos de línea del set del OS.
const GLIFO = { '◎': 'target', '!': 'alert', '◷': 'clock', '⚑': 'cal', '▲': 'flame', '⚡': 'bolt', '✓': 'check', '×': 'x', '✉': 'mail', '☎': 'phone', '↻': 'repeat', '▤': 'doc' };

const STAGES = ['Prospecto', 'Nuevo', 'Contactado', 'Reunión', 'Propuesta', 'Ganado', 'Perdido'];
const BOARD = STAGES.slice(1); // el tablero: los prospectos tienen su bandeja aparte
const OPEN = ['Nuevo', 'Contactado', 'Reunión', 'Propuesta']; // abiertos: exigen siguiente paso y fecha
const LOST = ['precio', 'tiempo', 'no era el momento', 'se fue con otro', 'otro'];
const STAGEC = { Contactado: 'blue', Reunión: 'amber', Propuesta: 'green', Ganado: 'dark', Perdido: 'red' };
const TAGS = { 'High ticket': 'dark', 'No contestó': 'red', 'Interesado': 'green', 'Cotizando': 'amber', 'Propuesta enviada': 'blue', 'Referido': 'lime', 'Frío': '' };
const SOURCES = ['WhatsApp', 'Instagram', 'Web', 'Referido', 'Evento', 'LinkedIn', 'Otro'];
const QSTATUS = { Borrador: 'amber', Enviada: 'blue', Aceptada: 'green', Rechazada: 'red' };

const score = (i) => html`<span class="score ${i >= 4 ? 'hot' : ''}">${[1, 2, 3, 4, 5].map((k) => html`<i class="${k <= (i || 0) ? 'on' : ''}"></i>`)}</span>`;
const tagChip = (t) => html`<span class="chip ${TAGS[t] ?? ''}" style="margin:2px">${t}</span>`;

export async function render(el, { me, sub, alive }) {
  const isCeo = me.role === 'ceo';
  const canProject = me.areas.includes('operations');
  // Vista por rol: «resumen» = los indicadores del CRM y los seguimientos vencidos; sin catálogo, precios ni cotizaciones.
  // «completo» lo ve todo sin cambiar nada; «edita» crea y mueve leads, servicios y cotizaciones.
  const resumen = isSummary(me, 'sales'), edit = canEdit(me, 'sales');
  const L = col('leads'), S = col('services'), C = col('quotes'), R = col('rates'), SRC = col('lead_sources');
  let [leads, services, quotes] = await Promise.all([L.list(), resumen ? [] : S.list(), resumen ? [] : C.list()]);
  let rates = null;
  if (isCeo) { rates = await R.get('default').catch(() => null); }
  let plans = null, plansErr = null;
  if (!resumen) api('repo/precios').then((r) => { plans = r; }).catch((e) => { plansErr = e.message; });

  // Ventas = conseguir y cerrar: CRM · Cotizaciones · Fuentes. El catálogo, los especialistas y los paquetes viven en
  // Servicios (sus rutas viejas, #/sales/cat · esp · pkg, redirigen allá: roleviews.js → MOVED).
  // Fuentes (con las claves de cada puerta de intake): solo el CEO; el servidor tampoco las entrega a nadie más.
  let tab = (resumen ? ['crm'] : ['crm', 'pros', 'quotes', ...(isCeo ? ['src'] : [])]).includes(sub[0]) ? sub[0] : 'crm';
  let crmView = (() => { try { return ['board', 'list', 'meta'].includes(localStorage.getItem('ventas.vista')) ? localStorage.getItem('ventas.vista') : 'board'; } catch { return 'board'; } })(), q = '', tagF = '', vistaF = 'abierto';
  // La meta de cada mes (la pone el CEO): settings › ventas_meta = { meses: { 'AAAA-MM': usd }, ticket }.
  let metaDoc = await col('settings').get('ventas_meta').catch(() => null);

  // ---------- costos (solo CEO) ----------
  const rateOf = (role) => rates?.roles?.find((r) => r.role === role)?.rate ?? null;
  // Costo = horas de cada rol en el nivel del servicio (5 sencillo · 10 fuerte) × su costo por hora.
  const costOf = (s, lv) => svcCost(s, rates, lv);
  const hours = (s) => svcHours(s);
  // Precio de un servicio en un nivel: el automático (horas × costo/h × multiplicador × complejidad) o, si se fijó uno, ese.
  const priceAt = (s, lv) => (isCeo && rates && !s.price_fixed && !(s.price && !s.prices) ? svcAuto(s, rates, lv) : null) ?? svcPrice(s, lv);
  // Lo que incluye y cuánto tarda un servicio en un nivel (para la cotización y su PDF).
  const incHtml = (sv, lv) => html`${daysAt(sv, lv) ? html`<div><b style="font-weight:500">${ico('clock')} ${daysAt(sv, lv)} días hábiles</b></div>` : ''}${includesAt(sv, lv).length ? html`<ul style="margin:4px 0 0 18px;padding:0">${includesAt(sv, lv).map((x) => html`<li>${x}</li>`)}</ul>` : ''}`;
  const autoDays = (doc) => Math.max(0, ...doc.items.map((i) => { const sv = services.find((x) => x.id === i.service_id); return sv ? daysAt(sv, i.level || sv.level || 5) || 0 : 0; }));
  // El tiempo total se puede escribir a mano (hay servicios que no se hacen en paralelo); si no, sale del servicio más largo.
  const quoteDays = (doc) => (+doc.days > 0 ? +doc.days : autoDays(doc));
  // ---------- layout ----------
  function paint() {
    mount(el, html`
      <div class="hello row" style="align-items:flex-end"><div><h1>Ventas</h1><p>Cada lead, calificado y con <em>su siguiente paso</em>.</p></div><div class="sp"></div>${roChip(me, 'sales')}</div>
      <div class="row" style="margin-bottom:18px;flex-wrap:wrap">
        ${resumen ? '' : html`<div class="tabs" style="margin:0">
          <button class="${tab === 'crm' ? 'on' : ''}" data-act="tab" data-t="crm">CRM</button>
          <button class="${tab === 'pros' ? 'on' : ''}" data-act="tab" data-t="pros">Prospectos${leads.filter((l) => l.stage === 'Prospecto' && !l.archived).length ? html` <span class="mut">${leads.filter((l) => l.stage === 'Prospecto' && !l.archived).length}</span>` : ''}</button>
          <button class="${tab === 'quotes' ? 'on' : ''}" data-act="tab" data-t="quotes">Cotizaciones</button>
          ${isCeo ? html`<button class="${tab === 'src' ? 'on' : ''}" data-act="tab" data-t="src">Fuentes</button>` : ''}
        </div>`}
        <div class="sp"></div>
        ${tab === 'crm' && edit ? html`<button class="btn" data-act="newLead">+ Nuevo lead</button>` : ''}
        ${tab === 'quotes' && edit ? html`<button class="btn" data-act="newQuote">+ Nueva cotización</button>` : ''}
        ${tab === 'src' && isCeo ? html`<button class="btn" data-act="newSrc">+ Fuente</button>` : ''}
      </div>
      <div id="body"></div>`);
    const body = $('#body', el);
    if (resumen) return crmResumen(body);
    ({ crm, pros: prosTab, quotes: quotesTab, src: srcTab })[tab](body);
  }
  // ---------- El resumen del CRM: los indicadores y lo que requiere acción (vencidos y lo de hoy) ----------
  function crmResumen(body) {
    const T = today();
    const pipe = leads.filter((l) => (l.stage || 'Nuevo') !== 'Prospecto'), open = pipe.filter((l) => OPEN.includes(l.stage || 'Nuevo'));
    const pros = leads.filter((l) => l.stage === 'Prospecto' && !l.archived);
    const late = open.filter(isLate).sort(byUrgency), hoy = open.filter((l) => l.next_date === T);
    const row = (l, chip) => html`<div class="wkrow" data-act="lead" data-id="${l.id}"><span class="grow"><b style="font-weight:500">${l.name}</b><span class="mut sm"> · ${l.next_step || 'Sin siguiente paso'} · ${roleLabel(l.owner_role)}</span></span>${chip}</div>`;
    const m = salesMetrics(leads);
    mount(body, html`${topNums(m)}${inbox(m.waiting)}
      <div class="grid g4" style="margin-bottom:18px">
        <div class="card glass"><span class="mut sm">Leads abiertos</span><div class="big" style="font-size:42px">${open.length}</div></div>
        <div class="card glass"><span class="mut sm">Calientes ${ico('flame')}</span><div class="big" style="font-size:42px">${open.filter((l) => (l.interest || 0) >= 4).length}</div></div>
        <div class="card glass"><span class="mut sm">Seguimiento vencido</span><div class="big" style="font-size:42px${late.length ? ';color:var(--warn)' : ''}">${late.length}</div></div>
        <div class="card glass"><span class="mut sm">Prospectos por contactar</span><div class="big" style="font-size:42px">${pros.length}</div></div>
      </div>
      <div class="sec-title"><h2>Seguimiento vencido</h2><span class="mut sm">Lo primero que hay que mover</span></div>
      <div class="card">${late.length ? late.slice(0, 30).map((l) => row(l, html`<span class="chip red sm2">Venció ${fdate(l.next_date)}</span>`)) : html`<div class="mut">Nada vencido ${ico('check', 14)}</div>`}</div>
      <div class="sec-title" style="margin-top:22px"><h2>Para hoy</h2></div>
      <div class="card">${hoy.length ? hoy.map((l) => row(l, html`<span class="chip amber sm2">${stageLabel(l.stage)}</span>`)) : html`<div class="mut">Sin seguimientos para hoy</div>`}</div>`);
  }

  // ---------- CRM ----------
  // Etapas: Prospecto (bandeja aparte, outbound) → Nuevo → Contactado → Reunión → Propuesta → Ganado / Perdido (con motivo).
  // Candados: un lead abierto no se guarda sin siguiente paso y fecha; el historial solo se agrega; el responsable es un rol.
  const T = today();
  const isLate = (l) => OPEN.includes(l.stage || 'Nuevo') && l.next_date && l.next_date < T;
  const roleLabel = (k) => roleName(k || 'ventas').split(' · ')[0];
  const byUrgency = (a, z) => (isLate(z) - isLate(a)) || String(a.next_date || '9').localeCompare(String(z.next_date || '9'));
  const nextDay = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
  const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const act = (text) => ({ at: new Date().toISOString(), who: me.name, text });
  const whenTxt = (d) => (d === T ? 'hoy' : d === nextDay() ? 'mañana' : fdate(d));
  const monthName = new Date().toLocaleDateString('es-GT', { month: 'long' });
  // ---------- El flujo de atención y cierre ----------
  // Arriba, tres números: sin responder · tiempo medio de primera respuesta del mes · propuestas abiertas.
  const topNums = (m) => html`<div class="sp-kpis vf-kpis">
      <div class="sp-kpi"><span class="lbl">Sin responder</span><b class="${m.unanswered ? 'vf-big ' + waitTone(m.oldestMs) : ''}">${m.unanswered}</b><span class="mut sm">${m.unanswered ? html`El más antiguo lleva <span data-wait="${createdAt(m.waiting[0])}" data-plain="1">${durText(m.oldestMs)}</span>` : 'Todo respondido'}</span></div>
      <div class="sp-kpi"><span class="lbl">Primera respuesta · ${monthName}</span><b>${m.avgReplyMs == null ? '—' : durText(m.avgReplyMs)}</b><span class="mut sm">${m.replied ? `Promedio de ${m.replied} lead${m.replied === 1 ? '' : 's'} · la meta es 1 min` : 'Sale de los leads que entran este mes'}</span></div>
      <div class="sp-kpi"><span class="lbl">Propuestas abiertas</span><b>${m.proposals}</b><span class="mut sm">${m.proposalsUsd ? `${USD(m.proposalsUsd)} / mes en juego` : 'Con el alcance delante'}</span></div>
    </div>`;
  // Los leads nuevos que esperan la primera respuesta, con su cronómetro: verde antes del minuto, ámbar antes de 15, rojo después.
  const timer = (l) => html`<span class="vf-timer ${waitTone(waitMs(l))}" data-wait="${createdAt(l)}" title="Desde que entró">${durText(waitMs(l))}</span>`;
  const inbox = (ws) => (!ws.length ? '' : html`<section class="vf-inbox"><div class="vf-inbox-h"><b>Sin responder</b><span class="mut sm">Al primer contacto se responde en un minuto</span></div>
      ${ws.map((l) => html`<div class="wkrow" data-act="lead" data-id="${l.id}">${timer(l)}<span class="grow"><b style="font-weight:500">${l.name}</b><span class="mut sm"> · ${[l.source, l.contact || l.phone || (l.ig ? '@' + l.ig : '')].filter(Boolean).join(' · ') || 'Sin fuente'}</span></span>${edit ? html`<button class="btn xs" data-act="replied" data-id="${l.id}">Ya respondí</button>` : ''}</div>`)}</section>`);
  // La tira del cierre: cada paso con lo que toca hacer y su fecha más próxima. Tocar un paso filtra la lista.
  let stageF = '';
  const strip = (pipe) => html`<div class="vf-strip" role="list" aria-label="Etapas del cierre">${FLOW.map((f, i) => {
    const ls = pipe.filter((l) => f.keys.includes(l.stage || 'Nuevo')), op = ls.filter((l) => OPEN.includes(l.stage || 'Nuevo'));
    const late = op.filter(isLate).length, next = op.filter((l) => l.next_date && l.next_date >= T).sort((a, z) => a.next_date.localeCompare(z.next_date))[0];
    const won = ls.filter((l) => l.stage === 'Ganado').length;
    return html`<button class="vf-step ${stageF === f.id ? 'on' : ''}" role="listitem" data-act="stageF" data-f="${f.id}" aria-pressed="${stageF === f.id ? 'true' : 'false'}">
        <span class="vf-top"><span class="vf-n">${i + 1}</span><span class="vf-c">${ls.length}</span></span>
        <span class="vf-l">${f.label}</span>${f.hint ? html`<span class="vf-h">${f.hint}</span>` : ''}
        <span class="vf-s">${f.step}</span>
        <span class="vf-d ${late ? 'late' : ''}">${f.id === 'cierre' ? `${won} ganado${won === 1 ? '' : 's'} · ${ls.length - won} perdido${ls.length - won === 1 ? '' : 's'}` : late ? `${late} vencido${late === 1 ? '' : 's'}` : next ? `Próximo: ${whenTxt(next.next_date)}` : 'Sin pendientes'}</span></button>`; })}</div>`;
  // «Ya respondí»: guarda la hora de la primera respuesta, lo pasa a Respondido y propone el siguiente paso.
  async function replied(l) {
    const cur = leads.find((x) => x.id === l.id) || l;
    if (!isWaiting(cur)) { toast('Ese lead ya tenía respuesta'); return null; }
    const at = new Date().toISOString(), took = durText(Date.parse(at) - createdAt(cur));
    const patch = { first_reply_at: at }, notes = [`Primera respuesta · a los ${took}`];
    if ((cur.stage || 'Nuevo') === 'Nuevo') {
      patch.stage = 'Contactado'; notes.push(`Etapa: Nuevo → ${stageLabel('Contactado')}`);
      if (!cur.next_step || /^(responder|primer mensaje)/i.test(cur.next_step) || !cur.next_date || cur.next_date < T) { patch.next_step = AFTER_REPLY; patch.next_date = cur.next_date && cur.next_date > T ? cur.next_date : T; notes.push(`Siguiente paso: ${patch.next_step} · ${patch.next_date}`); }
    }
    return saveLead({ ...cur, ...patch, activity: [...(cur.activity || []), ...notes.map(act)] }, `Respondido en ${took}`);
  }
  // ---------- La meta del mes (HubSpot: pronóstico ponderado; Pipedrive: metas) ----------
  const MES = T.slice(0, 7);
  const metaMes = () => +(metaDoc?.meses?.[MES]) || 0;
  async function guardarMeta(cambio) {
    const next = { ...(metaDoc || { id: 'ventas_meta' }), ...cambio };
    try { metaDoc = metaDoc?.v ? await col('settings').save(next) : await col('settings').create(next); toast('Guardado'); paint(); } catch (e) { toast(e.message, true); }
  }
  async function editarMeta() {
    if (!isCeo) return toast('La meta la pone el CEO', true);
    const v = await ask('La meta de este mes', [{ k: 'm', l: 'Ventas nuevas este mes (USD al mes, como el valor de los leads)', t: 'number', v: metaMes() || '', req: true }]);
    if (v) guardarMeta({ meses: { ...(metaDoc?.meses || {}), [MES]: +v.m } });
  }
  function metaStrip() {
    const meta = metaMes(), y = llevamos(leads, MES), fc = pronostico(leads), sup = tasasReales(leads), ganado = y.ganado;
    const pct = (x) => (meta ? Math.min(100, Math.round((x / meta) * 100)) : 0);
    return html`<section class="vx-goal"><div><div class="row"><b>${meta ? html`Meta de ${new Date(T + 'T12:00').toLocaleDateString('es', { month: 'long' })} · ${USD(meta)} en ventas nuevas` : 'Sin meta este mes'}</b><div class="sp"></div>${isCeo ? html`<button class="sm wslink" data-act="metaEdit">${meta ? 'Cambiar' : 'Poner la meta'}</button>` : ''}</div>
        <div class="vx-gbar"><span class="won" style="width:${pct(ganado)}%"></span><span class="fc" style="left:${pct(ganado)}%;width:${Math.max(0, Math.min(100 - pct(ganado), pct(fc)))}%"></span></div>
        <div class="vx-leg"><span><i class="won"></i> Ganado ${ganado ? USD(ganado) : '—'}</span><span><i class="fc"></i> Pronóstico ${fc ? USD(Math.round(fc)) : '—'}</span>${meta ? html`<span>Falta ${USD(Math.max(0, meta - ganado))}</span>` : ''}</div></div>
      <div class="vx-k"><small>Pronóstico ponderado</small><b>${fc ? USD(Math.round(fc)) : '—'}</b><small>${fc ? 'valor × probabilidad de su etapa' : 'Sale del valor de cada lead abierto × la probabilidad de su etapa'}</small></div>
      <div class="vx-k"><small>Cierre de propuestas · 90 días</small><b>${sup.cierre != null ? `${Math.round(sup.cierre * 100)}%` : '—'}</b><small>${sup.cierre != null ? `de cada 10 propuestas, cierran ${Math.round(sup.cierre * 10)}` : 'Faltan datos (3 propuestas o más)'}</small></div>
      <div class="vx-k"><small>Ticket promedio · 90 días</small><b>${sup.ticket ? USD(Math.round(sup.ticket)) : '—'}</b><small>${sup.ticket ? 'de lo ganado' : 'Sin ventas ganadas todavía'}</small></div></section>`;
  }
  function metaView() {
    const meta = metaMes(), sup = tasasReales(leads), y = llevamos(leads, MES), dias = habilesQuedan();
    const ticket = sup.ticket || (metaDoc?.ticket ? +metaDoc.ticket : null);
    const c = cascada(meta, { ...sup, ticket });
    const tasa = (x, real) => html`<b>${x != null ? `${Math.round(x * 100)}%` : '—'}</b> <span class="${real ? 'vx-real' : 'mut sm'}">${real ? 'real · 90 días' : 'de arranque'}</span>`;
    if (!meta) return html`<div class="card vx-meta-empty"><b>Pon la meta del mes</b><p class="mut">Con la meta, la calculadora te dice cuántas ventas, propuestas, conversaciones, leads y mensajes de outreach hacen falta, y cuánto llevas.</p>${isCeo ? html`<button class="btn" data-act="metaEdit">Poner la meta</button>` : html`<p class="mut sm">La pone el CEO.</p>`}</div>`;
    if (!c) return html`<div class="card vx-meta-empty"><b>Falta el ticket promedio</b><p class="mut">Todavía no hay ventas ganadas para calcularlo. ${isCeo ? 'Escríbelo a mano:' : 'El CEO lo puede escribir a mano.'}</p>${isCeo ? html`<button class="btn" data-act="ticketEdit">Escribir el ticket</button>` : ''}</div>`;
    const niveles = [['ventas', 'Ventas', 'clientes nuevos', '#2f7a4d'], ['propuestas', 'Propuestas', 'con alcance delante', '#a8503a'], ['conversaciones', 'Conversaciones', 'entendiendo el caso', '#8a6fb0'], ['leads', 'Leads', 'que entraron este mes', '#c49a3c'], ['outreach', 'Outreach', 'mensajes a prospectos', '#7d8fb0']];
    // Lo que más falta: el nivel con menos avance; si empatan, el de más abajo (el outreach mueve todo lo demás).
    const peor = niveles.map(([k], n) => [k, c[k] ? y[k] / c[k] : 1, n]).sort((a, z) => a[1] - z[1] || z[2] - a[2])[0];
    const hoyN = new Date(T + 'T12:00'), finMes = new Date(hoyN.getFullYear(), hoyN.getMonth() + 1, 0).getDate();
    const ritmo = y.ganado ? Math.round((y.ganado / hoyN.getDate()) * finMes) : 0;
    const sem = Object.fromEntries(niveles.map(([k]) => [k, Math.ceil((Math.max(0, c[k] - y[k]) / dias) * 5)]));
    const lunes = new Date(Date.now() - ((new Date().getDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
    const abiertos = leads.filter((l) => OPEN.includes(l.stage || 'Nuevo'));
    const card = (ic, color, titulo, val, de, extra = '') => html`<div class="vx-a"><div class="vx-ah"><i style="color:${color}">${ico(GLIFO[ic] || 'dot', 16)}</i>${titulo}</div><div class="vx-av"><b>${val}</b><span>${de}</span></div>${extra}</div>`;
    const barras = (ks, color) => html`<div class="vx-week" aria-label="Lunes a viernes">${[0, 1, 2, 3, 4].map((d) => { const n = ks.reduce((a, k) => a + (y.porDia[k]?.[d] || 0), 0); return html`<i style="height:${Math.min(100, 10 + n * 14)}%;background:${n ? color : 'var(--hair)'}"></i>`; })}</div>`;
    const avg = salesMetrics(leads).avgReplyMs;
    return html`<div class="vx-metalay"><section class="card vx-calc"><span class="lbl">La meta de este mes · ${isCeo ? 'tócala para cambiarla' : 'la pone el CEO'}</span>
        <div class="vx-metain">${isCeo ? html`<button type="button" class="vx-big" data-act="metaEdit">${USD(meta)}</button>` : html`<b class="vx-big">${USD(meta)}</b>`}<span class="mut">en ventas nuevas · quedan ${dias} días hábiles</span></div>
        <div class="vx-in3"><div class="vx-in"><small>Ticket promedio</small><b>${USD(Math.round(ticket))}</b> <span class="${sup.ticket ? 'vx-real' : 'mut sm'}">${sup.ticket ? 'real · 90 días' : 'escrito a mano'}</span></div><div class="vx-in"><small>Cierre de propuestas</small>${tasa(sup.cierre ?? 0.25, sup.cierre != null)}</div><div class="vx-in"><small>De conversación a propuesta</small>${tasa(sup.aPropuesta ?? 0.5, sup.aPropuesta != null)}</div></div>
        <span class="lbl">De la meta para atrás · lo que hace falta vs. lo que llevas</span>
        <div class="vx-fn">${niveles.map(([k, t, sb, color]) => { const need = c[k], have = y[k], falta = Math.max(0, need - have); return html`<div class="vx-fr"><div><b>${t}</b><small>${sb}</small></div><div class="vx-trk"><i style="width:${Math.min(100, need ? (have / need) * 100 : 0)}%;background:${color}"></i><span>${have} de ${need}</span></div><div class="vx-n">${falta ? html`<b class="${have / need < 0.5 ? 'bad' : 'am'}">faltan ${falta}</b><small>${Math.ceil(falta / dias)} por día</small>` : html`<b class="ok">✓ listo</b>`}</div></div>`; })}</div>
        <div class="vx-tip">⚑ ${y.ganado ? html`Con el ritmo de hoy llegas a <b>${USD(ritmo)}</b> (${Math.round((ritmo / meta) * 100)}%). ` : ''}Lo que más falta es <b>${niveles.find(([k]) => k === peor[0])[1].toLowerCase()}</b>${c[peor[0]] - y[peor[0]] > 0 ? html`: ${Math.ceil((c[peor[0]] - y[peor[0]]) / dias)} al día cierran la diferencia` : ''}.</div>
        <p class="mut sm">Los supuestos «de arranque» se cambian solos por los reales cuando haya 3 propuestas o más en 90 días.</p></section>
      <section class="card vx-vol"><span class="lbl">El volumen · lo que nos mueve esta semana</span><div class="vx-acts">
        ${card('✉', '#3f6ea8', 'Mensajes de outreach', y.semana.outreach, `de ${sem.outreach} esta semana`, barras(['outreach'], '#3f6ea8'))}
        ${card('☎', '#2f7a4d', 'Llamadas y reuniones', y.semana.llamada + y.semana.reunion, 'esta semana', barras(['llamada', 'reunion'], '#2f7a4d'))}
        ${card('⚡', '#a8503a', 'Primera respuesta', avg != null ? durText(avg) : '—', 'promedio del mes · meta 1 min')}
        ${card('↻', '#9a7414', 'Seguimientos a tiempo', abiertos.length ? `${Math.round((abiertos.filter((l) => !isLate(l)).length / abiertos.length) * 100)}%` : '—', `${abiertos.filter(isLate).length} vencidos`)}
        ${card('▤', '#7a5aa0', 'Propuestas enviadas', y.semana.propuesta + quotes.filter((x) => x.date && x.date >= lunes).length, `de ${sem.propuestas} esta semana`)}
        ${card('◎', 'var(--ui-ink2)', 'Pipeline abierto', USD(abiertos.reduce((a, l) => a + (+l.value_usd || 0), 0)), `${abiertos.length} tratos`)}
      </div><p class="mut sm">El volumen sale de lo que se anota: «+1 outreach» en Prospectos y, en cada lead, el tipo de cada nota (llamada, reunión, propuesta, seguimiento). Lo que no se anota, no cuenta.</p></section></div>`;
  }
  function crm(body) {
    const pipe = leads.filter((l) => (l.stage || 'Nuevo') !== 'Prospecto');
    const pros = leads.filter((l) => l.stage === 'Prospecto' && !l.archived);
    const open = pipe.filter((l) => OPEN.includes(l.stage || 'Nuevo'));
    const match = (l) => (!q || [l.name, l.company, l.contact, l.wants, l.notes, l.phone, l.email, l.ig, l.source].join(' ').toLowerCase().includes(q)) && (!tagF || (l.tags || []).includes(tagF));
    const inStage = (l) => !stageF || (FLOW.find((f) => f.id === stageF)?.keys || []).includes(l.stage || 'Nuevo');
    const filtered = pipe.filter((l) => match(l) && inStage(l)).sort(byUrgency);
    const m = salesMetrics(leads), pipeUsd = open.reduce((a, l) => a + (+l.value_usd || 0), 0), hot = open.filter((l) => (l.interest || 0) >= 4).length;
    const usedTags = [...new Set(pipe.flatMap((l) => l.tags || []))];
    const late = open.filter(isLate);
    // Listas inteligentes (como las Smart Views de Close): se llenan solas.
    const VISTAS = [['abierto', 'Todo abierto', 'var(--ui-ink2)', '◎', (l) => OPEN.includes(l.stage || 'Nuevo')], ['sinpaso', 'Sin siguiente paso', '#b4472f', '!', (l) => sinSiguiente(l)], ['estancados', 'Estancados', '#b4472f', '◷', (l) => estancado(l) > 0],
      ['hoy', 'Actividad hoy', '#c58a2b', '⚑', (l) => OPEN.includes(l.stage || 'Nuevo') && l.next_date && l.next_date <= T], ['calientes', 'Calientes', '#c2541f', '▲', (l) => OPEN.includes(l.stage || 'Nuevo') && (l.interest || 0) >= 4], ['responder', 'Por responder', '#3f6ea8', '⚡', (l) => m.waiting.includes(l)],
      ['ganados', 'Ganados este mes', '#2f7a4d', '✓', (l) => { const t = ganadoEn(l); return t != null && new Date(t).toISOString().slice(0, 7) === T.slice(0, 7); }], ['perdidos', 'Perdidos', '#9a8f80', '×', (l) => l.stage === 'Perdido']];
    const vf = VISTAS.find((v) => v[0] === vistaF) || VISTAS[0];
    const shown = filtered.filter(vf[4]);
    mount(body, html`${inbox(m.waiting)}${metaStrip()}
      <div class="row vx-bar"><div class="tabs" style="margin:0" role="tablist" aria-label="Vista">${[['board', 'Tablero'], ['list', 'Lista'], ['meta', 'Meta']].map(([k, l]) => html`<button class="${crmView === k ? 'on' : ''}" data-act="crmView" data-v="${k}">${l}</button>`)}</div>
        ${crmView !== 'meta' ? html`<input class="in" id="q" placeholder="Buscar lead…" value="${q}" style="max-width:260px">${usedTags.length ? html`<button class="chip ${tagF ? '' : 'dark'}" data-act="tagF" data-t="" style="padding:6px 12px">Todas las etiquetas</button>${usedTags.map((t) => html`<button class="chip ${tagF === t ? 'dark' : ''}" data-act="tagF" data-t="${t}" style="padding:6px 12px">${t}</button>`)}` : ''}` : ''}</div>
      ${crmView === 'meta' ? metaView() : html`<div class="vx"><aside class="vx-views"><span class="vx-h">Listas inteligentes</span>${VISTAS.map(([k, lab, c, ic, f], n) => html`${n === 6 ? html`<span class="vx-h">Cerrados</span>` : ''}<button type="button" class="vx-v ${vistaF === k ? 'on' : ''}" data-act="vista" data-k="${k}"><i style="color:${c}">${ico(GLIFO[ic] || 'dot', 15)}</i>${lab}<small class="${['sinpaso', 'estancados', 'responder'].includes(k) && filtered.filter(f).length ? 'r' : ''}">${filtered.filter(f).length}</small></button>`)}</aside><div class="vx-main">
      ${!pipe.length ? html`<div class="empty"><b>Todavía no hay leads</b>Crea el primero con «+ Nuevo lead», o conecta una fuente en «Fuentes».</div>`
      : crmView === 'list' ? html`<div class="card"><table><thead><tr><th>Lead</th><th>Interés</th><th>Etapa</th><th>Fuente</th><th>Responsable</th><th class="n">Valor / mes</th><th>Siguiente paso</th></tr></thead><tbody>
        ${shown.length ? '' : html`<tr><td colspan="7" class="mut">Nada en «${vf[1]}».</td></tr>`}${shown.map((l) => html`<tr class="click" data-act="lead" data-id="${l.id}"><td><b style="font-weight:500">${l.name}</b><div class="mut sm">${[l.contact, l.company].filter(Boolean).join(' · ')}</div>${(l.tags || []).length ? html`<div>${(l.tags || []).map(tagChip)}</div>` : ''}</td><td>${score(l.interest)}</td><td><span class="chip ${STAGEC[l.stage] ?? ''}">${stageLabel(l.stage)}</span>${l.stage === 'Perdido' && l.lost_reason ? html`<div class="mut sm">${l.lost_reason}</div>` : ''}</td><td class="sm">${l.source || '—'}</td><td class="sm">${roleLabel(l.owner_role)}</td><td class="n">${l.value_usd ? USD(l.value_usd) : '—'}</td><td class="sm" style="${isLate(l) ? 'color:var(--warn);font-weight:700' : ''}">${OPEN.includes(l.stage || 'Nuevo') ? html`${l.next_step || '—'}${l.next_date ? html`<div class="mut">${isLate(l) ? 'Venció el ' : ''}${fdate(l.next_date)}</div>` : ''}` : html`<span class="mut">—</span>`}</td></tr>`)}
        </tbody></table></div>`
      : html`<div class="vx-board">${BOARD.filter((x) => x !== 'Perdido' || vistaF === 'perdidos').map((st) => { const ls = shown.filter((l) => (l.stage || 'Nuevo') === st), sum = ls.reduce((a, l) => a + (+l.value_usd || 0), 0); return html`<div class="kcol vx-col" data-stage="${st}"><div class="vx-ch"><div class="row"><i class="vx-dot s-${st.replace(/[^a-z]/gi, '')}"></i><b>${stageLabel(st)}</b><span class="vx-p">${Math.round((PROB[st] ?? 0) * 100)}%</span></div><small>${ls.length}${sum ? ` · ${USD(sum)}` : ''}${FLOW.find((f) => f.keys.includes(st))?.step ? ` · ${FLOW.find((f) => f.keys.includes(st)).step}` : ''}</small></div>
          ${ls.map((l) => { const rot = estancado(l), late = isLate(l), sinp = sinSiguiente(l); return html`<div class="kcard vx-cd ${rot ? 'rot' : ''}" draggable="true" data-act="lead" data-id="${l.id}">${rot ? html`<span class="vx-rot">Sin tocar ${rot} día${rot === 1 ? '' : 's'}</span>` : ''}<div class="row" style="gap:6px;align-items:flex-start"><b>${l.name}</b><div class="sp"></div><span class="vx-val">${l.value_usd ? USD(l.value_usd) : ''}</span></div><small class="mut">${[l.source, l.contact].filter(Boolean).join(' · ') || levelName(l.wants) || ''}</small><div class="row" style="margin-top:2px">${score(l.interest)}</div>
            ${OPEN.includes(st) ? html`<div class="vx-nx ${sinp ? 'none' : late ? 'late' : 'ok'}">${sinp ? '! Sin siguiente paso · agéndalo' : `${late ? '◷ ' : '→ '}${l.next_step}${l.next_date ? ` · ${late ? 'venció ' : ''}${fdate(l.next_date)}` : ''}`}</div>` : st === 'Perdido' && l.lost_reason ? html`<small class="mut">${l.lost_reason}</small>` : ''}</div>`; })}</div>`; })}</div>`}</div></div>`}`);
    const qi = $('#q', body);
    if (qi) qi.oninput = () => { q = qi.value.toLowerCase(); const pos = qi.selectionStart; crm(body); const n = $('#q', body); n.focus(); n.setSelectionRange(pos, pos); };
    // drag & drop entre etapas: a Perdido pide el motivo; a una etapa abierta exige siguiente paso y fecha.
    $$('.kcard', body).forEach((c) => c.addEventListener('dragstart', (e) => e.dataTransfer.setData('id', c.dataset.id)));
    $$('.kcol', body).forEach((k) => {
      k.addEventListener('dragover', (e) => { e.preventDefault(); k.classList.add('over'); });
      k.addEventListener('dragleave', () => k.classList.remove('over'));
      k.addEventListener('drop', async (e) => {
        e.preventDefault(); k.classList.remove('over');
        const l = leads.find((x) => x.id === e.dataTransfer.getData('id'));
        if (!l || l.stage === k.dataset.stage) return;
        if (await moveLead(l, k.dataset.stage)) crm(body);
      });
    });
  }
  // ---------- Prospectos: buscar leads (Apify) y filtrarlos con Laya ----------
  let busq = null, encF = '', filtrando = false;
  const ENC = [['si', 'Encaja', 'ok'], ['talvez', 'Tal vez', 'am'], ['no', 'No encaja', 'bad']];
  const encDe = (items = []) => { const j = items.find((x) => x.question_id === 'encaja'); if (!j) return null; const a = String(j.answer ?? '').toLowerCase(); return /^(s[ií]|yes|true|encaja)/.test(a) ? 'si' : /^(no|false)/.test(a) ? 'no' : 'talvez'; };
  async function cargarBusq() { try { busq = await api('leads/buscar'); } catch (e) { busq = { error: e.message, busquedas: [] }; } }
  function prosTab(body) {
    const all = leads.filter((l) => l.stage === 'Prospecto' && !l.archived);
    const list = encF === 'sin' ? all.filter((l) => !l.laya_encaja) : encF ? all.filter((l) => l.laya_encaja === encF) : all;
    const corriendo = (busq?.busquedas || []).filter((x) => x.status === 'corriendo');
    mount(body, html`<section class="card vx-buscar"><div class="row"><b>${ico('search', 15)} Buscar leads</b><span class="mut sm">Con Apify, como Investigación. Lo que encuentra entra aquí abajo, sin repetir lo que ya está en Ventas.</span></div>
        ${busq === null ? html`<p class="mut sm">Cargando…</p>` : !busq.apify ? html`<p class="mut sm">El scraping no está conectado: falta APIFY_TOKEN en Vercel.</p>` : edit ? html`<form class="vx-bform" id="bform"><div class="tabs mini" style="margin:0" role="radiogroup" aria-label="Dónde buscar"><button type="button" class="on" data-act="bfuente" data-f="maps">Google Maps</button><button type="button" data-act="bfuente" data-f="instagram">Instagram</button></div>
          <input class="in" name="q" placeholder="Qué buscar · ej. restaurantes" required><input class="in" name="lugar" placeholder="Dónde · ej. zona 10, Guatemala"><select class="in" name="n" aria-label="Cuántos" style="width:auto">${[10, 20, 30, 50].map((n) => html`<option value="${n}" ${n === 20 ? raw('selected') : ''}>${n} resultados</option>`)}</select><button class="btn" type="submit">Buscar</button></form>
          <p class="mut sm" style="margin:0">Cada búsqueda gasta hasta US$1 de Apify y busca un máximo de ${busq.max || 50} resultados.</p>` : ''}
        ${(busq?.busquedas || []).length ? html`<div class="vx-blist">${busq.busquedas.slice(0, 6).map((x) => html`<div class="vx-bi"><span class="vx-bs ${x.status}">${x.status === 'corriendo' ? 'Buscando…' : x.status === 'listo' ? `${x.creados} nuevos` : 'Falló'}</span><span><b>${x.q}</b>${x.lugar ? ` · ${x.lugar}` : ''} <span class="mut sm">· ${x.fuente === 'maps' ? 'Google Maps' : 'Instagram'} · ${fdate(String(x.at).slice(0, 10))}${x.repetidos ? ` · ${x.repetidos} ya estaban` : ''}</span></span>${x.status === 'corriendo' && edit ? html`<button class="btn ghost xs" data-act="brecoger" data-id="${x.id}">Revisar</button>` : ''}</div>`)}</div>` : ''}</section>
      <div class="row vx-bar"><span class="lbl" style="margin:0">Filtrar con Laya</span><button class="chip ${encF ? '' : 'dark'}" data-act="encF" data-e="">Todos ${all.length}</button>${ENC.map(([k, l, c]) => html`<button class="chip ${encF === k ? 'dark' : ''}" data-act="encF" data-e="${k}"><i class="vx-ed ${c}"></i>${l} ${all.filter((x) => x.laya_encaja === k).length}</button>`)}<button class="chip ${encF === 'sin' ? 'dark' : ''}" data-act="encF" data-e="sin">Sin filtrar ${all.filter((x) => !x.laya_encaja).length}</button>
        <div class="sp"></div>${edit && all.some((x) => !x.laya_encaja) ? html`<button class="btn ghost xs" data-act="layaPros" ${filtrando ? raw('disabled') : ''}>${filtrando ? 'Laya está filtrando…' : `✦ Filtrar ${Math.min(20, all.filter((x) => !x.laya_encaja).length)} con Laya`}</button>` : ''}</div>
      ${prosView(list)}`);
    if (busq === null) cargarBusq().then(() => { if (alive() && tab === 'pros') prosTab(body); });
    if (corriendo.length) setTimeout(async () => { if (!alive() || tab !== 'pros') return; for (const x of corriendo) await recoger(x.id, true); }, 15000);
    const f = $('#bform', body); if (f) f.onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(f), fuente = $('[data-act="bfuente"].on', f)?.dataset.f || 'maps';
      try { const d = await api('leads/buscar', { method: 'POST', body: { fuente, q: fd.get('q'), lugar: fd.get('lugar'), n: +fd.get('n') } }); busq.busquedas = [d, ...busq.busquedas]; toast('Buscando… tarda de 1 a 3 minutos'); prosTab(body); } catch (er) { toast(er.message, true); }
    };
  }
  async function recoger(id, silencio = false) {
    try {
      const d = await api(`leads/buscar/${id}/recoger`, { method: 'POST', body: {} });
      busq.busquedas = busq.busquedas.map((x) => (x.id === id ? d : x));
      if (d.status === 'listo') { leads = await L.list(); toast(`${d.creados} prospectos nuevos`); } else if (d.status === 'fallo') toast('La búsqueda falló en Apify', true); else if (!silencio) toast('Todavía está buscando');
      if (alive() && tab === 'pros') prosTab($('#body', el));
    } catch (e) { if (!silencio) toast(e.message, true); }
  }
  // Laya juzga cada prospecto con la puerta «lead» (¿encaja con Inherent?): en el puente de tu compu o, si no está, queda pendiente.
  async function layaPros() {
    const sinF = leads.filter((l) => l.stage === 'Prospecto' && !l.archived && !l.laya_encaja).slice(0, 20);
    filtrando = true; prosTab($('#body', el)); let hechos = 0, pend = 0;
    for (const l of sinF) {
      try {
        const t = await api(`laya/texto?coll=leads&id=${encodeURIComponent(l.id)}`);
        let r;
        try { r = await api('laya/juicios', { method: 'POST', body: { coll: 'leads', id: l.id, engine: 'laya-local', resultado: await juzgarLocal(t) } }); }
        catch { await api('laya/juicios', { method: 'POST', body: { coll: 'leads', id: l.id, pendiente: true } }); pend++; continue; }
        const e = encDe(r.items); if (e) { const cur = leads.find((x) => x.id === l.id); const sv = await L.save({ ...cur, laya_encaja: e }); leads = leads.map((x) => (x.id === sv.id ? sv : x)); hechos++; }
      } catch { /* sigue con el siguiente */ }
      if (alive() && tab === 'pros') prosTab($('#body', el));
    }
    filtrando = false; toast(pend ? `Laya filtró ${hechos}. ${pend} quedaron pendientes: el puente no respondió.` : `Laya filtró ${hechos}`, Boolean(pend && !hechos));
    if (alive() && tab === 'pros') prosTab($('#body', el));
  }
  // La bandeja de prospectos (outbound): lo scrapeado o importado espera aquí y pasa al pipeline cuando responde.
  function prosView(list) {
    if (!list.length) return html`<div class="empty"><b>No hay prospectos esperando</b>Entran desde una fuente de scraping o importando una lista (también por el conector de Claude: «importar_prospectos»).</div>`;
    const bySrc = {}; list.forEach((l) => { (bySrc[l.source || 'Sin fuente'] ||= []).push(l); });
    return html`<div class="mut sm" style="margin-bottom:6px">Un prospecto no cuenta como lead hasta que responde. «→ Lead» o «Contactado» lo pasan al pipeline con su siguiente paso; la ✕ lo archiva.</div>
      ${Object.entries(bySrc).map(([src, ls]) => html`<div class="sec-title" style="margin:18px 0 10px"><h2 style="font-size:17px">${src}</h2><span class="mut sm">${ls.length}</span></div>
      <div class="card"><table><thead><tr><th>Prospecto</th><th>Contacto</th><th>Notas</th><th></th></tr></thead><tbody>
        ${ls.map((l) => html`<tr><td class="click" data-act="lead" data-id="${l.id}"><b style="font-weight:500">${l.name}</b>${l.laya_encaja ? html` <span class="vx-enc ${({ si: 'ok', talvez: 'am', no: 'bad' })[l.laya_encaja]}">${({ si: 'Encaja', talvez: 'Tal vez', no: 'No encaja' })[l.laya_encaja]}</span>` : ''}${l.company && l.company !== l.name ? html`<div class="mut sm">${l.company}</div>` : ''}</td><td class="sm">${[l.ig && '@' + l.ig, l.phone, l.email].filter(Boolean).join(' · ') || '—'}</td><td class="sm mut" style="max-width:320px;white-space:pre-line">${String(l.notes || '').slice(0, 160)}</td><td style="white-space:nowrap;text-align:right">${(l.activity || []).filter((a) => a.kind === 'outreach').length ? html`<span class="mut sm" title="Mensajes de outreach">${ico('mail', 12)} ${(l.activity || []).filter((a) => a.kind === 'outreach').length}</span> ` : ''}<button class="btn ghost xs" data-act="outreach" data-id="${l.id}" title="Anotar un mensaje de outreach">+1 outreach</button> <button class="btn ghost xs" data-act="toCrm" data-id="${l.id}" data-s="Nuevo">→ Lead</button> <button class="btn ghost xs" data-act="toCrm" data-id="${l.id}" data-s="Contactado">Contactado</button> <button class="btn ghost xs" data-act="archive" data-id="${l.id}" title="Archivar">${ico('x', 14)}</button></td></tr>`)}
      </tbody></table></div>`)}`;
  }

  async function saveLead(l, msg = 'Guardado') {
    try { const s = await L.save(l); leads = leads.map((x) => (x.id === s.id ? s : x)); toast(msg); return s; }
    catch (e) { toast(e.message, true); return null; }
  }
  // Mover de etapa con sus candados: Perdido pide el motivo; una etapa abierta pide siguiente paso y fecha si no los tiene vigentes.
  async function moveLead(l, stage) {
    const cur = leads.find((x) => x.id === l.id) || l, extra = {}, notes = [`Etapa: ${stageLabel(cur.stage)} → ${stageLabel(stage)}`];
    if (stage === 'Perdido') { const v = await ask(`¿Por qué se perdió ${cur.name}?`, [{ k: 'r', l: 'Motivo', t: 'select', opts: LOST.map((x) => [x, x]), req: true }, { k: 'n', l: 'Nota (opcional)' }], 'Marcar perdido'); if (!v) return null; extra.lost_reason = v.r; notes.push(`Motivo de pérdida: ${v.r}${v.n ? ` · ${v.n}` : ''}`); }
    else if (OPEN.includes(stage) && (!cur.next_step || !cur.next_date || cur.next_date < T)) { const v = await ask(`${cur.name} → ${stageLabel(stage)}: ¿cuál es el siguiente paso?`, [{ k: 's', l: 'Siguiente paso', req: true, v: cur.next_step || '' }, { k: 'd', l: 'Fecha', t: 'date', req: true, v: cur.next_date >= T ? cur.next_date : nextDay() }], 'Mover'); if (!v) return null; extra.next_step = v.s; extra.next_date = v.d; notes.push(`Siguiente paso: ${v.s} · ${v.d}`); }
    return saveLead({ ...cur, ...extra, stage, activity: [...(cur.activity || []), ...notes.map(act)] });
  }

  function openLead(l) {
    let tags = [...(l.tags || [])], interest = l.interest || 0;
    const all = [...new Set([...Object.keys(TAGS), ...tags])];
    const stage0 = l.stage || 'Nuevo';
    const d = drawer(html`<div class="row"><span class="chip">${l.source || 'Sin fuente'}</span>${l.direction === 'out' ? html`<span class="chip">Saliente</span>` : ''}<div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>${l.name}</h2><div class="mut">${[l.contact, l.company, l.ig && '@' + l.ig].filter(Boolean).join(' · ')}</div>
      ${flowIndex(stage0) >= 0 ? html`<div class="vf-track" aria-label="Etapa del cierre">${FLOW.map((f, k) => { const i = flowIndex(stage0); return html`<span class="${k < i ? 'done' : k === i ? 'on' : ''}">${f.id === 'cierre' && k === i ? stageLabel(stage0) : f.label}</span>`; })}</div>
        ${OPEN.includes(stage0) ? html`<div class="vf-next ${isLate(l) ? 'late' : ''}"><span class="mut">Siguiente paso</span> <b>${l.next_step || 'Sin siguiente paso'}</b>${l.next_date ? html` · ${isLate(l) ? 'venció el ' : ''}${fdate(l.next_date)}` : ''}</div>` : ''}` : ''}
      ${isWaiting(l) ? html`<div class="vf-waitbox">${timer(l)}<span class="grow">Espera tu primera respuesta</span>${edit ? html`<button class="btn xs" data-act="replied">Ya respondí</button>` : ''}</div>` : ''}
      ${l.plan || l.answers ? html`<div class="card glass" style="margin-top:14px;padding:14px"><div class="row"><b style="font-weight:500">Diagnóstico</b><div class="sp"></div>${l.plan ? html`<span class="chip dark">${levelName(l.plan)}</span>` : ''}${l.score != null ? html`<span class="chip">${l.score}/100</span>` : ''}</div>
        ${l.answers && typeof l.answers === 'object' ? html`<div class="sm" style="margin-top:8px">${Object.entries(l.answers).map(([k, v]) => html`<div><span class="mut">${k}:</span> ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v}</div>`)}</div>` : ''}</div>` : ''}
      <div class="row" style="margin:18px 0 6px"><span class="sm mut">Interés</span><div class="sp"></div><span class="vf-laya-slot" id="laya-lead"></span></div>
      <div class="scorein" id="sc">${[1, 2, 3, 4, 5].map((n) => html`<button data-act="score" data-n="${n}" class="${n <= interest ? 'on' : ''}" title="${n}"></button>`)}</div>
      <div style="margin:16px 0 6px" class="sm mut">Estado</div>
      <div class="tagbox" id="tg">${all.map((t) => html`<span class="chip ${tags.includes(t) ? TAGS[t] ?? 'dark' : 'off'}" data-act="tag" data-t="${t}">${t}</span>`)}<span class="chip off" data-act="newTag">+ etiqueta</span></div>
      <form class="form" id="lf" style="margin-top:18px">
        <div class="two"><div><label class="f">Etapa</label><select class="in" name="stage" id="lstage">${STAGES.map((s) => html`<option value="${s}" ${s === stage0 ? raw('selected') : ''}>${stageLabel(s)}</option>`)}</select></div>
          <div><label class="f">Responsable (rol)</label><select class="in" name="owner_role">${[...new Set([...WORK_ROLES.map(([k]) => k), l.owner_role || 'ventas'])].map((k) => html`<option value="${k}" ${k === (l.owner_role || 'ventas') ? raw('selected') : ''}>${roleLabel(k)}</option>`)}</select></div></div>
        <div id="lost" ${stage0 === 'Perdido' ? '' : raw('hidden')}><label class="f">Motivo de pérdida *</label><select class="in" name="lost_reason"><option value="">— Elige el motivo</option>${LOST.map((x) => html`<option ${x === l.lost_reason ? raw('selected') : ''}>${x}</option>`)}</select></div>
        <div class="two"><div><label class="f" data-must="paso">Siguiente paso${OPEN.includes(stage0) ? ' *' : ''}</label><input class="in" name="next_step" value="${l.next_step || ''}" placeholder="Llamar, mandar propuesta, agendar…"></div>
          <div><label class="f" data-must="fecha">Fecha${OPEN.includes(stage0) ? ' *' : ''}</label><input class="in" name="next_date" type="date" value="${l.next_date || ''}"></div></div>
        <div class="two"><div><label class="f">Interesado en</label><input class="in" name="wants" value="${l.wants || ''}"></div>
          <div><label class="f">Valor mensual (USD)</label><input class="in" name="value_usd" type="number" value="${l.value_usd ?? ''}"></div></div>
        <div class="two"><div><label class="f">Contacto</label><input class="in" name="contact" value="${l.contact || ''}"></div><div><label class="f">Empresa</label><input class="in" name="company" value="${l.company || ''}"></div></div>
        <div class="two"><div><label class="f">Teléfono / WhatsApp</label><input class="in" name="phone" value="${l.phone || ''}"></div>
          <div><label class="f">Correo</label><input class="in" name="email" type="email" value="${l.email || ''}"></div></div>
        <div><label class="f">Instagram</label><input class="in" name="ig" value="${l.ig ? '@' + l.ig : ''}" placeholder="@cuenta"></div>
        <div><label class="f">Notas</label><textarea class="in" name="notes">${l.notes || ''}</textarea></div>
      </form>
      <div class="row" style="margin:16px 0"><button class="btn" data-act="save">Guardar</button><button class="btn ghost" data-act="quote">Crear cotización</button><div class="sp"></div><button class="btn ghost" data-act="del" title="Eliminar">${ico('trash', 16)}</button></div>
      <b class="sm">Historial</b> <span class="mut sm">· solo se agrega</span>
      <div class="row" style="margin:8px 0;gap:6px"><select class="in" id="nkind" style="width:auto" aria-label="Qué fue"><option value="">Nota</option>${KINDS.map(([k, t]) => html`<option value="${k}">${t}</option>`)}</select><input class="in" id="note" placeholder="Qué pasó…"><button class="btn ghost" data-act="note">Agregar</button></div>
      ${(l.activity || []).slice().reverse().map((a) => html`<div class="comment"><span class="av">${(a.who || '?')[0]}</span><p><span class="mut sm">${fdate(String(a.at || '').slice(0, 10))} · ${a.who}</span><br>${a.text}</p></div>`)}`,
    {
      replied: async () => { const s = await replied(l); if (s) { paint(); openLead(s); } },
      score: (b) => { interest = +b.dataset.n; $$('#sc button').forEach((x) => x.classList.toggle('on', +x.dataset.n <= interest)); },
      tag: (b) => { const t = b.dataset.t; tags = tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]; b.className = `chip ${tags.includes(t) ? TAGS[t] ?? 'dark' : 'off'}`; },
      newTag: async () => { const v = await ask('Nueva etiqueta', [{ k: 't', l: 'Etiqueta', req: true }], 'Agregar'); if (v) { tags.push(v.t); await persist(); openLead(leads.find((x) => x.id === l.id)); } },
      save: async () => { if (await persist()) { closeDrawer(); paint(); } },
      note: async () => { const n = $('#note').value.trim(); if (!n) return; l = leads.find((x) => x.id === l.id); const v = formVals(); const bad = lockMsg(v); if (bad) return toast(bad, true); const s = await saveLead({ ...l, ...v, tags, interest, activity: [...(l.activity || []), { ...act(n), ...($('#nkind')?.value ? { kind: $('#nkind').value } : {}) }] }); if (s) openLead(s); },
      quote: async () => { if (!(await persist())) return; closeDrawer(); editQuote(null, leads.find((x) => x.id === l.id)); },
      del: async () => { if (!(await confirmAsk(`¿Eliminar a ${l.name}?`))) return; await L.remove(l.id); leads = leads.filter((x) => x.id !== l.id); closeDrawer(); paint(); },
    });
    layaBox($('#laya-lead', d), { coll: 'leads', id: l.id, compact: true }); // Fase 3: el juicio de Laya (encaja, nivel, urgencia)
    // Al elegir Perdido aparece el motivo; en una etapa abierta el paso y la fecha son obligatorios.
    $('#lstage', d).onchange = (e) => { $('#lost', d).hidden = e.target.value !== 'Perdido'; const must = OPEN.includes(e.target.value); $$('[data-must]', d).forEach((lb) => { lb.textContent = (lb.dataset.must === 'paso' ? 'Siguiente paso' : 'Fecha') + (must ? ' *' : ''); }); };
    const formVals = () => { const f = $('#lf', d); const o = Object.fromEntries(new FormData(f)); o.value_usd = o.value_usd === '' ? null : +o.value_usd; o.ig = String(o.ig || '').replace(/^@/, ''); return o; };
    // El candado también aquí, antes de pedirle nada al servidor.
    const lockMsg = (v) => (OPEN.includes(v.stage) && (!v.next_step.trim() || !v.next_date) ? 'Un lead abierto no se guarda sin siguiente paso y fecha' : v.stage === 'Perdido' && !v.lost_reason ? 'Para marcarlo perdido elige el motivo' : '');
    async function persist() {
      const cur = leads.find((x) => x.id === l.id);
      const v = formVals(); const bad = lockMsg(v); if (bad) { toast(bad, true); return null; }
      const changes = [];
      if ((cur.stage || 'Nuevo') !== v.stage) changes.push(`Etapa: ${stageLabel(cur.stage)} → ${stageLabel(v.stage)}`);
      if (v.stage === 'Perdido' && v.lost_reason !== (cur.lost_reason || '')) changes.push(`Motivo de pérdida: ${v.lost_reason}`);
      if (v.next_step && (v.next_step !== (cur.next_step || '') || v.next_date !== (cur.next_date || ''))) changes.push(`Siguiente paso: ${v.next_step}${v.next_date ? ` · ${v.next_date}` : ''}`);
      if (v.owner_role !== (cur.owner_role || 'ventas')) changes.push(`Responsable: ${roleLabel(cur.owner_role)} → ${roleLabel(v.owner_role)}`);
      const s = await saveLead({ ...cur, ...v, tags, interest, activity: [...(cur.activity || []), ...changes.map(act)] });
      if (s) l = s; return s;
    }
  }

  async function newLead() {
    const v = await wizard('Nuevo lead', [
      { k: 'name', q: '¿Qué empresa o marca es?', type: 'text', req: true, ph: 'Nombre de la marca' },
      { k: 'wants', q: '¿Qué le interesa?', type: 'cards', req: true, opts: [
        { v: 'Brand Foundation', i: ico('puzzle'), l: 'Brand Foundation', d: 'Crear o reposicionar la marca' }, { v: 'Brand Growth', i: ico('megaphone'), l: 'Brand Growth', d: 'Más demanda para la marca que ya está' },
        { v: 'Growth Partnership', i: ico('stairs'), l: 'Growth Partnership', d: 'Conectar marca, ventas y sistemas' },
        { v: 'Proyecto puntual', i: ico('puzzle'), l: 'Proyecto puntual' }, { v: 'No sé todavía', i: ico('help'), l: 'No sé todavía' }] },
      { k: 'interest', q: '¿Qué tan caliente está?', type: 'cards', req: true, opts: [['1', ico('snow'), 'Frío'], ['2', ico('sun'), 'Tibio'], ['3', ico('smile'), 'Interesado'], ['4', ico('flame'), 'Caliente'], ['5', ico('rocket'), 'Listo para cerrar']].map(([v, i, l]) => ({ v, i, l })) },
      { k: 'source', q: '¿Cómo llegó?', type: 'cards', req: true, opts: SOURCES.map((x) => ({ v: x, l: x })) },
      { k: 'contact', q: '¿Con quién hablamos?', sub: 'Nombre y WhatsApp (puedes dejarlo vacío)', type: 'text', ph: 'Nombre · +502 …' },
      { k: 'next_step', q: '¿Cuál es el siguiente paso?', sub: 'Ningún lead abierto se queda sin siguiente paso.', type: 'text', req: true, ph: 'Ej. Primer mensaje por WhatsApp', chips: ['Primer mensaje por WhatsApp', 'Llamar', 'Agendar reunión', 'Mandar información'] },
      { k: 'next_date', q: '¿Para cuándo?', type: 'when', req: true },
    ], 'Crear lead');
    if (!v) return;
    const [contact, phone] = String(v.contact || '').split('·').map((x) => x.trim());
    try {
      const l = await L.create({ name: v.name, wants: v.wants, source: v.source, contact: contact || '', phone: phone || '', stage: 'Nuevo', interest: +v.interest, owner_role: 'ventas', next_step: v.next_step, next_date: v.next_date, tags: +v.interest >= 4 ? ['Interesado'] : [], activity: [act('Lead creado')] });
      leads.push(l); paint(); openLead(l);
    } catch (e) {
      toast(e.message, true);
      // Ya existía (mismo WhatsApp): se abre el que está en vez de duplicarlo.
      if (e.status === 409 && phone) { const k = phone.replace(/\D/g, '').slice(-8); const dup = leads.find((x) => String(x.phone || '').replace(/\D/g, '').slice(-8) === k); if (dup) openLead(dup); }
    }
  }

  // ---------- Fuentes de leads: una sola puerta, una clave por fuente ----------
  // Cada fuente (quiz, formulario, anuncios, scraping…) tiene su link de entrada; lo que llega se mapea a los campos del lead,
  // entra en su etapa con su rol y queda en el registro. Las crea y pausa el CEO; el equipo de ventas las ve.
  let srcs = null;
  const SRC_TYPES = [['formulario', 'Formulario'], ['quiz', 'Quiz'], ['mensajes', 'Mensajes (DM / WhatsApp)'], ['anuncios', 'Anuncios (formulario de Meta)'], ['scraping', 'Scraping (prospección)'], ['importar', 'Importar lista'], ['manual', 'Manual']];
  const TARGET_L = { name: 'Nombre (empresa o marca)', contact: 'Contacto (persona)', company: 'Empresa', phone: 'WhatsApp', email: 'Correo', ig: 'Cuenta de Instagram', wants: 'Interesado en', notes: 'Notas', answers: 'Respuestas (quiz)', score: 'Puntaje', plan: 'Plan sugerido' };
  const srcLink = (s) => (s.type === 'quiz' ? `${location.origin}/diagnostico?k=${s.key}` : `${location.origin}/api/intake/${s.key}`);
  const newKey = () => { const b = new Uint8Array(24); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  function srcTab(body) {
    if (!srcs) { mount(body, html`<p class="loading">Cargando…</p>`); SRC.list().then((l) => { srcs = l; if (alive() && tab === 'src') srcTab(body); }).catch((e) => mount(body, html`<div class="warnbox">${e.message}</div>`)); return; }
    mount(body, html`<div class="mut sm" style="margin-bottom:14px">Cada fuente tiene su link de entrada con clave. Lo que llega por ahí entra al CRM sin duplicados (WhatsApp, correo o cuenta de IG) y queda en su registro.${isCeo ? '' : ' Las fuentes las crea y pausa el CEO.'}</div>
      ${!srcs.length ? html`<div class="empty"><b>Todavía no hay fuentes</b>${isCeo ? 'Crea la primera con «+ Fuente»: el quiz de la web, un formulario, los anuncios o el scraping.' : 'Pídele al CEO que cree la primera.'}</div>`
      : html`<div class="grid g3">${srcs.map((s) => { const n = s.n || {}; return html`<div class="card">
          <div class="row" style="flex-wrap:wrap;gap:6px"><span class="chip ${s.active === false ? '' : 'dark'}">${s.active === false ? 'Pausada' : 'Activa'}</span><span class="chip">${SRC_TYPES.find(([k]) => k === s.type)?.[1] || s.type}</span>${s.main ? html`<span class="chip lime">Quiz principal</span>` : ''}<div class="sp"></div><span class="mut sm">${s.direction === 'out' ? 'Saliente' : 'Entrante'}</span></div>
          <h3 style="font-size:19px;font-weight:500;letter-spacing:-.4px;margin:12px 0 4px">${s.name}</h3>
          <div class="mut sm">Entra como <b style="font-weight:500">${stageLabel(s.stage_in)}</b> · responsable ${roleLabel(s.role)}${Object.keys(s.map || {}).length ? ` · ${Object.keys(s.map).length} campos mapeados` : ''}</div>
          <div class="row sm" style="margin:12px 0 4px;gap:14px"><span>${n.ok || 0} recibidos</span><span style="${n.fail ? 'color:var(--warn)' : ''}">${n.fail || 0} fallidos</span>${n.last_at ? html`<span class="mut">último ${fdate(n.last_at.slice(0, 10))}</span>` : ''}</div>
          <div class="row" style="margin-top:10px;gap:6px"><input class="in" readonly value="${srcLink(s)}" style="font-size:12px;padding:8px 10px"><button class="btn ghost" data-act="copyLink" data-id="${s.id}" style="padding:8px 12px" title="Copiar el link">${ico('copy', 15)}</button></div>
          <div class="row" style="margin-top:12px;gap:6px;flex-wrap:wrap"><button class="btn ghost xs" data-act="srcLog" data-id="${s.id}">Registro</button>${isCeo ? html`<button class="btn ghost xs" data-act="srcEdit" data-id="${s.id}">Editar</button><button class="btn ghost xs" data-act="srcToggle" data-id="${s.id}">${s.active === false ? 'Activar' : 'Pausar'}</button>` : ''}</div>
        </div>`; })}</div>`}`);
  }
  function editSource(s) {
    const cur = s || { name: '', type: 'formulario', direction: 'in', stage_in: 'Nuevo', role: 'ventas', active: true, map: {}, main: false, notes: '' };
    drawer(html`<div class="row"><span class="chip dark">${ico('lock', 13)} Solo CEO</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>${s ? 'Editar fuente' : 'Nueva fuente'}</h2>
      <form class="form" id="srcf" style="margin-top:14px">
        <div><label class="f">Nombre *</label><input class="in" name="name" value="${cur.name}" placeholder="Ej. Quiz de la web, Formulario de Meta, Apify restaurantes"></div>
        <div class="two"><div><label class="f">Tipo</label><select class="in" name="type">${SRC_TYPES.map(([k, l]) => html`<option value="${k}" ${k === cur.type ? raw('selected') : ''}>${l}</option>`)}</select></div>
          <div><label class="f">Dirección</label><select class="in" name="direction"><option value="in" ${cur.direction !== 'out' ? raw('selected') : ''}>Entrante (ellos llegan)</option><option value="out" ${cur.direction === 'out' ? raw('selected') : ''}>Saliente (nosotros buscamos)</option></select></div></div>
        <div class="two"><div><label class="f">Etapa de entrada</label><select class="in" name="stage_in">${STAGES.filter((x) => !['Ganado', 'Perdido'].includes(x)).map((x) => html`<option value="${x}" ${x === cur.stage_in ? raw('selected') : ''}>${stageLabel(x)}</option>`)}</select></div>
          <div><label class="f">Rol asignado</label><select class="in" name="role">${[...new Set([...WORK_ROLES.map(([k]) => k), cur.role])].map((k) => html`<option value="${k}" ${k === cur.role ? raw('selected') : ''}>${roleLabel(k)}</option>`)}</select></div></div>
        <label class="check"><input type="checkbox" name="main" ${cur.main ? raw('checked') : ''}> Es la fuente principal del quiz público (/diagnostico sin clave la usa)</label>
        <div><label class="f">Notas</label><input class="in" name="notes" value="${cur.notes || ''}"></div>
      </form>
      <div class="sm mut" style="margin:18px 0 8px">Mapeo de campos · cómo se llama cada dato en lo que llega. Vacío = se llama igual que aquí (ej. <code>phone</code>).</div>
      <div class="form" style="gap:8px">${Object.entries(TARGET_L).map(([t, l]) => html`<div class="row" style="gap:8px"><span class="sm" style="width:170px;flex:none">${l}</span><input class="in" data-map="${t}" value="${cur.map?.[t] || ''}" placeholder="${t}" style="padding:8px 10px;font-size:13px"></div>`)}</div>
      <div class="row" style="margin-top:18px"><button class="btn" data-act="saveSrc">Guardar</button><div class="sp"></div>${s ? html`<button class="btn ghost" data-act="delSrc" title="Eliminar">${ico('trash', 16)}</button>` : ''}</div>`,
    {
      saveSrc: async () => {
        const f = Object.fromEntries(new FormData($('#srcf'))); if (!String(f.name || '').trim()) return toast('Falta el nombre', true);
        const map = {}; $$('[data-map]', $('#drawer')).forEach((i) => { if (i.value.trim()) map[i.dataset.map] = i.value.trim(); });
        const doc = { ...cur, ...f, main: $('#srcf [name=main]').checked, map, key: cur.key || newKey() };
        try { const r = s ? await SRC.save(doc) : await SRC.create(doc); srcs = s ? srcs.map((x) => (x.id === r.id ? r : x)) : [...(srcs || []), r]; toast('Fuente guardada'); closeDrawer(); paint(); }
        catch (e) { toast(e.message, true); }
      },
      delSrc: async () => { if (!(await confirmAsk(`¿Eliminar la fuente ${s.name}? Su link deja de funcionar.`))) return; await SRC.remove(s.id); srcs = srcs.filter((x) => x.id !== s.id); closeDrawer(); paint(); },
    });
  }
  function srcLog(s) {
    drawer(html`<div class="row"><span class="chip">${s.name}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>Registro</h2><p class="mut sm" style="margin-top:6px">Lo último que llegó por esta fuente y lo que falló (últimos 50).</p>
      ${!(s.log || []).length ? html`<div class="empty" style="margin-top:14px"><b>Todavía no llegó nada</b>Manda una prueba al link de entrada.</div>`
      : (s.log || []).map((x) => html`<div class="comment"><span class="av" style="${x.ok ? '' : 'background:var(--ui-ink2)'}">${x.ok ? '✓' : '!'}</span><p><span class="mut sm">${fdate(String(x.at || '').slice(0, 10))} · ${String(x.at || '').slice(11, 16)}</span><br>${x.ok ? html`${x.name || 'Lead'}${x.duplicate ? html` <span class="chip">ya existía</span>` : ''}${x.lead_id ? html` <a href="#" data-act="openLead" data-id="${x.lead_id}" style="color:var(--ui-ink2)">ver lead</a>` : ''}` : html`<b style="font-weight:500">${x.error}</b>${x.raw ? html`<div class="mut sm" style="word-break:break-all">${x.raw}</div>` : ''}`}</p></div>`)}`,
    { openLead: (b, e) => { e.preventDefault(); const l = leads.find((x) => x.id === b.dataset.id); if (l) openLead(l); else toast('Ese lead ya no existe', true); } });
  }


  // ---------- El editor del servicio ----------
  // El catálogo vive en Servicios → Servicios (catalogo.js). Aquí solo se usa su editor: «Completar» un servicio desde la cotización.
  const CAT = createCatalog({ me, getS: () => services, setS: (l) => { services = l; }, getR: () => rates, setR: (r) => { rates = r; }, paint, alive, isCat: () => false });
  const editService = CAT.editService;

  // ---------- Cotizaciones ----------
  // La cotización guarda todo en quetzales y se muestra en su moneda (rate = 1 Q en esa moneda).
  const CUR = (() => { try { return Intl.supportedValuesOf('currency'); } catch { return ['GTQ', 'USD', 'EUR', 'MXN']; } })();
  const curName = (() => { try { const dn = new Intl.DisplayNames(['es'], { type: 'currency' }); return (c) => dn.of(c); } catch { return (c) => c; } })();
  const money = (qq, n) => { const c = qq.currency || 'GTQ', r = c === 'GTQ' ? 1 : +qq.rate || 1; try { return new Intl.NumberFormat('es-GT', { style: 'currency', currency: c, maximumFractionDigits: c === 'GTQ' ? 0 : 2 }).format((+n || 0) * r); } catch { return Q(n); } };
  const subtotal = (qq) => (qq.items || []).reduce((a, i) => a + (+i.qty || 0) * (+i.price || 0), 0);
  const total = (qq) => subtotal(qq) * (1 - (+qq.discount_pct || 0) / 100);
  function quotesTab(body) {
    mount(body, !quotes.length ? html`<div class="empty"><b>Todavía no hay cotizaciones</b>Créala desde un lead del CRM o con «+ Nueva cotización».</div>`
      : html`<div class="card"><table><thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th class="n">Total</th></tr></thead><tbody>
        ${quotes.slice().reverse().map((qq) => html`<tr class="click" data-act="quote" data-id="${qq.id}"><td><b style="font-weight:500">${qq.number}</b></td><td>${qq.client || '—'}</td><td class="mut">${fdate(qq.date)}</td><td><span class="chip ${QSTATUS[qq.status] || ''}">${qq.status || 'Borrador'}</span></td><td class="n"><b>${money(qq, total(qq))}</b></td></tr>`)}
      </tbody></table></div>`);
  }

  function nextNumber() {
    const y = new Date().getFullYear();
    const n = quotes.filter((qq) => String(qq.number || '').startsWith(`COT-${y}-`)).length + 1;
    return `COT-${y}-${String(n).padStart(3, '0')}`;
  }

  // El % del crecimiento que genera un servicio (si genera crecimiento directo).
  const growthOf = (sv) => (sv?.growth_type ? { type: sv.growth_type, pct: +sv.growth_pct || 10, how: sv.growth_how || '' } : null);
  const fees = (doc) => doc.items.filter((i) => i.growth?.type && +i.growth.pct);
  function editQuote(qq, lead) {
    let doc = qq ? JSON.parse(JSON.stringify(qq)) : { number: nextNumber(), date: today(), valid_days: 15, status: 'Borrador', discount_pct: 0, items: [], notes: '', lead_id: lead?.id || '', client: lead?.name || '', contact: lead?.contact || '', email: lead?.email || '' };
    tab = 'quotes';
    const draw = () => {
      // Un servicio que genera crecimiento lleva su % solo (a menos que se haya quitado a mano).
      doc.items.forEach((i) => { if (i.growth === undefined) { const g = growthOf(services.find((x) => x.id === i.service_id)); if (g) i.growth = g; } });
      const st = subtotal(doc), tt = total(doc);
      const cost = isCeo && rates ? doc.items.reduce((a, i) => { const s = services.find((x) => x.id === i.service_id); const c = s ? costOf(s, i.level || s.level || 5) : null; return a + (c && !c.miss.length ? c.cost * (+i.qty || 0) : (+i.cost || 0) * (+i.qty || 0)); }, 0) : null;
      mount(el, html`
        <div class="row" style="margin-bottom:22px"><button class="btn ghost" data-act="back">← Cotizaciones</button><div class="sp"></div>
          <select class="in" id="qcur" style="width:auto;max-width:230px" title="Moneda">${CUR.map((c) => html`<option value="${c}" ${c === (doc.currency || 'GTQ') ? raw('selected') : ''}>${c} · ${curName(c)}</option>`)}</select>
          ${doc.currency && doc.currency !== 'GTQ' ? html`<label class="sm mut row" style="gap:6px">1 Q =<input class="in" id="qrate" type="number" step="0.0001" value="${doc.rate || ''}" style="width:100px"></label>` : ''}
          <select class="in" id="qstatus" style="width:auto">${Object.keys(QSTATUS).map((s) => html`<option ${s === doc.status ? raw('selected') : ''}>${s}</option>`)}</select>
          <button class="btn ghost" data-act="pdf">Ver PDF</button>${doc.id && doc.items.some((i) => i.service_id) && canProject ? html`<button class="btn ghost" data-act="toProject">→ Crear proyecto</button>` : ''}<button class="btn" data-act="saveQ">Guardar</button></div>
        <div class="grid g2">
          <div class="card">
            <div class="chead"><div class="ico">${ico('edit')}</div><h3>${doc.number}<br><span class="mut sm">${fdateLong(doc.date)}</span></h3></div>
            <form class="form" id="qf">
              <div class="two"><div><label class="f">Cliente</label><input class="in" name="client" list="leadlist" placeholder="Elige del CRM o escribe uno nuevo" value="${doc.client}"></div><div><label class="f">Contacto</label><input class="in" name="contact" value="${doc.contact || ''}"></div></div>
              <datalist id="leadlist">${leads.map((l) => html`<option value="${l.name}">`)}</datalist>
            </form>
            <div class="sm mut" style="margin:18px 0 8px">Servicios</div>
            ${doc.items.map((it, i) => html`<div class="card glass" style="padding:12px 14px;margin-bottom:8px;border-radius:18px"><div class="row"><input class="in" data-i="${i}" data-f="name" value="${it.name}" style="font-weight:500"><button class="btn ghost" data-act="rmItem" data-i="${i}" style="padding:8px 12px"></button></div>
              <div class="row" style="margin-top:8px"><input class="in" data-i="${i}" data-f="description" value="${it.description || ''}" placeholder="Descripción"><input class="in" style="max-width:80px" type="number" data-i="${i}" data-f="qty" value="${it.qty}"><span class="mut">×</span>${it.service_id ? html`<span class="in qprice" data-pshow="${i}" title="Calculado por el nivel de entrega">${it.price != null ? money(doc, it.price) : '—'}</span>` : html`<input class="in" style="max-width:130px" type="number" data-i="${i}" data-f="price" value="${it.price ?? ''}" placeholder="Precio (Q)">`}</div>
              ${(() => { const sv = services.find((x) => x.id === it.service_id); if (!sv || !(sv.tasks || []).length) return ''; const lv = it.level || sv.level || 5;
                const miss = [priceAt(sv, lv) == null ? 'precio (o costos por hora)' : '', !String(sv.includes5 || '').trim() ? 'lo que incluye' : '', !sv.days5 ? 'días' : ''].filter(Boolean);
                return html`${miss.length ? html`<div class="warnbox sm" style="margin-top:10px">A «${sv.name}» le falta en el catálogo: <b>${miss.join(', ')}</b>. Sin eso el nivel no cambia el precio ni lo que incluye. <button class="btn ghost xs" data-act="fixSvc" data-id="${sv.id}" style="margin-left:6px">Completar</button></div>` : ''}<div class="qlv"><div class="row sm"><span>Nivel de entrega</span><div class="sp"></div><b style="font-weight:500" data-lvl="${i}">${lvName(lv)} · ${lv} · ${svcHours(sv, lv)} h</b></div>
                  <input type="range" min="3" max="10" step="1" value="${lv}" data-qlv="${i}" style="width:100%">
                  <div class="row mut" style="font-size:11px"><span>3 · básico</span><div class="sp"></div><span>10 · fuerte</span></div>
                  ${includesAt(sv, lv).length || daysAt(sv, lv) ? html`<div class="sm" style="margin-top:8px" data-inc="${i}">${incHtml(sv, lv)}</div>` : ''}</div>`; })()}
              ${it.growth ? html`<div class="qgrow"><span>${ico('trend', 14)} + fee por crecimiento</span><input class="in" type="number" step="0.5" data-i="${i}" data-f="growth_pct" value="${it.growth.pct}"><span class="mut">% de ${GROWTH[it.growth.type] || it.growth.type}</span><button class="btn ghost xs" data-act="rmGrowth" data-i="${i}" title="Quitar el fee"></button></div>` : ''}</div>`)}
            <div class="row" style="margin-top:10px"><select class="in" id="addSvc"><option value="">+ Agregar del catálogo…</option>
              ${plans?.plans?.length ? html`<optgroup label="Niveles anteriores (mensual)">${plans.plans.map((p) => html`<option value="plan:${p.id}">${levelName(p.name)} — ${Q(p.precio)}</option>`)}</optgroup>` : ''}
              ${services.length ? html`<optgroup label="Servicios del catálogo">${services.map((s) => html`<option value="${s.id}">${s.name}${s.price ? ' — ' + Q(s.price) : ''}</option>`)}</optgroup>` : ''}<option value="new">Crear servicio nuevo (se guarda en el catálogo)</option><option value="free">Línea libre (solo esta cotización)</option></select></div>
            ${!services.length ? html`<div class="mut sm" style="margin-top:8px">Tu catálogo está vacío. Crea servicios aquí mismo o en <a href="#/services/servicios">Servicios → Servicios</a>.</div>` : ''}
            <div class="two" style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label class="f">Descuento %</label><input class="in" id="qdisc" type="number" value="${doc.discount_pct || 0}"></div><div><label class="f">Válida por (días)</label><input class="in" id="qvalid" type="number" value="${doc.valid_days || 15}"></div></div>
            <div style="margin-top:12px"><label class="f">Tiempo total (días hábiles)</label><input class="in" id="qdays" type="number" min="0" value="${+doc.days > 0 ? doc.days : ''}" placeholder="${autoDays(doc) ? `${autoDays(doc)} si todo va en paralelo` : 'Escribe los días'}"><div class="mut sm" style="margin-top:4px">Si hay servicios que van uno después de otro, escribe el total real.</div></div>
            <div style="margin-top:12px"><label class="f">Lo que esto va a provocar en su negocio (sale ANTES del precio)</label><textarea class="in" id="qintro" style="min-height:120px" placeholder="Cómo se traduce en crecimiento lo que vamos a implementar.">${doc.intro || ''}</textarea></div>
            <div style="margin-top:12px"><label class="f">Siguientes pasos (uno por línea; si lo dejas vacío salen los de siempre)</label><textarea class="in" id="qnext">${doc.next || ''}</textarea></div>
            <div style="margin-top:12px"><label class="f">Notas y condiciones (salen en el PDF)</label><textarea class="in" id="qnotes">${doc.notes || ''}</textarea></div>
          </div>
          <div class="card feat olive" style="align-self:start">
            <div class="chead"><div class="ico">${ico('target', 16)}</div><h3>Total<br><span class="lbl">${doc.client || 'Sin cliente'}</span></h3></div>
            <div class="big" style="font-size:52px">${money(doc, tt)}</div>
            <div class="split"><div><span class="lbl">Subtotal</span><b>${money(doc, st)}</b></div>${quoteDays(doc) ? html`<div><span class="lbl">Tiempo</span><b>${quoteDays(doc)} días</b></div>` : ''}${doc.discount_pct ? html`<div><span class="lbl">Descuento</span><b>-${doc.discount_pct}%</b></div>` : ''}
              ${cost != null ? (() => { const mg = tt ? Math.round(((tt - cost) / tt) * 100) : null; return html`<div><span class="lbl">${ico('lock', 12)} Costo</span><b>${money(doc, cost)}</b></div><div><span class="lbl">${ico('lock', 12)} Margen</span><b style="color:#faf6ee">${mg != null ? mg + '%' : '—'}</b>${mg != null && mg < 70 ? html`<span class="lbl" style="display:block;margin-top:4px">${ico('alert', 12)} Bajo el mínimo de 70%</span>` : ''}</div>`; })() : ''}</div>
            ${fees(doc).length ? html`<div class="qfees"><span class="lbl">+ Fee por crecimiento (variable, se suma cada mes)</span>${fees(doc).map((i) => html`<div>${ico('trend', 14)} ${growthText(i.growth)} <span style="opacity:.7">· ${i.name}</span></div>`)}</div>` : ''}
            <div class="foot" style="margin-top:22px;opacity:1"><button class="btn cream" data-act="pdf">↓ Ver PDF</button>${qq ? html`<button class="btn ghost" data-act="delQ" style="background:transparent;color:#fdfaf3;border-color:rgba(253,250,243,.4)">${ico('trash', 16)}</button>` : ''}</div>
          </div>
        </div>`);
      $('#addSvc', el).onchange = async (e) => {
        sync(); const v = e.target.value;
        if (v === 'new') {
          const n = await ask('Nuevo servicio', [{ k: 'name', l: 'Nombre', req: true }, { k: 'category', l: 'Categoría', t: 'select', opts: CATS.map((c) => [c, c]), half: true }, { k: 'unit', l: 'Se cobra por', t: 'select', opts: [['proyecto', 'Proyecto'], ['mes', 'Mes'], ['pieza', 'Pieza'], ['hora', 'Hora']], half: true }, { k: 'price', l: 'Precio (Q)', t: 'number', req: true }, { k: 'description', l: 'Descripción (sale en la cotización)', t: 'textarea' }]);
          if (!n) return draw();
          try { const r = await S.create({ ...n, price: +n.price || 0, tasks: [] }); services.push(r); doc.items.push({ service_id: r.id, name: r.name, description: r.description || '', qty: 1, price: r.price }); toast('Servicio creado y agregado · Sus horas se editan en Servicios'); }
          catch (err) { toast(err.message, true); }
          return draw();
        }
        if (v.startsWith('plan:')) { const p = plans.plans.find((x) => x.id === v.slice(5)); doc.items.push({ name: `${levelName(p.name)} — mensual`, description: p.promete || '', qty: 1, price: p.precio }); }
        else if (v === 'free') doc.items.push({ name: 'Servicio', description: '', qty: 1, price: null });
        else if (v) { const s = services.find((x) => x.id === v); const lv = s.level || 5; doc.items.push({ service_id: s.id, name: s.name, description: s.description || '', qty: 1, level: lv, price: priceAt(s, lv) ?? s.price ?? null, ...(growthOf(s) ? { growth: growthOf(s) } : {}) }); }
        draw();
      };
      $$('[data-f], #qdisc, #qvalid, #qrate', el).forEach((inp) => inp.addEventListener('change', () => { sync(); draw(); }));
      $('#qcur', el).onchange = async (e) => { sync(); doc.currency = e.target.value; if (doc.currency === 'GTQ') { doc.rate = 1; return draw(); } try { doc.rate = (await api('fx?to=' + doc.currency)).rate; toast(`1 Q = ${doc.rate} ${doc.currency}`); } catch (err) { doc.rate = doc.rate || null; toast(err.message, true); } draw(); };
      // Al elegir un lead del CRM se llenan su contacto y su correo.
      $('[name=client]', el)?.addEventListener('change', (ev) => { const l = leads.find((x) => x.name.trim().toLowerCase() === ev.target.value.trim().toLowerCase()); if (!l) return; doc.lead_id = l.id; const c = $('[name=contact]', el); if (c && !c.value) c.value = l.contact || ''; if (!doc.email) doc.email = l.email || ''; });
      // Arrastrar el nivel: mientras se mueve solo cambian el texto y el precio; al soltar se recalcula todo.
      $$('[data-qlv]', el).forEach((r) => {
        const i = +r.dataset.qlv, it = doc.items[i], sv = services.find((x) => x.id === it.service_id);
        r.addEventListener('input', () => { const lv = +r.value; const p = priceAt(sv, lv); $(`[data-lvl="${i}"]`, el).textContent = `${lvName(lv)} · ${lv} · ${svcHours(sv, lv)} h`; if (p != null) $(`[data-pshow="${i}"]`, el).textContent = money(doc, p); const inc = $(`[data-inc="${i}"]`, el); if (inc) mount(inc, incHtml(sv, lv)); });
        r.addEventListener('change', () => { sync(); it.level = +r.value; const p = priceAt(sv, it.level); if (p != null) it.price = p; draw(); });
      });
    };
    const sync = () => {
      $$('[data-f]', el).forEach((inp) => { const it = doc.items[+inp.dataset.i]; const f = inp.dataset.f; if (f === 'growth_pct') { if (it.growth) it.growth.pct = +inp.value || 0; return; } it[f] = f === 'qty' || f === 'price' ? (inp.value === '' ? null : +inp.value) : inp.value; });
      const f = $('#qf', el); if (f) Object.assign(doc, Object.fromEntries(new FormData(f)));
      if ($('#qrate', el)) doc.rate = +$('#qrate', el).value || doc.rate;
      if ($('#qdisc', el)) { doc.discount_pct = +$('#qdisc', el).value || 0; doc.valid_days = +$('#qvalid', el).value || 15; doc.days = +($('#qdays', el)?.value || 0) || null; doc.notes = $('#qnotes', el).value; doc.intro = $('#qintro', el)?.value || ''; doc.next = $('#qnext', el)?.value || ''; doc.status = $('#qstatus', el).value; }
    };
    const handlers = {
      back: () => { location.hash = '/sales/quotes'; paint(); },
      rmItem: (b) => { sync(); doc.items.splice(+b.dataset.i, 1); draw(); },
      rmGrowth: (b) => { sync(); doc.items[+b.dataset.i].growth = null; draw(); },
      saveQ: async () => {
        sync();
        if (!doc.client) return toast('Falta el cliente', true);
        // El cliente sale del CRM: si ya es lead se enlaza; si es nuevo, se crea en el CRM. Así en Control pasa de interesado a cotizado.
        try {
          const key = (x) => String(x || '').trim().toLowerCase();
          let ld = leads.find((l) => l.id === doc.lead_id && key(l.name) === key(doc.client)) || leads.find((l) => key(l.name) === key(doc.client));
          // Un lead abierto siempre lleva siguiente paso: al cotizar, es dar seguimiento a la cotización.
          const follow = { next_step: 'Dar seguimiento a la cotización', next_date: plusDays(3) };
          if (!ld) { ld = await L.create({ name: doc.client.trim(), contact: doc.contact || '', email: doc.email || '', stage: 'Propuesta', owner_role: 'ventas', ...follow, tags: [], activity: [act(`Lead creado desde la cotización ${doc.number}`)] }); leads.push(ld); }
          else if (['Prospecto', 'Nuevo', 'Contactado', 'Reunión'].includes(ld.stage || 'Nuevo')) { const r = await L.save({ ...ld, stage: 'Propuesta', ...(ld.next_step && ld.next_date >= T ? {} : follow), activity: [...(ld.activity || []), act(`Etapa: ${stageLabel(ld.stage)} → ${stageLabel('Propuesta')} · cotización ${doc.number}`)] }); leads = leads.map((x) => (x.id === r.id ? r : x)); }
          doc.lead_id = ld.id; if (!doc.contact) doc.contact = ld.contact || ''; if (!doc.email) doc.email = ld.email || '';
        } catch (e) { return toast(e.message, true); }
        // Enviada, aprobada o rechazada no es solo una etiqueta: dispara el flujo (tarea de cobro, lead, Control).
        const STEP = { Enviada: 'send', Aceptada: 'approve', Rechazada: 'reject' };
        const prev = (doc.id && quotes.find((x) => x.id === doc.id)?.status) || 'Borrador', want = doc.status, go = STEP[want] && want !== prev;
        if (go) doc.status = prev;
        try { let r = doc.id ? await C.save(doc) : await C.create(doc);
          if (go) { await api('flow/quote/' + r.id, { method: 'POST', body: { action: STEP[want] } }); r = await C.get(r.id); }
          quotes = quotes.some((x) => x.id === r.id) ? quotes.map((x) => (x.id === r.id ? r : x)) : [...quotes, r]; doc = JSON.parse(JSON.stringify(r));
          toast(go && want === 'Aceptada' ? 'Aprobada · se creó la tarea para subir el pago' : 'Cotización guardada'); draw(); }
        catch (e) { toast(e.message, true); }
      },
      pdf: () => { sync(); showPdf(doc); },
      fixSvc: (b) => { sync(); const sv = services.find((x) => x.id === b.dataset.id); if (sv) editService(sv, (r) => { doc.items.filter((i) => i.service_id === r.id).forEach((i) => { const p = priceAt(r, i.level || r.level || 5); if (p != null) i.price = p; }); draw(); }); },
      // De cotización a proyecto: los mismos servicios con su nivel, sus horas y sus tareas.
      toProject: async () => {
        sync();
        const items = doc.items.filter((i) => i.service_id).map((i) => { const sv = services.find((x) => x.id === i.service_id); if (!sv) return null; const lv = i.level || sv.level || 5;
          return { id: sv.id, name: sv.name, level: lv, days: daysAt(sv, lv) || null, includes: includesAt(sv, lv), hours: svcHours(sv, lv) * (+i.qty || 1), roles: (sv.tasks || []).map((t) => ({ role: t.role, hours: hoursAt(t, lv) * (+i.qty || 1) })), price: (+i.price || 0) * (+i.qty || 1) }; }).filter(Boolean);
        const r = await newProject({ team: await teamList(), me, projects: await col('projects').list(), tasks: [], pre: { kind: 'Custom', items, name: `${doc.client} · ${doc.number}`, quote_id: doc.id } });
        if (r) { if (doc.status !== 'Aceptada') { doc.status = 'Aceptada'; try { const q = await C.save(doc); doc = JSON.parse(JSON.stringify(q)); quotes = quotes.map((x) => (x.id === q.id ? q : x)); } catch {} } toast('Proyecto creado desde la cotización'); location.hash = '/operations'; }
      },
      delQ: async () => { if (!(await confirmAsk(`¿Eliminar ${doc.number}?`))) return; await C.remove(doc.id); quotes = quotes.filter((x) => x.id !== doc.id); paint(); },
    };
    el.onclick = (e) => { const t = e.target.closest('[data-act]'); if (t && handlers[t.dataset.act]) { e.stopImmediatePropagation(); handlers[t.dataset.act](t, e); } };
    draw();
  }

  // Descarga directa del PDF (sin el diálogo de imprimir), con nombre «Inherent cotización - Marca - fecha».
  // Ninguna tarjeta o bloque queda partido entre dos páginas.
  const loadJs = (src) => new Promise((ok, ko) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = () => ko(new Error('No pude cargar el generador de PDF')); document.head.appendChild(sc); });
  const loadH2p = async () => { if (!window.html2canvas) await loadJs('/vendor/html2canvas.min.js'); if (!window.jspdf) await loadJs('/vendor/jspdf.umd.min.js'); };
  async function downloadPdf(v, doc, btn) {
    const label = btn?.innerHTML; if (btn) { btn.disabled = true; btn.textContent = 'Generando PDF…'; }
    try {
      await loadH2p();
      const src = $('.qdoc', v), box = document.createElement('div'), clone = src.cloneNode(true);
      box.style.cssText = 'position:fixed;left:0;top:0;width:612px;background:#fff;z-index:-1;pointer-events:none'; clone.classList.add('qpdf'); box.appendChild(clone); document.body.appendChild(box);
      // Los logos SVG se pasan a imagen antes de convertir (el generador no dibuja SVG solo).
      await Promise.all([...clone.querySelectorAll('img')].filter((im) => /\.svg/.test(im.src)).map((im) => new Promise((ok) => {
        const w = im.getBoundingClientRect().width || 120, h = im.getBoundingClientRect().height || 40, i2 = new Image();
        i2.onload = () => { const c = document.createElement('canvas'); c.width = w * 3; c.height = h * 3; c.getContext('2d').drawImage(i2, 0, 0, c.width, c.height); im.style.width = w + 'px'; im.style.height = h + 'px'; im.src = c.toDataURL('image/png'); ok(); };
        i2.onerror = ok; i2.src = im.src; })));
      const safe = (t) => String(t || '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();
      const name = `Inherent cotización - ${safe(doc.client) || 'Cliente'} - ${doc.date || today()}.pdf`;
      // Hojas por sección: principal · qué entregamos · inversión (junto a «qué entregamos» si cabe). Cada sección se dibuja completa en una
      // hoja carta al mismo ancho; si no cabe, se dibuja más ancha (letra relativamente más chica) y se reduce a la
      // hoja, hasta que quepa. Solo si una sección es enorme se reparte en varias hojas, sin partir tarjetas.
      const kids = [...clone.children], iEnt = kids.findIndex((k) => k.classList.contains('qent')), iInv = kids.findIndex((k) => k.classList.contains('qinv'));
      const cuts = [0, iEnt, iInv, kids.length].filter((x, i, a) => x >= 0 && (i === 0 || x > a[i - 1]));
      const PW = 612, PH = 792, M = 22, AV = PH - 2 * M, sy = scrollY, sx = scrollX, pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
      clone.remove(); scrollTo(0, 0);
      const shot = (pg, W) => window.html2canvas(pg, { scale: 2.5 * 612 / W + 0.5, backgroundColor: '#ffffff', width: W, windowWidth: W, useCORS: true, x: 0, y: 0, scrollX: 0, scrollY: 0, logging: false });
      const mk = (els, W, cls = '') => { const pg = document.createElement('div'); pg.className = 'qdoc qpdf'; pg.style.setProperty('--pw', W + 'px'); box.style.width = W + 'px'; let host = pg;
        if (cls) { host = document.createElement('div'); host.className = cls; host.style.marginTop = '0'; pg.appendChild(host); } els.forEach((e) => host.appendChild(e)); box.replaceChildren(pg); return pg; };
      let first = true; const page = () => { if (!first) pdf.addPage('letter', 'portrait'); first = false; };
      try {
        const fit = async (els, widths) => { for (const W of widths) { const pg = mk(els, W);
          if (pg.offsetHeight * PW / W <= AV) { const cv = await shot(pg, W), dh = cv.height * PW / cv.width; page(); pdf.addImage(cv.toDataURL('image/jpeg', 0.95), 'JPEG', 0, M, PW, dh); return true; } } return false; };
        const ALL = [612, 660, 710, 770, 830, 900], groups = cuts.slice(0, -1).map((c, g) => kids.slice(c, cuts[g + 1]));
        // La inversión va en la misma hoja que «Qué entregamos» si cabe casi a tamaño normal; si no, baja a la siguiente.
        const both = iEnt >= 0 && iInv > iEnt && groups.length === 3;
        for (let g = 0; g < groups.length; g++) {
          const els = groups[g];
          if (both && g === 1 && await fit([...groups[1], ...groups[2]], [612, 660, 710])) break;
          if (await fit(els, ALL)) continue;
          // Sección enorme: por bloques (cada título pegado a lo que sigue; tarjetas de dos en dos) al ancho más chico.
          const W = 900, blocks = []; let pend = null;
          const push = (e, cls) => { if (pend) { e = [...pend.e, ...e]; cls = pend.cls || cls; pend = null; } blocks.push({ e, cls }); };
          els.forEach((k) => {
            if (k.classList.contains('qsec')) [...k.children].forEach((c) => {
              if (c.classList.contains('lbl2') && !pend) pend = { e: [c], cls: k.className };
              else if (c.classList.contains('qgets')) { const cards = [...c.children]; for (let j = 0; j < cards.length; j += 2) { const row = document.createElement('div'); row.className = c.className; row.style.marginBottom = '10px'; cards.slice(j, j + 2).forEach((x) => row.appendChild(x)); push([row], k.className); } }
              else push([c], k.className);
            });
            else if (k.classList.contains('lbl2')) pend = { e: [k], cls: '' };
            else push([k], '');
          });
          if (pend) push([], '');
          let y = PH; 
          for (const bl of blocks) { const cv = await shot(mk(bl.e, W, bl.cls), W), dh = cv.height * PW / cv.width; if (y + dh > PH - M) { page(); y = M; } pdf.addImage(cv.toDataURL('image/jpeg', 0.95), 'JPEG', 0, y, PW, dh); y += dh; }
        }
      } finally { scrollTo(sx, sy); }
      const out = pdf.output('blob'), a = document.createElement('a'); a.href = URL.createObjectURL(out); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      box.remove();
    } catch (e) { toast(e.message || 'No se pudo generar el PDF', true); }
    if (btn) { btn.disabled = false; btn.innerHTML = label; }
  }

  // Ícono de cada cosa que entregamos, según de qué trata.
  const icOf = (t) => { const x = String(t || '').toLowerCase(); return /financ|inversi|costo|ganancia|dashboard|anal[ií]tica|medici/.test(x) ? 'bars' : /oferta|precio|paquete/.test(x) ? 'tag' : /agente|\bia\b|inteligencia/.test(x) ? 'bolt' : /automatiz|proceso/.test(x) ? 'gear' : /whatsapp|contacto|mensaje|pedido|crm|seguimiento/.test(x) ? 'chat' : /email|correo/.test(x) ? 'mail' : /web|sitio|página|landing|google|seo/.test(x) ? 'monitor' : /instagram|redes|presencia|contenido|publica|campañ/.test(x) ? 'megaphone' : /video|reel|rodaje|ugc/.test(x) ? 'video' : /foto/.test(x) ? 'camera' : /pauta|anuncio|meta|prospecci/.test(x) ? 'target' : /retenci|recompra/.test(x) ? 'repeat' : /expansi|sucursal|mercado/.test(x) ? 'globe' : /estructura empresarial|equipo|quién hace/.test(x) ? 'users' : /lanzamiento/.test(x) ? 'rocket' : 'check'; };
  function showPdf(doc) {
    const valid = new Date(doc.date + 'T12:00'); valid.setDate(valid.getDate() + (+doc.valid_days || 15));
    const st = subtotal(doc), tt = total(doc);
    const v = document.createElement('div'); v.className = 'qview';
    mount(v, html`<div class="qbar"><button class="btn" data-x="print">↓ Descargar PDF</button><button class="btn ghost" data-x="close">Cerrar</button><div class="sp"></div><span class="sm" style="color:var(--cream);align-self:center;display:none">En el diálogo elige «Guardar como PDF»</span></div>
      <div class="qdoc">
        <div class="qh"><div class="qlogo"><img src="/brand/emblem-dark.svg" alt=""><div><img src="/brand/wordmark-dark.svg" alt="Inherent" style="height:26px;width:auto;display:block"><div class="go" style="margin-top:6px">GROWTH PARTNER</div></div></div>
          <div class="qmeta"><b>Cotización</b>${doc.number}<br>${fdateLong(doc.date)}<br>Válida hasta el ${fdateLong(valid.toISOString().slice(0, 10))}</div></div>
        <div class="qto"><div><div class="lbl2">PARA</div><b style="font-weight:500;font-size:15px">${doc.client}</b>${doc.contact ? html`<div>${doc.contact}</div>` : ''}</div>
          <div><div class="lbl2">DE</div><b style="font-weight:500;font-size:15px">Inherent</b><div>inherentglobal.com</div></div></div>
        ${(() => { const lines = String(doc.intro || '').split('\n').map((l) => l.trim()).filter(Boolean), whys = doc.items.filter((i) => (i.why || []).length);
          // El texto se arma por secciones (títulos en MAYÚSCULAS): lo que recibes en tarjetas con ícono, el crecimiento resaltado.
          const secs = [{ h: '', ls: [] }]; lines.forEach((l) => { if (l.length > 6 && l === l.toUpperCase() && /[A-ZÁÉÍÓÚ]/.test(l)) secs.push({ h: l, ls: [] }); else secs.at(-1).ls.push(l); });
          const strip = (l) => l.replace(/^(\d+[.)]|[-•])\s*/, '');
          const split2 = (l) => { const t = strip(l), m = t.match(/^([^.:]{3,80})[.:]\s+(.*)$/); return m ? [m[1], m[2]] : [t, '']; };
          const vSec = (sc) => { const h = sc.h.toLowerCase();
            if (/recib|incluye(?!.*no)|entregamos/.test(h) && !/no incluye/.test(h)) return html`<div class="lbl2" style="margin-top:14px">${sc.h}</div><div class="qgets">${sc.ls.map((l) => { const [t, d] = split2(l); return html`<div class="qget"><span class="qgi">${ico(icOf(t + ' ' + d), 18)}</span><div><b>${t}</b>${d ? html`<div>${d}</div>` : ''}</div></div>`; })}</div>`;
            if (/crecimiento|lograr|resultado/.test(h)) return html`<div class="qgrow"><div class="lbl2">${sc.h}</div>${sc.ls.map((l) => { const [t, d] = split2(l); return html`<div class="qgr"><span class="qgi up">${ico('trend', 16)}</span><div>${d ? html`<b>${t}.</b> ${d}` : t}</div></div>`; })}</div>`;
            if (/no incluye/.test(h)) return html`<div class="lbl2" style="margin-top:14px">${sc.h}</div><div class="qnot">${sc.ls.map((l) => html`<div>${ico('x', 12)} ${strip(l)}</div>`)}</div>`;
            return html`${sc.h ? html`<div class="lbl2" style="margin-top:14px">${sc.h}</div>` : ''}${sc.ls.map((l) => html`<p>${l}</p>`)}`; };
          return lines.length ? html`<div class="qsec"><div class="lbl2">LO QUE VAMOS A LOGRAR EN TU NEGOCIO</div>${secs.map(vSec)}</div>` : ''; })()}
        <div class="qsec qent"><div class="lbl2">QUÉ ENTREGAMOS Y CÓMO TE AYUDA</div><div class="qgets qsvc">${doc.items.map((i) => { const sv = services.find((x) => x.id === i.service_id), lv = i.level || sv?.level || 5, inc = i.includes?.length ? i.includes : sv ? includesAt(sv, lv) : [], d = sv ? daysAt(sv, lv) : 0;
          // Tarjeta por servicio con su texto completo (nunca cortado); si no cabe, la hoja se reduce entera.
          return html`<div class="qget qs"><span class="qgi">${ico(icOf(i.name + ' ' + (sv?.category || '')), 18)}</span><div><b>${i.name}</b><div class="qsm">${i.level ? `Entrega ${lvName(i.level).toLowerCase()}` : ''}${d ? `${i.level ? ' · ' : ''}${d} días hábiles` : ''}</div>${(sv?.edge || i.edge) ? html`<div class="qedge">${ico('spark', 12)} ${sv?.edge || i.edge}</div>` : i.description ? html`<div>${i.description}</div>` : ''}${inc.length ? html`<ul>${inc.map((x) => html`<li>${x}</li>`)}</ul>` : ''}${(i.why || []).length ? html`<div class="qsm" style="margin-top:4px">Se mide: ${i.why.map((w) => String(w).replace(/\s—\s*se mide con:.*$/i, '')).join(' · ')}</div>` : ''}</div></div>`; })}</div></div>
        <div class="lbl2 qinv" style="margin-top:22px">INVERSIÓN</div>
        <table><thead><tr><th>Servicio</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Total</th></tr></thead>
          <tbody>${doc.items.map((i) => html`<tr><td><b style="font-weight:500">${i.name}</b></td><td class="n">${i.qty}</td><td class="n">${money(doc, i.price)}</td><td class="n">${money(doc, (+i.qty || 0) * (+i.price || 0))}</td></tr>`)}</tbody></table>
        <div class="qsum"><div><span>Subtotal</span><span>${money(doc, st)}</span></div>${doc.discount_pct ? html`<div><span>Descuento (${doc.discount_pct}%)</span><span>-${money(doc, st - tt)}</span></div>` : ''}<div class="tot"><span>Total</span><span>${money(doc, tt)}</span></div>${quoteDays(doc) ? html`<div><span>Tiempo estimado</span><span>${quoteDays(doc)} días hábiles</span></div>` : ''}</div>
        ${fees(doc).length ? html`<div class="qnotes"><div class="lbl2">FEE POR CRECIMIENTO · VARIABLE</div>${fees(doc).map((i) => html`<div><b style="font-weight:500">${i.name}:</b> ${growthText(i.growth)}${i.growth.how ? html` <span style="color:var(--ui-ink2)">— ${i.growth.how}</span>` : ''}</div>`)}<div style="color:var(--ui-ink2);font-size:11.5px;margin-top:6px">Se calcula cada mes sobre el crecimiento medido y atribuible a este servicio. Sin atribución clara, no se cobra.</div></div>` : ''}
        <div class="qsec"><div class="lbl2">SIGUIENTES PASOS</div><ol>${(String(doc.next || '').split('\n').map((l) => l.trim()).filter(Boolean).length ? String(doc.next).split('\n').map((l) => l.trim()).filter(Boolean) : ['Confirmas esta propuesta y el alcance.', 'Hacemos una llamada de arranque para tomar tus datos y accesos.', 'Coordinamos el primer pago y firmamos.', 'Empezamos y te mostramos avances en cada entrega.']).map((l) => html`<li>${l}</li>`)}</ol></div>
        ${doc.notes && !(/no incluye/i.test(doc.intro || '') && /^\s*no incluye/i.test(doc.notes)) ? html`<div class="qnotes"><div class="lbl2">NOTAS Y CONDICIONES</div>${doc.notes.split('\n').map((l) => html`<div>${l}</div>`)}</div>` : ''}
        <div class="qfoot"><span>Inherent · Growth Partner</span><span>inherentglobal.com</span></div>
      </div>`);
    document.body.append(v);
    v.onclick = (e) => { const x = e.target.closest('[data-x]')?.dataset.x; if (x === 'print') downloadPdf(v, doc, e.target.closest('[data-x]')); if (x === 'close' || e.target === v) v.remove(); };
  }

  // ---------- acciones ----------
  acts(el, {
    tab: (b) => { tab = b.dataset.t; history.replaceState(null, '', '#/sales/' + tab); swap(el, paint); },
    crmView: (b) => { crmView = b.dataset.v; try { localStorage.setItem('ventas.vista', crmView); } catch {} paint(); },
    vista: (b) => { vistaF = b.dataset.k; paint(); },
    encF: (b) => { encF = b.dataset.e; prosTab($('#body', el)); },
    bfuente: (b) => { $$('[data-act="bfuente"]', b.parentElement).forEach((x) => x.classList.toggle('on', x === b)); const q = $('#bform [name="q"]', el), lg = $('#bform [name="lugar"]', el); if (q) q.placeholder = b.dataset.f === 'maps' ? 'Qué buscar · ej. restaurantes' : 'Qué buscar · ej. cafeterías guatemala'; if (lg) lg.hidden = b.dataset.f !== 'maps'; },
    brecoger: (b) => recoger(b.dataset.id),
    layaPros: () => layaPros(),
    metaEdit: () => editarMeta(),
    ticketEdit: async () => { const v = await ask('Ticket promedio (USD al mes)', [{ k: 't', l: 'Lo que paga en promedio un cliente nuevo', t: 'number', v: metaDoc?.ticket || '', req: true }]); if (v) guardarMeta({ ticket: +v.t }); },
    outreach: async (b) => { const l = leads.find((x) => x.id === b.dataset.id); if (l && await saveLead({ ...l, activity: [...(l.activity || []), { ...act('Mensaje de outreach'), kind: 'outreach' }] }, '+1 outreach')) paint(); },
    tagF: (b) => { tagF = b.dataset.t; paint(); },
    stageF: (b) => { stageF = stageF === b.dataset.f ? '' : b.dataset.f; if (crmView === 'pros') crmView = 'list'; paint(); },
    replied: async (b) => { const l = leads.find((x) => x.id === b.dataset.id); if (l && await replied(l)) paint(); },
    lead: (b) => openLead(leads.find((l) => l.id === b.dataset.id)),
    newLead,
    newQuote: () => editQuote(null, null),
    quote: (b) => editQuote(quotes.find((x) => x.id === b.dataset.id)),
    toCrm: async (b) => { const l = leads.find((x) => x.id === b.dataset.id); if (l && await moveLead(l, b.dataset.s)) paint(); },
    archive: async (b) => { const l = leads.find((x) => x.id === b.dataset.id); if (l && await saveLead({ ...l, archived: true, activity: [...(l.activity || []), act('Archivado de la bandeja de prospectos')] })) paint(); },
    newSrc: () => editSource(null),
    srcEdit: (b) => editSource(srcs.find((x) => x.id === b.dataset.id)),
    srcLog: (b) => srcLog(srcs.find((x) => x.id === b.dataset.id)),
    srcToggle: async (b) => { const sx = srcs.find((x) => x.id === b.dataset.id); try { const r = await SRC.save({ ...sx, active: sx.active === false }); srcs = srcs.map((x) => (x.id === r.id ? r : x)); toast(r.active === false ? 'Fuente pausada · su link ya no recibe' : 'Fuente activa'); paint(); } catch (e) { toast(e.message, true); } },
    copyLink: (b) => { const sx = srcs.find((x) => x.id === b.dataset.id); navigator.clipboard?.writeText(srcLink(sx)).then(() => toast('Link copiado')).catch(() => toast('No pude copiar; selecciónalo del campo', true)); },
  });
  paint();
  // El cronómetro corre cada segundo; cada 30 s se revisa si entró un lead nuevo (solo en el CRM, con la pestaña a la vista y sin un lead abierto).
  let ticks = 0;
  const tick = setInterval(async () => {
    if (!alive()) return clearInterval(tick);
    updateWaits($$('[data-wait]'), Date.now());
    if (++ticks % 30 || tab !== 'crm' || document.visibilityState !== 'visible' || $('#drawer')?.classList.contains('on') || document.activeElement?.id === 'q') return;
    try { const fresh = await L.list(); const sig = (ls) => ls.filter(isWaiting).map((x) => x.id).sort().join(); const changed = sig(fresh) !== sig(leads) || fresh.length !== leads.length; leads = fresh; if (changed && alive() && tab === 'crm') paint(); } catch {}
  }, 1000);
  // Desde Control: #/sales/quotes/new/<lead> abre una cotización para ese lead; #/sales/quotes/<id> la abre.
  if (sub[0] === 'quotes' && sub[1] === 'new') editQuote(null, leads.find((x) => x.id === sub[2]) || null);
  else if (sub[0] === 'quotes' && sub[1]) { const qq = quotes.find((x) => x.id === sub[1]); if (qq) editQuote(qq); }
  // #/sales/crm/<lead> abre ese lead (el chip «Vino de» de la ficha del cliente lleva aquí).
  else if (sub[0] === 'crm' && sub[1]) { const l = leads.find((x) => x.id === sub[1]); if (l) openLead(l); }
}
