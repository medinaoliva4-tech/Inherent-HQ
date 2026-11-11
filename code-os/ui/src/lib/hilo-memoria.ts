import { avisosEjemplo, marcasEjemplo, nodosEjemplo, nodosNorte } from '@/data/departamentos'
import type { CambiosNodo } from './cliente'
import { AREAS, areaDe, dependientesDe, etiquetaNodo, type Aviso, type Marca, type Nodo, type NodoNuevo } from './hilo'

/** Error con código HTTP (para que el mock responda igual que el servidor). */
export class ErrorHilo extends Error {
  estado: number
  constructor(estado: number, mensaje: string) {
    super(mensaje)
    this.estado = estado
  }
}

type Datos = { nodos: Nodo[]; avisos: Aviso[]; n: number }
const CLAVE = 'code-os:hilo:mock:v1'

/**
 * El hilo en memoria (modo mock): implementa las reglas acordadas para que la interfaz se comporte
 * igual que con el backend: guardar sube la versión, vuelve a hipótesis y avisa a los dependientes;
 * aprobar exige haber abierto esa versión.
 */
export function crearHiloMemoria({ persistir = true }: { persistir?: boolean } = {}) {
  const semilla = (): Datos => {
    const nodos = [...nodosEjemplo(), ...nodosNorte()]
    return { nodos, avisos: avisosEjemplo(nodos, (id) => dependientesDe(id, nodos).map((x) => x.id)), n: 1 }
  }
  let d: Datos = semilla()
  if (persistir) {
    try {
      const g = localStorage.getItem(CLAVE)
      if (g) {
        const x = JSON.parse(g) as Datos
        if (Array.isArray(x.nodos) && Array.isArray(x.avisos)) d = x
      }
    } catch {
      /* sin almacenamiento */
    }
  }
  const guardar = () => {
    if (!persistir) return
    try {
      localStorage.setItem(CLAVE, JSON.stringify(d))
    } catch {
      /* lleno o sin almacenamiento */
    }
  }
  const delCliente = (c: string) => d.nodos.filter((x) => x.cliente === c)
  const buscar = (c: string, id: string) => {
    const x = d.nodos.find((y) => y.cliente === c && y.id === id)
    if (!x) throw new ErrorHilo(404, `No existe el nodo ${id}`)
    return x
  }
  /** Lo revisado deja de estar en los avisos; un aviso sin afectados se va. */
  const revisado = (id: string) => {
    d.avisos = d.avisos.map((a) => ({ ...a, afectados: a.afectados.filter((x) => x !== id) })).filter((a) => a.afectados.length > 0)
  }
  const reemplazar = (x: Nodo) => {
    d.nodos = d.nodos.map((y) => (y.id === x.id && y.cliente === x.cliente ? x : y))
  }

  return {
    clientes(): Marca[] {
      return marcasEjemplo
    },
    nodos(c: string): Nodo[] {
      return delCliente(c)
    },
    nodo(c: string, id: string): Nodo {
      return buscar(c, id)
    },
    crear(c: string, nuevo: NodoNuevo): Nodo {
      if (!marcasEjemplo.some((m) => m.id === c)) throw new ErrorHilo(404, `No existe el cliente ${c}`)
      const x: Nodo = {
        id: `${c.slice(0, 2)}-${nuevo.tipo}-${Date.now().toString(36)}${(d.n++).toString(36)}`,
        cliente: c,
        tipo: nuevo.tipo,
        titulo: nuevo.titulo.trim() || 'Sin título',
        contenido: nuevo.contenido ?? {},
        estado: 'hipotesis',
        fuente: nuevo.fuente?.trim() || 'hipótesis',
        viene_de: (nuevo.viene_de ?? []).filter((id) => d.nodos.some((y) => y.id === id)),
        version: 1,
        actualizado: new Date().toISOString(),
      }
      d.nodos.push(x)
      guardar()
      return x
    },
    guardar(c: string, id: string, cambios: CambiosNodo): Nodo {
      const antes = buscar(c, id)
      const x: Nodo = { ...antes, ...cambios, version: antes.version + 1, estado: 'hipotesis', actualizado: new Date().toISOString() }
      reemplazar(x)
      revisado(id)
      const afectados = dependientesDe(id, delCliente(c)).map((y) => y.id)
      if (afectados.length) {
        d.avisos = d.avisos.filter((a) => a.nodo !== id)
        d.avisos.push({
          id: `av-${Date.now().toString(36)}${(d.n++).toString(36)}`,
          cliente: c,
          nodo: id,
          version: x.version,
          afectados,
          mensaje: `${AREAS[areaDe(x)].corto} cambió «${etiquetaNodo(x, delCliente(c))}».`,
          creado: x.actualizado,
        })
      }
      guardar()
      return x
    },
    aprobar(c: string, id: string, leida: { version: number }): Nodo {
      const antes = buscar(c, id)
      if (!leida || leida.version !== antes.version) throw new ErrorHilo(409, 'Abre el contenido (la versión actual) antes de aprobar.')
      const x: Nodo = { ...antes, estado: 'aprobado', actualizado: new Date().toISOString() }
      reemplazar(x)
      revisado(id)
      guardar()
      return x
    },
    dependientes(c: string, id: string): Nodo[] {
      buscar(c, id)
      return dependientesDe(id, delCliente(c))
    },
    avisos(c: string): Aviso[] {
      return d.avisos.filter((a) => a.cliente === c)
    },
    /** Solo pruebas: vuelve a la semilla. */
    reiniciar() {
      d = semilla()
      guardar()
    },
  }
}
export type HiloMemoria = ReturnType<typeof crearHiloMemoria>
