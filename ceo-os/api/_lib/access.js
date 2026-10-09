import { getSession } from './auth.js';

export const AREAS = ['finanzas', 'conocimiento', 'content', 'sales', 'strategy', 'operations'];

// 🔒 finanzas es SOLO del CEO y no es configurable. El resto, por rol.
const ROLES = {
  ceo: AREAS,
  coo: ['conocimiento', 'content', 'sales', 'strategy', 'operations'],
  team: ['conocimiento', 'content', 'operations'],
};

export const areasFor = (role) => ROLES[role] || [];
export const can = (role, area) => areasFor(role).includes(area);

// Devuelve la sesión, o responde 401/403 y devuelve null.
export function guard(req, res, area) {
  const s = getSession(req);
  if (!s) { res.status(401).json({ error: 'No autenticado' }); return null; }
  if (area && !can(s.role, area)) { res.status(403).json({ error: 'Sin acceso a esta área' }); return null; }
  return s;
}
