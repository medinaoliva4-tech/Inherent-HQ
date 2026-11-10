// Integración: el binario real de Claude Code (vía SDK) contra un "Anthropic" falso que responde con un guion.
// Valida de verdad canUseTool, el streaming y los eventos. Se omite si el binario del SDK no está instalado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { boot, testConfig } from './helpers.js';
import { realQuery } from '../src/sdk.js';

const sse = (res: any, evs: [string, unknown][]) => { res.writeHead(200, { 'content-type': 'text/event-stream' }); for (const [e, d] of evs) res.write(`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`); res.end(); };
const msg = (id: string, blocks: any[], stop: string) => [
  ['message_start', { type: 'message_start', message: { id, type: 'message', role: 'assistant', model: 'cp-glm-5.3', content: [], stop_reason: null, usage: { input_tokens: 111, output_tokens: 1 } } }],
  ...blocks.flatMap((b, i) => [
    ['content_block_start', { type: 'content_block_start', index: i, content_block: b.kind === 'tool' ? { type: 'tool_use', id: b.id, name: b.name, input: {} } : { type: 'text', text: '' } }],
    ['content_block_delta', { type: 'content_block_delta', index: i, delta: b.kind === 'tool' ? { type: 'input_json_delta', partial_json: JSON.stringify(b.input) } : { type: 'text_delta', text: b.text } }],
    ['content_block_stop', { type: 'content_block_stop', index: i }],
  ]),
  ['message_delta', { type: 'message_delta', delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 7 } }],
  ['message_stop', { type: 'message_stop' }],
] as [string, unknown][];

async function fakeAnthropic(cwdOf: () => string) {
  const calls: any[] = [];
  const srv = createServer(async (req, res) => {
    const chunks: Buffer[] = []; for await (const c of req) chunks.push(c as Buffer);
    if (req.url?.startsWith('/v1/models')) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ data: [{ id: 'cp-glm-5.3' }] })); }
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    calls.push(body);
    const hasResult = JSON.stringify(body.messages ?? []).includes('tool_result');
    const main = Array.isArray(body.tools) && body.tools.length > 0;
    const blocks = main && !hasResult
      ? [{ kind: 'text', text: 'Voy a crear el archivo. ' }, { kind: 'tool', id: 'toolu_01', name: 'Write', input: { file_path: join(cwdOf(), 'hola.txt'), content: 'hola desde el puente\n' } }]
      : [{ kind: 'text', text: 'Listo, archivo creado.' }];
    const stop = main && !hasResult ? 'tool_use' : 'end_turn';
    if (body.stream === false) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: 'x', content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } })); }
    sse(res, msg('msg_' + calls.length, blocks, stop));
  });
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${(srv.address() as AddressInfo).port}`, calls, close: () => { srv.closeAllConnections(); srv.close(); } };
}

const binOk = (() => { try { const p = join(process.cwd(), 'node_modules/@anthropic-ai'); return existsSync(p) && require_any(p); } catch { return false; } })();
function require_any(p: string) { return ['darwin-arm64', 'darwin-x64', 'linux-x64', 'linux-arm64'].some((s) => existsSync(join(p, `claude-agent-sdk-${s}`))); }

test('integración: arnés real + modelo falso — escribe un archivo solo si la interfaz aprueba', { skip: !binOk && 'binario del SDK no instalado', timeout: 90_000 }, async () => {
  let cwd = '';
  const fake = await fakeAnthropic(() => cwd);
  const cfg = testConfig(undefined, { litellmUrl: fake.url, turnTimeoutMs: 60_000, permissionTimeoutMs: 30_000 });
  const t = await boot(realQuery, cfg); // servidor HTTP real con el SDK real
  try {
    for (const decision of ['deny', 'allow'] as const) {
      const s = (await t.api('POST', '/sessions', { projectId: `int-${decision}`, mode: 'code' })).json;
      assert.equal(s.model, 'cp-glm-5.3', JSON.stringify(s));
      cwd = s.cwd;
      await t.api('POST', `/sessions/${s.id}/messages`, { text: 'Crea hola.txt' });
      const ev = await t.events(s.id, (e) => e.type === 'turn_end', 0, async (e) => {
        if (e.type === 'permission_request') {
          assert.equal(e.tool, 'Write');
          await t.api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, { decision, message: 'no gracias' });
        }
      });
      const types = ev.map((e) => e.type);
      for (const k of ['turn_start', 'text_delta', 'tool_call', 'permission_request', 'tool_result', 'turn_end']) assert.ok(types.includes(k), `${decision}: falta ${k} en ${types.join(',')}`);
      const end = ev.at(-1);
      assert.equal(end.ok, true, JSON.stringify(end));
      assert.ok(end.usage.inputTokens > 0 && end.usage.outputTokens > 0);
      const file = join(s.cwd, 'hola.txt');
      if (decision === 'allow') assert.equal(readFileSync(file, 'utf8'), 'hola desde el puente\n');
      else assert.equal(existsSync(file), false);
      assert.equal(ev.find((e) => e.type === 'tool_result').isError, decision === 'deny');
    }
    assert.ok(fake.calls.length >= 4);
  } finally { await t.close(); fake.close(); }
});
