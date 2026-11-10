import { BotIcon, CheckIcon, CircleDashedIcon, CircleIcon, CopyIcon, FileCodeIcon, ListChecksIcon, PaperclipIcon, ShieldCheckIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from '@/components/ai-elements/confirmation'
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Plan, PlanContent, PlanDescription, PlanFooter, PlanHeader, PlanTitle } from '@/components/ai-elements/plan'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { esImagen } from '@/lib/adjuntos'
import { extraerArtefactos, type Artefacto } from '@/lib/artefactos'
import type { RespuestaPermiso } from '@/lib/eventos'
import type { Mensaje, ParteHerramienta, PartePermiso, PartePlan, PartePregunta, Tarea } from '@/lib/mensajes'
import { entrada } from '@/lib/movimiento'
import { cn } from '@/lib/utils'

const NOMBRES: Record<string, string> = {
  Read: 'Leer',
  Edit: 'Editar',
  MultiEdit: 'Editar',
  Write: 'Escribir',
  Bash: 'Terminal',
  Grep: 'Buscar',
  Glob: 'Buscar archivos',
  TodoWrite: 'Tareas',
  Task: 'Subagente',
  Agent: 'Subagente',
  WebFetch: 'Abrir web',
  WebSearch: 'Buscar en la web',
  NotebookEdit: 'Editar notebook',
}

/** «Leer · src/index.css», «Terminal · npm test»… */
export function tituloHerramienta(p: Pick<ParteHerramienta, 'nombre' | 'entrada'>) {
  const n = NOMBRES[p.nombre] ?? p.nombre.replace(/^mcp__/, '').replace(/__/g, ' · ')
  const e = p.entrada
  const objetivo = e.file_path ?? e.path ?? e.command ?? e.pattern ?? e.url ?? e.query ?? e.description ?? e.archivo
  return typeof objetivo === 'string' && objetivo ? `${n} · ${objetivo.length > 60 ? objetivo.slice(0, 57) + '…' : objetivo}` : n
}

const estadoTool = (p: ParteHerramienta) => (p.estado === 'ejecutando' ? 'input-available' : p.estado === 'error' ? 'output-error' : 'output-available')

export function ListaTareas({ tareas, compacta }: { tareas: Tarea[]; compacta?: boolean }) {
  return (
    <ul className={cn('grid gap-1', !compacta && 'text-sm')} aria-label="Tareas">
      {tareas.map((t, i) => (
        <li key={i} className="flex items-start gap-2">
          {t.status === 'completed' ? (
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-ok" aria-label="Hecha" />
          ) : t.status === 'in_progress' ? (
            <CircleDashedIcon className="mt-0.5 size-4 shrink-0 animate-spin text-foreground [animation-duration:3s]" aria-label="En curso" />
          ) : (
            <CircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Pendiente" />
          )}
          <span className={cn(t.status === 'completed' && 'text-muted-foreground line-through', t.status === 'in_progress' && 'font-medium')}>
            {t.status === 'in_progress' && t.activeForm ? t.activeForm : t.content}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function TarjetaHerramienta({ p, abierta, vieja }: { p: ParteHerramienta; abierta?: boolean; vieja?: boolean }) {
  if (p.nombre === 'TodoWrite' && Array.isArray(p.entrada.todos)) {
    const todos = p.entrada.todos as Tarea[]
    // Las listas viejas se resumen en una línea: solo la última se muestra completa.
    if (vieja) {
      return (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ListChecksIcon className="size-3.5" /> Lista de tareas actualizada · {todos.filter((t) => t.status === 'completed').length}/{todos.length}
        </p>
      )
    }
    return (
      <div className="mb-4 rounded-md border bg-card/60 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ListChecksIcon className="size-3.5" /> Tareas
        </p>
        <ListaTareas tareas={p.entrada.todos as Tarea[]} />
      </div>
    )
  }
  if (p.hijos) return <TarjetaSubagente p={p} abierta={abierta} />
  return (
    <Tool className="bg-card/60" defaultOpen={abierta}>
      <ToolHeader type="dynamic-tool" toolName={p.nombre} title={tituloHerramienta(p)} state={estadoTool(p)} />
      <ToolContent>
        <ToolInput input={p.entrada} />
        <ToolOutput output={p.salida as never} errorText={p.error} />
      </ToolContent>
    </Tool>
  )
}

/** Subagente: su descripción, sus pasos y lo que respondió, dentro de una sola tarjeta. */
export function TarjetaSubagente({ p, abierta }: { p: ParteHerramienta; abierta?: boolean }) {
  const desc = String(p.entrada.description ?? 'Subagente')
  const tipo = typeof p.entrada.subagent_type === 'string' ? p.entrada.subagent_type : undefined
  return (
    <Tool className="bg-card/60" defaultOpen={abierta ?? p.estado === 'ejecutando'}>
      <ToolHeader type="dynamic-tool" toolName="Subagente" title={`Subagente${tipo ? ` (${tipo})` : ''} · ${desc}`} state={estadoTool(p)} />
      <ToolContent className="space-y-2">
        {p.hijos?.length ? (
          <ul className="grid gap-1 border-l-2 pl-3" aria-label="Pasos del subagente">
            {p.hijos.map((h) => (
              <li key={h.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn('size-1.5 rounded-full', h.estado === 'ejecutando' ? 'animate-pulse bg-foreground' : h.estado === 'error' ? 'bg-bad' : 'bg-ok')} />
                <span className="truncate font-mono">{tituloHerramienta(h)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Arrancando…</p>
        )}
        {p.textoHijo && (
          <div className="rounded-md bg-muted/50 p-2 text-sm">
            <MessageResponse>{p.textoHijo}</MessageResponse>
          </div>
        )}
      </ToolContent>
    </Tool>
  )
}

/** Confirmación de permiso: S = sí (esta vez) · N = no · T = sí a todo en esta sesión. */
export function TarjetaPermiso({ p, onResponder }: { p: PartePermiso; onResponder: (r: RespuestaPermiso) => void }) {
  const pendiente = !p.respuesta
  const cmd = typeof p.entrada.command === 'string' ? p.entrada.command : null
  const viejo = typeof p.entrada.old_string === 'string' ? p.entrada.old_string : null
  const nuevo = typeof p.entrada.new_string === 'string' ? p.entrada.new_string : typeof p.entrada.content === 'string' ? p.entrada.content : null
  return (
    <Confirmation
      state={pendiente ? 'approval-requested' : 'approval-responded'}
      approval={pendiente ? { id: p.id } : { id: p.id, approved: p.respuesta !== 'n' }}
      className="vidrio mb-4 border-warn/40"
      role="alertdialog"
      aria-label="Permiso pedido"
    >
      <ConfirmationTitle>
        <ConfirmationRequest>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheckIcon className="size-4 text-warn" />
            <b>{NOMBRES[p.herramienta] ?? p.herramienta}</b>
          </span>{' '}
          quiere hacer esto: {p.descripcion}
        </ConfirmationRequest>
        <ConfirmationAccepted>
          {p.respuesta === 't' ? 'Permitido a todo en esta sesión' : 'Permitido esta vez'}: {p.descripcion}
        </ConfirmationAccepted>
        <ConfirmationRejected>Denegado: {p.descripcion}</ConfirmationRejected>
      </ConfirmationTitle>
      {pendiente && (cmd || nuevo) && (
        <pre className="max-h-48 overflow-auto rounded-md bg-background/70 p-2 font-mono text-xs leading-relaxed">
          {cmd ? (
            <span>$ {cmd}</span>
          ) : (
            <>
              {viejo?.split('\n').map((l, i) => (
                <div key={`v${i}`} className="text-bad">
                  − {l}
                </div>
              ))}
              {nuevo?.split('\n').map((l, i) => (
                <div key={`n${i}`} className="text-ok">
                  + {l}
                </div>
              ))}
            </>
          )}
        </pre>
      )}
      <ConfirmationActions className="flex-wrap">
        <ConfirmationAction variant="outline" onClick={() => onResponder('n')} aria-keyshortcuts="n">
          No <kbd className="ml-1 text-[10px] opacity-60">N</kbd>
        </ConfirmationAction>
        <ConfirmationAction variant="outline" onClick={() => onResponder('t')} aria-keyshortcuts="t">
          Sí a todo <kbd className="ml-1 text-[10px] opacity-60">T</kbd>
        </ConfirmationAction>
        <ConfirmationAction onClick={() => onResponder('s')} aria-keyshortcuts="s">
          Sí <kbd className="ml-1 text-[10px] opacity-60">S</kbd>
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  )
}

/** AskUserQuestion: una o varias preguntas con opciones, y «Otra» para escribir. */
export function TarjetaPregunta({ p, onResponder }: { p: PartePregunta; onResponder: (r: Record<string, string> | null) => void }) {
  const [elegidas, setElegidas] = useState<Record<number, string[]>>({})
  const [otra, setOtra] = useState<Record<number, string>>({})
  const listo = p.preguntas.every((_, i) => (elegidas[i]?.length ?? 0) > 0 || (otra[i] ?? '').trim())
  const responder = () => {
    const r: Record<string, string> = {}
    p.preguntas.forEach((q, i) => {
      const vals = [...(elegidas[i] ?? []), ...((otra[i] ?? '').trim() ? [(otra[i] ?? '').trim()] : [])]
      r[q.question] = vals.join(', ')
    })
    onResponder(r)
  }
  const cerrada = !!p.respuestas || p.omitida
  return (
    <div role="group" aria-label="Pregunta de Claude" className="vidrio mb-4 grid gap-4 rounded-xl p-4">
      {p.preguntas.map((q, i) => (
        <fieldset key={i} className="grid gap-2" disabled={cerrada}>
          <legend className="mb-1 text-sm font-medium">
            {q.header && <span className="mr-2 rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase">{q.header}</span>}
            {q.question}
          </legend>
          {q.options.map((o) => {
            const activa = elegidas[i]?.includes(o.label) ?? false
            const respondida = p.respuestas?.[q.question]?.split(', ').includes(o.label)
            return (
              <label
                key={o.label}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                  (activa || respondida) && 'border-foreground/40 bg-accent',
                  cerrada && 'cursor-default opacity-70',
                )}
              >
                <input
                  type={q.multiSelect ? 'checkbox' : 'radio'}
                  name={`${p.id}-${i}`}
                  className="mt-1 accent-current"
                  checked={cerrada ? !!respondida : activa}
                  onChange={(e) =>
                    setElegidas((s) => {
                      const prev = s[i] ?? []
                      if (!q.multiSelect) return { ...s, [i]: [o.label] }
                      return { ...s, [i]: e.target.checked ? [...prev, o.label] : prev.filter((x) => x !== o.label) }
                    })
                  }
                />
                <span>
                  <span className="font-medium">{o.label}</span>
                  {o.description && <span className="block text-xs text-muted-foreground">{o.description}</span>}
                </span>
              </label>
            )
          })}
          {!cerrada && (
            <input
              type="text"
              placeholder="Otra respuesta…"
              aria-label="Otra respuesta"
              value={otra[i] ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setOtra((s) => ({ ...s, [i]: v }))
                if (!q.multiSelect && v) setElegidas((s) => ({ ...s, [i]: [] }))
              }}
              className="h-9 rounded-lg border bg-background/60 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
        </fieldset>
      ))}
      {cerrada ? (
        <p className="text-xs text-muted-foreground">{p.omitida ? 'Sin responder.' : 'Respondido.'}</p>
      ) : (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onResponder(null)}>
            Ahora no
          </Button>
          <Button size="sm" onClick={responder} disabled={!listo}>
            Responder
          </Button>
        </div>
      )}
    </div>
  )
}

/** ExitPlanMode: el plan propuesto, con aprobar o pedir cambios. */
export function TarjetaPlan({ p, onResponder }: { p: PartePlan; onResponder: (aprobado: boolean, comentario?: string) => void }) {
  const [comentario, setComentario] = useState('')
  const [pidiendo, setPidiendo] = useState(false)
  return (
    <Plan defaultOpen className="vidrio mb-4 gap-3 rounded-xl border-0 py-4" role="group" aria-label="Plan propuesto">
      <PlanHeader className="px-4">
        <div>
          <PlanTitle>Plan propuesto</PlanTitle>
          <PlanDescription>
            {p.decision === 'aprobado'
              ? 'Aprobado: Claude ya puede hacer cambios (con tu permiso).'
              : p.decision === 'cambios'
                ? 'Pediste cambios. Claude ajusta el plan.'
                : 'Claude no toca nada hasta que lo apruebes.'}
          </PlanDescription>
        </div>
      </PlanHeader>
      <PlanContent className="px-4 text-sm">
        <MessageResponse>{p.plan}</MessageResponse>
      </PlanContent>
      {!p.decision && (
        <PlanFooter className="grid gap-2 px-4">
          {pidiendo && (
            <Textarea autoFocus value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="¿Qué cambiarías?" aria-label="Qué cambiarías del plan" className="min-h-16" />
          )}
          <div className="flex flex-wrap justify-end gap-2">
            {pidiendo ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setPidiendo(false)}>
                  Cancelar
                </Button>
                <Button size="sm" variant="outline" onClick={() => onResponder(false, comentario.trim())}>
                  Enviar cambios
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setPidiendo(true)}>
                  Pedir cambios
                </Button>
                <Button size="sm" onClick={() => onResponder(true)}>
                  Aprobar y seguir
                </Button>
              </>
            )}
          </div>
        </PlanFooter>
      )}
    </Plan>
  )
}

function TarjetasArtefacto({ texto, base, onAbrir }: { texto: string; base: string; onAbrir: (a: Artefacto) => void }) {
  const lista = useMemo(() => extraerArtefactos(texto, base), [texto, base])
  if (!lista.length) return null
  return (
    <div className="mt-2 grid gap-2">
      {lista.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onAbrir(a)}
          className="flex items-center gap-3 rounded-xl border bg-card/70 p-3 text-left transition-[background-color,transform] hover:bg-accent/60 active:scale-[0.99]"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-accent">
            <FileCodeIcon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{a.titulo}</span>
            <span className="text-xs text-muted-foreground">{a.tipo === 'html' || a.tipo === 'svg' ? 'Abrir vista previa' : 'Abrir en el panel'}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

type Props = {
  mensaje: Mensaje
  detallada?: boolean
  onPermiso: (permisoId: string, r: RespuestaPermiso) => void
  onPregunta: (parteId: string, preguntas: unknown, r: Record<string, string> | null) => void
  onPlan: (parteId: string, aprobado: boolean, comentario?: string) => void
  onArtefacto: (a: Artefacto) => void
}

function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false)
  return (
    <MessageAction
      tooltip={ok ? 'Copiado' : 'Copiar'}
      label="Copiar respuesta"
      onClick={() => {
        navigator.clipboard?.writeText(texto).then(() => {
          setOk(true)
          setTimeout(() => setOk(false), 1200)
        })
      }}
    >
      {ok ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
    </MessageAction>
  )
}

export function MensajeVista({ mensaje: m, detallada, onPermiso, onPregunta, onPlan, onArtefacto }: Props) {
  if (m.rol === 'usuario') {
    return (
      <motion.div {...entrada}>
        <Message from="user">
          {m.adjuntos?.length ? (
            <ul className="flex flex-wrap justify-end gap-1.5">
              {m.adjuntos.map((a, i) => (
                <li key={`${a.nombre}${i}`} className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs">
                  {esImagen(a) && a.url ? <img src={a.url} alt={a.nombre} className="max-h-24 rounded" /> : <PaperclipIcon className="size-3" />}
                  {!esImagen(a) && a.nombre}
                </li>
              ))}
            </ul>
          ) : null}
          <MessageContent className="bg-user! whitespace-pre-wrap">
            {m.partes.map((p) => (p.tipo === 'texto' ? <span key={p.id}>{p.texto}</span> : null))}
          </MessageContent>
        </Message>
      </motion.div>
    )
  }
  const ultimo = m.partes.length - 1
  const ultimaLista = m.partes.findLast((p) => p.tipo === 'herramienta' && p.nombre === 'TodoWrite')?.id
  const textoCompleto = m.partes.map((p) => (p.tipo === 'texto' ? p.texto : '')).join('\n\n')
  return (
    <Message from="assistant" className="max-w-full">
      {m.partes.map((p, i) => (
        <motion.div key={p.id} {...entrada} className="min-w-0">
          {p.tipo === 'razonamiento' && (
            <Reasoning isStreaming={!p.cerrado} defaultOpen={detallada} className="mb-3">
              <ReasoningTrigger />
              <ReasoningContent>{p.texto}</ReasoningContent>
            </Reasoning>
          )}
          {p.tipo === 'texto' && (
            <>
              <MessageContent className={m.enCurso && i === ultimo ? 'cursor-stream' : undefined}>
                <MessageResponse>{p.texto}</MessageResponse>
              </MessageContent>
              {!m.enCurso && <TarjetasArtefacto texto={p.texto} base={p.id} onAbrir={onArtefacto} />}
            </>
          )}
          {p.tipo === 'herramienta' && <TarjetaHerramienta p={p} abierta={detallada} vieja={p.nombre === 'TodoWrite' && p.id !== ultimaLista} />}
          {p.tipo === 'permiso' && <TarjetaPermiso p={p} onResponder={(r) => onPermiso(p.id, r)} />}
          {p.tipo === 'pregunta' && <TarjetaPregunta p={p} onResponder={(r) => onPregunta(p.id, p.preguntas, r)} />}
          {p.tipo === 'plan' && <TarjetaPlan p={p} onResponder={(a, c) => onPlan(p.id, a, c)} />}
          {p.tipo === 'modo' && (
            <p className="my-2 flex items-center gap-2 text-xs text-muted-foreground" role="status">
              <span className="h-px flex-1 bg-border" />
              <BotIcon className="size-3.5" />
              {p.modo === 'code' ? 'Plan aprobado: ahora puede hacer cambios' : p.modo === 'plan' ? 'Modo plan' : 'Modo chat'}
              <span className="h-px flex-1 bg-border" />
            </p>
          )}
        </motion.div>
      ))}
      {m.enCurso && m.partes.length === 0 && <p className="text-sm text-muted-foreground">Pensando…</p>}
      {m.error && (
        <p role="alert" className="rounded-md bg-bad/10 px-3 py-2 text-sm text-bad">
          {m.error}
        </p>
      )}
      {m.detenido && <p className="text-xs text-muted-foreground">Detenido.</p>}
      {!m.enCurso && (textoCompleto || m.uso) && (
        <div className="flex items-center gap-2">
          {textoCompleto && (
            <MessageActions>
              <Copiar texto={textoCompleto} />
            </MessageActions>
          )}
          {m.uso && (
            <p className="text-[11px] text-muted-foreground">
              {m.uso.modelo} · {m.uso.tokens_entrada.toLocaleString('es')} entrada · {m.uso.tokens_salida.toLocaleString('es')} salida
              {m.duracionMs ? ` · ${(m.duracionMs / 1000).toFixed(1)} s` : ''}
            </p>
          )}
        </div>
      )}
    </Message>
  )
}
