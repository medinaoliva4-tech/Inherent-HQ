import { BellDotIcon, CheckIcon, CornerDownRightIcon, EyeIcon, SparklesIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useHilo } from '@/hooks/use-hilo'
import { AREAS, areaDe, avisosDe, decideDe, etiquetaNodo, origenDe, TIPOS, type Area, type Nodo, type NodoNuevo } from '@/lib/hilo'
import { cn } from '@/lib/utils'

/** Punto y nombre del área, con su color. */
export function ChipArea({ area, children, className }: { area: Area; children?: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground', className)}>
      <span className="size-2 shrink-0 rounded-full" style={{ background: AREAS[area].color }} aria-hidden />
      <span className="truncate">{children ?? AREAS[area].corto}</span>
    </span>
  )
}

export function EstadoNodo({ n }: { n: Pick<Nodo, 'estado' | 'version'> }) {
  return n.estado === 'aprobado' ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok/12 px-2 py-0.5 text-[11px] font-medium text-ok">
      <CheckIcon className="size-3" /> Aprobado
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full border border-warn/40 px-2 py-0.5 text-[11px] font-medium text-warn">Hipótesis</span>
  )
}

type Props = {
  /** Nodo que ya existe en el hilo… */
  nodo?: Nodo
  /** …o propuesta de un agente que aún no está guardada. */
  propuesta?: NodoNuevo
  /** Sin la línea de «decide» ni la fuente (listas largas). */
  compacta?: boolean
  className?: string
}

/**
 * La tarjeta de decisión: la vista de un nodo. Es la MISMA en el chat, en las herramientas y en el portal.
 * Aprobar se activa solo si abriste la versión actual (regla F4.5).
 */
export function TarjetaDecision({ nodo, propuesta, compacta, className }: Props) {
  const h = useHilo()
  const [creado, setCreado] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const n = nodo ?? (creado ? h.nodo(creado) : undefined)

  if (!n && propuesta) {
    const area = TIPOS[propuesta.tipo]?.area ?? 'strategy'
    const origen = origenDe({ viene_de: propuesta.viene_de ?? [] }, h.nodos)
    const decide = typeof propuesta.contenido?.decide === 'string' ? propuesta.contenido.decide : ''
    return (
      <article aria-label={`Propuesta: ${propuesta.titulo}`} className={cn('grid gap-2 rounded-xl border border-dashed bg-card/70 p-3', className)}>
        <div className="flex items-center gap-2">
          <ChipArea area={area}>
            {AREAS[area].corto} · {TIPOS[propuesta.tipo]?.nombre ?? propuesta.tipo} nuevo
          </ChipArea>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <SparklesIcon className="size-3" /> Propuesta del agente
          </span>
        </div>
        <p className="text-sm font-medium">{propuesta.titulo}</p>
        {origen && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CornerDownRightIcon className="size-3" /> {origen}
          </p>
        )}
        {decide && <p className="text-xs text-muted-foreground">Decide: {decide}</p>}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={guardando}
            onClick={async () => {
              setGuardando(true)
              const x = await h.crear(propuesta)
              setGuardando(false)
              if (x) setCreado(x.id)
            }}
          >
            Guardar como hipótesis
          </Button>
        </div>
      </article>
    )
  }
  if (!n) return <p className="rounded-xl border bg-card/70 p-3 text-xs text-muted-foreground">Este dato no está en el hilo de {h.marca?.nombre ?? 'este cliente'}.</p>

  const area = areaDe(n)
  const origen = origenDe(n, h.nodos)
  const decide = decideDe(n)
  const leido = h.leido(n)
  const avisos = avisosDe(n.id, h.avisos)
  return (
    <article aria-label={`Decisión: ${n.titulo}`} className={cn('grid gap-1.5 rounded-xl border bg-card p-3 shadow-[var(--ui-sh-1)]', className)}>
      <div className="flex items-center gap-2">
        <ChipArea area={area}>
          {AREAS[area].corto} · {etiquetaNodo(n, h.nodos)}
        </ChipArea>
        <span className="ml-auto flex items-center gap-1.5">
          {avisos.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warn/12 px-2 py-0.5 text-[11px] font-medium text-warn" title={avisos[0].mensaje}>
              <BellDotIcon className="size-3" /> Revisar
            </span>
          )}
          <EstadoNodo n={n} />
        </span>
      </div>
      <p className="text-sm font-medium text-balance">{n.titulo}</p>
      {origen && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CornerDownRightIcon className="size-3 shrink-0" /> <span className="truncate">{origen}</span>
        </p>
      )}
      {!compacta && decide && <p className="text-xs text-muted-foreground">Decide: {decide}</p>}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {!compacta && <span className="min-w-0 flex-1 truncate text-[11px] text-mut2">Fuente: {n.fuente} · v{n.version}</span>}
        <span className={cn('flex gap-1.5', compacta && 'ml-auto')}>
          <Button size="xs" variant="ghost" onClick={() => h.abrir(n.id)}>
            <EyeIcon /> Abrir
          </Button>
          {n.estado !== 'aprobado' && (
            <Button size="xs" variant={leido ? 'default' : 'outline'} disabled={!leido} onClick={() => h.aprobar(n)} title={leido ? 'Aprobar esta versión' : 'Abre el contenido para poder aprobar'}>
              {leido ? 'Aprobar' : 'Abre para aprobar'}
            </Button>
          )}
        </span>
      </div>
    </article>
  )
}
