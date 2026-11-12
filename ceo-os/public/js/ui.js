// ui.js · la única puerta a los componentes con comportamiento del OS: menú, popover, tooltip, diálogo, tabs y segmented.
// El comportamiento y la accesibilidad (teclado ↑↓ Home End Enter Esc, tipo-para-buscar, roles ARIA, cerrar al hacer clic
// afuera, devolver el foco) vienen de Zag.js; la posición (flip, shift, offset, arrow, size), de Floating UI (por dentro
// de @zag-js/popper). Los dos están vendorizados en /vendor/zag-1.47.0/ (scripts/vendor-ui.mjs) y se bajan con import()
// solo la primera vez que se abre un menú, un popover o un tooltip. El diálogo es <dialog> nativo (foco atrapado y Esc
// del navegador) y las tabs son marcado + teclado propio: no bajan nada.
// El aspecto lo mandan los tokens --ui-* (primitives.css) y las reglas .ui-* / .tabs / .seg de app.css.
//
// API (fija; las pantallas no importan Zag directo):
//   ui.menu(ancla, items, op)        ancla = botón (o {x,y} / evento para clic derecho). → Promise<{ el, cerrar }>
//       item = { label, sub, icon, fin, shortcut, danger, disabled, checked, href, onSelect, items:[submenú] } · '-' · { grupo }
//       op = { titulo, buscar, pie, placement, ancho, clase, etiqueta, contenedor, onClose, cerrarAlElegir }
//   ui.popover(ancla, contenido, op) contenido = html (string/raw) · Element · fn(el) → Promise<{ el, cerrar, reposicionar }>
//       op = { placement, flecha, clase, etiqueta, ancho, onClose, foco }
//   ui.tooltip(el, texto, op)        un tooltip para un elemento (los [data-tip] se cablean solos con instalarUi()).
//   ui.dialog(op)                    op = { titulo, cuerpo, acciones:[{ label, value, tipo }], forma, clase, etiqueta,
//       cerrarFuera, alAbrir, antesDeCerrar } → { el, cuerpo, cerrar(v), cerrado: Promise<v|null> }
//   ui.tabs(items, op) / ui.segmented(items, op)  → html de un tablist (.tabs subrayado para vistas · .seg pastilla para filtros)
//       items = [{ value, label, icon, on, disabled, attrs }] · op = { etiqueta, act, clase, mini }
//   instalarUi()                     una vez (app.js): tooltips de [data-tip] y teclado/ARIA de todo .tabs / .seg.
import { svgIco } from './iconos.js';

const VENDOR = '/vendor/zag-1.47.0/';
const modulos = {};
const cargar = (n) => (modulos[n] ||= import(`${VENDOR}${n}.js`));
// Para la prueba y la página de ejemplos: precargar sin abrir nada.
export const precargar = (...ns) => Promise.all(ns.map(cargar));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
// html ya armado (el Raw de core.js o un string que empieza con <) pasa tal cual; lo demás se escapa.
const crudo = (v) => (v == null || v === false ? '' : typeof v === 'object' && 's' in v ? v.s : String(v));
const icono = (v, s = 15) => (!v ? '' : typeof v === 'string' && /^[a-z0-9-]+$/i.test(v) ? svgIco(v, s) : crudo(v));
let nId = 0;
const nuevoId = (p) => `ui-${p}-${++nId}`;
const idDe = (el) => el.id || (el.id = nuevoId('ancla'));
const movimientoReducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ¿El último gesto fue de teclado? (abrir con Enter/Espacio resalta el primer ítem; con el mouse, no).
let ultimoTeclado = false;
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', () => { ultimoTeclado = true; }, true);
  document.addEventListener('pointerdown', () => { ultimoTeclado = false; }, true);
}

const posicion = (op, base = {}) => ({ placement: op.placement || base.placement || 'bottom-start', gutter: op.gutter ?? 6, overflowPadding: 8, fitViewport: true, flip: true, slide: true, ...(op.boundary ? { boundary: op.boundary } : {}), ...(op.posicion || {}) });

// ======================================================================================================================
// MENÚ
// ======================================================================================================================
let menuAbierto = null; // { ancla, cerrar }
const normal = (it, i) => {
  if (it === '-' || it?.sep) return { sep: true };
  if (it?.grupo != null) return { grupo: it.grupo };
  return {
    value: String(it.value ?? it.v ?? `i${i}`), label: it.label ?? it.l ?? '', sub: it.sub || '', icon: it.icon ?? it.ico ?? '', fin: it.fin || '',
    shortcut: it.shortcut || '', danger: Boolean(it.danger), disabled: Boolean(it.disabled ?? it.off), checked: it.checked ?? it.on,
    href: it.href || '', onSelect: it.onSelect || it.run || null, items: it.items || null, cerrar: it.cerrarAlElegir,
  };
};

export async function menu(ancla, items, op = {}) {
  const punto = ancla && !(ancla instanceof Element) ? { x: ancla.clientX ?? ancla.x, y: ancla.clientY ?? ancla.y } : null;
  const trigger = punto ? null : ancla;
  // El mismo botón otra vez: cierra (como un interruptor).
  if (menuAbierto && trigger && menuAbierto.ancla === trigger) { menuAbierto.cerrar(); return null; }
  menuAbierto?.cerrar();
  const yo = { ancla: trigger, cerrar: () => {} }; menuAbierto = yo;
  const z = await cargar('menu');
  if (menuAbierto !== yo) return null; // otro menú se abrió mientras bajaba el módulo
  const volverA = trigger || document.activeElement;
  const lista = items.map(normal);
  const raiz = crearMenu(z, { lista, op, trigger, punto, nivel: 0, alCerrar: () => {
    if (menuAbierto === yo) menuAbierto = null;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    // Devolver el foco al disparador (Zag lo hace con su trigger; aquí lo cuidamos también para el clic derecho).
    setTimeout(() => { const a = document.activeElement; if ((!a || a === document.body) && volverA?.isConnected) volverA.focus({ preventScroll: true }); }, 0);
    op.onClose?.();
  } });
  yo.cerrar = raiz.cerrar;
  if (trigger) { trigger.setAttribute('aria-haspopup', 'menu'); trigger.setAttribute('aria-expanded', 'true'); trigger.setAttribute('aria-controls', raiz.contentId); }
  raiz.abrir();
  return { el: raiz.el, cerrar: raiz.cerrar };
}

function crearMenu(z, { lista, op, trigger, punto, nivel, padre, alCerrar }) {
  const { menu: M, VanillaMachine, normalizeProps, spreadProps } = z;
  const id = nuevoId('menu');
  const pos = document.createElement('div'); pos.className = 'ui-pos';
  const el = document.createElement('div'); el.className = `ui-menu${op.clase ? ' ' + op.clase : ''}`;
  if (op.ancho) el.style.setProperty('--ui-menu-w', typeof op.ancho === 'number' ? op.ancho + 'px' : op.ancho);
  pos.append(el);
  let q = '', cerrado = false, api = null;
  const hijos = new Map(); // value → submenú
  const props = {
    id, 'aria-label': op.etiqueta || op.titulo || undefined, loopFocus: true, typeahead: !op.buscar,
    closeOnSelect: op.cerrarAlElegir !== false, positioning: posicion(op, { placement: nivel ? 'right-start' : 'bottom-start' }),
    ...(trigger ? { ids: { trigger: idDe(trigger) } } : {}),
    onSelect: ({ value }) => {
      const it = lista.find((x) => x.value === value); if (!it || it.items) return;
      // Primero se cierra (y vuelve el foco); luego corre la acción, que puede abrir un diálogo.
      if (it.onSelect) setTimeout(() => it.onSelect(it), 0);
      op.onSelect && setTimeout(() => op.onSelect(value, it), 0);
    },
    // Un submenú se cierra y se vuelve a abrir (← →); solo el menú de arriba se desarma al cerrarse.
    onOpenChange: ({ open }) => { if (!open && !nivel) fin(); },
    // Tocar el disparador con el menú abierto lo cierra el propio disparador (toggle), no el «clic afuera».
    onPointerDownOutside: (e) => { if (trigger && trigger.contains(e.target)) e.preventDefault(); },
  };
  const maquina = new VanillaMachine(M.machine, props);
  const visibles = () => lista.filter((x) => (x.grupo != null || x.sep ? !q : !q || `${x.label} ${x.sub}`.toLowerCase().includes(q.toLowerCase())));
  const filaHtml = (x) => {
    if (x.sep) return '<hr class="ui-menu-sep">';
    if (x.grupo != null) return `<span class="ui-menu-k" role="presentation">${esc(x.grupo)}</span>`;
    const tag = x.href ? 'a' : 'button';
    const ext = x.href ? ` href="${esc(x.href)}"` : ' type="button"';
    return `<${tag} class="ui-mi${x.danger ? ' danger' : ''}" data-ui-v="${esc(x.value)}"${ext}>${x.icon ? `<span class="ui-mi-i" aria-hidden="true">${icono(x.icon)}</span>` : ''}<span class="ui-mi-t"><b>${esc(x.label)}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</span>${crudo(x.fin)}${x.shortcut ? `<kbd class="ui-mi-k">${esc(x.shortcut)}</kbd>` : ''}${x.checked ? `<span class="ui-mi-ok" aria-hidden="true">${svgIco('check', 14)}</span>` : ''}${x.items ? `<span class="ui-mi-sub" aria-hidden="true">${svgIco('chevron-right', 14)}</span>` : ''}</${tag}>`;
  };
  const pintarLista = () => {
    const xs = visibles();
    const l = el.querySelector('.ui-menu-l');
    l.innerHTML = xs.length ? xs.map(filaHtml).join('') : `<p class="ui-menu-vacio">${esc(op.vacio || 'Nada por aquí.')}</p>`;
  };
  el.innerHTML = `${op.titulo ? `<span class="ui-menu-k ui-menu-tit">${esc(op.titulo)}</span>` : ''}${op.buscar ? `<input class="ui-menu-q" type="search" autocomplete="off" placeholder="${esc(typeof op.buscar === 'string' ? op.buscar : 'Buscar')}" aria-label="${esc(typeof op.buscar === 'string' ? op.buscar : 'Buscar')}">` : ''}<div class="ui-menu-l"></div>${crudo(op.pie)}`;
  pintarLista();

  const render = () => {
    api = M.connect(maquina.service, normalizeProps);
    spreadProps(pos, api.getPositionerProps(), id);
    spreadProps(el, api.getContentProps(), id);
    for (const b of el.querySelectorAll('.ui-mi[data-ui-v]')) {
      const x = lista.find((y) => y.value === b.dataset.uiV); if (!x) continue;
      if (x.items) { const h = hijos.get(x.value); if (h) spreadProps(b, api.getTriggerItemProps(h.api()), id); continue; }
      const p = typeof x.checked === 'boolean' ? api.getOptionItemProps({ type: 'radio', value: x.value, checked: x.checked, disabled: x.disabled, valueText: x.label })
        : api.getItemProps({ value: x.value, disabled: x.disabled, valueText: x.label, closeOnSelect: x.cerrar });
      spreadProps(b, p, id);
    }
  };
  maquina.subscribe(render);
  maquina.start();
  (op.contenedor || document.body).append(pos);
  render();
  // Submenús: una máquina hija por ítem con items[] (Zag los enlaza con setParent/setChild).
  for (const x of lista) if (x.items) {
    const h = crearMenu(z, { lista: x.items.map(normal), op: { ...op, titulo: '', buscar: false, pie: '', etiqueta: x.label, placement: 'right-start', gutter: 2 }, nivel: nivel + 1, padre: { maquina, api: () => api }, alCerrar: () => {} });
    hijos.set(x.value, h);
    api.setChild(h.maquina.service); h.api().setParent(maquina.service);
  }
  render();

  const q$ = el.querySelector('.ui-menu-q');
  if (q$) {
    q$.addEventListener('input', () => { q = q$.value; pintarLista(); render(); const p = el.querySelector('.ui-mi:not([data-disabled])'); if (p?.dataset.value) api.setHighlightedValue(p.dataset.value); });
    // En la caja de búsqueda, Espacio, Inicio, Fin y ←→ escriben; ↑↓ y Enter siguen moviendo el menú.
    q$.addEventListener('keydown', (e) => { if ([' ', 'Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.stopPropagation(); });
  }
  function fin() {
    if (cerrado) return; cerrado = true;
    for (const h of hijos.values()) h.cerrar();
    const salir = () => { try { maquina.stop(); } catch { /* ya parada */ } pos.remove(); };
    if (movimientoReducido()) salir(); else { el.dataset.saliendo = ''; setTimeout(salir, 120); }
    alCerrar?.();
  }
  return {
    el, maquina, contentId: el.id, api: () => api,
    abrir: () => {
      if (punto) maquina.send({ type: 'CONTEXT_MENU', point: punto });
      else api.setOpen(true);
      // El foco entra al menú ya (Zag lo pone en el siguiente cuadro) y, con teclado o búsqueda, el primer ítem queda
      // resaltado en el acto: así las flechas no se pierden si se teclea rápido.
      render(); if (q$) q$.focus({ preventScroll: true }); else if (!nivel) el.focus({ preventScroll: true });
      const primero = el.querySelector('.ui-mi[data-value]:not([data-disabled])');
      if ((ultimoTeclado || op.buscar) && primero) api.setHighlightedValue(primero.dataset.value);
    },
    cerrar: () => { if (!cerrado) { if (api?.open) api.setOpen(false); fin(); } },
  };
}
export const cerrarMenu = () => menuAbierto?.cerrar();

// ======================================================================================================================
// POPOVER (contenido libre anclado a un botón: el selector de contexto, los paneles chicos de proyecto o diagrama)
// ======================================================================================================================
let popAbierto = null;
export async function popover(ancla, contenido, op = {}) {
  if (popAbierto && popAbierto.ancla === ancla) { popAbierto.cerrar(); return null; }
  popAbierto?.cerrar();
  const yo = { ancla, cerrar: () => {} }; popAbierto = yo;
  const { popover: P, VanillaMachine, normalizeProps, spreadProps } = await cargar('popover');
  if (popAbierto !== yo) return null;
  const id = nuevoId('pop');
  const pos = document.createElement('div'); pos.className = 'ui-pos';
  const el = document.createElement('div'); el.className = `ui-pop${op.clase ? ' ' + op.clase : ''}`;
  if (op.ancho) el.style.setProperty('--ui-pop-w', typeof op.ancho === 'number' ? op.ancho + 'px' : op.ancho);
  let flecha = null;
  if (op.flecha) { flecha = document.createElement('div'); flecha.className = 'ui-pop-flecha'; flecha.innerHTML = '<div class="ui-pop-punta"></div>'; pos.append(flecha); }
  pos.append(el);
  if (typeof contenido === 'function') contenido(el); else if (contenido instanceof Node) el.append(contenido); else el.innerHTML = crudo(contenido);
  let cerrado = false, api = null;
  const maquina = new VanillaMachine(P.machine, {
    id, ids: { trigger: idDe(ancla) }, modal: false, portalled: true, autoFocus: op.foco !== false,
    ...(op.foco instanceof Element ? { initialFocusEl: () => op.foco } : {}),
    positioning: posicion(op, { placement: 'bottom-start' }),
    onOpenChange: ({ open }) => { if (!open) fin(); },
    onPointerDownOutside: (e) => { if (ancla.contains(e.target)) e.preventDefault(); },
  });
  const render = () => {
    api = P.connect(maquina.service, normalizeProps);
    spreadProps(pos, api.getPositionerProps(), id);
    const cp = api.getContentProps(); if (op.etiqueta) cp['aria-label'] = op.etiqueta;
    spreadProps(el, cp, id);
    if (flecha) { spreadProps(flecha, api.getArrowProps(), id); spreadProps(flecha.firstChild, api.getArrowTipProps(), id); }
  };
  maquina.subscribe(render); maquina.start();
  (op.contenedor || document.body).append(pos); render();
  ancla.setAttribute('aria-haspopup', 'dialog'); ancla.setAttribute('aria-expanded', 'true'); ancla.setAttribute('aria-controls', el.id);
  api.setOpen(true);
  function fin() {
    if (cerrado) return; cerrado = true; if (popAbierto === yo) popAbierto = null;
    ancla.setAttribute('aria-expanded', 'false');
    const salir = () => { try { maquina.stop(); } catch { /* ya parada */ } pos.remove(); };
    if (movimientoReducido()) salir(); else { el.dataset.saliendo = ''; setTimeout(salir, 120); }
    setTimeout(() => { const a = document.activeElement; if ((!a || a === document.body) && ancla.isConnected) ancla.focus({ preventScroll: true }); }, 0);
    op.onClose?.();
  }
  const cerrar = () => { if (!cerrado) { if (api?.open) api.setOpen(false); fin(); } };
  yo.cerrar = cerrar;
  return { el, cerrar, reposicionar: () => api?.reposition() };
}
export const cerrarPopover = () => popAbierto?.cerrar();

// ======================================================================================================================
// TOOLTIP (texto corto al pasar o enfocar; nunca lleva botones)
// ======================================================================================================================
const tips = new WeakMap();
export async function tooltip(el, texto, op = {}) {
  if (tips.has(el)) { tips.get(el).texto(texto); return tips.get(el); }
  const reg = { texto: (t) => { reg.t = t; } , t: texto }; tips.set(el, reg);
  const { tooltip: T, VanillaMachine, normalizeProps, spreadProps } = await cargar('tooltip');
  const id = nuevoId('tip');
  const pos = document.createElement('div'); pos.className = 'ui-pos ui-pos-tip';
  const c = document.createElement('div'); c.className = 'ui-tip'; pos.append(c);
  let api = null, vigia = 0;
  const maquina = new VanillaMachine(T.machine, {
    id, ids: { trigger: idDe(el) }, openDelay: op.retraso ?? 350, closeDelay: 80, interactive: false,
    positioning: posicion(op, { placement: op.placement || 'top' }),
    onOpenChange: ({ open }) => {
      if (open) { c.textContent = reg.t; document.body.append(pos); render(); const mira = () => { if (!el.isConnected) { api?.setOpen(false); pos.remove(); return; } vigia = requestAnimationFrame(mira); }; vigia = requestAnimationFrame(mira); }
      else { cancelAnimationFrame(vigia); setTimeout(() => { if (!api?.open) pos.remove(); }, 0); }
    },
  });
  const render = () => { api = T.connect(maquina.service, normalizeProps); spreadProps(el, api.getTriggerProps(), id); spreadProps(pos, api.getPositionerProps(), id); spreadProps(c, api.getContentProps(), id); };
  maquina.subscribe(render); maquina.start(); render();
  // El texto también para lectores de pantalla (Zag lo enlaza con aria-describedby mientras está abierto).
  if (!el.getAttribute('aria-label') && !el.textContent.trim()) el.setAttribute('aria-label', texto);
  reg.abrir = () => api.setOpen(true); reg.cerrar = () => api.setOpen(false); reg.api = () => api;
  return reg;
}

// ======================================================================================================================
// DIÁLOGO (uno solo para todo el OS: <dialog> nativo con showModal)
// ======================================================================================================================
// forma: 'centro' (el de siempre) · 'hoja' (sube desde abajo en el cel, al centro en la compu) · 'lado' (panel a la derecha)
//        · 'imagen' (una imagen grande sobre fondo oscuro).
export function dialog(op = {}) {
  const dlg = document.createElement('dialog');
  dlg.className = `ui-dlg ui-dlg--${op.forma || 'centro'}${op.clase ? ' ' + op.clase : ''}`;
  const tId = nuevoId('dlg-t');
  if (op.titulo) dlg.setAttribute('aria-labelledby', tId); else if (op.etiqueta) dlg.setAttribute('aria-label', op.etiqueta);
  const acciones = (op.acciones || []).map((a, i) => `<button type="${a.tipo === 'primario' || (i === 0 && !a.tipo) ? 'submit' : 'button'}" class="btn${a.tipo === 'ghost' ? ' ghost' : ''}${a.tipo === 'peligro' ? ' danger' : ''}" data-ui-v="${esc(a.value ?? a.label)}">${esc(a.label)}</button>`).join('');
  dlg.innerHTML = `<form method="dialog" class="ui-dlg-in">${op.titulo ? `<header class="ui-dlg-h"><h3 id="${tId}">${esc(op.titulo)}</h3>${op.x !== false ? `<button type="button" class="ui-dlg-x" data-ui-v="" aria-label="Cerrar">${svgIco('x', 16)}</button>` : ''}</header>` : ''}<div class="ui-dlg-b"></div>${acciones ? `<footer class="ui-dlg-f">${acciones}</footer>` : ''}</form>`;
  const cuerpo = dlg.querySelector('.ui-dlg-b'), form = dlg.querySelector('form');
  if (op.cuerpo instanceof Node) cuerpo.append(op.cuerpo); else cuerpo.innerHTML = crudo(op.cuerpo);
  const antes = document.activeElement;
  let valor = null, listo;
  const cerrado = new Promise((r) => { listo = r; });
  const cerrar = (v = null) => { valor = v; if (dlg.open) dlg.close(); };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const b = e.submitter; const v = b?.dataset.uiV ?? 'ok';
    if (op.antesDeCerrar && op.antesDeCerrar(v, form) === false) return;
    cerrar(v === '' ? null : v);
  });
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-ui-v]');
    if (b && b.type === 'button') { const v = b.dataset.uiV; if (op.antesDeCerrar && v !== '' && op.antesDeCerrar(v, form) === false) return; return cerrar(v === '' ? null : v); }
    // Clic en el fondo (el propio <dialog>, fuera de su caja) = cerrar.
    if (e.target === dlg && op.cerrarFuera !== false) { const r = dlg.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom || op.forma === 'imagen') cerrar(null); }
  });
  dlg.addEventListener('cancel', (e) => { if (op.esc === false) e.preventDefault(); else valor = null; });
  dlg.addEventListener('close', () => {
    dlg.remove(); listo(valor); op.onClose?.(valor);
    if (antes?.isConnected && (document.activeElement === document.body || !document.activeElement)) antes.focus({ preventScroll: true });
  });
  (op.contenedor || document.body).append(dlg);
  dlg.showModal();
  op.alAbrir?.(dlg);
  // El foco: lo primero que se puede escribir; si no hay, la acción principal (nunca la X).
  const primero = op.foco || cuerpo.querySelector('input:not([type=hidden]):not([disabled]),select,textarea,[autofocus]') || dlg.querySelector('.ui-dlg-f .btn') || cuerpo.querySelector('button,a[href]');
  primero?.focus({ preventScroll: true });
  return { el: dlg, cuerpo, form, cerrar, cerrado };
}
// confirmar('¿Borrar X?', { ok: 'Sí, borrar', peligro: true }) → Promise<boolean>
export function confirmar(msg, { ok = 'Sí, confirmar', no = 'Cancelar', peligro = false, detalle = '' } = {}) {
  return dialog({ titulo: msg, x: false, cuerpo: detalle ? `<p class="ui-dlg-p">${esc(detalle)}</p>` : '', acciones: [{ label: ok, value: 'ok', tipo: peligro ? 'peligro' : 'primario' }, { label: no, value: '', tipo: 'ghost' }] }).cerrado.then((v) => v === 'ok');
}

// ======================================================================================================================
// TABS y SEGMENTED: dos formas, un mismo teclado
// ======================================================================================================================
// .tabs = subrayado, para cambiar de VISTA (Resumen · Detalle · Historial).
// .seg  = pastilla, para FILTRAR lo que ya se ve (Todas · Abiertas · Hechas; Semana · Mes).
// Marcado: un contenedor .tabs/.seg con botones; el activo lleva .on (o aria-selected="true"). Con instalarUi() cada
// lista recibe role=tablist, sus botones role=tab + aria-selected + tabindex móvil, y ←→ Inicio Fin mueven el foco
// (y lo activan: hacen clic, así la pantalla sigue con su propio data-act). Los links (<a>) quedan como navegación.
const tablist = (forma) => (items, op = {}) => {
  const b = (x) => {
    const on = Boolean(x.on);
    const attrs = Object.entries(x.attrs || {}).map(([k, v]) => ` ${esc(k)}="${esc(v)}"`).join('');
    const act = op.act ? ` data-act="${esc(op.act)}"` : '';
    return `<button type="button" role="tab" class="${on ? 'on' : ''}" aria-selected="${on}" tabindex="${on ? 0 : -1}" data-v="${esc(x.value)}"${act}${attrs}${x.disabled ? ' disabled' : ''}>${x.icon ? icono(x.icon, 14) : ''}${esc(x.label)}${x.cuenta != null ? `<span class="tab-n">${esc(x.cuenta)}</span>` : ''}</button>`;
  };
  return { s: `<div class="${forma}${op.mini ? ' mini' : ''}${op.clase ? ' ' + op.clase : ''}" role="tablist"${op.etiqueta ? ` aria-label="${esc(op.etiqueta)}"` : ''}>${items.map(b).join('')}</div>`, toString() { return this.s; } };
};
export const tabs = tablist('tabs');
export const segmented = tablist('seg');

const TABLIST = '.tabs, .seg';
const esTab = (b) => b.matches('button:not([disabled])');
// Pone roles y estado a una lista ya pintada (sirve para el marcado que arma cada pantalla).
export function prepararTabs(lista) {
  if (!lista.hasAttribute('role')) lista.setAttribute('role', 'tablist');
  if (lista.getAttribute('role') !== 'tablist') return;
  const bs = [...lista.querySelectorAll(':scope > button')];
  if (!bs.length) return;
  // Manda .on (lo que cambia la pantalla); si nadie lo lleva, aria-selected.
  const activo = bs.find((b) => b.classList.contains('on')) || bs.find((b) => b.getAttribute('aria-selected') === 'true') || null;
  for (const b of bs) {
    b.setAttribute('role', 'tab');
    const on = b === activo;
    b.setAttribute('aria-selected', String(on)); b.classList.toggle('on', on);
    b.tabIndex = on || (!activo && b === bs[0]) ? 0 : -1;
  }
}
function tecladoTabs(e) {
  const b = e.target.closest?.('[role="tab"]'); const lista = b?.closest(TABLIST + ', [role="tablist"]'); if (!lista) return;
  const bs = [...lista.querySelectorAll(':scope > [role="tab"]')].filter(esTab); const i = bs.indexOf(b); if (i < 0) return;
  const vertical = lista.getAttribute('aria-orientation') === 'vertical';
  const map = { [vertical ? 'ArrowDown' : 'ArrowRight']: i + 1, [vertical ? 'ArrowUp' : 'ArrowLeft']: i - 1, Home: 0, End: bs.length - 1 };
  if (!(e.key in map)) return;
  e.preventDefault();
  const sig = bs[(map[e.key] + bs.length) % bs.length]; sig.focus(); sig.click();
}

// ======================================================================================================================
// instalarUi(): lo que se cablea una sola vez para todo el documento
// ======================================================================================================================
let instalado = false;
export function instalarUi(raiz = document) {
  if (instalado) return; instalado = true;
  // Tooltips: cualquier [data-tip] (por ejemplo la «i» de los títulos). Se crea al primer paso del mouse o del foco.
  const tipDe = (e) => {
    const t = e.target.closest?.('[data-tip]'); if (!t || tips.has(t)) return;
    tooltip(t, t.dataset.tip, { retraso: e.type === 'focusin' ? 0 : 350 }).then((r) => { if (t.matches(':hover, :focus-visible')) r.abrir?.(); });
  };
  raiz.addEventListener('pointerover', tipDe); raiz.addEventListener('focusin', tipDe);
  // Tabs: roles y estado al pintarse; después de cada clic (la pantalla cambia .on), se vuelve a leer.
  const preparar = (n) => { if (n.nodeType !== 1) return; if (n.matches(TABLIST)) prepararTabs(n); for (const l of n.querySelectorAll?.(TABLIST) || []) prepararTabs(l); };
  preparar(raiz.body || raiz);
  new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'childList') { for (const n of m.addedNodes) preparar(n); if (m.target.matches?.(TABLIST)) prepararTabs(m.target); } else if (m.target.parentElement?.matches(TABLIST)) prepararTabs(m.target.parentElement); } })
    .observe(raiz.body || raiz, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  raiz.addEventListener('keydown', tecladoTabs);
}

export const ui = { menu, popover, tooltip, dialog, confirmar, tabs, segmented, cerrarMenu, cerrarPopover, instalarUi, prepararTabs, precargar };
export default ui;
