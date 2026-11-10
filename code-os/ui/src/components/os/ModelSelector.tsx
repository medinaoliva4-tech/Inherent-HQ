import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { buscarModelo, niveles } from '@/data/ejemplo'
import { cn } from '@/lib/utils'

type Props = { modeloId: string; onChange: (id: string) => void }

/** Selector por nivel: Alto / Medio / Bajo, con los modelos de cada nivel dentro. */
export function ModelSelector({ modeloId, onChange }: Props) {
  const [abierto, setAbierto] = useState(false)
  const { nivel, modelo } = buscarModelo(modeloId)
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        aria-label="Elegir modelo"
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="font-medium text-foreground">{nivel.nombre}</span>
        <span aria-hidden>·</span>
        <span>{modelo.nombre}</span>
        <ChevronDownIcon className={cn('size-3.5 transition-transform duration-200', abierto && 'rotate-180')} />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="vidrio w-80 gap-1 rounded-xl p-1.5">
        {niveles.map((n) => (
          <div key={n.id} role="group" aria-label={`Nivel ${n.nombre}`} className="p-1">
            <div className="flex items-baseline justify-between px-2 pt-1 pb-1">
              <span className="text-xs font-semibold tracking-wide uppercase">{n.nombre}</span>
              <span className="text-[11px] text-muted-foreground">{n.descripcion}</span>
            </div>
            {n.modelos.map((m) => {
              const activo = m.id === modeloId
              return (
                <button
                  key={m.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={activo}
                  onClick={() => {
                    onChange(m.id)
                    setAbierto(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none active:scale-[0.99]"
                >
                  <span className="flex-1">
                    {m.nombre}
                    <span className="ml-2 text-xs text-muted-foreground">{m.nota}</span>
                  </span>
                  {activo && <CheckIcon className="size-4" />}
                </button>
              )
            })}
          </div>
        ))}
        <p className="px-3 pt-1 pb-1.5 text-[11px] text-muted-foreground">Datos de ejemplo. El catálogo real llega del puente.</p>
      </PopoverContent>
    </Popover>
  )
}
