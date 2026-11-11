import { CodeIcon, MessageSquareIcon } from 'lucide-react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/command'
import type { Conversacion } from '@/hooks/use-espacio'
import { teclas } from '@/hooks/use-atajos'
import { NIVELES } from '@/lib/niveles'
import type { SeccionAjustes } from './Ajustes'
import { HERRAMIENTAS, type IdHerramienta } from '@/lib/roles'
import { pestanasCodigo, type DestinoPanel } from './PanelLateral'

type Props = {
  abierta: boolean
  onAbierta: (v: boolean) => void
  pestana: 'chat' | 'code'
  conversaciones: Conversacion[]
  onConversacion: (id: string) => void
  onNueva: () => void
  onIncognito: () => void
  onPestana: (p: 'chat' | 'code') => void
  onTema: () => void
  onPanel: (d?: DestinoPanel) => void
  /** Herramientas del rol (en su orden). */
  herramientas: IdHerramienta[]
  onModelo: (id: string) => void
  onAjustes: (s?: SeccionAjustes) => void
  onModo: () => void
}

export function Paleta(p: Props) {
  const ejecutar = (fn: () => void) => () => {
    p.onAbierta(false)
    fn()
  }
  return (
    <CommandDialog open={p.abierta} onOpenChange={p.onAbierta} title="Paleta de comandos" description="Busca una acción o una conversación">
      <CommandInput placeholder="Escribe un comando o el nombre de un chat…" />
      <CommandList>
        <CommandEmpty>Nada con ese nombre.</CommandEmpty>
        <CommandGroup heading="General">
          <CommandItem onSelect={ejecutar(p.onNueva)}>
            {p.pestana === 'code' ? 'Nueva sesión' : 'Nuevo chat'} <CommandShortcut>{teclas('mod+n')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={ejecutar(p.onIncognito)}>Chat incógnito</CommandItem>
          <CommandItem onSelect={ejecutar(() => p.onPestana(p.pestana === 'chat' ? 'code' : 'chat'))}>Ir a {p.pestana === 'chat' ? 'Code' : 'Chat'}</CommandItem>
          {p.pestana === 'code' && (
            <CommandItem onSelect={ejecutar(p.onModo)}>
              Alternar Manual / Plan <CommandShortcut>{teclas('mod+shift+m')}</CommandShortcut>
            </CommandItem>
          )}
          <CommandItem onSelect={ejecutar(p.onTema)}>Cambiar tema claro / oscuro</CommandItem>
          <CommandItem onSelect={ejecutar(() => p.onPanel())}>
            Mostrar u ocultar panel <CommandShortcut>{teclas('mod+j')}</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Panel">
          <CommandItem onSelect={ejecutar(() => p.onPanel({ seccion: 'cliente' }))}>Abrir el cliente y el hilo</CommandItem>
          <CommandItem onSelect={ejecutar(() => p.onPanel({ seccion: 'agentes' }))}>Abrir el portal de agentes</CommandItem>
          {p.herramientas.map((h) => (
            <CommandItem key={h} onSelect={ejecutar(() => p.onPanel({ seccion: 'herramientas', herramienta: h }))}>
              Abrir {HERRAMIENTAS[h].nombre.toLowerCase()}
            </CommandItem>
          ))}
          {p.pestana === 'code' &&
            pestanasCodigo.map((x) => (
              <CommandItem key={x.id} onSelect={ejecutar(() => p.onPanel({ seccion: 'codigo', pestana: x.id }))}>
                Abrir {x.nombre.toLowerCase()}
              </CommandItem>
            ))}
        </CommandGroup>
        <CommandGroup heading="Ajustes">
          <CommandItem onSelect={ejecutar(() => p.onAjustes('uso'))}>Uso y cuotas</CommandItem>
          <CommandItem onSelect={ejecutar(() => p.onAjustes('memoria'))}>Memoria</CommandItem>
          <CommandItem onSelect={ejecutar(() => p.onAjustes('mcp'))}>Conectores (MCP)</CommandItem>
          <CommandItem onSelect={ejecutar(() => p.onAjustes('skills'))}>Skills</CommandItem>
          <CommandItem onSelect={ejecutar(() => p.onAjustes('atajos'))}>
            Atajos de teclado <CommandShortcut>{teclas('mod+/')}</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Modelo">
          {NIVELES.flatMap((n) => [
            <CommandItem key={n.alias} value={`${n.nombre} automático ${n.alias}`} onSelect={ejecutar(() => p.onModelo(n.alias))}>
              {n.nombre} · Automático
            </CommandItem>,
            ...n.modelos.map((m) => (
              <CommandItem key={m.id} value={`${n.nombre} ${m.nombre} ${m.id}`} onSelect={ejecutar(() => p.onModelo(m.id))}>
                {n.nombre} · {m.nombre}
              </CommandItem>
            )),
          ])}
        </CommandGroup>
        <CommandGroup heading="Conversaciones">
          {p.conversaciones
            .filter((c) => !c.archivada)
            .slice(0, 30)
            .map((c) => (
              <CommandItem key={c.id} value={`${c.titulo} ${c.id}`} onSelect={ejecutar(() => p.onConversacion(c.id))}>
                {c.pestana === 'code' ? <CodeIcon /> : <MessageSquareIcon />} {c.titulo}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
