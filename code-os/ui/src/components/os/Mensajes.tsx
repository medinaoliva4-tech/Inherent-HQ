import { PaperclipIcon } from 'lucide-react'
import { motion } from 'motion/react'
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from '@/components/ai-elements/confirmation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import type { RespuestaPermiso } from '@/lib/eventos'
import type { Mensaje, ParteHerramienta, PartePermiso } from '@/lib/mensajes'
import { entrada } from '@/lib/movimiento'

export function TarjetaHerramienta({ p }: { p: ParteHerramienta }) {
  const state = p.estado === 'ejecutando' ? 'input-available' : p.estado === 'error' ? 'output-error' : 'output-available'
  return (
    <Tool className="bg-card/60">
      <ToolHeader type="dynamic-tool" toolName={p.nombre} state={state} />
      <ToolContent>
        <ToolInput input={p.entrada} />
        <ToolOutput output={p.salida as never} errorText={p.error} />
      </ToolContent>
    </Tool>
  )
}

/** Confirmación de permiso: S = sí (esta vez) · N = no · T = sí, siempre en esta sesión. */
export function TarjetaPermiso({ p, onResponder }: { p: PartePermiso; onResponder: (r: RespuestaPermiso) => void }) {
  const pendiente = !p.respuesta
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
          <b>{p.herramienta}</b> quiere hacer algo: {p.descripcion}
        </ConfirmationRequest>
        <ConfirmationAccepted>
          {p.respuesta === 't' ? 'Permitido siempre en esta sesión' : 'Permitido esta vez'}: {p.descripcion}
        </ConfirmationAccepted>
        <ConfirmationRejected>Denegado: {p.descripcion}</ConfirmationRejected>
      </ConfirmationTitle>
      <ConfirmationActions>
        <ConfirmationAction variant="outline" onClick={() => onResponder('n')} aria-keyshortcuts="n">
          No <kbd className="ml-1 text-[10px] opacity-60">N</kbd>
        </ConfirmationAction>
        <ConfirmationAction variant="outline" onClick={() => onResponder('t')} aria-keyshortcuts="t">
          Sí, siempre <kbd className="ml-1 text-[10px] opacity-60">T</kbd>
        </ConfirmationAction>
        <ConfirmationAction onClick={() => onResponder('s')} aria-keyshortcuts="s">
          Sí <kbd className="ml-1 text-[10px] opacity-60">S</kbd>
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  )
}

type Props = { mensaje: Mensaje; onPermiso: (permisoId: string, r: RespuestaPermiso) => void }

export function MensajeVista({ mensaje: m, onPermiso }: Props) {
  if (m.rol === 'usuario') {
    return (
      <motion.div {...entrada}>
        <Message from="user">
          {m.adjuntos?.length ? (
            <ul className="flex flex-wrap justify-end gap-1.5">
              {m.adjuntos.map((a) => (
                <li key={a.nombre} className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs">
                  <PaperclipIcon className="size-3" />
                  {a.nombre}
                </li>
              ))}
            </ul>
          ) : null}
          <MessageContent className="bg-user!">
            {m.partes.map((p) => (p.tipo === 'texto' ? <span key={p.id}>{p.texto}</span> : null))}
          </MessageContent>
        </Message>
      </motion.div>
    )
  }
  const ultimo = m.partes.length - 1
  return (
    <Message from="assistant" className="max-w-full">
      {m.partes.map((p, i) => (
        <motion.div key={p.id} {...entrada} className="min-w-0">
          {p.tipo === 'razonamiento' && (
            <Reasoning isStreaming={!p.cerrado} className="mb-3">
              <ReasoningTrigger />
              <ReasoningContent>{p.texto}</ReasoningContent>
            </Reasoning>
          )}
          {p.tipo === 'texto' && (
            <MessageContent className={m.enCurso && i === ultimo ? 'cursor-stream' : undefined}>
              <MessageResponse>{p.texto}</MessageResponse>
            </MessageContent>
          )}
          {p.tipo === 'herramienta' && <TarjetaHerramienta p={p} />}
          {p.tipo === 'permiso' && <TarjetaPermiso p={p} onResponder={(r) => onPermiso(p.id, r)} />}
        </motion.div>
      ))}
      {m.enCurso && m.partes.length === 0 && <p className="text-sm text-muted-foreground">Pensando…</p>}
      {m.error && (
        <p role="alert" className="rounded-md bg-bad/10 px-3 py-2 text-sm text-bad">
          {m.error}
        </p>
      )}
      {m.detenido && <p className="text-xs text-muted-foreground">Detenido.</p>}
      {m.uso && !m.enCurso && (
        <p className="text-[11px] text-muted-foreground">
          {m.uso.modelo} · {m.uso.tokens_entrada.toLocaleString('es')} entrada · {m.uso.tokens_salida.toLocaleString('es')} salida
        </p>
      )}
    </Message>
  )
}
