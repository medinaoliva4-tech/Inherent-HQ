/**
 * Modo embebido: Code OS dentro del Chat del OS (iframe de code.inherentglobal.com con `?embed=1`).
 * Contrato completo en `docs/embebido.md`. Resumen:
 *   OS → interfaz  `codeos:pase` { pase, expira? }            el pase corto que emite POST /api/code/pase
 *                  `codeos:contexto` { cliente?, sesion?, rol?, tema?, seccion?, nivel? }
 *   interfaz → OS  `codeos:listo` { version }                   ya escucha; el OS manda pase y contexto
 *                  `codeos:pedir-pase` {}                       el pase está por caducar o el puente dijo 401
 *                  `codeos:al-chat` { texto, enviar, modelo? }  poner (o mandar) un texto en el chat nativo del OS
 * Solo se aceptan mensajes del padre y de un origen permitido (`VITE_EMBED_ORIGENES`).
 */
import type { Rol } from './roles'

export const VERSION_EMBEBIDO = 1
export type ContextoOS = {
  /** Slug del cliente del selector del Chat del OS. */
  cliente?: string
  /** Id de la sesión del puente ligada a la conversación activa (la crea el Chat del OS). */
  sesion?: string
  rol?: Rol
  tema?: 'dark' | 'light'
  seccion?: 'cliente' | 'agentes' | 'herramientas' | 'codigo'
  /** Nivel con el que se construyó lo último (para que «Revisar» use OTRO). */
  nivel?: string
  /** La sesión corre aislada (worktree) y se puede fusionar. */
  aislada?: boolean
}
export type MensajeOS = { tipo: 'codeos:pase'; pase: string; expira?: number } | ({ tipo: 'codeos:contexto' } & ContextoOS)
export type MensajeAlOS =
  | { tipo: 'codeos:listo'; version: number }
  | { tipo: 'codeos:pedir-pase' }
  | { tipo: 'codeos:al-chat'; texto: string; enviar: boolean; modelo?: string }

const ORIGENES_POR_DEFECTO = ['https://work.inherentglobal.com']

export function origenesPermitidos(env: Record<string, string | undefined> = import.meta.env): string[] {
  const lista = (env.VITE_EMBED_ORIGENES ?? '')
    .split(',')
    .map((x) => x.trim().replace(/\/+$/, ''))
    .filter(Boolean)
  return lista.length ? lista : ORIGENES_POR_DEFECTO
}

/** `?embed=1` (y, si viene, `?pase=` para la primera carga). Quita el pase de la barra para que no quede en el historial. */
export function leerEmbebido(loc: Pick<Location, 'search' | 'pathname' | 'hash'> = location): { activo: boolean; pase?: string } {
  const q = new URLSearchParams(loc.search)
  const activo = q.get('embed') === '1'
  const pase = q.get('pase') ?? undefined
  if (pase && typeof history !== 'undefined') {
    q.delete('pase')
    const resto = q.toString()
    try {
      history.replaceState(null, '', `${loc.pathname}${resto ? `?${resto}` : ''}${loc.hash}`)
    } catch {
      /* sin history */
    }
  }
  return { activo, pase }
}

/** ¿Este mensaje es válido para nosotros? Origen permitido y forma conocida. */
export function validarMensaje(e: Pick<MessageEvent, 'origin' | 'data'>, permitidos: string[]): MensajeOS | null {
  if (!permitidos.includes(e.origin)) return null
  const d = e.data as Record<string, unknown> | null
  if (!d || typeof d !== 'object' || typeof d.tipo !== 'string') return null
  if (d.tipo === 'codeos:pase' && typeof d.pase === 'string' && d.pase.length < 4096) return { tipo: 'codeos:pase', pase: d.pase, expira: typeof d.expira === 'number' ? d.expira : undefined }
  if (d.tipo === 'codeos:contexto') {
    const ctx: ContextoOS = {}
    if (typeof d.cliente === 'string') ctx.cliente = d.cliente.slice(0, 80)
    if (typeof d.sesion === 'string' && /^[0-9a-f-]{36}$/.test(d.sesion)) ctx.sesion = d.sesion
    if (typeof d.rol === 'string') ctx.rol = d.rol as Rol
    if (d.tema === 'dark' || d.tema === 'light') ctx.tema = d.tema
    if (typeof d.seccion === 'string' && ['cliente', 'agentes', 'herramientas', 'codigo'].includes(d.seccion)) ctx.seccion = d.seccion as ContextoOS['seccion']
    if (typeof d.nivel === 'string') ctx.nivel = d.nivel
    if (typeof d.aislada === 'boolean') ctx.aislada = d.aislada
    return { tipo: 'codeos:contexto', ...ctx }
  }
  return null
}

/**
 * Enlace con el OS: guarda el pase vigente, lo pide antes de que caduque y avisa al OS.
 * `alCambiar` se llama con el contexto nuevo (cliente, sesión, rol…).
 */
export function crearEnlaceOS({
  pase: paseInicial,
  permitidos = origenesPermitidos(),
  ventana = typeof window !== 'undefined' ? window : undefined,
  alContexto,
}: {
  pase?: string
  permitidos?: string[]
  ventana?: Window
  alContexto: (c: ContextoOS) => void
}) {
  let pase = paseInicial
  let reloj: ReturnType<typeof setTimeout> | undefined
  const padre = ventana?.parent && ventana.parent !== ventana ? ventana.parent : null
  // Se responde al origen que nos habló (el primero permitido hasta entonces).
  let origenPadre: string | null = null
  const enviar = (m: MensajeAlOS) => {
    if (!padre) return
    for (const o of origenPadre ? [origenPadre] : permitidos) padre.postMessage(m, o)
  }
  const programar = (expira?: number) => {
    clearTimeout(reloj)
    if (!expira) return
    const ms = expira - Date.now() - 60_000
    reloj = setTimeout(() => enviar({ tipo: 'codeos:pedir-pase' }), Math.max(0, ms))
  }
  const escuchar = (e: MessageEvent) => {
    if (padre && e.source !== padre) return
    const m = validarMensaje(e, permitidos)
    if (!m) return
    origenPadre = e.origin
    if (m.tipo === 'codeos:pase') {
      pase = m.pase
      programar(m.expira)
    } else {
      const { tipo: _t, ...ctx } = m
      alContexto(ctx)
    }
  }
  ventana?.addEventListener('message', escuchar)
  enviar({ tipo: 'codeos:listo', version: VERSION_EMBEBIDO })
  return {
    token: () => pase,
    pedirPase: () => enviar({ tipo: 'codeos:pedir-pase' }),
    alChat: (texto: string, enviarYa = false, modelo?: string) => enviar({ tipo: 'codeos:al-chat', texto, enviar: enviarYa, ...(modelo ? { modelo } : {}) }),
    cerrar: () => {
      clearTimeout(reloj)
      ventana?.removeEventListener('message', escuchar)
    },
  }
}
export type EnlaceOS = ReturnType<typeof crearEnlaceOS>
