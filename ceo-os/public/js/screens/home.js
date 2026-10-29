// Home (#/home): la portada del OS para todo el equipo. Arriba el hero y «Ask InherentOS» (abre el Chat con el borrador,
// en el modo de la última área abierta); luego 4 KPIs (proyectos, tareas, ingresos, clientes: cada uno lleva a donde se
// trabaja; sin dato, vacío y de dónde va a salir, nunca 0), la actividad reciente (lo que esta pantalla ya carga, por
// _meta.updated_at) y «Importante»: las notas fijadas de las áreas que esta persona ve (col area_notes). Abajo, para el CEO
// y el COO, lo que necesita atención, la agenda y el contenido del mes; para el equipo, sus responsabilidades. Los
// cargadores de datos son los de siempre; cambió cómo se ve: cada KPI es un stat tile (ícono, número que cuenta, contexto y
// un indicador visual: anillo, proporción o monogramas), la actividad es una línea de tiempo, lo importante lleva la franja
// de su área y lo que necesita atención, la franja de su urgencia y cuánto falta (visual.js).
import { html, raw, mount, col, api, fdate, today, acts, IC, $, $$, Q, calQ, teamList, ico, escalonar } from '../core.js';
import { upcoming, people as meetPeople } from '../meetings.js';
import { openDelivery, dueChip, stChip } from '../taskcard.js';
import { bdayText } from './me.js';
import { connectNotice, hookNotice } from '../connectai.js';
import { purposeCard } from '../purpose.js';
import { estadoDe } from '../element.js';
import { dueAccess, dueSoon, durText, updateWaits } from '../ventas-flujo.js';
import { totales } from '../facturas.js';
import { levelName } from '../levels.js';
import { payDialog, openProof, confirmarYArrancar } from '../flowui.js';
import { projStatus } from '../project-page.js';
import { WORKSPACES, puedeWs } from '../herramientas.js';
import { cargarContexto, contextoLista, contextoActual } from '../contexto.js';
import { abrirEnChat } from '../areas.js';
import { leerNota, ordenar, TIPO_ICONO, TIPO_NOMBRE } from '../areas-notas.js';
import { SUGERENCIAS, modoDe } from '../llm/modos.js';
import { anillo, proporcion, sparkline, cuenta, cuentaChip, monograma, monogramas, cuadrito, vacio, numero, contarNumeros } from '../visual.js';

// La forma de Home mientras cargan los datos: el mismo hero, la caja de «Ask», 4 tiles y las dos columnas (cero salto de layout).
export const esqueleto = () => html`<div class="skel skel-pagina skel-home" aria-busy="true"><span class="sr-only">Cargando…</span><i class="sk-t"></i><i class="sk-s"></i><i class="sk-ask"></i><div class="sk-kpis"><i></i><i></i><i></i><i></i></div><div class="sk-dos"><i></i><i></i></div></div>`;

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };
const mondayOf = (s) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const lsGet = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
// El ícono de cada cosa que necesita atención (los símbolos de antes → nombres de iconos.js) y el color de su urgencia (tokens).
const IC_ATENCION = { $: 'wallet', '→': 'arrow-right', '☏': 'phone', '!': 'triangle-alert', '○': 'rocket' };
const URG_COLOR = { alta: 'var(--ui-bad)', media: 'var(--ui-amb-f)', baja: 'var(--ui-mut2)' };
const URG_TXT = { alta: 'Urgente', media: 'Pronto', baja: 'Sin prisa' };
// Los estados de un proyecto (project-page.js › PSTATES), en su orden.
const PROY_ORDEN = ['En curso', 'En riesgo', 'Pausado'];
// ¿Un helper de visual.js trajo algo? (sin dato devuelve vacío, que no se pinta)
const hay = (v) => Boolean(v && String(v));
// «hace 5 min», «hace 2 h», «ayer», «hace 3 días» o la fecha.
const relativo = (s) => {
  const ms = Date.parse(String(s || '')); if (!ms) return '';
  const m = Math.round((Date.now() - ms) / 6e4); if (m < 1) return 'ahora'; if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24); if (d === 1) return 'ayer'; if (d < 7) return `hace ${d} días`;
  return fdate(String(s).slice(0, 10));
};

export async function render(el, { me, alive }) {
  const ceoish = me.role === 'ceo' || me.role === 'coo';
  const acc = dueAccess(me), seesClients = (me.areas || []).includes('clients');
  let [tasks, projects, people, accounts] = await Promise.all([col('tasks').list(), col('projects').list().catch(() => []), teamList().catch(() => []), col('accounts').list().catch(() => []), cargarContexto(me).catch(() => [])]);
  // Los clientes del repo (ficha): los lee quien ve Clientes (el KPI y el contenido del mes).
  let repoClients = null; if (seesClients) api('repo/clients').then((r) => { repoClients = r.clients || []; repinta(); }).catch(() => { repoClients = []; repinta(); });
  const T = today(), M = T.slice(0, 7), first = (me.name || '').split(' ')[0];
  const monday = mondayOf(T), sunday = addDays(monday, 6);
  const st = (t) => t.status || 'Por empezar', open = (t) => st(t) !== 'Hecha';
  const proj = (id) => projects.find((p) => p.id === id);
  const person = (k) => people.find((p) => p.id === k || p.email === k);
  const nameOf = (k) => person(k)?.name || (k === me.email ? me.name : k ? String(k).split('@')[0] : 'Sin responsable');
  const corto = (k) => (k ? nameOf(k).split(' ')[0] : '');
  const clientOf = (t) => { const p = proj(t.project_id); return p ? p.client || p.name : 'Interno'; };
  // Cumpleaños del equipo: hoy y los próximos 7 días.
  const md = (d) => d.toISOString().slice(5, 10), soon = Array.from({ length: 8 }, (_, i) => md(new Date(Date.now() + i * 864e5)));
  const bdays = people.filter((p) => p.active !== false && p.birthday && soon.includes(p.birthday)).sort((a, z) => soon.indexOf(a.birthday) - soon.indexOf(z.birthday));
  // La agenda de Google Calendar de hoy (se refresca al volver a la pestaña y cada 2 minutos).
  let agenda = null, agErr = null;
  const loadAgenda = () => api(`google/calendar?from=${T}&to=${ceoish ? addDays(T, 14) : T}${calQ()}`).then((r) => { agenda = r.events || []; agErr = null; }).catch((e) => { agErr = e.message; agenda = []; }).then(() => repinta());
  loadAgenda();
  const iv = setInterval(() => (alive() ? document.visibilityState === 'visible' && loadAgenda() : clearInterval(iv)), 120000);
  const onVis = () => { if (!alive()) return document.removeEventListener('visibilitychange', onVis); if (document.visibilityState === 'visible') loadAgenda(); };
  document.addEventListener('visibilitychange', onVis);

  // «Vence pronto»: leads sin responder y seguimientos de ventas de hoy o mañana (quien ve Ventas) y facturas de los
  // próximos 7 días o vencidas (por cobrar: el CEO y quien ve Finanzas; por pagar: solo el CEO). Se carga aparte.
  let dueLeads = acc.sales ? null : [], dueInv = acc.cobrar || acc.pagar ? null : [];
  if (acc.sales) col('leads').list().catch(() => []).then((l) => { dueLeads = l; repinta(); });
  if (acc.cobrar || acc.pagar) col('invoices').list().catch(() => []).then((l) => { dueInv = l; repinta(); });
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
  const agendaRows = () => agenda === null ? html`<p class="mut sm">Cargando tu agenda…</p>` : agErr ? html`<div class="mut sm">No pude leer tu Google Calendar: conecta tu Google en <a href="#/me">Mi perfil</a>. <button class="sm linkish" data-act="agRetry">Reintentar</button></div>`
    : agenda.slice(0, 5).map((e) => html`<a class="wkrow" href="${/^https:\/\//.test(e.link || '') ? e.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="wkt">${e.allDay ? 'Día' : String(e.start).slice(11, 16)}</span><span class="grow">${e.summary}</span>${e.meet ? html`<span class="mut sm">Meet</span>` : ''}</a>`);
  const daysFrom = (d) => Math.round((new Date(d + 'T12:00') - new Date(T + 'T12:00')) / 864e5);
  const whenLabel = (d) => (d === T ? 'Hoy' : daysFrom(d) === 1 ? 'Mañana' : fdate(d));
  const pct = (a, b) => (b ? Math.max(0, Math.min(100, Math.round((a / b) * 100))) : 0);
  let quotes = null;
  if (ceoish || acc.sales) col('quotes').list().catch(() => []).then((l) => { quotes = l; repinta(); });
  const qSub = (q) => (q.items || []).reduce((a, i) => a + (+i.qty || 0) * (+i.price || 0), 0) * (1 - (+q.discount_pct || 0) / 100);

  // Lo que ya entró en pantalla: las entradas escalonadas y los números que cuentan pasan una vez; un repintado (llegan datos) no las repite.
  const vistos = new Set(), pend = [], contados = new Map();
  const nueva = (k, sel) => { if (vistos.has(k)) return false; vistos.add(k); pend.push(sel); return true; };
  // Lo que llega tarde (agenda, facturas, notas…) repinta; si cae mientras entra la primera pantalla (260 ms) espera a que termine, para
  // no cortar su entrada ni el conteo de los números.
  let t1 = 0, tm = 0;
  const repinta = () => {
    if (!alive()) return;
    const resta = t1 ? 260 - (performance.now() - t1) : 0;
    if (resta <= 0) return paint();
    if (!tm) tm = setTimeout(() => { tm = 0; paint(); }, resta);
  };

  // ---------- La última área ----------
  // app.js guarda la última área abierta (os.ws.ultimo.<correo> = strategy, marketing…); el cliente que ya tenía elegido
  // el Chat se queda (contexto.js).
  const ctxSlug = () => contextoActual(me) || '';
  const nombreDe = (slug) => (slug ? contextoLista().find((c) => c.slug === slug)?.name || slug : '');
  const ultimoWs = () => lsGet(`os.ws.ultimo.${me.email}`);
  const modoAsk = () => WORKSPACES.find((w) => w.id === ultimoWs())?.modo || 'organizacion';

  // ---------- Hero ----------
  const fechaLarga = new Date(T + 'T12:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());
  const hero = (linea) => html`<div class="home-hero sp-hero"><h1>Turn business opportunities into real results</h1><p>${greet()}, <em>${first}</em> · ${fechaLarga}${linea || ''}</p></div>
    ${bdays.length ? html`<div class="bday">${bdays.map((p) => { const now = p.birthday === soon[0], mine = (p.email || p.id) === me.email; return html`<span class="bdi ${now ? 'now' : ''}">${now ? (mine ? html`${ico('spark')} <b>¡Feliz cumpleaños, ${first}!</b>` : html`${ico('cake')} <b>Hoy cumple ${p.name.split(' ')[0]}</b>`) : html`${ico('cake')} ${p.name.split(' ')[0]} cumple el ${bdayText(p.birthday)}`}</span>`; })}</div>` : ''}
    ${connectNotice(me)}`;

  // ---------- «Ask InherentOS anything» ----------
  // Al enviar abre el Chat con el borrador, en el modo del último workspace usado (o Organización) y con el cliente del contexto.
  const ask = () => {
    const modo = modoAsk(), sug = (SUGERENCIAS[modo] || SUGERENCIAS.organizacion || []).slice(0, 3), quien = nombreDe(ctxSlug());
    return html`<form class="home-ask" data-act="ask" autocomplete="off">
      <div class="home-ask-box"><span class="home-ask-ic">${ico('chat-ia', 20)}</span>
        <label class="sr-only" for="home-q">Pregúntale a InherentOS</label>
        <textarea id="home-q" class="home-ask-ta" rows="1" placeholder="Ask InherentOS anything" data-act="askTa"></textarea>
        <button class="btn home-ask-go" type="submit" aria-label="Enviar al Chat">${ico('enviar', 16)}</button></div>
      <div class="home-ask-foot"><div class="home-chips">${sug.map(([q]) => html`<button type="button" class="chip home-chip" data-act="chip" data-q="${q}">${q}</button>`)}</div>
        <span class="home-ask-modo mut sm">Modo ${modoDe(modo).nombre}${quien ? html` · ${quien}` : ''}</span></div></form>`;
  };

  // ---------- 4 KPIs ----------
  // Cada uno es un stat tile: ícono en cuadrito, número grande que cuenta, una línea de contexto y UN indicador visual (anillo,
  // proporción o monogramas) y lleva a donde se trabaja. Sin dato: «—», de dónde va a salir y sin indicador, nunca 0.
  function kpis() {
    const out = [];
    const activos = projects.filter((p) => !p.archived && !p.archivado && projStatus(p, tasks) !== 'Hecho');
    // Proyectos: el anillo es el avance real (tareas hechas de las que cuelgan de los proyectos en curso); sin tareas, anillo vacío.
    const ids = new Set(activos.map((p) => p.id)), deEllos = tasks.filter((t) => ids.has(t.project_id)), hechas = deEllos.filter((t) => !open(t)).length;
    const cuantos = PROY_ORDEN.map((e) => [e, activos.filter((p) => projStatus(p, tasks) === e).length]).filter(([, n]) => n);
    out.push({ k: 'Active projects', href: '#/org/operations', ic: 'kanban', n: activos.length || null, clave: 'proyectos',
      sub: !projects.length ? 'Sale de los proyectos en Proyectos' : activos.length ? cuantos.map(([e, n]) => `${n} ${e === 'Pausado' && n !== 1 ? 'pausados' : e.toLowerCase()}`).join(' · ') : 'Ninguno en curso: todos terminados',
      anillo: activos.length ? anillo(deEllos.length ? Math.round((hechas / deEllos.length) * 100) : null, { tam: 46, label: deEllos.length ? `Avance: ${hechas} de ${deEllos.length} tareas hechas en los proyectos en curso` : 'Sin tareas ligadas a los proyectos en curso' }) : undefined });
    // Tareas: la barra parte el número en lo vencido y lo que está en plazo (el rojo siempre va con su cuenta escrita).
    const abiertas = tasks.filter(open), semana = abiertas.filter((t) => t.due && t.due <= sunday), vencidas = semana.filter((t) => t.due < T);
    out.push({ k: 'Tasks due', href: '#/org/work', ic: 'list-checks', n: semana.length || null, clave: 'tareas', red: vencidas.length > 0,
      sub: !tasks.length ? 'Sale de las tareas con fecha en Mis tareas' : semana.length ? html`Hasta el domingo${vencidas.length ? html` · <span class="r">${vencidas.length} vencida${vencidas.length === 1 ? '' : 's'}</span>` : ''}` : 'Nada vence esta semana',
      vis: proporcion([{ valor: vencidas.length, color: 'var(--ui-bad)', label: 'Vencidas' }, { valor: semana.length - vencidas.length, color: 'var(--ui-acc)', label: 'En plazo' }], { leyenda: false, minimo: 2 }) });
    if (acc.cobrar) {
      const t = totales(dueInv || []), cobrado = t.cobradoMes;
      out.push({ k: 'Monthly revenue', href: '#/org/finanzas', ic: 'wallet', n: cobrado || null, pre: 'Q', clave: 'ingresos', cargando: dueInv === null,
        sub: dueInv === null ? 'Cargando…' : cobrado ? (t.nPorCobrar ? `${Q(t.porCobrar)} por cobrar` : 'Cobrado este mes') : 'Sale de las facturas marcadas como pagadas en Finanzas',
        vis: dueInv === null ? '' : proporcion([{ valor: cobrado, color: 'var(--ui-ok)', label: 'Cobrado este mes' }, { valor: Math.max(0, t.porCobrar - t.vencido), color: 'var(--ui-mut2)', label: 'Por cobrar' }, { valor: t.vencido, color: 'var(--ui-bad)', label: 'Vencido' }], { leyenda: false, minimo: 2 }) });
    }
    if (seesClients) {
      // Quiénes son: por ficha de oferta o por cuenta desde una cotización (sin repetir), con el nombre que ya conoce el Chat.
      const quienes = new Map([...(repoClients || []).filter((c) => c.hasPlan).map((c) => [c.slug, nombreDe(c.slug)]), ...accounts.filter((a) => a.from_quote).map((a) => { const sl = a.slug || String(a.id).replace(/^acc-/, ''); return [sl, a.name || nombreDe(sl)]; })]);
      const set = new Set(quienes.keys());
      out.push({ k: 'Active clients', href: '#/org/clients', ic: 'users', n: set.size || null, clave: 'clientes', cargando: repoClients === null,
        sub: repoClients === null ? 'Cargando…' : set.size ? 'Con ficha de oferta o cuenta desde una cotización' : 'Sale de los clientes con ficha en Clientes',
        vis: repoClients === null ? '' : monogramas([...quienes.values()], { max: 5 }) });
    }
    return html`<section class="home-kpis" aria-label="Indicadores">${out.map((x) => html`<a class="home-kpi eleva ${x.red ? 'warn' : ''}" href="${x.href}"><span class="home-kpi-top">${cuadrito(x.ic, { tam: 'sm' })}<span class="lbl">${x.k}</span><span class="home-kpi-go" aria-hidden="true">↗</span></span>
      <span class="home-kpi-main">${x.cargando ? numero(null, { vacio: '…' }) : numero(x.n, { pre: x.pre || '', clave: x.clave })}${x.anillo ? html`<span class="home-kpi-ring">${x.anillo}</span>` : ''}</span>
      <span class="home-kpi-sub mut sm">${x.sub}</span>${hay(x.vis) ? html`<span class="home-kpi-vis">${x.vis}</span>` : ''}</a>`)}</section>`;
  }

  // ---------- Actividad reciente ----------
  // Con lo que esta pantalla ya carga (tareas, proyectos, leads, cotizaciones y contenido), por _meta.updated_at
  // (/api/db lo entrega a todos; si no viene, created_at o la fecha del doc). Sin rutas nuevas.
  const cuando = (d) => d?._meta?.updated_at || d?._meta?.created_at || d?.updated_at || d?.created_at || '';
  const quien = (d, alt) => d?._meta?.updated_by || d?._meta?.created_by || alt || '';
  function actividad() {
    const rows = [];
    for (const t of tasks) rows.push({ ts: cuando(t), ic: 'list-checks', t: t.title, s: `${clientOf(t)} · ${st(t)}`, who: quien(t, t.assignee), href: t.project_id ? `#/org/operations/p/${t.project_id}/tareas` : '#/org/work' });
    for (const p of projects) rows.push({ ts: cuando(p), ic: 'kanban', t: p.name, s: p.client || 'Interno', who: quien(p), href: `#/org/operations/p/${p.id}/resumen` });
    if (acc.sales) for (const l of dueLeads || []) if (!l.archived) rows.push({ ts: cuando(l), ic: 'phone', t: l.name, s: [l.company, l.stage].filter(Boolean).join(' · ') || 'Lead', who: quien(l, l.owner), href: `#/org/sales/crm/${encodeURIComponent(l.id)}` });
    if (ceoish || acc.sales) for (const q of quotes || []) rows.push({ ts: cuando(q), ic: 'receipt', t: `Cotización ${q.number || ''}`.trim(), s: [q.client, q.status].filter(Boolean).join(' · '), who: quien(q), href: `#/org/sales/quotes/${q.id}` });
    if (ceoish) for (const c of content.posts) rows.push({ ts: cuando(c), ic: 'image', t: c.title || 'Pieza', s: [content.accounts?.find((a) => a.slug === c.profile)?.name || c.profile, estadoDe(c)].filter(Boolean).join(' · '), who: quien(c), href: '#/areas/marketing' });
    const con = rows.filter((r) => r.ts), lista = [...con].sort((a, z) => String(z.ts).localeCompare(String(a.ts))).slice(0, 8);
    // Movimientos por día de los últimos 7 días (los mismos que muestra la lista, sin inventar nada): el sparkline de la cabecera.
    const dias = Array.from({ length: 7 }, (_, i) => addDays(T, i - 6)), cuenta7 = Object.fromEntries(dias.map((d) => [d, 0]));
    for (const r of con) { const d = String(r.ts).slice(0, 10); if (d in cuenta7) cuenta7[d]++; }
    const serie = dias.map((d) => cuenta7[d]), spark = serie.some(Boolean) ? sparkline(serie, { label: `Movimientos por día, últimos 7 días: ${serie.join(', ')}` }) : '';
    // Una línea de tiempo: un nodo con el ícono de cada cosa, separada por día; lo de hace menos de 5 minutos lleva el acento.
    const dia = (ts) => { const d = String(ts).slice(0, 10); return d === T ? 'Hoy' : d === addDays(T, -1) ? 'Ayer' : 'Antes'; };
    let previo = '';
    const filas = lista.map((r) => {
      const g = dia(r.ts), sep = g !== previo ? html`<li class="home-tl-sep" aria-hidden="true">${g}</li>` : ''; previo = g;
      const ms = Date.parse(String(r.ts)), ahora = ms && Date.now() - ms < 3e5;
      return html`${sep}<li class="home-tl-i ${ahora ? 'is-ahora' : ''}"><a class="home-tl-a" href="${r.href}"><span class="home-tl-n">${ico(r.ic, 12)}</span><span class="home-tl-t">${r.t}<small>${r.s}</small></span><span class="home-tl-q mut sm">${r.who ? corto(r.who) : ''}</span><time class="home-tl-h mut sm" datetime="${String(r.ts)}" title="${ms ? new Date(ms).toLocaleString('es-GT') : ''}">${relativo(r.ts)}</time></a></li>`;
    });
    return html`<section class="home-act"><div class="hy-bh"><h2>Recent Activity</h2><span>Lo último que se movió</span>${hay(spark) ? html`<span class="home-act-spark" title="Movimientos por día, últimos 7 días">${spark}<small class="mut">7 días</small></span>` : ''}</div>
      ${lista.length ? html`<ol class="home-tl">${filas}</ol>`
      : vacio({ icono: 'clock', titulo: 'Aún no hay movimiento', linea: `Sale de las tareas, proyectos${acc.sales ? ', leads, cotizaciones' : ''}${ceoish ? ' y contenido' : ''} que se muevan.`, compacto: true })}</section>`;
  }

  // ---------- Importante: las notas fijadas de las áreas ----------
  // col('area_notes') (areas-notas.js: una nota por documento, con su área, título, texto y la marca «importante»; nada se
  // borra, se archiva). Salen hasta 8, las más recientes primero, solo de las áreas que esta persona ve. Sin notas: links a las áreas.
  let notas = null;
  col('area_notes').list().catch(() => []).then((l) => { notas = (Array.isArray(l) ? l : []).map(leerNota); repinta(); });
  const lineas = (t) => String(t || '').split(/\r?\n/).map((x) => x.replace(/^[\s#>*\-]+/, '').replace(/[*_`]/g, '').trim()).filter(Boolean);
  const corta = (t, n = 140) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
  function importante() {
    const ws = WORKSPACES.filter((w) => puedeWs(me, w.id));
    if (!ws.length) return '';
    const porId = new Map(ws.map((w) => [w.id, w]));
    const lista = ordenar((notas || []).filter((n) => n.importante && !n.archivado && porId.has(n.area))).slice(0, 8);
    // Cada tarjeta: la franja y el cuadrito de ícono llevan el color de su área (un solo acento); el tipo va en el ícono (y en su
    // title), el área y el cliente con nombre, y cuánto falta si la nota tiene fecha.
    const card = (n) => {
      const w = porId.get(n.area), ls = lineas(n.texto), t = n.titulo || ls.shift() || 'Nota', cli = n.cliente ? nombreDe(n.cliente) : '';
      return html`<a class="home-imp-card eleva" href="#/areas/${w.id}" style="--ac:var(${w.color})"><span class="home-imp-top">${cuadrito(TIPO_ICONO[n.tipo], { color: 'var(--ac)', titulo: TIPO_NOMBRE[n.tipo] })}<b>${corta(t, 90)}</b></span>
        ${ls.length ? html`<span class="home-imp-t">${ls.slice(0, 2).map((x) => html`<span>${corta(x)}</span>`)}</span>` : ''}
        <span class="home-imp-meta"><span class="home-imp-area">${ico(w.icono, 13)}${w.nombre}</span>${cli ? html`<span class="home-imp-cli">${monograma(cli, { tam: 'sm' })}<span>${cli}</span></span>` : ''}${cuentaChip(n.fecha, T, { hecho: n.estado === 'Hecho' })}</span></a>`;
    };
    // Las tarjetas entran escalonadas solo la primera vez que llegan (escalonar, después de pintar): un repintado no las repite.
    if (notas !== null && lista.length) nueva('imp', '.home-imp-card');
    return html`<section class="home-imp" aria-label="Importante"><div class="hy-bh"><h2>Importante</h2><span>Lo que fijaste en cada área</span></div>
      ${notas === null ? html`<p class="loading sm">Cargando…</p>`
      : lista.length ? html`<div class="home-imp-grid">${lista.map(card)}</div>`
      : html`<div class="home-imp-vacio">${vacio({ icono: 'star', titulo: 'Aún no hay nada fijado', linea: 'Fija lo importante desde cada área y sale aquí.', compacto: true })}<div class="home-imp-links">${ws.map((w) => html`<a class="home-imp-ws" href="#/areas/${w.id}" style="--ac:var(${w.color})">${ico(w.icono, 14)}${w.nombre}</a>`)}</div></div>`}</section>`;
  }
  const comun = () => html`${ask()}${kpis()}<div class="home-two">${actividad()}${importante()}</div>`;

  // ---------- CEO · COO ----------
  // Lo que se traba si nadie lo mueve, con su botón; a la derecha, la agenda y el contenido del mes. Lo de cobrar y
  // arrancar (lo que era Control del flujo) vive aquí.
  function atencion(late, review) {
    const out = [], qs = quotes || [];
    const conQuote = new Set(qs.filter((q) => q.status !== 'Rechazada').map((q) => q.lead_id).filter(Boolean));
    const money = (q, n) => { const c = q.currency || 'GTQ'; try { return new Intl.NumberFormat('es-GT', { style: 'currency', currency: c, maximumFractionDigits: c === 'GTQ' ? 0 : 2 }).format(n); } catch { return Q(n); } };
    for (const q of qs) {
      if (q.status === 'Aceptada' && q.payment?.status === 'por confirmar') out.push({ w: 0, ic: '$', tone: 'm', t: `Pago de ${q.client}`, s: `Subieron el comprobante · ${q.number} · ${money({ currency: q.payment.currency }, q.payment.amount)}`, tag: 'Hoy', btn: ceoish ? ['confirm', 'Confirmar pago', q.id, true] : null, proof: q.payment.proof_id });
      else if (q.status === 'Aceptada' && (!q.payment || q.payment.status === 'rechazado')) out.push({ w: 1, ic: '$', tone: 'm', t: `Falta el pago de ${q.client}`, s: `${q.number} · ${money(q, qSub(q))} aprobada${q.payment?.status === 'rechazado' ? ' · pago devuelto' : ''}`, tag: '', btn: ['pay', 'Subir pago', q.id] });
      else if (q.status === 'Enviada' && q.sent_at && q.sent_at.slice(0, 10) <= addDays(T, -5)) { const d = -daysFrom(q.sent_at.slice(0, 10)); out.push({ w: 3, ic: 'mail', tone: 'b', t: `${q.client} no ha respondido la cotización`, s: `${q.number} · enviada el ${fdate(q.sent_at.slice(0, 10))}`, tag: `${d} días`, red: true, href: `#/org/sales/quotes/${q.id}`, hl: 'Dar seguimiento' }); }
    }
    for (const l of dueLeads || []) if (['Reunión', 'Propuesta'].includes(l.stage) && !l.archived && !conQuote.has(l.id)) out.push({ w: 4, ic: '→', tone: 'g', t: `${l.name} · por cotizar`, s: [l.wants ? levelName(l.wants) : '', l.company].filter(Boolean).join(' · ') || 'Lista para cotizar', tag: '', href: `#/org/sales/quotes/new/${l.id}`, hl: 'Cotizar' });
    for (const x of dueSoon({ leads: dueLeads || [], invoices: dueInv || [], access: acc, T, now: Date.now() })) out.push({ w: x.date < T ? 2 : 5, ic: x.kind === 'lead' ? '☏' : '$', tone: x.kind === 'lead' ? 'b' : 'm', t: x.kind === 'lead' ? (x.wait != null ? `${x.title} espera respuesta` : `Seguimiento a ${x.title}`) : `${x.kind === 'cobrar' ? 'Cobrar a' : 'Pagar a'} ${x.title}`, s: x.kind === 'lead' ? x.sub : [x.sub, Q(x.amount)].filter(Boolean).join(' · '), tag: x.wait != null ? html`<span class="vf-timer ${x.tone}" data-wait="${x.created}">${durText(x.wait)}</span>` : x.date < T ? `Venció ${fdate(x.date)}` : whenLabel(x.date), fecha: x.wait != null ? '' : x.date, red: x.date < T, href: x.href, hl: 'Abrir' });
    for (const t of [...late, ...review.filter((r) => !late.includes(r))]) out.push({ w: st(t) === 'En revisión' ? 6 : 2, ic: st(t) === 'En revisión' ? 'eye' : '!', tone: st(t) === 'En revisión' ? 'b' : 'v', t: st(t) === 'En revisión' ? `Revisar: ${t.title}` : t.title, s: `${clientOf(t)} · ${nameOf(t.assignee).split(' ')[0]}`, tag: st(t) === 'En revisión' ? 'En revisión' : `Venció ${fdate(t.due)}`, fecha: st(t) === 'En revisión' ? '' : t.due, red: st(t) !== 'En revisión', task: t.id });
    for (const a of accounts) { const ob = a.onboarding; if (!ob?.items?.length || ob.done_at || !ob.at || ob.at.slice(0, 10) > addDays(T, -2)) continue; out.push({ w: 5, ic: '○', tone: 'b', t: `${a.name} no ha terminado su onboarding`, s: `${ob.items.filter((x) => x.done).length} de ${ob.items.length} listos`, tag: `Desde el ${fdate(ob.at.slice(0, 10))}`, href: `#/portal/${a.slug || a.id.replace(/^acc-/, '')}`, hl: 'Abrir' }); }
    return out.sort((a, z) => a.w - z.w);
  }
  // Una cosa que necesita atención: la franja y el cuadrito llevan el color de su urgencia (rojo = vence o ya pasó, ámbar = pronto,
  // gris = sin prisa) y además lo dice un texto para lectores de pantalla; a la derecha, cuánto falta en palabras (o su etiqueta).
  const urgencia = (x) => { const c = x.fecha ? cuenta(x.fecha, T) : null; return c ? (c.tono === 'ok' ? 'baja' : c.tono === 'pronto' ? 'media' : 'alta') : x.red || x.w <= 2 ? 'alta' : x.w <= 4 ? 'media' : 'baja'; };
  const itemHtml = (x) => { const u = urgencia(x), chip = cuentaChip(x.fecha, T); return html`<div class="hy-it hy-urg hy-u-${u}" style="--fr:${URG_COLOR[u]}">${cuadrito(IC_ATENCION[x.ic] || x.ic, { color: URG_COLOR[u] })}<div class="hy-t"><span class="sr-only">${URG_TXT[u]}: </span>${x.t}<small>${x.s}</small></div>
    ${hay(chip) ? chip : html`<span class="hy-tag ${x.red ? 'r' : ''}">${x.tag}</span>`}
    ${x.proof ? html`<button class="btn ghost xs" data-act="proof" data-id="${x.proof}">Comprobante</button>` : ''}
    ${x.btn ? html`<button class="btn xs ${x.btn[3] ? '' : 'ghost'}" data-act="${x.btn[0]}" data-id="${x.btn[2]}">${x.btn[1]}</button>` : x.task ? html`<button class="btn ghost xs" data-act="open" data-id="${x.task}">Abrir</button>` : x.href ? html`<a class="btn ghost xs" href="${x.href}">${x.hl}</a>` : ''}</div>`; };

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
    mount(el, html`${hero(n ? html` · <em>${n} cosa${n === 1 ? '' : 's'}</em> necesita${n === 1 ? '' : 'n'} tu decisión hoy.` : ' · Todo en orden.')}
      ${me.role === 'ceo' && !tasks.length && !projects.length ? html`<a class="asbar" href="#/org/setup" style="display:flex">${ico('gear')} La app todavía está vacía: <b>haz el Arranque</b> y queda lista con lo que ya dice el repo →</a>` : ''}
      ${comun()}
      <div class="hy-two">
        <section class="hy-box" id="hoy-att"><div class="hy-bh"><h2>Necesita atención</h2><span>Lo que se traba si nadie lo mueve, con su siguiente paso</span>${att.length ? html`<span class="hy-c">${att.length}</span>` : ''}</div>
          ${att.length ? att.slice(0, 12).map(itemHtml) : html`<div class="mut sm" style="padding:10px 0">Nada trabado ${ico('check', 14)}</div>`}
          ${att.length > 12 ? html`<span class="mut sm" style="padding-top:8px">y ${att.length - 12} más</span>` : ''}</section>
        <div class="hy-side">
          <section class="hy-box"><div class="hy-bh"><h2>Agenda</h2><span>Hoy y lo que viene</span></div>
            ${agenda === null && !pm.length ? html`<p class="loading sm">Cargando tu agenda…</p>` : ''}
            ${agErr ? html`<div class="mut sm" style="padding:6px 0">No pude leer tu Google Calendar: conecta tu Google en <a href="#/me">Mi perfil</a>. <button class="sm linkish" data-act="agRetry">Reintentar</button></div>` : ''}
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
      return html`<a class="hy-ct" href="#/areas/marketing"><span class="hy-m">${monograma(a.name, { tam: 'sm' })}${a.name}</span><span class="hy-cb">${ps.length ? html`<i style="width:${pct(listo, ps.length)}%"></i><i style="width:${pct(pub, ps.length)}%"></i>` : ''}</span><span class="hy-cn">${ps.length ? html`<b>${pub}</b> de ${ps.length}` : 'Sin piezas'}</span></a>`;
    });
  }
  // Las cuentas: los perfiles de contenido del repo que son clientes activos (más Inherent).
  const content = { accounts: null, posts: [] };
  if (ceoish) {
    Promise.all([api('repo/content').catch(() => ({ profiles: [] })), col('content').list().catch(() => []), api('repo/clients').catch(() => ({ clients: [] }))]).then(([rc, all, cl]) => {
      const act = new Set([...(cl.clients || []).filter((c) => c.hasPlan).map((c) => c.slug), ...accounts.filter((a) => a.from_quote).map((a) => a.slug || String(a.id).replace(/^acc-/, ''))]);
      content.accounts = (rc.profiles || []).filter((x) => x.slug !== 'personal' && (act.has(x.slug) || x.slug === 'inherent')).map((x) => ({ slug: x.slug, name: accounts.find((a) => a.id === 'acc-' + x.slug)?.name || x.name || x.slug.toUpperCase() }));
      content.posts = all.filter((x) => x.kind === 'post');
      repinta();
    });
  }
  // ---------- Equipo: mis responsabilidades ----------
  function team() {
    const mine = tasks.filter((t) => t.assignee === me.email && open(t)).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
    const groups = new Map(); for (const t of mine) { const k = t.project_id || ''; (groups.get(k) || groups.set(k, []).get(k)).push(t); }
    const title = (k) => { const p = proj(k); return p ? `${p.client ? p.client + ' · ' : ''}${p.name}` : 'Interno'; };
    const meets = upcoming(projects).filter((x) => x.date === T);
    mount(el, html`${hero()}
      ${comun()}
      ${purposeCard(me, { area: 'home' })}
      <div class="grid g2" style="margin-top:14px;align-items:start">
        <div><div class="sec-title" style="margin-top:0"><h2>Mis responsabilidades</h2><span class="mut sm">Qué, para cuándo y dónde se entrega</span><div class="sp"></div><button class="btn ghost xs" data-act="addTask">+ Tarea</button></div>
          ${mine.length ? [...groups.entries()].map(([k, l]) => html`<div class="card wkbox" style="margin-bottom:12px"><div class="wkhead"><h3>${title(k)}</h3><div class="sp"></div><span class="mut sm">${l.length}</span></div>
            ${l.map((t) => html`<div class="wkrow"><span class="grow" data-act="open" data-id="${t.id}" style="cursor:pointer"><b style="font-weight:500">${t.title}</b>${t.dept || t.role ? html`<span class="mut sm"> · ${t.dept || t.role}</span>` : ''}</span>${dueChip(t)}${stChip(t)}<button class="btn xs" data-act="open" data-id="${t.id}">${st(t) === 'En revisión' ? 'Ver' : 'Entregar'}</button></div>`)}</div>`)
          : html`<div class="empty"><b>Nada pendiente</b>Cuando te asignen una responsabilidad aparece aquí, con su fecha y dónde entregarla.</div>`}</div>
        <div class="hoy-side"><div class="card wkbox"><div class="wkhead"><div><h3>Hoy</h3><span class="mut sm">Tu agenda y las reuniones de tus proyectos</span></div><span class="gbadge" style="margin-left:auto">${IC.cal}</span></div>
          ${agendaRows()}${meets.map((x) => html`<div class="wkrow"><span class="wkt">${ico('users', 14)}</span><span class="grow">${x.name}<span class="mut sm"> · ${x.p.client || x.p.name}</span></span></div>`)}
          ${agenda && !agenda.length && !meets.length ? html`<div class="mut sm" style="padding:6px 0">Sin reuniones hoy.</div>` : ''}
          <div class="mut sm" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)">Tus SOPs y plantillas están en la <a href="#/org/library" style="color:inherit">Library</a>.</div></div>
          ${dueCard()}</div>
      </div>`);
  }

  // La caja de «Ask» crece con el texto (hasta ~6 líneas).
  const auto = (ta) => { if (!ta) return; ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'; };
  // Al repintar (llegan datos) se conserva lo que la persona ya escribió en la caja, y el foco si lo tenía.
  const paint = () => {
    if (!alive()) return;
    const ta0 = $('#home-q', el), txt = ta0?.value || '', foco = ta0 && document.activeElement === ta0, pos = foco ? ta0.selectionStart : 0;
    (ceoish ? ceo : team)();
    if (!t1) t1 = performance.now();
    // Los números cuentan de 0 al valor la primera vez; lo que llega tarde (las notas fijadas) entra escalonado una vez.
    contarNumeros(el, contados);
    if (pend.length) escalonar(el, { sel: pend.splice(0).join(',') });
    const ta = $('#home-q', el); if (!ta) return;
    if (txt) { ta.value = txt; auto(ta); }
    if (foco) { ta.focus({ preventScroll: true }); try { ta.setSelectionRange(pos, pos); } catch {} }
  };
  const enviar = () => {
    const ta = $('#home-q', el), texto = (ta?.value || '').trim();
    if (!texto) return ta?.focus();
    abrirEnChat(me.email, { modo: modoAsk(), slug: ctxSlug(), borrador: texto });
  };
  acts(el, { ask: (f, e) => { e.preventDefault(); enviar(); } }, 'submit');
  acts(el, { askTa: (t, e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(); } } }, 'keydown');
  acts(el, { askTa: (t) => auto(t) }, 'input');
  acts(el, {
    chip: (b) => { const ta = $('#home-q', el); if (!ta) return; ta.value = b.dataset.q || ''; auto(ta); ta.focus(); },
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
