// Business X-Ray (herramienta business-xray de Strategy): la foto de salud del negocio en 6 ejes (Oferta, Modelo de dinero, Leads/demanda,
// Conversión, Capacidad, Marca/atención), cada uno ok, riesgo o falta con su evidencia y su fuente, la conclusión en una línea y dónde
// está trabado. Se refleja en la estrategia en vivo (viva.contexto y viva.analisis) con aViva(). Módulo puro (sin DOM ni red): lo
// comparten la vista, el servidor y las pruebas. Sin evidencia el eje no es ok ni riesgo: es «falta» y dice ⚠️ SIN DATOS y de dónde sale.
import { ETAPAS } from '../estrategia.js';
import { plano, corta, entero, sinAcentos, verdadero, SIN_DATOS, armarPrompt, leerBloque, leerHerramienta, celda, RUTAS_HORMOZI, etapaHormozi } from '../consulting/marcos.js';

export const BLOQUE = 'xray';
// sale_de = de dónde sale el dato (para decir «⚠️ SIN DATOS: sale de …»). Nada de costos ni de datos de Inherent.
const E = (id, nombre, mide, sale_de) => ({ id, nombre, mide, sale_de });
const saleDe = (x) => (/^el\s/i.test(x) ? `sale del ${String(x).slice(3)}` : `sale de ${x}`); // «el CRM» → «sale del CRM»
export const EJES = [
  E('oferta', 'Oferta', 'si lo que vende está claro, tiene precio y alguien lo quiere', 'la ficha de oferta, la lista de precios del cliente y su comprensión (Intel)'),
  E('modelo', 'Modelo de dinero', 'cómo gana dinero con cada cliente y cuánto le deja', 'las ventas, el ticket y la recompra que comparte el cliente'),
  E('leads', 'Leads/demanda', 'de dónde llegan los prospectos y si llegan con constancia', 'el CRM o la libreta de leads del cliente, su analítica y la Investigación'),
  E('conversion', 'Conversión', 'cuántos prospectos compran y cuánto tardan', 'el CRM o la libreta de leads del cliente y su historial de ventas'),
  E('capacidad', 'Capacidad', 'si la empresa aguanta más demanda sin romperse', 'la entrevista con el cliente y su equipo, y su comprensión (Intel)'),
  E('marca', 'Marca/atención', 'cómo la perciben y cuánta atención recibe', 'sus redes, su guía de marca y la Investigación'),
];
export const EJES_IDS = EJES.map((e) => e.id);
export const ejeDe = (id) => EJES.find((e) => e.id === id) || null;
export const ESTADOS_EJE = [{ id: 'ok', nombre: 'Bien' }, { id: 'riesgo', nombre: 'Riesgo' }, { id: 'falta', nombre: 'Sin datos' }];
// Dónde puede estar trabado el negocio (Hormozi): los mismos cuatro que acepta limpiarParche en analisis.trabado.
export const TRABADO = [{ id: 'oferta', nombre: 'La oferta' }, { id: 'modelo', nombre: 'El modelo de dinero' }, { id: 'leads', nombre: 'Los leads' }, { id: 'capacidad', nombre: 'La capacidad' }];
const TRABADO_IDS = TRABADO.map((t) => t.id);

// El eje, venga el id o el nombre («Leads/demanda», «Marca/atención», «Modelo de dinero»); '' si no es ninguno.
const ALIAS_EJE = { demanda: 'leads', 'leads demanda': 'leads', 'leads/demanda': 'leads', 'modelo de dinero': 'modelo', 'marca/atencion': 'marca', atencion: 'marca', 'marca atencion': 'marca' };
export function idEje(v) {
  const k = sinAcentos(v);
  return EJES.find((e) => e.id === k || sinAcentos(e.nombre) === k)?.id || ALIAS_EJE[k] || '';
}
const OK = ['ok', 'bien', 'sano', 'saludable', 'verde'], RIESGO = ['riesgo', 'en riesgo', 'ambar', 'amarillo', 'rojo', 'alerta', 'mal'];
// ok, riesgo o falta. Lo que no se entiende es «falta»: sin dato no se asume que está bien.
export function estadoDe(v) { const s = sinAcentos(v); return OK.includes(s) ? 'ok' : RIESGO.includes(s) ? 'riesgo' : 'falta'; }
const trabadoDe = (v) => { const s = sinAcentos(v); return TRABADO_IDS.find((id) => id === s) || (s === 'modelo de dinero' ? 'modelo' : s === 'demanda' ? 'leads' : ''); };
const sinEvidencia = (e) => !corta(e, 300) || /^(⚠️\s*)?sin datos\b/i.test(corta(e, 300));

const eje = (id) => ({ eje: id, estado: 'falta', evidencia: '', fuente: '' });
// El contenido inicial: los 6 ejes en «falta» (⚠️ SIN DATOS), sin conclusión ni «trabado».
export function vacio() { return { salud: EJES_IDS.map(eje), conclusion: '', trabado: '', porque: '', etapa_ref: null }; }

// Solo lo conocido, con su tipo y su tamaño. Los ejes salen en el orden de EJES y sin repetirse (el primero gana); los que no llegan no
// se inventan (faltas() lo dice). Lo demás (id, v, _meta, llaves raras) se cae; el HTML queda como texto.
export function limpiar(contenido) {
  const o = plano(contenido) ? contenido : {}, vistos = new Map();
  for (const x of Array.isArray(o.salud) ? o.salud : []) {
    const id = plano(x) ? idEje(x.eje) : '';
    if (id && !vistos.has(id)) vistos.set(id, { eje: id, estado: estadoDe(x.estado), evidencia: corta(x.evidencia, 300), fuente: corta(x.fuente, 200) });
  }
  const r = plano(o.etapa_ref) ? o.etapa_ref : null, n = r ? entero(r.n, 0, 9) : null;
  return {
    salud: EJES_IDS.filter((id) => vistos.has(id)).map((id) => vistos.get(id)),
    conclusion: corta(o.conclusion, 400), trabado: trabadoDe(o.trabado), porque: corta(o.porque, 400),
    etapa_ref: n === null ? null : { n, confirmada: verdadero(r.confirmada) },
  };
}

// ---------- Lecturas ----------
// El eje con su estado, o «falta» sin evidencia si no vino. Siempre devuelve los 6.
export const saludDe = (c) => EJES_IDS.map((id) => ({ ...eje(id), ...((Array.isArray(c?.salud) ? c.salud : []).find((x) => x?.eje === id) || {}) }));
export const ejesSinDatos = (c) => saludDe(c).filter((x) => x.estado === 'falta' || sinEvidencia(x.evidencia)).map((x) => ({ ...x, ...ejeDe(x.eje) }));

// ---------- Lo que falta (bloquea aprobar) ----------
export function faltas(contenido) {
  const c = limpiar(contenido), f = [];
  if (c.salud.length !== EJES.length) f.push(`Hay ${c.salud.length} de ${EJES.length} ejes: faltan ${EJES.filter((e) => !c.salud.some((x) => x.eje === e.id)).map((e) => e.nombre).join(', ')}`);
  for (const x of c.salud) if (x.estado !== 'falta' && sinEvidencia(x.evidencia)) f.push(`«${ejeDe(x.eje).nombre}» está en ${x.estado === 'ok' ? 'ok' : 'riesgo'} sin evidencia: sin evidencia va «falta» (${SIN_DATOS})`);
  if (!c.conclusion) f.push('Falta la conclusión en una línea');
  if (!c.trabado) f.push('Falta marcar dónde está trabado (oferta, modelo, leads o capacidad)');
  return f;
}

// ---------- A la estrategia en vivo ----------
// El parche con las llaves REALES de limpiarParche (estrategia-viva.js): contexto.conclusion y analisis.trabado/porque. Lo vacío no se
// manda: aplicar() junta por llave y un '' borraría lo que ya tiene la estrategia. Sin nada que reflejar, {}.
export function aViva(contenido) {
  const c = limpiar(contenido), p = {};
  if (c.conclusion) p.contexto = { conclusion: c.conclusion };
  const a = {}; if (c.trabado) a.trabado = c.trabado; if (c.porque) a.porque = c.porque;
  if (Object.keys(a).length) p.analisis = a;
  return p;
}

// Una línea para que otras herramientas (Opportunity Map, Offer Architect) lean el X-Ray aprobado.
export function resumenTexto(contenido) {
  const c = limpiar(contenido), e = c.etapa_ref ? ETAPAS.find((x) => x.n === c.etapa_ref.n) : null;
  return [
    `X-Ray: ${c.conclusion || 'sin conclusión'}`, e ? `etapa ${e.n} · ${e.nombre}` : '',
    c.trabado ? `trabado en ${TRABADO.find((t) => t.id === c.trabado).nombre.toLowerCase()}${c.porque ? `: ${corta(c.porque, 140)}` : ''}` : 'sin marcar dónde se traba',
    `en riesgo: ${c.salud.filter((x) => x.estado === 'riesgo').map((x) => ejeDe(x.eje).nombre).join(', ') || 'ninguno'}`,
    `sin datos: ${ejesSinDatos(c).map((x) => x.nombre).join(', ') || 'ninguno'}`,
  ].filter(Boolean).join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
const carpetaDe = (slug) => (!slug ? 'clients/<cliente>' : slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${slug}`);
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {}, es = plano(c.estrategia) ? c.estrategia : {}, carpeta = carpetaDe(corta(c.cliente?.slug, 60));
  const e = es.etapa && es.etapa.n != null ? ETAPAS.find((x) => x.n === Number(es.etapa.n)) : null;
  const intel = plano(c.intel) ? c.intel : {}, lib = (Array.isArray(c.library) ? c.library : []).filter(plano).slice(0, 3).map((x) => corta(x.titulo, 60)).filter(Boolean);
  const inv = (Array.isArray(c.investigacion) ? c.investigacion : []).map((x) => corta(plano(x) ? x.archivo || x.titulo : x, 60)).filter(Boolean).slice(0, 4);
  const extra = [
    corta(intel.comprension, 480) ? `Comprensión (${carpeta}/00-onboarding/comprension.md): ${corta(intel.comprension, 480)}` : '',
    corta(intel.nucleo, 480) ? `Núcleo (${carpeta}/01-estrategia/nucleo.md): ${corta(intel.nucleo, 480)}` : '',
    lib.length ? `Library adjunta: ${lib.join(' · ')}` : '', inv.length ? `Investigación: ${inv.join(' · ')}` : '',
  ].filter(Boolean);
  const cuerpo = [
    'MÉTODO',
    `Fuentes (el contexto las trae si existen; lo que no está va ${SIN_DATOS} y dices de dónde saldría): la ficha de oferta (${carpeta}/00-onboarding/plan-contratado.md), ${carpeta}/00-onboarding/comprension.md y ${carpeta}/01-estrategia/nucleo.md del Intel, la Library y la Investigación (${carpeta}/99-referencias/investigacion/).`,
    `Lee en hormozi-brain: ${RUTAS_HORMOZI.overview}${e ? ` y ${etapaHormozi(e.n).ruta}` : ''}.`,
    `1) SALUD: exactamente 6 ejes: ${EJES.map((x) => `${x.id} (${x.nombre})`).join(', ')}. Cada uno con estado ok, riesgo o falta, la evidencia que lo prueba y su fuente (archivo, cifra del cliente o [dice el cliente, sin verificar]). Sin evidencia el estado es falta y la evidencia va vacía: nunca ok «de memoria».`,
    '2) CONCLUSIÓN: una sola frase sobre cómo está el negocio hoy.',
    '3) TRABADO: dónde se traba, uno solo: oferta, modelo, leads o capacidad; en «porque», la razón en una o dos frases. Si la empresa es el estorbo, más demanda empeora el problema: primero la capacidad.',
    `4) etapa_ref: ${e ? `Strategy ya ubicó la etapa ${e.n} (${es.etapa.confirmada ? 'confirmada por el CEO' : 'sin confirmar'}): cópiala tal cual, sin cambiar confirmada.` : 'Strategy aún no la ubica: null. No la inventes.'} Confirmar la etapa es solo del CEO.`,
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"salud":[{"eje":"oferta","estado":"ok|riesgo|falta","evidencia":"…","fuente":"…"},…6 en total],"conclusion":"…","trabado":"oferta|modelo|leads|capacidad","porque":"…","etapa_ref":{"n":3,"confirmada":false}}',
    F,
    `${F}criterios`,
    '{"entregable":"Business X-Ray","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Strategy de Inherent. Arma el BUSINESS X-RAY de «${corta(c.cliente?.nombre, 80) || 'el cliente'}»: la salud del negocio en 6 ejes y dónde está trabado.`, cuerpo, salida, extra }, c);
}

// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias, sin bloque o un objeto sin nada del X-Ray).
export function leer(texto) {
  const j = leerBloque(texto, BLOQUE);
  return j && ('salud' in j || 'conclusion' in j || 'trabado' in j) ? leerHerramienta(texto, BLOQUE, limpiar) : null;
}

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), e = c.etapa_ref ? ETAPAS.find((x) => x.n === c.etapa_ref.n) : null;
  const L = ['# Business X-Ray', '', '## Conclusión', '', c.conclusion || `${SIN_DATOS}: falta la conclusión.`];
  L.push('', '## Etapa', '', e ? `Etapa ${e.n} · ${e.nombre} (${c.etapa_ref.confirmada ? 'confirmada por el CEO' : 'sin confirmar'})` : `${SIN_DATOS}: la etapa no está ubicada.`);
  L.push('', '## Salud del negocio', '', '| Eje | Estado | Evidencia | Fuente |', '|---|---|---|---|');
  for (const x of saludDe(c)) {
    const sin = sinEvidencia(x.evidencia), info = ejeDe(x.eje);
    L.push(`| ${info.nombre} | ${x.estado === 'ok' ? 'ok' : x.estado === 'riesgo' ? 'riesgo' : 'falta'} | ${sin ? SIN_DATOS : celda(x.evidencia)} | ${celda(x.fuente) || (sin ? saleDe(info.sale_de) : SIN_DATOS)} |`);
  }
  L.push('', '## Dónde está trabado', '', c.trabado ? `**${TRABADO.find((t) => t.id === c.trabado).nombre}** — ${c.porque || SIN_DATOS}` : `${SIN_DATOS}: falta marcar dónde se traba.`);
  return L.join('\n');
}
