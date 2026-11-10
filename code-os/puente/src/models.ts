import type { Config } from './config.js';

export interface ModelInfo { id: string }

/** Lee los alias vigentes de LiteLLM (/v1/models) con caché corta. */
export function makeModelCatalog(cfg: Pick<Config, 'litellmUrl' | 'litellmKey' | 'modelAllow'>, fetchFn: typeof fetch = fetch, ttlMs = 30_000) {
  let cache: { at: number; list: ModelInfo[] } | null = null;
  async function list(): Promise<ModelInfo[]> {
    if (cache && Date.now() - cache.at < ttlMs) return cache.list;
    const res = await fetchFn(`${cfg.litellmUrl}/v1/models`, { headers: { authorization: `Bearer ${cfg.litellmKey}` }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`LiteLLM respondió ${res.status} al listar modelos`);
    const j = (await res.json()) as { data?: { id: string }[] };
    let ids = (j.data ?? []).map((m) => m.id);
    if (cfg.modelAllow.length) ids = ids.filter((id) => cfg.modelAllow.some((p) => id.startsWith(p)));
    const out = ids.sort().map((id) => ({ id }));
    cache = { at: Date.now(), list: out };
    return out;
  }
  async function has(id: string) { return (await list()).some((m) => m.id === id); }
  return { list, has };
}
export type ModelCatalog = ReturnType<typeof makeModelCatalog>;
