// Aviso de novedades: un panel pequeño y flotante dentro del OS (no es una pantalla). Dos casos:
//  · app de Mac: hay una versión (o un armado) más nuevo publicado → «Actualizar» (se baja sola) o «Descargar» el instalador.
//  · web: el servidor tiene un despliegue nuevo → «Recargar». Funciona también en el navegador; nunca recarga solo.
import { $, html, mount, api, ico } from './core.js';
import { nombreVersion, panelActual, MAS_TARDE_MS } from './app-mac-estado.js';

const app = () => window.inherentEscritorio;
const CADA = 10 * 60_000;
let ultima = null, avance = null, silencio = 0, inicialWeb = null, actualWeb = null, arrancado = false, confirmarRecarga = false, descargando = false, ultimaRevision = 0;

// Un borrador sin enviar en alguna caja de texto (el chat, un brief…): recargar lo perdería.
const hayBorrador = () => [...document.querySelectorAll('textarea, [contenteditable="true"]')].some((e) => !e.closest('#os-novedad') && String(e.value ?? e.textContent ?? '').trim());

function caja() {
  let c = $('#os-novedad');
  if (!c) { c = document.createElement('aside'); c.id = 'os-novedad'; c.className = 'os-nov'; c.setAttribute('role', 'status'); c.hidden = true; document.body.append(c); }
  return c;
}
const icono = (n) => html`<span class="os-nov-i" aria-hidden="true">${ico(n, 18)}</span>`;
const D_BAJAR = 'download', D_RECARGAR = 'refresh-cw';

async function descargar() {
  if (descargando) return;
  descargando = true; pintar();
  let error = '';
  try {
    const d = await api(`escritorio/descarga?arch=${app()?.arquitectura || 'arm64'}&formato=dmg`);
    window.open(d.url, '_blank', 'noopener');
  } catch (e) { error = e.message; }
  descargando = false; pintar();
  if (error) { const p = $('.os-nov-err', caja()); if (p) p.textContent = error; }
}

export function pintar() {
  const c = caja();
  const tipo = panelActual({ enApp: Boolean(app()), instalada: app()?.version, build: app()?.build, ultima, inicialWeb, actualWeb, silencioHasta: silencio });
  c.hidden = !tipo; c.dataset.tipo = tipo || '';
  if (!tipo) return;
  const masTarde = () => { silencio = Date.now() + MAS_TARDE_MS; confirmarRecarga = false; pintar(); };
  if (tipo === 'app') {
    if (avance !== null) return mount(c, html`<div class="os-nov-c">${icono(D_BAJAR)}<div class="os-nov-t"><b>Actualizando…</b><span>Al terminar, la app se cierra y vuelve a abrir.</span></div></div><i class="os-nov-b" style="--pc:${Math.max(4, avance)}%"></i>`);
    mount(c, html`<div class="os-nov-c">${icono(D_BAJAR)}<div class="os-nov-t"><b>Actualización lista</b><span>Versión ${nombreVersion(ultima)}. Se baja sola y la app vuelve a abrir en un par de minutos.</span></div></div>
      <div class="os-nov-a"><button type="button" class="os-nov-p" data-nov="ir">Actualizar</button><button type="button" class="os-nov-s" data-nov="tarde">Más tarde</button><button type="button" class="os-nov-l" data-nov="bajar" ${descargando ? 'disabled' : ''}>Descargar</button></div><p class="os-nov-err" aria-live="polite"></p>`);
    $('[data-nov="ir"]', c).addEventListener('click', () => {
      if (!app().instalar) return app().actualizar?.(); // las apps viejas usan su ventana de confirmación
      avance = 0; pintar(); app().instalar();
    });
    $('[data-nov="bajar"]', c).addEventListener('click', descargar);
    $('[data-nov="tarde"]', c).addEventListener('click', masTarde);
    return;
  }
  const borrador = hayBorrador();
  mount(c, html`<div class="os-nov-c">${icono(D_RECARGAR)}<div class="os-nov-t"><b>Hay cambios nuevos</b><span>${borrador ? 'Tienes un texto sin enviar. Envíalo antes de recargar para no perderlo.' : 'Recarga para verlos.'}</span></div></div>
    <div class="os-nov-a"><button type="button" class="os-nov-p" data-nov="rec">${borrador && confirmarRecarga ? 'Recargar igual' : 'Recargar'}</button><button type="button" class="os-nov-s" data-nov="tarde">Más tarde</button></div>`);
  $('[data-nov="rec"]', c).addEventListener('click', () => {
    if (hayBorrador() && !confirmarRecarga) { confirmarRecarga = true; return pintar(); } // con un borrador, hace falta un segundo toque
    location.reload();
  });
  $('[data-nov="tarde"]', c).addEventListener('click', masTarde);
}

async function idWeb() {
  try { const r = await fetch('/api/os/version', { cache: 'no-store', credentials: 'same-origin' }); return r.ok ? (await r.json()).id || null : null; } catch { return null; }
}
async function revisar() {
  if (Date.now() - ultimaRevision < 30_000) return; // enfocar la ventana varias veces seguidas no satura al servidor
  ultimaRevision = Date.now();
  if (app()) { try { ultima = await api('escritorio/version'); } catch { /* sin respuesta: se vuelve a preguntar en la próxima vuelta */ } }
  const id = await idWeb();
  if (id) { if (!inicialWeb) inicialWeb = id; actualWeb = id; }
  pintar();
}

export async function pintarActualizacion() {
  if (!arrancado) {
    arrancado = true;
    app()?.alProgreso?.((n) => { avance = n < 0 ? null : n; pintar(); });
    setInterval(revisar, CADA);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) revisar(); });
    window.addEventListener('focus', revisar);
  }
  await revisar();
}
