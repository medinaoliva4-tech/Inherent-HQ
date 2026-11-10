import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { UserRecord } from './config.js';

const digest = (s: string) => createHash('sha256').update(s).digest();

export const COOKIE = 'codeos_token';
/** Token guardado en la cookie de acceso (HttpOnly) que pone /entrar. */
export function cookieToken(req: IncomingMessage): string | null {
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`).exec(req.headers.cookie ?? '');
  try { return m ? decodeURIComponent(m[1]!) : null; } catch { return null; }
}

/** Identifica al usuario por `Authorization: Bearer <token>` comparando hashes en tiempo constante. */
export function makeAuthenticator(users: UserRecord[]) {
  const table = users.map((u) => ({ u, d: Buffer.from(u.tokenHash, 'hex') }));
  return (req: IncomingMessage): UserRecord | null => {
    const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? '');
    const token = m ? m[1]!.trim() : cookieToken(req);
    if (!token) return null;
    const d = digest(token);
    let found: UserRecord | null = null;
    for (const t of table) if (timingSafeEqual(t.d, d)) found = t.u;
    return found;
  };
}

/** ¿Este usuario puede usar este modelo/nivel? */
export function modelAllowed(u: UserRecord, model: string): boolean {
  return u.levels.includes(model) || u.modelPrefixes.some((p) => model.startsWith(p));
}
