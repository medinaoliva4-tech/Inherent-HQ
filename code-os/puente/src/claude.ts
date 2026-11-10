import { execFile } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import type { Config, UserRecord } from './config.js';
import type { ClaudeStatus, Services } from './services.js';

/** HOME propio de cada persona; ahí vive su `claude login` (nunca se comparte entre usuarios). */
export const userHome = (cfg: Pick<Config, 'dataDir'>, u: Pick<UserRecord, 'id'>) => `${cfg.dataDir}/users/${u.id}/home`;

type Runner = (bin: string, args: string[], env: Record<string, string>) => Promise<{ code: number; out: string }>;
const run: Runner = (bin, args, env) => new Promise((resolve) => {
  execFile(bin, args, { env, timeout: 8000 }, (err, out) => resolve({ code: err ? ((err as any).code === 'ENOENT' ? -1 : 1) : 0, out: String(out ?? '') }));
});

/**
 * Pregunta al cliente oficial `claude auth status` con el HOME de la persona. Solo lee `loggedIn`: nunca abre
 * ni muestra el token de login.
 */
export function makeClaudeProbe(cfg: Config, runner: Runner = run, ttlMs = 30_000): Services['claude'] {
  const cache = new Map<string, { at: number; s: ClaudeStatus }>();
  return {
    async status(u, force = false) {
      const hit = cache.get(u.id);
      if (!force && hit && Date.now() - hit.at < ttlMs) return hit.s;
      const home = userHome(cfg, u);
      mkdirSync(home, { recursive: true });
      const r = await runner(cfg.claudePath ?? 'claude', ['auth', 'status', '--json'], { PATH: process.env.PATH ?? '/usr/bin:/bin', HOME: home, CLAUDE_CONFIG_DIR: `${home}/.claude`, LANG: 'C.UTF-8' });
      let s: ClaudeStatus;
      if (r.code === -1) s = { installed: false, active: false, hint: 'El cliente oficial `claude` no está instalado en el servidor' };
      else {
        let logged = false; try { logged = JSON.parse(r.out).loggedIn === true; } catch { /* salida no JSON */ }
        s = { installed: true, active: logged, hint: logged ? undefined : `Para activar tu sesión de Claude, en la terminal del servidor corre: code-os-login ${u.id}` };
      }
      cache.set(u.id, { at: Date.now(), s });
      return s;
    },
  };
}
