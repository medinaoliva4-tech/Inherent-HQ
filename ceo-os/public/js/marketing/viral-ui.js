// Viral Intelligence Lab (herramienta viral-intelligence-lab de Marketing): cuatro pestañas sobre la Investigación de la marca.
//   Library       la Investigación de hoy (screens/content.js embed «research»): estado, «Lo que funciona», biblioteca y referentes. «Actualizar ahora» sigue siendo de CEO/COO.
//   Trend Radar   momentum vs saturación de cada patrón en un 2×2 (SVG) con un slider de semana: cada guardado anota la lectura de esa semana.
//   Pattern Report por patrón: ejemplos (links a los posts), multiplicador mediano, redes y por qué funciona. Se crean, editan, mandan a revisión y archivan.
//   Oportunidades momentum alto y saturación baja: «Mandar a Content Strategy Studio» (link) y Hook Lab (llega en la Fase 3e).
// Un patrón se guarda como UN entregable (tool viral-intelligence-lab, contenido = el patrón) por /api/entregables, siempre con la v que se leyó.
// NO usa el Tool Shell. «Agrupar con IA» corre por correrIA (la persona revisa y confirma; nada se guarda solo). Sin ficha el servidor responde 409 y se muestra.
// Pinta con html`…` (todo se escapa; lo que dice un modelo pasa por limpiar() de patrones.js y nunca por raw()). Lo vacío dice «⚠️ SIN DATOS».
import { html, raw, mount, api, ico, toast, confirmAsk, ask, acts, fdate, today, $ } from '../core.js';
import { herramientaDe, rutaHerramienta } from '../herramientas.js';
import { armarCtx, correrIA } from '../ia-herramienta.js';
import { render as content } from '../screens/content.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { fallo, vacio } from '../visual.js';
import {
  BLOQUE, MIN_ITEMS, NIVELES, FORMATOS, CUADRANTES, formatoNombre, nivelNombre, redNombre, fmtDe, redDe, hookDe, resonanciaDe, indiceDe, claveDe,
  limpiarPatron, recalcular, registrarSemana, senales, faltas, agrupar, trendRadar, semanasDe, semanaIso, oportunidades, ordenPatrones, prompt, leer, limpiar, aMd,
} from './patrones.js';

const enc = encodeURIComponent;
const TABS = [['library', 'Library', 'book'], ['radar', 'Trend Radar', 'radar'], ['report', 'Pattern Report', 'layers'], ['oportunidades', 'Oportunidades', 'flame']];
const TAB_IDS = TABS.map(([k]) => k);
const corto = (s, n) => { const t = String(s ?? ''); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t; };
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const semTxt = (s) => { const m = /^(\d{4})-W(\d{2})$/.exec(s || ''); return m ? `Semana ${+m[2]} · ${m[1]}` : 'Hoy'; };
const seguro = (u) => (/^https:\/\/\S+$/.test(String(u ?? '')) ? String(u) : '');
const clon = (x) => JSON.parse(JSON.stringify(x ?? {}));
// El radar: el área de la gráfica dentro del SVG (viewBox 560 × 424).
const X0 = 56, Y0 = 16, AW = 480, AH = 360;

// host: dónde se monta · me: quien mira · slug/b: la marca · alive(): ¿sigue en pantalla? · resto: lo que viene en la ruta tras la herramienta
// (resto[0] = la pestaña: library · radar · report · oportunidades; resto[1] = la red de Inspo en la marca personal).
export async function viralTool(host, { me, slug, b, alive, resto = [] } = {}) {
  // La herramienta del registro, con el pedido y el bloque de patrones.js: correrIA() los pide y el Tool Shell no entra aquí.
  const T = { id: 'viral-intelligence-lab', ws: 'marketing', nombre: 'Viral Intelligence Lab', ...herramientaDe('viral-intelligence-lab'), prompt, leer, limpiar, faltas, bloque: BLOQUE };
  const base = rutaHerramienta('marketing', slug, T.id);
  const S = {
    tab: TAB_IDS.includes(resto[0]) ? resto[0] : 'library', antes: '',
    docs: [], puede: { editar: false, aprobar: false }, alcance: { abierto: true, code: '', texto: '' }, errDocs: '', cargandoDocs: true,
    inv: null, errInv: '', cargandoInv: true, idx: null, semIdx: 0, semHoy: true,
    ed: null, gen: null, ocupado: false, libMontada: false,
  };
  let root = null;

  // ---------- Lo que hay y lo que se puede hacer ----------
  const itemsLib = () => (S.inv?.items || []).filter((x) => x && claveDe(x));
  const lib = () => (S.inv ? itemsLib() : null);
  const idx = () => (S.idx ||= indiceDe(itemsLib()));
  const escribe = () => S.puede.editar && S.alcance.abierto;
  const patronDe = (d) => recalcular(limpiarPatron(d.contenido), lib());
  const lista = () => S.docs.map((d) => ({ d, p: patronDe(d) })).sort((a, z) => ordenPatrones(a.p, z.p));
  const docDe = (pid) => S.docs.find((d) => limpiarPatron(d.contenido).id === pid) || null;
  const extraFaltas = () => (lib() ? { items: lib() } : {});
  const poner = (d) => { const i = S.docs.findIndex((x) => x.id === d.id); if (i >= 0) S.docs[i] = d; else S.docs.unshift(d); };

  async function cargarDocs() {
    try {
      const r = await api(`entregables?ws=marketing&slug=${enc(slug)}&tool=${enc(T.id)}`);
      if (!alive()) return;
      S.docs = (r.items || []).filter((d) => !d.archivado);
      S.puede = { editar: Boolean(r.puede?.editar), aprobar: Boolean(r.puede?.aprobar) };
      S.alcance = { abierto: r.alcance?.abierto !== false, code: r.alcance?.code || '', texto: r.alcance?.texto || '' };
      S.errDocs = '';
    } catch (e) { if (!alive()) return; S.errDocs = e.message || 'No se pudo leer'; }
    S.cargandoDocs = false;
  }
  async function cargarInv() {
    try { S.inv = await api(`investigacion?profile=${enc(slug)}`); S.errInv = ''; } catch (e) { if (!alive()) return; S.errInv = e.message || 'No se pudo leer'; }
    S.idx = null; S.cargandoInv = false;
  }

  // ---------- Errores y envoltura de acciones ----------
  function falla(e) {
    if (e?.name === 'AbortError') return;
    // Sin ficha (409) o fuera del alcance (403): el servidor lo dice y la vista queda en solo lectura.
    if ((e?.status === 409 && e.code === 'SIN_FICHA') || (e?.status === 403 && e.code === 'FUERA_DEL_ALCANCE')) { S.alcance = { abierto: false, code: e.code, texto: e.message }; repintar(); return toast(e.message, true); }
    if (e?.status === 409 && e.code === 'CONFLICTO') { toast(e.message, true); recargarDocs(); return; }
    toast(e?.message || 'No se pudo completar. Inténtalo de nuevo.', true);
  }
  const haz = async (fn) => {
    if (S.ocupado) return;
    S.ocupado = true; pintarBarra(); pintarLista();
    try { await fn(); } catch (e) { if (alive()) falla(e); }
    if (!alive()) return;
    S.ocupado = false; pintarBarra(); pintarLista();
  };
  async function recargarDocs() { await cargarDocs(); if (alive()) repintar(); }

  // ---------- El aviso, las pestañas y la Library ----------
  function pintarAviso() {
    const el = $('#vil-aviso', root); if (!el) return;
    const msg = S.errDocs ? '' : !S.alcance.abierto ? (S.alcance.texto || 'Sin ficha de oferta: el alcance contratado es el techo') : !S.puede.editar && !S.cargandoDocs ? 'Solo lectura: tu perfil ve los patrones, pero no los cambia.' : '';
    mount(el, msg ? html`<p class="vil-aviso" role="status" data-code="${S.alcance.code || ''}">${ico('lock', 15)} ${msg}</p>` : '');
  }
  function pintarTabs() {
    const el = $('#vil-tabs', root); if (!el) return;
    const n = { report: S.docs.length, oportunidades: oportunidades(S.docs.map((d) => d.contenido)).length };
    mount(el, html`<nav class="vil-tabs" role="tablist" aria-label="Viral Intelligence Lab">${TABS.map(([k, l, i]) => html`<button type="button" role="tab" class="vil-tab ${S.tab === k ? 'on' : ''}" aria-selected="${S.tab === k ? 'true' : 'false'}" data-act="vil-tab" data-t="${k}">${ico(i, 14)} ${l}${n[k] ? html` <span class="vil-n">${n[k]}</span>` : ''}</button>`)}</nav>`);
  }
  // La Investigación de hoy, tal cual: la monta el mismo embed que usaba la herramienta antes (una sola vez; las demás pestañas la dejan oculta).
  function montarLibrary() {
    const box = $('#vil-lib', root); if (!box || S.libMontada) return;
    S.libMontada = true; box.dataset.island = '1';
    Promise.resolve(content(box, { me, alive, fixed: b.slug, sub: ['research'], embed: { base: `${base}/library`, only: ['research'], brand: b.name, inspo: Boolean(b.personal), plat: resto[1] } }))
      .catch((e) => { console.error(e); if (alive() && box.isConnected) mount(box, html`${fallo({ titulo: 'No pude abrir la Library', linea: 'Recarga la página; si sigue igual, la Investigación está en el Chat de Marketing.' })}`); });
  }
  function verTab() {
    for (const [k] of TABS) { const p = $(`#vil-p-${k}`, root); if (p) p.hidden = S.tab !== k; }
    pintarTabs();
    if (S.tab === 'library') montarLibrary();
    // Al salir de la Library se vuelve a leer la Investigación: pudo traer posts nuevos o juicios de Laya.
    else if (S.antes === 'library') cargarInv().then(() => { if (alive()) repintar(); });
    S.antes = S.tab;
    try { history.replaceState(null, '', `${base}/${S.tab}`); } catch { /* sin historial: la pestaña igual cambia */ }
  }
  function verPatron(pid) {
    S.tab = 'report'; verTab();
    const el = document.getElementById(`vil-pat-${pid}`);
    if (el) { el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }); }
  }

  // ---------- Los ejemplos de un patrón (links a los posts de la Biblioteca) ----------
  function ejemplo(k) {
    const it = idx().get(k);
    if (!it) return html`<li class="vil-ej vil-ej-falta"><span class="mut">${k}</span> <span class="vil-sd">⚠️ Ya no está en la Biblioteca</span></li>`;
    const x = resonanciaDe(it), url = seguro(it.url);
    const t = [it.handle ? `@${it.handle}` : '', formatoNombre(fmtDe(it)), redNombre(redDe(it)), x ? `×${x}` : 'sin ×'].filter(Boolean).join(' · ');
    return html`<li class="vil-ej">${url ? html`<a href="${url}" target="_blank" rel="noopener noreferrer">${t} ${ico('external-link', 12)}</a>` : html`<span>${t}</span>`}
      <span class="mut sm">${[it.at ? fdate(it.at) : '', corto(hookDe(it), 90)].filter(Boolean).join(' · ')}</span>${it.laya?.estado === 'listo' && it.laya.chip ? html` <span class="chip sm2 vil-laya">${it.laya.chip}</span>` : ''}</li>`;
  }
  const chipsDe = (p, d) => html`${p.formato ? html`<span class="chip sm2">${formatoNombre(p.formato)}</span>` : ''}${p.redes.map((r) => html`<span class="chip sm2">${redNombre(r)}</span>`)}
    ${p.multiplicador ? html`<span class="chip sm2 vil-x" title="La mediana de la resonancia de sus posts: cada uno contra el promedio de su propia cuenta">×${p.multiplicador} mediano</span>` : html`<span class="chip sm2 vil-sd" title="Ningún post de este patrón trae su resonancia">× ${SIN_DATOS}</span>`}
    ${p.oportunidad ? html`<span class="chip sm2 lime">Oportunidad</span>` : ''}${d ? html`<span class="chip sm2 vil-estado" data-estado="${d.estado || 'Borrador'}">${d.estado || 'Borrador'} · v${d.version || 1}</span>` : ''}`;

  // ---------- Pattern Report: la barra, los patrones y el editor ----------
  function pintarBarra() {
    const el = $('#vil-barra', root); if (!el) return;
    const ok = escribe() && !S.ocupado && !S.cargandoDocs, hay = itemsLib().length >= MIN_ITEMS, corriendo = S.gen?.fase === 'corriendo';
    const sin = !hay ? 'La Investigación todavía no tiene posts: se llena con la primera actualización (Library).' : '';
    mount(el, html`<div class="vil-barra" role="toolbar" aria-label="Patrones">
      <button type="button" class="btn sm" data-act="vil-ia" title="${sin}" ${ok && hay && !corriendo ? '' : raw('disabled')}>${ico('sparkles', 14)} Agrupar con IA</button>
      <button type="button" class="btn ghost sm" data-act="vil-sugerir" title="${sin || 'Agrupa por formato y tipo de gancho, sin IA'}" ${ok && hay && !corriendo ? '' : raw('disabled')}>${ico('layers', 14)} Sugerir sin IA</button>
      <button type="button" class="btn ghost sm" data-act="vil-nuevo" ${ok && hay ? '' : raw('disabled')}>${ico('plus', 14)} Nuevo patrón</button>
      <span class="sp"></span><span class="mut sm">${S.inv ? `${plural(itemsLib().length, 'post', 'posts')} en la Biblioteca` : S.cargandoInv ? 'Leyendo la Biblioteca…' : `⚠️ SIN DATOS: no pude leer la Biblioteca${S.errInv ? ` (${S.errInv})` : ''}`}</span></div>`);
  }
  function tarjeta({ d, p }) {
    const ed = escribe(), est = d.estado || 'Borrador', off = S.ocupado ? raw('disabled') : '';
    const sen = senales(p, itemsLib(), today());
    const niv = p.momentum || p.saturacion
      ? html`Momentum <b>${nivelNombre(p.momentum) || '—'}</b> · Saturación <b>${nivelNombre(p.saturacion) || '—'}</b>`
      : html`<span class="vil-sd">${SIN_DATOS}: falta calificar el momentum y la saturación${ed ? ' (Editar)' : ''}</span>`;
    return html`<article class="vil-pat ${p.oportunidad ? 'op' : ''}" id="vil-pat-${p.id}" data-pid="${p.id}" data-estado="${est}" tabindex="-1">
      <header class="vil-pat-h"><h3>${p.nombre}</h3><div class="vil-chips">${chipsDe(p, d)}</div></header>
      <p class="vil-t"><span class="lbl">Hook</span> ${p.hook || html`<span class="vil-sd">${SIN_DATOS}: lo explica la IA o tú (Editar)</span>`}</p>
      <p class="vil-t"><span class="lbl">Por qué funciona</span> ${p.por_que || html`<span class="vil-sd">${SIN_DATOS}: lo explica la IA o tú (Editar)</span>`}</p>
      <p class="vil-t vil-niv"><span class="lbl">Lectura de hoy</span> ${niv}${sen.posts ? html` <span class="mut sm">· ${plural(sen.cuentas || 0, 'cuenta', 'cuentas')}${sen.recientes !== null ? ` · ${sen.recientes} de ${sen.conFecha} posts con fecha son de las últimas 4 semanas` : ''}</span>` : ''}</p>
      <details class="vil-ejs" open><summary>Ejemplos · ${plural(p.items.length, 'post', 'posts')}</summary><ul>${p.items.map(ejemplo)}</ul></details>
      <footer class="vil-acts">
        ${ed ? html`<button type="button" class="btn ghost sm" data-act="vil-editar" data-id="${d.id}" ${off}>${ico('pencil', 14)} Editar</button>` : ''}
        ${ed && est === 'Borrador' ? html`<button type="button" class="btn ghost sm" data-act="vil-estado" data-id="${d.id}" data-a="En revisión" ${off}>Mandar a revisión</button>` : ''}
        ${ed && est === 'En revisión' ? html`<button type="button" class="btn ghost sm" data-act="vil-estado" data-id="${d.id}" data-a="Borrador" ${off}>Devolver a borrador</button>` : ''}
        ${S.puede.aprobar && S.alcance.abierto && est === 'En revisión' ? html`<button type="button" class="btn sm" data-act="vil-estado" data-id="${d.id}" data-a="Aprobado" ${off}>${ico('badge-check', 14)} Aprobar</button>` : ''}
        <button type="button" class="btn ghost sm" data-act="vil-copiar" data-id="${d.id}">${ico('copy', 14)} Copiar</button>
        ${ed ? html`<button type="button" class="btn ghost sm" data-act="vil-archivar" data-id="${d.id}" ${off}>${ico('trash-2', 14)} Archivar</button>` : ''}
      </footer></article>`;
  }
  function pintarLista() {
    const el = $('#vil-lista', root); if (!el) return;
    if (S.cargandoDocs) return mount(el, html`<p class="loading">Cargando los patrones…</p>`);
    if (S.errDocs) return mount(el, html`${fallo({ titulo: 'No pude abrir los patrones', linea: S.errDocs })}`);
    const xs = lista();
    mount(el, xs.length ? html`<div class="vil-pats">${xs.map(tarjeta)}</div>`
      : html`${vacio({ icono: 'inbox', titulo: 'Aún no hay patrones', linea: escribe() ? 'Agrúpalos con IA, sugiérelos por formato y gancho, o crea uno con posts de la Biblioteca. Cada patrón liga al menos 2 posts reales.' : 'Cuando alguien los cree, salen aquí.' , boton: { texto: 'Armarlo en el Chat', chat: { modo: 'marketing', borrador: 'Armemos los patrones de esta marca.' } }})}`);
  }

  // El editor: un patrón nuevo o uno que ya existe. Escribir no repinta los campos (se perdería el foco).
  function abrirEd(id) {
    if (!escribe() || S.ocupado) return;
    const d = id ? S.docs.find((x) => x.id === id) : null; if (id && !d) return;
    S.ed = { id: d?.id || '', v: d?.v, p: clon(d ? limpiarPatron(d.contenido) : limpiarPatron({})), buscar: '' };
    S.tab = 'report'; verTab(); pintarEd();
    $('#vil-ed', root)?.scrollIntoView({ block: 'nearest' }); root.querySelector('[data-ef="nombre"]')?.focus();
  }
  function cerrarEd() { S.ed = null; pintarEd(); }
  function pintarEd() {
    const el = $('#vil-ed', root); if (!el) return;
    const e = S.ed; if (!e) return mount(el, '');
    const p = e.p, opt = (v, l, cur) => html`<option value="${v}" ${cur === v ? raw('selected') : ''}>${l}</option>`;
    mount(el, html`<section class="vil-ed" aria-label="${e.id ? 'Editar patrón' : 'Nuevo patrón'}"><h3>${ico('pencil', 14)} ${e.id ? 'Editar el patrón' : 'Nuevo patrón'}</h3>
      <div class="vil-ed-g">
        <label class="vil-f"><span class="lbl">Nombre</span><input class="in" type="text" data-ef="nombre" maxlength="80" value="${p.nombre}" placeholder="Ej.: Reel · gancho de pregunta" autocomplete="off"></label>
        <label class="vil-f"><span class="lbl">Formato</span><select class="in" data-ef="formato">${opt('', '—', p.formato)}${FORMATOS.map(([k, l]) => opt(k, l, p.formato))}</select></label>
        <label class="vil-f vil-f-w"><span class="lbl">Hook</span><input class="in" type="text" data-ef="hook" maxlength="240" value="${p.hook}" placeholder="Cómo abre, en una frase" autocomplete="off"></label>
        <label class="vil-f vil-f-w"><span class="lbl">Por qué funciona</span><textarea class="in" data-ef="por_que" maxlength="400" rows="3" placeholder="Con la evidencia de los posts">${p.por_que}</textarea></label>
        <label class="vil-f"><span class="lbl">Momentum · ¿está subiendo?</span><select class="in" data-ef="momentum">${opt('', `— ${SIN_DATOS}`, p.momentum)}${NIVELES.map(([k, l]) => opt(k, l, p.momentum))}</select></label>
        <label class="vil-f"><span class="lbl">Saturación · ¿cuántos ya lo usan?</span><select class="in" data-ef="saturacion">${opt('', `— ${SIN_DATOS}`, p.saturacion)}${NIVELES.map(([k, l]) => opt(k, l, p.saturacion))}</select></label>
      </div>
      <p class="mut sm vil-ed-sen" id="vil-ed-sen"></p>
      <div class="vil-pick"><div class="vil-pick-h"><b>Posts de la Biblioteca</b><span class="mut sm" id="vil-ed-n"></span></div>
        <label class="vil-q">${ico('search', 14)}<input class="in" type="search" data-ef="buscar" value="${e.buscar}" placeholder="Buscar cuenta, tema o hook" aria-label="Buscar en la Biblioteca" autocomplete="off"></label>
        <ul class="vil-pick-l" id="vil-ed-pick"></ul></div>
      <ul class="vil-fl" id="vil-ed-faltas" aria-live="polite"></ul>
      <div class="vil-ed-bt"><button type="button" class="btn sm" id="vil-ed-ok" data-act="vil-ed-guardar">${ico('check', 14)} Guardar</button><button type="button" class="btn ghost sm" data-act="vil-ed-cerrar">Cancelar</button></div></section>`);
    pintarPick(); pintarEdFaltas();
  }
  // La lista de posts del editor: los elegidos arriba y luego los de más resonancia que coincidan con la búsqueda.
  function pintarPick() {
    const e = S.ed, el = $('#vil-ed-pick', root); if (!e || !el) return;
    const sel = new Set(e.p.items || []), q = e.buscar.trim().toLowerCase();
    const coincide = (it) => !q || [it.handle, it.title, it.text, hookDe(it), it.why?.por_que].join(' ').toLowerCase().includes(q);
    const elegidos = [...sel].map((k) => ({ k, it: idx().get(k) || null }));
    const resto = itemsLib().filter((it) => !sel.has(claveDe(it)) && coincide(it)).sort((a, z) => (resonanciaDe(z) ?? -1) - (resonanciaDe(a) ?? -1));
    const fila = ({ k, it }) => {
      const x = it ? resonanciaDe(it) : null;
      return html`<li><label class="vil-pk"><input type="checkbox" data-ek="${k}" ${sel.has(k) ? raw('checked') : ''}>
        <span class="vil-pk-t">${it ? [it.handle ? `@${it.handle}` : '', formatoNombre(fmtDe(it)), redNombre(redDe(it)), x ? `×${x}` : 'sin ×'].filter(Boolean).join(' · ') : k}</span>
        <span class="mut sm">${it ? corto(hookDe(it), 80) : '⚠️ Ya no está en la Biblioteca'}</span></label></li>`;
    };
    mount(el, html`${elegidos.map(fila)}${resto.slice(0, 50).map((it) => fila({ k: claveDe(it), it }))}${resto.length > 50 ? html`<li class="mut sm">Hay ${resto.length - 50} más: afina la búsqueda.</li>` : ''}${!elegidos.length && !resto.length ? html`<li class="mut sm">${S.inv ? 'Ningún post coincide.' : '⚠️ SIN DATOS: no pude leer la Biblioteca.'}</li>` : ''}`);
    const n = $('#vil-ed-n', root); if (n) n.textContent = `${sel.size} ${sel.size === 1 ? 'elegido' : 'elegidos'} · mínimo ${MIN_ITEMS}`;
  }
  function pintarEdFaltas() {
    const e = S.ed; if (!e) return;
    const p = limpiarPatron(e.p), fa = faltas(p, extraFaltas()), s = senales(p, itemsLib(), today());
    const el = $('#vil-ed-faltas', root); if (el) mount(el, fa.map((x) => html`<li class="vil-sd">${x}</li>`));
    const ok = $('#vil-ed-ok', root); if (ok) ok.disabled = fa.length > 0 || S.ocupado;
    const sen = $('#vil-ed-sen', root);
    if (sen) sen.textContent = s.posts ? `Señales de estos posts: ${plural(s.cuentas || 0, 'cuenta distinta', 'cuentas distintas')}${s.recientes !== null ? ` · ${s.recientes} de ${s.conFecha} posts con fecha son de las últimas 4 semanas` : ' · sin fechas'}. Con eso decides el momentum y la saturación.` : `${SIN_DATOS}: sin posts elegidos no hay señales para calificar el momentum ni la saturación.`;
  }
  const CAMPOS = ['nombre', 'formato', 'hook', 'por_que', 'momentum', 'saturacion'];
  async function guardarEd() {
    const e = S.ed; if (!e || !escribe() || S.ocupado) return;
    const p = limpiarPatron(e.p), fa = faltas(p, extraFaltas());
    if (fa.length) return toast(fa.join(' · '), true);
    await haz(async () => {
      await guardarPatron(p, { docId: e.id, v: e.v, nuevo: !e.id });
      if (!alive()) return;
      S.ed = null; pintarEd(); repintar(); toast(e.id ? 'Patrón guardado' : 'Patrón creado');
    });
  }

  // ---------- Guardar un patrón (un entregable por patrón; PUT con la v leída) ----------
  const idLibre = (id) => { const usados = new Set(S.docs.map((d) => limpiarPatron(d.contenido).id)); let n = 2, x = id; while (usados.has(x) && n < 100) x = `${id.slice(0, 56)}-${n++}`; return x; };
  // El patrón tal como se guarda: con el multiplicador y las redes de sus posts, el historial de semanas que ya tenía y la lectura de esta semana.
  // conservar: lo que la IA deja vacío (momentum o saturación sin evidencia) no borra lo que ya se había calificado.
  function paraGuardar(p, ex, conservar) {
    const antes = ex ? limpiarPatron(ex.contenido) : null;
    let q = limpiarPatron({ ...p, id: antes?.id || p.id, semanas: antes?.semanas || p.semanas });
    if (conservar && antes) q = limpiarPatron({ ...q, momentum: q.momentum || antes.momentum, saturacion: q.saturacion || antes.saturacion });
    return registrarSemana(recalcular(q, lib()), semanaIso(today()));
  }
  async function guardarPatron(p, { ia = null, docId = '', v, nuevo = false, conservar = false } = {}) {
    const id0 = limpiarPatron(p).id;
    const ex = nuevo ? null : (docId && S.docs.find((d) => d.id === docId)) || S.docs.find((d) => limpiarPatron(d.contenido).id === id0) || null;
    let q = paraGuardar(p, ex, conservar);
    if (!ex) q = limpiarPatron({ ...q, id: idLibre(q.id) });
    const cuerpo = { titulo: q.nombre, contenido: q, ...(ia ? { ia } : {}) };
    const d = ex
      ? await api(`entregables/${enc(ex.id)}`, { method: 'PUT', body: { ...cuerpo, v: v ?? ex.v } })
      : await api('entregables', { method: 'POST', body: { ...cuerpo, tool: T.id, client_slug: slug } });
    poner(d);
    return d;
  }

  // ---------- Estado, archivar y copiar ----------
  async function estado(id, a) {
    const d = S.docs.find((x) => x.id === id); if (!d || !['Borrador', 'En revisión', 'Aprobado'].includes(a)) return;
    if (a === 'Aprobado' && !(await confirmAsk(`¿Aprobar «${limpiarPatron(d.contenido).nombre}» v${d.version || 1}? Queda como patrón aprobado de esta marca.`))) return;
    if (!alive()) return;
    await haz(async () => {
      const r = await api(`entregables/${enc(id)}/estado`, { method: 'POST', body: { a, v: d.v } });
      poner(r); if (alive()) { repintar(); toast(a === 'Aprobado' ? 'Patrón aprobado' : a === 'En revisión' ? 'Mandado a revisión' : 'Devuelto a borrador'); }
    });
  }
  async function archivar(id) {
    const d = S.docs.find((x) => x.id === id); if (!d) return;
    if (!(await confirmAsk(`¿Archivar «${limpiarPatron(d.contenido).nombre}»? No se borra: sale de la lista.`)) || !alive()) return;
    await haz(async () => {
      await api(`entregables/${enc(id)}/archivar`, { method: 'POST', body: { v: d.v, archivado: true } });
      S.docs = S.docs.filter((x) => x.id !== id); if (S.ed?.id === id) S.ed = null;
      if (alive()) { pintarEd(); repintar(); toast('Patrón archivado'); }
    });
  }
  function copiar(id) {
    const d = S.docs.find((x) => x.id === id); if (!d) return;
    const md = aMd(patronDe(d), { items: itemsLib() });
    (navigator.clipboard?.writeText(md) || Promise.reject(new Error('sin portapapeles'))).then(() => toast('Patrón copiado en Markdown'), () => toast('No pude copiar. Inténtalo de nuevo.', true));
  }

  // ---------- Agrupar: con IA o sin ella ----------
  const faltasProp = (p) => faltas(p, extraFaltas());
  // La propuesta (ya con el multiplicador y las redes de la Biblioteca). Se marcan los que se pueden guardar: los que no ligan 2 posts reales no.
  function proponer(patrones, criterios, { via, modelo }) {
    const ps = patrones.map((p) => recalcular(p, lib()));
    S.gen = { fase: 'propuesta', prop: { patrones: ps, criterios: criterios || { cumple: [], falta: [] } }, sel: new Set(ps.map((p, i) => (faltasProp(p).length ? -1 : i)).filter((i) => i >= 0)), via, modelo };
  }
  function leerRespuesta(txt, { via, modelo }) {
    const r = leer(txt);
    if (r && r.contenido.patrones.length) proponer(r.contenido.patrones, r.criterios, { via, modelo });
    else S.gen = { fase: 'sin-bloque', texto: txt, via, modelo };
  }
  function sugerir() {
    if (!escribe() || S.gen?.fase === 'corriendo') return;
    // Lo que ya está guardado no se vuelve a sugerir: un grupo que comparte 2 o más posts con un patrón existente es ese mismo patrón.
    const todos = agrupar(itemsLib()), guardados = S.docs.map((d) => new Set(limpiarPatron(d.contenido).items));
    const ps = todos.filter((p) => !guardados.some((g) => p.items.filter((k) => g.has(k)).length >= MIN_ITEMS)), ya = todos.length - ps.length;
    if (!ps.length) { S.gen = { fase: 'error', soloCerrar: true, error: todos.length ? 'Lo que encontré por formato y gancho ya está en tus patrones. Prueba «Agrupar con IA» o crea uno a mano.' : 'No encontré 2 o más posts con el mismo formato y el mismo tipo de gancho. Prueba «Agrupar con IA» o crea un patrón a mano.' }; return pintarGen(); }
    proponer(ps, ya ? { cumple: [plural(ya, 'grupo ya estaba guardado y no se repite', 'grupos ya estaban guardados y no se repiten')], falta: [] } : null, { via: 'manual', modelo: 'Sugerido por formato y gancho, sin IA' });
    pintarGen(); pintarBarra();
  }
  // Los posts que se le dan a la IA: los de más resonancia primero (el pedido recorta a lo que cabe).
  const topItems = () => [...itemsLib()].sort((a, z) => (resonanciaDe(z) ?? -1) - (resonanciaDe(a) ?? -1)).slice(0, 80);
  async function generar(preferir) {
    if (!escribe() || S.gen?.fase === 'corriendo') return;
    if (itemsLib().length < MIN_ITEMS) return toast('La Investigación todavía no tiene posts: se llena con la primera actualización.', true);
    const ctrl = new AbortController(), mio = () => S.gen?.ctrl === ctrl;
    S.gen = { fase: 'corriendo', texto: '', paso: '', ctrl };
    pintarGen(); pintarBarra();
    try {
      const ctx = await armarCtx(me, { tool: T, slug }); if (!alive() || !mio()) return;
      ctx.items = topItems(); ctx.patrones = S.docs.map((d) => limpiarPatron(d.contenido));
      const out = await correrIA(me, { tool: T, ctx, signal: ctrl.signal, preferir,
        onDelta: (t) => { if (!alive()) return ctrl.abort(); if (mio()) { S.gen.texto = t; verStream(); } },
        onTool: (p) => { if (mio()) { S.gen.paso = String(p || ''); verPaso(); } } });
      if (!alive() || !mio()) return;
      leerRespuesta(out.texto, out);
    } catch (e) {
      if (!alive() || !mio()) return;
      S.gen = e?.name === 'AbortError' || ctrl.signal.aborted ? null : { fase: 'error', error: e?.message || 'La IA no pudo responder' };
    }
    pintarGen(); pintarBarra();
  }
  async function pegar() {
    const v = await ask('Pegar la respuesta', [{ k: 't', t: 'textarea', req: true, l: `Pega la respuesta completa de la IA, con su bloque ${BLOQUE}.` }], 'Leer');
    if (!v || !alive()) return;
    leerRespuesta(v.t, { via: 'manual', modelo: '' });
    pintarGen(); pintarBarra();
  }
  // Guardar lo marcado: uno por patrón. Si ya hay un patrón con ese id, se actualiza (versión nueva); si no, se crea.
  async function guardarSeleccion() {
    const g = S.gen; if (g?.fase !== 'propuesta' || !escribe()) return;
    const ps = g.prop.patrones.filter((_, i) => g.sel.has(i));
    if (!ps.length) return toast('Marca al menos un patrón para guardar.', true);
    await haz(async () => {
      let ok = 0, malos = 0, ultimo = '', avisado = false;
      for (const p of ps) {
        try { await guardarPatron(p, { ia: { via: g.via, modelo: String(g.modelo || '').slice(0, 80) }, conservar: true }); ok++; }
        catch (e) {
          malos++; ultimo = e.message || ultimo;
          if ((e.status === 409 && ['SIN_FICHA', 'CONFLICTO'].includes(e.code)) || e.status === 403) { avisado = true; if (alive()) falla(e); break; } // el resto fallaría igual
        }
      }
      if (!alive()) return;
      if (ok) S.gen = null;
      repintar(); pintarGen();
      if (ok) toast(`${plural(ok, 'patrón guardado', 'patrones guardados')}${malos ? ` · ${malos} no se pudo` : ''}`, Boolean(malos));
      else if (!avisado) toast(ultimo || 'No se pudo guardar. Inténtalo de nuevo.', true);
    });
  }
  const verStream = () => { const pre = $('.vil-stream', root); if (pre && S.gen) { pre.textContent = S.gen.texto || ''; pre.scrollTop = pre.scrollHeight; } };
  const verPaso = () => { const p = $('.vil-paso', root); if (p && S.gen) p.textContent = S.gen.paso || ''; };
  function pintarGen() {
    const el = $('#vil-gen', root); if (!el) return;
    const g = S.gen; if (!g) return mount(el, '');
    const otros = html`<button type="button" class="btn ghost sm" data-act="vil-ia-claude">${ico('refresh-cw', 14)} Probar con claude.ai</button><button type="button" class="btn ghost sm" data-act="vil-pegar">Pegar la respuesta</button><button type="button" class="btn ghost sm" data-act="vil-cerrar-gen">${ico('x', 14)} Cerrar</button>`;
    if (g.fase === 'corriendo') {
      mount(el, html`<section class="vil-gen" data-fase="corriendo"><header><span class="vil-gen-t">${ico('loader-circle', 14)} Agrupando con IA…</span><span class="mut sm vil-paso"></span><button type="button" class="btn ghost sm" data-act="vil-parar">${ico('stop-lleno', 12)} Parar</button></header><pre class="vil-stream" aria-live="polite"></pre></section>`);
      verStream(); verPaso(); return;
    }
    if (g.fase === 'propuesta') {
      const ps = g.prop.patrones, cr = g.prop.criterios || { cumple: [], falta: [] };
      mount(el, html`<section class="vil-prop" data-fase="propuesta"><header><h3>${ico('sparkles', 14)} ${ps.length === 1 ? '1 patrón propuesto' : `${ps.length} patrones propuestos`}</h3><span class="mut sm">${g.modelo || (g.via === 'manual' ? 'Pegada a mano' : g.via)}</span></header>
        <ul class="vil-prop-l">${ps.map((p, i) => {
          const fa = faltasProp(p), ex = docDe(p.id);
          return html`<li class="vil-prop-it" data-i="${i}"><label class="vil-pk"><input type="checkbox" data-pi="${i}" ${g.sel.has(i) ? raw('checked') : ''} ${fa.length ? raw('disabled') : ''}>
            <span class="vil-pk-t"><b>${p.nombre || 'Sin nombre'}</b> <span class="chip sm2">${ex ? `Actualiza la v${ex.version || 1}${['Aprobado', 'Entregado'].includes(ex.estado) ? ' y vuelve a Borrador' : ''}` : 'Nuevo'}</span></span></label>
            <div class="vil-chips">${chipsDe(p, null)}</div>
            ${p.hook ? html`<p class="vil-t"><span class="lbl">Hook</span> ${p.hook}</p>` : ''}${p.por_que ? html`<p class="vil-t"><span class="lbl">Por qué funciona</span> ${p.por_que}</p>` : ''}
            <p class="mut sm">${plural(p.items.length, 'post', 'posts')}${p.momentum || p.saturacion ? ` · momentum ${nivelNombre(p.momentum) || '—'} · saturación ${nivelNombre(p.saturacion) || '—'}` : ` · ${SIN_DATOS}: sin momentum ni saturación`}</p>
            ${fa.length ? html`<ul class="vil-fl">${fa.map((x) => html`<li class="vil-sd">${x}</li>`)}</ul>` : ''}</li>`;
        })}</ul>
        ${(cr.cumple || []).length + (cr.falta || []).length ? html`<ul class="vil-crit">${(cr.cumple || []).map((x) => html`<li class="ok"><span aria-hidden="true">✓</span><span class="sr-only">Cumple: </span>${x}</li>`)}${(cr.falta || []).map((x) => html`<li class="falta"><span aria-hidden="true">✗</span><span class="sr-only">Falta: </span>${x}</li>`)}</ul>` : ''}
        <p class="mut sm">Nada se guarda hasta que presiones Guardar. Los que ya existen se actualizan con una versión nueva.</p>
        <div class="vil-prop-bt"><button type="button" class="btn sm" id="vil-prop-ok" data-act="vil-guardar-prop" ${g.sel.size && !S.ocupado ? '' : raw('disabled')}>${ico('check', 14)} Guardar <span id="vil-prop-n">${g.sel.size}</span></button>
          ${g.via === 'manual' && g.modelo ? html`<button type="button" class="btn ghost sm" data-act="vil-ia">${ico('sparkles', 14)} Agrupar con IA</button>` : html`<button type="button" class="btn ghost sm" data-act="vil-ia">${ico('refresh-cw', 14)} Reintentar</button>`}<button type="button" class="btn ghost sm" data-act="vil-cerrar-gen">Descartar</button></div></section>`);
      return;
    }
    mount(el, html`<section class="vil-gen" data-fase="${g.fase}" role="alert"><p>${g.fase === 'error' ? g.error : 'No vino ningún patrón con posts reales de la lista. Reintenta o pega la respuesta.'}</p>
      ${g.fase === 'sin-bloque' && g.texto ? html`<details><summary>Ver lo que respondió</summary><pre class="vil-stream">${g.texto}</pre></details>` : ''}
      <div class="vil-prop-bt">${g.soloCerrar ? html`<button type="button" class="btn sm" data-act="vil-ia">${ico('sparkles', 14)} Agrupar con IA</button><button type="button" class="btn ghost sm" data-act="vil-cerrar-gen">${ico('x', 14)} Cerrar</button>` : html`<button type="button" class="btn sm" data-act="vil-ia">${ico('refresh-cw', 14)} Reintentar</button>${otros}`}</div></section>`);
  }

  // ---------- Trend Radar ----------
  function svgRadar(r) {
    const cx = (x) => Math.round((X0 + x * AW) * 10) / 10, cy = (y) => Math.round((Y0 + (1 - y) * AH) * 10) / 10, mw = AW / 2, mh = AH / 2;
    const quad = (q, x, y) => html`<g class="vil-quad" data-q="${q}"><rect x="${x}" y="${y}" width="${mw}" height="${mh}" fill="currentColor" fill-opacity="${q === 'oportunidad' ? 0.1 : 0.03}"></rect><text class="vil-quad-t" x="${x + 10}" y="${y + 20}" font-size="12" fill="currentColor" fill-opacity="0.65">${CUADRANTES[q].nombre}</text></g>`;
    const pts = r.puntos.map((p) => {
      const rad = 6 + Math.min(p.n, 8), x = cx(p.x), y = cy(p.y), der = x > X0 + AW * 0.7;
      return html`<g class="vil-pt" data-q="${p.cuadrante}" data-act="vil-ver" data-pid="${p.id}" tabindex="0" role="button" aria-label="${p.nombre}: momentum ${p.momentum}, saturación ${p.saturacion}">
        <title>${p.nombre} · momentum ${p.momentum} · saturación ${p.saturacion}${p.multiplicador ? ` · ×${p.multiplicador}` : ''} · ${plural(p.n, 'post', 'posts')}</title>
        <circle cx="${x}" cy="${y}" r="${rad}" fill="currentColor" fill-opacity="0.75"></circle>
        <text class="vil-pt-t" x="${der ? x - rad - 5 : x + rad + 5}" y="${y + 4}" text-anchor="${der ? 'end' : 'start'}" font-size="11" fill="currentColor">${corto(p.nombre, 24)}</text></g>`;
    });
    return html`<svg class="vil-svg" viewBox="0 0 560 424" role="img" aria-label="Trend Radar: momentum contra saturación de cada patrón" xmlns="http://www.w3.org/2000/svg">
      ${quad('oportunidad', X0, Y0)}${quad('competido', X0 + mw, Y0)}${quad('dormido', X0, Y0 + mh)}${quad('quemado', X0 + mw, Y0 + mh)}
      <rect x="${X0}" y="${Y0}" width="${AW}" height="${AH}" fill="none" stroke="currentColor" stroke-opacity="0.3"></rect>
      <line x1="${X0 + mw}" y1="${Y0}" x2="${X0 + mw}" y2="${Y0 + AH}" stroke="currentColor" stroke-opacity="0.25" stroke-dasharray="4 4"></line>
      <line x1="${X0}" y1="${Y0 + mh}" x2="${X0 + AW}" y2="${Y0 + mh}" stroke="currentColor" stroke-opacity="0.25" stroke-dasharray="4 4"></line>
      <g font-size="11" fill="currentColor" fill-opacity="0.65">
        <text x="${X0}" y="${Y0 + AH + 16}">Baja</text><text x="${X0 + mw}" y="${Y0 + AH + 16}" text-anchor="middle">Media</text><text x="${X0 + AW}" y="${Y0 + AH + 16}" text-anchor="end">Alta</text>
        <text x="${X0 - 8}" y="${Y0 + 10}" text-anchor="end">Alto</text><text x="${X0 - 8}" y="${Y0 + mh + 4}" text-anchor="end">Medio</text><text x="${X0 - 8}" y="${Y0 + AH}" text-anchor="end">Bajo</text>
        <text x="${X0 + mw}" y="${Y0 + AH + 36}" text-anchor="middle">Saturación: cuántas cuentas ya lo usan →</text>
        <text transform="rotate(-90 12 ${Y0 + mh})" x="12" y="${Y0 + mh}" text-anchor="middle">Momentum: ¿está subiendo? →</text></g>
      ${pts}</svg>`;
  }
  function listaRadar(r) {
    return html`<div class="vil-cuads">${Object.keys(CUADRANTES).map((q) => {
      const xs = r.puntos.filter((p) => p.cuadrante === q);
      return xs.length ? html`<section class="vil-cuad" data-q="${q}"><h3>${CUADRANTES[q].nombre} <span class="vil-n">${xs.length}</span></h3><p class="mut sm">${CUADRANTES[q].que}</p>
        <ul>${xs.map((p) => html`<li><button type="button" class="vil-link" data-act="vil-ver" data-pid="${p.id}">${p.nombre}</button>${p.multiplicador ? html` <span class="mut sm">×${p.multiplicador}</span>` : ''}</li>`)}</ul></section>` : '';
    })}
      ${r.sinDato.length ? html`<section class="vil-cuad vil-sin"><h3>Sin calificar <span class="vil-n">${r.sinDato.length}</span></h3>
        <p class="vil-sd">${SIN_DATOS}: falta el momentum y la saturación${r.semana ? ' de esa semana' : ''}. Se califican al editar el patrón en Pattern Report.</p>
        <ul>${r.sinDato.map((p) => html`<li><button type="button" class="vil-link" data-act="vil-ver" data-pid="${p.id}">${p.nombre}</button> <span class="mut sm">${p.falta === 'ambos' ? 'falta todo' : `falta ${p.falta === 'momentum' ? 'el momentum' : 'la saturación'}`}</span></li>`)}</ul></section>` : ''}</div>`;
  }
  const semanasRadar = () => semanasDe(S.docs.map((d) => d.contenido));
  // El radar de la semana que marca el slider (la última posición es «Hoy»): solo se repinta la gráfica y las listas, no el slider.
  function pintarRadarVista() {
    const el = $('#vil-radar-vista', root); if (!el) return;
    const W = semanasRadar(), i = S.semHoy ? W.length : Math.min(S.semIdx, W.length), r = trendRadar(S.docs.map((d) => d.contenido), i >= W.length ? '' : W[i]);
    mount(el, html`${r.puntos.length ? svgRadar(r) : html`${vacio({ icono: 'inbox', titulo: `${S.docs.length ? 'Nada que dibujar en esta semana' : 'Todavía no hay patrones'}`, linea: html`${S.docs.length ? `${SIN_DATOS}: ningún patrón tiene momentum y saturación${i < W.length ? ' en esa semana' : ''}. Se califican al editarlos en Pattern Report.` : 'Se crean en Pattern Report: agrúpalos con IA o créalos con posts de la Biblioteca.'}` })}`}${listaRadar(r)}`);
  }
  function pintarRadar() {
    const el = $('#vil-radar', root); if (!el) return;
    if (S.cargandoDocs) return mount(el, html`<p class="loading">Cargando el radar…</p>`);
    if (S.errDocs) return mount(el, html`${fallo({ titulo: 'No pude abrir los patrones', linea: S.errDocs })}`);
    const W = semanasRadar(), i = S.semHoy ? W.length : Math.min(S.semIdx, W.length);
    mount(el, html`<div class="vil-radar-h"><p class="mut sm">Momentum contra saturación de cada patrón. Cada vez que guardas un patrón con su momentum y su saturación queda la lectura de esa semana.</p></div>
      ${W.length ? html`<div class="vil-sem"><label class="lbl" for="vil-sem-r">Semana</label><input id="vil-sem-r" class="vil-sem-r" type="range" min="0" max="${W.length}" step="1" value="${i}" aria-describedby="vil-sem-o"><output id="vil-sem-o" class="vil-sem-o" for="vil-sem-r">${semTxt(i >= W.length ? '' : W[i])}${i < W.length ? ' · la última lectura hasta esa semana' : ' · lo que dicen hoy'}</output></div>`
        : html`<p class="mut sm vil-sem-n">El slider de semana se arma solo con las lecturas guardadas: todavía no hay ninguna.</p>`}
      <div id="vil-radar-vista"></div>`);
    pintarRadarVista();
  }

  // ---------- Oportunidades ----------
  function pintarOp() {
    const el = $('#vil-op', root); if (!el) return;
    if (S.cargandoDocs) return mount(el, html`<p class="loading">Cargando las oportunidades…</p>`);
    if (S.errDocs) return mount(el, html`${fallo({ titulo: 'No pude abrir los patrones', linea: S.errDocs })}`);
    const ops = lista().filter(({ p }) => p.oportunidad), estudio = herramientaDe('content-strategy-studio'), abre = !estudio || typeof estudio.puede !== 'function' || Boolean(estudio.puede(me, b));
    mount(el, html`<p class="mut sm vil-op-s">Momentum alto y saturación baja: sube y casi nadie lo usa.</p>
      ${ops.length ? html`<div class="vil-pats">${ops.map(({ d, p }) => html`<article class="vil-pat op" data-pid="${p.id}" data-estado="${d.estado || 'Borrador'}">
        <header class="vil-pat-h"><h3>${p.nombre}</h3><div class="vil-chips">${chipsDe(p, d)}</div></header>
        <p class="vil-t"><span class="lbl">Hook</span> ${p.hook || html`<span class="vil-sd">${SIN_DATOS}</span>`}</p>
        <p class="vil-t"><span class="lbl">Por qué funciona</span> ${p.por_que || html`<span class="vil-sd">${SIN_DATOS}</span>`}</p>
        <p class="mut sm">${plural(p.items.length, 'post de ejemplo', 'posts de ejemplo')} · <button type="button" class="vil-link" data-act="vil-ver" data-pid="${p.id}">Ver los ejemplos</button></p>
        <footer class="vil-acts">${abre ? html`<a class="btn sm" href="${rutaHerramienta('marketing', slug, 'content-strategy-studio')}">Mandar a Content Strategy Studio ${ico('arrow-right', 14)}</a>` : html`<span class="mut sm">Tu perfil no abre Content Strategy Studio.</span>`}
          <span class="chip sm2 vil-pronto" title="El Hook Laboratory llega en la Fase 3e">Hook Lab: llega en la Fase 3e</span>
          <button type="button" class="btn ghost sm" data-act="vil-copiar" data-id="${d.id}">${ico('copy', 14)} Copiar el patrón</button></footer></article>`)}</div>`
        : html`${vacio({ icono: 'inbox', titulo: 'Aún no hay oportunidades', linea: S.docs.length ? 'Un patrón es oportunidad con momentum alto y saturación baja. Califícalos en Pattern Report o mira el Trend Radar.' : 'Primero se crean los patrones en Pattern Report.' , boton: { texto: 'Armarlo en el Chat', chat: { modo: 'marketing', borrador: 'Armemos las oportunidades de esta marca.' } }})}`}`);
  }

  // ---------- Pintar ----------
  // Los datos cambiaron (los patrones o la Biblioteca): se repintan las pestañas con datos. El editor y la propuesta no se tocan.
  function repintar() { pintarAviso(); pintarTabs(); pintarBarra(); pintarLista(); pintarRadar(); pintarOp(); }
  mount(host, html`<div class="vil" id="vil"><div id="vil-aviso"></div><div id="vil-tabs"></div>
    <section class="vil-panel" id="vil-p-library" role="tabpanel" ${S.tab === 'library' ? '' : raw('hidden')}><div id="vil-lib"></div></section>
    <section class="vil-panel" id="vil-p-radar" role="tabpanel" ${S.tab === 'radar' ? '' : raw('hidden')}><div id="vil-radar"></div></section>
    <section class="vil-panel" id="vil-p-report" role="tabpanel" ${S.tab === 'report' ? '' : raw('hidden')}><div id="vil-barra"></div><div id="vil-gen" aria-live="polite"></div><div id="vil-ed"></div><div id="vil-lista"></div></section>
    <section class="vil-panel" id="vil-p-oportunidades" role="tabpanel" ${S.tab === 'oportunidades' ? '' : raw('hidden')}><div id="vil-op"></div></section></div>`);
  root = $('#vil', host);

  acts(root, {
    'vil-tab': (el) => { S.tab = TAB_IDS.includes(el.dataset.t) ? el.dataset.t : 'library'; verTab(); },
    'vil-ver': (el) => verPatron(el.dataset.pid),
    'vil-ia': () => generar(), 'vil-ia-claude': () => generar('claude-web'), 'vil-parar': () => S.gen?.ctrl?.abort(),
    'vil-sugerir': sugerir, 'vil-pegar': pegar, 'vil-guardar-prop': guardarSeleccion, 'vil-cerrar-gen': () => { S.gen?.ctrl?.abort(); S.gen = null; pintarGen(); pintarBarra(); },
    'vil-nuevo': () => abrirEd(''), 'vil-editar': (el) => abrirEd(el.dataset.id), 'vil-ed-guardar': guardarEd, 'vil-ed-cerrar': cerrarEd,
    'vil-estado': (el) => estado(el.dataset.id, el.dataset.a), 'vil-archivar': (el) => archivar(el.dataset.id), 'vil-copiar': (el) => copiar(el.dataset.id),
  });
  // Escribir en el editor guarda en memoria (sin repintar los campos); los checkboxes eligen posts; el slider cambia la semana del radar.
  const alCambiar = (e) => {
    const t = e.target;
    if (!t || !root.contains(t)) return;
    if (t.id === 'vil-sem-r') {
      const W = semanasRadar(), v = Math.max(0, Math.min(W.length, Math.round(+t.value) || 0));
      S.semIdx = v; S.semHoy = v >= W.length;
      const o = $('#vil-sem-o', root); if (o) o.textContent = `${semTxt(S.semHoy ? '' : W[v])}${S.semHoy ? ' · lo que dicen hoy' : ' · la última lectura hasta esa semana'}`;
      return pintarRadarVista();
    }
    if (t.dataset.pi !== undefined && e.type === 'change') {
      const i = +t.dataset.pi; if (!S.gen?.sel || !Number.isInteger(i)) return;
      if (t.checked) S.gen.sel.add(i); else S.gen.sel.delete(i);
      const n = $('#vil-prop-n', root), ok = $('#vil-prop-ok', root); if (n) n.textContent = String(S.gen.sel.size); if (ok) ok.disabled = !S.gen.sel.size || S.ocupado;
      return;
    }
    const ed = S.ed; if (!ed) return;
    if (t.dataset.ef === 'buscar') { ed.buscar = t.value; return pintarPick(); }
    if (CAMPOS.includes(t.dataset.ef)) { ed.p[t.dataset.ef] = t.value; return pintarEdFaltas(); }
    if (t.dataset.ek !== undefined && e.type === 'change') {
      const k = t.dataset.ek, hay = (ed.p.items || []).includes(k);
      if (t.checked && !hay) ed.p.items = [...(ed.p.items || []), k]; else if (!t.checked && hay) ed.p.items = ed.p.items.filter((x) => x !== k);
      const n = $('#vil-ed-n', root), c = (ed.p.items || []).length; if (n) n.textContent = `${c} ${c === 1 ? 'elegido' : 'elegidos'} · mínimo ${MIN_ITEMS}`;
      return pintarEdFaltas();
    }
  };
  root.addEventListener('input', alCambiar);
  root.addEventListener('change', alCambiar);
  // Los puntos del radar también se abren con el teclado.
  root.addEventListener('keydown', (e) => {
    const pt = e.target?.closest?.('.vil-pt');
    if (pt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); verPatron(pt.dataset.pid); }
  });

  // Primer pintado: la pestaña pedida ya se ve (la Library monta su embed sin esperar los datos); los patrones y la Biblioteca llegan después.
  S.antes = S.tab; verTab();
  repintar();
  await Promise.all([cargarDocs(), cargarInv()]);
  if (!alive()) return;
  repintar();
}
