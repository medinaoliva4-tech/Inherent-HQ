// El Tool Shell (PLAN-WORKSPACES §5.1): el marco común de toda herramienta con entregable. La herramienta solo pinta su
// Visual Workspace en el centro (su vista); el shell pone la cabecera, la entrada, las acciones, los criterios y el
// aprendizaje, y habla con las rutas de entregables y con la IA (ia-herramienta.js). Existe para que cada herramienta no
// reinvente estados, versiones, aprobación ni exportar. El permiso lo pone el servidor: aquí solo se refleja.
// Strategy (Fase 3a): una herramienta con aprobarConBloque (Offer Architect) no se aprueba con /estado: el CEO la aprueba y la reabre con la
// ruta de su bloque (POST estrategia/<slug>/<bloque>/aprobar) y el servidor deja el entregable Aprobado o en Borrador. Con la estrategia
// aprobada (alcance APROBADO) toda la herramienta queda en solo lectura, con otro aviso que el de «fuera del alcance».
import { html, raw, mount, api, ico, toast, confirmAsk, ask, acts, fdate, skel, techDetail, $ } from './core.js';
import { herramientaDe, rutaHerramienta, WORKSPACES } from './herramientas.js';
import { abrirEnChat } from './areas.js';
import { pasoPermitido, faltas as faltasEntregable } from './entregables.js';
import { armarCtx, correrIA } from './ia-herramienta.js';
import { etapaDe, bloqueDe } from './estrategia.js';

const K_PLEGADO = 'os.tsh.input';
const TRABADO = { oferta: 'La oferta', modelo: 'El modelo', leads: 'Los leads', capacidad: 'La capacidad' };
const enc = encodeURIComponent;
const quien = (p) => String(p || '').split('@')[0]; // el rol o el nombre, nunca el correo completo
const clon = (x) => { try { return JSON.parse(JSON.stringify(x ?? {})); } catch { return {}; } };
const reciente = (a, z) => String(z._meta?.updated_at || z._meta?.created_at || '').localeCompare(String(a._meta?.updated_at || a._meta?.created_at || ''));
const rutaDoc = (id) => 'entregables/' + enc(id);
const SIN_CRITERIOS = { cumple: [], falta: [] };
const tareasTxt = (n) => (n === 1 ? '1 tarea' : `${n} tareas`);
const TEXTO_APROBADA = 'La estrategia está aprobada: solo lectura hasta que el CEO la reabra';

// host: dónde se monta · tool: el registro de herramientas.js (con prompt, leer, faltas, aMd…) · vista: la de la herramienta
// (consulting/<m>-ui.js) · resto[0]: el id de un entregable que se quiere abrir. Devuelve cuando el primer pintado terminó.
export async function toolShell(host, { me, tool, slug, b, alive, vista, resto = [] }) {
  if (!vista) return mount(host, html`<div class="empty"><b>${tool.nombre} todavía no tiene su vista</b>Mientras, lo que ya tengas se trabaja en el Chat.</div>`);
  mount(host, skel('pagina'));

  const modo = WORKSPACES.find((w) => w.id === tool.ws)?.modo || '';
  const puedeIA = typeof tool.prompt === 'function' && typeof tool.leer === 'function';
  const S = { items: [], puede: { editar: false, aprobar: false }, alcance: { abierto: true, code: '', texto: '' }, doc: null, local: null, contenido: {}, sucio: false,
    ctx: null, gen: null, cmp: null, ocupado: false, pintando: false, plegado: false, k: {} };
  try { S.plegado = localStorage.getItem(K_PLEGADO) === '1'; } catch {}
  let root = null;

  // ---------- Qué se puede hacer ----------
  const escribe = () => S.puede.editar && S.alcance.abierto && !S.doc?.archivado;
  // Aprobado con su bloque (Offer Architect): el contenido se cierra hasta que el CEO lo reabra (el servidor responde 409 APROBADO).
  const cerrado = () => Boolean(tool.aprobarConBloque) && ['Aprobado', 'Entregado'].includes(estadoDe());
  // Cambiar el contenido. En Aprobado o Entregado también (editar crea una versión nueva y vuelve a Borrador), salvo si es cerrado().
  const editable = () => escribe() && !cerrado();
  const nombreBloque = () => bloqueDe(tool.aprobarConBloque)?.nombre || tool.aprobarConBloque || '';
  const estadoDe = () => S.doc?.estado || 'Borrador';
  const aprueba = () => (tool.aprueba === 'ceo' ? 'CEO' : 'COO');
  // Las faltas: las que dejó la IA o la persona en el doc, más las que calcula la herramienta sobre lo que hay en pantalla.
  function faltasAhora() {
    const extra = { entradas: S.doc?.entradas || [], ctx: S.ctx }, out = new Set();
    const docLike = { tool: tool.id, contenido: S.contenido, criterios: S.doc?.criterios || SIN_CRITERIOS };
    try { faltasEntregable(docLike, extra).forEach((x) => out.add(String(x))); } catch {}
    try { (tool.faltas?.(S.contenido, extra) || []).forEach((x) => out.add(String(x))); } catch {}
    return [...out];
  }
  const hayCambio = (id, key) => { const k = JSON.stringify(key); if (S.k[id] === k) return false; S.k[id] = k; return true; };

  // ---------- Cargar ----------
  function nuevoLocal() {
    S.doc = null; S.local = { criterios: clon(SIN_CRITERIOS), ia: { via: 'manual', modelo: '' } }; S.sucio = false; S.cmp = null;
    let c = {}; if (S.alcance.abierto) { try { c = vista.nuevo(S.ctx) ?? {}; } catch { c = {}; } }
    S.contenido = clon(c);
  }
  // La lista del cliente y su alcance; abre el entregable pedido, si no el más reciente, si no un borrador local.
  async function cargar({ abrir = '' } = {}) {
    const r = await api(`entregables?ws=${enc(tool.ws)}&slug=${enc(slug)}&tool=${enc(tool.id)}`);
    if (!alive()) return;
    S.items = (r.items || []).filter((d) => !d.archivado).sort(reciente);
    S.puede = { editar: Boolean(r.puede?.editar), aprobar: Boolean(r.puede?.aprobar) };
    S.alcance = { abierto: r.alcance?.abierto !== false, code: r.alcance?.code || '', texto: r.alcance?.texto || '' };
    let doc = abrir ? S.items.find((d) => d.id === abrir) : null;
    if (!doc && abrir) { // uno archivado no sale en la lista: se pide por su id (si es de esta herramienta y de este cliente)
      const d = await api(rutaDoc(abrir)).catch(() => null);
      if (!alive()) return;
      if (d && d.tool === tool.id && String(d.client_slug || '').toLowerCase() === slug.toLowerCase()) doc = d;
    }
    doc = doc || S.items[0] || null;
    S.ctx = await armarCtx(me, { tool, slug, entradas: doc?.entradas || [] });
    if (!alive()) return;
    S.cmp = null; S.sucio = false;
    if (doc) { S.doc = doc; S.local = null; S.contenido = clon(doc.contenido); } else nuevoLocal();
  }
  async function recargar() {
    try { await cargar({ abrir: S.doc?.id || '' }); } catch (e) { if (alive()) toast(e.message, true); return; }
    if (alive()) pintarTodo();
  }
  // La dirección lleva el id del entregable abierto (sin recargar la página ni agregar un paso al historial).
  const marcarRuta = () => { try { history.replaceState(null, '', rutaHerramienta(tool.ws, slug, tool.id, S.doc ? [S.doc.id] : [])); } catch {} };
  // Lo que devuelve el servidor se vuelve el doc de la pantalla. conservar: no tocar lo que la persona está editando.
  function aplicarDoc(d, { conservar = false } = {}) {
    S.doc = d; S.local = null;
    const i = S.items.findIndex((x) => x.id === d.id);
    if (d.archivado) S.items = S.items.filter((x) => x.id !== d.id); else if (i >= 0) S.items[i] = d; else S.items.unshift(d);
    if (conservar) { S.k = {}; pintarHead(); pintarActs(); pintarCrit(); pintarPie(); pintarInput(); pintarAviso(); return; }
    S.contenido = clon(d.contenido); S.sucio = false; S.cmp = null; marcarRuta(); pintarTodo();
  }

  // ---------- Errores y envoltura de acciones ----------
  function falla(e) {
    if (e?.name === 'AbortError') return;
    if (e?.status === 409 && e.code === 'CONFLICTO') { toast('Alguien lo cambió justo ahora. Recarga y vuelve a intentar', true); recargar(); return; }
    if (e?.status === 409 && e.code === 'APROBADO') { toast(e.message || 'Está aprobado: el CEO tiene que reabrirlo para cambiarlo.', true); refrescarAlcance(); return; }
    if (e?.status === 403 && e.code === 'FUERA_DEL_ALCANCE') { S.alcance = { abierto: false, code: e.code, texto: e.message || S.alcance.texto }; pintarTodo(); return; }
    if (e?.status === 400 && e.code === 'FALTAS') { const f = faltasAhora(); toast(`No se puede aprobar. Falta: ${(f.length ? f : [e.message]).join(' · ')}`, true); return; }
    toast(e?.message || 'No se pudo completar. Inténtalo de nuevo.', true);
  }
  // Un 409 APROBADO: la estrategia (o la oferta) se aprobó mientras se trabajaba. Se vuelve a leer el alcance y el entregable sin tocar lo que
  // hay en pantalla (lo que la persona venía editando no se pierde).
  async function refrescarAlcance() {
    try {
      const r = await api(`entregables?ws=${enc(tool.ws)}&slug=${enc(slug)}&tool=${enc(tool.id)}`);
      if (!alive()) return;
      S.alcance = { abierto: r.alcance?.abierto !== false, code: r.alcance?.code || '', texto: r.alcance?.texto || '' };
      S.puede = { editar: Boolean(r.puede?.editar), aprobar: Boolean(r.puede?.aprobar) };
      S.items = (r.items || []).filter((d) => !d.archivado).sort(reciente);
      const nuevo = S.doc ? S.items.find((d) => d.id === S.doc.id) : null;
      if (nuevo) S.doc = nuevo;
    } catch { return; }
    S.k = {}; pintarHead(); pintarBanner(); pintarActs(); pintarAviso(); pintarVista(); pintarCrit();
  }
  const haz = async (fn) => {
    if (S.ocupado) return;
    S.ocupado = true; pintarActs();
    try { await fn(); } catch (e) { if (alive()) falla(e); }
    if (!alive()) return;
    S.ocupado = false; pintarActs();
  };

  // ---------- Pintar ----------
  function pintarHead() {
    const d = S.doc, est = estadoDe(), el = $('#tsh-head', root); if (!el) return;
    const opciones = S.items.map((x) => html`<option value="${x.id}" ${d?.id === x.id ? raw('selected') : ''}>${x.titulo || tool.nombre}${x.ciclo ? ` · ${x.ciclo}` : ''} · v${x.version} · ${x.estado}</option>`);
    const selector = escribe() && (S.items.length || d)
      ? html`<select class="in tsh-doc" data-act="tsh-abrir" aria-label="Elegir entregable">${opciones}<option value="__nuevo" ${d ? '' : raw('selected')}>${d ? '+ Borrador nuevo' : 'Borrador nuevo (sin guardar)'}</option></select>` : '';
    mount(el, html`<header class="tsh-head"><div class="tsh-head-t"><h2>${ico(tool.icono || 'target', 16)} ${tool.nombre}</h2><span class="tsh-cli">${b?.name || slug}</span></div>
      <div class="tsh-head-m"><span class="chip tsh-estado" data-estado="${est}">${est}</span>
        ${d ? html`<span class="tsh-ver">v${d.version}</span>` : ''}
        ${!d || S.sucio ? html`<span class="chip tsh-sucio">Sin guardar</span>` : ''}
        <span class="tsh-dueno" title="Quién aprueba esta herramienta">Dueño · ${aprueba()}</span>${selector}</div></header>`);
  }
  function pintarBanner() {
    const a = S.alcance, el = $('#tsh-banner', root); if (!el) return;
    if (a.abierto) return mount(el, '');
    // La estrategia aprobada cierra Strategy: no es un problema de alcance sino el candado del CEO (otro tono: «Aprobada», no «Fuera del alcance»).
    if (a.code === 'APROBADO') return mount(el, html`<div class="tsh-aprobada" role="status" data-code="APROBADO">${ico('lock', 16)}<div><p>${a.texto || TEXTO_APROBADA}</p><b>Aprobada · solo lectura</b>${me.role === 'ceo' ? html` <a class="tsh-aprobada-a" href="${rutaHerramienta('strategy', slug, 'growth-roadmap')}">Reabrirla en Growth Roadmap</a>` : ''}</div></div>`);
    mount(el, html`<div class="tsh-fuera" role="alert" data-code="${a.code}">${ico('triangle-alert', 16)}<div><p>${a.texto || 'Este cliente no tiene esta herramienta dentro de lo que contrató.'}</p><b>${a.code === 'SIN_FICHA' ? 'SIN FICHA DE OFERTA' : 'FUERA DEL ALCANCE'} · escálalo al CEO</b></div></div>`);
  }
  function pintarInput() {
    const el = $('#tsh-input', root); if (!el) return;
    const c = S.ctx, ents = S.doc?.entradas || [], de = (tool.viene_de || []).map((id) => herramientaDe(id)?.nombre || id);
    const nivel = b?.nivel?.nombre || c?.cliente?.nivel?.nombre || '', es = c?.estrategia, e = es?.etapa ? etapaDe(es.etapa.n) : null;
    const sinDatos = (de2) => html`<span class="tsh-sindatos">⚠️ SIN DATOS: sale de ${de2}</span>`;
    mount(el, html`<button type="button" class="tsh-input-bt" data-act="tsh-plegar" aria-expanded="${S.plegado ? 'false' : 'true'}" aria-controls="tsh-input-cuerpo">${ico('panel-left', 16)}<span>Entrada</span></button>
      <div class="tsh-input-cuerpo" id="tsh-input-cuerpo">
        <section class="tsh-in-sec"><h3>Cliente</h3><p class="tsh-in-cli">${b?.name || slug}</p><p class="mut sm">${nivel || sinDatos('la ficha de oferta del cliente')}</p></section>
        <section class="tsh-in-sec"><h3>Estrategia del cliente</h3><ul class="tsh-in-lis">
          <li><span class="mut sm">Etapa</span> ${e ? html`${e.n} · ${e.nombre}${es.etapa.confirmada ? '' : html` <span class="mut sm">· sin confirmar</span>`}` : sinDatos('el Business X-Ray de Strategy')}</li>
          <li><span class="mut sm">Trabado en</span> ${es?.trabado ? TRABADO[es.trabado] : sinDatos('el Business X-Ray de Strategy')}</li>
          <li><span class="mut sm">Meta</span> ${es?.meta || sinDatos('la estrategia en vivo')}</li></ul></section>
        <section class="tsh-in-sec"><h3>Entradas</h3>${ents.length
          ? html`<ul class="tsh-in-ents">${ents.map((x) => { const h = herramientaDe(x.tool); return html`<li><a href="${rutaHerramienta(h?.ws || tool.ws, slug, x.tool, [x.deliverable_id])}">${h?.nombre || x.tool}</a> <span class="tsh-ver">v${x.version}</span></li>`; })}</ul>`
          : sinDatos(de.length ? de.join(' · ') : 'la ficha del cliente y de lo que escribas aquí')}</section></div>`);
  }
  function pintarActs() {
    const el = $('#tsh-acts', root); if (!el) return;
    const d = S.doc, est = estadoDe(), esc = escribe(), edit = editable(), fa = faltasAhora(), corriendo = S.gen?.fase === 'corriendo';
    if (!hayCambio('acts', [S.sucio, S.ocupado, S.gen?.fase, d?.id, est, d?.version, d?.archivado, fa.length, S.puede, S.alcance.abierto, S.alcance.code, Boolean(S.cmp), (d?.tareas || []).length])) return;
    const btn = (act, icono, txt, { primario = false, off = false, tip = '', tool: t = '' } = {}) => html`<button type="button" class="btn ${primario ? '' : 'ghost'} sm tsh-act" data-act="tsh-${act}" ${t ? html`data-tool="${t}"` : ''} title="${tip}" ${off ? raw('disabled') : ''}>${ico(icono, 14)} ${txt}</button>`;
    const flujo = [], salida = [];
    const g1 = [
      edit && puedeIA ? btn('generar', 'sparkles', 'Generar con IA', { primario: true, off: corriendo }) : '',
      edit ? btn('guardar', 'check', d ? 'Guardar' : 'Guardar borrador', { off: Boolean(d) && !S.sucio }) : '',
      esc && S.sucio ? btn('descartar-cambios', 'x', 'Descartar cambios') : '',
      d ? btn('comparar', 'layers', 'Comparar versiones', { off: d.version < 2, tip: d.version < 2 ? 'Todavía hay una sola versión' : '' }) : '',
    ];
    if (d && esc && pasoPermitido(est, 'En revisión') === 'edita') flujo.push(btn('enviar-rev', 'send', 'Enviar a revisión'));
    if (d && esc && pasoPermitido(est, 'Borrador') === 'edita') flujo.push(btn('devolver', 'arrow-left', 'Devolver a borrador'));
    if (d && !d.archivado && S.puede.aprobar && S.alcance.abierto && tool.aprobarConBloque) {
      // Offer Architect: se aprueba y se reabre con su bloque (solo el CEO), nunca con /estado.
      if (cerrado()) flujo.push(btn('reabrir', 'refresh-cw', 'Reabrir', { tip: `Regresa el bloque ${nombreBloque()} y este entregable a Borrador` }));
      else if (['Borrador', 'En revisión'].includes(est)) flujo.push(html`<span class="tsh-tip" title="${fa.length ? `No se puede aprobar. Falta: ${fa.join(' · ')}` : `Se aprueba con el bloque ${nombreBloque()} (solo el CEO)`}">${btn('aprobar', 'badge-check', 'Aprobar', { primario: true, off: fa.length > 0 || S.sucio })}</span>`);
    } else if (d && S.puede.aprobar && S.alcance.abierto && pasoPermitido(est, 'Aprobado') === 'aprobador') flujo.push(html`<span class="tsh-tip" title="${fa.length ? `No se puede aprobar. Falta: ${fa.join(' · ')}` : ''}">${btn('aprobar', 'badge-check', 'Aprobar', { primario: true, off: fa.length > 0 })}</span>`);
    if (d && esc && pasoPermitido(est, 'Entregado') === 'edita') flujo.push(btn('entregado', 'circle-check', 'Marcar entregado'));
    if (d && esc && typeof tool.tareasDe === 'function') salida.push(btn('tareas', 'list-checks', 'Convertir en tareas'));
    if (d && esc && ['Aprobado', 'Entregado'].includes(est)) (tool.va_a || []).forEach((id) => { const h = herramientaDe(id); if (h && (typeof h.puede !== 'function' || h.puede(me, b))) salida.push(btn('siguiente', 'arrow-right', `Enviar a ${h.nombre}`, { tool: id })); });
    if (typeof tool.aMd === 'function' && (d || S.alcance.abierto)) salida.push(btn('exportar', 'download', 'Exportar'), btn('copiar', 'copy', 'Copiar'));
    // El chat de Strategy de hoy (puente/Hermes) de esta herramienta: sigue intacto, ahora en su propia ruta.
    if (tool.ws === 'strategy' && tool.bloque_hz) salida.push(html`<a class="btn ghost sm tsh-act tsh-act-chat" href="${rutaHerramienta(tool.ws, slug, tool.id, ['chat'])}" title="El chat de Strategy de este bloque, como siempre">${ico('chat-ia', 14)} Chat de Strategy</a>`);
    salida.push(btn('chat', 'chat-ia', 'Continuar en el Chat'));
    if (d && esc) salida.push(btn('archivar', 'trash-2', 'Archivar'));
    mount(el, html`<div class="tsh-grp">${g1}</div>${flujo.length ? html`<div class="tsh-grp">${flujo}</div>` : ''}<div class="tsh-grp">${salida}</div>`);
  }
  // La generación con IA: corriendo (texto en vivo) · propuesta (a revisar) · sin bloque o error (reintentar).
  function pintarGen() {
    const g = S.gen, el = $('#tsh-gen', root); if (!el) return;
    if (!g) return mount(el, '');
    const otros = html`<button type="button" class="btn ghost sm" data-act="tsh-gen-claude">${ico('refresh-cw', 14)} Probar con claude.ai</button><button type="button" class="btn ghost sm" data-act="tsh-pegar">Pegar la respuesta</button><button type="button" class="btn ghost sm" data-act="tsh-cerrar-gen">${ico('x', 14)} Cerrar</button>`;
    if (g.fase === 'corriendo') {
      mount(el, html`<section class="tsh-gen" data-fase="corriendo"><header><span class="tsh-gen-t">${ico('loader-circle', 14)} Generando con IA…</span><span class="mut sm tsh-paso"></span><button type="button" class="btn ghost sm" data-act="tsh-parar">${ico('stop-lleno', 12)} Parar</button></header><pre class="tsh-stream" aria-live="polite"></pre></section>`);
      verStream(); verPaso(); return;
    }
    if (g.fase === 'propuesta') {
      const cr = g.prop.criterios || SIN_CRITERIOS;
      // El resumen muestra lo que quedaría al usarla (con alUsar: Brand Growth conserva su stack, la diana sus lotes), no la propuesta cruda.
      let resumen = ''; try { let c = g.prop.contenido; if (typeof tool.alUsar === 'function') { try { c = tool.alUsar(clon(c), clon(S.contenido), S.ctx) ?? c; } catch { c = g.prop.contenido; } } resumen = vista.resumen(c); } catch { resumen = ''; }
      mount(el, html`<section class="tsh-prop" data-fase="propuesta"><header><h3>${ico('sparkles', 14)} Propuesta de la IA</h3><span class="mut sm">${g.via === 'manual' ? 'Pegada a mano' : g.modelo || g.via}</span></header>
        <div class="tsh-prop-res">${resumen}</div>
        ${(cr.cumple || []).length + (cr.falta || []).length ? html`<ul class="tsh-crit-ul">${(cr.cumple || []).map((x) => html`<li class="ok"><span aria-hidden="true">✓</span><span class="sr-only">Cumple: </span>${x}</li>`)}${(cr.falta || []).map((x) => html`<li class="falta"><span aria-hidden="true">✗</span><span class="sr-only">Falta: </span>${x}</li>`)}</ul>` : ''}
        <p class="mut sm">Nada se guarda hasta que la uses.</p>
        <div class="tsh-prop-bt"><button type="button" class="btn sm" data-act="tsh-usar">${ico('check', 14)} Usar esta propuesta</button><button type="button" class="btn ghost sm" data-act="tsh-generar">${ico('refresh-cw', 14)} Reintentar</button><button type="button" class="btn ghost sm" data-act="tsh-cerrar-gen">Descartar</button></div></section>`);
      return;
    }
    mount(el, html`<section class="tsh-gen" data-fase="${g.fase}" role="alert"><p>${g.fase === 'error' ? g.error : html`No vino el bloque «${tool.bloque}». Reintenta o pega la respuesta.`}</p>
      ${g.fase === 'sin-bloque' && g.texto ? html`<details><summary>Ver lo que respondió</summary><pre class="tsh-json">${g.texto}</pre></details>` : ''}
      <div class="tsh-prop-bt"><button type="button" class="btn sm" data-act="tsh-generar">${ico('refresh-cw', 14)} Reintentar</button>${otros}</div></section>`);
  }
  const verStream = () => { const pre = $('.tsh-stream', root); if (pre && S.gen) { pre.textContent = S.gen.texto || ''; pre.scrollTop = pre.scrollHeight; } };
  const verPaso = () => { const p = $('.tsh-paso', root); if (p && S.gen) p.textContent = S.gen.paso || ''; };

  function pintarCmp() {
    const c = S.cmp, el = $('#tsh-cmp', root); if (!el) return;
    if (!c) return mount(el, '');
    const op = (sel) => c.lista.map((v) => html`<option value="${v.version}" ${v.version === sel ? raw('selected') : ''}>v${v.version} · ${fdate(v.en)} · ${quien(v.por)}</option>`);
    const col = (n) => { const d = c.docs[n]; if (!d) return html`<div class="tsh-cmp-col"><p class="mut sm">Cargando…</p></div>`;
      let r = ''; try { r = vista.resumen(d.contenido); } catch { r = ''; }
      return html`<div class="tsh-cmp-col"><h4>v${n}${n === S.doc?.version ? html` <span class="chip">actual</span>` : ''}</h4><div class="tsh-cmp-res">${r}</div>
        <details><summary>Ver el JSON</summary><pre class="tsh-json">${JSON.stringify(d.contenido, null, 2)}</pre></details>
        ${editable() && n !== S.doc?.version ? html`<button type="button" class="btn ghost sm" data-act="tsh-restaurar" data-v="${n}">Cargar esta versión</button>` : ''}</div>`; };
    mount(el, html`<section class="tsh-cmp"><header><h3>${ico('layers', 14)} Comparar versiones</h3><button type="button" class="btn ghost sm" data-act="tsh-cmp-cerrar">${ico('x', 14)} Cerrar</button></header>
      ${c.lista.length < 2 ? html`<p class="mut sm">Solo hay una versión: todavía no hay con qué comparar.</p>` : html`<div class="tsh-cmp-sel"><label>Antes <select class="in" data-act="tsh-cmp-a">${op(c.a)}</select></label><label>Después <select class="in" data-act="tsh-cmp-b">${op(c.b)}</select></label></div>
      <div class="tsh-cmp-cols">${col(c.a)}${col(c.b)}</div>`}</section>`);
  }
  function pintarAviso() {
    const el = $('#tsh-aviso', root); if (!el) return;
    const est = estadoDe(), nota = !S.alcance.abierto ? '' : !S.puede.editar ? 'Solo lectura: tu perfil lo ve, pero no lo cambia.'
      : S.doc?.archivado ? 'Está archivado: no se edita.'
      : cerrado() ? `Está ${est.toLowerCase()} con el bloque ${nombreBloque()}: solo se cambia cuando el CEO lo reabre.`
      : S.doc && ['Aprobado', 'Entregado'].includes(est) ? `Está ${est.toLowerCase()}: si lo editas, se crea una versión nueva y vuelve a Borrador.` : '';
    mount(el, nota ? html`${nota}` : '');
  }
  function pintarVista() {
    const el = $('#tsh-vista', root); if (!el) return;
    if (!S.alcance.abierto && !S.doc) return mount(el, S.alcance.code === 'APROBADO'
      ? html`<div class="empty tsh-vacio"><b>Sin entregable</b>La estrategia está aprobada y esta herramienta no tiene uno: el CEO la reabre para empezar un borrador.</div>`
      : html`<div class="empty tsh-vacio"><b>Sin entregable</b>Esta herramienta queda fuera de lo que este cliente contrató.</div>`);
    S.pintando = true; // la vista puede avisar un cambio mientras se pinta: eso no cuenta como edición
    try { vista.pintar(el, { contenido: S.contenido, editable: editable(), onCambio, ctx: S.ctx, me, slug, docId: S.doc?.id || '' }); }
    catch (e) { mount(el, html`<div class="empty"><b>No pude pintar ${tool.nombre}</b>Recarga la página. Si sigue, avísale al COO.${techDetail(e)}</div>`); }
    finally { S.pintando = false; }
  }
  function pintarCrit() {
    const el = $('#tsh-crit', root); if (!el) return;
    const cu = S.doc?.criterios?.cumple || [], fa = faltasAhora();
    if (!hayCambio('crit', [cu, fa])) return;
    mount(el, html`<div class="tsh-crit-h"><h3>Criterios</h3><span class="mut sm">${cu.length} cumple · ${fa.length} falta</span></div>
      ${cu.length + fa.length ? html`<ul class="tsh-crit-ul">${cu.map((x) => html`<li class="ok"><span aria-hidden="true">✓</span><span class="sr-only">Cumple: </span>${x}</li>`)}${fa.map((x) => html`<li class="falta"><span aria-hidden="true">✗</span><span class="sr-only">Falta: </span>${x}</li>`)}</ul>`
        : html`<p class="tsh-sindatos">⚠️ SIN DATOS: los criterios salen del bloque criterios de la IA y de las reglas de la herramienta</p>`}
      ${fa.length ? html`<p class="tsh-crit-nota">Aprobar queda bloqueado mientras falte algo.</p>` : ''}`);
  }
  function pintarPie() {
    const el = $('#tsh-pie', root); if (!el) return;
    const d = S.doc, res = [...(d?.resultado || [])].sort((a, z) => String(z.en || '').localeCompare(String(a.en || ''))), his = [...(d?.historial || [])].sort((a, z) => String(z.en || '').localeCompare(String(a.en || '')));
    mount(el, html`<div class="tsh-pie-col tsh-res"><h3>Resultados</h3>
        ${res.length ? html`<ul class="tsh-pie-ul">${res.map((r) => html`<li><b>${r.metrica}</b>${r.valor !== '' && r.valor != null ? html`: ${r.valor}` : ''} <span class="mut sm">${fdate(r.en)} · ${quien(r.por)}</span>${r.nota ? html`<p>${r.nota}</p>` : ''}</li>`)}</ul>`
          : html`<p class="tsh-sindatos">⚠️ SIN DATOS: los resultados los registra quien mide el entregable después de entregarlo</p>`}
        ${d && escribe() ? html`<div class="tsh-r-form"><input class="in tsh-r-in" id="tsh-r-metrica" maxlength="80" placeholder="Métrica" aria-label="Métrica"><input class="in tsh-r-in" id="tsh-r-valor" maxlength="80" placeholder="Valor" aria-label="Valor"><input class="in tsh-r-in" id="tsh-r-nota" maxlength="300" placeholder="Nota (qué aprendimos)" aria-label="Nota"><button type="button" class="btn ghost sm" data-act="tsh-resultado">Registrar</button></div>` : ''}</div>
      <div class="tsh-pie-col tsh-hist"><h3>Historial</h3>
        ${his.length ? html`<ul class="tsh-pie-ul">${his.map((h) => html`<li><span class="tsh-h-en">${fdate(h.en)}</span> <b>${h.accion}</b> <span class="mut sm">${quien(h.por)}${h.version ? ` · v${h.version}` : ''}</span>${h.nota ? html`<p class="mut sm">${h.nota}</p>` : ''}</li>`)}</ul>`
          : html`<p class="tsh-sindatos">⚠️ SIN DATOS: el historial empieza cuando se guarda el primer borrador</p>`}</div>`);
  }
  function pintarTodo() {
    S.k = {};
    pintarHead(); pintarBanner(); pintarActs(); pintarGen(); pintarCmp(); pintarInput(); pintarAviso(); pintarVista(); pintarCrit(); pintarPie();
  }
  // La persona editó en la vista: se guarda en memoria y se marca «Sin guardar». No se vuelve a pintar la vista (perdería el foco).
  function onCambio(nuevo) {
    if (S.pintando) return;
    S.contenido = nuevo; S.sucio = true;
    pintarHead(); pintarActs(); pintarCrit();
  }

  // ---------- Guardar ----------
  const tituloNuevo = () => `${tool.nombre} · ${b?.name || slug}`.slice(0, 120);
  // Lo que se manda al servidor (que lo vuelve a limpiar con el mismo limpiar()): siempre el entregable completo.
  const cuerpo = (contenido, { criterios, ia, doc } = {}) => ({ tool: tool.id, titulo: doc?.titulo || tituloNuevo(), client_slug: slug, ciclo: doc?.ciclo || '', project_id: doc?.project_id || '',
    entradas: doc?.entradas || [], contenido, criterios: criterios || doc?.criterios || clon(SIN_CRITERIOS), ia: ia || doc?.ia || S.local?.ia || { via: 'manual', modelo: '' } });
  async function guardar(contenido = S.contenido, extra = {}) {
    if (!editable()) return;
    const antes = S.doc;
    const d = antes
      ? await api(rutaDoc(antes.id), { method: 'PUT', body: { v: antes.v, ...cuerpo(contenido, { doc: antes, ...extra }) } })
      : await api('entregables', { method: 'POST', body: cuerpo(contenido, extra) });
    if (!alive()) return;
    S.gen = extra.criterios ? null : S.gen;
    aplicarDoc(d);
    toast(!antes ? 'Borrador guardado' : d.version > antes.version ? `Guardado como v${d.version}` : 'Guardado');
  }

  // ---------- Generar con IA ----------
  function leerRespuesta(txt, { via, modelo }) {
    let prop = null; try { prop = tool.leer(txt); } catch { prop = null; }
    S.gen = prop ? { fase: 'propuesta', prop, via, modelo } : { fase: 'sin-bloque', texto: txt, via, modelo };
  }
  async function generar(preferir) {
    if (!editable() || !puedeIA || S.gen?.fase === 'corriendo') return;
    const ctrl = new AbortController(), mio = () => S.gen?.ctrl === ctrl;
    S.gen = { fase: 'corriendo', texto: '', paso: '', ctrl };
    pintarGen(); pintarActs();
    try {
      const ctx = await armarCtx(me, { tool, slug, entradas: S.doc?.entradas || [] });
      if (!alive() || !mio()) return;
      S.ctx = ctx;
      const out = await correrIA(me, { tool, ctx, signal: ctrl.signal, preferir,
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
    const v = await ask('Pegar la respuesta', [{ k: 't', t: 'textarea', req: true, l: `Pega la respuesta completa de la IA, con su bloque ${tool.bloque}.` }], 'Leer');
    if (!v || !alive()) return;
    leerRespuesta(v.t, { via: 'manual', modelo: '' });
    pintarGen(); pintarActs();
  }
  async function usar() {
    const g = S.gen; if (g?.fase !== 'propuesta' || !editable()) return;
    if (S.sucio && !(await confirmAsk('Tienes cambios sin guardar. ¿Los reemplazo con la propuesta?'))) return;
    if (!alive()) return;
    // alUsar (opcional, del registro): la herramienta decide cómo se aplica la propuesta sobre lo que hay (la diana conserva sus lotes de
    // calibración; la oferta no toca lo que su nivel bloquea). Si falla, se usa la propuesta tal cual.
    let nuevo = clon(g.prop.contenido);
    if (typeof tool.alUsar === 'function') { try { nuevo = clon(tool.alUsar(nuevo, clon(S.contenido), S.ctx) ?? nuevo); } catch { nuevo = clon(g.prop.contenido); } }
    await haz(() => guardar(nuevo, { criterios: g.prop.criterios, ia: { via: g.via, modelo: String(g.modelo || '').slice(0, 80) } }));
  }

  // ---------- Estado ----------
  async function cambiarEstado(a, { nota = false } = {}) {
    if (S.sucio) return toast('Guarda tus cambios antes de cambiar el estado.', true);
    let texto = '';
    if (nota) { const v = await ask('Devolver a borrador', [{ k: 'nota', t: 'textarea', l: 'Qué hay que cambiar (opcional)' }], 'Devolver'); if (!v) return; texto = v.nota || ''; }
    if (!alive()) return;
    await haz(async () => {
      const d = await api(`${rutaDoc(S.doc.id)}/estado`, { method: 'POST', body: { v: S.doc.v, a, nota: texto } });
      if (!alive()) return;
      aplicarDoc(d); toast(`Ahora está en «${d.estado}»`);
    });
  }

  // Offer Architect: aprobar y reabrir van por el bloque de Strategy (solo el CEO). El servidor deja el último entregable Aprobado (con su versión)
  // o en Borrador en esa misma ruta (aprobar manda la v del entregable que se revisó y el servidor corre sus faltas); después se vuelve a leer la lista.
  // Nunca POST entregables/:id/estado con «Aprobado» para esta herramienta.
  async function aprobarBloque(si) {
    const bloque = tool.aprobarConBloque;
    if (!bloque || !S.doc || !S.puede.aprobar) return;
    if (S.sucio) return toast(`Guarda tus cambios antes de ${si ? 'aprobar' : 'reabrir'}.`, true);
    if (!si && !(await confirmAsk(`Reabrir regresa el bloque ${nombreBloque()} y este entregable a Borrador: se podrá editar otra vez. ¿Confirmas?`))) return;
    if (!alive()) return;
    await haz(async () => {
      await api(`estrategia/${enc(slug)}/${enc(bloque)}/aprobar`, { method: 'POST', body: si ? { aprobar: true, v: S.doc.v } : { aprobar: false } }); // aprobar lleva la v del entregable que se revisó
      if (!alive()) return;
      await cargar({ abrir: S.doc?.id || '' });
      if (!alive()) return;
      S.k = {}; marcarRuta(); pintarTodo();
      toast(si ? `Aprobado con el bloque ${nombreBloque()}` : `Reabierto: ${tool.nombre} vuelve a Borrador`);
    });
  }

  // ---------- Tareas, siguiente, resultado, archivar ----------
  async function tareas() {
    if (S.sucio) return toast('Guarda tus cambios antes de convertir en tareas.', true);
    let filas = []; try { filas = tool.tareasDe(S.contenido) || []; } catch { filas = []; }
    filas = filas.filter((f) => f && String(f.title ?? '').trim()).slice(0, 12)
      .map((f) => ({ title: String(f.title).trim().slice(0, 160), due: f.due || '', assignee: f.assignee || '', dept: f.dept || '', fila: f.fila || '', por_que: f.por_que || '' }));
    if (!filas.length) return toast('Todavía no hay filas para convertir en tareas.', true);
    const ya = (S.doc.tareas || []).length;
    if (!(await confirmAsk(`Se crearán hasta ${tareasTxt(filas.length)} desde este entregable.${ya ? ` Ya creó ${tareasTxt(ya)} antes: pueden quedar repetidas.` : ''} ¿Confirmas?`)) || !alive()) return;
    await haz(async () => {
      const r = await api(`${rutaDoc(S.doc.id)}/tareas`, { method: 'POST', body: { v: S.doc.v, tareas: filas } });
      if (!alive()) return;
      const salt = Array.isArray(r.saltadas) ? r.saltadas.length : Number(r.saltadas) || 0;
      toast(`Se crearon ${tareasTxt((r.creadas || []).length)}${salt ? ` · ${salt} ya existían` : ''}`);
      const d = await api(rutaDoc(S.doc.id)).catch(() => null); // el entregable guarda los ids de sus tareas: se vuelve a leer para tener su versión al día
      if (alive() && d) aplicarDoc(d, { conservar: true });
    });
  }
  async function siguiente(idTool) {
    const h = herramientaDe(idTool); if (!h) return;
    if (S.sucio) return toast('Guarda tus cambios antes de enviarlo.', true);
    await haz(async () => {
      const r = await api(`${rutaDoc(S.doc.id)}/siguiente`, { method: 'POST', body: { v: S.doc.v, tool: idTool } });
      if (!alive()) return;
      toast(`Listo: se creó un borrador en ${h.nombre}`);
      location.hash = rutaHerramienta(h.ws, slug, h.id, [(r.doc || r).id]);
    });
  }
  async function resultado() {
    const g = (id) => String($(`#${id}`, root)?.value || '').trim(), metrica = g('tsh-r-metrica');
    if (!metrica) return toast('Falta la métrica', true);
    await haz(async () => {
      const d = await api(`${rutaDoc(S.doc.id)}/resultado`, { method: 'POST', body: { v: S.doc.v, metrica, valor: g('tsh-r-valor'), nota: g('tsh-r-nota') } });
      if (!alive()) return;
      aplicarDoc(d, { conservar: true }); toast('Resultado registrado');
    });
  }
  async function archivar() {
    if (!(await confirmAsk(`¿Archivar «${S.doc.titulo || tool.nombre}»? Ya no sale en la lista, pero no se borra.`)) || !alive()) return;
    await haz(async () => {
      await api(`${rutaDoc(S.doc.id)}/archivar`, { method: 'POST', body: { v: S.doc.v, archivado: true } });
      if (!alive()) return;
      await cargar(); if (!alive()) return;
      S.gen = null; marcarRuta(); pintarTodo(); toast('Archivado: no se borró.');
    });
  }
  async function abrir(valor) {
    if (S.sucio && !(await confirmAsk('Tienes cambios sin guardar. ¿Los descarto?'))) { S.k = {}; pintarHead(); return; }
    if (!alive()) return;
    if (valor === '__nuevo') { S.ctx = { ...S.ctx, entradas: [] }; nuevoLocal(); S.gen = null; marcarRuta(); pintarTodo(); return; }
    await haz(async () => { await cargar({ abrir: valor }); if (!alive()) return; S.gen = null; marcarRuta(); pintarTodo(); });
  }

  // ---------- Comparar versiones ----------
  async function comparar() {
    if (S.cmp) { S.cmp = null; return pintarCmp(); }
    await haz(async () => {
      const r = await api(`${rutaDoc(S.doc.id)}/versiones`);
      if (!alive()) return;
      const lista = (r.versiones || []).slice().sort((a, z) => z.version - a.version);
      S.cmp = { lista, a: lista[1]?.version ?? null, b: lista[0]?.version ?? null, docs: {} };
      pintarCmp();
      await Promise.all([S.cmp.a, S.cmp.b].map((n) => verVersion(n)));
    });
  }
  async function verVersion(n) {
    const c = S.cmp; if (!c || n == null || c.docs[n]) return;
    const d = await api(`${rutaDoc(S.doc.id)}/versiones/${n}`);
    if (alive() && S.cmp === c) { c.docs[n] = d; pintarCmp(); }
  }
  function restaurar(n) {
    const d = S.cmp?.docs[n]; if (!d || !editable()) return;
    S.contenido = clon(d.contenido); S.sucio = true; S.cmp = null;
    S.k = {}; pintarVista(); pintarHead(); pintarActs(); pintarCrit(); pintarCmp();
    toast(`Cargué la v${n} en pantalla. Guarda para crear una versión nueva.`);
  }

  // ---------- Exportar ----------
  const markdown = () => { try { return String(tool.aMd(S.contenido) || ''); } catch { return ''; } };
  function copiar() {
    const md = markdown(); if (!md.trim()) return toast('Todavía no hay nada que exportar.', true);
    navigator.clipboard?.writeText(md).then(() => toast('Markdown copiado'), () => toast('No pude copiar. Usa Exportar.', true)) || toast('No pude copiar. Usa Exportar.', true);
  }
  function exportar() {
    const md = markdown(); if (!md.trim()) return toast('Todavía no hay nada que exportar.', true);
    const nombre = `${tool.id}-${slug}${S.doc ? `-v${S.doc.version}` : ''}.md`.replace(/[^a-z0-9._-]/gi, '-');
    try { // si el navegador no deja descargar, se copia
      const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' })), a = document.createElement('a');
      a.href = url; a.download = nombre; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000); toast(`Descargué ${nombre}`);
    } catch { copiar(); }
  }
  function plegar() {
    S.plegado = !S.plegado;
    try { localStorage.setItem(K_PLEGADO, S.plegado ? '1' : '0'); } catch {}
    const m = $('.tsh-marco', root); if (m) m.dataset.plegado = S.plegado ? '1' : '0';
    $('.tsh-input-bt', root)?.setAttribute('aria-expanded', S.plegado ? 'false' : 'true');
  }

  // ---------- El primer pintado ----------
  try { await cargar({ abrir: String(resto[0] || '') }); }
  catch (e) { if (!alive()) return; return mount(host, html`<div class="empty"><b>No pude abrir ${tool.nombre}</b>${e.message}${techDetail(e)}</div>`); }
  if (!alive()) return;
  mount(host, html`<div class="tsh" data-tool="${tool.id}"><div id="tsh-head"></div><div id="tsh-banner"></div><div class="tsh-acts" id="tsh-acts" role="toolbar" aria-label="Acciones de ${tool.nombre}"></div>
    <div id="tsh-gen" aria-live="polite"></div><div id="tsh-cmp"></div>
    <div class="tsh-marco" data-plegado="${S.plegado ? '1' : '0'}"><aside class="tsh-input" id="tsh-input" aria-label="Entrada"></aside>
      <div class="tsh-main"><p class="tsh-aviso" id="tsh-aviso"></p><section class="tsh-centro"><div id="tsh-vista" class="tsh-vista"></div></section><section class="tsh-crit" id="tsh-crit"></section></div></div>
    <footer class="tsh-pie" id="tsh-pie"></footer></div>`);
  root = $('.tsh', host);
  // Lo de la vista del centro es suyo: el shell no atiende los data-act de adentro.
  const fuera = (f) => (el, e) => { if (!el.closest('#tsh-vista')) f(el, e); };
  const cada = (m) => Object.fromEntries(Object.entries(m).map(([k, f]) => [k, fuera(f)]));
  acts(root, cada({
    'tsh-plegar': plegar, 'tsh-generar': () => generar(), 'tsh-gen-claude': () => generar('claude-web'), 'tsh-parar': () => S.gen?.ctrl?.abort(),
    'tsh-pegar': pegar, 'tsh-usar': usar, 'tsh-cerrar-gen': () => { S.gen = null; pintarGen(); pintarActs(); },
    'tsh-guardar': () => haz(() => guardar()), 'tsh-descartar-cambios': () => { if (S.doc) { S.contenido = clon(S.doc.contenido); S.sucio = false; } else nuevoLocal(); S.k = {}; pintarHead(); pintarActs(); pintarCrit(); pintarVista(); },
    'tsh-comparar': comparar, 'tsh-cmp-cerrar': () => { S.cmp = null; pintarCmp(); }, 'tsh-restaurar': (el) => restaurar(+el.dataset.v),
    'tsh-enviar-rev': () => cambiarEstado('En revisión'), 'tsh-devolver': () => cambiarEstado('Borrador', { nota: true }),
    'tsh-aprobar': () => (tool.aprobarConBloque ? aprobarBloque(true) : cambiarEstado('Aprobado')), 'tsh-reabrir': () => aprobarBloque(false),
    'tsh-entregado': () => cambiarEstado('Entregado'),
    'tsh-tareas': tareas, 'tsh-siguiente': (el) => siguiente(el.dataset.tool), 'tsh-resultado': resultado,
    'tsh-exportar': exportar, 'tsh-copiar': copiar, 'tsh-archivar': archivar,
    'tsh-chat': () => abrirEnChat(me.email, { modo, slug }),
  }));
  acts(root, cada({
    'tsh-abrir': (el) => abrir(el.value),
    'tsh-cmp-a': (el) => { if (S.cmp) { S.cmp.a = +el.value; verVersion(S.cmp.a); pintarCmp(); } },
    'tsh-cmp-b': (el) => { if (S.cmp) { S.cmp.b = +el.value; verVersion(S.cmp.b); pintarCmp(); } },
  }), 'change');
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches?.('.tsh-r-in')) { e.preventDefault(); resultado(); }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (editable() && (S.sucio || !S.doc)) haz(() => guardar()); }
  });
  marcarRuta();
  pintarTodo();
}
