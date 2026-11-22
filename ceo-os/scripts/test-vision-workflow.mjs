// B2 · motor durable: idempotencia, leases y recuperación, reintentos solo seguros, aprobación sobre hash, cumplimiento, límites, bitácora y outbox.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-wf-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
const W = await import('../api/_lib/workflow.js'), db = await import('../api/_lib/db.js');
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };
const ceo = { email: 'ceo@x.co', role: 'ceo' }, coo = { email: 'coo@x.co', role: 'coo' }, team = { email: 'team@x.co', role: 'team' };
const T0 = 1_700_000_000_000;

const llamadas = {};
const cuenta = (k) => llamadas[k] || 0;
const adaptadores = {
  ok: { seguro: true, execute: async ({ llave }) => { llamadas.ok = cuenta('ok') + 1; return { llave }; } },
  flaky: { seguro: true, execute: async () => { llamadas.flaky = cuenta('flaky') + 1; if (cuenta('flaky') === 1) throw Object.assign(new Error('timeout'), { reintentable: true }); return { ok: true }; } },
  envio: { externo: true, seguro: false, execute: async ({ llave }) => { llamadas.envio = cuenta('envio') + 1; return { enviado: llave }; } },
  noseguro: { seguro: false, execute: async () => { llamadas.noseguro = cuenta('noseguro') + 1; throw Object.assign(new Error('timeout'), { reintentable: true }); } },
  caido: { capability: () => ({ estado: 'disconnected', razon: 'Zernio no está conectado' }), execute: async () => { throw new Error('no debe correr'); } },
  secreto: { seguro: false, execute: async () => { throw new Error('falló con Bearer abcdefghijklmnop1234 y sk-abcdefghijklmnopqrstuvwx y password=hunter2'); } },
  lento: { seguro: true, execute: async () => { llamadas.lento = cuenta('lento') + 1; await new Promise((r) => setTimeout(r, 30)); return {}; } },
  conciliable: { seguro: false, reconcile: async () => ({ hecho: true, resultado: { ya: true } }), execute: async () => { llamadas.conciliable = cuenta('conciliable') + 1; return {}; } },
};
const def = (id, pasos) => ({ id, nombre: id, pasos });
const A = (extra = {}) => ({ id: 'a', tipo: 'accion', adaptador: 'ok', ...extra });

await test('definición: rechaza ciclos, adaptadores y dependencias que no existen, y lo externo sin aprobación antes', () => {
  const v = (d) => W.validarDefinicion(d, { adaptadores });
  assert.equal(v(def('d1', [A({ id: 'a', depende: ['b'] }), A({ id: 'b', depende: ['a'] })])).ok, false);
  assert.match(v(def('d2', [A({ adaptador: 'fantasma' })])).errores.join(), /adaptador que no existe/);
  assert.match(v(def('d3', [A({ depende: ['zzz'] })])).errores.join(), /depende de «zzz»/);
  assert.match(v(def('d4', [A(), { id: 'e', tipo: 'accion', adaptador: 'envio', depende: ['a'] }])).errores.join(), /envía, publica o gasta/);
  assert.equal(v(def('d5', [A(), { id: 'ok', tipo: 'aprobacion', depende: ['a'] }, { id: 'e', tipo: 'accion', adaptador: 'envio', depende: ['ok'] }])).ok, true);
  assert.equal(v(def('Mal Id', [A()])).ok, false); assert.equal(v(def('d6', [])).ok, false);
});
await test('las definiciones se versionan y la versión guardada no cambia', async () => {
  const d1 = await W.guardarDefinicion(ceo, def('flujo', [A()]), { adaptadores }), d2 = await W.guardarDefinicion(ceo, def('flujo', [A(), A({ id: 'b', depende: ['a'] })]), { adaptadores });
  assert.equal(d1.version, 1); assert.equal(d2.version, 2); assert.equal((await db.get(W.COLL_DEF, 'flujo--v1')).pasos.length, 1);
  await assert.rejects(W.guardarDefinicion(ceo, def('flujo', [A({ adaptador: 'fantasma' })]), { adaptadores }), (e) => e.code === 'DEFINICION');
});
const principal = await W.guardarDefinicion(ceo, def('envio-aprobado', [A(), { id: 'ok-ceo', tipo: 'aprobacion', aprueba: 'ceo', depende: ['a'] }, { id: 'e', tipo: 'accion', adaptador: 'envio', depende: ['ok-ceo'] }]), { adaptadores });

await test('idempotencia: la misma llave devuelve la MISMA corrida; otra persona con la misma llave, otra corrida', async () => {
  const a = await W.iniciar(ceo, principal, { key: 'k1' }), b = await W.iniciar(ceo, principal, { key: 'k1' }), c = await W.iniciar(coo, principal, { key: 'k1' });
  assert.equal(a.repetida, false); assert.equal(b.repetida, true); assert.equal(a.run.id, b.run.id); assert.notEqual(a.run.id, c.run.id);
  await assert.rejects(W.iniciar(ceo, principal, {}), (e) => e.code === 'LLAVE');
});
let corrida;
await test('el flujo avanza hasta la aprobación y SE DETIENE: nada externo corre antes del OK', async () => {
  corrida = (await W.iniciar(ceo, principal, { key: 'camino', input: { texto: 'hola' } })).run;
  const r = await W.avanzar(corrida.id, { adaptadores, ahora: T0 });
  assert.equal(r.estado, 'esperando_aprobacion'); assert.equal(r.pasos.a.estado, 'hecho'); assert.equal(r.pasos['ok-ceo'].estado, 'esperando'); assert.equal(r.pasos.e.estado, 'pendiente'); assert.equal(cuenta('envio'), 0);
  assert.equal((await W.avanzar(corrida.id, { adaptadores, ahora: T0 })).pasos.a.intentos, 1, 'avanzar otra vez no repite lo hecho');
});
await test('aprobar: solo el rol del paso, sobre el hash exacto y la versión leída', async () => {
  const run = await db.get(W.COLL_RUN, corrida.id), h = run.pasos['ok-ceo'].hash;
  await assert.rejects(W.aprobar(coo, corrida.id, 'ok-ceo', { hash: h, v: run.v }), (e) => e.code === 'ROL' && e.status === 403);
  await assert.rejects(W.aprobar(team, corrida.id, 'ok-ceo', { hash: h, v: run.v }), (e) => e.status === 403);
  await assert.rejects(W.aprobar(ceo, corrida.id, 'ok-ceo', { hash: 'x'.repeat(64), v: run.v }), (e) => e.code === 'CAMBIO');
  await assert.rejects(W.aprobar(ceo, corrida.id, 'ok-ceo', { hash: h }), (e) => e.code === 'CONFLICTO');
  await assert.rejects(W.aprobar(ceo, corrida.id, 'ok-ceo', { hash: h, v: run.v + 99 }), (e) => e.code === 'CONFLICTO');
  assert.equal(cuenta('envio'), 0);
});
await test('cambiar lo que se iba a aprobar invalida el OK (otro hash)', async () => {
  const run = await db.get(W.COLL_RUN, corrida.id), h = run.pasos['ok-ceo'].hash;
  await db.update(W.COLL_RUN, run.id, { ...run, input: { texto: 'OTRA COSA' } }, run.v, 'test');
  const cur = await db.get(W.COLL_RUN, run.id);
  await assert.rejects(W.aprobar(ceo, corrida.id, 'ok-ceo', { hash: h, v: cur.v }), (e) => e.code === 'CAMBIO');
  await db.update(W.COLL_RUN, cur.id, { ...cur, input: { texto: 'hola' } }, cur.v, 'test'); // se revierte
});
await test('aprobado por el CEO, el envío corre UNA vez y la corrida termina; repetir no duplica', async () => {
  const run = await db.get(W.COLL_RUN, corrida.id), h = run.pasos['ok-ceo'].hash;
  await W.aprobar(ceo, corrida.id, 'ok-ceo', { hash: h, v: run.v });
  const r = await W.avanzar(corrida.id, { adaptadores, ahora: T0 });
  assert.equal(r.estado, 'completado'); assert.equal(cuenta('envio'), 1); assert.equal(r.resultados.e.enviado, `${corrida.id}:e`, 'el adaptador recibe su llave de idempotencia');
  await W.avanzar(corrida.id, { adaptadores, ahora: T0 }); assert.equal(cuenta('envio'), 1);
  await assert.rejects(W.aprobar(ceo, corrida.id, 'ok-ceo', { hash: h, v: r.v }), (e) => e.code === 'PASO');
});
await test('reintentos: solo adaptadores seguros y errores reintentables, con espera creciente', async () => {
  const d = await W.guardarDefinicion(ceo, def('reintento', [{ id: 'f', tipo: 'accion', adaptador: 'flaky', reintentos: { max: 2 } }]), { adaptadores });
  const run = (await W.iniciar(ceo, d, { key: 'r' })).run;
  let r = await W.avanzar(run.id, { adaptadores, ahora: T0 }); assert.equal(r.pasos.f.estado, 'pendiente'); assert.equal(r.pasos.f.intentos, 1); assert.ok(r.pasos.f.no_antes > T0);
  r = await W.avanzar(run.id, { adaptadores, ahora: T0 + 10 }); assert.equal(cuenta('flaky'), 1, 'todavía en espera: no se repite antes de tiempo');
  r = await W.avanzar(run.id, { adaptadores, ahora: T0 + 5000 }); assert.equal(r.estado, 'completado'); assert.equal(cuenta('flaky'), 2);
  const n = await W.guardarDefinicion(ceo, def('noseguro', [{ id: 'n', tipo: 'accion', adaptador: 'noseguro', reintentos: { max: 3 } }]), { adaptadores });
  const r2 = await W.avanzar((await W.iniciar(ceo, n, { key: 'n' })).run.id, { adaptadores, ahora: T0 }); assert.equal(r2.estado, 'fallido'); assert.equal(cuenta('noseguro'), 1, 'lo no idempotente NO se reintenta');
});
await test('sin conexión se dice y se corta: el paso falla con su motivo, lo de abajo se omite y nada se finge', async () => {
  const d = await W.guardarDefinicion(ceo, def('caido', [{ id: 'c', tipo: 'accion', adaptador: 'caido' }, A({ id: 'd', depende: ['c'] })]), { adaptadores });
  const r = await W.avanzar((await W.iniciar(ceo, d, { key: 'c' })).run.id, { adaptadores, ahora: T0 });
  assert.equal(r.estado, 'fallido'); assert.equal(r.pasos.c.codigo, 'sin_conexion'); assert.match(r.pasos.c.error, /Zernio/); assert.equal(r.pasos.d.estado, 'omitido');
});
await test('recuperación: un paso con el lease vencido se repite si es seguro, se concilia si puede, y si no queda «resultado desconocido» SIN repetir', async () => {
  const mk = async (id, ad) => { const d = await W.guardarDefinicion(ceo, def(id, [{ id: 'x', tipo: 'accion', adaptador: ad }]), { adaptadores }); const run = (await W.iniciar(ceo, d, { key: id })).run;
    const cur = await db.get(W.COLL_RUN, run.id); await db.update(W.COLL_RUN, run.id, { ...cur, estado: 'corriendo', pasos: { x: { estado: 'corriendo', intentos: 1, lease: { dueno: 'muerto', exp: T0 - 1 } } } }, cur.v, 'test'); return run.id; };
  const antesOk = cuenta('ok'); const s = await W.avanzar(await mk('rec-seguro', 'ok'), { adaptadores, ahora: T0 }); assert.equal(s.estado, 'completado'); assert.equal(cuenta('ok'), antesOk + 1);
  const n = await W.avanzar(await mk('rec-noseguro', 'noseguro'), { adaptadores, ahora: T0 }); assert.equal(n.pasos.x.codigo, 'resultado_desconocido'); assert.equal(cuenta('noseguro'), 1, 'no se volvió a ejecutar');
  const c = await W.avanzar(await mk('rec-concilia', 'conciliable'), { adaptadores, ahora: T0 }); assert.equal(c.estado, 'completado'); assert.equal(c.pasos.x.conciliado, true); assert.equal(cuenta('conciliable'), 0);
  const vivo = await mk('rec-vivo', 'ok'); const cur = await db.get(W.COLL_RUN, vivo); await db.update(W.COLL_RUN, vivo, { ...cur, pasos: { x: { ...cur.pasos.x, lease: { dueno: 'otro', exp: T0 + 60_000 } } } }, cur.v, 'test');
  const a0 = cuenta('ok'); const v = await W.avanzar(vivo, { adaptadores, ahora: T0 }); assert.equal(v.pasos.x.estado, 'corriendo', 'un lease vigente no se pisa'); assert.equal(cuenta('ok'), a0);
});
await test('dos procesos a la vez: el paso corre UNA sola vez (lease por CAS)', async () => {
  const d = await W.guardarDefinicion(ceo, def('concurrente', [{ id: 'l', tipo: 'accion', adaptador: 'lento' }]), { adaptadores }), run = (await W.iniciar(ceo, d, { key: 'cc' })).run;
  await Promise.all(['w1', 'w2', 'w3'].map((dueno) => W.avanzar(run.id, { adaptadores, ahora: T0, dueno }).catch(() => null)));
  assert.equal(cuenta('lento'), 1); assert.equal((await db.get(W.COLL_RUN, run.id)).estado, 'completado');
});
await test('cancelar: solo quien la inició, el COO o el CEO; lo pendiente se omite y ya no avanza', async () => {
  const run = (await W.iniciar(ceo, principal, { key: 'cancelar' })).run; await W.avanzar(run.id, { adaptadores, ahora: T0 });
  await assert.rejects(W.cancelar(team, run.id), (e) => e.status === 403);
  const r = await W.cancelar(coo, run.id); assert.equal(r.estado, 'cancelado'); assert.equal(r.pasos.e.estado, 'omitido');
  const envios = cuenta('envio'); await W.avanzar(run.id, { adaptadores, ahora: T0 }); assert.equal(cuenta('envio'), envios);
  await assert.rejects(W.cancelar(ceo, run.id), (e) => e.code === 'PASO');
});
await test('límites por proveedor: tope por ventana; la siguiente ventana vuelve a dejar pasar', async () => {
  const L = { max: 2, ventanaMs: 60_000 };
  assert.equal((await W.tomarCupo('meta', L, T0)).ok, true); assert.equal((await W.tomarCupo('meta', L, T0 + 1)).ok, true);
  const no = await W.tomarCupo('meta', L, T0 + 2); assert.equal(no.ok, false); assert.ok(no.reintentarEn > 0 && no.reintentarEn <= 60_000);
  assert.equal((await W.tomarCupo('meta', L, T0 + 60_000)).ok, true); assert.equal((await W.tomarCupo('tiktok', L, T0 + 2)).ok, true, 'cada proveedor tiene el suyo');
  const d = await W.guardarDefinicion(ceo, def('tope', [{ id: 'p', tipo: 'accion', adaptador: 'ok', proveedor: 'cuello' }]), { adaptadores });
  const r1 = (await W.iniciar(ceo, d, { key: 't1' })).run, r2 = (await W.iniciar(ceo, d, { key: 't2' })).run, limites = { cuello: { max: 1, ventanaMs: 60_000 } };
  assert.equal((await W.avanzar(r1.id, { adaptadores, limites, ahora: T0 })).estado, 'completado');
  const e2 = await W.avanzar(r2.id, { adaptadores, limites, ahora: T0 }); assert.equal(e2.pasos.p.estado, 'pendiente'); assert.ok(e2.pasos.p.no_antes > T0);
  assert.equal((await W.avanzar(r2.id, { adaptadores, limites, ahora: T0 + 61_000 })).estado, 'completado');
});
await test('la bitácora no guarda secretos', async () => {
  const d = await W.guardarDefinicion(ceo, def('secretos', [{ id: 's', tipo: 'accion', adaptador: 'secreto' }]), { adaptadores });
  const r = await W.avanzar((await W.iniciar(ceo, d, { key: 's' })).run.id, { adaptadores, ahora: T0 }), todo = JSON.stringify([r.eventos, r.pasos]);
  assert.doesNotMatch(todo, /abcdefghijklmnop1234|sk-abcdefghijklmnopqrstuvwx|hunter2/); assert.match(todo, /«secreto»/);
  assert.equal(W.redactar('token: ABC123'), '«secreto»'); assert.equal(W.redactar('hola mundo'), 'hola mundo');
});
await test('outbox: cada evento sale UNA vez, en orden; si la entrega falla, vuelve a la bandeja', async () => {
  const vistos = []; const n1 = await W.drenar(async (e) => { vistos.push(e.tipo); }); assert.ok(n1 > 5); assert.equal(await W.drenar(async () => {}), 0, 'ya salieron todos');
  const d = await W.guardarDefinicion(ceo, def('outbox', [A()]), { adaptadores }); await W.iniciar(ceo, d, { key: 'o' });
  assert.equal(await W.drenar(async () => { throw new Error('el bus no responde'); }), 0);
  assert.ok((await W.drenar(async () => {})) >= 1, 'lo que falló se reintenta después');
  assert.ok(vistos.includes('inicio') && vistos.includes('aprobado'));
});
console.log(`${count} pruebas del motor durable OK`);

// ---------- Las rutas ----------
const session = await import('../api/_lib/session.js'), api = (await import('../api/index.js')).default;
const email = (r) => `${r}@inherentglobal.com`;
async function req(role, route, method = 'GET', b = {}) {
  const headers = { host: 'localhost', 'x-ceoos': '1' }, jar = new Map();
  const res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, write() {}, end() {} };
  const r = { url: `/api/${route}`, method, headers, body: b, query: Object.fromEntries(new URL(`http://x/${route}`).searchParams) };
  session.issue(r, res, { email: email(role) }); headers.cookie = jar.get('Set-Cookie').split(';')[0];
  await api(r, res); return { status: res.statusCode, data: res.data };
}
process.env.SESSION_SECRET ||= 'vision-test-only-secret-01234567890123456789';
for (const r of ['ceo', 'coo', 'team']) await db.create('team', { role: r, roles: [r] }, 'fixture', email(r));
await db.create('settings', { views: { coo: { work: 'edita' }, team: { work: 'edita' } } }, 'fixture', 'role_views');
await test('rutas: definir es del CEO/COO; el catálogo dice qué adaptadores están conectados y cuáles no', async () => {
  const d = { definicion: { id: 'ruta-demo', nombre: 'Demo', pasos: [{ id: 'n', tipo: 'accion', adaptador: 'nota', params: { texto: 'hola' } }, { id: 't', tipo: 'accion', adaptador: 'crear-tarea', depende: ['n'], params: { titulo: 'Revisar demo' } }] } };
  assert.equal((await req('team', 'workflows', 'POST', d)).status, 403);
  const ok = await req('coo', 'workflows', 'POST', d); assert.equal(ok.status, 200); assert.equal(ok.data.version, 1);
  const malo = await req('coo', 'workflows', 'POST', { definicion: { id: 'x', pasos: [{ id: 'p', tipo: 'accion', adaptador: 'zernio-publicar' }] } }); assert.equal(malo.status, 400); assert.match(malo.data.errores.join(), /no tiene una aprobación antes/);
  const cat = await req('team', 'workflows'); assert.equal(cat.status, 200);
  assert.equal(cat.data.adaptadores.find((a) => a.id === 'zernio-publicar').estado, 'disconnected'); assert.equal(cat.data.adaptadores.find((a) => a.id === 'nota').estado, 'ready');
});
await test('rutas: correr con llave repetida no duplica ni la tarea; lo ajeno no se ve', async () => {
  const a = await req('team', 'workflows/ruta-demo/run', 'POST', { key: 'uno' }), b = await req('team', 'workflows/ruta-demo/run', 'POST', { key: 'uno' });
  assert.equal(a.data.estado, 'completado'); assert.equal(b.data.repetida, true); assert.equal(a.data.id, b.data.id);
  assert.equal((await db.list('tasks')).filter((t) => t.origen === 'workflow').length, 1, 'una sola tarea');
  assert.equal((await req('team', `workflow-runs/${a.data.id}`)).status, 200);
  const otra = await req('coo', 'workflows/ruta-demo/run', 'POST', { key: 'del-coo' });
  assert.equal((await req('team', `workflow-runs/${otra.data.id}`)).status, 404, 'otra persona sin rol alto no la ve'); assert.equal((await req('ceo', `workflow-runs/${otra.data.id}`)).status, 200);
});
await test('rutas: las colecciones del motor no se leen ni se escriben por la ruta genérica /api/db', async () => {
  for (const c of ['wf_runs', 'wf_defs', 'wf_events', 'wf_limits', 'native_codes']) for (const [m, role] of [['GET', 'ceo'], ['POST', 'ceo']]) { const r = await req(role, `db/${c}`, m, { x: 1 }); assert.ok([403, 404].includes(r.status), `${m} ${c} → ${r.status}`); }
});
console.log(`${count} pruebas totales (motor + rutas) OK`);
