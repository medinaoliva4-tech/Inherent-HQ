import { describe, expect, it } from 'vitest'
import { documentoSandbox, extraerArtefactos, ocultarBloquesVisibles, SANDBOX_ARTEFACTO } from './artefactos'

describe('artefactos', () => {
  const texto = 'Mira:\n\n```html title="Paleta"\n<div>hola</div>\n```\n\nY corto:\n\n```bash\nls\n```\n'
  it('saca HTML como artefacto y deja fuera el código corto', () => {
    const a = extraerArtefactos(texto, 'p1')
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ titulo: 'Paleta', tipo: 'html', contenido: '<div>hola</div>\n' })
  })
  it('el código largo también es artefacto', () => {
    const largo = '```ts\n' + Array.from({ length: 20 }, (_, i) => `const a${i} = ${i}`).join('\n') + '\n```'
    expect(extraerArtefactos(largo, 'p')[0]).toMatchObject({ tipo: 'codigo', lenguaje: 'ts' })
  })
  it('oculta los bloques HTML del texto y avisa si sigue escribiendo', () => {
    expect(ocultarBloquesVisibles(texto).texto).not.toContain('<div>')
    expect(ocultarBloquesVisibles('Va:\n```html\n<div>a medias')).toEqual({ texto: 'Va:', escribiendo: true })
  })
  it('el iframe va sin allow-same-origin y con CSP sin red', () => {
    expect(SANDBOX_ARTEFACTO).not.toContain('allow-same-origin')
    const doc = documentoSandbox({ id: 'x', titulo: 't', tipo: 'html', lenguaje: 'html', contenido: '<html><head><title>a</title></head><body></body></html>' })
    expect(doc).toContain("connect-src 'none'")
    expect(doc.indexOf('Content-Security-Policy')).toBeLessThan(doc.indexOf('<title>'))
  })
})
