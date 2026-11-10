import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { createHash } from 'node:crypto';
import type { Config, UserRecord } from '../src/config.js';
import type { Services } from '../src/services.js';
import { createApp } from '../src/http.js';
import { SessionManager } from '../src/manager.js';
import { makeModelCatalog } from '../src/models.js';
import { SessionStore } from '../src/store.js';
import type { QueryFn } from '../src/types.js';

export const TOKEN = 'token-de-prueba-0123456789abcdef';
export const TOKEN_B = 'token-de-bea-0123456789abcdef0123';
export const MODELS = ['cp-glm-5.3', 'cp-kimi-k3', 'nv-x', 'nivel-alto', 'nivel-medio', 'nivel-bajo'];
export const sha = (t: string) => createHash('sha256').update(t).digest('hex');
export const USER_A: UserRecord = { id: 'ana', tokenHash: sha(TOKEN), litellmKey: 'sk-ana-limitada', levels: ['nivel-alto', 'nivel-medio', 'nivel-bajo'], modelPrefixes: ['cp-', 'nv-'] };
export const USER_B: UserRecord = { id: 'bea', tokenHash: sha(TOKEN_B), litellmKey: 'sk-bea-limitada', levels: ['nivel-bajo'], modelPrefixes: [] };

export function testConfig(dataDir = mkdtempSync(join(tmpdir(), 'puente-')), over: Partial<Config> = {}): Config {
  return { port: 0, host: '127.0.0.1', users: [USER_A, USER_B], litellmUrl: 'http://litellm.fake', envScrub: false, defaultModel: 'cp-glm-5.3', subscriptionModel: 'opus', dataDir, workspacesDir: join(dataDir, 'workspaces'), maxConcurrentTurns: 3, maxTurns: 10, turnTimeoutMs: 5000, permissionTimeoutMs: 2000, mcpCatalog: { demo: { type: 'stdio', command: 'x' } }, confine: 'none', requireConfine: false, cuotasUrl: 'http://cuotas.fake', ...over };
}

export interface FakeServices extends Services { reports: { user: string; ok: boolean }[]; claudeActive: Record<string, boolean> }
export function fakeServices(over: Partial<Services> = {}): FakeServices {
  const reports: { user: string; ok: boolean }[] = []; const claudeActive: Record<string, boolean> = {};
  return {
    reports, claudeActive,
    claude: { status: async (u) => ({ installed: true, active: !!claudeActive[u.id], hint: 'haz claude login' }) },
    cuotas: { get: async () => ({ proveedores: [{ id: 'cline' }] }), reportClaudeLogin: async (u, ok) => { reports.push({ user: u.id, ok }); } },
    ...over,
  };
}

const fakeFetch = (async () => new Response(JSON.stringify({ data: MODELS.map((id) => ({ id })) }), { status: 200 })) as unknown as typeof fetch;

export async function boot(query: QueryFn, cfg = testConfig(), svc: Services = fakeServices()) {
  const models = makeModelCatalog(cfg, fakeFetch);
  const mgr = new SessionManager(cfg, new SessionStore(cfg.dataDir), models, query, svc);
  const server = createApp(cfg, mgr, models, svc);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const api = async (method: string, path: string, body?: unknown, token: string | null = TOKEN) => {
    const res = await fetch(base + path, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, json: (await res.json().catch(() => null)) as any };
  };
  /** Lee el SSE hasta que `stop` devuelva true; devuelve todos los eventos. */
  const events = async (id: string, stop: (e: any) => boolean, after = 0, onEvent?: (e: any) => Promise<void> | void, token = TOKEN) => {
    const ac = new AbortController();
    const res = await fetch(`${base}/sessions/${id}/events`, { headers: { authorization: `Bearer ${token}`, 'last-event-id': String(after) }, signal: ac.signal });
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
  return { base, api, events, mgr, cfg, svc, close: () => new Promise<void>((r) => { server.closeAllConnections(); server.close(() => r()); }) };
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
