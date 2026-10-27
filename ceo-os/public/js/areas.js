// Las áreas del Chat: una por modo del Inherent LLM (llm/modos.js). Son los cinco workspaces de herramientas.js, por su
// modo, más Organización, que no es un workspace pero sí tiene modo en el Chat. Cada una lleva su color (--ui-m-<id> en
// app.css), su ícono y su workspace (ws: '' en Organización). Lo usan el Chat (recordar el modo, los encargos de Estrategia)
// y abrirEnChat, el atajo de las pantallas («Pregúntale al Chat», Consulting, Campañas y eventos y el plan del mes).
// Puro salvo abrirEnChat (lo prueba scripts/test-llm.mjs).
import { WORKSPACES } from './herramientas.js';

// Organización no está en WORKSPACES: cómo se maneja Inherent (tareas, proyectos, leads, el día de cada quien).
const ORGANIZACION = { id: 'organizacion', nombre: 'Organization', sub: 'Cómo se maneja Inherent', icono: 'clipboard', modo: 'organizacion', ws: '' };
// El orden del Chat: Strategy · Organization · Marketing · Creative · Consulting · Production (un workspace nuevo va al final).
const ORDEN = ['estrategia', 'organizacion', 'marketing', 'diseno', 'consulting', 'produccion'];
const pos = (id) => { const i = ORDEN.indexOf(id); return i < 0 ? ORDEN.length : i; };
export const AREAS = [ORGANIZACION, ...WORKSPACES.map((w) => ({ id: w.modo, nombre: w.nombre, sub: w.sub, icono: w.icono, modo: w.modo, ws: w.id }))]
  .sort((a, b) => pos(a.id) - pos(b.id));
export const areaDe = (id) => AREAS.find((a) => a.id === id) || null;
export const areaDeModo = (m) => AREAS.find((a) => a.modo === m) || null;

// El modo elegido se recuerda por persona en este navegador: lo escriben el Chat y abrirEnChat.
const K = (email) => `os.area.${email || ''}`;
export function areaGuardada(email) { try { return localStorage.getItem(K(email)) || ''; } catch { return ''; } }
export function guardarArea(email, id) { try { localStorage.setItem(K(email), id); } catch {} }

// Abrir el Chat con un pedido escrito: en el modo de un área, con su cliente o marca y (opcional) el mes del plan. Lo usan
// «Pregúntale al Chat», Consulting, Campañas y eventos y el plan del mes. Lo único de este archivo que toca el navegador.
export function abrirEnChat(email, { modo, slug = '', borrador = '', mes = '' } = {}) {
  const k = `os.llm.${email}`; let p = {};
  try { p = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch {}
  p.modo = modo; if (slug) p.slugs = { ...(p.slugs || {}), [modo]: slug };
  if (borrador) p.borrador = borrador; if (mes) p.mes = mes;
  try { localStorage.setItem(k, JSON.stringify(p)); } catch {}
  guardarArea(email, areaDeModo(modo)?.id || '');
  if (typeof location !== 'undefined') location.hash = '/chat';
}
