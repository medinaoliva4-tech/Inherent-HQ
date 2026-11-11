import { describe, expect, it } from 'vitest'
import { aplicarCalibracion, calcularInbound, calcularOutbound, inboundPorDefecto, probAlMenos, prospectosNecesarios } from './calculadora'

describe('calculadora outbound', () => {
  it('caso de referencia: m=5, c=1%, P=95%, w=4 → 913 / 229 / 46', () => {
    expect(calcularOutbound({ meta: 5, conversion: 0.01, probabilidad: 0.95, semanas: 4 })).toEqual({ prospectos: 913, porSemana: 229, porDiaHabil: 46 })
  })

  it('913 es el MENOR n: con 912 no se llega al 95 %', () => {
    expect(probAlMenos(913, 0.01, 5)).toBeGreaterThanOrEqual(0.95)
    expect(probAlMenos(912, 0.01, 5)).toBeLessThan(0.95)
  })

  it('bordes: conversión 100 % = la meta; 0 % o P = 100 % no tienen solución', () => {
    expect(prospectosNecesarios(5, 1, 0.95)).toBe(5)
    expect(prospectosNecesarios(5, 0, 0.95)).toBeNull()
    expect(prospectosNecesarios(5, 0.01, 1)).toBeNull()
  })

  it('más probabilidad o menos conversión piden más prospectos', () => {
    const base = prospectosNecesarios(5, 0.01, 0.9)!
    expect(prospectosNecesarios(5, 0.01, 0.99)!).toBeGreaterThan(base)
    expect(prospectosNecesarios(5, 0.005, 0.9)!).toBeGreaterThan(base)
  })

  it('no se desborda con metas grandes', () => {
    const n = prospectosNecesarios(100, 0.002, 0.95)!
    expect(n).toBeGreaterThan(50_000)
    expect(probAlMenos(n, 0.002, 100)).toBeGreaterThanOrEqual(0.95)
  })
})

describe('calculadora inbound', () => {
  it('va de la meta hacia atrás por el embudo', () => {
    const r = calcularInbound({ ...inboundPorDefecto(), meta: 10 })!
    expect(r.leads).toBe(50) // 10 / 0.2
    expect(r.clics).toBe(625) // 50 / 0.08
    expect(r.impresiones).toBe(52_084) // ceil(625 / 0.012)
    expect(r.alcance).toBe(26_042)
    expect(r.presupuestoEstimado).toBeCloseTo(234.38, 2)
    expect(r.reelsPrueba).toBe(3)
  })

  it('calibrar reemplaza las tasas supuestas y marca de dónde vino cada una', () => {
    const e = aplicarCalibracion(inboundPorDefecto(), { desde: 'Zernio', muestra: '6 reels', tasas: { ctr: 0.009 } })
    expect(e.ctr).toEqual({ valor: 0.009, origen: { tipo: 'zernio', desde: 'Zernio', muestra: '6 reels' } })
    expect(e.cpm.origen.tipo).toBe('supuesto')
  })
})
