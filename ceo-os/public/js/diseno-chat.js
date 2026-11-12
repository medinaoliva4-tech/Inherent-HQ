// Diseño gráfico › Design Studio: una sola etapa, la de Diseño (⑥A), con tres columnas:
//   la cola de piezas del mes · el lienzo de láminas con variaciones A/B/C y toggle de formato · el panel (concepto, copy,
//   revisión, ojo) con el chat debajo. Plan es de Marketing e Ideas es del Lab: ya no están aquí.
// El chat corre con el modelo de tu compu por el puente de Laya y diseña en Figma (figwright). Lo diseñado se guarda en
// content.diseno = { variaciones[], elegida, figma, laminas } por la ruta de siempre, con la v leída (409 → se relee y reintenta).
// Las variaciones no elegidas no se borran. Sin puente se muestra cómo emparejar; en el cel, «Disponible solo en tu compu».
// Ruta: #/ws/creative/<marca>/design/design-studio (lo monta screens/workspace.js); las viejas #/marcas/diseno[/<marca>] son alias.
import { html, raw, mount, api, col, toast, ico, md, initials, confirmAsk, ask, uploadToDrive, $, $$ } from './core.js';
import { PUENTE, INSTALAR_MAC, INSTALAR_WIN, sistemaDe, APP_MAC, enApp } from './laya.js';
import { chromeBloquea, PASOS_COPIA_VIEJA, sesionVencida, PASOS_LOGIN } from './puente-chat.js';
import { FORMATOS, SUGERENCIAS, promptDiseno, leerDiseno, sinBloque, piezaLista, bytesDe, MESES_CTX, mesNombre, etiquetaCtx, textoCalendario, textoIdea, textoRefs, carpetaDe, variacionesDe, letraLibre, elegirVariacion, colaDelMes, esStory } from './diseno.js';
import { leerSistema } from './sistema-visual.js';
import { estadoDe } from './element.js';
import { ubicarPop, junto } from './divisor.js';
import { tarjetaDoc, barraChat, botonesEnviar, bandeja } from './artifact.js';
import { botonVoz, dictar } from './voz.js';
import { verImagen, ojoChip } from './ojo.js';
import { menuMotor, faltaMotor, faltaHtml, cuerpoMotor, claveMotor, modeloBtn } from './motor-ui.js';
import { rutaModulo } from './herramientas.js';
import { vacio } from './visual.js';

const IMGS = new Map(); // `${marca}|${nodo}` → data URL (solo en memoria: pesan)
const OJO = new Map(); // `${marca}|${nodo}` → { parecido, refs } del ojo visual
let enVuelo = null;
const enCompu = () => !/iPhone|iPod|Android.+Mobile/i.test(navigator.userAgent || '');

// Un menú chico anclado a la caja (mismo estilo que los de Estrategia). items: [{ label, sub, mono, on, pick }]
function menuDz(anchor, items, { buscar = '' } = {}) {
  document.querySelector('.es-menu')?.remove();
  const box = anchor.closest('.es-box') || anchor.parentElement;
  const m = document.createElement('div'); m.className = 'es-menu'; m.setAttribute('role', 'listbox');
  const pinta = (q = '') => { mount(m, html`${buscar ? html`<input class="in" placeholder="${buscar}" aria-label="${buscar}" value="${q}">` : ''}${items.filter((x) => !q || x.label.toLowerCase().includes(q.toLowerCase())).map((x, i) => html`<a href="#" class="${x.on ? 'on' : ''}" role="option" data-i="${items.indexOf(x)}">${x.mono != null ? html`<i class="mono">${x.mono}</i>` : html`<b></b>`}<span>${x.label}</span>${x.sub ? html`<small>${x.sub}</small>` : ''}</a>`)}${items.length ? '' : html`<p class="mut sm" style="padding:8px 12px;margin:0">No hay opciones.</p>`}`); const inp = m.querySelector('input'); if (inp) { inp.oninput = () => { const v = inp.value; pinta(v); const n = m.querySelector('input'); n.focus(); n.setSelectionRange(v.length, v.length); }; } };
  pinta(); box.append(m); junto(m, anchor, box); m.querySelector('input')?.focus();
  const cerrar = (e) => { if (!m.contains(e.target) && e.target !== anchor) { m.remove(); document.removeEventListener('pointerdown', cerrar); } };
  setTimeout(() => document.addEventListener('pointerdown', cerrar));
  m.addEventListener('click', (e) => { const a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault(); m.remove(); items[+a.dataset.i]?.pick(); });
}

export async function disenoChat(el, { me, sub = [], alive, brands = [] }) {
  if (enVuelo) { try { enVuelo.abort(); } catch {} enVuelo = null; }
  const marcas = brands.filter((b) => !b.personal);
  const ir = (slug) => { location.hash = `/ws/creative/${slug}/design/design-studio`; };
  const menuMarcas = (anchor, actual = '') => menuDz(anchor, marcas.map((b) => ({ label: b.name, sub: b.sub, mono: initials(b.name), on: b.slug === actual, pick: () => ir(b.slug) })), { buscar: 'Buscar marca…' });
  const slug = sub[0];
  if (!slug) return inicio();
  if (!enCompu()) return mount(el, html`<a class="btn ghost" href="#/ws/creative">${ico('arrow-left', 14)} Diseño</a>${vacio({ icono: 'edit', titulo: 'Disponible solo en tu compu', linea: 'El chat de Diseño trabaja con el Claude y el Figma de tu computadora. Ábrelo desde ahí.' })}`);
  const b = marcas.find((x) => x.slug === slug);
  if (!b) return mount(el, html`<a class="btn ghost" href="#/ws/creative">${ico('arrow-left', 14)} Diseño</a>${vacio({ icono: 'inbox', titulo: 'No encontré esa marca', linea: 'Elige otra en la caja.' })}`);
  return trabajo(b);

  // ---------- Inicio: «¿Qué diseñamos hoy?» ----------
  function inicio() {
    mount(el, html`<div class="es-start dz-start"><h1>¿Qué diseñamos hoy?</h1><p class="mut">Elige la marca. Las piezas del mes en Figma, con variaciones A, B y C para elegir.</p>
      <div class="es-box es-box-start"><div class="es-form"><textarea class="in" rows="1" placeholder="Elige una marca para escribir…" disabled aria-label="Mensaje para el chat"></textarea><button class="btn es-send" type="button" disabled aria-label="Enviar">${ico('right', 16)}</button></div>
        <div class="es-foot"><button type="button" class="es-pick need" data-act="marca" aria-haspopup="listbox">Elegir marca ▾</button><span></span></div></div>
      <div class="dz-sug">${SUGERENCIAS.map((s) => html`<span>${s}</span>`)}</div></div>`);
    el.onclick = (e) => { const t = e.target.closest('[data-act="marca"]'); if (t) menuMarcas(t); };
    const t = $('[data-act="marca"]', el); if (t && marcas.length) menuMarcas(t);
  }


  async function trabajo(b) {
    el.onclick = null;
    mount(el, html`<p class="loading">Cargando…</p>`);
    const key = `os.diseno.chat.${me.email}.${b.slug}`;
    // El contexto: claves «cal:AAAA-MM» · «plan:AAAA-MM» · «idea:<id>» · «lib:<id>» · «refs». `enviados`: las que esta sesión de Claude ya leyó.
    const chat = (() => { const base = { msgs: [], sesion: null, motor: '', formato: 'Carrusel', ideaId: '', borradores: {}, letra: '', ctx: [], libT: {}, enviados: [], mes: MESES_CTX()[0], hormozi: true, area: true, vistas: [] }; try { const j = JSON.parse(localStorage.getItem(key) || 'null'); if (j && Array.isArray(j.msgs)) return { ...base, ...j, borradores: j.borradores && typeof j.borradores === 'object' ? j.borradores : {}, mes: /^\d{4}-\d{2}$/.test(j.mes || '') ? j.mes : base.mes, ctx: (Array.isArray(j.ctx) ? j.ctx : []).filter((k) => !k.startsWith('plan:')), enviados: Array.isArray(j.enviados) ? j.enviados : [] }; } catch {} return base; })();
    const guardar = () => { try { localStorage.setItem(key, JSON.stringify({ msgs: chat.msgs.slice(-30).map(({ r, t, err, pregunta, doc }) => ({ r, t, ...(err ? { err } : {}), ...(pregunta ? { pregunta } : {}), ...(doc ? { doc } : {}) })), sesion: chat.sesion, motor: chat.motor, mes: chat.mes, hormozi: chat.hormozi, area: chat.area, vistas: chat.vistas, formato: chat.formato, ideaId: chat.ideaId, borradores: chat.borradores, letra: chat.letra, ctx: chat.ctx, libT: chat.libT, enviados: chat.enviados })); } catch {} };
    const tok = () => { try { return window.inherentEscritorio?.token || localStorage.getItem(`os.estrategia.token.${me.email}`) || ''; } catch { return ''; } }; // en la app de escritorio, el token llega solo
    const setTok = (t) => { try { if (t) localStorage.setItem(`os.estrategia.token.${me.email}`, t); else localStorage.removeItem(`os.estrategia.token.${me.email}`); } catch {} };
    let [sisD, todo] = await Promise.all([api(`repo/client/${encodeURIComponent(b.slug)}/sistema`).catch(() => ({ md: '' })), col('content').list().catch(() => [])]);
    if (!alive()) return;
    const sis = sisD.md ? leerSistema(sisD.md) : null;
    const ideas = todo.filter((p) => p.kind === 'post' && p.profile === b.slug && !['Publicado', 'Archivado'].includes(estadoDe(p))).sort((a, z) => String(a.date || '9').localeCompare(String(z.date || '9')));
    const S = { salud: null, pareo: '', lamina: null, guardando: false, ver: '' };
    // ---------- Helpers ----------
    const Mes = () => mesNombre(chat.mes);
    const posts = () => todo.filter((p) => p.kind === 'post' && p.profile === b.slug);
    const pieza = () => todo.find((p) => p.id === chat.ideaId) || null;
    const llave = () => chat.ideaId || '_';
    const borrador = () => chat.borradores[llave()] || null;
    const fmtDia = (d) => (d ? `${String(d).slice(8, 10)}/${String(d).slice(5, 7)}` : 'sin fecha');
    const phTxt = () => (chat.letra ? `Qué cambia en la variación ${chat.letra}…` : borrador() ? 'Pide un cambio, o selecciona una lámina y dile qué ajustar…' : `Qué diseñamos de ${b.name}…`);
    const ayuda = () => ['edit', `¿Qué diseñamos de ${b.name}?`, 'Elige una pieza del mes a la izquierda. El chat lee el design system y el kit de redes, arma las láminas en Figma y las deja como variaciones para elegir.', SUGERENCIAS];
    const docDe = () => ({ ic: 'layers', titulo: borrador()?.titulo || pieza()?.title || `Las piezas de ${b.name}`, sub: '⑥A Diseño gráfico' });
    const ponerArea = () => root.classList.toggle('sin-area', !chat.area);
    const ideasCtx = () => chat.ctx.filter((k) => k.startsWith('idea:')).map((k) => ideas.find((p) => p.id === k.slice(5))).filter(Boolean);
    // Una sola idea en el contexto = la pieza donde se guarda.
    const fijarDestino = () => { const l = ideasCtx(); if (l.length === 1) chat.ideaId = l[0].id; };
    const img = (id) => IMGS.get(`${b.slug}|${id}`) || '';
    // Una pieza guardada vuelve a las listas con su v nueva.
    const poner = (sv) => { const i = todo.findIndex((x) => x.id === sv.id); if (i >= 0) todo[i] = sv; else todo.push(sv); const k = ideas.findIndex((x) => x.id === sv.id); if (k >= 0) ideas[k] = sv; else ideas.push(sv); };
    // Cada PUT lleva la v leída; si otro la cambió (409) se vuelve a leer y se reaplica una vez.
    async function guardarConV(id, base, fn) {
      for (let n = 0; ; n++) {
        const cur = await col('content').get(id).catch((e) => { if (n === 0 && base) return base; throw e; });
        try { return await col('content').save(fn(cur)); } catch (e) { if (e.status !== 409 || n) throw e; }
      }
    }
    // El ojo visual sobre cada lámina con captura: ¿se parece a la marca? De a una, sin trabar el chat.
    let viendo = false;
    async function verLaminas(laminas) {
      if (viendo) return; viendo = true;
      try {
        for (const l of laminas) {
          const k = `${b.slug}|${l.id}`, src = IMGS.get(k); if (!src || OJO.has(k) || !alive()) continue;
          try { const r = await verImagen(b.slug, { imagen: src }); if (!r) break; OJO.set(k, r); document.querySelectorAll(`[data-ojo="${l.id}"]`).forEach((x) => { x.innerHTML = String(ojoChip(r, { compact: x.dataset.c !== '0' })); }); }
          catch { break; }
        }
      } finally { viendo = false; }
    }

    // Columnas: la cola del mes · el lienzo con las variaciones · el lado (concepto, copy, revisión, ojo) con el chat debajo.
    mount(el, html`<div class="dz dz3"><aside class="dz-cola" id="dz-cola"></aside><section class="dz-pane dz-lienzo" id="dz-pane"></section><aside class="dz-lado"><div class="dz-info" id="dz-info"></div><section class="es-chat dz-chat" id="dz-chat"></section></aside></div>`);
    const root = $('.dz', el), chatEl = $('#dz-chat', el), paneEl = $('#dz-pane', el), colaEl = $('#dz-cola', el), infoEl = $('#dz-info', el);

    // ---------- El puente ----------
    async function salud(ms = 4000) {
      let v = { on: false };
      try { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(PUENTE + '/health', { signal: c.signal, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' }); if (r.ok) { const j = await r.json(); v = { on: j.status === 'ok', chat: j.chat || null, listo: Boolean(j.listo), cargando: Boolean(j.cargando), ojo: j.ojo || null }; } } finally { clearTimeout(t); } } catch { /* apagado */ }
      S.salud = v; return v;
    }
    function fase() {
      if (!sis) return 'sin-sistema';
      const s = S.salud; if (!s) return 'cargando';
      if (!s.on) return 'apagado';
      if (!s.chat || !(s.chat.modos || []).includes('diseno')) return 'viejo';
      if (s.chat.ayuda) return s.chat.ayuda;
      if (!tok()) return 'sin-token';
      if (faltaMotor(me, s.chat, { diseno: true })) return 'motor';
      return 'listo';
    }
    const cmd = (c) => html`<div class="es-cmd"><code>${c}</code><button type="button" class="btn ghost xs" data-act="copiar" data-t="${c}">${ico('copy', 13)} Copiar</button></div>`;
    function setup(f) {
      const inst = sistemaDe(navigator.userAgent || '') === 'win' ? INSTALAR_WIN : INSTALAR_MAC;
      const otra = html`<button class="btn xs" data-act="reintentar">Ya lo hice</button>`;
      if (f === 'sin-sistema') return html`<div class="es-setup"><b>${b.name} todavía no tiene su sistema visual</b><p>Sin sistema visual, ⑥A Diseño gráfico no arranca. Lo escribe ②B Branding con br-sistema.</p><a class="btn xs" href="${rutaModulo(b.slug, 'design')}">Ver el Design system</a></div>`;
      if (f === 'cargando') return html`<div class="es-setup"><p class="mut">Buscando el puente en tu compu…</p></div>`;
      if (f === 'apagado' && chromeBloquea()) return html`<div class="es-setup"><b>Chrome está bloqueando a tu compu</b><p>${PASOS_COPIA_VIEJA}</p>${otra}</div>`;
      if (f === 'apagado' && enApp()) return html`<div class="es-setup"><b>El puente de la app no respondió</b><p>En el menú de arriba: Puente › Reiniciar el puente. Si sigue igual, cierra la app y ábrela otra vez.</p>${otra}</div>`;
      if (f === 'apagado' && inst === INSTALAR_MAC) return html`<div class="es-setup"><b>El chat corre en tu compu</b><p>Baja la app de Mac: trae el puente adentro y se prende sola, sin comandos.</p><a class="btn xs" href="${APP_MAC}" target="_blank" rel="noopener">Bajar Inherent OS para Mac</a><p class="mut sm" style="margin-top:12px">O, sin la app, un comando en la Terminal:</p>${cmd(inst)}${otra}</div>`;
      if (f === 'apagado') return html`<div class="es-setup"><b>El chat corre en tu compu</b><p>Enciende el puente de Laya. Un comando, y queda corriendo siempre:</p>${cmd(inst)}${otra}</div>`;
      if (f === 'viejo') return html`<div class="es-setup"><b>Falta actualizar el puente</b><p>Tu puente todavía no trae el chat de Diseño. Corre otra vez el comando y se actualiza solo:</p>${cmd(inst)}${otra}</div>`;
      if (f === 'motor') return faltaHtml(faltaMotor(me, S.salud?.chat, { diseno: true }), cmd);
      if (f === 'sin_claude') return html`<div class="es-setup"><b>No encuentro Claude Code</b><p>Instálalo e inicia sesión con tu cuenta (comando <code>claude</code>). Luego vuelve aquí.</p>${otra}</div>`;
      if (['bajando_repo', 'sin_github', 'repo_error', 'sin_repo', 'repo_invalido'].includes(f)) return html`<div class="es-setup"><b>El puente está preparando el repo</b><p>${S.salud?.chat?.error_repo || 'Si en un minuto sigue igual, corre otra vez el comando de instalar.'}</p>${cmd(inst)}${otra}</div>`;
      return html`<div class="es-setup"><b>Empareja tu compu (una sola vez)</b><p>Es el mismo token del chat de Estrategia. Para verlo:</p>${cmd(sistemaDe(navigator.userAgent || '') === 'win' ? 'Get-Content "$HOME\\.inherent\\laya\\chat-token"' : 'cat ~/.inherent/laya/chat-token')}
        <form class="es-pair" data-act="pair"><input class="in" name="t" type="password" autocomplete="off" spellcheck="false" placeholder="Pega el token" aria-label="Token del puente"><button class="btn xs" type="submit">Emparejar</button></form>${S.pareo ? html`<p class="es-err">${S.pareo}</p>` : ''}</div>`;
    }

    // ---------- El chat ----------
    // La caja: el «+» (contexto y cómo trabaja), las etiquetas de lo elegido, y a la derecha el modelo y enviar.
    const modeloHtml = () => modeloBtn(me, fase() === 'listo');
    // ---------- + Contexto ----------
    const libMax = 6;
    let libData = null; // la lista de la Library (se pide al abrirla)
    const nombreCtx = (k) => etiquetaCtx(k, { marca: b.name, ideas, libT: chat.libT });
    function chipsHtml() {
      return html`${chat.ctx.map((k) => html`<span class="dz-chip" title="${chat.enviados.includes(k) ? 'Ya lo leyó en esta conversación' : 'Lo lee en tu próximo mensaje'}">${nombreCtx(k)}<button type="button" data-act="ctx-x" data-k="${k}" aria-label="Quitar ${nombreCtx(k)}">×</button></span>`)}
        ${S.lamina ? html`<span class="dz-chip">${S.lamina.nombre}<button type="button" data-act="sin-lamina" aria-label="Quitar la lámina">×</button></span>` : ''}`;
    }
    // La franja de abajo de la caja: el cliente, el mes, el contexto y el modo de trabajo.
    const modoTxt = () => [chat.hormozi ? 'Hormozi' : '', chat.formato, chat.letra ? `Variación ${chat.letra}` : ''].filter(Boolean).join(' · ') || 'Modo de trabajo';
    const bandejaHtml = () => bandeja({ cliente: { act: 'marca-cambiar', nombre: b.name }, contexto: chat.ctx.length, modo: modoTxt(),
      mes: html`<button type="button" class="cx-t" data-act="mesdg" aria-haspopup="listbox" title="El mes que se trabaja">${ico('cal', 13)}${Mes()} <span class="cx-car">▾</span></button>` });
    function repintarCaja() { repintarPh(); const c = $('#dz-chips', chatEl); if (c) mount(c, chipsHtml()); const t = $('#dz-tray', chatEl); if (t) mount(t, bandejaHtml()); }
    const toggleCtx = (k) => { chat.ctx = chat.ctx.includes(k) ? chat.ctx.filter((x) => x !== k) : [...chat.ctx, k]; fijarDestino(); guardar(); repintarCaja(); paintPane(); };
    function panelCtx(anchor, vista = 'inicio', q = '', solo = '') {
      document.querySelector('.dz-ctxp')?.remove();
      const box = anchor.closest('.es-box'); if (!box) return;
      const m = document.createElement('div'); m.className = 'dz-ctxp'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Agregar contexto');
      const fila = (k, ic, t, sub, extra = '') => html`<button type="button" class="dz-o ${chat.ctx.includes(k) ? 'on' : ''}" data-ck="${k}" ${raw(extra)}><span class="dz-oi">${ico(ic, 14)}</span><span class="dz-ot">${t}<small>${sub}</small></span><span class="dz-ck">${chat.ctx.includes(k) ? ico('check', 12) : ''}</span></button>`;
      const tg = (k, ic, t, sub) => html`<button type="button" class="dz-o" role="switch" aria-checked="${chat[k] ? 'true' : 'false'}" data-tg="${k}"><span class="dz-oi">${ico(ic, 14)}</span><span class="dz-ot">${t}<small>${sub}</small></span><input type="checkbox" class="switch" tabindex="-1" aria-hidden="true" ${chat[k] ? raw('checked') : ''}></button>`;
      const modo = (k, ic, t, sub) => html`<button type="button" class="dz-o ${chat[k] ? 'on' : ''}" data-tg="${k}"><span class="dz-oi">${ico(ic, 14)}</span><span class="dz-ot">${t}<small>${sub}</small></span><span class="dz-ck">${chat[k] ? ico('check', 12) : ''}</span></button>`;
      const ir = (v, t, sub, n) => html`<button type="button" class="dz-o" data-vista="${v}"><span class="dz-oi">${ico(v === 'ideas' ? 'bulb' : 'doc', 14)}</span><span class="dz-ot">${t}<small>${sub}</small></span><span class="dz-n">${n ? html`${n} ${ico('right', 12)}` : ico('right', 12)}</span></button>`;
      const pinta = () => {
        const deMes = (mes) => ideas.filter((p) => String(p.date || '').slice(0, 7) === mes).length;
        const nIdeas = chat.ctx.filter((k) => k.startsWith('idea:')).length, nLib = chat.ctx.filter((k) => k.startsWith('lib:')).length;
        const refs = todo.filter((x) => x.kind === 'research' && x.profile === b.slug);
        if (vista === 'ideas') { const l = ideas.filter((p) => !q || String(p.title || '').toLowerCase().includes(q.toLowerCase())); mount(m, html`<header class="dz-ph"><button type="button" class="dz-back" data-vista="inicio" aria-label="Volver">${ico('arrow-left', 14)}</button><b>Ideas del calendario</b><span class="mut sm">Elige una o varias</span></header><input class="in" data-q placeholder="Buscar idea…" value="${q}">
          <div class="dz-ol">${l.length ? l.map((p) => fila(`idea:${p.id}`, 'bulb', p.title || 'Sin título', [p.format, p.date ? p.date.slice(8, 10) + '/' + p.date.slice(5, 7) : 'sin fecha', estadoDe(p)].filter(Boolean).join(' · '))) : html`<p class="mut sm" style="padding:8px 10px;margin:0">No hay ideas abiertas de ${b.name}.</p>`}</div>`); }
        else if (vista === 'lib') { const docs = (libData?.docs || []).filter((d) => !q || `${d.titulo} ${d.carpeta}`.toLowerCase().includes(q.toLowerCase())); mount(m, html`<header class="dz-ph"><button type="button" class="dz-back" data-vista="inicio" aria-label="Volver">${ico('arrow-left', 14)}</button><b>Library</b><span class="mut sm">${nLib} de ${libMax}</span></header><input class="in" data-q placeholder="Buscar documento…" value="${q}">
          <div class="dz-ol">${libData === null ? html`<p class="mut sm" style="padding:8px 10px;margin:0">Cargando la Library…</p>` : libData.error ? html`<p class="es-err" style="padding:8px 10px;margin:0">${libData.error}</p>` : docs.length ? docs.slice(0, 60).map((d) => fila(`lib:${d.id}`, 'doc', d.titulo, [d.tipo, d.carpeta].filter(Boolean).join(' · '), !chat.ctx.includes(`lib:${d.id}`) && nLib >= libMax ? 'disabled' : '')) : html`<p class="mut sm" style="padding:8px 10px;margin:0">Nada coincide.</p>`}</div>`); }
        else if (vista === 'formato') mount(m, html`<header class="dz-ph"><button type="button" class="dz-back" data-vista="inicio" aria-label="Volver">${ico('arrow-left', 14)}</button><b>Formato</b></header><div class="dz-ol">${FORMATOS.map(([f, dsc]) => html`<button type="button" class="dz-o ${chat.formato === f ? 'on' : ''}" data-fmt="${f}"><span class="dz-oi">${ico('layers', 14)}</span><span class="dz-ot">${f}<small>${dsc}</small></span><span class="dz-ck">${chat.formato === f ? ico('check', 12) : ''}</span></button>`)}</div>`);
        else mount(m, html`${solo === 'modo' ? '' : html`<header class="dz-ph"><b>Contexto</b><span class="mut sm">Lo que lee antes de responder</span></header><div class="dz-ol">
          ${fila('refs', 'play', 'Investigación', refs.length ? `${refs.filter((x) => x.replicar).length || Math.min(8, refs.length)} posts ganadores ${refs.some((x) => x.replicar) ? 'marcados «Usar como formato»' : 'de su mercado'}` : 'Todavía no hay nada en Investigación', refs.length ? '' : 'disabled')}
          ${ir('lib', 'Documentos de la Library', 'SOPs, entrevistas, notas', nLib)}
          ${MESES_CTX().map((mes) => fila(`cal:${mes}`, 'cal', nombreCtx(`cal:${mes}`), `${deMes(mes)} pieza${deMes(mes) === 1 ? '' : 's'} con fecha · lo que falta diseñar`))}
          ${ir('ideas', 'Piezas del calendario', 'Una o varias, con su guion', nIdeas)}</div>`}
        ${solo === 'contexto' ? '' : html`<header class="dz-ph ${solo ? '' : 'dz-ph2'}"><b>Modo de trabajo</b><span class="mut sm">Cómo responde</span></header><div class="dz-ol">
          ${modo('hormozi', 'target', 'Lente Hormozi', 'Oferta, valor y demanda en cada respuesta')}
          <button type="button" class="dz-o" data-vista="formato"><span class="dz-oi">${ico('layers', 14)}</span><span class="dz-ot">Formato · ${chat.formato}<small>Carrusel, estático, story o plantilla</small></span><span class="dz-n">${ico('right', 12)}</span></button></div>`}`);
        const inp = m.querySelector('[data-q]'); if (inp) { inp.oninput = () => { q = inp.value; pinta(); const n = m.querySelector('[data-q]'); n.focus(); n.setSelectionRange(q.length, q.length); }; }
      };
      pinta(); box.append(m); ubicarPop(m, box); anchor.setAttribute('aria-expanded', 'true');
      m.addEventListener('click', async (e) => {
        const v = e.target.closest('[data-vista]'); if (v) { vista = v.dataset.vista; q = ''; if (vista === 'lib' && libData === null) { pinta(); try { libData = await api('estrategia/library'); } catch (er) { libData = { docs: [], error: er.status === 403 ? 'Tu perfil no ve la Library.' : er.message }; } } pinta(); m.querySelector('[data-q]')?.focus(); return; }
        const f = e.target.closest('[data-fmt]'); if (f) { chat.formato = f.dataset.fmt; guardar(); repintarCaja(); vista = 'inicio'; return pinta(); }
        const g = e.target.closest('[data-tg]');
        if (g?.dataset.tg === 'hormozi') { chat.hormozi = !chat.hormozi; guardar(); repintarCaja(); return pinta(); }
        const o = e.target.closest('[data-ck]'); if (!o || o.disabled) return;
        const k = o.dataset.ck; if (k.startsWith('lib:')) { const d = libData?.docs.find((x) => `lib:${x.id}` === k); if (d) chat.libT[d.id] = d.titulo; }
        toggleCtx(k); pinta();
      });
      const cerrar = (e) => { if (!m.contains(e.target) && !e.target.closest('[data-act="ctx"],[data-act="ctx-c"],[data-act="ctx-m"]')) { m.remove(); anchor.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', cerrar); } };
      setTimeout(() => document.addEventListener('pointerdown', cerrar));
    }
    // El texto de lo que esta sesión de Claude todavía no leyó.
    async function textoContexto(nuevas) {
      const partes = [], root = carpetaDe(b.slug);
      let guiones = null;
      const guionDe = async (id) => { if (!id) return ''; try { guiones ||= (await api(`guiones?profile=${encodeURIComponent(b.slug)}`)).guiones; const g = guiones.find((x) => x.id === id); return g ? (g.tramos || []).map((t) => [t.nombre, ...Object.entries(t).filter(([k2, v]) => k2 !== 'nombre' && typeof v === 'string' && v.trim()).map(([, v]) => v)].join(': ')).join('\n') : ''; } catch { return ''; } };
      const libIds = nuevas.filter((k) => k.startsWith('lib:')).map((k) => k.slice(4));
      let libDocs = [];
      if (libIds.length) { try { libDocs = (await api('estrategia/library/textos', { method: 'POST', body: { ids: libIds } })).docs; } catch (e) { toast(`No pude leer la Library: ${e.message}`, true); } }
      for (const k of nuevas) {
        if (k.startsWith('cal:')) partes.push(textoCalendario({ marca: b.name, mes: k.slice(4), piezas: todo.filter((x) => x.kind === 'post' && x.profile === b.slug), estadoDe }));
        else if (k.startsWith('idea:')) { const p = ideas.find((x) => x.id === k.slice(5)); if (p) partes.push(textoIdea(p, await guionDe(p.guion))); }
        else if (k.startsWith('lib:')) { const d = libDocs.find((x) => x.id === k.slice(4)); if (d) partes.push(`DOCUMENTO DE LA LIBRARY «${d.titulo}» (${d.tipo}${d.carpeta ? ' · ' + d.carpeta : ''}):\n${d.contenido}`); }
        else if (k === 'refs') partes.push(textoRefs(todo.filter((x) => x.kind === 'research' && x.profile === b.slug)));
      }
      return partes.filter(Boolean).join('\n\n');
    }

    function paintChat() {
      const f = fase(), ok = f === 'listo';
      mount(chatEl, html`${barraChat({ panel: chat.area, pasos: html`<span class="dg-e on"><i>${ico('layers', 11)}</i><span class="cb-l">Diseño</span></span>` })}<div class="es-msgs" id="dz-msgs" aria-live="polite"></div>
        ${ok ? html`<div class="es-box cx"><div class="dz-chips" id="dz-chips">${chipsHtml()}</div><form class="es-form" id="dz-form"><textarea class="in" id="dz-in" rows="1" placeholder="${phTxt()}" aria-label="Mensaje para el chat"></textarea></form>
          <div class="cx-bar"><button type="button" class="cx-plus" data-act="ctx" aria-haspopup="dialog" aria-expanded="false" aria-label="Contexto y cómo trabaja">${ico('plus', 16)}</button><span class="sp"></span>${modeloHtml()}${botonVoz()}${botonesEnviar('dz-form')}</div><div id="dz-tray">${bandejaHtml()}</div></div><p class="ch-aviso">Diseño trabaja en Figma con el design system y puede equivocarse: revisa lo importante.</p><button type="button" class="ch-abajo" data-act="abajo" aria-label="Bajar al final" hidden>${ico('down', 16)}</button>`
          : html`${setup(f)}<div class="es-foot"><span></span>${modeloHtml()}</div>`}`);
      paintMsgs();
      const ta = $('#dz-in', chatEl); if (ta) ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; };
      const msgs = $('#dz-msgs', chatEl); if (msgs) msgs.onscroll = flechaAbajo;
    }
    // El chat vacío: el título y las tarjetas con lo que se le puede pedir.
    const cardsHtml = () => html`<div class="ch-cards">${ayuda()[3].map((x) => html`<button type="button" class="ch-card" data-act="sug" data-t="${x}"><b>${x}</b><span>Diseño</span></button>`)}</div>`;
    // La flecha para bajar al final: aparece cuando la conversación quedó arriba.
    function flechaAbajo() {
      const box = $('#dz-msgs', chatEl), b = $('.ch-abajo', chatEl); if (!box || !b) return;
      b.hidden = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    }
    function paintMsgs() {
      const box = $('#dz-msgs', chatEl); if (!box) return;
      chatEl.classList.toggle('pensando', Boolean(enVuelo));
      chatEl.classList.toggle('vacio', !chat.msgs.length);
      const H = ayuda();
      mount(box, chat.msgs.length ? chat.msgs.map((m, i) => msgHtml(m, i)) : html`<div class="es-hint"><h1>${H[1]}</h1><p>${H[2]}</p>${cardsHtml()}</div>`);
      box.scrollTop = box.scrollHeight;
      flechaAbajo();
    }
    const horaDe = (ts) => (ts ? new Date(ts).toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit' }) : '');
    function msgHtml(m, i) {
      if (m.r === 'u') return html`<div class="es-m u"><div class="es-b">${m.t}</div>${m.ts ? html`<span class="es-hora">${horaDe(m.ts)}</span>` : ''}</div>`;
      const busy = m.stream, ult = i === chat.msgs.length - 1;
      return html`<div class="es-m a"><span class="es-av" aria-hidden="true">D</span><div class="es-tx"><div class="es-b">${m.tools?.length ? html`<div class="dz-steps">${m.tools.slice(-6).map((t, k, xs) => html`<span class="${busy && k === xs.length - 1 ? 'now' : ''}">${ico(busy && k === xs.length - 1 ? 'spark' : 'check', 12)} ${t}</span>`)}</div>` : ''}${m.t ? md(m.t) : busy ? html`<span class="ch-think"><i></i>Pensando…</span>` : ''}
        ${m.err ? html`<p class="es-err">${m.err}</p>` : ''}${m.aplicado?.length ? html`<span class="es-upd"><i>✦</i>${m.aplicado.join(' · ')}</span>` : ''}${m.aviso ? html`<p class="mut sm">${m.aviso}</p>` : ''}${m.doc && !chat.area ? tarjetaDoc(docDe(m.doc)) : ''}
        ${m.pregunta ? html`<div class="es-q ${ult ? '' : 'hecha'}"><span class="lbl">Una pregunta antes de seguir</span><b>${m.pregunta.texto}</b>${m.pregunta.opciones.length ? html`<div class="es-opts">${m.pregunta.opciones.map((o) => html`<button type="button" data-act="opcion" data-t="${o}" ${ult ? '' : raw('disabled')}>${o}</button>`)}</div>` : ''}</div>` : ''}</div>
        ${!busy && (m.t || m.err) ? html`<div class="ch-acts">${m.t ? html`<button type="button" class="ch-ab" data-act="copiar" data-t="${m.t}" title="Copiar la respuesta">${ico('copy', 13)} Copiar</button>` : ''}${ult ? html`<button type="button" class="ch-ab" data-act="reenviar" title="Volver a pedir esta respuesta">${ico('redo', 13)} Reintentar</button>` : ''}</div>` : ''}</div></div>`;
    }
    const pasoDe = (d) => {
      const n = String(d.nombre || '');
      if (n.startsWith('figma:')) return ({ get_screenshot: 'Exportando las láminas', get_design_context: 'Leyendo el diseño', scan_components: 'Buscando los componentes del kit', get_variable_defs: 'Leyendo las variables', get_styles: 'Leyendo los estilos', create_instance: 'Usando una plantilla del kit', clone_node: 'Duplicando una lámina', set_text: 'Escribiendo los textos', set_fills: 'Poniendo color e imagen', import_image: 'Poniendo una foto', ping: 'Conectando con Figma', use_file: 'Abriendo el archivo de la marca', list_files: 'Buscando el archivo de la marca' })[n.slice(6)] || `Figma · ${n.slice(6).replace(/_/g, ' ')}`;
      return `${n === 'Read' ? 'Leyendo' : 'Buscando'} ${d.detalle || ''}`.trim();
    };

    async function enviar(texto) {
      texto = String(texto || '').trim(); if (!texto || enVuelo) return;
      if (fase() !== 'listo') return toast('Primero conecta tu compu', true);
      const ctrl = new AbortController(); enVuelo = ctrl;
      if (chat.motor !== claveMotor(me)) { chat.sesion = null; chat.motor = claveMotor(me); }
      const primera = !chat.sesion, etapa = 'diseno';
      if (primera) chat.vistas = [];
      const metodo = !chat.vistas.includes(etapa); // la primera vez en esta etapa, el pedido lleva el método del departamento
      chat.msgs.push({ r: 'u', t: S.lamina ? `${S.lamina.nombre} · ${texto}` : texto, ts: Date.now(), pedido: texto }); chat.msgs.push({ r: 'a', t: '', stream: true, tools: [] });
      const msg = chat.msgs[chat.msgs.length - 1], sueltas = [];
      paintMsgs();
      // El contexto: completo la primera vez; después, solo lo que se agregó (la sesión de Claude ya leyó lo demás).
      if (primera) chat.enviados = [];
      const nuevas = chat.ctx.filter((k) => !chat.enviados.includes(k));
      const contexto = nuevas.length ? await textoContexto(nuevas) : '';
      const { variaciones: vs } = variacionesDe(pieza() || {});
      const prompt = promptDiseno({ marca: b.name, slug: b.slug, formato: chat.formato, contexto, lamina: S.lamina, variacion: chat.letra, otras: vs, pedido: texto, primera: metodo });
      let raw0 = '', fallo = null;
      try {
        const r = await fetch(PUENTE + '/chat', { method: 'POST', credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', signal: ctrl.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: JSON.stringify({ prompt, modo: 'diseno', ...cuerpoMotor(me), ...(chat.sesion ? { resume: chat.sesion } : {}) }) });
        if (!r.ok) { const j = await r.json().catch(() => ({})); throw Object.assign(new Error(j.error || `El puente respondió ${r.status}`), { status: r.status }); }
        const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
        for (;;) {
          const { value, done } = await rd.read(); if (done) break;
          buf += dec.decode(value, { stream: true });
          let k; while ((k = buf.indexOf('\n\n')) >= 0) {
            const bloq = buf.slice(0, k); buf = buf.slice(k + 2);
            const ev = /^event: (\w+)/m.exec(bloq)?.[1]; let d = {}; try { d = JSON.parse(/^data: (.*)$/m.exec(bloq)?.[1] || '{}'); } catch {}
            if (ev === 'inicio' && d.sesion) chat.sesion = d.sesion;
            else if (ev === 'delta') { raw0 += d.texto || ''; msg.t = sinBloque(raw0); paintMsgs(); }
            else if (ev === 'herramienta') { const p = pasoDe(d); if (msg.tools[msg.tools.length - 1] !== p) msg.tools.push(p); paintMsgs(); }
            else if (ev === 'imagen' && d.datos) { const url = `data:${d.tipo || 'image/png'};base64,${d.datos}`; if (d.nodo) IMGS.set(`${b.slug}|${d.nodo}`, url); else sueltas.push(url); }
            else if (ev === 'fin') { raw0 = d.texto || raw0; if (d.sesion) chat.sesion = d.sesion; }
            else if (ev === 'error') fallo = d;
          }
        }
        if (!fallo) { chat.enviados = [...new Set([...chat.enviados, ...nuevas])]; if (!chat.vistas.includes(etapa)) chat.vistas.push(etapa); }
        if (fallo) { if (!primera && /session|conversation|resume/i.test(fallo.error || '')) { chat.sesion = null; chat.enviados = []; chat.vistas = []; } msg.err = sesionVencida(fallo.error) ? PASOS_LOGIN : fallo.error || 'Claude no pudo responder'; }
      } catch (e) {
        if (e.name === 'AbortError') msg.err = 'Interrumpido.';
        else if (e.status === 401) { setTok(''); S.pareo = 'Ese token ya no sirve. Pega el actual.'; msg.err = 'El puente no reconoció tu token.'; }
        else msg.err = chromeBloquea() ? PASOS_COPIA_VIEJA : sesionVencida(e.message) ? PASOS_LOGIN : e.message && e.message !== 'Failed to fetch' ? e.message : 'No pude hablar con el puente. ¿Sigue encendido?';
        if (e.status === 401 || e.status === 412) await salud();
      } finally { enVuelo = null; msg.stream = false; }
      const { texto: limpio, resultado, pregunta } = leerDiseno(raw0);
      msg.t = sinBloque(limpio); if (pregunta) msg.pregunta = pregunta;
      if (resultado) {
        msg.doc = 'diseno';
        resultado.laminas.forEach((l, k) => { if (!img(l.id) && sueltas[k]) IMGS.set(`${b.slug}|${l.id}`, sueltas[k]); });
        if (['Carrusel', 'Estático', 'Story'].includes(resultado.formato)) chat.formato = resultado.formato;
        chat.borradores[llave()] = { ...resultado, guardado: null }; S.lamina = null; S.ver = 'draft';
      }
      guardar();
      if (!alive()) return;
      if (fase() !== 'listo') return paintChat();
      paintMsgs(); paintPane(); repintarCaja(); $('#dz-in', chatEl)?.focus();
    }
    // ---------- Las tres columnas ----------
    const FMT3 = ['Carrusel', 'Estático', 'Story'];
    // Qué variación se ve: el borrador si hay uno nuevo, si no la elegida.
    function vista() {
      const { variaciones, elegida } = variacionesDe(pieza() || {}), dr = borrador();
      const id = S.ver === 'draft' && dr ? 'draft' : variaciones.some((v) => v.id === S.ver) ? S.ver : dr ? 'draft' : elegida;
      return { variaciones, elegida, dr, id, cur: id === 'draft' ? dr : variaciones.find((v) => v.id === id) || null };
    }
    function colaHtml() {
      const c = colaDelMes({ piezas: posts(), mes: chat.mes, estadoDe });
      return html`<header class="dz-ch"><b>Piezas del mes</b><button type="button" class="cx-t" data-act="mesdg" aria-haspopup="listbox" title="El mes que se trabaja">${ico('cal', 13)}${Mes()} <span class="cx-car">▾</span></button></header>
        ${c.length ? html`<ul class="dz-cl">${c.map((x) => html`<li><button type="button" class="dz-ci ${x.id === chat.ideaId ? 'on' : ''} ${x.falta ? 'falta' : ''}" data-act="pieza" data-id="${x.id}" aria-pressed="${x.id === chat.ideaId ? 'true' : 'false'}"><b>${x.titulo}</b><small>${[x.formato, fmtDia(x.fecha), x.estado].filter(Boolean).join(' · ')}</small>${x.variaciones ? html`<span class="dz-nv">${x.variaciones} variación${x.variaciones === 1 ? '' : 'es'}</span>` : x.falta ? html`<span class="dz-nv am">Falta diseñar</span>` : ''}</button></li>`)}</ul>`
          : html`<p class="mut sm dz-vacio">${b.name} no tiene piezas de diseño con fecha en ${Mes()}. ⚠️ SIN DATOS: salen del Calendario.</p>`}
        <button type="button" class="dz-ci suelta ${chat.ideaId ? '' : 'on'}" data-act="pieza" data-id=""><b>Pieza suelta</b><small>Algo puntual, sin pieza del calendario</small></button>`;
    }
    function lienzoHtml() {
      const p = pieza(), { variaciones, elegida, dr, id, cur } = vista();
      const letraNueva = chat.letra || letraLibre(variaciones) || 'A';
      const laminas = cur?.laminas || [];
      const faltan = laminas.filter((l) => !img(l.id)).length;
      const malas = (cur?.revision || []).filter((x) => !x.ok);
      return html`<div class="ad dz-lz"><header class="dz-lh"><div class="dz-lt"><b>${p?.title || dr?.titulo || 'Sin pieza elegida'}</b><small>${p ? [p.format, fmtDia(p.date), estadoDe(p)].filter(Boolean).join(' · ') : 'Pieza suelta'}</small></div><span class="sp"></span>
          <div class="dz-fmt" role="group" aria-label="Formato">${FMT3.map((f) => html`<button type="button" class="${chat.formato === f ? 'on' : ''}" data-act="fmt" data-f="${f}" aria-pressed="${chat.formato === f ? 'true' : 'false'}">${f}</button>`)}</div></header>
        <div class="dz-tabs" role="tablist" aria-label="Variaciones">${variaciones.map((v) => html`<button type="button" role="tab" class="dz-tab ${id === v.id ? 'on' : ''}" aria-selected="${id === v.id ? 'true' : 'false'}" data-act="var" data-l="${v.id}">${v.id}${elegida === v.id ? html` <i title="La elegida">${ico('check', 11)}</i>` : ''}</button>`)}${dr ? html`<button type="button" role="tab" class="dz-tab bor ${id === 'draft' ? 'on' : ''}" aria-selected="${id === 'draft' ? 'true' : 'false'}" data-act="var" data-l="draft">${letraNueva} · borrador</button>` : ''}${letraLibre(variaciones) || dr ? html`<button type="button" class="dz-tab mas" data-act="nueva-var" title="Pídele a Claude otra dirección visual">${ico('plus', 11)} Variación</button>` : ''}</div>
        <div class="ad-b"><div class="ad-in">${cur ? html`${cur.revision?.length ? html`<div class="dz-rev">${cur.revision.map((x) => html`<span class="${x.ok ? 'ok' : 'am'}">${x.texto}</span>`)}</div>` : ''}
          <div class="dz-grid ${esStory(chat.formato) ? 'st' : ''}">${laminas.map((l) => html`<button type="button" class="dz-fr ${S.lamina?.id === l.id ? 'sel' : ''}" data-act="lamina" data-id="${l.id}" title="Seleccionar para pedir un cambio">
            <span class="dz-im">${img(l.id) ? html`<img alt="${l.nombre}" src="${img(l.id)}">` : html`<span class="mut sm">Sin vista previa</span>`}</span><span class="dz-cap"><b>${l.nombre}</b><span class="dz-ojo" data-ojo="${l.id}">${ojoChip(OJO.get(`${b.slug}|${l.id}`), { compact: true })}</span></span></button>`)}</div>
          ${faltan ? html`<p class="mut sm" style="margin:0">${faltan === laminas.length ? 'Las vistas previas no se guardan al recargar.' : `Faltan ${faltan} vistas previas.`} <button type="button" class="linkish" data-act="reexportar">Pedirlas otra vez</button></p>` : ''}`
          : html`<div class="dz-empty"><span class="es-hint-i">${ico('layers', 22)}</span><b>${p ? 'Todavía no hay láminas de esta pieza' : 'Elige una pieza del mes'}</b><p class="mut">Claude las arma en Figma con el design system de ${b.name} y las revisa contra su guía. Cada intento queda como variación A, B o C: eliges una y las demás se conservan.</p>
            ${sis?.colores.length ? html`<div class="dz-pal">${sis.colores.map((c) => html`<span title="${c.nombre} · ${c.hex}" style="background:${c.hex}"></span>`)}</div>` : ''}</div>`}</div></div>
        ${cur ? html`<footer class="ad-f">${id === 'draft' ? html`<span>${malas.length ? `Antes de guardar, revisa: ${malas.map((x) => x.texto).join(' · ')}. ` : ''}Se guarda como <b>variación ${letraNueva}</b> en ${p ? `«${p.title}»` : 'una pieza nueva del calendario'}.</span><span class="sp"></span><button class="btn" data-act="guardar" ${S.guardando ? raw('disabled') : ''}>${S.guardando ? 'Guardando…' : `Guardar variación ${letraNueva}`}</button>`
          : html`<span>${elegida === id ? html`Es la <b>elegida</b>. Las otras variaciones se conservan.` : 'Elegirla no borra las otras.'}</span><span class="sp"></span><button class="btn ghost xs" data-act="rehacer" data-l="${id}">Rehacer ${id}</button>${elegida === id ? '' : html`<button class="btn xs" data-act="elegir" data-l="${id}" ${S.guardando ? raw('disabled') : ''}>Elegir ${id}</button>`}`}</footer>` : ''}</div>`;
    }
    function infoHtml() {
      const p = pieza(), { cur } = vista(), l = S.lamina || cur?.laminas?.[0];
      const sin = (t) => html`<span class="pm-warn">${ico('alert', 12)} ⚠️ SIN DATOS: ${t}</span>`;
      return html`<section class="dz-sec"><h4>Concepto</h4>${p ? html`<p><b>${p.title}</b></p>${p.hook ? html`<p class="dg-hook">«${p.hook}»</p>` : ''}<p class="mut sm">${[p.pillar && `Pilar: ${p.pillar}`, p.campana && `Campaña: ${p.campana}`].filter(Boolean).join(' · ') || ''}</p>` : sin('elige una pieza del calendario')}</section>
        <section class="dz-sec"><h4>Copy</h4>${p?.caption ? html`<p class="dz-copy">${p.caption}</p>` : sin('la pieza no tiene caption todavía')}</section>
        <section class="dz-sec"><h4>Revisión</h4>${cur?.revision?.length ? html`<ul class="dz-chk">${cur.revision.map((x) => html`<li class="${x.ok ? 'ok' : 'am'}">${ico(x.ok ? 'check' : 'alert', 12)} ${x.texto}</li>`)}</ul>` : html`<p class="mut sm">Claude revisa cada lámina contra el sistema visual y la lista sale aquí.</p>`}</section>
        <section class="dz-sec"><h4>El ojo</h4>${l ? html`<span class="dz-ojo" data-ojo="${l.id}" data-c="0">${ojoChip(OJO.get(`${b.slug}|${l.id}`))}</span><p class="mut sm">${l.nombre}</p>` : html`<p class="mut sm">Sin láminas todavía.</p>`}</section>
        <div class="row" style="gap:6px;flex-wrap:wrap">${cur?.figma ? html`<a class="btn ghost xs" href="${cur.figma}" target="_blank" rel="noopener">${ico('link', 12)} Abrir en Figma</a>` : ''}${cur?.laminas?.some((x) => img(x.id)) ? html`<button class="btn ghost xs" data-act="bajar">${ico('down', 12)} PNG</button>` : ''}<a class="btn ghost xs" href="${rutaModulo(b.slug, 'design')}">${ico('layers', 12)} Design system</a></div>`;
    }
    function paintPane() {
      ponerArea();
      mount(colaEl, colaHtml()); mount(paneEl, lienzoHtml()); mount(infoEl, infoHtml());
      const { cur } = vista(); if (cur) queueMicrotask(() => verLaminas(cur.laminas));
    }
    function seleccionar(id) {
      chat.ideaId = id || ''; chat.letra = ''; S.ver = ''; S.lamina = null;
      chat.ctx = [...chat.ctx.filter((k) => !k.startsWith('idea:')), ...(id && ideas.some((x) => x.id === id) ? [`idea:${id}`] : [])];
      guardar(); repintarCaja(); paintPane();
    }
    async function cambiarMes(mes) { chat.mes = mes; guardar(); repintarCaja(); paintPane(); }
    const repintarPh = () => { const ta = $('#dz-in', chatEl); if (ta) ta.placeholder = phTxt(); };
    function pedir(texto, letra) { chat.letra = letra; guardar(); repintarCaja(); repintarPh(); const ta = $('#dz-in', chatEl); if (ta) { ta.value = texto; ta.focus(); } else toast('Primero conecta tu compu', true); }

    async function guardarEnContenido() {
      const r = borrador(); if (!r || S.guardando) return;
      let post = pieza();
      if (!post && !(await confirmAsk(`No hay una pieza del calendario elegida. ¿Creo una pieza nueva «${r.titulo || 'Sin título'}» en ${b.name}?`))) return;
      S.guardando = true; paintPane();
      try {
        if (!post) post = await col('content').create({ kind: 'post', profile: b.slug, title: r.titulo || 'Sin título', format: FMT3.includes(r.formato) ? r.formato : chat.formato === 'Plantilla' ? 'Estático' : chat.formato, status: 'Idea' });
        const letra = chat.letra || letraLibre(variacionesDe(post).variaciones) || 'A';
        const subidas = [];
        if (me.google?.drive) {
          for (const [k, l] of r.laminas.entries()) {
            const u = img(l.id); if (!u) { subidas.push(null); continue; }
            const [, tipo, datos] = /^data:([^;]+);base64,(.*)$/.exec(u) || [];
            const ext = tipo === 'image/jpeg' ? 'jpg' : 'png';
            const f = new File([bytesDe(datos)], `${l.nombre}.${ext}`, { type: tipo });
            toast(`Subiendo a Drive ${k + 1} de ${r.laminas.length}…`);
            const d = await uploadToDrive(f, `${b.name} · ${r.titulo || post.title} · ${letra} · ${l.nombre}.${ext}`, () => {}, { client: b.slug, sub: '04 Por postear' });
            subidas.push({ drive_id: d.id, url: d.link || d.webViewLink || '' });
          }
        }
        const sv = await guardarConV(post.id, post, (cur) => piezaLista(cur, r, subidas, undefined, { letra }));
        poner(sv); chat.ideaId = sv.id; if (!chat.ctx.includes(`idea:${sv.id}`)) chat.ctx = [...chat.ctx, `idea:${sv.id}`];
        delete chat.borradores[llave()]; delete chat.borradores._; chat.letra = ''; S.ver = letra; S.lamina = null; guardar();
        toast(me.google?.drive ? `Variación ${letra} guardada: la pieza quedó Lista en el Calendario` : `Variación ${letra} guardada con el link de Figma. Conecta tu Google para subir también las láminas a Drive.`);
      } catch (e) { toast(e.message, true); }
      S.guardando = false; if (alive()) { repintarCaja(); repintarPh(); paintPane(); }
    }
    // Elegir una variación: solo cambia `elegida`; las otras no se tocan.
    async function elegir(letra) {
      const p = pieza(); if (!p || S.guardando) return;
      S.guardando = true; paintPane();
      try { const sv = await guardarConV(p.id, p, (cur) => elegirVariacion(cur, letra)); poner(sv); S.ver = letra; toast(`Elegiste la variación ${letra}`); }
      catch (e) { toast(e.message, true); }
      S.guardando = false; if (alive()) paintPane();
    }
    function bajar() {
      for (const l of vista().cur?.laminas || []) { const u = img(l.id); if (!u) continue; const a = document.createElement('a'); a.href = u; a.download = `${b.name} - ${l.nombre}.png`; document.body.append(a); a.click(); a.remove(); }
    }

    // ---------- Clics ----------
    root.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-act]'); if (!t || !root.contains(t)) return;
      const a = t.dataset.act;
      if (a === 'copiar') { try { await navigator.clipboard.writeText(t.dataset.t); toast('Copiado'); } catch { toast('Selecciona el texto y cópialo', true); } return; }
      if (a === 'abajo') { const box = $('#dz-msgs', chatEl); if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }); return; }
      if (a === 'reenviar') { // se quita el último par y se vuelve a mandar el mismo pedido
        if (enVuelo || chat.msgs.length < 2) return; const u = chat.msgs[chat.msgs.length - 2]; if (u.r !== 'u') return;
        chat.msgs.splice(-2); return enviar(u.pedido || u.t);
      }
      if (a === 'marca') return menuMarcas(t, b.slug);
      if (a === 'motor') return menuMotor(t, me, S.salud?.chat, () => paintChat(), { diseno: true, laya: S.salud?.on ? S.salud : null });
      if (a === 'ctx-c' || a === 'ctx-m') return document.querySelector('.dz-ctxp') ? document.querySelector('.dz-ctxp').remove() : panelCtx(t, 'inicio', '', a === 'ctx-c' ? 'contexto' : 'modo');
      if (a === 'voz') return dictar(t, $('#dz-in', chatEl));
      if (a === 'panel-tg' || a === 'panel-x' || a === 'panel-abrir') { chat.area = a === 'panel-tg' ? !chat.area : a === 'panel-abrir'; guardar(); ponerArea(); const tg = $('[data-act="panel-tg"]', chatEl); if (tg) { tg.classList.toggle('on', chat.area); tg.setAttribute('aria-pressed', String(chat.area)); } paintMsgs(); return; }
      if (a === 'marca-cambiar') return menuMarcas(t, b.slug);
      if (a === 'chat-nuevo') { if (enVuelo) return; if (chat.msgs.length && !(await confirmAsk('¿Empiezo una conversación nueva? Las piezas y variaciones se quedan.'))) return; Object.assign(chat, { msgs: [], sesion: null, enviados: [], vistas: [] }); guardar(); paintChat(); return; }
      if (a === 'mesdg') return menuDz(t, [...new Set([chat.mes, ...MESES_CTX()])].sort().map((x) => ({ label: mesNombre(x), sub: x === MESES_CTX()[0] ? 'Este mes' : x === MESES_CTX()[1] ? 'El siguiente' : '', on: x === chat.mes, pick: () => cambiarMes(x) })));
      if (a === 'pieza') return seleccionar(t.dataset.id);
      if (a === 'fmt') { chat.formato = t.dataset.f; guardar(); repintarCaja(); paintPane(); return; }
      if (a === 'var') { S.ver = t.dataset.l; S.lamina = null; paintPane(); repintarCaja(); return; }
      if (a === 'nueva-var') { const l = vista().dr ? chat.letra || letraLibre(vista().variaciones) : letraLibre(vista().variaciones); if (!l) return toast('Ya hay seis variaciones: rehaz una', true); return pedir('Hazme otra variación con una dirección visual distinta: ', l); }
      if (a === 'rehacer') return pedir(`Rehaz la variación ${t.dataset.l}: `, t.dataset.l);
      if (a === 'elegir') return elegir(t.dataset.l);
      if (a === 'ctx') return document.querySelector('.dz-ctxp') ? (document.querySelector('.dz-ctxp').remove(), t.setAttribute('aria-expanded', 'false')) : panelCtx(t);
      if (a === 'ctx-x') return toggleCtx(t.dataset.k);
      if (a === 'hz-x') { chat.hormozi = false; guardar(); return repintarCaja(); }
      if (a === 'formato') return menuDz(t, FORMATOS.map(([f, dsc]) => ({ label: f, sub: dsc, on: chat.formato === f, pick: () => { chat.formato = f; guardar(); repintarCaja(); paintPane(); } })));
      if (a === 'sin-lamina') { S.lamina = null; repintarCaja(); paintPane(); return; }
      if (a === 'lamina') { const l = vista().cur?.laminas.find((x) => x.id === t.dataset.id); S.lamina = S.lamina?.id === l?.id ? null : l; paintPane(); repintarCaja(); $('#dz-in', chatEl)?.focus(); return; }
      if (a === 'opcion') { t.closest('.es-q')?.classList.add('hecha'); return enviar(t.dataset.t); }
      if (a === 'sug') { const ta = $('#dz-in', chatEl); if (ta) { ta.value = t.dataset.t; ta.focus(); } return; }
      if (a === 'detener') { try { enVuelo?.abort(); } catch {} return; }
      if (a === 'guardar') return guardarEnContenido();
      if (a === 'bajar') return bajar();
      if (a === 'reexportar') return enviar('Vuelve a exportar con get_screenshot las láminas que ya armaste, sin cambiarlas, y cierra con el bloque diseno.');
      if (a === 'reintentar') { t.disabled = true; t.textContent = 'Buscando… si Chrome pregunta, dale «Permitir»'; await salud(30000); if (!S.salud?.on) toast(chromeBloquea() ? PASOS_COPIA_VIEJA : 'Tu compu no respondió. Abre el OS en Chrome y dale permiso si lo pide.', true); return paintChat(); }
    });
    root.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (e.target.id === 'dz-form') { const ta = $('#dz-in', chatEl); const v = ta.value; ta.value = ''; ta.style.height = 'auto'; return enviar(v); }
      if (e.target.dataset.act === 'pair') {
        const v = new FormData(e.target).get('t')?.toString().trim(); if (!v) return;
        try {
          const r = await fetch(PUENTE + '/chat/estado', { headers: { Authorization: 'Bearer ' + v }, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' });
          if (r.ok) { setTok(v); S.pareo = ''; toast('Listo: tu compu quedó emparejada'); } else S.pareo = r.status === 401 ? 'Ese token no es el del puente.' : `El puente respondió ${r.status}.`;
        } catch { S.pareo = 'No pude hablar con el puente.'; }
        return paintChat();
      }
    });
    root.addEventListener('keydown', (e) => { if (e.target.id === 'dz-in' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#dz-form', root)?.requestSubmit(); } });

    if (chat.ideaId && !todo.some((p) => p.id === chat.ideaId)) chat.ideaId = '';
    paintChat(); paintPane(); salud().then(() => { if (alive()) paintChat(); });
  }
}
