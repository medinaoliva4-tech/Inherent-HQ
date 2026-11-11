import { PlusIcon, PrinterIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useHilo } from '@/hooks/use-hilo'
import { cn } from '@/lib/utils'
import { TarjetaDecision } from '../hilo/TarjetaDecision'
import { Cabecera, EstadoCarga } from './comun'

type Bloque = { hora: string; que: string }
type Shot = { plano: string; descripcion: string; hook: string; listo: boolean }
type Item = { texto: string; listo: boolean; costo?: string }
type Hoja = {
  jornada: { fecha: string; lugar: string; llamado: string; bloques: Bloque[] }
  guion: string
  shots: Shot[]
  permisos: Item[]
  compras: Item[]
  hooks: string[]
}

const vacia = (): Hoja => ({ jornada: { fecha: '', lugar: '', llamado: '', bloques: [] }, guion: '', shots: [], permisos: [], compras: [], hooks: [] })

function deNodo(c: Record<string, unknown> | undefined): Hoja {
  const v = vacia()
  if (!c) return v
  const j = (c.jornada ?? {}) as Partial<Hoja['jornada']>
  return {
    jornada: { fecha: j.fecha ?? '', lugar: j.lugar ?? '', llamado: j.llamado ?? '', bloques: Array.isArray(j.bloques) ? j.bloques : [] },
    guion: typeof c.guion === 'string' ? c.guion : '',
    shots: Array.isArray(c.shots) ? (c.shots as Shot[]) : [],
    permisos: Array.isArray(c.permisos) ? (c.permisos as Item[]) : [],
    compras: Array.isArray(c.compras) ? (c.compras as Item[]) : [],
    hooks: Array.isArray(c.hooks) ? (c.hooks as string[]) : [],
  }
}

/** Campo «de papel»: sin caja hasta que lo tocas, para que la hoja se lea como hoja y se pueda escribir encima. */
const papel = 'w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none hover:border-border focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'

function Titulo({ children, onAgregar }: { children: string; onAgregar?: () => void }) {
  return (
    <div className="flex items-center gap-2 border-b pb-1">
      <h3 className="flex-1 text-xs font-semibold tracking-wide uppercase text-muted-foreground">{children}</h3>
      {onAgregar && (
        <Button size="icon-xs" variant="ghost" className="no-imprimir" onClick={onAgregar} aria-label={`Agregar a ${children}`}>
          <PlusIcon />
        </Button>
      )}
    </div>
  )
}

function Check({ marcado, onCambio, etiqueta }: { marcado: boolean; onCambio: (v: boolean) => void; etiqueta: string }) {
  return <input type="checkbox" checked={marcado} onChange={(e) => onCambio(e.target.checked)} aria-label={etiqueta} className="size-4 shrink-0 accent-[var(--ui-ok)]" />
}

/** Production Pre como hoja imprimible y editable: jornada, guion, shot list, permisos, compras y hooks alternos. */
export function ProduccionPre() {
  const h = useHilo()
  const nodo = h.nodos.find((n) => n.tipo === 'pre')
  const base = useMemo(() => deNodo(nodo?.contenido), [nodo])
  const [hoja, setHoja] = useState<Hoja>(base)
  useEffect(() => setHoja(base), [base])
  const cambiado = JSON.stringify(hoja) !== JSON.stringify(base)
  const set = (fn: (h: Hoja) => Hoja) => setHoja((x) => fn(structuredClone(x)))

  const guardar = async () => {
    const contenido = { ...(nodo?.contenido ?? {}), ...hoja, decide: 'Plan de la jornada de grabación.' }
    if (nodo) await h.guardar(nodo.id, { contenido })
    else {
      const piezas = h.nodos.filter((n) => n.tipo === 'pieza').map((n) => n.id)
      await h.crear({ tipo: 'pre', titulo: hoja.jornada.fecha ? `Grabación del ${hoja.jornada.fecha}` : 'Pre-producción', contenido, viene_de: piezas })
    }
  }

  return (
    <div className="grid gap-4">
      <Cabecera id="pre">
        <div className="no-imprimir flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <PrinterIcon /> Imprimir
          </Button>
          <Button size="sm" onClick={guardar} disabled={!cambiado}>
            Guardar
          </Button>
        </div>
      </Cabecera>
      <EstadoCarga>
        {nodo && (
          <div className="no-imprimir">
            <TarjetaDecision nodo={nodo} compacta />
          </div>
        )}
        <article aria-label="Hoja de pre-producción" className="hoja-imprimible grid gap-5 rounded-xl border bg-card p-5 shadow-[var(--ui-sh-2)]">
          <header className="grid gap-1">
            <p className="text-[11px] text-muted-foreground">
              {h.marca?.nombre} · Pre-producción · {nodo ? `v${nodo.version} · ${nodo.estado === 'aprobado' ? 'aprobada' : 'hipótesis'}` : 'nueva'}
            </p>
            <div className="grid gap-1 @md:grid-cols-3">
              {(['fecha', 'lugar', 'llamado'] as const).map((k) => (
                <label key={k} className="grid">
                  <span className="px-1.5 text-[11px] text-muted-foreground">{k === 'llamado' ? 'Llamado' : k === 'fecha' ? 'Fecha' : 'Lugar'}</span>
                  <input className={cn(papel, 'font-medium')} value={hoja.jornada[k]} onChange={(e) => set((x) => ((x.jornada[k] = e.target.value), x))} />
                </label>
              ))}
            </div>
          </header>

          <section className="grid gap-1.5" aria-label="Jornada">
            <Titulo onAgregar={() => set((x) => (x.jornada.bloques.push({ hora: '', que: '' }), x))}>Jornada</Titulo>
            {hoja.jornada.bloques.map((b, i) => (
              <div key={i} className="group/fila flex items-center gap-1">
                <input aria-label="Hora" className={cn(papel, 'w-20 shrink-0 tabular-nums')} value={b.hora} onChange={(e) => set((x) => ((x.jornada.bloques[i].hora = e.target.value), x))} />
                <input aria-label="Qué se hace" className={papel} value={b.que} onChange={(e) => set((x) => ((x.jornada.bloques[i].que = e.target.value), x))} />
                <Button size="icon-xs" variant="ghost" className="no-imprimir opacity-0 group-hover/fila:opacity-100 focus-visible:opacity-100" onClick={() => set((x) => (x.jornada.bloques.splice(i, 1), x))} aria-label="Quitar">
                  <Trash2Icon />
                </Button>
              </div>
            ))}
          </section>

          <section className="grid gap-1.5" aria-label="Guion">
            <Titulo>Guion</Titulo>
            <textarea aria-label="Guion" rows={3} className={cn(papel, 'leading-relaxed')} value={hoja.guion} onChange={(e) => set((x) => ((x.guion = e.target.value), x))} />
          </section>

          <section className="grid gap-1.5" aria-label="Shot list">
            <Titulo onAgregar={() => set((x) => (x.shots.push({ plano: '', descripcion: '', hook: '', listo: false }), x))}>Shot list</Titulo>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-muted-foreground">
                    <th className="w-6 font-normal">#</th>
                    <th className="w-24 font-normal">Plano</th>
                    <th className="font-normal">Toma</th>
                    <th className="font-normal">Hook alterno</th>
                    <th className="w-8 font-normal">✓</th>
                  </tr>
                </thead>
                <tbody>
                  {hoja.shots.map((s, i) => (
                    <tr key={i} className="border-t align-top">
                      <td className="py-1 text-xs text-mut2 tabular-nums">{i + 1}</td>
                      <td>
                        <input aria-label="Plano" className={papel} value={s.plano} onChange={(e) => set((x) => ((x.shots[i].plano = e.target.value), x))} />
                      </td>
                      <td>
                        <input aria-label="Toma" className={papel} value={s.descripcion} onChange={(e) => set((x) => ((x.shots[i].descripcion = e.target.value), x))} />
                      </td>
                      <td>
                        <input aria-label="Hook alterno" className={papel} value={s.hook} onChange={(e) => set((x) => ((x.shots[i].hook = e.target.value), x))} />
                      </td>
                      <td className="py-1.5">
                        <Check etiqueta={`Toma ${i + 1} lista`} marcado={s.listo} onCambio={(v) => set((x) => ((x.shots[i].listo = v), x))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-5 @md:grid-cols-2">
            {(['permisos', 'compras'] as const).map((k) => (
              <section key={k} className="grid content-start gap-1.5" aria-label={k === 'permisos' ? 'Permisos' : 'Compras'}>
                <Titulo onAgregar={() => set((x) => (x[k].push({ texto: '', listo: false, ...(k === 'compras' ? { costo: '' } : {}) }), x))}>{k === 'permisos' ? 'Permisos' : 'Compras'}</Titulo>
                {hoja[k].map((it, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Check etiqueta={it.texto || 'Listo'} marcado={it.listo} onCambio={(v) => set((x) => ((x[k][i].listo = v), x))} />
                    <input aria-label={k === 'permisos' ? 'Permiso' : 'Compra'} className={papel} value={it.texto} onChange={(e) => set((x) => ((x[k][i].texto = e.target.value), x))} />
                    {k === 'compras' && <input aria-label="Costo" className={cn(papel, 'w-24 shrink-0 tabular-nums')} value={it.costo ?? ''} onChange={(e) => set((x) => ((x.compras[i].costo = e.target.value), x))} />}
                  </div>
                ))}
              </section>
            ))}
          </div>

          <section className="grid gap-1.5" aria-label="Hooks alternos">
            <Titulo onAgregar={() => set((x) => (x.hooks.push(''), x))}>Hooks alternos</Titulo>
            {hoja.hooks.map((t, i) => (
              <input key={i} aria-label={`Hook ${i + 1}`} className={papel} value={t} onChange={(e) => set((x) => ((x.hooks[i] = e.target.value), x))} />
            ))}
          </section>
        </article>
      </EstadoCarga>
    </div>
  )
}
