import { h, dato, frame, empty, button, status } from './dom.js';
export function WorkflowView({ title = 'Flujo de trabajo', steps = [] } = {}) {
  const el = frame(title, 'Cada paso declara sus dependencias.');
  el.append(steps.length ? h('ol', { class: 'kit-workflow' }, steps.map((s) => h('li', {}, h('strong', {}, s.label), h('span', {}, ` · ${dato(s.state)}`), h('p', { class: 'kit-muted' }, s.dependsOn?.length ? `Depende de: ${s.dependsOn.map((id) => steps.find((x) => x.id === id)?.label || `Origen ausente (${id})`).join(', ')}` : 'Sin dependencias')))) : empty()); return el;
}
export function Timeline({ title = 'Hitos', events = [] } = {}) { const el = frame(title); el.append(events.length ? h('ol', { class: 'kit-timeline' }, events.map((e) => h('li', { 'aria-current': e.current ? 'step' : null }, h('time', { dateTime: e.date || null }, dato(e.date)), h('strong', {}, e.label), h('span', {}, dato(e.state))))) : empty()); return el; }
export function VisualCanvas({ title = 'Hilo visual', nodes = [], edges = [], onSelect, onMove } = {}) {
  const el = frame(title, 'Misma información en lienzo y lista accesible.'), host = h('div', { class: 'kit-canvas', 'aria-label': title }), state = status('Cargando el lienzo…'); let disposed = false, destroy;
  el.append(host, state, h('details', {}, h('summary', {}, 'Ver nodos y conexiones como lista'), h('ul', {}, nodes.map((n) => h('li', {}, button(`${n.label} · ${dato(n.state)}`, () => onSelect?.(n.id)), h('span', {}, ` · Recibe de: ${edges.filter((e) => e.target === n.id).map((e) => nodes.find((x) => x.id === e.source)?.label || e.source).join(', ') || 'ninguno'}`))))));
  if (!nodes.length) { host.append(empty('El hilo empieza cuando guardas un resultado.')); state.textContent = ''; }
  else { if (!document.querySelector('link[data-vision-flow]')) document.head.append(h('link', { rel: 'stylesheet', href: '/vendor/vision-flow/vision-flow.css', 'data-vision-flow': '1' })); import('/vendor/vision-flow/vision-flow.js').then((m) => { if (disposed) return; destroy = m.mountFlow(host, { nodes, edges, onSelect: (id) => onSelect?.(id), onMove: (id, position) => onMove?.(id, position) }); state.textContent = ''; }).catch(() => { state.textContent = 'El lienzo no está disponible. Puedes trabajar con la lista.'; host.hidden = true; }); }
  el.destroy = () => { disposed = true; destroy?.(); }; return el;
}
