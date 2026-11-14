import { html, api } from './core.js';
import { dialog } from './ui.js';
export async function revisarAccionesExternas(actions) {
  const results = [];
  for (const action of actions) {
    const decision = await dialog({ titulo: 'Revisa antes de ejecutar', x: false, cerrarFuera: false,
      cuerpo: html`<p>${action.conector} · ${action.tool}</p><p>Alcance: ${action.scope || 'organización'}</p><details open><summary>Contenido exacto</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${JSON.stringify(action.params, null, 2)}</pre></details>`,
      acciones: [{ label: 'Aprobar y ejecutar', value: 'approve', tipo: 'primario' }, { label: 'Dejar pendiente', value: '', tipo: 'ghost' }],
    }).cerrado;
    if (decision !== 'approve') { results.push({ id: action.id, estado: 'needs_approval', texto: 'Pendiente de tu aprobación. No se ejecutó.' }); continue; }
    results.push(await api(`ia/acciones/${encodeURIComponent(action.id)}/aprobar`, { method: 'POST', body: { expected_version: action.version, hash: action.hash } }));
  }
  return results;
}
