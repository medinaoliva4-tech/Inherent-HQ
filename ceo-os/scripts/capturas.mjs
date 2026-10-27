// Capturas del OS para revisar un cambio de diseño: cada ruta, de día y de noche, en la compu (1440) y en el cel (390).
// Usa el Playwright instalado en la compu (npm root -g), sin agregarlo al proyecto. Con el OS local corriendo (npm run dev):
//   npm run capturas                         → las pantallas de todos los días
//   npm run capturas -- org/sales,chat antes → solo esas, con el prefijo «antes» (un área: areas/marketing)
// Guarda en ceo-os/.capturas/ (no se sube) y avisa de errores de consola y de scroll horizontal.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
const B = process.env.OS_URL || 'http://localhost:3000';
const rutas = (process.argv[2] || 'home,ai,ai/mcps,org/work,org/clients,org/operations,org/sales,org/services,org/finanzas,org/vision,org/library,areas/strategy,areas/marketing,areas/creative,areas/consulting,areas/production,chat,me').split(',');
const pre = process.argv[3] || 'cap';
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '.capturas');
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch(); const errs = [];
for (const [tema, scheme] of [['dia', 'light'], ['noche', 'dark']]) for (const [w, h, cel] of [[1440, 900, false], [390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, isMobile: cel, hasTouch: cel, deviceScaleFactor: cel ? 2 : 1 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(`${tema}/${w}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/7357|8642|ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text())) errs.push(`${tema}/${w} consola: ${m.text()}`); });
  await p.goto(B + '/api/auth/dev'); await p.waitForTimeout(700);
  await p.evaluate(() => { try { localStorage.removeItem('theme'); } catch {} }); // que siga al tema de la «compu» (colorScheme)
  for (const r of rutas) {
    await p.goto(`${B}/#/${r}`); await p.waitForTimeout(2600);
    await p.screenshot({ path: path.join(OUT, `${pre}-${r.replace(/\//g, '_')}-${tema}-${w}.png`) });
    if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) errs.push(`${tema}/${w} ${r}: scroll horizontal`);
  }
  await ctx.close();
}
await b.close();
console.log(`Capturas en ${OUT}`);
if (errs.length) { console.log('Avisos:'); for (const e of errs) console.log(' -', e); process.exitCode = 1; } else console.log('Sin errores de consola ni scroll horizontal.');
