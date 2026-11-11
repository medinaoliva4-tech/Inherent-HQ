import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { NoDisponible, type CambiosNodo, type Cliente } from '@/lib/cliente'
import { llaveLeido, type Aviso, type Marca, type Nodo, type NodoNuevo } from '@/lib/hilo'

const CLAVE_LEIDOS = 'code-os:leidos:v1'
const CLAVE_VISTOS = 'code-os:avisos-vistos:v1'

const leerSet = (clave: string) => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(clave) ?? '[]'))
  } catch {
    return new Set<string>()
  }
}
const guardarSet = (clave: string, s: Set<string>) => {
  try {
    localStorage.setItem(clave, JSON.stringify([...s].slice(-500)))
  } catch {
    /* sin almacenamiento */
  }
}

export type ValorHilo = {
  cliente: Cliente
  clienteId: string
  marca?: Marca
  marcas: Marca[]
  nodos: Nodo[]
  /** Avisos sin descartar. */
  avisos: Aviso[]
  cargando: boolean
  /** Ruta que falta en el backend (NoDisponible). */
  falta: string | null
  error: string | null
  nodo: (id: string) => Nodo | undefined
  /** ¿Abriste la versión actual? (regla F4.5: sin abrir no se aprueba). */
  leido: (n: Pick<Nodo, 'id' | 'version'>) => boolean
  /** Abre el contenido (y lo marca leído). */
  abrir: (id: string) => void
  detalle: string | null
  cerrarDetalle: () => void
  aprobar: (n: Nodo) => Promise<void>
  guardar: (id: string, cambios: CambiosNodo) => Promise<Nodo | null>
  crear: (nuevo: NodoNuevo) => Promise<Nodo | null>
  descartarAviso: (id: string) => void
  elegirCliente: (id: string) => void
  recargar: () => void
}

const Contexto = createContext<ValorHilo | null>(null)

export function useHilo() {
  const v = useContext(Contexto)
  if (!v) throw new Error('useHilo va dentro de <HiloProvider>')
  return v
}
/** Para componentes que pueden vivir fuera del proveedor (p. ej. pruebas de mensajes sueltos). */
export const useHiloOpcional = () => useContext(Contexto)

export function HiloProvider({ cliente, clienteId, onClienteId, children }: { cliente: Cliente; clienteId: string; onClienteId: (id: string) => void; children: ReactNode }) {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [nodos, setNodos] = useState<Nodo[]>([])
  const [todosAvisos, setAvisos] = useState<Aviso[]>([])
  const [cargando, setCargando] = useState(true)
  const [falta, setFalta] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vuelta, setVuelta] = useState(0)
  const [leidos, setLeidos] = useState(() => leerSet(CLAVE_LEIDOS))
  const [vistos, setVistos] = useState(() => leerSet(CLAVE_VISTOS))
  const [detalle, setDetalle] = useState<string | null>(null)

  const fallo = useCallback((e: unknown) => {
    if (e instanceof NoDisponible) setFalta(e.que)
    else setError(e instanceof Error ? e.message : 'Algo falló')
  }, [])

  useEffect(() => {
    let vivo = true
    cliente
      .clientes()
      .then((m) => {
        if (!vivo) return
        setMarcas(m)
        if (m.length && !m.some((x) => x.id === clienteId)) onClienteId(m[0].id)
      })
      .catch((e) => vivo && fallo(e))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente])

  useEffect(() => {
    if (!clienteId) return
    let vivo = true
    setCargando(true)
    Promise.all([cliente.nodos(clienteId), cliente.avisos(clienteId)])
      .then(([n, a]) => {
        if (!vivo) return
        setNodos(n)
        setAvisos(a)
        setFalta(null)
        setError(null)
      })
      .catch((e) => vivo && fallo(e))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [cliente, clienteId, vuelta, fallo])

  const recargar = useCallback(() => setVuelta((v) => v + 1), [])
  const nodo = useCallback((id: string) => nodos.find((n) => n.id === id), [nodos])
  const leido = useCallback((n: Pick<Nodo, 'id' | 'version'>) => leidos.has(llaveLeido(n)), [leidos])

  const abrir = useCallback(
    (id: string) => {
      setDetalle(id)
      const n = nodos.find((x) => x.id === id)
      if (n) {
        setLeidos((s) => {
          if (s.has(llaveLeido(n))) return s
          const t = new Set(s).add(llaveLeido(n))
          guardarSet(CLAVE_LEIDOS, t)
          return t
        })
      }
    },
    [nodos],
  )

  const reemplazar = (x: Nodo) => setNodos((l) => (l.some((n) => n.id === x.id) ? l.map((n) => (n.id === x.id ? x : n)) : [...l, x]))

  const aprobar = useCallback(
    async (n: Nodo) => {
      if (!leidos.has(llaveLeido(n))) {
        toast.info('Abre el contenido antes de aprobar.')
        return
      }
      try {
        reemplazar(await cliente.aprobarNodo(clienteId, n.id, { version: n.version }))
        toast.success(`Aprobado: ${n.titulo}`)
        setAvisos(await cliente.avisos(clienteId))
      } catch (e) {
        toast.error(e instanceof NoDisponible ? `Falta en el backend: ${e.que}` : e instanceof Error ? e.message : 'No se pudo aprobar')
      }
    },
    [cliente, clienteId, leidos],
  )

  const guardar = useCallback(
    async (id: string, cambios: CambiosNodo) => {
      try {
        const x = await cliente.guardarNodo(clienteId, id, cambios)
        reemplazar(x)
        const a = await cliente.avisos(clienteId)
        setAvisos(a)
        const aviso = a.find((v) => v.nodo === id && v.version === x.version)
        toast.success(aviso ? `Guardado. Avisé a ${aviso.afectados.length} que dependen de esto.` : 'Guardado como hipótesis.')
        return x
      } catch (e) {
        toast.error(e instanceof NoDisponible ? `Falta en el backend: ${e.que}` : e instanceof Error ? e.message : 'No se pudo guardar')
        return null
      }
    },
    [cliente, clienteId],
  )

  const crear = useCallback(
    async (nuevo: NodoNuevo) => {
      try {
        const x = await cliente.crearNodo(clienteId, nuevo)
        reemplazar(x)
        toast.success(`Guardado como hipótesis: ${x.titulo}`)
        return x
      } catch (e) {
        toast.error(e instanceof NoDisponible ? `Falta en el backend: ${e.que}` : e instanceof Error ? e.message : 'No se pudo crear')
        return null
      }
    },
    [cliente, clienteId],
  )

  const descartarAviso = useCallback((id: string) => {
    setVistos((s) => {
      const t = new Set(s).add(id)
      guardarSet(CLAVE_VISTOS, t)
      return t
    })
  }, [])

  const avisos = useMemo(() => todosAvisos.filter((a) => !vistos.has(`${a.id}@${a.version}`) && !vistos.has(a.id)), [todosAvisos, vistos])

  const valor = useMemo<ValorHilo>(
    () => ({
      cliente,
      clienteId,
      marca: marcas.find((m) => m.id === clienteId),
      marcas,
      nodos,
      avisos,
      cargando,
      falta,
      error,
      nodo,
      leido,
      abrir,
      detalle,
      cerrarDetalle: () => setDetalle(null),
      aprobar,
      guardar,
      crear,
      descartarAviso,
      elegirCliente: onClienteId,
      recargar,
    }),
    [cliente, clienteId, marcas, nodos, avisos, cargando, falta, error, nodo, leido, abrir, detalle, aprobar, guardar, crear, descartarAviso, onClienteId, recargar],
  )
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
