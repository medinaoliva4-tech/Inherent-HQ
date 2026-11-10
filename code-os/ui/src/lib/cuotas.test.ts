import { describe, expect, it } from 'vitest'
import type { EstadoCuotas, VentanaCuota } from './cliente'
import { avisosDe, cuandoReinicia, masApretado, nivelDe } from './cuotas'

const w = (llamadas: number, tope: number | null, extra: Partial<VentanaCuota> = {}): VentanaCuota => ({
  llamadas,
  usd: 0,
  tokens: 0,
  topes: { llamadas: tope, usd: null },
  pct: tope ? llamadas / tope : null,
  nivel: 'ok',
  rechazos: 0,
  reinicia_en: null,
  desde: '2026-11-10T00:00:00Z',
  ...extra,
})

const estado = (ventanas: Record<string, VentanaCuota>): EstadoCuotas => ({
  generado: '',
  avisos: [],
  proveedores: [
    { id: 'cline', nombre: 'Cline Pass', tipo: 'suscripcion', nivel: 'ok', ventanas },
    { id: 'nvidia', nombre: 'NVIDIA', tipo: 'gratis', nivel: 'sin_tope', ventanas: { dia: w(5, null, { nivel: 'sin_tope' }) } },
  ],
})

describe('cuotas', () => {
  it('avisa desde el 80% aunque el servidor diga ok', () => {
    expect(nivelDe(w(79, 100))).toBe('ok')
    expect(nivelDe(w(80, 100))).toBe('aviso')
    expect(nivelDe(w(100, 100))).toBe('agotado')
    expect(nivelDe(w(3, null, { nivel: 'agotado' }))).toBe('agotado') // el proveedor respondió 429
  })
  it('lista avisos con clave estable y mensaje en español', () => {
    const a = avisosDe(estado({ '5h': w(85, 100) }))
    expect(a).toEqual([expect.objectContaining({ clave: 'cline:5h:aviso', nivel: 'aviso', mensaje: 'Cline Pass va en 85% de su cupo de 5 horas.' })])
    expect(avisosDe(estado({ '5h': w(10, 100) }))).toEqual([])
  })
  it('elige lo más apretado', () => {
    expect(masApretado(estado({ '5h': w(50, 100), semana: w(90, 100) }))).toMatchObject({ p: { id: 'cline' }, ventana: 'semana' })
  })
  it('dice cuándo se libera', () => {
    const ahora = Date.parse('2026-11-10T00:00:00Z')
    expect(cuandoReinicia('2026-11-10T00:30:00Z', ahora)).toBe('en 30 min')
    expect(cuandoReinicia('2026-11-10T01:14:00Z', ahora)).toBe('en 1 h 14 min')
    expect(cuandoReinicia('2026-11-13T00:00:00Z', ahora)).toBe('en 3 días')
    expect(cuandoReinicia(null)).toBeNull()
  })
})
