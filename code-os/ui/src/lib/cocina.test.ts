import { describe, expect, it } from 'vitest'
// La fuente de verdad del router vive en el Chat del OS. Se importa aquí solo para comparar.
// @ts-expect-error: módulo JS del OS sin tipos
import * as fuente from '../../../../ceo-os/public/js/llm/router-code.js'
import { COCINEROS, etiquetaRuta, modeloDeRuta, NIVELES_CODE, rutear } from './cocina'

const PEDIDOS = [
  'Haz una auditoría de seguridad del login',
  'Planea la arquitectura del módulo de pagos',
  'Hay un bug raro, no sé por qué falla',
  'Arregla el checkout con Stripe',
  'Mejora la interfaz del panel en móvil',
  'Escribe pruebas unitarias para eventos',
  'Renombra la función y busca dónde se usa',
  'Agrega un endpoint nuevo',
  'revisa los cambios',
  '',
]

describe('router por tarea (copia de ceo-os/public/js/llm/router-code.js)', () => {
  it('la tabla de cocineros es la misma que la del OS', () => {
    expect(COCINEROS).toEqual(fuente.COCINEROS)
    expect([...NIVELES_CODE]).toEqual(fuente.NIVELES_CODE)
  })

  it('cada pedido cae con el mismo cocinero, nivel y motivo que en el OS', () => {
    for (const p of PEDIDOS) {
      expect(rutear(p)).toEqual(fuente.rutear(p))
      expect(rutear(p, { ultimo: 'nivel-alto' })).toEqual(fuente.rutear(p, { ultimo: 'nivel-alto' }))
    }
  })

  it('la revisión la hace otro nivel distinto al que construyó', () => {
    expect(rutear('revisa esto', { ultimo: 'nivel-alto' }).nivel).toBe('nivel-medio')
    expect(rutear('revisa esto', { ultimo: 'nivel-medio' }).nivel).toBe('nivel-alto')
  })

  it('etiqueta para el hilo y modelo que viaja', () => {
    const r = rutear('mejora la interfaz')
    expect(etiquetaRuta(r)).toBe('Sous chef · nivel-alto: interfaz')
    expect(etiquetaRuta(r, true)).toBe('Sous chef · nivel-alto (Sonnet): interfaz')
    expect(modeloDeRuta(r, true)).toBe('nivel-alto') // sin id de Claude todavía: se manda el nivel
  })
})
