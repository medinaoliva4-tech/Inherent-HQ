import { upcoming, meetingRows, isMine as meetIsMine } from '../meetings.js';
import { LOGO, lineChart, html, raw, mount, col, api, acts, toast, fdate, today, initials, IC, $, $$, ask, confirmAsk, drawer, closeDrawer, teamList, uploadToDrive, WORK_ROLES, roleName , calQ, calAll, setCalAll , openClaude, ICON, iconFor } from '../core.js';
import { editPost, loadPosts, PSTATUS } from '../posts.js';
import { newProject as wizProject, newTask as wizTask } from '../create.js';
import { blockersOf, unlocksOf } from '../cycle.js';
import { payDialog } from '../flowui.js';

// Workspace: organizar el trabajo. Cada persona trabaja desde el perfil (o los perfiles) que tiene en Team:
// sus tareas y proyectos con fechas, el checklist del ciclo con sus días, y lo propio de su perfil.
// Se entrega moviendo la tarea a «En revisión» (con el link en la tarea); quien rinde cuentas la aprueba.
const COLS = [['Por empezar', 'Por hacer', '#a39a8c'], ['En curso', 'En progreso', '#7f9631'], ['En revisión', 'En revisión', '#b08a5f'], ['Hecha', 'Hecha', '#4f6b12']];
const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
const COLORS = ['#26201a', '#c2735a', '#4f7790', '#7f9631', '#b08a5f', '#6b5a45'];
// El checklist del ciclo de cada perfil (se marca por mes).
// El checklist del ciclo de cada perfil, con el día del mes en que tiene que estar (ciclo del 1 al 20).
const CHECK = {
  coo: [[1, 'Confirmar alcance, entregables y fechas del ciclo'], [2, 'Asignar responsable y quién revisa cada tarea'], [3, 'Armar dependencias: qué espera a qué'], [6, 'Revisar la carga del equipo y destrabar'], [11, 'Último día para producir: todo grabado'], [19, 'QA final de las entregas'], [20, 'Presentación al cliente']],
  video: [[6, 'Confirmar formato, objetivo y fecha de cada pieza'], [11, 'Material grabado recibido'], [13, 'Primer corte de cada pieza'], [15, 'Montaje terminado y en revisión'], [19, 'Cambios aplicados y versiones exportadas']],
  content: [[1, 'Ideas aprobadas con enfoque y objetivo'], [3, 'Calendario y shot list del mes'], [5, 'Guiones y copies listos'], [15, 'Piezas en revisión'], [19, 'Todo programado'], [20, 'Presentación al cliente']],
  finance: [[1, 'Leer los números del cliente'], [5, 'Mapa del negocio: procesos y equipo'], [12, 'Proyecto para que ganen más'], [16, 'Proyecto para que gasten menos'], [20, 'Entregar el reporte y el plan']],
};
const ymNow = () => today().slice(0, 7);

export async function render(el, { me, sub, alive }) {
  const TK = col('tasks'), CK = col('checks');
  const isCeo = me.role === 'ceo';
  let accounts = [], settings = null;
  let [tasks, projects, team, content, docs, checks, quotes] = await Promise.all([
    TK.list(), col('projects').list(), teamList(), col('content').list().catch(() => []), col('docs').list().catch(() => []), CK.list().catch(() => []),
    isCeo ? col('quotes').list().catch(() => []) : [],
  ]);
  const meP = team.find((p) => p.id === me.email || p.email === me.email);
  // «Ver como»: el CEO entra al Workspace de cualquier persona para revisar su trabajo.
  const asP = isCeo && sub[2] ? team.find((p) => p.id === sub[2] || p.email === sub[2]) : null;
  const who = asP ? asP.email || asP.id : me.email, whoP = asP || meP;
  const myRoles = asP ? asP.roles || [] : (meP?.roles?.length ? meP.roles : me.roles?.length ? me.roles : isCeo ? ['ceo'] : me.role === 'coo' ? ['coo'] : []);
  const pref = (() => { try { return localStorage.getItem('work.role'); } catch { return null; } })();
  let role = myRoles.includes(sub[1]) ? sub[1] : !asP && myRoles.includes(pref) ? pref : myRoles[0] || null;
  let tab = ['zona', 'kanban', 'equipo'].includes(sub[0]) ? sub[0] : 'zona';
  Promise.all([col('accounts').list().catch(() => []), col('settings').get('drive').catch(() => null)]).then(([a2, s2]) => { accounts = a2; settings = s2; if (alive() && tab === 'zona' && ['video', 'ads'].includes(role)) paint(); });
  let kView = 'personal', personSel = null, clientSel = null;
  let agenda = null, clientInfo = {}, posts = null;
  const T0 = today(), T1 = addDays(T0, 1), T7 = addDays(T0, 7);
  const canCoord = (isCeo && !asP) || myRoles.includes('coo');

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
    const status = (t) => t.status || 'Por empezar';
  const isMine = (t) => t.assignee === who || (whoP && (t.assignee === whoP.id || (whoP.email && t.assignee === whoP.email)));
  const mine = () => tasks.filter(isMine);
  const open = (l) => l.filter((t) => status(t) !== 'Hecha');
  const clientOf = (t) => proj(t.project_id)?.client_slug || null;
  const dueChip = (d, st) => { if (!d || st === 'Hecha') return d ? html`<span class="mut sm">${fdate(d)}</span>` : '';
    return d < T0 ? html`<span class="chip red sm2">Atrasada</span>` : d === T0 ? html`<span class="chip red sm2">Hoy</span>` : d === T1 ? html`<span class="chip amber sm2">Mañana</span>` : html`<span class="mut sm">${fdate(d)}</span>`; };
  const trow = (t, extra = '') => html`<div class="wkrow ${status(t) === 'Hecha' ? 'done' : ''}" data-act="task" data-id="${t.id}">${extra}${t.assignee ? av(t.assignee, 20) : ''}<span class="grow">${status(t) !== 'Hecha' && blockersOf(t, tasks).length ? html`<span title="Espera a otra tarea">🔒 </span>` : ''}${t.title}<span class="mut sm"> · ${proj(t.project_id)?.client || proj(t.project_id)?.name || 'Interno'}</span></span>${dueChip(t.due, status(t))}</div>`;
  // Sin ruido: si todos los indicadores están en cero, no se muestran.
  const kpis = (list) => (list.every(([, v]) => !v) ? '' : html`<div class="wkkpis">${list.map(([l, v, c, act]) => html`<div class="wkkpi" ${act ? raw(`data-act="${act}"`) : ''}><span class="lbl">${l}</span><b style="${c ? `color:${c}` : ''}">${v}</b></div>`)}</div>`);
  const box = (title, sub, body, right = '') => html`<div class="card wkbox"><div class="wkhead"><div><h3 class="wkttl">${iconFor(title)}${title}</h3>${sub ? html`<span class="mut sm">${sub}</span>` : ''}</div><div class="sp"></div>${right}</div>${body}</div>`;

  // Las reuniones de los proyectos donde le toca estar a esta persona (próximos 30 días).
  function myMeetings() {
    const lim = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    const l = upcoming(projects).filter((m) => m.date <= lim && meetIsMine(m, team, who)).slice(0, matchMedia('(max-width:760px)').matches ? 1 : 3); // en el cel solo la próxima
    return l.length ? html`<div style="margin-bottom:14px">${box('Mis próximas reuniones', 'Las de tus proyectos: quiénes van y de qué se habla', meetingRows(l, team, { ...me, email: who }, false))}</div>` : '';
  }

  // ---------- pantalla ----------
  function paint() {
    if (!alive()) return;
    const tabs = [['zona', myRoles.length > 1 ? 'Resumen' : role ? roleName(role).split(' · ')[0] : 'Mi trabajo'], ['kanban', 'Kanban'], ...(canCoord ? [['equipo', 'Equipo']] : [])];
    const viewSel = isCeo ? html`<select class="in sm" id="viewAs" style="width:auto"><option value="">👁 Mi Workspace</option>${team.filter((p) => p.active !== false && p.kind !== 'ia' && p.id !== me.email).map((p) => html`<option value="${p.email || p.id}" ${asP && (asP.email || asP.id) === (p.email || p.id) ? raw('selected') : ''}>Ver como ${p.name}</option>`)}</select>` : '';
    mount(el, html`${asP ? html`<div class="asbar">👁 Estás viendo el Workspace de <b>${asP.name}</b> · lo que hagas aquí queda a su nombre <a href="#/work">Volver al mío</a></div>` : ''}<div class="wktop"><div><h1>${asP ? asP.name.split(' ')[0] : 'Workspace'}</h1><p class="mut">${role ? roleName(role) : asP ? 'Sin perfil de trabajo asignado' : 'Tu trabajo, en orden'}</p></div><div class="sp"></div>${viewSel}
        ${myRoles.length > 1 ? html`<div class="tabs" style="margin:0">${myRoles.map((r) => html`<button class="${r === role ? 'on' : ''}" data-act="role" data-r="${r}">${roleName(r).split(' · ')[0]}</button>`)}</div>` : ''}
        ${canCoord ? html`<button class="btn ghost" data-act="newProject">+ Proyecto</button>` : ''}<button class="btn" data-act="newTask">+ Tarea</button></div>
      <div class="tabs" style="margin:0 0 14px">${tabs.map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>
      ${tab === 'zona' ? myMeetings() : ''}<div id="wbody"></div>`);
    const vs = $('#viewAs', el); if (vs) vs.onchange = () => { location.hash = vs.value ? `/work/zona/_/${vs.value}` : '/work'; };
    const b = $('#wbody', el);
    if (tab === 'zona') return (ZONES[role] || noRole)(b);
    ({ kanban, equipo })[tab](b);
  }
  function noRole(b) {
    mount(b, html`<div class="grid g11">${box('Mis tareas', 'Lo que tienes abierto', myList(8))}${box('Todavía no tienes un perfil de trabajo', '', html`<div class="mut sm" style="padding:6px 0">El CEO te lo asigna en <b>Team → tu perfil → Perfiles de trabajo</b>. Mientras, usa tu Kanban.</div>`)}</div>`);
  }
  const myList = (n) => { const l = open(mine()).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9'))); return l.length ? html`${l.slice(0, n).map((t) => trow(t, html`<input type="checkbox" data-act="tdone" data-id="${t.id}">`))}` : html`<div class="mut sm" style="padding:8px 0">Nada abierto.</div>`; };

  // =================== piezas que comparten los perfiles ===================
  function checklist(r) {
    const id = `${who}.${r}.${ymNow()}`, doc = checks.find((c) => c.id === id), done = doc?.done || [];
    const items = CHECK[r] || [];
    const dnow = +T0.slice(8);
    return box(`Checklist del ciclo`, `${roleName(r).split(' · ')[0]} · ${ymNow()} · del día 1 al 20`, html`${items.map(([d, t], i) => html`<label class="wkcheck"><input type="checkbox" data-act="ck" data-r="${r}" data-i="${i}" ${done.includes(i) ? raw('checked') : ''}><span class="grow">${t}</span><span class="chip sm2 ${!done.includes(i) && d < dnow ? 'red' : !done.includes(i) && d <= dnow + 2 ? 'amber' : ''}">Día ${d}</span></label>`)}`,
      html`<span class="sm">${done.length}/${items.length}</span><div class="wkprog" style="width:70px;margin:0 0 0 8px"><i style="width:${items.length ? (done.length / items.length) * 100 : 0}%"></i></div>`);
  }
  // Las carpetas de Drive de cada perfil (guiones y piezas listas): las ve todo el equipo.
  const cfgs = {};
  function driveOf(slug) {
    if (!slug) return {};
    if (!cfgs[slug]) { cfgs[slug] = { loading: true }; api(`content/cfg?profile=${encodeURIComponent(slug)}`).then((c) => { cfgs[slug] = c; if (alive() && tab === 'zona') paint(); }).catch(() => { cfgs[slug] = {}; }); }
    return cfgs[slug];
  }
  const canContent = me.areas.includes('content');
  const guionesLink = (slug) => driveOf(slug).guiones_drive || (canContent ? `#/content/guiones/${slug}` : null);
  const planLink = (slug) => (canContent ? `#/content/plan/${slug}` : driveOf(slug).postear_drive || null);
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
  function stats(k) {
    const l = tasks.filter((t) => t.assignee === k); const m = ymNow();
    const month = l.filter((t) => String(t.due || t._meta?.created_at || '').slice(0, 7) === m || status(t) !== 'Hecha');
    const late = open(l).filter((t) => t.due && t.due < T0).length;
    return { total: month.length, done: month.filter((t) => status(t) === 'Hecha').length, late, open: open(l).length, dot: late ? '#a3392a' : open(l).length > 8 ? '#d08a2e' : '#5c7a1a' };
  }
  const people = () => team.filter((p) => p.active !== false && p.kind !== 'ia' && keyOf(p) !== ceoKey);
  const accBox = () => box('Accountability', 'Este mes', html`${people().map((p) => { const s = stats(keyOf(p)); return html`<div class="wkrow" data-act="person" data-k="${keyOf(p)}">${av(keyOf(p), 24)}<span class="grow"><b style="font-weight:500">${p.name.split(' ')[0]}</b><span class="mut sm"> · ${(p.roles || []).map((r) => roleName(r).split(' · ')[0]).join(', ') || p.title || ''}</span></span><span class="sm">${s.done}/${s.total}</span><i class="dot" style="background:${s.dot}"></i></div>`; })}`);
  function ceoZone(b) {
    const dq = decisions(), my = open(mine()).filter((t) => !t.due || t.due <= T1);
    mount(b, html`${kpis([['Mis tareas de hoy', my.length], ['Esperan tu decisión', dq.length, dq.length ? '#a3392a' : ''], ['Atrasadas', open(tasks).filter((t) => t.due && t.due < T0).length, '#a3392a'], ['En revisión', tasks.filter((t) => status(t) === 'En revisión').length]])}
      <div class="wkgrid">
        ${box('Mis tareas de hoy', '', html`${my.length ? my.slice(0, 8).map((t) => trow(t, html`<input type="checkbox" data-act="tdone" data-id="${t.id}">`)) : html`<div class="mut sm" style="padding:6px 0">Nada para hoy.</div>`}<input class="in sm" id="quick" placeholder="+ Tarea para hoy y Enter" style="margin-top:8px">`)}
        ${box('Esperan tu decisión', 'Gates de ① Strategy y ⑩ Ads, y lo que te rinde cuentas', dq.length ? html`${dq.slice(0, 8).map(decRow)}` : html`<div class="mut sm" style="padding:6px 0">Nada espera tu decisión. 🙌</div>`, dq.length ? html`<span class="badge-n">${dq.length}</span>` : '')}
        <div class="span2">${accBox()}</div>
      </div>`);
    hookQuick(b);
  }

  // =================== COO ===================
  function cooZone(b) {
    const review = tasks.filter((t) => status(t) === 'En revisión' && (accOf(t) === who || (whoP && accOf(t) === whoP.id)));
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
      </div>`);
  }

  // =================== VIDEO ===================
  function videoZone(b) {
    const vids = mine().filter((t) => /^(⑦|⑤|⑩)/.test(t.dept || '') || /video|reel|corte|ugc|ad/i.test(t.title));
    const q = open(vids).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
    const n = (s) => vids.filter((t) => status(t) === s).length;
    mount(b, html`${kpis([['Por producir', n('Por empezar')], ['En edición', n('En curso'), '#7f9631'], ['En revisión', n('En revisión'), '#b08a5f']])}
      <div class="wkgrid">
        <div class="span2">${box('Cola de producción', 'Tus videos y ads, por fecha de entrega', q.length ? html`<table class="wktable"><thead><tr><th>Pieza</th><th>Cliente</th><th>Tipo</th><th>Entrega</th><th>Estado</th></tr></thead><tbody>${q.slice(0, 8).map((t) => html`<tr class="click" data-act="task" data-id="${t.id}"><td><b style="font-weight:500">${t.title}</b></td><td class="mut">${proj(t.project_id)?.client || '—'}</td><td><span class="chip sm2 ${/^⑩/.test(t.dept || '') ? 'red' : ''}">${/^⑩/.test(t.dept || '') ? 'Ads' : 'Video'}</span></td><td>${dueChip(t.due, status(t)) || '—'}</td><td><span class="chip sm2">${status(t)}</span></td></tr>`)}</tbody></table>` : html`<div class="mut sm" style="padding:6px 0">Sin videos asignados. Cuando te asignen una tarea de ⑦ Video Editing o ⑩ Ads aparece aquí.</div>`)}</div>
        ${quick()}
        ${clientKit()}
        ${checklist('video')}
      </div>`);
    hookClient(b);
  }
  // Acceso rápido: SOPs y prompts generales (los crea el CEO en la Library, tipo «Prompt»).
  function quick() {
    const sopsV = docs.filter((d) => (d.roles || []).includes('video') && d.kind !== 'Prompt');
    const gen = docs.filter((d) => d.kind === 'Prompt' && !d.client);
    const link = (d) => html`<a class="wksop" href="#/library/${d.folder_id || '_'}/${d.id}"><span class="ftype" style="background:${d.kind === 'Prompt' ? '#b8583c' : '#4f7790'}">${d.kind === 'Prompt' ? '✦' : (d.kind || 'Doc').slice(0, 3).toUpperCase()}</span><span>${d.kind === 'Prompt' ? d.vtype || d.title : d.title}</span></a>`;
    return box('Acceso rápido', 'SOPs y prompts generales', html`${sopsV.length ? html`<div class="lbl" style="color:var(--mut);margin:2px 0 6px">SOPs</div><div class="wksops">${sopsV.slice(0, 4).map(link)}</div>` : ''}
      <div class="lbl" style="color:var(--mut);margin:10px 0 6px">Prompts generales</div>${gen.length ? html`<div class="wksops">${gen.slice(0, 6).map(link)}</div>` : html`<div class="mut sm">Todavía no hay. El CEO los crea en Library → + Documento → Prompt de video → General.</div>`}
      ${settings?.root ? html`<a class="wkrow" href="${settings.root}" target="_blank" rel="noopener noreferrer" style="margin-top:6px"><span class="fi">${IC.drive}</span><span class="grow">Carpeta de entregas en Drive</span><span class="mut">↗</span></a>` : ''}`, html`<a class="sm mut" href="#/library">Library →</a>`);
  }
  // Por cliente: sus assets en Drive y los prompts de esa marca por tipo de video.
  function clientKit() {
    const slugs = [...new Set(projects.map((p) => p.client_slug).filter(Boolean))];
    clientSel ||= clientOf(open(mine())[0] || {}) || slugs[0] || null;
    const info = clientSel && clientInfo[clientSel];
    if (clientSel && !info) api(`repo/client/${encodeURIComponent(clientSel)}`).then((r) => { clientInfo[clientSel] = r; if (alive() && tab === 'zona') paint(); }).catch(() => { clientInfo[clientSel] = { links: [], months: [] }; });
    const acc = accounts.find((x) => x.id === 'acc-' + clientSel) || {};
    const assets = /^https:\/\//.test(acc.assets || '') ? acc.assets : info?.links?.find((l) => /drive/i.test(l.k) && /^https:\/\//.test(l.url || ''))?.url;
    const prompts = docs.filter((d) => d.kind === 'Prompt' && d.client === clientSel);
    const byType = {}; prompts.forEach((d) => (byType[d.vtype || 'Otro'] ||= []).push(d));
    return box('Por cliente', 'Assets y prompts de cada marca', html`<select class="in" id="clientSel" style="margin-bottom:8px">${slugs.map((x) => html`<option value="${x}" ${x === clientSel ? raw('selected') : ''}>${x.toUpperCase()}</option>`)}</select>
      ${!clientSel ? html`<div class="mut sm">Sin clientes con proyecto.</div>` : html`
      ${assets ? html`<a class="wkrow" href="${assets}" target="_blank" rel="noopener noreferrer"><span class="fi">${IC.drive}</span><span class="grow"><b style="font-weight:500">Assets</b><span class="mut sm"> · logos, fotos, videos crudos</span></span><span class="mut">↗</span></a>` : html`<div class="wkrow"><span class="fi">${IC.drive}</span><span class="grow mut sm">Sin carpeta de assets. Se agrega en Clients → ${clientSel.toUpperCase()} → Editar datos.</span></div>`}
      ${[['📝', 'Guiones', 'en Drive', guionesLink(clientSel)], ['🎬', 'Videos por postear', 'carpeta de Drive', driveOf(clientSel).postear_drive], ...(canContent ? [['📅', 'Calendario', 'Planner del mes', `#/content/plan/${clientSel}`]] : [])].map(([i, t, sub, h]) => h
        ? html`<a class="wkrow" href="${h}" ${/^https/.test(h) ? raw('target="_blank" rel="noopener noreferrer"') : ''}><span style="width:22px;text-align:center">${i}</span><span class="grow">${t}<span class="mut sm"> · ${sub}</span></span><span class="mut">${/^https/.test(h) ? '↗' : '›'}</span></a>`
        : html`<div class="wkrow"><span style="width:22px;text-align:center">${i}</span><span class="grow mut sm">${t}: ${driveOf(clientSel).loading ? 'cargando…' : 'sin carpeta conectada. La conecta Content.'}</span></div>`)}
      <div class="lbl" style="color:var(--mut);margin:10px 0 6px">Prompts de ${clientSel.toUpperCase()}</div>
      ${prompts.length ? Object.entries(byType).map(([ty, l]) => html`<div class="wkrow"><span class="chip sm2">${ty}</span><span class="grow">${l.map((d, i) => html`${i ? ' · ' : ''}<a href="#/library/${d.folder_id || '_'}/${d.id}" style="color:inherit">${d.title}</a>`)}</span><button class="btn ghost xs" data-act="copyP" data-id="${l[0].id}">Copiar</button><button class="btn xs" data-act="claudeP" data-id="${l[0].id}" title="Abre tu Claude con este prompt (usa tu cuenta)">${ICON.sparkle} Claude</button></div>`)
        : html`<div class="mut sm">Sin prompts para esta marca. El CEO los crea en Library → Prompt de video.</div>`}`}`);
  }

  // =================== CONTENT ===================
  async function contentZone(b) {
    if (!posts) { mount(b, html`<p class="loading">Cargando…</p>`); posts = (await col('content').list().catch(() => [])).filter((c) => c.kind === 'post'); if (!alive()) return; }
    const n = (f) => posts.filter(f).length;
    const list = posts.filter((p) => p.date && p.date >= addDays(T0, -3) && p.status !== 'Publicado').sort((a, z) => String(a.date).localeCompare(String(z.date)));
    mount(b, html`${kpis([['Ideas', n((p) => (p.status || 'Idea') === 'Idea')], ['En producción', n((p) => ['Grabado', 'Editado'].includes(p.status)), '#c2735a'], ['Programado', n((p) => p.status === 'Programado'), '#5c6b22'], ['Sin fecha', n((p) => !p.date && p.status !== 'Publicado'), '#a3392a']])}
      <div class="wkgrid">
        <div class="span2">${box('Calendario de publicaciones', 'Qué sale, cuándo y en qué estado va', list.length ? html`<table class="wktable"><thead><tr><th>Fecha</th><th>Perfil</th><th>Formato</th><th>Pieza</th><th>Estado</th></tr></thead><tbody>${list.slice(0, 20).map((p) => html`<tr class="click" data-act="post" data-id="${p.id}"><td>${dueChip(p.date, p.status === 'Programado' ? 'Hecha' : '')}</td><td class="mut">${p.profile}</td><td>${p.format || '—'}</td><td><b style="font-weight:500">${p.title}</b></td><td><span class="chip sm2">${p.status || 'Idea'}</span></td></tr>`)}</tbody></table>` : html`<div class="mut sm" style="padding:6px 0">Sin publicaciones con fecha.</div>`, html`<button class="btn xs" data-act="newPost">+ Publicación</button>`)}</div>
        ${box('Mis tareas', '', myList(8))}
        ${checklist('content')}
      </div>`);
  }

  // =================== FINANCE + BUSINESS MAPPING ===================
  function financeZone(b) {
    const gp = projects.filter((p) => lineOf(p) === 'growth');
    mount(b, html`${kpis([['Proyectos', gp.length], ['Mis tareas abiertas', open(mine()).length], ['En revisión', mine().filter((t) => status(t) === 'En revisión').length, '#b08a5f']])}
      <div class="wkgrid">
        <div class="span2">${box('Mis proyectos', 'Business Growth: que ganen más y gasten menos', gp.length ? html`${gp.map((p) => { const ph = p.phases || []; const d = ph.filter((x) => x.status === 'done').length; return html`<a class="wkrow" href="${p.client_slug ? '#/clients/' + p.client_slug : '#/operations/pipe'}"><span class="grow"><b style="font-weight:500">${p.name}</b><span class="mut sm"> · ${ph.find((x) => x.status !== 'done')?.name || 'Terminado'}</span></span><div class="wkprog" style="width:120px;margin:0"><i style="width:${ph.length ? (d / ph.length) * 100 : 0}%;background:#b8583c"></i></div><span class="sm">${d}/${ph.length}</span></a>`; })}` : html`<div class="mut sm" style="padding:6px 0">Sin proyectos de Business Growth. Se crean en Operations → «+ Proyecto» → Business Growth.</div>`)}</div>
        ${box('Mis tareas', '', myList(8))}
        ${checklist('finance')}
      </div>`);
  }
  // =================== ADS MANAGEMENT · Meta, Google, LinkedIn ===================
  // La pauta no se lanza sin el OK del CEO (plan y presupuesto, y cada cambio de presupuesto): gate ⑩.
  const ADS = [['meta', 'Meta', (id) => `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${id}`], ['google', 'Google Ads', (id) => `https://ads.google.com/aw/campaigns?__e=${id.replace(/-/g, '')}`], ['linkedin', 'LinkedIn', (id) => `https://www.linkedin.com/campaignmanager/accounts/${id}/campaigns`]];
  // Ads: solo tres cosas — las campañas planificadas, cómo rinden y las tareas y proyectos.
  const CSTAT = [['Planificada', ''], ['Por aprobar', 'amber'], ['Aprobada', 'lime'], ['Corriendo', 'green'], ['Pausada', ''], ['Terminada', '']];
  let camps = null;
  function adsZone(b) {
    if (camps === null) { camps = []; col('campaigns').list().then((l) => { camps = l; if (alive() && role === 'ads') paint(); }).catch(() => {}); }
    const slugs = [...new Set(projects.filter((p) => p.client_slug && p.status !== 'cerrado').map((p) => p.client_slug))];
    const adsT = open(tasks).filter((t) => /^⑩/.test(t.dept || '') || /\bads\b|pauta|campaña/i.test(t.title || ''));
    const live = camps.filter((c) => c.status === 'Corriendo'), wait = camps.filter((c) => c.status === 'Por aprobar');
    const plan = camps.filter((c) => c.status !== 'Terminada').sort((a, z) => String(a.start || '9').localeCompare(String(z.start || '9')));
    const myProj = projects.filter((p) => p.status !== 'cerrado' && tasks.some((t) => t.project_id === p.id && adsT.includes(t)));
    const Qn = (v) => (v ? 'Q' + Number(v).toLocaleString('en-US') : '—');
    mount(b, html`${kpis([['Corriendo', live.length, '#4f6b12'], ['Por aprobar (CEO)', wait.length, wait.length ? '#a3392a' : ''], ['Planificadas', camps.filter((c) => c.status === 'Planificada').length], ['Mis tareas de Ads', adsT.filter(isMine).length]])}
      <div class="wkgrid">
        <div class="span2">${box('Campañas planificadas', 'Qué se lanza, cuándo y con cuánto. El CEO aprueba plan y presupuesto antes de lanzar (gate ⑩)', plan.length ? html`<table class="wktable"><thead><tr><th>Arranca</th><th>Cliente</th><th>Campaña</th><th>Plataforma</th><th class="n">Presupuesto</th><th>Estado</th><th></th></tr></thead><tbody>${plan.map((c) => { const [, tone] = CSTAT.find(([k]) => k === (c.status || 'Planificada')) || [];
            return html`<tr class="click" data-act="campEdit" data-id="${c.id}"><td>${c.start ? fdate(c.start) : '—'}${c.end ? html`<div class="mut sm">al ${fdate(c.end)}</div>` : ''}</td><td class="mut">${(c.client || '—').toUpperCase()}</td><td><b style="font-weight:500">${c.name}</b>${c.objective ? html`<div class="mut sm">${c.objective}</div>` : ''}</td>
              <td>${c.platform ? html`<span class="adsp"><span class="ailogo sm">${LOGO[c.platform] || ''}</span>${ADS.find(([k]) => k === c.platform)?.[1] || c.platform}</span>` : '—'}</td><td class="n">${Qn(c.budget)}</td><td><span class="chip sm2 ${tone}">${c.status || 'Planificada'}</span></td>
              <td style="white-space:nowrap">${(c.status || 'Planificada') === 'Planificada' ? html`<button class="btn ghost xs" data-act="campStep" data-id="${c.id}" data-s="Por aprobar">Mandar a aprobar</button>` : c.status === 'Por aprobar' && isCeo ? html`<button class="btn xs" data-act="campStep" data-id="${c.id}" data-s="Aprobada">Aprobar ✓</button>` : c.status === 'Aprobada' ? html`<button class="btn xs" data-act="campStep" data-id="${c.id}" data-s="Corriendo">Ya está corriendo</button>` : ''}</td></tr>`; })}</tbody></table>`
          : html`<div class="mut sm" style="padding:6px 0">Todavía no hay campañas. Agrega la primera con su fecha, plataforma y presupuesto.</div>`, html`<button class="btn xs" data-act="campNew">+ Campaña</button>`)}</div>
        ${box('Mis tareas de Ads', 'Con fecha, de la más urgente', adsT.filter(isMine).length ? html`${adsT.filter(isMine).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9'))).slice(0, 8).map((t) => trow(t, html`<input type="checkbox" data-act="tdone" data-id="${t.id}">`))}` : html`<div class="mut sm" style="padding:6px 0">Nada abierto.</div>`, html`<button class="btn ghost xs" data-act="laneTask" data-d="⑩ Ads">+</button>`)}
        <div class="span2">${adsReport()}</div>
        ${box('Proyectos con pauta', 'Avance de cada uno', myProj.length ? html`${myProj.map((p) => { const l = tasks.filter((t) => t.project_id === p.id), d = l.filter((t) => status(t) === 'Hecha').length; return html`<div class="wkrow"><span class="grow"><b style="font-weight:500">${p.client || p.name}</b><span class="mut sm"> · ${p.name}</span></span><div class="wkprog" style="width:80px;margin:0"><i style="width:${l.length ? (d / l.length) * 100 : 0}%"></i></div><span class="sm">${d}/${l.length}</span></div>`; })}` : html`<div class="mut sm" style="padding:6px 0">Ningún proyecto con tareas de Ads.</div>`)}
      </div>`);
    const ch = $('#adsch', b); if (ch && adsRep?.on) { const days = {}; adsRep.clients.forEach((c) => c.series.forEach((x) => (days[x.date] = (days[x.date] || 0) + x.spend))); const ks = Object.keys(days).sort(); if (ks.length > 1) lineChart(ch, ks.map((d) => fdate(d)), [{ name: 'Gasto', v: ks.map((d) => days[d]), c: '#171410', fill: true }], { fmt: (v) => 'Q' + Math.round(v).toLocaleString('en-US') }); else ch.remove(); }
    void slugs;
    const aa = $('#adsAcc', b); if (aa) aa.onchange = () => { const v = aa.value; aa.value = ''; adsAccounts(v); };
  }
  // Cómo va la pauta (Windsor lee Meta, Google Ads y LinkedIn de las cuentas conectadas).
  let adsRep, adsDays = 30;
  function adsReport() {
    if (adsRep === undefined) { adsRep = null; api('ads/report?days=' + adsDays).then((r) => { adsRep = r; if (alive() && role === 'ads') paint(); }).catch((e) => { adsRep = { error: e.message }; if (alive()) paint(); }); }
    const head = html`<div class="row" style="gap:8px;margin:0 0 10px;flex-wrap:wrap"><div class="tabs mini" style="margin:0">${[7, 30, 90].map((d) => html`<button class="${d === adsDays ? 'on' : ''}" data-act="adsDays" data-d="${d}">${d} días</button>`)}</div><div class="sp"></div><select class="in sm" id="adsAcc" style="width:auto"><option value="">Cuentas de un cliente…</option>${[...new Set(projects.filter((p) => p.client_slug && p.status !== 'cerrado').map((p) => p.client_slug))].map((x) => html`<option value="${x}">${x.toUpperCase()}</option>`)}</select></div>`;
    if (!adsRep) return box('Cómo va la pauta', 'Gasto y resultados reales', html`${head}<div class="mut sm">Cargando…</div>`);
    if (adsRep.error) return box('Cómo va la pauta', '', html`<div class="warnbox">${adsRep.error}</div>`);
    if (!adsRep.on) return box('Cómo va la pauta', 'Se lee de Windsor', html`<div class="mut sm">Falta <b>WINDSOR_API_KEY</b> en Vercel.</div>`);
    const Qn = (v) => (v == null ? '—' : 'Q' + Math.round(v).toLocaleString('en-US'));
    const cs = adsRep.clients.filter((c) => Object.keys(c.plats).length);
    const errs = Object.entries(adsRep.errors || {});
    return box('Cómo va la pauta', `Últimos ${adsRep.days} días · Meta, Google Ads y LinkedIn vía Windsor`, html`${head}
      ${errs.length ? html`<div class="warnbox sm" style="margin-bottom:8px">${errs.map(([p, e]) => html`<div><b>${p}</b>: ${/no .*accounts? .*configured|not configured|401|403/i.test(e) ? 'conecta la cuenta en Windsor' : e}</div>`)}</div>` : ''}
      ${cs.length ? html`<div class="chart" id="adsch" style="height:170px;margin-bottom:6px"></div>
        <table class="wktable"><thead><tr><th>Cliente</th><th class="n">Gasto</th><th class="n">Conv.</th><th class="n">CPA</th><th class="n">ROAS</th><th>Plataformas</th></tr></thead><tbody>
        ${cs.map((c) => { const pct = c.budget ? Math.round((c.total.spend / c.budget) * 100) : null;
          return html`<tr><td><b style="font-weight:500">${c.name}</b>${pct != null ? html`<div class="ctlbar" style="margin:6px 0 0;width:120px"><i style="width:${Math.min(100, pct)}%;${pct > 100 ? 'background:#a3392a' : ''}"></i></div><div class="mut sm">${pct}% de ${Qn(c.budget)}</div>` : ''}</td>
          <td class="n">${Qn(c.total.spend)}</td><td class="n">${c.total.conv || '—'}</td><td class="n">${Qn(c.total.cpa)}</td><td class="n">${c.total.roas ? c.total.roas + 'x' : '—'}</td>
          <td>${Object.entries(c.plats).map(([k, p]) => html`<span class="adsp" title="CTR ${p.ctr ?? '—'}% · ${p.clicks} clics"><span class="ailogo sm">${LOGO[k]}</span>${p.found ? Qn(p.spend) : 'sin datos'}</span>`)}</td></tr>`; })}</tbody></table>`
      : html`<div class="mut sm">Todavía no hay datos. Pon las cuentas de cada cliente arriba y conéctalas en Windsor.</div>`}`);
  }
  async function adsAccounts(sl) {
    if (!sl) return;
    const a = (accounts.find((x) => x.id === 'acc-' + sl) || {}).ads || {};
    const v = await ask(`Cuentas de pauta · ${sl.toUpperCase()}`, [{ k: 'meta', l: 'Meta · ID de la cuenta publicitaria (act_…)', v: a.meta || '' }, { k: 'google', l: 'Google Ads · ID de cliente (123-456-7890)', v: a.google || '' }, { k: 'linkedin', l: 'LinkedIn · ID de la cuenta de Campaign Manager', v: a.linkedin || '' }, { k: 'budget', l: 'Presupuesto mensual aprobado (Q)', t: 'number', v: a.budget || '' }]);
    if (!v) return;
    try { const r = await api('ads/accounts/' + encodeURIComponent(sl), { method: 'PUT', body: v }); const i = accounts.findIndex((x) => x.id === 'acc-' + sl); if (i >= 0) accounts[i] = { ...accounts[i], ads: r.ads }; else accounts.push({ id: 'acc-' + sl, ads: r.ads }); adsRep = undefined; toast('Guardado ✅'); paint(); } catch (e) { toast(e.message, true); }
  }
  async function campEdit(c) {
    const slugs = [...new Set(projects.filter((p) => p.client_slug).map((p) => p.client_slug))];
    const v = await ask(c ? 'Editar campaña' : 'Nueva campaña', [
      { k: 'client', l: 'Cliente', t: 'select', v: c?.client || slugs[0] || '', opts: slugs.map((x) => [x, x.toUpperCase()]), half: true },
      { k: 'platform', l: 'Plataforma', t: 'select', v: c?.platform || 'meta', opts: ADS.map(([k, l]) => [k, l]), half: true },
      { k: 'name', l: 'Nombre de la campaña', v: c?.name || '', req: true },
      { k: 'objective', l: 'Objetivo (una métrica)', v: c?.objective || '', half: true }, { k: 'budget', l: 'Presupuesto total (Q)', t: 'number', v: c?.budget || '', half: true },
      { k: 'start', l: 'Arranca', t: 'date', v: c?.start || '', half: true }, { k: 'end', l: 'Termina', t: 'date', v: c?.end || '', half: true },
      ...(c ? [{ k: 'status', l: 'Estado', t: 'select', v: c.status || 'Planificada', opts: CSTAT.map(([k]) => k).filter((k) => isCeo || !['Aprobada', 'Corriendo', 'Pausada'].includes(k) || k === c.status || ['Aprobada', 'Corriendo', 'Pausada'].includes(c.status)) }] : []),
      { k: 'notes', l: 'Notas', t: 'textarea', v: c?.notes || '' }], c ? 'Guardar' : 'Crear');
    if (!v) return;
    try { const r = c ? await col('campaigns').save({ ...c, ...v, budget: +v.budget || 0 }) : await col('campaigns').create({ ...v, budget: +v.budget || 0, status: 'Planificada' });
      camps = c ? camps.map((x) => (x.id === r.id ? r : x)) : [...camps, r]; toast(c && r.status === 'Por aprobar' && c.status !== 'Por aprobar' ? 'Cambió el presupuesto: vuelve a aprobación del CEO' : 'Guardado ✅'); paint(); } catch (e) { toast(e.message, true); }
  }
  const ZONES = { ceo: ceoZone, coo: cooZone, video: videoZone, content: contentZone, finance: financeZone, ads: adsZone };

  // ---------- conexiones de las piezas ----------
  function hookQuick(b) { const qi = $('#quick', b); if (qi) qi.onkeydown = async (e) => { if (e.key !== 'Enter' || !qi.value.trim()) return; if (await create({ title: qi.value.trim(), assignee: who, due: T0, status: 'Por empezar' })) paint(); }; }
  function hookClient(b) { const s = $('#clientSel', b); if (s) s.onchange = () => { clientSel = s.value; paint(); }; }
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
  async function newTask(pre = {}) { const r = await wizTask({ team, me: { ...me, email: who }, projects, pre }); if (r) { tasks.push(r); paint(); } }
  function openTask(t) {
    const draw = () => {
      const p = proj(t.project_id);
      drawer(html`<div class="row"><select class="in" id="wst" style="width:auto">${COLS.map(([s, l]) => html`<option value="${s}" ${s === status(t) ? raw('selected') : ''}>${l}</option>`)}</select><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
        <input class="in" id="wtitle" value="${t.title}" style="font-size:22px;font-weight:500;letter-spacing:-.5px;margin-top:12px;border:0;padding:6px 0;background:transparent">
        <div class="mut sm">${p ? (p.client ? p.client + ' · ' : '') + p.name : 'Interno'}</div>
        <div class="chain" style="margin-top:10px">${chain(t).map((k, i) => html`${i ? html`<span class="mut">→</span>` : ''}<span class="row" style="gap:5px">${av(k, 22)}<span class="sm">${nameOf(k).split(' ')[0]}</span></span>`)}</div>
        ${(() => { const w = blockersOf(t, tasks), u = unlocksOf(t, tasks).filter((x) => status(x) !== 'Hecha'); return w.length || u.length ? html`<div class="depbox">
          ${w.length ? html`<div><b>🔒 Espera a:</b> ${w.map((x) => html`<span class="dep">${x.title} · ${nameOf(x.assignee).split(' ')[0]}${x.due ? ' · ' + fdate(x.due) : ''}</span>`)}</div>` : ''}
          ${u.length ? html`<div class="mut"><b style="font-weight:500">Cuando la termines, destraba:</b> ${u.map((x) => html`<span class="dep">${x.title} · ${nameOf(x.assignee).split(' ')[0]}</span>`)}</div>` : ''}</div>` : ''; })()}
        ${t.kind === 'pago' && t.quote_id && status(t) !== 'Hecha' ? html`<button class="btn" data-act="tpay" style="margin-top:12px">Subir pago${t.amount_due ? ` · ${t.currency || 'GTQ'} ${Number(t.amount_due).toLocaleString('en-US')}` : ''}</button>` : ''}
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
        tpay: async () => { if (await payDialog({ quote_id: t.quote_id, client: (t.title.split('de ')[1] || '').split(' · ')[0], currency: t.currency, amount: t.amount_due })) { closeDrawer(); tasks = await col('tasks').list(); paint(); } },
        chk: async (cb) => { t = collect(); t.checklist[+cb.dataset.i].done = cb.checked; const r = await save(t); if (r) t = r; },
        addchk: async () => { const v = $('#wchk').value.trim(); if (!v) return; t = collect(); t.checklist = [...(t.checklist || []), { t: v, done: false }]; const r = await save(t); if (r) { t = r; draw(); } },
        wsave: async () => { if (await save(collect())) { toast('Guardado ✅'); closeDrawer(); paint(); } },
        deliver: async () => { const c = collect(); if (!c.link) { toast('Pega el link de tu entrega (Drive, Canva, Frame…)', true); $('#wlink').focus(); return; } if (await save({ ...c, status: 'En revisión' })) { toast('Entregado a revisión ✅'); closeDrawer(); paint(); } },
        approve: async () => { if (await save({ ...collect(), status: 'Hecha' })) { toast('Aprobado ✅'); closeDrawer(); paint(); } },
        back: async () => { const v = await ask('¿Qué hay que cambiar?', [{ k: 'note', l: 'Comentario para quien lo hizo', t: 'textarea', req: true }], 'Devolver'); if (!v) return; const c = collect(); if (await save({ ...c, status: 'En curso', comments: [...(c.comments || []), { who: me.name, at: new Date().toISOString(), text: '↩ ' + v.note }] })) { toast('Devuelto con comentario'); closeDrawer(); paint(); } },
        wdel: async () => { if (!(await confirmAsk(`¿Eliminar «${t.title}»?`))) return; await TK.remove(t.id); tasks = tasks.filter((x) => x.id !== t.id); closeDrawer(); paint(); },
      });
    };
    const collect = () => ({ ...t, title: $('#wtitle').value.trim() || t.title, status: $('#wst').value, assignee: $('#was').value, accountable: $('#wacc').value, due: $('#wdue').value, project_id: $('#wproj').value, description: $('#wdesc').value, link: $('#wlink').value.trim() });
    draw();
  }

  acts(el, {
    role: (t) => { role = t.dataset.r; tab = 'zona'; if (!asP) try { localStorage.setItem('work.role', role); } catch {} history.replaceState(null, '', `#/work/zona/${role}${asP ? '/' + who : ''}`); paint(); },
    tab: (t) => { tab = t.dataset.t; history.replaceState(null, '', `#/work/${tab}/${role || '_'}${asP ? '/' + who : ''}`); paint(); },
    adsDays: (t) => { adsDays = +t.dataset.d; adsRep = undefined; paint(); },
    adsEdit: (t) => adsAccounts(t.dataset.s),
    campNew: () => campEdit(null),
    campEdit: (t, e) => { if (e.target.closest('button')) return; campEdit(camps.find((c) => c.id === t.dataset.id)); },
    campStep: async (t) => { const c = camps.find((x) => x.id === t.dataset.id); try { const r = await col('campaigns').save({ ...c, status: t.dataset.s, ...(t.dataset.s === 'Aprobada' ? { approved_by: me.email, approved_at: new Date().toISOString() } : {}) }); camps = camps.map((x) => (x.id === r.id ? r : x)); toast(t.dataset.s === 'Por aprobar' ? 'Mandada al CEO para aprobar' : t.dataset.s === 'Aprobada' ? 'Aprobada ✅' : 'Marcada como corriendo'); paint(); } catch (e) { toast(e.message, true); } },
    kv: (t) => { kView = t.dataset.v; kanban($('#wbody', el)); },
    person: (t) => { personSel = t.dataset.k; tab = 'equipo'; paint(); },
    task: (t, e) => { if (e.target.closest('input,button')) return; const x = tasks.find((y) => y.id === t.dataset.id); if (x) openTask(x); },
    claudeP: (t) => { const d = docs.find((x) => x.id === t.dataset.id); if (d?.body) openClaude(d.body); },
    copyP: async (t) => { const d = docs.find((x) => x.id === t.dataset.id); try { await navigator.clipboard.writeText(d?.body || ''); toast('Prompt copiado ✅'); } catch { toast('No pude copiar', true); } },
    approveQ: async (t, e) => { e.stopPropagation(); const x = tasks.find((y) => y.id === t.dataset.id); if (await save({ ...x, status: 'Hecha' })) { toast('Aprobado ✅'); paint(); } },
    tdone: async (cb) => { const t = tasks.find((x) => x.id === cb.dataset.id); if (!(await save({ ...t, status: cb.checked ? 'Hecha' : 'En curso' }))) cb.checked = !cb.checked; else setTimeout(paint, 250); },
    ck: async (cb) => {
      const r = cb.dataset.r, i = +cb.dataset.i, id = `${who}.${r}.${ymNow()}`; const cur = checks.find((c) => c.id === id);
      const done = cb.checked ? [...new Set([...(cur?.done || []), i])] : (cur?.done || []).filter((x) => x !== i);
      try { const res = cur ? await CK.save({ ...cur, done }) : await CK.create({ id, role: r, month: ymNow(), done }); checks = [...checks.filter((c) => c.id !== id), res]; paint(); } catch (e) { cb.checked = !cb.checked; toast(e.message, true); }
    },
    post: async (t) => { const p = posts?.find((x) => x.id === t.dataset.id) || content.find((x) => x.id === t.dataset.id); if (!p) return; const r = await editPost(p.profile, p); if (r) { posts = posts.map((x) => (x.id === r.id ? r : x)); paint(); } },
    newPost: async () => { const pr = await ask('¿Para qué perfil?', [{ k: 'p', l: 'Perfil', t: 'select', opts: [['inherent', 'Inherent'], ['personal', 'Marca personal'], ...[...new Set(projects.map((p) => p.client_slug).filter(Boolean))].map((s) => [s, s.toUpperCase()])] }], 'Seguir'); if (!pr) return; const r = await editPost(pr.p, null); if (r) { posts = [...(posts || []), r]; paint(); } },
    newTask: () => newTask(),
    newProject: async () => { const r = await wizProject({ team, me, projects, tasks }); if (r) { projects.push(r.project); tasks.push(...r.tasks); paint(); } },
    colAdd: (t) => newTask({ status: t.dataset.s, assignee: kView === 'personal' ? who : '' }),
    laneTask: (t) => newTask({ dept: t.dataset.d }),
    assignTo: () => newTask({ assignee: personSel }),
  });
  paint();
}

function addDays(s, n) { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
