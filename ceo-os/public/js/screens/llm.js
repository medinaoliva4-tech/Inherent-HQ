// El Inherent LLM (#/chat): el Chat de Inherent OS, una pantalla más dentro del shell (vive en #main, a la derecha de la
// barra lateral; el elemento donde se monta lleva la clase llm-host): barra de conversaciones · conversación · panel. Responde
// el SERVIDOR de Inherent (chat-gateway.js · PLAN-GATEWAY F3): las conversaciones se guardan en el OS, con web, los MCPs de la
// persona, lectura del OS y propuestas que la persona aprueba. Hermes se retiró.
// Un modo por área (areas.js), con su harness (llm/modos.js) y su panel (llm/paneles.js). El modo se elige con los comandos
// «/», el selector de la barra o llega por abrirEnChat; en la caja, el switch de IA (Claude, ChatGPT, en tu compu u otras).
// Rutas: #/chat · #/chat/<sesión> · #/chat/trabajo/<trabajo> (abre el Chat con ese trabajo en su pestaña)
import { html, raw, mount, api, col, toast, $, ico, md, esc, initials, today, roleName, confirmAsk } from '../core.js';
import { nombreProveedor, nombrePaso, esLocal, PASARELAS, IAS, iaDe, modelosDeIa, iasListas, fuertesDe } from '../ia-pasos.js';
import { MODOS, modoDe, sistemaDe, SUGERENCIAS, COMANDOS, leerComando, textoVisible, leerTarjetas, idSesion, leerIdSesion, tituloDe, grupoFecha, ESFUERZOS, nombreEsfuerzo, AREAS_ENCARGO, tareaDeEncargo, alcanceConsulting, consultingAbierto } from '../llm/modos.js';
import { limpiarPlan, nombreMes, NOMBRE_P } from '../plan-mes.js';
import { tipoDe, anticipacion } from '../campanas.js';
import { panelDe, datosEstrategia, olvidarPanel, verTareas } from '../llm/paneles.js';
import { crearBrujula, progreso, tareaActual, terminada, marcar, aplicarAvance, contarGiro, desviado, contextoBrujula, ritmoSemana, inicioSemana, usosDe, QUIEN } from '../llm/brujula.js';
import { leerBloques, instrucciones, avance, PASOS } from '../estrategia-viva.js';
import { etapaDe, etapaLabel } from '../estrategia.js';
import { loadEstrategia, estrategiaNow } from '../stratlist.js';
import { loadBrands, brandsNow, brandAccess } from '../brandlist.js';
import { botonVoz, dictar } from '../voz.js';
import { svgIco } from '../iconos.js';
import { saludServidor, modelosServidor, sesionesServidor, crearSesionServidor, mensajesServidor, borrarSesionServidor, ramificarServidor, turnoServidor, decidirPropuesta } from '../chat-gateway.js';
import { areaDe, areaDeModo, areaGuardada, guardarArea } from '../areas.js';
import { ponerTema, temaElegido, esNoche } from '../tema.js';
import { rutaModulo } from '../herramientas.js';
// F4.5 · el Chat como centro: @agente, el plan platicado, los trabajos en el hilo y la ventana de agentes (PLAN-GATEWAY §20).
import { leerMencion, planDe, contextoChat, hiloChat, clienteDelPlan } from '../chat-agentes.js';
import { menuArroba, menuArrobaHtml, planHtml as planAgenteHtml, eventoHtml, vivoHtml, pestanasHtml } from '../llm/agentes-ui-chat.js';
import { pintarVentana, abrirDocumento } from '../agentes-ventana.js';
import { activa, completo, enServidor as etapaEnServidor, faltaAporte } from '../agentes-flujos.js';
import { cargarContexto } from '../contexto.js';
import { modoDeArea } from '../agentes-chat-datos.js';

const K = (me) => `os.llm.${me.email}`;
// En pantallas chicas el panel va encima del chat: empieza cerrado y abrirlo no se recuerda.
// La Brújula de cada conversación (su meta y sus tareas) se guarda en este navegador, por conversación.
const KB = (me) => `os.llm.brujula.${me.email}`;
const brujulas = (me) => { try { return JSON.parse(localStorage.getItem(KB(me)) || '{}') || {}; } catch { return {}; } };
const guardarBrujula = (me, sid, b) => { if (!sid) return; try { const m = brujulas(me); if (b) m[sid] = b; else delete m[sid]; localStorage.setItem(KB(me), JSON.stringify(m)); } catch {} };
const angosto = () => matchMedia('(max-width: 1100px)').matches;
const leer = (me) => { try { return JSON.parse(localStorage.getItem(K(me)) || '{}') || {}; } catch { return {}; } };
const guardar = (me, v) => { try { localStorage.setItem(K(me), JSON.stringify(v)); } catch {} };
const ICO_PANEL = raw(svgIco('panel', 16));
const ICO_SIDE = raw(svgIco('side', 16));
const ICO_NUEVO = raw(svgIco('nuevo', 16));
const ICO_ARRIBA = raw(svgIco('enviar', 17, 'lni lni-fuerte'));
const ICO_STOP = raw(svgIco('stop-lleno', 14));
const ICO_RAMA = raw(svgIco('rama', 16));
const ELECCION = { once: 'Permitir una vez', session: 'En esta conversación', always: 'Siempre', deny: 'No' };

// Un solo escuchador del tema para el Chat montado (no uno por pintada: guardaría las conversaciones viejas en memoria).
let llmVivo = null;
window.addEventListener('tema', () => { if (llmVivo?.isConnected) llmVivo.dataset.tema = esNoche() ? 'noche' : 'dia'; });

export async function render(el, { me, sub = [], alive }) {
  el.classList.add('llm-host');
  const pref = leer(me);
  // Quién abre qué modo (solo refleja: el permiso lo pone el servidor). Strategy y Consulting, quien ve estrategia;
  // Creative, quien ve alguna marca; Marketing y Production, Contenido completo; Organization, todos.
  const puedeModo = (id) => (id === 'estrategia' || id === 'consulting' ? me.areas?.includes('estrategia') : id === 'diseno' ? brandAccess(me).any : id === 'marketing' || id === 'produccion' ? brandAccess(me).contentFull : true);
  const modos = MODOS.filter((m) => puedeModo(m.id));
  // El modo elegido se recuerda por persona (areas.js); abrirEnChat lo deja ahí desde las pantallas.
  const modoGuardado = areaDe(areaGuardada(me.email))?.modo;
  const S = {
    modo: modos.some((m) => m.id === modoGuardado) ? modoGuardado : modos.some((m) => m.id === pref.modo) ? pref.modo : modos[0].id,
    slugs: pref.slugs || {}, modelo: pref.modelo || null, privado: false, porIa: pref.porIa || {}, esfuerzo: pref.esfuerzo || '', brujula: null, limite: +pref.limite || 0, panel: angosto() ? false : pref.panel !== false,
    sesion: null, msgs: [], titulo: '', enVuelo: null, runId: '',
    agentes: [], tab: 'modo', listaAgentes: null, cerradas: new Set(), // F4.5: los trabajos ligados a la conversación y la pestaña abierta
    salud: null, modelos: null, sesiones: [], busca: '', side: false, skills: null,
  };
  // Lo que una pantalla dejó para escribir («Pregúntale al Chat», un tema de Consulting): se usa una vez y se borra, pero
  // solo cuando llega a la caja (si el servidor no está listo, espera: no se pierde).
  let borrador = String(pref.borrador || '');
  const persistir = () => guardar(me, { modo: S.modo, slugs: S.slugs, modelo: S.modelo, privado: S.privado, porIa: S.porIa, esfuerzo: S.esfuerzo, limite: S.limite, panel: angosto() ? pref.panel : S.panel, ...(borrador ? { borrador } : {}) });
  // El mes del plan que trabaja Marketing: el que mandó el plan del mes (abrirEnChat), o el de este mes.
  const mesPlan = /^\d{4}-\d{2}$/.test(pref.mes || '') ? pref.mes : today().slice(0, 7);
  // Modo privado: responde un modelo que corre en esta compu (LM Studio, Ollama…). El elegido si es local; si no, el primero que haya.
  const modeloLocal = () => {
    if (S.modelo?.model && esLocal(S.modelo.provider)) return S.modelo;
    const a = S.modelos?.actual; if (a?.model && esLocal(a.provider)) return { provider: a.provider, model: a.model };
    const p = (S.modelos?.proveedores || []).find((x) => esLocal(x.slug) && x.listo && x.modelos.length);
    return p ? { provider: p.slug, model: p.modelos[0] } : null;
  };
  const modeloTurno = () => (S.privado ? modeloLocal() || {} : S.modelo || {});
  const slugAhora = () => (modoDe(S.modo).pide ? S.slugs[S.modo] || '' : '');
  const opciones = () => (S.modo === 'estrategia' || S.modo === 'consulting' ? estrategiaNow().filter((c) => S.modo === 'estrategia' || c.slug !== 'inherent').map((c) => [c.slug, c.nombre]) : modoDe(S.modo).pide === 'marca' ? brandsNow().filter((b) => S.modo !== 'marketing' || !b.personal).map((b) => [b.slug, b.name]) : []);
  // Qué IA responde ahora: la del modelo elegido o la del servidor por defecto. '' si no se sabe.
  const iaAhora = () => (S.privado ? 'local' : S.modelo?.model ? iaDe(S.modelo.provider, S.modelo.model) : S.modelos?.actual?.provider ? iaDe(S.modelos.actual.provider, S.modelos.actual.model) : '');
  const nombreSlug = () => opciones().find(([s]) => s === slugAhora())?.[1] || slugAhora();
  const listo = () => Boolean(S.salud?.on && S.salud?.auth);
  // El Chat corre en el servidor (PLAN-GATEWAY F3). B: las funciones que usa la pantalla.
  const enServidor = true;
  const B = {
    salud: () => saludServidor(),
    modelos: () => modelosServidor(),
    sesiones: () => sesionesServidor(),
    crear: (o) => crearSesionServidor(o),
    mensajes: (id) => mensajesServidor(id),
    turno: (id, o) => turnoServidor(id, o),
    borrar: (id) => borrarSesionServidor(id),
    ramificar: (id, o) => ramificarServidor(id, o),
    skills: () => Promise.resolve([]),
  };
  const quien = () => 'el servidor';

  mount(el, html`<div class="llm" data-tema="${esNoche() ? 'noche' : 'dia'}" data-panel="${S.panel ? 'on' : 'off'}">
    <aside class="llm-side" id="llm-side" aria-label="Conversaciones"></aside>
    <main class="llm-main" id="llm-main">
      <header class="llm-head"><button type="button" class="llm-ib llm-solo-cel" data-a="side" aria-label="Conversaciones">${ICO_SIDE}</button><div class="llm-titulo" id="llm-titulo"></div><span class="sp"></span>
        <button type="button" class="llm-bru-chip" data-a="ver-brujula" id="llm-bru" hidden title="La brújula de esta conversación"></button>
        <button type="button" class="llm-ib" data-a="ramificar" id="llm-rama" hidden aria-label="Ramificar: seguir en una conversación nueva con todo lo hablado" title="Ramificar">${ICO_RAMA}</button>
        <button type="button" class="llm-ib" data-a="panel" aria-label="Mostrar u ocultar el panel" title="Panel">${ICO_PANEL}</button></header>
      <div class="llm-conv" id="llm-conv"><div class="llm-col" id="llm-col"></div></div>
      <button type="button" class="llm-abajo" data-a="abajo" aria-label="Bajar al final" hidden>${ico('down', 16)}</button>
      <div class="llm-compw" id="llm-compw"></div>
      <div class="llm-sug" id="llm-sug"></div>
    </main>
    <aside class="llm-panel" id="llm-panel" aria-label="Panel del modo"></aside>
    <div class="llm-velo" data-a="side"></div>
  </div>`);
  const R = $('.llm', el), C = (id) => $('#' + id, el);
  // El día y la noche son los del OS (tema.js): si cambia (aquí, en otra pantalla o en la compu), el Chat lo sigue.
  llmVivo = R;

  // ---------- La barra de conversaciones (el modo · nueva · las conversaciones del modo por fecha · tú y el servidor) ----------
  // Sin buscar se ven las conversaciones del modo; al buscar, las de todos (cada una con la letra de su modo).
  function pintarSide() {
    const q = S.busca.trim().toLowerCase(), m = modoDe(S.modo);
    // Solo las de los modos que este perfil abre (una conversación puede ser de un modo que el perfil ya no abre; cuenta.
    const lista = S.sesiones.filter((s) => modos.some((m) => m.id === leerIdSesion(s.id)?.modo) && (q ? String(s.title || s.preview || '').toLowerCase().includes(q) : leerIdSesion(s.id).modo === S.modo));
    const grupos = {}; for (const s of lista) (grupos[grupoFecha(s.last_active || s.started_at)] ||= []).push(s);
    const fila = (s) => { const m = modoDe(leerIdSesion(s.id)?.modo || 'organizacion'); return html`<div class="ls-row ${s.id === S.sesion ? 'on' : ''}"><a href="#/chat/${esc(s.id)}" title="${s.title || s.preview || ''}"><i class="ls-m" data-m="${m.id}">${m.letra}</i><span>${s.title || s.preview || 'Conversación'}</span></a><button type="button" class="ls-x" data-a="borrar" data-id="${s.id}" aria-label="Borrar conversación">${ico('x', 12)}</button></div>`; };
    const estado = !S.salud ? ['', 'Buscando el servidor…'] : S.salud.on ? ['on', 'Servidor · siempre encendido'] : ['off', 'Servidor fuera de línea'];
    // El logo ya está en la barra lateral del shell: aquí solo el nombre del Chat. El modo se cambia con el selector (o con «/»).
    mount(C('llm-side'), html`<div class="ls-brand"><span class="ls-emb">${ico('chat-ia', 20)}</span><b class="ls-ttl">Inherent LLM</b></div>
      <div class="ls-area" data-m="${S.modo}">${modos.length > 1 ? html`<b><select class="ls-modo" aria-label="Modo del Chat">${modos.map((x) => html`<option value="${x.id}" ${x.id === S.modo ? raw('selected') : ''}>${x.nombre}</option>`)}</select></b>` : html`<b>${m.nombre}</b>`}<small>${m.sub}</small></div>
      <button type="button" class="ls-new" data-a="nuevo">${ICO_NUEVO}<span>Nueva conversación</span></button>
      <div class="ls-k ls-kr">${q ? 'Todos los modos' : 'Recientes'}<label class="ls-busca">${ico('search', 12)}<input id="ls-q" placeholder="Buscar" value="${S.busca}" aria-label="Buscar conversaciones"></label></div>
      <div class="ls-list">${!listo() ? html`<p class="ls-mut">${enServidor ? 'El servidor no está en línea ahora.' : ''}</p>` : lista.length ? ['Hoy', 'Ayer', 'Últimos 7 días', 'Antes'].filter((g) => grupos[g]).map((g) => html`<div class="ls-g">${g}</div>${grupos[g].map(fila)}`) : html`<p class="ls-mut">${q ? 'Nada con ese nombre.' : S.sesiones.tope ? `Entre las últimas ${S.sesiones.length} conversaciones no hay de ${m.nombre}.` : `Todavía no hay conversaciones de ${m.nombre}.`}</p>`}</div>
      <footer class="ls-foot"><button type="button" class="ls-me" data-a="ajustes" title="Ajustes del Chat">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer">` : html`<span>${initials(me.name)}</span>`}<span class="ls-me-t"><b>${me.name}</b><small><i class="ls-dot ${estado[0]}"></i>${estado[1]}</small></span>${ico('gear', 15)}</button></footer>`);
    const qi = C('ls-q'); if (qi) qi.oninput = () => { S.busca = qi.value; const pos = qi.selectionStart; pintarSide(); const n = C('ls-q'); n.focus(); n.setSelectionRange(pos, pos); };
  }

  // ---------- El centro: vacío (la pregunta grande, como Perplexity) o la conversación ----------
  const vacio = () => !S.msgs.length && !S.agentes.length;
  function pintarTitulo() {
    const m = modoDe(S.modo), rama = C('llm-rama'); if (rama) rama.hidden = !S.sesion || vacio();
    mount(C('llm-titulo'), vacio() ? html`<span class="lt-modo"><i data-m="${m.id}">${m.letra}</i>${m.nombre}</span>` : html`<span class="lt-t">${S.titulo || 'Conversación'}</span><span class="lt-modo sm"><i data-m="${m.id}">${m.letra}</i>${m.nombre}${slugAhora() ? ` · ${nombreSlug()}` : ''}</span>`);
  }
  function pintarCentro() {
    C('llm-main').classList.toggle('vacio', vacio());
    pintarTitulo(); pintarCaja(); pintarHilo(); pintarSug();
  }
  function heroHtml() {
    const m = modoDe(S.modo), s = nombreSlug();
    if (!listo()) return setupHtml();
    return html`<div class="lh"><h1>${S.modo === 'estrategia' && s ? html`¿Qué trabajamos de ${s}?` : S.modo === 'diseno' && s ? html`¿Qué diseñamos para ${s}?` : S.modo === 'consulting' && s ? html`¿Qué ordenamos del negocio de ${s}?` : S.modo === 'marketing' && s ? html`¿Qué planeamos para ${s}?` : S.modo === 'produccion' && s ? html`¿Qué producimos para ${s}?` : S.modo === 'organizacion' ? '¿Qué organizamos hoy?' : '¿En qué trabajamos?'}</h1>
      <p>${m.depto} · ${m.sub}. Con las reglas de Inherent y el modelo que elijas.</p></div>`;
  }
  // El servidor fuera de línea (raro): se dice y se puede reintentar; mientras, los chats por el puente siguen.
  function setupHtml() {
    const h = S.salud;
    const atajos = html`<p class="lsu-mut">Mientras tanto, los chats por el puente de tu compu: ${me.areas?.includes('estrategia') ? html`<a href="#/ws/strategy">Strategy</a> · ` : ''}<a href="#/ws/creative">Creative</a>.</p>`;
    if (!h) return html`<div class="lsu"><p class="lsu-mut">Buscando el servidor…</p></div>`;
    if (!h.on) return html`<div class="lsu"><h2>El servidor no está en línea ahora</h2><p>Suele volver en un momento. Tus conversaciones están guardadas en el OS.</p><div class="lsu-acts"><button type="button" class="lsu-btn" data-a="revisar">Revisar otra vez</button></div>${atajos}</div>`;
    return '';
  }
  const sinModelo = () => false; // el servidor siempre trae sus modelos

  function pintarSug() {
    const box = C('llm-sug');
    if (!vacio() || !listo()) return mount(box, '');
    mount(box, html`<div class="lsg">${(SUGERENCIAS[S.modo] || []).map(([t, k]) => html`<button type="button" class="lsg-c" data-a="sugerencia" data-t="${t}"><b>${t}</b><span>${k}</span></button>`)}</div>`);
  }

  // ---------- La caja (composer): modo · cliente/marca · modelo · voz · enviar ----------
  // El nombre del modelo en la caja: sin la IA (ya la dice el switch), salvo en «Otras» o por una pasarela (Kilo,
  // OpenRouter…), donde va el proveedor.
  const conProv = (x) => (iaDe(x.provider, x.model) === 'otras' || esLocal(x.provider) || PASARELAS.includes(x.provider) ? `${nombreProveedor(x.provider)} · ` : '') + x.model.split('/').pop();
  function nombreModelo() {
    if (S.privado) { const l = modeloLocal(); return l ? conProv(l) : 'Sin modelo local'; }
    const v = S.modelo, a = S.modelos?.actual;
    if (v?.model) return conProv(v);
    return a?.model ? conProv(a) : 'Modelo';
  }
  // El switch de IA: qué inteligencia (o empresa) responde. Solo las que esta compu tiene listas; «En tu compu» es el modo privado.
  function iasHtml() {
    return ''; // en el servidor no hay modelos de tu compu ni varias empresas: un solo selector de modelo
    // eslint-disable-next-line no-unreachable
    if (!S.modelos) return '';
    const xs = iasListas(S.modelos), on = iaAhora();
    if (xs.length < 2) return '';
    return html`<div class="lc-ias" role="radiogroup" aria-label="Qué IA responde">${xs.map(([id, n, ic]) => html`<button type="button" role="radio" class="${id === on ? 'on' : ''}" aria-checked="${id === on ? 'true' : 'false'}" data-a="ia" data-ia="${id}" style="--c:var(--ia-${id})" title="${id === 'local' ? 'En tu compu · privado: nada sale de ella' : n}" aria-label="${n}">${ico(ic, 15)}</button>`)}</div>`;
  }
  // Un solo estado: si responde un modelo de tu compu, es el modo privado (con su regla). Un modelo guardado de un
  // proveedor que el servidor ya no tiene listo se suelta: vuelve el de por defecto.
  const provListo = (m) => Boolean(m?.model && (S.modelos?.proveedores || []).some((p) => p.slug === m.provider && p.listo));
  function ajustarModelo() {
    if (!S.modelos?.proveedores) return;
    for (const [k, m] of Object.entries(S.porIa)) if (!provListo(m)) delete S.porIa[k];
    if (S.modelo?.model && !provListo(S.modelo)) S.modelo = null;
    if (!S.privado && (S.modelo?.model ? esLocal(S.modelo.provider) : esLocal(S.modelos.actual?.provider))) S.privado = true;
  }
  // Cambiar de IA: vuelve al último modelo que usaste con ella, o al de por defecto si es de ella, o al primero que tenga.
  function ponerIa(id) {
    if (id === 'local' ? S.privado : !S.privado && id === iaAhora()) return;
    if (S.modelo?.model) S.porIa[iaDe(S.modelo.provider, S.modelo.model)] = S.modelo;
    if (id === 'local') {
      S.privado = true; if (provListo(S.porIa.local)) S.modelo = S.porIa.local;
      persistir(); toast(modeloLocal() ? 'En tu compu: nada sale de ella' : 'Falta un modelo en tu compu', !modeloLocal()); return pintarCaja();
    }
    S.privado = false; if (esLocal(S.modelo?.provider)) S.modelo = null;
    const ms = modelosDeIa(S.modelos, id);
    const guardado = S.porIa[id], sigue = guardado && ms.some((m) => m.provider === guardado.provider && m.model === guardado.model);
    const a = S.modelos?.actual;
    S.modelo = sigue ? guardado : a?.model && iaDe(a.provider, a.model) === id ? null : ms[0] || null;
    persistir(); pintarCaja();
  }
  function pintarCaja() {
    const box = C('llm-compw'), prev = $('#llm-in', el)?.value || '';
    if (!listo()) return mount(box, vacio() ? heroHtml() : html`<div class="llm-col">${setupHtml()}</div>`);
    const m = modoDe(S.modo), sl = slugAhora();
    mount(box, html`${vacio() ? heroHtml() : ''}<div class="lc-w">
      <form class="lc" id="llm-form"><div class="lc-cmds" id="lc-cmds" hidden></div>
        <textarea id="llm-in" rows="1" placeholder="${m.pide && !sl ? `Primero elige ${m.pide === 'marca' ? 'una marca' : 'un cliente'} abajo…` : 'Pide algo…   «/» para comandos'}" aria-label="Mensaje"></textarea>
        <div class="lc-row">
          <button type="button" class="lc-chip lc-modo" data-a="menu-modo" aria-haspopup="listbox"><i data-m="${m.id}">${m.letra}</i>${m.nombre}<span class="lc-car">▾</span></button>
          ${m.pide ? html`<button type="button" class="lc-chip ${sl ? '' : 'falta'}" data-a="menu-slug" aria-haspopup="listbox">${ico(m.pide === 'marca' ? 'grid' : 'users', 13)}${sl ? nombreSlug() : m.pide === 'marca' ? 'Elige una marca' : 'Elige un cliente'}<span class="lc-car">▾</span></button>` : ''}
          <span class="sp"></span>
          ${iasHtml() || ''}${'' && html`<button type="button" class="lc-chip lc-priv ${S.privado ? 'on' : ''}" data-a="privado" aria-pressed="${S.privado ? 'true' : 'false'}" title="${S.privado ? 'Modo privado: responde un modelo en tu compu; nada sale de ella' : 'Prender el modo privado: para datos de clientes, finanzas o lo que no debe salir de tu compu'}">${ico('lock', 13)}<span>Privado</span></button>`}
          <button type="button" class="lc-chip lc-model" data-a="menu-modelo" aria-haspopup="listbox" title="Qué modelo del servidor responde">${S.privado ? ico('lock', 12) : html`<i class="lc-dot on"></i>`}${nombreModelo()}${S.esfuerzo ? html`<span class="lc-esf">· ${nombreEsfuerzo(S.esfuerzo)}</span>` : ''}<span class="lc-car">▾</span></button>
          ${botonVoz()}
          ${S.enVuelo ? html`<button type="button" class="lc-send stop" data-a="detener" aria-label="Detener">${ICO_STOP}</button>` : html`<button type="submit" class="lc-send" aria-label="Enviar">${ICO_ARRIBA}</button>`}
        </div></form>
      <p class="lc-nota">El Inherent LLM trabaja con las reglas de Inherent y puede equivocarse: revisa lo importante.</p></div>`);
    const ta = $('#llm-in', el); ta.value = prev;
    if (borrador && !prev) { ta.value = borrador; borrador = ''; persistir(); }
    crecer(ta);
    ta.oninput = () => { crecer(ta); comandos(ta.value); };
  }
  const crecer = (ta) => { ta.style.height = 'auto'; ta.style.height = Math.min(240, ta.scrollHeight) + 'px'; };

  // Los comandos «/»: aparecen al escribir «/» al inicio.
  function comandos(v) {
    const box = $('#lc-cmds', el); if (!box) return;
    // F4.5 · «@»: los agentes activos (la lista se trae la primera vez).
    if (/^@\S*$/.test(v.trim())) {
      if (!S.listaAgentes) { listaAgentes().then(() => { if (S.listaAgentes) comandos($('#llm-in', el)?.value || ''); }); return; }
      const xs = menuArroba(S.listaAgentes, v); box.hidden = !xs.length; return mount(box, menuArrobaHtml(xs));
    }
    const q = /^\/\S*$/.test(v.trim()) ? v.trim().toLowerCase() : null;
    const lst = q === null ? [] : COMANDOS.filter(([c]) => c.startsWith(q.normalize('NFD').replace(/[̀-ͯ]/g, '')));
    box.hidden = !lst.length;
    mount(box, html`${lst.map(([c, d], i) => html`<button type="button" class="${i ? '' : 'on'}" data-a="comando" data-c="${c}"><b>${c}</b><span>${d}</span></button>`)}`);
  }

  // ---------- La conversación ----------
  const textoDe = (c) => (Array.isArray(c) ? c.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('') : String(c ?? ''));
  function msgHtml(x, i) {
    if (x.r === 'u') return html`<div class="lm u"><div class="lm-b">${x.t}</div></div>`;
    if (x.r === 'plan') return planAgenteHtml(x.p, i);
    const ult = i === S.msgs.length - 1, busy = x.stream, m = modoDe(x.modo || S.modo);
    const pasos = x.tools || [];
    const pasosHtml = pasos.length ? html`<details class="lm-steps" ${busy ? raw('open') : ''}><summary>${busy ? html`<i class="lm-spin"></i>${nombrePaso(pasos[pasos.length - 1].nombre)}` : `${pasos.length} ${pasos.length === 1 ? 'paso' : 'pasos'}`}</summary>
      <ol>${pasos.map((p) => html`<li class="${p.fase}">${ico(p.fase === 'error' ? 'alert' : p.fase === 'fin' ? 'check' : 'spark', 11)}<span>${nombrePaso(p.nombre)}${p.detalle ? html`<small>${p.detalle}</small>` : ''}</span></li>`)}</ol></details>` : '';
    const t = x.tarjetas || {};
    const crit = t.criterios ? html`<div class="lm-crit ${t.criterios.falta.length ? 'falta' : 'ok'}"><div class="lm-crit-h"><b>Criterios${t.criterios.entregable ? ` · ${t.criterios.entregable}` : ''}</b><span>${t.criterios.falta.length ? `Falta ${t.criterios.falta.length}` : 'Listo'}</span></div>
      ${t.criterios.cumple.map((c) => html`<div class="si">${ico('check', 12)}${c}</div>`)}${t.criterios.falta.map((c) => html`<div class="no"><i></i>${c}</div>`)}</div>` : '';
    const preg = t.pregunta ? html`<div class="lm-preg ${ult ? '' : 'hecha'}"><span class="lm-k">Una pregunta antes de seguir</span><b>${t.pregunta.texto}</b>${t.pregunta.por_que ? html`<small>${t.pregunta.por_que}</small>` : ''}${t.pregunta.opciones.length ? html`<div class="lm-ops">${t.pregunta.opciones.map((o) => html`<button type="button" data-a="opcion" data-t="${o}" ${ult ? '' : raw('disabled')}>${o}</button>`)}</div>` : ''}</div>` : '';
    const apr = ''; // los permisos de Hermes se retiraron: lo que cambia algo llega como propuesta (props)
    // Lo que el servidor propone cambiar en el OS: no pasa nada hasta que la persona lo aprueba (lo ejecuta el OS con su sesión).
    const props = (x.propuestas || []).map((p, k) => {
      const datos = Object.entries(p.args || {}).filter(([, v]) => v !== '' && v != null).slice(0, 10);
      const estado = p.estado === 'aprobada' ? html`<span class="lm-meta-ok">${ico('check', 13)} Hecho</span>` : p.estado === 'rechazada' ? html`<span class="lm-enc-no">Rechazada</span>` : p.estado === 'fallo' ? html`<span class="lm-enc-no">${ico('alert', 13)} No se pudo: ${p.error || ''}</span>` : p.decidiendo ? html`<span class="lm-meta-ok">Haciéndolo…</span>`
        : html`<div class="lm-ops"><button type="button" class="si" data-a="propuesta" data-d="aprobar" data-i="${i}" data-k="${k}" ${busy ? raw('disabled') : ''}>Aprobar</button><button type="button" class="no" data-a="propuesta" data-d="rechazar" data-i="${i}" data-k="${k}" ${busy ? raw('disabled') : ''}>Rechazar</button></div>`;
      return html`<div class="lm-apr lm-prop"><span class="lm-k">${ico('alert', 12)} Propuesta · necesita tu OK</span><b>${p.titulo || p.tool}</b><code>${p.tool}</code>
        ${datos.length ? html`<dl class="lm-prop-d">${datos.map(([k2, v]) => html`<dt>${k2}</dt><dd>${typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>`)}</dl>` : ''}${estado}</div>`;
    });
    const cuerpo = x.t ? md(x.t) : busy && !pasos.length ? html`<span class="lm-think"><i></i>Pensando…</span>` : '';
    return html`<div class="lm a"><span class="lm-av" data-m="${m.id}">${m.letra}</span><div class="lm-tx">${pasosHtml}<div class="lm-md">${cuerpo}</div>${x.notas?.length ? html`<div class="lm-notas">${x.notas.map((n) => html`<p>${n}</p>`)}</div>` : ''}
      ${apr}${props}${x.tarjetas?.meta ? metaHtml(x.tarjetas.meta, ult) : ''}${x.tarjetas?.plan ? planHtml(x.tarjetas.plan, i, x) : ''}${(x.tarjetas?.campanas || []).map((c, k) => campanaHtml(c, i, k, x))}${(x.tarjetas?.encargos || []).map((en, k) => encargoHtml(en, i, k, x))}${crit}${preg}${x.aplicado ? html`<span class="lm-upd">✦ ${x.aplicado}</span>` : ''}${x.aviso ? html`<p class="lm-aviso">${x.aviso}</p>` : ''}${x.err ? html`<p class="lm-err">${x.err}</p>` : ''}
      ${!busy && (x.t || x.err) ? html`<div class="lm-acts">${x.t ? html`<button type="button" data-a="copiar" data-t="${x.t}">${ico('copy', 13)} Copiar</button>` : ''}${ult ? html`<button type="button" data-a="reintentar">${ico('redo', 13)} Reintentar</button>` : ''}${ult && S.sesion && !x.err ? html`<button type="button" data-a="ramificar">${ICO_RAMA} Ramificar</button>` : ''}</div>` : ''}</div></div>`;
  }
  function pintarHilo() {
    const col = C('llm-col'), box = C('llm-conv');
    if (vacio()) { mount(col, ''); flecha(); return; }
    const abajo = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    // F4.5: los mensajes y, entre ellos, lo que pasa en cada trabajo ligado; al final, lo que el servidor hace ahora.
    const items = S.agentes.length ? hiloChat(S.msgs, S.agentes) : S.msgs.map((_, i) => ({ tipo: 'msg', i }));
    // Lo que estás escribiendo en una tarjeta sobrevive a la relectura de los trabajos.
    const escrito = Object.fromEntries([...col.querySelectorAll('textarea[data-k]')].filter((t) => t.value).map((t) => [t.dataset.k, t.value]));
    const ctx = { me, rol, otros: S.agentes, sesion: S.sesion };
    mount(col, html`${items.map((it) => (it.tipo === 'msg' ? msgHtml(S.msgs[it.i], it.i) : eventoHtml(it, ctx)))}${S.agentes.map(vivoHtml)}${desvioHtml()}`);
    for (const t of col.querySelectorAll('textarea[data-k]')) if (escrito[t.dataset.k]) t.value = escrito[t.dataset.k];
    if (abajo || S.enVuelo) box.scrollTop = box.scrollHeight;
    flecha();
  }
  // Un encargo de Estrategia para otra área (Consulting o Diseño): se manda con un botón y queda como tarea de quien lo manda.
  // Sin un área que se entienda no se esconde: sale con el aviso. Fuera del alcance, o sin tareas en el perfil, no hay botón.
  function encargoHtml(en, i, k, x) {
    const a = areaDe(en.area), hecho = x.mandados?.[k], sl = slugAhora(), nom = AREAS_ENCARGO[en.area];
    if (!nom) return html`<div class="lm-enc"><span class="lm-k">${ico('alert', 12)} Encargo sin un área que se entienda</span><b>${en.titulo}</b>${en.por_que ? html`<small>${en.por_que}</small>` : ''}<small class="lm-enc-no">Pídele que diga a qué área va: Consulting, Marketing o Diseño.</small></div>`;
    const ir = `#/ws/${en.area === 'consulting' ? 'consulting' : en.area === 'diseno' ? 'creative' : 'marketing'}/${encodeURIComponent(sl)}/overview`;
    const ops = hecho === 'enviando' ? html`<span class="lm-meta-ok">Mandando…</span>`
      : hecho === 'fuera' ? html`<span class="lm-enc-no">${ico('alert', 13)} Fuera del alcance de su nivel · escálalo al CEO</span>`
      : hecho ? html`<span class="lm-meta-ok">${ico('check', 13)} ${hecho === 'ya' ? 'Ya está abierto' : 'Mandado'} · en Mis tareas</span>${sl ? html`<a class="lm-enc-ir" href="${ir}">Abrir en ${nom} ↗</a>` : ''}`
      : !verTareas(me) ? html`<span class="lm-enc-no">Tu perfil no ve las tareas: pídele al CEO que lo mande</span>`
      : html`<button type="button" class="si" data-a="encargo" data-i="${i}" data-k="${k}" ${S.enVuelo ? raw('disabled') : ''}>Mandar a ${nom}</button>`;
    return html`<div class="lm-enc" data-m="${en.area}"><span class="lm-k">${ico(a?.icono || 'send', 12)} Encargo para ${nom}</span><b>${en.titulo}</b>${en.por_que ? html`<small>${en.por_que}</small>` : ''}<div class="lm-ops">${ops}</div></div>`;
  }
  // ③ Marketing propone el plan del mes o una campaña: se guardan con un botón (nada se guarda solo).
  function planHtml(pl, i, x) {
    const secc = Object.keys(pl).map((k) => (NOMBRE_P[k] || k).replace(/^(La|El|Los|Las) /, '').toLowerCase()).join(', '), sl = slugAhora();
    return html`<div class="lm-enc" data-m="marketing"><span class="lm-k">${ico('target', 12)} Plan de ${nombreMes(mesPlan)}</span><b>Cambia: ${secc}</b>${pl.slots ? html`<small>${pl.slots.length} piezas en el plan</small>` : ''}
      <div class="lm-ops">${x.planGuardado ? html`<span class="lm-meta-ok">${ico('check', 13)} Guardado en el plan</span>${sl ? html`<a class="lm-enc-ir" href="${rutaModulo(encodeURIComponent(sl), 'plan', [mesPlan])}">Ver el plan ↗</a>` : ''}` : html`<button type="button" class="si" data-a="guardar-plan" data-i="${i}" ${S.enVuelo ? raw('disabled') : ''}>Guardar en el plan</button>`}</div></div>`;
  }
  function campanaHtml(c, i, k, x) {
    const sl = slugAhora(), a = anticipacion(c);
    return html`<div class="lm-enc" data-m="marketing"><span class="lm-k">${ico('calendar-days', 12)} ${tipoDe(c.tipo)[1]}${c.ancla ? ` · ${c.ancla}` : ''}</span><b>${c.nombre}</b>${c.frase ? html`<small>«${c.frase}»</small>` : ''}${a.length ? html`<small>${a.map((y) => `${y.que.toLowerCase()} ${y.fecha.slice(5)}`).join(' · ')}</small>` : ''}
      <div class="lm-ops">${x.campanasGuardadas?.[k] ? html`<span class="lm-meta-ok">${ico('check', 13)} Guardada en Campañas y eventos</span>${sl ? html`<a class="lm-enc-ir" href="${rutaModulo(encodeURIComponent(sl), 'campanas')}">Abrir ↗</a>` : ''}` : html`<button type="button" class="si" data-a="guardar-campana" data-i="${i}" data-k="${k}" ${S.enVuelo ? raw('disabled') : ''}>Guardar la campaña</button>`}</div></div>`;
  }
  async function guardarPlan(i) {
    const x = S.msgs[i], pl = x?.tarjetas?.plan, sl = slugAhora(); if (!pl || x.planGuardado) return;
    if (!sl) return toast('Primero elige la marca de esta conversación', true);
    try { const r = await api(`plan/${encodeURIComponent(sl)}/${mesPlan}`, { method: 'PUT', body: { parche: limpiarPlan(pl) } }); x.planGuardado = true; toast(r.cambiadas?.length ? `Plan de ${nombreMes(mesPlan)} al día` : 'El plan ya tenía eso'); olvidarPanel(`mk:${sl}:${mesPlan}`); pintarPanel(); }
    catch (e) { toast(e.message, true); }
    pintarHilo();
  }
  async function guardarCampana(i, k) {
    const x = S.msgs[i], c = x?.tarjetas?.campanas?.[k], sl = slugAhora(); if (!c || x.campanasGuardadas?.[k]) return;
    if (!sl) return toast('Primero elige la marca de esta conversación', true);
    try { const r = await api(`campanas/${encodeURIComponent(sl)}`, { method: 'POST', body: c }); x.campanasGuardadas = { ...(x.campanasGuardadas || {}), [k]: true }; toast(r.nueva ? 'Campaña guardada' : 'Ya existía: la puse al día'); olvidarPanel(`mk:${sl}:${mesPlan}`); pintarPanel(); }
    catch (e) { toast(e.message, true); }
    pintarHilo();
  }
  // Ya hay uno abierto igual (mismo cliente, área y título). Uno hecho no cuenta: un encargo puede volver cada ciclo.
  const abiertoIgual = (ts, en, sl) => ts.some((t) => t.origen === 'estrategia' && t.cliente === sl && t.area === en.area && t.title === en.titulo && t.status !== 'Hecha');
  async function mandarEncargo(i, k) {
    const x = S.msgs[i], en = x?.tarjetas?.encargos?.[k], sl = slugAhora(); if (!en?.area || x.mandados?.[k]) return;
    if (!sl) return toast('Primero elige el cliente de esta conversación', true);
    // Se marca antes de esperar a nadie: un doble clic no lo manda dos veces.
    const marca = (v) => { const m = { ...(x.mandados || {}) }; if (v) m[k] = v; else delete m[k]; x.mandados = m; pintarHilo(); };
    marca('enviando');
    try {
      if (en.area === 'consulting') {
        const d = await datosEstrategia(sl);
        if (!consultingAbierto(alcanceConsulting(d.nivel, d.ficha))) { marca('fuera'); return toast(`Con ${d.nivel?.nombre || 'su ficha'}, Consulting va fuera del alcance: escálalo al CEO`, true); }
      }
      const ya = abiertoIgual(await col('tasks').list(), en, sl);
      if (!ya) await col('tasks').create(tareaDeEncargo(en, { cliente: sl, nombre: nombreSlug(), email: me.email }));
      marca(ya ? 'ya' : 'si');
      toast(ya ? 'Ese encargo ya está abierto en Mis tareas' : `Mandado a ${AREAS_ENCARGO[en.area]} · está en Mis tareas`);
    } catch (e) { marca(''); toast(e.status === 403 ? 'Tu perfil no puede crear tareas: pídeselo al CEO' : `No se pudo mandar: ${e.message}`, true); }
  }
  // Al volver a abrir una conversación, los encargos que ya están abiertos en las tareas salen como mandados.
  async function marcarMandados() {
    const sl = slugAhora(); if (!sl || !verTareas(me) || !S.msgs.some((x) => x.tarjetas?.encargos?.length)) return;
    const ts = await col('tasks').list().catch(() => null); if (!ts || !alive()) return;
    for (const x of S.msgs) (x.tarjetas?.encargos || []).forEach((en, k) => { if (en.area && !x.mandados?.[k] && abiertoIgual(ts, en, sl)) x.mandados = { ...(x.mandados || {}), [k]: 'ya' }; });
    pintarHilo();
  }

  // Llevas varios turnos y ninguna tarea se movió: la Brújula te ofrece volver (una vez por desvío).
  function desvioHtml() {
    const b = S.brujula; if (!desviado(b) || S.enVuelo || S.msgs[S.msgs.length - 1]?.r !== 'a') return '';
    const t = tareaActual(b).t;
    return html`<div class="lm-desvio" role="status">${ico('alert', 14)}<div><p>Llevas ${b.giros} turnos y ninguna tarea se ha movido. ¿Volvemos a «${t}»?</p><div class="lm-ops"><button type="button" class="si" data-a="volver-tarea">Volver a «${t.length > 34 ? t.slice(0, 33) + '…' : t}»</button><button type="button" data-a="seguir-asi">Seguir así</button></div></div></div>`;
  }
  // Solo el último mensaje, mientras llega el streaming (no se repinta toda la conversación).
  let raf = 0;
  function pintarUltimo() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const col = C('llm-col'), box = C('llm-conv'), ult = col?.lastElementChild; if (!ult || S.agentes.length) return pintarHilo();
      const abajo = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
      const tmp = document.createElement('div'); mount(tmp, msgHtml(S.msgs[S.msgs.length - 1], S.msgs.length - 1));
      const steps = ult.querySelector('.lm-steps'), abierto = steps ? steps.open : null;
      ult.replaceWith(tmp.firstElementChild);
      if (abierto === false) { const s = col.lastElementChild.querySelector('.lm-steps'); if (s) s.open = false; }
      if (abajo) box.scrollTop = box.scrollHeight;
    });
  }
  function flecha() { const box = C('llm-conv'), b = $('.llm-abajo', el); if (box && b) b.hidden = vacio() || box.scrollHeight - box.scrollTop - box.clientHeight < 160; }
  C('llm-conv').addEventListener('scroll', flecha, { passive: true });

  // ---------- El panel del modo ----------
  let panelGen = 0;
  async function pintarPanel() {
    const box = C('llm-panel'); if (!S.panel) return mount(box, '');
    const gen = ++panelGen;
    // F4.5 · la ventana de agentes: una pestaña por trabajo ligado a la conversación (cerrar una pestaña no cierra el trabajo).
    const tabs = S.agentes.filter((r) => !S.cerradas?.has(r.id)), run = S.tab !== 'modo' && tabs.find((r) => r.id === S.tab);
    const cab = tabs.length ? pestanasHtml(modoDe(S.modo), tabs, run ? run.id : 'modo') : '';
    if (run) {
      mount(box, html`${angosto() ? html`<button type="button" class="lp-cerrar" data-a="panel">${ico('x', 14)} Cerrar</button>` : ''}${cab}<div class="llm-av"></div>`);
      return pintarVentana($('.llm-av', box), { me, run, rol, modelos: modelosGw(), onCambio: alCambiar, onPlan: (r) => proponerPlan({ id: r.flujo.id }, '', { run: r }) });
    }
    if (!box.childElementCount) mount(box, html`<p class="lp-mut" style="padding:16px">Cargando…</p>`);
    // Production no tiene panel propio todavía (llm/paneles.js): se ve el de Creative, las piezas del mes de la marca.
    const h = await panelDe({ me, modo: S.modo === 'produccion' ? 'diseno' : S.modo, slug: slugAhora(), nombre: nombreSlug(), mes: mesPlan });
    if (gen === panelGen && alive()) mount(box, html`${angosto() ? html`<button type="button" class="lp-cerrar" data-a="panel">${ico('x', 14)} Cerrar</button>` : ''}${cab}${brujulaHtml()}${h}${usoHtml()}`);
  }

  // ---------- La Brújula: la meta medible de la conversación, sus tareas y el ritmo de la semana ----------
  const ICO_BRU = () => ico('compass', 16);
  function metaHtml(m, ult) {
    const ya = Boolean(S.brujula), activa = ult && !ya && !S.enVuelo;
    return html`<div class="lm-meta ${ya ? 'hecha' : ''}"><b class="lm-meta-h">${ICO_BRU()} ${ya ? 'Meta de esta conversación' : 'Antes de empezar, aterricemos la meta'}</b>
      ${m.por_que && !ya ? html`<p class="lm-meta-p">${m.por_que} Propongo:</p>` : ''}<mark class="lm-meta-m">${m.propuesta}</mark>
      ${activa ? html`<div class="lm-ops"><button type="button" class="si" data-a="meta-aceptar">Aceptar meta</button><button type="button" data-a="meta-ajustar">Ajustar</button><button type="button" data-a="meta-tarea">Es solo una tarea</button></div>` : ya ? html`<span class="lm-meta-ok">${ico('check', 13)} Aceptada · la sigues en la Brújula</span>` : ''}</div>`;
  }
  function brujulaHtml() {
    const b = S.brujula; if (!b) return '';
    const { hechas, total, pct } = progreso(b), ahora = tareaActual(b);
    return html`<section class="bru" aria-label="Brújula"><header><b>${ICO_BRU()} Brújula</b><span class="bru-chip">${b.tipo === 'tarea' ? 'Tarea' : 'Proyecto'}</span><button type="button" class="llm-ib bru-quitar" data-a="bru-quitar" title="Quitar la brújula de esta conversación" aria-label="Quitar la brújula">${ico('trash', 14)}</button></header>
      <h3>${b.meta}</h3>${b.medida || b.vence ? html`<p class="bru-mut">${b.medida ? `Medida: ${b.medida}` : ''}${b.medida && b.vence ? ' · ' : ''}${b.vence ? `vence ${b.vence}` : ''}</p>` : ''}
      <div class="bru-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      <p class="bru-mut">${terminada(b) ? html`<b class="bru-listo">${ico('check', 13)} Meta cumplida</b> · ` : ''}${hechas} de ${total} tareas · ${pct}%</p>
      <ul class="bru-ts">${b.tareas.map((x, i) => html`<li class="${x.hecha ? 'hecha' : ''}"><button type="button" class="bru-ck" role="checkbox" aria-checked="${x.hecha ? 'true' : 'false'}" data-a="bru-tarea" data-k="${i}" aria-label="${x.hecha ? 'Desmarcar' : 'Marcar como hecha'}: ${x.t}">${x.hecha ? ico('check', 13) : ''}</button><span class="bru-t">${x.t}</span>${x === ahora ? html`<span class="bru-tag ahora">Ahora</span>` : x.quien === 'tu' ? html`<span class="bru-tag tu">TÚ</span>` : html`<small class="bru-ia">${QUIEN.ia}</small>`}</li>`)}</ul></section>`;
  }
  // El uso del Chat esta semana contra TU límite: para no quemarlo el lunes.
  function usoHtml() {
    if (!listo()) return '';
    const ini = inicioSemana(), usados = S.sesiones.filter((x) => (Date.parse(x.last_active) || (+x.last_active < 1e12 ? +x.last_active * 1000 : +x.last_active) || 0) >= ini).reduce((a, x) => a + usosDe(x), 0);
    const r = ritmoSemana({ usados, limite: S.limite });
    if (r.pct == null) return html`<section class="bru-uso"><span class="lp-k">Uso del Chat esta semana</span><p class="bru-mut">${usados} ${usados === 1 ? 'uso' : 'usos'} desde el lunes. <button type="button" class="bru-link" data-a="uso-limite">Pon tu límite</button> y te digo a qué ritmo vas.</p></section>`;
    const alto = r.pct > r.ideal + 10;
    return html`<section class="bru-uso ${alto ? 'alto' : ''}"><span class="lp-k">Uso del Chat esta semana · tu límite: ${S.limite}</span>
      <div class="bru-bar uso"><i style="width:${Math.min(100, r.pct)}%"></i><b class="bru-ideal" style="left:${r.ideal}%" title="Dónde deberías ir hoy"></b></div>
      <p class="bru-mut">${r.pct}% usado · ritmo ideal ${r.ideal}% · ${r.pct >= 100 ? 'ya llegaste a tu límite' : `te quedan ~${r.porDia}%/día`}</p></section>`;
  }
  function pintarBrujula() {
    const c = C('llm-bru'); if (!c) return;
    const b = S.brujula; c.hidden = !b;
    if (b) { const { hechas, total } = progreso(b); mount(c, html`${ICO_BRU()}<span>${hechas}/${total}</span>`); c.classList.toggle('alerta', desviado(b)); }
  }
  function ponerBrujula(b) { S.brujula = b; guardarBrujula(me, S.sesion, b); pintarBrujula(); }

  // ---------- Menús (modo, cliente/marca, modelo) ----------
  function menu(anchor, titulo, items, onPick, { buscar = false, pie = '' } = {}) {
    el.querySelector('.llm-menu')?.remove();
    const m = document.createElement('div'); m.className = 'llm-menu'; m.setAttribute('role', 'listbox');
    const pintar = (q = '') => { const xs = items.filter((x) => x.grupo ? !q : !q || x.label.toLowerCase().includes(q.toLowerCase())); return html`<span class="lmn-k">${titulo}</span>${buscar ? html`<input class="lmn-q" placeholder="Buscar" aria-label="Buscar">` : ''}<div class="lmn-l">${xs.length ? xs.map((x) => x.grupo ? html`<span class="lmn-k lmn-g">${x.grupo}</span>` : html`<button type="button" role="option" class="${x.on ? 'on' : ''} ${x.off ? 'off' : ''}" data-v="${x.v}" ${x.off ? raw('disabled') : ''}>${x.ico || ''}<span><b>${x.label}</b>${x.sub ? html`<small>${x.sub}</small>` : ''}</span>${x.fin || ''}${x.on ? ico('check', 13) : ''}</button>`) : html`<p class="lmn-mut">Nada por aquí.</p>`}</div>${pie}`; };
    mount(m, pintar());
    R.append(m);
    const r = anchor.getBoundingClientRect(), rr = R.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(r.left - rr.left, rr.width - 300)) + 'px';
    m.style.bottom = (rr.bottom - r.top + 8) + 'px';
    const q = m.querySelector('.lmn-q'); if (q) { q.focus(); q.oninput = () => { const v = q.value; mount(m, pintar(v)); const n = m.querySelector('.lmn-q'); n.value = v; n.focus(); n.oninput = q.oninput; }; }
    m.addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (!b || b.disabled) return; m.remove(); onPick(b.dataset.v); });
    setTimeout(() => document.addEventListener('pointerdown', function cerrar(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', cerrar); } }));
  }
  const menuModo = (a) => menu(a, 'Modo', modos.map((m) => ({ v: m.id, label: m.nombre, sub: m.sub, on: m.id === S.modo, ico: html`<i class="lmn-m" data-m="${m.id}">${m.letra}</i>` })), (v) => cambiarModo(v));
  const menuSlug = (a) => menu(a, modoDe(S.modo).pide === 'marca' ? 'Marca' : 'Cliente', opciones().map(([s, n]) => ({ v: s, label: n, on: s === slugAhora() })), (v) => { S.slugs[S.modo] = v; persistir(); nuevo(); }, { buscar: true });
  // Los íconos de las áreas donde el modelo rinde mejor (llm/ias.js · FUERTES).
  const fuertesHtml = (x) => { const as = fuertesDe(x).map(areaDe).filter(Boolean); return as.length ? html`<span class="lmn-fu" title="${'Rinde mejor en ' + as.map((a) => a.nombre).join(' y ')}">${as.map((a) => html`<i style="color:var(--ui-m-${a.id})">${ico(a.icono, 13)}</i>`)}</span>` : ''; };
  async function menuModelo(a) {
    if (!S.modelos) { try { S.modelos = await B.modelos(); ajustarModelo(); } catch { S.modelos = { actual: {}, proveedores: [] }; } }
    // Con el switch de IA, aquí van solo los modelos de esa IA (sin IA conocida, todos).
    // Si la IA de ahora ya no está lista, no se filtra: que siempre haya algo que elegir.
    const ia = iasListas(S.modelos).some(([k]) => k === iaAhora()) ? iaAhora() : '', deIa = (slug, x) => (S.privado ? esLocal(slug) : !esLocal(slug) && (!ia || iaDe(slug, x) === ia));
    const nombreIa = (IAS.find(([k]) => k === ia) || [])[1];
    const items = [{ grupo: 'Cuánto piensa' }, ...ESFUERZOS.map(([k, l, d]) => ({ v: 'esf:' + k, label: l, sub: d, on: (S.esfuerzo || '') === k })), { grupo: S.privado ? 'Modelos en tu compu (modo privado)' : nombreIa ? `Modelos de ${nombreIa}` : 'Qué modelo responde' }];
    if (!S.privado && (!ia || iaDe(S.modelos.actual.provider, S.modelos.actual.model) === ia)) items.push({ v: '', label: 'Por defecto del servidor', sub: S.modelos.actual.model ? `${nombreProveedor(S.modelos.actual.provider)} · ${S.modelos.actual.model}` : 'El modelo por defecto del servidor', on: !S.modelo?.model });
    const loc = S.privado ? modeloLocal() : null;
    for (const p of S.modelos.proveedores) for (const x of p.listo ? p.modelos.filter((x) => deIa(p.slug, x)).slice(0, PASARELAS.includes(p.slug) ? 40 : 8) : []) items.push({ v: `${p.slug}|${x}`, label: `${nombreProveedor(p.slug)} · ${x.split('/').pop()}`, sub: esLocal(p.slug) ? `${p.nombre} · en tu compu` : p.nombre, fin: fuertesHtml(x), on: S.privado ? loc?.provider === p.slug && loc?.model === x : S.modelo?.provider === p.slug && S.modelo?.model === x });
    if (S.privado && !loc) items.push({ v: 'x', label: 'Todavía no hay un modelo en tu compu', sub: 'El servidor no corre modelos locales', off: true });
    const pie = '';
    menu(a, 'Modelo', items, (v) => {
      if (v.startsWith('esf:')) S.esfuerzo = v.slice(4);
      else { S.modelo = v ? { provider: v.split('|')[0], model: v.split('|').slice(1).join('|') } : null; if (S.modelo) S.porIa[S.privado ? 'local' : iaDe(S.modelo.provider, S.modelo.model)] = S.modelo; ajustarModelo(); }
      persistir(); pintarCaja();
    }, { buscar: items.length > 14, pie });
  }

  // ---------- Ajustes: el servidor, el límite semanal y el tema ----------
  function ajustes() {
    el.querySelector('.llm-sheet')?.remove();
    const d = document.createElement('div'); d.className = 'llm-sheet'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Ajustes del Chat');
    const h = S.salud || {};
    mount(d, html`<div class="lsh"><header><b>Ajustes del Chat</b><button type="button" class="llm-ib" data-a="cerrar-sheet" aria-label="Cerrar">${ico('x', 15)}</button></header>
      <section><span class="lp-k">El servidor</span><p><i class="ls-dot ${h.on ? 'on' : 'off'}"></i>${h.on ? `En línea${h.version ? ` · versión ${h.version}` : ''}` : 'Fuera de línea ahora'}</p>
        <p class="lp-mut">Responde el servidor de Inherent aunque tu compu esté apagada. Tus conversaciones quedan guardadas en el OS (las abres desde cualquier compu); busca en la web, usa tus conexiones (Inherent AI → MCPs), lee el OS como tú y, para cambiar algo, te deja una propuesta que apruebas.</p></section>
      <section><span class="lp-k">Tu límite semanal del Chat</span><p class="lp-mut">Cuántos usos quieres gastar por semana (los que tu suscripción aguanta). Con él, la Brújula te dice a qué ritmo vas. Es tu número: el servidor no da el límite de la suscripción.</p>
        <form class="lsu-pair" data-f="limite"><input name="n" type="number" min="0" step="10" inputmode="numeric" value="${S.limite || ''}" placeholder="Por ejemplo, 300" aria-label="Usos por semana"><button type="submit" class="lsu-btn">Guardar</button></form></section>
      <section><span class="lp-k">Día y noche</span><div class="lsh-tema">${[['sistema', 'Como mi compu'], ['dia', 'Día'], ['noche', 'Noche']].map(([k, l]) => html`<button type="button" class="${temaElegido() === k ? 'on' : ''}" data-a="tema" data-t="${k}">${l}</button>`)}</div></section>
    </div>`);
    R.append(d);
  }
  const skills = async () => (S.skills ||= await B.skills().catch(() => []));

  // ---------- Cambiar de modo, de conversación, empezar una nueva ----------
  function cambiarModo(id) {
    // El mismo modo no hace nada (para empezar de cero está «Nueva conversación»). Con una respuesta en camino no se cambia:
    // cambiar abre una conversación nueva y cortaría la respuesta.
    if (!modos.some((m) => m.id === id) || id === S.modo) return;
    if (S.enVuelo) return toast('Espera a que termine la respuesta, o detenla, para cambiar de modo', true);
    S.modo = id; persistir(); guardarArea(me.email, areaDeModo(id)?.id || '');
    if (!vacio() || S.sesion) return nuevo();
    pintarSide(); pintarCentro(); pintarPanel();
  }
  function nuevo() {
    if (S.enVuelo) S.enVuelo.abort();
    S.sesion = null; S.msgs = []; S.titulo = ''; S.side = false; S.brujula = null; S.agentes = []; S.tab = 'modo'; S.cerradas = new Set(); R.classList.remove('side-on'); pintarBrujula();
    if (location.hash !== '#/chat') history.replaceState(null, '', '#/chat');
    pintarSide(); pintarCentro(); pintarPanel(); $('#llm-in', el)?.focus();
  }
  async function abrirSesion(id) {
    const info = leerIdSesion(id); if (!info) { toast('Esa conversación no es del Inherent LLM', true); return nuevo(); }
    if (!modos.some((m) => m.id === info.modo)) { toast('Esa conversación es de un modo que tu perfil no abre', true); return nuevo(); }
    S.sesion = id; S.modo = modos.some((m) => m.id === info.modo) ? info.modo : S.modo; if (info.slug) S.slugs[S.modo] = info.slug; guardarArea(me.email, areaDeModo(S.modo)?.id || '');
    S.msgs = []; S.titulo = S.sesiones.find((s) => s.id === id)?.title || ''; S.brujula = brujulas(me)[id] || null; pintarBrujula();
    pintarSide(); pintarCentro(); pintarPanel();
    try {
      const rows = await B.mensajes(id);
      const out = []; let pend = [];
      for (const r of rows) {
        if (r.role === 'user') { const t = textoDe(r.content).trim(); if (t) { out.push({ r: 'u', t, at: r.at }); if (!S.titulo) S.titulo = tituloDe(t); } }
        else if (r.role === 'assistant') {
          for (const tc of r.tool_calls || []) pend.push({ fase: 'fin', nombre: String(tc.function?.name || tc.name || 'herramienta'), detalle: '' });
          const raw0 = textoDe(r.content); if (!raw0.trim()) continue;
          out.push({ r: 'a', modo: S.modo, at: r.at, t: textoVisible(raw0), tarjetas: leerTarjetas(raw0), tools: pend, propuestas: r.propuestas || [] }); pend = [];
        }
      }
      S.msgs = out;
    } catch (e) { S.msgs = [{ r: 'a', modo: S.modo, t: '', err: `No pude leer la conversación: ${e.message}` }]; }
    await cargarAgentesDe(id);
    // Al volver a una conversación con trabajos, la ventana abre en el que sigue en curso (o el último).
    if (S.agentes.length && !angosto()) { S.tab = (S.agentes.find((r) => !completo(r)) || S.agentes.at(-1)).id; S.panel = true; R.dataset.panel = 'on'; }
    if (alive()) { pintarTitulo(); pintarCentro(); pintarPanel(); marcarMandados(); vigilar(); }
  }

  // ---------- Modo privado y ramificar ----------
  // Prender o apagar el privado es lo mismo que elegir «En tu compu» o volver a otra IA en el switch.
  async function alternarPrivado() {
    if (!S.modelos && listo()) { try { S.modelos = await B.modelos(); ajustarModelo(); } catch {} }
    if (!S.privado) return ponerIa('local');
    const otra = (S.modelos ? iasListas(S.modelos) : []).find(([k]) => k !== 'local')?.[0];
    if (S.modelos && !otra) return toast('En esta compu solo hay modelos locales: el privado se queda prendido', true);
    if (otra) ponerIa(otra); else { S.privado = false; if (esLocal(S.modelo?.provider)) S.modelo = null; persistir(); pintarCaja(); }
    toast('Modo privado apagado');
  }
  async function ramificar() {
    if (S.enVuelo) return toast('Espera a que termine la respuesta', true);
    if (!S.sesion) return toast('Primero escribe algo en esta conversación', true);
    const nuevoId = idSesion(S.modo, slugAhora()), titulo = `${(S.titulo || 'Conversación').slice(0, 48)} · rama`;
    try { await B.ramificar(S.sesion, { nuevoId, titulo }); } catch (e) { return toast(`No pude ramificar: ${e.message}`, true); }
    toast('Rama nueva: sigue desde aquí; la original queda guardada');
    location.hash = '#/chat/' + nuevoId;
  }

  // ---------- Mandar un mensaje ----------
  async function contexto() {
    const base = { brujula: contextoBrujula(S.brujula), privado: S.privado, persona: me.name, puesto: me.title || (me.roles?.length ? me.roles : [me.role]).filter(Boolean).map(roleName).join(' · '), fecha: today() }, slug = slugAhora();
    if (S.modo === 'estrategia' && slug) {
      const d = await datosEstrategia(slug), v = d.viva || {}, P = PASOS.find((p) => p.id === avance(v).ahora), e = d.etapa?.n != null ? etapaDe(d.etapa.n) : null;
      return { ...base, cliente: d.nombre, carpeta: d.carpeta, nivel: d.nivel?.nombre || 'SIN FICHA DE OFERTA',
        extra: [`Etapa del $100M Scaling Roadmap: ${e ? `${etapaLabel(e)} (${d.etapa.confirmada ? 'confirmada por el CEO' : 'propuesta, sin confirmar'})` : 'sin diagnosticar todavía'}`,
          ...(d.ficha?.incluye?.length ? [`Su ficha incluye: ${d.ficha.incluye.map((x) => `${x.k}: ${x.v}`).join(' · ')}`] : []),
          P ? `Paso de la estrategia en el que estamos: ${P.n} · ${P.largo}` : '',
          d.vivaAprobada ? 'La estrategia está APROBADA por el CEO: no mandes el bloque ```estrategia```; si algo debe cambiar, dilo y que el CEO la reabra.' : ''].filter(Boolean),
        instrucciones: d.vivaAprobada ? '' : instrucciones(v, { nivel: d.nivel?.nombre || '' }) };
    }
    if (S.modo === 'consulting' && slug) {
      const d = await datosEstrategia(slug);
      return { ...base, cliente: d.nombre, carpeta: d.carpeta, nivel: d.nivel?.nombre || 'SIN FICHA DE OFERTA',
        extra: [...(d.ficha?.incluye?.length ? [`Su ficha incluye: ${d.ficha.incluye.map((x) => `${x.k}: ${x.v}`).join(' · ')}`] : [])] };
    }
    if (S.modo === 'marketing' && slug) {
      const [pl, cs] = await Promise.all([api(`plan/${encodeURIComponent(slug)}/${mesPlan}`).catch(() => null), api(`campanas/${encodeURIComponent(slug)}`).catch(() => null)]);
      const vivas = (cs?.campanas || []).filter((c) => !['Cerrada', 'Archivada'].includes(c.estado)).slice(0, 6);
      return { ...base, cliente: nombreSlug(), carpeta: slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${slug}`,
        extra: [`Mes del plan: ${mesPlan} (${nombreMes(mesPlan)})`, pl?.estrategia && !pl.estrategia.aprobada ? 'La estrategia de esta marca NO está aprobada: sin estrategia aprobada no hay plan ni campañas (el OS no los guarda). Dilo.' : '',
          pl?.plan ? `El plan como va (datos): ${JSON.stringify(limpiarPlan(pl.plan)).slice(0, 8000)}` : 'El plan de ese mes todavía está vacío.',
          vivas.length ? `Campañas y eventos abiertos: ${vivas.map((c) => `${c.nombre} (${tipoDe(c.tipo)[1]}, ${c.ancla || 'sin fecha'})`).join(' · ')}` : ''].filter(Boolean) };
    }
    if ((S.modo === 'diseno' || S.modo === 'produccion') && slug) return { ...base, cliente: nombreSlug(), carpeta: slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${slug}`, extra: [`Mes del ciclo: ${today().slice(0, 7)}`] };
    return { ...base, extra: [`Secciones que ve en el OS: ${(me.areas || []).join(', ') || '—'}`] };
  }
  // sinGiro: lo que la persona manda desde la Brújula (aceptar la meta, volver a la tarea) no cuenta como turno perdido.
  async function enviar(texto, { reintento = false, sinGiro = false } = {}) {
    texto = String(texto || '').trim(); if (!texto || S.enVuelo) return;
    // F4.5 · «@agente …»: no va al servidor como turno; primero se platica el plan (la tarjeta «Así lo voy a trabajar»).
    if (!reintento && texto.startsWith('@')) {
      const ag = leerMencion(texto, await listaAgentes());
      if (ag) { S.msgs.push({ r: 'u', t: texto, at: new Date().toISOString() }); if (!S.titulo) S.titulo = tituloDe(texto); pintarCentro(); return proponerPlan(ag.agente, ag.resto); }
    }
    const cm = leerComando(texto); if (cm && !reintento) return comando(cm);
    if (!listo()) return toast('El servidor no está en línea', true);
    const m = modoDe(S.modo);
    if (m.pide && !slugAhora()) { toast(m.pide === 'marca' ? 'Elige una marca' : 'Elige un cliente', true); const b = el.querySelector('[data-a="menu-slug"]'); if (b) menuSlug(b); return; }
    if (S.privado && !modeloLocal()) { toast('El modo privado necesita un modelo en tu compu', true); pintarCaja(); return; }
    const ctrl = new AbortController(); S.enVuelo = ctrl;
    if (!reintento) { S.msgs.push({ r: 'u', t: texto, at: new Date().toISOString() }); if (S.brujula && !sinGiro) ponerBrujula(contarGiro(S.brujula)); }
    else if (S.msgs[S.msgs.length - 1]?.r === 'a') S.msgs.pop();
    const msg = { r: 'a', modo: S.modo, t: '', stream: true, tools: [], notas: [] }; S.msgs.push(msg);
    if (!S.titulo) S.titulo = tituloDe(texto);
    pintarCentro();
    try {
      if (!S.sesion) {
        const id = idSesion(S.modo, slugAhora());
        await B.crear({ id, titulo: tituloDe(texto) });
        S.sesion = id; history.replaceState(null, '', '#/chat/' + id);
        for (const r of S.agentes) api(`chat/sesiones/${encodeURIComponent(id)}/agentes`, { method: 'POST', body: { run: r.id } }).catch(() => {}); // un trabajo abierto aquí queda ligado
      }
      const [sistema] = await Promise.all([contexto().then((c) => sistemaDe(S.modo, c)), null]);
      const r = await B.turno(S.sesion, { mensaje: texto, sistema, modelo: modeloTurno(), esfuerzo: S.esfuerzo, signal: ctrl.signal, on: {
        run: (id) => { S.runId = id; },
        delta: (t) => { msg.notas = msg.notas.filter((n) => !/^En cola/.test(n)); msg.raw = t; msg.t = textoVisible(t); pintarUltimo(); }, // «En cola…» se va al empezar la respuesta
        tool: (p) => { const prev = p.fase !== 'inicio' && [...msg.tools].reverse().find((x) => x.nombre === p.nombre && x.fase === 'inicio'); if (prev) Object.assign(prev, { fase: p.fase, detalle: p.detalle || prev.detalle }); else msg.tools.push(p); pintarUltimo(); },
        nota: (n) => { msg.notas.push(n); pintarUltimo(); },
        aprobacion: (ev) => { msg.aprob = ev; pintarUltimo(); },
        propuestas: (ps) => { msg.propuestas = ps; pintarUltimo(); },
      } });
      msg.notas = msg.notas.filter((n) => !/^En cola/.test(n)); msg.raw = r.texto; msg.t = textoVisible(r.texto); msg.tarjetas = leerTarjetas(r.texto);
    } catch (e) {
      if (e.name === 'AbortError') msg.err = msg.t ? 'Detenido.' : 'Detenido antes de responder.';
      else msg.err = e.message && e.message !== 'Failed to fetch' ? e.message : `No pude hablar con ${quien()}. ¿Sigue encendido?`;
    } finally { S.enVuelo = null; msg.stream = false; msg.aprob = null; msg.at = new Date().toISOString(); }
    // Lo que Strategy concretó va a la estrategia en vivo (si se puede editar y no está aprobada).
    if (S.modo === 'estrategia' && msg.raw && slugAhora()) {
      const { parche } = leerBloques(msg.raw);
      if (Object.keys(parche).length) {
        try {
          const d = await datosEstrategia(slugAhora());
          if (!d.puede?.editar || d.vivaAprobada) msg.aviso = d.vivaAprobada ? 'La estrategia está aprobada: no la cambié.' : 'Tu perfil solo ve la estrategia: no la cambié.';
          else { const rr = await api(`estrategia/${encodeURIComponent(slugAhora())}/viva`, { method: 'PUT', body: { parche } }); msg.aplicado = `Estrategia actualizada${rr.cambiadas?.length ? ` · ${rr.cambiadas.join(', ')}` : ''}`; }
        } catch (er) { msg.aviso = `No pude guardar en la estrategia: ${er.message}`; }
        olvidarPanel(`e:${slugAhora()}`);
      }
    }
    if (msg.tarjetas?.avance && S.brujula) { const nb = aplicarAvance(S.brujula, msg.tarjetas.avance); if (nb !== S.brujula) { ponerBrujula(nb); msg.aplicado = `Brújula: ${progreso(nb).hechas} de ${progreso(nb).total} tareas`; } }
    delete msg.raw;
    if (!alive()) return;
    pintarCentro(); pintarPanel();
    B.sesiones().then((xs) => { S.sesiones = xs; if (alive()) pintarSide(); }).catch(() => {});
  }
  async function comando({ cmd, arg }) {
    const ta = $('#llm-in', el); if (ta) { ta.value = ''; crecer(ta); comandos(''); }
    if (cmd === '/nuevo') return nuevo();
    if (MODOS.some((m) => '/' + m.id === cmd)) return modos.some((m) => m.id === cmd.slice(1)) ? (cambiarModo(cmd.slice(1)), arg && enviar(arg)) : toast('Tu perfil no tiene ese modo', true);
    if (cmd === '/modelo') { const b = el.querySelector('[data-a="menu-modelo"]'); if (b) menuModelo(b); return; }
    if (cmd === '/ajustes') return ajustes();
    if (cmd === '/privado') return alternarPrivado();
    if (cmd === '/ramificar') return ramificar();
    if (cmd === '/brujula') { if (!S.brujula) return toast('Esta conversación todavía no tiene meta: pide algo y te propongo una'); S.panel = true; R.dataset.panel = 'on'; return pintarPanel(); }

  }

  // ---------- F4.5 · los agentes en el Chat (PLAN-GATEWAY §20) ----------
  const rol = me.role, enc = encodeURIComponent, ahoraIso = () => new Date().toISOString();
  const modelosGw = () => (S.modelos?.proveedores || []).flatMap((p) => p.modelos || []);
  async function listaAgentes() {
    if (S.listaAgentes) return S.listaAgentes;
    // Una falla de red no se guarda: la próxima vez se vuelve a pedir (si no, «@» dejaría de funcionar hasta recargar).
    try { S.listaAgentes = ((await api('agentes/workflows')).items || []).filter((w) => w.estado === 'activo' && !w.archivado); return S.listaAgentes; } catch { return []; }
  }
  function elegirArroba(n) { const ta = $('#llm-in', el); if (!ta) return; ta.value = `@${n} `; crecer(ta); comandos(''); const b = $('#lc-cmds', el); if (b) b.hidden = true; ta.focus(); }
  const runDe = (id) => S.agentes.find((r) => r.id === id);
  function ponerRun(run) { const k = S.agentes.findIndex((r) => r.id === run.id); if (k >= 0) S.agentes[k] = run; else S.agentes.push(run); }
  async function cargarAgentesDe(sesion) {
    S.agentes = []; S.tab = 'modo'; S.cerradas = new Set();
    if (!sesion) return;
    try {
      const j = await api(`chat/sesiones/${enc(sesion)}?desde=999999`);
      S.agentes = (await Promise.all((j.agentes || []).map((x) => api('agentes/runs/' + enc(x.run)).then((r) => r.run).catch(() => null)))).filter(Boolean);
    } catch {}
  }
  // La tarjeta «Así lo voy a trabajar». Con `run`, es lo que sigue de un trabajo que ya existe (más allá de lo platicado).
  async function proponerPlan(agente, resto, { run = null } = {}) {
    let w; try { ({ workflow: w } = await api('agentes/workflows/' + enc(agente.id))); } catch (e) { return toast(e.message, true); }
    const desde = run ? activa(run) : 0, plan = planDe(run || w, modelosGw()).filter((e) => e.n >= desde);
    // Sin cliente en el modo, la tarjeta pregunta para quién es (nunca se asume). Un modo que pide cliente no admite «interno».
    let clientes = null, sinClientes = false;
    if (!run && !slugAhora()) {
      const xs = (await cargarContexto(me).catch(() => [])).filter((c) => c.slug && c.slug !== 'inherent'), pide = modoDe(S.modo).pide;
      clientes = [['', 'Elige…'], ...(pide ? [] : [['interno', 'Inherent (trabajo interno)']]), ...xs.map((c) => [c.slug, c.name])];
      sinClientes = clientes.length < 2;
    }
    S.msgs.push({ r: 'plan', at: ahoraIso(), p: { agente: w, resto: run ? `Lo que sigue de «${run.titulo}»` : resto, mensaje: run ? '' : [...S.msgs].reverse().find((x) => x.r === 'u')?.t || '', plan, hasta: plan.at(-1)?.n ?? 0, clientes, sinClientes, cliente: '', estado: 'pendiente', run: run?.id || '' } });
    if (!alive()) return; pintarCentro();
  }
  async function empezarPlan(i) {
    const p = S.msgs[i]?.p; if (!p || !['pendiente', 'error'].includes(p.estado)) return;
    const cl = p.run ? {} : clienteDelPlan(p, slugAhora(), nombreSlug());
    if (cl.error) { p.estado = 'error'; p.error = cl.error; return pintarHilo(); }
    p.estado = 'creando'; pintarHilo();
    try {
      let run;
      if (p.run) ({ run } = await api(`agentes/runs/${enc(p.run)}/plan`, { method: 'POST', body: { hasta: p.hasta } }));
      else {
        if (!S.sesion) { const id = idSesion(S.modo, slugAhora()); await B.crear({ id, titulo: tituloDe(`@${p.agente.nombre} ${p.resto}`) }); S.sesion = id; history.replaceState(null, '', '#/chat/' + id); }
        ({ run } = await api('agentes/runs', { method: 'POST', body: { workflow: p.agente.id, titulo: (p.resto || p.agente.nombre).slice(0, 140), objetivo: p.resto, cliente: cl.cliente, cliente_nombre: cl.nombre, chat: { sesion: S.sesion }, plan_ok: { hasta: p.hasta }, contexto: contextoChat(S.msgs) } }));
        p.run = run.id;
        // En orden (cada escritura usa la versión de la conversación): primero el mensaje, después el lazo.
        if (p.mensaje) { await api(`chat/sesiones/${enc(S.sesion)}/nota`, { method: 'POST', body: { texto: p.mensaje } }).catch(() => {}); p.mensaje = ''; }
      }
      if (S.sesion) await api(`chat/sesiones/${enc(S.sesion)}/agentes`, { method: 'POST', body: { run: run.id } }); // sin repetir: se puede reintentar
      ponerRun(run); p.estado = 'hecho';
      const k = activa(run);
      if (['pendiente', 'ajuste'].includes(run.etapas[k].estado) && !etapaEnServidor(run.etapas[k]) && !faltaAporte(run, k)) {
        try { ({ run } = await api(`agentes/runs/${enc(run.id)}/etapa/${k}/encolar`, { method: 'POST', body: {} })); ponerRun(run); }
        catch (e) { toast(e.code === 'GATEWAY_OFF' ? 'El servidor no está en línea: usa «Continuar» en su pestaña cuando vuelva' : e.message, true); }
      }
      S.tab = run.id; S.cerradas?.delete(run.id); if (!angosto()) { S.panel = true; R.dataset.panel = 'on'; }
    } catch (e) { p.estado = 'error'; p.error = e.message; }
    if (!alive()) return; pintarCentro(); pintarPanel(); vigilar();
  }
  // Mientras el servidor trabaja una etapa de algún trabajo ligado, se relee cada 2.5 s.
  let vigilando = false;
  async function vigilar() {
    if (vigilando) return; vigilando = true;
    try {
      while (alive() && S.agentes.some((r) => etapaEnServidor(r.etapas[activa(r)]))) {
        await new Promise((ok) => setTimeout(ok, 2500)); if (!alive()) return;
        for (const r of S.agentes.filter((x) => etapaEnServidor(x.etapas[activa(x)]))) {
          try { const { run } = await api('agentes/runs/' + enc(r.id)); ponerRun(run); const ya = run.etapas[activa(run)]?.estado; if (ya === 'revision' && r.etapas[activa(r)]?.estado !== 'revision') toast(`${run.flujo.nombre}: resultado listo para revisar`); if (ya === 'pregunta') toast(`${run.flujo.nombre} te hizo una pregunta`); if (ya === 'detenida') toast(`${run.flujo.nombre} se detuvo`, true); } catch {}
        }
        if (!S.enVuelo) pintarHilo();
        pintarPanel();
      }
    } finally { vigilando = false; }
  }
  // Abrir un trabajo (desde el portal, la vista por etapas o un enlace): su conversación si es tuya; si no, una nueva con él.
  async function abrirTrabajo(id) {
    let run; try { ({ run } = await api('agentes/runs/' + enc(id))); } catch (e) { toast(e.message, true); return nuevo(); }
    if (run.chat?.sesion && run.chat.owner === String(me.email).toLowerCase()) await abrirSesion(run.chat.sesion);
    else {
      nuevo();
      const mo = modoDeArea(run.flujo?.area);
      if (modos.some((m) => m.id === mo)) { S.modo = mo; if (run.cliente && modoDe(mo).pide) S.slugs[mo] = run.cliente; }
      S.agentes = [run];
    }
    ponerRun(run); S.tab = run.id; S.panel = true; R.dataset.panel = 'on';
    if (alive()) { pintarSide(); pintarCentro(); pintarPanel(); vigilar(); }
  }
  // Tras cada cambio: al pasar de lo platicado, la tarjeta del plan vuelve al Chat (§20.11) y el flujo espera.
  function alCambiar(r) {
    ponerRun(r);
    const k = activa(r);
    if (r.plan_ok && k > r.plan_ok.hasta && !completo(r) && r.etapas[k]?.estado === 'pendiente' && !S.msgs.some((m) => m.r === 'plan' && m.p.run === r.id && m.p.estado === 'pendiente')) proponerPlan({ id: r.flujo.id }, '', { run: r });
    pintarHilo(); pintarPanel(); vigilar();
  }
  const ctxDoc = () => ({ me, rol, modelos: modelosGw(), onCambio: alCambiar });

  // ---------- Clics, teclado y formularios ----------
  el.addEventListener('click', async (e) => {
    const v = e.target.closest('[data-act="voz"]'); if (v && el.contains(v)) return dictar(v, $('#llm-in', el));
    // Aprobar o reabrir la estrategia desde el panel (solo el CEO; el servidor lo vuelve a revisar).
    const va = e.target.closest('[data-act="viva-aprobar"]');
    if (va && el.contains(va)) { const sl = slugAhora(); if (!sl) return; try { const r = await api(`estrategia/${encodeURIComponent(sl)}/viva/aprobar`, { method: 'POST', body: { aprobar: !va.dataset.no } }); toast(r.aprobado ? 'Estrategia aprobada' : 'Estrategia reabierta'); olvidarPanel(`e:${sl}`); pintarPanel(); } catch (er) { toast(er.message, true); } return; }
    const t = e.target.closest('[data-a]'); if (!t || !el.contains(t)) return;
    const a = t.dataset.a;
    if (a === 'nuevo') return nuevo();
    if (a === 'arroba') return elegirArroba(t.dataset.n);
    if (a === 'plan-empezar') return empezarPlan(+t.dataset.i);
    if (a === 'plan-cancelar') { const p = S.msgs[+t.dataset.i]?.p; if (p) { p.estado = 'cancelado'; pintarHilo(); } return; }
    if (a === 'ag-tab') { S.tab = t.dataset.run === 'modo' ? 'modo' : t.dataset.run; S.cerradas?.delete(S.tab); S.panel = true; R.dataset.panel = 'on'; return pintarPanel(); }
    if (a === 'ag-cerrar') { S.cerradas = S.cerradas || new Set(); S.cerradas.add(t.dataset.run); if (S.tab === t.dataset.run) S.tab = 'modo'; return pintarPanel(); }
    if (a === 'ag-doc' || a === 'ag-ajuste') { const r = runDe(t.dataset.run); if (r) abrirDocumento(r, +t.dataset.n, ctxDoc()); return; }
    if (a === 'ag-resp' || a === 'ag-aporte') {
      const r = runDe(t.dataset.run), n = +t.dataset.n, caja = t.closest('.lpr')?.querySelector('textarea'), texto = String(t.dataset.t || caja?.value || '').trim();
      if (!r) return; if (!texto) { toast('Escribe tu respuesta primero', true); return caja?.focus(); }
      t.disabled = true;
      try { const { run } = await api(`agentes/runs/${enc(r.id)}/etapa/${n}/${a === 'ag-resp' ? 'responder' : 'aporte'}`, { method: 'POST', body: { texto } }); if (caja) caja.value = ''; toast(a === 'ag-resp' ? 'Respuesta enviada: sigue trabajando' : 'Aporte guardado'); alCambiar(run); } catch (er) { t.disabled = false; toast(er.message, true); }
      return;
    }
    if (a === 'ag-reintentar') { const r = runDe(t.dataset.run); if (!r) return; try { const { run } = await api(`agentes/runs/${enc(r.id)}/etapa/${+t.dataset.n}/encolar`, { method: 'POST', body: {} }); alCambiar(run); } catch (er) { toast(er.message, true); } return; }
    if (a === 'ag-usar') {
      const r = runDe(t.dataset.run), n = +t.dataset.n, sel = t.parentElement.querySelector('select'), destino = sel?.value; if (!r || !destino) return;
      try {
        const j = await api(`agentes/runs/${enc(r.id)}/etapa/${n}/usar`, { method: 'POST', body: { destino, sesion: S.sesion } });
        if (j.destino) ponerRun(j.destino);
        if (j.texto) S.msgs.push({ r: 'u', t: j.texto, at: new Date().toISOString() });
        toast('Resultado pasado'); alCambiar(j.run);
      } catch (er) { toast(er.message, true); }
      return;
    }
    if (a === 'ag-aprobar') { const r = runDe(t.dataset.run); if (!r) return; try { const { run } = await api(`agentes/runs/${enc(r.id)}/etapa/${+t.dataset.n}/aprobar`, { method: 'POST', body: {} }); toast('Etapa aprobada'); ctxDoc().onCambio(run); } catch (er) { toast(er.message, true); } return; }
    if (a === 'modo') return cambiarModo(t.dataset.m);
    if (a === 'side') { S.side = !S.side; R.classList.toggle('side-on', S.side); return; }
    if (a === 'panel') { S.panel = !S.panel; R.dataset.panel = S.panel ? 'on' : 'off'; persistir(); return pintarPanel(); }
    if (a === 'abajo') { const box = C('llm-conv'); box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }); return; }
    if (a === 'menu-modo') return menuModo(t);
    if (a === 'menu-slug') return menuSlug(t);
    if (a === 'menu-modelo') return menuModelo(t);
    if (a === 'refrescar-modelos') { el.querySelector('.llm-menu')?.remove(); try { S.modelos = await B.modelos({ fresco: true }); ajustarModelo(); persistir(); toast('Lista de modelos al día'); } catch (er) { toast(er.message, true); } return pintarCaja(); }
    if (a === 'sugerencia') return enviar(t.dataset.t);
    if (a === 'opcion') return enviar(t.dataset.t);
    if (a === 'comando') return comando({ cmd: t.dataset.c, arg: '' });
    if (a === 'detener') { S.enVuelo?.abort(); return; }
    if (a === 'privado') return alternarPrivado();
    if (a === 'ia') {
      // En el cel solo se ve la IA que responde: tocarla abre las demás; elegir otra (o la misma) lo cierra.
      const g = t.closest('.lc-ias');
      if (matchMedia('(max-width: 760px)').matches && !g.classList.contains('abierto') && t.classList.contains('on')) return g.classList.add('abierto');
      g.classList.remove('abierto'); return ponerIa(t.dataset.ia);
    }
    if (a === 'encargo') return mandarEncargo(+t.dataset.i, +t.dataset.k);
    if (a === 'guardar-plan') return guardarPlan(+t.dataset.i);
    if (a === 'guardar-campana') return guardarCampana(+t.dataset.i, +t.dataset.k);
    if (a === 'ramificar') return ramificar();
    if (a === 'meta-aceptar') {
      const x = [...S.msgs].reverse().find((m) => m.tarjetas?.meta); if (!x || !S.sesion) return;
      const m = x.tarjetas.meta; ponerBrujula(crearBrujula(m));
      if (!angosto()) { S.panel = true; R.dataset.panel = 'on'; }
      pintarHilo(); pintarPanel();
      return enviar(`Acepto la meta: ${m.propuesta}.${m.tareas[0] ? ` Empecemos por «${m.tareas[0].t}».` : ''}`, { sinGiro: true });
    }
    if (a === 'meta-ajustar') { const ta = $('#llm-in', el); ta.value = 'Ajustemos la meta: '; crecer(ta); ta.focus(); return; }
    if (a === 'meta-tarea') return enviar('Es solo una tarea, no un proyecto: hazla directo.');
    if (a === 'bru-tarea') { const i = +t.dataset.k, x = S.brujula?.tareas[i]; if (!x) return; ponerBrujula(marcar(S.brujula, i, !x.hecha)); pintarHilo(); return pintarPanel(); }
    if (a === 'bru-quitar') { if (!(await confirmAsk('¿Quitar la brújula de esta conversación? La conversación se queda.'))) return; ponerBrujula(null); pintarHilo(); return pintarPanel(); }
    if (a === 'ver-brujula') { S.panel = !(S.panel && R.dataset.panel === 'on'); R.dataset.panel = S.panel ? 'on' : 'off'; return pintarPanel(); }
    if (a === 'volver-tarea') { const x = tareaActual(S.brujula); if (!x) return; ponerBrujula({ ...S.brujula, giros: 0 }); return enviar(`Volvamos a la tarea de ahora: «${x.t}».`, { sinGiro: true }); }
    if (a === 'seguir-asi') { ponerBrujula({ ...S.brujula, giros: 0 }); return pintarHilo(); }
    if (a === 'uso-limite') return ajustes();
    if (a === 'reintentar') { const u = [...S.msgs].reverse().find((x) => x.r === 'u'); if (u) enviar(u.t, { reintento: true }); return; }
    if (a === 'copiar') { try { await navigator.clipboard.writeText(t.dataset.t); toast('Copiado'); } catch { toast('Selecciona el texto y cópialo', true); } return; }
    if (a === 'borrar') {
      e.preventDefault();
      if (!(await confirmAsk(enServidor ? '¿Quitar esta conversación de tu lista?Queda archivada en el OS.' : ''))) return;
      try { await B.borrar(t.dataset.id); S.sesiones = S.sesiones.filter((s) => s.id !== t.dataset.id); if (S.sesion === t.dataset.id) nuevo(); else pintarSide(); } catch (er) { toast(er.message, true); }
      return;
    }
    if (a === 'ajustes') return ajustes();
    if (a === 'cerrar-sheet') return el.querySelector('.llm-sheet')?.remove();
    if (a === 'tema') { ponerTema(t.dataset.t); el.querySelector('.llm-sheet')?.remove(); return ajustes(); }
    if (a === 'revisar') return revisar();
  });
  el.addEventListener('change', (e) => {
    const pc = e.target.dataset?.ch; if (pc === 'plan-hasta' || pc === 'plan-cliente') { const p = S.msgs[+e.target.dataset.i]?.p; if (!p) return; if (pc === 'plan-hasta') p.hasta = +e.target.value; else p.cliente = e.target.value; return pintarHilo(); }
    // El selector de modo de la barra. Si no se pudo cambiar (una respuesta en camino), el selector vuelve al modo de ahora.
    if (e.target.matches?.('.ls-modo')) { cambiarModo(e.target.value); if (S.modo !== e.target.value) pintarSide(); }
  });
  el.addEventListener('keydown', (e) => {
    if (e.target.id !== 'llm-in') { if (e.key === 'Escape') el.querySelector('.llm-sheet, .llm-menu')?.remove(); return; }
    const cmds = $('#lc-cmds', el);
    if (cmds && !cmds.hidden && (e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) { e.preventDefault(); const b = cmds.querySelector('button.on'); if (b) { if (b.dataset.a === 'arroba') elegirArroba(b.dataset.n); else comando({ cmd: b.dataset.c, arg: '' }); } return; }
    if (cmds && !cmds.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); const bs = [...cmds.querySelectorAll('button')], i = bs.findIndex((b) => b.classList.contains('on')), j = (i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length; bs.forEach((b, k) => b.classList.toggle('on', k === j)); return; }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#llm-form', el)?.requestSubmit(); }
  });
  el.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (e.target.id === 'llm-form') { const ta = $('#llm-in', el), v = ta.value; if (!v.trim()) return; ta.value = ''; crecer(ta); comandos(''); return enviar(v); }
    if (e.target.dataset.f === 'limite') { S.limite = Math.max(0, Math.round(+new FormData(e.target).get('n') || 0)); persistir(); toast(S.limite ? `Tu límite: ${S.limite} usos por semana` : 'Sin límite semanal'); el.querySelector('.llm-sheet')?.remove(); return pintarPanel(); }
  });

  // ---------- Arranque: el servidor, las listas y la conversación de la ruta ----------
  async function revisar() {
    S.salud = await saludServidor();
    if (!alive()) return;
    if (listo()) {
      const [xs, mods] = await Promise.all([B.sesiones().catch(() => []), B.modelos().catch(() => null)]);
      S.sesiones = xs; S.modelos = mods; ajustarModelo();
    }
    if (!alive()) return;
    pintarSide(); pintarCentro(); pintarPanel(); // el panel también: «Continuar» depende de los modelos del servidor
  }
  pintarSide(); pintarCentro(); pintarPanel();
  await Promise.all([me.areas?.includes('estrategia') ? loadEstrategia().catch(() => {}) : null, brandAccess(me).any ? loadBrands(me).catch(() => {}) : null]);
  if (!alive()) return;
  await revisar();
  // Sin servidor también se abre: leer y aprobar no lo necesitan (lo escrito queda en la base).
  if (sub[0] === 'trabajo' && sub[1]) await abrirTrabajo(decodeURIComponent(sub[1]));
  else if (sub[0]) await abrirSesion(decodeURIComponent(sub[0]));
  else pintarPanel();
  $('#llm-in', el)?.focus();
}
