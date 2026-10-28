// Customer Bullseye (herramienta customer-bullseye de Strategy): la diana de audiencia (método Bullseye: Define · Acierta · Expande)
// con anillos por prioridad (Centro = ICP · 1 = Prioritario · 2 = Secundario · 3 y 4 = Baja prioridad) y UN mensaje con su ángulo
// por anillo. El contenido ES la forma que hoy guarda sources cfg-<slug>.bullseye (la limpia cleanBullseye de api/_lib/content.js)
// más `mensajes`, por eso limpiar() respeta sus límites al pie de la letra. Módulo puro (sin DOM ni red): lo comparten la vista,
// el servidor y las pruebas. Lo que falta dice ⚠️ SIN DATOS, nunca 0.
import { ANGULOS } from '../avatares.js';
import { plano, corta, sinAcentos, SIN_DATOS, armarPrompt, leerBloque, leerHerramienta, celda } from '../consulting/marcos.js';

export const BLOQUE = 'bullseye';
// Los 5 niveles, del centro hacia afuera. id = el índice del anillo (el mismo de rings[], mix[].ring y mensajes[].anillo).
export const ANILLOS = [
  { id: 0, clave: 'icp', nombre: 'Centro · ICP', grupo: 'ICP', que: 'La persona exacta a quien le habla cada video' },
  { id: 1, clave: 'prioritario', nombre: 'Anillo 1 · Prioritario', grupo: 'Prioritario', que: 'Suelta una restricción: sigue muy cerca de comprar' },
  { id: 2, clave: 'secundario', nombre: 'Anillo 2 · Secundario', grupo: 'Secundario', que: 'Suelta otra: da alcance con algo de conversión' },
  { id: 3, clave: 'baja', nombre: 'Anillo 3 · Baja prioridad', grupo: 'Baja prioridad', que: 'Alcance que da el algoritmo cuando ya ganaste el centro' },
  { id: 4, clave: 'baja', nombre: 'Anillo 4 · Baja prioridad', grupo: 'Baja prioridad', que: 'Alcance que da el algoritmo cuando ya ganaste el centro' },
];
export const MIX_ANILLO = [0, 0, 0, 1, 2]; // la mezcla 3/1/1 de cada lote de 5 videos: a qué anillo va cada uno
export { ANGULOS };

const ANGULO_POR_TEXTO = new Map(ANGULOS.map((a) => [sinAcentos(a), a]));
// Un ángulo de ANGULOS (de avatares.js), venga con o sin acento o mayúsculas; '' si no es ninguno.
export const anguloDe = (v) => ANGULO_POR_TEXTO.get(sinAcentos(v)) || '';
// El índice de un anillo: 0 a 4, o «centro», «icp», «anillo 2»; null si no es ninguno.
function anilloDe(v) {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 0 && v <= 4 ? v : null;
  const s = sinAcentos(v);
  if (s === 'centro' || s === 'icp') return 0;
  const m = /^(?:anillo\s*)?([0-4])$/.exec(s);
  return m ? Number(m[1]) : null;
}
const n9999 = (v) => Math.max(0, Math.min(9999, Math.round(+v || 0)));

const anilloVacio = () => ({ label: '', relaxed: '', size: '', conversion: '', competition: '', search: [] });
// El contenido inicial: el centro, 4 anillos y el primer lote de 5 videos en blanco, sin mensajes todavía.
export function vacio() {
  return { center: '', buyer: '', rings: ANILLOS.map(anilloVacio), mix: MIX_ANILLO.map((ring) => ({ ring, topic: '' })), calib: [], at: '', mensajes: [] };
}

// ---------- Limpiar (la salida de un modelo es dato no confiable) ----------
// Un mensaje por anillo (el primero que llega), cada uno con un ángulo de ANGULOS ('' si no es válido: faltas() lo dice).
export function limpiarMensajes(lista) {
  const vistos = new Set(), out = [];
  for (const m of Array.isArray(lista) ? lista : []) {
    if (!plano(m)) continue;
    const anillo = anilloDe(m.anillo), mensaje = corta(m.mensaje, 300);
    if (anillo === null || !mensaje || vistos.has(anillo)) continue;
    vistos.add(anillo);
    out.push({ anillo, mensaje, angulo: anguloDe(m.angulo) });
  }
  return out.sort((a, b) => a.anillo - b.anillo);
}
function limpiarAnillo(r) {
  const x = plano(r) ? r : {}, s = x.search;
  return {
    label: corta(x.label, 160), relaxed: corta(x.relaxed, 120), size: corta(x.size, 120), conversion: corta(x.conversion, 120), competition: corta(x.competition, 120),
    search: (Array.isArray(s) ? s : typeof s === 'string' ? s.split(/[,\n]/) : []).map((v) => corta(v, 60)).filter(Boolean).slice(0, 4),
  };
}
// Deja solo lo conocido, con su tipo y su tamaño: la misma forma que acepta cleanBullseye (5 anillos, mezcla 3/1/1, hasta 12 lotes)
// más los mensajes. Lo que se mande de más (id, v, _meta, llaves raras, HTML) no entra. `at` no se inventa aquí (no hay reloj).
export function limpiar(contenido) {
  const o = plano(contenido) ? contenido : {};
  const rings = ANILLOS.map((_, i) => limpiarAnillo(Array.isArray(o.rings) ? o.rings[i] : null));
  const mix = MIX_ANILLO.map((ring, i) => ({ ring, topic: corta(Array.isArray(o.mix) && plano(o.mix[i]) ? o.mix[i].topic : '', 240) }));
  const calib = (Array.isArray(o.calib) ? o.calib : []).filter(plano).slice(-12)
    .map((c) => ({ lote: corta(c.lote, 40), c0: n9999(c.c0), c1: n9999(c.c1), c2: n9999(c.c2), decision: corta(c.decision, 200) }));
  return { center: corta(o.center, 400), buyer: corta(o.buyer, 300), rings, mix, calib, at: corta(o.at, 30), mensajes: limpiarMensajes(o.mensajes) };
}
// «Rehacer con la IA»: lo nuevo, pero los lotes de calibración (el aprendizaje) se quedan donde estaban.
export const conLotes = (nuevo, actual) => limpiar({ ...(plano(nuevo) ? nuevo : {}), calib: limpiar(actual).calib });
// Lo que todavía lee «audiencia» (Contenido → Fuentes y el conector MCP): el mismo cálculo de saveBx en screens/content.js.
export function audienciaDe(contenido) {
  const c = limpiar(contenido);
  return { exacto: c.center || c.rings[0].label, nicho: c.rings[1].label, general: c.rings[3].label };
}

// ---------- Lo que falta (bloquea aprobar) ----------
export function faltas(contenido) {
  const c = limpiar(contenido), f = [];
  if (!c.rings[0].label) f.push('Falta el centro (el ICP): la audiencia exacta del anillo 0');
  if (!c.center) f.push('Falta el centro en una frase: [persona específica] que [situación] y batalla con [problema]');
  ANILLOS.forEach((a, i) => {
    const r = c.rings[i], m = c.mensajes.find((x) => x.anillo === i);
    if (!r.label) { if (i) f.push(`Falta el ${a.nombre}`); return; }
    if (i && !r.relaxed) f.push(`El ${a.nombre} no dice qué restricción suelta`);
    if (!m) f.push(`El ${a.nombre} no tiene mensaje`);
    else if (!m.angulo) f.push(`El mensaje del ${a.nombre} no tiene un ángulo válido (${ANGULOS.join(', ')})`);
  });
  return f;
}

// Una línea para que otras herramientas (Avatar Studio, Offer Architect) lean la diana.
export function resumenTexto(contenido) {
  const c = limpiar(contenido), centro = c.center || c.rings[0].label;
  return [`Diana: ${centro ? `centro «${centro}»` : 'centro sin definir'}`, c.buyer ? `paga: ${c.buyer}` : '',
    c.mensajes.length ? `mensajes: ${c.mensajes.map((m) => `${ANILLOS[m.anillo].grupo} → ${m.angulo || 'sin ángulo'}`).join(' · ')}` : ''].filter(Boolean).join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
const lineas = (xs, n = 500) => (Array.isArray(xs) ? xs : []).map((x) => corta(x, 90)).filter(Boolean).join(', ').slice(0, n);
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {}, marca = plano(c.marca) ? c.marca : {}, actual = plano(c.diana) ? limpiar(c.diana) : null;
  const extra = [
    marca.pilares?.length ? `Pilares de la marca: ${lineas(marca.pilares)}` : '',
    marca.referentes?.length ? `Referentes: ${lineas(marca.referentes)}` : '',
    marca.competencia?.length ? `Competencia: ${lineas(marca.competencia)}` : '',
    actual && actual.rings[0].label ? `Diana actual (mejórala, no empieces de cero): ${actual.center || actual.rings[0].label} → ${actual.rings.slice(1).map((r) => r.label).filter(Boolean).join(' → ')}` : '',
  ].filter(Boolean);
  const cuerpo = [
    'MÉTODO (Bullseye: Define · Acierta · Expande). Primero precisión, después alcance: el algoritmo aprende a quién mostrarle el video y luego abre el alcance a los vecinos.',
    'Cómo conversas (obligatorio): una sola pregunta a la vez (bloque pregunta), nunca juntes dos. Después de CADA respuesta refleja en una frase lo que entendiste; si fue vaga, refleja una versión más específica como suposición. No preguntes lo que ya está en el contexto ni lo que ya te dijeron. Sin jerga con la persona («tu persona exacta», no «ICP»).',
    '0) Si el contexto alcanza para un centro nítido (rol o identidad + un detalle que lo estreche: precio, etapa, tamaño o problema), propónlo y pide confirmación; si no, hasta 4 preguntas, una por vez.',
    '1) Quien VE debe ser quien PAGA; si no, el centro es quien paga. 2) Centro: [persona específica] que [situación] y batalla con [problema].',
    `3) 5 niveles (rings, del centro hacia afuera): ${ANILLOS.map((a) => a.nombre).join('; ')}. Cada anillo suelta UNA restricción (relaxed; el centro, vacío). Por nivel: tamaño relativo (5 a 10 veces por anillo, estimación direccional, dilo así), cercanía a comprar, competencia y 2 o 3 búsquedas de TikTok o Instagram.`,
    '4) mix: 5 temas, uno por video: 3 al centro, 1 al anillo 1 y 1 al anillo 2.',
    `5) mensajes: UN mensaje (una frase, lo que le dices a ese público) y UN ángulo por anillo (anillo 0 a 4). Ángulos: ${ANGULOS.join(', ')}.`,
    'No incluyas calib: el OS conserva los lotes. No inventes datos del cliente.',
  ];
  const salida = [
    'Cuando la persona confirme, termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"center":"…","buyer":"","rings":[{"label":"…","relaxed":"","size":"…","conversion":"…","competition":"…","search":["…"]},…5 en total],"mix":[{"topic":"…"},…5 en total],"mensajes":[{"anillo":0,"mensaje":"…","angulo":"Dolor"},…5 en total]}',
    F,
    `${F}criterios`,
    '{"entregable":"Customer Bullseye","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Strategy de Inherent. Arma la DIANA DE AUDIENCIA (Customer Bullseye) de «${corta(c.cliente?.nombre, 80) || 'el cliente'}»: a quién le habla el contenido y qué le dice a cada anillo.`, cuerpo, salida, extra }, c);
}

// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias, sin bloque o un objeto sin nada de la diana).
export function leer(texto) {
  const j = leerBloque(texto, BLOQUE);
  return j && ('rings' in j || 'center' in j || 'mensajes' in j) ? leerHerramienta(texto, BLOQUE, limpiar) : null;
}

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido);
  const L = ['# Customer Bullseye', '', '## El centro', '', c.center || `${SIN_DATOS}: falta definir el centro (una persona exacta).`];
  if (c.buyer) L.push('', `Quien paga: ${c.buyer}`);
  L.push('', '## Los 5 niveles', '', '| Nivel | Audiencia | Suelta | Tamaño | Cercanía a comprar | Competencia | Búsquedas |', '|---|---|---|---|---|---|---|');
  ANILLOS.forEach((a, i) => { const r = c.rings[i]; L.push(`| ${a.nombre} | ${celda(r.label) || SIN_DATOS} | ${celda(r.relaxed) || (i ? SIN_DATOS : '—')} | ${celda(r.size) || SIN_DATOS} | ${celda(r.conversion) || SIN_DATOS} | ${celda(r.competition) || SIN_DATOS} | ${celda(r.search.join(', ')) || SIN_DATOS} |`); });
  L.push('', '## Un mensaje y un ángulo por anillo', '');
  ANILLOS.forEach((a) => { const m = c.mensajes.find((x) => x.anillo === a.id); L.push(m ? `- **${a.nombre}** (${m.angulo || `${SIN_DATOS}: sin ángulo`}): ${m.mensaje}` : `- **${a.nombre}**: ${SIN_DATOS}, falta el mensaje`); });
  L.push('', '## La mezcla 3/1/1 del primer lote', '');
  c.mix.forEach((m, i) => L.push(`${i + 1}. ${ANILLOS[m.ring].nombre}: ${m.topic || SIN_DATOS}`));
  if (c.calib.length) { L.push('', '## Calibración', ''); for (const x of c.calib) L.push(`- ${x.lote || 'Lote'}: centro ${x.c0} · anillo 1 ${x.c1} · anillo 2 ${x.c2}${x.decision ? ` — ${x.decision}` : ''}`); }
  return L.join('\n');
}
