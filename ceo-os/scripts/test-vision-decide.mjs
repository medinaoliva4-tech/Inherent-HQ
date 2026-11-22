// P1 · «Decide»: el ciclo 1→20, el orden de las decisiones, y la ruta GET /api/decide + POST /api/decide/:id/escalar.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-decide-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com';
const { cicloDe, frasesDeHito } = await import('../public/js/ciclo.js');
const { ordenar, seleccion, accionesDe, escalaA, VACIO } = await import('../public/js/decide.js');
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };

await test('el ciclo: fases y firmes en 11 y 20', () => {
  assert.equal(cicloDe('2026-11-01').fase.id, 'reunion');
  assert.equal(cicloDe('2026-11-06').fase.id, 'producir');
  const c11 = cicloDe('2026-11-11'); assert.equal(c11.hito, 11); assert.equal(c11.presion, 2); assert.equal(c11.fase.id, 'ultimo');
  assert.equal(cicloDe('2026-11-12').fase.id, 'montar'); assert.equal(cicloDe('2026-11-19').fase.id, 'cambios');
  const c20 = cicloDe('2026-11-20'); assert.equal(c20.hito, 20); assert.equal(c20.fase.id, 'presentacion');
  assert.equal(cicloDe('2026-11-21').enCiclo, false);
});
await test('el próximo hito: antes del 11 es el 11; entre 12 y 20, el 20; pasado el 20, el 11 del mes que viene', () => {
  assert.deepEqual([cicloDe('2026-11-05').proximoHito, cicloDe('2026-11-05').diasAlHito], [11, 6]);
  assert.deepEqual([cicloDe('2026-11-15').proximoHito, cicloDe('2026-11-15').diasAlHito], [20, 5]);
  assert.deepEqual([cicloDe('2026-11-25').proximoHito, cicloDe('2026-11-25').diasAlHito], [11, 16]);
  assert.deepEqual([cicloDe('2026-12-31').proximoHito, cicloDe('2026-12-31').diasAlHito], [11, 11]); // fin de año: del 31 al 11 de enero
});
await test('el huso: a las 02:00 UTC del día 12 en Guatemala todavía es el 11', () => {
  assert.equal(cicloDe(new Date('2026-11-12T02:00:00Z')).dia, 11);
  assert.equal(cicloDe(new Date('2026-11-12T06:30:00Z')).dia, 12);
  assert.throws(() => cicloDe(new Date('x')), /inválida/);
});
await test('las frases del hito', () => {
  assert.equal(frasesDeHito(cicloDe('2026-11-10')), 'Falta un día para el 11');
  assert.equal(frasesDeHito(cicloDe('2026-11-07')), 'Faltan 4 días para el 11');
  assert.match(frasesDeHito(cicloDe('2026-11-20')), /presentación/);
});
const item = (id, o = {}) => ({ id, area: 'creative', desde: '2026-11-08T10:00:00Z', puede: { aprobar: true, cambios: true, escalar: true }, faltas: [], ...o });
await test('el orden sube lo que el día pide: el 6 gana producción; el 19, creative y marketing', () => {
  const xs = [item('a', { area: 'creative' }), item('b', { area: 'production' })];
  assert.equal(ordenar(xs, { hoy: '2026-11-06', ahora: Date.parse('2026-11-06') })[0].id, 'b');
  const ys = [item('p', { area: 'production' }), item('c', { area: 'creative' })];
  assert.equal(ordenar(ys, { hoy: '2026-11-19', ahora: Date.parse('2026-11-19') })[0].id, 'c');
});
await test('lo escalado y lo que lleva días esperando suben; el desempate es estable', () => {
  const xs = [item('z', { desde: '2026-11-09T00:00:00Z' }), item('y', { escaladoPor: 'coo@x' }), item('x', { desde: '2026-11-01T00:00:00Z' })];
  const o = ordenar(xs, { hoy: '2026-11-12', ahora: Date.parse('2026-11-12') });
  assert.equal(o[0].id, 'y'); assert.equal(o[0].prioridad.razon.length > 0, true);
  assert.deepEqual(ordenar(xs, { hoy: '2026-11-12', ahora: 1 }).map((x) => x.id), ordenar([...xs].reverse(), { hoy: '2026-11-12', ahora: 1 }).map((x) => x.id));
});
await test('selección: 3 en escritorio, 1 en teléfono, y el vacío es humano', () => {
  const xs = ['a', 'b', 'c', 'd', 'e'].map((i) => item(i));
  const s = seleccion(xs, { hoy: '2026-11-08' }); assert.equal(s.visibles.length, 3); assert.equal(s.resto, 2);
  const m = seleccion(xs, { movil: true, hoy: '2026-11-08' }); assert.equal(m.visibles.length, 1); assert.equal(m.resto, 4);
  assert.equal(seleccion([], {}).vacio, VACIO); assert.equal(VACIO, 'Nada espera por ti. Disfruta.');
});
await test('las acciones: lo que el servidor no dice que se puede, no se puede; los criterios en falta bloquean Aprobar', () => {
  const a = accionesDe(item('a', { faltas: ['Falta el ICP'] })), por = (id) => a.find((x) => x.id === id);
  assert.equal(por('aprobar').disabled, true); assert.match(por('aprobar').motivo, /Falta el ICP/); assert.equal(por('cambios').disabled, false);
  assert.equal(accionesDe({}).every((x) => x.disabled), true);
  assert.equal(escalaA('Precio'), 'ceo'); assert.equal(escalaA('alcance'), 'ceo'); assert.equal(escalaA('fechas'), 'ceo'); assert.equal(escalaA('copy'), 'coo');
});

// ---------- El servidor ----------
const db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js');
const api = (await import('../api/index.js')).default;
const email = (r) => `${r}@inherentglobal.com`;
async function request(role, route, method = 'GET', body = {}) {
  const headers = { host: 'localhost', 'x-ceoos': '1' }, jar = new Map();
  const res = { statusCode: 200, chunks: '', getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; }, write(c) { this.chunks += c; }, end(c) { if (c) this.chunks += c; } };
  const req = { url: `/api/${route}`, method, headers, body, query: Object.fromEntries(new URL(`http://x/${route}`).searchParams) };
  session.issue(req, res, { email: email(role) }); headers.cookie = jar.get('Set-Cookie').split(';')[0];
  await api(req, res); return { status: res.statusCode, data: res.data };
}
const file = (rel, text) => { const p = path.join(process.env.LOCAL_REPO, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); };
file('clients/alpha/00-onboarding/plan-contratado.md', '# Ficha — Alpha\n\n| Campo | Valor |\n|---|---|\n| Plan | Brand Growth |\n\n## Qué incluye\n\n| Entregable | Cantidad |\n|---|---|\n| Volumen | 2 piezas |\n');
for (const r of ['ceo', 'coo']) await db.create('team', { role: r, roles: [r] }, 'fixture', email(r));
await db.create('settings', { views: { coo: { content: 'edita' } } }, 'fixture', 'role_views'); // el COO ve Content (creative), no Strategy
const base = { client_slug: 'alpha', titulo: 'x', version: 1, aprobado: null, entradas: [], historial: [], criterios: { cumple: [], falta: [] }, contenido: {}, ia: { via: 'manual', modelo: '' } };
const moodboard = await db.create('deliverables', { ...base, tool: 'moodboard-studio', ws: 'creative', pestana: 'concepts', titulo: 'Moodboard', estado: 'En revisión' }, 'fixture');
const icp = await db.create('deliverables', { ...base, tool: 'customer-bullseye', ws: 'strategy', pestana: 'research', titulo: 'ICP', estado: 'En revisión' }, 'fixture');
await db.create('deliverables', { ...base, tool: 'moodboard-studio', ws: 'creative', pestana: 'concepts', titulo: 'Borrador suelto', estado: 'Borrador' }, 'fixture');

await test('GET /api/decide: cada rol ve SOLO lo que le toca decidir (el ICP es del CEO; el moodboard, del COO también)', async () => {
  const ceo = await request('ceo', 'decide?hoy=2026-11-08'), coo = await request('coo', 'decide?hoy=2026-11-08');
  assert.deepEqual(ceo.data.items.map((x) => x.id).sort(), [icp.id, moodboard.id].sort());
  assert.deepEqual(coo.data.items.map((x) => x.id), [moodboard.id]);
  const m = coo.data.items[0]; assert.equal(m.puede.aprobar, true); assert.equal(m.puede.escalar, true); assert.ok(m.prioridad.puntos > 0);
  assert.equal(ceo.data.items.find((x) => x.id === icp.id).puede.escalar, false, 'el CEO no escala hacia arriba');
});
await test('aprobar pasa por el servidor: sin la versión leída, 400; con una vieja, 409; con la buena, queda Aprobado y sale de Decide', async () => {
  assert.equal((await request('coo', `entregables/${moodboard.id}/estado`, 'POST', { a: 'Aprobado' })).data.code, 'FALTA_V');
  const mal = await request('coo', `entregables/${moodboard.id}/estado`, 'POST', { a: 'Aprobado', v: 999 }); assert.equal(mal.status, 409); assert.equal(mal.data.code, 'CONFLICTO');
  const bien = await request('coo', 'decide'); const v = bien.data.items[0].v;
  const ok = await request('coo', `entregables/${moodboard.id}/estado`, 'POST', { a: 'Aprobado', v });
  if (ok.status === 400) assert.equal(ok.data.code, 'FALTAS'); else { assert.equal(ok.status, 200); assert.equal((await request('coo', 'decide')).data.items.length, 0); }
});
await test('el COO no aprueba lo que es del CEO, aunque llame a la ruta directo', async () => {
  const r = await request('coo', `entregables/${icp.id}/estado`, 'POST', { a: 'Aprobado', v: icp.v });
  assert.ok([403, 404].includes(r.status), `esperaba 403/404 y fue ${r.status}`);
});
await test('escalar: el COO deja una decisión en el CEO, con su nota, y el CEO la ve como «te la escalaron»', async () => {
  const otro = await db.create('deliverables', { ...base, tool: 'moodboard-studio', ws: 'creative', pestana: 'concepts', titulo: 'Cambia el precio', estado: 'Borrador' }, 'fixture');
  assert.equal((await request('coo', `decide/${otro.id}/escalar`, 'POST', { a: 'ceo', v: 999 })).data.code, 'CONFLICTO');
  assert.equal((await request('coo', `decide/${otro.id}/escalar`, 'POST', { a: 'coo', v: otro.v })).data.code, 'MISMO_NIVEL');
  assert.equal((await request('coo', `decide/${otro.id}/escalar`, 'POST', { a: 'nadie', v: otro.v })).data.code, 'DESTINO');
  const r = await request('coo', `decide/${otro.id}/escalar`, 'POST', { a: 'ceo', nota: 'toca el precio', v: otro.v }); assert.equal(r.status, 200); assert.equal(r.data.escalado.a, 'ceo');
  const ceo = await request('ceo', 'decide'); const x = ceo.data.items.find((i) => i.id === otro.id);
  assert.ok(x); assert.equal(x.escaladoPor, email('coo')); assert.match(x.prioridad.razon, /escal/i);
  assert.equal((await request('coo', 'decide')).data.items.some((i) => i.id === otro.id), false, 'lo escalado ya no es del COO');
});
await test('el CEO no escala hacia abajo ni lo aprobado se escala', async () => {
  const f = await db.create('deliverables', { ...base, tool: 'moodboard-studio', ws: 'creative', pestana: 'concepts', titulo: 'Ya aprobado', estado: 'Aprobado', aprobado: { version: 1 } }, 'fixture');
  assert.equal((await request('ceo', `decide/${f.id}/escalar`, 'POST', { a: 'coo', v: f.v })).data.code, 'HACIA_ABAJO');
  assert.equal((await request('coo', `decide/${f.id}/escalar`, 'POST', { a: 'ceo', v: f.v })).data.code, 'PASO');
});
await test('editar lo escalado invalida la escalada (otra versión = otra decisión)', async () => {
  const d = (await db.list('deliverables')).find((x) => x.titulo === 'Cambia el precio');
  await db.update('deliverables', d.id, { ...d, version: (d.version || 1) + 1 }, d.v, 'fixture');
  assert.equal((await request('ceo', 'decide')).data.items.some((i) => i.id === d.id), false);
});
console.log(`${count} pruebas de Decide OK`);
