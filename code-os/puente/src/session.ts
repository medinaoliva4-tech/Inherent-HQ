import { randomUUID } from 'node:crypto';
import { pathViolation } from './guard.js';
import type { Config } from './config.js';
import { buildAgentEnv, pickRoute, type Route } from './sdk.js';
import { userHome } from './claude.js';
import { CAPACIDADES, clasificar, montajesSoloLectura, REGLAS, resolverEntrada, type CapId } from './capacidades.js';
import { AGENTE_EJECUTOR, definicionEjecutor, hookPlan, modeloPlanificador, PROMPT_PLANIFICADOR, resolverPlan, type PlanResuelto } from './plan.js';
import { herramientasMcp } from './herramientas-mcp.js';
import type { UserRecord } from './config.js';
import type { Services } from './services.js';
import { HttpError, type AgentQuery, type EventBody, type Mode, type PuenteEvent, type QueryFn, type SessionMeta } from './types.js';

const LOG_CAP = 2000;
const RESULT_CAP = 8000;

export type Decision = { decision: 'allow' | 'deny' | 'allow_all'; message?: string; updatedInput?: Record<string, unknown>; aprobadoUsd?: number };
interface Pending { event: Extract<EventBody, { type: 'permission_request' }>; resolve: (d: Decision) => void }
export interface Deps { cfg: Config; user: UserRecord; svc: Services; query: QueryFn; save: (m: SessionMeta) => void; slots: { acquire(): boolean; release(): void }; sondeo: import('./capacidades.js').Sondeo }
const LIMIT_RE = /usage limit|limit reached|rate.?limit|quota|credit balance|429|overloaded/i;
interface TurnState { via: Route['via']; tools: number; t0: number; fallback?: string; caps: CapId[]; plan?: PlanResuelto; useFile: Map<string, string | null>; reparto: { planifica: Usage; ejecuta: Usage } }
type Usage = { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number };

export class Session {
  private log: PuenteEvent[] = [];
  private seq = 0;
  private subs = new Set<(e: PuenteEvent) => void>();
  private pending = new Map<string, Pending>();
  private allowAll = false;
  private current: { turnId: string; abort: AbortController; q?: AgentQuery } | null = null;
  private turn: TurnState = nuevoTurno('litellm', 0);
  constructor(public meta: SessionMeta, private deps: Deps) {}

  get running() { return this.current !== null; }
  /** Historial en memoria (últimos 2000 eventos) para que la interfaz reconstruya la conversación. */
  history(after = 0) { return this.log.filter((e) => e.seq > after); }
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

  configure(patch: { model?: string; mode?: Mode; title?: string; capacidades?: string[]; planEjecucion?: SessionMeta['planEjecucion'] | null }) {
    if (this.running) throw new HttpError(409, 'Hay un turno en curso; espera a que termine o interrúmpelo');
    if (patch.model) this.meta.model = patch.model;
    if (patch.capacidades !== undefined || patch.planEjecucion !== undefined) {
      if (patch.capacidades !== undefined) this.meta.capacidades = patch.capacidades;
      if (patch.planEjecucion === null) delete this.meta.planEjecucion; else if (patch.planEjecucion !== undefined) this.meta.planEjecucion = patch.planEjecucion;
      this.emit({ type: 'capacidades_changed', capacidades: this.meta.capacidades ?? [], planEjecucion: this.meta.planEjecucion });
    }
    if (patch.title !== undefined) this.meta.title = patch.title.slice(0, 120);
    if (patch.mode && patch.mode !== this.meta.mode) { this.meta.mode = patch.mode; this.emit({ type: 'mode_changed', mode: patch.mode }); }
    this.touch();
  }
  private touch() { this.meta.updatedAt = new Date().toISOString(); this.deps.save(this.meta); }

  answer(requestId: string, d: Decision) {
    const p = this.pending.get(requestId);
    if (!p) throw new HttpError(404, 'Permiso no encontrado (ya resuelto o expirado)');
    this.pending.delete(requestId);
    if (d.decision === 'allow_all' && p.event.tool !== 'ExitPlanMode' && !p.event.tipo?.match(/irreversible|gasto/)) this.allowAll = true;
    this.emit({ type: 'permission_resolved', requestId, decision: d.decision, reason: d.message });
    p.resolve(d);
  }

  async interrupt() {
    if (!this.current) return;
    for (const [id] of this.pending) this.answer(id, { decision: 'deny', message: 'Interrumpido por el usuario' });
    try { await this.current.q?.interrupt?.(); } catch { /* ya terminó */ }
    this.current.abort.abort();
  }

  private queue: { turnId: string; text: string }[] = [];
  get queued() { return this.queue.length; }
  /** Con `queueIfBusy`, un mensaje que llega con turno en curso se encola (corrige mientras trabaja) en vez de dar 409. */
  sendMessage(text: string, queueIfBusy = false): string {
    if (this.running && queueIfBusy) { const turnId = randomUUID(); this.queue.push({ turnId, text }); return turnId; }
    if (this.running) throw new HttpError(409, 'Ya hay un turno en curso');
    return this.start(randomUUID(), text);
  }
  private start(turnId: string, text: string): string {
    if (!this.deps.slots.acquire()) throw new HttpError(429, 'Demasiados turnos simultáneos; reintenta en unos segundos');
    const abort = new AbortController();
    this.current = { turnId, abort };
    this.emit({ type: 'user_message', text, turnId });
    void this.runTurn(turnId, text, abort).finally(() => {
      this.current = null; this.deps.slots.release();
      const next = abort.signal.aborted ? undefined : this.queue.shift();
      if (!abort.signal.aborted && next) { try { this.start(next.turnId, next.text); } catch { this.queue.unshift(next); } } else this.queue = [];
    });
    return turnId;
  }

  private buildOptions(abort: AbortController, route: Route): Record<string, any> {
    const { cfg } = this.deps;
    const m = this.meta;
    const legacy = m.capacidades === undefined;
    const caps = this.turn.caps;
    const plan = this.turn.plan;
    const nombresMcp = legacy ? (m.mode !== 'chat' ? (m.mcp ?? []) : []) : CAPACIDADES.filter((c) => c.mcp && caps.includes(c.id)).map((c) => c.mcp!);
    const mcpUsados = nombresMcp.filter((n) => n in cfg.mcpCatalog);
    const spawner = this.deps.svc.spawner?.(this.deps.user, m.cwd, montajesSoloLectura(cfg, mcpUsados));
    const opts: Record<string, any> = {
      cwd: m.cwd,
      model: route.model,
      maxTurns: cfg.maxTurns,
      env: buildAgentEnv(cfg, this.deps.user, route, !!spawner, plan?.activo ? plan.ejecutor!.modelo : undefined),
      settingSources: [],
      strictMcpConfig: true,
      includePartialMessages: true,
      abortController: abort,
      permissionMode: m.mode === 'plan' ? 'plan' : 'default',
      canUseTool: (tool: string, input: Record<string, unknown>, o: any) => this.canUseTool(tool, input, o),
    };
    const sinHerramientas = legacy ? m.mode === 'chat' : caps.length === 0;
    if (sinHerramientas) opts.tools = [];
    else if (!legacy && !caps.includes('codigo')) opts.tools = plan?.activo ? ['Agent'] : [];
    if (m.sdkSessionId) opts.resume = m.sdkSessionId;
    const extra = [m.systemPrompt, ...(legacy ? [] : this.reglasTurno())].filter(Boolean).join('\n\n');
    if (extra) opts.systemPrompt = { type: 'preset', preset: 'claude_code', append: extra };
    const agents = { ...(m.agents && !sinHerramientas ? m.agents : {}) } as Record<string, any>;
    if (plan?.activo && !agents[AGENTE_EJECUTOR]) agents[AGENTE_EJECUTOR] = definicionEjecutor(plan.ejecutor!.agente);
    if (Object.keys(agents).length) opts.agents = agents;
    if (plan?.activo) opts.hooks = { PreToolUse: [{ hooks: [hookPlan()] }] };
    const ctx = { cfg, user: this.deps.user, cwd: m.cwd, home: userHome(cfg, this.deps.user) };
    const servers: Record<string, unknown> = Object.fromEntries(mcpUsados.map((n) => [n, resolverEntrada(cfg.mcpCatalog[n], ctx)]));
    if (!legacy && caps.includes('herramientas') && this.deps.svc.herramientas) servers.herramientas = herramientasMcp(this.deps.svc.herramientas, this.deps.user.id);
    if (Object.keys(servers).length) opts.mcpServers = servers;
    if (spawner) opts.spawnClaudeCodeProcess = spawner;
    if (cfg.claudePath) opts.pathToClaudeCodeExecutable = cfg.claudePath;
    return opts;
  }

  /** Texto que se agrega al prompt de sistema: capacidades activas, las que faltan y el reparto planifica/ejecuta. */
  private reglasTurno(): string[] {
    const t = this.turn; const out: string[] = [];
    if (t.caps.length) out.push(`Capacidades activas en esta conversación: ${t.caps.join(', ')}.`);
    for (const c of t.caps) if (REGLAS[c]) out.push(REGLAS[c]!);
    if (this.omitidas.length) out.push(`No disponibles ahora (díselo a la persona si las pide): ${this.omitidas.map((o) => `${o.id} — ${o.motivo}`).join('; ')}.`);
    if (this.meta.figmaArchivo && t.caps.includes('figwright')) out.push(`Archivo de Figma fijado en esta conversación: «${this.meta.figmaArchivo}».`);
    if (t.plan?.activo) out.push(PROMPT_PLANIFICADOR);
    return out;
  }
  private omitidas: { id: string; motivo: string }[] = [];

  private async canUseTool(tool: string, input: Record<string, unknown>, o: { signal?: AbortSignal; toolUseID?: string; title?: string; description?: string; agentID?: string }) {
    const bad = pathViolation(tool, input, this.meta.cwd);
    if (bad) return { behavior: 'deny' as const, message: bad };
    const clase = clasificar(tool, input);
    if (clase.cap === 'figwright' && clase.tipo !== 'lectura' && !this.meta.figmaArchivo) {
      return { behavior: 'deny' as const, message: 'Antes de escribir en Figma fija el archivo: llama a list_files, luego use_file con el archivo correcto, y di a la persona en qué archivo vas a trabajar.' };
    }
    // Lecturas de MCP (Figma, imágenes, video, herramientas): sin preguntar.
    if (clase.cap && clase.cap !== 'codigo' && clase.tipo === 'lectura') return { behavior: 'allow' as const, updatedInput: input };
    let pedido = input;
    if (clase.tipo === 'gasto') { const { aprobado_usd: _a, ...resto } = input; pedido = resto; } // el monto solo lo pone la persona
    const interactive = tool === 'ExitPlanMode' || tool === 'AskUserQuestion' || clase.tipo === 'irreversible' || clase.tipo === 'gasto';
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
      const event = { type: 'permission_request' as const, requestId, toolUseId: o.toolUseID, tool, input: pedido, title: o.title, description: o.description,
        ...(clase.cap && clase.cap !== 'codigo' ? { capacidad: clase.cap } : {}), ...(clase.tipo !== 'lectura' ? { tipo: clase.tipo as 'escritura' | 'irreversible' | 'gasto' } : {}),
        ...(clase.cap === 'figwright' && this.meta.figmaArchivo ? { archivo: this.meta.figmaArchivo } : {}), ...(clase.tipo === 'gasto' ? { requiereAprobadoUsd: true } : {}), ...(o.agentID ? { parentAgentId: o.agentID } : {}) };
      this.pending.set(requestId, { event, resolve: done });
      this.emit(event);
    });
    if (decision.decision === 'deny') return { behavior: 'deny' as const, message: decision.message ?? 'El usuario rechazó esta acción' };
    let updatedInput = decision.updatedInput ?? pedido;
    if (clase.tipo === 'gasto') {
      const usd = decision.aprobadoUsd;
      if (typeof usd !== 'number' || !(usd > 0)) return { behavior: 'deny' as const, message: 'Falta el monto aprobado por la persona (aprobado_usd); vuelve a estimar y pide el OK' };
      updatedInput = { ...pedido, ...(decision.updatedInput ?? {}), aprobado_usd: usd };
    }
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
    const pedido = modeloPlanificador(m.planEjecucion, m.model);
    const route = pickRoute(this.deps.cfg, pedido, st.active);
    this.turn = nuevoTurno(route.via, t0);
    this.omitidas = [];
    if (m.capacidades) {
      const estados = await this.deps.sondeo(this.deps.user).catch(() => []);
      for (const c of m.capacidades as CapId[]) {
        const e = estados.find((x) => x.id === c);
        if (e?.estado === 'lista') this.turn.caps.push(c); else this.omitidas.push({ id: c, motivo: e?.motivo ?? 'No disponible' });
      }
      this.turn.plan = resolverPlan({ pe: m.planEjecucion, caps: this.turn.caps, route, planifica: pedido, user: this.deps.user, defaults: { claude: this.deps.cfg.ejecutorClaude ?? 'haiku', litellm: this.deps.cfg.ejecutorLitellm ?? 'nivel-medio' } });
    } else if (m.planEjecucion !== undefined && m.mode !== 'chat') {
      this.turn.plan = resolverPlan({ pe: m.planEjecucion, caps: ['codigo'], route, planifica: pedido, user: this.deps.user, defaults: { claude: this.deps.cfg.ejecutorClaude ?? 'haiku', litellm: this.deps.cfg.ejecutorLitellm ?? 'nivel-medio' } });
    }
    const p = this.turn.plan;
    if (!forceLitellm) this.emit({ type: 'turn_start', turnId, model: route.model, requestedModel: pedido, via: route.via, mode: m.mode,
      ...(m.capacidades ? { capacidades: this.turn.caps, ...(this.omitidas.length ? { capacidadesOmitidas: this.omitidas } : {}) } : {}),
      planner: route.model, ...(p?.activo ? { executor: p.ejecutor!.modelo } : {}), planEjecucion: !!p?.activo, ...(p?.motivo ? { planMotivo: p.motivo } : {}) });
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
        for (const b of blocks) if (b.type === 'tool_use') {
          if (b.name === 'mcp__figwright__use_file') this.turn.useFile.set(b.id, b.input?.release === true ? null : String(b.input?.fileName ?? b.input?.sessionId ?? ''));
          this.emit({ type: 'tool_call', toolUseId: b.id, name: b.name, input: b.input, parentToolUseId: parent });
        }
        const u = msg.message?.usage;
        if (u) { const r = this.turn.reparto[parent ? 'ejecuta' : 'planifica']; r.inputTokens += u.input_tokens ?? 0; r.outputTokens += u.output_tokens ?? 0; r.cacheReadTokens += u.cache_read_input_tokens ?? 0; r.cacheCreationTokens += u.cache_creation_input_tokens ?? 0; }
        if (u) this.emit({ type: 'usage', inputTokens: u.input_tokens ?? 0, outputTokens: u.output_tokens ?? 0, cacheReadTokens: u.cache_read_input_tokens ?? 0, cacheCreationTokens: u.cache_creation_input_tokens ?? 0 });
        return false;
      }
      case 'user': {
        const c = msg.message?.content;
        if (Array.isArray(c)) for (const b of c) if (b?.type === 'tool_result') {
          const raw = typeof b.content === 'string' ? b.content : Array.isArray(b.content) ? b.content.map((x: any) => x.text ?? `[${x.type}]`).join('\n') : '';
          if (this.turn.useFile.has(b.tool_use_id) && !b.is_error) {
            const archivo = this.turn.useFile.get(b.tool_use_id) || null;
            if (archivo) this.meta.figmaArchivo = archivo; else delete this.meta.figmaArchivo;
            this.touch(); this.emit({ type: 'figma_archivo', archivo });
          }
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
        const mu = msg.modelUsage && typeof msg.modelUsage === 'object' ? Object.fromEntries(Object.entries(msg.modelUsage as Record<string, any>).map(([k, v]) => [k, { inputTokens: v.inputTokens ?? 0, outputTokens: v.outputTokens ?? 0, cacheReadTokens: v.cacheReadInputTokens ?? 0, cacheCreationTokens: v.cacheCreationInputTokens ?? 0 }])) : undefined;
        this.emit({ type: 'turn_end', turnId, ok, reason: msg.subtype ?? 'unknown', turns: msg.num_turns ?? 0, durationMs: msg.duration_ms ?? Date.now() - t0, usage, result: typeof msg.result === 'string' ? msg.result : undefined, error: ok ? undefined : (msg.errors?.join('; ') || msg.result || msg.subtype),
          ...(mu ? { usageByModel: mu } : {}), ...(this.turn.plan?.activo ? { reparto: repartir(mu, this.turn.plan.ejecutor!.modelo) ?? this.turn.reparto } : {}) });
        return true;
      }
      default: return false;
    }
  }
}
const zero = () => ({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 });
/** Reparto planifica/ejecuta desde el uso por modelo del SDK (incluye las llamadas auxiliares, que van al barato). */
function repartir(mu: Record<string, Usage> | undefined, ejecutor: string) {
  if (!mu || !Object.keys(mu).length) return undefined;
  const out = { planifica: zero(), ejecuta: zero() };
  for (const [k, v] of Object.entries(mu)) {
    const r = out[k === ejecutor || k.includes(ejecutor) ? 'ejecuta' : 'planifica'];
    r.inputTokens += v.inputTokens; r.outputTokens += v.outputTokens; r.cacheReadTokens += v.cacheReadTokens; r.cacheCreationTokens += v.cacheCreationTokens;
  }
  return out;
}
const nuevoTurno = (via: Route['via'], t0: number): TurnState => ({ via, tools: 0, t0, caps: [], useFile: new Map(), reparto: { planifica: zero(), ejecuta: zero() } });
