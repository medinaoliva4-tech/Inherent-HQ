// Quién entra a qué. El permiso se aplica aquí, en el servidor; la interfaz solo lo refleja.
// La regla (qué sección ve cada perfil, qué tan a fondo, y qué datos) vive en public/js/roleviews.js,
// compartida con la interfaz; el CEO la edita en Administración → Vistas por rol y se guarda en settings «role_views».
import * as session from './session.js';
import * as db from './db.js';
import { AREAS as VIEW_AREAS, baseAreas, levelsFor, scopeFor, startFor } from '../../public/js/roleviews.js';

export const AREAS = VIEW_AREAS;
// Las áreas de siempre de cada rol (sin configuración). El CEO y el COO también ven el portal como lo ve el cliente.
export const areasFor = (role, roles = []) => (role === 'client' ? ['portal'] : [...baseAreas(role, roles), ...(role === 'ceo' || role === 'coo' ? ['portal'] : [])]);

// Cada colección pertenece a un área. Algunas solo las escribe el CEO.
export const COLLS = {
  leads: 'sales', lead_sources: 'sales', quotes: 'sales', services: 'sales', mentors: 'sales',
  rates: 'finanzas', packages: 'finanzas', bundles: 'finanzas', finance: 'finanzas', payroll: 'finanzas',
  projects: 'operations', tasks: 'operations', recipes: 'operations', accounts: 'clients',
  content: 'content', sources: 'content', analytics: 'content',
  folders: 'library', docs: 'library', roadmap: 'roadmap',
  team: 'team', settings: 'home', checks: 'work',
};
// Lo que el Workspace necesita leer aunque la persona no entre a esas áreas
// (sus tareas, los proyectos y las cuentas de sus clientes). Las tareas también las escribe: ahí entrega.
export const READ_ALSO = { tasks: ['work'], projects: ['work'], accounts: ['work'], recipes: ['work', 'sales'] };
export const WRITE_ALSO = { tasks: ['work'] };
const CEO_WRITE = new Set(['team', 'settings', 'rates', 'packages', 'bundles', 'finance', 'payroll', 'mentors', 'lead_sources', 'recipes']);
// Costos, márgenes, tarifas y pagos: solo el CEO los lee, siempre, diga lo que diga la matriz.
export const CEO_READ = new Set(['rates', 'packages', 'bundles', 'payroll']);
export const canWrite = (role, coll) => !CEO_WRITE.has(coll) || role === 'ceo';
export const canRead = (role, coll) => !CEO_READ.has(coll) || role === 'ceo';
// Las colecciones que filtra el alcance (todos · asignados · propio).
export const SCOPED = ['projects', 'tasks', 'accounts', 'leads'];

export const domain = () => (process.env.ALLOWED_DOMAIN || 'inherentglobal.com').toLowerCase();
const admins = () => String(process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

// El rol vive en la colección team. Los ADMIN_EMAILS son siempre CEO (nadie los puede bajar).
export async function userFor(email) {
  const u = await db.get('team', email);
  const role = admins().includes(email) ? 'ceo' : u?.role || 'team';
  // Un correo de afuera solo es «cliente» o lo que el CEO le dio; nunca hereda nada por default.
  return { email, external: Boolean(u?.external), client_slug: u?.client_slug || '', name: u?.name || email.split('@')[0], picture: u?.photo || u?.picture || null, title: u?.title || '', roles: Array.isArray(u?.roles) && u.roles.length ? u.roles : role === 'ceo' ? ['ceo'] : role === 'coo' ? ['coo'] : [], role, active: u ? u.active !== false : true };
}

// La matriz del CEO (settings «role_views»). Se guarda unos segundos para no leerla dos veces en la misma llamada.
let vcache = { at: 0, doc: null };
export async function viewsDoc() {
  if (Date.now() - vcache.at > 5000) { let doc = null; try { doc = await db.get('settings', 'role_views'); } catch {} vcache = { at: Date.now(), doc }; }
  return vcache.doc;
}
export const forgetViews = () => { vcache = { at: 0, doc: null }; };
// Deja en el usuario lo que se aplica: views (profundidad por sección), scope, start y areas (solo las visibles).
export function effective(u, doc) {
  if (u.role === 'client') { u.areas = ['portal']; u.views = {}; u.scope = 'propio'; u.start = 'portal'; return u; }
  u.views = levelsFor(doc, u); u.scope = scopeFor(doc, u); u.start = startFor(doc, u, u.views);
  u.areas = [...AREAS.filter((a) => u.views[a] !== 'oculto'), ...(u.role === 'ceo' || u.role === 'coo' ? ['portal'] : [])];
  return u;
}
export const levelOf = (u, area) => (u.views ? u.views[area] || 'oculto' : u.areas?.includes(area) ? 'edita' : 'oculto');
export const sees = (u, area) => levelOf(u, area) !== 'oculto';
export const edits = (u, area) => levelOf(u, area) === 'edita' || (area === 'portal' && u.areas?.includes('portal'));

export function csrfOk(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  if (req.headers['x-ceoos'] !== '1') return false;
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

// Devuelve el usuario, o responde 401/403 y devuelve null.
// Los clientes (portal) solo pasan por rutas que lo permiten de forma explícita (opts.client).
// opts.write: la ruta cambia algo del área → hace falta nivel «edita».
export async function guard(req, res, area, opts = {}) {
  if (!csrfOk(req)) { res.status(403).json({ error: 'Origen no permitido' }); return null; }
  const s = session.read(req);
  if (!s) { res.status(401).json({ error: 'No autenticado' }); return null; }
  const u = effective(await userFor(s.email), await viewsDoc());
  if (!u.active || !(u.email.endsWith('@' + domain()) || u.external)) { session.clear(res); res.status(401).json({ error: 'Cuenta sin acceso' }); return null; }
  if (u.role === 'client' && !opts.client) { res.status(403).json({ error: 'Sin acceso' }); return null; }
  if (area && !u.areas.includes(area)) { res.status(403).json({ error: 'Sin acceso a esta área' }); return null; }
  if (area && opts.write && !edits(u, area)) { res.status(403).json({ error: 'Tu perfil solo puede ver esto, no cambiarlo' }); return null; }
  session.issue(req, res, s); // sesión deslizante
  return u;
}

// Para rutas que sirven a más de un área (ej. la ficha del cliente: Clients y el Workspace).
export async function guardAny(req, res, areas, opts = {}) {
  const u = await guard(req, res); if (!u) return null;
  if (!areas.some((a) => u.areas.includes(a))) { res.status(403).json({ error: 'Sin acceso a esta área' }); return null; }
  if (opts.write && !areas.some((a) => u.areas.includes(a) && edits(u, a))) { res.status(403).json({ error: 'Tu perfil solo puede ver esto, no cambiarlo' }); return null; }
  return u;
}

// ---------- El alcance de los datos ----------
// «asignados»: los proyectos donde la persona tiene tareas (o está en su lista de personas), sus clientes
// y sus tareas; los leads de su rol. «propio»: solo sus tareas, los proyectos donde las tiene y los leads que creó.
// Devuelve null cuando no hay que filtrar (todos, o el CEO).
const lc = (x) => String(x || '').toLowerCase();
export async function scoper(u, pre = {}) {
  if (!u || u.role === 'ceo' || !u.scope || u.scope === 'todos') return null;
  const [tasks, projects] = await Promise.all([pre.tasks || db.list('tasks'), pre.projects || db.list('projects')]);
  const me = lc(u.email), own = u.scope === 'propio';
  const mineT = (t) => [t.assignee, t.accountable, t._meta?.created_by, ...(Array.isArray(t.viewers) ? t.viewers : [])].some((x) => lc(x) === me);
  const pids = new Set(tasks.filter(mineT).map((t) => t.project_id).filter(Boolean));
  for (const p of projects) if ((Array.isArray(p.people) ? p.people : []).some((x) => lc(x) === me)) pids.add(p.id);
  const slugs = new Set(projects.filter((p) => pids.has(p.id)).map((p) => p.client_slug).filter(Boolean));
  const roles = u.roles || [];
  return {
    scope: u.scope, pids, slugs,
    projects: (p) => pids.has(p.id),
    tasks: (t) => mineT(t) || (!own && Boolean(t.project_id) && pids.has(t.project_id)),
    accounts: (a) => slugs.has(lc(a.slug || String(a.id).replace(/^acc-/, ''))),
    leads: (l) => lc(l._meta?.created_by) === me || (!own && roles.includes(l.owner_role || 'ventas')),
    client: (slug) => slugs.has(lc(slug)),
  };
}
export const inScope = (sc, coll, d) => !sc || typeof sc[coll] !== 'function' || !d || sc[coll](d);
