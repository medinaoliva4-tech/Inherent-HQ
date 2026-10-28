// Vista del Diagnóstico de crecimiento (herramienta business-health-assessment de Consulting): la barra de etapas 0-9, LA restricción,
// el medidor de capacidad vs demanda, el scorecard de las 12 palancas con su radar, el FODA y las 3 prioridades.
// Existe para que tool-shell.js pinte el centro de la herramienta con un solo contrato (nuevo, pintar, resumen) y para que lo vacío diga
// «⚠️ SIN DATOS» y de dónde sale. Pinta con html`…` (todo se escapa), lee y escribe con inputs nativos y avisa cada cambio con el
// contenido completo y limpio; los semáforos, el radar y los avisos se recalculan solos sin tocar el campo donde la persona escribe.
import { html, mount, ico } from '../core.js';
import { FUNCIONES, SISTEMAS, SISTEMAS_IDS, ETAPAS_HORMOZI, etapaHormozi, SIN_DATOS, corta, numeroONull } from './marcos.js';
import { CAPACIDAD, vacio, limpiar, palancasDe, scorecard, semaforoDe, hablaDeDemanda } from './salud.js';

const TRABADO = { oferta: 'la oferta', modelo: 'el modelo de dinero', leads: 'los leads', capacidad: 'la capacidad' };
const SEMAFORO = { rojo: 'Rojo', ambar: 'Ámbar', verde: 'Verde' };
const FODA = [['f', 'Fortalezas'], ['o', 'Oportunidades'], ['d', 'Debilidades'], ['a', 'Amenazas']];
const PUNTAJES = [[1, '1 · no existe'], [2, '2'], [3, '3'], [4, '4'], [5, '5 · sólido']];
const SD_ETAPA = 'sale de 3 preguntas al cliente: cuánto factura al mes y desde cuándo, cuántas personas trabajan y dónde se traba';
const SD_RESTRICCION = 'sale de la entrevista y de las palancas más bajas';
const SD_CAPACIDAD = 'sale de Operations OS (la entrega y el equipo) y de la entrevista al fundador';
const redondo = (n) => Math.round(n * 10) / 10;
const sinFuente = (f) => !corta(f, 200) || /sin datos/i.test(f);
const lineas = (t) => String(t ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const estrategiaDe = (ctx) => (ctx && typeof ctx.estrategia === 'object' && ctx.estrategia) || {};
// etapaHormozi(null) devuelve la etapa 0 (Number(null) es 0): aquí una etapa vacía es «sin ubicar», no «Improvise».
const etapaDe = (n) => (n === null || n === undefined || n === '' ? null : etapaHormozi(n));
const etapaEstrategia = (es) => (es.etapa && es.etapa.n != null && etapaHormozi(es.etapa.n) ? Number(es.etapa.n) : null);

// El contenido de trabajo: el limpio, con las 12 palancas y las 3 filas de prioridad siempre presentes (vacías = ⚠️ SIN DATOS).
function base(contenido) {
  const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {}));
  for (const s of SISTEMAS_IDS) c.sistemas[s] = palancasDe(c, s);
  while (c.prioridades.length < 3) c.prioridades.push({ orden: c.prioridades.length + 1, que: '', numero: '' });
  return c;
}
const ponerRuta = (obj, ruta, v) => { const p = ruta.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[ultimo] = v; };
const valorDe = (t) => (t.type === 'checkbox' ? t.checked : t.type === 'number' || t.dataset.tipo === 'num' ? numeroONull(t.value) : t.value);

// Los campos: un input nativo si se edita; texto plano (o ⚠️ SIN DATOS) si es de solo lectura.
function campos(editable) {
  const ro = (valor, o) => html`<span class="sal-ro" data-vacio="${valor ? 0 : 1}">${valor || (o.sd ? `${SIN_DATOS}: ${o.sd}` : '—')}</span>`;
  return {
    txt: (ruta, valor, o = {}) => (editable ? html`<input class="in" type="text" data-c="${ruta}" value="${valor ?? ''}" maxlength="${o.max || 200}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}" autocomplete="off">` : ro(valor, o)),
    area: (ruta, valor, o = {}) => (editable ? html`<textarea class="in" data-c="${ruta}" rows="${o.filas || 2}" maxlength="${o.max || 400}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">${valor ?? ''}</textarea>` : ro(valor, o)),
    sel: (ruta, lista, actual, o = {}) => (editable
      ? html`<select class="in" data-c="${ruta}" data-tipo="${o.num ? 'num' : ''}" aria-label="${o.label || ''}"><option value="">${o.vacio || '—'}</option>${lista.map(([v, l]) => html`<option value="${v}" ${String(actual ?? '') === String(v) ? 'selected' : ''}>${l}</option>`)}</select>`
      : ro(lista.find(([v]) => String(v) === String(actual ?? ''))?.[1] || '', o)),
  };
}

// ---------- Regiones derivadas: se recalculan solas y nunca contienen un campo editable ----------
const barra = ({ c, es, editable }) => {
  const n = c.etapa.n, entre = c.etapa.entre, st = etapaEstrategia(es), e = etapaDe(n);
  return html`<p class="sal-etapa-t">${e ? html`<b>Etapa ${e.n} · ${e.nombre}</b>` : entre ? html`<b>Entre las etapas ${entre[0]} y ${entre[1]}</b>` : html`<span class="sal-sd">${SIN_DATOS}: ${SD_ETAPA}</span>`}</p>
    <ol class="sal-barra" aria-label="Las 10 etapas, de la 0 a la 9">${ETAPAS_HORMOZI.map((x) => html`<li class="sal-paso" data-on="${n === x.n ? 1 : 0}" data-entre="${n === null && entre && x.n >= entre[0] && x.n <= entre[1] ? 1 : 0}" data-strategy="${st === x.n ? 1 : 0}" aria-current="${n === x.n ? 'step' : 'false'}" title="${x.nombre}"><b>${x.n}</b><span>${x.nombre}</span></li>`)}</ol>
    ${editable ? '' : html`${c.etapa.por_que ? html`<p class="sal-etapa-por">${c.etapa.por_que}</p>` : ''}${c.etapa.cita ? html`<p class="sal-cita">${c.etapa.cita}</p>` : ''}${c.etapa.falta ? html`<p class="sal-sd">Falta: ${c.etapa.falta}</p>` : ''}`}`;
};
const funcion = ({ c }) => (c.restriccion.funcion ? html`<b class="sal-restr-n">${c.restriccion.funcion}</b>` : html`<span class="sal-sd">${SIN_DATOS}: ${SD_RESTRICCION}</span>`);
const capacidad = ({ c }) => {
  const x = CAPACIDAD.find((k) => k.id === c.capacidad);
  return !x ? html`<p class="sal-sd">${SIN_DATOS}: ${SD_CAPACIDAD}</p>`
    : html`<p class="sal-cap-est" data-cap="${x.id}"><b>${x.nombre}</b> · ${x.que}</p>${x.id === 'rojo' ? html`<p class="sal-cap-alto" role="status">${ico('triangle-alert', 15)} No subir demanda todavía</p>` : ''}`;
};
// El estado de una palanca: semáforo + chip de evidencia (la fuente, «Sin fuente» o ⚠️ SIN DATOS con de dónde sale).
const estadoPalanca = ({ c, s, i }) => {
  const p = palancasDe(c, s)[i], def = SISTEMAS[s].palancas[i], sem = semaforoDe(p.puntaje);
  return html`<span class="sal-sem" data-sem="${sem}" title="${sem ? `Semáforo: ${SEMAFORO[sem].toLowerCase()}` : 'Sin puntaje, sin semáforo'}"></span><span class="sr-only">${sem ? `Semáforo ${SEMAFORO[sem].toLowerCase()}` : 'Sin semáforo'}. </span>
    ${p.puntaje === null ? html`<span class="sal-chip" data-ev="sin-datos">${SIN_DATOS}</span> <span class="sal-de mut sm">sale de ${def.sale_de}</span>`
      : sinFuente(p.fuente) ? html`<span class="sal-chip" data-ev="falta">Puntaje sin fuente</span>` : html`<span class="sal-chip" data-ev="ok" title="${p.fuente}">${p.fuente}</span>`}`;
};
const promedio = ({ c, s }) => {
  const v = scorecard(c)[s];
  return v === null ? html`<span class="sal-sd">${SIN_DATOS}</span>` : html`<span class="sal-sem" data-sem="${semaforoDe(v)}"></span><b>${redondo(v)}</b> / 5`;
};
const EJES = { conversion: -90, operations: 30, money: 150 };
function radar({ c }) {
  const sc = scorecard(c), CX = 170, CY = 128, R = 84;
  const punto = (id, v, r = R) => { const a = (EJES[id] * Math.PI) / 180; return [CX + r * (v / 5) * Math.cos(a), CY + r * (v / 5) * Math.sin(a)]; };
  const fmt = (p) => `${redondo(p[0])},${redondo(p[1])}`;
  const con = SISTEMAS_IDS.filter((id) => sc[id] !== null), pts = con.map((id) => punto(id, sc[id]));
  const desc = SISTEMAS_IDS.map((id) => `${SISTEMAS[id].nombre}: ${sc[id] === null ? 'sin datos' : `${redondo(sc[id])} de 5`}`).join('. ');
  return html`<svg class="sal-radar-svg" viewBox="0 0 340 210" role="img" aria-label="Radar de los 3 sistemas. ${desc}">
    ${[1, 2, 3, 4, 5].map((k) => html`<polygon class="sal-radar-grid" data-nivel="${k}" points="${SISTEMAS_IDS.map((id) => fmt(punto(id, k))).join(' ')}"/>`)}
    ${SISTEMAS_IDS.map((id) => { const f = punto(id, 5); return html`<line class="sal-radar-eje" x1="${CX}" y1="${CY}" x2="${redondo(f[0])}" y2="${redondo(f[1])}"/>`; })}
    ${con.length === 3 ? html`<polygon class="sal-radar-area" points="${pts.map(fmt).join(' ')}"/>` : con.length === 2 ? html`<line class="sal-radar-area" x1="${redondo(pts[0][0])}" y1="${redondo(pts[0][1])}" x2="${redondo(pts[1][0])}" y2="${redondo(pts[1][1])}"/>` : ''}
    ${con.map((id, k) => html`<circle class="sal-radar-pt" data-sem="${semaforoDe(sc[id])}" cx="${redondo(pts[k][0])}" cy="${redondo(pts[k][1])}" r="4"/>`)}
    ${SISTEMAS_IDS.map((id) => {
      const a = (EJES[id] * Math.PI) / 180, lx = redondo(CX + (R + 14) * Math.cos(a)), ly = redondo(CY + (R + 14) * Math.sin(a)), cos = Math.cos(a), arriba = Math.sin(a) < 0;
      const ancla = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
      return html`<text class="sal-radar-t" text-anchor="${ancla}"><tspan x="${lx}" y="${arriba ? ly - 14 : ly + 4}">${SISTEMAS[id].nombre}</tspan><tspan class="sal-radar-v" x="${lx}" y="${arriba ? ly : ly + 18}">${sc[id] === null ? SIN_DATOS : `${redondo(sc[id])} / 5`}</tspan></text>`;
    })}
  </svg>`;
}
// Avisos de una prioridad: con la capacidad en rojo no se recomienda demanda; sin número no se sabe qué mueve.
const avisoPrioridad = ({ c, i }) => {
  const p = c.prioridades[i] || {}, f = [];
  if (c.capacidad === 'rojo' && hablaDeDemanda(p.que)) f.push(html`<p class="sal-prio-alto">${ico('triangle-alert', 14)} Con la capacidad en rojo no se recomienda más demanda: esta prioridad habla de pauta, anuncios o volumen</p>`);
  if (p.que && !corta(p.numero, 120)) f.push(html`<p class="sal-sd">${SIN_DATOS}: falta el número de crecimiento que mueve (ventas, margen, CAC, LTV o caja)</p>`);
  return html`${f}`;
};
const REGIONES = { barra, fn: funcion, cap: capacidad, pal: estadoPalanca, sis: promedio, radar, prio: avisoPrioridad };

// ---------- La vista ----------
function plantilla({ c, es, editable }, f) {
  const lectura = etapaEstrategia(es) !== null || TRABADO[es.trabado];
  return html`<div class="sal" data-editable="${editable ? 1 : 0}">
    <section class="sal-sec sal-etapa" aria-label="Etapa">
      <h3 class="sal-t">${ico('compass', 16)} Etapa <span class="mut sm">del 0 al 9 del roadmap</span></h3>
      ${lectura ? html`<p class="sal-lectura">${etapaEstrategia(es) !== null ? html`Strategy ubicó la etapa ${etapaEstrategia(es)} · ${etapaHormozi(etapaEstrategia(es)).nombre} (${es.etapa.confirmada ? 'confirmada por el CEO' : 'sin confirmar'}). ` : ''}${TRABADO[es.trabado] ? html`Marcó que se traba en ${TRABADO[es.trabado]}.` : ''} Se lee de Strategy: no se vuelve a preguntar.</p>` : html`<p class="sal-lectura sal-sd">${SIN_DATOS}: Strategy todavía no ubica la etapa ni marca dónde se traba</p>`}
      <div data-r="barra"></div>
      ${editable ? html`<div class="sal-form">
        <label class="sal-f"><span class="lbl">Etapa</span>${f.sel('etapa.n', ETAPAS_HORMOZI.map((e) => [e.n, `${e.n} · ${e.nombre}`]), c.etapa.n, { num: 1, vacio: '— sin ubicar', label: 'Etapa del roadmap' })}</label>
        <div class="sal-f sal-entre" ${c.etapa.n !== null ? 'hidden' : ''}><span class="lbl">Si no calza clara, está entre</span>
          <span class="sal-entre-par"><select class="in" data-c="@entre0" aria-label="Entre la etapa"><option value="">—</option>${ETAPAS_HORMOZI.map((e) => html`<option value="${e.n}" ${c.etapa.entre?.[0] === e.n ? 'selected' : ''}>${e.n}</option>`)}</select> y <select class="in" data-c="@entre1" aria-label="y la etapa"><option value="">—</option>${ETAPAS_HORMOZI.map((e) => html`<option value="${e.n}" ${c.etapa.entre?.[1] === e.n ? 'selected' : ''}>${e.n}</option>`)}</select></span></div>
        <label class="sal-f sal-f-ancho"><span class="lbl">Por qué</span>${f.area('etapa.por_que', c.etapa.por_que, { max: 400, label: 'Por qué esa etapa', ph: 'Qué dato del cliente la ubica aquí' })}</label>
        <label class="sal-f"><span class="lbl">Cita del roadmap</span>${f.txt('etapa.cita', c.etapa.cita, { max: 240, label: 'Cita del roadmap', ph: '[ROADMAP VIDEO | STAGE 3 | 00:12:40]' })}</label>
        <label class="sal-f"><span class="lbl">Qué dato falta</span>${f.txt('etapa.falta', c.etapa.falta, { max: 240, label: 'Qué dato falta para ubicarla', ph: 'Solo si no calza clara' })}</label></div>` : ''}
    </section>

    <section class="sal-sec sal-restr" data-fn="${c.restriccion.funcion}" aria-label="La restricción">
      <h3 class="sal-t">${ico('target', 16)} La restricción <span class="mut sm">una sola: la que hoy frena el crecimiento</span></h3>
      <div class="sal-restr-fn" data-r="fn"></div>
      <div class="${editable ? 'sal-form' : 'sal-restr-txt'}">
        <label class="sal-f"><span class="lbl">Función</span>${f.sel('restriccion.funcion', FUNCIONES.map((x) => [x, x]), c.restriccion.funcion, { vacio: '— sin definir', label: 'Función de la restricción', sd: SD_RESTRICCION })}</label>
        <label class="sal-f sal-f-ancho"><span class="lbl">Por qué</span>${f.area('restriccion.por_que', c.restriccion.por_que, { max: 400, label: 'Por qué es la restricción', ph: 'Qué evidencia dice que aquí se traba', sd: 'sale de la entrevista y de las 12 palancas' })}</label>
        <label class="sal-f"><span class="lbl">Cita</span>${f.txt('restriccion.cita', c.restriccion.cita, { max: 240, label: 'Cita de la restricción', ph: '[LIBRO | capítulo | pág. PDF N]' })}</label></div>
    </section>

    <fieldset class="sal-sec sal-cap" data-cap="${c.capacidad}" ${editable ? '' : 'disabled'}>
      <legend class="sal-t">${ico('zap', 16)} Capacidad vs demanda <span class="mut sm">¿la empresa aguanta más demanda?</span></legend>
      <div class="sal-cap-barra">${CAPACIDAD.map((x) => html`<label class="sal-cap-op" data-id="${x.id}"><input type="radio" name="sal-cap" value="${x.id}" data-c="capacidad" ${c.capacidad === x.id ? 'checked' : ''}><span class="sal-cap-n">${x.nombre}</span><span class="sal-cap-q mut sm">${x.que}</span></label>`)}</div>
      <div data-r="cap"></div>
    </fieldset>

    <section class="sal-sec sal-score" aria-label="Scorecard de los 4 sistemas">
      <h3 class="sal-t">${ico('radar', 16)} Scorecard de los 4 sistemas <span class="mut sm">12 palancas, puntaje de 1 a 5</span></h3>
      <p class="sal-nota mut sm">Growth OS no se puntúa aquí: se lee de Strategy. Sin fuente no hay puntaje: va ${SIN_DATOS}, nunca 0.</p>
      <div class="sal-score-cols">
        <figure class="sal-radar"><div data-r="radar"></div><figcaption class="mut sm">Promedio de las palancas con dato. Un sistema sin dato no se dibuja (no se cuenta como 0).</figcaption></figure>
        <div class="sal-sistemas">${SISTEMAS_IDS.map((s) => html`<article class="sal-sis" data-s="${s}">
          <header class="sal-sis-h"><h4>${SISTEMAS[s].nombre}</h4><span class="sal-sis-para mut sm">${SISTEMAS[s].para}</span><span class="sal-sis-prom" data-r="sis" data-s="${s}"></span></header>
          <div class="sal-pals">${c.sistemas[s].map((p, i) => html`<div class="sal-pal" data-s="${s}" data-i="${i}">
            <div class="sal-pal-h"><b class="sal-pal-n">${SISTEMAS[s].palancas[i].nombre}</b><span class="sal-pal-mide mut sm">${SISTEMAS[s].palancas[i].mide}</span></div>
            <label class="sal-pal-p"><span class="sr-only">Puntaje de ${SISTEMAS[s].palancas[i].nombre}</span>${f.sel(`sistemas.${s}.${i}.puntaje`, PUNTAJES, p.puntaje, { num: 1, vacio: '— sin datos', label: `Puntaje de ${SISTEMAS[s].palancas[i].nombre}` })}</label>
            <div class="sal-pal-est" data-r="pal" data-s="${s}" data-i="${i}"></div>
            <label class="sal-pal-e"><span class="sr-only">Evidencia de ${SISTEMAS[s].palancas[i].nombre}</span>${f.txt(`sistemas.${s}.${i}.evidencia`, p.evidencia, { max: 300, label: `Evidencia de ${SISTEMAS[s].palancas[i].nombre}`, ph: 'Qué dato lo sostiene' })}</label>
            <label class="sal-pal-f"><span class="sr-only">Fuente de ${SISTEMAS[s].palancas[i].nombre}</span>${f.txt(`sistemas.${s}.${i}.fuente`, p.fuente, { max: 200, label: `Fuente de ${SISTEMAS[s].palancas[i].nombre}`, ph: 'De dónde sale el dato' })}</label>
          </div>`)}</div></article>`)}</div>
      </div>
    </section>

    <section class="sal-sec sal-foda" aria-label="FODA">
      <h3 class="sal-t">${ico('list', 16)} FODA <span class="mut sm">corto: una idea por línea</span></h3>
      <div class="sal-foda-grid">${FODA.map(([k, nombre]) => html`<div class="sal-foda-c" data-k="${k}"><h4>${nombre}</h4>
        ${editable ? html`<textarea class="in" data-c="@foda.${k}" rows="3" aria-label="${nombre}" placeholder="Una por línea">${c.foda[k].join('\n')}</textarea>`
          : c.foda[k].length ? html`<ul>${c.foda[k].map((x) => html`<li>${x}</li>`)}</ul>` : html`<p class="sal-sd">${SIN_DATOS}: sale de la entrevista y de las 12 palancas</p>`}</div>`)}</div>
    </section>

    <section class="sal-sec sal-prio" aria-label="Qué se arregla primero">
      <h3 class="sal-t">${ico('list-checks', 16)} Qué se arregla primero <span class="mut sm">3 prioridades, cada una con el número que mueve</span></h3>
      <ol class="sal-prio-lista">${[0, 1, 2].map((i) => html`<li class="sal-prio-f" data-i="${i}"><span class="sal-prio-n" aria-hidden="true">${i + 1}</span>
        <label class="sal-f sal-f-ancho"><span class="lbl">${['Primero', 'Segundo', 'Tercero'][i]}</span>${f.txt(`prioridades.${i}.que`, c.prioridades[i]?.que, { max: 240, label: `Prioridad ${i + 1}: qué se arregla`, ph: 'Qué se arregla', sd: 'sale de la restricción y de las palancas más bajas' })}</label>
        <label class="sal-f"><span class="lbl">Número que mueve</span>${f.txt(`prioridades.${i}.numero`, c.prioridades[i]?.numero, { max: 120, label: `Prioridad ${i + 1}: número de crecimiento`, ph: 'ventas, margen, CAC, LTV o caja: de X a Y', sd: 'ventas, margen, CAC, LTV o caja' })}</label>
        <div class="sal-prio-av" data-r="prio" data-i="${i}"></div></li>`)}</ol>
    </section>
  </div>`;
}

export const vista = {
  // El contenido inicial: vacío, salvo la etapa que Strategy ya ubicó (se lee de ahí, no se vuelve a preguntar).
  nuevo(ctx) {
    const c = vacio(), n = etapaEstrategia(estrategiaDe(ctx));
    if (n !== null) c.etapa.n = n;
    return c;
  },

  pintar(el, { contenido, editable, onCambio, ctx } = {}) {
    const c = base(contenido), es = estrategiaDe(ctx), ed = Boolean(editable), E = { c, es, editable: ed };
    mount(el, plantilla(E, campos(ed)));
    const root = el.firstElementChild, cache = new WeakMap();
    const poner = (nodo, contenidoHtml) => { const s = String(contenidoHtml); if (cache.get(nodo) !== s) { cache.set(nodo, s); mount(nodo, contenidoHtml); } };
    // Recalcula lo derivado (solo reemplaza lo que cambió, y nunca un campo editable).
    const refrescar = () => {
      for (const nodo of root.querySelectorAll('[data-r]')) { const f = REGIONES[nodo.dataset.r]; if (f) poner(nodo, f({ ...E, s: nodo.dataset.s, i: Number(nodo.dataset.i) })); }
      root.querySelector('.sal-cap').dataset.cap = c.capacidad;
      root.querySelector('.sal-restr').dataset.fn = c.restriccion.funcion;
      const entre = root.querySelector('.sal-entre'); if (entre) entre.hidden = c.etapa.n !== null;
    };
    refrescar();
    if (!ed) return;

    const especial = {
      '@entre0': () => entre(), '@entre1': () => entre(),
    };
    const entre = () => {
      const a = numeroONull(root.querySelector('[data-c="@entre0"]').value), b = numeroONull(root.querySelector('[data-c="@entre1"]').value);
      c.etapa.entre = a !== null && b !== null ? [Math.min(a, b), Math.max(a, b)] : null;
    };
    const alCambiar = (e) => {
      const t = e.target, k = t?.dataset?.c;
      if (!k || !root.contains(t)) return;
      if (k.startsWith('@foda.')) c.foda[k.slice(6)] = lineas(t.value);
      else if (especial[k]) especial[k]();
      else {
        ponerRuta(c, k, valorDe(t));
        if (k === 'etapa.n' && c.etapa.n !== null) { c.etapa.entre = null; for (const x of root.querySelectorAll('[data-c^="@entre"]')) x.value = ''; } // ubicada: ya no está «entre»
      }
      if (typeof onCambio === 'function') onCambio(limpiar(structuredClone(c)));
      refrescar();
    };
    root.addEventListener('input', alCambiar);
    root.addEventListener('change', alCambiar);
  },

  // Una línea para el Overview: etapa, restricción y capacidad.
  resumen(contenido) {
    const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {})), e = etapaDe(c.etapa.n), cap = CAPACIDAD.find((x) => x.id === c.capacidad);
    return html`<span class="sal-res"><span class="chip">${e ? `Etapa ${e.n} · ${e.nombre}` : c.etapa.entre ? `Entre las etapas ${c.etapa.entre[0]} y ${c.etapa.entre[1]}` : `Etapa: ${SIN_DATOS}`}</span><span class="chip">${c.restriccion.funcion ? `Restricción: ${c.restriccion.funcion}` : `Restricción: ${SIN_DATOS}`}</span><span class="chip" data-cap="${c.capacidad}">${cap ? `Capacidad ${cap.nombre.toLowerCase()}` : `Capacidad: ${SIN_DATOS}`}</span></span>`;
  },
};
