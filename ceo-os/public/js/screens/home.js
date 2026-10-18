// Hoy. Para el CEO: tres números, las entregas del mes por semana, lo de hoy y lo que necesita atención.
// Para el equipo: sus responsabilidades (qué, para cuándo y dónde se entrega). Sin revenue, leads ni engagement.
import { html, mount, col, api, fdate, today, toast, acts, IC, $, calQ, teamList, ico } from '../core.js';
import { upcoming } from '../meetings.js';
import { bars, kpis, PAL } from '../charts.js';
import { openDelivery, dueChip, stChip } from '../taskcard.js';
import { bdayText } from './me.js';
import { connectNotice, hookNotice } from '../connectai.js';

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
  const loadAgenda = () => api(`google/calendar?from=${T}&to=${T}${calQ()}`).then((r) => { agenda = r.events || []; agErr = null; }).catch((e) => { agErr = e.message; agenda = []; }).then(() => alive() && paint());
  loadAgenda();
  const iv = setInterval(() => (alive() ? document.visibilityState === 'visible' && loadAgenda() : clearInterval(iv)), 120000);
  const onVis = () => { if (!alive()) return document.removeEventListener('visibilitychange', onVis); if (document.visibilityState === 'visible') loadAgenda(); };
  document.addEventListener('visibilitychange', onVis);

  const ctx = () => ({ me, projects, team: people });
  const onTask = (r, t) => { tasks = r ? tasks.map((x) => (x.id === r.id ? r : x)) : tasks.filter((x) => x.id !== t.id); paint(); };
  const trow = (t, extra = '') => html`<div class="wkrow" data-act="open" data-id="${t.id}"><span class="grow"><b style="font-weight:500">${t.title}</b><span class="mut sm"> · ${clientOf(t)}${extra ? ' · ' + extra : ''}</span></span>${dueChip(t)}${stChip(t)}</div>`;
  const agendaRows = () => agenda === null ? html`<p class="mut sm">Cargando tu agenda…</p>` : agErr ? html`<div class="mut sm">No pude leer tu Google Calendar. <button class="sm linkish" data-act="agRetry">Reintentar</button></div>`
    : agenda.slice(0, 5).map((e) => html`<a class="wkrow" href="${/^https:\/\//.test(e.link || '') ? e.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="wkt">${e.allDay ? 'Día' : String(e.start).slice(11, 16)}</span><span class="grow">${e.summary}</span>${e.meet ? html`<span class="mut sm">Meet</span>` : ''}</a>`);
  const head = () => html`<div class="hello"><h1>${greet()}, ${first}.</h1><p>${ceoish ? html`Esto es lo que pasa hoy en <em>Inherent</em>.` : html`Esto es lo tuyo <em>hoy</em>.`}</p></div>
    ${bdays.length ? html`<div class="bday">${bdays.map((p) => { const now = p.birthday === soon[0], mine = (p.email || p.id) === me.email; return html`<span class="bdi ${now ? 'now' : ''}">${now ? (mine ? html`${ico('spark')} <b>¡Feliz cumpleaños, ${first}!</b>` : html`${ico('cake')} <b>Hoy cumple ${p.name.split(' ')[0]}</b>`) : html`${ico('cake')} ${p.name.split(' ')[0]} cumple el ${bdayText(p.birthday)}`}</span>`; })}</div>` : ''}
    ${connectNotice(me)}`;

  // ---------- CEO · COO ----------
  function ceo() {
    const openT = tasks.filter(open);
    const late = openT.filter((t) => t.due && t.due < T), week = openT.filter((t) => t.due && t.due >= monday && t.due <= sunday), review = tasks.filter((t) => st(t) === 'En revisión');
    const activeSlugs = new Set([...(repoClients || []).filter((c) => c.hasPlan).map((c) => c.slug), ...accounts.filter((a) => a.from_quote).map((a) => a.slug || String(a.id).replace(/^acc-/, ''))]);
    const nClients = repoClients === null ? '…' : activeSlugs.size;
    // Entregas del mes por semana: hechas vs pendientes (por su fecha de entrega).
    const inMonth = tasks.filter((t) => String(t.due || '').slice(0, 7) === M);
    const [y, m] = M.split('-').map(Number), days = new Date(y, m, 0).getDate(), nWeeks = Math.ceil(days / 7);
    const groups = Array.from({ length: nWeeks }, (_, i) => { const l = inMonth.filter((t) => Math.floor((+t.due.slice(8) - 1) / 7) === i); return { label: `S${i + 1}`, values: [l.filter((t) => st(t) === 'Hecha').length, l.filter(open).length] }; });
    const todayT = openT.filter((t) => t.due === T).sort((a, z) => String(a.title).localeCompare(z.title));
    const meets = upcoming(projects).filter((x) => x.date === T);
    const attention = [...late, ...review.filter((t) => !late.includes(t))].sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
    mount(el, html`${head()}
      ${me.role === 'ceo' && !tasks.length && !projects.length ? html`<a class="asbar" href="#/setup" style="display:flex">${ico('gear')} La app todavía está vacía: <b>haz el Arranque</b> y queda lista con lo que ya dice el repo →</a>` : ''}
      ${kpis([['Clientes activos', nClients], ['Por entregar esta semana', week.length, week.length ? PAL.brown : ''], ['Entregas atrasadas', late.length, late.length ? PAL.red : '']], { always: true })}
      <div class="grid g2" style="margin-top:14px">
        <div class="card wkbox"><div class="wkhead"><div><h3>Entregas del mes por semana</h3><span class="mut sm">Hechas vs. pendientes, por su fecha de entrega</span></div></div>
          ${bars(groups, [{ name: 'Hechas', c: PAL.ink }, { name: 'Pendientes', c: PAL.light }], { stack: true, empty: 'Sin entregas con fecha este mes. Salen de las tareas de cada proyecto.' })}</div>
        <div class="card wkbox"><div class="wkhead"><div><h3>Hoy</h3><span class="mut sm">Reuniones y lo que vence hoy</span></div><div class="sp"></div><span class="gbadge">${IC.cal}</span><button class="btn ghost xs" data-act="addTask">+ Tarea</button></div>
          ${agendaRows()}
          ${meets.map((x) => html`<div class="wkrow"><span class="wkt">${ico('users', 14)}</span><span class="grow">${x.name}<span class="mut sm"> · ${x.p.client || x.p.name}</span></span></div>`)}
          ${todayT.length ? todayT.slice(0, 8).map((t) => trow(t, nameOf(t.assignee).split(' ')[0])) : agenda?.length || meets.length ? '' : html`<div class="mut sm" style="padding:6px 0">Nada vence hoy.</div>`}</div>
      </div>
      <div class="card wkbox" style="margin-top:14px"><div class="wkhead"><div><h3>Necesita atención</h3><span class="mut sm">Atrasadas y en revisión, con su dueño</span></div>${attention.length ? html`<span class="badge-n">${attention.length}</span>` : ''}</div>
        ${attention.length ? attention.slice(0, 20).map((t) => html`<div class="wkrow" data-act="open" data-id="${t.id}">${(() => { const p = person(t.assignee); return html`<span class="av" style="background:${p?.color || '#735741'}" title="${nameOf(t.assignee)}">${(nameOf(t.assignee)[0] || '?').toUpperCase()}</span>`; })()}<span class="grow"><b style="font-weight:500">${t.title}</b><span class="mut sm"> · ${clientOf(t)} · ${nameOf(t.assignee).split(' ')[0]}</span></span>${st(t) === 'En revisión' ? stChip(t) : dueChip(t)}</div>`) : html`<div class="mut sm" style="padding:6px 0">Todo en orden ${ico('check', 14)}</div>`}</div>`);
  }

  // ---------- Equipo: mis responsabilidades ----------
  function team() {
    const mine = tasks.filter((t) => t.assignee === me.email && open(t)).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
    const late = mine.filter((t) => t.due && t.due < T).length, week = mine.filter((t) => t.due && t.due >= monday && t.due <= sunday).length, review = mine.filter((t) => st(t) === 'En revisión').length;
    const groups = new Map(); for (const t of mine) { const k = t.project_id || ''; (groups.get(k) || groups.set(k, []).get(k)).push(t); }
    const title = (k) => { const p = proj(k); return p ? `${p.client ? p.client + ' · ' : ''}${p.name}` : 'Interno'; };
    const meets = upcoming(projects).filter((x) => x.date === T);
    mount(el, html`${head()}
      ${kpis([['Esta semana', week], ['Atrasadas', late, late ? PAL.red : ''], ['En revisión', review]])}
      <div class="grid g2" style="margin-top:14px;align-items:start">
        <div><div class="sec-title" style="margin-top:0"><h2>Mis responsabilidades</h2><span class="mut sm">Qué, para cuándo y dónde se entrega</span><div class="sp"></div><button class="btn ghost xs" data-act="addTask">+ Tarea</button></div>
          ${mine.length ? [...groups.entries()].map(([k, l]) => html`<div class="card wkbox" style="margin-bottom:12px"><div class="wkhead"><h3>${title(k)}</h3><div class="sp"></div><span class="mut sm">${l.length}</span></div>
            ${l.map((t) => html`<div class="wkrow"><span class="grow" data-act="open" data-id="${t.id}" style="cursor:pointer"><b style="font-weight:500">${t.title}</b>${t.dept || t.role ? html`<span class="mut sm"> · ${t.dept || t.role}</span>` : ''}</span>${dueChip(t)}${stChip(t)}<button class="btn xs" data-act="open" data-id="${t.id}">${st(t) === 'En revisión' ? 'Ver' : 'Entregar'}</button></div>`)}</div>`)
          : html`<div class="empty"><b>Nada pendiente</b>Cuando te asignen una responsabilidad aparece aquí, con su fecha y dónde entregarla.</div>`}</div>
        <div class="card wkbox"><div class="wkhead"><div><h3>Hoy</h3><span class="mut sm">Tu agenda y las reuniones de tus proyectos</span></div><span class="gbadge" style="margin-left:auto">${IC.cal}</span></div>
          ${agendaRows()}${meets.map((x) => html`<div class="wkrow"><span class="wkt">${ico('users', 14)}</span><span class="grow">${x.name}<span class="mut sm"> · ${x.p.client || x.p.name}</span></span></div>`)}
          ${agenda && !agenda.length && !meets.length ? html`<div class="mut sm" style="padding:6px 0">Sin reuniones hoy.</div>` : ''}
          <div class="mut sm" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)">Tus SOPs y plantillas están en la <a href="#/library" style="color:inherit">Library</a>.</div></div>
      </div>`);
  }

  const paint = () => { if (!alive()) return; (ceoish ? ceo : team)(); };
  acts(el, {
    open: (b) => { const t = tasks.find((x) => x.id === b.dataset.id); if (t) openDelivery(t, ctx(), (r) => onTask(r, t)); },
    agRetry: () => { agenda = null; agErr = null; paint(); loadAgenda(); },
    addTask: async () => { const { newTask } = await import('../create.js'); const t = await newTask({ team: people, me, projects, pre: { assignee: me.email } }); if (t) { tasks.push(t); paint(); } },
  });
  hookNotice(el, me, () => alive() && paint());
  paint();
}
