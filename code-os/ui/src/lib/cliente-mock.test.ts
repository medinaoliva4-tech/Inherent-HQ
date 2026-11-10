import { describe, expect, it } from 'vitest'
import { crearClienteMock } from './cliente-mock'
import { TIPOS_EVENTO, type Evento, type ExtraPermiso, type ModoSesion, type RespuestaPermiso } from './eventos'

type Responder = (e: Extract<Evento, { tipo: 'permiso_pedido' }>) => [RespuestaPermiso, ExtraPermiso?] | null

async function recoger(texto: string, modo: ModoSesion, responder: Responder | null, abortarEn?: number) {
  const c = crearClienteMock({ velocidad: 0 })
  const ctrl = new AbortController()
  const eventos: Evento[] = []
  for await (const e of c.enviar({ conversacionId: 'c', texto, adjuntos: [], modeloId: 'nivel-medio', modo, signal: ctrl.signal })) {
    eventos.push(e)
    if (e.tipo === 'permiso_pedido' && responder) {
      const r = responder(e)
      if (r) c.responderPermiso(e.id, r[0], r[1])
    }
    if (abortarEn !== undefined && eventos.length === abortarEn) ctrl.abort()
  }
  return eventos
}

describe('cliente mock', () => {
  it('respeta el contrato: solo eventos conocidos y termina con fin', async () => {
    const ev = await recoger('hola', 'code', () => ['s'])
    expect(ev.every((e) => TIPOS_EVENTO.includes(e.tipo))).toBe(true)
    expect(ev.at(-1)).toMatchObject({ tipo: 'fin', motivo: 'completo' })
    expect(ev.some((e) => e.tipo === 'uso')).toBe(true)
    expect(ev.some((e) => e.tipo === 'herramienta_inicio' && e.nombre === 'TodoWrite')).toBe(true)
    expect(ev.some((e) => e.tipo === 'herramienta_inicio' && !!e.padre)).toBe(true) // subagente
  })

  it('con «no», la edición termina en error', async () => {
    const ev = await recoger('hola', 'code', () => ['n'])
    const fin = ev.filter((e) => e.tipo === 'herramienta_fin')
    expect(fin.at(-1)).toMatchObject({ error: expect.stringContaining('denegado') })
  })

  it('detener corta el flujo con fin detenido', async () => {
    const ev = await recoger('hola', 'code', null, 3)
    expect(ev.at(-1)).toMatchObject({ tipo: 'fin', motivo: 'detenido' })
  })

  it('plan: pide aprobar el plan y al aprobar pasa a code', async () => {
    const ev = await recoger('hola', 'plan', (e) => (e.herramienta === 'ExitPlanMode' ? ['s'] : ['s']))
    expect(ev.find((e) => e.tipo === 'permiso_pedido')).toMatchObject({ herramienta: 'ExitPlanMode' })
    expect(ev).toContainEqual({ tipo: 'modo', modo: 'code' })
  })

  it('plan: pedir cambios no toca nada', async () => {
    const ev = await recoger('hola', 'plan', () => ['n', { mensaje: 'más corto' }])
    expect(ev.some((e) => e.tipo === 'herramienta_inicio' && e.nombre === 'Edit')).toBe(false)
    expect(ev.filter((e) => e.tipo === 'texto').map((e) => (e as { delta: string }).delta).join('')).toContain('más corto')
  })

  it('pregunta: usa la respuesta elegida', async () => {
    const ev = await recoger('pregúntame', 'code', (e) =>
      e.herramienta === 'AskUserQuestion' ? ['s', { entradaNueva: { answers: { '¿Qué tema quieres revisar primero?': 'Claro' } } }] : ['s'],
    )
    expect(ev.filter((e) => e.tipo === 'texto').map((e) => (e as { delta: string }).delta).join('')).toContain('claro')
  })

  it('chat: sin herramientas y con artefacto si se pide algo visual', async () => {
    const ev = await recoger('hazme una página', 'chat', null)
    expect(ev.some((e) => e.tipo === 'herramienta_inicio')).toBe(false)
    expect(ev.filter((e) => e.tipo === 'texto').map((e) => (e as { delta: string }).delta).join('')).toContain('```html')
  })
})
