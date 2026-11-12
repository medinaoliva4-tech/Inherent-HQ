// La página de un proyecto (#/operations/p/<id>/<vista>), inspirada en Notion (cabecera con portada y propiedades
// que se editan con un clic), Asana (Resumen con status update fechado, Lista por secciones, Timeline) y Monday
// (estados de color). Una sola fuente: el proyecto (db/projects) y sus tareas (db/tasks). Las tareas se ven en el
// Kanban único de la app (kanban.js), filtrado a este proyecto: no hay otra lista ni otro tablero.
// Las fases son las secciones: cada tarea guarda `phase` (la clave de su fase); sin clave, cae por su fecha.
// Quien no edita Proyectos la ve completa en solo lectura (sin arrastrar ni editar celdas).
import { html, raw, mount, col, api, toast, ask, confirmAsk, fdate, today, $, $$, ico, initials, md, IC } from './core.js';
import { openTaskSheet } from './taskcard.js';
import { taskKanban } from './kanban.js';
import { roleTable, changeRole, roleLabel } from './rolemap.js';
import { RECIPE_ROLES } from './recipes.js';
import { holders } from './cycle.js';
import { levelName, LEVEL_NAMES } from './levels.js';
import { intelView } from './intel-ui.js';
import { vacio } from './visual.js';
import { popover, cerrarPopover } from './ui.js';

const PR = col('projects'), TK = col('tasks');
export const PSTATES = ['En curso', 'En riesgo', 'Pausado', 'Hecho'];
const PCLS = { 'En curso': 'now', 'En riesgo': 'risk', Pausado: 'pause', Hecho: 'done' };
const TCLS = { 'Por empezar': 'todo', 'En curso': 'now', 'En revisión': 'rev', Hecha: 'done' };
const PHST = [['todo', 'Pendiente'], ['now', 'En curso'], ['done', 'Hecha']];
const PHCLS = { todo: 'todo', now: 'now', done: 'done' };
const UPD = [['green', 'A tiempo'], ['yellow', 'En riesgo'], ['red', 'Atrasado'], ['blue', 'En pausa']];
const UPD_TO_ST = { green: 'En curso', yellow: 'En riesgo', red: 'En riesgo', blue: 'Pausado' };
const VIEWS = [['tareas', 'Tareas', 'grid'], ['entregables', 'Entregables', 'layers'], ['resumen', 'Resumen', 'doc'], ['timeline', 'Timeline', 'bars'], ['calendario', 'Calendario', 'cal'], ['archivos', 'Archivos', 'folder'], ['equipo', 'Equipo', 'users']];
const COVERS = [['t1', 'Café claro'], ['t2', 'Café oscuro'], ['olive', 'Oliva'], ['terra', 'Terracota'], ['ink', 'Espresso']];
const DAY = 864e5;
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };
const diff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / DAY);
const okUrl = (u) => /^https:\/\/\S+$/i.test(String(u || ''));
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ---------- Lo que se calcula de un proyecto (lo usan la página y «Mis proyectos») ----------
export const projTasks = (p, tasks) => tasks.filter((t) => t.project_id === p.id);
export function projPct(p, tasks) {
  const ts = projTasks(p, tasks);
  if (ts.length) return Math.round((ts.filter((t) => t.status === 'Hecha').length / ts.length) * 100);
  const ph = p.phases || []; return ph.length ? Math.round((ph.filter((x) => x.status === 'done').length / ph.length) * 100) : 0;
}
export const projStart = (p) => p.start || (p.phases || []).map((x) => x.start).filter(Boolean).sort()[0] || '';
export const projEnd = (p) => p.end || (p.phases || []).map((x) => x.end).filter(Boolean).sort().pop() || '';
export function projStatus(p, tasks) {
  if (PSTATES.includes(p.status)) return p.status;
  return projPct(p, tasks) === 100 && projTasks(p, tasks).length ? 'Hecho' : 'En curso';
}
export const pChip = (s, extra = '') => html`<span class="pp-st ${PCLS[s] || 'now'} ${extra}">${s}</span>`;
export const tChip = (s) => html`<span class="pp-st ${TCLS[s || 'Por empezar'] || 'todo'}">${s || 'Por empezar'}</span>`;
export function projOwner(p, team) {
  const role = p.owner_role || (p.line === 'growth' ? 'ceo' : 'coo');
  const email = holders(team, '', p.roles_map)(role); const who = team.find((x) => x.email === email || x.id === email);
  return { role, label: roleLabel(role), who };
}
const av = (who, s = 24) => who ? html`<span class="av" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.4)}px;background:${who.color || '#5d5d5e'}" title="${who.name}">${initials(who.name)}</span>` : html`<span class="av pp-av0" style="width:${s}px;height:${s}px" title="Sin responsable">${ico('user', Math.round(s * 0.55))}</span>`;
const mono = (p) => (p.icon ? String(p.icon) : initials(p.name || '?'));
const coverStyle = (p) => (okUrl(p.cover_img) ? raw(`style="background-image:linear-gradient(180deg,rgb(0 0 0 / .05),rgb(0 0 0 / .35)),url('${String(p.cover_img).replace(/['"()\\\s]/g, encodeURIComponent)}');background-size:cover;background-position:center"`) : '');
const driveImg = (u) => { const m = String(u).match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]{10,})/); return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600` : u; };

// ---------- Un arrastre con el puntero (mouse y touch): mover las barras del Timeline ----------
let dragged = false;
function dragger(root, sel, h) {
  root.addEventListener('pointerdown', (e) => {
    const el = e.target.closest(sel); if (!el || !root.contains(el) || e.button !== 0) return;
    if (e.target.closest('[contenteditable=true],input,select,textarea,a,button:not([data-grip])')) return;
    const st = h.start(el, e); if (!st) return;
    const x0 = e.clientX, y0 = e.clientY; let on = false;
    const mv = (ev) => { const dx = ev.clientX - x0, dy = ev.clientY - y0; if (!on && Math.hypot(dx, dy) < 5) return; if (!on) { on = true; h.begin?.(st, ev); } ev.preventDefault(); h.move(st, ev, dx, dy); };
    const up = (ev) => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (on) { dragged = true; setTimeout(() => { dragged = false; }, 0); h.end(st, ev, ev.clientX - x0, ev.clientY - y0, ev.type === 'pointercancel'); } };
    addEventListener('pointermove', mv, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
}

// ---------- Popover para editar una propiedad (como Notion: clic en el valor) ----------
// Es el ui.popover del OS (Zag + Floating UI): role=dialog, Esc y clic afuera cierran, el foco vuelve al valor.
const closePop = () => cerrarPopover();
function pop(anchor, content, map = {}) {
  return popover(anchor, content, { etiqueta: anchor.getAttribute('aria-label') || anchor.textContent.trim().slice(0, 40) || 'Editar', clase: 'pp-editar', ancho: 340 }).then((r) => {
    if (!r) return null;
    r.el.onclick = (e) => { const t = e.target.closest('[data-pop]'); if (t) map[t.dataset.pop]?.(t, e); };
    r.el.onchange = (e) => { const t = e.target.closest('[data-popchg]'); if (t) map[t.dataset.popchg]?.(t, e); };
    r.el.querySelector('input:not([type=checkbox]),select')?.focus();
    return r.el;
  });
}

// ================================================================================================
// «Mis proyectos»: la lista de proyectos con filas tipo Monday (nombre, cliente, estado, avance, fin, dueño).
// ================================================================================================
export function myProjects(box, { me, projects, tasks, team, clients = [], open }) {
  let f = lsGet('pp.f', 'todos'), cli = '', q = '';
  const mineIds = new Set(tasks.filter((t) => t.assignee === me.email).map((t) => t.project_id));
  const paint = () => {
    const list = projects.filter((p) => {
      const s = projStatus(p, tasks);
      if (f === 'mios' && !(mineIds.has(p.id) || projOwner(p, team).who?.email === me.email)) return false;
      if (f === 'riesgo' && s !== 'En riesgo') return false;
      if (f === 'activos' && s === 'Hecho') return false;
      if (f === 'hechos' && s !== 'Hecho') return false;
      if (cli && p.client_slug !== cli) return false;
      return !q || `${p.name} ${p.client || ''}`.toLowerCase().includes(q);
    }).sort((a, z) => (projStatus(a, tasks) === 'Hecho') - (projStatus(z, tasks) === 'Hecho') || String(projEnd(a) || '9').localeCompare(String(projEnd(z) || '9')));
    const slugs = [...new Set(projects.map((p) => p.client_slug).filter(Boolean))];
    mount(box, html`<div class="pp-mpbar">
        <div class="tabs" style="margin:0">${[['todos', 'Todos'], ['activos', 'Activos'], ['mios', 'Míos'], ['riesgo', 'En riesgo'], ['hechos', 'Hechos']].map(([k, l]) => html`<button class="${f === k ? 'on' : ''}" data-mp="f" data-v="${k}">${l}</button>`)}</div>
        ${slugs.length > 1 ? html`<select class="in pp-mpsel" data-mpchg="cli" aria-label="Cliente"><option value="">Todos los clientes</option>${slugs.map((s) => html`<option value="${s}" ${s === cli ? raw('selected') : ''}>${s.toUpperCase()}</option>`)}</select>` : ''}
        <input class="in pp-mpq" data-mpq placeholder="Buscar proyecto…" value="${q}" aria-label="Buscar proyecto"></div>
      <div class="sp-panel pp-mp">
        <div class="pp-mprow pp-mph"><span>Proyecto</span><span>Cliente</span><span>Estado</span><span>Avance</span><span>Fin</span><span>Dueño</span></div>
        ${list.length ? list.map((p) => { const pct = projPct(p, tasks), s = projStatus(p, tasks), o = projOwner(p, team), end = projEnd(p), late = end && end < today() && s !== 'Hecho', openN = projTasks(p, tasks).filter((t) => t.status !== 'Hecha').length;
          return html`<a class="pp-mprow" href="#/operations/p/${p.id}" data-mp="open" data-id="${p.id}">
            <span class="pp-mpname"><span class="sp-mono t${p.color === 'ink' ? 2 : 1} pp-mono-s">${mono(p)}</span><span style="min-width:0"><b>${p.name}</b><span class="mut sm">${p.kind || 'Proyecto'} · ${openN} ${openN === 1 ? 'tarea abierta' : 'tareas abiertas'}</span></span></span>
            <span class="pp-mpc" data-l="Cliente">${p.client || html`<span class="mut">Interno</span>`}</span>
            <span data-l="Estado">${pChip(s)}</span>
            <span class="pp-mpbarw" data-l="Avance"><span class="pp-meter"><i style="width:${pct}%"></i></span><b class="sm">${pct}%</b></span>
            <span data-l="Fin" class="${late ? 'pp-late' : ''}">${end ? fdate(end) : '—'}</span>
            <span class="pp-mpo" data-l="Dueño">${av(o.who, 22)}<span class="sm"><span class="mut">${o.label} →</span> ${o.who?.name?.split(' ')[0] || '—'}</span></span></a>`; })
          : html`${vacio({ icono: 'inbox', titulo: 'Ningún proyecto con ese filtro', compacto: true })}`}</div>`);
  };
  box.onclick = (e) => { const t = e.target.closest('[data-mp]'); if (!t) return;
    if (t.dataset.mp === 'f') { f = t.dataset.v; lsSet('pp.f', f); paint(); }
    if (t.dataset.mp === 'open') { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); open(t.dataset.id); } };
  box.onchange = (e) => { if (e.target.dataset.mpchg === 'cli') { cli = e.target.value; paint(); } };
  box.oninput = (e) => { if (e.target.matches('[data-mpq]')) { q = e.target.value.trim().toLowerCase(); const pos = e.target.selectionStart; paint(); const i = $('[data-mpq]', box); i.focus(); i.setSelectionRange(pos, pos); } };
  paint();
}

// ================================================================================================
// La página del proyecto
// ================================================================================================
export async function projectPage(el, { me, id, view, edit, data, back, alive }) {
  let { projects, tasks, team, docs, clients } = data;
  let p = projects.find((x) => x.id === id);
  if (!p) { try { p = await PR.get(id); projects.push(p); } catch {} }
  if (!p) return mount(el, html`${vacio({ icono: 'inbox', titulo: 'Ese proyecto no existe', linea: 'O no está entre los tuyos.', boton: { texto: '← Proyectos', act: '', data: { x: 'back' } } })}`), (el.onclick = (e) => e.target.closest('[data-x=back]') && back());
  // Abre en el Kanban de sus tareas (las vistas viejas Lista y Tablero caen ahí).
  // «Entregables» (Intel) solo existe en un proyecto de un cliente: lee la carpeta de ese cliente.
  const views = () => VIEWS.filter(([k]) => k !== 'entregables' || p.client_slug);
  view = views().some(([k]) => k === view) ? view : 'tareas';
  let zoom = lsGet('pp.zoom', 'semana'), calMonth = today().slice(0, 7), briefEdit = false, upColor = 'green';
  const folded = new Set(lsGet('pp.fold.' + id, []));
  // Las fases con clave estable: la clave se guarda con el proyecto la primera vez que se necesita.
  let keyed = (p.phases || []).every((x) => x.k);
  const phases = () => (p.phases || []).map((x, i) => ({ ...x, k: x.k || `ph${i}` }));
  const person = (k) => team.find((x) => x.id === k || x.email === k);
  const crew = team.filter((x) => x.active !== false && x.kind !== 'ia' && String(x.email || x.id).includes('@'));
  const mine = () => tasks.filter((t) => t.project_id === p.id);
  const phaseOf = (t, ph = phases()) => { if (t.phase && ph.some((x) => x.k === t.phase)) return t.phase; if (t.phase === '_') return '_';
    if (t.due) { const hit = ph.find((x) => x.start && x.end && t.due >= x.start && t.due <= x.end); if (hit) return hit.k; } return '_'; };
  const order = (a, z) => (a.pos ?? 1e9) - (z.pos ?? 1e9) || String(a.due || '9').localeCompare(String(z.due || '9')) || String(a.title).localeCompare(String(z.title));
  const sections = () => { const ph = phases(), ts = mine(), by = Object.fromEntries([...ph.map((x) => [x.k, []]), ['_', []]]); ts.forEach((t) => by[phaseOf(t, ph)].push(t));
    Object.values(by).forEach((l) => l.sort(order)); return [...ph.map((x) => ({ ...x, tasks: by[x.k] })), ...(by._.length || !ph.length ? [{ k: '_', name: 'Sin fase', tasks: by._, none: true }] : [])]; };
  const blockers = (t) => (t.depends_on || []).map((d) => tasks.find((x) => x.id === d)).filter((x) => x && x.status !== 'Hecha');
  const setHash = () => history.replaceState(null, '', `#/operations/p/${p.id}/${view}`);

  // ---------- Guardar ----------
  async function saveP(patch, quiet) {
    try { const r = await PR.save({ ...p, ...patch }); p = r; projects.splice(projects.findIndex((x) => x.id === r.id), 1, r); keyed = (p.phases || []).every((x) => x.k); if (!quiet) toast('Guardado'); return r; }
    catch (e) { toast(e.message, true); try { p = await PR.get(p.id); } catch {} paint(); return null; }
  }
  const ensureKeys = async () => { if (keyed || !(p.phases || []).length) return true; return Boolean(await saveP({ phases: phases() }, true)); };
  async function saveT(t, patch, quiet = true) {
    try { const r = await TK.save({ ...t, ...patch }); const i = tasks.findIndex((x) => x.id === r.id); i >= 0 ? tasks.splice(i, 1, r) : tasks.push(r); if (!quiet) toast('Guardado'); return r; }
    catch (e) { toast(e.message, true); return null; }
  }
  async function newTask(phaseK, title) {
    if (phaseK !== '_' && !(await ensureKeys())) return;
    const sec = sections().find((s) => s.k === phaseK), ph = phases().find((x) => x.k === phaseK);
    try { const r = await TK.create({ title, project_id: p.id, phase: phaseK, status: 'Por empezar', tipo: 'Delivery', visibility: 'all', checklist: [], comments: [], pos: ((sec?.tasks.at(-1)?.pos ?? (sec?.tasks.length || 0) * 10) + 10), ...(ph?.end ? { due: ph.end } : {}) }); tasks.push(r); return r; }
    catch (e) { toast(e.message, true); return null; }
  }
  const openTask = (t) => openTaskSheet(t, { me, projects, team, docs, tasks: mine(), edit, phases: phases() }, (r) => { if (r) { const i = tasks.findIndex((x) => x.id === r.id); i >= 0 ? tasks.splice(i, 1, r) : tasks.push(r); } else tasks = data.tasks = tasks.filter((x) => x.id !== t.id); paintHead(); paintBody(); });

  // ---------- Cabecera tipo Notion ----------
  function head() {
    const pct = projPct(p, tasks), s = projStatus(p, tasks), o = projOwner(p, team), st = projStart(p), en = projEnd(p);
    const span = st && en ? Math.max(1, diff(st, en) + 1) : 0, gone = span ? Math.min(span, Math.max(0, diff(st, today()) + 1)) : 0, tpct = span ? Math.round((gone / span) * 100) : null;
    const pace = tpct == null || s === 'Hecho' ? '' : pct >= tpct ? 'Al día' : pct >= tpct - 15 ? 'Un poco atrás' : 'Atrasado';
    const c = clients.find((x) => x.slug === p.client_slug), lvl = p.level || (c?.plan ? levelName(c.plan) : '') || p.kind || '—';
    const E = (k, v, label) => (edit ? html`<button class="pp-pv" data-prop="${k}" aria-label="Cambiar ${label}">${v}</button>` : html`<span class="pp-pv ro">${v}</span>`);
    return html`<div class="pp-crumb"><button class="pp-back" data-x="back">← Proyectos</button><span class="mut sm">/ ${p.client || 'Interno'}</span><div class="sp"></div>${edit ? '' : html`<span class="chip">${ico('eye', 13)} Solo lectura</span>`}</div>
      <div class="pp-head">
        <div class="sp-cover pp-cover ${okUrl(p.cover_img) ? 'img' : COVERS.some(([k]) => k === p.cover) ? 'c-' + p.cover : 'c-' + (p.color === 'ink' ? 'ink' : p.color === 'terra' ? 'terra' : 't1')}" ${coverStyle(p)}>${edit ? html`<button class="pp-covbtn" data-prop="cover">${ico('image', 14)} Portada</button>` : ''}</div>
        <div class="pp-id">
          ${edit ? html`<button class="pp-icon" data-prop="icon" aria-label="Cambiar icono">${mono(p)}</button>` : html`<span class="pp-icon">${mono(p)}</span>`}
          <h1 class="pp-name" ${edit ? raw('contenteditable="true" spellcheck="false" data-edit="pname" aria-label="Nombre del proyecto"') : ''}>${p.name}</h1>
          <div class="pp-props">
            <div class="pp-pk">${ico('users', 14)} Cliente</div><div>${p.client_slug ? html`<a class="pp-pv pp-link" href="#/clients/${p.client_slug}">${p.client || p.client_slug.toUpperCase()} ↗</a>` : html`<span class="pp-pv ro mut">Interno</span>`}${edit ? html`<button class="pp-mini" data-prop="client" aria-label="Cambiar cliente">${ico('edit', 13)}</button>` : ''}</div>
            <div class="pp-pk">${ico('layers', 14)} Nivel</div><div>${E('level', lvl, 'nivel')}</div>
            <div class="pp-pk">${ico('target', 14)} Estado</div><div>${E('status', pChip(s), 'estado')}</div>
            <div class="pp-pk">${ico('cal', 14)} Fechas</div><div>${E('dates', st || en ? `${st ? fdate(st) : '—'} → ${en ? fdate(en) : '—'}` : html`<span class="mut">Sin fechas</span>`, 'fechas')}</div>
            <div class="pp-pk">${ico('user', 14)} Dueño</div><div>${E('owner', html`<span class="mut">${o.label} →</span> ${av(o.who, 20)} ${o.who?.name || 'Sin asignar'}`, 'dueño')}</div>
            <div class="pp-pk">${ico('trend', 14)} Avance</div><div class="pp-prog"><span class="pp-meter big" title="${pct}% hecho${tpct != null ? ` · ${tpct}% del tiempo` : ''}"><i style="width:${pct}%"></i>${tpct != null ? html`<em style="left:${tpct}%"></em>` : ''}</span><b>${pct}%</b>${pace ? html`<span class="pp-pace ${pace === 'Al día' ? 'ok' : 'bad'}">${pace}</span>` : ''}${tpct != null ? html`<span class="mut sm">${tpct}% del tiempo</span>` : ''}</div>
          </div>
        </div></div>
      <nav class="pp-tabs" role="tablist">${views().map(([k, l, i]) => html`<button role="tab" class="${view === k ? 'on' : ''}" aria-selected="${String(view === k)}" data-x="view" data-v="${k}">${ico(i, 15)}<span>${l}</span></button>`)}</nav>`;
  }
  const paintHead = () => { const h = $('#pphead', el); if (h) mount(h, head()); };
  function paint() { mount(el, html`<div class="pp"><div id="pphead">${head()}</div><div id="ppbody" class="pp-body"></div></div>`); paintBody(); }
  function paintBody() {
    const b = $('#ppbody', el); if (!b) return; closePop();
    const sx = $('.pp-gwrap', b)?.scrollLeft;
    ({ tareas, entregables, resumen, timeline, calendario, archivos, equipo })[view](b);
    if (sx != null && $('.pp-gwrap', b)) $('.pp-gwrap', b).scrollLeft = sx;
  }

  // ---------- Entregables (Intel): el avatar y lo que los agentes dejaron escrito en la carpeta del cliente ----------
  function entregables(b) { intelView(b, { slug: p.client_slug, alive: () => el.isConnected && view === 'entregables' }); }

  // ---------- Resumen (Asana Overview): brief, objetivos, enlaces y status update ----------
  function resumen(b) {
    const ts = mine(), T = today(), done = ts.filter((t) => t.status === 'Hecha').length, late = ts.filter((t) => t.status !== 'Hecha' && t.due && t.due < T), rev = ts.filter((t) => t.status === 'En revisión');
    const next = ts.filter((t) => t.status !== 'Hecha' && t.due).sort((a, z) => a.due.localeCompare(z.due)).slice(0, 5);
    const ups = [...(p.updates || [])].sort((a, z) => String(z.at).localeCompare(String(a.at))), last = ups[0];
    const goals = p.goals || [], links = p.links || [];
    mount(b, html`<div class="pp-sum">
      <div class="pp-main">
        <section class="sp-panel pp-block"><div class="sp-panel-h row"><h3>Brief</h3><div class="sp"></div>${edit && !briefEdit ? html`<button class="btn ghost sm" data-x="briefedit">${ico('edit', 13)} Editar</button>` : ''}</div>
          ${briefEdit ? html`<div class="pp-tool" role="toolbar" aria-label="Formato">${[['b', 'B', 'Negrita'], ['i', 'I', 'Cursiva'], ['h', 'H', 'Título'], ['ul', '•', 'Lista'], ['ok', '☐', 'Pendiente'], ['a', '↗', 'Link']].map(([k, l, t]) => html`<button data-x="fmt" data-f="${k}" title="${t}" aria-label="${t}">${l}</button>`)}<span class="mut sm">Markdown simple</span></div>
              <textarea class="in pp-brief-in" id="ppbrief" rows="10" placeholder="Qué es este proyecto, para qué, qué incluye y qué queda fuera…">${p.brief || ''}</textarea>
              <div class="row" style="gap:8px;margin-top:10px"><button class="btn" data-x="briefsave">Guardar brief</button><button class="btn ghost" data-x="briefcancel">Cancelar</button></div>`
            : p.brief ? html`<div class="pp-brief" ${edit ? raw('data-x="briefedit" title="Clic para editar"') : ''}>${md(p.brief)}</div>`
            : html`<div class="pp-empty" ${edit ? raw('data-x="briefedit"') : ''}>${edit ? 'Escribe el brief: qué es, para qué, qué incluye y qué queda fuera. Clic aquí.' : 'Todavía no hay brief.'}</div>`}</section>
        <section class="sp-panel pp-block"><div class="sp-panel-h row"><h3>Objetivos</h3><span class="mut sm">${goals.filter((g) => g.done).length}/${goals.length}</span></div>
          ${goals.map((g, i) => html`<div class="pp-goal"><label class="check"><input type="checkbox" data-x="goal" data-i="${i}" ${g.done ? raw('checked') : ''} ${edit ? '' : raw('disabled')}> <span class="${g.done ? 'mut' : ''}">${g.t}</span></label>${edit ? html`<button class="pp-mini" data-x="goaldel" data-i="${i}" aria-label="Quitar objetivo">${ico('x', 12)}</button>` : ''}</div>`)}
          ${!goals.length && !edit ? html`<div class="pp-empty">Sin objetivos escritos.</div>` : ''}
          ${edit ? html`<div class="row pp-add"><input class="in" id="ppgoal" placeholder="+ Objetivo (ej. 40 leads al mes)"><button class="btn ghost sm" data-x="goaladd">Agregar</button></div>` : ''}</section>
        <section class="sp-panel pp-block"><div class="sp-panel-h row"><h3>Enlaces clave</h3></div>
          ${links.map((l, i) => html`<div class="pp-lk"><a class="wkrow" href="${okUrl(l.url) ? l.url : '#'}" target="_blank" rel="noopener noreferrer"><span class="fi">${/drive\.google|docs\.google/.test(l.url) ? IC.drive : ico('link', 14)}</span><span class="grow">${l.label || l.url}</span><span class="mut sm">${String(l.url).replace(/^https:\/\/(www\.)?/, '').slice(0, 32)}</span></a>${edit ? html`<button class="pp-mini" data-x="linkdel" data-i="${i}" aria-label="Quitar enlace">${ico('x', 12)}</button>` : ''}</div>`)}
          ${!links.length && !edit ? html`<div class="pp-empty">Sin enlaces.</div>` : ''}
          ${edit ? html`<div class="row pp-add"><input class="in" id="pplkn" placeholder="Nombre (ej. Carpeta en Drive)" style="flex:1"><input class="in" id="pplku" placeholder="https://…" style="flex:1.4"><button class="btn ghost sm" data-x="linkadd">Agregar</button></div>` : ''}</section>
      </div>
      <aside class="pp-side">
        <section class="sp-panel pp-block pp-upd"><div class="sp-panel-h row"><h3>Status update</h3>${last ? html`<span class="mut sm">${fdate(String(last.at).slice(0, 10))}</span>` : ''}</div>
          ${last ? html`<div class="pp-ulast ${last.color}"><span class="pp-udot ${last.color}"></span><div><b>${(UPD.find(([k]) => k === last.color) || UPD[0])[1]}</b><p>${last.note}</p><span class="mut sm">${last.who} · ${fdate(String(last.at).slice(0, 10))}</span></div></div>` : html`<div class="pp-empty">Sin updates todavía. ${edit ? 'Publica el primero: cómo va, qué cambió y qué lo traba.' : ''}</div>`}
          ${edit ? html`<div class="pp-ucomp"><div class="pp-ucolors" role="radiogroup" aria-label="Cómo va">${UPD.map(([k, l]) => html`<button role="radio" aria-checked="${String(upColor === k)}" class="${upColor === k ? 'on' : ''}" data-x="ucolor" data-c="${k}"><span class="pp-udot ${k}"></span>${l}</button>`)}</div>
            <textarea class="in" id="ppnote" rows="3" placeholder="Qué pasó desde el último update, qué sigue y qué lo traba…"></textarea>
            <button class="btn" data-x="pubupd" style="margin-top:8px">Publicar update</button></div>` : ''}
          ${ups.length > 1 ? html`<details class="pp-uhist"><summary>Historial · ${ups.length - 1}</summary>${ups.slice(1).map((u) => html`<div class="pp-uitem"><span class="pp-udot ${u.color}"></span><div><span class="mut sm">${fdate(String(u.at).slice(0, 10))} · ${u.who}</span><p>${u.note}</p></div></div>`)}</details>` : ''}</section>
        <section class="sp-panel pp-block"><div class="sp-panel-h row"><h3>Números</h3></div>
          <div class="pp-nums"><div><b>${ts.length}</b><span>Tareas</span></div><div><b>${done}</b><span>Hechas</span></div><div><b class="${late.length ? 'pp-late' : ''}">${late.length}</b><span>Atrasadas</span></div><div><b>${rev.length}</b><span>En revisión</span></div></div></section>
        <section class="sp-panel pp-block"><div class="sp-panel-h row"><h3>Fases</h3>${edit ? html`<button class="btn ghost sm" data-x="view" data-v="timeline" style="margin-left:auto">Timeline</button>` : ''}</div>
          ${phases().length ? phases().map((x) => { const st2 = sections().find((s) => s.k === x.k)?.tasks || [], d2 = st2.filter((t) => t.status === 'Hecha').length;
            return html`<div class="pp-phr"><span class="pp-phdot ${PHCLS[x.status] || 'todo'}"></span><div class="grow"><b>${x.name}</b><span class="mut sm">${x.start ? fdate(x.start) : '—'} → ${x.end ? fdate(x.end) : '—'}${st2.length ? ` · ${d2}/${st2.length}` : ''}</span></div></div>`; }) : html`<div class="pp-empty">Sin fases.</div>`}</section>
        <section class="sp-panel pp-block"><div class="sp-panel-h row"><h3>Lo que viene</h3></div>
          ${next.length ? next.map((t) => html`<button class="pp-next" data-x="task" data-id="${t.id}">${av(person(t.assignee), 22)}<span class="grow">${t.title}</span><span class="sm ${t.due < T ? 'pp-late' : 'mut'}">${fdate(t.due)}</span></button>`) : html`<div class="pp-empty">Nada con fecha.</div>`}</section>
      </aside></div>`);
  }

  // ---------- Tareas: el mismo Kanban de Proyectos, solo con las de este proyecto ----------
  function tareas(b) {
    taskKanban(b, { tasks: () => tasks, projects, team, me, scope: (t) => t.project_id === p.id, show: { person: true }, key: 'pp', edit,
      save: (t, patch) => saveT(t, patch), open: openTask, changed: paintHead,
      add: edit ? async (status) => {
        const v = await ask('Nueva tarea', [{ k: 'title', l: '¿Qué hay que hacer?', req: true }], 'Crear'); if (!v) return;
        const r = await newTask('_', v.title.slice(0, 200)); if (r && status !== 'Por empezar') await saveT(r, { status });
        if (r) toast('Tarea creada'); paintHead(); paintBody(); } : null });
  }

  // ---------- Timeline (Gantt): fases y tareas como barras, dependencias, hoy, zoom ----------
  function timeline(b) {
    const secs = sections(), dw = zoom === 'mes' ? 10 : 30, RH = 36, T = today();
    const span = (t) => (t.due ? [t.start && t.start <= t.due ? t.start : t.due, t.due] : null);
    const all = [T, ...phases().flatMap((x) => [x.start, x.end]), ...mine().flatMap((t) => span(t) || [])].filter(Boolean).sort();
    let s0 = addDays(all[0], -3); s0 = addDays(s0, -((new Date(s0 + 'T12:00').getDay() + 6) % 7));
    const days = Math.min(540, Math.max(zoom === 'mes' ? 90 : 35, diff(s0, all.at(-1)) + 14)), W = days * dw, X = (d) => diff(s0, d) * dw;
    const rows = []; secs.forEach((s) => { if (!s.none) rows.push({ ph: s }); if (!folded.has(s.k)) s.tasks.forEach((t) => rows.push({ t })); });
    const yOf = {}; rows.forEach((r, i) => { if (r.t) yOf[r.t.id] = i * RH + RH / 2; });
    // El mes se nombra al empezar y en cada semana (así siempre se ve de qué mes es lo que está en pantalla).
    const months = []; for (let i = 0; i < days; i++) { const d = addDays(s0, i), dt = new Date(d + 'T12:00'), wd = (dt.getDay() + 6) % 7;
      if (i === 0 || d.endsWith('-01')) months.push([i, dt.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }), 'm']); else if (wd === 0 && +d.slice(8) > 3 && +d.slice(8) < 26) months.push([i, dt.toLocaleDateString('es-GT', { month: 'short' }), 'w']); }
    const ticks = []; for (let i = 0; i < days; i++) { const d = addDays(s0, i), wd = (new Date(d + 'T12:00').getDay() + 6) % 7; if (zoom === 'mes' ? wd === 0 : true) ticks.push([i, d, wd]); }
    let arrows = ''; for (const r of rows) { if (!r.t) continue; const sp2 = span(r.t); if (!sp2) continue;
      for (const did of r.t.depends_on || []) { const pre = tasks.find((x) => x.id === did); const ps = pre && span(pre); if (!ps || yOf[did] == null) continue;
        const x1 = X(ps[1]) + dw, y1 = yOf[did], x2 = X(sp2[0]), y2 = yOf[r.t.id], mx = Math.max(x1 + 8, Math.min(x2 - 8, x1 + 14));
        arrows += `<path d="M${x1} ${y1} H${mx} V${y2} H${x2 - 2}" class="${pre.status === 'Hecha' ? 'ok' : ''}" marker-end="url(#pparr)"/>`; } }
    const tl = X(T) + dw / 2;
    mount(b, html`<div class="sp-panel pp-tl">
      <div class="pp-tlbar"><div class="tabs" style="margin:0">${[['semana', 'Semana'], ['mes', 'Mes']].map(([k, l]) => html`<button class="${zoom === k ? 'on' : ''}" data-x="zoom" data-z="${k}">${l}</button>`)}</div><button class="btn ghost sm" data-x="tltoday">Hoy</button><span class="mut sm pp-tlhint">${edit ? 'Arrastra una barra para mover sus fechas; el borde derecho cambia el fin.' : 'Solo lectura.'}</span>${edit ? html`<div class="sp"></div><button class="btn ghost sm" data-x="phadd">${ico('plus', 13)} Fase</button>` : ''}</div>
      <div class="pp-gwrap" style="--dw:${dw}px;--rh:${RH}px">
        <div class="pp-gantt" style="width:calc(var(--lw) + ${W}px)">
          <div class="pp-ghead"><div class="pp-glab pp-gcorner">Fase / tarea</div><div class="pp-gscale" style="width:${W}px">
            <div class="pp-gmonths">${months.map(([i, l, k]) => html`<span class="${k}" style="left:${i * dw}px">${l}</span>`)}</div>
            <div class="pp-gdays">${ticks.map(([i, d, wd]) => html`<span class="${wd > 4 && zoom !== 'mes' ? 'we' : ''} ${d === T ? 'td' : ''}" style="left:${i * dw}px;width:${zoom === 'mes' ? dw * 7 : dw}px">${zoom === 'mes' ? fdate(d) : +d.slice(8)}</span>`)}</div></div></div>
          <div class="pp-gbody">
            <div class="pp-glabs">${rows.map((r) => (r.ph ? html`<div class="pp-glab ph"><button class="pp-caret" data-x="fold" data-k="${r.ph.k}" aria-label="Plegar">${ico(folded.has(r.ph.k) ? 'right' : 'down', 13)}</button>${edit ? html`<button class="pp-phlab" data-x="phmenu" data-k="${r.ph.k}">${r.ph.name}</button>` : html`<b>${r.ph.name}</b>`}</div>`
              : html`<div class="pp-glab"><button class="pp-tlab" data-x="task" data-id="${r.t.id}">${r.t.title}</button>${r.t.due ? '' : html`<span class="mut sm">sin fecha</span>`}</div>`))}</div>
            <div class="pp-gcanvas" style="width:${W}px;height:${rows.length * RH}px">
              ${ticks.filter(([, , wd]) => zoom === 'mes' || wd === 0).map(([i]) => html`<i class="pp-gline" style="left:${i * dw}px"></i>`)}
              ${zoom !== 'mes' ? ticks.filter(([, , wd]) => wd > 4).map(([i]) => html`<i class="pp-gwe" style="left:${i * dw}px;width:${dw}px"></i>`) : ''}
              <svg class="pp-garrows" width="${W}" height="${rows.length * RH}" aria-hidden="true"><defs><marker id="pparr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z"/></marker></defs>${raw(arrows)}</svg>
              ${rows.map((r, i) => { if (r.ph) { const x = r.ph; if (!x.start || !x.end) return ''; return html`<div class="pp-bar ph ${PHCLS[x.status] || 'todo'} ${edit ? 'ed' : ''}" data-bar="ph" data-k="${x.k}" ${edit ? raw(`data-x="phmenu"`) : ''} style="top:${i * RH + 7}px;left:${X(x.start)}px;width:${(diff(x.start, x.end) + 1) * dw}px" title="${x.name} · ${fdate(x.start)} – ${fdate(x.end)}"><span>${x.name}</span>${edit ? html`<i class="pp-rz" data-rz></i>` : ''}</div>`; }
                const sp2 = span(r.t); if (!sp2) return ''; const st = r.t.status || 'Por empezar', bw = Math.max(1, diff(sp2[0], sp2[1]) + 1) * dw;
                return html`<div class="pp-bar t ${TCLS[st]} ${edit ? 'ed' : ''} ${blockers(r.t).length ? 'wait' : ''} ${bw < 96 ? 'out' : ''}" data-bar="t" data-id="${r.t.id}" data-x="task" style="top:${i * RH + 9}px;left:${X(sp2[0])}px;width:${Math.max(1, diff(sp2[0], sp2[1]) + 1) * dw}px" title="${r.t.title} · ${sp2[0] === sp2[1] ? fdate(sp2[1]) : fdate(sp2[0]) + ' – ' + fdate(sp2[1])} · ${st}"><span>${r.t.title}</span>${edit ? html`<i class="pp-rz" data-rz></i>` : ''}</div>`; })}
              ${tl >= 0 && tl <= W ? html`<i class="pp-today" style="left:${tl}px"><b>Hoy</b></i>` : ''}
            </div></div></div></div></div>`);
    const wrap = $('.pp-gwrap', b); if (wrap && !wrap.dataset.init) { wrap.dataset.init = '1'; wrap.scrollLeft = Math.max(0, tl - wrap.clientWidth / 3); }
  }

  // ---------- Calendario del proyecto ----------
  function calendario(b) {
    const [y, m] = calMonth.split('-').map(Number), first = new Date(y, m - 1, 1), nd = new Date(y, m, 0).getDate(), lead = (first.getDay() + 6) % 7;
    const by = {}; mine().filter((t) => t.due && t.due.slice(0, 7) === calMonth).forEach((t) => (by[+t.due.slice(8)] ||= []).push(t));
    phases().forEach((x) => { if (x.start?.slice(0, 7) === calMonth) (by[+x.start.slice(8)] ||= []).push({ ph: x }); });
    const cells = []; for (let i = 0; i < 42; i++) { const d = i - lead + 1; if (i >= 35 && d > nd) break; cells.push(d); }
    mount(b, html`<div class="sp-panel pp-cal"><div class="pp-tlbar"><h3 style="text-transform:capitalize">${first.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })}</h3><div class="sp"></div><button class="btn ghost sm" data-x="cmon" data-d="0">Hoy</button><button class="btn ghost sm" data-x="cmon" data-d="-1" aria-label="Mes anterior">‹</button><button class="btn ghost sm" data-x="cmon" data-d="1" aria-label="Mes siguiente">›</button></div>
      <div class="cal pp-calg">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => html`<div class="dh">${d}</div>`)}
        ${cells.map((d) => { const out = d < 1 || d > nd, ds = `${calMonth}-${String(d).padStart(2, '0')}`;
          return html`<div class="d ${out ? 'o' : ''} ${!out && ds === today() ? 'today' : ''}"><span class="n">${out ? '' : d}</span>${out ? '' : (by[d] || []).slice(0, 4).map((it) => (it.ph ? html`<div class="ev e2" title="Empieza la fase ${it.ph.name}">▸ ${it.ph.name}</div>` : html`<div class="ev pp-ev ${TCLS[it.status || 'Por empezar']}" data-x="task" data-id="${it.id}" title="${it.title}">${it.title}</div>`))}${!out && (by[d] || []).length > 4 ? html`<span class="mut sm">+${by[d].length - 4}</span>` : ''}</div>`; })}</div></div>`);
  }

  // ---------- Archivos: las entregas de las tareas (links y archivos en Drive) ----------
  function archivos(b) {
    const list = mine().flatMap((t) => [...(t.files || []).map((f) => ({ t, name: f.name, link: f.link, at: String(f.at || '').slice(0, 10) })), ...(okUrl(t.link) && !(t.files || []).some((f) => f.link === t.link) ? [{ t, name: 'Entrega', link: t.link, at: (t.done_at || t._meta?.updated_at || '').slice(0, 10) }] : [])])
      .sort((a, z) => String(z.at).localeCompare(String(a.at)));
    mount(b, html`<div class="sp-panel pp-files"><div class="sp-panel-h row"><h3>Entregas</h3><span class="mut sm">${list.length} ${list.length === 1 ? 'archivo' : 'archivos'} · lo que se entrega en cada tarea</span></div>
      ${list.length ? list.map((f) => html`<div class="pp-file"><a class="wkrow" href="${okUrl(f.link) ? f.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="fi">${/drive\.google|docs\.google/.test(f.link) ? IC.drive : ico('link', 14)}</span><span class="grow"><b style="font-weight:500">${f.name}</b><span class="mut sm"> · ${f.t.title}</span></span>${tChip(f.t.status)}<span class="mut sm">${f.at ? fdate(f.at) : ''}</span></a></div>`)
        : html`<div class="pp-empty">Todavía no hay entregas. Cuando alguien entrega una tarea (link o archivo a Drive), aparece aquí.</div>`}
      ${(p.links || []).length ? html`<div class="lbl" style="margin:16px 0 4px;color:var(--mut)">Enlaces clave</div>${p.links.map((l) => html`<a class="wkrow" href="${okUrl(l.url) ? l.url : '#'}" target="_blank" rel="noopener noreferrer"><span class="fi">${ico('link', 14)}</span><span class="grow">${l.label || l.url}</span></a>`)}` : ''}</div>`);
  }

  // ---------- Equipo: quién cubre cada rol (rolemap.js) y la carga de cada quien ----------
  function equipo(b) {
    const ts = mine(), people = [...new Set(ts.map((t) => t.assignee).filter(Boolean))].map((e) => ({ who: person(e), e, open: ts.filter((t) => t.assignee === e && t.status !== 'Hecha').length, done: ts.filter((t) => t.assignee === e && t.status === 'Hecha').length })).sort((a, z) => z.open - a.open);
    const rt = roleTable(p, { tasks, team, edit });
    mount(b, html`<div class="pp-team">
      <section class="sp-panel pp-block"><div class="sp-panel-h"><h3>Quién cubre cada rol</h3><span class="mut sm">${edit ? 'Cambia a alguien y sus tareas abiertas de ese rol pasan a la persona nueva (queda en el historial de cada tarea).' : 'Las personas que cubren cada rol de este proyecto.'}</span></div>${rt || html`<div class="pp-empty">Este proyecto no tiene tareas con rol.</div>`}</section>
      <section class="sp-panel pp-block"><div class="sp-panel-h"><h3>Carga</h3></div>
        ${people.length ? people.map((x) => html`<div class="pp-load">${av(x.who, 30)}<div class="grow"><b>${x.who?.name || x.e}</b><span class="mut sm">${x.who?.title || ''}</span></div><span class="pp-st now">${x.open} abiertas</span><span class="pp-st done">${x.done} hechas</span></div>`) : html`<div class="pp-empty">Nadie tiene tareas en este proyecto.</div>`}</section></div>`);
  }

  // ---------- Editores (popovers) ----------
  const T_ = (id) => tasks.find((x) => x.id === id);
  async function patchPhase(k, patch) {
    const ph = phases().map((x) => (x.k === k ? { ...x, ...patch } : x));
    if (await saveP({ phases: ph }, true)) { paintHead(); paintBody(); }
  }
  function phaseMenu(btn) {
    const k = btn.dataset.k, x = phases().find((y) => y.k === k); if (!x) return;
    pop(btn, html`<div class="pp-pform"><label class="f">Nombre</label><input class="in" id="pphn" value="${x.name}"><div class="two" style="margin-top:8px"><div><label class="f">Inicio</label><input class="in" type="date" id="pphs" value="${x.start || ''}"></div><div><label class="f">Fin</label><input class="in" type="date" id="pphe" value="${x.end || ''}"></div></div>
      <label class="f" style="margin-top:8px">Estado</label><select class="in" id="pphst">${PHST.map(([v, l]) => html`<option value="${v}" ${v === (x.status || 'todo') ? raw('selected') : ''}>${l}</option>`)}</select>
      <div class="row" style="gap:6px;margin-top:10px"><button class="btn sm" data-pop="ok">Guardar</button><div class="sp"></div><button class="btn ghost sm" data-pop="up" title="Subir">↑</button><button class="btn ghost sm" data-pop="dn" title="Bajar">↓</button><button class="btn ghost sm" data-pop="del" aria-label="Eliminar fase">${ico('trash', 13)}</button></div></div>`, {
      ok: () => { const s = $('#pphs').value, e = $('#pphe').value; if (s && e && e < s) return toast('El fin no puede ser antes del inicio', true); closePop(); patchPhase(k, { name: $('#pphn').value.trim() || x.name, start: s, end: e, status: $('#pphst').value }); },
      up: () => movePhase(k, -1), dn: () => movePhase(k, 1),
      del: async () => { closePop(); const n = sections().find((s) => s.k === k)?.tasks.length || 0; if (!(await confirmAsk(`¿Eliminar la fase «${x.name}»?${n ? ` Sus ${n} tareas quedan sin fase (no se borran).` : ''}`))) return;
        if (!(await ensureKeys())) return; for (const t of mine().filter((t) => t.phase === k)) await saveT(t, { phase: '_' }); if (await saveP({ phases: phases().filter((y) => y.k !== k) }, true)) { toast('Fase eliminada'); paintHead(); paintBody(); } },
    });
  }
  async function movePhase(k, d) { closePop(); const ph = phases(), i = ph.findIndex((x) => x.k === k), j = i + d; if (j < 0 || j >= ph.length) return; [ph[i], ph[j]] = [ph[j], ph[i]];
    if (!(await ensureKeys())) return; if (await saveP({ phases: ph }, true)) paintBody(); }
  async function addPhase() {
    const ph = phases(), last = ph.at(-1), s = last?.end ? addDays(last.end, 1) : today();
    if (await saveP({ phases: [...ph, { k: 'ph' + Date.now().toString(36), name: 'Nueva fase', start: s, end: addDays(s, 6), status: 'todo' }] }, true)) { toast('Fase agregada'); paintHead(); paintBody(); }
  }
  function propEdit(btn) {
    const k = btn.dataset.prop, done = async (patch) => { closePop(); if (await saveP(patch)) paint(); };
    if (k === 'status') pop(btn, html`<div class="pp-plist">${PSTATES.map((s) => html`<button data-pop="v" data-v="${s}">${pChip(s)}</button>`)}<button data-pop="v" data-v="" class="mut sm">Automático (por avance)</button></div>`, { v: (b2) => done({ status: b2.dataset.v }) });
    if (k === 'level') pop(btn, html`<div class="pp-plist">${[...LEVEL_NAMES, 'Ciclo mensual', 'Proyecto', 'Growth'].map((l) => html`<button data-pop="v" data-v="${l}">${l}</button>`)}<button data-pop="v" data-v="" class="mut sm">Del plan del cliente</button></div>`, { v: (b2) => done({ level: b2.dataset.v }) });
    if (k === 'dates') pop(btn, html`<div class="pp-pform"><div class="two"><div><label class="f">Inicio</label><input class="in" type="date" id="ppds" value="${projStart(p)}"></div><div><label class="f">Fin</label><input class="in" type="date" id="ppde" value="${projEnd(p)}"></div></div><div class="mut sm" style="margin-top:6px">Vacío = lo que digan las fases.</div><button class="btn sm" data-pop="ok" style="margin-top:8px">Guardar</button></div>`,
      { ok: () => { const s = $('#ppds').value, e = $('#ppde').value; if (s && e && e < s) return toast('El fin no puede ser antes del inicio', true); done({ start: s, end: e }); } });
    if (k === 'owner') pop(btn, html`<div class="pp-plist">${RECIPE_ROLES.map(([r, l]) => { const e = holders(team, '', p.roles_map)(r), w = person(e); return html`<button data-pop="v" data-v="${r}" class="${projOwner(p, team).role === r ? 'on' : ''}"><b style="font-weight:500;min-width:84px">${l}</b><span class="mut sm">→ ${w?.name || 'sin asignar'}</span></button>`; })}</div>`, { v: (b2) => done({ owner_role: b2.dataset.v }) });
    if (k === 'client') pop(btn, html`<div class="pp-plist">${clients.filter((c) => c.hasPlan !== false).map((c) => html`<button data-pop="v" data-v="${c.slug}" class="${c.slug === p.client_slug ? 'on' : ''}">${c.slug.toUpperCase()}<span class="mut sm">${c.plan ? levelName(c.plan) : ''}</span></button>`)}<button data-pop="v" data-v="" class="mut sm">Sin cliente / interno</button></div>`, { v: (b2) => done({ client_slug: b2.dataset.v, client: b2.dataset.v ? b2.dataset.v.toUpperCase() : '' }) });
    if (k === 'icon') pop(btn, html`<div class="pp-pform"><label class="f">Icono (una o dos letras, o un emoji)</label><div class="row" style="gap:6px"><input class="in" id="ppic" maxlength="4" value="${p.icon || ''}" placeholder="${initials(p.name)}"><button class="btn sm" data-pop="ok">OK</button></div><button class="btn ghost sm" data-pop="clr" style="margin-top:6px">Usar las iniciales</button></div>`,
      { ok: () => done({ icon: [...$('#ppic').value.trim()].slice(0, 2).join('') }), clr: () => done({ icon: '' }) });
    if (k === 'cover') pop(btn, html`<div class="pp-pform"><label class="f">Portada</label><div class="pp-covers">${COVERS.map(([c, l]) => html`<button class="pp-cv c-${c}" data-pop="c" data-v="${c}" title="${l}" aria-label="${l}"></button>`)}</div>
      <label class="f" style="margin-top:8px">o una imagen (Drive o Pinterest)</label><div class="row" style="gap:6px"><input class="in" id="ppcov" placeholder="https://drive.google.com/…" value="${p.cover_img || ''}"><button class="btn sm" data-pop="img">OK</button></div></div>`,
      { c: (b2) => done({ cover: b2.dataset.v, cover_img: '' }), img: () => { const v = $('#ppcov').value.trim(); if (v && !okUrl(v)) return toast('El link debe empezar con https://', true); done({ cover_img: v ? driveImg(v) : '' }); } });
  }

  // ---------- Eventos ----------
  el.addEventListener('click', async (e) => {
    if (dragged) return;
    const pr = e.target.closest('[data-prop]'); if (pr && edit) return propEdit(pr);
    const a = e.target.closest('[data-x]'); if (!a) return;
    const x = a.dataset.x;
    if (x === 'back') return back();
    if (x === 'view') { view = a.dataset.v; setHash(); $$('.pp-tabs button', el).forEach((b2) => { const on = b2.dataset.v === view; b2.classList.toggle('on', on); b2.setAttribute('aria-selected', on); }); return paintBody(); }
    if (x === 'task') { const t = T_(a.dataset.id); return t && openTask(t); }
    if (x === 'fold') { const k = a.dataset.k; folded.has(k) ? folded.delete(k) : folded.add(k); lsSet('pp.fold.' + id, [...folded]); return paintBody(); }
    if (x === 'zoom') { zoom = a.dataset.z; lsSet('pp.zoom', zoom); $('.pp-gwrap', el)?.removeAttribute('data-init'); const b2 = $('#ppbody', el); return timeline(b2); }
    if (x === 'tltoday') { const w = $('.pp-gwrap', el), t2 = $('.pp-today', el); if (w && t2) w.scrollTo({ left: Math.max(0, t2.offsetLeft - w.clientWidth / 3), behavior: 'smooth' }); return; }
    if (x === 'cmon') { const d = +a.dataset.d; if (!d) calMonth = today().slice(0, 7); else { const dt = new Date(calMonth + '-15'); dt.setMonth(dt.getMonth() + d); calMonth = dt.toISOString().slice(0, 7); } return paintBody(); }
    if (!edit) return;
    if (x === 'phmenu') return phaseMenu(a);
    if (x === 'phadd') return addPhase();
    if (x === 'briefedit') { briefEdit = true; paintBody(); return $('#ppbrief', el)?.focus(); }
    if (x === 'briefcancel') { briefEdit = false; return paintBody(); }
    if (x === 'briefsave') { const v = $('#ppbrief', el).value; if (await saveP({ brief: v.slice(0, 20000) })) { briefEdit = false; paintBody(); } return; }
    if (x === 'fmt') return fmt(a.dataset.f);
    if (x === 'goaladd') { const v = $('#ppgoal', el).value.trim(); if (!v) return $('#ppgoal', el).focus(); if (await saveP({ goals: [...(p.goals || []), { t: v.slice(0, 200), done: false }] }, true)) paintBody(); return; }
    if (x === 'goal') { const g = JSON.parse(JSON.stringify(p.goals || [])); g[+a.dataset.i].done = a.checked; if (await saveP({ goals: g }, true)) paintBody(); return; }
    if (x === 'goaldel') { if (await saveP({ goals: (p.goals || []).filter((_, i) => i !== +a.dataset.i) }, true)) paintBody(); return; }
    if (x === 'linkadd') { const n = $('#pplkn', el).value.trim(), u = $('#pplku', el).value.trim(); if (!okUrl(u)) return toast('El link debe empezar con https://', true); if (await saveP({ links: [...(p.links || []), { label: n.slice(0, 80) || u.replace(/^https:\/\//, '').slice(0, 40), url: u }] }, true)) paintBody(); return; }
    if (x === 'linkdel') { if (await saveP({ links: (p.links || []).filter((_, i) => i !== +a.dataset.i) }, true)) paintBody(); return; }
    if (x === 'ucolor') { upColor = a.dataset.c; $$('.pp-ucolors button', el).forEach((b2) => { const on = b2.dataset.c === upColor; b2.classList.toggle('on', on); b2.setAttribute('aria-checked', on); }); return; }
    if (x === 'pubupd') { const note = $('#ppnote', el).value.trim(); if (!note) { toast('Escribe cómo va el proyecto', true); return $('#ppnote', el).focus(); }
      const u = { id: 'u' + Date.now().toString(36), at: new Date().toISOString(), color: upColor, note: note.slice(0, 2000), who: me.name };
      if (await saveP({ updates: [u, ...(p.updates || [])].slice(0, 100), status: projStatus(p, tasks) === 'Hecho' && upColor === 'green' ? 'Hecho' : UPD_TO_ST[upColor] }, true)) { toast('Update publicado'); paintHead(); paintBody(); } return; }
  });
  // Markdown simple en el brief.
  function fmt(f) {
    const ta = $('#ppbrief', el); if (!ta) return; const s = ta.selectionStart, en = ta.selectionEnd, sel = ta.value.slice(s, en) || 'texto';
    const ls = ta.value.lastIndexOf('\n', s - 1) + 1;
    const wrap = { b: [`**${sel}**`], i: [`*${sel}*`], a: [`[${sel}](https://)`] }[f];
    if (wrap) ta.setRangeText(wrap[0], s, en, 'select'); else ta.setRangeText({ h: '## ', ul: '- ', ok: '- [ ] ' }[f], ls, ls, 'end');
    ta.focus();
  }
  // El nombre del proyecto se edita en línea: Enter guarda, Esc cancela.
  el.addEventListener('keydown', (e) => {
    const ed = e.target.closest('[data-edit]'); if (ed) { if (e.key === 'Enter') { e.preventDefault(); ed.blur(); } if (e.key === 'Escape') { ed.dataset.cancel = '1'; ed.blur(); } }
  });
  el.addEventListener('focusout', async (e) => {
    const ed = e.target.closest?.('[data-edit]'); if (!ed) return;
    const v = ed.textContent.replace(/\s+/g, ' ').trim(), kind = ed.dataset.edit, cancel = ed.dataset.cancel; delete ed.dataset.cancel;
    if (kind === 'pname') { if (cancel || !v || v === p.name) { ed.textContent = p.name; return; } if (await saveP({ name: v.slice(0, 120) })) paintHead(); return; }
  });
  el.addEventListener('change', async (e) => { const s = e.target.closest('[data-rolesel]'); if (!s || !edit) return; if (await changeRole(s.dataset.pid, s.dataset.rolesel, s.value)) { [p, tasks] = await Promise.all([PR.get(p.id), TK.list()]); data.tasks = tasks; projects.splice(projects.findIndex((x) => x.id === p.id), 1, p); } paintHead(); paintBody(); });

  // ---------- Arrastrar ----------
  if (edit) {
    // Timeline: la barra mueve sus fechas; el borde derecho cambia el fin.
    dragger(el, '.pp-bar.ed', {
      start: (bar, e) => ({ bar, rz: Boolean(e.target.closest('[data-rz]')), l0: bar.offsetLeft, w0: bar.offsetWidth, dw: zoom === 'mes' ? 10 : 30 }),
      begin: (st) => st.bar.classList.add('pp-dragging'),
      move: (st, ev, dx) => { const d = Math.round(dx / st.dw); st.d = d; if (st.rz) st.bar.style.width = Math.max(st.dw, st.w0 + d * st.dw) + 'px'; else st.bar.style.left = st.l0 + d * st.dw + 'px'; },
      end: async (st, ev, dx, dy, cancel) => { st.bar.classList.remove('pp-dragging'); const d = cancel ? 0 : st.d || 0; if (!d) return paintBody();
        if (st.bar.dataset.bar === 'ph') { const ph = phases().find((y) => y.k === st.bar.dataset.k); if (!ph) return; const end = addDays(ph.end, d), start = st.rz ? ph.start : addDays(ph.start, d);
          if (end < start) return paintBody(); return patchPhase(ph.k, { start, end }); }
        const t = T_(st.bar.dataset.id); if (!t) return; const due = addDays(t.due, d), s0 = t.start && t.start <= t.due ? t.start : null;
        const patch = st.rz ? { due: s0 && due < s0 ? s0 : due, ...(s0 ? {} : { start: due < t.due ? due : t.due }) } : { due, ...(s0 ? { start: addDays(s0, d) } : {}) };
        if (st.rz && !s0 && patch.start === patch.due) delete patch.start;
        const r = await saveT(t, patch); if (r) toast(`${t.title}: ${r.start && r.start !== r.due ? fdate(r.start) + ' – ' : ''}${fdate(r.due)}`); paintHead(); paintBody(); },
    });
  }
  setHash(); paint();
  // Al salir de la pantalla, se cierra cualquier popover abierto.
  const iv = setInterval(() => { if (!alive() || !el.isConnected) { closePop(); clearInterval(iv); } }, 1000);
}
