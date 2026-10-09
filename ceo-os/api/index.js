// Una sola función serverless para toda la API (vercel.json reescribe /api/* → aquí).
import * as db from './_lib/db.js';
import * as session from './_lib/session.js';
import * as google from './_lib/google.js';
import { guard, areasFor, COLLS, canWrite, userFor, domain } from './_lib/access.js';
import { readFile, listDir, repoSource } from './_lib/gh.js';
import * as content from './_lib/content.js';
import { parseEconomia, parseOperacion, parsePlanContratado } from './_lib/parse.js';
import { body, fail } from './_lib/http.js';

const routes = [];
const on = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });

// ---------- auth ----------
on('GET', 'auth/google', async (req, res) => {
  const state = google.newState();
  session.addCookie(res, `ceoos_state=${session.sign({ state, exp: Date.now() + 10 * 60_000 })}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=600`);
  res.writeHead(302, { Location: google.authUrl(state) }).end();
});
on('GET', 'auth/callback', async (req, res) => {
  const st = session.unsign(session.cookie(req, 'ceoos_state'));
  session.addCookie(res, 'ceoos_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0');
  const back = (err, detail) => res.writeHead(302, { Location: '/' + (err ? `?error=${err}${detail ? '&detail=' + encodeURIComponent(String(detail).slice(0, 160)) : ''}` : '') }).end();
  if (req.query.error) return back('google', req.query.error);
  if (!st || st.exp < Date.now() || st.state !== req.query.state || !req.query.code) return back('estado');
  let p;
  try { p = await google.finishLogin(String(req.query.code)); }
  catch (e) { console.error('login google', e); return back('google', e.message); }
  if (!p) return back('dominio');
  try {
    const u = await userFor(p.email);
    if (!u.active) return back('inactivo');
    await db.upsert('team', p.email, { email: p.email, name: p.name, picture: p.picture, google: { calendar: p.scopes.some((s) => s.includes('calendar')), drive: p.scopes.some((s) => s.includes('drive')) }, last_login: new Date().toISOString() }, p.email);
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
  const u = await guard(req, res); if (!u) return;
  const t = await db.get('team', u.email);
  res.json({ ...u, areas: areasFor(u.role, u.roles), google: t?.google || {} });
});
// Cada quien cambia su propia foto (una imagen chica que el navegador ya recortó).
on('PUT', 'me/photo', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const photo = String(body(req).photo || '');
  if (photo && (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > 300_000)) return res.status(400).json({ error: 'La foto debe ser una imagen de menos de 200 KB' });
  await db.upsert('team', u.email, { photo: photo || null }, u.email);
  res.json({ ok: true });
});
on('GET', 'status', async (req, res) => {
  // Público y sin datos: solo dice qué falta configurar, para que el login lo explique.
  let dbok = false; try { dbok = await db.ping(); } catch {}
  res.json({ google: google.configured(), db: dbok, repo: repoSource() !== 'none', domain: domain() });
});

// ---------- documentos ----------
async function collGuard(req, res, write) {
  const coll = req.params.coll;
  const area = COLLS[coll];
  if (!area) { res.status(404).json({ error: 'Colección desconocida' }); return null; }
  const u = await guard(req, res, area); if (!u) return null;
  if (write && !canWrite(u.role, coll)) { res.status(403).json({ error: 'Solo el CEO puede cambiar esto' }); return null; }
  return u;
}
// Tareas: «solo yo» la ven quien la creó y a quien se asignó; «ciertas personas» suma a las elegidas.
const seesTask = (u, t) => {
  const vis = t?.visibility || 'all'; if (vis === 'all') return true;
  const mine = [t._meta?.created_by, t.assignee, ...(vis === 'people' ? [t.accountable, ...(Array.isArray(t.viewers) ? t.viewers : [])] : [])];
  return mine.filter(Boolean).map((x) => String(x).toLowerCase()).includes(u.email);
};
const visible = (u, coll, d) => coll !== 'tasks' || seesTask(u, d);
on('GET', 'db/:coll', async (req, res) => { const u = await collGuard(req, res); if (u) res.json({ items: (await db.list(req.params.coll)).filter((d) => visible(u, req.params.coll, d)) }); });
on('GET', 'db/:coll/:id', async (req, res) => {
  const u = await collGuard(req, res); if (!u) return;
  const d = await db.get(req.params.coll, req.params.id);
  d && visible(u, req.params.coll, d) ? res.json(d) : res.status(404).json({ error: 'No existe' });
});
on('POST', 'db/:coll', async (req, res) => {
  const u = await collGuard(req, res, true); if (!u) return;
  const b = body(req);
  if (JSON.stringify(b).length > 400_000) return res.status(413).json({ error: 'Demasiado grande' });
  const id = typeof b.id === 'string' && /^[\w.@+-]{3,120}$/.test(b.id) ? b.id.toLowerCase() : undefined;
  try { res.json(await db.create(req.params.coll, b, u.email, id)); }
  catch (e) { if (/duplicate|unique/i.test(e.message)) return res.status(409).json({ error: 'Ya existe' }); throw e; }
});
on('PUT', 'db/:coll/:id', async (req, res) => {
  const u = await collGuard(req, res, true); if (!u) return;
  const b = body(req);
  if (JSON.stringify(b).length > 400_000) return res.status(413).json({ error: 'Demasiado grande' });
  if (req.params.coll === 'tasks' && !visible(u, 'tasks', await db.get('tasks', req.params.id))) return res.status(404).json({ error: 'No existe' });
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
  const u = await guard(req, res, 'operations'); if (!u) return;
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
  try { res.json({ connected: true, handles, ...(await content.instagram(handles, Number(req.query.days) || 30)) }); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
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
  const u = await guard(req, res, 'clients'); if (!u) return;
  const slug = req.params.slug; if (!slugOk(slug)) return res.status(400).json({ error: 'Cliente inválido' });
  const [plan, links] = await Promise.all([readFile(`clients/${slug}/00-onboarding/plan-contratado.md`), readFile(`clients/${slug}/00-onboarding/LINKS.md`)]);
  if (!plan && !links) return res.status(404).json({ error: 'Ese cliente no está en el repo' });
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
  const e = await google.gapi(u.email, CAL, { method: 'POST', body: JSON.stringify({ summary, description: String(b.description || '').slice(0, 2000), start, end }) });
  res.json({ id: e.id, link: e.htmlLink });
});

// ---------- diagnóstico (CEO) ----------
on('GET', 'health', async (req, res) => {
  const u = await guard(req, res, 'finanzas'); if (!u) return;
  const env = ['DATABASE_URL', 'POSTGRES_URL', 'SESSION_SECRET', 'APP_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'ADMIN_EMAILS', 'GITHUB_TOKEN', 'GITHUB_REPO', 'GITHUB_BRANCH'];
  let repo = 'sin probar';
  try { repo = (await readFile('inherent/06-ECONOMIA.md')) ? 'ok' : 'no encuentra el archivo (token sin acceso al repo, o repo/rama incorrectos)'; } catch (e) { repo = e.message; }
  res.json({ env: Object.fromEntries(env.map((k) => [k, Boolean(process.env[k])])), repo, repoSource: repoSource(), domain: domain() });
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
