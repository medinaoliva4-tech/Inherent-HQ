import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useHilo } from '@/hooks/use-hilo'
import { etiquetaNodo, origenDe, type Nodo } from '@/lib/hilo'
import { cn } from '@/lib/utils'
import { Cabecera, claseCampo, EstadoCarga } from './comun'

function Encabezado({ n }: { n: Nodo }) {
  const h = useHilo()
  return (
    <button type="button" onClick={() => h.abrir(n.id)} className="grid w-full gap-0.5 rounded-md p-1 text-left hover:bg-accent/60" title={origenDe(n, h.nodos) ?? undefined}>
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="size-1.5 rounded-full" style={{ background: n.estado === 'aprobado' ? 'var(--ui-ok)' : 'var(--ui-warn)' }} aria-hidden />
        {etiquetaNodo(n, h.nodos)}
      </span>
      <span className="text-xs leading-snug font-medium">{n.titulo}</span>
    </button>
  )
}

function Celda({ pilar, angulo }: { pilar: Nodo; angulo: Nodo }) {
  const h = useHilo()
  const ideas = h.nodos.filter((n) => n.tipo === 'idea' && n.viene_de.includes(pilar.id) && n.viene_de.includes(angulo.id))
  const [nueva, setNueva] = useState<string | null>(null)
  return (
    <td className="border-t border-l p-1.5 align-top">
      <div className="grid gap-1">
        {ideas.map((i) => (
          <button key={i.id} type="button" onClick={() => h.abrir(i.id)} className={cn('rounded-md border bg-background/60 px-2 py-1 text-left text-xs transition-colors hover:bg-accent', i.estado === 'aprobado' && 'border-ok/40')}>
            {i.titulo}
          </button>
        ))}
        {nueva === null ? (
          <Button size="icon-xs" variant="ghost" className="text-mut2" onClick={() => setNueva('')} aria-label={`Idea para ${pilar.titulo} × ${angulo.titulo}`}>
            <PlusIcon />
          </Button>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!nueva.trim()) return setNueva(null)
              await h.crear({ tipo: 'idea', titulo: nueva, contenido: { decide: `Idea de «${pilar.titulo}» con el ángulo «${angulo.titulo}».` }, viene_de: [pilar.id, angulo.id] })
              setNueva(null)
            }}
          >
            <input autoFocus aria-label="Nueva idea" className={cn(claseCampo, 'px-2 py-1 text-xs')} value={nueva} onChange={(e) => setNueva(e.target.value)} onBlur={() => !nueva.trim() && setNueva(null)} onKeyDown={(e) => e.key === 'Escape' && setNueva(null)} placeholder="Idea…" />
          </form>
        )}
      </div>
    </td>
  )
}

/** Tablero pilares × ángulos: cada celda son las ideas que salen de ese pilar con ese ángulo. */
export function Pilares() {
  const h = useHilo()
  const pilares = h.nodos.filter((n) => n.tipo === 'pilar')
  const angulos = h.nodos.filter((n) => n.tipo === 'angulo')
  return (
    <div className="grid gap-4">
      <Cabecera id="pilares" />
      <EstadoCarga>
        {pilares.length && angulos.length ? (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-36 p-1.5 text-left text-[11px] font-medium text-muted-foreground">Pilar \ Ángulo</th>
                  {angulos.map((a) => (
                    <th key={a.id} className="border-l p-1.5 align-top font-normal">
                      <Encabezado n={a} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pilares.map((p) => (
                  <tr key={p.id}>
                    <th className="border-t p-1.5 align-top font-normal">
                      <Encabezado n={p} />
                    </th>
                    {angulos.map((a) => (
                      <Celda key={a.id} pilar={p} angulo={a} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Faltan pilares o ángulos. Pídeselos a @creativo en el chat: salen de los dolores aprobados.</p>
        )}
      </EstadoCarga>
    </div>
  )
}
