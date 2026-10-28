// Vista de Pricing & Packages (herramienta pricing-packages de Strategy): de 2 a 4 tarjetas de paquete con la recomendada resaltada, la matriz
// paquetes × features y el simulador de margen (precio, costo unitario, CAC, volumen → margen %, LTV:CAC y punto de equilibrio, con simular() puro).
// Todo precio es una propuesta: se escala al CEO. Los costos del cliente van etiquetados con su fuente y, igual que los márgenes y el simulador, solo los
// ve quien ve costos; los resultados del simulador se calculan al momento y NO se guardan. Nada se borra: un paquete se archiva.
// Existe para que tool-shell.js pinte el centro con un solo contrato (nuevo, pintar, resumen). Pinta con html`…` (todo se escapa), lee y escribe con
// inputs nativos y avisa cada cambio con el contenido completo y limpio; los avisos y los resultados se recalculan solos sin tocar el campo donde se escribe.
import { html, mount, ico } from '../core.js';
import { SIN_DATOS, numeroONull } from '../consulting/marcos.js';
import { MAX_PAQUETES, MAX_FEATURES, ETIQUETA_CLIENTE, vacio, limpiar, simular, matriz, paquetesVivos, paqueteRecomendado, textoPrecio, costosReales } from './precios.js';

const SD = {
  precio: 'Offer Architect (variaciones) y los precios del Radar',
  paquetes: 'las variaciones aprobadas de Offer Architect',
  costos: 'los costos y la adquisición que comparte el cliente (Finanzas en su ficha)',
};
const ponerRuta = (obj, ruta, v) => { const p = ruta.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[ultimo] = v; };
const valorDe = (t) => (t.type === 'checkbox' ? t.checked : t.type === 'number' || t.dataset.tipo === 'num' ? numeroONull(t.value) : t.value);
// Quien ve costos: el CEO y el COO (el servidor es quien decide de verdad: a los demás les quita los costos al leer).
const veCostos = (me, ctx) => ctx?.costosOcultos !== true && (me?.role === 'ceo' || me?.role === 'coo');
const sigId = (lista, pre) => { let i = lista.length + 1; while (lista.some((x) => x.id === `${pre}${i}`)) i++; return `${pre}${i}`; };
const dato = (v, d = 2, suf = '') => (v === null || v === undefined ? null : `${Number(v.toFixed ? v.toFixed(d) : v)}${suf}`);

function campos(editable) {
  const ro = (valor, o) => html`<span class="pr-ro" data-vacio="${valor || valor === 0 ? 0 : 1}">${valor || valor === 0 ? valor : o.sd ? `${SIN_DATOS}: sale de ${o.sd}` : '—'}</span>`;
  return {
    txt: (ruta, valor, o = {}) => (editable ? html`<input class="in" type="text" data-c="${ruta}" value="${valor ?? ''}" maxlength="${o.max || 120}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}" autocomplete="off">` : ro(valor, o)),
    num: (ruta, valor, o = {}) => (editable ? html`<input class="in" type="number" data-c="${ruta}" value="${valor ?? ''}" min="0" step="any" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">` : ro(valor, o)),
    area: (ruta, valor, o = {}) => (editable ? html`<textarea class="in" data-c="${ruta}" rows="${o.filas || 2}" maxlength="${o.max || 300}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">${valor ?? ''}</textarea>` : ro(valor, o)),
  };
}

// ---------- Regiones derivadas ----------
function avisoPaquete({ c, i }) {
  const p = c.paquetes[i]; if (!p) return '';
  return p.precio === null ? html`<p class="pr-sd">${SIN_DATOS}: sale de ${SD.precio}</p>` : '';
}
// El simulador: lo que se calcula con lo que hay; lo que falta dice ⚠️ SIN DATOS y qué dato falta. Nada de esto se guarda.
function resultados({ s }) {
  const r = simular(s), f = (v, suf, falta) => (v === null ? html`<span class="pr-sd">${SIN_DATOS}: falta ${falta}</span>` : html`<b>${dato(v, 2, suf)}</b>`);
  const margenTxt = r.margenPct === null ? html`<span class="pr-sd">${SIN_DATOS}: falta el precio y el costo unitario</span>` : html`<b>${dato(r.margenPct, 1, ' %')}</b>`;
  return html`<dl class="pr-res" data-malo="${r.margenUnit !== null && r.margenUnit < 0 ? 1 : 0}">
    <div><dt>Margen</dt><dd>${margenTxt}</dd></div>
    <div><dt>Margen por venta</dt><dd>${f(r.margenUnit, '', 'el precio y el costo unitario')}</dd></div>
    <div><dt>LTV</dt><dd>${f(r.ltv, '', 'las compras por cliente')}</dd></div>
    <div><dt>LTV:CAC</dt><dd>${r.ltvCac === null ? html`<span class="pr-sd">${SIN_DATOS}: falta el CAC y las compras por cliente</span>` : html`<b data-semaforo="${r.ltvCac >= 3 ? 'verde' : r.ltvCac >= 1 ? 'ambar' : 'rojo'}">${dato(r.ltvCac, 1, ' : 1')}</b>`}</dd></div>
    <div><dt>Punto de equilibrio</dt><dd>${r.equilibrio === null ? html`<span class="pr-sd">${SIN_DATOS}: falta el CAC y un margen positivo</span>` : html`<b>${dato(r.equilibrio, 1)}</b> <span class="mut sm">compras por cliente para recuperar el CAC</span>`}</dd></div>
    <div><dt>Utilidad del mes (1.ª compra)</dt><dd>${f(r.utilidadMes, '', 'el volumen y el CAC')}</dd></div></dl>`;
}
const REGIONES = { aviso: avisoPaquete, res: resultados };

// ---------- La vista ----------
function tarjeta(p, i, f, editable, conCosto) {
  return html`<article class="pr-card" data-recomendado="${p.recomendado ? 1 : 0}" data-id="${p.id}">
    <header class="pr-card-h">${p.recomendado ? html`<span class="chip pr-rec">${ico('star', 13)} Recomendado</span>` : ''}
      ${editable ? html`<button type="button" class="btn ghost xs" data-act="archivar" data-i="${i}" aria-label="Archivar paquete">Archivar</button>` : ''}</header>
    <label class="pr-f"><span class="lbl">Nombre</span>${f.txt(`paquetes.${i}.nombre`, p.nombre, { max: 60, label: 'Nombre del paquete', ph: 'Nombre del paquete', sd: SD.paquetes })}</label>
    <div class="pr-f"><span class="lbl">Precio <span class="mut sm">propuesta: se escala al CEO</span></span>${editable
      ? html`<div class="pr-fila">${f.num(`paquetes.${i}.precio`, p.precio, { label: 'Precio del paquete', ph: 'Monto' })}${f.txt(`paquetes.${i}.moneda`, p.moneda, { max: 8, label: 'Moneda', ph: 'GTQ' })}</div>`
      : html`<span class="pr-ro" data-vacio="${p.precio === null ? 1 : 0}">${textoPrecio(p)}</span>`}<div data-r="aviso" data-i="${i}"></div></div>
    <label class="pr-f"><span class="lbl">Para quién</span>${f.txt(`paquetes.${i}.para_quien`, p.para_quien, { max: 160, label: 'Para quién es', ph: 'El cliente al que le sirve' })}</label>
    <label class="pr-f"><span class="lbl">Qué incluye</span>${f.area(`paquetes.${i}.resumen`, p.resumen, { max: 240, filas: 2, label: 'Resumen del paquete', ph: 'En una o dos frases' })}</label>
    ${conCosto ? html`<label class="pr-f"><span class="lbl">Costo unitario <span class="mut sm">del cliente</span></span>${f.num(`paquetes.${i}.costo`, p.costo, { label: 'Costo unitario del paquete', ph: ETIQUETA_CLIENTE })}</label>` : ''}
    ${editable ? html`<label class="pr-op"><input type="radio" name="pr-rec" data-c="@rec" value="${i}" ${p.recomendado ? 'checked' : ''}> Es el recomendado</label>` : ''}</article>`;
}

function plantilla({ c, editable, ver, real }, f) {
  const vivos = c.paquetes.map((p, i) => [p, i]).filter(([p]) => !p.archivado), m = matriz(c), cols = vivos;
  return html`<div class="pr" data-editable="${editable ? 1 : 0}">
    <p class="pr-nota" role="note">${ico('tag', 14)} Todo precio es una propuesta: se escala al CEO antes de decirlo al cliente.</p>
    <section class="pr-sec" aria-label="Paquetes"><h3 class="pr-t">${ico('layers', 16)} Paquetes <span class="mut sm">de 2 a ${MAX_PAQUETES}, uno recomendado</span></h3>
      ${vivos.length ? html`<div class="pr-cards">${vivos.map(([p, i]) => tarjeta(p, i, f, editable, ver && real))}</div>` : html`<p class="pr-sd">${SIN_DATOS}: sale de ${SD.paquetes}</p>`}
      ${editable && vivos.length < MAX_PAQUETES ? html`<button type="button" class="btn xs" data-act="agregar">${ico('plus', 13)} Agregar paquete</button>` : ''}
      <label class="pr-f pr-porque"><span class="lbl">Por qué se recomienda ese paquete</span>${f.area('porque', c.porque, { max: 500, filas: 3, label: 'Por qué se recomienda', ph: 'La razón en una o dos frases, con el dato que la apoya', sd: SD.paquetes })}</label></section>
    <section class="pr-sec" aria-label="Matriz de paquetes por features"><h3 class="pr-t">${ico('list', 16)} Matriz <span class="mut sm">qué incluye cada paquete</span></h3>
      ${cols.length && c.features.length ? html`<div class="pr-scroll"><table class="pr-mx"><thead><tr><th scope="col">Feature</th>${cols.map(([p]) => html`<th scope="col" data-recomendado="${p.recomendado ? 1 : 0}">${p.nombre || p.id}</th>`)}${editable ? html`<th scope="col"><span class="sr-only">Archivar</span></th>` : ''}</tr></thead>
        <tbody>${c.features.map((x, fi) => html`<tr><th scope="row">${editable ? f.txt(`features.${fi}.nombre`, x.nombre, { max: 80, label: 'Nombre del feature', ph: 'Feature' }) : x.nombre}</th>${cols.map(([p, pi]) => html`<td data-recomendado="${p.recomendado ? 1 : 0}">${editable
          ? html`<input type="checkbox" data-c="@inc.${pi}.${x.id}" ${p.incluye.includes(x.id) ? 'checked' : ''} aria-label="${p.nombre || p.id} incluye ${x.nombre}">`
          : html`<span aria-label="${p.incluye.includes(x.id) ? 'Incluido' : 'No incluido'}">${p.incluye.includes(x.id) ? '✓' : '—'}</span>`}</td>`)}${editable ? html`<td><button type="button" class="btn ghost xs" data-act="quitar-feature" data-i="${fi}" aria-label="Quitar feature de la matriz">Quitar</button></td>` : ''}</tr>`)}</tbody></table></div>`
        : html`<p class="pr-sd">${SIN_DATOS}: la matriz sale de los paquetes y de lo que incluye cada oferta (Offer Architect)</p>`}
      ${editable && c.features.length < MAX_FEATURES ? html`<button type="button" class="btn xs" data-act="agregar-feature">${ico('plus', 13)} Agregar feature</button>` : ''}</section>
    ${ver ? html`<section class="pr-sec" aria-label="Costos del cliente"><h3 class="pr-t">${ico('lock', 16)} Costos del cliente <span class="mut sm">solo los ve quien ve costos</span></h3>
      ${real ? html`<p class="pr-etq">${ETIQUETA_CLIENTE} · cada dato dice su fuente</p>
        <div class="pr-fila"><label class="pr-f"><span class="lbl">CAC</span>${f.num('costos.cac', c.costos.cac, { label: 'Costo de adquisición del cliente', ph: 'Por cliente nuevo' })}</label><label class="pr-f"><span class="lbl">Clientes nuevos al mes</span>${f.num('costos.volumen', c.costos.volumen, { label: 'Volumen mensual de clientes nuevos', ph: 'Volumen' })}</label><label class="pr-f"><span class="lbl">Compras por cliente</span>${f.num('costos.compras', c.costos.compras, { label: 'Compras por cliente', ph: 'En su vida como cliente' })}</label></div>
        <label class="pr-f"><span class="lbl">Fuente de los costos</span>${f.txt('costos.fuente', c.costos.fuente, { max: 200, label: 'Fuente de los costos', ph: ETIQUETA_CLIENTE, sd: SD.costos })}</label>`
        : html`<p class="pr-sd">${SIN_DATOS}: los costos reales entran solo con Growth Partnership y Finanzas en la ficha (sale de ${SD.costos}). Mientras tanto el simulador es de ejemplo.</p>`}</section>
    <section class="pr-sec" aria-label="Simulador de margen"><h3 class="pr-t">${ico('chart-column', 16)} Simulador de margen <span class="mut sm">${real ? 'con los costos del cliente' : 'con números de ejemplo, no son del cliente'} · no se guarda</span></h3>
      <div class="pr-fila pr-sim"><label class="pr-f"><span class="lbl">Precio</span><input class="in" type="number" min="0" step="any" data-s="precio" aria-label="Simulador: precio"></label><label class="pr-f"><span class="lbl">Costo unitario</span><input class="in" type="number" min="0" step="any" data-s="costo" aria-label="Simulador: costo unitario"></label><label class="pr-f"><span class="lbl">CAC</span><input class="in" type="number" min="0" step="any" data-s="cac" aria-label="Simulador: CAC"></label><label class="pr-f"><span class="lbl">Clientes nuevos al mes</span><input class="in" type="number" min="0" step="any" data-s="volumen" aria-label="Simulador: volumen"></label><label class="pr-f"><span class="lbl">Compras por cliente</span><input class="in" type="number" min="0" step="any" data-s="compras" aria-label="Simulador: compras por cliente"></label></div>
      <button type="button" class="btn ghost xs" data-act="usar-rec">Partir del paquete recomendado</button>
      <div data-r="res"></div></section>` : ''}
  </div>`;
}

export const vista = {
  nuevo() { return vacio(); },

  pintar(el, { contenido, editable, onCambio, ctx, me } = {}) {
    const ed = Boolean(editable), ver = veCostos(me, ctx), real = costosReales(ctx);
    const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {})), sim = { precio: null, costo: null, cac: null, volumen: null, compras: null };
    let root = null;
    const cache = new WeakMap();
    const poner = (nodo, h) => { const s = String(h); if (cache.get(nodo) !== s) { cache.set(nodo, s); mount(nodo, h); } };
    const refrescar = () => { for (const nodo of root.querySelectorAll('[data-r]')) { const g = REGIONES[nodo.dataset.r]; if (g) poner(nodo, g({ c: limpiar(structuredClone(c)), s: sim, i: Number(nodo.dataset.i) })); } };
    const avisar = () => { if (typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };
    // El simulador parte del paquete recomendado y de los costos del cliente (si los hay y los ve); la persona puede cambiar cada número.
    const partir = () => {
      const r = paqueteRecomendado(limpiar(structuredClone(c))), k = ver && real ? c.costos : {};
      Object.assign(sim, { precio: r?.precio ?? null, costo: ver && real ? r?.costo ?? null : null, cac: k.cac ?? null, volumen: k.volumen ?? null, compras: k.compras ?? null });
      for (const inp of root.querySelectorAll('[data-s]')) inp.value = sim[inp.dataset.s] ?? '';
    };
    // Con el DOM listo: los resultados y el simulador (solo si ve costos).
    function pintarTodo() {
      mount(el, plantilla({ c, editable: ed, ver, real }, campos(ed)));
      root = el.firstElementChild;
      if (ver) { if (Object.values(sim).every((x) => x === null)) partir(); else for (const inp of root.querySelectorAll('[data-s]')) inp.value = sim[inp.dataset.s] ?? ''; }
      refrescar();
    }
    pintarTodo();
    const alSimular = (e) => { const t = e.target?.closest?.('[data-s]'); if (!t || !root.contains(t)) return false; sim[t.dataset.s] = numeroONull(t.value, { min: 0 }); refrescar(); return true; };
    root.addEventListener('input', alSimular);
    if (!ed) {
      root.addEventListener('click', (e) => { if (e.target.closest('[data-act="usar-rec"]')) { partir(); refrescar(); } });
      return;
    }
    const alCambiar = (e) => {
      const t = e.target, k = t?.dataset?.c;
      if (!k || !root?.contains(t)) return;
      if (k === '@rec') { c.paquetes.forEach((p, i) => { p.recomendado = i === Number(t.value); }); }
      else if (k.startsWith('@inc.')) {
        const [, i, fid] = k.split('.'), p = c.paquetes[Number(i)]; if (!p) return;
        p.incluye = t.checked ? [...new Set([...p.incluye, fid])] : p.incluye.filter((x) => x !== fid);
      } else ponerRuta(c, k, valorDe(t));
      avisar(); refrescar();
    };
    const oyentes = () => { root.addEventListener('input', alSimular); root.addEventListener('input', alCambiar); root.addEventListener('change', alCambiar); root.addEventListener('click', alClic); };
    // Agregar, archivar y quitar cambian la lista: se pinta otra vez (el paquete se archiva; el feature solo sale de la matriz).
    function alClic(e) {
      const b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) return;
      const i = Number(b.dataset.i), a = b.dataset.act;
      if (a === 'usar-rec') { partir(); refrescar(); return; }
      if (a === 'agregar' && paquetesVivos(limpiar(structuredClone(c))).length < MAX_PAQUETES) c.paquetes.push({ id: sigId(c.paquetes, 'p'), nombre: '', precio: null, moneda: c.paquetes.find((p) => p.moneda)?.moneda || '', para_quien: '', resumen: '', incluye: [], costo: null, recomendado: false, archivado: false });
      else if (a === 'archivar' && c.paquetes[i]) { c.paquetes[i].archivado = true; c.paquetes[i].recomendado = false; }
      else if (a === 'agregar-feature') c.features.push({ id: sigId(c.features, 'f'), nombre: '' });
      else if (a === 'quitar-feature' && c.features[i]) { const id = c.features[i].id; c.features.splice(i, 1); for (const p of c.paquetes) p.incluye = p.incluye.filter((x) => x !== id); }
      else return;
      avisar(); pintarTodo(); oyentes();
    }
    root.removeEventListener('input', alSimular);
    oyentes();
  },

  // Una línea para el Overview: cuántos paquetes y cuál se recomienda (sin costos ni márgenes).
  resumen(contenido) {
    const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {})), v = paquetesVivos(c), r = paqueteRecomendado(c);
    return html`<span class="pr-res-l"><span class="chip">${v.length ? `${v.length} paquete${v.length === 1 ? '' : 's'}` : `Paquetes: ${SIN_DATOS}`}</span><span class="chip">${r ? `Recomendado: ${r.nombre || r.id}` : `Recomendado: ${SIN_DATOS}`}</span></span>`;
  },
};
