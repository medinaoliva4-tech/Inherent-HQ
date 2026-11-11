import { FlameIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useHilo } from '@/hooks/use-hilo'
import type { Nodo } from '@/lib/hilo'
import { cn } from '@/lib/utils'
import { Cabecera, claseCampo, EstadoCarga } from './comun'

export type Winner = { titulo: string; vistas: number; patron: string; quemado: boolean }
const winnersDe = (n: Nodo): Winner[] => (Array.isArray(n.contenido?.winners) ? (n.contenido.winners as Winner[]) : [])
const vistas = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toLocaleString('es', { maximumFractionDigits: 1 })} M` : v >= 1000 ? `${Math.round(v / 1000)} k` : String(v))

/** Radar con sentido: referentes y sus winners; lo que ya todos hacen se marca «quemado». */
export function Radar() {
  const h = useHilo()
  const [ocultar, setOcultar] = useState(false)
  const [nuevo, setNuevo] = useState<{ cuenta: string; red: string } | null>(null)
  const refs = h.nodos.filter((n) => n.tipo === 'referente')
  const ranking = refs
    .flatMap((r) => winnersDe(r).map((w, i) => ({ r, w, i })))
    .filter((x) => !ocultar || !x.w.quemado)
    .sort((a, b) => b.w.vistas - a.w.vistas)

  const alternar = (r: Nodo, i: number) => {
    const winners = winnersDe(r).map((w, j) => (j === i ? { ...w, quemado: !w.quemado } : w))
    h.guardar(r.id, { contenido: { ...r.contenido, winners } })
  }

  return (
    <div className="grid gap-4">
      <Cabecera id="radar">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={ocultar} onCheckedChange={setOcultar} aria-label="Ocultar lo quemado" /> Ocultar lo quemado
        </label>
      </Cabecera>
      <EstadoCarga>
        <section aria-label="Winners" className="grid gap-2">
          <h3 className="text-sm font-medium">Winners por vistas</h3>
          <ol className="grid gap-1.5">
            {ranking.map(({ r, w, i }, pos) => (
              <li key={`${r.id}-${i}`} className={cn('flex items-center gap-3 rounded-xl border bg-card p-2.5 transition-opacity', w.quemado && 'opacity-60')}>
                <span className="w-5 text-center text-xs text-mut2 tabular-nums">{pos + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-sm', w.quemado && 'line-through decoration-muted-foreground/60')}>{w.titulo}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.titulo} · {String(r.contenido?.red ?? '')} · patrón: {w.patron}
                  </span>
                </span>
                <span className="text-sm font-medium tabular-nums">{vistas(w.vistas)}</span>
                <Button size="xs" variant={w.quemado ? 'secondary' : 'ghost'} aria-pressed={w.quemado} onClick={() => alternar(r, i)} title="Lo hacen todos: ya no sorprende">
                  <FlameIcon className={cn(w.quemado && 'text-warn')} /> {w.quemado ? 'Quemado' : 'Marcar quemado'}
                </Button>
              </li>
            ))}
            {!ranking.length && <li className="text-sm text-muted-foreground">Nada que mostrar.</li>}
          </ol>
        </section>
        <section aria-label="Referentes" className="grid gap-2">
          <h3 className="text-sm font-medium">
            Referentes <span className="text-mut2">· {refs.length}</span>
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {refs.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => h.abrir(r.id)} className="rounded-full border bg-card px-3 py-1 text-xs hover:bg-accent">
                  {r.titulo} <span className="text-muted-foreground">· {String(r.contenido?.red ?? '')}</span>
                </button>
              </li>
            ))}
          </ul>
          {nuevo ? (
            <form
              className="flex flex-wrap gap-1.5"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!nuevo.cuenta.trim()) return
                await h.crear({ tipo: 'referente', titulo: nuevo.cuenta, contenido: { red: nuevo.red, winners: [] } })
                setNuevo(null)
              }}
            >
              <input autoFocus aria-label="Cuenta" className={cn(claseCampo, 'w-auto flex-1')} placeholder="@cuenta" value={nuevo.cuenta} onChange={(e) => setNuevo({ ...nuevo, cuenta: e.target.value })} />
              <input aria-label="Red" className={cn(claseCampo, 'w-28')} placeholder="Instagram" value={nuevo.red} onChange={(e) => setNuevo({ ...nuevo, red: e.target.value })} />
              <Button type="submit" size="sm">
                Agregar
              </Button>
            </form>
          ) : (
            <Button size="xs" variant="ghost" className="justify-self-start text-muted-foreground" onClick={() => setNuevo({ cuenta: '', red: 'Instagram' })}>
              <PlusIcon /> Agregar referente
            </Button>
          )}
          <p className="text-[11px] text-mut2">El agente llena los winners al ver los videos en volumen (radar automático: pendiente del backend).</p>
        </section>
      </EstadoCarga>
    </div>
  )
}
