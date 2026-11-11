// Prueba del pase de Code OS: lo que firma el OS lo acepta el puente (mismo algoritmo que code-os/puente/src/pase.ts).
import assert from 'node:assert/strict';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { firmarPase, urlCode, rutas } from '../api/_lib/code.js';
import { traducir, proyectoDe } from '../public/js/chat-code-puro.js';
import { rutear, COCINEROS } from '../public/js/llm/router-code.js';
import { modosDe, modoDe, MODO_CODE, HARNESS } from '../public/js/llm/modos.js';

const SECRET = 'secreto-compartido-con-el-puente-0123456789abcdef';
// Verificador equivalente al del puente (HS256, aud, typ, exp, vida ≤ 15 min).
function verificar(secret, token, ahora = Date.now()) {
  const p = token.split('.'); if (p.length !== 3) return null;
  const esp = createHmac('sha256', secret).update(`${p[0]}.${p[1]}`).digest(); const dado = Buffer.from(p[2], 'base64url');
  if (dado.length !== esp.length || !timingSafeEqual(dado, esp)) return null;
  const h = JSON.parse(Buffer.from(p[0], 'base64url')), c = JSON.parse(Buffer.from(p[1], 'base64url'));
  if (h.alg !== 'HS256' || c.aud !== 'code-os' || c.typ !== 'pase' || !(c.exp * 1000 > ahora) || c.exp - c.iat > 900) return null;
  return c;
}

const t0 = Date.now();
const { pase, expira } = firmarPase(SECRET, 'Ana@InherentGlobal.com', t0);
const c = verificar(SECRET, pase, t0 + 1000);
assert.equal(c.sub, 'ana@inherentglobal.com', 'el correo viaja en minúsculas');
assert.equal(expira, c.exp * 1000);
assert.ok(c.exp - c.iat === 600, 'dura 10 minutos');
assert.equal(verificar(SECRET, pase, t0 + 11 * 60_000), null, 'caduca');
assert.equal(verificar('otro-secreto-otro-secreto-otro-secreto-1', pase, t0 + 1000), null, 'otro secreto no sirve');
assert.equal(verificar(SECRET, pase.slice(0, -2) + 'xx', t0 + 1000), null, 'firma alterada');

assert.equal(urlCode({}), 'https://code.inherentglobal.com');
assert.equal(urlCode({ CODEOS_URL: 'https://x.test///' }), 'https://x.test');

// La ruta existe, es POST y exige sesión (guard responde 401 sin cookie).
const rs = []; rutas((m, n, h) => rs.push([m, n, h]));
assert.deepEqual(rs.map((r) => r.slice(0, 2)), [['POST', 'code/pase']]);
let status = 0; const res = { status(s) { status = s; return this; }, json() { return this; }, setHeader() {} };
await rs[0][2]({ headers: {}, method: 'POST' }, res).catch(() => {});
assert.ok([401, 403].includes(status), 'sin sesión no entrega pase (' + status + ')');
// El motor: eventos del puente → lo que el Chat ya pinta.
const est = { texto: '' };
assert.deepEqual(traducir({ type: 'turn_start', via: 'claude_login', model: 'opus' }, est), [['nota', 'Corre con tu sesión de Claude']]);
assert.deepEqual(traducir({ type: 'turn_start', via: 'litellm', model: 'nivel-medio' }, est), [['nota', 'Corre en nivel-medio']]);
traducir({ type: 'text_delta', text: 'Ho' }, est); assert.deepEqual(traducir({ type: 'text_delta', text: 'la' }, est), [['delta', 'Hola']]);
assert.deepEqual(traducir({ type: 'text_delta', text: 'x', parentToolUseId: 't' }, est), [], 'el texto de subagentes no se mezcla');
assert.equal(traducir({ type: 'tool_call', toolUseId: 'a', name: 'Write', input: { file_path: '/p/a.txt' } }, est)[0][1].detalle, '/p/a.txt');
assert.equal(traducir({ type: 'tool_result', toolUseId: 'a', isError: true, content: 'fallo' }, est)[0][1].fase, 'error');
assert.equal(traducir({ type: 'permission_request', requestId: 'r1', tool: 'Bash', input: { command: 'ls' } }, est)[0][0], 'permiso');
assert.deepEqual(traducir({ type: 'route_fallback', from: 'claude_login', to: 'litellm' }, est)[0][0], 'nota');
assert.deepEqual(traducir({ type: 'usage' }, est), []);
assert.equal(proyectoDe('Cerantola Marca!'), 'cerantola-marca-'); assert.equal(proyectoDe(''), 'general'); assert.ok(proyectoDe('../x').length > 0 && !proyectoDe('../x').includes('/'));
// Code es un modo del Chat para el equipo (no para clientes), con su cliente como proyecto.
assert.ok(modosDe('ceo', []).some((m) => m.id === 'code') && modosDe('team', []).some((m) => m.id === 'code'));
assert.ok(!modosDe('client', []).some((m) => m.id === 'code'));
assert.equal(modoDe('code'), MODO_CODE); assert.equal(MODO_CODE.pide, 'cliente'); assert.ok(HARNESS.code);
// El router por tarea (el «equipo de cocina»).
const nv = (t, o) => rutear(t, o).nivel, ck = (t, o) => rutear(t, o).cocinero;
assert.equal(ck('Planea cómo construir el módulo de reportes'), 'chef'); assert.equal(nv('Planea cómo construir el módulo de reportes'), 'nivel-alto');
assert.equal(ck('Haz una auditoría de seguridad del login'), 'chef', 'seguridad gana sobre auth');
assert.equal(ck('Arregla el login con Stripe'), 'sous');
assert.equal(ck('Hay un bug raro: falla intermitente al guardar'), 'sous');
assert.equal(ck('Ajusta la interfaz y el css del panel'), 'sous');
assert.equal(ck('Escribe las pruebas de este módulo'), 'linea');
assert.equal(ck('Renombra la variable cliente a cuenta'), 'prep'); assert.equal(nv('Busca dónde está definido guardar()'), 'nivel-bajo');
assert.equal(ck('Agrega un botón de exportar'), 'linea', 'lo demás es construir');
assert.equal(nv('Revisa este código', { ultimo: 'nivel-medio' }), 'nivel-alto'); assert.equal(nv('Haz un code review', { ultimo: 'nivel-alto' }), 'nivel-medio', 'otro cocinero revisa');
assert.ok(Object.values(COCINEROS).every((x) => x.nivel.startsWith('nivel-')));
// Los departamentos: el puente solo acepta los lineamientos al CREAR la sesión (systemPrompt ≤ 8000); /api/code/pase dice dónde está la interfaz.
{
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../public/js/chat-code.js', import.meta.url), 'utf8');
  assert.match(src, /systemPrompt: String\(sistema\)\.slice\(0, 8000\)/);
  assert.match(src, /export const sesionCode = /);
  const code = fs.readFileSync(new URL('../api/_lib/code.js', import.meta.url), 'utf8');
  assert.match(code, /ui: urlUi\(\)/);
}
console.log('✓ test-code: pase firmado, aceptable por el puente, con caducidad y sin sesión no se entrega');
