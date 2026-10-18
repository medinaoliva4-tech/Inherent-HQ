// Mi marca: la marca personal del CEO. Research, Ideas, Calendario y Analytics del perfil «personal», con la misma
// pantalla de Contenido pero el perfil fijo y privado. El servidor ya lo aplica (solo el CEO lee ese perfil); aquí se repite.
import { html, mount } from '../core.js';
import { render as content } from './content.js';

export async function render(el, opts) {
  if (opts.me.role !== 'ceo') return mount(el, html`<div class="empty"><b>Mi marca es solo del CEO</b>Tu perfil no la ve.</div>`);
  return content(el, { ...opts, fixed: 'personal' });
}
