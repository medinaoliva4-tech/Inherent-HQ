// App 01 · Marca › Crear › Formatos y Creación: lo que comparten el servidor (api/_lib/creacion.js) y la interfaz.
// Las plantillas base salen del método de ④ Creatividad (cr-estructura-reel y cr-estructura-story):
//   Reel: HOOK (0-3 s, legible en mute, sin saludo) · BODY · PAYOFF (cierra lo que abrió el hook) · CTA (una acción de su etapa).
//         Seis esqueletos: A cámara · Lista · Antes y después · Proceso · Historia · Reel estático.
//   Story: cuatro funciones (Gancho · Contexto · Interacción · Acción) y cinco secuencias tipo.
// Cada marca duplica una base y la ajusta, o arma la suya desde un referente de Investigación («Usar como formato»).
// Un guion (Creación) llena los tramos de un formato: qué se dice, qué va en pantalla y qué se ve.
import { CONSCIENCIA } from './calendario-contenido.js';
import { resumenAvatar } from './avatares.js';

export const COLL_F = 'formats', COLL_G = 'scripts';
export const TIPOS = [['reel', 'Reel'], ['story', 'Story'], ['ficha', 'Ficha de referente']];
export const ESTADOS_G = ['Borrador', 'Listo para grabar'];
export const DURACION = 'Reels 7-30 s · TikTok < 60 s · Shorts < 30 s';
const T = (nombre, seg, que) => ({ nombre, seg, que });
const reel = (id, nombre, hook, body, mejor) => ({
  id: 'base-reel-' + id, base: true, tipo: 'reel', nombre: `Reel · ${nombre}`, esqueleto: nombre, mejor_para: mejor, duracion: 30,
  partes: [T('HOOK', '0-3 s', `${hook}. El gancho, legible en mute, sin saludo.`), T('BODY', '4-22 s', body), T('PAYOFF', '23-27 s', 'Cierra lo que abrió el hook: el fix, el resultado.'), T('CTA', '28-30 s', 'Una sola acción, de la familia de su etapa.')],
});
const story = (id, nombre, frames, etapa) => ({ id: 'base-story-' + id, base: true, tipo: 'story', nombre: `Story · ${nombre}`, esqueleto: nombre, mejor_para: etapa, partes: frames.map(([n, q]) => T(n, '', q)) });

export const BASE = [
  reel('acamara', 'A cámara', 'Pain o bold claim', 'El fundador o el experto lo explica con sus palabras.', 'MOF · confianza'),
  reel('lista', 'Lista', 'List o número', 'Un número = una toma.', 'TOF · utilidad'),
  reel('antesdespues', 'Antes y después', 'Pattern interrupt', 'El cambio, mostrado.', 'Prueba · MOF/BOF'),
  reel('proceso', 'Proceso', 'Curiosity gap', 'Los pasos, en orden.', 'TOF/MOF · producto'),
  reel('historia', 'Historia', 'Story o tease', 'El arco completo (POV o caso).', 'TOF · marca'),
  reel('estatico', 'Reel estático', 'Pregunta o bold claim', '1 a 3 pantallas de texto sobre imagen.', 'TOF · sin material nuevo'),
  story('encuesta', 'Encuesta', [['Gancho', 'Se entiende sola: abre la pregunta o muestra el dolor.'], ['Interacción', 'Encuesta: que elija, que opine.'], ['Resultado', 'Lo que respondieron, con una línea.'], ['Acción', 'Pide una sola cosa.']], 'TOF · conversación'),
  story('detras', 'Detrás de cámara', [['Gancho', 'Se entiende sola.'], ['Contexto', 'El por qué o la prueba (uno o más frames).'], ['Acción suave', '«Escríbenos», «mira el reel».']], 'TOF/MOF · cercanía'),
  story('prueba', 'Prueba', [['Gancho', 'Abre la pregunta o el dolor.'], ['Caso o reseña', 'La prueba, con nombre y número real.'], ['Acción', 'Enlace o «escríbenos».']], 'MOF'),
  story('oferta', 'Oferta', [['Gancho', 'La oferta, en una línea.'], ['Qué es', 'Qué incluye, sin letra chica.'], ['Por qué ahora', 'Urgencia real, nunca inventada.'], ['Acción', 'Enlace o DM.']], 'BOF · solo con balance de Activación'),
  story('amplificar', 'Amplificar', [['La pieza del día', 'El reel o el post del feed.'], ['Pregunta', 'Una pregunta que lleve a verlo.']], 'Lleva tráfico al feed'),
  { id: 'base-ficha', base: true, tipo: 'ficha', nombre: 'Ficha de referente', esqueleto: 'Ficha', mejor_para: 'Desglosar un post que funciona para replicarlo',
    partes: [T('Hook', '', 'Las palabras y la imagen de los primeros 3 segundos.'), T('Estructura', '', 'Los tramos, en orden, con sus tiempos.'), T('Por qué funciona', '', 'Qué retiene y por qué a este público.'), T('Cómo lo adaptamos', '', 'La misma estructura con nuestra marca y nuestro avatar.')] },
];
// El esqueleto que mejor sirve por nivel de consciencia (cr-estructura-reel §2B).
export const ESQ_POR_NIVEL = [['Historia', 'Lista'], ['A cámara', 'Proceso'], ['Proceso', 'Antes y después'], ['Antes y después', 'A cámara'], ['A cámara', 'Reel estático']];
export const CTA_POR_ETAPA = { TOF: 'engagement', MOF: 'tráfico o DM', BOF: 'directo (DM, WhatsApp, enlace)' };

// ---------- Limpiar ----------
const txt = (v, n = 400) => String(v ?? '').trim().slice(0, n);
export const limpiarPartes = (l) => (Array.isArray(l) ? l : []).map((p) => ({ nombre: txt(p?.nombre, 40) || 'Tramo', seg: txt(p?.seg, 20), que: txt(p?.que, 400) })).filter((p) => p.nombre).slice(0, 20);
export function limpiarFormato(b = {}) {
  return { nombre: txt(b.nombre, 80), tipo: TIPOS.some(([k]) => k === b.tipo) ? b.tipo : 'reel', esqueleto: txt(b.esqueleto, 40), mejor_para: txt(b.mejor_para, 120),
    duracion: Math.max(0, Math.min(180, Math.round(+b.duracion || 0))) || null, partes: limpiarPartes(b.partes), notas: txt(b.notas, 2000), ref: txt(b.ref, 40) || null, de: txt(b.de, 40) || null };
}
export const limpiarTramos = (l) => (Array.isArray(l) ? l : []).map((p) => ({ nombre: txt(p?.nombre, 40) || 'Tramo', seg: txt(p?.seg, 20), dice: txt(p?.dice, 1500), pantalla: txt(p?.pantalla, 400), visual: txt(p?.visual, 800) })).slice(0, 20);
export function limpiarGuion(b = {}) {
  const n = Math.round(+b.consciencia);
  return { titulo: txt(b.titulo, 120), formato: txt(b.formato, 40), avatar: txt(b.avatar, 40) || null, angulo: txt(b.angulo, 400) || null, consciencia: n >= 1 && n <= 5 ? n : null,
    tramos: limpiarTramos(b.tramos), caption: txt(b.caption, 2200), estado: ESTADOS_G.includes(b.estado) ? b.estado : 'Borrador', post: txt(b.post, 40) || null, inspo: txt(b.inspo, 40) || null };
}
// Los tramos vacíos de un formato, para empezar un guion.
export const tramosDe = (f) => (f?.partes || []).map((p) => ({ nombre: p.nombre, seg: p.seg || '', dice: '', pantalla: '', visual: '' }));
export const etapaDeNivel = (n) => (!n ? '' : n <= 2 ? 'TOF' : n <= 4 ? 'MOF' : 'BOF');
export const lleno = (g) => { const t = g?.tramos || []; return t.length ? Math.round((t.filter((x) => x.dice || x.pantalla || x.visual).length / t.length) * 100) : 0; };

// ---------- Lo que se le pide a Claude: escribir el guion ----------
export function promptGuion({ marca, carpeta, formato, guion, avatar, inspo, mes, pedido = '' }) {
  const n = guion.consciencia, etapa = etapaDeNivel(n);
  return [
    `Eres ④ Creatividad de Inherent. Trabajas en SOLO LECTURA: no crees ni cambies archivos. Escribe el guion de una pieza de ${marca}.`,
    `Lee antes, si existen: inherent/00-PRINCIPIOS.md, ${carpeta}/00-onboarding/plan-contratado.md (el alcance es el techo), la voz de la marca en ${carpeta}/02-marca/, el brief del mes en ${carpeta}/04-contenido/${mes}/brief-del-ciclo.md y agents/04-creative/brain/skills/${formato.tipo === 'story' ? 'cr-estructura-story' : 'cr-estructura-reel'}/SKILL.md.`,
    '',
    `Formato: ${formato.nombre}${formato.mejor_para ? ` (mejor para: ${formato.mejor_para})` : ''}. ${formato.tipo === 'reel' ? `Duración del canal: ${DURACION}. Si no cabe, se corta el BODY, nunca el HOOK, el PAYOFF ni el CTA.` : 'Cada frame se entiende solo.'}`,
    'Tramos:', ...(formato.partes || []).map((p) => `- ${p.nombre}${p.seg ? ` (${p.seg})` : ''}: ${p.que}`),
    formato.notas ? `Notas del formato: ${formato.notas}` : '',
    '',
    `La idea: ${guion.titulo || '(sin título)'}`,
    avatar ? `A quién le habla (avatar): ${resumenAvatar(avatar)}${avatar.campos?.decir?.length || avatar.campos?.mostrar?.length ? `\nSeñales para que Meta lo lleve a esa persona — decir: ${(avatar.campos.decir || []).join('; ')} · mostrar: ${(avatar.campos.mostrar || []).join('; ')}` : ''}${avatar.campos?.frases?.length ? `\nSus palabras literales: ${avatar.campos.frases.slice(0, 6).join(' | ')}` : ''}` : 'Avatar: sin definir (usa el cliente ideal de la carpeta si existe).',
    guion.angulo ? `Ángulo: ${guion.angulo}` : '',
    n ? `Nivel de consciencia: ${n} · ${CONSCIENCIA[n - 1]} → etapa ${etapa}, CTA de la familia ${CTA_POR_ETAPA[etapa]}. Esqueletos que mejor sirven: ${ESQ_POR_NIVEL[n - 1].join(' o ')}.` : '',
    inspo ? `Inspo a replicar (toma la estructura, no copies el texto) @${inspo.handle || '—'}: ${String(inspo.text || inspo.title || '').slice(0, 1200)}` : '',
    (guion.tramos || []).some((t) => t.dice || t.pantalla || t.visual) ? `Lo que ya está escrito (respétalo y mejóralo):\n${JSON.stringify(guion.tramos, null, 1)}` : '',
    pedido ? `Pedido de la persona: ${pedido}` : '',
    '',
    'Reglas: la voz y el tratamiento (tú/usted) de la marca; nada de cifras, precios ni promesas inventadas (si hay claim, márcalo [pasa por ②B Branding]); di y muestra a quién le habla (las señales del avatar).',
    'Responde con un resumen de 2 líneas y, al final, UN bloque ```json con esta forma exacta:',
    '```json\n{ "titulo": "…", "tramos": [{ "nombre": "HOOK", "seg": "0-3 s", "dice": "lo que se dice", "pantalla": "el texto en pantalla", "visual": "lo que se ve" }], "caption": "…" }\n```',
    'Usa exactamente los tramos del formato, en el mismo orden.',
  ].filter((x) => x !== '').join('\n');
}
export function leerGuionClaude(texto) {
  const m = [...String(texto || '').matchAll(/```json\s*([\s\S]*?)```/g)].at(-1); if (!m) return null;
  try { const j = JSON.parse(m[1]); return { titulo: txt(j.titulo, 120), tramos: limpiarTramos(j.tramos), caption: txt(j.caption, 2200) }; } catch { return null; }
}
