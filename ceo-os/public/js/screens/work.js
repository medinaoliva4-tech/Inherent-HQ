import { html, raw, mount, col, api, acts, toast, fdate, today, initials, IC, $, $$, ask, confirmAsk, drawer, closeDrawer } from '../core.js';

// Workspace: donde cada perfil organiza su trabajo. Todos tienen su kanban personal, el de la
// empresa y sus tareas. El CEO además ve los dos pipelines, quién responde por cada cosa hasta
// llegar a él, lo que espera su decisión y lo suyo: estrategia, reuniones y propuestas, y pauta.
const COLS = [['Por empezar', 'Por hacer', '#a39a8c'], ['En curso', 'En progreso', '#7f9631'], ['En revisión', 'En revisión', '#b08a5f'], ['Hecha', 'Hecha', '#4f6b12']];
const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
const PIPES = {
  contenido: { name: 'Contenido', sub: 'Marketing · producción y entrega', ico: '▶', tone: 'olive', bar: '#5c6b22' },
  growth: { name: 'Business Growth', sub: 'Consultoría que opera · estrategia y sistemas', ico: '↗', tone: 'terra', bar: '#b8583c' },
};
const COLORS = ['#26201a', '#c2735a', '#4f7790', '#7f9631', '#b08a5f', '#6b5a45'];
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };

export async function render(el, { me, sub, alive }) {
  const TK = col('tasks');
  const isCeo = me.role === 'ceo';
  const can = (a) => me.areas.includes(a);
  let [tasks, projects, team, content, quotes, repoq] = await Promise.all([
    TK.list(), col('projects').list(), col('team').list(), col('content').list().catch(() => []),
    isCeo && can('sales') ? col('quotes').list().catch(() => []) : [], isCeo ? api('repo/queue').catch(() => null) : null,
  ]);
  let tab = ['hoy', 'kanban', 'pipes', 'equipo'].includes(sub[0]) ? sub[0] : 'hoy';
  let kView = sub[1] === 'empresa' ? 'empresa' : 'personal', pipeSel = 'contenido', personSel = null;
  let agenda = null, week = null;
  const T0 = today(), T1 = addDays(T0, 1), T7 = addDays(T0, 7);

  // ---------- personas y cadena de responsabilidad ----------
  const keyOf = (p) => p.email || p.id;
  const person = (k) => team.find((p) => p.id === k || p.email === k);
  const meP = person(me.email);
  const nameOf = (k) => person(k)?.name || (k === me.email ? me.name : k ? String(k).split('@')[0] : '—');
  const ceoKey = keyOf(team.find((p) => !p.reports_to && p.role === 'ceo') || meP || { id: me.email });
  const bossOf = (k) => { const p = person(k); const b = p?.reports_to && person(p.reports_to); return b ? keyOf(b) : null; };
  const accOf = (t) => t.accountable || bossOf(t.assignee) || ceoKey;
  const chain = (t) => { const out = [t.assignee || null]; let k = accOf(t); const seen = new Set(out); while (k && !seen.has(k) && out.length < 6) { out.push(k); seen.add(k); k = bossOf(k); } if (!seen.has(ceoKey)) out.push(ceoKey); return out.filter(Boolean); };
  const av = (k, size = 26) => { const p = person(k); const n = p?.name || nameOf(k); return p?.picture
    ? html`<img src="${p.picture}" referrerpolicy="no-referrer" alt="" title="${n}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid #fff">`
    : html`<span class="av" title="${n}" style="width:${size}px;height:${size}px;font-size:${Math.round(size / 2.6)}px;background:${p?.color || COLORS[(n.length || 0) % COLORS.length]}">${initials(n)}</span>`; };
  const proj = (id) => projects.find((p) => p.id === id);
  // La línea del proyecto: contenido (agencia) o growth (consultoría). `pipeline` es el mapa de departamentos.
  const lineOf = (p) => (p.line === 'growth' || /growth/i.test(p.kind || '') ? 'growth' : 'contenido');
  const pipeOf = (t) => { const p = proj(t.project_id); return p ? lineOf(p) : null; };
  const status = (t) => t.status || 'Por empezar';
  const dueChip = (d, st) => { if (!d || st === 'Hecha') return d ? html`<span class="mut sm">${fdate(d)}</span>` : '';
    return d < T0 ? html`<span class="chip red" style="font-size:11px">Atrasada · ${fdate(d)}</span>` : d === T0 ? html`<span class="chip red" style="font-size:11px">Hoy</span>` : d === T1 ? html`<span class="chip amber" style="font-size:11px">Mañana</span>` : html`<span class="mut sm">📅 ${fdate(d)}</span>`; };
  const mine = () => tasks.filter((t) => t.assignee === me.email || (meP && t.assignee === meP.id));
  const open = (l) => l.filter((t) => status(t) !== 'Hecha');

  // ---------- tarjeta de tarea (kanban y listas) ----------
  const card = (t) => { const p = proj(t.project_id);
    return html`<div class="kcard wk" draggable="true" data-act="task" data-id="${t.id}">
      <b>${t.title}</b><div class="mut sm">${p ? (p.client || p.name) : 'Interno'}${t.dept ? ' · ' + t.dept.split(' ')[0] : ''}</div>
      <div class="row" style="margin-top:10px;gap:6px">${t.assignee ? av(t.assignee, 22) : ''}<span class="sm">${t.assignee ? nameOf(t.assignee).split(' ')[0] : 'Sin responsable'}</span><div class="sp"></div>${dueChip(t.due, status(t))}</div>
      ${(t.checklist || []).length ? html`<div class="wkbar"><i style="width:${Math.round((t.checklist.filter((c) => c.done).length / t.checklist.length) * 100)}%"></i></div>` : ''}</div>`; };

  function paint() {
    if (!alive()) return;
    const tabs = [['hoy', 'Hoy'], ['kanban', 'Kanban'], ...(isCeo ? [['pipes', 'Pipelines'], ['equipo', 'Equipo']] : [])];
    mount(el, html`<div class="hello"><h1>Workspace</h1><p>${isCeo ? html`Tu trabajo de <em>CEO</em>, y el de todos hasta llegar a ti.` : html`Tu trabajo, <em>en orden</em>.`}</p></div>
      <div class="row" style="margin-bottom:16px;gap:10px"><div class="tabs" style="margin:0">${tabs.map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div><div class="sp"></div><button class="btn" data-act="newTask">+ Tarea</button></div>
      <div id="wbody"></div>`);
    ({ hoy, kanban, pipes, equipo })[tab]($('#wbody', el));
  }

  // =================== HOY ===================
  function decisions() {
    if (!isCeo) return [];
    const out = [];
    for (const t of tasks) if (status(t) === 'En revisión' && accOf(t) === ceoKey) out.push({ t: `Revisar: ${t.title}`, sub: `${nameOf(t.assignee)} lo entregó`, due: t.due, tone: '#b08a5f', act: 'task', id: t.id });
    for (const p of projects) {
      if (p.pipeline?.['①']?.status === 'now') out.push({ t: 'Aprobar la estrategia', sub: `${p.client || p.name} · gate de ① Strategy`, tone: '#a3392a', href: '#/operations/pipe' });
      if (p.pipeline?.['⑩']?.status === 'now') out.push({ t: 'Aprobar plan y presupuesto de pauta', sub: `${p.client || p.name} · gate de ⑩ Ads`, tone: '#a3392a', href: '#/operations/pipe' });
    }
    if (repoq?.pending?.length) out.push({ t: `${repoq.pending.length} cambio${repoq.pending.length === 1 ? '' : 's'} para el repo`, sub: 'El equipo espera tu OK', tone: '#4f7790', href: '#/repo' });
    for (const q of quotes.filter((x) => x.status === 'Borrador')) out.push({ t: `Enviar cotización ${q.number}`, sub: q.client || '', tone: '#7f9631', href: '#/sales/quotes' });
    return out;
  }
  function hoy(b) {
    if (agenda === null) { agenda = []; api(`google/calendar?from=${T0}&to=${T0}`).then((r) => { agenda = r.events; if (alive() && tab === 'hoy') hoy($('#wbody', el)); }).catch(() => {}); }
    const my = open(mine()).filter((t) => !t.due || t.due <= T1).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
    const doneToday = mine().filter((t) => status(t) === 'Hecha' && String(t._meta?.updated_at || '').slice(0, 10) === T0);
    const dq = decisions();
    const late = open(tasks).filter((t) => t.due && t.due < T0);
    const posts = content.filter((c) => c.kind === 'post' && c.date >= T0 && c.date <= T7 && c.status !== 'Publicado').sort((a, z) => a.date.localeCompare(z.date));
    mount(b, html`
      <div class="grid g4">
        ${kpi('Mis tareas de hoy', my.length, `${doneToday.length} hechas hoy`)}
        ${isCeo ? kpi('Esperan tu decisión', dq.length, dq.length ? 'Revisa la cola' : 'Nada pendiente', dq.length ? '#a3392a' : '') : kpi('En revisión', mine().filter((t) => status(t) === 'En revisión').length, 'Esperan aprobación')}
        ${kpi('Atrasadas', isCeo ? late.length : late.filter((t) => mine().includes(t)).length, isCeo ? 'En toda la empresa' : 'Tuyas', late.length ? '#a3392a' : '')}
        ${kpi('Proyectos activos', projects.filter((p) => (p.phases || []).some((x) => x.status !== 'done')).length, `${new Set(projects.map((p) => p.client_slug).filter(Boolean)).size} clientes`)}
      </div>
      <div class="grid g11" style="margin-top:16px;align-items:start">
        <div class="card"><div class="chead"><h3 style="font-size:17px">Mis tareas de hoy</h3><div class="sp"></div><button class="sm mut" data-act="tab" data-t="kanban">Ver todas →</button></div>
          ${my.length || doneToday.length ? html`${[...my, ...doneToday].slice(0, 9).map((t) => html`<div class="wkrow ${status(t) === 'Hecha' ? 'done' : ''}"><input type="checkbox" data-act="tdone" data-id="${t.id}" ${status(t) === 'Hecha' ? raw('checked') : ''}><span data-act="task" data-id="${t.id}" style="flex:1;cursor:pointer">${t.title}<span class="mut sm"> · ${proj(t.project_id)?.client || proj(t.project_id)?.name || 'Interno'}</span></span>${dueChip(t.due, status(t))}</div>`)}`
            : html`<div class="mut sm" style="padding:10px 0">Nada para hoy. Crea una con «+ Tarea».</div>`}
          <div class="row" style="margin-top:10px"><input class="in" id="quick" placeholder="Agregar una tarea para hoy y Enter…"></div></div>
        <div class="card"><div class="chead"><h3 style="font-size:17px">Agenda y contenido</h3><span class="gbadge" style="margin-left:auto">${IC.cal} Hoy</span></div>
          ${agenda.length ? agenda.map((e) => html`<a class="wkev" href="${/^https:\/\//.test(e.link || '') ? e.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="t">${e.allDay ? 'Día' : String(e.start).slice(11, 16)}</span><i style="background:${/^#[0-9a-f]{6}$/i.test(e.color || '') ? e.color : '#7f9631'}"></i><div><b style="font-weight:500">${e.summary}</b>${e.meet ? html`<div class="mut sm">Google Meet</div>` : ''}</div></a>`) : html`<div class="mut sm" style="padding:6px 0 10px">Sin reuniones hoy en tu calendario.</div>`}
          <div class="lbl" style="margin-top:12px;color:var(--mut)">Contenido de los próximos 7 días</div>
          ${posts.length ? posts.slice(0, 5).map((p) => html`<a class="wkev" href="#/content/postear/${p.profile}"><span class="t">${fdate(p.date)}</span><i style="background:#c2735a"></i><div><b style="font-weight:500">${p.title}</b><div class="mut sm">${p.format || 'Pieza'} · ${p.status || 'Idea'} · ${p.profile}</div></div></a>`) : html`<div class="mut sm" style="padding:6px 0">Nada programado esta semana.</div>`}</div>
      </div>
      ${isCeo ? html`<div class="grid g11" style="margin-top:16px;align-items:start">
        <div class="card"><div class="chead"><h3 style="font-size:17px">Cola de decisiones</h3>${dq.length ? html`<span class="badge-n">${dq.length}</span>` : ''}</div>
          ${dq.length ? dq.slice(0, 7).map((d) => html`<${raw(d.href ? 'a' : 'div')} class="wkdec" ${raw(d.href ? `href="${d.href}"` : `data-act="${d.act}" data-id="${d.id}"`)} style="border-left-color:${d.tone}"><div style="flex:1"><b style="font-weight:500">${d.t}</b><div class="mut sm">${d.sub}</div></div>${d.due ? dueChip(d.due) : ''}<span class="mut">›</span></${raw(d.href ? 'a' : 'div')}>`)
            : html`<div class="mut sm" style="padding:8px 0">Nada espera tu decisión. 🙌</div>`}</div>
        <div class="card"><div class="chead"><h3 style="font-size:17px">Accountability</h3><div class="sp"></div><button class="sm mut" data-act="tab" data-t="equipo">Ver equipo →</button></div>${accRows(5)}</div>
      </div>
      <div class="sec-title"><h2>Pipelines</h2><button class="sm mut" data-act="tab" data-t="pipes">Ver todos →</button></div>
      <div class="grid g11">${Object.keys(PIPES).map(pipeCard)}</div>
      <div class="sec-title"><h2>Lo tuyo como CEO</h2></div>
      <div class="grid g3" style="align-items:start">${ceoLanes()}</div>` : ''}`);
    const qi = $('#quick', b); if (qi) qi.onkeydown = async (e) => { if (e.key !== 'Enter' || !qi.value.trim()) return; const t = await create({ title: qi.value.trim(), assignee: me.email, due: T0, status: 'Por empezar' }); if (t) { qi.value = ''; hoy(b); } };
  }
  const kpi = (l, v, s, c = '') => html`<div class="card"><div class="lbl" style="color:var(--mut)">${l}</div><div class="big" style="font-size:44px;${c ? `color:${c}` : ''}">${v}</div><div class="mut sm">${s}</div></div>`;

  function stats(k) {
    const m = T0.slice(0, 7);
    const l = tasks.filter((t) => t.assignee === k);
    const month = l.filter((t) => String(t.due || t._meta?.created_at || '').slice(0, 7) === m || status(t) !== 'Hecha');
    const done = month.filter((t) => status(t) === 'Hecha').length, late = open(l).filter((t) => t.due && t.due < T0).length;
    return { total: month.length, done, late, open: open(l).length, dot: late ? '#a3392a' : open(l).length > 8 ? '#d08a2e' : '#5c7a1a' };
  }
  function people() { return team.filter((p) => p.active !== false && p.kind !== 'ia' && p.role !== 'ceo' && keyOf(p) !== ceoKey); }
  function accRows(n) {
    const ps = people(); if (!ps.length) return html`<div class="mut sm">Agrega al equipo en Team.</div>`;
    return ps.slice(0, n).map((p) => { const s = stats(keyOf(p)); return html`<div class="wkrow" data-act="person" data-k="${keyOf(p)}" style="cursor:pointer">${av(keyOf(p), 30)}<div style="flex:1"><b style="font-weight:500">${p.name}</b><div class="mut sm">${p.title || ''}</div></div><span class="sm">${s.done}/${s.total}</span><i class="dot" style="background:${s.dot}" title="${s.late ? s.late + ' atrasadas' : 'Al día'}"></i></div>`; });
  }
  function pipeCard(k) {
    const P = PIPES[k]; const l = tasks.filter((t) => pipeOf(t) === k); const done = l.filter((t) => status(t) === 'Hecha').length; const pct = l.length ? Math.round((done / l.length) * 100) : 0;
    const n = (s) => l.filter((t) => status(t) === s).length;
    const ps = projects.filter((p) => (lineOf(p)) === k);
    return html`<div class="card" data-act="pipe" data-k="${k}" style="cursor:pointer"><div class="chead"><div class="ico">${P.ico}</div><h3 style="font-size:17px">${P.name}<br><span class="mut sm">${P.sub}</span></h3><span class="arrow">↗</span></div>
      <div class="big" style="font-size:40px">${done}<small>/${l.length}</small></div>
      <div class="wkprog"><i style="width:${pct}%;background:${P.bar}"></i></div><div class="row sm" style="justify-content:space-between;margin-top:6px"><span>${pct}%</span><span class="mut">${ps.length} proyecto${ps.length === 1 ? '' : 's'}</span></div>
      <div style="margin-top:12px">${COLS.slice(0, 3).map(([s, l2, c]) => html`<div class="row sm" style="padding:3px 0"><i class="dot" style="background:${c}"></i>${n(s)} ${l2.toLowerCase()}</div>`)}</div></div>`;
  }
  function ceoLanes() {
    const byDept = (re) => open(tasks).filter((t) => re.test(t.dept || '') && (t.assignee === me.email || accOf(t) === ceoKey));
    const lane = (title, sub, list, dept, extra) => html`<div class="card"><div class="chead"><h3 style="font-size:17px">${title}<br><span class="mut sm">${sub}</span></h3><button class="btn ghost" data-act="laneTask" data-d="${dept}" style="margin-left:auto;padding:6px 12px">+</button></div>
      ${extra || ''}${list.length ? list.slice(0, 6).map((t) => html`<div class="wkrow" data-act="task" data-id="${t.id}" style="cursor:pointer">${t.assignee ? av(t.assignee, 22) : ''}<span style="flex:1">${t.title}</span>${dueChip(t.due, status(t))}</div>`) : html`<div class="mut sm" style="padding:6px 0">Nada abierto.</div>`}</div>`;
    const meets = (agenda || []).filter((e) => /reuni|meet|call|propuesta|cliente/i.test(e.summary || '') || e.meet);
    const drafts = quotes.filter((q) => ['Borrador', 'Enviada'].includes(q.status));
    return [
      lane('Estrategia y campañas', 'Estrategia mediática, monetización y campañas', byDept(/^[①③②](?!B)/), '① Strategy'),
      lane('Clientes: reuniones y propuestas', 'La relación macro con cada cliente', byDept(/^(①|②)/).filter((t) => /reuni|propuesta|present|cliente/i.test(t.title)), '① Strategy',
        html`${meets.map((e) => html`<div class="wkrow"><span class="mut sm" style="min-width:42px">${e.allDay ? 'Día' : String(e.start).slice(11, 16)}</span><span style="flex:1">${e.summary}</span></div>`)}${drafts.map((q) => html`<a class="wkrow" href="#/sales/quotes" style="text-decoration:none;color:inherit"><span class="chip" style="font-size:11px">${q.status}</span><span style="flex:1">${q.number} · ${q.client}</span></a>`)}`),
      lane('Ads con el agente', 'Tú coordinas y apruebas; el agente ejecuta', byDept(/^⑩/), '⑩ Ads',
        html`${projects.filter((p) => p.pipeline?.['⑩']?.status === 'now').map((p) => html`<a class="wkrow" href="#/operations/pipe" style="text-decoration:none;color:inherit"><span class="chip red" style="font-size:11px">Gate</span><span style="flex:1">Aprobar pauta · ${p.client || p.name}</span></a>`)}`),
    ];
  }

  // =================== KANBAN ===================
  function kanban(b) {
    const base = kView === 'personal' ? mine() : tasks;
    mount(b, html`<div class="row" style="margin-bottom:14px;gap:8px;flex-wrap:wrap"><div class="tabs" style="margin:0"><button class="${kView === 'personal' ? 'on' : ''}" data-act="kv" data-v="personal">Personal</button><button class="${kView === 'empresa' ? 'on' : ''}" data-act="kv" data-v="empresa">Empresa</button></div>
        <span class="mut sm">${open(base).length} abiertas · arrastra para mover</span></div>
      <div class="kanban wkk">${COLS.map(([s, l, c]) => { const list = base.filter((t) => status(t) === s).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
        return html`<div class="kcol" data-st="${s}" style="${s === 'En curso' ? 'background:rgba(214,243,90,.12)' : ''}"><h4><span class="row" style="gap:8px"><i class="dot" style="background:${c}"></i>${l}</span><span class="mut">${list.length}</span></h4>
          ${(s === 'Hecha' ? list.slice(-12) : list).map(card)}<button class="wkadd" data-act="colAdd" data-s="${s}">+ Añadir tarea</button></div>`; })}</div>`);
    $$('.kcard', b).forEach((c) => c.addEventListener('dragstart', (e) => e.dataTransfer.setData('id', c.dataset.id)));
    $$('.kcol', b).forEach((k) => {
      k.addEventListener('dragover', (e) => { e.preventDefault(); k.classList.add('over'); });
      k.addEventListener('dragleave', () => k.classList.remove('over'));
      k.addEventListener('drop', async (e) => { e.preventDefault(); k.classList.remove('over'); const t = tasks.find((x) => x.id === e.dataTransfer.getData('id')); if (t && status(t) !== k.dataset.st && (await save({ ...t, status: k.dataset.st }))) kanban(b); });
    });
  }

  // =================== PIPELINES ===================
  function pipes(b) {
    const P = PIPES[pipeSel];
    const list = tasks.filter((t) => pipeOf(t) === pipeSel).sort((a, z) => (status(a) === 'Hecha') - (status(z) === 'Hecha') || String(a.due || '9').localeCompare(String(z.due || '9')));
    const ps = projects.filter((p) => (lineOf(p)) === pipeSel);
    mount(b, html`<div class="grid g11">${Object.keys(PIPES).map((k) => html`<div style="${k === pipeSel ? '' : 'opacity:.6'}">${pipeCard(k)}</div>`)}</div>
      <div class="sec-title"><h2>${P.name}</h2><span class="mut sm">Quién lo hace y quién rinde cuentas, hasta llegar a ti</span></div>
      ${ps.length ? html`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px">${ps.map((p) => html`<a class="chip" href="${p.client_slug ? '#/clients/' + p.client_slug : '#/operations/pipe'}" style="padding:7px 12px;text-decoration:none;color:inherit">${p.name} · ${Math.round(((p.phases || []).filter((x) => x.status === 'done').length / Math.max(1, (p.phases || []).length)) * 100)}%</a>`)}</div>`
        : html`<div class="empty" style="margin-bottom:12px"><b>Sin proyectos en este pipeline</b>En Operations → «+ Proyecto» elige el pipeline ${P.name}.</div>`}
      ${list.length ? html`<div class="card"><table><thead><tr><th>Tarea</th><th>Proyecto</th><th>Responsable → rinde cuentas</th><th>Estado</th><th>Vence</th></tr></thead><tbody>
        ${list.map((t) => html`<tr class="click" data-act="task" data-id="${t.id}"><td><b style="font-weight:500">${t.title}</b>${t.dept ? html`<div class="mut sm">${t.dept}</div>` : ''}</td><td class="mut">${proj(t.project_id)?.name || '—'}</td>
          <td><span class="chain">${chain(t).map((k, i) => html`${i ? html`<span class="mut">→</span>` : ''}${av(k, 24)}`)}</span></td><td><span class="chip">${status(t)}</span></td><td>${dueChip(t.due, status(t)) || '—'}</td></tr>`)}</tbody></table></div>`
        : html`<div class="empty"><b>Sin tareas en ${P.name}</b>Las tareas de sus proyectos aparecen aquí.</div>`}`);
  }

  // =================== EQUIPO ===================
  function equipo(b) {
    const ps = people();
    const sel = personSel && person(personSel);
    const list = sel ? tasks.filter((t) => t.assignee === personSel).sort((a, z) => (status(a) === 'Hecha') - (status(z) === 'Hecha') || String(a.due || '9').localeCompare(String(z.due || '9'))) : [];
    mount(b, html`<div class="grid g3">${ps.map((p) => { const k = keyOf(p), s = stats(k), pct = s.total ? Math.round((s.done / s.total) * 100) : 0, boss = bossOf(k);
      return html`<div class="card" data-act="person" data-k="${k}" style="cursor:pointer;${personSel === k ? 'outline:2px solid var(--ink)' : ''}"><div class="row">${av(k, 44)}<div style="flex:1"><b style="font-weight:500;font-size:16px">${p.name}</b><div class="mut sm">${p.title || ''}</div></div><i class="dot" style="background:${s.dot}"></i></div>
        <div class="row" style="margin-top:14px"><span class="big" style="font-size:32px">${s.done}<small>/${s.total}</small></span><div class="sp"></div><span class="sm ${s.late ? '' : 'mut'}" style="${s.late ? 'color:#a3392a;font-weight:700' : ''}">${s.late ? s.late + ' atrasadas' : 'Al día'}</span></div>
        <div class="wkprog"><i style="width:${pct}%"></i></div><div class="mut sm" style="margin-top:8px">${s.open} abiertas · rinde cuentas a ${boss ? nameOf(boss) : 'ti'}</div></div>`; })}</div>
      ${sel ? html`<div class="sec-title"><h2>Tareas de ${sel.name}</h2><button class="btn ghost" data-act="assignTo" style="padding:8px 14px">+ Asignarle</button></div>
        ${list.length ? html`<div class="card">${list.map((t) => html`<div class="wkrow ${status(t) === 'Hecha' ? 'done' : ''}" data-act="task" data-id="${t.id}" style="cursor:pointer"><span class="chip" style="font-size:11px">${status(t)}</span><span style="flex:1">${t.title}<span class="mut sm"> · ${proj(t.project_id)?.name || 'Interno'}</span></span>${dueChip(t.due, status(t))}</div>`)}</div>` : html`<div class="empty"><b>Sin tareas</b>Asígnale con «+ Asignarle».</div>`}` : html`<div class="mut sm" style="margin-top:14px">Toca a una persona para ver su trabajo.</div>`}`);
  }

  // =================== tareas: crear, guardar, abrir ===================
  async function save(t) { try { const r = await TK.save(t); tasks = tasks.map((x) => (x.id === r.id ? r : x)); return r; } catch (e) { toast(e.message, true); return null; } }
  async function create(t) { try { const r = await TK.create({ checklist: [], comments: [], ...t }); tasks.push(r); toast('Tarea creada ✅'); return r; } catch (e) { toast(e.message, true); return null; } }
  const peopleOpts = () => [['', '—'], ...team.filter((p) => p.active !== false).map((p) => [keyOf(p), p.name + (p.title ? ' · ' + p.title : '')])];
  async function newTask(pre = {}) {
    const v = await ask('Nueva tarea', [
      { k: 'title', l: 'Tarea', req: true },
      { k: 'project_id', l: 'Proyecto', t: 'select', opts: [['', '— Interno'], ...projects.map((p) => [p.id, p.name])], v: pre.project_id || '', half: true },
      { k: 'dept', l: 'Departamento', t: 'select', opts: [['', '—'], ...DEPTS.map(([n, name]) => [`${n} ${name}`, `${n} ${name}`])], v: pre.dept || '', half: true },
      { k: 'assignee', l: 'Responsable (lo hace)', t: 'select', opts: peopleOpts(), v: pre.assignee ?? me.email, half: true },
      { k: 'accountable', l: 'Rinde cuentas (lo aprueba)', t: 'select', opts: [['', 'Su jefe directo'], ...peopleOpts().slice(1)], v: pre.accountable || '', half: true },
      { k: 'due', l: 'Vence', t: 'date', v: pre.due || '', half: true },
      { k: 'status', l: 'Estado', t: 'select', opts: COLS.map(([s, l]) => [s, l]), v: pre.status || 'Por empezar', half: true },
    ], 'Crear');
    if (!v) return; if (await create(v)) paint();
  }
  function openTask(t) {
    const draw = () => {
      const p = proj(t.project_id);
      drawer(html`<div class="row"><select class="in" id="wst" style="width:auto">${COLS.map(([s, l]) => html`<option value="${s}" ${s === status(t) ? raw('selected') : ''}>${l}</option>`)}</select><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
        <input class="in" id="wtitle" value="${t.title}" style="font-size:24px;font-weight:500;letter-spacing:-.6px;margin-top:14px;border:0;padding:6px 0;background:transparent">
        <div class="mut">${p ? (p.client ? p.client + ' · ' : '') + p.name : 'Interno'}${pipeOf(t) ? ' · ' + PIPES[pipeOf(t)].name : ''}</div>
        <div class="lbl" style="color:var(--mut);margin-top:14px">Quién lo hace → quién rinde cuentas</div><div class="chain" style="margin-top:6px">${chain(t).map((k, i) => html`${i ? html`<span class="mut">→</span>` : ''}<span class="row" style="gap:6px">${av(k, 26)}<span class="sm">${nameOf(k).split(' ')[0]}</span></span>`)}</div>
        <div class="form" style="margin-top:16px">
          <div class="two"><div><label class="f">Responsable</label><select class="in" id="was">${peopleOpts().map(([k, l]) => html`<option value="${k}" ${k === (t.assignee || '') ? raw('selected') : ''}>${l}</option>`)}</select></div>
            <div><label class="f">Rinde cuentas</label><select class="in" id="wacc">${[['', 'Su jefe directo'], ...peopleOpts().slice(1)].map(([k, l]) => html`<option value="${k}" ${k === (t.accountable || '') ? raw('selected') : ''}>${l}</option>`)}</select></div></div>
          <div class="two"><div><label class="f">Vence</label><input class="in" id="wdue" type="date" value="${t.due || ''}"></div>
            <div><label class="f">Proyecto</label><select class="in" id="wproj"><option value="">— Interno</option>${projects.map((x) => html`<option value="${x.id}" ${x.id === t.project_id ? raw('selected') : ''}>${x.name}</option>`)}</select></div></div>
          <div><label class="f">Descripción</label><textarea class="in" id="wdesc">${t.description || ''}</textarea></div>
          <div><label class="f">Entrega (link de Drive, video, doc)</label><input class="in" id="wlink" value="${t.link || ''}" placeholder="https://drive.google.com/…"></div>
        </div>
        ${t.link && /^https:\/\//.test(t.link) ? html`<a class="artifact" href="${t.link}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin-top:10px"><span class="fi" style="background:#4f7790;color:#fff">${IC.drive}</span><div><b style="font-weight:500">Abrir la entrega</b></div></a>` : ''}
        <b class="sm" style="display:block;margin-top:16px">Checklist</b>
        ${(t.checklist || []).map((c, i) => html`<label class="check"><input type="checkbox" data-act="chk" data-i="${i}" ${c.done ? raw('checked') : ''}> ${c.t}</label>`)}
        <div class="row" style="margin-top:6px"><input class="in" id="wchk" placeholder="Nuevo paso…"><button class="btn ghost" data-act="addchk">+</button></div>
        <div class="row" style="margin-top:20px;flex-wrap:wrap;gap:8px"><button class="btn" data-act="wsave">Guardar</button>${status(t) !== 'En revisión' && status(t) !== 'Hecha' ? html`<button class="btn ghost" data-act="deliver">⇪ Entregar a revisión</button>` : ''}${status(t) === 'En revisión' && accOf(t) === ceoKey && isCeo ? html`<button class="btn ghost" data-act="approve">✓ Aprobar</button>` : ''}<div class="sp"></div><button class="btn ghost" data-act="wdel">🗑</button></div>`,
      {
        chk: async (cb) => { t = collect(); t.checklist[+cb.dataset.i].done = cb.checked; const r = await save(t); if (r) t = r; },
        addchk: async () => { const v = $('#wchk').value.trim(); if (!v) return; t = collect(); t.checklist = [...(t.checklist || []), { t: v, done: false }]; const r = await save(t); if (r) { t = r; draw(); } },
        wsave: async () => { if (await save(collect())) { toast('Guardado ✅'); closeDrawer(); paint(); } },
        deliver: async () => { const c = collect(); if (!c.link) { toast('Pega el link de tu entrega primero', true); $('#wlink').focus(); return; } if (await save({ ...c, status: 'En revisión' })) { toast('Entregado a revisión ✅'); closeDrawer(); paint(); } },
        approve: async () => { if (await save({ ...collect(), status: 'Hecha' })) { toast('Aprobado ✅'); closeDrawer(); paint(); } },
        wdel: async () => { if (!(await confirmAsk(`¿Eliminar «${t.title}»?`))) return; await TK.remove(t.id); tasks = tasks.filter((x) => x.id !== t.id); closeDrawer(); paint(); },
      });
    };
    const collect = () => ({ ...t, title: $('#wtitle').value.trim() || t.title, status: $('#wst').value, assignee: $('#was').value, accountable: $('#wacc').value, due: $('#wdue').value, project_id: $('#wproj').value, description: $('#wdesc').value, link: $('#wlink').value.trim() });
    draw();
  }

  acts(el, {
    tab: (t) => { tab = t.dataset.t; history.replaceState(null, '', '#/work/' + tab); paint(); },
    kv: (t) => { kView = t.dataset.v; history.replaceState(null, '', `#/work/kanban/${kView}`); kanban($('#wbody', el)); },
    pipe: (t) => { pipeSel = t.dataset.k; if (tab !== 'pipes') { tab = 'pipes'; history.replaceState(null, '', '#/work/pipes'); paint(); } else pipes($('#wbody', el)); },
    person: (t) => { personSel = t.dataset.k; if (tab !== 'equipo') { tab = 'equipo'; paint(); } else equipo($('#wbody', el)); },
    task: (t, e) => { if (e.target.closest('input')) return; const x = tasks.find((y) => y.id === t.dataset.id); if (x) openTask(x); },
    tdone: async (cb) => { const t = tasks.find((x) => x.id === cb.dataset.id); if (!(await save({ ...t, status: cb.checked ? 'Hecha' : 'En curso' }))) cb.checked = !cb.checked; else hoy($('#wbody', el)); },
    newTask: () => newTask(),
    colAdd: (t) => newTask({ status: t.dataset.s, assignee: kView === 'personal' ? me.email : '' }),
    laneTask: (t) => newTask({ dept: t.dataset.d }),
    assignTo: () => newTask({ assignee: personSel, accountable: '' }),
  });
  paint();
}
