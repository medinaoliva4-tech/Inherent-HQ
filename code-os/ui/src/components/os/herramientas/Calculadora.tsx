import { GaugeIcon, RefreshCwIcon, SparklesIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHilo } from '@/hooks/use-hilo'
import { aplicarCalibracion, calcularInbound, calcularOutbound, inboundPorDefecto, TEXTO_OUTBOUND, type EntradaInbound, type EntradaOutbound, type Tasa } from '@/lib/calculadora'
import { NoDisponible } from '@/lib/cliente'
import { cn } from '@/lib/utils'
import { TarjetaDecision } from '../hilo/TarjetaDecision'
import { Cabecera, Campo, claseCampo, EstadoCarga, Segmentado } from './comun'

const fmt = (n: number) => n.toLocaleString('es')
const pct = (x: number, d = 1) => `${(x * 100).toLocaleString('es', { maximumFractionDigits: d })} %`
const primero = (v: number | readonly number[]) => (Array.isArray(v) ? v[0] : (v as number))

/** Conversión de partida que sugiere el agente según si la oferta ya se probó. Siempre hipótesis, con fuente. */
const SUGERENCIA = {
  si: { valor: 0.02, fuente: 'Referencia de outbound B2B con oferta probada [hipótesis · ejemplo]' },
  no: { valor: 0.01, fuente: 'Referencia de outbound B2B sin casos todavía [hipótesis · ejemplo]' },
}

function Fila({ etiqueta, valor, children }: { etiqueta: string; valor: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{etiqueta}</span>
        <span className="text-sm text-muted-foreground tabular-nums">{valor}</span>
      </div>
      {children}
    </div>
  )
}

function Outbound() {
  const h = useHilo()
  const nodo = h.nodos.find((n) => n.tipo === 'adquisicion')
  const guardado = nodo?.contenido?.outbound as Partial<EntradaOutbound> | undefined
  const [e, setE] = useState<EntradaOutbound>({ meta: 5, conversion: 0.01, probabilidad: 0.95, semanas: 4, ...guardado })
  const [probada, setProbada] = useState<'si' | 'no'>('no')
  // Respuesta inmediata: se calcula aquí con la misma fórmula del backend; al guardar, manda el servidor.
  const r = useMemo(() => calcularOutbound(e), [e])
  const poner = (c: Partial<EntradaOutbound>) => setE((x) => ({ ...x, ...c }))
  const sug = SUGERENCIA[probada]

  const guardar = async () => {
    let resultado = r
    try {
      resultado = await h.cliente.calcOutbound(e)
    } catch {
      /* se queda el cálculo local (misma fórmula) */
    }
    const contenido = { ...(nodo?.contenido ?? {}), decide: 'Cuántas empresas hay que prospectar para cerrar la meta.', outbound: e, resultado }
    const titulo = `Outbound: ${e.meta} clientes en ${e.semanas} semanas`
    if (nodo) await h.guardar(nodo.id, { titulo, contenido })
    else {
      const icp = h.nodos.find((n) => n.tipo === 'icp')
      await h.crear({ tipo: 'adquisicion', titulo, contenido, viene_de: icp ? [icp.id] : [] })
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 rounded-xl border bg-card p-4">
        <Fila etiqueta="Clientes meta" valor={String(e.meta)}>
          <Slider value={[e.meta]} min={1} max={30} step={1} onValueChange={(v) => poner({ meta: primero(v) })} aria-label="Clientes meta" />
        </Fila>
        <Fila etiqueta="Conversión prospecto → cliente" valor={pct(e.conversion)}>
          <Slider value={[Math.round(e.conversion * 1000)]} min={1} max={100} step={1} onValueChange={(v) => poner({ conversion: primero(v) / 1000 })} aria-label="Conversión prospecto a cliente" />
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2">
            <span className="text-xs text-muted-foreground">¿Oferta comprobada?</span>
            <Segmentado etiqueta="¿Oferta comprobada?" valor={probada} onCambio={setProbada} opciones={[{ v: 'si', t: 'Sí' }, { v: 'no', t: 'No' }]} />
            <span className="flex min-w-0 flex-1 items-center gap-1 text-xs text-muted-foreground">
              <SparklesIcon className="size-3 shrink-0" />
              <span className="truncate" title={sug.fuente}>
                El agente sugiere {pct(sug.valor)} · {sug.fuente}
              </span>
            </span>
            <Button size="xs" variant="outline" onClick={() => poner({ conversion: sug.valor })} disabled={e.conversion === sug.valor}>
              Usar
            </Button>
          </div>
        </Fila>
        <Fila etiqueta="Probabilidad objetivo" valor={pct(e.probabilidad, 0)}>
          <Segmentado
            etiqueta="Probabilidad objetivo"
            valor={e.probabilidad}
            onCambio={(v) => poner({ probabilidad: v })}
            opciones={[0.8, 0.9, 0.95, 0.99].map((v) => ({ v, t: pct(v, 0) }))}
          />
        </Fila>
        <Fila etiqueta="Plazo de prospección" valor={`${e.semanas} semanas`}>
          <Segmentado etiqueta="Plazo de prospección" valor={e.semanas} onCambio={(v) => poner({ semanas: v })} opciones={[1, 2, 4, 8, 12].map((v) => ({ v, t: `${v} sem` }))} />
        </Fila>
      </div>

      <section aria-label="Resultado outbound" aria-live="polite" className="grid gap-2 rounded-xl border bg-card p-5 text-center">
        {r ? (
          <>
            <p className="text-xs text-muted-foreground">Prospectos calificados necesarios</p>
            <p className="text-5xl font-semibold tracking-tight tabular-nums" data-testid="prospectos">
              {fmt(r.prospectos)}
            </p>
            <p className="text-sm tabular-nums">
              <strong>{fmt(r.porSemana)}</strong> por semana · <strong>{fmt(r.porDiaHabil)}</strong> por día hábil
            </p>
          </>
        ) : (
          <p className="text-sm text-bad">Con esa conversión no se alcanza la meta. Sube la conversión o baja la probabilidad.</p>
        )}
        <p className="mx-auto max-w-md text-xs text-balance text-muted-foreground">{TEXTO_OUTBOUND}</p>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-[11px] text-muted-foreground">Outbound no se calibra con métricas: lo ajustas tú.</span>
        <Button size="sm" onClick={guardar} disabled={!r}>
          Guardar en el perfil
        </Button>
      </div>
    </div>
  )
}

function Origen({ t }: { t: Tasa }) {
  return t.origen.tipo === 'zernio' ? (
    <span className="rounded-full bg-ok/12 px-1.5 text-[10px] font-medium text-ok" title={`${t.origen.desde} · ${t.origen.muestra ?? ''}`}>
      Zernio
    </span>
  ) : (
    <span className="rounded-full border px-1.5 text-[10px] text-muted-foreground" title="Tasa supuesta: se reemplaza al calibrar">
      supuesto
    </span>
  )
}

function CampoTasa({ etiqueta, t, onCambio, unidad = '%' }: { etiqueta: string; t: Tasa; onCambio: (v: number) => void; unidad?: '%' | 'USD' }) {
  const mostrado = unidad === '%' ? Math.round(t.valor * 10000) / 100 : t.valor
  return (
    <label className="grid gap-1">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {etiqueta} <Origen t={t} />
      </span>
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          className={cn(claseCampo, 'tabular-nums')}
          value={mostrado}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v)) onCambio(unidad === '%' ? v / 100 : v)
          }}
        />
        <span className="text-xs text-muted-foreground">{unidad}</span>
      </span>
    </label>
  )
}

function Inbound() {
  const h = useHilo()
  const angulos = h.nodos.filter((n) => n.tipo === 'angulo' && n.estado === 'aprobado').length
  const [e, setE] = useState<EntradaInbound>(() => ({ ...inboundPorDefecto(), angulos }))
  const [calibrando, setCalibrando] = useState(false)
  const [falta, setFalta] = useState<string | null>(null)
  useEffect(() => setE((x) => ({ ...x, angulos })), [angulos])
  const r = useMemo(() => calcularInbound(e), [e])
  const tasa = (k: 'ctr' | 'clicALead' | 'leadACliente' | 'engagement' | 'cpm') => (v: number) => setE((x) => ({ ...x, [k]: { valor: v, origen: { tipo: 'supuesto' } } }))

  const calibrar = async () => {
    setCalibrando(true)
    setFalta(null)
    try {
      const cal = await h.cliente.calibrar(h.clienteId)
      setE((x) => aplicarCalibracion(x, cal))
    } catch (err) {
      setFalta(err instanceof NoDisponible ? err.que : err instanceof Error ? err.message : 'No se pudo calibrar')
    } finally {
      setCalibrando(false)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">Inbound sí se calibra: las tasas reales de Zernio reemplazan a las supuestas y queda marcado de dónde vino cada número.</p>
          <Button size="sm" variant="outline" onClick={calibrar} disabled={calibrando}>
            <RefreshCwIcon className={cn(calibrando && 'animate-spin')} /> Calibrar con Zernio
          </Button>
        </div>
        {falta && <p className="text-xs text-warn">Falta en el backend: {falta}</p>}
        <div className="grid gap-3 @md:grid-cols-2">
          <Campo etiqueta="Clientes (ventas) meta">
            <input type="number" min={1} className={cn(claseCampo, 'tabular-nums')} value={e.meta} onChange={(x) => setE((y) => ({ ...y, meta: Math.max(0, Number(x.target.value) || 0) }))} />
          </Campo>
          <CampoTasa etiqueta="Alcance → clic" t={e.ctr} onCambio={tasa('ctr')} />
          <CampoTasa etiqueta="Clic → lead" t={e.clicALead} onCambio={tasa('clicALead')} />
          <CampoTasa etiqueta="Lead → cliente" t={e.leadACliente} onCambio={tasa('leadACliente')} />
          <CampoTasa etiqueta="Engagement objetivo" t={e.engagement} onCambio={tasa('engagement')} />
          <CampoTasa etiqueta="CPM de referencia" t={e.cpm} onCambio={tasa('cpm')} unidad="USD" />
          <Campo etiqueta="Presupuesto disponible (USD)">
            <input type="number" min={0} className={cn(claseCampo, 'tabular-nums')} value={e.presupuesto} onChange={(x) => setE((y) => ({ ...y, presupuesto: Math.max(0, Number(x.target.value) || 0) }))} />
          </Campo>
          <Campo etiqueta="Segmentación">
            <input className={claseCampo} value={e.segmentacion} placeholder="Ciudad, cargo, intereses…" onChange={(x) => setE((y) => ({ ...y, segmentacion: x.target.value }))} />
          </Campo>
        </div>
      </div>
      <section aria-label="Resultado inbound" aria-live="polite" className="grid gap-3 rounded-xl border bg-card p-4">
        {r ? (
          <>
            <dl className="grid grid-cols-2 gap-3 @md:grid-cols-3">
              {[
                ['Alcance', fmt(r.alcance)],
                ['Impresiones', fmt(r.impresiones)],
                ['Clics', fmt(r.clics)],
                ['Leads', fmt(r.leads)],
                ['Presupuesto estimado', `$${fmt(r.presupuestoEstimado)}`],
                ['Reels de prueba', String(r.reelsPrueba)],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-0.5">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-xl font-semibold tracking-tight tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <p className={cn('text-xs', r.diferencia < 0 ? 'text-warn' : 'text-muted-foreground')}>
              {r.diferencia < 0 ? `Faltan $${fmt(-r.diferencia)} de presupuesto para la meta.` : `Sobran $${fmt(r.diferencia)} del presupuesto disponible.`} Reels de prueba: uno por ángulo aprobado del tablero (mínimo 3).
            </p>
          </>
        ) : (
          <p className="text-sm text-bad">Revisa las tasas: van de 0 a 100 %.</p>
        )}
      </section>
    </div>
  )
}

export function Calculadora() {
  const h = useHilo()
  const nodo = h.nodos.find((n) => n.tipo === 'adquisicion')
  return (
    <div className="grid gap-4">
      <Cabecera id="adquisicion">
        <GaugeIcon className="size-5 text-muted-foreground" aria-hidden />
      </Cabecera>
      <EstadoCarga>
        {nodo && <TarjetaDecision nodo={nodo} compacta />}
        <Tabs defaultValue="outbound" className="gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="outbound">Outbound</TabsTrigger>
            <TabsTrigger value="inbound">Inbound</TabsTrigger>
          </TabsList>
          <TabsContent value="outbound">
            <Outbound />
          </TabsContent>
          <TabsContent value="inbound">
            <Inbound />
          </TabsContent>
        </Tabs>
      </EstadoCarga>
    </div>
  )
}
