import { BotIcon, Building2Icon, CodeIcon, EyeIcon, FileCodeIcon, FolderTreeIcon, GitCompareIcon, LayoutGridIcon, ListChecksIcon, SquareTerminalIcon, XIcon, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHilo } from '@/hooks/use-hilo'
import type { Agente } from '@/lib/agentes'
import type { Artefacto } from '@/lib/artefactos'
import type { Cliente } from '@/lib/cliente'
import { AREAS } from '@/lib/hilo'
import type { Mensaje } from '@/lib/mensajes'
import { tareasDe } from '@/lib/mensajes'
import { resortePop } from '@/lib/movimiento'
import { HERRAMIENTAS, type IdHerramienta } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { PortalAgentes, trabajosVivos } from './agentes/PortalAgentes'
import { Calculadora } from './herramientas/Calculadora'
import { Campanas } from './herramientas/Campanas'
import { Dolores } from './herramientas/Dolores'
import { Video } from './herramientas/Video'
import { PerfilICP } from './herramientas/PerfilICP'
import { Pilares } from './herramientas/Pilares'
import { ProduccionPre } from './herramientas/ProduccionPre'
import { Radar } from './herramientas/Radar'
import { PaginaCliente } from './hilo/PaginaCliente'
import { Artefactos } from './panel/Artefactos'
import { Tareas } from './panel/Tareas'
import { VistaPrevia } from './panel/VistaPrevia'

// Lo pesado (CodeMirror, visor de diff, xterm) se carga solo al abrir su pestaña.
const Archivos = lazy(() => import('./panel/Archivos'))
const Cambios = lazy(() => import('./panel/Cambios'))
const Terminal = lazy(() => import('./panel/Terminal'))

/** Primer nivel del panel: páginas del cliente, portal de agentes, herramientas (artefactos) y, en Code, el código. */
export type SeccionPanel = 'cliente' | 'agentes' | 'herramientas' | 'codigo'
/** Pestañas de la sección Código (lo que ya había). */
export type PestanaPanel = 'archivos' | 'cambios' | 'terminal' | 'tareas' | 'vista'
/** Dentro de Herramientas: una herramienta o los artefactos que salieron del chat. */
export type VistaHerramienta = IdHerramienta | 'artefactos'

/** A dónde abrir el panel (desde la paleta, el chat o una tarjeta). */
export type DestinoPanel = { seccion: SeccionPanel; pestana?: PestanaPanel; herramienta?: VistaHerramienta }

export const pestanasCodigo: { id: PestanaPanel; nombre: string; icono: LucideIcon }[] = [
  { id: 'tareas', nombre: 'Tareas', icono: ListChecksIcon },
  { id: 'cambios', nombre: 'Cambios', icono: GitCompareIcon },
  { id: 'archivos', nombre: 'Archivos', icono: FolderTreeIcon },
  { id: 'terminal', nombre: 'Terminal', icono: SquareTerminalIcon },
  { id: 'vista', nombre: 'Vista previa', icono: EyeIcon },
]

const HERRAMIENTA: Record<IdHerramienta, () => React.ReactNode> = {
  icp: () => <PerfilICP />,
  adquisicion: () => <Calculadora />,
  dolores: () => <Dolores />,
  pilares: () => <Pilares />,
  radar: () => <Radar />,
  campanas: () => <Campanas />,
  pre: () => <ProduccionPre />,
  video: () => <Video />,
}

type Props = {
  seccion: SeccionPanel
  onSeccion: (s: SeccionPanel) => void
  pestana: PestanaPanel
  onPestana: (p: PestanaPanel) => void
  herramienta: VistaHerramienta
  onHerramienta: (h: VistaHerramienta) => void
  /** Herramientas del rol, en su orden. */
  herramientas: IdHerramienta[]
  agentesRol: string[]
  agente: string
  onAgente: (id: string) => void
  onEmpezarAgente: (a: Agente) => void
  onCerrar?: () => void
  modo: 'chat' | 'code'
  cliente: Cliente
  conversacionId: string
  mensajes: Mensaje[]
  artefactos: Artefacto[]
  artefactoActivo: string | null
  onArtefacto: (id: string) => void
  tema: 'dark' | 'light'
  onMencionar: (ruta: string) => void
  onTextoAlMensaje: (texto: string) => void
  /** Manda un texto como mensaje (comentarios del diff). */
  onEnviar: (texto: string) => void
  /** «Revisar»: lo revisa otro nivel; devuelve quién. */
  onRevisar?: () => string | void
  /** La sesión corre aislada (worktree): se puede fusionar. */
  aislada?: boolean
  /** Dentro del Chat del OS (`?embed=1`): sin chat propio; Código solo con Cambios y Terminal. */
  embebido?: boolean
  rutaAbierta?: string | null
}

const Cargando = () => (
  <div className="grid h-full place-items-center">
    <Spinner />
  </div>
)

function Insignia({ n, aviso }: { n: number; aviso?: boolean }) {
  if (!n) return null
  return <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', aviso ? 'bg-warn/20 text-warn' : 'bg-accent')}>{n}</span>
}

export function PanelLateral(p: Props) {
  const h = useHilo()
  const secciones: { id: SeccionPanel; nombre: string; icono: LucideIcon; n?: number; aviso?: boolean }[] = [
    { id: 'cliente', nombre: 'Cliente', icono: Building2Icon, n: h.avisos.length, aviso: true },
    { id: 'agentes', nombre: 'Agentes', icono: BotIcon, n: new Set(trabajosVivos(p.mensajes).map((t) => t.agente)).size },
    { id: 'herramientas', nombre: 'Herramientas', icono: LayoutGridIcon, n: p.artefactos.length },
    ...(p.modo === 'code' || p.embebido ? [{ id: 'codigo' as const, nombre: 'Código', icono: CodeIcon, n: tareasDe(p.mensajes).filter((t) => t.status !== 'completed').length }] : []),
  ]
  const seccion = secciones.some((s) => s.id === p.seccion) ? p.seccion : 'herramientas'
  const vistas: VistaHerramienta[] = [...p.herramientas, ...(p.artefactos.length ? (['artefactos'] as const) : [])]
  const herramienta = vistas.includes(p.herramienta) ? p.herramienta : vistas[0]
  const pestanaCodigo: PestanaPanel = p.embebido && !['cambios', 'terminal', 'archivos'].includes(p.pestana) ? 'cambios' : p.pestana

  return (
    <aside aria-label="Panel lateral" className="@container flex h-full min-w-0 flex-col bg-card">
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <div role="tablist" aria-label="Secciones del panel" className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {secciones.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={seccion === s.id}
              aria-label={s.nombre}
              title={s.nombre}
              onClick={() => p.onSeccion(s.id)}
              className={cn('relative z-10 flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors', seccion === s.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {seccion === s.id && <motion.span layoutId="seccion-panel" className="absolute inset-0 -z-10 rounded-md bg-accent" transition={resortePop} />}
              <s.icono className="size-4" />
              <span className="hidden @[30rem]:inline">{s.nombre}</span>
              <Insignia n={s.n ?? 0} aviso={s.aviso} />
            </button>
          ))}
        </div>
        {!p.embebido && (
          <Button variant="ghost" size="icon-sm" onClick={p.onCerrar} aria-label="Cerrar panel">
            <XIcon />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden text-sm">
        {seccion === 'cliente' && (
          <div className="herramienta h-full overflow-y-auto">
            <PaginaCliente />
          </div>
        )}

        {seccion === 'agentes' && (
          <div className="herramienta h-full overflow-y-auto">
            <PortalAgentes mensajes={p.mensajes} orden={p.agentesRol} activo={p.agente} onActivo={p.onAgente} onEmpezar={p.onEmpezarAgente} mock={p.cliente.tipo === 'mock'} />
          </div>
        )}

        {seccion === 'herramientas' && (
          <div className="flex h-full flex-col">
            <nav aria-label="Herramientas" className="flex shrink-0 gap-1 overflow-x-auto border-b px-2 py-1.5 [scrollbar-width:none]">
              {vistas.map((v) => {
                const t = v === 'artefactos' ? null : HERRAMIENTAS[v]
                const activa = v === herramienta
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => p.onHerramienta(v)}
                    className={cn('flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors', activa ? 'border-foreground/30 bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {t ? <span className="size-1.5 rounded-full" style={{ background: AREAS[t.area].color }} aria-hidden /> : <FileCodeIcon className="size-3" />}
                    {t ? t.nombre : `Del chat (${p.artefactos.length})`}
                  </button>
                )
              })}
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {herramienta === 'artefactos' ? (
                <Artefactos artefactos={p.artefactos} activo={p.artefactoActivo} onActivo={p.onArtefacto} />
              ) : (
                <div className="herramienta p-4 [&>div]:grid-cols-[minmax(0,1fr)]">{HERRAMIENTA[herramienta]()}</div>
              )}
            </div>
          </div>
        )}

        {seccion === 'codigo' && (
          <Tabs value={pestanaCodigo} onValueChange={(v) => p.onPestana(v as PestanaPanel)} className="flex h-full min-h-0 flex-col gap-0">
            <TabsList variant="line" className="w-full shrink-0 justify-start overflow-x-auto border-b px-2 [scrollbar-width:none]">
              {pestanasCodigo.filter((x) => !p.embebido || x.id === 'cambios' || x.id === 'terminal' || x.id === 'archivos').map((x) => (
                <TabsTrigger key={x.id} value={x.id} className="shrink-0 gap-1 px-1.5 text-xs" title={x.nombre} aria-label={x.nombre}>
                  <x.icono className="size-3.5" />
                  <span className="hidden @[30rem]:inline">{x.nombre}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="min-h-0 flex-1 overflow-hidden">
              <Suspense fallback={<Cargando />}>
                {pestanaCodigo === 'archivos' && (
                  <TabsContent value="archivos" className="h-full">
                    <Archivos cliente={p.cliente} conversacionId={p.conversacionId} tema={p.tema} onMencionar={p.onMencionar} rutaInicial={p.rutaAbierta} />
                  </TabsContent>
                )}
                {pestanaCodigo === 'cambios' && (
                  <TabsContent value="cambios" className="h-full">
                    <Cambios cliente={p.cliente} conversacionId={p.conversacionId} tema={p.tema} onEnviarComentarios={p.onEnviar} onRevisar={p.onRevisar} aislada={p.aislada} />
                  </TabsContent>
                )}
                {pestanaCodigo === 'terminal' && (
                  <TabsContent value="terminal" className="h-full">
                    <Terminal cliente={p.cliente} conversacionId={p.conversacionId} tema={p.tema} />
                  </TabsContent>
                )}
              </Suspense>
              {pestanaCodigo === 'tareas' && (
                <TabsContent value="tareas" className="h-full overflow-auto">
                  <Tareas mensajes={p.mensajes} />
                </TabsContent>
              )}
              {pestanaCodigo === 'vista' && (
                <TabsContent value="vista" className="h-full">
                  <VistaPrevia />
                </TabsContent>
              )}
            </div>
          </Tabs>
        )}
      </div>
    </aside>
  )
}
