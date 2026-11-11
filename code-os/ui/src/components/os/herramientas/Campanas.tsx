import { ArrowDownIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useHilo } from '@/hooks/use-hilo'
import { cn } from '@/lib/utils'
import { TarjetaDecision } from '../hilo/TarjetaDecision'
import { Cabecera, claseCampo, EstadoCarga } from './comun'

function Paso({ n, titulo, children, ultimo }: { n: number; titulo: string; children: ReactNode; ultimo?: boolean }) {
  return (
    <section aria-label={titulo} className="grid gap-2">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] tabular-nums">{n}</span>
        {titulo}
      </h3>
      {children}
      {!ultimo && <ArrowDownIcon className="mx-auto size-4 text-mut2" aria-hidden />}
    </section>
  )
}

/** Campañas: copy íntegro ↔ ideas ↔ piezas ↔ resultado esperado, en una sola cadena. */
export function Campanas() {
  const h = useHilo()
  const campanas = h.nodos.filter((n) => n.tipo === 'campana')
  const [activa, setActiva] = useState<string | null>(null)
  const c = campanas.find((x) => x.id === activa) ?? campanas[0]
  const [copy, setCopy] = useState('')
  const [resultado, setResultado] = useState('')
  useEffect(() => {
    setCopy(typeof c?.contenido?.copy === 'string' ? c.contenido.copy : '')
    setResultado(typeof c?.contenido?.resultado === 'string' ? c.contenido.resultado : '')
  }, [c])

  const ideas = c ? (Array.isArray(c.contenido?.ideas) ? (c.contenido.ideas as string[]) : []).map((id) => h.nodo(id)).filter((x) => !!x) : []
  const piezas = c ? h.nodos.filter((n) => n.tipo === 'pieza' && n.viene_de.includes(c.id)) : []
  const cambiado = !!c && (copy !== (c.contenido?.copy ?? '') || resultado !== (c.contenido?.resultado ?? ''))

  return (
    <div className="grid gap-4">
      <Cabecera id="campanas" />
      <EstadoCarga>
        {campanas.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Campañas">
            {campanas.map((x) => (
              <button key={x.id} role="tab" aria-selected={x.id === c?.id} onClick={() => setActiva(x.id)} className={cn('rounded-full border px-3 py-1 text-xs', x.id === c?.id ? 'bg-accent' : 'hover:bg-accent/60')}>
                {x.titulo}
              </button>
            ))}
          </div>
        )}
        {!c ? (
          <p className="text-sm text-muted-foreground">Sin campañas todavía. Pídele una a @creativo en el chat.</p>
        ) : (
          <>
            <TarjetaDecision nodo={c} />
            <Paso n={1} titulo="Copy íntegro">
              <textarea aria-label="Copy íntegro" rows={6} className={cn(claseCampo, 'leading-relaxed')} value={copy} onChange={(e) => setCopy(e.target.value)} />
            </Paso>
            <Paso n={2} titulo={`Ideas · ${ideas.length}`}>
              <ul className="grid gap-1.5">
                {ideas.map((i) => (
                  <li key={i!.id}>
                    <TarjetaDecision nodo={i!} compacta />
                  </li>
                ))}
                {!ideas.length && <li className="text-xs text-muted-foreground">Agrega ideas desde el tablero de pilares × ángulos.</li>}
              </ul>
            </Paso>
            <Paso n={3} titulo={`Piezas · ${piezas.length}`}>
              <ul className="grid gap-1.5">
                {piezas.map((p) => (
                  <li key={p.id}>
                    <TarjetaDecision nodo={p} compacta />
                  </li>
                ))}
                {!piezas.length && <li className="text-xs text-muted-foreground">Production crea las piezas a partir de las ideas.</li>}
              </ul>
            </Paso>
            <Paso n={4} titulo="Resultado esperado" ultimo>
              <input aria-label="Resultado esperado" className={claseCampo} value={resultado} onChange={(e) => setResultado(e.target.value)} />
              <p className="text-[11px] text-mut2">Sin dato real va marcado [hipótesis].</p>
            </Paso>
            <div className="flex justify-end">
              <Button size="sm" disabled={!cambiado} onClick={() => h.guardar(c.id, { contenido: { ...c.contenido, copy, resultado } })}>
                Guardar campaña
              </Button>
            </div>
          </>
        )}
      </EstadoCarga>
    </div>
  )
}
