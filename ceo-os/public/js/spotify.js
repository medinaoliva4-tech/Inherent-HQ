// El mini control de Spotify en la barra lateral. Se esconde en un botón y recuerda cómo lo dejaste.
import { $, html, raw, mount, api, toast } from './core.js';

const LLAVE = 'os.spotify.visible';
const svg = (d) => raw(`<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`);
const NOTA = 'M9 18V6l10-2v11.5a2.5 2.5 0 1 1-1.8-2.4V8.2L11 9.4V18a2.5 2.5 0 1 1-2-2.4z';
const ICO = { prev: svg('M6 5h2v14H6zM20 5v14L9 12z'), play: svg('M7 4v16l13-8z'), pausa: svg('M6 5h4v14H6zM14 5h4v14h-4z'), sig: svg('M16 5h2v14h-2zM4 5v14l11-7z'), nota: svg(NOTA) };
let d = null, reloj = 0;
const visible = () => { try { return localStorage.getItem(LLAVE) !== '0'; } catch { return true; } };
const recordar = (v) => { try { localStorage.setItem(LLAVE, v ? '1' : '0'); } catch { /* no se recuerda */ } };

function pintar() {
  const c = $('#lat-sp'); if (!c) return;
  c.hidden = false;
  if (!visible()) return mount(c, html`<button type="button" class="sp-tab" data-sp="abrir" aria-label="Mostrar Spotify" title="Mostrar Spotify">${ICO.nota}</button>`);
  if (!d?.conectado) return mount(c, html`<div class="sp-mini"><span class="sp-ic">${ICO.nota}</span><span class="sp-t"><b>Spotify</b><small>Pon música desde aquí</small></span><button type="button" class="sp-con" data-sp="conectar">Conectar</button><button type="button" class="sp-x" data-sp="cerrar" aria-label="Esconder Spotify">×</button></div>`);
  mount(c, html`<div class="sp-mini">${d.portada ? html`<img src="${d.portada}" alt="">` : html`<span class="sp-ic">${ICO.nota}</span>`}<span class="sp-t"><b>${d.titulo || 'Nada sonando'}</b><small>${d.aviso || d.artista || d.dispositivo || 'Abre Spotify en un equipo'}</small></span><button type="button" class="sp-x" data-sp="cerrar" aria-label="Esconder Spotify">×</button>
    <div class="sp-b"><button type="button" data-sp="previous" aria-label="Anterior">${ICO.prev}</button><button type="button" data-sp="${d.sonando ? 'pause' : 'play'}" aria-label="${d.sonando ? 'Pausar' : 'Reproducir'}">${d.sonando ? ICO.pausa : ICO.play}</button><button type="button" data-sp="next" aria-label="Siguiente">${ICO.sig}</button></div></div>`);
}
async function refrescar() { if (document.hidden || !$('#lat-sp')) return; try { d = await api('spotify/estado'); pintar(); } catch { /* lo intenta en la próxima vuelta */ } }
async function accion(a) {
  if (a === 'abrir' || a === 'cerrar') { recordar(a === 'abrir'); return pintar(); }
  try {
    if (a === 'conectar') { location.href = (await api('spotify/conectar', { method: 'POST', body: {} })).url; return; }
    if (d) { d.sonando = a === 'play' ? true : a === 'pause' ? false : d.sonando; pintar(); }
    await api('spotify/accion', { method: 'POST', body: { accion: a } });
    setTimeout(refrescar, 700);
  } catch (e) { toast(e.message, true); refrescar(); }
}
export function pintarSpotify(me) {
  const c = $('#lat-sp'); if (!c || me?.role !== 'ceo') return;
  c.onclick = (e) => { const b = e.target.closest('[data-sp]'); if (b) accion(b.dataset.sp); };
  pintar(); refrescar();
  clearInterval(reloj); reloj = setInterval(refrescar, 15000);
}
