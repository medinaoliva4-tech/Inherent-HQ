import { createHmac, timingSafeEqual } from 'node:crypto';

/** JWT HS256 mínimo. `pase` lo emite el OS tras su login (corto); `sesion` lo emite el puente en una cookie (más largo). */
export interface Claims { typ: 'pase' | 'sesion'; sub: string; iat: number; exp: number; aud: 'code-os' }
const b64 = (o: object | Buffer) => Buffer.from(Buffer.isBuffer(o) ? o : JSON.stringify(o)).toString('base64url');

export function firmar(secret: string, c: Omit<Claims, 'aud' | 'iat'> & { iat?: number }): string {
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ aud: 'code-os', iat: Math.floor(Date.now() / 1000), ...c })}`;
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

/** Devuelve las claims si la firma, la audiencia, el tipo y la caducidad son correctos; si no, null. */
export function verificar(secret: string, token: string, typ: Claims['typ'], now = Date.now()): Claims | null {
  const p = token.split('.');
  if (p.length !== 3) return null;
  const esperado = createHmac('sha256', secret).update(`${p[0]}.${p[1]}`).digest();
  const dado = Buffer.from(p[2]!, 'base64url');
  if (dado.length !== esperado.length || !timingSafeEqual(dado, esperado)) return null;
  try {
    const h = JSON.parse(Buffer.from(p[0]!, 'base64url').toString()); const c = JSON.parse(Buffer.from(p[1]!, 'base64url').toString()) as Claims;
    if (h.alg !== 'HS256' || c.aud !== 'code-os' || c.typ !== typ || typeof c.sub !== 'string' || !(c.exp * 1000 > now)) return null;
    if (typ === 'pase' && c.exp - c.iat > 15 * 60) return null; // un pase vive minutos, no horas
    return c;
  } catch { return null; }
}
