// API real + PGlite efímero: sin credenciales, red ni base de desarrollo.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-s0-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com';
globalThis.fetch = async () => { throw new Error('S0 no permite red'); };
const db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js');
const { forgetViews, effective, permiteArea } = await import('../api/_lib/access.js');
const { leer } = await import('../api/_lib/leer.js');
const api = (await import('../api/index.js')).default;
const email = (role) => `${role}@inherentglobal.com`;
let total = 0;
const test = async (name, f) => { await f(); total++; console.log('✓', name); };
async function request(role, route, method = 'GET', body = {}) {
  const headers = { host: 'localhost', 'x-ceoos': '1' }, jar = new Map();
  const res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(data) { this.data = data; } };
  const req = { url: `/api/${route}`, method, headers, body };
  session.issue(req, res, { email: email(role) }); headers.cookie = jar.get('Set-Cookie').split(';')[0];
  await api(req, res); return { status: res.statusCode, data: res.data };
}
const altered = { views: Object.fromEntries(['coo', 'team'].map((r) => [r, { finanzas: 'edita', content: 'edita', library: 'edita', operations: 'edita', clients: 'edita' }])), scope: { team: 'asignados' } };
const financeColls = ['finance', 'invoices', 'rates', 'packages', 'bundles', 'payroll', 'bank_moves', 'cost_recipes', 'costos_produccion'];
for (const role of ['ceo', 'coo', 'team', 'client']) await db.create('team', { role, roles: [role], client_slug: role === 'client' ? 'alpha' : '' }, 'fixture', email(role));
await db.create('settings', altered, 'fixture', 'role_views'); forgetViews();
await db.create('projects', { client_slug: 'alpha', people: [email('team')] }, 'fixture', 'project-alpha');
await db.create('settings', { url: '' }, 'fixture', 'finance_sheet'); await db.create('settings', { margin: 0.4 }, 'fixture', 'pricing');
for (const coll of financeColls) await db.create(coll, { marker: `private-${coll}` }, 'fixture', `row-${coll}`);
for (const [id, data] of Object.entries({ alpha: { cliente: 'alpha' }, beta: { cliente: 'beta' }, global: { cliente: '' }, personal: { cliente: 'personal' }, finance: { area: 'finance' } })) await db.create('area_notes', { area: 'strategy', titulo: id, ...data }, 'fixture', `note-${id}`);
for (const [id, profile] of [['ads-alpha-tabla', 'alpha'], ['refs-alpha', 'alpha'], ['refs-beta', 'beta'], ['refs-personal', 'personal']]) await db.create('sources', { profile, por_dias: { 30: { gasto: 900 } } }, 'fixture', id);
await test('CEO conserva Finance', async () => { for (const coll of financeColls) assert.equal((await request('ceo', `db/${coll}`)).status, 200, coll); assert.equal((await request('ceo', 'finance/sheet')).status, 200); });
await test('COO/team/client denegados en todas las rutas Finance aun con matriz adulterada', async () => {
  for (const role of ['coo', 'team', 'client']) {
    for (const coll of financeColls) for (const [method, route] of [['GET', `db/${coll}`], ['GET', `db/${coll}/row-${coll}`], ['POST', `db/${coll}`], ['PUT', `db/${coll}/row-${coll}`], ['DELETE', `db/${coll}/row-${coll}`]]) assert.equal((await request(role, route, method, { v: 1 })).status, 403, `${role} ${method} ${route}`);
    for (const [method, route] of [['GET', 'finance/sheet'], ['PUT', 'finance/sheet'], ['POST', 'finance/sheet'], ['POST', 'finance/cobros'], ['POST', 'finance/pagada/x'], ['POST', 'finance/banco'], ['POST', 'finance/cruce'], ['GET', 'repo/economia']]) assert.equal((await request(role, route, method)).status, 403, `${role} ${method} ${route}`);
  }
});
await test('una lectura Clients no toma prestada la escritura Finance heredada', () => {
  const legacy = { role: 'coo', areas: ['clients', 'finanzas'], views: { clients: 'completo', finanzas: 'edita' } };
  assert.equal(['clients', 'finanzas'].some((a) => permiteArea(legacy, a)), true);
  assert.equal(['clients', 'finanzas'].some((a) => permiteArea(legacy, a, { write: true })), false);
  assert.equal(permiteArea({ ...legacy, role: 'ceo' }, 'finanzas', { write: true }), true);
});
await test('settings oculta links y márgenes Finance', async () => {
  for (const role of ['coo', 'team']) { const r = await request(role, 'db/settings'); assert.equal(r.status, 200); assert.equal(r.data.items.some((d) => ['finance_sheet', 'pricing'].includes(d.id)), false); assert.equal((await request(role, 'db/settings/finance_sheet')).status, 404); }
});
await test('area_notes aísla marcas y oculta personal/Finance', async () => {
  const r = await request('team', 'db/area_notes'); assert.equal(r.status, 200); assert.deepEqual(r.data.items.map((d) => d.id).sort(), ['note-alpha', 'note-global']);
  for (const id of ['beta', 'personal', 'finance']) assert.equal((await request('team', `db/area_notes/note-${id}`)).status, 404);
  assert.equal((await request('coo', 'db/area_notes/note-personal')).status, 404);
});
await test('no crea, mueve, modifica ni borra documentos fuera de marca', async () => {
  for (const [coll, id, field] of [['area_notes', 'note-beta', 'cliente'], ['sources', 'refs-beta', 'profile']]) {
    assert.equal((await request('team', `db/${coll}`, 'POST', { id: 'new-forbidden', [field]: 'beta' })).status, 403);
    assert.equal((await request('team', `db/${coll}/${id}`, 'PUT', { v: 1, [field]: 'alpha' })).status, 404);
    assert.equal((await request('team', `db/${coll}/${id}`, 'DELETE')).status, 404);
  }
  assert.equal((await request('team', 'db/area_notes/note-alpha', 'PUT', { v: 1, cliente: 'beta' })).status, 403);
  assert.equal((await request('team', 'db/sources/refs-alpha', 'PUT', { v: 1, profile: 'beta' })).status, 403);
});
await test('sources no filtra caché de gastos a COO/team', async () => {
  for (const role of ['coo', 'team']) { const r = await request(role, 'db/sources'); assert.equal(r.status, 200); assert.equal(r.data.items.some((d) => d.id === 'ads-alpha-tabla'), false); assert.equal((await request(role, 'db/sources/ads-alpha-tabla')).status, 404); }
  assert.equal((await request('ceo', 'db/sources/ads-alpha-tabla')).status, 200);
});
await test('lectura compartida con indicadores y MCP conserva filtros', async () => {
  const u = effective({ email: email('team'), role: 'team', roles: ['team'] }, altered);
  assert.deepEqual((await leer(u, 'area_notes')).map((d) => d.id).sort(), ['note-alpha', 'note-global']); assert.deepEqual((await leer(u, 'sources')).map((d) => d.id), ['refs-alpha']);
  assert.deepEqual(await leer({ ...u, areas: [...u.areas, 'finanzas'], views: { ...u.views, finanzas: 'edita' } }, 'invoices'), []);
});
console.log(`\n${total} pruebas S0 pasaron (API real, PGlite, sin red).`);
fs.rmSync(tmp, { recursive: true, force: true });
