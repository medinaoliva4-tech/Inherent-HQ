// Ventas › Meta: la calculadora de la meta del mes (de la meta para atrás) y el volumen que nos mueve.
// Sin imports del DOM: lo usan la pantalla y las pruebas. Todo sale de los leads (su etapa y su historial).
// Referencias: el pronóstico ponderado de HubSpot (valor × probabilidad de la etapa) y el «rotting» de Pipedrive.

// Probabilidad de cierre por etapa (el CEO las ajusta con lo que de verdad cierra).
export const PROB = { Nuevo: 0.1, Contactado: 0.2, Reunión: 0.4, Propuesta: 0.6, Ganado: 1, Perdido: 0 };
// Días sin tocar para que un trato se vea estancado, por etapa.
export const ROT = { Nuevo: 1, Contactado: 5, Reunión: 7, Propuesta: 7 };
export const OPEN = ['Nuevo', 'Contactado', 'Reunión', 'Propuesta'];
// Lo que se anota en el historial y cuenta como movimiento.
export const KINDS = [['outreach', 'Mensaje de outreach'], ['llamada', 'Llamada'], ['reunion', 'Reunión'], ['propuesta', 'Propuesta enviada'], ['seguimiento', 'Seguimiento']];

const DAY = 864e5;
const ts = (x) => { const t = Date.parse(x || ''); return Number.isFinite(t) ? t : null; };
const etapa = (l) => l.stage || 'Nuevo';
const valor = (l) => +l.value_usd || 0;

// Cuándo se tocó por última vez (historial, siguiente paso o el documento).
export function ultimoToque(l) {
  const xs = [...(l.activity || []).map((a) => ts(a.at)), ts(l._meta?.updated_at), ts(l.created_at)].filter((x) => x != null);
  return xs.length ? Math.max(...xs) : null;
}
export function diasSinTocar(l, now = Date.now()) { const t = ultimoToque(l); return t == null ? null : Math.floor((now - t) / DAY); }
export function estancado(l, now = Date.now(), rot = ROT) { const d = diasSinTocar(l, now); return OPEN.includes(etapa(l)) && d != null && d >= (rot[etapa(l)] ?? 7) ? d : 0; }
export const sinSiguiente = (l, hoy) => OPEN.includes(etapa(l)) && (!l.next_step || !l.next_date);

// Cuándo se ganó: la nota «→ Ganado» del historial o, si no está, la última edición.
export function ganadoEn(l) {
  if (etapa(l) !== 'Ganado') return null;
  const n = [...(l.activity || [])].reverse().find((a) => /→\s*Ganado/.test(a.text || ''));
  return ts(n?.at) ?? ts(l._meta?.updated_at);
}
const enMes = (t, mes) => t != null && new Date(t).toISOString().slice(0, 7) === mes;

// Las tasas reales de los últimos 90 días (null si no hay con qué calcular).
export function tasasReales(leads, now = Date.now()) {
  const desde = now - 90 * DAY, l90 = leads.filter((l) => (ts(l.created_at) ?? ts(l._meta?.created_at) ?? now) >= desde && etapa(l) !== 'Prospecto');
  const llego = (l, s) => (l.activity || []).some((a) => new RegExp(`→\\s*${s}`).test(a.text || '')) || ['Propuesta', 'Ganado'].includes(etapa(l)) && s === 'Propuesta' || etapa(l) === s;
  const ganados = l90.filter((l) => etapa(l) === 'Ganado'), props = l90.filter((l) => llego(l, 'Propuesta') || etapa(l) === 'Ganado');
  const conv = l90.filter((l) => ['Reunión', 'Propuesta', 'Ganado'].includes(etapa(l)) || llego(l, 'Reunión'));
  const ticket = ganados.length ? ganados.reduce((a, l) => a + valor(l), 0) / ganados.length : null;
  return { ticket: ticket || null, cierre: props.length >= 3 ? ganados.length / props.length : null, aPropuesta: conv.length >= 3 ? props.length / conv.length : null, aConversacion: l90.length >= 3 ? conv.length / l90.length : null, n: l90.length };
}

// De la meta para atrás. Los supuestos que faltan usan valores de arranque (y la pantalla los marca).
export const ARRANQUE = { cierre: 0.25, aPropuesta: 0.5, aConversacion: 0.5, respuesta: 0.2 };
export function cascada(meta, sup) {
  const t = sup.ticket, c = sup.cierre ?? ARRANQUE.cierre, p = sup.aPropuesta ?? ARRANQUE.aPropuesta, v = sup.aConversacion ?? ARRANQUE.aConversacion, r = sup.respuesta ?? ARRANQUE.respuesta;
  if (!meta || !t) return null;
  const ventas = Math.ceil(meta / t), propuestas = Math.ceil(ventas / c), conversaciones = Math.ceil(propuestas / p), leads = Math.ceil(conversaciones / v), outreach = Math.ceil(leads / r);
  return { ventas, propuestas, conversaciones, leads, outreach };
}

// Lo que llevamos este mes en cada nivel de la cascada y el volumen de la semana.
export function llevamos(leads, mes, now = Date.now()) {
  const acts = leads.flatMap((l) => (l.activity || []).map((a) => ({ ...a, l })));
  const delMes = (a) => enMes(ts(a.at), mes);
  const lunes = (() => { const d = new Date(now); const k = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); return d.getTime() - k * DAY; })();
  const semana = (a) => (ts(a.at) ?? 0) >= lunes;
  const llega = (s) => (a) => new RegExp(`→\\s*${s}`).test(a.text || '');
  const ganados = leads.filter((l) => enMes(ganadoEn(l), mes));
  const kind = (k) => (a) => a.kind === k;
  return {
    ventas: ganados.length, ganado: ganados.reduce((a, l) => a + valor(l), 0),
    propuestas: new Set(acts.filter((a) => delMes(a) && (llega('Propuesta')(a) || a.kind === 'propuesta')).map((a) => a.l.id)).size,
    conversaciones: new Set(acts.filter((a) => delMes(a) && (llega('Reunión')(a) || a.kind === 'llamada' || a.kind === 'reunion')).map((a) => a.l.id)).size,
    leads: leads.filter((l) => etapa(l) !== 'Prospecto' && enMes(ts(l.created_at) ?? ts(l._meta?.created_at), mes)).length,
    outreach: acts.filter((a) => delMes(a) && a.kind === 'outreach').length,
    semana: Object.fromEntries(KINDS.map(([k]) => [k, acts.filter((a) => semana(a) && kind(k)(a)).length])),
    porDia: Object.fromEntries(KINDS.map(([k]) => [k, Array.from({ length: 5 }, (_, i) => acts.filter((a) => kind(k)(a) && (ts(a.at) ?? 0) >= lunes + i * DAY && (ts(a.at) ?? 0) < lunes + (i + 1) * DAY).length)])),
  };
}

// El pronóstico ponderado (HubSpot): el valor de cada trato abierto por la probabilidad de su etapa.
export const pronostico = (leads, prob = PROB) => leads.filter((l) => OPEN.includes(etapa(l))).reduce((a, l) => a + valor(l) * (prob[etapa(l)] ?? 0), 0);

// Días hábiles (lun-vie) que quedan en el mes, contando hoy.
export function habilesQuedan(now = Date.now()) {
  const d = new Date(now), m = d.getMonth(); let n = 0;
  for (const x = new Date(d.getFullYear(), m, d.getDate()); x.getMonth() === m; x.setDate(x.getDate() + 1)) if (x.getDay() % 6) n++;
  return Math.max(1, n);
}
