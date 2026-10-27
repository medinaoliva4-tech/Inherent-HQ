// Diagnóstico de crecimiento (herramienta business-health-assessment de Consulting): la etapa de Hormozi, LA restricción, el medidor
// de capacidad vs demanda, el scorecard de las 12 palancas (Conversion, Operations y Money), el FODA y las 3 prioridades.
// Existe para que el contenido, el pedido a la IA, la lectura de su respuesta y las reglas de aprobación vivan en un solo
// módulo puro (sin DOM ni red) que comparten la vista, el servidor y las pruebas. Sin dato no hay puntaje: ⚠️ SIN DATOS, nunca 0.
import { SISTEMAS, SISTEMAS_IDS, RUTAS_HORMOZI, etapaHormozi, funcionDe, idPalanca, sinAcentos, corta, plano, entero, textos, leerHerramienta, armarPrompt, celda, SIN_DATOS } from './marcos.js';

export const BLOQUE = 'diagnostico';
export const SEMILLA = '¿Dónde se traba?';
export const CAPACIDAD = [
  { id: 'verde', nombre: 'Verde', que: 'La empresa aguanta más demanda' },
  { id: 'ambar', nombre: 'Ámbar', que: 'Aguanta un poco más, con riesgo' },
  { id: 'rojo', nombre: 'Rojo', que: 'No subir demanda todavía' },
];
const CAP_IDS = CAPACIDAD.map((c) => c.id);

const palanca = (id) => ({ palanca: id, puntaje: null, evidencia: '', fuente: '' });
// El contenido inicial: las 12 palancas con puntaje vacío (⚠️ SIN DATOS) y nada más.
export function vacio() {
  return {
    etapa: { n: null, por_que: '', cita: '', entre: null, falta: '' },
    restriccion: { funcion: '', por_que: '', cita: '' },
    capacidad: '',
    sistemas: Object.fromEntries(SISTEMAS_IDS.map((s) => [s, SISTEMAS[s].palancas.map((p) => palanca(p.id))])),
    foda: { f: [], o: [], d: [], a: [] },
    prioridades: [],
  };
}

// Solo lo conocido, con su tipo y su tamaño. Lo demás (llaves de más, id, v, _meta) se cae; el HTML queda como texto.
export function limpiar(c) {
  const o = plano(c) ? c : {}, e = plano(o.etapa) ? o.etapa : {}, r = plano(o.restriccion) ? o.restriccion : {}, f = plano(o.foda) ? o.foda : {}, s = plano(o.sistemas) ? o.sistemas : {};
  const n = entero(e.n, 0, 9);
  const par = Array.isArray(e.entre) ? e.entre.map((x) => entero(x, 0, 9)) : [];
  const entre = n === null && par.length === 2 && par.every((x) => x !== null) ? [Math.min(...par), Math.max(...par)] : null;
  const cap = sinAcentos(o.capacidad).replace(/^amarillo$/, 'ambar');
  const sistemas = {};
  for (const id of SISTEMAS_IDS) {
    const orden = SISTEMAS[id].palancas.map((p) => p.id), vistas = new Map();
    for (const x of Array.isArray(s[id]) ? s[id] : []) {
      const pid = plano(x) ? idPalanca(id, x.palanca) : '';
      if (pid && !vistas.has(pid)) vistas.set(pid, { palanca: pid, puntaje: entero(x.puntaje, 1, 5), evidencia: corta(x.evidencia, 300), fuente: corta(x.fuente, 200) });
    }
    sistemas[id] = orden.filter((pid) => vistas.has(pid)).map((pid) => vistas.get(pid));
  }
  const prioridades = (Array.isArray(o.prioridades) ? o.prioridades : []).filter(plano).map((p, i) => ({ orden: entero(p.orden, 1, 3) ?? i + 1, que: corta(p.que, 240), numero: corta(p.numero, 120) }))
    .filter((p) => p.que).sort((a, b) => a.orden - b.orden).slice(0, 3).map((p, i) => ({ ...p, orden: i + 1 }));
  return {
    etapa: { n, por_que: corta(e.por_que, 400), cita: corta(e.cita, 240), entre, falta: corta(e.falta, 240) },
    restriccion: { funcion: funcionDe(r.funcion), por_que: corta(r.por_que, 400), cita: corta(r.cita, 240) },
    capacidad: CAP_IDS.includes(cap) ? cap : '',
    sistemas,
    foda: { f: textos(f.f), o: textos(f.o), d: textos(f.d), a: textos(f.a) },
    prioridades,
  };
}

// ---------- Cálculos ----------
export const palancasDe = (c, sistema) => SISTEMAS[sistema].palancas.map((p) => ({ ...palanca(p.id), ...((c?.sistemas?.[sistema] || []).find((x) => x.palanca === p.id) || {}) }));
// El promedio de los puntajes que sí tienen dato; null si ninguno.
export function puntajeSistema(lista) {
  const v = (Array.isArray(lista) ? lista : []).map((p) => p?.puntaje).filter((x) => typeof x === 'number' && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
// Semáforo de un puntaje o promedio (1-5): rojo hasta 2.4, ámbar hasta 3.4, verde desde ahí. Sin dato, ''.
export const semaforoDe = (p) => (typeof p !== 'number' || !Number.isFinite(p) ? '' : p < 2.5 ? 'rojo' : p < 3.5 ? 'ambar' : 'verde');
export const scorecard = (c) => Object.fromEntries(SISTEMAS_IDS.map((s) => [s, puntajeSistema(palancasDe(c, s))]));
export const palancasSinDatos = (c) => SISTEMAS_IDS.flatMap((s) => palancasDe(c, s).filter((p) => p.puntaje === null).map((p) => ({ sistema: s, ...p })));
export const capacidadRoja = (c) => c?.capacidad === 'rojo';
// Demanda = pauta, anuncios, más leads, volumen, campañas o tráfico. «Pausar la pauta» o «antes de subir volumen» no la recomiendan.
const RE_DEMANDA = /\b(pauta|anuncios?|ads|mas leads|mas demanda|volumen|campanas?|trafico)\b/;
const RE_NEGADA = /\b(no|sin|antes de|evitar|pausar|frenar|detener|congelar)\b/;
export const hablaDeDemanda = (texto) => { const t = sinAcentos(texto); return RE_DEMANDA.test(t) && !RE_NEGADA.test(t); };
const sinFuente = (f) => !corta(f, 200) || /sin datos/i.test(f);

// Lo que falta para poder aprobar (cada texto es un criterio en «falta»). Lee el contenido ya limpio o crudo.
export function faltas(contenido) {
  const c = limpiar(contenido), f = [];
  const n = SISTEMAS_IDS.reduce((a, s) => a + c.sistemas[s].length, 0);
  if (n !== 12) f.push(`Hay ${n} de 12 palancas: faltan ${SISTEMAS_IDS.flatMap((s) => SISTEMAS[s].palancas.filter((p) => !c.sistemas[s].some((x) => x.palanca === p.id)).map((p) => p.nombre)).join(', ')}`);
  for (const s of SISTEMAS_IDS) for (const p of c.sistemas[s]) if (p.puntaje !== null && sinFuente(p.fuente)) f.push(`«${SISTEMAS[s].palancas.find((x) => x.id === p.palanca).nombre}» tiene puntaje sin fuente: sin fuente va ${SIN_DATOS} (puntaje vacío)`);
  if (c.etapa.n === null && !c.etapa.entre && !c.etapa.falta) f.push('La etapa no está ubicada: di cuál es, o entre qué etapas está y qué dato falta');
  if (!c.restriccion.funcion) f.push('La restricción no dice a qué función pertenece (producto, marketing, ventas, servicio, IT, reclutamiento, RR. HH. o finanzas)');
  if (!c.capacidad) f.push('Falta el medidor de capacidad vs demanda (verde, ámbar o rojo)');
  if (c.prioridades.length !== 3) f.push(`Debe haber exactamente 3 prioridades (hay ${c.prioridades.length})`);
  for (const p of c.prioridades) if (!p.numero) f.push(`La prioridad ${p.orden} no dice qué número de crecimiento mueve (ventas, margen, CAC, LTV o caja)`);
  if (capacidadRoja(c)) for (const p of c.prioridades) if (hablaDeDemanda(p.que)) f.push(`Con la capacidad en rojo no se recomienda más demanda: la prioridad ${p.orden} habla de pauta, anuncios o volumen`);
  return f;
}

// Una línea para que otras herramientas (el Árbol, el Mapa) lean el diagnóstico aprobado.
export function resumenTexto(contenido) {
  const c = limpiar(contenido), e = etapaHormozi(c.etapa.n);
  return [
    `Diagnóstico: ${e ? `etapa ${e.n} · ${e.nombre}` : c.etapa.entre ? `entre las etapas ${c.etapa.entre[0]} y ${c.etapa.entre[1]}` : 'etapa sin ubicar'}`,
    c.restriccion.funcion ? `restricción en ${c.restriccion.funcion}: ${corta(c.restriccion.por_que, 140)}` : 'restricción sin definir',
    `capacidad ${CAPACIDAD.find((x) => x.id === c.capacidad)?.nombre.toLowerCase() || 'sin medir'}`,
    c.prioridades.length ? `prioridades: ${c.prioridades.map((p) => `${p.orden}) ${corta(p.que, 90)}`).join(' ')}` : '',
  ].filter(Boolean).join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
const TRABADO = { oferta: 'la oferta', modelo: 'el modelo de dinero', leads: 'los leads', capacidad: 'la capacidad' };
export function prompt(ctx) {
  const es = plano(ctx?.estrategia) ? ctx.estrategia : {}, e = es.etapa && es.etapa.n != null ? etapaHormozi(es.etapa.n) : null;
  const lista = SISTEMAS_IDS.map((s) => `${s}: ${SISTEMAS[s].palancas.map((p) => `${p.id} (${p.nombre})`).join(', ')}`).join(' · ');
  const cuerpo = [
    'MÉTODO',
    `Lee en hormozi-brain: ${RUTAS_HORMOZI.overview} y ${e ? e.ruta : 'el stage-N de la etapa que ubiques (references/roadmap/)'}. Pregunta de partida: «${SEMILLA}»`,
    `1) ETAPA (0-9). Ubícala con las 3 preguntas de hormozi-brain: ¿cuánto factura al mes y desde cuándo?, ¿cuántas personas trabajan?, ¿dónde se traba? Cita la fila del roadmap. ${e ? `Strategy ya la ubicó en la ${e.n} (${es.etapa.confirmada ? 'confirmada por el CEO' : 'sin confirmar'}) y ${TRABADO[es.trabado] ? `marcó que se traba en ${TRABADO[es.trabado]}` : 'aún no marcó dónde se traba'}: léelo, no lo dupliques ni se lo vuelvas a preguntar a la persona; cámbialo solo si la evidencia dice otra cosa, y dilo.` : 'Strategy aún no la ubica: la ubicas tú.'} Si no calza clara, n = null, di entre qué etapas está (entre) y qué dato falta (falta).`,
    '2) RESTRICCIÓN: exactamente 1, la que hoy frena el crecimiento: función (producto, marketing, ventas, servicio, IT, reclutamiento, RR. HH. o finanzas), por qué y cita.',
    '3) CAPACIDAD vs DEMANDA: verde, ambar o rojo. En rojo no recomiendes pauta, anuncios, más leads ni más volumen: primero capacidad.',
    `4) LAS 12 PALANCAS (puntaje 1 = no existe a 5 = sólido, con evidencia y fuente; sin fuente, puntaje null = ⚠️ SIN DATOS). Growth OS no se puntúa: se lee de Strategy. ${lista}.`,
    '5) FODA corto (máximo 3 por letra).',
    '6) PRIORIDADES: 3, qué se arregla primero, segundo y tercero, cada una con el número de crecimiento que mueve (ventas, margen, CAC, LTV o caja).',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"etapa":{"n":3,"por_que":"…","cita":"[ROADMAP VIDEO | STAGE 3 | 00:12:40]","entre":null,"falta":""},"restriccion":{"funcion":"ventas","por_que":"…","cita":"…"},"capacidad":"verde|ambar|rojo","sistemas":{"conversion":[{"palanca":"respuesta","puntaje":3,"evidencia":"…","fuente":"…"}],"operations":[…],"money":[…]},"foda":{"f":["…"],"o":["…"],"d":["…"],"a":["…"]},"prioridades":[{"orden":1,"que":"…","numero":"ventas: de … a …"}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Diagnóstico de crecimiento","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Consulting de Inherent. Arma el DIAGNÓSTICO DE CRECIMIENTO de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: ¿dónde se traba y qué se arregla primero?`, cuerpo, salida }, ctx);
}

// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), e = etapaHormozi(c.etapa.n);
  const L = ['# Diagnóstico de crecimiento', '', '## Etapa', ''];
  if (e) L.push(`**Etapa ${e.n} · ${e.nombre}**${c.etapa.por_que ? ` — ${c.etapa.por_que}` : ''}${c.etapa.cita ? ` ${c.etapa.cita}` : ''}`);
  else L.push(c.etapa.entre ? `Está entre las etapas ${c.etapa.entre[0]} y ${c.etapa.entre[1]}.` : `${SIN_DATOS}: la etapa no está ubicada.`, c.etapa.falta ? `Falta: ${c.etapa.falta}` : '');
  L.push('', '## La restricción', '', c.restriccion.funcion ? `**${c.restriccion.funcion}** — ${c.restriccion.por_que || SIN_DATOS}${c.restriccion.cita ? ` ${c.restriccion.cita}` : ''}` : `${SIN_DATOS}: falta definir la restricción.`);
  const cap = CAPACIDAD.find((x) => x.id === c.capacidad);
  L.push('', '## Capacidad vs demanda', '', cap ? `**${cap.nombre}** — ${cap.que}` : `${SIN_DATOS}: falta medir la capacidad.`);
  L.push('', '## Scorecard de los 4 sistemas', '', 'Growth OS se lee de Strategy.', '');
  for (const s of SISTEMAS_IDS) {
    const lista = palancasDe(c, s), prom = puntajeSistema(lista);
    L.push(`### ${SISTEMAS[s].nombre} — ${prom === null ? SIN_DATOS : `${Math.round(prom * 10) / 10} / 5`}`, '', '| Palanca | Puntaje | Evidencia | Fuente |', '|---|---|---|---|');
    for (const p of lista) L.push(`| ${celda(SISTEMAS[s].palancas.find((x) => x.id === p.palanca).nombre)} | ${p.puntaje === null ? SIN_DATOS : p.puntaje} | ${celda(p.evidencia)} | ${celda(p.fuente)} |`);
    L.push('');
  }
  L.push('## FODA', '');
  for (const [k, nombre] of [['f', 'Fortalezas'], ['o', 'Oportunidades'], ['d', 'Debilidades'], ['a', 'Amenazas']]) L.push(`**${nombre}**`, ...(c.foda[k].length ? c.foda[k].map((x) => `- ${x}`) : [`- ${SIN_DATOS}`]), '');
  L.push('## Qué se arregla primero', '');
  L.push(...(c.prioridades.length ? c.prioridades.map((p) => `${p.orden}. ${p.que} — mueve: ${p.numero || SIN_DATOS}`) : [`${SIN_DATOS}: faltan las 3 prioridades.`]));
  return L.join('\n');
}
