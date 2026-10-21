// Hoy. Para el CEO y el COO: el pulso del mes (un número por área), lo que necesita atención, la agenda y el contenido.
// Para el equipo: sus responsabilidades (qué, para cuándo y dónde se entrega). Sin revenue, leads ni engagement.
import { html, raw, mount, col, api, fdate, today, toast, acts, IC, $, $$, Q, USD, calQ, teamList, ico, initials } from '../core.js';
import { upcoming, people as meetPeople } from '../meetings.js';
import { kpis, PAL } from '../charts.js';
import { openDelivery, dueChip, stChip } from '../taskcard.js';
import { bdayText } from './me.js';
import { connectNotice, hookNotice } from '../connectai.js';
import { purposeCard } from '../purpose.js';
import { estadoDe } from '../element.js';
import { dueAccess, dueSoon, durText, updateWaits } from '../ventas-flujo.js';
import { llevamos, pronostico, habilesQuedan } from '../ventas-meta.js';
import { totales } from '../facturas.js';
import { goalsOf, healthOf } from '../goals.js';
import { levelName } from '../levels.js';
import { payDialog, openProof, confirmarYArrancar } from '../flowui.js';

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };
const mondayOf = (s) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };

export async function render(el, { me, alive }) {
  const ceoish = me.role === 'ceo' || me.role === 'coo';
  let [tasks, projects, people, accounts] = await Promise.all([col('tasks').list(), col('projects').list().catch(() => []), teamList().catch(() => []), col('accounts').list().catch(() => [])]);
  let repoClients = null; if (ceoish) api('repo/clients').then((r) => { repoClients = r.clients || []; if (alive()) paint(); }).catch(() => { repoClients = []; });
  const T = today(), M = T.slice(0, 7), first = (me.name || '').split(' ')[0];
  const monday = mondayOf(T), sunday = addDays(monday, 6);
  const st = (t) => t.status || 'Por empezar', open = (t) => st(t) !== 'Hecha';
  const proj = (id) => projects.find((p) => p.id === id);
  const person = (k) => people.find((p) => p.id === k || p.email === k);
  const nameOf = (k) => person(k)?.name || (k === me.email ? me.name : k ? String(k).split('@')[0] : 'Sin responsable');
  const clientOf = (t) => { const p = proj(t.project_id); return p ? p.client || p.name : 'Interno'; };
  // Cumpleaños del equipo: hoy y los próximos 7 días.
  const md = (d) => d.toISOString().slice(5, 10), soon = Array.from({ length: 8 }, (_, i) => md(new Date(Date.now() + i * 864e5)));
  const bdays = people.filter((p) => p.active !== false && p.birthday && soon.includes(p.birthday)).sort((a, z) => soon.indexOf(a.birthday) - soon.indexOf(z.birthday));
  // La agenda de Google Calendar de hoy (se refresca al volver a la pestaña y cada 2 minutos).
  let agenda = null, agErr = null;
  const loadAgenda = () => api(`google/calendar?from=${T}&to=${ceoish ? addDays(T, 14) : T}${calQ()}`).then((r) => { agenda = r.events || []; agErr = null; }).catch((e) => { agErr = e.message; agenda = []; }).then(() => alive() && paint());
  loadAgenda();
  const iv = setInterval(() => (alive() ? document.visibilityState === 'visible' && loadAgenda() : clearInterval(iv)), 120000);
  const onVis = () => { if (!alive()) return document.removeEventListener('visibilitychange', onVis); if (document.visibilityState === 'visible') loadAgenda(); };
  document.addEventListener('visibilitychange', onVis);

  // «Vence pronto»: leads sin responder y seguimientos de ventas de hoy o mañana (quien ve Ventas) y facturas de los
  // próximos 7 días o vencidas (por cobrar: el CEO y quien ve Finanzas; por pagar: solo el CEO). Se carga aparte.
  const acc = dueAccess(me);
  let dueLeads = acc.sales ? null : [], dueInv = acc.cobrar || acc.pagar ? null : [];
  if (acc.sales) col('leads').list().catch(() => []).then((l) => { dueLeads = l; if (alive()) paint(); });
  if (acc.cobrar || acc.pagar) col('invoices').list().catch(() => []).then((l) => { dueInv = l; if (alive()) paint(); });
  const tk = setInterval(() => (alive() ? updateWaits($$('[data-wait]', el), Date.now()) : clearInterval(tk)), 1000);
  const money = (n, c = 'GTQ') => { try { return new Intl.NumberFormat('es-GT', { style: 'currency', currency: c, maximumFractionDigits: c === 'GTQ' ? 0 : 2 }).format(+n || 0); } catch { return Q(n); } };
  const vpRow = (x) => html`<a class="wkrow" href="${x.href}"><span class="grow"><b style="font-weight:500">${x.title}</b><span class="mut sm"> · ${x.kind === 'lead' ? x.sub : `${x.kind === 'cobrar' ? 'Por cobrar' : 'Por pagar'}${x.sub ? ' · ' + x.sub : ''}`}</span></span>${x.kind !== 'lead' ? html`<span class="sm vp-amt">${money(x.amount, x.currency)}</span>` : ''}${x.wait != null ? html`<span class="vf-timer ${x.tone}" data-wait="${x.created}" title="Sin responder desde que entró">${durText(x.wait)}</span>` : html`<span class="chip sm2 ${x.tone === 'late' ? 'red' : ''}">${x.date < T ? `Venció ${fdate(x.date)}` : whenLabel(x.date)}</span>`}</a>`;
  const dueCard = () => {
    if (!acc.sales && !acc.cobrar && !acc.pagar) return '';
    const items = dueSoon({ leads: dueLeads || [], invoices: dueInv || [], access: acc, T, now: Date.now() }), loading = dueLeads === null || dueInv === null;
    return html`<div class="sp-callout info hoy-att hoy-vp" style="flex-direction:column;gap:2px;align-items:stretch">
      <div class="row" style="gap:8px">${ico('clock', 16)}<b>Vence pronto</b><span class="mut sm">${acc.sales && (acc.cobrar || acc.pagar) ? 'Leads, seguimientos y facturas' : acc.sales ? 'Leads y seguimientos' : 'Facturas'}, por fecha</span><div class="sp"></div>${items.length ? html`<span class="badge-n">${items.length}</span>` : ''}</div>
      ${items.length ? items.slice(0, 5).map(vpRow) : loading ? html`<p class="loading sm">Cargando…</p>` : html`<div class="mut sm">Nada vence en estos días ${ico('check', 14)}</div>`}
      ${items.length > 5 ? html`<span class="sm mut" style="padding-top:6px">y ${items.length - 5} más</span>` : ''}</div>`;
  };

  const ctx = () => ({ me, projects, team: people });
  const onTask = (r, t) => { tasks = r ? tasks.map((x) => (x.id === r.id ? r : x)) : tasks.filter((x) => x.id !== t.id); paint(); };
  const trow = (t, extra = '') => html`<div class="wkrow" data-act="open" data-id="${t.id}"><span class="grow"><b style="font-weight:500">${t.title}</b><span class="mut sm"> · ${clientOf(t)}${extra ? ' · ' + extra : ''}</span></span>${dueChip(t)}${stChip(t)}</div>`;
  const agendaRows = () => agenda === null ? html`<p class="mut sm">Cargando tu agenda…</p>` : agErr ? html`<div class="mut sm">No pude leer tu Google Calendar. <button class="sm linkish" data-act="agRetry">Reintentar</button></div>`
    : agenda.slice(0, 5).map((e) => html`<a class="wkrow" href="${/^https:\/\//.test(e.link || '') ? e.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="wkt">${e.allDay ? 'Día' : String(e.start).slice(11, 16)}</span><span class="grow">${e.summary}</span>${e.meet ? html`<span class="mut sm">Meet</span>` : ''}</a>`);
  const head = (linea) => html`<div class="hello sp-hero"><h1>${greet()}, ${first}.</h1><p>${linea || (ceoish ? html`Esto es lo que pasa hoy en <em>Inherent</em>.` : html`Esto es lo tuyo <em>hoy</em>.`)}</p></div>
    ${bdays.length ? html`<div class="bday">${bdays.map((p) => { const now = p.birthday === soon[0], mine = (p.email || p.id) === me.email; return html`<span class="bdi ${now ? 'now' : ''}">${now ? (mine ? html`${ico('spark')} <b>¡Feliz cumpleaños, ${first}!</b>` : html`${ico('cake')} <b>Hoy cumple ${p.name.split(' ')[0]}</b>`) : html`${ico('cake')} ${p.name.split(' ')[0]} cumple el ${bdayText(p.birthday)}`}</span>`; })}</div>` : ''}
    ${connectNotice(me)}`;

  // ---------- CEO · COO ----------
  // Arriba, el pulso del mes: cuatro números, uno por área, y cada uno lleva a donde se trabaja (Ventas, Finanzas,
  // Proyectos, Clientes). Abajo, una sola lista de lo que se traba si nadie lo mueve, con su botón; a la derecha, la
  // agenda y el contenido del mes. Lo de cobrar y arrancar (lo que era Control del flujo) vive aquí.
  const tasksOf = (p) => tasks.filter((t) => t.project_id === p.id);
  const daysFrom = (d) => Math.round((new Date(d + 'T12:00') - new Date(T + 'T12:00')) / 864e5);
  const whenLabel = (d) => (d === T ? 'Hoy' : daysFrom(d) === 1 ? 'Mañana' : fdate(d));
  const seesClients = (me.areas || []).includes('clients');
  let quotes = null, metaDoc = null;
  if (ceoish || acc.sales) col('quotes').list().catch(() => []).then((l) => { quotes = l; if (alive()) paint(); });
  if (acc.sales) col('settings').get('ventas_meta').catch(() => null).then((d) => { metaDoc = d; if (alive()) paint(); });
  const qSub = (q) => (q.items || []).reduce((a, i) => a + (+i.qty || 0) * (+i.price || 0), 0) * (1 - (+q.discount_pct || 0) / 100);
  const pct = (a, b) => (b ? Math.max(0, Math.min(100, Math.round((a / b) * 100))) : 0);

  function pulso(late) {
    const out = [];
    if (acc.sales) {
      const l = dueLeads || [], meta = +(metaDoc?.meses?.[M]) || 0, ganado = llevamos(l, M).ganado, fc = Math.round(pronostico(l));
      out.push({ k: 'Ventas', href: '#/org/sales/crm', big: dueLeads === null ? '…' : USD(ganado), de: meta ? `de ${USD(meta)}` : '', bar: meta ? pct(ganado, meta) : null,
        sub: meta ? html`Pronóstico <em>${USD(fc)}</em> · faltan ${habilesQuedan()} días hábiles` : html`Sin meta este mes · ponla en Ventas › Meta` });
    }
    if (acc.cobrar) {
      const t = totales(dueInv || []), tot = t.cobradoMes + t.porCobrar;
      out.push({ k: 'Ingresos cobrados', href: '#/org/finanzas', big: dueInv === null ? '…' : Q(t.cobradoMes), bar: tot ? pct(t.cobradoMes, tot) : null, green: true,
        sub: t.nPorCobrar ? html`${Q(t.porCobrar)} por cobrar${t.nVencidas ? html` · <span class="r">${t.nVencidas} vencida${t.nVencidas === 1 ? '' : 's'}</span>` : ''}` : 'Nada por cobrar' });
    }
    const dueM = tasks.filter((t) => t.due && t.due.slice(0, 7) === M && t.due < T && (open(t) || t.done_at));
    const onTime = dueM.filter((t) => !open(t) && String(t.done_at).slice(0, 10) <= t.due).length, p2 = dueM.length ? Math.round((onTime / dueM.length) * 100) : null;
    out.push({ k: 'Entregas a tiempo', href: '#/org/operations', big: p2 == null ? '—' : p2, de: p2 == null ? '' : '%', bar: p2,
      sub: p2 == null ? 'Sale de las tareas de este mes que ya vencieron' : html`${onTime} de ${dueM.length}${late.length ? html` · <span class="r">${late.length} atrasada${late.length === 1 ? '' : 's'}</span>` : ''}` });
    if (seesClients) {
      const con = accounts.map((a) => ({ a, gs: goalsOf(a).filter((g) => g.status !== 'done') })).filter((x) => x.gs.length);
      const mal = con.filter((x) => x.gs.some((g) => ['riesgo', 'off'].includes(healthOf(g))));
      out.push({ k: 'Clientes en su meta', href: '#/org/clients', big: con.length ? con.length - mal.length : '—', de: con.length ? `de ${con.length}` : '', bar: con.length ? pct(con.length - mal.length, con.length) : null,
        sub: !con.length ? 'Sin metas puestas en los clientes' : mal.length ? `${mal.map((x) => x.a.name).slice(0, 2).join(' y ')} va${mal.length === 1 ? '' : 'n'} por debajo` : 'Todos van en camino' });
    }
    return html`<div class="hy-pulso">${out.map((x) => html`<a class="hy-k" href="${x.href}"><span class="hy-go">↗</span><span class="lbl" style="margin:0">${x.k}</span><b>${x.big}${x.de ? html`<small>${x.de}</small>` : ''}</b>
      <span class="hy-bar">${x.bar != null ? html`<i style="width:${x.bar}%${x.green ? ';background:#3c8a5a' : ''}"></i>` : ''}</span><span class="hy-n">${x.sub}</span></a>`)}</div>`;
  }

  // Lo que necesita atención: pagos, cotizaciones, leads listos para cotizar, seguimientos, facturas, tareas y onboardings.
  function atencion(late, review) {
    const out = [], qs = quotes || [];
    const conQuote = new Set(qs.filter((q) => q.status !== 'Rechazada').map((q) => q.lead_id).filter(Boolean));
    const money = (q, n) => { const c = q.currency || 'GTQ'; try { return new Intl.NumberFormat('es-GT', { style: 'currency', currency: c, maximumFractionDigits: c === 'GTQ' ? 0 : 2 }).format(n); } catch { return Q(n); } };
    for (const q of qs) {
      if (q.status === 'Aceptada' && q.payment?.status === 'por confirmar') out.push({ w: 0, ic: '$', tone: 'm', t: `Pago de ${q.client}`, s: `Subieron el comprobante · ${q.number} · ${money({ currency: q.payment.currency }, q.payment.amount)}`, tag: 'Hoy', btn: ceoish ? ['confirm', 'Confirmar pago', q.id, true] : null, proof: q.payment.proof_id });
      else if (q.status === 'Aceptada' && (!q.payment || q.payment.status === 'rechazado')) out.push({ w: 1, ic: '$', tone: 'm', t: `Falta el pago de ${q.client}`, s: `${q.number} · ${money(q, qSub(q))} aprobada${q.payment?.status === 'rechazado' ? ' · pago devuelto' : ''}`, tag: '', btn: ['pay', 'Subir pago', q.id] });
      else if (q.status === 'Enviada' && q.sent_at && q.sent_at.slice(0, 10) <= addDays(T, -5)) { const d = -daysFrom(q.sent_at.slice(0, 10)); out.push({ w: 3, ic: ico('mail', 14), tone: 'b', t: `${q.client} no ha respondido la cotización`, s: `${q.number} · enviada el ${fdate(q.sent_at.slice(0, 10))}`, tag: `${d} días`, red: true, href: `#/org/sales/quotes/${q.id}`, hl: 'Dar seguimiento' }); }
    }
    for (const l of dueLeads || []) if (['Reunión', 'Propuesta'].includes(l.stage) && !l.archived && !conQuote.has(l.id)) out.push({ w: 4, ic: '→', tone: 'g', t: `${l.name} · por cotizar`, s: [l.wants ? levelName(l.wants) : '', l.company].filter(Boolean).join(' · ') || 'Lista para cotizar', tag: '', href: `#/org/sales/quotes/new/${l.id}`, hl: 'Cotizar' });
    for (const x of dueSoon({ leads: dueLeads || [], invoices: dueInv || [], access: acc, T, now: Date.now() })) out.push({ w: x.date < T ? 2 : 5, ic: x.kind === 'lead' ? '☏' : '$', tone: x.kind === 'lead' ? 'b' : 'm', t: x.kind === 'lead' ? (x.wait != null ? `${x.title} espera respuesta` : `Seguimiento a ${x.title}`) : `${x.kind === 'cobrar' ? 'Cobrar a' : 'Pagar a'} ${x.title}`, s: x.kind === 'lead' ? x.sub : [x.sub, Q(x.amount)].filter(Boolean).join(' · '), tag: x.wait != null ? html`<span class="vf-timer ${x.tone}" data-wait="${x.created}">${durText(x.wait)}</span>` : x.date < T ? `Venció ${fdate(x.date)}` : whenLabel(x.date), red: x.date < T, href: x.href, hl: 'Abrir' });
    for (const t of [...late, ...review.filter((r) => !late.includes(r))]) out.push({ w: st(t) === 'En revisión' ? 6 : 2, ic: st(t) === 'En revisión' ? ico('eye', 14) : '!', tone: st(t) === 'En revisión' ? 'b' : 'v', t: st(t) === 'En revisión' ? `Revisar: ${t.title}` : t.title, s: `${clientOf(t)} · ${nameOf(t.assignee).split(' ')[0]}`, tag: st(t) === 'En revisión' ? 'En revisión' : `Venció ${fdate(t.due)}`, red: st(t) !== 'En revisión', task: t.id });
    for (const a of accounts) { const ob = a.onboarding; if (!ob?.items?.length || ob.done_at || !ob.at || ob.at.slice(0, 10) > addDays(T, -2)) continue; out.push({ w: 5, ic: '○', tone: 'b', t: `${a.name} no ha terminado su onboarding`, s: `${ob.items.filter((x) => x.done).length} de ${ob.items.length} listos`, tag: `Desde el ${fdate(ob.at.slice(0, 10))}`, href: `#/portal/${a.slug || a.id.replace(/^acc-/, '')}`, hl: 'Abrir' }); }
    return out.sort((a, z) => a.w - z.w);
  }
  const itemHtml = (x) => html`<div class="hy-it"><span class="hy-d ${x.tone}">${x.ic}</span><div class="hy-t">${x.t}<small>${x.s}</small></div><span class="hy-tag ${x.red ? 'r' : ''}">${x.tag}</span>
    ${x.proof ? html`<button class="btn ghost xs" data-act="proof" data-id="${x.proof}">Comprobante</button>` : ''}
    ${x.btn ? html`<button class="btn xs ${x.btn[3] ? '' : 'ghost'}" data-act="${x.btn[0]}" data-id="${x.btn[2]}">${x.btn[1]}</button>` : x.task ? html`<button class="btn ghost xs" data-act="open" data-id="${x.task}">Abrir</button>` : x.href ? html`<a class="btn ghost xs" href="${x.href}">${x.hl}</a>` : ''}</div>`;

  function ceo() {
    const openT = tasks.filter(open);
    const late = openT.filter((t) => t.due && t.due < T), review = tasks.filter((t) => st(t) === 'En revisión');
    // La agenda: Google Calendar + las reuniones de los proyectos.
    const evs = (agenda || []).map((e) => ({ date: String(e.start).slice(0, 10), time: e.allDay ? '' : String(e.start).slice(11, 16), name: e.summary, sub: [e.calName, e.meet ? 'Meet' : ''].filter(Boolean).join(' · '), href: /^https:\/\//.test(e.link || '') ? e.link : '', ext: true }));
    const links = new Set(evs.map((e) => e.href).filter(Boolean));
    const pm = upcoming(projects).filter((x) => !(x.link && links.has(x.link))).map((x) => ({ date: x.date, time: x.time || '', name: x.name, sub: [x.p.client || x.p.name, meetPeople(x, people, me.email).map((y) => (y.name ? y.name.split(' ')[0] : y.label)).join(', ')].filter(Boolean).join(' · '), href: x.p.client_slug ? `#/clients/${x.p.client_slug}` : '' }));
    const meets = [...evs.filter((e) => e.date >= T), ...pm].sort((a, z) => (a.date + (a.time || '99')).localeCompare(z.date + (z.time || '99')));
    const att = atencion(late, review), decide = att.filter((x) => x.btn || x.w <= 2).length;
    const n = decide || att.length;
    const fecha = new Date(T + 'T12:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());
    mount(el, html`${head(html`${fecha}${n ? html` · <em>${n} cosa${n === 1 ? '' : 's'}</em> necesita${n === 1 ? '' : 'n'} tu decisión hoy.` : ' · Todo en orden.'}`)}
      ${me.role === 'ceo' && !tasks.length && !projects.length ? html`<a class="asbar" href="#/org/setup" style="display:flex">${ico('gear')} La app todavía está vacía: <b>haz el Arranque</b> y queda lista con lo que ya dice el repo →</a>` : ''}
      <span class="lbl hy-lbl">El pulso del mes · ${new Date(T + 'T12:00').toLocaleDateString('es', { month: 'long' })}</span>
      ${pulso(late)}
      <div class="hy-two">
        <section class="hy-box" id="hoy-att"><div class="hy-bh"><h2>Necesita atención</h2><span>Lo que se traba si nadie lo mueve, con su siguiente paso</span>${att.length ? html`<span class="hy-c">${att.length}</span>` : ''}</div>
          ${att.length ? att.slice(0, 12).map(itemHtml) : html`<div class="mut sm" style="padding:10px 0">Nada trabado ${ico('check', 14)}</div>`}
          ${att.length > 12 ? html`<span class="mut sm" style="padding-top:8px">y ${att.length - 12} más</span>` : ''}</section>
        <div class="hy-side">
          <section class="hy-box"><div class="hy-bh"><h2>Agenda</h2><span>Hoy y lo que viene</span></div>
            ${agenda === null && !pm.length ? html`<p class="loading sm">Cargando tu agenda…</p>` : ''}
            ${agErr ? html`<div class="mut sm" style="padding:6px 0">No pude leer tu Google Calendar. <button class="sm linkish" data-act="agRetry">Reintentar</button></div>` : ''}
            ${meets.slice(0, 5).map((x) => html`<a class="hy-ag ${x.date === T ? 'now' : ''}" href="${x.href || '#/org/operations/cal'}" ${x.ext && x.href ? raw('target="_blank" rel="noopener noreferrer"') : ''}><span class="hy-h">${x.date === T ? x.time || 'Hoy' : whenLabel(x.date)}<small>${x.date === T ? (x.time ? 'Hoy' : '') : x.time}</small></span><span class="hy-t">${x.name}<small>${x.sub}</small></span></a>`)}
            ${agenda !== null && !meets.length ? html`<div class="mut sm" style="padding:6px 0">Sin reuniones por delante.</div>` : ''}</section>
          <section class="hy-box"><div class="hy-bh"><h2>Contenido del mes</h2><span>Publicadas de las planificadas</span></div>${contenido()}</section>
        </div>
      </div>`);
    updateWaits($$('[data-wait]', el), Date.now());
  }
  function contenido() {
    if (content.accounts === null) return html`<p class="loading sm">Cargando…</p>`;
    if (!content.accounts.length) return html`<div class="mut sm" style="padding:6px 0">Sin cuentas activas con contenido.</div>`;
    return content.accounts.map((a) => {
      const ps = content.posts.filter((x) => x.profile === a.slug && String(x.date || '').slice(0, 7) === M), pub = ps.filter((x) => estadoDe(x) === 'Publicado').length, listo = ps.filter((x) => ['Listo', 'Publicado'].includes(estadoDe(x))).length;
      return html`<a class="hy-ct" href="#/marcas/${a.slug}/calendario"><span class="hy-m"><i>${initials(a.name)}</i>${a.name}</span><span class="hy-cb">${ps.length ? html`<i style="width:${pct(listo, ps.length)}%"></i><i style="width:${pct(pub, ps.length)}%"></i>` : ''}</span><span class="hy-cn">${ps.length ? html`<b>${pub}</b> de ${ps.length}` : 'Sin piezas'}</span></a>`;
    });
  }
  // Las cuentas: los perfiles de contenido del repo que son clientes activos (más Inherent).
  const content = { accounts: null, posts: [] };
  if (ceoish) {
    Promise.all([api('repo/content').catch(() => ({ profiles: [] })), col('content').list().catch(() => []), api('repo/clients').catch(() => ({ clients: [] }))]).then(([rc, all, cl]) => {
      const act = new Set([...(cl.clients || []).filter((c) => c.hasPlan).map((c) => c.slug), ...accounts.filter((a) => a.from_quote).map((a) => a.slug || String(a.id).replace(/^acc-/, ''))]);
      content.accounts = (rc.profiles || []).filter((x) => x.slug !== 'personal' && (act.has(x.slug) || x.slug === 'inherent')).map((x) => ({ slug: x.slug, name: accounts.find((a) => a.id === 'acc-' + x.slug)?.name || x.name || x.slug.toUpperCase() }));
      content.posts = all.filter((x) => x.kind === 'post');
      if (alive()) paint();
    });
  }
  // ---------- Equipo: mis responsabilidades ----------
  function team() {
    const mine = tasks.filter((t) => t.assignee === me.email && open(t)).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
    const late = mine.filter((t) => t.due && t.due < T).length, week = mine.filter((t) => t.due && t.due >= monday && t.due <= sunday).length, review = mine.filter((t) => st(t) === 'En revisión').length;
    const groups = new Map(); for (const t of mine) { const k = t.project_id || ''; (groups.get(k) || groups.set(k, []).get(k)).push(t); }
    const title = (k) => { const p = proj(k); return p ? `${p.client ? p.client + ' · ' : ''}${p.name}` : 'Interno'; };
    const meets = upcoming(projects).filter((x) => x.date === T);
    mount(el, html`${head()}
      ${purposeCard(me, { area: 'home' })}
      ${kpis([['Esta semana', week], ['Atrasadas', late, late ? PAL.red : ''], ['En revisión', review]])}
      <div class="grid g2" style="margin-top:14px;align-items:start">
        <div><div class="sec-title" style="margin-top:0"><h2>Mis responsabilidades</h2><span class="mut sm">Qué, para cuándo y dónde se entrega</span><div class="sp"></div><button class="btn ghost xs" data-act="addTask">+ Tarea</button></div>
          ${mine.length ? [...groups.entries()].map(([k, l]) => html`<div class="card wkbox" style="margin-bottom:12px"><div class="wkhead"><h3>${title(k)}</h3><div class="sp"></div><span class="mut sm">${l.length}</span></div>
            ${l.map((t) => html`<div class="wkrow"><span class="grow" data-act="open" data-id="${t.id}" style="cursor:pointer"><b style="font-weight:500">${t.title}</b>${t.dept || t.role ? html`<span class="mut sm"> · ${t.dept || t.role}</span>` : ''}</span>${dueChip(t)}${stChip(t)}<button class="btn xs" data-act="open" data-id="${t.id}">${st(t) === 'En revisión' ? 'Ver' : 'Entregar'}</button></div>`)}</div>`)
          : html`<div class="empty"><b>Nada pendiente</b>Cuando te asignen una responsabilidad aparece aquí, con su fecha y dónde entregarla.</div>`}</div>
        <div class="hoy-side"><div class="card wkbox"><div class="wkhead"><div><h3>Hoy</h3><span class="mut sm">Tu agenda y las reuniones de tus proyectos</span></div><span class="gbadge" style="margin-left:auto">${IC.cal}</span></div>
          ${agendaRows()}${meets.map((x) => html`<div class="wkrow"><span class="wkt">${ico('users', 14)}</span><span class="grow">${x.name}<span class="mut sm"> · ${x.p.client || x.p.name}</span></span></div>`)}
          ${agenda && !agenda.length && !meets.length ? html`<div class="mut sm" style="padding:6px 0">Sin reuniones hoy.</div>` : ''}
          <div class="mut sm" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)">Tus SOPs y plantillas están en la <a href="#/library" style="color:inherit">Library</a>.</div></div>
          ${dueCard()}</div>
      </div>`);
  }

  const paint = () => { if (!alive()) return; (ceoish ? ceo : team)(); };
  acts(el, {
    open: (b) => { const t = tasks.find((x) => x.id === b.dataset.id); if (t) openDelivery(t, ctx(), (r) => onTask(r, t)); },
    confirm: async (b) => { const q = (quotes || []).find((x) => x.id === b.dataset.id); if (!q) return; const r = await confirmarYArrancar(q, { leads: dueLeads || [] }); if (r?.project_id) { [quotes, tasks, projects] = await Promise.all([col('quotes').list(), col('tasks').list(), col('projects').list()]); paint(); } },
    pay: async (b) => { const q = (quotes || []).find((x) => x.id === b.dataset.id); if (!q) return; if (await payDialog({ quote_id: q.id, client: q.client, currency: q.currency || 'GTQ', amount: Math.round(qSub(q) * (q.currency && q.currency !== 'GTQ' ? +q.rate || 1 : 1) * 100) / 100 })) { quotes = await col('quotes').list(); paint(); } },
    proof: (b) => openProof(b.dataset.id),
    agRetry: () => { agenda = null; agErr = null; paint(); loadAgenda(); },
    addTask: async () => { const { newTask } = await import('../create.js'); const t = await newTask({ team: people, me, projects, pre: { assignee: me.email } }); if (t) { tasks.push(t); paint(); } },
  });
  hookNotice(el, me, () => alive() && paint());
  paint();
}
