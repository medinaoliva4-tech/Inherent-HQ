import { ChevronRightIcon, FolderIcon, MoonIcon, PlusIcon, SearchIcon, SunIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Proyecto } from '@/data/ejemplo'
import type { Tema } from '@/hooks/use-theme'
import { resorte } from '@/lib/movimiento'
import { cn } from '@/lib/utils'

type Props = {
  proyectos: Proyecto[]
  activa: string
  onElegir: (id: string) => void
  onNueva: () => void
  onPaleta: () => void
  tema: Tema
  onTema: () => void
}

export function Sidebar({ proyectos, activa, onElegir, onNueva, onPaleta, tema, onTema }: Props) {
  const [cerradas, setCerradas] = useState<Record<string, boolean>>({})
  return (
    <nav aria-label="Proyectos y conversaciones" className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">I</span>
        <span className="flex-1 text-sm font-semibold tracking-tight">Code OS</span>
        <Button variant="ghost" size="icon-sm" onClick={onTema} aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
          {tema === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>
      <div className="flex gap-1.5 px-3 pb-2">
        <Button variant="outline" size="sm" className="flex-1 justify-start" onClick={onNueva}>
          <PlusIcon /> Nueva conversación
        </Button>
        <Button variant="outline" size="icon-sm" onClick={onPaleta} aria-label="Abrir paleta de comandos">
          <SearchIcon />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {proyectos.map((p) => {
          const cerrada = cerradas[p.id]
          return (
            <section key={p.id} className="mb-1">
              <button
                type="button"
                aria-expanded={!cerrada}
                onClick={() => setCerradas((s) => ({ ...s, [p.id]: !s[p.id] }))}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <ChevronRightIcon className={cn('size-3.5 transition-transform duration-200', !cerrada && 'rotate-90')} />
                <FolderIcon className="size-3.5" />
                <span className="truncate">{p.nombre}</span>
              </button>
              <AnimatePresence initial={false}>
                {!cerrada && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={resorte}
                    className="overflow-hidden"
                  >
                    {p.conversaciones.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          aria-current={c.id === activa ? 'page' : undefined}
                          onClick={() => onElegir(c.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-left text-sm transition-colors active:scale-[0.99]',
                            c.id === activa ? 'bg-sidebar-accent text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                          )}
                        >
                          <span className="flex-1 truncate">{c.titulo}</span>
                          <span className="text-[11px] text-mut2">{c.hace}</span>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </section>
          )
        })}
      </div>
    </nav>
  )
}
