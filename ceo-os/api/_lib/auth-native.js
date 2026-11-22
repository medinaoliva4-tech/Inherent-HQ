// Login de la app nativa (cápsula de Apple): Google NO deja iniciar sesión dentro de una web embebida («disallowed_useragent»),
// así que el login corre en el navegador del sistema y vuelve a la app con un CÓDIGO de un solo uso, atado a PKCE:
//   1 · la app genera `verifier` (secreto, solo en la app) y manda `challenge = base64url(sha256(verifier))`;
//   2 · tras el login con Google el servidor NO deja sesión en ese navegador: crea un código (2 min, un uso) y vuelve a la app con inherent://auth?code=…;
//   3 · la app canjea código + verifier por la sesión DENTRO de su web (POST /api/auth/native/exchange). Quien intercepte el código sin el verifier no puede canjearlo.
// El código vive en la base como hash (nunca en claro). Canjear es atómico (CAS): dos canjes a la vez, uno solo gana.
import crypto from 'node:crypto';
import * as db from './db.js';
const COLL = 'native_codes', TTL_MS = 120_000;
const b64 = (buf) => Buffer.from(buf).toString('base64url');
const sha = (s) => crypto.createHash('sha256').update(s).digest();
const fail = (status, code, message) => { throw Object.assign(new Error(message), { status, code }); };
export const retoOk = (c) => /^[A-Za-z0-9_-]{43}$/.test(String(c || ''));
export const verifierOk = (v) => /^[A-Za-z0-9._~-]{43,128}$/.test(String(v || ''));
export const retoDe = (verifier) => b64(sha(verifier));

export async function crear({ email, challenge }) {
  if (!email || !retoOk(challenge)) fail(400, 'RETO', 'Falta el reto de la app');
  const code = b64(crypto.randomBytes(32));
  await db.create(COLL, { email: String(email).toLowerCase(), challenge, exp: Date.now() + TTL_MS, usado: false }, 'auth-native', sha(code).toString('hex'));
  return code;
}
// → el correo de la persona. Cualquier fallo es el mismo mensaje: no dice si el código existió.
export async function canjear({ code, verifier }) {
  const mal = () => fail(401, 'CODIGO', 'El código no sirve o ya venció. Vuelve a entrar.');
  if (!/^[A-Za-z0-9_-]{43}$/.test(String(code || '')) || !verifierOk(verifier)) mal();
  const id = sha(code).toString('hex'), d = await db.get(COLL, id);
  if (!d || d.usado || d.exp < Date.now()) mal();
  const a = Buffer.from(retoDe(verifier)), z = Buffer.from(d.challenge);
  if (a.length !== z.length || !crypto.timingSafeEqual(a, z)) mal();
  const marcado = await db.update(COLL, id, { ...d, usado: true, usado_en: new Date().toISOString() }, d.v, 'auth-native'); // CAS: si otro canjeó primero, null
  if (!marcado) mal();
  return d.email;
}
