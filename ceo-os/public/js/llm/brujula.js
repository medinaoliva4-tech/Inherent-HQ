// La Brújula del Inherent LLM: la meta medible de una conversación, sus tareas, el aviso cuando la conversación se desvía
// y el ritmo de uso de la semana. Puro (lo prueba scripts/test-llm.mjs): llm.js la guarda por conversación y el harness la
// manda en cada turno, para que el agente trabaje en la tarea de ahora y no en lo que se le ocurra.
//   b = { meta, medida, vence, tipo: 'proyecto', tareas: [{ t, quien: 'ia' | 'tu', hecha }], desde, giros }
const corta = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export const QUIEN = { ia: 'IA', tu: 'TÚ' };
export const UMBRAL_DESVIO = 3; // turnos seguidos sin que se mueva ninguna tarea

// La propuesta que manda el agente en el bloque ```meta``` → limpia (o null si no sirve).
export function leerMeta(j) {
  if (!j || typeof j !== 'object') return null;
  const tareas = (Array.isArray(j.tareas) ? j.tareas : []).map((x) => (typeof x === 'string' ? { t: x } : x || {}))
    .map((x) => ({ t: corta(x.t || x.tarea || x.titulo, 90), quien: x.quien === 'tu' || x.quien === 'tú' ? 'tu' : 'ia' })).filter((x) => x.t).slice(0, 8);
  const propuesta = corta(j.propuesta || j.meta, 200);
  if (!propuesta) return null;
  return { propuesta, por_que: corta(j.por_que, 160), meta: corta(j.meta || j.propuesta, 120), medida: corta(j.medida, 80), vence: corta(j.vence, 40), tipo: j.tipo === 'tarea' ? 'tarea' : 'proyecto', tareas };
}
// El avance que manda el agente en el bloque ```avance``` → { hechas: [..] }.
export function leerAvance(j) {
  if (!j || typeof j !== 'object') return null;
  const hechas = (Array.isArray(j.hechas) ? j.hechas : j.hecha ? [j.hecha] : []).map((x) => corta(x, 90)).filter(Boolean).slice(0, 8);
  return hechas.length ? { hechas } : null;
}

export function crearBrujula(m, ahora = Date.now()) {
  const tareas = (m.tareas?.length ? m.tareas : [{ t: m.propuesta, quien: 'ia' }]).map((x) => ({ t: x.t, quien: x.quien === 'tu' ? 'tu' : 'ia', hecha: false }));
  return { meta: m.meta || m.propuesta, medida: m.medida || '', vence: m.vence || '', tipo: m.tipo || 'proyecto', tareas, desde: ahora, giros: 0 };
}
export const progreso = (b) => { const total = b?.tareas?.length || 0, hechas = (b?.tareas || []).filter((x) => x.hecha).length; return { hechas, total, pct: total ? Math.round((hechas / total) * 100) : 0 }; };
export const tareaActual = (b) => (b?.tareas || []).find((x) => !x.hecha) || null;
export const terminada = (b) => Boolean(b?.tareas?.length) && !tareaActual(b);

// Marcar o desmarcar una tarea (por índice). Mover una tarea reinicia el contador de desvío.
export function marcar(b, i, hecha = true) {
  if (!b?.tareas?.[i]) return b;
  return { ...b, tareas: b.tareas.map((x, k) => (k === i ? { ...x, hecha } : x)), giros: 0 };
}
// Lo que el agente dice que terminó: se busca por nombre, sin importar acentos ni mayúsculas.
export function aplicarAvance(b, av) {
  if (!b || !av?.hechas?.length) return b;
  let movio = false;
  const tareas = b.tareas.map((x) => {
    if (x.hecha) return x;
    const n = norm(x.t);
    const ok = av.hechas.some((h) => { const m = norm(h); return m && (m === n || n.includes(m) || m.includes(n)); });
    if (ok) movio = true;
    return ok ? { ...x, hecha: true } : x;
  });
  return movio ? { ...b, tareas, giros: 0 } : b;
}
// Un turno de la persona sin que se haya movido nada.
export const contarGiro = (b) => (b && !terminada(b) ? { ...b, giros: (b.giros || 0) + 1 } : b);
export const desviado = (b, umbral = UMBRAL_DESVIO) => Boolean(b && tareaActual(b) && (b.giros || 0) >= umbral);

// Lo que el harness le dice al agente en cada turno.
export function contextoBrujula(b) {
  if (!b) return '';
  const { hechas, total } = progreso(b), ahora = tareaActual(b);
  return [
    `BRÚJULA DE ESTA CONVERSACIÓN · meta: ${b.meta}${b.medida ? ` · medida: ${b.medida}` : ''}${b.vence ? ` · vence: ${b.vence}` : ''} · ${hechas} de ${total} tareas.`,
    ...b.tareas.map((x) => `- [${x.hecha ? 'x' : ' '}] ${x.t} (${x.quien === 'tu' ? 'la hace la persona' : 'la haces tú'})`),
    ahora ? `TAREA ACTUAL: ${ahora.t}. Trabaja en ella. Si la persona se aleja de la meta, dilo en una línea (qué está explorando) y propón volver a la tarea actual.` : 'Todas las tareas están hechas: cierra con un resumen corto y lo que sigue.',
    (b.giros || 0) >= UMBRAL_DESVIO ? `Llevan ${b.giros} turnos sin mover ninguna tarea.` : '',
  ].filter(Boolean).join('\n');
}

// ---------- El uso de la semana ----------
// La semana empieza el lunes a las 00:00 (hora de la compu).
export function inicioSemana(ahora = Date.now()) {
  const d = new Date(ahora); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}
// usados contra el límite que puso la persona → { pct, ideal (dónde «debería» ir a esta hora de la semana), porDia, dias }
export function ritmoSemana({ usados = 0, limite = 0, ahora = Date.now() } = {}) {
  const ini = inicioSemana(ahora), semana = 7 * 864e5, pasado = Math.min(1, Math.max(0, (ahora - ini) / semana));
  const dias = Math.max(1, Math.ceil(((1 - pasado) * semana) / 864e5));
  if (!limite || limite <= 0) return { pct: null, ideal: Math.round(pasado * 100), porDia: null, dias, usados };
  const pct = Math.min(999, Math.round((usados / limite) * 100));
  return { pct, ideal: Math.round(pasado * 100), porDia: Math.max(0, Math.round((100 - pct) / dias)), dias, usados };
}
// Cuánto se usó una conversación: las llamadas al modelo si Hermes las da; si no, la mitad de sus mensajes (un ida y vuelta).
export const usosDe = (s) => (Number.isFinite(+s?.api_call_count) && +s.api_call_count > 0 ? +s.api_call_count : Math.ceil((+s?.message_count || 0) / 2));
