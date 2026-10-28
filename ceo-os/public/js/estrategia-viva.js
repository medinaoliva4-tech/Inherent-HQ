// App 02 · Estrategia en vivo: lo que se va concretando en el chat, por cliente. Puro: lo usan el servidor y la pantalla.
// Un documento por cliente en la colección de Estrategia (id «<slug>--viva»). Sigue el método de ① Strategy:
//   contexto (+ Diagnóstico) → análisis → ingeniería inversa (+ Modelo de dinero y Leads) → metodología (+ Oferta) → entrega (roadmap).
// Strategy lo llena desde el chat con un bloque ```estrategia {…}``` y pide datos puntuales con ```pregunta {…}```.
// La cascada (clientes, conversaciones, visitas, alcance) no se guarda: se calcula de la meta y los supuestos.
// Lo único que importa es el módulo puro del roadmap (strategy/roadmap.js): limpia las filas con área y trimestre y los hitos.
import { limpiarItems, limpiarHitos, areaDe } from './strategy/roadmap.js';

export const PASOS = [
  { id: 'contexto', n: 1, nombre: 'Contexto', largo: 'Contexto + Diagnóstico', hz: ['diagnostico'] },
  { id: 'analisis', n: 2, nombre: 'Análisis', largo: 'Análisis', hz: [] },
  { id: 'inversa', n: 3, nombre: 'Ing. inversa', largo: 'Ingeniería inversa', hz: ['modelo', 'leads'] },
  { id: 'metodologia', n: 4, nombre: 'Metodología', largo: 'Metodología', hz: ['oferta'] },
  { id: 'entrega', n: 5, nombre: 'Entrega', largo: 'Entrega · Roadmap', hz: ['roadmap'] },
];
export const SECCIONES = ['meta', 'contexto', 'analisis', 'inversa', 'contenido', 'pauta', 'riesgos', 'metodologia', 'roadmap'];
export const FORMATOS = ['', 'reel', 'story', 'carrusel', 'estatico', 'video', 'live'];
export const vivaId = (slug) => `${slug}--viva`;
// Commercial Diagnosis (viva.comercial): los pasos del embudo donde puede haber un cuello y el límite de acciones del plan.
export const ETAPAS_EMBUDO = ['ventas', 'clientes', 'conversaciones', 'visitas', 'alcance'];
const idCorto = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24);
const fechaOk = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? '')) && !Number.isNaN(Date.parse(v)) ? String(v) : '');

const txt = (v, n = 600) => (v == null ? undefined : String(v).replace(/\s+/g, ' ').trim().slice(0, n));
const num = (v, max = 1e12) => { if (v === null) return null; if (v === undefined || v === '') return undefined; const x = Number(String(v).replace(/[^\d.\-]/g, '')); return Number.isFinite(x) && x >= 0 && x <= max ? x : undefined; };
// Las tasas: 0.25, 25 o «25%» quedan como 0.25.
const tasa = (v) => { if (v === null) return null; const x = num(v, 100); return x === undefined ? undefined : x > 1 ? x / 100 : x; };
const lista = (v, n, f) => (Array.isArray(v) ? v.slice(0, n).map(f).filter((x) => x !== undefined && x !== '') : undefined);
const sinUndef = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

// Limpia lo que manda Strategy (o la pantalla): solo campos conocidos, con tipo y tamaño. Lo que no se entiende se ignora.
export function limpiarParche(p) {
  if (!p || typeof p !== 'object') return {};
  const o = {};
  if (p.meta) o.meta = sinUndef({ actual: num(p.meta.actual), objetivo: num(p.meta.objetivo), meses: num(p.meta.meses, 60), moneda: txt(p.meta.moneda, 4) });
  if (p.contexto) o.contexto = sinUndef({ conclusion: txt(p.contexto.conclusion, 400), detalle: txt(p.contexto.detalle, 900), fuentes: lista(p.contexto.fuentes, 8, (x) => txt(x, 120)) });
  if (p.analisis) o.analisis = sinUndef({ mbt: txt(p.analisis.mbt, 400), unfair: txt(p.analisis.unfair, 400), goget: txt(p.analisis.goget, 400), trabado: ['oferta', 'modelo', 'leads', 'capacidad'].includes(p.analisis.trabado) ? p.analisis.trabado : undefined, porque: txt(p.analisis.porque, 400), fuentes: lista(p.analisis.fuentes, 8, (x) => txt(x, 120)) });
  if (p.inversa) o.inversa = sinUndef({ ticket: num(p.inversa.ticket), cierre: tasa(p.inversa.cierre), conversion: tasa(p.inversa.conversion), visita: tasa(p.inversa.visita) });
  if (p.contenido) o.contenido = sinUndef({ piezas: num(p.contenido.piezas, 500), alcance_pieza: num(p.contenido.alcance_pieza), semana: Array.isArray(p.contenido.semana) ? Array.from({ length: 7 }, (_, i) => (FORMATOS.includes(String(p.contenido.semana[i] || '').toLowerCase()) ? String(p.contenido.semana[i] || '').toLowerCase() : '')) : undefined, nota: txt(p.contenido.nota, 300) });
  if (p.pauta) o.pauta = sinUndef({ mensual: num(p.pauta.mensual), cpm: num(p.pauta.cpm, 1e5), nota: txt(p.pauta.nota, 300) });
  if (Array.isArray(p.riesgos)) o.riesgos = lista(p.riesgos, 12, (r) => (r && txt(r.texto, 200) ? sinUndef({ texto: txt(r.texto, 200), estado: ['ok', 'riesgo', 'falta'].includes(r.estado) ? r.estado : 'falta', nota: txt(r.nota, 200) }) : undefined));
  if (p.metodologia) { const m = p.metodologia; o.metodologia = sinUndef({ oferta: txt(m.oferta, 600), modelo: m.modelo ? sinUndef({ atraccion: txt(m.modelo.atraccion, 200), upsell: txt(m.modelo.upsell, 200), downsell: txt(m.modelo.downsell, 200), continuidad: txt(m.modelo.continuidad, 200) }) : undefined, canales: lista(m.canales, 6, (x) => txt(x, 80)) }); }
  if (p.comercial && typeof p.comercial === 'object') {
    // bottlenecks: cuellos que la persona o Strategy anotan (los de tasa y alcance se calculan aparte); acciones: el plan de 3 a 5, con área y fecha.
    const cu = p.comercial, usados = new Set(), unico = (x, i, pre) => { let id = idCorto(x?.id) || `${pre}${i + 1}`; while (usados.has(id)) id += 'x'; usados.add(id); return id; };
    o.comercial = sinUndef({
      bottlenecks: lista(cu.bottlenecks, 12, (x, i) => (x && txt(x.texto, 240) ? { id: unico(x, i, 'b'), etapa: ETAPAS_EMBUDO.includes(x.etapa) ? x.etapa : '', tipo: x.tipo === 'alcance' ? 'alcance' : x.tipo === 'tasa' ? 'tasa' : '', texto: txt(x.texto, 240), nota: txt(x.nota, 240) || '' } : undefined)),
      acciones: lista(cu.acciones, 5, (x, i) => (x && txt(x.titulo, 160) ? { id: unico(x, i, 'a'), titulo: txt(x.titulo, 160), area: areaDe(x.area), fecha: fechaOk(x.fecha), cuello: idCorto(x.cuello) } : undefined)),
    });
  }
  if (p.roadmap) {
    const rm = p.roadmap, h = rm.hitos;
    // hitos: los 4 números de la meta por trimestre (el panel de hoy) o, de la herramienta Growth Roadmap, [{ id, titulo, fecha, meta }].
    const hitos = !Array.isArray(h) ? undefined : h.some((x) => x && typeof x === 'object') ? limpiarHitos(h) : Array.from({ length: 4 }, (_, i) => num(h[i]) ?? null);
    o.roadmap = sinUndef({ filas: lista(rm.filas, 8, (f) => (f && txt(f.area, 40) ? { area: txt(f.area, 40), celdas: Array.from({ length: 4 }, (_, i) => txt(f.celdas?.[i], 160) || '') } : undefined)), hitos, items: Array.isArray(rm.items) ? limpiarItems(rm.items) : undefined });
  }
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v && (Array.isArray(v) || Object.keys(v).length)));
}

// Junta el parche sobre lo que hay (por sección; las listas se reemplazan). Marca qué secciones cambiaron y cuándo.
export function aplicar(cur = {}, parche, en = new Date().toISOString()) {
  const out = { ...cur }, act = { ...(cur.actualizado || {}) }, cambiadas = [];
  for (const [k, v] of Object.entries(parche)) {
    out[k] = Array.isArray(v) ? v : { ...(cur[k] || {}), ...v, ...(v.modelo ? { modelo: { ...(cur[k]?.modelo || {}), ...v.modelo } } : {}) };
    act[k] = en; cambiadas.push(k);
  }
  out.actualizado = act;
  return { viva: out, cambiadas };
}

// De la meta para atrás. null donde falta un supuesto.
export function cascada(v = {}) {
  const obj = v.meta?.objetivo, i = v.inversa || {};
  const div = (a, b) => (a != null && b ? a / b : null);
  const clientes = div(obj, i.ticket), conversaciones = div(clientes, i.cierre), visitas = div(conversaciones, i.conversion), alcance = div(visitas, i.visita);
  const deContenido = v.contenido?.piezas != null && v.contenido?.alcance_pieza != null ? v.contenido.piezas * v.contenido.alcance_pieza : null;
  const dePauta = v.pauta?.mensual != null && v.pauta?.cpm ? (v.pauta.mensual / v.pauta.cpm) * 1000 : null;
  return { ventas: obj ?? null, clientes, conversaciones, visitas, alcance, deContenido, dePauta, cubre: alcance && (deContenido != null || dePauta != null) ? ((deContenido || 0) + (dePauta || 0)) / alcance : null };
}

// Qué paso está listo y cuál sigue.
export function avance(v = {}) {
  const i = v.inversa || {}, a = v.analisis || {}, m = v.metodologia || {};
  const listo = {
    contexto: Boolean(v.contexto?.conclusion),
    analisis: Boolean(a.mbt && a.unfair && a.goget),
    inversa: Boolean(v.meta?.objetivo && i.ticket && i.cierre && i.conversion && i.visita),
    metodologia: Boolean(m.oferta || Object.values(m.modelo || {}).some(Boolean)),
    entrega: Boolean(v.roadmap?.filas?.length || v.roadmap?.items?.length),
  };
  const ahora = PASOS.find((p) => !listo[p.id])?.id || 'entrega';
  return { listo, ahora, n: PASOS.filter((p) => listo[p.id]).length };
}

// Los bloques ```estrategia``` y ```pregunta``` de una respuesta: se quitan del texto que se lee y se devuelven aparte.
const RE_BLOQ = /```(estrategia|pregunta)\s*\n([\s\S]*?)```/g;
export function sinBloques(t) { return String(t || '').replace(RE_BLOQ, '').replace(/```(estrategia|pregunta)[\s\S]*$/, '').replace(/\n{3,}/g, '\n\n').trim(); }
export function leerBloques(t) {
  const parches = [], preguntas = [];
  for (const m of String(t || '').matchAll(RE_BLOQ)) {
    let j; try { j = JSON.parse(m[2]); } catch { continue; }
    if (m[1] === 'estrategia') parches.push(limpiarParche(j));
    else if (j && txt(j.texto, 200)) preguntas.push({ texto: txt(j.texto, 200), por_que: txt(j.por_que, 240) || '', opciones: (Array.isArray(j.opciones) ? j.opciones : []).slice(0, 4).map((x) => txt(x, 80)).filter(Boolean) });
  }
  return { parche: parches.reduce((acc, p) => { for (const [k, v] of Object.entries(p)) acc[k] = Array.isArray(v) ? v : { ...(acc[k] || {}), ...v }; return acc; }, {}), preguntas: preguntas.slice(0, 1) };
}

// Lo que se le dice a Strategy para que llene la estrategia en vivo (va antes del «Pedido»).
export function instrucciones(v = {}, { nivel = '' } = {}) {
  const { listo, ahora } = avance(v);
  const estado = { ...v }; delete estado.actualizado; delete estado.aprobado;
  return [
    'ESTRATEGIA EN VIVO. Junto al chat hay un panel con la estrategia del cliente que se va armando. Sigue el método de ① Strategy, en orden:',
    '1. Contexto + Diagnóstico: con la data del cliente (y la Library que adjunten), la etapa del $100M Scaling Roadmap y una CONCLUSIÓN en una frase.',
    '2. Análisis: MUST BE TRUE, UNFAIR y GO GET, con data de afuera (Investigación) cuando la haya, y dónde está trabado el negocio según Hormozi (oferta, modelo, leads o capacidad).',
    '3. Ingeniería inversa: de la meta financiera para atrás (ticket, cierre, conversión, visita) y de dónde sale el alcance (contenido: piezas, alcance por pieza y semana tipo; pauta: inversión y CPM). Con Modelo de dinero y Leads (Core Four). Haz las preguntas que hagan falta para que sea real (capacidad, inversión, upsell…).',
    `4. Metodología: la oferta (ecuación de valor / Grand Slam), el modelo de dinero y los canales.${/growth/i.test(nivel) && !/partner/i.test(nivel) ? ' Este cliente es Brand Growth: la oferta NO se cambia, solo el mensaje.' : ''}`,
    '5. Entrega: el roadmap por trimestres (filas por área: Strategy, Marketing, Creatividad, Producción, Ads…; 4 celdas Mes 1-3, 4-6, 7-9, 10-12) y la meta de cada trimestre en «hitos».',
    `Paso actual: ${ahora}. Listos: ${Object.entries(listo).filter(([, x]) => x).map(([k]) => k).join(', ') || 'ninguno'}.`,
    `Lo que ya tiene el panel (JSON): ${JSON.stringify(estado).slice(0, 6000)}`,
    'Cuando algo se concrete, AL FINAL de tu respuesta agrega UN bloque así (solo los campos que cambian; números sin formato; tasas como 0.25):',
    '```estrategia',
    '{"meta":{"actual":40000,"objetivo":120000,"meses":12},"contexto":{"conclusion":"…"},"analisis":{"mbt":"…","unfair":"…","goget":"…","trabado":"leads","porque":"…"},"inversa":{"ticket":4800,"cierre":0.25,"conversion":0.02,"visita":0.03},"contenido":{"piezas":14,"alcance_pieza":8000,"semana":["reel","story","reel","story","carrusel","story",""]},"pauta":{"mensual":3000,"cpm":60},"riesgos":[{"texto":"¿Pueden atender 25 clientes al mes?","estado":"riesgo","nota":"…"}],"metodologia":{"oferta":"…","modelo":{"atraccion":"…","upsell":"…","downsell":"…","continuidad":"…"},"canales":["…"]},"roadmap":{"filas":[{"area":"Strategy","celdas":["…","…","…","…"]}],"hitos":[55000,75000,95000,120000]}}',
    '```',
    'Nunca inventes cifras: si un dato no está, no lo pongas y pregúntalo. Si necesitas UN dato puntual de la persona, agrega también (máximo una):',
    '```pregunta',
    '{"texto":"¿…?","por_que":"una frase","opciones":["…","…","…"]}',
    '```',
    'El texto de tu respuesta va primero, corto y claro; los bloques van al final y la persona no los ve.',
  ].join('\n');
}
