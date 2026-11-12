import { html, raw, mount, col, api, ask, toast, acts, confirmAsk, fdate, today, IC, ico, drawer, closeDrawer } from '../core.js';
import { vacio } from '../visual.js';

// Roadmap: los pasos grandes (megaproyectos). Cada uno agrupa proyectos y cada proyecto tiene tareas con fecha y hora,
// que se pueden mandar al calendario de quien lo usa. Todo vive en un solo documento por megaproyecto.
const STATUS = { Activo: 'lime', Pausado: 'amber', Hecho: 'green' };
const uid = () => Math.random().toString(36).slice(2, 10);
const hhmm = (t) => (/^\d{2}:\d{2}$/.test(t || '') ? t : '');
const stamp = (t) => `${t.date || ''}T${hhmm(t.time) || '99:99'}`; // para ordenar: primero fecha, luego hora

export async function render(el, { me, alive }) {
  const R = col('roadmap');
  let [megas, projects] = await Promise.all([R.list(), col('projects').list().catch(() => [])]);

  const tasksOf = (m) => (m.projects || []).flatMap((p) => p.tasks || []);
  const progress = (m) => { const all = tasksOf(m); return { done: all.filter((t) => t.done).length, total: all.length }; };
  const find = (mid, pid, tid) => { const m = megas.find((x) => x.id === mid), p = m?.projects?.find((x) => x.id === pid), t = p?.tasks?.find((x) => x.id === tid); return { m, p, t }; };
  async function save(m) {
    try { const r = await R.save(m); megas = megas.map((x) => (x.id === r.id ? r : x)); return r; } catch (e) { toast(e.message, true); return null; }
  }

  // ---------- vista ----------
  // Hero con el trimestre y tres números · las metas como tiles anchos con su anillo · la línea de tiempo del trimestre
  // como strip · el detalle de cada meta (proyectos y tareas) en un sheet lateral.
  const T = today();
  const Q = (() => { const y = +T.slice(0, 4), q = Math.floor((+T.slice(5, 7) - 1) / 3); const from = `${y}-${String(q * 3 + 1).padStart(2, '0')}-01`, end = new Date(y, q * 3 + 3, 0, 12); return { y, n: q + 1, from, to: `${y}-${String(q * 3 + 3).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`, months: [0, 1, 2].map((k) => new Date(y, q * 3 + k, 15, 12)) }; })();
  const late = (t) => !t.done && t.date && t.date < T;
  const pctOf = (m) => { const { done, total } = progress(m); return total ? Math.round((done / total) * 100) : 0; };
  const nextOf = (m) => tasksOf(m).filter((t) => !t.done && t.date).sort((a, z) => stamp(a).localeCompare(stamp(z)))[0];
  const R0 = 26, C0 = 2 * Math.PI * R0;
  const ring = (pct, big) => html`<div class="sp-ring ${big ? 'big' : ''}" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="trk" cx="32" cy="32" r="${R0}" fill="none" stroke-width="6"/>${raw(pct ? `<circle class="val" cx="32" cy="32" r="${R0}" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C0.toFixed(2)}" stroke-dashoffset="${(C0 * (1 - pct / 100)).toFixed(2)}"/>` : '')}</svg><b>${pct}<small>%</small></b></div>`;
  let openId = null; // la meta abierta en el sheet

  const taskRow = (m, p, t) => {
    const lt = late(t);
    return html`<div class="rmtask ${t.done ? 'done' : ''}">
      <input type="checkbox" ${t.done ? raw('checked') : ''} data-act="doneTask" data-m="${m.id}" data-p="${p.id}" data-t="${t.id}" aria-label="Hecha">
      <div class="rmt-main"><div class="rmt-title">${t.title}</div>
        <div class="sm ${lt ? 'rmt-late' : 'mut'}">${t.date ? html`${ico('cal', 14)} ${fdate(t.date)}${hhmm(t.time) ? ' · ' + t.time : ''}${t.minutes ? ' · ' + t.minutes + ' min' : ''}${lt ? ' · atrasada' : ''}` : 'Sin fecha'}</div></div>
      <div class="row rmt-acts">
        ${t.event_link ? html`<a class="btn ghost xs" href="${t.event_link}" target="_blank" rel="noopener noreferrer">${ico('check', 14)} En tu calendario</a>`
          : html`<button class="btn ghost xs" data-act="cal" data-m="${m.id}" data-p="${p.id}" data-t="${t.id}" ${t.date ? '' : raw('disabled title="Ponle fecha primero"')}>${ico('cal', 14)} Agregar a mi calendario</button>`}
        <button class="btn ghost xs" data-act="editTask" data-m="${m.id}" data-p="${p.id}" data-t="${t.id}">Editar</button>
        <button class="btn ghost xs" data-act="delTask" data-m="${m.id}" data-p="${p.id}" data-t="${t.id}" aria-label="Quitar tarea" title="Quitar tarea">${ico('trash', 15)}</button>
      </div></div>`;
  };
  const projectBlock = (m, p) => {
    const ts = [...(p.tasks || [])].sort((a, z) => stamp(a).localeCompare(stamp(z)));
    const lk = projects.find((x) => x.id === p.project_id), dn = ts.filter((t) => t.done).length;
    return html`<section class="rmproj-box">
      <div class="row rmproj" style="gap:8px;flex-wrap:wrap"><b>${p.name}</b><span class="mut sm">${dn}/${ts.length}</span>${lk ? html`<a class="chip" href="#/operations" style="font-size:11px;text-decoration:none">${ico('link', 13)} ${lk.name}</a>` : ''}<div class="sp"></div>
        <button class="btn ghost xs" data-act="addTask" data-m="${m.id}" data-p="${p.id}">+ Tarea</button>
        <button class="btn ghost xs" data-act="editProject" data-m="${m.id}" data-p="${p.id}">Editar</button>
        <button class="btn ghost xs" data-act="delProject" data-m="${m.id}" data-p="${p.id}" aria-label="Quitar proyecto" title="Quitar proyecto">${ico('trash', 15)}</button></div>
      ${ts.length ? ts.map((t) => taskRow(m, p, t)) : html`<div class="mut sm" style="padding:8px 0">Sin tareas todavía.</div>`}</section>`;
  };
  const dates = (m) => (m.start || m.end ? `${m.start ? fdate(m.start) : '…'} → ${m.end ? fdate(m.end) : '…'}` : 'Sin fechas');
  const megaTile = (m) => {
    const { done, total } = progress(m), pct = pctOf(m), nx = nextOf(m), lt = tasksOf(m).filter(late).length, np = (m.projects || []).length;
    return html`<button class="sp-tile rm-tile" data-act="openMega" data-m="${m.id}">
      <div class="rm-tile-top">${ring(pct)}<div style="min-width:0;flex:1"><div class="row" style="gap:8px;flex-wrap:wrap"><span class="sp-tile-name">${m.name}</span><span class="chip ${STATUS[m.status] || ''}">${m.status || 'Activo'}</span></div>
        ${m.why ? html`<div class="rm-why">${m.why}</div>` : ''}</div><span class="sp-tile-go" aria-hidden="true">↗</span></div>
      <div class="sp-tile-foot"><span>${dates(m)} · ${np} proyecto${np === 1 ? '' : 's'} · ${done}/${total} tareas</span><span class="${lt ? 'rmt-late' : ''}">${lt ? `${lt} vencida${lt === 1 ? '' : 's'}` : nx ? `Sigue: ${fdate(nx.date)}` : total ? 'Todo hecho' : 'Sin tareas'}</span></div></button>`;
  };
  // La línea de tiempo: el trimestre en tres meses; cada meta es una barra de su inicio a su fin y cada tarea un punto.
  const timeline = (list) => {
    const d0 = new Date(Q.from + 'T12:00'), span = (new Date(Q.to + 'T12:00') - d0) / 864e5 + 1;
    const pos = (d) => Math.max(0, Math.min(100, ((new Date(d + 'T12:00') - d0) / 864e5 / span) * 100));
    const rows = list.filter((m) => (m.start || m.end || tasksOf(m).some((t) => t.date)) && (m.start || Q.from) <= Q.to && (m.end || Q.to) >= Q.from);
    const now = T >= Q.from && T <= Q.to ? pos(T) : null;
    return html`<section class="sp-panel rm-time"><div class="sp-panel-h row"><h3>Línea de tiempo · T${Q.n} ${Q.y}</h3><span class="mut sm">Cada barra es una meta; cada punto, una tarea</span></div>
      <div class="rm-months">${Q.months.map((d) => html`<span>${d.toLocaleDateString('es-GT', { month: 'long' })}</span>`)}</div>
      <div class="sp-strip rm-strip">${now == null ? '' : html`<i class="rm-now" style="left:${now.toFixed(2)}%" title="Hoy"></i>`}
        ${rows.length ? rows.map((m) => { const a = pos(m.start || Q.from), z = pos(m.end || Q.to), w = Math.max(2, z - a);
          return html`<button class="rm-lane" data-act="openMega" data-m="${m.id}" aria-label="${m.name}"><span class="rm-lbl" style="left:${a.toFixed(2)}%">${m.name}</span><span class="rm-bar ${String(m.status || 'Activo').toLowerCase()}" style="left:${a.toFixed(2)}%;width:${w.toFixed(2)}%"></span>
            ${tasksOf(m).filter((t) => t.date && t.date >= Q.from && t.date <= Q.to).map((t) => html`<i class="rm-dot ${t.done ? 'done' : late(t) ? 'late' : ''}" style="left:${pos(t.date).toFixed(2)}%" title="${fdate(t.date)} · ${t.title}"></i>`)}</button>`; })
        : html`<div class="mut sm" style="padding:14px 8px">Ninguna meta cae en este trimestre.</div>`}</div></section>`;
  };
  // El detalle de una meta en el sheet: su anillo, para qué es, sus fechas y sus proyectos con tareas.
  const sheet = (m) => {
    const { done, total } = progress(m);
    return html`<div class="row"><span class="chip ${STATUS[m.status] || ''}">${m.status || 'Activo'}</span><span class="mut sm">${dates(m)}</span><div class="sp"></div><button class="arrow light" data-act="close" aria-label="Cerrar">${ico('x', 16)}</button></div>
      <div class="rm-sh-top">${ring(pctOf(m), true)}<div style="min-width:0"><h2 style="margin:0">${m.name}</h2>${m.why ? html`<p class="mut" style="margin:6px 0 0">${m.why}</p>` : ''}<div class="mut sm" style="margin-top:6px">${(m.projects || []).length} proyecto${(m.projects || []).length === 1 ? '' : 's'} · ${done}/${total} tareas</div></div></div>
      ${(m.projects || []).length ? (m.projects || []).map((p) => projectBlock(m, p)) : html`<div class="sp-callout info" style="margin-top:14px"><span class="grow">Agrega los proyectos que forman este paso con «+ Proyecto».</span></div>`}
      <div class="row"><button class="btn" data-act="addProject" data-m="${m.id}">+ Proyecto</button><button class="btn ghost" data-act="editMega" data-m="${m.id}">Editar</button><div class="sp"></div><button class="btn ghost" data-act="delMega" data-m="${m.id}" aria-label="Quitar meta" title="Quitar meta">${ico('trash', 15)}</button></div>`;
  };
  function paint() {
    const order = { Activo: 0, Pausado: 1, Hecho: 2 };
    const list = [...megas].sort((a, z) => (order[a.status || 'Activo'] ?? 0) - (order[z.status || 'Activo'] ?? 0) || String(a.start || '9999').localeCompare(String(z.start || '9999')));
    const all = megas.flatMap(tasksOf), dn = all.filter((t) => t.done).length, overdue = all.filter(late).length, act = megas.filter((m) => (m.status || 'Activo') === 'Activo').length;
    mount(el, html`<div class="hello sp-hero row" style="align-items:flex-end"><div><span class="lbl">T${Q.n} · ${Q.y}</span><h1>Roadmap</h1><p>Los pasos grandes de Inherent, con sus proyectos y <em>tareas con fecha y hora</em>.</p></div><div class="sp"></div>${list.length ? html`<button class="btn" data-act="newMega">+ Meta</button>` : ''}</div>
      ${list.length ? html`<div class="sp-kpis">
          <div><span class="lbl">Metas</span><b>${megas.length}</b><span class="mut sm">${act} activa${act === 1 ? '' : 's'}</span></div>
          <div><span class="lbl">Avance</span><b>${all.length ? Math.round((dn / all.length) * 100) : '—'}${all.length ? html`<small class="mut" style="font-size:16px">%</small>` : ''}</b><span class="mut sm">${dn} de ${all.length} tareas</span></div>
          <div><span class="lbl">Checkpoints vencidos</span><b class="${overdue ? 'rmt-late' : ''}">${overdue}</b><span class="mut sm">${overdue ? 'Tareas con fecha pasada sin hacer' : 'Nada vencido'}</span></div></div>
        <div class="sp-tiles wide rm-tiles">${list.map(megaTile)}</div>
        ${timeline(list)}`
      : html`${vacio({ icono: 'inbox', titulo: 'Aún no hay metas', linea: 'Cada meta es un paso grande de Inherent: dentro van sus proyectos y las tareas con fecha y hora.', boton: { texto: '+ Meta', act: 'newMega' } })}`}`);
    const d = document.getElementById('drawer');
    if (openId) { const m = megas.find((x) => x.id === openId); if (m && d?.classList.contains('on')) drawer(sheet(m), H); else if (!m) { openId = null; closeDrawer(); } }
  }

  // ---------- formularios ----------
  const megaForm = (m) => ask(m ? 'Editar meta' : 'Nueva meta', [
    { k: 'name', l: 'Nombre', v: m?.name, req: true },
    { k: 'why', l: 'Para qué es (el resultado grande)', t: 'textarea', v: m?.why },
    { k: 'start', l: 'Empieza', t: 'date', v: m?.start, half: true }, { k: 'end', l: 'Termina', t: 'date', v: m?.end, half: true },
    { k: 'status', l: 'Estado', t: 'select', opts: Object.keys(STATUS), v: m?.status || 'Activo' },
  ], m ? 'Guardar' : 'Crear');
  const projectForm = (p) => ask(p ? 'Editar proyecto' : 'Nuevo proyecto', [
    { k: 'name', l: 'Nombre', v: p?.name, req: true },
    { k: 'project_id', l: 'Enlazar con un proyecto de Operaciones (opcional)', t: 'select', opts: [['', '— Ninguno —'], ...projects.map((x) => [x.id, x.name])], v: p?.project_id || '' },
  ], p ? 'Guardar' : 'Agregar');
  const taskForm = (t) => ask(t ? 'Editar tarea' : 'Nueva tarea', [
    { k: 'title', l: 'Qué hay que hacer', v: t?.title, req: true },
    { k: 'date', l: 'Fecha', t: 'date', v: t?.date || today(), req: true, half: true }, { k: 'time', l: 'Hora', t: 'time', v: t?.time || '09:00', half: true },
    { k: 'minutes', l: 'Duración (min)', t: 'number', v: t?.minutes || 60 },
  ], t ? 'Guardar' : 'Agregar');

  // ---------- acciones ----------
  const H = {
    openMega: (b) => { const m = megas.find((x) => x.id === b.dataset.m); if (!m) return; openId = m.id; drawer(sheet(m), H); },
    newMega: async () => {
      const v = await megaForm(null); if (!v) return;
      try { const r = await R.create({ name: v.name, why: v.why || '', start: v.start || '', end: v.end || '', status: v.status || 'Activo', projects: [] }); megas = [...megas, r]; paint(); toast('Meta creada'); } catch (e) { toast(e.message, true); }
    },
    editMega: async (b) => { const m = megas.find((x) => x.id === b.dataset.m), v = await megaForm(m); if (!v) return; if (await save({ ...m, name: v.name, why: v.why || '', start: v.start || '', end: v.end || '', status: v.status || 'Activo' })) paint(); },
    delMega: async (b) => {
      const m = megas.find((x) => x.id === b.dataset.m); if (!(await confirmAsk(`¿Eliminar «${m.name}» con todos sus proyectos y tareas?`))) return;
      try { await R.remove(m.id); megas = megas.filter((x) => x.id !== m.id); if (openId === m.id) { openId = null; closeDrawer(); } paint(); } catch (e) { toast(e.message, true); }
    },
    addProject: async (b) => { const m = megas.find((x) => x.id === b.dataset.m), v = await projectForm(null); if (!v) return; if (await save({ ...m, projects: [...(m.projects || []), { id: uid(), name: v.name, project_id: v.project_id || '', tasks: [] }] })) paint(); },
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
  };
  acts(el, H);
  addEventListener('hashchange', () => { if (openId) { openId = null; closeDrawer(); } }, { once: true });
  if (alive()) paint();
}
