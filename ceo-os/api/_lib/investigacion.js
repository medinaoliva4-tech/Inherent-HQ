// Fase 4 · Investigación (Marcas › <marca> › Investigación).
//   referentes → las cuentas a seguir de cada marca, en las 5 categorías de cr-fuentes y 4 redes. Viven donde ya vivían:
//                sources/cfg-<marca> (accounts con su «kind»; «Lo propio» en own) + lo del repo (onboarding y 99-referencias).
//   scraping   → el motor es content.js (arranca los runs de Apify y los recoge). Aquí: qué marcas corren (las activas:
//                con ficha de oferta, en las redes de su ficha), el webhook firmado y el botón «Actualizar ahora».
//   research   → al terminar una búsqueda, cada post nuevo de cada referente se guarda en Research (content, kind
//                «research») con el mismo id que usa guardar_research: sin duplicados. Con su resonancia: ×N el promedio
//                de SU cuenta (cr-fuentes) y su juicio de Laya pendiente.
import crypto from 'node:crypto';
import * as db from './db.js';
import * as content from './content.js';
import * as laya from './laya.js';
import { keepImg } from './mcp.js';
import { guard, scoper, edits } from './access.js';
import { readFile } from './gh.js';
import { tables, clean } from './parse.js';
import { body } from './http.js';
import { CAT_KEYS, POR_CAT, GANADOR, catDe, catNombre, cuenta, claveCuenta, clavePost, urlLimpia, urlDe, resonancia, RED_KEYS } from '../../public/js/referentes.js';
import { puertasDe, resumen, chipReferente, GATES_ID } from '../../public/js/laya.js';

const slugOk = (s) => /^[\w-]{2,60}$/.test(String(s || ''));
const rsId = (slug, url) => 'rs-' + crypto.createHash('sha256').update(slug + '|' + urlLimpia(url)).digest('hex').slice(0, 20);
const err = (status, msg, code) => Object.assign(new Error(msg), { status, ...(code ? { code } : {}) });
const MANDAN = ['ceo', 'coo']; // «Actualizar ahora»: solo el CEO y el COO (gasta crédito de Apify)

// ---------- quién ve qué ----------
async function puedeVer(u, slug) {
  if (!slugOk(slug)) return false;
  if (slug === 'personal' && u.role !== 'ceo') return false;
  const sc = await scoper(u);
  return !sc || slug === 'inherent' || sc.client(slug);
}
const completo = (u) => u.role === 'ceo' || !u.views || u.views.content !== 'resumen';

// ---------- la ficha de oferta: si la marca está activa y en qué redes publica ----------
// Sin ficha, el cliente está bloqueado (CLAUDE.md). Las redes salen del campo «Redes»; sin ese campo, todas.
export async function ficha(slug) {
  if (slug === 'inherent' || slug === 'personal') return { activa: true, redes: null };
  const f = await readFile(`clients/${slug}/00-onboarding/plan-contratado.md`);
  if (!f) return { activa: false, redes: null };
  const row = (tables(f.content)[0]?.rows || []).find((r) => /^redes$/i.test(clean(r[0])));
  const txt = row ? clean(row[1]).toLowerCase() : '';
  return { activa: true, redes: txt ? RED_KEYS.filter((k) => txt.includes(k)) : null };
}

// ---------- los referentes ----------
// { competencia:[…], 'referente-similar':[…], 'referente-aspiracional':[…], 'referente-crecimiento':[…], propia:[…] }
// Cada cuenta: { red, handle, url, source:'app'|'onboarding' }. Lo del onboarding (repo) no se quita desde la app.
export async function referentes(slug) {
  const p = (await content.profiles()).find((x) => x.slug === slug); if (!p) return null;
  const [full, c] = await Promise.all([content.profile(p), content.cfg(slug)]);
  const cats = Object.fromEntries(CAT_KEYS.map((k) => [k, []])), seen = new Set();
  const put = (cat, a, source) => { const k = claveCuenta(a); if (seen.has(k)) return; seen.add(k); cats[cat].push({ red: a.red, handle: a.handle, url: urlDe(a), source }); };
  for (const a of full.own) put('propia', a, a.source === 'onboarding' ? 'onboarding' : 'app');
  for (const a of full.competitors) put('competencia', a, 'onboarding');
  for (const a of c.accounts) put(catDe(a.kind), a, 'app');
  return cats;
}
export async function agregar(slug, cat, red, input, who) {
  if (!CAT_KEYS.includes(cat)) throw err(400, 'Categoría inválida');
  const a = cuenta(input, red); if (!a.ok) throw err(400, a.error);
  const cats = await referentes(slug); if (!cats) throw err(404, 'Esa marca no tiene perfil de contenido');
  const k = claveCuenta(a);
  for (const [kk, list] of Object.entries(cats)) if (list.some((x) => claveCuenta(x) === k)) throw err(409, `@${a.handle} ya está en ${catNombre(kk)}`);
  if (cats[cat].length >= POR_CAT) throw err(409, `${catNombre(cat)} ya tiene ${POR_CAT} cuentas. Quita una para agregar otra.`);
  const c = await content.cfg(slug), acc = { red: a.red, handle: a.handle, ...(a.red === 'youtube' || a.red === 'linkedin' ? { url: a.url } : {}) };
  await db.upsert('sources', 'cfg-' + slug, cat === 'propia' ? { profile: slug, own: [...c.own, acc] } : { profile: slug, accounts: [...c.accounts, { ...acc, kind: cat }] }, who);
  return referentes(slug);
}
export async function quitar(slug, cat, red, handle, who) {
  if (!CAT_KEYS.includes(cat)) throw err(400, 'Categoría inválida');
  const c = await content.cfg(slug), k = `${red}:${String(handle || '').toLowerCase()}`;
  const list = cat === 'propia' ? c.own : c.accounts, keep = list.filter((a) => !(claveCuenta(a) === k && (cat === 'propia' || catDe(a.kind) === cat)));
  if (keep.length === list.length) throw err(409, 'Esa cuenta viene del onboarding del cliente (el repo): se quita allá');
  await db.upsert('sources', 'cfg-' + slug, cat === 'propia' ? { profile: slug, own: keep } : { profile: slug, accounts: keep }, who);
  return referentes(slug);
}

// ---------- el estado de la búsqueda ----------
export async function estado(slug) {
  const d = await db.get('sources', 'scrape-' + slug);
  const running = Boolean(d?.runs?.length && !d.result);
  const err0 = d?.error && (!d.last?.at || String(d.error.at) >= String(d.last.at)) ? d.error : null;
  const ym = new Date().toISOString().slice(0, 7);
  return {
    status: running ? 'running' : d?.last ? 'done' : 'none', at: d?.at || null, last: d?.last || null, error: err0,
    runs: (d?.runs || []).map(({ red, status, handle }) => ({ red, status, ...(handle ? { handle } : {}) })), saltadas: d?.skipped || [],
    laya_error: d?.laya_error || null,
    mes: { usd: d?.month?.ym === ym ? +d.month.usd || 0 : 0, tope: await content.topeMarca().catch(() => content.TOPE_MES_USD) },
  };
}

// ---------- los posts de Research de una marca, con su chip de Laya ----------
export async function items(slug) {
  const [all, gates, js] = await Promise.all([db.list('content'), db.get('settings', GATES_ID).catch(() => null), db.list(laya.COLL)]);
  const mine = all.filter((x) => x.kind === 'research' && x.profile === slug);
  const puerta = puertasDe(gates).referente, ids = new Set(mine.map((x) => x.id)), by = {};
  for (const j of js) if (j.target?.coll === 'content' && ids.has(j.target.id)) (by[j.target.id] ||= []).push(j);
  return { puerta, items: mine.map((x) => ({ ...x, laya: chipReferente(resumen(by[x.id] || [], puerta), puerta) })) };
}

// ---------- al terminar una búsqueda: los posts nuevos a Research ----------
const def = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));
const isLocal = (x) => /^\/api\/media\/img-[a-f0-9]{24}$/.test(String(x || ''));
const num = (v) => (Number.isFinite(+v) && +v > 0 ? Math.round(+v) : undefined);
async function ingest(slug, doc, posts, who) {
  // De qué categoría es cada cuenta (lo del nicho/hashtags y los videos sueltos no entran a Research).
  const catOf = new Map();
  for (const a of doc.src?.own || []) catOf.set(claveCuenta(a), 'propia');
  for (const a of doc.src?.accounts || []) if (!catOf.has(claveCuenta(a))) catOf.set(claveCuenta(a), catDe(a.kind));
  const mine = (await db.list('content')).filter((x) => x.kind === 'research' && x.profile === slug);
  const byKey = new Map(mine.map((x) => [clavePost(x.url), x]));
  // Sin duplicados: la misma pieza con otro link (IG /p/ y /reel/) es la misma; dentro de la corrida, una vez.
  const seen = new Set(), batch = [];
  for (const x of posts || []) {
    if (!x?.url || !/^https:\/\//.test(x.url) || !catOf.has(claveCuenta(x))) continue;
    const k = clavePost(x.url); if (seen.has(k)) continue; seen.add(k); batch.push({ ...x, k });
  }
  // La base de cada cuenta: lo guardado + lo nuevo (lo nuevo trae las métricas al día).
  const base = {};
  for (const x of mine) if (x.handle) (base[claveCuenta(x)] ||= new Map()).set(clavePost(x.url), x);
  for (const x of batch) (base[claveCuenta(x)] ||= new Map()).set(x.k, x);
  const nuevos = [], act = [], imgs = [];
  for (const x of batch) {
    const r = resonancia(x, [...base[claveCuenta(x)].values()]), had = byKey.get(x.k);
    const metr = { views: num(x.views), likes: num(x.likes), comments: num(x.comments), shares: num(x.shares), x: r?.x, base: r?.base, ganador: r ? r.x >= GANADOR : undefined };
    if (had) {
      // Lo que subió Claude o el equipo no se pisa: solo se llena lo que le falta. Lo del scraping se pone al día.
      const patch = had.source === 'apify' ? def({ ...metr, thumb: isLocal(had.thumb) ? undefined : x.thumb || undefined }) : def({ red: had.red ? undefined : x.red, handle: had.handle ? undefined : x.handle, format: had.format ? undefined : x.format, at: had.at ? undefined : String(x.at || '').slice(0, 10), thumb: had.thumb ? undefined : x.thumb, views: had.views ? undefined : metr.views, likes: had.likes ? undefined : metr.likes });
      if (Object.keys(patch).length) { act.push({ id: had.id, patch }); if (patch.thumb && !isLocal(patch.thumb)) imgs.push(patch); }
      continue;
    }
    const d = def({ kind: 'research', profile: slug, url: x.url, red: x.red, handle: x.handle, tipo: catOf.get(claveCuenta(x)), format: x.format, ...metr,
      at: /^\d{4}-\d{2}-\d{2}/.test(String(x.at || '')) ? String(x.at).slice(0, 10) : undefined, text: x.text ? String(x.text).slice(0, 2000) : undefined,
      title: String(x.text || '').split('\n').map((l) => l.trim()).find(Boolean)?.slice(0, 80), thumb: x.thumb || undefined, slides: x.slides?.length ? x.slides : undefined, source: 'apify', scraped_at: doc.at });
    d.id = rsId(slug, x.url); nuevos.push(d); if (d.thumb) imgs.push(d);
  }
  // Las miniaturas del CDN caducan: se guardan en la base (6 a la vez, máx. 60 y 20 s; las demás se intentan la próxima vez).
  const t0 = Date.now(), queue = imgs.slice(0, 60);
  await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length && Date.now() - t0 < 20_000) { const o = queue.shift(); const l = await keepImg(o.thumb, who).catch(() => null); if (l) o.thumb = l; } }));
  for (const d of nuevos) { const { id, ...rest } = d; await db.upsert('content', id, rest, who); }
  for (const { id, patch } of act) await db.upsert('content', id, patch, who);
  // Cada post nuevo queda pendiente de Laya. Si falla, queda anotado (se ve en Investigación) y el cron diario lo reintenta.
  try { await laya.pedirPendientes('content', nuevos, who); if (doc.laya_error) await db.upsert('sources', 'scrape-' + slug, { laya_error: null }, who); }
  catch (e) { console.error('laya pendientes', e.message); await db.upsert('sources', 'scrape-' + slug, { laya_error: { msg: e.message, n: nuevos.length, at: new Date().toISOString() } }, who).catch(() => {}); }
  return { nuevos: nuevos.length, actualizados: act.length };
}
content.alTerminar(ingest);
export const settle = (slug, who) => content.settle(slug, who);


// ---------- Inspo con un link: el OS lee el post solo (sin créditos: el embed público de IG y el oEmbed de TikTok y YouTube) ----------
const ent = (t) => String(t || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
async function traer(u, ms = 12000) { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', 'Accept-Language': 'es,en;q=0.8' }, signal: AbortSignal.timeout(ms) }); if (!r.ok) throw new Error(String(r.status)); return r; }
export async function leerPost(url) {
  const u = String(url || '').trim();
  const ig = /instagram\.com\/(?:[\w.]+\/)?(?:p|reel|reels|tv)\/([\w-]+)/i.exec(u);
  try {
    if (ig) {
      const h = await (await traer(`https://www.instagram.com/p/${ig[1]}/embed/captioned/`)).text();
      const handle = (/class="UsernameText"[^>]*>([^<]+)</.exec(h) || /class="CaptionUsername"[^>]*>([^<]+)</.exec(h) || [])[1];
      const cap = /<div class="Caption">([\s\S]*?)<div class="CaptionComments/.exec(h)?.[1] || '';
      const text = ent(cap.replace(/<a class="CaptionUsername"[\s\S]*?<\/a>/, ''));
      const thumb = ent((/<img class="EmbeddedMediaImage"[^>]*src="([^"]+)"/.exec(h) || [])[1] || '');
      return { red: 'instagram', handle: handle?.trim(), text, thumb: /^https:\/\//.test(thumb) ? thumb : undefined, format: /\/(reel|reels|tv)\//i.test(u) ? 'reel' : undefined };
    }
    if (/tiktok\.com/i.test(u)) { const j = await (await traer(`https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`)).json(); return { red: 'tiktok', handle: j.author_unique_id || j.author_name, text: j.title || '', thumb: j.thumbnail_url, format: 'reel' }; }
    if (/youtube\.com|youtu\.be/i.test(u)) { const j = await (await traer(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}`)).json(); return { red: 'youtube', handle: String(j.author_url || '').split('/').pop()?.replace(/^@/, '') || j.author_name, text: j.title || '', thumb: j.thumbnail_url, format: /shorts\//.test(u) ? 'reel' : undefined }; }
    const h = await (await traer(u)).text(), meta = (k) => ent((new RegExp(`<meta[^>]+(?:property|name)="${k}"[^>]+content="([^"]*)"`, 'i').exec(h) || [])[1] || '');
    return { red: /linkedin/i.test(u) ? 'linkedin' : undefined, text: meta('og:description') || meta('description'), title: meta('og:title'), thumb: /^https:\/\//.test(meta('og:image')) ? meta('og:image') : undefined };
  } catch (e) { return { error: `No pude leer el post (${e.message}). Se guarda solo con el link.` }; }
}
export async function guardarInspo(slug, { url, why }, who) {
  const u = String(url || '').trim(); if (!/^https:\/\/\S+$/.test(u)) throw err(400, 'El link debe empezar con https://');
  const leido = await leerPost(u), id = rsId(slug, u), cur = await db.get('content', id);
  let thumb = leido.thumb; if (thumb) thumb = (await keepImg(thumb, who).catch(() => null)) || thumb;
  const handle = String(leido.handle || '').replace(/^@/, '').toLowerCase() || undefined;
  const text = leido.text ? leido.text.slice(0, 2000) : undefined;
  const title = (String(leido.text || leido.title || '').split('\n').map((l) => l.trim()).find(Boolean) || (handle ? '@' + handle : 'Inspo')).slice(0, 80);
  const doc = def({ kind: 'research', profile: slug, url: u, red: leido.red, handle, title: cur?.title || title, text: cur?.text || text, thumb: cur?.thumb || thumb, format: cur?.format || leido.format, tipo: cur?.tipo || 'agregado', manual: true, inspo: true, why: why ? { ...(cur?.why || {}), por_que: String(why).slice(0, 1000), inferido: true } : undefined });
  const d = await db.upsert('content', id, doc, who);
  if (!cur) await laya.pedirPendientes('content', [d], who).catch(() => {});
  return { item: d, aviso: leido.error || null };
}
// ---------- el cron ----------
// Lunes: arranca la búsqueda de cada marca activa (con ficha) en las redes de su ficha. Si Apify se queda sin crédito,
// no se le sigue pegando: las demás marcas quedan con el aviso.
export async function cronScrape(who = 'cron') {
  const done = [], saltadas = [], fallas = [];
  let corte = null;
  for (const p of await content.profiles()) {
    const f = await ficha(p.slug);
    if (!f.activa) { saltadas.push({ slug: p.slug, why: 'sin ficha de oferta' }); continue; }
    if (corte) { await db.upsert('sources', 'scrape-' + p.slug, { profile: p.slug, error: { code: corte.code, msg: corte.message, at: new Date().toISOString() } }, who); fallas.push({ slug: p.slug, why: corte.message }); continue; }
    try { const d = await content.scrape(p.slug, who, { redes: f.redes }); (d.already ? saltadas : done).push(d.already ? { slug: p.slug, why: 'ya estaba buscando' } : p.slug); }
    catch (e) {
      if (e.status === 400) { saltadas.push({ slug: p.slug, why: e.message }); continue; }
      fallas.push({ slug: p.slug, why: e.message }); if (['APIFY_CREDIT', 'APIFY_TOPE_CUENTA', 'APIFY_TOKEN'].includes(e.code)) corte = e;
    }
  }
  return { done, saltadas, fallas };
}
// Cada día: recoge lo que quedó corriendo (por si el webhook no llegó y nadie abrió la página) y vuelve a dejar
// pendientes de Laya los posts del scraping que se quedaron sin juicio ni pendiente.
export async function cronSettle(who = 'cron', { soloLaya = false } = {}) {
  const done = [], conLaya = [];
  for (const p of await content.profiles()) {
    if (!soloLaya) { try { const d = await settle(p.slug, who); if (d?.result && d?.last) done.push(p.slug); } catch (e) { console.error('cron settle', p.slug, e.message); } }
    try { const n = await pendientesFaltantes(p.slug, who); if (n) conLaya.push({ slug: p.slug, n }); } catch (e) { console.error('cron laya', p.slug, e.message); }
  }
  return { done, laya: conLaya };
}
// Los posts del scraping de una marca que no tienen ni juicio ni pendiente de Laya: se vuelven a pedir.
export async function pendientesFaltantes(slug, who) {
  const [all, jz] = await Promise.all([db.list('content'), db.list(laya.COLL)]);
  const con = new Set(jz.filter((j) => j.target?.coll === 'content').map((j) => j.target.id));
  const faltan = all.filter((x) => x.kind === 'research' && x.profile === slug && x.source === 'apify' && !con.has(x.id));
  const n = faltan.length ? await laya.pedirPendientes('content', faltan, who) : 0;
  const d = await db.get('sources', 'scrape-' + slug);
  if (d?.laya_error) await db.upsert('sources', 'scrape-' + slug, { laya_error: null }, who);
  return n;
}
// Lo que pasó con la búsqueda automática del lunes (también cuando no corrió): se guarda para mostrarlo en Investigación.
export async function anotarCron(r, who = 'cron') { await db.upsert('settings', 'cron_scrape', { at: new Date().toISOString(), skipped: null, done: [], saltadas: [], fallas: [], ...r }, who).catch(() => {}); return r; }
export const cronVisto = () => db.get('settings', 'cron_scrape').then((d) => (d ? { at: d.at, skipped: d.skipped || null, fallas: (d.fallas || []).length, done: (d.done || []).length } : null)).catch(() => null);

// ---------- las rutas (api/index.js las registra con inv.rutas(on)) ----------
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const apifyFail = (res, e) => res.status(e.status && e.status < 500 ? e.status : 424).json({ error: e.message, code: e.code || 'APIFY' });
export function rutas(on) {
  async function abre(req, res, slug, write) {
    const u = await guard(req, res, 'content', { write }); if (!u) return null;
    if (!completo(u)) { res.status(403).json({ error: 'Tu vista de Contenido es «resumen»: solo el rendimiento' }); return null; }
    if (!(await puedeVer(u, slug))) { res.status(400).json({ error: 'Marca inválida' }); return null; }
    return u;
  }
  on('GET', 'investigacion', async (req, res) => {
    const slug = String(req.query.profile || ''), u = await abre(req, res, slug); if (!u) return;
    const cats = await referentes(slug); if (!cats) return res.status(404).json({ error: 'Esa marca no tiene perfil de contenido' });
    const [f, st, it] = await Promise.all([ficha(slug), estado(slug), items(slug)]);
    res.json({ apify: content.apifyOn(), cron: await cronVisto(), puede: { actualizar: MANDAN.includes(u.role), editar: edits(u, 'content') }, ficha: f, estado: st, referentes: cats, puerta: it.puerta, items: it.items });
  });
  on('POST', 'investigacion/inspo', async (req, res) => {
    const b = body(req), slug = String(b.profile || ''), u = await abre(req, res, slug, true); if (!u) return;
    try { res.json(await guardarInspo(slug, { url: b.url, why: b.why }, u.email)); }
    catch (e) { if (e.status) return res.status(e.status).json({ error: e.message }); throw e; }
  });
  on('POST', 'investigacion/referentes', async (req, res) => {
    const b = body(req), slug = String(b.profile || ''), u = await abre(req, res, slug, true); if (!u) return;
    try { res.json({ referentes: await agregar(slug, String(b.cat || ''), String(b.red || 'instagram'), b.cuenta, u.email) }); }
    catch (e) { if (e.status) return res.status(e.status).json({ error: e.message }); throw e; }
  });
  on('DELETE', 'investigacion/referentes', async (req, res) => {
    const slug = String(req.query.profile || ''), u = await abre(req, res, slug, true); if (!u) return;
    try { res.json({ referentes: await quitar(slug, String(req.query.cat || ''), String(req.query.red || ''), String(req.query.handle || ''), u.email) }); }
    catch (e) { if (e.status) return res.status(e.status).json({ error: e.message }); throw e; }
  });
  // «Actualizar ahora»: lo mismo que el cron, para una marca. Solo el CEO y el COO.
  on('POST', 'investigacion/actualizar', async (req, res) => {
    const slug = String(body(req).profile || ''), u = await abre(req, res, slug); if (!u) return;
    if (!MANDAN.includes(u.role)) return res.status(403).json({ error: 'Solo el CEO y el COO actualizan la investigación' });
    if (!content.apifyOn()) return res.status(424).json({ error: 'El scraping no está conectado: falta APIFY_TOKEN en Vercel.', code: 'NO_APIFY' });
    const f = await ficha(slug); if (!f.activa) return res.status(409).json({ error: 'Esta marca no tiene ficha de oferta: su investigación está bloqueada.' });
    try { const d = await content.scrape(slug, u.email, { redes: f.redes }); res.json({ ya: Boolean(d.already), estado: await estado(slug) }); }
    catch (e) { if (e.status === 400 || /^APIFY|^NO_APIFY/.test(e.code || '')) return apifyFail(res, e); throw e; }
  });
  // La página abierta recoge lo que esté corriendo (respaldo del webhook). No gasta crédito: solo lee.
  on('POST', 'investigacion/recoger', async (req, res) => {
    const slug = String(body(req).profile || ''), u = await abre(req, res, slug); if (!u) return;
    let warn = null;
    if (content.apifyOn()) { try { await settle(slug, u.email); } catch (e) { warn = e.message; } }
    res.json({ estado: await estado(slug), warn });
  });
  // «Usar como formato»: la pieza queda marcada para replicar en Ideas y el calendario.
  on('PUT', 'investigacion/replicar', async (req, res) => {
    const b = body(req), slug = String(b.profile || ''), u = await abre(req, res, slug, true); if (!u) return;
    const d = /^[\w.@+-]{3,120}$/.test(String(b.id || '')) ? await db.get('content', String(b.id)) : null;
    if (!d || d.kind !== 'research' || d.profile !== slug) return res.status(404).json({ error: 'Ese post no está en la investigación de esta marca' });
    const si = Boolean(b.replicar);
    res.json(await db.upsert('content', d.id, { replicar: si, replicar_at: si ? new Date().toISOString() : null, replicar_by: si ? u.email : null }, u.email));
  });
  // El webhook de Apify (uno por run). Firmado por marca; el cuerpo no se cree: settle() vuelve a preguntarle a Apify.
  on('POST', 'investigacion/apify', async (req, res) => {
    const slug = String(req.query.s || ''), t = String(req.query.t || '');
    if (!process.env.CRON_SECRET || !slugOk(slug) || !safeEq(t, content.hookToken(slug))) return res.status(401).json({ error: 'No autorizado' });
    const b = body(req), runId = String(b?.eventData?.actorRunId || b?.resource?.id || '');
    const doc = await db.get('sources', 'scrape-' + slug);
    if (!runId || !doc?.runs?.some((r) => r.runId === runId)) return res.json({ ok: true, ignorado: true });
    try { const d = await settle(slug, 'apify'); res.json({ ok: true, listo: Boolean(d?.result) }); }
    catch (e) { console.error('webhook apify', slug, e.message); res.json({ ok: false, error: e.message }); }
  });
}
