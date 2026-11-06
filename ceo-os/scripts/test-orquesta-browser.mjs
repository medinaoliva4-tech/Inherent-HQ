import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright')); }
const base = process.env.TEST_BASE || 'http://localhost:3000';
if (!['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Solo pruebas locales');
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1440,height:900}});
await p.addInitScript(()=>{document.startViewTransition=undefined});
await p.route('**/api/chat/servidor',r=>r.fulfill({json:{en_linea:true,modelos:['kimi-k3']}}));
const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(base+'/api/auth/dev');try{await p.locator('[data-pd=pausa]').waitFor({timeout:4000});await p.locator('[data-pd=pausa]').click();}catch{}
 await p.goto(base+'/#/chat');await p.waitForTimeout(700);
 await p.locator('#llm-in').fill('/orq');await p.locator('[data-c="/orquesta"]').click();assert.equal(await p.locator('#llm-in').inputValue(),'/orquesta ');
 let calls=0;
 await p.route('**/api/agentes/orquestar',async r=>{calls++;await new Promise(res=>setTimeout(res,900));await r.fulfill({status:409,json:{error:'No hay IA configurada para enrutar.'}})});
 await p.locator('#llm-in').fill('/orquesta prepara un plan');await p.locator('#llm-in').press('Enter');
 await p.getByText('Preparando una propuesta de trabajo…',{exact:true}).waitFor({state:'visible'});
 await p.getByText('No hay IA configurada para enrutar.',{exact:false}).waitFor({state:'visible'});assert.equal(calls,1);
 await p.unroute('**/api/agentes/orquestar');
 const wf=await p.evaluate(async()=>{const {api}=await import('/js/core.js');const {plantillas}=await api('agentes/plantillas');return (await api('agentes/workflows',{method:'POST',body:{plantilla:plantillas[0].id}})).workflow});
 await p.route('**/api/agentes/orquestar',r=>r.fulfill({json:{workflow:{id:wf.id,nombre:wf.nombre},cliente:'',objetivo:'Plan sintético',confianza:.9}}));
 await p.locator('#llm-in').fill('/orquesta plan interno');await p.locator('#llm-in').press('Enter');
 await p.locator('.lpl').waitFor({state:'visible',timeout:5000});
 assert.ok(await p.locator('.lpl').innerText());
 await p.evaluate(async id=>{const {api}=await import('/js/core.js');await api(`agentes/workflows/${id}/archivar`,{method:'POST',body:{archivado:true}})},wf.id);
 assert.equal(await p.evaluate(async()=>{const {api}=await import('/js/core.js');try{await api('fixture-cancelada',{signal:AbortSignal.abort()});return 'sin cancelar';}catch(e){return e.name;}}),'AbortError');
 assert.deepEqual(errors,[]);console.log('PASS: sugerencia, espera visible, error persistente, propuesta sin ejecución automática');
}catch(e){console.log('pageerrors',errors);throw e;}finally{await b.close()}
