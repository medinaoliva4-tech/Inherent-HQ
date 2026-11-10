import type { Config, UserRecord } from './config.js';
import { modelAllowed } from './auth.js';

export interface ModelInfo { id: string }

/** Lee los alias vigentes de LiteLLM (/v1/models) con caché corta. */
export function makeModelCatalog(cfg: Pick<Config, 'litellmUrl'>, fetchFn: typeof fetch = fetch, ttlMs = 30_000) {
  const cache = new Map<string, { at: number; list: ModelInfo[] }>();
  /** Con la llave virtual de la persona: LiteLLM ya filtra por sus modelos y aquí se filtra otra vez por sus niveles. */
  async function list(u: UserRecord): Promise<ModelInfo[]> {
    const hit = cache.get(u.id);
    if (hit && Date.now() - hit.at < ttlMs) return hit.list;
    const res = await fetchFn(`${cfg.litellmUrl}/v1/models`, { headers: { authorization: `Bearer ${u.litellmKey}` }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`LiteLLM respondió ${res.status} al listar modelos`);
    const j = (await res.json()) as { data?: { id: string }[] };
    const out = (j.data ?? []).map((m) => m.id).filter((id) => modelAllowed(u, id)).sort().map((id) => ({ id }));
    cache.set(u.id, { at: Date.now(), list: out });
    return out;
  }
  async function has(u: UserRecord, id: string) { return (await list(u)).some((m) => m.id === id); }
  return { list, has };
}
export type ModelCatalog = ReturnType<typeof makeModelCatalog>;
