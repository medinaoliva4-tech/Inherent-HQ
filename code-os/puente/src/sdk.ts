import { query } from '@anthropic-ai/claude-agent-sdk';
import { userHome } from './claude.js';
import { bwrapWorks } from './confine.js';
import type { Config, UserRecord } from './config.js';
import type { QueryFn } from './types.js';

/** ¿bubblewrap FUNCIONA aquí? (no basta con que exista: en Ubuntu 24.04 sin perfil de AppArmor falla). Se calcula una vez. */
let bw: boolean | undefined;
export function bwrapAvailable(): boolean { return (bw ??= bwrapWorks()); }

export interface Route { via: 'claude_login' | 'litellm'; model: string }

/**
 * Nivel alto con suscripción: si la persona tiene su `claude` logueado en el servidor, `nivel-alto` corre con esa
 * sesión (Claude). Si no, cae al `nivel-alto` de LiteLLM (Cline Pass top). Lo demás va siempre por LiteLLM.
 */
export function pickRoute(cfg: Pick<Config, 'subscriptionModel'>, requested: string, claudeActive: boolean): Route {
  if (requested === 'nivel-alto' && claudeActive) return { via: 'claude_login', model: cfg.subscriptionModel };
  return { via: 'litellm', model: requested };
}

/**
 * Entorno mínimo para el proceso del arnés: nada de llaves del puente ni del host. Por LiteLLM recibe la llave
 * virtual DE ESA PERSONA (con tope y niveles limitados); por suscripción no recibe ninguna llave: usa el login
 * guardado en el HOME propio de la persona.
 */
export function buildAgentEnv(cfg: Config, user: UserRecord, route: Route, confined: boolean): Record<string, string> {
  const home = userHome(cfg, user);
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
    HOME: home,
    CLAUDE_CONFIG_DIR: `${home}/.claude`,
    LANG: process.env.LANG ?? 'C.UTF-8',
    TMPDIR: confined ? '/tmp' : (process.env.TMPDIR ?? '/tmp'),
    // Dentro de bwrap ya no hay nada que ocultar; fuera, Claude Code oculta las llaves a Bash si hay bwrap.
    CLAUDE_CODE_SUBPROCESS_ENV_SCRUB: confined ? '0' : ((cfg.envScrub ?? bwrapAvailable()) ? '1' : '0'),
    DISABLE_TELEMETRY: '1',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    DISABLE_AUTOUPDATER: '1',
  };
  if (route.via === 'litellm') {
    Object.assign(env, {
      ANTHROPIC_BASE_URL: cfg.litellmUrl,
      ANTHROPIC_AUTH_TOKEN: user.litellmKey,
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_CUSTOM_MODEL_OPTION: route.model,
      ANTHROPIC_DEFAULT_SONNET_MODEL: route.model,
      ANTHROPIC_DEFAULT_OPUS_MODEL: route.model,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: route.model,
      CLAUDE_CODE_SUBAGENT_MODEL: route.model,
    });
  }
  return env;
}

export const realQuery: QueryFn = (p) => query(p as Parameters<typeof query>[0]) as unknown as ReturnType<QueryFn>;
