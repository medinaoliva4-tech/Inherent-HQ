// Una sola función serverless para toda la API (vercel.json reescribe /api/* → aquí).
import * as db from './_lib/db.js';
import * as session from './_lib/session.js';
import * as google from './_lib/google.js';
import { guard, areasFor, COLLS, canWrite, userFor, domain } from './_lib/access.js';
import { readFile, listDir, repoSource } from './_lib/gh.js';
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
  res.json({ ...u, areas: areasFor(u.role), google: t?.google || {} });
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
on('GET', 'db/:coll', async (req, res) => { if (await collGuard(req, res)) res.json({ items: await db.list(req.params.coll) }); });
on('GET', 'db/:coll/:id', async (req, res) => {
  if (!(await collGuard(req, res))) return;
  const d = await db.get(req.params.coll, req.params.id);
  d ? res.json(d) : res.status(404).json({ error: 'No existe' });
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
  const d = await db.update(req.params.coll, req.params.id, b, Number(b.v), u.email);
  d ? res.json(d) : res.status(409).json({ error: 'Alguien más cambió esto. Recarga para ver la última versión.' });
});
on('DELETE', 'db/:coll/:id', async (req, res) => {
  const u = await collGuard(req, res, true); if (!u) return;
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


// ---------- Google Calendar (el calendario de cada persona) ----------
const TZ = process.env.TIMEZONE || 'America/Guatemala';
const CAL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
on('GET', 'google/calendar', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const from = new Date(String(req.query.from || new Date().toISOString().slice(0, 10)) + 'T00:00:00Z');
  const to = new Date(String(req.query.to || new Date(Date.now() + 31 * 864e5).toISOString().slice(0, 10)) + 'T23:59:59Z');
  if (isNaN(from) || isNaN(to) || to - from > 100 * 864e5) return res.status(400).json({ error: 'Rango inválido' });
  const q = new URLSearchParams({ timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '250', timeZone: TZ });
  const j = await google.gapi(u.email, `${CAL}?${q}`);
  res.json({ events: (j.items || []).filter((e) => e.status !== 'cancelled').map((e) => ({
    id: e.id, summary: e.summary || '(sin título)', start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date,
    allDay: Boolean(e.start?.date), link: e.htmlLink, meet: e.hangoutLink || null, location: e.location || null,
  })) });
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
      if (m) { req.params = m.groups || {}; return await r.fn(req, res); }
    }
    res.status(404).json({ error: 'Ruta desconocida' });
  } catch (e) { fail(res, e); }
}
