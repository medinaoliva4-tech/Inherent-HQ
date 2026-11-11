import { malo, numero, tasa } from './errores.js';
import type { MetricasReales } from './zernio.js';

/** De dónde sale un número: supuesto (lo puso la persona o el agente) o real (métricas de un periodo). */
export type Origen =
  | { fuente: 'supuesto' }
  | { fuente: 'real'; desde: string; hasta: string; numerador: number; denominador: number };

export type ClaveOrigen = 'clic' | 'lead' | 'cliente' | 'engagement' | 'frecuencia' | 'cpm' | 'cpc';
export type Origenes = Record<ClaveOrigen, Origen>;

export interface EntradaInbound {
  /** Ventas / clientes meta del periodo. */
  clientes_meta: number;
  /** Embudo: alcance → clic, clic → lead, lead → cliente (0–1]. */
  tasas: { clic: number; lead: number; cliente: number };
  /** Interacciones / alcance que cada pieza debe lograr (meta, no se calibra). */
  engagement_objetivo: number;
  /** Impresiones por persona alcanzada (≥ 1). Por defecto 1. */
  frecuencia?: number;
  presupuesto?: number;
  /** Costo por mil impresiones y por clic de referencia. */
  cpm?: number;
  cpc?: number;
  segmentacion?: string;
  /** Ángulos del tablero pilares × ángulos: un reel de prueba por ángulo. */
  angulos?: string[];
  moneda?: string;
}

export interface ReelPrueba { angulo: string; impresiones: number; presupuesto: number | null; engagement_minimo: number; interacciones_minimas: number }

export interface ResultadoInbound {
  clientes: number;
  leads: number;
  clics: number;
  alcance: number;
  impresiones: number;
  interacciones_objetivo: number;
  presupuesto_estimado: { por_cpm: number | null; por_cpc: number | null; estimado: number | null };
  con_presupuesto: { presupuesto: number; alcanza: boolean; faltante: number; clientes_esperados: number } | null;
  reels_prueba: ReelPrueba[];
  /** Engagement real del periodo calibrado (si hay), para compararlo con el objetivo. */
  engagement_real: number | null;
  origen: Origenes;
  entradas: EntradaInbound;
}

const CTX = 'Calculadora inbound';
const SUPUESTO: Origen = { fuente: 'supuesto' };
const dinero = (x: number) => Math.round(x * 100) / 100;
const positivo = (v: unknown, campo: string) => { const x = numero(v, campo, CTX); if (x <= 0) throw malo(`${CTX}: «${campo}» debe ser mayor que 0`); return x; };

export function validarInbound(e: EntradaInbound): EntradaInbound {
  if (!e || typeof e !== 'object') throw malo(`${CTX}: faltan las entradas`);
  const clientes_meta = numero(e.clientes_meta, 'clientes_meta', CTX);
  if (!Number.isInteger(clientes_meta) || clientes_meta < 1 || clientes_meta > 1e7) throw malo(`${CTX}: «clientes_meta» debe ser un entero entre 1 y 10 000 000`);
  if (!e.tasas || typeof e.tasas !== 'object') throw malo(`${CTX}: faltan las «tasas» del embudo (clic, lead, cliente)`);
  const tasas = { clic: tasa(e.tasas.clic, 'tasas.clic', CTX), lead: tasa(e.tasas.lead, 'tasas.lead', CTX), cliente: tasa(e.tasas.cliente, 'tasas.cliente', CTX) };
  const engagement_objetivo = tasa(e.engagement_objetivo, 'engagement_objetivo', CTX, { cero: true });
  const out: EntradaInbound = { clientes_meta, tasas, engagement_objetivo };
  if (e.frecuencia !== undefined) { const f = numero(e.frecuencia, 'frecuencia', CTX); if (f < 1 || f > 100) throw malo(`${CTX}: «frecuencia» debe estar entre 1 y 100`); out.frecuencia = f; }
  if (e.presupuesto !== undefined) out.presupuesto = positivo(e.presupuesto, 'presupuesto');
  if (e.cpm !== undefined) out.cpm = positivo(e.cpm, 'cpm');
  if (e.cpc !== undefined) out.cpc = positivo(e.cpc, 'cpc');
  if (e.segmentacion !== undefined) { if (typeof e.segmentacion !== 'string') throw malo(`${CTX}: «segmentacion» debe ser texto`); out.segmentacion = e.segmentacion.slice(0, 2000); }
  if (e.moneda !== undefined) { if (typeof e.moneda !== 'string' || !/^[A-Z]{3}$/.test(e.moneda)) throw malo(`${CTX}: «moneda» debe ser un código de 3 letras (USD, GTQ…)`); out.moneda = e.moneda; }
  if (e.angulos !== undefined) {
    if (!Array.isArray(e.angulos) || e.angulos.length > 20 || e.angulos.some((a) => typeof a !== 'string' || !a.trim())) throw malo(`${CTX}: «angulos» debe ser una lista de hasta 20 textos`);
    out.angulos = e.angulos.map((a) => a.trim());
  }
  return out;
}

/** Embudo inverso: clientes → leads → clics → alcance → impresiones, con `ceil` en cada paso. Diseño §5. */
export function calcularInbound(entrada: EntradaInbound, origen: Partial<Origenes> = {}): ResultadoInbound {
  const e = validarInbound(entrada);
  const frecuencia = e.frecuencia ?? 1;
  const leads = Math.ceil(e.clientes_meta / e.tasas.cliente);
  const clics = Math.ceil(leads / e.tasas.lead);
  const alcance = Math.ceil(clics / e.tasas.clic);
  const impresiones = Math.ceil(alcance * frecuencia);
  const interacciones_objetivo = Math.ceil(alcance * e.engagement_objetivo);

  const por_cpm = e.cpm !== undefined ? dinero((impresiones / 1000) * e.cpm) : null;
  const por_cpc = e.cpc !== undefined ? dinero(clics * e.cpc) : null;
  const opciones = [por_cpm, por_cpc].filter((x): x is number => x !== null);
  const estimado = opciones.length ? Math.max(...opciones) : null; // el más caro: conservador

  let con_presupuesto: ResultadoInbound['con_presupuesto'] = null;
  if (e.presupuesto !== undefined && (e.cpm !== undefined || e.cpc !== undefined)) {
    // Lo que compra el presupuesto, por cada vía; se queda la más corta (conservador).
    const porVia: number[] = [];
    if (e.cpm !== undefined) porVia.push(((e.presupuesto / e.cpm) * 1000) / frecuencia * e.tasas.clic * e.tasas.lead * e.tasas.cliente);
    if (e.cpc !== undefined) porVia.push((e.presupuesto / e.cpc) * e.tasas.lead * e.tasas.cliente);
    const clientes_esperados = Math.floor(Math.min(...porVia) + 1e-9);
    con_presupuesto = { presupuesto: e.presupuesto, alcanza: estimado! <= e.presupuesto, faltante: dinero(Math.max(0, estimado! - e.presupuesto)), clientes_esperados };
  }

  const angulos = e.angulos?.length ? e.angulos : ['ángulo 1', 'ángulo 2', 'ángulo 3'];
  const reels_prueba: ReelPrueba[] = angulos.map((angulo) => ({
    angulo,
    impresiones: Math.ceil(impresiones / angulos.length),
    presupuesto: estimado === null ? null : dinero(estimado / angulos.length),
    engagement_minimo: e.engagement_objetivo,
    interacciones_minimas: Math.ceil((alcance / angulos.length) * e.engagement_objetivo),
  }));

  const og: Origenes = { clic: SUPUESTO, lead: SUPUESTO, cliente: SUPUESTO, engagement: SUPUESTO, frecuencia: SUPUESTO, cpm: SUPUESTO, cpc: SUPUESTO, ...origen };
  const eng = og.engagement;
  return {
    clientes: e.clientes_meta, leads, clics, alcance, impresiones, interacciones_objetivo,
    presupuesto_estimado: { por_cpm, por_cpc, estimado },
    con_presupuesto, reels_prueba,
    engagement_real: eng.fuente === 'real' && eng.denominador > 0 ? eng.numerador / eng.denominador : null,
    origen: og,
    entradas: e,
  };
}

/** Debajo de este denominador la tasa real se usa, pero con advertencia de muestra chica. */
export const MUESTRA_MINIMA = 1000;

export interface Calibracion { entrada: EntradaInbound; origen: Origenes; advertencias: string[]; metricas: MetricasReales }

/**
 * Autocalibración: reemplaza las tasas supuestas por las reales del periodo y marca cada número.
 * Si una tasa real no se puede calcular (falta el dato, denominador 0, tasa 0 o > 1), se conserva la supuesta y se avisa.
 * El engagement objetivo es una meta: no se reemplaza; el real queda en `origen.engagement` para compararlo.
 */
export function calibrarInbound(entrada: EntradaInbound, m: MetricasReales): Calibracion {
  const e = validarInbound(entrada);
  const out: EntradaInbound = { ...e, tasas: { ...e.tasas } };
  const origen: Origenes = { clic: SUPUESTO, lead: SUPUESTO, cliente: SUPUESTO, engagement: SUPUESTO, frecuencia: SUPUESTO, cpm: SUPUESTO, cpc: SUPUESTO };
  const adv: string[] = [];
  const real = (numerador: number, denominador: number): Origen => ({ fuente: 'real', desde: m.desde, hasta: m.hasta, numerador, denominador });
  const probar = (clave: ClaveOrigen, nombre: string, numerador: number | undefined, denominador: number | undefined, aplicar: (v: number) => void, { tope = 1, min = 0, escala = 1 } = {}) => {
    if (numerador === undefined || denominador === undefined) return;
    if (denominador <= 0) { adv.push(`${nombre}: sin datos reales en el periodo (denominador 0); se mantiene la supuesta`); return; }
    const v = (numerador * escala) / denominador;
    if (v <= min) { adv.push(`${nombre}: la tasa real es 0 (${numerador} de ${denominador}); se mantiene la supuesta`); return; }
    if (v > tope) { adv.push(`${nombre}: la tasa real sale ${v.toFixed(3)} (mayor que ${tope}); revisa las métricas, se mantiene la supuesta`); return; }
    if (denominador < MUESTRA_MINIMA && escala === 1) adv.push(`${nombre}: muestra chica (${denominador}); tómala con cuidado`);
    aplicar(v); origen[clave] = real(numerador, denominador);
  };
  probar('clic', 'clic', m.clics, m.alcance, (v) => { out.tasas.clic = v; });
  probar('lead', 'lead', m.leads, m.clics, (v) => { out.tasas.lead = v; });
  probar('cliente', 'cliente', m.ventas, m.leads, (v) => { out.tasas.cliente = v; });
  probar('frecuencia', 'frecuencia', m.impresiones, m.alcance, (v) => { out.frecuencia = v; }, { tope: 100, min: 0 });
  if (m.alcance > 0 && m.interacciones / m.alcance <= 1) origen.engagement = real(m.interacciones, m.alcance);
  if (m.gasto !== undefined && m.gasto > 0) {
    probar('cpm', 'CPM', m.gasto, m.impresiones, (v) => { out.cpm = v; }, { tope: Infinity, escala: 1000 });
    probar('cpc', 'CPC', m.gasto, m.clics, (v) => { out.cpc = v; }, { tope: Infinity, escala: 1 });
  }
  if (out.frecuencia !== undefined && out.frecuencia < 1) { out.frecuencia = e.frecuencia; origen.frecuencia = SUPUESTO; }
  return { entrada: out, origen, advertencias: adv, metricas: m };
}
