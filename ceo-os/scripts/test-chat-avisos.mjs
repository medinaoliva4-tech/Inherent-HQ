import assert from 'node:assert/strict';
import { cambioAviso, avisoPublico } from '../public/js/chat-avisos-datos.js';

// Exclusivamente una base efímera: ni Neon ni datos del repo.
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = 'memory://'; process.env.ADMIN_EMAILS = 'prueba@example.test';
const db = await import('../api/_lib/db.js');
const { avisosChatDe, entregarAvisosChat, rutasChatAvisos } = await import('../api/_lib/chat-avisos.js');
const { userFor, effective, viewsDoc } = await import('../api/_lib/access.js');
let n = 0; const test = async (nombre, f) => { await f(); console.log('✓', nombre); n++; };
const base = { id: 's1', v: 1, owner: 'prueba@example.test', turno: { estado: 'trabajando' } };
const fin = { ...base, turno: { estado: 'listo' }, mensajes: [{ role: 'assistant', content: 'CONTENIDO PRIVADO', propuestas: [{ estado: 'pendiente' }] }] };
await test('solo cambios de estado generan aviso; una propuesta requiere decisión', () => {
  assert.deepEqual(cambioAviso('chat_sesiones', base, base), {});
  const a = cambioAviso('chat_sesiones', base, fin).aviso_chat;
  assert.equal(a.tipo, 'decidir'); assert.equal(a.owner, base.owner);
  assert.ok(!JSON.stringify(a).includes('PRIVADO'));
  assert.deepEqual(cambioAviso('chat_sesiones', fin, { ...fin, title: 'Cambió título' }), {});
  assert.equal(cambioAviso('chat_sesiones', fin, base).aviso_chat, null);
  const bloqueado = { ...fin, mensajes: [], turno: { estado: 'listo', trabajo: { plan: { bloqueo: 'Hace falta una decisión' } } } };
  assert.equal(cambioAviso('chat_sesiones', base, bloqueado).aviso_chat.tipo, 'decidir');
});
await test('etapa en revisión/pregunta/error y trabajo completo; sin enlaces externos', () => {
  const r = { id: 'r1', v: 3, creado_por: base.owner, etapas: [{ estado: 'trabajando' }] };
  for (const [estado, tipo] of [['revision', 'decidir'], ['pregunta', 'decidir'], ['detenida', 'error'], ['aprobada', 'listo']]) {
    const a = cambioAviso('agent_runs', r, { ...r, etapas: [{ estado }] }).aviso_chat;
    assert.equal(a.tipo, tipo); assert.equal(avisoPublico('agent_runs', r.id, a).url, '/#/chat/trabajo/r1');
  }
  assert.equal(avisoPublico('otro', 'r1', { tipo: 'error' }), null);
});
const a = cambioAviso('chat_sesiones', base, fin).aviso_chat;
await db.create('chat_sesiones', { ...fin, aviso_chat: a }, base.owner, base.id);
await db.create('chat_sesiones', { ...fin, owner: 'otra@example.test', aviso_chat: { ...a, id: 'otro', owner: 'otra@example.test' } }, 'otra@example.test', 's2');
const u = effective(await userFor(base.owner), await viewsDoc());
await test('la consulta solo devuelve avisos propios y no mensajes ni dueños', async () => {
  const xs = await avisosChatDe(u); assert.equal(xs.length, 1); assert.equal(xs[0].url, '/#/chat/s1');
  assert.ok(!JSON.stringify(xs).includes('PRIVADO')); assert.ok(!JSON.stringify(xs).includes('@'));
  assert.deepEqual(await avisosChatDe({ ...u, role: 'client' }), []);
  assert.deepEqual(await avisosChatDe({ ...u, active: false }), []);
});
await test('un aviso no cruza de dueño ni de alcance de cliente', async () => {
  await db.create('chat_sesiones', { ...fin, owner: 'otra@example.test', aviso_chat: a }, base.owner, 'falso');
  await db.create('chat_sesiones', { ...fin, cliente: 'cliente-sintetico', aviso_chat: { ...a, id: 'restringido' } }, base.owner, 'restringido');
  const xs = await avisosChatDe({ ...u, role: 'team', scope: 'propio' });
  assert.equal(xs.length, 1); assert.equal(xs[0].url, '/#/chat/s1');
  await db.remove('chat_sesiones', 'falso', base.owner); await db.remove('chat_sesiones', 'restringido', base.owner);
});
await test('si falla push el evento sigue pendiente; al entregar no se repite', async () => {
  const r = await entregarAvisosChat(async () => { throw new Error('red caída'); });
  assert.ok(r.pendientes > 0); assert.equal((await db.get('chat_sesiones', 's1')).aviso_chat.enviado, false);
  const envios = []; await entregarAvisosChat(async (email, aviso) => { envios.push({ email, aviso }); });
  assert.ok(envios.some((x) => x.email === base.owner && x.aviso.url === '/#/chat/s1'));
  assert.equal((await db.get('chat_sesiones', 's1')).aviso_chat.enviado, true);
  await entregarAvisosChat(async () => { throw new Error('No debe repetirse'); });
  assert.equal((await db.avisosChat({ pendientes: true })).length, 0);
});
await test('confirmar un aviso viejo no pisa un evento nuevo', async () => {
  await db.upsert('chat_sesiones', 's1', { aviso_chat: { ...a, id: 'nuevo' } }, base.owner);
  await db.avisoChatEntregado('chat_sesiones', 's1', a.id);
  assert.equal((await db.get('chat_sesiones', 's1')).aviso_chat.enviado, false);
});
await test('la ruta de entrega exige autenticación del Gateway', async () => {
  const rutas = new Map(); rutasChatAvisos((m, p, fn) => rutas.set(`${m} ${p}`, fn), async () => { throw new Error('No debe enviar'); });
  let status = 200; const res = { status: (s) => { status = s; return res; }, json: () => {} };
  await rutas.get('POST avisos/chat/entregar')({ headers: {} }, res); assert.equal(status, 401);
});
console.log(`${n} pruebas de avisos del Chat OK`);
