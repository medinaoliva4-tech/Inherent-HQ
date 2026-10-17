// Tipo de tarea y su SOP: lo comparten el Workspace y Operations.
// Tipo: Delivery (trabajo para el cliente), Comercial, Interna o Personal (solo la ve quien la creó).
// SOP: el id de un documento de la Library, o un link.
import { html, raw, ico, $ } from './core.js';

export const TIPOS = [['Delivery', 'Delivery'], ['Comercial', 'Comercial'], ['Interna', 'Interna'], ['Personal', 'Personal']];
export const TIPO_DESC = { Delivery: 'Trabajo para el cliente', Comercial: 'Ventas y propuestas', Interna: 'Operación de Inherent', Personal: 'Solo la ves tú' };
export const tipoOf = (t) => (TIPOS.some(([k]) => k === t?.tipo) ? t.tipo : '');
export const isLink = (s) => /^https?:\/\/\S+$/i.test(String(s || ''));

// Los documentos que sirven de SOP: primero los SOP, luego el resto de la Library.
const sopDocs = (docs = []) => [...docs.filter((d) => d.kind === 'SOP'), ...docs.filter((d) => d.kind !== 'SOP' && d.kind !== 'Prompt')];
const docOf = (docs, id) => (docs || []).find((d) => d.id === id);
export const sopHref = (t, docs) => {
  if (!t?.sop) return '';
  if (isLink(t.sop)) return t.sop;
  const d = docOf(docs, t.sop); return d ? `#/library/${d.folder_id || '_'}/${d.id}` : '';
};

// El SOP de la tarea como link para abrir (vacío si no tiene).
export function sopLink(t, docs) {
  const href = sopHref(t, docs); if (!href) return '';
  const ext = isLink(t.sop), name = ext ? t.sop.replace(/^https?:\/\//, '').slice(0, 48) : docOf(docs, t.sop)?.title || 'SOP';
  return html`<a class="sm" id="sopopen" href="${href}" ${ext ? raw('target="_blank" rel="noopener noreferrer"') : ''} style="display:inline-block;margin-top:12px;color:#87684e;font-weight:500">${ico('doc', 15)} Abrir el SOP · ${name} ${ico('right', 13)}</a>`;
}

// Los dos campos de la ficha: Tipo y SOP. `pre` es el prefijo de los ids (para no chocar con otros campos).
export function tipoSopFields(t, docs, pre = 't') {
  const list = sopDocs(docs), cur = t.sop || '';
  const link = isLink(cur), known = !cur || link || list.some((d) => d.id === cur);
  return html`<div class="two"><div><label class="f">Tipo</label><select class="in" id="${pre}tipo"><option value="">— Sin tipo</option>${TIPOS.map(([k, l]) => html`<option value="${k}" ${k === tipoOf(t) ? raw('selected') : ''}>${l} · ${TIPO_DESC[k]}</option>`)}</select></div>
    <div><label class="f">SOP</label><select class="in" id="${pre}sop"><option value="">— Ninguno</option>${list.map((d) => html`<option value="${d.id}" ${d.id === cur ? raw('selected') : ''}>${d.kind === 'SOP' ? '' : d.kind + ' · '}${d.title}</option>`)}${!known ? html`<option value="${cur}" selected>SOP (${cur})</option>` : ''}<option value="__link" ${link ? raw('selected') : ''}>Otro: pegar un link…</option></select></div></div>
    <input class="in" id="${pre}soplink" placeholder="https://…" value="${link ? cur : ''}" style="margin-top:6px" ${link ? '' : raw('hidden')}>`;
}
// Muestra u oculta el campo del link según lo elegido.
export function bindSop(pre = 't') {
  const sel = $('#' + pre + 'sop'), inp = $('#' + pre + 'soplink'); if (!sel || !inp) return;
  sel.onchange = () => { inp.hidden = sel.value !== '__link'; if (!inp.hidden) inp.focus(); };
}
// Lo que eligió la persona, listo para guardar en la tarea.
export function readTipoSop(pre = 't') {
  const sel = $('#' + pre + 'sop')?.value || '', link = ($('#' + pre + 'soplink')?.value || '').trim();
  return { tipo: $('#' + pre + 'tipo')?.value || '', sop: sel === '__link' ? (isLink(link) ? link : '') : sel };
}

// Filtro por tipo para las listas de tareas.
export const tipoMatch = (t, f) => !f || f === 'todos' || (f === 'sin' ? !tipoOf(t) : tipoOf(t) === f);
export function tipoChips(sel, act, tasks = []) {
  const n = (k) => tasks.filter((t) => tipoMatch(t, k)).length;
  return html`<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center"><span class="mut sm" style="margin-right:2px">Tipo</span>
    ${[['todos', 'Todos'], ...TIPOS].map(([k, l]) => html`<button class="chip ${(sel || 'todos') === k ? 'dark' : ''}" data-act="${act}" data-tp="${k}" style="padding:6px 12px;font-size:12px">${l}${k === 'todos' ? '' : html` <span class="mut">${n(k)}</span>`}</button>`)}</div>`;
}
export const tipoBadge = (t) => (tipoOf(t) ? html`<span class="chip sm2" style="margin-left:6px;${t.tipo === 'Personal' ? 'background:#e9ded0' : ''}">${t.tipo}</span>` : '');
