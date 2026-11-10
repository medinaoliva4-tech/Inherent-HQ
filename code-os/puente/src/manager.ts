import { randomUUID } from 'node:crypto';
import type { Config } from './config.js';
import type { ModelCatalog } from './models.js';
import { Session } from './session.js';
import { SessionStore } from './store.js';
import { workspaceFor } from './workspace.js';
import { HttpError, MODES, type Mode, type QueryFn, type SessionMeta } from './types.js';

export interface CreateBody { projectId?: unknown; model?: unknown; mode?: unknown; title?: unknown; systemPrompt?: unknown; agents?: unknown; mcp?: unknown }

export class SessionManager {
  private live = new Map<string, Session>();
  private active = 0;
  private slots = {
    acquire: () => { if (this.active >= this.cfg.maxConcurrentTurns) return false; this.active++; return true; },
    release: () => { this.active = Math.max(0, this.active - 1); },
  };
  constructor(private cfg: Config, private store: SessionStore, private models: ModelCatalog, private query: QueryFn) {}

  private wrap(meta: SessionMeta) {
    const s = new Session(meta, { cfg: this.cfg, query: this.query, save: (m) => this.store.save(m), slots: this.slots });
    this.live.set(meta.id, s);
    return s;
  }

  async create(b: CreateBody): Promise<Session> {
    const projectId = String(b.projectId ?? '');
    const cwd = workspaceFor(this.cfg.workspacesDir, projectId);
    const model = b.model === undefined ? this.cfg.defaultModel : String(b.model);
    await this.assertModel(model);
    const mode = this.parseMode(b.mode ?? 'code');
    const agents = this.parseAgents(b.agents);
    const mcp = this.parseMcp(b.mcp);
    const now = new Date().toISOString();
    const meta: SessionMeta = {
      id: randomUUID(), projectId, cwd, model, mode, createdAt: now, updatedAt: now,
      title: typeof b.title === 'string' ? b.title.slice(0, 120) : undefined,
      systemPrompt: typeof b.systemPrompt === 'string' ? b.systemPrompt.slice(0, 8000) : undefined,
      agents, mcp, totals: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, turns: 0 },
    };
    this.store.save(meta);
    return this.wrap(meta);
  }

  /** Devuelve la sesión viva o la reanuda desde disco. */
  get(id: string): Session {
    const s = this.live.get(id);
    if (s) return s;
    const meta = this.store.load(id);
    if (!meta) throw new HttpError(404, 'Sesión no encontrada');
    return this.wrap(meta);
  }

  list(projectId?: string) {
    return this.store.list(projectId).map((m) => this.live.get(m.id)?.summary() ?? { ...m, running: false });
  }

  async update(id: string, b: { model?: unknown; mode?: unknown; title?: unknown }) {
    const s = this.get(id);
    const patch: { model?: string; mode?: Mode; title?: string } = {};
    if (b.model !== undefined) { await this.assertModel(String(b.model)); patch.model = String(b.model); }
    if (b.mode !== undefined) patch.mode = this.parseMode(b.mode);
    if (typeof b.title === 'string') patch.title = b.title;
    s.configure(patch);
    return s;
  }

  async close(id: string) {
    const s = this.live.get(id);
    if (s) { await s.interrupt(); this.live.delete(id); }
  }

  private async assertModel(model: string) {
    if (!/^[\w.\-/:]{1,100}$/.test(model)) throw new HttpError(400, 'Modelo inválido');
    let ok: boolean;
    try { ok = await this.models.has(model); } catch (e) { throw new HttpError(502, `No pude leer los modelos de LiteLLM: ${(e as Error).message}`); }
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
