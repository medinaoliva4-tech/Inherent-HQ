// Catálogo local real: cálculos/teclado/callbacks simulados explícitos, sin servicios ni API privada.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
const root = new URL('../public/', import.meta.url).pathname, out = new URL('../docs/capturas-vision/', import.meta.url).pathname;
const security = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).headers[0].headers;
const server = http.createServer((req, res) => { const file = path.join(root, new URL(req.url, 'http://local').pathname); if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end(); for (const h of security) res.setHeader(h.key, h.value); res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8'); res.end(fs.readFileSync(file)); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chrome' });
let count = 0;
try {
  for (const width of [1440, 390]) for (const theme of ['dia', 'noche']) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await ctx.addInitScript((theme) => localStorage.setItem('os.modo', theme === 'dia' ? 'claro' : 'oscuro'), theme);
    const page = await ctx.newPage(), errors = [], csp = []; page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') csp.push(m.text()); });
    await page.goto(base + '/kit.html'); await page.locator('.react-flow__node').first().waitFor();
    assert.equal(await page.locator('.kit-component').count(), 12);
    const simulator = page.locator('#simulator'); await simulator.getByRole('slider', { name: 'Prospectos', exact: true }).focus(); await page.keyboard.press('ArrowRight'); assert.equal(await simulator.locator('.kit-results strong').innerText(), '11');
    assert.match(await page.locator('#research').innerText(), /Baja/); assert.match(await page.locator('#research').innerText(), /No se entrevistó/);
    assert.match(await page.locator('#compare table').innerText(), /Sin datos/); assert.match(await page.locator('#workflow').innerText(), /Depende de: Cliente ideal/);
    await page.locator('#decision').getByRole('button', { name: 'Aprobar propuesta local' }).click(); await page.locator('#decision [role=status]').filter({ hasText: 'Prueba local: approve · demo v1' }).waitFor();
    await page.locator('#approval').getByRole('button', { name: 'Aprobar', exact: true }).click(); assert.equal(await page.locator('#approval .kit-history li').count(), 2);
    assert.match(await page.locator('#timeline [aria-current=step]').innerText(), /2026-11-11/);
    await page.locator('.react-flow__node').first().focus(); await page.keyboard.press('Enter'); await page.locator('#kit-selection').filter({ hasText: 'Nodo seleccionado: icp' }).waitFor();
    await page.locator('#explorer input').fill('Estudio'); assert.match(await page.locator('#explorer table').innerText(), /Sin datos/); assert.equal(await page.locator('#explorer tbody tr').count(), 1);
    await page.locator('#explorer input').fill('Servicios'); assert.match(await page.locator('#explorer table').innerText(), /0/);
    await page.locator('#assistant textarea').fill('¿Qué falta?'); await page.locator('#assistant').getByRole('button', { name: 'Enviar', exact: true }).click(); await page.locator('#assistant [role=log]').filter({ hasText: 'demo, pieza-demo, día 11' }).waitFor();
    await page.locator('#versions select').selectOption('1'); assert.match(await page.locator('#versions .kit-diff').innerText(), /Primera propuesta/); assert.match(await page.locator('#versions .kit-diff').innerText(), /Propuesta revisada/);
    await page.locator('#versions').getByRole('button', { name: 'Recuperar como borrador nuevo' }).click(); await page.locator('#versions [role=status]').filter({ hasText: 'No se editó' }).waitFor();
    await page.locator('#execution').getByRole('button', { name: 'Cancelar', exact: true }).click(); await page.locator('#execution [role=status]').filter({ hasText: 'cancelación confirmada' }).waitFor(); assert.match(await page.locator('#execution').innerText(), /Resultado por verificar/);
    await page.locator('#approval').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(out, `k1-decision-${theme}-${width}.png`) });
    await page.locator('#canvas').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(out, `k1-canvas-${theme}-${width}.png`) });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin overflow de página');
    const targets = await page.locator('.kit-component button, .kit-component input, .kit-component select, .kit-component textarea, .kit-component summary').evaluateAll((els) => els.filter((el) => el.getClientRects().length).map((el) => ({ label: el.getAttribute('aria-label') || el.textContent, height: el.getBoundingClientRect().height })));
    assert.deepEqual(targets.filter((x) => x.height < 43.9), [], 'objetivos de 44px');
    assert.deepEqual(errors, []); assert.deepEqual(csp, []); count++; await ctx.close();
  }
  // Estado de fallo y doble clic durante espera, con callback falso controlado.
  const page = await browser.newPage(); await page.goto(base + '/kit.html');
  const result = await page.evaluate(async () => {
    const { DecisionCard } = await import('/js/kit/index.js'); let calls = 0, reject;
    const el = DecisionCard({ actions: [{ id: 'approve', label: 'Probar error' }], onAction: () => { calls++; return new Promise((_resolve, ko) => reject = ko); } }); document.body.append(el);
    const b = el.querySelector('button'); b.click(); b.click(); const busy = b.disabled; reject(new Error('Conflicto 409: vuelve a revisar la versión')); await new Promise((r) => requestAnimationFrame(r));
    return { calls, busy, enabled: !b.disabled, state: el.querySelector('[role=status]').textContent };
  });
  assert.equal(result.calls, 1); assert.equal(result.busy, true); assert.equal(result.enabled, true); assert.match(result.state, /409/); await page.close();
  console.log(`Kit: 12 componentes interactivos, ${count} combinaciones claro/oscuro/escritorio/móvil, 8 capturas 2x, teclado/44px/CSP/errores/espera/nulos OK.`);
} finally { await browser.close(); await new Promise((r) => server.close(r)); }
