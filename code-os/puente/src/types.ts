/** Modos de sesión. chat = sin herramientas · plan = solo lectura + plan · code = herramientas con permisos. */
export type Mode = 'chat' | 'plan' | 'code';
export const MODES: readonly Mode[] = ['chat', 'plan', 'code'];

export interface Totals { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number; turns: number }

export interface SessionMeta {
  id: string;
  /** Dueño de la sesión: nadie más puede verla ni usarla. */
  userId: string;
  projectId: string;
  cwd: string;
  model: string;
  mode: Mode;
  title?: string;
  systemPrompt?: string;
  /** Subagentes definidos por la interfaz (nombre → definición del SDK). */
  agents?: Record<string, { description: string; prompt: string; tools?: string[]; model?: string }>;
  /** Nombres de servidores MCP del catálogo del servidor (nunca comandos que mande el cliente). */
  mcp?: string[];
  /** Capacidades activas en esta conversación (ver capacidades.ts). Sin el campo, se usa el modo (compatibilidad). */
  capacidades?: string[];
  /** «Planifica fuerte, ejecuta barato». Sin el campo: automático (capacidad pesada + modelo de nivel alto). */
  planEjecucion?: boolean | { activo?: boolean; planifica?: string; ejecuta?: string };
  /** Archivo de Figma fijado con `use_file` (nombre o sessionId). Sin él, Figwright no escribe. */
  figmaArchivo?: string;
  /** Sesión aislada: corre en un worktree de git del proyecto (rama propia) y se fusiona cuando la persona lo decide. */
  worktree?: { repo: string; branch: string };
  /** Id de la conversación en el SDK; permite reanudar tras reiniciar el puente. */
  sdkSessionId?: string;
  createdAt: string;
  updatedAt: string;
  totals: Totals;
}

/** Eventos que la interfaz recibe por SSE. Cada uno lleva seq creciente por sesión. */
export type EventBody =
  | { type: 'user_message'; text: string; turnId: string }
  | { type: 'turn_start'; turnId: string; model: string; requestedModel: string; via: 'claude_login' | 'litellm'; mode: Mode; capacidades?: string[]; capacidadesOmitidas?: { id: string; motivo: string }[]; planner?: string; executor?: string; planEjecucion?: boolean; planMotivo?: string }
  | { type: 'route_fallback'; from: 'claude_login'; to: 'litellm'; reason: string }
  | { type: 'text_delta'; text: string; parentToolUseId?: string }
  | { type: 'thinking_delta'; text: string; parentToolUseId?: string }
  | { type: 'assistant_message'; text: string; thinking?: string; parentToolUseId?: string }
  | { type: 'tool_call'; toolUseId: string; name: string; input: unknown; parentToolUseId?: string }
  | { type: 'tool_result'; toolUseId: string; isError: boolean; content: string; truncated: boolean; parentToolUseId?: string }
  | { type: 'permission_request'; requestId: string; toolUseId?: string; tool: string; input: unknown; title?: string; description?: string; capacidad?: string; tipo?: 'escritura' | 'irreversible' | 'gasto'; archivo?: string; requiereAprobadoUsd?: boolean; parentAgentId?: string }
  | { type: 'permission_resolved'; requestId: string; decision: 'allow' | 'deny' | 'allow_all'; auto?: boolean; reason?: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheCreationTokens: number }
  | { type: 'mode_changed'; mode: Mode }
  | { type: 'capacidades_changed'; capacidades: string[]; planEjecucion?: SessionMeta['planEjecucion'] }
  | { type: 'figma_archivo'; archivo: string | null }
  | { type: 'turn_end'; turnId: string; ok: boolean; reason: string; turns: number; durationMs: number; usage: Omit<Totals, 'turns'>; result?: string; error?: string; usageByModel?: Record<string, Omit<Totals, 'turns'>>; reparto?: { planifica: Omit<Totals, 'turns'>; ejecuta: Omit<Totals, 'turns'> } }
  | { type: 'error'; message: string };

export type PuenteEvent = EventBody & { seq: number; ts: string };

/** Lo mínimo que el puente necesita de `Query` del SDK; permite inyectar un modelo falso en pruebas. */
export interface AgentQuery extends AsyncIterable<any> {
  interrupt?(): Promise<unknown>;
  setPermissionMode?(mode: string): Promise<void>;
  close?(): void;
}
export type QueryFn = (params: { prompt: AsyncIterable<any>; options: Record<string, any> }) => AgentQuery;

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
