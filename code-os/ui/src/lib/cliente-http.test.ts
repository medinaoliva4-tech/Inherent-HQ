import { describe, expect, it } from 'vitest'
import { crearClienteHttp, crearTraductor, idProyectoPuente, type EventoPuente } from './cliente-http'
import type { Evento } from './eventos'

const ev = (type: string, extra: Record<string, unknown> = {}, seq = 1): EventoPuente => ({ type, seq, ts: '', ...extra })

describe('traductor de eventos del puente', () => {
  it('agrupa deltas en bloques y no duplica assistant_message', () => {
    const t = crearTraductor()
    const out = [
      ...t(ev('turn_start', { turnId: 'x', model: 'cp-glm-5.3', mode: 'code' })),
      ...t(ev('thinking_delta', { text: 'pien' })),
      ...t(ev('thinking_delta', { text: 'so' })),
      ...t(ev('text_delta', { text: 'Ho' })),
      ...t(ev('text_delta', { text: 'la' })),
      ...t(ev('assistant_message', { text: 'Hola', thinking: 'pienso' })),
    ]
    expect(out.map((e) => e.tipo)).toEqual(['razonamiento', 'razonamiento', 'texto', 'texto'])
    expect(new Set(out.filter((e) => e.tipo === 'texto').map((e) => (e as { id: string }).id)).size).toBe(1)
  })

  it('usa assistant_message cuando no hubo deltas (subagentes) y pasa el padre', () => {
    const t = crearTraductor()
    const out = t(ev('assistant_message', { text: 'listo', parentToolUseId: 'tool1' }))
    expect(out).toEqual([expect.objectContaining({ tipo: 'texto', delta: 'listo', padre: 'tool1' })])
  })

  it('traduce herramientas, permisos, uso, modo y fin', () => {
    const t = crearTraductor()
    t(ev('turn_start', { turnId: 'x', model: 'nivel-medio' }))
    expect(t(ev('tool_call', { toolUseId: 'a', name: 'Read', input: { file_path: 'x' } }))[0]).toMatchObject({ tipo: 'herramienta_inicio', id: 'a', nombre: 'Read' })
    expect(t(ev('tool_result', { toolUseId: 'a', isError: true, content: 'no' }))[0]).toMatchObject({ tipo: 'herramienta_fin', error: 'no' })
    expect(t(ev('permission_request', { requestId: 'p', tool: 'Edit', input: {}, title: 'Editar x' }))[0]).toMatchObject({ tipo: 'permiso_pedido', id: 'p', descripcion: 'Editar x' })
    expect(t(ev('usage', { inputTokens: 10, outputTokens: 2, cacheReadTokens: 5, cacheCreationTokens: 1 }))[0]).toEqual({ tipo: 'uso', modelo: 'nivel-medio', tokens_entrada: 10, tokens_salida: 2, tokens_cache: 6 })
    expect(t(ev('mode_changed', { mode: 'code' }))[0]).toEqual({ tipo: 'modo', modo: 'code' })
    expect(t(ev('turn_end', { ok: false, reason: 'aborted' })).map((e) => e.tipo)).toEqual(['fin'])
    const fallo = t(ev('turn_end', { ok: false, reason: 'error', error: 'se cayó' }))
    expect(fallo[0]).toEqual({ tipo: 'error', mensaje: 'se cayó' })
    expect(fallo[1]).toMatchObject({ tipo: 'fin', motivo: 'error' })
  })
})

describe('idProyectoPuente', () => {
  it('limpia a lo que acepta el puente', () => {
    expect(idProyectoPuente('Inherent OS')).toBe('inherent-os')
    expect(idProyectoPuente('Páginas & más')).toBe('paginas-mas')
    expect(idProyectoPuente('')).toBe('general')
    expect(idProyectoPuente(undefined)).toBe('general')
  })
})

/** Puente falso: responde a POST /sessions, GET events (SSE) y POST messages. */
function puenteFalso() {
  const llamadas: { metodo: string; ruta: string; cuerpo?: unknown; auth?: string | null }[] = []
  const sse = (eventos: EventoPuente[]) => {
    const texto = eventos.map((e) => `id: ${e.seq}\nevent: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('')
    const bytes = new TextEncoder().encode(': conectado\n\n' + texto)
    return new ReadableStream<Uint8Array>({
      start(c) {
        // en dos trozos, cortando a la mitad de un evento
        const m = Math.floor(bytes.length / 2)
        c.enqueue(bytes.slice(0, m))
        c.enqueue(bytes.slice(m))
        c.close()
      },
    })
  }
  const fetchFn = (async (url: string, init: RequestInit = {}) => {
    const u = new URL(url)
    const metodo = init.method ?? 'GET'
    const cuerpo = init.body ? JSON.parse(String(init.body)) : undefined
    const auth = new Headers(init.headers).get('authorization')
    llamadas.push({ metodo, ruta: u.pathname + u.search, cuerpo, auth })
    const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } })
    if (metodo === 'POST' && u.pathname === '/sessions') return json({ id: '11111111-1111-1111-1111-111111111111' }, 201)
    if (u.pathname.endsWith('/events'))
      return new Response(
        sse([
          ev('user_message', { text: 'hola', turnId: 't1' }, 1),
          ev('turn_start', { turnId: 't1', model: 'nivel-medio', mode: 'code' }, 2),
          ev('text_delta', { text: 'Hola' }, 3),
          ev('permission_request', { requestId: '22222222-2222-2222-2222-222222222222', tool: 'Bash', input: { command: 'ls' } }, 4),
          ev('turn_end', { turnId: 't1', ok: true, reason: 'success', turns: 1, durationMs: 900, usage: {} }, 5),
        ]),
        { headers: { 'content-type': 'text/event-stream' } },
      )
    if (metodo === 'PATCH') return json({ ok: true })
    if (u.pathname.endsWith('/messages')) return json({ turnId: 't1' }, 202)
    if (u.pathname.includes('/permissions/')) return json({ ok: true })
    if (u.pathname === '/me') return json({ user: 'yo', claude: { installed: true, active: false, hint: 'corre code-os-login yo' } })
    if (u.pathname === '/models') return json({ default: 'nivel-medio', models: [{ id: 'nivel-medio' }, { id: 'cp-glm-5.3' }] })
    if (u.pathname === '/cuotas') return json({ generado: '', proveedores: [], avisos: [] })
    return json({ error: 'no' }, 404)
  }) as typeof fetch
  return { fetchFn, llamadas }
}

describe('cliente http', () => {
  it('crea la sesión, abre SSE, manda el mensaje y termina con fin', async () => {
    localStorage.clear()
    const { fetchFn, llamadas } = puenteFalso()
    const c = crearClienteHttp({ url: 'http://puente.test', token: 'secreto' }, fetchFn)
    const eventos: Evento[] = []
    for await (const e of c.enviar({ conversacionId: 'c1', texto: 'hola', adjuntos: [], modeloId: 'nivel-medio', modo: 'code', proyectoId: 'Inherent OS', instrucciones: 'sé breve' })) {
      eventos.push(e)
      if (e.tipo === 'permiso_pedido') c.responderPermiso(e.id, 't')
    }
    expect(eventos.map((e) => e.tipo)).toEqual(['texto', 'permiso_pedido', 'fin'])
    expect(llamadas[0]).toMatchObject({ metodo: 'POST', ruta: '/sessions', cuerpo: { projectId: 'inherent-os', model: 'nivel-medio', mode: 'code', systemPrompt: 'sé breve' }, auth: 'Bearer secreto' })
    expect(llamadas[1].ruta).toBe('/sessions/11111111-1111-1111-1111-111111111111/events?after=0')
    expect(llamadas[2]).toMatchObject({ metodo: 'POST', cuerpo: { text: 'hola' } })
    await new Promise((r) => setTimeout(r, 0))
    expect(llamadas.find((l) => l.ruta.includes('/permissions/'))?.cuerpo).toEqual({ decision: 'allow_all' })
  })

  it('la segunda vez reutiliza la sesión y pide solo lo nuevo; si cambia el modo, hace PATCH', async () => {
    const { fetchFn, llamadas } = puenteFalso()
    const c = crearClienteHttp({ url: 'http://puente.test', token: 'secreto' }, fetchFn)
    for await (const e of c.enviar({ conversacionId: 'c1', texto: 'otra', adjuntos: [], modeloId: 'nivel-medio', modo: 'plan' })) void e
    expect(llamadas.some((l) => l.metodo === 'POST' && l.ruta === '/sessions')).toBe(false)
    expect(llamadas[0]).toMatchObject({ metodo: 'PATCH', cuerpo: { model: 'nivel-medio', mode: 'plan' } })
    expect(llamadas[1].ruta).toContain('events?after=5')
  })

  it('lee /me, /models y /cuotas', async () => {
    const { fetchFn } = puenteFalso()
    const c = crearClienteHttp({ url: 'http://puente.test', token: 'x' }, fetchFn)
    expect(await c.estado()).toEqual({ claude: 'inactiva', puente: 'conectado', pista: 'corre code-os-login yo' })
    expect(await c.modelos()).toEqual({ porDefecto: 'nivel-medio', ids: ['nivel-medio', 'cp-glm-5.3'] })
    expect(await c.cuotas()).toMatchObject({ proveedores: [] })
  })

  it('usa lo que el puente ya tiene: diff, fusionar, skills; lo demás avisa con NoDisponible', async () => {
    localStorage.clear()
    const { fetchFn, llamadas } = puenteFalso()
    const c = crearClienteHttp({ url: 'http://puente.test', obtenerToken: () => 'pase-del-os' }, fetchFn)
    expect(await c.diff('sin-sesion')).toEqual([]) // aún no hay sesión: nada que mostrar
    c.vincularSesion('c9', '33333333-3333-3333-3333-333333333333')
    expect(c.sesionDe('c9')).toBe('33333333-3333-3333-3333-333333333333')
    await c.diff('c9').catch(() => {})
    await c.fusionar('c9').catch(() => {})
    await c.skills().catch(() => {})
    expect(llamadas.map((l) => `${l.metodo} ${l.ruta}`)).toEqual([
      'GET /sessions/33333333-3333-3333-3333-333333333333/diff',
      'POST /sessions/33333333-3333-3333-3333-333333333333/merge',
      'GET /skills',
    ])
    expect(llamadas[0].auth).toBe('Bearer pase-del-os')
    await expect(c.memoriaCliente('lumbre')).rejects.toMatchObject({ name: 'NoDisponible' })
  })

  it('«Aceptar ediciones» viaja como code y la sesión aislada pide isolate', async () => {
    localStorage.clear()
    const { fetchFn, llamadas } = puenteFalso()
    const c = crearClienteHttp({ url: 'http://puente.test', token: 't' }, fetchFn)
    for await (const e of c.enviar({ conversacionId: 'c2', texto: 'hola', adjuntos: [], modeloId: 'nivel-medio', modo: 'aceptar', aislada: true })) void e
    expect(llamadas[0]).toMatchObject({ metodo: 'POST', ruta: '/sessions', cuerpo: { mode: 'code', isolate: true } })
  })

  it('un 401 pide un pase nuevo al OS', async () => {
    let pedido = 0
    const f = (async () => new Response(JSON.stringify({ error: 'no' }), { status: 401 })) as typeof fetch
    const c = crearClienteHttp({ url: 'http://puente.test', alNoAutorizado: () => pedido++ }, f)
    await expect(c.modelos()).rejects.toThrow()
    expect(pedido).toBe(1)
  })
})
