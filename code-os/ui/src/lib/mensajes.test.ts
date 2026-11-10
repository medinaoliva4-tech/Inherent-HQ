import { describe, expect, it } from 'vitest'
import type { Evento } from './eventos'
import { aplicarEvento, registrarRespuesta, type Mensaje } from './mensajes'

const vacio = (): Mensaje => ({ id: 'a', rol: 'asistente', partes: [], enCurso: true })
const correr = (es: Evento[]) => es.reduce(aplicarEvento, vacio())

describe('aplicarEvento', () => {
  it('acumula deltas de texto por id', () => {
    const m = correr([
      { tipo: 'texto', id: 'x', delta: 'Ho' },
      { tipo: 'texto', id: 'x', delta: 'la' },
    ])
    expect(m.partes).toEqual([{ tipo: 'texto', id: 'x', texto: 'Hola' }])
  })

  it('cierra el razonamiento cuando llega texto o una herramienta', () => {
    const m = correr([
      { tipo: 'razonamiento', id: 'r', delta: 'pienso' },
      { tipo: 'herramienta_inicio', id: 't', nombre: 'Read', entrada: {} },
    ])
    expect(m.partes[0]).toMatchObject({ tipo: 'razonamiento', cerrado: true })
  })

  it('herramienta_fin marca listo o error', () => {
    const base: Evento[] = [{ tipo: 'herramienta_inicio', id: 't', nombre: 'Edit', entrada: {} }]
    expect(correr([...base, { tipo: 'herramienta_fin', id: 't', salida: 1 }]).partes[0]).toMatchObject({ estado: 'listo', salida: 1 })
    expect(correr([...base, { tipo: 'herramienta_fin', id: 't', error: 'no' }]).partes[0]).toMatchObject({ estado: 'error', error: 'no' })
  })

  it('permiso_pedido queda pendiente hasta registrar la respuesta', () => {
    let m = correr([{ tipo: 'permiso_pedido', id: 'p', herramienta: 'Edit', descripcion: 'd', entrada: {} }])
    expect(m.partes[0]).toMatchObject({ tipo: 'permiso' })
    expect(m.partes[0]).not.toHaveProperty('respuesta')
    m = registrarRespuesta(m, 'p', 't')
    expect(m.partes[0]).toMatchObject({ respuesta: 't' })
  })

  it('uso, error y fin', () => {
    const m = correr([
      { tipo: 'uso', modelo: 'm', tokens_entrada: 1, tokens_salida: 2 },
      { tipo: 'error', mensaje: 'falló' },
      { tipo: 'fin', motivo: 'detenido' },
    ])
    expect(m.uso).toEqual({ modelo: 'm', tokens_entrada: 1, tokens_salida: 2 })
    expect(m.error).toBe('falló')
    expect(m.enCurso).toBe(false)
    expect(m.detenido).toBe(true)
  })

  it('no muta el mensaje original', () => {
    const m = vacio()
    aplicarEvento(m, { tipo: 'texto', id: 'x', delta: 'a' })
    expect(m.partes).toHaveLength(0)
  })
})
