import type { EstadoCuotas, NivelCuota, ProveedorCuota, VentanaCuota } from './cliente'

/** Umbral del aviso: el mismo del medidor (code-os/cuotas/medidor.mjs). */
export const UMBRAL_AVISO = 0.8

const ORDEN: Record<NivelCuota, number> = { agotado: 3, aviso: 2, ok: 1, sin_tope: 0 }

/** Recalcula el nivel con el umbral del 80% por si el servidor no lo trae. */
export function nivelDe(w: VentanaCuota): NivelCuota {
  if (w.nivel === 'agotado') return 'agotado'
  if (w.pct === null) return w.nivel
  return w.pct >= 1 ? 'agotado' : w.pct >= UMBRAL_AVISO ? 'aviso' : 'ok'
}

/** La ventana más apretada de un proveedor. */
export function peorVentana(p: ProveedorCuota): [string, VentanaCuota] | null {
  const vs = Object.entries(p.ventanas)
  if (!vs.length) return null
  return vs.reduce((a, b) => {
    const na = ORDEN[nivelDe(a[1])]
    const nb = ORDEN[nivelDe(b[1])]
    if (nb !== na) return nb > na ? b : a
    return (b[1].pct ?? -1) > (a[1].pct ?? -1) ? b : a
  })
}

/** Lo que merece aviso (≥ 80% o agotado). La clave no cambia mientras siga igual: así no se repite el aviso. */
export function avisosDe(e: EstadoCuotas) {
  const out: { clave: string; nivel: 'aviso' | 'agotado'; mensaje: string; reinicia_en: string | null }[] = []
  for (const p of e.proveedores) {
    for (const [nombre, w] of Object.entries(p.ventanas)) {
      const n = nivelDe(w)
      if (n !== 'aviso' && n !== 'agotado') continue
      const pct = w.pct === null ? 'casi todo' : `${Math.round(w.pct * 100)}%`
      out.push({
        clave: `${p.id}:${nombre}:${n}`,
        nivel: n,
        mensaje: n === 'agotado' ? `${p.nombre} se quedó sin cupo en la ventana de ${ventanaLegible(nombre)}.` : `${p.nombre} va en ${pct} de su cupo de ${ventanaLegible(nombre)}.`,
        reinicia_en: w.reinicia_en,
      })
    }
  }
  return out
}

export function ventanaLegible(v: string) {
  return ({ '5h': '5 horas', semana: 'la semana', mes: 'el mes', dia: 'hoy' } as Record<string, string>)[v] ?? v
}

/** «en 1 h 14 min», «en 3 días»… */
export function cuandoReinicia(iso: string | null, ahora = Date.now()) {
  if (!iso) return null
  const min = Math.max(0, Math.round((Date.parse(iso) - ahora) / 60_000))
  if (min < 60) return `en ${min} min`
  const h = Math.floor(min / 60)
  if (h < 48) return `en ${h} h${min % 60 ? ` ${min % 60} min` : ''}`
  return `en ${Math.round(h / 24)} días`
}

/** El proveedor más apretado de todos (lo que muestra el medidor compacto). */
export function masApretado(e: EstadoCuotas) {
  let mejor: { p: ProveedorCuota; ventana: string; w: VentanaCuota } | null = null
  for (const p of e.proveedores) {
    const pv = peorVentana(p)
    if (!pv) continue
    const [ventana, w] = pv
    if (!mejor) {
      mejor = { p, ventana, w }
      continue
    }
    const a = ORDEN[nivelDe(mejor.w)]
    const b = ORDEN[nivelDe(w)]
    if (b > a || (b === a && (w.pct ?? -1) > (mejor.w.pct ?? -1))) mejor = { p, ventana, w }
  }
  return mejor
}
