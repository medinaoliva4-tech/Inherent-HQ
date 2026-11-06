import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright')); }
const base = process.env.TEST_BASE || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Solo pruebas locales');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 650 } });
await page.addInitScript(() => {
  document.startViewTransition = undefined;
  window.notificacionesPrueba = [];
  window.Notification = class { static permission = 'granted'; constructor(title, options) { this.title = title; this.options = options; window.notificacionesPrueba.push(this); } close() {} };
});
const avisos = [{ id: 'evento-prueba', tipo: 'error', title: 'Tu trabajo se detuvo', body: 'Abre la conversación para reintentar.', url: '/#/chat/trabajo/run-prueba', tag: 'evento-prueba' }];
await page.route('**/api/avisos/chat', (r) => r.fulfill({ json: { items: avisos } }));
await page.route('**/api/avisos/clave', (r) => r.fulfill({ json: { clave: null, dispositivos: [] } }));
await page.route('**/api/chat/servidor', (r) => r.fulfill({ json: { en_linea: true, modelos: ['kimi-k3'] } }));
try {
  await page.goto(base + '/api/auth/dev');
  try { await page.locator('[data-pd=pausa]').click({ timeout: 4000 }); } catch {}
  await page.locator('.chat-aviso').waitFor();
  const rect = await page.locator('.chat-aviso').boundingBox();
  assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= 390 && rect.y + rect.height <= 650);
  assert.equal(await page.evaluate(() => window.notificacionesPrueba.length), 1);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.chat-aviso').count(), 1);
  await page.evaluate(() => window.notificacionesPrueba[0].onclick());
  assert.ok(page.url().endsWith('#/chat/trabajo/run-prueba'));
  assert.equal(await page.locator('.chat-aviso').count(), 0);
  console.log('PASS: aviso fuera del Chat, sin duplicados, dentro de pantalla móvil, clic nativo abre el trabajo');
} finally { await browser.close(); }
