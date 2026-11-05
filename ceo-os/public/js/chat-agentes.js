// F4.5 · El Chat como centro (PLAN-GATEWAY §20) · la parte pura, sin pantalla (la prueba npm run test:agentes).
//   · leerMencion: «@investigación revisa AKAI» → qué agente se llamó y qué se le pidió.
//   · modeloDeEtapa / planDe: cada etapa trae su modelo según el flujo (§20.11 y §9); el plan que se platica antes de empezar.
//   · contextoChat: lo hablado en el Chat, recortado, como input «i-chat» del trabajo.
import { tipoDe } from './agentes-flujos.js';
import { leerOutput } from './agentes-flujos.js';
import { hilo } from './agentes-chat-datos.js';
export { hilo, fuentes, archivos, idChatTrabajo } from './agentes-chat-datos.js';

const plano = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const junto = (s) => plano(s).replace(/[^a-z0-9]/g, '');

// → { agente, resto } si el texto empieza con @<agente>; null si no (un correo o una @cuenta de Instagram no son agentes).
// Gana el nombre más largo: «@Diagnóstico de marca …» no se confunde con «@Diagnóstico».
export function leerMencion(texto, agentes = []) {
  const t = String(texto || '').trim(); if (!t.startsWith('@')) return null;
  const palabras = t.slice(1).split(/\s+/);
  for (let k = Math.min(palabras.length, 6); k >= 1; k--) {
    const clave = junto(palabras.slice(0, k).join(' '));
    const agente = agentes.find((a) => [a.nombre, a.agente].filter(Boolean).some((n) => junto(n) === clave));
    if (agente) {
      let resto = t.slice(1); for (const w of palabras.slice(0, k)) resto = resto.slice(resto.indexOf(w) + w.length);
      return { agente, resto: resto.trim() };
    }
  }
  return null;
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

// Las fuentes que puede citar el documento de una etapa: los inputs vivos y la evidencia de esa etapa que nadie quitó.
export function mapaFuentes(run, n) {
  const m = {};
  for (const x of run.inputs || []) if (!x.archivado) m[x.id] = { titulo: x.titulo || x.id, input: true };
  for (const x of run.evidencia || []) if (x.etapa === n && !x.quitada) m[x.id] = { titulo: x.titulo || x.id, url: x.url || '' };
  return m;
}
const attr = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// En el HTML ya dibujado del documento, [w1] [i-…] [m2] se vuelven enlaces a su fuente. Lo que va en <code> no se toca;
// una cita que no existe (o que se quitó) queda tal cual, para que se note.
export function enlazarCitas(htmlDoc, mapa = {}) {
  return String(htmlDoc || '').split(/(<code[\s\S]*?<\/code>)/).map((parte) => (parte.startsWith('<code') ? parte : parte.replace(/\[([\w-]{1,24})\]/g, (todo, id) => {
    const f = mapa[id]; if (!f) return todo;
    if (f.input) return `<button type="button" class="av-cita" data-act="abrir-input" data-id="${attr(id)}" title="${attr(f.titulo)}">${attr(id)}</button>`;
    if (/^https?:\/\//i.test(f.url || '')) return `<a class="av-cita" href="${attr(f.url)}" target="_blank" rel="noreferrer" title="${attr(f.titulo)}">${attr(id)}</a>`;
    return `<span class="av-cita" title="${attr(f.titulo)}">${attr(id)}</span>`;
  }))).join('');
}

// El hilo del Chat: los mensajes y, entre ellos, los eventos de cada trabajo ligado (con su trabajo), por hora.
// Un mensaje sin hora es el que se está escribiendo: va al final. → [{ tipo:'msg', i } | { tipo:'evento', run, x }]
export function hiloChat(msgs = [], runs = []) {
  const xs = msgs.map((m, i) => ({ tipo: 'msg', i, t: m.at ? Date.parse(m.at) : Infinity }));
  for (const run of runs) for (const x of hilo(run, [])) xs.push({ tipo: 'evento', run, x, t: Date.parse(x.at) || 0 });
  return xs.map((y, k) => ({ y, k })).sort((a, b) => a.y.t - b.y.t || a.k - b.k).map(({ y }) => { const { t, ...r } = y; return r; });
}

// El cliente del plan: si la tarjeta pregunta, hay que elegir (nunca se asume); «interno» es trabajo de Inherent, sin cliente.
export function clienteDelPlan(p, slug = '', nombre = '') {
  if (p.sinClientes) return { error: 'No tienes clientes para este trabajo: pídele acceso al CEO' };
  if (!p.clientes) return { cliente: slug, nombre };
  if (!p.cliente) return { error: 'Elige para quién es este trabajo' };
  if (p.cliente === 'interno') return { cliente: '', nombre: '' };
  return { cliente: p.cliente, nombre: p.clientes.find(([s]) => s === p.cliente)?.[1] || '' };
}
// La lectura del CEO/COO: la conversación tiene que ser la del trabajo Y de quien lo encargó.
export const conversacionLigada = (run, sesion) => Boolean(run?.chat?.sesion && sesion?.id === run.chat.sesion && String(sesion.owner).toLowerCase() === String(run.chat.owner).toLowerCase());
