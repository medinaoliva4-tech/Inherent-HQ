import { resolve } from 'node:path';
import { readFileSync, statSync } from 'node:fs';

/** Un usuario del puente: su token, su llave virtual de LiteLLM (nunca la master) y lo que puede usar. */
export interface UserRecord {
  id: string;
  /** sha256 (hex) del token del puente de esta persona. El token en claro no se guarda. */
  tokenHash: string;
  /** Llave virtual de LiteLLM de esta persona (con presupuesto y modelos limitados en LiteLLM). */
  litellmKey: string;
  /** Niveles permitidos: nivel-alto | nivel-medio | nivel-bajo | nivel-bajo-pago. */
  levels: string[];
  /** Prefijos de alias directos permitidos (p. ej. cp-, nv-). */
  modelPrefixes: string[];
}

export interface Config {
  port: number;
  host: string;
  users: UserRecord[];
  litellmUrl: string;
  defaultModel: string;
  /** Alias de Claude que se usa con la sesión de suscripción de la persona. */
  subscriptionModel: string;
  dataDir: string;
  workspacesDir: string;
  maxConcurrentTurns: number;
  maxTurns: number;
  turnTimeoutMs: number;
  permissionTimeoutMs: number;
  mcpCatalog: Record<string, unknown>;
  /** auto = bwrap si funciona · bwrap = obligatorio · none = sin confinamiento. */
  confine: 'auto' | 'bwrap' | 'none';
  /** Si no hay confinamiento, Code y Plan se rechazan (Chat no usa herramientas). */
  requireConfine: boolean;
  envScrub?: boolean;
  claudePath?: string;
  cuotasUrl: string;
  cuotasToken?: string;
  /** Carpeta con la compilación de la interfaz (se sirve sin token; el acceso lo limita Tailscale). */
  uiDir?: string;
}

const LOOPBACK = new Set(['127.0.0.1', '::1', 'localhost']);
export const LEVELS = ['nivel-alto', 'nivel-medio', 'nivel-bajo', 'nivel-bajo-pago'];

/** Lee users.json y se niega si otros usuarios del sistema pueden leerlo. */
export function readUsersFile(path: string): { users: UserRecord[] } {
  const mode = statSync(path).mode & 0o777;
  if (mode & 0o077) throw new Error(`El archivo de usuarios ${path} tiene permisos ${mode.toString(8)}: debe ser 600 (chmod 600)`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function validateUser(u: any): UserRecord {
  if (!/^[a-z0-9][a-z0-9_-]{0,31}$/.test(u?.id ?? '')) throw new Error(`Usuario con id inválido: ${u?.id}`);
  if (!/^[0-9a-f]{64}$/.test(u.tokenHash ?? '')) throw new Error(`Usuario ${u.id}: tokenHash debe ser un sha256 en hex`);
  if (typeof u.litellmKey !== 'string' || !/^sk-.{6,}/.test(u.litellmKey)) throw new Error(`Usuario ${u.id}: litellmKey debe ser una llave virtual (sk-…)`);
  const levels = Array.isArray(u.levels) ? u.levels : [];
  if (levels.some((l: unknown) => !LEVELS.includes(l as string))) throw new Error(`Usuario ${u.id}: nivel desconocido (válidos: ${LEVELS.join(', ')})`);
  const modelPrefixes = Array.isArray(u.modelPrefixes) ? u.modelPrefixes.filter((p: unknown) => typeof p === 'string') : [];
  return { id: u.id, tokenHash: u.tokenHash, litellmKey: u.litellmKey, levels, modelPrefixes };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env, readJson: (p: string) => any = readUsersFile): Config {
  for (const k of ['LITELLM_MASTER_KEY', 'LITELLM_KEY']) {
    if (env[k]) throw new Error(`${k} está en el entorno del puente: el puente nunca debe tener la master key de LiteLLM; usa llaves virtuales por usuario`);
  }
  const host = env.PUENTE_HOST ?? '127.0.0.1';
  if (!LOOPBACK.has(host)) throw new Error(`El puente solo escucha en 127.0.0.1 (o ::1); recibió PUENTE_HOST=${host}. La publicación se hace por Tailscale o un proxy local`);
  const dataDir = resolve(env.PUENTE_DATA_DIR ?? './data');
  const usersFile = env.PUENTE_USERS_FILE ?? `${dataDir}/users.json`;
  const users = ((readJson(usersFile)?.users ?? []) as unknown[]).map(validateUser);
  if (!users.length) throw new Error('No hay ningún usuario en ' + usersFile);
  if (new Set(users.map((u) => u.id)).size !== users.length || new Set(users.map((u) => u.tokenHash)).size !== users.length) throw new Error('Usuarios o tokens repetidos');
  let mcpCatalog: Record<string, unknown> = {};
  if (env.PUENTE_MCP_CONFIG) mcpCatalog = (JSON.parse(readFileSync(env.PUENTE_MCP_CONFIG, 'utf8')) as { mcpServers?: Record<string, unknown> }).mcpServers ?? {};
  const confine = (env.PUENTE_CONFINE ?? 'auto') as Config['confine'];
  if (!['auto', 'bwrap', 'none'].includes(confine)) throw new Error('PUENTE_CONFINE debe ser auto, bwrap o none');
  return {
    port: Number(env.PUENTE_PORT ?? 4300), host, users,
    litellmUrl: (env.LITELLM_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, ''),
    defaultModel: env.PUENTE_DEFAULT_MODEL ?? 'nivel-medio',
    subscriptionModel: env.PUENTE_CLAUDE_MODEL ?? 'opus',
    dataDir, workspacesDir: resolve(env.PUENTE_WORKSPACES_DIR ?? `${dataDir}/workspaces`),
    maxConcurrentTurns: Number(env.PUENTE_MAX_CONCURRENT ?? 3), maxTurns: Number(env.PUENTE_MAX_TURNS ?? 30),
    turnTimeoutMs: Number(env.PUENTE_TURN_TIMEOUT_MS ?? 10 * 60_000), permissionTimeoutMs: Number(env.PUENTE_PERMISSION_TIMEOUT_MS ?? 5 * 60_000),
    mcpCatalog, confine, requireConfine: env.PUENTE_REQUIRE_CONFINE !== '0',
    envScrub: env.PUENTE_ENV_SCRUB === undefined ? undefined : env.PUENTE_ENV_SCRUB === '1',
    claudePath: env.PUENTE_CLAUDE_PATH || undefined,
    cuotasUrl: (env.CUOTAS_URL ?? 'http://127.0.0.1:4200').replace(/\/$/, ''), cuotasToken: env.CUOTAS_TOKEN || undefined,
    uiDir: env.PUENTE_UI_DIR ? resolve(env.PUENTE_UI_DIR) : undefined,
  };
}
