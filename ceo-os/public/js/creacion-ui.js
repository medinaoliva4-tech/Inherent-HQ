// App 01 · Marca › Crear › Creación: el editor de guiones.
//   Izquierda: los guiones de la marca (+ Guion). Centro: el guion, tramo por tramo (qué se dice · en pantalla · qué se ve) y el caption.
//   Derecha: el contexto (avatar y sus señales, ángulo, nivel de consciencia → etapa, brief del mes, la inspo), «Escribir con Claude»
//   (en tu compu, solo lectura) y «Pasar a Ideas» (la pieza del calendario, con el guion enlazado).
//   Storyboard: bajo cada tramo, una tira de frames (cuadro() de video-ui.js con safe zones y subtítulos; imagen en Drive, plano, movimiento, segundos, texto en pantalla, VO).
//   Las versiones solo se agregan (versiones[]); un frame de más contra la duración avisa antes de «Listo para grabar»; «Enviar al shot list» no duplica (clave = id del frame).
// Rutas: #/ws/production/<marca>/pre-production/script-storyboard-studio[/<id> | /nuevo/f:<formato> | post:<pieza> | inspo:<post de Research>]
// (lo monta screens/workspace.js; las viejas #/marcas/<marca>/creacion/… son alias).
import { html, raw, mount, api, toast, ico, $, $$, confirmAsk, col, today, uploadToDrive } from './core.js';
import { BASE, ESTADOS_G, CTA_POR_ETAPA, ESQ_POR_NIVEL, PLANOS, MOVIMIENTOS, etapaDeNivel, lleno, promptGuion, leerGuionClaude, frameNuevo, framesVivos, duracionFrames, duracionObjetivo, excesoFrames, avisoExceso, escenasDeGuion, mezclarEscenas } from './formatos.js';
import { ANGULOS, resumenAvatar } from './avatares.js';
import { CONSCIENCIA, nivelConsciencia, mesesConBrief, candado, mesNombre } from './calendario-contenido.js';
import { rutaModulo, herramientaDe } from './herramientas.js';
import { correrIA, armarCtx } from './ia-herramienta.js';
import { cuadro } from './video-ui.js';
import { limpiarKit, kitDesdeSistema } from './video.js';

export async function creacionUI(el, { me, b, alive, rest = [] }) {
  const S = { guiones: [], formatos: [...BASE], avatares: [], puede: {}, sel: null, conBrief: [], abiertos: [], claude: null, pedido: '', antes: null, inspo: null, kit: kitDesdeSistema(null), fr: null, subiendo: false, abort: null };
  const carpeta = b.slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${b.slug}`, MES = today().slice(0, 7);
  mount(el, html`<p class="loading">Cargando…</p>`);
  try {
    const [g, f, a, rc, bo, vd] = await Promise.all([api(`guiones?profile=${encodeURIComponent(b.slug)}`), api(`formatos?profile=${encodeURIComponent(b.slug)}`), api(`avatares?profile=${encodeURIComponent(b.slug)}`).catch(() => ({ avatares: [] })), api('repo/content').catch(() => null), col('settings').get('brief_open').catch(() => null), api(`video?profile=${encodeURIComponent(b.slug)}`).catch(() => null)]);
    Object.assign(S, { guiones: g.guiones, puede: g.puede, formatos: [...f.marca, ...f.base], avatares: (a.avatares || []).filter((x) => !x.archivado),
      conBrief: mesesConBrief((rc?.profiles || []).find((p) => p.slug === b.slug)?.months || []), abiertos: bo?.marcas?.[b.slug] || [], kit: vd?.kit ? limpiarKit(vd.kit) : kitDesdeSistema(null) });
  } catch (e) { if (alive()) mount(el, html`<div class="empty"><b>No pude abrir Creación</b>${e.message}</div>`); return; }
  if (!alive()) return;
  const ed = () => Boolean(S.puede.editar), cur = () => S.guiones.find((x) => x.id === S.sel) || null;
  const fmt = (id) => S.formatos.find((f) => f.id === id) || BASE[0], av = (id) => S.avatares.find((x) => x.id === id) || null;
  const ir = (id) => { history.replaceState(null, '', rutaModulo(b.slug, 'creacion', id ? [id] : [])); };

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
      ${g ? html`<section class="cr-main" id="cr-main">${main(g)}</section><aside class="cr-side" id="cr-side">${side(g)}</aside>` : html`<section class="cr-main cr-empty"><span class="av-empty-i">${ico('edit', 24)}</span><h2>Escribe el primer guion</h2><p>Elige un formato en <a href="${rutaModulo(b.slug, 'formatos')}">Formatos</a>, o convierte una pieza de Ideas o una inspo en guion.</p>${ed() ? html`<button class="btn" data-cr="nuevo">${ico('plus', 14)} Guion</button>` : ''}</section>`}</div>`);
    imagenes();
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
            <label class="av-f"><span class="av-l">Qué se ve</span><input class="in" data-t="visual" data-i="${i}" value="${t.visual}" ${dis}></label></div><div class="cr-fr-w" id="cr-fr-${i}">${fr(g, i)}</div></section>`; })}</div>
      <label class="av-f w cr-cap"><span class="av-l">Caption</span><textarea class="in" rows="3" data-g="caption" ${dis}>${g.caption || ''}</textarea></label>`;
  }

  // ---------- Storyboard: la tira de frames de un tramo ----------
  const imgUrl = (id) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w400`;
  // La imagen de Drive entra como fondo del cuadro (el id ya viene validado por limpiarFrames).
  const imagenes = (root = el) => $$('.cr-fr[data-img]', root).forEach((b0) => { const id = b0.dataset.img, c = $('.vd-cuadro', b0); if (id && c) { c.style.backgroundImage = `url("${imgUrl(id)}")`; c.style.backgroundSize = 'cover'; c.style.backgroundPosition = 'center'; } });
  function fr(g, i) {
    const t = g.tramos[i], vivos = framesVivos(g).filter((x) => x.tramo === t.nombre), sel = vivos.find((x) => x.id === S.fr), dis = ed() ? '' : raw('disabled');
    const op = (l, v) => html`<option value="">—</option>${l.map((x) => html`<option ${x === v ? raw('selected') : ''}>${x}</option>`)}`;
    return html`<div class="cr-fr-tira" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;margin-top:10px">
        ${vivos.map((x) => html`<button type="button" class="cr-fr ${x.id === S.fr ? 'on' : ''}" data-cr="frame" data-fid="${x.id}" data-img="${x.imagen?.id || ''}" aria-pressed="${x.id === S.fr}" style="background:none;border:0;padding:0;cursor:pointer;text-align:left;${x.id === S.fr ? 'outline:2px solid currentColor;outline-offset:2px;' : ''}">${cuadro('9:16', S.kit, x.texto, 84)}<span class="mut sm" style="display:block">${x.seg ? x.seg + ' s' : '⚠️ SIN DATOS'} · ${x.plano || 'sin plano'}</span></button>`)}
        ${ed() ? html`<button type="button" class="btn ghost xs" data-cr="frame+" data-i="${i}">${ico('plus', 13)} Frame</button>` : ''}${!vivos.length && !ed() ? html`<span class="mut sm">Sin frames</span>` : ''}</div>
      ${sel ? html`<div class="cr-fr-ed" style="margin-top:8px"><div class="cr-t-g">
          <label class="av-f"><span class="av-l">Plano</span><select class="in" data-f="plano" ${dis}>${op(PLANOS, sel.plano)}</select></label>
          <label class="av-f"><span class="av-l">Movimiento</span><select class="in" data-f="movimiento" ${dis}>${op(MOVIMIENTOS, sel.movimiento)}</select></label>
          <label class="av-f"><span class="av-l">Segundos</span><input class="in" type="number" min="0" max="120" step="0.5" data-f="seg" value="${sel.seg ?? ''}" ${dis}></label>
          <label class="av-f w"><span class="av-l">Texto en pantalla</span><input class="in" data-f="texto" maxlength="200" value="${sel.texto}" ${dis}></label>
          <label class="av-f w"><span class="av-l">VO (voz en off)</span><textarea class="in" rows="2" data-f="vo" ${dis}>${sel.vo}</textarea></label></div>
        <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px">${sel.imagen ? (sel.imagen.link ? html`<a class="mut sm" href="${sel.imagen.link}" target="_blank" rel="noopener">${ico('image', 13)} ${sel.imagen.nombre || 'Imagen en Drive'}</a>` : html`<span class="mut sm">${ico('image', 13)} ${sel.imagen.nombre || 'Imagen en Drive'}</span>`) : html`<span class="mut sm">Sin imagen todavía</span>`}
          ${ed() ? html`<label class="btn ghost xs">${ico('upload', 13)} ${S.subiendo ? 'Subiendo…' : sel.imagen ? 'Cambiar imagen' : 'Imagen a Drive'}<input type="file" accept="image/*" hidden data-f-img></label><button type="button" class="btn ghost xs" data-cr="frame-">${ico('trash', 13)} Archivar frame</button>` : ''}</div></div>` : ''}`;
  }
  const pintarFr = () => { (cur()?.tramos || []).forEach((_, i) => { const w = $(`#cr-fr-${i}`, el); if (w) mount(w, fr(cur(), i)); }); imagenes(); const sd = $('#cr-side', el); if (sd) mount(sd, side(cur())); };

  function duracionCard(g) {
    const f = fmt(g.formato), total = duracionFrames(g), obj = duracionObjetivo(f), ex = excesoFrames(g, f);
    if (!framesVivos(g).length) return html`<p class="mut sm">Sin frames: la duración sale de los segundos de cada frame.${obj ? ` El formato dura ${obj} s.` : ''}</p>`;
    return html`<p class="sm"><b>${total} s</b>${obj ? ` de ${obj} s` : ''}${framesVivos(g).some((x) => !x.seg) ? html` · <span class="mut">⚠️ SIN DATOS en ${framesVivos(g).filter((x) => !x.seg).length} frame(s): falta su duración</span>` : ''}</p>${ex ? html`<p class="es-err">${ico('alert', 13)} ${avisoExceso(ex)}</p>` : ''}`;
  }

  // ---------- Derecha: contexto, Claude y acciones ----------
  function side(g) {
    const a = av(g.avatar), etapa = etapaDeNivel(g.consciencia), k = candado(MES, S.conBrief, S.abiertos), C = S.claude;
    return html`<div class="av-card"><div class="av-row"><span class="chip ${g.estado === 'Listo para grabar' ? 'av-st-ok' : ''}">${g.estado}</span><span class="mut sm" id="cr-save">Guardado</span></div>
        <div class="av-av"><span class="mut sm">Escrito al ${lleno(g)}%</span><div class="av-av-b"><i style="width:${lleno(g)}%"></i></div></div>
        ${ed() ? html`<button class="btn xs" data-cr="ideas">${ico(g.post ? 'repeat' : 'bulb', 13)} ${g.post ? 'Poner al día en Ideas' : 'Pasar a Ideas'}</button>` : ''}${g.post ? html`<a class="mut sm" href="${rutaModulo(b.slug, 'ideas')}">Ver la pieza en Ideas →</a>` : ''}</div>
      <div class="av-card"><span class="lbl">Contexto</span>
        <div class="cr-ctx"><b>${a ? a.nombre : 'Sin avatar'}</b><span class="mut sm">${a ? resumenAvatar(a) : html`Defínelo en <a href="${rutaModulo(b.slug, 'icp')}">Cliente ideal</a>.`}</span>
          ${a?.campos?.decir?.length || a?.campos?.mostrar?.length ? html`<details class="cr-sen"><summary>Señales para Meta</summary><ul>${[...(a.campos.decir || []).map((x) => 'Decir: ' + x), ...(a.campos.mostrar || []).map((x) => 'Mostrar: ' + x)].map((x) => html`<li>${x}</li>`)}</ul></details>` : ''}</div>
        ${g.consciencia ? html`<div class="cr-ctx"><b>${etapa} · ${CONSCIENCIA[g.consciencia - 1]}</b><span class="mut sm">CTA de ${CTA_POR_ETAPA[etapa]}. Esqueletos que mejor sirven: ${ESQ_POR_NIVEL[g.consciencia - 1].join(' o ')}.</span></div>` : ''}
        <div class="cr-ctx"><b>${ico(k.cerrado ? 'lock' : 'check', 13)} Brief de ${mesNombre(MES)}</b><span class="mut sm">${k.cerrado ? 'Todavía no hay brief: el guion se escribe, pero la pieza no se agenda en este mes.' : k.por === 'ceo' ? 'Abierto por el CEO sin brief.' : 'Listo: Claude lo lee.'} <a href="${rutaModulo(b.slug, 'brief')}">Ver</a></span></div>
        ${S.inspo ? html`<div class="cr-ctx"><b>${ico('repeat', 13)} Replica a @${S.inspo.handle || '—'}</b><span class="mut sm">${String(S.inspo.text || S.inspo.title || '').slice(0, 160)}</span></div>` : ''}</div>
      <div class="av-card"><span class="lbl">Duración</span>${duracionCard(g)}</div>
      ${ed() || (g.versiones || []).length ? html`<div class="av-card"><span class="lbl">Versiones</span>
        ${(g.versiones || []).length ? html`<ul class="cr-ver" style="list-style:none;padding:0;margin:0 0 8px">${[...g.versiones].reverse().slice(0, 8).map((v) => html`<li class="row" style="gap:6px;align-items:center;justify-content:space-between"><span class="sm"><b>v${v.v}</b> · ${String(v.en || '').slice(0, 10)} · ${v.via}${v.nota ? ' · ' + v.nota : ''}</span>${ed() ? html`<button type="button" class="btn ghost xs" data-cr="restaurar" data-v="${v.v}">Restaurar</button>` : ''}</li>`)}</ul>` : html`<p class="mut sm">Aún no hay versiones. Cada vez que Claude escribe, o que guardas una, se agrega una: las anteriores se quedan.</p>`}
        ${ed() ? html`<button class="btn ghost xs" data-cr="version">${ico('plus', 13)} Guardar versión</button>` : ''}</div>` : ''}
      ${ed() && framesVivos(g).length ? html`<div class="av-card"><span class="lbl">Shot list</span><p class="mut sm">Manda las escenas (un frame = una escena) al Shot List Builder de ${mesNombre(MES)}. Si las vuelves a enviar se ponen al día, no se duplican.</p><button class="btn xs" data-cr="shotlist">${ico('send', 13)} Enviar al shot list</button></div>` : ''}
      ${ed() ? html`<div class="av-card"><span class="lbl">Claude</span>
        ${!C ? html`<p class="mut sm">Escribe los tramos con la voz de la marca, para este avatar y su nivel de consciencia, con el servidor de Inherent (o el puente / claude.ai).</p><textarea class="in" rows="2" data-cr-pedido placeholder="Opcional: «más corto», «con humor», «en inglés»…">${S.pedido}</textarea><button class="btn xs" data-cr="claude">${ico('spark', 13)} Escribir con Claude</button>${S.antes ? html`<button class="btn ghost xs" data-cr="deshacer">Deshacer lo de Claude</button>` : ''}` : ''}
        ${C?.fase === 'pensando' ? html`<p class="av-think"><span class="es-dots-t"><i></i><i></i><i></i></span> ${C.tool || 'Escribiendo…'}</p><button class="btn ghost xs" data-cr="cancelar">Cancelar</button>` : ''}
        ${C?.fase === 'error' ? html`<p class="es-err">${C.error}</p><button class="btn ghost xs" data-cr="descartar">Entendido</button>` : ''}</div>` : ''}
      ${ed() ? html`<button class="av-arch" data-cr="archivar">Archivar este guion</button>` : ''}`;
  }

  // ---------- Guardar ----------
  // Cada PUT lleva la v que se leyó; si alguien cambió el guion antes, el servidor responde 409 y se avisa (sin pisar).
  let timer = null, pend = {};
  const refrescarLista = () => { const it = $(`.cr-item[data-id="${S.sel}"]`, el), g2 = cur(); if (it && g2) { $('b', it).textContent = g2.titulo; $('span', it).textContent = `${fmt(g2.formato).nombre} · ${g2.estado}${g2.post ? ' · en Ideas' : ''}`; $('i', it).style.width = lleno(g2) + '%'; } };
  function guardar(patch, ya = false) {
    Object.assign(pend, patch); const s0 = $('#cr-save', el); if (s0) s0.textContent = 'Guardando…';
    clearTimeout(timer); timer = setTimeout(enviar, ya ? 0 : 600);
  }
  // Manda lo pendiente. extra: nueva_version, forzar. Devuelve el guion guardado o null.
  let cola = Promise.resolve();
  const enviar = (extra = {}) => (cola = cola.then(() => enviar0(extra), () => enviar0(extra)));
  async function enviar0(extra = {}) {
    clearTimeout(timer); const g = cur(), body = { ...pend, ...extra }; pend = {}; if (!g || !Object.keys(body).length) return g;
    try {
      const d = await api(`guiones/${g.id}`, { method: 'PUT', body: { ...body, v: g.v } }); S.guiones = S.guiones.map((x) => (x.id === d.id ? d : x));
      if ('formato' in body) { paint(); return d; }
    } catch (e) {
      if (e.code === 'EXCESO' || /sobran/.test(e.message || '')) { if (await confirmAsk(`${e.message}\n\n¿Marcarlo «Listo para grabar» de todos modos?`)) return enviar0({ ...body, forzar: true });
        const fr0 = await api(`guiones?profile=${encodeURIComponent(b.slug)}`).catch(() => null); if (fr0 && alive()) { S.guiones = fr0.guiones; paint(); } return null; }
      toast(e.message, true); const fresco = await api(`guiones?profile=${encodeURIComponent(b.slug)}`).catch(() => null);
      if (fresco && alive()) { S.guiones = fresco.guiones; paint(); } return null;
    }
    if (!alive()) return null; const side0 = $('#cr-side', el); if (side0) mount(side0, side(cur())); refrescarLista(); return cur();
  }

  // ---------- IA: correrIA con el promptGuion de hoy ----------
  async function escribir() {
    const g = cur(); if (!g) return;
    S.abort = new AbortController(); S.claude = { fase: 'pensando', tool: '' }; paint();
    try {
      const tool = { ...herramientaDe('script-storyboard-studio'), bloque: 'guion', prompt: () => promptGuion({ marca: b.name, carpeta, formato: fmt(g.formato), guion: g, avatar: av(g.avatar), inspo: S.inspo, mes: MES, pedido: S.pedido }) };
      const ctx = await armarCtx(me, { tool, slug: b.slug });
      const out = await correrIA(me, { tool, ctx, signal: S.abort.signal, onTool: (t) => { if (S.claude) S.claude.tool = String(t || ''); const sd = $('#cr-side', el); if (sd) mount(sd, side(cur())); } });
      const r = leerGuionClaude(out.texto); if (!r || !r.tramos.length) throw new Error('La IA respondió sin el bloque del guion. Intenta de nuevo.');
      // Lo anterior se guarda como versión antes de escribir encima (solo si ya había algo y aún no hay versiones).
      if (lleno(g) > 0 && !(g.versiones || []).length) await enviar({ nueva_version: { via: 'manual', nota: 'Antes de la IA' } });
      const g1 = cur() || g; S.antes = { tramos: g1.tramos, caption: g1.caption, titulo: g1.titulo, frames: g1.frames };
      const tramos = (g1.tramos || []).map((t) => { const x = r.tramos.find((y) => y.nombre.toLowerCase() === t.nombre.toLowerCase()) || {}; return { ...t, ...x, nombre: t.nombre, seg: t.seg || x.seg || '' }; });
      Object.assign(g1, { tramos, caption: r.caption || g1.caption }); S.claude = null;
      pend = { tramos, caption: g1.caption }; await enviar({ nueva_version: { via: out.via, nota: `${out.modelo}${S.pedido ? ' · ' + S.pedido.slice(0, 80) : ''}` } });
      toast('Se escribió el guion: revísalo y ajústalo');
    } catch (e) { S.claude = e.name === 'AbortError' ? null : { fase: 'error', error: e.message }; }
    S.abort = null; paint();
  }

  // ---------- Enviar al shot list: un entregable de shot-list-builder por mes, sin duplicar escenas ----------
  async function alShotList(g) {
    clearTimeout(timer); await enviar();
    const nuevas = escenasDeGuion(cur() || g), q = `ws=production&slug=${encodeURIComponent(b.slug)}&tool=shot-list-builder&ciclo=${MES}`;
    const lista = await api(`entregables?${q}`), ent = (lista.items || []).find((d) => !d.archivado);
    if (lista.alcance && lista.alcance.abierto === false) throw new Error(lista.alcance.texto || 'Esta marca no tiene abierto el shot list');
    const { escenas, agregadas, puestas } = mezclarEscenas(ent?.contenido?.escenas, nuevas);
    if (ent) await api(`entregables/${encodeURIComponent(ent.id)}`, { method: 'PUT', body: { v: ent.v, contenido: { ...ent.contenido, escenas } } });
    else await api('entregables', { method: 'POST', body: { tool: 'shot-list-builder', client_slug: b.slug, ciclo: MES, titulo: `Shot list · ${mesNombre(MES)}`, contenido: { escenas } } });
    return { agregadas, puestas };
  }

  // ---------- Eventos ----------
  el.onclick = async (e) => {
    const t = e.target.closest('[data-cr]'); if (!t) return;
    const a = t.dataset.cr, g = cur();
    if (a === 'sel') { S.sel = t.dataset.id; S.claude = null; S.antes = null; S.inspo = cur()?.inspo ? await col('content').get(cur().inspo).catch(() => null) : null; ir(S.sel); return paint(); }
    if (a === 'nuevo') { const d = await crear({ titulo: 'Nuevo guion', avatar: S.avatares[0]?.id || null }); if (d) { paint(); $('.cr-title', el)?.select(); } return; }
    if (a === 'claude') return escribir();
    if (a === 'cancelar') { S.abort?.abort(); return; }
    if (a === 'frame') { S.fr = S.fr === t.dataset.fid ? null : t.dataset.fid; return pintarFr(); }
    if (a === 'frame+') { const nf = frameNuevo(g.tramos[+t.dataset.i]?.nombre || '', g.frames || []); g.frames = [...(g.frames || []), nf]; S.fr = nf.id; guardar({ frames: g.frames }); return pintarFr(); }
    if (a === 'frame-') { g.frames = (g.frames || []).map((x) => (x.id === S.fr ? { ...x, archivado: true } : x)); S.fr = null; guardar({ frames: g.frames }); return pintarFr(); }
    if (a === 'version') { await enviar({ nueva_version: { via: 'manual', nota: 'Guardada a mano' } }); toast('Versión guardada'); return paint(); }
    if (a === 'restaurar') {
      const v = (g.versiones || []).find((x) => x.v === +t.dataset.v); if (!v || !(await confirmAsk(`¿Volver a la v${v.v}? Lo de ahora queda como versión: no se pierde nada.`))) return;
      if (!(g.versiones || []).length || lleno(g) > 0) await enviar({ nueva_version: { via: 'manual', nota: `Antes de volver a v${v.v}` } });
      pend = { titulo: v.titulo || g.titulo, tramos: v.tramos, frames: v.frames, caption: v.caption }; await enviar({ nueva_version: { via: 'manual', nota: `Restaurada de v${v.v}` } }); return paint();
    }
    if (a === 'shotlist') { t.disabled = true; try { const r = await alShotList(g); toast(`Shot list al día: ${r.agregadas} escena(s) nueva(s), ${r.puestas} actualizada(s)`); } catch (er) { toast(er.message, true); } t.disabled = false; return; }
    if (a === 'descartar') { S.claude = null; return paint(); }
    if (a === 'deshacer') { Object.assign(g, S.antes); guardar(S.antes, true); S.antes = null; return paint(); }
    if (a === 'ideas') { try { clearTimeout(timer); await enviar(); const r = await api(`guiones/${g.id}/a-ideas`, { method: 'POST', body: {} }); const fr1 = await api(`guiones?profile=${encodeURIComponent(b.slug)}`); S.guiones = fr1.guiones; toast(`En Ideas como «${r.post.title}»`); paint(); } catch (er) { toast(er.message, true); } return; }
    if (a === 'archivar') { if (!(await confirmAsk(`¿Archivar «${g.titulo}»?`))) return; try { await api(`guiones/${g.id}/archivar`, { method: 'POST', body: {} }); S.guiones = S.guiones.filter((x) => x.id !== g.id); S.sel = S.guiones[0]?.id || null; ir(S.sel); paint(); } catch (er) { toast(er.message, true); } }
  };
  el.onchange = async (e) => {
    const t = e.target, g = cur(); if (!g) return;
    if (t.hasAttribute('data-f-img')) {
      const file = t.files?.[0], x = (g.frames || []).find((y) => y.id === S.fr); if (!file || !x) return;
      if (!file.type.startsWith('image/') || file.size > 25e6) { toast('Sube una imagen de hasta 25 MB', true); return; }
      S.subiendo = true; pintarFr();
      try {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
        const d = await uploadToDrive(file, `${b.name || b.slug} · ${g.titulo} · ${x.tramo} ${x.id}.${ext}`, () => {}, { client: b.slug, sub: 'Storyboard' });
        const g2 = cur(); if (g2) { g2.frames = g2.frames.map((y) => (y.id === x.id ? { ...y, imagen: { id: d.id, nombre: d.name, link: d.link } } : y)); guardar({ frames: g2.frames }, true); }
      } catch (er) { toast(er.message, true); }
      S.subiendo = false; if (alive()) pintarFr(); return;
    }
    if (t.dataset.f) {
      if (!S.fr) return; const k = t.dataset.f, v = k === 'seg' ? (t.value === '' ? null : Math.max(0, Math.min(120, +t.value || 0)) || null) : t.value;
      g.frames = (g.frames || []).map((x) => (x.id === S.fr ? { ...x, [k]: v } : x)); guardar({ frames: g.frames }); return pintarFr();
    }
    if (t.dataset.g) { const k = t.dataset.g, v = k === 'consciencia' ? (t.value ? +t.value : null) : t.value || (k === 'titulo' ? g.titulo : null); g[k] = v; guardar({ [k]: v }, k === 'formato'); if (['avatar', 'consciencia', 'angulo'].includes(k)) { const sd = $('#cr-side', el); if (sd) mount(sd, side(g)); } return; }
    if (t.dataset.t) { const i = +t.dataset.i; g.tramos = g.tramos.map((x, j) => (j === i ? { ...x, [t.dataset.t]: t.value } : x)); guardar({ tramos: g.tramos }); }
  };
  el.oninput = (e) => { if (e.target.hasAttribute('data-cr-pedido')) S.pedido = e.target.value; };
  paint();
}
