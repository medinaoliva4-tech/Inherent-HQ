import assert from 'node:assert/strict';
import { consultar } from '../api/_lib/db-transporte.js';
import { revisarColas, enSegundoPlano } from '../gateway/resiliencia.mjs';
let ok = 0;
const t = async (name, f) => { await f(); ok++; console.log('✓', name); };
const red = () => new TypeError('fetch failed');
await t('una lectura se recupera de dos cortes sin alterar SQL ni parámetros', async () => {
  let n=0;const params=['fixture'];const pauses=[];
  const result=await consultar({query:async(sql,p,o)=>{assert.equal(sql,'SELECT id FROM docs');assert.equal(p,params);assert.ok(o.fetchOptions.signal);if(++n<3)throw red();return [1];}},'SELECT id FROM docs',params,{esperar:async(ms)=>pauses.push(ms)});
  assert.deepEqual(result,[1]);assert.deepEqual(pauses,[250,500]);assert.equal(n,3);
});
await t('no repite una escritura aunque pierda la respuesta',async()=>{
  let n=0;await assert.rejects(consultar({query:async()=>{n++;throw red();}},'INSERT INTO docs VALUES (1)'));assert.equal(n,1);
});
await t('no repite errores SQL ni permisos',async()=>{
  let n=0;await assert.rejects(consultar({query:async()=>{n++;throw new Error('permission denied');}},'SELECT 1'));assert.equal(n,1);
});
await t('abandona una lectura tras tres fallos',async()=>{
  let n=0;await assert.rejects(consultar({query:async()=>{n++;throw red();}},'SELECT 1',[],{esperar:async()=>{}}));assert.equal(n,3);
});
await t('el timeout cancela la consulta y las escrituras no se reenvían',async()=>{
  const keep=setInterval(()=>{},1000);
  try{await assert.rejects(consultar({query:(_,__,{fetchOptions:{signal}})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))},'UPDATE docs SET v=2',[],{timeoutMs:20}),{name:'TimeoutError'});}finally{clearInterval(keep);}
});
await t('latido y etapas rotos no bloquean el Chat ni el siguiente ciclo',async()=>{
  const visits=[],errors=[];
  for(let i=0;i<2;i++)await revisarColas([['latido',async()=>{throw red();}],['chat',async()=>visits.push('chat')],['etapas',async()=>{throw red();}]],n=>errors.push(n));
  assert.deepEqual(visits,['chat','chat']);assert.deepEqual(errors,['latido','etapas','latido','etapas']);
});
await t('el fallo inicial de una tarea no escapa y libera su plaza',async()=>{
  const seen=[];await enSegundoPlano(async()=>{throw red();},()=>seen.push('liberada'),async()=>{seen.push('error');throw red();});assert.deepEqual(seen,['error','liberada']);
});
await t('una tarea exitosa libera su plaza sin reportar error',async()=>{
  const seen=[];await enSegundoPlano(async()=>seen.push('resultado'),()=>seen.push('liberada'),()=>assert.fail());assert.deepEqual(seen,['resultado','liberada']);
});
console.log(`${ok} pruebas de recuperación OK`);
