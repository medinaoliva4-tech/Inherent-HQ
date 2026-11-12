import type { SpawnOptions, SpawnedProcess } from '@anthropic-ai/claude-agent-sdk';
import type { Memoria } from 'code-os-herramientas';
import type { UserRecord } from './config.js';

export interface ClaudeStatus { installed: boolean; active: boolean; hint?: string }
export type Spawner = (o: SpawnOptions) => SpawnedProcess;

/** Dependencias externas del puente (se inyectan para poder probarlas sin red ni binarios). */
export interface Services {
  /** ¿La persona tiene sesión del cliente oficial `claude` logueada en el servidor? */
  claude: { status(u: UserRecord, force?: boolean): Promise<ClaudeStatus> };
  /** Medidor de cuotas (127.0.0.1:4200). */
  cuotas: { get(): Promise<unknown | null>; reportClaudeLogin(u: UserRecord, ok: boolean, durationMs: number): Promise<void> };
  /** Crea el lanzador confinado para una sesión (undefined = sin confinar). */
  spawner?: (u: UserRecord, cwd: string, extraReadOnly?: string[]) => Spawner | undefined;
  /** Disponibilidad real de cada capacidad (por defecto, el sondeo de capacidades.ts). */
  sondeo?: import('./capacidades.js').Sondeo;
  /** Memoria viva del cliente y calculadoras (`code-os/herramientas`). Sin ella, /clientes y /calc dan 503. */
  herramientas?: Memoria;
}
