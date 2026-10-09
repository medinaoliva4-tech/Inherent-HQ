import { checkLogin, issue } from './_lib/auth.js';
import { areasFor, csrfOk } from './_lib/access.js';
import { body, fail } from './_lib/http.js';

const fails = new Map(); // freno por IP (por instancia; el firewall de Vercel pone el límite global)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!csrfOk(req)) return res.status(403).json({ error: 'Origen no permitido' });
  try {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
    const f = fails.get(ip) || { n: 0, t: 0 };
    if (f.n >= 5 && Date.now() - f.t < 15 * 60 * 1000) return res.status(429).json({ error: 'Muchos intentos. Espera 15 min.' });
    const { user, password, code } = body(req);
    const u = checkLogin(user, password, code);
    if (!u) {
      fails.set(ip, { n: f.n + 1, t: Date.now() });
      await new Promise((r) => setTimeout(r, 800));
      return res.status(401).json({ error: 'Usuario, contraseña o código incorrectos' }); // mismo mensaje siempre
    }
    fails.delete(ip);
    issue(res, req, { ...u, su: Math.floor(Date.now() / 1000) });
    console.log(JSON.stringify({ evt: 'login', user: u.user, ip }));
    res.json({ ...u, areas: areasFor(u.role) });
  } catch (e) { fail(res, e); }
}
