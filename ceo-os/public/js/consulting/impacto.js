// Impact Tracker (herramienta impact-tracker de Consulting): la ecuación de ingresos antes → ahora → meta, factor por factor, las
// metas del plan, los resultados internos (horas y margen) y el reporte para el cliente. Módulo puro (sin DOM ni red) para que lo
// compartan la interfaz, el servidor, el portal y las pruebas. La ecuación y el avance se CALCULAN aquí, y un factor que falta
// da null, nunca 0. versionCliente() es lo único que sale hacia el cliente: sin horas, sin margen y sin notas internas.
import { ECUACION, nombreFactor, SIN_DATOS, armarPrompt, celda, miles, corta, numeroONull, sinAcentos, plano as esObjeto, leerBloque, leerHerramienta } from './marcos.js';

export const BLOQUE = 'impacto';

// ---------- Utilidades ----------
// Un número o null. Acepta moneda y miles («Q1,200», «$ 1 200.50») y, si se pide, el % («15%»). Lo demás no se adivina: «1.5M» perdería
// su escala, «+10%» es un cambio relativo y «40 h» trae una unidad; todos dan null (⚠️ SIN DATOS) en vez de un número equivocado.
const leerNum = (v) => {
  if (typeof v === 'number') return { x: v, pct: false };
  const m = typeof v === 'string' ? /^(-?)\s*(?:US\$|GTQ|USD|[$Q€£])?\s*(\d[\d,\s]*(?:\.\d+)?)\s*(%?)$/i.exec(v.trim()) : null;
  return m ? { x: Number(m[1] + m[2].replace(/[,\s]/g, '')), pct: Boolean(m[3]) } : null;
};
const num = (v, min = 0, max = 1e12, { pct = false } = {}) => { const n = leerNum(v); return n && (pct || !n.pct) ? numeroONull(n.x, { min, max }) : null; };
// Las tasas: 0.8, 80 o «80%» quedan como 0.8.
const tasa = (v) => { const n = leerNum(v); return n ? numeroONull(n.pct || n.x > 1 ? n.x / 100 : n.x, { min: 0, max: 1 }) : null; };
const redondeo = (x) => Math.round(x * 100) / 100;
// Un texto largo que conserva los párrafos (el reporte).
const parrafos = (v, n = 6000) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').split('\n').map((l) => corta(l, n)).join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, n) : '');
const fechaReal = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? '')); if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); // una fecha que no existe (2026-13-45) no se acepta
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? m[0] : '';
};

// ---------- Los factores: leads × conversión × ticket × frecuencia × retención ----------
// Conversión y retención son tasas: van de 0 a 1 (80 u «80%» quedan como 0.8).
export const FACTORES = ECUACION.map((id) => ({ id, nombre: nombreFactor(id), tasa: id === 'conversion' || id === 'retencion' }));
const valorFactor = (f, v) => (f.tasa ? tasa(v) : num(v));
const limpiarFactores = (o) => { const e = esObjeto(o) ? o : {}; return Object.fromEntries(FACTORES.map((f) => [f.id, valorFactor(f, e[f.id])])); };

// ---------- Cálculos ----------
// El producto de todos los factores (ingresos). null si a alguno le falta el dato: un cero que no se midió no cuenta.
export function ecuacion(valores = {}) {
  const e = esObjeto(valores) ? valores : {};
  let r = 1;
  for (const f of FACTORES) { const v = valorFactor(f, e[f.id]); if (v === null) return null; r *= v; }
  return redondeo(r);
}
// Cuánto del camino de antes a la meta ya se hizo (0-100, redondeado, como goals.js). Recibe los factores (se multiplican) o números
// ya listos. null si falta cualquiera de los tres o si la meta es igual al punto de partida.
export function avance(antes, ahora, meta) {
  const v = (x) => (esObjeto(x) ? ecuacion(x) : num(x, -1e12));
  const a = v(antes), h = v(ahora), m = v(meta);
  if (a === null || h === null || m === null || m === a) return null;
  return Math.max(0, Math.min(100, Math.round(((h - a) / (m - a)) * 100)));
}
// El avance de cada factor por separado: { <factor>: % | null }.
export function avancePorFactor(antes, ahora, meta) {
  const a = limpiarFactores(antes), h = limpiarFactores(ahora), m = limpiarFactores(meta);
  return Object.fromEntries(FACTORES.map((f) => [f.id, avance(a[f.id], h[f.id], m[f.id])]));
}

// ---------- El contenido ----------
export function vacio() {
  const nulos = () => Object.fromEntries(FACTORES.map((f) => [f.id, null]));
  return { antes: nulos(), ahora: nulos(), meta: nulos(), metas: [], horas_ahorradas: null, delta_margen: null, reporte: '' };
}
// Deja solo lo conocido, con tipo y tamaño. Lo que la IA o la pantalla manden de más (id, v, _meta, notas, HTML) no entra; el texto queda como texto.
// delta_margen va en puntos porcentuales de margen (puede ser negativo).
export function limpiar(contenido) {
  const c = esObjeto(contenido) ? contenido : {};
  return {
    antes: limpiarFactores(c.antes), ahora: limpiarFactores(c.ahora), meta: limpiarFactores(c.meta),
    metas: (Array.isArray(c.metas) ? c.metas : []).filter(esObjeto).slice(0, 12).map((m) => ({ titulo: corta(m.titulo, 120), valor: num(m.valor, -1e12, 1e12, { pct: true }), actual: num(m.actual, -1e12, 1e12, { pct: true }), fecha: fechaReal(m.fecha) })),
    horas_ahorradas: num(c.horas_ahorradas, 0, 1e6), delta_margen: num(c.delta_margen, -100, 100, { pct: true }), reporte: parrafos(c.reporte),
  };
}

// ---------- Lo que sale al cliente ----------
// Una línea del reporte que habla de costos, márgenes, utilidad o notas internas no sale: el cliente nunca ve lo interno.
const RE_INTERNO = /\b(margen(es)?|costos?|utilidad(es)?|notas? internas?|horas (ahorradas|del equipo|de trabajo)|ahorr\w+ (de )?[\d.,]* ?horas)\b/;
const soloCliente = (reporte) => String(reporte || '').split('\n').filter((l) => !RE_INTERNO.test(sinAcentos(l))).join('\n').replace(/\n{3,}/g, '\n\n').trim();
// La versión que ve el cliente en su portal: la ecuación, las metas y el reporte. Sin horas_ahorradas, sin delta_margen, sin notas.
// Lista blanca: un campo que no esté aquí no sale, aunque alguien lo agregue al contenido.
export function versionCliente(contenido) {
  const c = limpiar(contenido);
  return { antes: c.antes, ahora: c.ahora, meta: c.meta, metas: c.metas.map(({ titulo, valor, actual, fecha }) => ({ titulo, valor, actual, fecha })), reporte: soloCliente(c.reporte) };
}

// ---------- Lo que falta (bloquea aprobar) ----------
export function faltas(contenido, extra = {}) { // extra no cambia nada aquí: el contrato de las herramientas lo pasa siempre
  return limpiar(contenido).reporte ? [] : ['Falta el reporte para el cliente: genéralo antes de marcar el impacto como entregado.'];
}

// ---------- La IA ----------
export const SEMILLAS = [
  { id: 'impacto', titulo: 'Antes vs ahora', prompt: 'Con lo que dio el cliente, llena la ecuación de ingresos antes, ahora y meta, factor por factor. Lo que falte, márcalo.' },
  { id: 'reporte', titulo: 'Reporte para el cliente', prompt: 'Escribe el reporte para el cliente: qué se hizo, qué se movió y qué sigue. Sin costos, márgenes ni horas.' },
];
const F = '`'.repeat(3);
const resumen = (e) => { let s = ''; try { s = JSON.stringify(e?.contenido ?? {}); } catch { s = ''; } return `Entrada aprobada · ${corta(e?.tool, 40)} «${corta(e?.titulo, 80)}» v${Number(e?.version) || 1}: ${s.slice(0, 380)}`; };
// El pedido a la IA (< 5 000 caracteres): las reglas comunes de Consulting, el contexto del cliente (lo único que se recorta) y el método.
export const prompt = (ctx = {}) => armarPrompt({
  intro: `Eres Consulting de Inherent. Arma el IMPACT TRACKER de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: ¿el plan movió el negocio? La ecuación de ingresos antes → ahora → meta, factor por factor, y un reporte para el cliente.`,
  cuerpo: [
    `Ecuación: ${ECUACION.join(' × ')} (ingresos = el producto). La herramienta calcula el producto y el avance: tú no.`,
    '- antes: cómo estaba cada factor al arrancar el plan. ahora: cómo está hoy. meta: a dónde se quiere llegar. Números sin formato; conversion y retencion de 0 a 1.',
    `- Solo datos que dio el cliente o que están en su carpeta. Si falta uno, null y dilo en «falta» con ${SIN_DATOS} y de dónde saldría. Nunca inventes.`,
    '- metas: las métricas del plan de 90 días aprobado (están en las entradas): titulo, valor (la meta), actual y fecha AAAA-MM-DD.',
    '- horas_ahorradas y delta_margen (en puntos de margen): solo si el cliente los dio. Son internos y no entran al reporte.',
    '- reporte: para el cliente, de «tú», profesional pero no formal. Qué se hizo, qué se movió (con sus números) y qué sigue. SIN costos, márgenes, horas ahorradas ni notas internas. Un solo texto; separa los párrafos con \\n.',
  ],
  salida: [
    'Al final, UN bloque (números sin formato) y otro de criterios:',
    `${F}${BLOQUE}`,
    `{"antes":{${ECUACION.map((id) => `"${id}":null`).join(',')}},"ahora":{…},"meta":{…},"metas":[{"titulo":"…","valor":null,"actual":null,"fecha":"2026-12-31"}],"horas_ahorradas":null,"delta_margen":null,"reporte":"…"}`,
    F,
    `${F}criterios`,
    '{"entregable":"Impact Tracker","cumple":["…"],"falta":["…"]}',
    F,
  ],
  extra: (ctx?.entradas || []).slice(0, 3).map(resumen),
}, ctx);
// Busca el bloque ```impacto en la respuesta (el último bueno). JSON roto, bloque a medias o un objeto sin nada conocido → null.
const CLAVES = ['antes', 'ahora', 'meta', 'metas', 'horas_ahorradas', 'delta_margen', 'reporte'];
export function leer(texto) {
  const j = leerBloque(texto, BLOQUE);
  return j && CLAVES.some((k) => k in j) ? leerHerramienta(texto, BLOQUE, limpiar) : null;
}

// ---------- Exportar ----------
const dato = (n) => miles(n) || SIN_DATOS;
const valor = (f, v) => (v == null ? SIN_DATOS : f.tasa ? `${redondeo(v * 100)}%` : dato(v));
const pct = (n) => (n == null ? SIN_DATOS : `${n}%`);
function armar(c, interno) {
  const porFactor = avancePorFactor(c.antes, c.ahora, c.meta);
  const L = [interno ? '# Impact Tracker' : '# Reporte de impacto', '', '## Ecuación de ingresos', '', '| Factor | Antes | Ahora | Meta | Avance |', '|---|---|---|---|---|'];
  for (const f of FACTORES) L.push(`| ${celda(f.nombre)} | ${valor(f, c.antes[f.id])} | ${valor(f, c.ahora[f.id])} | ${valor(f, c.meta[f.id])} | ${pct(porFactor[f.id])} |`);
  L.push(`| **Ingresos (el producto)** | ${dato(ecuacion(c.antes))} | ${dato(ecuacion(c.ahora))} | ${dato(ecuacion(c.meta))} | ${pct(avance(c.antes, c.ahora, c.meta))} |`, '', '## Metas del plan', '');
  if (c.metas.length) { L.push('| Meta | Actual | Valor meta | Fecha |', '|---|---|---|---|'); for (const m of c.metas) L.push(`| ${celda(m.titulo)} | ${dato(m.actual)} | ${dato(m.valor)} | ${m.fecha || SIN_DATOS} |`); }
  else L.push(`${SIN_DATOS}: las metas salen del Plan de crecimiento 90 días aprobado.`);
  if (interno) L.push('', '## Resultados internos (no salen al cliente)', '', `- Horas ahorradas: ${dato(c.horas_ahorradas)}`, `- Delta de margen (puntos): ${dato(c.delta_margen)}`);
  L.push('', '## Reporte para el cliente', '', c.reporte || `${SIN_DATOS}: se genera con «Generar reporte».`, '');
  return L.join('\n');
}
export const aMd = (contenido) => armar(limpiar(contenido), true);
// La misma exportación, la que sí se puede mandar al cliente.
export const aMdCliente = (contenido) => armar(limpiar(versionCliente(contenido)), false);
