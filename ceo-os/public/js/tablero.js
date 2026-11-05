// El tablero de trabajos: en qué punto está cada encargo y dónde te espera. Puro.
export const COLUMNAS = ['Encargo', 'Diagnóstico', 'Plan', 'Producción', 'Revisión', 'Entrega'];
const POR_TIPO = { investigacion: 'Diagnóstico', analisis: 'Diagnóstico', decision: 'Plan', entregable: 'Producción', validacion: 'Producción' };
export function columnaDe(t) {
  if (t.completo) return 'Entrega';
  const e = t.etapas?.[t.activa];
  if (e && ['revision', 'pregunta'].includes(e.estado)) return 'Revisión';
  if (!t.activa && (!e || e.estado === 'pendiente')) return 'Encargo';
  return POR_TIPO[e?.tipo] || 'Producción';
}
export function tablero(trabajos = [], { area = '', entregados = 8 } = {}) {
  const xs = trabajos.filter((t) => !t.archivado && (!area || t.flujo?.area === area));
  return COLUMNAS.map((nombre) => { const ts = xs.filter((t) => columnaDe(t) === nombre); return { nombre, total: ts.length, trabajos: nombre === 'Entrega' ? ts.slice(0, entregados) : ts }; });
}
