// El panel de la derecha de los chats (Estrategia y Diseño gráfico), como un artifact de Claude:
//   cabecera fija (qué documento es, su estado, abrirlo en su herramienta y ×) · avance · el documento · la acción principal abajo.
// Con el panel cerrado, el mensaje que lo cambió muestra una tarjeta del documento para abrirlo.
import { html, raw, ico } from './core.js';

// El ícono del panel (como el de Claude): un rectángulo partido.
export const icoPanel = (s = 15) => raw(`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M14 4v16"/></svg>`);

// o = { ic, titulo, sub, estado, ok (estado en verde), acciones (html), cerrar (bool), prog: [[nombre, hecho]], cuerpo (html), pie: { texto, accion (html) } }
export function docHtml(o) {
  return html`<div class="ad">
    <header class="ad-h"><span class="ad-i">${ico(o.ic || 'doc', 15)}</span><div class="ad-t"><b>${o.titulo}</b>${o.sub ? html`<small>${o.sub}</small>` : ''}</div>
      ${o.estado ? html`<span class="ad-st ${o.ok ? 'ok' : ''}">${o.estado}</span>` : ''}<span class="sp"></span>${o.acciones || ''}
      ${o.cerrar ? html`<button type="button" class="ad-x" data-act="panel-x" aria-label="Cerrar el panel" title="Cerrar el panel">${ico('x', 14)}</button>` : ''}</header>
    ${o.prog?.length ? html`<div class="ad-prog">${o.prog.map(([n, ok]) => html`<span class="${ok ? 'ok' : ''}"><i></i>${n}</span>`)}</div>` : ''}
    <div class="ad-b"><div class="ad-in">${o.cuerpo}</div></div>
    ${o.pie ? html`<footer class="ad-f">${o.pie.texto ? html`<span>${o.pie.texto}</span><span class="sp"></span>` : ''}${o.pie.accion || ''}</footer>` : ''}</div>`;
}

// La tarjeta del documento dentro del chat (cuando el panel está cerrado).
export const tarjetaDoc = (o) => html`<button type="button" class="ad-card" data-act="panel-abrir"><span class="ad-i">${ico(o.ic || 'doc', 15)}</span><span class="ad-t"><b>${o.titulo}</b>${o.sub ? html`<small>${o.sub}</small>` : ''}</span><span class="ad-go">Abrir</span></button>`;

// La barra fija de arriba del chat: el cliente, lo de la derecha (mes, panel) y abajo los pasos.
// o = { cliente: { nombre, act }, derecha (html), panel (bool: abierto), pasos (html) }
export const barraChat = (o) => html`<div class="cb"><div class="cb-r"><button type="button" class="cb-cli" data-act="${o.cliente.act}" aria-haspopup="listbox" title="Cambiar de cliente"><i>${o.cliente.mono}</i>${o.cliente.nombre} <small>▾</small></button><span class="sp"></span>${o.derecha || ''}
    <button type="button" class="cb-ib ${o.panel ? 'on' : ''}" data-act="panel-tg" aria-pressed="${o.panel ? 'true' : 'false'}" title="${o.panel ? 'Cerrar el panel' : 'Abrir el panel'}">${icoPanel()}</button></div>
  ${o.pasos ? html`<div class="cb-p">${o.pasos}</div>` : ''}</div>`;
