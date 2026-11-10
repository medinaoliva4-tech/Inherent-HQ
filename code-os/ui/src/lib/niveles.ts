/**
 * Niveles reales de code-os/litellm (ver code-os/docs/niveles-y-frontier.md y modelos-verificados.md).
 * Elegir el nivel manda el alias `nivel-*` y LiteLLM recorre los respaldos en orden.
 * Fijar un modelo manda su alias directo (`cp-*`, `nv-*`).
 */
export type Modelo = { id: string; nombre: string; nota: string }
export type Nivel = { id: 'alto' | 'medio' | 'bajo'; alias: string; nombre: string; descripcion: string; modelos: Modelo[] }

export const NIVELES: Nivel[] = [
  {
    id: 'alto',
    alias: 'nivel-alto',
    nombre: 'Alto',
    descripcion: 'Planear y decidir',
    modelos: [{ id: 'cp-kimi-k3.1-pro', nombre: 'Kimi K3.1 Pro', nota: 'top de Cline Pass · razona' }],
  },
  {
    id: 'medio',
    alias: 'nivel-medio',
    nombre: 'Medio',
    descripcion: 'El trabajo de cada día',
    modelos: [
      { id: 'cp-kimi-k3', nombre: 'Kimi K3', nota: 'primero de la lista' },
      { id: 'cp-glm-5.3', nombre: 'GLM 5.3', nota: 'el más rápido' },
      { id: 'cp-deepseek-v4-pro', nombre: 'DeepSeek V4 Pro', nota: 'lento con mucho contexto' },
      { id: 'cp-minimax-m3', nombre: 'MiniMax M3', nota: 'equilibrado' },
    ],
  },
  {
    id: 'bajo',
    alias: 'nivel-bajo',
    nombre: 'Bajo',
    descripcion: 'Repetitivo y de respaldo · gratis',
    modelos: [
      { id: 'nv-nemotron-3-ultra', nombre: 'Nemotron 3 Ultra', nota: 'NVIDIA · primero' },
      { id: 'nv-mistral-large-4', nombre: 'Mistral Large 4', nota: 'NVIDIA · variable' },
      { id: 'nv-nemotron-lightning', nombre: 'Nemotron Lightning', nota: 'NVIDIA · ligero' },
    ],
  },
]

export const MODELO_POR_DEFECTO = 'nivel-medio'

export type Seleccion = { nivel: Nivel; modelo?: Modelo; automatico: boolean }

/** De un id (alias de nivel o de modelo) a lo que se muestra. Si no se reconoce, se muestra tal cual en Medio. */
export function describirModelo(id: string): Seleccion & { etiqueta: string } {
  for (const n of NIVELES) {
    if (n.alias === id) return { nivel: n, automatico: true, etiqueta: 'Automático' }
    const m = n.modelos.find((x) => x.id === id)
    if (m) return { nivel: n, modelo: m, automatico: false, etiqueta: m.nombre }
  }
  return { nivel: NIVELES[1], automatico: false, etiqueta: id }
}

/** ¿Está ese alias en el catálogo del puente? Sin catálogo (cargando) todo cuenta como disponible. */
export function disponible(id: string, ids?: string[]) {
  return !ids || ids.includes(id)
}
