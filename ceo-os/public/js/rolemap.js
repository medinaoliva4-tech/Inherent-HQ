// Quién cubre cada rol en un proyecto, en un solo lugar: al cambiarlo se reasignan las tareas abiertas de ese rol.
// Lo usan Equipo (todos los proyectos) y Proyectos (uno). El cambio lo hace el servidor (flow/role) y queda en el historial.
import { html, raw, api, toast } from './core.js';
import { RECIPE_ROLES } from './recipes.js';

export const roleLabel = (r) => RECIPE_ROLES.find(([k]) => k === r)?.[1] || r;
export function roleTable(p, { tasks, team, edit }) {
  const ts = tasks.filter((t) => t.project_id === p.id && t.role);
  const roles = [...new Set([...Object.keys(p.roles_map || {}), ...ts.map((t) => t.role)])].sort((a, z) => RECIPE_ROLES.findIndex(([k]) => k === a) - RECIPE_ROLES.findIndex(([k]) => k === z));
  if (!roles.length) return '';
  const crew = team.filter((x) => x.active !== false && x.kind !== 'ia' && String(x.email || x.id).includes('@'));
  const person = (k) => team.find((t) => t.id === k || t.email === k);
  const cur = (r) => p.roles_map?.[r] || ts.find((t) => t.role === r && t.assignee)?.assignee || '';
  return html`<div class="rolemap">${roles.map((r) => { const open = ts.filter((t) => t.role === r && t.status !== 'Hecha').length, c = cur(r);
    return html`<b style="font-weight:500">${roleLabel(r)}</b>
      ${edit ? html`<select class="in" data-rolesel="${r}" data-pid="${p.id}"><option value="">— sin asignar</option>${crew.map((x) => html`<option value="${x.email || x.id}" ${(x.email || x.id) === c ? raw('selected') : ''}>${x.name}</option>`)}</select>` : html`<span>${person(c)?.name || '—'}</span>`}
      <span class="chip sm2">${open} ${open === 1 ? 'abierta' : 'abiertas'}</span>`; })}</div>`;
}
// Conecta los selects de la tabla: devuelve true si cambió algo (para recargar proyectos y tareas).
export async function changeRole(pid, role, email) {
  if (!email) { toast('Elige a alguien del equipo', true); return false; }
  try { const r = await api('flow/role', { method: 'POST', body: { project_id: pid, role, email } }); toast(r.tareas ? `${r.tareas} ${r.tareas === 1 ? 'tarea reasignada' : 'tareas reasignadas'}` : 'Guardado'); return true; }
  catch (e) { toast(e.message, true); return false; }
}
