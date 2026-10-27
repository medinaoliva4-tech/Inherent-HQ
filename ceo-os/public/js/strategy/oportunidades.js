// Opportunity Map (herramienta opportunity-map de Strategy): las oportunidades de crecimiento del cliente, cada una con cinco puntajes de 1 a 5
// (impacto, dificultad, costo relativo, tiempo y confianza), su evidencia y su origen. De ahí salen el 2×2 impacto vs dificultad y un ranking
// impacto×confianza/(dificultad×costo×tiempo) con pesos visibles. Lo FUERA DEL ALCANCE (contra la ficha de oferta) no se elige ni se envía al roadmap.
// Módulo puro (sin DOM ni red): lo comparten la vista, el servidor y las pruebas. Sin puntaje no hay ranking: ⚠️ SIN DATOS, nunca 0.
// El costo es un puntaje relativo (1 = barato, 5 = caro), no dinero: nada de costos de Inherent entra aquí.
import { tareaDeEncargo } from '../llm/modos.js';
import { plano, corta, entero, sinAcentos, verdadero, SIN_DATOS, armarPrompt, leerBloque, leerHerramienta, entradaDe, celda, RUTAS_HORMOZI } from '../consulting/marcos.js';
import { resumenTexto as resumenXray } from './xray.js';
import { areaDe, trimestreDe } from './roadmap.js';

export const BLOQUE = 'oportunidades';
export const MAX_ITEMS = 40;
export const ESTADOS = [{ id: 'propuesta', nombre: 'Propuesta' }, { id: 'elegida', nombre: 'Elegida' }, { id: 'descartada', nombre: 'Descartada' }, { id: 'enviada', nombre: 'Enviada al roadmap' }];
const ESTADOS_IDS = ESTADOS.map((e) => e.id);
// Los cinco puntajes: cuál sube el ranking (suma) y cuál lo baja (resta), y qué significa 1 y 5.
export const PUNTAJES = [
  { id: 'impacto', nombre: 'Impacto', sube: true, uno: 'casi no mueve el negocio', cinco: 'mueve la meta' },
  { id: 'dificultad', nombre: 'Dificultad', sube: false, uno: 'se hace con lo que hay', cinco: 'requiere capacidades nuevas' },
  { id: 'costo', nombre: 'Costo', sube: false, uno: 'casi no cuesta', cinco: 'cuesta mucho' },
  { id: 'tiempo', nombre: 'Tiempo', sube: false, uno: 'semanas', cinco: 'más de un año' },
  { id: 'confianza', nombre: 'Confianza', sube: true, uno: 'es una corazonada', cinco: 'lo prueba un dato del cliente' },
];
export const PUNTAJES_IDS = PUNTAJES.map((p) => p.id);
export const puntajeInfo = (id) => PUNTAJES.find((p) => p.id === id) || null;
// Los pesos son exponentes de cada puntaje en la fórmula; 1 = la fórmula tal cual. Se ven y se pueden mover.
export const PESOS_BASE = { impacto: 1, dificultad: 1, costo: 1, tiempo: 1, confianza: 1 };
export const PESO_MAX = 3;
export const FORMULA = 'impacto × confianza ÷ (dificultad × costo × tiempo)';
export const CUADRANTES = [
  { id: 'rapida', nombre: 'Victoria rápida', que: 'mucho impacto, poca dificultad' },
  { id: 'apuesta', nombre: 'Apuesta grande', que: 'mucho impacto, mucha dificultad' },
  { id: 'relleno', nombre: 'Relleno', que: 'poco impacto, poca dificultad' },
  { id: 'evitar', nombre: 'Evitar', que: 'poco impacto, mucha dificultad' },
];

const idLimpio = (v, n = 30) => String(v ?? '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, n);
let seq = 0;
const idNuevo = () => `o-${Date.now().toString(36).slice(-5)}${(seq++).toString(36)}`;
// Una oportunidad nueva, sin puntajes (⚠️ SIN DATOS): base trae lo que ya se sabe (titulo, origen, evidencia, id).
export function nuevoItem(base = {}) {
  const b = plano(base) ? base : {};
  return { id: idLimpio(b.id) || idNuevo(), titulo: corta(b.titulo, 160), origen: corta(b.origen, 80) || 'manual', impacto: null, dificultad: null, costo: null, tiempo: null, confianza: null, evidencia: corta(b.evidencia, 400), estado: 'propuesta', fuera_alcance: false };
}
export function vacio() { return { items: [], pesos: { ...PESOS_BASE } }; }

const peso = (v) => { const x = Number(v); return Number.isFinite(x) && x >= 0 && x <= PESO_MAX ? Math.round(x * 2) / 2 : null; };
export function limpiarPesos(p) { const o = plano(p) ? p : {}; return Object.fromEntries(PUNTAJES_IDS.map((k) => [k, peso(o[k]) ?? PESOS_BASE[k]])); }
const estadoDe = (v) => { const s = sinAcentos(v); return ESTADOS_IDS.find((e) => e === s) || (s === 'elegido' ? 'elegida' : s === 'descartado' ? 'descartada' : 'propuesta'); };

// Solo lo conocido, con su tipo y su tamaño. Ids únicos; puntajes enteros de 1 a 5 (lo demás es null, no 0); lo FUERA DEL ALCANCE no queda elegido ni enviado.
export function limpiar(contenido) {
  const o = plano(contenido) ? contenido : {}, usados = new Set(), items = [];
  for (const x of (Array.isArray(o.items) ? o.items : []).filter(plano)) {
    const titulo = corta(x.titulo, 160); if (!titulo || items.length >= MAX_ITEMS) continue;
    let id = idLimpio(x.id) || idNuevo(); while (usados.has(id)) id = idNuevo(); usados.add(id);
    const fuera = verdadero(x.fuera_alcance), est = estadoDe(x.estado);
    items.push({ id, titulo, origen: corta(x.origen, 80) || 'manual', ...Object.fromEntries(PUNTAJES_IDS.map((k) => [k, entero(x[k], 1, 5)])), evidencia: corta(x.evidencia, 400),
      estado: fuera && (est === 'elegida' || est === 'enviada') ? 'propuesta' : est, fuera_alcance: fuera });
  }
  return { items, pesos: limpiarPesos(o.pesos) };
}

// ---------- Ranking y cuadrante ----------
export const completo = (x) => PUNTAJES_IDS.every((k) => Number.isInteger(x?.[k]));
export const puntajesFaltan = (x) => PUNTAJES_IDS.filter((k) => !Number.isInteger(x?.[k]));
// impacto^w × confianza^w ÷ (dificultad^w × costo^w × tiempo^w). null si falta un puntaje (nunca 0).
export function rankingDe(x, pesos = PESOS_BASE) {
  if (!completo(x)) return null;
  const w = limpiarPesos(pesos), p = (k) => x[k] ** w[k];
  return Math.round(((p('impacto') * p('confianza')) / (p('dificultad') * p('costo') * p('tiempo'))) * 100) / 100;
}
// La lista ordenada: primero lo que se puede trabajar (mayor ranking primero), luego lo sin puntaje y al final lo FUERA DEL ALCANCE y lo descartado.
// Cada fila trae su lugar (n, solo si tiene ranking) y su ranking. Empate: el de menos dificultad y luego el título.
export function ranking(contenido) {
  const c = limpiar(contenido), peso = (x) => (x.fuera_alcance ? 3 : x.estado === 'descartada' ? 2 : 0);
  const filas = c.items.map((x) => ({ ...x, ranking: rankingDe(x, c.pesos) }))
    .sort((a, b) => peso(a) - peso(b) || (b.ranking ?? -1) - (a.ranking ?? -1) || (a.dificultad ?? 9) - (b.dificultad ?? 9) || a.titulo.localeCompare(b.titulo));
  let n = 0;
  return filas.map((x) => ({ ...x, n: x.ranking != null && !x.fuera_alcance && x.estado !== 'descartada' ? ++n : null }));
}
// El cuadrante del 2×2: «alto» es más de 3 (4 o 5). null si falta impacto o dificultad.
export function cuadrante(x) {
  if (!Number.isInteger(x?.impacto) || !Number.isInteger(x?.dificultad)) return null;
  const i = x.impacto > 3, d = x.dificultad > 3;
  return i ? (d ? 'apuesta' : 'rapida') : (d ? 'evitar' : 'relleno');
}
export const cuadranteInfo = (id) => CUADRANTES.find((c) => c.id === id) || null;

// ---------- Elegir y enviar ----------
// Solo se envía lo elegido y dentro del alcance. Lo FUERA DEL ALCANCE se escala al CEO, no va al roadmap.
export const puedeEnviar = (x) => Boolean(x) && !x.fuera_alcance && x.estado === 'elegida';
export const puedeElegir = (x) => Boolean(x) && !x.fuera_alcance && x.estado !== 'enviada';
// Las filas del roadmap (con oportunidad_id, el origen de cada una). Nada se manda solo: quien llama las escribe.
export function aRoadmap(items, { area = 'strategy', trimestre = 'T1' } = {}) {
  const a = areaDe(area) || 'strategy', t = trimestreDe(trimestre) || 'T1';
  return limpiar({ items }).items.filter(puedeEnviar).map((x) => ({ id: `op-${x.id}`.slice(0, 24), oportunidad_id: x.id, area: a, trimestre: t, titulo: x.titulo, tareas: [] }));
}
// Una tarea por oportunidad elegida (o enviada) dentro del alcance, con la forma de tareaDeEncargo y un id estable (no se duplica).
export const idTarea = (slug, id) => `op-${idLimpio(slug, 60)}-${idLimpio(id, 30)}`.slice(0, 120);
export function tareasDe(items, { slug = '', nombre = '', email = '' } = {}) {
  return limpiar({ items }).items.filter((x) => !x.fuera_alcance && ['elegida', 'enviada'].includes(x.estado)).map((x) => ({
    ...tareaDeEncargo({ area: 'estrategia', titulo: x.titulo, por_que: [`Del Opportunity Map · ${x.origen}`, x.evidencia].filter(Boolean).join(' · '), vence: '' }, { cliente: slug, nombre, email }), id: idTarea(slug, x.id), dept: '① Strategy', oportunidad_id: x.id,
  }));
}

// ---------- Lo que falta (bloquea aprobar) ----------
export function faltas(contenido) {
  const c = limpiar(contenido), out = [], vivas = c.items.filter((x) => x.estado !== 'descartada' && !x.fuera_alcance);
  if (!c.items.length) return ['Falta al menos una oportunidad'];
  for (const x of vivas) {
    const f = puntajesFaltan(x); if (f.length) out.push(`«${x.titulo}» no tiene todos los puntajes (falta ${f.map((k) => puntajeInfo(k).nombre.toLowerCase()).join(', ')})`);
    if (!x.evidencia) out.push(`«${x.titulo}» no tiene evidencia`);
  }
  if (!c.items.some(puedeEnviar) && !c.items.some((x) => x.estado === 'enviada')) out.push('Elige al menos una oportunidad');
  return out;
}

// Una línea para el Overview y para que otras herramientas (Growth Roadmap) lean el mapa aprobado.
export function resumenTexto(contenido) {
  const c = limpiar(contenido), r = ranking(c), top = r.filter((x) => x.n != null).slice(0, 3);
  return [`Oportunidades: ${c.items.length}`, `elegidas ${c.items.filter((x) => x.estado === 'elegida' || x.estado === 'enviada').length}`, `fuera del alcance ${c.items.filter((x) => x.fuera_alcance).length}`,
    top.length ? `primeras: ${top.map((x) => `${x.titulo} (${x.ranking})`).join(', ')}` : ''].filter(Boolean).join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {}, fuera = corta(c.ficha?.fuera, 300);
  const xr = entradaDe(c, 'business-xray'), cd = corta(c.comercial_resumen, 300);
  const extra = [xr ? `Entrada aprobada · Business X-Ray v${Number(xr.version) || 1}: ${corta(resumenXray(xr.contenido), 380)}` : '', cd ? `Commercial Diagnosis: ${cd}` : ''].filter(Boolean);
  const cuerpo = [
    'MÉTODO',
    `Fuentes (el contexto las trae si existen; lo que no está va ${SIN_DATOS} y dices de dónde saldría): la ficha de oferta, el Business X-Ray aprobado, el Commercial Diagnosis, la Library y la Investigación del cliente. Lee en hormozi-brain: ${RUTAS_HORMOZI.overview}.`,
    `1) items (máximo 12): cada oportunidad = titulo (un resultado), origen (de dónde sale: business-xray, commercial-diagnosis, investigación o chat), impacto, dificultad, costo, tiempo y confianza (enteros de 1 a 5; costo y tiempo altos = caro y lento; confianza alta = lo prueba un dato del cliente), evidencia (la RAZÓN de los puntajes, con su fuente o [dice el cliente, sin verificar]) y fuera_alcance (true si la ficha de oferta no lo incluye${fuera ? `; fuera de la ficha: ${fuera}` : ''}).`,
    '2) Un puntaje sin dato va null, nunca 0 ni «de memoria». Si la empresa no aguanta más demanda, sube primero las oportunidades de capacidad.',
    `3) El OS ordena con ${FORMULA}: tú solo puntúas. Lo fuera_alcance se escala al CEO y no va al roadmap.`,
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"items":[{"id":"o1","titulo":"…","origen":"business-xray","impacto":4,"dificultad":2,"costo":2,"tiempo":2,"confianza":3,"evidencia":"… [fuente]","fuera_alcance":false}]}',
    F, `${F}criterios`, '{"entregable":"Opportunity Map","cumple":["…"],"falta":["… — por qué"]}', F,
  ];
  return armarPrompt({ intro: `Eres Strategy de Inherent. Arma el OPPORTUNITY MAP de «${corta(c.cliente?.nombre, 80) || 'el cliente'}»: las oportunidades de crecimiento con sus puntajes y su razón.`, cuerpo, salida, extra }, c);
}
// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, sin bloque o sin ninguna oportunidad).
export function leer(texto) {
  const j = leerBloque(texto, BLOQUE);
  return j && Array.isArray(j.items) && limpiar(j).items.length ? leerHerramienta(texto, BLOQUE, limpiar) : null;
}

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), r = ranking(c), w = c.pesos, n = (v) => (v == null ? SIN_DATOS : v);
  const L = ['# Opportunity Map', '', `Ranking: ${FORMULA}. Pesos: ${PUNTAJES.map((p) => `${p.nombre.toLowerCase()} ${w[p.id]}`).join(' · ')}.`, '',
    '| # | Oportunidad | Origen | Impacto | Dificultad | Costo | Tiempo | Confianza | Ranking | Estado | Evidencia |', '|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const x of r) L.push(`| ${x.n ?? '—'} | ${celda(x.titulo)} | ${celda(x.origen)} | ${n(x.impacto)} | ${n(x.dificultad)} | ${n(x.costo)} | ${n(x.tiempo)} | ${n(x.confianza)} | ${n(x.ranking)} | ${x.fuera_alcance ? 'FUERA DEL ALCANCE' : ESTADOS.find((e) => e.id === x.estado).nombre} | ${x.evidencia ? celda(x.evidencia) : SIN_DATOS} |`);
  if (!r.length) L.push(`| | ${SIN_DATOS}: todavía no hay oportunidades | | | | | | | | | |`);
  return L.join('\n');
}
