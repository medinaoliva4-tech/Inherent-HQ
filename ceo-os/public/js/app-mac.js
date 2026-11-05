// La actualización de la app de Mac: un aviso junto al perfil. Un toque baja la versión nueva, cambia la app y la vuelve a abrir.
import { $, html, mount, api } from './core.js';
import { estadoApp } from './app-mac-estado.js';

let ultima = null, error = '', pedido = 0, avance = null;
const app = () => window.inherentEscritorio;

function pintar() {
  const caja = $('#lat-act'); if (!caja) return;
  const hay = estadoApp(app()?.version, ultima) === 'nueva';
  caja.hidden = !app() || (!hay && !error);
  if (caja.hidden) return;
  if (avance !== null) return mount(caja, html`<b>Actualizando…</b><span>Al terminar, la app se cierra y vuelve a abrir.</span><i style="--pc:${Math.max(4, avance)}%"></i>`);
  if (!hay) return mount(caja, html`<b>No pude revisar actualizaciones</b><span>${error}</span>`);
  mount(caja, html`<b>Actualización lista</b><span>Versión ${ultima.version}. Toca Actualizar: se baja sola y la app vuelve a abrir en un par de minutos. No pierdes nada.</span><button type="button" class="btn" data-lat-act>Actualizar</button>`);
  $('[data-lat-act]', caja).addEventListener('click', () => {
    if (!app().instalar) return app().actualizar?.(); // las apps viejas usan su ventana de confirmación
    avance = 0; pintar(); app().instalar();
  });
}

export async function pintarActualizacion() {
  if (!app()) return;
  if (!pedido) app().alProgreso?.((n) => { avance = n < 0 ? null : n; pintar(); });
  pintar();
  if (Date.now() - pedido < 6 * 3600_000) return;
  pedido = Date.now();
  try { ultima = await api('escritorio/version'); error = ''; } catch (e) { error = e.message || 'El OS no respondió.'; }
  pintar();
}
