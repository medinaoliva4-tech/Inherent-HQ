// La tarjeta «Tu puesto»: qué ve esta persona, para qué lo ve y qué hace aquí. Sale arriba de Hoy, del
// Workspace y en Mi perfil. El texto vive en roleviews.js (PURPOSE), junto a la matriz de vistas del CEO.
import { html, ico } from './core.js';
import { rolePurpose, LEVELS } from './roleviews.js';

const LV = Object.fromEntries(LEVELS);
// me: la persona (o a quién se está viendo con «Ver como»). area: la sección donde se muestra (afina el «para qué»).
// own: true cuando es la propia persona («Tu puesto»); false cuando el CEO ve el puesto de otro.
export function purposeCard(me, { area = null, own = true, open = false } = {}) {
  const p = rolePurpose(me);
  const here = area ? p.sections.find((s) => s.k === area) : null;
  const first = (me.name || '').split(' ')[0];
  return html`<div class="card purp">
    <div class="purpmain">
      <div><span class="lbl">${own ? 'Tu puesto' : `El puesto de ${first}`}</span><b>${p.name}</b>${p.others.length ? html`<span class="mut sm"> · también ${p.others.join(' · ')}</span>` : ''}<div class="mut sm">${p.sees}</div></div>
      <div><span class="lbl">Para qué ${own ? 'ves' : 've'} esto</span><div>${here?.purpose ? html`${here.purpose}. ` : ''}<span class="mut">${p.why}</span></div></div>
      <div><span class="lbl">Qué ${own ? 'haces' : 'hace'} aquí</span><div>${p.does}</div></div>
    </div>
    <details class="purpmore" ${open ? 'open' : ''}><summary>${ico('eye', 14)} Qué ${own ? 'ves' : 've'} y a qué nivel <span class="mut">· ${p.sections.length} secciones${p.scope && p.scope !== 'todos' ? ` · ${p.scope === 'asignados' ? 'solo sus clientes' : 'solo lo suyo'}` : ''}</span></summary>
      <div class="purpsecs">${p.sections.map((s) => html`<div class="purpsec"><b>${s.label}</b><span class="chip sm2 ${s.level === 'edita' ? 'dark' : s.level === 'resumen' ? 'amber' : ''}">${LV[s.level] || s.level}</span><span class="mut sm">${s.purpose}</span></div>`)}</div>
    </details></div>`;
}
