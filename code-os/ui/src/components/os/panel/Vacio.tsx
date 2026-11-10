import type { LucideIcon } from 'lucide-react'
import { PlugZapIcon } from 'lucide-react'

/** Estado vacío del panel. `falta` = endpoint que el puente todavía no tiene. */
export function Vacio({ icono: Icono = PlugZapIcon, titulo, texto, falta }: { icono?: LucideIcon; titulo: string; texto?: string; falta?: string | null }) {
  return (
    <div className="grid h-full place-items-center p-6 text-center">
      <div className="grid max-w-72 justify-items-center gap-2">
        <span className="grid size-10 place-items-center rounded-xl bg-accent">
          <Icono className="size-5 text-muted-foreground" />
        </span>
        <p className="text-sm font-medium">{titulo}</p>
        {texto && <p className="text-xs text-muted-foreground">{texto}</p>}
        {falta && (
          <p className="text-xs text-muted-foreground">
            Falta en el puente: <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{falta}</code>
          </p>
        )}
      </div>
    </div>
  )
}
