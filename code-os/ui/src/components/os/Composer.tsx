import { AtSignIcon, BotIcon, FileIcon, FilePenLineIcon, SparklesIcon, GhostIcon, ListChecksIcon, PaperclipIcon, ShieldCheckIcon, SlashIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { toast } from 'sonner'
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  usePromptInputController,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import { esImagen, MAX_ARCHIVO_BYTES } from '@/lib/adjuntos'
import { filtrarComandos, mencionEnCurso, type Comando } from '@/lib/comandos'
import type { Adjunto, ModoSesion } from '@/lib/eventos'
import { resortePop } from '@/lib/movimiento'
import { cn } from '@/lib/utils'
import { ModelSelector } from './ModelSelector'

function Adjuntos() {
  const { files, remove } = usePromptInputAttachments()
  if (!files.length) return null
  return (
    <PromptInputHeader>
      <ul className="flex flex-wrap gap-1.5" aria-label="Adjuntos">
        {files.map((f) => {
          const imagen = esImagen({ tipo: f.mediaType })
          return (
            <li key={f.id} className="flex items-center gap-1.5 rounded-md bg-accent py-1 pr-1 pl-1 text-xs">
              {imagen && f.url ? <img src={f.url} alt="" className="size-6 rounded object-cover" /> : <FileIcon className="ml-1 size-3.5" />}
              <span className="max-w-40 truncate">{f.filename ?? 'archivo'}</span>
              <button type="button" aria-label={`Quitar ${f.filename ?? 'archivo'}`} onClick={() => remove(f.id)} className="rounded p-0.5 hover:bg-background/60">
                <XIcon className="size-3" />
              </button>
            </li>
          )
        })}
      </ul>
    </PromptInputHeader>
  )
}

function BotonAdjuntar() {
  const { openFileDialog } = usePromptInputAttachments()
  return (
    <PromptInputButton title="Adjuntar archivos" aria-label="Adjuntar archivos" onClick={openFileDialog}>
      <PaperclipIcon className="size-4" />
    </PromptInputButton>
  )
}

type Sugerencia = { clave: string; titulo: string; detalle?: string; icono: 'comando' | 'archivo' | 'agente' | 'skill'; aplicar: () => void }

/** Selector Manual / Plan (solo en Code). */
function SelectorModo({ modo, onModo }: { modo: ModoSesion; onModo: (m: ModoSesion) => void }) {
  const opciones = [
    { id: 'code' as const, nombre: 'Manual', icono: ShieldCheckIcon, ayuda: 'Pide permiso antes de cada acción' },
    { id: 'plan' as const, nombre: 'Plan', icono: ListChecksIcon, ayuda: 'Propone un plan y no toca nada hasta que lo apruebes' },
    { id: 'aceptar' as const, nombre: 'Aceptar ediciones', icono: FilePenLineIcon, ayuda: 'Las ediciones de archivos se aprueban solas; comandos y red siguen pidiendo permiso' },
  ]
  return (
    <div role="radiogroup" aria-label="Modo de permisos" className="relative flex h-8 items-center rounded-md bg-muted/60 p-0.5">
      {opciones.map((o) => {
        const activo = modo === o.id
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={activo}
            title={o.ayuda}
            onClick={() => onModo(o.id)}
            className={cn('relative z-10 flex h-7 items-center gap-1 rounded-[7px] px-2 text-xs transition-colors', activo ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            {activo && <motion.span layoutId="modo-activo" className="absolute inset-0 -z-10 rounded-[7px] bg-background shadow-sm" transition={resortePop} />}
            <o.icono className="size-3.5" />
            <span className="max-sm:sr-only">{o.nombre}</span>
          </button>
        )
      })}
    </div>
  )
}

type Props = {
  pestana: 'chat' | 'code'
  modo: ModoSesion
  onModo: (m: ModoSesion) => void
  modeloId: string
  onModelo: (id: string) => void
  disponibles?: string[]
  claude?: 'activa' | 'inactiva' | 'desconocido'
  modeloAbierto?: boolean
  onModeloAbierto?: (v: boolean) => void
  enCurso: boolean
  incognito?: boolean
  /** Hay una pregunta, permiso o plan esperando: no se puede mandar otro mensaje hasta responder. */
  bloqueado?: string
  onEnviar: (texto: string, adjuntos: Adjunto[]) => void
  onDetener: () => void
  onComando: (c: Comando) => void
  /** Rutas para autocompletar con @ (solo Code). */
  rutas?: string[]
  /** Agentes para `@agente` al inicio del mensaje (los del rol primero). */
  agentes?: { id: string; nombre: string; descripcion: string }[]
  /** Skills cargadas en el servidor: salen en `/` y se mandan al motor como `/nombre`. */
  skills?: { nombre: string; descripcion: string }[]
  /** Texto que se pone en la caja desde fuera (sugerencias, comentarios del diff). */
  borrador?: { texto: string; n: number }
}

function Caja(p: Props) {
  const { textInput } = usePromptInputController()
  const valor = textInput.value
  const [indice, setIndice] = useState(0)
  const [cerrado, setCerrado] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (p.borrador) {
      textInput.setInput(p.borrador.texto)
      requestAnimationFrame(() => ref.current?.focus())
    }
    // solo cuando cambia el contador del borrador
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.borrador?.n])

  const sugerencias = useMemo<Sugerencia[]>(() => {
    if (cerrado) return []
    if (/^\/\S*$/.test(valor)) {
      const q = valor.slice(1).toLowerCase()
      const skills: Sugerencia[] = (p.skills ?? [])
        .filter((k) => k.nombre.toLowerCase().includes(q))
        .slice(0, 8)
        .map((k) => ({ clave: `skill:${k.nombre}`, titulo: `/${k.nombre}`, detalle: k.descripcion, icono: 'skill', aplicar: () => textInput.setInput(`/${k.nombre} `) }))
      const comandos = filtrarComandos(valor, p.pestana).map<Sugerencia>((c) => ({
        clave: c.nombre,
        titulo: c.nombre,
        detalle: c.descripcion,
        icono: 'comando',
        aplicar: () => {
          if (c.donde === 'local') {
            textInput.clear()
            p.onComando(c)
          } else textInput.setInput(c.nombre + ' ')
        },
      }))
      return [...comandos, ...skills]
    }
    const mencion = mencionEnCurso(valor)
    // `@agente` solo al inicio: arranca el flujo de ese agente con lo ya hablado.
    const agentes =
      mencion !== null && /^@[\w-]*$/.test(valor) && p.agentes?.length
        ? p.agentes
            .filter((a) => a.id.includes(mencion.toLowerCase()) || a.nombre.toLowerCase().includes(mencion.toLowerCase()))
            .map<Sugerencia>((a) => ({ clave: `@${a.id}`, titulo: `@${a.id}`, detalle: `${a.nombre} · ${a.descripcion}`, icono: 'agente', aplicar: () => textInput.setInput(`@${a.id} `) }))
        : []
    if (agentes.length) return agentes
    if (mencion !== null && p.rutas?.length) {
      const q = mencion.toLowerCase()
      return p.rutas
        .filter((r) => r.toLowerCase().includes(q))
        .slice(0, 8)
        .map((r) => ({
          clave: r,
          titulo: r,
          icono: 'archivo',
          aplicar: () => textInput.setInput(valor.replace(/@[\w./-]*$/, `@${r} `)),
        }))
    }
    return []
  }, [valor, cerrado, p, textInput])

  useEffect(() => {
    setIndice(0)
  }, [sugerencias.length])
  useEffect(() => {
    setCerrado(false)
  }, [valor])

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!sugerencias.length) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setIndice((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + sugerencias.length) % sugerencias.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      sugerencias[indice]?.aplicar()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setCerrado(true)
    }
  }

  return (
    <>
      <AnimatePresence>
        {sugerencias.length > 0 && (
          <motion.ul
            role="listbox"
            aria-label={sugerencias[0].icono === 'comando' || sugerencias[0].icono === 'skill' ? 'Comandos' : sugerencias[0].icono === 'agente' ? 'Agentes' : 'Archivos'}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={resortePop}
            className="vidrio absolute inset-x-0 bottom-full z-20 mb-2 max-h-72 origin-bottom overflow-y-auto rounded-xl p-1.5"
          >
            {sugerencias.map((s, i) => (
              <li key={s.clave} role="option" aria-selected={i === indice}>
                <button
                  type="button"
                  onMouseEnter={() => setIndice(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => s.aplicar()}
                  className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm', i === indice && 'bg-accent')}
                >
                  {s.icono === 'skill' ? <SparklesIcon className="size-3.5 text-muted-foreground" /> : s.icono === 'comando' ? <SlashIcon className="size-3.5 text-muted-foreground" /> : s.icono === 'agente' ? <BotIcon className="size-3.5 text-muted-foreground" /> : <AtSignIcon className="size-3.5 text-muted-foreground" />}
                  <span className="font-mono text-xs">{s.titulo}</span>
                  {s.detalle && <span className="truncate text-xs text-muted-foreground">{s.detalle}</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <Adjuntos />
      <PromptInputBody>
        <PromptInputTextarea
          ref={ref}
          onKeyDown={onKeyDown}
          disabled={!!p.bloqueado}
          placeholder={
            p.bloqueado ??
            (p.pestana === 'code' ? (p.modo === 'plan' ? 'Cuéntale qué quieres y te propone un plan…' : 'Pídele algo al proyecto… (/ comandos · @ agentes y archivos)') : 'Escribe tu mensaje… (/ comandos · @ agentes)')
          }
          aria-label="Mensaje"
          aria-autocomplete="list"
          aria-expanded={sugerencias.length > 0}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools className="flex-wrap">
          <BotonAdjuntar />
          {p.pestana === 'code' && <SelectorModo modo={p.modo} onModo={p.onModo} />}
          <ModelSelector modeloId={p.modeloId} onChange={p.onModelo} disponibles={p.disponibles} claude={p.claude} abierto={p.modeloAbierto} onAbierto={p.onModeloAbierto} />
          {p.incognito && (
            <span className="inline-flex items-center gap-1 rounded-md px-2 text-xs text-muted-foreground" title="Este chat no se guarda">
              <GhostIcon className="size-3.5" /> <span className="max-sm:sr-only">Incógnito</span>
            </span>
          )}
        </PromptInputTools>
        <PromptInputSubmit status={p.enCurso ? 'streaming' : 'ready'} onStop={p.onDetener} disabled={!!p.bloqueado && !p.enCurso} />
      </PromptInputFooter>
    </>
  )
}

export function Composer(props: Props) {
  const enviar = (m: PromptInputMessage) => {
    if (props.enCurso) {
      toast.info('Claude sigue trabajando. Espera a que termine o detenlo.')
      throw new Error('en curso') // evita que la caja se vacíe
    }
    if (!m.text.trim() && !m.files.length) return
    props.onEnviar(
      m.text.trim(),
      m.files.map((f) => ({ nombre: f.filename ?? 'archivo', tipo: f.mediaType, url: f.url })),
    )
  }
  return (
    <PromptInputProvider>
      <PromptInput
        onSubmit={enviar}
        multiple
        globalDrop
        maxFileSize={MAX_ARCHIVO_BYTES}
        onError={(e) => toast.error(e.code === 'max_file_size' ? 'Ese archivo pasa de 30 MB.' : e.message)}
        className="vidrio relative rounded-xl [&_[data-slot=input-group]]:overflow-visible [&_[data-slot=input-group]]:rounded-xl"
      >
        <Caja {...props} />
      </PromptInput>
    </PromptInputProvider>
  )
}
