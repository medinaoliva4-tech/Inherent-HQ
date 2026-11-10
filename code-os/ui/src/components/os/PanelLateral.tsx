import { FileTextIcon, FolderOpenIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { archivos, artefactos, diffEjemplo, terminalEjemplo } from '@/data/ejemplo'
import { cn } from '@/lib/utils'

export type PestanaPanel = 'archivos' | 'diff' | 'artefactos' | 'terminal'
export const pestanas: { id: PestanaPanel; nombre: string }[] = [
  { id: 'archivos', nombre: 'Archivos' },
  { id: 'diff', nombre: 'Diff' },
  { id: 'artefactos', nombre: 'Artefactos' },
  { id: 'terminal', nombre: 'Terminal' },
]

type Props = { pestana: PestanaPanel; onPestana: (p: PestanaPanel) => void; onCerrar: () => void }

export function PanelLateral({ pestana, onPestana, onCerrar }: Props) {
  return (
    <aside aria-label="Panel lateral" className="flex h-full min-w-0 flex-col bg-card">
      <Tabs value={pestana} onValueChange={(v) => onPestana(v as PestanaPanel)} className="flex h-full min-h-0 flex-col gap-0">
        <div className="flex items-center gap-1 border-b px-2 py-1.5">
          <TabsList variant="line" className="flex-1 justify-start">
            {pestanas.map((p) => (
              <TabsTrigger key={p.id} value={p.id} className="text-xs">
                {p.nombre}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button variant="ghost" size="icon-sm" onClick={onCerrar} aria-label="Cerrar panel">
            <XIcon />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3 text-sm">
          <TabsContent value="archivos">
            {archivos.map((g) => (
              <div key={g.ruta} className="mb-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <FolderOpenIcon className="size-3.5" /> {g.ruta}
                </p>
                <ul>
                  {g.hijos.map((h) => (
                    <li key={h}>
                      <button type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left font-mono text-xs transition-colors hover:bg-accent">
                        <FileTextIcon className="size-3.5 text-muted-foreground" /> {h}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="diff">
            <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed">
              {diffEjemplo.split('\n').map((l, i) => (
                <div key={i} className={cn(l.startsWith('+') && 'text-ok', l.startsWith('-') && 'text-bad', l.startsWith('@@') && 'text-muted-foreground')}>
                  {l}
                </div>
              ))}
            </pre>
          </TabsContent>
          <TabsContent value="artefactos">
            <ul className="grid gap-2">
              {artefactos.map((a) => (
                <li key={a.id} className="rounded-lg border bg-background/50 p-3 transition-colors hover:bg-accent/50">
                  <p className="text-sm font-medium">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.tipo} · {a.detalle}
                  </p>
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="terminal">
            <pre className="rounded-md bg-background p-3 font-mono text-xs leading-relaxed text-ink2 text-muted-foreground">
              {terminalEjemplo.join('\n')}
              <span className="cursor-stream" />
            </pre>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}
