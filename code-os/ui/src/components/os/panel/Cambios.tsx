import { DiffModeEnum, DiffView, SplitSide } from '@git-diff-view/react'
import '@git-diff-view/react/styles/diff-view-pure.css'
import { ChevronRightIcon, GitCompareIcon, MessageSquarePlusIcon, RefreshCwIcon, SendIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useDatos } from '@/hooks/use-datos'
import type { ArchivoDiff, Cliente } from '@/lib/cliente'
import { cn } from '@/lib/utils'
import { Vacio } from './Vacio'

/** Comentario en una línea del diff. Se juntan y se mandan en un solo mensaje. */
export type Comentario = { ruta: string; linea: number; lado: 'antes' | 'despues'; texto: string }

export function mensajeDeComentarios(cs: Comentario[]) {
  const lineas = cs.map((c) => `- \`${c.ruta}\` línea ${c.linea}${c.lado === 'antes' ? ' (versión anterior)' : ''}: ${c.texto}`)
  return `Revisé los cambios y te dejo estos comentarios. Atiéndelos uno por uno:\n\n${lineas.join('\n')}`
}

function Widget({ onGuardar, onCerrar }: { onGuardar: (t: string) => void; onCerrar: () => void }) {
  const [t, setT] = useState('')
  return (
    <div className="grid gap-2 border-y bg-card p-2 font-sans">
      <Textarea
        autoFocus
        value={t}
        onChange={(e) => setT(e.target.value)}
        placeholder="¿Qué debería cambiar aquí?"
        aria-label="Comentario de línea"
        className="min-h-14 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && t.trim()) {
            e.preventDefault()
            onGuardar(t.trim())
          }
          if (e.key === 'Escape') onCerrar()
        }}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button size="sm" disabled={!t.trim()} onClick={() => onGuardar(t.trim())}>
          Agregar
        </Button>
      </div>
    </div>
  )
}

function ArchivoCambiado({
  d,
  tema,
  comentarios,
  onComentar,
  onQuitar,
}: {
  d: ArchivoDiff
  tema: 'dark' | 'light'
  comentarios: Comentario[]
  onComentar: (c: Comentario) => void
  onQuitar: (c: Comentario) => void
}) {
  const [abierto, setAbierto] = useState(true)
  const extend = { oldFile: {} as Record<string, { data: Comentario[] }>, newFile: {} as Record<string, { data: Comentario[] }> }
  for (const c of comentarios) {
    const lado = c.lado === 'antes' ? extend.oldFile : extend.newFile
    ;(lado[c.linea] ??= { data: [] }).data.push(c)
  }
  return (
    <section className="overflow-hidden rounded-lg border">
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} className="flex w-full items-center gap-2 bg-muted/40 px-3 py-2 text-left text-xs">
        <ChevronRightIcon className={cn('size-3.5 transition-transform duration-200', abierto && 'rotate-90')} />
        <span className="min-w-0 flex-1 truncate font-mono">{d.ruta}</span>
        <span className="text-ok tabular-nums">+{d.mas}</span>
        <span className="text-bad tabular-nums">−{d.menos}</span>
      </button>
      {abierto && (
        <div className="diff-os text-xs">
          <DiffView<Comentario[]>
            data={{ oldFile: { fileName: d.ruta, content: d.anterior ?? null }, newFile: { fileName: d.ruta, content: d.nuevo ?? null }, hunks: [d.diff] }}
            diffViewMode={DiffModeEnum.Unified}
            diffViewTheme={tema}
            diffViewHighlight
            diffViewWrap
            diffViewFontSize={12}
            diffViewAddWidget
            extendData={extend}
            renderWidgetLine={({ lineNumber, side, onClose }) => (
              <Widget
                onCerrar={onClose}
                onGuardar={(texto) => {
                  onComentar({ ruta: d.ruta, linea: lineNumber, lado: side === SplitSide.old ? 'antes' : 'despues', texto })
                  onClose()
                }}
              />
            )}
            renderExtendLine={({ data }) => (
              <div className="grid gap-1 border-y bg-card px-3 py-2 font-sans">
                {data.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <MessageSquarePlusIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{c.texto}</span>
                    <button type="button" aria-label="Quitar comentario" onClick={() => onQuitar(c)} className="rounded p-0.5 hover:bg-accent">
                      <XIcon className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          />
        </div>
      )}
    </section>
  )
}

type Props = { cliente: Cliente; conversacionId: string; tema: 'dark' | 'light'; onEnviarComentarios: (texto: string) => void }

export default function Cambios({ cliente, conversacionId, tema, onEnviarComentarios }: Props) {
  const diffs = useDatos(() => cliente.diff(conversacionId), [cliente, conversacionId])
  const [comentarios, setComentarios] = useState<Comentario[]>([])

  if (diffs.falta) return <Vacio icono={GitCompareIcon} titulo="Los cambios aún no llegan" texto="Cuando el puente comparta el git diff de la sesión, lo revisas aquí." falta={diffs.falta} />
  if (diffs.error) return <Vacio icono={GitCompareIcon} titulo="No se pudieron leer los cambios" texto={diffs.error} />
  if (diffs.datos && !diffs.datos.length) return <Vacio icono={GitCompareIcon} titulo="Sin cambios" texto="Claude todavía no ha tocado archivos en esta sesión." />

  const total = diffs.datos?.reduce((a, d) => ({ mas: a.mas + d.mas, menos: a.menos + d.menos }), { mas: 0, menos: 0 })
  const enviar = () => {
    onEnviarComentarios(mensajeDeComentarios(comentarios))
    setComentarios([])
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-1.5 text-xs">
        <span className="flex-1 text-muted-foreground">
          {diffs.datos?.length ?? 0} archivos ·{' '}
          <span className="text-ok">+{total?.mas ?? 0}</span> <span className="text-bad">−{total?.menos ?? 0}</span>
          {cliente.tipo === 'mock' && ' · ejemplo'}
        </span>
        <Button variant="ghost" size="icon-xs" onClick={diffs.recargar} aria-label="Recargar cambios">
          <RefreshCwIcon className={cn(diffs.cargando && 'animate-spin')} />
        </Button>
      </div>
      <div className="grid min-h-0 flex-1 content-start gap-3 overflow-auto p-3">
        <p className="text-[11px] text-muted-foreground">Pasa el mouse por una línea y toca «+» para comentarla. Los comentarios se mandan juntos.</p>
        {diffs.datos?.map((d) => (
          <ArchivoCambiado
            key={d.ruta}
            d={d}
            tema={tema}
            comentarios={comentarios.filter((c) => c.ruta === d.ruta)}
            onComentar={(c) => setComentarios((s) => [...s, c])}
            onQuitar={(c) => setComentarios((s) => s.filter((x) => x !== c))}
          />
        ))}
      </div>
      {comentarios.length > 0 && (
        <div className="flex items-center gap-2 border-t bg-card px-3 py-2">
          <span className="flex-1 text-xs text-muted-foreground">
            {comentarios.length} {comentarios.length === 1 ? 'comentario' : 'comentarios'}
          </span>
          <Button size="sm" onClick={enviar}>
            <SendIcon /> Pasar al mensaje
          </Button>
        </div>
      )}
    </div>
  )
}
