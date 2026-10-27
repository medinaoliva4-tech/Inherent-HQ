// Commercial Diagnosis (herramienta commercial-diagnosis de Strategy). NO usa el Tool Shell: su casa es la estrategia en vivo (viva.comercial).
// Pinta el score 0-100 (se calcula con score() de comercial.js y nunca se guarda), el embudo con sus cuellos de botella, los supuestos (al editar
// uno todo se recalcula) y el plan de 3 a 5 acciones con área y fecha. Acciones: Guardar (PUT estrategia/<slug>/viva), Generar con IA (la persona
// revisa y carga), Convertir en tareas (tareaDeEncargo) y Mandar cuellos al Opportunity Map. Aprobada la estrategia, todo queda en solo lectura.
// Pinta con html`…` (todo se escapa; lo que dice un modelo pasa por limpiar() y nunca por raw()). La pauta (dinero) solo la ve quien ve costos.
import { html, raw, mount, api, col, ico, toast, confirmAsk, ask, acts, skel, techDetail, fdate, $ } from '../core.js';
import { canEdit } from '../roleviews.js';
import { herramientaDe, rutaHerramienta } from '../herramientas.js';
import { armarCtx, correrIA } from '../ia-herramienta.js';
import { limpiarParche } from '../estrategia-viva.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { AREAS_RM_INFO, areaInfo } from './roadmap.js';
import { nuevoItem } from './oportunidades.js';
import { BLOQUE, MAX_ACCIONES, MIN_ACCIONES, SUPUESTOS_INFO, ETAPAS_EMBUDO, limpiar, score, embudo, cuellos, todosLosCuellos, faltas, tareasDe, aOportunidades, prompt, leer, resumenTexto, aMd } from './comercial.js';

const enc = encodeURIComponent;
const clon = (x) => JSON.parse(JSON.stringify(x));
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const veCostos = (me) => Boolean(me) && (['ceo', 'coo'].includes(me.role) || canEdit(me, 'clients')); // refleja seesCosts del servidor; el servidor decide
const num = (x) => (x == null ? SIN_DATOS : Number(x).toLocaleString('en-US', { maximumFractionDigits: 2 }));
const hoy = () => new Date().toISOString().slice(0, 10);
const NOMBRE_ETAPA = { ventas: 'Ventas', clientes: 'Clientes', conversaciones: 'Conversaciones', visitas: 'Visitas', alcance: 'Alcance' };
// Cada campo editable: en qué sección de viva vive.
const CAMPOS = [
  { k: 'objetivo', sec: 'meta', f: 'objetivo', nombre: 'Meta de ventas', ayuda: 'la meta que fija el cliente' },
  { k: 'ticket', sec: 'inversa', f: 'ticket', nombre: 'Ticket', ayuda: 'las ventas del cliente' },
  { k: 'cierre', sec: 'inversa', f: 'cierre', nombre: 'Cierre', ayuda: 'el CRM del cliente (0.25 o 25%)' },
  { k: 'conversion', sec: 'inversa', f: 'conversion', nombre: 'Conversión', ayuda: 'el CRM o la analítica del cliente' },
  { k: 'visita', sec: 'inversa', f: 'visita', nombre: 'Visita', ayuda: 'la analítica del cliente (Windsor)' },
  { k: 'piezas', sec: 'contenido', f: 'piezas', nombre: 'Piezas al mes', ayuda: 'el plan de contenido' },
  { k: 'alcance_pieza', sec: 'contenido', f: 'alcance_pieza', nombre: 'Alcance por pieza', ayuda: 'Windsor o las métricas del cliente' },
  { k: 'cpm', sec: 'pauta', f: 'cpm', nombre: 'CPM', ayuda: 'Windsor (Meta o Google)' },
  { k: 'mensual', sec: 'pauta', f: 'mensual', nombre: 'Pauta al mes', ayuda: 'lo que invierte el cliente', costo: true },
];
let seq = 0;
const nuevoId = (usados, pre) => { let id; do { id = `${pre}${Date.now().toString(36).slice(-4)}${(seq++).toString(36)}`; } while (usados.some((x) => x.id === id)); return id; };

// host: dónde se monta · me: quien mira · slug/b: el cliente · alive(): ¿sigue en pantalla?
export async function comercialTool(host, { me, slug, b, alive } = {}) {
  mount(host, skel('pagina'));
  const T = { id: 'commercial-diagnosis', ws: 'strategy', nombre: 'Commercial Diagnosis', ...herramientaDe('commercial-diagnosis'), prompt, bloque: BLOQUE };
  const S = { data: null, sup: {}, c: { bottlenecks: [], acciones: [] }, base: '', gen: null, ocupado: false, k: {} };
  const campos = CAMPOS.filter((x) => !x.costo || veCostos(me));
  const puedeTareas = Boolean(me?.areas?.includes('work') || me?.areas?.includes('operations'));
  const chatRuta = rutaHerramienta('strategy', slug, 'commercial-diagnosis', ['chat']);
  let root = null;

  // ---------- Lo que hay ----------
  const aprobada = () => Boolean(S.data?.vivaAprobada);
  const editable = () => Boolean(S.data?.puede?.editar) && !aprobada();
  const hayCambio = (id, key) => { const k = JSON.stringify(key); if (S.k[id] === k) return false; S.k[id] = k; return true; };
  const valorDe = (viva, x) => viva?.[x.sec]?.[x.f];
  const estado = () => JSON.stringify([S.sup, limpiar(S.c)]);
  const sucio = () => estado() !== S.base;
  const leerCampo = (x, s) => { const p = limpiarParche({ [x.sec]: { [x.f]: s } })[x.sec]; return p ? p[x.f] : undefined; };
  // La estrategia con lo que se está editando: de aquí salen el score, el embudo y los cuellos (se recalculan al editar un supuesto).
  function vivaLocal() {
    const v = clon(S.data?.viva || {});
    for (const x of campos) {
      const val = leerCampo(x, S.sup[x.k]);
      v[x.sec] = { ...(v[x.sec] || {}) };
      if (val == null) delete v[x.sec][x.f]; else v[x.sec][x.f] = val;
    }
    return v;
  }
  function tomar(d) {
    S.data = d;
    const c = limpiar(d.viva?.comercial);
    S.c = c; S.sup = Object.fromEntries(campos.map((x) => [x.k, valorDe(d.viva, x) == null ? '' : String(valorDe(d.viva, x))]));
    S.base = estado();
  }
  const leerEst = () => api(`estrategia/${enc(slug)}`);
  const fallo = (e) => { if (e?.name === 'AbortError') return; if (e?.status === 409 && e.code === 'APROBADO') { toast(e.message, true); recargar(); return; } toast(e?.message || 'No se pudo completar. Inténtalo de nuevo.', true); };
  const haz = async (fn) => {
    if (S.ocupado) return;
    S.ocupado = true; pintarActs();
    try { await fn(); } catch (e) { if (alive()) fallo(e); }
    if (!alive()) return;
    S.ocupado = false; pintarActs();
  };
  async function recargar() { try { tomar(await leerEst()); } catch (e) { if (alive()) toast(e.message, true); return; } if (alive()) pintarTodo(); }

  // ---------- Pintar ----------
  function pintarHead() {
    const el = $('#cd-head', root); if (!el) return;
    const su = sucio();
    if (!hayCambio('head', [S.data.nivel?.nombre, aprobada(), su])) return;
    mount(el, html`<header class="cd-head"><div class="cd-head-t"><h2>${ico('chart-no-axes-column', 16)} ${T.nombre}</h2><span class="cd-cli">${b?.name || S.data.nombre || slug}</span></div>
      <div class="cd-head-m"><span class="chip" data-aprobada="${aprobada() ? 1 : 0}">${aprobada() ? 'Estrategia aprobada' : 'En construcción'}</span><span class="chip">${S.data.nivel?.nombre || 'Sin ficha de oferta'}</span>${su ? html`<span class="chip cd-sucio">Sin guardar</span>` : ''}</div></header>`);
  }
  function pintarBanner() {
    const el = $('#cd-banner', root); if (!el) return;
    const msg = aprobada() ? 'La estrategia está aprobada: el CEO la reabre para cambiarla.' : !S.data.puede?.editar ? 'Solo lectura: tu perfil lo ve, pero no lo cambia.' : '';
    mount(el, msg ? html`<p class="cd-aviso" role="status">${ico('lock', 15)} ${msg}</p>` : '');
  }
  function pintarActs() {
    const el = $('#cd-acts', root); if (!el) return;
    const esc = editable(), su = sucio(), n = S.c.acciones.length, corriendo = S.gen?.fase === 'corriendo', hayCu = todosLosCuellos(vivaLocal(), S.c).length > 0;
    if (!hayCambio('acts', [esc, su, n, S.ocupado, corriendo, hayCu, aprobada()])) return;
    const btn = (act, icono, txt, { primario = false, off = false, tip = '' } = {}) => html`<button type="button" class="btn ${primario ? '' : 'ghost'} sm" data-act="cd-${act}" title="${tip}" ${off || S.ocupado ? raw('disabled') : ''}>${ico(icono, 14)} ${txt}</button>`;
    mount(el, html`<div class="cd-grp">${esc ? btn('generar', 'sparkles', 'Generar con IA', { primario: true, off: corriendo }) : ''}${esc ? btn('guardar', 'check', 'Guardar', { off: !su, tip: su ? '' : 'No hay cambios que guardar' }) : ''}${esc && su ? btn('descartar', 'x', 'Descartar cambios') : ''}</div>
      <div class="cd-grp">${puedeTareas && n ? btn('tareas', 'list-checks', 'Convertir en tareas') : ''}${S.data.puede?.editar && hayCu ? btn('opp', 'arrow-right', 'Cuellos → Opportunity Map') : ''}${btn('exportar', 'download', 'Exportar')}${btn('copiar', 'copy', 'Copiar')}<a class="btn ghost sm" href="${chatRuta}">${ico('chat-ia', 14)} Chat de Strategy</a></div>`);
  }
  function pintarScore() {
    const el = $('#cd-score', root); if (!el) return;
    const s = score(vivaLocal());
    if (!hayCambio('score', s)) return;
    mount(el, html`<div class="cd-score" data-sin="${s.score == null ? 1 : 0}"><div class="cd-num" aria-label="Score comercial">${s.score == null ? html`<b class="cd-sd">${SIN_DATOS}</b>` : html`<b>${s.score}</b><span>/100</span>`}</div>
      <div class="cd-partes">${s.partes.map((p) => html`<div class="cd-parte" data-ok="${p.ok ? 1 : 0}"><div class="cd-parte-h"><b>${p.nombre}</b><span>${p.pts}/${p.max}</span></div><div class="cd-barra" role="img" aria-label="${p.nombre}: ${p.pts} de ${p.max}"><i style="width:${Math.round((p.pts / p.max) * 100)}%"></i></div><p class="mut sm">${p.nota}</p></div>`)}</div>
      <p class="mut sm cd-nota">Se calcula con lo que hay en pantalla y no se guarda.</p></div>`);
  }
  function pintarEmbudo() {
    const el = $('#cd-embudo', root); if (!el) return;
    const v = vivaLocal(), e = embudo(v), cu = todosLosCuellos(v, S.c), porEtapa = new Set(cu.map((x) => x.etapa));
    if (!hayCambio('embudo', [e.pasos.map((p) => [p.valor, p.tasaValor]), e.cubre, cu])) return;
    const max = Math.max(...e.pasos.map((p) => p.valor || 0), 1);
    mount(el, html`<h3>Embudo de la meta hacia atrás</h3><div class="ev-fun cd-fun">${e.pasos.map((p) => html`<div class="ev-fr cd-fr" data-etapa="${p.id}" data-cuello="${porEtapa.has(p.id) ? 1 : 0}"><b>${p.valor == null ? html`<span class="cd-sd sm">${SIN_DATOS}</span>` : num(Math.round(p.valor))}</b>
        <div class="ev-bar ${p.valor == null ? '' : 'k'}" style="${p.valor == null ? '' : `min-width:${Math.max(18, Math.round((p.valor / max) * 100))}%`}">${p.nombre} · ${p.tasaNombre.toLowerCase()} ${p.tasaValor == null ? html`<span class="cd-sd">${SIN_DATOS}: sale de ${p.sale_de}</span>` : num(p.tasaValor)}${porEtapa.has(p.id) ? html` <span class="chip sm2 cd-cuello">Cuello</span>` : ''}</div></div>`)}</div>
      ${e.cubre != null ? html`<p class="mut sm">Contenido y pauta cubren ${Math.round(Math.min(e.cubre, 1) * 100)}% del alcance que pide la meta${e.hueco > 0.2 ? html` · <b>hueco de ${Math.round(e.hueco * 100)}%</b>` : ''}.</p>` : ''}`);
  }
  function pintarSup() {
    const el = $('#cd-sup', root); if (!el) return;
    const ed = editable();
    if (!hayCambio('sup', [ed, aprobada()])) return;
    mount(el, html`<h3>Supuestos</h3><p class="mut sm">Cambia uno y el embudo y el score se recalculan. Solo cifras del cliente, su CRM o Windsor; si no lo sabes, déjalo vacío.</p>
      <div class="cd-sups">${campos.map((x) => html`<label class="cd-sup"><span>${x.nombre}</span><input class="in" type="text" inputmode="decimal" data-s="${x.k}" value="${S.sup[x.k]}" placeholder="${SIN_DATOS}" ${ed ? '' : raw('disabled')} autocomplete="off"><small class="mut">Sale de ${x.ayuda}</small></label>`)}</div>`);
  }
  function pintarCuellos() {
    const el = $('#cd-cuellos', root); if (!el) return;
    const v = vivaLocal(), calc = cuellos(v), ed = editable();
    if (!hayCambio('cuellos', [calc, S.c.bottlenecks, ed])) return;
    mount(el, html`<h3>Cuellos de botella</h3>${calc.length || S.c.bottlenecks.length ? '' : html`<p class="cd-sd">Sin cuellos con los datos de hoy. Un cuello es una tasa que falta o un hueco de alcance de más de 20%.</p>`}
      <ul class="cd-cu">${calc.map((x) => html`<li class="cd-cu-i" data-tipo="${x.tipo}"><span class="chip sm2">${NOMBRE_ETAPA[x.etapa]}</span> ${x.texto}</li>`)}
      ${S.c.bottlenecks.map((x) => html`<li class="cd-cu-i cd-cu-ed" data-id="${x.id}"><select class="in" data-b="etapa" data-id="${x.id}" aria-label="Etapa del cuello" ${ed ? '' : raw('disabled')}><option value="">Etapa</option>${ETAPAS_EMBUDO.map((e) => html`<option value="${e}" ${e === x.etapa ? raw('selected') : ''}>${NOMBRE_ETAPA[e]}</option>`)}</select>
        <input class="in" type="text" data-b="texto" data-id="${x.id}" maxlength="240" value="${x.texto}" aria-label="Qué pasa" ${ed ? '' : raw('disabled')}>${ed ? html`<button type="button" class="btn ghost xs" data-act="cd-cu-quitar" data-id="${x.id}" aria-label="Quitar este cuello">${ico('x', 14)}</button>` : ''}</li>`)}</ul>
      ${ed ? html`<button type="button" class="btn ghost sm" data-act="cd-cu-mas">${ico('plus', 14)} Anotar un cuello</button>` : ''}`);
  }
  function pintarPlan() {
    const el = $('#cd-plan', root); if (!el) return;
    const ed = editable(), a = S.c.acciones, cu = todosLosCuellos(vivaLocal(), S.c);
    if (!hayCambio('plan', [ed, a, cu.map((x) => x.id)])) return;
    mount(el, html`<h3>Plan de ${MIN_ACCIONES} a ${MAX_ACCIONES} acciones</h3>${a.length ? '' : html`<p class="cd-sd">${SIN_DATOS}: el plan todavía no tiene acciones. Salen de «Generar con IA» o de agregarlas aquí.</p>`}
      <ul class="cd-ac">${a.map((x) => html`<li class="cd-ac-i" data-id="${x.id}"><input class="in" type="text" data-a="titulo" data-id="${x.id}" maxlength="160" value="${x.titulo}" placeholder="Un resultado, no una actividad suelta" aria-label="Acción" ${ed ? '' : raw('disabled')}>
        <div class="cd-ac-m"><select class="in" data-a="area" data-id="${x.id}" aria-label="Área" ${ed ? '' : raw('disabled')}><option value="">Área</option>${AREAS_RM_INFO.map((r) => html`<option value="${r.id}" ${r.id === x.area ? raw('selected') : ''}>${r.nombre}</option>`)}</select>
          <input class="in" type="date" data-a="fecha" data-id="${x.id}" value="${x.fecha}" aria-label="Fecha" ${ed ? '' : raw('disabled')}>
          <select class="in" data-a="cuello" data-id="${x.id}" aria-label="Cuello que ataca" ${ed ? '' : raw('disabled')}><option value="">Sin cuello</option>${cu.map((c) => html`<option value="${c.id}" ${c.id === x.cuello ? raw('selected') : ''}>${NOMBRE_ETAPA[c.etapa] || 'Embudo'} · ${c.texto.slice(0, 40)}</option>`)}</select>
          ${ed ? html`<button type="button" class="btn ghost xs" data-act="cd-ac-quitar" data-id="${x.id}" aria-label="Quitar esta acción">${ico('x', 14)}</button>` : ''}</div></li>`)}</ul>
      ${ed ? html`<button type="button" class="btn ghost sm" data-act="cd-ac-mas" ${a.length >= MAX_ACCIONES ? raw('disabled') : ''}>${ico('plus', 14)} Agregar acción</button>` : ''}`);
  }
  function pintarFaltas() {
    const el = $('#cd-faltas', root); if (!el) return;
    const fa = faltas(S.c, { hoy: hoy() });
    if (!hayCambio('faltas', fa)) return;
    mount(el, fa.length ? html`<h3>Para completar el plan</h3><ul class="cd-fl">${fa.map((x) => html`<li class="cd-sd">${x}</li>`)}</ul>` : '');
  }
  function pintarGen() {
    const g = S.gen, el = $('#cd-gen', root); if (!el) return;
    if (!g) return mount(el, '');
    if (g.fase === 'corriendo') { mount(el, html`<section class="cd-gen"><header><span>${ico('loader-circle', 14)} Generando con IA…</span><button type="button" class="btn ghost sm" data-act="cd-parar">${ico('stop-lleno', 12)} Parar</button></header><pre class="cd-stream" aria-live="polite"></pre></section>`); verStream(); return; }
    if (g.fase === 'propuesta') {
      const c = g.prop.contenido, fa = faltas(c, { hoy: hoy() });
      mount(el, html`<section class="cd-prop"><header><h3>${ico('sparkles', 14)} Propuesta de la IA</h3><span class="mut sm">${g.via === 'manual' ? 'Pegada a mano' : g.modelo || g.via}</span></header>
        <p>${plural(c.bottlenecks.length, 'cuello', 'cuellos')} y ${plural(c.acciones.length, 'acción', 'acciones')}.</p>
        <ul class="cd-prop-l">${c.acciones.map((x) => html`<li><b>${x.titulo}</b> · ${areaInfo(x.area)?.nombre || SIN_DATOS} · ${x.fecha ? fdate(x.fecha) : SIN_DATOS}</li>`)}</ul>
        ${fa.length ? html`<ul class="cd-fl">${fa.map((x) => html`<li class="cd-sd">${x}</li>`)}</ul>` : ''}
        <p class="mut sm">Nada se guarda hasta que presiones Guardar.</p>
        <div class="cd-grp"><button type="button" class="btn sm" data-act="cd-usar">${ico('check', 14)} Cargar en el plan</button><button type="button" class="btn ghost sm" data-act="cd-generar">${ico('refresh-cw', 14)} Reintentar</button><button type="button" class="btn ghost sm" data-act="cd-cerrar-gen">Descartar</button></div></section>`);
      return;
    }
    mount(el, html`<section class="cd-gen" role="alert"><p>${g.fase === 'error' ? g.error : 'No vino el bloque con cuellos y acciones. Reintenta o pega la respuesta.'}</p>${g.fase === 'sin-bloque' && g.texto ? html`<details><summary>Ver lo que respondió</summary><pre class="cd-stream">${g.texto}</pre></details>` : ''}
      <div class="cd-grp"><button type="button" class="btn sm" data-act="cd-generar">${ico('refresh-cw', 14)} Reintentar</button><button type="button" class="btn ghost sm" data-act="cd-pegar">Pegar la respuesta</button><button type="button" class="btn ghost sm" data-act="cd-cerrar-gen">${ico('x', 14)} Cerrar</button></div></section>`);
  }
  const verStream = () => { const pre = $('.cd-stream', root); if (pre && S.gen) { pre.textContent = S.gen.texto || ''; pre.scrollTop = pre.scrollHeight; } };
  const recalcular = () => { pintarHead(); pintarActs(); pintarScore(); pintarEmbudo(); pintarCuellos(); pintarPlan(); pintarFaltas(); };
  function pintarTodo() { S.k = {}; pintarBanner(); pintarGen(); pintarSup(); recalcular(); }

  // ---------- Editar ----------
  const ac = (id) => S.c.acciones.find((x) => x.id === id), cu = (id) => S.c.bottlenecks.find((x) => x.id === id);
  function alEditar(e) {
    const t = e.target; if (!t?.dataset || !editable()) return;
    if (t.dataset.s) { S.sup[t.dataset.s] = t.value; recalcular(); }
    else if (t.dataset.a) { const x = ac(t.dataset.id); if (!x) return; x[t.dataset.a] = t.value; pintarHead(); pintarActs(); pintarFaltas(); if (t.dataset.a !== 'titulo') { S.k.plan = null; } }
    else if (t.dataset.b) { const x = cu(t.dataset.id); if (!x) return; x[t.dataset.b] = t.value; pintarHead(); pintarActs(); S.k.plan = null; }
  }
  // Los selects y las fechas repintan lo que depende de ellos; los campos de texto no (perderían el foco).
  const alCambiar = (e) => { alEditar(e); if (e.target.tagName === 'SELECT' || e.target.type === 'date') { S.k.plan = null; S.k.cuellos = null; pintarPlan(); pintarCuellos(); } };

  // ---------- Guardar: PUT estrategia/<slug>/viva ----------
  async function guardar() {
    if (!editable() || !sucio()) return;
    const fresco = await leerEst(); if (!alive()) return;
    if (fresco.vivaAprobada) { tomar(fresco); pintarTodo(); return toast('La estrategia está aprobada: el CEO la reabre para cambiarla.', true); }
    const parche = {}, base = JSON.parse(S.base);
    for (const x of campos) if (S.sup[x.k] !== base[0][x.k]) { parche[x.sec] = { ...(parche[x.sec] || {}), [x.f]: S.sup[x.k] === '' ? null : S.sup[x.k] }; }
    if (JSON.stringify(limpiar(S.c)) !== JSON.stringify(base[1])) parche.comercial = limpiar(S.c);
    const otro = parche.comercial && JSON.stringify(limpiar(fresco.viva?.comercial)) !== JSON.stringify(base[1]);
    if (otro && !(await confirmAsk('El diagnóstico cambió en otro lado mientras lo editabas. ¿Lo reemplazo con lo que tienes aquí?'))) return;
    if (!alive()) return;
    const r = await api(`estrategia/${enc(slug)}/viva`, { method: 'PUT', body: { parche } });
    if (!alive()) return;
    tomar({ ...fresco, viva: r.viva }); pintarTodo(); toast('Diagnóstico guardado');
  }

  // ---------- Generar con IA ----------
  function leerRespuesta(txt, { via, modelo }) {
    let prop = null;
    try { const r = leer(txt); if (r && (r.contenido.acciones.length || r.contenido.bottlenecks.length)) prop = r; } catch { prop = null; }
    S.gen = prop ? { fase: 'propuesta', prop, via, modelo } : { fase: 'sin-bloque', texto: txt, via, modelo };
  }
  async function generar(preferir) {
    if (!editable() || S.gen?.fase === 'corriendo') return;
    const ctrl = new AbortController(), mio = () => S.gen?.ctrl === ctrl;
    S.gen = { fase: 'corriendo', texto: '', ctrl }; pintarGen(); pintarActs();
    try {
      const ctx = await armarCtx(me, { tool: T, slug, entradas: [] }); if (!alive() || !mio()) return;
      ctx.comercial_resumen = resumenTexto(vivaLocal(), { conPauta: veCostos(me) });
      const out = await correrIA(me, { tool: T, ctx, signal: ctrl.signal, preferir, onDelta: (t) => { if (!alive()) return ctrl.abort(); if (mio()) { S.gen.texto = t; verStream(); } } });
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
    leerRespuesta(v.t, { via: 'manual', modelo: '' }); pintarGen(); pintarActs();
  }
  async function usar() {
    const g = S.gen; if (g?.fase !== 'propuesta' || !editable()) return;
    const c = g.prop.contenido;
    if (c.acciones.length && S.c.acciones.length && !(await confirmAsk(`Esto reemplaza las ${plural(S.c.acciones.length, 'acción', 'acciones')} del plan. Nada se guarda hasta que presiones Guardar. ¿Continuar?`))) return;
    if (!alive()) return;
    if (c.acciones.length) S.c.acciones = clon(c.acciones);
    if (c.bottlenecks.length) S.c.bottlenecks = clon(c.bottlenecks);
    S.gen = null; pintarGen(); recalcular(); toast('Cargué la propuesta. Revísala y guarda.');
  }

  // ---------- Tareas y Opportunity Map ----------
  async function tareas() {
    if (!puedeTareas) return;
    if (sucio()) return toast('Guarda tus cambios antes de convertir en tareas.', true);
    const lista = tareasDe(S.c.acciones, { slug, nombre: b?.name || S.data.nombre || slug, email: me.email });
    if (!lista.length) return toast('Ninguna acción tiene área todavía.', true);
    if (!(await confirmAsk(`¿Crear ${plural(lista.length, 'tarea', 'tareas')} en Mis tareas? Son privadas: las ves tú y a quien se las asignes. Las que ya creaste no se repiten.`)) || !alive()) return;
    await haz(async () => {
      const ts = await col('tasks').list(), ids = new Set(ts.map((t) => t.id));
      let creadas = 0, ya = 0, falladas = 0;
      for (const t of lista) {
        if (ids.has(t.id)) { ya++; continue; }
        try { await col('tasks').create(t); creadas++; }
        catch (e) { if (e.status === 409) { ya++; continue; } if (e.status === 403 && !creadas) throw Object.assign(new Error('Tu perfil no puede crear tareas: pídeselo al CEO'), { status: 403 }); falladas++; }
      }
      if (alive()) toast([plural(creadas, 'tarea creada', 'tareas creadas'), ya ? `${ya} ya estaban` : '', falladas ? `${falladas} no se pudieron crear` : ''].filter(Boolean).join(' · '), Boolean(falladas));
    });
  }
  // Los cuellos pasan al Borrador del Opportunity Map (sin puntajes: ahí se puntúan). Si ya está aprobado no se toca: el CEO lo reabre.
  async function aOpp() {
    if (sucio()) return toast('Guarda tus cambios antes de mandar los cuellos.', true);
    const nuevos = aOportunidades(todosLosCuellos(vivaLocal(), S.c)).map((x) => nuevoItem(x));
    if (!nuevos.length) return toast('No hay cuellos que mandar.', true);
    if (!(await confirmAsk(`¿Mandar ${plural(nuevos.length, 'cuello', 'cuellos')} al Opportunity Map? Llegan sin puntajes y los que ya mandaste no se repiten.`)) || !alive()) return;
    await haz(async () => {
      const r = await api(`entregables?ws=strategy&slug=${enc(slug)}&tool=opportunity-map`).catch(() => null);
      const doc = (Array.isArray(r?.items) ? r.items : []).filter((d) => !d.archivado).sort((a, z) => String(z._meta?.updated_at || '').localeCompare(String(a._meta?.updated_at || '')))[0];
      const cuerpo = { tool: 'opportunity-map', client_slug: slug, ciclo: '', project_id: '', criterios: { cumple: [], falta: [] }, ia: { via: 'manual', modelo: '' } };
      if (!doc) { await api('entregables', { method: 'POST', body: { ...cuerpo, titulo: `Opportunity Map · ${b?.name || slug}`, entradas: [], contenido: { items: nuevos } } }); if (alive()) toast(`${plural(nuevos.length, 'cuello enviado', 'cuellos enviados')} al Opportunity Map`); return; }
      if (['Aprobado', 'Entregado'].includes(doc.estado)) throw new Error('El Opportunity Map está aprobado: el CEO lo reabre para agregarle cuellos.');
      const items = Array.isArray(doc.contenido?.items) ? doc.contenido.items : [], vistos = new Set(items.map((x) => x.id)), agregar = nuevos.filter((x) => !vistos.has(x.id));
      if (!agregar.length) return toast('Esos cuellos ya estaban en el Opportunity Map.');
      await api(`entregables/${enc(doc.id)}`, { method: 'PUT', body: { ...cuerpo, v: doc.v, titulo: doc.titulo, entradas: doc.entradas || [], criterios: doc.criterios, ia: doc.ia, contenido: { ...doc.contenido, items: [...items, ...agregar] } } });
      if (alive()) toast(`${plural(agregar.length, 'cuello enviado', 'cuellos enviados')} al Opportunity Map`);
    });
  }

  // ---------- Exportar ----------
  const markdown = () => { try { return String(aMd(S.c, vivaLocal()) || ''); } catch { return ''; } };
  const copiar = () => (navigator.clipboard?.writeText(markdown()).then(() => toast('Markdown copiado'), () => toast('No pude copiar. Usa Exportar.', true)) || toast('No pude copiar. Usa Exportar.', true));
  function exportar() {
    const nombre = `commercial-diagnosis-${slug}.md`.replace(/[^a-z0-9._-]/gi, '-');
    try {
      const url = URL.createObjectURL(new Blob([markdown()], { type: 'text/markdown;charset=utf-8' })), a = document.createElement('a');
      a.href = url; a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); toast(`Descargué ${nombre}`);
    } catch { copiar(); }
  }

  // ---------- El primer pintado ----------
  try { tomar(await leerEst()); }
  catch (e) { if (!alive()) return; return mount(host, html`<div class="empty"><b>No pude abrir el diagnóstico</b>${e.message}${techDetail(e)}</div>`); }
  if (!alive()) return;
  mount(host, html`<div class="cd" id="cd"><div id="cd-head"></div><div id="cd-banner"></div><div class="cd-acts" id="cd-acts" role="toolbar" aria-label="Acciones del diagnóstico"></div><div id="cd-gen" aria-live="polite"></div>
    <section class="cd-sec cd-top"><div id="cd-score"></div><div id="cd-embudo"></div></section><section class="cd-sec" id="cd-sup"></section><section class="cd-sec" id="cd-cuellos"></section><section class="cd-sec" id="cd-plan"></section><section class="cd-faltas" id="cd-faltas"></section></div>`);
  root = $('#cd', host);
  acts(root, {
    'cd-generar': () => generar(), 'cd-guardar': () => haz(guardar), 'cd-descartar': async () => { if (!(await confirmAsk('¿Descartar los cambios sin guardar?')) || !alive()) return; await recargar(); },
    'cd-tareas': tareas, 'cd-opp': aOpp, 'cd-exportar': exportar, 'cd-copiar': copiar, 'cd-pegar': pegar, 'cd-usar': usar,
    'cd-parar': () => { S.gen?.ctrl?.abort(); S.gen = null; pintarGen(); pintarActs(); }, 'cd-cerrar-gen': () => { S.gen = null; pintarGen(); pintarActs(); },
    'cd-ac-mas': () => { if (S.c.acciones.length >= MAX_ACCIONES) return; S.c.acciones.push({ id: nuevoId(S.c.acciones, 'a'), titulo: '', area: '', fecha: '', cuello: '' }); S.k.plan = null; recalcular(); },
    'cd-ac-quitar': (el) => { S.c.acciones = S.c.acciones.filter((x) => x.id !== el.dataset.id); S.k.plan = null; recalcular(); },
    'cd-cu-mas': () => { S.c.bottlenecks.push({ id: nuevoId(S.c.bottlenecks, 'b'), etapa: '', tipo: '', texto: '', nota: '' }); S.k.cuellos = null; recalcular(); },
    'cd-cu-quitar': (el) => { S.c.bottlenecks = S.c.bottlenecks.filter((x) => x.id !== el.dataset.id); S.k.cuellos = null; recalcular(); },
  });
  root.addEventListener('input', alEditar); root.addEventListener('change', alCambiar);
  pintarTodo();
}
