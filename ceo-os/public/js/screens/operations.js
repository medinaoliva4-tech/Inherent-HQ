import { newProject as wizProject, newTask as wizTask, VIS_OPTS } from '../create.js';
import { tipoSopFields, bindSop, readTipoSop, sopLink } from '../tasktype.js';
import { projectPage, myProjects } from '../project-page.js';
import { taskKanban } from '../kanban.js';
import { juntarEventos, filtrarPorRol, tiposVisibles, rango, porDia, calendarioHtml, diaHtml, hitoHtml } from '../calendario-trabajo.js';
import { html, raw, mount, col, api, drawer, closeDrawer, ask, toast, acts, confirmAsk, fdate, today, $, $$, IC, initials , teamList , calQ, calAll, setCalAll, swap, ico, isSummary, canEdit, roChip } from '../core.js';

const TSTATUS = { 'Por empezar': '', 'En curso': 'amber', 'En revisión': 'blue', 'Hecha': 'green' };
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };

export async function render(el, { me, sub, alive }) {
  const PR = col('projects'), TK = col('tasks');
  let [projects, tasks, team, docs] = await Promise.all([PR.list(), TK.list(), teamList(), col('docs').list().catch(() => [])]);
  let clients = [];
  try { clients = (await api('repo/clients')).clients.map((c) => ({ ...c, plan: String(c.plan || '').replace(/^[⬜🔷🟨]\uFE0F?\s*/u, '') })); } catch {}
  // Vista por rol: «resumen» = los proyectos con su avance y las tareas atrasadas o en revisión; sin pipeline, calendario ni timeline.
  const resumen = isSummary(me, 'operations'), edit = canEdit(me, 'operations');
  // La página de un proyecto: #/operations/p/<id>/<vista> (Tareas, Resumen, Timeline, Calendario, Archivos, Equipo).
  const openP = (id) => { location.hash = '#/operations/p/' + encodeURIComponent(id); };
  if (sub[0] === 'p' && sub[1]) return projectPage(el, { me, id: decodeURIComponent(sub[1]), view: sub[2], edit, data: { projects, tasks, team, docs, clients }, back: () => { location.hash = '#/operations'; }, alive });
  // Un solo Kanban con todas las tareas (antes: la tira por departamento + la tabla «Tareas de…» + la pestaña Tareas).
  let tab = ['cal', 'time'].includes(sub[0]) ? sub[0] : 'tasks', kb = null;
  // El calendario de trabajo (calendario-trabajo.js): uno solo con reuniones, producción, entregas, ventas, facturas y el ciclo.
  // La vista (mes o semana) y los tipos apagados se recuerdan en este navegador.
  const lsGet = (k, d) => { try { return localStorage.getItem('cal.' + k) ?? d; } catch { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem('cal.' + k, v); } catch {} };
  let calView = lsGet('vista', 'mes') === 'semana' ? 'semana' : 'mes', calDate = today(), events = null, evErr = null, extra = null;
  const calOff = new Set(String(lsGet('off', '')).split(',').filter(Boolean));
  const person = (email) => team.find((t) => t.id === email || t.email === email);
  const pname = (id) => projects.find((p) => p.id === id)?.name || '—';

  async function saveProject(p) { try { const r = await PR.save(p); projects = projects.map((x) => (x.id === r.id ? r : x)); return r; } catch (e) { toast(e.message, true); return null; } }
  async function saveTask(t) { try { const r = await TK.save(t); tasks = tasks.map((x) => (x.id === r.id ? r : x)); return r; } catch (e) { toast(e.message, true); return null; } }

  function paint() {
    mount(el, html`
      <div class="hello row"><div><h1>Proyectos</h1><p>Por fase, con <em>tiempos</em> y tareas.</p></div><div class="sp"></div>${roChip(me, 'operations')}${edit && projects.length ? html`<button class="btn" data-act="newProject">+ Proyecto</button>` : ''}</div>
      ${projects.length ? html`<div id="mprojects"></div>`
      : html`<div class="empty"><b>Todavía no hay proyectos</b>Si es un cliente con plan, su pipeline se arma solo según lo contratado.${edit ? html`<div><button class="btn" data-act="newProject">+ Proyecto</button></div>` : ''}</div>`}
      ${!projects.length && !tasks.length ? '' : resumen ? html`<div class="sec-title" style="margin-top:22px"><h2>Necesita atención</h2><span class="mut sm">Atrasadas y en revisión</span></div><div id="obody"></div>` : html`<div class="row" style="margin:26px 0 16px;flex-wrap:wrap">
        <div class="tabs" style="margin:0">${[['tasks', 'Tareas'], ['cal', 'Calendario'], ['time', 'Timeline']].map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>
        <div class="sp"></div>${tab === 'tasks' && edit ? html`<button class="btn" data-act="newTask">+ Tarea</button>` : ''}
      </div>
      <div id="obody"></div>`}`);
    const mp = $('#mprojects', el); if (mp) myProjects(mp, { me, projects, tasks, team, clients, open: openP });
    if (!$('#obody', el)) return; // vacío: solo el botón de crear el primero
    if (resumen) return attention($('#obody', el));
    ({ tasks: board, cal, time })[tab]($('#obody', el));
  }
  // El resumen: solo lo que requiere acción, por proyecto.
  function attention(b) {
    const T = today();
    const list = tasks.filter((t) => t.status !== 'Hecha' && ((t.due && t.due < T) || t.status === 'En revisión')).sort((x, z) => String(x.due || '9').localeCompare(String(z.due || '9')));
    mount(b, list.length ? html`<div class="card">${list.slice(0, 40).map((t) => html`<div class="wkrow" data-act="task" data-id="${t.id}"><span class="grow">${t.title}<span class="mut sm"> · ${pname(t.project_id)} · ${person(t.assignee)?.name || 'Sin responsable'}</span></span>${t.status === 'En revisión' ? html`<span class="chip amber sm2">En revisión</span>` : html`<span class="chip red sm2">Venció ${fdate(t.due)}</span>`}</div>`)}</div>` : html`<div class="card"><div class="mut">Todo en orden ${ico('check', 14)}</div></div>`);
  }

  // ---------- Tareas: el Kanban único (kanban.js), filtrable por proyecto y por responsable ----------
  function board(b) {
    kb = taskKanban(b, { tasks: () => tasks, projects, team, me, show: { project: true, person: true }, key: 'ops', edit,
      save: (t, patch) => saveTask({ ...t, ...patch }), open: openTask, openProject: openP });
  }
  async function addTask(pre = {}) { const r = await wizTask({ team, me, projects, pre }); if (r) { tasks.push(r); paint(); } }

  // ---------- Calendario de trabajo (Google Calendar + todo lo operativo) ----------
  async function loadEvents() {
    const R = rango(calView, calDate), from = new Date(Date.parse(R.from + 'T12:00:00Z') - 864e5).toISOString().slice(0, 10), to = new Date(Date.parse(R.to + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10);
    try { const r = await api(`google/calendar?from=${from}&to=${to}${calQ()}`); events = r.events || []; calInfo = { allCals: r.allCals !== false, calendars: r.calendars || [] }; evErr = null; } catch (e) { events = []; evErr = e.message; }
  }
  // Lo que no es de Proyectos: los seguimientos de Ventas, los vencimientos de Facturas y las grabaciones. Solo se pide lo que el perfil ve.
  async function loadExtra() {
    const a = me.areas || [];
    const [leads, invoices, content] = await Promise.all([a.includes('sales') ? col('leads').list().catch(() => []) : [], a.includes('finanzas') ? col('invoices').list().catch(() => []) : [],
      a.includes('content') && me.views?.content !== 'resumen' ? col('content').list().catch(() => []) : []]);
    extra = { leads, invoices, shoots: content.filter((x) => x.kind === 'shoot') };
  }
  let calInfo = { allCals: true, calendars: [] }, dayMap = {};
  function openEvent(e) {
    const when = e.allDay ? fdate(String(e.start).slice(0, 10)) + (String(e.end).slice(0, 10) > addDays(String(e.start).slice(0, 10), 1) ? ' – ' + fdate(addDays(String(e.end).slice(0, 10), -1)) : ' · todo el día')
      : `${fdate(String(e.start).slice(0, 10))} · ${String(e.start).slice(11, 16)} – ${String(e.end).slice(11, 16)}`;
    drawer(html`<div class="row"><span class="gbadge">${IC.cal} ${e.calName || 'Google Calendar'}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>${e.summary}</h2><div class="mut">${when}</div>
      ${e.location ? html`<div style="margin-top:12px">${ico('pin')} ${e.location}</div>` : ''}
      ${e.description ? html`<p class="sm" style="margin-top:12px;white-space:pre-wrap">${e.description}</p>` : ''}
      <div class="row" style="margin-top:20px;gap:8px">${e.meet && /^https:\/\//.test(e.meet) ? html`<a class="btn" href="${e.meet}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">Entrar a Meet</a>` : ''}
        ${/^https:\/\//.test(e.link || '') ? html`<a class="btn ghost" href="${e.link}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">Abrir en Google ↗</a>` : ''}
        <div class="sp"></div>${e.editable ? html`<button class="btn ghost" data-act="evdel">${ico('trash')}</button>` : ''}</div>`,
    { evdel: async () => { if (!(await confirmAsk(`¿Borrar «${e.summary}» de tu Google Calendar?`))) return; try { await api(`google/calendar/${encodeURIComponent(e.id)}`, { method: 'DELETE' }); closeDrawer(); toast('Evento borrado'); events = null; cal($('#obody', el)); } catch (err) { toast(err.message, true); } } });
  }
  async function newEvent(date) {
    const v = await ask('Nuevo evento en Google Calendar', [{ k: 'summary', l: 'Título', req: true }, { k: 'date', l: 'Fecha', t: 'date', v: date || today(), req: true, half: true }, { k: 'time', l: 'Hora (vacío = todo el día)', t: 'time', half: true }, { k: 'minutes', l: 'Duración (min)', t: 'number', v: 60, half: true }, { k: 'description', l: 'Notas', half: true }]);
    if (!v) return; try { await api('google/calendar', { method: 'POST', body: v }); toast('Evento creado en tu Google Calendar'); events = null; cal($('#obody', el)); } catch (e) { toast(e.message, true); }
  }
  function cal(b) {
    if (events === null || extra === null) { if (!b.querySelector('.wc')) mount(b, html`<p class="loading">Cargando el calendario…</p>`); Promise.all([events === null ? loadEvents() : null, extra === null ? loadExtra() : null]).then(() => tab === 'cal' && alive() && b.isConnected && cal(b)); return; }
    const R = rango(calView, calDate), T = today();
    const evs = filtrarPorRol(juntarEventos({ google: events, tasks, projects, shoots: extra.shoots, leads: extra.leads, invoices: extra.invoices, from: R.from, to: R.to, hoy: T }), me);
    dayMap = porDia(evs.filter((e) => !calOff.has(e.tipo)));
    mount(b, calendarioHtml({ vista: calView, fecha: calDate, eventos: evs, off: calOff, tipos: tiposVisibles(me), info: calInfo, err: evErr, ceo: me.role === 'ceo', hoy: T, all: calAll() }));
  }
  const calMove = (n) => { const d = new Date(calDate + 'T12:00:00Z'); if (calView === 'semana') d.setUTCDate(d.getUTCDate() + 7 * n); else d.setUTCMonth(d.getUTCMonth() + n, 1); calDate = d.toISOString().slice(0, 10); events = null; cal($('#obody', el)); };
  // Un hito del ciclo: qué pasa ese día y los proyectos de ciclo mensual a los que aplica.
  function openHito(d) {
    const cyc = projects.filter((p) => p.kind === 'Ciclo mensual');
    drawer(html`<div class="row"><span class="chip">Ciclo de contenido</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>${hitoHtml(d)}
      <div class="sec-title" style="margin-top:18px"><h2 style="font-size:17px">Proyectos del ciclo</h2><span class="mut sm">${cyc.length}</span></div>
      ${cyc.length ? cyc.map((p) => html`<a class="wkrow" href="#/operations/p/${encodeURIComponent(p.id)}"><span class="grow">${p.name}</span><span class="mut sm">${p.client || ''}</span></a>`) : html`<div class="mut sm">Ningún proyecto de ciclo mensual todavía.</div>`}
      <p class="mut sm" style="margin-top:14px">Las fechas se ajustan cada mes al calendario real; los límites del 11 y el 20 se respetan.</p>`);
  }

  // ---------- Timeline (Gantt por semanas) ----------
  function time(b) {
    const rows = projects.flatMap((p) => (p.phases || []).filter((x) => x.start && x.end).map((x) => ({ p, x })));
    if (!rows.length) return mount(b, html`<div class="empty"><b>Sin fechas todavía</b>Las fases con fecha de inicio y fin aparecen aquí.</div>`);
    const min = rows.reduce((a, r) => (r.x.start < a ? r.x.start : a), rows[0].x.start);
    const startD = new Date(min + 'T12:00'); startD.setDate(startD.getDate() - ((startD.getDay() + 6) % 7));
    const weeks = Array.from({ length: 10 }, (_, i) => { const d = new Date(startD); d.setDate(d.getDate() + i * 7); return iso(d); });
    const W = (s) => (new Date(s + 'T12:00') - new Date(weeks[0] + 'T12:00')) / (7 * 864e5);
    const tw = W(today());
    mount(b, html`<div class="card tscroll"><div class="gantt" style="grid-template-columns:220px repeat(10,1fr);min-width:900px">
      <div class="h">Fase</div>${weeks.map((w) => html`<div class="h">${fdate(w)}</div>`)}
      ${rows.map(({ p, x }) => { const s = W(x.start), e = W(addDays(x.end, 1)); const col = Math.floor(s);
        return html`<div class="lab">${p.name} · ${x.name}</div>${weeks.map((_, i) => html`<div class="cell">${i === Math.max(0, col) && s < 10 ? html`<div class="bar ${x.status === 'done' ? 'b1' : x.status === 'now' ? 'b2' : 'b4'}" title="${x.name} · ${fdate(x.start)} – ${fdate(x.end)}" style="left:${((s - col) * 100).toFixed(1)}%;width:calc(${((Math.min(e, 10) - s) * 100).toFixed(1)}% - 4px)">${x.name}</div>` : ''}${i === Math.floor(tw) && tw >= 0 && tw < 10 ? html`<div class="tline" style="left:${((tw % 1) * 100).toFixed(1)}%"></div>` : ''}</div>`)}`; })}
    </div></div>`);
  }

  function openTask(t) {
    const draw = () => {
      const who = person(t.assignee);
      drawer(html`<div class="row"><select class="in" id="tstatus" style="width:auto">${Object.keys(TSTATUS).map((s) => html`<option ${s === (t.status || 'Por empezar') ? raw('selected') : ''}>${s}</option>`)}</select><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
        <input class="in" id="ttitle" value="${t.title}" style="font-size:24px;font-weight:500;letter-spacing:-.6px;margin-top:16px;border:0;padding:6px 0;background:transparent">
        <div class="mut">${pname(t.project_id)}</div>
        <div class="form" style="margin-top:16px">
          <div class="two"><div><label class="f">Responsable</label><select class="in" id="tassignee"><option value="">—</option>${team.filter((p) => p.active !== false).map((p) => html`<option value="${p.email || p.id}" ${(p.email || p.id) === t.assignee ? raw('selected') : ''}>${p.name}</option>`)}</select></div>
            <div><label class="f">Vence</label><input class="in" id="tdue" type="date" value="${t.due || ''}"></div></div>
          <div><label class="f">Proyecto</label><select class="in" id="tproject"><option value="">—</option>${projects.map((p) => html`<option value="${p.id}" ${p.id === t.project_id ? raw('selected') : ''}>${p.name}</option>`)}</select></div>
          ${tipoSopFields(t, docs, 't')}
          <div><label class="f">¿Quién la puede ver?</label><select class="in" id="tvis">${VIS_OPTS.map((o) => html`<option value="${o.v}" ${o.v === (t.visibility || 'all') ? raw('selected') : ''}>${o.i} ${o.l} · ${o.d}</option>`)}</select>
            <div id="tviewers" class="row" style="flex-wrap:wrap;gap:4px 14px;margin-top:6px" ${t.visibility === 'people' ? '' : raw('hidden')}>${team.filter((p) => p.active !== false && p.email && p.email !== me.email).map((p) => html`<label class="check" style="padding:2px 0"><input type="checkbox" class="tview" value="${p.email}" ${(t.viewers || []).includes(p.email) ? raw('checked') : ''}> ${p.name}</label>`)}</div></div>
          <div><label class="f">Descripción</label><textarea class="in" id="tdesc">${t.description || ''}</textarea></div>
          <div><label class="f">Link (Drive, doc, carpeta)</label><input class="in" id="tlink" value="${t.link || ''}" placeholder="https://drive.google.com/…"></div>
        </div>
        ${sopLink(t, docs)}
        ${t.link && /^https?:\/\//.test(t.link) ? html`<a class="artifact" href="${t.link}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin-top:10px"><span class="fi" style="background:#87684e;color:#fdfaf3">${IC.drive}</span><div><b style="font-weight:500">Abrir link</b></div></a>` : ''}
        <b class="sm" style="display:block;margin-top:18px">Checklist</b>
        ${(t.checklist || []).map((c, i) => html`<label class="check"><input type="checkbox" data-act="chk" data-i="${i}" ${c.done ? raw('checked') : ''}> ${c.t}</label>`)}
        <div class="row" style="margin-top:6px"><input class="in" id="newchk" placeholder="Nuevo paso…"><button class="btn ghost" data-act="addchk">+</button></div>
        <b class="sm" style="display:block;margin-top:18px">Comentarios</b>
        ${(t.comments || []).map((c) => html`<div class="comment"><span class="av">${initials(c.who)}</span><p><span class="mut sm">${c.who} · ${fdate(c.at.slice(0, 10))}</span><br>${c.text}</p></div>`)}
        <div class="row" style="margin-top:6px"><input class="in" id="newcom" placeholder="Escribe un comentario…"><button class="btn ghost" data-act="addcom">Enviar</button></div>
        <div class="row" style="margin-top:20px;flex-wrap:wrap"><button class="btn" data-act="tsave">Guardar</button>${t.due ? html`<button class="btn ghost" data-act="tcal">${IC.cal} Agendar en Calendar</button>` : ''}<div class="sp"></div><button class="btn ghost" data-act="tdel">${ico('trash')}</button></div>`,
      {
        chk: async (cbx) => { t.checklist[+cbx.dataset.i].done = cbx.checked; const r = await saveTask(collect()); if (r) t = r; },
        addchk: async () => { const v = $('#newchk').value.trim(); if (!v) return; t = collect(); t.checklist = [...(t.checklist || []), { t: v, done: false }]; const r = await saveTask(t); if (r) { t = r; draw(); } },
        addcom: async () => { const v = $('#newcom').value.trim(); if (!v) return; t = collect(); t.comments = [...(t.comments || []), { who: me.name, at: new Date().toISOString(), text: v }]; const r = await saveTask(t); if (r) { t = r; draw(); } },
        tsave: async () => { const r = await saveTask(collect()); if (r) { toast('Guardado'); closeDrawer(); paint(); } },
        tcal: async () => { try { const e = await api('google/calendar', { method: 'POST', body: { summary: `${ico('check', 14)} ${t.title}`, date: t.due, description: `Tarea de ${pname(t.project_id)} · Inherent OS` } }); toast('Agendada en tu Google Calendar'); events = null; if (e.link) window.open(e.link, '_blank', 'noopener'); } catch (e) { toast(e.message, true); } },
        tdel: async () => { if (!(await confirmAsk(`¿Eliminar «${t.title}»?`))) return; await TK.remove(t.id); tasks = tasks.filter((x) => x.id !== t.id); closeDrawer(); paint(); },
      });
      $('#tvis').onchange = (e) => { $('#tviewers').hidden = e.target.value !== 'people'; };
      bindSop('t');
    };
    const collect = () => ({ ...t, ...readTipoSop('t'), visibility: $('#tvis').value, viewers: $('#tvis').value === 'people' ? $$('.tview:checked').map((x) => x.value) : [], title: $('#ttitle').value.trim() || t.title, status: $('#tstatus').value, assignee: $('#tassignee').value, due: $('#tdue').value, project_id: $('#tproject').value, description: $('#tdesc').value, link: $('#tlink').value.trim() });
    draw();
  }

  // El calendario compartido de la empresa: ahí caen las reuniones de los proyectos.
  async function calPick() {
    let r; try { r = await api('google/calendars'); } catch (e) { return toast(e.message, true); }
    const v = await ask('Calendario de Inherent', [{ k: 'id', l: 'Las reuniones de los proyectos se agendan aquí, con invitación a quienes van', t: 'select', opts: r.calendars.map((c) => [c.id, c.name + (c.primary ? ' (tu principal)' : '')]), v: r.current || r.calendars.find((c) => /inherent/i.test(c.name))?.id || '' }], 'Guardar');
    if (!v) return;
    try { await api('google/calendars', { method: 'PUT', body: { id: v.id, name: r.calendars.find((c) => c.id === v.id)?.name } }); toast('Listo Compártelo en Google Calendar con el equipo («hacer cambios en eventos») para que también puedan agendar.'); } catch (e) { toast(e.message, true); }
  }
  acts(el, {
    calpick: calPick,
    calscope: () => { setCalAll(!calAll()); events = null; const b = $('#obody', el); if (b) cal(b); },
    cvista: (t) => { calView = t.dataset.v === 'semana' ? 'semana' : 'mes'; lsSet('vista', calView); events = null; cal($('#obody', el)); },
    ctipo: (t) => { const k = t.dataset.t; calOff.has(k) ? calOff.delete(k) : calOff.add(k); lsSet('off', [...calOff].join(',')); cal($('#obody', el)); },
    go: () => {}, // un link: el navegador lo abre
    hito: (t) => openHito(t.dataset.d),
    tab: (t) => { tab = t.dataset.t; if (tab === 'cal') events = null; history.replaceState(null, '', '#/operations/' + tab); swap(el, paint); },
    newProject: async () => { const r = await wizProject({ team, me, projects, tasks }); if (r) { projects.push(r.project); tasks.push(...r.tasks); openP(r.project.id); } },
    mrefresh: () => { events = null; extra = null; cal($('#obody', el)); },
    mtoday: () => { calDate = today(); events = null; cal($('#obody', el)); },
    mprev: () => calMove(-1),
    mnext: () => calMove(1),
    newEvent: () => newEvent(),
    day: (t) => newEvent(t.dataset.date),
    ev: (t, e) => { e.stopPropagation(); openEvent(events[+t.dataset.i]); },
    dayall: (t) => { const d = t.dataset.date; drawer(html`<div class="row"><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div><h2>${fdate(d)}</h2><div style="margin-top:14px">${diaHtml(dayMap[d] || [])}</div>`, { ev: (x) => openEvent(events[+x.dataset.i]), task: (x) => openTask(tasks.find((y) => y.id === x.dataset.id)), hito: (x) => openHito(x.dataset.d) }); },
    task: (t) => openTask(tasks.find((x) => x.id === t.dataset.id)),
    newTask: () => addTask(kb?.project() ? { project_id: kb.project() } : {}),
  });
  // Se actualiza solo: cada minuto mientras está abierto y al volver a la pestaña del navegador.
  const tick = () => { if (!alive()) return stop(); if (tab === 'cal' && document.visibilityState === 'visible' && !document.querySelector('dialog[open]') && !$('#drawer')?.classList.contains('on')) { events = null; const b = $('#obody', el); if (b) cal(b); } };
  const iv = setInterval(tick, 60000); const onVis = () => document.visibilityState === 'visible' && tick();
  document.addEventListener('visibilitychange', onVis);
  function stop() { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); }
  paint();
}
