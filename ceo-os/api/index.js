// Una sola función serverless para toda la API (vercel.json reescribe /api/* → aquí).
import * as db from './_lib/db.js';
import * as session from './_lib/session.js';
import * as google from './_lib/google.js';
import { guard, guardAny, areasFor, COLLS, READ_ALSO, WRITE_ALSO, canWrite, userFor, domain } from './_lib/access.js';
import { readFile, listDir, repoSource } from './_lib/gh.js';
import * as content from './_lib/content.js';
import * as zernio from './_lib/zernio.js';
import * as mcp from './_lib/mcp.js';
import * as oauth from './_lib/oauth.js';
import * as flow from './_lib/flow.js';
import * as ads from './_lib/ads.js';
import * as refs from './_lib/refs.js';
import * as leads from './_lib/leads.js';
import { blockersOf } from '../public/js/cycle.js';
import { parseEconomia, parseOperacion, parsePlanContratado } from './_lib/parse.js';
import { body, fail } from './_lib/http.js';

const routes = [];
const on = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });

// ---------- auth ----------
on('GET', 'auth/google', async (req, res) => {
  const state = google.newState(), portal = req.query.portal === '1';
  session.addCookie(res, `ceoos_state=${session.sign({ state, portal, exp: Date.now() + 10 * 60_000 })}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=600`);
  res.writeHead(302, { Location: google.authUrl(state, portal) }).end();
});
on('GET', 'auth/callback', async (req, res) => {
  const st = session.unsign(session.cookie(req, 'ceoos_state'));
  session.addCookie(res, 'ceoos_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0');
  const back = (err, detail) => res.writeHead(302, { Location: '/' + (err ? `?error=${err}${detail ? '&detail=' + encodeURIComponent(String(detail).slice(0, 160)) : ''}` : '') }).end();
  if (req.query.error) return back('google', req.query.error);
  if (!st || st.exp < Date.now() || st.state !== req.query.state || !req.query.code) return back('estado');
  let p;
  try { p = await google.finishLogin(String(req.query.code), Boolean(st.portal)); }
  catch (e) { console.error('login google', e); return back('google', e.message); }
  if (!p) return back('dominio');
  try {
    // Correos de afuera: solo los que el CEO aprobó (clientes del portal o colaboradores externos).
    if (!p.internal) { const d = await db.get('team', p.email); if (!d?.external || d.active === false) return back('noaprobado'); }
    const u = await userFor(p.email);
    if (!u.active) return back('inactivo');
    await db.upsert('team', p.email, { email: p.email, name: p.name, picture: p.picture, google: { calendar: p.scopes.some((s) => s.includes('calendar')), drive: p.scopes.some((s) => s.includes('drive')), gmail: p.scopes.some((s) => s.includes('gmail.send')) }, last_login: new Date().toISOString() }, p.email);
    session.issue(req, res, { email: p.email });
  } catch (e) { console.error('login db', e); return back('servidor', e.code === 'NO_DB' ? 'base de datos' : e.message); }
  console.log(JSON.stringify({ evt: 'login', email: p.email }));
  back();
});
on('POST', 'auth/logout', async (req, res) => { session.clear(res); res.json({ ok: true }); });
// Solo en local: entrar sin Google para probar. Nunca existe en Vercel.
on('GET', 'auth/dev', async (req, res) => {
  if (process.env.VERCEL || process.env.DEV_LOGIN !== '1') return res.status(404).end();
  const email = String(req.query.email || `ceo@${domain()}`).toLowerCase();
  await db.upsert('team', email, { email, name: req.query.name || email.split('@')[0] }, email);
  session.issue(req, res, { email });
  res.writeHead(302, { Location: '/' }).end();
});
on('GET', 'me', async (req, res) => {
  const u = await guard(req, res, undefined, { client: true }); if (!u) return;
  const t = await db.get('team', u.email);
  res.json({ ...u, areas: areasFor(u.role, u.roles), google: t?.google || {}, birthday: t?.birthday || '', phone: t?.phone || '', bio: t?.bio || '', since: t?._meta?.created_at || '', mcp: Boolean(t?.mcp_hash) || Boolean(t?.mcp_grants?.length), mcp_apps: (t?.mcp_grants || []).map(({ g, name, at }) => ({ g, name, at })) });
});
// Cada quien cambia su propia foto (una imagen chica que el navegador ya recortó).
on('PUT', 'me/photo', async (req, res) => {
  const u = await guard(req, res, undefined, { client: true }); if (!u) return;
  const photo = String(body(req).photo || '');
  if (photo && (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > 300_000)) return res.status(400).json({ error: 'La foto debe ser una imagen de menos de 200 KB' });
  await db.upsert('team', u.email, { photo: photo || null }, u.email);
  res.json({ ok: true });
});
// Mi perfil: cada quien edita su cumpleaños (día y mes, sin año), su teléfono y unas líneas sobre sí.
on('PUT', 'me/profile', async (req, res) => {
  const u = await guard(req, res, undefined, { client: true }); if (!u) return;
  const b = body(req), bd = String(b.birthday || '');
  if (bd && !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(bd)) return res.status(400).json({ error: 'Cumpleaños inválido' });
  await db.upsert('team', u.email, { birthday: bd || null, phone: String(b.phone || '').slice(0, 30), bio: String(b.bio || '').slice(0, 600) }, u.email);
  res.json({ ok: true });
});
on('GET', 'status', async (req, res) => {
  // Público y sin datos: solo dice qué falta configurar, para que el login lo explique.
  let dbok = false; try { dbok = await db.ping(); } catch {}
  res.json({ google: google.configured(), portal: Boolean(process.env.GOOGLE_PORTAL_CLIENT_ID?.trim() && process.env.GOOGLE_PORTAL_CLIENT_SECRET?.trim()), db: dbok, repo: repoSource() !== 'none', domain: domain() });
});

// ---------- documentos ----------
async function collGuard(req, res, write) {
  const coll = req.params.coll;
  const area = COLLS[coll];
  if (!area) { res.status(404).json({ error: 'Colección desconocida' }); return null; }
  const u = await guardAny(req, res, [area, ...((write ? WRITE_ALSO : READ_ALSO)[coll] || [])]); if (!u) return null;
  if (write && !canWrite(u.role, coll)) { res.status(403).json({ error: 'Solo el CEO puede cambiar esto' }); return null; }
  return u;
}
// Tareas: «solo yo» la ven quien la creó y a quien se asignó; «ciertas personas» suma a las elegidas.
// Una tarea «Personal» la ve solo quien la creó (aunque su visibilidad diga «todos»).
const seesTask = (u, t) => {
  if (t?.tipo === 'Personal') return String(t._meta?.created_by || t.assignee || '').toLowerCase() === u.email;
  const vis = t?.visibility || 'all'; if (vis === 'all') return true;
  const mine = [t._meta?.created_by, t.assignee, ...(vis === 'people' ? [t.accountable, ...(Array.isArray(t.viewers) ? t.viewers : [])] : [])];
  return mine.filter(Boolean).map((x) => String(x).toLowerCase()).includes(u.email);
};
const visible = (u, coll, d) => coll !== 'tasks' || seesTask(u, d);
// El tipo de una tarea es uno de cuatro; el SOP es el id de un doc de la Library o un link https.
const TASK_TIPOS = ['Delivery', 'Comercial', 'Interna', 'Personal'];
const cleanTask = (b) => {
  const o = { ...b };
  if (!TASK_TIPOS.includes(o.tipo)) delete o.tipo;
  const sop = String(o.sop || '').trim();
  if (!sop || (!/^https?:\/\/\S+$/i.test(sop) && !/^[\w.@+-]{1,120}$/.test(sop))) delete o.sop; else o.sop = sop.slice(0, 500);
  return o;
};
on('GET', 'db/:coll', async (req, res) => { const u = await collGuard(req, res); if (u) res.json({ items: (await db.list(req.params.coll)).filter((d) => visible(u, req.params.coll, d)) }); });
on('GET', 'db/:coll/:id', async (req, res) => {
  const u = await collGuard(req, res); if (!u) return;
  const d = await db.get(req.params.coll, req.params.id);
  d && visible(u, req.params.coll, d) ? res.json(d) : res.status(404).json({ error: 'No existe' });
});
// Una persona con correo que no es del dominio queda como «aprobada de afuera» (puede entrar con Google).
const markExternal = (coll, b, id) => { if (coll === 'team') { const e = String(b.email || id || '').toLowerCase(); if (e.includes('@') && !e.endsWith('@' + domain())) b.external = true; else delete b.external; if (b.role === 'client' && !b.client_slug) throw Object.assign(new Error('Falta el cliente del portal'), { status: 400 }); } return b; };
on('POST', 'db/:coll', async (req, res) => {
  const u = await collGuard(req, res, true); if (!u) return;
  let b = body(req);
  try { b = markExternal(req.params.coll, b, b.id); } catch (e) { return res.status(400).json({ error: e.message }); }
  if (JSON.stringify(b).length > 400_000) return res.status(413).json({ error: 'Demasiado grande' });
  if (req.params.coll === 'leads') {
    // El CRM: candado de siguiente paso, historial que solo se agrega y nada duplicado por WhatsApp, correo o IG.
    b = leads.normalize(b); b.activity = leads.mergeActivity([], b.activity);
    const bad = leads.check(b); if (bad) return res.status(400).json({ error: bad });
    const dup = leads.findDup(await db.list('leads'), b); if (dup) return res.status(409).json({ error: `Ya existe un lead con ese WhatsApp, correo o cuenta: ${dup.name}`, id: dup.id });
  }
  if (req.params.coll === 'lead_sources') b = leads.cleanSource(b);
  if (req.params.coll === 'tasks') b = cleanTask(b);
  const id = typeof b.id === 'string' && /^[\w.@+-]{3,120}$/.test(b.id) ? b.id.toLowerCase() : undefined;
  try { res.json(await db.create(req.params.coll, b, u.email, id)); }
  catch (e) { if (/duplicate|unique/i.test(e.message)) return res.status(409).json({ error: 'Ya existe' }); throw e; }
});
on('PUT', 'db/:coll/:id', async (req, res) => {
  const u = await collGuard(req, res, true); if (!u) return;
  let b = body(req);
  try { b = markExternal(req.params.coll, b, req.params.id); } catch (e) { return res.status(400).json({ error: e.message }); }
  if (JSON.stringify(b).length > 400_000) return res.status(413).json({ error: 'Demasiado grande' });
  if (req.params.coll === 'leads') {
    const cur = await db.get('leads', req.params.id); if (!cur) return res.status(404).json({ error: 'No existe' });
    b = leads.normalize(b); b.activity = leads.mergeActivity(cur.activity, b.activity);
    const bad = leads.check(b); if (bad) return res.status(400).json({ error: bad });
  }
  if (req.params.coll === 'lead_sources') { const cur = await db.get('lead_sources', req.params.id); b = { ...leads.cleanSource({ ...cur, ...b, key: cur?.key || b.key }), log: cur?.log || [], n: cur?.n || null, v: b.v }; }
  if (req.params.coll === 'tasks') {
    b = cleanTask(b);
    const cur = await db.get('tasks', req.params.id);
    if (!visible(u, 'tasks', cur)) return res.status(404).json({ error: 'No existe' });
    // Una tarea con dependencias sin terminar no avanza (el CEO y el COO pueden forzarlo).
    if (b.status && b.status !== 'Por empezar' && b.status !== cur?.status && !['ceo', 'coo'].includes(u.role)) {
      const all = (b.depends_on || cur?.depends_on || []).length ? await db.list('tasks') : [];
      const wait = blockersOf({ depends_on: b.depends_on || cur?.depends_on }, all);
      if (wait.length) return res.status(423).json({ error: `Bloqueada: primero tiene que estar hecho «${wait.map((x) => x.title).join('», «')}»` });
    }
  }
  const d = await db.update(req.params.coll, req.params.id, b, Number(b.v), u.email);
  d ? res.json(d) : res.status(409).json({ error: 'Alguien más cambió esto. Recarga para ver la última versión.' });
});
on('DELETE', 'db/:coll/:id', async (req, res) => {
  const u = await collGuard(req, res, true); if (!u) return;
  if (req.params.coll === 'tasks' && !visible(u, 'tasks', await db.get('tasks', req.params.id))) return res.status(404).json({ error: 'No existe' });
  res.json({ ok: await db.remove(req.params.coll, req.params.id, u.email) });
});

// ---------- del repo: solo economía y clientes ----------
on('GET', 'repo/economia', async (req, res) => {
  const u = await guard(req, res, 'finanzas'); if (!u) return;
  const [eco, op] = await Promise.all([readFile('inherent/06-ECONOMIA.md'), readFile('inherent/05-OPERACION.md')]);
  if (!eco) return res.status(502).json({ error: 'No pude leer 06-ECONOMIA.md del repo. Vuelve a publicar la app (el build copia el repo).', code: 'NO_REPO' });
  res.json({ ...parseEconomia(eco.content), ...(op ? parseOperacion(op.content) : { roles: [], slots: [] }) });
});
on('GET', 'repo/precios', async (req, res) => {
  // Para Sales: precios y volumen, sin costos (salvo al CEO).
  const u = await guard(req, res, 'sales'); if (!u) return;
  const eco = await readFile('inherent/06-ECONOMIA.md');
  if (!eco) return res.status(502).json({ error: 'No pude leer los planes del repo', code: 'NO_REPO' });
  const { plans, tipoCambio } = parseEconomia(eco.content);
  res.json({ tipoCambio, plans: plans.map((p) => ({ id: p.id, name: p.name, precio: p.precio, precioUsd: p.precioUsd, volumen: p.volumen, promete: p.promete, hace: p.hace, incluye: p.incluye, ...(u.role === 'ceo' ? { costo: p.costo, margen: p.margen } : {}) })) });
});
on('GET', 'repo/clients', async (req, res) => {
  const u = await guardAny(req, res, ['operations', 'clients', 'library', 'work']); if (!u) return;
  const dirs = (await listDir('clients')).filter((d) => d.type === 'dir' && !d.name.startsWith('_'));
  const clients = await Promise.all(dirs.map(async (d) => {
    const f = await readFile(`clients/${d.name}/00-onboarding/plan-contratado.md`);
    return f ? { slug: d.name, hasPlan: true, ...parsePlanContratado(f.content, u.role) } : { slug: d.name, hasPlan: false };
  }));
  res.json({ clients });
});


// ---------- Content: lee el folder del perfil en el repo + scrape semanal con Apify ----------
const slugOk = (s) => /^[\w-]{2,60}$/.test(String(s || ''));
on('GET', 'repo/content', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const list = await content.profiles();
  const p = list.find((x) => x.slug === req.query.profile) || list[0];
  res.json({ profiles: list.map(({ slug, name }) => ({ slug, name })), profile: await content.profile(p), cfg: await content.cfg(p.slug), apify: content.apifyOn() });
});
on('PUT', 'content/cfg', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const b = body(req); if (!slugOk(b.profile)) return res.status(400).json({ error: 'Perfil inválido' });
  const c = content.cleanCfg(b);
  await db.upsert('sources', 'cfg-' + b.profile, { profile: b.profile, ...c }, u.email);
  res.json(c);
});
on('POST', 'content/scrape', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const slug = String(body(req).profile || ''); if (!slugOk(slug)) return res.status(400).json({ error: 'Perfil inválido' });
  try { const d = await content.scrape(slug, u.email); res.json({ week: d.week, at: d.at }); }
  catch (e) { if (e.status === 400) return res.status(400).json({ error: e.message }); throw e; }
});
on('GET', 'content/week', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const slug = String(req.query.profile || ''); if (!slugOk(slug)) return res.status(400).json({ error: 'Perfil inválido' });
  let doc = await db.get('sources', 'scrape-' + slug), warn = null;
  if (doc?.runs?.length && !doc.result && content.apifyOn()) { try { doc = await content.settle(slug, u.email); } catch (e) { warn = e.message; } }
  const an = await db.get('sources', 'analytics-' + slug);
  res.json({ apify: content.apifyOn(), week: doc?.week || null, at: doc?.at || null, status: !doc?.runs?.length ? 'none' : doc.result ? 'done' : 'running', runs: (doc?.runs || []).map(({ red, status }) => ({ red, status })), result: doc?.result || null, analytics: an?.history || [], warn });
});
// Referencias por pilar: videos que pega el equipo → Apify busca similares → se desglosan con Claude.
on('GET', 'content/refs', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const slug = String(req.query.profile || ''); if (!slugOk(slug)) return res.status(400).json({ error: 'Perfil inválido' });
  let doc = await refs.get(slug), warn = null;
  if (doc.runs?.length && !doc.result && refs.on()) { try { doc = await refs.settle(slug, u.email); } catch (e) { warn = e.message; } }
  res.json({ apify: refs.on(), videos: doc.videos || {}, breakdown: doc.breakdown || {}, result: doc.result || null, status: !doc.runs ? 'none' : doc.result ? 'done' : 'running', phase: doc.phase || 0, at: doc.at || null, warn });
});
on('PUT', 'content/refs', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const b = body(req); if (!slugOk(b.profile)) return res.status(400).json({ error: 'Perfil inválido' });
  const d = await refs.saveVideos(b.profile, b.videos, u.email); res.json({ videos: d.videos });
});
on('POST', 'content/refs/scrape', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const slug = String(body(req).profile || ''); if (!slugOk(slug)) return res.status(400).json({ error: 'Perfil inválido' });
  try { await refs.start(slug, u.email); res.json({ ok: true }); }
  catch (e) { if (e.status || e.code) return res.status(e.status || 503).json({ error: e.message }); throw e; }
});
on('PUT', 'content/refs/breakdown', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const b = body(req); if (!slugOk(b.profile) || !b.pillar) return res.status(400).json({ error: 'Falta el perfil o el pilar' });
  const d = await refs.saveBreakdown(b.profile, b.pillar, b.items, u.email); res.json({ breakdown: d.breakdown });
});

// El link directo de un reel de Instagram para verlo dentro del OS (sale del embed público; caduca, por eso se pide al abrir).
on('GET', 'content/video', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const m = String(req.query.url || '').match(/^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/([\w-]{5,40})/);
  if (!m) return res.status(400).json({ error: 'Solo reels de Instagram' });
  try {
    const r = await fetch(`https://www.instagram.com/p/${m[1]}/embed/captioned/`, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/141', accept: '*/*' }, signal: AbortSignal.timeout(8000) });
    const t = await r.text(), v = t.match(/video_url\\*"\s*:\s*\\*"(https:[^"]+?)\\*"/);
    const src = v ? v[1].replace(/\\+\//g, '/').replace(/\\+u0026/g, '&').replace(/\\+/g, '') : '';
    res.json({ src: /^https:\/\/[\w.-]+\.(cdninstagram\.com|fbcdn\.net)\//.test(src) ? src : '' });
  } catch { res.json({ src: '' }); }
});
// Respaldo: si el navegador no puede bajar el video directo del CDN, el OS lo pasa en pedazos (Range) de hasta 3 MB.
on('GET', 'content/stream', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const src = String(req.query.u || '');
  if (!/^https:\/\/[\w.-]+\.(cdninstagram\.com|fbcdn\.net)\/[^\s]+$/.test(src)) return res.status(400).json({ error: 'Link inválido' });
  const m = String(req.headers.range || 'bytes=0-').match(/bytes=(\d+)-(\d*)/), a = m ? +m[1] : 0, b = Math.min(m && m[2] ? +m[2] : Infinity, a + 3_000_000 - 1);
  try {
    const r = await fetch(src, { headers: { range: `bytes=${a}-${b}`, 'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/141' }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return res.status(502).json({ error: 'Instagram no lo entregó' });
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', r.headers.get('content-type') || 'video/mp4'); res.setHeader('Accept-Ranges', 'bytes'); res.setHeader('Cache-Control', 'private, max-age=3600');
    const cr = r.headers.get('content-range'); if (cr) res.setHeader('Content-Range', cr);
    res.setHeader('Content-Length', String(buf.length));
    res.status(r.status === 206 ? 206 : 200).end(buf);
  } catch { res.status(502).json({ error: 'Instagram no lo entregó' }); }
});
// Las imágenes de Research que guardó el conector (las del CDN de Instagram caducan en días).
on('GET', 'media/:id', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const m = /^img-[a-f0-9]{24}$/.test(req.params.id) ? await db.get('media', req.params.id) : null;
  if (!m?.b64) return res.status(404).json({ error: 'No existe' });
  res.setHeader('Content-Type', m.mime || 'image/jpeg'); res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.status(200).end(Buffer.from(m.b64, 'base64'));
});
// Conexiones de un perfil: las carpetas de Drive (guiones y «Por postear») y los pilares.
// Lo puede leer todo el equipo: el editor de video necesita llegar a los guiones y a la carpeta de entregas.
on('GET', 'content/cfg', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const slug = String(req.query.profile || ''); if (!slugOk(slug)) return res.status(400).json({ error: 'Perfil inválido' });
  res.json(await content.cfg(slug));
});
on('PUT', 'content/connect', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const b = body(req); if (!slugOk(b.profile)) return res.status(400).json({ error: 'Perfil inválido' });
  const patch = { profile: b.profile };
  if ('postear_drive' in b) {
    const url = String(b.postear_drive || '');
    if (url && !/^https:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?folders\/[-\w]{20,}/.test(url)) return res.status(400).json({ error: 'Pega el link de una carpeta de Google Drive' });
    patch.postear_drive = url;
  }
  if ('guiones_drive' in b) {
    const url = String(b.guiones_drive || '');
    if (url && !/^https:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?folders\/[-\w]{20,}/.test(url)) return res.status(400).json({ error: 'Pega el link de una carpeta de Google Drive' });
    patch.guiones_drive = url;
  }
  if ('pillars' in b) patch.pillars = (Array.isArray(b.pillars) ? b.pillars : []).map((x) => ({ name: String(x?.name || '').trim().slice(0, 40), color: /^#[0-9a-f]{6}$/i.test(x?.color) ? x.color : '#8f877b' })).filter((x) => x.name).slice(0, 8);
  if ('ig_account' in b) patch.ig_account = String(b.ig_account || '').replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40);
  await db.upsert('sources', 'cfg-' + b.profile, patch, u.email);
  res.json({ ok: true, ...patch });
});
// Analytics de Instagram con Windsor.ai (las cuentas se conectan en Windsor; aquí solo se leen).
on('GET', 'analytics/instagram', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  if (!content.windsorOn()) return res.json({ connected: false });
  const p = (await content.profiles()).find((x) => x.slug === req.query.profile); if (!p) return res.status(400).json({ error: 'Perfil inválido' });
  // La cuenta elegida en la app manda; si no hay, las de LINKS.md del repo.
  const picked = (await content.cfg(p.slug)).ig_account;
  const handles = picked ? [picked] : (await content.profile(p)).own.filter((a) => a.red === 'instagram').map((a) => a.handle);
  try { res.json({ connected: true, handles, ...(await content.instagram(handles, Number(req.query.days) || 30, p.slug === 'personal' ? '' : p.slug)) }); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Ideas de reels y carruseles: las genera cada persona en SU cuenta de Claude (sus créditos)
// y las pega aquí. La app solo guarda y limpia lo que llega.
const cleanIdeas = (list) => (Array.isArray(list) ? list : []).slice(0, 30).map((x, i) => ({
  id: `${Date.now().toString(36)}-${i}`, format: /carrusel/i.test(x?.format) ? 'Carrusel' : 'Reel',
  title: String(x?.title || '').slice(0, 200), hook: String(x?.hook || '').slice(0, 300), pillar: String(x?.pillar || '').slice(0, 60),
  outline: (Array.isArray(x?.outline) ? x.outline : []).slice(0, 12).map((o) => String(o).slice(0, 300)), why: String(x?.why || '').slice(0, 400),
  inspired_by: /^https:\/\/\S+$/.test(String(x?.inspired_by || '')) ? String(x.inspired_by).slice(0, 400) : '',
})).filter((x) => x.title);
on('GET', 'content/ideas', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const slug = String(req.query.profile || ''); if (!slugOk(slug)) return res.status(400).json({ error: 'Perfil inválido' });
  const d = await db.get('sources', 'ideas-' + slug);
  res.json({ at: d?.at || null, week: d?.week || null, ideas: d?.ideas || [] });
});
on('PUT', 'content/ideas', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const b = body(req); const slug = String(b.profile || ''); if (!slugOk(slug)) return res.status(400).json({ error: 'Perfil inválido' });
  const list = cleanIdeas(b.ideas); if (!list.length) return res.status(400).json({ error: 'No encontré ideas en lo que pegaste' });
  const doc = { profile: slug, at: new Date().toISOString(), week: String(b.week || '').slice(0, 12) || null, ideas: list };
  await db.upsert('sources', 'ideas-' + slug, doc, u.email);
  res.json(doc);
});
// Bandeja de comunidad (Zernio): comentarios y DMs de las cuentas propias del perfil.
on('GET', 'community/inbox', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  if (!zernio.zernioOn()) return res.json({ connected: false });
  const p = (await content.profiles()).find((x) => x.slug === req.query.profile); if (!p) return res.status(400).json({ error: 'Perfil inválido' });
  const handles = (await content.profile(p)).own.map((a) => a.handle);
  if (!handles.length) return res.json({ connected: true, noAccounts: true });
  try { res.json({ connected: true, handles, ...(await zernio.inbox(handles)) }); } catch (e) { res.status(502).json({ error: e.message }); }
});

// Vercel Cron, una vez a la semana (lunes): scrapea los perfiles con «Scrape semanal».
on('GET', 'cron/scrape', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado' });
  if (!content.apifyOn()) return res.json({ skipped: 'sin APIFY_TOKEN' });
  const done = [];
  for (const p of await content.profiles()) {
    if (!(await content.cfg(p.slug)).auto) continue;
    try { await content.scrape(p.slug, 'cron'); done.push(p.slug); } catch (e) { console.error('cron scrape', p.slug, e.message); }
  }
  res.json({ done });
});
// Cada lunes también cierra lo que quedó corriendo (por si nadie abrió Content).
on('GET', 'cron/settle', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado' });
  const done = [];
  for (const p of await content.profiles()) { try { const d = await content.settle(p.slug, 'cron'); if (d?.result) done.push(p.slug); } catch {} }
  res.json({ done });
});

// ---------- Clientes: su perfil del repo ----------
on('GET', 'repo/client/:slug', async (req, res) => {
  const u = await guardAny(req, res, ['clients', 'work']); if (!u) return;
  const slug = req.params.slug; if (!slugOk(slug)) return res.status(400).json({ error: 'Cliente inválido' });
  const [plan, links] = await Promise.all([readFile(`clients/${slug}/00-onboarding/plan-contratado.md`), readFile(`clients/${slug}/00-onboarding/LINKS.md`)]);
  if (!plan && !links) {
    // Cliente que entró por el flujo de pago: vive en la app (su ficha) aunque no tenga folder en el repo.
    const acc = await db.get('accounts', 'acc-' + slug);
    if (!acc) return res.status(404).json({ error: 'Ese cliente no está en el repo ni en la app' });
    return res.json({ slug, plan: '', fields: [], pipeline: [], links: [], own: [], months: [], app: true });
  }
  const p = plan ? parsePlanContratado(plan.content, u.role) : { plan: '', fields: [], pipeline: [] };
  const prof = await content.profile({ slug, name: slug.toUpperCase(), root: `clients/${slug}` });
  res.json({ slug, ...p, links: prof.links, own: prof.own, months: prof.months.map((m) => ({ mes: m.mes, files: m.files.map((f) => ({ path: f.path, name: f.name, area: f.area })) })) });
});

// ---------- Google Drive (Library) ----------
// Subir archivos (entregas, grabaciones): el navegador sube DIRECTO a Google con una sesión que
// abre el servidor; así no hay límite de tamaño de Vercel y el token nunca sale del servidor.
const UP_FOLDER = 'Inherent OS · Entregas';
async function upFolder(u) {
  const me = await db.get('team', u.email);
  if (me?.drive_folder) return me.drive_folder;
  const q = new URLSearchParams({ q: `name='${UP_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents`, fields: 'files(id)', pageSize: '1' });
  let id = (await google.gapi(u.email, `${DRIVE}?${q}`)).files?.[0]?.id;
  if (!id) id = (await google.gapi(u.email, `${DRIVE}?fields=id`, { method: 'POST', body: JSON.stringify({ name: UP_FOLDER, mimeType: 'application/vnd.google-apps.folder' }) })).id;
  await db.upsert('team', u.email, { drive_folder: id }, u.email);
  return id;
}
// Si el CEO configuró la carpeta de entregas de la empresa (Arranque, paso 5), todo cae ahí:
// <carpeta>/<CLIENTE>/<AAAA-MM o Library>/. Cada quien necesita acceso de editor a esa carpeta.
async function childFolder(email, parent, name) {
  const safe = String(name).replace(/'/g, "\\'");
  const q = new URLSearchParams({ q: `name='${safe}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`, fields: 'files(id)', pageSize: '1', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', corpora: 'allDrives' });
  const f = (await google.gapi(email, `${DRIVE}?${q}`)).files?.[0];
  return f ? f.id : (await google.gapi(email, `${DRIVE}?fields=id&supportsAllDrives=true`, { method: 'POST', body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parent] }) })).id;
}
async function companyFolder(u, client, sub) {
  const root = driveId((await db.get('settings', 'drive'))?.root); if (!root) return null;
  try {
    let id = root;
    for (const part of [String(client || 'Interno').toUpperCase().slice(0, 60), String(sub || new Date().toISOString().slice(0, 7)).slice(0, 40)]) id = await childFolder(u.email, id, part);
    return id;
  } catch (e) { throw Object.assign(new Error('No tienes acceso a la carpeta de entregas de Inherent en Drive. Pídele al CEO que te la comparta como editor.'), { code: 'NO_GOOGLE' }); }
}
// El Drive de cada cliente (ver inherent/05-OPERACION.md → «El Drive de cada cliente»):
// crea las carpetas dentro de la carpeta de entregas y las conecta a Content y a la cuenta del cliente.
const CLIENT_DIRS = ['00 Onboarding', '01 Assets de marca', '02 Guiones', '03 Crudo (grabaciones)', '04 Por postear', '05 Entregables', '06 Reportes'];
const folderUrl = (id) => `https://drive.google.com/drive/folders/${id}`;
on('POST', 'drive/client', async (req, res) => {
  const u = await guardAny(req, res, ['clients', 'operations']); if (!u) return;
  const b = body(req); const slug = String(b.slug || ''); if (!/^[\w-]{2,60}$/.test(slug)) return res.status(400).json({ error: 'Cliente inválido' });
  const root = driveId((await db.get('settings', 'drive'))?.root);
  if (!root) return res.status(400).json({ error: 'Primero define la carpeta de entregas de Inherent (Arranque → paso 5).' });
  let top; const dirs = {};
  try {
    top = await childFolder(u.email, root, slug.toUpperCase());
    for (const name of [...CLIENT_DIRS, ...(b.growth ? ['07 Números y auditoría'] : [])]) dirs[name] = await childFolder(u.email, top, name);
  } catch { throw Object.assign(new Error('No tienes acceso de editor a la carpeta de entregas de Inherent en Drive.'), { code: 'NO_GOOGLE' }); }
  const links = Object.fromEntries(Object.entries(dirs).map(([k, id]) => [k, folderUrl(id)]));
  await db.upsert('sources', 'cfg-' + slug, { profile: slug, guiones_drive: links['02 Guiones'], postear_drive: links['04 Por postear'] }, u.email);
  const acc = await db.get('accounts', 'acc-' + slug);
  const patch = { drive: folderUrl(top), drive_dirs: links, assets: acc?.assets || links['01 Assets de marca'] };
  await db.upsert('accounts', 'acc-' + slug, acc ? patch : { name: slug.toUpperCase(), roadmap: [], accesos: [], ...patch }, u.email);
  res.json({ drive: folderUrl(top), dirs: links });
});
on('POST', 'google/upload', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const b = body(req);
  const name = String(b.name || '').replace(/[\\/]/g, '-').trim().slice(0, 180), mime = String(b.mime || 'application/octet-stream').slice(0, 100), size = Number(b.size);
  if (!name || !(size > 0) || size > 5e9) return res.status(400).json({ error: 'Archivo inválido (máximo 5 GB)' });
  const parent = driveId(b.folder) || (await companyFolder(u, b.client, b.sub)) || (await upFolder(u));
  const origin = (process.env.APP_URL || '').trim().replace(/\/$/, '');
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + (await google.accessToken(u.email)), 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': String(size), ...(origin ? { Origin: origin } : {}) },
    body: JSON.stringify({ name, parents: [parent] }),
  });
  if (!r.ok || !r.headers.get('location')) { const t = await r.text(); throw Object.assign(new Error(`Drive ${r.status}: ${t.slice(0, 140)}`), { status: r.status === 401 || r.status === 403 ? r.status : undefined }); }
  res.json({ url: r.headers.get('location') });
});
// Al terminar: lo pueden ver todos los de @dominio con el link, y se devuelve el link.
on('POST', 'google/upload/done', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const id = driveId(body(req).id); if (!id) return res.status(400).json({ error: 'Falta el archivo' });
  await google.gapi(u.email, `${DRIVE}/${id}/permissions?supportsAllDrives=true&sendNotificationEmail=false`, { method: 'POST', body: JSON.stringify({ type: 'domain', role: 'reader', domain: domain(), allowFileDiscovery: false }) }).catch(() => null);
  const f = await google.gapi(u.email, `${DRIVE}/${id}?fields=id,name,mimeType,webViewLink,size&supportsAllDrives=true`);
  res.json({ id: f.id, name: f.name, mime: f.mimeType, link: f.webViewLink, size: Number(f.size || 0) });
});

const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const driveId = (s) => (String(s || '').match(/[-\w]{20,}/) || [])[0] || null;
on('GET', 'google/drive', async (req, res) => {
  const u = await guard(req, res, 'library'); if (!u) return;
  const id = driveId(req.query.folder); if (!id) return res.status(400).json({ error: 'Falta la carpeta de Drive' });
  const q = new URLSearchParams({ q: `'${id}' in parents and trashed=false`, fields: 'files(id,name,mimeType,webViewLink,iconLink,modifiedTime,owners(displayName),thumbnailLink)', orderBy: 'folder,modifiedTime desc', pageSize: '100', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true' });
  const [list, meta] = await Promise.all([google.gapi(u.email, `${DRIVE}?${q}`), google.gapi(u.email, `${DRIVE}/${id}?fields=id,name,webViewLink&supportsAllDrives=true`).catch(() => null)]);
  res.json({ folder: meta, files: (list.files || []).map((f) => ({ id: f.id, name: f.name, mime: f.mimeType, link: f.webViewLink, modified: f.modifiedTime, owner: f.owners?.[0]?.displayName || null })) });
});
on('POST', 'google/drive', async (req, res) => {
  const u = await guard(req, res, 'library'); if (!u) return;
  const b = body(req); const parent = driveId(b.folder);
  const MIME = { doc: 'application/vnd.google-apps.document', sheet: 'application/vnd.google-apps.spreadsheet', slides: 'application/vnd.google-apps.presentation', folder: 'application/vnd.google-apps.folder' };
  const name = String(b.name || '').trim().slice(0, 200);
  if (!name || !MIME[b.type]) return res.status(400).json({ error: 'Falta nombre o tipo' });
  const f = await google.gapi(u.email, `${DRIVE}?fields=id,name,webViewLink,mimeType&supportsAllDrives=true`, { method: 'POST', body: JSON.stringify({ name, mimeType: MIME[b.type], ...(parent ? { parents: [parent] } : {}) }) });
  res.json({ id: f.id, name: f.name, link: f.webViewLink, mime: f.mimeType });
});

// ---------- Finanzas: los movimientos salen de una hoja de Google Sheets ----------
// Columnas: fecha · tipo (ingreso/gasto) · concepto · monto · categoría · cliente. La app solo la lee.
const SHEET_HEAD = 'fecha,tipo,concepto,monto,categoria,cliente\n';
const sheetId = (s) => (String(s || '').match(/\/spreadsheets\/d\/([-\w]{20,})/) || [])[1] || null;
on('GET', 'finance/sheet', async (req, res) => {
  const u = await guard(req, res, 'finanzas'); if (!u) return;
  const url = (await db.get('settings', 'finance_sheet'))?.url || ''; const id = sheetId(url);
  if (!id) return res.json({ url: '' });
  const r = await fetch(`${DRIVE}/${id}/export?mimeType=text/csv&supportsAllDrives=true`, { headers: { Authorization: 'Bearer ' + (await google.accessToken(u.email)) } });
  if (!r.ok) return res.json({ url, error: r.status === 404 ? 'No encuentro la hoja (¿la borraron o no te la compartieron?)' : `Google ${r.status}: no pude leer la hoja` });
  res.json({ url, csv: (await r.text()).slice(0, 2_000_000) });
});
on('PUT', 'finance/sheet', async (req, res) => {
  const u = await guard(req, res, 'finanzas'); if (!u) return;
  if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO puede cambiar esto' });
  const url = String(body(req).url || '').trim();
  if (url && !sheetId(url)) return res.status(400).json({ error: 'Pega el link de una hoja de Google Sheets' });
  await db.upsert('settings', 'finance_sheet', { url }, u.email);
  res.json({ url });
});
on('POST', 'finance/sheet', async (req, res) => {
  const u = await guard(req, res, 'finanzas'); if (!u) return;
  if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO puede cambiar esto' });
  const B = 'inh' + Date.now();
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true', {
    method: 'POST', headers: { Authorization: 'Bearer ' + (await google.accessToken(u.email)), 'Content-Type': `multipart/related; boundary=${B}` },
    body: `--${B}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: 'Inherent · Movimientos', mimeType: 'application/vnd.google-apps.spreadsheet' })}\r\n--${B}\r\nContent-Type: text/csv\r\n\r\n${SHEET_HEAD}\r\n--${B}--`,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error?.message || `Drive ${r.status}`), { status: r.status === 401 || r.status === 403 ? r.status : undefined });
  await db.upsert('settings', 'finance_sheet', { url: j.webViewLink }, u.email);
  res.json({ url: j.webViewLink });
});

// ---------- Google Calendar (el calendario de cada persona) ----------
const TZ = process.env.TIMEZONE || 'America/Guatemala';
const CAL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
on('GET', 'google/calendar', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const from = new Date(String(req.query.from || new Date().toISOString().slice(0, 10)) + 'T00:00:00Z');
  const to = new Date(String(req.query.to || new Date(Date.now() + 31 * 864e5).toISOString().slice(0, 10)) + 'T23:59:59Z');
  if (isNaN(from) || isNaN(to) || to - from > 100 * 864e5) return res.status(400).json({ error: 'Rango inválido' });
  // Todos los calendarios que la persona tiene visibles en Google (no solo el principal).
  let cals = [{ id: 'primary', color: null, name: 'Principal' }], allCals = true;
  try {
    const cl = await google.gapi(u.email, 'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader&maxResults=50');
    const sel = (cl.items || []).filter((c) => c.selected || c.primary).slice(0, 12);
    if (sel.length) cals = sel.map((c) => ({ id: c.primary ? 'primary' : c.id, color: c.backgroundColor || null, name: c.summaryOverride || c.summary }));
  } catch { allCals = false; } // sin el permiso nuevo: solo el principal hasta que vuelva a entrar
  // only=inherent: solo el calendario de la empresa (lo elige el CEO). Si la persona no lo tiene, su principal.
  const inh = req.query.only === 'inherent' ? (await db.get('settings', 'calendar'))?.inherent : null;
  if (inh) cals = [{ id: inh, color: cals.find((c) => c.id === inh)?.color || '#7f9631', name: (await db.get('settings', 'calendar'))?.name || 'Inherent' }];
  const q = new URLSearchParams({ timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '250', timeZone: TZ });
  const lists = await Promise.all(cals.map((c) => google.gapi(u.email, `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(c.id)}/events?${q}`).then((j) => ({ c, items: j.items || [] })).catch((e) => (c.id === 'primary' ? Promise.reject(e) : { c, items: [] }))));
  const seen = new Set();
  const events = lists.flatMap(({ c, items }) => items.filter((e) => e.status !== 'cancelled').map((e) => ({
    id: e.id, cal: c.id, calName: c.name, color: c.color, summary: e.summary || '(sin título)', start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date,
    allDay: Boolean(e.start?.date), link: e.htmlLink, meet: e.hangoutLink || null, location: e.location || null, description: String(e.description || '').slice(0, 1000),
    editable: c.id === 'primary' && (!e.organizer || e.organizer.self), uid: e.iCalUID,
  }))).filter((e) => (e.uid && seen.has(e.uid) ? false : (seen.add(e.uid), true))).sort((a, z) => String(a.start).localeCompare(String(z.start)));
  res.json({ events, allCals, calendars: cals.map(({ name, color }) => ({ name, color })) });
});
on('DELETE', 'google/calendar/:id', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  await google.gapi(u.email, `${CAL}/${encodeURIComponent(req.params.id)}`, { method: 'DELETE' });
  res.json({ ok: true });
});
on('POST', 'google/calendar', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const b = body(req);
  const summary = String(b.summary || '').slice(0, 200);
  if (!summary || !/^\d{4}-\d{2}-\d{2}$/.test(String(b.date))) return res.status(400).json({ error: 'Falta título o fecha' });
  const time = /^\d{2}:\d{2}$/.test(String(b.time || '')) ? b.time : null;
  const mins = Math.min(Math.max(+b.minutes || 60, 15), 720);
  const start = time ? { dateTime: `${b.date}T${time}:00`, timeZone: TZ } : { date: b.date };
  const end = time ? { dateTime: new Date(new Date(`${b.date}T${time}:00Z`).getTime() + mins * 6e4).toISOString().slice(0, 19), timeZone: TZ }
    : { date: new Date(new Date(b.date + 'T12:00:00Z').getTime() + 864e5).toISOString().slice(0, 10) };
  // calendar: 'inherent' = el calendario compartido de la empresa (lo elige el CEO); si no, el principal.
  const calId = b.calendar === 'inherent' ? (await db.get('settings', 'calendar'))?.inherent || 'primary' : 'primary';
  const attendees = [...new Set((Array.isArray(b.attendees) ? b.attendees : []).map((x) => String(x).toLowerCase().trim()).filter((x) => x.endsWith('@' + domain())))].slice(0, 30).map((email) => ({ email }));
  const e = await google.gapi(u.email, `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events${attendees.length ? '?sendUpdates=all' : ''}`, { method: 'POST', body: JSON.stringify({ summary, description: String(b.description || '').slice(0, 2000), start, end, ...(attendees.length ? { attendees } : {}) }) });
  res.json({ id: e.id, link: e.htmlLink, calendar: calId });
});
// Los calendarios donde la persona puede escribir (para elegir el de Inherent).
on('GET', 'google/calendars', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const cl = await google.gapi(u.email, 'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer&maxResults=100');
  const cur = (await db.get('settings', 'calendar'))?.inherent || '';
  res.json({ current: cur, calendars: (cl.items || []).map((c) => ({ id: c.id, name: c.summaryOverride || c.summary, primary: Boolean(c.primary), color: c.backgroundColor || null })) });
});
on('PUT', 'google/calendars', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO puede cambiar esto' });
  const b = body(req); const id = String(b.id || '').slice(0, 200);
  await db.upsert('settings', 'calendar', { inherent: id, name: String(b.name || '').slice(0, 100) }, u.email);
  res.json({ ok: true });
});

// ---------- diagnóstico (CEO) ----------
on('GET', 'health', async (req, res) => {
  const u = await guard(req, res, 'finanzas'); if (!u) return;
  const env = ['DATABASE_URL', 'POSTGRES_URL', 'SESSION_SECRET', 'APP_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'ADMIN_EMAILS', 'GITHUB_TOKEN', 'GITHUB_REPO', 'GITHUB_BRANCH'];
  let repo = 'sin probar';
  try { repo = (await readFile('inherent/06-ECONOMIA.md')) ? 'ok' : 'no encuentra el archivo (token sin acceso al repo, o repo/rama incorrectos)'; } catch (e) { repo = e.message; }
  res.json({ env: Object.fromEntries(env.map((k) => [k, Boolean(process.env[k])])), repo, repoSource: repoSource(), domain: domain() });
});

// Tipo de cambio para cotizar en cualquier moneda (base: quetzales). Fuente pública sin llave.
const fxCache = { at: 0, rates: null };
on('GET', 'fx', async (req, res) => {
  const u = await guard(req, res, 'sales'); if (!u) return;
  const to = String(req.query.to || '').toUpperCase(); if (!/^[A-Z]{3}$/.test(to)) return res.status(400).json({ error: 'Moneda inválida' });
  if (to === 'GTQ') return res.json({ to, rate: 1 });
  if (!fxCache.rates || Date.now() - fxCache.at > 6 * 3600e3) {
    const r = await fetch('https://open.er-api.com/v6/latest/GTQ').then((x) => x.json()).catch(() => null);
    if (r?.rates) { fxCache.rates = r.rates; fxCache.at = Date.now(); }
  }
  const rate = fxCache.rates?.[to];
  rate ? res.json({ to, rate, at: new Date(fxCache.at).toISOString() }) : res.status(502).json({ error: 'No pude traer el tipo de cambio. Escríbelo a mano.' });
});

// ---------- Portal del cliente ----------
// Lo que ve un cliente de SU cuenta: estado de lo contratado, contenido por subir, calendario, reuniones,
// metas, entregables y sus analytics. Nada de costos, horas, notas internas ni otros clientes.
on('GET', 'portal', async (req, res) => {
  const u = await guard(req, res, 'portal', { client: true }); if (!u) return;
  const slug = u.role === 'client' ? u.client_slug : String(req.query.slug || '');
  if (!slugOk(slug)) return res.status(400).json({ error: 'Cliente inválido' });
  const today = new Date().toISOString().slice(0, 10);
  const [acc, projects, tasks, posts, f, p] = await Promise.all([db.get('accounts', 'acc-' + slug), db.list('projects'), db.list('tasks'), db.list('content'), readFile(`clients/${slug}/00-onboarding/plan-contratado.md`), content.profiles().then((l) => l.find((x) => x.slug === slug))]);
  const ps = projects.filter((x) => x.client_slug === slug);
  const pt = (pid) => tasks.filter((t) => t.project_id === pid && (t.visibility || 'all') === 'all' && t.tipo !== 'Personal');
  const pct = (l) => (l.length ? Math.round((l.filter((t) => t.status === 'Hecha').length / l.length) * 100) : null);
  const out = {
    slug, name: acc?.name || slug.toUpperCase(), plan: f ? String(parsePlanContratado(f.content, 'team').plan || '').replace(/^[⬜🔷🟨]️?\s*/u, '') : '',
    projects: ps.map((x) => {
      const ts = pt(x.id);
      return { name: x.name, kind: x.kind, phases: (x.phases || []).map(({ name, start, end, status }) => ({ name, start, end, status })), progress: pct(ts),
        services: (x.services || []).map((sv) => { const st = ts.filter((t) => String(t.title).startsWith(sv.name + ' ·')); return { name: sv.name, level: sv.level, days: sv.days || null, includes: sv.includes || [], progress: pct(st), status: !st.length ? 'Por empezar' : st.every((t) => t.status === 'Hecha') ? 'Entregado' : st.some((t) => t.status === 'En revisión') ? 'En revisión' : st.some((t) => ['En curso', 'Hecha'].includes(t.status)) ? 'En curso' : 'Por empezar', due: st.map((t) => t.due).filter(Boolean).sort().at(-1) || null }; }) };
    }),
    meetings: ps.flatMap((x) => (x.meetings || []).filter((m) => (m.who || []).includes('cliente')).map((m) => ({ date: m.date, name: m.name, topics: m.topics || [], approves: m.approves || '', status: m.status || 'todo' }))).sort((a, z) => a.date.localeCompare(z.date)),
    content: posts.filter((x) => x.kind === 'post' && x.profile === slug && x.date && x.date >= new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)).map((x) => ({ title: x.title, format: x.format || 'Pieza', date: x.date, status: x.status || 'Idea', pillar: x.pillar || '' })).sort((a, z) => a.date.localeCompare(z.date)),
    goals: (acc?.goals || []).map((g) => ({ goal: g.goal, metric: g.metric, baseline: g.baseline, current: g.current, target: g.target, due: g.due, status: g.status, checks: (g.checks || []).map(({ date, done, value }) => ({ date, done, value })) })),
    delivered: ps.flatMap((x) => pt(x.id).filter((t) => t.status === 'Hecha').map((t) => ({ title: t.title.replace(/\s·\s[^·]+\(\d+(\.\d+)? h\)$/, ''), date: String(t._meta?.updated_at || '').slice(0, 10) }))).sort((a, z) => z.date.localeCompare(a.date)).slice(0, 20),
    folder: acc?.drive_dirs?.['05 Entregables'] || null,
    onboarding: acc?.onboarding ? { items: acc.onboarding.items.map(({ t, done, note }) => ({ t, done, note })), done_at: acc.onboarding.done_at || null } : null,
    people: (await db.list('team')).filter((x) => x.role === 'client' && x.client_slug === slug && x.active !== false).map((x) => ({ email: x.email || x.id, name: x.name || '' })),
    today,
  };
  // Analytics de Instagram (si el cliente tiene cuentas y Windsor está conectado).
  if (p && content.windsorOn()) {
    const handles = (await content.profile(p)).own.filter((a) => a.red === 'instagram').map((a) => a.handle);
    const picked = (await content.cfg(slug)).ig_account; const hs = picked ? [picked] : handles;
    if (hs.length) { try { const ig = await content.instagram(hs, 30); if (ig.matched) out.analytics = { handles: hs, followers: ig.followers, reach: ig.reach, views: ig.views, er: ig.er, posts: ig.posts, series: ig.series, top: ig.top.slice(0, 6).map(({ date, type, url, reach, likes, comments, saves }) => ({ date, type, url, reach, likes, comments, saves })) }; } catch {} }
  }
  res.json(out);
});

// El cliente llena su onboarding e invita a alguien de su equipo (solo en su propio portal).
const portalSlug = (u, req) => (u.role === 'client' ? u.client_slug : String(req.query.slug || body(req).slug || ''));
on('PUT', 'portal/onboarding', async (req, res) => {
  const u = await guard(req, res, 'portal', { client: true }); if (!u) return;
  const slug = portalSlug(u, req); if (!slugOk(slug)) return res.status(400).json({ error: 'Cliente inválido' });
  const r = await flow.saveOnboarding(u, slug, Array.isArray(body(req).items) ? body(req).items.slice(0, 60) : []);
  r ? res.json(r) : res.status(404).json({ error: 'Todavía no hay onboarding' });
});
on('POST', 'portal/invite', async (req, res) => {
  const u = await guard(req, res, 'portal', { client: true }); if (!u) return;
  const slug = portalSlug(u, req); if (!slugOk(slug)) return res.status(400).json({ error: 'Cliente inválido' });
  try { res.json(await flow.inviteTeammate(u, slug, body(req), appUrl(req))); }
  catch (e) { if (e.status) return res.status(e.status).json({ error: e.message }); throw e; }
});

// Las cuentas de pauta de cada cliente (Meta, Google Ads, LinkedIn). Las edita Ads, el CEO o el COO.
on('PUT', 'ads/accounts/:slug', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  if (!(['ceo', 'coo'].includes(u.role) || (u.roles || []).includes('ads'))) return res.status(403).json({ error: 'Solo Ads, el CEO o el COO' });
  const slug = req.params.slug; if (!slugOk(slug)) return res.status(400).json({ error: 'Cliente inválido' });
  const b = body(req), ok = (x) => !x || /^[\w-]{3,30}$/.test(String(x));
  const ads = { meta: String(b.meta || '').trim().replace(/^act_/, ''), google: String(b.google || '').trim(), linkedin: String(b.linkedin || '').trim(), budget: Math.max(0, +b.budget || 0) || null, note: String(b.note || '').slice(0, 300) };
  if (![ads.meta, ads.google, ads.linkedin].every(ok)) return res.status(400).json({ error: 'Usa solo el número de la cuenta' });
  await db.upsert('accounts', 'acc-' + slug, { ads }, u.email);
  res.json({ ok: true, ads });
});

// El tablero de pauta (Windsor) y los anuncios de la competencia (Apify).
const adsGuard = async (req, res) => { const u = await guard(req, res); if (!u) return null; if (['ceo', 'coo'].includes(u.role) || (u.roles || []).includes('ads')) return u; res.status(403).json({ error: 'Solo Ads, el CEO o el COO' }); return null; };
on('GET', 'ads/report', async (req, res) => {
  const u = await adsGuard(req, res); if (!u) return;
  try { res.json({ ...(await ads.report(Math.min(90, Math.max(7, +req.query.days || 30)))), apify: ads.apifyOn() }); }
  catch (e) { res.status(502).json({ error: e.message }); }
});
on('GET', 'ads/competitors/:slug', async (req, res) => {
  const u = await adsGuard(req, res); if (!u) return; if (!slugOk(req.params.slug)) return res.status(400).json({ error: 'Cliente inválido' });
  try { res.json((await ads.competitors(req.params.slug, u.email)) || { competitors: [], items: null }); } catch (e) { res.status(502).json({ error: e.message }); }
});
on('POST', 'ads/competitors/:slug', async (req, res) => {
  const u = await adsGuard(req, res); if (!u) return; if (!slugOk(req.params.slug)) return res.status(400).json({ error: 'Cliente inválido' });
  const list = Array.isArray(body(req).list) ? body(req).list : [];
  try { res.json(await ads.scrapeCompetitors(req.params.slug, list, u.email)); }
  catch (e) { if (e.status || e.code) return res.status(e.status || 503).json({ error: e.message }); res.status(502).json({ error: e.message }); }
});

// ---------- Flujo: lead → cotización → pago → proyecto ----------
on('POST', 'flow/quote/:id', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const b = body(req);
  try { res.json(await flow.step({ ...u, areas: areasFor(u.role, u.roles) }, req.params.id, String(b.action || ''), b, appUrl(req))); }
  catch (e) { if (e.status) return res.status(e.status).json({ error: e.message }); throw e; }
});
on('GET', 'flow/proof/:id', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const p = await flow.proof({ ...u, areas: areasFor(u.role, u.roles) }, req.params.id);
  p ? res.json({ name: p.name, data: p.data }) : res.status(404).json({ error: 'No existe' });
});

// ---------- Conector MCP (Claude, ChatGPT, Claude Code, Codex) ----------
// Como cualquier conector: se pega `https://<app>/mcp`, la app abre Inherent OS, la persona entra
// con Google y da «Permitir» (OAuth). Claude actúa como esa persona y solo ve lo que su perfil permite.
const appUrl = (req) => (process.env.APP_URL?.trim() || `https://${req.headers.host}`).replace(/\/$/, '');
const cors = (res) => { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Expose-Headers', 'WWW-Authenticate'); };
const formBody = (req) => { const b = body(req); if (Object.keys(b).length || typeof req.body !== 'string') return b; return Object.fromEntries(new URLSearchParams(req.body)); };
for (const p of ['mcp', 'oauth/token', 'oauth/register', 'oauth/revoke', '.well-known/oauth-authorization-server', '.well-known/oauth-protected-resource', '.well-known/oauth-protected-resource/mcp', '.well-known/openid-configuration']) on('OPTIONS', p, async (req, res) => { cors(res); res.status(204).end(); });
for (const p of ['', '/mcp']) {
  // Sin sufijo = el conector se agregó con la raíz (https://<app>/); con /mcp = con https://<app>/mcp.
  on('GET', '.well-known/oauth-protected-resource' + p, async (req, res) => { cors(res); res.json(oauth.resourceMeta(appUrl(req), !p)); });
  for (const w of ['oauth-authorization-server', 'openid-configuration']) on('GET', `.well-known/${w}${p}`, async (req, res) => { cors(res); res.json(oauth.meta(appUrl(req))); });
}
on('POST', 'oauth/register', async (req, res) => { cors(res); const r = await oauth.register(formBody(req)); res.status(r.status).json(r.json); });
on('GET', 'oauth/authorize', async (req, res) => {
  const r = await oauth.authorize(req.query);
  const to = r.redirect || (r.id ? `/?connect=${r.id}` : `/?error=conector&detail=${encodeURIComponent(r.error)}`);
  res.writeHead(302, { Location: to }).end();
});
on('POST', 'oauth/token', async (req, res) => { cors(res); const r = await oauth.token(formBody(req)); res.status(r.status).json(r.json); });
on('POST', 'oauth/revoke', async (req, res) => { cors(res); await oauth.revokeToken(formBody(req).token); res.status(200).end(); });
// La pantalla de «Permitir» (en la app) pregunta qué app es y luego decide.
on('GET', 'oauth/request', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const r = await oauth.request(req.query.id);
  if (!r) return res.status(404).json({ error: 'La solicitud venció. Vuelve a conectar desde la app.' });
  res.json({ client_name: r.client_name, host: new URL(r.redirect_uri).host });
});
on('POST', 'oauth/decide', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const b = body(req);
  const to = await oauth.decide(b.id, u.email, b.allow === true);
  if (!to) return res.status(404).json({ error: 'La solicitud venció. Vuelve a conectar desde la app.' });
  console.log(JSON.stringify({ evt: 'mcp_connect', email: u.email, allow: b.allow === true }));
  res.json({ redirect: to });
});
on('DELETE', 'me/mcp', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const g = req.query.g ? String(req.query.g) : null;
  await oauth.revokeAll(u.email, g);
  if (!g) await mcp.revoke(u.email); // también el link viejo, si existía
  res.json({ ok: true });
});
on('POST', 'mcp', async (req, res) => {
  cors(res);
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const u = await mcp.userOf(await oauth.emailOf(tok));
  if (!u) { res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${appUrl(req)}/.well-known/oauth-protected-resource${req.query.at === 'root' ? '' : '/mcp'}", scope="${oauth.SCOPE}"`); return res.status(401).json({ error: 'invalid_token', error_description: 'Conecta Inherent OS de nuevo' }); }
  const r = await mcp.run(u, body(req), appUrl(req));
  r.json ? res.status(r.status).json(r.json) : res.status(r.status).end();
});
on('GET', 'mcp', async (req, res) => { cors(res); res.status(405).json({ error: 'Este es el servidor MCP de Inherent OS. Agrégalo como conector en Claude, ChatGPT o Codex.' }); });
// Links personales viejos (/api/mcp/<token>): siguen sirviendo hasta que la persona desconecte.
on('POST', 'mcp/:token', async (req, res) => {
  const r = await mcp.handle(req.params.token, body(req));
  r.json ? res.status(r.status).json(r.json) : res.status(r.status).end();
});
on('GET', 'mcp/:token', async (req, res) => res.status(405).json({ error: 'Este link es para Claude o Codex (MCP por HTTP)' }));

// ---------- Entrada pública de leads: una sola puerta, una clave por fuente ----------
// Sin sesión: la clave de la fuente (Sales → Fuentes) es lo que autoriza. CORS abierto para que
// formularios, el quiz, Zapier o la web puedan mandar. Cuerpo chico, sin duplicados, y todo queda en el registro de la fuente.
const keyOk = (k) => /^[\w-]{16,80}$/.test(String(k || ''));
on('OPTIONS', 'intake/:key', async (req, res) => { cors(res); res.status(204).end(); });
on('OPTIONS', 'intake/quiz', async (req, res) => { cors(res); res.status(204).end(); });
// La clave de la fuente del quiz público (/diagnostico): la principal de tipo quiz, o la primera activa.
on('GET', 'intake/quiz', async (req, res) => { cors(res); const sq = await leads.quizSource(); res.json({ key: sq?.key || null }); });
on('GET', 'intake/:key', async (req, res) => { cors(res); res.status(405).json({ error: 'Esta puerta recibe POST con los datos del lead (JSON o formulario).' }); });
on('POST', 'intake/:key', async (req, res) => {
  cors(res);
  if (!keyOk(req.params.key)) return res.status(404).json({ error: 'Fuente desconocida' });
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (raw.length > 20_000) return res.status(413).json({ error: 'Demasiado grande (máximo 20 KB)' });
  const src = await leads.sourceByKey(req.params.key);
  if (!src) return res.status(404).json({ error: 'Fuente desconocida o pausada' });
  const b = formBody(req);
  try {
    const r = await leads.intake(src, b);
    await leads.logSource(src, { ok: true, name: r.lead.name, lead_id: r.lead.id, duplicate: r.duplicate });
    res.json({ ok: true, id: r.lead.id, duplicate: r.duplicate });
  } catch (e) {
    if (!e.status) console.error('intake', e);
    await leads.logSource(src, { ok: false, error: e.status ? e.message : 'Error del servidor', raw: JSON.stringify(b).slice(0, 300) }).catch(() => {});
    res.status(e.status || 500).json({ error: e.status ? e.message : 'Error del servidor' });
  }
});

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://x');
    const path = String(req.query?.route ?? url.pathname.replace(/^\/api\/?/, '')).replace(/^\/+|\/+$/g, '');
    req.query = { ...Object.fromEntries(url.searchParams), ...(req.query || {}) };
    for (const r of routes) {
      const m = r.method === req.method && r.re.exec(path);
      if (m) { req.params = Object.fromEntries(Object.entries(m.groups || {}).map(([k, v]) => { try { return [k, decodeURIComponent(v)]; } catch { return [k, v]; } })); return await r.fn(req, res); }
    }
    res.status(404).json({ error: 'Ruta desconocida' });
  } catch (e) { fail(res, e); }
}
