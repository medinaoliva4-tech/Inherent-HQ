// Chat ↔ canales: responderPorCanal() lleva el mensaje al MISMO Chat (turno en cola → lo responde el servidor). Sin red: PGlite y un trabajador falso.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-canales-chat-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com';
const db = await import('../api/_lib/db.js'), chat = await import('../api/_lib/chat.js'), { leerIdSesion } = await import('../public/js/llm/modos.js');
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };
const ceo = { email: 'ceo@inherentglobal.com', role: 'ceo' }, coo = { email: 'coo@inherentglobal.com', role: 'coo' };
const gw = (en = true) => db.upsert('gateway_estado', 'vps', { at: new Date(en ? Date.now() : Date.now() - 10 * 60_000).toISOString(), modelos: ['kimi-k3'], version: 't' }, 'fixture');
// El «trabajador»: en cada espera toma el turno en cola y lo contesta.
const trabajador = (texto, estado = 'listo') => async () => {
  const s = await db.get('chat_sesiones', chat.idCanal(ceo.email)); if (s?.turno?.estado !== 'en_cola') return;
  await db.update('chat_sesiones', s.id, { ...s, mensajes: [...s.mensajes, { role: 'assistant', content: texto, at: new Date().toISOString() }], turno: { ...s.turno, estado } }, s.v, 'gw');
};

await test('el id de la conversación del canal es válido y distinto por persona', () => {
  assert.ok(leerIdSesion(chat.idCanal(ceo.email))); assert.notEqual(chat.idCanal(ceo.email), chat.idCanal(coo.email));
  assert.equal(chat.idCanal('CEO@inherentglobal.com'), chat.idCanal(ceo.email));
});
await test('sin servidor en línea: lo dice, no finge y no deja turno colgado', async () => {
  await gw(false); const t = await chat.responderPorCanal('hola', ceo, { dormir: async () => {} });
  assert.match(t, /no está en línea/); assert.ok(!(await db.get('chat_sesiones', chat.idCanal(ceo.email))));
  assert.match(await chat.responderPorCanal('hola', { email: 'x@y.co', role: 'client' }), /No puedo/);
});
await test('con servidor: el turno entra «en_cola» en una conversación oculta de esa persona y vuelve la respuesta', async () => {
  await gw(); let vio = null;
  const t = await chat.responderPorCanal('¿cómo vamos?', ceo, { dormir: async () => { vio ||= (await db.get('chat_sesiones', chat.idCanal(ceo.email))).turno?.estado; await trabajador('Todo bien.')(); } });
  assert.equal(t, 'Todo bien.'); assert.equal(vio, 'en_cola');
  const s = await db.get('chat_sesiones', chat.idCanal(ceo.email)); assert.equal(s.oculto, true); assert.equal(s.owner, ceo.email); assert.equal(s.mensajes[0].content, '¿cómo vamos?');
});
await test('la conversación de uno no es de otro: el COO tiene la suya', async () => {
  const t = await chat.responderPorCanal('hola', coo, { esperaMs: 0, cadaMs: 1, dormir: async () => {} });
  assert.match(t, /Sigo trabajando/); assert.equal((await db.get('chat_sesiones', chat.idCanal(coo.email))).owner, coo.email);
  assert.equal((await db.get('chat_sesiones', chat.idCanal(ceo.email))).mensajes.some((m) => m.content === 'hola'), false);
});
await test('turno anterior sin terminar: no apila otro; errores y timeout se dicen', async () => {
  assert.match(await chat.responderPorCanal('otra', coo, { dormir: async () => {} }), /lo anterior/);
  await trabajador('x', 'error')().catch(() => {});
  const t = await chat.responderPorCanal('falla', ceo, { dormir: trabajador('boom', 'error') }); assert.match(t, /No pude responder/);
  assert.equal(await chat.responderPorCanal('   ', ceo), '');
});
console.log(`${count} pruebas de Chat↔canales OK`);
