import { FitAddon } from '@xterm/addon-fit'
import { Terminal as XTerm } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { SquareTerminalIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NoDisponible, type Cliente } from '@/lib/cliente'
import { Vacio } from './Vacio'

/** Colores de la terminal desde los tokens del OS. */
function temaXterm() {
  const css = getComputedStyle(document.documentElement)
  const v = (n: string) => css.getPropertyValue(n).trim()
  return {
    background: v('--ui-surf') || '#141415',
    foreground: v('--ui-ink') || '#efebe4',
    cursor: v('--ui-ink') || '#efebe4',
    selectionBackground: 'rgba(128,128,128,0.3)',
    green: v('--ui-ok'),
    yellow: v('--ui-warn'),
    red: v('--ui-bad'),
  }
}

type Props = { cliente: Cliente; conversacionId: string; tema: 'dark' | 'light' }

export default function Terminal({ cliente, conversacionId, tema }: Props) {
  const caja = useRef<HTMLDivElement>(null)
  const xterm = useRef<XTerm | null>(null)
  const [falta, setFalta] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!caja.current) return
    const term = new XTerm({
      fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      fontSize: 12.5,
      lineHeight: 1.35,
      cursorBlink: true,
      theme: temaXterm(),
      allowProposedApi: false,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(caja.current)
    xterm.current = term
    const ajustar = () => {
      try {
        fit.fit()
      } catch {
        /* oculto */
      }
    }
    ajustar()
    const ro = new ResizeObserver(ajustar)
    ro.observe(caja.current)

    let vivo = true
    let sesion: Awaited<ReturnType<Cliente['abrirTerminal']>> | null = null
    cliente
      .abrirTerminal(conversacionId, (d) => vivo && term.write(d))
      .then((s) => {
        if (!vivo) return s.cerrar()
        sesion = s
        s.redimensionar(term.cols, term.rows)
        term.onData((d) => s.escribir(d))
        term.onResize(({ cols, rows }) => s.redimensionar(cols, rows))
        term.focus()
      })
      .catch((e) => {
        if (!vivo) return
        if (e instanceof NoDisponible) setFalta(e.que)
        else setError(e instanceof Error ? e.message : 'No se pudo abrir la terminal')
      })
    return () => {
      vivo = false
      ro.disconnect()
      sesion?.cerrar()
      term.dispose()
      xterm.current = null
    }
  }, [cliente, conversacionId])

  useEffect(() => {
    if (xterm.current) xterm.current.options.theme = temaXterm()
  }, [tema])

  if (falta) return <Vacio icono={SquareTerminalIcon} titulo="La terminal aún no está conectada" texto="Necesita una terminal real en el servidor, en la misma carpeta que Claude." falta={falta} />
  if (error) return <Vacio icono={SquareTerminalIcon} titulo="No se pudo abrir la terminal" texto={error} />
  return <div ref={caja} className="h-full min-h-0 bg-card p-2" aria-label="Terminal" />
}
