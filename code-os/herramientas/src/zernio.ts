import { malo } from './errores.js';

/** Métricas reales de un periodo, ya normalizadas. Lo único que la calculadora inbound necesita de Zernio. */
export interface MetricasReales {
  desde: string;
  hasta: string;
  impresiones: number;
  alcance: number;
  clics: number | undefined;
  interacciones: number;
  leads: number | undefined;
  ventas: number | undefined;
  publicaciones: number | undefined;
  /** Gasto en pauta del periodo (no viene de Zernio analytics; se pasa aparte si existe). */
  gasto: number | undefined;
}

export interface ExtrasZernio { desde?: string; hasta?: string; leads?: number; ventas?: number; gasto?: number }

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);
const dia = (v: unknown): string | undefined => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : undefined);

interface Suma { impresiones?: number; alcance?: number; clics?: number; interacciones?: number }

/** Lee las métricas de un objeto de Zernio (totals de un día, analytics de un post…) con nombres en inglés o español. */
function metricas(o: Record<string, unknown>): Suma {
  const engagement = num(o.engagement) ?? num(o.interactions) ?? num(o.interacciones);
  const partes = ['likes', 'comments', 'shares', 'saves'].map((k) => num(o[k]));
  const suma = partes.some((x) => x !== undefined) ? partes.reduce<number>((s, x) => s + (x ?? 0), 0) : undefined;
  return {
    impresiones: num(o.impressions) ?? num(o.impresiones),
    alcance: num(o.reach) ?? num(o.alcance),
    clics: num(o.clicks) ?? num(o.clics) ?? num(o.website_clicks),
    interacciones: engagement ?? suma,
  };
}
const sumar = (a: Suma, b: Suma): Suma => {
  const s = (x?: number, y?: number) => (x === undefined && y === undefined ? undefined : (x ?? 0) + (y ?? 0));
  return { impresiones: s(a.impresiones, b.impresiones), alcance: s(a.alcance, b.alcance), clics: s(a.clics, b.clics), interacciones: s(a.interacciones, b.interacciones) };
};

/**
 * Adaptador del JSON de analytics de Zernio. Acepta:
 * - métricas diarias: `{ totals: {impressions, reach, likes, comments, shares, saves, clicks…}, dateRange?: {from, to}, dailyData?|days?: [{date…}] }`
 * - lista de posts: `{ posts: [{ publishedAt, analytics|metrics: {impressions, reach, engagement?|likes…, clicks} }] }`
 * Leads, ventas y gasto no vienen en analytics: van en el mismo JSON (`leads`, `ventas`|`sales`, `gasto`|`spend`) o en `extras`.
 * No llama a Zernio: solo traduce.
 */
export function desdeZernio(json: unknown, extras: ExtrasZernio = {}): MetricasReales {
  if (!json || typeof json !== 'object') throw malo('Zernio: el JSON de analytics no es un objeto');
  const j = json as Record<string, any>;
  let total: Suma = {};
  let fechas: string[] = [];
  let publicaciones: number | undefined;
  if (j.totals && typeof j.totals === 'object') {
    total = metricas(j.totals);
    const dias = Array.isArray(j.dailyData) ? j.dailyData : Array.isArray(j.days) ? j.days : [];
    fechas = dias.map((d: any) => dia(d?.date)).filter(Boolean) as string[];
    publicaciones = num(j.totals.posts) ?? num(j.totals.postCount);
  } else if (Array.isArray(j.posts)) {
    for (const p of j.posts) {
      if (!p || typeof p !== 'object') continue;
      total = sumar(total, metricas((p.analytics ?? p.metrics ?? p) as Record<string, unknown>));
      const f = dia(p.publishedAt ?? p.published_at ?? p.date); if (f) fechas.push(f);
    }
    publicaciones = j.posts.length;
  } else throw malo('Zernio: formato no reconocido (se espera «totals» de métricas diarias o «posts» de analytics)');

  if (total.impresiones === undefined || total.alcance === undefined) throw malo('Zernio: faltan impresiones o alcance en las métricas');
  fechas.sort();
  const desde = dia(extras.desde) ?? dia(j.dateRange?.from) ?? dia(j.fromDate) ?? fechas[0];
  const hasta = dia(extras.hasta) ?? dia(j.dateRange?.to) ?? dia(j.toDate) ?? fechas[fechas.length - 1];
  if (!desde || !hasta) throw malo('Zernio: no se sabe el rango de fechas; pásalo en «desde» y «hasta»');
  return {
    desde, hasta,
    impresiones: total.impresiones,
    alcance: total.alcance,
    clics: total.clics,
    interacciones: total.interacciones ?? 0,
    leads: num(extras.leads) ?? num(j.leads),
    ventas: num(extras.ventas) ?? num(j.ventas) ?? num(j.sales),
    publicaciones,
    gasto: num(extras.gasto) ?? num(j.gasto) ?? num(j.spend),
  };
}
