import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

const digest = (s: string) => createHash('sha256').update(s).digest();

/** Valida `Authorization: Bearer <token>` contra los tokens de la plataforma, en tiempo constante. */
export function makeAuthenticator(tokens: string[]) {
  const ds = tokens.map(digest);
  return (req: IncomingMessage): boolean => {
    const h = req.headers.authorization ?? '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) return false;
    const d = digest(m[1]!.trim());
    let ok = false;
    for (const t of ds) if (timingSafeEqual(t, d)) ok = true;
    return ok;
  };
}
