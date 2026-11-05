// Embudo y Rentabilidad de un cliente, por mes: dónde se pierde la venta, cuánto vale arreglarlo y qué deja dinero. Puro.
export const ETAPAS = ['Alcance', 'Conversaciones', 'Calificados', 'Propuestas', 'Clientes'];
const num = (v) => { const n = Number(String(v ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : 0; };
const txt = (v, n = 80) => String(v ?? '').trim().slice(0, n);
export const idEmbudo = (slug, mes) => `${slug}--${mes}`;
export function limpiarEmbudo(b = {}) {
  const dados = Array.isArray(b.etapas) ? b.etapas : [];
  return {
    client_slug: txt(b.client_slug), mes: /^\d{4}-\d{2}$/.test(b.mes || '') ? b.mes : '',
    etapas: ETAPAS.map((nombre, i) => ({ nombre, n: Math.max(0, num(dados[i]?.n)) })),
    ticket: Math.max(0, num(b.ticket)), margen_pct: Math.min(100, Math.max(0, num(b.margen_pct))),
    lineas: (Array.isArray(b.lineas) ? b.lineas : []).slice(0, 40).map((l) => ({ nombre: txt(l?.nombre), tipo: l?.tipo === 'canal' ? 'canal' : 'oferta', ingreso: num(l?.ingreso), costo: num(l?.costo) })).filter((l) => l.nombre),
  };
}
export const tasa = (de, a) => (de > 0 ? a / de : 0);
// El ancho va en escala logarítmica para que 1,000 → 5 siga pareciendo embudo; los números exactos van escritos encima.
// La fuga es el paso con peor conversión, sin contar el primero: del alcance a la conversación siempre se pierde casi todo.
export function analizarEmbudo(etapas, { ticket = 0, margen_pct = 0 } = {}) {
  const tope = Math.max(...etapas.map((e) => e.n), 0);
  const pasos = etapas.map((e, i) => ({ ...e, ancho: tope ? 0.3 + 0.7 * (Math.log1p(e.n) / Math.log1p(tope)) : 1 - i * 0.16, tasa: i ? tasa(etapas[i - 1].n, e.n) : null, perdidos: i ? Math.max(0, etapas[i - 1].n - e.n) : 0 }));
  const completo = etapas.every((e) => e.n > 0);
  if (!completo) return { pasos, fuga: null };
  let i = 2; for (let k = 3; k < pasos.length; k++) if (pasos[k].tasa < pasos[i].tasa) i = k;
  const actual = pasos[i].tasa, nueva = Math.min(1, actual + 0.1), clientes = etapas[etapas.length - 1].n;
  const extraClientes = clientes * (nueva / actual) - clientes, extraVenta = extraClientes * ticket;
  return { pasos, fuga: { indice: i, de: pasos[i - 1].nombre, a: pasos[i].nombre, tasa: actual, extraClientes, extraVenta, extraMargen: extraVenta * (margen_pct / 100) } };
}
export function analizarLineas(lineas) {
  const filas = lineas.map((l) => { const margen = l.ingreso - l.costo; return { ...l, margen, pct: l.ingreso > 0 ? margen / l.ingreso : 0 }; }).sort((a, b) => b.margen - a.margen);
  const ingreso = filas.reduce((s, l) => s + l.ingreso, 0), costo = filas.reduce((s, l) => s + l.costo, 0), margen = ingreso - costo;
  return { filas, ingreso, costo, margen, pct: ingreso > 0 ? margen / ingreso : 0, mejor: filas[0] || null, peor: filas.length > 1 ? filas[filas.length - 1] : null };
}
// Del CRM de Inherent: leads creados en ese mes. Un perdido cuenta como conversación porque no se guarda hasta dónde llegó.
export function etapasDeLeads(leads, mes) {
  const xs = (leads || []).filter((l) => !l.archived && l.stage !== 'Prospecto' && String(l._meta?.created_at || '').startsWith(mes));
  const en = (...s) => xs.filter((l) => s.includes(l.stage)).length;
  return ETAPAS.map((nombre, i) => ({ nombre, n: i === 0 ? xs.length : i === 1 ? xs.length : i === 2 ? en('Reunión', 'Propuesta', 'Ganado') : i === 3 ? en('Propuesta', 'Ganado') : en('Ganado') }));
}
