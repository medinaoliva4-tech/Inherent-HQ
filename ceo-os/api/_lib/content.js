// Content: lo que dice el repo de cada perfil + un scrape semanal con Apify.
//   cuentas propias → 00-onboarding/LINKS.md
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
  return { hashtags: c.hashtags || [], accounts: c.accounts || [], videos: c.videos || [], auto: c.auto ?? AUTO_DEFAULT.has(slug), v: c.v || null };
}
// Normaliza lo que manda la app: hashtags sin #, cuentas como links o @handle, videos como links.
export function cleanCfg(b) {
  const tags = [...new Set((Array.isArray(b.hashtags) ? b.hashtags : String(b.hashtags || '').split(/[\s,]+/)).map((t) => String(t).replace(/^#/, '').toLowerCase().replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean))].slice(0, 10);
  const accounts = uniq((Array.isArray(b.accounts) ? b.accounts : []).map((a) => ({ red: a.red === 'tiktok' ? 'tiktok' : 'instagram', handle: String(a.handle || '').replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '') })).filter((a) => a.handle.length >= 2)).slice(0, 20);
  const videos = [...new Set((Array.isArray(b.videos) ? b.videos : []).map(String).filter((u) => /^https:\/\/(www\.)?(instagram\.com\/(p|reel|reels)\/|tiktok\.com\/@[^/]+\/video\/|vm\.tiktok\.com\/)/.test(u)))].slice(0, 20);
  return { hashtags: tags, accounts, videos, auto: Boolean(b.auto) };
}

export async function profile(p) {
  const links = await readFile(`${p.root}/00-onboarding/LINKS.md`);
  const own = links ? uniq(accountsIn(links.content)) : [];
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
  return { own: full.own, accounts: uniq([...full.competitors, ...c.accounts]).filter((a) => !ownKeys.has(key(a))), hashtags: c.hashtags, videos: c.videos };
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
    const result = {
      week: doc.week,
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
