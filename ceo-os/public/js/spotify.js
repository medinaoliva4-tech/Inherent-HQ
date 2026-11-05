// El reproductor de Spotify en la barra lateral: tiempo, controles y volumen. Se esconde en un botón y recuerda cómo lo dejaste.
import { $, html, raw, mount, api, toast } from './core.js';
import { tiempo } from './spotify-datos.js';

const LLAVE = 'os.spotify.visible';
const svg = (d) => raw(`<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`);
const NOTA = 'M9 18V6l10-2v11.5a2.5 2.5 0 1 1-1.8-2.4V8.2L11 9.4V18a2.5 2.5 0 1 1-2-2.4z';
const ICO = { prev: svg('M6 5h2v14H6zM20 5v14L9 12z'), play: svg('M7 4v16l13-8z'), pausa: svg('M6 5h4v14H6zM14 5h4v14h-4z'), sig: svg('M16 5h2v14h-2zM4 5v14l11-7z'), nota: svg(NOTA), vol: svg('M4 9v6h4l5 4V5L8 9zm12.5 3a4 4 0 0 0-2-3.5v7a4 4 0 0 0 2-3.5z') };
let d = null, reloj = 0, tic = 0, tocando = false, enviar = 0, sinFoto = '', local = null, equipo = '', iniciado = false, sonable = false;
const enApp = () => Boolean(window.inherentEscritorio);
// El reproductor del navegador necesita Widevine. Electron no lo trae: en la app de Mac suena la app de Spotify.
const puedeSonarAqui = async () => {
  if (enApp() || !navigator.requestMediaKeySystemAccess) return false;
  try { await navigator.requestMediaKeySystemAccess('com.widevine.alpha', [{ initDataTypes: ['cenc'], audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }] }]); return true; } catch { return false; }
};
async function iniciarLocal() {
  if (iniciado || !d?.streaming || !(await puedeSonarAqui())) return;
  iniciado = true;
  window.onSpotifyWebPlaybackSDKReady = () => {
    local = new window.Spotify.Player({ name: 'Inherent OS', volume: (d?.volumen ?? 60) / 100, getOAuthToken: (cb) => api('spotify/token').then((j) => cb(j.token)).catch(() => {}) });
    local.addListener('ready', ({ device_id: id }) => { equipo = id; });
    local.addListener('not_ready', () => { equipo = ''; });
    local.addListener('account_error', () => { equipo = ''; toast('Spotify pide Premium para sonar aquí.', true); });
    local.addListener('authentication_error', () => { equipo = ''; toast('Vuelve a conectar Spotify.', true); });
    local.addListener('player_state_changed', () => setTimeout(refrescar, 400));
    local.connect();
  };
  const s = document.createElement('script'); s.src = 'https://sdk.scdn.co/spotify-player.js'; s.async = true; document.head.append(s);
}
// Sin ningún equipo abierto: en la Mac abre la app de Spotify y le pasa la música en cuanto aparece.
async function abrirApp() {
  if (!enApp()) return toast('Abre Spotify en algún equipo y dale play una vez.', true);
  toast('Abriendo Spotify…');
  window.open('spotify:');
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    try { await api('spotify/accion', { method: 'POST', body: { accion: 'play' } }); return setTimeout(refrescar, 800); }
    catch (e) { if (e.code !== 'SIN_EQUIPO' && e.code !== 'NO_ACTIVE_DEVICE') return toast(e.message, true); }
  }
  toast('Abre Spotify y dale play una vez.', true);
}
const visible = () => { try { return localStorage.getItem(LLAVE) !== '0'; } catch { return true; } };
const recordar = (v) => { try { localStorage.setItem(LLAVE, v ? '1' : '0'); } catch { /* no se recuerda */ } };
const relleno = (el) => el?.style.setProperty('--sp-v', `${el.max > 0 ? (el.value / el.max) * 100 : 0}%`);

function pintarTiempo() {
  const r = $('#sp-pos'); if (!r || tocando) return;
  r.value = d.progreso; relleno(r); $('#sp-va').textContent = tiempo(d.progreso);
}
function pintar() {
  const c = $('#lat-sp'); if (!c) return;
  c.hidden = false;
  if (!visible()) return mount(c, html`<button type="button" class="sp-tab" data-sp="abrir" aria-label="Mostrar Spotify" title="Mostrar Spotify">${ICO.nota}</button>`);
  if (!d?.conectado) return mount(c, html`<div class="sp-mini"><span class="sp-ic">${ICO.nota}</span><span class="sp-t"><b>Spotify</b><small>Pon música desde aquí</small></span><button type="button" class="sp-con" data-sp="conectar">Conectar</button><button type="button" class="sp-x" data-sp="cerrar" aria-label="Esconder Spotify">×</button></div>`);
  const foto = d.portada && d.portada !== sinFoto;
  mount(c, html`<div class="sp-mini sp-player">${foto ? html`<img src="${d.portada}" alt="">` : html`<span class="sp-ic">${ICO.nota}</span>`}<span class="sp-t"><b title="${d.titulo}">${d.titulo || 'Nada sonando'}</b><small>${d.aviso || d.artista || d.dispositivo || (enApp() ? 'Dale play para abrir Spotify' : 'Dale play para escuchar')}</small></span><button type="button" class="sp-x" data-sp="cerrar" aria-label="Esconder Spotify">×</button>
    ${d.duracion ? html`<div class="sp-pos"><input id="sp-pos" class="sp-r" type="range" min="0" max="${d.duracion}" step="1000" value="${d.progreso}" aria-label="Avanzar en la canción"><span id="sp-va">${tiempo(d.progreso)}</span><span>${tiempo(d.duracion)}</span></div>` : ''}
    <div class="sp-b"><button type="button" data-sp="previous" aria-label="Anterior">${ICO.prev}</button><button type="button" class="sp-play" data-sp="${d.sonando ? 'pause' : 'play'}" aria-label="${d.sonando ? 'Pausar' : 'Reproducir'}">${d.sonando ? ICO.pausa : ICO.play}</button><button type="button" data-sp="next" aria-label="Siguiente">${ICO.sig}</button></div>
    ${d.dispositivo ? html`<small class="sp-eq">En ${d.dispositivo}</small>` : ''}
    ${d.streaming || !sonable ? '' : html`<button type="button" class="sp-con sp-re" data-sp="conectar">Activar sonido aquí</button>`}
    ${d.volumen == null ? '' : html`<label class="sp-vol">${ICO.vol}<input id="sp-vol" class="sp-r" type="range" min="0" max="100" value="${d.volumen}" aria-label="Volumen"></label>`}</div>`);
  c.querySelectorAll('.sp-r').forEach(relleno);
  const img = c.querySelector('.sp-mini>img');
  if (img) img.onerror = () => { sinFoto = d.portada; pintar(); };
}
async function refrescar() {
  if (document.hidden || !$('#lat-sp') || tocando) return;
  try { d = await api('spotify/estado'); if (!tocando) pintar(); iniciarLocal(); } catch { /* lo intenta en la próxima vuelta */ }
}
async function mandar(accionN, valor) {
  try { await api('spotify/accion', { method: 'POST', body: { accion: accionN, valor, dispositivo: accionN === 'play' && !d?.activo ? equipo : '' } }); }
  catch (e) {
    if (accionN === 'play' && (e.code === 'SIN_EQUIPO' || e.code === 'NO_ACTIVE_DEVICE')) { if (d) d.sonando = false; pintar(); return abrirApp(); }
    if (accionN !== 'volumen' || e.code !== 'NO_ACTIVE_DEVICE') toast(e.message, true);
    refrescar();
  }
}
async function accion(a) {
  if (a === 'abrir' || a === 'cerrar') { recordar(a === 'abrir'); return pintar(); }
  if (a === 'conectar') { try { location.href = (await api('spotify/conectar', { method: 'POST', body: {} })).url; } catch (e) { toast(e.message, true); } return; }
  local?.activateElement?.(); // el navegador exige que el sonido arranque con un clic
  if (d) { d.sonando = a === 'play' ? true : a === 'pause' ? false : d.sonando; pintar(); }
  await mandar(a);
  setTimeout(refrescar, 700);
}
export function pintarSpotify(me) {
  const c = $('#lat-sp'); if (!c || me?.role !== 'ceo') return;
  c.onclick = (e) => { const b = e.target.closest('[data-sp]'); if (b) accion(b.dataset.sp); };
  c.onpointerdown = (e) => { if (e.target.matches?.('.sp-r')) tocando = true; };
  // El volumen responde mientras arrastras, sin mandar una llamada por cada píxel.
  c.oninput = (e) => {
    relleno(e.target);
    if (e.target.id === 'sp-pos') $('#sp-va').textContent = tiempo(+e.target.value);
    if (e.target.id === 'sp-vol') { d.volumen = +e.target.value; clearTimeout(enviar); enviar = setTimeout(() => mandar('volumen', d.volumen), 180); }
  };
  c.onchange = (e) => {
    tocando = false;
    if (e.target.id === 'sp-pos') { d.progreso = +e.target.value; mandar('buscar', d.progreso); }
  };
  addEventListener('pointerup', () => { tocando = false; });
  puedeSonarAqui().then((v) => { sonable = v; pintar(); });
  pintar(); refrescar();
  clearInterval(reloj); reloj = setInterval(refrescar, 15000);
  clearInterval(tic); tic = setInterval(() => { if (d?.sonando && !document.hidden && d.progreso < d.duracion) { d.progreso += 1000; pintarTiempo(); } }, 1000);
}
