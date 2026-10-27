// Anuncios de la competencia (Apify · biblioteca de anuncios de Meta): el bloque que vivía en Mis tareas › Ads (screens/work.js, adsComp),
// sacado tal cual para que lo usen Mis tareas y Marketing › Ads Intelligence con el mismo comportamiento y las mismas rutas
// (GET y POST ads/competitors/:slug; el servidor decide quién entra y aplica el alcance por cliente).
// Pinta con html`…`: todo lo que viene de Apify se escapa; los links y las imágenes solo se usan si son https. Solo lee.
import { html, raw, mount, api, toast, fdate, ico, iconFor } from '../core.js';

const FALLO = ['FAILED', 'ABORTED', 'TIMED-OUT'];
const VIGENTE_MS = 2 * 60e3; // lo ya leído se reutiliza un par de minutos (antes vivía en la pantalla de Mis tareas)
const leidos = new Map();    // slug → { at, r }
let ultimo = null;           // el cliente que se eligió la última vez
const https = (u) => (/^https:\/\//i.test(String(u || '')) ? String(u) : '');
const box = (title, sub, body) => html`<div class="card wkbox comp-box"><div class="wkhead"><div><h3 class="wkttl">${iconFor(title)}${title}</h3>${sub ? html`<span class="mut sm">${sub}</span>` : ''}</div><div class="sp"></div></div>${body}</div>`;

// host: dónde se monta · slugs: los clientes entre los que se elige · alive(): ¿sigue en pantalla?
export function competenciaUI(host, { me, slugs = [], alive = () => true } = {}) {
  const lista = [...new Set((Array.isArray(slugs) ? slugs : []).filter(Boolean))];
  let sel = lista.includes(ultimo) ? ultimo : lista[0] || null, comp = null, borrador = null;
  const vivo = () => host.isConnected && alive();

  function leer(forzar = false) {
    if (!sel) return;
    const hit = leidos.get(sel);
    if (!forzar && hit && Date.now() - hit.at < VIGENTE_MS) { comp = { slug: sel, ...hit.r }; return; }
    const slug = sel; comp = { slug, loading: true };
    api('ads/competitors/' + encodeURIComponent(slug)).then((r) => { leidos.set(slug, { at: Date.now(), r }); if (sel === slug) comp = { slug, ...r }; })
      .catch((e) => { if (sel === slug) comp = { slug, error: e.message }; }).then(() => vivo() && paint());
  }
  function paint() {
    if (sel && (!comp || comp.slug !== sel)) leer();
    const running = comp?.run && !comp.items && !FALLO.includes(comp.run.status);
    mount(host, box('Anuncios de la competencia', 'Lo que tienen activo en Meta ahora · Apify', !sel ? html`<div class="mut sm">Sin clientes.</div>` : html`
      <div class="row" style="gap:8px;flex-wrap:wrap"><select class="in" data-comp="sel" style="width:auto">${lista.map((x) => html`<option value="${x}" ${x === sel ? raw('selected') : ''}>${x.toUpperCase()}</option>`)}</select>
        <textarea class="in" data-comp="lista" rows="2" style="flex:1;min-width:220px" placeholder="Una por línea: página de Facebook (https://facebook.com/marca) o el nombre de la marca">${borrador ?? (comp?.competitors || []).join('\n')}</textarea>
        <button class="btn" data-comp="run" ${running ? raw('disabled') : ''}>${running ? 'Scrapeando…' : 'Buscar anuncios'}</button></div>
      ${comp?.error ? html`<div class="warnbox sm" style="margin-top:8px">${comp.error}</div>` : ''}
      ${running ? html`<div class="mut sm" style="margin-top:8px">Apify está leyendo la biblioteca de anuncios (1-3 min). <button class="sm linkish" data-comp="refresh">Ver si ya terminó</button></div>` : ''}
      ${comp?.items?.length ? html`<div class="adsgrid">${comp.items.slice(0, 24).map((a) => html`<a class="adcard" href="${a.id ? `https://www.facebook.com/ads/library/?id=${encodeURIComponent(a.id)}` : https(a.link) || '#'}" target="_blank" rel="noopener noreferrer">
          ${https(a.img) ? html`<img src="${https(a.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : html`<div class="adnoimg">${a.video ? ico('play', 13) : 'Aa'}</div>`}
          <div class="adbody"><b>${a.page}</b>${a.since ? html`<span class="mut sm"> · desde ${fdate(a.since)}</span>` : ''}<div class="sm">${(a.title ? a.title + ' — ' : '') + String(a.text || '').slice(0, 160)}</div>${a.cta ? html`<span class="chip sm2">${a.cta}</span>` : ''}</div></a>`)}</div>`
        : comp?.items ? html`<div class="mut sm" style="margin-top:8px">No encontré anuncios activos de esas marcas.</div>` : ''}
      <div class="mut sm" style="margin-top:10px">Google y LinkedIn: <a href="https://adstransparency.google.com/" target="_blank" rel="noopener noreferrer">Google Ads Transparency ↗</a> · <a href="https://www.linkedin.com/ad-library/" target="_blank" rel="noopener noreferrer">LinkedIn Ad Library ↗</a></div>`));
  }

  // Si el mismo host se monta otra vez, se sueltan los oyentes de la vez anterior (no se acumulan).
  const onInput = (e) => { if (e.target.closest('[data-comp="lista"]')) borrador = e.target.value; };
  const onChange = (e) => { const s = e.target.closest('[data-comp="sel"]'); if (s) { sel = ultimo = s.value; comp = null; borrador = null; paint(); } };
  const onClick = async (e) => {
    const t = e.target.closest('[data-comp]'); if (!t || !host.contains(t)) return;
    if (t.dataset.comp === 'refresh') { leidos.delete(sel); comp = null; paint(); }
    if (t.dataset.comp === 'run') {
      const list = String(host.querySelector('[data-comp="lista"]')?.value || '').split('\n').map((x) => x.trim()).filter(Boolean), slug = sel;
      try { const r = await api('ads/competitors/' + encodeURIComponent(slug), { method: 'POST', body: { list } }); leidos.delete(slug); comp = { slug, ...r }; borrador = null; toast('Buscando anuncios… 1-3 min'); if (vivo()) paint(); } catch (err) { toast(err.message, true); }
    }
  };
  host.__competenciaOff?.();
  host.addEventListener('input', onInput); host.addEventListener('change', onChange); host.addEventListener('click', onClick);
  host.__competenciaOff = () => { host.removeEventListener('input', onInput); host.removeEventListener('change', onChange); host.removeEventListener('click', onClick); };
  ultimo = sel;
  paint();
}
