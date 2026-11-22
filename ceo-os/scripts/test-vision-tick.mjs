// El despertador del motor: POST /api/workflow/tick. Secreto de cabecera, corridas vencidas, lotes aprobados en cola, avisos de Decide. Sin red: PGlite y correo falso.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-tick-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL; delete process.env.CRON_SECRET; delete process.env.TELEGRAM_BOT_TOKEN;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789';
const db = await import('../api/_lib/db.js'), W = await import('../api/_lib/workflow.js'), E = await import('../api/_lib/lead-engine.js'), T = await import('../api/_lib/tick.js'), { ADAPTADORES } = await import('../api/_lib/workflow-rutas.js');
const api = (await import('../api/index.js')).default;
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };
const SECRETO = 'cron-SECRETO-de-prueba-0123456789';
async function post(headers = {}, method = 'POST', route = 'workflow/tick') {
  const res = { statusCode: 200, getHeader() {}, setHeader() {}, status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, write() {}, end() {} };
  await api({ url: `/api/${route}`, method, headers: { host: 'localhost', ...headers }, body: {}, query: {}, params: {} }, res); return { status: res.statusCode, data: res.data };
}
const NOW = Date.UTC(2026, 10, 24, 15, 0, 0); // martes 09:00 en Guatemala
let reloj = NOW; const correo = { calls: [], async enviar(x) { this.calls.push(x); return { id: `m-${this.calls.length}` }; } };
T.configurar({ ahora: () => reloj, correo: null, config: { calentados: [] } });
const dueno = { email: 'coo@x.co', role: 'coo' };
const def = (id, pasos) => W.guardarDefinicion(dueno, { id, nombre: id, pasos }, { adaptadores: ADAPTADORES });

await test('sin CRON_SECRET: 503; con él, sin cabecera o con otra: 401 (y nada se mueve)', async () => {
  assert.equal((await post({ 'x-cron-secret': SECRETO })).status, 503);
  process.env.CRON_SECRET = SECRETO;
  assert.equal((await post()).status, 401); assert.equal((await post({ 'x-cron-secret': 'otro' })).status, 401); assert.equal((await post({ authorization: 'Bearer ' + SECRETO + 'x' })).status, 401);
  assert.equal((await post({ 'x-cron-secret': SECRETO }, 'GET')).status === 200, false, 'solo POST');
  assert.equal(T.secretoOk('', SECRETO), false); assert.equal(T.secretoOk(SECRETO, ''), false); assert.equal(T.secretoOk(SECRETO, SECRETO), true);
});
await test('con el secreto (x-cron-secret o Bearer): 200 con el resumen; sin trabajo no hace nada', async () => {
  for (const h of [{ 'x-cron-secret': SECRETO }, { authorization: `Bearer ${SECRETO}` }]) { const r = await post(h); assert.equal(r.status, 200); assert.equal(r.data.corridas.avanzadas, 0); assert.equal(r.data.lotes.procesados, 0); }
});
await test('avisa lo de Decide solo con bot: sin TELEGRAM_BOT_TOKEN dice «sin_telegram»', async () => {
  const r = await post({ 'x-cron-secret': SECRETO }); assert.deepEqual([r.data.decisiones.enviados, r.data.decisiones.motivo], [0, 'sin_telegram']);
});
await test('corridas: avanza la que ya toca, no toca lo que espera a una persona, y espera los reintentos', async () => {
  const d = await def('tick-nota', [{ id: 'a', tipo: 'accion', adaptador: 'nota', params: { texto: 'hola' } }, { id: 'b', tipo: 'accion', adaptador: 'crear-tarea', depende: ['a'], params: { titulo: 'T' } }]);
  const { run } = await W.iniciar(dueno, d, { key: 'k1' }); assert.equal(run.estado, 'en_cola');
  const dAp = await def('tick-ap', [{ id: 'ok', tipo: 'aprobacion', aprueba: 'coo' }, { id: 'n', tipo: 'accion', adaptador: 'nota', depende: ['ok'] }]);
  const { run: ap } = await W.iniciar(dueno, dAp, { key: 'k2' }); await W.avanzar(ap.id, { adaptadores: ADAPTADORES, ahora: reloj }); assert.equal((await db.get(W.COLL_RUN, ap.id)).estado, 'esperando_aprobacion');
  const r = await post({ 'x-cron-secret': SECRETO }); assert.equal(r.data.corridas.avanzadas, 1);
  assert.equal((await db.get(W.COLL_RUN, run.id)).estado, 'completado'); assert.equal((await db.get(W.COLL_RUN, ap.id)).estado, 'esperando_aprobacion', 'la aprobación sigue esperando a una persona');
  assert.equal((await post({ 'x-cron-secret': SECRETO })).data.corridas.avanzadas, 0, 'lo completado no se vuelve a tocar');
  const { run: espera } = await W.iniciar(dueno, d, { key: 'k3' }); const cur = await db.get(W.COLL_RUN, espera.id);
  await db.update(W.COLL_RUN, espera.id, { ...cur, pasos: { ...cur.pasos, a: { ...cur.pasos.a, no_antes: reloj + 60_000 } } }, cur.v, 'test');
  assert.equal((await post({ 'x-cron-secret': SECRETO })).data.corridas.avanzadas, 0, 'el reintento todavía no vence'); reloj += 61_000;
  assert.equal((await post({ 'x-cron-secret': SECRETO })).data.corridas.avanzadas, 1); assert.equal((await db.get(W.COLL_RUN, espera.id)).estado, 'completado');
});
await test('un proceso que murió a mitad de un paso seguro se recupera; uno sin conexión se SALTA (no se marca fallido)', async () => {
  const d = await db.get(W.COLL_DEF, 'tick-nota--v1');
  const { run } = await W.iniciar(dueno, d, { key: 'muerto' }); const cur = await db.get(W.COLL_RUN, run.id);
  await db.update(W.COLL_RUN, run.id, { ...cur, estado: 'corriendo', pasos: { ...cur.pasos, a: { estado: 'corriendo', intentos: 1, lease: { dueno: 'otro', exp: reloj - 1 } } } }, cur.v, 'test');
  assert.equal((await post({ 'x-cron-secret': SECRETO })).data.corridas.avanzadas, 1); assert.equal((await db.get(W.COLL_RUN, run.id)).estado, 'completado');
  const dz = await def('tick-zernio', [{ id: 'ok', tipo: 'aprobacion', aprueba: 'coo' }, { id: 'pub', tipo: 'accion', adaptador: 'zernio-publicar', depende: ['ok'] }]);
  const { run: z } = await W.iniciar(dueno, dz, { key: 'z' }); await W.avanzar(z.id, { adaptadores: ADAPTADORES, ahora: reloj });
  const w = await db.get(W.COLL_RUN, z.id), h = W.hashAprobacion(dz, w, 'ok'); await W.aprobar({ email: 'coo@x.co', role: 'coo' }, z.id, 'ok', { hash: h, v: w.v });
  const antes = await db.get(W.COLL_RUN, z.id); assert.equal(antes.estado, 'en_cola'); assert.equal(antes.pasos.pub.estado, 'pendiente');
  const r = await post({ 'x-cron-secret': SECRETO }); assert.deepEqual(r.data.corridas.saltadas.map((x) => [x.run, x.motivo, x.adaptador]), [[z.id, 'sin_conexion', 'zernio-publicar']]);
  const despues = await db.get(W.COLL_RUN, z.id); assert.equal(despues.estado, 'en_cola', 'no se marca fallida: espera a que haya conexión'); assert.equal(despues.pasos.pub.estado, 'pendiente');
});
await test('lotes: solo sale lo aprobado con su contenido exacto, solo con correo conectado, y la política de horario y topes manda', async () => {
  const base = (hash) => ({ slug: 'alpha', estado: 'parcial', remitente: { email: 'ana@inherent.example' }, items: [1, 2, 3].map((i) => ({ i, escribir: true, lead: { email: `p${i}@x.gt` }, borrador: { ok: true, asunto: 'Hola', cuerpo: `cuerpo ${i}` }, envio: { estado: 'en_cola' } })), aprobado: { hash, run_id: 'run-x' } });
  const l = await db.create(E.COLL_LOTE, base('x'), 'test'); await db.update(E.COLL_LOTE, l.id, { ...l, aprobado: { hash: E.hashLote(l), run_id: 'run-x' } }, l.v, 'test');
  const sinOk = await db.create(E.COLL_LOTE, base('hash-viejo'), 'test');
  let r = await post({ 'x-cron-secret': SECRETO }); assert.deepEqual([r.data.lotes.procesados, r.data.lotes.saltados.map((x) => x.motivo)], [0, ['sin_correo']]); assert.equal(correo.calls.length, 0);
  T.configurar({ correo }); r = await post({ 'x-cron-secret': SECRETO }); assert.equal(r.data.lotes.procesados, 1, 'el de hash viejo no entra'); assert.ok(correo.calls.length >= 1 && correo.calls.length <= 3);
  assert.ok(correo.calls.every((c) => c.de === 'ana@inherent.example' && /^p\d@x\.gt$/.test(c.para)));
  assert.equal((await db.get(E.COLL_LOTE, sinOk.id)).items.every((i) => i.envio.estado === 'en_cola'), true);
  reloj = Date.UTC(2026, 10, 24, 3, 0, 0); const antes = correo.calls.length; await post({ 'x-cron-secret': SECRETO }); assert.equal(correo.calls.length, antes, 'de madrugada (fuera de horario) no sale nada'); reloj = NOW;
  T.configurar({ correo: null });
});
console.log(`${count} pruebas del despertador OK`);
