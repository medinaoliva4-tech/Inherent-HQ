// Marketing por cliente y por mes: qué canal escalar o parar, y tres oportunidades tomadas de la competencia. Puro.
const num = (v) => { const n = Number(String(v ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? Math.max(0, n) : 0; };
const txt = (v, n = 160) => String(v ?? '').trim().slice(0, n);
export const MAX_OPORTUNIDADES = 3;
export const idMarketing = (slug, mes) => `${slug}--${mes}`;
export function limpiarMarketing(b = {}) {
  return {
    client_slug: txt(b.client_slug, 80), mes: /^\d{4}-\d{2}$/.test(b.mes || '') ? b.mes : '', margen_pct: Math.min(100, num(b.margen_pct)),
    canales: (Array.isArray(b.canales) ? b.canales : []).slice(0, 30).map((c) => ({ nombre: txt(c?.nombre, 80), gasto: num(c?.gasto), leads: num(c?.leads), ventas: num(c?.ventas), ingreso: num(c?.ingreso) })).filter((c) => c.nombre),
    radar: (Array.isArray(b.radar) ? b.radar : []).slice(0, MAX_OPORTUNIDADES).map((o) => ({ competidor: txt(o?.competidor, 80), movida: txt(o?.movida), fuente: /^https?:\/\//i.test(o?.fuente || '') ? txt(o.fuente, 300) : '', idea: txt(o?.idea) })).filter((o) => o.competidor || o.movida),
  };
}
// Con 50% de margen se necesita vender Q2 por cada Q1 de pauta solo para no perder.
export const equilibrio = (margen_pct) => (margen_pct > 0 ? 100 / margen_pct : null);
export function veredicto(c, margen_pct) {
  const eq = equilibrio(margen_pct);
  if (!c.gasto) return 'Sin gasto';
  if (!eq) return 'Falta margen';
  const r = c.ingreso / c.gasto;
  return r >= eq * 1.5 ? 'Escalar' : r >= eq ? 'Mantener' : 'Parar o cambiar';
}
export function analizarCanales(canales, margen_pct) {
  const filas = canales.map((c) => ({ ...c, roas: c.gasto ? c.ingreso / c.gasto : 0, porLead: c.leads ? c.gasto / c.leads : 0, porVenta: c.ventas ? c.gasto / c.ventas : 0, veredicto: veredicto(c, margen_pct) })).sort((a, b) => b.roas - a.roas);
  const gasto = filas.reduce((s, c) => s + c.gasto, 0), ingreso = filas.reduce((s, c) => s + c.ingreso, 0), ventas = filas.reduce((s, c) => s + c.ventas, 0);
  return { filas, gasto, ingreso, ventas, roas: gasto ? ingreso / gasto : 0, equilibrio: equilibrio(margen_pct) };
}
export const aMovimiento = (slug, mes, titulo, espera, costo = 0) => ({ titulo, client_slug: slug, area: 'marketing', costo, espera, paso: '', decision: 'Pendiente', fecha: `${mes}-01` });
