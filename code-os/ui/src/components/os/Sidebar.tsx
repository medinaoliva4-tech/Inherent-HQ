import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ChevronRightIcon,
  CodeIcon,
  FolderIcon,
  FolderPlusIcon,
  GhostIcon,
  MessageSquareIcon,
  MoonIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  SunIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Conversacion, Pestana, Proyecto } from '@/hooks/use-espacio'
import type { Tema } from '@/hooks/use-theme'
import type { EstadoCuotas, EstadoServidor } from '@/lib/cliente'
import { resorte, resortePop } from '@/lib/movimiento'
import { cn } from '@/lib/utils'
import { MedidorCuotas } from './MedidorCuotas'

/** «ahora», «2 h», «ayer», «3 d», «2 sem». */
export function haceCuanto(iso: string, ahora = Date.now()) {
  const min = Math.max(0, (ahora - Date.parse(iso)) / 60_000)
  if (min < 2) return 'ahora'
  if (min < 60) return `${Math.round(min)} min`
  const h = min / 60
  if (h < 24) return `${Math.round(h)} h`
  if (h < 48) return 'ayer'
  const d = h / 24
  if (d < 7) return `${Math.round(d)} d`
  return `${Math.round(d / 7)} sem`
}

type Props = {
  pestana: Pestana
  onPestana: (p: Pestana) => void
  proyectos: Proyecto[]
  conversaciones: Conversacion[]
  activa: string
  enCurso: Record<string, boolean>
  esperando: Record<string, boolean>
  /** ¿El texto de esa conversación contiene la búsqueda? (busca también en los mensajes). */
  buscarEnMensajes: (convId: string, q: string) => boolean
  onElegir: (id: string) => void
  onNueva: (proyectoId?: string) => void
  onIncognito: () => void
  onEditar: (id: string, cambios: Partial<Conversacion>) => void
  onBorrar: (id: string) => void
  onNuevoProyecto: () => void
  onProyecto: (id: string) => void
  onAjustes: () => void
  tema: Tema
  onTema: () => void
  cuotas: EstadoCuotas | null
  errorCuotas: string | null
  servidor: EstadoServidor | null
  mock: boolean
}

function FilaConversacion({
  c,
  activa,
  corriendo,
  esperando,
  onElegir,
  onEditar,
  onBorrar,
}: {
  c: Conversacion
  activa: boolean
  corriendo: boolean
  esperando: boolean
  onElegir: () => void
  onEditar: (cambios: Partial<Conversacion>) => void
  onBorrar: () => void
}) {
  const [renombrando, setRenombrando] = useState(false)
  const [titulo, setTitulo] = useState(c.titulo)
  const [confirmar, setConfirmar] = useState(false)
  if (renombrando) {
    return (
      <form
        className="py-0.5 pr-1 pl-7"
        onSubmit={(e) => {
          e.preventDefault()
          onEditar({ titulo: titulo.trim() || c.titulo })
          setRenombrando(false)
        }}
      >
        <input
          autoFocus
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => {
            onEditar({ titulo: titulo.trim() || c.titulo })
            setRenombrando(false)
          }}
          onKeyDown={(e) => e.key === 'Escape' && setRenombrando(false)}
          aria-label="Nuevo nombre"
          className="h-7 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>
    )
  }
  return (
    <div className="group/fila relative">
      <button
        type="button"
        aria-current={activa ? 'page' : undefined}
        onClick={onElegir}
        className={cn(
          'flex w-full items-center gap-2 rounded-md py-1.5 pr-8 pl-7 text-left text-sm transition-[background-color,color,transform] active:scale-[0.99]',
          activa ? 'bg-sidebar-accent text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
        )}
      >
        {c.pestana === 'code' ? <CodeIcon className="size-3.5 shrink-0 opacity-60" /> : <MessageSquareIcon className="size-3.5 shrink-0 opacity-60" />}
        <span className="flex-1 truncate">{c.titulo}</span>
        {c.fijada && <PinIcon className="size-3 shrink-0 opacity-60" aria-label="Fijada" />}
        {esperando ? (
          <span className="size-2 shrink-0 rounded-full bg-warn" aria-label="Espera tu respuesta" title="Espera tu respuesta" />
        ) : corriendo ? (
          <span className="size-2 shrink-0 animate-pulse rounded-full bg-foreground" aria-label="Trabajando" title="Trabajando" />
        ) : (
          <span className="shrink-0 text-[11px] text-mut2 group-hover/fila:opacity-0">{haceCuanto(c.actualizada)}</span>
        )}
      </button>
      <DropdownMenu onOpenChange={(v) => !v && setConfirmar(false)}>
        <DropdownMenuTrigger
          aria-label={`Opciones de ${c.titulo}`}
          className="absolute top-1/2 right-1 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover/fila:opacity-100 hover:bg-accent focus-visible:opacity-100 data-[popup-open]:opacity-100 max-md:opacity-100"
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setRenombrando(true)}>
            <PencilIcon /> Renombrar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEditar({ fijada: !c.fijada })}>
            {c.fijada ? <PinOffIcon /> : <PinIcon />} {c.fijada ? 'Quitar de fijadas' : 'Fijar arriba'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEditar({ archivada: !c.archivada })}>
            {c.archivada ? <ArchiveRestoreIcon /> : <ArchiveIcon />} {c.archivada ? 'Sacar del archivo' : 'Archivar'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            closeOnClick={confirmar}
            onClick={() => {
              if (confirmar) onBorrar()
              else setConfirmar(true)
            }}
          >
            <Trash2Icon /> {confirmar ? 'Toca otra vez para borrar' : 'Borrar'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function Sidebar(p: Props) {
  const [cerradas, setCerradas] = useState<Record<string, boolean>>({})
  const [q, setQ] = useState('')
  const [archivadas, setArchivadas] = useState(false)

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase()
    return p.conversaciones
      .filter((c) => c.pestana === p.pestana && !!c.archivada === archivadas)
      .filter((c) => !t || c.titulo.toLowerCase().includes(t) || p.buscarEnMensajes(c.id, t))
      .sort((a, b) => Number(!!b.fijada) - Number(!!a.fijada) || b.actualizada.localeCompare(a.actualizada))
  }, [p, q, archivadas])
  const nArchivadas = p.conversaciones.filter((c) => c.pestana === p.pestana && c.archivada).length

  return (
    <nav aria-label="Proyectos y conversaciones" className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">I</span>
        <span className="flex-1 text-sm font-semibold tracking-tight">Code OS</span>
        <Button variant="ghost" size="icon-sm" onClick={p.onTema} aria-label={p.tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
          {p.tema === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>

      <div role="tablist" aria-label="Chat o Code" className="mx-3 mb-2 grid grid-cols-2 rounded-lg bg-muted/70 p-0.5">
        {(['chat', 'code'] as const).map((x) => (
          <button
            key={x}
            type="button"
            role="tab"
            aria-selected={p.pestana === x}
            onClick={() => p.onPestana(x)}
            className={cn('relative z-10 flex h-8 items-center justify-center gap-1.5 rounded-md text-sm transition-colors', p.pestana === x ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            {p.pestana === x && <motion.span layoutId="pestana-activa" className="absolute inset-0 -z-10 rounded-md bg-background shadow-sm" transition={resortePop} />}
            {x === 'chat' ? <MessageSquareIcon className="size-3.5" /> : <CodeIcon className="size-3.5" />}
            {x === 'chat' ? 'Chat' : 'Code'}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 px-3 pb-2">
        <Button variant="outline" size="sm" className="flex-1 justify-start" onClick={() => p.onNueva()}>
          <PlusIcon /> {p.pestana === 'code' ? 'Nueva sesión' : 'Nuevo chat'}
        </Button>
        <Button variant="outline" size="icon-sm" onClick={p.onIncognito} aria-label="Chat incógnito (no se guarda)" title="Chat incógnito: no se guarda">
          <GhostIcon />
        </Button>
      </div>

      <div className="px-3 pb-2">
        <label className="flex h-8 items-center gap-2 rounded-md border bg-background/50 px-2 text-sm focus-within:ring-2 focus-within:ring-ring">
          <SearchIcon className="size-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en el historial" aria-label="Buscar en el historial" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Borrar búsqueda" className="rounded p-0.5 hover:bg-accent">
              <XIcon className="size-3" />
            </button>
          )}
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {archivadas && (
          <button type="button" onClick={() => setArchivadas(false)} className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent">
            <ChevronRightIcon className="size-3.5 rotate-180" /> Volver · Archivadas
          </button>
        )}
        {p.proyectos.map((pr) => {
          const convs = visibles.filter((c) => c.proyectoId === pr.id)
          if (q && !convs.length) return null
          const cerrada = cerradas[pr.id] && !q
          return (
            <section key={pr.id} className="mb-1">
              <div className="group/proy flex items-center">
                <button
                  type="button"
                  aria-expanded={!cerrada}
                  onClick={() => setCerradas((s) => ({ ...s, [pr.id]: !s[pr.id] }))}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                  <ChevronRightIcon className={cn('size-3.5 shrink-0 transition-transform duration-200', !cerrada && 'rotate-90')} />
                  <FolderIcon className="size-3.5 shrink-0" />
                  <span className="truncate">{pr.nombre}</span>
                  {pr.instrucciones && <span className="size-1.5 shrink-0 rounded-full bg-mut2" title="Tiene instrucciones" />}
                </button>
                <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover/proy:opacity-100 focus-visible:opacity-100 max-md:opacity-100" onClick={() => p.onNueva(pr.id)} aria-label={`Nueva conversación en ${pr.nombre}`}>
                  <PlusIcon />
                </Button>
                <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover/proy:opacity-100 focus-visible:opacity-100 max-md:opacity-100" onClick={() => p.onProyecto(pr.id)} aria-label={`Ajustes de ${pr.nombre}`}>
                  <Settings2Icon />
                </Button>
              </div>
              <AnimatePresence initial={false}>
                {!cerrada && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={resorte} className="overflow-hidden">
                    {convs.length ? (
                      convs.map((c) => (
                        <FilaConversacion
                          key={c.id}
                          c={c}
                          activa={c.id === p.activa}
                          corriendo={!!p.enCurso[c.id]}
                          esperando={!!p.esperando[c.id]}
                          onElegir={() => p.onElegir(c.id)}
                          onEditar={(cambios) => p.onEditar(c.id, cambios)}
                          onBorrar={() => p.onBorrar(c.id)}
                        />
                      ))
                    ) : (
                      <p className="py-1 pl-8 text-xs text-mut2">{archivadas ? 'Nada archivado' : 'Sin conversaciones'}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )
        })}
        {q && !visibles.length && <p className="px-2 py-3 text-center text-xs text-muted-foreground">Nada coincide con «{q}».</p>}
        <div className="mt-2 flex flex-wrap gap-1 px-1">
          <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={p.onNuevoProyecto}>
            <FolderPlusIcon /> Proyecto nuevo
          </Button>
          {!archivadas && nArchivadas > 0 && (
            <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => setArchivadas(true)}>
              <ArchiveIcon /> Archivadas ({nArchivadas})
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-1 border-t px-2 py-2">
        <MedidorCuotas estado={p.cuotas} error={p.errorCuotas} mock={p.mock} />
        <div className="flex items-center gap-2 px-2">
          <span
            className={cn('size-2 shrink-0 rounded-full', p.servidor?.claude === 'activa' ? 'bg-ok' : p.servidor?.claude === 'inactiva' ? 'bg-warn' : 'bg-mut2')}
            aria-hidden
          />
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {p.servidor?.claude === 'activa' ? 'Sesión de Claude activa' : p.servidor?.claude === 'inactiva' ? 'Sesión de Claude no activa' : 'Sesión de Claude: sin dato'}
            {p.mock && ' · ejemplo'}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={p.onAjustes} aria-label="Ajustes">
            <Settings2Icon />
          </Button>
        </div>
      </div>
    </nav>
  )
}
