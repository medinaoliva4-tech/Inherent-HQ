import { html, raw, mount, col, api, acts, toast, fdate, today, initials, IC, $, $$, ask, confirmAsk, drawer, closeDrawer, teamList, uploadToDrive, WORK_ROLES, roleName } from '../core.js';
import { editPost, loadPosts, PSTATUS } from '../posts.js';

// Workspace: cada persona trabaja desde el perfil (o los perfiles) que tiene asignados en Team.
// Todos tienen su kanban personal, el de la empresa y sus tareas. Cada perfil agrega lo suyo:
// checklist del ciclo, SOPs, subir trabajo a revisión y el material del cliente.
const COLS = [['Por empezar', 'Por hacer', '#a39a8c'], ['En curso', 'En progreso', '#7f9631'], ['En revisión', 'En revisión', '#b08a5f'], ['Hecha', 'Hecha', '#4f6b12']];
const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
const PIPES = { contenido: { name: 'Contenido', sub: 'Marketing · producción y entrega', bar: '#5c6b22' }, growth: { name: 'Business Growth', sub: 'Consultoría que opera', bar: '#b8583c' } };
const COLORS = ['#26201a', '#c2735a', '#4f7790', '#7f9631', '#b08a5f', '#6b5a45'];
// El checklist del ciclo de cada perfil (se marca por mes).
const CHECK = {
  coo: ['Confirmar alcance, entregables y fechas del ciclo', 'Definir responsable y quién rinde cuentas por tarea', 'Armar dependencias del ciclo (qué espera a qué)', 'Revisar la carga del equipo y resolver bloqueos', 'Validar entregables contra su checklist (QA final)', 'Preparar la presentación del día 20', 'Cerrar el ciclo y documentar aprendizajes'],
  video: ['Abrir calendario y brief vigente del cliente', 'Confirmar formato, objetivo y fecha de entrega', 'Preparar el prompt con la plantilla aprobada', 'Generar el borrador con el agente de video', 'Revisar edición, audio, subtítulos y marca', 'Exportar versiones para orgánico y Ads', 'Subir los finales para QA del COO'],
  content: ['Idea aprobada: enfoque y objetivo', 'Hook y ángulo validados', 'Guion y copy con el tono de la marca', 'Formato y piezas por canal', 'Assets listos: diseño, copy y links', 'Matriz de publicaciones de la semana', 'Static ads del ciclo'],
  finance: ['Leer los números del cliente', 'Mapa del negocio: procesos y equipo', 'Proyecto para que ganen más', 'Proyecto para que gasten menos', 'Entregar el reporte y el plan'],
};
const COMMUNITY = ['Tono y voz de la marca', 'FAQ y respuestas frecuentes', 'Reglas de escalamiento', 'Plantillas de respuesta'];
const VTPL = {
  reel: ['Reel · marca + storytelling', 'Hook visual en los primeros 1-2 s. Arco: problema → giro → resultado. Cortes cada 1.5-2 s, texto en pantalla corto, subtítulos quemados. Cierre con CTA claro.'],
  ugc: ['UGC · testimonio', 'Persona real a cámara, luz natural, tono conversacional. Abre con el resultado, luego el antes, luego cómo. B-roll del producto. Sin look de anuncio.'],
  ads: ['Anuncio vertical · Ads', 'Hook en el primer segundo con el beneficio. 3 variantes de hook sobre el mismo cuerpo. Producto en pantalla antes del segundo 3. CTA y oferta al final. Safe zones de Meta.'],
  corte: ['Derivado · corte corto', 'Toma el mejor momento del video largo (6-15 s). Un solo mensaje. Loop limpio al final.'],
};
const ymNow = () => today().slice(0, 7);

export async function render(el, { me, sub, alive }) {
  const TK = col('tasks'), CK = col('checks');
  const isCeo = me.role === 'ceo';
  let [tasks, projects, team, content, docs, checks, quotes] = await Promise.all([
    TK.list(), col('projects').list(), teamList(), col('content').list().catch(() => []), col('docs').list().catch(() => []), CK.list().catch(() => []),
    isCeo ? col('quotes').list().catch(() => []) : [],
  ]);
  const meP = team.find((p) => p.id === me.email || p.email === me.email);
  const myRoles = (meP?.roles?.length ? meP.roles : me.roles?.length ? me.roles : isCeo ? ['ceo'] : me.role === 'coo' ? ['coo'] : []);
  const pref = (() => { try { return localStorage.getItem('work.role'); } catch { return null; } })();
  let role = myRoles.includes(sub[1]) ? sub[1] : myRoles.includes(pref) ? pref : myRoles[0] || null;
  let tab = ['zona', 'kanban', 'pipes', 'equipo'].includes(sub[0]) ? sub[0] : 'zona';
  let kView = 'personal', pipeSel = 'contenido', personSel = null, ctab = 'ideas', clientSel = null, ceoLane = 'estrategia';
  let agenda = null, clientInfo = {}, posts = null;
  const T0 = today(), T1 = addDays(T0, 1), T7 = addDays(T0, 7);
  const canCoord = isCeo || myRoles.includes('coo');

  // ---------- personas y responsabilidad ----------
  const keyOf = (p) => p.email || p.id;
  const person = (k) => team.find((p) => p.id === k || p.email === k);
  const nameOf = (k) => person(k)?.name || (k === me.email ? me.name : k ? String(k).split('@')[0] : '—');
  const ceoKey = keyOf(team.find((p) => !p.reports_to && p.role === 'ceo') || meP || { id: me.email });
  const cooKey = keyOf(team.find((p) => (p.roles || []).includes('coo')) || { id: ceoKey });
  const bossOf = (k) => { const p = person(k); const b = p?.reports_to && person(p.reports_to); return b ? keyOf(b) : null; };
  const accOf = (t) => t.accountable || bossOf(t.assignee) || ceoKey;
  const chain = (t) => { const out = [t.assignee || null]; let k = accOf(t); const seen = new Set(out); while (k && !seen.has(k) && out.length < 6) { out.push(k); seen.add(k); k = bossOf(k); } if (!seen.has(ceoKey)) out.push(ceoKey); return out.filter(Boolean); };
  const av = (k, size = 24) => { const p = person(k); const n = p?.name || nameOf(k); return p?.picture
    ? html`<img src="${p.picture}" referrerpolicy="no-referrer" alt="" title="${n}" class="wav" style="width:${size}px;height:${size}px">`
    : html`<span class="av" title="${n}" style="width:${size}px;height:${size}px;font-size:${Math.round(size / 2.6)}px;background:${p?.color || COLORS[(n.length || 0) % COLORS.length]}">${initials(n)}</span>`; };
  const proj = (id) => projects.find((p) => p.id === id);
  const lineOf = (p) => (p.line === 'growth' || /growth/i.test(p.kind || '') ? 'growth' : 'contenido');
  const pipeOf = (t) => { const p = proj(t.project_id); return p ? lineOf(p) : null; };
  const status = (t) => t.status || 'Por empezar';
  const isMine = (t) => t.assignee === me.email || (meP && t.assignee === meP.id);
  const mine = () => tasks.filter(isMine);
  const open = (l) => l.filter((t) => status(t) !== 'Hecha');
  const clientOf = (t) => proj(t.project_id)?.client_slug || null;
  const dueChip = (d, st) => { if (!d || st === 'Hecha') return d ? html`<span class="mut sm">${fdate(d)}</span>` : '';
    return d < T0 ? html`<span class="chip red sm2">Atrasada</span>` : d === T0 ? html`<span class="chip red sm2">Hoy</span>` : d === T1 ? html`<span class="chip amber sm2">Mañana</span>` : html`<span class="mut sm">${fdate(d)}</span>`; };
  const trow = (t, extra = '') => html`<div class="wkrow ${status(t) === 'Hecha' ? 'done' : ''}" data-act="task" data-id="${t.id}">${extra}${t.assignee ? av(t.assignee, 20) : ''}<span class="grow">${t.title}<span class="mut sm"> · ${proj(t.project_id)?.client || proj(t.project_id)?.name || 'Interno'}</span></span>${dueChip(t.due, status(t))}</div>`;
  const kpis = (list) => html`<div class="wkkpis">${list.map(([l, v, c, act]) => html`<div class="wkkpi" ${act ? raw(`data-act="${act}"`) : ''}><span class="lbl">${l}</span><b style="${c ? `color:${c}` : ''}">${v}</b></div>`)}</div>`;
  const box = (title, sub, body, right = '') => html`<div class="card wkbox"><div class="wkhead"><div><h3>${title}</h3>${sub ? html`<span class="mut sm">${sub}</span>` : ''}</div><div class="sp"></div>${right}</div>${body}</div>`;

  // ---------- pantalla ----------
  function paint() {
    if (!alive()) return;
    const tabs = [['zona', role ? roleName(role).split(' · ')[0] : 'Mi trabajo'], ['kanban', 'Kanban'], ...(canCoord ? [['pipes', 'Pipelines'], ['equipo', 'Equipo']] : [])];
    mount(el, html`<div class="wktop"><div><h1>Workspace</h1><p class="mut">${role ? roleName(role) : 'Tu trabajo, en orden'}</p></div><div class="sp"></div>
        ${myRoles.length > 1 ? html`<div class="tabs" style="margin:0">${myRoles.map((r) => html`<button class="${r === role ? 'on' : ''}" data-act="role" data-r="${r}">${roleName(r).split(' · ')[0]}</button>`)}</div>` : ''}
        <button class="btn" data-act="newTask">+ Tarea</button></div>
      <div class="tabs" style="margin:0 0 14px">${tabs.map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>
      <div id="wbody"></div>`);
    const b = $('#wbody', el);
    if (tab === 'zona') return (ZONES[role] || noRole)(b);
    ({ kanban, pipes, equipo })[tab](b);
  }
  function noRole(b) {
    mount(b, html`<div class="grid g11">${box('Mis tareas', 'Lo que tienes abierto', myList(8))}${box('Todavía no tienes un perfil de trabajo', '', html`<div class="mut sm" style="padding:6px 0">El CEO te lo asigna en <b>Team → tu perfil → Perfiles de trabajo</b>. Mientras, usa tu Kanban.</div>`)}</div>`);
  }
  const myList = (n) => { const l = open(mine()).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9'))); return l.length ? html`${l.slice(0, n).map((t) => trow(t, html`<input type="checkbox" data-act="tdone" data-id="${t.id}">`))}` : html`<div class="mut sm" style="padding:8px 0">Nada abierto.</div>`; };

  // =================== piezas que comparten los perfiles ===================
  function checklist(r) {
    const id = `${me.email}.${r}.${ymNow()}`, doc = checks.find((c) => c.id === id), done = doc?.done || [];
    const items = CHECK[r] || [];
    return box(`Checklist · ${roleName(r).split(' · ')[0]}`, `Ciclo ${ymNow()}`, html`${items.map((t, i) => html`<label class="wkcheck"><input type="checkbox" data-act="ck" data-r="${r}" data-i="${i}" ${done.includes(i) ? raw('checked') : ''}><span>${t}</span></label>`)}`,
      html`<span class="sm">${done.length}/${items.length}</span><div class="wkprog" style="width:70px;margin:0 0 0 8px"><i style="width:${items.length ? (done.length / items.length) * 100 : 0}%"></i></div>`);
  }
  function sops(r) {
    const list = docs.filter((d) => (d.roles || []).includes(r)).slice(0, 6);
    const KC = { SOP: '#4f7790', Playbook: '#7f9631', Diagrama: '#8a5fa8', Video: '#26201a', Nota: '#c2735a' };
    return box('Mis SOPs y plantillas', 'De la Library', list.length ? html`<div class="wksops">${list.map((d) => html`<a class="wksop" href="#/library/${d.folder_id || '_'}/${d.id}"><span class="ftype" style="background:${KC[d.kind] || '#8f877b'}">${(d.kind || 'Doc').slice(0, 3).toUpperCase()}</span><span>${d.title}</span></a>`)}</div>`
      : html`<div class="mut sm" style="padding:6px 0">En la Library, abre un SOP → Editar → marca el perfil «${roleName(r).split(' · ')[0]}».</div>`, html`<a class="sm mut" href="#/library">Library →</a>`);
  }
  function uploader(label = 'Subir trabajo para revisión') {
    const mineOpen = open(mine()).filter((t) => status(t) !== 'En revisión');
    return html`<div class="card wkbox wkup"><div class="wkhead"><div><h3>${label}</h3><span class="mut sm">Se guarda en tu Drive y pasa a revisión de quien rinde cuentas</span></div></div>
      <div class="wkdrop" id="drop"><div style="font-size:22px">⇪</div><b style="font-weight:500">Arrastra tu archivo aquí</b><span class="mut sm">o</span><label class="btn" style="cursor:pointer">Seleccionar archivo<input type="file" id="upIn" hidden></label><div class="wkbar" id="upBar" hidden><i style="width:0%"></i></div></div>
      <div class="row" style="margin-top:10px;gap:8px"><select class="in" id="upTask" style="flex:1"><option value="">— ¿De qué tarea es? (o crea una nueva)</option>${mineOpen.map((t) => html`<option value="${t.id}">${t.title} · ${proj(t.project_id)?.client || 'Interno'}</option>`)}</select></div></div>`;
  }
  function deliveries() {
    const list = mine().filter((t) => t.link && ['En revisión', 'Hecha'].includes(status(t))).sort((a, z) => String(z._meta?.updated_at).localeCompare(String(a._meta?.updated_at))).slice(0, 4);
    return box('Entregas recientes', html`<span class="wkflow"><span>Tú</span>→<span>Revisión ${nameOf(cooKey).split(' ')[0]}</span>→<span>Portal del cliente</span></span>`,
      list.length ? html`${list.map((t) => html`<div class="wkrow" data-act="task" data-id="${t.id}"><span class="fi">${IC.drive}</span><span class="grow">${t.title}<span class="mut sm"> · ${proj(t.project_id)?.client || 'Interno'}</span></span><span class="chip ${status(t) === 'Hecha' ? 'green' : 'amber'} sm2">${status(t) === 'Hecha' ? 'Aprobado' : 'En revisión'}</span></div>`)}` : html`<div class="mut sm" style="padding:6px 0">Todavía no entregas nada.</div>`);
  }
  function material() {
    const slugs = [...new Set(projects.map((p) => p.client_slug).filter(Boolean))];
    clientSel ||= clientOf(open(mine())[0] || {}) || slugs[0] || null;
    const info = clientSel && clientInfo[clientSel];
    if (clientSel && !info) api(`repo/client/${encodeURIComponent(clientSel)}`).then((r) => { clientInfo[clientSel] = r; if (alive() && tab === 'zona') paint(); }).catch(() => { clientInfo[clientSel] = { links: [], months: [] }; });
    const link = (re) => info?.links?.find((l) => re.test(l.k) && /^https:\/\//.test(l.url || ''))?.url;
    const items = info ? [
      ['📅', 'Calendario vigente', 'Plan de contenido del mes', `#/content/plan/${clientSel}`],
      ['🎨', 'Brand assets', 'Logos, paleta, tipografías', link(/figma|brand|marca/i) || link(/drive/i) || `#/clients/${clientSel}`],
      ['📝', 'Brief y guiones', 'Lo que escribió ④ Creatividad', `#/content/guiones/${clientSel}`],
      ['📁', 'Drive del cliente', 'Fotos, videos, material crudo', link(/drive/i) || `#/clients/${clientSel}`],
      ['📊', 'Plan y pauta', 'Lo que incluye su plan', `#/clients/${clientSel}`],
    ] : [];
    return box('Material del cliente', '', html`<select class="in" id="clientSel" style="margin-bottom:6px">${slugs.map((s) => html`<option value="${s}" ${s === clientSel ? raw('selected') : ''}>${s.toUpperCase()}</option>`)}</select>
      ${!slugs.length ? html`<div class="mut sm">Sin clientes con proyecto.</div>` : !info ? html`<p class="loading sm">Cargando…</p>` : items.map(([i, t, s, h]) => html`<a class="wkrow" href="${h}" ${/^https/.test(h) ? raw('target="_blank" rel="noopener noreferrer"') : ''}><span style="width:22px;text-align:center">${i}</span><span class="grow"><b style="font-weight:500">${t}</b><span class="mut sm"> · ${s}</span></span><span class="mut">›</span></a>`)}`);
  }

  // =================== CEO ===================
  function decisions() {
    const out = [];
    for (const t of tasks) if (status(t) === 'En revisión' && accOf(t) === ceoKey) out.push({ t: `Revisar: ${t.title}`, sub: `${nameOf(t.assignee)} lo entregó`, tone: '#b08a5f', act: 'task', id: t.id });
    for (const p of projects) {
      if (p.pipeline?.['①']?.status === 'now') out.push({ t: 'Aprobar la estrategia', sub: `${p.client || p.name} · gate ① Strategy`, tone: '#a3392a', href: '#/operations/pipe' });
      if (p.pipeline?.['⑩']?.status === 'now') out.push({ t: 'Aprobar plan y presupuesto de pauta', sub: `${p.client || p.name} · gate ⑩ Ads`, tone: '#a3392a', href: '#/operations/pipe' });
    }
    for (const q of quotes.filter((x) => x.status === 'Borrador')) out.push({ t: `Enviar cotización ${q.number}`, sub: q.client || '', tone: '#7f9631', href: '#/sales/quotes' });
    return out;
  }
  const decRow = (d) => html`<${raw(d.href ? 'a' : 'div')} class="wkdec" ${raw(d.href ? `href="${d.href}"` : `data-act="${d.act}" data-id="${d.id}"`)} style="border-left-color:${d.tone}"><span class="grow"><b style="font-weight:500">${d.t}</b><span class="mut sm"> · ${d.sub}</span></span><span class="mut">›</span></${raw(d.href ? 'a' : 'div')}>`;
  function loadAgenda() { if (agenda !== null) return; agenda = []; api(`google/calendar?from=${T0}&to=${T0}`).then((r) => { agenda = r.events; if (alive() && tab === 'zona') paint(); }).catch(() => {}); }
  function agendaBox() {
    loadAgenda();
    const ps = content.filter((c) => c.kind === 'post' && c.date >= T0 && c.date <= T7 && c.status !== 'Publicado').sort((a, z) => a.date.localeCompare(z.date));
    return box('Agenda y contenido', 'Hoy · próximos 7 días', html`${agenda.length ? agenda.slice(0, 4).map((e) => html`<a class="wkrow" href="${/^https:\/\//.test(e.link || '') ? e.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="wkt">${e.allDay ? 'Día' : String(e.start).slice(11, 16)}</span><span class="grow">${e.summary}</span>${e.meet ? html`<span class="mut sm">Meet</span>` : ''}</a>`) : html`<div class="mut sm" style="padding:4px 0">Sin reuniones hoy.</div>`}
      ${ps.slice(0, 4).map((p) => html`<a class="wkrow" href="#/content/postear/${p.profile}"><span class="wkt" style="background:#f6e3da">${fdate(p.date)}</span><span class="grow">${p.title}<span class="mut sm"> · ${p.profile}</span></span></a>`)}`);
  }
  function stats(k) {
    const l = tasks.filter((t) => t.assignee === k); const m = ymNow();
    const month = l.filter((t) => String(t.due || t._meta?.created_at || '').slice(0, 7) === m || status(t) !== 'Hecha');
    const late = open(l).filter((t) => t.due && t.due < T0).length;
    return { total: month.length, done: month.filter((t) => status(t) === 'Hecha').length, late, open: open(l).length, dot: late ? '#a3392a' : open(l).length > 8 ? '#d08a2e' : '#5c7a1a' };
  }
  const people = () => team.filter((p) => p.active !== false && p.kind !== 'ia' && keyOf(p) !== ceoKey);
  const accBox = () => box('Accountability', 'Este mes', html`${people().map((p) => { const s = stats(keyOf(p)); return html`<div class="wkrow" data-act="person" data-k="${keyOf(p)}">${av(keyOf(p), 24)}<span class="grow"><b style="font-weight:500">${p.name.split(' ')[0]}</b><span class="mut sm"> · ${(p.roles || []).map((r) => roleName(r).split(' · ')[0]).join(', ') || p.title || ''}</span></span><span class="sm">${s.done}/${s.total}</span><i class="dot" style="background:${s.dot}"></i></div>`; })}`);
  const pipeMini = (k) => { const l = tasks.filter((t) => pipeOf(t) === k), done = l.filter((t) => status(t) === 'Hecha').length, pct = l.length ? Math.round((done / l.length) * 100) : 0;
    return html`<div class="wkpipe" data-act="pipe" data-k="${k}"><div class="row"><b style="font-weight:500">${PIPES[k].name}</b><div class="sp"></div><span class="sm">${done}/${l.length}</span></div><div class="wkprog"><i style="width:${pct}%;background:${PIPES[k].bar}"></i></div><div class="mut sm" style="margin-top:4px">${COLS.slice(0, 3).map(([s, l2]) => `${l.filter((t) => status(t) === s).length} ${l2.toLowerCase()}`).join(' · ')}</div></div>`; };
  function ceoZone(b) {
    const dq = decisions(), my = open(mine()).filter((t) => !t.due || t.due <= T1);
    const lanes = { estrategia: ['Estrategia', /^[①③②](?!B)/, '① Strategy'], clientes: ['Clientes', /^(①|②)/, '① Strategy'], ads: ['Ads (agente)', /^⑩/, '⑩ Ads'] };
    const [, re, dept] = lanes[ceoLane];
    const laneList = open(tasks).filter((t) => re.test(t.dept || '') && (isMine(t) || accOf(t) === ceoKey));
    mount(b, html`${kpis([['Mis tareas de hoy', my.length], ['Esperan tu decisión', dq.length, dq.length ? '#a3392a' : ''], ['Atrasadas', open(tasks).filter((t) => t.due && t.due < T0).length, ''], ['En revisión', tasks.filter((t) => status(t) === 'En revisión').length], ['Proyectos activos', projects.filter((p) => (p.phases || []).some((x) => x.status !== 'done')).length]])}
      <div class="wkgrid">
        ${box('Mis tareas de hoy', '', html`${my.length ? my.slice(0, 7).map((t) => trow(t, html`<input type="checkbox" data-act="tdone" data-id="${t.id}">`)) : html`<div class="mut sm" style="padding:6px 0">Nada para hoy.</div>`}<input class="in sm" id="quick" placeholder="+ Tarea para hoy y Enter" style="margin-top:8px">`)}
        ${box('Cola de decisiones', '', dq.length ? html`${dq.slice(0, 6).map(decRow)}` : html`<div class="mut sm" style="padding:6px 0">Nada espera tu decisión. 🙌</div>`, dq.length ? html`<span class="badge-n">${dq.length}</span>` : '')}
        ${agendaBox()}
        ${box('Pipelines', 'Quién lo hace → quién rinde cuentas', html`${Object.keys(PIPES).map(pipeMini)}`, html`<button class="sm mut" data-act="tab" data-t="pipes">Ver →</button>`)}
        ${accBox()}
        ${box('Lo tuyo como CEO', '', html`<div class="tabs mini">${Object.entries(lanes).map(([k, [l]]) => html`<button class="${k === ceoLane ? 'on' : ''}" data-act="lane" data-l="${k}">${l}</button>`)}</div>
          ${ceoLane === 'ads' ? projects.filter((p) => p.pipeline?.['⑩']?.status === 'now').map((p) => html`<a class="wkrow" href="#/operations/pipe"><span class="chip red sm2">Gate</span><span class="grow">Aprobar pauta · ${p.client || p.name}</span></a>`) : ''}
          ${ceoLane === 'clientes' ? quotes.filter((q) => ['Borrador', 'Enviada'].includes(q.status)).slice(0, 3).map((q) => html`<a class="wkrow" href="#/sales/quotes"><span class="chip sm2">${q.status}</span><span class="grow">${q.number} · ${q.client}</span></a>`) : ''}
          ${laneList.length ? laneList.slice(0, 5).map((t) => trow(t)) : html`<div class="mut sm" style="padding:6px 0">Nada abierto.</div>`}`, html`<button class="btn ghost xs" data-act="laneTask" data-d="${dept}">+</button>`)}
      </div>`);
    hookQuick(b);
  }

  // =================== COO ===================
  function cooZone(b) {
    const review = tasks.filter((t) => status(t) === 'En revisión' && (accOf(t) === me.email || (meP && accOf(t) === meP.id)));
    const noOwner = open(tasks).filter((t) => !t.assignee);
    const upcoming = projects.flatMap((p) => (p.phases || []).filter((x) => x.status !== 'done' && x.start && x.start <= addDays(T0, 10) && (x.end || x.start) >= T0).map((x) => ({ p, x }))).sort((a, z) => a.x.start.localeCompare(z.x.start));
    const load = people().map((p) => ({ p, n: open(tasks.filter((t) => t.assignee === keyOf(p))).length })).sort((a, z) => z.n - a.n);
    const max = Math.max(1, ...load.map((x) => x.n));
    mount(b, html`${kpis([['Por revisar', review.length, review.length ? '#b08a5f' : ''], ['Atrasadas', open(tasks).filter((t) => t.due && t.due < T0).length, '#a3392a'], ['Sin responsable', noOwner.length], ['Mis tareas', open(mine()).length], ['Día del ciclo', `${Math.min(+T0.slice(8), 31)}/20`]])}
      <div class="wkgrid">
        ${checklist('coo')}
        ${box('Entregas por revisar', 'Te rinden cuentas a ti', review.length ? html`${review.slice(0, 7).map((t) => html`<div class="wkrow" data-act="task" data-id="${t.id}">${av(t.assignee, 20)}<span class="grow">${t.title}<span class="mut sm"> · ${proj(t.project_id)?.client || 'Interno'}</span></span><button class="btn ghost xs" data-act="approveQ" data-id="${t.id}">✓</button></div>`)}` : html`<div class="mut sm" style="padding:6px 0">Nada por revisar.</div>`)}
        ${box('Próximos controles del ciclo', 'Fases de los próximos 10 días', upcoming.length ? html`${upcoming.slice(0, 6).map(({ p, x }) => html`<a class="wkrow" href="#/operations/time"><span class="wkt">${fdate(x.start)}</span><span class="grow"><b style="font-weight:500">${x.name}</b><span class="mut sm"> · ${p.client || p.name}</span></span><span class="chip sm2 ${x.status === 'now' ? 'lime' : ''}">${x.status === 'now' ? 'En curso' : 'Pendiente'}</span></a>`)}` : html`<div class="mut sm" style="padding:6px 0">Sin fases próximas.</div>`)}
        ${box('Carga del equipo', 'Tareas abiertas por persona', html`${load.map(({ p, n }) => html`<div class="wkrow" data-act="person" data-k="${keyOf(p)}">${av(keyOf(p), 20)}<span style="width:80px">${p.name.split(' ')[0]}</span><div class="wkprog grow" style="margin:0"><i style="width:${(n / max) * 100}%;background:${n > 8 ? '#d08a2e' : '#5c6b22'}"></i></div><span class="sm" style="width:20px;text-align:right">${n}</span></div>`)}`)}
        ${uploader()}
        ${sops('coo')}
      </div>`);
    hookUpload(b);
  }

  // =================== VIDEO ===================
  function videoZone(b) {
    const vids = mine().filter((t) => /^(⑦|⑤|⑩)/.test(t.dept || '') || /video|reel|corte|ugc|ad/i.test(t.title));
    const q = open(vids).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
    const n = (s) => vids.filter((t) => status(t) === s).length;
    mount(b, html`${kpis([['Por producir', n('Por empezar')], ['En edición', n('En curso'), '#7f9631'], ['En revisión', n('En revisión'), '#b08a5f'], ['Ads pendientes', open(vids).filter((t) => /^⑩/.test(t.dept || '') || /\bad/i.test(t.title)).length, '#c2735a']])}
      <div class="wkgrid">
        <div class="span2">${box('Cola de producción', 'Tus videos y ads, por fecha de entrega', q.length ? html`<table class="wktable"><thead><tr><th>Pieza</th><th>Cliente</th><th>Tipo</th><th>Entrega</th><th>Estado</th></tr></thead><tbody>${q.slice(0, 8).map((t) => html`<tr class="click" data-act="task" data-id="${t.id}"><td><b style="font-weight:500">${t.title}</b></td><td class="mut">${proj(t.project_id)?.client || '—'}</td><td><span class="chip sm2 ${/^⑩/.test(t.dept || '') ? 'red' : ''}">${/^⑩/.test(t.dept || '') ? 'Ads' : 'Video'}</span></td><td>${dueChip(t.due, status(t)) || '—'}</td><td><span class="chip sm2">${status(t)}</span></td></tr>`)}</tbody></table>` : html`<div class="mut sm" style="padding:6px 0">Sin videos asignados. Cuando te asignen una tarea de ⑦ Video Editing o ⑩ Ads aparece aquí.</div>`)}</div>
        ${agentBox(q)}
        ${checklist('video')}
        ${uploader('Subir corte para revisión')}
        ${material()}
        ${deliveries()}
        ${sops('video')}
      </div>`);
    hookUpload(b); hookAgent(b, q); hookClient(b);
  }
  function agentBox(q) {
    const recent = mine().flatMap((t) => (t.prompts || []).map((p) => ({ ...p, t }))).sort((a, z) => String(z.at).localeCompare(String(a.at))).slice(0, 3);
    return box('Agente de video', 'Arma el prompt con la plantilla aprobada', html`<div class="form" style="gap:8px">
      <select class="in" id="vtpl">${Object.entries(VTPL).map(([k, [l]]) => html`<option value="${k}">${l}</option>`)}</select>
      <select class="in" id="vtask"><option value="">— Brief: elige la pieza</option>${q.map((t) => html`<option value="${t.id}">${t.title} · ${proj(t.project_id)?.client || 'Interno'}</option>`)}</select>
      <div class="two"><select class="in" id="vfmt">${['Reel 9:16', 'Story 9:16', 'Horizontal 16:9', 'Cuadrado 1:1', 'Feed 4:5'].map((f) => html`<option>${f}</option>`)}</select><input class="in" id="vdur" placeholder="Duración (ej. 20 s)"></div>
      <button class="btn" data-act="vprompt">✦ Preparar prompt</button></div>
      ${recent.length ? html`<div class="lbl" style="color:var(--mut);margin-top:10px">Recientes</div>${recent.map((p) => html`<div class="wkrow" data-act="task" data-id="${p.t.id}"><span class="grow">${p.t.title}<span class="mut sm"> · ${VTPL[p.tpl]?.[0] || ''}</span></span><span class="mut sm">${fdate(String(p.at).slice(0, 10))}</span></div>`)}` : ''}`);
  }
  function hookAgent(b, q) {
    $('[data-act=vprompt]', b)?.addEventListener('click', async () => {
      const t = q.find((x) => x.id === $('#vtask', b).value); const [tn, guide] = VTPL[$('#vtpl', b).value];
      const p = t && proj(t.project_id);
      const text = `Eres el editor de video de Inherent. Plantilla: ${tn}.
Cliente: ${p?.client || '—'}${p ? ` (proyecto «${p.name}»)` : ''}.
Pieza: ${t ? t.title : '—'}.
Objetivo y brief: ${t?.description || 'Usa el brief del ciclo en Content → Guiones.'}
Formato: ${$('#vfmt', b).value}${$('#vdur', b).value ? ` · Duración: ${$('#vdur', b).value}` : ''}.
Marca: respeta la guía de marca del cliente (02-marca): paleta, tipografías, tono y activos distintivos.
Cómo debe quedar: ${guide}
Entrega: el plan de edición escena por escena (tiempo, toma, texto en pantalla, audio) y la lista de exports (orgánico y Ads).`;
      if (t) { const r = await save({ ...t, prompts: [...(t.prompts || []), { at: new Date().toISOString(), tpl: $('#vtpl', b).value }].slice(-10) }); if (r) Object.assign(t, r); }
      drawer(html`<div class="row"><span class="chip">✦ Prompt listo</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div><h2>${tn}</h2><div class="mut">${t ? t.title : 'Sin pieza'}</div>
        <textarea class="in" id="ptxt" style="min-height:340px;margin-top:14px;font-family:ui-monospace,Menlo,monospace;font-size:13px">${text}</textarea>
        <div class="row" style="margin-top:12px"><button class="btn" data-act="copy">Copiar</button><span class="mut sm">Pégalo en tu agente de video.</span></div>`,
      { copy: async () => { try { await navigator.clipboard.writeText($('#ptxt').value); toast('Copiado ✅'); } catch { $('#ptxt').select(); document.execCommand('copy'); toast('Copiado ✅'); } } });
    });
  }

  // =================== CONTENT ===================
  async function contentZone(b) {
    if (!posts) { mount(b, html`<p class="loading">Cargando…</p>`); const all = (await col('content').list().catch(() => [])).filter((c) => c.kind === 'post'); posts = all; if (!alive()) return; }
    const ideas = posts.filter((p) => (p.status || 'Idea') === 'Idea'), prod = posts.filter((p) => ['Grabado', 'Editado'].includes(p.status));
    const design = open(mine()).filter((t) => /^⑥/.test(t.dept || '') || /diseñ|static|estátic|carrusel/i.test(t.title));
    const subtabs = [['ideas', 'Ideas y preproducción'], ['diseno', 'Diseño y static ads'], ['matriz', 'Matriz y publicaciones'], ['community', 'Community']];
    mount(b, html`${kpis([['Ideas por desarrollar', ideas.length, '', ''], ['En producción', prod.length, '#c2735a'], ['Diseños pendientes', design.length, '#b08a5f'], ['Por publicar (7 días)', posts.filter((p) => p.date >= T0 && p.date <= T7 && p.status !== 'Publicado').length, '#5c6b22']])}
      <div class="tabs" style="margin:0 0 12px">${subtabs.map(([k, l]) => html`<button class="${ctab === k ? 'on' : ''}" data-act="ctab" data-c="${k}">${l}</button>`)}</div>
      <div id="cz"></div>`);
    const z = $('#cz', b);
    if (ctab === 'ideas') {
      const STAGES = [['Idea', 'Idea y concepto'], ['Grabado', 'Guion y preproducción'], ['Editado', 'Diseño y edición'], ['Programado', 'Listo para publicar']];
      const profs = [...new Set(posts.map((p) => p.profile))];
      mount(z, html`<div class="wkgrid"><div class="span2">${box('Plan de contenido por cliente y etapa', 'Las piezas de «Por postear» de cada perfil', profs.length ? html`<div class="wkstage head"><span></span>${STAGES.map(([, l]) => html`<span>${l}</span>`)}</div>${profs.map((pr) => html`<div class="wkstage"><b>${pr.toUpperCase()}</b>${STAGES.map(([s]) => html`<div>${posts.filter((p) => p.profile === pr && (p.status || 'Idea') === s).slice(0, 3).map((p) => html`<div class="wkpost" data-act="post" data-id="${p.id}"><span>${p.title}</span><span class="mut sm">${p.date ? fdate(p.date) : ''}</span></div>`)}</div>`)}</div>`)}` : html`<div class="mut sm" style="padding:6px 0">Todavía no hay piezas. Crea la primera con «+ Pieza».</div>`, html`<button class="btn xs" data-act="newPost">+ Pieza</button>`)}</div>
        ${checklist('content')}${material()}${sops('content')}${uploader()}</div>`);
      hookClient(z); hookUpload(z);
    } else if (ctab === 'diseno') {
      mount(z, html`<div class="wkgrid"><div class="span2">${box('Diseño y static ads', 'Tus tareas de ⑥A Diseño gráfico y static ads', design.length ? html`${design.map((t) => trow(t))}` : html`<div class="mut sm" style="padding:6px 0">Nada pendiente.</div>`, html`<button class="btn ghost xs" data-act="laneTask" data-d="⑥A Diseño gráfico">+</button>`)}</div>${uploader('Subir diseño para revisión')}${material()}</div>`);
      hookUpload(z); hookClient(z);
    } else if (ctab === 'matriz') {
      const list = posts.filter((p) => p.date >= addDays(T0, -3)).sort((a, z2) => String(a.date).localeCompare(String(z2.date)));
      mount(z, box('Matriz de publicaciones', 'Fecha, canal, formato, idea y CTA', list.length ? html`<table class="wktable"><thead><tr><th>Fecha</th><th>Perfil</th><th>Formato</th><th>Idea</th><th>CTA</th><th>Estado</th></tr></thead><tbody>${list.map((p) => html`<tr class="click" data-act="post" data-id="${p.id}"><td>${p.date ? fdate(p.date) : '—'}</td><td class="mut">${p.profile}</td><td>${p.format || '—'}</td><td><b style="font-weight:500">${p.title}</b></td><td class="mut sm">${String(p.caption || '').split('\n').filter(Boolean).pop()?.slice(0, 40) || '—'}</td><td><span class="chip sm2">${p.status || 'Idea'}</span></td></tr>`)}</tbody></table>` : html`<div class="mut sm" style="padding:6px 0">Sin publicaciones con fecha.</div>`, html`<button class="btn xs" data-act="newPost">+ Publicación</button>`));
    } else {
      const slugs = [...new Set(projects.map((p) => p.client_slug).filter(Boolean))];
      const accs = await col('accounts').list().catch(() => []);
      mount(z, html`<div class="wkgrid">${slugs.map((s) => { const a = accs.find((x) => x.id === 'acc-' + s) || {}; const c = a.community || {};
        return box(`Setup de community · ${s.toUpperCase()}`, `${COMMUNITY.filter((_, i) => c[i]).length}/${COMMUNITY.length} listo`, html`${COMMUNITY.map((l, i) => html`<label class="wkcheck"><input type="checkbox" data-act="comm" data-s="${s}" data-i="${i}" ${c[i] ? raw('checked') : ''}><span>${l}</span></label>`)}<a class="sm mut" href="#/clients/${s}">Ver cliente →</a>`); })}</div>`);
      $$('[data-act=comm]', z).forEach((cb) => cb.addEventListener('change', async () => {
        const id = 'acc-' + cb.dataset.s; const A = col('accounts');
        try { const cur = await A.get(id).catch(() => null); const community = { ...(cur?.community || {}), [cb.dataset.i]: cb.checked };
          if (cur) await A.save({ ...cur, community }); else await A.create({ id, name: cb.dataset.s.toUpperCase(), roadmap: [], accesos: [], community }); toast('Guardado ✅'); } catch (e) { cb.checked = !cb.checked; toast(e.message, true); }
      }));
    }
  }

  // =================== FINANCE + BUSINESS MAPPING ===================
  function financeZone(b) {
    const gp = projects.filter((p) => lineOf(p) === 'growth');
    mount(b, html`${kpis([['Proyectos', gp.length], ['Mis tareas abiertas', open(mine()).length], ['En revisión', mine().filter((t) => status(t) === 'En revisión').length, '#b08a5f']])}
      <div class="wkgrid">
        <div class="span2">${box('Mis proyectos', 'Business Growth: que ganen más y gasten menos', gp.length ? html`${gp.map((p) => { const ph = p.phases || []; const d = ph.filter((x) => x.status === 'done').length; return html`<a class="wkrow" href="${p.client_slug ? '#/clients/' + p.client_slug : '#/operations/pipe'}"><span class="grow"><b style="font-weight:500">${p.name}</b><span class="mut sm"> · ${ph.find((x) => x.status !== 'done')?.name || 'Terminado'}</span></span><div class="wkprog" style="width:120px;margin:0"><i style="width:${ph.length ? (d / ph.length) * 100 : 0}%;background:#b8583c"></i></div><span class="sm">${d}/${ph.length}</span></a>`; })}` : html`<div class="mut sm" style="padding:6px 0">Sin proyectos de Business Growth. Se crean en Operations → «+ Proyecto» → Business Growth.</div>`)}</div>
        ${box('Mis tareas', '', myList(8))}
        ${checklist('finance')}${uploader('Entregar trabajo')}${sops('finance')}
      </div>`);
    hookUpload(b);
  }
  const ZONES = { ceo: ceoZone, coo: cooZone, video: videoZone, content: contentZone, finance: financeZone };

  // ---------- conexiones de las piezas ----------
  function hookQuick(b) { const qi = $('#quick', b); if (qi) qi.onkeydown = async (e) => { if (e.key !== 'Enter' || !qi.value.trim()) return; if (await create({ title: qi.value.trim(), assignee: me.email, due: T0, status: 'Por empezar' })) paint(); }; }
  function hookClient(b) { const s = $('#clientSel', b); if (s) s.onchange = () => { clientSel = s.value; paint(); }; }
  function hookUpload(b) {
    const inp = $('#upIn', b), drop = $('#drop', b); if (!inp) return;
    const go = async (file) => {
      if (!file) return;
      let t = tasks.find((x) => x.id === $('#upTask', b).value);
      if (!t) { const v = await ask('¿Qué estás entregando?', [{ k: 'title', l: 'Nombre de la entrega', v: file.name.replace(/\.[^.]+$/, ''), req: true }, { k: 'project_id', l: 'Proyecto', t: 'select', opts: [['', '— Interno'], ...projects.map((p) => [p.id, p.name])] }], 'Subir'); if (!v) return; t = await create({ ...v, assignee: me.email, status: 'En curso' }); if (!t) return; }
      const bar = $('#upBar', b); bar.hidden = false;
      try {
        const f = await uploadToDrive(file, `${t.title} · ${file.name}`, (p) => { bar.firstElementChild.style.width = Math.round(p * 100) + '%'; });
        const r = await save({ ...t, link: f.link, status: 'En revisión', files: [...(t.files || []), { name: f.name, link: f.link, at: new Date().toISOString() }] });
        if (r) { toast(`Subido y enviado a revisión de ${nameOf(accOf(r)).split(' ')[0]} ✅`); paint(); }
      } catch (e) { bar.hidden = true; toast(e.message, true); }
    };
    inp.onchange = () => go(inp.files[0]);
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); go(e.dataTransfer.files[0]); };
  }

  // =================== KANBAN · PIPELINES · EQUIPO ===================
  const card = (t) => { const p = proj(t.project_id);
    return html`<div class="kcard wk" draggable="true" data-act="task" data-id="${t.id}"><b>${t.title}</b><div class="mut sm">${p ? (p.client || p.name) : 'Interno'}${t.dept ? ' · ' + t.dept.split(' ')[0] : ''}</div>
      <div class="row" style="margin-top:8px;gap:6px">${t.assignee ? av(t.assignee, 20) : ''}<span class="sm">${t.assignee ? nameOf(t.assignee).split(' ')[0] : '—'}</span><div class="sp"></div>${dueChip(t.due, status(t))}</div></div>`; };
  function kanban(b) {
    const base = kView === 'personal' ? mine() : tasks;
    mount(b, html`<div class="row" style="margin-bottom:12px;gap:8px"><div class="tabs mini" style="margin:0"><button class="${kView === 'personal' ? 'on' : ''}" data-act="kv" data-v="personal">Personal</button><button class="${kView === 'empresa' ? 'on' : ''}" data-act="kv" data-v="empresa">Empresa</button></div><span class="mut sm">${open(base).length} abiertas · arrastra para mover</span></div>
      <div class="kanban wkk">${COLS.map(([s, l, c]) => { const list = base.filter((t) => status(t) === s).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
        return html`<div class="kcol" data-st="${s}"><h4><span class="row" style="gap:8px"><i class="dot" style="background:${c}"></i>${l}</span><span class="mut">${list.length}</span></h4>${(s === 'Hecha' ? list.slice(-10) : list).map(card)}<button class="wkadd" data-act="colAdd" data-s="${s}">+ Añadir tarea</button></div>`; })}</div>`);
    $$('.kcard', b).forEach((c) => c.addEventListener('dragstart', (e) => e.dataTransfer.setData('id', c.dataset.id)));
    $$('.kcol', b).forEach((k) => {
      k.addEventListener('dragover', (e) => { e.preventDefault(); k.classList.add('over'); });
      k.addEventListener('dragleave', () => k.classList.remove('over'));
      k.addEventListener('drop', async (e) => { e.preventDefault(); k.classList.remove('over'); const t = tasks.find((x) => x.id === e.dataTransfer.getData('id')); if (t && status(t) !== k.dataset.st && (await save({ ...t, status: k.dataset.st }))) kanban(b); });
    });
  }
  function pipes(b) {
    const list = tasks.filter((t) => pipeOf(t) === pipeSel).sort((a, z) => (status(a) === 'Hecha') - (status(z) === 'Hecha') || String(a.due || '9').localeCompare(String(z.due || '9')));
    mount(b, html`<div class="grid g11" style="margin-bottom:12px">${Object.keys(PIPES).map((k) => html`<div class="card wkbox" style="${k === pipeSel ? 'outline:2px solid var(--ink)' : ''}">${pipeMini(k)}</div>`)}</div>
      ${list.length ? html`<div class="card wkbox"><table class="wktable"><thead><tr><th>Tarea</th><th>Proyecto</th><th>Responsable → rinde cuentas</th><th>Estado</th><th>Vence</th></tr></thead><tbody>
        ${list.map((t) => html`<tr class="click" data-act="task" data-id="${t.id}"><td><b style="font-weight:500">${t.title}</b>${t.dept ? html`<span class="mut sm"> · ${t.dept}</span>` : ''}</td><td class="mut">${proj(t.project_id)?.name || '—'}</td><td><span class="chain">${chain(t).map((k, i) => html`${i ? html`<span class="mut">→</span>` : ''}${av(k, 22)}`)}</span></td><td><span class="chip sm2">${status(t)}</span></td><td>${dueChip(t.due, status(t)) || '—'}</td></tr>`)}</tbody></table></div>`
        : html`<div class="empty"><b>Sin tareas en ${PIPES[pipeSel].name}</b>Las tareas de sus proyectos aparecen aquí.</div>`}`);
  }
  function equipo(b) {
    const sel = personSel && person(personSel);
    const list = sel ? tasks.filter((t) => t.assignee === personSel).sort((a, z) => (status(a) === 'Hecha') - (status(z) === 'Hecha') || String(a.due || '9').localeCompare(String(z.due || '9'))) : [];
    mount(b, html`<div class="wkgrid">${people().map((p) => { const k = keyOf(p), s = stats(k), pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
      return html`<div class="card wkbox" data-act="person" data-k="${k}" style="cursor:pointer;${personSel === k ? 'outline:2px solid var(--ink)' : ''}"><div class="row">${av(k, 36)}<div class="grow"><b style="font-weight:500">${p.name}</b><div class="mut sm">${(p.roles || []).map(roleName).join(' · ') || p.title || ''}</div></div><i class="dot" style="background:${s.dot}"></i></div>
        <div class="row" style="margin-top:10px"><b style="font-size:22px;font-weight:400">${s.done}<span class="mut sm">/${s.total}</span></b><div class="sp"></div><span class="sm" style="${s.late ? 'color:#a3392a;font-weight:700' : ''}">${s.late ? s.late + ' atrasadas' : 'Al día'}</span></div><div class="wkprog"><i style="width:${pct}%"></i></div></div>`; })}</div>
      ${sel ? html`<div class="sec-title"><h2>Tareas de ${sel.name}</h2><button class="btn ghost xs" data-act="assignTo">+ Asignarle</button></div><div class="card wkbox">${list.length ? list.map((t) => trow(t)) : html`<div class="mut sm">Sin tareas.</div>`}</div>` : ''}`);
  }

  // =================== tareas ===================
  async function save(t) { try { const r = await TK.save(t); tasks = tasks.map((x) => (x.id === r.id ? r : x)); return r; } catch (e) { toast(e.message, true); return null; } }
  async function create(t) { try { const r = await TK.create({ checklist: [], comments: [], ...t }); tasks.push(r); toast('Tarea creada ✅'); return r; } catch (e) { toast(e.message, true); return null; } }
  const peopleOpts = () => [['', '—'], ...team.filter((p) => p.active !== false).map((p) => [keyOf(p), p.name + ((p.roles || []).length ? ' · ' + roleName(p.roles[0]).split(' · ')[0] : p.title ? ' · ' + p.title : '')])];
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
    if (v && (await create(v))) paint();
  }
  function openTask(t) {
    const draw = () => {
      const p = proj(t.project_id);
      drawer(html`<div class="row"><select class="in" id="wst" style="width:auto">${COLS.map(([s, l]) => html`<option value="${s}" ${s === status(t) ? raw('selected') : ''}>${l}</option>`)}</select><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
        <input class="in" id="wtitle" value="${t.title}" style="font-size:22px;font-weight:500;letter-spacing:-.5px;margin-top:12px;border:0;padding:6px 0;background:transparent">
        <div class="mut sm">${p ? (p.client ? p.client + ' · ' : '') + p.name : 'Interno'}${pipeOf(t) ? ' · ' + PIPES[pipeOf(t)].name : ''}</div>
        <div class="chain" style="margin-top:10px">${chain(t).map((k, i) => html`${i ? html`<span class="mut">→</span>` : ''}<span class="row" style="gap:5px">${av(k, 22)}<span class="sm">${nameOf(k).split(' ')[0]}</span></span>`)}</div>
        <div class="form" style="margin-top:14px">
          <div class="two"><div><label class="f">Responsable</label><select class="in" id="was">${peopleOpts().map(([k, l]) => html`<option value="${k}" ${k === (t.assignee || '') ? raw('selected') : ''}>${l}</option>`)}</select></div>
            <div><label class="f">Rinde cuentas</label><select class="in" id="wacc">${[['', 'Su jefe directo'], ...peopleOpts().slice(1)].map(([k, l]) => html`<option value="${k}" ${k === (t.accountable || '') ? raw('selected') : ''}>${l}</option>`)}</select></div></div>
          <div class="two"><div><label class="f">Vence</label><input class="in" id="wdue" type="date" value="${t.due || ''}"></div>
            <div><label class="f">Proyecto</label><select class="in" id="wproj"><option value="">— Interno</option>${projects.map((x) => html`<option value="${x.id}" ${x.id === t.project_id ? raw('selected') : ''}>${x.name}</option>`)}</select></div></div>
          <div><label class="f">Descripción / brief</label><textarea class="in" id="wdesc">${t.description || ''}</textarea></div>
          <div><label class="f">Entrega (link)</label><input class="in" id="wlink" value="${t.link || ''}" placeholder="https://drive.google.com/…"></div>
        </div>
        ${(t.files || []).length ? html`<div class="lbl" style="color:var(--mut);margin-top:10px">Archivos</div>${t.files.map((f) => html`<a class="wkrow" href="${/^https:\/\//.test(f.link) ? f.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="fi">${IC.drive}</span><span class="grow">${f.name}</span><span class="mut sm">${fdate(String(f.at).slice(0, 10))}</span></a>`)}` : ''}
        <b class="sm" style="display:block;margin-top:14px">Checklist</b>
        ${(t.checklist || []).map((c, i) => html`<label class="check"><input type="checkbox" data-act="chk" data-i="${i}" ${c.done ? raw('checked') : ''}> ${c.t}</label>`)}
        <div class="row" style="margin-top:6px"><input class="in" id="wchk" placeholder="Nuevo paso…"><button class="btn ghost" data-act="addchk">+</button></div>
        <div class="row" style="margin-top:18px;flex-wrap:wrap;gap:8px"><button class="btn" data-act="wsave">Guardar</button>${!['En revisión', 'Hecha'].includes(status(t)) ? html`<button class="btn ghost" data-act="deliver">⇪ Entregar a revisión</button>` : ''}${status(t) === 'En revisión' && (accOf(t) === me.email || isCeo) ? html`<button class="btn ghost" data-act="approve">✓ Aprobar</button><button class="btn ghost" data-act="back">↩ Devolver</button>` : ''}<div class="sp"></div><button class="btn ghost" data-act="wdel">🗑</button></div>`,
      {
        chk: async (cb) => { t = collect(); t.checklist[+cb.dataset.i].done = cb.checked; const r = await save(t); if (r) t = r; },
        addchk: async () => { const v = $('#wchk').value.trim(); if (!v) return; t = collect(); t.checklist = [...(t.checklist || []), { t: v, done: false }]; const r = await save(t); if (r) { t = r; draw(); } },
        wsave: async () => { if (await save(collect())) { toast('Guardado ✅'); closeDrawer(); paint(); } },
        deliver: async () => { const c = collect(); if (!c.link) { toast('Pega el link de tu entrega, o súbela en «Subir trabajo»', true); $('#wlink').focus(); return; } if (await save({ ...c, status: 'En revisión' })) { toast('Entregado a revisión ✅'); closeDrawer(); paint(); } },
        approve: async () => { if (await save({ ...collect(), status: 'Hecha' })) { toast('Aprobado ✅'); closeDrawer(); paint(); } },
        back: async () => { const v = await ask('¿Qué hay que cambiar?', [{ k: 'note', l: 'Comentario para quien lo hizo', t: 'textarea', req: true }], 'Devolver'); if (!v) return; const c = collect(); if (await save({ ...c, status: 'En curso', comments: [...(c.comments || []), { who: me.name, at: new Date().toISOString(), text: '↩ ' + v.note }] })) { toast('Devuelto con comentario'); closeDrawer(); paint(); } },
        wdel: async () => { if (!(await confirmAsk(`¿Eliminar «${t.title}»?`))) return; await TK.remove(t.id); tasks = tasks.filter((x) => x.id !== t.id); closeDrawer(); paint(); },
      });
    };
    const collect = () => ({ ...t, title: $('#wtitle').value.trim() || t.title, status: $('#wst').value, assignee: $('#was').value, accountable: $('#wacc').value, due: $('#wdue').value, project_id: $('#wproj').value, description: $('#wdesc').value, link: $('#wlink').value.trim() });
    draw();
  }

  acts(el, {
    role: (t) => { role = t.dataset.r; tab = 'zona'; try { localStorage.setItem('work.role', role); } catch {} history.replaceState(null, '', `#/work/zona/${role}`); paint(); },
    tab: (t) => { tab = t.dataset.t; history.replaceState(null, '', `#/work/${tab}${role ? '/' + role : ''}`); paint(); },
    lane: (t) => { ceoLane = t.dataset.l; paint(); },
    ctab: (t) => { ctab = t.dataset.c; paint(); },
    kv: (t) => { kView = t.dataset.v; kanban($('#wbody', el)); },
    pipe: (t) => { pipeSel = t.dataset.k; tab = 'pipes'; paint(); },
    person: (t) => { personSel = t.dataset.k; tab = 'equipo'; paint(); },
    task: (t, e) => { if (e.target.closest('input,button')) return; const x = tasks.find((y) => y.id === t.dataset.id); if (x) openTask(x); },
    approveQ: async (t, e) => { e.stopPropagation(); const x = tasks.find((y) => y.id === t.dataset.id); if (await save({ ...x, status: 'Hecha' })) { toast('Aprobado ✅'); paint(); } },
    tdone: async (cb) => { const t = tasks.find((x) => x.id === cb.dataset.id); if (!(await save({ ...t, status: cb.checked ? 'Hecha' : 'En curso' }))) cb.checked = !cb.checked; else setTimeout(paint, 250); },
    ck: async (cb) => {
      const r = cb.dataset.r, i = +cb.dataset.i, id = `${me.email}.${r}.${ymNow()}`; const cur = checks.find((c) => c.id === id);
      const done = cb.checked ? [...new Set([...(cur?.done || []), i])] : (cur?.done || []).filter((x) => x !== i);
      try { const res = cur ? await CK.save({ ...cur, done }) : await CK.create({ id, role: r, month: ymNow(), done }); checks = [...checks.filter((c) => c.id !== id), res]; paint(); } catch (e) { cb.checked = !cb.checked; toast(e.message, true); }
    },
    post: async (t) => { const p = posts?.find((x) => x.id === t.dataset.id) || content.find((x) => x.id === t.dataset.id); if (!p) return; const r = await editPost(p.profile, p); if (r) { posts = posts.map((x) => (x.id === r.id ? r : x)); paint(); } },
    newPost: async () => { const pr = await ask('¿Para qué perfil?', [{ k: 'p', l: 'Perfil', t: 'select', opts: [['inherent', 'Inherent'], ['personal', 'Marca personal'], ...[...new Set(projects.map((p) => p.client_slug).filter(Boolean))].map((s) => [s, s.toUpperCase()])] }], 'Seguir'); if (!pr) return; const r = await editPost(pr.p, null); if (r) { posts = [...(posts || []), r]; paint(); } },
    newTask: () => newTask(),
    colAdd: (t) => newTask({ status: t.dataset.s, assignee: kView === 'personal' ? me.email : '' }),
    laneTask: (t) => newTask({ dept: t.dataset.d }),
    assignTo: () => newTask({ assignee: personSel }),
  });
  paint();
}

function addDays(s, n) { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
