import { randomUUID } from 'node:crypto';
import type { Config, UserRecord } from './config.js';
import { modelAllowed } from './auth.js';
import type { Services } from './services.js';
import { asegurarBase, crearWorktree } from './files.js';
import { join } from 'node:path';
import type { ModelCatalog } from './models.js';
import { Session } from './session.js';
import { SessionStore } from './store.js';
import { workspaceFor } from './workspace.js';
import { HttpError, MODES, type Mode, type QueryFn, type SessionMeta } from './types.js';
import { makeSondeo, necesitaJaula, parseCapacidades, type Sondeo } from './capacidades.js';
import { CLAUDE_ALIAS, esAliasClaude } from './catalogo-modelos.js';
import { parsePlan } from './plan.js';

export interface CreateBody { isolate?: unknown; projectId?: unknown; model?: unknown; mode?: unknown; title?: unknown; systemPrompt?: unknown; agents?: unknown; mcp?: unknown; capacidades?: unknown; plan_ejecucion?: unknown }
export interface UpdateBody { model?: unknown; mode?: unknown; title?: unknown; capacidades?: unknown; plan_ejecucion?: unknown }

export class SessionManager {
  private live = new Map<string, Session>();
  private active = 0;
  private slots = {
    acquire: () => { if (this.active >= this.cfg.maxConcurrentTurns) return false; this.active++; return true; },
    release: () => { this.active = Math.max(0, this.active - 1); },
  };
  readonly sondeo: Sondeo;
  constructor(private cfg: Config, private store: SessionStore, private models: ModelCatalog, private query: QueryFn, private svc: Services) {
    this.sondeo = svc.sondeo ?? makeSondeo({ cfg, models, confined: () => this.confined, herramientas: !!svc.herramientas });
  }
  private user(id: string) { return this.cfg.users.find((u) => u.id === id)!; }
  /** ¿Hay confinamiento real (bwrap) para las herramientas de código? */
  get confined() { return !!this.svc.spawner; }
  private assertMode(mode: Mode) {
    if (mode !== 'chat' && this.cfg.requireConfine && !this.confined) throw new HttpError(503, 'Los modos Code y Plan están deshabilitados: el servidor no tiene confinamiento (bubblewrap) activo. Chat sigue disponible');
  }
  /** Las capacidades que lanzan procesos (MCP o herramientas de código) solo corren dentro de la jaula. */
  private assertCaps(caps: string[] | undefined) {
    if (caps && necesitaJaula(caps) && this.cfg.requireConfine && !this.confined) throw new HttpError(503, 'Esas capacidades necesitan confinamiento (bubblewrap) y el servidor no lo tiene activo. Chat y Herramientas siguen disponibles');
  }
  /** Valida modelos de plan_ejecucion (los que la persona fija explícitamente). */
  private async parsePlanBody(u: UserRecord, v: unknown) {
    const pe = parsePlan(v);
    if (pe && typeof pe === 'object') for (const m of [pe.planifica, pe.ejecuta]) if (m) await this.assertModel(u, m);
    return pe;
  }

  private wrap(meta: SessionMeta) {
    const s = new Session(meta, { cfg: this.cfg, user: this.user(meta.userId), svc: this.svc, query: this.query, save: (m) => this.store.save(m), slots: this.slots, sondeo: this.sondeo });
    this.live.set(meta.id, s);
    return s;
  }

  async create(u: UserRecord, b: CreateBody): Promise<Session> {
    const projectId = String(b.projectId ?? '');
    const model = b.model === undefined ? this.cfg.defaultModel : String(b.model);
    await this.assertModel(u, model);
    const mode = this.parseMode(b.mode ?? 'code');
    const capacidades = parseCapacidades(b.capacidades);
    if (capacidades === undefined) this.assertMode(mode); else { if (mode === 'plan') this.assertMode(mode); this.assertCaps(capacidades); }
    const planEjecucion = await this.parsePlanBody(u, b.plan_ejecucion);
    const proyecto = workspaceFor(this.cfg.workspacesDir, u.id, projectId);
    const id = randomUUID();
    let cwd = proyecto; let worktree: SessionMeta['worktree'];
    if (b.isolate === true) { cwd = join(proyecto, '.codeos', 'wt', id); worktree = { repo: proyecto, branch: `code/${id.slice(0, 8)}` }; await crearWorktree(proyecto, cwd, worktree.branch); }
    const agents = this.parseAgents(b.agents);
    const mcp = this.parseMcp(b.mcp);
    const now = new Date().toISOString();
    const meta: SessionMeta = {
      id, userId: u.id, projectId, cwd, ...(worktree ? { worktree } : {}), model, mode, createdAt: now, updatedAt: now,
      title: typeof b.title === 'string' ? b.title.slice(0, 120) : undefined,
      systemPrompt: typeof b.systemPrompt === 'string' ? b.systemPrompt.slice(0, 8000) : undefined,
      agents, mcp, ...(capacidades ? { capacidades } : {}), ...(planEjecucion !== undefined ? { planEjecucion } : {}), totals: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, turns: 0 },
    };
    this.store.save(meta);
    if (!worktree) void asegurarBase(cwd).catch(() => {});
    return this.wrap(meta);
  }

  /** Devuelve la sesión viva o la reanuda desde disco. */
  get(u: UserRecord, id: string): Session {
    const s = this.live.get(id);
    if (s) { if (s.meta.userId !== u.id) throw new HttpError(404, 'Sesión no encontrada'); return s; }
    const meta = this.store.load(id);
    if (!meta || meta.userId !== u.id) throw new HttpError(404, 'Sesión no encontrada');
    return this.wrap(meta);
  }

  list(u: UserRecord, projectId?: string) {
    return this.store.list(projectId).filter((m) => m.userId === u.id).map((m) => this.live.get(m.id)?.summary() ?? { ...m, running: false });
  }

  async update(u: UserRecord, id: string, b: UpdateBody) {
    const s = this.get(u, id);
    const patch: Parameters<Session['configure']>[0] = {};
    if (b.model !== undefined) { await this.assertModel(u, String(b.model)); patch.model = String(b.model); }
    if (b.capacidades !== undefined) { patch.capacidades = parseCapacidades(b.capacidades)!; this.assertCaps(patch.capacidades); }
    const conCaps = (patch.capacidades ?? s.meta.capacidades) !== undefined;
    if (b.mode !== undefined) { patch.mode = this.parseMode(b.mode); if (!conCaps || patch.mode === 'plan') this.assertMode(patch.mode); }
    if (b.plan_ejecucion !== undefined) patch.planEjecucion = b.plan_ejecucion === null ? null : await this.parsePlanBody(u, b.plan_ejecucion);
    if (typeof b.title === 'string') patch.title = b.title;
    s.configure(patch);
    return s;
  }

  async close(u: UserRecord, id: string) {
    this.get(u, id);
    const s = this.live.get(id);
    if (s) { await s.interrupt(); this.live.delete(id); }
  }

  private async assertModel(u: UserRecord, model: string): Promise<void> {
    if (!/^[\w.\-/:]{1,100}$/.test(model)) throw new HttpError(400, 'Modelo inválido');
    // Alias de Claude: válidos si la persona tiene el nivel al que caen sin sesión de Claude.
    if (esAliasClaude(model)) return this.assertModel(u, CLAUDE_ALIAS[model]!);
    if (!modelAllowed(u, model)) throw new HttpError(403, `Tu usuario no tiene permitido el modelo o nivel ${model}`);
    let ok: boolean;
    try { ok = await this.models.has(u, model); } catch (e) { throw new HttpError(502, `No pude leer los modelos de LiteLLM: ${(e as Error).message}`); }
    if (!ok) throw new HttpError(400, `Modelo no disponible en el Gateway: ${model}`);
  }
  private parseMode(v: unknown): Mode {
    if (!MODES.includes(v as Mode)) throw new HttpError(400, `mode debe ser uno de: ${MODES.join(', ')}`);
    return v as Mode;
  }
  private parseMcp(v: unknown): string[] | undefined {
    if (v === undefined) return undefined;
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) throw new HttpError(400, 'mcp debe ser una lista de nombres');
    const bad = (v as string[]).filter((n) => !(n in this.cfg.mcpCatalog));
    if (bad.length) throw new HttpError(400, `MCP fuera del catálogo del servidor: ${bad.join(', ')}`);
    return v as string[];
  }
  private parseAgents(v: unknown): SessionMeta['agents'] {
    if (v === undefined) return undefined;
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new HttpError(400, 'agents debe ser un objeto');
    const out: NonNullable<SessionMeta['agents']> = {};
    for (const [name, d] of Object.entries(v as Record<string, any>)) {
      if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(name) || typeof d?.description !== 'string' || typeof d?.prompt !== 'string') throw new HttpError(400, `Subagente inválido: ${name}`);
      out[name] = { description: d.description.slice(0, 500), prompt: d.prompt.slice(0, 8000), ...(Array.isArray(d.tools) ? { tools: d.tools.filter((t: unknown) => typeof t === 'string') } : {}) };
    }
    return out;
  }
}
