// Hoy: qué tengo que entregar, qué vence pronto, qué está bloqueado y qué necesita supervisión.
// Nada de métricas sin acción: los números de la empresa viven en Finance, Sales y Content (en «Más»).
import { html, mount, col, api, fdate, today, toast, acts, IC, calQ, teamList, initials } from '../core.js';
import { bdayText } from './me.js';
import { connectNotice, hookNotice } from '../connectai.js';
import { blockersOf } from '../cycle.js';

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export async function render(el, { me, alive }) {
  const can = (a) => me.areas.includes(a);
  const boss = me.role === 'ceo' || me.role === 'coo';
  const [tasks, projects, content, people] = await Promise.all([
    col('tasks').list(), col('projects').list().catch(() => []), can('content') ? col('content').list().catch(() => []) : [],
    me.role === 'client' ? [] : teamList().catch(() => []),
  ]);
  const T = today(), T7 = addDays(T, 7), first = (me.name || '').split(' ')[0];
  const md = (d) => d.toISOString().slice(5, 10);
  const soon = Array.from({ length: 8 }, (_, i) => md(new Date(Date.now() + i * 864e5)));
  const bdays = people.filter((p) => p.active !== false && p.birthday && soon.includes(p.birthday)).sort((a, z) => soon.indexOf(a.birthday) - soon.indexOf(z.birthday));
  let agenda = null, agErr = null;
  const loadAgenda = () => api(`google/calendar?from=${T}&to=${T}${calQ()}`).then((r) => { agenda = r.events; agErr = null; if (alive()) paint(); }).catch((e) => { agErr = e.message; agenda = []; if (alive()) paint(); });
  loadAgenda();
  const iv = setInterval(() => (alive() ? document.visibilityState === 'visible' && loadAgenda() : clearInterval(iv)), 120000);

  const person = (k) => people.find((p) => p.id === k || p.email === k);
  const nameOf = (k) => (person(k)?.name || (k === me.email ? me.name : String(k || '—').split('@')[0])).split(' ')[0];
  const proj = (id) => projects.find((p) => p.id === id);
  const where = (t) => proj(t.project_id)?.client || proj(t.project_id)?.name || 'Interno';
  const st = (t) => t.status || 'Por empezar';
  const openT = tasks.filter((t) => st(t) !== 'Hecha');
  const isMine = (t) => t.assignee === me.email;
  const blocked = (t) => blockersOf(t, tasks).length > 0;
  const late = (t) => t.due && t.due < T;

  // Lo mío, por urgencia.
  const mine = openT.filter(isMine).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
  const groups = [
    ['Atrasado', mine.filter((t) => late(t) && st(t) !== 'En revisión'), 'red'],
    ['Hoy', mine.filter((t) => t.due === T && st(t) !== 'En revisión'), 'red'],
    ['Esta semana', mine.filter((t) => t.due > T && t.due <= T7 && st(t) !== 'En revisión'), ''],
    ['Más adelante', mine.filter((t) => (!t.due || t.due > T7) && st(t) !== 'En revisión'), ''],
  ];
  // Lo que necesita a alguien más: revisar, destrabar o perseguir.
  const review = boss ? openT.filter((t) => st(t) === 'En revisión') : openT.filter((t) => st(t) === 'En revisión' && (t.accountable === me.email || isMine(t)));
  const stuck = (boss ? openT : openT.filter(isMine)).filter((t) => blocked(t));
  const othersLate = boss ? openT.filter((t) => !isMine(t) && late(t) && !blocked(t) && st(t) !== 'En revisión') : [];
  const posts = content.filter((c) => c.kind === 'post' && c.date >= T && c.date <= T7 && c.status !== 'Publicado').sort((a, z) => a.date.localeCompare(z.date));

  const av = (k) => { const p = person(k); return p?.picture ? html`<img class="hav" src="${p.picture}" alt="" referrerpolicy="no-referrer">` : html`<span class="hav">${initials(p?.name || k || '?')}</span>`; };
  const due = (t) => (!t.due ? html`<span class="mut sm">sin fecha</span>` : late(t) ? html`<span class="chip red sm2">Venció ${fdate(t.due)}</span>` : t.due === T ? html`<span class="chip red sm2">Hoy</span>` : html`<span class="mut sm">${fdate(t.due)}</span>`);
  const row = (t, { check = false, who = false, why = '' } = {}) => html`<div class="hrow">${check ? html`<input type="checkbox" data-act="done" data-id="${t.id}" aria-label="Marcar hecha">` : ''}${who ? av(t.assignee) : ''}
    <a class="grow" href="#/work/kanban">${blocked(t) && st(t) !== 'Hecha' ? '🔒 ' : ''}${t.title}<span class="mut sm"> · ${where(t)}${who ? ' · ' + nameOf(t.assignee) : ''}${why ? ' · ' + why : ''}</span></a>${due(t)}</div>`;
  const sec = (title, sub, body, right = '') => html`<section class="card hsec"><div class="hhead"><div><h3>${title}</h3>${sub ? html`<span class="mut sm">${sub}</span>` : ''}</div><div class="sp"></div>${right}</div>${body}</section>`;

  function paint() {
    const counts = [['Atrasado', groups[0][1].length + othersLate.length, 'red'], ['Para hoy', groups[1][1].length, ''], ['Bloqueado', stuck.length, stuck.length ? 'amber' : ''], [boss ? 'Por revisar' : 'En revisión', review.length, '']];
    mount(el, html`
      <div class="hello"><h1>${greet()}, ${first}.</h1><p>Lo que tiene que pasar hoy.</p></div>
      ${bdays.length ? html`<div class="bday">${bdays.map((p) => { const isToday = p.birthday === soon[0], self = (p.email || p.id) === me.email;
        return html`<span class="bdi ${isToday ? 'now' : ''}">${p.picture ? html`<img src="${p.picture}" alt="" referrerpolicy="no-referrer">` : ''}${isToday ? (self ? html`🎉 <b>¡Feliz cumpleaños, ${first}!</b>` : html`🎂 <b>Hoy cumple ${p.name.split(' ')[0]}</b> · ¡felicítalo!`) : html`🎂 ${p.name.split(' ')[0]} cumple el ${bdayText(p.birthday)}`}</span>`; })}</div>` : ''}
      ${connectNotice(me)}
      ${me.role === 'ceo' && !tasks.length ? html`<a class="asbar" href="#/setup" style="display:flex">⚙ La app todavía está vacía: <b>haz el Arranque</b> (4 pasos) y queda lista con lo que ya dice el repo →</a>` : ''}
      <div class="hcounts">${counts.map(([l, n, c]) => html`<div class="hcount ${n && c ? c : ''}"><b>${n}</b><span>${l}</span></div>`)}</div>
      <div class="hgrid">
        <div class="hcol">
          ${sec('Lo que tienes que entregar', 'Tus tareas abiertas, de lo más urgente a lo que puede esperar', html`
            ${groups.every(([, l]) => !l.length) ? html`<div class="empty"><b>Nada pendiente</b>Tus tareas aparecen aquí.</div>`
              : groups.filter(([, l]) => l.length).map(([g, l, c]) => html`<div class="hgroup ${c}">${g} <span>${l.length}</span></div>${l.slice(0, g === 'Más adelante' ? 4 : 8).map((t) => row(t, { check: true }))}`)}
            <input class="in sm" id="hquick" placeholder="+ Tarea para hoy y Enter" style="margin-top:10px">`, html`<button class="btn ghost xs" data-act="addTask">+ Tarea</button>`)}
          ${review.length ? sec(boss ? 'Por revisar' : 'Esperando revisión', boss ? 'Lo entregaron: apruébalo o devuélvelo en Workspace' : 'Lo entregaste: espera el visto bueno', html`${review.slice(0, 8).map((t) => row(t, { who: boss }))}`, html`<a class="sm mut" href="#/work/kanban">Abrir →</a>`) : ''}
        </div>
        <div class="hcol">
          ${sec('Tu día', 'Google Calendar', agenda === null ? html`<p class="mut sm">Cargando tu agenda…</p>` : agErr ? html`<div class="mut sm">Calendar: ${agErr}</div>`
            : agenda.length ? html`${agenda.slice(0, 5).map((e) => html`<a class="agenda" href="${/^https:\/\//.test(e.link || '') ? e.link : '#'}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit"><span class="t">${e.allDay ? 'Día' : String(e.start).slice(11, 16)}</span><span class="bar2" style="background:#7f9631"></span><div><b style="font-weight:500">${e.summary}</b>${e.meet ? html`<div class="mut sm">Google Meet</div>` : e.location ? html`<div class="mut sm">${e.location}</div>` : ''}</div></a>`)}`
            : html`<div class="mut sm">Sin eventos hoy.</div>`, html`<span class="gbadge">${IC.cal}</span>`)}
          ${stuck.length ? sec('Bloqueado', 'Espera a otra tarea: destrábalo o reprograma', html`${stuck.slice(0, 6).map((t) => row(t, { who: boss, why: 'espera a «' + blockersOf(t, tasks)[0].title.slice(0, 40) + '»' }))}`) : ''}
          ${othersLate.length ? sec('Atrasado del equipo', 'Necesita que alguien lo persiga', html`${othersLate.slice(0, 6).map((t) => row(t, { who: true }))}`) : ''}
          ${posts.length ? sec('Se publica esta semana', 'Lo que tiene que estar listo y programado', html`${posts.slice(0, 6).map((p) => html`<a class="hrow" href="#/content/postear/${p.profile}"><span class="chip sm2">${fdate(p.date)}</span><span class="grow">${p.title}<span class="mut sm"> · ${p.profile} · ${p.status || 'Idea'}</span></span></a>`)}`) : ''}
        </div>
      </div>`);
    const q = el.querySelector('#hquick');
    if (q) q.onkeydown = async (e) => { if (e.key !== 'Enter' || !q.value.trim()) return;
      try { const t = await col('tasks').create({ title: q.value.trim(), assignee: me.email, due: T, status: 'Por empezar' }); tasks.push(t); openT.push(t); mine.unshift(t); groups[1][1].unshift(t); paint(); el.querySelector('#hquick')?.focus(); } catch (err) { toast(err.message, true); } };
  }

  const drop = (t) => { for (const l of [openT, mine, ...groups.map((g) => g[1])]) { const i = l.indexOf(t); if (i >= 0) l.splice(i, 1); } };
  acts(el, {
    done: async (cb) => {
      const t = tasks.find((x) => x.id === cb.dataset.id);
      try { Object.assign(t, await col('tasks').save({ ...t, status: 'Hecha' })); toast('Hecha ✅'); setTimeout(() => { drop(t); paint(); }, 400); }
      catch (e) { cb.checked = false; toast(e.message, true); }
    },
    addTask: async () => {
      const { newTask } = await import('../create.js');
      const t = await newTask({ team: people, me, projects, pre: { assignee: me.email } });
      if (t) { tasks.push(t); if (st(t) !== 'Hecha') { openT.push(t); if (isMine(t)) { mine.push(t); const g = groups.find(([n]) => (n === 'Atrasado' ? late(t) : n === 'Hoy' ? t.due === T : n === 'Esta semana' ? t.due > T && t.due <= T7 : true)); g[1].push(t); } } paint(); }
    },
  }, 'click');
  hookNotice(el, me, () => alive() && paint());
  paint();
}
