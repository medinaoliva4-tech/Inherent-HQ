import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { UserRecord } from './config.js';
import { verificar } from './pase.js';

const digest = (s: string) => createHash('sha256').update(s).digest();

export const COOKIE = 'codeos_token';
/** Token guardado en la cookie de acceso (HttpOnly) que pone /entrar. */
export function cookieToken(req: IncomingMessage): string | null {
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`).exec(req.headers.cookie ?? '');
  try { return m ? decodeURIComponent(m[1]!) : null; } catch { return null; }
}

/**
 * Identifica al usuario. Acepta, en este orden: `Authorization: Bearer` (token del puente o, con secreto configurado,
 * el pase del OS), `?pase=` (WebSocket/EventSource, que no pueden poner cabeceras) y la cookie (token o sesión firmada).
 */
export function makeAuthenticator(users: UserRecord[], secret?: string) {
  const table = users.map((u) => ({ u, d: Buffer.from(u.tokenHash, 'hex') }));
  const porToken = (token: string): UserRecord | null => {
    const d = digest(token);
    let found: UserRecord | null = null;
    for (const t of table) if (timingSafeEqual(t.d, d)) found = t.u;
    return found;
  };
  const porCorreo = (e: string) => users.find((u) => u.emails.includes(e.toLowerCase())) ?? null;
  const esJwt = (t: string) => t.split('.').length === 3;
  return (req: IncomingMessage): UserRecord | null => {
    const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? '');
    if (m) { const t = m[1]!.trim(); if (esJwt(t)) { const c = secret ? verificar(secret, t, 'pase') : null; return c ? porCorreo(c.sub) : null; } return porToken(t); }
    const q = new URL(req.url ?? '/', 'http://x').searchParams.get('pase');
    if (q) { const c = secret ? verificar(secret, q, 'pase') : null; return c ? porCorreo(c.sub) : null; }
    const ck = cookieToken(req);
    if (ck) { if (esJwt(ck)) { const c = secret ? verificar(secret, ck, 'sesion') : null; return c ? porCorreo(c.sub) : null; } return porToken(ck); }
    return null;
  };
}

/** ¿La petición trae alguna credencial (aunque sea mala)? Sirve para contar intentos fallidos. */
export function traeCredencial(req: IncomingMessage): boolean {
  return !!req.headers.authorization || !!cookieToken(req) || new URL(req.url ?? '/', 'http://x').searchParams.has('pase');
}

/** ¿Este usuario puede usar este modelo/nivel? */
export function modelAllowed(u: UserRecord, model: string): boolean {
  return u.levels.includes(model) || u.modelPrefixes.some((p) => model.startsWith(p));
}
