import { html, raw, mount, col, api, drawer, closeDrawer, ask, toast, acts, confirmAsk, fdate, today, $, $$, IC, initials , teamList } from '../core.js';

const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
const ST = { todo: ['Pendiente', ''], now: ['En curso', 'lime'], done: ['Entregado', 'green'], off: ['No aplica', ''] };
const NEXT = { todo: 'now', now: 'done', done: 'todo', off: 'todo' };
const TSTATUS = { 'Por empezar': '', 'En curso': 'amber', 'En revisión': 'blue', 'Hecha': 'green' };
const COLORS = ['olive', 'terra', 'ink'];
// El ciclo de contenido del manual (CLAUDE.md): días del mes
const CYCLE = [['Reunión día 1', 1, 1], ['Plan', 1, 3], ['Calendario y shot list', 2, 3], ['Brand guidelines', 3, 6], ['Producción', 6, 11], ['Montaje', 12, 15], ['Cambios y programación', 16, 19], ['Presentación al cliente', 20, 20]];
const PROJECT_PHASES = ['Descubrimiento', 'Estrategia', 'Build', 'Entrega'];
const GROWTH_PHASES = ['Diagnóstico', 'Auditoría con el especialista', 'Plan', 'Implementación', 'Revisión'];
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };

export async function render(el, { me, sub, alive }) {
  const PR = col('projects'), TK = col('tasks');
  let [projects, tasks, team] = await Promise.all([PR.list(), TK.list(), teamList()]);
  let clients = [];
  try { clients = (await api('repo/clients')).clients.map((c) => ({ ...c, plan: String(c.plan || '').replace(/^[⬜🔷🟨]\uFE0F?\s*/u, '') })); } catch {}
  let tab = ['pipe', 'cal', 'time', 'tasks'].includes(sub[0]) ? sub[0] : 'pipe';
  let current = projects[0]?.id || null, taskFilter = 'all';
  let calMonth = today().slice(0, 7), events = null, evErr = null;
  const person = (email) => team.find((t) => t.id === email || t.email === email);
  const pname = (id) => projects.find((p) => p.id === id)?.name || '—';
  const progress = (p) => { const ph = p.phases || []; return ph.length ? Math.round((ph.filter((x) => x.status === 'done').length / ph.length) * 100) : 0; };
  const curPhase = (p) => (p.phases || []).find((x) => x.status !== 'done')?.name || 'Terminado';

  async function saveProject(p) { try { const r = await PR.save(p); projects = projects.map((x) => (x.id === r.id ? r : x)); return r; } catch (e) { toast(e.message, true); return null; } }
  async function saveTask(t) { try { const r = await TK.save(t); tasks = tasks.map((x) => (x.id === r.id ? r : x)); return r; } catch (e) { toast(e.message, true); return null; } }

  function paint() {
    mount(el, html`
      <div class="hello"><h1>Operations</h1><p>Proyectos por fase, <em>tiempos</em> y tareas.</p></div>
      <div class="row" style="margin-bottom:14px"><div class="sp"></div><button class="btn" data-act="newProject">+ Proyecto</button></div>
      ${projects.length ? html`<div class="grid g3">${projects.map((p, i) => { const pct = progress(p); const open = tasks.filter((t) => t.project_id === p.id && t.status !== 'Hecha').length;
        return html`<div class="card feat ${p.color || COLORS[i % 3]}" style="min-height:230px;cursor:pointer" data-act="pick" data-id="${p.id}">
          <div class="chead"><div class="ico">${IC.ring(Math.max(4, Math.round(pct * 1.17)))}<span style="font-size:15px">◎</span></div><h3>${p.name}<br><span class="lbl">${p.kind}${p.client ? ' · ' + p.client : ''}</span></h3>${p.client_slug ? html`<a class="arrow" href="#/clients/${p.client_slug}" title="Página del cliente" style="margin-right:6px">↗</a>` : ''}<button class="arrow" data-act="editProject" data-id="${p.id}" title="Editar">✎</button></div>
          <div class="lbl">Avance</div><div class="big" style="font-size:46px">${pct}<small>%</small></div>
          <div class="phases">${(p.phases || []).map((x) => html`<i title="${x.name}" style="background:${x.status === 'done' ? 'rgba(255,255,255,.95)' : x.status === 'now' ? 'var(--lime)' : 'rgba(255,255,255,.25)'}"></i>`)}</div>
          <div class="foot"><span>Fase: ${curPhase(p)}</span><span>${open} tareas abiertas</span></div></div>`; })}</div>`
      : html`<div class="empty"><b>Todavía no hay proyectos</b>Crea uno con «+ Proyecto». Si es un cliente del repo, su pipeline sale de su plan contratado.</div>`}
      <div class="row" style="margin:26px 0 16px;flex-wrap:wrap">
        <div class="tabs" style="margin:0">${[['pipe', 'Pipeline'], ['cal', 'Calendario'], ['time', 'Timeline'], ['tasks', 'Tareas']].map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>
        <div class="sp"></div>${tab === 'tasks' ? html`<button class="btn" data-act="newTask">+ Tarea</button>` : ''}
      </div>
      <div id="obody"></div>`);
    ({ pipe, cal, time, tasks: taskTab })[tab]($('#obody', el));
  }

  // ---------- Pipeline por cliente, con sus entregables ----------
  function pipe(b) {
    const p = projects.find((x) => x.id === current);
    if (!p) return mount(b, html`<div class="empty"><b>Elige o crea un proyecto</b>El pipeline muestra cada departamento y su entregable.</div>`);
    mount(b, html`<div class="row" style="margin-bottom:12px;gap:8px;flex-wrap:wrap">${projects.map((x) => html`<button class="chip ${x.id === current ? 'dark' : ''}" data-act="pick" data-id="${x.id}" style="padding:8px 14px;font-size:13px">${x.name}</button>`)}
      <div class="sp"></div><span class="mut sm">Toca el estado para avanzarlo · lo que no está en el plan no corre</span></div>
      <div class="pipe">${DEPTS.map(([n, name], i) => { const d = p.pipeline?.[n] || { status: 'todo' }; const [lbl, cls] = ST[d.status] || ST.todo;
        return html`<div class="dept ${d.status === 'done' ? 'done' : d.status === 'now' ? 'now' : d.status === 'off' ? 'off' : ''}">
          <div class="row"><span class="num">${n}</span><button class="chip ${cls}" style="margin-left:auto" data-act="cycle" data-d="${n}">${lbl}</button></div>
          <h4>${name}</h4>
          ${d.artifact?.url ? html`<a class="artifact" href="${/^https?:\/\//.test(d.artifact.url) ? d.artifact.url : '#'}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit"><span class="fi" style="background:#4f7790;color:#fff">${IC.drive}</span><div><b style="font-weight:500">${d.artifact.name || 'Entregable'}</b><div class="mut" style="font-size:11px">Abrir</div></div></a>
            <button class="sm mut" data-act="artifact" data-d="${n}" style="margin-top:6px">Cambiar</button>`
          : d.status === 'off' ? html`<div class="mut sm" style="margin-top:12px">No incluido</div>` : html`<button class="artifact" data-act="artifact" data-d="${n}" style="width:100%"><span class="fi">+</span><div><b style="font-weight:500">Agregar entregable</b><div class="mut" style="font-size:11px">Link de Drive o URL</div></div></button>`}
          ${i < DEPTS.length - 1 ? html`<span class="pipe-line"></span>` : ''}</div>`; })}</div>
      <div class="row" style="margin:22px 0 10px"><h3 style="font-weight:500;font-size:20px;letter-spacing:-.4px">Tareas de ${p.name}</h3><div class="sp"></div><button class="btn ghost" data-act="newTask">+ Tarea</button></div>
      ${taskTable(tasks.filter((t) => t.project_id === p.id), 'Este proyecto todavía no tiene tareas. Agrégalas con «+ Tarea»: cada una se abre, tiene responsable, fecha y checklist.')}`);
  }

  // ---------- Calendario (Google Calendar + tareas + fases) ----------
  async function loadEvents() {
    const [y, m] = calMonth.split('-').map(Number);
    const from = iso(new Date(Date.UTC(y, m - 1, 0))), to = iso(new Date(Date.UTC(y, m, 1)));
    try { const r = await api(`google/calendar?from=${from}&to=${to}`); events = r.events; calInfo = { allCals: r.allCals !== false, calendars: r.calendars || [] }; evErr = null; } catch (e) { events = []; evErr = e.message; }
  }
  const evChip = (it) => html`<div class="ev ${it.c}" ${it.task ? raw(`data-act="task" data-id="${it.task}"`) : it.ev != null ? raw(`data-act="ev" data-i="${it.ev}"`) : ''} ${it.color ? raw(`style="background:${it.color}33;border-left:3px solid ${it.color}"`) : ''}>${it.t}</div>`;
  let calInfo = { allCals: true, calendars: [] }, dayMap = {};
  function openEvent(e) {
    const when = e.allDay ? fdate(String(e.start).slice(0, 10)) + (String(e.end).slice(0, 10) > addDays(String(e.start).slice(0, 10), 1) ? ' – ' + fdate(addDays(String(e.end).slice(0, 10), -1)) : ' · todo el día')
      : `${fdate(String(e.start).slice(0, 10))} · ${String(e.start).slice(11, 16)} – ${String(e.end).slice(11, 16)}`;
    drawer(html`<div class="row"><span class="gbadge">${IC.cal} ${e.calName || 'Google Calendar'}</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
      <h2>${e.summary}</h2><div class="mut">${when}</div>
      ${e.location ? html`<div style="margin-top:12px">📍 ${e.location}</div>` : ''}
      ${e.description ? html`<p class="sm" style="margin-top:12px;white-space:pre-wrap">${e.description}</p>` : ''}
      <div class="row" style="margin-top:20px;gap:8px">${e.meet && /^https:\/\//.test(e.meet) ? html`<a class="btn" href="${e.meet}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">Entrar a Meet</a>` : ''}
        ${/^https:\/\//.test(e.link || '') ? html`<a class="btn ghost" href="${e.link}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">Abrir en Google ↗</a>` : ''}
        <div class="sp"></div>${e.editable ? html`<button class="btn ghost" data-act="evdel">🗑</button>` : ''}</div>`,
    { evdel: async () => { if (!(await confirmAsk(`¿Borrar «${e.summary}» de tu Google Calendar?`))) return; try { await api(`google/calendar/${encodeURIComponent(e.id)}`, { method: 'DELETE' }); closeDrawer(); toast('Evento borrado'); events = null; cal($('#obody', el)); } catch (err) { toast(err.message, true); } } });
  }
  async function newEvent(date) {
    const v = await ask('Nuevo evento en Google Calendar', [{ k: 'summary', l: 'Título', req: true }, { k: 'date', l: 'Fecha', t: 'date', v: date || today(), req: true, half: true }, { k: 'time', l: 'Hora (vacío = todo el día)', t: 'time', half: true }, { k: 'minutes', l: 'Duración (min)', t: 'number', v: 60, half: true }, { k: 'description', l: 'Notas', half: true }]);
    if (!v) return; try { await api('google/calendar', { method: 'POST', body: v }); toast('Evento creado en tu Google Calendar ✅'); events = null; cal($('#obody', el)); } catch (e) { toast(e.message, true); }
  }
  function cal(b) {
    if (events === null) { if (!b.querySelector('.cal')) mount(b, html`<p class="loading">Cargando tu Google Calendar…</p>`); loadEvents().then(() => tab === 'cal' && alive() && b.isConnected && cal(b)); return; }
    const [y, m] = calMonth.split('-').map(Number);
    const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate(), lead = (first.getDay() + 6) % 7;
    const byDay = {};
    const add = (date, item) => { if (date && date.slice(0, 7) === calMonth) (byDay[+date.slice(8, 10)] ||= []).push(item); };
    // Los eventos de varios días aparecen en cada día; cada calendario con su color de Google.
    events.forEach((e, i) => { const s0 = String(e.start).slice(0, 10), e0 = e.allDay ? addDays(String(e.end).slice(0, 10), -1) : String(e.end || e.start).slice(0, 10);
      for (let d = s0, n = 0; d <= e0 && n < 40; d = addDays(d, 1), n++) add(d, { t: (e.allDay || d !== s0 ? '' : String(e.start).slice(11, 16) + ' ') + e.summary, c: 'e1', ev: i, color: /^#[0-9a-f]{6}$/i.test(e.color || '') ? e.color : null }); });
    tasks.filter((t) => t.due && t.status !== 'Hecha').forEach((t) => add(t.due, { t: '✓ ' + t.title, c: 'e3', task: t.id }));
    projects.forEach((p) => (p.phases || []).forEach((ph) => ph.start && add(ph.start, { t: `${ph.name} · ${p.name}`, c: 'e2' })));
    dayMap = byDay;
    const cells = [];
    for (let i = 0; i < 42; i++) { const d = i - lead + 1; if (i >= 35 && d > days) break; cells.push(d); }
    mount(b, html`<div class="card">
      <div class="chead"><div class="ico">▦</div><h3>${first.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })}</h3>
        ${evErr ? html`<span class="chip amber" style="margin-left:12px">Google Calendar: ${evErr}</span>` : html`<span class="gbadge" style="margin-left:12px">${IC.cal} ${calInfo.allCals ? `${calInfo.calendars.length} calendario${calInfo.calendars.length === 1 ? '' : 's'} de Google` : 'Solo tu calendario principal · sal y vuelve a entrar para ver todos'}</span>`}
        <div class="sp"></div><button class="btn ghost" data-act="mrefresh" title="Actualizar" style="padding:8px 14px">↻</button><button class="btn ghost" data-act="mtoday" style="padding:8px 14px">Hoy</button><button class="btn ghost" data-act="mprev" style="padding:8px 14px">‹</button><button class="btn ghost" data-act="mnext" style="padding:8px 14px">›</button><button class="btn" data-act="newEvent" style="padding:9px 16px">+ Evento</button></div>
      <div class="cal">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => html`<div class="dh">${d}</div>`)}
        ${cells.map((d) => { const out = d < 1 || d > days; const isToday = !out && `${calMonth}-${String(d).padStart(2, '0')}` === today();
          return html`<div class="d ${out ? 'o' : ''} ${isToday ? 'today' : ''}" ${out ? '' : raw(`data-act="day" data-d="${d}" title="Toca para crear un evento"`)}><span class="n">${out ? '' : d}</span>${out ? '' : (byDay[d] || []).slice(0, 4).map(evChip)}${!out && (byDay[d] || []).length > 4 ? html`<button class="mut sm" data-act="dayall" data-d="${d}">+${byDay[d].length - 4} más</button>` : ''}</div>`; })}
      </div>
      <div class="row sm mut" style="gap:16px;margin-top:12px"><span class="row" style="gap:6px"><i class="ev e1" style="width:12px;height:12px;padding:0;margin:0"></i>Google Calendar</span><span class="row" style="gap:6px"><i class="ev e3" style="width:12px;height:12px;padding:0;margin:0"></i>Tareas</span><span class="row" style="gap:6px"><i class="ev e2" style="width:12px;height:12px;padding:0;margin:0"></i>Fases de proyecto</span></div></div>`);
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

  // ---------- Tareas ----------
  function taskTab(b) {
    const list = tasks.filter((t) => taskFilter === 'all' || (taskFilter === 'mine' ? t.assignee === me.email : t.project_id === taskFilter))
      .sort((a, z) => (a.status === 'Hecha') - (z.status === 'Hecha') || String(a.due || '9').localeCompare(String(z.due || '9')));
    mount(b, html`<div class="row" style="margin-bottom:12px;gap:8px;flex-wrap:wrap">
        <button class="chip ${taskFilter === 'all' ? 'dark' : ''}" data-act="tf" data-f="all" style="padding:8px 14px">Todas</button>
        <button class="chip ${taskFilter === 'mine' ? 'dark' : ''}" data-act="tf" data-f="mine" style="padding:8px 14px">Mías</button>
        ${projects.map((p) => html`<button class="chip ${taskFilter === p.id ? 'dark' : ''}" data-act="tf" data-f="${p.id}" style="padding:8px 14px">${p.name}</button>`)}</div>
      ${taskTable(list, 'Crea una con «+ Tarea».')}`);
  }
  function taskTable(list, emptyMsg) {
    list = [...list].sort((a, z) => (a.status === 'Hecha') - (z.status === 'Hecha') || String(a.due || '9').localeCompare(String(z.due || '9')));
    return list.length ? html`<div class="card"><table><thead><tr><th>Tarea</th><th>Proyecto</th><th>Responsable</th><th>Vence</th><th>Estado</th></tr></thead><tbody>
        ${list.map((t) => { const who = person(t.assignee); const late = t.due && t.due < today() && t.status !== 'Hecha';
          return html`<tr class="click" data-act="task" data-id="${t.id}"><td><b style="font-weight:500">${t.title}</b>${(t.checklist || []).length ? html`<div class="mut sm">${t.checklist.filter((c) => c.done).length}/${t.checklist.length} checklist</div>` : ''}</td><td class="mut">${pname(t.project_id)}${t.dept ? ' · ' + t.dept : ''}</td>
            <td>${who ? html`<span class="av" style="background:${who.color || '#6b5a45'}" title="${who.name}">${initials(who.name)}</span>` : html`<span class="mut sm">—</span>`}</td>
            <td style="${late ? 'color:#a3392a;font-weight:700' : ''}">${t.due ? fdate(t.due) : '—'}</td><td><span class="chip ${TSTATUS[t.status] ?? ''}">${t.status || 'Por empezar'}</span></td></tr>`; })}
      </tbody></table></div>` : html`<div class="empty"><b>Sin tareas aquí</b>${emptyMsg}</div>`;
  }

  function openTask(t) {
    const draw = () => {
      const who = person(t.assignee);
      drawer(html`<div class="row"><select class="in" id="tstatus" style="width:auto">${Object.keys(TSTATUS).map((s) => html`<option ${s === (t.status || 'Por empezar') ? raw('selected') : ''}>${s}</option>`)}</select><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
        <input class="in" id="ttitle" value="${t.title}" style="font-size:24px;font-weight:500;letter-spacing:-.6px;margin-top:16px;border:0;padding:6px 0;background:transparent">
        <div class="mut">${pname(t.project_id)}</div>
        <div class="form" style="margin-top:16px">
          <div class="two"><div><label class="f">Responsable</label><select class="in" id="tassignee"><option value="">—</option>${team.filter((p) => p.active !== false).map((p) => html`<option value="${p.email || p.id}" ${(p.email || p.id) === t.assignee ? raw('selected') : ''}>${p.name}</option>`)}</select></div>
            <div><label class="f">Vence</label><input class="in" id="tdue" type="date" value="${t.due || ''}"></div></div>
          <div><label class="f">Proyecto</label><select class="in" id="tproject"><option value="">—</option>${projects.map((p) => html`<option value="${p.id}" ${p.id === t.project_id ? raw('selected') : ''}>${p.name}</option>`)}</select></div>
          <div><label class="f">Descripción</label><textarea class="in" id="tdesc">${t.description || ''}</textarea></div>
          <div><label class="f">Link (Drive, doc, carpeta)</label><input class="in" id="tlink" value="${t.link || ''}" placeholder="https://drive.google.com/…"></div>
        </div>
        ${t.link && /^https?:\/\//.test(t.link) ? html`<a class="artifact" href="${t.link}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin-top:10px"><span class="fi" style="background:#4f7790;color:#fff">${IC.drive}</span><div><b style="font-weight:500">Abrir link</b></div></a>` : ''}
        <b class="sm" style="display:block;margin-top:18px">Checklist</b>
        ${(t.checklist || []).map((c, i) => html`<label class="check"><input type="checkbox" data-act="chk" data-i="${i}" ${c.done ? raw('checked') : ''}> ${c.t}</label>`)}
        <div class="row" style="margin-top:6px"><input class="in" id="newchk" placeholder="Nuevo paso…"><button class="btn ghost" data-act="addchk">+</button></div>
        <b class="sm" style="display:block;margin-top:18px">Comentarios</b>
        ${(t.comments || []).map((c) => html`<div class="comment"><span class="av">${initials(c.who)}</span><p><span class="mut sm">${c.who} · ${fdate(c.at.slice(0, 10))}</span><br>${c.text}</p></div>`)}
        <div class="row" style="margin-top:6px"><input class="in" id="newcom" placeholder="Escribe un comentario…"><button class="btn ghost" data-act="addcom">Enviar</button></div>
        <div class="row" style="margin-top:20px;flex-wrap:wrap"><button class="btn" data-act="tsave">Guardar</button>${t.due ? html`<button class="btn ghost" data-act="tcal">${IC.cal} Agendar en Calendar</button>` : ''}<div class="sp"></div><button class="btn ghost" data-act="tdel">🗑</button></div>`,
      {
        chk: async (cbx) => { t.checklist[+cbx.dataset.i].done = cbx.checked; const r = await saveTask(collect()); if (r) t = r; },
        addchk: async () => { const v = $('#newchk').value.trim(); if (!v) return; t = collect(); t.checklist = [...(t.checklist || []), { t: v, done: false }]; const r = await saveTask(t); if (r) { t = r; draw(); } },
        addcom: async () => { const v = $('#newcom').value.trim(); if (!v) return; t = collect(); t.comments = [...(t.comments || []), { who: me.name, at: new Date().toISOString(), text: v }]; const r = await saveTask(t); if (r) { t = r; draw(); } },
        tsave: async () => { const r = await saveTask(collect()); if (r) { toast('Guardado ✅'); closeDrawer(); paint(); } },
        tcal: async () => { try { const e = await api('google/calendar', { method: 'POST', body: { summary: `✓ ${t.title}`, date: t.due, description: `Tarea de ${pname(t.project_id)} · Inherent OS` } }); toast('Agendada en tu Google Calendar ✅'); events = null; if (e.link) window.open(e.link, '_blank', 'noopener'); } catch (e) { toast(e.message, true); } },
        tdel: async () => { if (!(await confirmAsk(`¿Eliminar «${t.title}»?`))) return; await TK.remove(t.id); tasks = tasks.filter((x) => x.id !== t.id); closeDrawer(); paint(); },
      });
    };
    const collect = () => ({ ...t, title: $('#ttitle').value.trim() || t.title, status: $('#tstatus').value, assignee: $('#tassignee').value, due: $('#tdue').value, project_id: $('#tproject').value, description: $('#tdesc').value, link: $('#tlink').value.trim() });
    draw();
  }

  async function projectForm(p) {
    const clientOpts = [['', '— Sin cliente / interno'], ...clients.filter((c) => c.hasPlan).map((c) => [c.slug, c.slug.toUpperCase() + ' (del repo)'])];
    const v = await ask(p ? 'Editar proyecto' : 'Nuevo proyecto', [
      { k: 'name', l: 'Nombre', v: p?.name, req: true },
      ...(p ? [] : [{ k: 'kind', l: 'Tipo', t: 'select', opts: [['Ciclo mensual', 'Contenido · ciclo mensual (días 1 al 20)'], ['Proyecto', 'Contenido · proyecto por fases'], ['Growth', 'Business Growth · consultoría']], half: true }, { k: 'start', l: 'Inicio', t: 'date', v: today().slice(0, 8) + '01', half: true }]),
      { k: 'client', l: 'Cliente', t: 'select', opts: clientOpts, v: p?.client_slug || '' },
      { k: 'color', l: 'Color', t: 'select', opts: [['olive', 'Oliva'], ['terra', 'Terracota'], ['ink', 'Café']], v: p?.color || 'olive' },
    ]);
    if (!v) return;
    const c = clients.find((x) => x.slug === v.client);
    if (p) { const r = await saveProject({ ...p, name: v.name, client: c ? c.slug.toUpperCase() : '', client_slug: v.client, color: v.color }); if (r) paint(); return; }
    const start = v.start || today();
    const phases = v.kind === 'Ciclo mensual'
      ? CYCLE.map(([name, a, z], i) => ({ name, start: addDays(start, a - 1), end: addDays(start, z - 1), status: i === 0 ? 'now' : 'todo' }))
      : (v.kind === 'Growth' ? GROWTH_PHASES : PROJECT_PHASES).map((name, i) => ({ name, start: addDays(start, i * 7), end: addDays(start, i * 7 + 6), status: i === 0 ? 'now' : 'todo' }));
    // El pipeline sale del plan contratado: lo que no está en su plan, no corre.
    const inPlan = c?.pipeline?.length ? new Set(c.pipeline.map((r) => (r.paso.match(/^[①-⑩][A-Z]?/) || [''])[0])) : null;
    const pipeline = Object.fromEntries(DEPTS.map(([n]) => [n, { status: inPlan && !inPlan.has(n) ? 'off' : 'todo' }]));
    try { const r = await PR.create({ name: v.name, kind: v.kind, line: v.kind === 'Growth' ? 'growth' : 'contenido', client: c ? c.slug.toUpperCase() : '', client_slug: v.client, color: v.color, phases, pipeline }); projects.push(r); current = r.id; toast('Proyecto creado ✅'); paint(); }
    catch (e) { toast(e.message, true); }
  }

  acts(el, {
    tab: (t) => { tab = t.dataset.t; if (tab === 'cal') events = null; history.replaceState(null, '', '#/operations/' + tab); paint(); },
    pick: (t, e) => { if (e.target.closest('[data-act=editProject]') || e.target.closest('a')) return; current = t.dataset.id; tab = 'pipe'; paint(); },
    newProject: () => projectForm(null),
    editProject: (t, e) => { e.stopPropagation(); const p = projects.find((x) => x.id === t.dataset.id);
      drawer(html`<div class="row"><span class="chip">${p.kind}</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div><h2>${p.name}</h2><div class="mut">${p.client || 'Interno'}</div>
        <b class="sm" style="display:block;margin-top:18px">Fases</b>
        ${(p.phases || []).map((x, i) => html`<div class="row" style="margin:8px 0"><select class="in" style="width:auto" data-ph="${i}" data-f="status">${[['todo', 'Pendiente'], ['now', 'En curso'], ['done', 'Hecha']].map(([v, l]) => html`<option value="${v}" ${v === x.status ? raw('selected') : ''}>${l}</option>`)}</select><b style="font-weight:500;flex:1">${x.name}</b><input class="in" type="date" style="max-width:150px" data-ph="${i}" data-f="start" value="${x.start || ''}"><input class="in" type="date" style="max-width:150px" data-ph="${i}" data-f="end" value="${x.end || ''}"></div>`)}
        <div class="row" style="margin-top:16px"><button class="btn" data-act="savePh">Guardar fases</button><button class="btn ghost" data-act="edMeta">Nombre y cliente</button><div class="sp"></div><button class="btn ghost" data-act="delP">🗑</button></div>`,
      { savePh: async () => { const ph = JSON.parse(JSON.stringify(p.phases || [])); $$('[data-ph]', $('#drawer')).forEach((inp) => { ph[+inp.dataset.ph][inp.dataset.f] = inp.value; }); const r = await saveProject({ ...p, phases: ph }); if (r) { toast('Fases guardadas ✅'); closeDrawer(); paint(); } },
        edMeta: () => { closeDrawer(); projectForm(p); },
        delP: async () => { if (!(await confirmAsk(`¿Eliminar el proyecto ${p.name}? Sus tareas quedan sin proyecto.`))) return; await PR.remove(p.id); projects = projects.filter((x) => x.id !== p.id); current = projects[0]?.id || null; closeDrawer(); paint(); } }); },
    cycle: async (t) => { const p = projects.find((x) => x.id === current); const d = p.pipeline?.[t.dataset.d] || { status: 'todo' }; const r = await saveProject({ ...p, pipeline: { ...(p.pipeline || {}), [t.dataset.d]: { ...d, status: NEXT[d.status] || 'now' } } }); if (r) pipe($('#obody', el)); },
    artifact: async (t) => { const p = projects.find((x) => x.id === current); const d = p.pipeline?.[t.dataset.d] || { status: 'todo' };
      const v = await ask(`Entregable de ${DEPTS.find(([n]) => n === t.dataset.d)[1]}`, [{ k: 'name', l: 'Nombre', v: d.artifact?.name, req: true }, { k: 'url', l: 'Link (Drive o URL)', v: d.artifact?.url, req: true }]);
      if (!v) return; if (!/^https?:\/\//.test(v.url)) return toast('El link debe empezar con https://', true);
      const r = await saveProject({ ...p, pipeline: { ...(p.pipeline || {}), [t.dataset.d]: { ...d, artifact: v } } }); if (r) pipe($('#obody', el)); },
    mrefresh: () => { events = null; cal($('#obody', el)); },
    mtoday: () => { calMonth = today().slice(0, 7); events = null; cal($('#obody', el)); },
    mprev: () => { const d = new Date(calMonth + '-15'); d.setMonth(d.getMonth() - 1); calMonth = d.toISOString().slice(0, 7); events = null; cal($('#obody', el)); },
    mnext: () => { const d = new Date(calMonth + '-15'); d.setMonth(d.getMonth() + 1); calMonth = d.toISOString().slice(0, 7); events = null; cal($('#obody', el)); },
    newEvent: () => newEvent(),
    day: (t) => newEvent(`${calMonth}-${String(t.dataset.d).padStart(2, '0')}`),
    ev: (t, e) => { e.stopPropagation(); openEvent(events[+t.dataset.i]); },
    dayall: (t) => { const d = +t.dataset.d; drawer(html`<div class="row"><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div><h2>${fdate(`${calMonth}-${String(d).padStart(2, '0')}`)}</h2><div style="margin-top:14px">${(dayMap[d] || []).map(evChip)}</div>`, { ev: (x) => openEvent(events[+x.dataset.i]), task: (x) => openTask(tasks.find((y) => y.id === x.dataset.id)) }); },
    tf: (t) => { taskFilter = t.dataset.f; taskTab($('#obody', el)); },
    task: (t) => openTask(tasks.find((x) => x.id === t.dataset.id)),
    newTask: async () => { const v = await ask('Nueva tarea', [{ k: 'title', l: 'Tarea', req: true }, { k: 'project_id', l: 'Proyecto', t: 'select', opts: [['', '—'], ...projects.map((p) => [p.id, p.name])], v: current || '' }, { k: 'dept', l: 'Departamento', t: 'select', opts: [['', '—'], ...DEPTS.map(([n, name]) => [`${n} ${name}`, `${n} ${name}`])] }, { k: 'assignee', l: 'Responsable', t: 'select', opts: [['', '—'], ...team.filter((p) => p.active !== false).map((p) => [p.email || p.id, p.name])], v: me.email, half: true }, { k: 'due', l: 'Vence', t: 'date', half: true }]);
      if (!v) return; try { const r = await TK.create({ ...v, status: 'Por empezar', checklist: [], comments: [] }); tasks.push(r); toast('Tarea creada ✅'); paint(); } catch (e) { toast(e.message, true); } },
  });
  // Se actualiza solo: cada minuto mientras está abierto y al volver a la pestaña del navegador.
  const tick = () => { if (!alive()) return stop(); if (tab === 'cal' && document.visibilityState === 'visible' && !document.querySelector('dialog[open]') && !$('#drawer')?.classList.contains('on')) { events = null; const b = $('#obody', el); if (b) cal(b); } };
  const iv = setInterval(tick, 60000); const onVis = () => document.visibilityState === 'visible' && tick();
  document.addEventListener('visibilitychange', onVis);
  function stop() { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); }
  paint();
}
