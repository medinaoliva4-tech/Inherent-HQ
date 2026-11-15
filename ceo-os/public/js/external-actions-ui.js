import { api } from './core.js';
import { dialog } from './ui.js';
import { DecisionCard } from './kit/decisions.js';
import { h } from './kit/dom.js';
export async function revisarAccionesExternas(actions) {
  const results = [];
  for (const action of actions) {
    let result = null, modal;
    const card = DecisionCard({ title: 'Acción propuesta', proposal: `${action.conector} · ${action.tool}`, evidence: `Alcance: ${action.scope || 'organización'}`,
      actions: [{ id: 'approve', label: 'Aprobar y ejecutar' }, { id: 'pending', label: 'Dejar pendiente' }],
      context: { id: action.id, expected_version: action.version, hash: action.hash },
      onAction: async (id, exact) => {
        if (id === 'pending') { modal.cerrar('pending'); return { ok: true }; }
        result = await api(`ia/acciones/${encodeURIComponent(exact.id)}/aprobar`, { method: 'POST', body: { expected_version: exact.expected_version, hash: exact.hash } });
        modal.cerrar('executed'); return { ok: true, message: result.texto };
      },
    });
    card.classList.add('kit-embedded');
    card.querySelector('.kit-actions').before(h('details', { open: true }, h('summary', {}, 'Contenido exacto'), h('pre', {}, JSON.stringify(action.params, null, 2))));
    modal = dialog({ titulo: 'Revisa antes de ejecutar', x: false, cerrarFuera: false, cuerpo: card, formulario: false });
    await modal.cerrado;
    results.push(result || { id: action.id, estado: 'needs_approval', texto: 'Pendiente de tu aprobación. No se ejecutó.' });
  }
  return results;
}
