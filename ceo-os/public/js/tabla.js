// Tabla densa: el patrón para datos tabulares (movimientos, facturas, cotizaciones, leads, costos…). Ver docs/patrones-de-presentacion.md.
// Filas de 34 px, cabecera fija al desplazar, columnas ordenables (aria-sort), números a la derecha, selección múltiple opcional,
// acciones por fila al pasar el mouse o con foco, fila clicable que abre el detalle (Enter o clic), grupos con encabezado,
// estado vacío (vacio()) y de carga. En el cel (≤ 700 px) cada fila se apila: el título arriba y el resto como «etiqueta · valor».
// Dos capas: lo puro (tablaHtml, ordenar, siguienteOrden, moverFoco, alternar…) corre en Node (scripts/test-tablas.mjs);
// tabla(caja, cfg) monta y conecta el teclado, el orden y la selección en el navegador. Estilos: tablas.css («tdn-»).
//
// cfg = {
//   etiqueta: 'Movimientos de nov',            // el <caption> (lo lee el lector de pantalla)
//   cols: [{ k, t, num?, orden?: true | (fila) => valor, celda?: (fila) => html, clase?, ancho?, movil?: 'titulo' | 'oculta', ayuda? }],
//   filas: [...], id?: (fila) => string,       // por defecto fila.id
//   orden?: { k, dir: 'asc' | 'desc' },        // el orden inicial
//   abrir?: (fila, evento) => void,            // fila clicable: abre el detalle
//   nombre?: (fila) => string,                 // aria-label de la fila (por defecto, la celda de la primera columna)
//   seleccion?: { alCambiar(ids, filas) },     // casillas para elegir varias (solo si la pantalla ya tenía selección múltiple)
//   acciones?: (fila) => [{ t, ico?, fn, peligro? }],
//   grupo?: (fila) => string,                  // filas agrupadas bajo un encabezado (en el orden en que aparecen)
//   pie?: (filas) => [celda por columna],      // la fila de totales
//   vacio?: { icono, titulo, linea, boton },   // el estado vacío (visual.js › vacio)
//   cargando?: true,                           // filas fantasma mientras llegan los datos
// }
import { vacio } from './visual.js';
import { svgIco } from './iconos.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
// Lo que devuelve una celda: html`` (core.js › Raw, con .s ya escapado), un arreglo de eso, o texto plano (se escapa aquí).
export const aTexto = (v) => (v == null || v === false ? '' : Array.isArray(v) ? v.map(aTexto).join('') : typeof v === 'object' && typeof v.s === 'string' ? v.s : esc(v));
const core = typeof document === 'undefined' ? null : await import('./core.js');
const out = (s) => (core ? core.raw(s) : s);
const idDe = (cfg) => cfg.id || ((f) => f?.id);
let nTabla = 0;

// ---------- Orden ----------
// El valor con el que se ordena una columna: su función, o el campo k. Números como números; texto sin acentos ni mayúsculas.
export function valorOrden(col, fila) {
  const v = typeof col.orden === 'function' ? col.orden(fila) : fila?.[col.k];
  if (v == null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return null;
  return v;
}
const COL = typeof Intl !== 'undefined' ? new Intl.Collator('es', { sensitivity: 'base', numeric: true }) : null;
// Ordena una copia: lo vacío siempre al final (en los dos sentidos) y el orden es estable entre iguales.
export function ordenar(filas, col, dir = 'asc') {
  if (!col) return [...filas];
  const s = dir === 'desc' ? -1 : 1;
  return filas.map((f, i) => [f, valorOrden(col, f), i]).sort((a, b) => {
    if (a[1] == null || b[1] == null) return a[1] == null && b[1] == null ? a[2] - b[2] : a[1] == null ? 1 : -1;
    const c = typeof a[1] === 'number' && typeof b[1] === 'number' ? a[1] - b[1] : COL ? COL.compare(String(a[1]), String(b[1])) : String(a[1]).localeCompare(String(b[1]));
    return c ? c * s : a[2] - b[2];
  }).map((x) => x[0]);
}
// Al tocar una cabecera: si ya es la del orden, se invierte; si no, arranca descendente en los números (lo más grande arriba) y ascendente en texto.
export function siguienteOrden(actual, col) {
  if (actual?.k === col.k) return { k: col.k, dir: actual.dir === 'asc' ? 'desc' : 'asc' };
  return { k: col.k, dir: col.num ? 'desc' : 'asc' };
}
export const ariaOrden = (orden, col) => (orden?.k === col.k ? (orden.dir === 'desc' ? 'descending' : 'ascending') : 'none');

// ---------- Teclado y selección ----------
// La fila que recibe el foco al moverse con el teclado (n filas, i la actual). null = la tecla no mueve.
export function moverFoco(i, tecla, n) {
  if (!n) return null;
  const a = Math.max(0, Math.min(n - 1, i ?? 0));
  return ({ ArrowDown: Math.min(n - 1, a + 1), ArrowUp: Math.max(0, a - 1), Home: 0, End: n - 1, PageDown: Math.min(n - 1, a + 10), PageUp: Math.max(0, a - 10) })[tecla] ?? null;
}
// Selección: un Set de ids. alternar devuelve uno nuevo; todos() marca o desmarca todas las visibles.
export const alternar = (sel, id) => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); return s; };
export const todos = (sel, ids) => { const s = new Set(sel), marcar = !ids.every((x) => s.has(x)); ids.forEach((x) => (marcar ? s.add(x) : s.delete(x))); return s; };
export const estadoTodos = (sel, ids) => (!ids.length || !ids.some((x) => sel.has(x)) ? 'no' : ids.every((x) => sel.has(x)) ? 'si' : 'mixto');

// ---------- HTML ----------
function th(col, orden, i) {
  const cls = [col.num ? 'n' : '', col.clase || ''].filter(Boolean).join(' ');
  const w = col.ancho ? ` style="width:${esc(col.ancho)}"` : '';
  if (!col.orden) return `<th scope="col"${cls ? ` class="${cls}"` : ''}${w}${col.ayuda ? ` title="${esc(col.ayuda)}"` : ''}>${aTexto(col.t)}</th>`;
  const a = ariaOrden(orden, col);
  const flecha = a === 'none' ? 'chevrons-up-down' : a === 'ascending' ? 'chevron-up' : 'chevron-down';
  return `<th scope="col" aria-sort="${a}"${cls ? ` class="${cls}"` : ''}${w}><button type="button" class="tdn-o" data-tdn-orden="${i}"${col.ayuda ? ` title="${esc(col.ayuda)}"` : ''}>${aTexto(col.t)}<span class="tdn-fl" aria-hidden="true">${svgIco(flecha, 12)}</span></button></th>`;
}
function td(col, fila, primera) {
  const v = aTexto(col.celda ? col.celda(fila) : fila?.[col.k]);
  const cls = [col.num ? 'n' : '', col.clase || '', col.movil === 'titulo' || (primera && col.movil !== 'oculta') ? 'tdn-t' : '', col.movil === 'oculta' ? 'tdn-mo' : ''].filter(Boolean).join(' ');
  // En la primera columna va un <th scope="row">: es el nombre de la fila (lo anuncia el lector al moverse por las celdas).
  const tag = primera ? 'th scope="row"' : 'td';
  return `<${tag}${cls ? ` class="${cls}"` : ''}${!primera && col.t ? ` data-l="${esc(typeof col.t === 'string' ? col.t : aTexto(col.t).replace(/<[^>]+>/g, ''))}"` : ''}>${v}</${primera ? 'th' : 'td'}>`;
}
function filaHtml(cfg, f, sel, foco) {
  const id = String(idDe(cfg)(f) ?? ''), marc = sel?.has(id);
  const nombre = cfg.nombre ? cfg.nombre(f) : aTexto(cfg.cols[0].celda ? cfg.cols[0].celda(f) : f?.[cfg.cols[0].k]).replace(/<[^>]+>/g, '').trim();
  const acc = cfg.acciones ? cfg.acciones(f) || [] : [];
  return `<tr class="tdn-f${cfg.abrir ? ' tdn-ab' : ''}${marc ? ' tdn-sel' : ''}" data-tdn-id="${esc(id)}" tabindex="${foco ? 0 : -1}"${cfg.seleccion ? ` aria-selected="${marc ? 'true' : 'false'}"` : ''}${cfg.abrir ? ` aria-label="${esc(nombre)} · abrir"` : ''}>`
    + (cfg.seleccion ? `<td class="tdn-c"><input type="checkbox" class="tdn-x" data-tdn-x tabindex="-1" aria-label="Elegir ${esc(nombre)}"${marc ? ' checked' : ''}></td>` : '')
    + cfg.cols.map((c, i) => td(c, f, i === 0)).join('')
    + (cfg.acciones ? `<td class="tdn-a">${acc.length ? `<span class="tdn-ab-in">${acc.map((a, j) => `<button type="button" class="btn-icon tdn-btn${a.peligro ? ' tdn-pel' : ''}" data-tdn-acc="${j}" title="${esc(a.t)}" aria-label="${esc(a.t)} · ${esc(nombre)}">${a.ico ? svgIco(a.ico, 15) : esc(a.t)}</button>`).join('')}</span>` : ''}</td>` : '')
    + '</tr>';
}
// El orden de una tabla: cfg.orden, o el que el usuario eligió (estado.orden).
export function vistaFilas(cfg, orden) {
  const col = orden ? cfg.cols.find((c) => c.k === orden.k && c.orden) : null;
  return col ? ordenar(cfg.filas || [], col, orden.dir) : [...(cfg.filas || [])];
}
export function tablaHtml(cfg, estado = {}) {
  const orden = estado.orden ?? cfg.orden ?? null, sel = estado.sel || new Set(), uid = estado.uid || `tb${++nTabla}`;
  const ncol = cfg.cols.length + (cfg.seleccion ? 1 : 0) + (cfg.acciones ? 1 : 0);
  if (!cfg.cargando && !(cfg.filas || []).length) return out(`<div class="tdn-vacio">${aTexto(vacio(cfg.vacio || { icono: 'inbox', titulo: 'Nada por aquí todavía' }))}</div>`);
  const filas = vistaFilas(cfg, orden), ids = filas.map((f) => String(idDe(cfg)(f) ?? ''));
  const focoId = estado.foco != null && ids.includes(estado.foco) ? estado.foco : ids[0];
  const est = estadoTodos(sel, ids);
  const cab = `<thead><tr>${cfg.seleccion ? `<th scope="col" class="tdn-c"><input type="checkbox" class="tdn-x" data-tdn-todos aria-label="Elegir todas"${est === 'si' ? ' checked' : ''}${est === 'mixto' ? ' data-mixto="1"' : ''}></th>` : ''}${cfg.cols.map((c, i) => th(c, orden, i)).join('')}${cfg.acciones ? '<th scope="col" class="tdn-a"><span class="tdn-sr">Acciones</span></th>' : ''}</tr></thead>`;
  let cuerpo;
  if (cfg.cargando) cuerpo = `<tbody aria-busy="true">${[0, 1, 2].map(() => `<tr class="tdn-fan" aria-hidden="true">${Array.from({ length: ncol }, () => '<td><i class="tdn-sk"></i></td>').join('')}</tr>`).join('')}</tbody>`;
  else if (cfg.grupo) {
    const gs = new Map(); filas.forEach((f) => { const g = String(cfg.grupo(f) ?? ''); (gs.get(g) || gs.set(g, []).get(g)).push(f); });
    cuerpo = [...gs].map(([g, fs]) => `<tbody><tr class="tdn-g"><th scope="rowgroup" colspan="${ncol}">${esc(g)} <span>${fs.length}</span></th></tr>${fs.map((f) => filaHtml(cfg, f, sel, String(idDe(cfg)(f)) === focoId)).join('')}</tbody>`).join('');
  } else cuerpo = `<tbody>${filas.map((f) => filaHtml(cfg, f, sel, String(idDe(cfg)(f)) === focoId)).join('')}</tbody>`;
  const pie = cfg.pie && !cfg.cargando ? `<tfoot><tr>${cfg.seleccion ? '<td class="tdn-c"></td>' : ''}${cfg.pie(filas).map((v, i) => { const c = cfg.cols[i] || {}; return `<td class="${[c.num ? 'n' : '', i === 0 ? 'tdn-t' : '', c.movil === 'oculta' ? 'tdn-mo' : ''].filter(Boolean).join(' ')}"${i && c.t && typeof c.t === 'string' ? ` data-l="${esc(c.t)}"` : ''}>${aTexto(v)}</td>`; }).join('')}${cfg.acciones ? '<td class="tdn-a"></td>' : ''}</tr></tfoot>` : '';
  // En el cel no hay cabecera: el orden se elige con un select (solo si hay columnas ordenables).
  const ords = cfg.cols.map((c, i) => [c, i]).filter(([c]) => c.orden);
  const osel = ords.length && !cfg.cargando ? `<label class="tdn-osel"><span>Ordenar</span><select class="in" data-tdn-osel aria-label="Ordenar por">${ords.flatMap(([c, i]) => ['asc', 'desc'].map((d) => { const t = aTexto(c.t).replace(/<[^>]+>/g, ''); return `<option value="${i}:${d}"${orden?.k === c.k && orden.dir === d ? ' selected' : ''}>${esc(t)} ${c.num ? (d === 'desc' ? '· mayor primero' : '· menor primero') : d === 'asc' ? '· A–Z' : '· Z–A'}</option>`; })).join('')}${orden ? '' : '<option value="" selected>Como llegan</option>'}</select></label>` : '';
  return out(`<div class="tdn${cfg.abrir ? ' tdn-clic' : ''}${cfg.clase ? ' ' + esc(cfg.clase) : ''}" id="${uid}">${osel}<table class="tdn-t0"${cfg.seleccion ? ' aria-multiselectable="true"' : ''}><caption class="tdn-sr">${esc(cfg.etiqueta || 'Tabla')}</caption>${cab}${cuerpo}${pie}</table>${cfg.seleccion && sel.size ? `<div class="tdn-barra" role="status">${sel.size} elegida${sel.size === 1 ? '' : 's'}</div>` : ''}</div>`);
}

// ---------- Montar en el navegador ----------
// Devuelve { pintar(cfgNueva?), seleccion(), estado }. La tabla guarda su orden, su selección y la fila con foco entre repintadas.
export function tabla(caja, cfg) {
  const estado = { orden: cfg.orden || null, sel: new Set(), foco: null, uid: `tb${++nTabla}` };
  let c = cfg;
  const filasVisibles = () => vistaFilas(c, estado.orden);
  const filaDe = (id) => (c.filas || []).find((f) => String(idDe(c)(f)) === id);
  const trs = () => [...caja.querySelectorAll('tr.tdn-f')];
  const pintar = (nueva) => {
    if (nueva) { c = { ...c, ...nueva }; const ids = new Set((c.filas || []).map((f) => String(idDe(c)(f)))); estado.sel = new Set([...estado.sel].filter((x) => ids.has(x))); }
    const enfocada = caja.contains(document.activeElement) && document.activeElement.closest?.('tr.tdn-f')?.dataset.tdnId;
    caja.innerHTML = aTexto(tablaHtml(c, estado));
    const todo = caja.querySelector('[data-tdn-todos]'); if (todo?.dataset.mixto) todo.indeterminate = true;
    if (enfocada) caja.querySelector(`tr.tdn-f[data-tdn-id="${CSS.escape(enfocada)}"]`)?.focus();
  };
  const avisar = () => c.seleccion?.alCambiar?.([...estado.sel], [...estado.sel].map(filaDe).filter(Boolean));
  const ordenarPor = (i, dir) => { const col = c.cols[i]; if (!col?.orden) return; estado.orden = dir ? { k: col.k, dir } : siguienteOrden(estado.orden, col); pintar(); caja.querySelector(`[data-tdn-orden="${i}"]`)?.focus(); };
  caja.onclick = (e) => {
    const o = e.target.closest('[data-tdn-orden]'); if (o) return ordenarPor(+o.dataset.tdnOrden);
    if (e.target.closest('[data-tdn-todos]')) { estado.sel = todos(estado.sel, filasVisibles().map((f) => String(idDe(c)(f)))); pintar(); avisar(); return; }
    const tr = e.target.closest('tr.tdn-f'); if (!tr) return;
    const f = filaDe(tr.dataset.tdnId); estado.foco = tr.dataset.tdnId;
    const b = e.target.closest('[data-tdn-acc]'); if (b) { e.stopPropagation(); c.acciones(f)[+b.dataset.tdnAcc]?.fn?.(f, e); return; }
    if (e.target.closest('[data-tdn-x]')) { estado.sel = alternar(estado.sel, tr.dataset.tdnId); pintar(); avisar(); return; }
    if (e.target.closest('a,button,input,select,textarea,label,summary,[data-act]')) return; // lo interactivo de una celda hace lo suyo
    if (c.abrir && !getSelection()?.toString()) c.abrir(f, e);
  };
  caja.onchange = (e) => { const s = e.target.closest('[data-tdn-osel]'); if (!s) return; if (!s.value) { estado.orden = null; return pintar(); } const [i, d] = s.value.split(':'); ordenarPor(+i, d); };
  caja.onkeydown = (e) => {
    const tr = e.target.closest?.('tr.tdn-f'); if (!tr || e.target !== tr) return;
    const ls = trs(), i = ls.indexOf(tr), j = moverFoco(i, e.key, ls.length);
    if (j != null) { e.preventDefault(); ls[i].tabIndex = -1; ls[j].tabIndex = 0; ls[j].focus(); estado.foco = ls[j].dataset.tdnId; return; }
    if (e.key === 'Enter' && c.abrir) { e.preventDefault(); c.abrir(filaDe(tr.dataset.tdnId), e); return; }
    if (e.key === ' ' && c.seleccion) { e.preventDefault(); estado.foco = tr.dataset.tdnId; estado.sel = alternar(estado.sel, tr.dataset.tdnId); pintar(); avisar(); }
  };
  pintar();
  return { pintar, estado, seleccion: () => [...estado.sel], limpiar: () => { estado.sel = new Set(); pintar(); avisar(); } };
}
