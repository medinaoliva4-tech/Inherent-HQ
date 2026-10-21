// Marcas › Diseño: el chat de Diseño. Como Estrategia: al entrar se elige la marca en la caja; después, a la izquierda el chat
// (con preguntas puntuales) y a la derecha las piezas que Claude armó en Figma. «Guardar en contenido» sube las láminas al
// Drive de la marca y deja la idea del planner en «Listo», para programarla y publicarla.
// Corre con el Claude de tu compu por el puente de Laya (modo «diseno»: el repo en solo lectura + Figma con figwright).
// Rutas: #/marcas/diseno · #/marcas/diseno/<marca>
import { html, raw, mount, api, col, toast, ico, md, initials, confirmAsk, ask, uploadToDrive, $, $$ } from './core.js';
import { PUENTE, INSTALAR_MAC, INSTALAR_WIN, sistemaDe } from './laya.js';
import { chromeBloquea, PASOS_COPIA_VIEJA, sesionVencida, PASOS_LOGIN } from './puente-chat.js';
import { FORMATOS, SUGERENCIAS, promptDiseno, leerDiseno, sinBloque, piezaLista, bytesDe, MESES_CTX, etiquetaCtx, textoCalendario, textoPlan, textoIdea, textoRefs, carpetaDe } from './diseno.js';
import { leerSistema } from './sistema-visual.js';
import { estadoDe } from './element.js';

const IMGS = new Map(); // `${marca}|${nodo}` → data URL (solo en memoria: pesan)
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
    mount(el, html`<div class="es-start dz-start"><h1>¿Qué diseñamos hoy?</h1><p class="mut">Elige la marca. Claude diseña en Figma con su design system y te devuelve las piezas.</p>
      <div class="es-box es-box-start"><div class="es-form"><textarea class="in" rows="1" placeholder="Elige una marca para escribir…" disabled aria-label="Pedido para Diseño"></textarea><button class="btn es-send" type="button" disabled aria-label="Enviar">${ico('right', 16)}</button></div>
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
    const chat = (() => { const base = { msgs: [], sesion: null, formato: 'Carrusel', ideaId: '', resultado: null, ctx: [], libT: {}, enviados: [] }; try { const j = JSON.parse(localStorage.getItem(key) || 'null'); if (j && Array.isArray(j.msgs)) return { ...base, ...j, ctx: Array.isArray(j.ctx) ? j.ctx : j.ideaId ? [`idea:${j.ideaId}`] : [], enviados: Array.isArray(j.enviados) ? j.enviados : [] }; } catch {} return base; })();
    const guardar = () => { try { localStorage.setItem(key, JSON.stringify({ msgs: chat.msgs.slice(-30).map(({ r, t, err, pregunta }) => ({ r, t, ...(err ? { err } : {}), ...(pregunta ? { pregunta } : {}) })), sesion: chat.sesion, formato: chat.formato, ideaId: chat.ideaId, resultado: chat.resultado, ctx: chat.ctx, libT: chat.libT, enviados: chat.enviados })); } catch {} };
    const tok = () => { try { return localStorage.getItem(`os.estrategia.token.${me.email}`) || ''; } catch { return ''; } };
    const setTok = (t) => { try { if (t) localStorage.setItem(`os.estrategia.token.${me.email}`, t); else localStorage.removeItem(`os.estrategia.token.${me.email}`); } catch {} };
    const [sisD, todo] = await Promise.all([api(`repo/client/${encodeURIComponent(b.slug)}/sistema`).catch(() => ({ md: '' })), col('content').list().catch(() => [])]);
    if (!alive()) return;
    const sis = sisD.md ? leerSistema(sisD.md) : null;
    const ideas = todo.filter((p) => p.kind === 'post' && p.profile === b.slug && !['Publicado', 'Archivado'].includes(estadoDe(p))).sort((a, z) => String(a.date || '9').localeCompare(String(z.date || '9')));
    const S = { salud: null, pareo: '', lamina: null, guardando: false };
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
      if (!sis) return 'sin-sistema';
      const s = S.salud; if (!s) return 'cargando';
      if (!s.on) return 'apagado';
      if (!s.chat || !(s.chat.modos || []).includes('diseno')) return 'viejo';
      if (s.chat.ayuda) return s.chat.ayuda;
      if (!tok()) return 'sin-token';
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
      if (f === 'sin_claude') return html`<div class="es-setup"><b>No encuentro Claude Code</b><p>Instálalo e inicia sesión con tu cuenta (comando <code>claude</code>). Luego vuelve aquí.</p>${otra}</div>`;
      if (['bajando_repo', 'sin_github', 'repo_error', 'sin_repo', 'repo_invalido'].includes(f)) return html`<div class="es-setup"><b>El puente está preparando el repo</b><p>${S.salud?.chat?.error_repo || 'Si en un minuto sigue igual, corre otra vez el comando de instalar.'}</p>${cmd(inst)}${otra}</div>`;
      return html`<div class="es-setup"><b>Empareja tu compu (una sola vez)</b><p>Es el mismo token del chat de Estrategia. Para verlo:</p>${cmd(sistemaDe(navigator.userAgent || '') === 'win' ? 'Get-Content "$HOME\\.inherent\\laya\\chat-token"' : 'cat ~/.inherent/laya/chat-token')}
        <form class="es-pair" data-act="pair"><input class="in" name="t" type="password" autocomplete="off" spellcheck="false" placeholder="Pega el token" aria-label="Token del puente"><button class="btn xs" type="submit">Emparejar</button></form>${S.pareo ? html`<p class="es-err">${S.pareo}</p>` : ''}</div>`;
    }

    // ---------- El chat ----------
    function pickers() {
      return html`<button type="button" class="es-pick dz-ctxb ${chat.ctx.length ? '' : 'need'}" data-act="ctx" aria-haspopup="dialog" aria-expanded="false">${ico('plus', 12)} Contexto</button>
        <button type="button" class="es-pick" data-act="marca" aria-haspopup="listbox" title="Cambiar de marca"><i>${initials(b.name)}</i>${b.name} ▾</button>
        <a class="es-pick" href="#/marcas/${b.slug}/design" title="Abrir el Design system">${ico('layers', 12)} Design system${sisD.kit ? ' · Kit de redes' : ''}</a>
        <button type="button" class="es-pick" data-act="formato" aria-haspopup="listbox">${chat.formato} ▾</button>
        ${S.lamina ? html`<span class="es-pick on">${S.lamina.nombre}<button type="button" class="dz-x" data-act="sin-lamina" aria-label="Quitar la lámina">×</button></span>` : ''}`;
    }
    // ---------- + Contexto ----------
    const libMax = 6;
    let libData = null; // la lista de la Library (se pide al abrirla)
    const nombreCtx = (k) => etiquetaCtx(k, { marca: b.name, ideas, libT: chat.libT });
    function chipsHtml() { return chat.ctx.length ? chat.ctx.map((k) => html`<span class="dz-chip" title="${chat.enviados.includes(k) ? 'Claude ya lo leyó en esta conversación' : 'Claude lo lee en tu próximo mensaje'}">${nombreCtx(k)}<button type="button" data-act="ctx-x" data-k="${k}" aria-label="Quitar ${nombreCtx(k)}">×</button></span>`) : ''; }
    function repintarCaja() { const c = $('#dz-chips', chatEl); if (c) mount(c, chipsHtml()); const pk = $('.dz-picks', chatEl); if (pk) mount(pk, pickers()); }
    const toggleCtx = (k) => { chat.ctx = chat.ctx.includes(k) ? chat.ctx.filter((x) => x !== k) : [...chat.ctx, k]; fijarDestino(); guardar(); repintarCaja(); paintPane(); };
    function panelCtx(anchor, vista = 'inicio', q = '') {
      document.querySelector('.dz-ctxp')?.remove();
      const box = anchor.closest('.es-box'); if (!box) return;
      const m = document.createElement('div'); m.className = 'dz-ctxp'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Agregar contexto');
      const fila = (k, ic, t, sub, extra = '') => html`<button type="button" class="dz-o ${chat.ctx.includes(k) ? 'on' : ''}" data-ck="${k}" ${raw(extra)}><span class="dz-oi">${ico(ic, 14)}</span><span class="dz-ot">${t}<small>${sub}</small></span><span class="dz-ck">${chat.ctx.includes(k) ? ico('check', 12) : ''}</span></button>`;
      const ir = (v, t, sub, n) => html`<button type="button" class="dz-o" data-vista="${v}"><span class="dz-oi">${ico(v === 'ideas' ? 'bulb' : 'doc', 14)}</span><span class="dz-ot">${t}<small>${sub}</small></span><span class="dz-n">${n ? html`${n} ${ico('right', 12)}` : ico('right', 12)}</span></button>`;
      const pinta = () => {
        const deMes = (mes) => ideas.filter((p) => String(p.date || '').slice(0, 7) === mes).length;
        const nIdeas = chat.ctx.filter((k) => k.startsWith('idea:')).length, nLib = chat.ctx.filter((k) => k.startsWith('lib:')).length;
        const refs = todo.filter((x) => x.kind === 'research' && x.profile === b.slug);
        if (vista === 'ideas') { const l = ideas.filter((p) => !q || String(p.title || '').toLowerCase().includes(q.toLowerCase())); mount(m, html`<header class="dz-ph"><button type="button" class="dz-back" data-vista="inicio" aria-label="Volver">${ico('arrow-left', 14)}</button><b>Ideas del calendario</b><span class="mut sm">Elige una o varias</span></header><input class="in" data-q placeholder="Buscar idea…" value="${q}">
          <div class="dz-ol">${l.length ? l.map((p) => fila(`idea:${p.id}`, 'bulb', p.title || 'Sin título', [p.format, p.date ? p.date.slice(8, 10) + '/' + p.date.slice(5, 7) : 'sin fecha', estadoDe(p)].filter(Boolean).join(' · '))) : html`<p class="mut sm" style="padding:8px 10px;margin:0">No hay ideas abiertas de ${b.name}.</p>`}</div>`); }
        else if (vista === 'lib') { const docs = (libData?.docs || []).filter((d) => !q || `${d.titulo} ${d.carpeta}`.toLowerCase().includes(q.toLowerCase())); mount(m, html`<header class="dz-ph"><button type="button" class="dz-back" data-vista="inicio" aria-label="Volver">${ico('arrow-left', 14)}</button><b>Library</b><span class="mut sm">${nLib} de ${libMax}</span></header><input class="in" data-q placeholder="Buscar documento…" value="${q}">
          <div class="dz-ol">${libData === null ? html`<p class="mut sm" style="padding:8px 10px;margin:0">Cargando la Library…</p>` : libData.error ? html`<p class="es-err" style="padding:8px 10px;margin:0">${libData.error}</p>` : docs.length ? docs.slice(0, 60).map((d) => fila(`lib:${d.id}`, 'doc', d.titulo, [d.tipo, d.carpeta].filter(Boolean).join(' · '), !chat.ctx.includes(`lib:${d.id}`) && nLib >= libMax ? 'disabled' : '')) : html`<p class="mut sm" style="padding:8px 10px;margin:0">Nada coincide.</p>`}</div>`); }
        else mount(m, html`<header class="dz-ph"><b>Agregar contexto</b><span class="mut sm">Lo que Claude lee antes de diseñar</span></header><div class="dz-ol">
          ${MESES_CTX().map((mes) => fila(`cal:${mes}`, 'cal', nombreCtx(`cal:${mes}`), `${deMes(mes)} pieza${deMes(mes) === 1 ? '' : 's'} con fecha · lo que falta diseñar, con su slot`))}
          ${fila(`plan:${MESES_CTX()[0]}`, 'target', nombreCtx(`plan:${MESES_CTX()[0]}`), 'El mensaje, los pilares y la función de cada canal (del repo)')}
          ${ir('ideas', 'Ideas del calendario', 'Una o varias, con su guion', nIdeas)}
          ${ir('lib', 'Un documento de la Library', 'SOPs, entrevistas, notas', nLib)}
          ${fila('refs', 'play', 'Referentes de Investigación', refs.length ? `${refs.filter((x) => x.replicar).length || Math.min(8, refs.length)} referentes ${refs.some((x) => x.replicar) ? 'marcados «Usar como formato»' : 'con más vistas'}` : 'Todavía no hay nada en Investigación', refs.length ? '' : 'disabled')}</div>`);
        const inp = m.querySelector('[data-q]'); if (inp) { inp.oninput = () => { q = inp.value; pinta(); const n = m.querySelector('[data-q]'); n.focus(); n.setSelectionRange(q.length, q.length); }; }
      };
      pinta(); box.append(m); anchor.setAttribute('aria-expanded', 'true');
      m.addEventListener('click', async (e) => {
        const v = e.target.closest('[data-vista]'); if (v) { vista = v.dataset.vista; q = ''; if (vista === 'lib' && libData === null) { pinta(); try { libData = await api('estrategia/library'); } catch (er) { libData = { docs: [], error: er.status === 403 ? 'Tu perfil no ve la Library.' : er.message }; } } pinta(); m.querySelector('[data-q]')?.focus(); return; }
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
      const f = fase(), ok = f === 'listo';
      const pill = html`<span class="es-pill ${ok ? 'on' : ''}"><i></i>${ok ? 'Figma en tu compu' : f === 'cargando' ? '…' : f === 'sin-sistema' ? 'Sin sistema visual' : 'Sin conectar'}</span>`;
      mount(chatEl, html`<div class="es-msgs" id="dz-msgs" aria-live="polite"></div>
        ${ok ? html`<div class="es-box"><div class="dz-chips" id="dz-chips">${chipsHtml()}</div><form class="es-form" id="dz-form"><textarea class="in" id="dz-in" rows="1" placeholder="${chat.resultado ? 'Pide un cambio, o selecciona una lámina y dile qué ajustar…' : `Qué diseñamos de ${b.name}…`}" aria-label="Pedido para Diseño"></textarea><button class="btn es-send" type="submit" aria-label="Enviar">${ico('right', 16)}</button></form>
          <div class="es-foot"><div class="dz-picks">${pickers()}</div>${pill}</div></div>` : html`${setup(f)}<div class="es-foot">${pill}</div>`}`);
      paintMsgs();
      const ta = $('#dz-in', chatEl); if (ta) ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; };
    }
    function paintMsgs() {
      const box = $('#dz-msgs', chatEl); if (!box) return;
      chatEl.classList.toggle('vacio', !chat.msgs.length);
      mount(box, chat.msgs.length ? chat.msgs.map((m, i) => msgHtml(m, i)) : html`<div class="es-hint"><span class="es-hint-i">${ico('edit', 22)}</span><b>¿Qué diseñamos de ${b.name}?</b><p>Elige el formato y, si ya existe, la idea del planner. Claude lee su guion, el design system y el kit de redes, y diseña en Figma.</p>
        <div class="dz-sug">${SUGERENCIAS.map((s) => html`<button type="button" data-act="sug" data-t="${s}">${s}</button>`)}</div></div>`);
      box.scrollTop = box.scrollHeight;
    }
    function msgHtml(m, i) {
      if (m.r === 'u') return html`<div class="es-m u"><div class="es-b">${m.t}</div></div>`;
      const busy = m.stream, ult = i === chat.msgs.length - 1;
      return html`<div class="es-m a"><div class="es-b">${m.tools?.length ? html`<div class="dz-steps">${m.tools.slice(-6).map((t, k, xs) => html`<span class="${busy && k === xs.length - 1 ? 'now' : ''}">${ico(busy && k === xs.length - 1 ? 'spark' : 'check', 12)} ${t}</span>`)}</div>` : ''}${m.t ? md(m.t) : busy ? html`<span class="es-dots-t"><i></i><i></i><i></i></span>` : ''}
        ${m.err ? html`<p class="es-err">${m.err}</p>` : ''}
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
      const ctrl = new AbortController(); enVuelo = ctrl;
      const primera = !chat.sesion;
      chat.msgs.push({ r: 'u', t: S.lamina ? `${S.lamina.nombre} · ${texto}` : texto }); chat.msgs.push({ r: 'a', t: '', stream: true, tools: [] });
      const msg = chat.msgs[chat.msgs.length - 1], sueltas = [];
      paintMsgs();
      // El contexto: completo la primera vez; después, solo lo que se agregó (la sesión de Claude ya leyó lo demás).
      if (primera) chat.enviados = [];
      const nuevas = chat.ctx.filter((k) => !chat.enviados.includes(k));
      const contexto = nuevas.length ? await textoContexto(nuevas) : '';
      const prompt = promptDiseno({ marca: b.name, slug: b.slug, formato: chat.formato, contexto, lamina: S.lamina, pedido: texto, primera });
      let raw0 = '', fallo = null;
      try {
        const r = await fetch(PUENTE + '/chat', { method: 'POST', credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', signal: ctrl.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: JSON.stringify({ prompt, modo: 'diseno', ...(chat.sesion ? { resume: chat.sesion } : {}) }) });
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
        if (!fallo) chat.enviados = [...new Set([...chat.enviados, ...nuevas])];
        if (fallo) { if (!primera && /session|conversation|resume/i.test(fallo.error || '')) { chat.sesion = null; chat.enviados = []; } msg.err = sesionVencida(fallo.error) ? PASOS_LOGIN : fallo.error || 'Claude no pudo responder'; }
      } catch (e) {
        if (e.name === 'AbortError') msg.err = 'Interrumpido.';
        else if (e.status === 401) { setTok(''); S.pareo = 'Ese token ya no sirve. Pega el actual.'; msg.err = 'El puente no reconoció tu token.'; }
        else msg.err = chromeBloquea() ? PASOS_COPIA_VIEJA : sesionVencida(e.message) ? PASOS_LOGIN : e.message && e.message !== 'Failed to fetch' ? e.message : 'No pude hablar con el puente. ¿Sigue encendido?';
        if (e.status === 401 || e.status === 412) await salud();
      } finally { enVuelo = null; msg.stream = false; }
      const { texto: limpio, resultado, pregunta } = leerDiseno(raw0);
      msg.t = limpio; if (pregunta) msg.pregunta = pregunta;
      if (resultado) {
        resultado.laminas.forEach((l, k) => { if (!img(l.id) && sueltas[k]) IMGS.set(`${b.slug}|${l.id}`, sueltas[k]); });
        chat.resultado = { ...resultado, guardado: null }; S.lamina = null;
      }
      guardar();
      if (!alive()) return;
      if (fase() !== 'listo') return paintChat();
      paintMsgs(); paintPane(); $('#dz-in', chatEl)?.focus();
      if (msg.err) return;
      const pk = $('.dz-picks', chatEl); if (pk) mount(pk, pickers());
    }

    // ---------- Las piezas ----------
    function paintPane() {
      const r = chat.resultado;
      if (!r) {
        mount(paneEl, html`<div class="dz-empty"><span class="es-hint-i">${ico('layers', 22)}</span><b>Aquí aparecen las piezas</b><p class="mut">Claude las arma en Figma con el design system de ${b.name} y las revisa contra su guía antes de mostrártelas.</p>
          ${sis?.colores.length ? html`<div class="dz-pal">${sis.colores.map((c) => html`<span title="${c.nombre} · ${c.hex}" style="background:${c.hex}"></span>`)}</div>` : ''}
          <a class="btn ghost xs" href="#/marcas/${b.slug}/design">${ico('layers', 12)} Ver el design system</a></div>`);
        return;
      }
      const faltan = r.laminas.filter((l) => !img(l.id)).length;
      const malas = r.revision.filter((x) => !x.ok);
      mount(paneEl, html`<header class="dz-h"><div style="min-width:0"><h2>${r.titulo || 'Sin título'}</h2><span class="lbl" style="margin:0">${r.formato || chat.formato} · ${r.laminas.length} lámina${r.laminas.length === 1 ? '' : 's'}</span></div><span class="sp"></span>
          ${r.figma ? html`<a class="btn ghost xs" href="${r.figma}" target="_blank" rel="noopener">${ico('link', 12)} Abrir en Figma</a>` : ''}${faltan < r.laminas.length ? html`<button class="btn ghost xs" data-act="bajar">${ico('down', 12)} Descargar PNG</button>` : ''}</header>
        ${r.revision.length ? html`<div class="dz-rev">${r.revision.map((x) => html`<span class="${x.ok ? 'ok' : 'am'}">${x.texto}</span>`)}</div>` : ''}
        <div class="dz-grid ${/story/i.test(r.formato || chat.formato) ? 'st' : ''}">${r.laminas.map((l) => html`<button type="button" class="dz-fr ${S.lamina?.id === l.id ? 'sel' : ''}" data-act="lamina" data-id="${l.id}" title="Seleccionar para pedir un cambio">
          <span class="dz-im">${img(l.id) ? html`<img alt="${l.nombre}" src="${img(l.id)}">` : html`<span class="mut sm">Sin vista previa</span>`}</span><span class="dz-cap"><b>${l.nombre}</b></span></button>`)}</div>
        ${faltan ? html`<p class="mut sm" style="margin:0">${faltan === r.laminas.length ? 'Las vistas previas no se guardan al recargar.' : `Faltan ${faltan} vistas previas.`} <button type="button" class="linkish" data-act="reexportar">Pedirlas otra vez</button></p>` : ''}
        <footer class="dz-save">${r.guardado ? html`<span>Guardado ${raw('&middot;')} queda <b>Listo</b> en el Calendario de ${b.name}.</span><span class="sp"></span><a class="btn xs" href="#/marcas/${b.slug}/calendario">Ir al Calendario</a>`
          : html`<span>${malas.length ? `Antes de guardar, revisa: ${malas.map((x) => x.texto).join(' · ')}. ` : ''}Se guarda en ${idea() ? `la idea «${idea().title}»` : ideasCtx().length > 1 ? 'la idea que elijas del contexto' : 'una pieza nueva del calendario'}: queda <b>Lista</b> para programarla y publicarla.</span><span class="sp"></span><button class="btn" data-act="guardar" ${S.guardando ? raw('disabled') : ''}>${S.guardando ? 'Guardando…' : 'Guardar en contenido'}</button>`}</footer>`);
    }

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
      if (a === 'formato') return menuDz(t, FORMATOS.map(([f, d]) => ({ label: f, sub: d, on: chat.formato === f, pick: () => { chat.formato = f; guardar(); mount($('.dz-picks', chatEl), pickers()); } })));
      if (a === 'ctx') return document.querySelector('.dz-ctxp') ? (document.querySelector('.dz-ctxp').remove(), t.setAttribute('aria-expanded', 'false')) : panelCtx(t);
      if (a === 'ctx-x') return toggleCtx(t.dataset.k);
      if (a === 'sin-lamina') { S.lamina = null; mount($('.dz-picks', chatEl), pickers()); paintPane(); return; }
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

    paintChat(); paintPane(); salud().then(() => { if (alive()) paintChat(); });
  }
}
