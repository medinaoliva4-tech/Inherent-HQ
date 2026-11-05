// Costo y entrega por pieza de un cliente, por mes: qué costó producirla, qué dejó y si llegó a tiempo. Puro.
export const TIPOS_PIEZA = ['Video', 'Foto', 'Diseño', 'Otro'];
const num = (v) => { const n = Number(String(v ?? '').replace(/[^\d.]/g, '')); return Number.isFinite(n) ? n : 0; };
const fecha = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '');
export const idProduccion = (slug, mes) => `${slug}--${mes}`;
export function limpiarProduccion(b = {}) {
  return {
    client_slug: String(b.client_slug ?? '').trim().slice(0, 80), mes: /^\d{4}-\d{2}$/.test(b.mes || '') ? b.mes : '', costo_hora: num(b.costo_hora),
    piezas: (Array.isArray(b.piezas) ? b.piezas : []).slice(0, 80).map((p) => ({ nombre: String(p?.nombre ?? '').trim().slice(0, 100), tipo: TIPOS_PIEZA.includes(p?.tipo) ? p.tipo : TIPOS_PIEZA[0], horas: num(p?.horas), costo: num(p?.costo), cobrado: num(p?.cobrado), promesa: fecha(p?.promesa), entrega: fecha(p?.entrega) })).filter((p) => p.nombre),
  };
}
export function estadoEntrega(p) {
  if (!p.entrega) return 'Pendiente';
  if (!p.promesa) return 'Sin promesa';
  return p.entrega <= p.promesa ? 'A tiempo' : 'Tarde';
}
export function analizarPiezas(piezas, costo_hora = 0) {
  const filas = piezas.map((p) => { const total = p.costo + p.horas * costo_hora; return { ...p, total, margen: p.cobrado - total, estado: estadoEntrega(p) }; });
  const total = filas.reduce((s, p) => s + p.total, 0), cobrado = filas.reduce((s, p) => s + p.cobrado, 0);
  const medidas = filas.filter((p) => p.estado === 'A tiempo' || p.estado === 'Tarde'), tiempo = medidas.filter((p) => p.estado === 'A tiempo').length;
  const peor = filas.length > 1 ? filas.reduce((a, b) => (b.margen < a.margen ? b : a)) : null;
  return { filas, total, cobrado, margen: cobrado - total, pct: cobrado > 0 ? (cobrado - total) / cobrado : 0, costoPieza: filas.length ? total / filas.length : 0, aTiempo: medidas.length ? tiempo / medidas.length : null, peor };
}
