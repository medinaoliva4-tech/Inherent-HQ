// «Planifica fuerte, ejecuta barato» con el binario REAL de Claude Code contra un Anthropic falso.
// Verifica: el planificador (nivel-alto) no puede escribir (hook), delega al subagente `ejecutor`, el ejecutor
// pide el modelo barato (nivel-medio) aunque el planificador intente forzar otro, y el reparto de tokens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { boot, testConfig } from './helpers.js';
import { realQuery } from '../src/sdk.js';

type Blk = { kind: 'text'; text: string } | { kind: 'tool'; id: string; name: string; input: unknown };
const sse = (res: any, evs: [string, unknown][]) => { res.writeHead(200, { 'content-type': 'text/event-stream' }); for (const [e, d] of evs) res.write(`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`); res.end(); };
const msg = (id: string, model: string, blocks: Blk[], stop: string, inTok: number, outTok: number) => [
  ['message_start', { type: 'message_start', message: { id, type: 'message', role: 'assistant', model, content: [], stop_reason: null, usage: { input_tokens: inTok, output_tokens: 1 } } }],
  ...blocks.flatMap((b, i) => [
    ['content_block_start', { type: 'content_block_start', index: i, content_block: b.kind === 'tool' ? { type: 'tool_use', id: b.id, name: b.name, input: {} } : { type: 'text', text: '' } }],
    ['content_block_delta', { type: 'content_block_delta', index: i, delta: b.kind === 'tool' ? { type: 'input_json_delta', partial_json: JSON.stringify(b.input) } : { type: 'text_delta', text: b.text } }],
    ['content_block_stop', { type: 'content_block_stop', index: i }],
  ]),
  ['message_delta', { type: 'message_delta', delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: outTok } }],
  ['message_stop', { type: 'message_stop' }],
] as [string, unknown][];

async function fakeAnthropic(cwdOf: () => string) {
  const calls: { model: string; rol: string }[] = [];
  const srv = createServer(async (req, res) => {
    const chunks: Buffer[] = []; for await (const c of req) chunks.push(c as Buffer);
    if (req.url?.startsWith('/v1/models')) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ data: [] })); }
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    const sys = JSON.stringify(body.system ?? '');
    const conv = JSON.stringify(body.messages ?? []);
    const tools: string[] = (body.tools ?? []).map((t: any) => t.name);
    if (body.stream === false || !tools.length) { // llamadas auxiliares (títulos, etc.)
      calls.push({ model: body.model, rol: 'aux' });
      if (body.stream === false) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: body.model, content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } })); }
      return sse(res, msg('aux', body.model, [{ kind: 'text', text: 'ok' }], 'end_turn', 1, 1));
    }
    const ejecutor = sys.includes('Eres el EJECUTOR');
    calls.push({ model: body.model, rol: ejecutor ? 'ejecutor' : 'planificador' });
    const n = calls.length;
    let blocks: Blk[]; let stop = 'tool_use';
    if (ejecutor) {
      if (!conv.includes('tool_result')) blocks = [{ kind: 'tool', id: 'toolu_w' + n, name: 'Write', input: { file_path: join(cwdOf(), 'hola.txt'), content: 'hecho por el ejecutor\n' } }];
      else { blocks = [{ kind: 'text', text: 'Evidencia: escribí hola.txt (1 línea).' }]; stop = 'end_turn'; }
      return sse(res, msg('e' + n, body.model, blocks, stop, 200, 40));
    }
    if (!conv.includes('tool_result')) blocks = [{ kind: 'tool', id: 'toolu_p1', name: 'Write', input: { file_path: join(cwdOf(), 'directo.txt'), content: 'no debería\n' } }];
    else if (!conv.includes('Evidencia')) blocks = [{ kind: 'tool', id: 'toolu_a1', name: tools.includes('Agent') ? 'Agent' : 'Task', input: { subagent_type: 'ejecutor', description: 'Escribir hola', prompt: 'Crea hola.txt con el texto «hecho por el ejecutor».', model: 'opus' } }];
    else { blocks = [{ kind: 'text', text: 'Listo: el ejecutor creó hola.txt.' }]; stop = 'end_turn'; }
    sse(res, msg('p' + n, body.model, blocks, stop, 3000, 300));
  });
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${(srv.address() as AddressInfo).port}`, calls, close: () => { srv.closeAllConnections(); srv.close(); } };
}

const binOk = ['darwin-arm64', 'darwin-x64', 'linux-x64', 'linux-arm64'].some((s) => existsSync(join(process.cwd(), 'node_modules/@anthropic-ai', `claude-agent-sdk-${s}`)));

test('plan/ejecución real: el planificador delega, el ejecutor usa el modelo barato y se mide el reparto', { skip: !binOk && 'binario del SDK no instalado', timeout: 120_000 }, async () => {
  let cwd = '';
  const fake = await fakeAnthropic(() => cwd);
  const cfg = testConfig(undefined, { litellmUrl: fake.url, turnTimeoutMs: 90_000, permissionTimeoutMs: 30_000 });
  const t = await boot(realQuery, cfg);
  try {
    const s = (await t.api('POST', '/sessions', { projectId: 'plan-real', model: 'nivel-alto', mode: 'chat', capacidades: ['codigo'] })).json;
    assert.equal(s.model, 'nivel-alto', JSON.stringify(s));
    cwd = s.cwd;
    const T0 = Date.now(); await t.api('POST', `/sessions/${s.id}/messages`, { text: 'Crea hola.txt' });
    const ev = await t.events(s.id, (e) => e.type === 'turn_end', 0, async (e) => {
      if (e.type === 'permission_request') await t.api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, { decision: 'allow' });
    });
    const start = ev.find((e) => e.type === 'turn_start');
    assert.equal(start.planner, 'nivel-alto'); assert.equal(start.executor, 'nivel-medio'); assert.equal(start.planEjecucion, true);
    const end = ev.at(-1);
    assert.equal(end.ok, true, JSON.stringify(end));
    // El planificador no escribió directo; el ejecutor sí.
    assert.equal(existsSync(join(cwd, 'directo.txt')), false);
    assert.equal(readFileSync(join(cwd, 'hola.txt'), 'utf8'), 'hecho por el ejecutor\n');
    // Cada rol pidió su modelo (el `model: 'opus'` del planificador se ignoró).
    const plan = fake.calls.filter((c) => c.rol === 'planificador'); const ejec = fake.calls.filter((c) => c.rol === 'ejecutor');
    assert.ok(plan.length >= 3 && ejec.length >= 2, JSON.stringify(fake.calls));
    assert.ok(plan.every((c) => c.model === 'nivel-alto'), JSON.stringify(plan));
    assert.ok(ejec.every((c) => c.model === 'nivel-medio'), JSON.stringify(ejec));
    // El permiso de escritura llegó marcado como del subagente, y sus eventos traen parentToolUseId.
    assert.ok(ev.some((e) => e.type === 'permission_request' && e.tool === 'Write' && e.parentAgentId), 'permiso del ejecutor');
    assert.ok(ev.some((e) => e.type === 'tool_call' && e.name === 'Write' && e.parentToolUseId === 'toolu_a1'), 'tool_call del ejecutor con parentToolUseId');
    // Reparto: tokens del planificador vs. del ejecutor, y por modelo.
    assert.ok(end.usageByModel?.['nivel-alto'] && end.usageByModel?.['nivel-medio'], JSON.stringify(end.usageByModel));
    assert.deepEqual(end.reparto.planifica, end.usageByModel['nivel-alto']); assert.deepEqual(end.reparto.ejecuta, end.usageByModel['nivel-medio']);
    assert.equal(fake.calls.filter((c) => c.rol === 'planificador').length, 3, 'el planificador espera al ejecutor (Agent en primer plano)');
    console.log("[reparto]", JSON.stringify({ porModelo: end.usageByModel, reparto: end.reparto, n: fake.calls.length, tiempo: Date.now() - T0 })); 
  } finally { await t.close(); fake.close(); }
});
