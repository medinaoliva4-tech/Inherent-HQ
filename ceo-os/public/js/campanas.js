// Marca › Planear › Campañas y eventos: las campañas de ③ Marketing (agents/03-marketing/brain/skills/mk-campana) con
// nombre propio. Una campaña es un empujón con principio y final: tiene fecha o evento (si no, es un pilar). Un evento es una
// campaña de tipo «evento». Cada una lleva su frase, la MUST BE TRUE que mueve, en qué se va a notar, qué NO es y su
// anticipación (primer aviso, recordatorio y último empujón). Colección «mk_campaigns» (área content), solo por /api/campanas.
// Puro: sin DOM ni red (lo prueba scripts/test-plan.mjs).
export const COLL_C = 'mk_campaigns';

// La anticipación por defecto de mk-campana (§ La anticipación): días antes de la fecha ancla. Se ajusta, pero se declara.
// [clave, nombre, primer aviso, recordatorios, último empujón, sobre qué fecha va el empujón]
export const TIPOS_C = [
  ['evento', 'Evento con cupo', 21, [7], [2, 0], 'ancla'],
  ['apertura', 'Apertura o inauguración', 28, [14, 7], [0], 'ancla'],
  ['lanzamiento', 'Lanzamiento de producto', 28, [14, 7], [0], 'ancla'],
  ['promocion', 'Promoción corta', 7, [2], [0], 'hasta'],
  ['temporada', 'Fecha de temporada', 35, [21, 14, 7], [2], 'ancla'],
  ['campana', 'Campaña del ciclo', 0, [], [], 'ancla'],
];
export const ESTADOS_C = ['Borrador', 'En curso', 'Cerrada', 'Archivada'];
export const tipoDe = (k) => TIPOS_C.find(([x]) => x === k) || TIPOS_C[TIPOS_C.length - 1];

const txt = (s, n = 200) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const fecha = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : '');
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const tipoLibre = (v) => (TIPOS_C.find(([k, n]) => fold(v) === k || fold(v) === fold(n) || (fold(v) && fold(n).startsWith(fold(v)))) || [])[0] || '';

// Lo que llega (del Tablero, del Chat o del conector), limpio: solo campos conocidos y con tipo.
export function limpiarCampana(c = {}) {
  const tipo = tipoLibre(c.tipo) || 'campana';
  const o = {
    nombre: txt(c.nombre, 60), frase: txt(c.frase, 160), tipo,
    mbt: txt(c.mbt ?? c.must_be_true, 80), se_nota: txt(c.se_nota ?? c.en_que_se_nota, 200), no_es: txt(c.no_es ?? c.que_no_es, 200),
    ancla: fecha(c.ancla ?? c.fecha), hasta: fecha(c.hasta), responsable: txt(c.responsable, 120).toLowerCase(),
    estado: ESTADOS_C.find((e) => fold(e) === fold(c.estado)) || 'Borrador', notas: txt(c.notas, 600),
  };
  if (o.hasta && o.ancla && o.hasta < o.ancla) o.hasta = '';
  if (tipo === 'evento') {
    const e = c.evento && typeof c.evento === 'object' ? c.evento : c;
    o.evento = { lugar: txt(e.lugar, 120), cupo: Math.max(0, Math.round(+e.cupo || 0)) || null, objetivo: txt(e.objetivo, 200), proveedores: txt(e.proveedores, 300), medicion: txt(e.medicion, 200), presupuesto_id: txt(e.presupuesto_id, 80) };
  }
  return o;
}

// Las fechas de la anticipación: [{ fecha, que, dias }] en orden. Sin fecha ancla, nada.
const masDias = (iso, d) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };
export function anticipacion(c = {}) {
  if (!c.ancla) return [];
  const [, , aviso, recs, emp, sobre] = tipoDe(c.tipo), base = sobre === 'hasta' && c.hasta ? c.hasta : c.ancla;
  const out = [];
  if (aviso) out.push({ fecha: masDias(c.ancla, -aviso), que: 'Primer aviso', dias: aviso });
  for (const d of recs) out.push({ fecha: masDias(c.ancla, -d), que: 'Recordatorio', dias: d });
  for (const d of emp) out.push({ fecha: masDias(base, -d), que: d ? 'Último empujón' : sobre === 'hasta' ? 'Último día' : 'El día', dias: d });
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Lo que le falta o lo que está mal, según mk-campana (§ 5 Qué escribe, § 6 Bloqueos y las tres reglas). → [texto]
export function revisarCampana(c = {}, hoy = new Date().toISOString().slice(0, 10)) {
  const out = [];
  if (!c.frase) out.push('Falta la frase: la que el equipo repite de memoria');
  if (!c.mbt) out.push('Falta la MUST BE TRUE que mueve (si no traza a ninguna, es un tema, no una campaña)');
  if (!c.se_nota) out.push('Falta en qué se va a notar al cierre');
  if (!c.no_es) out.push('Falta qué NO es');
  if (!c.ancla) out.push('Falta la fecha: sin fecha después de la cual deje de servir, es un pilar');
  const a = anticipacion(c);
  if (c.ancla && c.tipo !== 'campana' && a.filter((x) => x.que !== 'El día').length < 2) out.push('Nunca un solo aviso');
  // Cae en los primeros 7 días del ciclo y ese ciclo ya empezó: el aviso llegó tarde (se debió planear desde el anterior).
  const antes = a[0] && a[0].fecha.slice(0, 7) < c.ancla.slice(0, 7);
  if (c.ancla && +c.ancla.slice(8, 10) <= 7 && c.tipo !== 'campana' && hoy >= c.ancla.slice(0, 8) + '01') out.push('La fecha cae en los primeros 7 días del ciclo: el aviso llegó tarde. Se trabaja igual y se declara');
  else if (antes) out.push(`El primer aviso (${a[0].fecha}) cae en el ciclo anterior: se planifica desde ahí y se avisa a ① Strategy`);
  if (['Borrador'].includes(c.estado) && a[0] && a[0].fecha < hoy) out.push('El primer aviso ya pasó y sigue en borrador');
  if (c.tipo === 'evento' && !c.evento?.objetivo) out.push('El evento no tiene objetivo comercial');
  if (c.tipo === 'evento' && !c.evento?.medicion) out.push('El evento no dice cómo se mide');
  return out;
}

// Las campañas que tocan un mes (de su primer aviso a su último día). mes = AAAA-MM
export function campanasDelMes(xs = [], mes) {
  return xs.filter((c) => c.estado !== 'Archivada' && c.ancla).filter((c) => {
    const a = anticipacion(c), ini = (a[0]?.fecha || c.ancla).slice(0, 7), fin = (c.hasta || c.ancla).slice(0, 7);
    return ini <= mes && mes <= fin;
  });
}
// Una por ciclo, dos como máximo (mk-campana § 2). → aviso del mes o ''
export function revisarMes(xs = [], mes) {
  const n = campanasDelMes(xs, mes).filter((c) => c.estado !== 'Cerrada').length;
  return n > 2 ? `${n} campañas en el mismo ciclo: si parecen tres, ninguna está definida (mk-campana § 2)` : '';
}
// La próxima fecha de la anticipación desde hoy (para el panel y los avisos). → { fecha, que } | null
export const proximaFecha = (c, hoy = new Date().toISOString().slice(0, 10)) => anticipacion(c).find((x) => x.fecha >= hoy) || null;
// El bloque ```campana``` del Chat (lo que propone ③ Marketing). → campaña limpia o null
export function leerCampana(j) { const c = limpiarCampana(j || {}); return c.nombre ? c : null; }
// El id: <marca>--<nombre>, sin acentos. Mismo nombre en la misma marca = la misma campaña (no se duplica).
export const idCampana = (slug, nombre) => `${slug}--${fold(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)}`;
