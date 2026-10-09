// Content: todo sale del folder del perfil en el repo (Inherent o un cliente).
//   cuentas propias → 00-onboarding/LINKS.md
//   competencia y referentes → 99-referencias/investigacion/*.md (los links de IG y TikTok que haya)
//   guiones y plan → 04-contenido/<AAAA-MM>/…
import { readFile, listDir, listFiles } from './gh.js';
import { tables, clean } from './parse.js';

const NET = [
  ['instagram', /instagram\.com\/(?!p\/|reel\/|explore\/|stories\/)([A-Za-z0-9._]{2,30})/g],
  ['tiktok', /tiktok\.com\/@([A-Za-z0-9._]{2,30})/g],
];
function accountsIn(text) {
  const out = [];
  for (const [red, re] of NET) for (const m of String(text).matchAll(re)) out.push({ red, handle: m[1].replace(/\.$/, '').toLowerCase() });
  return out;
}
const uniq = (list) => [...new Map(list.map((a) => [a.red + ':' + a.handle, a])).values()];
export const accountUrl = (a) => (a.red === 'tiktok' ? `https://www.tiktok.com/@${a.handle}` : `https://www.instagram.com/${a.handle}/`);

export async function profiles() {
  const dirs = (await listDir('clients')).filter((d) => d.type === 'dir' && !d.name.startsWith('_')).map((d) => d.name);
  return [{ slug: 'inherent', name: 'Inherent', root: 'inherent/inherent-social-media' }, ...dirs.map((d) => ({ slug: d, name: d.toUpperCase(), root: `clients/${d}` }))];
}

export async function profile(p) {
  const links = await readFile(`${p.root}/00-onboarding/LINKS.md`);
  const own = links ? uniq(accountsIn(links.content)) : [];
  const ownKeys = new Set(own.map((a) => a.red + ':' + a.handle));
  const linkRows = links ? (tables(links.content)[0]?.rows || []).map((r) => ({ k: clean(r[0]), v: clean(r[1]).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), url: (String(r[1]).match(/\((https?:[^)\s]+)\)/) || [])[1] || null })).filter((r) => r.k && r.url) : [];
  const inv = listFiles(`${p.root}/99-referencias/investigacion`).filter((f) => /\.md$/i.test(f));
  const competitors = [];
  for (const f of inv) {
    const c = await readFile(f); if (!c) continue;
    for (const a of accountsIn(c.content)) if (!ownKeys.has(a.red + ':' + a.handle)) competitors.push({ ...a, source: f.split('/').pop() });
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
const MAX_ACCOUNTS = 15, PER_ACCOUNT = 20;
export const apifyOn = () => Boolean(process.env.APIFY_TOKEN?.trim());
async function apify(path, init = {}) {
  const t = process.env.APIFY_TOKEN?.trim(); if (!t) throw Object.assign(new Error('Falta APIFY_TOKEN en Vercel'), { code: 'NO_APIFY' });
  const r = await fetch(`https://api.apify.com/v2/${path}`, { ...init, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`Apify ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return r.json();
}
export async function startScrape(accounts) {
  const runs = [];
  for (const red of Object.keys(ACTORS)) {
    const list = accounts.filter((a) => a.red === red).slice(0, MAX_ACCOUNTS); if (!list.length) continue;
    const input = red === 'instagram'
      ? { directUrls: list.map(accountUrl), resultsType: 'posts', resultsLimit: PER_ACCOUNT, onlyPostsNewerThan: '90 days', addParentData: false }
      : { profiles: list.map((a) => a.handle), resultsPerPage: PER_ACCOUNT, shouldDownloadVideos: false, shouldDownloadCovers: false };
    const j = await apify(`acts/${ACTORS[red]}/runs`, { method: 'POST', body: JSON.stringify(input) });
    runs.push({ red, runId: j.data.id, datasetId: j.data.defaultDatasetId, status: j.data.status, accounts: list.map((a) => a.handle) });
  }
  return runs;
}
const n = (v) => (Number.isFinite(+v) ? +v : 0);
function normalize(red, it) {
  if (red === 'instagram') return { red, handle: String(it.ownerUsername || '').toLowerCase(), url: it.url, text: String(it.caption || '').slice(0, 400), views: n(it.videoViewCount || it.videoPlayCount), likes: n(it.likesCount), comments: n(it.commentsCount), at: it.timestamp || null, type: it.type || '', thumb: it.displayUrl || null };
  return { red, handle: String(it.authorMeta?.name || '').toLowerCase(), url: it.webVideoUrl, text: String(it.text || '').slice(0, 400), views: n(it.playCount), likes: n(it.diggCount), comments: n(it.commentCount), shares: n(it.shareCount), at: it.createTimeISO || null, type: 'Video', thumb: it.videoMeta?.coverUrl || null };
}
// Ganador = rinde muy por encima de lo normal DE ESA CUENTA (no del índice general).
function score(items) {
  const by = {};
  for (const it of items) (by[it.red + ':' + it.handle] ||= []).push(it);
  for (const list of Object.values(by)) {
    const metric = (x) => x.views || x.likes;
    const sorted = list.map(metric).sort((a, b) => a - b); const med = sorted[Math.floor(sorted.length / 2)] || 1;
    for (const it of list) it.x = Math.round((metric(it) / med) * 10) / 10;
  }
  return items.filter((x) => x.url).sort((a, b) => b.x - a.x);
}
export async function refreshRuns(runs) {
  let changed = false;
  for (const r of runs) {
    if (r.items || ['FAILED', 'ABORTED', 'TIMED-OUT'].includes(r.status)) continue;
    const j = await apify(`actor-runs/${r.runId}`); r.status = j.data.status; changed = true;
    if (r.status === 'SUCCEEDED') r.items = (await apify(`datasets/${r.datasetId}/items?clean=true&limit=1000`)).map((it) => normalize(r.red, it));
  }
  return changed;
}
export const winners = (runs) => score(runs.flatMap((r) => r.items || []));
