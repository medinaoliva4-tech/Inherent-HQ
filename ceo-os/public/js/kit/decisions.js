import { h, dato, frame, empty, status, button } from './dom.js';
export function DecisionCard({ title = 'Decisión', proposal = '', evidence = '', alternative = '', actions = [], onAction, context = {} } = {}) {
  const el = frame(title, proposal), state = status(''), controls = h('div', { class: 'kit-actions' });
  if (evidence) el.append(h('p', {}, 'Evidencia: ', evidence));
  if (alternative) el.append(h('p', { class: 'kit-muted' }, 'Alternativa: ', alternative));
  for (const a of actions) controls.append(button(a.label, async () => { controls.querySelectorAll('button').forEach((b) => b.disabled = true); state.textContent = 'Esperando confirmación del servidor…'; try { const out = await onAction(a.id, { ...context }); if (!out?.ok) throw new Error(out?.error || 'El servidor no confirmó el cambio.'); state.textContent = out.message || 'Cambio confirmado.'; el.dispatchEvent(new CustomEvent('kit:action', { bubbles: true, detail: { id: a.id, result: out } })); } catch (e) { state.textContent = e.message || 'No se pudo completar. Vuelve a revisar.'; } finally { controls.querySelectorAll('button').forEach((b) => b.disabled = !onAction); } }, !onAction));
  el.append(controls, state); if (!actions.length || !onAction) el.append(empty('Sin una acción conectada; esta vista es de lectura.')); return el;
}
export function Approval({ title = 'Aprobación', history = [], onAction, ...props } = {}) {
  const el = DecisionCard({ ...props, title, onAction, actions: [{ id: 'approve', label: 'Aprobar' }, { id: 'changes', label: 'Pedir cambios' }, { id: 'reject', label: 'Rechazar' }] }), log = h('ol', { class: 'kit-history' });
  const paint = () => log.replaceChildren(...history.map((x) => h('li', {}, `${dato(x.at)} · ${x.action} · ${x.by || 'Sin actor documentado'}`)));
  el.addEventListener('kit:action', (e) => { if (e.detail.result.history) { history = e.detail.result.history; paint(); } });
  el.append(h('h3', {}, 'Historial'), log); paint(); return el;
}
