// Dictar en la caja del chat, como en ChatGPT: el micrófono escucha y el texto aparece en la caja mientras hablas.
// En Chrome usa el reconocimiento de voz del navegador. En la app de Mac, el de la Mac (tecla 🌐 / fn dos veces), que
// funciona en cualquier caja de texto: el navegador de la app no trae el de Chrome.
import { html, raw, toast } from './core.js';

export const icoMic = () => raw('<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>');
export const botonVoz = () => html`<button type="button" class="cx-mic" data-act="voz" aria-label="Dictar" title="Dictar">${icoMic()}</button>`;

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const AVISO_MAC = 'Para dictar en la app: toca dos veces la tecla 🌐 (o fn) y habla. El texto entra en la caja.';
let activo = null; // { rec, boton }

// boton: el micrófono; caja: el textarea. Tocarlo otra vez deja de escuchar.
export function dictar(boton, caja) {
  if (activo) { activo.rec.stop(); return; }
  if (!caja) return;
  if (!SR || window.inherentEscritorio) { caja.focus(); toast(window.inherentEscritorio ? AVISO_MAC : 'Este navegador no dicta. Usa Chrome, o el dictado de tu compu.'); return; }
  const rec = new SR(), base = caja.value ? `${caja.value.replace(/\s+$/, '')} ` : '';
  rec.lang = 'es-419'; rec.interimResults = true; rec.continuous = true;
  rec.onresult = (e) => {
    let txt = '';
    for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
    caja.value = base + txt.trimStart();
    caja.dispatchEvent(new Event('input'));
  };
  rec.onerror = (e) => { if (e.error === 'not-allowed') toast('Dale permiso al micrófono en el candado de la barra de direcciones.', true); else if (e.error === 'network') toast(AVISO_MAC); };
  rec.onend = () => { boton.classList.remove('on'); boton.setAttribute('aria-label', 'Dictar'); activo = null; caja.focus(); };
  activo = { rec, boton };
  boton.classList.add('on'); boton.setAttribute('aria-label', 'Dejar de dictar');
  try { rec.start(); } catch { rec.onend(); }
}
