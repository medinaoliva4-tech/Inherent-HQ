// Review & Approval Studio (herramienta review-approval-studio de Production). SIN Tool Shell: trabaja sobre las fichas de video
// (colección «videos», /api/video). Muestra el reproductor (preview de Drive, YouTube, Vimeo o Loom con embedUrl), la lista de comentarios
// con pin al segundo (clic = salta ahí si el reproductor lo permite; si no, queda el segundo a la vista), el selector de versión con
// comparación lado a lado, Aprobar / Pedir cambios y el caption de la pieza. COO y CEO ven y dejan notas internas; el resto, no.
// Pinta con html`…` (todo se escapa; nada de raw con texto de usuario). Lo vacío dice «⚠️ SIN DATOS» y de dónde sale.
import { html, mount, api, ico, toast, confirmAsk, ask, embedUrl, skel, fdate, $, $$ } from '../core.js';
import { reloj, seg as aSeg } from '../video.js';
import { fallo, vacio } from '../visual.js';

const enc = encodeURIComponent;
const ENREV = (f) => f.revision === 'Pendiente' || f.estado === 'En revisión';
const REV_TXT = { Pendiente: 'Por revisar', Cambios: 'Cambios pedidos', Aprobado: 'Aprobado' };
const vigente = (f) => Math.max(+f.version || 1, ...(f.versiones || []).map((x) => x.v));
const versionDe = (f, v) => (f.versiones || []).find((x) => x.v === v) || null;
const quien = (p) => (p === 'cliente' ? 'Cliente' : p === 'ceo' ? 'CEO' : p === 'coo' ? 'COO' : p || 'Equipo');
// El link de un video con la parte «salta al segundo» cuando el reproductor lo soporta (YouTube y Vimeo); Drive y Loom no.
const srcDe = (link, s) => {
  const e = embedUrl(link); if (!e) return null;
  if (s == null || s < 0) return e;
  const n = Math.floor(s);
  if (e.includes('youtube.com/embed')) return `${e}?start=${n}&autoplay=1`;
  if (e.includes('player.vimeo.com')) return `${e}#t=${n}s`;
  return e;
};
const puedeSaltar = (link) => /youtube\.com\/embed|player\.vimeo\.com/.test(embedUrl(link) || '');
const ratio = (fmt) => ({ '9:16': '9 / 16', '4:5': '4 / 5', '1:1': '1 / 1' }[fmt] || '16 / 9');

// host: dónde se monta · me: quien mira · slug/b: el cliente · alive(): ¿sigue en pantalla? · resto: [fichaId] si viene en la ruta.
export async function reviewTool(host, { me, slug, b, alive, resto = [] } = {}) {
  mount(host, skel('pagina'));
  const veInterno = me?.role === 'ceo' || me?.role === 'coo';
  const S = { fichas: [], puede: false, sel: resto[0] || '', ver: 0, cmp: 0, salto: null, ocupado: false, todas: false };
  let root = null;

  const ficha = () => S.fichas.find((f) => f.id === S.sel) || null;
  const lista = () => S.fichas.filter((f) => S.todas || ENREV(f) || f.revision);
  async function leer() {
    const r = await api(`video?profile=${enc(slug)}`);
    S.fichas = (r.fichas || []).sort((a, z) => (ENREV(z) - ENREV(a)) || String(a.titulo).localeCompare(String(z.titulo)));
    S.puede = Boolean(r.puede?.editar);
    if (!ficha()) S.sel = (lista()[0] || S.fichas[0] || {}).id || '';
    const f = ficha(); if (f) { S.ver = vigente(f); S.cmp = 0; S.salto = null; }
  }
  async function recargar(pintar = true) {
    try { await leer(); } catch (e) { if (alive()) toast(e.message, true); return; }
    if (alive() && pintar) pintarTodo();
  }
  function falla(e) { if (alive()) { toast(e?.message || 'No se pudo completar. Inténtalo de nuevo.', true); if (e?.status === 409) recargar(); } }
  const haz = async (fn) => { if (S.ocupado) return; S.ocupado = true; try { await fn(); } catch (e) { falla(e); } S.ocupado = false; };

  // ---------- Pintar ----------
  const reproductor = (f) => {
    const vs = versionDe(f, S.ver), src = vs ? srcDe(vs.link, S.salto) : null;
    if (!vs) return html`<div class="empty sm"><b>⚠️ SIN DATOS</b>Esta ficha no tiene versiones: salen de Post-Production (versiones por ficha).</div>`;
    if (!src) return html`${fallo({ titulo: 'No puedo mostrar este link aquí', linea: html`${vs.link ? html`<a class="btn ghost" href="${vs.link}" target="_blank" rel="noopener noreferrer">${ico('external-link', 14)} Abrir el video</a>` : '⚠️ SIN DATOS: la versión no trae link. Se agrega en Post-Production.'}` })}`;
    return html`<iframe src="${src}" title="${f.titulo} v${S.ver}" allow="autoplay; fullscreen" allowfullscreen style="width:100%;aspect-ratio:${ratio(f.formato)};max-height:560px;border:0;border-radius:12px;background:#000"></iframe>`;
  };
  const comparacion = (f) => {
    const a = versionDe(f, S.ver), c = versionDe(f, S.cmp); if (!c) return '';
    const una = (vs, n) => { const src = vs ? embedUrl(vs.link) : null; return html`<div style="flex:1;min-width:240px"><div class="sm mut" style="margin-bottom:4px">v${n}${vs?.en ? ` · ${fdate(String(vs.en).slice(0, 10))}` : ''}${vs?.nota ? ` · ${vs.nota}` : ''}</div>${src ? html`<iframe src="${src}" title="v${n}" allowfullscreen style="width:100%;aspect-ratio:${ratio(f.formato)};max-height:420px;border:0;border-radius:12px;background:#000"></iframe>` : html`<div class="empty sm"><b>⚠️ SIN DATOS</b>Sin link en esta versión.</div>`}</div>`; };
    return html`<div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-start;margin-top:12px">${una(a, S.ver)}${una(c, S.cmp)}</div>`;
  };
  const comentarios = (f) => {
    const cs = (f.comentarios || []).filter((c) => veInterno || !c.interno).filter((c) => c.version === S.ver);
    const saltar = puedeSaltar(versionDe(f, S.ver)?.link);
    if (!cs.length) return html`${vacio({ icono: 'inbox', titulo: `Sin comentarios en la v${S.ver}`, linea: 'Salen del cliente (portal) y del equipo; cada uno lleva su segundo.', compacto: true })}`;
    return html`<div class="pd-list">${cs.slice().sort((a, z) => (a.seg ?? -1) - (z.seg ?? -1)).map((c) => html`<div class="pd-li">
      ${c.seg != null ? html`<button class="btn sm ghost" data-seg="${c.seg}" title="${saltar ? 'Saltar a este segundo' : 'Segundo del comentario'}">${ico('clock', 12)} ${reloj(c.seg)}</button>` : html`<span class="chip">General</span>`}
      <span>${c.texto}<small>${quien(c.por)}${c.interno ? ' · interno' : ''}${c.en ? ` · ${fdate(String(c.en).slice(0, 10))}` : ''}</small></span></div>`)}</div>${saltar ? '' : html`<p class="mut sm">Este reproductor no deja saltar al segundo: el pin te dice dónde mirar.</p>`}`;
  };
  function pintarTodo() {
    const f = ficha(), ls = lista();
    if (!S.fichas.length) return mount(host, html`<div class="empty"><b>⚠️ SIN DATOS</b>Todavía no hay videos de esta marca. Las fichas salen de Post-Production y llegan aquí al enviarlas a revisión.</div>`);
    const vs = f ? (f.versiones || []).map((x) => x.v) : [];
    const mia = f && S.puede;
    mount(host, html`<div id="rv" class="stack" style="gap:14px">
      <div class="row" style="gap:10px;flex-wrap:wrap;align-items:center">
        <select class="in" id="rv-f" aria-label="Video" style="max-width:340px">${(ls.length ? ls : S.fichas).map((x) => html`<option value="${x.id}" ${x.id === S.sel ? 'selected' : ''}>${x.titulo}${x.revision ? ` · ${REV_TXT[x.revision] || x.revision}` : ''}</option>`)}</select>
        <label class="sw-row"><input type="checkbox" class="switch" id="rv-t" ${S.todas ? 'checked' : ''}> <span>Ver todos los videos</span></label>
        ${f ? html`<span class="chip ${f.revision === 'Aprobado' ? 'lime' : f.revision === 'Cambios' ? 'amber' : ''}">${f.revision ? REV_TXT[f.revision] || f.revision : 'Sin enviar a revisión'}</span><span class="chip">${f.formato} · v${vigente(f)}${vs.length > 1 ? ` · ${vs.length - 1} ${vs.length === 2 ? 'ronda' : 'rondas'}` : ''}</span>` : ''}
      </div>
      ${f ? html`
      <div class="row" style="gap:10px;flex-wrap:wrap;align-items:center">
        <label class="sm mut" for="rv-v">Versión</label>
        <select class="in" id="rv-v" style="max-width:140px">${vs.map((v) => html`<option value="${v}" ${v === S.ver ? 'selected' : ''}>v${v}${v === vigente(f) ? ' · vigente' : ''}</option>`)}</select>
        ${vs.length > 1 ? html`<label class="sm mut" for="rv-c">Comparar con</label><select class="in" id="rv-c" style="max-width:140px"><option value="0">—</option>${vs.filter((v) => v !== S.ver).map((v) => html`<option value="${v}" ${v === S.cmp ? 'selected' : ''}>v${v}</option>`)}</select>` : ''}
      </div>
      <div id="rv-play">${reproductor(f)}</div>
      ${comparacion(f)}
      ${f.aprobacion ? html`<div class="chip lime">${ico('check', 12)} Aprobada la v${f.aprobacion.v}${f.aprobacion.por ? ` por ${quien(f.aprobacion.por)}` : ''}</div>` : ''}
      ${f.revision_nota ? html`<div class="sm mut">Última nota: «${f.revision_nota}»</div>` : ''}
      <section class="sp-panel"><div class="sp-panel-h row"><h3>${ico('message-square', 15)} Comentarios · v${S.ver}</h3></div>${comentarios(f)}
        ${mia ? html`<form id="rv-form" class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px;align-items:flex-end">
          <input class="in sm" name="seg" placeholder="Segundo (ej. 0:12)" style="max-width:150px" aria-label="Segundo">
          <input class="in" name="texto" placeholder="Comentario" style="flex:1;min-width:200px" aria-label="Comentario" required>
          ${veInterno ? html`<label class="sw-row"><input type="checkbox" class="switch" name="interno"> <span>Nota interna</span></label>` : ''}
          <button class="btn" type="submit">${ico('send', 14)} Comentar</button></form>` : ''}</section>
      <section class="sp-panel"><div class="sp-panel-h row"><h3>Caption</h3></div>${f.caption_pieza ? html`<div style="white-space:pre-wrap">${f.caption_pieza}</div>` : html`<div class="mut sm" id="rv-cap">⚠️ SIN DATOS: sale de la pieza ligada a este video (Calendario).</div>`}</section>
      ${mia ? html`<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-a="aprobar" ${!ENREV(f) || S.ver !== vigente(f) ? 'disabled' : ''}>${ico('check', 14)} Aprobar v${S.ver}</button><button class="btn ghost" data-a="cambios" ${!ENREV(f) ? 'disabled' : ''}>Pedir cambios</button>${!ENREV(f) ? html`<span class="mut sm" style="align-self:center">Solo se revisa lo que está «En revisión».</span>` : S.ver !== vigente(f) ? html`<span class="mut sm" style="align-self:center">Aprobar solo vale sobre la versión vigente (v${vigente(f)}).</span>` : ''}</div>` : html`<div class="mut sm">Solo lectura: tu perfil no edita videos.</div>`}` : ''}
    </div>`);
    root = $('#rv', host);
    cablear();
    pintarCaption(f);
  }
  // El caption sale de la pieza ligada (content, campo caption): se lee una vez por ficha y se pinta sin repintar todo.
  async function pintarCaption(f) {
    if (!f?.post || f.caption_pieza !== undefined) return;
    f.caption_pieza = '';
    try {
      const p = await api(`db/content/${enc(f.post)}`);
      if (p && p.profile === slug && p.caption) { f.caption_pieza = String(p.caption).slice(0, 2200); if (alive() && ficha()?.id === f.id) pintarTodo(); }
    } catch { /* sin permiso o sin pieza: queda «⚠️ SIN DATOS» */ }
  }

  // ---------- Acciones ----------
  function cablear() {
    $('#rv-f', root)?.addEventListener('change', (e) => { S.sel = e.target.value; const f = ficha(); S.ver = f ? vigente(f) : 0; S.cmp = 0; S.salto = null; pintarTodo(); });
    $('#rv-t', root)?.addEventListener('change', (e) => { S.todas = e.target.checked; pintarTodo(); });
    $('#rv-v', root)?.addEventListener('change', (e) => { S.ver = +e.target.value; S.cmp = 0; S.salto = null; pintarTodo(); });
    $('#rv-c', root)?.addEventListener('change', (e) => { S.cmp = +e.target.value; pintarTodo(); });
    $$('[data-seg]', root).forEach((bt) => bt.addEventListener('click', () => { S.salto = +bt.dataset.seg; const f = ficha(); const el = $('#rv-play', root); if (f && el) mount(el, reproductor(f)); }));
    $('#rv-form', root)?.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = ficha(), fd = new FormData(e.target), texto = String(fd.get('texto') || '').trim(), s = String(fd.get('seg') || '').trim();
      if (!texto) return;
      if (s && aSeg(s) == null) return toast('El segundo va como 0:12 o 12', true);
      haz(async () => { await api(`video/${enc(f.id)}/comentarios`, { method: 'POST', body: { texto, seg: s || null, version: S.ver, interno: veInterno && fd.get('interno') === 'on', v: f.v } }); toast('Comentario guardado'); await recargar(); });
    });
    $$('[data-a]', root).forEach((bt) => bt.addEventListener('click', () => {
      const f = ficha(), accion = bt.dataset.a; if (!f) return;
      haz(async () => {
        let body;
        if (accion === 'aprobar') { if (!(await confirmAsk(`¿Aprobar «${f.titulo}» (v${S.ver})? La pieza queda lista para programarse.`))) return; body = { accion, version: S.ver, v: f.v }; }
        else { const r = await ask(`Pedir cambios · ${f.titulo}`, [{ k: 'nota', l: '¿Qué cambiamos?', t: 'textarea', req: true }], 'Enviar'); if (!r) return; body = { accion, version: S.ver, nota: r.nota, v: f.v }; }
        await api(`video/${enc(f.id)}/revision`, { method: 'POST', body });
        toast(accion === 'aprobar' ? 'Aprobado' : 'Cambios pedidos: el video vuelve a edición');
        await recargar();
      });
    }));
  }

  try { await leer(); } catch (e) { if (alive()) mount(host, html`${fallo({ titulo: 'No pude leer los videos', linea: e.status === 403 ? 'Esta marca está fuera de tu alcance.' : e.message })}`); return; }
  if (!alive()) return;
  pintarTodo();
}
