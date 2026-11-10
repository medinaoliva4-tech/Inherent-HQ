import { useEffect, useRef } from 'react'

/** `mod` = ⌘ en Mac, Ctrl en lo demás. Ej.: 'mod+k', 'mod+shift+m', 'mod+/'. */
export type Atajos = Record<string, (e: KeyboardEvent) => void>

export const esMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export function combinacion(e: KeyboardEvent) {
  const partes: string[] = []
  if (e.metaKey || e.ctrlKey) partes.push('mod')
  if (e.altKey) partes.push('alt')
  if (e.shiftKey) partes.push('shift')
  partes.push(e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase())
  return partes.join('+')
}

/** Escucha atajos globales con ⌘/Ctrl. Se registran una vez y leen siempre la última versión. */
export function useAtajos(atajos: Atajos) {
  const ref = useRef(atajos)
  ref.current = atajos
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const fn = ref.current[combinacion(e)]
      if (fn) {
        e.preventDefault()
        fn(e)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
}

/** Para mostrar: 'mod+shift+m' → '⌘ ⇧ M' (o 'Ctrl Shift M'). */
export function teclas(c: string) {
  return c
    .split('+')
    .map((t) => (t === 'mod' ? (esMac ? '⌘' : 'Ctrl') : t === 'shift' ? (esMac ? '⇧' : 'Shift') : t === 'alt' ? (esMac ? '⌥' : 'Alt') : t.toUpperCase()))
    .join(' ')
}
