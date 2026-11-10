import { useCallback, useRef, useState } from 'react'
import type { Adjunto, ClienteEventos, RespuestaPermiso } from '@/lib/eventos'
import { aplicarEvento, registrarRespuesta, type Mensaje } from '@/lib/mensajes'

let n = 0
const id = (p: string) => `${p}_${Date.now().toString(36)}_${++n}`

export function useChat(cliente: ClienteEventos, inicial: Record<string, Mensaje[]> = {}) {
  const [porConv, setPorConv] = useState<Record<string, Mensaje[]>>(inicial)
  const [enCurso, setEnCurso] = useState<Record<string, boolean>>({})
  const aborts = useRef(new Map<string, AbortController>())

  const actualizarUltimo = useCallback((convId: string, fn: (m: Mensaje) => Mensaje) => {
    setPorConv((s) => {
      const lista = s[convId] ?? []
      if (!lista.length) return s
      return { ...s, [convId]: [...lista.slice(0, -1), fn(lista[lista.length - 1])] }
    })
  }, [])

  const enviar = useCallback(
    async (convId: string, texto: string, adjuntos: Adjunto[], modeloId: string) => {
      const ctrl = new AbortController()
      aborts.current.set(convId, ctrl)
      const usuario: Mensaje = {
        id: id('u'),
        rol: 'usuario',
        partes: [{ tipo: 'texto', id: id('ut'), texto }],
        adjuntos: adjuntos.length ? adjuntos : undefined,
      }
      const asistente: Mensaje = { id: id('a'), rol: 'asistente', partes: [], enCurso: true }
      setPorConv((s) => ({ ...s, [convId]: [...(s[convId] ?? []), usuario, asistente] }))
      setEnCurso((s) => ({ ...s, [convId]: true }))
      try {
        for await (const e of cliente.enviar({ conversacionId: convId, texto, adjuntos, modeloId, signal: ctrl.signal })) {
          actualizarUltimo(convId, (m) => aplicarEvento(m, e))
        }
      } catch (err) {
        actualizarUltimo(convId, (m) =>
          aplicarEvento(aplicarEvento(m, { tipo: 'error', mensaje: err instanceof Error ? err.message : 'Error desconocido' }), {
            tipo: 'fin',
            motivo: 'error',
          }),
        )
      } finally {
        aborts.current.delete(convId)
        setEnCurso((s) => ({ ...s, [convId]: false }))
        actualizarUltimo(convId, (m) => (m.enCurso ? { ...m, enCurso: false } : m))
      }
    },
    [cliente, actualizarUltimo],
  )

  const detener = useCallback((convId: string) => {
    aborts.current.get(convId)?.abort()
  }, [])

  const responderPermiso = useCallback(
    (convId: string, permisoId: string, r: RespuestaPermiso) => {
      actualizarUltimo(convId, (m) => registrarRespuesta(m, permisoId, r))
      cliente.responderPermiso(permisoId, r)
    },
    [cliente, actualizarUltimo],
  )

  return { porConv, enCurso, enviar, detener, responderPermiso }
}
