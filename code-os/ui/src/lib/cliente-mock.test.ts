import { describe, expect, it } from 'vitest'
import { crearClienteMock } from './cliente-mock'
import type { Evento, RespuestaPermiso } from './eventos'

async function recoger(respuesta: RespuestaPermiso | null, abortarEn?: number) {
  const c = crearClienteMock({ velocidad: 0 })
  const ctrl = new AbortController()
  const eventos: Evento[] = []
  for await (const e of c.enviar({ conversacionId: 'c', texto: 'hola', adjuntos: [], modeloId: 'm', signal: ctrl.signal })) {
    eventos.push(e)
    if (e.tipo === 'permiso_pedido' && respuesta) c.responderPermiso(e.id, respuesta)
    if (abortarEn !== undefined && eventos.length === abortarEn) ctrl.abort()
  }
  return eventos
}

describe('cliente mock', () => {
  it('respeta el contrato: solo los 8 eventos y termina con fin', async () => {
    const ev = await recoger('s')
    const validos = ['texto', 'razonamiento', 'herramienta_inicio', 'herramienta_fin', 'permiso_pedido', 'uso', 'error', 'fin']
    expect(ev.every((e) => validos.includes(e.tipo))).toBe(true)
    expect(ev.at(-1)).toEqual({ tipo: 'fin', motivo: 'completo' })
    expect(ev.some((e) => e.tipo === 'uso')).toBe(true)
  })

  it('con «no», la herramienta termina en error y no hay edición', async () => {
    const ev = await recoger('n')
    const fin = ev.filter((e) => e.tipo === 'herramienta_fin')
    expect(fin.at(-1)).toMatchObject({ error: expect.stringContaining('denegado') })
  })

  it('detener corta el flujo con fin detenido', async () => {
    const ev = await recoger(null, 3)
    expect(ev.at(-1)).toEqual({ tipo: 'fin', motivo: 'detenido' })
  })
})
