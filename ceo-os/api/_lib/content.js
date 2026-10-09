// Content: lo que dice el repo de cada perfil + un scrape semanal con Apify.
//   cuentas propias → 00-onboarding/LINKS.md y las que se agregan en la app
//   competencia y referentes → los links de IG y TikTok en 99-referencias/investigacion/*.md
//   guiones y plan → 04-contenido/<AAAA-MM>/…
// Lo que se agrega en la app (hashtags del nicho, cuentas o videos sueltos) vive en la base:
// sources/cfg-<perfil>. El resultado de cada semana: sources/scrape-<perfil> y sources/analytics-<perfil>.
import * as db from './db.js';
import { readFile, listDir, listFiles } from './gh.js';
import { tables, clean } from './parse.js';

const NET = [
  ['instagram', /instagram\.com\/(?!p\/|reel\/|reels\/|explore\/|stories\/)([A-Za-z0-9._]{2,30})/g],
  ['tiktok', /tiktok\.com\/@([A-Za-z0-9._]{2,30})(?!\/video)/g],
];
function accountsIn(text) {
  const out = [];
  for (const [red, re] of NET) for (const m of String(text).matchAll(re)) out.push({ red, handle: m[1].replace(/\.$/, '').toLowerCase() });
  return out;
}
const key = (a) => a.red + ':' + a.handle;
const uniq = (list) => [...new Map(list.map((a) => [key(a), a])).values()];
export const accountUrl = (a) => (a.red === 'tiktok' ? `https://www.tiktok.com/@${a.handle}` : `https://www.instagram.com/${a.handle}/`);

// Perfiles: Inherent, la marca personal y cada cliente.
const PERSONAL = 'clients/marca-personal';
export async function profiles() {
  const dirs = (await listDir('clients')).filter((d) => d.type === 'dir' && !d.name.startsWith('_') && d.name !== 'marca-personal').map((d) => d.name);
  return [
    { slug: 'inherent', name: 'Inherent', root: 'inherent/inherent-social-media' },
    { slug: 'personal', name: 'Marca personal', root: PERSONAL },
    ...dirs.map((d) => ({ slug: d, name: d.toUpperCase(), root: `clients/${d}` })),
  ];
}
export const AUTO_DEFAULT = new Set(['inherent', 'personal']);

export async function cfg(slug) {
  const c = (await db.get('sources', 'cfg-' + slug)) || {};
  return { hashtags: c.hashtags || [], accounts: (c.accounts || []).map((a) => ({ ...a, kind: a.kind === 'referente' ? 'referente' : 'competencia' })), own: c.own || [], audience: c.audience || { general: '', nicho: '', exacto: '' }, videos: c.videos || [], auto: c.auto ?? AUTO_DEFAULT.has(slug), postear_drive: c.postear_drive || '', guiones_drive: c.guiones_drive || '', pillars: Array.isArray(c.pillars) ? c.pillars : [], ig_account: c.ig_account || '', v: c.v || null };
}
// Normaliza lo que manda la app: hashtags sin #, cuentas como links o @handle, videos como links.
export function cleanCfg(b) {
  const tags = [...new Set((Array.isArray(b.hashtags) ? b.hashtags : String(b.hashtags || '').split(/[\s,]+/)).map((t) => String(t).replace(/^#/, '').toLowerCase().replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean))].slice(0, 10);
  const acc = (list, kinds) => uniq((Array.isArray(list) ? list : []).map((a) => ({ red: a.red === 'tiktok' ? 'tiktok' : 'instagram', handle: String(a.handle || '').replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, ''), ...(kinds ? { kind: a.kind === 'referente' ? 'referente' : 'competencia' } : {}) })).filter((a) => a.handle.length >= 2));
  const accounts = acc(b.accounts, true).slice(0, 30), own = acc(b.own, false).slice(0, 6);
  const t = (v) => String(v || '').trim().slice(0, 400);
  const audience = { general: t(b.audience?.general), nicho: t(b.audience?.nicho), exacto: t(b.audience?.exacto) };
  const videos = [...new Set((Array.isArray(b.videos) ? b.videos : []).map(String).filter((u) => /^https:\/\/(www\.)?(instagram\.com\/(p|reel|reels)\/|tiktok\.com\/@[^/]+\/video\/|vm\.tiktok\.com\/)/.test(u)))].slice(0, 20);
  return { hashtags: tags, accounts, own, audience, videos, auto: Boolean(b.auto) };
}

export async function profile(p) {
  // Las cuentas propias: las del onboarding (repo) y las que se agregan en la app.
  const [links, c] = await Promise.all([readFile(`${p.root}/00-onboarding/LINKS.md`), cfg(p.slug)]);
  const repoOwn = links ? uniq(accountsIn(links.content)) : [];
  const own = uniq([...repoOwn.map((a) => ({ ...a, source: 'onboarding' })), ...c.own]);
  const ownKeys = new Set(own.map(key));
  const linkRows = links ? (tables(links.content)[0]?.rows || []).map((r) => ({ k: clean(r[0]), v: clean(r[1]).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), url: (String(r[1]).match(/\((https?:[^)\s]+)\)/) || [])[1] || null })).filter((r) => r.k && r.v && !/^(red|cuenta)$/i.test(r.k)) : [];
  const inv = listFiles(`${p.root}/99-referencias/investigacion`).filter((f) => /\.md$/i.test(f));
  const competitors = [];
  for (const f of inv) {
    const c = await readFile(f); if (!c) continue;
    for (const a of accountsIn(c.content)) if (!ownKeys.has(key(a))) competitors.push({ ...a, source: f.split('/').pop() });
  }
  const months = {};
  for (const f of listFiles(`${p.root}/04-contenido`)) {
    const m = f.match(/04-contenido\/(\d{4}-\d{2})\/(.+)$/); if (!m || !/\.(md|csv)$/i.test(f)) continue;
    const c = await readFile(f); if (!c) continue;
    (months[m[1]] ||= []).push({ path: m[2], name: m[2].split('/').pop(), area: m[2].split('/')[0], content: c.content.slice(0, 200_000) });
  }
  return {
    ...p, own, links: linkRows, hasLinks: Boolean(links),
    competitors: uniq(competitors), investigacion: inv.map((f) => f.split('/').pop()),
    months: Object.entries(months).sort((a, z) => z[0].localeCompare(a[0])).map(([mes, files]) => ({ mes, files })),
  };
}

// ---------- Apify ----------
const ACTORS = { instagram: 'apify~instagram-scraper', tiktok: 'clockworks~tiktok-scraper' };
const PER_SOURCE = 10, MAX_SOURCES = 25;
export const apifyOn = () => Boolean(process.env.APIFY_TOKEN?.trim());
async function apify(path, init = {}) {
  const t = process.env.APIFY_TOKEN?.trim(); if (!t) throw Object.assign(new Error('Falta APIFY_TOKEN en Vercel'), { code: 'NO_APIFY' });
  const r = await fetch(`https://api.apify.com/v2/${path}`, { ...init, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`Apify ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return r.json();
}

// Lo que se scrapea de un perfil: sus cuentas (repo), la competencia (repo), lo agregado en la app.
export async function sourcesOf(slug) {
  const p = (await profiles()).find((x) => x.slug === slug); if (!p) return null;
  const [full, c] = await Promise.all([profile(p), cfg(slug)]);
  const ownKeys = new Set(full.own.map(key));
  return { own: full.own, accounts: uniq([...full.competitors.map((a) => ({ ...a, kind: 'competencia' })), ...c.accounts]).filter((a) => !ownKeys.has(key(a))), hashtags: c.hashtags, videos: c.videos };
}
export async function startScrape(src) {
  const runs = [];
  for (const red of Object.keys(ACTORS)) {
    const acc = [...src.own, ...src.accounts].filter((a) => a.red === red).slice(0, MAX_SOURCES);
    const vids = src.videos.filter((u) => (red === 'tiktok' ? /tiktok\.com/ : /instagram\.com/).test(u));
    if (!acc.length && !src.hashtags.length && !vids.length) continue;
    const input = red === 'instagram'
      ? { directUrls: [...acc.map(accountUrl), ...src.hashtags.map((h) => `https://www.instagram.com/explore/tags/${h}/`), ...vids], resultsType: 'posts', resultsLimit: PER_SOURCE, onlyPostsNewerThan: '30 days', addParentData: false }
      : { profiles: acc.map((a) => a.handle), hashtags: src.hashtags, postURLs: vids, resultsPerPage: PER_SOURCE, profileScrapeSections: ['videos'], shouldDownloadVideos: false, shouldDownloadCovers: false, shouldDownloadSubtitles: false };
    const j = await apify(`acts/${ACTORS[red]}/runs`, { method: 'POST', body: JSON.stringify(input) });
    runs.push({ red, runId: j.data.id, datasetId: j.data.defaultDatasetId, status: j.data.status });
  }
  return runs;
}

const n = (v) => (Number.isFinite(+v) ? +v : 0);
function normalize(red, it) {
  if (red === 'instagram') return { red, id: it.shortCode || it.id, handle: String(it.ownerUsername || '').toLowerCase(), url: it.url, text: String(it.caption || '').slice(0, 400), views: n(it.videoViewCount || it.videoPlayCount), likes: n(it.likesCount), comments: n(it.commentsCount), at: it.timestamp || null, video: it.type === 'Video' || it.productType === 'clips', thumb: it.displayUrl || null };
  return { red, id: it.id, handle: String(it.authorMeta?.name || '').toLowerCase(), url: it.webVideoUrl, text: String(it.text || '').slice(0, 400), views: n(it.playCount), likes: n(it.diggCount), comments: n(it.commentCount), shares: n(it.shareCount), at: it.createTimeISO || null, video: true, thumb: it.videoMeta?.coverUrl || null };
}
// Ganador = rinde muy por encima de lo normal DE ESA CUENTA (no del índice general).
function scored(items) {
  const by = {};
  for (const it of items) (by[key(it)] ||= []).push(it);
  for (const list of Object.values(by)) {
    const metric = (x) => x.views || x.likes;
    const sorted = list.map(metric).sort((a, b) => a - b); const med = sorted[Math.floor(sorted.length / 2)] || 1;
    for (const it of list) it.x = Math.round((metric(it) / med) * 10) / 10;
  }
  return items.filter((x) => x.url && x.video).sort((a, b) => b.x - a.x || b.views - a.views);
}
const isoWeek = (d) => { const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return `${t.getUTCFullYear()}-S${String(Math.ceil(((t - y) / 864e5 + 1) / 7)).padStart(2, '0')}`; };

// Lee los runs pendientes; cuando todos terminan arma la semana: top 10 del nicho, los videos
// agregados a mano y la foto de analytics de las cuentas propias. Devuelve el doc actualizado.
export async function settle(slug, who) {
  const doc = await db.get('sources', 'scrape-' + slug);
  if (!doc?.runs?.length || doc.result) return doc;
  let changed = false;
  for (const r of doc.runs) {
    if (r.items || ['FAILED', 'ABORTED', 'TIMED-OUT'].includes(r.status)) continue;
    const j = await apify(`actor-runs/${r.runId}`); if (j.data.status !== r.status) { r.status = j.data.status; changed = true; }
    if (r.status === 'SUCCEEDED') { r.items = (await apify(`datasets/${r.datasetId}/items?clean=true&limit=1000`)).map((it) => normalize(r.red, it)); changed = true; }
  }
  if (doc.runs.every((r) => r.items || ['FAILED', 'ABORTED', 'TIMED-OUT'].includes(r.status))) {
    const all = doc.runs.flatMap((r) => r.items || []);
    const ownKeys = new Set((doc.src?.own || []).map(key));
    const vid = (u) => (String(u).match(/instagram\.com\/(?:p|reel|reels)\/([\w-]+)/) || String(u).match(/tiktok\.com\/@[^/]+\/video\/(\d+)/) || [])[1];
    const added = new Set((doc.src?.videos || []).map(vid).filter(Boolean));
    const isAdded = (x) => added.has(String(x.id)) || added.has(vid(x.url));
    const ranked = scored(all);
    const ownPosts = all.filter((x) => ownKeys.has(key(x)));
    // De quién es cada post: referente, competencia o el nicho (hashtags).
    const kindOf = new Map((doc.src?.accounts || []).map((a) => [key(a), a.kind || 'competencia']));
    for (const x of all) x.kind = ownKeys.has(key(x)) ? 'propia' : kindOf.get(key(x)) || 'nicho';
    const latest = (k) => all.filter((x) => x.kind === k).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 12);
    const result = {
      week: doc.week,
      refs: latest('referente'), comp: latest('competencia'),
      top: ranked.filter((x) => !ownKeys.has(key(x)) && !isAdded(x)).slice(0, 10),
      added: ranked.filter(isAdded),
      own: ownPosts.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 30),
    };
    const sum = (f) => ownPosts.reduce((a, x) => a + f(x), 0);
    if (ownPosts.length) {
      const views = sum((x) => x.views), likes = sum((x) => x.likes), comments = sum((x) => x.comments);
      const snap = { week: doc.week, at: new Date().toISOString(), posts: ownPosts.length, views, likes, comments, avgViews: Math.round(views / ownPosts.length), er: views ? Math.round(((likes + comments) / views) * 1000) / 10 : null };
      const an = (await db.get('sources', 'analytics-' + slug)) || {};
      const hist = (an.history || []).filter((h) => h.week !== snap.week).concat(snap).slice(-26);
      await db.upsert('sources', 'analytics-' + slug, { profile: slug, history: hist }, who);
    }
    for (const r of doc.runs) delete r.items; // no guardar el crudo: solo el resultado
    doc.result = result; changed = true;
  }
  if (changed) await db.upsert('sources', 'scrape-' + slug, { runs: doc.runs, result: doc.result || null }, who);
  return doc;
}
export async function scrape(slug, who) {
  const src = await sourcesOf(slug);
  if (!src) throw Object.assign(new Error('Perfil no encontrado'), { status: 400 });
  if (!src.own.length && !src.accounts.length && !src.hashtags.length && !src.videos.length) throw Object.assign(new Error('Este perfil no tiene fuentes: agrega hashtags del nicho, cuentas o videos en «Fuentes»'), { status: 400 });
  try { await settle(slug, who); } catch {} // cierra la semana anterior si quedó pendiente
  const runs = await startScrape(src);
  const doc = { profile: slug, week: isoWeek(new Date()), at: new Date().toISOString(), by: who, src, runs, result: null };
  await db.upsert('sources', 'scrape-' + slug, doc, who);
  return doc;
}

// ---------- Windsor.ai (analytics de Instagram de las cuentas propias) ----------
export const windsorOn = () => Boolean(process.env.WINDSOR_API_KEY?.trim());
// Dos lecturas: la cuenta día por día (alcance, vistas, seguidores) y cada post/reel con su watch time.
const ACC_FIELDS = 'account_name,date,followers_count,reach,views';
const MEDIA_FIELDS = 'account_name,date,timestamp,media_id,media_type,media_product_type,media_permalink,media_thumbnail_url,media_caption,media_reach,media_views,media_like_count,media_comments_count,media_saved,media_shares,media_engagement,media_reel_avg_watch_time,media_reel_total_watch_time';
async function windsor(fields, preset) {
  const key = process.env.WINDSOR_API_KEY?.trim();
  const r = await fetch(`https://connectors.windsor.ai/instagram?api_key=${encodeURIComponent(key)}&date_preset=${preset}&fields=${fields}`);
  if (!r.ok) throw Object.assign(new Error(`Windsor ${r.status}: ${(await r.text()).slice(0, 160)}`), { status: 502 });
  const j = await r.json(); return Array.isArray(j) ? j : j.data || [];
}
const nameOf = (x) => String(x.account_name || x.username || x.user_name || '').replace(/^@/, '').toLowerCase();
export async function instagram(handles, days = 30, hint = '') {
  const preset = days <= 7 ? 'last_7d' : days <= 30 ? 'last_30d' : 'last_90d';
  // Los reels de 90 días: si el perfil no publicó este mes, igual hay qué ver.
  const [acc, med] = await Promise.all([windsor(ACC_FIELDS, preset).catch(() => windsor('account_name,date,followers_count', preset)), windsor(MEDIA_FIELDS, 'last_90d').catch(() => [])]);
  const seen = [...new Set([...acc, ...med].map(nameOf).filter(Boolean))].sort();
  // Sin cuenta configurada, se reconoce por el nombre del perfil (ej. «inherent» → @inherent.corp).
  if (!handles.length && hint) handles = seen.filter((h) => h.replace(/[^a-z0-9]/g, '').includes(hint.replace(/[^a-z0-9]/g, ''))).slice(0, 1);
  const isMine = (x) => handles.includes(nameOf(x)) || (seen.length === 1 && handles.length && !nameOf(x));
  const mineA = acc.filter(isMine), mineM = med.filter(isMine);
  const n = (v) => (Number.isFinite(+v) ? +v : 0);
  const byDay = {}; for (const x of mineA) { const d = String(x.date).slice(0, 10); (byDay[d] ||= { reach: 0, views: 0 }); byDay[d].reach += n(x.reach); byDay[d].views += n(x.views); }
  const series = Object.entries(byDay).sort(([a], [z]) => a.localeCompare(z)).map(([date, v]) => ({ date, ...v }));
  const media = [...new Map(mineM.filter((x) => x.media_id).map((x) => [x.media_id, x])).values()].map((x) => {
    const likes = n(x.media_like_count), comments = n(x.media_comments_count), saves = n(x.media_saved), shares = n(x.media_shares);
    const reel = /reel|clips/i.test(`${x.media_product_type} ${x.media_type}`);
    return { id: x.media_id, date: String(x.timestamp || x.date).slice(0, 10), type: reel ? 'Reel' : /carousel/i.test(x.media_type) ? 'Carrusel' : /video/i.test(x.media_type) ? 'Video' : 'Foto', reel,
      url: /^https:\/\/(www\.)?instagram\.com\//.test(x.media_permalink || '') ? x.media_permalink : null, thumb: /^https:\/\//.test(x.media_thumbnail_url || '') ? x.media_thumbnail_url : null,
      caption: String(x.media_caption || '').slice(0, 140), reach: n(x.media_reach), views: n(x.media_views), likes, comments, saves, shares, eng: n(x.media_engagement) || likes + comments + saves + shares,
      avg: Math.round(n(x.media_reel_avg_watch_time) / 100) / 10, total: Math.round(n(x.media_reel_total_watch_time) / 1000) };
  }).sort((a, z) => z.date.localeCompare(a.date));
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const recent = media.filter((x) => x.date >= since);
  const reels = media.filter((x) => x.reel);
  const sum = (l, f) => l.reduce((a, x) => a + x[f], 0);
  const withAvg = reels.filter((x) => x.avg > 0);
  return {
    accounts: seen, matched: mineA.length + mineM.length > 0, days,
    followers: Math.max(0, ...mineA.map((x) => n(x.followers_count))),
    reach: series.length ? sum(series, 'reach') : sum(recent, 'reach'), views: series.length ? sum(series, 'views') : sum(recent, 'views'),
    // Engagement de lo publicado en el periodo; si no hubo posts, el de los últimos 90 días (y se dice).
    // + el del periodo anterior del mismo largo, para saber si sube o baja.
    posts: recent.length, ...(() => {
      const erOf = (l) => (sum(l, 'reach') ? Math.round((sum(l, 'eng') / sum(l, 'reach')) * 1000) / 10 : null);
      const base = sum(recent, 'reach') ? recent : media, prevSince = new Date(Date.now() - 2 * days * 864e5).toISOString().slice(0, 10);
      const prev = base === recent ? media.filter((x) => x.date >= prevSince && x.date < since) : [];
      return { er: erOf(base), erDays: base === recent ? days : 90, erPrev: erOf(prev), postsPrev: prev.length, eng: sum(base, 'eng'), engReach: sum(base, 'reach') };
    })(),
    handles,
    series, reels: reels.slice(0, 30),
    watch: { avg: withAvg.length ? Math.round((sum(withAvg, 'avg') / withAvg.length) * 10) / 10 : null, hours: Math.round(sum(reels, 'total') / 360) / 10, hookLost: withAvg.filter((x) => x.avg < 3).length, n: withAvg.length },
    top: [...recent].sort((a, z) => z.eng - a.eng).slice(0, 8),
  };
}
