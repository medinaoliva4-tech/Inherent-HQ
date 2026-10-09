import { guard, areasFor } from './_lib/access.js';
export default function handler(req, res) {
  const s = guard(req, res);
  if (!s) return;
  res.json({ user: s.user, name: s.name, role: s.role, areas: areasFor(s.role) });
}
