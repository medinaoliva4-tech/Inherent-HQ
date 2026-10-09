// Cifra en reposo los refresh tokens de Google (AES-256-GCM).
import crypto from 'node:crypto';
const key = () => crypto.createHash('sha256').update(`${process.env.SESSION_SECRET}:vault`).digest();
export function seal(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64url')).join('.');
}
export function open(sealed) {
  const [iv, tag, enc] = String(sealed).split('.').map((s) => Buffer.from(s, 'base64url'));
  const d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}
