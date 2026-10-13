import { html, raw, mount, col, api, ask, toast, acts, confirmAsk, fdate, today, IC, ico } from '../core.js';

// Roadmap: los pasos grandes (megaproyectos). Cada uno agrupa proyectos y cada proyecto tiene tareas con fecha y hora,
// que se pueden mandar al calendario de quien lo usa. Todo vive en un solo documento por megaproyecto.
const STATUS = { Activo: 'lime', Pausado: 'amber', Hecho: 'green' };
const uid = () => Math.random().toString(36).slice(2, 10);
const hhmm = (t) => (/^\d{2}:\d{2}$/.test(t || '') ? t : '');
const stamp = (t) => `${t.date || ''}T${hhmm(t.time) || '99:99'}`; // para ordenar: primero fecha, luego hora

export async function render(el, { me, alive }) {
  const R = col('roadmap');
  let [megas, projects] = await Promise.all([R.list(), col('projects').list().catch(() => [])]);
  let closed = new Set(); // megaproyectos plegados

  const tasksOf = (m) => (m.projects || []).flatMap((p) => p.tasks || []);
  const progress = (m) => { const all = tasksOf(m); return { done: all.filter((t) => t.done).length, total: all.length }; };
  const find = (mid, pid, tid) => { const m = megas.find((x) => x.id === mid), p = m?.projects?.find((x) => x.id === pid), t = p?.tasks?.find((x) => x.id === tid); return { m, p, t }; };
  async function save(m) {
    try { const r = await R.save(m); megas = megas.map((x) => (x.id === r.id ? r : x)); return r; } catch (e) { toast(e.message, true); return null; }
  }

  // ---------- vista ----------
  const taskRow = (m, p, t) => {
    const late = !t.done && t.date && t.date < today();
    return html`<div class="rmtask ${t.done ? 'done' : ''}" style="display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--line);flex-wrap:wrap">
      <input type="checkbox" ${t.done ? raw('checked') : ''} data-act="doneTask" data-m="${m.id}" data-p="${p.id}" data-t="${t.id}" aria-label="Hecha">
      <div style="flex:1;min-width:180px"><div style="${t.done ? 'text-decoration:line-through;opacity:.55' : ''}">${t.title}</div>
        <div class="sm ${late ? '' : 'mut'}" style="${late ? 'color:#b3402f' : ''}">${t.date ? html`${ico('cal', 14)} ${fdate(t.date)}${hhmm(t.time) ? ' · ' + t.time : ''}${t.minutes ? ' · ' + t.minutes + ' min' : ''}${late ? ' · atrasada' : ''}` : 'Sin fecha'}</div></div>
      <div class="row" style="gap:6px">
        ${t.event_link ? html`<a class="btn ghost xs" href="${t.event_link}" target="_blank" rel="noopener noreferrer">${IC.cal} ${ico('check', 14)} En tu calendario</a>`
          : html`<button class="btn xs" data-act="cal" data-m="${m.id}" data-p="${p.id}" data-t="${t.id}" ${t.date ? '' : raw('disabled title="Ponle fecha primero"')}>${IC.cal} Agregar a mi calendario</button>`}
        <button class="btn ghost xs" data-act="editTask" data-m="${m.id}" data-p="${p.id}" data-t="${t.id}">Editar</button>
        <button class="btn ghost xs" data-act="delTask" data-m="${m.id}" data-p="${p.id}" data-t="${t.id}" aria-label="Quitar">${ico('trash', 15)}</button>
      </div></div>`;
  };
  const projectBlock = (m, p) => {
    const ts = [...(p.tasks || [])].sort((a, z) => stamp(a).localeCompare(stamp(z)));
    const lk = projects.find((x) => x.id === p.project_id);
    return html`<div style="margin-top:16px">
      <div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:500">${p.name}</b>${lk ? html`<a class="chip" href="#/operations" style="font-size:11px;text-decoration:none">${ico('link', 13)} ${lk.name}</a>` : ''}<div class="sp"></div>
        <button class="btn ghost xs" data-act="addTask" data-m="${m.id}" data-p="${p.id}">+ Tarea</button>
        <button class="btn ghost xs" data-act="editProject" data-m="${m.id}" data-p="${p.id}">Editar</button>
        <button class="btn ghost xs" data-act="delProject" data-m="${m.id}" data-p="${p.id}" aria-label="Quitar proyecto">${ico('trash', 15)}</button></div>
      ${ts.length ? ts.map((t) => taskRow(m, p, t)) : html`<div class="mut sm" style="padding:8px 0">Sin tareas todavía.</div>`}</div>`;
  };
  const megaCard = (m) => {
    const { done, total } = progress(m), pct = total ? Math.round((done / total) * 100) : 0, shut = closed.has(m.id);
    return html`<div class="card" style="margin-bottom:16px">
      <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-start">
        <div style="flex:1;min-width:220px;cursor:pointer" data-act="toggle" data-m="${m.id}"><div class="row" style="gap:8px;flex-wrap:wrap"><span class="mut">${ico(shut ? 'right' : 'down', 16)}</span><h3 style="font-size:20px;font-weight:500;letter-spacing:-.4px;margin:0">${m.name}</h3><span class="chip ${STATUS[m.status] || ''}">${m.status || 'Activo'}</span></div>
          ${m.why ? html`<div class="mut sm" style="margin-top:4px">${m.why}</div>` : ''}
          <div class="mut sm" style="margin-top:4px">${m.start || m.end ? `${m.start ? fdate(m.start) : '…'} → ${m.end ? fdate(m.end) : '…'} · ` : ''}${(m.projects || []).length} proyecto${(m.projects || []).length === 1 ? '' : 's'} · ${done}/${total} tareas</div></div>
        <div class="row" style="gap:6px"><button class="btn xs" data-act="addProject" data-m="${m.id}">+ Proyecto</button><button class="btn ghost xs" data-act="editMega" data-m="${m.id}">Editar</button><button class="btn ghost xs" data-act="delMega" data-m="${m.id}" aria-label="Quitar megaproyecto">${ico('trash', 15)}</button></div></div>
      <div style="height:6px;border-radius:6px;background:var(--line);margin-top:12px;overflow:hidden"><div style="height:100%;width:${pct}%;background:#87684e"></div></div>
      ${shut ? '' : ((m.projects || []).length ? (m.projects || []).map((p) => projectBlock(m, p)) : html`<div class="mut sm" style="margin-top:14px">Agrega los proyectos que forman este paso con «+ Proyecto».</div>`)}</div>`;
  };
  function paint() {
    const order = { Activo: 0, Pausado: 1, Hecho: 2 };
    const list = [...megas].sort((a, z) => (order[a.status || 'Activo'] ?? 0) - (order[z.status || 'Activo'] ?? 0) || String(a.start || '9999').localeCompare(String(z.start || '9999')));
    mount(el, html`<div class="hello"><h1>Roadmap</h1><p>Los pasos grandes, con sus proyectos y <em>tareas con fecha y hora</em>.</p></div>
      <div class="row" style="margin-bottom:18px"><div class="sp"></div><button class="btn" data-act="newMega">+ Megaproyecto</button></div>
      ${list.length ? list.map(megaCard) : html`<div class="empty"><b>Todavía no hay megaproyectos</b>Crea el primero con «+ Megaproyecto». Dentro van sus proyectos y las tareas con fecha y hora.</div>`}`);
  }

  // ---------- formularios ----------
  const megaForm = (m) => ask(m ? 'Editar megaproyecto' : 'Nuevo megaproyecto', [
    { k: 'name', l: 'Nombre', v: m?.name, req: true },
    { k: 'why', l: 'Para qué es (el resultado grande)', t: 'textarea', v: m?.why },
    { k: 'start', l: 'Empieza', t: 'date', v: m?.start, half: true }, { k: 'end', l: 'Termina', t: 'date', v: m?.end, half: true },
    { k: 'status', l: 'Estado', t: 'select', opts: Object.keys(STATUS), v: m?.status || 'Activo' },
  ], m ? 'Guardar' : 'Crear');
  const projectForm = (p) => ask(p ? 'Editar proyecto' : 'Nuevo proyecto', [
    { k: 'name', l: 'Nombre', v: p?.name, req: true },
    { k: 'project_id', l: 'Enlazar con un proyecto de Operations (opcional)', t: 'select', opts: [['', '— Ninguno —'], ...projects.map((x) => [x.id, x.name])], v: p?.project_id || '' },
  ], p ? 'Guardar' : 'Agregar');
  const taskForm = (t) => ask(t ? 'Editar tarea' : 'Nueva tarea', [
    { k: 'title', l: 'Qué hay que hacer', v: t?.title, req: true },
    { k: 'date', l: 'Fecha', t: 'date', v: t?.date || today(), req: true, half: true }, { k: 'time', l: 'Hora', t: 'time', v: t?.time || '09:00', half: true },
    { k: 'minutes', l: 'Duración (min)', t: 'number', v: t?.minutes || 60 },
  ], t ? 'Guardar' : 'Agregar');

  // ---------- acciones ----------
  acts(el, {
    toggle: (b) => { const id = b.dataset.m; closed.has(id) ? closed.delete(id) : closed.add(id); paint(); },
    newMega: async () => {
      const v = await megaForm(null); if (!v) return;
      try { const r = await R.create({ name: v.name, why: v.why || '', start: v.start || '', end: v.end || '', status: v.status || 'Activo', projects: [] }); megas = [...megas, r]; paint(); toast('Megaproyecto creado'); } catch (e) { toast(e.message, true); }
    },
    editMega: async (b) => { const m = megas.find((x) => x.id === b.dataset.m), v = await megaForm(m); if (!v) return; if (await save({ ...m, name: v.name, why: v.why || '', start: v.start || '', end: v.end || '', status: v.status || 'Activo' })) paint(); },
    delMega: async (b) => {
      const m = megas.find((x) => x.id === b.dataset.m); if (!(await confirmAsk(`¿Eliminar «${m.name}» con todos sus proyectos y tareas?`))) return;
      try { await R.remove(m.id); megas = megas.filter((x) => x.id !== m.id); paint(); } catch (e) { toast(e.message, true); }
    },
    addProject: async (b) => { const m = megas.find((x) => x.id === b.dataset.m), v = await projectForm(null); if (!v) return; if (await save({ ...m, projects: [...(m.projects || []), { id: uid(), name: v.name, project_id: v.project_id || '', tasks: [] }] })) { closed.delete(m.id); paint(); } },
    editProject: async (b) => { const { m, p } = find(b.dataset.m, b.dataset.p), v = await projectForm(p); if (!v) return; if (await save({ ...m, projects: m.projects.map((x) => (x.id === p.id ? { ...x, name: v.name, project_id: v.project_id || '' } : x)) })) paint(); },
    delProject: async (b) => { const { m, p } = find(b.dataset.m, b.dataset.p); if (!(await confirmAsk(`¿Quitar el proyecto «${p.name}» y sus tareas?`))) return; if (await save({ ...m, projects: m.projects.filter((x) => x.id !== p.id) })) paint(); },
    addTask: async (b) => {
      const { m, p } = find(b.dataset.m, b.dataset.p), v = await taskForm(null); if (!v) return;
      const t = { id: uid(), title: v.title, date: v.date, time: hhmm(v.time) || '09:00', minutes: +v.minutes || 60, done: false, event_link: '' };
      if (await save({ ...m, projects: m.projects.map((x) => (x.id === p.id ? { ...x, tasks: [...(x.tasks || []), t] } : x)) })) paint();
    },
    editTask: async (b) => {
      const { m, p, t } = find(b.dataset.m, b.dataset.p, b.dataset.t), v = await taskForm(t); if (!v) return;
      const moved = v.date !== t.date || (hhmm(v.time) || '09:00') !== t.time; // si cambió el horario, el evento viejo ya no vale: se puede volver a agendar
      const nt = { ...t, title: v.title, date: v.date, time: hhmm(v.time) || '09:00', minutes: +v.minutes || 60, ...(moved ? { event_link: '' } : {}) };
      if (await save({ ...m, projects: m.projects.map((x) => (x.id === p.id ? { ...x, tasks: x.tasks.map((y) => (y.id === t.id ? nt : y)) } : x)) })) { paint(); if (moved && t.event_link) toast('Cambió el horario: vuelve a agregarla a tu calendario'); }
    },
    delTask: async (b) => { const { m, p, t } = find(b.dataset.m, b.dataset.p, b.dataset.t); if (!(await confirmAsk(`¿Quitar la tarea «${t.title}»?`))) return; if (await save({ ...m, projects: m.projects.map((x) => (x.id === p.id ? { ...x, tasks: x.tasks.filter((y) => y.id !== t.id) } : x)) })) paint(); },
    doneTask: async (b) => { const { m, p, t } = find(b.dataset.m, b.dataset.p, b.dataset.t); if (await save({ ...m, projects: m.projects.map((x) => (x.id === p.id ? { ...x, tasks: x.tasks.map((y) => (y.id === t.id ? { ...y, done: !y.done } : y)) } : x)) })) paint(); },
    cal: async (b) => {
      const { m, p, t } = find(b.dataset.m, b.dataset.p, b.dataset.t); b.disabled = true;
      try {
        const e = await api('google/calendar', { method: 'POST', body: { summary: `${m.name} · ${t.title}`, date: t.date, time: hhmm(t.time) || '09:00', minutes: t.minutes || 60, description: `Roadmap › ${m.name} › ${p.name}\n\nInherent OS` } });
        if (await save({ ...m, projects: m.projects.map((x) => (x.id === p.id ? { ...x, tasks: x.tasks.map((y) => (y.id === t.id ? { ...y, event_link: e.link || '#' } : y)) } : x)) })) { paint(); toast('Agregada a tu calendario'); }
      } catch (err) { b.disabled = false; toast(err.message, true); }
    },
  });
  if (alive()) paint();
}
