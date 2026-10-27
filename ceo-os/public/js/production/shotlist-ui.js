// Vista del Shot List Builder (herramienta shot-list-builder de Production): las escenas PR-001… en tabla o en tablero por jornada, chips para
// agrupar por locación, talento, setup o producto, el cambio de jornada con un select, «Grabada» de un toque, export CSV (16 columnas de la
// plantilla) e importar CSV. Existe para que tool-shell.js pinte el centro con un solo contrato (nuevo, pintar, resumen). Pinta con html`…`
// (todo se escapa); el costo estimado solo lo ve quien ve costos. Cada cambio avisa el contenido completo y limpio.
import { html, mount, ico, toast } from '../core.js';
import { canEdit } from '../roleviews.js';
import { SIN_DATOS, entradaDe, plano, corta } from '../consulting/marcos.js';
import { vacio, limpiar, escenaVacia, idEscena, jornadasDe, agrupar, progreso, segundos, aCsv, deCsv, mezclar, AGRUPAR, ESTADOS, MATERIALES } from './shotlist.js';

const veCostos = (me) => Boolean(me) && (['ceo', 'coo'].includes(me.role) || canEdit(me, 'clients')); // refleja seesCosts del servidor; el servidor decide
const guardar = (k, v) => { try { localStorage.setItem(`shotlist.${k}`, v); } catch { /* sin almacenamiento */ } };
const leerLS = (k, d) => { try { return localStorage.getItem(`shotlist.${k}`) || d; } catch { return d; } };
const base = (c) => limpiar(structuredClone(plano(c) ? c : {}));

function siguienteId(c) { let n = 0; for (const e of c.escenas) n = Math.max(n, Number(String(e.id).replace(/\D/g, '')) || 0); return idEscena(n + 1); }
function jornadaNueva(c) { const j = jornadasDe(c); let n = j.length + 1; while (j.includes(`J${n}`)) n++; return `J${n}`; }

const selJornada = (c, e, ed) => {
  const js = jornadasDe(c); if (e.jornada && !js.includes(e.jornada)) js.push(e.jornada);
  const nueva = jornadaNueva(c);
  return html`<select class="in sl-j" data-id="${e.id}" data-f="jornada" aria-label="Jornada de ${e.id}" ${ed ? '' : 'disabled'}><option value="">Sin jornada</option>${js.map((j) => html`<option value="${j}" ${e.jornada === j ? 'selected' : ''}>${j}</option>`)}<option value="${nueva}">+ ${nueva}</option></select>`;
};
const grabada = (e, ed) => html`<label class="sl-gr" data-on="${e.estado === 'grabada' ? 1 : 0}"><input type="checkbox" data-id="${e.id}" data-f="estado" ${e.estado === 'grabada' ? 'checked' : ''} ${ed ? '' : 'disabled'}><span>Grabada</span></label>`;
const txt = (e, f, o = {}, ed) => (ed
  ? html`<input class="in" type="${o.num ? 'number' : 'text'}" ${o.num ? 'min="0" step="any" inputmode="decimal"' : ''} data-id="${e.id}" data-f="${f}" value="${e[f] ?? ''}" maxlength="${o.max || 120}" aria-label="${o.label} de ${e.id}" placeholder="${o.ph || ''}" autocomplete="off">`
  : html`<span class="sl-ro">${e[f] ?? ''}</span>`);

function fila(c, e, { ed, costos }) {
  return html`<tr class="sl-fila" data-id="${e.id}" data-estado="${e.estado}" data-sin="${e.id_creativo ? 0 : 1}">
    <th scope="row" class="sl-id">${e.id}</th>
    <td>${txt(e, 'id_creativo', { label: 'Pieza', ph: 'id_creativo', max: 40 }, ed)}${e.id_creativo ? '' : html`<span class="sl-sd">${SIN_DATOS}: sale de la pieza de ④</span>`}</td>
    <td>${txt(e, 'accion', { label: 'Acción', max: 400, ph: 'Qué pasa' }, ed)}</td>
    <td>${txt(e, 'plano', { label: 'Plano', ph: 'medio, detalle…' }, ed)}</td>
    <td>${txt(e, 'duracion_s', { label: 'Segundos', num: 1 }, ed)}</td>
    <td>${txt(e, 'lugar', { label: 'Lugar' }, ed)}</td>
    <td>${txt(e, 'talento', { label: 'Talento', ph: 'rol' }, ed)}</td>
    <td>${txt(e, 'setup', { label: 'Setup' }, ed)}</td>
    <td>${txt(e, 'producto', { label: 'Producto' }, ed)}</td>
    ${costos ? html`<td>${txt(e, 'costo_estimado', { label: 'Costo estimado', num: 1 }, ed)}</td>` : ''}
    <td>${selJornada(c, e, ed)}</td>
    <td>${grabada(e, ed)}</td></tr>`;
}
const tabla = (c, lista, o) => html`<div class="sl-scroll"><table class="sl-tabla"><thead><tr><th>Id</th><th>Pieza</th><th>Acción</th><th>Plano</th><th>Seg</th><th>Lugar</th><th>Talento</th><th>Setup</th><th>Producto</th>${o.costos ? html`<th>Costo est.</th>` : ''}<th>Jornada</th><th>Estado</th></tr></thead>
  <tbody>${lista.map((e) => fila(c, e, o))}</tbody></table></div>`;
const tarjeta = (c, e, o) => html`<article class="sl-card" data-id="${e.id}" data-estado="${e.estado}">
  <header class="sl-card-h"><b>${e.id}</b><span class="sl-card-p">${e.id_creativo || html`<span class="sl-sd">${SIN_DATOS}</span>`}</span>${grabada(e, o.ed)}</header>
  <p class="sl-card-a">${e.accion || ''}</p>
  <p class="sl-card-m mut sm">${[e.plano, e.duracion_s != null ? `${e.duracion_s} s` : '', e.lugar, e.talento, e.setup, e.producto].filter(Boolean).join(' · ')}</p>
  ${selJornada(c, e, o.ed)}</article>`;
const tablero = (c, lista, o) => html`<div class="sl-tablero">${agrupar(lista, 'jornada', 'Sin jornada').map((g) => html`<section class="sl-col"><h4>${g.titulo} <span class="mut sm">${g.escenas.length} · ${Math.round(segundos(g.escenas))} s</span></h4>${g.escenas.map((e) => tarjeta(c, e, o))}</section>`)}</div>`;

function plantilla(c, S, o) {
  const p = progreso(c), lista = c.escenas;
  const cuerpo = !lista.length ? html`<p class="sl-sd">${SIN_DATOS}: aún no hay escenas. Agrega una, importa el CSV o pídele a la IA que las proponga desde el brief.</p>`
    : S.agrupar ? html`${agrupar(lista, S.agrupar, 'Sin dato').map((g) => html`<section class="sl-grupo"><h4>${g.titulo} <span class="mut sm">${g.escenas.length} escenas · ${Math.round(segundos(g.escenas))} s</span></h4>${S.modo === 'tablero' ? tablero(c, g.escenas, o) : tabla(c, g.escenas, o)}</section>`)}`
    : S.modo === 'tablero' ? tablero(c, lista, o) : tabla(c, lista, o);
  return html`<div class="sl" data-modo="${S.modo}">
    <div class="sl-barra">
      <div class="sl-vistas" role="group" aria-label="Vista"><button type="button" class="btn sm" data-a="modo" data-v="tabla" aria-pressed="${S.modo === 'tabla'}">${ico('list', 14)} Tabla</button><button type="button" class="btn sm" data-a="modo" data-v="tablero" aria-pressed="${S.modo === 'tablero'}">${ico('layout-grid', 14)} Tablero</button></div>
      <div class="sl-chips" role="group" aria-label="Agrupar por">${AGRUPAR.map(([k, n]) => html`<button type="button" class="chip" data-a="agrupar" data-v="${k}" aria-pressed="${S.agrupar === k}">${n}</button>`)}</div>
      <span class="sl-prog mut sm">${p.grabadas} de ${p.total} grabadas · ${Math.round(segundos(lista))} s</span>
    </div>
    <div class="sl-barra">
      ${o.ed ? html`<button type="button" class="btn sm" data-a="nueva">${ico('plus', 14)} Escena</button><label class="btn sm sl-imp">${ico('upload', 14)} Importar CSV<input type="file" accept=".csv,text/csv" data-a="importar" hidden></label>` : ''}
      <button type="button" class="btn sm" data-a="exportar" ${lista.length ? '' : 'disabled'}>${ico('download', 14)} Exportar CSV</button>
      ${o.costos ? '' : html`<span class="sl-nota mut sm">El CSV sale sin costo estimado.</span>`}
    </div>
    ${cuerpo}</div>`;
}

export const vista = {
  // El contenido inicial: una escena por pieza producible del Production Brief (sin plano ni lugar: eso no se inventa).
  nuevo(ctx) {
    const e = entradaDe(ctx, 'production-brief'), piezas = Array.isArray(e?.contenido?.piezas) ? e.contenido.piezas : [];
    const escenas = piezas.filter((x) => plano(x) && x.id_creativo && x.producible !== 'no').slice(0, 40).map((x, i) => ({ ...escenaVacia(idEscena(i + 1)), id_creativo: corta(x.id_creativo, 40), pieza: corta(x.formato, 120), material: x.material === 'foto' ? 'foto' : 'video' }));
    return escenas.length ? limpiar({ escenas }) : vacio();
  },

  pintar(el, { contenido, editable, onCambio, me } = {}) {
    const ed = Boolean(editable), costos = veCostos(me), c = base(contenido);
    const S = { modo: leerLS('modo', 'tabla') === 'tablero' ? 'tablero' : 'tabla', agrupar: AGRUPAR.some(([k]) => k === leerLS('agrupar', '')) ? leerLS('agrupar', '') : '' };
    const pintar = () => { mount(el, plantilla(c, S, { ed, costos })); };
    const avisar = () => { if (typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };
    pintar();

    el.onchange = (ev) => {
      const t = ev.target, id = t?.dataset?.id, f = t?.dataset?.f, a = t?.dataset?.a;
      if (a === 'importar') {
        const arch = t.files?.[0]; if (!arch || !ed) return;
        arch.text().then((txt) => {
          const nuevo = deCsv(txt); if (!nuevo) return toast('El CSV no trae las columnas de la plantilla (id, id_creativo…)', true);
          const m = mezclar(c, nuevo); c.escenas = m.escenas; avisar(); pintar(); toast(`Importadas ${nuevo.escenas.length} escenas`);
        }).catch(() => toast('No pude leer el archivo', true));
        return;
      }
      if (!id || !f || !ed) return;
      const e = c.escenas.find((x) => x.id === id); if (!e) return;
      if (f === 'estado') e.estado = t.checked ? 'grabada' : 'pendiente';
      else if (f === 'duracion_s' || f === 'costo_estimado') { const n = t.value.trim() === '' ? null : Number(t.value); e[f] = Number.isFinite(n) && n >= 0 ? n : null; }
      else e[f] = t.value;
      avisar();
      if (f === 'estado' || f === 'jornada' || f === 'id_creativo') pintar(); // el texto no se repinta: no se pierde el foco al tabular
    };
    el.onclick = (ev) => {
      const b = ev.target.closest?.('[data-a]'); if (!b || b.tagName === 'INPUT') return;
      const a = b.dataset.a;
      if (a === 'modo') { S.modo = b.dataset.v; guardar('modo', S.modo); }
      else if (a === 'agrupar') { S.agrupar = S.agrupar === b.dataset.v ? '' : b.dataset.v; guardar('agrupar', S.agrupar); }
      else if (a === 'nueva' && ed) { c.escenas.push(escenaVacia(siguienteId(c))); avisar(); }
      else if (a === 'exportar') {
        try {
          const url = URL.createObjectURL(new Blob([aCsv(c, { costos })], { type: 'text/csv;charset=utf-8' })), x = document.createElement('a');
          x.href = url; x.download = 'plan-de-produccion.csv'; document.body.append(x); x.click(); x.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
        } catch { toast('No pude exportar el CSV', true); }
        return;
      }
      pintar();
    };
  },

  // Una línea para el Overview: escenas grabadas y jornadas.
  resumen(contenido) {
    const c = base(contenido), p = progreso(c), j = jornadasDe(c).length;
    return html`<span class="sl-res"><span class="chip">${p.total ? `${p.grabadas} de ${p.total} escenas grabadas` : `Escenas: ${SIN_DATOS}`}</span>${j ? html`<span class="chip">${j} ${j === 1 ? 'jornada' : 'jornadas'}</span>` : ''}</span>`;
  },
};
