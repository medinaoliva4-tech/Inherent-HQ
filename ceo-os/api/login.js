import { checkLogin, sessionCookie } from './_lib/auth.js';
import { areasFor } from './_lib/access.js';
import { body, fail } from './_lib/http.js';

const fails = new Map(); // freno básico por IP (por instancia)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
    const f = fails.get(ip) || { n: 0, t: 0 };
    if (f.n >= 5 && Date.now() - f.t < 15 * 60 * 1000) return res.status(429).json({ error: 'Muchos intentos. Espera 15 min.' });
    const { user, password } = body(req);
    const u = checkLogin(user, password);
    if (!u) {
      fails.set(ip, { n: f.n + 1, t: Date.now() });
      await new Promise((r) => setTimeout(r, 600));
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    fails.delete(ip);
    res.setHeader('Set-Cookie', sessionCookie(u));
    res.json({ ...u, areas: areasFor(u.role) });
  } catch (e) { fail(res, e); }
}
