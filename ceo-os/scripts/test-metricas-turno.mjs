import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import http from 'node:http';import {spawn} from 'node:child_process';
import {medidaSegura} from './metricas-turno.mjs';
const secret='CONTENIDO-QUE-NO-DEBE-GUARDARSE';
assert.ok(!JSON.stringify(medidaSegura({id:'qa',at:'2026-11-06',estado:'error',texto:secret,error:secret,llamadas:[{modelo:'kimi-k3',prompt:secret,error:secret}]})).includes(secret));
console.log('✓ las métricas excluyen contenido y errores crudos');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'inherent-metricas-'));
const srv=http.createServer((req,res)=>{req.resume();req.on('end',()=>{
 res.writeHead(200,{'Content-Type':'text/event-stream'});
 res.end('data: '+JSON.stringify({choices:[{delta:{content:'Respuesta sintética completa'},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:2}})+'\n\ndata: [DONE]\n\n');
});});
try{
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const result=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[new URL('./inherent.mjs',import.meta.url).pathname,'qa','Hola de prueba'],{env:{...process.env,INHERENT_DIR:tmp,TMPDIR:tmp,LITELLM_BASE:`http://127.0.0.1:${srv.address().port}/v1`,LITELLM_MASTER_KEY:'fixture-sin-credenciales-reales'},stdio:['ignore','pipe','pipe']});
  let out='',err='';child.stdout.on('data',x=>out+=x);child.stderr.on('data',x=>err+=x);const timer=setTimeout(()=>{child.kill();reject(new Error('El arnés no terminó'));},10000);
  child.on('error',reject);child.on('close',code=>{clearTimeout(timer);resolve({code,out,err});});
 });
 assert.equal(result.code,0,result.err);assert.match(result.out,/Respuesta sintética completa/);assert.match(result.out,/Terminé/);
 const logs=fs.readFileSync(path.join(tmp,'turnos.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.equal(logs.length,1);const r=logs[0];assert.equal(r.estado,'terminado');assert.equal(r.llamadas.length,1);assert.equal(r.llamadas[0].entrada,10);assert.equal(r.llamadas[0].salida,2);assert.equal(r.llamadas[0].http_status,200);assert.equal(r.llamadas[0].reintentos,0);assert.ok(r.tiempo_ms>=r.llamadas[0].tiempo_ms);assert.equal(fs.statSync(path.join(tmp,'turnos.jsonl')).mode & 0o777,0o600);
 console.log('✓ arnés real contra proveedor simulado: texto, fin visible y un registro privado por turno');
}finally{await new Promise(r=>srv.close(r));fs.rmSync(tmp,{recursive:true,force:true});}
