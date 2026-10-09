import crypto from 'node:crypto';

export const ABS_TTL = 8 * 60 * 60;   // la sesión muere a las 8 h pase lo que pase
export const IDLE_TTL = 30 * 60;      // ...o a los 30 min sin actividad
export const STEPUP_TTL = 10 * 60;    // Finanzas pide un código 2FA fresco cada 10 min
const now = () => Math.floor(Date.now() / 1000);

// ---------- contraseñas ----------
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt:${salt}:${crypto.scryptSync(pw, salt, 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex')}`;
}
function verifyPassword(pw, stored) {
  const [alg, salt, hex] = String(stored || '').split(':');
  if (alg !== 'scrypt' || !salt || !hex) return false;
  const want = Buffer.from(hex, 'hex');
  const got = crypto.scryptSync(pw, salt, want.length, { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return crypto.timingSafeEqual(want, got);
}

// ---------- 2FA (TOTP, RFC 6238) ----------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
// 20 bytes aleatorios (160 bits) en base32 = 32 caracteres exactos, el formato que aceptan todas las apps.
export function newTotpSecret() {
  const bytes = crypto.randomBytes(20);
  let bits = '', out = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}
function b32decode(s) {
  let bits = '';
  for (const c of String(s).replace(/=+$/, '').toUpperCase()) { const v = B32.indexOf(c); if (v < 0) return Buffer.alloc(0); bits += v.toString(2).padStart(5, '0'); }
  return Buffer.from(bits.match(/.{8}/g)?.map((b) => parseInt(b, 2)) ?? []);
}
export function totpAt(secret, counter) {
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', b32decode(secret)).update(buf).digest();
  const o = h[19] & 15;
  return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1_000_000).padStart(6, '0');
}
const usedCodes = new Map(); // anti-replay por instancia (mejor esfuerzo)
export function verifyTotp(secret, code, who = '') {
  const c = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(c) || !secret) return false;
  const step = Math.floor(Date.now() / 30000);
  for (const d of [-1, 0, 1]) {
    const want = totpAt(secret, step + d);
    if (crypto.timingSafeEqual(Buffer.from(want), Buffer.from(c))) {
      const key = `${who}:${step + d}`;
      if (usedCodes.has(key)) return false; // código ya usado
      usedCodes.set(key, 1);
      for (const k of usedCodes.keys()) if (!k.endsWith(`:${step}`) && !k.endsWith(`:${step - 1}`) && !k.endsWith(`:${step + 1}`)) usedCodes.delete(k);
      return true;
    }
  }
  return false;
}

// ---------- usuarios ----------
function users() { try { return JSON.parse(process.env.AUTH_USERS || '[]'); } catch { return []; } }
const DUMMY = hashPassword('dummy-password-no-user');
// Siempre corre scrypt y siempre evalúa el código, exista o no el usuario: no se filtra cuáles cuentas existen.
export function checkLogin(user, pw, code) {
  const u = users().find((x) => x.user === String(user || '').toLowerCase());
  const okPw = verifyPassword(String(pw || ''), u ? u.hash : DUMMY);
  const okCode = verifyTotp(u?.totp || 'AAAAAAAAAAAAAAAA', code, u?.user || '');
  return okPw && okCode && u && u.totp ? { user: u.user, name: u.name || u.user, role: u.role } : null;
}
export const userTotp = (user) => users().find((x) => x.user === user)?.totp;

// ---------- sesión (cookie firmada, ligada al navegador) ----------
const uaHash = (req) => crypto.createHash('sha256').update(String(req.headers['user-agent'] || '')).digest('base64url').slice(0, 16);
function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET falta o es corto (mín. 32 caracteres)');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`;
}
export function issue(res, req, sess) {
  const t = now();
  const p = { user: sess.user, name: sess.name, role: sess.role, iat: sess.iat ?? t, last: t, su: sess.su ?? 0, ua: uaHash(req) };
  const age = Math.max(1, ABS_TTL - (t - p.iat));
  const c = `ceoos=${sign(p)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, c) : c);
  return p;
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
    const t = now();
    if (t - p.iat > ABS_TTL || t - p.last > IDLE_TTL || p.ua !== uaHash(req)) return null;
    return p;
  } catch { return null; }
}
