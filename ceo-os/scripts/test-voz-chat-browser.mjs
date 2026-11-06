import assert from 'node:assert/strict';
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright')); }
const base = process.env.TEST_BASE || 'http://localhost:3000'; if (!['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Solo pruebas locales');
const browser = await chromium.launch({ channel: 'chrome', headless: true }), p = await browser.newPage();
await p.addInitScript(() => {
 document.startViewTransition = undefined;
 window.SpeechRecognition = class { start() { window.reconocedorPrueba = this; } abort() {} };
 window.oirPrueba = text => window.reconocedorPrueba.onresult({ results: [Object.assign([{ transcript: text }], { isFinal: true })] });
 window.dichoPrueba = [];
 Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], cancel() {}, speak(u) { window.dichoPrueba.push(u.text); queueMicrotask(() => { u.onstart?.(); u.onend?.(); }); } } });
});
await p.route('**/api/chat/servidor', r => r.fulfill({ json: { en_linea: true, modelos: ['kimi-k3'] } }));
let sid, turnos = [], vozSeparada = 0;
await p.route('**/api/chat/voz/token', r => { vozSeparada++; return r.fulfill({ status: 503, json: { code: 'NO_VOZ' } }); });
await p.route('**/api/chat/sesiones/*/turno', r => { const id = new URL(r.request().url()).pathname.split('/')[4]; sid ||= id; turnos.push({ id, ...r.request().postDataJSON() }); return r.fulfill({ json: { ok: true, desde: turnos.length * 2 - 1 } }); });
await p.route('**/api/chat/sesiones/*?desde=*', r => r.fulfill({ json: { turno: { estado: 'listo' }, messages: [{ role: 'assistant', content: turnos.length === 1 ? 'Referencia guardada.' : 'Tu referencia es FARO.' }] } }));
const errores=[]; p.on('pageerror',e=>errores.push(e.message));
try {
 await p.goto(base + '/api/auth/dev'); try { await p.locator('[data-pd=pausa]').click({ timeout: 3000 }); } catch {}
 await p.goto(base + '/#/chat'); await p.locator('[data-a=menu-modo]').click(); await p.getByRole('option').filter({ hasText: 'Sin modo' }).click();
 await p.locator('#llm-in').fill('Mi referencia es FARO'); await p.locator('#llm-in').press('Enter'); await p.getByText('Referencia guardada.', { exact: true }).waitFor();
 await p.locator('[data-act=conversar]').click(); await p.locator('.vz[data-estado=escuchando]').waitFor();
 await p.evaluate(() => window.oirPrueba('¿Cuál es mi referencia?'));
 await p.waitForFunction(() => window.dichoPrueba.some(t => t.includes('FARO')));
 assert.equal(turnos.length, 2); assert.equal(turnos[1].id, turnos[0].id); assert.equal(turnos[1].modelo, 'kimi-k3'); assert.match(turnos[1].sistema, /conversación es hablada/); assert.equal(vozSeparada,0);
 await p.locator('[data-v=teclado]').click(); await p.locator('.vz').waitFor({ state: 'detached' }); assert.ok((await p.locator('.llm-main').textContent()).includes('Mi referencia es FARO'));
 await p.evaluate(async () => { const { abrirConversacion } = await import('/js/conversacion-ui.js'); window.detencionesPrueba = 0; abrirConversacion({ titulo: 'Prueba', detener: () => window.detencionesPrueba++, enviar: (_, o) => { o.alDelta('Primera frase.'); return new Promise(()=>{}); } }); });
 await p.evaluate(() => window.oirPrueba('Lee una respuesta larga'));
 await p.locator('.vz[data-estado=hablando]').waitFor(); await p.locator('.vz [data-v=mic]').click(); assert.equal(await p.evaluate(() => window.detencionesPrueba),1); await p.locator('[data-v=cerrar]').click();
 assert.deepEqual(errores, []); console.log('PASS: voz usa el mismo hilo/modelo del Chat, lee su respuesta, no abre Gemini y permite interrumpir');
} finally { if(sid) await p.evaluate(async id => { const { api } = await import('/js/core.js'); await api('chat/sesiones/'+id,{method:'DELETE'}); },sid).catch(()=>{}); await browser.close(); }
