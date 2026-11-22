// Canales de mensajería: Telegram (completo), WhatsApp Cloud e iMessage (adaptadores). Sin red: PGlite temporal y envío falso.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-canales-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com'; process.env.APP_URL = 'https://os.example';
const SEC = { tg: 'tok-SECRETO-telegram-123', wh: 'webhook-SECRETO-456', cs: 'canales-SECRETO-789', wa: 'wa-app-SECRETO-321', wv: 'wa-verify-SECRETO', wt: 'wa-token-SECRETO', wp: '1555000111' };
Object.assign(process.env, { TELEGRAM_BOT_TOKEN: SEC.tg, TELEGRAM_WEBHOOK_SECRET: SEC.wh, CANALES_SECRETO: SEC.cs, WHATSAPP_APP_SECRET: SEC.wa, WHATSAPP_VERIFY_TOKEN: SEC.wv, WHATSAPP_TOKEN: SEC.wt, WHATSAPP_PHONE_ID: SEC.wp });
const M = await import('../public/js/canales/mensajeria.js'), C = await import('../api/_lib/canales.js'), db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js'), api = (await import('../api/index.js')).default;
// Las rutas de canales se montan aquí con el mismo `on` que usará api/index.js (esa línea la pone quien integre); lo demás va por el api real.
const montadas = []; C.rutas((method, pattern, fn) => montadas.push({ method, re: new RegExp('^' + pattern + '$'), fn }));
const despacha = async (req, res) => { const ruta = req.url.replace(/^\/api\//, ''), r = montadas.find((x) => x.method === req.method && x.re.test(ruta)); return r ? r.fn(req, res) : api(req, res); };
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };

// ---------- Utilidades ----------
const sent = [], logs = [];
C.configurar({ enviarMensaje: async (m) => { sent.push(m); return { ok: true }; }, log: (o) => logs.push(o) });
const limpiar = () => { sent.length = 0; logs.length = 0; C.reiniciar(); };
const email = (r) => `${r}@inherentglobal.com`;
async function call(role, route, method = 'POST', b = {}, headers = { 'x-ceoos': '1' }, query = {}) {
  const h = { host: 'localhost', ...headers }, jar = new Map(), res = { statusCode: 200, text: '', getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, write() {}, end(t) { if (t) this.text = t; } };
  const req = { url: `/api/${route}`, method, headers: h, body: b, query, params: {} };
  if (role) { session.issue(req, res, { email: email(role) }); h.cookie = jar.get('Set-Cookie').split(';')[0]; }
  await despacha(req, res); return { status: res.statusCode, data: res.data, text: res.text };
}
const tgUpdate = (chat, text) => ({ update_id: 1, message: { message_id: 1, from: { id: chat, is_bot: false }, chat: { id: chat, type: 'private' }, text } });
const tgCb = (chat, data) => ({ update_id: 2, callback_query: { id: 'cb1', from: { id: chat, is_bot: false }, data, message: { message_id: 5, chat: { id: chat, type: 'private' } } } });
const hook = (b) => call(null, 'canales/telegram/webhook', 'POST', b, { 'x-telegram-bot-api-secret-token': SEC.wh });
const decir = async (chat, text) => { limpiar(); return hook(tgUpdate(chat, text)); };
const aChat = (chat) => sent.filter((m) => m.chatId === String(chat) && !m.ack);
async function vincular(role, chat, canal = 'telegram') {
  const r = await call(role, 'canales/vincular', 'POST', { canal }); assert.equal(r.status, 200); limpiar();
  await (canal === 'telegram' ? hook(tgUpdate(chat, `/vincular ${r.data.codigo}`)) : hook(tgUpdate(chat, '/ayuda')));
  return r.data.codigo;
}

// ---------- Puro ----------
await test('Telegram: texto, voz, callback y comando se normalizan; el HTML del usuario es solo texto', () => {
  const t = M.parsearTelegram(tgUpdate(7, '  <b>hola</b>‮   mundo  '));
  assert.deepEqual([t.canal, t.chatId, t.tipo, t.texto], ['telegram', '7', 'texto', '<b>hola</b> mundo']);
  assert.equal(M.parsearTelegram({ message: { from: { id: 7 }, chat: { id: 7, type: 'private' }, voice: { file_id: 'F1' } } }).archivoId, 'F1');
  const c = M.parsearTelegram(tgCb(7, M.firmarCallback({ accion: 'aprobar', id: 'abc', v: 3 }, '7', 's'))); assert.equal(c.tipo, 'callback'); assert.equal(c.callback.accion, 'aprobar'); assert.equal(c.callback.v, 3);
  assert.equal(M.parsearTelegram(tgUpdate(7, '/hoy')).tipo, 'comando');
  assert.equal(M.parsearTelegram({ message: { from: { id: 7 }, chat: { id: 7, type: 'private' }, text: 'x', entities: [{ type: 'text_link', url: 'https://malo.example' }] } }).texto, 'x');
});
await test('Telegram: grupos, bots, callbacks mal formados y mensajes sin texto se ignoran', () => {
  assert.equal(M.parsearTelegram({ message: { from: { id: 1 }, chat: { id: -100, type: 'supergroup' }, text: 'hola' } }), null);
  assert.equal(M.parsearTelegram({ message: { from: { id: 1, is_bot: true }, chat: { id: 1, type: 'private' }, text: 'hola' } }), null);
  assert.equal(M.parsearTelegram(tgCb(7, 'a|x|1|corta')), null); assert.equal(M.parsearTelegram({ message: { from: { id: 1 }, chat: { id: 1, type: 'private' }, photo: [] } }), null); assert.equal(M.parsearTelegram({}), null);
});
await test('WhatsApp Cloud: texto, audio y botón interactivo; los estados no son mensajes', () => {
  const cb = M.firmarCallback({ accion: 'cambios', id: 'abc', v: 2 }, '5025550100', 's');
  const p = { entry: [{ changes: [{ value: { messages: [{ from: '5025550100', type: 'text', text: { body: 'hola' } }, { from: '5025550100', type: 'audio', audio: { id: 'A1' } }, { from: '5025550100', type: 'interactive', interactive: { button_reply: { id: cb, title: 'Pedir cambios' } } }, { from: 'x', type: 'text', text: { body: 'malo' } }], statuses: [{ id: 'z' }] } }] }] };
  const r = M.parsearWhatsAppCloud(p); assert.deepEqual(r.map((x) => x.tipo), ['texto', 'voz', 'callback']); assert.equal(r[2].callback.accion, 'cambios'); assert.deepEqual(M.parsearWhatsAppCloud({}), []);
});
await test('firma de WhatsApp: válida, alterada, sin prefijo y sin secreto', () => {
  const cuerpo = '{"a":"é"}', sig = 'sha256=' + crypto.createHmac('sha256', 'k').update(cuerpo).digest('hex');
  assert.equal(M.verificarFirmaWhatsApp(cuerpo, sig, 'k'), true); assert.equal(M.verificarFirmaWhatsApp(cuerpo + ' ', sig, 'k'), false); assert.equal(M.verificarFirmaWhatsApp(cuerpo, sig, 'otro'), false);
  assert.equal(M.verificarFirmaWhatsApp(cuerpo, sig.slice(7), 'k'), false); assert.equal(M.verificarFirmaWhatsApp(cuerpo, sig, ''), false); assert.equal(M.verificarFirmaWhatsApp(cuerpo, 'sha256=zz', 'k'), false);
});
await test('secreto de Telegram: solo el exacto (y nunca vacío)', () => {
  assert.equal(M.verificarSecretoTelegram('abc', 'abc'), true); assert.equal(M.verificarSecretoTelegram('abd', 'abc'), false); assert.equal(M.verificarSecretoTelegram('abc', ''), false); assert.equal(M.verificarSecretoTelegram(undefined, 'abc'), false); assert.equal(M.verificarSecretoTelegram('abcd', 'abc'), false);
});
await test('MarkdownV2: cada carácter especial se escapa', () => {
  const hostil = '_*[]()~`>#+-=|{}.!\\';
  assert.equal(M.formatoTelegram(hostil), [...hostil].map((c) => '\\' + c).join(''));
  assert.equal(M.formatoTelegram('Hola mundo 123'), 'Hola mundo 123');
  const tarj = M.tarjetaDecision({ id: 'a1', v: 1, titulo: 'Plan *v2* (final)!', client_slug: 'al_pha', puede: { aprobar: true } }, { chatId: '9', secreto: 's' });
  assert.doesNotMatch(tarj.md.replace(/\\./g, ''), /[_[\]()~`>#+=|{}.!-]/, 'tras quitar lo escapado no queda nada especial');
});
await test('callback_data: firmado, ≤ 64 bytes, y alterar acción, id, versión o chat lo rechaza', () => {
  const d = M.firmarCallback({ accion: 'aprobar', id: 'mp1k2x3abcd1234', v: 12 }, '555', 's'); assert.ok(Buffer.byteLength(d) <= 64);
  const cb = M.parsearCallback(d); assert.equal(M.verificarCallback(cb, '555', 's'), true);
  assert.equal(M.verificarCallback({ ...cb, id: 'otro' }, '555', 's'), false); assert.equal(M.verificarCallback({ ...cb, v: 13 }, '555', 's'), false); assert.equal(M.verificarCallback({ ...cb, accion: 'cambios' }, '555', 's'), false);
  assert.equal(M.verificarCallback(cb, '556', 's'), false, 'el botón de otro chat no sirve'); assert.equal(M.verificarCallback(cb, '555', 'otro'), false);
  assert.equal(M.firmarCallback({ accion: 'aprobar', id: 'x'.repeat(80), v: 1 }, '555', 's'), null, 'si no cabe en 64 bytes no se firma');
});
await test('tarjeta: título, marca, razón y qué falta; sensibles y con faltas sin botón de decidir', () => {
  const base = { id: 'a1', v: 1, titulo: 'Moodboard', client_slug: 'alpha', prioridad: { razon: 'Falta un día para el 11' }, puede: { aprobar: true, cambios: true } };
  const t = M.tarjetaDecision(base, { chatId: '9', secreto: 's', appUrl: 'https://os.example' });
  assert.deepEqual(t.botones.map((b) => b.id), ['aprobar', 'cambios', 'abrir']); assert.match(t.texto, /Moodboard[\s\S]*alpha[\s\S]*un día/); assert.ok(t.botones.every((b) => !b.data || Buffer.byteLength(b.data) <= 64));
  assert.deepEqual(M.tarjetaDecision({ ...base, faltas: ['Falta el ICP'] }, { chatId: '9', secreto: 's', appUrl: 'https://os.example' }).botones.map((b) => b.id), ['cambios', 'abrir']);
  for (const x of [{ ...base, tool: 'ads-intelligence' }, { ...base, titulo: 'Presupuesto de pauta de diciembre' }, { ...base, tool: 'pricing-packages' }]) { const s = M.tarjetaDecision(x, { chatId: '9', secreto: 's', appUrl: 'https://os.example' }); assert.deepEqual(s.botones.map((b) => b.id), ['abrir']); assert.equal(s.sensible, true); }
});
await test('comandos', () => {
  assert.deepEqual(M.comandoDe('/vincular abcd-2345'), { comando: 'vincular', arg: 'abcd-2345' }); assert.equal(M.comandoDe('/hoy@InherentBot').comando, 'hoy');
  for (const c of ['decide', 'ayuda', 'baja']) assert.equal(M.comandoDe('/' + c).comando, c); assert.equal(M.comandoDe('/borrartodo').comando, 'desconocido'); assert.equal(M.comandoDe('hola'), null);
});

// ---------- Servidor ----------
fs.mkdirSync(path.join(process.env.LOCAL_REPO, 'clients/alpha/00-onboarding'), { recursive: true });
fs.writeFileSync(path.join(process.env.LOCAL_REPO, 'clients/alpha/00-onboarding/plan-contratado.md'), '# Ficha — Alpha\n\n| Campo | Valor |\n|---|---|\n| Plan | Brand Growth |\n\n## Qué incluye\n\n| Entregable | Cantidad |\n|---|---|\n| Volumen | 2 piezas |\n');
for (const r of ['ceo', 'coo', 'team']) await db.create('team', { role: r, roles: [r], active: true }, 'fixture', email(r));
await db.create('team', { role: 'client', client_slug: 'alpha', external: true, active: true }, 'fixture', 'cliente@alpha.com');
await db.create('settings', { views: { coo: { content: 'edita' } } }, 'fixture', 'role_views');
const base = { client_slug: 'alpha', titulo: 'x', version: 1, aprobado: null, entradas: [], historial: [], criterios: { cumple: [], falta: [] }, contenido: {}, ia: { via: 'manual', modelo: '' } };
const nuevo = (o) => db.create('deliverables', { ...base, tool: 'moodboard-studio', ws: 'creative', pestana: 'concepts', estado: 'En revisión', ...o }, 'fixture');
const CEO = 111, COO = 222;
await test('vincular: el código sirve una vez, está solo como hash y /vincular deja el chat atado a la cuenta', async () => {
  assert.equal((await call(null, 'canales/vincular', 'POST', { canal: 'telegram' })).status, 401);
  assert.equal((await call('ceo', 'canales/vincular', 'POST', { canal: 'imessage' })).status, 400);
  const r = await call('coo', 'canales/vincular', 'POST', { canal: 'telegram' }); assert.match(r.data.codigo, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  const plano = r.data.codigo.replace('-', ''); assert.ok(!(await db.get('canal_codigos', plano)), 'el id no es el código'); assert.doesNotMatch(JSON.stringify(await db.list('canal_codigos')), new RegExp(plano));
  limpiar(); await hook(tgUpdate(COO, `/vincular ${r.data.codigo.toLowerCase()}`)); assert.match(aChat(COO)[0].texto, /vinculado/);
  assert.equal((await db.get('canal_vinculos', `telegram:${COO}`)).email, email('coo'));
  limpiar(); await hook(tgUpdate(999, `/vincular ${r.data.codigo}`)); assert.match(aChat(999)[0].texto, /no sirve/, 'segundo uso: el mismo mensaje que un código inventado');
  const mio = await call('coo', 'canales', 'GET'); assert.equal(mio.data.canales.find((c) => c.id === 'telegram').vinculado, true); assert.equal((await call('team', 'canales', 'GET')).data.canales.find((c) => c.id === 'telegram').vinculado, false);
});
await test('el código vence a los 10 minutos', async () => {
  const r = await call('team', 'canales/vincular', 'POST', { canal: 'telegram' }), id = crypto.createHash('sha256').update(r.data.codigo.replace('-', '')).digest('hex'), d = await db.get('canal_codigos', id);
  await db.update('canal_codigos', id, { ...d, exp: Date.now() - 1 }, d.v, 'test'); limpiar(); await hook(tgUpdate(333, `/vincular ${r.data.codigo}`));
  assert.match(aChat(333)[0].texto, /no sirve o ya venció/); assert.ok(!await db.get('canal_vinculos', 'telegram:333'));
});
await test('CAS: tres canjes a la vez del mismo código, gana uno', async () => {
  const r = await call('team', 'canales/vincular', 'POST', { canal: 'telegram' });
  const res = await Promise.allSettled([1, 2, 3].map((i) => C.canjearCodigo({ canal: 'telegram', chatId: String(400 + i), codigo: r.data.codigo })));
  assert.equal(res.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal((await db.list('canal_vinculos')).filter((v) => v.email === email('team')).length, 1);
});
await test('no vinculado = silencio (ni «no te conozco»); un cliente del portal no puede ni pedir código', async () => {
  for (const t of ['/hoy', 'hola', '/decide', '/baja']) { await decir(888, t); assert.equal(sent.length, 0, t); }
  await db.upsert('team', 'cliente2@alpha.com', { role: 'client', client_slug: 'alpha', external: true, active: true }, 'fixture');
  const jar = new Map(), res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, end() {} }, req = { url: '/api/canales/vincular', method: 'POST', headers: { host: 'localhost', 'x-ceoos': '1' }, body: { canal: 'telegram' }, query: {} };
  session.issue(req, res, { email: 'cliente2@alpha.com' }); req.headers.cookie = jar.get('Set-Cookie').split(';')[0]; await despacha(req, res); assert.equal(res.statusCode, 403);
});
await vincular('ceo', CEO);
const moodboard = await nuevo({ titulo: 'Moodboard de diciembre' }), icp = await nuevo({ tool: 'customer-bullseye', ws: 'strategy', pestana: 'research', titulo: 'ICP' });
await test('/hoy: cada quien ve SOLO sus decisiones, con botones (el COO no ve las del CEO); sin nada, el vacío humano', async () => {
  await decir(COO, '/hoy'); const coo = aChat(COO); assert.equal(coo.length, 1); assert.match(coo[0].texto, /Moodboard de diciembre/); assert.doesNotMatch(JSON.stringify(coo), /ICP/);
  assert.deepEqual(coo[0].botones.map((b) => b.id), ['aprobar', 'cambios', 'abrir']);
  await decir(CEO, '/decide'); assert.deepEqual(aChat(CEO).map((m) => m.texto.split('\n')[0]).sort(), ['ICP', 'Moodboard de diciembre']);
  await db.upsert('canal_vinculos', 'telegram:555', { canal: 'telegram', chatId: '555', email: email('team'), espera: null, ultimo_entrante: Date.now() }, 'test');
  await decir(555, '/hoy'); assert.equal(aChat(555)[0].texto, 'Nada espera por ti. Disfruta.');
});
const botonDe = (chat, id) => aChat(chat).flatMap((m) => m.botones || []).find((b) => b.id === id);
await test('aprobar por Telegram pasa por la ruta de la web: queda Aprobado, con quién y desde qué versión', async () => {
  await decir(COO, '/hoy'); const b = botonDe(COO, 'aprobar'); limpiar();
  await hook(tgCb(COO, b.data)); assert.match(aChat(COO)[0].texto, /^Aprobado: Moodboard/); assert.ok(sent.some((m) => m.ack), 'se responde el toque del botón');
  const d = await db.get('deliverables', moodboard.id); assert.equal(d.estado, 'Aprobado'); assert.equal(d.aprobado.por, email('coo'));
});
await test('versión vieja: 409 amable y no se aprueba', async () => {
  const d = await nuevo({ titulo: 'Se movió' }); limpiar(); await C.enviarDecision(email('coo'), d); const b = botonDe(COO, 'aprobar'); const cur = await db.get('deliverables', d.id);
  await db.update('deliverables', d.id, { ...cur, version: 2 }, cur.v, 'test'); limpiar(); await hook(tgCb(COO, b.data));
  assert.match(aChat(COO)[0].texto, /Cambió mientras lo veías: ábrelo en el OS/); assert.equal((await db.get('deliverables', d.id)).estado, 'En revisión');
});
await test('criterios en falta: la tarjeta no ofrece Aprobar y un botón forjado tampoco aprueba', async () => {
  const d = await nuevo({ titulo: 'Con huecos', criterios: { cumple: [], falta: ['Falta el brief'] } }); limpiar(); await C.enviarDecision(email('coo'), d);
  const card = aChat(COO).find((m) => /Con huecos/.test(m.texto)); assert.match(card.texto, /Falta: Falta el brief/); assert.deepEqual(card.botones.map((b) => b.id), ['cambios', 'abrir']);
  limpiar(); await hook(tgCb(COO, M.firmarCallback({ accion: 'aprobar', id: d.id, v: d.v }, String(COO), SEC.cs))); assert.match(aChat(COO)[0].texto, /No se puede aprobar todavía\. Falta: Falta el brief/); assert.equal((await db.get('deliverables', d.id)).estado, 'En revisión');
});
await test('rol sin permiso: el COO no aprueba lo del CEO ni con un botón bien firmado', async () => {
  limpiar(); await hook(tgCb(COO, M.firmarCallback({ accion: 'aprobar', id: icp.id, v: icp.v }, String(COO), SEC.cs))); assert.match(aChat(COO)[0].texto, /No puedes decidir esto/); assert.equal((await db.get('deliverables', icp.id)).estado, 'En revisión');
});
await test('botón ajeno o alterado: no sirve (otro chat, otra versión, firma inventada)', async () => {
  const d = await nuevo({ titulo: 'Otro' }), buena = M.firmarCallback({ accion: 'aprobar', id: d.id, v: d.v }, String(COO), SEC.cs);
  limpiar(); await hook(tgCb(CEO, buena)); assert.match(aChat(CEO)[0].texto, /no sirve/);
  limpiar(); await hook(tgCb(COO, buena.replace(/\|\d+\|/, '|99|'))); assert.match(aChat(COO)[0].texto, /no sirve/); assert.equal((await db.get('deliverables', d.id)).estado, 'En revisión');
});
await test('pauta, presupuesto y precio NUNCA se resuelven por mensaje: solo «Abrir en el OS»', async () => {
  const d = await nuevo({ tool: 'ads-intelligence', ws: 'marketing', pestana: 'campaigns', titulo: 'Plan de pauta' }), p = await nuevo({ titulo: 'Precio del paquete' });
  limpiar(); for (const x of [d, p]) await C.enviarDecision(email('ceo'), x); for (const t of ['Plan de pauta', 'Precio del paquete']) assert.deepEqual(aChat(CEO).find((m) => m.texto.startsWith(t)).botones.map((b) => b.id), ['abrir']);
  for (const x of [d, p]) { limpiar(); await hook(tgCb(CEO, M.firmarCallback({ accion: 'aprobar', id: x.id, v: x.v }, String(CEO), SEC.cs))); assert.match(aChat(CEO)[0].texto, /se decide en el OS/); assert.equal((await db.get('deliverables', x.id)).estado, 'En revisión'); }
});
await test('pedir cambios: pregunta qué y el siguiente mensaje es la nota; el entregable vuelve a Borrador', async () => {
  const d = await nuevo({ titulo: 'Para cambiar' }); limpiar(); await C.enviarDecision(email('coo'), d); const b = aChat(COO).find((m) => /Para cambiar/.test(m.texto)).botones.find((x) => x.id === 'cambios');
  limpiar(); await hook(tgCb(COO, b.data)); assert.match(aChat(COO)[0].texto, /Qué hay que cambiar/);
  limpiar(); await hook(tgUpdate(COO, 'Más aire en el logo')); assert.match(aChat(COO)[0].texto, /pedí cambios/);
  const cur = await db.get('deliverables', d.id); assert.equal(cur.estado, 'Borrador'); assert.match(cur.historial.at(-1).nota, /Más aire en el logo/);
});
await test('tope de mensajes por chat: el exceso se avisa una vez y luego silencio', async () => {
  C.configurar({ tope: { max: 3, ventanaMs: 60_000 } }); limpiar();
  for (let i = 0; i < 8; i++) await hook(tgUpdate(COO, '/ayuda'));
  assert.equal(aChat(COO).length, 4); assert.match(aChat(COO)[3].texto, /muy rápido/); C.configurar({ tope: { max: 100 } }); limpiar();
});
await test('webhook de Telegram: sin secreto o con otro, 401 sin cuerpo; con el bueno, 200', async () => {
  for (const h of [{}, { 'x-telegram-bot-api-secret-token': 'otro' }]) { const r = await call(null, 'canales/telegram/webhook', 'POST', tgUpdate(COO, '/hoy'), h); assert.equal(r.status, 401); assert.equal(r.data, undefined); }
  assert.equal(sent.length, 0); assert.equal((await hook(tgUpdate(COO, '/ayuda'))).status, 200);
});
await test('texto libre y voz: sin gateway ni transcripción responden honesto y lo registran; con ellos, pasan por responder()', async () => {
  await decir(COO, 'hola, ¿cómo vamos?'); assert.equal(aChat(COO)[0].texto, 'El chat aún no está conectado a este canal.'); assert.ok(logs.some((l) => l.evt === 'canal_sin_chat'));
  limpiar(); await hook({ message: { from: { id: COO }, chat: { id: COO, type: 'private' }, voice: { file_id: 'F' } } }); assert.match(aChat(COO)[0].texto, /notas de voz/);
  const vistos = []; C.configurar({ responder: async (t, u) => { vistos.push([t, u.email]); return 'Todo bien *_[x]'; }, transcribir: async () => 'dime el estado' });
  await decir(COO, 'hola'); assert.deepEqual(vistos[0], ['hola', email('coo')]); assert.equal(aChat(COO)[0].texto, 'Todo bien *_[x]');
  limpiar(); await hook({ message: { from: { id: COO }, chat: { id: COO, type: 'private' }, voice: { file_id: 'F' } } }); assert.equal(vistos.at(-1)[0], 'dime el estado'); C.configurar({ responder: null, transcribir: null });
});
await test('/baja desvincula; después, silencio', async () => {
  await decir(COO, '/baja'); assert.match(aChat(COO)[0].texto, /ya no te escribo/); assert.ok(!await db.get('canal_vinculos', `telegram:${COO}`));
  await decir(COO, '/hoy'); assert.equal(sent.length, 0);
  assert.equal((await call('coo', 'canales/desvincular', 'POST', { canal: 'telegram' })).data.desvinculados, 0); await vincular('coo', COO);
});
await test('enviarDecision / enviarAviso: solo a vinculados y solo lo que es suyo; sin envío inyectado, desconectado', async () => {
  const d = await nuevo({ titulo: 'Nueva para el COO' }); limpiar();
  assert.equal((await C.enviarDecision(email('coo'), d)).enviados, 1); assert.match(aChat(COO)[0].texto, /Nueva para el COO/);
  limpiar(); assert.equal((await C.enviarDecision(email('team'), d)).motivo, 'no_es_tuya'); assert.equal((await C.enviarDecision(email('ceo'), icp)).enviados, 1);
  limpiar(); assert.equal((await C.enviarAviso('nadie@inherentglobal.com', 'hola')).enviados, 0); assert.equal((await C.enviarAviso(email('coo'), '*aviso*')).enviados, 1);
  assert.equal(sent.some((m) => m.chatId === '555'), false, 'quien no es el destinatario no recibe nada');
  C.configurar({ enviarMensaje: null, fetchImpl: async () => { throw new Error('sin red'); } }); const prev = process.env.TELEGRAM_BOT_TOKEN; delete process.env.TELEGRAM_BOT_TOKEN;
  assert.equal((await C.enviarAviso(email('coo'), 'x')).enviados, 0); process.env.TELEGRAM_BOT_TOKEN = prev;
  C.configurar({ enviarMensaje: async (m) => { sent.push(m); return { ok: true }; }, fetchImpl: null });
});
await test('un cliente del portal nunca recibe nada, ni con un vínculo forjado', async () => {
  await db.upsert('canal_vinculos', 'telegram:777', { canal: 'telegram', chatId: '777', email: 'cliente@alpha.com', espera: null, ultimo_entrante: Date.now() }, 'test'); limpiar();
  assert.equal((await C.enviarAviso('cliente@alpha.com', 'hola')).motivo, 'sin_permiso'); assert.equal((await C.enviarDecision('cliente@alpha.com', moodboard)).enviados, 0);
  await hook(tgUpdate(777, '/hoy')); assert.equal(sent.length, 0);
});
await test('WhatsApp: firma obligatoria, desafío de verificación y misma lógica que Telegram', async () => {
  const wa = (texto, from = '50255501') => ({ entry: [{ changes: [{ value: { messages: [{ from, type: 'text', text: { body: texto } }] } }] }] });
  const firmar = (b) => ({ 'x-hub-signature-256': 'sha256=' + crypto.createHmac('sha256', SEC.wa).update(b).digest('hex') });
  const r = await call('team', 'canales/vincular', 'POST', { canal: 'whatsapp' }); limpiar();
  const ok = async (b) => call(null, 'canales/whatsapp/webhook', 'POST', b, firmar(JSON.stringify(b)));
  assert.equal((await call(null, 'canales/whatsapp/webhook', 'POST', wa('/hoy'), { 'x-hub-signature-256': 'sha256=' + '0'.repeat(64) })).status, 401); assert.equal((await call(null, 'canales/whatsapp/webhook', 'POST', wa('/hoy'), {})).status, 401);
  assert.equal((await ok(wa(`/vincular ${r.data.codigo}`))).status, 200); assert.match(sent[0].texto, /vinculado/); assert.equal(sent[0].canal, 'whatsapp');
  const g = (t, m = 'subscribe') => call(null, 'canales/whatsapp/webhook', 'GET', {}, {}, { 'hub.mode': m, 'hub.verify_token': t, 'hub.challenge': '12345' });
  assert.equal((await g(SEC.wv)).text, '12345'); assert.equal((await g('malo')).status, 403); assert.equal((await g(SEC.wv, 'x')).status, 403);
});
await test('WhatsApp fuera de la ventana de 24 h: no envía y queda pendiente; dentro, sí', async () => {
  const v = await db.get('canal_vinculos', 'whatsapp:50255501'); limpiar();
  await db.update('canal_vinculos', v.id, { ...v, ultimo_entrante: Date.now() - 25 * 36e5 }, v.v, 'test');
  const fuera = await C.enviarAviso(email('team'), 'hola'); assert.equal(fuera.motivo, 'ventana_24h'); assert.equal(sent.filter((m) => m.canal === 'whatsapp').length, 0, 'no escribe fuera de la ventana');
  assert.equal((await db.list('canal_pendientes')).length, 1);
  const v2 = await db.get('canal_vinculos', v.id); await db.update('canal_vinculos', v.id, { ...v2, ultimo_entrante: Date.now() - 1000 }, v2.v, 'test'); limpiar();
  await C.enviarAviso(email('team'), 'hola'); assert.equal(sent.filter((m) => m.canal === 'whatsapp').length, 1);
});
await test('adaptador de Telegram real (con fetch falso): arma el envío, escapa y no filtra el token; iMessage dice por qué está desconectado', async () => {
  const pedidos = []; C.configurar({ enviarMensaje: null, fetchImpl: async (url, o) => { pedidos.push({ url, b: JSON.parse(o.body) }); return { ok: true }; } });
  await C.adaptadores.telegram.enviar({ canal: 'telegram', chatId: '9', texto: 'a_b *c*', botones: [{ id: 'abrir', label: 'Abrir en el OS', url: 'https://os.example/#/decide' }] });
  assert.match(pedidos[0].url, /api\.telegram\.org\/bot.+\/sendMessage$/); assert.equal(pedidos[0].b.text, 'a\\_b \\*c\\*'); assert.equal(pedidos[0].b.reply_markup.inline_keyboard[0][0].url, 'https://os.example/#/decide');
  C.configurar({ fetchImpl: async () => { throw new Error(`falló https://api.telegram.org/bot${SEC.tg}/sendMessage`); } }); limpiar();
  C.configurar({ log: (o) => logs.push(o) }); await C.adaptadores.telegram.enviar({ canal: 'telegram', chatId: '9', texto: 'x' });
  assert.doesNotMatch(JSON.stringify(logs), new RegExp(SEC.tg)); C.configurar({ enviarMensaje: async (m) => { sent.push(m); return { ok: true }; }, fetchImpl: null });
  const im = C.adaptadores.imessage.capability(); assert.equal(im.estado, 'disconnected'); assert.match(im.razon, /Mac encendido/); assert.equal((await C.adaptadores.imessage.enviar({})).ok, false);
});
await test('las colecciones no salen por /api/db y ningún secreto aparece en GET /api/canales ni en lo guardado', async () => {
  for (const coll of ['canal_vinculos', 'canal_codigos', 'canal_pendientes']) for (const m of ['GET', 'POST']) assert.equal((await call('ceo', `db/${coll}`, m, { x: 1 })).status, 404);
  const g = await call('ceo', 'canales', 'GET'); assert.equal(g.status, 200); assert.deepEqual(g.data.canales.map((c) => [c.id, c.estado]), [['telegram', 'ready'], ['whatsapp', 'ready'], ['imessage', 'disconnected']]);
  const todo = JSON.stringify(g.data) + JSON.stringify(await db.list('canal_vinculos')) + JSON.stringify(await db.list('canal_codigos')) + JSON.stringify(logs);
  for (const s of Object.values(SEC)) assert.ok(!todo.includes(s), `filtró ${s}`);
  delete process.env.TELEGRAM_BOT_TOKEN; assert.equal((await call('ceo', 'canales', 'GET')).data.canales[0].estado, 'disconnected'); assert.equal((await call('ceo', 'canales/vincular', 'POST', { canal: 'telegram' })).status, 409); process.env.TELEGRAM_BOT_TOKEN = SEC.tg;
});
console.log(`${count} pruebas de Canales OK`);
