// Marketing Performance Center · el reporte mensual (bloque «reporte»): el resumen del mes, la foto de sus KPIs, los hallazgos (cada
// uno cita un KPI), 3 a 5 siguientes acciones y la nota interna. Es el contenido del entregable de la herramienta
// marketing-performance-center (uno por mes). Existe para que el pedido a la IA (con mk-loop), la lectura de su respuesta, las reglas
// de aprobación, el export y la versión que va al portal vivan en un solo módulo puro (sin DOM ni red) que comparten la vista, el servidor
// y las pruebas. Nada se inventa: una afirmación sin KPI es una falta, y un dato que falta es null con su fuente, nunca 0.
import { SIN_DATOS, plano, corta, numeroONull, leerHerramienta, contextoPrompt, celda, sinAcentos } from '../consulting/marcos.js';
import { KPIS, KPI_IDS, esCosto, kpiDe, nombreKpi, textoValor, FUENTE_COSTOS, hablaDeCostos, sinFrasesDeCostos, mesDe } from './kpis.js';
import { mesOk, nombreMes } from '../plan-mes.js';

export const BLOQUE = 'reporte';
export const MIN_SIGUIENTES = 3;
export const MAX_SIGUIENTES = 5;
const MAX_HALLAZGOS = 8, MAX_ACCIONES = 8;
// Los departamentos a quienes se manda una acción (los mismos de cycle.js: código y nombre).
export const AREAS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];

// ---------- Lo básico ----------
const fechaReal = (s) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s ?? ''))) return ''; const d = new Date(`${s}T12:00:00Z`); return d.toISOString().slice(0, 10) === s ? s : ''; };
const SINONIMOS_KPI = { engagement: 'er', 'engagement (er)': 'er', interacciones: 'er', vistas: 'views', 'gasto de pauta': 'gasto', 'presupuesto de pauta': 'presupuesto', 'piezas publicadas': 'publicadas', 'piezas planeadas': 'planeadas' };
// El id de un KPI, venga el id o el nombre; '' si no es ninguno.
export function kpiId(v) {
  const k = sinAcentos(v);
  return KPI_IDS.find((id) => id === k) || KPIS.find((x) => sinAcentos(x.nombre) === k)?.id || SINONIMOS_KPI[k] || '';
}
// El área de una acción: el nombre del departamento venga con su código o sin él («③ Marketing», «marketing», «③»); si no es ninguno, el texto tal cual.
export function areaDe(v) {
  const k = sinAcentos(v).replace(/\s+/g, ' ');
  const hit = AREAS.find(([c, n]) => k === sinAcentos(n) || k === sinAcentos(c) || k === sinAcentos(`${c} ${n}`));
  return hit ? hit[1] : corta(v, 60);
}
export const deptDe = (area) => { const hit = AREAS.find(([, n]) => n === areaDe(area)); return hit ? `${hit[0]} ${hit[1]}` : corta(area, 80); };

// La foto de KPIs: solo ids conocidos, valor número o null, la fuente. Un valor con fuente «SIN DATOS» es null (nunca un 0 por un dato que falta).
export function kpisLimpios(lista) {
  const vistos = new Map();
  for (const x of Array.isArray(lista) ? lista : []) {
    const id = plano(x) ? kpiId(x.id) : '';
    if (!id || vistos.has(id)) continue;
    const fuente = corta(x.fuente, 200), valor = /sin datos/i.test(fuente) ? null : numeroONull(x.valor);
    vistos.set(id, { id, valor, fuente });
  }
  return KPI_IDS.filter((id) => vistos.has(id)).map((id) => vistos.get(id));
}

// ---------- El contenido ----------
// El contenido inicial: el mes y nada más (todo lo demás sale vacío y la vista dice de dónde sale).
export function vacio(mes = '') {
  return { mes: mesOk(mes) ? mes : '', resumen: '', kpis: [], hallazgos: [], siguientes: [], nota_interna: '' };
}

// Solo lo conocido, con su tipo y su tamaño. Lo demás (llaves de más, id, v, _meta) se cae; el HTML queda como texto.
export function limpiar(c) {
  const o = plano(c) ? c : {};
  return {
    mes: mesOk(mesDe(o.mes)) ? mesDe(o.mes) : '',
    resumen: corta(o.resumen, 1200),
    kpis: kpisLimpios(o.kpis),
    hallazgos: (Array.isArray(o.hallazgos) ? o.hallazgos : []).filter(plano).map((h) => ({ texto: corta(h.texto, 400), kpi: kpiId(h.kpi) })).filter((h) => h.texto).slice(0, MAX_HALLAZGOS),
    siguientes: (Array.isArray(o.siguientes) ? o.siguientes : []).filter(plano).map((s) => ({ accion: corta(s.accion, 240), area: areaDe(s.area), fecha: fechaReal(corta(s.fecha, 10)) })).filter((s) => s.accion).slice(0, MAX_ACCIONES),
    nota_interna: corta(o.nota_interna, 1200),
  };
}

// ---------- Lo que falta (bloquea aprobar) ----------
// Cada texto es un criterio en «falta». Lee el contenido ya limpio o crudo. extra no cambia nada: el contrato de las herramientas lo pasa siempre.
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), f = [];
  if (!c.mes) f.push('Falta el mes del reporte');
  if (!c.resumen) f.push('Falta el resumen: dos o tres frases con lo que pasó este mes');
  if (!c.kpis.length) f.push('Falta la foto de los KPIs del mes: usa los KPIs de arriba');
  if (!c.hallazgos.length) f.push('Faltan los hallazgos: cada uno cita un KPI');
  c.hallazgos.forEach((h, i) => {
    if (!h.kpi) f.push(`El hallazgo ${i + 1} no cita un KPI: toda afirmación va con su número`);
    else if (c.kpis.length && !c.kpis.some((k) => k.id === h.kpi)) f.push(`El hallazgo ${i + 1} cita «${nombreKpi(h.kpi)}», que no está en la foto de KPIs del mes`);
  });
  const n = c.siguientes.length;
  if (n < MIN_SIGUIENTES || n > MAX_SIGUIENTES) f.push(`Debe haber de ${MIN_SIGUIENTES} a ${MAX_SIGUIENTES} siguientes acciones (hay ${n})`);
  return f;
}

// ---------- Costos: lo que no sale a quien no los ve ni al portal ----------
// Un hallazgo o una acción es «de costos» si cita un KPI de costo o habla de gasto, presupuesto, CPA, ROAS, costos, márgenes, inversión o montos.
const deCostos = (texto, kpi = '') => esCosto(kpi) || hablaDeCostos(texto);

// Lo que ve quien NO ve costos (el servidor lo usa al leer): los KPIs de costo sin valor, sin los hallazgos y las acciones que hablan de ellos
// y sin las frases de costos del resumen y de la nota. No toca el original.
export function sinCostos(contenido) {
  const c = limpiar(contenido);
  return {
    ...c,
    resumen: sinFrasesDeCostos(c.resumen),
    kpis: c.kpis.map((k) => (esCosto(k.id) ? { id: k.id, valor: null, fuente: FUENTE_COSTOS } : k)),
    hallazgos: c.hallazgos.filter((h) => !deCostos(h.texto, h.kpi)),
    siguientes: c.siguientes.filter((s) => !hablaDeCostos(s.accion)),
    nota_interna: sinFrasesDeCostos(c.nota_interna),
  };
}
// Las filas ocultas vuelven a su lugar; las visibles son las que mandó la persona (en su orden), y las que agregó van al final.
const fusionar = (guardadas, nuevas, oculta) => {
  const visibles = nuevas.filter((x) => !oculta(x)), out = []; let i = 0;
  for (const x of guardadas) { if (oculta(x)) out.push(x); else if (i < visibles.length) out.push(visibles[i++]); }
  return [...out, ...visibles.slice(i)];
};
// Lo que alguien SIN acceso a costos mandó (`nuevo`) con lo que ya estaba guardado (`actual`) puesto de vuelta: los KPIs de costo, los
// hallazgos y las acciones de costos y las frases de costos que no pudo ver. Lo que escriba sobre costos se descarta. actual = null: nada que conservar.
export function conCostos(actual, nuevo) {
  const a = limpiar(actual), n = limpiar(nuevo), previo = sinCostos(a);
  const costosDe = new Map(a.kpis.filter((k) => esCosto(k.id)).map((k) => [k.id, k]));
  const kpis = [...n.kpis.filter((k) => !esCosto(k.id)), ...KPIS.filter((k) => k.costo && (n.kpis.some((x) => x.id === k.id) || costosDe.has(k.id)))
    .map((k) => costosDe.get(k.id) || { id: k.id, valor: null, fuente: FUENTE_COSTOS })];
  return {
    ...n,
    // Lo que no tocó en pantalla vuelve entero; lo que reescribió es suyo (y pierde las frases de costos que no vio).
    resumen: n.resumen === previo.resumen ? a.resumen : sinFrasesDeCostos(n.resumen),
    kpis: KPI_IDS.map((id) => kpis.find((k) => k.id === id)).filter(Boolean),
    hallazgos: fusionar(a.hallazgos, n.hallazgos, (h) => deCostos(h.texto, h.kpi)).slice(0, MAX_HALLAZGOS),
    siguientes: fusionar(a.siguientes, n.siguientes, (x) => hablaDeCostos(x.accion)).slice(0, MAX_ACCIONES),
    nota_interna: n.nota_interna === previo.nota_interna ? a.nota_interna : sinFrasesDeCostos(n.nota_interna),
  };
}

// La versión que va al portal del cliente: sin nota interna, sin gasto, presupuesto, CPA ni ROAS y sin ninguna frase de costos. Nunca margenes ni horas.
export function versionPortal(contenido) {
  const c = limpiar(contenido);
  return {
    mes: c.mes,
    resumen: sinFrasesDeCostos(c.resumen),
    kpis: c.kpis.filter((k) => !esCosto(k.id)),
    hallazgos: c.hallazgos.filter((h) => !deCostos(h.texto, h.kpi)),
    siguientes: c.siguientes.filter((s) => !hablaDeCostos(s.accion)),
  };
}

// ---------- Con la respuesta de la IA ----------
// Los KPIs de un reporte nunca salen del modelo: son la foto de lo que midió el OS (ctx.kpis, los de la ruta marketing/<slug>/kpis; si no
// llegaron, los que ya estaban en pantalla). El mes manda el de la pantalla.
export function alUsar(nuevo, actual, ctx) {
  const n = limpiar(nuevo), a = limpiar(actual), delCtx = kpisLimpios(ctx?.kpis);
  return { ...n, mes: a.mes || (mesOk(ctx?.mes) ? ctx.mes : '') || n.mes, kpis: delCtx.length ? delCtx : a.kpis };
}
// Para quien pinta: los KPIs del servidor → la foto del reporte (solo id, valor y fuente).
export const fotoDe = (kpis) => kpisLimpios(kpis);

// ---------- De las acciones a tareas ----------
// Una tarea por siguiente acción. La clave de «convertir en tareas» (entregable + fila) es la acción, no su lugar: reordenar no duplica.
export function tareasDe(contenido) {
  const c = limpiar(contenido), vistas = new Set(), out = [];
  for (const s of c.siguientes) {
    const fila = `sig-${sinAcentos(s.accion).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}`;
    if (vistas.has(fila)) continue;
    vistas.add(fila);
    out.push({ title: s.accion, due: s.fecha, dept: deptDe(s.area), fila, por_que: `Reporte de Marketing de ${c.mes ? nombreMes(c.mes) : 'este mes'}`, assignee: '' });
  }
  return out.slice(0, 12);
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
const MAX_PROMPT = 4900;
const lineaKpi = (k) => {
  const id = plano(k) ? kpiId(k.id) : ''; if (!id) return '';
  const def = kpiDe(id), v = numeroONull(k.valor), nota = corta(k.nota, 60);
  return `- ${id} (${def.nombre}): ${v === null ? 'null' : textoValor({ formato: def.formato, valor: v })} · ${corta(k.fuente, 110) || '—'}${nota ? ` · ${nota}` : ''}`;
};
// Lo que la vista leyó del servidor (marketing/<slug>/kpis): el contexto de armarCtx no trae KPIs, y la IA tiene que leer los mismos que la
// persona ve arriba. ctx.kpis (si algún día llega) manda; si no, los últimos que la vista leyó de ese cliente. Vive solo en esta pestaña.
const VISTOS = new Map();
export function recordarKpis(slug, mes, kpis) {
  const k = String(slug ?? '').slice(0, 60); if (!k) return;
  if (VISTOS.size > 50) VISTOS.clear();
  VISTOS.set(k, { mes: mesOk(mes) ? mes : '', kpis: (Array.isArray(kpis) ? kpis : []).filter(plano).slice(0, 12) });
}
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {}, cli = plano(c.cliente) ? c.cliente : {}, nombre = corta(cli.nombre, 80) || 'el cliente';
  const visto = VISTOS.get(String(cli.slug ?? '')) || null;
  const mes = mesOk(c.mes) ? c.mes : visto?.mes || mesDe(c.hoy);
  const kpisCtx = Array.isArray(c.kpis) && c.kpis.length ? c.kpis : visto && visto.mes === mes ? visto.kpis : [];
  const lineas = kpisCtx.map(lineaKpi).filter(Boolean).join('\n').slice(0, 1300);
  const intro = `Eres ③ Marketing de Inherent. Arma el REPORTE MENSUAL de «${nombre}» de ${mes ? nombreMes(mes) : `${SIN_DATOS}: el mes`} para la revisión del día 20: qué rindió y qué cambia el próximo ciclo.`;
  const reglas = [
    'REGLAS (no se negocian):',
    '- Cada afirmación cita un KPI de la lista (su id). Sin KPI no hay afirmación. Nada se inventa ni se estima.',
    '- Dato que falta: null y ⚠️ SIN DATOS con de dónde saldría y a quién se le pide. Nunca 0 por un dato que falta.',
    '- Se juzga el reparto (función, pilar, canal, consciencia), no la pieza: la pieza es de ④ Creatividad. Sin métricas por slot no hay «ganador».',
    '- Gasto, presupuesto, CPA y ROAS son internos: en el resumen no menciones costos ni márgenes; si un hallazgo los necesita, cítalo por su KPI. La nota_interna es solo del equipo.',
    '- Nunca leas ni cites inherent/06-ECONOMIA.md, costos de Inherent ni datos de otro cliente. No publiques, pautes ni borres.',
    '- Roles, no nombres de personas. Español de «tú», corto y humano.',
  ].join('\n');
  const kpis = [
    `KPIS DEL MES (los mide el OS: cópialos tal cual en «kpis», sin cambiar valor ni fuente; kpi de cada hallazgo = uno de ${KPI_IDS.join(', ')}):`,
    lineas || `${SIN_DATOS}: los KPIs no llegaron a este pedido. No inventes números: lo que falte va null con su fuente, y el resumen dice qué falta.`,
  ].join('\n');
  const metodo = [
    'MÉTODO (agents/03-marketing/brain/skills/mk-loop/SKILL.md):',
    '1) Lee por función, por pilar y por canal; cada canal con la métrica de su ficha. Un pilar que no mueve nada en dos ciclos sale; un canal que no cumple en dos se propone cortar y se escala.',
    '2) Lee la consciencia: si todo rinde en «Listo para comprar» y nada en «Inconsciente», el negocio se está exprimiendo.',
    '3) Lo que falló por rumbo va a ① Strategy como dato, no como reclamo; si Conversion no cobró, puede ser la oferta (② Growth).',
    `4) De ${MIN_SIGUIENTES} a ${MAX_SIGUIENTES} siguientes acciones: qué, qué área la hace (③ Marketing, ④ Creatividad, ⑨ Posting, ⑩ Ads, ① Strategy…) y fecha AAAA-MM-DD. Un cambio de pauta es una tarea para ⑩ Ads o el OK del CEO: tú no lo haces.`,
  ].join('\n');
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"mes":"2026-10","resumen":"2 o 3 frases","kpis":[{"id":"alcance","valor":12400,"fuente":"Windsor · Instagram"}],"hallazgos":[{"texto":"…","kpi":"alcance"}],"siguientes":[{"accion":"…","area":"Marketing","fecha":"2026-11-03"}],"nota_interna":"solo el equipo"}',
    F,
    `${F}criterios`,
    '{"entregable":"Reporte mensual de Marketing","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ].join('\n');
  const fijo = [intro, '', reglas, '', kpis, '', metodo, '', salida].join('\n');
  // El contexto es lo único que se recorta: lo fijo (reglas, KPIs, método y cómo contestar) siempre entra.
  const ctxTxt = contextoPrompt(c, Math.max(120, MAX_PROMPT - fijo.length - 2));
  return [intro, '', reglas, '', ctxTxt, '', kpis, '', metodo, '', salida].join('\n');
}

// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
const valorTexto = (k) => {
  if (k.fuente === FUENTE_COSTOS) return 'Restringido';
  const def = kpiDe(k.id), t = def ? textoValor({ formato: def.formato, valor: k.valor }) : '';
  return t || SIN_DATOS;
};
export function aMd(contenido) {
  const c = limpiar(contenido), L = [`# Reporte de Marketing · ${c.mes ? nombreMes(c.mes) : SIN_DATOS}`, '', '## Resumen', '', c.resumen || `${SIN_DATOS}: falta el resumen del mes.`];
  L.push('', '## KPIs del mes', '');
  if (c.kpis.length) L.push('| KPI | Valor | Fuente |', '|---|---|---|', ...c.kpis.map((k) => `| ${celda(nombreKpi(k.id))} | ${celda(valorTexto(k))} | ${celda(k.fuente)} |`));
  else L.push(`${SIN_DATOS}: falta la foto de los KPIs del mes.`);
  L.push('', '## Qué vimos', '');
  L.push(...(c.hallazgos.length ? c.hallazgos.map((h, i) => `${i + 1}. ${h.texto}${h.kpi ? ` *(KPI: ${nombreKpi(h.kpi)})*` : ` *(${SIN_DATOS}: sin KPI)*`}`) : [`${SIN_DATOS}: faltan los hallazgos.`]));
  L.push('', '## Qué sigue', '');
  if (c.siguientes.length) L.push('| Acción | Área | Fecha |', '|---|---|---|', ...c.siguientes.map((s) => `| ${celda(s.accion)} | ${celda(s.area) || '—'} | ${s.fecha || '—'} |`));
  else L.push(`${SIN_DATOS}: faltan las siguientes acciones.`);
  if (c.nota_interna) L.push('', '## Nota interna (solo el equipo)', '', c.nota_interna);
  return L.join('\n');
}
// El export de la versión del portal: sin nota interna ni costos.
export const aMdPortal = (contenido) => aMd(versionPortal(contenido));
