import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Config } from '../src/config.js';
import { createApp } from '../src/http.js';
import { SessionManager } from '../src/manager.js';
import { makeModelCatalog } from '../src/models.js';
import { SessionStore } from '../src/store.js';
import type { QueryFn } from '../src/types.js';

export const TOKEN = 'token-de-prueba-0123456789abcdef';
export const MODELS = ['cp-glm-5.3', 'cp-kimi-k3', 'nv-x'];

export function testConfig(dataDir = mkdtempSync(join(tmpdir(), 'puente-')), over: Partial<Config> = {}): Config {
  return { port: 0, host: '127.0.0.1', tokens: [TOKEN], litellmUrl: 'http://litellm.fake', litellmKey: 'sk-litellm-secreta', agentKey: 'sk-agente-limitada', envScrub: false, defaultModel: 'cp-glm-5.3', modelAllow: [], dataDir, workspacesDir: join(dataDir, 'workspaces'), maxConcurrentTurns: 3, maxTurns: 10, turnTimeoutMs: 5000, permissionTimeoutMs: 2000, mcpCatalog: { demo: { type: 'stdio', command: 'x' } }, sandbox: false, ...over };
}

const fakeFetch = (async () => new Response(JSON.stringify({ data: MODELS.map((id) => ({ id })) }), { status: 200 })) as unknown as typeof fetch;

export async function boot(query: QueryFn, cfg = testConfig()) {
  const models = makeModelCatalog(cfg, fakeFetch);
  const mgr = new SessionManager(cfg, new SessionStore(cfg.dataDir), models, query);
  const server = createApp(cfg, mgr, models);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const api = async (method: string, path: string, body?: unknown, token: string | null = TOKEN) => {
    const res = await fetch(base + path, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, json: (await res.json().catch(() => null)) as any };
  };
  /** Lee el SSE hasta que `stop` devuelva true; devuelve todos los eventos. */
  const events = async (id: string, stop: (e: any) => boolean, after = 0, onEvent?: (e: any) => Promise<void> | void) => {
    const ac = new AbortController();
    const res = await fetch(`${base}/sessions/${id}/events`, { headers: { authorization: `Bearer ${TOKEN}`, 'last-event-id': String(after) }, signal: ac.signal });
    const out: any[] = []; let buf = '';
    const dec = new TextDecoder();
    try {
    for await (const chunk of res.body as any) {
      buf += dec.decode(chunk, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, i); buf = buf.slice(i + 2);
        const data = block.split('\n').find((l) => l.startsWith('data: '));
        if (!data) continue;
        const e = JSON.parse(data.slice(6)); out.push(e);
        await onEvent?.(e);
        if (stop(e)) { ac.abort(); return out; }
      }
    }
    } catch (err) { if ((err as Error).name !== 'AbortError') throw err; }
    return out;
  };
  return { base, api, events, mgr, cfg, close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) };
}

/** Modelo falso: `script` recibe las opciones del SDK y emite los mensajes que emitiría el arnés. */
export type Script = (opts: Record<string, any>, ctx: { signal: AbortSignal }) => AsyncGenerator<any>;
export function fakeQuery(script: Script, seen: Record<string, any>[] = []): QueryFn {
  return ({ prompt, options }) => {
    seen.push(options);
    const ac = new AbortController();
    options.abortController?.signal.addEventListener('abort', () => ac.abort());
    return {
      async *[Symbol.asyncIterator]() {
        const first = await prompt[Symbol.asyncIterator]().next();
        options.__prompt = first.value?.message?.content;
        yield* script(options, { signal: ac.signal });
      },
      interrupt: async () => { ac.abort(); },
      close() {},
    };
  };
}

export const init = (sid = 'sdk-sess-1') => ({ type: 'system', subtype: 'init', session_id: sid });
export const textDelta = (text: string) => ({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'text_delta', text } }, parent_tool_use_id: null });
export const result = (extra: Record<string, any> = {}) => ({ type: 'result', subtype: 'success', is_error: false, num_turns: 2, duration_ms: 1234, result: 'listo', usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50, cache_creation_input_tokens: 0 }, ...extra });
