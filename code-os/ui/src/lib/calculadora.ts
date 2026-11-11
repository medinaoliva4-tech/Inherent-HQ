/**
 * Calculadora de adquisición (diseño de departamentos §5).
 * La misma fórmula corre aquí (respuesta inmediata y mock) y en el backend (`POST /calc/outbound`).
 */

export type EntradaOutbound = {
  /** Clientes meta `m` (entero ≥ 1). */
  meta: number
  /** Conversión prospecto → cliente `c`, de 0 a 1. */
  conversion: number
  /** Probabilidad objetivo `P`, de 0 a 1 (p. ej. 0.95). */
  probabilidad: number
  /** Plazo de prospección en semanas `w`. */
  semanas: number
}
export type ResultadoOutbound = { prospectos: number; porSemana: number; porDiaHabil: number }

export const TEXTO_OUTBOUND =
  'La probabilidad es una estimación estadística, no una garantía; los prospectos deben ser empresas calificadas y la tasa debe validarse con datos reales.'

/** log(n!) por suma; se guarda en caché porque se pide muchas veces. */
const logFact: number[] = [0]
function lnFact(n: number) {
  for (let i = logFact.length; i <= n; i++) logFact[i] = logFact[i - 1] + Math.log(i)
  return logFact[n]
}

/** P(Binomial(n, c) ≥ m) = 1 − Σ_{k<m} C(n,k) c^k (1−c)^(n−k), en espacio logarítmico para que no se desborde. */
export function probAlMenos(n: number, c: number, m: number): number {
  if (m <= 0) return 1
  if (n < m) return 0
  if (c >= 1) return 1
  if (c <= 0) return 0
  const lc = Math.log(c)
  const l1 = Math.log1p(-c)
  let cola = 0
  for (let k = 0; k < m; k++) cola += Math.exp(lnFact(n) - lnFact(k) - lnFact(n - k) + k * lc + (n - k) * l1)
  return Math.max(0, 1 - cola)
}

/** Tope para no colgar el navegador con una conversión absurda (0.001 % y 100 clientes). */
const N_MAX = 5_000_000

/** Menor n con P(Bin(n,c) ≥ m) ≥ P. Búsqueda binaria: la probabilidad crece con n. `null` si no se alcanza. */
export function prospectosNecesarios(m: number, c: number, P: number): number | null {
  const meta = Math.max(1, Math.round(m))
  if (!(c > 0) || !(P > 0) || P >= 1) return null
  if (c >= 1) return meta
  let alto = meta
  while (probAlMenos(alto, c, meta) < P) {
    alto *= 2
    if (alto > N_MAX) return null
  }
  let bajo = Math.max(meta, Math.floor(alto / 2))
  if (probAlMenos(bajo, c, meta) >= P) return bajo
  // invariante: bajo no alcanza, alto sí
  while (alto - bajo > 1) {
    const medio = Math.floor((bajo + alto) / 2)
    if (probAlMenos(medio, c, meta) >= P) alto = medio
    else bajo = medio
  }
  return alto
}

export function calcularOutbound(e: EntradaOutbound): ResultadoOutbound | null {
  const n = prospectosNecesarios(e.meta, e.conversion, e.probabilidad)
  if (n === null) return null
  const w = Math.max(1, Math.round(e.semanas))
  return { prospectos: n, porSemana: Math.ceil(n / w), porDiaHabil: Math.ceil(n / (w * 5)) }
}

/* ——— Inbound ——— */

/** De dónde salió un número: lo supusimos o vino de las métricas reales (Zernio). */
export type OrigenTasa = { tipo: 'supuesto' } | { tipo: 'zernio'; desde: string; muestra?: string }
export type Tasa = { valor: number; origen: OrigenTasa }

export type EntradaInbound = {
  /** Clientes (ventas) meta en el periodo. */
  meta: number
  /** Embudo: alcance → clic, clic → lead, lead → cliente (0–1). */
  ctr: Tasa
  clicALead: Tasa
  leadACliente: Tasa
  /** Engagement objetivo (0–1) de los reels de prueba. */
  engagement: Tasa
  /** CPM de referencia en USD (costo por mil impresiones). */
  cpm: Tasa
  /** Frecuencia: impresiones por persona alcanzada. */
  frecuencia: number
  /** Presupuesto disponible en USD (para comparar). */
  presupuesto: number
  segmentacion: string
  /** Ángulos aprobados en el tablero: un reel de prueba por ángulo (mínimo 3). */
  angulos: number
}
export type ResultadoInbound = {
  leads: number
  clics: number
  impresiones: number
  alcance: number
  presupuestoEstimado: number
  /** Presupuesto disponible − estimado (negativo = falta). */
  diferencia: number
  reelsPrueba: number
}

export function calcularInbound(e: EntradaInbound): ResultadoInbound | null {
  const t = [e.ctr.valor, e.clicALead.valor, e.leadACliente.valor]
  if (t.some((x) => !(x > 0) || x > 1) || !(e.meta > 0)) return null
  const leads = Math.ceil(e.meta / e.leadACliente.valor)
  const clics = Math.ceil(leads / e.clicALead.valor)
  const impresiones = Math.ceil(clics / e.ctr.valor)
  const alcance = Math.ceil(impresiones / Math.max(1, e.frecuencia))
  const presupuestoEstimado = Math.round((impresiones / 1000) * e.cpm.valor * 100) / 100
  return {
    leads,
    clics,
    impresiones,
    alcance,
    presupuestoEstimado,
    diferencia: Math.round((e.presupuesto - presupuestoEstimado) * 100) / 100,
    reelsPrueba: Math.max(3, e.angulos),
  }
}

export const inboundPorDefecto = (): EntradaInbound => ({
  meta: 10,
  ctr: { valor: 0.012, origen: { tipo: 'supuesto' } },
  clicALead: { valor: 0.08, origen: { tipo: 'supuesto' } },
  leadACliente: { valor: 0.2, origen: { tipo: 'supuesto' } },
  engagement: { valor: 0.04, origen: { tipo: 'supuesto' } },
  cpm: { valor: 4.5, origen: { tipo: 'supuesto' } },
  frecuencia: 2,
  presupuesto: 600,
  segmentacion: '',
  angulos: 3,
})

/** Lo que devuelve `POST /clientes/:id/calibrar`: las tasas reales que reemplazan a las supuestas. */
export type Calibracion = {
  desde: string
  muestra: string
  tasas: Partial<Record<'ctr' | 'clicALead' | 'leadACliente' | 'engagement' | 'cpm', number>>
}

export function aplicarCalibracion(e: EntradaInbound, cal: Calibracion): EntradaInbound {
  const out = { ...e }
  for (const [k, v] of Object.entries(cal.tasas) as [keyof Calibracion['tasas'], number | undefined][]) {
    if (typeof v === 'number' && v > 0) out[k] = { valor: v, origen: { tipo: 'zernio', desde: cal.desde, muestra: cal.muestra } }
  }
  return out
}
