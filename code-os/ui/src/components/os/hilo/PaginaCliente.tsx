import { BellDotIcon, CheckIcon, GitForkIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useHilo } from '@/hooks/use-hilo'
import { AREAS, ancestrosDe, areaDe, dependientesDe, etiquetaNodo, type Area, type Aviso, type Nodo } from '@/lib/hilo'
import { resorte } from '@/lib/movimiento'
import { cn } from '@/lib/utils'
import { ChipArea, TarjetaDecision } from './TarjetaDecision'

const COLUMNAS: { area: Area[]; titulo: string }[] = [
  { area: ['strategy'], titulo: AREAS.strategy.nombre },
  { area: ['creative'], titulo: AREAS.creative.nombre },
  { area: ['production', 'diseno'], titulo: AREAS.production.nombre },
]

function AvisoVista({ a, onVer }: { a: Aviso; onVer: (id: string) => void }) {
  const h = useHilo()
  const afectados = a.afectados.map((id) => h.nodo(id)).filter((x): x is Nodo => !!x)
  return (
    <motion.li layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={resorte} className="grid gap-2 rounded-xl border border-warn/30 bg-warn/8 p-3">
      <p className="flex items-start gap-2 text-sm">
        <BellDotIcon className="mt-0.5 size-4 shrink-0 text-warn" />
        <span>
          {a.mensaje} <span className="text-muted-foreground">Afecta {afectados.length}: </span>
          <span className="text-muted-foreground">{afectados.slice(0, 4).map((n) => etiquetaNodo(n, h.nodos)).join(', ')}{afectados.length > 4 ? '…' : ''}</span>
        </span>
      </p>
      <div className="flex justify-end gap-1.5">
        <Button size="xs" variant="ghost" onClick={() => h.descartarAviso(a.id)}>
          <CheckIcon /> Ya lo revisé
        </Button>
        <Button size="xs" variant="outline" onClick={() => onVer(a.nodo)}>
          <GitForkIcon /> Ver en el hilo
        </Button>
      </div>
    </motion.li>
  )
}

/** Hilo: qué depende de qué. Al elegir un nodo se iluminan su origen y lo que depende de él. */
export function VistaHilo({ seleccion, onSeleccion }: { seleccion: string | null; onSeleccion: (id: string | null) => void }) {
  const h = useHilo()
  const rel = useMemo(() => {
    if (!seleccion) return null
    return { arriba: new Set(ancestrosDe(seleccion, h.nodos).map((n) => n.id)), abajo: new Set(dependientesDe(seleccion, h.nodos).map((n) => n.id)) }
  }, [seleccion, h.nodos])
  const elegido = seleccion ? h.nodo(seleccion) : undefined
  const conAviso = new Set(h.avisos.flatMap((a) => a.afectados))

  return (
    <section aria-label="Hilo del cliente" className="grid gap-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">El hilo</h3>
        <p className="flex-1 text-xs text-muted-foreground">{seleccion ? 'Arriba lo que lo origina; abajo lo que depende de él.' : 'Toca un dato para ver de dónde viene y qué depende de él.'}</p>
        {seleccion && (
          <Button size="icon-xs" variant="ghost" onClick={() => onSeleccion(null)} aria-label="Quitar selección">
            <XIcon />
          </Button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {elegido && (
          <motion.div key={elegido.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={resorte}>
            <TarjetaDecision nodo={elegido} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid gap-3 @lg:grid-cols-3">
        {COLUMNAS.map((c) => {
          const lista = h.nodos.filter((n) => c.area.includes(areaDe(n)))
          return (
            <div key={c.titulo} className="grid content-start gap-1.5">
              <ChipArea area={c.area[0]} className="px-1 text-xs">
                {c.titulo} <span className="text-mut2">· {lista.length}</span>
              </ChipArea>
              <ul className="grid gap-1">
                {lista.map((n) => {
                  const es = n.id === seleccion
                  const arriba = rel?.arriba.has(n.id)
                  const abajo = rel?.abajo.has(n.id)
                  const apagado = rel && !es && !arriba && !abajo
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        aria-pressed={es}
                        onClick={() => onSeleccion(es ? null : n.id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-[opacity,background-color,transform] duration-200 active:scale-[0.98]',
                          es ? 'border-foreground/40 bg-accent' : 'bg-card hover:bg-accent/60',
                          apagado && 'opacity-35',
                          arriba && 'border-dashed',
                        )}
                      >
                        <span className="size-1.5 shrink-0 rounded-full" style={{ background: n.estado === 'aprobado' ? 'var(--ui-ok)' : 'var(--ui-warn)' }} aria-label={n.estado === 'aprobado' ? 'aprobado' : 'hipótesis'} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] text-muted-foreground">
                            {arriba ? '↑ ' : abajo ? '↓ ' : ''}
                            {etiquetaNodo(n, h.nodos)}
                          </span>
                          <span className="block truncate">{n.titulo}</span>
                        </span>
                        {conAviso.has(n.id) && <BellDotIcon className="size-3 shrink-0 text-warn" aria-label="Cambió algo de lo que viene" />}
                      </button>
                    </li>
                  )
                })}
                {!lista.length && <li className="px-1 text-xs text-mut2">Nada todavía.</li>}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** Páginas del cliente: resumen, avisos y el hilo. */
export function PaginaCliente() {
  const h = useHilo()
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const aprobados = h.nodos.filter((n) => n.estado === 'aprobado').length

  if (h.falta) return <p className="p-4 text-sm text-muted-foreground">Falta en el backend: {h.falta}</p>
  if (h.error) return <p className="p-4 text-sm text-bad">{h.error}</p>
  return (
    <div className="grid gap-4 p-4">
      <header className="grid gap-1">
        <p className="text-xs text-muted-foreground">
          {h.marca?.industria ?? 'Cliente'}
          {h.marca?.nivel ? ` · ${h.marca.nivel}` : ''}
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-balance">{h.marca?.nombre ?? '…'}</h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {aprobados} aprobados · {h.nodos.length - aprobados} hipótesis{h.cliente.tipo === 'mock' ? ' · datos de ejemplo' : ''}
        </p>
      </header>
      {h.avisos.length > 0 && (
        <section aria-label="Avisos" className="grid gap-2">
          <h3 className="text-sm font-medium">Cambió algo de lo que dependes</h3>
          <ul className="grid gap-2">
            <AnimatePresence initial={false}>
              {h.avisos.map((a) => (
                <AvisoVista key={a.id} a={a} onVer={setSeleccion} />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}
      <VistaHilo seleccion={seleccion} onSeleccion={setSeleccion} />
    </div>
  )
}
