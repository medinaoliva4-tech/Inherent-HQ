import { CircleDotIcon, HandIcon, MessageCircleQuestionIcon, PlayIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { MessageResponse } from '@/components/ai-elements/message'
import { Button } from '@/components/ui/button'
import { useHilo } from '@/hooks/use-hilo'
import { AGENTES, agentePorId, type Agente, type Trabajo } from '@/lib/agentes'
import { AREAS, areaDe, type Nodo } from '@/lib/hilo'
import { pendienteDe, type Mensaje, type ParteHerramienta } from '@/lib/mensajes'
import { resortePop } from '@/lib/movimiento'
import { cn } from '@/lib/utils'
import { ChipArea, TarjetaDecision } from '../hilo/TarjetaDecision'

/** Un trabajo vivo = una llamada al subagente (Task) dentro de esta conversación. Sale de los eventos reales del puente. */
export type TrabajoVivo = { id: string; agente: string; descripcion: string; estado: 'ejecutando' | 'listo' | 'error'; documento: string; herramientas: number }

export function trabajosVivos(mensajes: Mensaje[]): TrabajoVivo[] {
  const out: TrabajoVivo[] = []
  for (const m of mensajes) {
    if (m.rol !== 'asistente') continue
    for (const p of m.partes) {
      if (p.tipo !== 'herramienta' || (p.nombre !== 'Task' && p.nombre !== 'Agent')) continue
      const tipo = String((p as ParteHerramienta).entrada?.subagent_type ?? '')
      if (!agentePorId(tipo)) continue
      out.push({ id: p.id, agente: tipo, descripcion: String(p.entrada?.description ?? ''), estado: p.estado, documento: p.textoHijo ?? '', herramientas: p.hijos?.length ?? 0 })
    }
  }
  return out
}

/** Trabajos de EJEMPLO para el portal hasta que el puente exponga los trabajos reales (ceo-os agentes/runs). */
const TRABAJOS_EJEMPLO: Trabajo[] = [
  { id: 'tj-1', agente: 'estrategia', titulo: 'ICP y dolores de Lumbre', etapa: 2, estado: 'en revisión', actualizado: 'hace 3 h' },
  { id: 'tj-2', agente: 'creativo', titulo: 'Ángulos de noviembre', etapa: 1, estado: 'aprobado', actualizado: 'ayer' },
  { id: 'tj-3', agente: 'produccion', titulo: 'Pre del 18 de noviembre', etapa: 0, estado: 'en curso', actualizado: 'hace 20 min' },
]

/** Qué decisiones aprobadas recibe cada agente como contexto (lo de su área de arriba). */
function contextoDe(a: Agente, nodos: Nodo[]): Nodo[] {
  const desde: Record<string, string[]> = { estrategia: ['strategy'], creativo: ['strategy'], produccion: ['creative'], diseno: ['creative'] }
  const tipos = a.id === 'estrategia' ? ['producto', 'icp'] : a.id === 'creativo' ? ['dolor', 'deseo', 'historia'] : ['campana', 'idea', 'angulo']
  return nodos.filter((n) => n.estado === 'aprobado' && desde[a.id]?.includes(areaDe(n)) && tipos.includes(n.tipo)).slice(0, 4)
}

function etapaActual(a: Agente, vivos: TrabajoVivo[]) {
  const ultimo = vivos[vivos.length - 1]
  if (!ultimo) return -1
  const i = a.etapas.findIndex((e) => ultimo.descripcion.toLowerCase().includes(e.nombre.toLowerCase()))
  return i >= 0 ? i : 0
}

type Props = {
  mensajes: Mensaje[]
  /** Agentes del rol primero. */
  orden: string[]
  activo: string
  onActivo: (id: string) => void
  /** Start: pone `@agente ` en la caja del chat (el portal no arranca trabajos; el chat sí, con lo hablado). */
  onEmpezar: (a: Agente) => void
  mock: boolean
}

export function PortalAgentes({ mensajes, orden, activo, onActivo, onEmpezar, mock }: Props) {
  const h = useHilo()
  const vivos = trabajosVivos(mensajes)
  const lista = [...AGENTES].sort((a, b) => (orden.indexOf(a.id) + 1 || 99) - (orden.indexOf(b.id) + 1 || 99))
  const a = agentePorId(activo) ?? lista[0]
  const susVivos = vivos.filter((v) => v.agente === a.id)
  const enVivo = susVivos[susVivos.length - 1]
  const etapa = etapaActual(a, susVivos)
  const pendiente = pendienteDe(mensajes)
  const contexto = contextoDe(a, h.nodos)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 p-4">
      <div role="tablist" aria-label="Agentes" className="flex flex-wrap gap-1.5">
        {lista.map((x) => {
          const vivo = vivos.some((v) => v.agente === x.id)
          const corriendo = vivos.some((v) => v.agente === x.id && v.estado === 'ejecutando')
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={x.id === a.id}
              onClick={() => onActivo(x.id)}
              className={cn('relative isolate flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors', x.id === a.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground', !orden.includes(x.id) && 'opacity-70')}
            >
              {x.id === a.id && <motion.span layoutId="agente-activo" className="absolute inset-0 -z-10 rounded-full bg-accent" transition={resortePop} />}
              <span className="size-2 rounded-full" style={{ background: AREAS[x.area].color }} aria-hidden />
              @{x.id}
              {vivo && <span className={cn('size-1.5 rounded-full bg-foreground', corriendo && 'animate-pulse')} aria-label={corriendo ? 'trabajando' : 'activo en este chat'} />}
            </button>
          )
        })}
      </div>

      <header className="grid gap-1">
        <ChipArea area={a.area}>{AREAS[a.area].nombre}</ChipArea>
        <div className="flex items-start gap-2">
          <div className="grid min-w-0 flex-1 gap-0.5">
            <h2 className="text-base font-semibold tracking-tight">{a.nombre}</h2>
            <p className="text-xs text-muted-foreground">{a.descripcion}</p>
          </div>
          <Button size="sm" onClick={() => onEmpezar(a)} title={`Escribe @${a.id} en el chat con lo que necesitas`}>
            <PlayIcon /> Start
          </Button>
        </div>
      </header>

      {enVivo && (
        <section aria-label={`Trabajo en vivo de ${a.nombre}`} className="grid gap-3 rounded-xl border bg-card p-3">
          <div className="flex items-center gap-2 text-xs">
            <CircleDotIcon className={cn('size-3.5', enVivo.estado === 'ejecutando' ? 'animate-pulse text-warn' : 'text-ok')} />
            <span className="font-medium">{enVivo.estado === 'ejecutando' ? 'Trabajando' : enVivo.estado === 'error' ? 'Falló' : 'Listo para revisar'}</span>
            <span className="text-muted-foreground">
              · etapa {etapa + 1}/{a.etapas.length}: {a.etapas[etapa]?.nombre}
            </span>
            <span className="ml-auto text-mut2 tabular-nums">{enVivo.herramientas} {enVivo.herramientas === 1 ? 'paso' : 'pasos'}</span>
          </div>
          {pendiente && (
            <p className="flex items-center gap-2 rounded-lg bg-warn/10 px-2.5 py-1.5 text-xs text-warn">
              <MessageCircleQuestionIcon className="size-3.5" /> Te hizo una pregunta: respóndela en el chat.
            </p>
          )}
          <div className="max-h-80 overflow-y-auto rounded-lg bg-background/50 p-3 text-sm [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm">
            {enVivo.documento ? <MessageResponse>{enVivo.documento}</MessageResponse> : <p className="text-muted-foreground">El documento aparece aquí mientras se escribe…</p>}
          </div>
        </section>
      )}

      <section aria-label="Workflow" className="grid gap-1.5">
        <h3 className="text-sm font-medium">Workflow</h3>
        <ol className="grid gap-1">
          {a.etapas.map((e, i) => (
            <li key={e.nombre} className={cn('flex items-start gap-2 rounded-lg px-2 py-1.5', i === etapa && 'bg-accent/60')}>
              <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[11px] tabular-nums', i < etapa && 'border-ok/50 text-ok', i === etapa && 'border-foreground/50')}>{i + 1}</span>
              <span className="grid min-w-0 gap-0.5">
                <span className="text-sm">{e.nombre}</span>
                <span className="text-xs text-muted-foreground">{e.entrega}</span>
                {e.aporte && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <HandIcon className="size-3" /> Pide tu aporte: «{e.aporte}»
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-mut2">Nada pasa a la siguiente etapa sin que alguien lea y apruebe.</p>
      </section>

      <section aria-label="Habilidades" className="grid gap-1.5">
        <h3 className="text-sm font-medium">Habilidades</h3>
        <ul className="flex flex-wrap gap-1.5">
          {a.habilidades.map((x) => (
            <li key={x} className="rounded-full bg-muted px-2.5 py-1 text-xs">
              {x}
            </li>
          ))}
        </ul>
      </section>

      {contexto.length > 0 && (
        <section aria-label="Contexto que recibe" className="grid gap-1.5">
          <h3 className="text-sm font-medium">Lo que recibe (aprobado)</h3>
          {contexto.map((n) => (
            <TarjetaDecision key={n.id} nodo={n} compacta />
          ))}
        </section>
      )}

      <section aria-label="Trabajos" className="grid gap-1.5">
        <h3 className="text-sm font-medium">Trabajos</h3>
        <ul className="grid gap-1">
          {susVivos.map((v) => (
            <li key={v.id} className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-xs">
              <span className="min-w-0 flex-1 truncate">{v.descripcion || 'Trabajo en este chat'}</span>
              <span className="text-muted-foreground">{v.estado === 'ejecutando' ? 'en curso' : 'en este chat'}</span>
            </li>
          ))}
          {mock &&
            TRABAJOS_EJEMPLO.filter((t) => t.agente === a.id).map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-lg border border-dashed px-2.5 py-1.5 text-xs">
                <span className="min-w-0 flex-1 truncate">{t.titulo}</span>
                <span className="text-muted-foreground">
                  {t.estado} · {t.actualizado}
                </span>
              </li>
            ))}
          {!susVivos.length && !mock && <li className="text-xs text-muted-foreground">Sin trabajos en este chat. Los del equipo llegan cuando el puente exponga los trabajos.</li>}
        </ul>
        {mock && <p className="text-[11px] text-mut2">Los trabajos con borde punteado son de ejemplo.</p>}
      </section>
    </div>
  )
}
