// Agent Area (#/ai/agentes…). Un AGENTE es quien trabaja (su workflow, su IA, sus conexiones); un TRABAJO es un encargo
// concreto que hace etapa por etapa, con tu aprobación.
//   #/ai/agentes                              → la lista de agentes (todas las áreas)
//   #/ai/agentes/<agente>[/<pestaña>]         → el portal del agente: Overview · Workflow · Trabajos · Settings
//   #/ai/agentes/<agente>/trabajos/<trabajo>  → va al Chat: #/chat/trabajo/<trabajo> (PLAN-GATEWAY §20)
//   #/ai/agentes/<agente>/trabajos/<trabajo>/etapas → la vista por etapas: historial y detalle, solo lectura (agentes-run.js)
// Cada agente vive en un área: también sale en #/areas/<área>/agents.
import { html, mount, ico, skel } from '../core.js';
import { pintarAgentes } from '../agentes-ui.js';
import { pintarPortal } from '../agentes-portal.js';
import { pintarRun } from '../agentes-run.js';

export const esqueleto = () => skel('pagina');
const ID = /^[\w-]{4,60}$/;

export async function render(el, { me, sub = [], alive }) {
  const [agente, tab, trabajo, vista] = sub;
  if (ID.test(agente || '') && tab === 'trabajos' && ID.test(trabajo || '')) { if (vista === 'etapas') return pintarRun(el, me, trabajo, alive); location.replace(`#/chat/trabajo/${trabajo}`); return; }
  if (ID.test(agente || '')) return pintarPortal(el, me, agente, tab || 'overview', alive);
  mount(el, html`<div></div>`);
  const tabs = html`<nav class="iai-tabs" aria-label="Inherent AI"><a href="#/chat">${ico('chat', 14)} Chat</a><a href="#/ai/agentes" aria-current="page">${ico('agents', 14)} Agentes</a><a href="#/ai/mcps">${ico('puzzle', 14)} MCPs</a></nav>`;
  const box = document.createElement('div');
  mount(el, tabs); el.appendChild(box);
  return pintarAgentes(box, me, alive, { titulo: 'Agentes' });
}
