import type { Adjunto, Evento, ModoSesion, RespuestaPermiso } from './eventos'

export type ParteTexto = { tipo: 'texto'; id: string; texto: string }
export type ParteRazonamiento = { tipo: 'razonamiento'; id: string; texto: string; cerrado: boolean }
export type ParteHerramienta = {
  tipo: 'herramienta'
  id: string
  nombre: string
  entrada: Record<string, unknown>
  estado: 'ejecutando' | 'listo' | 'error'
  salida?: unknown
  error?: string
  /** Solo en Task/Agent: lo que hizo el subagente (sus herramientas y su texto). */
  hijos?: ParteHerramienta[]
  textoHijo?: string
}
export type PartePermiso = {
  tipo: 'permiso'
  id: string
  herramienta: string
  descripcion: string
  entrada: Record<string, unknown>
  respuesta?: RespuestaPermiso
  /** Lo aprobó solo el modo «Aceptar ediciones». */
  auto?: boolean
}
export type OpcionPregunta = { label: string; description?: string }
export type Pregunta = { question: string; header?: string; options: OpcionPregunta[]; multiSelect?: boolean }
/** AskUserQuestion: Claude pregunta con opciones. */
export type PartePregunta = {
  tipo: 'pregunta'
  id: string
  preguntas: Pregunta[]
  respuestas?: Record<string, string>
  omitida?: boolean
}
/** ExitPlanMode: Claude propone un plan y espera tu visto bueno. */
export type PartePlan = { tipo: 'plan'; id: string; plan: string; decision?: 'aprobado' | 'cambios'; comentario?: string }
export type ParteModo = { tipo: 'modo'; id: string; modo: ModoSesion }
export type Parte = ParteTexto | ParteRazonamiento | ParteHerramienta | PartePermiso | PartePregunta | PartePlan | ParteModo

export type Uso = { modelo: string; tokens_entrada: number; tokens_salida: number; tokens_cache?: number }

export type Mensaje = {
  id: string
  rol: 'usuario' | 'asistente'
  partes: Parte[]
  adjuntos?: Adjunto[]
  uso?: Uso
  error?: string
  /** true mientras llegan eventos */
  enCurso?: boolean
  detenido?: boolean
  duracionMs?: number
  /** Modo Auto: qué cocinero eligió el router y por qué («Sous chef · nivel-alto: interfaz»). */
  ruta?: { nombre: string; nivel: string; motivo: string; esfuerzo: string; claude?: string }
}

export type Tarea = { content: string; status: 'pending' | 'in_progress' | 'completed'; activeForm?: string }

const esSubagente = (nombre: string) => nombre === 'Task' || nombre === 'Agent'

/** Aplica `fn` a la herramienta con ese id, buscando también dentro de los subagentes. */
function tocarHerramienta(partes: Parte[], id: string, fn: (p: ParteHerramienta) => ParteHerramienta): Parte[] {
  return partes.map((p) => {
    if (p.tipo !== 'herramienta') return p
    if (p.id === id) return fn(p)
    if (p.hijos?.length) {
      const hijos = tocarHerramienta(p.hijos, id, fn) as ParteHerramienta[]
      return hijos === p.hijos ? p : { ...p, hijos }
    }
    return p
  })
}

function parsePreguntas(entrada: Record<string, unknown>): Pregunta[] {
  const qs = Array.isArray(entrada.questions) ? entrada.questions : []
  return qs
    .filter((q): q is Record<string, unknown> => !!q && typeof q === 'object')
    .map((q) => ({
      question: String(q.question ?? ''),
      header: typeof q.header === 'string' ? q.header : undefined,
      multiSelect: !!q.multiSelect,
      options: (Array.isArray(q.options) ? q.options : []).map((o: Record<string, unknown>) => ({
        label: String(o?.label ?? ''),
        description: typeof o?.description === 'string' ? o.description : undefined,
      })),
    }))
}

/** Aplica un evento del puente a un mensaje del asistente. Pura: devuelve un mensaje nuevo. */
export function aplicarEvento(m: Mensaje, e: Evento): Mensaje {
  switch (e.tipo) {
    case 'texto':
    case 'razonamiento': {
      if (e.padre) {
        // Texto de un subagente: se guarda dentro de su tarjeta, no en la conversación principal.
        if (e.tipo === 'razonamiento') return m
        return { ...m, partes: tocarHerramienta(m.partes, e.padre, (p) => ({ ...p, textoHijo: (p.textoHijo ?? '') + e.delta })) }
      }
      const partes = [...m.partes]
      const i = partes.findIndex((p) => p.tipo === e.tipo && p.id === e.id)
      if (i >= 0) {
        const p = partes[i] as ParteTexto | ParteRazonamiento
        partes[i] = { ...p, texto: p.texto + e.delta }
      } else if (e.tipo === 'texto') {
        partes.push({ tipo: 'texto', id: e.id, texto: e.delta })
      } else {
        partes.push({ tipo: 'razonamiento', id: e.id, texto: e.delta, cerrado: false })
      }
      return { ...m, partes: e.tipo === 'texto' ? cerrarRazonamiento(partes) : partes }
    }
    case 'herramienta_inicio': {
      const nueva: ParteHerramienta = { tipo: 'herramienta', id: e.id, nombre: e.nombre, entrada: e.entrada, estado: 'ejecutando' }
      if (esSubagente(e.nombre)) nueva.hijos = []
      if (e.padre) {
        let puesto = false
        const partes = tocarHerramienta(m.partes, e.padre, (p) => {
          puesto = true
          return { ...p, hijos: [...(p.hijos ?? []), nueva] }
        })
        if (puesto) return { ...m, partes }
      }
      return { ...m, partes: [...cerrarRazonamiento(m.partes), nueva] }
    }
    case 'herramienta_fin':
      return {
        ...m,
        partes: tocarHerramienta(m.partes, e.id, (p) => ({ ...p, estado: e.error ? 'error' : 'listo', salida: e.salida, error: e.error })),
      }
    case 'permiso_pedido': {
      const base = cerrarRazonamiento(m.partes)
      if (e.herramienta === 'AskUserQuestion') {
        return { ...m, partes: [...base, { tipo: 'pregunta', id: e.id, preguntas: parsePreguntas(e.entrada) }] }
      }
      if (e.herramienta === 'ExitPlanMode') {
        return { ...m, partes: [...base, { tipo: 'plan', id: e.id, plan: String(e.entrada.plan ?? '') }] }
      }
      return {
        ...m,
        partes: [...base, { tipo: 'permiso', id: e.id, herramienta: e.herramienta, descripcion: e.descripcion, entrada: e.entrada }],
      }
    }
    case 'uso':
      return {
        ...m,
        uso: { modelo: e.modelo, tokens_entrada: e.tokens_entrada, tokens_salida: e.tokens_salida, tokens_cache: e.tokens_cache },
      }
    case 'modo':
      return { ...m, partes: [...m.partes, { tipo: 'modo', id: `modo_${m.partes.length}`, modo: e.modo }] }
    case 'error':
      return { ...m, error: e.mensaje }
    case 'fin':
      return {
        ...m,
        enCurso: false,
        detenido: e.motivo === 'detenido',
        duracionMs: e.duracionMs ?? m.duracionMs,
        partes: cerrarRazonamiento(m.partes),
      }
  }
}

export function registrarRespuesta(m: Mensaje, id: string, r: RespuestaPermiso, auto = false): Mensaje {
  return {
    ...m,
    partes: m.partes.map((p) => (p.tipo === 'permiso' && p.id === id ? { ...p, respuesta: r, ...(auto ? { auto } : {}) } : p)),
  }
}

export function registrarPregunta(m: Mensaje, id: string, respuestas: Record<string, string> | null): Mensaje {
  return {
    ...m,
    partes: m.partes.map((p) =>
      p.tipo === 'pregunta' && p.id === id ? (respuestas ? { ...p, respuestas } : { ...p, omitida: true }) : p,
    ),
  }
}

export function registrarPlan(m: Mensaje, id: string, decision: 'aprobado' | 'cambios', comentario?: string): Mensaje {
  return { ...m, partes: m.partes.map((p) => (p.tipo === 'plan' && p.id === id ? { ...p, decision, comentario } : p)) }
}

function cerrarRazonamiento(partes: Parte[]): Parte[] {
  if (!partes.some((p) => p.tipo === 'razonamiento' && !p.cerrado)) return partes
  return partes.map((p) => (p.tipo === 'razonamiento' && !p.cerrado ? { ...p, cerrado: true } : p))
}

/** ¿Hay algo esperando tu respuesta (permiso, pregunta o plan)? Devuelve la primera parte pendiente. */
export function pendienteDe(mensajes: Mensaje[]): PartePermiso | PartePregunta | PartePlan | undefined {
  for (const m of mensajes) {
    for (const p of m.partes) {
      if (p.tipo === 'permiso' && !p.respuesta) return p
      if (p.tipo === 'pregunta' && !p.respuestas && !p.omitida) return p
      if (p.tipo === 'plan' && !p.decision) return p
    }
  }
  return undefined
}

/** La lista de tareas vigente: la última llamada a TodoWrite de la conversación. */
export function tareasDe(mensajes: Mensaje[]): Tarea[] {
  for (let i = mensajes.length - 1; i >= 0; i--) {
    const partes = mensajes[i].partes
    for (let j = partes.length - 1; j >= 0; j--) {
      const p = partes[j]
      if (p.tipo === 'herramienta' && p.nombre === 'TodoWrite' && Array.isArray(p.entrada.todos)) {
        return (p.entrada.todos as Tarea[]).filter((t) => t && typeof t.content === 'string')
      }
    }
  }
  return []
}

/** Todos los subagentes (Task/Agent) de la conversación, del más nuevo al más viejo. */
export function subagentesDe(mensajes: Mensaje[]): ParteHerramienta[] {
  const out: ParteHerramienta[] = []
  for (const m of mensajes) for (const p of m.partes) if (p.tipo === 'herramienta' && esSubagente(p.nombre)) out.push(p)
  return out.reverse()
}

/** Suma de tokens de la conversación (lo que muestra el medidor de contexto). */
export function usoTotal(mensajes: Mensaje[]) {
  let entrada = 0
  let salida = 0
  let ultimaEntrada = 0
  for (const m of mensajes) {
    if (!m.uso) continue
    entrada += m.uso.tokens_entrada
    salida += m.uso.tokens_salida
    ultimaEntrada = m.uso.tokens_entrada + (m.uso.tokens_cache ?? 0)
  }
  return { entrada, salida, ultimaEntrada }
}

/** Texto plano de un mensaje (búsqueda en el historial). */
export function textoDe(m: Mensaje): string {
  return m.partes
    .map((p) => (p.tipo === 'texto' ? p.texto : p.tipo === 'plan' ? p.plan : ''))
    .filter(Boolean)
    .join('\n')
}
