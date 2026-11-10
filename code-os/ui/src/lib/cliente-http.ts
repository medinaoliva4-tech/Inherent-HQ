import { NoDisponible, type Catalogo, type Cliente, type ConfigCliente, type EstadoCuotas, type EstadoServidor } from './cliente'
import type { Evento, ExtraPermiso, ModoSesion, PeticionEnvio, RespuestaPermiso } from './eventos'
import { leerSse } from './sse'

/** Evento tal como lo manda el puente (code-os/puente/src/types.ts). */
export type EventoPuente = { type: string; seq: number; ts: string; [k: string]: unknown }

type SesionLocal = { id: string; seq: number; modelo: string; modo: ModoSesion }
const CLAVE = 'code-os:sesiones-puente'

const DECISION: Record<RespuestaPermiso, 'allow' | 'deny' | 'allow_all'> = { s: 'allow', n: 'deny', t: 'allow_all' }

/** El puente acepta ids de proyecto `a-z0-9_-` (máx. 63). */
export function idProyectoPuente(id?: string) {
  const limpio = (id ?? 'general')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^[-_]+/, '')
    .slice(0, 63)
  return limpio || 'general'
}

/**
 * Traduce los eventos del puente al contrato de la interfaz.
 * El puente manda deltas sin id de bloque; aquí se agrupan: un bloque nuevo empieza tras cualquier
 * evento que no sea delta. `assistant_message` solo se usa si no llegaron deltas (p. ej. subagentes).
 */
export function crearTraductor() {
  let bloque = 0
  let ultimo: string | null = null
  let huboTexto = false
  let huboRazon = false
  let modelo = ''
  const idDe = (t: 'x' | 'r') => `${t}${bloque}`
  const corte = (tipo: string) => {
    if (tipo !== ultimo) bloque++
    ultimo = tipo
  }

  return function traducir(e: EventoPuente): Evento[] {
    const padre = typeof e.parentToolUseId === 'string' ? e.parentToolUseId : undefined
    switch (e.type) {
      case 'turn_start':
        modelo = String(e.model ?? '')
        return []
      case 'text_delta':
        corte('texto')
        huboTexto = true
        return [{ tipo: 'texto', id: idDe('x'), delta: String(e.text ?? ''), padre }]
      case 'thinking_delta':
        corte('razon')
        huboRazon = true
        return [{ tipo: 'razonamiento', id: idDe('r'), delta: String(e.text ?? ''), padre }]
      case 'assistant_message': {
        const out: Evento[] = []
        if (!huboRazon && typeof e.thinking === 'string' && e.thinking) {
          corte('razon-completo')
          out.push({ tipo: 'razonamiento', id: idDe('r'), delta: e.thinking, padre })
        }
        if (!huboTexto && typeof e.text === 'string' && e.text) {
          corte('texto-completo')
          out.push({ tipo: 'texto', id: idDe('x'), delta: e.text, padre })
        }
        huboTexto = false
        huboRazon = false
        ultimo = null
        return out
      }
      case 'tool_call':
        ultimo = null
        return [{ tipo: 'herramienta_inicio', id: String(e.toolUseId), nombre: String(e.name), entrada: (e.input as Record<string, unknown>) ?? {}, padre }]
      case 'tool_result':
        ultimo = null
        return [
          {
            tipo: 'herramienta_fin',
            id: String(e.toolUseId),
            salida: e.isError ? undefined : e.content,
            error: e.isError ? String(e.content ?? 'Error') : undefined,
            padre,
          },
        ]
      case 'permission_request':
        ultimo = null
        return [
          {
            tipo: 'permiso_pedido',
            id: String(e.requestId),
            herramienta: String(e.tool),
            descripcion: String(e.title ?? e.description ?? e.tool),
            entrada: (e.input as Record<string, unknown>) ?? {},
          },
        ]
      case 'usage':
        return [
          {
            tipo: 'uso',
            modelo,
            tokens_entrada: Number(e.inputTokens ?? 0),
            tokens_salida: Number(e.outputTokens ?? 0),
            tokens_cache: Number(e.cacheReadTokens ?? 0) + Number(e.cacheCreationTokens ?? 0),
          },
        ]
      case 'mode_changed':
        return [{ tipo: 'modo', modo: e.mode as ModoSesion }]
      case 'error':
        return [{ tipo: 'error', mensaje: String(e.message ?? 'Error del puente') }]
      case 'turn_end': {
        const ok = !!e.ok
        const detenido = e.reason === 'aborted'
        const out: Evento[] = []
        // Los totales del turno son más fiables que los `usage` parciales.
        const u = e.usage as Record<string, number> | undefined
        if (u && (u.inputTokens || u.outputTokens)) {
          out.push({ tipo: 'uso', modelo, tokens_entrada: Number(u.inputTokens ?? 0), tokens_salida: Number(u.outputTokens ?? 0), tokens_cache: Number(u.cacheReadTokens ?? 0) + Number(u.cacheCreationTokens ?? 0) })
        }
        if (!ok && !detenido) out.push({ tipo: 'error', mensaje: String(e.error ?? e.reason ?? 'El turno falló') })
        out.push({ tipo: 'fin', motivo: ok ? 'completo' : detenido ? 'detenido' : 'error', duracionMs: Number(e.durationMs ?? 0) || undefined })
        return out
      }
      default:
        return [] // user_message, permission_resolved: la interfaz ya los conoce
    }
  }
}

/** Cliente real: HTTP + SSE contra code-os/puente. */
export function crearClienteHttp(cfg: ConfigCliente, fetchFn: typeof fetch = (...a) => fetch(...a)): Cliente {
  if (cfg.url === undefined) throw new Error('Falta VITE_PUENTE_URL')
  const base = cfg.url
  const cab = (json = false): HeadersInit => ({
    ...(cfg.token ? { authorization: `Bearer ${cfg.token}` } : {}),
    ...(json ? { 'content-type': 'application/json' } : {}),
  })
  async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
    const res = await fetchFn(`${base}${ruta}`, { ...init, headers: { ...cab(!!init.body), ...(init.headers ?? {}) } })
    if (!res.ok) {
      let msg = `El puente respondió ${res.status}`
      try {
        const j = await res.json()
        if (j?.error) msg = String(j.error)
      } catch {
        /* sin cuerpo */
      }
      throw new Error(msg)
    }
    return (await res.json()) as T
  }

  const sesiones: Record<string, SesionLocal> = (() => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE) ?? '{}')
    } catch {
      return {}
    }
  })()
  const guardar = () => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(sesiones))
    } catch {
      /* sin almacenamiento */
    }
  }
  /** El puente de main no tiene /me: tras el primer 404 se usa /health. */
  let sinMe = false
  /** requestId → id de sesión del puente (para responder permisos). */
  const permisos = new Map<string, string>()

  async function asegurarSesion(p: PeticionEnvio): Promise<SesionLocal> {
    const modo = p.modo ?? 'code'
    let s = sesiones[p.conversacionId]
    if (!s) {
      const r = await pedir<{ id: string }>('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          projectId: idProyectoPuente(p.proyectoId),
          model: p.modeloId,
          mode: modo,
          title: p.titulo,
          systemPrompt: p.instrucciones || undefined,
        }),
      })
      s = sesiones[p.conversacionId] = { id: r.id, seq: 0, modelo: p.modeloId, modo }
      guardar()
    } else if (s.modelo !== p.modeloId || s.modo !== modo) {
      await pedir(`/sessions/${s.id}`, { method: 'PATCH', body: JSON.stringify({ model: p.modeloId, mode: modo }) })
      s.modelo = p.modeloId
      s.modo = modo
      guardar()
    }
    return s
  }

  async function* enviar(p: PeticionEnvio): AsyncGenerator<Evento> {
    const s = await asegurarSesion(p)
    const ctrl = new AbortController()
    const res = await fetchFn(`${base}/sessions/${s.id}/events?after=${s.seq}`, { headers: cab(), signal: ctrl.signal })
    if (!res.ok || !res.body) throw new Error(`No se pudo abrir el flujo de eventos (${res.status})`)
    const { turnId } = await pedir<{ turnId: string }>(`/sessions/${s.id}/messages`, { method: 'POST', body: JSON.stringify({ text: p.texto }) })

    let detenerPedido = false
    const alAbortar = () => {
      if (detenerPedido) return
      detenerPedido = true
      pedir(`/sessions/${s.id}/interrupt`, { method: 'POST' }).catch(() => ctrl.abort())
      // Si el puente no cierra el turno en 10 s, se corta igual.
      setTimeout(() => ctrl.abort(), 10_000)
    }
    p.signal?.addEventListener('abort', alAbortar, { once: true })
    if (p.signal?.aborted) alAbortar()

    const traducir = crearTraductor()
    let nuestro = false
    let terminado = false
    try {
      for await (const m of leerSse(res.body, ctrl.signal)) {
        let e: EventoPuente
        try {
          e = JSON.parse(m.datos)
        } catch {
          continue
        }
        if (typeof e.seq === 'number') {
          s.seq = Math.max(s.seq, e.seq)
        }
        if (e.type === 'turn_start' && e.turnId === turnId) nuestro = true
        if (!nuestro) continue
        for (const ev of traducir(e)) {
          if (ev.tipo === 'permiso_pedido') permisos.set(ev.id, s.id)
          if (ev.tipo === 'modo') s.modo = ev.modo
          yield ev
        }
        if (e.type === 'turn_end') {
          terminado = true
          break
        }
      }
    } finally {
      guardar()
      p.signal?.removeEventListener('abort', alAbortar)
      ctrl.abort()
    }
    if (!terminado) yield { tipo: 'fin', motivo: detenerPedido ? 'detenido' : 'error' }
  }

  const sid = (conv: string) => {
    const s = sesiones[conv]
    if (!s) throw new Error('Esta conversación aún no existe en el puente')
    return s.id
  }

  return {
    tipo: 'http',
    enviar,
    responderPermiso(id: string, r: RespuestaPermiso, extra?: ExtraPermiso) {
      const s = permisos.get(id)
      if (!s) return
      permisos.delete(id)
      pedir(`/sessions/${s}/permissions/${id}`, {
        method: 'POST',
        body: JSON.stringify({ decision: DECISION[r], message: extra?.mensaje, updatedInput: extra?.entradaNueva }),
      }).catch((err) => console.warn('[puente] no se pudo responder el permiso', err))
    },
    async modelos(): Promise<Catalogo> {
      const r = await pedir<{ default: string; models: { id: string }[] }>('/models')
      return { porDefecto: r.default, ids: r.models.map((m) => m.id) }
    },
    async cuotas(): Promise<EstadoCuotas> {
      const url = cfg.cuotasUrl ?? base
      const token = cfg.cuotasToken ?? cfg.token
      const res = await fetchFn(`${url}/cuotas`, { headers: token ? { authorization: `Bearer ${token}` } : {} })
      if (res.status === 404) throw new NoDisponible('GET /cuotas (que el puente reenvíe el medidor de code-os/cuotas)')
      if (!res.ok) throw new Error(`Cuotas respondió ${res.status}`)
      return (await res.json()) as EstadoCuotas
    },
    async estado(): Promise<EstadoServidor> {
      // `GET /me` (puente con usuarios) trae { claude: { installed, active, hint } }. Si no existe, se cae a /health.
      try {
        const r = sinMe ? null : await fetchFn(`${base}/me`, { headers: cab() })
        if (r?.status === 404) sinMe = true
        if (r?.ok) {
          const j = (await r.json()) as { claude?: { active?: boolean; hint?: string } }
          const activa = j.claude?.active
          return { claude: typeof activa === 'boolean' ? (activa ? 'activa' : 'inactiva') : 'desconocido', puente: 'conectado', pista: j.claude?.hint }
        }
        const h = await fetchFn(`${base}/health`)
        return { claude: 'desconocido', puente: h.ok ? 'conectado' : 'sin_conexion' }
      } catch {
        return { claude: 'desconocido', puente: 'sin_conexion' }
      }
    },
    async ajustarSesion(conv, c) {
      const s = sesiones[conv]
      if (!s) return // se aplicará al crearla
      await pedir(`/sessions/${s.id}`, { method: 'PATCH', body: JSON.stringify({ model: c.modeloId, mode: c.modo, title: c.titulo }) })
      if (c.modeloId) s.modelo = c.modeloId
      if (c.modo) s.modo = c.modo
      guardar()
    },
    async interrumpir(conv) {
      await pedir(`/sessions/${sid(conv)}/interrupt`, { method: 'POST' })
    },
    async cerrarSesion(conv) {
      const s = sesiones[conv]
      if (!s) return
      await pedir(`/sessions/${s.id}`, { method: 'DELETE' }).catch(() => {})
      delete sesiones[conv]
      guardar()
    },
    archivos: () => Promise.reject(new NoDisponible('GET /sessions/:id/files (árbol de archivos)')),
    leerArchivo: () => Promise.reject(new NoDisponible('GET /sessions/:id/files/:ruta (leer un archivo)')),
    guardarArchivo: () => Promise.reject(new NoDisponible('PUT /sessions/:id/files/:ruta (guardar un archivo)')),
    diff: () => Promise.reject(new NoDisponible('GET /sessions/:id/diff (cambios con git diff)')),
    abrirTerminal: () => Promise.reject(new NoDisponible('WebSocket /sessions/:id/terminal (terminal con node-pty)')),
    mcp: () => Promise.reject(new NoDisponible('GET /mcp (catálogo de servidores MCP)')),
    skills: () => Promise.reject(new NoDisponible('GET /skills (skills del servidor)')),
  }
}
