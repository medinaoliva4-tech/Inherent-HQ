// Crear cosas con preguntas, no con formularios. Lo usan Operations, Workspace y Clients.
import { wizard, col, api, toast, roleName, today, fdate } from './core.js';
import { DEPTS, deptsOfPlan, phasesFor, tasksFor } from './cycle.js';

const cleanPlan = (s) => String(s || '').replace(/^[⬜🔷🟨]️?\s*/u, '');

// ---------- Proyecto ----------
export async function newProject({ team, me, projects = [], tasks = [] }) {
  let clients = [];
  try { clients = (await api('repo/clients')).clients.filter((c) => c.hasPlan); } catch {}
  const mes = today().slice(0, 7);
  const a = await wizard('Nuevo proyecto', [
    { k: 'kind', q: '¿Qué tipo de proyecto es?', type: 'cards', req: true, opts: [
      { v: 'Ciclo mensual', i: '🔁', l: 'Ciclo de contenido', d: 'Del día 1 al 20, con los departamentos del plan' },
      { v: 'Proyecto', i: '🧩', l: 'Proyecto por fases', d: 'Algo puntual: una web, un lanzamiento' },
      { v: 'Growth', i: '📈', l: 'Business Growth', d: 'Consultoría: ganar más y gastar menos' }] },
    { k: 'client', q: '¿Para quién?', type: 'cards', req: true, opts: [...clients.map((c) => ({ v: c.slug, i: '🏷️', l: c.slug.toUpperCase(), d: cleanPlan(c.plan) })), { v: 'inherent', i: '🏠', l: 'Inherent', d: 'Nuestras propias redes' }, { v: '_', i: '⚙️', l: 'Interno', d: 'Sin cliente' }] },
    { k: 'start', q: '¿Cuándo arranca?', type: 'when', req: true, sub: (x) => (x.kind === 'Ciclo mensual' ? 'Es el día 1 del ciclo' : '') },
    { k: 'depts', q: '¿Qué departamentos corren?', sub: 'Ya vienen marcados los de su plan contratado', type: 'multi', show: (x) => x.kind !== 'Growth',
      opts: DEPTS.map(([n, name]) => ({ v: n, l: `${n} ${name}` })), v: (x) => deptsOfPlan(clients.find((c) => c.slug === x.client)) },
    { k: 'auto', q: '¿Creo las tareas por ti?', type: 'cards', req: true, opts: [
      { v: 'si', i: '⚡', l: 'Sí, con responsables y fechas', d: 'Una por departamento, según el perfil de cada quien' },
      { v: 'no', i: '✋', l: 'No, las agrego yo' }] },
    { k: 'name', q: 'Último paso: ¿cómo se llama?', type: 'text', req: true, ph: 'Nombre del proyecto',
      v: (x) => `${x.client === '_' ? 'Interno' : (x.client || '').toUpperCase()} · ${x.kind === 'Ciclo mensual' ? 'ciclo ' + (x.start || today()).slice(0, 7) : x.kind === 'Growth' ? 'Business Growth' : 'proyecto'}` },
  ]);
  if (!a) return null;
  const c = clients.find((x) => x.slug === a.client);
  const kind = a.kind, start = a.start || today();
  // el nombre por defecto se arma con las respuestas anteriores
  if (!a.name) a.name = `${(a.client || '').toUpperCase()} · ${kind}`;
  const depts = new Set(a.depts || DEPTS.map(([d]) => d));
  try {
    const p = await col('projects').create({ name: a.name, kind, line: kind === 'Growth' ? 'growth' : 'contenido', cycle: kind === 'Ciclo mensual' ? start.slice(0, 7) : '',
      client: c ? c.slug.toUpperCase() : a.client === 'inherent' ? 'Inherent' : '', client_slug: c ? c.slug : a.client === 'inherent' ? 'inherent' : '', color: ['olive', 'terra', 'ink'][projects.length % 3],
      phases: phasesFor(kind, start), pipeline: Object.fromEntries(DEPTS.map(([d]) => [d, { status: depts.has(d) ? 'todo' : 'off' }])) });
    let made = [];
    if (a.auto === 'si') for (const t of tasksFor(p, team, tasks, me.email)) made.push(await col('tasks').create({ checklist: [], comments: [], ...t }));
    toast(`Proyecto creado ✅${made.length ? ` · ${made.length} tareas` : ''}`);
    return { project: p, tasks: made };
  } catch (e) { toast(e.message, true); return null; }
}

// ---------- Tarea ----------
export const VIS_OPTS = [{ v: 'all', i: '👥', l: 'Todos', d: 'El equipo completo' }, { v: 'private', i: '🔒', l: 'Solo yo', d: 'Y quien la hace' }, { v: 'people', i: '👀', l: 'Ciertas personas', d: 'Tú eliges quién' }];
export const visLabel = (t) => (t.visibility === 'private' ? '🔒 Solo yo' : t.visibility === 'people' ? `👀 ${(t.viewers || []).length + 1}+ personas` : '');
const SUGGEST = ['Reunión con el cliente', 'Guion del reel', 'Editar reel', 'Diseñar carrusel', 'Static ad', 'Programar publicaciones', 'Responder comunidad', 'Revisar entregas', 'Propuesta para cliente'];
export async function newTask({ team, me, projects = [], pre = {} }) {
  const people = team.filter((p) => p.active !== false && p.kind !== 'ia');
  const a = await wizard('Nueva tarea', [
    { k: 'title', q: '¿Qué hay que hacer?', type: 'text', req: true, ph: 'Escribe la tarea…', chips: SUGGEST, v: pre.title },
    { k: 'project_id', q: '¿De qué proyecto?', type: 'cards', req: true, v: pre.project_id, show: () => pre.project_id === undefined,
      opts: [...projects.filter((p) => (p.phases || []).some((x) => x.status !== 'done')).slice(0, 11).map((p) => ({ v: p.id, i: p.line === 'growth' ? '📈' : '🔁', l: p.client || p.name, d: p.name })), { v: '_', i: '⚙️', l: 'Interno', d: 'No es de un cliente' }] },
    { k: 'assignee', q: '¿Quién lo hace?', type: 'cards', req: true, v: pre.assignee, show: () => pre.assignee === undefined,
      opts: people.map((p) => ({ v: p.email || p.id, i: p.picture ? '🙂' : '👤', l: (p.email || p.id) === me.email ? `${p.name} (yo)` : p.name, d: (p.roles || []).map((r) => roleName(r).split(' · ')[0]).join(', ') || p.title || '' })) },
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
    toast(`Tarea creada ✅${t.due ? ' · vence ' + fdate(t.due) : ''}`); return t;
  } catch (e) { toast(e.message, true); return null; }
}
