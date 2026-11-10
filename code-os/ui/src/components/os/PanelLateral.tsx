import { EyeIcon, FileCodeIcon, FolderTreeIcon, GitCompareIcon, ListChecksIcon, SquareTerminalIcon, XIcon, type LucideIcon } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Cliente } from '@/lib/cliente'
import type { Artefacto } from '@/lib/artefactos'
import type { Mensaje } from '@/lib/mensajes'
import { tareasDe } from '@/lib/mensajes'
import { Artefactos } from './panel/Artefactos'
import { Tareas } from './panel/Tareas'
import { VistaPrevia } from './panel/VistaPrevia'

// Lo pesado (CodeMirror, visor de diff, xterm) se carga solo al abrir su pestaña.
const Archivos = lazy(() => import('./panel/Archivos'))
const Cambios = lazy(() => import('./panel/Cambios'))
const Terminal = lazy(() => import('./panel/Terminal'))

export type PestanaPanel = 'archivos' | 'cambios' | 'terminal' | 'tareas' | 'artefactos' | 'vista'
export const pestanasPanel: { id: PestanaPanel; nombre: string; icono: LucideIcon; code: boolean; chat: boolean }[] = [
  { id: 'tareas', nombre: 'Tareas', icono: ListChecksIcon, code: true, chat: false },
  { id: 'cambios', nombre: 'Cambios', icono: GitCompareIcon, code: true, chat: false },
  { id: 'archivos', nombre: 'Archivos', icono: FolderTreeIcon, code: true, chat: false },
  { id: 'terminal', nombre: 'Terminal', icono: SquareTerminalIcon, code: true, chat: false },
  { id: 'artefactos', nombre: 'Artefactos', icono: FileCodeIcon, code: true, chat: true },
  { id: 'vista', nombre: 'Vista previa', icono: EyeIcon, code: true, chat: true },
]

type Props = {
  pestana: PestanaPanel
  onPestana: (p: PestanaPanel) => void
  onCerrar: () => void
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
  rutaAbierta?: string | null
}

const Cargando = () => (
  <div className="grid h-full place-items-center">
    <Spinner />
  </div>
)

export function PanelLateral(p: Props) {
  const visibles = pestanasPanel.filter((x) => (p.modo === 'code' ? x.code : x.chat))
  const pestana = visibles.some((x) => x.id === p.pestana) ? p.pestana : visibles[0].id
  const pendientes = tareasDe(p.mensajes).filter((t) => t.status !== 'completed').length
  return (
    <aside aria-label="Panel lateral" className="@container flex h-full min-w-0 flex-col bg-card">
      <Tabs value={pestana} onValueChange={(v) => p.onPestana(v as PestanaPanel)} className="flex h-full min-h-0 flex-col gap-0">
        <div className="flex items-center gap-1 border-b px-2 py-1.5">
          <TabsList variant="line" className="min-w-0 flex-1 justify-start overflow-x-auto">
            {visibles.map((x) => (
              <TabsTrigger key={x.id} value={x.id} className="shrink-0 gap-1 px-1.5 text-xs" title={x.nombre} aria-label={x.nombre}>
                <x.icono className="size-3.5" />
                <span className="hidden @[34rem]:inline">{x.nombre}</span>
                {x.id === 'tareas' && pendientes > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 text-[10px] tabular-nums">{pendientes}</span>}
                {x.id === 'artefactos' && p.artefactos.length > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 text-[10px] tabular-nums">{p.artefactos.length}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button variant="ghost" size="icon-sm" onClick={p.onCerrar} aria-label="Cerrar panel">
            <XIcon />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden text-sm">
          <Suspense fallback={<Cargando />}>
            {pestana === 'archivos' && (
              <TabsContent value="archivos" className="h-full">
                <Archivos cliente={p.cliente} conversacionId={p.conversacionId} tema={p.tema} onMencionar={p.onMencionar} rutaInicial={p.rutaAbierta} />
              </TabsContent>
            )}
            {pestana === 'cambios' && (
              <TabsContent value="cambios" className="h-full">
                <Cambios cliente={p.cliente} conversacionId={p.conversacionId} tema={p.tema} onEnviarComentarios={p.onTextoAlMensaje} />
              </TabsContent>
            )}
            {pestana === 'terminal' && (
              <TabsContent value="terminal" className="h-full">
                <Terminal cliente={p.cliente} conversacionId={p.conversacionId} tema={p.tema} />
              </TabsContent>
            )}
          </Suspense>
          {pestana === 'tareas' && (
            <TabsContent value="tareas" className="h-full overflow-auto">
              <Tareas mensajes={p.mensajes} />
            </TabsContent>
          )}
          {pestana === 'artefactos' && (
            <TabsContent value="artefactos" className="h-full">
              <Artefactos artefactos={p.artefactos} activo={p.artefactoActivo} onActivo={p.onArtefacto} />
            </TabsContent>
          )}
          {pestana === 'vista' && (
            <TabsContent value="vista" className="h-full">
              <VistaPrevia />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </aside>
  )
}
