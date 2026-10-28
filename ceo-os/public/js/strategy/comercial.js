// Commercial Diagnosis (herramienta commercial-diagnosis de Strategy): el score comercial (0-100, se calcula y nunca se guarda), el embudo de la
// meta hacia atrás con sus cuellos de botella (tasa que falta o hueco de alcance > 20%) y un plan de 3 a 5 acciones con área y fecha.
// NO usa el Tool Shell: su casa es la estrategia en vivo (viva.comercial { bottlenecks, acciones }) y la IA contesta con ```estrategia {"comercial":…}```.
// Módulo puro (sin DOM ni red): lo comparten la vista, el servidor y las pruebas. Los números salen solo del cliente, del CRM o de Windsor.
// Lo que falta dice «⚠️ SIN DATOS» y de dónde sale; nunca es 0. Nada de costos ni datos de Inherent.
import { cascada, limpiarParche, ETAPAS_EMBUDO } from '../estrategia-viva.js';
import { tareaDeEncargo } from '../llm/modos.js';
import { AREAS_RM_INFO, areaInfo } from './roadmap.js';
import { plano, corta, SIN_DATOS, armarPrompt, leerBloque, leerHerramienta, celda } from '../consulting/marcos.js';

export const BLOQUE = 'estrategia';
export { ETAPAS_EMBUDO };
export const MIN_ACCIONES = 3;
export const MAX_ACCIONES = 5;
export const UMBRAL_HUECO = 0.2; // un hueco de alcance mayor a 20% es cuello
// Cuánto vale cada parte del score (suman 100) y cómo cuenta cada estado de riesgo (ok = resuelto, riesgo = abierto, falta = sin respuesta).
export const PESOS_SCORE = { cobertura: 40, supuestos: 35, riesgos: 25 };
export const VALOR_RIESGO = { ok: 1, riesgo: 0.4, falta: 0 };

// sale_de: de dónde sale el dato (para decir «⚠️ SIN DATOS: sale de …»).
const SUPUESTOS = [
  { id: 'objetivo', nombre: 'Meta de ventas', sale_de: 'la meta que fija el cliente' },
  { id: 'ticket', nombre: 'Ticket', sale_de: 'las ventas y el ticket que comparte el cliente' },
  { id: 'cierre', nombre: 'Cierre', sale_de: 'el CRM del cliente' },
  { id: 'conversion', nombre: 'Conversión a conversación', sale_de: 'el CRM o la analítica del cliente' },
  { id: 'visita', nombre: 'Visita a conversión', sale_de: 'la analítica del cliente (Windsor)' },
];
export const SUPUESTOS_INFO = SUPUESTOS;
const valorSupuesto = (v, id) => (id === 'objetivo' ? v?.meta?.objetivo : v?.inversa?.[id]);
const pct = (x) => `${Math.round(x * 100)}%`;
const vacioC = () => ({ bottlenecks: [], acciones: [] });

export function vacio() { return vacioC(); }

// Solo lo conocido: pasa por el mismo limpiar que usa PUT estrategia/<slug>/viva (limpiarParche), así lo guardado y lo que muestra la pantalla coinciden.
export function limpiar(c) {
  const o = limpiarParche({ comercial: plano(c) ? c : {} }).comercial || {};
  return { bottlenecks: o.bottlenecks || [], acciones: o.acciones || [] };
}

// ---------- El score (función pura, reproducible; nunca se guarda) ----------
// { score: 0-100 | null, completo, partes: [{ id, nombre, pts, max, nota }] }. Sin ningún dato el score es null (⚠️ SIN DATOS), nunca 0.
export function score(viva = {}) {
  const v = plano(viva) ? viva : {}, cas = cascada(v), riesgos = Array.isArray(v.riesgos) ? v.riesgos : [];
  const presentes = SUPUESTOS.filter((s) => valorSupuesto(v, s.id) != null);
  const llaves = [cas.ventas, cas.clientes, cas.conversaciones, cas.visitas, cas.alcance, cas.cubre];
  const partes = [
    { id: 'cobertura', nombre: 'Cobertura del alcance', max: PESOS_SCORE.cobertura, ok: cas.cubre != null, pts: cas.cubre != null ? Math.round(Math.min(cas.cubre, 1) * PESOS_SCORE.cobertura * 10) / 10 : 0,
      nota: cas.cubre != null ? `Contenido y pauta cubren ${pct(Math.min(cas.cubre, 1))} del alcance que pide la meta` : `${SIN_DATOS}: sale de las piezas, el alcance por pieza y la pauta del cliente` },
    { id: 'supuestos', nombre: 'Supuestos presentes', max: PESOS_SCORE.supuestos, ok: presentes.length > 0, pts: Math.round((presentes.length / SUPUESTOS.length) * PESOS_SCORE.supuestos * 10) / 10,
      nota: presentes.length === SUPUESTOS.length ? 'Los 5 supuestos están' : `Faltan: ${SUPUESTOS.filter((s) => !presentes.includes(s)).map((s) => s.nombre).join(', ')}` },
    { id: 'riesgos', nombre: 'Riesgos atendidos', max: PESOS_SCORE.riesgos, ok: riesgos.length > 0, pts: riesgos.length ? Math.round((riesgos.reduce((a, r) => a + (VALOR_RIESGO[r?.estado] ?? 0), 0) / riesgos.length) * PESOS_SCORE.riesgos * 10) / 10 : 0,
      nota: riesgos.length ? `${riesgos.filter((r) => r?.estado === 'ok').length} de ${riesgos.length} resueltos` : `${SIN_DATOS}: sale de las preguntas de capacidad que contesta el cliente` },
  ];
  const hayDatos = partes.some((p) => p.ok) || llaves.some((x) => x != null);
  return { score: hayDatos ? Math.round(partes.reduce((a, p) => a + p.pts, 0)) : null, completo: partes.every((p) => p.ok), partes };
}

// ---------- El embudo y sus cuellos ----------
// De la meta hacia atrás: ventas → clientes (ticket) → conversaciones (cierre) → visitas (conversión) → alcance (visita). Cada paso trae la tasa que lo produce.
const PASOS = [
  { id: 'ventas', nombre: 'Ventas', tasa: 'objetivo', tasaNombre: 'Meta' },
  { id: 'clientes', nombre: 'Clientes', tasa: 'ticket', tasaNombre: 'Ticket' },
  { id: 'conversaciones', nombre: 'Conversaciones', tasa: 'cierre', tasaNombre: 'Cierre' },
  { id: 'visitas', nombre: 'Visitas', tasa: 'conversion', tasaNombre: 'Conversión' },
  { id: 'alcance', nombre: 'Alcance', tasa: 'visita', tasaNombre: 'Visita' },
];
export function embudo(viva = {}) {
  const v = plano(viva) ? viva : {}, cas = cascada(v);
  return {
    pasos: PASOS.map((p) => ({ ...p, valor: cas[p.id], tasaValor: valorSupuesto(v, p.tasa) ?? null, falta: valorSupuesto(v, p.tasa) == null, sale_de: SUPUESTOS.find((s) => s.id === p.tasa).sale_de })),
    cubre: cas.cubre, deContenido: cas.deContenido, dePauta: cas.dePauta, hueco: cas.cubre != null ? Math.max(0, 1 - cas.cubre) : null, cas,
  };
}
// Los cuellos que se calculan (no se guardan): cada tasa que falta y el hueco de alcance mayor a 20%. [{ id, etapa, tipo: 'tasa'|'alcance', texto, hueco? }]
export function cuellos(viva = {}) {
  const e = embudo(viva), out = [];
  for (const p of e.pasos) if (p.falta) out.push({ id: `c-${p.id}`, etapa: p.id, tipo: 'tasa', texto: `Falta ${p.tasa === 'objetivo' ? 'la meta de ventas' : `la tasa de ${p.tasaNombre.toLowerCase()}`}: ${SIN_DATOS}, sale de ${p.sale_de}` });
  if (e.cas.alcance != null) {
    if (e.cubre == null) out.push({ id: 'c-alcance', etapa: 'alcance', tipo: 'alcance', texto: `Nadie cubre el alcance que pide la meta: ${SIN_DATOS}, sale de las piezas con su alcance o de la pauta del cliente` });
    else if (e.hueco > UMBRAL_HUECO) out.push({ id: 'c-alcance', etapa: 'alcance', tipo: 'alcance', hueco: e.hueco, texto: `El contenido y la pauta cubren ${pct(Math.min(e.cubre, 1))} del alcance que pide la meta: falta ${pct(e.hueco)}` });
  }
  return out;
}
// Los cuellos calculados + los que anotó la persona o Strategy (sin repetir id).
export const todosLosCuellos = (viva, c) => { const calc = cuellos(viva), ids = new Set(calc.map((x) => x.id)); return [...calc, ...limpiar(c).bottlenecks.filter((b) => !ids.has(b.id))]; };

// ---------- Lo que falta ----------
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), out = [], hoy = corta(extra.hoy, 10);
  if (c.acciones.length < MIN_ACCIONES) out.push(`El plan lleva de ${MIN_ACCIONES} a ${MAX_ACCIONES} acciones (hay ${c.acciones.length})`);
  for (const a of c.acciones) {
    if (!a.area) out.push(`La acción «${a.titulo}» no tiene área`);
    if (!a.fecha) out.push(`La acción «${a.titulo}» no tiene fecha`);
    else if (hoy && a.fecha < hoy) out.push(`La acción «${a.titulo}» tiene fecha pasada (${a.fecha})`);
  }
  return out;
}

// ---------- A tareas y al Opportunity Map ----------
// Una tarea por acción, con la forma EXACTA de tareaDeEncargo y un id estable (no se duplica al convertir otra vez). Nada se crea solo.
export const idTarea = (slug, id) => `cd-${String(slug || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 60)}-${String(id || '').slice(0, 24)}`.slice(0, 120);
export function tareasDe(acciones, { slug = '', nombre = '', email = '' } = {}) {
  return limpiar({ acciones }).acciones.filter((a) => a.area).map((a) => {
    const info = areaInfo(a.area);
    const t = tareaDeEncargo({ area: info.modo, titulo: a.titulo, por_que: `Plan del Commercial Diagnosis · ${info.nombre}`, vence: a.fecha }, { cliente: slug, nombre, email });
    return { ...t, id: idTarea(slug, a.id), dept: info.dept, comercial_accion: a.id };
  });
}
// Los cuellos como ítems del Opportunity Map (sin puntajes: ahí se puntúan). origen guarda de dónde vienen.
export const aOportunidades = (cuellosLista) => (Array.isArray(cuellosLista) ? cuellosLista : []).filter((x) => x?.texto).slice(0, 12)
  .map((x) => ({ id: `cd-${String(x.id || x.etapa || 'x').replace(/[^a-z0-9_-]/gi, '').toLowerCase().slice(0, 30)}`, titulo: corta(x.texto.replace(/: ⚠️ SIN DATOS.*$/, ''), 160), origen: `commercial-diagnosis:${x.etapa || 'embudo'}`, evidencia: corta(x.texto, 300) }));

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
// Lo que Strategy sabe del embudo, para el pedido. Sin costos: la inversión en pauta solo viaja si quien pide ve costos (conPauta).
export function resumenTexto(viva = {}, { conPauta = false } = {}) {
  const v = plano(viva) ? viva : {}, i = plano(v.inversa) ? v.inversa : {}, m = plano(v.meta) ? v.meta : {};
  const dato = (n, x) => `${n} ${x == null ? SIN_DATOS : x}`;
  return [dato('meta', m.objetivo), dato('ticket', i.ticket), dato('cierre', i.cierre), dato('conversión', i.conversion), dato('visita', i.visita),
    dato('piezas', v.contenido?.piezas), dato('alcance por pieza', v.contenido?.alcance_pieza), conPauta ? dato('pauta al mes', v.pauta?.mensual) : '', dato('CPM', v.pauta?.cpm)].filter(Boolean).join(' · ');
}
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {};
  const cuerpo = [
    'MÉTODO',
    'Fuentes: SOLO lo que dio el cliente, su CRM o Windsor. Lo que no esté va vacío y dices de dónde saldría: nunca inventes una cifra ni la pongas en 0. No uses costos ni datos de Inherent.',
    '1) Lee el embudo de la meta hacia atrás (ticket → cierre → conversión → visita → alcance) con las cifras del contexto.',
    '2) bottlenecks: los cuellos de botella (máximo 6): cada uno con etapa (ventas, clientes, conversaciones, visitas o alcance), tipo (tasa si falta la tasa, alcance si el hueco de alcance pasa de 20%), texto (una frase) y nota (qué dato falta o de dónde sale).',
    `3) acciones: un plan de ${MIN_ACCIONES} a ${MAX_ACCIONES} acciones, cada una con titulo (un resultado), area (${AREAS_RM_INFO.map((a) => a.id).join(', ')}), fecha AAAA-MM-DD y cuello (el id del cuello que ataca). Lo que el alcance contratado no incluya va FUERA DEL ALCANCE y no entra.`,
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"comercial":{"bottlenecks":[{"id":"b1","etapa":"alcance","tipo":"alcance","texto":"…","nota":"…"}],"acciones":[{"id":"a1","titulo":"…","area":"marketing","fecha":"2026-11-30","cuello":"b1"}]}}',
    F, `${F}criterios`, '{"entregable":"Commercial Diagnosis","cumple":["…"],"falta":["… — por qué"]}', F,
  ];
  return armarPrompt({ intro: `Eres Strategy de Inherent. Arma el COMMERCIAL DIAGNOSIS de «${corta(c.cliente?.nombre, 80) || 'el cliente'}»: dónde se pierde el embudo y qué hacer en 3 a 5 acciones.`, cuerpo, salida,
    extra: [corta(c.comercial_resumen, 480) ? `Embudo del cliente: ${corta(c.comercial_resumen, 480)}` : ''].filter(Boolean) }, c);
}
// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, sin bloque o un «comercial» vacío).
export function leer(texto) {
  const j = leerBloque(texto, BLOQUE), cm = j && plano(j.comercial) ? j.comercial : null;
  if (!cm || !(Array.isArray(cm.bottlenecks) || Array.isArray(cm.acciones))) return null;
  const r = leerHerramienta(texto, BLOQUE, () => limpiar(cm));
  return r;
}

// ---------- Exportar ----------
export function aMd(contenido, viva = {}) {
  const c = limpiar(contenido), s = score(viva), e = embudo(viva);
  const L = ['# Commercial Diagnosis', '', `## Score comercial: ${s.score == null ? SIN_DATOS : `${s.score}/100`}`, '', '| Parte | Puntos | Nota |', '|---|---|---|', ...s.partes.map((p) => `| ${p.nombre} | ${p.pts}/${p.max} | ${celda(p.nota)} |`)];
  L.push('', '## Embudo', '', '| Paso | Valor | Tasa |', '|---|---|---|', ...e.pasos.map((p) => `| ${p.nombre} | ${p.valor == null ? SIN_DATOS : Math.round(p.valor)} | ${p.tasaNombre}: ${p.tasaValor == null ? SIN_DATOS : p.tasaValor} |`));
  const cu = todosLosCuellos(viva, c);
  L.push('', '## Cuellos de botella', '', ...(cu.length ? cu.map((x) => `- **${x.etapa || 'embudo'}** · ${x.texto}${x.nota ? ` (${x.nota})` : ''}`) : ['Sin cuellos con los datos de hoy.']));
  L.push('', '## Plan de acciones', '', ...(c.acciones.length ? c.acciones.map((a) => `- ${a.titulo} · ${areaInfo(a.area)?.nombre || SIN_DATOS} · ${a.fecha || SIN_DATOS}`) : [`${SIN_DATOS}: el plan todavía no tiene acciones.`]));
  return L.join('\n');
}
