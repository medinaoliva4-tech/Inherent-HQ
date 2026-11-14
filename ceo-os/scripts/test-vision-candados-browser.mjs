// Prueba UI real con adaptador HTTP falso explícito; nunca invoca proveedores.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
const publicRoot = new URL('../public/', import.meta.url).pathname;
const security = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).headers[0].headers;
const server = http.createServer((req, res) => { const p = path.join(publicRoot, new URL(req.url, 'http://local').pathname); if (!p.startsWith(publicRoot) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404).end(); return; } for (const h of security) res.setHeader(h.key, h.value); res.setHeader('Content-Type', p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : 'text/html'); res.end(fs.readFileSync(p)); });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const out = new URL('../docs/capturas-vision/', import.meta.url); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
try {
  for (const width of [1440, 390]) for (const theme of ['dia', 'noche']) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); let created, executed = 0;
    await page.route('**/s1-review.html', (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html data-theme="${theme === 'dia' ? 'light' : 'dark'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/primitives.css"><link rel="stylesheet" href="/app.css"></head><body><main style="padding:24px"><h1>Revisión de contenido</h1><button id="start" class="btn">Agendar pieza</button><p id="result" role="status"></p><div id="toasts"></div><div id="drawer"></div></main></body></html>` }));
    await page.route('**/api/content/origenes?*', (r) => r.fulfill({ json: { items: [{ id: 'icp-demo', version: 3, titulo: 'Cliente ideal · Demo', tool: 'customer-bullseye' }] } }));
    await page.route('**/api/db/content', async (r) => { created = r.request().postDataJSON(); await r.fulfill({ json: { ...created, id: 'demo-post', v: 1 } }); });
    await page.route('**/api/ia/acciones/*/aprobar', async (r) => { executed++; assert.deepEqual(r.request().postDataJSON(), { hash: 'mock-digest', expected_version: 1 }); await r.fulfill({ json: { id: 'mock-action', estado: 'succeeded', texto: 'Proveedor falso confirmó la acción' } }); });
    await page.goto(origin + '/s1-review.html');
    await page.evaluate(async () => { const { col } = await import('/js/core.js'); document.querySelector('#start').onclick = async () => { const d = await col('content').create({ kind: 'post', profile: 'demo', date: '2026-11-10', title: 'Pieza sintética', status: 'Idea' }); document.querySelector('#result').textContent = `Guardada: ${d.id}`; }; });
    await page.getByRole('button', { name: 'Agendar pieza' }).click();
    await page.getByRole('dialog').waitFor(); assert.equal(created, undefined);
    await page.screenshot({ path: new URL(`s1-origen-${theme}-${width}.png`, out).pathname });
    await page.getByRole('button', { name: 'Usar esta versión' }).click();
    await page.getByText('Guardada: demo-post').waitFor(); assert.deepEqual(created.viene_de, [{ id: 'icp-demo', version: 3 }]);
    await page.evaluate(async () => { const { revisarAccionesExternas } = await import('/js/external-actions-ui.js'); window.actionResult = revisarAccionesExternas([{ id: 'mock-action', version: 1, hash: 'mock-digest', conector: 'Proveedor de prueba', tool: 'preparar_demo', params: { texto: 'Solo un proveedor falso', destino: 'Marca Demo' }, scope: 'demo' }]); });
    await page.getByRole('dialog').waitFor(); assert.equal(executed, 0);
    await page.screenshot({ path: new URL(`s1-aprobacion-${theme}-${width}.png`, out).pathname });
    await page.getByRole('button', { name: 'Aprobar y ejecutar' }).click();
    const result = await page.evaluate(() => window.actionResult); assert.equal(result[0].estado, 'succeeded'); assert.equal(executed, 1);
    // Enter sobre cards deja actuar al botón nativo y avanza exactamente un paso.
    await page.evaluate(async () => { const { wizard } = await import('/js/core.js'); window.wizardResult = wizard('Teclado', [{ k: 'format', q: 'Formato', type: 'cards', opts: [{ v: 'Reel', l: 'Reel' }, { v: 'Story', l: 'Story' }] }, { k: 'title', q: 'Idea', type: 'text', req: true }, { k: 'final', q: 'Confirmación', type: 'cards', opts: [{ v: 'ok', l: 'Finalizar' }] }]); });
    await page.getByRole('button', { name: 'Reel', exact: true }).focus(); await page.keyboard.press('Enter');
    await page.locator('.wiz input[type="text"]').waitFor(); assert.equal(await page.getByText('Confirmación', { exact: true }).count(), 0);
    await page.keyboard.press('Escape');
    assert.deepEqual(errors, []); await context.close();
  }
  console.log('S1 UI: selector real, aprobación exacta y teclado sin salto; 4 tamaños/temas, 8 capturas 2x; HTTP falso explícito.');
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
