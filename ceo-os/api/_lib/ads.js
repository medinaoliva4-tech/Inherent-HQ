// Ads management: cómo va la pauta de cada cliente (Windsor: Meta, Google Ads, LinkedIn) y qué anuncia
// su competencia (Apify: la biblioteca de anuncios de Meta). Las cuentas de cada cliente están en accounts.ads.
import * as db from './db.js';

const KEY = () => process.env.WINDSOR_API_KEY?.trim();
export const windsorOn = () => Boolean(KEY());
export const apifyOn = () => Boolean(process.env.APIFY_TOKEN?.trim());
// Plataforma → conector de Windsor. Los campos varían por conector: se piden de más a menos.
const CONN = { meta: 'facebook', google: 'google_ads', linkedin: 'linkedin' };
const FIELDS = [
  'account_id,account_name,date,spend,impressions,clicks,conversions,revenue',
  'account_id,account_name,date,spend,impressions,clicks,conversions',
  'account_id,account_name,date,spend,impressions,clicks',
];
const digits = (x) => String(x || '').replace(/\D/g, '');
const n = (v) => (Number.isFinite(+v) ? +v : 0);

const cache = new Map(); // conector+preset → { at, rows }
async function windsor(conn, preset) {
  const k = conn + preset, hit = cache.get(k);
  if (hit && Date.now() - hit.at < 60 * 60e3) return hit.rows;
  let last;
  for (const f of FIELDS) {
    const r = await fetch(`https://connectors.windsor.ai/${conn}?api_key=${encodeURIComponent(KEY())}&date_preset=${preset}&fields=${f}`);
    if (r.ok) { const j = await r.json(); const rows = Array.isArray(j) ? j : j.data || []; cache.set(k, { at: Date.now(), rows }); return rows; }
    last = `Windsor ${r.status}: ${(await r.text()).slice(0, 140)}`;
  }
  throw new Error(last);
}

// El tablero: por cliente y plataforma, gasto, impresiones, clics, conversiones, CPA, CTR y ROAS, y el gasto por día.
// sc es el alcance de quien pregunta (scoper() en access.js; null = ve todo): solo entran los clientes que pasan
// sc.client(slug), y con ellos sus cuentas, sus filas de Windsor y su serie. Nada de otro cliente sale de aquí.
const slugDe = (a) => a.slug || String(a.id).replace(/^acc-/, '');
export async function report(days = 30, { sc = null } = {}) {
  if (!windsorOn()) return { on: false };
  const preset = days <= 7 ? 'last_7d' : days <= 30 ? 'last_30d' : 'last_90d';
  const accs = (await db.list('accounts')).filter((a) => a.ads && Object.values(a.ads).some(Boolean) && (!sc || sc.client(slugDe(a))));
  const out = { on: true, days, clients: [], errors: {} };
  const rowsBy = {};
  for (const [plat, conn] of Object.entries(CONN)) {
    if (!accs.some((a) => a.ads[plat])) continue;
    try { rowsBy[plat] = await windsor(conn, preset); } catch (e) { out.errors[plat] = e.message; }
  }
  for (const a of accs) {
    const slug = slugDe(a), c = { slug, name: a.name || slug.toUpperCase(), budget: a.ads.budget || null, plats: {}, series: {} };
    for (const plat of Object.keys(CONN)) {
      const id = digits(a.ads[plat]); if (!id || !rowsBy[plat]) continue;
      const rows = rowsBy[plat].filter((r) => digits(r.account_id) === id);
      const t = rows.reduce((s, r) => ({ spend: s.spend + n(r.spend), imp: s.imp + n(r.impressions), clicks: s.clicks + n(r.clicks), conv: s.conv + n(r.conversions), rev: s.rev + n(r.revenue) }), { spend: 0, imp: 0, clicks: 0, conv: 0, rev: 0 });
      c.plats[plat] = { ...t, found: rows.length > 0, ctr: t.imp ? Math.round((t.clicks / t.imp) * 10000) / 100 : null, cpa: t.conv ? Math.round((t.spend / t.conv) * 100) / 100 : null, roas: t.spend && t.rev ? Math.round((t.rev / t.spend) * 100) / 100 : null };
      for (const r of rows) if (r.date) c.series[r.date] = (c.series[r.date] || 0) + n(r.spend);
    }
    const all = Object.values(c.plats);
    c.total = all.reduce((s, p) => ({ spend: s.spend + p.spend, conv: s.conv + p.conv, rev: s.rev + p.rev, clicks: s.clicks + p.clicks, imp: s.imp + p.imp }), { spend: 0, conv: 0, rev: 0, clicks: 0, imp: 0 });
    c.total.cpa = c.total.conv ? Math.round((c.total.spend / c.total.conv) * 100) / 100 : null;
    c.total.roas = c.total.spend && c.total.rev ? Math.round((c.total.rev / c.total.spend) * 100) / 100 : null;
    c.series = Object.entries(c.series).sort(([x], [y]) => x.localeCompare(y)).map(([date, spend]) => ({ date, spend: Math.round(spend * 100) / 100 }));
    out.clients.push(c);
  }
  return out;
}

// ---------- Competencia: sus anuncios activos en Meta (Apify · Facebook Ads Library Scraper) ----------
const ACTOR = 'apify~facebook-ads-scraper';
async function apify(path, init = {}) {
  const r = await fetch(`https://api.apify.com/v2/${path}`, { ...init, headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN.trim()}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`Apify ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return r.json();
}
// Una página de Facebook o un link de la biblioteca de anuncios; un nombre suelto se busca en la biblioteca.
const toUrl = (x) => (/^https:\/\//.test(x) ? x : `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(x)}&search_type=keyword_unordered`);
export async function scrapeCompetitors(slug, list, who) {
  if (!apifyOn()) throw Object.assign(new Error('Falta APIFY_TOKEN en Vercel'), { code: 'NO_APIFY' });
  const urls = list.map((x) => String(x).trim()).filter(Boolean).slice(0, 10);
  if (!urls.length) throw Object.assign(new Error('Agrega al menos un competidor'), { status: 400 });
  const j = await apify(`acts/${ACTOR}/runs`, { method: 'POST', body: JSON.stringify({ startUrls: urls.map((u) => ({ url: toUrl(u) })), resultsLimit: 15, activeStatus: 'active' }) });
  return db.upsert('sources', 'ads-' + slug, { competitors: urls, run: { id: j.data.id, dataset: j.data.defaultDatasetId, status: j.data.status, at: new Date().toISOString() }, items: null }, who);
}
const pick = (o, ...ks) => { for (const k of ks) { const v = k.split('.').reduce((x, y) => x?.[y], o); if (v) return v; } return ''; };
const tpl = (t) => String(t || '').replace(/\{\{[^}]*\}\}/g, '').trim(); // anuncios de catálogo: {{product.name}}
function normalize(it) {
  const s = it.snapshot || {};
  const card = (s.cards || [])[0] || {};
  return {
    page: pick(it, 'pageName', 'snapshot.page_name', 'snapshot.pageName') || '—',
    id: String(pick(it, 'adArchiveID', 'adArchiveId', 'ad_archive_id', 'adId')),
    text: tpl(pick(s, 'body.text', 'body') || pick(card, 'body')).slice(0, 500),
    title: tpl(pick(s, 'title') || pick(card, 'title')).slice(0, 140),
    cta: pick(s, 'ctaText', 'cta_text') || pick(card, 'ctaText'),
    link: pick(s, 'linkUrl', 'link_url') || pick(card, 'linkUrl'),
    img: pick(s, 'images.0.originalImageUrl', 'images.0.resizedImageUrl', 'videos.0.videoPreviewImageUrl') || pick(card, 'originalImageUrl', 'resizedImageUrl', 'videoPreviewImageUrl'),
    video: Boolean((s.videos || []).length || card.videoHdUrl || card.videoSdUrl),
    since: String(pick(it, 'startDateFormatted', 'start_date_formatted', 'startDate') || '').slice(0, 10),
    platforms: it.publisherPlatform || it.publisher_platform || [],
  };
}
export async function competitors(slug, who) {
  const doc = await db.get('sources', 'ads-' + slug); if (!doc) return null;
  if (doc.run && !doc.items && !['FAILED', 'ABORTED', 'TIMED-OUT'].includes(doc.run.status)) {
    const j = await apify(`actor-runs/${doc.run.id}`);
    const run = { ...doc.run, status: j.data.status };
    if (run.status === 'SUCCEEDED') {
      const items = (await apify(`datasets/${run.dataset}/items?clean=true&limit=200`)).map(normalize).filter((x) => x.id || x.text);
      return db.upsert('sources', 'ads-' + slug, { run, items, done_at: new Date().toISOString() }, who);
    }
    if (run.status !== doc.run.status) return db.upsert('sources', 'ads-' + slug, { run }, who);
  }
  return doc;
}
