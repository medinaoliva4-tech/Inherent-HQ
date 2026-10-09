import { html, raw, mount, api, toast, acts, fdate, K, md, csv, $ } from '../core.js';

// Content lee el folder del perfil en el repo. La app no inventa guiones: los escribe ④ Creatividad
// en Claude Code y aquí se ven. Las cuentas también salen del repo; Apify solo las scrapea.
const RED = { instagram: 'Instagram', tiktok: 'TikTok' };
const safeImg = (u) => (/^https:\/\/[^\s'"()]+$/.test(String(u || '')) ? u : null);

export async function render(el, { sub, alive }) {
  let slug = sub[1] || localStorage.getItem('content.profile') || 'inherent';
  let tab = ['guiones', 'plan', 'winners', 'cuentas'].includes(sub[0]) ? sub[0] : 'guiones';
  let data = null, mes = null, file = null, win = null, winErr = null, poll = null;

  async function load() {
    try { data = await api(`repo/content?profile=${encodeURIComponent(slug)}`); } catch (e) { return mount(el, html`<div class="empty"><b>No pude leer el repo</b>${e.message}</div>`); }
    slug = data.profile.slug; mes = data.profile.months[0]?.mes || null; file = null; win = null;
    try { localStorage.setItem('content.profile', slug); } catch {}
    paint();
  }
  const root = () => data.profile.root;
  const months = () => data.profile.months;
  const filesOf = (pred) => (months().find((m) => m.mes === mes)?.files || []).filter(pred);

  function paint() {
    if (!alive()) return;
    const p = data.profile;
    mount(el, html`
      <div class="hello"><h1>Content</h1><p>Lo que dice el repo de <em>${p.name}</em>.</p></div>
      <div class="row" style="margin-bottom:16px;gap:8px;flex-wrap:wrap">${data.profiles.map((x) => html`<button class="chip ${x.slug === slug ? 'dark' : ''}" data-act="prof" data-s="${x.slug}" style="padding:9px 16px;font-size:13px">${x.name}</button>`)}</div>
      <div class="row" style="margin-bottom:16px;flex-wrap:wrap">
        <div class="tabs" style="margin:0">${[['guiones', 'Guiones'], ['plan', 'Planner'], ['winners', 'Winners'], ['cuentas', 'Cuentas']].map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>
        <div class="sp"></div>
        ${(tab === 'guiones' || tab === 'plan') && months().length ? html`<select class="in" id="mes" style="width:auto">${months().map((m) => html`<option value="${m.mes}" ${m.mes === mes ? raw('selected') : ''}>${m.mes}</option>`)}</select>` : ''}
        ${tab === 'winners' ? html`<button class="btn" data-act="scrape">Scrapear ahora</button>` : ''}
      </div>
      <div id="cbody"></div>`);
    ({ guiones, plan, winners, cuentas })[tab]($('#cbody', el));
    const sel = $('#mes', el); if (sel) sel.onchange = () => { mes = sel.value; file = null; paint(); };
  }

  // ---------- Guiones: 04-contenido/<mes>/ideas/*.md ----------
  function guiones(b) {
    const list = filesOf((f) => /\.md$/i.test(f.name) && f.area === 'ideas');
    const others = filesOf((f) => /\.md$/i.test(f.name) && f.area !== 'ideas');
    if (!list.length && !others.length) return mount(b, html`<div class="empty"><b>Todavía no hay guiones en el repo</b>
      Los escribe ④ Creatividad en <code>${root()}/04-contenido/AAAA-MM/ideas/</code>.<br>Pídelos en Claude Code con <code>/creatividad</code> y aparecen aquí después de publicar.</div>`);
    const all = [...list, ...others];
    const cur = all.find((f) => f.path === file) || all[0];
    mount(b, html`<div class="grid" style="grid-template-columns:260px 1fr;gap:16px;align-items:start">
      <div class="card" style="padding:12px">${all.map((f) => html`<button class="artifact" data-act="file" data-p="${f.path}" style="width:100%;margin:4px 0;${f.path === cur.path ? 'outline:2px solid var(--ink)' : ''}"><span class="fi">${f.area === 'ideas' ? '✎' : '▤'}</span><div style="text-align:left;min-width:0"><b style="font-weight:500;overflow-wrap:anywhere">${f.name.replace(/\.md$/, '')}</b><div class="mut" style="font-size:11px">${f.area}</div></div></button>`)}</div>
      <div class="card" style="min-width:0"><div class="mut sm" style="margin-bottom:8px">${root()}/04-contenido/${mes}/${cur.path}</div>${md(cur.content)}</div></div>`);
  }

  // ---------- Planner: plan-de-contenido.csv ----------
  function plan(b) {
    const f = filesOf((x) => /plan-de-contenido\.csv$/i.test(x.name))[0];
    if (!f) return mount(b, html`<div class="empty"><b>No hay plan de contenido este mes</b>Lo arma ④ Creatividad en <code>${root()}/04-contenido/${mes || 'AAAA-MM'}/ideas/plan-de-contenido.csv</code>.</div>`);
    const [head, ...rows] = csv(f.content);
    mount(b, html`<div class="card tscroll"><div class="mut sm" style="margin-bottom:8px">${rows.length} piezas · del repo</div><table><thead><tr>${head.map((h) => html`<th>${h}</th>`)}</tr></thead><tbody>${rows.map((r) => html`<tr>${head.map((_, i) => html`<td>${r[i] || ''}</td>`)}</tr>`)}</tbody></table></div>`);
  }

  // ---------- Winners: Apify sobre las cuentas del repo ----------
  async function loadWinners() {
    try { win = await api(`content/winners?profile=${encodeURIComponent(slug)}`); winErr = null; } catch (e) { win = { items: [] }; winErr = e.message; }
    clearTimeout(poll);
    if (win.status === 'running') poll = setTimeout(() => { if (alive() && tab === 'winners') { win = null; winners($('#cbody', el)); } }, 20000);
  }
  function winners(b) {
    if (!win) { mount(b, html`<p class="loading">Cargando winners…</p>`); loadWinners().then(() => alive() && tab === 'winners' && b.isConnected && winners(b)); return; }
    const p = data.profile;
    const head = html`<div class="row" style="margin-bottom:14px;flex-wrap:wrap;gap:10px">
      ${win.at ? html`<span class="mut sm">Último scrape: ${fdate(win.at.slice(0, 10))}${win.status === 'running' ? ' · corriendo en Apify, se actualiza solo…' : ''}</span>` : html`<span class="mut sm">Todavía no se ha scrapeado este perfil.</span>`}
      <div class="sp"></div><label class="check" style="padding:0"><input type="checkbox" data-act="auto" ${win.auto ? raw('checked') : ''}> Scrape diario</label></div>`;
    if (winErr) return mount(b, html`${head}<div class="warnbox">${winErr}</div>`);
    if (!data.apify) return mount(b, html`${head}<div class="warnbox">Falta conectar Apify: agrega <b>APIFY_TOKEN</b> en las variables de Vercel (Sensitive) y vuelve a publicar.</div>`);
    if (!p.own.length && !p.competitors.length) return mount(b, html`${head}<div class="empty"><b>Este perfil no tiene cuentas en el repo</b>Mira la pestaña Cuentas para saber dónde se agregan.</div>`);
    if (!win.items.length) return mount(b, html`${head}<div class="empty"><b>${win.status === 'running' ? 'Apify está scrapeando…' : 'Sin resultados todavía'}</b>${win.status === 'running' ? 'Tarda unos minutos. Esta pantalla se actualiza sola.' : 'Dale «Scrapear ahora».'}</div>`);
    mount(b, html`${head}<div class="mut sm" style="margin-bottom:12px">Ordenado por cuántas veces supera el promedio <b>de su propia cuenta</b>.</div>
      <div class="grid g4">${win.items.map((it) => { const t = safeImg(it.thumb);
        return html`<a class="card win" href="${/^https:\/\//.test(it.url) ? it.url : '#'}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;padding:12px">
          <div class="thumb" ${t ? raw(`style="background-image:url('${t}')"`) : ''}><b>${it.x}×</b></div>
          <div class="row sm"><b style="font-weight:500">@${it.handle}</b><span class="mut">${RED[it.red]}</span><div class="sp"></div><span class="mut">${it.at ? fdate(it.at.slice(0, 10)) : ''}</span></div>
          <div class="row sm" style="gap:12px">${it.views ? html`<span>▶ ${K(it.views)}</span>` : ''}<span>♥ ${K(it.likes)}</span><span>💬 ${K(it.comments)}</span></div>
          <div class="cap mut">${it.text}</div></a>`; })}</div>`);
  }

  // ---------- Cuentas: LINKS.md + investigación ----------
  function cuentas(b) {
    const p = data.profile;
    const acc = (a) => html`<a class="artifact" href="${a.red === 'tiktok' ? `https://www.tiktok.com/@${a.handle}` : `https://www.instagram.com/${a.handle}/`}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin:6px 0"><span class="fi">${a.red === 'tiktok' ? '♪' : '◎'}</span><div><b style="font-weight:500">@${a.handle}</b><div class="mut" style="font-size:11px">${RED[a.red]}${a.source ? ' · ' + a.source : ''}</div></div></a>`;
    mount(b, html`<div class="grid g2" style="align-items:start">
      <div class="card"><h3 style="font-weight:500;font-size:20px">Cuentas propias</h3>
        <div class="mut sm" style="margin:4px 0 10px">De <code>${root()}/00-onboarding/LINKS.md</code></div>
        ${p.own.length ? p.own.map(acc) : html`<div class="warnbox">${p.hasLinks ? 'LINKS.md no tiene links de Instagram ni TikTok.' : 'Este perfil no tiene LINKS.md.'} Agrega ahí los links de sus redes.</div>`}
        ${p.links.filter((l) => !/instagram|tiktok/i.test(l.k)).map((l) => html`<div class="row sm" style="margin:6px 0"><span class="mut" style="min-width:90px">${l.k}</span>${/^https:\/\//.test(l.url) ? html`<a href="${l.url}" target="_blank" rel="noopener noreferrer" style="color:inherit">${l.v}</a>` : l.v}</div>`)}</div>
      <div class="card"><h3 style="font-weight:500;font-size:20px">Competencia y referentes</h3>
        <div class="mut sm" style="margin:4px 0 10px">Los links de Instagram y TikTok en <code>${root()}/99-referencias/investigacion/</code></div>
        ${p.competitors.length ? p.competitors.map(acc) : html`<div class="warnbox">No hay cuentas todavía. Las deja ① Strategy en <code>ingenieria-inversa.md</code> o ④ Creatividad en <code>swipe-file.md</code>, dentro de esa carpeta.</div>`}</div></div>`);
  }

  acts(el, {
    prof: (t) => { slug = t.dataset.s; history.replaceState(null, '', `#/content/${tab}/${slug}`); load(); },
    tab: (t) => { tab = t.dataset.t; history.replaceState(null, '', `#/content/${tab}/${slug}`); paint(); },
    file: (t) => { file = t.dataset.p; guiones($('#cbody', el)); },
    scrape: async (t) => { t.disabled = true; try { await api('content/scrape', { method: 'POST', body: { profile: slug } }); toast('Scrape lanzado en Apify. Tarda unos minutos ✅'); win = null; winners($('#cbody', el)); } catch (e) { toast(e.message, true); } t.disabled = false; },
  });
  acts(el, { auto: async (t) => { try { await api('content/auto', { method: 'POST', body: { profile: slug, auto: t.checked } }); toast(t.checked ? 'Se scrapea solo cada día ✅' : 'Scrape diario apagado'); } catch (e) { toast(e.message, true); } } }, 'change');
  mount(el, html`<p class="loading">Leyendo el repo…</p>`);
  load();
}
