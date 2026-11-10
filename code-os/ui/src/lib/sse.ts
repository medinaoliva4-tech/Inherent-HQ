/** Un mensaje SSE ya armado. */
export type MensajeSse = { id?: string; evento: string; datos: string }

/**
 * Lee un flujo SSE desde un `ReadableStream` (fetch). Se usa fetch y no `EventSource`
 * porque el puente exige `Authorization: Bearer`, y EventSource no deja mandar cabeceras.
 */
export async function* leerSse(cuerpo: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<MensajeSse> {
  const lector = cuerpo.getReader()
  const dec = new TextDecoder()
  let resto = ''
  let actual: { id?: string; evento?: string; datos: string[] } = { datos: [] }
  const cortar = () => lector.cancel().catch(() => {})
  signal?.addEventListener('abort', cortar, { once: true })
  try {
    while (true) {
      const { value, done } = await lector.read()
      if (done) break
      resto += dec.decode(value, { stream: true })
      let i: number
      while ((i = resto.search(/\r?\n/)) >= 0) {
        const linea = resto.slice(0, i)
        resto = resto.slice(i + (resto[i] === '\r' ? 2 : 1))
        if (linea === '') {
          if (actual.datos.length) yield { id: actual.id, evento: actual.evento ?? 'message', datos: actual.datos.join('\n') }
          actual = { datos: [] }
          continue
        }
        if (linea.startsWith(':')) continue // comentario / latido
        const dos = linea.indexOf(':')
        const campo = dos < 0 ? linea : linea.slice(0, dos)
        let valor = dos < 0 ? '' : linea.slice(dos + 1)
        if (valor.startsWith(' ')) valor = valor.slice(1)
        if (campo === 'data') actual.datos.push(valor)
        else if (campo === 'event') actual.evento = valor
        else if (campo === 'id') actual.id = valor
      }
    }
  } finally {
    signal?.removeEventListener('abort', cortar)
    cortar()
  }
}
