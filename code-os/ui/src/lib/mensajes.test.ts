import { describe, expect, it } from 'vitest'
import type { Evento } from './eventos'
import { aplicarEvento, pendienteDe, registrarPlan, registrarPregunta, registrarRespuesta, subagentesDe, tareasDe, usoTotal, type Mensaje } from './mensajes'

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

describe('subagentes, preguntas, plan y tareas', () => {
  it('anida los pasos y el texto del subagente bajo su tarjeta', () => {
    const m = correr([
      { tipo: 'herramienta_inicio', id: 'sub', nombre: 'Task', entrada: { description: 'Buscar' } },
      { tipo: 'herramienta_inicio', id: 'g', nombre: 'Grep', entrada: {}, padre: 'sub' },
      { tipo: 'herramienta_fin', id: 'g', salida: 'ok', padre: 'sub' },
      { tipo: 'texto', id: 'x', delta: 'encontré', padre: 'sub' },
    ])
    expect(m.partes).toHaveLength(1)
    expect(m.partes[0]).toMatchObject({ tipo: 'herramienta', hijos: [{ id: 'g', estado: 'listo' }], textoHijo: 'encontré' })
  })

  it('AskUserQuestion y ExitPlanMode se vuelven pregunta y plan', () => {
    let m = correr([
      { tipo: 'permiso_pedido', id: 'q', herramienta: 'AskUserQuestion', descripcion: '', entrada: { questions: [{ question: '¿Cuál?', options: [{ label: 'A' }, { label: 'B' }] }] } },
      { tipo: 'permiso_pedido', id: 'p', herramienta: 'ExitPlanMode', descripcion: '', entrada: { plan: '1. leer' } },
    ])
    expect(m.partes[0]).toMatchObject({ tipo: 'pregunta', preguntas: [{ question: '¿Cuál?', options: [{ label: 'A' }, { label: 'B' }] }] })
    expect(m.partes[1]).toMatchObject({ tipo: 'plan', plan: '1. leer' })
    expect(pendienteDe([m])?.id).toBe('q')
    m = registrarPregunta(m, 'q', { '¿Cuál?': 'A' })
    expect(pendienteDe([m])?.id).toBe('p')
    m = registrarPlan(m, 'p', 'aprobado')
    expect(pendienteDe([m])).toBeUndefined()
  })

  it('tareasDe devuelve la última lista y subagentesDe los Task', () => {
    const m = correr([
      { tipo: 'herramienta_inicio', id: 't1', nombre: 'TodoWrite', entrada: { todos: [{ content: 'a', status: 'pending' }] } },
      { tipo: 'herramienta_inicio', id: 's', nombre: 'Agent', entrada: {} },
      { tipo: 'herramienta_inicio', id: 't2', nombre: 'TodoWrite', entrada: { todos: [{ content: 'a', status: 'completed' }] } },
    ])
    expect(tareasDe([m])).toEqual([{ content: 'a', status: 'completed' }])
    expect(subagentesDe([m]).map((s) => s.id)).toEqual(['s'])
  })

  it('modo y uso total', () => {
    const m = correr([
      { tipo: 'modo', modo: 'code' },
      { tipo: 'uso', modelo: 'x', tokens_entrada: 100, tokens_salida: 5, tokens_cache: 900 },
    ])
    expect(m.partes[0]).toMatchObject({ tipo: 'modo', modo: 'code' })
    expect(usoTotal([m])).toEqual({ entrada: 100, salida: 5, ultimaEntrada: 1000 })
  })
})
