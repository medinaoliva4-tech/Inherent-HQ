import { GaugeIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { EstadoCuotas, NivelCuota, ProveedorCuota } from '@/lib/cliente'
import { cuandoReinicia, masApretado, nivelDe, UMBRAL_AVISO, ventanaLegible } from '@/lib/cuotas'
import { cn } from '@/lib/utils'

const COLOR: Record<NivelCuota, string> = { ok: 'bg-ok', aviso: 'bg-warn', agotado: 'bg-bad', sin_tope: 'bg-muted-foreground/50' }
const TEXTO: Record<NivelCuota, string> = { ok: 'text-ok', aviso: 'text-warn', agotado: 'text-bad', sin_tope: 'text-muted-foreground' }

function Barra({ pct, nivel }: { pct: number | null; nivel: NivelCuota }) {
  return (
    <div className="relative h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
      {/* marca del 80% */}
      <span className="absolute inset-y-0 w-px bg-foreground/25" style={{ left: `${UMBRAL_AVISO * 100}%` }} />
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-[var(--e-spring)]', COLOR[nivel])}
        style={{ width: pct === null ? '0%' : `${Math.min(100, pct * 100)}%` }}
      />
    </div>
  )
}

/** Detalle de un proveedor: una barra por ventana (5 h, semana, mes, día). */
export function DetalleProveedor({ p }: { p: ProveedorCuota }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-medium">{p.nombre}</span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{p.tipo === 'suscripcion' ? 'suscripción' : p.tipo === 'gratis' ? 'gratis' : p.tipo === 'pago' ? 'por uso' : p.tipo}</span>
      </div>
      {Object.entries(p.ventanas).map(([nombre, w]) => {
        const n = nivelDe(w)
        const cuando = cuandoReinicia(w.reinicia_en)
        const tope = w.topes.llamadas ?? null
        return (
          <div key={nombre} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="text-muted-foreground">{ventanaLegible(nombre)}</span>
              <span className={cn('tabular-nums', TEXTO[n])}>
                {w.pct !== null ? `${Math.round(w.pct * 100)}%` : `${w.llamadas} llamadas`}
                {tope ? <span className="text-muted-foreground"> · {w.llamadas}/{tope}</span> : n === 'sin_tope' ? <span className="text-muted-foreground"> · sin tope conocido</span> : null}
              </span>
            </div>
            <Barra pct={w.pct} nivel={n} />
            {(n === 'aviso' || n === 'agotado') && cuando && <span className="text-[11px] text-muted-foreground">Se libera {cuando}</span>}
          </div>
        )
      })}
    </div>
  )
}

type Props = { estado: EstadoCuotas | null; error: string | null; mock: boolean }

/** Medidor compacto: muestra lo más apretado; al tocarlo, todos los proveedores. */
export function MedidorCuotas({ estado, error, mock }: Props) {
  const peor = estado ? masApretado(estado) : null
  const n = peor ? nivelDe(peor.w) : 'sin_tope'
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Uso y cuotas"
        className="grid w-full gap-1.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="flex items-center gap-1.5 text-xs">
          <GaugeIcon className={cn('size-3.5', TEXTO[n])} />
          <span className="flex-1 truncate text-muted-foreground">
            {error ? 'Cuotas sin conexión' : !peor ? 'Leyendo cuotas…' : n === 'agotado' ? `${peor.p.nombre}: sin cupo` : n === 'aviso' ? `${peor.p.nombre}: ${Math.round((peor.w.pct ?? 0) * 100)}%` : 'Cuotas en orden'}
          </span>
        </span>
        {peor && <Barra pct={peor.w.pct} nivel={n} />}
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="vidrio max-h-[70dvh] w-80 gap-4 overflow-y-auto rounded-xl p-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold">Uso por proveedor</p>
          <p className="text-[11px] text-muted-foreground">avisa al {Math.round(UMBRAL_AVISO * 100)}%</p>
        </div>
        {error && <p className="text-xs text-bad">{error}</p>}
        {estado?.proveedores.map((p) => <DetalleProveedor key={p.id} p={p} />)}
        {mock && <p className="text-[11px] text-muted-foreground">Datos de ejemplo. Con el puente se leen de GET /cuotas.</p>}
      </PopoverContent>
    </Popover>
  )
}
