// El Inherent LLM (#/chat): la app de conversación de Inherent OS, separada de Organización (las une el dock).
// Front con la estructura de Hermes Desktop —barra de sesiones · conversación · panel— y el backend de Hermes en la compu
// de cada persona (hermes.js): el modelo que cada quien conectó (ChatGPT con su suscripción, Claude, local), sus skills,
// su memoria y el conector de Inherent OS. Tres modos con su harness (llm/modos.js) y su panel (llm/paneles.js).
// Vercel nunca habla con Hermes. Rutas: #/chat · #/chat/<sesión>
import { html, raw, mount, api, toast, $, ico, md, esc, initials, today, roleName, confirmAsk } from '../core.js';
import { hermesDe, setHermes, saludHermes, modelosHermes, nombreProveedor, pasoHermes, sesionesHermes, crearSesion, mensajesSesion, borrarSesion, skillsHermes, turnoSesion, responderAprobacion } from '../hermes.js';
import { MODOS, modoDe, sistemaDe, SUGERENCIAS, COMANDOS, leerComando, TERMINAL, textoVisible, leerTarjetas, idSesion, leerIdSesion, tituloDe, grupoFecha } from '../llm/modos.js';
import { panelDe, datosEstrategia, olvidarPanel } from '../llm/paneles.js';
import { leerBloques, instrucciones, avance, PASOS } from '../estrategia-viva.js';
import { etapaDe, etapaLabel } from '../estrategia.js';
import { loadEstrategia, estrategiaNow } from '../stratlist.js';
import { loadBrands, brandsNow, brandAccess } from '../brandlist.js';
import { botonVoz, dictar } from '../voz.js';
import { PUENTE, enApp } from '../laya.js';
import { tokenDe } from '../puente-chat.js';
import { icoApp } from '../dock.js';

const K = (me) => `os.llm.${me.email}`;
const leer = (me) => { try { return JSON.parse(localStorage.getItem(K(me)) || '{}') || {}; } catch { return {}; } };
const guardar = (me, v) => { try { localStorage.setItem(K(me), JSON.stringify(v)); } catch {} };
const ICO_PANEL = raw('<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16"/></svg>');
const ICO_SIDE = raw('<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg>');
const ICO_NUEVO = raw('<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>');
const ICO_ARRIBA = raw('<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>');
const ICO_STOP = raw('<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>');
const ELECCION = { once: 'Permitir una vez', session: 'En esta conversación', always: 'Siempre', deny: 'No' };

export async function render(el, { me, sub = [], alive }) {
  const pref = leer(me);
  const puedeModo = (id) => (id === 'estrategia' ? me.areas?.includes('estrategia') : id === 'diseno' ? brandAccess(me).any : true);
  const modos = MODOS.filter((m) => puedeModo(m.id));
  const S = {
    modo: modos.some((m) => m.id === pref.modo) ? pref.modo : modos[0].id,
    slugs: pref.slugs || {}, modelo: pref.modelo || null, panel: typeof pref.panel === 'boolean' ? pref.panel : !matchMedia('(max-width: 1100px)').matches, tema: pref.tema || 'noche',
    sesion: null, msgs: [], titulo: '', enVuelo: null, runId: '',
    salud: null, modelos: null, sesiones: [], busca: '', side: false, skills: null,
  };
  const persistir = () => guardar(me, { modo: S.modo, slugs: S.slugs, modelo: S.modelo, panel: S.panel, tema: S.tema });
  const slugAhora = () => (modoDe(S.modo).pide ? S.slugs[S.modo] || '' : '');
  const opciones = () => (S.modo === 'estrategia' ? estrategiaNow().map((c) => [c.slug, c.nombre]) : S.modo === 'diseno' ? brandsNow().map((b) => [b.slug, b.name]) : []);
  const nombreSlug = () => opciones().find(([s]) => s === slugAhora())?.[1] || slugAhora();
  const listo = () => Boolean(S.salud?.on && S.salud?.auth);

  mount(el, html`<div class="llm" data-tema="${S.tema}" data-panel="${S.panel ? 'on' : 'off'}">
    <aside class="llm-side" id="llm-side" aria-label="Conversaciones"></aside>
    <main class="llm-main" id="llm-main">
      <header class="llm-head"><button type="button" class="llm-ib llm-solo-cel" data-a="side" aria-label="Conversaciones">${ICO_SIDE}</button><div class="llm-titulo" id="llm-titulo"></div><span class="sp"></span>
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
  document.documentElement.dataset.llmTema = S.tema; // el dock se viste igual que el chat

  // ---------- La barra lateral (estilo Hermes: nueva · modos · recientes por fecha · tú y Hermes) ----------
  function pintarSide() {
    const q = S.busca.trim().toLowerCase();
    const lista = S.sesiones.filter((s) => !q || String(s.title || s.preview || '').toLowerCase().includes(q));
    const grupos = {}; for (const s of lista) (grupos[grupoFecha(s.last_active || s.started_at)] ||= []).push(s);
    const fila = (s) => { const m = modoDe(leerIdSesion(s.id)?.modo || 'organizacion'); return html`<div class="ls-row ${s.id === S.sesion ? 'on' : ''}"><a href="#/chat/${esc(s.id)}" title="${s.title || s.preview || ''}"><i class="ls-m" data-m="${m.id}">${m.letra}</i><span>${s.title || s.preview || 'Conversación'}</span></a><button type="button" class="ls-x" data-a="borrar" data-id="${s.id}" aria-label="Borrar conversación">${ico('x', 12)}</button></div>`; };
    const estado = !S.salud ? ['', 'Buscando Hermes…'] : !S.salud.on ? ['off', 'Hermes apagado'] : !S.salud.auth ? ['off', 'Falta la llave'] : ['on', `Hermes ${S.salud.version || ''}`.trim()];
    mount(C('llm-side'), html`<div class="ls-brand"><span class="ls-logo">${raw('<img src="/brand/emblem.svg" alt="">')}</span><b>Inherent</b><span class="ls-tag">LLM</span></div>
      <button type="button" class="ls-new" data-a="nuevo">${ICO_NUEVO}<span>Nueva conversación</span></button>
      <div class="ls-k">Modos</div>
      <nav class="ls-modos">${modos.map((m) => html`<button type="button" class="ls-modo ${m.id === S.modo ? 'on' : ''}" data-a="modo" data-m="${m.id}"><i data-m="${m.id}">${m.letra}</i><span><b>${m.nombre}</b><small>${m.sub}</small></span></button>`)}</nav>
      <div class="ls-k ls-kr">Recientes<label class="ls-busca">${ico('search', 12)}<input id="ls-q" placeholder="Buscar" value="${S.busca}" aria-label="Buscar conversaciones"></label></div>
      <div class="ls-list">${!listo() ? html`<p class="ls-mut">Las conversaciones viven en Hermes, en tu compu.</p>` : lista.length ? ['Hoy', 'Ayer', 'Últimos 7 días', 'Antes'].filter((g) => grupos[g]).map((g) => html`<div class="ls-g">${g}</div>${grupos[g].map(fila)}`) : html`<p class="ls-mut">${q ? 'Nada con ese nombre.' : 'Todavía no hay conversaciones.'}</p>`}</div>
      <footer class="ls-foot"><button type="button" class="ls-os" data-a="ir-os">${icoApp('os')}<span>Organización</span></button><button type="button" class="ls-me" data-a="ajustes" title="Hermes y ajustes">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer">` : html`<span>${initials(me.name)}</span>`}<span class="ls-me-t"><b>${me.name}</b><small><i class="ls-dot ${estado[0]}"></i>${estado[1]}</small></span>${ico('gear', 15)}</button></footer>`);
    const qi = C('ls-q'); if (qi) qi.oninput = () => { S.busca = qi.value; const pos = qi.selectionStart; pintarSide(); const n = C('ls-q'); n.focus(); n.setSelectionRange(pos, pos); };
  }

  // ---------- El centro: vacío (la pregunta grande, como Perplexity) o la conversación ----------
  const vacio = () => !S.msgs.length;
  function pintarTitulo() {
    const m = modoDe(S.modo);
    mount(C('llm-titulo'), vacio() ? html`<span class="lt-modo"><i data-m="${m.id}">${m.letra}</i>${m.nombre}</span>` : html`<span class="lt-t">${S.titulo || 'Conversación'}</span><span class="lt-modo sm"><i data-m="${m.id}">${m.letra}</i>${m.nombre}${slugAhora() ? ` · ${nombreSlug()}` : ''}</span>`);
  }
  function pintarCentro() {
    C('llm-main').classList.toggle('vacio', vacio());
    pintarTitulo(); pintarCaja(); pintarHilo(); pintarSug();
  }
  function heroHtml() {
    const m = modoDe(S.modo), s = nombreSlug();
    if (!listo()) return setupHtml();
    return html`<div class="lh"><h1>${S.modo === 'estrategia' && s ? html`¿Qué trabajamos de ${s}?` : S.modo === 'diseno' && s ? html`¿Qué diseñamos para ${s}?` : S.modo === 'organizacion' ? '¿Qué organizamos hoy?' : '¿En qué trabajamos?'}</h1>
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
  function nombreModelo() {
    const v = S.modelo, a = S.modelos?.actual;
    if (v?.model) return `${nombreProveedor(v.provider)} · ${v.model.split('/').pop()}`;
    return a?.model ? `${nombreProveedor(a.provider)} · ${a.model.split('/').pop()}` : 'Modelo';
  }
  function pintarCaja() {
    const box = C('llm-compw'), prev = $('#llm-in', el)?.value || '';
    if (!listo()) return mount(box, vacio() ? heroHtml() : html`<div class="llm-col">${setupHtml()}</div>`);
    const m = modoDe(S.modo), sl = slugAhora();
    mount(box, html`${vacio() ? heroHtml() : ''}<div class="lc-w">
      ${sinModelo() ? html`<div class="lc-aviso">${ico('alert', 13)} Hermes no tiene un modelo conectado. En la Terminal: <code>inherent model</code> <button type="button" data-a="copiar" data-t="inherent model">Copiar</button></div>` : ''}
      <form class="lc" id="llm-form"><div class="lc-cmds" id="lc-cmds" hidden></div>
        <textarea id="llm-in" rows="1" placeholder="${m.pide && !sl ? `Primero elige ${m.pide === 'marca' ? 'una marca' : 'un cliente'} abajo…` : 'Pide algo…   «/» para comandos'}" aria-label="Mensaje"></textarea>
        <div class="lc-row">
          <button type="button" class="lc-chip lc-modo" data-a="menu-modo" aria-haspopup="listbox"><i data-m="${m.id}">${m.letra}</i>${m.nombre}<span class="lc-car">▾</span></button>
          ${m.pide ? html`<button type="button" class="lc-chip ${sl ? '' : 'falta'}" data-a="menu-slug" aria-haspopup="listbox">${ico(m.pide === 'marca' ? 'grid' : 'users', 13)}${sl ? nombreSlug() : m.pide === 'marca' ? 'Elige una marca' : 'Elige un cliente'}<span class="lc-car">▾</span></button>` : ''}
          <span class="sp"></span>
          <button type="button" class="lc-chip lc-model" data-a="menu-modelo" aria-haspopup="listbox" title="Qué modelo responde (por Hermes, en tu compu)"><i class="lc-dot on"></i>${nombreModelo()}<span class="lc-car">▾</span></button>
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
      ${apr}${crit}${preg}${x.aplicado ? html`<span class="lm-upd">✦ ${x.aplicado}</span>` : ''}${x.aviso ? html`<p class="lm-aviso">${x.aviso}</p>` : ''}${x.err ? html`<p class="lm-err">${x.err}</p>` : ''}
      ${!busy && (x.t || x.err) ? html`<div class="lm-acts">${x.t ? html`<button type="button" data-a="copiar" data-t="${x.t}">${ico('copy', 13)} Copiar</button>` : ''}${ult ? html`<button type="button" data-a="reintentar">${ico('redo', 13)} Reintentar</button>` : ''}</div>` : ''}</div></div>`;
  }
  function pintarHilo() {
    const col = C('llm-col'), box = C('llm-conv');
    if (vacio()) { mount(col, ''); flecha(); return; }
    const abajo = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    mount(col, html`${S.msgs.map((x, i) => msgHtml(x, i))}`);
    if (abajo || S.enVuelo) box.scrollTop = box.scrollHeight;
    flecha();
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
    if (gen === panelGen && alive()) mount(box, h);
  }

  // ---------- Menús (modo, cliente/marca, modelo) ----------
  function menu(anchor, titulo, items, onPick, { buscar = false, pie = '' } = {}) {
    el.querySelector('.llm-menu')?.remove();
    const m = document.createElement('div'); m.className = 'llm-menu'; m.setAttribute('role', 'listbox');
    const pintar = (q = '') => { const xs = items.filter((x) => !q || x.label.toLowerCase().includes(q.toLowerCase())); return html`<span class="lmn-k">${titulo}</span>${buscar ? html`<input class="lmn-q" placeholder="Buscar" aria-label="Buscar">` : ''}<div class="lmn-l">${xs.length ? xs.map((x) => html`<button type="button" role="option" class="${x.on ? 'on' : ''} ${x.off ? 'off' : ''}" data-v="${x.v}" ${x.off ? raw('disabled') : ''}>${x.ico || ''}<span><b>${x.label}</b>${x.sub ? html`<small>${x.sub}</small>` : ''}</span>${x.on ? ico('check', 13) : ''}</button>`) : html`<p class="lmn-mut">Nada por aquí.</p>`}</div>${pie}`; };
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
    const items = [{ v: '', label: 'Por defecto de Hermes', sub: S.modelos.actual.model ? `${nombreProveedor(S.modelos.actual.provider)} · ${S.modelos.actual.model}` : 'El que elegiste con «inherent model»', on: !S.modelo?.model }];
    for (const p of S.modelos.proveedores) for (const x of p.listo ? p.modelos.slice(0, 8) : []) items.push({ v: `${p.slug}|${x}`, label: `${nombreProveedor(p.slug)} · ${x.split('/').pop()}`, sub: p.nombre, on: S.modelo?.provider === p.slug && S.modelo?.model === x });
    const pie = html`<p class="lmn-pie">¿Falta uno? En la Terminal: <code>inherent model</code> <button type="button" data-a="copiar" data-t="inherent model">Copiar</button> · <button type="button" data-a="refrescar-modelos">Actualizar</button></p>`;
    menu(a, 'Qué modelo responde', items, (v) => { S.modelo = v ? { provider: v.split('|')[0], model: v.split('|').slice(1).join('|') } : null; persistir(); pintarCaja(); }, { buscar: items.length > 8, pie });
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
      <section><span class="lp-k">Tema</span><div class="lsh-tema">${[['noche', 'Noche'], ['dia', 'Día']].map(([k, l]) => html`<button type="button" class="${S.tema === k ? 'on' : ''}" data-a="tema" data-t="${k}">${l}</button>`)}</div></section>
      <section><span class="lp-k">Skills de Hermes</span><div id="lsh-skills"><p class="lp-mut">${listo() ? 'Cargando…' : 'Conecta Hermes para verlas.'}</p></div></section></div>`);
    R.append(d);
    if (listo()) skills().then((xs) => { const b = d.querySelector('#lsh-skills'); if (b) mount(b, xs.length ? html`<div class="lsh-sk">${xs.slice(0, 60).map((s) => html`<span title="${s.description || ''}">${s.name}</span>`)}</div><p class="lp-mut">Úsalas con «/skill» en la caja.</p>` : html`<p class="lp-mut">Sin skills instaladas.</p>`); }).catch(() => {});
  }
  const skills = async () => (S.skills ||= await skillsHermes(me).catch(() => []));

  // ---------- Cambiar de modo, de conversación, empezar una nueva ----------
  function cambiarModo(id) {
    if (!modos.some((m) => m.id === id)) return;
    if (id === S.modo && vacio()) return;
    S.modo = id; persistir();
    if (!vacio() || S.sesion) return nuevo();
    pintarSide(); pintarCentro(); pintarPanel();
  }
  function nuevo() {
    if (S.enVuelo) S.enVuelo.abort();
    S.sesion = null; S.msgs = []; S.titulo = ''; S.side = false; R.classList.remove('side-on');
    if (location.hash !== '#/chat') history.replaceState(null, '', '#/chat');
    pintarSide(); pintarCentro(); pintarPanel(); $('#llm-in', el)?.focus();
  }
  async function abrirSesion(id) {
    const info = leerIdSesion(id); if (!info) { toast('Esa conversación no es del Inherent LLM', true); return nuevo(); }
    S.sesion = id; S.modo = modos.some((m) => m.id === info.modo) ? info.modo : S.modo; if (info.slug) S.slugs[S.modo] = info.slug;
    S.msgs = []; S.titulo = S.sesiones.find((s) => s.id === id)?.title || '';
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

  // ---------- Mandar un mensaje ----------
  async function contexto() {
    const base = { persona: me.name, puesto: me.title || (me.roles?.length ? me.roles : [me.role]).filter(Boolean).map(roleName).join(' · '), fecha: today() }, slug = slugAhora();
    if (S.modo === 'estrategia' && slug) {
      const d = await datosEstrategia(slug), v = d.viva || {}, P = PASOS.find((p) => p.id === avance(v).ahora), e = d.etapa?.n != null ? etapaDe(d.etapa.n) : null;
      return { ...base, cliente: d.nombre, carpeta: d.carpeta, nivel: d.nivel?.nombre || 'SIN FICHA DE OFERTA',
        extra: [`Etapa del $100M Scaling Roadmap: ${e ? `${etapaLabel(e)} (${d.etapa.confirmada ? 'confirmada por el CEO' : 'propuesta, sin confirmar'})` : 'sin diagnosticar todavía'}`,
          ...(d.ficha?.incluye?.length ? [`Su ficha incluye: ${d.ficha.incluye.map((x) => `${x.k}: ${x.v}`).join(' · ')}`] : []),
          P ? `Paso de la estrategia en el que estamos: ${P.n} · ${P.largo}` : '',
          d.vivaAprobada ? 'La estrategia está APROBADA por el CEO: no mandes el bloque ```estrategia```; si algo debe cambiar, dilo y que el CEO la reabra.' : ''].filter(Boolean),
        instrucciones: d.vivaAprobada ? '' : instrucciones(v, { nivel: d.nivel?.nombre || '' }) };
    }
    if (S.modo === 'diseno' && slug) return { ...base, cliente: nombreSlug(), carpeta: slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${slug}`, extra: [`Mes del ciclo: ${today().slice(0, 7)}`] };
    return { ...base, extra: [`Secciones que ve en el OS: ${(me.areas || []).join(', ') || '—'}`] };
  }
  // Antes de cada turno, el puente pone al día la copia del repo que lee Hermes (y borra cualquier cambio local).
  async function repoAlDia() {
    const t = tokenDe(me); if (!t) return;
    try { await fetch(PUENTE + '/chat/sincronizar', { method: 'POST', credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', headers: { Authorization: 'Bearer ' + t }, signal: AbortSignal.timeout(25000) }); } catch { /* sin puente: Hermes lee la copia que hay */ }
  }
  async function enviar(texto, { reintento = false } = {}) {
    texto = String(texto || '').trim(); if (!texto || S.enVuelo) return;
    const cm = leerComando(texto); if (cm && !reintento) return comando(cm);
    if (!listo()) return toast('Primero conecta Hermes', true);
    const m = modoDe(S.modo);
    if (m.pide && !slugAhora()) { toast(m.pide === 'marca' ? 'Elige una marca' : 'Elige un cliente', true); const b = el.querySelector('[data-a="menu-slug"]'); if (b) menuSlug(b); return; }
    const ctrl = new AbortController(); S.enVuelo = ctrl;
    if (!reintento) { S.msgs.push({ r: 'u', t: texto }); }
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
      const r = await turnoSesion(me, S.sesion, { mensaje: texto, sistema, modelo: S.modelo || {}, signal: ctrl.signal, on: {
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
    delete msg.raw;
    if (!alive()) return;
    pintarCentro(); pintarPanel();
    sesionesHermes(me).then((xs) => { S.sesiones = xs; if (alive()) pintarSide(); }).catch(() => {});
  }
  async function comando({ cmd, arg }) {
    const ta = $('#llm-in', el); if (ta) { ta.value = ''; crecer(ta); comandos(''); }
    if (cmd === '/nuevo') return nuevo();
    if (['/estrategia', '/organizacion', '/diseno'].includes(cmd)) return modos.some((m) => m.id === cmd.slice(1)) ? (cambiarModo(cmd.slice(1)), arg && enviar(arg)) : toast('Tu perfil no tiene ese modo', true);
    if (cmd === '/modelo') { const b = el.querySelector('[data-a="menu-modelo"]'); if (b) menuModelo(b); return; }
    if (cmd === '/terminal') return ajustes();
    if (cmd === '/skill') {
      const xs = await skills(), b = el.querySelector('[data-a="menu-modo"]') || el.querySelector('.lc-send');
      if (!xs.length) return toast('Hermes no tiene skills instaladas', true);
      return menu(b, 'Skill de Hermes', xs.map((s) => ({ v: s.name, label: s.name, sub: String(s.description || '').slice(0, 90) })), (v) => { const t = $('#llm-in', el); t.value = `Usa la skill «${v}»: ${arg || ''}`; crecer(t); t.focus(); }, { buscar: true });
    }
  }

  // ---------- Clics, teclado y formularios ----------
  el.addEventListener('click', async (e) => {
    const v = e.target.closest('[data-act="voz"]'); if (v && el.contains(v)) return dictar(v, $('#llm-in', el));
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
    if (a === 'tema') { S.tema = t.dataset.t; R.dataset.tema = S.tema; document.documentElement.dataset.llmTema = S.tema; persistir(); el.querySelector('.llm-sheet')?.remove(); return ajustes(); }
    if (a === 'revisar') return revisar();
  });
  el.addEventListener('keydown', (e) => {
    if (e.target.id !== 'llm-in') { if (e.key === 'Escape') el.querySelector('.llm-sheet, .llm-menu')?.remove(); return; }
    const cmds = $('#lc-cmds', el);
    if (cmds && !cmds.hidden && (e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) { e.preventDefault(); const b = cmds.querySelector('button.on'); if (b) comando({ cmd: b.dataset.c, arg: '' }); return; }
    if (cmds && !cmds.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); const bs = [...cmds.querySelectorAll('button')], i = bs.findIndex((b) => b.classList.contains('on')), j = (i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length; bs.forEach((b, k) => b.classList.toggle('on', k === j)); return; }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#llm-form', el)?.requestSubmit(); }
  });
  el.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (e.target.id === 'llm-form') { const ta = $('#llm-in', el), v = ta.value; if (!v.trim()) return; ta.value = ''; crecer(ta); comandos(''); return enviar(v); }
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
  $('#llm-in', el)?.focus();
}
