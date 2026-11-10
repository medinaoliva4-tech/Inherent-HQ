import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { ArrowLeftIcon, AtSignIcon, CopyIcon, FolderTreeIcon, RefreshCwIcon, SaveIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FileTree, FileTreeFile, FileTreeFolder } from '@/components/ai-elements/file-tree'
import { Button } from '@/components/ui/button'
import { useDatos } from '@/hooks/use-datos'
import type { Cliente, NodoArchivo } from '@/lib/cliente'
import { cn } from '@/lib/utils'
import { Vacio } from './Vacio'

function lenguaje(ruta: string) {
  if (/\.(t|j)sx?$|\.m?js$/.test(ruta)) return [javascript({ jsx: true, typescript: /\.tsx?$/.test(ruta) })]
  if (/\.json$/.test(ruta)) return [json()]
  if (/\.(md|markdown)$/.test(ruta)) return [markdown()]
  if (/\.css$/.test(ruta)) return [css()]
  if (/\.html?$/.test(ruta)) return [html()]
  return []
}

/** Tema de CodeMirror hecho con los tokens del OS (claro y oscuro salen solos). */
const temaOS = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: 'var(--ui-ink)', fontSize: '12.5px', height: '100%' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--ui-mut2)', border: 'none' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'rgb(var(--tinta) / 0.04)' },
  '.cm-cursor': { borderLeftColor: 'var(--ui-ink)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'rgb(var(--tinta) / 0.16) !important' },
  '&.cm-focused': { outline: 'none' },
})

function Arbol({ nodos }: { nodos: NodoArchivo[] }) {
  return (
    <>
      {nodos.map((n) =>
        n.tipo === 'carpeta' ? (
          <FileTreeFolder key={n.ruta} path={n.ruta} name={n.nombre}>
            <Arbol nodos={n.hijos ?? []} />
          </FileTreeFolder>
        ) : (
          <FileTreeFile key={n.ruta} path={n.ruta} name={n.nombre} />
        ),
      )}
    </>
  )
}

const carpetas = (ns: NodoArchivo[]): string[] => ns.flatMap((n) => (n.tipo === 'carpeta' ? [n.ruta, ...carpetas(n.hijos ?? [])] : []))

type Props = { cliente: Cliente; conversacionId: string; tema: 'dark' | 'light'; onMencionar: (ruta: string) => void; rutaInicial?: string | null }

export default function Archivos({ cliente, conversacionId, tema, onMencionar, rutaInicial }: Props) {
  const arbol = useDatos(() => cliente.archivos(conversacionId), [cliente, conversacionId])
  const [ruta, setRuta] = useState<string | null>(rutaInicial ?? null)
  const [texto, setTexto] = useState('')
  const [original, setOriginal] = useState('')
  const sucio = texto !== original
  const extensiones = useMemo(() => (ruta ? [...lenguaje(ruta), temaOS, EditorView.lineWrapping] : [temaOS]), [ruta])

  useEffect(() => {
    if (rutaInicial) setRuta(rutaInicial)
  }, [rutaInicial])

  useEffect(() => {
    if (!ruta) return
    let vivo = true
    cliente
      .leerArchivo(conversacionId, ruta)
      .then((t) => {
        if (!vivo) return
        setTexto(t)
        setOriginal(t)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'No se pudo abrir'))
    return () => {
      vivo = false
    }
  }, [cliente, conversacionId, ruta])

  const guardar = async () => {
    if (!ruta || !sucio) return
    try {
      await cliente.guardarArchivo(conversacionId, ruta, texto)
      setOriginal(texto)
      toast.success('Guardado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar')
    }
  }

  if (arbol.falta) return <Vacio icono={FolderTreeIcon} titulo="Los archivos aún no llegan" texto="Cuando el puente comparta la carpeta del proyecto, la verás aquí." falta={arbol.falta} />
  if (arbol.error) return <Vacio icono={FolderTreeIcon} titulo="No se pudo leer la carpeta" texto={arbol.error} />

  return (
    <div className="flex h-full min-h-0 flex-col">
      {ruta ? (
        <>
          <div className="flex items-center gap-1 border-b px-2 py-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setRuta(null)} aria-label="Volver al árbol">
              <ArrowLeftIcon />
            </Button>
            <span className="min-w-0 flex-1 truncate font-mono text-xs" title={ruta}>
              {ruta}
              {sucio && <span className="ml-1 text-warn" aria-label="Sin guardar">●</span>}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => onMencionar(ruta)} aria-label="Mencionar en el mensaje" title="Mencionar con @">
              <AtSignIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => navigator.clipboard?.writeText(ruta)} aria-label="Copiar ruta" title="Copiar ruta">
              <CopyIcon />
            </Button>
            <Button variant={sucio ? 'secondary' : 'ghost'} size="icon-sm" onClick={guardar} disabled={!sucio} aria-label="Guardar (⌘S)" title="Guardar (⌘S)">
              <SaveIcon />
            </Button>
          </div>
          <div
            className="min-h-0 flex-1 overflow-auto"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault()
                guardar()
              }
            }}
          >
            <CodeMirror value={texto} onChange={setTexto} extensions={extensiones} theme={tema} basicSetup={{ foldGutter: false, highlightActiveLine: true }} aria-label={`Editor de ${ruta}`} height="100%" className="h-full" />
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-2">
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">{cliente.tipo === 'mock' ? 'Carpeta de ejemplo' : 'Carpeta del proyecto'}</span>
            <Button variant="ghost" size="icon-xs" onClick={arbol.recargar} aria-label="Recargar archivos">
              <RefreshCwIcon className={cn(arbol.cargando && 'animate-spin')} />
            </Button>
          </div>
          {arbol.datos && (
            <FileTree
              className="border-0 bg-transparent text-xs"
              defaultExpanded={new Set(carpetas(arbol.datos))}
              onSelect={(r) => {
                if (!carpetas(arbol.datos ?? []).includes(r)) setRuta(r)
              }}
            >
              <Arbol nodos={arbol.datos} />
            </FileTree>
          )}
        </div>
      )}
    </div>
  )
}
