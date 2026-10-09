import { html, raw, mount, api, toast, acts, fdate, K, md, csv, $, lineChart, ask, today , connectCard, connectChip, LOGO } from '../core.js';
import { loadPosts, postsBoard, editPost, loadConn, setConn, syncDrive, driveState } from '../posts.js';

// Content: el área donde el CEO y Content deciden. Guiones y piezas viven en Google Drive;
// del repo solo salen las cuentas (LINKS.md) y la competencia. Más el scrape semanal y Analytics.
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
  let data = null, week = null, posts = null, poll = null, ig = null;
  let gstack = null, gfiles = null, gcur = null, pview = 'mes', pdate = today();

  async function load() {
    try { data = await api(`repo/content?profile=${encodeURIComponent(slug)}`); } catch (e) { return mount(el, html`<div class="empty"><b>No pude leer el repo</b>${e.message}</div>`); }
    slug = data.profile.slug; week = null; posts = null; ig = null; gstack = null; gfiles = null; gcur = null;
    try { localStorage.setItem('content.profile', slug); } catch {}
    paint();
  }
  const root = () => data.profile.root;
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
        ${tab === 'semana' ? html`<button class="btn" data-act="scrape">Scrapear ahora</button>` : ''}

      </div>
      <div id="cbody" class="swap"></div>`);
    ({ semana, postear, guiones, plan, analytics, fuentes })[tab]($('#cbody', el));
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

  // ---------- Guiones: una carpeta de Google Drive por perfil ----------
  // El repo tiene cómo se escribe un guion; los guiones de cada mes viven en Drive.
  const PREV = { 'application/vnd.google-apps.document': 'document', 'application/vnd.google-apps.spreadsheet': 'spreadsheets', 'application/vnd.google-apps.presentation': 'presentation' };
  const preview = (f) => (PREV[f.mime] ? `https://docs.google.com/${PREV[f.mime]}/d/${f.id}/preview` : `https://drive.google.com/file/d/${f.id}/preview`);
  const isDir = (f) => f.mime === 'application/vnd.google-apps.folder';
  function guiones(b) {
    const c = data.cfg;
    if (!c.guiones_drive) return mount(b, connectCard('drive', 'Conecta la carpeta de guiones', `Los guiones de ${data.profile.name} viven en Google Drive. Pega el link de su carpeta y aquí los ves, los abres y creas nuevos.`, 'gconnect', 'Conectar Drive'));
    gstack ||= [{ id: c.guiones_drive, name: 'Guiones' }];
    const here = gstack[gstack.length - 1];
    if (!gfiles) { mount(b, html`<p class="loading">Leyendo Drive…</p>`); api(`google/drive?folder=${encodeURIComponent(here.id)}`).then((r) => { gfiles = r.files; }).catch((e) => { gfiles = { error: e.message }; }).then(() => alive() && tab === 'guiones' && b.isConnected && guiones(b)); return; }
    const bar = html`<div class="row" style="margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <span class="sm">${gstack.map((x, i) => html`${i ? ' › ' : ''}<button class="sm ${i === gstack.length - 1 ? '' : 'mut'}" data-act="gup" data-i="${i}" style="font-weight:500">${x.name}</button>`)}</span><div class="sp"></div>
      ${connectChip('drive', 'Drive conectado', 'gopen', true)}<button class="sm mut" data-act="gconnect">Cambiar carpeta</button><button class="btn" data-act="gnew">+ Guion</button></div>`;
    if (gfiles.error) return mount(b, html`${bar}<div class="warnbox">${gfiles.error}</div>`);
    const docs = gfiles.filter((f) => !isDir(f)), dirs = gfiles.filter(isDir);
    const cur = docs.find((f) => f.id === gcur) || docs[0];
    mount(b, html`${bar}${!gfiles.length ? html`<div class="empty"><b>La carpeta está vacía</b>Crea el primer guion con «+ Guion» o súbelo a la carpeta en Drive.</div>` : html`<div class="grid gsplit" style="grid-template-columns:260px 1fr;gap:16px;align-items:start">
      <div class="card" style="padding:12px">${dirs.map((f) => html`<button class="artifact" data-act="gdir" data-id="${f.id}" data-n="${f.name}" style="width:100%;margin:4px 0"><span class="fi">📁</span><div style="text-align:left;min-width:0"><b style="font-weight:500;overflow-wrap:anywhere">${f.name}</b></div></button>`)}
        ${docs.map((f) => html`<button class="artifact" data-act="gfile" data-id="${f.id}" style="width:100%;margin:4px 0;${cur && f.id === cur.id ? 'outline:2px solid var(--ink)' : ''}"><span class="fi">✎</span><div style="text-align:left;min-width:0"><b style="font-weight:500;overflow-wrap:anywhere">${f.name}</b><div class="mut" style="font-size:11px">${f.modified ? fdate(f.modified.slice(0, 10)) : ''}${f.owner ? ' · ' + f.owner : ''}</div></div></button>`)}</div>
      ${cur ? html`<div class="card swap" style="min-width:0;padding:10px"><div class="row" style="margin-bottom:8px"><b style="font-weight:500">${cur.name}</b><div class="sp"></div><a class="btn ghost xs" href="${cur.link}" target="_blank" rel="noopener noreferrer">Abrir en Drive ↗</a></div><iframe src="${preview(cur)}" style="width:100%;height:70vh;border:0;border-radius:12px;background:#fff" loading="lazy"></iframe></div>` : html`<div class="empty"><b>Elige una carpeta</b>Los guiones están adentro.</div>`}</div>`}`);
  }

  // ---------- Planner: calendario semana / mes, con pilares y si cada pieza ya está en Drive ----------
  const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const PAL = ['#5c6b22', '#c2735a', '#4f7790', '#b08a5f', '#8a5a9c', '#2f7d6b', '#a3392a', '#171410'];
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const monday = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  function needPosts(b, fn) {
    if (posts) return false;
    mount(b, html`<p class="loading">Cargando…</p>`);
    Promise.all([loadPosts(slug), loadConn(slug)]).then(async ([l, c]) => {
      posts = l;
      if (c.postear_drive) { try { const m = await syncDrive(slug, l); if (m.length) { posts = [...l, ...m]; toast(`${m.length} pieza${m.length === 1 ? '' : 's'} nueva${m.length === 1 ? '' : 's'} desde Drive`); } } catch (e) { toast(e.message, true); } }
      if (alive() && b.isConnected) fn(b);
    }).catch((e) => mount(b, html`<div class="warnbox">${e.message}</div>`));
    return true;
  }
  function plan(b) {
    if (needPosts(b, plan)) return;
    const pillars = data.cfg.pillars || [];
    const colorOf = (n) => pillars.find((x) => x.name === n)?.color || '#cfc7ba';
    const a = new Date(pdate + 'T12:00');
    const first = pview === 'mes' ? new Date(a.getFullYear(), a.getMonth(), 1, 12) : a;
    const start = monday(first);
    const n = pview === 'mes' ? Math.ceil((((first.getDay() + 6) % 7) + new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate()) / 7) * 7 : 7;
    const days = Array.from({ length: n }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
    const from = iso(days[0]), to = iso(days[days.length - 1]);
    const inRange = posts.filter((p) => p.date && p.date >= from && p.date <= to);
    const title = pview === 'mes' ? a.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase()) : `${fdate(from)} – ${fdate(to)}`;
    const T = today();
    const chip = (p) => { const [i, l] = driveState(p); return html`<button class="ppost" data-act="pedit" data-id="${p.id}" style="border-left-color:${colorOf(p.pillar)}" title="${p.title} · ${l}"><span class="pi">${i}</span><span class="pt">${p.title}</span></button>`; };
    const undated = posts.filter((p) => !p.date && p.status !== 'Publicado');
    mount(b, html`
      <div class="card" style="padding:12px 14px;margin-bottom:12px"><div class="row" style="flex-wrap:wrap;gap:8px"><b class="sm" style="font-weight:500">Pilares</b>
        ${pillars.length ? pillars.map((x) => html`<span class="chip" style="gap:6px"><i style="width:10px;height:10px;border-radius:50%;background:${x.color};display:inline-block"></i>${x.name}<span class="mut">${inRange.filter((p) => p.pillar === x.name).length}</span></span>`) : html`<span class="mut sm">Sin pilares todavía: defínelos para ver el balance del mes.</span>`}
        <div class="sp"></div><button class="btn ghost xs" data-act="pillars">${pillars.length ? 'Editar pilares' : '+ Pilares'}</button></div></div>
      <div class="row" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <button class="arrow light" data-act="pnav" data-d="-1">‹</button><b style="font-weight:500;min-width:150px;text-align:center">${title}</b><button class="arrow light" data-act="pnav" data-d="1">›</button>
        <button class="sm mut" data-act="ptoday">Hoy</button><div class="sp"></div>
        <span class="mut sm">📁 en Drive · ⬆ por subir · ✎ por grabar</span>
        <div class="tabs" style="margin:0">${[['semana', 'Semana'], ['mes', 'Mes']].map(([k, l]) => html`<button class="${pview === k ? 'on' : ''}" data-act="pview" data-v="${k}">${l}</button>`)}</div>
        <button class="btn" data-act="pnew" data-d="">+ Pieza</button></div>
      <div class="pcal ${pview}">${DOW.map((d) => html`<div class="pdow">${d}</div>`)}
        ${days.map((d) => { const k = iso(d); const l = posts.filter((p) => p.date === k); return html`<div class="pday ${pview === 'mes' && d.getMonth() !== a.getMonth() ? 'out' : ''} ${k === T ? 'today' : ''}" data-act="pnew" data-d="${k}"><span class="pn">${d.getDate()}</span>${l.map(chip)}</div>`; })}</div>
      ${undated.length ? html`<div class="sec-title"><h2>Sin fecha</h2><span class="mut sm">${undated.length}</span></div><div class="row" style="flex-wrap:wrap;gap:6px">${undated.map(chip)}</div>` : ''}`);
  }

  // ---------- Analytics: Instagram vía Windsor.ai (cuenta + reels con watch time) ----------
  function analytics(b) {
    if (ig === null) { mount(b, html`<p class="loading">Cargando analytics…</p>`); api(`analytics/instagram?profile=${encodeURIComponent(slug)}`).then((r) => { ig = r; }).catch((e) => { ig = { error: e.message }; }).then(() => alive() && tab === 'analytics' && b.isConnected && analytics(b)); return; }
    let top;
    if (ig.error) top = html`<div class="warnbox"><b>Windsor respondió con un error.</b> ${ig.error}</div>`;
    else if (!ig.connected) top = connectCard('instagram', 'Conecta Instagram para ver tus analytics', 'Haz login con tu cuenta de Instagram en Windsor.ai y aquí aparecen alcance, vistas, watch time y tus mejores reels.', 'igconnect', 'Conectar Instagram');
    else if (!ig.matched) top = html`<div class="connectcard"><span class="lg big">${LOGO.instagram}</span><div class="grow"><b style="font-weight:500">¿Cuál es el Instagram de ${data.profile.name}?</b><div class="mut sm">${ig.accounts.length ? 'Estas son las cuentas que Windsor tiene conectadas. Toca la de este perfil.' : 'Windsor respondió pero no trae ninguna cuenta de Instagram. En Windsor → Instagram, revisa que la cuenta esté conectada y con datos, y recarga.'}</div>
        <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">${ig.accounts.map((x) => html`<button class="connect" data-act="igpick" data-a="${x}"><span class="lg">${LOGO.instagram}</span>@${x}</button>`)}</div></div>${ig.accounts.length ? '' : html`<button class="btn" data-act="igconnect">Abrir Windsor</button>`}</div>`;
    else {
      const w = ig.watch || {};
      const reels = ig.reels || [];
      const maxAvg = Math.max(1, ...reels.map((x) => x.avg));
      top = html`<div class="row" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">${connectChip('instagram', `${ig.handles.map((h) => '@' + h).join(', ')} · conectado`, 'x', true)}<button class="sm mut" data-act="igchange">Cambiar cuenta</button><span class="mut sm">Últimos ${ig.days || 30} días · vía Windsor.ai</span></div>
      <div class="wkkpis">${[['Seguidores', ig.followers ? K(ig.followers) : '—'], ['Alcance', K(ig.reach)], ['Vistas', K(ig.views)], ['Engagement', ig.er == null ? '—' : ig.er + '%'], ['Watch time promedio', w.avg == null ? '—' : w.avg + ' s']].map(([l, v]) => html`<div class="wkkpi"><span class="lbl">${l}</span><b>${v}</b></div>`)}</div>
      ${ig.series.length > 1 ? html`<div class="card wkbox"><div class="wkhead"><h3>Alcance y vistas por día</h3><span class="sm row" style="gap:14px"><span class="row" style="gap:6px"><i style="width:16px;height:2px;background:#171410;display:inline-block"></i>Alcance</span><span class="row" style="gap:6px"><i style="width:16px;height:0;border-top:2px dashed #c2735a;display:inline-block"></i>Vistas</span></span></div><div class="chart" id="chIG"></div></div>` : ''}
      <div class="card wkbox" style="margin-top:12px"><div class="wkhead"><div><h3>Reels · ¿hasta dónde los ven?</h3><span class="mut sm">Últimos 90 días · ${w.n || 0} reels con watch time · ${w.hours || 0} h vistas en total${w.hookLost ? html` · <b style="color:#a3392a">${w.hookLost} se pierden en el hook (&lt;3 s)</b>` : ''}</span></div></div>
        ${reels.length ? html`<div class="tscroll"><table class="wktable"><thead><tr><th>Reel</th><th>Fecha</th><th class="n">Vistas</th><th class="n">Alcance</th><th style="min-width:150px">Watch time promedio</th><th class="n">Total</th><th class="n">♥</th><th class="n">Guardados</th><th class="n">Compartidos</th></tr></thead><tbody>
          ${reels.map((x) => html`<tr><td>${x.url ? html`<a href="${x.url}" target="_blank" rel="noopener noreferrer" style="color:inherit" class="row">${safeImg(x.thumb) ? html`<span class="rthumb" style="background-image:url('${safeImg(x.thumb)}')"></span>` : ''}<span class="sm" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x.caption || 'Ver reel'}</span></a>` : html`<span class="sm">${x.caption || '—'}</span>`}</td>
            <td class="mut">${fdate(x.date)}</td><td class="n"><b style="font-weight:500">${K(x.views)}</b></td><td class="n">${K(x.reach)}</td>
            <td>${x.avg ? html`<div class="row" style="gap:8px"><div style="flex:1;height:8px;border-radius:99px;background:#ebe5da"><div style="width:${Math.round((x.avg / maxAvg) * 100)}%;height:100%;border-radius:99px;background:${x.avg < 3 ? '#c2735a' : '#5c6b22'}"></div></div><span class="sm" style="width:44px;text-align:right">${x.avg} s</span></div>` : html`<span class="mut sm">—</span>`}</td>
            <td class="n mut">${x.total ? (x.total >= 3600 ? Math.round(x.total / 360) / 10 + ' h' : Math.round(x.total / 60) + ' min') : '—'}</td><td class="n">${K(x.likes)}</td><td class="n">${K(x.saves)}</td><td class="n">${K(x.shares)}</td></tr>`)}</tbody></table></div>
          <div class="mut sm" style="margin-top:10px">💡 Instagram no entrega por API el segundo exacto en que la gente deja de ver (esa curva solo está en la app). Lo más cercano es el <b>watch time promedio</b>: si está debajo de 3 s, se fueron en el hook.</div>`
        : html`<div class="mut sm" style="padding:6px 0">Windsor no trae reels de esta cuenta en los últimos 90 días.</div>`}</div>
      ${ig.top.length ? html`<div class="card wkbox" style="margin-top:12px"><div class="wkhead"><h3>Mejores posts del periodo</h3></div><div class="tscroll"><table class="wktable"><thead><tr><th>Fecha</th><th>Tipo</th><th class="n">Alcance</th><th class="n">Likes</th><th class="n">Comentarios</th><th class="n">Guardados</th><th class="n">Engagement</th></tr></thead><tbody>${ig.top.map((x) => html`<tr><td>${x.url ? html`<a href="${x.url}" target="_blank" rel="noopener noreferrer" style="color:inherit">${fdate(x.date)}</a>` : fdate(x.date)}</td><td>${x.type}</td><td class="n">${K(x.reach)}</td><td class="n">${K(x.likes)}</td><td class="n">${K(x.comments)}</td><td class="n">${K(x.saves)}</td><td class="n"><b style="font-weight:500">${K(x.eng)}</b></td></tr>`)}</tbody></table></div></div>` : ''}`;
    }
    mount(b, html`${top}<div id="anScrape" style="margin-top:16px"></div>`);
    const ch = $('#chIG', b); if (ch) lineChart(ch, ig.series.map((x) => fdate(x.date)), [{ name: 'Alcance', v: ig.series.map((x) => x.reach), c: '#171410', fill: true }, { name: 'Vistas', v: ig.series.map((x) => x.views), c: '#c2735a', dash: true }]);
    scrapeAnalytics($('#anScrape', b));
  }
  function scrapeAnalytics(b) {
    if (needWeek(b, scrapeAnalytics)) return;
    const h = week.analytics || [], last = h[h.length - 1], prev = h[h.length - 2];
    const delta = (k) => (last && prev && prev[k] ? Math.round(((last[k] - prev[k]) / prev[k]) * 100) : null);
    const own = week.result?.own || [];
    if (!h.length) return mount(b, html`<div class="mut sm">El scrape semanal (Apify) también guarda tus posts: aparecen aquí cuando corra.</div>`);
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
    igconnect: () => window.open('https://onboard.windsor.ai/', '_blank', 'noopener'),
    igpick: async (t) => { try { await api('content/connect', { method: 'PUT', body: { profile: slug, ig_account: t.dataset.a } }); toast(`@${t.dataset.a} conectado a ${data.profile.name} ✅`); ig = null; paint(); } catch (e) { toast(e.message, true); } },
    igchange: async () => { try { await api('content/connect', { method: 'PUT', body: { profile: slug, ig_account: '' } }); ig = { ...ig, matched: false }; paint(); } catch (e) { toast(e.message, true); } },
    prof: (t) => { slug = t.dataset.s; clearTimeout(poll); go(); load(); },
    tab: (t) => { tab = t.dataset.t; go(); paint(); },
    gfile: (t) => { gcur = t.dataset.id; guiones($('#cbody', el)); },
    gdir: (t) => { gstack.push({ id: t.dataset.id, name: t.dataset.n }); gfiles = null; gcur = null; guiones($('#cbody', el)); },
    gup: (t) => { gstack = gstack.slice(0, +t.dataset.i + 1); gfiles = null; gcur = null; guiones($('#cbody', el)); },
    gopen: () => window.open(gstack?.[gstack.length - 1]?.id?.startsWith('https') ? gstack[gstack.length - 1].id : `https://drive.google.com/drive/folders/${gstack?.[gstack.length - 1]?.id}`, '_blank', 'noopener'),
    gconnect: async () => {
      const v = await ask('Conectar la carpeta de guiones', [{ k: 'url', l: `Link de la carpeta de Google Drive con los guiones de ${data.profile.name}`, v: data.cfg.guiones_drive, req: true }], 'Conectar');
      if (!v) return;
      try { await api('content/connect', { method: 'PUT', body: { profile: slug, guiones_drive: v.url.trim() } }); data.cfg.guiones_drive = v.url.trim(); gstack = null; gfiles = null; toast('Carpeta de guiones conectada ✅'); paint(); } catch (e) { toast(e.message, true); }
    },
    gnew: async () => {
      const v = await ask('Nuevo guion', [{ k: 'name', l: 'Nombre', v: `Guion · ${fdate(today())}`, req: true }], 'Crear en Drive');
      if (!v) return;
      try { const f = await api('google/drive', { method: 'POST', body: { type: 'doc', name: v.name, folder: gstack[gstack.length - 1].id } }); gfiles = null; gcur = f.id; toast('Guion creado en Drive ✅'); window.open(f.link, '_blank', 'noopener'); guiones($('#cbody', el)); } catch (e) { toast(e.message, true); }
    },
    pview: (t) => { pview = t.dataset.v; plan($('#cbody', el)); },
    pnav: (t) => { const d = new Date(pdate + 'T12:00'); if (pview === 'mes') d.setMonth(d.getMonth() + +t.dataset.d, 1); else d.setDate(d.getDate() + 7 * +t.dataset.d); pdate = d.toISOString().slice(0, 10); plan($('#cbody', el)); },
    ptoday: () => { pdate = today(); plan($('#cbody', el)); },
    pnew: async (t, e) => { if (e?.target?.closest('.ppost')) return; const r = await editPost(slug, null, t.dataset.d ? { date: t.dataset.d } : {}); if (r) { posts = [...posts, r]; plan($('#cbody', el)); } },
    pedit: async (t) => { const p = posts.find((x) => x.id === t.dataset.id); if (!p) return; const r = await editPost(slug, p); if (r) { posts = posts.map((x) => (x.id === r.id ? r : x)); plan($('#cbody', el)); } },
    pillars: async () => {
      const cur = data.cfg.pillars || [];
      const v = await ask('Pilares de contenido', [{ k: 'list', l: 'Un pilar por línea (máx. 8). Ej.: Educa · Detrás de cámaras · Casos · Oferta', t: 'textarea', v: cur.map((x) => x.name).join('\n') }], 'Guardar');
      if (!v) return;
      const names = v.list.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 8);
      const pillars = names.map((name, i) => ({ name, color: cur.find((x) => x.name === name)?.color || PAL[i % PAL.length] }));
      try { const r = await api('content/connect', { method: 'PUT', body: { profile: slug, pillars } }); data.cfg.pillars = r.pillars; setConn(slug, { pillars: r.pillars }); toast('Pilares guardados ✅'); plan($('#cbody', el)); } catch (e) { toast(e.message, true); }
    },
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
