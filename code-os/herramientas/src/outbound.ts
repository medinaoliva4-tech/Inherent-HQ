import { malo, numero, tasa } from './errores.js';

/** Texto fijo del diseño §5: acompaña siempre al resultado. */
export const TEXTO_OUTBOUND = 'La probabilidad es una estimación estadística, no una garantía; los prospectos deben ser empresas calificadas y la tasa debe validarse con datos reales';

export const ETIQUETAS = ['hipótesis', 'evidencia'] as const;
export type Etiqueta = (typeof ETIQUETAS)[number];

/** Conversión de partida que propone un agente con IA. Aquí solo se guarda: quién, de dónde y con qué etiqueta. */
export interface SugerenciaConversion { c: number; fuente: string; etiqueta: Etiqueta; autor?: string; nota?: string }

export interface EntradaOutbound {
  /** Clientes meta. */
  m: number;
  /** Conversión prospecto → cliente (0–1]. */
  c: number;
  /** Probabilidad objetivo (0–1). */
  P: number;
  /** Plazo en semanas. */
  w: number;
  oferta_comprobada?: boolean;
  sugerencia?: SugerenciaConversion;
}

export interface ResultadoOutbound {
  n: number;
  por_semana: number;
  por_dia_habil: number;
  /** P(Bin(n, c) ≥ m) con el n calculado. */
  probabilidad: number;
  texto: string;
  entradas: EntradaOutbound;
}

const MAX_M = 100_000;
const CTX = 'Calculadora outbound';

/** log(e^a + e^b) sin desbordar. */
const logSuma = (a: number, b: number) => (a === -Infinity ? b : b === -Infinity ? a : Math.max(a, b) + Math.log1p(Math.exp(-Math.abs(a - b))));

/**
 * P(Binomial(n, c) ≥ m), en log-probabilidades: suma la cola de abajo P(X ≤ m−1) término a término
 * (log pmf(k+1) = log pmf(k) + log((n−k)/(k+1)) + log(c/(1−c))) y devuelve 1 − eso con expm1. Costo O(m).
 */
export function probAlMenos(n: number, c: number, m: number): number {
  if (m <= 0) return 1;
  if (n < m) return 0;
  if (c >= 1) return 1;
  if (c <= 0) return 0;
  const r = Math.log(c) - Math.log1p(-c);
  let lp = n * Math.log1p(-c);
  let logCdf = lp;
  for (let k = 0; k < m - 1; k++) {
    lp += Math.log(n - k) - Math.log(k + 1) + r;
    logCdf = logSuma(logCdf, lp);
  }
  const cola = -Math.expm1(Math.min(logCdf, 0));
  return Math.min(1, Math.max(0, cola));
}

function validarSugerencia(s: unknown): SugerenciaConversion | undefined {
  if (s === undefined || s === null) return undefined;
  if (typeof s !== 'object') throw malo(`${CTX}: «sugerencia» debe ser un objeto`);
  const o = s as Record<string, unknown>;
  const c = tasa(o.c, 'sugerencia.c', CTX);
  if (typeof o.fuente !== 'string' || !o.fuente.trim()) throw malo(`${CTX}: la sugerencia necesita «fuente» (enlace o «hipótesis»)`);
  if (!ETIQUETAS.includes(o.etiqueta as Etiqueta)) throw malo(`${CTX}: la sugerencia necesita «etiqueta»: ${ETIQUETAS.join(' o ')}`);
  return { c, fuente: o.fuente.trim(), etiqueta: o.etiqueta as Etiqueta, ...(typeof o.autor === 'string' ? { autor: o.autor } : {}), ...(typeof o.nota === 'string' ? { nota: o.nota } : {}) };
}

/** Menor n tal que P(Bin(n, c) ≥ m) ≥ P; por semana = ceil(n/w); por día hábil = ceil(n/(w·5)). Diseño §5. */
export function calcularOutbound(e: EntradaOutbound): ResultadoOutbound {
  if (!e || typeof e !== 'object') throw malo(`${CTX}: faltan las entradas`);
  const m = numero(e.m, 'm', CTX);
  if (!Number.isInteger(m) || m < 0 || m > MAX_M) throw malo(`${CTX}: «m» debe ser un entero entre 0 y ${MAX_M}`);
  const c = tasa(e.c, 'c', CTX);
  const P = numero(e.P, 'P', CTX);
  if (!(P > 0 && P < 1)) throw malo(`${CTX}: «P» debe estar entre 0 y 1 (sin incluirlos; 100 % no se puede garantizar)`);
  const w = numero(e.w, 'w', CTX);
  if (!(w > 0) || w > 520) throw malo(`${CTX}: «w» (semanas) debe ser mayor que 0 y como máximo 520`);
  if (e.oferta_comprobada !== undefined && typeof e.oferta_comprobada !== 'boolean') throw malo(`${CTX}: «oferta_comprobada» debe ser sí/no`);
  const sugerencia = validarSugerencia(e.sugerencia);
  const entradas: EntradaOutbound = { m, c, P, w, ...(e.oferta_comprobada !== undefined ? { oferta_comprobada: e.oferta_comprobada } : {}), ...(sugerencia ? { sugerencia } : {}) };

  let n: number;
  if (m === 0) n = 0;
  else if (c === 1) n = m;
  else {
    const ok = (x: number) => probAlMenos(x, c, m) >= P;
    let lo = m - 1; // no cumple (n < m ⇒ probabilidad 0)
    let hi = Math.max(m, Math.ceil(m / c));
    while (!ok(hi)) {
      lo = hi;
      hi *= 2;
      if (hi > Number.MAX_SAFE_INTEGER) throw malo(`${CTX}: con esa conversión el número de prospectos no es calculable; revisa «c»`);
    }
    while (hi - lo > 1) { const mid = lo + Math.floor((hi - lo) / 2); if (ok(mid)) hi = mid; else lo = mid; }
    n = hi;
  }
  return {
    n,
    por_semana: Math.ceil(n / w),
    por_dia_habil: Math.ceil(n / (w * 5)),
    probabilidad: probAlMenos(n, c, m),
    texto: TEXTO_OUTBOUND,
    entradas,
  };
}
