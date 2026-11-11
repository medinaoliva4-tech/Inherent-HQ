import type { Area } from './hilo'

/**
 * Agentes de las áreas nuevas (diseño §3): 1 orquestador por área y 4 habilidades como máximo.
 * El flujo (etapas) y los trabajos son de EJEMPLO hasta que ceo-os/puente expongan los workflows reales;
 * lo que sí es real con el puente: `@agente` crea un subagente del SDK con este `prompt` y su texto
 * llega en vivo (eventos con `parentToolUseId`).
 */
export type Etapa = { nombre: string; entrega: string; aporte?: string }
export type Agente = {
  id: string
  nombre: string
  area: Area
  descripcion: string
  habilidades: string[]
  etapas: Etapa[]
  /** Prompt del subagente que se manda al puente (`agents` al crear la sesión). */
  prompt: string
}

const REGLAS =
  'Español de tú, sencillo. Evidencia o etiqueta: todo dato sin fuente va marcado [hipótesis]. ' +
  'No avanzas de etapa sin que la persona lea y apruebe. Si te falta un dato que solo la persona sabe, pregúntalo en el chat. ' +
  'Cuando propongas un dato para el hilo del cliente, termínalo con un bloque ```nodo {"tipo","titulo","contenido":{"decide"},"viene_de":[]}```.'

export const AGENTES: Agente[] = [
  {
    id: 'estrategia',
    nombre: 'Strategy',
    area: 'strategy',
    descripcion: 'Producto, precio y quién puede comprar; dolores, deseos y la conversión de partida con fuente.',
    habilidades: ['Investigar producto y precio', 'Deducir el cliente ideal', 'Sintetizar entrevistas', 'Panel sintético del ICP'],
    etapas: [
      { nombre: 'Producto', entrega: 'Qué vende, a qué precio y con qué margen' },
      { nombre: 'Cliente ideal', entrega: 'Perfil con los criterios y la regla guía', aporte: '¿Quién te ha comprado más y por qué?' },
      { nombre: 'Dolores y deseos', entrega: 'Dolores, deseos e historia villano-héroe' },
      { nombre: 'Adquisición', entrega: 'Calculadora outbound e inbound con la conversión de partida' },
    ],
    prompt: `Eres el orquestador de Strategy de Inherent. Orden: producto → ICP → dolores, deseos, entrevistas, historia villano-héroe → adquisición. ${REGLAS}`,
  },
  {
    id: 'creativo',
    nombre: 'Marketing y Creative',
    area: 'creative',
    descripcion: 'Ve videos en volumen, rankea winners, detecta lo quemado y genera ideas por ángulo.',
    habilidades: ['Radar de referentes', 'Rankear winners', 'Detectar contenido quemado', 'Ideas por ángulo'],
    etapas: [
      { nombre: 'Radar', entrega: 'Referentes y winners con por qué funcionaron' },
      { nombre: 'Pilares y ángulos', entrega: 'Tablero pilares × ángulos que sale de los dolores aprobados' },
      { nombre: 'Campaña', entrega: 'Copy íntegro, ideas, piezas y resultado esperado' },
    ],
    prompt: `Eres el agente de Marketing y Creative de Inherent. Todo ángulo sale de un dolor o deseo aprobado de Strategy. ${REGLAS}`,
  },
  {
    id: 'produccion',
    nombre: 'Production',
    area: 'production',
    descripcion: 'Borradores de pre-producción, primer corte y derivadas.',
    habilidades: ['Hoja de pre-producción', 'Shot list y hooks alternos', 'Primer corte', 'Derivadas'],
    etapas: [
      { nombre: 'Pre', entrega: 'Jornada, guion, shot list, permisos y compras', aporte: '¿Qué día y dónde se graba?' },
      { nombre: 'Post', entrega: 'Primer corte y derivadas para revisar' },
    ],
    prompt: `Eres el agente de Production (Pre y Post) de Inherent. Cada toma dice de qué pieza y campaña viene. ${REGLAS}`,
  },
  {
    id: 'diseno',
    nombre: 'Diseño gráfico',
    area: 'diseno',
    descripcion: 'Borradores de carruseles, posts y stories sobre las plantillas del cliente (Figma).',
    habilidades: ['Carrusel sobre plantilla', 'Post y story', 'Variantes dentro del kit'],
    etapas: [
      { nombre: 'Borrador', entrega: 'Piezas sobre las plantillas del kit' },
      { nombre: 'Variantes', entrega: 'Variantes dentro del kit para elegir' },
    ],
    prompt: `Eres el agente de Diseño gráfico de Inherent. Toda variación usa una plantilla del kit del cliente. ${REGLAS}`,
  },
]

export const agentePorId = (id: string) => AGENTES.find((a) => a.id === id)

/** `@estrategia revisa…` → { agente, resto }. Solo cuenta si el @ va al inicio del mensaje. */
export function agenteMencionado(texto: string): { agente: Agente; resto: string } | null {
  const m = /^@([\wáéíóúñ-]+)\s*/i.exec(texto.trim())
  if (!m) return null
  const agente = agentePorId(m[1].toLowerCase())
  return agente ? { agente, resto: texto.trim().slice(m[0].length) } : null
}

/** Definiciones de subagentes para el puente (`agents` al crear la sesión). */
export const agentesParaPuente = () =>
  Object.fromEntries(AGENTES.map((a) => [a.id, { description: `${a.nombre}: ${a.descripcion}`, prompt: a.prompt }]))

/** Lo que el motor recibe cuando escribes `@agente …`: arranca su flujo con lo ya hablado. */
export function instruccionAgente(a: Agente, pedido: string) {
  return (
    `Usa el subagente «${a.id}» (herramienta Task, subagent_type "${a.id}") para este pedido, pasándole en el prompt lo que ya hablamos en esta conversación. ` +
    `Antes de la primera etapa, dime en dos líneas cómo lo va a trabajar (etapas: ${a.etapas.map((e) => e.nombre).join(' → ')}).\n\nPedido: ${pedido || '(sin detalle: empieza por la primera etapa)'}`
  )
}

/** Trabajo de ejemplo en el portal (hasta que existan los trabajos reales del puente). */
export type Trabajo = { id: string; agente: string; titulo: string; etapa: number; estado: 'en curso' | 'en revisión' | 'aprobado'; actualizado: string }
