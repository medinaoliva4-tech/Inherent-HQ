// El panel de la derecha de los chats (Estrategia y Diseño gráfico), como un artifact de Claude:
//   cabecera fija (qué documento es, su estado, abrirlo en su herramienta y ×) · avance · el documento · la acción principal abajo.
// Con el panel cerrado, el mensaje que lo cambió muestra una tarjeta del documento para abrirlo.
import { html, raw, ico } from './core.js';

// El ícono del panel (como el de Claude): un rectángulo partido.
export const icoPanel = (s = 15) => raw(`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M14 4v16"/></svg>`);

// Los íconos del chat (como en Claude o ChatGPT): enviar, detener y conversación nueva.
const svg = (d, s = 16) => raw(`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`);
export const icoEnviar = () => raw('<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5.5M6 11.5l6-6 6 6"/></svg>');
export const icoParar = () => raw('<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor"/></svg>');
export const icoNuevo = () => svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', 15);
// Los dos botones de la caja: enviar y, mientras responde, detener (el CSS muestra uno u otro).
export const botonesEnviar = (form) => html`<button class="btn es-send" type="submit" form="${form}" aria-label="Enviar" title="Enviar (Enter)">${icoEnviar()}</button><button class="btn es-stop" type="button" data-act="detener" aria-label="Detener" title="Detener">${icoParar()}</button>`;

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

// La barra fija de arriba del chat: los pasos o etapas en orden y, a la derecha, conversación nueva y el panel.
// o = { pasos (html), panel (bool: abierto) }
export const barraChat = (o) => html`<div class="cb"><div class="cb-r"><div class="cb-p">${o.pasos || ''}</div><span class="sp"></span>
    <button type="button" class="cb-ib" data-act="chat-nuevo" title="Conversación nueva">${icoNuevo()}</button>
    <button type="button" class="cb-ib ${o.panel ? 'on' : ''}" data-act="panel-tg" aria-pressed="${o.panel ? 'true' : 'false'}" title="${o.panel ? 'Cerrar el panel' : 'Abrir el panel'}">${icoPanel()}</button></div></div>`;

// La franja de abajo de la caja, como la de ChatGPT: el cliente, el mes (si aplica), el contexto y el modo de trabajo.
// o = { cliente: { mono, nombre, act }, mes (html), contexto (n), modo (texto) }
const icoCarpeta = () => svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', 14);
export const bandeja = (o) => html`<div class="cx-tray">
    <button type="button" class="cx-t" data-act="${o.cliente.act}" aria-haspopup="listbox" title="Cambiar de cliente">${icoCarpeta()}${o.cliente.nombre} <span class="cx-car">▾</span></button>
    ${o.mes || ''}
    <button type="button" class="cx-t" data-act="ctx-c" aria-haspopup="dialog" title="Lo que lee antes de responder">${ico('doc', 13)}Contexto${o.contexto ? html` <b class="cx-n">${o.contexto}</b>` : ''}</button>
    <button type="button" class="cx-t" data-act="ctx-m" aria-haspopup="dialog" title="Cómo responde">${ico('target', 13)}${o.modo || 'Modo de trabajo'}</button></div>`;
