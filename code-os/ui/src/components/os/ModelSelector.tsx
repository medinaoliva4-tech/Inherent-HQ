import { CheckIcon, ChefHatIcon, ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AUTO, COCINEROS, MODELOS_CLAUDE, type Cocinero } from '@/lib/cocina'
import { describirModelo, disponible, NIVELES } from '@/lib/niveles'
import { cn } from '@/lib/utils'

type Props = {
  modeloId: string
  onChange: (id: string) => void
  /** Alias que expone el puente. Sin lista (cargando o sin conexión) no se bloquea nada. */
  disponibles?: string[]
  /** Login de Claude en el servidor: solo informa, el nivel Alto lo usa primero si está activo. */
  claude?: 'activa' | 'inactiva' | 'desconocido'
  abierto?: boolean
  onAbierto?: (v: boolean) => void
}

function Opcion({ activo, deshabilitado, onClick, titulo, nota }: { activo: boolean; deshabilitado: boolean; onClick: () => void; titulo: string; nota: string }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={activo}
      disabled={deshabilitado}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
    >
      <span className="min-w-0 flex-1 truncate">
        {titulo}
        <span className="ml-2 text-xs text-muted-foreground">{deshabilitado ? 'no está en el puente' : nota}</span>
      </span>
      {activo && <CheckIcon className="size-4 shrink-0" />}
    </button>
  )
}

/** Selector por nivel: Alto / Medio / Bajo. «Automático» manda el alias del nivel y LiteLLM elige con respaldos. */
export function ModelSelector({ modeloId, onChange, disponibles, claude = 'desconocido', abierto: abiertoExt, onAbierto }: Props) {
  const [abiertoInt, setAbiertoInt] = useState(false)
  const abierto = abiertoExt ?? abiertoInt
  const setAbierto = onAbierto ?? setAbiertoInt
  const sel = describirModelo(modeloId)
  const auto = modeloId === AUTO
  const elegir = (id: string) => {
    onChange(id)
    setAbierto(false)
  }
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        aria-label="Elegir modelo"
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {auto ? (
          <>
            <ChefHatIcon className="size-3.5" />
            <span className="font-medium text-foreground">Auto</span>
            <span aria-hidden>·</span>
            <span className="max-w-28 truncate">por tarea</span>
          </>
        ) : (
          <>
            <span className="font-medium text-foreground">{sel.nivel.nombre}</span>
            <span aria-hidden>·</span>
            <span className="max-w-28 truncate">{sel.etiqueta}</span>
          </>
        )}
        <ChevronDownIcon className={cn('size-3.5 transition-transform duration-200', abierto && 'rotate-180')} />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="vidrio max-h-[70dvh] w-[min(22rem,calc(100vw-2rem))] gap-1 overflow-y-auto rounded-xl p-1.5">
        <div role="group" aria-label="Auto" className="p-1">
          <Opcion activo={auto} deshabilitado={false} onClick={() => elegir(AUTO)} titulo="Auto" nota="el router elige el nivel por la tarea" />
          <ul className="grid gap-0.5 px-2 pt-1 pb-1 text-[11px] text-muted-foreground">
            {(Object.keys(COCINEROS) as Cocinero[]).map((c) => (
              <li key={c} className="flex items-baseline gap-1.5">
                <span className="text-foreground">{COCINEROS[c].nombre}</span>{' '}
                <span>
                  · {COCINEROS[c].nivel} · esfuerzo {COCINEROS[c].esfuerzo}
                  {claude === 'activa' && ` · ${MODELOS_CLAUDE[c].nombre}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="px-2 text-[11px] leading-snug text-mut2">Si fijas un nivel, el router no se mete.</p>
        </div>
        {NIVELES.map((n) => (
          <div key={n.id} role="group" aria-label={`Nivel ${n.nombre}`} className="p-1">
            <div className="flex items-baseline justify-between gap-2 px-2 pt-1 pb-1">
              <span className="text-xs font-semibold tracking-wide uppercase">{n.nombre}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {n.descripcion} · esfuerzo {n.id === 'alto' ? 'máximo o alto' : n.id === 'medio' ? 'medio' : 'bajo'}
              </span>
            </div>
            <Opcion
              activo={modeloId === n.alias}
              deshabilitado={!disponible(n.alias, disponibles)}
              onClick={() => elegir(n.alias)}
              titulo="Automático"
              nota={n.id === 'alto' ? 'con respaldos en orden' : `${n.modelos.length} modelos con respaldo`}
            />
            {n.modelos.map((m) => (
              <Opcion key={m.id} activo={m.id === modeloId} deshabilitado={!disponible(m.id, disponibles)} onClick={() => elegir(m.id)} titulo={m.nombre} nota={m.nota} />
            ))}
            {n.id === 'alto' && (
              <p className="px-2 pt-1 text-[11px] leading-snug text-muted-foreground">
                Claude con tu suscripción:{' '}
                <span className={cn(claude === 'activa' ? 'text-ok' : claude === 'inactiva' ? 'text-warn' : '')}>
                  {claude === 'activa' ? 'sesión activa' : claude === 'inactiva' ? 'sesión no activa' : 'sin dato del servidor'}
                </span>
                . Se inicia en el servidor, no aquí.
              </p>
            )}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
