// Creative Performance Analyzer (herramienta creative-performance-analyzer de Creative, un entregable por marca y mes): el scorecard de cada pieza publicada
// contra la línea base de la MISMA marca (nunca contra otra), lo que Laya dijo antes contra lo que pasó, un veredicto por pieza, los 3 patrones ganadores y la fatiga
// (solo con datos de pauta). Existe para que las cuentas, el pedido a la IA, la lectura de su respuesta y las reglas de aprobación vivan en un solo módulo puro
// (sin DOM ni red) que comparten la vista y las pruebas. Lo que falta es null con su fuente («⚠️ SIN DATOS», «conecta Windsor»), nunca 0. Nada de esto va al portal.
import { plano, corta, numeroONull, leerHerramienta, contextoPrompt, celda, sinAcentos, SIN_DATOS } from '../consulting/marcos.js';
import { metricasDe, etapaFunnel, formatoDe } from '../calendario-contenido.js';
import { mesOk, nombreMes } from '../plan-mes.js';

export const BLOQUE = 'rendimientoCreativo';
export const MIN_BASE = 3;          // piezas con métricas para que haya línea base
export const ARRIBA = 1.2, ABAJO = 0.8; // contra la línea base: 20 % arriba o abajo
export const MIN_PATRON = 2;        // un patrón liga al menos 2 piezas
export const MAX_PATRONES = 3;
export const MIN_IMPRESIONES = 1000, CAIDA_CTR = 25; // fatiga: con menos impresiones no se juzga; el CTR de 7 días 25 % abajo del de 30
const MAX_PIEZAS = 40, MAX_PROMPT = 4900;
export const CONECTA_WINDSOR = `${SIN_DATOS}: conecta Windsor (el Instagram de la marca) para que cada pieza publicada traiga sus métricas`;
export const SIN_METRICAS = `${SIN_DATOS}: las métricas por pieza salen de Windsor y de ⑨ Posting (alcance e interacciones por slot)`;
export const SIN_PAUTA = `${SIN_DATOS}: la fatiga solo se mide con datos de pauta (Windsor · ⑩ Ads); sin cuenta de pauta conectada no se juzga`;

export const NIVELES = [['por-encima', 'Por encima'], ['en-linea', 'En línea'], ['por-debajo', 'Por debajo'], ['sin-datos', 'Sin datos']];
export const VEREDICTOS = [['repetir', 'Repetir'], ['mantener', 'Mantener'], ['ajustar', 'Ajustar'], ['sin-datos', 'Sin datos']];
export const DIMENSIONES = [['formato', 'Formato'], ['pilar', 'Pilar'], ['etapa', 'Etapa']];
const nivelId = (v) => (NIVELES.some(([k]) => k === v) ? v : 'sin-datos');

// ---------- Las cuentas ----------
const redondea = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
export const mediana = (l) => { const v = (Array.isArray(l) ? l : []).filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b); if (!v.length) return null; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
// El engagement de una pieza: (me gusta + comentarios + guardados + compartidos) / alcance. Sin alcance o sin ninguna interacción medida, null (no un 0).
export function erDe(m) {
  const x = plano(m) ? m : {}, a = numeroONull(x.alcance, { min: 0 });
  const par = ['likes', 'comentarios', 'guardados', 'compartidos'].map((k) => numeroONull(x[k], { min: 0 })).filter((v) => v !== null);
  return a && a > 0 && par.length ? redondea((par.reduce((s, v) => s + v, 0) / a) * 100) : null;
}
const metricasLimpias = (m) => { const x = plano(m) ? m : {}, o = {}; for (const k of ['alcance', 'vistas', 'likes', 'comentarios', 'guardados', 'compartidos']) { const v = numeroONull(x[k], { min: 0 }); if (v !== null) o[k] = v; } const er = erDe(o); if (er !== null) o.er = er; return o; };
// Una pieza de content publicada → lo que se puntúa. laya = { suena, engancha } (0..1) de los juicios de antes de publicar, o null.
export function normalizar(doc, laya = null) {
  const d = plano(doc) ? doc : {}, ms = metricasDe(d), m = {};
  for (const x of ms) m[x.k] = x.v;
  const l = plano(laya) ? laya : {};
  return { id: corta(d.id, 60), titulo: corta(d.title || d.name, 100), formato: corta(formatoDe(d), 30), pilar: corta(d.pillar || d.pilar, 60), etapa: etapaFunnel(d), fecha: corta(d.date, 10),
    metricas: metricasLimpias(m), laya: { suena: numeroONull(l.suena, { min: 0, max: 1 }), engancha: numeroONull(l.engancha, { min: 0, max: 1 }) } };
}
// La línea base de una marca: la mediana del ER (y del alcance) de sus piezas publicadas con métricas. Con menos de MIN_BASE piezas, null con su razón.
export function lineaBase(piezas) {
  const l = (Array.isArray(piezas) ? piezas : []).filter((p) => plano(p) && numeroONull(p.metricas?.er) !== null), er = mediana(l.map((p) => p.metricas.er)), al = mediana(l.map((p) => numeroONull(p.metricas?.alcance)));
  if (l.length < MIN_BASE) return { n: l.length, er: null, alcance: null, fuente: `${SIN_DATOS}: la línea base necesita ${MIN_BASE} piezas publicadas de la marca con métricas (hay ${l.length})` };
  return { n: l.length, er, alcance: al, fuente: `Mediana de ${l.length} piezas publicadas de esta marca` };
}
// El ER de la pieza entre el de la línea base. null sin los dos.
export const razonDe = (pieza, base) => { const e = numeroONull(pieza?.metricas?.er, { min: 0 }), b = numeroONull(base?.er, { min: 0 }); return e === null || !b ? null : redondea(e / b); };
export const nivelDe = (razon) => (razon === null || razon === undefined ? 'sin-datos' : razon >= ARRIBA ? 'por-encima' : razon <= ABAJO ? 'por-debajo' : 'en-linea');
export const veredictoDe = (nivel) => ({ 'por-encima': 'repetir', 'en-linea': 'mantener', 'por-debajo': 'ajustar' })[nivel] || 'sin-datos';
// Lo que Laya esperaba (promedio de lo que juzgó antes de publicar) contra lo que pasó: acertó, cerca (un escalón) o falló (al revés). Sin juicio de Laya, sin datos.
export function layaVs(laya, nivel) {
  const v = [numeroONull(laya?.suena, { min: 0, max: 1 }), numeroONull(laya?.engancha, { min: 0, max: 1 })].filter((x) => x !== null);
  if (!v.length || nivel === 'sin-datos') return 'sin-datos';
  const p = v.reduce((s, x) => s + x, 0) / v.length, esperado = p >= 0.6 ? 2 : p < 0.4 ? 0 : 1, real = nivel === 'por-encima' ? 2 : nivel === 'por-debajo' ? 0 : 1;
  return esperado === real ? 'acerto' : Math.abs(esperado - real) === 1 ? 'cerca' : 'fallo';
}
export const LAYA_VS = { acerto: 'Laya acertó', cerca: 'Laya quedó cerca', fallo: 'Laya falló', 'sin-datos': 'Laya sin juicio' };

// ---------- Los patrones ganadores ----------
// De las piezas con nivel: los grupos (formato, pilar, etapa) de 2 o más piezas cuyo ER promedio supera la línea base; los 3 mejores, sin repetir pieza-grupo.
export function patrones(piezas, base) {
  const l = (Array.isArray(piezas) ? piezas : []).filter((p) => plano(p) && razonDe(p, base) !== null), out = [];
  for (const [dim] of DIMENSIONES) {
    const por = new Map();
    for (const p of l) { const v = corta(p[dim], 60); if (v) (por.get(v) || por.set(v, []).get(v)).push(p); }
    for (const [valor, ps] of por) if (ps.length >= MIN_PATRON) { const r = redondea(ps.reduce((s, p) => s + razonDe(p, base), 0) / ps.length); if (r > 1) out.push({ dimension: dim, valor, n: ps.length, ratio: r, piezas: ps.map((p) => p.id), leccion: '' }); }
  }
  return out.sort((a, z) => z.ratio - a.ratio || z.n - a.n).slice(0, MAX_PATRONES);
}

// ---------- La fatiga (solo con datos de pauta) ----------
// ctr7 y ctr30: el CTR (%) de la pauta de la marca en los últimos 7 y 30 días; imp7: sus impresiones de 7 días. Sin pauta o con poco volumen, sin-datos.
export function fatigaDe({ conectado = null, ctr7 = null, ctr30 = null, imp7 = null } = {}) {
  const a = numeroONull(ctr7, { min: 0 }), b = numeroONull(ctr30, { min: 0 }), i = numeroONull(imp7, { min: 0 });
  if (!conectado) return { estado: 'sin-datos', ctr7: null, ctr30: null, caida_pct: null, fuente: SIN_PAUTA, nota: '' };
  if (a === null || !b) return { estado: 'sin-datos', ctr7: a, ctr30: b, caida_pct: null, fuente: `${SIN_DATOS}: Windsor no trae clics e impresiones de esas cuentas de pauta`, nota: '' };
  if ((i ?? 0) < MIN_IMPRESIONES) return { estado: 'sin-datos', ctr7: a, ctr30: b, caida_pct: null, fuente: `${SIN_DATOS}: menos de ${MIN_IMPRESIONES} impresiones en 7 días: poco volumen para juzgar`, nota: '' };
  const caida = redondea(((b - a) / b) * 100, 0);
  return { estado: caida >= CAIDA_CTR ? 'senal' : 'sin-senal', ctr7: a, ctr30: b, caida_pct: caida, fuente: 'Windsor · pauta (CTR de 7 días contra el de 30)', nota: '' };
}

// ---------- El contenido ----------
const FATIGA0 = { estado: 'sin-datos', ctr7: null, ctr30: null, caida_pct: null, fuente: SIN_PAUTA, nota: '' };
export const vacio = (mes = '') => ({ mes: mesOk(mes) ? mes : '', base: null, piezas: [], patrones: [], fatiga: { ...FATIGA0 }, aprendizaje: '' });
const fechaMes = (s) => { const m = /^(\d{4}-(?:0[1-9]|1[0-2]))/.exec(String(s ?? '')); return m ? m[1] : ''; };

// Solo lo conocido. El nivel y el veredicto de cada pieza se recalculan de su ER y la línea base (nunca se confía en lo que traiga); los patrones solo citan piezas
// que están en el entregable y su razón se recalcula con ellas.
export function limpiar(c) {
  const o = plano(c) ? c : {}, b = plano(o.base) ? o.base : null;
  const base = b ? { n: numeroONull(b.n, { min: 0 }) ?? 0, er: numeroONull(b.er, { min: 0 }), alcance: numeroONull(b.alcance, { min: 0 }), fuente: corta(b.fuente, 200) } : null;
  if (base && base.er === null && !/sin datos/i.test(base.fuente)) base.fuente = `${SIN_DATOS}: sin línea base`;
  const vistos = new Set();
  const piezas = (Array.isArray(o.piezas) ? o.piezas : []).filter(plano).map((p) => {
    const m = metricasLimpias(p.metricas), id = corta(p.id, 60), razon = base ? razonDe({ metricas: m }, base) : null, nivel = nivelDe(razon);
    return { id, titulo: corta(p.titulo, 100), formato: corta(p.formato, 30), pilar: corta(p.pilar, 60), etapa: ['TOF', 'MOF', 'BOF'].includes(p.etapa) ? p.etapa : '', fecha: corta(p.fecha, 10), metricas: m,
      laya: { suena: numeroONull(p.laya?.suena, { min: 0, max: 1 }), engancha: numeroONull(p.laya?.engancha, { min: 0, max: 1 }) },
      razon, nivel, laya_vs: layaVs(p.laya, nivel), veredicto: veredictoDe(nivel), nota: corta(p.nota, 300) };
  }).filter((p) => p.id && !vistos.has(p.id) && vistos.add(p.id)).slice(0, MAX_PIEZAS);
  const idx = new Map(piezas.map((p) => [p.id, p]));
  const pats = (Array.isArray(o.patrones) ? o.patrones : []).filter(plano).map((x) => {
    const ids = [...new Set((Array.isArray(x.piezas) ? x.piezas : []).map((i) => corta(i, 60)).filter((i) => idx.has(i)))], rs = ids.map((i) => idx.get(i).razon).filter((r) => r !== null);
    return { dimension: DIMENSIONES.some(([k]) => k === x.dimension) ? x.dimension : '', valor: corta(x.valor, 60), n: ids.length, ratio: rs.length ? redondea(rs.reduce((s, r) => s + r, 0) / rs.length) : null, piezas: ids, leccion: corta(x.leccion, 300) };
  }).filter((x) => x.valor && x.n >= MIN_PATRON).slice(0, MAX_PATRONES);
  const f = plano(o.fatiga) ? o.fatiga : {}, estado = ['sin-datos', 'sin-senal', 'senal'].includes(f.estado) ? f.estado : 'sin-datos', fuente = corta(f.fuente, 200);
  const fatiga = estado === 'sin-datos' || !fuente ? { ...FATIGA0, fuente: fuente && estado === 'sin-datos' ? fuente : SIN_PAUTA, nota: corta(f.nota, 300) }
    : { estado, ctr7: numeroONull(f.ctr7, { min: 0 }), ctr30: numeroONull(f.ctr30, { min: 0 }), caida_pct: numeroONull(f.caida_pct), fuente, nota: corta(f.nota, 300) };
  return { mes: mesOk(fechaMes(o.mes)) ? fechaMes(o.mes) : '', base, piezas, patrones: pats, fatiga, aprendizaje: corta(o.aprendizaje, 800) };
}

// Arma el contenido con lo que midió el OS: piezas (de normalizar) del mes y las de la marca para la línea base (todas las publicadas con métricas).
export function armar({ mes = '', piezas = [], historicas = [], fatiga = null } = {}) {
  const todas = [...(Array.isArray(historicas) ? historicas : []), ...(Array.isArray(piezas) ? piezas : []).filter((p) => !(historicas || []).some((h) => h?.id === p?.id))];
  const base = lineaBase(todas), mias = (Array.isArray(piezas) ? piezas : []).filter(plano);
  const c = limpiar({ mes, base, piezas: mias, patrones: [], fatiga: fatiga || FATIGA0 });
  return { ...c, patrones: patrones(c.piezas, c.base).map((p) => ({ ...p })) };
}
// Lo que se guarda en content.resultado de una pieza (lo escribe la vista por /api/db/content; nunca llega al portal).
export const resultadoDePieza = (pieza, mes) => ({ mes: mesOk(mes) ? mes : '', nivel: nivelId(pieza?.nivel), ratio: numeroONull(pieza?.razon), er: numeroONull(pieza?.metricas?.er), veredicto: veredictoDe(nivelId(pieza?.nivel)) });

// ---------- Lo que falta (bloquea aprobar) ----------
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), f = [];
  if (!c.mes) f.push('Falta el mes del análisis');
  if (!c.piezas.length) f.push('No hay piezas publicadas con métricas: conecta Windsor y vuelve a leer el mes');
  else if (!c.base || c.base.er === null) f.push(`Sin línea base de la marca: ${c.base?.fuente || `se necesitan ${MIN_BASE} piezas publicadas con métricas`}`);
  if (c.piezas.length && c.piezas.every((p) => p.nivel === 'sin-datos')) f.push('Ninguna pieza tiene métricas contra la línea base: no hay scorecard');
  if (c.patrones.length !== MAX_PATRONES) f.push(`Debe haber ${MAX_PATRONES} patrones ganadores, cada uno con 2 o más piezas (hay ${c.patrones.length})`);
  c.patrones.forEach((p, i) => { if (!p.leccion) f.push(`El patrón ${i + 1} no dice qué repetir`); });
  if (c.fatiga.estado !== 'sin-datos' && !c.fatiga.fuente) f.push('La fatiga no cita su fuente de pauta');
  return f;
}

// ---------- Con la respuesta de la IA ----------
// Las métricas, la línea base, los niveles y la fatiga nunca salen del modelo: son lo que midió el OS (lo que ya estaba en pantalla). De la IA solo entran las notas por pieza,
// la lección de cada patrón (que solo puede citar piezas del entregable) y el aprendizaje del mes. leer() devuelve esa forma corta; alUsar() la pone sobre lo medido.
const lista = (v) => (Array.isArray(v) ? v : []).filter(plano);
const limpiarIA = (c) => {
  const o = plano(c) ? c : {};
  return { piezas: lista(o.piezas).map((p) => ({ id: corta(p.id, 60), nota: corta(p.nota, 300) })).filter((p) => p.id).slice(0, MAX_PIEZAS),
    patrones: lista(o.patrones).map((x) => ({ dimension: x.dimension, valor: corta(x.valor, 60), piezas: (Array.isArray(x.piezas) ? x.piezas : []).map((i) => corta(i, 60)).slice(0, 12), leccion: corta(x.leccion, 300) })).filter((x) => x.valor).slice(0, MAX_PATRONES),
    aprendizaje: corta(o.aprendizaje, 800) };
};
export function alUsar(nuevo, actual) {
  const n = limpiarIA(nuevo), a = limpiar(actual);
  if (!a.piezas.length) return { ...a, aprendizaje: n.aprendizaje || a.aprendizaje };
  const notas = new Map(n.piezas.map((p) => [p.id, p.nota]));
  return limpiar({ ...a, piezas: a.piezas.map((p) => ({ ...p, nota: notas.get(p.id) || p.nota })), patrones: n.patrones.length ? n.patrones : a.patrones, aprendizaje: n.aprendizaje || a.aprendizaje });
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
const VISTOS = new Map(); // slug → contenido armado por la vista (el contexto de armarCtx no trae las métricas)
export function recordarRendimiento(slug, contenido) {
  const k = String(slug ?? '').slice(0, 60); if (!k) return;
  if (VISTOS.size > 50) VISTOS.clear();
  VISTOS.set(k, limpiar(contenido));
}
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {}, cli = plano(c.cliente) ? c.cliente : {}, nombre = corta(cli.nombre, 80) || 'la marca';
  const d = limpiar(c.rendimiento || VISTOS.get(String(cli.slug ?? '')) || {}), mes = d.mes || (mesOk(String(c.hoy ?? '').slice(0, 7)) ? String(c.hoy).slice(0, 7) : '');
  const piezas = d.piezas.slice(0, 14).map((p) => `- ${p.id} · ${p.titulo || 'sin título'} · ${p.formato || 'formato sin definir'}${p.pilar ? ` · ${p.pilar}` : ''}${p.etapa ? ` · ${p.etapa}` : ''} · ER ${p.metricas.er ?? 'null'}${p.razon !== null ? ` (${p.razon}x la base)` : ''} · ${p.nivel} · ${LAYA_VS[p.laya_vs]}`).join('\n');
  const intro = `Eres ④ Creatividad de Inherent. Lee el rendimiento de las piezas publicadas de «${nombre}» de ${mes ? nombreMes(mes) : `${SIN_DATOS}: el mes`} y di qué se repite, qué se ajusta y qué aprendimos.`;
  const reglas = [
    'REGLAS (no se negocian):',
    '- Las métricas, la línea base, el nivel de cada pieza y la fatiga los mide el OS: no los cambies, no los estimes ni los inventes. Dato que falta: ⚠️ SIN DATOS con de dónde saldría. Nunca 0 por un dato que falta.',
    '- Cada pieza se compara con la línea base de SU marca, nunca con otra marca ni con un promedio de la industria.',
    `- Propón exactamente ${MAX_PATRONES} patrones ganadores: dimensión (formato, pilar o etapa), su valor, las ids de 2 o más piezas de la lista que lo muestran y qué repetir. Sin 2 piezas no hay patrón.`,
    '- La fatiga solo se menciona si el OS trae datos de pauta; si no, no la adivines. Nunca pautes ni escribas en plataformas de anuncios: una propuesta de pauta es una tarea para ⑩ Ads o el OK del CEO.',
    '- Nunca leas ni cites inherent/06-ECONOMIA.md, costos de Inherent ni datos de otro cliente. Roles, no nombres de personas. Español de «tú», corto y humano.',
  ].join('\n');
  const datos = [`LÍNEA BASE: ${d.base?.er != null ? `ER ${d.base.er} · ${d.base.fuente}` : d.base?.fuente || `${SIN_DATOS}: sin línea base`}`, 'PIEZAS PUBLICADAS (las mide el OS):', piezas || `${SIN_DATOS}: no llegaron piezas con métricas. No inventes: di qué falta.`,
    d.fatiga.estado === 'sin-datos' ? 'FATIGA: sin datos de pauta' : `FATIGA: ${d.fatiga.estado === 'senal' ? `señal, el CTR de 7 días cayó ${d.fatiga.caida_pct}%` : 'sin señal'} · ${d.fatiga.fuente}`].join('\n');
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"piezas":[{"id":"…","nota":"qué se ve en esta pieza"}],"patrones":[{"dimension":"formato","valor":"Reel","piezas":["id1","id2"],"leccion":"qué repetir"}],"aprendizaje":"1 o 2 frases del mes"}',
    F, `${F}criterios`, '{"entregable":"Rendimiento creativo","cumple":["…"],"falta":["… — por qué"]}', F,
  ].join('\n');
  const fijo = [intro, '', reglas, '', datos, '', salida].join('\n');
  return [intro, '', reglas, '', contextoPrompt(c, Math.max(120, MAX_PROMPT - fijo.length - 2)), '', datos, '', salida].join('\n');
}
// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiarIA);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), nom = (k, l) => l.find(([x]) => x === k)?.[1] || k;
  const L = [`# Rendimiento creativo · ${c.mes ? nombreMes(c.mes) : SIN_DATOS}`, '', `Línea base: ${c.base?.er != null ? `ER ${c.base.er}% · ${c.base.fuente}` : c.base?.fuente || `${SIN_DATOS}: sin línea base`}`, '', '## Scorecard por pieza publicada', ''];
  if (c.piezas.length) L.push('| Pieza | Formato | ER | Contra la base | Resultado | Laya antes | Veredicto |', '|---|---|---|---|---|---|---|', ...c.piezas.map((p) => `| ${celda(p.titulo || p.id)} | ${celda(p.formato) || '—'} | ${p.metricas.er ?? SIN_DATOS} | ${p.razon === null ? SIN_DATOS : `${p.razon}x`} | ${nom(p.nivel, NIVELES)} | ${LAYA_VS[p.laya_vs]} | ${nom(p.veredicto, VEREDICTOS)} |`));
  else L.push(CONECTA_WINDSOR);
  L.push('', '## Patrones ganadores', '');
  L.push(...(c.patrones.length ? c.patrones.map((p, i) => `${i + 1}. **${nom(p.dimension, DIMENSIONES)}: ${p.valor}** (${p.n} piezas, ${p.ratio === null ? SIN_DATOS : `${p.ratio}x la base`}) — ${p.leccion || SIN_DATOS}`) : [`${SIN_DATOS}: faltan los patrones (necesitan 2 o más piezas por encima de la base).`]));
  L.push('', '## Fatiga', '', c.fatiga.estado === 'sin-datos' ? c.fatiga.fuente : `${c.fatiga.estado === 'senal' ? `Señal de fatiga: el CTR de 7 días (${c.fatiga.ctr7}%) cayó ${c.fatiga.caida_pct}% contra el de 30 (${c.fatiga.ctr30}%).` : 'Sin señal de fatiga.'} Fuente: ${c.fatiga.fuente}`);
  if (c.aprendizaje) L.push('', '## Qué aprendimos', '', c.aprendizaje);
  return L.join('\n');
}
