// El dock: Inherent OS como un escritorio con dos apps. Organización (Organization y Marcas: proyectos, briefs, clientes)
// y Chat (el Inherent LLM: Estrategia, Organización y Diseño en un solo chat). Cada app vuelve a donde estabas.
// En la compu es una barrita a la izquierda (sin logo: el logo va en cada app, una sola vez); en el cel se esconde y cada
// app trae su atajo a la otra. El ícono del Chat es una burbuja abierta con la chispa de la IA arriba.
import { html, mount, raw } from './core.js';
import { svgIco } from './iconos.js';

// Del set del OS (iconos.js): la cuadrícula de Organización y el Chat (burbuja abierta con la chispa de la IA).
const ICONOS = { os: svgIco('os', 20, 'lni lni-dock'), chat: svgIco('chat-ia', 20, 'lni lni-dock') };
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
