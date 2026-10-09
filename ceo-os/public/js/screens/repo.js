import { html, mount, api, acts, toast, fdate } from '../core.js';
import { repoBadge } from '../app.js';

// Al repo: lo que el equipo propuso escribir en el repo. Nada entra sin el OK del CEO.
const KIND = { roadmap: 'Roadmap', accesos: 'Accesos', competencia: 'Competencia', posts: 'Por postear', doc: 'Library' };

export async function render(el, { alive }) {
  let data = null;
  async function load() { try { data = await api('repo/queue'); } catch (e) { return mount(el, html`<div class="warnbox">${e.message}</div>`); } if (alive()) paint(); repoBadge(); }
  function paint() {
    mount(el, html`<div class="hello"><h1>Al repo</h1><p>Lo que el equipo quiere guardar en el repo. <em>Nada entra sin tu OK.</em></p></div>
      ${!data.ready ? html`<div class="warnbox" style="margin-bottom:16px">Falta <b>GITHUB_TOKEN</b> en Vercel: puedes revisar, pero no aprobar todavía.</div>` : ''}
      ${data.pending.length ? data.pending.map((x) => html`<div class="card" style="margin-bottom:14px">
          <div class="row" style="flex-wrap:wrap;gap:8px"><span class="chip">${KIND[x.kind] || x.kind}</span><b style="font-weight:500;font-size:17px">${x.summary}</b><div class="sp"></div><span class="mut sm">${x.by_name || x.by} · ${fdate(String(x.at).slice(0, 10))}</span></div>
          <div class="mut sm" style="margin:8px 0 10px"><code>${x.path}</code></div>
          ${x.error ? html`<div class="warnbox">${x.error}</div>` : html`<div class="repo-pre">${x.content}</div>`}
          <div class="row" style="margin-top:12px"><button class="btn" data-act="ok" data-id="${x.id}" ${x.error || !data.ready ? 'disabled' : ''}>✓ Aprobar y guardar</button><button class="btn ghost" data-act="no" data-id="${x.id}">Rechazar</button></div></div>`)
        : html`<div class="empty"><b>Nada pendiente</b>Cuando alguien del equipo mande algo al repo, aparece aquí.</div>`}
      ${data.done.length ? html`<div class="sec-title"><h2>Historial</h2></div><div class="card"><table><thead><tr><th>Qué</th><th>Archivo</th><th>Quién</th><th>Estado</th></tr></thead><tbody>${data.done.map((x) => html`<tr><td>${x.summary}</td><td class="mut sm"><code>${x.path}</code></td><td class="mut">${x.by_name || x.by}</td><td><span class="chip ${x.status === 'approved' ? 'green' : ''}">${x.status === 'approved' ? 'Aprobado' : 'Rechazado'}</span></td></tr>`)}</tbody></table></div>` : ''}`);
  }
  const act = (action) => async (t) => { t.disabled = true; try { const r = await api(`repo/queue/${t.dataset.id}`, { method: 'POST', body: { action } }); toast(action === 'reject' ? 'Rechazado' : r.unchanged ? 'El repo ya estaba igual ✅' : 'Guardado en el repo ✅ · se ve en ~1 min'); load(); } catch (e) { t.disabled = false; toast(e.message, true); } };
  acts(el, { ok: act('approve'), no: act('reject') });
  mount(el, html`<p class="loading">Cargando…</p>`);
  load();
}
