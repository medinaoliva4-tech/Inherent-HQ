// La portada de un área: su propósito, su número y sus tres mesas. Cada herramienta abre con el cliente elegido.
import { html, mount, ico, $ } from './core.js';
import { herramientaDe, rutaHerramienta } from './herramientas.js';
import { cargarContexto, contextoLista, contextoActual, ponerContexto } from './contexto.js';
import { mesasDe } from './mesas.js';

export async function pintarMesas(el, { me, area, tabs, alive }) {
  const a = mesasDe(area.id);
  await cargarContexto(me).catch(() => {});
  if (!alive()) return;
  const lista = contextoLista().filter((c) => c.slug);
  let slug = contextoActual(me) || lista[0]?.slug || '';
  const fila = (h) => slug
    ? html`<a class="ms-h" href="${rutaHerramienta(h.ws, slug, h.id)}"><span>${h.nombre}</span>${ico('chevron-right', 14)}</a>`
    : html`<span class="ms-h is-disabled" aria-disabled="true"><span>${h.nombre}</span></span>`;
  const pintar = () => mount(el, html`<div class="hello sp-hero ar-head" style="--ar-c:var(${area.color})"><span class="ar-ico">${ico(area.icono, 22)}</span><div class="ar-tit"><h1>${area.nombre}</h1><p>${a.para}</p></div></div>
    ${tabs(area, 'herramientas')}
    <div class="ms-bar"><span>${ico('target', 14)} ${a.numero}</span>${lista.length ? html`<select class="in" id="ms-cl" aria-label="Cliente">${lista.map((c) => html`<option value="${c.slug}" ${c.slug === slug ? 'selected' : ''}>${c.name}</option>`)}</select><a class="btn ghost sm" href="#/ws/${area.id}/${slug}/overview">Abrir ${contextoLista().find((c) => c.slug === slug)?.name || 'cliente'}</a>` : html`<span class="ms-sin-cliente">Agrega un cliente para abrir su espacio</span>`}</div>
    <div class="ms">${a.mesas.map((m) => { const hs = m.herramientas.map(herramientaDe).filter((h) => h && h.puede(me)); return html`<section class="ms-m"><h2>${m.nombre}</h2><p>${m.para}</p><div class="ms-l">${hs.map(fila)}${m.enlaces.filter(([, , quien]) => !quien || me.role === quien).map(([n, r]) => html`<a class="ms-h" href="${r}"><span>${n}</span>${ico('chevron-right', 14)}</a>`)}</div></section>`; })}</div>`);
  pintar();
  el.onchange = (e) => { if (e.target.id === 'ms-cl') { slug = e.target.value; ponerContexto(me, slug); pintar(); } };
}
