// Referencias por pilar (Contenido → Referencias). En vez de buscar por tema (demasiado general):
//   1) por cada pilar, el equipo pega hasta 5 videos que le sirven de referencia;
//   2) Apify lee esos videos (quién los hizo y con qué hashtags);
//   3) luego busca lo más reciente de esos mismos creadores y de esos hashtags;
//   4) gana lo que rindió muy por encima de lo normal DE ESA CUENTA, y queda listo para desglosar
//      (hook, retención, estructura, por qué funcionó, cómo adaptarlo) con el Claude de cada quien.
import * as db from './db.js';

const ACT = { instagram: 'apify~instagram-scraper', tiktok: 'clockworks~tiktok-scraper' };
const PER = 8, MAX_OWNERS = 12, MAX_TAGS = 8, MAX_VIDEOS = 5;
export const on = () => Boolean(process.env.APIFY_TOKEN?.trim());
async function apify(path, init = {}) {
  const t = process.env.APIFY_TOKEN?.trim(); if (!t) throw Object.assign(new Error('Falta APIFY_TOKEN en Vercel'), { code: 'NO_APIFY' });
  const r = await fetch(`https://api.apify.com/v2/${path}`, { ...init, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`Apify ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return r.json();
}
const VIDEO = /^https:\/\/(www\.)?(instagram\.com\/(p|reel|reels)\/[\w-]+|tiktok\.com\/@[\w.]+\/video\/\d+|vm\.tiktok\.com\/[\w]+)/;
const redOf = (u) => (/tiktok\.com/.test(u) ? 'tiktok' : 'instagram');
const n = (v) => (Number.isFinite(+v) ? +v : 0);
const clean = (u) => String(u || '').trim().split('?')[0];

function norm(red, it) {
  if (red === 'instagram') return { red, id: it.shortCode || it.id, handle: String(it.ownerUsername || '').toLowerCase(), url: it.url, text: String(it.caption || '').slice(0, 500), views: n(it.videoViewCount || it.videoPlayCount), likes: n(it.likesCount), comments: n(it.commentsCount), at: it.timestamp || null, video: it.type === 'Video' || it.productType === 'clips', thumb: it.displayUrl || null, tags: (it.hashtags || []).map((t) => String(t).toLowerCase()) };
  return { red, id: it.id, handle: String(it.authorMeta?.name || '').toLowerCase(), url: it.webVideoUrl, text: String(it.text || '').slice(0, 500), views: n(it.playCount), likes: n(it.diggCount), comments: n(it.commentCount), shares: n(it.shareCount), at: it.createTimeISO || null, video: true, thumb: it.videoMeta?.coverUrl || null, tags: (it.hashtags || []).map((t) => String(t?.name || t).toLowerCase()) };
}

// Lo que guarda el equipo: { "<pilar>": ["url", …] } — solo links de videos, máx. 5 por pilar.
export function cleanVideos(v = {}) {
  const out = {};
  for (const [p, list] of Object.entries(v || {}).slice(0, 12)) {
    const urls = [...new Set((Array.isArray(list) ? list : []).map(clean).filter((u) => VIDEO.test(u)))].slice(0, MAX_VIDEOS);
    if (urls.length) out[String(p).slice(0, 60)] = urls;
  }
  return out;
}
export async function get(slug) { return (await db.get('sources', 'refs-' + slug)) || { videos: {}, breakdown: {} }; }
export async function saveVideos(slug, videos, who) { return db.upsert('sources', 'refs-' + slug, { videos: cleanVideos(videos) }, who); }
export async function saveBreakdown(slug, pillar, items, who) {
  const doc = await get(slug);
  const t = (x, k = 600) => String(x || '').slice(0, k);
  const list = (Array.isArray(items) ? items : []).slice(0, 12).map((x) => ({ url: t(x.url, 300), hook: t(x.hook), retencion: t(x.retencion), estructura: (Array.isArray(x.estructura) ? x.estructura : [x.estructura]).filter(Boolean).slice(0, 8).map((s) => t(s, 200)), por_que: t(x.por_que_funciono || x.por_que), adaptacion: t(x.adaptacion), inferido: Boolean(x.inferido) }));
  return db.upsert('sources', 'refs-' + slug, { breakdown: { ...(doc.breakdown || {}), [String(pillar).slice(0, 60)]: { at: new Date().toISOString(), items: list } } }, who);
}

async function run(red, input) { const j = await apify(`acts/${ACT[red]}/runs`, { method: 'POST', body: JSON.stringify(input) }); return { red, id: j.data.id, ds: j.data.defaultDatasetId, status: j.data.status }; }

// Fase 1: leer los videos de referencia.
export async function start(slug, who) {
  const doc = await get(slug), all = Object.values(doc.videos || {}).flat();
  if (!all.length) throw Object.assign(new Error('Pega al menos un video de referencia en algún pilar'), { status: 400 });
  const ig = all.filter((u) => redOf(u) === 'instagram'), tt = all.filter((u) => redOf(u) === 'tiktok'), runs = [];
  if (ig.length) runs.push(await run('instagram', { directUrls: ig, resultsType: 'posts', resultsLimit: 1, addParentData: false }));
  if (tt.length) runs.push(await run('tiktok', { postURLs: tt, resultsPerPage: 1, shouldDownloadVideos: false, shouldDownloadCovers: false, shouldDownloadSubtitles: false }));
  return db.upsert('sources', 'refs-' + slug, { phase: 1, runs, refs: null, result: null, at: new Date().toISOString() }, who);
}

const done = (r) => r.items || ['FAILED', 'ABORTED', 'TIMED-OUT'].includes(r.status);
async function poll(runs) {
  let changed = false;
  for (const r of runs) {
    if (done(r)) continue;
    const j = await apify(`actor-runs/${r.id}`); if (j.data.status !== r.status) { r.status = j.data.status; changed = true; }
    if (r.status === 'SUCCEEDED') { r.items = (await apify(`datasets/${r.ds}/items?clean=true&limit=600`)).map((it) => norm(r.red, it)).filter((x) => x.url); changed = true; }
  }
  return changed;
}
const urlKey = (u) => clean(u).replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');

// Avanza lo que esté corriendo. Fase 1 → arma la fase 2 (creadores + hashtags de cada pilar) → resultado por pilar.
export async function settle(slug, who) {
  let doc = await get(slug);
  if (!doc.runs?.length || doc.result) return doc;
  const changed = await poll(doc.runs);
  if (!doc.runs.every(done)) { if (changed) doc = await db.upsert('sources', 'refs-' + slug, { runs: doc.runs }, who); return doc; }
  const items = doc.runs.flatMap((r) => r.items || []);
  if (doc.phase === 1) {
    // Cada referencia, con su pilar; de ahí salen los creadores y hashtags a seguir.
    const byUrl = new Map(items.map((x) => [urlKey(x.url), x]));
    const refs = {}, seeds = {};
    for (const [p, urls] of Object.entries(doc.videos || {})) {
      refs[p] = urls.map((u) => byUrl.get(urlKey(u)) || items.find((x) => urlKey(u).includes(String(x.id))) || { url: u, red: redOf(u), handle: '', text: '', missing: true });
      const tagCount = {}; refs[p].forEach((x) => (x.tags || []).forEach((t) => (tagCount[t] = (tagCount[t] || 0) + 1)));
      seeds[p] = { owners: [...new Set(refs[p].map((x) => x.handle).filter(Boolean))], tags: Object.entries(tagCount).sort((a, z) => z[1] - a[1]).slice(0, 2).map(([t]) => t), reds: [...new Set(refs[p].map((x) => x.red))] };
    }
    const S = Object.values(seeds), runs = [];
    const owners = (red) => [...new Set(S.filter((s) => s.reds.includes(red)).flatMap((s) => s.owners))].slice(0, MAX_OWNERS);
    const tags = (red) => [...new Set(S.filter((s) => s.reds.includes(red)).flatMap((s) => s.tags))].slice(0, MAX_TAGS);
    const igO = owners('instagram'), igT = tags('instagram'), ttO = owners('tiktok'), ttT = tags('tiktok');
    if (igO.length || igT.length) runs.push(await run('instagram', { directUrls: [...igO.map((h) => `https://www.instagram.com/${h}/`), ...igT.map((t) => `https://www.instagram.com/explore/tags/${t}/`)], resultsType: 'posts', resultsLimit: PER, onlyPostsNewerThan: '60 days', addParentData: false }));
    if (ttO.length || ttT.length) runs.push(await run('tiktok', { profiles: ttO, hashtags: ttT, resultsPerPage: PER, profileScrapeSections: ['videos'], shouldDownloadVideos: false, shouldDownloadCovers: false, shouldDownloadSubtitles: false }));
    if (!runs.length) return db.upsert('sources', 'refs-' + slug, { phase: 2, runs: [], refs, seeds, result: build(refs, seeds, []), done_at: new Date().toISOString() }, who);
    return db.upsert('sources', 'refs-' + slug, { phase: 2, runs, refs, seeds }, who);
  }
  return db.upsert('sources', 'refs-' + slug, { result: build(doc.refs, doc.seeds, items), done_at: new Date().toISOString() }, who);
}

// Por pilar: sus referencias + lo que más rindió de esos creadores y hashtags (contra la mediana de cada cuenta).
function build(refs, seeds, items) {
  const by = {};
  for (const it of items) (by[it.red + it.handle] ||= []).push(it);
  for (const l of Object.values(by)) { const m = l.map((x) => x.views || x.likes).sort((a, z) => a - z), h = Math.floor(m.length / 2), med = (m.length % 2 ? m[h] : (m[h - 1] + m[h]) / 2) || 1; l.forEach((x) => (x.x = Math.round(((x.views || x.likes) / med) * 10) / 10)); }
  const out = {};
  for (const [p, s] of Object.entries(seeds || {})) {
    const own = new Set((refs[p] || []).map((x) => urlKey(x.url)));
    const sim = items.filter((x) => x.video && !own.has(urlKey(x.url)) && (s.owners.includes(x.handle) || (x.tags || []).some((t) => s.tags.includes(t))));
    out[p] = { refs: refs[p] || [], similar: [...new Map(sim.map((x) => [urlKey(x.url), x])).values()].sort((a, z) => z.x - a.x || z.views - a.views).slice(0, 6), owners: s.owners, tags: s.tags };
  }
  return out;
}
