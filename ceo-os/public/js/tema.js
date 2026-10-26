// El día y la noche de las dos apps (Organización y Chat), uno solo: 'sistema' (el de tu compu o tu iPhone), 'dia' o 'noche'.
// Se guarda en localStorage 'theme' ('light' · 'dark' · nada = sistema), la misma llave de siempre. tema-boot.js lo pone
// antes del primer pintado; esto lo cambia y avisa con el evento 'tema' en window ({ noche, elegido }).
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
const FONDO = { dia: '#faf9f6', noche: '#1f1e1c' }; // el fondo de cada tema: la franja del iPhone se pinta igual

export function temaElegido() {
  try { const t = localStorage.getItem('theme'); return t === 'dark' ? 'noche' : t === 'light' ? 'dia' : 'sistema'; } catch { return 'sistema'; }
}
export const esNoche = () => document.documentElement.dataset.theme === 'dark';

function aplicar() {
  const elegido = temaElegido(), noche = elegido === 'noche' || (elegido === 'sistema' && Boolean(mq?.matches)), h = document.documentElement;
  h.dataset.theme = noche ? 'dark' : 'light';
  h.dataset.llmTema = noche ? 'noche' : 'dia';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', noche ? FONDO.noche : FONDO.dia);
  window.dispatchEvent(new CustomEvent('tema', { detail: { noche, elegido } }));
}

// t: 'sistema' | 'dia' | 'noche'
export function ponerTema(t) {
  try {
    if (t === 'noche') localStorage.setItem('theme', 'dark');
    else if (t === 'dia') localStorage.setItem('theme', 'light');
    else localStorage.removeItem('theme');
  } catch { /* sin almacenamiento: vale solo en esta pestaña */ }
  aplicar();
}

// En «sistema», sigue a la compu cuando cambia (por ejemplo, la noche automática de la Mac).
mq?.addEventListener?.('change', () => { if (temaElegido() === 'sistema') aplicar(); });
