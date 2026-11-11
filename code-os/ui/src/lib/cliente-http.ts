import { calcularInbound, calcularOutbound, type Calibracion, type EntradaInbound, type ResultadoInbound, type ResultadoOutbound } from './calculadora'
import { NoDisponible, type ArchivoDiff, type Catalogo, type Cliente, type ConfigCliente, type EstadoCuotas, type EstadoServidor, type NodoArchivo, type ResultadoFusion, type ServidorMcp, type Skill, type Terminal } from './cliente'
import type { Aviso, Marca, Nodo } from './hilo'
import { modoPuente, type Evento, type ExtraPermiso, type ModoSesion, type PeticionEnvio, type RespuestaPermiso } from './eventos'
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
  const token = () => cfg.obtenerToken?.() ?? cfg.token
  const cab = (json = false): HeadersInit => ({
    ...(token() ? { authorization: `Bearer ${token()}` } : {}),
    ...(json ? { 'content-type': 'application/json' } : {}),
  })
  async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
    const res = await fetchFn(`${base}${ruta}`, { ...init, headers: { ...cab(!!init.body), ...(init.headers ?? {}) } })
    if (res.status === 401) cfg.alNoAutorizado?.()
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
    try {
      return (await res.json()) as T
    } catch {
      // Una página HTML en vez de JSON: esa ruta no es del puente (o un proxy se metió en medio).
      throw new NoDisponible(`${init.method ?? 'GET'} ${ruta.split('?')[0]}`)
    }
  }

  /**
   * Herramientas y el hilo: `VITE_HERRAMIENTAS_URL` o, si no está, el mismo puente.
   * Un 404/501 = el backend aún no tiene esa ruta → `NoDisponible` (la pantalla lo dice).
   */
  const baseH = cfg.herramientasUrl ?? base
  const cid = (id: string) => encodeURIComponent(id)
  async function herr<T>(ruta: string, que: string, init: RequestInit = {}): Promise<T> {
    const res = await fetchFn(`${baseH}${ruta}`, { ...init, headers: { ...cab(!!init.body), ...(init.headers ?? {}) } })
    if (res.status === 404 || res.status === 501) throw new NoDisponible(que)
    // El puente sirve la interfaz para rutas que no son de su API: una página HTML aquí = la ruta aún no existe.
    if (res.ok && !(res.headers.get('content-type') ?? '').includes('json')) throw new NoDisponible(que)
    if (!res.ok) {
      let msg = `Herramientas respondió ${res.status}`
      try {
        const j = await res.json()
        if (j?.error) msg = String(j.error)
      } catch {
        /* sin cuerpo */
      }
      if (res.status === 409) msg = msg.startsWith('Herramientas') ? 'Abre el contenido (la versión actual) antes de aprobar.' : msg
      throw new Error(msg)
    }
    return (await res.json()) as T
  }
  /** Las calculadoras tienen la misma fórmula aquí: si el backend aún no la tiene, se calcula en el navegador. */
  async function calc<T>(ruta: string, cuerpo: unknown, local: () => T | null): Promise<T> {
    try {
      return await herr<T>(ruta, `POST ${ruta}`, { method: 'POST', body: JSON.stringify(cuerpo) })
    } catch (e) {
      if (!(e instanceof NoDisponible)) throw e
      const r = local()
      if (!r) throw new Error('Con esos datos no se puede calcular.', { cause: e })
      return r
    }
  }
  const planoInbound = (e: EntradaInbound) => ({
    meta: e.meta,
    ctr: e.ctr.valor,
    clicALead: e.clicALead.valor,
    leadACliente: e.leadACliente.valor,
    engagement: e.engagement.valor,
    cpm: e.cpm.valor,
    frecuencia: e.frecuencia,
    presupuesto: e.presupuesto,
    segmentacion: e.segmentacion,
    angulos: e.angulos,
  })

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
    const modo = modoPuente(p.modo ?? 'code')
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
          agents: p.agentes,
          ...(p.aislada ? { isolate: true } : {}),
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
    if (!s) throw new Error('Esta conversación aún no tiene sesión en el puente: manda un mensaje primero.')
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
      const tk = cfg.cuotasToken ?? token()
      const res = await fetchFn(`${url}/cuotas`, { headers: tk ? { authorization: `Bearer ${tk}` } : {} })
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
      const mode = c.modo ? modoPuente(c.modo) : undefined
      await pedir(`/sessions/${s.id}`, { method: 'PATCH', body: JSON.stringify({ model: c.modeloId, mode, title: c.titulo }) })
      if (c.modeloId) s.modelo = c.modeloId
      if (mode) s.modo = mode
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
    async archivos(conv) {
      const s = sesiones[conv]
      if (!s) return []
      return (await pedir<{ archivos: NodoArchivo[] }>(`/sessions/${s.id}/files`)).archivos
    },
    async leerArchivo(conv, ruta) {
      return (await pedir<{ contenido: string }>(`/sessions/${sid(conv)}/files?path=${encodeURIComponent(ruta)}`)).contenido
    },
    async guardarArchivo(conv, ruta, contenido) {
      await pedir(`/sessions/${sid(conv)}/files?path=${encodeURIComponent(ruta)}`, { method: 'PUT', body: JSON.stringify({ contenido }) })
    },
    async diff(conv) {
      const s = sesiones[conv]
      if (!s) return []
      return (await pedir<{ archivos: ArchivoDiff[] }>(`/sessions/${s.id}/diff`)).archivos
    },
    async fusionar(conv) {
      return pedir<ResultadoFusion>(`/sessions/${sid(conv)}/merge`, { method: 'POST' })
    },
    vincularSesion(conv, sesionId) {
      const s = sesiones[conv]
      if (s?.id === sesionId) return
      sesiones[conv] = { id: sesionId, seq: 0, modelo: s?.modelo ?? '', modo: s?.modo ?? 'code' }
      guardar()
    },
    sesionDe: (conv) => sesiones[conv]?.id ?? null,
    async abrirTerminal(conv, alRecibir): Promise<Terminal> {
      // WebSocket no puede mandar cabeceras: el pase del OS (JWT) va en ?pase=; un token simple usa la cookie de /entrar.
      const tk = token()
      const url = new URL(`${base || location.origin}/sessions/${sid(conv)}/terminal`, location.href)
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      if (tk && tk.split('.').length === 3) url.searchParams.set('pase', tk)
      const ws = new WebSocket(url)
      ws.binaryType = 'arraybuffer'
      const dec = new TextDecoder()
      await new Promise<void>((ok, mal) => {
        ws.onopen = () => ok()
        ws.onerror = () => mal(new Error('No se pudo abrir la terminal (WebSocket)'))
      })
      ws.onmessage = (e) => alRecibir(typeof e.data === 'string' ? e.data : dec.decode(new Uint8Array(e.data as ArrayBuffer), { stream: true }))
      ws.onclose = () => alRecibir('\r\n\x1b[2m[terminal cerrada]\x1b[0m\r\n')
      return {
        escribir: (d) => ws.readyState === WebSocket.OPEN && ws.send(d),
        redimensionar: (cols, rows) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ t: 'resize', cols, rows })),
        cerrar: () => ws.close(),
      }
    },
    mcp: async () => (await pedir<{ mcp: ServidorMcp[] }>('/mcp')).mcp,
    skills: async () => (await pedir<{ skills: Skill[] }>('/skills')).skills,
    memoriaCliente: () => Promise.reject(new NoDisponible('GET /clientes/:id/memoria (qué CLAUDE.md del cliente cargó la sesión)')),
    clientes: () => herr<Marca[]>('/clientes', 'GET /clientes'),
    nodos: (c) => herr<Nodo[]>(`/clientes/${cid(c)}/nodos`, 'GET /clientes/:id/nodos'),
    nodo: (c, id) => herr<Nodo>(`/clientes/${cid(c)}/nodos/${cid(id)}`, 'GET /clientes/:id/nodos/:nid'),
    crearNodo: (c, nuevo) => herr<Nodo>(`/clientes/${cid(c)}/nodos`, 'POST /clientes/:id/nodos', { method: 'POST', body: JSON.stringify(nuevo) }),
    guardarNodo: (c, id, cambios) => herr<Nodo>(`/clientes/${cid(c)}/nodos/${cid(id)}`, 'PUT /clientes/:id/nodos/:nid', { method: 'PUT', body: JSON.stringify(cambios) }),
    aprobarNodo: (c, id, leida) =>
      herr<Nodo>(`/clientes/${cid(c)}/nodos/${cid(id)}/aprobar`, 'POST /clientes/:id/nodos/:nid/aprobar', { method: 'POST', body: JSON.stringify({ version: leida.version }) }),
    dependientes: (c, id) => herr<Nodo[]>(`/clientes/${cid(c)}/nodos/${cid(id)}/dependientes`, 'GET /clientes/:id/nodos/:nid/dependientes'),
    avisos: (c) => herr<Aviso[]>(`/clientes/${cid(c)}/avisos`, 'GET /clientes/:id/avisos'),
    calcOutbound: (e) => calc<ResultadoOutbound>('/calc/outbound', e, () => calcularOutbound(e)),
    calcInbound: (e) => calc<ResultadoInbound>('/calc/inbound', planoInbound(e), () => calcularInbound(e)),
    calibrar: (c) => herr<Calibracion>(`/clientes/${cid(c)}/calibrar`, 'POST /clientes/:id/calibrar (tasas reales de Zernio)', { method: 'POST' }),
  }
}
