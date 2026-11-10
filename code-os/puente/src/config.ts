import { resolve } from 'node:path';

export interface Config {
  port: number;
  host: string;
  /** Tokens válidos de la plataforma (separados por coma en PUENTE_TOKENS). */
  tokens: string[];
  litellmUrl: string;
  litellmKey: string;
  /** Llave que recibe el arnés (y por tanto el modelo vía Bash). Idealmente una llave virtual de LiteLLM limitada a los alias cp-*. */
  agentKey: string;
  defaultModel: string;
  /** Prefijos de alias permitidos (vacío = todos los que liste LiteLLM). */
  modelAllow: string[];
  dataDir: string;
  workspacesDir: string;
  maxConcurrentTurns: number;
  maxTurns: number;
  turnTimeoutMs: number;
  permissionTimeoutMs: number;
  /** Catálogo de MCP del servidor: nombre → config (archivo JSON en PUENTE_MCP_CONFIG). */
  mcpCatalog: Record<string, unknown>;
  sandbox: boolean;
  /** Scrub de entorno de Claude Code (necesita bubblewrap en Linux). undefined = autodetectar. */
  envScrub?: boolean;
  /** Ruta al binario de Claude Code; por defecto el que trae el SDK. */
  claudePath?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env, readJson?: (p: string) => unknown): Config {
  const need = (k: string) => { const v = env[k]; if (!v) throw new Error(`Falta la variable ${k}`); return v; };
  const tokens = need('PUENTE_TOKENS').split(',').map((s) => s.trim()).filter(Boolean);
  if (tokens.some((t) => t.length < 24)) throw new Error('Cada token de PUENTE_TOKENS debe tener al menos 24 caracteres');
  const dataDir = resolve(env.PUENTE_DATA_DIR ?? './data');
  let mcpCatalog: Record<string, unknown> = {};
  if (env.PUENTE_MCP_CONFIG) {
    const j = (readJson ?? (() => ({})))(env.PUENTE_MCP_CONFIG) as { mcpServers?: Record<string, unknown> };
    mcpCatalog = j.mcpServers ?? {};
  }
  return {
    port: Number(env.PUENTE_PORT ?? 4200),
    host: env.PUENTE_HOST ?? '127.0.0.1',
    tokens,
    litellmUrl: (env.LITELLM_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, ''),
    litellmKey: need('LITELLM_KEY'),
    agentKey: env.LITELLM_AGENT_KEY || need('LITELLM_KEY'),
    defaultModel: env.PUENTE_DEFAULT_MODEL ?? 'cp-glm-5.3',
    modelAllow: (env.PUENTE_MODEL_ALLOW ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    dataDir,
    workspacesDir: resolve(env.PUENTE_WORKSPACES_DIR ?? `${dataDir}/workspaces`),
    maxConcurrentTurns: Number(env.PUENTE_MAX_CONCURRENT ?? 3),
    maxTurns: Number(env.PUENTE_MAX_TURNS ?? 30),
    turnTimeoutMs: Number(env.PUENTE_TURN_TIMEOUT_MS ?? 10 * 60_000),
    permissionTimeoutMs: Number(env.PUENTE_PERMISSION_TIMEOUT_MS ?? 5 * 60_000),
    mcpCatalog,
    sandbox: env.PUENTE_SANDBOX === '1',
    envScrub: env.PUENTE_ENV_SCRUB === undefined ? undefined : env.PUENTE_ENV_SCRUB === '1',
    claudePath: env.PUENTE_CLAUDE_PATH || undefined,
  };
}
