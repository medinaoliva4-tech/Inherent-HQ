import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { UserRecord } from './config.js';

const digest = (s: string) => createHash('sha256').update(s).digest();

/** Identifica al usuario por `Authorization: Bearer <token>` comparando hashes en tiempo constante. */
export function makeAuthenticator(users: UserRecord[]) {
  const table = users.map((u) => ({ u, d: Buffer.from(u.tokenHash, 'hex') }));
  return (req: IncomingMessage): UserRecord | null => {
    const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? '');
    if (!m) return null;
    const d = digest(m[1]!.trim());
    let found: UserRecord | null = null;
    for (const t of table) if (timingSafeEqual(t.d, d)) found = t.u;
    return found;
  };
}

/** ¿Este usuario puede usar este modelo/nivel? */
export function modelAllowed(u: UserRecord, model: string): boolean {
  return u.levels.includes(model) || u.modelPrefixes.some((p) => model.startsWith(p));
}
