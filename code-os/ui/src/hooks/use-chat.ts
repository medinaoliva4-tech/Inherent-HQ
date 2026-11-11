import { useCallback, useRef, useState } from 'react'
import { EDICIONES, type Adjunto, type ClienteEventos, type ModoSesion, type RespuestaPermiso } from '@/lib/eventos'
import { aplicarEvento, registrarPlan, registrarPregunta, registrarRespuesta, type Mensaje } from '@/lib/mensajes'

let n = 0
const id = (p: string) => `${p}_${Date.now().toString(36)}_${++n}`

export type OpcionesEnvio = {
  modeloId: string
  modo: ModoSesion
  proyectoId?: string
  titulo?: string
  instrucciones?: string
  /** Subagentes para `@agente` (se registran al crear la sesión en el puente). */
  agentes?: Record<string, { description: string; prompt: string }>
  aislada?: boolean
  /** Lo que eligió el router (modo Auto): se ve en el hilo, encima de la respuesta. */
  ruta?: Mensaje['ruta']
  /** Lo que de verdad viaja al motor (p. ej. con archivos de texto pegados). Por defecto, el texto visible. */
  textoParaMotor?: string
  /** Se llama al terminar el turno (para notificar). */
  alTerminar?: (m: Mensaje) => void
  /** Se llama cuando el servidor cambia el modo (plan → code). */
  alCambiarModo?: (modo: ModoSesion) => void
}

export function useChat(cliente: ClienteEventos, inicial: Record<string, Mensaje[]> = {}) {
  const [porConv, setPorConv] = useState<Record<string, Mensaje[]>>(inicial)
  const [enCurso, setEnCurso] = useState<Record<string, boolean>>({})
  const aborts = useRef(new Map<string, AbortController>())

  /** Cambia el mensaje del asistente que corresponde a ese turno (no siempre es el último). */
  const actualizar = useCallback((convId: string, msgId: string, fn: (m: Mensaje) => Mensaje) => {
    setPorConv((s) => {
      const lista = s[convId] ?? []
      const i = lista.findIndex((m) => m.id === msgId)
      if (i < 0) return s
      const copia = lista.slice()
      copia[i] = fn(lista[i])
      return { ...s, [convId]: copia }
    })
  }, [])

  /** Busca en qué mensaje está una parte (permiso, pregunta, plan). */
  const conParte = useCallback(
    (convId: string, parteId: string, fn: (m: Mensaje) => Mensaje) => {
      setPorConv((s) => {
        const lista = s[convId] ?? []
        const i = lista.findIndex((m) => m.partes.some((p) => p.id === parteId))
        if (i < 0) return s
        const copia = lista.slice()
        copia[i] = fn(lista[i])
        return { ...s, [convId]: copia }
      })
    },
    [],
  )

  const enviar = useCallback(
    async (convId: string, texto: string, adjuntos: Adjunto[], o: OpcionesEnvio) => {
      const ctrl = new AbortController()
      aborts.current.set(convId, ctrl)
      const usuario: Mensaje = {
        id: id('u'),
        rol: 'usuario',
        partes: [{ tipo: 'texto', id: id('ut'), texto }],
        adjuntos: adjuntos.length ? adjuntos : undefined,
      }
      const asistente: Mensaje = { id: id('a'), rol: 'asistente', partes: [], enCurso: true, ...(o.ruta ? { ruta: o.ruta } : {}) }
      setPorConv((s) => ({ ...s, [convId]: [...(s[convId] ?? []), usuario, asistente] }))
      setEnCurso((s) => ({ ...s, [convId]: true }))
      let final = asistente
      const aplicar = (fn: (m: Mensaje) => Mensaje) => {
        final = fn(final)
        actualizar(convId, asistente.id, fn)
      }
      try {
        for await (const e of cliente.enviar({
          conversacionId: convId,
          texto: o.textoParaMotor ?? texto,
          adjuntos,
          modeloId: o.modeloId,
          modo: o.modo,
          proyectoId: o.proyectoId,
          titulo: o.titulo,
          instrucciones: o.instrucciones,
          agentes: o.agentes,
          aislada: o.aislada,
          signal: ctrl.signal,
        })) {
          if (e.tipo === 'modo') o.alCambiarModo?.(e.modo)
          aplicar((m) => aplicarEvento(m, e))
          // «Aceptar ediciones»: las ediciones de archivos se aprueban solas; lo demás sigue pidiendo permiso.
          if (e.tipo === 'permiso_pedido' && o.modo === 'aceptar' && EDICIONES.has(e.herramienta)) {
            aplicar((m) => registrarRespuesta(m, e.id, 's', true))
            cliente.responderPermiso(e.id, 's')
          }
        }
      } catch (err) {
        aplicar((m) =>
          aplicarEvento(aplicarEvento(m, { tipo: 'error', mensaje: err instanceof Error ? err.message : 'Error desconocido' }), {
            tipo: 'fin',
            motivo: 'error',
          }),
        )
      } finally {
        aborts.current.delete(convId)
        setEnCurso((s) => ({ ...s, [convId]: false }))
        aplicar((m) => (m.enCurso ? { ...m, enCurso: false } : m))
        o.alTerminar?.(final)
      }
    },
    [cliente, actualizar],
  )

  const detener = useCallback((convId: string) => {
    aborts.current.get(convId)?.abort()
  }, [])

  const responderPermiso = useCallback(
    (convId: string, permisoId: string, r: RespuestaPermiso) => {
      conParte(convId, permisoId, (m) => registrarRespuesta(m, permisoId, r))
      cliente.responderPermiso(permisoId, r)
    },
    [cliente, conParte],
  )

  /** Responde a AskUserQuestion. `null` = no contestar (el SDK recibe un «no»). */
  const responderPregunta = useCallback(
    (convId: string, parteId: string, preguntas: unknown, respuestas: Record<string, string> | null) => {
      conParte(convId, parteId, (m) => registrarPregunta(m, parteId, respuestas))
      if (respuestas) cliente.responderPermiso(parteId, 's', { entradaNueva: { questions: preguntas, answers: respuestas } })
      else cliente.responderPermiso(parteId, 'n', { mensaje: 'Prefiero no responder ahora.' })
    },
    [cliente, conParte],
  )

  /** Aprueba el plan (pasa a code) o pide cambios (se queda en plan, con tu comentario). */
  const responderPlan = useCallback(
    (convId: string, parteId: string, aprobado: boolean, comentario?: string) => {
      conParte(convId, parteId, (m) => registrarPlan(m, parteId, aprobado ? 'aprobado' : 'cambios', comentario))
      cliente.responderPermiso(parteId, aprobado ? 's' : 'n', aprobado ? undefined : { mensaje: comentario || 'Ajusta el plan, por favor.' })
    },
    [cliente, conParte],
  )

  const olvidar = useCallback((convId: string) => {
    setPorConv((s) => {
      const { [convId]: _, ...resto } = s
      return resto
    })
  }, [])

  return { porConv, enCurso, enviar, detener, responderPermiso, responderPregunta, responderPlan, olvidar }
}
