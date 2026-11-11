import { PlusIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useHilo } from '@/hooks/use-hilo'
import type { TipoNodo } from '@/lib/hilo'
import { TarjetaDecision } from '../hilo/TarjetaDecision'
import { Cabecera, Campo, claseCampo, EstadoCarga } from './comun'

/** Agregar un dolor o deseo: nace como hipótesis y viene del ICP. */
function Agregar({ tipo }: { tipo: 'dolor' | 'deseo' }) {
  const h = useHilo()
  const [abierto, setAbierto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  if (!abierto)
    return (
      <Button size="xs" variant="ghost" className="justify-self-start text-muted-foreground" onClick={() => setAbierto(true)}>
        <PlusIcon /> Agregar {tipo}
      </Button>
    )
  return (
    <form
      className="grid gap-2 rounded-xl border border-dashed p-3"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!titulo.trim()) return
        const icp = h.nodos.find((n) => n.tipo === 'icp')
        const x = await h.crear({ tipo, titulo, contenido: { texto, decide: texto.split('\n')[0] }, viene_de: icp ? [icp.id] : [] })
        if (x) {
          setTitulo('')
          setTexto('')
          setAbierto(false)
        }
      }}
    >
      <input autoFocus aria-label={`Nuevo ${tipo}`} className={claseCampo} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={tipo === 'dolor' ? 'Lo que le duele, en sus palabras' : 'Lo que desea, en sus palabras'} />
      <textarea aria-label="Detalle" className={claseCampo} rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="De dónde sale (entrevista, reseña…)" />
      <div className="flex justify-end gap-1.5">
        <Button type="button" size="xs" variant="ghost" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
        <Button type="submit" size="xs" disabled={!titulo.trim()}>
          Guardar como hipótesis
        </Button>
      </div>
    </form>
  )
}

function Lista({ tipo, titulo }: { tipo: TipoNodo & ('dolor' | 'deseo'); titulo: string }) {
  const h = useHilo()
  const lista = h.nodos.filter((n) => n.tipo === tipo)
  return (
    <section aria-label={titulo} className="grid gap-2">
      <h3 className="text-sm font-medium">
        {titulo} <span className="text-mut2">· {lista.length}</span>
      </h3>
      {lista.map((n) => (
        <TarjetaDecision key={n.id} nodo={n} compacta />
      ))}
      <Agregar tipo={tipo} />
    </section>
  )
}

const HISTORIA: { id: string; etiqueta: string; ayuda: string }[] = [
  { id: 'villano', etiqueta: 'Villano', ayuda: 'Lo que le complica la vida (no una persona).' },
  { id: 'heroe', etiqueta: 'Héroe', ayuda: 'El cliente, no la marca.' },
  { id: 'guia', etiqueta: 'Guía', ayuda: 'La marca: cómo lo ayuda.' },
  { id: 'plan', etiqueta: 'Plan', ayuda: 'Tres pasos claros.' },
  { id: 'exito', etiqueta: 'Éxito', ayuda: 'Cómo se ve cuando sale bien.' },
  { id: 'fracaso', etiqueta: 'Fracaso', ayuda: 'Lo que pasa si no hace nada.' },
]

function Historia() {
  const h = useHilo()
  const nodo = h.nodos.find((n) => n.tipo === 'historia')
  const base = useMemo(() => Object.fromEntries(HISTORIA.map((c) => [c.id, typeof nodo?.contenido?.[c.id] === 'string' ? (nodo.contenido[c.id] as string) : ''])), [nodo])
  const [b, setB] = useState(base)
  useEffect(() => setB(base), [base])
  const cambiado = HISTORIA.some((c) => b[c.id] !== base[c.id])
  return (
    <section aria-label="Historia villano-héroe" className="grid gap-3">
      <h3 className="text-sm font-medium">Historia villano-héroe</h3>
      {nodo && <TarjetaDecision nodo={nodo} compacta />}
      <div className="grid gap-3 @md:grid-cols-2">
        {HISTORIA.map((c) => (
          <Campo key={c.id} etiqueta={c.etiqueta} ayuda={c.ayuda}>
            <textarea rows={2} className={claseCampo} value={b[c.id]} onChange={(e) => setB((x) => ({ ...x, [c.id]: e.target.value }))} />
          </Campo>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!cambiado}
          onClick={async () => {
            const contenido = { ...(nodo?.contenido ?? {}), ...b, decide: 'La historia que cuentan todas las piezas.' }
            if (nodo) await h.guardar(nodo.id, { contenido })
            else {
              const origen = h.nodos.filter((n) => (n.tipo === 'dolor' || n.tipo === 'deseo') && n.estado === 'aprobado').map((n) => n.id).slice(0, 2)
              await h.crear({ tipo: 'historia', titulo: b.heroe ? `La historia de ${b.heroe}` : 'Historia villano-héroe', contenido, viene_de: origen })
            }
          }}
        >
          Guardar historia
        </Button>
      </div>
    </section>
  )
}

export function Dolores() {
  return (
    <div className="grid gap-5">
      <Cabecera id="dolores" />
      <EstadoCarga>
        <div className="grid gap-5 @lg:grid-cols-2">
          <Lista tipo="dolor" titulo="Dolores" />
          <Lista tipo="deseo" titulo="Deseos" />
        </div>
        <Historia />
      </EstadoCarga>
    </div>
  )
}
