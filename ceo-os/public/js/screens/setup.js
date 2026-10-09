import { html, raw, mount, col, api, acts, toast, today, teamList, teamDoc, WORK_ROLES, roleName, $, $$, confirmAsk } from '../core.js';

// Arranque: deja la app lista en 4 pasos, con lo que ya dice el repo.
// 1 Equipo (de la tabla de slots del manual) · 2 Clientes y ciclo · 3 Tareas del ciclo · 4 Library base.
const SLOT_ROLES = { CEO: ['ceo'], COO: ['coo'], 'Operador de agentes': ['content'], 'Editor de video': ['video'] };
const SKIP = /^(IA|Scraping|Diseño|Publicaci)/i;
const CYCLE = [['Reunión día 1', 1, 1], ['Plan', 1, 3], ['Calendario y shot list', 2, 3], ['Brand guidelines', 3, 6], ['Producción', 6, 11], ['Montaje', 12, 15], ['Cambios y programación', 16, 19], ['Presentación al cliente', 20, 20]];
const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
// Las tareas de cada ciclo, por departamento: [tarea, día del ciclo en que vence, perfil que la hace]
const TASKS = {
  '①': ['Reunión del día 1 y estrategia del ciclo', 3, 'ceo'],
  '②': ['Elegir las ofertas que se empujan este ciclo', 3, 'ceo'],
  '②B': ['Brand guidelines del ciclo', 6, 'content'],
  '③': ['Plan del ciclo: pilares, campañas y calendario', 3, 'ceo'],
  '④': ['Ideas, guiones y shot list', 3, 'content'],
  '⑤': ['Producción: grabación y fotos (último día: 11)', 11, 'prod'],
  '⑥A': ['Diseño: estáticos, carruseles y stories', 15, 'content'],
  '⑦': ['Edición: reels y derivados', 15, 'video'],
  '⑧': ['Community: ficha y respuestas al día', 19, 'content'],
  '⑨': ['Posting: captions y programación', 19, 'content'],
  '⑩': ['Ads: plan y presupuesto para aprobar', 19, 'ceo'],
};
const SOPS = [
  ['Operaciones', 'SOP', 'Activar el ciclo de contenido', ['coo', 'ceo'], `> **Para qué sirve:** que cada cliente tenga su ciclo del día 1 al 20 sin que nada se atore.
> **Dueño:** COO · **Cuándo se usa:** el día 1 de cada mes · **Herramientas:** Inherent OS, Google Calendar

## Resultado esperado
El proyecto del ciclo creado, con tareas, responsables y fechas, y el cliente con su reunión del día 1.

## Pasos
1. **Día 1** — CEO · reunión con el cliente y estrategia del ciclo
2. **Días 1-3** — plan del ciclo; **2-3** calendario y shot list
3. **Días 3-6** — brand guidelines
4. **Días 6-11** — producción. **El 11 es el último día para producir**
5. **Días 12-15** — montaje: diseño y edición
6. **Días 16-19** — cambios y programación
7. **Día 20** — presentación al cliente. Lo presentado se publica desde el día 1 del mes siguiente

## Checklist de calidad
- [ ] Cada tarea tiene responsable y quién rinde cuentas
- [ ] Las fechas respetan el límite del 11 y del 20
- [ ] Los gates del CEO están marcados: ① Strategy y ⑩ Ads

## Si algo falla
Precio, alcance y fechas → el CEO · lo demás → el COO.`],
  ['Operaciones', 'SOP', 'Revisión de calidad y entrega', ['coo', 'content', 'video'], `> **Para qué sirve:** que nada llegue al cliente sin pasar por QA.
> **Dueño:** COO · **Cuándo se usa:** cada vez que alguien entrega a revisión

## Pasos
1. **Quien hace la pieza** la sube en su Workspace → «Subir trabajo para revisión»
2. **②B Branding** valida que sea de marca
3. **COO** revisa contra el checklist: aprueba o devuelve con comentario
4. Lo aprobado queda listo para programar y para el portal del cliente

## Checklist de calidad
- [ ] Formato y medidas correctas
- [ ] Texto sin errores y con el tono de la marca
- [ ] Audio, subtítulos y logo en su lugar
- [ ] Claims validados

## Errores comunes
- **Devolver sin comentario:** siempre se dice qué cambiar y por qué`],
  ['Video', 'SOP', 'Edición de video con agente', ['video'], `> **Para qué sirve:** editar rápido y de marca con el agente de video.
> **Dueño:** Editor de video · **Herramientas:** agente de video, Drive del cliente

## Pasos
1. Abre el **material del cliente**: calendario, brief y brand assets
2. Confirma formato, objetivo y fecha de entrega en la tarea
3. En tu Workspace → **Agente de video**: elige la plantilla y la pieza → «Preparar prompt»
4. Genera el borrador con el agente y ajusta edición, audio, subtítulos y marca
5. Exporta orgánico y Ads
6. Sube el corte para revisión del COO

## Checklist de calidad
- [ ] Hook en los primeros 2 segundos
- [ ] Subtítulos y safe zones
- [ ] Versiones para orgánico y Ads`],
  ['Contenido', 'SOP', 'Matriz de publicaciones y static ads', ['content'], `> **Para qué sirve:** que cada pieza tenga fecha, canal, formato, idea y CTA.
> **Dueño:** Operador de agentes (Content)

## Pasos
1. En Workspace → Content → **Matriz y publicaciones**: crea cada pieza con su fecha
2. Por cada pieza: formato, idea, caption y CTA
3. Los static ads del ciclo se crean como tareas de ⑥A Diseño gráfico
4. Mueve cada pieza por su estado: Idea → Grabado → Editado → Programado → Publicado

## Checklist de calidad
- [ ] Toda pieza tiene CTA
- [ ] La semana cubre los canales del plan contratado`],
  ['Contenido', 'SOP', 'Setup de community', ['content'], `> **Para qué sirve:** que ⑧ Community responda solo lo que sabe y escale lo demás.

## Pasos
1. Tono y voz de la marca
2. FAQ y respuestas frecuentes (la ficha \`05-comunidad/respuestas.md\` del cliente)
3. Reglas de escalamiento: precio, alcance y fechas al CEO; lo demás al COO
4. Plantillas de respuesta

## Checklist de calidad
- [ ] Nunca se dicen costos ni márgenes
- [ ] Nunca se compromete precio, fecha o alcance`],
  ['Business Growth', 'Playbook', 'Activar un proyecto Business Growth', ['finance', 'ceo'], `> **Objetivo:** que el cliente gane más y gaste menos, con números.
> **Para quién:** Finance + Business mapping

## La jugada
Diagnóstico → auditoría con el especialista → plan → implementación → revisión.

## Paso a paso
1. **Diagnóstico** — leer los números y mapear el negocio
2. **Auditoría** — con el especialista de la industria
3. **Plan** — un proyecto para ganar más y otro para gastar menos
4. **Implementación** — tareas con responsable y fecha
5. **Revisión** — qué movió los números

## Cómo sabemos que funcionó
- Facturación, margen y costo, antes y después`],
];

export async function render(el, { me, alive }) {
  if (me.role !== 'ceo') return mount(el, html`<div class="empty"><b>Solo el CEO</b>El arranque lo hace el CEO.</div>`);
  const T = col('team'), PR = col('projects'), TK = col('tasks'), F = col('folders'), D = col('docs');
  let [team, eco, repo, projects, tasks, folders, docs] = await Promise.all([teamList(), api('repo/economia').catch(() => ({ slots: [] })), api('repo/clients').catch(() => ({ clients: [] })), PR.list(), TK.list(), F.list(), D.list()]);
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s*\(.*\)/, '').trim();
  const meP = team.find((p) => p.id === me.email);
  // Personas del manual, juntando los roles de cada una.
  const fromSlots = new Map();
  for (const s of eco.slots || []) {
    if (SKIP.test(s.slot)) continue;
    const isAgent = /agente/i.test(s.hoy); const name = s.hoy.split(/\s+—\s+/)[0].replace(/\s*\(.*\)/, '').trim();
    const k = s.slot === 'CEO' ? 'ceo' : norm(name);
    const x = fromSlots.get(k) || { name, slots: [], roles: [], ia: isAgent }; x.slots.push(s.slot); (SLOT_ROLES[s.slot] || []).forEach((r) => !x.roles.includes(r) && x.roles.push(r)); fromSlots.set(k, x);
  }
  const rows = [...fromSlots.entries()].map(([k, x]) => {
    const cur = k === 'ceo' ? meP : team.find((p) => norm(p.name) === k || norm(p.name).split(' ')[0] === k);
    return { k, name: k === 'ceo' ? (meP?.name || me.name) : x.name, title: x.slots.join(' · '), roles: cur?.roles?.length ? cur.roles : x.roles, email: cur?.email || (k === 'ceo' ? me.email : ''), cur, ia: x.ia, slots: x.slots };
  });
  for (const p of team) if (!rows.some((r) => r.cur?.id === p.id) && p.id !== me.email) rows.push({ k: p.id, name: p.name, title: p.title || '', roles: p.roles || [], email: p.email || '', cur: p, ia: p.kind === 'ia', slots: [] });
  const clients = repo.clients.filter((c) => c.hasPlan);
  const mes = today().slice(0, 7);
  let start = `${mes}-01`;
  const done = { team: team.length > 1 && rows.every((r) => r.ia || r.cur), ciclo: clients.length && clients.every((c) => projects.some((p) => p.client_slug === c.slug && p.cycle === mes)), tareas: tasks.some((t) => t.cycle === mes), lib: SOPS.every(([, , t]) => docs.some((d) => d.title === `${SOPS.find((s) => s[2] === t)[1]} · ${t}`)) };

  function paint() {
    if (!alive()) return;
    const step = (n, key, title, sub, body, btn) => html`<div class="card wkbox setup ${done[key] ? 'ok' : ''}"><div class="wkhead"><span class="stepn">${done[key] ? '✓' : n}</span><div class="grow"><h3>${title}</h3><span class="mut sm">${sub}</span></div>${btn}</div>${body}</div>`;
    mount(el, html`<div class="wktop"><div><h1>Arranque</h1><p class="mut">Deja la app lista con lo que ya dice el repo. 4 pasos, en orden.</p></div></div>
      ${step(1, 'team', 'Equipo y perfiles', 'Sale de la tabla de slots del manual. Pon el correo de cada quien para que pueda entrar con Google.', html`
        <table class="wktable"><thead><tr><th>Persona</th><th>En el manual</th><th>Correo @inherentglobal.com</th><th>Perfiles de trabajo</th></tr></thead><tbody>
        ${rows.map((r, i) => html`<tr data-row="${i}"><td><b style="font-weight:500">${r.name}</b>${r.ia ? html`<span class="chip sm2" style="margin-left:6px">Agente IA</span>` : ''}</td><td class="mut sm">${r.title || '—'}</td>
          <td>${r.ia ? html`<span class="mut sm">No entra a la app</span>` : html`<input class="in sm" data-f="email" value="${r.email}" placeholder="nombre@inherentglobal.com" ${r.k === 'ceo' ? raw('disabled') : ''}>`}</td>
          <td>${r.ia ? '' : WORK_ROLES.map(([k, l]) => html`<label class="chip sm2" style="cursor:pointer;margin:2px"><input type="checkbox" data-f="role" value="${k}" ${r.roles.includes(k) ? raw('checked') : ''} style="margin-right:3px">${l.split(' · ')[0]}</label>`)}</td></tr>`)}</tbody></table>`,
        html`<button class="btn xs" data-act="doTeam">${done.team ? 'Actualizar' : 'Guardar equipo'}</button>`)}
      ${step(2, 'ciclo', 'Clientes y ciclo del mes', `Crea el proyecto del ciclo ${mes} de cada cliente, con sus fases del día 1 al 20 y solo los departamentos de su plan.`, html`
        <div class="row" style="gap:10px;margin:6px 0"><span class="sm">Día 1 del ciclo:</span><input class="in sm" type="date" id="start" value="${start}" style="max-width:170px"></div>
        ${clients.map((c) => { const has = projects.some((p) => p.client_slug === c.slug && p.cycle === mes); return html`<label class="wkcheck"><input type="checkbox" data-client="${c.slug}" ${has ? raw('checked disabled') : raw('checked')}><span><b style="font-weight:500">${c.slug.toUpperCase()}</b><span class="mut sm"> · ${String(c.plan || '').replace(/^[⬜🔷🟨]️?\s*/u, '')}${has ? ' · ya creado' : ''}</span></span></label>`; })}`,
        html`<button class="btn xs" data-act="doCycle">Crear ciclos</button>`)}
      ${step(3, 'tareas', 'Tareas del ciclo', 'Una tarea por departamento de cada cliente, con responsable según su perfil, quién rinde cuentas y fecha según el calendario del ciclo.', html`<div class="mut sm" id="prev3">${preview()}</div>`,
        html`<button class="btn xs" data-act="doTasks">Crear tareas</button>`)}
      ${step(4, 'lib', 'Library base', 'Carpetas y SOPs de arranque, cada uno marcado para su perfil (salen en el Workspace de quien lo usa).', html`<div class="wksops">${SOPS.map(([f, k, t]) => html`<span class="wksop"><span class="ftype" style="background:${k === 'SOP' ? '#4f7790' : '#7f9631'}">${k.slice(0, 3).toUpperCase()}</span>${t}<span class="mut sm"> · ${f}</span></span>`)}</div>`,
        html`<button class="btn xs" data-act="doLib">Crear Library base</button>`)}
      <div class="mut sm" style="margin-top:12px">Todo se puede editar después. Nada de esto toca el repo.</div>`);
  }
  const holder = (role) => { const p = team.find((x) => x.active !== false && (x.roles || []).includes(role)); return p ? p.email || p.id : null; };
  const prodHolder = () => { const p = team.find((x) => /producci|grabaci/i.test(x.title || '')); return p ? p.email || p.id : holder('content'); };
  function plannedTasks() {
    const out = [];
    for (const p of projects.filter((x) => x.cycle === mes)) {
      const s = p.phases?.[0]?.start || start;
      for (const [n] of DEPTS) {
        if (p.pipeline?.[n]?.status === 'off' || !TASKS[n]) continue;
        if (tasks.some((t) => t.project_id === p.id && t.dept?.startsWith(n + ' '))) continue;
        const [title, day, role] = TASKS[n]; const who = role === 'prod' ? prodHolder() : holder(role);
        out.push({ title, project_id: p.id, dept: `${n} ${DEPTS.find(([x]) => x === n)[1]}`, assignee: who || '', accountable: role === 'ceo' ? '' : holder('coo') || '', due: addDays(s, day - 1), status: 'Por empezar', cycle: mes });
      }
      if (!tasks.some((t) => t.project_id === p.id && /QA final/.test(t.title))) out.push({ title: 'QA final del ciclo', project_id: p.id, dept: '', assignee: holder('coo') || '', accountable: '', due: addDays(s, 18), status: 'Por empezar', cycle: mes });
      if (!tasks.some((t) => t.project_id === p.id && /Presentaci/.test(t.title))) out.push({ title: 'Presentación al cliente (día 20)', project_id: p.id, dept: '① Strategy', assignee: holder('ceo') || me.email, accountable: '', due: addDays(s, 19), status: 'Por empezar', cycle: mes });
    }
    return out;
  }
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
        toast('Equipo listo ✅'); setTimeout(() => location.reload(), 600);
      } catch (e) { toast(e.message, true); b.disabled = false; }
    },
    doCycle: async (b) => {
      start = $('#start', el).value || start; b.disabled = true;
      try {
        let n = 0;
        for (const cb of $$('[data-client]:not([disabled])', el)) {
          if (!cb.checked) continue; const c = clients.find((x) => x.slug === cb.dataset.client);
          const inPlan = c.pipeline?.length ? new Set(c.pipeline.map((r) => (r.paso.match(/^[①-⑩][A-Z]?/) || [''])[0])) : null;
          const r = await PR.create({ name: `${c.slug.toUpperCase()} · ciclo ${mes}`, kind: 'Ciclo mensual', line: 'contenido', cycle: mes, client: c.slug.toUpperCase(), client_slug: c.slug, color: ['olive', 'terra', 'ink'][n % 3],
            phases: CYCLE.map(([name, a, z], i) => ({ name, start: addDays(start, a - 1), end: addDays(start, z - 1), status: i === 0 ? 'now' : 'todo' })),
            pipeline: Object.fromEntries(DEPTS.map(([d]) => [d, { status: inPlan && !inPlan.has(d) ? 'off' : 'todo' }])) });
          projects.push(r); n++;
        }
        toast(`${n} ciclo${n === 1 ? '' : 's'} creado${n === 1 ? '' : 's'} ✅`); done.ciclo = true; paint();
      } catch (e) { toast(e.message, true); b.disabled = false; }
    },
    doTasks: async (b) => {
      const l = plannedTasks(); if (!l.length) return toast('No hay tareas nuevas que crear');
      if (!(await confirmAsk(`¿Crear ${l.length} tareas del ciclo ${mes}?`))) return;
      b.disabled = true;
      try { for (const t of l) tasks.push(await TK.create({ checklist: [], comments: [], ...t })); toast(`${l.length} tareas creadas ✅`); done.tareas = true; paint(); }
      catch (e) { toast(e.message, true); b.disabled = false; }
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
        toast(n ? `${n} documentos creados ✅` : 'La Library base ya estaba'); done.lib = true; paint();
      } catch (e) { toast(e.message, true); b.disabled = false; }
    },
  });
  paint();
}
function addDays(s, n) { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
