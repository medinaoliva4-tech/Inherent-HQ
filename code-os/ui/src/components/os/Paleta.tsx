import { useEffect } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { niveles } from '@/data/ejemplo'
import { pestanas, type PestanaPanel } from './PanelLateral'

type Props = {
  abierta: boolean
  onAbierta: (v: boolean) => void
  onNueva: () => void
  onTema: () => void
  onPanel: (p?: PestanaPanel) => void
  onModelo: (id: string) => void
}

export function Paleta({ abierta, onAbierta, onNueva, onTema, onPanel, onModelo }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onAbierta(!abierta)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [abierta, onAbierta])

  const ejecutar = (fn: () => void) => () => {
    onAbierta(false)
    fn()
  }
  return (
    <CommandDialog open={abierta} onOpenChange={onAbierta} title="Paleta de comandos" description="Busca una acción">
      <CommandInput placeholder="Escribe un comando…" />
      <CommandList>
        <CommandEmpty>Nada con ese nombre.</CommandEmpty>
        <CommandGroup heading="General">
          <CommandItem onSelect={ejecutar(onNueva)}>Nueva conversación</CommandItem>
          <CommandItem onSelect={ejecutar(onTema)}>Cambiar tema claro / oscuro</CommandItem>
          <CommandItem onSelect={ejecutar(() => onPanel())}>
            Mostrar u ocultar panel lateral <CommandShortcut>⌘ J</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Panel">
          {pestanas.map((p) => (
            <CommandItem key={p.id} onSelect={ejecutar(() => onPanel(p.id))}>
              Abrir {p.nombre.toLowerCase()}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Modelo">
          {niveles.flatMap((n) =>
            n.modelos.map((m) => (
              <CommandItem key={m.id} value={`${n.nombre} ${m.nombre}`} onSelect={ejecutar(() => onModelo(m.id))}>
                {n.nombre} · {m.nombre}
              </CommandItem>
            )),
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
