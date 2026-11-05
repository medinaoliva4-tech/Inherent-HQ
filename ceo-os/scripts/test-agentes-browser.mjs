// Regresión real contra dev.mjs (PGlite local). Playwright se resuelve local/global, como capturas.mjs.
// node scripts/test-agentes-browser.mjs — nunca usar contra producción.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright')); }
const base = 'http://localhost:3000';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
const api = (path, body) => page.evaluate(async ({path, body}) => {
  const r = await fetch('/api/' + path, { method: body ? 'POST' : 'GET', headers: {'Content-Type':'application/json','X-CEOOS':'1'}, ...(body ? {body:JSON.stringify(body)} : {}) });
  const data = await r.json(); if (!r.ok) throw Error(JSON.stringify(data)); return data;
}, {path,body});
let id;
try {
  await page.goto(base + '/api/auth/dev'); await page.waitForTimeout(800);
  const { plantillas } = await api('agentes/plantillas');
  const { workflow } = await api('agentes/workflows', {plantilla:plantillas.find(p=>p.etapas.length).id}); id = workflow.id;
  await page.goto(`${base}/#/ai/agentes/${id}/workflow`);
  await page.locator('[data-k=nombre]').fill('Etapa de regresión QA');
  await page.locator('[data-act=guardar]').click();
  await page.waitForTimeout(700);
  assert.equal((await api('agentes/workflows/'+id)).workflow.etapas[0].nombre,'Etapa de regresión QA');
  assert.deepEqual(errors, [], 'Guardar no debe lanzar errores JavaScript');
  assert.equal(await page.locator('[data-act=guardar]').isDisabled(), true);
  for (const panel of ['reglas','conexiones','construir']) {
    await page.locator(`[data-act=panel][data-p=${panel}]`).click();
    assert.equal(await page.locator(`[data-act=panel][data-p=${panel}].on`).count(),1);
  }
  await page.locator('.agp-tabs a[href$="/settings"]').click();
  await page.locator('[data-s=objetivo]').fill('Objetivo QA'); await page.waitForTimeout(900);
  assert.equal((await api('agentes/workflows/'+id)).workflow.objetivo,'Objetivo QA');
  const {run} = await api('agentes/runs',{workflow:id,titulo:'QA navegador · simulado'});
  // F4.5: el trabajo se abre en el Chat; /etapas queda como historial, sin ejecutar.
  await page.goto(`${base}/#/ai/agentes/${id}/trabajos/${run.id}`); await page.waitForTimeout(900);
  assert.equal(await page.evaluate(()=>location.hash),`#/chat/trabajo/${run.id}`);
  await page.goto(`${base}/#/ai/agentes/${id}/trabajos/${run.id}/etapas`); await page.waitForTimeout(900);
  assert.equal(await page.locator('[data-act=ejecutar],[data-ch=runner]').count(),0,'la vista por etapas no ejecuta');
  assert.equal(await page.locator('a:has-text("Abrir en el Chat")').count(),1);
  await page.locator('[data-act=pausa]').click(); await page.waitForTimeout(500);
  assert.equal((await api('agentes/runs/'+run.id)).run.pausado,true);
  assert.ok((await page.locator('#main').innerText()).includes('no se ejecuta nada'));
  await api(`agentes/runs/${run.id}/archivar`,{archivado:true});
  assert.equal((await api('agentes/runs/'+run.id)).run.archivado,true);
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    for (const route of ['ai/agentes',`ai/agentes/${id}`,`ai/agentes/${id}/settings`,`ai/agentes/${id}/workflow`,'ajustes/ia','ai/mcps','areas/strategy/agents']) {
      await page.goto(`${base}/#/${route}`); await page.waitForTimeout(700);
      assert.equal(await page.evaluate(()=>location.hash),'#/'+route);
      assert.ok((await page.locator('#main').innerText()).length>30);
      const clipped = await page.evaluate(()=>[...document.querySelectorAll('.agp-top > button,.agx-tr > span')].filter(e=>e.getClientRects().length && getComputedStyle(e).display!=='none').filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.textContent));
      assert.deepEqual(clipped, [], `${width} ${route}: controles recortados`);
    }
  }
  await page.locator('[data-hoja=mas]').click();
  assert.equal(await page.locator('.hoja a[href="#/ajustes/ia"]').count(),1,'Ajustes accesible desde Más en móvil');
  await page.locator('.hoja a[href="#/ajustes/ia"]').click();
  await page.waitForTimeout(500);
  await page.goBack(); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>location.hash),'#/areas/strategy/agents');
  assert.deepEqual(errors, []);
  console.log('PASS: guardado con lectura real, inspector, siete rutas desktop/móvil y controles sin recorte.');
} finally {
  if(id) { await api(`agentes/workflows/${id}/archivar`,{archivado:true}); assert.equal((await api('agentes/workflows/'+id)).workflow.archivado,true); }
  await browser.close();
}
