/** Comandos con `/`. `local` = los resuelve la interfaz; `motor` = se mandan como texto a Claude Code. */
export type Comando = { nombre: string; descripcion: string; donde: 'local' | 'motor'; pestana?: 'chat' | 'code' }

export const COMANDOS: Comando[] = [
  { nombre: '/nueva', descripcion: 'Empieza una conversación nueva', donde: 'local' },
  { nombre: '/plan', descripcion: 'Pasa a modo plan: Claude propone antes de tocar', donde: 'local', pestana: 'code' },
  { nombre: '/manual', descripcion: 'Vuelve a pedir permiso para cada acción', donde: 'local', pestana: 'code' },
  { nombre: '/modelo', descripcion: 'Elige nivel o modelo', donde: 'local' },
  { nombre: '/incognito', descripcion: 'Chat que no se guarda', donde: 'local' },
  { nombre: '/memoria', descripcion: 'Ver y editar lo que Code OS recuerda', donde: 'local' },
  { nombre: '/ajustes', descripcion: 'Abre los ajustes', donde: 'local' },
  { nombre: '/tema', descripcion: 'Cambia entre claro y oscuro', donde: 'local' },
  { nombre: '/compact', descripcion: 'Resume la conversación para liberar contexto', donde: 'motor', pestana: 'code' },
  { nombre: '/context', descripcion: 'Muestra en qué se va el contexto', donde: 'motor', pestana: 'code' },
  { nombre: '/review', descripcion: 'Revisa los cambios de la sesión', donde: 'motor', pestana: 'code' },
  { nombre: '/init', descripcion: 'Escribe un CLAUDE.md para el proyecto', donde: 'motor', pestana: 'code' },
]

/** Comandos que aplican a la pestaña y empiezan con lo escrito. */
export function filtrarComandos(escrito: string, pestana: 'chat' | 'code'): Comando[] {
  const q = escrito.toLowerCase()
  return COMANDOS.filter((c) => (!c.pestana || c.pestana === pestana) && c.nombre.startsWith(q))
}

/** Si el texto está escribiendo un `@archivo` al final, devuelve lo que va después de la @. */
export function mencionEnCurso(texto: string): string | null {
  const m = /(?:^|\s)@([\w./-]*)$/.exec(texto)
  return m ? m[1] : null
}
