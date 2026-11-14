// Capturas para validar la visión del OS (docs/OS-IDEAL-MAC-IPHONE.md): cada ruta de día y de noche, en la compu (1440) y
// en el cel (390), a doble densidad (lo que ve el CEO). Cierra «Tu primer día» para que no tape la pantalla.
// Con el OS local corriendo (npm run dev):
//   node scripts/capturas-vision.mjs home,decide ola1            → docs/capturas-vision/ola1-home-dia-1440.png …
//   OS_URL=http://localhost:3100 node scripts/capturas-vision.mjs org/sales ola4 --solo=noche-390
//   … --rol=coo   (entra con /api/auth/dev?rol=coo si el servidor local lo permite)   --espera=3500 (ms por pantalla)
// Sale con código 1 si hay errores de consola, de CSP o scroll horizontal.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
const B = process.env.OS_URL || 'http://localhost:3000';
const args = process.argv.slice(2), flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const [rutasArg, pre = 'cap'] = args.filter((a) => !a.startsWith('--'));
const rutas = (rutasArg || 'home').split(',');
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'docs', 'capturas-vision');
fs.mkdirSync(OUT, { recursive: true });
const espera = Number(flags.espera) || 2600;
const combos = [['dia', 'light', 1440, 900, false], ['noche', 'dark', 1440, 900, false], ['dia', 'light', 390, 844, true], ['noche', 'dark', 390, 844, true]]
  .filter(([t, , w]) => !flags.solo || flags.solo.split(',').includes(`${t}-${w}`));

const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' }).catch(() => chromium.launch()); const errs = [];
for (const [tema, scheme, w, h, cel] of combos) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, isMobile: cel, hasTouch: cel, deviceScaleFactor: 2,
    reducedMotion: flags.movimiento === 'reducido' ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(`${tema}/${w}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/7357|8642|ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text())) errs.push(`${tema}/${w} consola: ${m.text()}`); });
  await p.goto(B + '/api/auth/dev' + (flags.rol ? `?rol=${flags.rol}` : '')); await p.waitForTimeout(700);
  await p.evaluate((claro) => { try { localStorage.setItem('os.modo', claro ? 'claro' : 'oscuro'); } catch {} }, scheme === 'light');
  await p.goto(B + '/'); await p.waitForTimeout(400);
  for (const r of rutas) {
    await p.goto(`${B}/#/${r}`); await p.waitForTimeout(espera);
    const pausa = p.locator('[data-pd="pausa"]');
    if (await pausa.count()) { await pausa.first().click().catch(() => {}); await p.waitForTimeout(500); }
    await p.screenshot({ path: path.join(OUT, `${pre}-${r.replace(/[/?=&]/g, '_')}-${tema}-${w}.png`), fullPage: flags.completa === '1' });
    if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) errs.push(`${tema}/${w} ${r}: scroll horizontal`);
  }
  await ctx.close();
}
await b.close();
console.log(`Capturas en ${OUT}`);
if (errs.length) { console.log('Avisos:'); for (const e of errs) console.log(' -', e); process.exitCode = 1; } else console.log('Sin errores de consola ni scroll horizontal.');
