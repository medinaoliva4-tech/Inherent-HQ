// El contexto: el cliente o la marca con la que se trabaja en los cinco workspaces y en el Chat. Aquí vive una sola lista de
// clientes (la unión de las marcas de brandlist.js y los clientes de Estrategia de stratlist.js), el elegido guardado por
// persona en este navegador (os.ctx.<correo>) y copiado a los slugs del Chat (os.llm.<correo>, lo lee screens/llm.js), y el
// botón del selector con su popover. No es puro: toca localStorage y el DOM.
// El popover se cierra al navegar, al hacer clic afuera y con Escape, con manejadores instalados UNA vez a nivel document;
// abrir o cerrar se decide mirando el DOM (.ctx-pop), nunca con una referencia al botón (PLAN-WORKSPACES, Anexo A).
import { html, mount, ico, initials, events, $, $$ } from './core.js';
import { loadBrands, brandAccess } from './brandlist.js';
import { loadEstrategia } from './stratlist.js';

let lista = null, pendiente = null;
const K = (me) => `os.ctx.${me?.email || ''}`;
const KL = (me) => `os.llm.${me?.email || ''}`;
const veEstrategia = (me) => me?.role !== 'client' && (me?.areas || []).includes('estrategia');
const MODOS_CON_CLIENTE = ['estrategia', 'marketing', 'diseno', 'consulting', 'produccion'];

// ---------- La lista ----------
// Orden: Inherent · clientes con ficha · cuentas desde cotización y perfiles de contenido · la marca personal (solo el CEO).
// Cada ítem: { slug, name, sub, personal, content, client, estrategia (está en la lista de Estrategia), nivel (el de Estrategia, si hay) }.
function unir(me, marcas, clientes) {
  const est = new Map(clientes.filter((c) => c?.slug).map((c) => [c.slug, c]));
  const ceo = me?.role === 'ceo';
  const deMarca = (b) => { const c = est.get(b.slug); return { slug: b.slug, name: b.name || b.slug, sub: b.sub || '', personal: Boolean(b.personal), content: Boolean(b.content), client: Boolean(b.client), estrategia: Boolean(c), nivel: c?.nivel || null }; };
  const deEstrategia = (c) => ({ slug: c.slug, name: c.nombre || c.slug, sub: c.slug === 'inherent' ? 'La marca de la casa' : c.nivel?.nombre || c.plan || (c.hayFicha ? 'Cliente' : 'Sin ficha de oferta'), personal: false, content: false, client: c.slug !== 'inherent', estrategia: true, nivel: c.nivel || null });
  const vistos = new Set(), inherent = [], ficha = [], otros = [], personal = [];
  // Las marcas ya vienen en este orden (brandlist.js); solo se separa lo que Estrategia dice que tiene ficha.
  for (const b of marcas) {
    if (!b?.slug || vistos.has(b.slug) || (b.personal && !ceo)) continue;
    vistos.add(b.slug);
    (b.slug === 'inherent' ? inherent : b.personal ? personal : est.get(b.slug)?.hayFicha ? ficha : otros).push(deMarca(b));
  }
  // Los clientes que solo están en Estrategia (esta persona no ve marcas, o el cliente no tiene perfil ni cuenta).
  for (const c of clientes) {
    if (!c?.slug || vistos.has(c.slug) || c.slug === 'personal') continue;
    vistos.add(c.slug);
    (c.slug === 'inherent' ? inherent : c.hayFicha ? ficha : otros).push(deEstrategia(c));
  }
  return [...inherent, ...ficha, ...otros, ...personal];
}

export function cargarContexto(me, { force = false } = {}) {
  if (lista && !force) return Promise.resolve(lista);
  if (pendiente && !force) return pendiente;
  pendiente = Promise.all([
    brandAccess(me).any ? loadBrands(me, { force }).catch(() => []) : [],
    veEstrategia(me) ? loadEstrategia({ force }).then((d) => d?.clientes || []).catch(() => []) : [],
  ]).then(([marcas, clientes]) => { lista = unir(me, marcas || [], clientes || []); pendiente = null; return lista; })
    .catch(() => { pendiente = null; return (lista = []); });
  return pendiente;
}
export const contextoLista = () => lista || [];
export const contextoDe = (slug) => (slug ? contextoLista().find((x) => x.slug === slug) || null : null);
export const nombreContexto = (slug) => contextoDe(slug)?.name || '';

// ---------- El elegido ----------
export function contextoActual(me) {
  let s = ''; try { s = localStorage.getItem(K(me)) || ''; } catch { s = ''; }
  if (s && lista && !lista.some((x) => x.slug === s)) return '';
  return s;
}
// Guarda el cliente y lo copia a los slugs del Chat (sin tocar su modo, borrador ni mes). Con '' se quita.
export function ponerContexto(me, slug = '') {
  slug = String(slug || '');
  try { if (slug) localStorage.setItem(K(me), slug); else localStorage.removeItem(K(me)); } catch {}
  try {
    const k = KL(me); let p = {};
    try { p = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch { p = {}; }
    p.slugs = { ...(p.slugs || {}), ...Object.fromEntries(MODOS_CON_CLIENTE.map((m) => [m, slug])) };
    localStorage.setItem(k, JSON.stringify(p));
  } catch {}
  events.dispatchEvent(new CustomEvent('contexto', { detail: { slug } }));
}

// ---------- El HTML ----------
const mono = (it, px = 14) => (it ? (it.personal ? ico('lock', px) : initials(it.name)) : ico('users', px));
const opcionHtml = (x, on) => html`<button type="button" role="option" class="ctx-op${on ? ' on' : ''}" data-ctx-elegir="${x.slug}" aria-selected="${on ? 'true' : 'false'}"><span class="ctx-mono">${mono(x)}</span><span class="ctx-t"><b>${x.name}</b><small>${x.sub}</small></span>${on ? ico('check', 14) : ''}</button>`;
const vacioHtml = () => html`<p class="mut sm ctx-vacio">${lista ? 'No hay clientes que puedas abrir todavía.' : 'Cargando clientes…'}</p>`;

// grande: false → el botón de la barra (abre el popover). true → el panel inline con la lista a la vista (el Home sin cliente).
export function selectorHtml(me, { grande = false } = {}) {
  const actual = contextoActual(me), it = contextoDe(actual), L = contextoLista();
  if (!grande) {
    const sub = it ? it.sub : L.length ? 'Para trabajar en los workspaces' : lista ? 'Sin clientes que abrir' : 'Cargando…';
    return html`<button type="button" class="ctx-btn${it ? ' on' : ''}" data-ctx-menu aria-haspopup="listbox" aria-expanded="false" title="Cliente"><span class="ctx-mono">${mono(it)}</span><span class="ctx-t"><b>${it ? it.name : 'Elige un cliente'}</b><small>${sub}</small></span>${ico('chevron-down', 14)}</button>`;
  }
  return html`<div class="ctx-grande"><h2>¿Con qué cliente trabajamos?</h2><p class="mut">Los workspaces trabajan sobre un cliente. Elige uno; lo cambias arriba cuando quieras.</p>${L.length ? html`<div class="ctx-lista" role="listbox" aria-label="Clientes">${L.map((x) => opcionHtml(x, x.slug === actual))}</div>` : vacioHtml()}</div>`;
}

// ---------- El popover ----------
let instalado = false, cfg = { me: null, alElegir: null };
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function pintar(pop) {
  const L = contextoLista(), actual = contextoActual(cfg.me), q = $('.ctx-busca', pop)?.value || '';
  mount(pop, html`${L.length > 6 ? html`<input class="ctx-busca" type="search" placeholder="Buscar cliente" aria-label="Buscar cliente" autocomplete="off" value="${q}">` : ''}<div class="ctx-lista">${L.length ? L.map((x) => opcionHtml(x, x.slug === actual)) : vacioHtml()}</div>`);
  if (q) filtrar(pop, q);
}
function filtrar(pop, q) {
  const n = norm(q);
  for (const op of $$('.ctx-op', pop)) op.hidden = Boolean(n) && !norm(op.textContent).includes(n);
}
function abrirPopover(btn) {
  cerrarPopovers();
  const hoja = innerWidth <= 760;
  const pop = document.createElement('div');
  pop.className = 'ctx-pop' + (hoja ? ' hoja' : ''); pop.id = 'ctx-pop';
  pop.setAttribute('role', 'listbox'); pop.setAttribute('aria-label', 'Clientes');
  pintar(pop);
  if (!hoja) {
    // Bajo el botón; si el botón es un cuadrito (barra mini), a su derecha. Siempre dentro de la ventana.
    const r = btn.getBoundingClientRect(), mini = r.width < 120, ancho = Math.max(280, mini ? 0 : r.width), alto = Math.min(380, innerHeight - 16);
    const left = Math.max(8, Math.min(mini ? r.right + 10 : r.left, innerWidth - ancho - 8));
    const top = Math.max(8, Math.min(mini ? r.top : r.bottom + 6, innerHeight - alto - 8));
    Object.assign(pop.style, { top: `${top}px`, left: `${left}px`, width: `${ancho}px` });
  }
  pop.addEventListener('input', (e) => { if (e.target.matches('.ctx-busca')) filtrar(pop, e.target.value); });
  document.body.append(pop);
  btn.setAttribute('aria-expanded', 'true');
  ($('.ctx-busca', pop) || $('.ctx-op.on', pop) || $('.ctx-op', pop))?.focus();
  // Si la lista no había cargado, se carga y se vuelve a pintar mientras el popover siga abierto.
  if (!lista) cargarContexto(cfg.me).then(() => { const p = $('.ctx-pop'); if (p) pintar(p); });
}

// Quita el popover del selector y cualquier [data-popover] (los menús de app.js); el botón vuelve a «cerrado».
export function cerrarPopovers() {
  for (const p of $$('.ctx-pop, [data-popover]')) p.remove();
  for (const b of $$('[data-ctx-menu]')) b.setAttribute('aria-expanded', 'false');
}

// Instala los manejadores una sola vez; en llamadas siguientes solo actualiza a quién sirve y qué hace al elegir.
export function instalarContexto(me, { alElegir } = {}) {
  cfg = { me, alElegir: typeof alElegir === 'function' ? alElegir : null };
  if (instalado) return; instalado = true;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ctx-menu]');
    // Abrir o cerrar lo decide el DOM: si hay popover se cierra, si no se abre en este botón (aunque la barra lo haya vuelto a pintar).
    if (btn) { if ($('.ctx-pop')) cerrarPopovers(); else abrirPopover(btn); return; }
    const op = e.target.closest('[data-ctx-elegir]');
    if (op) { const slug = op.dataset.ctxElegir || ''; ponerContexto(cfg.me, slug); cerrarPopovers(); cfg.alElegir?.(slug); }
  });
  document.addEventListener('pointerdown', (e) => { if ($('.ctx-pop') && !e.target?.closest?.('[data-ctx-menu], .ctx-pop')) cerrarPopovers(); });
  document.addEventListener('keydown', (e) => {
    const pop = $('.ctx-pop'); if (!pop) return;
    if (e.key === 'Escape') { e.preventDefault(); const btn = $('[data-ctx-menu][aria-expanded="true"]') || $('[data-ctx-menu]'); cerrarPopovers(); btn?.focus(); return; }
    if (!pop.contains(document.activeElement)) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const ops = $$('.ctx-op:not([hidden])', pop); if (!ops.length) return;
      const i = ops.indexOf(document.activeElement), d = e.key === 'ArrowDown' ? 1 : -1;
      ops[i < 0 ? (d > 0 ? 0 : ops.length - 1) : (i + d + ops.length) % ops.length].focus();
    } else if (e.key === 'Enter' && document.activeElement.matches('.ctx-busca')) { e.preventDefault(); $('.ctx-op:not([hidden])', pop)?.click(); }
    else if (e.key === 'Tab') cerrarPopovers();
  });
  window.addEventListener('hashchange', cerrarPopovers);
}
