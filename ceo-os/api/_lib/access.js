import { getSession, issue, STEPUP_TTL } from './auth.js';

export const AREAS = ['finanzas', 'conocimiento', 'content', 'sales', 'strategy', 'operations'];

// 🔒 finanzas es SOLO del CEO y no es configurable. El resto, por rol.
const ROLES = {
  ceo: AREAS,
  coo: ['conocimiento', 'content', 'sales', 'strategy', 'operations'],
  team: ['conocimiento', 'content', 'operations'],
};
export const areasFor = (role) => ROLES[role] || [];
export const can = (role, area) => areasFor(role).includes(area);

// Anti-CSRF: toda escritura exige el header propio (dispara preflight CORS, que no permitimos) y mismo origen.
export function csrfOk(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  if (req.headers['x-ceoos'] !== '1') return false;
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

// Devuelve la sesión, o responde 401/403 y devuelve null.
export function guard(req, res, area) {
  if (!csrfOk(req)) { res.status(403).json({ error: 'Origen no permitido' }); return null; }
  let s = getSession(req);
  if (!s) { res.status(401).json({ error: 'No autenticado' }); return null; }
  if (area && !can(s.role, area)) { res.status(403).json({ error: 'Sin acceso a esta área' }); return null; }
  // Finanzas pide un código 2FA fresco (step-up) además de la sesión.
  if (area === 'finanzas' && Math.floor(Date.now() / 1000) - (s.su || 0) > STEPUP_TTL) {
    res.status(401).json({ error: 'Confirma tu código 2FA para entrar a Finanzas', code: 'STEPUP' }); return null;
  }
  s = issue(res, req, s); // sesión deslizante: renueva la inactividad
  return s;
}
