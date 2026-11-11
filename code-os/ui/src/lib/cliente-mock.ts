import { archivosEjemplo, arbolEjemplo, cuotasEjemplo, diffsEjemplo, mcpEjemplo, skillsEjemplo, terminalEjemplo } from '@/data/ejemplo'
import { agentePorId } from './agentes'
import { calcularInbound, calcularOutbound } from './calculadora'
import type { Cliente, Terminal } from './cliente'
import type { Evento, ExtraPermiso, PeticionEnvio, RespuestaPermiso } from './eventos'
import { crearHiloMemoria, type HiloMemoria } from './hilo-memoria'
import { NIVELES } from './niveles'

type Opciones = {
  /** Multiplicador de las pausas. 0 = instantáneo (pruebas). */
  velocidad?: number
  /** El hilo en memoria; las pruebas pasan uno sin localStorage. */
  hilo?: HiloMemoria
}

/** Lo que cada agente de ejemplo escribe (documento en vivo) y propone al final (tarjeta de decisión). */
const TRABAJO_AGENTE: Record<string, { etapa: string; doc: string; propuesta: Record<string, unknown>; revisar?: string }> = {
  estrategia: {
    etapa: 'Dolores y deseos',
    doc: '## Dolores y deseos — borrador\n\n1. **Nadie confirma cuántas personas van.** Cambia el número dos veces antes del evento [hipótesis].\n2. **La comida llega tarde** y la reunión empieza sin nada (entrevista 2).\n3. **La factura llega a fin de mes** y contabilidad se queja [hipótesis].\n\n**Deseo central:** quedar bien con gerencia sin pensar en la comida.\n\n_Fuentes: entrevistas 1–4 · lo hablado en este chat._',
    propuesta: { tipo: 'dolor', titulo: 'Nadie confirma cuántas personas van', contenido: { decide: 'Nuevo dolor: el número de personas cambia y nadie confirma.', texto: 'La asistente cambia el número dos veces antes del evento.' }, viene_de: ['lu-icp'] },
    revisar: 'lu-dolor-2',
  },
  creativo: {
    etapa: 'Pilares y ángulos',
    doc: '## Ángulos nuevos\n\n- **La factura del mismo día** — sale del dolor #3. Winner parecido: «Rating our clients’ reactions» (610 k vistas).\n- **Quemado:** unboxing cenital de bandejas (ya lo hacen 4 cuentas del radar).\n\n_Fuentes: radar (3 referentes) · dolores aprobados._',
    propuesta: { tipo: 'angulo', titulo: 'La factura del mismo día', contenido: { decide: 'Ángulo para el dolor de contabilidad.' }, viene_de: ['lu-dolor-3'] },
  },
  produccion: {
    etapa: 'Pre',
    doc: '## Pre-producción — borrador\n\n**Jornada:** 18 nov · llamado 6:00 a. m.\n\n| # | Plano | Toma |\n|---|---|---|\n| 1 | Cenital | Teléfono con 40 notificaciones |\n| 2 | Medio | Un solo mensaje |\n| 3 | Detalle | Cronómetro sobre la bandeja |\n\n**Permisos:** oficina del cliente, imagen de la asistente.',
    propuesta: { tipo: 'pieza', titulo: 'Story «Faltan 15 minutos»', contenido: { decide: 'Derivada vertical de la pieza 2.', formato: 'Story' }, viene_de: ['lu-campana-1'] },
  },
  diseno: {
    etapa: 'Borrador',
    doc: '## Carrusel — borrador\n\n1. Portada: «Tu reunión empieza a las 9. La comida, a las 8:45.»\n2. Cómo funciona en 3 pasos.\n3. Cierre: escribe «REUNIÓN».\n\n_Plantilla: carrusel 4:5 del kit._',
    propuesta: { tipo: 'pieza', titulo: 'Carrusel «Reunión a tiempo»', contenido: { decide: 'Carrusel 4:5 de 3 láminas.', formato: 'Carrusel' }, viene_de: ['lu-campana-1'] },
  },
}

type Respuesta = { r: RespuestaPermiso; extra?: ExtraPermiso }

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (ms <= 0 || signal?.aborted) return resolve()
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => (clearTimeout(t), resolve()), { once: true })
  })

let contador = 0
const nuevoId = (p: string) => `${p}_${++contador}`

const ARTEFACTO = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; font: 14px/1.5 -apple-system, system-ui, sans-serif; background: #0d0d0e; color: #efebe4; display: grid; place-items: center; min-height: 100vh; }
  .tarjeta { padding: 24px 28px; border-radius: 20px; background: rgb(30 30 32 / .6); box-shadow: inset 0 1px 0 rgb(255 255 255 / .13), inset 0 0 0 1px rgb(255 255 255 / .055); }
  h1 { font-size: 18px; margin: 0 0 12px; }
  .fila { display: flex; gap: 8px; }
  .muestra { width: 56px; height: 56px; border-radius: 12px; box-shadow: inset 0 0 0 1px rgb(255 255 255 / .1); }
  button { margin-top: 16px; border: 0; border-radius: 10px; padding: 8px 14px; background: #f5f5f7; color: #000; font-weight: 600; cursor: pointer; }
</style>
</head>
<body>
  <div class="tarjeta">
    <h1>Paleta del OS</h1>
    <div class="fila">
      <div class="muestra" style="background:#0d0d0e"></div>
      <div class="muestra" style="background:#1b1b1d"></div>
      <div class="muestra" style="background:#efebe4"></div>
      <div class="muestra" style="background:#e8c98f"></div>
    </div>
    <button onclick="document.body.style.background = document.body.style.background ? '' : '#fafafa'">Probar fondo claro</button>
  </div>
</body>
</html>`

const PLAN = `## Plan

1. **Leer** \`src/index.css\` y ubicar las variables de shadcn.
2. **Mapear** \`--background\`, \`--foreground\` y \`--border\` a los tokens \`--ui-*\`.
3. **Probar** claro y oscuro con \`npm test\` y una captura de cada tema.

No toco nada hasta que lo apruebes.`

/**
 * Cliente de ejemplo: reproduce sesiones típicas (chat con artefacto, plan, code con tareas,
 * subagente, pregunta y permiso) con el mismo contrato que el puente real. No hace llamadas de red.
 */
export function crearClienteMock({ velocidad = 1, hilo: hiloDado }: Opciones = {}): Cliente {
  const hilo = hiloDado ?? crearHiloMemoria()
  /** Respuesta asíncrona con la misma pausa que tendría la red (y los errores del hilo como rechazos). */
  const responder = async <T,>(fn: () => T, pausa = 60): Promise<T> => {
    await sleep(ms(pausa))
    return fn()
  }
  const pendientes = new Map<string, (r: Respuesta) => void>()
  const siempre = new Set<string>()
  const guardados: Record<string, string> = {}
  const ms = (n: number) => n * velocidad

  async function* enviar(p: PeticionEnvio): AsyncGenerator<Evento> {
    const { signal } = p
    const parar = () => !!signal?.aborted
    const t0 = Date.now()
    const conv = p.conversacionId
    const decir = async function* (texto: string, tipo: 'texto' | 'razonamiento' = 'texto', padre?: string, pausa = 18) {
      const id = nuevoId(tipo === 'texto' ? 'x' : 'r')
      for (const palabra of texto.split(/(\s+)/)) {
        if (parar()) return
        if (!palabra) continue
        yield { tipo, id, delta: palabra, padre } as Evento
        if (/\S/.test(palabra)) await sleep(ms(pausa), signal)
      }
    }
    const herramienta = async function* (nombre: string, entrada: Record<string, unknown>, salida: unknown, padre?: string, pausa = 500) {
      const id = nuevoId('t')
      yield { tipo: 'herramienta_inicio', id, nombre, entrada, padre } as Evento
      await sleep(ms(pausa), signal)
      yield { tipo: 'herramienta_fin', id, salida, padre } as Evento
      return id
    }
    /** Pide algo y espera la respuesta. La espera se registra ANTES de emitir: quien consume puede responder al instante. */
    const pedir = async function* (herramientaNombre: string, descripcion: string, entrada: Record<string, unknown>): AsyncGenerator<Evento, Respuesta> {
      const interactivo = herramientaNombre === 'AskUserQuestion' || herramientaNombre === 'ExitPlanMode'
      if (!interactivo && siempre.has(conv)) return { r: 't' }
      const id = nuevoId('p')
      const espera = new Promise<Respuesta>((resolve) => {
        pendientes.set(id, resolve)
        signal?.addEventListener('abort', () => resolve({ r: 'n' }), { once: true })
      })
      yield { tipo: 'permiso_pedido', id, herramienta: herramientaNombre, descripcion, entrada }
      const r = await espera
      if (r.r === 't' && !interactivo) siempre.add(conv)
      return r
    }
    const cerrar = function* (motivo: 'completo' | 'detenido' = 'completo'): Generator<Evento> {
      if (motivo === 'completo') yield { tipo: 'uso', modelo: p.modeloId, tokens_entrada: 1840, tokens_salida: 412, tokens_cache: 12_400 }
      yield { tipo: 'fin', motivo, duracionMs: Date.now() - t0 }
    }

    const texto = p.texto.trim()

    // Comandos con / que entiende el motor (Claude Code). En el mock solo se simulan.
    if (texto.startsWith('/')) {
      const cmd = texto.split(/\s/)[0]
      const respuestas: Record<string, string> = {
        '/compact': 'Resumí la conversación para liberar contexto. Sigo con lo importante: tokens del OS y el contrato de eventos.',
        '/context': 'Contexto usado: **14 200 tokens** (instrucciones 2 100 · conversación 9 800 · herramientas 2 300).',
        '/review': 'Revisé los cambios: 2 archivos, sin problemas graves. Sugiero agregar una prueba para `eventos.ts`.',
        '/init': 'Leí la carpeta y propuse un `CLAUDE.md` con cómo correr, probar y el estilo del proyecto.',
      }
      yield* decir(respuestas[cmd] ?? `El comando \`${cmd}\` lo resuelve el motor en el servidor. (Ejemplo: aquí no hace nada.)`)
      return yield* cerrar(parar() ? 'detenido' : 'completo')
    }

    const modo = p.modo ?? 'code'

    // ——— @agente: el orquestador lanza su subagente; su texto es el documento en vivo y termina con una propuesta.
    const llamado = /subagent_type "([\w-]+)"/.exec(texto)?.[1]
    const agente = llamado ? agentePorId(llamado) : undefined
    if (agente) {
      const t = TRABAJO_AGENTE[agente.id]
      yield* decir(`Me llamaron con @${agente.id}. Primero digo cómo lo trabajo y después lanzo al subagente.`, 'razonamiento', undefined, 8)
      yield* decir(`**Así lo voy a trabajar:** ${agente.etapas.map((e) => e.nombre).join(' → ')}. Empiezo por **${t.etapa}** con lo que ya hablamos.\n\n`, 'texto', undefined, 10)
      if (agente.id === 'estrategia') {
        const r = yield* pedir('AskUserQuestion', 'Tu aporte para esta etapa', {
          questions: [
            {
              header: 'Tu aporte',
              question: '¿Quién te ha comprado más y por qué?',
              multiSelect: false,
              options: [
                { label: 'Asistentes de gerencia', description: 'Piden para reuniones de directorio' },
                { label: 'Recursos humanos', description: 'Piden para capacitaciones y eventos internos' },
              ],
            },
          ],
        })
        const elegido = r.extra?.entradaNueva?.answers as Record<string, string> | undefined
        if (elegido) yield* decir(`Anotado: **${Object.values(elegido)[0]}** (aporte tuyo, fuente interna).\n\n`, 'texto', undefined, 6)
      }
      if (parar()) return yield* cerrar('detenido')
      const sub = nuevoId('t')
      yield { tipo: 'herramienta_inicio', id: sub, nombre: 'Task', entrada: { description: `${agente.nombre} · ${t.etapa}`, subagent_type: agente.id, prompt: texto.slice(0, 400) } }
      await sleep(ms(200), signal)
      yield* herramienta('Read', { file_path: `clientes/lumbre/${t.etapa.toLowerCase()}.md` }, '(ejemplo)', sub, 300)
      yield* decir(t.doc, 'texto', sub, 14)
      yield { tipo: 'herramienta_fin', id: sub, salida: `Etapa «${t.etapa}» lista para revisar.` }
      if (parar()) return yield* cerrar('detenido')
      const bloques = ['```nodo\n' + JSON.stringify(t.propuesta) + '\n```']
      if (t.revisar) bloques.push('```nodo\n' + JSON.stringify({ id: t.revisar }) + '\n```')
      const intro = t.revisar ? 'Propongo un dato nuevo para el hilo y te pido revisar uno que cambió hace poco. Ábrelos para aprobar:' : 'Propongo esto para el hilo; ábrelo para aprobar:'
      yield* decir(`Listo el borrador de **${t.etapa}** (lo ves en la pestaña del agente). ${intro}\n\n${bloques.join('\n\n')}`, 'texto', undefined, 4)
      return yield* cerrar(parar() ? 'detenido' : 'completo')
    }

    // ——— Chat: sin herramientas. Si pides algo visual, responde con un artefacto HTML.
    if (modo === 'chat') {
      yield* decir(`Me piden «${texto.slice(0, 60)}». Respondo directo y, si sirve verlo, armo un artefacto.`, 'razonamiento', undefined, 10)
      if (/p[aá]gina|html|artefacto|tablero|diagrama|paleta|visual/i.test(texto)) {
        yield* decir('Te armé una vista rápida de la paleta. Ábrela en el panel para probarla:\n\n```html title="Paleta del OS"\n' + ARTEFACTO + '\n```\n\nEl botón cambia el fondo para comparar claro y oscuro.', 'texto', undefined, 2)
      } else {
        yield* decir(
          'Claro. Tres ideas para empezar:\n\n1. **Una sola fuente de color**: todo sale de `--ui-*`.\n2. **Vidrio solo para controles**; el contenido va sólido.\n3. **Movimiento con resortes** que se pueden interrumpir.\n\n¿Quieres que lo vea como página? Pídeme «muéstralo como artefacto».',
        )
      }
      return yield* cerrar(parar() ? 'detenido' : 'completo')
    }

    // ——— Plan: solo lee y propone. Al aprobar, pasa a code y ejecuta.
    if (modo === 'plan') {
      yield* decir('Antes de tocar nada, leo cómo está armado el estilo.', 'razonamiento', undefined, 10)
      yield* herramienta('Glob', { pattern: 'src/**/*.css' }, 'src/index.css')
      yield* herramienta('Read', { file_path: 'src/index.css' }, archivosEjemplo['src/index.css'])
      if (parar()) return yield* cerrar('detenido')
      const r = yield* pedir('ExitPlanMode', 'Plan listo para revisar', { plan: PLAN })
      if (r.r === 'n') {
        yield* decir(r.extra?.mensaje ? `Entendido: «${r.extra.mensaje}». Ajusto el plan y te lo vuelvo a mostrar.` : 'Entendido, no sigo. Dime qué cambio y lo ajusto.')
        return yield* cerrar(parar() ? 'detenido' : 'completo')
      }
      yield { tipo: 'modo', modo: 'code' }
    }

    // ——— Code: tareas, subagente, pregunta (si la pides) y permiso para editar.
    if (/preg[uú]nt|elige|opciones/i.test(texto)) {
      const r = yield* pedir('AskUserQuestion', 'Claude tiene una pregunta', {
        questions: [
          {
            header: 'Tema',
            question: '¿Qué tema quieres revisar primero?',
            multiSelect: false,
            options: [
              { label: 'Oscuro', description: 'El que usa el OS por defecto' },
              { label: 'Claro', description: 'Fondo #fafafa y tinta #18181b' },
            ],
          },
        ],
      })
      const elegido = r.extra?.entradaNueva?.answers as Record<string, string> | undefined
      const respuesta = elegido ? Object.values(elegido)[0] : undefined
      yield* decir(respuesta ? `Perfecto, empiezo por **${respuesta.toLowerCase()}**.\n\n` : 'Sigo con los dos temas.\n\n')
    }

    const tareas = (estados: ('pending' | 'in_progress' | 'completed')[]) => ({
      todos: [
        { content: 'Leer los tokens del OS', activeForm: 'Leyendo los tokens del OS', status: estados[0] },
        { content: 'Buscar dónde se usan los colores', activeForm: 'Buscando dónde se usan los colores', status: estados[1] },
        { content: 'Mapear tokens a shadcn', activeForm: 'Mapeando tokens a shadcn', status: estados[2] },
      ],
    })

    yield* decir(`El pedido es «${texto.slice(0, 80)}». Reviso el módulo, delego la búsqueda y propongo un cambio pequeño.`, 'razonamiento', undefined, 12)
    if (parar()) return yield* cerrar('detenido')
    yield* herramienta('TodoWrite', tareas(['in_progress', 'pending', 'pending']), 'Lista actualizada', undefined, 150)
    yield* herramienta('Read', { file_path: 'src/index.css' }, archivosEjemplo['src/index.css'])
    yield* herramienta('TodoWrite', tareas(['completed', 'in_progress', 'pending']), 'Lista actualizada', undefined, 150)

    // Subagente: sus pasos llegan con `padre`.
    const sub = nuevoId('t')
    yield { tipo: 'herramienta_inicio', id: sub, nombre: 'Task', entrada: { description: 'Buscar usos de color', subagent_type: 'Explore', prompt: 'Encuentra dónde se usan colores fijos en src/' } }
    await sleep(ms(300), signal)
    yield* herramienta('Grep', { pattern: '#[0-9a-f]{6}', path: 'src' }, 'src/App.tsx:4\nsrc/index.css:2', sub, 400)
    yield* decir('Hay dos colores fijos: uno en App.tsx y otro en index.css. El resto ya usa variables.', 'texto', sub, 8)
    yield { tipo: 'herramienta_fin', id: sub, salida: 'Dos colores fijos encontrados.' }
    yield* herramienta('TodoWrite', tareas(['completed', 'completed', 'in_progress']), 'Lista actualizada', undefined, 150)

    yield* decir('Encontré los tokens del sistema. Voy a mapearlos a las variables de shadcn para que **claro y oscuro** salgan de una sola fuente.\n\n')
    if (parar()) return yield* cerrar('detenido')

    const r = yield* pedir('Edit', 'Editar src/index.css', {
      file_path: 'src/index.css',
      old_string: '  --background: oklch(1 0 0);',
      new_string: '  --background: var(--ui-bg);',
    })
    const editar = nuevoId('t')
    yield { tipo: 'herramienta_inicio', id: editar, nombre: 'Edit', entrada: { file_path: 'src/index.css' } }
    await sleep(ms(500), signal)
    if (r.r === 'n') {
      yield { tipo: 'herramienta_fin', id: editar, error: 'Permiso denegado por el usuario' }
      yield* decir('Entendido, no toqué nada. Si quieres, te dejo el cambio como diff para que lo revises primero.')
    } else {
      yield { tipo: 'herramienta_fin', id: editar, salida: { cambios: '+4 −2', archivo: 'src/index.css' } }
      yield* herramienta('TodoWrite', tareas(['completed', 'completed', 'completed']), 'Lista actualizada', undefined, 100)
      yield* decir(
        'Listo. Apliqué el mapeo:\n\n- `--background` ← `--ui-bg`\n- `--foreground` ← `--ui-ink`\n- `--border` ← `--ui-line`\n\nRevisa el cambio en la pestaña **Cambios** del panel.',
      )
    }
    yield* cerrar(parar() ? 'detenido' : 'completo')
  }

  return {
    tipo: 'mock',
    enviar,
    responderPermiso(id, r, extra) {
      pendientes.get(id)?.({ r, extra })
      pendientes.delete(id)
    },
    async modelos() {
      return { porDefecto: 'nivel-medio', ids: NIVELES.flatMap((n) => [n.alias, ...n.modelos.map((m) => m.id)]) }
    },
    async cuotas() {
      return cuotasEjemplo()
    },
    async estado() {
      return { claude: 'activa', puente: 'mock' }
    },
    async ajustarSesion() {},
    async interrumpir() {},
    async cerrarSesion(conv) {
      siempre.delete(conv)
    },
    async archivos() {
      await sleep(ms(150))
      return arbolEjemplo()
    },
    async leerArchivo(_c, ruta) {
      await sleep(ms(80))
      return guardados[ruta] ?? archivosEjemplo[ruta] ?? ''
    },
    async guardarArchivo(_c, ruta, contenido) {
      guardados[ruta] = contenido
    },
    async diff() {
      await sleep(ms(150))
      return diffsEjemplo
    },
    async abrirTerminal(_c, alRecibir): Promise<Terminal> {
      const prompt = '\x1b[2m~/inherent-os\x1b[0m $ '
      let linea = ''
      alRecibir('\x1b[2mTerminal de ejemplo. Prueba: ls, pwd, git status, npm test, clear\x1b[0m\r\n' + prompt)
      return {
        escribir(d) {
          for (const ch of d) {
            if (ch === '\r') {
              const cmd = linea.trim()
              linea = ''
              if (cmd === 'clear') {
                alRecibir('\x1b[2J\x1b[H' + prompt)
                continue
              }
              const out = cmd ? (terminalEjemplo[cmd] ?? `${cmd.split(' ')[0]}: no está en la terminal de ejemplo`) : ''
              alRecibir('\r\n' + (out ? out.replace(/\n/g, '\r\n') + '\r\n' : '') + prompt)
            } else if (ch === '\x7f') {
              if (linea) {
                linea = linea.slice(0, -1)
                alRecibir('\b \b')
              }
            } else if (ch === '\x03') {
              linea = ''
              alRecibir('^C\r\n' + prompt)
            } else if (ch >= ' ') {
              linea += ch
              alRecibir(ch)
            }
          }
        },
        redimensionar() {},
        cerrar() {},
      }
    },
    async mcp() {
      return mcpEjemplo
    },
    async skills() {
      return skillsEjemplo
    },
    clientes: () => responder(() => hilo.clientes()),
    nodos: (c) => responder(() => hilo.nodos(c)),
    nodo: (c, id) => responder(() => hilo.nodo(c, id)),
    crearNodo: (c, nuevo) => responder(() => hilo.crear(c, nuevo)),
    guardarNodo: (c, id, cambios) => responder(() => hilo.guardar(c, id, cambios)),
    aprobarNodo: (c, id, leida) => responder(() => hilo.aprobar(c, id, leida)),
    dependientes: (c, id) => responder(() => hilo.dependientes(c, id)),
    avisos: (c) => responder(() => hilo.avisos(c)),
    calcOutbound: (e) =>
      responder(() => {
        const r = calcularOutbound(e)
        if (!r) throw new Error('Con esa conversión no se alcanza la meta: sube la conversión o baja la probabilidad.')
        return r
      }, 0),
    calcInbound: (e) =>
      responder(() => {
        const r = calcularInbound(e)
        if (!r) throw new Error('Revisa las tasas del embudo: deben ir de 0 a 100 %.')
        return r
      }, 0),
    calibrar: () =>
      responder(
        () => ({
          desde: 'Zernio · últimos 30 días (ejemplo)',
          muestra: '6 reels · 41,300 impresiones',
          tasas: { ctr: 0.009, engagement: 0.052, cpm: 3.8 },
        }),
        400,
      ),
  }
}
