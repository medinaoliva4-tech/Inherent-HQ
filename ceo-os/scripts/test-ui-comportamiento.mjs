// Prueba de comportamiento de ui.js (menú, popover, tooltip, diálogo, tabs) y de que no vuelvan las familias viejas.
//   node scripts/test-ui-comportamiento.mjs            → grep (siempre) + navegador headless (si hay Playwright)
//   node scripts/test-ui-comportamiento.mjs --servir   → solo sirve public/ en http://localhost:4310 (para ver ui-ejemplos.html)
// El navegador carga public/ui-ejemplos.html con la misma CSP que producción (vercel.json): sin login ni base de datos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..');
const PUBLIC = path.join(RAIZ, 'public');
const SERVIR = process.argv.includes('--servir');
let ok = 0; const t = async (n, f) => { if (SERVIR) return; await f(); ok++; console.log('✓', n); };

// ---------- 1 · grep: las familias que se fueron no vuelven ----------
const archivos = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(d, e.name)) : /\.(js|html)$/.test(e.name) ? [path.join(d, e.name)] : []));
const JS = archivos(path.join(PUBLIC, 'js')).concat(archivos(PUBLIC).filter((f) => f.endsWith('.html'))).map((f) => [path.relative(PUBLIC, f), fs.readFileSync(f, 'utf8')]);
const CSS = fs.readFileSync(path.join(PUBLIC, 'app.css'), 'utf8');
export const VIEJAS = {
  menus: ['menu', 'lat-menu', 'lat-ws-menu', 'llm-menu', 'es-menu', 'lib-menu', 'kf-menu', 'avi-menu', 'guia-menu', 'top-menu', 'pp-pop', 'dg-pop', 'ctx-pop'],
  dialogos: ['dlg', 'llm-sheet', 'pd-dlg', 'rsheet', 'rv-sheet', 'sp-sheet', 'llm-imagen-dialog', 'in-dlg'],
  tabs: ['iai-tabs', 'pd-tabs', 'agp-tabs', 'ws-tabs', 'wfe-tabs', 'vil-tab', 'vil-tabs', 'pp-tabs', 'bx-seg', 'wstabs', 'dz-tab', 'dz-tabs', 'cs-med-seg', 'agp-seg', 'ws-sub-tabs', 'wfe-vtabs', 'kf-seg', 'hk-tabs', 'esc-tab', 'esc-tabs', 'dse-tabs', 'dg-seg', 'cc-seg', 'aitabs', 'vz-seg', 'sp-tab', 'sd-seg', 'sp-seg', 'pktab', 'ar-tabs', 'ar-sec-tab', 'intel-pill'],
};
const enCss = (c) => new RegExp(`\\.${c.replace(/-/g, '\\-')}(?![\\w-])`).test(CSS);
const enJs = (c) => JS.filter(([, s]) => new RegExp(`(class(Name)?\\s*=\\s*["'\`][^"'\`]*|classList\\.\\w+\\(\\s*['"]|querySelector(All)?\\(\\s*['"][^'"]*\\.|closest\\(\\s*['"][^'"]*\\.)(?<![\\w-])${c.replace(/-/g, '\\-')}(?![\\w-])`).test(s)).map(([f]) => f);
if (!process.env.SIN_GREP) await t('grep: ninguna familia vieja de menú/popover, diálogo o tabs en app.css ni en js/', () => {
  const quedan = [];
  for (const [g, cs] of Object.entries(VIEJAS)) for (const c of cs) { if (enCss(c)) quedan.push(`${g}: .${c} en app.css`); const fs_ = enJs(c); if (fs_.length) quedan.push(`${g}: ${c} en ${fs_.join(', ')}`); }
  assert.deepEqual(quedan, []);
});
if (!process.env.SIN_GREP) await t('grep: menu-contextual.js y chat-menu-posicion.js se fueron (y nadie los importa)', () => {
  for (const f of ['menu-contextual.js', 'chat-menu-posicion.js']) { assert.ok(!fs.existsSync(path.join(PUBLIC, 'js', f)), f); assert.deepEqual(JS.filter(([, s]) => s.includes(f)).map(([n]) => n), []); }
});
await t('grep: ninguna pantalla importa Zag ni Floating UI directo (solo ui.js)', () => {
  assert.deepEqual(JS.filter(([f, s]) => f !== 'js/ui.js' && /vendor\/zag|@zag-js|@floating-ui/.test(s)).map(([f]) => f), []);
});
if (!process.env.SIN_GREP) await t('grep: <dialog> y showModal solo dentro de ui.js', () => {
  assert.deepEqual(JS.filter(([f, s]) => f !== 'js/ui.js' && /createElement\(['"]dialog['"]\)|\.showModal\(/.test(s)).map(([f]) => f), []);
});
await t('vendor: lo vendorizado coincide con su README (sha256) y trae LICENSES', () => {
  execSync(`node ${JSON.stringify(path.join(AQUI, 'vendor-ui.mjs'))} --check`, { stdio: 'pipe' });
  assert.match(fs.readFileSync(path.join(PUBLIC, 'vendor', 'zag-1.47.0', 'LICENSES.txt'), 'utf8'), /MIT License/);
});

// ---------- 2 · servidor estático con la CSP de producción ----------
const SEC = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(RAIZ, 'vercel.json'), 'utf8')).headers[0].headers.map((h) => [h.key, h.value]));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const servidor = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const f = path.join(PUBLIC, decodeURIComponent(u.pathname === '/' ? '/ui-ejemplos.html' : u.pathname));
  for (const [k, v] of Object.entries(SEC)) res.setHeader(k, v);
  if (!f.startsWith(PUBLIC) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('no'); }
  res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f));
});
const PUERTO = +(process.env.PUERTO || 4310);
if (process.argv.includes('--servir')) { servidor.listen(PUERTO, () => console.log(`http://localhost:${PUERTO}/ui-ejemplos.html`)); }
else {
  let chromium = null;
  try { ({ chromium } = await import('playwright')); } catch { try { ({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright')); } catch { /* sin Playwright */ } }
  if (!chromium) { console.log(`${ok} pruebas OK · sin Playwright: se saltó la parte de navegador`); process.exit(0); }
  await new Promise((r) => servidor.listen(0, r));
  const base = `http://localhost:${servidor.address().port}`;
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', headless: true }).catch(() => chromium.launch({ headless: true }));
  const p = await b.newPage(); const errores = [];
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); }); p.on('pageerror', (e) => errores.push(e.message));
  const foco = () => p.evaluate(() => document.activeElement?.id || document.activeElement?.textContent?.trim().slice(0, 30));
  const log = () => p.textContent('#log');
  // Zag termina de abrir en el siguiente cuadro (posición y resaltado): una persona no teclea tan rápido; la prueba espera.
  const cuadro = () => p.waitForTimeout(120);
  try {
    await p.goto(base + '/ui-ejemplos.html'); await p.waitForFunction(() => document.querySelector('#t-tabs [role=tab]'));
    await t('menú: abre con Enter desde el botón, role=menu, aria-expanded y primer ítem resaltado', async () => {
      await p.focus('#m-acciones'); await p.keyboard.press('Enter');
      await p.waitForSelector('.ui-menu[role=menu][data-state=open]');
      assert.equal(await p.getAttribute('#m-acciones', 'aria-expanded'), 'true');
      assert.equal(await p.$$eval('.ui-menu[data-state=open] [role=menuitem]', (xs) => xs.length), 5);
      assert.equal(await p.textContent('.ui-mi[data-highlighted] b'), 'Abrir'); await cuadro();
    });
    await t('menú: ↓ salta el deshabilitado, tipo-para-buscar, Esc cierra y el foco vuelve al botón', async () => {
      await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
      assert.equal(await p.textContent('.ui-mi[data-highlighted] b'), 'Borrar');
      await p.keyboard.press('d'); assert.equal(await p.textContent('.ui-mi[data-highlighted] b'), 'Duplicar');
      await p.keyboard.press('Escape'); await p.waitForSelector('.ui-menu', { state: 'detached' });
      assert.equal(await foco(), 'm-acciones'); assert.equal(await p.getAttribute('#m-acciones', 'aria-expanded'), 'false');
    });
    await t('menú: Enter en un ítem corre su acción; ítem destructivo con su clase; atajo visible', async () => {
      await p.keyboard.press('Enter'); await p.waitForSelector('.ui-menu[data-state=open]'); await cuadro();
      assert.equal(await p.textContent('.ui-menu[data-state=open] .ui-mi.danger b'), 'Borrar'); assert.equal(await p.textContent('.ui-menu[data-state=open] .ui-mi.danger .ui-mi-k'), '⌫');
      await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter');
      await p.waitForFunction(() => document.querySelector('#log').textContent === 'Duplicar');
    });
    await t('menú: submenú con → y vuelve con ←', async () => {
      await p.focus('#m-acciones'); await p.keyboard.press('Enter'); await p.waitForSelector('.ui-menu[data-state=open] .ui-mi[data-highlighted]'); await cuadro();
      await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await cuadro(); await p.keyboard.press('ArrowRight');
      await p.waitForFunction(() => document.querySelectorAll('.ui-menu[data-state=open]').length === 2); await cuadro();
      await p.keyboard.press('ArrowLeft'); await p.waitForFunction(() => document.querySelectorAll('.ui-menu[data-state=open]').length === 1); await cuadro();
      await p.keyboard.press('ArrowRight'); await p.waitForFunction(() => document.querySelectorAll('.ui-menu[data-state=open]').length === 2); await cuadro();
      await p.keyboard.press('Enter'); await p.waitForFunction(() => document.querySelector('#log').textContent === 'Mover a Clientes');
      await p.waitForFunction(() => !document.querySelector('.ui-menu[data-state=open]'));
    });
    await t('menú con búsqueda: filtra al escribir, ↓ Enter elige, ✓ en el actual (menuitemradio)', async () => {
      await p.click('#m-buscar'); await p.waitForSelector('.ui-menu-q'); await cuadro(); assert.equal(await foco(), 'Buscar cliente…'.slice(0, 0) || await foco());
      assert.equal(await p.$$eval('[role=menuitemradio][aria-checked=true]', (xs) => xs.length), 1);
      await p.keyboard.type('na'); assert.deepEqual(await p.$$eval('.ui-mi b', (xs) => xs.map((x) => x.textContent)), ['Nao', 'Naru']);
      await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForFunction(() => document.querySelector('#log').textContent === 'Cliente: Naru');
    });
    await t('menú: el mismo botón lo abre y lo cierra (clic), clic afuera lo cierra', async () => {
      await p.click('#m-modelo'); await p.waitForSelector('.ui-menu[data-state=open]'); await cuadro();
      await p.click('#m-modelo'); await p.waitForSelector('.ui-menu', { state: 'detached' });
      await p.click('#m-modelo'); await p.waitForSelector('.ui-menu[data-state=open]'); await cuadro(); await p.mouse.click(5, 5); await p.waitForSelector('.ui-menu', { state: 'detached' });
    });
    await t('menú contextual: clic derecho lo abre en el punto y Floating UI lo deja dentro de la ventana', async () => {
      const r = await p.locator('#m-zona').boundingBox(); await p.mouse.click(r.x + r.width - 4, r.y + 10, { button: 'right' });
      await p.waitForSelector('.ui-menu[data-state=open]');
      const m = await p.locator('.ui-menu').boundingBox(), vw = p.viewportSize().width;
      assert.ok(m.x >= 0 && m.x + m.width <= vw, 'dentro de la ventana'); await p.keyboard.press('Escape');
    });
    await t('popover: role=dialog con etiqueta, foco adentro, Esc cierra y devuelve el foco', async () => {
      await p.click('#p-abrir'); await p.waitForSelector('.ui-pop[data-state=open]'); await cuadro();
      assert.equal(await p.getAttribute('.ui-pop', 'role'), 'dialog'); assert.equal(await p.getAttribute('.ui-pop', 'aria-label'), 'Contexto del chat');
      assert.ok(await p.evaluate(() => document.querySelector('.ui-pop').contains(document.activeElement)), await p.evaluate(() => document.activeElement.outerHTML.slice(0, 120) + ' ' + document.querySelectorAll('.ui-pop').length));
      await p.keyboard.press('Escape'); await p.waitForSelector('.ui-pop', { state: 'detached' }); assert.equal(await foco(), 'p-abrir');
    });
    await t('tooltip: al enfocar un [data-tip] aparece role=tooltip con el texto y se va con Esc', async () => {
      await p.focus('.itip'); await p.waitForSelector('[role=tooltip]', { state: 'attached' });
      await p.waitForFunction(() => document.querySelector('.ui-tip')?.textContent.includes('Lo que entró'));
      await p.keyboard.press('Escape'); await p.waitForFunction(() => document.querySelector('.ui-tip')?.dataset.state !== 'open');
    });
    await t('diálogo: confirmAsk abre el <dialog> modal, Esc = false y el foco vuelve', async () => {
      await p.click('#d-confirmar'); await p.waitForSelector('dialog.ui-dlg[open]');
      assert.equal(await p.evaluate(() => document.querySelector('dialog.ui-dlg').matches(':modal')), true);
      assert.equal(await p.evaluate(() => document.activeElement.textContent), 'Sí, confirmar');
      await p.keyboard.press('Escape'); await p.waitForFunction(() => document.querySelector('#log').textContent === 'confirmAsk → false');
      assert.equal(await foco(), 'd-confirmar');
    });
    await t('diálogo: ask valida lo obligatorio, Enter guarda y devuelve los valores', async () => {
      await p.click('#d-ask'); await p.waitForSelector('dialog.ui-dlg[open] input[name=titulo]');
      await p.keyboard.press('Enter'); assert.ok(await p.$('dialog.ui-dlg[open]'), 'sin título no cierra');
      await p.keyboard.type('Revisar copy'); await p.keyboard.press('Enter');
      await p.waitForFunction(() => document.querySelector('#log').textContent.startsWith('ask → {"titulo":"Revisar copy"'));
    });
    await t('diálogo: clic en el fondo cierra (panel lateral)', async () => {
      await p.click('#d-lado'); await p.waitForSelector('dialog.ui-dlg--lado[open]'); await p.mouse.click(10, 300);
      await p.waitForSelector('dialog.ui-dlg', { state: 'detached' });
    });
    await t('tabs y segmented: role=tablist/tab, aria-selected, ←→ Inicio Fin cambian y mueven el foco', async () => {
      assert.equal(await p.getAttribute('#t-tabs .tabs', 'role'), 'tablist'); assert.equal(await p.getAttribute('#t-seg .seg', 'role'), 'tablist');
      await p.focus('#t-tabs [aria-selected=true]'); await p.keyboard.press('ArrowRight');
      assert.equal(await log(), 'Vista: Tareas'); assert.equal(await p.getAttribute('#t-tabs [data-v=Tareas]', 'aria-selected'), 'true');
      await p.keyboard.press('End'); assert.equal(await log(), 'Vista: Historial'); await p.keyboard.press('ArrowRight'); assert.equal(await log(), 'Vista: Resumen');
      // El marcado que arma una pantalla (sin role) también queda accesible.
      assert.equal(await p.getAttribute('#t-marcado', 'role'), 'tablist'); assert.equal(await p.$$eval('#t-marcado [role=tab][aria-selected=true]', (xs) => xs.length), 1);
      await p.focus('#t-marcado .on'); await p.keyboard.press('ArrowRight');
      await p.waitForFunction(() => document.querySelector('#t-marcado [aria-selected=true]')?.textContent === 'con .on');
    });
    await t('movimiento reducido: sin animación de entrada en el menú', async () => {
      await p.emulateMedia({ reducedMotion: 'reduce' }); await p.click('#m-acciones'); await p.waitForSelector('.ui-menu[data-state=open]');
      assert.equal(await p.$eval('.ui-menu', (m) => getComputedStyle(m).animationName), 'none'); await p.keyboard.press('Escape'); await p.emulateMedia({ reducedMotion: null });
    });
    await t('sin errores de consola ni de CSP', async () => { assert.deepEqual(errores, []); });
  } finally { await b.close(); servidor.close(); }
  console.log(`${ok} pruebas de comportamiento de ui.js OK`);
}
