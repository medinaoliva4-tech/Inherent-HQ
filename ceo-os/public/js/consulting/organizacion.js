// Equipo para la siguiente etapa (herramienta organization-architect de Consulting): el organigrama de hoy vs el que pide la siguiente
// etapa de Hormozi, lo que solo hace el fundador y lo que nunca le debería llegar, los valores como criterios de decisión, la matriz
// RACI, los perfiles de puesto y los rituales (Monday Hour One y Gametape Review). Existe para que el contenido, sus reglas, el
// diagrama, el pedido a la IA y la lectura de su respuesta vivan en un módulo puro (sin DOM ni red) que comparten la vista, el
// servidor y las pruebas. Nunca lee el equipo ni las recetas de Inherent: el equipo es el del cliente. Sin dato, ⚠️ SIN DATOS.
import { empty } from '../diagram-model.js';
import { RUTAS_HORMOZI, etapaHormozi, sinAcentos, corta, plano, entero, textos, verdadero, leerHerramienta, armarPrompt, entradaDe, celda, SIN_DATOS } from './marcos.js';
import { resumenTexto as resumenSalud } from './salud.js';
import * as P from './procesos.js';

export const BLOQUE = 'organizacion';
export const DESTINOS = [
  { id: 'queda', nombre: 'Se queda con el fundador', columna: 'Solo el fundador' },
  { id: 'delega', nombre: 'Se delega con criterio', columna: 'Nunca le debería llegar' },
  { id: 'elimina', nombre: 'Se elimina', columna: 'Nunca le debería llegar' },
];
export const LETRAS = [['R', 'Hace'], ['A', 'Responde'], ['C', 'Consulta'], ['I', 'Informa']];
// Los dos rituales de los SOPs de Acquisition.com (ceo-os/data/hormozi/sops/5-scaling-frameworks/).
export const RITUALES = [
  { id: 'monday-hour-one', nombre: 'Monday Hour One', ruta: RUTAS_HORMOZI.monday_hour_one, que: 'Una hora para bloquear la semana: mirar atrás, mirar adelante, priorizar y agendar' },
  { id: 'gametape', nombre: 'Gametape Review', ruta: RUTAS_HORMOZI.gametape, que: 'Revisar la grabación de una llamada o reunión con el equipo para mejorar' },
];
// «Estructura corporativa» no es estructura legal: son las preguntas que se le llevan al especialista (abogado o contador).
export const PREGUNTAS_ESPECIALISTA = [
  '¿Qué figura legal tiene hoy el negocio y cuál conviene al crecer?',
  '¿Cómo se contrata al equipo que sigue (planilla, servicios profesionales, comisión)?',
  '¿Qué contratos o cláusulas de confidencialidad hacen falta antes de delegar?',
  '¿Cómo se separan las finanzas del fundador de las de la empresa?',
];
const MAX = { puestos: 25, decisiones: 25, valores: 8, roles: 10, filas: 25, perfiles: 15, rituales: 6, preguntas: 12 };

const ritual0 = (r) => ({ id: r.id, nombre: r.nombre, ritmo: '', dueno: '', participan: '', para_que: '', cita: '' });
export const vacio = () => ({
  hoy: [], siguiente: { etapa: null, headcount: '', rol_fundador: '', cita: '', puestos: [] },
  decisiones: [], valores: [], raci: { roles: [], filas: [] }, perfiles: [], rituales: RITUALES.map(ritual0), estructura: [...PREGUNTAS_ESPECIALISTA],
});

// ---------- Limpiar ----------
const idDe = (v) => corta(v, 40).replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
// Una lista con id propio y único en cada fila; f(x) devuelve la fila limpia (sin id) o null.
function conIds(lista, pref, max, f) {
  const usados = new Set(), out = [];
  for (const x of (Array.isArray(lista) ? lista : []).slice(0, max)) {
    if (!plano(x)) continue;
    const fila = f(x); if (!fila) continue;
    let id = idDe(x.id) || `${pref}${out.length + 1}`, k = 2; const base = id;
    while (usados.has(id)) id = `${base}-${k++}`;
    usados.add(id); out.push({ id, ...fila });
  }
  return out;
}
function limpiarPuestos(lista, pref) {
  const ps = conIds(lista, pref, MAX.puestos, (x) => { const rol = corta(x.rol, 60); return rol ? { rol, reporta: idDe(x.reporta), fundador: verdadero(x.fundador) } : null; });
  const ids = new Set(ps.map((p) => p.id));
  for (const p of ps) if (p.reporta === p.id || !ids.has(p.reporta)) p.reporta = '';
  const by = new Map(ps.map((p) => [p.id, p]));
  for (const p of ps) { // un ciclo de jefes no es un organigrama: se corta en el puesto que lo cierra
    const vistos = new Set([p.id]); let x = by.get(p.reporta);
    while (x) { if (vistos.has(x.id)) { p.reporta = ''; break; } vistos.add(x.id); x = by.get(x.reporta); }
  }
  return ps;
}
const destinoDe = (v) => { const s = sinAcentos(v); return s.includes('elimin') ? 'elimina' : s.includes('deleg') ? 'delega' : s.includes('queda') || s.includes('fundador') ? 'queda' : ''; };

// Solo lo conocido, con su tipo y su tamaño. Lo demás (llaves de más, id, v, _meta de arriba) se cae; el HTML queda como texto.
export function limpiar(c) {
  const o = plano(c) ? c : {}, s = plano(o.siguiente) ? o.siguiente : {}, r = plano(o.raci) ? o.raci : {};
  const roles = conIds(r.roles, 'r', MAX.roles, (x) => { const nombre = corta(x.nombre ?? x.rol, 60); return nombre ? { nombre } : null; });
  const filas = conIds(r.filas, 'f', MAX.filas, (x) => {
    const actividad = corta(x.actividad, 120); if (!actividad) return null;
    const src = plano(x.celdas) ? x.celdas : {}, celdas = {};
    for (const rol of roles) { const l = String(src[rol.id] ?? '').trim().toUpperCase(); if (LETRAS.some(([k]) => k === l)) celdas[rol.id] = l; }
    return { actividad, celdas };
  });
  const rituales = conIds(o.rituales, 'ri', MAX.rituales, (x) => { const nombre = corta(x.nombre, 80); return nombre ? { nombre, ritmo: corta(x.ritmo, 80), dueno: corta(x.dueno, 60), participan: corta(x.participan, 120), para_que: corta(x.para_que, 240), cita: corta(x.cita, 200) } : null; });
  return {
    hoy: limpiarPuestos(o.hoy, 'h'),
    siguiente: { etapa: entero(s.etapa, 0, 9), headcount: corta(s.headcount, 240), rol_fundador: corta(s.rol_fundador, 240), cita: corta(s.cita, 240), puestos: limpiarPuestos(s.puestos, 's') },
    decisiones: conIds(o.decisiones, 'd', MAX.decisiones, (x) => { const texto = corta(x.texto ?? x.decision, 200); return texto ? { texto, destino: destinoDe(x.destino), criterio: corta(x.criterio, 300), rol: corta(x.rol, 60) } : null; }),
    valores: conIds(o.valores, 'v', MAX.valores, (x) => { const valor = corta(x.valor, 80); return valor ? { valor, criterio: corta(x.criterio, 300) } : null; }),
    raci: { roles, filas },
    perfiles: conIds(o.perfiles, 'pf', MAX.perfiles, (x) => { const rol = corta(x.rol, 60); return rol ? { rol, mision: corta(x.mision, 300), responde_por: textos(x.responde_por, 8, 160), decide: textos(x.decide, 8, 160), escala: textos(x.escala, 8, 160), mide: textos(x.mide, 6, 160) } : null; }),
    rituales,
    estructura: textos(o.estructura, MAX.preguntas, 240),
  };
}

// ---------- Cálculos ----------
export const conteoA = (fila) => Object.values(fila?.celdas || {}).filter((l) => l === 'A').length;
export const filasSinUnaA = (c) => (c?.raci?.filas || []).filter((f) => conteoA(f) !== 1);
// Las dos columnas: lo que solo hace el fundador y lo que nunca le debería llegar (delegado o eliminado); sinDestino = aún sin decidir.
export function columnas(c) {
  const d = Array.isArray(c?.decisiones) ? c.decisiones : [];
  return { fundador: d.filter((x) => x.destino === 'queda'), nuncaLlega: d.filter((x) => x.destino === 'delega' || x.destino === 'elimina'), sinDestino: d.filter((x) => !x.destino) };
}
const clave = (s) => sinAcentos(s).replace(/\s+/g, ' ');
// Los puestos de la siguiente etapa que no tienen perfil escrito (por rol; el del fundador no lleva perfil de puesto).
export const puestosSinPerfil = (c) => {
  const con = new Set((c?.perfiles || []).map((p) => clave(p.rol)));
  return (c?.siguiente?.puestos || []).filter((p) => !p.fundador && !con.has(clave(p.rol)));
};
export const ritualDe = (c, id) => (c?.rituales || []).find((r) => r.id === id) || null;

// ---------- Organigrama (diagram-model.js: el mismo estilo de TEMPLATES.org, de arriba hacia abajo) ----------
const W = 168, H = 56, GX = 32, GY = 56;
const colorDe = (p) => (p.fundador ? 'tierra' : 'arena');
export function aDiagrama(puestos) {
  const ps = Array.isArray(puestos) ? puestos : [], by = new Map(ps.map((p) => [p.id, p])), niveles = [];
  const prof = (p) => { let d = 0; const vistos = new Set([p.id]); let x = by.get(p.reporta); while (x && !vistos.has(x.id)) { vistos.add(x.id); d++; x = by.get(x.reporta); } return d; };
  for (const p of ps) (niveles[prof(p)] ||= []).push(p);
  const d = empty('TD');
  niveles.forEach((fila, y) => (fila || []).forEach((p, i) => d.nodes.push({ id: p.id, type: 'rect', x: i * (W + GX), y: y * (H + GY), w: W, h: H, text: p.rol, fill: colorDe(p) })));
  for (const p of ps) if (by.has(p.reporta)) d.edges.push({ id: `e-${p.id}`, from: p.reporta, to: p.id, label: '', style: '', head: true, fromPort: '', toPort: '' });
  return d;
}

// ---------- Aprobar ----------
// Lo que falta para poder aprobar. extra = { pasosFundador: [nombres] } de los pasos del Mapa que dependen del fundador.
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), f = [], s = c.siguiente;
  if (!c.hoy.length) f.push('Falta el organigrama de hoy: no tiene puestos');
  if (!s.puestos.length) f.push('Falta el organigrama de la siguiente etapa: no tiene puestos');
  if (!s.headcount || !s.cita) f.push('El headcount y el rol del fundador de la siguiente etapa necesitan su cita del roadmap de Hormozi');
  const pasos = Array.isArray(extra?.pasosFundador) ? extra.pasosFundador : [];
  if (!c.decisiones.length) f.push(pasos.length ? `El Mapa marca ${pasos.length} ${pasos.length === 1 ? 'paso que depende' : 'pasos que dependen'} del fundador: cada decisión suya necesita destino` : 'Faltan las decisiones que hoy toma el fundador, cada una con su destino');
  for (const d of c.decisiones) {
    const n = corta(d.texto, 80);
    if (!d.destino) f.push(`La decisión «${n}» no tiene destino: se queda, se delega con criterio o se elimina`);
    else if (d.destino === 'delega' && (!d.criterio || !d.rol)) f.push(`La decisión «${n}» se delega sin ${!d.criterio ? 'criterio (cómo decide el equipo sin preguntar)' : 'rol que la toma'}`);
    else if (d.destino === 'elimina' && !d.criterio) f.push(`La decisión «${n}» se elimina sin decir por qué`);
  }
  if (!c.valores.length) f.push('Faltan los valores escritos como criterios de decisión');
  for (const v of c.valores) if (!v.criterio) f.push(`El valor «${v.valor}» no es un criterio: di cómo decide el equipo con él, sin preguntar`);
  if (!c.raci.filas.length) f.push('Falta la matriz RACI: no tiene filas');
  for (const r of filasSinUnaA(c)) { const a = conteoA(r); f.push(`La fila «${corta(r.actividad, 80)}» de la RACI tiene ${a === 0 ? 'ninguna A' : `${a} A`}: debe tener exactamente una`); }
  for (const p of puestosSinPerfil(c)) f.push(`El puesto «${p.rol}» de la siguiente etapa no tiene perfil`);
  for (const p of c.perfiles) if (!p.mision || !p.responde_por.length) f.push(`El perfil «${p.rol}» necesita misión y de qué responde`);
  for (const r of RITUALES) { const x = ritualDe(c, r.id); if (!x || !x.ritmo || !x.dueno) f.push(`El ritual ${r.nombre} necesita ritmo y dueño (un rol)`); }
  if (!c.estructura.length) f.push('Faltan las preguntas de estructura corporativa para el especialista');
  return f;
}

// Una línea para que el Plan de 90 días y el resumen lean el equipo aprobado.
export function resumenTexto(contenido) {
  const c = limpiar(contenido), e = etapaHormozi(c.siguiente.etapa), col = columnas(c);
  return [
    `Equipo: ${e ? `siguiente etapa ${e.n} · ${e.nombre}` : 'siguiente etapa sin ubicar'}`, `${c.hoy.length} puestos hoy, ${c.siguiente.puestos.length} en la siguiente`,
    `${col.fundador.length} decisiones se quedan con el fundador y ${col.nuncaLlega.length} no le deberían llegar`, `${c.raci.filas.length} filas RACI`,
  ].join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const es = plano(ctx?.estrategia) ? ctx.estrategia : {}, n = es.etapa && es.etapa.n != null ? Number(es.etapa.n) : null;
  const e = n !== null ? etapaHormozi(n) : null, sig = n !== null && n < 9 ? etapaHormozi(n + 1) : null;
  const dx = entradaDe(ctx, 'business-health-assessment'), pm = entradaDe(ctx, 'process-mapper');
  const pasos = pm ? P.pasosFundador(P.limpiar(pm.contenido), 'hoy').map((p) => `${corta(p.nombre, 60)} (${corta(p.rol, 40) || 'sin rol'})`) : [];
  const extra = [
    dx ? `Entrada aprobada · ${resumenSalud(dx.contenido)}` : `Entrada: ${SIN_DATOS}: el Diagnóstico aún no está aprobado`,
    pm ? (pasos.length ? `Entrada aprobada · pasos del Mapa que dependen del fundador: ${pasos.slice(0, 8).join('; ')}` : 'Entrada aprobada · el Mapa no marca pasos que dependan del fundador') : `Entrada: ${SIN_DATOS}: el Mapa del camino del dinero aún no está aprobado`,
  ];
  const cuerpo = [
    'MÉTODO',
    `Lee en la biblioteca de Hormozi: ${e ? e.ruta : RUTAS_HORMOZI.overview}${sig ? `, la etapa siguiente ${sig.ruta}` : ''}, ${RUTAS_HORMOZI.monday_hour_one} y ${RUTAS_HORMOZI.gametape}.`,
    '1) ORGANIGRAMA: «hoy» y «siguiente» (etapa 0-9, headcount y rol del fundador con cita del roadmap, y sus puestos). Puesto: id, rol (nunca una persona), reporta (id de su jefe, vacío el primero), fundador (true en el del fundador).',
    '2) DECISIONES que hoy toma el fundador: cada una con destino queda | delega | elimina. Delega lleva criterio (cómo decide el equipo sin preguntar) y rol; elimina lleva por qué. Las que se quedan son «Solo el fundador»; las otras, «Nunca le debería llegar».',
    '3) VALORES como criterios de decisión: valor + criterio («cuando pase X, se decide Y»), 3 a 5.',
    '4) RACI: roles y filas de actividad con celdas R|A|C|I por rol. Cada fila exactamente UNA A.',
    '5) PERFILES de cada puesto de la siguiente etapa (menos el del fundador): misión, responde_por, decide, escala, mide.',
    '6) RITUALES: monday-hour-one y gametape con ritmo, dueño (rol), participan, para_que y cita [5 SCALING FRAMEWORKS SOPS | … | pág. PDF N].',
    '7) ESTRUCTURA CORPORATIVA: solo preguntas para el especialista (abogado, contador). No propongas estructura legal ni fiscal.',
    'No leas el equipo ni las recetas de Inherent: el equipo es el del cliente. Lo que no sepas va ⚠️ SIN DATOS, y lo que el material recomiende y la ficha no incluya, FUERA DEL ALCANCE.',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"hoy":[{"id":"h1","rol":"Fundador","reporta":"","fundador":true}],"siguiente":{"etapa":4,"headcount":"…","rol_fundador":"…","cita":"[ROADMAP VIDEO | STAGE 4 | 00:10:00]","puestos":[…]},"decisiones":[{"texto":"…","destino":"delega","criterio":"…","rol":"…"}],"valores":[{"valor":"…","criterio":"…"}],"raci":{"roles":[{"id":"r1","nombre":"…"}],"filas":[{"actividad":"…","celdas":{"r1":"A"}}]},"perfiles":[{"rol":"…","mision":"…","responde_por":["…"],"decide":["…"],"escala":["…"],"mide":["…"]}],"rituales":[{"id":"monday-hour-one","nombre":"Monday Hour One","ritmo":"…","dueno":"…","participan":"…","para_que":"…","cita":"…"}],"estructura":["¿…?"]}',
    F,
    `${F}criterios`,
    '{"entregable":"Equipo para la siguiente etapa","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Consulting de Inherent. Arma el EQUIPO PARA LA SIGUIENTE ETAPA de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: quién hace qué cuando el fundador deja de hacerlo todo.`, cuerpo, salida, extra }, ctx);
}

// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), s = c.siguiente, e = etapaHormozi(s.etapa), col = columnas(c), L = ['# Equipo para la siguiente etapa'];
  const puestos = (titulo, ps) => { L.push('', `### ${titulo}`, ''); L.push(...(ps.length ? ps.map((p) => `- ${p.rol}${p.fundador ? ' (fundador)' : ''}${ps.find((x) => x.id === p.reporta) ? ` → reporta a ${ps.find((x) => x.id === p.reporta).rol}` : ''}`) : [`${SIN_DATOS}: sin puestos.`])); };
  L.push('', '## Organigrama');
  puestos('Hoy', c.hoy);
  puestos(e ? `Siguiente etapa: ${e.n} · ${e.nombre}` : 'Siguiente etapa', s.puestos);
  L.push('', `**Headcount:** ${s.headcount || SIN_DATOS}`, `**Rol del fundador:** ${s.rol_fundador || SIN_DATOS}`, `**Cita:** ${s.cita || SIN_DATOS}`);
  L.push('', '## Decisiones del fundador', '', '### Solo el fundador', ...(col.fundador.length ? col.fundador.map((d) => `- ${d.texto}`) : ['- —']));
  L.push('', '### Nunca le debería llegar', ...(col.nuncaLlega.length ? col.nuncaLlega.map((d) => `- ${d.texto} — ${d.destino === 'elimina' ? 'se elimina' : `lo decide ${d.rol || SIN_DATOS}`}${d.criterio ? `. Criterio: ${d.criterio}` : ''}`) : ['- —']));
  if (col.sinDestino.length) L.push('', `### Sin destino (${SIN_DATOS})`, ...col.sinDestino.map((d) => `- ${d.texto}`));
  L.push('', '## Valores como criterios de decisión', '', ...(c.valores.length ? c.valores.map((v) => `- **${v.valor}:** ${v.criterio || SIN_DATOS}`) : [`${SIN_DATOS}: faltan los valores.`]));
  L.push('', '## Matriz RACI', '');
  if (c.raci.filas.length && c.raci.roles.length) {
    L.push(`| Actividad | ${c.raci.roles.map((r) => celda(r.nombre)).join(' | ')} |`, `|---|${c.raci.roles.map(() => '---').join('|')}|`);
    for (const r of c.raci.filas) L.push(`| ${celda(r.actividad)} | ${c.raci.roles.map((x) => r.celdas[x.id] || '').join(' | ')} |`);
  } else L.push(`${SIN_DATOS}: falta la matriz.`);
  L.push('', '## Perfiles de puesto');
  if (!c.perfiles.length) L.push('', `${SIN_DATOS}: faltan los perfiles.`);
  for (const p of c.perfiles) L.push('', `### ${p.rol}`, '', p.mision || SIN_DATOS, '', `- Responde por: ${p.responde_por.join('; ') || SIN_DATOS}`, `- Decide: ${p.decide.join('; ') || '—'}`, `- Escala: ${p.escala.join('; ') || '—'}`, `- Se mide por: ${p.mide.join('; ') || '—'}`);
  L.push('', '## Rituales');
  for (const r of c.rituales) L.push('', `### ${r.nombre}`, '', `- Ritmo: ${r.ritmo || SIN_DATOS}`, `- Dueño: ${r.dueno || SIN_DATOS}`, `- Participan: ${r.participan || '—'}`, `- Para qué: ${r.para_que || '—'}`, `- Cita: ${r.cita || '—'}`);
  L.push('', '## Estructura corporativa: preguntas para el especialista', '', ...(c.estructura.length ? c.estructura.map((x, i) => `${i + 1}. ${x}`) : [`${SIN_DATOS}: faltan las preguntas.`]));
  return L.join('\n');
}
