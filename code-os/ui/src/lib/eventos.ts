/**
 * Contrato de eventos entre el puente (Agent SDK) y la interfaz.
 * La interfaz solo conoce estos ocho eventos; el cliente mock y, más adelante,
 * el cliente SSE/WS real producen exactamente esta forma.
 */

/** Respuesta a un permiso: s = sí, solo esta vez · n = no · t = sí, y no vuelvas a preguntar (esta sesión). */
export type RespuestaPermiso = 's' | 'n' | 't'

export type EventoTexto = { tipo: 'texto'; id: string; delta: string }
export type EventoRazonamiento = { tipo: 'razonamiento'; id: string; delta: string }
export type EventoHerramientaInicio = {
  tipo: 'herramienta_inicio'
  id: string
  nombre: string
  entrada: Record<string, unknown>
}
export type EventoHerramientaFin = {
  tipo: 'herramienta_fin'
  id: string
  salida?: unknown
  error?: string
}
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
}
export type EventoError = { tipo: 'error'; mensaje: string; recuperable?: boolean }
export type EventoFin = { tipo: 'fin'; motivo: 'completo' | 'detenido' | 'error' }

export type Evento =
  | EventoTexto
  | EventoRazonamiento
  | EventoHerramientaInicio
  | EventoHerramientaFin
  | EventoPermisoPedido
  | EventoUso
  | EventoError
  | EventoFin

export type Adjunto = { nombre: string; tipo: string; url?: string }

export type PeticionEnvio = {
  conversacionId: string
  texto: string
  adjuntos: Adjunto[]
  modeloId: string
  signal?: AbortSignal
}

/** Lo único que la interfaz necesita de un puente. El real (SSE/WS) implementará esta misma interfaz. */
export interface ClienteEventos {
  enviar(peticion: PeticionEnvio): AsyncIterable<Evento>
  responderPermiso(id: string, respuesta: RespuestaPermiso): void
}
