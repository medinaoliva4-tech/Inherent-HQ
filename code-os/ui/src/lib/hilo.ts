/**
 * El hilo: la memoria viva del cliente (diseño de departamentos §4).
 * Cada dato importante es un nodo con id estable y enlaces `viene_de`. La forma exacta final vive en
 * `code-os/docs/herramientas-api.md` (PR hermano); esto es lo acordado y lo que implementa el mock.
 */

export type TipoNodo =
  | 'producto'
  | 'icp'
  | 'adquisicion'
  | 'dolor'
  | 'deseo'
  | 'historia'
  | 'pilar'
  | 'angulo'
  | 'idea'
  | 'referente'
  | 'campana'
  | 'pieza'
  | 'pre'
  | 'decision'
export type EstadoNodo = 'hipotesis' | 'aprobado'

export type Nodo = {
  id: string
  cliente: string
  tipo: TipoNodo
  titulo: string
  /** Lo que guarda la herramienta (formulario, tabla, texto). `decide` = qué decide este nodo, en una línea. */
  contenido: Record<string, unknown>
  estado: EstadoNodo
  /** Enlace a la evidencia o «hipótesis». */
  fuente: string
  viene_de: string[]
  version: number
  actualizado: string
}

export type NodoNuevo = Pick<Nodo, 'tipo' | 'titulo'> & Partial<Pick<Nodo, 'contenido' | 'fuente' | 'viene_de'>>

/** Cliente de Inherent (la marca), no confundir con `Cliente` (el cliente de datos de la interfaz). */
export type Marca = { id: string; nombre: string; industria?: string; nivel?: string }

/** Cambió un nodo y esto depende de él. */
export type Aviso = {
  id: string
  cliente: string
  /** Nodo que cambió. */
  nodo: string
  version: number
  /** Nodos (y trabajos) que dependen de él y hay que revisar. */
  afectados: string[]
  mensaje: string
  creado: string
}

export type Area = 'strategy' | 'creative' | 'production' | 'diseno'
export const AREAS: Record<Area, { nombre: string; corto: string; color: string }> = {
  strategy: { nombre: 'Strategy', corto: 'Strategy', color: 'var(--area-strategy)' },
  creative: { nombre: 'Marketing y Creative', corto: 'Creative', color: 'var(--area-creative)' },
  production: { nombre: 'Production', corto: 'Production', color: 'var(--area-production)' },
  diseno: { nombre: 'Diseño gráfico', corto: 'Diseño', color: 'var(--area-diseno)' },
}

export const TIPOS: Record<TipoNodo, { nombre: string; area: Area }> = {
  producto: { nombre: 'producto', area: 'strategy' },
  icp: { nombre: 'perfil del cliente ideal', area: 'strategy' },
  adquisicion: { nombre: 'adquisición', area: 'strategy' },
  dolor: { nombre: 'dolor', area: 'strategy' },
  deseo: { nombre: 'deseo', area: 'strategy' },
  historia: { nombre: 'historia', area: 'strategy' },
  pilar: { nombre: 'pilar', area: 'creative' },
  angulo: { nombre: 'ángulo', area: 'creative' },
  idea: { nombre: 'idea', area: 'creative' },
  referente: { nombre: 'referente', area: 'creative' },
  campana: { nombre: 'campaña', area: 'creative' },
  pieza: { nombre: 'pieza', area: 'production' },
  pre: { nombre: 'pre-producción', area: 'production' },
  decision: { nombre: 'decisión', area: 'strategy' },
}

export const areaDe = (n: Pick<Nodo, 'tipo'>): Area => TIPOS[n.tipo]?.area ?? 'strategy'

/** Número del nodo dentro de su tipo (por orden de creación en la lista): «dolor #2». */
export function numeroDe(n: Nodo, todos: Nodo[]): number {
  const mismos = todos.filter((x) => x.tipo === n.tipo)
  const i = mismos.findIndex((x) => x.id === n.id)
  return i < 0 ? mismos.length + 1 : i + 1
}

const UNICOS: TipoNodo[] = ['producto', 'icp', 'adquisicion', 'historia', 'pre']

/** «dolor #2» o «perfil del cliente ideal» (los únicos por cliente no llevan número). */
export function etiquetaNodo(n: Nodo, todos: Nodo[]): string {
  const t = TIPOS[n.tipo]?.nombre ?? n.tipo
  return UNICOS.includes(n.tipo) ? t : `${t} #${numeroDe(n, todos)}`
}

/** «viene de Strategy: dolor #2» (con el primer origen; si hay más, «+N»). */
export function origenDe(n: Pick<Nodo, 'viene_de'>, todos: Nodo[]): string | null {
  const padres = n.viene_de.map((id) => todos.find((x) => x.id === id)).filter((x): x is Nodo => !!x)
  if (!padres.length) return null
  const p = padres[0]
  const extra = padres.length > 1 ? ` +${padres.length - 1}` : ''
  return `viene de ${AREAS[areaDe(p)].corto}: ${etiquetaNodo(p, todos)}${extra}`
}

/** Todo lo que depende (directa o indirectamente) de `id`, sin repetir y sin ciclos. */
export function dependientesDe(id: string, todos: Nodo[]): Nodo[] {
  const out: Nodo[] = []
  const vistos = new Set([id])
  const cola = [id]
  while (cola.length) {
    const actual = cola.shift()!
    for (const n of todos) {
      if (!vistos.has(n.id) && n.viene_de.includes(actual)) {
        vistos.add(n.id)
        out.push(n)
        cola.push(n.id)
      }
    }
  }
  return out
}

/** Todo de lo que `id` viene (sus ancestros). */
export function ancestrosDe(id: string, todos: Nodo[]): Nodo[] {
  const porId = new Map(todos.map((n) => [n.id, n]))
  const out: Nodo[] = []
  const vistos = new Set([id])
  const cola = [...(porId.get(id)?.viene_de ?? [])]
  while (cola.length) {
    const x = cola.shift()!
    if (vistos.has(x)) continue
    vistos.add(x)
    const n = porId.get(x)
    if (n) {
      out.push(n)
      cola.push(...n.viene_de)
    }
  }
  return out
}

/** Llave de «ya lo leíste»: se lee una VERSIÓN; si el nodo cambia, hay que volver a abrirlo (regla F4.5). */
export const llaveLeido = (n: Pick<Nodo, 'id' | 'version'>) => `${n.id}@${n.version}`

/** Avisos que tocan a este nodo (porque cambió algo de lo que viene). */
export const avisosDe = (id: string, avisos: Aviso[]) => avisos.filter((a) => a.afectados.includes(id))

/** Lo que un agente deja en el chat: ```nodo {"id"} ``` (un dato que ya existe) o ```nodo {"tipo","titulo",…} ``` (una propuesta). */
export type RefNodo = { id: string } | NodoNuevo
export function extraerNodos(texto: string): RefNodo[] {
  const out: RefNodo[] = []
  const re = /```nodo[^\n]*\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(texto))) {
    try {
      const j = JSON.parse(m[1]) as Record<string, unknown>
      if (typeof j.id === 'string') out.push({ id: j.id })
      else if (typeof j.tipo === 'string' && j.tipo in TIPOS && typeof j.titulo === 'string')
        out.push({
          tipo: j.tipo as TipoNodo,
          titulo: j.titulo,
          contenido: j.contenido && typeof j.contenido === 'object' ? (j.contenido as Record<string, unknown>) : undefined,
          fuente: typeof j.fuente === 'string' ? j.fuente : undefined,
          viene_de: Array.isArray(j.viene_de) ? j.viene_de.filter((x): x is string => typeof x === 'string') : undefined,
        })
    } catch {
      /* bloque a medias o mal formado: no se pinta */
    }
  }
  return out
}

/** Qué decide el nodo, en una línea (si la herramienta no lo dejó, se usa un resumen corto del contenido). */
export function decideDe(n: Nodo): string {
  const d = n.contenido?.decide
  if (typeof d === 'string' && d.trim()) return d.trim()
  const t = n.contenido?.texto
  if (typeof t === 'string' && t.trim()) return t.trim().split('\n')[0].slice(0, 140)
  return ''
}
