import { techDetail, html, raw, mount, api, toast, acts, drawer, closeDrawer, fdate, K, md, csv, $, lineChart, ask, today , connectCard, connectChip, LOGO, openClaude, claudeJSON, ICON, swap, ico, col, confirmAsk, initials } from '../core.js';
import { bullseye, bullseyePrompt } from '../bullseye.js';
import { loadPosts, postsBoard, editPost, loadConn, setConn, syncDrive, driveState } from '../posts.js';
import { estadoDe, separar, ESTADO_CLS, nombreDe } from '../element.js';
import { investigacion } from '../investigacion.js';
import { TIPOS_MARCA, eventosMarca } from '../calendario-vistas.js';
import { calendarioHtml, rango, porDia, diaHtml, hitoHtml } from '../calendario-trabajo.js';
import { mezclaDelMes, mezclaHtml, filtrar, filtrosHtml, ejes, replicasDe, marcasPieza, tituloPieza, mesesConBrief, candado, mesNombre } from '../calendario-contenido.js';

// Content: el área donde el CEO y Content deciden. Guiones y piezas viven en Google Drive;
// del repo solo salen las cuentas (LINKS.md) y la competencia. Más el scrape semanal y Analytics.
const RED = { instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn', youtube: 'YouTube' };
const safeImg = (u) => (/^https:\/\/[^\s'"()]+$|^\/api\/media\/img-[a-f0-9]{24}$/.test(String(u || '')) ? u : null);
// Las pestañas visibles; el resto del código sigue aquí y vuelve al agregar su pestaña a esta lista.
const TABS = [['analytics', 'Analytics'], ['research', 'Research'], ['calendario', 'Calendario']];
const C = col('content');
const SHOOT = ['Por grabar', 'Grabado', 'Cancelado'];
const KIND = { referente: 'Referente', competencia: 'Competencia', nicho: 'Nicho', propia: 'Tuya', 'referente-similar': 'Referente similar', 'referente-aspiracional': 'Aspiracional', 'referente-crecimiento': 'Crecimiento' };

export function videoCard(it) {
  const t = safeImg(it.thumb);
  return html`<a class="card win" href="${/^https:\/\//.test(it.url) ? it.url : '#'}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;padding:12px">
    <div class="thumb" ${t ? raw(`style="background-image:url('${t}')"`) : ''}><b>${it.x ? it.x + '×' : it.icon || ico('play', 13)}</b></div>
    <div class="row sm"><b style="font-weight:500">@${it.handle}</b><span class="mut">${it.kind && KIND[it.kind] ? KIND[it.kind] : RED[it.red]}</span><div class="sp"></div><span class="mut">${it.at ? fdate(it.at.slice(0, 10)) : ''}</span></div>
    <div class="row sm" style="gap:12px">${it.views ? html`<span>${ico('play', 13)} ${K(it.views)}</span>` : ''}<span>${ico('heart')} ${K(it.likes)}</span><span>${ico('chat')} ${K(it.comments)}</span></div>
    <div class="cap mut">${it.text}</div></a>`;
}

// La marca personal del CEO (perfil «personal») no vive aquí: tiene su pantalla, Mi marca (#/mimarca), que monta esto mismo con el perfil fijo.
const isPersonal = (slug) => slug === 'personal' || /-personal$/.test(String(slug || ''));
// embed: la pantalla montada dentro de otra (Mi marca → Inspo/Contenido, Cliente → Marca → Inspo): sin título, con las
// pestañas de `only`, el perfil fijo y, en modo `inspo`, Research con chips por plataforma (IG · TikTok · LinkedIn).
export async function render(el, { me, sub, alive, fixed = null, embed = null }) {
  let slug = fixed || sub[1] || (() => { try { return localStorage.getItem('content.profile'); } catch { return null; } })() || 'inherent';
  if (!fixed && isPersonal(slug)) slug = 'inherent';
  // Vista por rol: en «resumen» solo se ve el rendimiento (Analytics), sin Research ni Calendario.
  const resumen = me?.views?.content === 'resumen';
  const FIXED_TABS = [['research', 'Research'], ['postear', 'Ideas'], ['calendario', 'Calendario'], ['analytics', 'Analytics']];
  const tabs = embed?.only ? FIXED_TABS.filter(([k]) => embed.only.includes(k)) : fixed ? FIXED_TABS : resumen ? TABS.filter(([k]) => k === 'analytics') : TABS;
  let tab = tabs.some(([k]) => k === sub[0]) ? sub[0] : tabs[0]?.[0] || 'analytics';
  let data = null, week = null, posts = null, poll = null, ig = null, inbox = null, rf = null, rfPoll = null, shotMes = null;
  let gstack = null, gfiles = null, gcur = null, pview = 'semana', pdate = today();
  let parch = false, rs = null, shoots = null, ops = null, cvista = 'mes';
  // Los filtros del calendario de la marca: los que se apagaron quedan apagados (por persona).
  let coff = new Set((() => { try { return JSON.parse(localStorage.getItem('os.cal.marca.off') || '[]'); } catch { return []; } })());

  async function load() {
    try { data = await api(`repo/content?profile=${encodeURIComponent(slug)}`); } catch (e) { return mount(el, html`<div class="empty"><b>No pude leer el repo</b>${e.message}</div>`); }
    slug = data.profile.slug; week = null; posts = null; rs = null; shoots = null; ig = null; inbox = null; rf = null; shotMes = null; gstack = null; gfiles = null; gcur = null;
    if (fixed) { if (slug !== fixed) return mount(el, fixed === 'personal' ? html`<div class="empty"><b>La marca personal es solo del CEO</b>Tu perfil no la ve.</div>` : html`<div class="empty"><b>Este cliente no tiene perfil de contenido</b>Se crea con su folder en clients/.</div>`); }
    else { data.profiles = (data.profiles || []).filter((x) => !isPersonal(x.slug)); try { localStorage.setItem('content.profile', slug); } catch {} }
    paint();
  }
  const root = () => data.profile.root;
  const go = () => history.replaceState(null, '', embed ? `${embed.base}${tabs.length > 1 ? '/' + tab : ''}` : fixed ? `#/mimarca/${tab}` : `#/content/${tab}/${slug}`);

  function paint() {
    if (!alive()) return;
    const p = data.profile;
    mount(el, html`
      ${embed ? '' : fixed ? html`<div class="hello sp-hero row" style="align-items:flex-end"><div><h1>Mi marca</h1><p>Tu marca personal: <em>research, ideas y calendario</em>.</p></div><div class="sp"></div><span class="chip dark" title="Solo la ve el CEO: ni la API ni el conector la entregan a nadie más">${ico('lock', 13)} Privado</span></div>`
      : html`<div class="hello sp-hero ct-hero"><h1>Contenido</h1><p>Lo que pasa en <em>${p.name}</em> esta semana.</p>
        <div class="ct-profs" role="group" aria-label="Perfil de contenido">${data.profiles.map((x, i) => html`<button class="ct-prof ${x.slug === slug ? 'on' : ''}" data-act="prof" data-s="${x.slug}" aria-pressed="${x.slug === slug ? 'true' : 'false'}"><span class="sp-mono ${['', 't1', 't2'][i % 3]}">${initials(x.name)}</span><span>${x.name}</span></button>`)}</div></div>`}
      <div class="row ct-bar" style="margin-bottom:16px;flex-wrap:wrap;gap:10px${embed && tabs.length < 2 ? ';display:none' : ''}">
        <div class="tabs" style="margin:0">${tabs.map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>
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
      ${week.at ? html`<span class="mut sm">Semana ${week.week} · leída el ${fdate(week.at.slice(0, 10))}${week.status === 'running' ? ' · actualizándose, se refresca solo…' : ''}</span>` : html`<span class="mut sm">Todavía no se ha leído este perfil.</span>`}
      <div class="sp"></div><span class="chip ${c.auto ? 'lime' : ''}">${c.auto ? 'Scrape semanal: lunes' : 'Scrape semanal apagado'}</span></div>`;
    if (week.warn) return mount(b, html`${head}<div class="warnbox">${week.warn}</div>`);
    const r = week.result;
    if (!data.apify && !r) return mount(b, html`${head}<div class="warnbox">La lectura semanal de redes todavía no está activada. <span class="sm" style="opacity:.8">Quien administra la app la activa con la variable APIFY_TOKEN en Vercel.</span></div>`);
    if (!r) return mount(b, html`${head}<div class="empty"><b>${week.status === 'running' ? 'Leyendo tus redes…' : 'Sin semana todavía'}</b>${week.status === 'running' ? 'Tarda unos minutos. Esta pantalla se actualiza sola.' : html`Revisa las <a href="#/content/fuentes/${slug}" style="color:inherit">Fuentes</a> y dale «Scrapear ahora».`}</div>`);
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
    mount(b, html`<div class="mut sm" style="margin-bottom:12px">Por pilar, pega hasta <b>5 videos</b> que te sirvan de referencia (Reels o TikToks). El OS busca lo que más rindió de <b>esos mismos creadores</b> y de <b>sus hashtags</b>, comparado con lo normal de cada cuenta. Después lo desglosas con Claude: hook, retención, estructura y cómo adaptarlo.</div>
      ${rf.status === 'running' ? html`<div class="warnbox sm" style="margin-bottom:12px">${rf.phase === 1 ? 'Leyendo tus referencias' : 'Buscando similares'}… Esto se actualiza solo.</div>` : ''}${rf.warn ? html`<div class="warnbox sm">${rf.warn}</div>` : ''}${!rf.apify ? html`<div class="warnbox sm">Falta APIFY_TOKEN en Vercel.</div>` : ''}
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
    postsBoard(b, slug, posts, (l) => { posts = l; postear(b); }, { brand: embed?.brand || data.profile.name });
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
      ${cur ? html`<div class="card swap" style="min-width:0;padding:10px"><div class="row" style="margin-bottom:8px"><b style="font-weight:500">${cur.name}</b><div class="sp"></div><a class="btn ghost xs" href="${cur.link}" target="_blank" rel="noopener noreferrer">Abrir en Drive ↗</a></div><iframe src="${preview(cur)}" style="width:100%;height:70vh;border:0;border-radius:12px;background:var(--surface)" loading="lazy"></iframe></div>` : html`<div class="empty"><b>Elige una carpeta</b>Los guiones están adentro.</div>`}</div>`}`);
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
  // ---------- Calendario: el mes como strip (cada día con sus puntos) y la semana elegida como panel ----------
  const DOWL = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  function calWeek() {
    const a = new Date(pdate + 'T12:00'), s0 = monday(a);
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(s0); d.setDate(d.getDate() + i); return d; });
    return { a, days, from: iso(days[0]), to: iso(days[6]) };
  }
  function calStrip({ a, from, to }, dots) {
    const y = a.getFullYear(), m = a.getMonth(), n = new Date(y, m + 1, 0).getDate(), T = today();
    const name = a.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase());
    return html`<section class="sp-panel ct-month"><div class="sp-panel-h row"><h3>${name}</h3><span class="mut sm">Toca un día para ver su semana</span><div class="sp"></div>
        <button class="arrow light" data-act="pmonth" data-d="-1" aria-label="Mes anterior">‹</button><button class="btn ghost xs" data-act="ptoday">Hoy</button><button class="arrow light" data-act="pmonth" data-d="1" aria-label="Mes siguiente">›</button></div>
      <div class="sp-strip ct-strip" style="grid-template-columns:repeat(${n},minmax(30px,1fr))">${Array.from({ length: n }, (_, i) => { const k = iso(new Date(y, m, i + 1, 12)), l = dots(k), wd = (new Date(y, m, i + 1, 12).getDay() + 6) % 7;
        return html`<button class="cd ${k === T ? 'today' : ''} ${k >= from && k <= to ? 'wk' : ''} ${wd > 4 ? 'we' : ''}" data-act="pday" data-d="${k}" aria-label="${fdate(k)}${l.length ? ` · ${l.length}` : ''}"><span class="w">${DOW[wd]}</span><span class="n">${i + 1}</span><span class="dots">${l.slice(0, 4).map((c) => html`<i style="background:${c}"></i>`)}</span></button>`; })}</div></section>`;
  }
  function calWeekPanel({ days, from, to }, of, chip, act, label, btn) {
    const T = today();
    return html`<section class="sp-panel ct-week"><div class="sp-panel-h row"><button class="arrow light" data-act="pnav" data-d="-1" aria-label="Semana anterior">‹</button><div style="min-width:0"><h3>${fdate(from)} – ${fdate(to)}</h3><span class="mut sm">${label}</span></div><button class="arrow light" data-act="pnav" data-d="1" aria-label="Semana siguiente">›</button><div class="sp"></div>${btn}</div>
      <div class="ct-days">${days.map((d, i) => { const k = iso(d), l = of(k); return html`<div class="ct-day ${k === T ? 'today' : ''} ${i > 4 ? 'we' : ''}" data-act="${act}" data-d="${k}"><div class="ct-dh"><span>${DOWL[i]}</span><b>${d.getDate()}</b></div><div class="ct-dl">${l.map(chip)}<span class="ct-add" aria-hidden="true">${ico('plus', 14)}</span></div></div>`; })}</div></section>`;
  }
  const stripTo = (b) => { const st = $('.ct-strip', b), w = st?.querySelector('.cd.wk'); if (st && w && st.scrollWidth > st.clientWidth) st.scrollLeft = Math.max(0, w.offsetLeft - 12); };
  // El calendario es la suma: investigación (el referente que replica) + pilar o campaña + formato, con su nivel de consciencia.
  // Arriba, una línea con la mezcla del mes; debajo, los filtros. Las reglas viven en calendario-contenido.js.
  let ccf = {}, crefs = null, ccamps = [], cavs = [], cabiertos = [];
  const conBrief = () => mesesConBrief(data.profile.months || []);
  const cerrado = (fecha) => candado(String(fecha || '').slice(0, 7), conBrief(), cabiertos);
  function needRefs(b, fn) {
    if (crefs) return false;
    mount(b, html`<p class="loading">Cargando…</p>`);
    Promise.all([C.list().catch(() => []), col('campaigns').list().catch(() => []), api(`avatares?profile=${encodeURIComponent(slug)}`).then((r) => r.avatares).catch(() => []), col('settings').get('brief_open').catch(() => null)]).then(([l, cs, av, bo]) => { crefs = replicasDe(l, slug); ccamps = cs.filter((c) => c.client_slug === slug); cavs = av; cabiertos = bo?.marcas?.[slug] || []; }).then(() => alive() && b.isConnected && fn(b));
    return true;
  }
  const pieceOpts = (extra = {}) => ({ brand: embed?.brand || data.profile.name, replicas: crefs || undefined, avatares: cavs, candado: cerrado, campanas: ejes(posts || [], [], ccamps).campanas, ...extra });
  function plan(b) {
    if (needPosts(b, plan) || needRefs(b, plan)) return;
    const pillars = data.cfg.pillars || [];
    const colorOf = (n) => pillars.find((x) => x.name === n)?.color || 'var(--ch-light)';
    const wk = calWeek(), M = pdate.slice(0, 7);
    // Lo terminado se archiva solo: lo publicado hace más de 30 días (o marcado «Archivado») sale del calendario y va al Archivo.
    const { vivos, archivo } = separar(posts);
    const vis = filtrar(vivos, { ...ccf, avatares: cavs });
    const brand = embed?.brand || data.profile.name;
    const mesL = new Date(M + '-15T12:00').toLocaleDateString('es-GT', { month: 'long' }).replace(/^./, (c) => c.toUpperCase());
    const chip = (p) => { const [i, l] = driveState(p), e = estadoDe(p); return html`<button class="ppost st-${ESTADO_CLS[e] || 'idea'}" data-act="pedit" data-id="${p.id}" style="border-left-color:${colorOf(p.pillar)}" title="${nombreDe(p, brand)} · ${e} · ${l} · ${tituloPieza(p, crefs)}"><span class="pi">${i}</span><span class="pt">${p.title}</span>${marcasPieza(p)}${p.format ? html`<span class="pf">${p.format}</span>` : ''}</button>`; };
    const undated = vis.filter((p) => !p.date && estadoDe(p) !== 'Publicado');
    mount(b, html`
      ${(() => { const k = cerrado(M + '-01'); return k.cerrado ? html`<div class="cc-lock" role="status">${ico('lock', 16)}<div><b>Sin brief del ciclo de ${mesNombre(M)}</b><span class="mut sm">No se crean piezas con fecha de este mes hasta que ④ Creatividad deje el brief en 04-contenido/${M}/brief-del-ciclo.md. Las ideas sin fecha sí se pueden crear.</span></div>${me.role === 'ceo' ? html`<button class="btn ghost xs" data-act="briefOpen" data-m="${M}">Abrir el mes sin brief</button>` : ''}</div>` : k.por === 'ceo' ? html`<div class="cc-lock open mut sm">${ico('lock', 13)} ${mesNombre(M)} está abierto sin brief: lo abrió ${String(k.abierto.por || '').split('@')[0]}.</div>` : ''; })()}
      <div class="cc-top">${mezclaHtml(mezclaDelMes(vivos, M, pillars, cavs), ccf, mesL)}<button class="btn ghost xs" data-act="pillars">${pillars.length ? 'Editar pilares' : '+ Pilares'}</button></div>
      ${filtrosHtml(ccf, ejes(vivos, pillars, ccamps), crefs.length)}
      ${calStrip(wk, (k) => vis.filter((p) => p.date === k).map((p) => colorOf(p.pillar)))}
      ${calWeekPanel(wk, (k) => vis.filter((p) => p.date === k), chip, 'pnew', raw(`${ico('folder', 13).toString()} en Drive · ⬆ por subir · ${ico('edit', 13).toString()} por grabar · ↻ replica`), html`<button class="btn" data-act="pnew" data-d="">+ Pieza</button>`)}
      ${undated.length ? html`<div class="sec-title"><h2>Sin fecha</h2><span class="mut sm">${undated.length}</span></div><div class="row ct-undated" style="flex-wrap:wrap;gap:6px">${undated.map(chip)}</div>` : ''}
      <div class="row el-archbar"><button class="chip ${parch ? 'dark' : ''}" data-act="parch" aria-pressed="${parch ? 'true' : 'false'}">${ico('folder', 13)} Archivo · ${archivo.length}</button><span class="mut sm">Lo publicado hace más de 30 días o marcado «Archivado» sale del calendario solo.</span></div>
      ${parch ? (archivo.length ? html`<div class="row ct-undated" style="flex-wrap:wrap;gap:6px;margin-top:8px">${archivo.sort((a, z) => String(z.date || '').localeCompare(String(a.date || ''))).map(chip)}</div>` : html`<div class="mut sm" style="margin-top:8px">Nada archivado todavía.</div>`) : ''}`);
    b.querySelectorAll('[data-ccf]').forEach((x) => { x.onchange = () => { ccf = { ...ccf, [x.dataset.ccf]: x.value }; plan(b); }; });
    stripTo(b);
  }

  // ---------- Research → Investigación (Fase 4): vive en investigacion.js; aquí solo el enganche ----------
  // rs guarda el estado de la investigación mientras la marca esté abierta (load() lo limpia al cambiar de marca).
  function research(b) { rs ||= {}; investigacion(b, { me, slug, data, alive, embed, st: rs, onPost: () => { posts = null; } }); }

  // ---------- Calendario: se ve igual que el de Proyectos, con 3 filtros — Operativo · Planificación · Programado (calendario-vistas.js) ----------
  const recal = () => (tab === 'calendario' ? calendario($('#cbody', el)) : plan($('#cbody', el)));
  let cdia = null; // los eventos del día que se abrió con «+N más»
  function calendario(b) {
    if (needPosts(b, calendario) || needRefs(b, calendario)) return;
    if (shoots === null || ops === null) {
      mount(b, html`<p class="loading">Cargando…</p>`);
      Promise.all([C.list().catch(() => []), col('tasks').list().catch(() => []), col('projects').list().catch(() => [])])
        .then(([l, t, pr]) => { shoots = l.filter((x) => x.kind === 'shoot' && x.profile === slug); ops = { tasks: t, projects: pr }; })
        .then(() => alive() && b.isConnected && calendario(b));
      return;
    }
    const R = rango(cvista, pdate), hoy = today();
    const eventos = eventosMarca({ posts: separar(posts).vivos, shoots, tasks: ops.tasks, projects: ops.projects, slug, from: R.from, to: R.to, hoy });
    cdia = porDia(eventos.filter((e) => !coff.has(e.tipo)));
    mount(b, html`<div class="cm-cal">${calendarioHtml({ vista: cvista, fecha: pdate, eventos, off: coff, tipos: TIPOS_MARCA.map(([k]) => k), lista: TIPOS_MARCA, hoy,
      botones: html`<button class="btn ghost xs" data-act="snew" data-d="">+ Grabación</button><button class="btn xs" data-act="pnew" data-d="">+ Pieza</button>`,
      pie: html`<div class="wc-foot"><span class="mut sm"><b>Operativo:</b> grabaciones, tareas y reuniones de sus proyectos, y los días 1, 11 y 20 · <b>Planificación:</b> piezas en Idea o En proceso · <b>Programado:</b> lo listo, con hora y red. Lo atrasado sale en rojo.</span></div>` })}</div>`);
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
    if (ig.error) top = html`<div class="sp-callout"><span class="grow"><b>No pude leer Instagram ahora.</b> Inténtalo en un momento.${techDetail({ detail: ig.error })}</span></div>`;
    else if (!ig.connected) top = html`<div class="sp-callout info ct-noconn"><span class="lg">${LOGO.instagram}</span><span class="grow"><span class="lbl">Sin conexión</span><b>Conecta Instagram para ver tus analytics</b><span class="mut">Entra con la cuenta de Instagram de la marca y aquí aparecen alcance, vistas, tiempo de visualización y tus mejores reels.</span></span><button class="btn" data-act="igconnect">Conectar Instagram</button></div>`;
    else if (!ig.matched) top = html`<div class="connectcard sp-panel" style="padding:18px var(--pad)"><span class="lg big">${LOGO.instagram}</span><div class="grow"><b style="font-weight:500">¿Cuál es el Instagram de ${data.profile.name}?</b><div class="mut sm">${ig.accounts.length ? 'Estas son las cuentas de Instagram conectadas. Toca la de este perfil.' : 'Windsor respondió pero no trae ninguna cuenta de Instagram. En Windsor → Instagram, revisa que la cuenta esté conectada y con datos, y recarga.'}</div>
        <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">${ig.accounts.map((x) => html`<button class="connect" data-act="igpick" data-a="${x}"><span class="lg">${LOGO.instagram}</span>@${x}</button>`)}</div></div>${ig.accounts.length ? '' : html`<button class="btn" data-act="igconnect">Conectar una cuenta</button>`}</div>`;
    else {
      const w = ig.watch || {};
      const reels = ig.reels || [];
      const maxAvg = Math.max(1, ...reels.map((x) => x.avg));
      top = html`<div class="row" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">${connectChip('instagram', `${ig.handles.map((h) => '@' + h).join(', ')} · conectado`, 'x', true)}<button class="sm mut" data-act="igchange">Cambiar cuenta</button><span class="mut sm">Últimos ${ig.days || 30} días.ai</span></div>
      <div class="sp-kpis">${[['Seguidores', ig.followers ? K(ig.followers) : '—'], ['Alcance', K(ig.reach)], ['Vistas', K(ig.views)], ['Engagement', ig.er == null ? '—' : ig.er + '%'], ['Watch time promedio', w.avg == null ? '—' : w.avg + ' s']].map(([l, v]) => html`<div><span class="lbl">${l}</span><b>${v}</b></div>`)}</div>
      ${ig.series.length > 1 ? html`<div class="sp-panel ct-main"><div class="wkhead"><h3>Alcance y vistas por día</h3><span class="sm row" style="gap:14px"><span class="row" style="gap:6px"><i style="width:16px;height:2px;background:#2c1f16;display:inline-block"></i>Alcance</span><span class="row" style="gap:6px"><i style="width:16px;height:0;border-top:2px dashed #997d65;display:inline-block"></i>Vistas</span></span></div><div class="chart" id="chIG"></div></div>` : ''}
      <div class="sp-panel" style="margin-top:16px"><div class="wkhead"><div><h3>Reels · ¿hasta dónde los ven?</h3><span class="mut sm">Últimos 90 días · ${w.n || 0} reels con watch time · ${w.hours || 0} h vistas en total${w.hookLost ? html` · <b style="color:var(--warn)">${w.hookLost} se pierden en el hook (&lt;3 s)</b>` : ''}</span></div></div>
        ${reels.length ? html`<div class="tscroll"><table class="wktable"><thead><tr><th>Reel</th><th>Fecha</th><th class="n">Vistas</th><th class="n">Alcance</th><th style="min-width:150px">Watch time promedio</th><th class="n">Total</th><th class="n">${ico('heart')}</th><th class="n">Guardados</th><th class="n">Compartidos</th></tr></thead><tbody>
          ${reels.map((x) => html`<tr><td>${x.url ? html`<a href="${x.url}" target="_blank" rel="noopener noreferrer" style="color:inherit" class="row">${safeImg(x.thumb) ? html`<span class="rthumb" style="background-image:url('${safeImg(x.thumb)}')"></span>` : ''}<span class="sm" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x.caption || 'Ver reel'}</span></a>` : html`<span class="sm">${x.caption || '—'}</span>`}</td>
            <td class="mut">${fdate(x.date)}</td><td class="n"><b style="font-weight:500">${K(x.views)}</b></td><td class="n">${K(x.reach)}</td>
            <td>${x.avg ? html`<div class="row" style="gap:8px"><div style="flex:1;height:8px;border-radius:99px;background:var(--fill)"><div style="width:${Math.round((x.avg / maxAvg) * 100)}%;height:100%;border-radius:99px;background:${x.avg < 3 ? '#997d65' : '#795c45'}"></div></div><span class="sm" style="width:44px;text-align:right">${x.avg} s</span></div>` : html`<span class="mut sm">—</span>`}</td>
            <td class="n mut">${x.total ? (x.total >= 3600 ? Math.round(x.total / 360) / 10 + ' h' : Math.round(x.total / 60) + ' min') : '—'}</td><td class="n">${K(x.likes)}</td><td class="n">${K(x.saves)}</td><td class="n">${K(x.shares)}</td></tr>`)}</tbody></table></div>
          <div class="sp-callout info" style="margin-top:12px"><span class="grow">Instagram no entrega por API el segundo exacto en que la gente deja de ver (esa curva solo está en la app). Lo más cercano es el <b>watch time promedio</b>: si está debajo de 3 s, se fueron en el hook.</span></div>`
        : html`<div class="mut sm" style="padding:6px 0">No hay reels de esta cuenta en los últimos 90 días.</div>`}</div>
      ${ig.top.length ? html`<div class="sp-panel" style="margin-top:16px"><div class="wkhead"><h3>Mejores posts del periodo</h3></div><div class="tscroll"><table class="wktable"><thead><tr><th>Fecha</th><th>Tipo</th><th class="n">Alcance</th><th class="n">Likes</th><th class="n">Comentarios</th><th class="n">Guardados</th><th class="n">Engagement</th></tr></thead><tbody>${ig.top.map((x) => html`<tr><td>${x.url ? html`<a href="${x.url}" target="_blank" rel="noopener noreferrer" style="color:inherit">${fdate(x.date)}</a>` : fdate(x.date)}</td><td>${x.type}</td><td class="n">${K(x.reach)}</td><td class="n">${K(x.likes)}</td><td class="n">${K(x.comments)}</td><td class="n">${K(x.saves)}</td><td class="n"><b style="font-weight:500">${K(x.eng)}</b></td></tr>`)}</tbody></table></div></div>` : ''}`;
    }
    mount(b, html`${top}<div id="anScrape" style="margin-top:24px"></div>`);
    const ch = $('#chIG', b); if (ch) lineChart(ch, ig.series.map((x) => fdate(x.date)), [{ name: 'Alcance', v: ig.series.map((x) => x.reach), c: '#2c1f16', fill: true }, { name: 'Vistas', v: ig.series.map((x) => x.views), c: '#997d65', dash: true }]);
    scrapeAnalytics($('#anScrape', b));
  }
  function scrapeAnalytics(b) {
    if (needWeek(b, scrapeAnalytics)) return;
    const h = week.analytics || [], last = h[h.length - 1], prev = h[h.length - 2];
    const delta = (k) => (last && prev && prev[k] ? Math.round(((last[k] - prev[k]) / prev[k]) * 100) : null);
    const own = week.result?.own || [];
    if (!h.length) return mount(b, html`<div class="mut sm">Conecta Instagram en Analytics y tus posts aparecen aquí.</div>`);
    const kpi = (lbl, v, d) => html`<div><span class="lbl">${lbl}</span><b>${v}</b><span class="sm ${d == null ? 'mut' : d >= 0 ? 'up' : 'down'}">${d == null ? 'vs semana anterior: —' : (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + '% vs semana anterior'}</span></div>`;
    mount(b, html`<div class="sec-title" style="margin-top:0"><h2>Lectura semanal</h2><span class="mut sm">De los posts que lee el scrape cada lunes</span></div>
      <div class="sp-kpis ct-delta">${kpi('Vistas promedio', K(last.avgViews), delta('avgViews'))}${kpi('Engagement', last.er == null ? '—' : last.er + '%', delta('er'))}${kpi('Likes', K(last.likes), delta('likes'))}${kpi('Posts leídos', last.posts, null)}</div>
      <div class="sp-panel ct-main"><div class="wkhead"><h3>Vistas promedio por semana</h3></div><div class="chart" id="chA"></div></div>
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
    pday: (t) => { pdate = t.dataset.d; recal(); },
    pmonth: (t) => { const d = new Date(pdate + 'T12:00'); d.setMonth(d.getMonth() + +t.dataset.d, 1); pdate = iso(d); recal(); },
    cvista: (t) => { cvista = t.dataset.v === 'semana' ? 'semana' : 'mes'; recal(); },
    mprev: () => { const d = new Date(pdate + 'T12:00'); if (cvista === 'mes') d.setMonth(d.getMonth() - 1, 1); else d.setDate(d.getDate() - 7); pdate = iso(d); recal(); },
    mnext: () => { const d = new Date(pdate + 'T12:00'); if (cvista === 'mes') d.setMonth(d.getMonth() + 1, 1); else d.setDate(d.getDate() + 7); pdate = iso(d); recal(); },
    mtoday: () => { pdate = today(); recal(); },
    mrefresh: () => { posts = null; shoots = null; ops = null; recal(); },
    ctipo: (t) => { const k = t.dataset.t; coff.has(k) ? coff.delete(k) : coff.add(k); try { localStorage.setItem('os.cal.marca.off', JSON.stringify([...coff])); } catch {} recal(); },
    day: (t, e) => { if (e?.target?.closest('.wc-ev,.wc-more')) return; const d = t.dataset.date; if (d && cerrado(d).cerrado) return toast(`Sin brief del ciclo de ${mesNombre(d.slice(0, 7))}: no se crean piezas con fecha de ese mes`, true); editPost(slug, null, pieceOpts(d ? { date: d } : {})).then((r) => { if (r) { posts = [...posts, r]; recal(); } }); },
    dayall: (t) => { const desde = (fn) => (x) => { closeDrawer(); fn(x); }; drawer(diaHtml(cdia?.[t.dataset.date] || []), { pedit: desde((x) => el.querySelector('#cbody') && posts && editPost(slug, posts.find((y) => y.id === x.dataset.id), pieceOpts()).then((r) => { if (r) { posts = posts.map((y) => (y.id === r.id ? r : y)); recal(); } })), sedit: desde((x) => { const y = shoots.find((z) => z.id === x.dataset.id); if (y) editShoot(y); }), go: () => closeDrawer(), hito: (x) => drawer(hitoHtml(x.dataset.d), {}, { section: 'Calendario', title: 'El ciclo' }) }, { section: 'Calendario', title: fdate(t.dataset.date) }); },
    hito: (t) => drawer(hitoHtml(t.dataset.d), {}, { section: 'Calendario', title: 'El ciclo' }),
    snew: (t, e) => { if (e?.target?.closest('.ppost')) return; editShoot(null, t.dataset.d); },
    sedit: (t) => { const x = shoots.find((y) => y.id === t.dataset.id); if (x) editShoot(x); },
    pnew: async (t, e) => { if (e?.target?.closest('.ppost')) return; if (t.dataset.d && cerrado(t.dataset.d).cerrado) return toast(`Sin brief del ciclo de ${mesNombre(t.dataset.d.slice(0, 7))}: no se crean piezas con fecha de ese mes`, true); const r = await editPost(slug, null, pieceOpts(t.dataset.d ? { date: t.dataset.d } : {})); if (r) { posts = [...posts, r]; recal(); } },
    pedit: async (t) => { const p = posts.find((x) => x.id === t.dataset.id); if (!p) return; const r = await editPost(slug, p, pieceOpts()); if (r) { posts = posts.map((x) => (x.id === r.id ? r : x)); recal(); } },
    ccmix: (t) => { const k = t.dataset.f, v = t.dataset.v; ccf = { ...ccf, [k]: ccf[k] === v ? '' : v }; recal(); },
    ccclear: () => { ccf = {}; recal(); },
    briefOpen: async (t) => {
      if (!(await confirmAsk(`¿Abrir ${mesNombre(t.dataset.m)} sin brief del ciclo? Queda anotado que lo abriste tú.`))) return;
      try { const d = (await col('settings').get('brief_open').catch(() => null)) || { id: 'brief_open', marcas: {} }; const marcas = { ...(d.marcas || {}) }; marcas[slug] = [...(marcas[slug] || []).filter((x) => x.mes !== t.dataset.m), { mes: t.dataset.m, por: me.email, en: new Date().toISOString() }];
        await (d.v ? col('settings').save({ ...d, marcas }) : col('settings').create({ id: 'brief_open', marcas })); cabiertos = marcas[slug]; toast('Mes abierto sin brief'); recal(); } catch (e) { toast(e.message, true); }
    },
    parch: () => { parch = !parch; recal(); },
    pillars: async () => {
      const cur = data.cfg.pillars || [];
      const v = await ask('Pilares de contenido', [{ k: 'list', l: 'Un pilar por línea (máx. 8). Ej.: Educa · Detrás de cámaras · Casos · Oferta', t: 'textarea', v: cur.map((x) => x.name).join('\n') }], 'Guardar');
      if (!v) return;
      const names = v.list.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 8);
      const pillars = names.map((name, i) => ({ name, color: cur.find((x) => x.name === name)?.color || PAL[i % PAL.length] }));
      try { const r = await api('content/connect', { method: 'PUT', body: { profile: slug, pillars } }); data.cfg.pillars = r.pillars; setConn(slug, { pillars: r.pillars }); toast('Pilares guardados'); recal(); } catch (e) { toast(e.message, true); }
    },
    scrape: async (t) => { t.disabled = true; try { await api('content/scrape', { method: 'POST', body: { profile: slug } }); toast('Buscando posts nuevos… tarda unos minutos'); week = null; paint(); } catch (e) { toast(e.message, true); } t.disabled = false; },
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
      try { await api('content/refs', { method: 'PUT', body: { profile: slug, videos: refVideos() } }); await api('content/refs/scrape', { method: 'POST', body: { profile: slug } }); toast('Listo: primero lee tus referencias y luego busca similares (unos minutos)'); rf = null; refsTab($('#cbody', el)); }
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
