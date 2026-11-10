// Controles de seguridad del puente. Cada prueba existe para fallar si el control se quita.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { boot, fakeQuery, fakeServices, init, result, testConfig, TOKEN, TOKEN_B, USER_A, sha } from './helpers.js';
import { loadConfig, readUsersFile } from '../src/config.js';
import { bwrapArgv, bwrapWorks, makeBwrapSpawner } from '../src/confine.js';
import { verifyUserKeys } from '../src/keys.js';

const simple = async function* () { yield init(); yield { type: 'assistant', message: { content: [{ type: 'text', text: 'Hola' }], usage: { input_tokens: 1, output_tokens: 1 } } }; yield result(); };
const base = { PUENTE_USERS_FILE: '/x/users.json' };
const okUsers = { users: [{ id: 'ana', tokenHash: sha('t'.repeat(30)), litellmKey: 'sk-ana-1234', levels: ['nivel-bajo'], modelPrefixes: [] }] };

// ---------- (c) autenticación por token y por usuario, solo localhost ----------
test('auth: cada token identifica a un usuario y las sesiones no se cruzan', async () => {
  const t = await boot(fakeQuery(simple));
  assert.equal((await t.api('GET', '/me')).json.user, 'ana');
  assert.equal((await t.api('GET', '/me', undefined, TOKEN_B)).json.user, 'bea');
  assert.equal((await t.api('GET', '/me', undefined, 'x'.repeat(30))).status, 401);
  const s = (await t.api('POST', '/sessions', { projectId: 'p', model: 'nivel-medio' })).json;
  assert.ok(s.id);
  assert.equal((await t.api('GET', `/sessions/${s.id}`, undefined, TOKEN_B)).status, 404);
  assert.equal((await t.api('POST', `/sessions/${s.id}/messages`, { text: 'x' }, TOKEN_B)).status, 404);
  assert.equal((await t.api('GET', '/sessions', undefined, TOKEN_B)).json.sessions.length, 0);
  assert.equal((await t.api('GET', '/sessions')).json.sessions.length, 1);
  await t.close();
});

test('config: solo escucha en loopback', () => {
  const rd = () => okUsers;
  assert.throws(() => loadConfig({ ...base, PUENTE_HOST: '0.0.0.0' }, rd), /127\.0\.0\.1/);
  assert.throws(() => loadConfig({ ...base, PUENTE_HOST: '100.83.31.16' }, rd), /127\.0\.0\.1/);
  assert.equal(loadConfig({ ...base }, rd).host, '127.0.0.1');
  assert.equal(loadConfig({ ...base, PUENTE_HOST: '::1' }, rd).host, '::1');
});

test('config: el archivo de usuarios no puede ser legible por otros', () => {
  const d = mkdtempSync(join(tmpdir(), 'usr-')); const f = join(d, 'users.json');
  writeFileSync(f, JSON.stringify(okUsers)); chmodSync(f, 0o644);
  assert.throws(() => readUsersFile(f), /permisos/);
  chmodSync(f, 0o600);
  assert.equal(readUsersFile(f).users[0]!.id, 'ana');
});

test('config: valida usuarios (hash, llave virtual, niveles)', () => {
  const mk = (u: object) => () => ({ users: [{ ...okUsers.users[0], ...u }] });
  assert.throws(() => loadConfig(base, mk({ tokenHash: 'abc' })), /tokenHash/);
  assert.throws(() => loadConfig(base, mk({ litellmKey: 'no-es-llave' })), /litellmKey/);
  assert.throws(() => loadConfig(base, mk({ levels: ['nivel-supremo'] })), /nivel/);
  assert.throws(() => loadConfig(base, mk({ id: '../x' })), /id/);
  assert.throws(() => loadConfig(base, () => ({ users: [] })), /usuario/);
});

// ---------- (b) llave virtual por usuario; nunca la master ----------
test('master key: el puente se niega a arrancar si tiene la master en su entorno', () => {
  const rd = () => okUsers;
  assert.throws(() => loadConfig({ ...base, LITELLM_MASTER_KEY: 'sk-master' }, rd), /master/i);
  assert.throws(() => loadConfig({ ...base, LITELLM_KEY: 'sk-master' }, rd), /master|LITELLM_KEY/i);
});

test('master key: una llave de usuario con poderes de administrador se rechaza al verificar', async () => {
  const adminFetch = (async () => new Response('[]', { status: 200 })) as unknown as typeof fetch;
  await assert.rejects(verifyUserKeys('http://x', [USER_A], adminFetch), /administrador|master/i);
  const denied = (async () => new Response(JSON.stringify({ error: 'Only proxy admin' }), { status: 403 })) as unknown as typeof fetch;
  await verifyUserKeys('http://x', [USER_A], denied);
});

test('el arnés recibe solo la llave virtual del usuario que habla', async () => {
  const seen: Record<string, any>[] = [];
  const t = await boot(fakeQuery(simple, seen));
  for (const [tok, model] of [[TOKEN, 'nivel-medio'], [TOKEN_B, 'nivel-bajo']] as const) {
    const s = (await t.api('POST', '/sessions', { projectId: 'p', model, mode: 'chat' }, tok)).json;
    await t.api('POST', `/sessions/${s.id}/messages`, { text: 'hola' }, tok);
    await t.events(s.id, (e) => e.type === 'turn_end', 0, undefined, tok);
  }
  assert.equal(seen[0]!.env.ANTHROPIC_AUTH_TOKEN, 'sk-ana-limitada');
  assert.equal(seen[1]!.env.ANTHROPIC_AUTH_TOKEN, 'sk-bea-limitada');
  for (const o of seen) {
    const blob = JSON.stringify(o.env);
    assert.ok(!/master/i.test(blob));
    assert.ok(!Object.keys(o.env).some((k) => /^(PUENTE_|LITELLM_)/.test(k)));
  }
  await t.close();
});

test('niveles permitidos: un usuario solo puede usar sus niveles', async () => {
  const t = await boot(fakeQuery(simple));
  const bea = (m: string) => t.api('POST', '/sessions', { projectId: 'p', model: m }, TOKEN_B);
  assert.equal((await bea('nivel-bajo')).status, 201);
  assert.equal((await bea('nivel-alto')).status, 403);
  assert.equal((await bea('cp-kimi-k3')).status, 403);
  const models = (await t.api('GET', '/models', undefined, TOKEN_B)).json.models.map((m: any) => m.id);
  assert.deepEqual(models, ['nivel-bajo']);
  const s = (await bea('nivel-bajo')).json;
  assert.equal((await t.api('PATCH', `/sessions/${s.id}`, { model: 'nivel-alto' }, TOKEN_B)).status, 403);
  await t.close();
});

// ---------- (a) confinamiento: carpeta por usuario/proyecto + bubblewrap ----------
test('carpeta de trabajo por usuario y proyecto', async () => {
  const t = await boot(fakeQuery(simple));
  const a = (await t.api('POST', '/sessions', { projectId: 'demo', model: 'nivel-medio' })).json;
  const b = (await t.api('POST', '/sessions', { projectId: 'demo', model: 'nivel-bajo' }, TOKEN_B)).json;
  assert.equal(a.cwd, join(t.cfg.workspacesDir, 'ana', 'demo'));
  assert.equal(b.cwd, join(t.cfg.workspacesDir, 'bea', 'demo'));
  assert.notEqual(a.cwd, b.cwd);
  await t.close();
});

test('sin confinamiento disponible, Code y Plan se rechazan y Chat sigue funcionando', async () => {
  const t = await boot(fakeQuery(simple), testConfig(undefined, { requireConfine: true, confine: 'none' }));
  assert.equal((await t.api('POST', '/sessions', { projectId: 'p', mode: 'code' })).status, 503);
  assert.equal((await t.api('POST', '/sessions', { projectId: 'p', mode: 'plan' })).status, 503);
  const chat = await t.api('POST', '/sessions', { projectId: 'p', mode: 'chat' });
  assert.equal(chat.status, 201);
  const s = chat.json;
  assert.equal((await t.api('PATCH', `/sessions/${s.id}`, { mode: 'code' })).status, 503);
  assert.equal((await t.api('GET', '/me')).json.confinamiento.activo, false);
  await t.close();
});

test('con confinamiento, el arnés se lanza dentro de bwrap con solo su carpeta y su HOME', async () => {
  const seen: Record<string, any>[] = [];
  const cfg = testConfig(undefined, { confine: 'bwrap', requireConfine: true });
  const svc = fakeServices({ spawner: (u, cwd) => makeBwrapSpawner({ workspace: cwd, home: join(cfg.dataDir, 'users', u.id, 'home'), readOnly: [], bwrapPath: '/bin/echo' }) });
  const t = await boot(fakeQuery(simple, seen), cfg, svc);
  const s = (await t.api('POST', '/sessions', { projectId: 'demo', mode: 'code' })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'hola' });
  await t.events(s.id, (e) => e.type === 'turn_end');
  assert.equal(typeof seen[0]!.spawnClaudeCodeProcess, 'function');
  assert.equal(seen[0]!.env.CLAUDE_CODE_SUBPROCESS_ENV_SCRUB, '0');
  assert.equal(seen[0]!.env.HOME, join(cfg.dataDir, 'users', 'ana', 'home'));
  await t.close();
});

test('bwrapArgv: sin /home, sin .env, entorno limpio y nada de red extra', () => {
  const host = '/home/deploy/code-os/data';
  const a = bwrapArgv({ workspace: `${host}/workspaces/ana/demo`, home: `${host}/users/ana/home`, readOnly: ['/opt/puente/node_modules/@anthropic-ai/x'] }, { command: '/opt/x/claude', args: ['--print'], cwd: `${host}/workspaces/ana/demo`, env: { HOME: `${host}/users/ana/home`, ANTHROPIC_AUTH_TOKEN: 'sk-ana' } });
  const s = a.join(' ');
  for (const f of ['--clearenv', '--die-with-parent', '--unshare-pid', '--new-session', '--ro-bind /usr /usr', '--tmpfs /tmp']) assert.ok(s.includes(f), f);
  assert.ok(!s.includes('/home/deploy/gateway'));
  assert.ok(!/--bind \S*\/\.env|--bind \/ /.test(s));
  assert.ok(!s.includes('--share-net') && !s.includes('--dev-bind'));
  const binds = a.flatMap((x, i) => (x === '--bind' ? [a[i + 1]] : []));
  assert.deepEqual(binds.sort(), [`${host}/users/ana/home`, `${host}/workspaces/ana/demo`].sort());
  assert.ok(s.includes('--setenv ANTHROPIC_AUTH_TOKEN sk-ana'));
  assert.deepEqual(a.slice(a.indexOf('--') + 1), ['/opt/x/claude', '--print']);
  assert.ok(s.includes('--chdir ' + `${host}/workspaces/ana/demo`));
});

const real = bwrapWorks();
const jail = (script: string, hostEnv: Record<string, string> = {}) => {
  const root = mkdtempSync(join(tmpdir(), 'jail-'));
  const work = join(root, 'workspaces', 'ana', 'demo'); const home = join(root, 'users', 'ana', 'home');
  mkdirSync(work, { recursive: true }); mkdirSync(home, { recursive: true });
  mkdirSync(join(root, 'workspaces', 'bea', 'demo'), { recursive: true });
  writeFileSync(join(root, '.env'), 'LITELLM_MASTER_KEY=sk-master\n');
  writeFileSync(join(root, 'workspaces', 'bea', 'demo', 'secreto.txt'), 'de bea');
  symlinkSync(join(root, '.env'), join(work, 'enlace'));
  const argv = bwrapArgv({ workspace: work, home, readOnly: [] }, { command: '/bin/sh', args: ['-c', script], cwd: work, env: { HOME: home, PATH: '/usr/bin:/bin' } });
  const r = spawnSync('bwrap', argv, { encoding: 'utf8', env: { PATH: '/usr/bin:/bin', ...hostEnv } });
  return { ...r, root, work };
};
test('bwrap real: no puede salir de su carpeta, leer .env, ni ver otros usuarios', { skip: !real && 'bwrap no usable aquí' }, () => {
  const r = jail(`pwd; cat "$PWD/../../../.env" 2>&1; echo "--"; ls "$PWD/../../bea" 2>&1; echo "--"; cat enlace 2>&1; echo "--"; echo ok > escrito.txt && echo escrito; ls /home 2>&1`);
  assert.ok(!r.stdout.includes('sk-master'), r.stdout);
  assert.ok(!r.stdout.includes('secreto'), r.stdout);
  assert.ok(r.stdout.includes('escrito'));
  assert.ok(existsSync(join(r.work, 'escrito.txt')));
});
test('bwrap real: el entorno del servidor no es visible', { skip: !real && 'bwrap no usable aquí' }, () => {
  const r = jail('env', { LITELLM_MASTER_KEY: 'sk-master-del-host', PUENTE_TOKENS: 'tok' });
  assert.ok(!r.stdout.includes('sk-master-del-host') && !r.stdout.includes('PUENTE_TOKENS'));
});
test('bwrap real: no puede escribir fuera de su carpeta', { skip: !real && 'bwrap no usable aquí' }, () => {
  const r = jail('echo x > "$PWD/../../../intruso" 2>&1; echo x > /usr/intruso 2>&1; echo x > /etc/intruso 2>&1');
  assert.ok(!existsSync(join(r.root, 'intruso')));
  assert.ok(!existsSync('/usr/intruso') && !existsSync('/etc/intruso'));
});

// ---------- (d) modo suscripción ----------
test('suscripción: con sesión de Claude activa, nivel-alto corre con ella y el medidor lo cuenta como claude_login', async () => {
  const seen: Record<string, any>[] = [];
  const svc = fakeServices(); svc.claudeActive.ana = true;
  const t = await boot(fakeQuery(simple, seen), testConfig(), svc);
  const s = (await t.api('POST', '/sessions', { projectId: 'p', model: 'nivel-alto', mode: 'chat' })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'hola' });
  const ev = await t.events(s.id, (e) => e.type === 'turn_end');
  const start = ev.find((e) => e.type === 'turn_start');
  assert.equal(start.via, 'claude_login'); assert.equal(start.model, 'opus'); assert.equal(start.requestedModel, 'nivel-alto');
  assert.equal(seen[0]!.model, 'opus');
  assert.equal(seen[0]!.env.ANTHROPIC_AUTH_TOKEN, undefined); assert.equal(seen[0]!.env.ANTHROPIC_BASE_URL, undefined);
  assert.ok(!JSON.stringify(seen[0]!.env).includes('sk-ana'));
  assert.deepEqual(svc.reports, [{ user: 'ana', ok: true }]);
  await t.close();
});

test('suscripción: sin sesión activa cae a nivel-alto de LiteLLM con la llave del usuario', async () => {
  const seen: Record<string, any>[] = [];
  const svc = fakeServices();
  const t = await boot(fakeQuery(simple, seen), testConfig(), svc);
  const s = (await t.api('POST', '/sessions', { projectId: 'p', model: 'nivel-alto', mode: 'chat' })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'hola' });
  const ev = await t.events(s.id, (e) => e.type === 'turn_end');
  assert.equal(ev.find((e) => e.type === 'turn_start').via, 'litellm');
  assert.equal(seen[0]!.model, 'nivel-alto'); assert.equal(seen[0]!.env.ANTHROPIC_AUTH_TOKEN, 'sk-ana-limitada');
  assert.deepEqual(svc.reports, []);
  await t.close();
});

test('suscripción: si Claude llega a su límite antes de empezar, el turno se rehace por LiteLLM', async () => {
  const seen: Record<string, any>[] = [];
  let n = 0;
  const q = fakeQuery(async function* () {
    n++;
    yield init();
    if (n === 1) { yield result({ subtype: 'success', is_error: true, result: 'Claude AI usage limit reached|1731000000' }); return; }
    yield { type: 'assistant', message: { content: [{ type: 'text', text: 'respaldo' }] } }; yield result();
  }, seen);
  const svc = fakeServices(); svc.claudeActive.ana = true;
  const t = await boot(q, testConfig(), svc);
  const s = (await t.api('POST', '/sessions', { projectId: 'p', model: 'nivel-alto', mode: 'chat' })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'hola' });
  const ev = await t.events(s.id, (e) => e.type === 'turn_end');
  const fb = ev.find((e) => e.type === 'route_fallback');
  assert.ok(fb && fb.from === 'claude_login' && fb.to === 'litellm');
  const end = ev.filter((e) => e.type === 'turn_end');
  assert.equal(end.length, 1); assert.equal(end[0].ok, true);
  assert.equal(seen[1]!.model, 'nivel-alto'); assert.equal(seen[1]!.env.ANTHROPIC_AUTH_TOKEN, 'sk-ana-limitada');
  assert.deepEqual(svc.reports, [{ user: 'ana', ok: false }]);
  await t.close();
});

test('/me y /cuotas: estado de la sesión de Claude y proxy de solo lectura al medidor', async () => {
  const svc = fakeServices(); svc.claudeActive.ana = true;
  const t = await boot(fakeQuery(simple), testConfig(), svc);
  const me = (await t.api('GET', '/me')).json;
  assert.equal(me.claude.active, true); assert.deepEqual(me.levels, ['nivel-alto', 'nivel-medio', 'nivel-bajo']);
  assert.equal((await t.api('GET', '/me', undefined, TOKEN_B)).json.claude.active, false);
  assert.equal((await t.api('GET', '/cuotas')).json.proveedores[0].id, 'cline');
  assert.equal((await t.api('POST', '/cuotas', {})).status, 404);
  assert.deepEqual((await t.api('GET', '/health')).json.claude, { activa: true, instalada: true });
  assert.equal((await t.api('GET', '/health', undefined, null)).json.claude, undefined);
  assert.equal((await t.api('GET', '/cuotas', undefined, null)).status, 401);
  await t.close();
  const down = fakeServices({ cuotas: { get: async () => null, reportClaudeLogin: async () => {} } });
  const t2 = await boot(fakeQuery(simple), testConfig(), down);
  assert.equal((await t2.api('GET', '/cuotas')).status, 503);
  await t2.close();
});

// ---------- interfaz estática ----------
test('interfaz estática: se sirve sin token, sin salirse de su carpeta y sin tapar la API', async () => {
  const ui = mkdtempSync(join(tmpdir(), 'ui-')); mkdirSync(join(ui, 'assets'));
  writeFileSync(join(ui, 'index.html'), '<h1>Code OS</h1>'); writeFileSync(join(ui, 'assets', 'a.js'), 'console.log(1)');
  writeFileSync(join(ui, '..', 'fuera-' + Date.now()), 'secreto');
  const t = await boot(fakeQuery(simple), testConfig(undefined, { uiDir: ui }));
  const get = async (p: string, h: Record<string, string> = {}) => { const r = await fetch(t.base + p, { headers: h }); return { status: r.status, text: await r.text(), type: r.headers.get('content-type') }; };
  assert.match((await get('/')).text, /Code OS/);
  assert.equal((await get('/assets/a.js')).type?.includes('javascript'), true);
  assert.match((await get('/proyecto/algo')).text, /Code OS/);
  for (const p of ['/..%2Ffuera', '/%2e%2e/%2e%2e/etc/passwd', '/assets/..%2f..%2fx']) { const r = await get(p); assert.ok(!/secreto|root:/.test(r.text), p); }
  assert.equal((await get('/sessions')).status, 401);
  assert.equal(readFileSync(join(ui, 'index.html'), 'utf8').length > 0, true);
  await t.close();
});

test('interfaz: con flag configurado, solo se sirve si el asistente la activó; la API sigue funcionando', async () => {
  const ui = mkdtempSync(join(tmpdir(), 'ui-')); writeFileSync(join(ui, 'index.html'), '<h1>Code OS</h1>');
  const flag = join(mkdtempSync(join(tmpdir(), 'fl-')), 'activada');
  const t = await boot(fakeQuery(simple), testConfig(undefined, { uiDir: ui, flagFile: flag }));
  const r1 = await fetch(t.base + '/'); assert.equal(r1.status, 503); assert.match(await r1.text(), /asistente/);
  assert.equal((await t.api('GET', '/me')).status, 200);
  writeFileSync(flag, 'ok');
  const r2 = await fetch(t.base + '/'); assert.equal(r2.status, 200);
  await t.close();
});

// ---------- archivos y diff para la pestaña Code (siempre dentro de la carpeta del proyecto) ----------
const hasGit = spawnSync('git', ['--version']).status === 0;
test('archivos: árbol, lectura y escritura solo dentro del proyecto; ni .., ni symlinks, ni otros usuarios', async () => {
  const t = await boot(fakeQuery(simple));
  const s = (await t.api('POST', '/sessions', { projectId: 'p', model: 'nivel-medio', mode: 'chat' })).json;
  const f = (p: string) => `/sessions/${s.id}/files/${encodeURIComponent(p)}`;
  writeFileSync(join(s.cwd, 'hola.txt'), 'hola'); mkdirSync(join(s.cwd, 'src')); writeFileSync(join(s.cwd, 'src', 'a.ts'), 'x'); mkdirSync(join(s.cwd, 'node_modules')); writeFileSync(join(s.cwd, 'node_modules', 'basura.js'), 'x');
  const outside = join(t.cfg.workspacesDir, 'fuera.txt'); writeFileSync(outside, 'secreto'); symlinkSync(outside, join(s.cwd, 'enlace.txt'));
  const tree = (await t.api('GET', `/sessions/${s.id}/files`)).json.archivos;
  assert.deepEqual(tree.map((n: any) => n.nombre).sort(), ['enlace.txt', 'hola.txt', 'src']);
  assert.equal(tree.find((n: any) => n.nombre === 'src').hijos[0].ruta, 'src/a.ts');
  assert.equal((await t.api('GET', f('hola.txt'))).json.contenido, 'hola');
  assert.equal((await t.api('GET', f('../../fuera.txt'))).status, 403);
  assert.equal((await t.api('GET', f('/etc/passwd'))).status, 403);
  assert.equal((await t.api('GET', f('enlace.txt'))).status, 403);
  assert.equal((await t.api('PUT', f('nuevo/b.txt'), { contenido: 'b' })).status, 200);
  assert.equal(readFileSync(join(s.cwd, 'nuevo', 'b.txt'), 'utf8'), 'b');
  assert.equal((await t.api('PUT', f('../escape.txt'), { contenido: 'x' })).status, 403);
  assert.equal((await t.api('PUT', f('enlace.txt'), { contenido: 'pisado' })).status, 403);
  assert.equal(readFileSync(outside, 'utf8'), 'secreto');
  assert.equal((await t.api('PUT', f('.git/config'), { contenido: '[core]' })).status, 403);
  assert.equal((await t.api('GET', f('hola.txt'), undefined, TOKEN_B)).status, 404);
  await t.close();
});

test('diff: muestra lo que cambió desde que se creó la sesión', { skip: !hasGit && 'sin git' }, async () => {
  const t = await boot(fakeQuery(simple));
  const s = (await t.api('POST', '/sessions', { projectId: 'p', model: 'nivel-medio', mode: 'chat' })).json;
  writeFileSync(join(s.cwd, 'a.txt'), 'uno\n');
  assert.deepEqual((await t.api('GET', `/sessions/${s.id}/diff`)).json.archivos.map((a: any) => a.ruta), ['a.txt']);
  await t.close();
});

test('interfaz v2: archivos por ?path=, diff con anterior/nuevo, /mcp, /skills, historial y cola de mensajes', { skip: !hasGit && 'sin git' }, async () => {
  const skills = mkdtempSync(join(tmpdir(), 'sk-')); mkdirSync(join(skills, 'revisar')); writeFileSync(join(skills, 'revisar', 'SKILL.md'), '---\nname: revisar\ndescription: Revisa código\n---\ncuerpo');
  let release!: () => void; const gate = new Promise<void>((r) => { release = r; });
  let n = 0;
  const slow = async function* () { n++; yield init(); if (n === 1) await gate; yield { type: 'assistant', message: { content: [{ type: 'text', text: 'ok' + n }] } }; yield result(); };
  const t = await boot(fakeQuery(slow), testConfig(undefined, { skillsDir: skills }));
  const s = (await t.api('POST', '/sessions', { projectId: 'p', model: 'nivel-medio', mode: 'chat' })).json;
  await new Promise((r) => setTimeout(r, 300));
  writeFileSync(join(s.cwd, 'a.txt'), 'uno\n');
  assert.equal((await t.api('GET', `/sessions/${s.id}/files?path=a.txt`)).json.contenido, 'uno\n');
  assert.equal((await t.api('PUT', `/sessions/${s.id}/files?path=b.txt`, { contenido: 'dos' })).status, 200);
  assert.equal((await t.api('GET', `/sessions/${s.id}/files?path=../x`)).status, 403);
  const d = (await t.api('GET', `/sessions/${s.id}/diff`)).json.archivos.find((a: any) => a.ruta === 'a.txt');
  assert.equal(d.nuevo, 'uno\n'); assert.equal(d.mas, 1);
  assert.deepEqual((await t.api('GET', '/mcp')).json.mcp.map((m: any) => m.nombre), ['demo']);
  assert.equal((await t.api('GET', '/skills')).json.skills[0].descripcion, 'Revisa código');
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'uno' });
  assert.equal((await t.api('POST', `/sessions/${s.id}/messages`, { text: 'dos' })).status, 409);
  const q = await t.api('POST', `/sessions/${s.id}/messages`, { text: 'dos', queue: true });
  assert.equal(q.status, 202); assert.equal(q.json.queued, true);
  release();
  for (let i = 0; i < 50 && n < 2; i++) await new Promise((r) => setTimeout(r, 100));
  await new Promise((r) => setTimeout(r, 300));
  const h = (await t.api('GET', `/sessions/${s.id}/history`)).json.events;
  assert.equal(h.filter((e: any) => e.type === 'turn_end').length, 2);
  assert.deepEqual(h.filter((e: any) => e.type === 'user_message').map((e: any) => e.text), ['uno', 'dos']);
  await t.close();
});

test('interfaz: comprime (br/gzip) lo que lo merece para el enlace lento y no cambia el contenido', async () => {
  const ui = mkdtempSync(join(tmpdir(), 'ui-')); mkdirSync(join(ui, 'assets'));
  const big = 'console.log("hola");\n'.repeat(500); writeFileSync(join(ui, 'index.html'), '<h1>Code OS</h1>'); writeFileSync(join(ui, 'assets', 'a.js'), big);
  const t = await boot(fakeQuery(simple), testConfig(undefined, { uiDir: ui }));
  const r = await fetch(t.base + '/assets/a.js', { headers: { 'accept-encoding': 'br' } });
  assert.equal(r.headers.get('content-encoding'), 'br'); assert.ok(Number(r.headers.get('content-length')) < big.length / 5); assert.equal(await r.text(), big);
  const g = await fetch(t.base + '/assets/a.js', { headers: { 'accept-encoding': 'gzip' } });
  assert.equal(g.headers.get('content-encoding'), 'gzip'); assert.equal(await g.text(), big);
  const plain = await fetch(t.base + '/assets/a.js', { headers: { 'accept-encoding': 'identity' } });
  assert.equal(plain.headers.get('content-encoding'), null); assert.equal(await plain.text(), big);
  assert.equal((await fetch(t.base + '/', { headers: { 'accept-encoding': 'br' } })).headers.get('content-encoding'), null);
  await t.close();
});
