/**
 * Contrato de eventos entre el puente (Agent SDK) y la interfaz.
 * La interfaz solo conoce estos nueve eventos; el cliente mock y el cliente HTTP+SSE
 * (`cliente-http.ts`, que traduce los eventos del puente) producen exactamente esta forma.
 */

/** Respuesta a un permiso: s = sí, solo esta vez · n = no · t = sí a todo en esta sesión. */
export type RespuestaPermiso = 's' | 'n' | 't'

/** Modo de la sesión en el puente: chat = sin herramientas · plan = solo lectura + plan · code = herramientas con permiso. */
export type ModoSesion = 'chat' | 'plan' | 'code'

/** `padre` = id de la herramienta Task/Agent que lanzó a un subagente (parentToolUseId en el puente). */
export type EventoTexto = { tipo: 'texto'; id: string; delta: string; padre?: string }
export type EventoRazonamiento = { tipo: 'razonamiento'; id: string; delta: string; padre?: string }
export type EventoHerramientaInicio = {
  tipo: 'herramienta_inicio'
  id: string
  nombre: string
  entrada: Record<string, unknown>
  padre?: string
}
export type EventoHerramientaFin = {
  tipo: 'herramienta_fin'
  id: string
  salida?: unknown
  error?: string
  padre?: string
}
/**
 * Permiso pedido. Dos herramientas se pintan distinto:
 * - `AskUserQuestion` → tarjeta de pregunta con opciones (entrada.questions)
 * - `ExitPlanMode` → tarjeta de plan para aprobar (entrada.plan)
 */
export type EventoPermisoPedido = {
  tipo: 'permiso_pedido'
  id: string
  herramienta: string
  descripcion: string
  entrada: Record<string, unknown>
}
export type EventoUso = {
  tipo: 'uso'
  modelo: string
  tokens_entrada: number
  tokens_salida: number
  tokens_cache?: number
}
export type EventoModo = { tipo: 'modo'; modo: ModoSesion }
export type EventoError = { tipo: 'error'; mensaje: string; recuperable?: boolean }
export type EventoFin = { tipo: 'fin'; motivo: 'completo' | 'detenido' | 'error'; duracionMs?: number }

export type Evento =
  | EventoTexto
  | EventoRazonamiento
  | EventoHerramientaInicio
  | EventoHerramientaFin
  | EventoPermisoPedido
  | EventoUso
  | EventoModo
  | EventoError
  | EventoFin

export const TIPOS_EVENTO: Evento['tipo'][] = [
  'texto',
  'razonamiento',
  'herramienta_inicio',
  'herramienta_fin',
  'permiso_pedido',
  'uso',
  'modo',
  'error',
  'fin',
]

export type Adjunto = { nombre: string; tipo: string; url?: string; tamano?: number }

export type PeticionEnvio = {
  conversacionId: string
  texto: string
  adjuntos: Adjunto[]
  modeloId: string
  /** Por defecto 'code'. */
  modo?: ModoSesion
  proyectoId?: string
  titulo?: string
  /** Instrucciones del proyecto (memoria). Viajan como systemPrompt al crear la sesión. */
  instrucciones?: string
  /** Subagentes (`@agente`) que el puente registra al crear la sesión (`agents` del SDK). */
  agentes?: Record<string, { description: string; prompt: string }>
  signal?: AbortSignal
}

/** Lo extra que acompaña a una respuesta: motivo del «no», o la entrada corregida (respuestas a preguntas). */
export type ExtraPermiso = { mensaje?: string; entradaNueva?: Record<string, unknown> }

/** Lo mínimo que la interfaz necesita para conversar. `Cliente` (cliente.ts) lo extiende. */
export interface ClienteEventos {
  enviar(peticion: PeticionEnvio): AsyncIterable<Evento>
  responderPermiso(id: string, respuesta: RespuestaPermiso, extra?: ExtraPermiso): void
}
