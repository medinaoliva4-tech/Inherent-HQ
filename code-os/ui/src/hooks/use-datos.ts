import { useCallback, useEffect, useState } from 'react'
import { NoDisponible } from '@/lib/cliente'

/** Carga algo asíncrono y distingue «falta en el puente» de un error de verdad. */
export function useDatos<T>(cargar: () => Promise<T>, deps: unknown[]) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [falta, setFalta] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [vuelta, setVuelta] = useState(0)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    cargar()
      .then((d) => {
        if (!vivo) return
        setDatos(d)
        setError(null)
        setFalta(null)
      })
      .catch((e) => {
        if (!vivo) return
        if (e instanceof NoDisponible) setFalta(e.que)
        else setError(e instanceof Error ? e.message : 'Algo falló')
      })
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, vuelta])

  const recargar = useCallback(() => setVuelta((v) => v + 1), [])
  return { datos, error, falta, cargando, recargar }
}
