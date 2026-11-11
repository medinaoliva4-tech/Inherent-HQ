import { useCallback, useEffect, useState } from 'react'
import type { ModoSesion } from '@/lib/eventos'
import { MODELO_POR_DEFECTO } from '@/lib/niveles'

/** Proyecto = carpeta de chats con sus propias instrucciones (memoria del proyecto). */
export type Proyecto = { id: string; nombre: string; instrucciones: string }
export type Pestana = 'chat' | 'code'
export type Conversacion = {
  id: string
  proyectoId: string
  titulo: string
  /** Pestaña donde vive: Chat o Code. */
  pestana: Pestana
  /** Modo en el puente. En Chat siempre 'chat'; en Code 'code' (pide permiso) o 'plan'. */
  modo: ModoSesion
  modeloId: string
  creada: string
  actualizada: string
  archivada?: boolean
  fijada?: boolean
  /** No se guarda en el historial ni en la búsqueda. */
  incognito?: boolean
  /** Code: la sesión corre en un worktree de git propio y se fusiona al final (se decide antes del primer mensaje). */
  aislada?: boolean
}
export type Memoria = { id: string; texto: string; creada: string }
export type Ajustes = {
  notificaciones: boolean
  vista: 'normal' | 'detallada'
  modeloPorDefecto: string
}
export type Espacio = { proyectos: Proyecto[]; conversaciones: Conversacion[]; memorias: Memoria[]; ajustes: Ajustes }

const CLAVE = 'code-os:espacio:v2'
const ahora = () => new Date().toISOString()
const hace = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
let n = 0
export const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${(++n).toString(36)}`

/** Sin puente: un proyecto «General» vacío. */
export function espacioVacio(): Espacio {
  return {
    proyectos: [{ id: 'general', nombre: 'General', instrucciones: '' }],
    conversaciones: [],
    memorias: [],
    ajustes: { notificaciones: false, vista: 'normal', modeloPorDefecto: MODELO_POR_DEFECTO },
  }
}

/** Semilla de EJEMPLO para el modo mock (solo la primera vez). Los títulos son inventados. */
export function espacioInicial(): Espacio {
  const c = (id: string, proyectoId: string, titulo: string, pestana: Pestana, horas: number, extra: Partial<Conversacion> = {}): Conversacion => ({
    id,
    proyectoId,
    titulo,
    pestana,
    modo: pestana === 'chat' ? 'chat' : 'code',
    modeloId: MODELO_POR_DEFECTO,
    creada: hace(horas),
    actualizada: hace(horas),
    ...extra,
  })
  return {
    proyectos: [
      { id: 'inherent-os', nombre: 'Inherent OS', instrucciones: 'Copy en español, de tú. Tokens negro, hueso y crema.' },
      { id: 'akai', nombre: 'AKAI', instrucciones: '' },
      { id: 'web', nombre: 'inherentglobal.com', instrucciones: '' },
    ],
    conversaciones: [
      c('s1', 'inherent-os', 'Base de la interfaz Code OS', 'code', 0.1),
      c('s2', 'inherent-os', 'Tokens claro y oscuro', 'chat', 2),
      c('s3', 'inherent-os', 'Revisar CSP del OS', 'code', 26),
      c('s4', 'akai', 'Calendario de octubre', 'chat', 72),
      c('s5', 'akai', 'Stories en secuencia', 'chat', 96, { archivada: true }),
      c('s6', 'web', 'Copy de planes por necesidad', 'chat', 170),
    ],
    memorias: [{ id: 'm1', texto: 'Prefiere respuestas cortas, con lo accionable arriba.', creada: hace(200) }],
    ajustes: { notificaciones: false, vista: 'normal', modeloPorDefecto: MODELO_POR_DEFECTO },
  }
}

function leer(clave: string, mock: boolean): Espacio {
  const base = mock ? espacioInicial() : espacioVacio()
  try {
    const g = localStorage.getItem(clave)
    if (g) {
      const e = JSON.parse(g) as Espacio
      if (Array.isArray(e.proyectos) && e.proyectos.length && Array.isArray(e.conversaciones)) return { ...base, ...e, ajustes: { ...base.ajustes, ...e.ajustes } }
    }
  } catch {
    /* sin almacenamiento */
  }
  return base
}

/** Quita lo incógnito antes de guardar. */
export function paraGuardar(e: Espacio): Espacio {
  return { ...e, conversaciones: e.conversaciones.filter((c) => !c.incognito) }
}

/** `mock` usa su propio almacenamiento: los datos de ejemplo nunca se mezclan con los reales. */
export function useEspacio(mock = true) {
  const clave = `${CLAVE}:${mock ? 'mock' : 'http'}`
  const [espacio, setEspacio] = useState<Espacio>(() => leer(clave, mock))

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(clave, JSON.stringify(paraGuardar(espacio)))
      } catch {
        /* sin almacenamiento */
      }
    }, 250)
    return () => clearTimeout(t)
  }, [espacio, clave])

  const crearConversacion = useCallback((datos: Pick<Conversacion, 'proyectoId' | 'pestana'> & Partial<Conversacion>) => {
    const c: Conversacion = {
      id: nuevoId('s'),
      titulo: 'Conversación nueva',
      modo: datos.pestana === 'chat' ? 'chat' : 'code',
      modeloId: MODELO_POR_DEFECTO,
      creada: ahora(),
      actualizada: ahora(),
      ...datos,
    }
    setEspacio((e) => ({ ...e, conversaciones: [c, ...e.conversaciones] }))
    return c
  }, [])

  const editarConversacion = useCallback((id: string, cambios: Partial<Conversacion>) => {
    setEspacio((e) => ({ ...e, conversaciones: e.conversaciones.map((c) => (c.id === id ? { ...c, ...cambios } : c)) }))
  }, [])

  const borrarConversacion = useCallback((id: string) => {
    setEspacio((e) => ({ ...e, conversaciones: e.conversaciones.filter((c) => c.id !== id) }))
  }, [])

  const crearProyecto = useCallback((nombre: string) => {
    const p: Proyecto = { id: nuevoId('p'), nombre: nombre.trim() || 'Proyecto nuevo', instrucciones: '' }
    setEspacio((e) => ({ ...e, proyectos: [...e.proyectos, p] }))
    return p
  }, [])

  const editarProyecto = useCallback((id: string, cambios: Partial<Proyecto>) => {
    setEspacio((e) => ({ ...e, proyectos: e.proyectos.map((p) => (p.id === id ? { ...p, ...cambios } : p)) }))
  }, [])

  const borrarProyecto = useCallback((id: string) => {
    setEspacio((e) => {
      const resto = e.proyectos.filter((p) => p.id !== id)
      const destino = resto[0]?.id
      return {
        ...e,
        proyectos: resto,
        // Los chats no se pierden: pasan al primer proyecto que quede.
        conversaciones: destino ? e.conversaciones.map((c) => (c.proyectoId === id ? { ...c, proyectoId: destino } : c)) : e.conversaciones,
      }
    })
  }, [])

  const guardarMemorias = useCallback((memorias: Memoria[]) => setEspacio((e) => ({ ...e, memorias })), [])
  const cambiarAjustes = useCallback((cambios: Partial<Ajustes>) => setEspacio((e) => ({ ...e, ajustes: { ...e.ajustes, ...cambios } })), [])

  return {
    espacio,
    crearConversacion,
    editarConversacion,
    borrarConversacion,
    crearProyecto,
    editarProyecto,
    borrarProyecto,
    guardarMemorias,
    cambiarAjustes,
  }
}
