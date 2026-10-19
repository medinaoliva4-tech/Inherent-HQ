import { upcoming, meetingRows, isMine as meetIsMine } from '../meetings.js';
import { LOGO, lineChart, html, raw, mount, col, api, acts, toast, fdate, today, initials, IC, $, $$, ask, confirmAsk, drawer, closeDrawer, teamList, uploadToDrive, WORK_ROLES, roleName , calQ, calAll, setCalAll , openClaude, ICON, iconFor, swap, ico, md } from '../core.js';
import { editPost, loadPosts, PSTATUS } from '../posts.js';
import { tipoSopFields, bindSop, readTipoSop, sopLink, tipoChips, tipoMatch, tipoBadge } from '../tasktype.js';
import { newProject as wizProject, newTask as wizTask } from '../create.js';
import { blockersOf, unlocksOf } from '../cycle.js';
import { recipesWith, checksFor } from '../recipes.js';
import { payDialog } from '../flowui.js';
import { openDelivery, dueChip as tDue, stChip as tSt } from '../taskcard.js';
import { purposeCard } from '../purpose.js';
import { tone } from '../charts.js';

// Workspace: cada persona trabaja desde el perfil (o los perfiles) que tiene asignados en Team.
// Todos tienen su kanban personal, el de la empresa y sus tareas. Cada perfil agrega lo suyo:
// checklist del ciclo, SOPs, subir trabajo a revisión y el material del cliente.
const COLS = [['Por empezar', 'Por hacer', '#b29c87'], ['En curso', 'En progreso', '#a18770'], ['En revisión', 'En revisión', '#a68d77'], ['Hecha', 'Hecha', '#755943']];
const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
const PIPES = { contenido: { name: 'Contenido', sub: 'Marketing · producción y entrega', bar: '#795c45' }, growth: { name: 'Business Growth', sub: 'Consultoría que opera', bar: '#81634b' } };
const COLORS = ['#36271b', '#997d65', '#87684e', '#a18770', '#a68d77', '#735741'];
// El checklist del ciclo de cada perfil (se marca por mes) sale de la receta del Ciclo mensual (Administración → Recetas).
const COMMUNITY = ['Tono y voz de la marca', 'FAQ y respuestas frecuentes', 'Reglas de escalamiento', 'Plantillas de respuesta'];
const ymNow = () => today().slice(0, 7);

export async function render(el, { me, sub, alive }) {
  const TK = col('tasks'), CK = col('checks');
  const isCeo = me.role === 'ceo';
  let accounts = [], settings = null;
  let [tasks, projects, team, content, docs, checks, quotes, recipeDocs] = await Promise.all([
    TK.list(), col('projects').list(), teamList(), col('content').list().catch(() => []), col('docs').list().catch(() => []), CK.list().catch(() => []),
    isCeo ? col('quotes').list().catch(() => []) : [], col('recipes').list().catch(() => []),
  ]);
  const R = recipesWith(recipeDocs);
  const meP = team.find((p) => p.id === me.email || p.email === me.email);
  // «Ver como»: el CEO entra al Workspace de cualquier persona para revisar su trabajo.
  const asP = isCeo && sub[2] ? team.find((p) => p.id === sub[2] || p.email === sub[2]) : null;
  const who = asP ? asP.email || asP.id : me.email, whoP = asP || meP;
  const myRoles = asP ? asP.roles || [] : (meP?.roles?.length ? meP.roles : me.roles?.length ? me.roles : isCeo ? ['ceo'] : me.role === 'coo' ? ['coo'] : []);
  const pref = (() => { try { return localStorage.getItem('work.role'); } catch { return null; } })();
  let role = myRoles.includes(sub[1]) ? sub[1] : !asP && myRoles.includes(pref) ? pref : myRoles[0] || null;
  let tab = ['zona', 'kanban', 'pipes', 'equipo'].includes(sub[0]) ? sub[0] : 'zona';
  Promise.all([col('accounts').list().catch(() => []), col('settings').get('drive').catch(() => null)]).then(([a2, s2]) => { accounts = a2; settings = s2; if (alive() && tab === 'zona' && ['video', 'ads'].includes(role)) paint(); });
  let tipoF = 'todos', kView = 'personal', pipeSel = 'contenido', personSel = null, ctab = 'ideas', clientSel = null, ceoLane = 'estrategia';
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
  const pipeOf = (t) => { const p = proj(t.project_id); return p ? lineOf(p) : null; };
  const status = (t) => t.status || 'Por empezar';
  const isMine = (t) => t.assignee === who || (whoP && (t.assignee === whoP.id || (whoP.email && t.assignee === whoP.email)));
  const mine = () => tasks.filter(isMine);
  const open = (l) => l.filter((t) => status(t) !== 'Hecha');
  const clientOf = (t) => proj(t.project_id)?.client_slug || null;
  const dueChip = (d, st) => { if (!d || st === 'Hecha') return d ? html`<span class="mut sm">${fdate(d)}</span>` : '';
    return d < T0 ? html`<span class="chip red sm2">Atrasada</span>` : d === T0 ? html`<span class="chip red sm2">Hoy</span>` : d === T1 ? html`<span class="chip amber sm2">Mañana</span>` : html`<span class="mut sm">${fdate(d)}</span>`; };
  const trow = (t, extra = '') => html`<div class="wkrow ${status(t) === 'Hecha' ? 'done' : ''}" data-act="task" data-id="${t.id}">${extra}${t.assignee ? av(t.assignee, 20) : ''}<span class="grow">${status(t) !== 'Hecha' && blockersOf(t, tasks).length ? html`<span title="Espera a otra tarea">${ico('lock')} </span>` : ''}${t.title}<span class="mut sm"> · ${proj(t.project_id)?.client || proj(t.project_id)?.name || 'Interno'}</span></span>${dueChip(t.due, status(t))}</div>`;
  // Sin ruido: si todos los indicadores están en cero, no se muestran.
  const kpis = (list) => (list.every(([, v]) => !v) ? '' : html`<div class="wkkpis sp-kpis">${list.map(([l, v, c, act]) => html`<div class="wkkpi" ${act ? raw(`data-act="${act}"`) : ''}><span class="lbl">${l}</span><b style="${c ? `color:${tone(c)}` : ''}">${v}</b></div>`)}</div>`);
  const box = (title, sub, body, right = '', cls = 'card wkbox') => html`<div class="${cls}"><div class="wkhead"><div><h3 class="wkttl">${iconFor(title)}${title}</h3>${sub ? html`<span class="mut sm">${sub}</span>` : ''}</div><div class="sp"></div>${right}</div>${body}</div>`;

  // Las reuniones de los proyectos donde le toca estar a esta persona (próximos 30 días).
  function myMeetings() {
    const lim = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    const l = upcoming(projects).filter((m) => m.date <= lim && meetIsMine(m, team, who)).slice(0, matchMedia('(max-width:760px)').matches ? 1 : 3); // en el cel solo la próxima
    return l.length ? html`<div style="margin-bottom:14px">${box('Mis próximas reuniones', 'Las de tus proyectos: quiénes van y de qué se habla', meetingRows(l, team, { ...me, email: who }, false))}</div>` : '';
  }

  // ---------- pantalla ----------
  function paint() {
    if (!alive()) return;
    const tabs = [['zona', myRoles.length > 1 ? 'Resumen' : role ? roleName(role).split(' · ')[0] : 'Mi trabajo'], ['kanban', 'Kanban'], ...(canCoord ? [['pipes', 'Pipelines'], ['equipo', 'Equipo']] : [])];
    const viewSel = isCeo ? html`<select class="in sm" id="viewAs" style="width:auto"><option value="">Mi Workspace</option>${team.filter((p) => p.active !== false && p.kind !== 'ia' && p.id !== me.email).map((p) => html`<option value="${p.email || p.id}" ${asP && (asP.email || asP.id) === (p.email || p.id) ? raw('selected') : ''}>Ver como ${p.name}</option>`)}</select>` : '';
    mount(el, html`${asP ? html`<div class="asbar">${ico('eye')} Estás viendo el Workspace de <b>${asP.name}</b> · lo que hagas aquí queda a su nombre <a href="#/work">Volver al mío</a></div>` : ''}<div class="wktop"><div><h1>${asP ? asP.name.split(' ')[0] : 'Workspace'}</h1><p class="mut">${role ? roleName(role) : asP ? 'Sin perfil de trabajo asignado' : 'Tu trabajo, en orden'}</p></div><div class="sp"></div>${viewSel}
        ${myRoles.length > 1 ? html`<div class="tabs" style="margin:0">${myRoles.map((r) => html`<button class="${r === role ? 'on' : ''}" data-act="role" data-r="${r}">${roleName(r).split(' · ')[0]}</button>`)}</div>` : ''}
        ${canCoord ? html`<button class="btn ghost" data-act="newProject">+ Proyecto</button>` : ''}<button class="btn" data-act="newTask">+ Tarea</button></div>
      <div class="tabs" style="margin:0 0 14px">${tabs.map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>
      ${tab === 'zona' ? html`${purposeCard(asP ? { ...asP, role: asP.role || 'team', roles: asP.roles || [], email: who, viewsDoc: me.viewsDoc } : me, { area: 'work', own: !asP })}${myMeetings()}` : ''}<div id="wbody"></div>`);
    const vs = $('#viewAs', el); if (vs) vs.onchange = () => { location.hash = vs.value ? `/work/zona/_/${vs.value}` : '/work'; };
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
    const id = `${who}.${r}.${ymNow()}`, doc = checks.find((c) => c.id === id), done = doc?.done || [];
    const items = checksFor(R, r);
    return box(`Checklist · ${roleName(r).split(' · ')[0]}`, `Ciclo ${ymNow()}`, html`${items.map((t, i) => html`<label class="wkcheck"><input type="checkbox" data-act="ck" data-r="${r}" data-i="${i}" ${done.includes(i) ? raw('checked') : ''}><span>${t}</span></label>`)}`,
      html`<span class="sm">${done.length}/${items.length}</span><div class="wkprog" style="width:70px;margin:0 0 0 8px"><i style="width:${items.length ? (done.length / items.length) * 100 : 0}%"></i></div>`);
  }
  function sops(r) {
    const list = docs.filter((d) => (d.roles || []).includes(r)).slice(0, 6);
    const KC = { SOP: '#87684e', Playbook: '#a18770', Diagrama: '#84664d', Video: '#36271b', Nota: '#997d65' };
    return box('Mis SOPs y plantillas', 'De la Library', list.length ? html`<div class="wksops">${list.map((d) => html`<a class="wksop" href="#/library/${d.folder_id || '_'}/${d.id}"><span class="ftype" style="background:${KC[d.kind] || '#9f846d'}">${(d.kind || 'Doc').slice(0, 3).toUpperCase()}</span><span>${d.title}</span></a>`)}</div>`
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
    if (!list.length) return '';
    return box('Entregas recientes', html`<span class="wkflow"><span>Tú</span>→<span>Revisión ${nameOf(cooKey).split(' ')[0]}</span>→<span>Portal del cliente</span></span>`,
      list.length ? html`${list.map((t) => html`<div class="wkrow" data-act="task" data-id="${t.id}"><span class="fi">${IC.drive}</span><span class="grow">${t.title}<span class="mut sm"> · ${proj(t.project_id)?.client || 'Interno'}</span></span><span class="chip ${status(t) === 'Hecha' ? 'green' : 'amber'} sm2">${status(t) === 'Hecha' ? 'Aprobado' : 'En revisión'}</span></div>`)}` : html`<div class="mut sm" style="padding:6px 0">Todavía no entregas nada.</div>`);
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
  function material() {
    const slugs = [...new Set(projects.map((p) => p.client_slug).filter(Boolean))];
    clientSel ||= clientOf(open(mine())[0] || {}) || slugs[0] || null;
    const info = clientSel && clientInfo[clientSel];
    if (clientSel && !info) api(`repo/client/${encodeURIComponent(clientSel)}`).then((r) => { clientInfo[clientSel] = r; if (alive() && tab === 'zona') paint(); }).catch(() => { clientInfo[clientSel] = { links: [], months: [] }; });
    const link = (re) => info?.links?.find((l) => re.test(l.k) && /^https:\/\//.test(l.url || ''))?.url;
    const items = info ? [
      [ico('cal'), 'Calendario vigente', 'Planner del mes', planLink(clientSel) || `#/clients/${clientSel}`],
      [ico('palette'), 'Brand assets', 'Logos, paleta, tipografías', link(/figma|brand|marca/i) || link(/drive/i) || `#/clients/${clientSel}`],
      [ico('doc'), 'Brief y guiones', 'En Drive', guionesLink(clientSel) || `#/clients/${clientSel}`],
      [ico('folder'), 'Drive del cliente', 'Fotos, videos, material crudo', link(/drive/i) || `#/clients/${clientSel}`],
      [ico('bars'), 'Plan y pauta', 'Lo que incluye su plan', `#/clients/${clientSel}`],
    ] : [];
    return box('Material del cliente', '', html`<select class="in" id="clientSel" style="margin-bottom:6px">${slugs.map((s) => html`<option value="${s}" ${s === clientSel ? raw('selected') : ''}>${s.toUpperCase()}</option>`)}</select>
      ${!slugs.length ? html`<div class="mut sm">Sin clientes con proyecto.</div>` : !info ? html`<p class="loading sm">Cargando…</p>` : items.map(([i, t, s, h]) => html`<a class="wkrow" href="${h}" ${/^https/.test(h) ? raw('target="_blank" rel="noopener noreferrer"') : ''}><span style="width:22px;text-align:center">${i}</span><span class="grow"><b style="font-weight:500">${t}</b><span class="mut sm"> · ${s}</span></span><span class="mut">›</span></a>`)}`);
  }

  // =================== CEO ===================
  function decisions() {
    const out = [];
    for (const t of tasks) if (status(t) === 'En revisión' && accOf(t) === ceoKey) out.push({ t: `Revisar: ${t.title}`, sub: `${nameOf(t.assignee)} lo entregó`, tone: '#a68d77', act: 'task', id: t.id });
    for (const p of projects) {
      if (p.pipeline?.['①']?.status === 'now') out.push({ t: 'Aprobar la estrategia', sub: `${p.client || p.name} · gate ① Strategy`, tone: '#654c38', href: '#/operations/pipe' });
      if (p.pipeline?.['⑩']?.status === 'now') out.push({ t: 'Aprobar plan y presupuesto de pauta', sub: `${p.client || p.name} · gate ⑩ Ads`, tone: '#654c38', href: '#/operations/pipe' });
    }
    for (const q of quotes.filter((x) => x.status === 'Borrador')) out.push({ t: `Enviar cotización ${q.number}`, sub: q.client || '', tone: '#a18770', href: '#/sales/quotes' });
    return out;
  }
  const decRow = (d) => html`<${raw(d.href ? 'a' : 'div')} class="wkdec" ${raw(d.href ? `href="${d.href}"` : `data-act="${d.act}" data-id="${d.id}"`)} style="border-left-color:${d.tone}"><span class="grow"><b style="font-weight:500">${d.t}</b><span class="mut sm"> · ${d.sub}</span></span><span class="mut">›</span></${raw(d.href ? 'a' : 'div')}>`;
  function loadAgenda() { if (agenda !== null) return; agenda = []; api(`google/calendar?from=${T0}&to=${T0}${calQ()}`).then((r) => { agenda = r.events; if (alive() && tab === 'zona') paint(); }).catch(() => {}); }
  function agendaBox() {
    loadAgenda();
    const ps = content.filter((c) => c.kind === 'post' && c.date >= T0 && c.date <= T7 && c.status !== 'Publicado').sort((a, z) => a.date.localeCompare(z.date));
    return box('Agenda y contenido', 'Hoy · próximos 7 días', html`${agenda.length ? agenda.slice(0, 4).map((e) => html`<a class="wkrow" href="${/^https:\/\//.test(e.link || '') ? e.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="wkt">${e.allDay ? 'Día' : String(e.start).slice(11, 16)}</span><span class="grow">${e.summary}</span>${e.meet ? html`<span class="mut sm">Meet</span>` : ''}</a>`) : html`<div class="mut sm" style="padding:4px 0">Sin reuniones hoy.</div>`}
      ${ps.slice(0, 4).map((p) => html`<a class="wkrow" href="#/content/postear/${p.profile}"><span class="wkt" style="background:var(--bg)">${fdate(p.date)}</span><span class="grow">${p.title}<span class="mut sm"> · ${p.profile}</span></span></a>`)}`);
  }
  function stats(k) {
    const l = tasks.filter((t) => t.assignee === k); const m = ymNow();
    const month = l.filter((t) => String(t.due || t._meta?.created_at || '').slice(0, 7) === m || status(t) !== 'Hecha');
    const late = open(l).filter((t) => t.due && t.due < T0).length;
    return { total: month.length, done: month.filter((t) => status(t) === 'Hecha').length, late, open: open(l).length, dot: late ? '#654c38' : open(l).length > 8 ? '#aa917b' : '#84654c' };
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
    mount(b, html`${kpis([['Mis tareas de hoy', my.length], ['Esperan tu decisión', dq.length, dq.length ? '#654c38' : ''], ['Atrasadas', open(tasks).filter((t) => t.due && t.due < T0).length, ''], ['En revisión', tasks.filter((t) => status(t) === 'En revisión').length], ['Proyectos activos', projects.filter((p) => (p.phases || []).some((x) => x.status !== 'done')).length]])}
      <div class="wkgrid">
        ${box('Mis tareas de hoy', '', html`${my.length ? my.slice(0, 7).map((t) => trow(t, html`<input type="checkbox" data-act="tdone" data-id="${t.id}">`)) : html`<div class="mut sm" style="padding:6px 0">Nada para hoy.</div>`}<input class="in sm" id="quick" placeholder="+ Tarea para hoy y Enter" style="margin-top:8px">`)}
        ${box('Cola de decisiones', '', dq.length ? html`${dq.slice(0, 6).map(decRow)}` : html`<div class="mut sm" style="padding:6px 0">Nada espera tu decisión. ${ico('spark')}</div>`, dq.length ? html`<span class="badge-n">${dq.length}</span>` : '')}
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
    const review = tasks.filter((t) => status(t) === 'En revisión' && (accOf(t) === who || (whoP && accOf(t) === whoP.id)));
    const noOwner = open(tasks).filter((t) => !t.assignee);
    const upcoming = projects.flatMap((p) => (p.phases || []).filter((x) => x.status !== 'done' && x.start && x.start <= addDays(T0, 10) && (x.end || x.start) >= T0).map((x) => ({ p, x }))).sort((a, z) => a.x.start.localeCompare(z.x.start));
    const load = people().map((p) => ({ p, n: open(tasks.filter((t) => t.assignee === keyOf(p))).length })).sort((a, z) => z.n - a.n);
    const max = Math.max(1, ...load.map((x) => x.n));
    mount(b, html`${kpis([['Por revisar', review.length, review.length ? '#a68d77' : ''], ['Atrasadas', open(tasks).filter((t) => t.due && t.due < T0).length, '#654c38'], ['Sin responsable', noOwner.length], ['Mis tareas', open(mine()).length], ['Día del ciclo', `${Math.min(+T0.slice(8), 31)}/20`]])}
      <div class="wkgrid">
        ${checklist('coo')}
        ${box('Entregas por revisar', 'Te rinden cuentas a ti', review.length ? html`${review.slice(0, 7).map((t) => html`<div class="wkrow" data-act="task" data-id="${t.id}">${av(t.assignee, 20)}<span class="grow">${t.title}<span class="mut sm"> · ${proj(t.project_id)?.client || 'Interno'}</span></span><button class="btn ghost xs" data-act="approveQ" data-id="${t.id}">${ico('check', 14)}</button></div>`)}` : html`<div class="mut sm" style="padding:6px 0">Nada por revisar.</div>`)}
        ${box('Próximos controles del ciclo', 'Fases de los próximos 10 días', upcoming.length ? html`${upcoming.slice(0, 6).map(({ p, x }) => html`<a class="wkrow" href="#/operations/time"><span class="wkt">${fdate(x.start)}</span><span class="grow"><b style="font-weight:500">${x.name}</b><span class="mut sm"> · ${p.client || p.name}</span></span><span class="chip sm2 ${x.status === 'now' ? 'lime' : ''}">${x.status === 'now' ? 'En curso' : 'Pendiente'}</span></a>`)}` : html`<div class="mut sm" style="padding:6px 0">Sin fases próximas.</div>`)}
        ${box('Carga del equipo', 'Tareas abiertas por persona', html`${load.map(({ p, n }) => html`<div class="wkrow" data-act="person" data-k="${keyOf(p)}">${av(keyOf(p), 20)}<span style="width:80px">${p.name.split(' ')[0]}</span><div class="wkprog grow" style="margin:0"><i style="width:${(n / max) * 100}%;background:${n > 8 ? '#aa917b' : '#795c45'}"></i></div><span class="sm" style="width:20px;text-align:right">${n}</span></div>`)}`)}
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
    mount(b, html`${kpis([['Por producir', n('Por empezar')], ['En edición', n('En curso'), '#a18770'], ['En revisión', n('En revisión'), '#a68d77']])}
      <div class="wkgrid">
        <div class="span2">${box('Cola de producción', 'Tus videos y ads, por fecha de entrega', q.length ? html`<table class="wktable"><thead><tr><th>Pieza</th><th>Cliente</th><th>Tipo</th><th>Entrega</th><th>Estado</th></tr></thead><tbody>${q.slice(0, 8).map((t) => html`<tr class="click" data-act="task" data-id="${t.id}"><td><b style="font-weight:500">${t.title}</b></td><td class="mut">${proj(t.project_id)?.client || '—'}</td><td><span class="chip sm2 ${/^⑩/.test(t.dept || '') ? 'red' : ''}">${/^⑩/.test(t.dept || '') ? 'Ads' : 'Video'}</span></td><td>${dueChip(t.due, status(t)) || '—'}</td><td><span class="chip sm2">${status(t)}</span></td></tr>`)}</tbody></table>` : html`<div class="mut sm" style="padding:6px 0">Sin videos asignados. Cuando te asignen una tarea de ⑦ Video Editing o ⑩ Ads aparece aquí.</div>`)}</div>
        ${quick()}
        ${clientKit()}
        ${uploader('Subir corte para revisión')}
        ${checklist('video')}
        ${deliveries()}
      </div>`);
    hookUpload(b); hookClient(b);
  }
  // Acceso rápido: SOPs y prompts generales (los crea el CEO en la Library, tipo «Prompt»).
  function quick() {
    const sopsV = docs.filter((d) => (d.roles || []).includes('video') && d.kind !== 'Prompt');
    const gen = docs.filter((d) => d.kind === 'Prompt' && !d.client);
    const link = (d) => html`<a class="wksop" href="#/library/${d.folder_id || '_'}/${d.id}"><span class="ftype" style="background:${d.kind === 'Prompt' ? '#81634b' : '#87684e'}">${d.kind === 'Prompt' ? ico('spark') : (d.kind || 'Doc').slice(0, 3).toUpperCase()}</span><span>${d.kind === 'Prompt' ? d.vtype || d.title : d.title}</span></a>`;
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
      ${assets ? html`<a class="wkrow" href="${assets}" target="_blank" rel="noopener noreferrer"><span class="fi">${IC.drive}</span><span class="grow"><b style="font-weight:500">Assets</b><span class="mut sm"> · logos, fotos, videos crudos</span></span><span class="mut">↗</span></a>` : html`<div class="wkrow"><span class="fi">${IC.drive}</span><span class="grow mut sm">Sin carpeta de assets. Se agrega en Clientes → ${clientSel.toUpperCase()} → Editar datos.</span></div>`}
      ${[[ico('doc'), 'Guiones', 'en Drive', guionesLink(clientSel)], [ico('video'), 'Videos por postear', 'carpeta de Drive', driveOf(clientSel).postear_drive], ...(canContent ? [[ico('cal'), 'Calendario', 'Planner del mes', `#/content/plan/${clientSel}`]] : [])].map(([i, t, sub, h]) => h
        ? html`<a class="wkrow" href="${h}" ${/^https/.test(h) ? raw('target="_blank" rel="noopener noreferrer"') : ''}><span style="width:22px;text-align:center">${i}</span><span class="grow">${t}<span class="mut sm"> · ${sub}</span></span><span class="mut">${/^https/.test(h) ? '↗' : '›'}</span></a>`
        : html`<div class="wkrow"><span style="width:22px;text-align:center">${i}</span><span class="grow mut sm">${t}: ${driveOf(clientSel).loading ? 'cargando…' : 'sin carpeta conectada. La conecta Content.'}</span></div>`)}
      <div class="lbl" style="color:var(--mut);margin:10px 0 6px">Prompts de ${clientSel.toUpperCase()}</div>
      ${prompts.length ? Object.entries(byType).map(([ty, l]) => html`<div class="wkrow"><span class="chip sm2">${ty}</span><span class="grow">${l.map((d, i) => html`${i ? ' · ' : ''}<a href="#/library/${d.folder_id || '_'}/${d.id}" style="color:inherit">${d.title}</a>`)}</span><button class="btn ghost xs" data-act="copyP" data-id="${l[0].id}">Copiar</button><button class="btn xs" data-act="claudeP" data-id="${l[0].id}" title="Abre tu Claude con este prompt (usa tu cuenta)">${ICON.sparkle} Claude</button></div>`)
        : html`<div class="mut sm">Sin prompts para esta marca. El CEO los crea en Library → Prompt de video.</div>`}`}`);
  }

  // =================== CONTENT ===================
  async function contentZone(b) {
    if (!posts) { mount(b, html`<p class="loading">Cargando…</p>`); const all = (await col('content').list().catch(() => [])).filter((c) => c.kind === 'post'); posts = all; if (!alive()) return; }
    const ideas = posts.filter((p) => (p.status || 'Idea') === 'Idea'), prod = posts.filter((p) => ['Grabado', 'Editado'].includes(p.status));
    const design = open(mine()).filter((t) => /^⑥/.test(t.dept || '') || /diseñ|static|estátic|carrusel/i.test(t.title));
    const subtabs = [['ideas', 'Ideas y preproducción'], ['diseno', 'Diseño y static ads'], ['matriz', 'Matriz y publicaciones'], ['community', 'Community']];
    mount(b, html`${kpis([['Ideas por desarrollar', ideas.length, '', ''], ['En producción', prod.length, '#997d65'], ['Diseños pendientes', design.length, '#a68d77'], ['Por publicar (7 días)', posts.filter((p) => p.date >= T0 && p.date <= T7 && p.status !== 'Publicado').length, '#795c45']])}
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
          if (cur) await A.save({ ...cur, community }); else await A.create({ id, name: cb.dataset.s.toUpperCase(), roadmap: [], accesos: [], community }); toast('Guardado'); } catch (e) { cb.checked = !cb.checked; toast(e.message, true); }
      }));
    }
  }

  // =================== FINANCE + BUSINESS MAPPING ===================
  function financeZone(b) {
    const gp = projects.filter((p) => lineOf(p) === 'growth');
    mount(b, html`${kpis([['Proyectos', gp.length], ['Mis tareas abiertas', open(mine()).length], ['En revisión', mine().filter((t) => status(t) === 'En revisión').length, '#a68d77']])}
      <div class="wkgrid">
        <div class="span2">${box('Mis proyectos', 'Business Growth: que ganen más y gasten menos', gp.length ? html`${gp.map((p) => { const ph = p.phases || []; const d = ph.filter((x) => x.status === 'done').length; return html`<a class="wkrow" href="${p.client_slug ? '#/clients/' + p.client_slug : '#/operations/pipe'}"><span class="grow"><b style="font-weight:500">${p.name}</b><span class="mut sm"> · ${ph.find((x) => x.status !== 'done')?.name || 'Terminado'}</span></span><div class="wkprog" style="width:120px;margin:0"><i style="width:${ph.length ? (d / ph.length) * 100 : 0}%;background:#81634b"></i></div><span class="sm">${d}/${ph.length}</span></a>`; })}` : html`<div class="mut sm" style="padding:6px 0">Sin proyectos de Business Growth. Se crean en Operaciones → Proyectos → «+ Proyecto» → Business Growth.</div>`)}</div>
        ${box('Mis tareas', '', myList(8))}
        ${checklist('finance')}${uploader('Entregar trabajo')}${sops('finance')}
      </div>`);
    hookUpload(b);
  }
  // =================== ADS MANAGEMENT · el puesto de la persona de pauta ===================
  // Por cliente con pauta contratada (la ficha dice «Pauta» o ⑩ Ads está en su pipeline, o tiene cuenta o presupuesto
  // de pauta): el encargo (objetivo, métrica, presupuesto y OK del CEO), los pasos del método de ⑩ con su skill `ad-*`,
  // sus tareas de la semana, las campañas y el aprendizaje del repo. Sin el OK del CEO (gate ⑩) nada se lanza.
  // Nada de costos ni márgenes de Inherent: el presupuesto es del cliente y va aparte.
  const ADS = [['meta', 'Meta', (id) => `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${id}`], ['google', 'Google Ads', (id) => `https://ads.google.com/aw/campaigns?__e=${id.replace(/-/g, '')}`], ['linkedin', 'LinkedIn', (id) => `https://www.linkedin.com/campaignmanager/accounts/${id}/campaigns`]];
  const CAMP_PLATS = [['meta', 'Meta'], ['google', 'Google Ads'], ['tiktok', 'TikTok'], ['linkedin', 'LinkedIn']];
  const CAMP_ST = ['Borrador', 'Activa', 'Pausada', 'Terminada'];
  // Las capas del WORKFLOW de ⑩ Ads, en orden, con la skill que las corre y cómo se reconoce su tarea.
  const STEPS = [
    ['0', 'Encargo', 'ad-encargo', 'Objetivo en una métrica, presupuesto del cliente, acceso a las cuentas y tracking', /encargo|objetivo|presupuesto|tracking|acceso/i],
    ['1', 'Estructura', 'ad-estructura', 'Cuántas campañas, con qué objetivo, qué públicos y cómo se reparte el presupuesto', /estructura|p[úu]blico|campañ|keyword|audienc/i],
    ['2', 'Creativos', 'ad-creativos', 'Qué piezas se pautan y con qué variantes de hook · claims validados por ②B Branding', /creativ|variante|hook|claim/i],
    ['G', 'Gate 1 · OK del CEO', null, 'El CEO aprueba el plan y el presupuesto. Sin esto no se lanza', null],
    ['3', 'Lanzamiento', 'ad-lanzamiento', 'Se corre lo aprobado y se anota qué quedó corriendo y desde cuándo', /lanz/i],
    ['4', 'Optimización', 'ad-optimizacion', 'Pacing, fatiga y qué se mueve · un cambio a la vez · cada cambio de presupuesto pasa por el Gate 2', /optimiz|pacing|fatiga|pausa/i],
    ['5', 'Atribución', 'ad-atribucion', 'Qué ventas vinieron de la pauta · solo Growth Partnership, con atribución limpia', /atribu/i],
    ['↻', 'Loop', 'ad-loop', 'Qué hook ganó, qué fatigó, qué vuelve a ④ Creatividad y a ② Growth · escribe aprendizaje-de-pauta.md', /aprendiz|loop|cierre|revisi[óo]n del 20/i],
  ];
  let adsSel = null, campaigns, campsOn = null;
  const adsInfo = {}, pautaInfo = {};
  const isAdsT = (t) => /^⑩/.test(t.dept || '') || /\bads\b|pauta|campaña/i.test(t.title || '');
  const byDue = (a, z) => String(a.due || '9').localeCompare(String(z.due || '9'));
  const adsAcc = (sl) => accounts.find((x) => x.id === 'acc-' + sl)?.ads || {};
  const fichaPauta = (sl) => { const i = adsInfo[sl]; if (!i || i.loading) return null; return (i.fields || []).find((f) => /^pauta|publicidad/i.test(f.key))?.value || (i.pipeline || []).find((p) => /⑩/.test(p.paso))?.que || ''; };
  const hasPauta = (sl) => { const a = adsAcc(sl), f = fichaPauta(sl); return Boolean(a.meta || a.google || a.linkedin || a.budget || a.objetivo) || (f ? !/no entra|no incluye|no aplica|^no\b|^—|sin pauta/i.test(f) : false) || tasks.some((t) => isAdsT(t) && clientOf(t) === sl); };
  // El OK del CEO vale para este mes y para ese presupuesto: si cambia el monto, se vuelve a pedir (gate 2).
  const okOf = (a) => (a.ok && a.ok.month === ymNow() && a.ok.budget === (a.budget || null) ? a.ok : null);
  const Q = (v) => 'Q' + Number(v || 0).toLocaleString('en-US');
  function loadInfos(slugs) { for (const sl of slugs) if (!adsInfo[sl]) { adsInfo[sl] = { loading: true }; api(`repo/client/${encodeURIComponent(sl)}`).then((r) => { adsInfo[sl] = r; }).catch(() => { adsInfo[sl] = { fields: [], pipeline: [] }; }).then(() => alive() && role === 'ads' && tab === 'zona' && paint()); } }
  function loadCamps() { if (campaigns !== undefined) return; campaigns = null; col('campaigns').list().then((l) => { campaigns = l; campsOn = true; }).catch(() => { campaigns = []; campsOn = false; }).then(() => alive() && role === 'ads' && tab === 'zona' && paint()); }
  function loadPauta(sl) { if (!sl || pautaInfo[sl]) return; pautaInfo[sl] = { loading: true }; api(`repo/client/${encodeURIComponent(sl)}/pauta`).then((r) => { pautaInfo[sl] = r; }).catch((e) => { pautaInfo[sl] = { error: e.message }; }).then(() => alive() && role === 'ads' && tab === 'zona' && paint()); }
  // Mientras la colección «campaigns» no esté habilitada en el servidor, una campaña se guarda como tarea de ⑩ (kind «campaign»).
  const campOf = (t) => ({ id: t.id, _task: t, client_slug: clientOf(t), name: t.title.replace(/^Campaña · /, ''), ...(t.campaign || {}) });
  const campsFor = (sl) => [...(campaigns || []).filter((c) => c.client_slug === sl), ...tasks.filter((t) => t.kind === 'campaign' && clientOf(t) === sl).map(campOf)];
  const RUN = ['Activa', 'Pausada', 'Terminada'];
  function stepState(sl, [k, , , , re], camps, a, ok) {
    const l = re ? tasks.filter((t) => isAdsT(t) && clientOf(t) === sl && re.test(t.title)) : [];
    const byTasks = l.length ? (l.every((t) => status(t) === 'Hecha') ? 'hecho' : 'curso') : 'pend';
    if (k === '0') return a.objetivo && a.metrica && a.budget ? 'hecho' : byTasks;
    if (k === '1') return camps.length ? 'hecho' : byTasks;
    if (k === 'G') return ok ? 'hecho' : 'espera';
    if (k === '3') return camps.some((c) => RUN.includes(c.status)) ? 'hecho' : ok ? byTasks : 'bloq';
    if (k === '4') return byTasks === 'pend' && camps.some((c) => c.status === 'Activa') ? 'curso' : byTasks;
    if (k === '↻') return pautaInfo[sl]?.aprendizaje ? 'hecho' : byTasks;
    return byTasks;
  }
  function encargoBox(sl) {
    const a = adsAcc(sl), ok = okOf(a), f = fichaPauta(sl), info = adsInfo[sl];
    const plats = ADS.filter(([k]) => a[k]).map(([, l]) => l);
    const v = (x, nd = '⚠️ SIN DATOS') => (x ? html`${x}` : html`<span class="nd">${nd}</span>`);
    return box('Encargo', 'Lo que se compra con la pauta · capa 0', html`<div class="encargo">
      <div><span class="lbl">Objetivo</span>${v(a.objetivo)}</div>
      <div><span class="lbl">Métrica</span>${v(a.metrica, '⚠️ SIN DATOS · una métrica, no un deseo')}</div>
      <div><span class="lbl">Qué se vende</span>${v(a.oferta, 'Lo define ② Growth')}</div>
      <div><span class="lbl">Canales</span>${v([a.canales, ...plats].filter(Boolean).join(' · ') || null)}</div>
      <div><span class="lbl">Presupuesto del cliente</span>${a.budget ? html`${Q(a.budget)}/mes <span class="mut sm">· lo pone el cliente, aparte</span>` : v(null)}</div>
      <div><span class="lbl">Ficha de oferta</span>${!info || info.loading ? html`<span class="mut sm">Cargando…</span>` : f ? html`${f}` : html`<span class="nd">Sin fila «Pauta» en la ficha: revisa el alcance antes de prometer</span>`}</div></div>
      <div class="adsgate ${ok ? 'ok' : ''}">${ok ? html`${ico('check', 15)}<span><b style="font-weight:500">OK del CEO</b> · ${fdate(ok.at)} · ${Q(ok.budget)}/mes</span>` : html`${ico('lock', 15)}<span><b style="font-weight:500">Esperando OK del CEO</b> · sin el OK del plan y el presupuesto no se lanza nada</span>`}<div class="sp"></div>
        ${isCeo && !asP ? html`<button class="btn xs ${ok ? 'ghost' : ''}" data-act="adsOk" data-s="${sl}" data-v="${ok ? '0' : '1'}">${ok ? 'Retirar OK' : 'Dar OK'}</button>` : ''}</div>`,
      html`<button class="btn ghost xs" data-act="encargoEdit" data-s="${sl}">Editar</button>`, 'sp-panel');
  }
  function stepsBox(sl) {
    const a = adsAcc(sl), ok = okOf(a), camps = campsFor(sl);
    let marked = false;
    const rows = STEPS.map((s) => { let st = stepState(sl, s, camps, a, ok); if (!marked && st !== 'hecho') { marked = true; if (st === 'pend') st = 'ahora'; } return [s, st]; });
    const LBL = { hecho: ['Hecho', 'green'], curso: ['En curso', 'lime'], ahora: ['Ahora', 'dark'], espera: ['Esperando OK del CEO', 'amber'], bloq: ['Sin OK: no se lanza', 'red'], pend: ['Pendiente', ''] };
    return box('Pasos del método', 'El flujo de ⑩ Ads · cada paso dice qué skill correr en Claude', html`<div class="adsteps sp-steps">${rows.map(([[k, name, skill, sub], st]) => html`<div class="adstep ${st}"><span class="n">${k}</span><span><b style="font-weight:500">${name}</b></span>
      <span class="st"><span class="chip sm2 ${LBL[st][1]}">${LBL[st][0]}</span>${skill ? html`<button class="sk" data-act="skill" data-k="${skill}" data-s="${sl}" data-n="${name}" title="Abre Claude con este paso">${skill}</button>` : isCeo && !asP && !ok ? html`<button class="btn xs" data-act="adsOk" data-s="${sl}" data-v="1">Dar OK</button>` : html`<span class="sk" style="cursor:default">CEO</span>`}</span>
      <span class="sub">${sub}</span></div>`)}</div>`, html`<span class="sm">${rows.filter(([, st]) => st === 'hecho').length}/${rows.length}</span>`, 'sp-panel');
  }
  function weekBox(sl) {
    const l = open(mine()).filter((t) => isAdsT(t) && clientOf(t) === sl).sort(byDue), week = l.filter((t) => !t.due || t.due <= T7);
    return box('Esta semana', 'Tus tareas de ⑩ Ads con su fecha · entrega desde aquí', week.length ? html`${week.slice(0, 8).map((t) => html`<div class="wkrow"><span class="grow" data-act="deliver" data-id="${t.id}"><b style="font-weight:500">${t.title}</b></span>${tDue(t)}${tSt(t)}<button class="btn xs" data-act="deliver" data-id="${t.id}">${status(t) === 'En revisión' ? 'Ver' : 'Entregar'}</button></div>`)}${l.length > week.length ? html`<div class="mut sm" style="padding:6px 0">+ ${l.length - week.length} más adelante</div>` : ''}`
      : html`<div class="mut sm" style="padding:6px 0">Nada de ⑩ Ads esta semana para este cliente.</div>`, html`<button class="btn ghost xs" data-act="adsTask" data-s="${sl}">+</button>`, 'sp-panel');
  }
  function campsBox(sl) {
    const l = campsFor(sl).sort((a, z) => String(z.from || '').localeCompare(String(a.from || ''))), P = Object.fromEntries(CAMP_PLATS);
    return box('Campañas', campsOn === false ? 'Se guardan como tareas de ⑩ Ads mientras se habilita la colección «campaigns»' : 'Lo que está armado y corriendo · nombre, plataforma, estado, presupuesto diario y fechas',
      campaigns === null && !l.length ? html`<p class="loading sm">Cargando…</p>` : l.length ? html`<div class="camps"><table class="wktable"><thead><tr><th>Campaña</th><th>Plataforma</th><th>Estado</th><th class="n">Diario</th><th>Desde</th><th>Hasta</th></tr></thead><tbody>
        ${l.map((c) => html`<tr class="click" data-act="campEdit" data-id="${c.id}" data-s="${sl}"><td><b style="font-weight:500">${c.name}</b>${c.objective ? html`<div class="mut sm">${c.objective}</div>` : ''}</td><td>${P[c.platform] || c.platform || '—'}</td><td><span class="chip sm2 ${c.status === 'Activa' ? 'lime' : c.status === 'Pausada' ? 'amber' : c.status === 'Terminada' ? 'green' : ''}">${c.status || 'Borrador'}</span></td><td class="n">${c.daily ? Q(c.daily) : '—'}</td><td>${c.from ? fdate(c.from) : '—'}</td><td>${c.to ? fdate(c.to) : '—'}</td></tr>`)}</tbody></table></div>`
      : html`<div class="mut sm" style="padding:6px 0">Sin campañas registradas. Cuando <b>ad-estructura</b> las arme, anótalas aquí; «Activa» solo con el OK del CEO.</div>`, html`<button class="btn xs" data-act="campNew" data-s="${sl}">+ Campaña</button>`, 'sp-panel');
  }
  function learnBox(sl) {
    loadPauta(sl); const pi = pautaInfo[sl];
    return box('Aprendizaje', 'Lo que dejó el ciclo anterior · aprendizaje-de-pauta.md del cliente', !pi || pi.loading ? html`<p class="loading sm">Cargando…</p>` : pi.error ? html`<div class="mut sm">${pi.error}</div>`
      : pi.aprendizaje ? html`<div class="adslearn">${md(pi.aprendizaje)}</div>` : html`<div class="mut sm" style="padding:6px 0">Todavía no hay <code>aprendizaje-de-pauta.md</code> para este cliente. Lo escribe <b>ad-loop</b> al cerrar el ciclo (revisión del 20).</div>`,
      pi && !pi.loading && !pi.error ? html`<span class="mut sm">${pi.plan ? 'plan ✓' : 'sin plan'} · ${pi.reporte ? 'reporte ✓' : 'sin reporte'}</span>` : '', 'sp-panel sp-read');
  }
  const cuentasBox = (slugs) => box('Cuentas de pauta', 'Por cliente: abre su Ads Manager directo', slugs.length ? html`${slugs.map((sl) => { const a = adsAcc(sl);
    return html`<div class="adsrow"><b style="font-weight:500;min-width:90px">${sl.toUpperCase()}</b><div class="adsplat">${ADS.map(([k, l, url]) => a[k] ? html`<a class="adsp" href="${url(a[k])}" target="_blank" rel="noopener noreferrer"><span class="ailogo sm">${LOGO[k]}</span>${l} ↗</a>` : html`<span class="adsp off"><span class="ailogo sm">${LOGO[k]}</span>${l}</span>`)}</div>
      ${a.budget ? html`<span class="mut sm">${Q(a.budget)}/mes</span>` : ''}<button class="btn ghost xs" data-act="adsEdit" data-s="${sl}">Cuentas</button></div>`; })}` : html`<div class="mut sm">Sin clientes con proyecto activo.</div>`);
  function adsZone(b) {
    const slugs = [...new Set(projects.filter((p) => p.client_slug && p.status !== 'cerrado').map((p) => p.client_slug))];
    loadInfos(slugs); loadCamps();
    const withAds = slugs.filter(hasPauta), loading = slugs.some((sl) => adsInfo[sl]?.loading);
    if (!withAds.includes(adsSel)) { const first = clientOf(open(mine()).sort(byDue).find(isAdsT) || {}); adsSel = withAds.includes(first) ? first : withAds[0] || null; }
    const myAds = open(mine()).filter(isAdsT), waiting = withAds.filter((sl) => !okOf(adsAcc(sl)));
    const active = withAds.reduce((n, sl) => n + campsFor(sl).filter((c) => c.status === 'Activa').length, 0);
    mount(b, html`${kpis([['Clientes con pauta', withAds.length], ['Esperan OK del CEO', waiting.length, waiting.length ? '#725741' : ''], ['Mis tareas de ⑩ esta semana', myAds.filter((t) => !t.due || t.due <= T7).length], ['Campañas activas', active]])}
      ${withAds.length ? html`<div class="adscli">${withAds.map((sl) => html`<span class="chip ${sl === adsSel ? 'dark' : ''}" data-act="adsCli" data-s="${sl}"><i class="${okOf(adsAcc(sl)) ? 'ok' : ''}"></i>${sl.toUpperCase()}</span>`)}${loading ? html`<span class="mut sm">Leyendo fichas…</span>` : ''}</div>` : ''}
      ${adsSel ? html`<div class="wkgrid">${encargoBox(adsSel)}${stepsBox(adsSel)}${weekBox(adsSel)}<div class="span2">${campsBox(adsSel)}</div>${learnBox(adsSel)}</div>`
        : html`<div class="empty" style="margin-bottom:12px"><b>${loading ? 'Leyendo las fichas…' : 'Ningún cliente con pauta contratada'}</b>${loading ? '' : 'Un cliente entra aquí cuando su ficha de oferta incluye pauta (fila «Pauta» o ⑩ Ads en su pipeline) o cuando tiene cuenta o presupuesto de pauta en Clientes.'}</div>`}
      <div class="sec-title"><h2>La pauta en general</h2><span class="mut sm">Cuentas, cómo va y qué hace la competencia</span></div>
      <div class="wkgrid">
        <div class="span2">${cuentasBox(slugs)}</div>
        <div class="span2">${adsReport()}</div>
        ${box('Mis tareas', '', myList(8))}
        <div class="span2">${adsComp(slugs)}</div>
        ${checklist('ads')}${uploader('Entregar trabajo')}${sops('ads')}
      </div>`);
    hookUpload(b);
    const cs = $('#compSel', b); if (cs) cs.onchange = () => { compSel = cs.value; comp = null; paint(); };
    const ch = $('#adsch', b); if (ch && adsRep?.on) { const days = {}; adsRep.clients.forEach((c) => c.series.forEach((x) => (days[x.date] = (days[x.date] || 0) + x.spend))); const ks = Object.keys(days).sort(); if (ks.length > 1) lineChart(ch, ks.map((d) => fdate(d)), [{ name: 'Gasto', v: ks.map((d) => days[d]), c: '#2c1f16', fill: true }], { fmt: (v) => 'Q' + Math.round(v).toLocaleString('en-US') }); else ch.remove(); }
  }
  // Guarda el encargo o las cuentas de un cliente (PUT ads/accounts): el servidor conserva el OK del CEO si el presupuesto no cambió.
  async function putAds(sl, v) {
    try { const r = await api('ads/accounts/' + encodeURIComponent(sl), { method: 'PUT', body: v }); const i = accounts.findIndex((x) => x.id === 'acc-' + sl); if (i >= 0) accounts[i] = { ...accounts[i], ads: r.ads }; else accounts.push({ id: 'acc-' + sl, ads: r.ads }); return r.ads; } catch (e) { toast(e.message, true); return null; }
  }
  async function campForm(sl, c = null) {
    const v = await ask(c ? `Campaña · ${c.name}` : `Nueva campaña · ${sl.toUpperCase()}`, [
      { k: 'name', l: 'Nombre', v: c?.name || '', req: true },
      { k: 'platform', l: 'Plataforma', t: 'select', opts: CAMP_PLATS, v: c?.platform || 'meta', half: true }, { k: 'status', l: 'Estado', t: 'select', opts: CAMP_ST, v: c?.status || 'Borrador', half: true },
      { k: 'daily', l: 'Presupuesto diario (Q)', t: 'number', v: c?.daily || '', half: true }, { k: 'objective', l: 'Objetivo · métrica', v: c?.objective || '', half: true },
      { k: 'from', l: 'Desde', t: 'date', v: c?.from || '', half: true }, { k: 'to', l: 'Hasta', t: 'date', v: c?.to || '', half: true },
    ], c ? 'Guardar' : 'Registrar');
    if (!v) return;
    if (v.status === 'Activa' && c?.status !== 'Activa' && !okOf(adsAcc(sl))) { toast('Sin el OK del CEO no se lanza: queda como borrador', true); v.status = 'Borrador'; }
    const data = { name: v.name.trim(), platform: v.platform, status: v.status, daily: +v.daily || null, objective: v.objective.trim(), from: v.from, to: v.to };
    const tst = data.status === 'Terminada' ? 'Hecha' : 'En curso';
    try {
      if (c?._task) { if (await save({ ...c._task, title: `Campaña · ${data.name}`, campaign: data, status: tst })) toast('Guardado'); }
      else if (c) { const r = await col('campaigns').save({ ...c, ...data }); campaigns = campaigns.map((x) => (x.id === r.id ? r : x)); toast('Guardado'); }
      else if (campsOn) { const r = await col('campaigns').create({ ...data, client_slug: sl }); campaigns = [...(campaigns || []), r]; toast('Campaña registrada'); }
      else { const p = projects.find((x) => x.client_slug === sl && x.status !== 'cerrado'); if (await create({ title: `Campaña · ${data.name}`, kind: 'campaign', campaign: data, dept: '⑩ Ads', project_id: p?.id || '', assignee: who, status: tst, due: data.to || '' })) toast('Campaña registrada'); }
      paint();
    } catch (e) { toast(e.message, true); }
  }
  // Cómo va la pauta (Windsor lee Meta, Google Ads y LinkedIn de las cuentas conectadas).
  let adsRep, adsDays = 30, compSel = null, comp = null;
  function adsReport() {
    if (adsRep === undefined) { adsRep = null; api('ads/report?days=' + adsDays).then((r) => { adsRep = r; if (alive() && role === 'ads') paint(); }).catch((e) => { adsRep = { error: e.message }; if (alive()) paint(); }); }
    const head = html`<div class="tabs mini" style="margin:0 0 10px">${[7, 30, 90].map((d) => html`<button class="${d === adsDays ? 'on' : ''}" data-act="adsDays" data-d="${d}">${d} días</button>`)}</div>`;
    if (!adsRep) return box('Cómo va la pauta', 'Gasto y resultados reales', html`${head}<div class="mut sm">Cargando…</div>`);
    if (adsRep.error) return box('Cómo va la pauta', '', html`<div class="warnbox">${adsRep.error}</div>`);
    if (!adsRep.on) return box('Cómo va la pauta', 'Se lee de Windsor', html`<div class="mut sm">Las cuentas de pauta todavía no están conectadas al OS. Pídeselo a quien administra la app.</div>`);
    const Qn = (v) => (v == null ? '—' : 'Q' + Math.round(v).toLocaleString('en-US'));
    const cs = adsRep.clients.filter((c) => Object.keys(c.plats).length);
    const errs = Object.entries(adsRep.errors || {});
    return box('Cómo va la pauta', `Últimos ${adsRep.days} días · Meta, Google Ads y LinkedIn vía Windsor`, html`${head}
      ${errs.length ? html`<div class="warnbox sm" style="margin-bottom:8px">${errs.map(([p, e]) => html`<div><b>${p}</b>: ${/no .*accounts? .*configured|not configured|401|403/i.test(e) ? 'conecta la cuenta en Windsor' : e}</div>`)}</div>` : ''}
      ${cs.length ? html`<div class="chart" id="adsch" style="height:170px;margin-bottom:6px"></div>
        <table class="wktable"><thead><tr><th>Cliente</th><th class="n">Gasto</th><th class="n">Conv.</th><th class="n">CPA</th><th class="n">ROAS</th><th>Plataformas</th></tr></thead><tbody>
        ${cs.map((c) => { const pct = c.budget ? Math.round((c.total.spend / c.budget) * 100) : null;
          return html`<tr><td><b style="font-weight:500">${c.name}</b>${pct != null ? html`<div class="ctlbar" style="margin:6px 0 0;width:120px"><i style="width:${Math.min(100, pct)}%;${pct > 100 ? 'background:#654c38' : ''}"></i></div><div class="mut sm">${pct}% de ${Qn(c.budget)}</div>` : ''}</td>
          <td class="n">${Qn(c.total.spend)}</td><td class="n">${c.total.conv || '—'}</td><td class="n">${Qn(c.total.cpa)}</td><td class="n">${c.total.roas ? c.total.roas + 'x' : '—'}</td>
          <td>${Object.entries(c.plats).map(([k, p]) => html`<span class="adsp" title="CTR ${p.ctr ?? '—'}% · ${p.clicks} clics"><span class="ailogo sm">${LOGO[k]}</span>${p.found ? Qn(p.spend) : 'sin datos'}</span>`)}</td></tr>`; })}</tbody></table>`
      : html`<div class="mut sm">Todavía no hay datos. Pon las cuentas de cada cliente arriba y conéctalas en Windsor.</div>`}`);
  }
  // Lo que anuncia la competencia en Meta (Apify · biblioteca de anuncios).
  function adsComp(slugs) {
    compSel ||= slugs[0] || null;
    if (compSel && (!comp || comp.slug !== compSel)) { comp = { slug: compSel, loading: true }; api('ads/competitors/' + encodeURIComponent(compSel)).then((r) => { comp = { slug: compSel, ...r }; if (alive() && role === 'ads') paint(); }).catch((e) => { comp = { slug: compSel, error: e.message }; if (alive()) paint(); }); }
    const running = comp?.run && !comp.items && !['FAILED', 'ABORTED', 'TIMED-OUT'].includes(comp.run.status);
    return box('Anuncios de la competencia', 'Lo que tienen activo en Meta ahora · Apify', !compSel ? html`<div class="mut sm">Sin clientes.</div>` : html`
      <div class="row" style="gap:8px;flex-wrap:wrap"><select class="in" id="compSel" style="width:auto">${slugs.map((x) => html`<option value="${x}" ${x === compSel ? raw('selected') : ''}>${x.toUpperCase()}</option>`)}</select>
        <textarea class="in" id="compList" rows="2" style="flex:1;min-width:220px" placeholder="Una por línea: página de Facebook (https://facebook.com/marca) o el nombre de la marca">${(comp?.competitors || []).join('\n')}</textarea>
        <button class="btn" data-act="compRun" ${running ? raw('disabled') : ''}>${running ? 'Scrapeando…' : 'Buscar anuncios'}</button></div>
      ${comp?.error ? html`<div class="warnbox sm" style="margin-top:8px">${comp.error}</div>` : ''}
      ${running ? html`<div class="mut sm" style="margin-top:8px">Apify está leyendo la biblioteca de anuncios (1-3 min). <button class="sm linkish" data-act="compRefresh">Ver si ya terminó</button></div>` : ''}
      ${comp?.items?.length ? html`<div class="adsgrid">${comp.items.slice(0, 24).map((a) => html`<a class="adcard" href="${a.id ? `https://www.facebook.com/ads/library/?id=${a.id}` : a.link || '#'}" target="_blank" rel="noopener noreferrer">
          ${a.img ? html`<img src="${a.img}" alt="" loading="lazy" referrerpolicy="no-referrer">` : html`<div class="adnoimg">${a.video ? ico('play', 13) : 'Aa'}</div>`}
          <div class="adbody"><b>${a.page}</b>${a.since ? html`<span class="mut sm"> · desde ${fdate(a.since)}</span>` : ''}<div class="sm">${(a.title ? a.title + ' — ' : '') + a.text.slice(0, 160)}</div>${a.cta ? html`<span class="chip sm2">${a.cta}</span>` : ''}</div></a>`)}</div>`
        : comp?.items ? html`<div class="mut sm" style="margin-top:8px">No encontré anuncios activos de esas marcas.</div>` : ''}
      <div class="mut sm" style="margin-top:10px">Google y LinkedIn: <a href="https://adstransparency.google.com/" target="_blank" rel="noopener noreferrer">Google Ads Transparency ↗</a> · <a href="https://www.linkedin.com/ad-library/" target="_blank" rel="noopener noreferrer">LinkedIn Ad Library ↗</a></div>`);
  }
  const ZONES = { ceo: ceoZone, coo: cooZone, video: videoZone, content: contentZone, finance: financeZone, ads: adsZone };

  // ---------- conexiones de las piezas ----------
  function hookQuick(b) { const qi = $('#quick', b); if (qi) qi.onkeydown = async (e) => { if (e.key !== 'Enter' || !qi.value.trim()) return; if (await create({ title: qi.value.trim(), assignee: who, due: T0, status: 'Por empezar' })) paint(); }; }
  function hookClient(b) { const s = $('#clientSel', b); if (s) s.onchange = () => { clientSel = s.value; paint(); }; }
  function hookUpload(b) {
    const inp = $('#upIn', b), drop = $('#drop', b); if (!inp) return;
    const go = async (file) => {
      if (!file) return;
      let t = tasks.find((x) => x.id === $('#upTask', b).value);
      if (!t) { const v = await ask('¿Qué estás entregando?', [{ k: 'title', l: 'Nombre de la entrega', v: file.name.replace(/\.[^.]+$/, ''), req: true }, { k: 'project_id', l: 'Proyecto', t: 'select', opts: [['', '— Interno'], ...projects.map((p) => [p.id, p.name])] }], 'Subir'); if (!v) return; t = await create({ ...v, assignee: who, status: 'En curso' }); if (!t) return; }
      const bar = $('#upBar', b); bar.hidden = false;
      try {
        const f = await uploadToDrive(file, `${t.title} · ${file.name}`, (p) => { bar.firstElementChild.style.width = Math.round(p * 100) + '%'; }, { client: proj(t.project_id)?.client || 'Interno', sub: ymNow() });
        const r = await save({ ...t, link: f.link, status: 'En revisión', files: [...(t.files || []), { name: f.name, link: f.link, at: new Date().toISOString() }] });
        if (r) { toast(`Subido y enviado a revisión de ${nameOf(accOf(r)).split(' ')[0]}`); paint(); }
      } catch (e) { bar.hidden = true; toast(e.message, true); }
    };
    inp.onchange = () => go(inp.files[0]);
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); go(e.dataTransfer.files[0]); };
  }

  // =================== KANBAN · PIPELINES · EQUIPO ===================
  const card = (t) => { const p = proj(t.project_id);
    return html`<div class="kcard wk" draggable="true" data-act="task" data-id="${t.id}"><b>${t.title}</b><div class="mut sm">${p ? (p.client || p.name) : 'Interno'}${t.dept ? ' · ' + t.dept.split(' ')[0] : ''}${tipoBadge(t)}</div>
      <div class="row" style="margin-top:8px;gap:6px">${t.assignee ? av(t.assignee, 20) : ''}<span class="sm">${t.assignee ? nameOf(t.assignee).split(' ')[0] : '—'}</span><div class="sp"></div>${dueChip(t.due, status(t))}</div></div>`; };
  function kanban(b) {
    const base = (kView === 'personal' ? mine() : tasks).filter((t) => tipoMatch(t, tipoF));
    mount(b, html`<div class="row" style="margin-bottom:12px;gap:8px"><div class="tabs mini" style="margin:0"><button class="${kView === 'personal' ? 'on' : ''}" data-act="kv" data-v="personal">Personal</button><button class="${kView === 'empresa' ? 'on' : ''}" data-act="kv" data-v="empresa">Empresa</button></div><span class="mut sm">${open(base).length} abiertas · arrastra para mover</span><div class="sp"></div>${tipoChips(tipoF, 'tipof', kView === 'personal' ? mine() : tasks)}</div>
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
    const list = tasks.filter((t) => pipeOf(t) === pipeSel && tipoMatch(t, tipoF)).sort((a, z) => (status(a) === 'Hecha') - (status(z) === 'Hecha') || String(a.due || '9').localeCompare(String(z.due || '9')));
    mount(b, html`<div class="grid g11" style="margin-bottom:12px">${Object.keys(PIPES).map((k) => html`<div class="card wkbox" style="${k === pipeSel ? 'outline:2px solid var(--ink)' : ''}">${pipeMini(k)}</div>`)}</div>
      <div style="margin-bottom:10px">${tipoChips(tipoF, 'tipof', tasks.filter((t) => pipeOf(t) === pipeSel))}</div>
      ${list.length ? html`<div class="card wkbox"><table class="wktable"><thead><tr><th>Tarea</th><th>Proyecto</th><th>Responsable → rinde cuentas</th><th>Estado</th><th>Vence</th></tr></thead><tbody>
        ${list.map((t) => html`<tr class="click" data-act="task" data-id="${t.id}"><td><b style="font-weight:500">${t.title}</b>${t.dept ? html`<span class="mut sm"> · ${t.dept}</span>` : ''}${tipoBadge(t)}</td><td class="mut">${proj(t.project_id)?.name || '—'}</td><td><span class="chain">${chain(t).map((k, i) => html`${i ? html`<span class="mut">→</span>` : ''}${av(k, 22)}`)}</span></td><td><span class="chip sm2">${status(t)}</span></td><td>${dueChip(t.due, status(t)) || '—'}</td></tr>`)}</tbody></table></div>`
        : html`<div class="empty"><b>Sin tareas en ${PIPES[pipeSel].name}</b>Las tareas de sus proyectos aparecen aquí.</div>`}`);
  }
  function equipo(b) {
    const sel = personSel && person(personSel);
    const list = sel ? tasks.filter((t) => t.assignee === personSel).sort((a, z) => (status(a) === 'Hecha') - (status(z) === 'Hecha') || String(a.due || '9').localeCompare(String(z.due || '9'))) : [];
    mount(b, html`<div class="wkgrid">${people().map((p) => { const k = keyOf(p), s = stats(k), pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
      return html`<div class="card wkbox" data-act="person" data-k="${k}" style="cursor:pointer;${personSel === k ? 'outline:2px solid var(--ink)' : ''}"><div class="row">${av(k, 36)}<div class="grow"><b style="font-weight:500">${p.name}</b><div class="mut sm">${(p.roles || []).map(roleName).join(' · ') || p.title || ''}</div></div><i class="dot" style="background:${s.dot}"></i></div>
        <div class="row" style="margin-top:10px"><b style="font-size:22px;font-weight:400">${s.done}<span class="mut sm">/${s.total}</span></b><div class="sp"></div><span class="sm" style="${s.late ? 'color:var(--warn);font-weight:700' : ''}">${s.late ? s.late + ' atrasadas' : 'Al día'}</span></div><div class="wkprog"><i style="width:${pct}%"></i></div></div>`; })}</div>
      ${sel ? html`<div class="sec-title"><h2>Tareas de ${sel.name}</h2><button class="btn ghost xs" data-act="assignTo">+ Asignarle</button></div><div class="card wkbox">${list.length ? list.map((t) => trow(t)) : html`<div class="mut sm">Sin tareas.</div>`}</div>` : ''}`);
  }

  // =================== tareas ===================
  async function save(t) { try { const r = await TK.save(t); tasks = tasks.map((x) => (x.id === r.id ? r : x)); return r; } catch (e) { toast(e.message, true); return null; } }
  async function create(t) { try { const r = await TK.create({ checklist: [], comments: [], ...t }); tasks.push(r); toast('Tarea creada'); return r; } catch (e) { toast(e.message, true); return null; } }
  const peopleOpts = () => [['', '—'], ...team.filter((p) => p.active !== false).map((p) => [keyOf(p), p.name + ((p.roles || []).length ? ' · ' + roleName(p.roles[0]).split(' · ')[0] : p.title ? ' · ' + p.title : '')])];
  async function newTask(pre = {}) { const r = await wizTask({ team, me: { ...me, email: who }, projects, pre }); if (r) { tasks.push(r); paint(); } }
  function openTask(t) {
    const draw = () => {
      const p = proj(t.project_id);
      drawer(html`<div class="row"><select class="in" id="wst" style="width:auto">${COLS.map(([s, l]) => html`<option value="${s}" ${s === status(t) ? raw('selected') : ''}>${l}</option>`)}</select><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
        <input class="in" id="wtitle" value="${t.title}" style="font-size:22px;font-weight:500;letter-spacing:-.5px;margin-top:12px;border:0;padding:6px 0;background:transparent">
        <div class="mut sm">${p ? (p.client ? p.client + ' · ' : '') + p.name : 'Interno'}${pipeOf(t) ? ' · ' + PIPES[pipeOf(t)].name : ''}</div>
        <div class="chain" style="margin-top:10px">${chain(t).map((k, i) => html`${i ? html`<span class="mut">→</span>` : ''}<span class="row" style="gap:5px">${av(k, 22)}<span class="sm">${nameOf(k).split(' ')[0]}</span></span>`)}</div>
        ${(() => { const w = blockersOf(t, tasks), u = unlocksOf(t, tasks).filter((x) => status(x) !== 'Hecha'); return w.length || u.length ? html`<div class="depbox">
          ${w.length ? html`<div><b>${ico('lock')} Espera a:</b> ${w.map((x) => html`<span class="dep">${x.title} · ${nameOf(x.assignee).split(' ')[0]}${x.due ? ' · ' + fdate(x.due) : ''}</span>`)}</div>` : ''}
          ${u.length ? html`<div class="mut"><b style="font-weight:500">Cuando la termines, destraba:</b> ${u.map((x) => html`<span class="dep">${x.title} · ${nameOf(x.assignee).split(' ')[0]}</span>`)}</div>` : ''}</div>` : ''; })()}
        ${t.kind === 'pago' && t.quote_id && status(t) !== 'Hecha' ? html`<button class="btn" data-act="tpay" style="margin-top:12px">Subir pago${t.amount_due ? ` · ${t.currency || 'GTQ'} ${Number(t.amount_due).toLocaleString('en-US')}` : ''}</button>` : ''}
        <div class="form" style="margin-top:14px">
          <div class="two"><div><label class="f">Responsable</label><select class="in" id="was">${peopleOpts().map(([k, l]) => html`<option value="${k}" ${k === (t.assignee || '') ? raw('selected') : ''}>${l}</option>`)}</select></div>
            <div><label class="f">Rinde cuentas</label><select class="in" id="wacc">${[['', 'Su jefe directo'], ...peopleOpts().slice(1)].map(([k, l]) => html`<option value="${k}" ${k === (t.accountable || '') ? raw('selected') : ''}>${l}</option>`)}</select></div></div>
          <div class="two"><div><label class="f">Vence</label><input class="in" id="wdue" type="date" value="${t.due || ''}"></div>
            <div><label class="f">Proyecto</label><select class="in" id="wproj"><option value="">— Interno</option>${projects.map((x) => html`<option value="${x.id}" ${x.id === t.project_id ? raw('selected') : ''}>${x.name}</option>`)}</select></div></div>
          ${tipoSopFields(t, docs, 'w')}
          <div><label class="f">Descripción / brief</label><textarea class="in" id="wdesc">${t.description || ''}</textarea></div>
          <div><label class="f">Entrega (link)</label><input class="in" id="wlink" value="${t.link || ''}" placeholder="https://drive.google.com/…"></div>
        </div>
        ${(t.files || []).length ? html`<div class="lbl" style="color:var(--mut);margin-top:10px">Archivos</div>${t.files.map((f) => html`<a class="wkrow" href="${/^https:\/\//.test(f.link) ? f.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="fi">${IC.drive}</span><span class="grow">${f.name}</span><span class="mut sm">${fdate(String(f.at).slice(0, 10))}</span></a>`)}` : ''}
        ${sopLink(t, docs)}
        ${(() => { const sop = !t.sop && t.service && docs.find((d) => d.kind === 'SOP' && d.title.slice(6).trim().toLowerCase() === t.service.trim().toLowerCase()); return sop ? html`<a class="sm" href="#/library/${sop.folder_id || '_'}/${sop.id}" style="display:inline-block;margin-top:14px;color:#87684e;font-weight:500">${ico('doc', 15)} Ver el SOP de este servicio ${ico('right', 13)}</a>` : ''; })()}
        <b class="sm" style="display:block;margin-top:14px">${t.service ? 'Entregable (checklist)' : 'Checklist'}</b>
        ${(t.checklist || []).map((c, i) => html`<label class="check"><input type="checkbox" data-act="chk" data-i="${i}" ${c.done ? raw('checked') : ''}> ${c.t}</label>`)}
        <div class="row" style="margin-top:6px"><input class="in" id="wchk" placeholder="Nuevo paso…"><button class="btn ghost" data-act="addchk">+</button></div>
        <div class="row" style="margin-top:18px;flex-wrap:wrap;gap:8px"><button class="btn" data-act="wsave">Guardar</button>${!['En revisión', 'Hecha'].includes(status(t)) ? html`<button class="btn ghost" data-act="deliver">⇪ Entregar a revisión</button>` : ''}${status(t) === 'En revisión' && (accOf(t) === me.email || isCeo) ? html`<button class="btn ghost" data-act="approve">${ico('check', 14)} Aprobar</button><button class="btn ghost" data-act="back">↩ Devolver</button>` : ''}<div class="sp"></div><button class="btn ghost" data-act="wdel">${ico('trash')}</button></div>`,
      {
        tpay: async () => { if (await payDialog({ quote_id: t.quote_id, client: (t.title.split('de ')[1] || '').split(' · ')[0], currency: t.currency, amount: t.amount_due })) { closeDrawer(); tasks = await col('tasks').list(); paint(); } },
        chk: async (cb) => { t = collect(); t.checklist[+cb.dataset.i].done = cb.checked; const r = await save(t); if (r) t = r; },
        addchk: async () => { const v = $('#wchk').value.trim(); if (!v) return; t = collect(); t.checklist = [...(t.checklist || []), { t: v, done: false }]; const r = await save(t); if (r) { t = r; draw(); } },
        wsave: async () => { if (await save(collect())) { toast('Guardado'); closeDrawer(); paint(); } },
        deliver: async () => { const c = collect(); if (!c.link) { toast('Pega el link de tu entrega, o súbela en «Subir trabajo»', true); $('#wlink').focus(); return; } if (await save({ ...c, status: 'En revisión' })) { toast('Entregado a revisión'); closeDrawer(); paint(); } },
        approve: async () => { if (await save({ ...collect(), status: 'Hecha' })) { toast('Aprobado'); closeDrawer(); paint(); } },
        back: async () => { const v = await ask('¿Qué hay que cambiar?', [{ k: 'note', l: 'Comentario para quien lo hizo', t: 'textarea', req: true }], 'Devolver'); if (!v) return; const c = collect(); if (await save({ ...c, status: 'En curso', comments: [...(c.comments || []), { who: me.name, at: new Date().toISOString(), text: '↩ ' + v.note }] })) { toast('Devuelto con comentario'); closeDrawer(); paint(); } },
        wdel: async () => { if (!(await confirmAsk(`¿Eliminar «${t.title}»?`))) return; await TK.remove(t.id); tasks = tasks.filter((x) => x.id !== t.id); closeDrawer(); paint(); },
      });
      bindSop('w');
    };
    const collect = () => ({ ...t, ...readTipoSop('w'), title: $('#wtitle').value.trim() || t.title, status: $('#wst').value, assignee: $('#was').value, accountable: $('#wacc').value, due: $('#wdue').value, project_id: $('#wproj').value, description: $('#wdesc').value, link: $('#wlink').value.trim() });
    draw();
  }

  acts(el, {
    role: (t) => { role = t.dataset.r; tab = 'zona'; if (!asP) try { localStorage.setItem('work.role', role); } catch {} history.replaceState(null, '', `#/work/zona/${role}${asP ? '/' + who : ''}`); paint(); },
    tab: (t) => { tab = t.dataset.t; history.replaceState(null, '', `#/work/${tab}/${role || '_'}${asP ? '/' + who : ''}`); swap(el, paint); },
    lane: (t) => { ceoLane = t.dataset.l; paint(); },
    adsDays: (t) => { adsDays = +t.dataset.d; adsRep = undefined; paint(); },
    compRefresh: () => { comp = null; paint(); },
    compRun: async () => {
      const list = $('#compList').value.split('\n').map((x) => x.trim()).filter(Boolean);
      try { const r = await api('ads/competitors/' + encodeURIComponent(compSel), { method: 'POST', body: { list } }); comp = { slug: compSel, ...r }; toast('Buscando anuncios… 1-3 min'); paint(); } catch (e) { toast(e.message, true); }
    },
    adsCli: (t) => { adsSel = t.dataset.s; paint(); },
    encargoEdit: async (t) => {
      const sl = t.dataset.s, a = adsAcc(sl);
      const v = await ask(`Encargo · ${sl.toUpperCase()}`, [{ k: 'objetivo', l: 'Objetivo (qué se quiere lograr)', v: a.objetivo || '', req: true }, { k: 'metrica', l: 'Métrica (una, medible: CPA, ROAS, leads, reservas…)', v: a.metrica || '', req: true, half: true }, { k: 'budget', l: 'Presupuesto del cliente al mes (Q)', t: 'number', v: a.budget || '', half: true }, { k: 'oferta', l: 'Qué se vende (lo define ② Growth)', v: a.oferta || '' }, { k: 'canales', l: 'Canales de la ficha (Meta, Google Search, TikTok…)', v: a.canales || '' }, { k: 'note', l: 'Nota', t: 'textarea', v: a.note || '' }]);
      if (!v) return;
      const prev = a.budget || null;
      if (await putAds(sl, v)) { toast(prev && +v.budget !== +prev ? 'Guardado · el presupuesto cambió: pide el OK del CEO otra vez' : 'Guardado'); paint(); }
    },
    adsOk: async (t) => { if (!isCeo) return; const sl = t.dataset.s, give = t.dataset.v === '1'; if (!give && !(await confirmAsk(`¿Retirar el OK de la pauta de ${sl.toUpperCase()}?`))) return; if (await putAds(sl, { ok: give })) { toast(give ? 'OK dado: ya se puede lanzar' : 'OK retirado'); paint(); } },
    adsTask: (t) => { const p = projects.find((x) => x.client_slug === t.dataset.s && x.status !== 'cerrado'); newTask({ dept: '⑩ Ads', project_id: p?.id || '', assignee: who }); },
    deliver: (t, e) => { e.stopPropagation(); const x = tasks.find((y) => y.id === t.dataset.id); if (x) openDelivery(x, { me: { ...me, email: who }, projects, team }, (r) => { tasks = r ? tasks.map((y) => (y.id === r.id ? r : y)) : tasks.filter((y) => y.id !== x.id); paint(); }); },
    campNew: (t) => campForm(t.dataset.s),
    campEdit: (t) => { const c = campsFor(t.dataset.s).find((x) => x.id === t.dataset.id); if (c) campForm(t.dataset.s, c); },
    skill: (t) => openClaude(`/inherent ${t.dataset.s}: ⑩ Ads · corre la capa «${t.dataset.n}» con la skill ${t.dataset.k}. Lee primero la ficha de oferta del cliente (clients/${t.dataset.s}/00-onboarding/plan-contratado.md) y el WORKFLOW de agents/10-ads-management.`),
    adsEdit: async (t) => {
      const sl = t.dataset.s, a = (accounts.find((x) => x.id === 'acc-' + sl) || {}).ads || {};
      const v = await ask(`Cuentas de pauta · ${sl.toUpperCase()}`, [{ k: 'meta', l: 'Meta · ID de la cuenta publicitaria (act_…)', v: a.meta || '' }, { k: 'google', l: 'Google Ads · ID de cliente (123-456-7890)', v: a.google || '' }, { k: 'linkedin', l: 'LinkedIn · ID de la cuenta de Campaign Manager', v: a.linkedin || '' }, { k: 'budget', l: 'Presupuesto mensual aprobado (Q)', t: 'number', v: a.budget || '' }]);
      if (!v) return;
      if (await putAds(sl, v)) { toast('Guardado'); paint(); }
    },
    ctab: (t) => { ctab = t.dataset.c; swap(el, paint); },
    kv: (t) => { kView = t.dataset.v; kanban($('#wbody', el)); },
    tipof: (t) => { tipoF = t.dataset.tp; tab === 'pipes' ? pipes($('#wbody', el)) : kanban($('#wbody', el)); },
    pipe: (t) => { pipeSel = t.dataset.k; tab = 'pipes'; paint(); },
    person: (t) => { personSel = t.dataset.k; tab = 'equipo'; paint(); },
    task: (t, e) => { if (e.target.closest('input,button')) return; const x = tasks.find((y) => y.id === t.dataset.id); if (x) openTask(x); },
    claudeP: (t) => { const d = docs.find((x) => x.id === t.dataset.id); if (d?.body) openClaude(d.body); },
    copyP: async (t) => { const d = docs.find((x) => x.id === t.dataset.id); try { await navigator.clipboard.writeText(d?.body || ''); toast('Prompt copiado'); } catch { toast('No pude copiar', true); } },
    approveQ: async (t, e) => { e.stopPropagation(); const x = tasks.find((y) => y.id === t.dataset.id); if (await save({ ...x, status: 'Hecha' })) { toast('Aprobado'); paint(); } },
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
