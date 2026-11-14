// Prueba de navegación local: 25 rutas × escritorio y móvil, sin escribir datos.
// OS_URL=http://localhost:3000 node scripts/test-rutas-vision.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
const origin = process.env.OS_URL || 'http://localhost:3000';
if (!/^http:\/\/localhost:\d+$/.test(origin)) throw new Error('Esta prueba solo corre contra el OS local');
const routes = ['home', 'chat', 'ai/agentes', 'calendario', 'org/operations', 'org/work', 'org/sales', 'org/clients',
  'org/services', 'org/finanzas', 'org/team', 'org/vision', 'org/roadmap', 'org/team/laya', 'org/setup', 'areas',
  'areas/strategy', 'areas/marketing', 'areas/creative', 'areas/consulting', 'areas/production', 'org/library',
  'ai/mcps', 'ajustes/ia', 'avisos'];
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' }).catch(() => chromium.launch());
const failures = [];
try {
  for (const [name, width] of [['escritorio', 1440], ['móvil', 390]]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width === 390, hasTouch: width === 390 });
    const page = await context.newPage();
    let current = '';
    page.on('pageerror', (e) => failures.push(`${name}/${current}: ${e.message}`));
    await page.goto(origin + '/api/auth/dev');
    await page.goto(origin + '/#/home');
    await page.waitForTimeout(600);
    for (const route of routes) {
      current = route;
      await page.evaluate((r) => { location.hash = '#/' + r; }, route);
      await page.waitForTimeout(370);
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        blank: !document.querySelector('#main')?.textContent?.trim(),
      }));
      if (state.overflow || state.blank) failures.push(`${name}/${route}: ${JSON.stringify(state)}`);
    }
    await context.close();
  }
} finally { await browser.close(); }
console.log(`${routes.length * 2} rutas comprobadas`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Sin errores de ejecución, páginas vacías ni scroll horizontal');
