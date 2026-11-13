// Las capacidades del Chat: un solo chat, un solo motor por conversación (la sesión del puente), y lo que puede hacer en cada
// turno se prende y se apaga aquí (Código, Figwright, Imágenes, Radar, Video, Herramientas). Puro: sin DOM ni red
// (lo prueba scripts/test-capacidades.mjs). La red vive en chat-code.js; la pantalla, en screens/llm.js.
// Contrato del puente (code-os/puente): GET /capacidades · POST /sessions { capacidades, plan_ejecucion } · PATCH /sessions/:id
// con lo mismo entre turnos · GET /models { modelos, presets } · SSE turn_start { planner, executor } y parentToolUseId.
import { MODELOS_RESPALDO, PRESETS_RESPALDO, NIVELES, COCINA } from './modelos-tabla.js';

// Lo que el Chat sabe de cada capacidad (el nombre y el estado los manda el puente; esto es la cara y las frases).
// alternativas: qué ofrecer, sin inventar, cuando la capacidad no está.
export const CAPACIDADES = [
  { id: 'codigo', nombre: 'Código', icono: 'code', activada: 'Código activado: puedo leer y crear archivos y correr comandos; lo que cambie algo te pide permiso.',
    alternativas: ['Te escribo el código aquí para que lo copies', 'Te explico los pasos para hacerlo tú'] },
  { id: 'figwright', nombre: 'Figwright', icono: 'pen-tool', activada: 'Figwright activado: entro a tu Figma con el plugin abierto y trabajo ahí.',
    alternativas: ['Abre Figma con el plugin de Figwright y vuelve a pedirlo', 'Te describo el diseño paso a paso (medidas, colores y tipografía)', 'Lo armo en código (HTML) para que lo veas ya'] },
  { id: 'imagen', nombre: 'Imágenes', icono: 'image', activada: 'Imágenes activado: cada imagen te pide permiso con su costo antes de generarse.', costo: true,
    alternativas: ['Te escribo el prompt listo para usarlo en otra herramienta', 'Te propongo la composición y las referencias'] },
  { id: 'radar', nombre: 'Radar', icono: 'radar', activada: 'Radar activado: busco qué está pasando en redes y en la competencia.',
    alternativas: ['Trabajo con lo que me pegues aquí (enlaces, capturas, números)', 'Te digo qué revisar y dónde'] },
  { id: 'video', nombre: 'Video', icono: 'video', activada: 'Video activado: trabajo el video con tu permiso en cada paso que cueste o cambie algo.', costo: true,
    alternativas: ['Te dejo el guion y el corte por tomas', 'Te armo la lista de tomas para producción'] },
  { id: 'herramientas', nombre: 'Herramientas', icono: 'wrench', activada: 'Herramientas activado: uso las herramientas del OS y tus conexiones.',
    alternativas: ['Te digo qué herramienta del OS abrir y qué poner'] },
];
export const IDS = CAPACIDADES.map((c) => c.id);
export const capDe = (id) => CAPACIDADES.find((c) => c.id === id) || null;
export const ESTADOS = { lista: 'Lista', sin_conexion: 'Sin conexión', apagada: 'Apagada' };

// MOCK (marcado): lo que se ve mientras el puente no publica GET /capacidades. Código es lo único que el puente ya hace hoy
// (el modo Code); lo demás se muestra «sin conexión» con el motivo real, para no prometer lo que no hay.
const MOTIVO_MOCK = 'El puente todavía no informa esta capacidad (falta GET /capacidades en code-os/puente).';
export const CAPACIDADES_RESPALDO = CAPACIDADES.map((c) => ({ id: c.id, nombre: c.nombre, descripcion: '', estado: c.id === 'codigo' ? 'lista' : 'sin_conexion', ...(c.id === 'codigo' ? {} : { motivo: MOTIVO_MOCK }), mock: true }));

/** La respuesta de GET /capacidades → la lista en el orden del Chat, con lo que falte rellenado como sin conexión. */
export function normalizarCapacidades(j, { mock = false } = {}) {
  const xs = Array.isArray(j?.capacidades) ? j.capacidades : [];
  return CAPACIDADES.map((c) => {
    const x = xs.find((y) => y?.id === c.id);
    const estado = ESTADOS[x?.estado] ? x.estado : 'sin_conexion';
    return { id: c.id, nombre: String(x?.nombre || c.nombre), descripcion: String(x?.descripcion || ''), estado, motivo: estado === 'lista' ? '' : String(x?.motivo || (x ? '' : 'El puente no la menciona.')), ...(mock ? { mock: true } : {}) };
  });
}

// ---- Las capacidades de UNA conversación ----
// { on: [ids], auto: [ids prendidos por intención], apagadas: [ids que la persona apagó a mano: la intención ya no los prende solos] }
export const vacias = () => ({ on: [], auto: [], apagadas: [] });
export function normal(c) {
  const ok = (xs) => [...new Set((Array.isArray(xs) ? xs : []).filter((x) => IDS.includes(x)))];
  return { on: ok(c?.on), auto: ok(c?.auto), apagadas: ok(c?.apagadas) };
}
/** Prender o apagar a mano. Apagar a mano recuerda que no se vuelva a prender sola en esta conversación. */
export function alternar(c, id, prender) {
  c = normal(c); if (!IDS.includes(id)) return c;
  const sigue = prender ?? !c.on.includes(id);
  return sigue
    ? { on: [...new Set([...c.on, id])], auto: c.auto.filter((x) => x !== id), apagadas: c.apagadas.filter((x) => x !== id) }
    : { on: c.on.filter((x) => x !== id), auto: c.auto.filter((x) => x !== id), apagadas: [...new Set([...c.apagadas, id])] };
}

/** El estado de cada chip para pintarlo: { id, nombre, icono, estado, motivo, on, auto, mock }. */
export function chips(c, catalogo = CAPACIDADES_RESPALDO) {
  c = normal(c);
  return CAPACIDADES.map((k) => {
    const x = catalogo.find((y) => y.id === k.id) || { estado: 'sin_conexion', motivo: 'El puente no la menciona.' };
    return { id: k.id, nombre: x.nombre || k.nombre, icono: k.icono, estado: x.estado, motivo: x.motivo || '', on: c.on.includes(k.id) && x.estado === 'lista', pedida: c.on.includes(k.id), auto: c.auto.includes(k.id), mock: Boolean(x.mock) };
  });
}
/** Las que de verdad viajan al puente en este turno: prendidas y listas. */
export const activas = (c, catalogo) => chips(c, catalogo).filter((x) => x.on).map((x) => x.id);

/**
 * Lo que la intención del texto hace con las capacidades. detectadas: [{ id, motivo }] (router-code.js · detectarCapacidades).
 * → { caps, avisos: [{ id, tipo: 'activada' | 'sin' | 'apagada' | 'propuesta', texto, motivo, alternativas }] }
 *   · lista y no apagada a mano → se prende sola (tipo 'activada', con su frase; se puede apagar al instante).
 *   · lista pero la persona la apagó en esta conversación → solo se propone.
 *   · sin conexión o apagada en el puente → no se prende: se dice claro y se ofrecen alternativas (nunca se finge).
 */
export function porIntencion(c, detectadas = [], catalogo = CAPACIDADES_RESPALDO) {
  let caps = normal(c); const avisos = [];
  for (const d of detectadas) {
    const k = capDe(d.id); if (!k) continue;
    const x = catalogo.find((y) => y.id === d.id) || { estado: 'sin_conexion', motivo: '' };
    if (caps.on.includes(d.id) && x.estado === 'lista') continue; // ya estaba: nada que decir
    if (x.estado === 'lista' && caps.apagadas.includes(d.id)) { avisos.push({ id: d.id, tipo: 'propuesta', texto: `¿Prendo ${k.nombre}? ${d.motivo}.`, motivo: d.motivo, alternativas: [] }); continue; }
    if (x.estado === 'lista') { caps = { ...caps, on: [...caps.on, d.id], auto: [...new Set([...caps.auto, d.id])] }; avisos.push({ id: d.id, tipo: 'activada', texto: k.activada, motivo: d.motivo, alternativas: [] }); continue; }
    avisos.push({ id: d.id, tipo: x.estado === 'apagada' ? 'apagada' : 'sin', texto: `${k.nombre} ${x.estado === 'apagada' ? 'está apagada' : 'no está conectado'} ahora${x.motivo ? `: ${x.motivo}` : '.'}`, motivo: x.motivo || '', alternativas: k.alternativas });
  }
  return { caps, avisos };
}

/** Lo que el modelo debe saber de lo que NO tiene en este turno (para que no diga que lo hizo). */
export function reglaSinCapacidad(avisos = []) {
  const no = avisos.filter((a) => a.tipo === 'sin' || a.tipo === 'apagada' || a.tipo === 'propuesta');
  if (!no.length) return '';
  return `CAPACIDADES QUE NO TIENES EN ESTE TURNO: ${no.map((a) => capDe(a.id)?.nombre).join(', ')}. No digas que lo hiciste ni simules el resultado. Dilo en una línea y ofrece una alternativa concreta.`;
}

// ---- El motor: una sesión del puente que cambia por turno ----
/** mode del puente: chat = el mismo motor sin herramientas; code = con lo que esté prendido. */
export const modoMotor = (caps = []) => (caps.length ? 'code' : 'chat');

/**
 * El cuerpo de lo que cambia entre turnos (PATCH /sessions/:id). prev: lo último que se mandó (o null si la sesión es nueva).
 * Solo viaja lo distinto; {} si nada cambió (y entonces no se manda PATCH). conContrato=false (puente viejo, mock): solo model y mode.
 */
export function parcheTurno(prev, sig, { conContrato = true } = {}) {
  const out = {};
  if (sig.model && sig.model !== prev?.model) out.model = sig.model;
  if (sig.mode && sig.mode !== prev?.mode) out.mode = sig.mode;
  if (!conContrato) return out;
  const a = [...(prev?.capacidades || [])].sort().join(','), b = [...(sig.capacidades || [])].sort().join(',');
  if (a !== b || !prev) out.capacidades = [...(sig.capacidades || [])];
  if (JSON.stringify(prev?.plan_ejecucion ?? false) !== JSON.stringify(sig.plan_ejecucion ?? false)) out.plan_ejecucion = sig.plan_ejecucion ?? false;
  return out;
}

// ---- Modelos y presets (GET /models) ----
/** → { modelos, presets, mock } con lo que mande el puente; si no manda catálogo, el respaldo (MOCK). */
export function normalizarModelos(j) {
  const ms = Array.isArray(j?.modelos) ? j.modelos.filter((m) => m?.id) : [];
  const ps = Array.isArray(j?.presets) ? j.presets.filter((p) => p?.id && p.planifica && p.ejecuta) : [];
  if (!ms.length) return { modelos: MODELOS_RESPALDO, presets: PRESETS_RESPALDO, mock: true };
  const modelos = ms.map((m) => ({ id: String(m.id), nombre: String(m.nombre || m.id), nivel: ['alto', 'medio', 'bajo'].includes(m.nivel) ? m.nivel : 'medio', roles: Array.isArray(m.roles) ? m.roles : ['ejecuta'], disponible: m.disponible !== false, costo_relativo: +m.costo_relativo || 0, via: String(m.via || '') }));
  const presets = (ps.length ? ps : PRESETS_RESPALDO).map((p, i) => ({ id: String(p.id), nombre: String(p.nombre || p.id), planifica: String(p.planifica), ejecuta: String(p.ejecuta), nota: String(p.nota || ''), destacado: p.destacado ?? (p.id === 'planifica-fuerte' || i === 0) }));
  return { modelos, presets, mock: false };
}
/** Altos, Medios, Bajos — cada grupo con sus modelos (los disponibles primero, luego por costo). */
export function agrupar(modelos = []) {
  return NIVELES.map(([nivel, nombre]) => ({ nivel, nombre, modelos: modelos.filter((m) => m.nivel === nivel).sort((a, b) => (b.disponible - a.disponible) || (b.costo_relativo - a.costo_relativo)) })).filter((g) => g.modelos.length);
}
export const nombreModelo = (cat, id) => cat?.modelos?.find((m) => m.id === id)?.nombre || String(id || '');
const corto = (n) => String(n || '').replace(/\s+\d+(\.\d+)*$/, '').replace(/^Nivel (\w+) del Gateway.*$/, 'Nivel $1');

/**
 * El modelo que de verdad se puede usar: si el elegido no está disponible, el respaldo de su puesto en la COCINA
 * (o el primer disponible del mismo nivel).
 */
export function disponibleO(cat, id) {
  const m = cat?.modelos?.find((x) => x.id === id);
  if (m?.disponible) return id;
  const puesto = Object.values(COCINA).find((p) => p.modelos.includes(id));
  if (puesto) { const otro = puesto.modelos.find((x) => cat?.modelos?.find((y) => y.id === x)?.disponible); if (otro) return otro; if (cat?.modelos?.some((y) => y.id === puesto.respaldo && y.disponible)) return puesto.respaldo; }
  return cat?.modelos?.find((x) => x.nivel === m?.nivel && x.disponible)?.id || cat?.modelos?.find((x) => x.disponible)?.id || id;
}

/**
 * Qué se manda al puente para un preset: { model, plan_ejecucion, linea }. Un preset con el mismo modelo en los dos
 * papeles (o sin capacidades: una plática no se planifica) es un solo modelo, plan_ejecucion false.
 */
export function planDePreset(cat, presetId, { conCaps = true } = {}) {
  const p = cat?.presets?.find((x) => x.id === presetId); if (!p) return null;
  const planifica = disponibleO(cat, p.planifica), ejecuta = disponibleO(cat, p.ejecuta);
  if (!conCaps || planifica === ejecuta) return { preset: p.id, model: conCaps ? ejecuta : planifica, plan_ejecucion: false, linea: '' };
  return { preset: p.id, model: planifica, plan_ejecucion: { planifica, ejecuta }, linea: lineaPlan(nombreModelo(cat, planifica), nombreModelo(cat, ejecuta)) };
}
/** «Opus planifica · Haiku ejecuta» (la línea sutil del hilo). */
export const lineaPlan = (planner, executor) => (planner && executor ? `${corto(planner)} planifica · ${corto(executor)} ejecuta` : '');

// ---- Aprobar gasto: lo que cuesta pide permiso en tarjeta (solo la persona aprueba) ----
/** El costo estimado de un permiso del puente (USD), o null. Acepta costo_usd, costoUsd, input.aprobado_usd o input.costo_usd. */
export function costoDe(p) {
  const v = [p?.costo_usd, p?.costoUsd, p?.estimado_usd, p?.entrada?.aprobado_usd, p?.entrada?.costo_usd, p?.input?.aprobado_usd, p?.input?.costo_usd].find((x) => x != null && x !== '' && Number.isFinite(+x));
  return v == null ? null : Math.max(0, +v);
}
export const dinero = (usd) => (usd == null ? '' : usd < 0.01 && usd > 0 ? 'menos de $0.01' : `$${(+usd).toFixed(2)}`);
/** La respuesta a un permiso con costo: solo «allow» con el monto aprobado, o «deny». Nunca «allow_all». */
export function respuestaCosto(decision, usd) {
  return decision === 'allow' ? { decision: 'allow', aprobado_usd: usd } : { decision: 'deny' };
}

// ---- El hilo ----
/**
 * Los pasos de un turno con planifica/ejecuta: los del ejecutor (padre = parentToolUseId) van plegados bajo el paso del plan
 * que los lanzó. → { pasos: [{ ...paso, hijos: [] }], sueltos: [] } (sueltos: del ejecutor sin un padre visible).
 */
export function plegar(tools = []) {
  const pasos = tools.filter((p) => !p.padre).map((p) => ({ ...p, hijos: [] })), sueltos = [];
  for (const p of tools.filter((x) => x.padre)) { const papa = pasos.find((x) => x.id && x.id === p.padre); if (papa) papa.hijos.push(p); else sueltos.push(p); }
  return { pasos, sueltos };
}
/**
 * Lo hablado que la sesión del puente aún no tiene (lo que pasó por el chat de siempre o antes de su primer turno):
 * desde su última respuesta (motor 'puente') hasta ahora. Como en los departamentos: contexto, no instrucciones.
 */
export function contextoPuente(msgs = [], { nueva = false, max = 6000 } = {}) {
  let k = -1; if (!nueva) msgs.forEach((m, i) => { if (m.r === 'a' && m.motor === 'puente') k = i; });
  const lineas = msgs.slice(k + 1).filter((m) => ['u', 'a'].includes(m.r) && String(m.t || '').trim()).map((m) => `${m.r === 'u' ? 'PERSONA' : 'CHAT'}: ${String(m.t).trim()}`);
  let t = lineas.join('\n\n'); if (t.length > max) t = '…' + t.slice(-(max - 1));
  return t;
}
