import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.ALLOWED_DOMAIN = 'example.test'; process.env.LOCAL_DB = 'memory://'; process.env.ADMIN_EMAILS = 'prueba@example.test'; process.env.SESSION_SECRET = 'solo-pruebas-locales-sin-secretos-reales';
const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-fixture-')); process.env.LOCAL_REPO = repo;
const db = await import('../api/_lib/db.js');
const { validarImagenes, guardarImagenes, cargarImagen } = await import('../api/_lib/chat-imagenes.js');
const { leerImagen, textoConImagenes } = await import('../gateway/vision.mjs');
const { canRead, canWrite } = await import('../api/_lib/access.js');
const { rutas } = await import('../api/_lib/chat.js');
const session = await import('../api/_lib/session.js');
const data = 'data:image/jpeg;base64,' + fs.readFileSync(new URL('./fixtures/vision-formas.jpg', import.meta.url)).toString('base64');
let n = 0; const test = async (name, f) => { await f(); console.log('✓', name); n++; };
const xs = validarImagenes([{ nombre: 'formas.jpg', data }]);
await test('valida bytes y dimensiones; rechaza URLs, SVG, exceso y JPEG dañado', () => {
  assert.equal(xs[0].width, 400); assert.equal(xs[0].height, 240);
  for (const x of [{ data: 'https://ejemplo.test/a.jpg' }, { data: 'data:image/svg+xml;base64,PHN2Zz4=' }, { data: 'data:image/jpeg;base64,YWJj' }, { data: 'data:image/jpeg;base64,' + 'A'.repeat(250000) }]) assert.throws(() => validarImagenes([x]));
  assert.throws(() => validarImagenes([...xs, ...xs, ...xs]));
});
const owner = 'prueba@example.test', imagenes = await guardarImagenes(xs, owner, 's1');
const s = { id: 's1', owner, mensajes: [{ role: 'user', content: '¿Qué formas ves?', imagenes }] };
await test('solo carga imágenes referidas por la conversación y del mismo dueño', async () => {
  assert.ok(await cargarImagen(s, imagenes[0].id));
  assert.equal(await cargarImagen({ ...s, owner: 'otra@example.test' }, imagenes[0].id), null);
  assert.equal(await cargarImagen({ ...s, mensajes: [] }, imagenes[0].id), null);
  for (const rol of ['ceo', 'coo', 'team', 'client']) { assert.equal(canRead(rol, 'chat_imagenes'), false); assert.equal(canWrite(rol, 'chat_imagenes'), false); }
});
await test('la llamada de visión recibe píxeles reales y el historial solo recibe su lectura', async () => {
  let llamada;
  const lectura = await leerImagen(s, imagenes[0].id, '¿Qué formas ves?', { pedir: async (...args) => { llamada = args; return { content: 'Cuadrado rojo y círculo azul.' }; } });
  assert.equal(llamada[0], 'kimi-k3'); assert.equal(llamada[4].messages.length, 1);
  assert.equal(llamada[4].messages[0].content[1].image_url.url, data);
  const texto = textoConImagenes({ ...s.mensajes[0], vision: [lectura] });
  assert.match(texto, /Cuadrado rojo/); assert.ok(!texto.includes('base64'));
  await assert.rejects(leerImagen(s, 'ajena', 'test', { pedir: async () => { throw new Error('No debe llamar'); } }), /no pertenece/);
});
const endpoints = new Map(); rutas((m, p, fn) => endpoints.set(`${m} ${p}`, fn));
async function llamar(key, body = {}, email = owner, params = {}) {
  const req = { method: key.split(' ')[0], headers: { 'user-agent': 'prueba-imagenes', 'x-ceoos': '1' }, body, params: { id: 's1', ...params }, query: {} };
  const headers = {}; const res = { code: 200, status(c) { this.code = c; return this; }, setHeader(k, v) { headers[k] = v; }, getHeader(k) { return headers[k]; }, json(x) { this.result = x; }, end(x) { this.bytes = x; } };
  session.issue(req, res, { email }); req.headers.cookie = [].concat(headers['Set-Cookie']).map((x) => x.split(';')[0]).join('; ');
  await endpoints.get(key)(req, res); return res;
}
await db.create('chat_sesiones', { ...s, turno: null }, owner, 's1');
await db.upsert('gateway_estado', 'vps', { at: new Date().toISOString(), modelos: ['kimi-k3'] }, owner);
await test('API real: encola imágenes como referencias y las sirve solo al dueño', async () => {
  const r = await llamar('POST chat/sesiones/:id/turno', { mensaje: 'Mira estas formas', modelo: 'kimi-k3', imagenes: [{ nombre: 'formas.jpg', data }] });
  assert.equal(r.code, 200); assert.equal(r.result.imagenes.length, 1);
  const d = await db.get('chat_sesiones', 's1'); assert.ok(!JSON.stringify(d).includes('base64')); assert.equal(d.turno.estado, 'en_cola');
  const id = r.result.imagenes[0].id;
  const own = await llamar('GET chat/sesiones/:id/imagenes/:imagen', {}, owner, { imagen: id }); assert.equal(own.code, 200); assert.ok(own.bytes.length > 100);
  const other = await llamar('GET chat/sesiones/:id/imagenes/:imagen', {}, 'otra@example.test', { imagen: id }); assert.equal(other.code, 404);
});
fs.rmSync(repo, { recursive: true, force: true });
console.log(`${n} pruebas de imágenes OK`);
