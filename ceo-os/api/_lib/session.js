// Sesión: cookie firmada (HMAC), atada al navegador, con vida máxima e inactividad.
import crypto from 'node:crypto';

export const ABS_TTL = 30 * 24 * 60 * 60; // 30 días desde el login
export const IDLE_TTL = 14 * 24 * 60 * 60; // 14 días sin actividad
const now = () => Math.floor(Date.now() / 1000);

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET falta o es corto (mín. 32 caracteres)');
  return s;
}
export const hmac = (data) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');
export function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${hmac(body)}`;
}
export function unsign(token) {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return null;
  const want = Buffer.from(hmac(body)), got = Buffer.from(mac);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
}

const uaHash = (req) => crypto.createHash('sha256').update(String(req.headers['user-agent'] || '')).digest('base64url').slice(0, 16);
export const cookie = (req, name) => (new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(req.headers.cookie || '') || [])[1];

export function addCookie(res, c) {
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, c) : c);
}

export function issue(req, res, s) {
  const t = now();
  const p = { email: s.email, iat: s.iat ?? t, last: t, ua: uaHash(req) };
  addCookie(res, `ceoos=${sign(p)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.max(1, ABS_TTL - (t - p.iat))}`);
  return p;
}
export const clear = (res) => addCookie(res, 'ceoos=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

export function read(req) {
  const p = unsign(cookie(req, 'ceoos'));
  if (!p) return null;
  const t = now();
  if (t - p.iat > ABS_TTL || t - p.last > IDLE_TTL || p.ua !== uaHash(req)) return null;
  return p;
}
