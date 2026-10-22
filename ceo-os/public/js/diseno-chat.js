// Diseño gráfico › Chat: el único chat del espacio. Una secuencia cerrada por marca y mes:
//   1 · Plan del mes (③ Marketing) → 2 · Ideas (④ Creatividad) → 3 · Diseño (⑥A, en Figma).
// Sin estrategia aprobada no hay plan; sin plan pasado a Creatividad no hay ideas; sin ideas no hay diseño. La excepción a
// propósito es la «pieza suelta» (una presentación, algo puntual): va directo a Diseño y se marca así.
// A la izquierda el chat; a la derecha el área de trabajo de la etapa (el plan, las ideas, las piezas), armada con lo que se
// habló y lo que ya está en las herramientas. Corre con el modelo de tu compu por el puente de Laya (Plan e Ideas en solo
// lectura; Diseño suma Figma con figwright).
// Rutas: #/marcas/diseno · #/marcas/diseno/<marca>
import { html, raw, mount, api, col, toast, ico, md, initials, confirmAsk, ask, uploadToDrive, $, $$ } from './core.js';
import { PUENTE, INSTALAR_MAC, INSTALAR_WIN, sistemaDe } from './laya.js';
import { chromeBloquea, PASOS_COPIA_VIEJA, sesionVencida, PASOS_LOGIN } from './puente-chat.js';
import { FORMATOS, SUGERENCIAS, promptDiseno, leerDiseno, sinBloque, piezaLista, bytesDe, MESES_CTX, etiquetaCtx, textoCalendario, textoPlan, textoIdea, textoRefs, textoFormatos, carpetaDe } from './diseno.js';
import { leerSistema } from './sistema-visual.js';
import { estadoDe } from './element.js';
import { promptPlan, leerPlan, sinBloqueP, NOMBRE_P, nombreMes } from './plan-mes.js';
import { planPanel, pasarPlan, mesesPlan } from './plan-mes-ui.js';
import { promptIdeas, leerIdeas, sinBloqueI } from './ideas-chat.js';
import { divisor, ubicarPop } from './divisor.js';
import { docHtml, tarjetaDoc, barraChat } from './artifact.js';
import { menuMotor, faltaMotor, faltaHtml, cuerpoMotor, claveMotor, motorDe, nombreMotor } from './motor-ui.js';

const IMGS = new Map(); // `${marca}|${nodo}` → data URL (solo en memoria: pesan)
const ETAPAS = [['plan', 'Plan del mes', '③ Marketing'], ['ideas', 'Ideas', '④ Creatividad'], ['diseno', 'Diseño', '⑥A Diseño gráfico']];
let enVuelo = null;
const enCompu = () => !/iPhone|iPod|Android.+Mobile/i.test(navigator.userAgent || '');

// Un menú chico anclado a la caja (mismo estilo que los de Estrategia). items: [{ label, sub, mono, on, pick }]
function menuDz(anchor, items, { buscar = '' } = {}) {
  document.querySelector('.es-menu')?.remove();
  const box = anchor.closest('.es-box') || anchor.parentElement;
  const m = document.createElement('div'); m.className = 'es-menu'; m.setAttribute('role', 'listbox');
  const pinta = (q = '') => { mount(m, html`${buscar ? html`<input class="in" placeholder="${buscar}" aria-label="${buscar}" value="${q}">` : ''}${items.filter((x) => !q || x.label.toLowerCase().includes(q.toLowerCase())).map((x, i) => html`<a href="#" class="${x.on ? 'on' : ''}" role="option" data-i="${items.indexOf(x)}">${x.mono != null ? html`<i class="mono">${x.mono}</i>` : html`<b></b>`}<span>${x.label}</span>${x.sub ? html`<small>${x.sub}</small>` : ''}</a>`)}${items.length ? '' : html`<p class="mut sm" style="padding:8px 12px;margin:0">No hay opciones.</p>`}`); const inp = m.querySelector('input'); if (inp) { inp.oninput = () => { const v = inp.value; pinta(v); const n = m.querySelector('input'); n.focus(); n.setSelectionRange(v.length, v.length); }; } };
  pinta(); box.append(m); m.querySelector('input')?.focus();
  const cerrar = (e) => { if (!m.contains(e.target) && e.target !== anchor) { m.remove(); document.removeEventListener('pointerdown', cerrar); } };
  setTimeout(() => document.addEventListener('pointerdown', cerrar));
  m.addEventListener('click', (e) => { const a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault(); m.remove(); items[+a.dataset.i]?.pick(); });
}

export async function disenoChat(el, { me, sub = [], alive, brands = [] }) {
  if (enVuelo) { try { enVuelo.abort(); } catch {} enVuelo = null; }
  const marcas = brands.filter((b) => !b.personal);
  const ir = (slug) => { location.hash = `/marcas/diseno/${slug}`; };
  const menuMarcas = (anchor, actual = '') => menuDz(anchor, marcas.map((b) => ({ label: b.name, sub: b.sub, mono: initials(b.name), on: b.slug === actual, pick: () => ir(b.slug) })), { buscar: 'Buscar marca…' });
  const slug = sub[0];
  if (!slug) return inicio();
  if (!enCompu()) return mount(el, html`<a class="btn ghost" href="#/marcas/diseno">${ico('arrow-left', 14)} Diseño</a><div class="empty es-solo-compu"><span class="es-hint-i">${ico('edit', 22)}</span><b>Disponible solo en tu compu</b>El chat de Diseño trabaja con el Claude y el Figma de tu computadora. Ábrelo desde ahí.</div>`);
  const b = marcas.find((x) => x.slug === slug);
  if (!b) return mount(el, html`<a class="btn ghost" href="#/marcas/diseno">${ico('arrow-left', 14)} Diseño</a><div class="empty" style="margin-top:16px"><b>No encontré esa marca</b>Elige otra en la caja.</div>`);
  return trabajo(b);

  // ---------- Inicio: «¿Qué diseñamos hoy?» ----------
  function inicio() {
    mount(el, html`<div class="es-start dz-start"><h1>¿Qué hacemos hoy?</h1><p class="mut">Elige la marca. Del plan del mes a las piezas en Figma, en un solo chat y en orden.</p>
      <div class="es-box es-box-start"><div class="es-form"><textarea class="in" rows="1" placeholder="Elige una marca para escribir…" disabled aria-label="Mensaje para el chat"></textarea><button class="btn es-send" type="button" disabled aria-label="Enviar">${ico('right', 16)}</button></div>
        <div class="es-foot"><button type="button" class="es-pick need" data-act="marca" aria-haspopup="listbox">Elegir marca ▾</button><span></span></div></div>
      <div class="dz-sug">${SUGERENCIAS.map((s) => html`<span>${s}</span>`)}</div></div>`);
    el.onclick = (e) => { const t = e.target.closest('[data-act="marca"]'); if (t) menuMarcas(t); };
    const t = $('[data-act="marca"]', el); if (t && marcas.length) menuMarcas(t);
  }

  // ---------- Una marca ----------
  async function trabajo(b) {
    el.onclick = null;
    mount(el, html`<p class="loading">Cargando…</p>`);
    const key = `os.diseno.chat.${me.email}.${b.slug}`;
    // El contexto: claves «cal:AAAA-MM» · «plan:AAAA-MM» · «idea:<id>» · «lib:<id>» · «refs». `enviados`: las que esta sesión de Claude ya leyó.
    const chat = (() => { const base = { msgs: [], sesion: null, motor: '', formato: 'Carrusel', ideaId: '', resultado: null, ctx: [], libT: {}, enviados: [], etapa: 'plan', mes: mesesPlan()[1], suelta: false, hormozi: true, area: true, vistas: [], ideasProp: [] }; try { const j = JSON.parse(localStorage.getItem(key) || 'null'); if (j && Array.isArray(j.msgs)) return { ...base, ...j, ctx: Array.isArray(j.ctx) ? j.ctx : j.ideaId ? [`idea:${j.ideaId}`] : [], enviados: Array.isArray(j.enviados) ? j.enviados : [] }; } catch {} return base; })();
    const guardar = () => { try { localStorage.setItem(key, JSON.stringify({ msgs: chat.msgs.slice(-30).map(({ r, t, err, pregunta, doc }) => ({ r, t, ...(err ? { err } : {}), ...(pregunta ? { pregunta } : {}), ...(doc ? { doc } : {}) })), sesion: chat.sesion, motor: chat.motor, etapa: chat.etapa, mes: chat.mes, suelta: chat.suelta, hormozi: chat.hormozi, area: chat.area, vistas: chat.vistas, ideasProp: chat.ideasProp.slice(-40), formato: chat.formato, ideaId: chat.ideaId, resultado: chat.resultado, ctx: chat.ctx, libT: chat.libT, enviados: chat.enviados })); } catch {} };
    const tok = () => { try { return localStorage.getItem(`os.estrategia.token.${me.email}`) || ''; } catch { return ''; } };
    const setTok = (t) => { try { if (t) localStorage.setItem(`os.estrategia.token.${me.email}`, t); else localStorage.removeItem(`os.estrategia.token.${me.email}`); } catch {} };
    // Si se llegó desde una herramienta («Trabajarlo en el chat»), abre en esa etapa y ese mes.
    try { const j = JSON.parse(localStorage.getItem('os.dg.etapa') || 'null'); if (j?.slug === b.slug) { if (ETAPAS.some(([k]) => k === j.etapa)) chat.etapa = j.etapa; if (/^\d{4}-\d{2}$/.test(j.mes || '')) chat.mes = j.mes; } localStorage.removeItem('os.dg.etapa'); } catch {}
    const cargarEstado = () => api(`plan/${encodeURIComponent(b.slug)}/${chat.mes}`).catch((e) => ({ error: e.message, plan: null, piezas: 0, conIdea: 0, estrategia: { aprobada: false } }));
    let [sisD, todo, E] = await Promise.all([api(`repo/client/${encodeURIComponent(b.slug)}/sistema`).catch(() => ({ md: '' })), col('content').list().catch(() => []), cargarEstado()]);
    if (!alive()) return;
    const sis = sisD.md ? leerSistema(sisD.md) : null;
    const ideas = todo.filter((p) => p.kind === 'post' && p.profile === b.slug && !['Publicado', 'Archivado'].includes(estadoDe(p))).sort((a, z) => String(a.date || '9').localeCompare(String(z.date || '9')));
    const S = { salud: null, pareo: '', lamina: null, guardando: false, fresh: [], pasando: false, enviando: false };
    // ---------- La secuencia ----------
    const planHecho = () => Boolean(E.plan?.slots?.length && E.piezas);
    // Todo pide la estrategia aprobada; la pieza suelta es la única que entra directo (y solo a Diseño).
    const abierta = (k) => (k === 'diseno' && chat.suelta) || Boolean(E.estrategia?.aprobada && (k === 'plan' || (k === 'ideas' ? planHecho() : E.conIdea > 0)));
    const hecha = (k) => (k === 'plan' ? planHecho() : k === 'ideas' ? E.conIdea > 0 : Boolean(chat.resultado?.guardado));
    const Mes = () => nombreMes(chat.mes).replace(/^./, (c) => c.toUpperCase());
    // La barra fija de arriba: el cliente, el mes y el panel; abajo, las etapas en orden.
    const etapaHtml = () => html`${barraChat({ cliente: { act: 'marca-cambiar', mono: initials(b.name), nombre: b.name }, panel: chat.area,
        derecha: html`<button type="button" class="cb-ib txt" data-act="mesdg" aria-haspopup="listbox">${Mes()} ▾</button>`,
        pasos: html`${ETAPAS.map(([k, l, dep], i) => html`${i ? html`<span class="cb-sep">›</span>` : ''}<button type="button" class="dg-e ${chat.etapa === k ? 'on' : ''} ${hecha(k) ? 'ok' : ''}" data-act="etapa" data-e="${k}" title="${dep}${abierta(k) ? '' : ' · todavía cerrada'}"><i>${hecha(k) ? ico('check', 11) : abierta(k) ? i + 1 : ico('lock', 11)}</i>${l}</button>`)}${chat.suelta ? '' : html`<button type="button" class="cb-mini" data-act="suelta" title="Algo puntual que no sale del plan: va directo a Diseño">${ico('plus', 11)} Pieza suelta</button>`}` })}
      ${chat.suelta ? html`<div class="dg-suelta">${ico('alert', 12)} Pieza suelta: no sale de la estrategia ni del plan del mes. <button type="button" class="linkish" data-act="suelta">Volver a la secuencia</button></div>` : ''}`;
    // Lo que se pide en cada etapa: el título del chat vacío y las sugerencias de arriba de la caja.
    const ayuda = () => ({ plan: ['target', `El plan de ${nombreMes(chat.mes)}`, 'Qué se dice este mes, en qué canal y en qué semana, y para qué sirve cada pieza. Sale de la estrategia aprobada.', ['Arma el plan del mes', '¿Este mes es campaña o pilar?', 'Reparte las piezas por semana']],
      ideas: ['bulb', `Las ideas de ${nombreMes(chat.mes)}`, 'Una idea por pieza del plan: qué comunicamos, el formato que ya funciona en Investigación y cómo se adapta.', ['Dame ideas para todas las piezas', 'Ideas para la semana 1', '¿Qué referente nos sirve más?']],
      diseno: ['edit', `¿Qué diseñamos de ${b.name}?`, 'Se diseña lo que ya se ideó. El chat lee el design system y el kit de redes, y arma las piezas en Figma.', SUGERENCIAS] })[chat.etapa];
    // El documento de cada etapa (la tarjeta del chat y la cabecera del panel).
    const docDe = (e) => (e === 'plan' ? { ic: 'target', titulo: `Plan de ${Mes()} · ③ Marketing`, sub: 'Ábrelo para ver el plan completo' }
      : e === 'ideas' ? { ic: 'bulb', titulo: `Ideas de ${Mes()} · ④ Creatividad`, sub: `${chat.ideasProp.filter((x) => (x.mes || chat.mes) === chat.mes).length} ideas en la mesa` }
      : { ic: 'layers', titulo: chat.resultado?.titulo || `Las piezas de ${b.name}`, sub: '⑥A Diseño gráfico' });
    // Por qué una etapa está cerrada y qué hacer.
    function cerradaHtml(k) {
      if (k === 'plan') return html`<div class="es-setup"><b>${ico('lock', 14)} Primero, la estrategia</b><p>Nadie hace contenido sin estrategia. La de ${b.name} todavía no está aprobada por el CEO.</p><div class="row" style="gap:8px"><a class="btn xs" href="#/estrategia/${b.slug}">Ir a Estrategia</a><button class="btn ghost xs" data-act="suelta">Es una pieza suelta</button></div></div>`;
      if (k === 'ideas') return html`<div class="es-setup"><b>${ico('lock', 14)} Primero, el plan del mes</b><p>Las ideas salen de los slots del plan de ${nombreMes(chat.mes)}. Arma el plan y pásalo a Creatividad.</p><div class="row" style="gap:8px"><button class="btn xs" data-act="etapa" data-e="plan">Ir al plan del mes</button></div></div>`;
      return html`<div class="es-setup"><b>${ico('lock', 14)} Primero, las ideas</b><p>Se diseña lo que Creatividad ya ideó para el plan. Si es algo puntual que no sale del plan, márcalo como pieza suelta.</p><div class="row" style="gap:8px"><button class="btn xs" data-act="etapa" data-e="ideas">Ir a las ideas</button><button class="btn ghost xs" data-act="suelta">Es una pieza suelta</button></div></div>`;
    }
    const ponerArea = () => root.classList.toggle('sin-area', !chat.area);
    const idea = () => ideas.find((p) => p.id === chat.ideaId) || null;
    const ideasCtx = () => chat.ctx.filter((k) => k.startsWith('idea:')).map((k) => ideas.find((p) => p.id === k.slice(5))).filter(Boolean);
    // La pieza donde se guarda lo diseñado: la única idea del contexto (si hay varias, se pregunta al guardar).
    const fijarDestino = () => { const l = ideasCtx(); chat.ideaId = l.length === 1 ? l[0].id : ''; };
    const img = (id) => IMGS.get(`${b.slug}|${id}`) || '';

    mount(el, html`<div class="dz"><section class="es-chat dz-chat" id="dz-chat"></section><section class="dz-pane" id="dz-pane"></section></div>`);
    const root = $('.dz', el), chatEl = $('#dz-chat', el), paneEl = $('#dz-pane', el);

    // ---------- El puente ----------
    async function salud(ms = 4000) {
      let v = { on: false };
      try { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(PUENTE + '/health', { signal: c.signal, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' }); if (r.ok) { const j = await r.json(); v = { on: j.status === 'ok', chat: j.chat || null }; } } finally { clearTimeout(t); } } catch { /* apagado */ }
      S.salud = v; return v;
    }
    function fase() {
      if (!sis && chat.etapa === 'diseno') return 'sin-sistema';
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
      if (f === 'sin-sistema') return html`<div class="es-setup"><b>${b.name} todavía no tiene su sistema visual</b><p>Sin sistema visual, ⑥A Diseño gráfico no arranca. Lo escribe ②B Branding con br-sistema.</p><a class="btn xs" href="#/marcas/${b.slug}/design">Ver el Design system</a></div>`;
      if (f === 'cargando') return html`<div class="es-setup"><p class="mut">Buscando el puente en tu compu…</p></div>`;
      if (f === 'apagado' && chromeBloquea()) return html`<div class="es-setup"><b>Chrome está bloqueando a tu compu</b><p>${PASOS_COPIA_VIEJA}</p>${otra}</div>`;
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
    const modeloHtml = () => { const ok = fase() === 'listo'; return html`<button type="button" class="cx-model" data-act="motor" aria-haspopup="listbox" title="Qué modelo responde">${nombreMotor(motorDe(me))} ▾<small class="${ok ? 'on' : ''}">● ${ok ? 'en tu compu' : 'sin conectar'}</small></button>`; };
    // ---------- + Contexto ----------
    const libMax = 6;
    let libData = null; // la lista de la Library (se pide al abrirla)
    const nombreCtx = (k) => etiquetaCtx(k, { marca: b.name, ideas, libT: chat.libT });
    function chipsHtml() {
      return html`<span class="dz-chip fijo" title="La marca: su ficha, su estrategia y su design system">${b.name}</span>${chat.etapa === 'diseno' ? html`<button type="button" class="dz-chip dz-chip-sel" data-act="formato" aria-haspopup="listbox" title="Cambiar el formato">${chat.formato} ▾</button>` : ''}${chat.hormozi ? html`<span class="dz-chip" title="Oferta, valor y demanda en cada respuesta">Hormozi<button type="button" data-act="hz-x" aria-label="Quitar el lente Hormozi">×</button></span>` : ''}
        ${chat.ctx.map((k) => html`<span class="dz-chip" title="${chat.enviados.includes(k) ? 'Ya lo leyó en esta conversación' : 'Lo lee en tu próximo mensaje'}">${nombreCtx(k)}<button type="button" data-act="ctx-x" data-k="${k}" aria-label="Quitar ${nombreCtx(k)}">×</button></span>`)}
        ${S.lamina ? html`<span class="dz-chip">${S.lamina.nombre}<button type="button" data-act="sin-lamina" aria-label="Quitar la lámina">×</button></span>` : ''}`;
    }
    function repintarCaja() { const c = $('#dz-chips', chatEl); if (c) mount(c, chipsHtml()); }
    const toggleCtx = (k) => { chat.ctx = chat.ctx.includes(k) ? chat.ctx.filter((x) => x !== k) : [...chat.ctx, k]; fijarDestino(); guardar(); repintarCaja(); paintPane(); };
    function panelCtx(anchor, vista = 'inicio', q = '') {
      document.querySelector('.dz-ctxp')?.remove();
      const box = anchor.closest('.es-box'); if (!box) return;
      const m = document.createElement('div'); m.className = 'dz-ctxp'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Agregar contexto');
      const fila = (k, ic, t, sub, extra = '') => html`<button type="button" class="dz-o ${chat.ctx.includes(k) ? 'on' : ''}" data-ck="${k}" ${raw(extra)}><span class="dz-oi">${ico(ic, 14)}</span><span class="dz-ot">${t}<small>${sub}</small></span><span class="dz-ck">${chat.ctx.includes(k) ? ico('check', 12) : ''}</span></button>`;
      const tg = (k, ic, t, sub) => html`<button type="button" class="dz-o" data-tg="${k}"><span class="dz-oi">${ico(ic, 14)}</span><span class="dz-ot">${t}<small>${sub}</small></span><span class="dz-sw ${chat[k] ? 'on' : ''}"></span></button>`;
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
        else mount(m, html`<header class="dz-ph"><b>Contexto</b><span class="mut sm">Lo que el chat lee antes de responder</span></header><div class="dz-ol">
          <button type="button" class="dz-o on" data-marca="1"><span class="dz-oi">${initials(b.name)}</span><span class="dz-ot">Cliente · ${b.name}<small>Su ficha, su estrategia, su marca y su design system · cambiar</small></span><span class="dz-n">${ico('right', 12)}</span></button>
          ${fila('refs', 'play', 'Investigación', refs.length ? `${refs.filter((x) => x.replicar).length || Math.min(8, refs.length)} posts ganadores ${refs.some((x) => x.replicar) ? 'marcados «Usar como formato»' : 'de su mercado'}` : 'Todavía no hay nada en Investigación', refs.length ? '' : 'disabled')}
          ${ir('lib', 'Documentos de la Library', 'SOPs, entrevistas, notas', nLib)}
          <button type="button" class="dz-o ${chat.hormozi ? 'on' : ''}" data-tg="hormozi"><span class="dz-oi">${ico('target', 14)}</span><span class="dz-ot">Lente Hormozi<small>Oferta, valor y demanda en cada respuesta</small></span><span class="dz-ck">${chat.hormozi ? ico('check', 12) : ''}</span></button>
          ${MESES_CTX().map((mes) => fila(`cal:${mes}`, 'cal', nombreCtx(`cal:${mes}`), `${deMes(mes)} pieza${deMes(mes) === 1 ? '' : 's'} con fecha · lo que falta diseñar`))}
          ${fila(`plan:${MESES_CTX()[0]}`, 'target', nombreCtx(`plan:${MESES_CTX()[0]}`), 'El mensaje, los pilares y la función de cada canal')}
          ${ir('ideas', 'Ideas del calendario', 'Una o varias, con su guion', nIdeas)}</div>`);
        const inp = m.querySelector('[data-q]'); if (inp) { inp.oninput = () => { q = inp.value; pinta(); const n = m.querySelector('[data-q]'); n.focus(); n.setSelectionRange(q.length, q.length); }; }
      };
      pinta(); box.append(m); ubicarPop(m, box); anchor.setAttribute('aria-expanded', 'true');
      m.addEventListener('click', async (e) => {
        const v = e.target.closest('[data-vista]'); if (v) { vista = v.dataset.vista; q = ''; if (vista === 'lib' && libData === null) { pinta(); try { libData = await api('estrategia/library'); } catch (er) { libData = { docs: [], error: er.status === 403 ? 'Tu perfil no ve la Library.' : er.message }; } } pinta(); m.querySelector('[data-q]')?.focus(); return; }
        if (e.target.closest('[data-marca]')) { m.remove(); return menuMarcas(anchor, b.slug); }
        const f = e.target.closest('[data-fmt]'); if (f) { chat.formato = f.dataset.fmt; guardar(); repintarCaja(); vista = 'inicio'; return pinta(); }
        const g = e.target.closest('[data-tg]');
        if (g) { chat.hormozi = !chat.hormozi; guardar(); repintarCaja(); return pinta(); }
        const o = e.target.closest('[data-ck]'); if (!o || o.disabled) return;
        const k = o.dataset.ck; if (k.startsWith('lib:')) { const d = libData?.docs.find((x) => `lib:${x.id}` === k); if (d) chat.libT[d.id] = d.titulo; }
        toggleCtx(k); pinta();
      });
      const cerrar = (e) => { if (!m.contains(e.target) && !e.target.closest('[data-act="ctx"]')) { m.remove(); anchor.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', cerrar); } };
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
        else if (k.startsWith('plan:')) partes.push(textoPlan({ root, mes: k.slice(5) }));
        else if (k.startsWith('idea:')) { const p = ideas.find((x) => x.id === k.slice(5)); if (p) partes.push(textoIdea(p, await guionDe(p.guion))); }
        else if (k.startsWith('lib:')) { const d = libDocs.find((x) => x.id === k.slice(4)); if (d) partes.push(`DOCUMENTO DE LA LIBRARY «${d.titulo}» (${d.tipo}${d.carpeta ? ' · ' + d.carpeta : ''}):\n${d.contenido}`); }
        else if (k === 'refs') partes.push(textoRefs(todo.filter((x) => x.kind === 'research' && x.profile === b.slug)));
      }
      return partes.filter(Boolean).join('\n\n');
    }

    function paintChat() {
      const f = fase(), ok = f === 'listo', abre = abierta(chat.etapa);
      const ph = chat.etapa === 'plan' ? 'Qué se dice este mes, y en qué canal…' : chat.etapa === 'ideas' ? 'Pide ideas para una pieza del plan…' : chat.resultado ? 'Pide un cambio, o selecciona una lámina y dile qué ajustar…' : `Qué diseñamos de ${b.name}…`;
      mount(chatEl, html`${etapaHtml()}<div class="es-msgs" id="dz-msgs" aria-live="polite"></div>
        ${!abre ? cerradaHtml(chat.etapa) : ok ? html`<div class="ch-sug" id="dz-sug">${sugHtml()}</div><div class="es-box cx"><div class="dz-chips" id="dz-chips">${chipsHtml()}</div><form class="es-form" id="dz-form"><textarea class="in" id="dz-in" rows="1" placeholder="${ph}" aria-label="Mensaje para el chat"></textarea></form>
          <div class="cx-bar"><button type="button" class="cx-plus" data-act="ctx" aria-haspopup="dialog" aria-expanded="false" aria-label="Contexto y cómo trabaja">${ico('plus', 16)}</button><span class="sp"></span>${modeloHtml()}<button class="btn es-send" type="submit" form="dz-form" aria-label="Enviar">${ico('right', 16)}</button></div></div>`
          : html`${setup(f)}<div class="es-foot"><span></span>${modeloHtml()}</div>`}`);
      paintMsgs();
      const ta = $('#dz-in', chatEl); if (ta) ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; };
    }
    const sugHtml = () => (abierta(chat.etapa) ? ayuda()[3].map((x) => html`<button type="button" data-act="${chat.etapa === 'diseno' ? 'sug' : 'rapido'}" data-t="${x}">${x}</button>`) : '');
    function paintMsgs() {
      const box = $('#dz-msgs', chatEl); if (!box) return;
      chatEl.classList.toggle('vacio', !chat.msgs.length);
      const H = ayuda();
      mount(box, chat.msgs.length ? chat.msgs.map((m, i) => msgHtml(m, i)) : html`<div class="es-hint"><b>${H[1]}</b><p>${H[2]}</p></div>`);
      box.scrollTop = box.scrollHeight;
    }
    function msgHtml(m, i) {
      if (m.r === 'u') return html`<div class="es-m u"><div class="es-b">${m.t}</div></div>`;
      const busy = m.stream, ult = i === chat.msgs.length - 1;
      return html`<div class="es-m a"><div class="es-b">${m.tools?.length ? html`<div class="dz-steps">${m.tools.slice(-6).map((t, k, xs) => html`<span class="${busy && k === xs.length - 1 ? 'now' : ''}">${ico(busy && k === xs.length - 1 ? 'spark' : 'check', 12)} ${t}</span>`)}</div>` : ''}${m.t ? md(m.t) : busy ? html`<span class="es-dots-t"><i></i><i></i><i></i></span>` : ''}
        ${m.err ? html`<p class="es-err">${m.err}</p>` : ''}${m.aplicado?.length ? html`<span class="es-upd"><i>✦</i>${m.aplicado.join(' · ')}</span>` : ''}${m.aviso ? html`<p class="mut sm">${m.aviso}</p>` : ''}${m.doc && !chat.area ? tarjetaDoc(docDe(m.doc)) : ''}
        ${m.pregunta ? html`<div class="es-q ${ult ? '' : 'hecha'}"><span class="lbl">Una pregunta antes de seguir</span><b>${m.pregunta.texto}</b>${m.pregunta.opciones.length ? html`<div class="es-opts">${m.pregunta.opciones.map((o) => html`<button type="button" data-act="opcion" data-t="${o}" ${ult ? '' : raw('disabled')}>${o}</button>`)}</div>` : ''}</div>` : ''}</div>
        ${busy && ult ? html`<div class="es-act"><button type="button" class="btn ghost xs" data-act="detener">${ico('dot', 12)} Detener</button></div>` : ''}</div>`;
    }
    const pasoDe = (d) => {
      const n = String(d.nombre || '');
      if (n.startsWith('figma:')) return ({ get_screenshot: 'Exportando las láminas', get_design_context: 'Leyendo el diseño', scan_components: 'Buscando los componentes del kit', get_variable_defs: 'Leyendo las variables', get_styles: 'Leyendo los estilos', create_instance: 'Usando una plantilla del kit', clone_node: 'Duplicando una lámina', set_text: 'Escribiendo los textos', set_fills: 'Poniendo color e imagen', import_image: 'Poniendo una foto', ping: 'Conectando con Figma', use_file: 'Abriendo el archivo de la marca', list_files: 'Buscando el archivo de la marca' })[n.slice(6)] || `Figma · ${n.slice(6).replace(/_/g, ' ')}`;
      return `${n === 'Read' ? 'Leyendo' : 'Buscando'} ${d.detalle || ''}`.trim();
    };

    async function enviar(texto) {
      texto = String(texto || '').trim(); if (!texto || enVuelo) return;
      if (fase() !== 'listo') return toast('Primero conecta tu compu', true);
      if (!abierta(chat.etapa)) return paintChat();
      const ctrl = new AbortController(); enVuelo = ctrl;
      if (chat.motor !== claveMotor(me)) { chat.sesion = null; chat.motor = claveMotor(me); }
      const primera = !chat.sesion, etapa = chat.etapa;
      if (primera) chat.vistas = [];
      const metodo = !chat.vistas.includes(etapa); // la primera vez en esta etapa, el pedido lleva el método del departamento
      chat.msgs.push({ r: 'u', t: S.lamina ? `${S.lamina.nombre} · ${texto}` : texto }); chat.msgs.push({ r: 'a', t: '', stream: true, tools: [] });
      const msg = chat.msgs[chat.msgs.length - 1], sueltas = [];
      paintMsgs();
      // El contexto: completo la primera vez; después, solo lo que se agregó (la sesión de Claude ya leyó lo demás).
      if (primera) chat.enviados = [];
      const nuevas = chat.ctx.filter((k) => !chat.enviados.includes(k));
      const contexto = nuevas.length ? await textoContexto(nuevas) : '';
      const delMes = todo.filter((x) => x.kind === 'post' && x.profile === b.slug && String(x.date || '').slice(0, 7) === chat.mes);
      const fms = etapa === 'ideas' && metodo ? await api(`formatos?profile=${encodeURIComponent(b.slug)}`).then((r) => [...(r.marca || []), ...(r.base || [])]).catch(() => []) : [];
      const prompt = etapa === 'plan' ? promptPlan({ marca: b.name, slug: b.slug, mes: chat.mes, plan: E.plan, ...(metodo ? await encargo() : {}), contexto, hormozi: chat.hormozi, pedido: texto, primera: metodo })
        : etapa === 'ideas' ? promptIdeas({ marca: b.name, slug: b.slug, mes: chat.mes, slots: E.plan?.slots || [], existentes: delMes.map((x) => x.title).filter(Boolean), investigacion: metodo ? textoRefs(todo.filter((x) => x.kind === 'research' && x.profile === b.slug)) : '', formatos: textoFormatos(fms), contexto, hormozi: chat.hormozi, pedido: texto, primera: metodo })
        : promptDiseno({ marca: b.name, slug: b.slug, formato: chat.formato, contexto: [chat.suelta ? 'PIEZA SUELTA: no sale del plan del mes; es algo puntual que pidió la persona.' : '', contexto].filter(Boolean).join('\n\n'), lamina: S.lamina, pedido: texto, primera: metodo });
      let raw0 = '', fallo = null;
      try {
        const r = await fetch(PUENTE + '/chat', { method: 'POST', credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', signal: ctrl.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: JSON.stringify({ prompt, ...(etapa === 'diseno' ? { modo: 'diseno' } : {}), ...cuerpoMotor(me), ...(chat.sesion ? { resume: chat.sesion } : {}) }) });
        if (!r.ok) { const j = await r.json().catch(() => ({})); throw Object.assign(new Error(j.error || `El puente respondió ${r.status}`), { status: r.status }); }
        const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
        for (;;) {
          const { value, done } = await rd.read(); if (done) break;
          buf += dec.decode(value, { stream: true });
          let k; while ((k = buf.indexOf('\n\n')) >= 0) {
            const bloq = buf.slice(0, k); buf = buf.slice(k + 2);
            const ev = /^event: (\w+)/m.exec(bloq)?.[1]; let d = {}; try { d = JSON.parse(/^data: (.*)$/m.exec(bloq)?.[1] || '{}'); } catch {}
            if (ev === 'inicio' && d.sesion) chat.sesion = d.sesion;
            else if (ev === 'delta') { raw0 += d.texto || ''; msg.t = sinBloqueP(sinBloqueI(sinBloque(raw0))); paintMsgs(); }
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
      if (etapa === 'plan') {
        const { texto: limpio, parche, pregunta } = leerPlan(raw0);
        msg.t = sinBloqueP(sinBloqueI(sinBloque(limpio))); if (pregunta) msg.pregunta = pregunta;
        if (Object.keys(parche).length) {
          if (!E.puede?.editar) msg.aviso = 'Tu perfil no puede cambiar el plan.';
          else { try { const x = await api(`plan/${encodeURIComponent(b.slug)}/${chat.mes}`, { method: 'PUT', body: { parche } }); E.plan = x.plan || E.plan; S.fresh = x.cambiadas || []; msg.doc = 'plan'; msg.aplicado = [`Plan del mes · ${S.fresh.map((k) => NOMBRE_P[k] || k).join(', ')} actualizado`]; } catch (er) { msg.err = `No pude guardar el plan: ${er.message}`; } }
        }
      } else if (etapa === 'ideas') {
        const { texto: limpio, ideas: nuevasI, pregunta } = leerIdeas(raw0);
        msg.t = sinBloqueP(sinBloqueI(sinBloque(limpio))); if (pregunta) msg.pregunta = pregunta;
        if (nuevasI.length) { msg.doc = 'ideas'; chat.ideasProp = [...nuevasI.map((x) => ({ ...x, mes: chat.mes })), ...chat.ideasProp.filter((x) => x.enviada)].slice(0, 40); msg.aplicado = [`${nuevasI.length} idea${nuevasI.length === 1 ? '' : 's'} a la derecha, listas para enviar a Ideas`]; }
      } else {
        const { texto: limpio, resultado, pregunta } = leerDiseno(raw0);
        msg.t = sinBloqueP(sinBloqueI(sinBloque(limpio))); if (pregunta) msg.pregunta = pregunta;
        if (resultado) {
          msg.doc = 'diseno';
          resultado.laminas.forEach((l, k) => { if (!img(l.id) && sueltas[k]) IMGS.set(`${b.slug}|${l.id}`, sueltas[k]); });
          chat.resultado = { ...resultado, guardado: null }; S.lamina = null;
        }
      }
      guardar();
      if (!alive()) return;
      if (fase() !== 'listo') return paintChat();
      paintMsgs(); paintPane(); repintarCaja(); $('#dz-in', chatEl)?.focus();
    }
    // El encargo de Marketing: la estrategia del OS y lo que funciona (Investigación). Si el perfil no ve Estrategia, se lee del repo.
    async function encargo() {
      let estrategia = '';
      try { const e = await api(`estrategia/${encodeURIComponent(b.slug)}`), v = e.viva || {}; estrategia = JSON.stringify({ nivel: e.nivel?.nombre, etapa: e.etapa?.n, aprobada: e.vivaAprobada, meta: v.meta, contexto: v.contexto?.conclusion, analisis: v.analisis, inversa: v.inversa, contenido: v.contenido, pauta: v.pauta, riesgos: v.riesgos, metodologia: v.metodologia, roadmap: v.roadmap }, (k, x) => (x === undefined || x === null || x === '' ? undefined : x)); } catch { /* la lee del repo */ }
      return { estrategia, investigacion: textoRefs(todo.filter((x) => x.kind === 'research' && x.profile === b.slug)) };
    }

    // ---------- Las piezas ----------
    function paintPane() {
      ponerArea();
      paneEl.className = chat.etapa === 'diseno' ? 'dz-pane' : 'pm-pane dg-pane';
      if (chat.etapa === 'plan') {
        mount(paneEl, planPanel({ b, mes: chat.mes, plan: E.plan || {}, piezas: E.piezas, edit: E.puede?.editar && abierta('plan'), fresh: S.fresh, pasando: S.pasando, cerrar: true, abrir: [`#/marcas/${b.slug}/plan/${chat.mes}`, 'Abrir en Plan del mes'] }));
        if (S.fresh.length) setTimeout(() => { S.fresh = []; $$('.ev-sec.fresh', paneEl).forEach((x) => x.classList.remove('fresh')); }, 4000);
        return;
      }
      if (chat.etapa === 'ideas') return mount(paneEl, ideasPanel());
      const docD = (cuerpo, extra = {}) => mount(paneEl, docHtml({ ...docDe('diseno'), sub: `${b.name} · ⑥A Diseño gráfico`, cerrar: true, acciones: html`<a class="btn ghost xs" href="#/marcas/${b.slug}/design">${ico('layers', 12)} Design system</a>`, cuerpo, ...extra }));
      if (!abierta('diseno')) return docD(html`<div class="dz-empty"><span class="es-hint-i">${ico('lock', 22)}</span><b>Todavía no hay qué diseñar</b><p class="mut">Se diseña lo que Creatividad ya ideó para el plan de ${nombreMes(chat.mes)}.</p></div>`, { estado: 'Cerrado' });
      const r = chat.resultado;
      if (!r) {
        docD(html`<div class="dz-empty"><span class="es-hint-i">${ico('layers', 22)}</span><b>Aquí aparecen las piezas</b><p class="mut">Claude las arma en Figma con el design system de ${b.name} y las revisa contra su guía antes de mostrártelas.</p>
          ${sis?.colores.length ? html`<div class="dz-pal">${sis.colores.map((c) => html`<span title="${c.nombre} · ${c.hex}" style="background:${c.hex}"></span>`)}</div>` : ''}</div>`, { estado: 'Vacío' });
        return;
      }
      const faltan = r.laminas.filter((l) => !img(l.id)).length;
      const malas = r.revision.filter((x) => !x.ok);
      docD(html`${r.revision.length ? html`<div class="dz-rev">${r.revision.map((x) => html`<span class="${x.ok ? 'ok' : 'am'}">${x.texto}</span>`)}</div>` : ''}
        <div class="dz-grid ${/story/i.test(r.formato || chat.formato) ? 'st' : ''}">${r.laminas.map((l) => html`<button type="button" class="dz-fr ${S.lamina?.id === l.id ? 'sel' : ''}" data-act="lamina" data-id="${l.id}" title="Seleccionar para pedir un cambio">
          <span class="dz-im">${img(l.id) ? html`<img alt="${l.nombre}" src="${img(l.id)}">` : html`<span class="mut sm">Sin vista previa</span>`}</span><span class="dz-cap"><b>${l.nombre}</b></span></button>`)}</div>
        ${faltan ? html`<p class="mut sm" style="margin:0">${faltan === r.laminas.length ? 'Las vistas previas no se guardan al recargar.' : `Faltan ${faltan} vistas previas.`} <button type="button" class="linkish" data-act="reexportar">Pedirlas otra vez</button></p>` : ''}`, { titulo: r.titulo || 'Sin título', sub: `${r.formato || chat.formato} · ${r.laminas.length} lámina${r.laminas.length === 1 ? '' : 's'} · ⑥A Diseño gráfico`, estado: r.guardado ? 'Guardado' : 'Borrador', ok: Boolean(r.guardado),
        acciones: html`${r.figma ? html`<a class="btn ghost xs" href="${r.figma}" target="_blank" rel="noopener">${ico('link', 12)} Abrir en Figma</a>` : ''}${faltan < r.laminas.length ? html`<button class="btn ghost xs" data-act="bajar">${ico('down', 12)} PNG</button>` : ''}`,
        pie: { texto: '', accion: html`${r.guardado ? html`<span>Guardado ${raw('&middot;')} queda <b>Listo</b> en el Calendario de ${b.name}.</span><span class="sp"></span><a class="btn xs" href="#/marcas/${b.slug}/calendario">Ir al Calendario</a>`
          : html`<span>${malas.length ? `Antes de guardar, revisa: ${malas.map((x) => x.texto).join(' · ')}. ` : ''}Se guarda en ${idea() ? `la idea «${idea().title}»` : ideasCtx().length > 1 ? 'la idea que elijas del contexto' : 'una pieza nueva del calendario'}: queda <b>Lista</b> para programarla y publicarla.</span><span class="sp"></span><button class="btn" data-act="guardar" ${S.guardando ? raw('disabled') : ''}>${S.guardando ? 'Guardando…' : 'Guardar en contenido'}</button>`}` } });
    }

    // El área de trabajo de Ideas: lo que propuso Creatividad (por enviar) y lo que ya está en las piezas del plan.
    function ideasPanel() {
      const delPlan = todo.filter((x) => x.kind === 'post' && x.slot?.plan === `${b.slug}--${chat.mes}`);
      const prop = chat.ideasProp.filter((x) => (x.mes || chat.mes) === chat.mes), porEnviar = prop.filter((x) => !x.enviada && E.plan?.slots?.some((y) => y.id === x.slot));
      const slotDe = (id) => E.plan?.slots?.find((x) => x.id === id);
      // El referente: si es un post de Investigación, se ve con su cuenta y cuánto rinde (×N su promedio).
      const refDe = (rf) => { const p = todo.find((r) => r.kind === 'research' && r.profile === b.slug && r.url && (rf.includes(r.url) || r.url.includes(rf))), n = +p?.x;
        return p ? html`<a class="pm-tag g" href="${p.url}" target="_blank" rel="noopener">@${p.handle || 'referente'}${n ? ` · ×${+n.toFixed(1)}` : ''} ↗</a>` : link(rf); };
      const link = (rf) => (/^https?:\/\//.test(rf) ? html`<a class="pm-tag" href="${rf}" target="_blank" rel="noopener">${rf.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)} ↗</a>` : rf ? html`<span class="pm-tag">${rf}</span>` : '');
      return docHtml({ ...docDe('ideas'), sub: b.name, estado: prop.length ? `${prop.length} en la mesa` : 'Vacío', cerrar: true,
        acciones: html`<a class="btn ghost xs" href="#/marcas/${b.slug}/ideas">${ico('link', 12)} Abrir en Ideas</a>`,
        cuerpo: html`
          ${prop.length ? html`<div class="dg-ideas">${prop.map((x, i) => { const sl = slotDe(x.slot); return html`<article class="dg-idea ${x.enviada ? 'ok' : ''}"><div class="row" style="gap:6px;flex-wrap:wrap"><span class="pm-tag">${x.slot}</span>${sl ? html`<span class="mut sm">Semana ${sl.semana} · ${sl.canal} · ${sl.funcion || ''}</span>` : html`<span class="pm-warn">Ese slot no está en el plan</span>`}<span class="sp"></span>${x.enviada ? html`<span class="ev-ok">${ico('check', 12)} En Ideas</span>` : E.puede?.editar && sl && abierta('ideas') ? html`<button class="btn ghost xs" data-act="idea-enviar" data-i="${chat.ideasProp.indexOf(x)}">Enviar a Ideas</button>` : ''}</div>
              <h3>${x.titulo}</h3>${x.hook ? html`<p class="dg-hook">«${x.hook}»</p>` : ''}
              <dl class="dg-tri"><div><dt>Qué comunicamos</dt><dd>${x.mensaje || sl?.objetivo || html`<span class="mut">Sin mensaje</span>`}</dd></div>
                <div><dt>El formato que ya funciona</dt><dd>${x.referente ? html`${refDe(x.referente)}${x.por_que ? html`<span class="mut sm">${x.por_que}</span>` : ''}` : html`<span class="pm-warn">${ico('alert', 12)} Sin formato de referencia. Pídele uno de Investigación.</span>`}</dd></div>
                <div><dt>Cómo se adapta</dt><dd>${x.adaptacion || html`<span class="mut">Falta la adaptación</span>`}</dd></div></dl>
              <div class="row" style="gap:6px;flex-wrap:wrap">${x.formato ? html`<span class="pm-tag">${x.formato}</span>` : ''}${sl?.traza ? html`<span class="pm-tag g">Traza a la estrategia: ${sl.traza}</span>` : ''}</div></article>`; })}</div>`
          : html`<p class="ev-vacio">Pídele al chat ideas para los slots del plan. Cada una llega con qué comunicamos, el formato que ya funciona (un post ganador de Investigación) y cómo se adapta. Las que te gusten se envían a Ideas.</p>`}
          <section class="ev-sec"><header><b>En las piezas del plan</b><span class="mut sm">${delPlan.filter((x) => x.idea_chat).length} de ${delPlan.length} slots con idea</span></header>
            ${delPlan.length ? html`<div class="pm-tbl"><table><thead><tr><th>Slot</th><th>Pieza</th><th>Estado</th></tr></thead><tbody>${delPlan.sort((a, z) => String(a.slot?.id).localeCompare(String(z.slot?.id))).map((x) => html`<tr><td>${x.slot?.id}</td><td>${x.title}${x.idea_chat ? '' : html` <span class="mut sm">· sin idea todavía</span>`}</td><td>${estadoDe(x)}</td></tr>`)}</tbody></table></div>` : html`<p class="ev-vacio">El plan todavía no pasó a Creatividad.</p>`}</section>`,
        pie: { texto: 'Las ideas enviadas quedan en la pieza de su slot. Ahí se eligen, se ordenan y pasan a Guiones.',
          accion: porEnviar.length && E.puede?.editar && abierta('ideas') ? html`<button class="btn" data-act="ideas-enviar" ${S.enviando ? raw('disabled') : ''}>${S.enviando ? 'Enviando…' : `Enviar ${porEnviar.length} a Ideas`} ${ico('right', 13)}</button>` : '' } });
    }
    async function enviarIdeas(lista) {
      if (!lista.length || S.enviando) return;
      S.enviando = true; paintPane();
      try {
        const x = await api(`plan/${encodeURIComponent(b.slug)}/${chat.mes}/ideas`, { method: 'POST', body: { ideas: lista } });
        for (const i of lista) if (!x.faltan.includes(i.slot)) i.enviada = true;
        toast(`${x.puestas} idea${x.puestas === 1 ? '' : 's'} en Ideas${x.faltan.length ? ` · ${x.faltan.length} sin slot en el plan` : ''}`);
        [todo, E] = await Promise.all([col('content').list().catch(() => todo), cargarEstado()]);
        guardar();
      } catch (e) { toast(e.message, true); }
      S.enviando = false; if (alive()) { paintChat(); paintPane(); }
    }
    async function cambiarMes(mes) { chat.mes = mes; guardar(); E = await cargarEstado(); if (!alive()) return; if (!abierta(chat.etapa) && !chat.suelta) chat.etapa = ETAPAS.map(([k]) => k).find(abierta) || 'plan'; paintChat(); paintPane(); }
    async function guardarEnContenido() {
      const r = chat.resultado; if (!r || S.guardando) return;
      let post = idea();
      const varias = ideasCtx();
      if (!post && varias.length > 1) {
        const v = await ask('¿En qué idea del calendario se guarda?', [{ k: 'id', l: 'Idea', t: 'select', opts: [...varias.map((p) => [p.id, `${p.title}${p.date ? ` · ${p.date.slice(8, 10)}/${p.date.slice(5, 7)}` : ''}`]), ['', 'Una pieza nueva']] }], 'Guardar');
        if (!v) return; post = varias.find((p) => p.id === v.id) || null;
      } else if (!post && !(await confirmAsk(`No hay una idea del calendario en el contexto. ¿Creo una pieza nueva «${r.titulo || 'Sin título'}» en ${b.name}?`))) return;
      S.guardando = true; paintPane();
      try {
        if (!post) post = await col('content').create({ kind: 'post', profile: b.slug, title: r.titulo || 'Sin título', format: ['Carrusel', 'Estático', 'Story'].includes(r.formato) ? r.formato : chat.formato === 'Plantilla' ? 'Estático' : chat.formato, status: 'Idea' });
        const subidas = [];
        if (me.google?.drive) {
          for (const [k, l] of r.laminas.entries()) {
            const u = img(l.id); if (!u) { subidas.push(null); continue; }
            const [, tipo, datos] = /^data:([^;]+);base64,(.*)$/.exec(u) || [];
            const ext = tipo === 'image/jpeg' ? 'jpg' : 'png';
            const f = new File([bytesDe(datos)], `${l.nombre}.${ext}`, { type: tipo });
            toast(`Subiendo a Drive ${k + 1} de ${r.laminas.length}…`);
            const d = await uploadToDrive(f, `${b.name} · ${r.titulo || post.title} · ${l.nombre}.${ext}`, () => {}, { client: b.slug, sub: '04 Por postear' });
            subidas.push({ drive_id: d.id, url: d.link || d.webViewLink || '' });
          }
        }
        const cur = await col('content').get(post.id).catch(() => post);
        const sv = await col('content').save(piezaLista(cur, r, subidas));
        if (!ideas.some((x) => x.id === sv.id)) ideas.push(sv);
        chat.ideaId = sv.id; if (!chat.ctx.includes(`idea:${sv.id}`)) chat.ctx = [...chat.ctx, `idea:${sv.id}`]; chat.resultado = { ...r, guardado: { id: sv.id, at: new Date().toISOString() } }; guardar();
        toast(me.google?.drive ? 'Guardado: quedó Listo en el Calendario' : 'Guardado con el link de Figma. Conecta tu Google para subir también las láminas a Drive.');
      } catch (e) { toast(e.message, true); }
      S.guardando = false; if (alive()) paintPane();
    }
    function bajar() {
      for (const l of chat.resultado?.laminas || []) { const u = img(l.id); if (!u) continue; const a = document.createElement('a'); a.href = u; a.download = `${b.name} - ${l.nombre}.png`; document.body.append(a); a.click(); a.remove(); }
    }

    // ---------- Clics ----------
    root.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-act]'); if (!t || !root.contains(t)) return;
      const a = t.dataset.act;
      if (a === 'copiar') { try { await navigator.clipboard.writeText(t.dataset.t); toast('Copiado'); } catch { toast('Selecciona el texto y cópialo', true); } return; }
      if (a === 'marca') return menuMarcas(t, b.slug);
      if (a === 'motor') return menuMotor(t, me, S.salud?.chat, () => paintChat(), { diseno: true });
      if (a === 'panel-tg' || a === 'panel-x' || a === 'panel-abrir') { chat.area = a === 'panel-tg' ? !chat.area : a === 'panel-abrir'; guardar(); ponerArea(); const tg = $('[data-act="panel-tg"]', chatEl); if (tg) { tg.classList.toggle('on', chat.area); tg.setAttribute('aria-pressed', String(chat.area)); } paintMsgs(); return; }
      if (a === 'marca-cambiar') return menuMarcas(t, b.slug);
      if (a === 'etapa') { chat.etapa = t.dataset.e; if (chat.etapa !== 'diseno') S.lamina = null; guardar(); paintChat(); paintPane(); return; }
      if (a === 'mesdg') return menuDz(t, mesesPlan().map((x, i) => ({ label: nombreMes(x).replace(/^./, (c) => c.toUpperCase()), sub: ['El anterior', 'Este mes', 'El siguiente'][i], on: x === chat.mes, pick: () => cambiarMes(x) })));
      if (a === 'suelta') { chat.suelta = !chat.suelta; chat.etapa = chat.suelta ? 'diseno' : ETAPAS.map(([k]) => k).find(abierta) || 'plan'; guardar(); paintChat(); paintPane(); return; }
      if (a === 'rapido') return enviar(t.dataset.t);
      if (a === 'pasar') { S.pasando = true; paintPane(); const n = await pasarPlan(b, chat.mes, E.plan || {}); S.pasando = false; if (n != null) { E = await cargarEstado(); todo = await col('content').list().catch(() => todo); } if (alive()) { paintChat(); paintPane(); } return; }
      if (a === 'ideas-enviar') return enviarIdeas(chat.ideasProp.filter((x) => !x.enviada && (x.mes || chat.mes) === chat.mes && E.plan?.slots?.some((y) => y.id === x.slot)));
      if (a === 'idea-enviar') { const x = chat.ideasProp[+t.dataset.i]; return x ? enviarIdeas([x]) : null; }
      if (a === 'ctx') return document.querySelector('.dz-ctxp') ? (document.querySelector('.dz-ctxp').remove(), t.setAttribute('aria-expanded', 'false')) : panelCtx(t);
      if (a === 'ctx-x') return toggleCtx(t.dataset.k);
      if (a === 'hz-x') { chat.hormozi = false; guardar(); return repintarCaja(); }
      if (a === 'formato') return menuDz(t, FORMATOS.map(([f, dsc]) => ({ label: f, sub: dsc, on: chat.formato === f, pick: () => { chat.formato = f; guardar(); repintarCaja(); } })));
      if (a === 'sin-lamina') { S.lamina = null; repintarCaja(); paintPane(); return; }
      if (a === 'lamina') { const l = chat.resultado?.laminas.find((x) => x.id === t.dataset.id); S.lamina = S.lamina?.id === l?.id ? null : l; paintPane(); repintarCaja(); $('#dz-in', chatEl)?.focus(); return; }
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

    if (!abierta(chat.etapa) && !chat.suelta) chat.etapa = ETAPAS.map(([k]) => k).find(abierta) || chat.etapa;
    divisor(root, chatEl, { key: 'diseno' });
    paintChat(); paintPane(); salud().then(() => { if (alive()) paintChat(); });
  }
}
