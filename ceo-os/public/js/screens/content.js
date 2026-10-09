import { html, raw, mount, api, toast, acts, fdate, K, md, csv, $, lineChart, ask, today } from '../core.js';
import { loadPosts, postsBoard } from '../posts.js';

// Content: lo que dice el repo de cada perfil (guiones, plan, cuentas) + el scrape semanal.
// La app no inventa guiones: los escribe ④ Creatividad en Claude Code y aquí se ven.
const RED = { instagram: 'Instagram', tiktok: 'TikTok' };
const safeImg = (u) => (/^https:\/\/[^\s'"()]+$/.test(String(u || '')) ? u : null);
const TABS = [['semana', 'Semana'], ['postear', 'Por postear'], ['guiones', 'Guiones'], ['plan', 'Planner'], ['analytics', 'Analytics'], ['fuentes', 'Fuentes']];

export function videoCard(it) {
  const t = safeImg(it.thumb);
  return html`<a class="card win" href="${/^https:\/\//.test(it.url) ? it.url : '#'}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;padding:12px">
    <div class="thumb" ${t ? raw(`style="background-image:url('${t}')"`) : ''}><b>${it.x ? it.x + '×' : '▶'}</b></div>
    <div class="row sm"><b style="font-weight:500">@${it.handle}</b><span class="mut">${RED[it.red]}</span><div class="sp"></div><span class="mut">${it.at ? fdate(it.at.slice(0, 10)) : ''}</span></div>
    <div class="row sm" style="gap:12px">${it.views ? html`<span>▶ ${K(it.views)}</span>` : ''}<span>♥ ${K(it.likes)}</span><span>💬 ${K(it.comments)}</span></div>
    <div class="cap mut">${it.text}</div></a>`;
}

export async function render(el, { sub, alive }) {
  let slug = sub[1] || (() => { try { return localStorage.getItem('content.profile'); } catch { return null; } })() || 'inherent';
  let tab = TABS.some(([k]) => k === sub[0]) ? sub[0] : 'semana';
  let data = null, mes = null, file = null, week = null, posts = null, poll = null;

  async function load() {
    try { data = await api(`repo/content?profile=${encodeURIComponent(slug)}`); } catch (e) { return mount(el, html`<div class="empty"><b>No pude leer el repo</b>${e.message}</div>`); }
    slug = data.profile.slug; mes = data.profile.months[0]?.mes || null; file = null; week = null; posts = null;
    try { localStorage.setItem('content.profile', slug); } catch {}
    paint();
  }
  const root = () => data.profile.root;
  const months = () => data.profile.months;
  const filesOf = (pred) => (months().find((m) => m.mes === mes)?.files || []).filter(pred);
  const go = () => history.replaceState(null, '', `#/content/${tab}/${slug}`);

  function paint() {
    if (!alive()) return;
    const p = data.profile;
    mount(el, html`
      <div class="hello"><h1>Content</h1><p>Lo que pasa en <em>${p.name}</em> esta semana.</p></div>
      <div class="row" style="margin-bottom:16px;gap:8px;flex-wrap:wrap">${data.profiles.map((x) => html`<button class="chip ${x.slug === slug ? 'dark' : ''}" data-act="prof" data-s="${x.slug}" style="padding:9px 16px;font-size:13px">${x.name}</button>`)}</div>
      <div class="row" style="margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <div class="tabs" style="margin:0">${TABS.map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>
        <div class="sp"></div>
        ${(tab === 'guiones' || tab === 'plan') && months().length ? html`<select class="in" id="mes" style="width:auto">${months().map((m) => html`<option value="${m.mes}" ${m.mes === mes ? raw('selected') : ''}>${m.mes}</option>`)}</select>` : ''}
        ${tab === 'semana' ? html`<button class="btn" data-act="scrape">Scrapear ahora</button>` : ''}

      </div>
      <div id="cbody" class="swap"></div>`);
    ({ semana, postear, guiones, plan, analytics, fuentes })[tab]($('#cbody', el));
    const sel = $('#mes', el); if (sel) sel.onchange = () => { mes = sel.value; file = null; paint(); };
  }

  // ---------- Semana: top 10 del nicho + los videos que agregaste ----------
  async function loadWeek() {
    try { week = await api(`content/week?profile=${encodeURIComponent(slug)}`); } catch (e) { week = { status: 'error', warn: e.message, analytics: [] }; }
    clearTimeout(poll);
    if (week.status === 'running') poll = setTimeout(() => { if (alive() && (tab === 'semana' || tab === 'analytics')) { week = null; paint(); } }, 20000);
  }
  function needWeek(b, fn) { if (week) return false; mount(b, html`<p class="loading">Cargando la semana…</p>`); loadWeek().then(() => alive() && b.isConnected && fn(b)); return true; }
  function semana(b) {
    if (needWeek(b, semana)) return;
    const c = data.cfg;
    const head = html`<div class="row" style="margin-bottom:14px;flex-wrap:wrap;gap:10px">
      ${week.at ? html`<span class="mut sm">Semana ${week.week} · scrapeado el ${fdate(week.at.slice(0, 10))}${week.status === 'running' ? ' · Apify trabajando, se actualiza solo…' : ''}</span>` : html`<span class="mut sm">Todavía no hay scrape de este perfil.</span>`}
      <div class="sp"></div><span class="chip ${c.auto ? 'lime' : ''}">${c.auto ? 'Scrape semanal: lunes' : 'Scrape semanal apagado'}</span></div>`;
    if (week.warn) return mount(b, html`${head}<div class="warnbox">${week.warn}</div>`);
    const r = week.result;
    if (!data.apify && !r) return mount(b, html`${head}<div class="warnbox">Falta conectar Apify: agrega <b>APIFY_TOKEN</b> en las variables de Vercel (Sensitive) y vuelve a publicar.</div>`);
    if (!r) return mount(b, html`${head}<div class="empty"><b>${week.status === 'running' ? 'Apify está scrapeando…' : 'Sin semana todavía'}</b>${week.status === 'running' ? 'Tarda unos minutos. Esta pantalla se actualiza sola.' : html`Revisa las <a href="#/content/fuentes/${slug}" style="color:inherit">Fuentes</a> y dale «Scrapear ahora».`}</div>`);
    mount(b, html`${head}
      <div class="sec-title" style="margin-top:0"><h2>Top 10 del nicho</h2><span class="mut sm">Cuántas veces supera el promedio de <b>su propia cuenta</b></span></div>
      ${r.top.length ? html`<div class="grid g5">${r.top.map(videoCard)}</div>` : html`<div class="empty"><b>Sin videos esta semana</b>Agrega hashtags o cuentas en Fuentes.</div>`}
      ${r.added.length ? html`<div class="sec-title"><h2>Los que agregaste</h2></div><div class="grid g5">${r.added.map(videoCard)}</div>` : ''}`);
  }

  // ---------- Por postear ----------
  function postear(b) {
    if (!posts) { mount(b, html`<p class="loading">Cargando…</p>`); loadPosts(slug).then((l) => { posts = l; if (alive() && b.isConnected) postear(b); }).catch((e) => mount(b, html`<div class="warnbox">${e.message}</div>`)); return; }
    postsBoard(b, slug, posts, (l) => { posts = l; postear(b); });
  }

  // ---------- Guiones: 04-contenido/<mes>/ideas/*.md ----------
  function guiones(b) {
    const all = [...filesOf((f) => /\.md$/i.test(f.name) && f.area === 'ideas'), ...filesOf((f) => /\.md$/i.test(f.name) && f.area !== 'ideas')];
    if (!all.length) return mount(b, html`<div class="empty"><b>Todavía no hay guiones en el repo</b>
      Los escribe ④ Creatividad en <code>${root()}/04-contenido/AAAA-MM/ideas/</code>.<br>Pídelos en Claude Code con <code>/creatividad</code> y aparecen aquí después de publicar.</div>`);
    const cur = all.find((f) => f.path === file) || all[0];
    mount(b, html`<div class="grid" style="grid-template-columns:260px 1fr;gap:16px;align-items:start">
      <div class="card" style="padding:12px">${all.map((f) => html`<button class="artifact" data-act="file" data-p="${f.path}" style="width:100%;margin:4px 0;${f.path === cur.path ? 'outline:2px solid var(--ink)' : ''}"><span class="fi">${f.area === 'ideas' ? '✎' : '▤'}</span><div style="text-align:left;min-width:0"><b style="font-weight:500;overflow-wrap:anywhere">${f.name.replace(/\.md$/, '')}</b><div class="mut" style="font-size:11px">${f.area}</div></div></button>`)}</div>
      <div class="card swap" style="min-width:0"><div class="mut sm" style="margin-bottom:8px">${root()}/04-contenido/${mes}/${cur.path}</div>${md(cur.content)}</div></div>`);
  }

  // ---------- Planner: plan-de-contenido.csv ----------
  function plan(b) {
    const f = filesOf((x) => /plan-de-contenido\.csv$/i.test(x.name))[0];
    if (!f) return mount(b, html`<div class="empty"><b>No hay plan de contenido este mes</b>Lo arma ④ Creatividad en <code>${root()}/04-contenido/${mes || 'AAAA-MM'}/ideas/plan-de-contenido.csv</code>.</div>`);
    const [head, ...rows] = csv(f.content);
    mount(b, html`<div class="card tscroll"><div class="mut sm" style="margin-bottom:8px">${rows.length} piezas · del repo</div><table><thead><tr>${head.map((h) => html`<th>${h}</th>`)}</tr></thead><tbody>${rows.map((r) => html`<tr>${head.map((_, i) => html`<td>${r[i] || ''}</td>`)}</tr>`)}</tbody></table></div>`);
  }

  // ---------- Analytics: las cuentas propias, semana a semana ----------
  function analytics(b) {
    if (needWeek(b, analytics)) return;
    const h = week.analytics || [], last = h[h.length - 1], prev = h[h.length - 2];
    const delta = (k) => (last && prev && prev[k] ? Math.round(((last[k] - prev[k]) / prev[k]) * 100) : null);
    const own = week.result?.own || [];
    if (!h.length) return mount(b, html`<div class="empty"><b>Sin datos todavía</b>Se llenan con el scrape semanal de las cuentas propias (las de <code>LINKS.md</code>).</div>`);
    const kpi = (lbl, v, d) => html`<div class="card"><div class="lbl">${lbl}</div><div class="big" style="font-size:44px">${v}</div><div class="sm ${d == null ? 'mut' : ''}" style="${d == null ? '' : d >= 0 ? 'color:#4f6b12' : 'color:#a3392a'}">${d == null ? 'vs semana anterior: —' : (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + '% vs semana anterior'}</div></div>`;
    mount(b, html`<div class="grid g4">${kpi('Vistas promedio', K(last.avgViews), delta('avgViews'))}${kpi('Engagement', last.er == null ? '—' : last.er + '%', delta('er'))}${kpi('Likes', K(last.likes), delta('likes'))}${kpi('Posts leídos', last.posts, null)}</div>
      <div class="card" style="margin-top:16px"><div class="chead"><div class="ico">↗</div><h3>Vistas promedio por semana</h3></div><div class="chart" id="chA"></div></div>
      ${own.length ? html`<div class="sec-title"><h2>Tus últimos posts</h2></div><div class="grid g5">${own.slice(0, 10).map(videoCard)}</div>` : ''}`);
    lineChart($('#chA', b), h.map((x) => x.week.slice(5)), [{ name: 'Vistas', v: h.map((x) => x.avgViews), c: '#171410', fill: true }]);
  }

  // ---------- Fuentes: cuentas del repo + lo que agregas aquí ----------
  function fuentes(b) {
    const p = data.profile, c = data.cfg;
    const accUrl = (a) => (a.red === 'tiktok' ? `https://www.tiktok.com/@${a.handle}` : `https://www.instagram.com/${a.handle}/`);
    const acc = (a, rm) => html`<div class="artifact" style="margin:6px 0"><span class="fi">${a.red === 'tiktok' ? '♪' : '◎'}</span><div style="flex:1"><a href="${accUrl(a)}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none"><b style="font-weight:500">@${a.handle}</b></a><div class="mut" style="font-size:11px">${RED[a.red]}${a.source ? ' · ' + a.source : ''}</div></div>${rm != null ? html`<button class="sm mut" data-act="rmAcc" data-i="${rm}">✕</button>` : ''}</div>`;
    mount(b, html`<div class="card" style="margin-bottom:16px"><div class="row" style="flex-wrap:wrap;gap:12px"><div><b style="font-weight:500">Scrape semanal</b><div class="mut sm">Cada lunes, 10 videos por fuente, de Reels y TikTok.</div></div><div class="sp"></div>
        <label class="check" style="padding:0"><input type="checkbox" data-act="auto" ${c.auto ? raw('checked') : ''}> Activado</label></div></div>
      <div class="grid g2" style="align-items:start">
      <div class="card"><h3 style="font-weight:500;font-size:20px">Tu nicho</h3>
        <div class="mut sm" style="margin:4px 0 10px">Hashtags que definen el nicho (máx. 10). Se guardan en la app.</div>
        <div class="row" style="flex-wrap:wrap;gap:6px">${c.hashtags.map((h, i) => html`<span class="chip">#${h} <button class="sm mut" data-act="rmTag" data-i="${i}" style="margin-left:4px">✕</button></span>`)}${c.hashtags.length ? '' : html`<span class="mut sm">Sin hashtags.</span>`}</div>
        <div class="row" style="margin-top:10px"><input class="in" id="newTag" placeholder="ej. emprendimiento, marketingdigital"><button class="btn ghost" data-act="addTag">+</button></div>
        <h3 style="font-weight:500;font-size:20px;margin-top:22px">Videos que quieres seguir</h3>
        <div class="mut sm" style="margin:4px 0 10px">Links de reels o TikToks puntuales.</div>
        ${c.videos.map((u, i) => html`<div class="row sm" style="margin:6px 0"><a href="${u}" target="_blank" rel="noopener noreferrer" style="color:inherit;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u}</a><button class="sm mut" data-act="rmVid" data-i="${i}">✕</button></div>`)}
        <div class="row" style="margin-top:10px"><input class="in" id="newVid" placeholder="https://www.instagram.com/reel/…"><button class="btn ghost" data-act="addVid">+</button></div></div>
      <div class="card"><h3 style="font-weight:500;font-size:20px">Cuentas</h3>
        <div class="mut sm" style="margin:4px 0 6px">Propias, de <code>${root()}/00-onboarding/LINKS.md</code></div>
        ${p.own.length ? p.own.map((a) => acc(a)) : html`<div class="warnbox">${p.hasLinks ? 'LINKS.md no tiene links de Instagram ni TikTok.' : 'Este perfil no tiene LINKS.md en el repo.'}</div>`}
        <div class="mut sm" style="margin:16px 0 6px">Competencia, de <code>99-referencias/investigacion/</code></div>
        ${p.competitors.length ? p.competitors.map((a) => acc(a)) : html`<div class="mut sm">Ninguna en el repo todavía.</div>`}
        <div class="mut sm" style="margin:16px 0 6px">Agregadas aquí</div>
        ${c.accounts.map((a, i) => acc(a, i))}
        <div class="row" style="margin-top:8px"><select class="in" id="newRed" style="width:auto"><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select><input class="in" id="newAcc" placeholder="@cuenta"><button class="btn ghost" data-act="addAcc">+</button></div></div></div>`);
  }
  async function saveCfg(next) {
    try { data.cfg = { ...data.cfg, ...(await api('content/cfg', { method: 'PUT', body: { profile: slug, ...data.cfg, ...next } })) }; fuentes($('#cbody', el)); } catch (e) { toast(e.message, true); }
  }

  acts(el, {
    prof: (t) => { slug = t.dataset.s; clearTimeout(poll); go(); load(); },
    tab: (t) => { tab = t.dataset.t; go(); paint(); },
    file: (t) => { file = t.dataset.p; guiones($('#cbody', el)); },
    scrape: async (t) => { t.disabled = true; try { await api('content/scrape', { method: 'POST', body: { profile: slug } }); toast('Scrape lanzado en Apify. Tarda unos minutos ✅'); week = null; paint(); } catch (e) { toast(e.message, true); } t.disabled = false; },
    addTag: () => { const v = $('#newTag', el).value; if (v.trim()) saveCfg({ hashtags: [...data.cfg.hashtags, ...v.split(/[\s,]+/)] }); },
    rmTag: (t) => saveCfg({ hashtags: data.cfg.hashtags.filter((_, i) => i !== +t.dataset.i) }),
    addVid: () => { const v = $('#newVid', el).value.trim(); if (!/^https:\/\/(www\.)?(instagram\.com\/(p|reel|reels)\/|tiktok\.com\/@[^/]+\/video\/|vm\.tiktok\.com\/)/.test(v)) return toast('Pega el link de un reel o de un TikTok', true); saveCfg({ videos: [...data.cfg.videos, v] }); },
    rmVid: (t) => saveCfg({ videos: data.cfg.videos.filter((_, i) => i !== +t.dataset.i) }),
    addAcc: () => { const h = $('#newAcc', el).value.trim(); if (!h) return; const m = h.match(/(?:tiktok\.com\/@|instagram\.com\/)?@?([A-Za-z0-9._]{2,30})/); saveCfg({ accounts: [...data.cfg.accounts, { red: /tiktok/.test(h) ? 'tiktok' : $('#newRed', el).value, handle: m ? m[1] : h }] }); },
    rmAcc: (t) => saveCfg({ accounts: data.cfg.accounts.filter((_, i) => i !== +t.dataset.i) }),
  });
  acts(el, { auto: (t) => saveCfg({ auto: t.checked }).then(() => toast(t.checked ? 'Se scrapea solo cada lunes ✅' : 'Scrape semanal apagado')) }, 'change');
  mount(el, html`<p class="loading">Leyendo el repo…</p>`);
  load();
}
