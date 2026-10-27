// Growth Roadmap Builder (herramienta growth-roadmap de Strategy). NO usa el Tool Shell: su casa es la estrategia en vivo (viva.roadmap),
// no un entregable. Pinta el roadmap como timeline (filas por área, columnas T1 a T4, con las filas editables), un toggle al plan de 90 días
// de hoy (viva.roadmap.filas, de solo lectura), la fila de hitos y las acciones: Guardar (PUT estrategia/<slug>/viva), Generar con IA (la
// persona revisa y guarda), Aprobar y Reabrir (solo el CEO, por la ruta de siempre), Convertir en tareas, Enviar a Plan del mes (solo con la
// estrategia aprobada) y mandar los hitos a las metas del cliente (accounts.goals). Aprobada la estrategia, todo queda en solo lectura.
// Pinta con html`…` (todo se escapa; lo que dice un modelo pasa por limpiar() de roadmap.js y nunca por raw()). Lo vacío dice «⚠️ SIN DATOS».
import { html, raw, mount, api, col, ico, toast, confirmAsk, ask, acts, skel, techDetail, fdate, fdateLong, $ } from '../core.js';
import { canEdit } from '../roleviews.js';
import { herramientaDe, rutaHerramienta } from '../herramientas.js';
import { etapaDe, etapaLabel } from '../estrategia.js';
import { leerBloques } from '../estrategia-viva.js';
import { armarCtx, correrIA } from '../ia-herramienta.js';
import { goalsOf } from '../goals.js';
import { alcanceConsulting, consultingAbierto, leerTarjetas } from '../llm/modos.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { BLOQUE, AREAS_RM_INFO, TRIMESTRES, TRIMESTRE_NOMBRE, MAX_ITEMS, MAX_HITOS, areaInfo, limpiar, limpiarItems, limpiarHitos, tareasMarcadas, aMetas, claveHito, faltas, aMd, prompt, resumenTexto } from './roadmap.js';

const K_VISTA = 'os.grm.vista';
const MAX_TAREAS_LOTE = 60; // tareas por tanda: se crean una por una
const MESES_PLAN = ['Mes 1–3', '4–6', '7–9', '10–12'];
const ENTRADAS = ['business-xray', 'offer-architect', 'opportunity-map']; // lo aprobado que alimenta al roadmap
const enc = encodeURIComponent;
const clon = (x) => JSON.parse(JSON.stringify(x));
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const reciente = (d) => String(d._meta?.updated_at || d._meta?.created_at || '');
const esNumero = (x) => typeof x === 'number' && Number.isFinite(x);
let seq = 0;
const nuevoId = (usados, pre) => { let id; do { id = `${pre}${Date.now().toString(36).slice(-5)}${(seq++).toString(36)}`; } while (usados.some((x) => x.id === id)); return id; };

// host: dónde se monta · me: quien mira · slug/b: el cliente · alive(): ¿sigue en pantalla? · resto: lo que viene en la ruta (sin uso hoy).
export async function roadmapTool(host, { me, slug, b, alive, resto = [] } = {}) {
  mount(host, skel('pagina'));
  // La herramienta del registro, con el pedido y el bloque de roadmap.js: correrIA() los pide y el Tool Shell no entra aquí.
  const T = { id: 'growth-roadmap', ws: 'strategy', nombre: 'Growth Roadmap Builder', ...herramientaDe('growth-roadmap'), prompt, bloque: BLOQUE };
  const S = { data: null, items: [], hitos: [], base: { items: '[]', hitos: '[]' }, vista: 'timeline', gen: null, ocupado: false, k: {} };
  try { if (localStorage.getItem(K_VISTA) === 'plan') S.vista = 'plan'; } catch {}
  const puedeTareas = Boolean(me?.areas?.includes('work') || me?.areas?.includes('operations'));
  const chatRuta = rutaHerramienta('strategy', slug, 'growth-roadmap', ['chat']);
  let root = null;

  // ---------- Lo que hay y lo que se puede hacer ----------
  const aprobada = () => Boolean(S.data?.vivaAprobada);
  const nivelId = () => S.data?.nivel?.id || null;
  const editable = () => Boolean(S.data?.puede?.editar) && !aprobada();
  const itemsLimpios = () => limpiarItems(S.items);
  const sucio = () => JSON.stringify(itemsLimpios()) !== S.base.items || JSON.stringify(limpiarHitos(S.hitos)) !== S.base.hitos;
  const faltasAhora = () => faltas({ items: itemsLimpios(), hitos: limpiarHitos(S.hitos), filas: S.data?.viva?.roadmap?.filas }, { nivelId: nivelId() });
  const consultingOk = () => consultingAbierto(alcanceConsulting(S.data?.nivel, S.data?.ficha));
  const hayCambio = (id, key) => { const k = JSON.stringify(key); if (S.k[id] === k) return false; S.k[id] = k; return true; };
  // La estrategia que leyó el servidor se vuelve el estado de la pantalla (lo guardado es la base contra la que se mide «Sin guardar»).
  function tomar(d) {
    S.data = d;
    const rm = d.viva?.roadmap || {};
    S.items = limpiarItems(rm.items); S.hitos = limpiarHitos(rm.hitos);
    S.base = { items: JSON.stringify(S.items), hitos: JSON.stringify(S.hitos) };
  }
  const leer = () => api(`estrategia/${enc(slug)}`);

  // ---------- Errores y envoltura de acciones ----------
  function falla(e) {
    if (e?.name === 'AbortError') return;
    if (e?.status === 409 && e.code === 'APROBADO') { toast(e.message, true); recargar(); return; }
    toast(e?.message || 'No se pudo completar. Inténtalo de nuevo.', true);
  }
  const haz = async (fn) => {
    if (S.ocupado) return;
    S.ocupado = true; pintarActs();
    try { await fn(); } catch (e) { if (alive()) falla(e); }
    if (!alive()) return;
    S.ocupado = false; pintarActs();
  };
  async function recargar() {
    try { tomar(await leer()); } catch (e) { if (alive()) toast(e.message, true); return; }
    if (alive()) pintarTodo();
  }

  // ---------- Pintar ----------
  function pintarHead() {
    const el = $('#grm-head', root); if (!el) return;
    const d = S.data, e = d.etapa?.n != null ? etapaDe(d.etapa.n) : null, su = sucio();
    if (!hayCambio('head', [d.nivel?.nombre, aprobada(), su, e?.n, d.etapa?.confirmada])) return;
    mount(el, html`<header class="grm-head"><div class="grm-head-t"><h2>${ico('rocket', 16)} ${T.nombre}</h2><span class="grm-cli">${b?.name || d.nombre || slug}</span></div>
      <div class="grm-head-m"><span class="chip grm-estado" data-aprobada="${aprobada() ? 1 : 0}">${aprobada() ? 'Estrategia aprobada' : 'En construcción'}</span>
        <span class="chip">${d.nivel?.nombre || 'Sin ficha de oferta'}</span>
        <span class="chip">${e ? `${etapaLabel(e)}${d.etapa.confirmada ? '' : ' · sin confirmar'}` : `Etapa: ${SIN_DATOS}`}</span>
        ${su ? html`<span class="chip grm-sucio">Sin guardar</span>` : ''}</div></header>`);
  }
  function pintarBanner() {
    const el = $('#grm-banner', root); if (!el) return;
    const msg = aprobada() ? 'La estrategia está aprobada: el CEO la reabre para cambiarla.' : !S.data.puede?.editar ? 'Solo lectura: tu perfil lo ve, pero no lo cambia.' : '';
    mount(el, msg ? html`<p class="grm-aviso" role="status" data-aprobada="${aprobada() ? 1 : 0}">${ico('lock', 15)} ${msg}</p>` : '');
  }
  function pintarActs() {
    const el = $('#grm-acts', root); if (!el) return;
    const d = S.data, esc = editable(), su = sucio(), fa = faltasAhora(), n = itemsLimpios().length, nh = limpiarHitos(S.hitos).length, corriendo = S.gen?.fase === 'corriendo';
    const metas = canEdit(me, 'clients') && nh > 0;
    if (!hayCambio('acts', [esc, aprobada(), su, fa, n, nh, S.ocupado, corriendo, Boolean(d.puede?.aprobar), metas])) return;
    const btn = (act, icono, txt, { primario = false, off = false, tip = '' } = {}) => html`<button type="button" class="btn ${primario ? '' : 'ghost'} sm grm-act" data-act="grm-${act}" title="${tip}" ${off || S.ocupado ? raw('disabled') : ''}>${ico(icono, 14)} ${txt}</button>`;
    const enlace = (href, icono, txt, primario = false) => html`<a class="btn ${primario ? '' : 'ghost'} sm grm-act" href="${href}">${ico(icono, 14)} ${txt}</a>`;
    const g1 = [esc ? btn('generar', 'sparkles', 'Generar con IA', { primario: true, off: corriendo }) : '', esc ? btn('guardar', 'check', 'Guardar', { off: !su, tip: su ? '' : 'No hay cambios que guardar' }) : '', esc && su ? btn('descartar', 'x', 'Descartar cambios') : ''];
    const ceo = d.puede?.aprobar ? (aprobada() ? btn('reabrir', 'refresh-cw', 'Reabrir la estrategia')
      : btn('aprobar', 'badge-check', 'Aprobar la estrategia', { primario: true, off: fa.length > 0 || su, tip: su ? 'Guarda tus cambios antes de aprobar' : fa.length ? `No se puede aprobar. Falta: ${fa.join(' · ')}` : 'Solo el CEO aprueba' })) : '';
    const salida = [
      puedeTareas && n ? btn('tareas', 'list-checks', 'Convertir en tareas') : '',
      metas ? btn('metas', 'send', 'Hitos → metas del cliente') : '',
      aprobada() ? enlace(rutaHerramienta('marketing', slug, 'content-strategy-studio'), 'arrow-right', 'Enviar a Plan del mes', true) : '',
      btn('exportar', 'download', 'Exportar'), btn('copiar', 'copy', 'Copiar'),
      enlace(chatRuta, 'chat-ia', 'Chat de Strategy'),
    ];
    mount(el, html`<div class="grm-grp">${g1}</div>${ceo ? html`<div class="grm-grp">${ceo}</div>` : ''}<div class="grm-grp">${salida}</div>`);
  }
  function pintarFaltas() {
    const el = $('#grm-faltas', root); if (!el) return;
    const fa = aprobada() ? [] : faltasAhora();
    if (!hayCambio('faltas', fa)) return;
    mount(el, fa.length ? html`<h3>Para aprobar</h3><ul class="grm-fl">${fa.map((x) => html`<li class="grm-sd">${x}</li>`)}</ul>` : '');
  }
  // La fila de una tarjeta: editable (título, área y trimestre) o de solo lectura. Las tareas de la fila se ven, no se editan aquí.
  const extras = (x) => html`${x.oportunidad_id ? html`<span class="chip sm2 grm-opp-c" title="Viene del Opportunity Map">Oportunidad ${x.oportunidad_id}</span>` : ''}${x.tareas?.length ? html`<details class="grm-ts"><summary>${plural(x.tareas.length, 'tarea', 'tareas')}</summary><ul>${x.tareas.map((t) => html`<li>${t.title}${t.due ? html` <span class="mut sm">· ${fdate(t.due)}</span>` : ''}</li>`)}</ul></details>` : ''}`;
  const item = (x, ed) => (ed
    ? html`<li class="grm-it" data-id="${x.id}"><input class="in grm-it-t" type="text" data-f="titulo" data-id="${x.id}" maxlength="160" value="${x.titulo}" placeholder="Un resultado, no una actividad suelta" aria-label="Título de la fila" autocomplete="off">
        <div class="grm-it-m"><select class="in" data-f="area" data-id="${x.id}" aria-label="Área de la fila">${AREAS_RM_INFO.map((a) => html`<option value="${a.id}" ${a.id === x.area ? raw('selected') : ''}>${a.nombre}</option>`)}</select>
          <select class="in" data-f="trimestre" data-id="${x.id}" aria-label="Trimestre de la fila">${TRIMESTRES.map((t) => html`<option value="${t}" ${t === x.trimestre ? raw('selected') : ''}>${t}</option>`)}</select>
          <button type="button" class="btn ghost xs grm-x" data-act="grm-quitar" data-id="${x.id}" aria-label="Quitar esta fila">${ico('x', 14)}</button></div>${extras(x)}</li>`
    : html`<li class="grm-it" data-id="${x.id}"><p class="grm-it-ro">${x.titulo}</p>${extras(x)}</li>`);
  function timeline() {
    const ed = editable(), hay = itemsLimpios().length > 0, fuera = !consultingOk();
    const celda = (a, t) => {
      const xs = S.items.filter((x) => x.area === a.id && x.trimestre === t);
      return html`<td class="grm-celda" data-area="${a.id}" data-t="${t}">${xs.length ? html`<ul class="grm-its">${xs.map((x) => item(x, ed))}</ul>` : ''}${ed ? html`<button type="button" class="btn ghost xs grm-mas" data-act="grm-agregar" data-a="${a.id}" data-t="${t}" aria-label="Agregar una fila en ${a.nombre}, ${t}">${ico('plus', 14)}</button>` : ''}</td>`;
    };
    return html`${hay ? '' : html`<p class="grm-sd">${SIN_DATOS}: el roadmap todavía no tiene filas. Salen de «Generar con IA»${ed ? ' o de agregarlas con el + de cada celda' : ''}.</p>`}
      <div class="grm-sc"><table class="grm-grid" aria-label="Roadmap por área y trimestre">
        <thead><tr><td><span class="sr-only">Área</span></td>${TRIMESTRES.map((t) => html`<th scope="col" data-t="${t}"><b>${t}</b><span class="mut sm">${TRIMESTRE_NOMBRE[t]}</span></th>`)}</tr></thead>
        <tbody>${AREAS_RM_INFO.map((a) => html`<tr data-area="${a.id}"><th scope="row"><b>${a.nombre}</b>${a.id === 'consulting' && fuera ? html`<span class="chip sm2 grm-fuera" title="Con el nivel contratado, Consulting va fuera del alcance: escálalo al CEO">Fuera del alcance</span>` : ''}</th>${TRIMESTRES.map((t) => celda(a, t))}</tr>`)}</tbody></table></div>`;
  }
  // El plan de 90 días de hoy (viva.roadmap.filas): la grilla ev-rm del panel de Estrategia, de solo lectura.
  function plan90() {
    const v = S.data.viva || {}, rm = v.roadmap || {}, filas = (Array.isArray(rm.filas) ? rm.filas : []).filter((f) => f && typeof f === 'object');
    const e = S.data.etapa?.n != null ? etapaDe(S.data.etapa.n) : null, mon = String(v.meta?.moneda || '').slice(0, 4);
    const metas = Array.isArray(rm.hitos) && rm.hitos.some(esNumero) ? Array.from({ length: 4 }, (_, i) => (esNumero(rm.hitos[i]) ? `${mon}${Number(rm.hitos[i]).toLocaleString('en-US')}` : '')) : null;
    return html`${e ? html`<p class="grm-etapa"><b>${etapaLabel(e)}</b> · ${e.es}</p>` : html`<p class="grm-sd">${SIN_DATOS}: la etapa sale del Business X-Ray de Strategy</p>`}
      ${filas.length ? html`<div class="grm-sc"><table class="grm-grid grm-90" aria-label="Plan de 90 días">
        <thead><tr><td><span class="sr-only">Área</span></td>${MESES_PLAN.map((m) => html`<th scope="col">${m}</th>`)}</tr></thead>
        <tbody>${filas.map((f) => html`<tr><th scope="row"><b>${f.area}</b></th>${[0, 1, 2, 3].map((i) => html`<td class="grm-celda">${f.celdas?.[i] || ''}</td>`)}</tr>`)}
          ${metas ? html`<tr class="grm-meta"><th scope="row"><b>Meta</b></th>${metas.map((m) => html`<td class="grm-celda"><b>${m}</b></td>`)}</tr>` : ''}</tbody></table></div>`
        : html`<p class="grm-sd">${SIN_DATOS}: el plan de 90 días sale de «✦ Agregar roadmap» en el Chat de Strategy. <a href="${chatRuta}">Abrir el Chat de Strategy</a></p>`}`;
  }
  function pintarCuerpo() {
    const el = $('#grm-cuerpo', root); if (!el) return;
    const sc = $('.grm-sc', el), left = sc ? sc.scrollLeft : 0, plan = S.vista === 'plan';
    mount(el, html`<div class="grm-vistas" role="group" aria-label="Qué ver">
      <button type="button" class="btn ${plan ? 'ghost' : ''} sm" data-act="grm-vista" data-v="timeline" aria-pressed="${plan ? 'false' : 'true'}">${ico('calendar', 14)} Timeline por trimestre</button>
      <button type="button" class="btn ${plan ? '' : 'ghost'} sm" data-act="grm-vista" data-v="plan" aria-pressed="${plan ? 'true' : 'false'}">${ico('target', 14)} Plan de 90 días</button></div>
      ${plan ? plan90() : timeline()}`);
    const nuevo = $('.grm-sc', el); if (nuevo && left) nuevo.scrollLeft = left;
  }
  const hito = (h, ed) => (ed
    ? html`<li class="grm-h" data-id="${h.id}"><label class="grm-f"><span class="lbl">Hito</span><input class="in" type="text" data-h="titulo" data-id="${h.id}" maxlength="120" value="${h.titulo}" placeholder="Qué se logra" aria-label="Título del hito" autocomplete="off"></label>
        <label class="grm-f"><span class="lbl">Fecha</span><input class="in" type="date" data-h="fecha" data-id="${h.id}" value="${h.fecha}" aria-label="Fecha del hito"></label>
        <label class="grm-f"><span class="lbl">Meta</span><input class="in" type="text" data-h="meta" data-id="${h.id}" maxlength="240" value="${h.meta}" placeholder="${SIN_DATOS}: sale de la meta de la estrategia" aria-label="Meta del hito" autocomplete="off"></label>
        <button type="button" class="btn ghost xs grm-x" data-act="grm-hito-quitar" data-id="${h.id}" aria-label="Quitar este hito">${ico('x', 14)}</button></li>`
    : html`<li class="grm-h" data-id="${h.id}"><b>${h.titulo}</b><span>${h.fecha ? fdateLong(h.fecha) : html`<span class="grm-sd">${SIN_DATOS}: sin fecha</span>`}</span><span>${h.meta || html`<span class="grm-sd">${SIN_DATOS}: sale de la meta de la estrategia</span>`}</span></li>`);
  function pintarHitos() {
    const el = $('#grm-hitos', root); if (!el) return;
    const ed = editable(), hs = S.hitos, viejo = Array.isArray(S.data.viva?.roadmap?.hitos) && S.data.viva.roadmap.hitos.some(esNumero);
    mount(el, html`<div class="grm-sec-h"><h3>${ico('target', 16)} Hitos <span class="mut sm">la meta de cada tramo del roadmap</span></h3></div>
      ${hs.length ? html`<ol class="grm-hs">${hs.map((h) => hito(h, ed))}</ol>` : html`<p class="grm-sd">${SIN_DATOS}: los hitos salen de la meta de la estrategia y de «Generar con IA».</p>`}
      ${viejo && (ed || hs.length) ? html`<p class="mut sm">El plan de 90 días trae las metas por trimestre en el formato de antes (míralas en «Plan de 90 días»): si guardas hitos aquí, las reemplazan.</p>` : ''}
      ${ed && hs.length < MAX_HITOS ? html`<button type="button" class="btn ghost xs grm-mas" data-act="grm-hito-mas">${ico('plus', 14)} Agregar un hito</button>` : ''}`);
  }
  // Las chips del Opportunity Map: la herramienta llega en la Fase 3e; las filas que vengan de ahí llevan su oportunidad_id.
  function pintarOpp() {
    const el = $('#grm-opp', root); if (!el) return;
    mount(el, html`<span class="lbl">Opportunity Map</span><span class="chip" title="Las oportunidades aprobadas se arrastran aquí como chips">Llega en la Fase 3e</span>`);
  }

  // La generación con IA: corriendo (texto en vivo) · propuesta (a revisar) · sin bloque o error (reintentar).
  function pintarGen() {
    const g = S.gen, el = $('#grm-gen', root); if (!el) return;
    if (!g) return mount(el, '');
    const otros = html`<button type="button" class="btn ghost sm" data-act="grm-gen-claude">${ico('refresh-cw', 14)} Probar con claude.ai</button><button type="button" class="btn ghost sm" data-act="grm-pegar">Pegar la respuesta</button><button type="button" class="btn ghost sm" data-act="grm-cerrar-gen">${ico('x', 14)} Cerrar</button>`;
    if (g.fase === 'corriendo') {
      mount(el, html`<section class="grm-gen" data-fase="corriendo"><header><span class="grm-gen-t">${ico('loader-circle', 14)} Generando con IA…</span><span class="mut sm grm-paso"></span><button type="button" class="btn ghost sm" data-act="grm-parar">${ico('stop-lleno', 12)} Parar</button></header><pre class="grm-stream" aria-live="polite"></pre></section>`);
      verStream(); verPaso(); return;
    }
    if (g.fase === 'propuesta') {
      const c = g.prop.contenido, cr = g.prop.criterios || { cumple: [], falta: [] }, fa = c.items.length ? faltas(c, { nivelId: nivelId() }) : [], pisa = itemsLimpios().length;
      mount(el, html`<section class="grm-prop" data-fase="propuesta"><header><h3>${ico('sparkles', 14)} Propuesta de la IA</h3><span class="mut sm">${g.via === 'manual' ? 'Pegada a mano' : g.modelo || g.via}</span></header>
        <p class="grm-prop-res">${resumenTexto(c)}</p>
        <details class="grm-prop-d"><summary>Ver ${plural(c.items.length, 'fila', 'filas')} y ${plural(c.hitos.length, 'hito', 'hitos')}</summary>
          ${c.items.length ? html`<ul class="grm-prop-l">${c.items.map((x) => html`<li><b>${x.trimestre}</b> · ${areaInfo(x.area).nombre} · ${x.titulo}${x.tareas.length ? html` <span class="mut sm">(${plural(x.tareas.length, 'tarea', 'tareas')})</span>` : ''}</li>`)}</ul>` : ''}
          ${c.hitos.length ? html`<ul class="grm-prop-l">${c.hitos.map((h) => html`<li><b>${h.titulo}</b>${h.fecha ? ` · ${fdateLong(h.fecha)}` : ''}${h.meta ? ` · ${h.meta}` : ''}</li>`)}</ul>` : ''}</details>
        ${(cr.cumple || []).length + (cr.falta || []).length + fa.length ? html`<ul class="grm-crit">${(cr.cumple || []).map((x) => html`<li class="ok"><span aria-hidden="true">✓</span><span class="sr-only">Cumple: </span>${x}</li>`)}${[...(cr.falta || []), ...fa].map((x) => html`<li class="falta"><span aria-hidden="true">✗</span><span class="sr-only">Falta: </span>${x}</li>`)}</ul>` : ''}
        <p class="mut sm">Nada se guarda hasta que presiones Guardar${pisa && c.items.length ? `: cargarla reemplaza las ${plural(pisa, 'fila', 'filas')} de la grilla` : ''}.</p>
        <div class="grm-prop-bt"><button type="button" class="btn sm" data-act="grm-usar">${ico('check', 14)} Cargar en la grilla</button><button type="button" class="btn ghost sm" data-act="grm-generar">${ico('refresh-cw', 14)} Reintentar</button><button type="button" class="btn ghost sm" data-act="grm-cerrar-gen">Descartar</button></div></section>`);
      return;
    }
    mount(el, html`<section class="grm-gen" data-fase="${g.fase}" role="alert"><p>${g.fase === 'error' ? g.error : html`No vino el roadmap con filas por área y trimestre. Reintenta o pega la respuesta.`}</p>
      ${g.fase === 'sin-bloque' && g.texto ? html`<details><summary>Ver lo que respondió</summary><pre class="grm-stream">${g.texto}</pre></details>` : ''}
      <div class="grm-prop-bt"><button type="button" class="btn sm" data-act="grm-generar">${ico('refresh-cw', 14)} Reintentar</button>${otros}</div></section>`);
  }
  const verStream = () => { const pre = $('.grm-stream', root); if (pre && S.gen) { pre.textContent = S.gen.texto || ''; pre.scrollTop = pre.scrollHeight; } };
  const verPaso = () => { const p = $('.grm-paso', root); if (p && S.gen) p.textContent = S.gen.paso || ''; };
  function pintarTodo() {
    S.k = {};
    root.setAttribute('data-aprobada', aprobada() ? '1' : '0');
    pintarHead(); pintarBanner(); pintarActs(); pintarGen(); pintarOpp(); pintarCuerpo(); pintarHitos(); pintarFaltas();
  }
  // Algo cambió en la grilla o en los hitos: se recalcula «Sin guardar», las acciones y lo que falta para aprobar (sin tocar los campos).
  function cambio() { pintarHead(); pintarActs(); pintarFaltas(); }

  // ---------- Editar la grilla y los hitos ----------
  function agregar(area, t) {
    if (!editable() || !areaInfo(area) || !TRIMESTRES.includes(t)) return;
    if (S.items.length >= MAX_ITEMS) return toast(`El roadmap llega hasta ${MAX_ITEMS} filas.`, true);
    const id = nuevoId(S.items, 'x');
    S.items.push({ id, oportunidad_id: '', area, trimestre: t, titulo: '', tareas: [] });
    pintarCuerpo(); root.querySelector(`.grm-it-t[data-id="${id}"]`)?.focus();
  }
  function quitar(id) {
    const x = S.items.find((i) => i.id === id); if (!editable() || !x) return;
    S.items = S.items.filter((i) => i.id !== id);
    pintarCuerpo(); cambio();
    root.querySelector(`.grm-mas[data-a="${x.area}"][data-t="${x.trimestre}"]`)?.focus();
  }
  function hitoMas() {
    if (!editable() || S.hitos.length >= MAX_HITOS) return;
    const id = nuevoId(S.hitos, 'h');
    S.hitos.push({ id, titulo: '', fecha: '', meta: '' });
    pintarHitos(); root.querySelector(`[data-h="titulo"][data-id="${id}"]`)?.focus();
  }
  function hitoQuitar(id) {
    if (!editable()) return;
    S.hitos = S.hitos.filter((h) => h.id !== id);
    pintarHitos(); cambio(); root.querySelector('[data-act="grm-hito-mas"]')?.focus();
  }
  function descartar() {
    S.items = JSON.parse(S.base.items); S.hitos = JSON.parse(S.base.hitos);
    S.k = {}; pintarCuerpo(); pintarHitos(); cambio();
  }

  // ---------- Guardar: PUT estrategia/<slug>/viva con el parche { roadmap: { items, hitos } } ----------
  // La ruta no lleva versión: antes de escribir se compara con lo que hay ahora; si alguien cambió el roadmap, la persona decide.
  async function guardar() {
    if (!editable() || !sucio()) return;
    const items = itemsLimpios(), hitos = limpiarHitos(S.hitos);
    const cItems = JSON.stringify(items) !== S.base.items, cHitos = JSON.stringify(hitos) !== S.base.hitos;
    const fresco = await leer(); if (!alive()) return;
    if (fresco.vivaAprobada) { tomar(fresco); pintarTodo(); return toast('La estrategia está aprobada: el CEO la reabre para cambiarla.', true); }
    const rm = fresco.viva?.roadmap || {};
    const otro = (cItems && JSON.stringify(limpiarItems(rm.items)) !== S.base.items) || (cHitos && JSON.stringify(limpiarHitos(rm.hitos)) !== S.base.hitos);
    if (otro && !(await confirmAsk('El roadmap cambió en otro lado mientras lo editabas. ¿Lo reemplazo con lo que tienes aquí?'))) return;
    if (!alive()) return;
    // Solo viaja lo que cambió: así los hitos viejos (4 metas por trimestre) no se pisan si no se tocan.
    const parche = { roadmap: { ...(cItems ? { items } : {}), ...(cHitos ? { hitos } : {}) } };
    const r = await api(`estrategia/${enc(slug)}/viva`, { method: 'PUT', body: { parche } });
    if (!alive()) return;
    tomar({ ...fresco, viva: r.viva });
    S.k = {}; pintarTodo(); toast('Roadmap guardado');
  }

  // ---------- Generar con IA ----------
  // Lo aprobado que alimenta al roadmap (el X-Ray, la oferta y, cuando llegue, el Opportunity Map): la última versión aprobada de cada uno.
  async function entradasAprobadas() {
    const r = await api(`entregables?ws=strategy&slug=${enc(slug)}`).catch(() => null), por = new Map();
    for (const d of Array.isArray(r?.items) ? r.items : []) {
      if (d.archivado || !ENTRADAS.includes(d.tool) || !['Aprobado', 'Entregado'].includes(d.estado) || !d.aprobado?.version) continue;
      const p = por.get(d.tool); if (!p || reciente(d) > reciente(p)) por.set(d.tool, d);
    }
    return [...por.values()].map((d) => ({ deliverable_id: d.id, version: d.aprobado.version, tool: d.tool }));
  }
  // El bloque ```estrategia {"roadmap":…}``` se lee con leerBloques (el mismo parche limpio que usa el Chat); los hitos de antes (números) no cuentan.
  function leerRespuesta(txt, { via, modelo }) {
    let prop = null;
    try {
      const rm = leerBloques(txt).parche.roadmap, hitos = (Array.isArray(rm?.hitos) ? rm.hitos : []).filter((x) => x && typeof x === 'object');
      if (rm && (rm.items?.length || hitos.length)) prop = { contenido: limpiar({ items: rm.items, hitos }), criterios: leerTarjetas(txt).criterios || { cumple: [], falta: [] } };
    } catch { prop = null; }
    S.gen = prop ? { fase: 'propuesta', prop, via, modelo } : { fase: 'sin-bloque', texto: txt, via, modelo };
  }
  async function generar(preferir) {
    if (!editable() || S.gen?.fase === 'corriendo') return;
    const ctrl = new AbortController(), mio = () => S.gen?.ctrl === ctrl;
    S.gen = { fase: 'corriendo', texto: '', paso: '', ctrl };
    pintarGen(); pintarActs();
    try {
      const entradas = await entradasAprobadas(); if (!alive() || !mio()) return;
      const ctx = await armarCtx(me, { tool: T, slug, entradas }); if (!alive() || !mio()) return;
      const out = await correrIA(me, { tool: T, ctx, signal: ctrl.signal, preferir,
        onDelta: (t) => { if (!alive()) return ctrl.abort(); if (mio()) { S.gen.texto = t; verStream(); } },
        onTool: (p) => { if (mio()) { S.gen.paso = String(p || ''); verPaso(); } } });
      if (!alive() || !mio()) return;
      leerRespuesta(out.texto, out);
    } catch (e) {
      if (!alive() || !mio()) return;
      S.gen = e?.name === 'AbortError' || ctrl.signal.aborted ? null : { fase: 'error', error: e?.message || 'La IA no pudo responder' };
    }
    pintarGen(); pintarActs();
  }
  async function pegar() {
    const v = await ask('Pegar la respuesta', [{ k: 't', t: 'textarea', req: true, l: `Pega la respuesta completa de la IA, con su bloque ${BLOQUE}.` }], 'Leer');
    if (!v || !alive()) return;
    leerRespuesta(v.t, { via: 'manual', modelo: '' });
    pintarGen(); pintarActs();
  }
  // «Cargar en la grilla»: la propuesta pasa a la pantalla como cambio sin guardar; la persona la revisa y guarda.
  async function usar() {
    const g = S.gen; if (g?.fase !== 'propuesta' || !editable()) return;
    const c = g.prop.contenido, pisa = itemsLimpios().length;
    if (c.items.length && pisa && !(await confirmAsk(`Esto reemplaza las ${plural(pisa, 'fila', 'filas')} de la grilla por las ${c.items.length} de la propuesta. Nada se guarda hasta que presiones Guardar. ¿Continuar?`))) return;
    if (!alive()) return;
    if (c.items.length) S.items = clon(c.items);
    if (c.hitos.length) S.hitos = clon(c.hitos);
    S.gen = null; S.k = {};
    pintarGen(); pintarCuerpo(); pintarHitos(); cambio();
    toast('Cargué la propuesta en la grilla. Revísala y guarda.');
  }

  // ---------- Aprobar y reabrir (solo el CEO: lo cuida el servidor) ----------
  async function aprobar(si) {
    if (!S.data.puede?.aprobar) return;
    if (si) {
      if (sucio()) return toast('Guarda tus cambios antes de aprobar.', true);
      const fa = faltasAhora(); if (fa.length) return toast(`No se puede aprobar. Falta: ${fa.join(' · ')}`, true);
    }
    const nombre = b?.name || S.data.nombre || slug;
    if (!(await confirmAsk(si ? `¿Aprobar la estrategia de ${nombre}? Todas las herramientas de Strategy de este cliente quedan en solo lectura hasta que la reabras.` : `¿Reabrir la estrategia de ${nombre}? Vuelve a estar en construcción y se puede cambiar.`)) || !alive()) return;
    await haz(async () => {
      const r = await api(`estrategia/${enc(slug)}/viva/aprobar`, { method: 'POST', body: { aprobar: si } });
      if (!alive()) return;
      S.data.vivaAprobada = r.aprobado || null; S.gen = null; pintarTodo();
      try { window.dispatchEvent(new Event('os:estrategia')); } catch {} // el hero del workspace repinta su chip «Estrategia aprobada»
      toast(si ? 'Estrategia aprobada' : 'Estrategia reabierta');
    });
  }

  // ---------- Convertir en tareas (una por una, las mismas que crea un encargo del Chat) ----------
  // Cada tarea lleva la fila de la que sale (roadmap_item) y cuál es (roadmap_tarea), y un id que sale de esa clave: una fila convertida no se
  // vuelve a crear aunque ya esté Hecha, y la base rechaza el duplicado (409) aunque quien convierte no vea las tareas de otros (su alcance).
  // Las tareas de antes (sin clave) se reconocen por área y título.
  const yaConvertida = (ts, t) => ts.some((x) => x.origen === 'estrategia' && x.cliente === slug && (x.roadmap_item ? x.roadmap_item === t.roadmap_item && x.roadmap_tarea === t.roadmap_tarea : x.area === t.area && x.title === t.title));
  async function tareas() {
    if (!puedeTareas) return;
    if (sucio()) return toast('Guarda tus cambios antes de convertir en tareas.', true);
    const items = itemsLimpios();
    if (!items.length) return toast('Todavía no hay filas para convertir en tareas.', true);
    const dep = { slug, nombre: b?.name || S.data.nombre || slug, email: me.email };
    const t1 = tareasMarcadas(items.filter((x) => x.trimestre === 'T1'), dep), todo = tareasMarcadas(items, dep);
    const opts = [...(t1.length && t1.length < todo.length ? [['t1', `Solo T1, el plan de 90 días · ${plural(t1.length, 'tarea', 'tareas')}`]] : []), ['todo', `Todo el roadmap · ${plural(todo.length, 'tarea', 'tareas')}${todo.length > MAX_TAREAS_LOTE ? ` (se crean las primeras ${MAX_TAREAS_LOTE})` : ''}`]];
    const v = await ask('Convertir en tareas', [{ k: 'cual', t: 'select', opts, v: opts[0][0], l: 'Qué convertir. Se crean en Mis tareas, privadas: las ves tú y a quien se las asignes. Las que ya convertiste no se repiten.' }], 'Crear tareas');
    if (!v || !alive()) return;
    const lista = (v.cual === 't1' ? t1 : todo).slice(0, MAX_TAREAS_LOTE);
    await haz(async () => {
      const ts = await col('tasks').list();
      let creadas = 0, ya = 0, fuera = 0, falladas = 0;
      for (const t of lista) {
        if (t.area === 'consulting' && !consultingOk()) { fuera++; continue; }
        if (yaConvertida(ts, t)) { ya++; continue; }
        try { await col('tasks').create(t); ts.push(t); creadas++; }
        catch (e) {
          if (e.status === 409) { ya++; continue; } // la base ya tiene esa tarea (otra persona la creó): no se repite
          if (e.status === 403 && !creadas) throw Object.assign(new Error('Tu perfil no puede crear tareas: pídeselo al CEO'), { status: 403 });
          falladas++;
        }
      }
      if (!alive()) return;
      toast([plural(creadas, 'tarea creada', 'tareas creadas'), ya ? `${ya} ya estaban creadas` : '', fuera ? `${fuera} de Consulting fuera del alcance: escálalo al CEO` : '', falladas ? `${falladas} no se pudieron crear` : ''].filter(Boolean).join(' · '), Boolean(falladas) || (!creadas && Boolean(fuera)));
    });
  }

  // ---------- Hitos → metas del cliente (accounts.goals), sin duplicar los que ya llegaron ----------
  async function metas() {
    if (!canEdit(me, 'clients')) return;
    if (sucio()) return toast('Guarda tus cambios antes de mandar los hitos.', true);
    const nuevas = aMetas(S.hitos);
    if (!nuevas.length) return toast('No hay hitos con título para mandar.', true);
    if (!(await confirmAsk(`¿Mandar ${plural(nuevas.length, 'hito', 'hitos')} a las metas del cliente en Clientes? Los que ya mandaste no se repiten.`)) || !alive()) return;
    await haz(async () => {
      let acc;
      try { acc = await col('accounts').get(`acc-${slug}`); }
      catch (e) { throw e.status === 404 ? Object.assign(new Error('Este cliente todavía no tiene cuenta en Clientes.'), { status: 404 }) : e; }
      const actuales = goalsOf(acc), vistas = new Set(actuales.map(claveHito).filter(Boolean)), agregar = nuevas.filter((g) => !vistas.has(claveHito(g)));
      if (!agregar.length) return toast('Esos hitos ya estaban en Clientes.');
      try { await col('accounts').save({ ...acc, goals: [...actuales, ...agregar] }); }
      catch (e) { throw e.status === 409 ? Object.assign(new Error('Alguien cambió la cuenta mientras tanto. Vuelve a intentarlo.'), { status: 409 }) : e; }
      if (alive()) toast(`${plural(agregar.length, 'meta agregada', 'metas agregadas')} a Clientes${nuevas.length > agregar.length ? ` · ${nuevas.length - agregar.length} ya estaban` : ''}`);
    });
  }

  // ---------- Exportar ----------
  const markdown = () => { try { return String(aMd({ items: itemsLimpios(), hitos: limpiarHitos(S.hitos) }) || ''); } catch { return ''; } };
  function copiar() {
    if (!itemsLimpios().length && !limpiarHitos(S.hitos).length) return toast('Todavía no hay nada que exportar.', true);
    navigator.clipboard?.writeText(markdown()).then(() => toast('Markdown copiado'), () => toast('No pude copiar. Usa Exportar.', true)) || toast('No pude copiar. Usa Exportar.', true);
  }
  function exportar() {
    if (!itemsLimpios().length && !limpiarHitos(S.hitos).length) return toast('Todavía no hay nada que exportar.', true);
    const nombre = `growth-roadmap-${slug}.md`.replace(/[^a-z0-9._-]/gi, '-');
    try { // si el navegador no deja descargar, se copia
      const url = URL.createObjectURL(new Blob([markdown()], { type: 'text/markdown;charset=utf-8' })), a = document.createElement('a');
      a.href = url; a.download = nombre; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000); toast(`Descargué ${nombre}`);
    } catch { copiar(); }
  }

  // ---------- El primer pintado ----------
  try { tomar(await leer()); }
  catch (e) { if (!alive()) return; return mount(host, html`<div class="empty"><b>No pude abrir el roadmap</b>${e.message}${techDetail(e)}</div>`); }
  if (!alive()) return;
  mount(host, html`<div class="grm" id="grm" data-aprobada="${aprobada() ? 1 : 0}"><div id="grm-head"></div><div id="grm-banner"></div>
    <div class="grm-acts" id="grm-acts" role="toolbar" aria-label="Acciones del roadmap"></div><div id="grm-gen" aria-live="polite"></div>
    <div class="grm-opp" id="grm-opp"></div><section class="grm-sec" id="grm-cuerpo" aria-label="Roadmap"></section>
    <section class="grm-sec grm-hitos" id="grm-hitos" aria-label="Hitos"></section><section class="grm-faltas" id="grm-faltas" aria-label="Para aprobar"></section></div>`);
  root = $('#grm', host);

  acts(root, {
    'grm-vista': (el) => { S.vista = el.dataset.v === 'plan' ? 'plan' : 'timeline'; try { localStorage.setItem(K_VISTA, S.vista); } catch {} pintarCuerpo(); },
    'grm-agregar': (el) => agregar(el.dataset.a, el.dataset.t), 'grm-quitar': (el) => quitar(el.dataset.id),
    'grm-hito-mas': hitoMas, 'grm-hito-quitar': (el) => hitoQuitar(el.dataset.id),
    'grm-generar': () => generar(), 'grm-gen-claude': () => generar('claude-web'), 'grm-parar': () => S.gen?.ctrl?.abort(),
    'grm-pegar': pegar, 'grm-usar': usar, 'grm-cerrar-gen': () => { S.gen = null; pintarGen(); pintarActs(); },
    'grm-guardar': () => haz(guardar), 'grm-descartar': descartar,
    'grm-aprobar': () => aprobar(true), 'grm-reabrir': () => aprobar(false),
    'grm-tareas': tareas, 'grm-metas': metas, 'grm-exportar': exportar, 'grm-copiar': copiar,
  });
  // Escribir: el título de una fila o un campo de un hito se guarda en memoria y marca «Sin guardar» (sin repintar: se perdería el foco).
  // Cambiar el área o el trimestre mueve la fila de celda: ahí sí se repinta la grilla y el foco vuelve al mismo select.
  const alCambiar = (e) => {
    const t = e.target;
    if (!t?.dataset || !root.contains(t) || !editable()) return;
    if (t.dataset.f === 'titulo') { const x = S.items.find((i) => i.id === t.dataset.id); if (x) { x.titulo = t.value; cambio(); } }
    else if (t.dataset.h) { const h = S.hitos.find((i) => i.id === t.dataset.id); if (h && ['titulo', 'fecha', 'meta'].includes(t.dataset.h)) { h[t.dataset.h] = t.value; cambio(); } }
    else if (e.type === 'change' && (t.dataset.f === 'area' || t.dataset.f === 'trimestre')) {
      const x = S.items.find((i) => i.id === t.dataset.id); if (!x) return;
      if (t.dataset.f === 'area' && areaInfo(t.value)) x.area = t.value; else if (t.dataset.f === 'trimestre' && TRIMESTRES.includes(t.value)) x.trimestre = t.value; else return;
      pintarCuerpo(); cambio(); root.querySelector(`select[data-f="${t.dataset.f}"][data-id="${x.id}"]`)?.focus();
    }
  };
  root.addEventListener('input', alCambiar);
  root.addEventListener('change', alCambiar);
  root.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (editable() && sucio()) haz(guardar); } });
  pintarTodo();
}
