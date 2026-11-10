import type { Config } from './config.js';
import type { Services } from './services.js';

/** Cliente del medidor de cuotas (servicio en 127.0.0.1:4200). Lectura de /cuotas y registro de claude_login. */
export function makeCuotasClient(cfg: Pick<Config, 'cuotasUrl' | 'cuotasToken'>, fetchFn: typeof fetch = fetch): Services['cuotas'] {
  const h: Record<string, string> = cfg.cuotasToken ? { authorization: `Bearer ${cfg.cuotasToken}` } : {};
  return {
    async get() {
      try { const r = await fetchFn(`${cfg.cuotasUrl}/cuotas`, { headers: h, signal: AbortSignal.timeout(4000) }); return r.ok ? await r.json() : null; } catch { return null; }
    },
    async reportClaudeLogin(u, ok, durationMs) {
      try { await fetchFn(`${cfg.cuotasUrl}/evento`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ proveedor: 'claude_login', http: ok ? 200 : 500, duracion_ms: durationMs, usuario: u.id }), signal: AbortSignal.timeout(3000) }); } catch { /* el medidor no debe tumbar un turno */ }
    },
  };
}
