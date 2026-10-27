// «Cómo se usa»: el video del CEO de cada sección, en una ventanita que te sigue mientras navegas.
// El botón vive en la barra de arriba (app.js lo prende según la sección); el video sale de la Library (un documento
// con `guia = <sección>`). Al abrirlo queda anotado que esa persona lo vio (team.<email>.vistos).
import { html, raw, mount, api, toast, $, ico, embedUrl, md } from './core.js';
import { nombreSeccion } from './guia-secciones.js';

let cache = null; // { items, vistos }
export async function cargarGuias(fresh = false) {
  if (!cache || fresh) cache = await api('guia').catch(() => ({ items: [], vistos: {} }));
  return cache;
}
export const guiasDe = (seccion) => (cache?.items || []).filter((d) => d.guia === seccion);
export const olvidarGuias = () => { cache = null; };

// ---------- El botón de la barra ----------
// Prende el botón «Cómo se usa» si la sección abierta tiene video. seccion = la clave de guia-secciones.js (o null).
export async function marcarSeccion(seccion) {
  const b = $('#guiabtn'); if (!b) return;
  await cargarGuias();
  const xs = seccion ? guiasDe(seccion) : [];
  b.hidden = !xs.length; b.dataset.seccion = seccion || ''; b.title = xs.length === 1 ? `Cómo se usa · ${xs[0].title}` : 'Cómo se usa esta parte';
}
export function instalarBoton(me) {
  const b = $('#guiabtn'); if (!b) return;
  b.onclick = () => {
    const xs = guiasDe(b.dataset.seccion); if (!xs.length) return;
    if (xs.length === 1) return abrirGuia(xs[0], me);
    // Varios videos de la misma sección: un menú chico debajo del botón.
    document.querySelector('.guia-menu')?.remove();
    const m = document.createElement('div'); m.className = 'guia-menu'; m.setAttribute('role', 'menu');
    mount(m, html`${xs.map((d) => html`<button type="button" role="menuitem" data-id="${d.id}">${ico('video', 14)} ${d.title}${cache.vistos?.[d.id] ? html` <i>${ico('check', 12)}</i>` : ''}</button>`)}`);
    m.onclick = (e) => { const x = e.target.closest('[data-id]'); if (x) { abrirGuia(xs.find((d) => d.id === x.dataset.id), me); m.remove(); } };
    // Desde arriba abre hacia abajo; desde el pie de la barra lateral, hacia arriba y alineado a la izquierda del botón.
    const r = b.getBoundingClientRect(), w = document.documentElement.clientWidth;
    if (r.top > innerHeight / 2) m.style.bottom = innerHeight - r.top + 6 + 'px'; else m.style.top = r.bottom + 6 + 'px';
    if (b.closest('.lat')) m.style.left = r.left + 'px'; else m.style.right = w - r.right + 'px';
    document.body.append(m);
    setTimeout(() => document.addEventListener('click', function cierra(ev) { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('click', cierra); } }), 0);
  };
}

// ---------- La ventanita ----------
let pip = null, lado = 'der', abierto = null;
export function abrirGuia(d, me) {
  if (!d) return;
  cerrarGuia();
  abierto = d;
  const em = embedUrl(d.url);
  pip = document.createElement('aside'); pip.className = `guia-pip ${lado}`; pip.setAttribute('aria-label', `Cómo se usa · ${d.title}`);
  mount(pip, html`<header class="guia-h"><span class="guia-k">${ico('video', 13)} Cómo se usa · ${nombreSeccion(d.guia)}</span><span class="sp"></span>
      <button type="button" data-g="lado" title="Pasar al otro lado" aria-label="Pasar al otro lado">${ico('shuffle', 14)}</button>
      <button type="button" data-g="min" title="Minimizar" aria-label="Minimizar">${raw('<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>')}</button>
      <button type="button" data-g="x" title="Cerrar" aria-label="Cerrar">${ico('x', 14)}</button></header>
    ${em ? html`<iframe src="${em}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${d.title}"></iframe>` : d.url ? html`<a class="guia-link" href="${d.url}" target="_blank" rel="noopener noreferrer">${ico('video', 16)} Abrir el video ↗</a>` : html`<div class="guia-sin">Este «Cómo se usa» todavía no tiene video: abajo están los pasos.</div>`}
    <div class="guia-b"><b>${d.title}</b>${d.body ? html`<details class="guia-pasos"><summary>Los pasos</summary><div class="lib-body sm">${md(d.body)}</div></details>` : ''}</div>
    <button type="button" class="guia-bola" data-g="max" title="Volver a abrir el video" aria-label="Volver a abrir el video">${ico('video', 16)}<span>${d.title}</span></button>`);
  pip.onclick = (e) => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    const a = b.dataset.g;
    if (a === 'x') cerrarGuia();
    else if (a === 'min') pip.classList.add('min');
    else if (a === 'max') pip.classList.remove('min');
    else if (a === 'lado') { lado = lado === 'der' ? 'izq' : 'der'; pip.classList.toggle('izq', lado === 'izq'); pip.classList.toggle('der', lado === 'der'); }
  };
  document.body.append(pip);
  // Queda anotado que lo vio.
  if (!cache?.vistos?.[d.id]) api('guia/visto', { method: 'POST', body: { id: d.id } }).then((r) => { if (cache) cache.vistos = r.vistos; if (me) me.vistos = r.vistos; }).catch(() => {});
}
export function cerrarGuia() { pip?.remove(); pip = null; abierto = null; }

// ---------- Lo que vio cada quien (Mi perfil y Equipo) ----------
export const vistosDe = (items, vistos = {}) => ({ total: items.length, vistos: items.filter((d) => vistos[d.id]).length });
export function listaVideos(items, vistos = {}, me) {
  if (!items.length) return html`<div class="mut sm">Todavía no hay videos de «Cómo se usa» para tu puesto. El CEO los graba y los marca en la Library.</div>`;
  return html`<div class="guia-lista">${items.map((d) => html`<button type="button" class="guia-row ${vistos[d.id] ? 'ok' : ''}" data-guia="${d.id}"><i>${vistos[d.id] ? ico('check', 13) : ico('video', 13)}</i><span class="grow"><b>${d.title}</b><small class="mut">${nombreSeccion(d.guia)}</small></span><span class="mut sm">${vistos[d.id] ? 'Visto' : 'Ver'}</span></button>`)}</div>`;
}
// Para que una pantalla abra un video desde su lista: el.addEventListener('click', clickVideo(me)).
export const clickVideo = (me) => (e) => { const b = e.target.closest('[data-guia]'); if (!b) return; const d = (cache?.items || []).find((x) => x.id === b.dataset.guia); if (d) abrirGuia(d, me); else toast('Ese video ya no está', true); };
