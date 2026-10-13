// Quién entra a qué. El permiso se aplica aquí, en el servidor; la interfaz solo lo refleja.
import * as session from './session.js';
import * as db from './db.js';

export const AREAS = ['home', 'control', 'work', 'finanzas', 'sales', 'operations', 'clients', 'content', 'library', 'team'];
const ROLE_AREAS = {
  ceo: AREAS,                                                        // 🔒 todo
  coo: AREAS.filter((a) => a !== 'finanzas'),                        // todo menos Finanzas
  // El equipo: su resumen, su Workspace, la Library y el Team. Content solo con el perfil «content».
  team: ['home', 'work', 'content', 'library', 'team'],
  client: ['portal'],                                                // 🔒 el cliente: solo su portal
};
ROLE_AREAS.ceo = [...AREAS, 'portal']; ROLE_AREAS.coo = [...ROLE_AREAS.coo, 'portal']; // para ver el portal como lo ve el cliente
// Content es para decidir: solo el CEO y quien tiene el perfil de trabajo «content».
export const areasFor = (role, roles = []) => (ROLE_AREAS[role] || []).filter((a) => a !== 'content' || role === 'ceo' || roles.includes('content'));

// Cada colección pertenece a un área. Algunas solo las escribe el CEO.
export const COLLS = {
  leads: 'sales', quotes: 'sales', services: 'sales', mentors: 'sales',
  rates: 'finanzas', finance: 'finanzas', payroll: 'finanzas',
  projects: 'operations', tasks: 'operations', accounts: 'clients',
  content: 'content', sources: 'content', analytics: 'content',
  folders: 'library', docs: 'library',
  team: 'team', settings: 'home', checks: 'work',
};
// Lo que el Workspace necesita leer aunque la persona no entre a esas áreas
// (sus tareas, los proyectos y las cuentas de sus clientes). Las tareas también las escribe: ahí entrega.
export const READ_ALSO = { tasks: ['work'], projects: ['work'], accounts: ['work'] };
export const WRITE_ALSO = { tasks: ['work'] };
const CEO_WRITE = new Set(['team', 'settings', 'rates', 'finance', 'payroll', 'mentors']);
export const canWrite = (role, coll) => !CEO_WRITE.has(coll) || role === 'ceo';

export const domain = () => (process.env.ALLOWED_DOMAIN || 'inherentglobal.com').toLowerCase();
const admins = () => String(process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

// El rol vive en la colección team. Los ADMIN_EMAILS son siempre CEO (nadie los puede bajar).
export async function userFor(email) {
  const u = await db.get('team', email);
  const role = admins().includes(email) ? 'ceo' : u?.role || 'team';
  // Un correo de afuera solo es «cliente» o lo que el CEO le dio; nunca hereda nada por default.
  return { email, external: Boolean(u?.external), client_slug: u?.client_slug || '', name: u?.name || email.split('@')[0], picture: u?.photo || u?.picture || null, title: u?.title || '', roles: Array.isArray(u?.roles) && u.roles.length ? u.roles : role === 'ceo' ? ['ceo'] : role === 'coo' ? ['coo'] : [], role, active: u ? u.active !== false : true };
}

export function csrfOk(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  if (req.headers['x-ceoos'] !== '1') return false;
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

// Devuelve el usuario, o responde 401/403 y devuelve null.
// Los clientes (portal) solo pasan por rutas que lo permiten de forma explícita (opts.client).
export async function guard(req, res, area, opts = {}) {
  if (!csrfOk(req)) { res.status(403).json({ error: 'Origen no permitido' }); return null; }
  const s = session.read(req);
  if (!s) { res.status(401).json({ error: 'No autenticado' }); return null; }
  const u = await userFor(s.email);
  if (!u.active || !(u.email.endsWith('@' + domain()) || u.external)) { session.clear(res); res.status(401).json({ error: 'Cuenta sin acceso' }); return null; }
  if (u.role === 'client' && !opts.client) { res.status(403).json({ error: 'Sin acceso' }); return null; }
  if (area && !areasFor(u.role, u.roles).includes(area)) { res.status(403).json({ error: 'Sin acceso a esta área' }); return null; }
  session.issue(req, res, s); // sesión deslizante
  return u;
}

// Para rutas que sirven a más de un área (ej. la ficha del cliente: Clients y el Workspace).
export async function guardAny(req, res, areas) {
  const u = await guard(req, res); if (!u) return null;
  if (!areasFor(u.role, u.roles).some((a) => areas.includes(a))) { res.status(403).json({ error: 'Sin acceso a esta área' }); return null; }
  return u;
}
