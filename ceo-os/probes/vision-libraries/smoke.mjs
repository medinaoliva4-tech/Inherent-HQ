import { chromium } from '/Users/rodrigomedina/node_modules/playwright/index.mjs';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1040 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: 'Ruta de una oportunidad' }).waitFor();
await page.locator('.react-flow__node').first().waitFor();
await page.getByRole('button', { name: 'Enviar selección a OS' }).first().click();
await page.getByText('Lead nuevo · En revisión · lead').waitFor();
await page.waitForTimeout(250);
await mkdir(new URL('./capturas/', import.meta.url), { recursive: true });
await page.screenshot({ path: new URL('./capturas/vision-reactflow-dsf2.png', import.meta.url).pathname, fullPage: true });
const result = await page.evaluate(() => ({
  devicePixelRatio,
  nodeCount: document.querySelectorAll('.react-flow__node').length,
  chartSvg: Boolean(document.querySelector('#chart-island svg')),
  vanillaEvent: document.querySelector('#event-value')?.textContent,
  eventCount: document.querySelector('#event-count')?.textContent,
  dimensions: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
}));
await browser.close();
if (errors.length || result.devicePixelRatio !== 2 || result.nodeCount !== 3 || !result.chartSvg || result.eventCount !== '1 evento') {
  throw new Error(JSON.stringify({ errors, result }, null, 2));
}
console.log(JSON.stringify({ errors, result, screenshot: 'capturas/vision-reactflow-dsf2.png' }, null, 2));
