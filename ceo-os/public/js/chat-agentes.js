// F4.5 · El Chat como centro (PLAN-GATEWAY §20) · la parte pura, sin pantalla (la prueba npm run test:agentes).
//   · leerMencion: «@investigación revisa AKAI» → qué agente se llamó y qué se le pidió.
//   · modeloDeEtapa / planDe: cada etapa trae su modelo según el flujo (§20.11 y §9); el plan que se platica antes de empezar.
//   · contextoChat: lo hablado en el Chat, recortado, como input «i-chat» del trabajo.
import { tipoDe } from './agentes-flujos.js';
import { leerOutput } from './agentes-flujos.js';
export { hilo, fuentes, archivos, idChatTrabajo } from './agentes-chat-datos.js';

const plano = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const junto = (s) => plano(s).replace(/[^a-z0-9]/g, '');

// → { agente, resto } si el texto empieza con @<agente>; null si no (un correo o una @cuenta de Instagram no son agentes).
export function leerMencion(texto, agentes = []) {
  const m = /^@(\S+)\s*([\s\S]*)$/.exec(String(texto || '').trim());
  if (!m) return null;
  const k = junto(m[1]);
  const agente = agentes.find((a) => [a.nombre, a.agente].filter(Boolean).some((n) => junto(n) === k));
  // Nombres de dos palabras («@Growth Partner …»): se prueba también con la palabra siguiente.
  if (!agente) {
    const dos = /^@(\S+\s+\S+)\s*([\s\S]*)$/.exec(String(texto || '').trim());
    const a2 = dos && agentes.find((a) => [a.nombre, a.agente].filter(Boolean).some((n) => junto(n) === junto(dos[1])));
    return a2 ? { agente: a2, resto: dos[2].trim() } : null;
  }
  return { agente, resto: m[2].trim() };
}

// El modelo de cada tipo de etapa (§9): analizar y decidir con Pro; investigar, armar y revisar con Flash.
export const MODELO_POR_TIPO = { investigacion: 'deepseek-v4-flash', analisis: 'deepseek-v4-pro', decision: 'deepseek-v4-pro', entregable: 'deepseek-v4-flash', validacion: 'deepseek-v4-flash' };
export const PREF_GW = ['deepseek-v4-flash', 'deepseek-v4-pro'];
export function modeloDeEtapa(e = {}, modelosGw = []) {
  const quiere = e.modelo || MODELO_POR_TIPO[tipoDe(e.tipo).id] || PREF_GW[0];
  if (modelosGw.includes(quiere)) return quiere;
  return PREF_GW.find((m) => modelosGw.includes(m)) || modelosGw[0] || quiere;
}
// El plan que se platica en el Chat antes de empezar (la tarjeta «Así lo voy a trabajar»).
export const planDe = (flujo = {}, modelosGw = []) => (flujo.etapas || []).map((e, n) => ({
  n, nombre: e.nombre, entrega: leerOutput(e.entrega || e.output, e.nombre).titulo, modelo: modeloDeEtapa(e, modelosGw), gate: Boolean(e.gate), aporte: Boolean(e.aporte?.pregunta),
}));

// Lo hablado en el Chat → texto para el input «i-chat». De lo más nuevo hacia atrás hasta 6,000 caracteres, en orden.
export const MAX_CONTEXTO = 6000;
export function contextoChat(msgs = [], resumen = '') {
  const lineas = [];
  let usado = resumen ? Math.min(resumen.length, 1500) + 40 : 0;
  for (const m of [...msgs].reverse()) {
    const t = String(m.t || '').trim(); if (!t || !['u', 'a'].includes(m.r)) continue;
    const l = `${m.r === 'u' ? 'PERSONA' : 'CHAT'}: ${t}`;
    if (usado + l.length + 2 > MAX_CONTEXTO) { if (!lineas.length) lineas.push(l.slice(-(MAX_CONTEXTO - usado - 2))); break; }
    lineas.push(l); usado += l.length + 2;
  }
  const cuerpo = lineas.reverse().join('\n\n');
  return (resumen ? `RESUMEN DE ANTES: ${String(resumen).slice(0, 1500)}\n\n${cuerpo}` : cuerpo).slice(0, MAX_CONTEXTO);
}
