import { CYCLE, DEPTS, addDays, tasksFor, phasesFor, deptsOfPlan, createLinked } from '../cycle.js';
import { loadRecipes } from '../recetas.js';
import { html, raw, mount, col, api, acts, toast, today, teamList, teamDoc, WORK_ROLES, roleName, $, $$, confirmAsk, ask, ico } from '../core.js';
import { SOPS, filasEquipo, hechosArranque } from '../arranque.js';

// Arranque: deja la app lista en 5 pasos, con lo que ya dice el repo.
// 1 Equipo (de la tabla de slots del manual) · 2 Clientes y ciclo · 3 Tareas del ciclo · 4 Library base · 5 Carpeta de entregas.
// Los pasos, los SOPs base y cuál ya está viven en arranque.js (puro): el aviso pla-arranque usa el mismo cálculo.

export async function render(el, { me, alive }) {
  if (me.role !== 'ceo') return mount(el, html`<div class="empty"><b>Solo el CEO</b>El arranque lo hace el CEO.</div>`);
  const T = col('team'), PR = col('projects'), TK = col('tasks'), F = col('folders'), D = col('docs');
  let [team, eco, repo, projects, tasks, folders, docs, driveCfg, R] = await Promise.all([teamList(), api('repo/economia').catch(() => ({ slots: [] })), api('repo/clients').catch(() => ({ clients: [] })), PR.list(), TK.list(), F.list(), D.list(), col('settings').get('drive').catch(() => null), loadRecipes()]);
  // Personas del manual, juntando los roles de cada una (arranque.js, el mismo cálculo del aviso pla-arranque).
  const rows = filasEquipo(eco.slots, team, me);
  const clients = repo.clients.filter((c) => c.hasPlan);
  const mes = today().slice(0, 7);
  let start = `${mes}-01`;
  const done = hechosArranque({ drive: driveCfg, team, rows, clients, projects, tasks, docs, mes });

  function paint() {
    if (!alive()) return;
    const step = (n, key, title, sub, body, btn) => html`<div class="card wkbox setup ${done[key] ? 'ok' : ''}"><div class="wkhead"><span class="stepn">${done[key] ? ico('check', 14) : n}</span><div class="grow"><h3>${title}</h3><span class="mut sm">${sub}</span></div>${btn}</div>${body}</div>`;
    mount(el, html`<div class="wktop"><div><h1>Arranque</h1><p class="mut">Deja la app lista con lo que ya dice el repo. 5 pasos, en orden.</p></div></div>
      ${step(1, 'team', 'Equipo y perfiles', 'Sale de la tabla de slots del manual. Con correo entra con Google; sin correo queda solo en el organigrama y la nómina.', html`
        <table class="wktable"><thead><tr><th>Persona</th><th>En el manual</th><th>Correo @inherentglobal.com</th><th>Perfiles de trabajo</th></tr></thead><tbody>
        ${rows.map((r, i) => html`<tr data-row="${i}"><td><b style="font-weight:500">${r.name}</b>${r.ia ? html`<span class="chip sm2" style="margin-left:6px">Agente IA</span>` : ''}</td><td class="mut sm">${r.title || '—'}</td>
          <td>${r.ia ? html`<span class="mut sm">No entra a la app</span>` : html`<input class="in sm" data-f="email" value="${r.email}" placeholder="nombre@inherentglobal.com" ${r.k === 'ceo' ? raw('disabled') : ''}>`}</td>
          <td>${r.ia ? '' : WORK_ROLES.map(([k, l]) => html`<label class="chip sm2" style="cursor:pointer;margin:2px"><input type="checkbox" data-f="role" value="${k}" ${r.roles.includes(k) ? raw('checked') : ''} style="margin-right:3px">${l.split(' · ')[0]}</label>`)}</td></tr>`)}</tbody></table>`,
        html`<button class="btn ghost xs" data-act="addRow">+ Persona</button><button class="btn xs" data-act="doTeam">${done.team ? 'Actualizar' : 'Guardar equipo'}</button>`)}
      ${step(2, 'ciclo', 'Clientes y ciclo del mes', `Crea el proyecto del ciclo ${mes} de cada cliente, con sus fases del día 1 al 20 y solo los departamentos de su plan.`, html`
        <div class="row" style="gap:10px;margin:6px 0"><span class="sm">Día 1 del ciclo:</span><input class="in sm" type="date" id="start" value="${start}" style="max-width:170px"></div>
        ${clients.map((c) => { const has = projects.some((p) => p.client_slug === c.slug && p.cycle === mes); return html`<label class="wkcheck"><input type="checkbox" data-client="${c.slug}" ${has ? raw('checked disabled') : raw('checked')}><span><b style="font-weight:500">${c.slug.toUpperCase()}</b><span class="mut sm"> · ${String(c.plan || '').replace(/^[⬜🔷🟨]\uFE0F?\s*/u, '')}${has ? ' · ya creado' : ''}</span></span></label>`; })}`,
        html`<button class="btn xs" data-act="doCycle">Crear ciclos</button>`)}
      ${step(3, 'tareas', 'Tareas del ciclo', 'Una tarea por departamento de cada cliente, con responsable según su perfil, quién rinde cuentas y fecha según el calendario del ciclo.', html`<div class="mut sm" id="prev3">${preview()}</div>`,
        html`<button class="btn xs" data-act="doTasks">Crear tareas</button>`)}
      ${step(4, 'lib', 'Library base', 'Carpetas y SOPs de arranque, cada uno marcado para su perfil (salen en el Workspace de quien lo usa).', html`<div class="wksops">${SOPS.map(([f, k, t]) => html`<span class="wksop"><span class="ftype" style="background:${k === 'SOP' ? 'var(--ui-ink2)' : 'var(--ui-ink2)'}">${k.slice(0, 3).toUpperCase()}</span>${t}<span class="mut sm"> · ${f}</span></span>`)}</div>`,
        html`<button class="btn xs" data-act="doLib">Crear Library base</button>`)}
      ${step(5, 'drive', 'Carpeta de entregas en Drive', 'Todo lo que el equipo suba (entregas y videos grabados) cae aquí, ordenado por cliente y mes. Nada se guarda en la web: solo el link.', html`
        <ol class="sm" style="margin:6px 0 10px 18px;line-height:1.7"><li>En Google Drive crea una carpeta (ej. «Inherent · Entregas»), mejor en una unidad compartida.</li><li>Compártela como <b>Editor</b> con todo el equipo.</li><li>Pega aquí su link.</li></ol>
        <input class="in" id="droot" value="${driveCfg?.root || ''}" placeholder="https://drive.google.com/drive/folders/…">`,
        html`<button class="btn xs" data-act="doDrive">Guardar carpeta</button>`)}
      <div class="mut sm" style="margin-top:12px">Todo se puede editar después. Nada de esto toca el repo.</div>`);
  }
  const holder = (role) => { const p = team.find((x) => x.active !== false && (x.roles || []).includes(role)); return p ? p.email || p.id : null; };
  const plannedTasks = () => projects.filter((x) => x.cycle === mes).flatMap((p) => tasksFor(p, team, tasks, me.email, R));
  function preview() {
    const l = plannedTasks();
    if (!projects.some((x) => x.cycle === mes)) return 'Primero crea los ciclos (paso 2).';
    if (!l.length) return 'Las tareas de este ciclo ya están creadas.';
    const by = {}; l.forEach((t) => { const n = t.assignee ? (team.find((p) => p.id === t.assignee || p.email === t.assignee)?.name || t.assignee) : 'Sin responsable'; by[n] = (by[n] || 0) + 1; });
    return `Se van a crear ${l.length} tareas: ${Object.entries(by).map(([n, c]) => `${n.split(' ')[0]} ${c}`).join(' · ')}.`;
  }

  acts(el, {
    doTeam: async (b) => {
      b.disabled = true;
      try {
        const order = [...rows.entries()].sort(([, a], [, z]) => (z.roles.includes('coo') && !z.roles.includes('ceo')) - (a.roles.includes('coo') && !a.roles.includes('ceo')));
        for (const [i, r] of order) {
          if (r.ia) { if (!r.cur) team.push(await T.create({ name: r.name, title: r.title, kind: 'ia', active: true, reports_to: holder('coo') || me.email })); continue; }
          const tr = $(`tr[data-row="${i}"]`, el); const email = (tr.querySelector('[data-f=email]')?.value || '').trim().toLowerCase();
          if (email && !/^[^@\s]+@inherentglobal\.com$/.test(email)) { toast(`Correo inválido para ${r.name}: debe ser @inherentglobal.com`, true); b.disabled = false; return; }
          const roles = [...tr.querySelectorAll('[data-f=role]:checked')].map((x) => x.value);
          const data = { name: r.name, title: r.title || r.cur?.title || '', roles, kind: 'persona', active: true };
          if (r.k === 'ceo') { const cur = await T.get(me.email); await T.save(teamDoc({ ...cur, roles })); continue; }
          if (r.cur && (!email || r.cur.id === email)) { const s = await T.save(teamDoc({ ...r.cur, ...data, ...(email ? { email } : {}), reports_to: r.cur.reports_to || (roles.includes('coo') ? me.email : holder('coo') || me.email) })); team = team.map((x) => (x.id === s.id ? s : x)); r.cur = s; continue; }
          if (r.cur && email && r.cur.id !== email) { // pasa de id generado a su correo, y mueve sus tareas y su gente
            const nu = await T.create({ ...teamDoc(r.cur), ...data, id: email, email }).catch(async () => T.save({ ...(await T.get(email)), ...data }));
            for (const t of tasks.filter((x) => x.assignee === r.cur.id || x.accountable === r.cur.id)) await TK.save({ ...t, assignee: t.assignee === r.cur.id ? email : t.assignee, accountable: t.accountable === r.cur.id ? email : t.accountable });
            for (const p of team.filter((x) => x.reports_to === r.cur.id)) await T.save(teamDoc({ ...p, reports_to: email }));
            await T.remove(r.cur.id); team = team.filter((x) => x.id !== r.cur.id).concat(nu); r.cur = nu; continue;
          }
          const boss = roles.includes('coo') ? me.email : holder('coo') || me.email;
          r.cur = await T.create({ ...data, ...(email ? { id: email, email } : {}), reports_to: boss }); team.push(r.cur);
        }
        toast('Equipo listo'); setTimeout(() => location.reload(), 600);
      } catch (e) { toast(e.message, true); b.disabled = false; }
    },
    addRow: async () => {
      const v = await ask('Agregar persona', [{ k: 'name', l: 'Nombre', req: true }, { k: 'title', l: 'Qué hace', half: true }, { k: 'email', l: 'Correo (opcional)', t: 'email', half: true }, { k: 'roles', l: 'Perfiles de trabajo', t: 'checks', opts: WORK_ROLES }]);
      if (!v) return; rows.push({ k: v.name.toLowerCase(), name: v.name, title: v.title, roles: v.roles, email: v.email || '', cur: null, ia: false, slots: [] }); paint();
    },
    doCycle: async (b) => {
      start = $('#start', el).value || start; b.disabled = true;
      try {
        let n = 0;
        for (const cb of $$('[data-client]:not([disabled])', el)) {
          if (!cb.checked) continue; const c = clients.find((x) => x.slug === cb.dataset.client);
          const inPlan = new Set(deptsOfPlan(c));
          const r = await PR.create({ name: `${c.slug.toUpperCase()} · ciclo ${mes}`, kind: 'Ciclo mensual', line: 'contenido', cycle: mes, client: c.slug.toUpperCase(), client_slug: c.slug, color: ['olive', 'terra', 'ink'][n % 3],
            phases: phasesFor('Ciclo mensual', start),
            pipeline: Object.fromEntries(DEPTS.map(([d]) => [d, { status: inPlan.has(d) ? 'todo' : 'off' }])) });
          projects.push(r); n++;
        }
        toast(`${n} ciclo${n === 1 ? '' : 's'} creado${n === 1 ? '' : 's'}`); done.ciclo = true; paint();
      } catch (e) { toast(e.message, true); b.disabled = false; }
    },
    doTasks: async (b) => {
      const l = plannedTasks(); if (!l.length) return toast('No hay tareas nuevas que crear');
      if (!(await confirmAsk(`¿Crear ${l.length} tareas del ciclo ${mes}?`))) return;
      b.disabled = true;
      try { for (const p of projects.filter((x) => x.cycle === mes)) tasks.push(...(await createLinked(tasksFor(p, team, tasks, me.email, R), (t) => TK.create(t)))); toast(`${l.length} tareas creadas`); done.tareas = true; paint(); }
      catch (e) { toast(e.message, true); b.disabled = false; }
    },
    doDrive: async () => {
      const root = $('#droot', el).value.trim();
      if (!/^https:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?folders\/[-\w]{20,}/.test(root)) return toast('Pega el link de una carpeta de Drive (drive.google.com/drive/folders/…)', true);
      try { const S = col('settings'); driveCfg = driveCfg ? await S.save({ ...driveCfg, root }) : await S.create({ id: 'drive', root }); done.drive = true; toast('Carpeta de entregas guardada'); paint(); } catch (e) { toast(e.message, true); }
    },
    doLib: async (b) => {
      b.disabled = true;
      try {
        let n = 0;
        for (const [fname, kind, title, roles, body] of SOPS) {
          const full = `${kind} · ${title}`; if (docs.some((d) => d.title === full)) continue;
          let f = folders.find((x) => x.name === fname); if (!f) { f = await F.create({ name: fname, tone: { Operaciones: 'cafe', Contenido: 'oliva', Video: 'gris', 'Business Growth': 'terra' }[fname] || 'gris' }); folders.push(f); }
          docs.push(await D.create({ title: full, kind, folder_id: f.id, roles, body: `# ${full}\n\n${body}\n` })); n++;
        }
        toast(n ? `${n} documentos creados` : 'La Library base ya estaba'); done.lib = true; paint();
      } catch (e) { toast(e.message, true); b.disabled = false; }
    },
  });
  paint();
}
