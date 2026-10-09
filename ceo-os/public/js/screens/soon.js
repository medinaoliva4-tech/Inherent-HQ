import { html, mount } from '../core.js';
const PHASE = { finanzas: 'Fase 2', operations: 'Fase 2', library: 'Fase 3', content: 'Fase 4' };
export function render(el, { area, label }) {
  mount(el, html`<div class="hello"><h1>${label}</h1><p>En construcción · <em>${PHASE[area] || 'pronto'}</em>.</p></div>
  <div class="empty"><b>Esta pantalla llega en la ${PHASE[area] || 'siguiente fase'}</b>Ya está el diseño aprobado. Primero van Home, Sales y Team.</div>`);
}
