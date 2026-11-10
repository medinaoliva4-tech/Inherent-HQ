import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { boot, fakeQuery, init, result, textDelta, testConfig, TOKEN } from './helpers.js';

const simple = async function* () { yield init(); yield textDelta('Ho'); yield textDelta('la'); yield { type: 'assistant', message: { content: [{ type: 'text', text: 'Hola' }], usage: { input_tokens: 10, output_tokens: 2 } } }; yield result(); };

test('auth: /health abierto, el resto exige token de la plataforma', async () => {
  const t = await boot(fakeQuery(simple));
  assert.equal((await t.api('GET', '/health', undefined, null)).status, 200);
  assert.equal((await t.api('GET', '/models', undefined, null)).status, 401);
  assert.equal((await t.api('GET', '/models', undefined, 'otro-token-incorrecto-123456789')).status, 401);
  assert.equal((await t.api('GET', '/models')).status, 200);
  await t.close();
});

test('modelos: lista los alias de LiteLLM y rechaza uno que no existe', async () => {
  const t = await boot(fakeQuery(simple));
  const m = await t.api('GET', '/models');
  assert.deepEqual(m.json.models.map((x: any) => x.id), ['cp-glm-5.3', 'cp-kimi-k3', 'nv-x']);
  assert.equal((await t.api('POST', '/sessions', { projectId: 'demo', model: 'no-existe' })).status, 400);
  const ok = await t.api('POST', '/sessions', { projectId: 'demo', model: 'cp-kimi-k3' });
  assert.equal(ok.status, 201); assert.equal(ok.json.model, 'cp-kimi-k3');
  await t.close();
});

test('proyectos: carpeta aislada por proyecto y projectId malicioso rechazado', async () => {
  const t = await boot(fakeQuery(simple));
  for (const bad of ['../etc', 'A/B', '', '.oculto', 'a'.repeat(80)]) assert.equal((await t.api('POST', '/sessions', { projectId: bad })).status, 400, bad);
  const a = await t.api('POST', '/sessions', { projectId: 'proy-a' });
  const b = await t.api('POST', '/sessions', { projectId: 'proy-b' });
  assert.notEqual(a.json.cwd, b.json.cwd);
  assert.ok(a.json.cwd.startsWith(t.cfg.workspacesDir) && existsSync(a.json.cwd));
  assert.equal((await t.api('GET', '/sessions?projectId=proy-a')).json.sessions.length, 1);
  await t.close();
});

test('modos: chat sin herramientas, plan y code con permisos; el entorno del arnés no filtra llaves', async () => {
  const seen: Record<string, any>[] = [];
  const t = await boot(fakeQuery(simple, seen));
  for (const mode of ['chat', 'plan', 'code']) {
    const s = (await t.api('POST', '/sessions', { projectId: 'demo', mode })).json;
    await t.api('POST', `/sessions/${s.id}/messages`, { text: 'hola' });
    await t.events(s.id, (e) => e.type === 'turn_end');
  }
  assert.deepEqual(seen[0]!.tools, []);
  assert.equal(seen[1]!.permissionMode, 'plan'); assert.equal(seen[1]!.tools, undefined);
  assert.equal(seen[2]!.permissionMode, 'default'); assert.equal(typeof seen[2]!.canUseTool, 'function');
  for (const o of seen) {
    assert.equal(o.model, 'cp-glm-5.3'); assert.deepEqual(o.settingSources, []); assert.equal(o.strictMcpConfig, true);
    assert.equal(o.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'cp-glm-5.3'); assert.equal(o.env.ANTHROPIC_BASE_URL, 'http://litellm.fake');
    assert.equal(o.env.ANTHROPIC_AUTH_TOKEN, 'sk-agente-limitada'); assert.equal(o.env.PUENTE_TOKENS, undefined); assert.equal(o.env.LITELLM_KEY, undefined);
  }
  await t.close();
});

test('turno completo: texto en streaming, herramienta con permiso, resultado y uso de tokens', async () => {
  const script = async function* (o: any, ctx: any) {
    yield init(); yield { type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'thinking_delta', thinking: 'pienso' } } };
    yield textDelta('Voy a escribir');
    const input = { file_path: join(o.cwd, 'hola.txt'), content: 'hola' };
    yield { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'tu1', name: 'Write', input }], usage: { input_tokens: 30, output_tokens: 5 } } };
    const r = await o.canUseTool('Write', input, { signal: ctx.signal, toolUseID: 'tu1' });
    yield { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'tu1', is_error: r.behavior === 'deny', content: r.behavior }] } };
    yield result();
  };
  const t = await boot(fakeQuery(script));
  const s = (await t.api('POST', '/sessions', { projectId: 'demo' })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'crea hola.txt' });
  const ev = await t.events(s.id, (e) => e.type === 'turn_end', 0, async (e) => {
    if (e.type === 'permission_request') {
      assert.equal(e.tool, 'Write');
      assert.equal((await t.api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, { decision: 'allow' })).status, 200);
    }
  });
  const types = ev.map((e) => e.type);
  for (const k of ['user_message', 'turn_start', 'thinking_delta', 'text_delta', 'tool_call', 'permission_request', 'permission_resolved', 'tool_result', 'usage', 'turn_end']) assert.ok(types.includes(k), `falta ${k}`);
  assert.deepEqual(ev.map((e) => e.seq), ev.map((_, i) => i + 1), 'seq consecutivo');
  assert.equal(ev.find((e) => e.type === 'tool_result').content, 'allow');
  const end = ev.at(-1);
  assert.deepEqual([end.ok, end.turns, end.usage.inputTokens, end.usage.outputTokens, end.usage.cacheReadTokens], [true, 2, 100, 20, 50]);
  const after = (await t.api('GET', `/sessions/${s.id}`)).json;
  assert.equal(after.totals.turns, 1); assert.equal(after.totals.inputTokens, 100); assert.equal(after.sdkSessionId, 'sdk-sess-1');
  await t.close();
});

test('permisos: «no» devuelve el rechazo al modelo y «sí a todo» evita preguntar de nuevo', async () => {
  const script = async function* (o: any, ctx: any) {
    yield init();
    const a = await o.canUseTool('Bash', { command: 'ls' }, { signal: ctx.signal, toolUseID: 'a' });
    const b = await o.canUseTool('Bash', { command: 'pwd' }, { signal: ctx.signal, toolUseID: 'b' });
    const c = await o.canUseTool('Bash', { command: 'date' }, { signal: ctx.signal, toolUseID: 'c' });
    yield result({ result: [a, b, c].map((x) => x.behavior + (x.message ? `:${x.message}` : '')).join('|') });
  };
  const t = await boot(fakeQuery(script));
  const s = (await t.api('POST', '/sessions', { projectId: 'demo' })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'x' });
  let n = 0;
  const ev = await t.events(s.id, (e) => e.type === 'turn_end', 0, async (e) => {
    if (e.type !== 'permission_request') return;
    const body = n++ === 0 ? { decision: 'deny', message: 'ni lo intentes' } : { decision: 'allow_all' };
    await t.api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, body);
  });
  assert.equal(n, 2, 'solo dos preguntas; la tercera se aprueba sola');
  assert.equal(ev.at(-1).result, 'deny:ni lo intentes|allow|allow');
  assert.ok(ev.some((e) => e.type === 'permission_resolved' && e.auto));
  await t.close();
});

test('guarda de rutas: escribir fuera del proyecto se rechaza sin preguntar, incluso con «sí a todo»; symlinks incluidos', async () => {
  const script = async function* (o: any, ctx: any) {
    yield init();
    mkdirSync(o.cwd, { recursive: true });
    symlinkSync('/etc', join(o.cwd, 'enlace'), 'dir');
    const rs = [];
    for (const p of ['../otro/x.txt', '/etc/passwd', 'enlace/passwd', 'sub/ok.txt']) rs.push((await o.canUseTool('Write', { file_path: p }, { signal: ctx.signal, toolUseID: p })).behavior);
    yield result({ result: rs.join(',') });
  };
  const t = await boot(fakeQuery(script));
  const s = (await t.api('POST', '/sessions', { projectId: 'demo' })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'x' });
  const ev = await t.events(s.id, (e) => e.type === 'turn_end', 0, async (e) => {
    if (e.type === 'permission_request') await t.api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, { decision: 'allow' });
  });
  assert.equal(ev.at(-1).result, 'deny,deny,deny,allow');
  assert.equal(ev.filter((e) => e.type === 'permission_request').length, 1, 'solo la ruta válida llega a preguntarse');
  await t.close();
});

test('modo plan: aprobar ExitPlanMode pasa la sesión a code', async () => {
  const script = async function* (o: any, ctx: any) {
    yield init();
    const r = await o.canUseTool('ExitPlanMode', { plan: '1. hacer algo' }, { signal: ctx.signal, toolUseID: 'p' });
    yield result({ result: JSON.stringify(r.updatedPermissions) });
  };
  const t = await boot(fakeQuery(script));
  const s = (await t.api('POST', '/sessions', { projectId: 'demo', mode: 'plan' })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'planea' });
  const ev = await t.events(s.id, (e) => e.type === 'turn_end', 0, async (e) => {
    if (e.type === 'permission_request') await t.api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, { decision: 'allow_all' });
  });
  assert.ok(ev.some((e) => e.type === 'mode_changed' && e.mode === 'code'));
  assert.equal((await t.api('GET', `/sessions/${s.id}`)).json.mode, 'code');
  assert.equal((await t.api('GET', `/sessions/${s.id}`)).json.allowAll, false, '«a todo» no aplica a ExitPlanMode');
  await t.close();
});

test('reanudar: tras reiniciar el puente la sesión se recupera de disco y usa resume', async () => {
  const cfg = testConfig();
  const t1 = await boot(fakeQuery(simple), cfg);
  const s = (await t1.api('POST', '/sessions', { projectId: 'demo', mode: 'plan' })).json;
  await t1.api('POST', `/sessions/${s.id}/messages`, { text: 'uno' });
  await t1.events(s.id, (e) => e.type === 'turn_end');
  await t1.close();

  const seen: Record<string, any>[] = [];
  const t2 = await boot(fakeQuery(simple, seen), cfg);
  assert.equal((await t2.api('GET', '/sessions?projectId=demo')).json.sessions[0].id, s.id);
  await t2.api('PATCH', `/sessions/${s.id}`, { model: 'cp-kimi-k3', mode: 'code' });
  await t2.api('POST', `/sessions/${s.id}/messages`, { text: 'dos' });
  await t2.events(s.id, (e) => e.type === 'turn_end');
  assert.equal(seen[0]!.resume, 'sdk-sess-1'); assert.equal(seen[0]!.model, 'cp-kimi-k3'); assert.equal(seen[0]!.permissionMode, 'default');
  assert.equal((await t2.api('GET', `/sessions/${s.id}`)).json.totals.turns, 2);
  assert.equal((await t2.api('GET', `/sessions/${'0'.repeat(8)}-0000-0000-0000-${'0'.repeat(12)}`)).status, 404);
  await t2.close();
});

test('SSE: Last-Event-ID repite solo lo posterior', async () => {
  const t = await boot(fakeQuery(simple));
  const s = (await t.api('POST', '/sessions', { projectId: 'demo' })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'x' });
  const all = await t.events(s.id, (e) => e.type === 'turn_end');
  const tail = await t.events(s.id, (e) => e.type === 'turn_end', 3);
  assert.deepEqual(tail.map((e) => e.seq), all.filter((e) => e.seq > 3).map((e) => e.seq));
  await t.close();
});

test('concurrencia: segundo mensaje con turno en curso da 409; interrumpir lo termina; límite global da 429', async () => {
  const slow = async function* (_o: any, ctx: any) {
    yield init();
    await new Promise<void>((r) => ctx.signal.addEventListener('abort', () => r(), { once: true }));
  };
  const t = await boot(fakeQuery(slow), testConfig(undefined, { maxConcurrentTurns: 1 }));
  const a = (await t.api('POST', '/sessions', { projectId: 'a' })).json;
  const b = (await t.api('POST', '/sessions', { projectId: 'b' })).json;
  assert.equal((await t.api('POST', `/sessions/${a.id}/messages`, { text: '1' })).status, 202);
  assert.equal((await t.api('POST', `/sessions/${a.id}/messages`, { text: '2' })).status, 409);
  assert.equal((await t.api('POST', `/sessions/${b.id}/messages`, { text: '3' })).status, 429);
  assert.equal((await t.api('PATCH', `/sessions/${a.id}`, { mode: 'chat' })).status, 409);
  await t.api('POST', `/sessions/${a.id}/interrupt`);
  const ev = await t.events(a.id, (e) => e.type === 'turn_end');
  assert.equal(ev.at(-1).ok, false); assert.equal(ev.at(-1).reason, 'aborted');
  assert.equal((await t.api('POST', `/sessions/${b.id}/messages`, { text: '4' })).status, 202);
  await t.api('POST', `/sessions/${b.id}/interrupt`);
  await t.close();
});

test('errores del arnés llegan como evento y no tumban el servicio; permisos sin respuesta expiran', async () => {
  const boom = async function* () { yield init(); throw new Error('LiteLLM 500'); };
  const t = await boot(fakeQuery(boom));
  const s = (await t.api('POST', '/sessions', { projectId: 'demo' })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'x' });
  const ev = await t.events(s.id, (e) => e.type === 'turn_end');
  assert.ok(ev.some((e) => e.type === 'error' && /LiteLLM 500/.test(e.message)));
  assert.equal(ev.at(-1).ok, false);
  assert.equal((await t.api('GET', '/health', undefined, null)).status, 200);
  await t.close();

  const ask = async function* (o: any, ctx: any) { yield init(); const r = await o.canUseTool('Bash', { command: 'ls' }, { signal: ctx.signal, toolUseID: 'z' }); yield result({ result: r.behavior + ':' + r.message }); };
  const t2 = await boot(fakeQuery(ask), testConfig(undefined, { permissionTimeoutMs: 100 }));
  const s2 = (await t2.api('POST', '/sessions', { projectId: 'demo' })).json;
  await t2.api('POST', `/sessions/${s2.id}/messages`, { text: 'x' });
  const ev2 = await t2.events(s2.id, (e) => e.type === 'turn_end');
  assert.equal(ev2.at(-1).result, 'deny:Sin respuesta a tiempo');
  await t2.close();
});

test('subagentes y MCP: solo del catálogo del servidor; se pasan al SDK fuera del modo chat', async () => {
  const seen: Record<string, any>[] = [];
  const t = await boot(fakeQuery(simple, seen));
  assert.equal((await t.api('POST', '/sessions', { projectId: 'demo', mcp: ['rm-rf'] })).status, 400);
  assert.equal((await t.api('POST', '/sessions', { projectId: 'demo', agents: { 'MAL NOMBRE': { description: 'd', prompt: 'p' } } })).status, 400);
  const s = (await t.api('POST', '/sessions', { projectId: 'demo', mcp: ['demo'], agents: { revisor: { description: 'revisa', prompt: 'Revisa el código', tools: ['Read'] } } })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'x' });
  await t.events(s.id, (e) => e.type === 'turn_end');
  assert.deepEqual(Object.keys(seen[0]!.mcpServers), ['demo']); assert.equal(seen[0]!.agents.revisor.tools[0], 'Read');
  await t.close();
});

test('cuerpo inválido y rutas desconocidas dan errores claros', async () => {
  const t = await boot(fakeQuery(simple));
  assert.equal((await t.api('POST', '/sessions', {})).status, 400);
  const s = (await t.api('POST', '/sessions', { projectId: 'demo' })).json;
  assert.equal((await t.api('POST', `/sessions/${s.id}/messages`, { text: '  ' })).status, 400);
  assert.equal((await t.api('POST', `/sessions/${s.id}/permissions/${'1'.repeat(8)}-1111-1111-1111-${'1'.repeat(12)}`, { decision: 'allow' })).status, 404);
  assert.equal((await t.api('GET', '/nada')).status, 404);
  void TOKEN;
  await t.close();
});
