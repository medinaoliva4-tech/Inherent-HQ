import assert from 'node:assert/strict';
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright')); }
const base = process.env.TEST_BASE || 'http://localhost:3000'; if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Solo pruebas locales');
const b = await chromium.launch({ channel: 'chrome', headless: true }), p = await b.newPage(); let lecturas = 0, cancelaciones = 0;
await p.route('**/api/chat/sesiones/ventanas/turno', r => r.fulfill({ json: { desde: 1 } }));
await p.route('**/api/chat/sesiones/ventanas/detener', r => { cancelaciones++; return r.fulfill({ json: { ok: true } }); });
await p.route('**/api/chat/sesiones/ventanas?desde=*', r => { lecturas++; return r.fulfill({ json: { turno: { estado: lecturas >= 2 ? 'listo' : 'trabajando', avance: { ventana: lecturas, tarea: 'Comprobar resultado' } }, messages: [{ role: 'assistant', content: lecturas >= 2 ? 'Terminado' : '' }] } }); });
try {
 await p.goto(base + '/api/auth/dev');
 const r = await p.evaluate(async () => { const { turnoServidor } = await import('/js/chat-gateway.js'); const ctrl = new AbortController(), notas = []; const r = await turnoServidor('ventanas', { mensaje: 'Prueba', modelo: { provider: 'servidor', model: 'kimi-k3' }, signal: ctrl.signal, on: { nota: n => notas.push(n) } }); ctrl.abort(); return { r, notas }; });
 assert.equal(r.r.texto, 'Terminado'); assert.ok(r.notas.some(n => n.startsWith('Ventana 1'))); assert.ok(r.notas.some(n => n.startsWith('Ventana 2'))); assert.equal(cancelaciones, 0);
 console.log('PASS: progreso entre ventanas y cancelar una espera terminada no cancela otro turno');
} finally { await b.close(); }
