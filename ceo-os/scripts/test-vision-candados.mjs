import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-s1-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com';
const db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js');
const { seal } = await import('../api/_lib/vault.js');
const { effective } = await import('../api/_lib/access.js');
const { proponerAccion, ejecutarAccion } = await import('../api/_lib/external-actions.js');
const { validarContenido } = await import('../api/_lib/content-policy.js');
const { run } = await import('../api/_lib/mcp.js');
const api = (await import('../api/index.js')).default;
const email = (r) => `${r}@inherentglobal.com`;
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };
async function request(role, route, method = 'GET', body = {}) {
  const headers = { host: 'localhost', 'x-ceoos': '1' }, jar = new Map();
  const res = { statusCode: 200, chunks: '', getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(d) { this.data = d; }, writeHead(n) { this.statusCode = n; return this; }, write(s) { this.chunks += s; }, end() {} };
  const req = { url: `/api/${route}`, method, headers, body };
  session.issue(req, res, { email: email(role) }); headers.cookie = jar.get('Set-Cookie').split(';')[0];
  await api(req, res); return { status: res.statusCode, data: res.data, chunks: res.chunks };
}
for (const r of ['ceo', 'coo']) await db.create('team', { role: r, roles: [r] }, 'fixture', email(r));
await db.create('settings', { views: { coo: { content: 'edita' } } }, 'fixture', 'role_views');
const ceo = effective({ email: email('ceo'), role: 'ceo', roles: ['ceo'] }), coo = effective({ email: email('coo'), role: 'coo', roles: ['coo'] }, { views: { coo: { content: 'edita' } } });
function file(rel, text) { const p = path.join(process.env.LOCAL_REPO, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); }
file('clients/alpha/00-onboarding/plan-contratado.md', '# Ficha — Alpha\n\n| Campo | Valor |\n|---|---|\n| Plan | Brand Growth |\n\n## Qué incluye\n\n| Entregable | Cantidad |\n|---|---|\n| Volumen | 2 piezas |\n');
fs.mkdirSync(path.join(process.env.LOCAL_REPO, 'clients/beta'), { recursive: true });
const icp = await db.create('deliverables', { client_slug: 'alpha', tool: 'customer-bullseye', titulo: 'ICP aprobado', estado: 'Aprobado', version: 1, aprobado: { version: 1 }, entradas: [] }, 'fixture', 'icp-alpha');
const brief = await db.create('deliverables', { client_slug: 'alpha', tool: 'creative-brief', titulo: 'Brief aprobado', estado: 'Aprobado', version: 1, aprobado: { version: 1 }, entradas: [{ deliverable_id: icp.id, version: 1 }] }, 'fixture', 'brief-alpha');
const refs = [{ id: brief.id, version: 1 }], post = { kind: 'post', profile: 'alpha', title: 'Prueba', date: '2026-11-10', status: 'Idea', viene_de: refs };
async function mcp(name, args, u = coo) { const r = await run(u, { id: 1, method: 'tools/call', params: { name, arguments: args } }); return r.json.result; }
await test('API y MCP bloquean falta de ficha, origen y brief con la misma política', async () => {
  assert.equal((await request('coo', 'db/content', 'POST', { ...post, profile: 'beta' })).data.code, 'SIN_FICHA');
  assert.match((await mcp('crear_idea', { perfil: 'beta', titulo: 'B', formato: 'Reel' })).content[0].text, /ficha/);
  assert.equal((await request('coo', 'db/content', 'POST', { ...post, viene_de: [] })).data.code, 'SIN_ORIGEN');
  assert.match((await mcp('agendar', { perfil: 'alpha', titulo: 'A', calendario: 'publicacion', fecha: post.date })).content[0].text, /versión aprobada/);
  assert.equal((await request('coo', 'db/content', 'POST', post)).data.code, 'SIN_BRIEF');
  assert.match((await mcp('agendar', { perfil: 'alpha', titulo: 'A', calendario: 'publicacion', fecha: post.date, viene_de: refs })).content[0].text, /brief/);
});
file('clients/alpha/04-contenido/2026-11/brief-del-ciclo.md', '# Brief de prueba');
await test('API y MCP agendan con cadena ICP y brief reales; el techo de ficha bloquea la tercera', async () => {
  assert.equal((await request('coo', 'db/content', 'POST', post)).status, 200);
  const r = await mcp('agendar', { perfil: 'alpha', titulo: 'B', calendario: 'publicacion', fecha: post.date, viene_de: refs }); assert.equal(r.isError, undefined);
  const third = await request('coo', 'db/content', 'POST', post); assert.equal(third.data.code, 'FUERA_DEL_ALCANCE');
  assert.match((await mcp('crear_idea', { perfil: 'alpha', titulo: 'C', formato: 'Reel', fecha: post.date, viene_de: refs })).content[0].text, /Fuera de ficha/);
});
await test('día 11 común: API/MCP deniegan COO y aceptan excepción CEO', async () => {
  const shoot = { ...post, kind: 'shoot', date: '2026-11-12' };
  assert.equal((await request('coo', 'db/content', 'POST', shoot)).data.code, 'DIA_11');
  assert.match((await mcp('agendar', { perfil: 'alpha', titulo: 'Set', calendario: 'grabacion', fecha: shoot.date, viene_de: refs })).content[0].text, /día 11/);
  assert.equal((await request('ceo', 'db/content', 'POST', shoot)).status, 200);
});
await test('Plan→Ideas no evade el techo y rechaza todo el lote antes de escribir', async () => {
  file('clients/alpha/04-contenido/2026-12/brief-del-ciclo.md', '# Brief de prueba');
  await db.create('strategy', { slug: 'alpha', aprobado: { por: ceo.email } }, 'fixture', 'alpha--viva');
  await db.create('plans', { profile: 'alpha', mes: '2026-12', slots: [1, 2, 3].map((n) => ({ id: `MK-${n}`, semana: 1, formato: 'Reel', canal: 'Instagram', objetivo: 'Demo' })) }, 'fixture', 'alpha--2026-12');
  const r = await request('coo', 'plan/alpha/2026-12/a-creatividad', 'POST', { viene_de: refs });
  assert.equal(r.data.code, 'FUERA_DEL_ALCANCE');
  assert.equal((await db.list('content')).filter((d) => d.slot?.plan === 'alpha--2026-12').length, 0);
});
await test('origen cruzado, versión vieja y ciclo de dependencias no habilitan producción', async () => {
  const d = await db.get('deliverables', brief.id); await db.update('deliverables', brief.id, { ...d, entradas: [{ deliverable_id: brief.id, version: 1 }] }, d.v, 'fixture');
  assert.equal((await validarContenido(coo, post)).code, 'SIN_ORIGEN');
  const now = await db.get('deliverables', brief.id); await db.update('deliverables', brief.id, { ...now, entradas: [{ deliverable_id: icp.id, version: 1 }], version: 2, aprobado: { version: 2 } }, now.v, 'fixture');
  assert.equal((await validarContenido(coo, post)).code, 'SIN_ORIGEN');
  await db.create('deliverables', { ...brief, client_slug: 'beta' }, 'fixture', 'cross-beta');
  assert.equal((await validarContenido(coo, { ...post, viene_de: [{ id: 'cross-beta', version: 1 }] })).code, 'SIN_ORIGEN');
});
let externalCalls = 0;
const tool = { conector: 'notion', tool: { name: 'publish', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'], additionalProperties: false } }, cx: { token: 'fake' }, sesion: 'mock' };
const adapters = { catalogo: async () => [tool], ejecutar: async () => { externalCalls++; return { texto: 'Mock confirmado', error: false }; } };
await test('propuesta cifrada no ejecuta; aprobación hash/versión y actor incorrectos son rechazados', async () => {
  const a = await proponerAccion(ceo, tool, { text: 'A' }, { key: 'one', scope: 'alpha' }); assert.equal(externalCalls, 0);
  const stored = await db.get('external_actions', a.id); assert.ok(!stored.payload.includes('"text"'));
  await assert.rejects(ejecutarAccion(coo, a.id, { hash: a.hash, expected_version: a.version }, adapters), { code: 'NO_EXISTE' });
  await assert.rejects(ejecutarAccion(ceo, a.id, { hash: 'wrong', expected_version: a.version }, adapters), { code: 'CONFLICTO' });
  const results = await Promise.allSettled([ejecutarAccion(ceo, a.id, { hash: a.hash, expected_version: a.version }, adapters), ejecutarAccion(ceo, a.id, { hash: a.hash, expected_version: a.version }, adapters)]);
  assert.equal(externalCalls, 1); assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  await assert.rejects(ejecutarAccion(ceo, a.id, { hash: a.hash, expected_version: a.version }, adapters), { code: 'CONFLICTO' }); assert.equal(externalCalls, 1);
});
await test('respuesta perdida queda resultado_desconocido y no permite reintento ciego', async () => {
  const a = await proponerAccion(ceo, tool, { text: 'B' }, { key: 'unknown', scope: 'alpha' });
  const r = await ejecutarAccion(ceo, a.id, { hash: a.hash, expected_version: a.version }, { ...adapters, ejecutar: async () => { externalCalls++; throw new Error('respuesta perdida'); } }); assert.equal(r.estado, 'resultado_desconocido');
  const cur = await db.get('external_actions', a.id); const second = await ejecutarAccion(ceo, a.id, { hash: a.hash, expected_version: cur.v }, adapters); assert.equal(second.estado, 'resultado_desconocido'); assert.equal(externalCalls, 2);
});
await test('catálogo cambiado, tool desconocida y parámetros extra nunca se ejecutan', async () => {
  await assert.rejects(proponerAccion(ceo, null, {}), { code: 'TOOL_DESCONOCIDA' });
  await assert.rejects(proponerAccion(ceo, tool, { text: 'A', extra: true }), { code: 'PARAMETROS' });
  const a = await proponerAccion(ceo, tool, { text: 'C' }, { key: 'changed' });
  await assert.rejects(ejecutarAccion(ceo, a.id, { hash: a.hash, expected_version: a.version }, { ...adapters, catalogo: async () => [] }), { code: 'CATALOGO_CAMBIO' }); assert.equal(externalCalls, 2);
});
await test('ia/agente real prepara aprobación; jamás hace tools/call antes del humano', async () => {
  await db.create('ia_config', { proveedores: { custom: { base: 'https://mock-model.invalid', modelos: ['mock'] } }, usos: { agents: { proveedor: 'custom', modelo: 'mock' } } }, 'fixture', 'org');
  await db.create('mcp_conexiones', { url: 'https://mock-mcp.invalid', access: seal('mock-only') }, 'fixture', `${ceo.email}|notion`);
  let calls = 0;
  globalThis.fetch = async (url, opts) => { const b = JSON.parse(opts.body || '{}'); if (String(url).endsWith('chat/completions')) return Response.json({ choices: [{ message: { tool_calls: [{ id: 'one', function: { name: 'notion__publish_0', arguments: '{"text":"Review me"}' } }] } }] }); if (b.method === 'tools/call') { calls++; return Response.json({ result: { content: [{ type: 'text', text: 'mock' }] } }); } return Response.json({ result: b.method === 'tools/list' ? { tools: [tool.tool] } : {} }); };
  const r = await request('ceo', 'ia/agente', 'POST', { mensaje: 'Publica', conectores: ['notion'], client_slug: 'alpha' }); assert.equal(r.status, 200); assert.match(r.chunks, /"aprobaciones"/); assert.equal(calls, 0);
  const pending = r.chunks.split('\n\n').filter(Boolean).map((s) => JSON.parse(s.replace(/^data: /, ''))).find((d) => d.aprobaciones).aprobaciones[0];
  const approved = await request('ceo', `ia/acciones/${pending.id}/aprobar`, 'POST', { expected_version: pending.version, hash: pending.hash }); assert.equal(approved.data.estado, 'succeeded'); assert.equal(calls, 1);
  const replay = await request('ceo', `ia/acciones/${pending.id}/aprobar`, 'POST', { expected_version: pending.version, hash: pending.hash }); assert.equal(replay.status, 409); assert.equal(calls, 1);
});
console.log(`\n${count} escenarios S1 pasaron con API/PGlite y adaptadores falsos explícitos.`);
fs.rmSync(tmp, { recursive: true, force: true });
