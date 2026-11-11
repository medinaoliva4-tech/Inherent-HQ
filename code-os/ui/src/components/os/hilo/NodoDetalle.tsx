import { BellDotIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useHilo } from '@/hooks/use-hilo'
import { NoDisponible } from '@/lib/cliente'
import { AREAS, areaDe, avisosDe, decideDe, etiquetaNodo, type Nodo } from '@/lib/hilo'
import { ChipArea, EstadoNodo } from './TarjetaDecision'

/** Nombres legibles de los campos que guardan las herramientas. */
const ETIQUETAS: Record<string, string> = {
  texto: 'Detalle',
  precio: 'Precio',
  facturacion: 'Facturación mensual',
  ticket: 'Ticket promedio',
  frecuencia: 'Frecuencia de ventas',
  demanda: 'Demanda',
  ciclo: 'Ciclo comercial',
  margen: 'Margen',
  capacidad: 'Capacidad',
  decisor: 'Decisor',
  industrias: 'Industrias y perfiles',
  geografia: 'Dónde vive (geografía y canales)',
  regla: 'Regla guía',
  villano: 'Villano',
  heroe: 'Héroe',
  guia: 'Guía',
  plan: 'Plan',
  exito: 'Éxito',
  fracaso: 'Fracaso',
  copy: 'Copy íntegro',
  resultado: 'Resultado',
  formato: 'Formato',
  red: 'Red',
  guion: 'Guion',
}

function Valor({ v }: { v: unknown }) {
  if (v === null || v === undefined || v === '') return <span className="text-mut2">—</span>
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return <span className="whitespace-pre-wrap">{String(v)}</span>
  if (Array.isArray(v))
    return (
      <ul className="grid gap-1">
        {v.map((x, i) => (
          <li key={i} className="text-sm">
            {typeof x === 'object' && x ? Object.values(x as Record<string, unknown>).filter((y) => typeof y === 'string' || typeof y === 'number').join(' · ') : String(x)}
          </li>
        ))}
      </ul>
    )
  return (
    <dl className="grid gap-1">
      {Object.entries(v as Record<string, unknown>).map(([k, x]) => (
        <div key={k} className="flex gap-2 text-sm">
          <dt className="text-muted-foreground">{ETIQUETAS[k] ?? k}:</dt>
          <dd className="min-w-0">{typeof x === 'object' ? <Valor v={x} /> : String(x)}</dd>
        </div>
      ))}
    </dl>
  )
}

function ChipNodo({ n, todos, onAbrir }: { n: Nodo; todos: Nodo[]; onAbrir: (id: string) => void }) {
  return (
    <button type="button" onClick={() => onAbrir(n.id)} className="flex max-w-full items-center gap-1.5 rounded-lg border bg-background/40 px-2 py-1 text-left text-xs transition-colors hover:bg-accent">
      <ChipArea area={areaDe(n)}>{etiquetaNodo(n, todos)}</ChipArea>
      <span className="truncate">{n.titulo}</span>
    </button>
  )
}

/** El contenido completo de un nodo. Abrirlo cuenta como «leído» y habilita aprobar. */
export function NodoDetalle() {
  const h = useHilo()
  const n = h.detalle ? h.nodo(h.detalle) : undefined
  const [dependen, setDependen] = useState<Nodo[] | null>(null)
  const [faltaDep, setFaltaDep] = useState<string | null>(null)

  useEffect(() => {
    if (!n) return
    let vivo = true
    setDependen(null)
    setFaltaDep(null)
    h.cliente
      .dependientes(h.clienteId, n.id)
      .then((d) => vivo && setDependen(d))
      .catch((e) => vivo && setFaltaDep(e instanceof NoDisponible ? e.que : 'No se pudo leer'))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n?.id, n?.version, h.cliente, h.clienteId])

  if (!n) return <Dialog open={false} />
  const padres = n.viene_de.map((id) => h.nodo(id)).filter((x): x is Nodo => !!x)
  const campos = Object.entries(n.contenido ?? {}).filter(([k]) => k !== 'decide')
  const avisos = avisosDe(n.id, h.avisos)
  const decide = decideDe(n)

  return (
    <Dialog open onOpenChange={(v) => !v && h.cerrarDetalle()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 pr-7">
            <ChipArea area={areaDe(n)}>
              {AREAS[areaDe(n)].nombre} · {etiquetaNodo(n, h.nodos)}
            </ChipArea>
            <span className="ml-auto">
              <EstadoNodo n={n} />
            </span>
          </div>
          <DialogTitle className="text-balance">{n.titulo}</DialogTitle>
          {decide && <DialogDescription>Decide: {decide}</DialogDescription>}
        </DialogHeader>

        {avisos.map((a) => (
          <p key={a.id} className="flex items-start gap-2 rounded-lg bg-warn/10 px-3 py-2 text-xs text-warn">
            <BellDotIcon className="mt-0.5 size-3.5 shrink-0" /> {a.mensaje} Revisa si esto sigue en pie.
          </p>
        ))}

        {campos.length > 0 && (
          <dl className="grid gap-3">
            {campos.map(([k, v]) => (
              <div key={k} className="grid gap-0.5">
                <dt className="text-xs text-muted-foreground">{ETIQUETAS[k] ?? k}</dt>
                <dd className="text-sm">
                  <Valor v={v} />
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="grid gap-1 text-xs">
          <p className="text-muted-foreground">
            Fuente: <span className="text-foreground">{n.fuente}</span> · versión {n.version} · {new Date(n.actualizado).toLocaleString('es')}
          </p>
        </div>

        {padres.length > 0 && (
          <section className="grid gap-1.5" aria-label="Viene de">
            <h3 className="text-xs font-medium text-muted-foreground">Viene de</h3>
            <div className="flex flex-wrap gap-1.5">
              {padres.map((p) => (
                <ChipNodo key={p.id} n={p} todos={h.nodos} onAbrir={h.abrir} />
              ))}
            </div>
          </section>
        )}
        <section className="grid gap-1.5" aria-label="Depende de esto">
          <h3 className="text-xs font-medium text-muted-foreground">Depende de esto</h3>
          {faltaDep ? (
            <p className="text-xs text-mut2">Falta en el backend: {faltaDep}</p>
          ) : dependen === null ? (
            <p className="text-xs text-mut2">Buscando…</p>
          ) : dependen.length ? (
            <div className="flex flex-wrap gap-1.5">
              {dependen.map((p) => (
                <ChipNodo key={p.id} n={p} todos={h.nodos} onAbrir={h.abrir} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-mut2">Nada depende de esto todavía.</p>
          )}
        </section>

        <DialogFooter>
          <Button variant="ghost" onClick={h.cerrarDetalle}>
            Cerrar
          </Button>
          {n.estado !== 'aprobado' && (
            <Button
              onClick={async () => {
                await h.aprobar(n)
              }}
            >
              Aprobar versión {n.version}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
