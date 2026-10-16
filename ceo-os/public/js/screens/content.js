import { html, raw, mount, api, toast, acts, drawer, closeDrawer, fdate, K, md, csv, $, lineChart, ask, today , connectCard, connectChip, LOGO, openClaude, claudeJSON, ICON, swap, ico, col, confirmAsk } from '../core.js';
import { bullseye, bullseyePrompt } from '../bullseye.js';
import { loadPosts, postsBoard, editPost, loadConn, setConn, syncDrive, driveState } from '../posts.js';

// Content: el área donde el CEO y Content deciden. Guiones y piezas viven en Google Drive;
// del repo solo salen las cuentas (LINKS.md) y la competencia. Más el scrape semanal y Analytics.
const RED = { instagram: 'Instagram', tiktok: 'TikTok' };
const safeImg = (u) => (/^https:\/\/[^\s'"()]+$|^\/api\/media\/img-[a-f0-9]{24}$/.test(String(u || '')) ? u : null);
// Las pestañas visibles; el resto del código sigue aquí y vuelve al agregar su pestaña a esta lista.
const TABS = [['analytics', 'Analytics'], ['research', 'Research'], ['calendario', 'Calendario']];
const C = col('content');
// Research: de dónde viene cada video.
const RKIND = [['todos', 'Todas las fuentes'], ['nicho', 'Ganadores del nicho'], ['referente', 'Referentes'], ['competencia', 'Competencia'], ['analisis', 'Con análisis']];
// Como en Edits: arriba se elige qué tipo de contenido se ve.
const RFMT = [['todo', 'Todo', 'grid'], ['reel', 'Reels', 'video'], ['carrusel', 'Carruseles', 'layers'], ['estatico', 'Estáticos', 'image'], ['plantilla', 'Plantillas', 'copy']];
const fmtOf = (it) => it.format || (it.video === false ? 'estatico' : 'reel');
// La biblioteca de formatos: resonancia, si hay que hablar y el tipo de formato. Las pone Claude (conector) o el equipo.
// Los filtros de Research no son fijos: salen de lo que Claude subió de cada marca (sus pilares, sus tipos, sus etiquetas).
const distinct = (list, f) => { const n = new Map(); for (const x of list) for (const v of [].concat(f(x) || [])) if (v) n.set(v, (n.get(v) || 0) + 1); return [...n].sort((a, z) => z[1] - a[1]).map(([v]) => v); };
const TALK = [['no', 'sin hablar'], ['voz', 'voz en off'], ['si', 'hablando a cámara']];
const resOf = (it) => it.resonance || (it.x >= 3 ? 'alta' : it.x >= 1.5 ? 'media' : it.x ? 'baja' : '');
const RESN = { alta: 3, media: 2, baja: 1 };
const TALKL = { no: 'sin hablar', voz: 'voz en off', si: 'hablando a cámara' };
const mss = (n) => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`;
const rtitle = (it) => it.title || String(it.text || '').split('\n')[0].slice(0, 80) || `@${it.handle || 'referencia'}`;
const isoWeek = (d = new Date()) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y) / 864e5 + 1) / 7)).padStart(2, '0')}`; };
// El mismo id que usa el conector para un post de Research (así no se duplica).
async function rsid(profile, url) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${profile}|${String(url).replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase()}`)); return 'rs-' + [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 20); }
const RKL = { nicho: 'Ganador del nicho', referente: 'Referente', competencia: 'Competencia', propia: 'Tuyo', agregado: 'Agregado' };
const rkey = (u) => String(u || '').replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
const embedOf = (u) => { let m; if ((m = String(u).match(/instagram\.com\/(?:p|reel|reels|tv)\/([\w-]+)/))) return `https://www.instagram.com/p/${m[1]}/embed`; if ((m = String(u).match(/tiktok\.com\/@[^/]+\/video\/(\d+)/))) return `https://www.tiktok.com/embed/v2/${m[1]}`; return null; };
const SHOOT = ['Por grabar', 'Grabado', 'Cancelado'];
const KIND = { referente: 'Referente', competencia: 'Competencia', nicho: 'Nicho', propia: 'Tuya' };

export function videoCard(it) {
  const t = safeImg(it.thumb);
  return html`<a class="card win" href="${/^https:\/\//.test(it.url) ? it.url : '#'}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;padding:12px">
    <div class="thumb" ${t ? raw(`style="background-image:url('${t}')"`) : ''}><b>${it.x ? it.x + '×' : it.icon || ico('play', 13)}</b></div>
    <div class="row sm"><b style="font-weight:500">@${it.handle}</b><span class="mut">${it.kind && KIND[it.kind] ? KIND[it.kind] : RED[it.red]}</span><div class="sp"></div><span class="mut">${it.at ? fdate(it.at.slice(0, 10)) : ''}</span></div>
    <div class="row sm" style="gap:12px">${it.views ? html`<span>${ico('play', 13)} ${K(it.views)}</span>` : ''}<span>${ico('heart')} ${K(it.likes)}</span><span>${ico('chat')} ${K(it.comments)}</span></div>
    <div class="cap mut">${it.text}</div></a>`;
}

export async function render(el, { sub, alive }) {
  let slug = sub[1] || (() => { try { return localStorage.getItem('content.profile'); } catch { return null; } })() || 'inherent';
  let tab = TABS.some(([k]) => k === sub[0]) ? sub[0] : 'analytics';
  let data = null, week = null, posts = null, poll = null, ig = null, inbox = null, rf = null, rfPoll = null, shotMes = null;
  let gstack = null, gfiles = null, gcur = null, pview = 'mes', pdate = today();
  let rs = null, rfilter = 'todos', rfmt = 'todo', cview = 'publicacion', shoots = null;
  let rfOpen = false, rview = 'biblioteca', rq = '', rsort = 'res', rsel = { pilar: '', res: '', talk: '', style: '', tag: '' };

  async function load() {
    try { data = await api(`repo/content?profile=${encodeURIComponent(slug)}`); } catch (e) { return mount(el, html`<div class="empty"><b>No pude leer el repo</b>${e.message}</div>`); }
    slug = data.profile.slug; week = null; posts = null; rs = null; shoots = null; ig = null; inbox = null; rf = null; shotMes = null; gstack = null; gfiles = null; gcur = null;
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
        ${tab === 'refs' ? html`<button class="btn" data-act="refScrape">Buscar similares</button>` : ''}

      </div>
      <div id="cbody" class="swap"></div>`);
    ({ shot, refs: refsTab, semana, postear, guiones, plan, bandeja, analytics, fuentes, research, calendario })[tab]($('#cbody', el));
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
      ${(r.refs || []).length ? html`<div class="sec-title"><h2>Lo último de tus referentes</h2><span class="mut sm">Para ver estilos y de qué están hablando</span></div><div class="grid g5">${r.refs.slice(0, 10).map(videoCard)}</div>` : ''}
      ${(r.comp || []).length ? html`<div class="sec-title"><h2>Lo último de la competencia</h2></div><div class="grid g5">${r.comp.slice(0, 10).map(videoCard)}</div>` : ''}
      ${r.added.length ? html`<div class="sec-title"><h2>Los que agregaste</h2></div><div class="grid g5">${r.added.map(videoCard)}</div>` : ''}`);
  }

  // ---------- Ideas: reels y carruseles que propone Claude con lo que encontró el scraper ----------
  // ---------- Shot list: lo que entregó ④ Creatividad en el repo (plan-de-contenido.csv + ideas-<formato>.md) ----------
  // Para llegar a un video hay trabajo antes (estrategia, brief, BIG IDEA): aquí solo se despliega lo que ya está en el repo.
  function shotData() {
    const ms = (data.profile.months || []).filter((m) => m.files.some((f) => f.name === 'plan-de-contenido.csv'));
    const m = ms.find((x) => x.mes === shotMes) || ms[0];
    if (!m) return { ms, m: null, rows: [] };
    const f = m.files.find((x) => x.name === 'plan-de-contenido.csv');
    // Las 13 columnas del método; si un CSV viejo trae otros nombres (idea, titulo…), se leen igual.
    const [head, ...body] = csv(f.content); const H = head.map((h) => h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const ALIAS = { concepto: ['concepto', 'idea', 'titulo', 'title'], campana: ['campana', 'campaign'] };
    const val = (r, k) => { for (const a of ALIAS[k] || [k]) { const i = H.indexOf(a); if (i >= 0 && r[i]) return r[i].trim(); } return ''; };
    const rows = body.filter((r) => r.some(Boolean)).map((r, i) => { const o = Object.fromEntries(['id', 'campana', 'fecha', 'canal', 'formato', 'pilar', 'funcion', 'concepto', 'mezcla', 'traza', 'material', 'estado', 'trial'].map((k) => [k, val(r, k)])); o.id ||= `#${i + 1}`; return o; });
    return { ms, m, rows };
  }
  // La sección de una pieza en su ideas-<formato>.md: desde la línea con su id hasta la siguiente pieza.
  function pieceText(m, row) {
    const slugF = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const f = m.files.find((x) => x.name === `ideas-${slugF(row.formato)}.md`) || m.files.find((x) => /^ideas-.*\.md$/.test(x.name) && x.content.includes(row.id));
    if (!f) return null;
    const L = f.content.split('\n'), i = L.findIndex((l) => /^#{1,4}\s/.test(l) && l.includes(row.id)); if (i < 0) return null;
    const lvl = L[i].match(/^#+/)[0].length; let j = i + 1; while (j < L.length && !(new RegExp(`^#{1,${lvl}}\\s`).test(L[j]))) j++;
    return L.slice(i, j).join('\n');
  }
  function shot(b) {
    const { ms, m, rows } = shotData();
    if (!m) return mount(b, html`<div class="empty"><b>Todavía no hay shot list de ${data.profile.name}</b>Lo entrega ④ Creatividad en el repo: <code>04-contenido/AAAA-MM/ideas/plan-de-contenido.csv</code> y un <code>ideas-&lt;formato&gt;.md</code> por formato. Antes van la estrategia, el brief y las BIG IDEAS del ciclo.</div>`);
    const brief = m.files.find((x) => x.name === 'brief-del-ciclo.md');
    const pend = rows.filter((r) => r.estado && r.estado !== 'listo').length, mat = (k) => rows.filter((r) => r.material === k).length;
    mount(b, html`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px">
        ${ms.length > 1 ? html`<select class="in" id="shotMes" style="width:auto">${ms.map((x) => html`<option ${x.mes === m.mes ? raw('selected') : ''}>${x.mes}</option>`)}</select>` : html`<span class="chip dark">${m.mes}</span>`}
        <span class="chip">${rows.length} piezas</span>${mat('video') ? html`<span class="chip">${ico('video')} ${mat('video')} por grabar</span>` : ''}${mat('foto') ? html`<span class="chip">${ico('camera')} ${mat('foto')} fotos</span>` : ''}${pend ? html`<span class="chip amber">${pend} pendientes</span>` : ''}
        <div class="sp"></div>${brief ? html`<button class="btn ghost xs" data-act="shotBrief">Brief del ciclo</button>` : ''}</div>
      <div class="card tscroll"><table class="wktable shottbl"><thead><tr><th>Id</th><th>Fecha</th><th>Formato</th><th>Pilar</th><th>Concepto</th><th>Material</th><th>Estado</th></tr></thead><tbody>
        ${rows.map((r) => html`<tr class="click" data-act="shotOpen" data-id="${r.id}"><td class="mut">${r.id}</td><td>${r.fecha ? fdate(r.fecha) : '—'}</td><td>${r.formato}</td><td>${r.pilar}</td><td style="min-width:220px">${r.concepto}</td><td>${{ video: html`${ico('video', 14)} video`, foto: html`${ico('camera', 14)} foto`, ninguno: '—' }[r.material] || r.material}</td><td><span class="chip ${r.estado === 'listo' ? 'green' : r.estado ? 'amber' : ''} sm2">${r.estado || '—'}</span></td></tr>`)}
      </tbody></table></div>`);
    const sm = $('#shotMes', b); if (sm) sm.onchange = () => { shotMes = sm.value; shot(b); };
  }

  // ---------- Referencias por pilar: 5 videos por pilar → similares (Apify) → desglose con Claude ----------
  function refsTab(b) {
    if (rf === null) { mount(b, html`<p class="loading">Cargando referencias…</p>`); api(`content/refs?profile=${encodeURIComponent(slug)}`).then((r) => { rf = r; }).catch((e) => { rf = { error: e.message }; }).finally(() => alive() && tab === 'refs' && refsTab(b)); return; }
    if (rf.error) return mount(b, html`<div class="warnbox">${rf.error}</div>`);
    clearTimeout(rfPoll); if (rf.status === 'running') rfPoll = setTimeout(() => { if (alive() && tab === 'refs') { rf = null; refsTab($('#cbody', el)); } }, 15000);
    const pillars = (data.cfg.pillars || []).map((x) => x.name).filter(Boolean);
    if (!pillars.length) return mount(b, html`<div class="empty"><b>Primero los pilares</b>Defínelos en Planner. Luego aquí pegas hasta 5 videos de referencia por pilar.</div>`);
    const res = rf.result || {};
    mount(b, html`<div class="mut sm" style="margin-bottom:12px">Por pilar, pega hasta <b>5 videos</b> que te sirvan de referencia (Reels o TikToks). Apify busca lo que más rindió de <b>esos mismos creadores</b> y de <b>sus hashtags</b>, comparado con lo normal de cada cuenta. Después lo desglosas con Claude: hook, retención, estructura y cómo adaptarlo.</div>
      ${rf.status === 'running' ? html`<div class="warnbox sm" style="margin-bottom:12px">Apify está trabajando (${rf.phase === 1 ? 'leyendo tus referencias' : 'buscando similares'}). Esto se actualiza solo.</div>` : ''}${rf.warn ? html`<div class="warnbox sm">${rf.warn}</div>` : ''}${!rf.apify ? html`<div class="warnbox sm">Falta APIFY_TOKEN en Vercel.</div>` : ''}
      ${pillars.map((p) => { const urls = rf.videos?.[p] || [], r = res[p], bd = rf.breakdown?.[p];
        return html`<div class="card refpil"><div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:500;font-size:17px">${p}</b><span class="mut sm">${urls.length}/5 referencias</span><div class="sp"></div>
            ${r && (r.refs.length || r.similar.length) ? html`<button class="btn xs" data-act="refBreak" data-p="${p}">${ico('spark')} Desglosar con Claude</button>` : ''}</div>
          <div class="refurls">${[0, 1, 2, 3, 4].map((i) => html`<input class="in" data-ref="${p}" value="${urls[i] || ''}" placeholder="Link de un Reel o TikTok">`)}</div>
          ${r ? html`${r.owners?.length || r.tags?.length ? html`<div class="mut sm" style="margin:10px 0 6px">Se buscó en: ${r.owners.map((h) => '@' + h).join(', ')}${r.tags.length ? ' · #' + r.tags.join(' #') : ''}</div>` : ''}
            ${r.similar.length ? html`<div class="lbl" style="margin-top:6px">Similares que funcionaron</div><div class="grid homevids">${r.similar.map(videoCard)}</div>` : html`<div class="mut sm">No salieron similares todavía.</div>`}` : ''}
          ${bd?.items?.length ? html`<div class="lbl" style="margin-top:14px">Desglose · ${fdate(bd.at.slice(0, 10))}</div>${bd.items.map((x) => html`<div class="bditem"><a href="${/^https:\/\//.test(x.url) ? x.url : '#'}" target="_blank" rel="noopener noreferrer" class="sm">${x.url.replace(/^https:\/\/(www\.)?/, '').slice(0, 60)} ↗</a>${x.inferido ? html` <span class="chip amber sm2">inferido</span>` : ''}
              <div><b>Hook</b> ${x.hook}</div><div><b>Retención</b> ${x.retencion}</div>${x.estructura.length ? html`<div><b>Estructura</b> ${x.estructura.join(' → ')}</div>` : ''}<div><b>Por qué funcionó</b> ${x.por_que}</div><div><b>Cómo adaptarlo</b> ${x.adaptacion}</div></div>`)}` : ''}
        </div>`; })}
      <div class="row" style="margin-top:12px"><button class="btn ghost" data-act="refSave">Guardar referencias</button></div>`);
  }
  const refVideos = () => { const v = {}; el.querySelectorAll('[data-ref]').forEach((i) => { const u = i.value.trim(); if (u) (v[i.dataset.ref] ||= []).push(u); }); return v; };
  function breakPrompt(p) {
    const r = rf.result?.[p] || { refs: [], similar: [] }, list = [...r.refs.filter((x) => !x.missing), ...r.similar].slice(0, 10), bxc = data.cfg.bullseye?.center || data.cfg.bullseye?.rings?.[0]?.label;
    return `Eres el director creativo de Inherent. Desglosa por qué funcionaron estos videos del pilar «${p}» de la marca «${data.profile.name}», para CURARLOS y ADAPTARLOS (nunca copiarlos).
Abre cada link si puedes; si no puedes ver el video, deduce del texto y las métricas y marca "inferido": true.
Por video: el hook (qué pasa o se dice en los primeros 3 segundos), qué retuvo a la gente, la estructura en beats, por qué funcionó, y cómo lo adaptaría ${data.profile.name} dentro de este pilar.
${bxc ? `La adaptación le habla al CENTRO de la diana: ${bxc}. Del video se toma el craft (formato, hook, historia, edición), que sirve venga de donde venga; el tema se re-apunta a esa persona.\n` : ''}
${list.map((x) => `- ${x.url} · @${x.handle} · ${x.views ? x.views + ' vistas' : x.likes + ' likes'}${x.x ? ` · ${x.x}× su promedio` : ''}\n  ${String(x.text || '').replace(/\s+/g, ' ').slice(0, 220)}`).join('\n')}

Contesta SOLO con este JSON, sin texto antes ni después:
{"videos":[{"url":"","hook":"","retencion":"","estructura":[""],"por_que_funciono":"","adaptacion":"","inferido":false}]}`;
  }

  function bandeja(b) {
    if (inbox === null) { mount(b, html`<p class="loading">Leyendo la bandeja…</p>`); api(`community/inbox?profile=${encodeURIComponent(slug)}`).then((r) => { inbox = r; }).catch((e) => { inbox = { error: e.message }; }).then(() => alive() && tab === 'bandeja' && b.isConnected && bandeja(b)); return; }
    if (inbox.error) return mount(b, html`<div class="warnbox">${inbox.error}</div>`);
    if (!inbox.connected) return mount(b, html`<div class="warnbox">Para ver la bandeja falta conectar Zernio: agrega <b>ZERNIO_API_KEY</b> (con el grupo «messages» activo) en las variables de Vercel (Sensitive) y vuelve a publicar.</div>`);
    if (inbox.noAccounts) return mount(b, html`<div class="empty"><b>Este perfil no tiene cuentas propias</b>Agrégalas en <a href="#/content/fuentes/${slug}" style="color:inherit">Fuentes</a>.</div>`);
    if (!inbox.accounts) return mount(b, html`<div class="empty"><b>Zernio no tiene conectadas las cuentas de ${data.profile.name}</b>${inbox.handles.map((h) => '@' + h).join(', ')} · conéctalas en Zernio y recarga.</div>`);
    const ago = (d) => (d ? fdate(String(d).slice(0, 10)) : '');
    mount(b, html`<div class="row" style="margin-bottom:12px;gap:10px;flex-wrap:wrap"><span class="mut sm">Se contesta en Zernio (o con ⑧ Community). Lo nuevo puede tardar hasta 10 minutos en aparecer.</span><div class="sp"></div><a class="btn" href="https://zernio.com/dashboard" target="_blank" rel="noopener noreferrer">Contestar en Zernio ↗</a></div>
      <div class="grid g21" style="align-items:start">
        <div style="min-width:0"><div class="sec-title" style="margin-top:0"><h2 class="ttl">${ICON.inbox}Comentarios</h2><span class="mut sm">${inbox.comments.reduce((a, p) => a + p.comments.length, 0)}</span></div>
          ${inbox.comments.length ? inbox.comments.map((p) => html`<div class="card" style="margin-bottom:10px;padding:14px"><a class="row" href="${p.url}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;gap:10px">${safeImg(p.picture) ? html`<span class="rthumb" style="background-image:url('${safeImg(p.picture)}')"></span>` : ''}<span class="sm" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.text || 'Post'}</span><span class="mut sm">${ago(p.at)} ↗</span></a>
            ${p.comments.map((c) => html`<div class="inmsg"><b>@${c.from}</b><span>${c.text}</span><span class="mut sm">${ago(c.at)}${c.replies ? ` · ${c.replies} respuesta${c.replies === 1 ? '' : 's'}` : ' · sin responder'}${/^https:\/\//.test(c.url || '') ? html` · <a href="${c.url}" target="_blank" rel="noopener noreferrer" style="color:inherit">ver ↗</a>` : ''}</span></div>`)}</div>`) : html`<div class="mut sm">Sin comentarios recientes.</div>`}</div>
        <div style="min-width:0"><div class="sec-title" style="margin-top:0"><h2 class="ttl">${ICON.user}Mensajes directos</h2><span class="mut sm">${inbox.dms.length}</span></div>
          <div class="card" style="padding:6px 14px">${inbox.dms.length ? inbox.dms.map((d) => html`<div class="inmsg"><b>${d.who}</b><span>${d.last}</span><span class="mut sm">${RED[d.platform] || d.platform} · ${ago(d.at)}</span></div>`) : html`<div class="mut sm" style="padding:8px 0">Sin conversaciones activas.</div>`}</div></div>
      </div>`);
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
      <div class="card" style="padding:12px">${dirs.map((f) => html`<button class="artifact" data-act="gdir" data-id="${f.id}" data-n="${f.name}" style="width:100%;margin:4px 0"><span class="fi">${ico('folder')}</span><div style="text-align:left;min-width:0"><b style="font-weight:500;overflow-wrap:anywhere">${f.name}</b></div></button>`)}
        ${docs.map((f) => html`<button class="artifact" data-act="gfile" data-id="${f.id}" style="width:100%;margin:4px 0;${cur && f.id === cur.id ? 'outline:2px solid var(--ink)' : ''}"><span class="fi">${ico('edit')}</span><div style="text-align:left;min-width:0"><b style="font-weight:500;overflow-wrap:anywhere">${f.name}</b><div class="mut" style="font-size:11px">${f.modified ? fdate(f.modified.slice(0, 10)) : ''}${f.owner ? ' · ' + f.owner : ''}</div></div></button>`)}</div>
      ${cur ? html`<div class="card swap" style="min-width:0;padding:10px"><div class="row" style="margin-bottom:8px"><b style="font-weight:500">${cur.name}</b><div class="sp"></div><a class="btn ghost xs" href="${cur.link}" target="_blank" rel="noopener noreferrer">Abrir en Drive ↗</a></div><iframe src="${preview(cur)}" style="width:100%;height:70vh;border:0;border-radius:12px;background:#fdfaf3" loading="lazy"></iframe></div>` : html`<div class="empty"><b>Elige una carpeta</b>Los guiones están adentro.</div>`}</div>`}`);
  }

  // ---------- Planner: calendario semana / mes, con pilares y si cada pieza ya está en Drive ----------
  const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const PAL = ['#795c45', '#997d65', '#87684e', '#a68d77', '#80624a', '#82644b', '#654c38', '#2c1f16'];
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
  // Cómo se reparte el contenido entre pilares (lo que no tiene pilar va en gris).
  function pillarDonut(pillars, list) {
    const parts = [...pillars.map((x) => ({ c: x.color, n: list.filter((p) => p.pillar === x.name).length })), { c: '#eee6da', n: list.filter((p) => !pillars.some((x) => x.name === p.pillar)).length }].filter((x) => x.n);
    const total = parts.reduce((a, x) => a + x.n, 0), R = 30, C = 2 * Math.PI * R; let off = 0;
    const arcs = parts.map((x) => { const len = (x.n / total) * C; const a = `<circle r="${R}" cx="40" cy="40" fill="none" stroke="${x.c}" stroke-width="14" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 40 40)"/>`; off += len; return a; }).join('');
    return raw(`<svg width="80" height="80" viewBox="0 0 80 80" aria-label="Reparto por pilar">${total ? arcs : `<circle r="${R}" cx="40" cy="40" fill="none" stroke="#f0e9de" stroke-width="14"/>`}<text x="40" y="44" text-anchor="middle" font-size="14" fill="#2c1f16">${total}</text></svg>`);
  }
  function plan(b) {
    if (needPosts(b, plan)) return;
    const pillars = data.cfg.pillars || [];
    const colorOf = (n) => pillars.find((x) => x.name === n)?.color || '#e0d4c4';
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
      <div class="card" style="padding:14px;margin-bottom:12px"><div class="row" style="flex-wrap:wrap;gap:14px;align-items:center">${pillarDonut(pillars, inRange)}
        <div style="flex:1;min-width:200px"><b class="sm" style="font-weight:500">Pilares · ${pview === 'mes' ? 'este mes' : 'esta semana'}</b>
        <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${pillars.length ? pillars.map((x) => { const c = inRange.filter((p) => p.pillar === x.name).length; return html`<span class="chip" style="gap:6px"><i style="width:10px;height:10px;border-radius:50%;background:${x.color};display:inline-block"></i>${x.name}<span class="mut">${c}${inRange.length ? ` · ${Math.round((c / inRange.length) * 100)}%` : ''}</span></span>`; }) : html`<span class="mut sm">Sin pilares todavía: defínelos para ver cómo se reparte el contenido.</span>`}</div></div>
        <button class="btn ghost xs" data-act="pillars">${pillars.length ? 'Editar pilares' : '+ Pilares'}</button></div></div>
      <div class="row" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <button class="arrow light" data-act="pnav" data-d="-1">‹</button><b style="font-weight:500;min-width:150px;text-align:center">${title}</b><button class="arrow light" data-act="pnav" data-d="1">›</button>
        <button class="sm mut" data-act="ptoday">Hoy</button><div class="sp"></div>
        <span class="mut sm">${ico('folder')} en Drive · ⬆ por subir · ${ico('edit')} por grabar</span>
        <div class="tabs" style="margin:0">${[['semana', 'Semana'], ['mes', 'Mes']].map(([k, l]) => html`<button class="${pview === k ? 'on' : ''}" data-act="pview" data-v="${k}">${l}</button>`)}</div>
        <button class="btn" data-act="pnew" data-d="">+ Pieza</button></div>
      <div class="pcal ${pview}">${DOW.map((d) => html`<div class="pdow">${d}</div>`)}
        ${days.map((d) => { const k = iso(d); const l = posts.filter((p) => p.date === k); return html`<div class="pday ${pview === 'mes' && d.getMonth() !== a.getMonth() ? 'out' : ''} ${k === T ? 'today' : ''}" data-act="pnew" data-d="${k}"><span class="pn">${d.getDate()}</span>${l.map(chip)}</div>`; })}</div>
      ${undated.length ? html`<div class="sec-title"><h2>Sin fecha</h2><span class="mut sm">${undated.length}</span></div><div class="row" style="flex-wrap:wrap;gap:6px">${undated.map(chip)}</div>` : ''}`);
  }

  // ---------- Research: los videos que funcionaron, como galería (el scrape + lo que sube Claude con el conector) ----------
  // Cada video puede traer «por qué funcionó» y una plantilla para la marca: los dos los escribe Claude y los sube con guardar_research.
  // Research muestra SOLO lo que sube Claude con el conector de Inherent (guardar_research). El scrape semanal no entra aquí.
  function needResearch(b, fn) {
    if (rs) return false;
    mount(b, html`<p class="loading">Cargando research…</p>`);
    C.list().then((l) => { rs = l.filter((x) => x.kind === 'research' && x.profile === slug); }).catch(() => { rs = []; }).then(() => alive() && b.isConnected && fn(b));
    return true;
  }
  function researchItems() {
    return (rs || []).filter((x) => x.url).map((x) => ({ ...x, tipo: x.tipo || 'agregado', key: rkey(x.url) }))
      .sort((a, z) => (z.x || 0) - (a.x || 0) || (z.views || 0) - (a.views || 0));
  }
  // La fuente: cuántos subió el conector, cuándo y quién. Desde aquí se copia la instrucción para Claude o se vacía.
  const mcpPrompt = () => `Sube a Research del OS de Inherent lo que encontraste, con el conector de Inherent. Primero llama perfiles() para confirmar el perfil: es «${slug}». Luego guardar_research con perfil «${slug}» y una lista en «posts» (hasta 40 por llamada). Cada post: url, formato (reel, carrusel o estatico), creador, fecha, titulo (nombre corto del formato), metricas {vistas, likes, comentarios, duracion_s, multiplicador (vs su mediana), engagement_pct}, miniatura, slides si es carrusel, caption, por_que_funciono {hook, retencion, estructura, por_que, adaptacion}, dificultad (1 a 5), tiempo_grabacion, receta y clips si los tienes, y tags: el pilar, el tipo de formato, «resonancia alta|media|baja», «sin hablar|voz en off|hablando a cámara» y lo que sirva para filtrar. En adaptacion, el primer párrafo es «Tu versión»; lo demás (texto en pantalla, clips, receta) se muestra en Análisis. Antes de subir, revisa con listar_research para no duplicar. No inventes métricas y solo urls https.`;
  function sourceBox(all) {
    const ts = (x) => String(x._meta?.updated_at || x._meta?.created_at || ''), last = all.map(ts).filter((x) => !isNaN(Date.parse(x))).sort().pop();
    const who = all.find((x) => ts(x) === last)?._meta?.updated_by || all.find((x) => ts(x) === last)?._meta?.created_by;
    return html`<div class="rsource"><span class="fi">${ico('bolt', 16)}</span><div style="flex:1;min-width:200px"><b style="font-weight:500">Fuente: conector de Claude</b>
        <div class="mut sm">${all.length ? `${all.length} post${all.length === 1 ? '' : 's'} subido${all.length === 1 ? '' : 's'} con guardar_research${last ? ' · ' : ''}${last ? `último ${fdate(new Date(last).toISOString().slice(0, 10))}` : ''}${who ? ` por ${who}` : ''}` : 'Todavía no se ha subido nada. Claude lo sube con guardar_research.'}</div></div>
      <button class="btn ghost xs" data-act="rprompt">Copiar instrucción para Claude</button><button class="btn ghost xs" data-act="rreload">Actualizar</button>${all.length ? html`<button class="btn ghost xs" data-act="rclear">Vaciar</button>` : ''}</div>`;
  }
  const rmatch = (x, k) => k === 'todos' || (k === 'analisis' ? Boolean(x.why) : x.tipo === k);
  const fmatch = (x, k) => k === 'todo' || (k === 'plantilla' ? Boolean(x.plantilla) : fmtOf(x) === k);
  const rcard = (it) => { const t = safeImg(it.thumb), f = fmtOf(it); return html`<button class="rcard" data-act="ropen" data-k="${it.key}" ${t ? raw(`style="background-image:url('${t}')"`) : ''}>
      <span class="rbadge">${it.plantilla ? 'Plantilla' : it.x ? it.x + '×' : RKL[it.tipo] || 'Video'}</span>
      <span class="ricons">${it.tested ? html`<i title="Probado">${ico('check', 13)}</i>` : ''}${f !== 'reel' ? html`<i title="${f === 'carrusel' ? 'Carrusel' : 'Estático'}">${ico(f === 'carrusel' ? 'layers' : 'image', 13)}</i>` : ''}${it.why ? html`<i title="Tiene análisis">${ico('bulb', 13)}</i>` : ''}</span>
      ${t ? '' : html`<span class="rnothumb">${ico(f === 'reel' ? 'play' : f === 'carrusel' ? 'layers' : 'image', 20)}</span>`}
      <span class="rfoot"><b>@${it.handle || '—'}</b><span>${it.views ? html`${ico('play', 12)} ${K(it.views)}` : it.likes ? html`${ico('heart')} ${K(it.likes)}` : ''}</span></span></button>`; };
  const rsearch = (x, q) => !q || [x.title, x.handle, x.text, x.style, ...(x.tags || []), x.pillar, x.why?.hook, x.why?.por_que, x.why?.adaptacion].join(' ').toLowerCase().includes(q);
  const SORTS = [['res', 'Resonancia primero'], ['x', 'Más veces su promedio'], ['views', 'Más vistas'], ['recent', 'Más recientes']];
  const rsorter = { res: (a, z) => (RESN[resOf(z)] || 0) - (RESN[resOf(a)] || 0) || (z.x || 0) - (a.x || 0), x: (a, z) => (z.x || 0) - (a.x || 0), views: (a, z) => (z.views || 0) - (a.views || 0), recent: (a, z) => String(z.at || '').localeCompare(String(a.at || '')) };
  function research(b) {
    if (needResearch(b, research)) return;
    const W = isoWeek(), q = rq.trim().toLowerCase();
    const all = researchItems(), base = rview === 'semana' ? all.filter((x) => x.week === W) : all;
    const sel = (x) => fmatch(x, rfmt) && rmatch(x, rfilter) && (!rsel.pilar || x.pillar === rsel.pilar) && (!rsel.res || resOf(x) === rsel.res) && (!rsel.talk || x.talk === rsel.talk) && (!rsel.style || x.style === rsel.style) && (!rsel.tag || (x.tags || []).includes(rsel.tag)) && rsearch(x, q);
    const list = base.filter(sel).sort(rsorter[rsort]);
    const pillars = [...new Set([...(data.cfg.pillars || []).map((x) => x.name), ...distinct(all, (x) => x.pillar)])].filter(Boolean);
    const RL = ['alta', 'media', 'baja'], present = { res: RL.filter((r) => all.some((x) => resOf(x) === r)), talk: TALK.filter(([v]) => all.some((x) => x.talk === v)), style: distinct(all, (x) => x.style), tag: distinct(all, (x) => x.tags).slice(0, 24) };
    const frow = (lbl, k, opts) => html`<div class="rfrow"><span class="lbl">${lbl}</span><div class="rfopts">${opts.map(([v, l]) => html`<button class="chip ${rsel[k] === v ? 'dark' : ''}" data-act="rsel" data-k="${k}" data-v="${v}">${l}</button>`)}</div></div>`;
    mount(b, html`<div class="rtiles">${RFMT.map(([k, l, i]) => html`<button class="rtile ${rfmt === k ? 'on' : ''}" data-act="rfmt" data-k="${k}"><i>${ico(i, 22)}</i><span>${l}</span></button>`)}</div>
      <div class="row" style="gap:10px;flex-wrap:wrap;margin:16px 0 12px"><div class="tabs" style="margin:0">${[['biblioteca', 'Biblioteca'], ['semana', `Mi semana · ${all.filter((x) => x.week === W).length}`]].map(([k, l]) => html`<button class="${rview === k ? 'on' : ''}" data-act="rview" data-v="${k}">${l}</button>`)}</div>
</div>
      ${sourceBox(all)}
      <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:10px"><input class="in" id="rq" placeholder="Buscar: cuenta, tema, hook, estilo…" value="${rq}" style="flex:1;min-width:220px"><select class="in" id="rsort" style="width:auto">${SORTS.map(([k, l]) => html`<option value="${k}" ${rsort === k ? raw('selected') : ''}>${l}</option>`)}</select></div>
      <details class="rfilt" ${rfOpen ? raw('open') : ''}><summary>${ico('bars', 15)} Filtrar${(n => n ? html` <b>${n}</b>` : '')([rfilter !== 'todos', ...Object.values(rsel)].filter(Boolean).length)}</summary>
      <div class="rfilters">
        <div class="rfrow"><span class="lbl">Fuente</span><div class="rfopts">${RKIND.map(([k, l]) => html`<button class="chip ${rfilter === k ? 'dark' : ''}" data-act="rfilter" data-k="${k}">${l}</button>`)}</div></div>
        ${pillars.length ? frow('Pilar', 'pilar', pillars.map((x) => [x, x])) : ''}
        ${present.res.length ? frow('Resonancia', 'res', present.res.map((x) => [x, x])) : ''}
        ${present.talk.length ? frow('¿Hablas?', 'talk', present.talk) : ''}
        ${present.style.length ? frow('Tipo', 'style', present.style.map((x) => [x, x])) : ''}
        ${present.tag.length ? frow('Etiquetas', 'tag', present.tag.map((x) => [x, x])) : ''}
      </div>
      </details>
      <div class="mut sm" style="margin:10px 0 12px;font-family:ui-monospace,Menlo,monospace">${list.length} de ${base.length} formatos${rview === 'semana' ? ` · semana ${W.slice(-2)}` : ''}</div>
      ${list.length ? html`<div class="rgrid">${list.map(rcard)}</div>` : html`<div class="empty"><b>${rview === 'semana' ? 'Tu semana está vacía' : all.length ? 'Nada con esos filtros' : 'Research está vacío'}</b>${rview === 'semana' ? 'Abre un formato de la Biblioteca y toca «A mi semana».' : all.length ? 'Quita algún filtro.' : 'Se llena cuando Claude sube posts con el conector. Copia la instrucción de arriba y pégasela.'}</div>`}`);
    const qi = $('#rq', b); qi.oninput = () => { rq = qi.value; const pos = qi.selectionStart; research(b); const n = $('#rq', b); n.focus(); n.setSelectionRange(pos, pos); };
    const fd = $('.rfilt', b); if (fd) fd.ontoggle = () => { rfOpen = fd.open; };
    $('#rsort', b).onchange = (e) => { rsort = e.target.value; research(b); };
  }
  // Guarda etiquetas de un post de Research: si solo venía del scrape, se crea con el mismo id que usa el conector.
  async function rsave(it, patch) {
    const id = await rsid(slug, it.url);
    const cur = (rs || []).find((x) => x.id === id) || (await C.get(id).catch(() => null));
    const keep = Object.fromEntries(['url', 'red', 'handle', 'thumb', 'views', 'likes', 'comments', 'shares', 'x', 'at', 'text', 'tipo', 'format', 'slides'].filter((k) => it[k] != null && it[k] !== '').map((k) => [k, it[k]]));
    const r = cur ? await C.save({ ...cur, ...patch }) : await C.create({ id, kind: 'research', profile: slug, ...keep, ...patch });
    rs = [...(rs || []).filter((x) => x.id !== r.id), r];
    return r;
  }
  const vidLine = (it) => [it.url, `@${it.handle || '—'}`, RED[it.red] || it.red, it.views && `${it.views} vistas`, it.likes && `${it.likes} likes`, it.x && `${it.x}× su promedio`].filter(Boolean).join(' · ');
  const whyText = (w) => [w.hook && `Hook: ${w.hook}`, w.retencion && `Qué retuvo: ${w.retencion}`, w.estructura?.length && `Estructura: ${w.estructura.join(' → ')}`, w.por_que && `Por qué funcionó: ${w.por_que}`].filter(Boolean).join('\n');
  // «Usar plantilla»: abre Claude Code en la nube con todo listo. Lee el brand kit de la marca y entrega el video como plantilla terminada.
  function usePrompt(it) {
    const p = data.profile, r = root();
    return `/inherent ④ Creatividad · ${p.name}: convierte este video de referencia en una plantilla terminada para la marca.

Video: ${it.url}${it.title ? ` («${it.title}»)` : ''}
1. Lee el post completo con el conector de Inherent: leer_research, perfil «${slug}», ese url (trae métricas, hook, tu versión, receta, clips y por qué funcionó).
2. Lee ${r}/CLAUDE.md y el brand kit: ${r}/02-marca/ y los links de Figma y Drive en ${r}/00-onboarding/LINKS.md. Si no está ahí, búscalo y dime dónde quedó.
3. Del video toma solo el craft (formato, hook, ritmo, estructura, edición); el tema sale de la estrategia (${r}/01-estrategia/).
4. Entrega la plantilla con estas secciones, en Markdown: ## Hook (texto y visual) · ## Guion por escena (tiempos) · ## Tomas · ## Texto en pantalla · ## Música y ritmo · ## Edición · ## Assets de la marca (fondos, logos, tipografías, hex).
5. Súbela con guardar_research: perfil «${slug}», ese url y la plantilla en «plantilla».`;
  }
  function whyPrompt(it) {
    const p = data.profile;
    return `/inherent ④ Creatividad · ${p.name}: desglosa por qué funcionó este video.

Video: ${vidLine(it)}
${it.text ? `Texto del post: ${String(it.text).replace(/\s+/g, ' ').slice(0, 300)}\n` : ''}
Ábrelo si puedes. Si no puedes verlo, deduce del texto y las métricas y márcalo como inferido.
Devuelve: el hook (lo que pasa o se dice en los primeros 3 segundos), qué retuvo a la gente, la estructura en beats, por qué funcionó y cómo lo adaptaría ${p.name} (su estrategia está en ${root()}/01-estrategia/).
Súbelo al OS con el conector de Inherent: guardar_research con perfil «${slug}» y en «posts» este post: url, titulo, metricas {vistas, likes, comentarios, duracion_s, multiplicador}, dificultad (1 a 5), tiempo_grabacion, receta, clips {tiempo, que}, tags y por_que_funciono {hook, retencion, estructura, por_que, adaptacion (el primer párrafo es tu versión para la marca), inferido}.`;
  }
  // El detalle, como en Edits: el video en grande, la cuenta y «Usar plantilla» abajo, las acciones al lado.
  function ropen(k) {
    const it = researchItems().find((x) => x.key === k); if (!it) return;
    const w = it.why || {}, em = embedOf(it.url), t = safeImg(it.thumb), f = fmtOf(it), slides = (it.slides || []).map(safeImg).filter(Boolean);
    const stats = [it.views && [K(it.views), 'Vistas'], !it.views && it.likes && [K(it.likes), 'Likes'], it.x && [`×${it.x}`, 'Su mediana'], it.dur && [mss(it.dur), 'Duración'], it.diff && [`${it.diff}/5`, 'Dificultad'], it.er && !it.diff && [`${it.er}%`, 'Engagement']].filter(Boolean);
    const chips = [it.pillar && [it.pillar, 'on'], it.style && [it.style], it.talk && [TALKL[it.talk]], it.rec && [`${it.rec} grabando`], ...(it.tags || []).map((x) => [x])].filter(Boolean);
    // «adaptacion»: el primer párrafo es «Tu versión»; lo demás (texto en pantalla, clips, receta) va a Análisis.
    const ad = String(w.adaptacion || '').trim(), cut = ad.search(/\n\s*\n|\n(?=\s*(#|[-*•]|\d+[.)]|\*\*))/), mine = cut > 0 ? ad.slice(0, cut).trim() : ad, analysis = cut > 0 ? ad.slice(cut).trim() : '';
    const allR = researchItems(), styleOpts = distinct(allR, (x) => x.style), pillarOpts = [...new Set([...(data.cfg.pillars || []).map((x) => x.name), ...distinct(allR, (x) => x.pillar)])].filter(Boolean);
    const receta = it.receta || [], clips = it.clips || [];
    document.querySelector('.rview')?.remove();
    const v = document.createElement('div'); v.className = 'rview';
    mount(v, html`<div class="rv-col">
        <div class="rv-media" id="rvmedia">${f === 'reel' && em ? html`<div class="rv-poster" ${t ? raw(`style="background-image:url('${t}')"`) : ''}><span class="rv-load">Cargando video…</span></div>`
          : slides.length ? html`<div class="rv-slides">${slides.map((u) => html`<div style="background-image:url('${u}')"></div>`)}</div>`
          : html`<div class="rv-poster" ${t ? raw(`style="background-image:url('${t}')"`) : ''}></div>`}
          <button class="rv-back" data-v="close" title="Cerrar">${ico('x', 18)}</button></div>
        <div class="rv-foot"><div class="rv-acc"><span class="rv-av">${(it.handle || '?')[0].toUpperCase()}</span><div><b>@${it.handle || '—'}</b><div class="sm">${[RED[it.red] || it.red, { reel: 'Reel', carrusel: 'Carrusel', estatico: 'Estático' }[f], RKL[it.tipo]].filter(Boolean).join(' · ')}</div></div></div>
          <button class="rv-use" data-v="use">${ICON.sparkle} Usar plantilla</button></div>
      </div>
      <div class="rv-actions"><button class="rv-plus" data-v="plan" title="Agendar en el calendario de publicación">${ico('plus', 22)}</button><button data-v="why" title="Por qué funcionó">${ico('bars', 20)}</button>${/^https:\/\//.test(it.url) ? html`<a href="${it.url}" target="_blank" rel="noopener noreferrer" title="Abrir el original">${ico('globe', 20)}</a>` : ''}<button data-v="del" title="Quitar de Research">${ico('trash', 20)}</button></div>
      <div class="rv-info">
        <div class="rfc-head"><h2>${rtitle(it)}</h2>${resOf(it) ? html`<span class="rfc-res ${resOf(it)}">${resOf(it)}</span>` : ''}</div>
        ${stats.length ? html`<div class="rfc-stats">${stats.map(([v2, l]) => html`<div><b>${v2}</b><span>${l}</span></div>`)}</div>` : ''}
        ${chips.length ? html`<div class="rfc-chips">${chips.map(([l, c]) => html`<span class="${c || ''}">${l}</span>`)}</div>` : ''}
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
        <div class="rfc-foot">${/^https:\/\//.test(it.url) ? html`<a href="${it.url}" target="_blank" rel="noopener noreferrer">Ver original @${it.handle || '—'} ↗</a>` : html`<span></span>`}<button class="rfc-btn ${it.tested ? 'on' : ''}" data-v="tested">${it.tested ? '✓ Probado' : 'Marcar probado'}</button></div>
        <details class="rfc-edit"><summary>Etiquetas</summary>
          <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="chip ${it.week === isoWeek() ? 'dark' : ''}" data-v="week">${it.week === isoWeek() ? '✓ En mi semana' : '+ A mi semana'}</button></div>
          <div class="grid g2 rtags" style="gap:8px;margin-top:10px;border:0;padding:0">
            <label class="sm">Resonancia<select class="in" data-tag="resonance"><option value="">${resOf(it) ? `auto: ${resOf(it)}` : '—'}</option>${['alta', 'media', 'baja'].map((x) => html`<option ${it.resonance === x ? raw('selected') : ''}>${x}</option>`)}</select></label>
            <label class="sm">¿Hablas?<select class="in" data-tag="talk"><option value="">—</option>${TALK.map(([v2, l]) => html`<option value="${v2}" ${it.talk === v2 ? raw('selected') : ''}>${l}</option>`)}</select></label>
            <label class="sm">Tipo<input class="in" data-tag="style" list="rv-styles" value="${it.style || ''}" placeholder="—"><datalist id="rv-styles">${styleOpts.map((x) => html`<option value="${x}">`)}</datalist></label>
            <label class="sm">Pilar<input class="in" data-tag="pillar" list="rv-pillars" value="${it.pillar || ''}" placeholder="—"><datalist id="rv-pillars">${pillarOpts.map((x) => html`<option value="${x}">`)}</datalist></label>
          </div></details>
      </div>`);
    document.body.appendChild(v);
    // El video se ve aquí mismo: el servidor saca el link directo del reel (caduca, por eso se pide al abrir). Si Instagram no lo deja, queda la miniatura con el link al original.
    if (f === 'reel' && em) {
      const box = $('#rvmedia', v), fallback = () => { const l = box.querySelector('.rv-load'); if (l) l.outerHTML = `<a class="rv-load rv-ext" href="${it.url}" target="_blank" rel="noopener noreferrer">Instagram no deja verlo aquí · Abrir ↗</a>`; };
      fetch('/api/content/video?' + new URLSearchParams({ url: it.url })).then((r) => (r.ok ? r.json() : {})).then(({ src }) => {
        const p = box.querySelector('.rv-poster'); if (!p) return; if (!src) return fallback();
        const vd = document.createElement('video'); Object.assign(vd, { src, controls: true, autoplay: true, muted: true, loop: true, playsInline: true }); if (t) vd.poster = t;
        vd.setAttribute('referrerpolicy', 'no-referrer'); vd.onerror = fallback; p.replaceWith(vd);
      }).catch(fallback);
    }
    const close = () => { v.remove(); removeEventListener('keydown', esc); }, esc = (e) => { if (e.key === 'Escape') close(); };
    addEventListener('keydown', esc); addEventListener('hashchange', close, { once: true });
    const tag = async (patch, msg) => { try { Object.assign(it, await rsave(it, patch)); toast(msg); research($('#cbody', el)); } catch (er) { toast(er.message, true); } };
    v.querySelectorAll('[data-tag]').forEach((sl) => { sl.onchange = () => tag({ [sl.dataset.tag]: sl.value.trim().slice(0, 80) }, 'Etiqueta guardada'); });
    v.onclick = async (e) => {
      if (e.target === v) return close();
      const tg = e.target.closest('[data-v="week"],[data-v="tested"]');
      if (tg) { const on = tg.dataset.v === 'week' ? it.week !== isoWeek() : !it.tested; await tag(tg.dataset.v === 'week' ? { week: on ? isoWeek() : '' } : { tested: on }, tg.dataset.v === 'week' ? (on ? 'Agregado a tu semana' : 'Quitado de tu semana') : on ? 'Marcado como probado' : 'Quitado de probados');
        tg.classList.toggle('dark', on); tg.classList.toggle('on', on); tg.textContent = tg.dataset.v === 'week' ? (on ? '✓ En mi semana' : '+ A mi semana') : on ? '✓ Probado' : 'Marcar probado'; return; }
      const a = e.target.closest('[data-v]')?.dataset.v; if (!a) return;
      if (a === 'close') close();
      if (a === 'del') { if (!(await confirmAsk('¿Quitar este post de Research?'))) return; try { await C.remove(it.id); rs = (rs || []).filter((x) => x.id !== it.id); close(); toast('Quitado de Research'); research($('#cbody', el)); } catch (er) { toast(er.message, true); } return; }
      if (a === 'use') { openClaude(usePrompt(it)); toast('Se abrió Claude Code con todo listo: dale enviar'); }
      if (a === 'ask') { openClaude(whyPrompt(it)); toast('Se abrió Claude Code: dale enviar. Cuando termine, toca «Actualizar»'); }
      if (a === 'why') { const d = $('#rvwhy', v); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
      if (a === 'plan') {
        const x = await ask('Agendar en Publicación', [{ k: 'title', l: 'Idea', v: `Basado en @${it.handle || 'referencia'}`, req: true }, { k: 'date', l: 'Fecha', t: 'date', v: today(), req: true, half: true }, { k: 'format', l: 'Formato', t: 'select', opts: ['Reel', 'Carrusel', 'Estático', 'TikTok', 'Story'], v: f === 'carrusel' ? 'Carrusel' : f === 'estatico' ? 'Estático' : 'Reel', half: true }], 'Agendar');
        if (!x) return;
        try { await C.create({ kind: 'post', profile: slug, title: x.title, date: x.date, format: x.format, status: 'Idea', caption: `Referencia: ${it.url}` }); posts = null; toast('Agendado en Calendario → Publicación'); } catch (er) { toast(er.message, true); }
      }
    };
  }

  // ---------- Calendario: Publicación (las piezas del Planner) y Grabación (qué se graba cada día) ----------
  const recal = () => (tab === 'calendario' ? calendario($('#cbody', el)) : plan($('#cbody', el)));
  function calendario(b) {
    mount(b, html`<div class="tabs" style="margin:0 0 14px">${[['publicacion', 'Publicación'], ['grabacion', 'Grabación']].map(([k, l]) => html`<button class="${cview === k ? 'on' : ''}" data-act="cview" data-v="${k}">${l}</button>`)}</div><div id="calb"></div>`);
    (cview === 'grabacion' ? grabacion : plan)($('#calb', b));
  }
  function calRange() {
    const a = new Date(pdate + 'T12:00');
    const first = pview === 'mes' ? new Date(a.getFullYear(), a.getMonth(), 1, 12) : a;
    const start = monday(first);
    const n = pview === 'mes' ? Math.ceil((((first.getDay() + 6) % 7) + new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate()) / 7) * 7 : 7;
    const days = Array.from({ length: n }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
    const from = iso(days[0]), to = iso(days[days.length - 1]);
    return { a, days, from, to, title: pview === 'mes' ? a.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase()) : `${fdate(from)} – ${fdate(to)}` };
  }
  function grabacion(b) {
    if (shoots === null) { mount(b, html`<p class="loading">Cargando grabaciones…</p>`); C.list().then((l) => { shoots = l.filter((x) => x.kind === 'shoot' && x.profile === slug); }).catch((e) => { shoots = []; toast(e.message, true); }).then(() => alive() && b.isConnected && grabacion(b)); return; }
    const { a, days, from, to, title } = calRange(), T = today();
    const inRange = shoots.filter((x) => x.date >= from && x.date <= to && x.status !== 'Cancelado');
    const chip = (x) => html`<button class="ppost shoot ${x.status === 'Grabado' ? 'done' : ''}" data-act="sedit" data-id="${x.id}" title="${x.title}${x.place ? ' · ' + x.place : ''}"><span class="pi">${x.time || ico('video', 13)}</span><span class="pt">${x.title}</span></button>`;
    mount(b, html`<div class="row" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <button class="arrow light" data-act="pnav" data-d="-1">‹</button><b style="font-weight:500;min-width:150px;text-align:center">${title}</b><button class="arrow light" data-act="pnav" data-d="1">›</button>
        <button class="sm mut" data-act="ptoday">Hoy</button><div class="sp"></div>
        <span class="mut sm">${inRange.length} grabaci${inRange.length === 1 ? 'ón' : 'ones'} ${pview === 'mes' ? 'este mes' : 'esta semana'}</span>
        <div class="tabs" style="margin:0">${[['semana', 'Semana'], ['mes', 'Mes']].map(([k, l]) => html`<button class="${pview === k ? 'on' : ''}" data-act="pview" data-v="${k}">${l}</button>`)}</div>
        <button class="btn" data-act="snew" data-d="">+ Grabación</button></div>
      <div class="pcal ${pview}">${DOW.map((d) => html`<div class="pdow">${d}</div>`)}
        ${days.map((d) => { const k = iso(d); const l = shoots.filter((x) => x.date === k).sort((x, z) => String(x.time || '').localeCompare(String(z.time || ''))); return html`<div class="pday ${pview === 'mes' && d.getMonth() !== a.getMonth() ? 'out' : ''} ${k === T ? 'today' : ''}" data-act="snew" data-d="${k}"><span class="pn">${d.getDate()}</span>${l.map(chip)}</div>`; })}</div>`);
  }
  async function editShoot(x, date) {
    const v = await ask(x ? 'Grabación' : 'Nueva grabación', [
      { k: 'title', l: '¿Qué se graba?', v: x?.title, req: true },
      { k: 'date', l: 'Fecha', t: 'date', v: x?.date || date || today(), req: true, half: true },
      { k: 'time', l: 'Hora', t: 'time', v: x?.time, half: true },
      { k: 'place', l: 'Lugar', v: x?.place, half: true },
      { k: 'crew', l: 'Quién graba', v: x?.crew, half: true },
      { k: 'pieces', l: 'Piezas y tomas (una por línea)', t: 'textarea', v: x?.pieces },
      { k: 'notes', l: 'Notas', t: 'textarea', v: x?.notes },
      ...(x ? [{ k: 'status', l: 'Estado', t: 'select', opts: [...SHOOT, ['__del', 'Eliminar esta grabación']], v: x.status || SHOOT[0] }] : []),
    ], x ? 'Guardar' : 'Agendar');
    if (!v) return;
    try {
      if (v.status === '__del') { if (!(await confirmAsk(`¿Eliminar «${x.title}»?`))) return; await C.remove(x.id); shoots = shoots.filter((y) => y.id !== x.id); toast('Grabación eliminada'); }
      else if (x) { const r = await C.save({ ...x, ...v }); shoots = shoots.map((y) => (y.id === r.id ? r : y)); toast('Guardado'); }
      else { const r = await C.create({ kind: 'shoot', profile: slug, status: SHOOT[0], ...v }); shoots = [...shoots, r]; toast('Grabación agendada'); }
      recal();
    } catch (e) { toast(e.message, true); }
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
      ${ig.series.length > 1 ? html`<div class="card wkbox"><div class="wkhead"><h3>Alcance y vistas por día</h3><span class="sm row" style="gap:14px"><span class="row" style="gap:6px"><i style="width:16px;height:2px;background:#2c1f16;display:inline-block"></i>Alcance</span><span class="row" style="gap:6px"><i style="width:16px;height:0;border-top:2px dashed #997d65;display:inline-block"></i>Vistas</span></span></div><div class="chart" id="chIG"></div></div>` : ''}
      <div class="card wkbox" style="margin-top:12px"><div class="wkhead"><div><h3>Reels · ¿hasta dónde los ven?</h3><span class="mut sm">Últimos 90 días · ${w.n || 0} reels con watch time · ${w.hours || 0} h vistas en total${w.hookLost ? html` · <b style="color:#654c38">${w.hookLost} se pierden en el hook (&lt;3 s)</b>` : ''}</span></div></div>
        ${reels.length ? html`<div class="tscroll"><table class="wktable"><thead><tr><th>Reel</th><th>Fecha</th><th class="n">Vistas</th><th class="n">Alcance</th><th style="min-width:150px">Watch time promedio</th><th class="n">Total</th><th class="n">${ico('heart')}</th><th class="n">Guardados</th><th class="n">Compartidos</th></tr></thead><tbody>
          ${reels.map((x) => html`<tr><td>${x.url ? html`<a href="${x.url}" target="_blank" rel="noopener noreferrer" style="color:inherit" class="row">${safeImg(x.thumb) ? html`<span class="rthumb" style="background-image:url('${safeImg(x.thumb)}')"></span>` : ''}<span class="sm" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x.caption || 'Ver reel'}</span></a>` : html`<span class="sm">${x.caption || '—'}</span>`}</td>
            <td class="mut">${fdate(x.date)}</td><td class="n"><b style="font-weight:500">${K(x.views)}</b></td><td class="n">${K(x.reach)}</td>
            <td>${x.avg ? html`<div class="row" style="gap:8px"><div style="flex:1;height:8px;border-radius:99px;background:#f0e9de"><div style="width:${Math.round((x.avg / maxAvg) * 100)}%;height:100%;border-radius:99px;background:${x.avg < 3 ? '#997d65' : '#795c45'}"></div></div><span class="sm" style="width:44px;text-align:right">${x.avg} s</span></div>` : html`<span class="mut sm">—</span>`}</td>
            <td class="n mut">${x.total ? (x.total >= 3600 ? Math.round(x.total / 360) / 10 + ' h' : Math.round(x.total / 60) + ' min') : '—'}</td><td class="n">${K(x.likes)}</td><td class="n">${K(x.saves)}</td><td class="n">${K(x.shares)}</td></tr>`)}</tbody></table></div>
          <div class="mut sm" style="margin-top:10px">${ico('bulb')} Instagram no entrega por API el segundo exacto en que la gente deja de ver (esa curva solo está en la app). Lo más cercano es el <b>watch time promedio</b>: si está debajo de 3 s, se fueron en el hook.</div>`
        : html`<div class="mut sm" style="padding:6px 0">Windsor no trae reels de esta cuenta en los últimos 90 días.</div>`}</div>
      ${ig.top.length ? html`<div class="card wkbox" style="margin-top:12px"><div class="wkhead"><h3>Mejores posts del periodo</h3></div><div class="tscroll"><table class="wktable"><thead><tr><th>Fecha</th><th>Tipo</th><th class="n">Alcance</th><th class="n">Likes</th><th class="n">Comentarios</th><th class="n">Guardados</th><th class="n">Engagement</th></tr></thead><tbody>${ig.top.map((x) => html`<tr><td>${x.url ? html`<a href="${x.url}" target="_blank" rel="noopener noreferrer" style="color:inherit">${fdate(x.date)}</a>` : fdate(x.date)}</td><td>${x.type}</td><td class="n">${K(x.reach)}</td><td class="n">${K(x.likes)}</td><td class="n">${K(x.comments)}</td><td class="n">${K(x.saves)}</td><td class="n"><b style="font-weight:500">${K(x.eng)}</b></td></tr>`)}</tbody></table></div></div>` : ''}`;
    }
    mount(b, html`${top}<div id="anScrape" style="margin-top:16px"></div>`);
    const ch = $('#chIG', b); if (ch) lineChart(ch, ig.series.map((x) => fdate(x.date)), [{ name: 'Alcance', v: ig.series.map((x) => x.reach), c: '#2c1f16', fill: true }, { name: 'Vistas', v: ig.series.map((x) => x.views), c: '#997d65', dash: true }]);
    scrapeAnalytics($('#anScrape', b));
  }
  function scrapeAnalytics(b) {
    if (needWeek(b, scrapeAnalytics)) return;
    const h = week.analytics || [], last = h[h.length - 1], prev = h[h.length - 2];
    const delta = (k) => (last && prev && prev[k] ? Math.round(((last[k] - prev[k]) / prev[k]) * 100) : null);
    const own = week.result?.own || [];
    if (!h.length) return mount(b, html`<div class="mut sm">El scrape semanal (Apify) también guarda tus posts: aparecen aquí cuando corra.</div>`);
    const kpi = (lbl, v, d) => html`<div class="card"><div class="lbl">${lbl}</div><div class="big" style="font-size:44px">${v}</div><div class="sm ${d == null ? 'mut' : ''}" style="${d == null ? '' : d >= 0 ? 'color:#755943' : 'color:#654c38'}">${d == null ? 'vs semana anterior: —' : (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + '% vs semana anterior'}</div></div>`;
    mount(b, html`<div class="grid g4">${kpi('Vistas promedio', K(last.avgViews), delta('avgViews'))}${kpi('Engagement', last.er == null ? '—' : last.er + '%', delta('er'))}${kpi('Likes', K(last.likes), delta('likes'))}${kpi('Posts leídos', last.posts, null)}</div>
      <div class="card" style="margin-top:16px"><div class="chead"><div class="ico">↗</div><h3>Vistas promedio por semana</h3></div><div class="chart" id="chA"></div></div>
      ${own.length ? html`<div class="sec-title"><h2>Tus últimos posts</h2></div><div class="grid g5">${own.slice(0, 10).map(videoCard)}</div>` : ''}`);
    lineChart($('#chA', b), h.map((x) => x.week.slice(5)), [{ name: 'Vistas', v: h.map((x) => x.avgViews), c: '#2c1f16', fill: true }]);
  }

  // ---------- Fuentes: tus cuentas, tu audiencia (de lo general a lo específico), referentes y competencia ----------
  function fuentes(b) {
    if (!week) loadWeek();
    const p = data.profile, c = data.cfg;
    const accUrl = (a) => (a.red === 'tiktok' ? `https://www.tiktok.com/@${a.handle}` : `https://www.instagram.com/${a.handle}/`);
    const acc = (a, rm, list) => html`<div class="artifact" style="margin:6px 0"><span class="fi">${a.red === 'tiktok' ? ico('music') : ico('target')}</span><div style="flex:1"><a href="${accUrl(a)}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none"><b style="font-weight:500">@${a.handle}</b></a><div class="mut" style="font-size:11px">${RED[a.red]}${a.source ? ' · ' + a.source : ''}</div></div>${rm != null ? html`<button class="sm mut" data-act="rmAcc" data-l="${list}" data-i="${rm}">${ico('x', 16)}</button>` : ''}</div>`;
    const adder = (list, ph) => html`<div class="row" style="margin-top:8px"><select class="in" data-red="${list}" style="width:auto"><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select><input class="in" data-new="${list}" placeholder="${ph}"><button class="btn ghost" data-act="addAcc" data-l="${list}">+</button></div>`;
    const group = (kind) => c.accounts.map((a, i) => ({ a, i })).filter((x) => x.a.kind === kind);
    const repoComp = p.competitors.filter((a) => !c.accounts.some((x) => x.handle === a.handle && x.red === a.red));
    mount(b, html`<div id="bxHost" style="margin-bottom:16px"></div>
      <div class="cols2">
        <div>
          <div class="card"><h3 class="ttl">${ICON.user}Tus cuentas</h3>
            <div class="mut sm" style="margin:4px 0 6px">Las de la marca. De aquí salen Analytics, la Bandeja y «lo tuyo» en el scrape.</div>
            ${p.own.filter((a) => a.source === 'onboarding').map((a) => acc(a))}
            ${(c.own || []).map((a, i) => acc(a, i, 'own'))}
            ${p.own.length || (c.own || []).length ? '' : html`<div class="mut sm">Todavía no hay cuentas: agrégalas aquí.</div>`}
            ${adder('own', '@cuenta de la marca')}</div>
        </div>
        <div>
          <div class="card"><h3 class="ttl">${ICON.star}Referentes</h3>
            <div class="mut sm" style="margin:4px 0 6px">De quién tomamos estilo y temas. No se copian: se leen.</div>
            ${group('referente').map(({ a, i }) => acc(a, i, 'accounts'))}${group('referente').length ? '' : html`<div class="mut sm">Ninguno todavía.</div>`}
            ${adder('referente', '@referente')}</div>
          <div class="card"><h3 class="ttl">${ICON.versus}Competencia</h3>
            <div class="mut sm" style="margin:4px 0 6px">Contra quién compite la marca. Las del onboarding vienen de la investigación de ① Strategy.</div>
            ${repoComp.map((a) => acc({ ...a, source: 'onboarding' }))}
            ${group('competencia').map(({ a, i }) => acc(a, i, 'accounts'))}${repoComp.length || group('competencia').length ? '' : html`<div class="mut sm">Ninguna todavía.</div>`}
            ${adder('competencia', '@competidor')}</div>
        </div>
      </div>
      <div class="card" style="margin-top:16px"><div class="row" style="flex-wrap:wrap;gap:12px"><div><h3 class="ttl">${ICON.radar}Scrape semanal</h3><div class="mut sm">Cada lunes, 10 posts por fuente, de Reels y TikTok: tus cuentas, referentes, competencia y los temas del nicho.</div></div><div class="sp"></div>
        <label class="check" style="padding:0"><input type="checkbox" data-act="auto" ${c.auto ? raw('checked') : ''}> Activado</label></div>
        <div class="grid g2" style="margin-top:12px;align-items:start"><div>
          <b class="sm" style="font-weight:500">Temas del nicho (hashtags, máx. 10)</b>
          <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${c.hashtags.map((h, i) => html`<span class="chip">#${h} <button class="sm mut" data-act="rmTag" data-i="${i}" style="margin-left:4px">${ico('x', 16)}</button></span>`)}${c.hashtags.length ? '' : html`<span class="mut sm">Sin temas.</span>`}</div>
          <div class="row" style="margin-top:8px"><input class="in" id="newTag" placeholder="ej. emprendimiento, marketingdigital"><button class="btn ghost" data-act="addTag">+</button></div></div>
        <div><b class="sm" style="font-weight:500">Videos puntuales</b>
          ${c.videos.map((u, i) => html`<div class="row sm" style="margin:6px 0"><a href="${u}" target="_blank" rel="noopener noreferrer" style="color:inherit;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u}</a><button class="sm mut" data-act="rmVid" data-i="${i}">${ico('x', 16)}</button></div>`)}
          <div class="row" style="margin-top:8px"><input class="in" id="newVid" placeholder="https://www.instagram.com/reel/…"><button class="btn ghost" data-act="addVid">+</button></div></div></div></div>`);
    bullseye($('#bxHost', b), { name: p.name, bx: c.bullseye, save: saveBx, prompt: () => bullseyePrompt({ name: p.name, pillars: (c.pillars || []).map((x) => x.name), own: p.own.map((a) => '@' + a.handle), refs: c.accounts.filter((x) => x.kind === 'referente').map((a) => '@' + a.handle), comp: [...p.competitors, ...c.accounts.filter((x) => x.kind !== 'referente')].map((a) => '@' + a.handle), posts: posts4(week?.result?.own, 5), bx: c.bullseye }) });
  }
  // Guarda la diana (y deja «audiencia» al día para lo que todavía la lee, como el MCP).
  async function saveBx(bx) {
    const audience = { exacto: bx.center || bx.rings[0]?.label || '', nicho: bx.rings[1]?.label || '', general: bx.rings[3]?.label || '' };
    const r = await api('content/cfg', { method: 'PUT', body: { profile: slug, ...data.cfg, bullseye: bx, audience } });
    data.cfg = { ...data.cfg, ...r };
    if (!r.bullseye) throw new Error('A la diana le falta el centro o alguno de los 5 niveles');
    return r.bullseye;
  }
  async function saveCfg(next) {
    try { data.cfg = { ...data.cfg, ...(await api('content/cfg', { method: 'PUT', body: { profile: slug, ...data.cfg, ...next } })) }; fuentes($('#cbody', el)); } catch (e) { toast(e.message, true); }
  }

  // Los prompts para la cuenta de Claude de cada persona (contestan solo JSON, que se pega de vuelta).
  const posts4 = (l = [], n) => (!l?.length ? '(todavía sin datos)' : '') + (l || []).slice(0, n).map((x) => `- @${x.handle} · ${x.views ? x.views + ' vistas' : x.likes + ' likes'}${x.x ? ` · ${x.x}× su promedio` : ''} · ${x.url}\n  ${String(x.text || '').replace(/\s+/g, ' ').slice(0, 150)}`).join('\n') || '(nada)';
  acts(el, {
    igconnect: () => window.open('https://onboard.windsor.ai/', '_blank', 'noopener'),
    igpick: async (t) => { try { await api('content/connect', { method: 'PUT', body: { profile: slug, ig_account: t.dataset.a } }); toast(`@${t.dataset.a} conectado a ${data.profile.name}`); ig = null; paint(); } catch (e) { toast(e.message, true); } },
    igchange: async () => { try { await api('content/connect', { method: 'PUT', body: { profile: slug, ig_account: '' } }); ig = { ...ig, matched: false }; paint(); } catch (e) { toast(e.message, true); } },
    prof: (t) => { slug = t.dataset.s; clearTimeout(poll); go(); load(); },
    tab: (t) => { tab = t.dataset.t; go(); swap(el, paint); },
    gfile: (t) => { gcur = t.dataset.id; guiones($('#cbody', el)); },
    gdir: (t) => { gstack.push({ id: t.dataset.id, name: t.dataset.n }); gfiles = null; gcur = null; guiones($('#cbody', el)); },
    gup: (t) => { gstack = gstack.slice(0, +t.dataset.i + 1); gfiles = null; gcur = null; guiones($('#cbody', el)); },
    gopen: () => window.open(gstack?.[gstack.length - 1]?.id?.startsWith('https') ? gstack[gstack.length - 1].id : `https://drive.google.com/drive/folders/${gstack?.[gstack.length - 1]?.id}`, '_blank', 'noopener'),
    gconnect: async () => {
      const v = await ask('Conectar la carpeta de guiones', [{ k: 'url', l: `Link de la carpeta de Google Drive con los guiones de ${data.profile.name}`, v: data.cfg.guiones_drive, req: true }], 'Conectar');
      if (!v) return;
      try { await api('content/connect', { method: 'PUT', body: { profile: slug, guiones_drive: v.url.trim() } }); data.cfg.guiones_drive = v.url.trim(); gstack = null; gfiles = null; toast('Carpeta de guiones conectada'); paint(); } catch (e) { toast(e.message, true); }
    },
    gnew: async () => {
      const v = await ask('Nuevo guion', [{ k: 'name', l: 'Nombre', v: `Guion · ${fdate(today())}`, req: true }], 'Crear en Drive');
      if (!v) return;
      try { const f = await api('google/drive', { method: 'POST', body: { type: 'doc', name: v.name, folder: gstack[gstack.length - 1].id } }); gfiles = null; gcur = f.id; toast('Guion creado en Drive'); window.open(f.link, '_blank', 'noopener'); guiones($('#cbody', el)); } catch (e) { toast(e.message, true); }
    },
    pview: (t) => { pview = t.dataset.v; recal(); },
    pnav: (t) => { const d = new Date(pdate + 'T12:00'); if (pview === 'mes') d.setMonth(d.getMonth() + +t.dataset.d, 1); else d.setDate(d.getDate() + 7 * +t.dataset.d); pdate = d.toISOString().slice(0, 10); recal(); },
    ptoday: () => { pdate = today(); recal(); },
    cview: (t) => { cview = t.dataset.v; recal(); },
    snew: (t, e) => { if (e?.target?.closest('.ppost')) return; editShoot(null, t.dataset.d); },
    sedit: (t) => { const x = shoots.find((y) => y.id === t.dataset.id); if (x) editShoot(x); },
    rfilter: (t) => { rfilter = t.dataset.k; research($('#cbody', el)); },
    rfmt: (t) => { rfmt = t.dataset.k; research($('#cbody', el)); },
    rview: (t) => { rview = t.dataset.v; research($('#cbody', el)); },
    rsel: (t) => { rsel[t.dataset.k] = rsel[t.dataset.k] === t.dataset.v ? '' : t.dataset.v; research($('#cbody', el)); },
    rreload: () => { rs = null; research($('#cbody', el)); },
    rprompt: async () => { try { await navigator.clipboard.writeText(mcpPrompt()); toast('Instrucción copiada: pégasela a Claude'); } catch { toast(mcpPrompt()); } },
    rclear: async () => {
      if (!(await confirmAsk(`¿Vaciar Research de ${data.profile.name}? Se borran los ${(rs || []).length} posts subidos, con su análisis y su plantilla.`))) return;
      try { for (const x of rs || []) await C.remove(x.id); rs = []; toast('Research vacío'); research($('#cbody', el)); } catch (e) { toast(e.message, true); }
    },
    ropen: (t) => ropen(t.dataset.k),
    pnew: async (t, e) => { if (e?.target?.closest('.ppost')) return; const r = await editPost(slug, null, t.dataset.d ? { date: t.dataset.d } : {}); if (r) { posts = [...posts, r]; recal(); } },
    pedit: async (t) => { const p = posts.find((x) => x.id === t.dataset.id); if (!p) return; const r = await editPost(slug, p); if (r) { posts = posts.map((x) => (x.id === r.id ? r : x)); recal(); } },
    pillars: async () => {
      const cur = data.cfg.pillars || [];
      const v = await ask('Pilares de contenido', [{ k: 'list', l: 'Un pilar por línea (máx. 8). Ej.: Educa · Detrás de cámaras · Casos · Oferta', t: 'textarea', v: cur.map((x) => x.name).join('\n') }], 'Guardar');
      if (!v) return;
      const names = v.list.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 8);
      const pillars = names.map((name, i) => ({ name, color: cur.find((x) => x.name === name)?.color || PAL[i % PAL.length] }));
      try { const r = await api('content/connect', { method: 'PUT', body: { profile: slug, pillars } }); data.cfg.pillars = r.pillars; setConn(slug, { pillars: r.pillars }); toast('Pilares guardados'); recal(); } catch (e) { toast(e.message, true); }
    },
    scrape: async (t) => { t.disabled = true; try { await api('content/scrape', { method: 'POST', body: { profile: slug } }); toast('Scrape lanzado en Apify. Tarda unos minutos'); week = null; paint(); } catch (e) { toast(e.message, true); } t.disabled = false; },
    addTag: () => { const v = $('#newTag', el).value; if (v.trim()) saveCfg({ hashtags: [...data.cfg.hashtags, ...v.split(/[\s,]+/)] }); },
    rmTag: (t) => saveCfg({ hashtags: data.cfg.hashtags.filter((_, i) => i !== +t.dataset.i) }),
    addVid: () => { const v = $('#newVid', el).value.trim(); if (!/^https:\/\/(www\.)?(instagram\.com\/(p|reel|reels)\/|tiktok\.com\/@[^/]+\/video\/|vm\.tiktok\.com\/)/.test(v)) return toast('Pega el link de un reel o de un TikTok', true); saveCfg({ videos: [...data.cfg.videos, v] }); },
    rmVid: (t) => saveCfg({ videos: data.cfg.videos.filter((_, i) => i !== +t.dataset.i) }),
    addAcc: (t) => {
      const l = t.dataset.l, h = $(`[data-new="${l}"]`, el).value.trim(); if (!h) return;
      // Solo perfiles: un link de video no es una cuenta (los videos van en Referencias).
      if (/instagram\.com\/(p|reel|reels)\/|tiktok\.com\/@[^/]+\/video\//.test(h)) return toast('Ese link es de un video. Pega el perfil (instagram.com/cuenta) o ponlo en Referencias', true);
      const m = h.match(/(?:tiktok\.com\/@|instagram\.com\/)([A-Za-z0-9._]{2,30})/i) || h.match(/^@?([A-Za-z0-9._]{2,30})$/);
      if (!m || ['https', 'http', 'www', 'explore'].includes(m[1].toLowerCase())) return toast('No entendí esa cuenta. Escribe @cuenta o pega el link del perfil', true);
      const a = { red: /tiktok/.test(h) ? 'tiktok' : $(`[data-red="${l}"]`, el).value, handle: m[1].toLowerCase() };
      if ([...data.profile.own, ...(data.cfg.own || []), ...data.cfg.accounts].some((x) => x.red === a.red && x.handle === a.handle.toLowerCase())) return toast('Esa cuenta ya está', true);
      if (l === 'own') saveCfg({ own: [...(data.cfg.own || []), a] }); else saveCfg({ accounts: [...data.cfg.accounts, { ...a, kind: l }] });
    },
    rmAcc: (t) => (t.dataset.l === 'own' ? saveCfg({ own: data.cfg.own.filter((_, i) => i !== +t.dataset.i) }) : saveCfg({ accounts: data.cfg.accounts.filter((_, i) => i !== +t.dataset.i) })),
    refSave: async () => { try { const r = await api('content/refs', { method: 'PUT', body: { profile: slug, videos: refVideos() } }); rf = { ...rf, videos: r.videos }; toast('Referencias guardadas'); refsTab($('#cbody', el)); } catch (e) { toast(e.message, true); } },
    refScrape: async () => {
      try { await api('content/refs', { method: 'PUT', body: { profile: slug, videos: refVideos() } }); await api('content/refs/scrape', { method: 'POST', body: { profile: slug } }); toast('Apify arrancó: primero lee tus referencias y luego busca similares (unos minutos)'); rf = null; refsTab($('#cbody', el)); }
      catch (e) { toast(e.message, true); }
    },
    refBreak: async (t) => {
      const p = t.dataset.p, out = await claudeJSON(`Desglose · ${p}`, breakPrompt(p)); if (!out) return;
      try { const r = await api('content/refs/breakdown', { method: 'PUT', body: { profile: slug, pillar: p, items: out.videos || out } }); rf = { ...rf, breakdown: r.breakdown }; toast('Desglose guardado'); refsTab($('#cbody', el)); } catch (e) { toast(e.message, true); }
    },
    shotOpen: (t) => {
      const { m, rows } = shotData(), r = rows.find((x) => x.id === t.dataset.id); if (!r) return;
      const txt = pieceText(m, r);
      drawer(html`<div class="row"><span class="chip">${r.formato}</span><span class="chip">${r.pilar}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
        <h2>${r.id} · ${r.concepto}</h2><div class="mut sm">${[r.fecha && fdate(r.fecha), r.canal, r.campana, r.funcion, r.material && 'material: ' + r.material].filter(Boolean).join(' · ')}</div>
        <div class="mdbody" style="margin-top:14px">${txt ? md(txt) : html`<div class="mut">No encontré la sección de ${r.id} en ideas-${r.formato.toLowerCase()}.md.</div>`}</div>`);
    },
    shotBrief: () => { const { m } = shotData(); const f = m?.files.find((x) => x.name === 'brief-del-ciclo.md'); if (f) drawer(html`<div class="row"><span class="chip">Brief del ciclo · ${m.mes}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div><div class="mdbody" style="margin-top:14px">${md(f.content)}</div>`); },
  });
  acts(el, { auto: (t) => saveCfg({ auto: t.checked }).then(() => toast(t.checked ? 'Se scrapea solo cada lunes' : 'Scrape semanal apagado')) }, 'change');
  mount(el, html`<p class="loading">Leyendo el repo…</p>`);
  load();
}
