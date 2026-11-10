import { query } from '@anthropic-ai/claude-agent-sdk';
import { accessSync, constants } from 'node:fs';
import { delimiter } from 'node:path';
import type { Config } from './config.js';
import type { QueryFn } from './types.js';

/** ¿Hay bubblewrap en el PATH? Claude Code lo exige para el scrub de entorno en Linux. */
export function bwrapAvailable(path = process.env.PATH ?? '', platform = process.platform): boolean {
  if (platform !== 'linux') return true;
  return path.split(delimiter).some((d) => { try { accessSync(`${d}/bwrap`, constants.X_OK); return true; } catch { return false; } });
}

/** Entorno mínimo para el proceso del arnés: nada de llaves del puente ni del host. */
export function buildAgentEnv(cfg: Config, model: string): Record<string, string> {
  const base = `${cfg.dataDir}/home`;
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
    HOME: base,
    CLAUDE_CONFIG_DIR: `${cfg.dataDir}/claude-config`,
    LANG: process.env.LANG ?? 'C.UTF-8',
    TMPDIR: process.env.TMPDIR ?? '/tmp',
    ANTHROPIC_BASE_URL: cfg.litellmUrl,
    ANTHROPIC_AUTH_TOKEN: cfg.agentKey,
    ANTHROPIC_API_KEY: '',
    ANTHROPIC_CUSTOM_MODEL_OPTION: model,
    ANTHROPIC_DEFAULT_SONNET_MODEL: model,
    ANTHROPIC_DEFAULT_OPUS_MODEL: model,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: model,
    CLAUDE_CODE_SUBAGENT_MODEL: model,
    CLAUDE_CODE_SUBPROCESS_ENV_SCRUB: (cfg.envScrub ?? bwrapAvailable()) ? '1' : '0',
    DISABLE_TELEMETRY: '1',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    DISABLE_AUTOUPDATER: '1',
  };
  return env;
}

export const realQuery: QueryFn = (p) => query(p as Parameters<typeof query>[0]) as unknown as ReturnType<QueryFn>;
