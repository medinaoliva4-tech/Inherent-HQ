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
// ---------- Storyboard: frames por tramo y versiones (Script & Storyboard Studio) ----------
export const PLANOS = ['Abierto', 'General', 'Medio', 'Primer plano', 'Detalle', 'Cenital', 'POV'];
export const MOVIMIENTOS = ['Fijo', 'Paneo', 'Tilt', 'Travelling', 'Zoom in', 'Zoom out', 'Cámara en mano', 'Gimbal'];
export const VIAS_V = ['hermes', 'puente', 'claude-web', 'manual'];
const MAX_FRAMES = 60, MAX_VERSIONES = 30;
const unoDe = (v, l) => (l.includes(v) ? v : '');
// La imagen de un frame vive en Drive: solo se guarda su id, el nombre y un enlace https (nunca otra cosa).
const limpiarImagen = (i) => { const id = String(i?.id ?? '').trim(); if (!/^[-\w]{10,100}$/.test(id)) return null; const link = String(i?.link ?? '').trim(); return { id, nombre: txt(i?.nombre, 120), link: /^https:\/\//.test(link) ? link.slice(0, 400) : '' }; };
export function limpiarFrames(l) {
  const vistos = new Set();
  return (Array.isArray(l) ? l : []).slice(0, MAX_FRAMES).map((x, i) => {
    let id = /^[\w-]{1,30}$/.test(String(x?.id ?? '')) ? String(x.id) : `f${i + 1}`; while (vistos.has(id)) id += 'x'; vistos.add(id);
    const s = Number(x?.seg);
    return { id, tramo: txt(x?.tramo, 40), imagen: limpiarImagen(x?.imagen), plano: unoDe(x?.plano, PLANOS), movimiento: unoDe(x?.movimiento, MOVIMIENTOS), seg: Number.isFinite(s) && s > 0 ? Math.min(120, Math.round(s * 10) / 10) : null,
      texto: txt(x?.texto, 200), vo: txt(x?.vo, 600), archivado: Boolean(x?.archivado) };
  });
}
const fotoDe = (v) => ({ titulo: txt(v?.titulo, 120), tramos: limpiarTramos(v?.tramos), frames: limpiarFrames(v?.frames), caption: txt(v?.caption, 2200) });
// Las versiones solo se agregan: cada una es la foto del guion en ese momento. Se conservan las últimas 30.
export function limpiarVersiones(l) {
  const lista = (Array.isArray(l) ? l : []).map((v) => ({ v: Math.max(0, Math.round(+v?.v) || 0), en: txt(v?.en, 30), por: txt(v?.por, 80), via: unoDe(v?.via, VIAS_V) || 'manual', nota: txt(v?.nota, 200), ...fotoDe(v) })).filter((v) => v.v);
  return lista.sort((a, z) => a.v - z.v).slice(-MAX_VERSIONES);
}
// Agrega una versión nueva con el estado actual del guion (no toca las anteriores).
export function versionNueva(g, { por = '', via = 'manual', nota = '', en = new Date().toISOString() } = {}) {
  const l = limpiarVersiones(g?.versiones), v = (l.at(-1)?.v || 0) + 1;
  return limpiarVersiones([...l, { v, en, por, via, nota, ...fotoDe(g) }]);
}
export const frameNuevo = (tramo, frames = []) => { let n = frames.length + 1, id = `f${n}`; const ids = new Set(frames.map((x) => x.id)); while (ids.has(id)) id = `f${++n}`; return limpiarFrames([{ id, tramo }])[0]; };
export const framesVivos = (g) => (g?.frames || []).filter((x) => !x.archivado);

// Cuánto debe durar la pieza: la duración del formato o, si no, el fin del último tramo («25-30 s» → 30). Sin dato: null.
export function duracionObjetivo(f) {
  if (f?.duracion > 0) return f.duracion;
  const fines = (f?.partes || []).map((p) => { const n = String(p.seg || '').match(/\d+(?:[.,]\d+)?/g); return n ? Math.max(...n.map((x) => +String(x).replace(',', '.'))) : 0; });
  return Math.max(0, ...fines) || null;
}
export const duracionFrames = (g) => Math.round(framesVivos(g).reduce((a, x) => a + (x.seg || 0), 0) * 10) / 10;
// Un frame de más: los segundos de los frames pasan la duración → { total, objetivo, sobra }. Solo cuenta cuando hay segundos escritos.
export function excesoFrames(g, f) {
  const total = duracionFrames(g), objetivo = duracionObjetivo(f);
  return objetivo && total > objetivo ? { total, objetivo, sobra: Math.round((total - objetivo) * 10) / 10 } : null;
}
export const avisoExceso = (e) => (e ? `Los frames suman ${e.total} s y el formato dura ${e.objetivo} s: sobran ${e.sobra} s. Quita un frame o acorta segundos antes de grabar.` : '');

// «Enviar al shot list»: una escena por frame, con el esquema del Shot List Builder (public/js/production/shotlist.js). Esa herramienta solo
// guarda sus campos, así que la llave para no duplicar va en dos de ellos: id_creativo (la pieza: el guion) + escena («TRAMO · id del frame»).
const corto = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
export const piezaDe = (g) => corto(g?.post || g?.id || 'guion', 40);
export const escenaDe = (x) => corto(`${x.tramo || 'Tramo'} · ${x.id}`, 60);
export const claveEscena = (e) => `${e?.id_creativo ?? ''}|${e?.escena ?? ''}`;
export function escenasDeGuion(g) {
  return framesVivos(g).map((x) => {
    const t = (g.tramos || []).find((y) => y.nombre === x.tramo) || {};
    const accion = [t.visual, x.texto && `En pantalla: ${x.texto}`, (x.vo || t.dice) && `VO: ${x.vo || t.dice}`].filter(Boolean).join(' | ');
    return { id_creativo: piezaDe(g), pieza: corto(g.titulo, 120), escena: escenaDe(x), accion: corto(accion, 400), plano: corto([x.plano, x.movimiento].filter(Boolean).join(' · '), 120), duracion_s: x.seg ?? null, material: 'video' };
  });
}
// Mezcla con las escenas del entregable: la misma pieza + frame se pone al día (id, lugar, talento, jornada, estado, costo… se respetan),
// las nuevas se agregan con el siguiente PR-xxx. Nunca se borra una escena (un frame archivado deja la suya como está).
export function mezclarEscenas(actuales, nuevas) {
  const lista = (Array.isArray(actuales) ? actuales : []).map((e) => ({ ...e })), por = new Map(lista.map((e, i) => [claveEscena(e), i]));
  let n = Math.max(0, ...lista.map((e) => Number(String(e?.id ?? '').replace(/\D/g, '')) || 0)), agregadas = 0, puestas = 0;
  for (const e of nuevas) {
    const k = claveEscena(e);
    if (por.has(k)) { const i = por.get(k); lista[i] = { ...lista[i], pieza: e.pieza, accion: e.accion, plano: e.plano, duracion_s: e.duracion_s }; puestas++; }
    else { n++; por.set(k, lista.length); lista.push({ id: `PR-${String(n).padStart(3, '0')}`, ...e, estado: 'pendiente' }); agregadas++; }
  }
  return { escenas: lista, agregadas, puestas };
}

export function limpiarGuion(b = {}) {
  const n = Math.round(+b.consciencia);
  return { titulo: txt(b.titulo, 120), formato: txt(b.formato, 40), avatar: txt(b.avatar, 40) || null, angulo: txt(b.angulo, 400) || null, consciencia: n >= 1 && n <= 5 ? n : null,
    tramos: limpiarTramos(b.tramos), frames: limpiarFrames(b.frames), versiones: limpiarVersiones(b.versiones), caption: txt(b.caption, 2200), estado: ESTADOS_G.includes(b.estado) ? b.estado : 'Borrador', post: txt(b.post, 40) || null, inspo: txt(b.inspo, 40) || null };
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
  const m = [...String(texto || '').matchAll(/```(?:json|guion)\s*([\s\S]*?)```/g)].at(-1); if (!m) return null;
  try { const j = JSON.parse(m[1]); return { titulo: txt(j.titulo, 120), tramos: limpiarTramos(j.tramos), caption: txt(j.caption, 2200), frames: Array.isArray(j.frames) ? limpiarFrames(j.frames) : [] }; } catch { return null; }
}
