// Code OS dentro del Chat: el OS es la única puerta. Con la sesión del OS (Google) esta ruta emite un PASE corto que el
// puente del VPS (code-os/puente) acepta en lugar de un token propio. HS256 con el secreto compartido CODEOS_PASE_SECRET
// (Vercel ↔ ~/code-os-data/pase.secret en el VPS). El pase dura 10 minutos y trae solo el correo; el puente decide quién es.
import { createHmac } from 'node:crypto';
import { guard } from './access.js';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

/** JWT HS256 con las mismas claims que verifica code-os/puente/src/pase.ts. */
export function firmarPase(secret, email, ahora = Date.now(), vidaS = 600) {
  const iat = Math.floor(ahora / 1000);
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ typ: 'pase', sub: String(email).toLowerCase(), iat, exp: iat + vidaS, aud: 'code-os' })}`;
  return { pase: `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`, expira: (iat + vidaS) * 1000 };
}

export const urlCode = (env = process.env) => (env.CODEOS_URL || 'https://code.inherentglobal.com').replace(/\/+$/, '');

export function rutas(on) {
  // POST /api/code/pase → { pase, expira, url, usuario }. Solo equipo: un cliente del portal no usa Code.
  on('POST', 'code/pase', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const secret = process.env.CODEOS_PASE_SECRET;
    if (!secret || secret.length < 32) return res.status(503).json({ error: 'Code aún no está configurado en el OS' });
    const { pase, expira } = firmarPase(secret, u.email);
    res.json({ pase, expira, url: urlCode(), usuario: u.email });
  });
}
