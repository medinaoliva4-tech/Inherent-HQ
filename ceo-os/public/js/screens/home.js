// Hoy. Para el CEO: tres números, las entregas del mes por semana, lo de hoy y lo que necesita atención.
// Para el equipo: sus responsabilidades (qué, para cuándo y dónde se entrega). Sin revenue, leads ni engagement.
import { html, raw, mount, col, api, fdate, today, toast, acts, IC, $, $$, Q, calQ, teamList, ico, initials, fromLink } from '../core.js';
import { upcoming, people as meetPeople } from '../meetings.js';
import { kpis, PAL } from '../charts.js';
import { openDelivery, dueChip, stChip } from '../taskcard.js';
import { bdayText } from './me.js';
import { connectNotice, hookNotice } from '../connectai.js';
import { purposeCard } from '../purpose.js';
import { estadoDe } from '../element.js';
import { dueAccess, dueSoon, durText, updateWaits } from '../ventas-flujo.js';

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
  const head = () => html`<div class="hello sp-hero"><h1>${greet()}, ${first}.</h1><p>${ceoish ? html`Esto es lo que pasa hoy en <em>Inherent</em>.` : html`Esto es lo tuyo <em>hoy</em>.`}</p></div>
    ${bdays.length ? html`<div class="bday">${bdays.map((p) => { const now = p.birthday === soon[0], mine = (p.email || p.id) === me.email; return html`<span class="bdi ${now ? 'now' : ''}">${now ? (mine ? html`${ico('spark')} <b>¡Feliz cumpleaños, ${first}!</b>` : html`${ico('cake')} <b>Hoy cumple ${p.name.split(' ')[0]}</b>`) : html`${ico('cake')} ${p.name.split(' ')[0]} cumple el ${bdayText(p.birthday)}`}</span>`; })}</div>` : ''}
    ${connectNotice(me)}`;

  // ---------- CEO · COO ----------
  // Solo cuatro cosas, cada una lleva a donde está desarrollada: proyectos activos · % en día · reuniones · contenido de cada cuenta.
  // Al final, compacta, la lista de lo que necesita atención.
  const tasksOf = (p) => tasks.filter((t) => t.project_id === p.id);
  const daysFrom = (d) => Math.round((new Date(d + 'T12:00') - new Date(T + 'T12:00')) / 864e5);
  const whenLabel = (d) => (d === T ? 'Hoy' : daysFrom(d) === 1 ? 'Mañana' : fdate(d));
  function ceo() {
    const openT = tasks.filter(open);
    const late = openT.filter((t) => t.due && t.due < T), review = tasks.filter((t) => st(t) === 'En revisión');
    // 1 · Proyectos activos (como en Control): no cerrados y con algo abierto (o recién creados, sin tareas).
    const active = projects.filter((p) => p.status !== 'cerrado' && (tasksOf(p).some(open) || !tasksOf(p).length));
    const progM = (p) => { const l = tasksOf(p).filter((t) => String(t.due || '').slice(0, 7) === M), d = l.filter((t) => !open(t)).length; return { n: l.length, d, pct: l.length ? Math.round((d / l.length) * 100) : null }; };
    // 2 · % en día: de las tareas de este mes que ya vencieron, cuántas se entregaron a tiempo (done_at ≤ due).
    //     Las hechas sin fecha de entrega registrada no se cuentan (no se puede saber si fueron a tiempo).
    const dueM = tasks.filter((t) => t.due && t.due.slice(0, 7) === M && t.due < T && (open(t) || t.done_at));
    const onTime = dueM.filter((t) => !open(t) && String(t.done_at).slice(0, 10) <= t.due).length;
    const pct = dueM.length ? Math.round((onTime / dueM.length) * 100) : null;
    // 3 · Reuniones: Google Calendar + las de los proyectos, las próximas 5.
    const evs = (agenda || []).map((e) => ({ date: String(e.start).slice(0, 10), time: e.allDay ? '' : String(e.start).slice(11, 16), name: e.summary, sub: [e.calName, e.meet ? 'Meet' : ''].filter(Boolean).join(' · '), href: /^https:\/\//.test(e.link || '') ? e.link : '', ext: true }));
    const links = new Set(evs.map((e) => e.href).filter(Boolean));
    const pm = upcoming(projects).filter((x) => !(x.link && links.has(x.link))).map((x) => ({ date: x.date, time: x.time || '', name: x.name, sub: [x.p.client || x.p.name, meetPeople(x, people, me.email).map((y) => (y.name ? y.name.split(' ')[0] : y.label)).join(', ')].filter(Boolean).join(' · '), href: x.p.client_slug ? `#/clients/${x.p.client_slug}` : '#/clients' }));
    const meets = [...evs.filter((e) => e.date >= T), ...pm].sort((a, z) => (a.date + (a.time || '99')).localeCompare(z.date + (z.time || '99')));
    const meetsToday = meets.filter((x) => x.date === T).length;
    const attention = [...late, ...review.filter((t) => !late.includes(t))].sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
    const R = 26, C = 2 * Math.PI * R, vp = dueCard();
    mount(el, html`${head()}
      ${me.role === 'ceo' && !tasks.length && !projects.length ? html`<a class="asbar" href="#/setup" style="display:flex">${ico('gear')} La app todavía está vacía: <b>haz el Arranque</b> y queda lista con lo que ya dice el repo →</a>` : ''}
      <div class="sp-kpis">
        <a class="sp-kpi" href="#/operations"><span class="lbl">Proyectos activos</span><b>${active.length}</b>${fromLink({ label: 'Proyectos', plain: true, title: 'Los proyectos no cerrados con algo abierto · Proyectos' })}</a>
        <a class="sp-kpi" href="#/resultados"><span class="lbl">% en día</span><b>${pct == null ? '—' : html`${pct}<small class="mut" style="font-size:16px">%</small>`}</b>${fromLink({ label: 'Indicadores', plain: true, title: 'Las tareas de este mes que ya vencieron, contra su fecha · Hoy → Indicadores' })}</a>
        <a class="sp-kpi" href="#/operations/cal"><span class="lbl">Reuniones hoy</span><b>${agenda === null ? '…' : meetsToday}</b>${fromLink({ label: 'Calendar y Proyectos', plain: true, title: 'Tu Google Calendar y las reuniones de cada proyecto' })}</a>
      </div>
      <div class="hoy-top">
        <section class="sp-panel"><a class="wkhead" href="#/clients" style="text-decoration:none;color:inherit"><div><h3>Proyectos activos</h3><span class="mut sm">Cliente · proyecto · avance del mes</span></div><div class="sp"></div><span class="sp-tile-go">↗</span></a>
          ${active.length ? active.slice(0, 6).map((p) => { const g = progM(p); return html`<a class="hoy-proj" href="${p.client_slug ? `#/clients/${p.client_slug}/servicio` : '#/clients'}"><div class="row"><b style="font-weight:500" class="grow">${p.client || p.name}</b><span class="mut sm">${g.n ? `${g.d}/${g.n}` : 'sin entregas este mes'}</span></div><span class="mut sm">${p.name}</span><div class="sp-meter"><i style="width:${g.pct || 0}%"></i></div></a>`; })
          : html`<div class="mut sm" style="padding:12px 0">Sin proyectos activos. Nacen al confirmar el pago de una cotización.</div>`}
          ${active.length > 6 ? html`<a class="sm mut" href="#/control" style="padding:10px 0 2px">y ${active.length - 6} más →</a>` : ''}</section>
        <section class="sp-panel"><div class="wkhead" data-act="toAtt"><div><h3>% en día</h3><span class="mut sm">Entregadas a tiempo de las que ya vencieron este mes</span></div></div>
          <div class="hoy-big"><div class="sp-ring" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="trk" cx="32" cy="32" r="${R}" fill="none" stroke-width="6"/>${pct == null ? '' : raw(`<circle class="val" cx="32" cy="32" r="${R}" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C * (1 - pct / 100)).toFixed(2)}"/>`)}</svg></div>
            <div><div class="sp-pct">${pct == null ? '—' : html`${pct}<small>%</small>`}</div><div class="mut sm" style="margin-top:4px">${pct == null ? 'Sale de las tareas con fecha de este mes que ya vencieron' : `${onTime} de ${dueM.length} a tiempo`}</div></div></div>
          <button class="sp-callout ${late.length ? '' : 'ok'}" data-act="toAtt" style="margin-top:auto;width:100%;text-align:left;padding:10px 14px"><span class="grow">${late.length ? html`<b>${late.length} atrasada${late.length === 1 ? '' : 's'}</b> · ver cuáles` : 'Nada atrasado'}</span></button></section>
        <section class="sp-panel"><a class="wkhead" href="#/control" style="text-decoration:none;color:inherit"><div><h3>Reuniones</h3><span class="mut sm">Google Calendar y las de los proyectos</span></div><div class="sp"></div><span class="gbadge">${IC.cal}</span></a>
          ${agenda === null && !pm.length ? html`<p class="loading sm">Cargando tu agenda…</p>` : ''}
          ${agErr ? html`<div class="mut sm" style="padding:8px 0">No pude leer tu Google Calendar. <button class="sm linkish" data-act="agRetry">Reintentar</button></div>` : ''}
          ${meets.slice(0, 5).map((x) => html`<a class="hoy-meet" href="${x.href || '#/control'}" ${x.ext && x.href ? raw('target="_blank" rel="noopener noreferrer"') : ''}><div class="hoy-when"><b>${x.time || fdate(x.date).split(' ')[0]}</b><span>${whenLabel(x.date)}</span></div><div class="grow" style="min-width:0"><b style="font-weight:500;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x.name}</b><span class="mut sm">${x.sub || ' '}</span></div></a>`)}
          ${agenda !== null && !meets.length ? html`<div class="mut sm" style="padding:12px 0">Sin reuniones por delante.</div>` : ''}</section>
      </div>
      <section class="slider" id="cslider">${slider()}</section>
      <div class="${vp ? 'hoy-pair' : ''}">
      <div class="sp-callout ${attention.length ? '' : 'ok'} hoy-att" id="hoy-att" style="flex-direction:column;gap:2px;align-items:stretch">
        <div class="row" style="gap:8px">${ico('alert', 16)}<b>Necesita atención</b><span class="mut sm">Atrasadas y en revisión, con su dueño</span><div class="sp"></div>${attention.length ? html`<span class="badge-n">${attention.length}</span>` : ''}</div>
        ${attention.length ? attention.slice(0, 5).map((t) => html`<div class="wkrow" data-act="open" data-id="${t.id}"><span class="grow"><b style="font-weight:500">${t.title}</b><span class="mut sm"> · ${clientOf(t)} · ${nameOf(t.assignee).split(' ')[0]}</span></span>${st(t) === 'En revisión' ? stChip(t) : dueChip(t)}</div>`) : html`<div class="mut sm">Todo en orden ${ico('check', 14)}</div>`}
        ${attention.length > 5 ? html`<a class="sm" href="#/control" style="color:var(--ink2);padding-top:6px">Ver las ${attention.length} en Control →</a>` : ''}</div>
      ${vp}</div>`);
    bindSlider();
  }

  // 4 · Contenido de cada cuenta activa: un carrusel, una gráfica por cuenta (planificadas vs publicadas por semana;
  //     el alcance de 30 días como línea fina si Instagram está conectado). Toca la tarjeta → su Contenido.
  function slider() {
    const head2 = html`<div class="slider-h"><h2>Contenido del mes</h2><span class="mut sm">Planificadas vs. publicadas, por semana</span>${(content.accounts || []).length > 1 ? html`<div class="slider-nav"><button data-act="sl" data-d="-1" aria-label="Anterior"><span style="display:inline-flex;transform:rotate(180deg)">${ico('right', 16)}</span></button><button data-act="sl" data-d="1" aria-label="Siguiente">${ico('right', 16)}</button></div>` : ''}</div>`;
    if (content.accounts === null) return html`${head2}<p class="loading">Cargando…</p>`;
    if (!content.accounts.length) return html`${head2}<div class="sp-callout info"><span>Sin cuentas activas con contenido. Aparecen cuando un cliente activo tiene su perfil de contenido en el repo.</span></div>`;
    const [y, m] = M.split('-').map(Number), days = new Date(y, m, 0).getDate(), nW = Math.ceil(days / 7);
    return html`${head2}<div class="slides" role="list">${content.accounts.map((a) => {
      const ps = content.posts.filter((x) => x.profile === a.slug && String(x.date || '').slice(0, 7) === M);
      const wk = Array.from({ length: nW }, (_, i) => { const l = ps.filter((x) => Math.floor((+x.date.slice(8) - 1) / 7) === i); return [l.length, l.filter((x) => estadoDe(x) === 'Publicado').length]; });
      const pub = ps.filter((x) => estadoDe(x) === 'Publicado').length, ig = content.ig[a.slug];
      return html`<a class="sp-tile slide" role="listitem" href="#/marcas/${a.slug}/calendario">
        <div class="sp-tile-top" style="margin-bottom:0"><span class="sp-mono">${initials(a.name)}</span><div style="min-width:0"><div class="sp-tile-name">${a.name}</div><div class="sp-tile-sub">${ig?.series ? 'Instagram conectado' : 'Del calendario de contenido'}</div></div><span class="sp-tile-go">↗</span></div>
        <div class="cnums"><div><span class="lbl">Planificadas</span><b>${ps.length}</b></div><div><span class="lbl">Publicadas</span><b>${pub}</b></div></div>
        ${raw(miniChart(wk, ig?.series))}
        <div class="clegend"><span><i style="background:var(--ch-light)"></i>Planificadas</span><span><i style="background:var(--ink)"></i>Publicadas</span>${ig?.series ? html`<span><i class="line" style="background:var(--ch-brown)"></i>Alcance 30 días</span>` : ''}</div></a>`; })}</div>
      ${content.accounts.length > 1 ? html`<div class="slider-dots">${content.accounts.map((a, i) => html`<button data-act="sldot" data-i="${i}" aria-label="${a.name}" class="${i === 0 ? 'on' : ''}"></button>`)}</div>` : ''}`;
  }
  function miniChart(wk, series) {
    const W = 300, H = 96, P = 4, max = Math.max(1, ...wk.map(([p]) => p)), gw = W / wk.length, bw = Math.min(28, gw * 0.42);
    let s = `<svg class="cchart" viewBox="0 0 ${W} ${H + 14}" aria-hidden="true"><line x1="0" x2="${W}" y1="${H}" y2="${H}" style="stroke:var(--hair-strong)" vector-effect="non-scaling-stroke"/>`;
    wk.forEach(([p, d], i) => { const x = i * gw + (gw - bw) / 2, hp = (p / max) * (H - P), hd = (d / max) * (H - P);
      if (p) s += `<rect x="${x.toFixed(1)}" y="${(H - hp).toFixed(1)}" width="${bw.toFixed(1)}" height="${hp.toFixed(1)}" rx="5" style="fill:var(--ch-light)"/>`;
      if (d) s += `<rect x="${x.toFixed(1)}" y="${(H - hd).toFixed(1)}" width="${bw.toFixed(1)}" height="${hd.toFixed(1)}" rx="5" style="fill:var(--ink)"/>`;
      s += `<text x="${(i * gw + gw / 2).toFixed(1)}" y="${H + 12}" text-anchor="middle" style="fill:var(--mut);font-size:10px">S${i + 1}</text>`; });
    if (series && series.length > 1) { const v = series.map((x) => +x.reach || 0), mx = Math.max(1, ...v);
      s += `<polyline fill="none" vector-effect="non-scaling-stroke" style="stroke:var(--ch-brown);stroke-width:1.5" points="${v.map((n, i) => `${((i / (v.length - 1)) * W).toFixed(1)},${(H - (n / mx) * (H - P)).toFixed(1)}`).join(' ')}"/>`; }
    if (!wk.some(([p]) => p) && !(series && series.length > 1)) s += `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" style="fill:var(--mut);font-size:12px">Sin piezas con fecha este mes</text>`;
    return s + '</svg>';
  }
  function bindSlider() {
    const sl = $('.slides', el); if (!sl) return;
    const dots = [...el.querySelectorAll('.slider-dots button')], nav = [...el.querySelectorAll('.slider-nav button')];
    const upd = () => { const w = sl.firstElementChild?.offsetWidth || 1, i = Math.round(sl.scrollLeft / (w + 16)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); if (nav[0]) nav[0].disabled = sl.scrollLeft < 4; if (nav[1]) nav[1].disabled = sl.scrollLeft + sl.clientWidth >= sl.scrollWidth - 4; };
    sl.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); upd();
    // Si todas las cuentas caben a la vista, sin flechas ni puntos.
    const fit = () => { const all = sl.scrollWidth <= sl.clientWidth + 4; el.querySelectorAll('.slider-nav,.slider-dots').forEach((x) => { x.hidden = all; }); }; fit(); new ResizeObserver(fit).observe(sl);
  }
  // Las cuentas: los perfiles de contenido del repo que son clientes activos (más Inherent). El alcance, solo si ya está conectado (se guarda en la sesión).
  const content = { accounts: null, posts: [], ig: {} };
  if (ceoish) {
    Promise.all([api('repo/content').catch(() => ({ profiles: [] })), col('content').list().catch(() => []), api('repo/clients').catch(() => ({ clients: [] }))]).then(([rc, all, cl]) => {
      const act = new Set([...(cl.clients || []).filter((c) => c.hasPlan).map((c) => c.slug), ...accounts.filter((a) => a.from_quote).map((a) => a.slug || String(a.id).replace(/^acc-/, ''))]);
      content.accounts = (rc.profiles || []).filter((x) => x.slug !== 'personal' && (act.has(x.slug) || x.slug === 'inherent')).map((x) => ({ slug: x.slug, name: accounts.find((a) => a.id === 'acc-' + x.slug)?.name || x.name || x.slug.toUpperCase() }));
      content.posts = all.filter((x) => x.kind === 'post');
      if (alive()) paint();
      for (const a of content.accounts) {
        let c = null; try { c = JSON.parse(sessionStorage.getItem('hoy.ig.' + a.slug) || 'null'); } catch {}
        const use = (r) => { if (r?.connected && r.matched && (r.series || []).length > 1) { content.ig[a.slug] = { series: r.series.slice(-30) }; if (alive()) paint(); } };
        if (c) use(c); else api(`analytics/instagram?profile=${encodeURIComponent(a.slug)}`).then((r) => { try { sessionStorage.setItem('hoy.ig.' + a.slug, JSON.stringify({ connected: r.connected, matched: r.matched, series: (r.series || []).slice(-30) })); } catch {} use(r); }).catch(() => {});
      }
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
    toAtt: () => { const a = $('#hoy-att', el); if (a) a.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); },
    sl: (b) => { const s2 = $('.slides', el); if (s2) s2.scrollBy({ left: (+b.dataset.d) * ((s2.firstElementChild?.offsetWidth || 300) + 16), behavior: 'smooth' }); },
    sldot: (b) => { const s2 = $('.slides', el); if (s2) s2.scrollTo({ left: (+b.dataset.i) * ((s2.firstElementChild?.offsetWidth || 300) + 16), behavior: 'smooth' }); },
    agRetry: () => { agenda = null; agErr = null; paint(); loadAgenda(); },
    addTask: async () => { const { newTask } = await import('../create.js'); const t = await newTask({ team: people, me, projects, pre: { assignee: me.email } }); if (t) { tasks.push(t); paint(); } },
  });
  hookNotice(el, me, () => alive() && paint());
  paint();
}
