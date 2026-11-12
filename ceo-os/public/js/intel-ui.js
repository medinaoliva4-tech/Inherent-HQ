// Intel · «Entregables»: el trabajo de fondo de los agentes de un cliente. Arriba, El avatar; debajo, por departamento y en el
// orden del pipeline, una tarjeta por documento. Al abrirla, el documento completo en la vista grande (drawer).
// Solo la usa la página de un proyecto (pestaña «Entregables»): es estrategia, solo para el equipo. Todo lo decide el servidor
// (api/_lib/intel.js): esta pantalla solo pinta lo que llega. Lo que todavía no existe se ve en gris, con «Pronto».
import { html, mount, api, fdate, ico, drawer, md } from './core.js';
import { mesLabel } from './intel-mapa.js';
import { fallo } from './visual.js';

// Los documentos del repo vienen con saltos de línea a mitad de párrafo: se unen las líneas de texto seguidas para que se lean
// como un solo párrafo (títulos, listas, tablas, citas y bloques de código quedan como están).
function unirParrafos(t) {
  const out = []; let fence = false;
  for (const ln of String(t).split('\n')) {
    if (/^\s*```/.test(ln)) { fence = !fence; out.push(ln); continue; }
    const txt = !fence && ln.trim() && !/^\s*(#|>|[-*]\s|\d+[.)]\s|\||---|\*\*\*)/.test(ln);
    const prev = out[out.length - 1];
    if (txt && prev !== undefined && prev.trim() && !fence && !/^\s*(#|>|[-*]\s|\d+[.)]\s|\||---|\*\*\*|```)/.test(prev)) out[out.length - 1] = prev.replace(/\s+$/, '') + ' ' + ln.trim();
    else out.push(ln);
  }
  return out.join('\n');
}
const ICON = { quien: 'user', duele: 'alert', quiere: 'star', donde: 'pin', compra: 'tag' };

export async function intelView(box, { slug, alive = () => true }) {
  mount(box, html`<p class="loading">Cargando…</p>`);
  let d;
  try { d = await api(`repo/client/${encodeURIComponent(slug)}/intel`); }
  catch (e) { return mount(box, html`${fallo({ titulo: 'No pude abrir los entregables', linea: e.message })}`); }
  if (!alive()) return;
  const team = d.vista === 'equipo';
  const items = d.depts.flatMap((x) => x.items.map((it) => ({ ...it, dept: x.nombre })));
  // Un documento puede tener varios meses: se muestra el más reciente y los demás son pestañas dentro del documento.
  const key = (it) => `${it.id}|${it.variante || ''}`;
  const cards = d.depts.map((x) => ({ ...x, cards: x.items.filter((it, i, a) => a.findIndex((z) => key(z) === key(it)) === i) }));

  const avatar = () => {
    const a = d.avatar;
    if (!a.hay) return html`<section class="intel-av none"><span class="intel-mono">${ico('user', 22)}</span><div><span class="lbl">El avatar</span><b>Todavía no está</b></div></section>`;
    return html`<section class="intel-av">
      <div class="intel-av-top"><span class="intel-mono">${ico('user', 24)}</span><div style="min-width:0"><span class="lbl">El avatar</span><h2>${a.arquetipo ? a.arquetipo : 'Con quién hablamos'}</h2></div></div>
      <div class="intel-cells">${a.campos.map((c) => c.texto
        ? html`<div class="intel-cell"><span class="intel-cell-h">${ico(ICON[c.k] || 'dot', 15)} ${c.label}</span><p>${c.texto}</p>${team && (c.de || c.sinVerificar) ? html`<span class="intel-cell-f">${c.de ? html`<span class="mut sm">De ${c.de}</span>` : ''}${c.sinVerificar ? html`<span class="chip sm2">Sin verificar</span>` : ''}</span>` : ''}</div>`
        : html`<div class="intel-cell soon"><span class="intel-cell-h">${ico(ICON[c.k] || 'dot', 15)} ${c.label}</span><p>Pronto</p></div>`)}</div></section>`;
  };

  const card = (it) => html`<button type="button" class="intel-card" data-intel="${key(it)}">
      <span class="intel-card-t">${it.titulo}</span><span class="intel-card-s">${it.sirve}</span>
      <span class="intel-card-f">${team && !it.cliente ? html`<span class="chip sm2 dark">Interno</span>` : ''}${it.mes ? html`<span class="chip sm2">${mesLabel(it.mes)}</span>` : ''}<span class="mut sm intel-date">${it.fecha ? 'Act. ' + fdate(it.fecha) : ''}</span></span></button>`;
  const dept = (x) => html`<section class="intel-dept ${x.cards.length ? '' : 'none'}">
      <div class="intel-dept-h"><h3>${x.nombre}</h3><span class="mut sm">${x.cards.length} de ${x.cards.length + x.faltan.length}</span></div>
      ${x.cards.length ? html`<div class="intel-cards">${x.cards.map(card)}</div>` : ''}
      ${x.faltan.length ? html`<div class="intel-soon"><span class="intel-soon-l">Pronto</span>${x.faltan.map((f) => html`<span class="intel-pill" title="${f.sirve}">${f.titulo}</span>`)}</div>` : ''}</section>`;

  mount(box, html`<div class="intel">
      ${avatar()}
      <div class="intel-sum"><b>${d.listos}</b> de ${d.total} entregables listos</div>
      ${cards.map(dept)}</div>`);

  function open(k, mes) {
    const vers = items.filter((it) => key(it) === k).sort((a, z) => String(z.mes || '').localeCompare(String(a.mes || '')));
    const it = vers.find((v) => v.mes === mes) || vers[0]; if (!it) return;
    const body = it.contenido?.trim() ? md(it.fmt === 'csv' ? it.contenido : unirParrafos(it.contenido)) : html`<p class="mut">Este documento está vacío.</p>`;
    drawer(html`<article class="intel-doc">
        <span class="lbl">${it.dept}</span><h1>${it.titulo}</h1><p class="intel-doc-s">${it.sirve}</p>
        <div class="intel-doc-m">${team && !it.cliente ? html`<span class="chip sm2 dark">${ico('lock', 12)} Interno</span>` : ''}${it.fecha ? html`<span class="mut sm">Actualizado ${fdate(it.fecha)}</span>` : ''}
          ${vers.length > 1 ? html`<span class="seg intel-meses" aria-label="Versión">${vers.map((v) => html`<button class="${v === it ? 'on' : ''}" data-act="mes" data-k="${k}" data-m="${v.mes || ''}">${v.mes ? mesLabel(v.mes) : 'General'}</button>`)}</span>` : it.mes ? html`<span class="chip sm2">${mesLabel(it.mes)}</span>` : ''}</div>
        <div class="intel-body">${body}</div></article>`,
      { mes: (t) => open(t.dataset.k, t.dataset.m || null) }, { section: 'Entregables', title: it.titulo });
  }
  box.onclick = (e) => { const c = e.target.closest('[data-intel]'); if (c && box.contains(c)) open(c.dataset.intel); };
}
