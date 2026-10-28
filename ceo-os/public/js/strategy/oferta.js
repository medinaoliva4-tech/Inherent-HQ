// Offer Architect (herramienta offer-architect de Strategy): la ecuación de valor (sueño, probabilidad, tiempo, esfuerzo), el stack Grand
// Slam (problemas → soluciones → vehículos, bonos, garantía, escasez, nombre), la propuesta de valor, 2 o 3 variaciones, la escalera del
// modelo de dinero (atracción, upsell, downsell, continuidad) y qué oferta se empuja. El nivel contratado manda: Brand Growth solo elige
// qué oferta empujar y su mensaje (el stack, el precio y la escalera se bloquean); la escalera solo entra en Growth Partnership.
// Módulo puro (sin DOM ni red): lo comparten la vista, el servidor (que bloquea y mide las faltas) y las pruebas.
// La aprobación NO vive aquí: es la del bloque `<slug>--oferta` de Estrategia (solo el CEO). Sin evidencia el factor queda vacío, nunca en 0.
import { plano, corta, entero, numeroONull, textos, SIN_DATOS, armarPrompt, leerBloque, leerHerramienta, celda, entradaDe, HORMOZI, TIPOS_OFERTA } from '../consulting/marcos.js';
import { resumenTexto as resumenDiana } from './diana.js';
import { resumenTexto as resumenXray } from './xray.js';

export const BLOQUE = 'oferta';
export const MAX_VARIACIONES = 3;
export const PARTES_BLOQUEABLES = ['ecuacion', 'stack', 'propuesta', 'variaciones', 'escalera'];
// lado: arriba suma valor (más es mejor) · abajo lo resta (más demora o esfuerzo es peor). Escala 1 a 10.
export const FACTORES = [
  { id: 'sueno', nombre: 'Resultado soñado', lado: 'arriba', ayuda: 'Qué tanto desea lo que promete la oferta (1 a 10)' },
  { id: 'probabilidad', nombre: 'Probabilidad de lograrlo', lado: 'arriba', ayuda: 'Qué tanto cree que sí le va a funcionar (1 a 10)' },
  { id: 'tiempo', nombre: 'Demora', lado: 'abajo', ayuda: 'Cuánto tarda en ver el resultado (1 rápido, 10 muy lento)' },
  { id: 'esfuerzo', nombre: 'Esfuerzo y sacrificio', lado: 'abajo', ayuda: 'Cuánto le cuesta lograrlo (1 poco, 10 mucho)' },
];
export const FACTORES_IDS = FACTORES.map((f) => f.id);
export const STACK_LISTAS = [['problemas', 'Problemas'], ['soluciones', 'Soluciones'], ['vehiculos', 'Vehículos de entrega'], ['bonos', 'Bonos']];
export const ESCALERA = TIPOS_OFERTA.map(({ id, nombre, que }) => ({ id, nombre, que }));
const ESCALERA_IDS = ESCALERA.map((e) => e.id);

// ---------- El nivel manda ----------
// Qué partes no se tocan: Brand Growth no cambia el stack ni las variaciones (con su precio); la escalera es solo de Growth Partnership.
// Brand Growth solo elige qué oferta empujar y su mensaje: la ecuación, el stack, la propuesta y el precio son de Foundation y Partnership.
export const bloqueos = (nivelId) => ({ ecuacion: nivelId === 'growth', stack: nivelId === 'growth', propuesta: nivelId === 'growth', variaciones: nivelId === 'growth', escalera: nivelId !== 'partnership' });

// ---------- El contenido ----------
const factorVacio = () => ({ valor: null, evidencia: '' });
const tramoVacio = () => ({ hoy: '', propuesta: '', cita: '' });
// El contenido inicial: todo vacío (⚠️ SIN DATOS), sin ceros inventados.
export function vacio() {
  return {
    ecuacion: Object.fromEntries(FACTORES_IDS.map((id) => [id, factorVacio()])),
    stack: { problemas: [], soluciones: [], vehiculos: [], bonos: [], garantia: '', escasez: '', nombre: '' },
    propuesta: '', variaciones: [],
    escalera: Object.fromEntries(ESCALERA_IDS.map((id) => [id, tramoVacio()])),
    empujar: { oferta: '', mensaje: '' },
  };
}
const factor = (f) => { const x = plano(f) ? f : { valor: f }; return { valor: entero(x.valor, 1, 10), evidencia: corta(x.evidencia, 300) }; };
const tramo = (t) => { const x = plano(t) ? t : { propuesta: t }; return { hoy: corta(x.hoy, 240), propuesta: corta(x.propuesta, 300), cita: corta(x.cita, 240) }; };
const variacion = (v) => ({ nombre: corta(v.nombre, 80), precio: corta(v.precio, 60), para_quien: corta(v.para_quien, 160), diferencia: corta(v.diferencia, 240) });
// Solo lo conocido, con su tipo y su tamaño. Lo que se mande de más (id, v, _meta, llaves raras, HTML) no entra; el texto queda como texto.
export function limpiar(contenido) {
  const o = plano(contenido) ? contenido : {}, ec = plano(o.ecuacion) ? o.ecuacion : {}, s = plano(o.stack) ? o.stack : {}, es = plano(o.escalera) ? o.escalera : {}, em = plano(o.empujar) ? o.empujar : {};
  return {
    ecuacion: Object.fromEntries(FACTORES_IDS.map((id) => [id, factor(ec[id])])),
    stack: { problemas: textos(s.problemas, 12, 200), soluciones: textos(s.soluciones, 12, 200), vehiculos: textos(s.vehiculos, 12, 200), bonos: textos(s.bonos, 12, 200),
      garantia: corta(s.garantia, 300), escasez: corta(s.escasez, 300), nombre: corta(s.nombre, 120) },
    propuesta: corta(o.propuesta, 500),
    variaciones: (Array.isArray(o.variaciones) ? o.variaciones : []).filter(plano).map(variacion).filter((v) => Object.values(v).some(Boolean)).slice(0, MAX_VARIACIONES),
    escalera: Object.fromEntries(ESCALERA_IDS.map((id) => [id, tramo(es[id])])),
    empujar: { oferta: corta(em.oferta, 160), mensaje: corta(em.mensaje, 400) },
  };
}

// ---------- Cálculos ----------
// El valor percibido: (sueño × probabilidad) / (tiempo × esfuerzo). null si falta un factor: sin dato no hay número. Recibe la ecuación
// (o el contenido entero) y redondea a 2 decimales.
export function valorPercibido(ec) {
  const e = plano(ec?.ecuacion) ? ec.ecuacion : ec;
  const v = FACTORES_IDS.map((id) => numeroONull(plano(e?.[id]) ? e[id].valor : e?.[id], { min: 1, max: 10 }));
  if (v.some((x) => x === null)) return null;
  const [sueno, probabilidad, tiempo, esfuerzo] = v;
  return Math.round(((sueno * probabilidad) / (tiempo * esfuerzo)) * 100) / 100;
}
// Qué partes bloqueadas por el nivel cambiaron entre dos versiones (el servidor las rechaza con 403 FUERA_DEL_ALCANCE).
export function cambiaBloqueado(antes, despues, nivelId) {
  const a = limpiar(antes), d = limpiar(despues), b = bloqueos(nivelId);
  return PARTES_BLOQUEABLES.filter((k) => b[k] && JSON.stringify(a[k]) !== JSON.stringify(d[k]));
}
// Lo nuevo, pero con las partes bloqueadas por el nivel tal como estaban: lo que pasa al aplicar lo que contesta la IA en Brand Growth.
export function conservarBloqueado(antes, despues, nivelId) {
  const a = limpiar(antes), d = limpiar(despues), b = bloqueos(nivelId);
  for (const k of PARTES_BLOQUEABLES) if (b[k]) d[k] = a[k];
  return d;
}

// ---------- Lo que falta (bloquea aprobar) ----------
// extra.nivelId (el servidor) o extra.ctx.cliente.nivel.id (el shell). Brand Growth: qué oferta se empuja y su mensaje. Los demás: la
// propuesta, 2 variaciones y la evidencia de cada factor de la ecuación que trae valor.
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), f = [], nivel = extra?.nivelId ?? extra?.ctx?.cliente?.nivel?.id ?? null;
  if (nivel === 'growth') {
    if (!c.empujar.oferta) f.push('Falta elegir qué oferta se empuja (una de las que el cliente ya vende)');
    if (!c.empujar.mensaje) f.push('Falta el mensaje de la oferta que se empuja');
    return f;
  }
  if (!c.propuesta) f.push('Falta la propuesta de valor');
  const n = c.variaciones.filter((v) => v.nombre).length;
  if (n < 2) f.push(`Hay ${n} variaci${n === 1 ? 'ón' : 'ones'} con nombre: se piden al menos 2`);
  for (const fa of FACTORES) { const x = c.ecuacion[fa.id]; if (x.valor !== null && !x.evidencia) f.push(`«${fa.nombre}» tiene valor ${x.valor} sin evidencia: sin evidencia va vacío (${SIN_DATOS})`); }
  return f;
}

// Una línea para que otras herramientas (Pricing, Campaign Architect, el Roadmap) lean la oferta aprobada.
export function resumenTexto(contenido) {
  const c = limpiar(contenido), v = valorPercibido(c);
  return [
    `Oferta: ${c.propuesta ? corta(c.propuesta, 200) : 'sin propuesta de valor'}`, c.stack.nombre ? `nombre «${c.stack.nombre}»` : '',
    `valor percibido ${v === null ? 'sin datos' : v}`, c.variaciones.length ? `variaciones: ${c.variaciones.map((x) => x.nombre).filter(Boolean).join(', ')}` : '',
    c.empujar.oferta ? `se empuja «${c.empujar.oferta}»${c.empujar.mensaje ? `: ${corta(c.empujar.mensaje, 140)}` : ''}` : '',
  ].filter(Boolean).join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
const LIBROS = `${HORMOZI}/references/books`;
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {}, nivel = corta(c.cliente?.nivel?.id, 20), growth = nivel === 'growth', b = bloqueos(nivel), nombre = corta(c.cliente?.nombre, 80) || 'el cliente';
  const entrada = (tool, f) => { const e = entradaDe(c, tool); return e ? `Entrada aprobada · ${corta(e.titulo, 60) || tool} v${Number(e.version) || 1}: ${corta(f(e.contenido), 380)}` : ''; };
  const extra = [entrada('customer-bullseye', resumenDiana), entrada('business-xray', resumenXray)].filter(Boolean);
  const cita = 'Cita con el formato del INDEX, p. ej. [$100M OFFERS | 6. Value Offer: The Value Equation | pág. PDF 81]; lo que no esté, «No está en el material».';
  const cuerpo = growth ? [
    'MÉTODO',
    `Este cliente es Brand Growth: NO se cambia qué se vende, ni el paquete, ni el precio (el stack, las variaciones y la escalera no se tocan). Solo eliges cuál de las ofertas que YA existen se empuja y cómo se cuenta.`,
    `Lee en hormozi-brain (${LIBROS}/): 100m-offers/10-ch06-the-value-equation.md y 100m-offers/21-ch16-naming.md. ${cita}`,
    '1) empujar.oferta: UNA de las ofertas que la ficha o el cliente ya tienen, y por qué (valor percibido, evidencia). 2) empujar.mensaje: cómo se cuenta esa oferta (una o dos frases). Un precio o una oferta nueva se escala al CEO.',
  ] : [
    'MÉTODO',
    `Lee en hormozi-brain (${LIBROS}/): 100m-offers/10-ch06-the-value-equation.md, 13-ch09-grand-slam-offer-part-1-problems-solutions.md, 14-ch10-grand-slam-offer-part-2-trim-stack.md, 17-ch12-scarcity.md, 19-ch14-bonuses.md, 20-ch15-guarantees.md, 21-ch16-naming.md${b.escalera ? '' : ' y 100m-money-models/03-the-four-types-of-offers.md'}. ${cita}`,
    '1) ecuacion: sueno, probabilidad, tiempo y esfuerzo, cada uno valor 1 a 10 con su evidencia (tiempo y esfuerzo: 10 es lo peor). Sin evidencia, valor null = ⚠️ SIN DATOS.',
    '2) stack Grand Slam: problemas → soluciones → vehiculos, bonos, garantia, escasez y nombre.',
    '3) propuesta de valor en una o dos frases y 2 o 3 variaciones (nombre, precio, para_quien, diferencia). Todo precio es una PROPUESTA: se escala al CEO.',
    b.escalera ? '4) La escalera (atracción, upsell, downsell, continuidad) NO entra en este nivel: no la armes. 5) empujar: qué oferta se empuja y su mensaje.'
      : '4) escalera de Money Models: atraccion, upsell, downsell y continuidad, cada una con hoy (lo que ya existe, con fuente), propuesta y cita (por tipo: 100m-money-models/04-section-2-attraction-offers.md, 12-section-3-upsell-offers.md, 18-section-4-downsell-offers.md, 23-section-5-continuity-offers.md). 5) empujar: qué oferta se empuja y su mensaje.',
  ];
  const json = growth ? '{"empujar":{"oferta":"…","mensaje":"…"}}'
    : `{"ecuacion":{"sueno":{"valor":8,"evidencia":"…"},"probabilidad":{…},"tiempo":{…},"esfuerzo":{…}},"stack":{"problemas":["…"],"soluciones":["…"],"vehiculos":["…"],"bonos":["…"],"garantia":"…","escasez":"…","nombre":"…"},"propuesta":"…","variaciones":[{"nombre":"…","precio":"…","para_quien":"…","diferencia":"…"}],${b.escalera ? '' : '"escalera":{"atraccion":{"hoy":"…","propuesta":"…","cita":"…"},"upsell":{…},"downsell":{…},"continuidad":{…}},'}"empujar":{"oferta":"…","mensaje":"…"}}`;
  const salida = ['Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):', `${F}${BLOQUE}`, json, F, `${F}criterios`, '{"entregable":"Offer Architect","cumple":["…"],"falta":["… — por qué"]}', F];
  return armarPrompt({ intro: `Eres Strategy de Inherent. ${growth ? `Define la OFERTA QUE SE EMPUJA de «${nombre}» (Offer Architect)` : `Arma la OFERTA de «${nombre}» (Offer Architect)`} con hormozi-brain, dentro del nivel que contrató.`, cuerpo, salida, extra }, c);
}

// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias, sin bloque o un objeto sin nada de la oferta).
export function leer(texto) {
  const j = leerBloque(texto, BLOQUE);
  return j && ['ecuacion', 'stack', 'propuesta', 'variaciones', 'escalera', 'empujar'].some((k) => k in j) ? leerHerramienta(texto, BLOQUE, limpiar) : null;
}

// ---------- Exportar ----------
const lista = (xs) => (xs.length ? xs.map((x) => `- ${x}`) : [`- ${SIN_DATOS}`]);
export function aMd(contenido) {
  const c = limpiar(contenido), v = valorPercibido(c);
  const L = ['# Offer Architect', '', '## Ecuación de valor', '', '| Factor | Valor (1 a 10) | Evidencia |', '|---|---|---|'];
  for (const f of FACTORES) { const x = c.ecuacion[f.id]; L.push(`| ${f.nombre} | ${x.valor === null ? SIN_DATOS : x.valor} | ${celda(x.evidencia) || SIN_DATOS} |`); }
  L.push('', v === null ? `Valor percibido: ${SIN_DATOS} (falta un factor)` : `Valor percibido: **${v}** = (sueño × probabilidad) / (tiempo × esfuerzo)`);
  L.push('', '## Stack Grand Slam', '');
  for (const [k, nombre] of STACK_LISTAS) L.push(`**${nombre}**`, ...lista(c.stack[k]), '');
  L.push(`**Garantía:** ${c.stack.garantia || SIN_DATOS}`, `**Escasez:** ${c.stack.escasez || SIN_DATOS}`, `**Nombre:** ${c.stack.nombre || SIN_DATOS}`);
  L.push('', '## Propuesta de valor', '', c.propuesta || `${SIN_DATOS}: falta la propuesta.`, '', '## Variaciones', '');
  if (c.variaciones.length) { L.push('| Nombre | Precio (propuesta) | Para quién | Qué la diferencia |', '|---|---|---|---|'); for (const x of c.variaciones) L.push(`| ${celda(x.nombre) || SIN_DATOS} | ${celda(x.precio) || SIN_DATOS} | ${celda(x.para_quien) || SIN_DATOS} | ${celda(x.diferencia) || SIN_DATOS} |`); } else L.push(`${SIN_DATOS}: faltan las variaciones.`);
  L.push('', '## Escalera (Modelo de dinero)', '');
  for (const e of ESCALERA) { const t = c.escalera[e.id]; L.push(`- **${e.nombre}** — hoy: ${t.hoy || SIN_DATOS} · propuesta: ${t.propuesta || SIN_DATOS}${t.cita ? ` ${t.cita}` : ''}`); }
  L.push('', '## Qué oferta se empuja', '', c.empujar.oferta ? `**${c.empujar.oferta}** — ${c.empujar.mensaje || SIN_DATOS}` : `${SIN_DATOS}: falta elegir la oferta que se empuja.`);
  return L.join('\n');
}
