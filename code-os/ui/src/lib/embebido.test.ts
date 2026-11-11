import { describe, expect, it, vi } from 'vitest'
import { crearEnlaceOS, leerEmbebido, origenesPermitidos, validarMensaje } from './embebido'

const OS = 'https://work.inherentglobal.com'

describe('modo embebido: contrato con el Chat del OS', () => {
  it('lee ?embed=1 y el pase de la primera carga', () => {
    expect(leerEmbebido({ search: '?embed=1&pase=a.b.c', pathname: '/', hash: '' })).toEqual({ activo: true, pase: 'a.b.c' })
    expect(leerEmbebido({ search: '', pathname: '/', hash: '' })).toEqual({ activo: false, pase: undefined })
  })

  it('orígenes permitidos: work.inherentglobal.com por defecto o los de VITE_EMBED_ORIGENES', () => {
    expect(origenesPermitidos({})).toEqual([OS])
    expect(origenesPermitidos({ VITE_EMBED_ORIGENES: 'https://a.test/, https://b.test' })).toEqual(['https://a.test', 'https://b.test'])
  })

  it('solo acepta mensajes de un origen permitido y con forma conocida', () => {
    expect(validarMensaje({ origin: 'https://malo.test', data: { tipo: 'codeos:pase', pase: 'x' } }, [OS])).toBeNull()
    expect(validarMensaje({ origin: OS, data: { tipo: 'otra-cosa' } }, [OS])).toBeNull()
    expect(validarMensaje({ origin: OS, data: { tipo: 'codeos:pase', pase: 'x', expira: 5 } }, [OS])).toEqual({ tipo: 'codeos:pase', pase: 'x', expira: 5 })
    expect(validarMensaje({ origin: OS, data: { tipo: 'codeos:contexto', cliente: 'akai', sesion: 'no-es-uuid', rol: 'editor', tema: 'light', seccion: 'codigo' } }, [OS])).toEqual({
      tipo: 'codeos:contexto',
      cliente: 'akai',
      rol: 'editor',
      tema: 'light',
      seccion: 'codigo',
    })
  })

  it('el enlace avisa «listo», guarda el pase, pide otro antes de que caduque y manda texto al chat', () => {
    vi.useFakeTimers()
    const enviados: unknown[] = []
    const padre = { postMessage: (m: unknown) => enviados.push(m) }
    const oyentes: ((e: MessageEvent) => void)[] = []
    const ventana = { parent: padre, addEventListener: (_: string, f: (e: MessageEvent) => void) => oyentes.push(f), removeEventListener() {} } as unknown as Window
    const contextos: unknown[] = []
    const e = crearEnlaceOS({ pase: 'inicial', permitidos: [OS], ventana, alContexto: (c) => contextos.push(c) })
    expect(enviados[0]).toEqual({ tipo: 'codeos:listo', version: 1 })
    expect(e.token()).toBe('inicial')
    oyentes[0]({ origin: OS, source: padre, data: { tipo: 'codeos:pase', pase: 'nuevo', expira: Date.now() + 120_000 } } as unknown as MessageEvent)
    expect(e.token()).toBe('nuevo')
    oyentes[0]({ origin: OS, source: padre, data: { tipo: 'codeos:contexto', cliente: 'lumbre' } } as unknown as MessageEvent)
    expect(contextos).toEqual([{ cliente: 'lumbre' }])
    vi.advanceTimersByTime(61_000)
    expect(enviados).toContainEqual({ tipo: 'codeos:pedir-pase' })
    e.alChat('Revisa esto', true, 'nivel-medio')
    expect(enviados.at(-1)).toEqual({ tipo: 'codeos:al-chat', texto: 'Revisa esto', enviar: true, modelo: 'nivel-medio' })
    e.cerrar()
    vi.useRealTimers()
  })
})
