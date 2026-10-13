// Crear cosas con preguntas, no con formularios. Lo usan Operations, Workspace y Clients.
import { wizard, col, api, toast, roleName, today, fdate, html, raw, drawer, closeDrawer, $, $$, Q, ico } from './core.js';
import { DEPTS, deptsOfPlan, phasesFor, tasksFor, customTasks, createLinked, meetingsFor, hoursAt, svcHours, svcCost, svcPrice, daysAt, includesAt } from './cycle.js';

const cleanPlan = (s) => String(s || '').replace(/^[⬜🔷🟨]️?\s*/u, '');

// ---------- Proyecto ----------
export async function newProject({ team, me, projects = [], tasks = [], pre = {} }) {
  let clients = [], services = [], rates = null;
  [clients, services, rates] = await Promise.all([api('repo/clients').then((r) => r.clients.filter((c) => c.hasPlan)).catch(() => []), col('services').list().catch(() => []), me.role === 'ceo' ? col('rates').get('default').catch(() => null) : null]);
  const mes = today().slice(0, 7);
  const a = await wizard('Nuevo proyecto', [
    { k: 'kind', q: '¿Qué tipo de proyecto es?', type: 'cards', req: true, v: pre.kind, show: () => !pre.kind, opts: [
      { v: 'Ciclo mensual', i: ico('repeat'), l: 'Ciclo de contenido', d: 'Del día 1 al 20, con los departamentos del plan' },
      { v: 'Proyecto', i: ico('puzzle'), l: 'Proyecto por fases', d: 'Algo puntual: una web, un lanzamiento' },
      { v: 'Growth', i: ico('trend'), l: 'Business Growth', d: 'Consultoría: ganar más y gastar menos' },
      { v: 'Custom', i: ico('layers'), l: 'Proyecto custom', d: 'Eliges los servicios del catálogo y qué tan fuerte va cada uno' }] },
    { k: 'client', q: '¿Para quién?', type: 'cards', req: true, opts: [...clients.map((c) => ({ v: c.slug, i: ico('tag'), l: c.slug.toUpperCase(), d: cleanPlan(c.plan) })), { v: 'inherent', i: ico('home'), l: 'Inherent', d: 'Nuestras propias redes' }, { v: '_', i: ico('gear'), l: 'Interno', d: 'Sin cliente' }] },
    { k: 'start', q: '¿Cuándo arranca?', type: 'when', req: true, sub: (x) => (x.kind === 'Ciclo mensual' ? 'Es el día 1 del ciclo' : '') },
    { k: 'svcs', q: '¿Qué servicios lleva?', sub: 'Del catálogo de Sales. En el siguiente paso eliges qué tan fuerte va cada uno.', type: 'multi', req: true, show: (x) => x.kind === 'Custom' && !pre.items,
      opts: () => services.map((sv) => ({ v: sv.id, l: sv.name, d: `${sv.category || ''} · ${svcHours(sv, 5)}–${svcHours(sv, 10)} h` })) },
    { k: 'depts', q: '¿Qué departamentos corren?', sub: 'Ya vienen marcados los de su plan contratado', type: 'multi', show: (x) => x.kind !== 'Growth' && x.kind !== 'Custom',
      opts: DEPTS.map(([n, name]) => ({ v: n, l: `${n} ${name}` })), v: (x) => deptsOfPlan(clients.find((c) => c.slug === x.client)) },
    { k: 'auto', q: '¿Creo las tareas por ti?', type: 'cards', req: true, opts: [
      { v: 'si', i: ico('bolt'), l: 'Sí, con responsables y fechas', d: 'Una por departamento, según el perfil de cada quien' },
      { v: 'no', i: ico('hand'), l: 'No, las agrego yo' }] },
    { k: 'name', q: 'Último paso: ¿cómo se llama?', type: 'text', req: true, ph: 'Nombre del proyecto',
      v: pre.name ? pre.name : (x) => `${x.client === '_' ? 'Interno' : (x.client || '').toUpperCase()} · ${x.kind === 'Ciclo mensual' ? 'ciclo ' + (x.start || today()).slice(0, 7) : x.kind === 'Growth' ? 'Business Growth' : x.kind === 'Custom' ? 'custom' : 'proyecto'}` },
  ]);
  if (!a) return null;
  const c = clients.find((x) => x.slug === a.client);
  const kind = a.kind, start = a.start || today();
  // el nombre por defecto se arma con las respuestas anteriores
  if (!a.name) a.name = `${(a.client || '').toUpperCase()} · ${kind}`;
  const depts = new Set(a.depts || DEPTS.map(([d]) => d));
  // Custom: qué tan fuerte va cada servicio (5 sencillo · 10 fuerte).
  const items = pre.items || (kind === 'Custom' ? await levels(services.filter((sv) => a.svcs.includes(sv.id)), rates) : null);
  if (kind === 'Custom' && !items) return null;
  try {
    const p = await col('projects').create({ name: a.name, kind, line: kind === 'Growth' ? 'growth' : 'contenido', cycle: kind === 'Ciclo mensual' ? start.slice(0, 7) : '',
      client: c ? c.slug.toUpperCase() : a.client === 'inherent' ? 'Inherent' : '', client_slug: c ? c.slug : a.client === 'inherent' ? 'inherent' : '', color: ['olive', 'terra', 'ink'][projects.length % 3],
      phases: phasesFor(kind, start), meetings: meetingsFor(kind, start), ...(items ? { services: items, price: items.reduce((x, i) => x + (i.price || 0), 0) || null } : {}), ...(pre.quote_id ? { quote_id: pre.quote_id } : {}), pipeline: Object.fromEntries(DEPTS.map(([d]) => [d, { status: depts.has(d) ? 'todo' : 'off' }])) });
    let made = [];
    if (a.auto === 'si') made = await createLinked(items ? customTasks(p, items, team, me.email) : tasksFor(p, team, tasks, me.email), (t) => col('tasks').create(t));
    // Si el cliente todavía no tiene su Drive, se crea y se conecta (sin frenar si falla).
    if (c) { const acc = await col('accounts').get('acc-' + c.slug).catch(() => null); if (!acc?.drive) api('drive/client', { method: 'POST', body: { slug: c.slug, growth: kind === 'Growth' || /accelerate|compound/i.test(c.plan || '') } }).then(() => toast(`Drive de ${c.slug.toUpperCase()} creado y conectado`)).catch(() => {}); }
    toast(`Proyecto creado${made.length ? ` · ${made.length} tareas` : ''}`);
    return { project: p, tasks: made };
  } catch (e) { toast(e.message, true); return null; }
}

// ---------- Tarea ----------
export const VIS_OPTS = [{ v: 'all', i: ico('users'), l: 'Todos', d: 'El equipo completo' }, { v: 'private', i: ico('lock'), l: 'Solo yo', d: 'Y quien la hace' }, { v: 'people', i: ico('eye'), l: 'Ciertas personas', d: 'Tú eliges quién' }];
export const visLabel = (t) => (t.visibility === 'private' ? 'Solo yo' : t.visibility === 'people' ? `${(t.viewers || []).length + 1}+ personas` : '');
// Proyecto custom: un control 5–10 por servicio; se ven las horas, el costo (CEO) y el precio.
function levels(list, rates) {
  return new Promise((resolve) => {
    const lv = Object.fromEntries(list.map((sv) => [sv.id, sv.level || 5]));
    const row = (sv) => { const l = lv[sv.id], c = svcCost(sv, rates, l), pr = svcPrice(sv, l);
      return html`<div class="lvrow"><div class="row"><b style="font-weight:500">${sv.name}</b><div class="sp"></div><span class="chip ${l >= 8 ? 'dark' : ''}">${l <= 6 ? 'Sencillo' : l >= 9 ? 'Fuerte' : 'Medio'} · ${l}</span></div>
        <input type="range" min="3" max="10" step="1" value="${l}" data-lv="${sv.id}" style="width:100%;margin:8px 0">
        <div class="row sm mut"><span>${svcHours(sv, l)} h${daysAt(sv, l) ? ` · ${daysAt(sv, l)} días` : ''} · ${(sv.tasks || []).map((t) => `${t.role} ${hoursAt(t, l)} h`).join(' · ')}</span><div class="sp"></div>${c ? html`<span>Costo ${c.miss.length ? ico('alert') : Q(c.cost)}</span>` : ''}${pr ? html`<span style="margin-left:10px">Precio ${Q(pr)}</span>` : ''}</div></div>`; };
    const draw = () => {
      drawer(html`<div class="row"><span class="chip">Proyecto custom</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
        <h2>¿Qué tan fuerte va cada servicio?</h2><div class="mut sm">5 = entrega sencilla · 10 = entrega fuerte. Las horas de cada rol salen del catálogo.</div>
        <div style="margin-top:14px">${list.map(row)}</div>
        <div class="card glass" style="margin-top:14px;padding:14px"><div class="row"><span class="mut sm">Total</span><div class="sp"></div><b style="font-weight:500">${list.reduce((x, sv) => x + svcHours(sv, lv[sv.id]), 0)} h${rates ? ' · costo ' + Q(list.reduce((x, sv) => x + (svcCost(sv, rates, lv[sv.id])?.cost || 0), 0)) : ''}${list.some((sv) => sv.price) ? ' · precio ' + Q(list.reduce((x, sv) => x + (svcPrice(sv, lv[sv.id]) || 0), 0)) : ''}</b></div></div>
        <div class="row" style="margin-top:16px"><button class="btn" data-act="ok">Crear proyecto</button></div>`, {
        ok: () => { done = true; closeDrawer(); resolve(list.map((sv) => ({ id: sv.id, name: sv.name, level: lv[sv.id], days: daysAt(sv, lv[sv.id]), includes: includesAt(sv, lv[sv.id]), hours: svcHours(sv, lv[sv.id]), roles: (sv.tasks || []).map((t) => ({ role: t.role, hours: hoursAt(t, lv[sv.id]) })), price: svcPrice(sv, lv[sv.id]) }))); },
      });
      $$('[data-lv]', $('#drawer')).forEach((r) => r.addEventListener('input', () => { lv[r.dataset.lv] = +r.value; const y = $('#drawer').scrollTop; draw(); $('#drawer').scrollTop = y; }));
    };
    let done = false; draw();
    const veil = $('#veil'); const off = () => { veil.removeEventListener('click', off); if (!done) resolve(null); }; veil.addEventListener('click', off);
    $('#drawer').addEventListener('click', function x(e) { if (e.target.closest('[data-act=close]')) { $('#drawer').removeEventListener('click', x); if (!done) resolve(null); } });
  });
}
const SUGGEST = ['Reunión con el cliente', 'Guion del reel', 'Editar reel', 'Diseñar carrusel', 'Static ad', 'Programar publicaciones', 'Responder comunidad', 'Revisar entregas', 'Propuesta para cliente'];
export async function newTask({ team, me, projects = [], pre = {} }) {
  const people = team.filter((p) => p.active !== false && p.kind !== 'ia');
  const a = await wizard('Nueva tarea', [
    { k: 'title', q: '¿Qué hay que hacer?', type: 'text', req: true, ph: 'Escribe la tarea…', chips: SUGGEST, v: pre.title },
    { k: 'project_id', q: '¿De qué proyecto?', type: 'cards', req: true, v: pre.project_id, show: () => pre.project_id === undefined,
      opts: [...projects.filter((p) => (p.phases || []).some((x) => x.status !== 'done')).slice(0, 11).map((p) => ({ v: p.id, i: p.line === 'growth' ? ico('trend') : ico('repeat'), l: p.client || p.name, d: p.name })), { v: '_', i: ico('gear'), l: 'Interno', d: 'No es de un cliente' }] },
    { k: 'assignee', q: '¿Quién lo hace?', type: 'cards', req: true, v: pre.assignee, show: () => pre.assignee === undefined,
      opts: people.map((p) => ({ v: p.email || p.id, i: p.picture ? ico('smile') : ico('user'), l: (p.email || p.id) === me.email ? `${p.name} (yo)` : p.name, d: (p.roles || []).map((r) => roleName(r).split(' · ')[0]).join(', ') || p.title || '' })) },
    { k: 'dept', q: '¿De qué departamento?', type: 'cards', v: pre.dept, show: () => pre.dept === undefined,
      opts: [{ v: '', i: '—', l: 'Ninguno' }, ...DEPTS.map(([n, name]) => ({ v: `${n} ${name}`, l: `${n} ${name}` }))] },
    { k: 'due', q: '¿Para cuándo?', type: 'when', v: pre.due },
    { k: 'visibility', q: '¿Quién la puede ver?', type: 'cards', req: true, v: pre.visibility || 'all', opts: VIS_OPTS },
    { k: 'viewers', q: '¿Quiénes más la pueden ver?', sub: 'Tú y quien la hace ya la ven.', type: 'multi', req: true, show: (a) => a.visibility === 'people',
      opts: (a) => people.filter((p) => ![me.email, a.assignee].includes(p.email || p.id)).map((p) => ({ v: p.email || p.id, l: p.name })) },
  ], 'Crear tarea');
  if (!a) return null;
  try {
    const t = await col('tasks').create({ checklist: [], comments: [], status: pre.status || 'Por empezar', accountable: pre.accountable || '', ...a, viewers: a.visibility === 'people' ? a.viewers || [] : [], project_id: a.project_id === '_' ? '' : a.project_id, due: a.due || '' });
    toast(`Tarea creada${t.due ? ' · vence ' + fdate(t.due) : ''}`); return t;
  } catch (e) { toast(e.message, true); return null; }
}
