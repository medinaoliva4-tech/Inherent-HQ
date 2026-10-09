import { h } from './core.js';
export function render(el, { meta }) {
  el.append(h('div', { class: 'soon' }, h('div', {},
    h('div', { style: { fontSize: '48px' } }, meta.icon),
    h('h2', {}, meta.name),
    h('p', {}, '🚧 Fase 2. Primero Finanzas, Sales y Operations.'))));
}
