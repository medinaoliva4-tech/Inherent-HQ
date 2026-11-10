import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { entorno, crearUsuario, leerUsuarios, main } from '../asistente.mjs';

const MASTER = 'sk-master-ultra-secreta'; const VKEY = 'sk-virtual-generada-123';
async function fakeLitellm() {
  const calls = [];
  const s = createServer(async (req, res) => {
    let b = ''; for await (const c of req) b += c;
    calls.push({ url: req.url, auth: req.headers.authorization, body: b ? JSON.parse(b) : null });
    const send = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (req.url === '/v1/models') return send(200, { data: ['nivel-alto', 'nivel-medio', 'nivel-bajo', 'cp-glm-5.3', 'nv-x'].map((id) => ({ id })) });
    if (req.url === '/key/generate') return send(200, { key: VKEY });
    if (req.url === '/key/delete') return send(200, {});
    if (req.url === '/health/readiness') return send(200, { db: 'connected' });
    if (req.url === '/v1/chat/completions') return send(200, { model: 'x' });
    send(404, {});
  });
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  return { calls, url: `http://127.0.0.1:${s.address().port}`, close: () => s.close() };
}
const setup = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'asist-')); const l = await fakeLitellm();
  writeFileSync(join(dir, '.env'), `LITELLM_MASTER_KEY=${MASTER}\n`);
  const env = entorno({ HOME: dir, GATEWAY_ENV: join(dir, '.env'), PUENTE_DATA_DIR: join(dir, 'data'), LITELLM_URL: l.url });
  return { dir, l, env };
};

test('usuario: crea llave virtual limitada y guarda solo el hash del token (archivo 600)', async () => {
  const { l, env } = await setup();
  const u = await crearUsuario(env, MASTER, 'ana', { niveles: ['nivel-medio', 'nivel-bajo'], directos: ['cp-'], presupuesto: 3, dias: 7 });
  const gen = l.calls.find((c) => c.url === '/key/generate');
  assert.equal(gen.auth, `Bearer ${MASTER}`);
  assert.deepEqual(gen.body.models.sort(), ['cp-glm-5.3', 'nivel-bajo', 'nivel-medio']);
  assert.equal(gen.body.max_budget, 3); assert.equal(gen.body.budget_duration, '7d');
  const reg = leerUsuarios(env.usersFile).users[0];
  assert.equal(reg.tokenHash, createHash('sha256').update(u.token).digest('hex'));
  assert.equal(reg.litellmKey, VKEY);
  assert.ok(!readFileSync(env.usersFile, 'utf8').includes(u.token));
  assert.equal(statSync(env.usersFile).mode & 0o777, 0o600);
  assert.ok(existsSync(join(env.data, 'users', 'ana', 'home')));
  l.close();
});

test('usuario: la llave incluye los respaldos de sus niveles (si no, el respaldo de LiteLLM falla) y nada más', async () => {
  const { l, env } = await setup();
  await crearUsuario(env, MASTER, 'cio', { niveles: ['nivel-medio'], directos: [] });
  const gen = l.calls.find((c) => c.url === '/key/generate');
  assert.deepEqual(gen.body.models.sort(), ['cp-glm-5.3', 'nivel-medio']);
  l.close();
});

test('usuario: la salida del asistente nunca imprime la master ni la llave virtual', async () => {
  const { l, env, dir } = await setup(); const out = [];
  await main(['usuario', 'bea'], { HOME: dir, GATEWAY_ENV: join(dir, '.env'), PUENTE_DATA_DIR: join(dir, 'data'), LITELLM_URL: l.url }, (s) => out.push(s));
  const todo = out.join('\n');
  assert.ok(!todo.includes(MASTER) && !todo.includes(VKEY));
  assert.match(todo, /token del puente/);
  l.close();
});

test('usuario: id inválido se rechaza', async () => {
  const { l, env } = await setup();
  await assert.rejects(crearUsuario(env, MASTER, '../x'), /id/);
  l.close();
});

test('revisión: si algo falla no activa la interfaz y dice el siguiente paso; sin la llave maestra no prueba niveles', async () => {
  const { dir, l } = await setup(); const out = [];
  writeFileSync(join(dir, '.env'), 'CLINE_API_KEY=x\n');
  const code = await main([], { HOME: dir, GATEWAY_ENV: join(dir, '.env'), PUENTE_DATA_DIR: join(dir, 'data'), LITELLM_URL: l.url, CUOTAS_URL: 'http://127.0.0.1:1', PUENTE_URL: 'http://127.0.0.1:1', ASISTENTE_UNITS: 'unidad-inexistente', PUENTE_CLAUDE_PATH: '/no/existe' }, (s) => out.push(s));
  assert.equal(code, 1);
  assert.ok(!existsSync(join(dir, 'data', 'interfaz-activada')));
  const t = out.join('\n');
  assert.match(t, /✗ Faltan llaves/); assert.match(t, /→ Pégalas ocultas con: bash/); assert.match(t, /DESACTIVADA/);
  assert.ok(!t.includes('CLINE_API_KEY=x'));
  l.close();
});
