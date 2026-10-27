// Creative Direction Lab (herramienta creative-direction-lab de Creative): insight, big idea y 3 a 5 conceptos comparables, con la
// campaña que llega de Campaign Architect («Enviar a Creative»). Un solo módulo puro (sin DOM ni red) para el contenido, el pedido
// a la IA, la lectura de su respuesta y las reglas de aprobación: lo comparten la vista, el servidor y las pruebas.
// Lo que no tiene dato queda vacío y dice ⚠️ SIN DATOS; los conceptos descartados se marcan, nunca se borran.
import { plano, corta, entero, leerHerramienta, contextoPrompt, entradaDe, SIN_DATOS, celda } from '../consulting/marcos.js';

export const BLOQUE = 'direccion';
export const MIN_CONCEPTOS = 3;
export const MAX_CONCEPTOS = 5;
export const TECNICAS = ['escala', 'lente', 'belleza', 'transportación', 'choque', 'tensión'];
const MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const ID = /^[a-z0-9_-]{1,24}$/i;

export const campanaVacia = () => ({ id: '', nombre: '', frase: '', mbt: '', briefs: [] });
export const conceptoVacio = (n = 1) => ({ id: `c${n}`, nombre: '', idea: '', hook: '', tecnica: '', imagenes: [], formato: '', laya: '', descartado: false });

export function vacio() {
  return { mes: '', campana: campanaVacia(), insight: '', big_idea: '', conceptos: [], elegido: '' };
}

// Un brief de la campaña: texto suelto o un objeto plano; solo valores de texto o número, cortos.
function brief(x) {
  if (typeof x === 'string') { const t = corta(x, 300); return t ? { titulo: t } : null; }
  if (!plano(x)) return null;
  const o = {};
  for (const [k, v] of Object.entries(x).slice(0, 12)) {
    const kk = corta(k, 30); if (!kk) continue;
    if (typeof v === 'number' && Number.isFinite(v)) o[kk] = v;
    else if (typeof v === 'string') { const t = corta(v, 300); if (t) o[kk] = t; }
  }
  return Object.keys(o).length ? o : null;
}
function campana(c) {
  const o = plano(c) ? c : {};
  const mbt = plano(o.mbt) ? Object.values(o.mbt).map((v) => corta(v, 120)).filter(Boolean).join(' · ') : corta(o.mbt, 400);
  return { id: corta(o.id, 60), nombre: corta(o.nombre, 120), frase: corta(o.frase, 240), mbt, briefs: (Array.isArray(o.briefs) ? o.briefs : []).slice(0, 30).map(brief).filter(Boolean) };
}

// Solo lo conocido, con su tipo y su tamaño. Los conceptos: máximo 5, ids únicos, imágenes como índices del moodboard (máx. 3).
export function limpiar(c) {
  const o = plano(c) ? c : {}, usados = new Set(), conceptos = [];
  for (const x of Array.isArray(o.conceptos) ? o.conceptos : []) {
    if (!plano(x) || conceptos.length >= MAX_CONCEPTOS) continue;
    const nombre = corta(x.nombre, 80), idea = corta(x.idea, 400);
    if (!nombre && !idea) continue;
    let id = typeof x.id === 'string' && ID.test(x.id.trim()) ? x.id.trim() : '';
    if (!id || usados.has(id)) { let n = conceptos.length + 1; while (usados.has(`c${n}`)) n++; id = `c${n}`; }
    usados.add(id);
    const imgs = [...new Set((Array.isArray(x.imagenes) ? x.imagenes : []).map((i) => entero(i, 0, 999)).filter((i) => i !== null))].slice(0, 3);
    conceptos.push({ id, nombre, idea, hook: corta(x.hook, 240), tecnica: corta(x.tecnica, 80), imagenes: imgs, formato: corta(x.formato, 30), laya: corta(x.laya, 300), descartado: x.descartado === true });
  }
  const elegido = typeof o.elegido === 'string' && conceptos.some((k) => k.id === o.elegido && !k.descartado) ? o.elegido : '';
  return { mes: MES.test(String(o.mes ?? '')) ? o.mes : '', campana: campana(o.campana), insight: corta(o.insight, 500), big_idea: corta(o.big_idea, 300), conceptos, elegido };
}

export const activos = (c) => limpiar(c).conceptos.filter((k) => !k.descartado);

// Lo que falta para poder aprobar (cada texto es un criterio en «falta»).
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), n = c.conceptos.filter((k) => !k.descartado).length, f = [];
  if (n < MIN_CONCEPTOS) f.push(`Hay ${n} de ${MIN_CONCEPTOS} conceptos como mínimo (máximo ${MAX_CONCEPTOS}): sin tres no hay con qué comparar`);
  if (!c.insight) f.push('Falta el insight: lo que el comprador siente o dice, en sus palabras');
  if (!c.big_idea) f.push('Falta la big idea: una frase que une la campaña');
  return f;
}

// ---------- Cálculos ----------
export const conceptoElegido = (c) => limpiar(c).conceptos.find((k) => k.id === c?.elegido && !k.descartado) || null;
// El texto de la pieza que nace de un concepto (lo que va a «Enviar a Ideas»): el hook, la idea y la técnica.
export function ideaDeConcepto(k, slot) {
  return { slot: corta(slot, 12).toUpperCase(), titulo: corta(k?.nombre, 160), hook: corta(k?.hook, 300), angulo: corta(k?.tecnica, 200), mensaje: corta(k?.idea, 300), referente: '', por_que: corta(k?.laya, 300), adaptacion: corta(k?.idea, 400), formato: corta(k?.formato, 30) };
}

export function resumenTexto(contenido) {
  const c = limpiar(contenido), e = conceptoElegido(c), n = c.conceptos.filter((k) => !k.descartado).length;
  return [c.big_idea ? `Big idea: ${corta(c.big_idea, 140)}` : 'big idea sin definir', `${n} concepto${n === 1 ? '' : 's'}`, e ? `elegido: ${e.nombre}` : 'sin concepto elegido'].join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
const SK = 'agents/04-creative/brain/skills';
export function prompt(ctx) {
  const cli = plano(ctx?.cliente) ? ctx.cliente : {}, slug = corta(cli.slug, 40);
  const carpeta = slug ? (slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${slug}`) : 'clients/<cliente>';
  const ent = entradaDe(ctx, 'campaign-architect'), cam = ent ? campana(ent.contenido?.campana ?? ent.contenido) : null;
  const extra = [cam && (cam.nombre || cam.frase) ? `Campaña (de Campaign Architect): ${cam.nombre || SIN_DATOS}${cam.frase ? ` — ${cam.frase}` : ''}${cam.mbt ? ` · ${cam.mbt}` : ''}` : `Campaña: ${SIN_DATOS}: sale de Campaign Architect («Enviar a Creative»)`];
  const intro = `Eres ④ Creatividad de Inherent. Arma la DIRECCIÓN CREATIVA de «${corta(cli.nombre, 80) || 'el cliente'}»: un insight, una big idea y 3 a 5 conceptos comparables.`;
  const reglas = [
    'REGLAS (no se negocian):',
    '- Lee primero el brief del ciclo (' + carpeta + '/04-contenido/AAAA-MM/brief-del-ciclo.md). Sin brief no inventes: dilo y devuelve el bloque vacío.',
    '- Evidencia o etiqueta: un dato sin fuente va como [dice el cliente, sin verificar] o ⚠️ SIN DATOS. No inventes cifras, citas ni nombres; lo que no tiene dato va vacío.',
    '- Nunca leas ni cites inherent/06-ECONOMIA.md ni costos, márgenes o tarifas de Inherent. No publiques ni gastes dinero. Roles, no nombres de personas.',
    '- Español de «tú», corto y humano. El repo no se edita desde aquí.',
  ].join('\n');
  const metodo = [
    'MÉTODO (en este orden; sin big idea elegida no se escribe hook)',
    `1) cr-brief (${SK}/cr-brief/SKILL.md): lee el brief del ciclo y el lenguaje literal del comprador. Saca UN insight específico, con sus palabras.`,
    `2) cr-big-idea (${SK}/cr-big-idea/SKILL.md): aplica 1 o 2 técnicas (${TECNICAS.join(', ')}) y baja a UNA big idea de una frase. Pasa el filtro Distinctiveness / Novelty / Relevance y la prueba del logo.`,
    `3) cr-storytelling (${SK}/cr-storytelling/SKILL.md): cada concepto tiene nombre, idea en 1-2 frases, hook, técnica y formato (Reel, Carrusel, Story, Estático, TikTok o YouTube). Entre 3 y 5, distintos entre sí.`,
    '4) imagenes: índices (desde 0) de las imágenes del moodboard que lo ilustran, máximo 3; sin moodboard, []. laya: lo que Laya mide de ese concepto, si hay dato; si no, vacío.',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"insight":"…","big_idea":"…","conceptos":[{"id":"c1","nombre":"…","idea":"…","hook":"…","tecnica":"escala","imagenes":[0,2],"formato":"Reel","laya":""}],"elegido":""}',
    F, `${F}criterios`,
    '{"entregable":"Dirección creativa","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armar({ intro, reglas, metodo, salida, extra }, ctx);
}
function armar({ intro, reglas, metodo, salida, extra }, ctx, max = 4900) {
  const antes = `${intro}\n\n${reglas}\n\n`, despues = ['', '', ...metodo, '', ...salida].join('\n');
  return antes + contextoPrompt(ctx, Math.max(120, max - antes.length - despues.length - 1), extra) + despues;
}

// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar (sin costos ni notas internas) ----------
export function aMd(contenido) {
  const c = limpiar(contenido), L = ['# Dirección creativa', ''];
  L.push(`**Campaña:** ${c.campana.nombre || SIN_DATOS}${c.campana.frase ? ` — ${c.campana.frase}` : ''}`, '');
  L.push('## Insight', '', c.insight || `${SIN_DATOS}: sale del brief del ciclo y del lenguaje del comprador`, '', '## Big idea', '', c.big_idea || `${SIN_DATOS}: sale de aplicar las técnicas al insight`, '', '## Conceptos', '');
  if (!c.conceptos.length) L.push(`${SIN_DATOS}: faltan los conceptos`);
  for (const k of c.conceptos) {
    L.push(`### ${k.nombre || 'Sin nombre'}${k.id === c.elegido ? ' (elegido)' : ''}${k.descartado ? ' (descartado)' : ''}`, '', k.idea || SIN_DATOS, '',
      `- Hook: ${celda(k.hook) || SIN_DATOS}`, `- Técnica: ${celda(k.tecnica) || SIN_DATOS}`, `- Formato: ${celda(k.formato) || SIN_DATOS}`,
      `- Imágenes del moodboard: ${k.imagenes.length ? k.imagenes.map((i) => `#${i + 1}`).join(', ') : SIN_DATOS}`, `- Laya: ${celda(k.laya) || SIN_DATOS}`, '');
  }
  return L.join('\n');
}
