// B1 · el hilo del cliente: lógica pura (nodos, aristas, revisión de descendientes, traza al ICP) y la ruta GET /api/hilo.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-hilo-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com';
const { construirHilo, descendientes, traza, hayCiclo, resumen, TOOL_ICP } = await import('../public/js/hilo.js');
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };

const d = (id, tool, estado, v, entradas = [], extra = {}) => ({ id, tool, ws: 'strategy', titulo: id, client_slug: 'alpha', estado, version: v, aprobado: ['Aprobado', 'Entregado'].includes(estado) ? { version: v } : null, entradas, ...extra });
const ent = (id, version) => ({ deliverable_id: id, version, tool: 'x' });

await test('un hilo sano: ICP → oferta → brief; todo aprobado, nada a revisar y todo llega al ICP', () => {
  const h = construirHilo([d('icp', TOOL_ICP, 'Aprobado', 1), d('oferta', 'offer-architect', 'Aprobado', 1, [ent('icp', 1)]), d('brief', 'creative-brief', 'Aprobado', 1, [ent('oferta', 1)])], { slug: 'alpha' });
  assert.equal(h.nodes.length, 3); assert.equal(h.edges.length, 2);
  assert.ok(h.nodes.every((n) => !n.revisar && n.llegaAlICP && n.conocimiento === 'aprobado'));
  assert.deepEqual(resumen(h), { total: 3, aprobados: 3, hipotesis: 0, revisar: 0, sinICP: 0 });
});
await test('hipótesis y aprobado se ven distinto: un Borrador es hipótesis', () => {
  const h = construirHilo([d('icp', TOOL_ICP, 'Borrador', 1)], { slug: 'alpha' });
  assert.equal(h.nodes[0].conocimiento, 'hipotesis'); assert.equal(h.nodes[0].aprobadaV, null);
});
await test('editar un ancestro marca a TODOS sus descendientes, con la razón, y a nadie más', () => {
  const items = [d('icp', TOOL_ICP, 'Aprobado', 2), d('oferta', 'offer-architect', 'Aprobado', 1, [ent('icp', 1)]), d('brief', 'creative-brief', 'Aprobado', 1, [ent('oferta', 1)]),
    d('otro', 'market-explorer', 'Aprobado', 1, [])];
  const h = construirHilo(items, { slug: 'alpha' }), por = Object.fromEntries(h.nodes.map((n) => [n.id, n]));
  assert.ok(por.oferta.revisar && /v1 → v2/.test(por.oferta.razon));
  assert.ok(por.brief.revisar && /a revisar/.test(por.brief.razon));
  assert.ok(!por.icp.revisar && !por.otro.revisar);
  assert.deepEqual(descendientes(h, 'icp').sort(), ['brief', 'oferta']);
});
await test('si el origen deja de estar aprobado, lo de abajo se marca', () => {
  const h = construirHilo([d('icp', TOOL_ICP, 'Borrador', 3), d('oferta', 'offer-architect', 'Aprobado', 1, [ent('icp', 1)])], { slug: 'alpha' });
  assert.match(h.nodes.find((n) => n.id === 'oferta').razon, /ya no está aprobado/);
});
await test('un ciclo no cuelga ni marca: se reporta y se corta', () => {
  const h = construirHilo([d('a', 'x', 'Aprobado', 1, [ent('b', 1)]), d('b', 'x', 'Aprobado', 1, [ent('a', 1)])], { slug: 'alpha' });
  assert.equal(h.ciclo, true); assert.ok(hayCiclo(['a', 'b'], h.edges));
});
await test('nunca cruza marcas: lo de otro cliente se descarta y una entrada a otra marca queda huérfana', () => {
  const h = construirHilo([d('icp', TOOL_ICP, 'Aprobado', 1, [], { client_slug: 'beta' }), d('oferta', 'offer-architect', 'Aprobado', 1, [ent('icp', 1)])], { slug: 'alpha' });
  assert.equal(h.nodes.length, 1); assert.equal(h.edges.length, 0); assert.equal(h.huerfanas.length, 1);
  assert.equal(h.nodes[0].llegaAlICP, false);
});
await test('la traza va del ICP a la pieza; sin ICP aprobado dice qué falta', () => {
  const h = construirHilo([d('icp', TOOL_ICP, 'Aprobado', 1), d('oferta', 'offer-architect', 'Aprobado', 1, [ent('icp', 1)]), d('brief', 'creative-brief', 'Aprobado', 1, [ent('oferta', 1)]), d('suelta', 'creative-brief', 'Borrador', 1)], { slug: 'alpha' });
  const t = traza(h, 'brief'); assert.ok(t.llega); assert.deepEqual(t.camino.map((n) => n.id), ['icp', 'oferta', 'brief']);
  const s = traza(h, 'suelta'); assert.equal(s.llega, false); assert.match(s.falta, /ICP/);
  assert.equal(traza(h, 'no-existe').llega, false);
});
await test('archivados no cuentan', () => {
  assert.equal(construirHilo([d('icp', TOOL_ICP, 'Aprobado', 1, [], { archivado: true })], { slug: 'alpha' }).nodes.length, 0);
});

// ---------- La ruta ----------
const db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js');
const api = (await import('../api/index.js')).default;
const email = (r) => `${r}@inherentglobal.com`;
async function request(role, route) {
  const headers = { host: 'localhost', 'x-ceoos': '1' }, jar = new Map();
  const res = { statusCode: 200, chunks: '', getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; }, write(c) { this.chunks += c; }, end(c) { if (c) this.chunks += c; } };
  const req = { url: `/api/${route}`, method: 'GET', headers, body: {}, query: Object.fromEntries(new URL(`http://x/${route}`).searchParams) };
  session.issue(req, res, { email: email(role) }); headers.cookie = jar.get('Set-Cookie').split(';')[0];
  await api(req, res); return { status: res.statusCode, data: res.data };
}
for (const r of ['ceo', 'coo']) await db.create('team', { role: r, roles: [r] }, 'fixture', email(r));
await db.create('settings', { views: { coo: { content: 'edita' } } }, 'fixture', 'role_views');
const icp = await db.create('deliverables', d('x', TOOL_ICP, 'Aprobado', 1, [], { id: undefined, ws: 'strategy' }), 'fixture');
const brief = await db.create('deliverables', d('x', 'creative-brief', 'Aprobado', 1, [ent(icp.id, 1)], { id: undefined, ws: 'creative' }), 'fixture');
await test('GET /api/hilo: el CEO ve el hilo completo y la traza de la pieza', async () => {
  const r = await request('ceo', `hilo?slug=alpha&pieza=${brief.id}`);
  assert.equal(r.status, 200); assert.equal(r.data.nodes.length, 2); assert.equal(r.data.edges.length, 1); assert.ok(r.data.traza.llega);
  assert.equal('contenido' in r.data.nodes[0], false, 'el hilo no lleva contenido ni costos');
});
await test('GET /api/hilo: quien no ve Strategy no ve el ICP ni como nodo ni como razón', async () => {
  const r = await request('coo', 'hilo?slug=alpha');
  assert.equal(r.status, 200); assert.deepEqual(r.data.nodes.map((n) => n.id), [brief.id]); assert.equal(r.data.huerfanas.length, 1);
});
await test('GET /api/hilo: sin cliente 400 y marca personal solo del CEO', async () => {
  assert.equal((await request('ceo', 'hilo')).status, 400);
  assert.equal((await request('coo', 'hilo?slug=personal')).status, 404);
});
console.log(`${count} pruebas del hilo OK`);
