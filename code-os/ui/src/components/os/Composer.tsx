import { PaperclipIcon, XIcon } from 'lucide-react'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputButton,
  usePromptInputAttachments,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import type { Adjunto } from '@/lib/eventos'
import { ModelSelector } from './ModelSelector'

function Adjuntos() {
  const { files, remove } = usePromptInputAttachments()
  if (!files.length) return null
  return (
    <PromptInputHeader>
      <ul className="flex flex-wrap gap-1.5" aria-label="Adjuntos">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-1.5 rounded-md bg-accent py-1 pr-1 pl-2 text-xs">
            <PaperclipIcon className="size-3" />
            <span className="max-w-40 truncate">{f.filename ?? 'archivo'}</span>
            <button
              type="button"
              aria-label={`Quitar ${f.filename ?? 'archivo'}`}
              onClick={() => remove(f.id)}
              className="rounded p-0.5 hover:bg-background/60"
            >
              <XIcon className="size-3" />
            </button>
          </li>
        ))}
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

type Props = {
  modeloId: string
  onModelo: (id: string) => void
  enCurso: boolean
  onEnviar: (texto: string, adjuntos: Adjunto[]) => void
  onDetener: () => void
}

export function Composer({ modeloId, onModelo, enCurso, onEnviar, onDetener }: Props) {
  const enviar = (m: PromptInputMessage) => {
    if (!m.text.trim() && !m.files.length) return
    onEnviar(
      m.text.trim(),
      m.files.map((f) => ({ nombre: f.filename ?? 'archivo', tipo: f.mediaType, url: f.url })),
    )
  }
  return (
    <PromptInput onSubmit={enviar} multiple globalDrop className="vidrio rounded-xl [&_[data-slot=input-group]]:rounded-xl">
      <Adjuntos />
      <PromptInputBody>
        <PromptInputTextarea placeholder="Pídele algo al proyecto…" aria-label="Mensaje" />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <BotonAdjuntar />
          <ModelSelector modeloId={modeloId} onChange={onModelo} />
        </PromptInputTools>
        <PromptInputSubmit status={enCurso ? 'streaming' : 'ready'} onStop={onDetener} />
      </PromptInputFooter>
    </PromptInput>
  )
}
