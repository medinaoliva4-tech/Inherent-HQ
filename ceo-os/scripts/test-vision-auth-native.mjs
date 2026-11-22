// P2 · login de la app nativa: código de un uso + PKCE (api/_lib/auth-native.js) y su canje (POST /api/auth/native/exchange).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-native-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com';
const N = await import('../api/_lib/auth-native.js'), db = await import('../api/_lib/db.js'), api = (await import('../api/index.js')).default;
const { codigoDe, nuevoPar, esNativo } = await import('../public/js/login-nativo.js');
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };
const par = async () => { const v = 'v'.repeat(43); return { verifier: v, challenge: N.retoDe(v) }; };

async function post(route, body, headers = { 'x-ceoos': '1' }) {
  const jar = new Map(), res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, end() {} };
  await api({ url: `/api/${route}`, method: 'POST', headers: { host: 'localhost', ...headers }, body, query: {} }, res);
  return { status: res.statusCode, data: res.data, cookie: jar.get('Set-Cookie') };
}
await db.create('team', { role: 'coo', roles: ['coo'], active: true }, 'fixture', 'coo@inherentglobal.com');
await db.create('team', { role: 'team', roles: ['team'], active: false }, 'fixture', 'baja@inherentglobal.com');

await test('el reto y el verifier tienen forma fija (43 caracteres de base64url)', () => {
  assert.equal(N.retoOk('a'.repeat(43)), true); assert.equal(N.retoOk('a'.repeat(42)), false); assert.equal(N.retoOk('a'.repeat(43) + '!'), false); assert.equal(N.retoOk(undefined), false);
  assert.equal(N.verifierOk('a'.repeat(43)), true); assert.equal(N.verifierOk('a'.repeat(129)), false); assert.equal(N.verifierOk('a b'.repeat(20)), false);
  assert.equal(N.retoDe('v'.repeat(43)).length, 43);
});
await test('crear + canjear: devuelve el correo y el código queda guardado como hash, nunca en claro', async () => {
  const { verifier, challenge } = await par(), code = await N.crear({ email: 'COO@inherentglobal.com', challenge });
  assert.equal(code.length, 43); assert.ok(!(await db.get('native_codes', code)), 'el id no es el código');
  assert.equal(await N.canjear({ code, verifier }), 'coo@inherentglobal.com');
});
await test('un código se canjea UNA vez: el segundo intento falla igual que un código que nunca existió', async () => {
  const { verifier, challenge } = await par(), code = await N.crear({ email: 'coo@inherentglobal.com', challenge });
  await N.canjear({ code, verifier });
  for (const c of [code, 'x'.repeat(43)]) await assert.rejects(N.canjear({ code: c, verifier }), (e) => e.status === 401 && e.code === 'CODIGO' && /no sirve o ya venció/.test(e.message));
});
await test('quien se lleve el código sin el verifier no puede canjearlo (PKCE)', async () => {
  const { challenge } = await par(), code = await N.crear({ email: 'coo@inherentglobal.com', challenge });
  await assert.rejects(N.canjear({ code, verifier: 'z'.repeat(43) }), (e) => e.code === 'CODIGO');
  await assert.rejects(N.canjear({ code, verifier: 'corto' }), (e) => e.code === 'CODIGO');
  assert.equal(await N.canjear({ code, verifier: 'v'.repeat(43) }), 'coo@inherentglobal.com', 'el verifier correcto sigue sirviendo: el intento malo no lo gastó');
});
await test('vence a los 2 minutos', async () => {
  const { verifier, challenge } = await par(), code = await N.crear({ email: 'coo@inherentglobal.com', challenge });
  const id = (await import('node:crypto')).createHash('sha256').update(code).digest('hex'), d = await db.get('native_codes', id);
  await db.update('native_codes', id, { ...d, exp: Date.now() - 1 }, d.v, 'test');
  await assert.rejects(N.canjear({ code, verifier }), (e) => e.code === 'CODIGO');
});
await test('dos canjes a la vez: solo uno gana (CAS)', async () => {
  const { verifier, challenge } = await par(), code = await N.crear({ email: 'coo@inherentglobal.com', challenge });
  const r = await Promise.allSettled([N.canjear({ code, verifier }), N.canjear({ code, verifier }), N.canjear({ code, verifier })]);
  assert.equal(r.filter((x) => x.status === 'fulfilled').length, 1);
});
await test('crear sin reto válido se rechaza', async () => {
  await assert.rejects(N.crear({ email: 'a@b.c', challenge: 'corto' }), (e) => e.code === 'RETO'); await assert.rejects(N.crear({ email: '', challenge: 'a'.repeat(43) }), (e) => e.code === 'RETO');
});
await test('POST /api/auth/native/exchange: pone la sesión; sin el encabezado propio, 403; con verifier malo, 401 sin dar pistas', async () => {
  const { verifier, challenge } = await par(), code = await N.crear({ email: 'coo@inherentglobal.com', challenge });
  assert.equal((await post('auth/native/exchange', { code, verifier }, {})).status, 403);
  const mal = await post('auth/native/exchange', { code, verifier: 'z'.repeat(43) }); assert.equal(mal.status, 401); assert.equal(mal.data.code, 'CODIGO'); assert.equal(mal.cookie, undefined);
  const ok = await post('auth/native/exchange', { code, verifier }); assert.equal(ok.status, 200); assert.equal(ok.data.ok, true); assert.match(String(ok.cookie), /ceoos=.*HttpOnly.*Secure.*SameSite=Lax/);
  assert.equal((await post('auth/native/exchange', { code, verifier })).status, 401, 'y no se puede repetir');
});
await test('un usuario dado de baja no entra aunque tenga un código válido', async () => {
  const { verifier, challenge } = await par(), code = await N.crear({ email: 'baja@inherentglobal.com', challenge });
  const r = await post('auth/native/exchange', { code, verifier }); assert.equal(r.status, 403); assert.equal(r.cookie, undefined);
});
await test('el cliente: solo acepta inherent://auth?code=<43>; todo lo demás se ignora; fuera de la app no es nativo', async () => {
  const c = 'a'.repeat(43);
  assert.equal(codigoDe(`inherent://auth?code=${c}`), c); assert.equal(codigoDe(`inherent://auth?code=${c}&x=1`), c);
  for (const mala of [`https://evil.example/?code=${c}`, `inherent://otra?code=${c}`, 'inherent://auth?code=corto', `inherent://auth?code=${c}!`, '', undefined]) assert.equal(codigoDe(mala), '');
  assert.equal(esNativo(), false);
  const p = await (async () => { globalThis.crypto ||= (await import('node:crypto')).webcrypto; return nuevoPar(); })(); assert.equal(p.verifier.length, 43); assert.equal(p.challenge, N.retoDe(p.verifier), 'el cliente y el servidor calculan el mismo reto');
});
console.log(`${count} pruebas del login nativo OK`);
