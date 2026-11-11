/** Perfil del cliente ideal (ICP). Criterios del diseño §6. */
export interface Icp {
  /** Código de 3 letras (USD, GTQ…) para todos los montos del perfil. */
  moneda: string;
  facturacion_mensual: { min: number; max?: number };
  ticket_promedio: number;
  frecuencia_ventas: { ventas: number; periodo: 'dia' | 'semana' | 'mes' };
  demanda: 'alta' | 'media' | 'baja';
  /** Días de la primera conversación al cobro. */
  ciclo_comercial: { dias: number };
  /** Margen bruto (0–1). Debe alcanzar para pagar el producto. */
  margen: number;
  capacidad: string;
  decisor: string;
  industrias: string[];
  perfiles?: string[];
  geografia: string[];
  canales: string[];
  /** Regla guía editable por producto: «el cliente factura ~multiplo × el precio del producto». */
  regla_guia: { multiplo: number; precio_producto: number; texto?: string; ciclo_rapido_dias?: number };
}

export interface ErrorCampo { campo: string; mensaje: string }
export interface ValidacionIcp { ok: boolean; completo: boolean; faltan: string[]; errores: ErrorCampo[]; alertas: string[] }

const OBLIGATORIOS = ['moneda', 'facturacion_mensual', 'ticket_promedio', 'frecuencia_ventas', 'demanda', 'ciclo_comercial', 'margen', 'capacidad', 'decisor', 'industrias', 'geografia', 'canales', 'regla_guia'] as const;
const OPCIONALES = ['perfiles'] as const;
const CICLO_RAPIDO_DIAS = 30;

const esNum = (v: unknown, min = 0) => typeof v === 'number' && Number.isFinite(v) && v >= min;
const esTexto = (v: unknown) => typeof v === 'string' && v.trim().length > 0 && v.length <= 2000;
const esLista = (v: unknown) => Array.isArray(v) && v.length > 0 && v.length <= 50 && v.every(esTexto);
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

type Regla = (v: unknown) => string | null;
const REGLAS: Record<(typeof OBLIGATORIOS)[number] | (typeof OPCIONALES)[number], Regla> = {
  moneda: (v) => (typeof v === 'string' && /^[A-Z]{3}$/.test(v) ? null : 'código de 3 letras en mayúsculas (USD, GTQ…)'),
  facturacion_mensual: (v) => (obj(v) && esNum(v.min) && (v.max === undefined || (esNum(v.max) && (v.max as number) >= (v.min as number))) ? null : '{min, max?} con montos ≥ 0 y max ≥ min'),
  ticket_promedio: (v) => (esNum(v) && (v as number) > 0 ? null : 'monto mayor que 0'),
  frecuencia_ventas: (v) => (obj(v) && esNum(v.ventas) && ['dia', 'semana', 'mes'].includes(v.periodo as string) ? null : '{ventas, periodo: dia|semana|mes}'),
  demanda: (v) => (['alta', 'media', 'baja'].includes(v as string) ? null : 'alta, media o baja'),
  ciclo_comercial: (v) => (obj(v) && esNum(v.dias) ? null : '{dias} con días ≥ 0'),
  margen: (v) => (esNum(v) && (v as number) <= 1 ? null : 'número entre 0 y 1'),
  capacidad: (v) => (esTexto(v) ? null : 'texto'),
  decisor: (v) => (esTexto(v) ? null : 'texto'),
  industrias: (v) => (esLista(v) ? null : 'lista con al menos una industria'),
  perfiles: (v) => (Array.isArray(v) && v.length <= 50 && v.every(esTexto) ? null : 'lista de textos'),
  geografia: (v) => (esLista(v) ? null : 'lista con al menos un lugar'),
  canales: (v) => (esLista(v) ? null : 'lista con al menos un canal'),
  regla_guia: (v) => (obj(v) && esNum(v.multiplo) && (v.multiplo as number) > 0 && esNum(v.precio_producto) && (v.texto === undefined || esTexto(v.texto)) && (v.ciclo_rapido_dias === undefined || esNum(v.ciclo_rapido_dias)) ? null : '{multiplo > 0, precio_producto ≥ 0, texto?, ciclo_rapido_dias?}'),
};

/**
 * Valida un ICP. `ok` = los campos presentes tienen la forma correcta (sirve para guardar hipótesis parciales).
 * `completo` = además están todos los criterios (se exige para aprobar). Las `alertas` aplican la regla guía y los
 * criterios del §6 (demanda alta, ciclo rápido, margen que pague el producto): orientan, no bloquean.
 */
export function validarIcp(v: unknown): ValidacionIcp {
  if (!obj(v)) return { ok: false, completo: false, faltan: [...OBLIGATORIOS], errores: [{ campo: '(icp)', mensaje: 'el ICP debe ser un objeto' }], alertas: [] };
  const errores: ErrorCampo[] = [];
  for (const k of Object.keys(v)) {
    const regla = REGLAS[k as keyof typeof REGLAS];
    if (!regla) { errores.push({ campo: k, mensaje: 'campo desconocido' }); continue; }
    if (v[k] === undefined) continue;
    const m = regla(v[k]); if (m) errores.push({ campo: k, mensaje: m });
  }
  const faltan = OBLIGATORIOS.filter((k) => v[k] === undefined);
  const alertas: string[] = [];
  if (!errores.length) {
    const i = v as Partial<Icp>;
    const r = i.regla_guia;
    const fmin = i.facturacion_mensual?.min;
    if (r && fmin !== undefined && fmin < r.multiplo * r.precio_producto)
      alertas.push(`Regla guía: factura ${fmin} y debería facturar ~${r.multiplo}× el precio del producto (${r.multiplo * r.precio_producto})`);
    if (i.demanda && i.demanda !== 'alta') alertas.push(`La demanda es ${i.demanda}; el perfil pide demanda alta`);
    const rapido = r?.ciclo_rapido_dias ?? CICLO_RAPIDO_DIAS;
    if (i.ciclo_comercial && i.ciclo_comercial.dias > rapido) alertas.push(`El ciclo comercial es de ${i.ciclo_comercial.dias} días; el perfil pide un ciclo rápido (≤ ${rapido})`);
    if (r && fmin !== undefined && i.margen !== undefined && fmin * i.margen < r.precio_producto)
      alertas.push(`El margen no alcanza para pagar el producto: ${fmin} × ${i.margen} = ${Math.round(fmin * i.margen)} < ${r.precio_producto}`);
  }
  return { ok: errores.length === 0, completo: errores.length === 0 && faltan.length === 0, faltan, errores, alertas };
}
