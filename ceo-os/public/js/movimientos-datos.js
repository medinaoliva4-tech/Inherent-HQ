// La Hoja de Movimientos: qué se hizo, qué costó, qué se esperaba, qué pasó y qué se decide. Puro.
export const DECISIONES = ['Pendiente', 'Repetir', 'Cambiar', 'Parar'];
export const AREAS_MOV = [['strategy', 'Strategy'], ['creative', 'Creative'], ['production', 'Production'], ['marketing', 'Marketing'], ['consulting', 'Consulting']];
const txt = (v, n = 300) => String(v ?? '').trim().slice(0, n);
export function limpiarMovimiento(b = {}) {
  const costo = Number(String(b.costo ?? '').replace(/[^\d.]/g, ''));
  return {
    titulo: txt(b.titulo), client_slug: txt(b.client_slug, 80), area: AREAS_MOV.some(([k]) => k === b.area) ? b.area : 'strategy',
    costo: Number.isFinite(costo) ? costo : 0, espera: txt(b.espera), paso: txt(b.paso),
    decision: DECISIONES.includes(b.decision) ? b.decision : 'Pendiente', fecha: /^\d{4}-\d{2}-\d{2}$/.test(b.fecha || '') ? b.fecha : '', archivado: Boolean(b.archivado),
  };
}
export const errorMovimiento = (m) => (!m.titulo ? 'Escribe qué se hizo' : !m.client_slug ? 'Elige un cliente' : !m.espera ? 'Escribe qué esperan que pase' : '');
export const filtrarMovimientos = (xs, { area = '', cliente = '' } = {}) => (xs || []).filter((m) => !m.archivado && (!area || m.area === area) && (!cliente || m.client_slug === cliente))
  .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
export function resumenMovimientos(xs) {
  const r = { total: xs.length, invertido: 0, sinResultado: 0, repetir: 0, parar: 0 };
  for (const m of xs) { r.invertido += Number(m.costo) || 0; if (!m.paso) r.sinResultado++; if (m.decision === 'Repetir') r.repetir++; if (m.decision === 'Parar') r.parar++; }
  return r;
}
