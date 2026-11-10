import type { ClienteEventos, Evento, PeticionEnvio, RespuestaPermiso } from './eventos'

type Opciones = {
  /** Multiplicador de las pausas. 0 = instantáneo (pruebas). */
  velocidad?: number
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (ms <= 0 || signal?.aborted) return resolve()
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => (clearTimeout(t), resolve()), { once: true })
  })

let contador = 0
const nuevoId = (p: string) => `${p}_${++contador}`

/**
 * Cliente de ejemplo: reproduce una sesión típica (razonar → leer → permiso → editar → responder)
 * con el mismo contrato que tendrá el puente real. No hace ninguna llamada de red.
 */
export function crearClienteMock({ velocidad = 1 }: Opciones = {}): ClienteEventos {
  const pendientes = new Map<string, (r: RespuestaPermiso) => void>()
  let siempre = false

  const ms = (n: number) => n * velocidad

  async function* enviar(p: PeticionEnvio): AsyncGenerator<Evento> {
    const { signal } = p
    const parar = () => signal?.aborted
    const chunks = async function* (id: string, tipo: 'texto' | 'razonamiento', texto: string, pausa: number) {
      for (const palabra of texto.split(/(\s+)/)) {
        if (parar()) return
        if (!palabra) continue
        yield { tipo, id, delta: palabra } as Evento
        if (/\S/.test(palabra)) await sleep(ms(pausa), signal)
      }
    }

    const idRazon = nuevoId('r')
    yield* chunks(
      idRazon,
      'razonamiento',
      `El pedido es «${p.texto.slice(0, 80)}». Primero reviso cómo está armado el módulo, después propongo un cambio pequeño y lo aplico solo si me das permiso.`,
      18,
    )
    if (parar()) return yield { tipo: 'fin', motivo: 'detenido' }

    const leer = nuevoId('t')
    yield { tipo: 'herramienta_inicio', id: leer, nombre: 'Read', entrada: { archivo: 'ceo-os/public/app.css', lineas: '4377-4400' } }
    await sleep(ms(700), signal)
    yield {
      tipo: 'herramienta_fin',
      id: leer,
      salida: { lineas: 24, resumen: 'Tokens --ui-* encontrados (claro y oscuro).' },
    }

    yield* chunks(
      nuevoId('x'),
      'texto',
      'Encontré los tokens del sistema. Voy a mapearlos a las variables de shadcn para que **claro y oscuro** salgan de una sola fuente.\n\n',
      22,
    )
    if (parar()) return yield { tipo: 'fin', motivo: 'detenido' }

    const editar = nuevoId('t')
    const permisoId = nuevoId('p')
    let respuesta: RespuestaPermiso = 't'
    if (!siempre) {
      // Se registra la espera ANTES de emitir el evento: quien consume puede responder al instante.
      const espera = new Promise<RespuestaPermiso>((resolve) => {
        pendientes.set(permisoId, resolve)
        signal?.addEventListener('abort', () => resolve('n'), { once: true })
      })
      yield {
        tipo: 'permiso_pedido',
        id: permisoId,
        herramienta: 'Edit',
        descripcion: 'Editar code-os/ui/src/index.css',
        entrada: { archivo: 'code-os/ui/src/index.css', cambio: '+ --background: var(--ui-bg)' },
      }
      respuesta = await espera
      if (respuesta === 't') siempre = true
    }

    yield { tipo: 'herramienta_inicio', id: editar, nombre: 'Edit', entrada: { archivo: 'code-os/ui/src/index.css' } }
    await sleep(ms(600), signal)
    if (respuesta === 'n') {
      yield { tipo: 'herramienta_fin', id: editar, error: 'Permiso denegado por el usuario' }
      yield* chunks(nuevoId('x'), 'texto', 'Entendido, no toqué nada. Si quieres, te dejo el cambio como diff para que lo revises primero.', 22)
    } else {
      yield { tipo: 'herramienta_fin', id: editar, salida: { cambios: '+18 −2', archivo: 'src/index.css' } }
      yield* chunks(
        nuevoId('x'),
        'texto',
        'Listo. Apliqué el mapeo:\n\n- `--background` ← `--ui-bg`\n- `--primary` ← `--ui-acc`\n- `--border` ← `--ui-line`\n\nEn modo claro cambian solo los valores de `--ui-*`; los componentes no se enteran.',
        22,
      )
    }

    if (parar()) return yield { tipo: 'fin', motivo: 'detenido' }
    yield { tipo: 'uso', modelo: p.modeloId, tokens_entrada: 1840, tokens_salida: 412 }
    yield { tipo: 'fin', motivo: 'completo' }
  }

  return {
    enviar,
    responderPermiso(id, r) {
      pendientes.get(id)?.(r)
      pendientes.delete(id)
    },
  }
}
