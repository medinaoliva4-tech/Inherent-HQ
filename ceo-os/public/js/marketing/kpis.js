// Marketing Performance Center · las cuentas de los KPIs del mes (alcance, views, ER, leads, publicadas vs planeadas, gasto,
// presupuesto, CPA y ROAS), la tabla por función, pilar y canal y la franja del embudo. Puro: sin DOM ni red; lo comparten el
// servidor (api/_lib/marketing.js), la vista (rendimiento-ui.js) y las pruebas. Regla de la casa: un dato que falta es null y dice
// de dónde saldría (⚠️ SIN DATOS), nunca 0; ninguna cuenta convierte un insumo null en un número.
import { SIN_DATOS, plano, corta, numeroONull } from '../consulting/marcos.js';
import { etapaFunnel } from '../calendario-contenido.js';
import { slotsAPiezas, mesOk } from '../plan-mes.js';
import { estadoDe, ARCHIVADO } from '../element.js';

export const FUENTE_COSTOS = 'Solo CEO, COO o quien edita Clientes';
export { SIN_DATOS };

// ---------- Los KPIs: qué son y de dónde salen ----------
// costo: solo lo ven el CEO, el COO y quien edita Clientes (seesCosts de access.js). sale_de: lo que dice «⚠️ SIN DATOS: sale de …».
const K = (id, nombre, formato, sale_de, costo = false) => ({ id, nombre, formato, sale_de, costo });
export const KPIS = [
  K('alcance', 'Alcance', 'entero', 'Windsor (el Instagram de la marca)'),
  K('views', 'Views', 'entero', 'Windsor (el Instagram de la marca)'),
  K('er', 'Engagement (ER)', 'pct', 'Windsor (los posts de Instagram de la marca)'),
  K('leads', 'Leads', 'entero', 'el CRM (los leads que llevan a este cliente, o su landing conectada)'),
  K('publicadas', 'Piezas publicadas', 'entero', 'el calendario de contenido (las piezas Publicadas del mes)'),
  K('planeadas', 'Piezas planeadas', 'entero', 'el Plan del mes o las piezas con fecha en ese mes'),
  K('gasto', 'Gasto de pauta', 'dinero', 'Windsor (las cuentas de pauta del cliente)', true),
  K('presupuesto', 'Presupuesto de pauta', 'dinero', 'las cuentas de pauta del cliente (lo pone ⑩ Ads)', true),
  K('cpa', 'CPA', 'dinero', 'Windsor (gasto y conversiones de la pauta)', true),
  K('roas', 'ROAS', 'x', 'Windsor (gasto y valor de las conversiones de la pauta)', true),
];
export const KPI_IDS = KPIS.map((k) => k.id);
export const COSTO_IDS = KPIS.filter((k) => k.costo).map((k) => k.id);
export const kpiDe = (id) => KPIS.find((k) => k.id === id) || null;
export const esCosto = (id) => COSTO_IDS.includes(id);
export const nombreKpi = (id) => kpiDe(id)?.nombre || String(id || '');

// ---------- Números ----------
const num = (v) => (typeof v === 'number' ? (Number.isFinite(v) ? v : null) : v == null || v === '' ? null : numeroONull(v));
const redondea = (n, d = 0) => { const f = 10 ** d; return Math.round(n * f) / f; };
export const sinNegativo = (v) => { const n = num(v); return n !== null && n >= 0 ? n : null; };
// Una cuenta con un insumo que falta (o que no puede dividir) da null. Nunca 0.
export const pct = (parte, total) => { const a = sinNegativo(parte), b = num(total); return a === null || b === null || b <= 0 ? null : Math.round((a / b) * 100); };
export const ER = (interacciones, alcance) => { const i = sinNegativo(interacciones), a = num(alcance); return i === null || a === null || a <= 0 ? null : redondea((i / a) * 100, 1); };
export const CPA = (gasto, conversiones) => { const g = sinNegativo(gasto), c = num(conversiones); return g === null || c === null || c <= 0 ? null : redondea(g / c, 2); };
// Sin ingresos medidos (0 o vacío) no hay ROAS: «0 ingresos» y «no mide ventas» no se distinguen.
export const ROAS = (ingresos, gasto) => { const r = num(ingresos), g = num(gasto); return r === null || g === null || r <= 0 || g <= 0 ? null : redondea(r / g, 2); };
export const usoPresupuesto = (gasto, presupuesto) => pct(gasto, presupuesto);

// ---------- Meses (AAAA-MM) ----------
export const mesDe = (fecha) => { const m = /^(\d{4}-(?:0[1-9]|1[0-2]))/.exec(String(fecha ?? '')); return m ? m[1] : ''; };
export const mesMas = (mes, n) => { if (!mesOk(mes)) return ''; const [y, m] = mes.split('-').map(Number), t = y * 12 + m - 1 + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`; };
// Los últimos `n` meses que terminan en el de `hoy` (AAAA-MM-DD o AAAA-MM), del más reciente al más viejo.
export const mesesRecientes = (hoy, n = 12) => { const m = mesDe(hoy); return m ? Array.from({ length: n }, (_, i) => mesMas(m, -i)) : []; };

// ---------- Las piezas del mes ----------
// Una pieza «publicada»: su estado es Publicado, o está archivada pero ya había salido (conserva published_at).
const publicada = (p) => (typeof p?.publicada === 'boolean' ? p.publicada : estadoDe(p) === 'Publicado' || (estadoDe(p) === ARCHIVADO && Boolean(p?.published_at)));
const canalDeFormato = (f) => ({ tiktok: 'TikTok', youtube: 'YouTube' })[String(f ?? '').trim().toLowerCase()] || '';
// Las piezas de un mes: las del calendario con fecha en ese mes (sin las archivadas que nunca salieron) más los slots del Plan del
// mes que todavía no son pieza (el plan no se pasó a Creatividad). Cada una → { id, funcion, pilar, canal, etapa, estado, publicada, virtual }.
export function piezasDelMes({ posts = [], plan = null, slug = '', mes = '' } = {}) {
  if (!mesOk(mes)) return [];
  const todas = (Array.isArray(posts) ? posts : []).filter((x) => plano(x) && x.kind === 'post' && (!slug || x.profile === slug));
  const ids = new Set(todas.map((x) => x.id));
  const norm = (x, virtual) => {
    const s = plano(x.slot) ? x.slot : {};
    return { id: String(x.id ?? ''), funcion: corta(x.funcion || s.funcion, 40), pilar: corta(x.pillar || x.pilar || s.pilar, 60), canal: corta(s.canal || x.canal, 40) || canalDeFormato(x.format),
      etapa: etapaFunnel(x) || etapaFunnel(s), estado: virtual ? 'Idea' : estadoDe(x), publicada: virtual ? false : publicada(x), virtual };
  };
  const reales = todas.filter((x) => mesDe(x.date) === mes && !(estadoDe(x) === ARCHIVADO && !x.published_at)).map((x) => norm(x, false));
  const faltan = plano(plan) && Array.isArray(plan.slots) && slug ? slotsAPiezas(plan, slug, mes).filter((e) => !ids.has(e.id)).map((e) => norm({ ...e.data, id: e.id }, true)) : [];
  return [...reales, ...faltan];
}

// Publicadas vs planeadas del mes. Sin una sola pieza (ni plan) no hay con qué contar: todo null, no 0.
export function publicadasVsPlaneadas(piezas) {
  const l = Array.isArray(piezas) ? piezas : [];
  if (!l.length) return { publicadas: null, planeadas: null, pct: null };
  const p = l.filter(publicada).length;
  return { publicadas: p, planeadas: l.length, pct: pct(p, l.length) };
}

// ---------- Agrupar (la tabla por función, pilar y canal) ----------
export const SIN_CLAVE = 'Sin definir';
// El valor de una pieza en un campo. Acepta la pieza ya normalizada o el documento de content (lee su slot).
export function valorDe(pieza, campo) {
  if (typeof campo === 'function') return corta(campo(pieza), 80);
  const p = plano(pieza) ? pieza : {}, s = plano(p.slot) ? p.slot : {};
  if (campo === 'funcion') return corta(p.funcion || s.funcion, 40);
  if (campo === 'pilar') return corta(p.pilar || p.pillar || s.pilar, 60);
  if (campo === 'canal') return corta(p.canal || s.canal, 40) || canalDeFormato(p.format);
  if (campo === 'etapa') return p.etapa || etapaFunnel(p) || etapaFunnel(s);
  return corta(p[campo], 80);
}
// → [{ clave, planeadas, publicadas, pct }], de más a menos planeadas; lo sin definir al final. Solo cuenta lo que hay: sin piezas, [].
export function agruparPor(piezas, campo) {
  const por = new Map();
  for (const p of Array.isArray(piezas) ? piezas : []) {
    if (!plano(p)) continue;
    const k = valorDe(p, campo) || SIN_CLAVE, x = por.get(k) || por.set(k, { clave: k, planeadas: 0, publicadas: 0 }).get(k);
    x.planeadas++; if (publicada(p)) x.publicadas++;
  }
  return [...por.values()].map((x) => ({ ...x, pct: pct(x.publicadas, x.planeadas) }))
    .sort((a, z) => (a.clave === SIN_CLAVE) - (z.clave === SIN_CLAVE) || z.planeadas - a.planeadas || a.clave.localeCompare(z.clave, 'es'));
}
export const FALTAN_METRICAS = `${SIN_DATOS}: el rendimiento (alcance, ER, resultado) por función, pilar y canal sale de las métricas por slot de ⑨ Posting y ⑩ Ads; hoy solo se cuenta lo planeado contra lo publicado`;
export const tablaDe = (piezas) => ({ porFuncion: agruparPor(piezas, 'funcion'), porPilar: agruparPor(piezas, 'pilar'), porCanal: agruparPor(piezas, 'canal'), fuente: 'Calendario de contenido y Plan del mes', faltan: FALTAN_METRICAS });

// ---------- La franja del embudo ----------
const deDe = (x) => (/^el /i.test(x) ? `del ${x.slice(3)}` : `de ${x}`); // «de el CRM» → «del CRM»
const fuenteOSinDatos = (valor, fuente, saleDe, razon = '') => (valor === null ? `${SIN_DATOS}: sale ${deDe(saleDe)}${razon ? ` · ${corta(razon, 160)}` : ''}` : fuente);
// TOF: a cuántos llegó · MOF: cuántos interactuaron · BOF: cuántos leads entraron. Un dato que falta es null con su fuente. `piezas` = las publicadas en esa etapa.
export function embudoDe(piezas, { alcance = null, interacciones = null, leads = null, razon = {} } = {}) {
  const l = Array.isArray(piezas) ? piezas : [], conEtapa = l.some((p) => p?.etapa);
  const medidas = [
    ['TOF', 'Alcance', sinNegativo(alcance), 'Windsor · Instagram', 'Windsor (el Instagram de la marca)'],
    ['MOF', 'Interacciones', sinNegativo(interacciones), 'Windsor · Instagram', 'Windsor (los posts de Instagram de la marca)'],
    ['BOF', 'Leads', sinNegativo(leads), 'CRM de Inherent OS', 'el CRM (los leads que llevan a este cliente)'],
  ];
  return medidas.map(([etapa, medida, valor, fuente, saleDe]) => ({ etapa, medida, valor, fuente: fuenteOSinDatos(valor, fuente, saleDe, razon?.[etapa]),
    piezas: conEtapa ? l.filter((p) => p?.etapa === etapa && publicada(p)).length : null }));
}

// ---------- Armar los KPIs ----------
// insumos (todo opcional; lo que falta es null):
//   ig:     { alcance, views, interacciones, alcancePosts, nota, notaEr, razon, razonEr }   (alcance y views ya del mes; el ER, de la ventana que diga notaEr)
//   leads:  { total, porFuente: [{ fuente, n }], conectado, razon }
//   ads:    { gasto, presupuesto, aprobado, gastoVentana, conversiones, ingresos, notaGasto, notaVentana, razon, razonGasto, razonPresupuesto, razonCpa, razonRoas, razonConversiones }
//   piezas: lo que devuelve piezasDelMes()
// verCostos: false → gasto, presupuesto, CPA y ROAS salen null con FUENTE_COSTOS (nunca se calculan para quien no los ve).
export function armarKpis(insumos = {}, { verCostos = false } = {}) {
  const I = plano(insumos) ? insumos : {}, ig = plano(I.ig) ? I.ig : {}, ld = plano(I.leads) ? I.leads : {}, ad = plano(I.ads) ? I.ads : {};
  const pp = publicadasVsPlaneadas(I.piezas);
  const sinPorFuente = (Array.isArray(ld.porFuente) ? ld.porFuente : []).filter((x) => plano(x) && num(x.n) !== null).map((x) => ({ fuente: corta(x.fuente, 60) || 'Sin fuente', n: num(x.n) }));
  const gasto = sinNegativo(ad.gasto), presupuesto = sinNegativo(ad.presupuesto);
  // CPA y ROAS se calculan dentro de la misma ventana que sus conversiones (gastoVentana); sin ella, con el gasto del mes.
  const gastoVentana = 'gastoVentana' in ad ? sinNegativo(ad.gastoVentana) : gasto;
  const uso = usoPresupuesto(gasto, presupuesto);
  const valores = {
    alcance: [sinNegativo(ig.alcance), 'Windsor · Instagram', ig.razon, ig.nota],
    views: [sinNegativo(ig.views), 'Windsor · Instagram', ig.razon, ig.nota],
    er: [ER(ig.interacciones, ig.alcancePosts), 'Windsor · Instagram', ig.razonEr || ig.razon, ig.notaEr],
    leads: [sinNegativo(ld.total), 'CRM de Inherent OS', ld.razon, sinPorFuente.length ? sinPorFuente.map((x) => `${x.fuente} ${x.n}`).join(' · ') : ''],
    publicadas: [pp.publicadas, 'Calendario de contenido', '', pp.planeadas !== null ? `De ${pp.planeadas} planeadas${pp.pct !== null ? ` · ${pp.pct}%` : ''}` : ''],
    planeadas: [pp.planeadas, 'Plan del mes y calendario', '', ''],
    gasto: [gasto, 'Windsor · pauta', ad.razonGasto || ad.razon, [ad.notaGasto, uso !== null ? `${uso}% del presupuesto` : ''].filter(Boolean).join(' · ')],
    presupuesto: [presupuesto, 'Cuentas de pauta del cliente', ad.razonPresupuesto, ad.aprobado === true ? 'Con el OK del CEO este mes' : ad.aprobado === false && presupuesto !== null ? 'Sin el OK del CEO para este mes' : ''],
    cpa: [CPA(gastoVentana, ad.conversiones), 'Windsor · pauta', ad.razonCpa || ad.razonConversiones || ad.razon, ad.notaVentana],
    roas: [ROAS(ad.ingresos, gastoVentana), 'Windsor · pauta', ad.razonRoas || ad.razonConversiones || ad.razon, ad.notaVentana],
  };
  return KPIS.map((k) => {
    const [valor, fuente, razon, nota] = valores[k.id];
    if (k.costo && !verCostos) return { id: k.id, nombre: k.nombre, formato: k.formato, valor: null, fuente: FUENTE_COSTOS, nota: '', restringido: true };
    const extra = k.id === 'leads' && sinPorFuente.length ? { detalle: sinPorFuente } : {};
    return { id: k.id, nombre: k.nombre, formato: k.formato, valor, fuente: fuenteOSinDatos(valor, fuente, k.sale_de, razon), nota: corta(nota, 200), ...extra };
  });
}

// ---------- Mostrar ----------
const miles = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
// El valor listo para pintar; null → '' (quien pinta pone ⚠️ SIN DATOS o «Restringido»).
export function textoValor(k) {
  const v = num(k?.valor); if (v === null) return '';
  return k.formato === 'pct' ? `${miles(v, 1)}%` : k.formato === 'x' ? `${miles(v, 2)}x` : k.formato === 'dinero' ? miles(v, v % 1 ? 2 : 0) : miles(v);
}

// ---------- Costos en el texto ----------
// El texto libre (resumen, hallazgos, acciones) no se escribe con un KPI de costo, pero un modelo o una persona pueden mencionarlos:
// la versión del portal descarta lo que hable de gasto, presupuesto, CPA, ROAS, costos, márgenes, inversión, horas o montos.
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const RE_COSTOS = /\b(gastos?|gastamos|gastaron|gastar|gastado|presupuestos?|cpa|cpl|cpc|cpm|roas|costos?|costaron|costar|margen|margenes|inversion|inversiones|invirti\w*|invert\w*|tarifas?|honorarios|fee|horas|usd|gtq)\b|\$\s?\d|\bq\s?\d[\d.,]{2,}/;
export const hablaDeCostos = (texto) => RE_COSTOS.test(fold(texto));
// El texto sin las frases que hablan de costos.
export const sinFrasesDeCostos = (texto) => String(texto ?? '').split(/(?<=[.!?])\s+/).filter((f) => f.trim() && !hablaDeCostos(f)).join(' ').trim();
