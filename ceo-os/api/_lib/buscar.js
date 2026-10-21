// Ventas › Prospectos › Buscar leads: scrapear prospectos con Apify (Google Maps o Instagram) y dejarlos en la bandeja
// de Prospectos (outbound), sin duplicados. Laya los filtra después desde la pantalla (puerta «lead»).
// Una búsqueda = un documento en «lead_searches»: { fuente, q, lugar, n, runId, datasetId, status, creados, repetidos, by, at }.
// Cada run lleva maxItems y maxTotalChargeUsd (el freno duro) para no gastar de más.
import * as db from './db.js';
import { guard, edits } from './access.js';
import { body } from './http.js';
import { apify, apifyOn } from './content.js';

const COLL = 'lead_searches';
const MAX = 50, TOPE_USD = 1;
const ACTORES = {
  maps: 'compass~crawler-google-places',
  instagram: 'apify~instagram-search-scraper',
};
const s = (v, n = 160) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
export const llave = (x) => [x.phone && String(x.phone).replace(/\D/g, '').slice(-8), x.ig && String(x.ig).toLowerCase(), x.name && s(x.name).toLowerCase()].filter(Boolean);

function entrada(fuente, q, lugar, n) {
  if (fuente === 'maps') return { searchStringsArray: [q], locationQuery: lugar || undefined, maxCrawledPlacesPerSearch: n, language: 'es', skipClosedPlaces: true };
  return { search: q, searchType: 'user', searchLimit: n };
}
// Un resultado de Apify → un prospecto.
export function prospecto(fuente, x) {
  if (fuente === 'maps') {
    const notas = [x.categoryName, x.totalScore ? `${x.totalScore}★ (${x.reviewsCount || 0} reseñas)` : '', x.address, x.website ? `Web: ${x.website}` : '', x.url ? `Maps: ${x.url}` : ''].filter(Boolean).join(' · ');
    return { name: s(x.title, 120), company: s(x.title, 120), phone: s(x.phone, 40), web: s(x.website, 200), notes: s(notas, 600), city: s(x.city, 60) };
  }
  const notas = [x.fullName && x.fullName !== x.username ? x.fullName : '', x.followersCount != null ? `${x.followersCount} seguidores` : '', s(x.biography, 300), x.externalUrl ? `Web: ${x.externalUrl}` : ''].filter(Boolean).join(' · ');
  return { name: s(x.fullName || x.username, 120), ig: s(x.username, 60), web: s(x.externalUrl, 200), notes: s(notas, 600) };
}

export function rutas(on) {
  const abre = async (req, res, write = false) => { const u = await guard(req, res, 'sales', { write }); if (!u) return null; if (write && !edits(u, 'sales')) { res.status(403).json({ error: 'Tu vista de Ventas no edita' }); return null; } return u; };

  on('GET', 'leads/buscar', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const l = (await db.list(COLL)).sort((a, z) => String(z.at).localeCompare(String(a.at))).slice(0, 12);
    res.json({ apify: apifyOn(), busquedas: l, max: MAX });
  });
  on('POST', 'leads/buscar', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    if (!apifyOn()) return res.status(424).json({ error: 'El scraping no está conectado: falta APIFY_TOKEN en Vercel.', code: 'NO_APIFY' });
    const b = body(req), fuente = b.fuente === 'instagram' ? 'instagram' : 'maps', q = s(b.q, 120), lugar = s(b.lugar, 120), n = Math.max(5, Math.min(MAX, Math.round(+b.n || 20)));
    if (!q) return res.status(400).json({ error: fuente === 'maps' ? 'Escribe qué buscar (por ejemplo: restaurantes)' : 'Escribe qué buscar (por ejemplo: cafeterías guatemala)' });
    let run;
    try { run = (await apify(`acts/${ACTORES[fuente]}/runs?maxItems=${n}&maxTotalChargeUsd=${TOPE_USD}`, { method: 'POST', body: JSON.stringify(entrada(fuente, q, lugar, n)) })).data; }
    catch (e) { return res.status(e.apifyStatus && e.apifyStatus < 500 ? 424 : 502).json({ error: e.message, code: e.code }); }
    const d = await db.create(COLL, { fuente, q, lugar, n, runId: run.id, datasetId: run.defaultDatasetId, status: 'corriendo', creados: 0, repetidos: 0, by: u.email, at: new Date().toISOString() }, u.email);
    res.json(d);
  });
  // Recoger: si el run terminó, los resultados entran a Prospectos (sin repetir lo que ya está en Ventas).
  on('POST', 'leads/buscar/:id/recoger', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const d = await db.get(COLL, String(req.params.id || '')); if (!d) return res.status(404).json({ error: 'Esa búsqueda no existe' });
    if (d.status !== 'corriendo') return res.json(d);
    let run;
    try { run = (await apify(`actor-runs/${d.runId}`)).data; } catch (e) { return res.status(502).json({ error: e.message, code: e.code }); }
    if (['RUNNING', 'READY'].includes(run.status)) return res.json({ ...d, apify: run.status });
    if (run.status !== 'SUCCEEDED') { const x = await db.upsert(COLL, d.id, { status: 'fallo', detalle: run.status }, u.email); return res.json(x); }
    let items = [];
    try { items = await apify(`datasets/${d.datasetId}/items?clean=1&limit=${d.n}`); } catch (e) { return res.status(502).json({ error: e.message, code: e.code }); }
    const hay = new Set((await db.list('leads')).flatMap(llave));
    let creados = 0, repetidos = 0;
    const fuenteTxt = `Búsqueda · ${d.q}${d.lugar ? ` · ${d.lugar}` : ''}`;
    for (const x of Array.isArray(items) ? items : []) {
      const p = prospecto(d.fuente, x); if (!p.name) continue;
      const k = llave(p); if (k.some((y) => hay.has(y))) { repetidos++; continue; }
      k.forEach((y) => hay.add(y));
      await db.create('leads', { ...p, stage: 'Prospecto', direction: 'out', source: fuenteTxt, search_id: d.id, owner_role: 'ventas', interest: 0, tags: [], activity: [{ at: new Date().toISOString(), who: 'Buscar leads', text: `Encontrado en ${d.fuente === 'maps' ? 'Google Maps' : 'Instagram'}: «${d.q}»` }] }, u.email);
      creados++;
    }
    res.json(await db.upsert(COLL, d.id, { status: 'listo', creados, repetidos, fin: new Date().toISOString() }, u.email));
  });
}
