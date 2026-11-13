import type { UserRecord } from './config.js';
import { modelAllowed } from './auth.js';
import { CLAUDE_ALIAS, esAliasClaude, nivelDe } from './catalogo-modelos.js';
import { esPesada, hayPesada } from './capacidades.js';
import type { Route } from './sdk.js';
import { HttpError } from './types.js';

/**
 * «Planifica fuerte, ejecuta barato»: el modelo principal planea, escribe instrucciones completas y revisa;
 * el trabajo con herramientas lo hace el subagente `ejecutor` con un modelo más barato.
 */
export type PlanEjecucion = boolean | { activo?: boolean; planifica?: string; ejecuta?: string };
export const AGENTE_EJECUTOR = 'ejecutor';

export const PROMPT_PLANIFICADOR = [
  'Trabajas como PLANIFICADOR con un subagente `ejecutor` más barato.',
  '- No ejecutes tú lo que escribe, genera o modifica (Figma, imágenes, archivos, Bash): delégalo con la herramienta Agent, subagent_type `ejecutor`. Las herramientas de solo lectura sí puedes usarlas para revisar.',
  '- Divide el pedido en pasos pequeños y verificables; un paso por delegación.',
  '- El ejecutor NO ve esta conversación: dale instrucciones completas (objetivo, archivo o rutas, ids, medidas, colores, textos literales, qué no tocar) y pide evidencia concreta.',
  '- Revisa la evidencia antes de seguir; si algo falla, corrige la instrucción y vuelve a delegar.',
  '- Al terminar, resume a la persona qué quedó hecho y qué falta.',
].join('\n');

export const PROMPT_EJECUTOR = [
  'Eres el EJECUTOR. Haz exactamente el paso que te pidieron con las herramientas disponibles, sin ampliar el alcance.',
  'Si falta un dato o algo falla, detente y repórtalo; no adivines.',
  'Devuelve evidencia breve y concreta: herramientas usadas, ids/rutas/nombres creados o cambiados, verificación hecha (p. ej. captura o validación) y errores tal cual.',
].join('\n');

export function parsePlan(v: unknown): PlanEjecucion | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v !== 'object' || Array.isArray(v)) throw new HttpError(400, 'plan_ejecucion debe ser true, false o {planifica?, ejecuta?}');
  const o = v as Record<string, unknown>;
  const out: Exclude<PlanEjecucion, boolean> = {};
  for (const k of ['planifica', 'ejecuta'] as const) {
    if (o[k] === undefined) continue;
    if (typeof o[k] !== 'string' || !/^[\w.\-/:]{1,100}$/.test(o[k] as string)) throw new HttpError(400, `plan_ejecucion.${k} debe ser un id de modelo`);
    out[k] = o[k] as string;
  }
  if (o.activo !== undefined) out.activo = o.activo === true;
  return out;
}

export interface PlanResuelto {
  activo: boolean;
  /** Modelo que pide la persona para planear (alias de Claude o de LiteLLM). */
  planifica: string;
  /** Lo que se pasa como `model` del subagente y el modelo que de verdad lo atiende. */
  ejecutor?: { agente: string; modelo: string };
  motivo?: string;
}

/** ¿Qué modelo pide la persona como principal este turno? */
export function modeloPlanificador(pe: PlanEjecucion | undefined, model: string): string {
  return pe && typeof pe === 'object' && pe.planifica && pe.activo !== false ? pe.planifica : model;
}

/**
 * Decide si el turno se reparte y con qué modelos. Por defecto se activa con capacidades pesadas (figwright,
 * imagen, codigo) y un modelo principal de nivel alto. Por suscripción: opus → haiku/sonnet nativos del arnés.
 * Por LiteLLM: el subagente pide el alias de LiteLLM directamente (nivel-medio, nivel-bajo, cp-…).
 */
export function resolverPlan(o: { pe?: PlanEjecucion; caps: string[]; route: Route; planifica: string; user: UserRecord; defaults: { claude: string; litellm: string } }): PlanResuelto {
  const { pe, route, user } = o;
  const explicito = pe === true || (typeof pe === 'object' && pe.activo !== false);
  const apagado = pe === false || (typeof pe === 'object' && pe.activo === false);
  const alto = nivelDe(route.model) === 'alto';
  const activo = !apagado && (explicito || (hayPesada(o.caps) && alto));
  if (!activo) return { activo: false, planifica: o.planifica };
  const pedido = (typeof pe === 'object' && pe.ejecuta) || (route.via === 'claude_login' ? o.defaults.claude : o.defaults.litellm);
  let modelo: string;
  if (route.via === 'claude_login') {
    // Un solo proceso = una sola vía: con el login, el ejecutor es un alias nativo de Claude.
    modelo = esAliasClaude(pedido) ? pedido : nivelDe(pedido) === 'alto' ? 'opus' : nivelDe(pedido) === 'medio' ? 'sonnet' : 'haiku';
  } else {
    modelo = esAliasClaude(pedido) ? CLAUDE_ALIAS[pedido]! : pedido;
    if (!modelAllowed(user, modelo)) return { activo: false, planifica: o.planifica, motivo: `Tu usuario no tiene permitido ${modelo} para ejecutar; todo corre con ${route.model}` };
  }
  if (modelo === route.model) return { activo: false, planifica: o.planifica, motivo: 'El ejecutor sería el mismo modelo que el planificador' };
  return { activo: true, planifica: o.planifica, ejecutor: { agente: modelo, modelo } };
}

export function definicionEjecutor(modelo: string) {
  return {
    description: 'Ejecuta UN paso concreto con herramientas (Figma, imágenes, archivos, comandos) siguiendo instrucciones completas y devuelve evidencia. Úsalo para todo trabajo que escribe o genera.',
    prompt: PROMPT_EJECUTOR,
    model: modelo,
    disallowedTools: ['Agent', 'Task'],
  };
}

/**
 * Hook PreToolUse del SDK cuando el turno se reparte:
 * - El hilo principal (sin agent_id) no ejecuta herramientas pesadas: se le niega y se le dice que delegue.
 * - Una llamada a Agent no puede cambiar el modelo del subagente (se quita `model`) y corre en primer plano:
 *   el ejecutor siempre usa el modelo barato que fijó el puente y su resultado vuelve al planificador.
 */
export function hookPlan() {
  return async (input: any) => {
    const tool = String(input?.tool_name ?? '');
    const ti = (input?.tool_input ?? {}) as Record<string, unknown>;
    if (input?.agent_id) return { continue: true };
    if (tool === 'Agent' || tool === 'Task') {
      // Sin cambiar de modelo, sin aislamiento remoto y en primer plano: el planificador espera la evidencia
      // y los permisos del ejecutor llegan dentro del mismo turno.
      const { model: _m, effort: _e, isolation: _i, mode: _mo, ...resto } = ti;
      return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', updatedInput: { ...resto, run_in_background: false } } };
    }
    if (esPesada(tool, ti)) {
      return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `Eres el planificador: delega este paso al subagente \`${AGENTE_EJECUTOR}\` (herramienta Agent) con instrucciones completas.` } };
    }
    return { continue: true };
  };
}
