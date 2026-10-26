// El Inherent LLM (#/chat): la app de conversación de Inherent OS, separada de Organización (las une el dock).
// Front con la estructura de Hermes Desktop —barra de sesiones · conversación · panel— y el backend de Hermes en la compu
// de cada persona (hermes.js): el modelo que cada quien conectó (ChatGPT con su suscripción, Claude, local), sus skills,
// su memoria y el conector de Inherent OS. Un modo por área (areas.js), con su harness (llm/modos.js) y su panel (llm/paneles.js).
// Arriba de la barra, el switch de áreas (el mismo del Tablero); en la caja, el switch de IA (Claude, ChatGPT, en tu compu u otras).
// Vercel nunca habla con Hermes. Rutas: #/chat · #/chat/<sesión>
import { html, raw, mount, api, col, toast, $, ico, md, esc, initials, today, roleName, confirmAsk } from '../core.js';
import { hermesDe, setHermes, saludHermes, modelosHermes, nombreProveedor, pasoHermes, sesionesHermes, crearSesion, mensajesSesion, borrarSesion, skillsHermes, turnoSesion, responderAprobacion, ramificarSesion, esLocal, IAS, iaDe, iasListas } from '../hermes.js';
import { MODOS, modoDe, sistemaDe, SUGERENCIAS, COMANDOS, leerComando, TERMINAL, textoVisible, leerTarjetas, idSesion, leerIdSesion, tituloDe, grupoFecha, ESFUERZOS, nombreEsfuerzo, AREAS_ENCARGO, tareaDeEncargo } from '../llm/modos.js';
import { panelDe, datosEstrategia, olvidarPanel } from '../llm/paneles.js';
import { crearBrujula, progreso, tareaActual, terminada, marcar, aplicarAvance, contarGiro, desviado, contextoBrujula, ritmoSemana, inicioSemana, usosDe, QUIEN } from '../llm/brujula.js';
import { leerBloques, instrucciones, avance, PASOS } from '../estrategia-viva.js';
import { etapaDe, etapaLabel } from '../estrategia.js';
import { loadEstrategia, estrategiaNow } from '../stratlist.js';
import { loadBrands, brandsNow, brandAccess } from '../brandlist.js';
import { botonVoz, dictar } from '../voz.js';
import { PUENTE, enApp } from '../laya.js';
import { tokenDe } from '../puente-chat.js';
import { icoApp } from '../dock.js';
import { svgIco } from '../iconos.js';
import { AREAS, areaDe, areaDeModo, areaGuardada, guardarArea, switchHtml, areaConFlecha } from '../areas.js';
import { ponerTema, temaElegido, esNoche } from '../tema.js';

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
  const pref = leer(me);
  const puedeModo = (id) => (id === 'estrategia' || id === 'consulting' ? me.areas?.includes('estrategia') : id === 'diseno' ? brandAccess(me).any : true);
  const modos = MODOS.filter((m) => puedeModo(m.id));
  // Las áreas del switch son los modos que esta persona abre. El área elegida la comparten el Tablero y el Chat.
  const areas = AREAS.filter((a) => modos.some((m) => m.id === a.modo));
  const modoGuardado = areaDe(areaGuardada(me.email))?.modo;
  const S = {
    modo: modos.some((m) => m.id === modoGuardado) ? modoGuardado : modos.some((m) => m.id === pref.modo) ? pref.modo : modos[0].id,
    slugs: pref.slugs || {}, modelo: pref.modelo || null, privado: Boolean(pref.privado), porIa: pref.porIa || {}, esfuerzo: pref.esfuerzo || '', brujula: null, limite: +pref.limite || 0, panel: angosto() ? false : pref.panel !== false,
    sesion: null, msgs: [], titulo: '', enVuelo: null, runId: '',
    salud: null, modelos: null, sesiones: [], busca: '', side: false, skills: null,
  };
  const persistir = () => guardar(me, { modo: S.modo, slugs: S.slugs, modelo: S.modelo, privado: S.privado, porIa: S.porIa, esfuerzo: S.esfuerzo, limite: S.limite, panel: angosto() ? pref.panel : S.panel });
  // Lo que el Tablero dejó para escribir («Pregúntale al Chat», un tema de Consulting): se usa una vez y se borra.
  let borrador = String(pref.borrador || '');
  if (borrador) persistir();
  // Modo privado: responde un modelo que corre en esta compu (Ollama, LM Studio…). El elegido si es local; si no, el primero que haya.
  const modeloLocal = () => {
    if (S.modelo?.model && esLocal(S.modelo.provider)) return S.modelo;
    const a = S.modelos?.actual; if (a?.model && esLocal(a.provider)) return { provider: a.provider, model: a.model };
    const p = (S.modelos?.proveedores || []).find((x) => esLocal(x.slug) && x.listo && x.modelos.length);
    return p ? { provider: p.slug, model: p.modelos[0] } : null;
  };
  const modeloTurno = () => (S.privado ? modeloLocal() || {} : S.modelo || {});
  const slugAhora = () => (modoDe(S.modo).pide ? S.slugs[S.modo] || '' : '');
  const opciones = () => (S.modo === 'estrategia' || S.modo === 'consulting' ? estrategiaNow().map((c) => [c.slug, c.nombre]) : S.modo === 'diseno' ? brandsNow().map((b) => [b.slug, b.name]) : []);
  // Qué IA responde ahora: la del modelo elegido, la de Hermes por defecto, o «en tu compu» con el modo privado. '' si no se sabe.
  const iaAhora = () => (S.privado ? 'local' : S.modelo?.model ? iaDe(S.modelo.provider) : S.modelos?.actual?.provider ? iaDe(S.modelos.actual.provider) : '');
  const nombreSlug = () => opciones().find(([s]) => s === slugAhora())?.[1] || slugAhora();
  const listo = () => Boolean(S.salud?.on && S.salud?.auth);

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
  // El día y la noche son uno solo para las dos apps (tema.js): si cambia (aquí, en Organización o en la compu), el Chat lo sigue.
  llmVivo = R;

  // ---------- La barra lateral (estilo Hermes: el switch de áreas · nueva · las conversaciones del área por fecha · tú y Hermes) ----------
  // Sin buscar se ven las conversaciones del área; al buscar, las de todas (cada una con la letra de su área).
  function pintarSide() {
    const q = S.busca.trim().toLowerCase(), a = areaDeModo(S.modo);
    const lista = S.sesiones.filter((s) => leerIdSesion(s.id) && (q ? String(s.title || s.preview || '').toLowerCase().includes(q) : leerIdSesion(s.id).modo === S.modo));
    const grupos = {}; for (const s of lista) (grupos[grupoFecha(s.last_active || s.started_at)] ||= []).push(s);
    const fila = (s) => { const m = modoDe(leerIdSesion(s.id)?.modo || 'organizacion'); return html`<div class="ls-row ${s.id === S.sesion ? 'on' : ''}"><a href="#/chat/${esc(s.id)}" title="${s.title || s.preview || ''}"><i class="ls-m" data-m="${m.id}">${m.letra}</i><span>${s.title || s.preview || 'Conversación'}</span></a><button type="button" class="ls-x" data-a="borrar" data-id="${s.id}" aria-label="Borrar conversación">${ico('x', 12)}</button></div>`; };
    const estado = !S.salud ? ['', 'Buscando Hermes…'] : !S.salud.on ? ['off', 'Hermes apagado'] : !S.salud.auth ? ['off', 'Falta la llave'] : ['on', `Hermes ${S.salud.version || ''}`.trim()];
    mount(C('llm-side'), html`<div class="ls-brand"><span class="ls-emb">${raw('<img src="/brand/emblem.svg" alt="">')}</span><span class="ls-wm">${raw('<img class="wm-noche" src="/brand/wordmark-light.svg" alt="Inherent"><img class="wm-dia" src="/brand/wordmark-dark.svg" alt="">')}<sup>LLM</sup></span></div>
      ${areas.length > 1 ? raw(switchHtml(areas, a?.id, (n, px) => svgIco(n, px))) : ''}
      <div class="ls-area" data-m="${S.modo}"><b>${a?.nombre || modoDe(S.modo).nombre}</b><small>${a?.sub || modoDe(S.modo).sub}</small></div>
      <button type="button" class="ls-new" data-a="nuevo">${ICO_NUEVO}<span>Nueva conversación</span></button>
      <div class="ls-k ls-kr">${q ? 'Todas las áreas' : 'Recientes'}<label class="ls-busca">${ico('search', 12)}<input id="ls-q" placeholder="Buscar" value="${S.busca}" aria-label="Buscar conversaciones"></label></div>
      <div class="ls-list">${!listo() ? html`<p class="ls-mut">Las conversaciones viven en Hermes, en tu compu.</p>` : lista.length ? ['Hoy', 'Ayer', 'Últimos 7 días', 'Antes'].filter((g) => grupos[g]).map((g) => html`<div class="ls-g">${g}</div>${grupos[g].map(fila)}`) : html`<p class="ls-mut">${q ? 'Nada con ese nombre.' : `Todavía no hay conversaciones de ${a?.nombre || 'esta área'}.`}</p>`}</div>
      <footer class="ls-foot"><button type="button" class="ls-os" data-a="ir-os">${icoApp('os')}<span>Tablero</span></button><button type="button" class="ls-me" data-a="ajustes" title="Hermes y ajustes">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer">` : html`<span>${initials(me.name)}</span>`}<span class="ls-me-t"><b>${me.name}</b><small><i class="ls-dot ${estado[0]}"></i>${estado[1]}</small></span>${ico('gear', 15)}</button></footer>`);
    const qi = C('ls-q'); if (qi) qi.oninput = () => { S.busca = qi.value; const pos = qi.selectionStart; pintarSide(); const n = C('ls-q'); n.focus(); n.setSelectionRange(pos, pos); };
  }

  // ---------- El centro: vacío (la pregunta grande, como Perplexity) o la conversación ----------
  const vacio = () => !S.msgs.length;
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
    return html`<div class="lh"><h1>${S.modo === 'estrategia' && s ? html`¿Qué trabajamos de ${s}?` : S.modo === 'diseno' && s ? html`¿Qué diseñamos para ${s}?` : S.modo === 'consulting' && s ? html`¿Qué ordenamos del negocio de ${s}?` : S.modo === 'organizacion' ? '¿Qué organizamos hoy?' : '¿En qué trabajamos?'}</h1>
      <p>${m.depto} · ${m.sub}. Con las reglas de Inherent y el modelo que elijas.</p></div>`;
  }
  // Lo que falta para que Hermes conteste (instalado · llave · modelo), con los comandos a la vista.
  function setupHtml() {
    const h = S.salud;
    const cmd = (c) => html`<div class="lsu-cmd"><code>${c}</code><button type="button" data-a="copiar" data-t="${c}">Copiar</button></div>`;
    const atajos = html`<p class="lsu-mut">Mientras tanto, los chats de siempre (por el puente): ${me.areas?.includes('estrategia') ? html`<a href="#/estrategia">Estrategia</a> · ` : ''}<a href="#/marcas/diseno">Diseño</a>.</p>`;
    if (!h) return html`<div class="lsu"><p class="lsu-mut">Buscando Hermes en tu compu…</p></div>`;
    if (!h.on) return html`<div class="lsu"><span class="lsu-k">Paso 1 de 3</span><h2>Enciende Hermes en tu compu</h2><p>El Inherent LLM corre con Hermes, en tu Mac: tu modelo, tus suscripciones y las reglas de Inherent.</p>
      ${enApp() ? html`<p>En el menú de arriba: <b>Puente › Instalar Hermes</b>. Una sola vez; después queda encendido.</p>` : cmd(TERMINAL[0][1])}<div class="lsu-acts"><button type="button" class="lsu-btn" data-a="revisar">Ya lo hice</button></div>${atajos}</div>`;
    if (!h.auth) return html`<div class="lsu"><span class="lsu-k">Paso 2 de 3</span><h2>Pega la llave de Hermes</h2><p>Una sola vez en este navegador. Está en tu compu:</p>${cmd('cat ~/.inherent/hermes/api-key')}
      <form class="lsu-pair" data-f="llave"><input name="k" type="password" autocomplete="off" spellcheck="false" placeholder="Pega la llave" aria-label="Llave de Hermes"><button type="submit" class="lsu-btn">Conectar</button></form>${S.errLlave ? html`<p class="lsu-err">${S.errLlave}</p>` : ''}${atajos}</div>`;
    return '';
  }
  // Sin modelo conectado en Hermes: el aviso va sobre la caja (Hermes responde con su modelo por defecto si lo tiene).
  const sinModelo = () => S.modelos && !S.modelos.proveedores.some((p) => p.listo && p.modelos.length) && !S.modelos.actual.model;

  function pintarSug() {
    const box = C('llm-sug');
    if (!vacio() || !listo()) return mount(box, '');
    mount(box, html`<div class="lsg">${(SUGERENCIAS[S.modo] || []).map(([t, k]) => html`<button type="button" class="lsg-c" data-a="sugerencia" data-t="${t}"><b>${t}</b><span>${k}</span></button>`)}</div>`);
  }

  // ---------- La caja (composer): modo · cliente/marca · modelo · voz · enviar ----------
  // El nombre del modelo en la caja: sin la IA (ya la dice el switch), salvo en «Otras», donde va el proveedor.
  const conProv = (x) => (iaDe(x.provider) === 'otras' || esLocal(x.provider) ? `${nombreProveedor(x.provider)} · ` : '') + x.model.split('/').pop();
  function nombreModelo() {
    if (S.privado) { const l = modeloLocal(); return l ? conProv(l) : 'Sin modelo local'; }
    const v = S.modelo, a = S.modelos?.actual;
    if (v?.model) return conProv(v);
    return a?.model ? conProv(a) : 'Modelo';
  }
  // El switch de IA: qué inteligencia (o empresa) responde. Solo las que esta compu tiene listas; «En tu compu» es el modo privado.
  function iasHtml() {
    if (!S.modelos) return '';
    const xs = iasListas(S.modelos), on = iaAhora();
    if (xs.length < 2) return '';
    return html`<div class="lc-ias" role="radiogroup" aria-label="Qué IA responde">${xs.map(([id, n, ic]) => html`<button type="button" role="radio" class="${id === on ? 'on' : ''}" aria-checked="${id === on ? 'true' : 'false'}" data-a="ia" data-ia="${id}" style="--c:var(--ia-${id})" title="${id === 'local' ? 'En tu compu · privado: nada sale de ella' : n}" aria-label="${n}">${ico(ic, 15)}</button>`)}</div>`;
  }
  // Cambiar de IA: vuelve al último modelo que usaste con ella, o al de Hermes por defecto si es de ella, o al primero que tenga.
  function ponerIa(id) {
    if (id === iaAhora()) return;
    if (S.modelo?.model && !S.privado) S.porIa[iaDe(S.modelo.provider)] = S.modelo;
    if (id === 'local') { S.privado = true; persistir(); toast(modeloLocal() ? 'En tu compu: nada sale de ella' : 'Falta un modelo en tu compu', !modeloLocal()); return pintarCaja(); }
    S.privado = false;
    const ps = (S.modelos?.proveedores || []).filter((p) => p.listo && p.modelos.length && iaDe(p.slug) === id && !esLocal(p.slug));
    const guardado = S.porIa[id], sigue = guardado && ps.some((p) => p.slug === guardado.provider && p.modelos.includes(guardado.model));
    const a = S.modelos?.actual;
    S.modelo = sigue ? guardado : a?.model && iaDe(a.provider) === id ? null : ps[0] ? { provider: ps[0].slug, model: ps[0].modelos[0] } : S.modelo;
    persistir(); pintarCaja();
  }
  function pintarCaja() {
    const box = C('llm-compw'), prev = $('#llm-in', el)?.value || '';
    if (!listo()) return mount(box, vacio() ? heroHtml() : html`<div class="llm-col">${setupHtml()}</div>`);
    const m = modoDe(S.modo), sl = slugAhora();
    mount(box, html`${vacio() ? heroHtml() : ''}<div class="lc-w">
      ${S.privado && S.modelos && !modeloLocal() ? html`<div class="lc-aviso">${ico('lock', 13)} El modo privado necesita un modelo en tu compu. Con Ollama instalado, en la Terminal: <code>ollama pull qwen3-coder:30b</code> <button type="button" data-a="copiar" data-t="ollama pull qwen3-coder:30b">Copiar</button> · y para que Hermes lo use: <code>inherent model</code> <button type="button" data-a="copiar" data-t="inherent model">Copiar</button></div>` : ''}
      ${sinModelo() ? html`<div class="lc-aviso">${ico('alert', 13)} Hermes no tiene un modelo conectado. En la Terminal: <code>inherent model</code> <button type="button" data-a="copiar" data-t="inherent model">Copiar</button></div>` : ''}
      <form class="lc" id="llm-form"><div class="lc-cmds" id="lc-cmds" hidden></div>
        <textarea id="llm-in" rows="1" placeholder="${m.pide && !sl ? `Primero elige ${m.pide === 'marca' ? 'una marca' : 'un cliente'} abajo…` : 'Pide algo…   «/» para comandos'}" aria-label="Mensaje"></textarea>
        <div class="lc-row">
          <button type="button" class="lc-chip lc-modo" data-a="menu-modo" aria-haspopup="listbox"><i data-m="${m.id}">${m.letra}</i>${m.nombre}<span class="lc-car">▾</span></button>
          ${m.pide ? html`<button type="button" class="lc-chip ${sl ? '' : 'falta'}" data-a="menu-slug" aria-haspopup="listbox">${ico(m.pide === 'marca' ? 'grid' : 'users', 13)}${sl ? nombreSlug() : m.pide === 'marca' ? 'Elige una marca' : 'Elige un cliente'}<span class="lc-car">▾</span></button>` : ''}
          <span class="sp"></span>
          ${iasHtml() || html`<button type="button" class="lc-chip lc-priv ${S.privado ? 'on' : ''}" data-a="privado" aria-pressed="${S.privado ? 'true' : 'false'}" title="${S.privado ? 'Modo privado: responde un modelo en tu compu; nada sale de ella' : 'Prender el modo privado: para datos de clientes, finanzas o lo que no debe salir de tu compu'}">${ico('lock', 13)}<span>Privado</span></button>`}
          <button type="button" class="lc-chip lc-model" data-a="menu-modelo" aria-haspopup="listbox" title="Qué modelo responde y cuánto piensa (por Hermes, en tu compu)">${S.privado ? ico('lock', 12) : html`<i class="lc-dot on"></i>`}${nombreModelo()}${S.esfuerzo ? html`<span class="lc-esf">· ${nombreEsfuerzo(S.esfuerzo)}</span>` : ''}<span class="lc-car">▾</span></button>
          ${botonVoz()}
          ${S.enVuelo ? html`<button type="button" class="lc-send stop" data-a="detener" aria-label="Detener">${ICO_STOP}</button>` : html`<button type="submit" class="lc-send" aria-label="Enviar">${ICO_ARRIBA}</button>`}
        </div></form>
      <p class="lc-nota">El Inherent LLM trabaja con las reglas de Inherent y puede equivocarse: revisa lo importante.</p></div>`);
    const ta = $('#llm-in', el); ta.value = prev; crecer(ta);
    ta.oninput = () => { crecer(ta); comandos(ta.value); };
  }
  const crecer = (ta) => { ta.style.height = 'auto'; ta.style.height = Math.min(240, ta.scrollHeight) + 'px'; };

  // Los comandos «/»: aparecen al escribir «/» al inicio.
  function comandos(v) {
    const box = $('#lc-cmds', el); if (!box) return;
    const q = /^\/\S*$/.test(v.trim()) ? v.trim().toLowerCase() : null;
    const lst = q === null ? [] : COMANDOS.filter(([c]) => c.startsWith(q.normalize('NFD').replace(/[̀-ͯ]/g, '')));
    box.hidden = !lst.length;
    mount(box, html`${lst.map(([c, d], i) => html`<button type="button" class="${i ? '' : 'on'}" data-a="comando" data-c="${c}"><b>${c}</b><span>${d}</span></button>`)}`);
  }

  // ---------- La conversación ----------
  const textoDe = (c) => (Array.isArray(c) ? c.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('') : String(c ?? ''));
  function msgHtml(x, i) {
    if (x.r === 'u') return html`<div class="lm u"><div class="lm-b">${x.t}</div></div>`;
    const ult = i === S.msgs.length - 1, busy = x.stream, m = modoDe(x.modo || S.modo);
    const pasos = x.tools || [];
    const pasosHtml = pasos.length ? html`<details class="lm-steps" ${busy ? raw('open') : ''}><summary>${busy ? html`<i class="lm-spin"></i>${pasoHermes(pasos[pasos.length - 1].nombre)}` : `${pasos.length} ${pasos.length === 1 ? 'paso' : 'pasos'}`}</summary>
      <ol>${pasos.map((p) => html`<li class="${p.fase}">${ico(p.fase === 'error' ? 'alert' : p.fase === 'fin' ? 'check' : 'spark', 11)}<span>${pasoHermes(p.nombre)}${p.detalle ? html`<small>${p.detalle}</small>` : ''}</span></li>`)}</ol></details>` : '';
    const t = x.tarjetas || {};
    const crit = t.criterios ? html`<div class="lm-crit ${t.criterios.falta.length ? 'falta' : 'ok'}"><div class="lm-crit-h"><b>Criterios${t.criterios.entregable ? ` · ${t.criterios.entregable}` : ''}</b><span>${t.criterios.falta.length ? `Falta ${t.criterios.falta.length}` : 'Listo'}</span></div>
      ${t.criterios.cumple.map((c) => html`<div class="si">${ico('check', 12)}${c}</div>`)}${t.criterios.falta.map((c) => html`<div class="no"><i></i>${c}</div>`)}</div>` : '';
    const preg = t.pregunta ? html`<div class="lm-preg ${ult ? '' : 'hecha'}"><span class="lm-k">Una pregunta antes de seguir</span><b>${t.pregunta.texto}</b>${t.pregunta.por_que ? html`<small>${t.pregunta.por_que}</small>` : ''}${t.pregunta.opciones.length ? html`<div class="lm-ops">${t.pregunta.opciones.map((o) => html`<button type="button" data-a="opcion" data-t="${o}" ${ult ? '' : raw('disabled')}>${o}</button>`)}</div>` : ''}</div>` : '';
    const apr = x.aprob ? html`<div class="lm-apr"><span class="lm-k">${ico('alert', 12)} Hermes pide permiso</span>${x.aprob.description ? html`<p>${x.aprob.description}</p>` : ''}${x.aprob.command ? html`<code>${x.aprob.command}</code>` : ''}
      <div class="lm-ops">${(x.aprob.choices || ['once', 'deny']).map((c) => html`<button type="button" class="${c === 'deny' ? 'no' : c === 'once' ? 'si' : ''}" data-a="aprobar" data-c="${c}" data-i="${i}">${ELECCION[c] || c}</button>`)}</div></div>` : '';
    const cuerpo = x.t ? md(x.t) : busy && !pasos.length ? html`<span class="lm-think"><i></i>Pensando…</span>` : '';
    return html`<div class="lm a"><span class="lm-av" data-m="${m.id}">${m.letra}</span><div class="lm-tx">${pasosHtml}<div class="lm-md">${cuerpo}</div>${x.notas?.length ? html`<div class="lm-notas">${x.notas.map((n) => html`<p>${n}</p>`)}</div>` : ''}
      ${apr}${x.tarjetas?.meta ? metaHtml(x.tarjetas.meta, ult) : ''}${(x.tarjetas?.encargos || []).map((en, k) => encargoHtml(en, i, k, x))}${crit}${preg}${x.aplicado ? html`<span class="lm-upd">✦ ${x.aplicado}</span>` : ''}${x.aviso ? html`<p class="lm-aviso">${x.aviso}</p>` : ''}${x.err ? html`<p class="lm-err">${x.err}</p>` : ''}
      ${!busy && (x.t || x.err) ? html`<div class="lm-acts">${x.t ? html`<button type="button" data-a="copiar" data-t="${x.t}">${ico('copy', 13)} Copiar</button>` : ''}${ult ? html`<button type="button" data-a="reintentar">${ico('redo', 13)} Reintentar</button>` : ''}${ult && S.sesion && !x.err ? html`<button type="button" data-a="ramificar">${ICO_RAMA} Ramificar</button>` : ''}</div>` : ''}</div></div>`;
  }
  function pintarHilo() {
    const col = C('llm-col'), box = C('llm-conv');
    if (vacio()) { mount(col, ''); flecha(); return; }
    const abajo = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    mount(col, html`${S.msgs.map((x, i) => msgHtml(x, i))}${desvioHtml()}`);
    if (abajo || S.enVuelo) box.scrollTop = box.scrollHeight;
    flecha();
  }
  // Un encargo de Estrategia para otra área (Consulting o Diseño): se manda con un botón y queda como tarea de quien lo manda.
  function encargoHtml(en, i, k, x) {
    const a = areaDe(en.area), hecho = x.mandados?.[k], sl = slugAhora();
    const ir = en.area === 'consulting' ? `#/consulting/${encodeURIComponent(sl)}` : `#/marcas/${encodeURIComponent(sl)}`;
    return html`<div class="lm-enc" data-m="${en.area}"><span class="lm-k">${ico(a?.icono || 'send', 12)} Encargo para ${AREAS_ENCARGO[en.area]}</span><b>${en.titulo}</b>${en.por_que ? html`<small>${en.por_que}</small>` : ''}
      <div class="lm-ops">${hecho ? html`<span class="lm-meta-ok">${ico('check', 13)} ${hecho === 'ya' ? 'Ya estaba mandado' : 'Mandado'} · está en Mis tareas</span>${sl ? html`<a class="lm-enc-ir" href="${ir}">Abrir en ${AREAS_ENCARGO[en.area]} ↗</a>` : ''}` : html`<button type="button" class="si" data-a="encargo" data-i="${i}" data-k="${k}" ${S.enVuelo ? raw('disabled') : ''}>Mandar a ${AREAS_ENCARGO[en.area]}</button>`}</div></div>`;
  }
  async function mandarEncargo(i, k) {
    const x = S.msgs[i], en = x?.tarjetas?.encargos?.[k], sl = slugAhora(); if (!en || x.mandados?.[k]) return;
    if (!sl) return toast('Primero elige el cliente de esta conversación', true);
    try {
      // Nada duplicado: si ya se mandó (por ejemplo, antes de recargar), no se crea otra vez.
      const ya = (await col('tasks').list().catch(() => [])).some((t) => t.origen === 'estrategia' && t.cliente === sl && t.area === en.area && t.title === en.titulo);
      if (!ya) await col('tasks').create(tareaDeEncargo(en, { cliente: sl, nombre: nombreSlug(), email: me.email }));
      x.mandados = { ...(x.mandados || {}), [k]: ya ? 'ya' : 'si' };
      toast(ya ? 'Ese encargo ya estaba mandado' : `Mandado a ${AREAS_ENCARGO[en.area]} · está en Mis tareas`);
    } catch (e) { toast(e.status === 403 ? 'Tu perfil no puede crear tareas: pídeselo al CEO' : `No se pudo mandar: ${e.message}`, true); }
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
      const col = C('llm-col'), box = C('llm-conv'), ult = col?.lastElementChild; if (!ult) return pintarHilo();
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
    if (!box.childElementCount) mount(box, html`<p class="lp-mut" style="padding:16px">Cargando…</p>`);
    const h = await panelDe({ me, modo: S.modo, slug: slugAhora(), nombre: nombreSlug() });
    if (gen === panelGen && alive()) mount(box, html`${angosto() ? html`<button type="button" class="lp-cerrar" data-a="panel">${ico('x', 14)} Cerrar</button>` : ''}${brujulaHtml()}${h}${usoHtml()}`);
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
  // El uso del Chat esta semana contra TU límite (Hermes no da el de la suscripción): para no quemarlo el lunes.
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
    const pintar = (q = '') => { const xs = items.filter((x) => x.grupo ? !q : !q || x.label.toLowerCase().includes(q.toLowerCase())); return html`<span class="lmn-k">${titulo}</span>${buscar ? html`<input class="lmn-q" placeholder="Buscar" aria-label="Buscar">` : ''}<div class="lmn-l">${xs.length ? xs.map((x) => x.grupo ? html`<span class="lmn-k lmn-g">${x.grupo}</span>` : html`<button type="button" role="option" class="${x.on ? 'on' : ''} ${x.off ? 'off' : ''}" data-v="${x.v}" ${x.off ? raw('disabled') : ''}>${x.ico || ''}<span><b>${x.label}</b>${x.sub ? html`<small>${x.sub}</small>` : ''}</span>${x.on ? ico('check', 13) : ''}</button>`) : html`<p class="lmn-mut">Nada por aquí.</p>`}</div>${pie}`; };
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
  const menuSlug = (a) => menu(a, S.modo === 'diseno' ? 'Marca' : 'Cliente', opciones().map(([s, n]) => ({ v: s, label: n, on: s === slugAhora() })), (v) => { S.slugs[S.modo] = v; persistir(); nuevo(); }, { buscar: true });
  async function menuModelo(a) {
    if (!S.modelos) { try { S.modelos = await modelosHermes(me); } catch { S.modelos = { actual: {}, proveedores: [] }; } }
    // Con el switch de IA, aquí van solo los modelos de esa IA (sin IA conocida, todos).
    const ia = iaAhora(), deIa = (slug) => (S.privado ? esLocal(slug) : !ia || (iaDe(slug) === ia && !esLocal(slug)));
    const nombreIa = (IAS.find(([k]) => k === ia) || [])[1];
    const items = [{ grupo: 'Cuánto piensa' }, ...ESFUERZOS.map(([k, l, d]) => ({ v: 'esf:' + k, label: l, sub: d, on: (S.esfuerzo || '') === k })), { grupo: S.privado ? 'Modelos en tu compu (modo privado)' : nombreIa ? `Modelos de ${nombreIa}` : 'Qué modelo responde' }];
    if (!S.privado && (!ia || iaDe(S.modelos.actual.provider) === ia)) items.push({ v: '', label: 'Por defecto de Hermes', sub: S.modelos.actual.model ? `${nombreProveedor(S.modelos.actual.provider)} · ${S.modelos.actual.model}` : 'El que elegiste con «inherent model»', on: !S.modelo?.model });
    const loc = S.privado ? modeloLocal() : null;
    for (const p of S.modelos.proveedores) for (const x of p.listo && deIa(p.slug) ? p.modelos.slice(0, 8) : []) items.push({ v: `${p.slug}|${x}`, label: `${nombreProveedor(p.slug)} · ${x.split('/').pop()}`, sub: esLocal(p.slug) ? `${p.nombre} · en tu compu` : p.nombre, on: S.privado ? loc?.provider === p.slug && loc?.model === x : S.modelo?.provider === p.slug && S.modelo?.model === x });
    if (S.privado && !loc) items.push({ v: 'x', label: 'Todavía no hay un modelo en tu compu', sub: 'Abajo: cómo bajar uno gratis con Ollama', off: true });
    const pie = html`<p class="lmn-pie">¿Falta uno? En la Terminal: <code>inherent model</code> <button type="button" data-a="copiar" data-t="inherent model">Copiar</button> · <button type="button" data-a="refrescar-modelos">Actualizar</button></p>`;
    menu(a, 'Modelo', items, (v) => {
      if (v.startsWith('esf:')) S.esfuerzo = v.slice(4);
      else { S.modelo = v ? { provider: v.split('|')[0], model: v.split('|').slice(1).join('|') } : null; if (S.modelo && !S.privado) S.porIa[iaDe(S.modelo.provider)] = S.modelo; }
      persistir(); pintarCaja();
    }, { buscar: items.length > 14, pie: S.privado && !loc ? html`<p class="lmn-pie">Con <b>Ollama</b> instalado, en la Terminal: <code>ollama pull qwen3-coder:30b</code> <button type="button" data-a="copiar" data-t="ollama pull qwen3-coder:30b">Copiar</button> · luego <code>inherent model</code> <button type="button" data-a="copiar" data-t="inherent model">Copiar</button> · <button type="button" data-a="refrescar-modelos">Actualizar</button></p>` : pie });
  }

  // ---------- Ajustes: Hermes, la llave, el tema y los comandos de la Terminal ----------
  function ajustes() {
    el.querySelector('.llm-sheet')?.remove();
    const d = document.createElement('div'); d.className = 'llm-sheet'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Hermes y ajustes');
    const h = S.salud || {}, cx = hermesDe(me);
    mount(d, html`<div class="lsh"><header><b>Hermes y ajustes</b><button type="button" class="llm-ib" data-a="cerrar-sheet" aria-label="Cerrar">${ico('x', 15)}</button></header>
      <section><span class="lp-k">Hermes en esta compu</span><p><i class="ls-dot ${h.on && h.auth ? 'on' : 'off'}"></i>${h.on ? `Encendido${h.version ? ` · versión ${h.version}` : ''}` : 'Apagado o no instalado'} · ${h.auth ? 'llave conectada' : 'sin llave'}${enApp() ? ' (la da la app)' : ''}</p>
        ${cx && !enApp() ? html`<button type="button" class="lsu-btn ghost" data-a="olvidar-llave">Olvidar la llave en este navegador</button>` : ''}
        <p class="lp-mut">El modelo, las suscripciones, las skills y la memoria viven en Hermes. Aquí se ven; se cambian con estos comandos (perfil «inherent»):</p>
        <div class="lsh-cmds">${TERMINAL.map(([t, c]) => html`<div class="lsu-cmd"><span>${t}</span><code>${c}</code><button type="button" data-a="copiar" data-t="${c}">Copiar</button></div>`)}</div></section>
      <section><span class="lp-k">Tu límite semanal del Chat</span><p class="lp-mut">Cuántos usos quieres gastar por semana (los que tu suscripción aguanta). Con él, la Brújula te dice a qué ritmo vas. Es tu número: Hermes no da el límite de la suscripción.</p>
        <form class="lsu-pair" data-f="limite"><input name="n" type="number" min="0" step="10" inputmode="numeric" value="${S.limite || ''}" placeholder="Por ejemplo, 300" aria-label="Usos por semana"><button type="submit" class="lsu-btn">Guardar</button></form></section>
      <section><span class="lp-k">Día y noche · para las dos apps</span><div class="lsh-tema">${[['sistema', 'Como mi compu'], ['dia', 'Día'], ['noche', 'Noche']].map(([k, l]) => html`<button type="button" class="${temaElegido() === k ? 'on' : ''}" data-a="tema" data-t="${k}">${l}</button>`)}</div></section>
      <section><span class="lp-k">Skills de Hermes</span><div id="lsh-skills"><p class="lp-mut">${listo() ? 'Cargando…' : 'Conecta Hermes para verlas.'}</p></div></section></div>`);
    R.append(d);
    if (listo()) skills().then((xs) => { const b = d.querySelector('#lsh-skills'); if (b) mount(b, xs.length ? html`<div class="lsh-sk">${xs.slice(0, 60).map((s) => html`<span title="${s.description || ''}">${s.name}</span>`)}</div><p class="lp-mut">Úsalas con «/skill» en la caja.</p>` : html`<p class="lp-mut">Sin skills instaladas.</p>`); }).catch(() => {});
  }
  const skills = async () => (S.skills ||= await skillsHermes(me).catch(() => []));

  // ---------- Cambiar de modo, de conversación, empezar una nueva ----------
  function cambiarModo(id) {
    if (!modos.some((m) => m.id === id)) return;
    if (id === S.modo && vacio()) return;
    S.modo = id; persistir(); guardarArea(me.email, areaDeModo(id)?.id || '');
    if (!vacio() || S.sesion) return nuevo();
    pintarSide(); pintarCentro(); pintarPanel();
  }
  function nuevo() {
    if (S.enVuelo) S.enVuelo.abort();
    S.sesion = null; S.msgs = []; S.titulo = ''; S.side = false; S.brujula = null; R.classList.remove('side-on'); pintarBrujula();
    if (location.hash !== '#/chat') history.replaceState(null, '', '#/chat');
    pintarSide(); pintarCentro(); pintarPanel(); $('#llm-in', el)?.focus();
  }
  async function abrirSesion(id) {
    const info = leerIdSesion(id); if (!info) { toast('Esa conversación no es del Inherent LLM', true); return nuevo(); }
    S.sesion = id; S.modo = modos.some((m) => m.id === info.modo) ? info.modo : S.modo; if (info.slug) S.slugs[S.modo] = info.slug; guardarArea(me.email, areaDeModo(S.modo)?.id || '');
    S.msgs = []; S.titulo = S.sesiones.find((s) => s.id === id)?.title || ''; S.brujula = brujulas(me)[id] || null; pintarBrujula();
    pintarSide(); pintarCentro(); pintarPanel();
    try {
      const rows = await mensajesSesion(me, id);
      const out = []; let pend = [];
      for (const r of rows) {
        if (r.role === 'user') { const t = textoDe(r.content).trim(); if (t) { out.push({ r: 'u', t }); if (!S.titulo) S.titulo = tituloDe(t); } }
        else if (r.role === 'assistant') {
          for (const tc of r.tool_calls || []) pend.push({ fase: 'fin', nombre: String(tc.function?.name || tc.name || 'herramienta'), detalle: '' });
          const raw0 = textoDe(r.content); if (!raw0.trim()) continue;
          out.push({ r: 'a', modo: S.modo, t: textoVisible(raw0), tarjetas: leerTarjetas(raw0), tools: pend }); pend = [];
        }
      }
      S.msgs = out;
    } catch (e) { S.msgs = [{ r: 'a', modo: S.modo, t: '', err: `No pude leer la conversación: ${e.message}` }]; }
    if (alive()) { pintarTitulo(); pintarCentro(); }
  }

  // ---------- Modo privado y ramificar ----------
  async function alternarPrivado() {
    S.privado = !S.privado; persistir();
    if (S.privado && !S.modelos && listo()) { try { S.modelos = await modelosHermes(me); } catch {} }
    toast(S.privado ? (modeloLocal() ? 'Modo privado: responde un modelo en tu compu' : 'Modo privado: falta un modelo en tu compu') : 'Modo privado apagado', S.privado && !modeloLocal());
    pintarCaja();
  }
  async function ramificar() {
    if (S.enVuelo) return toast('Espera a que termine la respuesta', true);
    if (!S.sesion) return toast('Primero escribe algo en esta conversación', true);
    const nuevoId = idSesion(S.modo, slugAhora()), titulo = `${(S.titulo || 'Conversación').slice(0, 48)} · rama`;
    try { await ramificarSesion(me, S.sesion, { nuevoId, titulo }); } catch (e) { return toast(`No pude ramificar: ${e.message}`, true); }
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
    if (S.modo === 'diseno' && slug) return { ...base, cliente: nombreSlug(), carpeta: slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${slug}`, extra: [`Mes del ciclo: ${today().slice(0, 7)}`] };
    return { ...base, extra: [`Secciones que ve en el OS: ${(me.areas || []).join(', ') || '—'}`] };
  }
  // Antes de cada turno, el puente pone al día la copia del repo que lee Hermes (y borra cualquier cambio local).
  async function repoAlDia() {
    const t = tokenDe(me); if (!t) return;
    try { await fetch(PUENTE + '/chat/sincronizar', { method: 'POST', credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', headers: { Authorization: 'Bearer ' + t }, signal: AbortSignal.timeout(25000) }); } catch { /* sin puente: Hermes lee la copia que hay */ }
  }
  // sinGiro: lo que la persona manda desde la Brújula (aceptar la meta, volver a la tarea) no cuenta como turno perdido.
  async function enviar(texto, { reintento = false, sinGiro = false } = {}) {
    texto = String(texto || '').trim(); if (!texto || S.enVuelo) return;
    const cm = leerComando(texto); if (cm && !reintento) return comando(cm);
    if (!listo()) return toast('Primero conecta Hermes', true);
    const m = modoDe(S.modo);
    if (m.pide && !slugAhora()) { toast(m.pide === 'marca' ? 'Elige una marca' : 'Elige un cliente', true); const b = el.querySelector('[data-a="menu-slug"]'); if (b) menuSlug(b); return; }
    if (S.privado && !modeloLocal()) { toast('El modo privado necesita un modelo en tu compu', true); pintarCaja(); return; }
    const ctrl = new AbortController(); S.enVuelo = ctrl;
    if (!reintento) { S.msgs.push({ r: 'u', t: texto }); if (S.brujula && !sinGiro) ponerBrujula(contarGiro(S.brujula)); }
    else if (S.msgs[S.msgs.length - 1]?.r === 'a') S.msgs.pop();
    const msg = { r: 'a', modo: S.modo, t: '', stream: true, tools: [], notas: [] }; S.msgs.push(msg);
    if (!S.titulo) S.titulo = tituloDe(texto);
    pintarCentro();
    try {
      if (!S.sesion) {
        const id = idSesion(S.modo, slugAhora());
        await crearSesion(me, { id, titulo: tituloDe(texto) });
        S.sesion = id; history.replaceState(null, '', '#/chat/' + id);
      }
      const [sistema] = await Promise.all([contexto().then((c) => sistemaDe(S.modo, c)), repoAlDia()]);
      const r = await turnoSesion(me, S.sesion, { mensaje: texto, sistema, modelo: modeloTurno(), esfuerzo: S.esfuerzo, signal: ctrl.signal, on: {
        run: (id) => { S.runId = id; },
        delta: (t) => { msg.raw = t; msg.t = textoVisible(t); pintarUltimo(); },
        tool: (p) => { const prev = p.fase !== 'inicio' && [...msg.tools].reverse().find((x) => x.nombre === p.nombre && x.fase === 'inicio'); if (prev) Object.assign(prev, { fase: p.fase, detalle: p.detalle || prev.detalle }); else msg.tools.push(p); pintarUltimo(); },
        nota: (n) => { msg.notas.push(n); pintarUltimo(); },
        aprobacion: (ev) => { msg.aprob = ev; pintarUltimo(); },
      } });
      msg.raw = r.texto; msg.t = textoVisible(r.texto); msg.tarjetas = leerTarjetas(r.texto);
    } catch (e) {
      if (e.name === 'AbortError') msg.err = msg.t ? 'Detenido.' : 'Detenido antes de responder.';
      else if (e.status === 401) { if (!enApp()) setHermes(me, null); S.salud = { ...(S.salud || {}), auth: false }; msg.err = 'Hermes no reconoció la llave. Vuelve a conectarla.'; }
      else msg.err = e.message && e.message !== 'Failed to fetch' ? e.message : 'No pude hablar con Hermes. ¿Sigue encendido?';
    } finally { S.enVuelo = null; msg.stream = false; msg.aprob = null; }
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
    sesionesHermes(me).then((xs) => { S.sesiones = xs; if (alive()) pintarSide(); }).catch(() => {});
  }
  async function comando({ cmd, arg }) {
    const ta = $('#llm-in', el); if (ta) { ta.value = ''; crecer(ta); comandos(''); }
    if (cmd === '/nuevo') return nuevo();
    if (['/estrategia', '/organizacion', '/diseno', '/consulting'].includes(cmd)) return modos.some((m) => m.id === cmd.slice(1)) ? (cambiarModo(cmd.slice(1)), arg && enviar(arg)) : toast('Tu perfil no tiene ese modo', true);
    if (cmd === '/modelo') { const b = el.querySelector('[data-a="menu-modelo"]'); if (b) menuModelo(b); return; }
    if (cmd === '/terminal') return ajustes();
    if (cmd === '/privado') return alternarPrivado();
    if (cmd === '/ramificar') return ramificar();
    if (cmd === '/brujula') { if (!S.brujula) return toast('Esta conversación todavía no tiene meta: pide algo y te propongo una'); S.panel = true; R.dataset.panel = 'on'; return pintarPanel(); }
    if (cmd === '/skill') {
      const xs = await skills(), b = el.querySelector('[data-a="menu-modo"]') || el.querySelector('.lc-send');
      if (!xs.length) return toast('Hermes no tiene skills instaladas', true);
      return menu(b, 'Skill de Hermes', xs.map((s) => ({ v: s.name, label: s.name, sub: String(s.description || '').slice(0, 90) })), (v) => { const t = $('#llm-in', el); t.value = `Usa la skill «${v}»: ${arg || ''}`; crecer(t); t.focus(); }, { buscar: true });
    }
  }

  // ---------- Clics, teclado y formularios ----------
  el.addEventListener('click', async (e) => {
    const v = e.target.closest('[data-act="voz"]'); if (v && el.contains(v)) return dictar(v, $('#llm-in', el));
    const ar = e.target.closest('.asw [data-area]'); if (ar && el.contains(ar)) { const m = areaDe(ar.dataset.area)?.modo; return m && cambiarModo(m); }
    // Aprobar o reabrir la estrategia desde el panel (solo el CEO; el servidor lo vuelve a revisar).
    const va = e.target.closest('[data-act="viva-aprobar"]');
    if (va && el.contains(va)) { const sl = slugAhora(); if (!sl) return; try { const r = await api(`estrategia/${encodeURIComponent(sl)}/viva/aprobar`, { method: 'POST', body: { aprobar: !va.dataset.no } }); toast(r.aprobado ? 'Estrategia aprobada' : 'Estrategia reabierta'); olvidarPanel(`e:${sl}`); pintarPanel(); } catch (er) { toast(er.message, true); } return; }
    const t = e.target.closest('[data-a]'); if (!t || !el.contains(t)) return;
    const a = t.dataset.a;
    if (a === 'nuevo') return nuevo();
    if (a === 'modo') return cambiarModo(t.dataset.m);
    if (a === 'side') { S.side = !S.side; R.classList.toggle('side-on', S.side); return; }
    if (a === 'panel') { S.panel = !S.panel; R.dataset.panel = S.panel ? 'on' : 'off'; persistir(); return pintarPanel(); }
    if (a === 'abajo') { const box = C('llm-conv'); box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }); return; }
    if (a === 'menu-modo') return menuModo(t);
    if (a === 'menu-slug') return menuSlug(t);
    if (a === 'menu-modelo') return menuModelo(t);
    if (a === 'refrescar-modelos') { el.querySelector('.llm-menu')?.remove(); try { S.modelos = await modelosHermes(me, { fresco: true }); toast('Lista de modelos al día'); } catch (er) { toast(er.message, true); } return pintarCaja(); }
    if (a === 'sugerencia') return enviar(t.dataset.t);
    if (a === 'opcion') return enviar(t.dataset.t);
    if (a === 'comando') return comando({ cmd: t.dataset.c, arg: '' });
    if (a === 'detener') { S.enVuelo?.abort(); return; }
    if (a === 'privado') return alternarPrivado();
    if (a === 'ia') return ponerIa(t.dataset.ia);
    if (a === 'encargo') return mandarEncargo(+t.dataset.i, +t.dataset.k);
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
    if (a === 'aprobar') {
      const x = S.msgs[+t.dataset.i]; if (!x?.aprob || !S.runId) return;
      try { await responderAprobacion(me, S.runId, x.aprob, t.dataset.c); x.notas = [...(x.notas || []), t.dataset.c === 'deny' ? 'No le diste permiso.' : 'Le diste permiso.']; x.aprob = null; pintarUltimo(); } catch (er) { toast(er.message, true); }
      return;
    }
    if (a === 'borrar') {
      e.preventDefault();
      if (!(await confirmAsk('¿Borrar esta conversación? Se borra de Hermes.'))) return;
      try { await borrarSesion(me, t.dataset.id); S.sesiones = S.sesiones.filter((s) => s.id !== t.dataset.id); if (S.sesion === t.dataset.id) nuevo(); else pintarSide(); } catch (er) { toast(er.message, true); }
      return;
    }
    if (a === 'ajustes') return ajustes();
    if (a === 'cerrar-sheet') return el.querySelector('.llm-sheet')?.remove();
    if (a === 'olvidar-llave') { setHermes(me, null); el.querySelector('.llm-sheet')?.remove(); return revisar(); }
    if (a === 'ir-os') { document.querySelector('.dock [data-app="os"]')?.click(); return; }
    if (a === 'tema') { ponerTema(t.dataset.t); el.querySelector('.llm-sheet')?.remove(); return ajustes(); }
    if (a === 'revisar') return revisar();
  });
  el.addEventListener('keydown', (e) => {
    if (e.target.closest?.('.asw')) { const id = areaConFlecha(areas, areaDeModo(S.modo)?.id, e.key); if (id) { e.preventDefault(); cambiarModo(areaDe(id).modo); el.querySelector(`.asw [data-area="${id}"]`)?.focus(); } return; }
    if (e.target.id !== 'llm-in') { if (e.key === 'Escape') el.querySelector('.llm-sheet, .llm-menu')?.remove(); return; }
    const cmds = $('#lc-cmds', el);
    if (cmds && !cmds.hidden && (e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) { e.preventDefault(); const b = cmds.querySelector('button.on'); if (b) comando({ cmd: b.dataset.c, arg: '' }); return; }
    if (cmds && !cmds.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); const bs = [...cmds.querySelectorAll('button')], i = bs.findIndex((b) => b.classList.contains('on')), j = (i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length; bs.forEach((b, k) => b.classList.toggle('on', k === j)); return; }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#llm-form', el)?.requestSubmit(); }
  });
  el.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (e.target.id === 'llm-form') { const ta = $('#llm-in', el), v = ta.value; if (!v.trim()) return; ta.value = ''; crecer(ta); comandos(''); return enviar(v); }
    if (e.target.dataset.f === 'limite') { S.limite = Math.max(0, Math.round(+new FormData(e.target).get('n') || 0)); persistir(); toast(S.limite ? `Tu límite: ${S.limite} usos por semana` : 'Sin límite semanal'); el.querySelector('.llm-sheet')?.remove(); return pintarPanel(); }
    if (e.target.dataset.f === 'llave') {
      const v = new FormData(e.target).get('k')?.toString().trim(); if (!v) return;
      setHermes(me, { key: v }); const h = await saludHermes(me);
      if (h.auth) { S.errLlave = ''; toast('Hermes conectado'); } else { setHermes(me, null); S.errLlave = h.on ? 'Esa no es la llave de Hermes.' : 'Hermes no responde en esta compu.'; }
      return revisar();
    }
  });

  // ---------- Arranque: Hermes, las listas y la conversación de la ruta ----------
  async function revisar() {
    S.salud = await saludHermes(me);
    if (!alive()) return;
    if (listo()) {
      const [xs, mods] = await Promise.all([sesionesHermes(me).catch(() => []), modelosHermes(me).catch(() => null)]);
      S.sesiones = xs; S.modelos = mods;
    }
    if (!alive()) return;
    pintarSide(); pintarCentro();
  }
  pintarSide(); pintarCentro(); pintarPanel();
  await Promise.all([me.areas?.includes('estrategia') ? loadEstrategia().catch(() => {}) : null, brandAccess(me).any ? loadBrands(me).catch(() => {}) : null]);
  if (!alive()) return;
  await revisar();
  if (sub[0] && listo()) await abrirSesion(decodeURIComponent(sub[0]));
  else pintarPanel();
  const ta = $('#llm-in', el);
  if (ta && borrador && !sub[0]) { ta.value = borrador; crecer(ta); borrador = ''; }
  ta?.focus();
}
