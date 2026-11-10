import type { Adjunto, Evento, RespuestaPermiso } from './eventos'

export type ParteTexto = { tipo: 'texto'; id: string; texto: string }
export type ParteRazonamiento = { tipo: 'razonamiento'; id: string; texto: string; cerrado: boolean; segundos?: number }
export type ParteHerramienta = {
  tipo: 'herramienta'
  id: string
  nombre: string
  entrada: Record<string, unknown>
  estado: 'ejecutando' | 'listo' | 'error'
  salida?: unknown
  error?: string
}
export type PartePermiso = {
  tipo: 'permiso'
  id: string
  herramienta: string
  descripcion: string
  entrada: Record<string, unknown>
  respuesta?: RespuestaPermiso
}
export type Parte = ParteTexto | ParteRazonamiento | ParteHerramienta | PartePermiso

export type Uso = { modelo: string; tokens_entrada: number; tokens_salida: number }

export type Mensaje = {
  id: string
  rol: 'usuario' | 'asistente'
  partes: Parte[]
  adjuntos?: Adjunto[]
  uso?: Uso
  error?: string
  /** true mientras llegan eventos */
  enCurso?: boolean
  detenido?: boolean
}

/** Aplica un evento del puente a un mensaje del asistente. Pura: devuelve un mensaje nuevo. */
export function aplicarEvento(m: Mensaje, e: Evento): Mensaje {
  switch (e.tipo) {
    case 'texto': {
      const partes = [...m.partes]
      const i = partes.findIndex((p) => p.tipo === 'texto' && p.id === e.id)
      if (i >= 0) {
        const p = partes[i] as ParteTexto
        partes[i] = { ...p, texto: p.texto + e.delta }
      } else {
        partes.push({ tipo: 'texto', id: e.id, texto: e.delta })
      }
      return { ...m, partes: cerrarRazonamiento(partes) }
    }
    case 'razonamiento': {
      const partes = [...m.partes]
      const i = partes.findIndex((p) => p.tipo === 'razonamiento' && p.id === e.id)
      if (i >= 0) {
        const p = partes[i] as ParteRazonamiento
        partes[i] = { ...p, texto: p.texto + e.delta }
      } else {
        partes.push({ tipo: 'razonamiento', id: e.id, texto: e.delta, cerrado: false })
      }
      return { ...m, partes }
    }
    case 'herramienta_inicio':
      return {
        ...m,
        partes: [
          ...cerrarRazonamiento(m.partes),
          { tipo: 'herramienta', id: e.id, nombre: e.nombre, entrada: e.entrada, estado: 'ejecutando' },
        ],
      }
    case 'herramienta_fin':
      return {
        ...m,
        partes: m.partes.map((p) =>
          p.tipo === 'herramienta' && p.id === e.id
            ? { ...p, estado: e.error ? 'error' : 'listo', salida: e.salida, error: e.error }
            : p,
        ),
      }
    case 'permiso_pedido':
      return {
        ...m,
        partes: [
          ...cerrarRazonamiento(m.partes),
          { tipo: 'permiso', id: e.id, herramienta: e.herramienta, descripcion: e.descripcion, entrada: e.entrada },
        ],
      }
    case 'uso':
      return { ...m, uso: { modelo: e.modelo, tokens_entrada: e.tokens_entrada, tokens_salida: e.tokens_salida } }
    case 'error':
      return { ...m, error: e.mensaje }
    case 'fin':
      return {
        ...m,
        enCurso: false,
        detenido: e.motivo === 'detenido',
        partes: cerrarRazonamiento(m.partes),
      }
  }
}

export function registrarRespuesta(m: Mensaje, id: string, r: RespuestaPermiso): Mensaje {
  return {
    ...m,
    partes: m.partes.map((p) => (p.tipo === 'permiso' && p.id === id ? { ...p, respuesta: r } : p)),
  }
}

function cerrarRazonamiento(partes: Parte[]): Parte[] {
  if (!partes.some((p) => p.tipo === 'razonamiento' && !p.cerrado)) return partes
  return partes.map((p) => (p.tipo === 'razonamiento' && !p.cerrado ? { ...p, cerrado: true } : p))
}

/** Mapea el estado de una herramienta + su permiso al estado que entienden los componentes de AI Elements. */
export type EstadoTool =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied'
