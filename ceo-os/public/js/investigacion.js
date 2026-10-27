// Fase 4 · Investigación (Marcas › <marca> › Investigación), en una sola columna:
//   1. una línea de estado: «Última actualización: lunes · 37 posts nuevos · 12 sirven» + «Actualizar ahora» (CEO y COO)
//   2. «Lo que funciona»: 6 a 9 posts con más resonancia que Laya dice que sirven, grandes, con su porqué y «Usar como formato»
//   3. la biblioteca: filtros compactos (formato, categoría, red, búsqueda) y orden por resonancia
//   4. al final, plegado: «Referentes de esta marca» (las 5 categorías y sus cuentas)
// El scraping corre solo (cron de los lunes, webhook de Apify). Laya juzga en segundo plano lo que falte si el puente
// de la compu responde; si no, queda pendiente para Claude Code. content.js solo la monta: research(b) → investigacion(b, …).
import { html, raw, mount, api, toast, fdate, K, md, ask, today, openClaude, ICON, ico, col, confirmAsk, $ } from './core.js';
import { CATS, POR_CAT, REDES, redNombre, catNombre, cuenta } from './referentes.js';
import { layaBox, puenteEstado, juzgarLocal } from './laya-ui.js';
import { ojoEstado, verImagen, ojoChip } from './ojo.js';
import { chipReferente } from './laya.js';
import { tokenDe, saludPuente, preguntar } from './puente-chat.js';
import { resumenAvatar } from './avatares.js';
import { rutaModulo } from './herramientas.js';

const C = col('content');
const safeImg = (u) => (/^https:\/\/[^\s'"()]+$|^\/api\/media\/img-[a-f0-9]{24}$/.test(String(u || '')) ? u : null);
const FMT = [['todo', 'Todo', 'grid'], ['reel', 'Reels', 'video'], ['carrusel', 'Carruseles', 'layers'], ['estatico', 'Estáticos', 'image'], ['video', 'Videos', 'play'], ['texto', 'Texto', 'doc']];
const FMTL = { reel: 'Reel', carrusel: 'Carrusel', estatico: 'Estático', video: 'Video', texto: 'Texto' };
const fmtOf = (it) => it.format || (it.video === false ? 'estatico' : 'reel');
const LEGACY = { nicho: 'Ganadores del nicho', referente: 'Referentes', agregado: 'Agregados a mano' };
const catCorto = (k) => catNombre(k) || LEGACY[k] || 'Agregado';
const redOf = (x) => x?.red || (/tiktok\.com/.test(String(x?.url || '')) ? 'tiktok' : /linkedin\.com/.test(String(x?.url || '')) ? 'linkedin' : /youtu/.test(String(x?.url || '')) ? 'youtube' : 'instagram');
const RESN = { alta: 3, media: 1.5, baja: 0.5 };
const score = (x) => +x.x || RESN[x.resonance] || 0; // la resonancia: ×N su promedio (o la etiqueta de Claude)
const rtitle = (it) => it.title || String(it.text || '').split('\n')[0].slice(0, 80) || `@${it.handle || 'referencia'}`;
const TALK = [['no', 'sin hablar'], ['voz', 'voz en off'], ['si', 'hablando a cámara']];
const TALKL = Object.fromEntries(TALK);
const mss = (n) => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`;
const isoWeek = (d = new Date()) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y) / 864e5 + 1) / 7)).padStart(2, '0')}`; };
const embedOf = (u) => { let m; if ((m = String(u).match(/instagram\.com\/(?:p|reel|reels|tv)\/([\w-]+)/))) return `https://www.instagram.com/p/${m[1]}/embed`; if ((m = String(u).match(/tiktok\.com\/@[^/]+\/video\/(\d+)/))) return `https://www.tiktok.com/embed/v2/${m[1]}`; return null; };
const distinct = (list, f) => { const n = new Map(); for (const x of list) for (const v of [].concat(f(x) || [])) if (v) n.set(v, (n.get(v) || 0) + 1); return [...n].sort((a, z) => z[1] - a[1]).map(([v]) => v); };
// El mismo id que usa el conector para un post de Research (así no se duplica).
async function rsid(profile, url) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${profile}|${String(url).replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase()}`)); return 'rs-' + [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 20); }
// «lunes», «hoy», «ayer» o la fecha.
function cuando(iso) {
  const d = new Date(iso); if (isNaN(d)) return '—';
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 864e5);
  return days <= 0 ? 'hoy' : days === 1 ? 'ayer' : days < 7 ? d.toLocaleDateString('es-GT', { weekday: 'long' }) : fdate(d.toISOString().slice(0, 10));
}
const plural = (n, s, p = s + 's') => `${n} ${n === 1 ? s : p}`;

// ctx: { me, slug, data (repo/content: perfil y pilares), alive, embed, st (estado que vive mientras la marca esté abierta), onPost }
export function investigacion(b, ctx) {
  const { slug, st, alive } = ctx;
  st.f ||= { fmt: 'todo', cat: '', red: ctx.embed?.inspo && ctx.embed.plat ? ctx.embed.plat : '', q: '', sort: 'res' };
  st.tried ||= new Set();
  clearTimeout(st.timer);
  if (!st.d) {
    mount(b, html`<p class="loading">Cargando la investigación…</p>`);
    api(`investigacion?profile=${encodeURIComponent(slug)}`).then((d) => { st.d = d; }).catch((e) => { st.d = { fail: e.message }; })
      .then(() => alive() && b.isConnected && investigacion(b, ctx));
    return;
  }
  if (st.d.fail) return mount(b, html`<div class="warnbox">No pude abrir la investigación: ${st.d.fail}</div><button class="btn ghost xs" style="margin-top:10px" data-iv="reload">Reintentar</button>`), (b.onclick = (e) => { if (e.target.closest('[data-iv="reload"]')) { st.d = null; investigacion(b, ctx); } });
  paint(b, ctx);
  if (st.d.estado?.status === 'running') st.timer = setTimeout(() => recoger(b, ctx), st.polled ? 20000 : 1500);
  layaLote(b, ctx).then(() => ver(b, ctx));
}

// ---------- los datos ----------
const itemsOf = (st) => (st.d.items || []).filter((x) => x.url);
const hayRefs = (D) => Object.values(D.referentes || {}).some((l) => l.length);
// Lo que funciona: lo que rinde arriba de su propio promedio y Laya dice que sirve, por resonancia (6 a 9). Si Laya todavía
// no juzga suficientes, se completa hasta 6 con lo que no ha juzgado y rinde ×1.5 o más (nunca con lo que dijo que no sirve).
export function loQueFunciona(items) {
  const rank = (a, z) => score(z) - score(a) || (z.views || 0) - (a.views || 0);
  const si = items.filter((x) => x.laya?.sirve === true && score(x) >= 1).sort(rank).slice(0, 9);
  // 9 o 6 (filas completas de 3); con menos de 6, lo que haya.
  if (si.length >= 6) return si.slice(0, si.length >= 9 ? 9 : 6);
  const sin = items.filter((x) => x.laya?.sirve == null && score(x) >= 1.5).sort(rank).slice(0, 6 - si.length);
  return [...si, ...sin];
}

// ---------- pintar ----------
function paint(b, ctx) {
  const { st } = ctx, D = st.d;
  mount(b, html`<div class="inv">
    <div id="inv-status"></div>
    <section class="inv-sec" aria-labelledby="inv-top-h"><div class="inv-h"><h2 id="inv-top-h">Lo que funciona</h2><span class="mut sm">Rinde más que su propio promedio y Laya dice que sirve</span></div><div id="inv-top"></div></section>
    <section class="inv-sec" aria-labelledby="inv-lib-h"><div class="inv-h"><h2 id="inv-lib-h">Biblioteca</h2><span class="mut sm" id="inv-n"></span><span class="sp"></span>${D.puede?.editar ? html`<button class="btn xs" data-iv="manual">${ico('plus', 13)} Inspo</button>` : ''}</div>
      <div id="inv-filters"></div><div id="inv-lib"></div></section>
    <div id="inv-refs"></div>
    <div class="inv-mcp mut sm">Claude también sube posts con guardar_research · <button class="inv-link" data-iv="prompt">Copiar instrucción</button>${D.puede?.editar && itemsOf(st).length ? html` · <button class="inv-link" data-iv="clear">Vaciar</button>` : ''}</div>
  </div>`);
  renderStatus(b, ctx); renderTop(b, ctx); renderFilters(b, ctx); renderLib(b, ctx); renderRefs(b, ctx);
  b.onclick = (e) => onClick(e, b, ctx);
  b.onchange = (e) => { const s = e.target.closest('[data-f]'); if (!s || s.tagName !== 'SELECT') return; st.f[s.dataset.f] = s.value; renderLib(b, ctx); };
  b.oninput = (e) => { const s = e.target.closest('input[data-f="q"]'); if (!s) return; st.f.q = s.value; renderLib(b, ctx); };
  const det = $('.inv-refs', b); if (det) det.ontoggle = () => { st.refOpen = det.open; };
}

function renderStatus(b, { st }) {
  const box = $('#inv-status', b); if (!box) return;
  const D = st.d, E = D.estado || {}, L = E.last, items = itemsOf(st);
  const sirven = L ? items.filter((x) => x.scraped_at === L.at && x.laya?.sirve === true).length : 0;
  const listas = (E.runs || []).filter((r) => r.status !== 'READY' && r.status !== 'RUNNING').length;
  let line, sub = '';
  if (!D.apify) { line = 'El scraping automático no está conectado'; sub = `Falta APIFY_TOKEN en Vercel. Lo que ya está aquí sigue igual.${D.cron?.skipped ? ` La última búsqueda automática (${cuando(D.cron.at)}) no corrió.` : ''}`; }
  else if (D.ficha && !D.ficha.activa) line = 'Sin ficha de oferta: la investigación automática de esta marca está bloqueada';
  else if (E.status === 'running') line = `Buscando posts nuevos… ${listas} de ${plural((E.runs || []).length, 'búsqueda')} lista${listas === 1 ? '' : 's'}`;
  else if (L) line = `Última actualización: ${cuando(L.done_at || L.at)} · ${plural(L.nuevos || 0, 'post nuevo', 'posts nuevos')} · ${sirven} ${sirven === 1 ? 'sirve' : 'sirven'}`;
  else if (!hayRefs(D)) line = 'Agrega referentes y la investigación corre sola cada lunes';
  else line = 'Corre sola cada lunes. Todavía no ha corrido.';
  const fallas = (L?.fallas || []).filter((f) => !/no está en la ficha/.test(f.why));
  const fuera = [...new Set((L?.fallas || E.saltadas || []).filter((f) => /no está en la ficha/.test(f.why)).map((f) => redNombre(f.red)))];
  const running = E.status === 'running';
  mount(box, html`<div class="inv-status ${running ? 'running' : ''}" role="status">
      <span class="inv-dot ${running ? 'on' : E.error ? 'warn' : L ? 'ok' : ''}" aria-hidden="true"></span>
      <div class="inv-st-txt"><b>${line}</b>${sub ? html`<span class="mut sm">${sub}</span>` : ''}</div>
      ${D.puede?.actualizar && D.apify && D.ficha?.activa !== false && (hayRefs(D) || E.last) ? html`<button class="btn xs inv-upd" data-iv="update" ${running ? raw('disabled') : ''}>${ico('repeat', 14)} ${running ? 'Buscando…' : 'Actualizar ahora'}</button>` : ''}
    </div>
    ${E.error ? html`<div class="inv-alert" role="alert">${ico('alert', 16)}<span>${E.error.msg}</span></div>` : ''}
    ${E.laya_error ? html`<div class="inv-note mut sm" role="status">Laya no pudo dejar ${plural(E.laya_error.n || 0, 'post', 'posts')} pendiente${E.laya_error.n === 1 ? '' : 's'} de juicio (${E.laya_error.msg}). Se reintenta sola cada día.</div>` : ''}
    ${fallas.length ? html`<div class="inv-note mut sm" title="${fallas.map((f) => `${redNombre(f.red)}${f.handle ? ' @' + f.handle : ''}: ${f.why}`).join('\n')}">Esta vez no se pudo leer ${[...new Set(fallas.map((f) => redNombre(f.red)))].join(' ni ')}. Se intenta de nuevo el lunes.</div>` : ''}
    ${fuera.length ? html`<div class="inv-note mut sm">${fuera.join(' y ')} no ${fuera.length === 1 ? 'está' : 'están'} en la ficha de oferta: no se investiga${fuera.length === 1 ? '' : 'n'}.</div>` : ''}`);
}

// El chip de Laya: «Laya · sirve 84% · gancho».
const layaChip = (it, extra = '') => { const l = it.laya || {}; return html`<span class="chip ly-chip ${l.estado || 'vacio'} ${l.sirve === true ? 'ok' : l.sirve === false ? 'warn' : ''} ${extra}" data-lyid="${it.id}" title="${l.estado === 'pendiente' ? 'Lo juzga el puente de Laya al abrir esta página, o Claude Code (juicios_pendientes)' : 'El juicio de Laya'}">${l.chip || 'Laya · sin juicio'}</span>`; };
function porQue(it, puerta) {
  const w = it.why || {};
  if (w.hook) return `Hook: ${w.hook}`;
  if (w.por_que) return w.por_que;
  const q = (puerta?.preguntas || []).find((x) => x.tipo === 'choice'), desc = it.laya?.por && q?.opciones?.[it.laya.por];
  if (desc) return `Funciona por ${desc.charAt(0).toLowerCase()}${desc.slice(1)}.`;
  if (it.x) return `Rinde ×${it.x} lo normal de @${it.handle || 'la cuenta'}.`;
  return '';
}
function bigCard(it, puerta) {
  const t = safeImg(it.thumb), f = fmtOf(it), why = porQue(it, puerta);
  return html`<article class="inv-card">
    <button class="inv-media ${t ? '' : 'none'}" data-iv="open" data-id="${it.id}" ${t ? raw(`style="background-image:url('${t}')"`) : ''} aria-label="Abrir ${rtitle(it)}">
      ${t ? '' : html`<span class="rnothumb">${ico(f === 'carrusel' ? 'layers' : f === 'estatico' ? 'image' : 'play', 26)}</span>`}
      <span class="rbadge">${catCorto(it.tipo)}</span>${it.x ? html`<span class="inv-x">×${it.x}</span>` : ''}</button>
    <div class="inv-cb">
      <div class="inv-who"><b>@${it.handle || '—'}</b><span class="mut">${[redNombre(redOf(it)), FMTL[f]].filter(Boolean).join(' · ')}</span></div>
      ${why ? html`<p class="inv-why">${why}</p>` : ''}
      <div class="inv-foot">${layaChip(it)}<span data-ojoid="${it.id}">${ojoChip(it.ojo)}</span><button class="btn xs ${it.replicar ? '' : 'ghost'} inv-use" data-iv="use" data-id="${it.id}" aria-pressed="${it.replicar ? 'true' : 'false'}">${it.replicar ? html`${ico('repeat', 13)} Formato a replicar` : 'Usar como formato'}</button></div>
    </div></article>`;
}
function renderTop(b, { st }) {
  const box = $('#inv-top', b); if (!box) return;
  const items = itemsOf(st), top = loQueFunciona(items);
  mount(box, top.length ? html`<div class="inv-top">${top.map((x) => bigCard(x, st.d.puerta))}</div>`
    : html`<p class="inv-empty mut">${items.length ? 'Todavía nada rinde arriba de su promedio con el visto bueno de Laya.' : 'Todavía nada. Se llena con la primera actualización.'}</p>`);
}

function renderFilters(b, { st }) {
  const box = $('#inv-filters', b); if (!box) return;
  const items = itemsOf(st), f = st.f, W = isoWeek();
  const fmts = FMT.filter(([k]) => k === 'todo' || ['reel', 'carrusel', 'estatico'].includes(k) || items.some((x) => fmtOf(x) === k));
  const legacy = Object.keys(LEGACY).filter((k) => items.some((x) => (x.tipo || 'agregado') === k));
  const reds = REDES.filter(([k]) => items.some((x) => redOf(x) === k));
  const opt = (v, l, cur) => html`<option value="${v}" ${cur === v ? raw('selected') : ''}>${l}</option>`;
  mount(box, html`<div class="inv-filters">
    <div class="tabs inv-fmt" role="group" aria-label="Formato">${fmts.map(([k, l, i]) => html`<button class="${f.fmt === k ? 'on' : ''}" data-iv="fmt" data-k="${k}" aria-pressed="${f.fmt === k ? 'true' : 'false'}">${ico(i, 14)} ${l}</button>`)}</div>
    <div class="inv-fsel">
      <select class="in" data-f="cat" aria-label="Categoría">${opt('', 'Todas las categorías', f.cat)}${CATS.map(([k, l]) => opt(k, l, f.cat))}${legacy.map((k) => opt(k, LEGACY[k], f.cat))}${opt('replicar', 'Formatos a replicar', f.cat)}${opt('analisis', 'Con análisis', f.cat)}${opt('semana', `Mi semana · ${items.filter((x) => x.week === W).length}`, f.cat)}</select>
      ${reds.length > 1 || f.red ? html`<select class="in" data-f="red" aria-label="Red">${opt('', 'Todas las redes', f.red)}${REDES.filter(([k]) => reds.some(([r]) => r === k) || f.red === k).map(([k, l]) => opt(k, l, f.red))}</select>` : ''}
      <select class="in" data-f="sort" aria-label="Ordenar">${opt('res', 'Resonancia', f.sort)}${opt('views', 'Más vistas', f.sort)}${opt('recent', 'Más recientes', f.sort)}</select>
    </div>
    <label class="inv-q">${ico('search', 16)}<input class="in" data-f="q" placeholder="Buscar cuenta, tema o hook" value="${f.q}" aria-label="Buscar en la biblioteca"></label>
  </div>`);
}
const SORT = { res: (a, z) => score(z) - score(a) || (z.views || 0) - (a.views || 0), views: (a, z) => (z.views || 0) - (a.views || 0), recent: (a, z) => String(z.at || '').localeCompare(String(a.at || '')) };
const searchOk = (x, q) => !q || [x.title, x.handle, x.text, x.style, ...(x.tags || []), x.pillar, x.why?.hook, x.why?.por_que, x.why?.adaptacion].join(' ').toLowerCase().includes(q);
function tile(it) {
  const t = safeImg(it.thumb), f = fmtOf(it);
  return html`<button class="sp-tile rs-tile" data-iv="open" data-id="${it.id}" aria-label="${rtitle(it)} · @${it.handle || '—'}">
    <span class="rs-thumb ${t ? '' : 'none'}" ${t ? raw(`style="background-image:url('${t}')"`) : ''}>${t ? '' : html`<span class="rnothumb">${ico(f === 'carrusel' ? 'layers' : f === 'estatico' ? 'image' : f === 'texto' ? 'doc' : 'play', 22)}</span>`}
      <span class="rbadge">${it.plantilla ? 'Plantilla' : catCorto(it.tipo)}</span>
      <span class="ricons">${it.replicar ? html`<i title="Formato a replicar">${ico('repeat', 13)}</i>` : ''}${it.why ? html`<i title="Tiene análisis">${ico('bulb', 13)}</i>` : ''}</span></span>
    <span class="rs-body"><b class="rs-title">${rtitle(it)}</b><span class="rs-by">@${it.handle || '—'} · ${redNombre(redOf(it))}</span>
      <span class="rs-data">${it.views ? html`<span>${ico('play', 12)} <b>${K(it.views)}</b></span>` : it.likes ? html`<span>${ico('heart', 12)} <b>${K(it.likes)}</b></span>` : ''}${it.x ? html`<span><b>×${it.x}</b> su promedio</span>` : it.resonance ? html`<span>Resonancia <b>${it.resonance}</b></span>` : ''}</span>
      ${layaChip(it, 'sub')}<span data-ojoid="${it.id}">${ojoChip(it.ojo, { compact: true })}</span></span></button>`;
}
function renderLib(b, { st }) {
  const box = $('#inv-lib', b); if (!box) return;
  const all = itemsOf(st), f = st.f, q = f.q.trim().toLowerCase(), W = isoWeek();
  const catOk = (x) => !f.cat || (f.cat === 'replicar' ? x.replicar === true : f.cat === 'analisis' ? Boolean(x.why) : f.cat === 'semana' ? x.week === W : (x.tipo || 'agregado') === f.cat);
  const list = all.filter((x) => (f.fmt === 'todo' || fmtOf(x) === f.fmt) && catOk(x) && (!f.red || redOf(x) === f.red) && searchOk(x, q)).sort(SORT[f.sort] || SORT.res);
  const n = $('#inv-n', b); if (n) n.textContent = all.length ? (list.length === all.length ? String(all.length) : `${list.length} de ${all.length}`) : '';
  mount(box, list.length ? html`<div class="rs-grid">${list.slice(0, st.more ? 400 : 60).map(tile)}</div>${list.length > 60 && !st.more ? html`<button class="btn ghost xs inv-more" data-iv="more">Ver los ${list.length}</button>` : ''}`
    : html`<p class="inv-empty mut">${all.length ? 'Nada con esos filtros.' : hayRefs(st.d) ? 'Vacía por ahora. Se llena sola cada lunes.' : 'Vacía. Agrega referentes abajo y se llena sola cada lunes.'}</p>`);
}

function renderRefs(b, { st }) {
  const box = $('#inv-refs', b); if (!box) return;
  const D = st.d, R = D.referentes || {}, total = Object.values(R).reduce((a, l) => a + l.length, 0), redes = D.ficha?.redes;
  const open = st.refOpen ?? !total;
  const acc = (a, cat) => html`<span class="inv-acc ${redes && !redes.includes(a.red) ? 'off' : ''}" title="${redes && !redes.includes(a.red) ? `${redNombre(a.red)} no está en la ficha de oferta: no se investiga` : a.source === 'onboarding' ? 'Viene del onboarding del cliente (el repo)' : ''}">
      <a href="${a.url}" target="_blank" rel="noopener noreferrer">@${a.handle}</a><span class="mut">${REDES.find(([k]) => k === a.red)?.[2] || a.red}</span>
      ${a.source === 'app' && D.puede?.editar ? html`<button class="inv-rm" data-iv="rm" data-cat="${cat}" data-red="${a.red}" data-h="${a.handle}" aria-label="Quitar @${a.handle}">${ico('x', 12)}</button>` : ''}</span>`;
  mount(box, html`<details class="inv-refs" ${open ? raw('open') : ''}><summary><span class="inv-sum"><b>Referentes de esta marca</b><span class="mut sm">${total ? plural(total, 'cuenta') : 'Ninguno todavía'}</span></span>${ico('down', 16)}</summary>
    <div class="inv-cats">${CATS.map(([k, l, desc]) => { const list = R[k] || []; return html`<div class="inv-cat">
      <div class="inv-cat-h"><b>${l}</b><span class="mut sm">${list.length}/${POR_CAT}</span></div>
      <div class="inv-cat-b">${list.length ? list.map((a) => acc(a, k)) : html`<span class="mut sm">${desc}. Vacío.</span>`}
        ${D.puede?.editar && list.length < POR_CAT ? html`<button class="inv-add" data-iv="add" data-cat="${k}">+ Agregar referente</button>` : ''}</div></div>`; })}</div>
  </details>`);
  const det = $('.inv-refs', b); if (det) det.ontoggle = () => { st.refOpen = det.open; };
}

// ---------- acciones ----------
async function onClick(e, b, ctx) {
  const { st, slug } = ctx, t = e.target.closest('[data-iv]'); if (!t || !b.contains(t)) return;
  const a = t.dataset.iv, D = st.d;
  if (a === 'fmt') { st.f.fmt = t.dataset.k; renderFilters(b, ctx); renderLib(b, ctx); return; }
  if (a === 'more') { st.more = true; renderLib(b, ctx); return; }
  if (a === 'open') return ropen(t.dataset.id, b, ctx);
  if (a === 'use') return replicar(D.items.find((x) => x.id === t.dataset.id), b, ctx);
  if (a === 'update') {
    t.disabled = true;
    try { const r = await api('investigacion/actualizar', { method: 'POST', body: { profile: slug } }); D.estado = r.estado; st.polled = false; toast(r.ya ? 'Ya está buscando. Espera unos minutos.' : 'Buscando posts nuevos. Tarda unos minutos.'); }
    catch (er) { toast(er.message, true); if (er.code && /^APIFY|NO_APIFY/.test(er.code)) { st.d = null; } }
    return investigacion(b, ctx);
  }
  if (a === 'add') {
    const cat = t.dataset.cat;
    const v = await ask(`Agregar a ${catNombre(cat)}`, [{ k: 'red', l: 'Red', t: 'select', opts: REDES.map(([k, l]) => [k, l]), v: 'instagram' }, { k: 'cuenta', l: 'El @ o el link del perfil', req: true }], 'Agregar');
    if (!v) return;
    const c = cuenta(v.cuenta, v.red); if (!c.ok) return toast(c.error, true);
    try { const r = await api('investigacion/referentes', { method: 'POST', body: { profile: slug, cat, red: v.red, cuenta: v.cuenta } }); D.referentes = r.referentes; st.refOpen = true; renderRefs(b, ctx); renderStatus(b, ctx); toast(`@${c.handle} agregado. Entra en la próxima actualización.`); }
    catch (er) { toast(er.message, true); }
    return;
  }
  if (a === 'rm') {
    try { const q = new URLSearchParams({ profile: slug, cat: t.dataset.cat, red: t.dataset.red, handle: t.dataset.h }); const r = await api(`investigacion/referentes?${q}`, { method: 'DELETE' }); D.referentes = r.referentes; renderRefs(b, ctx); toast(`@${t.dataset.h} quitado`); }
    catch (er) { toast(er.message, true); }
    return;
  }
  if (a === 'prompt') { const p = mcpPrompt(slug); try { await navigator.clipboard.writeText(p); toast('Instrucción copiada: pégasela a Claude'); } catch { toast(p); } return; }
  if (a === 'clear') {
    const all = itemsOf(st);
    if (!(await confirmAsk(`¿Vaciar la investigación de ${ctx.data.profile.name}? Se borran los ${all.length} posts, con su análisis y su plantilla.`))) return;
    try { for (const x of all) await C.remove(x.id); D.items = []; toast('Investigación vacía'); paint(b, ctx); } catch (er) { toast(er.message, true); }
    return;
  }
  if (a === 'manual') return manual(b, ctx);
}
async function replicar(it, b, ctx) {
  if (!it) return;
  const on = !it.replicar;
  try { const r = await api('investigacion/replicar', { method: 'PUT', body: { profile: ctx.slug, id: it.id, replicar: on } }); Object.assign(it, { replicar: r.replicar, v: r.v }); toast(on ? 'Listo: queda como formato a replicar en Ideas y el calendario' : 'Ya no es formato a replicar'); renderTop(b, ctx); renderLib(b, ctx); }
  catch (er) { toast(er.message, true); }
}
// Inspo con un link (IG, TikTok, YouTube o LinkedIn): el OS lee el post solo —cuenta, texto y miniatura— sin gastar créditos.
// Después, en el post: «Escribir en mi voz» (Claude, en tu compu) y «Usar como formato» → Ideas y el calendario.
async function manual(b, ctx) {
  const { st, slug } = ctx;
  const v = await ask('Agregar inspo', [{ k: 'url', l: 'Link del post', req: true, ph: 'https://www.instagram.com/reel/…' }, { k: 'why', l: 'Por qué te sirve (opcional)', t: 'textarea' }], 'Guardar');
  if (!v) return; if (!/^https:\/\/\S+$/.test(v.url)) return toast('El link debe empezar con https://', true);
  toast('Leyendo el post…');
  try {
    const { item, aviso } = await api('investigacion/inspo', { method: 'POST', body: { profile: slug, url: v.url, why: v.why || '' } });
    const cur = st.d.items.find((x) => x.id === item.id);
    st.d.items = [...st.d.items.filter((x) => x.id !== item.id), { ...item, laya: cur?.laya || { estado: 'vacio', chip: 'Laya · sin juicio', sirve: null } }];
    toast(aviso || 'Inspo guardada: ábrela para escribirla en tu voz', Boolean(aviso)); paint(b, ctx); layaLote(b, ctx).then(() => ver(b, ctx)); ropen(item.id, b, ctx);
  } catch (er) { toast(er.message, true); }
}
// «Escribir en mi voz»: Claude (en tu compu, solo lectura) reescribe la inspo como guion de la marca, para su avatar principal.
async function enMiVoz(it, b, ctx, btn) {
  const { slug, data, me } = ctx;
  const tok = tokenDe(me), s0 = await saludPuente();
  if (!s0.on || !s0.listo || !tok) return toast(!s0.on ? 'Enciende el puente de Laya en esta compu (Estrategia te dice cómo)' : !tok ? 'Empareja esta compu una vez en Estrategia › Chat' : 'Al puente le falta el repo o Claude Code: revísalo en Estrategia', true);
  const avs = await api(`avatares?profile=${encodeURIComponent(slug)}`).then((r) => r.avatares.filter((a) => !a.archivado)).catch(() => []);
  const carpeta = slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${slug}`, w = it.why || {};
  const prompt = [`Eres ④ Creatividad de Inherent. Trabajas en SOLO LECTURA. Reescribe esta inspo como guion para la marca ${data.profile.name}, con su voz.`,
    `Lee antes, si existen: inherent/00-PRINCIPIOS.md, ${carpeta}/00-onboarding/plan-contratado.md y la voz de marca en ${carpeta}/02-marca/.`,
    `La inspo (@${it.handle || '—'}, ${it.url}):`, String(it.text || it.title || '').slice(0, 1500), w.hook ? `Hook original: ${w.hook}` : '', w.por_que ? `Por qué sirve: ${w.por_que}` : '',
    avs.length ? `Cliente ideal (el primero es el principal):\n${avs.map((a) => '- ' + resumenAvatar(a)).join('\n')}` : '',
    'Escribe en español de «tú», en Markdown:', '1. Un primer párrafo corto «Tu versión»: la idea en dos líneas.', '2. **Gancho** (3 opciones).', '3. **Guion** por escenas: qué se dice y qué se ve.',
    '4. **Señales para Meta**: qué decir y mostrar para que el video llegue al avatar principal.', '5. **CTA**.', 'No copies el texto original: toma la estructura. Nada de cifras inventadas.'].filter(Boolean).join('\n');
  btn.disabled = true; btn.textContent = 'Claude está escribiendo…';
  try {
    const texto = await preguntar({ prompt, token: tok, onTool: (t) => { btn.textContent = t.slice(0, 40); } });
    const r = await C.save({ ...it, why: { ...w, adaptacion: texto.trim() } });
    Object.assign(it, { why: r.why, v: r.v }); toast('Listo: tu versión quedó en el post'); ropen(it.id, b, ctx);
  } catch (e) { toast(e.message, true); btn.disabled = false; btn.textContent = 'Escribir en mi voz'; }
}
const mcpPrompt = (slug) => `Sube a la Investigación del OS de Inherent lo que encontraste, con el conector de Inherent. Primero llama perfiles() para confirmar el perfil: es «${slug}». Luego guardar_research con perfil «${slug}» y una lista en «posts» (hasta 40 por llamada). Pon el nivel en «tipo» de cada post: competencia, referente-similar, referente-aspiracional, referente-crecimiento o propia. Cada post: url, formato (reel, carrusel o estatico), tipo, creador, fecha, titulo, metricas {vistas, likes, comentarios, duracion_s, multiplicador (vs el promedio de su cuenta), engagement_pct}, miniatura, slides si es carrusel, caption, por_que_funciono {hook, retencion, estructura, por_que, adaptacion}, dificultad (1 a 5), tiempo_grabacion, receta, clips y tags. Antes de subir, revisa con listar_research para no duplicar. No inventes métricas y solo urls https.`;

// ---------- la recogida mientras corre (respaldo del webhook de Apify) ----------
async function recoger(b, ctx) {
  const { st, alive, slug } = ctx;
  if (!alive() || !b.isConnected || !st.d) return;
  st.polled = true;
  try {
    const r = await api('investigacion/recoger', { method: 'POST', body: { profile: slug } });
    if (!alive() || !b.isConnected) return;
    if (r.estado.status === 'running') { st.d.estado = r.estado; renderStatus(b, ctx); st.timer = setTimeout(() => recoger(b, ctx), 20000); return; }
    st.d = null; toast('La investigación está al día'); investigacion(b, ctx);
  } catch { st.timer = setTimeout(() => recoger(b, ctx), 30000); }
}

// ---------- Laya en lote, en segundo plano ----------
// Si el puente de esta compu responde, juzga lo que falte (máx. 40 por visita, lo de más resonancia primero), uno por uno,
// sin trabar la página: cada chip se pone al día solo. Sin puente, todo queda pendiente para Claude Code.
async function layaLote(b, ctx) {
  const { st, alive } = ctx;
  if (st.judging || !st.d?.puede?.editar) return;
  const falta = itemsOf(st).filter((x) => x.laya?.estado !== 'listo' && !st.tried.has(x.id)).sort((a, z) => score(z) - score(a)).slice(0, 40);
  if (!falta.length) return;
  const pe = await puenteEstado(); if (!pe.on || pe.error) return;
  st.judging = true;
  let fallos = 0, hechos = 0;
  for (const it of falta) {
    if (!alive() || fallos >= 2) break;
    st.tried.add(it.id);
    try {
      const t = await api(`laya/texto?coll=content&id=${encodeURIComponent(it.id)}`);
      const resultado = await juzgarLocal(t);
      const r = await api('laya/juicios', { method: 'POST', body: { coll: 'content', id: it.id, engine: 'laya-local', resultado } });
      it.laya = chipReferente(r.resumen, st.d.puerta); hechos++;
      document.querySelectorAll(`[data-lyid="${it.id}"]`).forEach((ch) => { const sub = ch.classList.contains('sub'); ch.outerHTML = String(layaChip(it, sub ? 'sub' : '')); });
    } catch { fallos++; }
  }
  st.judging = false;
  if (hechos && alive() && b.isConnected) { renderTop(b, ctx); renderStatus(b, ctx); }
}
// El ojo visual: cada referente con imagen que todavía no tiene su parecido con la marca. Corre después de Laya, de a pocos.
async function ver(b, ctx) {
  const { st, slug, alive } = ctx;
  if (st.viendo || !st.d?.puede?.editar) return;
  const falta = itemsOf(st).filter((x) => safeImg(x.thumb) && !x.ojo && !st.vistos?.has(x.id)).sort((a, z) => score(z) - score(a)).slice(0, 24);
  if (!falta.length) return;
  const e = await ojoEstado(); if (!e.on || !e.disponible || !e.listo) return;
  st.viendo = true; st.vistos ||= new Set();
  let fallos = 0;
  for (const it of falta) {
    if (!alive() || fallos >= 2) break;
    st.vistos.add(it.id);
    try {
      const r = await verImagen(slug, { url: safeImg(it.thumb) }); if (!r) break;
      it.ojo = r;
      try { const { laya, ...base } = it; await C.save({ ...base, ojo: r }); } catch { /* se queda en memoria */ }
      document.querySelectorAll(`[data-ojoid="${it.id}"]`).forEach((ch) => { ch.innerHTML = String(ojoChip(r, { compact: ch.closest('.rs-tile') !== null })); });
    } catch { fallos++; }
  }
  st.viendo = false;
}

// ---------- el detalle: el post en grande, la cuenta, las acciones y el análisis (un sheet lateral) ----------
function ropen(id, b, ctx) {
  const { st, slug, data } = ctx, items = itemsOf(st), it = items.find((x) => x.id === id); if (!it) return;
  const w = it.why || {}, em = embedOf(it.url), t = safeImg(it.thumb), f = fmtOf(it), slides = (it.slides || []).map(safeImg).filter(Boolean);
  const stats = [it.views && [K(it.views), 'Vistas'], !it.views && it.likes && [K(it.likes), 'Likes'], it.x && [`×${it.x}`, 'Su promedio'], it.dur && [mss(it.dur), 'Duración'], it.diff && [`${it.diff}/5`, 'Dificultad'], it.er && !it.diff && [`${it.er}%`, 'Engagement']].filter(Boolean);
  const chips = [it.pillar && [it.pillar, 'on'], it.style && [it.style], it.talk && [TALKL[it.talk]], it.rec && [`${it.rec} grabando`], ...(it.tags || []).map((x) => [x])].filter(Boolean);
  // «adaptacion»: el primer párrafo es «Tu versión»; lo demás (texto en pantalla, clips, receta) va a Análisis.
  const ad = String(w.adaptacion || '').trim(), cut = ad.search(/\n\s*\n|\n(?=\s*(#|[-*•]|\d+[.)]|\*\*))/), mine = cut > 0 ? ad.slice(0, cut).trim() : ad, analysis = cut > 0 ? ad.slice(cut).trim() : '';
  const styleOpts = distinct(items, (x) => x.style), pillarOpts = [...new Set([...(data.cfg?.pillars || []).map((x) => x.name), ...distinct(items, (x) => x.pillar)])].filter(Boolean);
  const receta = it.receta || [], clips = it.clips || [], edit = st.d.puede?.editar;
  document.querySelector('.rsheet')?.remove();
  const v = document.createElement('div'); v.className = 'rsheet';
  mount(v, html`<aside class="sp-sheet rv-sheet" role="dialog" aria-modal="true" aria-label="${rtitle(it)}">
    <div class="row rv-head"><div class="rv-acc"><span class="rv-av">${(it.handle || '?')[0].toUpperCase()}</span><div style="min-width:0"><b>@${it.handle || '—'}</b><div class="sm mut">${[redNombre(redOf(it)), FMTL[f], catCorto(it.tipo)].filter(Boolean).join(' · ')}</div></div></div><div class="sp"></div><button class="arrow light" data-v="close" title="Cerrar" aria-label="Cerrar">${ico('x', 16)}</button></div>
    <div class="rv-media" id="rvmedia">${f === 'reel' && em ? html`<div class="rv-poster">${t ? html`<img src="${t}" alt="">` : ''}<span class="rv-load">Cargando video…</span></div>`
        : slides.length ? html`<div class="rv-slides">${slides.map((u) => html`<div style="background-image:url('${u}')"></div>`)}</div>`
        : html`<div class="rv-poster" ${t ? raw(`style="background-image:url('${t}')"`) : ''}>${t ? '' : html`<span class="rnothumb">${ico(f === 'reel' ? 'play' : f === 'carrusel' ? 'layers' : 'image', 26)}</span>`}</div>`}</div>
    <div class="rv-actions">${edit ? html`<button class="btn ${it.replicar ? '' : 'ghost'} rv-rep" data-v="rep" aria-pressed="${it.replicar ? 'true' : 'false'}">${ico('repeat', 15)} ${it.replicar ? 'Formato a replicar' : 'Usar como formato'}</button>` : ''}${edit ? html`<a class="btn ghost rv-guion" href="${rutaModulo(slug, 'creacion', ['nuevo', `inspo:${it.id}`])}">${ico('edit', 15)} Convertir en guion</a>` : ''}${edit ? html`<button class="btn ghost rv-voz" data-v="voz">${ico('edit', 15)} Escribir en mi voz</button>` : ''}<button class="btn rv-use" data-v="use">${ICON.sparkle} Usar plantilla</button>${edit ? html`<button class="btn ghost" data-v="plan" title="Agendar en el calendario de publicación">${ico('plus', 16)} Agendar</button>` : ''}
      ${/^https:\/\//.test(it.url) ? html`<a class="arrow light" href="${it.url}" target="_blank" rel="noopener noreferrer" title="Abrir el original" aria-label="Abrir el original">${ico('globe', 17)}</a>` : ''}${edit ? html`<button class="arrow light" data-v="del" title="Quitar de la investigación" aria-label="Quitar de la investigación">${ico('trash', 17)}</button>` : ''}</div>
    <div class="rv-info">
      <div class="rfc-head"><h2>${rtitle(it)}</h2>${it.x ? html`<span class="rfc-res ${it.x >= 2 ? 'alta' : it.x >= 1 ? 'media' : 'baja'}">×${it.x}</span>` : it.resonance ? html`<span class="rfc-res ${it.resonance}">${it.resonance}</span>` : ''}</div>
      ${stats.length ? html`<div class="rfc-stats">${stats.map(([v2, l]) => html`<div><b>${v2}</b><span>${l}</span></div>`)}</div>` : ''}
      ${chips.length ? html`<div class="rfc-chips">${chips.map(([l, c]) => html`<span class="${c || ''}">${l}</span>`)}</div>` : ''}
      <div id="laya-ref"></div>
      ${w.hook ? html`<div class="rfc-sec"><span class="lbl">Hook</span><p>${w.hook}</p></div>` : ''}
      ${mine ? html`<div class="rfc-sec"><span class="lbl">Tu versión</span><div class="rfc-md">${md(mine)}</div></div>` : ''}
      ${!it.why ? html`<div class="rfc-sec"><p class="mut">Todavía sin análisis. Claude lo desglosa y lo sube aquí.</p><button class="btn xs" data-v="ask">Pedir el análisis a Claude</button></div>` : ''}
      ${receta.length || clips.length ? html`<details class="rfc-more" open><summary>Cómo se hace</summary>
        ${receta.length ? html`<div class="rfc-sec"><span class="lbl">Receta</span><ol>${receta.map((x) => html`<li>${x}</li>`)}</ol></div>` : ''}
        ${clips.length ? html`<div class="rfc-sec"><span class="lbl">Clips</span><ul class="rfc-clips">${clips.map((c) => html`<li>${c.t ? html`<b>${c.t}</b>` : ''}<span>${c.que}</span></li>`)}</ul></div>` : ''}
      </details>` : ''}
      ${w.estructura?.length || w.retencion || w.por_que ? html`<details class="rfc-more" id="rvwhy"><summary>Por qué funciona</summary>
        ${w.estructura?.length ? html`<div class="rfc-sec"><span class="lbl">Estructura</span><ol>${w.estructura.map((x) => html`<li>${x}</li>`)}</ol></div>` : ''}
        ${w.retencion ? html`<div class="rfc-sec"><span class="lbl">Qué retuvo</span><p>${w.retencion}</p></div>` : ''}
        ${w.por_que ? html`<div class="rfc-sec"><span class="lbl">Por qué funcionó${w.inferido ? ' · inferido' : ''}</span><p>${w.por_que}</p></div>` : ''}
      </details>` : ''}
      ${analysis || it.text ? html`<details class="rfc-more"><summary>Análisis</summary>
        ${analysis ? html`<div class="rfc-sec"><div class="rfc-md">${md(analysis)}</div></div>` : ''}
        ${it.text ? html`<div class="rfc-sec"><span class="lbl">Texto del post</span><p class="mut">${String(it.text).slice(0, 800)}</p></div>` : ''}
      </details>` : ''}
      ${it.plantilla ? html`<details class="rfc-more rfc-tpl" open><summary>Plantilla para ${data.profile.name}</summary><div class="rfc-md">${md(it.plantilla)}</div></details>` : ''}
      <div class="rfc-foot">${/^https:\/\//.test(it.url) ? html`<a href="${it.url}" target="_blank" rel="noopener noreferrer">Ver original @${it.handle || '—'} ↗</a>` : html`<span></span>`}${edit ? html`<button class="rfc-btn ${it.tested ? 'on' : ''}" data-v="tested">${it.tested ? '✓ Probado' : 'Marcar probado'}</button>` : ''}</div>
      ${edit ? html`<details class="rfc-edit"><summary>Etiquetas</summary>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="chip ${it.week === isoWeek() ? 'dark' : ''}" data-v="week">${it.week === isoWeek() ? '✓ En mi semana' : '+ A mi semana'}</button></div>
        <div class="grid g2 rtags" style="gap:8px;margin-top:10px;border:0;padding:0">
          <label class="sm">Resonancia<select class="in" data-tag="resonance"><option value="">${it.x ? `auto: ×${it.x}` : '—'}</option>${['alta', 'media', 'baja'].map((x) => html`<option ${it.resonance === x ? raw('selected') : ''}>${x}</option>`)}</select></label>
          <label class="sm">¿Hablas?<select class="in" data-tag="talk"><option value="">—</option>${TALK.map(([v2, l]) => html`<option value="${v2}" ${it.talk === v2 ? raw('selected') : ''}>${l}</option>`)}</select></label>
          <label class="sm">Tipo<input class="in" data-tag="style" list="rv-styles" value="${it.style || ''}" placeholder="—"><datalist id="rv-styles">${styleOpts.map((x) => html`<option value="${x}">`)}</datalist></label>
          <label class="sm">Pilar<input class="in" data-tag="pillar" list="rv-pillars" value="${it.pillar || ''}" placeholder="—"><datalist id="rv-pillars">${pillarOpts.map((x) => html`<option value="${x}">`)}</datalist></label>
        </div></details>` : ''}
    </div></aside>`);
  document.body.appendChild(v); requestAnimationFrame(() => v.classList.add('on'));
  layaBox(v.querySelector('#laya-ref'), { coll: 'content', id: it.id }); // Fase 3 · Laya: ¿sirve para esta marca?
  // El video se ve aquí mismo: el servidor saca el link directo del reel (caduca, por eso se pide al abrir). Si Instagram no lo deja, queda la miniatura.
  if (f === 'reel' && em) {
    const box = $('#rvmedia', v), fallback = () => { const l = box.querySelector('.rv-load'); if (l) l.outerHTML = `<a class="rv-load rv-ext" href="${it.url}" target="_blank" rel="noopener noreferrer">No deja verlo aquí · Abrir ↗</a>`; };
    if (!/instagram\.com/.test(it.url)) fallback();
    else fetch('/api/content/video?' + new URLSearchParams({ url: it.url })).then((r) => (r.ok ? r.json() : {})).then(({ src }) => {
      const p = box.querySelector('.rv-poster'); if (!p) return; if (!src) return fallback();
      const vd = document.createElement('video'); Object.assign(vd, { src, controls: true, autoplay: true, muted: true, loop: true, playsInline: true }); if (t) vd.poster = t;
      vd.setAttribute('referrerpolicy', 'no-referrer');
      let viaOS = false; vd.onerror = () => { if (viaOS) { vd.replaceWith(p); return fallback(); } viaOS = true; vd.src = '/api/content/stream?' + new URLSearchParams({ u: src }); vd.play?.().catch(() => {}); };
      p.replaceWith(vd);
    }).catch(fallback);
  }
  const close = () => { v.remove(); removeEventListener('keydown', esc); }, esc = (e) => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', esc); addEventListener('hashchange', close, { once: true });
  const save = async (patch) => { const { laya, ...base } = it; const r = await C.save({ ...base, ...patch }); Object.assign(it, r, { laya }); return it; };
  const tag = async (patch, msg) => { try { await save(patch); toast(msg); renderLib(b, ctx); } catch (er) { toast(er.message, true); } };
  v.querySelectorAll('[data-tag]').forEach((sl) => { sl.onchange = () => tag({ [sl.dataset.tag]: sl.value.trim().slice(0, 80) }, 'Etiqueta guardada'); });
  v.onclick = async (e) => {
    if (e.target === v) return close();
    const tg = e.target.closest('[data-v="week"],[data-v="tested"]');
    if (tg) { const on = tg.dataset.v === 'week' ? it.week !== isoWeek() : !it.tested; await tag(tg.dataset.v === 'week' ? { week: on ? isoWeek() : '' } : { tested: on }, tg.dataset.v === 'week' ? (on ? 'Agregado a tu semana' : 'Quitado de tu semana') : on ? 'Marcado como probado' : 'Quitado de probados');
      tg.classList.toggle('dark', on); tg.classList.toggle('on', on); tg.textContent = tg.dataset.v === 'week' ? (on ? '✓ En mi semana' : '+ A mi semana') : on ? '✓ Probado' : 'Marcar probado'; return; }
    const a = e.target.closest('[data-v]')?.dataset.v; if (!a) return;
    if (a === 'close') close();
    if (a === 'rep') { await replicar(it, b, ctx); const r = v.querySelector('[data-v="rep"]'); if (r) { r.classList.toggle('ghost', !it.replicar); r.setAttribute('aria-pressed', String(Boolean(it.replicar))); mount(r, html`${ico('repeat', 15)} ${it.replicar ? 'Formato a replicar' : 'Usar como formato'}`); } }
    if (a === 'del') { if (!(await confirmAsk('¿Quitar este post de la investigación?'))) return; try { await C.remove(it.id); st.d.items = st.d.items.filter((x) => x.id !== it.id); close(); toast('Quitado'); paint(b, ctx); } catch (er) { toast(er.message, true); } return; }
    if (a === 'use') { openClaude(usePrompt(it, ctx)); toast('Se abrió Claude Code con todo listo: dale enviar'); }
    if (a === 'voz') return enMiVoz(it, b, ctx, e.target.closest('[data-v]'));
    if (a === 'ask') { openClaude(whyPrompt(it, ctx)); toast('Se abrió Claude Code: dale enviar. Cuando termine, vuelve a abrir la investigación'); }
    if (a === 'plan') {
      const x = await ask('Agendar en Publicación', [{ k: 'title', l: 'Idea', v: `Basado en @${it.handle || 'referencia'}`, req: true }, { k: 'date', l: 'Fecha', t: 'date', v: today(), req: true, half: true }, { k: 'format', l: 'Formato', t: 'select', opts: ['Reel', 'Carrusel', 'Estático', 'TikTok', 'Story'], v: f === 'carrusel' ? 'Carrusel' : f === 'estatico' ? 'Estático' : 'Reel', half: true }], 'Agendar');
      if (!x) return;
      try { await C.create({ kind: 'post', profile: slug, title: x.title, date: x.date, format: x.format, status: 'Idea', caption: `Referencia: ${it.url}`, replica_de: it.id }); ctx.onPost?.(); toast('Agendado en Calendario → Publicación'); } catch (er) { toast(er.message, true); }
    }
  };
}
const vidLine = (it) => [it.url, `@${it.handle || '—'}`, redNombre(redOf(it)), it.views && `${it.views} vistas`, it.likes && `${it.likes} likes`, it.x && `${it.x}× su promedio`].filter(Boolean).join(' · ');
// «Usar plantilla»: abre Claude Code con todo listo. Lee el brand kit de la marca y entrega el video como plantilla terminada.
function usePrompt(it, { slug, data }) {
  const p = data.profile, r = p.root;
  return `/inherent ④ Creatividad · ${p.name}: convierte este post de referencia en una plantilla terminada para la marca.

Post: ${it.url}${it.title ? ` («${it.title}»)` : ''}
1. Lee el post completo con el conector de Inherent: leer_research, perfil «${slug}», ese url (trae métricas, hook, tu versión, receta, clips y por qué funcionó).
2. Lee ${r}/CLAUDE.md y el brand kit: ${r}/02-marca/ y los links de Figma y Drive en ${r}/00-onboarding/LINKS.md. Si no está ahí, búscalo y dime dónde quedó.
3. Del post toma solo el craft (formato, hook, ritmo, estructura, edición); el tema sale de la estrategia (${r}/01-estrategia/).
4. Entrega la plantilla con estas secciones, en Markdown: ## Hook (texto y visual) · ## Guion por escena (tiempos) · ## Tomas · ## Texto en pantalla · ## Música y ritmo · ## Edición · ## Assets de la marca (fondos, logos, tipografías, hex).
5. Súbela con guardar_research: perfil «${slug}», ese url y la plantilla en «plantilla».`;
}
function whyPrompt(it, { slug, data }) {
  const p = data.profile;
  return `/inherent ④ Creatividad · ${p.name}: desglosa por qué funcionó este post.

Post: ${vidLine(it)}
${it.text ? `Texto del post: ${String(it.text).replace(/\s+/g, ' ').slice(0, 300)}\n` : ''}
Ábrelo si puedes. Si no puedes verlo, deduce del texto y las métricas y márcalo como inferido.
Devuelve: el hook (lo que pasa o se dice en los primeros 3 segundos), qué retuvo a la gente, la estructura en beats, por qué funcionó y cómo lo adaptaría ${p.name} (su estrategia está en ${p.root}/01-estrategia/).
Súbelo al OS con el conector de Inherent: guardar_research con perfil «${slug}» y en «posts» este post: url, titulo, metricas {vistas, likes, comentarios, duracion_s, multiplicador}, dificultad (1 a 5), tiempo_grabacion, receta, clips {tiempo, que}, tags y por_que_funciono {hook, retencion, estructura, por_que, adaptacion (el primer párrafo es tu versión para la marca), inferido}.`;
}
