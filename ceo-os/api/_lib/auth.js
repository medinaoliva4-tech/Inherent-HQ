import crypto from 'node:crypto';

const TTL = 12 * 60 * 60; // 12 h
const b64 = (b) => Buffer.from(b).toString('base64url');

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt:${salt}:${crypto.scryptSync(pw, salt, 32).toString('hex')}`;
}

function verifyPassword(pw, stored) {
  const [alg, salt, hex] = String(stored || '').split(':');
  if (alg !== 'scrypt' || !salt || !hex) return false;
  const want = Buffer.from(hex, 'hex');
  const got = crypto.scryptSync(pw, salt, want.length);
  return crypto.timingSafeEqual(want, got);
}

function users() {
  try { return JSON.parse(process.env.AUTH_USERS || '[]'); } catch { return []; }
}

// Siempre hace el scrypt, exista o no el usuario, para no filtrar cuáles existen.
const DUMMY = hashPassword('dummy-password-no-user');
export function checkLogin(user, pw) {
  const u = users().find((x) => x.user === String(user || '').toLowerCase());
  const ok = verifyPassword(String(pw || ''), u ? u.hash : DUMMY);
  return ok && u ? { user: u.user, name: u.name || u.user, role: u.role } : null;
}

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET falta o es corto (mín. 32 caracteres)');
  const body = b64(JSON.stringify(payload));
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`;
}

export function sessionCookie(sess) {
  const token = sign({ ...sess, exp: Math.floor(Date.now() / 1000) + TTL });
  return `ceoos=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${TTL}`;
}
export const clearCookie = () => 'ceoos=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';

export function getSession(req) {
  const m = /(?:^|;\s*)ceoos=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [body, mac] = m[1].split('.');
  if (!body || !mac) return null;
  try {
    const want = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(body).digest();
    const got = Buffer.from(mac, 'base64url');
    if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() / 1000 ? p : null;
  } catch { return null; }
}
