import { Building2Icon, ChevronsUpDownIcon, UserRoundIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useHilo } from '@/hooks/use-hilo'
import { PERSONAS, ROLES, type Persona } from '@/lib/roles'
import { cn } from '@/lib/utils'

/** Cliente activo: de él salen el hilo, las herramientas y el contexto de los agentes. */
export function SelectorCliente({ className }: { className?: string }) {
  const h = useHilo()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Cliente: ${h.marca?.nombre ?? 'elegir'}`}
        className={cn('flex h-8 min-w-0 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[popup-open]:bg-accent', className)}
      >
        <Building2Icon className="size-3.5 shrink-0" />
        <span className="hidden max-w-44 truncate sm:inline">{h.marca?.nombre ?? (h.falta ? 'Sin clientes' : '…')}</span>
        <ChevronsUpDownIcon className="size-3 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Cliente</DropdownMenuLabel>
          {h.falta && <p className="px-2 py-1.5 text-xs text-muted-foreground">Falta en el backend: {h.falta}</p>}
          <DropdownMenuRadioGroup value={h.clienteId} onValueChange={(v) => h.marcas.some((m) => m.id === v) && cambiarCliente(v)}>
            {h.marcas.map((m) => (
              <DropdownMenuRadioItem key={m.id} value={m.id}>
                <span className="grid min-w-0">
                  <span className="truncate">{m.nombre}</span>
                  {m.industria && <span className="truncate text-[11px] text-muted-foreground">{m.industria}</span>}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  function cambiarCliente(id: string) {
    h.elegirCliente(id)
  }
}

/** Persona de demostración: el workspace (herramientas y agentes) se arma según su rol. */
export function SelectorPersona({ persona, onPersona }: { persona: Persona; onPersona: (p: Persona) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Ver como: ${persona.nombre}`} className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground data-[popup-open]:bg-sidebar-accent">
        <UserRoundIcon className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          Ver como: <span className="text-foreground">{ROLES[persona.rol].nombre}</span>
        </span>
        <ChevronsUpDownIcon className="size-3 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Rol de demostración · arma el workspace</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={persona.id} onValueChange={(v) => onPersona(PERSONAS.find((p) => p.id === v) ?? persona)}>
            {PERSONAS.map((p) => (
              <DropdownMenuRadioItem key={p.id} value={p.id}>
                {ROLES[p.rol].nombre}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
