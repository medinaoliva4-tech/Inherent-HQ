import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { NoDisponible, type Cliente, type EstadoCuotas } from '@/lib/cliente'
import { avisosDe, cuandoReinicia } from '@/lib/cuotas'

const CADA_MS = 60_000

/** Lee `GET /cuotas` cada minuto y avisa una sola vez por ventana cuando algo pasa del 80%. */
export function useCuotas(cliente: Cliente) {
  const [estado, setEstado] = useState<EstadoCuotas | null>(null)
  const [error, setError] = useState<string | null>(null)
  const vistos = useRef(new Set<string>())

  useEffect(() => {
    let vivo = true
    const leer = async () => {
      try {
        const e = await cliente.cuotas()
        if (!vivo) return
        setEstado(e)
        setError(null)
        const avisos = avisosDe(e)
        // Si algo bajó del umbral, se olvida: si vuelve a cruzarlo, se avisa otra vez.
        for (const k of [...vistos.current]) if (!avisos.some((a) => a.clave === k)) vistos.current.delete(k)
        for (const a of avisos) {
          if (vistos.current.has(a.clave)) continue
          vistos.current.add(a.clave)
          const cuando = cuandoReinicia(a.reinicia_en)
          const opts = { id: a.clave, description: cuando ? `Se libera ${cuando}.` : undefined, duration: 8000 }
          if (a.nivel === 'agotado') toast.error(a.mensaje, opts)
          else toast.warning(a.mensaje, opts)
        }
      } catch (err) {
        if (!vivo) return
        if (err instanceof NoDisponible) {
          setError('El puente aún no expone las cuotas')
          clearInterval(t) // no tiene caso seguir preguntando
        } else setError(err instanceof Error ? err.message : 'No se pudieron leer las cuotas')
      }
    }
    const t = setInterval(leer, CADA_MS)
    leer()
    return () => {
      vivo = false
      clearInterval(t)
    }
  }, [cliente])

  return { estado, error }
}
