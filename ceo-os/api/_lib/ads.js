// Ads management: cómo va la pauta de cada cliente (Windsor: Meta, Google Ads, LinkedIn) y qué anuncia
// su competencia (Apify: la biblioteca de anuncios de Meta). Las cuentas de cada cliente están en accounts.ads.
// SOLO LECTURA: a Windsor solo se le piden datos (GET) y de AdWhispr no se usa nada desde aquí. Un cambio en una cuenta de anuncios
// es una tarea para ⑩ Ads o el OK del CEO (accounts.ads.ok), nunca una llamada de este archivo.
import * as db from './db.js';
import { agregarTabla, juntarTablas, normalizarFila, sinMontos } from '../../public/js/marketing/ads.js';

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
// La tabla por campaña, conjunto y anuncio: el mismo recurso (de más a menos campos). Meta da los tres niveles; Google, campaña y grupo de
// anuncios; LinkedIn, campaña y creativo. Lo que un conector no da queda vacío y la pantalla dice «⚠️ SIN DATOS» (nunca 0).
const FIELDS_TABLA = {
  facebook: [
    'account_id,campaign,campaign_id,adset_name,adset_id,ad_name,ad_id,date,spend,impressions,clicks,conversions,revenue',
    'account_id,campaign,adset_name,ad_name,date,spend,impressions,clicks,conversions',
    'account_id,campaign,adset_name,ad_name,date,spend,impressions,clicks',
    'account_id,campaign,date,spend,impressions,clicks',
  ],
  google_ads: [
    'account_id,campaign,ad_group,ad_name,date,spend,impressions,clicks,conversions,revenue',
    'account_id,campaign,ad_group,date,spend,impressions,clicks,conversions,revenue',
    'account_id,campaign,ad_group,date,spend,impressions,clicks,conversions',
    'account_id,campaign,ad_group,date,spend,impressions,clicks',
    'account_id,campaign,date,spend,impressions,clicks',
  ],
  linkedin: [
    'account_id,campaign,creative_id,date,spend,impressions,clicks,conversions',
    'account_id,campaign,creative_id,date,spend,impressions,clicks',
    'account_id,campaign,date,spend,impressions,clicks',
  ],
};
const digits = (x) => String(x || '').replace(/\D/g, '');
const n = (v) => (Number.isFinite(+v) ? +v : 0);
const SEIS_HORAS = 6 * 3600e3;

const cache = new Map(); // conector+preset(+tabla) → { at, rows }
// Una lectura (GET) de Windsor: prueba cada lista de campos hasta que una sirva. map = lo que se hace a cada fila antes de guardarla en memoria.
async function windsor(conn, preset, { lists = FIELDS, tag = '', map = null } = {}) {
  const k = conn + preset + tag, hit = cache.get(k);
  if (hit && Date.now() - hit.at < 60 * 60e3) return hit.rows;
  let last;
  for (const f of lists) {
    const r = await fetch(`https://connectors.windsor.ai/${conn}?api_key=${encodeURIComponent(KEY())}&date_preset=${preset}&fields=${f}`);
    if (r.ok) {
      const j = await r.json(); let rows = Array.isArray(j) ? j : j.data || [];
      if (map) rows = rows.map(map).filter(Boolean);
      cache.set(k, { at: Date.now(), rows }); return rows;
    }
    last = `Windsor ${r.status}: ${(await r.text()).slice(0, 140)}`;
  }
  throw new Error(last);
}

// El mes de Guatemala (UTC-6), como el que guarda PUT ads/accounts en el OK del CEO.
const mesGT = () => new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 7);
// El OK del CEO a la pauta (accounts.ads.ok): vigente = de este mes y de este presupuesto (como okOf de tareas-cadena.js). Sin quién lo dio.
const okDe = (ads) => { const o = ads?.ok; if (!o) return null; return { vigente: o.month === mesGT() && (o.budget ?? null) === (ads.budget || null), month: String(o.month || ''), at: String(o.at || ''), budget: o.budget ?? null }; };

// La tabla de un cliente, cacheada en sources «ads-<slug>-tabla» por 6 horas (por rango de días). Si Windsor falla y hay una vieja, sale la vieja.
// Con el doc lleva profile: el alcance por cliente y la marca personal aplican también si alguien lo lee por /api/db/sources.
async function tablaDe(slug, a, days, cargar) {
  const id = `ads-${slug}-tabla`;
  let doc = null; try { doc = await db.get('sources', id); } catch { /* sin caché */ }
  const guardada = doc?.por_dias?.[String(days)];
  if (guardada?.tabla && Date.now() - Date.parse(guardada.at) < SEIS_HORAS) return { ...guardada.tabla, at: guardada.at, cache: true };
  const tablas = [], fallaron = [];
  for (const plat of Object.keys(CONN)) {
    const cuenta = digits(a.ads[plat]); if (!cuenta) continue;
    const rows = await cargar(plat);
    if (!rows) { fallaron.push(plat); continue; }
    tablas.push(agregarTabla(rows.filter((r) => r.cuenta === cuenta), { plat }));
  }
  if (!tablas.length) return guardada?.tabla ? { ...guardada.tabla, at: guardada.at, viejo: true } : { campanas: [], conjuntos: [], anuncios: [], tiene: { conv: false, ingresos: false }, error: 'Windsor no devolvió la tabla', parcial: fallaron };
  const tabla = juntarTablas(tablas), at = new Date().toISOString();
  if (!fallaron.length) { try { await db.upsert('sources', id, { profile: slug, por_dias: { ...(doc?.por_dias || {}), [String(days)]: { at, tabla } } }, 'sistema'); } catch { /* el caché no es lo importante */ } }
  return { ...tabla, at, ...(fallaron.length ? { parcial: fallaron } : {}) };
}

// El tablero: por cliente y plataforma, gasto, impresiones, clics, conversiones, CPA, CTR y ROAS, el gasto por día y la tabla por
// campaña, conjunto y anuncio. sc es el alcance de quien pregunta (scoper() en access.js; null = ve todo): solo entran los clientes que
// pasan sc.client(slug), y con ellos sus cuentas, sus filas de Windsor y su serie. Nada de otro cliente sale de aquí.
// costos: ¿quien pregunta ve costos (seesCosts de access.js: CEO, COO o quien edita Clientes)? Sin costos (el valor por defecto: cierra
// cerrado) el reporte sale SIN montos: sin gasto, presupuesto, ingresos, CPA ni CPC; quedan el CTR, el ROAS, los clics y las conversiones.
// tabla: false se salta la tabla por campaña (Windsor da el nivel que da; el resultado va a sources por 6 horas).
const slugDe = (a) => a.slug || String(a.id).replace(/^acc-/, '');
export async function report(days = 30, { sc = null, costos = false, tabla = true } = {}) {
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
    const slug = slugDe(a), c = { slug, name: a.name || slug.toUpperCase(), budget: a.ads.budget || null, ok: okDe(a.ads), plats: {}, series: {} };
    for (const plat of Object.keys(CONN)) {
      const id = digits(a.ads[plat]); if (!id || !rowsBy[plat]) continue;
      const rows = rowsBy[plat].filter((r) => digits(r.account_id) === id);
      const t = rows.reduce((s, r) => ({ spend: s.spend + n(r.spend), imp: s.imp + n(r.impressions), clicks: s.clicks + n(r.clicks), conv: s.conv + n(r.conversions), rev: s.rev + n(r.revenue) }), { spend: 0, imp: 0, clicks: 0, conv: 0, rev: 0 });
      // tiene: ¿Windsor mandó el campo? Un conv en 0 sin el campo es un dato que falta, no un cero.
      c.plats[plat] = { ...t, found: rows.length > 0, tiene: { conv: rows.some((r) => r.conversions != null), rev: rows.some((r) => r.revenue != null) }, ctr: t.imp ? Math.round((t.clicks / t.imp) * 10000) / 100 : null, cpa: t.conv ? Math.round((t.spend / t.conv) * 100) / 100 : null, roas: t.spend && t.rev ? Math.round((t.rev / t.spend) * 100) / 100 : null };
      for (const r of rows) if (r.date) c.series[r.date] = (c.series[r.date] || 0) + n(r.spend);
    }
    const all = Object.values(c.plats);
    c.total = all.reduce((s, p) => ({ spend: s.spend + p.spend, conv: s.conv + p.conv, rev: s.rev + p.rev, clicks: s.clicks + p.clicks, imp: s.imp + p.imp }), { spend: 0, conv: 0, rev: 0, clicks: 0, imp: 0 });
    const hay = all.filter((p) => p.found);
    c.total.tiene = { conv: hay.length > 0 && hay.every((p) => p.tiene.conv), rev: hay.length > 0 && hay.every((p) => p.tiene.rev) };
    c.total.cpa = c.total.conv ? Math.round((c.total.spend / c.total.conv) * 100) / 100 : null;
    c.total.roas = c.total.spend && c.total.rev ? Math.round((c.total.rev / c.total.spend) * 100) / 100 : null;
    c.series = Object.entries(c.series).sort(([x], [y]) => x.localeCompare(y)).map(([date, spend]) => ({ date, spend: Math.round(spend * 100) / 100 }));
    out.clients.push(c);
  }
  if (tabla) {
    const filas = {}; // plat → filas normalizadas de toda la plataforma (una lectura) o null si falló
    const cargar = async (plat) => {
      if (!(plat in filas)) {
        try { filas[plat] = await windsor(CONN[plat], preset, { lists: FIELDS_TABLA[CONN[plat]], tag: ':tabla', map: (r) => normalizarFila(r, plat) }); }
        catch (e) { filas[plat] = null; out.errors[`${plat}:tabla`] = e.message; }
      }
      return filas[plat];
    };
    for (const c of out.clients) { const a = accs.find((x) => slugDe(x) === c.slug); c.tabla = a ? await tablaDe(c.slug, a, days, cargar) : null; }
  }
  return costos ? { ...out, costos: true } : sinMontos(out);
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
