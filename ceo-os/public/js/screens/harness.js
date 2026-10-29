// Inherent AI (#/ai): solo dos cosas. El Chat (la IA que conversa) y los MCPs (lo que esa IA puede usar y cómo conectarle más).
// Portada = estado del Chat y de los MCPs, más la tarjeta de los modelos abiertos con LM Studio (conectado, o los 4 pasos) · #/ai/mcps = lo que Hermes puede usar hoy, los comandos para conectar un MCP (se agregan
// en la Terminal: Hermes no tiene API para eso) y el conector de Inherent OS hacia Claude o ChatGPT (connectai.js, el mismo de siempre).
// Sin backend nuevo. Lo que viene de una persona (nombre y URL del MCP) pasa por mcp-hermes.js antes de volverse un comando.
import { html, raw, mount, acts, ico, skel, toast, LOGO, $ } from '../core.js';
import { saludHermes, modelosHermes, toolsetsHermes, nombreProveedor } from '../hermes.js';
import { TERMINAL } from '../llm/modos.js';
import { SUGERIDOS, AUTORIZACIONES, COMANDO_LISTA, nombreValido, errorNombre, errorUrl, comandosAgregar, comandosProbar, comandosAutorizar, comandosQuitar, notaAgregar } from '../mcp-hermes.js';
import { openConnect } from '../connectai.js';

export const esqueleto = () => skel('pagina');

const ACTUAL = raw('aria-current="page"'); // constante segura: la pestaña abierta
const PASOS_ENCENDER = TERMINAL.filter(([n]) => /^(Instalar|Actualizar)/.test(n));
// Exacta: «llave» a secas también encuentra la línea de Kilo Pass («…y pega tu llave»), que es «inherent model».
const PASO_LLAVE = TERMINAL.find(([n]) => /^Ver la llave/.test(n)) || ['Ver la llave del OS', 'cat ~/.inherent/hermes/api-key'];
// Modelos abiertos con LM Studio (lmstudio.ai: baja y corre cualquier modelo; Hermes lo trae como el proveedor «lmstudio», puerto 1234).
// Los comandos salen de TERMINAL (la misma fuente que la Terminal del Chat); aquí solo se cuentan los pasos.
const LM_WEB = 'https://lmstudio.ai', LM_MAX = 6;
const comandoLM = (re, otro) => (TERMINAL.find(([n]) => re.test(n)) || ['', otro])[1];
const LM_SERVIDOR = comandoLM(/^Modelos abiertos con LM Studio/, 'lms server start');
const LM_CARGAR = comandoLM(/^Cargar un modelo/, 'lms load <modelo> --context-length 64000');
const LM_CONECTAR = comandoLM(/^Conectar LM Studio/, 'inherent model');
const LM_JIT = comandoLM(/^Opcional: que LM Studio/, 'inherent config set model.lmstudio_load_mode jit');
const pl = (n, uno, otros) => `${n} ${n === 1 ? uno : otros}`;
const modeloCorto = (m) => String(m || '').split('/').pop().slice(0, 32);
const limpio = (s) => String(s ?? '').trim();
// El nombre de un toolset sin el emoji o símbolo con que Hermes lo adorna; las herramientas, legibles.
const etiqueta = (t) => String(t.label || t.name).replace(/^[^\p{L}\p{N}]+/u, '').trim() || t.name;
const legible = (x) => String(x).replace(/_/g, ' ');

// Piezas de pantalla
const punto = (estado) => html`<span class="iai-dot ${estado}" aria-hidden="true"></span>`;
const seccion = (titulo, sub, cuerpo) => html`<div class="hy-bh iai-sec"><h2>${titulo}</h2>${sub ? html`<span>${sub}</span>` : ''}</div>${cuerpo}`;
const cmd = (c) => html`<div class="iai-cmd"><code>${c}</code><button type="button" class="btn ghost xs" data-act="copiar" data-t="${c}">Copiar</button></div>`;
const pasos = (xs) => xs.map(([n, c]) => html`<div class="iai-paso"><span class="mut sm">${n}</span>${cmd(c)}</div>`);
const revisando = (t) => html`<p class="mut sm">${t}</p>`;
// Qué hacer cuando Hermes no está listo: los pasos para encenderlo o para pasarle la llave (con intro o sin ella).
const ayuda = (sh) => (!sh.on ? pasos(PASOS_ENCENDER)
  : html`${cmd(PASO_LLAVE[1])}<p class="mut sm">Pégala una sola vez en el <a href="#/chat">Chat</a> (Hermes › conectar).</p>`);
const encender = (sh) => (!sh.on
  ? html`<p class="mut">${punto('off')} Hermes no responde en esta compu. Sin Hermes el Chat no puede usar MCPs. Para encenderlo, en la Terminal:</p>${ayuda(sh)}`
  : html`<p class="mut">${punto('warn')} Hermes está encendido, pero el OS no tiene su llave. Para verla, en la Terminal:</p>${ayuda(sh)}`);

// ---------- Modelos abiertos · LM Studio (tarjeta de la portada) ----------
const lmPaso = (n, titulo, detalle, extra) => html`<li class="iai-lm-paso"><span class="iai-lm-n" aria-hidden="true">${n}</span><div class="iai-lm-b"><b>${titulo}</b><p class="mut sm">${detalle}</p>${extra}</div></li>`;
const lmBajar = () => html`<a class="btn xs iai-lm-link" href="${LM_WEB}" target="_blank" rel="noopener">Bajar LM Studio ${ico('external-link', 13)}</a>`;
// Los 4 pasos con sus comandos para copiar. aviso: la línea de estado que va arriba (por qué se ven los pasos).
const lmPasos = (aviso) => html`${aviso}<ol class="iai-lm-pasos" aria-label="Cómo conectar LM Studio">
  ${lmPaso(1, 'Baja LM Studio y un modelo', 'Instálalo y, adentro, busca y descarga el que quieras: Qwen, Llama, Gemma, Mistral… Los que traen tool calling (llamar herramientas) funcionan mejor: Qwen 2.5 o 3, Llama 3.x, Mistral, Hermes.', lmBajar())}
  ${lmPaso(2, 'Enciende su servidor', 'En la app: pestaña Developer › Start Server (puerto 1234). O en la Terminal:', cmd(LM_SERVIDOR))}
  ${lmPaso(3, 'Cárgalo con 64K de contexto', 'Hermes pide 64K de contexto como mínimo (cuánto texto recuerda a la vez). Cambia «modelo» por el nombre que ves en LM Studio. O en la app: el engrane junto al modelo › Context Length de 64000 o más › recargar.', cmd(LM_CARGAR))}
  ${lmPaso(4, 'Conéctalo a tu Inherent AI', 'Corre esto, elige «LM Studio», dale Enter a la dirección (http://localhost:1234/v1) y elige el modelo:', cmd(LM_CONECTAR))}</ol>
  <details class="iai-det iai-lm-op"><summary>Opcional: que LM Studio cargue y descargue el modelo solo</summary>${cmd(LM_JIT)}</details>`;
// Hermes apagado o sin llave: no se puede ver qué modelos hay, pero los pasos 1 a 3 se hacen igual.
const lmSinHermes = (sh) => lmPasos(html`<p class="sm">${punto(sh.on ? 'warn' : 'off')} <b>Sin conectar</b> · ${sh.on ? 'el OS no tiene la llave de Hermes' : 'Hermes no responde en esta compu'}, así que no se ve el estado de LM Studio. Los pasos 1 a 3 ya puedes hacerlos.</p>`);
// Conectado: cuántos modelos y sus nombres (máximo 6, el que está en uso primero).
function lmConectado(p, actual) {
  const uso = actual?.provider === 'lmstudio' ? String(actual.model || '') : '';
  const nombres = [...p.modelos].sort((a, b) => Number(Boolean(uso) && b === uso) - Number(Boolean(uso) && a === uso)).slice(0, LM_MAX), resto = p.modelos.length - nombres.length;
  return html`<p class="sm iai-lm-st">${punto('ok')} <b>Conectado · ${pl(p.modelos.length, 'modelo', 'modelos')}</b></p>
    <ul class="iai-lm-modelos" aria-label="Modelos de LM Studio">${nombres.map((x) => html`<li class="iai-lm-modelo${uso && x === uso ? ' uso' : ''}" title="${x}"><span class="iai-lm-nm">${modeloCorto(x)}</span>${uso && x === uso ? html`<span class="chip sm2 iai-lm-uso" title="El que Hermes usa por defecto">En uso</span>` : ''}</li>`)}${resto > 0 ? html`<li class="iai-lm-mas mut sm">+${resto} más</li>` : ''}</ul>
    <p class="mut sm">Salen de LM Studio, por tu Hermes. Para usarlos, prende el modo privado («En tu compu») en el Chat.</p>
    <a class="btn iai-lm-link" href="#/chat">Abrir el Chat</a>`;
}
// m = lo que devuelve modelosHermes(me) (o null si no se pudo leer).
function lmEstado(m) {
  const p = (m?.proveedores || []).find((x) => x.slug === 'lmstudio');
  if (p?.listo && p.modelos.length) return lmConectado(p, m.actual);
  return lmPasos(!m ? html`<p class="sm mut">${punto('warn')} No pude leer los modelos de Hermes. Estos son los pasos:</p>`
    : p?.listo ? html`<p class="sm">${punto('warn')} <b>LM Studio está conectado, pero sin modelos</b> · baja uno y cárgalo (pasos 1 a 3).</p>`
      : html`<p class="sm">${punto('off')} <b>Sin conectar</b> · LM Studio todavía no aparece en tu Hermes.</p>`);
}

export async function render(el, { me, sub = [], alive }) {
  let pagina = String(sub[0] || '');
  // Cualquier otra página → #/ai (se canoniza la ruta y se pinta la portada).
  if (pagina && pagina !== 'mcps') { pagina = ''; try { history.replaceState(null, '', '#/ai'); } catch {} }
  let gen = 0, ultimoForm = '';

  const cabecera = () => html`<div class="iai-hero sp-hero"><span class="lbl">${pagina ? 'Inherent AI' : 'Tu IA de trabajo'}</span><h1>${pagina ? 'MCPs' : 'Inherent AI'}</h1>
    <p>${pagina ? 'Lo que tu IA puede usar hoy y cómo conectarle más.' : 'Habla con ella en el Chat y conéctale herramientas con MCPs.'}</p></div>
    <nav class="iai-tabs" aria-label="Inherent AI"><a href="#/chat">${ico('chat', 14)} Chat</a><a href="#/ai/mcps" ${pagina ? ACTUAL : ''}>${ico('puzzle', 14)} MCPs</a></nav>`;

  // ---------- Portada ----------
  function portada() {
    return {
      cuerpo: html`<section class="iai-cards" aria-label="Inherent AI">
        <article class="card iai-card"><div class="iai-card-h"><span class="iai-ic">${ico('chat', 20)}</span><b>Chat</b></div>
          <p class="mut sm">Conversa con tu IA con el contexto de Inherent y de cada cliente.</p>
          <div class="iai-estado" id="iai-chat">${revisando('Revisando Hermes…')}</div>
          <a class="btn iai-go" href="#/chat">Abrir el Chat</a></article>
        <article class="card iai-card"><div class="iai-card-h"><span class="iai-ic">${ico('puzzle', 20)}</span><b>MCPs</b></div>
          <p class="mut sm">Lo que tu IA puede usar y cómo conectarle más.</p>
          <div class="iai-estado" id="iai-mcps">${revisando('Revisando Hermes…')}</div>
          <a class="btn iai-go" href="#/ai/mcps">Ver los MCPs</a></article>
        <article class="card iai-card iai-lm"><div class="iai-card-h"><span class="iai-ic">${ico('lock', 20)}</span><b>Modelos abiertos · LM Studio</b></div>
          <p class="mut sm">Baja cualquier modelo abierto (Qwen, Llama, Gemma, Mistral…) y úsalo en el Chat: gratis, en tu compu y privado.</p>
          <div class="iai-estado iai-lm-estado" id="iai-lm">${revisando('Revisando Hermes…')}</div></article></section>`,
      despues: async (g) => {
        const vivo = () => alive() && g === gen;
        const sh = await saludHermes(me).catch(() => ({ on: false }));
        if (!vivo()) return;
        const chat = $('#iai-chat', el), mcp = $('#iai-mcps', el), lm = $('#iai-lm', el);
        if (!sh.on || !sh.auth) {
          if (lm) mount(lm, lmSinHermes(sh));
          if (chat) mount(chat, html`<p class="sm">${punto(sh.on ? 'warn' : 'off')} <b>${sh.on ? 'Falta la llave' : 'Apagado'}</b>${sh.on ? ' · Hermes está encendido' : ' · Hermes no responde en esta compu'}</p><details class="iai-det"><summary>${sh.on ? 'Cómo conectar la llave' : 'Cómo encenderlo, en la Terminal'}</summary>${ayuda(sh)}</details>`);
          if (mcp) mount(mcp, html`<p class="sm mut">Sin Hermes listo no se ven. Cuando esté, aquí sale cuántas capacidades tiene activas.</p>`);
          return;
        }
        if (chat) mount(chat, html`<p class="sm">${punto('ok')} <b>Encendido</b>${sh.version ? html` <span class="mut">· Hermes v${sh.version}</span>` : ''}</p><p class="mut sm" id="iai-modelo"></p>`);
        const [ts, m] = await Promise.all([toolsetsHermes(me), modelosHermes(me).catch(() => null)]);
        if (!vivo()) return;
        const modelo = $('#iai-modelo', el);
        if (modelo && m?.actual.model) mount(modelo, html`Modelo: <b>${modeloCorto(m.actual.model)}</b>${m.actual.provider ? html` · ${nombreProveedor(m.actual.provider)}` : ''}`);
        if (mcp) mount(mcp, ts.length ? html`<p class="sm">${punto('ok')} <b>${pl(ts.filter((t) => t.enabled).length, 'capacidad activa', 'capacidades activas')}</b> <span class="mut">· de ${ts.length}</span></p>` : html`<p class="sm">${punto('warn')} No pude leer las capacidades de Hermes.</p>`);
        if (lm) mount(lm, lmEstado(m));
      },
    };
  }

  // ---------- MCPs ----------
  const filaToolset = (t) => {
    const [e, texto] = t.enabled ? (t.configured ? ['ok', 'Activa'] : ['warn', 'Activa, falta configurarla']) : ['off', t.configured ? 'Apagada' : 'Sin configurar'];
    return html`<li class="iai-ts ${t.enabled ? 'on' : 'off'}"><div class="iai-ts-h">${punto(e)}<b>${etiqueta(t)}</b><span class="chip sm2">${texto}</span><span class="mut sm">${pl(t.tools.length, 'herramienta', 'herramientas')}</span></div>
      ${t.tools.length ? html`<div class="iai-chips">${t.tools.slice(0, 14).map((x) => html`<span class="chip sm2">${legible(x)}</span>`)}${t.tools.length > 14 ? html`<span class="mut sm">+${t.tools.length - 14}</span>` : ''}</div>` : ''}</li>`;
  };
  async function cargarToolsets(g) {
    const vivo = () => alive() && g === gen, box = () => (vivo() ? $('#iai-ts', el) : null);
    const sh = await saludHermes(me).catch(() => ({ on: false }));
    if (!box()) return;
    if (!sh.on || !sh.auth) return mount(box(), encender(sh));
    const ts = await toolsetsHermes(me);
    if (!box()) return;
    if (!ts.length) return mount(box(), html`<p class="mut">${punto('warn')} Hermes está encendido pero no devolvió capacidades. Revisa, en la Terminal:</p>${cmd(TERMINAL.find(([n]) => /^Revisar/.test(n))?.[1] || 'inherent doctor')}`);
    const orden = [...ts].sort((a, b) => Number(b.enabled) - Number(a.enabled) || Number(b.configured) - Number(a.configured) || etiqueta(a).localeCompare(etiqueta(b), 'es'));
    mount(box(), html`<p class="sm">${punto('ok')} Hermes ${sh.version ? `v${sh.version} ` : ''}encendido · <b>${pl(ts.filter((t) => t.enabled).length, 'capacidad activa', 'capacidades activas')}</b> de ${ts.length}</p>
      <ul class="iai-tslist">${orden.map(filaToolset)}</ul>`);
  }

  const sugerido = (s) => html`<article class="card iai-sug"><div class="iai-sug-h"><b>${s.nombre}</b><span class="chip sm2">${(AUTORIZACIONES.find(([k]) => k === s.auth) || [])[1] || s.auth}</span></div>
    <p class="sm">${s.que}</p><pre class="iai-code">${comandosAgregar(s).join('\n')}</pre><p class="mut sm">${notaAgregar(s.auth)}</p>
    <button type="button" class="btn xs" data-act="copiar-sug" data-n="${s.nombre}">Copiar comandos</button></article>`;

  const conectar = () => html`<p class="iai-nota">${ico('info', 15)} <span>Los MCPs viven en Hermes, en tu compu: se agregan en la Terminal con estos comandos.</span></p>
    <div class="lbl">Sugeridos</div><div class="iai-sugs">${SUGERIDOS.map(sugerido)}</div>
    <div class="lbl">Otro MCP</div>
    <section class="card iai-formcard"><div class="form iai-form">
      <div class="two"><div><label class="f" for="iai-n">Nombre</label><input class="in" id="iai-n" data-act="armar" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="40" placeholder="mi-mcp"></div>
        <div><label class="f" for="iai-a">Autorización</label><select class="in" id="iai-a" data-act="armar">${AUTORIZACIONES.map(([k, n, d]) => html`<option value="${k}">${n} · ${d}</option>`)}</select></div></div>
      <div><label class="f" for="iai-u">URL del MCP</label><input class="in" id="iai-u" data-act="armar" type="url" inputmode="url" autocomplete="off" spellcheck="false" maxlength="300" placeholder="https://…/mcp"></div>
      <div class="iai-out" id="iai-out" aria-live="polite"><p class="mut sm">Llena el nombre y la URL: aquí salen los comandos.</p></div></div></section>
    <div class="lbl">Quitar o probar un MCP</div>
    <section class="card iai-formcard"><div class="form iai-form">
      <div><label class="f" for="iai-g">Nombre del MCP</label><input class="in" id="iai-g" data-act="gestion" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="40" placeholder="el que pusiste al agregarlo"></div>
      <div class="iai-out" id="iai-gout" aria-live="polite">${gestion('')}</div></div></section>`;

  // «Quitar o probar»: los comandos de ese MCP; con el nombre vacío, solo cómo ver cuáles hay.
  function gestion(nombre) {
    const n = limpio(nombre).toLowerCase(), lista = html`<div class="iai-paso"><span class="mut sm">Ver los que tienes</span>${cmd(COMANDO_LISTA)}</div>`;
    if (!n) return lista;
    if (!nombreValido(n)) return html`${lista}<p class="iai-err">${errorNombre(n)}</p>`;
    return html`${lista}<div class="iai-paso"><span class="mut sm">Probarlo</span>${cmd(comandosProbar(n)[0])}</div>
      <div class="iai-paso"><span class="mut sm">Darle permiso otra vez (OAuth)</span>${cmd(comandosAutorizar(n)[0])}</div>
      <div class="iai-paso"><span class="mut sm">Quitarlo</span>${cmd(comandosQuitar(n)[0])}<span class="mut sm">Solo lo desconecta de Hermes; no borra nada del OS.</span></div>`;
  }

  const conexion = () => html`<section class="card iai-conn"><span class="ailogos">${['claude', 'chatgpt', 'claudecode', 'codex'].map((k) => html`<span class="ailogo sm">${LOGO[k]}</span>`)}</span>
    <div class="grow"><b>Habla con Inherent OS desde tu IA</b><div class="mut sm">Conéctalo a Claude o ChatGPT: pregúntale tus pendientes, pídele una cotización o que arme un proyecto.</div></div>
    <span class="mut sm">${me.mcp ? html`Conectado ${ico('check', 13)}` : 'Sin conectar'}</span><button type="button" class="btn" data-act="conectar">${me.mcp ? 'Ver conexiones' : 'Conectar'}</button></section>`;

  function paginaMcps() {
    return {
      cuerpo: html`${seccion('Lo que tu Inherent AI puede usar hoy', 'Las capacidades que Hermes tiene en tu compu · las activas primero', html`<section class="card iai-panel" id="iai-ts">${revisando('Revisando Hermes…')}</section>`)}
        ${seccion('Conectar un MCP a tu Inherent AI', 'Se agregan en la Terminal', conectar())}
        ${seccion('Conecta Inherent OS a otra IA (Claude, ChatGPT)', 'El conector de Inherent OS hacia tu Claude o ChatGPT', html`<div id="iai-conn">${conexion()}</div>`)}`,
      despues: cargarToolsets,
    };
  }

  function paint() {
    const g = ++gen, pg = pagina === 'mcps' ? paginaMcps() : portada();
    mount(el, html`${cabecera()}${pg.cuerpo}`);
    pg.despues?.(g);
  }

  // ---------- Acciones ----------
  // Copiar: portapapeles y, si el navegador no deja, se selecciona el texto para copiarlo a mano.
  async function copiarTexto(texto, nodo) {
    try { await navigator.clipboard.writeText(texto); toast('Copiado'); return; } catch {}
    try { if (nodo) { const r = document.createRange(); r.selectNodeContents(nodo); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } } catch {}
    toast('No pude copiar: ya está seleccionado, cópialo con Cmd+C', true);
  }
  acts(el, {
    copiar: (b) => copiarTexto(b.dataset.t || '', b.closest('.iai-cmd')?.querySelector('code')),
    'copiar-sug': (b) => { const s = SUGERIDOS.find((x) => x.nombre === b.dataset.n); if (s) copiarTexto(comandosAgregar(s).join('\n'), b.closest('.iai-sug')?.querySelector('.iai-code')); },
    'copiar-form': (b) => { if (ultimoForm) copiarTexto(ultimoForm, b.closest('.iai-out')?.querySelector('.iai-code')); },
    conectar: () => openConnect(me, () => { const c = $('#iai-conn', el); if (c) mount(c, conexion()); }),
  });
  // Los formularios arman los comandos al escribir; solo se repinta el resultado, para no perder el foco.
  acts(el, {
    armar: () => {
      const out = $('#iai-out', el); if (!out) return;
      const nombre = limpio($('#iai-n', el)?.value).toLowerCase(), url = limpio($('#iai-u', el)?.value), auth = $('#iai-a', el)?.value;
      ultimoForm = '';
      if (!nombre && !url) return mount(out, html`<p class="mut sm">Llena el nombre y la URL: aquí salen los comandos.</p>`);
      const errores = [errorNombre(nombre), errorUrl(url)].filter(Boolean);
      if (errores.length) return mount(out, html`<ul class="iai-err">${errores.map((e) => html`<li>${e}</li>`)}</ul>`);
      const cmds = comandosAgregar({ nombre, url, auth });
      if (!cmds.length) return mount(out, html`<p class="iai-err">Elige cómo se autoriza.</p>`);
      ultimoForm = cmds.join('\n');
      mount(out, html`<pre class="iai-code">${ultimoForm}</pre><p class="mut sm">${notaAgregar(auth)}</p><button type="button" class="btn" data-act="copiar-form">Copiar comandos</button>`);
    },
    gestion: (inp) => { const out = $('#iai-gout', el); if (out) mount(out, gestion(inp.value)); },
  }, 'input');

  paint();
}
