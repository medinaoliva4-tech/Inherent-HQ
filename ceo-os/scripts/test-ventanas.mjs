import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http'; import { spawn } from 'node:child_process';
import { validarPlan, pendiente, repeticion, cerrarLlamadas, resumirVentana } from '../gateway/ventanas.mjs';
import { tokensDe } from '../gateway/contexto.mjs';
let n = 0; const test = async (nombre, fn) => { await fn(); n++; console.log('✓', nombre); };
await test('plan acotado, una tarea activa y bloqueo explícito', () => {
 assert.throws(() => validarPlan({ tareas: [] }));
 assert.throws(() => validarPlan({ tareas: [{ titulo: 'A', estado: 'en_curso' }, { titulo: 'B', estado: 'en_curso' }] }));
 const p = validarPlan({ tareas: [{ titulo: 'A', estado: 'hecha' }, { titulo: 'B', estado: 'pendiente' }], permisos: 'todo' });
 assert.equal(pendiente(p).titulo, 'B'); assert.ok(!('permisos' in p)); assert.equal(pendiente({ ...p, bloqueo: 'Falta decidir' }), false);
});
await test('corta ciclos y reconstruye llamadas sin inventar resultados tras un corte', () => {
 const repetido = repeticion(); assert.equal(repetido('leer', {}, 'igual'), false); assert.equal(repetido('leer', {}, 'igual'), false); assert.equal(repetido('leer', {}, 'igual'), true);
 const h = cerrarLlamadas([{ role: 'assistant', tool_calls: [{ id: 'a' }, { id: 'b' }] }, { role: 'tool', tool_call_id: 'a', content: 'Guardado' }]);
 assert.equal(h.length, 3); assert.equal(h[1].content, 'Guardado'); assert.equal(h[2].tool_call_id, 'b'); assert.match(h[2].content, /no hay resultado confirmado/);
});
await test('el resumen cabe, conserva objetivo y no recibe herramientas', async () => {
 let pedido;
 const r = await resumirVentana([{ role: 'tool', content: 'evidencia '.repeat(18000) }], { modelo: 'kimi-k3', objetivo: 'Terminar el encargo', plan: null, tope: 16000, pedir: async (...a) => { pedido = a[4]; return { content: 'Relevo comprobado.' }; } });
 assert.ok(tokensDe(pedido.messages) <= 16000); assert.equal(pedido.tools, undefined); assert.match(JSON.stringify(pedido.messages), /Terminar el encargo/); assert.equal(r.texto, 'Relevo comprobado.');
});
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inherent-ventanas-')); fs.writeFileSync(path.join(tmp, 'datos.txt'), Array.from({ length: 30 }, (_, i) => `dato ${i + 1}`).join('\n'));
let modo = 'cli', llamadas = 0, resumenes = 0, ultimoPedido;
const planes = (hechas, total = 10) => ({ tareas: Array.from({ length: total }, (_, i) => ({ titulo: `Tarea ${i + 1}`, estado: i < hechas ? 'hecha' : i === hechas ? 'en_curso' : 'pendiente' })) });
const srv = http.createServer(async (req, res) => {
 if (req.url.endsWith('/models')) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ data: [{ id: 'kimi-k3' }] })); }
 let raw = ''; for await (const c of req) raw += c; const j = JSON.parse(raw); ultimoPedido = j;
 assert.ok(tokensDe(j.messages, j.tools) + j.max_tokens < 32768);
 let delta, finish = 'stop';
 if (modo === 'cancelar') return;
 if (j.messages[0]?.content.startsWith('Crea un relevo')) { resumenes++; delta = { content: 'Se verificaron los pasos previos; sigue con la tarea pendiente y conserva los permisos.' }; }
 else {
  llamadas++;
  let tool;
  if (modo === 'cli' && llamadas <= 14) tool = { name: 'leer', arguments: JSON.stringify({ ruta: 'datos.txt', desde: llamadas, hasta: llamadas }) };
  if (modo === 'ciclo') tool = { name: 'leer', arguments: JSON.stringify({ ruta: 'datos.txt', desde: 1, hasta: 1 }) };
  if (modo === 'permiso' && llamadas === 1) tool = { name: 'escribir', arguments: JSON.stringify({ ruta: 'no-autorizado.txt', contenido: 'No debe escribirse' }) };
  if (modo === 'worker' && llamadas <= 9) tool = { name: 'actualizar_plan', arguments: JSON.stringify(planes(llamadas - 1)) };
  if (modo === 'worker' && llamadas === 11) tool = { name: 'actualizar_plan', arguments: JSON.stringify(planes(10)) };
  delta = tool ? { tool_calls: [{ index: 0, id: `c${llamadas}`, type: 'function', function: tool }] } : { content: modo === 'worker' && llamadas === 10 ? 'Sigo con la última tarea.' : 'Encargo terminado.' }; if (tool) finish = 'tool_calls';
 }
 res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.end('data: ' + JSON.stringify({ choices: [{ delta, finish_reason: finish }], usage: { prompt_tokens: 20, completion_tokens: 5 } }) + '\n\ndata: [DONE]\n\n');
});
async function cli(proyecto) {
 return new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [new URL('./inherent.mjs', import.meta.url).pathname, proyecto, 'Completa el encargo sintético'], { cwd: tmp, env: { ...process.env, INHERENT_DIR: tmp, TMPDIR: tmp, LITELLM_BASE: `http://127.0.0.1:${srv.address().port}/v1`, LITELLM_MASTER_KEY: 'fixture-local' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', err = ''; child.stdout.on('data', x => out += x); child.stderr.on('data', x => err += x);
  const timer = setTimeout(() => { child.kill(); reject(new Error('El arnés no terminó')); }, 15000);
  child.on('error', reject); child.on('close', code => { clearTimeout(timer); resolve({ code, out, err }); });
 });
}
try {
 await new Promise(r => srv.listen(0, '127.0.0.1', r));
 await test('terminal real supera 12 pasos, abre otra ventana y termina sin pedir seguir', async () => {
  const r = await cli('largo'); assert.equal(r.code, 0, r.err); assert.equal(llamadas, 15); assert.equal(resumenes, 1); assert.match(r.out, /Ventana 2/); assert.ok(!r.out.includes('Dime si sigo'));
  const s = JSON.parse(fs.readFileSync(path.join(tmp, 'largo.json'))); assert.equal(s.trabajo.estado, 'terminado'); assert.equal(s.trabajo.ventana, 2); assert.ok(fs.existsSync(path.join(tmp, 'largo.historial.jsonl'))); assert.equal(fs.statSync(path.join(tmp, 'largo.json')).mode & 0o777, 0o600);
 });
 await test('terminal detiene una repetición y devuelve error verificable', async () => {
  modo = 'ciclo'; llamadas = 0; const r = await cli('ciclo'); assert.equal(r.code, 1); assert.equal(llamadas, 3); assert.match(r.out, /tres veces sin avance/);
 });
 await test('las ventanas no autorizan escrituras en modo de un solo pedido', async () => {
  modo = 'permiso'; llamadas = 0; const r = await cli('permiso'); assert.equal(r.code, 2); assert.ok(!fs.existsSync(path.join(tmp, 'no-autorizado.txt'))); assert.match(r.out, /no lo permitió/);
 });
 await test('worker real persiste relevo y sigue el plan pendiente sin pedir otro turno', async () => {
  delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL; delete process.env.GW_OS_URL; delete process.env.GATEWAY_TOKEN;
  process.env.LOCAL_DB = 'memory://'; process.env.LITELLM_BASE = `http://127.0.0.1:${srv.address().port}/v1`; process.env.LITELLM_MASTER_KEY = 'fixture-local'; process.env.TMPDIR = tmp;
  const db = await import('../api/_lib/db.js'); const { latido, correrChat } = await import('../gateway/worker.mjs');
  modo = 'worker'; llamadas = 0; resumenes = 0; await latido();
  await db.create('chat_sesiones', { owner: 'prueba@example.test', mensajes: [{ role: 'user', content: 'Completa diez tareas de prueba' }], turno: { estado: 'trabajando', modelo: 'kimi-k3', at: new Date().toISOString() } }, 'prueba', 'ventanas');
  await correrChat('ventanas'); const s = await db.get('chat_sesiones', 'ventanas');
  assert.equal(s.turno.estado, 'listo'); assert.equal(llamadas, 12); assert.ok(resumenes >= 1); assert.ok(s.turno.trabajo.ventana >= 2); assert.ok(s.turno.trabajo.plan.tareas.every(t => t.estado === 'hecha')); assert.equal(s.mensajes.at(-1).content, 'Encargo terminado.');
 });
 await test('retomar conserva una aprobación ejecutada después del último relevo', async () => {
  const db = await import('../api/_lib/db.js'); const { correrChat } = await import('../gateway/worker.mjs'); modo = 'retomar';
  await db.create('chat_sesiones', { owner: 'prueba@example.test', mensajes: [{ role: 'user', content: 'Encargo de prueba' }, { role: 'assistant', content: 'Propuesta pendiente', propuestas: [{ estado: 'aprobada', tool: 'crear_tarea', args: {}, resultado: 'Tarea creada' }] }, { role: 'user', content: 'Retoma el plan' }], turno: { estado: 'trabajando', modelo: 'kimi-k3', at: new Date().toISOString(), trabajo: { objetivo: 'Encargo de prueba', ventana: 1, plan: null, relevo: { texto: 'Quedaba por crear la tarea' } } } }, 'prueba', 'retomar');
  await correrChat('retomar'); assert.match(JSON.stringify(ultimoPedido.messages), /YA SE HIZO en el OS/); assert.match(JSON.stringify(ultimoPedido.messages), /Tarea creada/);
 });
 for (const largo of [false, true]) await test(`Detener corta una ${largo ? 'condensación' : 'generación'} silenciosa antes de su timeout`, async () => {
  const db = await import('../api/_lib/db.js'); const { correrChat } = await import('../gateway/worker.mjs');
  modo = 'cancelar';
  const id = largo ? 'cancelar-resumen' : 'cancelar';
  await db.create('chat_sesiones', { owner: 'prueba@example.test', mensajes: [{ role: 'user', content: largo ? 'dato '.repeat(30000) : 'Prueba de cancelación' }], turno: { estado: 'trabajando', modelo: 'kimi-k3', at: new Date().toISOString() } }, 'prueba', id);
  const inicio = Date.now(), trabajo = correrChat(id);
  await new Promise(r => setTimeout(r, 100)); await db.upsert('chat_sesiones', id, { turno: { estado: 'detenido' } }, 'prueba');
  await trabajo; assert.ok(Date.now() - inicio < 5000); assert.equal((await db.get('chat_sesiones', id)).turno.estado, 'detenido');
 });

} finally { await new Promise(r => srv.close(r)); fs.rmSync(tmp, { recursive: true, force: true }); }
console.log(`${n} pruebas de ventanas OK`);
