/** Artefacto = bloque de código que se puede abrir en el panel (HTML/SVG se ve en un iframe aislado). */
export type TipoArtefacto = 'html' | 'svg' | 'markdown' | 'codigo'
export type Artefacto = { id: string; titulo: string; tipo: TipoArtefacto; lenguaje: string; contenido: string }

const LENGUAJES_VISIBLES: Record<string, TipoArtefacto> = { html: 'html', svg: 'svg', markdown: 'markdown', md: 'markdown' }
/** Un bloque de código común se vuelve artefacto solo si es largo (no todo `ls` merece panel). */
const MIN_LINEAS_CODIGO = 15

/** Busca bloques ``` en el texto de una respuesta. Acepta `title="…"` después del lenguaje. */
export function extraerArtefactos(texto: string, base: string): Artefacto[] {
  const out: Artefacto[] = []
  const re = /```([\w-]*)([^\n]*)\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(texto))) {
    const lenguaje = (m[1] || 'texto').toLowerCase()
    const contenido = m[3]
    const tipo = LENGUAJES_VISIBLES[lenguaje] ?? 'codigo'
    if (tipo === 'codigo' && contenido.split('\n').length < MIN_LINEAS_CODIGO) continue
    if (tipo === 'html' && !/<\w/.test(contenido)) continue
    const titulo = /title="([^"]+)"/.exec(m[2])?.[1] ?? tituloPorDefecto(tipo, lenguaje, contenido)
    out.push({ id: `${base}:${i++}`, titulo, tipo, lenguaje, contenido })
  }
  return out
}

function tituloPorDefecto(tipo: TipoArtefacto, lenguaje: string, contenido: string) {
  if (tipo === 'html') return /<title>([^<]+)<\/title>/i.exec(contenido)?.[1]?.trim() || 'Página'
  if (tipo === 'markdown') return /^#\s+(.+)$/m.exec(contenido)?.[1]?.trim() || 'Documento'
  if (tipo === 'svg') return 'Imagen SVG'
  return `Código ${lenguaje}`
}

/**
 * Documento que va al iframe. El iframe NO lleva allow-same-origin: el código corre en un origen
 * opaco, sin acceso a la sesión, al almacenamiento ni a la ventana de Code OS.
 * La CSP bloquea fetch/XHR para que un artefacto no pueda mandar datos afuera.
 */
export function documentoSandbox(a: Artefacto): string {
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; connect-src 'none'; form-action 'none'">`
  if (a.tipo === 'svg') return `<!doctype html><html><head>${csp}<style>body{margin:0;display:grid;place-items:center;min-height:100vh}</style></head><body>${a.contenido}</body></html>`
  if (/<head[^>]*>/i.test(a.contenido)) return a.contenido.replace(/<head([^>]*)>/i, `<head$1>${csp}`)
  return `<!doctype html><html><head>${csp}</head><body>${a.contenido}</body></html>`
}

export const SANDBOX_ARTEFACTO = 'allow-scripts allow-modals'

/**
 * Quita del texto visible los bloques HTML/SVG (se ven como tarjeta de artefacto, no como código).
 * Si el último bloque sigue abierto (streaming), lo cambia por un aviso.
 */
export function ocultarBloquesVisibles(texto: string): { texto: string; escribiendo: boolean } {
  let limpio = texto.replace(/```(html|svg)[^\n]*\n[\s\S]*?```\n?/gi, '')
  const abierto = /```(html|svg)[^\n]*\n[\s\S]*$/i.exec(limpio)
  if (abierto) limpio = limpio.slice(0, abierto.index)
  return { texto: limpio.trim(), escribiendo: !!abierto }
}
