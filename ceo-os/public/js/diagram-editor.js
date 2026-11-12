// Editor visual de diagramas (tipo Figma / Whimsical), sin librerías: SVG + DOM.
// diagramEditor(host, data, opts) → el lienzo completo: paleta, barra, propiedades, mini-mapa, deshacer, exportar.
// diagramView(host, data, opts)   → el mismo motor en solo lectura (la vista del documento en la Library).
// El modelo, la geometría y Mermaid viven en diagram-model.js (puro, se prueba en Node).
import * as M from './diagram-model.js';
import { menu as uiMenu, popover as uiPopover, cerrarMenu, cerrarPopover } from './ui.js';
// Sin confirmación propia, la del OS (core.js se carga al usarla: este módulo sigue puro para las pruebas).
const confirmar = (m) => import('./core.js').then((c) => c.confirmAsk(m));
export { toMermaid, fromMermaid, fromDoc, template, templateMermaid, TEMPLATES, normalize, empty } from './diagram-model.js';

// Medir texto con la tipografía real (canvas); si el navegador no deja, la aproximación del modelo.
let mctx = null;
export function measure(s, fs = M.FS) {
  try { mctx ||= document.createElement('canvas').getContext('2d'); mctx.font = `500 ${fs}px ${M.FONT}`; return mctx.measureText(String(s)).width; }
  catch { return M.approxMeasure(s, fs); }
}
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const esc = M.xesc;
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
const MOD = isMac ? '⌘' : 'Ctrl';

const P = {
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', redo: 'm15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  pointer: 'M6 3.5 18.5 10l-5.6 1.8L10.5 18z', hand: 'M18 11V6.5a1.8 1.8 0 0 0-3.6 0V11M14.4 10V4.8a1.8 1.8 0 0 0-3.6 0V10M10.8 10.5V6.5a1.8 1.8 0 0 0-3.6 0V14a7.5 7.5 0 0 0 15 0v-3a1.8 1.8 0 0 0-3.6 0',
  al: 'M4 3v18M8 6h11v4H8zM8 14h7v4H8z', ac: 'M12 3v18M6 6h12v4H6zM8 14h8v4H8z', ar: 'M20 3v18M5 6h11v4H5zM9 14h7v4H9z',
  at: 'M3 4h18M6 8h4v11H6zM14 8h4v7h-4z', am: 'M3 12h18M6 6h4v12H6zM14 8h4v8h-4z', ab: 'M3 20h18M6 5h4v11H6zM14 9h4v7h-4z',
  dh: 'M4 3v18M20 3v18M10 7h4v10h-4z', dv: 'M3 4h18M3 20h18M7 10h10v4H7z',
  td: 'M9 3h6v4H9zM12 7v3M6 13v-3h12v3M3 13h6v5H3zM15 13h6v5h-6z', lr: 'M3 9h5v6H3zM8 12h3M11 6v12M11 6h2M11 18h2M13 4h7v5h-7zM13 15h7v5h-7z',
  grid: 'M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16', map: 'M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20',
  tpl: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', dl: 'M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 20h14',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.5M12 16.8v.1',
  plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  rect: 'M5 7h14a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 19 17H5a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 5 7z', diamond: 'M12 3.5 20.5 12 12 20.5 3.5 12z',
  ellipse: 'M12 6c4.7 0 8.5 2.7 8.5 6s-3.8 6-8.5 6-8.5-2.7-8.5-6 3.8-6 8.5-6z', note: 'M5 4h10l4 4v12H5zM15 4v4h4',
  trash: 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13', dup: 'M8.5 8.5h11v11h-11zM5 15.5H4.5v-11h11V5', swap: 'M7 7h13l-3-3M17 17H4l3 3',
  curve: 'M4 18C4 9 20 15 20 6', ortho: 'M4 18h8V6h8', arrow: 'M4 12h15m-5-5 5 5-5 5', line: 'M4 12h16', link: 'M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1',
};
const ic = (n, s = 17) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(P[n] || '').split(/(?=M)/).map((d) => `<path d="${d}"/>`).join('')}</svg>`;
const btn = (a, icon, title, extra = '') => `<button type="button" class="dg-b" data-a="${a}" title="${esc(title)}" aria-label="${esc(title)}" ${extra}>${ic(icon)}</button>`;
const SHORTCUTS = [
  ['Doble clic en el lienzo', 'Nuevo nodo'], ['Doble clic en un nodo o flecha', 'Escribir el texto'], ['Arrastrar desde un punto del borde', 'Conectar (suelta en el vacío y crea uno nuevo)'],
  ['Arrastrar el fondo', 'Seleccionar con marco'], ['Espacio + arrastrar · H', 'Mover el lienzo'], ['Rueda del mouse · pellizco', 'Zoom'], ['Dos dedos en el trackpad', 'Mover el lienzo'],
  [`${MOD} Z · ⇧ ${MOD} Z`, 'Deshacer · rehacer'], [`${MOD} D`, 'Duplicar'], [`${MOD} C · ${MOD} V`, 'Copiar · pegar'], [`${MOD} A`, 'Seleccionar todo'],
  ['Supr · ⌫', 'Borrar'], ['Flechas (⇧ = 16 px)', 'Mover poquito'], ['Enter', 'Escribir en el seleccionado'], ['⇧ 1 · 0', 'Ajustar a la vista · 100 %'], ['+ · −', 'Zoom'], ['G · M', 'Cuadrícula · mini-mapa'], [`${MOD} S`, 'Guardar'],
];
let N = 0, clip = null;

export function diagramEditor(host, data, opts = {}) {
  const ro = Boolean(opts.readonly), uid = 'dg' + ++N;
  let d = M.normalize(data || M.empty());
  let vp = { ...d.viewport };
  let sel = new Set(), selEdge = null, hover = null, tool = 'select', space = false, drag = null, editing = null, menu = null, raf = 0, dirty = false, sized = false;
  let snapOn = store.get('dg.snap') !== '0', gridOn = !ro && store.get('dg.grid') !== '0', miniOn = !ro && store.get('dg.mini') === '1';
  const undo = [], redo = [], pts = new Map();
  let lastTap = null;

  host.innerHTML = `<div class="dg${ro ? ' ro' : ''}" tabindex="0" aria-label="${ro ? 'Diagrama' : 'Editor de diagrama'}">
    ${ro ? '' : `<div class="dg-bar" role="toolbar" aria-label="Herramientas del diagrama">
      <div class="dg-grp">${btn('undo', 'undo', `Deshacer (${MOD} Z)`)}${btn('redo', 'redo', `Rehacer (⇧ ${MOD} Z)`)}</div>
      <div class="dg-grp">${btn('tool:select', 'pointer', 'Seleccionar (V)')}${btn('tool:hand', 'hand', 'Mover el lienzo (H)')}</div>
      <div class="dg-grp dg-need2">${btn('align:l', 'al', 'Alinear a la izquierda')}${btn('align:c', 'ac', 'Centrar en horizontal')}${btn('align:r', 'ar', 'Alinear a la derecha')}${btn('align:t', 'at', 'Alinear arriba')}${btn('align:m', 'am', 'Centrar en vertical')}${btn('align:b', 'ab', 'Alinear abajo')}<span class="dg-sep"></span>${btn('dist:h', 'dh', 'Distribuir en horizontal (3 o más)')}${btn('dist:v', 'dv', 'Distribuir en vertical (3 o más)')}</div>
      <div class="dg-grp"><button type="button" class="dg-b dg-txt" data-a="layout:TD" title="Auto-orden de arriba hacia abajo">${ic('td')}<span>Auto-orden</span></button>${btn('layout:LR', 'lr', 'Auto-orden de izquierda a derecha')}</div>
      <div class="dg-grp">${btn('grid', 'grid', 'Cuadrícula e imán (G)')}${btn('mini', 'map', 'Mini-mapa (M)')}</div>
      <div class="dg-fill"></div>
      <div class="dg-grp"><button type="button" class="dg-b dg-txt" data-a="menu:tpl" title="Plantillas">${ic('tpl')}<span>Plantillas</span></button><button type="button" class="dg-b dg-txt" data-a="menu:export" title="Exportar">${ic('dl')}<span>Exportar</span></button>${btn('menu:help', 'help', 'Atajos (?)')}</div>
    </div>`}
    <div class="dg-main">
      ${ro ? '' : `<aside class="dg-pal" aria-label="Formas">${Object.entries(M.SHAPES).map(([k, s]) => `<button type="button" class="dg-shape" draggable="true" data-a="add:${k}" data-shape="${k}" title="${esc(s.l)} — haz clic o arrástrala al lienzo">${ic(k, 22)}<span>${esc(s.l)}</span></button>`).join('')}</aside>`}
      <div class="dg-stage${gridOn ? ' grid' : ''}">
        <svg class="dg-svg" xmlns="http://www.w3.org/2000/svg">${M.defsSVG(uid)}<g class="dg-world"><g class="dg-edges"></g><g class="dg-nodes"></g><g class="dg-over"></g></g></svg>
        <div class="dg-zoom">${btn('zout', 'minus', 'Alejar (−)')}<button type="button" class="dg-b dg-zl" data-a="zfit" title="Ajustar a la vista (⇧ 1)">100%</button>${btn('zin', 'plus', 'Acercar (+)')}${ro ? btn('menu:export', 'dl', 'Descargar') : ''}</div>
        <div class="dg-mini" hidden><svg></svg></div>
        <div class="dg-emptyst" hidden></div>
      </div>
      ${ro ? '' : '<aside class="dg-props" aria-label="Propiedades"></aside>'}
    </div>
  </div>`;
  const root = host.querySelector('.dg'), stage = root.querySelector('.dg-stage'), svg = root.querySelector('.dg-svg');
  const world = svg.querySelector('.dg-world'), gE = svg.querySelector('.dg-edges'), gN = svg.querySelector('.dg-nodes'), gO = svg.querySelector('.dg-over');
  const mini = root.querySelector('.dg-mini'), miniSvg = mini.querySelector('svg'), props = root.querySelector('.dg-props'), emptyEl = root.querySelector('.dg-emptyst');
  const byId = () => new Map(d.nodes.map((n) => [n.id, n]));
  const node = (id) => d.nodes.find((n) => n.id === id);

  // ---------- historia ----------
  const snapshot = () => JSON.stringify({ nodes: d.nodes, edges: d.edges, dir: d.dir, edgeStyle: d.edgeStyle });
  const restore = (s) => { const o = JSON.parse(s); Object.assign(d, o); sel = new Set([...sel].filter((id) => node(id))); if (selEdge && !d.edges.some((e) => e.id === selEdge)) selEdge = null; };
  function push(before) { if (before === snapshot()) return; undo.push(before); if (undo.length > 150) undo.shift(); redo.length = 0; changed(); }
  function commit(fn) { const b = snapshot(); fn(); push(b); draw(); renderProps(); }
  function changed() { dirty = true; opts.onChange?.(get()); }
  const doUndo = () => { if (!undo.length) return; redo.push(snapshot()); restore(undo.pop()); changed(); draw(); renderProps(); };
  const doRedo = () => { if (!redo.length) return; undo.push(snapshot()); restore(redo.pop()); changed(); draw(); renderProps(); };

  // ---------- coordenadas ----------
  const rect = () => stage.getBoundingClientRect();
  const toWorld = (cx, cy) => { const r = rect(); return [(cx - r.left - vp.x) / vp.k, (cy - r.top - vp.y) / vp.k]; };
  const centerWorld = () => { const r = rect(); return [(r.width / 2 - vp.x) / vp.k, (r.height / 2 - vp.y) / vp.k]; };
  function zoomAt(cx, cy, factor) {
    const r = rect(), k = Math.max(0.15, Math.min(4, vp.k * factor)), px = cx - r.left, py = cy - r.top;
    vp.x = px - ((px - vp.x) * k) / vp.k; vp.y = py - ((py - vp.y) * k) / vp.k; vp.k = k; drawView();
  }
  const zoomCenter = (f) => { const r = rect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, f); };
  function fit(maxK = ro ? 1.15 : 1) {
    const r = rect(); if (!r.width || !r.height) return;
    if (!d.nodes.length) { vp = { x: r.width / 2, y: r.height / 2.4, k: 1 }; drawView(); return; }
    const b = M.bounds(d, ro ? 24 : 56), k = Math.max(0.15, Math.min(maxK, r.width / b.w, r.height / b.h));
    vp = { x: r.width / 2 - (b.x + b.w / 2) * k, y: r.height / 2 - (b.y + b.h / 2) * k, k }; drawView();
  }

  // ---------- dibujo ----------
  function drawView() {
    world.setAttribute('transform', `translate(${vp.x} ${vp.y}) scale(${vp.k})`);
    const g = M.GRID * vp.k; stage.style.backgroundSize = `${g}px ${g}px`; stage.style.backgroundPosition = `${vp.x}px ${vp.y}px`;
    const zl = root.querySelector('.dg-zl'); if (zl) zl.textContent = Math.round(vp.k * 100) + '%';
    drawOver(); drawMini(); placeEditor();
  }
  function drawEdges() {
    const by = byId();
    gE.innerHTML = d.edges.map((e) => M.edgeSVG(e, by, { measure, defStyle: d.edgeStyle, mk: uid })).join('');
    markEdges();
  }
  // La selección de un conector solo cambia clases (sin volver a dibujar: así el doble clic llega al mismo elemento).
  function markEdges() {
    gE.querySelectorAll('.dg-e').forEach((g) => { const on = g.dataset.e === selEdge, p = g.querySelector('.dg-p'); g.classList.toggle('on', on); if (p?.hasAttribute('marker-end')) p.setAttribute('marker-end', `url(#${uid}-${on ? 'ahs' : 'ah'})`); });
  }
  function drawNodes() {
    gN.innerHTML = d.nodes.map((n) => M.nodeSVG(n, measure)).join('');
    if (editing?.kind === 'node') gN.querySelector(`[data-n="${CSS.escape(editing.id)}"]`)?.classList.add('editing');
    if (editing?.kind === 'edge') gE.querySelector(`[data-e="${CSS.escape(editing.id)}"]`)?.classList.add('editing');
  }
  function drawOver() {
    const k = vp.k, s = (v) => v / k; let o = '';
    for (const id of sel) { const n = node(id); if (n) o += `<rect class="dg-selbox" x="${n.x - s(3)}" y="${n.y - s(3)}" width="${n.w + s(6)}" height="${n.h + s(6)}" rx="${s(6)}" vector-effect="non-scaling-stroke"/>`; }
    if (!ro) {
      const one = sel.size === 1 ? node([...sel][0]) : null;
      if (one && !editing) for (const [c, x, y] of [['nw', one.x, one.y], ['ne', one.x + one.w, one.y], ['sw', one.x, one.y + one.h], ['se', one.x + one.w, one.y + one.h]])
        o += `<rect class="dg-h" data-h="${c}" data-n="${esc(one.id)}" x="${x - s(5)}" y="${y - s(5)}" width="${s(10)}" height="${s(10)}" rx="${s(2.5)}" vector-effect="non-scaling-stroke"/>`;
      const pn = drag?.kind === 'connect' ? null : node(hover) || one;
      if (pn && !editing && !drag) for (const p of M.PORTS) { const [x, y] = M.portPoint(pn, p); const off = { t: [0, -s(1)], r: [s(1), 0], b: [0, s(1)], l: [-s(1), 0] }[p];
        o += `<g class="dg-port" data-port="${p}" data-n="${esc(pn.id)}"><circle class="dg-port-hit" cx="${x + off[0]}" cy="${y + off[1]}" r="${s(11)}"/><circle class="dg-port-dot" cx="${x + off[0]}" cy="${y + off[1]}" r="${s(4.5)}" vector-effect="non-scaling-stroke"/></g>`; }
      if (drag?.kind === 'connect') {
        const a = node(drag.from), t = drag.target && drag.target !== drag.from ? node(drag.target) : null;
        if (t) o += `<rect class="dg-target" x="${t.x - s(4)}" y="${t.y - s(4)}" width="${t.w + s(8)}" height="${t.h + s(8)}" rx="${s(8)}" vector-effect="non-scaling-stroke"/>`;
        const g = M.edgeGeom(a, t, { style: d.edgeStyle, fromPort: drag.port, toPort: t ? drag.toPort : '', toPoint: drag.p });
        o += `<path class="dg-temp" d="${g.d}" vector-effect="non-scaling-stroke" marker-end="url(#${uid}-ahs)"/>`;
      }
      if (drag?.kind === 'marquee') { const [x0, y0] = drag.p0, [x1, y1] = drag.p1; o += `<rect class="dg-marq" x="${Math.min(x0, x1)}" y="${Math.min(y0, y1)}" width="${Math.abs(x1 - x0)}" height="${Math.abs(y1 - y0)}" vector-effect="non-scaling-stroke"/>`; }
    }
    gO.innerHTML = o;
  }
  function drawMini() {
    mini.hidden = !miniOn || !d.nodes.length; root.querySelector('[data-a=mini]')?.classList.toggle('on', miniOn);
    if (mini.hidden) return;
    const r = rect(), b = M.bounds(d, 60), v = { x: -vp.x / vp.k, y: -vp.y / vp.k, w: r.width / vp.k, h: r.height / vp.k };
    const x0 = Math.min(b.x, v.x), y0 = Math.min(b.y, v.y), x1 = Math.max(b.x + b.w, v.x + v.w), y1 = Math.max(b.y + b.h, v.y + v.h);
    miniSvg.setAttribute('viewBox', `${x0} ${y0} ${x1 - x0} ${y1 - y0}`);
    miniSvg.innerHTML = d.nodes.map((n) => `<rect class="dg-mn" data-f="${esc(n.fill)}" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="${M.fillHex(n.fill)}"/>`).join('') + `<rect class="dg-mv" x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" vector-effect="non-scaling-stroke"/>`;
  }
  function drawEmpty() {
    const show = !ro && !d.nodes.length; emptyEl.hidden = !show; if (!show) return;
    emptyEl.innerHTML = `<b>Empieza tu diagrama</b><span>Arrastra una forma desde la izquierda, haz doble clic en el lienzo, o parte de una plantilla:</span><div class="dg-tpls">${Object.entries(M.TEMPLATES).map(([k, l]) => `<button type="button" class="dg-chip" data-a="tpl:${k}">${esc(l)}</button>`).join('')}</div>`;
  }
  function draw() { drawEdges(); drawNodes(); drawView(); drawEmpty(); drawChrome(); }
  const selChanged = () => { markEdges(); drawOver(); drawChrome(); renderProps(); };
  function drawChrome() {
    root.classList.toggle('has-sel', sel.size > 0 || Boolean(selEdge));
    root.querySelector('.dg-need2')?.classList.toggle('off', sel.size < 2);
    for (const [a, on] of [['tool:select', tool === 'select'], ['tool:hand', tool === 'hand'], ['grid', gridOn]]) root.querySelector(`[data-a="${a}"]`)?.classList.toggle('on', on);
    for (const [a, off] of [['undo', !undo.length], ['redo', !redo.length]]) { const b = root.querySelector(`[data-a="${a}"]`); if (b) b.disabled = off; }
    root.querySelectorAll('[data-a^="dist:"]').forEach((b) => (b.disabled = sel.size < 3));
    root.querySelectorAll('[data-a^="align:"]').forEach((b) => (b.disabled = sel.size < 2));
  }
  const lite = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; drawEdges(); drawNodes(); drawOver(); drawMini(); }); };

  // ---------- propiedades ----------
  const sw = (cur, act = 'fill') => `<div class="dg-sws">${M.PALETTE.map((p) => `<button type="button" class="dg-sw${cur === p.k ? ' on' : ''}" data-a="${act}:${p.k}" data-f="${p.k}" style="--c:${p.hex}" title="${esc(p.l)}" aria-label="${esc(p.l)}"></button>`).join('')}</div>`;
  const seg = (items, cur) => `<div class="dg-seg">${items.map(([a, v, icon, l]) => `<button type="button" class="dg-b${cur === v ? ' on' : ''}" data-a="${a}:${v}" title="${esc(l)}">${ic(icon)}<span>${esc(l)}</span></button>`).join('')}</div>`;
  function renderProps() {
    if (!props) return;
    const ns = [...sel].map(node).filter(Boolean), e = selEdge ? d.edges.find((x) => x.id === selEdge) : null;
    let h = '';
    if (ns.length === 1) {
      const n = ns[0];
      h = `<div class="dg-ph"><b>${esc(M.SHAPES[n.type].l)}</b><span class="dg-fill"></span>${btn('dup', 'dup', `Duplicar (${MOD} D)`)}${btn('del', 'trash', 'Borrar (Supr)')}</div>
        <label class="dg-l">Texto</label><textarea class="in dg-in" data-p="text" rows="3" placeholder="Escribe…">${esc(n.text)}</textarea>
        <label class="dg-l">Forma</label><div class="dg-seg dg-types">${M.TYPES.map((t) => `<button type="button" class="dg-b${n.type === t ? ' on' : ''}" data-a="type:${t}" title="${esc(M.SHAPES[t].l)}">${ic(t, 20)}</button>`).join('')}</div>
        <label class="dg-l">Relleno</label>${sw(n.fill)}
        <label class="dg-l">Tamaño</label><div class="dg-two"><label class="dg-num"><span>An</span><input class="in dg-in" type="number" data-p="w" min="40" step="${M.GRID}" value="${Math.round(n.w)}"></label><label class="dg-num"><span>Al</span><input class="in dg-in" type="number" data-p="h" min="28" step="${M.GRID}" value="${Math.round(n.h)}"></label></div>
        <p class="dg-tip">Arrastra un punto del borde para conectar con otro nodo.</p>`;
    } else if (ns.length > 1) {
      h = `<div class="dg-ph"><b>${ns.length} seleccionados</b><span class="dg-fill"></span>${btn('dup', 'dup', `Duplicar (${MOD} D)`)}${btn('del', 'trash', 'Borrar (Supr)')}</div>
        <label class="dg-l">Alinear</label><div class="dg-seg dg-icons">${[['l', 'al'], ['c', 'ac'], ['r', 'ar'], ['t', 'at'], ['m', 'am'], ['b', 'ab']].map(([v, i]) => btn('align:' + v, i, 'Alinear')).join('')}</div>
        <label class="dg-l">Distribuir</label><div class="dg-seg dg-icons">${btn('dist:h', 'dh', 'En horizontal', ns.length < 3 ? 'disabled' : '')}${btn('dist:v', 'dv', 'En vertical', ns.length < 3 ? 'disabled' : '')}</div>
        <label class="dg-l">Forma</label><div class="dg-seg dg-types">${M.TYPES.map((t) => `<button type="button" class="dg-b" data-a="type:${t}" title="${esc(M.SHAPES[t].l)}">${ic(t, 20)}</button>`).join('')}</div>
        <label class="dg-l">Relleno</label>${sw(ns.every((n) => n.fill === ns[0].fill) ? ns[0].fill : '')}`;
    } else if (e) {
      const a = node(e.from), b = node(e.to);
      h = `<div class="dg-ph"><b>Conector</b><span class="dg-fill"></span>${btn('del', 'trash', 'Borrar (Supr)')}</div>
        <p class="dg-tip" style="margin-top:0">${esc((a?.text || a?.id || '').split('\n')[0])} → ${esc((b?.text || b?.id || '').split('\n')[0])}</p>
        <label class="dg-l">Etiqueta</label><input class="in dg-in" data-p="label" value="${esc(e.label)}" placeholder="Sí, No, 2 días…">
        <label class="dg-l">Trazo</label>${seg([['estyle', 'curve', 'curve', 'Curva'], ['estyle', 'ortho', 'ortho', 'Recto']], e.style || d.edgeStyle)}
        <label class="dg-l">Punta</label>${seg([['head', '1', 'arrow', 'Flecha'], ['head', '0', 'line', 'Línea']], e.head === false ? '0' : '1')}
        <button type="button" class="dg-wide" data-a="reverse">${ic('swap')} Invertir dirección</button>`;
    } else {
      h = `<div class="dg-ph"><b>Diagrama</b></div>
        <p class="dg-tip" style="margin-top:0">${d.nodes.length} nodo${d.nodes.length === 1 ? '' : 's'} · ${d.edges.length} conector${d.edges.length === 1 ? '' : 'es'}</p>
        <label class="dg-l">Dirección</label>${seg([['dir', 'TD', 'td', 'Hacia abajo'], ['dir', 'LR', 'lr', 'A la derecha']], d.dir)}
        <label class="dg-l">Conectores</label>${seg([['defstyle', 'curve', 'curve', 'Curvos'], ['defstyle', 'ortho', 'ortho', 'Rectos']], d.edgeStyle)}
        <button type="button" class="dg-wide" data-a="layout:${d.dir}">${ic(d.dir === 'LR' ? 'lr' : 'td')} Ordenar automáticamente</button>
        <p class="dg-tip">Selecciona un nodo o un conector para ver sus propiedades. Atajos en «?».</p>`;
    }
    props.innerHTML = h;
  }
  if (props) {
    let before = null;
    props.addEventListener('focusin', (e) => { if (e.target.dataset.p) before = snapshot(); });
    props.addEventListener('input', (e) => {
      const p = e.target.dataset.p; if (!p) return; const v = e.target.value;
      if (p === 'text') for (const id of sel) { const n = node(id); if (n) n.text = v; }
      if (p === 'label') { const ed = d.edges.find((x) => x.id === selEdge); if (ed) ed.label = v; }
      if (p === 'w' || p === 'h') { const n = node([...sel][0]); const x = Number(v); if (n && x >= (p === 'w' ? 40 : 28) && x <= 2000) n[p] = x; }
      lite();
    });
    props.addEventListener('change', (e) => { if (e.target.dataset.p && before) { push(before); before = snapshot(); draw(); } });
    props.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.target.blur(); root.focus({ preventScroll: true }); } e.stopPropagation(); });
  }

  // ---------- acciones ----------
  function addNode(type, at, edit = false) {
    const S = M.SHAPES[type] || M.SHAPES.rect; let [cx, cy] = at || centerWorld();
    let x = M.snap(cx - S.w / 2), y = M.snap(cy - S.h / 2);
    if (!at) while (d.nodes.some((n) => Math.abs(n.x - x) < 8 && Math.abs(n.y - y) < 8)) { x += M.GRID * 2; y += M.GRID * 2; }
    const n = { id: M.nextId(d, 'n'), type, x, y, w: S.w, h: S.h, text: edit ? '' : S.l, fill: type === 'note' ? 'barro' : 'papel' };
    commit(() => { d.nodes.push(n); sel = new Set([n.id]); selEdge = null; });
    if (edit) startEdit(n.id);
    return n;
  }
  function del() {
    if (sel.size) commit(() => { M.removeNodes(d, [...sel]); sel.clear(); });
    else if (selEdge) commit(() => { d.edges = d.edges.filter((e) => e.id !== selEdge); selEdge = null; });
  }
  function dup() { if (!sel.size) return; commit(() => { sel = new Set(M.duplicate(d, [...sel])); }); }
  function copy() { if (!sel.size) return; const ids = new Set(sel); clip = JSON.stringify({ nodes: d.nodes.filter((n) => ids.has(n.id)), edges: d.edges.filter((e) => ids.has(e.from) && ids.has(e.to)) }); }
  function paste() {
    if (!clip) return; const c = JSON.parse(clip); const map = new Map();
    commit(() => {
      for (const n of c.nodes) { const id = M.nextId(d, 'n'); map.set(n.id, id); d.nodes.push({ ...n, id, x: n.x + M.GRID * 2, y: n.y + M.GRID * 2 }); }
      for (const e of c.edges) d.edges.push({ ...e, id: M.nextId(d, 'e'), from: map.get(e.from), to: map.get(e.to) });
      sel = new Set(map.values()); selEdge = null;
    });
    clip = JSON.stringify({ nodes: c.nodes.map((n) => ({ ...n, x: n.x + M.GRID * 2, y: n.y + M.GRID * 2 })), edges: c.edges });
  }
  function layout(dir) { commit(() => { const r = M.autoLayout(d, dir); d.nodes = r.nodes; d.edges = r.edges; d.dir = dir; }); fit(); }
  async function loadTemplate(k) {
    if (d.nodes.length && !(await (opts.confirm || confirmar)('¿Reemplazar el diagrama por la plantilla?'))) return;
    const t = M.template(k, measure); commit(() => { d.nodes = t.nodes; d.edges = t.edges; d.dir = t.dir; sel.clear(); selEdge = null; }); closeMenu(); fit();
  }
  function setData(nd) { d = M.normalize(nd); sel.clear(); selEdge = null; undo.length = redo.length = 0; draw(); renderProps(); fit(); }
  const fname = () => String(opts.title || 'diagrama').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'diagrama';
  function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  const svgString = () => M.toSVG(d, { measure });
  function exportSVG() { download(new Blob([svgString()], { type: 'image/svg+xml' }), fname() + '.svg'); }
  async function exportPNG() {
    const b = M.bounds(d, 40), scale = Math.min(2, Math.sqrt(16e6 / Math.max(1, b.w * b.h)));
    const url = URL.createObjectURL(new Blob([svgString()], { type: 'image/svg+xml' }));
    try {
      const img = new Image(); await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = url; });
      const c = document.createElement('canvas'); c.width = Math.ceil(b.w * scale); c.height = Math.ceil(b.h * scale);
      const g = c.getContext('2d'); g.scale(scale, scale); g.drawImage(img, 0, 0, b.w, b.h);
      await new Promise((ok) => c.toBlob((bl) => { if (bl) download(bl, fname() + '.png'); ok(); }, 'image/png'));
    } catch { opts.toast?.('No pude crear el PNG', true); } finally { URL.revokeObjectURL(url); }
  }
  async function copyMermaid() { try { await navigator.clipboard.writeText(M.toMermaid(d)); opts.toast?.('Código Mermaid copiado'); } catch { opts.toast?.('No pude copiar', true); } }

  // ---------- menús (plantillas, exportar, atajos, importar) ----------
  // Plantillas y Exportar son ui.menu; Importar y Atajos, ui.popover (Zag + Floating UI: teclado, Esc, clic afuera, foco de vuelta).
  let pop = null;
  function openMenu(kind, anchor) {
    anchor = anchor || root.querySelector(`[data-a="menu:${kind}"]`) || root;
    menu = kind;
    const fin = () => { if (menu === kind) menu = null; };
    if (kind === 'tpl') return uiMenu(anchor, Object.entries(M.TEMPLATES).map(([k, l]) => ({ label: l, onSelect: () => loadTemplate(k) })), { titulo: 'Plantillas', placement: 'bottom-end', onClose: fin });
    if (kind === 'export') return uiMenu(anchor, [{ label: 'Imagen PNG', icon: 'image', onSelect: exportPNG }, { label: 'Vector SVG', icon: 'download', onSelect: exportSVG }, { label: 'Copiar código Mermaid', icon: 'copy', onSelect: copyMermaid },
      ...(ro ? [] : ['-', { label: 'Importar Mermaid…', icon: 'upload', onSelect: () => openMenu('import', anchor) }])], { titulo: ro ? 'Descargar' : 'Exportar', placement: 'bottom-end', onClose: fin });
    let h = '';
    if (kind === 'import') h = `<div class="dg-mt">Importar Mermaid</div><p class="dg-tip" style="margin:0 0 8px">Pega un <code>flowchart TD</code> o <code>LR</code>. Reemplaza lo que hay.</p><textarea class="in dg-in" id="${uid}-imp" rows="7" placeholder="flowchart TD&#10;  A[Inicio] --> B{¿Listo?}&#10;  B -->|Sí| C[Fin]"></textarea><div class="dg-row"><button type="button" class="dg-wide dark" data-a="doimport">Importar</button></div>`;
    if (kind === 'help') h = `<div class="dg-mt">Atajos</div><dl class="dg-keys">${SHORTCUTS.map(([k, v]) => `<dt>${esc(v)}</dt><dd>${esc(k)}</dd>`).join('')}</dl>${ro ? '' : '<p class="dg-tip">En el celular: toca una forma para agregarla, arrastra con un dedo para mover, pellizca para el zoom.</p>'}`;
    return uiPopover(anchor, h, { etiqueta: kind === 'import' ? 'Importar Mermaid' : 'Atajos', placement: 'bottom-end', ancho: 340, clase: 'dg-panel', onClose: () => { fin(); pop = null; } }).then((r) => {
      if (!r) return; pop = r.el;
      r.el.addEventListener('click', (e) => { const t = e.target.closest('[data-a]'); if (t) act(t.dataset.a, t); });
      if (kind === 'import') r.el.querySelector('textarea').focus();
    });
  }
  function closeMenu() { menu = null; cerrarMenu(); cerrarPopover(); }

  const ACT = {
    undo: doUndo, redo: doRedo, del, dup, zin: () => zoomCenter(1.2), zout: () => zoomCenter(1 / 1.2), zfit: () => fit(),
    grid: () => { gridOn = snapOn = !gridOn; store.set('dg.grid', gridOn ? '1' : '0'); store.set('dg.snap', snapOn ? '1' : '0'); stage.classList.toggle('grid', gridOn); draw(); },
    mini: () => { miniOn = !miniOn; store.set('dg.mini', miniOn ? '1' : '0'); drawMini(); },
    png: () => { closeMenu(); exportPNG(); }, svg: () => { closeMenu(); exportSVG(); }, mmd: () => { closeMenu(); copyMermaid(); },
    doimport: async () => {
      const src = pop?.querySelector('textarea')?.value || ''; const r = M.fromMermaid(src, { measure });
      if (!r) return opts.toast?.('No entendí ese Mermaid: tiene que empezar con «flowchart TD» o «graph LR»', true);
      if (d.nodes.length && !(await (opts.confirm || confirmar)('¿Reemplazar el diagrama por lo importado?'))) return;
      commit(() => { d.nodes = r.nodes; d.edges = r.edges; d.dir = r.dir; sel.clear(); selEdge = null; }); closeMenu(); fit();
    },
    reverse: () => commit(() => { const e = d.edges.find((x) => x.id === selEdge); if (e) { [e.from, e.to] = [e.to, e.from]; [e.fromPort, e.toPort] = [e.toPort, e.fromPort]; } }),
  };
  function act(a, el) {
    if (ACT[a]) return ACT[a](el);
    const [k, v] = a.split(':');
    if (k === 'tool') { tool = v; stage.classList.toggle('hand', tool === 'hand'); draw(); }
    else if (k === 'align') commit(() => M.align(d, [...sel], v));
    else if (k === 'dist') commit(() => M.distribute(d, [...sel], v));
    else if (k === 'layout') layout(v);
    else if (k === 'menu') openMenu(v, el);
    else if (k === 'tpl') loadTemplate(v);
    else if (k === 'add') { const n = addNode(v); if (n && !ro) fitIfHidden(n); }
    else if (k === 'fill') commit(() => { for (const id of sel) { const n = node(id); if (n) n.fill = v; } });
    else if (k === 'type') commit(() => { for (const id of sel) { const n = node(id); if (n) { const o = M.SHAPES[n.type], S = M.SHAPES[v]; if (n.w === o.w && n.h === o.h) { n.w = S.w; n.h = S.h; } n.type = v; } } });
    else if (k === 'estyle') commit(() => { const e = d.edges.find((x) => x.id === selEdge); if (e) e.style = v; });
    else if (k === 'head') commit(() => { const e = d.edges.find((x) => x.id === selEdge); if (e) e.head = v === '1'; });
    else if (k === 'dir') commit(() => { d.dir = v; });
    else if (k === 'defstyle') commit(() => { d.edgeStyle = v; d.edges.forEach((e) => (e.style = '')); });
  }
  function fitIfHidden(n) { const r = rect(); const x = n.x * vp.k + vp.x, y = n.y * vp.k + vp.y; if (x < 0 || y < 0 || x + n.w * vp.k > r.width || y + n.h * vp.k > r.height) { vp.x = r.width / 2 - (n.x + n.w / 2) * vp.k; vp.y = r.height / 2 - (n.y + n.h / 2) * vp.k; drawView(); } }
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (!b || !root.contains(b) || b.disabled) return; act(b.dataset.a, b); });

  // ---------- texto en línea ----------
  function startEdit(id, kind = 'node') {
    if (ro) return; commitText();
    const ta = document.createElement('textarea'); ta.className = 'dg-ed' + (kind === 'edge' ? ' lab' : ''); ta.spellcheck = true;
    const target = kind === 'node' ? node(id) : d.edges.find((x) => x.id === id); if (!target) return;
    ta.value = kind === 'node' ? target.text : target.label;
    editing = { id, kind, ta, before: snapshot() }; stage.append(ta); placeEditor(); drawNodes(); drawEdges(); drawOver();
    ta.focus(); ta.select();
    ta.addEventListener('input', placeEditor);
    ta.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); cancelText(); }
      else if (e.key === 'Enter' && (!e.shiftKey || kind === 'edge')) { e.preventDefault(); commitText(); root.focus({ preventScroll: true }); }
    });
    ta.addEventListener('blur', () => setTimeout(commitText, 0));
  }
  function placeEditor() {
    if (!editing) return; const { ta, kind, id } = editing, k = vp.k;
    if (kind === 'node') {
      const n = node(id); if (!n) return; const tb = M.textBox(n);
      const lines = Math.max(1, M.wrap(ta.value || ' ', tb.w, measure).length);
      Object.assign(ta.style, { left: vp.x + (n.x + (n.w - tb.w) / 2) * k + 'px', top: vp.y + n.y * k + 'px', width: tb.w * k + 'px', height: n.h * k + 'px', fontSize: M.FS * k + 'px', lineHeight: M.LH * k + 'px', paddingTop: Math.max(0, (n.h - lines * M.LH) / 2) * k + 'px', color: M.inkHex(n.fill) });
      ta.dataset.f = n.fill;
    } else {
      const e = d.edges.find((x) => x.id === id); const by = byId(); if (!e) return;
      const g = M.edgeGeom(by.get(e.from), by.get(e.to), { style: e.style || d.edgeStyle, fromPort: e.fromPort, toPort: e.toPort });
      const w = Math.max(120, measure(ta.value || 'Etiqueta', 12.5) + 30);
      Object.assign(ta.style, { left: vp.x + g.mid[0] * k - (w * k) / 2 + 'px', top: vp.y + g.mid[1] * k - 15 * k + 'px', width: w * k + 'px', height: 30 * k + 'px', fontSize: 12.5 * k + 'px', lineHeight: 28 * k + 'px' });
    }
  }
  function commitText() {
    if (!editing) return; const { id, kind, ta, before } = editing; editing = null; ta.remove();
    const v = ta.value.replace(/\s+$/, '');
    if (kind === 'node') { const n = node(id); if (n) { n.text = v; const lines = M.wrap(v, M.textBox(n).w, measure).length; const need = lines * M.LH / (n.type === 'diamond' ? 0.6 : n.type === 'ellipse' ? 0.78 : 1) + (n.type === 'rect' || n.type === 'note' ? 22 : 8); if (need > n.h) n.h = Math.ceil(need / M.GRID) * M.GRID; } }
    else { const e = d.edges.find((x) => x.id === id); if (e) e.label = v.replace(/\n/g, ' '); }
    push(before); draw(); renderProps();
  }
  function cancelText() { if (!editing) return; const { ta } = editing; editing = null; ta.remove(); draw(); root.focus({ preventScroll: true }); }

  // ---------- puntero: mover, redimensionar, conectar, marco, paneo, pellizco ----------
  const hitNode = (cx, cy) => { const el = document.elementFromPoint(cx, cy); const g = el?.closest?.('[data-n]'); return g && svg.contains(g) ? g : null; };
  svg.addEventListener('pointerdown', (e) => {
    if (e.button === 2) return;
    if (ro && e.pointerType === 'touch') return; // en lectura, el dedo hace scroll de la página
    closeMenu(); if (editing) commitText();
    root.focus({ preventScroll: true });
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    try { svg.setPointerCapture(e.pointerId); } catch {}
    if (pts.size === 2) { const [a, b] = [...pts.values()]; drag = { kind: 'pinch', d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], vp0: { ...vp } }; return; }
    if (pts.size > 2) return;
    const w = toWorld(e.clientX, e.clientY), t = e.target;
    const hEl = t.closest('[data-h]'), pEl = t.closest('[data-port]'), nEl = t.closest('.dg-n'), eEl = t.closest('[data-e]');
    // doble toque en el celular = doble clic
    if (e.pointerType === 'touch') { const now = Date.now(); if (lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 24) { lastTap = null; pts.delete(e.pointerId); dbl(e); return; } lastTap = { t: now, x: e.clientX, y: e.clientY }; }
    const pan = ro || e.button === 1 || tool === 'hand' || space || (e.pointerType === 'touch' && !nEl && !pEl && !hEl);
    if (pan) { drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: vp.x, vy: vp.y }; stage.classList.add('panning'); e.preventDefault(); return; }
    if (hEl) { const n = node(hEl.dataset.n); drag = { kind: 'resize', id: n.id, c: hEl.dataset.h, o: { ...n }, p0: w, before: snapshot() }; e.preventDefault(); return; }
    if (pEl) { drag = { kind: 'connect', from: pEl.dataset.n, port: pEl.dataset.port, p: w, s0: [e.clientX, e.clientY] }; e.preventDefault(); drawOver(); return; }
    if (nEl) {
      const id = nEl.dataset.n;
      if (e.shiftKey || e.metaKey) { sel.has(id) ? sel.delete(id) : sel.add(id); selEdge = null; selChanged(); if (!sel.has(id)) return; }
      else if (!sel.has(id)) { sel = new Set([id]); selEdge = null; selChanged(); }
      drag = { kind: 'move', id, p0: w, s0: [e.clientX, e.clientY], orig: new Map([...sel].map((x) => [x, [node(x).x, node(x).y]])), moved: false, before: snapshot(), shift: e.shiftKey || e.metaKey };
      e.preventDefault(); return;
    }
    if (eEl) { selEdge = eEl.dataset.e; sel.clear(); selChanged(); e.preventDefault(); return; }
    if (!e.shiftKey) { sel.clear(); selEdge = null; }
    drag = { kind: 'marquee', p0: w, p1: w, base: new Set(sel) }; selChanged(); e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (!drag) { if (ro || e.pointerType === 'touch') return; const g = e.target.closest('.dg-n,[data-port]'); const h = g ? g.dataset.n : null; if (h !== hover) { hover = h; drawOver(); } return; }
    const w = toWorld(e.clientX, e.clientY);
    if (drag.kind === 'pan') { vp.x = drag.vx + e.clientX - drag.sx; vp.y = drag.vy + e.clientY - drag.sy; drawView(); return; }
    if (drag.kind === 'pinch') {
      if (pts.size < 2) return; const [a, b] = [...pts.values()]; const dd = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const k = Math.max(0.15, Math.min(4, drag.vp0.k * (dd / drag.d0))), r = rect();
      const wx = (drag.m0[0] - r.left - drag.vp0.x) / drag.vp0.k, wy = (drag.m0[1] - r.top - drag.vp0.y) / drag.vp0.k;
      vp = { k, x: m[0] - r.left - wx * k, y: m[1] - r.top - wy * k }; drawView(); return;
    }
    if (drag.kind === 'move') {
      if (!drag.moved && Math.hypot(e.clientX - drag.s0[0], e.clientY - drag.s0[1]) < 3) return;
      drag.moved = true; hover = null;
      const [ox, oy] = drag.orig.get(drag.id); let nx = ox + w[0] - drag.p0[0], ny = oy + w[1] - drag.p0[1];
      if (snapOn) { nx = M.snap(nx); ny = M.snap(ny); }
      const dx = nx - ox, dy = ny - oy;
      for (const [id, [x, y]] of drag.orig) { const n = node(id); if (n) { n.x = x + dx; n.y = y + dy; } }
      lite(); return;
    }
    if (drag.kind === 'resize') {
      const o = drag.o, n = node(drag.id); let dx = w[0] - drag.p0[0], dy = w[1] - drag.p0[1];
      let x0 = o.x, y0 = o.y, x1 = o.x + o.w, y1 = o.y + o.h;
      if (drag.c.includes('w')) x0 += dx; else x1 += dx;
      if (drag.c.includes('n')) y0 += dy; else y1 += dy;
      if (snapOn) { x0 = M.snap(x0); x1 = M.snap(x1); y0 = M.snap(y0); y1 = M.snap(y1); }
      if (x1 - x0 < 48) { if (drag.c.includes('w')) x0 = x1 - 48; else x1 = x0 + 48; }
      if (y1 - y0 < 32) { if (drag.c.includes('n')) y0 = y1 - 32; else y1 = y0 + 32; }
      Object.assign(n, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }); lite(); return;
    }
    if (drag.kind === 'connect') { drag.p = w; const g = hitNode(e.clientX, e.clientY); drag.target = g ? g.dataset.n : null; const pe = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-port]'); drag.toPort = pe && pe.dataset.n === drag.target ? pe.dataset.port : ''; drawOver(); return; }
    if (drag.kind === 'marquee') {
      drag.p1 = w; const [x0, y0] = drag.p0, [x1, y1] = w, X0 = Math.min(x0, x1), X1 = Math.max(x0, x1), Y0 = Math.min(y0, y1), Y1 = Math.max(y0, y1);
      sel = new Set(drag.base); for (const n of d.nodes) if (n.x < X1 && n.x + n.w > X0 && n.y < Y1 && n.y + n.h > Y0) sel.add(n.id);
      drawOver();
    }
  });
  const up = (e) => {
    pts.delete(e.pointerId);
    if (!drag) return; const dr = drag;
    if (dr.kind === 'pinch') { if (pts.size < 2) drag = null; return; }
    drag = null; stage.classList.remove('panning');
    if (dr.kind === 'move') { if (dr.moved) { push(dr.before); draw(); renderProps(); } else { if (!dr.shift && sel.size > 1) sel = new Set([dr.id]); selChanged(); } }
    else if (dr.kind === 'resize') { push(dr.before); draw(); renderProps(); }
    else if (dr.kind === 'connect') {
      const t = dr.target && dr.target !== dr.from ? dr.target : null;
      if (t) { if (!d.edges.some((x) => x.from === dr.from && x.to === t)) commit(() => d.edges.push({ id: M.nextId(d, 'e'), from: dr.from, to: t, label: '', style: '', head: true, fromPort: dr.toPort ? dr.port : '', toPort: dr.toPort || '' })); else draw(); }
      else if (!dr.target && Math.hypot(e.clientX - dr.s0[0], e.clientY - dr.s0[1]) > 24) {
        // soltado en el vacío: nace un nodo nuevo ya conectado
        const a = node(dr.from), S = M.SHAPES.rect; let cx = dr.p[0], cy = dr.p[1];
        const n = { id: M.nextId(d, 'n'), type: 'rect', x: M.snap(cx - S.w / 2), y: M.snap(cy - S.h / 2), w: S.w, h: S.h, text: '', fill: a?.fill === 'espresso' || a?.fill === 'cafe' ? 'papel' : a?.fill || 'papel' };
        commit(() => { d.nodes.push(n); d.edges.push({ id: M.nextId(d, 'e'), from: dr.from, to: n.id, label: '', style: '', head: true, fromPort: '', toPort: '' }); sel = new Set([n.id]); selEdge = null; });
        startEdit(n.id);
      } else drawOver();
    } else if (dr.kind === 'marquee') selChanged();
    else drawView();
  };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('pointerleave', () => { if (!drag && hover) { hover = null; drawOver(); } });
  let dblAt = 0;
  function dbl(e) {
    if (ro || Date.now() - dblAt < 450) return; dblAt = Date.now();
    const t = document.elementFromPoint(e.clientX, e.clientY), nEl = t?.closest?.('.dg-n'), eEl = t?.closest?.('[data-e]');
    if (nEl) { sel = new Set([nEl.dataset.n]); selEdge = null; selChanged(); startEdit(nEl.dataset.n); }
    else if (eEl) { selEdge = eEl.dataset.e; sel.clear(); selChanged(); startEdit(eEl.dataset.e, 'edge'); }
    else if (svg.contains(t)) addNode('rect', toWorld(e.clientX, e.clientY), true);
  }
  svg.addEventListener('dblclick', (e) => { e.preventDefault(); dbl(e); });

  // rueda: con ⌘/Ctrl (o pellizco del trackpad) = zoom; la rueda del mouse también; dos dedos = mover
  stage.addEventListener('wheel', (e) => {
    const mouse = e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
    const zoom = e.ctrlKey || e.metaKey || (!ro && mouse);
    if (ro && !zoom) return;
    e.preventDefault();
    if (zoom) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey && !mouse ? 0.01 : 0.0016)));
    else { vp.x -= e.deltaX; vp.y -= e.deltaY; drawView(); }
  }, { passive: false });

  // arrastrar una forma desde la paleta
  if (!ro) {
    root.querySelectorAll('.dg-shape').forEach((b) => b.addEventListener('dragstart', (e) => { e.dataTransfer.setData('application/x-dg-shape', b.dataset.shape); e.dataTransfer.effectAllowed = 'copy'; }));
    stage.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('application/x-dg-shape')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; stage.classList.add('drop'); } });
    stage.addEventListener('dragleave', () => stage.classList.remove('drop'));
    stage.addEventListener('drop', (e) => { const k = e.dataTransfer.getData('application/x-dg-shape'); stage.classList.remove('drop'); if (!k) return; e.preventDefault(); addNode(k, toWorld(e.clientX, e.clientY)); });
  }
  // mini-mapa: tocar o arrastrar mueve la vista
  const miniGo = (e) => { const p = miniSvg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = miniSvg.getScreenCTM(); if (!m) return; const q = p.matrixTransform(m.inverse()); const r = rect(); vp.x = r.width / 2 - q.x * vp.k; vp.y = r.height / 2 - q.y * vp.k; drawView(); };
  mini.addEventListener('pointerdown', (e) => { e.stopPropagation(); mini.setPointerCapture(e.pointerId); miniGo(e); mini.onpointermove = miniGo; });
  mini.addEventListener('pointerup', () => { mini.onpointermove = null; });

  // ---------- teclado ----------
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('input,textarea,select,[contenteditable]')) return;
    const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (k === '+' || k === '=') { stop(); return zoomCenter(1.2); }
    if (k === '-' || k === '_') { if (!mod) { stop(); return zoomCenter(1 / 1.2); } }
    if (k === '0' && !mod) { stop(); const r = rect(); return zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / vp.k); }
    if (e.key === '!' || (e.shiftKey && e.code === 'Digit1')) { stop(); return fit(); }
    if (ro) return;
    if (mod && k === 'z') { stop(); return e.shiftKey ? doRedo() : doUndo(); }
    if (mod && k === 'y') { stop(); return doRedo(); }
    if (mod && k === 'd') { stop(); return dup(); }
    if (mod && k === 'a') { stop(); sel = new Set(d.nodes.map((n) => n.id)); selEdge = null; draw(); return renderProps(); }
    if (mod && k === 'c') { copy(); return; }
    if (mod && k === 'x') { copy(); stop(); return del(); }
    if (mod && k === 'v') { stop(); return paste(); }
    if (mod && k === 's') { stop(); return opts.onSave?.(get()); }
    if (mod) return;
    if (k === 'delete' || k === 'backspace') { stop(); return del(); }
    if (k === 'escape') { if (menu) return closeMenu(); sel.clear(); selEdge = null; draw(); return renderProps(); }
    if (k === 'enter' && (sel.size === 1 || selEdge)) { stop(); return sel.size === 1 ? startEdit([...sel][0]) : startEdit(selEdge, 'edge'); }
    if (k.startsWith('arrow') && sel.size) {
      stop(); const st = e.shiftKey ? M.GRID : 1, [dx, dy] = { arrowleft: [-st, 0], arrowright: [st, 0], arrowup: [0, -st], arrowdown: [0, st] }[k];
      return commit(() => { for (const id of sel) { const n = node(id); n.x += dx; n.y += dy; } });
    }
    if (k === ' ') { stop(); if (!space) { space = true; stage.classList.add('hand'); } return; }
    if (k === 'v') return act('tool:select'); if (k === 'h') return act('tool:hand');
    if (k === 'g') return ACT.grid(); if (k === 'm') return ACT.mini();
    if (e.key === '?') { stop(); return openMenu('help', root.querySelector('[data-a="menu:help"]')); }
  });
  root.addEventListener('keyup', (e) => { if (e.key === ' ') { space = false; stage.classList.toggle('hand', tool === 'hand'); } });

  // ---------- tamaño ----------
  const ro$ = new ResizeObserver(() => {
    if (!root.isConnected) return ro$.disconnect();
    const r = rect(); if (!r.width || !r.height) return;
    if (!sized) { sized = true; const v = data?.viewport; const b = M.bounds(d); const inView = v && v.k && d.nodes.length && !ro && (b.x + b.w / 2) * v.k + v.x > 0 && (b.x + b.w / 2) * v.k + v.x < r.width && (b.y + b.h / 2) * v.k + v.y > 0 && (b.y + b.h / 2) * v.k + v.y < r.height;
      if (inView && (v.x || v.y || v.k !== 1)) { vp = { ...M.normalize({ viewport: v }).viewport }; drawView(); } else fit(); }
    else if (ro) fit(); else drawView();
  });
  ro$.observe(stage);
  if (document.fonts?.ready) document.fonts.ready.then(() => { if (root.isConnected) { drawEdges(); drawNodes(); } });

  function get() { return JSON.parse(JSON.stringify({ ...d, viewport: { x: Math.round(vp.x), y: Math.round(vp.y), k: Math.round(vp.k * 1000) / 1000 } })); }
  draw(); renderProps();
  return {
    get, set: setData, fit, toMermaid: () => M.toMermaid(d), toSVG: svgString, exportPNG, exportSVG, layout,
    get dirty() { return dirty; }, clean() { dirty = false; }, focus: () => root.focus({ preventScroll: true }),
    destroy() { ro$.disconnect(); closeMenu(); host.innerHTML = ''; },
    // para pruebas y automatización
    _state: () => ({ d, vp, sel: [...sel], selEdge }),
  };
}

// Solo lectura: el mismo motor, del alto justo para el diagrama, sin herramientas de edición.
export function diagramView(host, data, opts = {}) {
  const d = M.normalize(data), b = M.bounds(d, 24), W = host.clientWidth || 720;
  const k = Math.min(1.15, (W - 16) / Math.max(1, b.w));
  host.style.height = Math.round(Math.max(220, Math.min(680, b.h * k + 40))) + 'px';
  return diagramEditor(host, d, { ...opts, readonly: true });
}
