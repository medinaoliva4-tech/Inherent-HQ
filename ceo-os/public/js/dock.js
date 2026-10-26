// El dock: Inherent OS como un escritorio con dos apps. Organización (Organization y Marcas: proyectos, briefs, clientes)
// y Chat (el Inherent LLM: Estrategia, Organización y Diseño en un solo chat). Cada app vuelve a donde estabas.
// En la compu es una barrita a la izquierda; en el cel se esconde y cada app trae su atajo a la otra.
import { html, mount, raw, emblem } from './core.js';

const ICONOS = {
  os: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12.5a7.5 7.5 0 0 1-11 6.6L4 20l1-4.2A7.5 7.5 0 1 1 20 12.5z"/><path d="M9 11.5h6M9 14.5h3.5"/></svg>',
};
export const APPS = [['os', 'Organización'], ['chat', 'Chat · Inherent LLM']];

// ir(app) lleva a la app; actual: 'os' | 'chat'.
export function pintarDock(actual, ir) {
  let d = document.querySelector('.dock');
  if (!d) {
    d = document.createElement('nav'); d.className = 'dock'; d.setAttribute('aria-label', 'Apps de Inherent OS');
    document.body.append(d);
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-app]'); if (b && b.dataset.app !== d.dataset.on) ir(b.dataset.app); });
    document.documentElement.classList.add('con-dock');
  }
  d.dataset.on = actual;
  mount(d, html`<span class="dock-emb" aria-hidden="true">${emblem()}</span>${APPS.map(([k, l]) => html`<button type="button" data-app="${k}" class="${k === actual ? 'on' : ''}" aria-label="${l}" ${k === actual ? raw('aria-current="page"') : ''}>${raw(ICONOS[k])}<span class="dock-tip">${l}</span></button>`)}`);
}
export const quitarDock = () => { document.querySelector('.dock')?.remove(); document.documentElement.classList.remove('con-dock'); };
export const icoApp = (k) => raw(ICONOS[k]);
