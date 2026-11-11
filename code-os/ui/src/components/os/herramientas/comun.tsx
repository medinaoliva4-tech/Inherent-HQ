import type { ReactNode } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useHilo } from '@/hooks/use-hilo'
import { HERRAMIENTAS, type IdHerramienta } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { ChipArea } from '../hilo/TarjetaDecision'

/** Título de la herramienta: área, nombre, para qué cliente y una línea de ayuda. */
export function Cabecera({ id, children }: { id: IdHerramienta; children?: ReactNode }) {
  const h = useHilo()
  const t = HERRAMIENTAS[id]
  return (
    <header className="flex flex-wrap items-end gap-2">
      <div className="grid min-w-0 flex-1 gap-0.5">
        <ChipArea area={t.area} />
        <h2 className="text-base font-semibold tracking-tight">{t.nombre}</h2>
        <p className="text-xs text-muted-foreground">
          {t.ayuda} · {h.marca?.nombre ?? '…'}
        </p>
      </div>
      {children}
    </header>
  )
}

/** Campo con etiqueta arriba (formularios de las herramientas). */
export function Campo({ etiqueta, ayuda, children, className }: { etiqueta: string; ayuda?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('grid gap-1', className)}>
      <span className="text-xs font-medium text-muted-foreground">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-[11px] text-mut2">{ayuda}</span>}
    </label>
  )
}

export const claseCampo =
  'w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-mut2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

/** Si el backend no tiene la ruta o falló, lo dice (en vez de una pantalla en blanco). */
export function EstadoCarga({ children }: { children: ReactNode }) {
  const h = useHilo()
  if (h.falta) return <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Falta en el backend: {h.falta}</p>
  if (h.error) return <p className="rounded-xl border bg-card p-4 text-sm text-bad">{h.error}</p>
  if (h.cargando && !h.nodos.length) return <p className="p-4 text-sm text-muted-foreground">Cargando el hilo…</p>
  return <>{children}</>
}

/** Selector de una opción (siempre queda una elegida): ToggleGroup de shadcn con los segmentos pegados. */
export function Segmentado<T extends string | number>({ valor, opciones, onCambio, etiqueta }: { valor: T; opciones: { v: T; t: string }[]; onCambio: (v: T) => void; etiqueta: string }) {
  return (
    <ToggleGroup
      value={[String(valor)]}
      onValueChange={(v: string[]) => {
        const o = opciones.find((x) => String(x.v) === v[0])
        if (o) onCambio(o.v)
      }}
      variant="outline"
      size="sm"
      spacing={0}
      aria-label={etiqueta}
      className="flex-wrap"
    >
      {opciones.map((o) => (
        <ToggleGroupItem key={String(o.v)} value={String(o.v)} aria-label={o.t} className="tabular-nums">
          {o.t}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
