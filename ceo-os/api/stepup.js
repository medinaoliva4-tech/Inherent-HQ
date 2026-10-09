import { guard } from './_lib/access.js';
import { getSession, issue, verifyTotp, userTotp } from './_lib/auth.js';
import { body, fail } from './_lib/http.js';

// Re-confirmación 2FA para entrar a Finanzas (no usa guard('finanzas') para no pedirse a sí mismo).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const s0 = guard(req, res);
  if (!s0) return;
  try {
    const s = getSession(req);
    if (!verifyTotp(userTotp(s.user), body(req).code, s.user)) {
      await new Promise((r) => setTimeout(r, 800));
      return res.status(401).json({ error: 'Código incorrecto' });
    }
    issue(res, req, { ...s, su: Math.floor(Date.now() / 1000) });
    console.log(JSON.stringify({ evt: 'stepup', user: s.user }));
    res.json({ ok: true });
  } catch (e) { fail(res, e); }
}
