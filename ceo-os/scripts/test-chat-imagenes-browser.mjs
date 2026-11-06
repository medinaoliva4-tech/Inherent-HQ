import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright')); }
const base = process.env.TEST_BASE || 'http://localhost:3000';
if (!['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Solo pruebas locales');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const p = await browser.newPage({ viewport: { width: 800, height: 650 } });
await p.addInitScript(() => { document.startViewTransition = undefined; });
await p.route('**/api/chat/servidor', r => r.fulfill({ json: { en_linea: true, modelos: ['kimi-k3'] } }));
const foto = fs.readFileSync(new URL('./fixtures/vision-formas.jpg', import.meta.url));
await p.route('**/api/chat/sesiones/*/imagenes/*', r => r.fulfill({ contentType: 'image/jpeg', body: foto }));
let enviado, sid;
await p.route('**/api/chat/sesiones/*/turno', r => { enviado = r.request().postDataJSON(); sid = new URL(r.request().url()).pathname.split('/')[4]; return r.fulfill({ json: { ok: true, desde: 1, imagenes: [{ id: 'foto1', nombre: 'formas.jpg' }] } }); });
await p.route('**/api/chat/sesiones/*?desde=*', r => r.fulfill({ json: { messages: [{ role: 'assistant', content: 'Cuadrado rojo y círculo azul.', pasos: [{ nombre: 'ver_imagen', fase: 'fin', detalle: 'formas.jpg', imagen: 'foto1' }] }], turno: { estado: 'listo' } } }));
const errores = []; p.on('pageerror', e => errores.push(e.message));
try {
 await p.goto(base + '/api/auth/dev'); try { await p.locator('[data-pd=pausa]').click({ timeout: 4000 }); } catch {}
 await p.goto(base + '/#/chat');
 await p.locator('[data-a=menu-modo]').click(); await p.getByRole('option').filter({ hasText: 'Sin modo' }).click();
 const chooser = p.waitForEvent('filechooser'); await p.locator('[data-a=adjuntar]').click(); await (await chooser).setFiles({ name: 'formas.jpg', mimeType: 'image/jpeg', buffer: foto });
 await p.locator('.lc-adj-img').waitFor(); assert.equal(await p.locator('.lc-adj-img').count(), 1);
 await p.locator('#llm-in').fill('¿Qué formas ves?'); await p.locator('#llm-in').press('Enter');
 await p.getByText('Cuadrado rojo y círculo azul.', { exact: true }).waitFor();
 assert.match(enviado.imagenes[0].data, /^data:image\/jpeg;base64,/); assert.ok(!enviado.mensaje.includes('base64'));
 await p.locator('.lm-steps summary').filter({ hasText: 'Vio una imagen' }).waitFor();
 await p.locator('.lm.u [data-a=ver-adjunto]').click(); await p.locator('.llm-imagen-dialog img').waitFor();
 assert.ok(await p.locator('.llm-imagen-dialog img').evaluate(i => i.naturalWidth > 0));
 await p.getByRole('button', { name: 'Cerrar imagen' }).click();
 await p.route(base + '/api/chat/sesiones/' + sid, r => r.fulfill({ json: { messages: [{ role: 'user', content: '¿Qué formas ves?', imagenes: [{ id: 'foto1', nombre: 'formas.jpg' }] }, { role: 'assistant', content: 'Cuadrado rojo y círculo azul.', pasos: [{ nombre: 'ver_imagen', fase: 'fin', detalle: 'formas.jpg', imagen: 'foto1' }] }], turno: { estado: 'listo' } } }));
 await p.reload(); await p.locator('.lm-steps summary').filter({ hasText: 'Vio una imagen' }).waitFor();
 assert.equal(await p.locator('.lm.u [data-a=ver-adjunto]').count(), 1);
 await p.locator('#boot').waitFor({ state: 'hidden' });
 if (process.env.TEST_SHOT) await p.screenshot({ path: process.env.TEST_SHOT });
 assert.deepEqual(errores, []);
 console.log('PASS: adjuntar → JPEG real → miniatura → Vio una imagen → abrir captura');
} catch (e) { console.error({ errores, enviado: Boolean(enviado) }); throw e; } finally {
 if (sid) await p.evaluate(async id => { const { api } = await import('/js/core.js'); await api('chat/sesiones/' + encodeURIComponent(id), { method: 'DELETE' }); }, sid).catch(() => {});
 await browser.close();
}
