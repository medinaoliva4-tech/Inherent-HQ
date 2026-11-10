import type { Adjunto } from './eventos'

/** Tope para meter un archivo de texto dentro del mensaje (el puente acepta 100 000 caracteres por mensaje). */
export const MAX_TEXTO_ADJUNTO = 40_000
export const MAX_ARCHIVO_BYTES = 30 * 1024 * 1024

const EXT_TEXTO = /\.(txt|md|markdown|csv|tsv|json|ya?ml|toml|xml|html?|css|scss|js|jsx|ts|tsx|mjs|cjs|py|rb|go|rs|java|kt|swift|sh|sql|env\.example|log)$/i

export function esTexto(a: Pick<Adjunto, 'nombre' | 'tipo'>) {
  return a.tipo.startsWith('text/') || /json|xml|javascript|typescript|yaml|csv/.test(a.tipo) || EXT_TEXTO.test(a.nombre)
}
export const esImagen = (a: Pick<Adjunto, 'tipo'>) => a.tipo.startsWith('image/')

/** data:...;base64,xxx → texto UTF-8. */
export function textoDeDataUrl(url: string): string | null {
  const m = /^data:([^,]*?)(;base64)?,(.*)$/s.exec(url)
  if (!m) return null
  try {
    if (!m[2]) return decodeURIComponent(m[3])
    const bin = atob(m[3])
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

/**
 * Prepara lo que viaja al puente. El puente solo recibe texto: los archivos de texto se pegan
 * dentro del mensaje como bloque de código; imágenes y PDF quedan solo como nombre (aviso).
 */
export function prepararEnvio(texto: string, adjuntos: Adjunto[]) {
  const bloques: string[] = []
  const sinEnviar: string[] = []
  for (const a of adjuntos) {
    if (esTexto(a) && a.url) {
      const t = textoDeDataUrl(a.url)
      if (t !== null) {
        const corto = t.length > MAX_TEXTO_ADJUNTO ? t.slice(0, MAX_TEXTO_ADJUNTO) + '\n… (recortado)' : t
        bloques.push(`Archivo adjunto: ${a.nombre}\n\`\`\`\n${corto}\n\`\`\``)
        continue
      }
    }
    sinEnviar.push(a.nombre)
  }
  const final = [texto, ...bloques].filter(Boolean).join('\n\n')
  return { texto: final, sinEnviar }
}
