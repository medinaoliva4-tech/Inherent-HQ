import { BotIcon, ListChecksIcon } from 'lucide-react'
import type { Mensaje } from '@/lib/mensajes'
import { subagentesDe, tareasDe } from '@/lib/mensajes'
import { ListaTareas, TarjetaSubagente } from '../Mensajes'
import { Vacio } from './Vacio'

/** Lista de tareas (TodoWrite) y subagentes de la conversación. */
export function Tareas({ mensajes }: { mensajes: Mensaje[] }) {
  const tareas = tareasDe(mensajes)
  const subs = subagentesDe(mensajes)
  if (!tareas.length && !subs.length) return <Vacio icono={ListChecksIcon} titulo="Sin tareas todavía" texto="Cuando Claude arme una lista de pasos o lance subagentes, los ves aquí." />
  const hechas = tareas.filter((t) => t.status === 'completed').length
  return (
    <div className="grid gap-5 p-3">
      {tareas.length > 0 && (
        <section aria-label="Lista de tareas">
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tareas</h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {hechas}/{tareas.length}
            </span>
          </header>
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-ok transition-[width] duration-500 ease-[var(--e-spring)]" style={{ width: `${(hechas / tareas.length) * 100}%` }} />
          </div>
          <ListaTareas tareas={tareas} />
        </section>
      )}
      {subs.length > 0 && (
        <section aria-label="Subagentes">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <BotIcon className="size-3.5" /> Subagentes
          </h3>
          {subs.map((s) => (
            <TarjetaSubagente key={s.id} p={s} />
          ))}
        </section>
      )}
    </div>
  )
}
