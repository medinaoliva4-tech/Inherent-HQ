// App 01 · Marca › Crear › Creación: el editor de guiones.
//   Izquierda: los guiones de la marca (+ Guion). Centro: el guion, tramo por tramo (qué se dice · en pantalla · qué se ve) y el caption.
//   Derecha: el contexto (avatar y sus señales, ángulo, nivel de consciencia → etapa, brief del mes, la inspo), «Escribir con Claude»
//   (en tu compu, solo lectura) y «Pasar a Ideas» (la pieza del calendario, con el guion enlazado).
// Rutas: #/marcas/<marca>/creacion · …/creacion/<id> · …/creacion/nuevo/f:<formato> | post:<pieza> | inspo:<post de Research>
import { html, raw, mount, api, toast, ico, $, $$, confirmAsk, col, today } from './core.js';
import { BASE, ESTADOS_G, CTA_POR_ETAPA, ESQ_POR_NIVEL, etapaDeNivel, lleno, promptGuion, leerGuionClaude } from './formatos.js';
import { ANGULOS, resumenAvatar } from './avatares.js';
import { CONSCIENCIA, nivelConsciencia, mesesConBrief, candado, mesNombre } from './calendario-contenido.js';
import { tokenDe, saludPuente, preguntar } from './puente-chat.js';

export async function creacionUI(el, { me, b, alive, rest = [] }) {
  const S = { guiones: [], formatos: [...BASE], avatares: [], puede: {}, sel: null, conBrief: [], abiertos: [], claude: null, pedido: '', antes: null, inspo: null };
  const carpeta = b.slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${b.slug}`, MES = today().slice(0, 7);
  mount(el, html`<p class="loading">Cargando…</p>`);
  try {
    const [g, f, a, rc, bo] = await Promise.all([api(`guiones?profile=${encodeURIComponent(b.slug)}`), api(`formatos?profile=${encodeURIComponent(b.slug)}`), api(`avatares?profile=${encodeURIComponent(b.slug)}`).catch(() => ({ avatares: [] })), api('repo/content').catch(() => null), col('settings').get('brief_open').catch(() => null)]);
    Object.assign(S, { guiones: g.guiones, puede: g.puede, formatos: [...f.marca, ...f.base], avatares: (a.avatares || []).filter((x) => !x.archivado),
      conBrief: mesesConBrief((rc?.profiles || []).find((p) => p.slug === b.slug)?.months || []), abiertos: bo?.marcas?.[b.slug] || [] });
  } catch (e) { if (alive()) mount(el, html`<div class="empty"><b>No pude abrir Creación</b>${e.message}</div>`); return; }
  if (!alive()) return;
  const ed = () => Boolean(S.puede.editar), cur = () => S.guiones.find((x) => x.id === S.sel) || null;
  const fmt = (id) => S.formatos.find((f) => f.id === id) || BASE[0], av = (id) => S.avatares.find((x) => x.id === id) || null;
  const ir = (id) => { history.replaceState(null, '', `#/marcas/${b.slug}/creacion${id ? '/' + id : ''}`); };

  // ---------- Un guion nuevo desde un formato, una pieza de Ideas o una inspo ----------
  async function crear(pre = {}) {
    try { const d = await api('guiones', { method: 'POST', body: { profile: b.slug, ...pre } }); S.guiones = [d, ...S.guiones]; S.sel = d.id; ir(d.id); return d; }
    catch (e) { toast(e.message, true); return null; }
  }
  if (rest[0] === 'nuevo' && ed()) {
    const [k, id] = String(rest[1] || '').split(':'); let pre = { titulo: 'Nuevo guion', avatar: S.avatares[0]?.id || null };
    if (k === 'f') pre.formato = id;
    if (k === 'post' || k === 'inspo') {
      const x = await col('content').get(id).catch(() => null);
      if (x && k === 'post') { const n = nivelConsciencia(x); pre = { ...pre, titulo: x.title || pre.titulo, post: x.id, avatar: x.avatar || pre.avatar, angulo: x.angulo || null, consciencia: n || null, caption: x.caption || '', formato: /story/i.test(x.format || '') ? 'base-story-detras' : n ? `base-reel-${{ 'A cámara': 'acamara', Lista: 'lista', 'Antes y después': 'antesdespues', Proceso: 'proceso', Historia: 'historia', 'Reel estático': 'estatico' }[ESQ_POR_NIVEL[n - 1][0]]}` : 'base-reel-acamara' }; }
      if (x && k === 'inspo') pre = { ...pre, titulo: `Replica · ${x.title || '@' + (x.handle || '')}`.slice(0, 120), inspo: x.id, formato: x.format === 'carrusel' || x.format === 'estatico' ? 'base-reel-estatico' : 'base-reel-acamara' };
    }
    if (!alive()) return; await crear(pre);
  } else S.sel = S.guiones.some((x) => x.id === rest[0]) ? rest[0] : S.guiones[0]?.id || null;
  if (cur()?.inspo) S.inspo = await col('content').get(cur().inspo).catch(() => null);
  if (!alive()) return;

  function paint() {
    if (!alive()) return;
    const g = cur();
    mount(el, html`<div class="cr"><aside class="cr-list">${ed() ? html`<button class="btn xs cr-new" data-cr="nuevo">${ico('plus', 13)} Guion</button>` : ''}
        ${S.guiones.length ? S.guiones.map((x) => html`<button type="button" class="cr-item ${x.id === S.sel ? 'on' : ''}" data-cr="sel" data-id="${x.id}"><b>${x.titulo}</b><span class="mut sm">${fmt(x.formato).nombre} · ${x.estado}${x.post ? ' · en Ideas' : ''}</span><i style="width:${lleno(x)}%"></i></button>`) : html`<p class="mut sm cr-vacio-l">Todavía no hay guiones.</p>`}</aside>
      ${g ? html`<section class="cr-main" id="cr-main">${main(g)}</section><aside class="cr-side" id="cr-side">${side(g)}</aside>` : html`<section class="cr-main cr-empty"><span class="av-empty-i">${ico('edit', 24)}</span><h2>Escribe el primer guion</h2><p>Elige un formato en <a href="#/marcas/${b.slug}/formatos">Formatos</a>, o convierte una pieza de Ideas o una inspo en guion.</p>${ed() ? html`<button class="btn" data-cr="nuevo">${ico('plus', 14)} Guion</button>` : ''}</section>`}</div>`);
  }

  // ---------- Centro: el guion ----------
  function main(g) {
    const f = fmt(g.formato), dis = ed() ? '' : raw('disabled'), a = av(g.avatar);
    const angs = [...(a?.angulos || []).map((x) => `${x.tipo} · ${x.texto}`), ...ANGULOS];
    return html`<header class="cr-h"><input class="in cr-title" data-g="titulo" value="${g.titulo}" aria-label="Título" ${dis}>
        <div class="cr-meta">
          <label><span>Formato</span><select class="in" data-g="formato" ${dis}>${S.formatos.map((x) => html`<option value="${x.id}" ${x.id === g.formato ? raw('selected') : ''}>${x.nombre}${x.base ? '' : ' (marca)'}</option>`)}</select></label>
          <label><span>Avatar</span><select class="in" data-g="avatar" ${dis}><option value="">—</option>${S.avatares.map((x) => html`<option value="${x.id}" ${x.id === g.avatar ? raw('selected') : ''}>${x.nombre} · ${x.peso || 0}%</option>`)}</select></label>
          <label><span>Ángulo</span><select class="in" data-g="angulo" ${dis}><option value="">—</option>${[...new Set([g.angulo, ...angs].filter(Boolean))].map((x) => html`<option ${x === g.angulo ? raw('selected') : ''}>${x}</option>`)}</select></label>
          <label><span>Consciencia</span><select class="in" data-g="consciencia" ${dis}><option value="">—</option>${CONSCIENCIA.map((x, i) => html`<option value="${i + 1}" ${g.consciencia === i + 1 ? raw('selected') : ''}>${i + 1} · ${x}</option>`)}</select></label>
          <label><span>Estado</span><select class="in" data-g="estado" ${dis}>${ESTADOS_G.map((x) => html`<option ${x === g.estado ? raw('selected') : ''}>${x}</option>`)}</select></label></div></header>
      <div class="cr-tramos">${(g.tramos || []).map((t, i) => { const p = (f.partes || []).find((x) => x.nombre === t.nombre); return html`<section class="cr-t"><header><b>${t.nombre}</b>${t.seg ? html`<span class="chip sm2">${t.seg}</span>` : ''}${p?.que ? html`<span class="mut sm">${p.que}</span>` : ''}</header>
          <div class="cr-t-g"><label class="av-f w"><span class="av-l">Qué se dice</span><textarea class="in" rows="2" data-t="dice" data-i="${i}" ${dis}>${t.dice}</textarea></label>
            <label class="av-f"><span class="av-l">En pantalla</span><input class="in" data-t="pantalla" data-i="${i}" value="${t.pantalla}" ${dis}></label>
            <label class="av-f"><span class="av-l">Qué se ve</span><input class="in" data-t="visual" data-i="${i}" value="${t.visual}" ${dis}></label></div></section>`; })}</div>
      <label class="av-f w cr-cap"><span class="av-l">Caption</span><textarea class="in" rows="3" data-g="caption" ${dis}>${g.caption || ''}</textarea></label>`;
  }

  // ---------- Derecha: contexto, Claude y acciones ----------
  function side(g) {
    const a = av(g.avatar), etapa = etapaDeNivel(g.consciencia), k = candado(MES, S.conBrief, S.abiertos), C = S.claude;
    return html`<div class="av-card"><div class="av-row"><span class="chip ${g.estado === 'Listo para grabar' ? 'av-st-ok' : ''}">${g.estado}</span><span class="mut sm" id="cr-save">Guardado</span></div>
        <div class="av-av"><span class="mut sm">Escrito al ${lleno(g)}%</span><div class="av-av-b"><i style="width:${lleno(g)}%"></i></div></div>
        ${ed() ? html`<button class="btn xs" data-cr="ideas">${ico(g.post ? 'repeat' : 'bulb', 13)} ${g.post ? 'Poner al día en Ideas' : 'Pasar a Ideas'}</button>` : ''}${g.post ? html`<a class="mut sm" href="#/marcas/${b.slug}/ideas">Ver la pieza en Ideas →</a>` : ''}</div>
      <div class="av-card"><span class="lbl">Contexto</span>
        <div class="cr-ctx"><b>${a ? a.nombre : 'Sin avatar'}</b><span class="mut sm">${a ? resumenAvatar(a) : html`Defínelo en <a href="#/marcas/${b.slug}/icp">Cliente ideal</a>.`}</span>
          ${a?.campos?.decir?.length || a?.campos?.mostrar?.length ? html`<details class="cr-sen"><summary>Señales para Meta</summary><ul>${[...(a.campos.decir || []).map((x) => 'Decir: ' + x), ...(a.campos.mostrar || []).map((x) => 'Mostrar: ' + x)].map((x) => html`<li>${x}</li>`)}</ul></details>` : ''}</div>
        ${g.consciencia ? html`<div class="cr-ctx"><b>${etapa} · ${CONSCIENCIA[g.consciencia - 1]}</b><span class="mut sm">CTA de ${CTA_POR_ETAPA[etapa]}. Esqueletos que mejor sirven: ${ESQ_POR_NIVEL[g.consciencia - 1].join(' o ')}.</span></div>` : ''}
        <div class="cr-ctx"><b>${ico(k.cerrado ? 'lock' : 'check', 13)} Brief de ${mesNombre(MES)}</b><span class="mut sm">${k.cerrado ? 'Todavía no hay brief: el guion se escribe, pero la pieza no se agenda en este mes.' : k.por === 'ceo' ? 'Abierto por el CEO sin brief.' : 'Listo: Claude lo lee.'} <a href="#/marcas/${b.slug}/brief">Ver</a></span></div>
        ${S.inspo ? html`<div class="cr-ctx"><b>${ico('repeat', 13)} Replica a @${S.inspo.handle || '—'}</b><span class="mut sm">${String(S.inspo.text || S.inspo.title || '').slice(0, 160)}</span></div>` : ''}</div>
      ${ed() ? html`<div class="av-card"><span class="lbl">Claude, en tu compu</span>
        ${!C ? html`<p class="mut sm">Escribe los tramos con la voz de la marca, para este avatar y su nivel de consciencia. Solo lectura.</p><textarea class="in" rows="2" data-cr-pedido placeholder="Opcional: «más corto», «con humor», «en inglés»…">${S.pedido}</textarea><button class="btn xs" data-cr="claude">${ico('spark', 13)} Escribir con Claude</button>${S.antes ? html`<button class="btn ghost xs" data-cr="deshacer">Deshacer lo de Claude</button>` : ''}` : ''}
        ${C?.fase === 'pensando' ? html`<p class="av-think"><span class="es-dots-t"><i></i><i></i><i></i></span> ${C.tool || 'Escribiendo…'}</p>` : ''}
        ${C?.fase === 'error' ? html`<p class="es-err">${C.error}</p><button class="btn ghost xs" data-cr="descartar">Entendido</button>` : ''}</div>` : ''}
      ${ed() ? html`<button class="av-arch" data-cr="archivar">Archivar este guion</button>` : ''}`;
  }

  // ---------- Guardar ----------
  let timer = null, pend = {};
  function guardar(patch, ya = false) {
    Object.assign(pend, patch); const s = $('#cr-save', el); if (s) s.textContent = 'Guardando…';
    clearTimeout(timer); timer = setTimeout(enviar, ya ? 0 : 600);
  }
  async function enviar() {
    const g = cur(), body = pend; pend = {}; if (!g || !Object.keys(body).length) return;
    try { const d = await api(`guiones/${g.id}`, { method: 'PUT', body }); S.guiones = S.guiones.map((x) => (x.id === d.id ? d : x)); if ('formato' in body) return paint(); }
    catch (e) { toast(e.message, true); }
    if (!alive()) return; const side0 = $('#cr-side', el); if (side0) mount(side0, side(cur()));
    const it = $(`.cr-item[data-id="${S.sel}"]`, el); if (it) { const g2 = cur(); $('b', it).textContent = g2.titulo; $('span', it).textContent = `${fmt(g2.formato).nombre} · ${g2.estado}${g2.post ? ' · en Ideas' : ''}`; $('i', it).style.width = lleno(g2) + '%'; }
  }

  // ---------- Claude ----------
  async function escribir() {
    const g = cur(); if (!g) return;
    const tok = tokenDe(me), s = await saludPuente();
    if (!s.on || !s.listo || !tok) { S.claude = { fase: 'error', error: !s.on ? 'El puente de Laya no está encendido en esta compu. Enciéndelo desde Estrategia.' : !tok ? 'Falta emparejar esta compu: hazlo una vez en Estrategia › Chat.' : 'Al puente le falta el repo o Claude Code: revísalo en Estrategia.' }; return paint(); }
    S.claude = { fase: 'pensando', tool: '' }; paint();
    try {
      const texto = await preguntar({ prompt: promptGuion({ marca: b.name, carpeta, formato: fmt(g.formato), guion: g, avatar: av(g.avatar), inspo: S.inspo, mes: MES, pedido: S.pedido }), token: tok,
        onTool: (t) => { S.claude.tool = t; const sd = $('#cr-side', el); if (sd) mount(sd, side(cur())); } });
      const r = leerGuionClaude(texto); if (!r || !r.tramos.length) throw new Error('Claude respondió sin el bloque del guion. Intenta de nuevo.');
      S.antes = { tramos: g.tramos, caption: g.caption, titulo: g.titulo };
      const tramos = (g.tramos || []).map((t) => ({ ...t, ...(r.tramos.find((x) => x.nombre.toLowerCase() === t.nombre.toLowerCase()) || {}), nombre: t.nombre, seg: t.seg || r.tramos.find((x) => x.nombre.toLowerCase() === t.nombre.toLowerCase())?.seg || '' }));
      Object.assign(g, { tramos, caption: r.caption || g.caption }); S.claude = null; guardar({ tramos, caption: g.caption }, true); toast('Claude escribió el guion: revísalo y ajústalo');
    } catch (e) { S.claude = { fase: 'error', error: e.message }; }
    paint();
  }

  // ---------- Eventos ----------
  el.onclick = async (e) => {
    const t = e.target.closest('[data-cr]'); if (!t) return;
    const a = t.dataset.cr, g = cur();
    if (a === 'sel') { S.sel = t.dataset.id; S.claude = null; S.antes = null; S.inspo = cur()?.inspo ? await col('content').get(cur().inspo).catch(() => null) : null; ir(S.sel); return paint(); }
    if (a === 'nuevo') { const d = await crear({ titulo: 'Nuevo guion', avatar: S.avatares[0]?.id || null }); if (d) { paint(); $('.cr-title', el)?.select(); } return; }
    if (a === 'claude') return escribir();
    if (a === 'descartar') { S.claude = null; return paint(); }
    if (a === 'deshacer') { Object.assign(g, S.antes); guardar(S.antes, true); S.antes = null; return paint(); }
    if (a === 'ideas') { try { clearTimeout(timer); await enviar(); const r = await api(`guiones/${g.id}/a-ideas`, { method: 'POST', body: {} }); g.post = r.post.id; toast(`En Ideas como «${r.post.title}»`); paint(); } catch (er) { toast(er.message, true); } return; }
    if (a === 'archivar') { if (!(await confirmAsk(`¿Archivar «${g.titulo}»?`))) return; try { await api(`guiones/${g.id}/archivar`, { method: 'POST', body: {} }); S.guiones = S.guiones.filter((x) => x.id !== g.id); S.sel = S.guiones[0]?.id || null; ir(S.sel); paint(); } catch (er) { toast(er.message, true); } }
  };
  el.onchange = (e) => {
    const t = e.target, g = cur(); if (!g) return;
    if (t.dataset.g) { const k = t.dataset.g, v = k === 'consciencia' ? (t.value ? +t.value : null) : t.value || (k === 'titulo' ? g.titulo : null); g[k] = v; guardar({ [k]: v }, k === 'formato'); if (['avatar', 'consciencia', 'angulo'].includes(k)) { const sd = $('#cr-side', el); if (sd) mount(sd, side(g)); } return; }
    if (t.dataset.t) { const i = +t.dataset.i; g.tramos = g.tramos.map((x, j) => (j === i ? { ...x, [t.dataset.t]: t.value } : x)); guardar({ tramos: g.tramos }); }
  };
  el.oninput = (e) => { if (e.target.hasAttribute('data-cr-pedido')) S.pedido = e.target.value; };
  paint();
}
