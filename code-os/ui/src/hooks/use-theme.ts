import { useCallback, useEffect, useState } from 'react'

export type Tema = 'dark' | 'light'
const CLAVE = 'code-os:tema'

function leer(): Tema {
  try {
    const g = localStorage.getItem(CLAVE)
    if (g === 'light' || g === 'dark') return g
  } catch {
    /* sin almacenamiento */
  }
  return 'dark' // el OS es oscuro por defecto
}

export function useTheme() {
  const [tema, setTema] = useState<Tema>(leer)
  useEffect(() => {
    document.documentElement.dataset.theme = tema
    try {
      localStorage.setItem(CLAVE, tema)
    } catch {
      /* sin almacenamiento */
    }
  }, [tema])
  const alternar = useCallback(() => setTema((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return { tema, setTema, alternar }
}
