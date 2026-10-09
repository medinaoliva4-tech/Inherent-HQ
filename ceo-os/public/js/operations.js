import { h, api, Q } from './core.js';

// Fase 1: la vista de clientes, leída del repo. Proyectos, tareas y timeline llegan en fase 2.
export async function render(el, { me }) {
  const { clients } = await api('/api/clients');
  el.append(h('h2', {}, '⚙️ Operations'), h('p', { class: 'sub' }, 'Los clientes salen de clients/*/00-onboarding/plan-contratado.md. Lo que no existe, no se supone.'));
  if (!clients.length) { el.append(h('p', { class: 'warn' }, '⚠️ SIN DATOS — no hay clientes en el repo.')); return; }
  el.append(h('div', { class: 'grid g2' }, clients.map((c) => h('div', { class: 'card' },
    h('h4', {}, c.slug),
    c.hasPlan ? [
      h('div', { class: 'big' }, c.plan.replace(/^⬜\s*/, '') || '—'),
      c.precio ? h('div', { class: 'sm mut' }, `${Q(c.precio)} / mes`) : null,
      c.fields.find((f) => f.secret) ? h('div', { class: 'sm' }, '🔒 ' + c.fields.find((f) => f.secret).key + ': ' + c.fields.find((f) => f.secret).value) : null,
      h('div', { class: 'chips' }, c.pipeline.map((p) => h('span', { class: 'chip', title: p.que }, p.paso))),
      h('details', { style: { marginTop: '10px' } }, h('summary', { class: 'sm mut' }, 'Ficha del plan'),
        h('table', {}, h('tbody', {}, c.fields.map((f) => h('tr', {}, h('td', { class: 'mut sm' }, f.key), h('td', { class: 'sm' }, f.value)))))),
    ] : h('p', { class: 'warn' }, '⚠️ SIN DATOS — no hay plan-contratado.md'))))); 
}
