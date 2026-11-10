import { CodeIcon, CopyIcon, DownloadIcon, EyeIcon, FileCodeIcon, RotateCwIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Artifact, ArtifactAction, ArtifactActions, ArtifactContent, ArtifactDescription, ArtifactHeader, ArtifactTitle } from '@/components/ai-elements/artifact'
import { CodeBlock } from '@/components/ai-elements/code-block'
import { MessageResponse } from '@/components/ai-elements/message'
import { documentoSandbox, SANDBOX_ARTEFACTO, type Artefacto } from '@/lib/artefactos'
import { cn } from '@/lib/utils'
import { Vacio } from './Vacio'

const EXT: Record<string, string> = { html: 'html', svg: 'svg', markdown: 'md', md: 'md', typescript: 'ts', tsx: 'tsx', javascript: 'js', python: 'py', json: 'json', css: 'css' }

function descargar(a: Artefacto) {
  const ext = EXT[a.lenguaje] ?? 'txt'
  const url = URL.createObjectURL(new Blob([a.contenido], { type: 'text/plain;charset=utf-8' }))
  const el = document.createElement('a')
  el.href = url
  el.download = `${a.titulo.replace(/[^\w\- ]+/g, '').trim() || 'artefacto'}.${ext}`
  el.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Vista de un artefacto. HTML/SVG corren en un iframe aislado (origen opaco, sin red). */
function Visor({ a }: { a: Artefacto }) {
  const visible = a.tipo === 'html' || a.tipo === 'svg' || a.tipo === 'markdown'
  const [vista, setVista] = useState<'vista' | 'codigo'>(visible ? 'vista' : 'codigo')
  const [vuelta, setVuelta] = useState(0)
  const doc = useMemo(() => (a.tipo === 'html' || a.tipo === 'svg' ? documentoSandbox(a) : ''), [a])
  return (
    <Artifact className="h-full rounded-none border-0 bg-transparent shadow-none">
      <ArtifactHeader className="gap-2 bg-transparent px-3 py-2">
        <div className="min-w-0">
          <ArtifactTitle className="truncate">{a.titulo}</ArtifactTitle>
          <ArtifactDescription className="text-xs">{a.tipo === 'codigo' ? a.lenguaje : a.tipo.toUpperCase()} · aislado del resto de Code OS</ArtifactDescription>
        </div>
        <ArtifactActions>
          {visible && <ArtifactAction tooltip={vista === 'vista' ? 'Ver código' : 'Ver resultado'} label="Cambiar vista" icon={vista === 'vista' ? CodeIcon : EyeIcon} onClick={() => setVista((v) => (v === 'vista' ? 'codigo' : 'vista'))} />}
          {doc && vista === 'vista' && <ArtifactAction tooltip="Volver a cargar" label="Volver a cargar" icon={RotateCwIcon} onClick={() => setVuelta((v) => v + 1)} />}
          <ArtifactAction tooltip="Copiar" label="Copiar" icon={CopyIcon} onClick={() => navigator.clipboard?.writeText(a.contenido)} />
          <ArtifactAction tooltip="Descargar" label="Descargar" icon={DownloadIcon} onClick={() => descargar(a)} />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className="min-h-0 flex-1 p-0">
        {vista === 'vista' && doc ? (
          <iframe key={vuelta} title={a.titulo} sandbox={SANDBOX_ARTEFACTO} srcDoc={doc} referrerPolicy="no-referrer" className="size-full min-h-80 border-0 bg-white" />
        ) : vista === 'vista' && a.tipo === 'markdown' ? (
          <div className="p-4 text-sm">
            <MessageResponse>{a.contenido}</MessageResponse>
          </div>
        ) : (
          <CodeBlock code={a.contenido} language={(a.lenguaje === 'md' ? 'markdown' : a.lenguaje) as never} className="rounded-none border-0" />
        )}
      </ArtifactContent>
    </Artifact>
  )
}

type Props = { artefactos: Artefacto[]; activo: string | null; onActivo: (id: string) => void }

export function Artefactos({ artefactos, activo, onActivo }: Props) {
  if (!artefactos.length) return <Vacio icono={FileCodeIcon} titulo="Sin artefactos" texto="Cuando Claude escriba una página, un documento o código largo, ábrelo aquí para verlo y probarlo." />
  const a = artefactos.find((x) => x.id === activo) ?? artefactos[artefactos.length - 1]
  return (
    <div className="flex h-full min-h-0 flex-col">
      {artefactos.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b px-2 py-1.5" role="tablist" aria-label="Artefactos de la conversación">
          {artefactos.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={x.id === a.id}
              onClick={() => onActivo(x.id)}
              className={cn('shrink-0 rounded-md px-2 py-1 text-xs transition-colors', x.id === a.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60')}
            >
              {x.titulo}
            </button>
          ))}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <Visor key={a.id} a={a} />
      </div>
    </div>
  )
}
