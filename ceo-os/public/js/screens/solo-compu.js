// En Pocket (el iPhone), lo que necesita pantalla grande avisa que se abre en la compu.
import { html, mount, ico } from '../core.js';

export function render(el) {
  mount(el, html`<div class="pk-compu">${ico('monitor', 26)}<b>Esto se abre en la compu</b><p>Necesita una pantalla grande. Lo demás lo tienes aquí.</p><a class="btn" href="#/home">Volver a Hoy</a></div>`);
}
