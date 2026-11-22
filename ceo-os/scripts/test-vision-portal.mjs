// M3 · aprobación del cliente por enlace de un solo uso: emitir, ver (lista permitida), responder una vez, caducar, revocar, versión y cliente.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-portal-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com'; process.env.APP_URL = 'https://os.example';
const P = await import('../api/_lib/portal-aprobaciones.js'), db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js'), api = (await import('../api/index.js')).default;
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };
const ceo = { email: 'ceo@x.co', role: 'ceo' }, coo = { email: 'coo@x.co', role: 'coo' }, team = { email: 't@x.co', role: 'team' };
const base = { client_slug: 'alpha', tool: 'moodboard-studio', ws: 'creative', pestana: 'concepts', titulo: 'Moodboard de diciembre', version: 1, aprobado: { version: 1 }, entradas: [], historial: [],
  contenido: { costo: 'Q99,999', nota_interna: 'el cliente es difícil', margen: '71%' }, criterios: { cumple: [], falta: [] } };
const nueva = (o = {}) => db.create('deliverables', { ...base, estado: 'Aprobado', ...o }, 'fixture');

await test('emitir: solo CEO/COO y solo sobre lo que el equipo ya aprobó por dentro', async () => {
  const d = await nueva(), borrador = await nueva({ estado: 'En revisión' }), archivada = await nueva({ archivado: true });
  await assert.rejects(P.emitir(team, d), (e) => e.status === 403);
  await assert.rejects(P.emitir(coo, borrador), (e) => e.code === 'SIN_QA'); await assert.rejects(P.emitir(coo, archivada), (e) => e.code === 'ARCHIVADO');
  const { token } = await P.emitir(coo, d); assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(!(await db.get('portal_links', token)), 'en la base solo está el hash');
});
await test('ver: una lista permitida (título, herramienta, versión, marca) y NUNCA costos, notas ni contenido', async () => {
  const d = await nueva(), { token } = await P.emitir(ceo, d), v = await P.ver(token);
  assert.deepEqual(Object.keys(v).sort(), ['acciones', 'expira', 'herramienta', 'marca', 'titulo', 'version']);
  assert.equal(v.titulo, 'Moodboard de diciembre'); assert.equal(v.marca, 'alpha');
  assert.doesNotMatch(JSON.stringify(v), /Q99|difícil|71%|costo|margen|nota_interna/i);
});
await test('responder gasta el enlace: aprobar una vez; repetir o cambiar de opinión → 410', async () => {
  const d = await nueva(), { token } = await P.emitir(ceo, d);
  const r = await P.responder(token, { accion: 'aprobar' }); assert.equal(r.ok, true); assert.match(r.mensaje, /aprobado/i);
  for (const acc of ['aprobar', 'cambios']) await assert.rejects(P.responder(token, { accion: acc, nota: 'x' }), (e) => e.status === 410 && e.code === 'USADO');
  await assert.rejects(P.ver(token), (e) => e.status === 410);
  const cur = await db.get('deliverables', d.id); assert.equal(cur.aprobacion_cliente.accion, 'aprobar'); assert.equal(cur.estado, 'Aprobado', 'no mueve el estado interno');
  assert.equal(cur.historial.at(-1).accion, 'cliente-aprueba'); assert.match(cur.historial.at(-1).por, /^cliente:alpha$/);
});
await test('pedir cambios exige decir qué; la nota queda en el entregable', async () => {
  const d = await nueva(), { token } = await P.emitir(ceo, d);
  await assert.rejects(P.responder(token, { accion: 'cambios', nota: '   ' }), (e) => e.code === 'NOTA'); await assert.rejects(P.responder(token, { accion: 'borrar' }), (e) => e.code === 'ACCION');
  await P.responder(token, { accion: 'cambios', nota: 'Más aire en el logo' }); assert.equal((await db.get('deliverables', d.id)).aprobacion_cliente.nota, 'Más aire en el logo');
});
await test('dos toques a la vez: gana uno solo (CAS)', async () => {
  const d = await nueva(), { token } = await P.emitir(ceo, d);
  const r = await Promise.allSettled([P.responder(token, { accion: 'aprobar' }), P.responder(token, { accion: 'aprobar' }), P.responder(token, { accion: 'aprobar' })]);
  assert.equal(r.filter((x) => x.status === 'fulfilled').length, 1); assert.equal((await db.get('deliverables', d.id)).historial.filter((h) => h.accion === 'cliente-aprueba').length, 1);
});
await test('vence: pasado su plazo, 410; y revocar lo cancela', async () => {
  const d = await nueva(), { token } = await P.emitir(ceo, d, { ttlDias: 1, ahoraMs: Date.now() - 2 * 864e5 });
  await assert.rejects(P.ver(token), (e) => e.status === 410 && e.code === 'VENCIDO');
  const d2 = await nueva(), l = await P.emitir(ceo, d2); assert.equal(await P.revocar(ceo, d2.id), 1);
  await assert.rejects(P.responder(l.token, { accion: 'aprobar' }), (e) => e.code === 'REVOCADO'); await assert.rejects(P.revocar(team, d2.id), (e) => e.status === 403);
});
await test('si la pieza cambió de versión o de marca, el enlace deja de valer (409 / 403)', async () => {
  const d = await nueva(), { token } = await P.emitir(ceo, d), cur = await db.get('deliverables', d.id);
  await db.update('deliverables', d.id, { ...cur, version: 2 }, cur.v, 'test');
  await assert.rejects(P.ver(token), (e) => e.status === 409 && e.code === 'CAMBIO');
  const d2 = await nueva(), l2 = await P.emitir(ceo, d2), c2 = await db.get('deliverables', d2.id);
  await db.update('deliverables', d2.id, { ...c2, client_slug: 'beta' }, c2.v, 'test');
  await assert.rejects(P.ver(l2.token), (e) => e.status === 403 && e.code === 'CLIENTE');
});
await test('un enlace de un cliente no abre la pieza de otro; token inventado o mal formado: el mismo «no sirve»', async () => {
  const a = await nueva({ client_slug: 'alpha' }), b = await nueva({ client_slug: 'beta', titulo: 'Secreto de Beta' }), la = await P.emitir(ceo, a), lb = await P.emitir(ceo, b);
  assert.equal((await P.ver(la.token)).titulo, 'Moodboard de diciembre'); assert.equal((await P.ver(lb.token)).titulo, 'Secreto de Beta'); assert.equal((await P.ver(la.token)).marca, 'alpha');
  for (const mal of ['x'.repeat(43), 'corto', '', undefined, '../../etc/passwd']) await assert.rejects(P.ver(mal), (e) => e.status === 404 && e.message === 'Este enlace no sirve.');
});

// ---------- Las rutas ----------
const email = (r) => `${r}@inherentglobal.com`;
async function req(role, route, method = 'POST', b = {}, headers = { 'x-ceoos': '1' }) {
  const h = { host: 'localhost', ...headers }, jar = new Map(), res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, write() {}, end() {} };
  const r = { url: `/api/${route}`, method, headers: h, body: b, query: {}, params: {} };
  if (role) { session.issue(r, res, { email: email(role) }); h.cookie = jar.get('Set-Cookie').split(';')[0]; }
  await api(r, res); return { status: res.statusCode, data: res.data };
}
fs.mkdirSync(path.join(process.env.LOCAL_REPO, 'clients/alpha/00-onboarding'), { recursive: true });
fs.writeFileSync(path.join(process.env.LOCAL_REPO, 'clients/alpha/00-onboarding/plan-contratado.md'), '# Ficha — Alpha\n\n| Campo | Valor |\n|---|---|\n| Plan | Brand Growth |\n\n## Qué incluye\n\n| Entregable | Cantidad |\n|---|---|\n| Volumen | 2 piezas |\n');
for (const r of ['ceo', 'coo', 'team']) await db.create('team', { role: r, roles: [r] }, 'fixture', email(r));
await db.create('settings', { views: { coo: { content: 'edita' }, team: { content: 'edita' } } }, 'fixture', 'role_views');
await test('rutas: el equipo emite el enlace (una vez, con la URL del OS) y el cliente responde SIN sesión', async () => {
  const d = await nueva(), e = await req('coo', `entregables/${d.id}/enlace`); assert.equal(e.status, 200); assert.match(e.data.url, /^https:\/\/os\.example\/aprobar\.html#t=[A-Za-z0-9_-]{43}$/);
  const token = e.data.url.split('#t=')[1];
  assert.equal((await req('team', `entregables/${d.id}/enlace`)).status, 403);
  const v = await req(null, 'portal/aprobacion/ver', 'POST', { token }); assert.equal(v.status, 200); assert.equal(v.data.titulo, 'Moodboard de diciembre');
  assert.equal((await req(null, 'portal/aprobacion/ver', 'POST', { token }, {})).status, 403, 'sin el encabezado propio no responde');
  assert.equal((await req(null, 'portal/aprobacion/responder', 'POST', { token, accion: 'aprobar' })).status, 200);
  const otra = await req(null, 'portal/aprobacion/responder', 'POST', { token, accion: 'aprobar' }); assert.equal(otra.status, 410); assert.equal(otra.data.code, 'USADO');
});
await test('rutas: revocar desde adentro y la colección del portal no se toca por /api/db', async () => {
  const d = await nueva(), e = await req('ceo', `entregables/${d.id}/enlace`), token = e.data.url.split('#t=')[1];
  assert.equal((await req('ceo', `entregables/${d.id}/enlaces/revocar`)).data.revocados, 1); assert.equal((await req(null, 'portal/aprobacion/ver', 'POST', { token })).status, 410);
  for (const m of ['GET', 'POST']) assert.ok([403, 404].includes((await req('ceo', 'db/portal_links', m, { x: 1 })).status));
  assert.doesNotMatch(JSON.stringify((await req(null, 'portal/aprobacion/ver', 'POST', { token })).data), /Q99|margen/);
});
console.log(`${count} pruebas del portal OK`);
