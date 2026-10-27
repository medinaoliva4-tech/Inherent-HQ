// Automation Opportunity Finder (herramienta de Consulting): una matriz impacto en ventas × esfuerzo sobre los pasos manuales del
// Mapa del camino del dinero aprobado. Va primero lo que pierde leads o ventas (respuesta, seguimiento, cobro). Las horas las dice el
// cliente o salen ⚠️ SIN DATOS (nunca se calculan de los minutos de un paso). Cada fila elegida se manda al Plan de 90 días.
// Existe para que las filas, el orden, el cuadrante, el pedido a la IA y su lectura vivan en un módulo puro (sin DOM ni red).
import { etapaHormozi, sinAcentos, corta, plano, entero, numeroONull, verdadero, leerHerramienta, armarPrompt, entradaDe, celda, SIN_DATOS } from './marcos.js';
import * as P from './procesos.js';

export const BLOQUE = 'automatizacion';
// Qué pierde el negocio mientras el paso se hace a mano. Los 3 primeros son lo que va antes.
export const PIERDE = [
  { id: 'leads', nombre: 'Leads' }, { id: 'ventas', nombre: 'Ventas' }, { id: 'cobro', nombre: 'Cobro' },
  { id: 'tiempo', nombre: 'Solo tiempo del equipo' },
];
const PIERDE_VENTA = ['leads', 'ventas', 'cobro'];
export const CUADRANTES = [
  { id: 'ya', nombre: 'Primero', que: 'mucho impacto, poco esfuerzo' },
  { id: 'planear', nombre: 'Planear', que: 'mucho impacto, más esfuerzo' },
  { id: 'rapido', nombre: 'Cuando haya espacio', que: 'poco impacto, poco esfuerzo' },
  { id: 'despues', nombre: 'Después', que: 'poco impacto, más esfuerzo' },
];
const MAX_FILAS = 30;

export const vacio = () => ({ filas: [] });

// ---------- Limpiar ----------
const idDe = (v) => corta(v, 40).replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
const pierdeDe = (v) => { const s = sinAcentos(v); return PIERDE.find((x) => s.startsWith(x.id) || s === sinAcentos(x.nombre))?.id || (s.startsWith('solo') ? 'tiempo' : ''); };
// Solo lo conocido, con su tipo y su tamaño. Lo demás se cae; el HTML queda como texto.
export function limpiar(c) {
  const o = plano(c) ? c : {}, usados = new Set(), filas = [];
  for (const x of (Array.isArray(o.filas) ? o.filas : []).slice(0, MAX_FILAS)) {
    if (!plano(x)) continue;
    const paso = corta(x.paso ?? x.nombre, 120); if (!paso) continue;
    let id = idDe(x.id) || `a${filas.length + 1}`, k = 2; const base = id;
    while (usados.has(id)) id = `${base}-${k++}`;
    usados.add(id);
    filas.push({ id, paso, etapa: P.ETAPAS_CAMINO.find((e) => e.id === sinAcentos(x.etapa))?.id || '', rol: corta(x.rol, 60), perdida: numeroONull(x.perdida, { min: 0, max: 100 }),
      pierde: pierdeDe(x.pierde), impacto: entero(x.impacto, 1, 5), esfuerzo: entero(x.esfuerzo, 1, 5), horas_mes: numeroONull(x.horas_mes, { min: 0, max: 100000 }), fuente_horas: corta(x.fuente_horas, 200),
      que: corta(x.que, 300), herramienta: corta(x.herramienta, 120), elegida: verdadero(x.elegida) });
  }
  return { filas };
}

// ---------- Cálculos ----------
// El cuadrante de una fila: impacto alto es 4 o 5; esfuerzo bajo es 1 o 2. Sin impacto o sin esfuerzo no hay cuadrante (null, no «Después»).
export function cuadranteDe(f) {
  if (!Number.isInteger(f?.impacto) || !Number.isInteger(f?.esfuerzo)) return null;
  const alto = f.impacto >= 4, poco = f.esfuerzo <= 2;
  return alto && poco ? 'ya' : alto ? 'planear' : poco ? 'rapido' : 'despues';
}
export const pierdeVentas = (f) => PIERDE_VENTA.includes(f?.pierde);
const RANGO_C = { ya: 0, planear: 1, rapido: 2, despues: 3 };
// Primero lo que pierde leads o ventas; dentro, por cuadrante, más impacto, menos esfuerzo y mayor % que se pierde. Sin evaluar, al final.
export function ordenar(filas) {
  const lista = (Array.isArray(filas) ? filas : []).map((f, i) => ({ f, i }));
  const rank = ({ f }) => [pierdeVentas(f) ? 0 : 1, RANGO_C[cuadranteDe(f)] ?? 9, -(f.impacto ?? 0), f.esfuerzo ?? 9, -(f.perdida ?? -1)];
  lista.sort((a, b) => { const x = rank(a), y = rank(b); for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) return x[k] - y[k]; return a.i - b.i; });
  return lista.map(({ f }, n) => ({ ...f, prioridad: n + 1 }));
}
export const porCuadrante = (c) => {
  const out = { ya: [], planear: [], rapido: [], despues: [], sinEvaluar: [] };
  for (const f of ordenar(c?.filas)) (out[cuadranteDe(f)] || out.sinEvaluar).push(f);
  return out;
};
export const elegidas = (c) => ordenar(c?.filas).filter((f) => f.elegida);
// Horas al mes de lo elegido: la suma de las que sí tienen dato (null si ninguna) y cuántas filas no la traen.
export function horasElegidas(c) {
  const e = elegidas(c), con = e.filter((f) => typeof f.horas_mes === 'number');
  return { horas: con.length ? con.reduce((a, f) => a + f.horas_mes, 0) : null, sinDato: e.length - con.length };
}
// El sistema del Plan de 90 días al que pertenece la fila: la entrega es Operations, el cobro es Money, lo demás Conversion.
export const sistemaDe = (f) => (f?.pierde === 'cobro' ? 'money' : f?.etapa === 'entrega' ? 'operations' : 'conversion');
// Lo que viaja al Plan de 90 días: cada fila elegida, ya ordenada.
export const paraPlan = (c) => elegidas(c).map((f) => ({ id: f.id, paso: f.paso, que: f.que, sistema: sistemaDe(f), rol: f.rol, pierde: f.pierde, impacto: f.impacto, esfuerzo: f.esfuerzo, horas_mes: f.horas_mes }));

// Las filas semilla: los pasos manuales de hoy del Mapa aprobado. No inventa nada: impacto y esfuerzo quedan vacíos.
export function desdeProcesos(procesos, yaEstan = []) {
  const hay = new Set((Array.isArray(yaEstan) ? yaEstan : []).map((f) => f.id));
  return P.pasosManuales(P.limpiar(procesos), 'hoy').filter((p) => !hay.has(p.id)).map((p) => ({
    id: p.id, paso: p.nombre, etapa: p.etapa, rol: p.rol, perdida: p.perdida,
    pierde: typeof p.perdida === 'number' && p.perdida > 0 ? (p.etapa === 'venta' ? 'ventas' : p.etapa === 'lead' || p.etapa === 'contacto' ? 'leads' : '') : '',
    impacto: null, esfuerzo: null, horas_mes: null, fuente_horas: '', que: '', herramienta: '', elegida: false,
  }));
}

// Avisos que no bloquean: se eligió algo que no pierde ventas y quedó sin elegir algo que sí.
export function avisos(contenido) {
  const c = limpiar(contenido), a = [];
  const dejadas = c.filas.filter((f) => pierdeVentas(f) && !f.elegida);
  for (const f of c.filas) if (f.elegida && !pierdeVentas(f) && dejadas.length) a.push(`«${corta(f.paso, 60)}» no pierde leads ni ventas y quedó sin elegir «${corta(dejadas[0].paso, 60)}», que sí`);
  return a;
}

// ---------- Aprobar ----------
export function faltas(contenido) {
  const c = limpiar(contenido), f = [];
  if (!c.filas.length) return ['No hay pasos manuales: salen del Mapa del camino del dinero aprobado'];
  for (const x of c.filas) {
    const n = corta(x.paso, 80);
    if (x.impacto === null || x.esfuerzo === null) f.push(`«${n}» no tiene ${x.impacto === null && x.esfuerzo === null ? 'impacto ni esfuerzo' : x.impacto === null ? 'impacto' : 'esfuerzo'}`);
    if (typeof x.horas_mes === 'number' && (!x.fuente_horas || /sin datos/i.test(x.fuente_horas))) f.push(`«${n}» trae horas sin fuente: sin la cifra del cliente van ${SIN_DATOS}`);
    if (x.elegida && !x.que) f.push(`«${n}» está elegida pero no dice qué se automatiza`);
  }
  if (!c.filas.some((x) => x.elegida)) f.push('Elige al menos una fila para mandarla al Plan de 90 días');
  return f;
}

export function resumenTexto(contenido) {
  const c = limpiar(contenido), e = elegidas(c), h = horasElegidas(c);
  return `Automatización: ${c.filas.length} pasos manuales · ${e.length} elegidos${e.length ? ` (${e.slice(0, 3).map((f) => corta(f.paso, 50)).join(', ')})` : ''} · horas al mes: ${h.horas === null ? SIN_DATOS : h.horas}`;
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const es = plano(ctx?.estrategia) ? ctx.estrategia : {}, e = es.etapa && es.etapa.n != null ? etapaHormozi(es.etapa.n) : null;
  const pm = entradaDe(ctx, 'process-mapper'), pasos = pm ? desdeProcesos(pm.contenido) : [];
  const lineas = []; let linea = '';
  for (const p of pasos.slice(0, 20)) { const t = `${p.id}: ${corta(p.paso, 50)} [${p.etapa || 'sin etapa'}, ${corta(p.rol, 30) || 'sin rol'}${p.perdida === null ? '' : `, se pierde ${p.perdida}%`}]`; if ((linea + t).length > 440) { lineas.push(linea); linea = ''; } linea += `${linea ? '; ' : ''}${t}`; }
  if (linea) lineas.push(linea);
  const extra = pm ? (lineas.length ? lineas.map((l, i) => `${i ? '' : 'Entrada aprobada · pasos manuales de hoy del Mapa: '}${l}`) : ['Entrada aprobada · el Mapa no tiene pasos manuales de hoy']) : [`Entrada: ${SIN_DATOS}: el Mapa del camino del dinero aún no está aprobado; no inventes pasos (filas vacías)`];
  const cuerpo = [
    'MÉTODO',
    `Lee en hormozi-brain: ${e ? e.ruta : 'references/roadmap/overview-las-10-etapas.md'}. La tabla es sobre los pasos manuales del Mapa: no agregues pasos que no estén ahí.`,
    `POR FILA (id = el del paso): impacto en ventas 1-5 y esfuerzo 1-5 (con base en el dato; sin base, null), pierde (${PIERDE.map((x) => x.id).join('|')}: qué pierde el negocio mientras se hace a mano), que (qué se automatiza, en una frase), herramienta (tipo, no marca inventada), horas_mes y fuente_horas.`,
    'Va primero lo que pierde leads o ventas: velocidad de respuesta y seguimiento (Conversion OS 1-2), luego el cobro. Elegida = true solo en las 3 a 5 mejores.',
    'HORAS: las dice el cliente. Sin su cifra, horas_mes = null (⚠️ SIN DATOS); nunca las calcules de los minutos de un paso. Una cifra del cliente lleva su fuente, o [dice el cliente, sin verificar].',
    'No gastes dinero ni crees automatizaciones: es una lista para decidir. Lo que la ficha no incluya va FUERA DEL ALCANCE.',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"filas":[{"id":"h1","paso":"Responde el WhatsApp","etapa":"contacto","rol":"Ventas","perdida":30,"pierde":"leads","impacto":5,"esfuerzo":2,"horas_mes":null,"fuente_horas":"","que":"Respuesta automática en menos de 5 minutos","herramienta":"WhatsApp Business","elegida":true}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Automation Opportunity Finder","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Consulting de Inherent. Arma el ORDEN DE LO QUE SE AUTOMATIZA de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: qué paso manual le cuesta más ventas y es más fácil de resolver.`, cuerpo, salida, extra }, ctx);
}

export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), L = ['# Automation Opportunity Finder'], q = porCuadrante(c);
  L.push('', '## Matriz impacto en ventas × esfuerzo', '');
  if (!c.filas.length) L.push(`${SIN_DATOS}: no hay pasos manuales; salen del Mapa del camino del dinero aprobado.`);
  for (const x of CUADRANTES) L.push(`- **${x.nombre}** (${x.que}): ${q[x.id].length ? q[x.id].map((f) => corta(f.paso, 60)).join(', ') : '—'}`);
  if (q.sinEvaluar.length) L.push(`- **Sin evaluar** (${SIN_DATOS}): ${q.sinEvaluar.map((f) => corta(f.paso, 60)).join(', ')}`);
  L.push('', '## Orden', '');
  if (c.filas.length) {
    L.push('| # | Paso | Pierde | Impacto | Esfuerzo | Horas al mes | Qué se automatiza | Elegida |', '|---|---|---|---|---|---|---|---|');
    for (const f of ordenar(c.filas)) L.push(`| ${f.prioridad} | ${celda(f.paso)} | ${PIERDE.find((x) => x.id === f.pierde)?.nombre || SIN_DATOS} | ${f.impacto ?? SIN_DATOS} | ${f.esfuerzo ?? SIN_DATOS} | ${f.horas_mes === null ? SIN_DATOS : f.horas_mes} | ${celda(f.que)} | ${f.elegida ? 'sí' : 'no'} |`);
  }
  const plan = paraPlan(c);
  L.push('', '## Va al Plan de 90 días', '', ...(plan.length ? plan.map((f) => `- ${f.paso}: ${f.que || SIN_DATOS} (${f.sistema})`) : ['- Nada elegido todavía.']));
  return L.join('\n');
}
