// Regresiones sin proveedor ni base real. Candados aislados en un directorio temporal.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ajustarAlTope, tokensDe } from '../gateway/contexto.mjs';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inherent-test-'));
const oldTmp = process.env.TMPDIR, oldFetch = globalThis.fetch;
process.env.TMPDIR = tmp;
const { acquire, chat, chatTools } = await import('../gateway/motor.mjs');
let count = 0;
const test = async (name, fn) => { await fn(); count++; console.log('✓', name); };
const stalled = (_, { signal }) => new Promise((resolve, reject) => {
  if (signal.aborted) return reject(signal.reason);
  signal.addEventListener('abort', () => reject(signal.reason), { once: true });
});
// Un mock de red no mantiene activo el event loop, a diferencia de una conexión real.
const keepAlive = setInterval(() => {}, 1000);
try {
  await test('rechaza argumentos enormes sin truncar su JSON', () => {
    const xs = [{role:'system',content:'s'},{role:'user',content:'u'}, {role:'assistant',content:null,tool_calls:[{id:'x',type:'function',function:{name:'escribir',arguments:JSON.stringify({contenido:'x'.repeat(110000)})}}]}, {role:'tool',tool_call_id:'x',content:'ok'}];
    const before = JSON.stringify(xs);
    assert.throws(() => ajustarAlTope(xs,26268), {code:'CONTEXTO'});
    assert.equal(JSON.stringify(xs),before);
  });
  await test('rechaza esquemas de herramientas que por sí solos exceden el tope', () => {
    assert.throws(() => ajustarAlTope([{role:'user',content:'u'}],1000,[{description:'x'.repeat(10000)}]),{code:'CONTEXTO'});
  });
  await test('el historial ordinario sí se recorta dentro del presupuesto', () => {
    const xs=[{role:'system',content:'s'.repeat(30000)},{role:'user',content:'old'},{role:'assistant',content:'a'.repeat(30000)},{role:'user',content:'new'}];
    assert.ok(tokensDe(ajustarAlTope(xs,2000))<=2000);
  });
  await test('Kimi bloquea Flash en la misma máquina y la espera es cancelable', async () => {
    const release=await acquire('kimi-k3');
    try { await assert.rejects(acquire('deepseek-v4-flash',()=>{},AbortSignal.timeout(30)),{name:'TimeoutError'}); }
    finally {release();}
    (await acquire('deepseek-v4-flash'))();
  });
  await test('una señal ya cancelada no toma el candado', async () => {
    await assert.rejects(acquire('kimi-k3',()=>{},AbortSignal.abort()));
    assert.equal(fs.existsSync(path.join(tmp,'gw-locks','featherless.turno')),false);
  });
  await test('el último fragmento se publica aunque el stream termine antes de cadaMs', async () => {
    globalThis.fetch=async()=>new Response('data: '+JSON.stringify({choices:[{delta:{content:'Respuesta completa'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');
    let text='';const r=await chat('kimi-k3','','',100,{onAvance:({texto})=>{text=texto;}});
    assert.equal(text,'Respuesta completa');assert.equal(r.content,text);
  });
  await test('el plazo total corta un proveedor que nunca responde y libera el candado', async () => {
    globalThis.fetch=stalled;
    await assert.rejects(chat('kimi-k3','','',100,{timeoutMs:30}),{name:'TimeoutError'});
    (await acquire('kimi-k3'))();
  });
  await test('se cancela durante la pausa de un 429 sin volver a llamar al proveedor', async () => {
    let calls=0;globalThis.fetch=async()=>{calls++;return new Response('busy',{status:429});};
    await assert.rejects(chat('kimi-k3','','',100,{timeoutMs:30}),{name:'TimeoutError'});assert.equal(calls,1);
  });
  await test('chatTools también tiene límite y libera la cola',async()=>{
    globalThis.fetch=stalled;
    await assert.rejects(chatTools('kimi-k3',[],[],100,{timeoutMs:30}),{name:'TimeoutError'});
    (await acquire('kimi-k3'))();
  });
  await test('el plazo total sigue activo después del primer fragmento',async()=>{
    globalThis.fetch=async(_, {signal})=>new Response(new ReadableStream({start(controller){
      controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Inicio"}}]}\n\n'));
      signal.addEventListener('abort',()=>controller.error(signal.reason),{once:true});
    }}));
    await assert.rejects(chat('kimi-k3','','',100,{timeoutMs:30,cadaMs:0}),{name:'TimeoutError'});
  });
  await test('mide y reporta también una cancelación mientras espera en cola', async () => {
    const release = await acquire('kimi-k3'); let medida;
    try { await assert.rejects(chat('kimi-k3', '', '', 100, { timeoutMs: 30, onMedida: (m) => { medida = m; } }), { name: 'TimeoutError' }); }
    finally { release(); }
    assert.equal(medida.error, 'TimeoutError'); assert.ok(medida.espera_ms >= 20);
    assert.equal(medida.entrada, null); assert.equal(medida.reintentos, 0);
  });
  await test('un fallo del registro no rompe una respuesta válida', async () => {
    globalThis.fetch=async()=>new Response('data: {"choices":[{"delta":{"content":"OK"},"finish_reason":"stop"}]}\n\n');
    const r=await chat('kimi-k3','','',100,{onMedida:()=>{throw new Error('disco lleno');}});assert.equal(r.content,'OK');
  });
  console.log(`${count} pruebas de estabilidad OK`);
} finally {
  clearInterval(keepAlive);globalThis.fetch=oldFetch;
  if(oldTmp===undefined)delete process.env.TMPDIR;else process.env.TMPDIR=oldTmp;
  fs.rmSync(tmp,{recursive:true,force:true});
}
