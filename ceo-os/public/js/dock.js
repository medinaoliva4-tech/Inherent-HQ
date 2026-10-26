// El dock: Inherent OS como un escritorio con dos apps. Organización (Organization y Marcas: proyectos, briefs, clientes)
// y Chat (el Inherent LLM: Estrategia, Organización y Diseño en un solo chat). Cada app vuelve a donde estabas.
// En la compu es una barrita a la izquierda (sin logo: el logo va en cada app, una sola vez); en el cel se esconde y cada
// app trae su atajo a la otra. El ícono del Chat es una burbuja abierta con la chispa de la IA arriba.
import { html, mount, raw } from './core.js';

const ICONOS = {
  os: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 12.2c-.4 3.9-4.2 6.8-8.6 6.8-1.06 0-2.08-.15-3.03-.44L4.5 19.9l1.12-3.73C4 14.83 3 13 3 11c0-4.1 4-7.4 9-7.5"/><path d="M18 2.8l.75 2.05L20.8 5.6l-2.05.75L18 8.4l-.75-2.05L15.2 5.6l2.05-.75z" fill="currentColor" stroke-width="1.1"/></svg>',
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
  mount(d, html`${APPS.map(([k, l]) => html`<button type="button" data-app="${k}" class="${k === actual ? 'on' : ''}" aria-label="${l}" ${k === actual ? raw('aria-current="page"') : ''}>${raw(ICONOS[k])}<span class="dock-tip">${l}</span></button>`)}`);
}
export const quitarDock = () => { document.querySelector('.dock')?.remove(); document.documentElement.classList.remove('con-dock'); };
export const icoApp = (k) => raw(ICONOS[k]);
