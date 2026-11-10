import { randomUUID } from 'node:crypto';
import { pathViolation } from './guard.js';
import type { Config } from './config.js';
import { buildAgentEnv, pickRoute, type Route } from './sdk.js';
import type { UserRecord } from './config.js';
import type { Services } from './services.js';
import { HttpError, type AgentQuery, type EventBody, type Mode, type PuenteEvent, type QueryFn, type SessionMeta } from './types.js';

const LOG_CAP = 2000;
const RESULT_CAP = 8000;

export type Decision = { decision: 'allow' | 'deny' | 'allow_all'; message?: string; updatedInput?: Record<string, unknown> };
interface Pending { event: Extract<EventBody, { type: 'permission_request' }>; resolve: (d: Decision) => void }
export interface Deps { cfg: Config; user: UserRecord; svc: Services; query: QueryFn; save: (m: SessionMeta) => void; slots: { acquire(): boolean; release(): void } }
const LIMIT_RE = /usage limit|limit reached|rate.?limit|quota|credit balance|429|overloaded/i;
interface TurnState { via: Route['via']; tools: number; t0: number; fallback?: string }

export class Session {
  private log: PuenteEvent[] = [];
  private seq = 0;
  private subs = new Set<(e: PuenteEvent) => void>();
  private pending = new Map<string, Pending>();
  private allowAll = false;
  private current: { turnId: string; abort: AbortController; q?: AgentQuery } | null = null;
  private turn: TurnState = { via: 'litellm', tools: 0, t0: 0 };
  constructor(public meta: SessionMeta, private deps: Deps) {}

  get running() { return this.current !== null; }
  get lastSeq() { return this.seq; }
  pendingPermissions() { return [...this.pending.values()].map((p) => p.event); }
  summary() { return { ...this.meta, running: this.running, allowAll: this.allowAll, pendingPermissions: this.pending.size }; }

  emit(body: EventBody) {
    const e = { ...body, seq: ++this.seq, ts: new Date().toISOString() } as PuenteEvent;
    this.log.push(e);
    if (this.log.length > LOG_CAP) this.log.splice(0, this.log.length - LOG_CAP);
    for (const s of this.subs) { try { s(e); } catch { /* suscriptor roto */ } }
    return e;
  }
  /** Reproduce lo posterior a `after` y se suscribe a lo nuevo. Devuelve la función para desuscribirse. */
  subscribe(after: number, fn: (e: PuenteEvent) => void) {
    for (const e of this.log) if (e.seq > after) fn(e);
    this.subs.add(fn);
    return () => { this.subs.delete(fn); };
  }

  configure(patch: { model?: string; mode?: Mode; title?: string }) {
    if (this.running) throw new HttpError(409, 'Hay un turno en curso; espera a que termine o interrúmpelo');
    if (patch.model) this.meta.model = patch.model;
    if (patch.title !== undefined) this.meta.title = patch.title.slice(0, 120);
    if (patch.mode && patch.mode !== this.meta.mode) { this.meta.mode = patch.mode; this.emit({ type: 'mode_changed', mode: patch.mode }); }
    this.touch();
  }
  private touch() { this.meta.updatedAt = new Date().toISOString(); this.deps.save(this.meta); }

  answer(requestId: string, d: Decision) {
    const p = this.pending.get(requestId);
    if (!p) throw new HttpError(404, 'Permiso no encontrado (ya resuelto o expirado)');
    this.pending.delete(requestId);
    if (d.decision === 'allow_all' && p.event.tool !== 'ExitPlanMode') this.allowAll = true;
    this.emit({ type: 'permission_resolved', requestId, decision: d.decision, reason: d.message });
    p.resolve(d);
  }

  async interrupt() {
    if (!this.current) return;
    for (const [id] of this.pending) this.answer(id, { decision: 'deny', message: 'Interrumpido por el usuario' });
    try { await this.current.q?.interrupt?.(); } catch { /* ya terminó */ }
    this.current.abort.abort();
  }

  sendMessage(text: string): string {
    if (this.running) throw new HttpError(409, 'Ya hay un turno en curso');
    if (!this.deps.slots.acquire()) throw new HttpError(429, 'Demasiados turnos simultáneos; reintenta en unos segundos');
    const turnId = randomUUID();
    const abort = new AbortController();
    this.current = { turnId, abort };
    this.emit({ type: 'user_message', text, turnId });
    void this.runTurn(turnId, text, abort).finally(() => { this.current = null; this.deps.slots.release(); });
    return turnId;
  }

  private buildOptions(abort: AbortController, route: Route): Record<string, any> {
    const { cfg } = this.deps;
    const m = this.meta;
    const spawner = this.deps.svc.spawner?.(this.deps.user, m.cwd);
    const opts: Record<string, any> = {
      cwd: m.cwd,
      model: route.model,
      maxTurns: cfg.maxTurns,
      env: buildAgentEnv(cfg, this.deps.user, route, !!spawner),
      settingSources: [],
      strictMcpConfig: true,
      includePartialMessages: true,
      abortController: abort,
      permissionMode: m.mode === 'plan' ? 'plan' : 'default',
      canUseTool: (tool: string, input: Record<string, unknown>, o: any) => this.canUseTool(tool, input, o),
    };
    if (m.mode === 'chat') opts.tools = [];
    if (m.sdkSessionId) opts.resume = m.sdkSessionId;
    if (m.systemPrompt) opts.systemPrompt = { type: 'preset', preset: 'claude_code', append: m.systemPrompt };
    if (m.agents && m.mode !== 'chat') opts.agents = m.agents;
    if (m.mcp?.length && m.mode !== 'chat') {
      opts.mcpServers = Object.fromEntries(m.mcp.filter((n) => n in cfg.mcpCatalog).map((n) => [n, cfg.mcpCatalog[n]]));
    }
    if (spawner) opts.spawnClaudeCodeProcess = spawner;
    if (cfg.claudePath) opts.pathToClaudeCodeExecutable = cfg.claudePath;
    return opts;
  }

  private async canUseTool(tool: string, input: Record<string, unknown>, o: { signal?: AbortSignal; toolUseID?: string; title?: string; description?: string }) {
    const bad = pathViolation(tool, input, this.meta.cwd);
    if (bad) return { behavior: 'deny' as const, message: bad };
    const interactive = tool === 'ExitPlanMode' || tool === 'AskUserQuestion';
    if (this.allowAll && !interactive) {
      this.emit({ type: 'permission_resolved', requestId: o.toolUseID ?? randomUUID(), decision: 'allow_all', auto: true });
      return { behavior: 'allow' as const, updatedInput: input };
    }
    const requestId = randomUUID();
    const decision = await new Promise<Decision>((resolve) => {
      const timer = setTimeout(() => {
        if (this.pending.has(requestId)) this.answer(requestId, { decision: 'deny', message: 'Sin respuesta a tiempo' });
      }, this.deps.cfg.permissionTimeoutMs);
      const done = (d: Decision) => { clearTimeout(timer); resolve(d); };
      o.signal?.addEventListener('abort', () => { if (this.pending.has(requestId)) { this.pending.delete(requestId); done({ decision: 'deny', message: 'Cancelado' }); } }, { once: true });
      const event = { type: 'permission_request' as const, requestId, toolUseId: o.toolUseID, tool, input, title: o.title, description: o.description };
      this.pending.set(requestId, { event, resolve: done });
      this.emit(event);
    });
    if (decision.decision === 'deny') return { behavior: 'deny' as const, message: decision.message ?? 'El usuario rechazó esta acción' };
    const updatedInput = decision.updatedInput ?? input;
    if (tool === 'ExitPlanMode') {
      this.meta.mode = 'code'; this.emit({ type: 'mode_changed', mode: 'code' }); this.touch();
      return { behavior: 'allow' as const, updatedInput, updatedPermissions: [{ type: 'setMode' as const, mode: 'default' as const, destination: 'session' as const }] };
    }
    return { behavior: 'allow' as const, updatedInput };
  }

  private async runTurn(turnId: string, text: string, abort: AbortController, forceLitellm = false): Promise<void> {
    const t0 = Date.now();
    const m = this.meta;
    const st = forceLitellm ? { active: false } : await this.deps.svc.claude.status(this.deps.user).catch(() => ({ active: false }));
    const route = pickRoute(this.deps.cfg, m.model, st.active);
    this.turn = { via: route.via, tools: 0, t0 };
    if (!forceLitellm) this.emit({ type: 'turn_start', turnId, model: route.model, requestedModel: m.model, via: route.via, mode: m.mode });
    let finish!: () => void;
    const done = new Promise<void>((r) => { finish = r; });
    async function* input() {
      yield { type: 'user', message: { role: 'user', content: text }, parent_tool_use_id: null };
      await done;
    }
    const timer = setTimeout(() => abort.abort(), this.deps.cfg.turnTimeoutMs);
    let ended = false;
    try {
      const q = this.deps.query({ prompt: input(), options: this.buildOptions(abort, route) });
      this.current!.q = q;
      for await (const msg of q) {
        if (this.handle(msg, turnId, t0)) { ended = true; finish(); }
      }
      if (!ended) {
        this.emit({ type: 'turn_end', turnId, ok: false, reason: abort.signal.aborted ? 'aborted' : 'no_result', turns: 0, durationMs: Date.now() - t0, usage: zero(), error: abort.signal.aborted ? 'Turno interrumpido o con tiempo agotado' : 'El arnés terminó sin resultado' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (route.via === 'claude_login' && this.turn.tools === 0 && LIMIT_RE.test(message)) { this.turn.fallback = message; void this.deps.svc.cuotas.reportClaudeLogin(this.deps.user, false, Date.now() - t0); }
      else {
      if (route.via === 'claude_login') void this.deps.svc.cuotas.reportClaudeLogin(this.deps.user, false, Date.now() - t0);
      this.emit({ type: 'error', message });
      if (!ended) this.emit({ type: 'turn_end', turnId, ok: false, reason: abort.signal.aborted ? 'aborted' : 'error', turns: 0, durationMs: Date.now() - t0, usage: zero(), error: message });
      }
    } finally {
      clearTimeout(timer); finish();
      for (const [id] of this.pending) this.answer(id, { decision: 'deny', message: 'Turno terminado' });
      try { this.current?.q?.close?.(); } catch { /* nada */ }
      this.touch();
    }
    if (this.turn.fallback && !abort.signal.aborted) {
      this.emit({ type: 'route_fallback', from: 'claude_login', to: 'litellm', reason: this.turn.fallback.slice(0, 300) });
      return this.runTurn(turnId, text, abort, true);
    }
  }

  /** Traduce un mensaje del SDK a eventos de la interfaz. Devuelve true cuando llegó el resultado final. */
  private handle(msg: any, turnId: string, t0: number): boolean {
    const parent = msg.parent_tool_use_id ?? undefined;
    switch (msg.type) {
      case 'system':
        if (msg.subtype === 'init' && msg.session_id && msg.session_id !== this.meta.sdkSessionId) { this.meta.sdkSessionId = msg.session_id; this.touch(); }
        return false;
      case 'stream_event': {
        const d = msg.event?.type === 'content_block_delta' ? msg.event.delta : null;
        if (d?.type === 'text_delta' && d.text) this.emit({ type: 'text_delta', text: d.text, parentToolUseId: parent });
        else if (d?.type === 'thinking_delta' && d.thinking) this.emit({ type: 'thinking_delta', text: d.thinking, parentToolUseId: parent });
        return false;
      }
      case 'assistant': {
        const blocks: any[] = msg.message?.content ?? [];
        const t = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('');
        const th = blocks.filter((b) => b.type === 'thinking').map((b) => b.thinking).join('');
        if (t || th) this.emit({ type: 'assistant_message', text: t, thinking: th || undefined, parentToolUseId: parent });
        for (const b of blocks) if (b.type === 'tool_use') this.turn.tools++;
        for (const b of blocks) if (b.type === 'tool_use') this.emit({ type: 'tool_call', toolUseId: b.id, name: b.name, input: b.input, parentToolUseId: parent });
        const u = msg.message?.usage;
        if (u) this.emit({ type: 'usage', inputTokens: u.input_tokens ?? 0, outputTokens: u.output_tokens ?? 0, cacheReadTokens: u.cache_read_input_tokens ?? 0, cacheCreationTokens: u.cache_creation_input_tokens ?? 0 });
        return false;
      }
      case 'user': {
        const c = msg.message?.content;
        if (Array.isArray(c)) for (const b of c) if (b?.type === 'tool_result') {
          const raw = typeof b.content === 'string' ? b.content : Array.isArray(b.content) ? b.content.map((x: any) => x.text ?? `[${x.type}]`).join('\n') : '';
          this.emit({ type: 'tool_result', toolUseId: b.tool_use_id, isError: !!b.is_error, content: raw.slice(0, RESULT_CAP), truncated: raw.length > RESULT_CAP, parentToolUseId: parent });
        }
        return false;
      }
      case 'result': {
        const u = msg.usage ?? {};
        const usage = { inputTokens: u.input_tokens ?? 0, outputTokens: u.output_tokens ?? 0, cacheReadTokens: u.cache_read_input_tokens ?? 0, cacheCreationTokens: u.cache_creation_input_tokens ?? 0 };
        const t = this.meta.totals;
        t.inputTokens += usage.inputTokens; t.outputTokens += usage.outputTokens; t.cacheReadTokens += usage.cacheReadTokens; t.cacheCreationTokens += usage.cacheCreationTokens; t.turns += 1;
        const ok = msg.subtype === 'success' && !msg.is_error;
        if (this.turn.via === 'claude_login') void this.deps.svc.cuotas.reportClaudeLogin(this.deps.user, ok, Date.now() - t0);
        const why = String(msg.result ?? msg.errors ?? '');
        if (!ok && this.turn.via === 'claude_login' && this.turn.tools === 0 && LIMIT_RE.test(why)) { this.turn.fallback = why; return true; }
        this.emit({ type: 'turn_end', turnId, ok, reason: msg.subtype ?? 'unknown', turns: msg.num_turns ?? 0, durationMs: msg.duration_ms ?? Date.now() - t0, usage, result: typeof msg.result === 'string' ? msg.result : undefined, error: ok ? undefined : (msg.errors?.join('; ') || msg.result || msg.subtype) });
        return true;
      }
      default: return false;
    }
  }
}
const zero = () => ({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 });
