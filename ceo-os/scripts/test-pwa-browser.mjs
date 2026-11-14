// OS_URL=http://localhost:3000 node scripts/test-pwa-browser.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
const origin = process.env.OS_URL || 'http://localhost:3000';
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' }).catch(() => chromium.launch());
try {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  await page.goto(origin + '/api/auth/dev');
  await page.goto(origin + '/#/home');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  await page.request.get(origin + '/api/me');
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const urls = (await Promise.all(keys.map(async (key) => (await (await caches.open(key)).keys()).map((req) => req.url)))).flat();
    return { keys, urls };
  });
  assert.ok(cached.urls.some((url) => url.endsWith('/offline.html')), 'pantalla sin conexión precargada');
  assert.ok(cached.urls.every((url) => !new URL(url).pathname.startsWith('/api/')), 'ningún dato de API en caché');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.match(await page.locator('h1').innerText(), /Sin conexión/);
  assert.match(await page.locator('main').innerText(), /Nada se ha enviado/);
  await context.close();
  console.log('PWA: fallback offline y caché sin respuestas privadas OK');
} finally {
  await browser.close();
}
