// Vista del Automation Opportunity Finder (herramienta de Consulting): la matriz impacto en ventas × esfuerzo sobre los pasos manuales
// del Mapa del camino del dinero aprobado, el orden de ataque (primero lo que pierde leads o ventas), las horas del cliente (o
// ⚠️ SIN DATOS) y lo que se manda al Plan de 90 días. Existe para que tool-shell.js pinte el centro con un solo contrato (nuevo,
// pintar, resumen). Pinta con html`…` (todo se escapa), edita con inputs nativos, avisa cada cambio con el contenido limpio y
// recalcula matriz, orden y avisos sin tocar el campo donde la persona escribe.
import { html, mount, ico, toast, confirmAsk } from '../core.js';
import { SIN_DATOS, corta, numeroONull } from './marcos.js';
import { ETAPAS_CAMINO } from './procesos.js';
import { PIERDE, CUADRANTES, vacio, limpiar, ordenar, porCuadrante, cuadranteDe, pierdeVentas, elegidas, horasElegidas, sistemaDe, avisos, desdeProcesos } from './automatizacion.js';

const NIVEL = (a, b) => [[1, `1 · ${a}`], [2, '2'], [3, '3'], [4, '4'], [5, `5 · ${b}`]];
const SISTEMA = { conversion: 'Conversion', operations: 'Operations', money: 'Money' };
const MAX_FILAS = 30;
const num = (n) => (typeof n === 'number' ? new Intl.NumberFormat('es').format(n) : '');
const mapaDe = (ctx) => (Array.isArray(ctx?.entradas) ? ctx.entradas : []).filter((e) => e?.tool === 'process-mapper').pop() || null;
const ponerRuta = (obj, r, v) => { const p = r.split('.'), u = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[u] = v; };
const valorDe = (t) => (t.type === 'checkbox' ? t.checked : t.dataset.tipo === 'num' ? numeroONull(t.value) : t.value);
const base = (contenido) => limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {}));

function campos(editable) {
  const ro = (v, o) => html`<span class="aut-ro" data-vacio="${v === '' || v == null ? 1 : 0}">${v === '' || v == null ? (o.sd ? `${SIN_DATOS}: ${o.sd}` : '—') : v}</span>`;
  return {
    txt: (r, v, o = {}) => (editable ? html`<input class="in" type="text" data-c="${r}" value="${v ?? ''}" maxlength="${o.max || 200}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}" autocomplete="off">` : ro(v, o)),
    num: (r, v, o = {}) => (editable ? html`<input class="in" type="number" min="0" step="any" data-c="${r}" data-tipo="num" value="${v ?? ''}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">` : ro(typeof v === 'number' ? num(v) : '', o)),
    sel: (r, op, actual, o = {}) => (editable
      ? html`<select class="in" data-c="${r}" data-tipo="${o.num ? 'num' : ''}" aria-label="${o.label || ''}"><option value="">${o.vacio || '—'}</option>${op.map(([v, l]) => html`<option value="${v}" ${String(actual ?? '') === String(v) ? 'selected' : ''}>${l}</option>`)}</select>`
      : ro(op.find(([v]) => String(v) === String(actual ?? ''))?.[1] || '', o)),
    chk: (r, v, o = {}) => (editable ? html`<input type="checkbox" data-c="${r}" ${v ? 'checked' : ''} aria-label="${o.label || ''}">` : ro(v ? 'Sí' : 'No', o)),
  };
}
const nombre = (f) => f.paso || 'Paso sin nombre';

// ---------- Regiones derivadas ----------
const matriz = ({ c }) => {
  const q = porCuadrante(c);
  if (!c.filas.length) return html`<p class="aut-sd">${SIN_DATOS}: los pasos manuales salen del Mapa del camino del dinero aprobado</p>`;
  return html`<div class="aut-mx" role="group" aria-label="Matriz impacto en ventas por esfuerzo">${CUADRANTES.map((x) => html`<article class="aut-q" data-q="${x.id}"><h4>${x.nombre} <span class="mut sm">${x.que}</span></h4>
    ${q[x.id].length ? html`<ol>${q[x.id].map((f) => html`<li data-vende="${pierdeVentas(f) ? 1 : 0}"><b>${nombre(f)}</b> <span class="mut sm">${f.impacto} × ${f.esfuerzo}${PIERDE.find((p) => p.id === f.pierde) ? ` · pierde ${PIERDE.find((p) => p.id === f.pierde).nombre.toLowerCase()}` : ''}</span></li>`)}</ol>` : html`<p class="mut sm">—</p>`}</article>`)}</div>
    ${q.sinEvaluar.length ? html`<p class="aut-sin">${ico('triangle-alert', 15)} Sin evaluar (${SIN_DATOS}: impacto o esfuerzo): ${q.sinEvaluar.map((f) => nombre(f)).join(', ')}</p>` : ''}`;
};
const orden = ({ c }) => {
  const o = ordenar(c.filas);
  return o.length ? html`<ol class="aut-orden">${o.map((f) => html`<li data-vende="${pierdeVentas(f) ? 1 : 0}" data-elegida="${f.elegida ? 1 : 0}"><b>${nombre(f)}</b> <span class="mut sm">${cuadranteDe(f) ? CUADRANTES.find((x) => x.id === cuadranteDe(f)).nombre : SIN_DATOS}${pierdeVentas(f) ? ' · pierde leads o ventas' : ''}</span></li>`)}</ol>` : html`<p class="aut-sd">${SIN_DATOS}: aún no hay pasos</p>`;
};
const plan = ({ c }) => {
  const e = elegidas(c), h = horasElegidas(c), av = avisos(c);
  return html`${e.length ? html`<ul class="aut-plan-ul">${e.map((f) => html`<li><b>${nombre(f)}</b> <span class="mut sm">${f.que || `${SIN_DATOS}: qué se automatiza`} · ${SISTEMA[sistemaDe(f)]}</span></li>`)}</ul>
      <p class="aut-horas mut sm">Horas al mes de lo elegido: ${h.horas === null ? html`<span class="aut-sd">${SIN_DATOS}: las dice el cliente</span>` : html`<b>${num(h.horas)}</b>${h.sinDato ? ` (${h.sinDato} ${h.sinDato === 1 ? 'fila sin dato' : 'filas sin dato'})` : ''}`}</p>`
    : html`<p class="aut-sd">${SIN_DATOS}: elige las filas que van al Plan de 90 días</p>`}
    ${av.map((x) => html`<p class="aut-aviso">${ico('triangle-alert', 15)} ${x}</p>`)}`;
};
const estado = ({ c, id }) => {
  const f = c.filas.find((x) => x.id === id); if (!f) return html``;
  const q = cuadranteDe(f), d = [f.impacto === null ? 'impacto' : '', f.esfuerzo === null ? 'esfuerzo' : ''].filter(Boolean);
  return html`${q ? html`<span class="chip" data-q="${q}">${CUADRANTES.find((x) => x.id === q).nombre}</span>` : html`<span class="aut-sd">${SIN_DATOS}: ${d.join(' y ')}</span>`}${typeof f.horas_mes !== 'number' ? html` <span class="aut-sd">${SIN_DATOS}: horas del cliente</span>` : ''}`;
};
const REGIONES = { matriz, orden, plan, estado };

// ---------- La tabla ----------
function fila(f, i, E) {
  const { c, f: g, editable } = E, r = (k) => `filas.${i}.${k}`;
  return html`<li class="aut-fila" data-id="${f.id}" data-vende="${pierdeVentas(f) ? 1 : 0}" data-elegida="${f.elegida ? 1 : 0}">
    <div class="aut-f1"><label class="aut-f aut-f-ancho"><span class="lbl">Paso manual</span>${g.txt(r('paso'), f.paso, { max: 120, label: 'Paso manual', ph: 'Qué se hace a mano' })}</label>
      <span class="aut-meta mut sm">${ETAPAS_CAMINO.find((x) => x.id === f.etapa)?.nombre || 'Sin etapa'} · ${f.rol || `${SIN_DATOS}: rol`}${typeof f.perdida === 'number' ? ` · se pierde ${num(f.perdida)}%` : ''}</span></div>
    <div class="aut-f2">
      <label class="aut-f"><span class="lbl">Pierde</span>${g.sel(r('pierde'), PIERDE.map((x) => [x.id, x.nombre]), f.pierde, { vacio: '— nada', label: 'Qué pierde el negocio mientras se hace a mano' })}</label>
      <label class="aut-f"><span class="lbl">Impacto en ventas</span>${g.sel(r('impacto'), NIVEL('poco', 'mucho'), f.impacto, { num: 1, vacio: '— sin datos', label: 'Impacto en ventas, de 1 a 5', sd: 'impacto' })}</label>
      <label class="aut-f"><span class="lbl">Esfuerzo</span>${g.sel(r('esfuerzo'), NIVEL('poco', 'mucho'), f.esfuerzo, { num: 1, vacio: '— sin datos', label: 'Esfuerzo de automatizarlo, de 1 a 5', sd: 'esfuerzo' })}</label>
      <label class="aut-f"><span class="lbl">Horas al mes</span>${g.num(r('horas_mes'), f.horas_mes, { ph: 'h', label: 'Horas al mes que dice el cliente', sd: 'las dice el cliente' })}</label>
      <label class="aut-f"><span class="lbl">Fuente de las horas</span>${g.txt(r('fuente_horas'), f.fuente_horas, { max: 200, label: 'Fuente de las horas', ph: 'Quién lo dijo y cuándo' })}</label></div>
    <div class="aut-f3"><label class="aut-f aut-f-ancho"><span class="lbl">Qué se automatiza</span>${g.txt(r('que'), f.que, { max: 300, label: 'Qué se automatiza', ph: 'En una frase' })}</label>
      <label class="aut-f"><span class="lbl">Con qué</span>${g.txt(r('herramienta'), f.herramienta, { max: 120, label: 'Herramienta', ph: 'Tipo de herramienta' })}</label>
      <label class="aut-f aut-chk"><span class="lbl">Va al Plan de 90 días</span>${g.chk(r('elegida'), f.elegida, { label: 'Mandar esta fila al Plan de 90 días' })}</label>
      <span class="aut-est" data-r="estado" data-id="${f.id}"></span>
      ${editable ? html`<button type="button" class="btn ghost" data-act="aut-del" data-id="${f.id}" aria-label="Quitar este paso" title="Quitar este paso">${ico('x', 14)}</button>` : ''}</div></li>`;
}
const tabla = (E) => html`${E.c.filas.length ? html`<ul class="aut-filas">${E.c.filas.map((f, i) => fila(f, i, E))}</ul>` : html`<p class="aut-sd">${SIN_DATOS}: no hay pasos manuales; salen del Mapa del camino del dinero aprobado</p>`}`;

function plantilla(E) {
  const { editable, hayMapa } = E;
  return html`<div class="aut" data-editable="${editable ? 1 : 0}">
    <section class="aut-sec" aria-label="Matriz impacto en ventas por esfuerzo">
      <h3 class="aut-t">${ico('zap', 16)} Matriz impacto en ventas × esfuerzo <span class="mut sm">impacto alto = 4 o 5 · esfuerzo bajo = 1 o 2</span></h3>
      <div data-r="matriz"></div>
    </section>
    <section class="aut-sec" aria-label="Orden de ataque">
      <h3 class="aut-t">${ico('list-checks', 16)} Orden <span class="mut sm">primero lo que pierde leads o ventas: respuesta, seguimiento y cobro</span></h3>
      <div data-r="orden"></div>
    </section>
    <section class="aut-sec" aria-label="Pasos manuales">
      <h3 class="aut-t">${ico('wrench', 16)} Pasos manuales <span class="mut sm">del Mapa del camino del dinero</span></h3>
      <p class="aut-nota mut sm">Las horas las dice el cliente: sin su cifra dicen ${SIN_DATOS}, nunca 0 ni un cálculo con los minutos del paso.</p>
      <div class="aut-lista"></div>
      ${editable ? html`<div class="aut-btns"><button type="button" class="btn ghost" data-act="aut-add" ${E.c.filas.length >= MAX_FILAS ? 'disabled' : ''}>${ico('plus', 14)} Agregar paso</button>
        <button type="button" class="btn ghost" data-act="aut-traer" ${hayMapa ? '' : 'disabled'} title="${hayMapa ? 'Agrega los pasos manuales de hoy del Mapa que aún no están' : 'El Mapa del camino del dinero aún no está aprobado'}">${ico('shuffle', 14)} Traer pasos del Mapa</button></div>` : ''}
    </section>
    <section class="aut-sec aut-plan" aria-label="Va al Plan de 90 días">
      <h3 class="aut-t">${ico('send', 16)} Va al Plan de 90 días <span class="mut sm">cada fila elegida; se envía con «Enviar a» al aprobar</span></h3>
      <div data-r="plan"></div>
    </section>
  </div>`;
}

export const vista = {
  // El contenido inicial: los pasos manuales de hoy del Mapa aprobado (sin inventar impacto ni esfuerzo); vacío si el Mapa no está.
  nuevo(ctx) { const m = mapaDe(ctx); return { ...vacio(), filas: m ? limpiar({ filas: desdeProcesos(m.contenido) }).filas : [] }; },

  pintar(el, { contenido, editable, onCambio, ctx } = {}) {
    const c = base(contenido), ed = Boolean(editable), mapa = mapaDe(ctx), E = { c, f: campos(ed), editable: ed, hayMapa: Boolean(mapa) };
    mount(el, plantilla({ ...E, c, f: E.f }));
    const root = el.firstElementChild, cache = new WeakMap(), G = { c, f: E.f, editable: ed };
    const poner = (nodo, h) => { const s = String(h); if (cache.get(nodo) !== s) { cache.set(nodo, s); mount(nodo, h); } };
    const emitir = () => { if (ed && typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };
    const refrescar = () => {
      for (const nodo of root.querySelectorAll('[data-r]')) { const g = REGIONES[nodo.dataset.r]; if (g) poner(nodo, g({ c, id: nodo.dataset.id })); }
      for (const li of root.querySelectorAll('.aut-fila')) { const f = c.filas.find((x) => x.id === li.dataset.id); if (f) { li.dataset.vende = pierdeVentas(f) ? '1' : '0'; li.dataset.elegida = f.elegida ? '1' : '0'; } }
    };
    const pintarFilas = () => { mount(root.querySelector('.aut-lista'), tabla(G)); const add = root.querySelector('[data-act="aut-add"]'); if (add) add.disabled = c.filas.length >= MAX_FILAS; refrescar(); };
    pintarFilas();
    if (!ed) return;

    const alCambiar = (e) => { const t = e.target, k = t?.dataset?.c; if (!k || !root.contains(t)) return; ponerRuta(c, k, valorDe(t)); emitir(); refrescar(); };
    root.addEventListener('input', alCambiar);
    root.addEventListener('change', alCambiar);
    root.addEventListener('click', async (e) => {
      const b = e.target.closest?.('[data-act]'); if (!b || !root.contains(b) || b.disabled) return;
      const a = b.dataset.act;
      if (a === 'aut-add') {
        if (c.filas.length >= MAX_FILAS) return toast(`La lista llega hasta ${MAX_FILAS} pasos`, true);
        const usados = new Set(c.filas.map((x) => x.id)); let k = c.filas.length + 1; while (usados.has(`a${k}`)) k++;
        c.filas.push({ id: `a${k}`, paso: '', etapa: '', rol: '', perdida: null, pierde: '', impacto: null, esfuerzo: null, horas_mes: null, fuente_horas: '', que: '', herramienta: '', elegida: false });
        pintarFilas(); emitir(); [...root.querySelectorAll('.aut-fila')].pop()?.querySelector('input')?.focus();
      } else if (a === 'aut-traer') {
        if (!mapa) return;
        const nuevas = limpiar({ filas: desdeProcesos(mapa.contenido, c.filas) }).filas.slice(0, MAX_FILAS - c.filas.length);
        if (!nuevas.length) return toast('No hay pasos manuales nuevos en el Mapa');
        c.filas.push(...nuevas); pintarFilas(); emitir(); toast(nuevas.length === 1 ? 'Se agregó 1 paso del Mapa' : `Se agregaron ${nuevas.length} pasos del Mapa`);
      } else if (a === 'aut-del') {
        const i = c.filas.findIndex((x) => x.id === b.dataset.id); if (i < 0) return;
        if (c.filas[i].paso) { const ok = await confirmAsk(`Quitar «${corta(c.filas[i].paso, 60)}». Si ya lo guardaste, queda en las versiones anteriores.`); if (!ok || !root.isConnected) return; }
        c.filas.splice(i, 1); pintarFilas(); emitir();
      }
    });
  },

  // Una línea para el Overview: pasos, elegidos y horas.
  resumen(contenido) {
    const c = base(contenido), e = elegidas(c), h = horasElegidas(c);
    return html`<span class="aut-res"><span class="chip">${c.filas.length ? `${c.filas.length} ${c.filas.length === 1 ? 'paso manual' : 'pasos manuales'}` : `Pasos: ${SIN_DATOS}`}</span><span class="chip">${e.length ? `${e.length} al Plan de 90 días` : 'Nada elegido'}</span><span class="chip">${h.horas === null ? `Horas: ${SIN_DATOS}` : `${num(h.horas)} h al mes`}</span></span>`;
  },
};
