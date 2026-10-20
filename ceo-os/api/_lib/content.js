// Content: lo que dice el repo de cada perfil + un scrape semanal con Apify.
//   cuentas propias → 00-onboarding/LINKS.md y las que se agregan en la app
//   competencia y referentes → los links de IG y TikTok en 99-referencias/investigacion/*.md
//   guiones y plan → 04-contenido/<AAAA-MM>/…
// Lo que se agrega en la app (hashtags del nicho, cuentas o videos sueltos) vive en la base:
// sources/cfg-<perfil>. El resultado de cada semana: sources/scrape-<perfil> y sources/analytics-<perfil>.
import crypto from 'node:crypto';
import * as db from './db.js';
import { readFile, listDir, listFiles } from './gh.js';
import { tables, clean } from './parse.js';
import { cuenta, urlDe, RED_KEYS } from '../../public/js/referentes.js';

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
export const accountUrl = (a) => urlDe(a);

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
  return { hashtags: c.hashtags || [], accounts: (c.accounts || []).map((a) => cleanAcc(a, true)).filter(Boolean), own: (c.own || []).map((a) => cleanAcc(a, false)).filter(Boolean), audience: c.audience || { general: '', nicho: '', exacto: '' }, bullseye: c.bullseye || null, videos: c.videos || [], auto: c.auto ?? AUTO_DEFAULT.has(slug), postear_drive: c.postear_drive || '', guiones_drive: c.guiones_drive || '', pillars: Array.isArray(c.pillars) ? c.pillars : [], ig_account: c.ig_account || '', v: c.v || null };
}
// Una cuenta escrita como @handle o como link del perfil → solo el handle. Un link que no es de perfil (un video,
// «explore») o basura (ej. «https» de un link mal leído) → vacío, y se descarta.
const NOT_HANDLE = new Set(['https', 'http', 'www', 'p', 'reel', 'reels', 'explore', 'stories', 'tv', 'video', 'instagram', 'tiktok']);
export function handleOf(x) {
  const u = String(x || '').trim(), m = u.match(/(?:tiktok\.com\/@|instagram\.com\/)([A-Za-z0-9._]{2,30})/i) || u.match(/^@?([A-Za-z0-9._]{2,30})$/);
  const h = m ? m[1].toLowerCase() : '';
  return NOT_HANDLE.has(h) ? '' : h;
}
// Una cuenta guardada (cfg.accounts o cfg.own) → { red, handle, url?, kind? } o null. Fase 4: 4 redes y los 5 niveles
// de cr-fuentes (competencia, referente-similar, -aspiracional, -crecimiento; «referente» es el nombre viejo y se respeta).
export const KINDS = ['competencia', 'referente-similar', 'referente-aspiracional', 'referente-crecimiento', 'referente'];
export function cleanAcc(a, kinds) {
  if (!a || typeof a !== 'object') return null;
  const red = RED_KEYS.includes(a.red) ? a.red : 'instagram';
  const c = cuenta(red === 'youtube' || red === 'linkedin' ? a.url || a.handle : a.handle, red);
  if (!c.ok || c.red !== red) return null;
  return { red, handle: c.handle, ...(red === 'youtube' || red === 'linkedin' ? { url: c.url } : {}), ...(kinds ? { kind: KINDS.includes(a.kind) ? a.kind : 'competencia' } : {}) };
}
// Normaliza lo que manda la app: hashtags sin #, cuentas como links o @handle, videos como links.
export function cleanCfg(b) {
  const tags = [...new Set((Array.isArray(b.hashtags) ? b.hashtags : String(b.hashtags || '').split(/[\s,]+/)).map((t) => String(t).replace(/^#/, '').toLowerCase().replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean))].slice(0, 10);
  const acc = (list, kinds) => uniq((Array.isArray(list) ? list : []).map((a) => cleanAcc(a, kinds)).filter(Boolean));
  const accounts = acc(b.accounts, true).slice(0, 40), own = acc(b.own, false).slice(0, 10);
  const t = (v) => String(v || '').trim().slice(0, 400);
  const audience = { general: t(b.audience?.general), nicho: t(b.audience?.nicho), exacto: t(b.audience?.exacto) };
  const videos = [...new Set((Array.isArray(b.videos) ? b.videos : []).map(String).filter((u) => /^https:\/\/(www\.)?(instagram\.com\/(p|reel|reels)\/|tiktok\.com\/@[^/]+\/video\/|vm\.tiktok\.com\/)/.test(u)))].slice(0, 20);
  return { hashtags: tags, accounts, own, audience, bullseye: cleanBullseye(b.bullseye), videos, auto: Boolean(b.auto) };
}
// La diana de audiencia (método Bullseye): el centro + 4 anillos, cada uno soltando UNA restricción;
// la mezcla 3/1/1 de cada lote de 5 videos; de dónde se sacan temas y craft; y el registro de calibración.
export function cleanBullseye(x) {
  if (!x || typeof x !== 'object' || !Array.isArray(x.rings)) return null;
  const t = (v, k = 300) => String(v ?? '').trim().slice(0, k);
  const rings = x.rings.slice(0, 5).map((r) => ({ label: t(r?.label, 160), relaxed: t(r?.relaxed, 120), size: t(r?.size, 120), conversion: t(r?.conversion, 120), competition: t(r?.competition, 120),
    search: (Array.isArray(r?.search) ? r.search : String(r?.search || '').split(/[,\n]/)).map((s) => t(s, 60)).filter(Boolean).slice(0, 4) }));
  if (rings.length !== 5 || !rings[0].label) return null;
  const mix = (Array.isArray(x.mix) ? x.mix : []).slice(0, 5).map((m, i) => ({ ring: [0, 0, 0, 1, 2][i], topic: t(m?.topic, 240) }));
  const n = (v) => Math.max(0, Math.min(9999, Math.round(+v || 0)));
  const calib = (Array.isArray(x.calib) ? x.calib : []).slice(-12).map((c) => ({ lote: t(c?.lote, 40), c0: n(c?.c0), c1: n(c?.c1), c2: n(c?.c2), decision: t(c?.decision, 200) }));
  return { center: t(x.center, 400), buyer: t(x.buyer, 300), rings, mix, calib, at: t(x.at, 30) || new Date().toISOString() };
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
// Un actor por red. Instagram y TikTok: un run por red con todas sus cuentas (cada post trae su cuenta).
// YouTube y LinkedIn: un run por cuenta (así cada post queda con su cuenta sin adivinar por el formato de salida).
// El actor de cada red se cambia con APIFY_ACTOR_<RED> (ej. APIFY_ACTOR_LINKEDIN) sin tocar el código.
//
// Asíncrono, para no chocar con el tiempo máximo de una función de Vercel: scrape() solo ARRANCA los runs (cada
// llamada a Apify regresa en un segundo) y los recoge settle(). Lo recoge, lo que pase primero:
//   1) el webhook de Apify al terminar cada run → POST /api/investigacion/apify (firmado con CRON_SECRET);
//   2) la página de Investigación abierta (pregunta cada 20 s mientras corre);
//   3) el cron diario /api/cron/settle.
// settle() vuelve a leer el estado y los datos DESDE Apify: el cuerpo del webhook no se cree.
const ACTOR_DEF = { instagram: 'apify~instagram-scraper', tiktok: 'clockworks~tiktok-scraper', youtube: 'streamers~youtube-scraper', linkedin: 'harvestapi~linkedin-profile-posts' };
const actorOf = (red) => String(process.env['APIFY_ACTOR_' + red.toUpperCase()] || ACTOR_DEF[red]).trim().replace('/', '~');
const PER_SOURCE = 10, MAX_SOURCES = 25, PER_ACCOUNT = 6, MAX_SOLO = 10;
// cr-fuentes: tope de seguridad de US$5 por cliente al mes. Cada run lleva maxTotalChargeUsd (el freno duro) y maxItems.
export const TOPE_MES_USD = 5;
const RUN_USD = 1;
export const apifyOn = () => Boolean(process.env.APIFY_TOKEN?.trim());
// Un error de Apify, dicho claro: sin crédito, token malo o una falla. Nunca lleva .status 401/403 (http.fail los lee como Google).
export function apifyError(code, txt = '') {
  const t = String(txt || '');
  const credit = code === 402 || /not-enough-usage|usage[- ]limit|monthly usage|insufficient|credit|payment[- ]required|exceeded.*limit|limit.*exceeded|hard limit/i.test(t);
  const err = credit ? ['APIFY_CREDIT', 'Apify se quedó sin crédito. Lo que ya está en la investigación sigue igual.']
    : code === 401 ? ['APIFY_TOKEN', 'Apify no aceptó el APIFY_TOKEN. Revísalo en Vercel.']
    : code === 0 ? ['APIFY_DOWN', 'Apify no respondió. Se intenta de nuevo en la siguiente pasada.']
    : ['APIFY', `Apify falló (${code}).`];
  return Object.assign(new Error(err[1]), { code: err[0], apifyStatus: code, detail: `Apify ${code}: ${t.slice(0, 200)}` });
}
async function apify(path, init = {}) {
  const t = process.env.APIFY_TOKEN?.trim(); if (!t) throw Object.assign(new Error('Falta APIFY_TOKEN en Vercel'), { code: 'NO_APIFY' });
  let r;
  try { r = await fetch(`https://api.apify.com/v2/${path}`, { ...init, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(init.headers || {}) }, signal: AbortSignal.timeout(20000) }); }
  catch (e) { throw apifyError(0, e.message); }
  if (!r.ok) throw apifyError(r.status, await r.text().catch(() => ''));
  return r.json();
}
// El webhook de cada run: la URL pública de la app + una firma por marca (HMAC con CRON_SECRET). Sin las dos, no hay
// webhook y queda la recogida por la página y el cron.
export const hookToken = (slug) => crypto.createHmac('sha256', String(process.env.CRON_SECRET || '')).update('apify:' + slug).digest('hex').slice(0, 32);
const publicBase = () => { const u = String(process.env.PUBLIC_URL || process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : '')).trim().replace(/\/+$/, ''); return /^https:\/\//.test(u) ? u : ''; };
function hookParam(slug) {
  const base = publicBase(); if (!base || !process.env.CRON_SECRET) return '';
  const requestUrl = `${base}/api/investigacion/apify?s=${encodeURIComponent(slug)}&t=${hookToken(slug)}`;
  return Buffer.from(JSON.stringify([{ eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED', 'ACTOR.RUN.ABORTED', 'ACTOR.RUN.TIMED_OUT'], requestUrl }])).toString('base64');
}

// Lo que se scrapea de un perfil: sus cuentas (repo), la competencia (repo), lo agregado en la app.
export async function sourcesOf(slug) {
  const p = (await profiles()).find((x) => x.slug === slug); if (!p) return null;
  const [full, c] = await Promise.all([profile(p), cfg(slug)]);
  const ownKeys = new Set(full.own.map(key));
  return { own: full.own, accounts: uniq([...full.competitors.map((a) => ({ ...a, kind: 'competencia' })), ...c.accounts]).filter((a) => !ownKeys.has(key(a))), hashtags: c.hashtags, videos: c.videos };
}
// Arranca los runs (no espera a que terminen). opts: { slug, since (AAAA-MM-DD), budget (US$), redes (las de la ficha o null) }.
// Devuelve { runs, skipped:[{red, why}], error } — error es el primero que impide seguir (sin crédito, token malo).
export async function startScrape(src, opts = {}) {
  const runs = [], skipped = [], since = /^\d{4}-\d{2}-\d{2}$/.test(opts.since || '') ? opts.since : null;
  const hooks = opts.slug ? hookParam(opts.slug) : '';
  const all = [...src.own, ...src.accounts];
  const reds = RED_KEYS.filter((red) => all.some((a) => a.red === red) || ((red === 'instagram' || red === 'tiktok') && (src.hashtags?.length || (src.videos || []).some((u) => (red === 'tiktok' ? /tiktok\.com/ : /instagram\.com/).test(u)))));
  const plan = [];
  for (const red of reds) {
    if (opts.redes && !opts.redes.includes(red)) { skipped.push({ red, why: 'no está en la ficha de oferta' }); continue; }
    const acc = all.filter((a) => a.red === red);
    if (red === 'instagram' || red === 'tiktok') {
      const list = acc.slice(0, MAX_SOURCES), vids = (src.videos || []).filter((u) => (red === 'tiktok' ? /tiktok\.com/ : /instagram\.com/).test(u)), tags = src.hashtags || [];
      const input = red === 'instagram'
        ? { directUrls: [...list.map(accountUrl), ...tags.map((h) => `https://www.instagram.com/explore/tags/${h}/`), ...vids], resultsType: 'posts', resultsLimit: list.length ? PER_ACCOUNT : PER_SOURCE, onlyPostsNewerThan: since || '30 days', addParentData: false }
        : { profiles: list.map((a) => a.handle), hashtags: tags, postURLs: vids, resultsPerPage: list.length ? PER_ACCOUNT : PER_SOURCE, profileScrapeSections: ['videos'], ...(since ? { oldestPostDateUnified: since } : {}), shouldDownloadVideos: false, shouldDownloadCovers: false, shouldDownloadSubtitles: false };
      plan.push({ red, input, max: (list.length + tags.length) * PER_SOURCE + vids.length });
    } else {
      for (const a of acc.slice(0, MAX_SOLO)) {
        const input = red === 'youtube'
          ? { startUrls: [{ url: accountUrl(a) }], maxResults: Math.ceil(PER_ACCOUNT / 2), maxResultsShorts: Math.ceil(PER_ACCOUNT / 2), maxResultStreams: 0, sortVideosBy: 'NEWEST' }
          : { targetUrls: [accountUrl(a)], maxPosts: PER_ACCOUNT };
        plan.push({ red, input, max: PER_ACCOUNT * 2, solo: a.handle });
      }
    }
  }
  const usd = Math.max(0.1, Math.min(RUN_USD, Math.round(((opts.budget ?? TOPE_MES_USD) / Math.max(1, plan.length)) * 100) / 100));
  let error = null;
  for (const x of plan) {
    if (error) { skipped.push({ red: x.red, why: error.message }); continue; }
    const q = new URLSearchParams({ timeout: '900', maxItems: String(x.max), maxTotalChargeUsd: String(usd), ...(hooks ? { webhooks: hooks } : {}) });
    try {
      const j = await apify(`acts/${actorOf(x.red)}/runs?${q}`, { method: 'POST', body: JSON.stringify(x.input) });
      runs.push({ red: x.red, runId: j.data.id, datasetId: j.data.defaultDatasetId, status: j.data.status, ...(x.solo ? { handle: x.solo } : {}) });
    } catch (e) {
      if (['APIFY_CREDIT', 'APIFY_TOKEN', 'NO_APIFY'].includes(e.code)) error = e;
      skipped.push({ red: x.red, why: e.message, ...(x.solo ? { handle: x.solo } : {}) });
    }
  }
  return { runs, skipped, error };
}

const n = (v) => (Number.isFinite(+v) ? +v : 0);
const https = (u) => (/^https:\/\/[^\s'"()]+$/.test(String(u || '')) ? String(u) : null);
const dateOf = (v) => { if (v == null || v === '') return null; const d = typeof v === 'number' ? new Date(v > 1e12 ? v : v * 1000) : new Date(String(v)); return isNaN(d) ? null : d.toISOString(); };
export function normalize(red, it, handle = '') {
  if (red === 'instagram') return { red, id: it.shortCode || it.id, handle: String(it.ownerUsername || '').toLowerCase(), url: it.url, text: String(it.caption || '').slice(0, 400), views: n(it.videoViewCount || it.videoPlayCount), likes: n(it.likesCount), comments: n(it.commentsCount), at: it.timestamp || null, video: it.type === 'Video' || it.productType === 'clips', format: it.type === 'Sidecar' ? 'carrusel' : it.type === 'Image' ? 'estatico' : 'reel', slides: it.type === 'Sidecar' ? (it.images || []).filter((u) => /^https:\/\//.test(u)).slice(0, 20) : undefined, thumb: it.displayUrl || null };
  if (red === 'youtube') {
    // El link sin «?v=»: así el id del post (que ignora la query) no choca entre videos.
    const short = /\/shorts\//.test(String(it.url || '')) || /^shorts?$/i.test(String(it.type || '')), url = it.id ? (short ? `https://www.youtube.com/shorts/${it.id}` : `https://youtu.be/${it.id}`) : https(it.url);
    return { red, id: it.id, handle, url, text: [it.title, it.text].filter(Boolean).join('\n').slice(0, 400), views: n(it.viewCount), likes: n(it.likes), comments: n(it.commentsCount), at: dateOf(it.date || it.uploadDate), video: true, format: short ? 'reel' : 'video', thumb: https(it.thumbnailUrl) || null };
  }
  if (red === 'linkedin') {
    const imgs = (Array.isArray(it.postImages) ? it.postImages : Array.isArray(it.images) ? it.images : []).map((x) => https(x?.url || x)).filter(Boolean);
    const eg = it.engagement || it.stats || {}, video = Boolean(it.postVideo || it.video || it.videoUrl);
    return { red, id: String(it.id || it.urn || it.entityId || ''), handle, url: https(it.linkedinUrl || it.url || it.postUrl || it.shareUrl), text: String(it.content || it.text || it.commentary || '').slice(0, 400),
      views: n(it.views || eg.views), likes: n(eg.likes ?? eg.reactions ?? it.numLikes ?? it.likesCount ?? it.totalReactionCount), comments: n(eg.comments ?? it.numComments ?? it.commentsCount), shares: n(eg.shares ?? it.numShares ?? it.repostsCount),
      at: dateOf(it.postedAt?.date || it.postedAt?.timestamp || it.postedAtISO || it.postedDate || it.date || it.postedAt), video, format: video ? 'video' : imgs.length > 1 || it.document ? 'carrusel' : imgs.length ? 'estatico' : 'texto', slides: imgs.length > 1 ? imgs.slice(0, 20) : undefined, thumb: imgs[0] || https(it.postVideo?.thumbnailUrl) || null };
  }
  return { red, id: it.id, handle: String(it.authorMeta?.name || '').toLowerCase(), url: it.webVideoUrl, text: String(it.text || '').slice(0, 400), views: n(it.playCount), likes: n(it.diggCount), comments: n(it.commentCount), shares: n(it.shareCount), at: it.createTimeISO || null, video: true, format: 'reel', thumb: it.videoMeta?.coverUrl || null };
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
const FAILED = ['FAILED', 'ABORTED', 'TIMED-OUT', 'TIMED_OUT'];
const runDone = (r) => r.items || FAILED.includes(r.status);

// Fase 4: lo que pasa cuando una búsqueda termina (Investigación guarda los posts en Research). Lo registra investigacion.js.
let onDone = null;
export const alTerminar = (fn) => { onDone = fn; };

// Lee los runs pendientes; cuando todos terminan arma la semana: top 10 del nicho, los videos agregados a mano,
// la foto de analytics de las cuentas propias y (Fase 4) los posts nuevos en Research. Devuelve el doc actualizado.
export async function settle(slug, who) {
  const doc = await db.get('sources', 'scrape-' + slug);
  if (!doc?.runs?.length || doc.result) return doc;
  let changed = false;
  for (const r of doc.runs) {
    if (runDone(r)) continue;
    const j = await apify(`actor-runs/${r.runId}`);
    if (j.data.status !== r.status) { r.status = j.data.status; changed = true; }
    if (Number.isFinite(+j.data.usageTotalUsd)) r.usd = Math.round(+j.data.usageTotalUsd * 10000) / 10000;
    if (r.status === 'SUCCEEDED') { r.items = (await apify(`datasets/${r.datasetId}/items?clean=true&limit=1000`)).map((it) => normalize(r.red, it, r.handle || '')).filter((x) => x.url); changed = true; }
  }
  if (doc.runs.every(runDone)) {
    const all = doc.runs.flatMap((r) => r.items || []);
    const ownKeys = new Set((doc.src?.own || []).map(key));
    const vid = (u) => (String(u).match(/instagram\.com\/(?:p|reel|reels)\/([\w-]+)/) || String(u).match(/tiktok\.com\/@[^/]+\/video\/(\d+)/) || [])[1];
    const added = new Set((doc.src?.videos || []).map(vid).filter(Boolean));
    const isAdded = (x) => added.has(String(x.id)) || added.has(vid(x.url));
    const ranked = scored(all.map((x) => ({ ...x })));
    const ownPosts = all.filter((x) => ownKeys.has(key(x)));
    // De quién es cada post: referente, competencia o el nicho (hashtags).
    const kindOf = new Map((doc.src?.accounts || []).map((a) => [key(a), a.kind || 'competencia']));
    for (const x of [...all, ...ranked]) x.kind = ownKeys.has(key(x)) ? 'propia' : kindOf.get(key(x)) || 'nicho';
    const latest = (k) => all.filter((x) => (k === 'referente' ? /^referente/.test(x.kind) : x.kind === k)).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 12);
    const result = {
      week: doc.week,
      refs: latest('referente'), comp: latest('competencia'),
      top: ranked.filter((x) => !ownKeys.has(key(x)) && !isAdded(x)).slice(0, 10),
      added: ranked.filter(isAdded),
      own: ownPosts.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 30),
    };
    // Se cierra una sola vez: si dos recogidas llegan juntas (webhook + página), la segunda ve la versión nueva y se va.
    const fallas = [...(doc.skipped || []), ...doc.runs.filter((r) => FAILED.includes(r.status)).map((r) => ({ red: r.red, why: `el run terminó ${r.status}`, ...(r.handle ? { handle: r.handle } : {}) }))];
    const usd = Math.round(doc.runs.reduce((a, r) => a + (+r.usd || 0), 0) * 10000) / 10000;
    const ym = new Date().toISOString().slice(0, 7), month = { ym, usd: Math.round(((doc.month?.ym === ym ? +doc.month.usd || 0 : 0) + usd) * 10000) / 10000 };
    const { id, v, _meta, ...rest } = doc;
    const claimed = await db.update('sources', 'scrape-' + slug, { ...rest, runs: doc.runs.map(({ items, ...r }) => r), result, month, settling: true }, v, who);
    if (!claimed) return db.get('sources', 'scrape-' + slug);
    const sum = (f) => ownPosts.reduce((a, x) => a + f(x), 0);
    if (ownPosts.length) {
      const views = sum((x) => x.views), likes = sum((x) => x.likes), comments = sum((x) => x.comments);
      const snap = { week: doc.week, at: new Date().toISOString(), posts: ownPosts.length, views, likes, comments, avgViews: Math.round(views / ownPosts.length), er: views ? Math.round(((likes + comments) / views) * 1000) / 10 : null };
      const an = (await db.get('sources', 'analytics-' + slug)) || {};
      const hist = (an.history || []).filter((h) => h.week !== snap.week).concat(snap).slice(-26);
      await db.upsert('sources', 'analytics-' + slug, { profile: slug, history: hist }, who);
    }
    let out = { nuevos: 0, actualizados: 0 }, warn = null;
    if (onDone) { try { out = (await onDone(slug, { ...claimed, src: doc.src }, all, who)) || out; } catch (e) { console.error('investigacion', slug, e); warn = 'No se pudieron guardar los posts en Research: ' + e.message; } }
    const por_red = {}; for (const x of all) por_red[x.red] = (por_red[x.red] || 0) + 1;
    const last = { at: doc.at, done_at: new Date().toISOString(), leidos: all.length, nuevos: out.nuevos || 0, actualizados: out.actualizados || 0, por_red, fallas, usd, ...(warn ? { warn } : {}) };
    return db.upsert('sources', 'scrape-' + slug, { last, settling: false }, who);
  }
  if (changed) return db.upsert('sources', 'scrape-' + slug, { runs: doc.runs }, who);
  return doc;
}
// Arranca una búsqueda para un perfil. opts.redes: las redes de su ficha de oferta (null = todas).
// Si ya hay una corriendo (menos de 3 h), no arranca otra: no se paga dos veces. Si el mes llegó al tope, no arranca.
export async function scrape(slug, who, opts = {}) {
  const src = await sourcesOf(slug);
  if (!src) throw Object.assign(new Error('Perfil no encontrado'), { status: 400 });
  if (!src.own.length && !src.accounts.length && !src.hashtags.length && !src.videos.length) throw Object.assign(new Error('Esta marca no tiene referentes: agrégalos en «Referentes de esta marca»'), { status: 400 });
  let prev = null;
  try { prev = await settle(slug, who); } catch { prev = await db.get('sources', 'scrape-' + slug); } // cierra la semana anterior si quedó pendiente
  if (prev?.runs?.length && !prev.result && Date.now() - Date.parse(prev.at || 0) < 3 * 3600e3) return { ...prev, already: true };
  const ym = new Date().toISOString().slice(0, 7), spent = prev?.month?.ym === ym ? +prev.month.usd || 0 : 0;
  const at = new Date().toISOString();
  if (spent >= TOPE_MES_USD) {
    const e = Object.assign(new Error(`Esta marca ya usó el tope de US$${TOPE_MES_USD} de Apify de este mes. Vuelve a correr el mes que entra.`), { code: 'APIFY_TOPE' });
    await db.upsert('sources', 'scrape-' + slug, { profile: slug, error: { code: e.code, msg: e.message, at } }, who);
    throw e;
  }
  // Solo lo reciente: lo publicado desde un día antes de la búsqueda anterior (la primera vez, 30 días).
  const since = prev?.last?.at ? new Date(Date.parse(prev.last.at) - 864e5).toISOString().slice(0, 10) : null;
  const { runs, skipped, error } = await startScrape(src, { slug, since, budget: TOPE_MES_USD - spent, redes: opts.redes || null });
  if (!runs.length) {
    const e = error || Object.assign(new Error(skipped[0]?.why ? `No se pudo buscar: ${skipped[0].why}` : 'No hay cuentas que buscar en las redes de esta marca'), { code: 'APIFY_NADA' });
    await db.upsert('sources', 'scrape-' + slug, { profile: slug, error: { code: e.code || 'APIFY', msg: e.message, at } }, who);
    throw e;
  }
  const doc = { profile: slug, week: isoWeek(new Date()), at, by: who, src, runs, skipped, since, result: null, settling: false, month: { ym, usd: spent }, error: error ? { code: error.code, msg: error.message, at } : null };
  await db.upsert('sources', 'scrape-' + slug, doc, who);
  return doc;
}

// ---------- Windsor.ai (analytics de Instagram de las cuentas propias) ----------
export const windsorOn = () => Boolean(process.env.WINDSOR_API_KEY?.trim());
// Dos lecturas: la cuenta día por día (alcance, vistas, seguidores) y cada post/reel con su watch time.
const ACC_FIELDS = 'account_name,date,followers_count,reach,views';
const MEDIA_FIELDS = 'account_name,date,timestamp,media_id,media_type,media_product_type,media_permalink,media_thumbnail_url,media_url,media_caption,media_reach,media_views,media_like_count,media_comments_count,media_saved,media_shares,media_engagement,media_reel_avg_watch_time,media_reel_total_watch_time';
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
      url: /^https:\/\/(www\.)?instagram\.com\//.test(x.media_permalink || '') ? x.media_permalink : null, thumb: [x.media_thumbnail_url, reel || /video/i.test(x.media_type) ? '' : x.media_url].find((u) => /^https:\/\//.test(u || '')) || null, // fotos y carruseles: su imagen
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
    // Lo mejor por tipo (Home: Reels | Estáticos). Si en el periodo no hubo de ese tipo, los últimos 90 días.
    ...(() => { const best = (f) => { const r = recent.filter(f), l = r.length ? r : media.filter(f); return { items: [...l].sort((a, z) => z.eng - a.eng).slice(0, 6), days: r.length ? days : 90 }; };
      const R = best((x) => x.reel || x.type === 'Video'), S = best((x) => !x.reel && x.type !== 'Video'); return { topReels: R.items, topReelsDays: R.days, topStatic: S.items, topStaticDays: S.days }; })(),
  };
}
