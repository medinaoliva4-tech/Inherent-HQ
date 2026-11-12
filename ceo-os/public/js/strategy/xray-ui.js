// Vista del Business X-Ray (herramienta business-xray de Strategy): el badge de la etapa del roadmap (con el selector que propone cualquiera que
// edite Estrategia y que SOLO el CEO confirma), la conclusión en una línea, 6 tiles de salud (estado ok, riesgo o sin datos, con su evidencia y
// su fuente), dónde está trabado el negocio y las tarjetas MUST BE TRUE · UNFAIR · GO GET de la estrategia en vivo. Existe para que tool-shell.js
// pinte el centro de la herramienta con un solo contrato (nuevo, pintar, resumen) y para que lo vacío diga «⚠️ SIN DATOS» y de dónde sale.
// Pinta con html`…` (todo se escapa), lee y escribe con inputs nativos y avisa cada cambio con el contenido completo y limpio; los avisos y el
// badge se recalculan solos sin tocar el campo donde la persona escribe. La etapa NO es parte del contenido: vive en la estrategia del cliente.
import { html, mount, ico, api, toast } from '../core.js';
import { ETAPAS, etapaLabel, etapaDe } from '../estrategia.js';
import { tarjetasAnalisis } from '../estrategia-viva-ui.js';
import { plano, SIN_DATOS } from '../consulting/marcos.js';
import { EJES, ESTADOS_EJE, TRABADO, vacio, limpiar, saludDe, ejesSinDatos } from './xray.js';

const enc = encodeURIComponent;
// «sale de la ficha» · «sale del CRM»: sin el «de el» que salen al pegar un texto que empieza con «el».
const saleDe = (x) => (/^el\s/i.test(x) ? `sale del ${String(x).slice(3)}` : `sale de ${x}`);
const SD = {
  etapa: 'la propuesta de Laya y la confirmación del CEO',
  conclusion: 'los 6 ejes de salud y la lectura de Strategy (Hormozi)',
  trabado: 'los ejes en riesgo y la lectura de Hormozi (oferta, modelo, leads o capacidad)',
  analisis: 'las conversaciones del Chat de Strategy y la Investigación del cliente',
};
const LEYENDO = 'Leyendo la estrategia del cliente…';
// Lo último que se leyó de la estrategia de cada cliente: al volver a pintar no parpadea «sin datos» mientras llega la respuesta.
const CACHE = new Map();
const ponerRuta = (obj, ruta, v) => { const p = ruta.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[ultimo] = v; };
const etapaOK = (e) => (e && Number.isInteger(Number(e.n)) && etapaDe(e.n) ? { n: Number(e.n), confirmada: Boolean(e.confirmada) } : null);

// El contenido de trabajo: el limpio, con los 6 ejes siempre presentes (los que no llegaron quedan en «sin datos»).
function base(contenido) {
  const c = limpiar(plano(contenido) ? contenido : {});
  c.salud = saludDe(c);
  return c;
}

// Los campos: un input nativo si se edita; texto plano (o ⚠️ SIN DATOS) si es de solo lectura.
function campos(editable) {
  const ro = (valor, o) => html`<span class="xr-ro" data-vacio="${valor ? 0 : 1}">${valor || (o.sd ? `${SIN_DATOS}: ${saleDe(o.sd)}` : '—')}</span>`;
  return {
    txt: (ruta, valor, o = {}) => (editable ? html`<input class="in" type="text" data-c="${ruta}" value="${valor ?? ''}" maxlength="${o.max || 200}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}" autocomplete="off">` : ro(valor, o)),
    area: (ruta, valor, o = {}) => (editable ? html`<textarea class="in" data-c="${ruta}" rows="${o.filas || 2}" maxlength="${o.max || 400}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">${valor ?? ''}</textarea>` : ro(valor, o)),
    sel: (ruta, lista, actual, o = {}) => (editable
      ? html`<select class="in" data-c="${ruta}" aria-label="${o.label || ''}"><option value="">${o.vacio || '—'}</option>${lista.map(([v, l]) => html`<option value="${v}" ${String(actual ?? '') === String(v) ? 'selected' : ''}>${l}</option>`)}</select>`
      : ro(lista.find(([v]) => String(v) === String(actual ?? ''))?.[1] || '', o)),
  };
}

// ---------- Regiones derivadas: se recalculan solas y nunca contienen un campo editable ----------
// La etapa vigente: la de la estrategia del cliente; si todavía no llegó, la que guardó este X-Ray.
const etapaVigente = ({ es, c }) => es.etapa || etapaOK(c.etapa_ref);
function insignia({ es, c }) {
  const v = etapaVigente({ es, c }), e = v ? etapaDe(v.n) : null;
  if (!e) return html`<p class="xr-badge" data-estado="falta"><span class="xr-sd">${SIN_DATOS}: ${saleDe(SD.etapa)}</span></p>`;
  return html`<p class="xr-badge" data-estado="${v.confirmada ? 'confirmada' : 'propuesta'}"><b class="xr-badge-n">${etapaLabel(e)}</b><span class="chip xr-chip" data-confirmada="${v.confirmada ? 1 : 0}">${v.confirmada ? 'Confirmada por el CEO' : 'Propuesta · sin confirmar'}</span></p>`;
}
// Lo que propone Laya (solo se muestra; el CEO confirma). Con permiso de edición se puede tomar como la etapa a elegir.
function propuesta({ es, editable, S }) {
  const p = es.propuesta, e = p && p.estado === 'listo' && p.n != null ? etapaDe(p.n) : null;
  if (e) {
    const prob = Number.isFinite(p.prob) ? ` · ${Math.round(p.prob * 100)}%` : '';
    return html`<p class="xr-prop"><span class="chip xr-chip">Laya propone${prob}</span> <b>${etapaLabel(e)}</b>${p.why ? html` <span class="mut sm">${p.why}</span>` : ''}${editable && S.sel !== e.n ? html` <button type="button" class="btn ghost sm xr-usar" data-act="xr-usar" data-n="${e.n}" ${S.ocupado ? 'disabled' : ''}>Usar esta</button>` : ''}</p>`;
  }
  if (p?.estado === 'pendiente') return html`<p class="mut sm">Laya quedó pendiente: sin el puente encendido, lo resuelve Claude Code.</p>`;
  return es.cargado ? html`<p class="mut sm">Laya la propone con lo que hay en el repo del cliente. El CEO la confirma.</p>` : '';
}
// El detalle de la etapa elegida y su botón: el CEO la confirma; quien solo edita Strategy la propone (el servidor lo cuida igual).
function accionEtapa({ es, c, editable, esCeo, S }) {
  const v = etapaVigente({ es, c }), n = S.sel ?? v?.n ?? es.propuesta?.n ?? null, e = n === null ? null : etapaDe(n);
  if (!e) return html`<p class="xr-sd">${SIN_DATOS}: ${saleDe(SD.etapa)}</p>`;
  const detalle = html`<p class="xr-etapa-det"><i>«${e.traba}»</i> ${e.es}</p>`;
  if (!editable) return detalle;
  const yaConfirmada = Boolean(es.etapa?.confirmada) && es.etapa.n === n, yaPropuesta = Boolean(es.etapa) && es.etapa.n === n;
  if (esCeo) return html`${detalle}${yaConfirmada ? '' : html`<div class="xr-etapa-bt"><button type="button" class="btn sm" data-act="xr-confirmar" data-n="${n}" ${S.ocupado ? 'disabled' : ''}>${ico('check', 13)} Confirmar ${etapaLabel(e)}</button><span class="mut sm">Solo tú la confirmas.</span></div>`}`;
  if (es.etapa?.confirmada) return html`${detalle}<p class="mut sm">La confirmó el CEO: solo él la cambia.</p>`;
  return html`${detalle}${yaPropuesta ? '' : html`<div class="xr-etapa-bt"><button type="button" class="btn sm" data-act="xr-proponer" data-n="${n}" ${S.ocupado ? 'disabled' : ''}>Proponer ${etapaLabel(e)}</button><span class="mut sm">El CEO la confirma.</span></div>`}`;
}
// Lo que falta o se contradice en un eje: sin evidencia no hay «bien» ni «riesgo»; un eje sin datos dice de dónde sale.
function avisoEje({ c, editable, i }) {
  const x = c.salud[i];
  if (!ejesSinDatos(c).some((y) => y.eje === x.eje)) return '';
  if (x.estado !== 'falta') return html`<p class="xr-sd">Falta la evidencia: sin ella el eje va en «Sin datos»</p>`;
  return editable ? html`<p class="xr-sd">${SIN_DATOS}: ${saleDe(EJES[i].sale_de)}</p>` : '';
}
// Los ejes en riesgo, para decidir dónde está trabado.
function enRiesgo({ c }) {
  const r = c.salud.filter((x) => x.estado === 'riesgo').map((x) => EJES.find((e) => e.id === x.eje)?.nombre).filter(Boolean);
  return r.length ? html`<p class="xr-riesgos">En riesgo: <b>${r.join(', ')}</b></p>` : '';
}
// Las tarjetas MBT / UNFAIR / GO GET: salen de la estrategia en vivo (se llenan desde el Chat de Strategy), aquí solo se leen.
function analisis({ es }) {
  if (!es.cargado && !es.viva) return html`<p class="mut sm">${LEYENDO}</p>`;
  return tarjetasAnalisis(es.viva?.analisis, { vacio: html`${SIN_DATOS}: ${saleDe(SD.analisis)}` });
}
const REGIONES = { badge: insignia, prop: propuesta, eacc: accionEtapa, tile: avisoEje, riesgo: enRiesgo, ana: analisis };

// ---------- La vista ----------
function tile(e, x, i, f, editable) {
  const nombreEstado = (id) => ESTADOS_EJE.find((s) => s.id === id)?.nombre || id;
  return html`<article class="xr-tile" data-eje="${e.id}" data-estado="${x.estado}" data-sin="0">
    <header class="xr-tile-h"><h4>${e.nombre}</h4><span class="mut sm">${e.mide}</span></header>
    ${editable
      ? html`<fieldset class="xr-estado"><legend class="sr-only">Estado de ${e.nombre}</legend>${ESTADOS_EJE.map((s) => html`<label class="xr-op" data-estado="${s.id}"><input type="radio" name="xr-est-${e.id}" value="${s.id}" data-c="salud.${i}.estado" ${x.estado === s.id ? 'checked' : ''}><span>${s.nombre}</span></label>`)}</fieldset>`
      : html`<span class="chip xr-estado-chip" data-estado="${x.estado}">${nombreEstado(x.estado)}</span>`}
    <label class="xr-f"><span class="lbl">Evidencia</span>${f.area(`salud.${i}.evidencia`, x.evidencia, { max: 300, filas: 3, label: `${e.nombre}: evidencia`, ph: 'El dato que lo prueba: una cifra, un archivo o lo que dijo el cliente', sd: e.sale_de })}</label>
    <label class="xr-f"><span class="lbl">Fuente</span>${f.txt(`salud.${i}.fuente`, x.fuente, { max: 200, label: `${e.nombre}: fuente`, ph: 'Archivo, cifra del cliente o [dice el cliente, sin verificar]' })}</label>
    <div class="xr-tile-av" data-r="tile" data-i="${i}"></div></article>`;
}

function plantilla({ c, es, S }, f, editable) {
  const n0 = S.sel ?? etapaVigente({ es, c })?.n ?? es.propuesta?.n ?? '';
  return html`<div class="xr" data-editable="${editable ? 1 : 0}">
    <section class="xr-sec xr-etapa" aria-label="La etapa">
      <h3 class="xr-t">${ico('compass', 16)} La etapa <span class="mut sm">del 0 al 9 del roadmap</span></h3>
      <div data-r="badge"></div>
      <div data-r="prop"></div>
      ${editable ? html`<label class="xr-f xr-etapa-f"><span class="lbl">Etapa</span><select class="in" data-e="sel" aria-label="Etapa del roadmap"><option value="">— sin ubicar</option>${ETAPAS.map((e) => html`<option value="${e.n}" ${String(n0) === String(e.n) ? 'selected' : ''}>${etapaLabel(e)}</option>`)}</select></label>` : ''}
      <div data-r="eacc"></div>
    </section>

    <section class="xr-sec xr-concl" aria-label="Conclusión">
      <h3 class="xr-t">${ico('eye', 16)} Conclusión <span class="mut sm">cómo está el negocio hoy, en una línea</span></h3>
      <label class="xr-f xr-f-ancho"><span class="sr-only">Conclusión</span>${f.txt('conclusion', c.conclusion, { max: 400, label: 'Conclusión en una línea', ph: 'Una sola frase', sd: SD.conclusion })}</label>
    </section>

    <section class="xr-sec xr-salud" aria-label="Salud del negocio">
      <h3 class="xr-t">${ico('target', 16)} Salud del negocio <span class="mut sm">6 ejes: bien, riesgo o sin datos. Sin evidencia no hay «bien» ni «riesgo»</span></h3>
      <div class="xr-tiles">${EJES.map((e, i) => tile(e, c.salud[i], i, f, editable))}</div>
    </section>

    <section class="xr-sec xr-trabado" aria-label="Dónde está trabado">
      <h3 class="xr-t">${ico('triangle-alert', 16)} ¿Dónde está trabado? <span class="mut sm">uno solo</span></h3>
      <div class="xr-trabado-g">
        <label class="xr-f"><span class="lbl">Está trabado en</span>${f.sel('trabado', TRABADO.map((t) => [t.id, t.nombre]), c.trabado, { vacio: '— sin marcar', label: 'Dónde está trabado', sd: SD.trabado })}</label>
        <label class="xr-f xr-f-ancho"><span class="lbl">Por qué</span>${f.area('porque', c.porque, { max: 400, filas: 2, label: 'Por qué está trabado ahí', ph: 'Una o dos frases con el dato que lo muestra', sd: SD.trabado })}</label>
      </div>
      <div data-r="riesgo"></div>
    </section>

    <section class="xr-sec xr-analisis" aria-label="MUST BE TRUE, UNFAIR y GO GET">
      <h3 class="xr-t">${ico('list', 16)} MUST BE TRUE · UNFAIR · GO GET <span class="mut sm">de la estrategia en vivo: se llenan desde el Chat de Strategy</span></h3>
      <div data-r="ana"></div>
    </section>

    <div class="xr-pie"><button type="button" class="btn ghost xr-huecos" disabled title="Llega en la Fase 3e">${ico('arrow-right', 14)} Enviar huecos al Opportunity Map</button><span class="mut sm">Llega en la Fase 3e</span></div>
  </div>`;
}

function pintarXray(el, args = {}) {
  const { contenido, editable, onCambio, ctx, me, slug } = args, ed = Boolean(editable), esCeo = me?.role === 'ceo';
  const c = base(contenido);
  // La estrategia del cliente: la etapa y sus tarjetas se leen de ahí. Primero lo último que se vio (o lo del contexto); luego llega lo fresco.
  const previo = slug ? CACHE.get(slug) : null;
  const es = previo ? { ...previo } : { etapa: etapaOK(ctx?.estrategia?.etapa), propuesta: null, viva: null, cargado: false };
  const S = { sel: null, ocupado: false }; // sel: la etapa elegida en el selector, mientras no sea la vigente
  const E = { c, es, S, editable: ed, esCeo };
  mount(el, plantilla(E, campos(ed), ed));
  const root = el.firstElementChild, cache = new WeakMap();
  const poner = (nodo, contenidoHtml) => { const s = String(contenidoHtml); if (cache.get(nodo) !== s) { cache.set(nodo, s); mount(nodo, contenidoHtml); } };
  const dato = (x) => x.value === '' ? null : Number(x.value);
  // El selector de etapa vive fuera de las regiones (para no perder el foco): se alinea a mano con lo vigente y con lo que dice el servidor.
  const alinearSelector = () => {
    const sel = root.querySelector('[data-e="sel"]'); if (!sel) return;
    const n = S.sel ?? etapaVigente({ es, c })?.n ?? es.propuesta?.n ?? '';
    if (sel.value !== String(n)) sel.value = String(n);
    sel.disabled = S.ocupado || (!esCeo && Boolean(es.etapa?.confirmada));
  };
  const refrescar = () => {
    for (const nodo of root.querySelectorAll('[data-r]')) { const f = REGIONES[nodo.dataset.r]; if (f) poner(nodo, f({ ...E, i: Number(nodo.dataset.i) })); }
    const sin = new Set(ejesSinDatos(c).map((x) => x.eje));
    root.querySelectorAll('.xr-tile').forEach((t, i) => { t.dataset.estado = c.salud[i].estado; t.dataset.sin = sin.has(c.salud[i].eje) ? '1' : '0'; });
    alinearSelector();
  };
  const sale = () => limpiar(structuredClone(c));
  refrescar();

  const guardarCache = () => { if (slug) CACHE.set(slug, { etapa: es.etapa, propuesta: es.propuesta, viva: es.viva, cargado: true }); };
  if (slug) {
    api(`estrategia/${enc(slug)}`).then((r) => {
      if (!root.isConnected) return;
      if (!S.ocupado) es.etapa = etapaOK(r?.etapa);
      es.propuesta = plano(r?.propuesta) ? r.propuesta : null; es.viva = plano(r?.viva) ? r.viva : {}; es.cargado = true;
      guardarCache(); refrescar();
    }).catch(() => { if (!root.isConnected) return; es.cargado = true; refrescar(); }); // sin permiso o sin red: queda lo del contexto y las tarjetas dicen de dónde salen
  }

  // Proponer o confirmar la etapa: la misma ruta y el mismo cuerpo que el Diagnóstico de hoy (screens/strategy.js). El servidor decide: 403 si no es el CEO.
  const guardarEtapa = async (n, confirmar) => {
    if (S.ocupado || !slug || !etapaDe(n)) return;
    if (confirmar && !esCeo) return;
    S.ocupado = true; refrescar();
    try {
      const r = await api(`estrategia/${enc(slug)}/etapa`, { method: 'PUT', body: { n, confirmar, fuente: es.propuesta?.n === n ? 'laya' : 'manual' } });
      es.etapa = etapaOK(r?.etapa) || { n, confirmada: confirmar && esCeo }; S.sel = null; guardarCache();
      try { window.dispatchEvent(new Event('os:estrategia')); } catch {} // el hero del workspace repinta su chip de etapa
      // La etapa vive en la estrategia, no en el X-Ray: aquí solo se anota como referencia (y la persona guarda el X-Ray si quiere dejarla).
      if (root.isConnected) { c.etapa_ref = { ...es.etapa }; if (typeof onCambio === 'function') onCambio(sale()); }
      toast(confirmar ? 'Etapa confirmada' : 'Etapa propuesta');
    } catch (e) { toast(e?.message || 'No se pudo guardar la etapa', true); } // el servidor dice por qué: 403 si no es el CEO, 409 si el Diagnóstico está aprobado
    finally { S.ocupado = false; if (root.isConnected) refrescar(); }
  };
  root.addEventListener('click', (e) => {
    const t = e.target.closest?.('[data-act]'); if (!t || !root.contains(t) || t.disabled) return;
    const n = Number(t.dataset.n);
    if (t.dataset.act === 'xr-confirmar') guardarEtapa(n, true);
    else if (t.dataset.act === 'xr-proponer') guardarEtapa(n, false);
    else if (t.dataset.act === 'xr-usar') { S.sel = n; refrescar(); }
  });
  root.addEventListener('change', (e) => { // el selector de etapa no toca el contenido: solo elige cuál proponer o confirmar
    if (e.target?.dataset?.e !== 'sel') return;
    const n = dato(e.target); S.sel = n === null || n === etapaVigente({ es, c })?.n ? null : n; refrescar();
  });
  if (!ed) return;

  const alCambiar = (e) => {
    const t = e.target, k = t?.dataset?.c;
    if (!k || !root.contains(t)) return;
    ponerRuta(c, k, t.value);
    if (typeof onCambio === 'function') onCambio(sale());
    refrescar();
  };
  root.addEventListener('input', alCambiar);
  root.addEventListener('change', alCambiar);
}

export const vista = {
  // El contenido inicial: los 6 ejes en «sin datos», y la etapa que Strategy ya ubicó (se lee de ahí, no se vuelve a preguntar).
  nuevo(ctx) {
    const c = vacio(), e = etapaOK(ctx?.estrategia?.etapa);
    if (e) c.etapa_ref = e;
    return c;
  },

  pintar: pintarXray,

  // Una línea para el Overview: dónde está trabado y la conclusión.
  resumen(contenido) {
    const c = limpiar(plano(contenido) ? contenido : {}), t = TRABADO.find((x) => x.id === c.trabado);
    return html`<span class="xr-res"><span class="chip">${t ? `Trabado: ${t.nombre.toLowerCase()}` : `Trabado: ${SIN_DATOS}`}</span> ${c.conclusion ? html`<span class="xr-res-c">${c.conclusion}</span>` : html`<span class="xr-sd">${SIN_DATOS}: falta la conclusión</span>`}</span>`;
  },
};
