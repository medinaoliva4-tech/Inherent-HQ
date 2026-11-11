import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useHilo } from '@/hooks/use-hilo'
import { TarjetaDecision } from '../hilo/TarjetaDecision'
import { Cabecera, Campo, claseCampo, EstadoCarga } from './comun'

/** Criterios del ICP (diseño §6). */
const CAMPOS: { id: string; etiqueta: string; ayuda?: string; opciones?: { v: string; t: string }[] }[] = [
  { id: 'facturacion', etiqueta: 'Facturación mensual' },
  { id: 'ticket', etiqueta: 'Ticket promedio' },
  { id: 'frecuencia', etiqueta: 'Frecuencia de ventas' },
  { id: 'demanda', etiqueta: 'Demanda', opciones: [{ v: 'alta', t: 'Alta' }, { v: 'media', t: 'Media' }, { v: 'baja', t: 'Baja' }], ayuda: 'Buscamos demanda alta.' },
  { id: 'ciclo', etiqueta: 'Ciclo comercial', opciones: [{ v: 'rapido', t: 'Rápido' }, { v: 'medio', t: 'Medio' }, { v: 'lento', t: 'Lento' }], ayuda: 'Buscamos ciclo rápido.' },
  { id: 'margen', etiqueta: 'Margen', ayuda: 'Suficiente para pagar el producto.' },
  { id: 'capacidad', etiqueta: 'Capacidad' },
  { id: 'decisor', etiqueta: 'Decisor' },
  { id: 'industrias', etiqueta: 'Industrias y perfiles elegidos' },
  { id: 'geografia', etiqueta: 'Dónde vive', ayuda: 'Geografía y canales.' },
]

const texto = (v: unknown) => (typeof v === 'string' ? v : '')

export function PerfilICP() {
  const h = useHilo()
  const nodo = h.nodos.find((n) => n.tipo === 'icp')
  const base = useMemo(() => Object.fromEntries([...CAMPOS.map((c) => [c.id, texto(nodo?.contenido?.[c.id])]), ['regla', texto(nodo?.contenido?.regla)]]) as Record<string, string>, [nodo])
  const [borrador, setBorrador] = useState(base)
  const [titulo, setTitulo] = useState(nodo?.titulo ?? '')
  useEffect(() => {
    setBorrador(base)
    setTitulo(nodo?.titulo ?? '')
  }, [base, nodo?.titulo])
  const cambiado = titulo !== (nodo?.titulo ?? '') || CAMPOS.some((c) => borrador[c.id] !== base[c.id]) || borrador.regla !== base.regla
  const poner = (k: string, v: string) => setBorrador((b) => ({ ...b, [k]: v }))

  const guardar = async () => {
    const contenido = { ...(nodo?.contenido ?? {}), ...borrador, decide: texto(nodo?.contenido?.decide) || 'A quién le vendemos primero.' }
    if (nodo) await h.guardar(nodo.id, { titulo: titulo.trim() || nodo.titulo, contenido })
    else {
      const producto = h.nodos.find((n) => n.tipo === 'producto')
      await h.crear({ tipo: 'icp', titulo: titulo.trim() || 'Cliente ideal', contenido, viene_de: producto ? [producto.id] : [] })
    }
  }

  return (
    <div className="grid gap-4">
      <Cabecera id="icp" />
      <EstadoCarga>
        {nodo && <TarjetaDecision nodo={nodo} />}
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            guardar()
          }}
        >
          <Campo etiqueta="En una línea">
            <input className={claseCampo} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Empresas de 30 a 200 personas en la capital" />
          </Campo>
          <div className="grid gap-3 @md:grid-cols-2">
            {CAMPOS.map((c) => (
              <Campo key={c.id} etiqueta={c.etiqueta} ayuda={c.ayuda}>
                {c.opciones ? (
                  <ToggleGroup
                    value={borrador[c.id] ? [borrador[c.id]] : []}
                    onValueChange={(v: string[]) => poner(c.id, v[0] ?? '')}
                    variant="outline"
                    size="sm"
                    aria-label={c.etiqueta}
                  >
                    {c.opciones.map((o) => (
                      <ToggleGroupItem key={o.v} value={o.v} aria-label={o.t}>
                        {o.t}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                ) : (
                  <input className={claseCampo} value={borrador[c.id]} onChange={(e) => poner(c.id, e.target.value)} />
                )}
              </Campo>
            ))}
          </div>
          <Campo etiqueta="Regla guía (editable por producto)" ayuda="Por ejemplo: «el cliente factura ~10× el precio del producto».">
            <input className={claseCampo} value={borrador.regla} onChange={(e) => poner('regla', e.target.value)} />
          </Campo>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {cambiado && <span className="text-[11px] text-muted-foreground">Al guardar vuelve a hipótesis y avisa a lo que depende de él.</span>}
            <Button type="submit" size="sm" disabled={!cambiado}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </EstadoCarga>
    </div>
  )
}
