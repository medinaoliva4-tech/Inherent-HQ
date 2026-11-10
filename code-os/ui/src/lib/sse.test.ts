import { describe, expect, it } from 'vitest'
import { leerSse } from './sse'

const flujo = (...trozos: string[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      for (const t of trozos) c.enqueue(new TextEncoder().encode(t))
      c.close()
    },
  })

describe('leerSse', () => {
  it('arma mensajes aunque lleguen cortados, ignora comentarios y junta data multilínea', async () => {
    const out = []
    for await (const m of leerSse(flujo(': hola\n\nid: 1\nev', 'ent: text_delta\ndata: {"a":', '1}\n\nid: 2\ndata: uno\r\ndata: dos\r\n\r\n'))) out.push(m)
    expect(out).toEqual([
      { id: '1', evento: 'text_delta', datos: '{"a":1}' },
      { id: '2', evento: 'message', datos: 'uno\ndos' },
    ])
  })
})
