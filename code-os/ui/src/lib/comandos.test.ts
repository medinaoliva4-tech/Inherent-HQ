import { describe, expect, it } from 'vitest'
import { filtrarComandos, mencionEnCurso } from './comandos'
import { prepararEnvio, textoDeDataUrl } from './adjuntos'
import { describirModelo, disponible } from './niveles'

describe('comandos y menciones', () => {
  it('filtra por lo escrito y por pestaña', () => {
    expect(filtrarComandos('/pl', 'code').map((c) => c.nombre)).toEqual(['/plan'])
    expect(filtrarComandos('/pl', 'chat')).toEqual([])
    expect(filtrarComandos('/', 'chat').every((c) => !c.pestana || c.pestana === 'chat')).toBe(true)
  })
  it('detecta una @mención en curso al final', () => {
    expect(mencionEnCurso('mira @src/ind')).toBe('src/ind')
    expect(mencionEnCurso('@')).toBe('')
    expect(mencionEnCurso('correo@dominio')).toBeNull()
    expect(mencionEnCurso('mira @src/a.ts listo')).toBeNull()
  })
})

describe('adjuntos', () => {
  const b64 = (t: string) => `data:text/plain;base64,${btoa(unescape(encodeURIComponent(t)))}`
  it('pega los archivos de texto dentro del mensaje y avisa de imágenes', () => {
    const r = prepararEnvio('revisa', [
      { nombre: 'notas.md', tipo: 'text/markdown', url: b64('# hola ñ') },
      { nombre: 'foto.png', tipo: 'image/png', url: 'data:image/png;base64,AAAA' },
    ])
    expect(r.texto).toContain('Archivo adjunto: notas.md')
    expect(r.texto).toContain('# hola ñ')
    expect(r.sinEnviar).toEqual(['foto.png'])
  })
  it('decodifica data URLs', () => {
    expect(textoDeDataUrl('data:,hola%20t%C3%BA')).toBe('hola tú')
    expect(textoDeDataUrl('nada')).toBeNull()
  })
})

describe('niveles', () => {
  it('describe alias de nivel y de modelo', () => {
    expect(describirModelo('nivel-alto')).toMatchObject({ automatico: true, nivel: { id: 'alto' } })
    expect(describirModelo('cp-glm-5.3')).toMatchObject({ automatico: false, etiqueta: 'GLM 5.3', nivel: { id: 'medio' } })
    expect(describirModelo('otro-x').etiqueta).toBe('otro-x')
  })
  it('sin catálogo no bloquea; con catálogo solo lo que hay', () => {
    expect(disponible('nivel-bajo')).toBe(true)
    expect(disponible('nivel-bajo', ['cp-glm-5.3'])).toBe(false)
  })
})
