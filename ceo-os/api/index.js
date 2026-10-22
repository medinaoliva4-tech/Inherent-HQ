// Una sola función serverless para toda la API (vercel.json reescribe /api/* → aquí).
import * as db from './_lib/db.js';
import * as session from './_lib/session.js';
import * as google from './_lib/google.js';
import { guard, guardAny, COLLS, READ_ALSO, WRITE_ALSO, canWrite, canRead, SCOPED, scoper, inScope, forgetViews, userFor, domain, summaryOf, seesAccesos, managesAccesos, stripAccesos, stripCosts } from './_lib/access.js';
import { readFile, listDir, repoSource } from './_lib/gh.js';
import * as content from './_lib/content.js';
import * as zernio from './_lib/zernio.js';
import * as mcp from './_lib/mcp.js';
import * as oauth from './_lib/oauth.js';
import * as flow from './_lib/flow.js';
import * as ads from './_lib/ads.js';
import * as refs from './_lib/refs.js';
import * as leads from './_lib/leads.js';
import * as recipes from './_lib/recipes.js';
import * as recurring from './_lib/recurring.js';
import * as results from './_lib/results.js';
import * as facturas from './_lib/facturas.js';
import * as laya from './_lib/laya.js';
import * as intel from './_lib/intel.js';
import * as estrategia from './_lib/estrategia.js';
import * as avatares from './_lib/avatares.js';
import * as creacion from './_lib/creacion.js';
import * as planMes from './_lib/plan.js';
import * as portal from './_lib/portal.js';
import * as inv from './_lib/investigacion.js';
import * as buscar from './_lib/buscar.js';
import * as escritorio from './_lib/escritorio.js';
import * as internos from './_lib/internos.js';
import { limpiarFactura, limpiarReceta } from '../public/js/facturas.js';
import { blockersOf } from '../public/js/cycle.js';
import { parentError } from '../public/js/library-tree.js';
import { levelName } from '../public/js/levels.js';
import { estadoDe, archivado, nombreAuto, marcaDe } from '../public/js/element.js';
import { leerSistema } from '../public/js/sistema-visual.js';
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
  // areas, views (profundidad por sección), scope (alcance de datos) y start (dónde abre) ya vienen aplicados por el servidor.
  res.json({ ...u, google: t?.google || {}, birthday: t?.birthday || '', phone: t?.phone || '', bio: t?.bio || '', since: t?._meta?.created_at || '', mcp: Boolean(t?.mcp_hash) || Boolean(t?.mcp_grants?.length), mcp_apps: (t?.mcp_grants || []).map(({ g, name, at }) => ({ g, name, at })) });
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
// La matriz del CEO manda: lo oculto no se entrega (403), «completo» solo lee, «edita» escribe.
// Costos, tarifas y pagos (rates, packages, bundles, payroll) solo los lee el CEO, siempre.
// settings lo lee cualquiera del equipo (ahí viven la matriz, el calendario de empresa y la carpeta de entregas).
async function collGuard(req, res, write) {
  const coll = req.params.coll;
  const area = COLLS[coll];
  if (!area) { res.status(404).json({ error: 'Colección desconocida' }); return null; }
  // Los juicios de Laya se leen según el elemento juzgado: solo por /api/laya/juicios.
  if (coll === laya.COLL) { res.status(404).json({ error: 'Los juicios de Laya están en /api/laya/juicios' }); return null; }
  // El estado y los borradores de Estrategia solo se escriben por /api/estrategia/* (ahí vive la regla: solo el CEO aprueba).
  if (coll === 'strategy') { res.status(404).json({ error: 'La estrategia está en /api/estrategia' }); return null; }
  if (coll === 'avatars') { res.status(404).json({ error: 'Los avatares están en /api/avatares' }); return null; }
  if (coll === 'formats' || coll === 'scripts') { res.status(404).json({ error: 'Formatos y guiones están en /api/formatos y /api/guiones' }); return null; }
  const any = coll === 'settings' && !write ? null : [area, ...((write ? WRITE_ALSO : READ_ALSO)[coll] || [])];
  const u = any ? await guardAny(req, res, any, { write }) : await guard(req, res); if (!u) return null;
  if (!canRead(u.role, coll)) { res.status(403).json({ error: 'Solo el CEO ve esto' }); return null; }
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
// La marca personal del CEO es privada: su contenido (Research, planner, calendario, conexiones) solo lo ve él.
const personalOk = (u, slug) => slug !== 'personal' || u.role === 'ceo';
// Los docs de «sources» (scrape-, refs-, ads-, ideas-…<perfil>) no siempre traen el campo profile: el perfil sale también del id.
const profOf = (coll, d) => (coll === 'sources' ? d?.profile || String(d?.id || '').replace(/^(cfg|scrape|analytics|ideas|refs|ads)-/, '') : d?.profile);
// El link de la hoja de Finanzas solo lo lee quien ve Finanzas.
// El margen objetivo de las propuestas (settings «pricing», Finanzas → Precios) es costo/margen: solo el CEO.
const visible = (u, coll, d) => (coll !== 'tasks' || seesTask(u, d)) && (!['content', 'sources'].includes(coll) || personalOk(u, profOf(coll, d))) && (coll !== 'brand_boards' || personalOk(u, String(d?.id || ''))) && (coll !== 'settings' || ((d?.id !== 'finance_sheet' || u.areas.includes('finanzas')) && (d?.id !== 'pricing' || u.role === 'ceo')));
// El alcance (todos · asignados · propio) filtra proyectos, tareas, cuentas de clientes y leads.
const scopeOf = (u, coll) => (SCOPED.includes(coll) || ['content', 'sources'].includes(coll) ? scoper(u) : null);
// Content y sources llevan el perfil (un cliente, inherent o personal): con alcance «asignados» o «propio» solo entran los de sus clientes.
const profInScope = (sc, coll, d) => { if (!sc || !['content', 'sources'].includes(coll)) return true; const p = profOf(coll, d); return !p || p === 'inherent' || sc.client(p); };
// El tipo de una tarea es uno de cuatro; el SOP es el id de un doc de la Library o un link https.
const TASK_TIPOS = ['Delivery', 'Comercial', 'Interna', 'Personal'];
const cleanTask = (b) => {
  const o = { ...b };
  if (!TASK_TIPOS.includes(o.tipo)) delete o.tipo;
  const sop = String(o.sop || '').trim();
  if (!sop || (!/^https?:\/\/\S+$/i.test(sop) && !/^[\w.@+-]{1,120}$/.test(sop))) delete o.sop; else o.sop = sop.slice(0, 500);
  return o;
};
// Un presupuesto (Clientes → Presupuestos): tipo, renglones y total. El total lo calcula el servidor (cantidad × costo unitario).
const BUDGET_TYPES = ['Photo shoot', 'Ads', 'Evento', 'Otro'], BUDGET_STATUS = ['borrador', 'enviado', 'aprobado'];
const cleanBudget = (b) => {
  const num = (v) => (v !== '' && v != null && Number.isFinite(+v) ? +v : null);
  const lines = (Array.isArray(b.lines) ? b.lines : []).slice(0, 60).map((l) => { const qty = num(l?.qty) ?? 1, cost = num(l?.cost) ?? 0; return { concept: String(l?.concept || '').slice(0, 160), qty, cost, payer: l?.payer === 'inherent' ? 'inherent' : 'cliente', subtotal: Math.round(qty * cost * 100) / 100 }; }).filter((l) => l.concept);
  return { ...b, type: BUDGET_TYPES.includes(b.type) ? b.type : 'Otro', name: String(b.name || '').slice(0, 120), status: BUDGET_STATUS.includes(b.status) ? b.status : 'borrador', client_slug: String(b.client_slug || '').toLowerCase().slice(0, 60),
    lines, total: Math.round(lines.reduce((x, l) => x + l.subtotal, 0) * 100) / 100, note: String(b.note || '').slice(0, 2000), currency: b.currency === 'USD' ? 'USD' : 'GTQ',
    ...(b.type === 'Ads' ? { month: String(b.month || '').slice(0, 7), daily: num(b.daily), platform: String(b.platform || '').slice(0, 40) } : { month: undefined, daily: undefined, platform: undefined }) };
};
// Lo que sale de un doc según quién lo pide: «resumen» recorta o no entrega (summaryOf) y los accesos de un cliente
// solo llegan a quien los puede ver. null = para esa persona no existe.
const shape = (u, coll, d, sc, sum = summaryOf(u, coll)) => {
  if (!d) return null;
  if (sum) { d = sum(d); if (!d) return null; }
  return coll === 'accounts' ? stripAccesos(u, d, sc) : coll === 'budgets' ? stripCosts(u, d) : coll === 'settings' && d.id === 'levels' ? levelsFor(u, d) : d;
};
// Los niveles editables (settings «levels»): los lee todo el equipo, pero el baseline (el piso interno de precio) solo el CEO.
const levelsFor = (u, d) => (u.role === 'ceo' ? d : { ...d, levels: Object.fromEntries(Object.entries(d.levels || {}).map(([k, l]) => { const { usd, gtq, ...rest } = l || {}; return [k, rest]; })) });
// Al guardarlos: solo los 3 niveles y sus campos, en texto corto; el baseline, un número positivo.
const LEVEL_IDS = ['foundation', 'growth', 'partnership'];
const cleanLevels = (b) => ({ ...b, id: 'levels', levels: Object.fromEntries(LEVEL_IDS.filter((k) => b.levels?.[k]).map((k) => { const l = b.levels[k], usd = Number(l.usd);
  return [k, { name: String(l.name || '').slice(0, 60), tag: String(l.tag || '').slice(0, 140), who: String(l.who || '').slice(0, 400), how: String(l.how || '').slice(0, 120), per: String(l.per || '').slice(0, 40), usd: Number.isFinite(usd) && usd > 0 ? Math.round(usd) : null }]; })) });
on('GET', 'db/:coll', async (req, res) => {
  const u = await collGuard(req, res); if (!u) return;
  const coll = req.params.coll, sc = await scopeOf(u, coll), sum = summaryOf(u, coll);
  res.json({ items: (await db.list(coll)).filter((d) => visible(u, coll, d) && inScope(sc, coll, d) && profInScope(sc, coll, d)).map((d) => shape(u, coll, d, sc, sum)).filter(Boolean) });
});
on('GET', 'db/:coll/:id', async (req, res) => {
  const u = await collGuard(req, res); if (!u) return;
  const d = await db.get(req.params.coll, req.params.id);
  const sc = d ? await scopeOf(u, req.params.coll) : null;
  const out = d && visible(u, req.params.coll, d) && inScope(sc, req.params.coll, d) && profInScope(sc, req.params.coll, d) ? shape(u, req.params.coll, d, sc) : null;
  out ? res.json(out) : res.status(404).json({ error: 'No existe' });
});
// Una tarea solo cae en un proyecto del alcance de quien la crea o la mueve; una cotización, en un lead de su alcance.
async function outOfScope(u, coll, b, cur) {
  if (coll === 'tasks' && b.project_id && b.project_id !== cur?.project_id) { const p = await db.get('projects', String(b.project_id)); if (p && !inScope(await scoper(u), 'projects', p)) return 'Ese proyecto no está entre los tuyos'; }
  if (coll === 'quotes' && b.lead_id && b.lead_id !== cur?.lead_id) { const l = await db.get('leads', String(b.lead_id)); if (l && !inScope(await scoper(u), 'leads', l)) return 'Ese lead no está entre los tuyos'; }
  // Un presupuesto o un tablero de marca solo se crea para un cliente del alcance de quien lo crea; el tablero «personal» es del CEO.
  if (coll === 'budgets' && b.client_slug) { const sc = await scoper(u); if (sc && !sc.client(b.client_slug)) return 'Ese cliente no está entre los tuyos'; }
  if (coll === 'brand_boards' && !cur) { const id = String(b.id || ''); if (!personalOk(u, id)) return 'La marca personal es solo del CEO'; const sc = await scoper(u); if (sc && !sc.client(id)) return 'Ese cliente no está entre los tuyos'; }
  return null;
}
// Los accesos del cliente al guardar: el PUT reemplaza el doc completo, así que lo que la persona no puede ver
// (o no mandó) se conserva tal cual estaba. La lista de quién más los ve solo la cambia quien los administra.
const cleanEmails = (l) => [...new Set((Array.isArray(l) ? l : []).map((x) => String(x || '').trim().toLowerCase()).filter((x) => /^[^@\s]+@[^@\s]+$/.test(x)))].slice(0, 30);
function keepAccesos(u, b, cur) {
  const keep = (k, may) => { if (may && k in b) return; if (cur && k in cur) b[k] = cur[k]; else delete b[k]; };
  keep('accesos', cur ? seesAccesos(u, cur) : managesAccesos(u));
  keep('accesos_to', managesAccesos(u));
  if (Array.isArray(b.accesos)) b.accesos = b.accesos.slice(0, 80).map((x) => ({ servicio: String(x?.servicio || '').slice(0, 120), usuario: String(x?.usuario || '').slice(0, 200), donde: String(x?.donde || '').slice(0, 300) })).filter((x) => x.servicio);
  if ('accesos_to' in b && !(cur && b.accesos_to === cur.accesos_to)) b.accesos_to = cleanEmails(b.accesos_to);
  return b;
}
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
  // Library: una carpeta va dentro de otra que exista (null = raíz).
  if (req.params.coll === 'folders') { const why = parentError(await db.list('folders'), null, b.parent_id || null); if (why) return res.status(400).json({ error: why }); b.parent_id = b.parent_id || null; }
  { const why = await outOfScope(u, req.params.coll, b, null); if (why) return res.status(403).json({ error: why }); }
  if (req.params.coll === 'accounts') b = keepAccesos(u, b, null);
  if (req.params.coll === 'tasks') b = results.stampDone(null, cleanTask(b));
  if (req.params.coll === 'budgets') { if (!b.client_slug) return res.status(400).json({ error: 'Falta el cliente del presupuesto' }); b = cleanBudget(b); }
  if (req.params.coll === 'brand_boards' && !slugOk(String(b.id || ''))) return res.status(400).json({ error: 'El tablero lleva el slug del cliente como id' });
  if (req.params.coll === 'recipes') { try { b = { ...recipes.cleanRecipe(b), id: b.id }; } catch (e) { return res.status(400).json({ error: e.message }); } }
  if (req.params.coll === 'invoices') { try { b = { ...limpiarFactura(b), id: b.id }; } catch (e) { return res.status(400).json({ error: e.message }); } }
  if (req.params.coll === 'cost_recipes') { try { b = limpiarReceta(b); b.id = b.client; } catch (e) { return res.status(400).json({ error: e.message }); } }
  if (['content', 'sources'].includes(req.params.coll) && !personalOk(u, b.profile)) return res.status(403).json({ error: 'La marca personal es solo del CEO' });
  const id = typeof b.id === 'string' && /^[\w.@+-]{3,120}$/.test(b.id) ? b.id.toLowerCase() : undefined;
  if (req.params.coll === 'settings' && (id === 'role_views' || b.id === 'role_views')) forgetViews();
  if (req.params.coll === 'settings' && id === 'levels') b = cleanLevels(b);
  try { res.json(shape(u, req.params.coll, await db.create(req.params.coll, b, u.email, id), null, null)); }
  catch (e) { if (/duplicate|unique/i.test(e.message)) return res.status(409).json({ error: 'Ya existe' }); throw e; }
});
on('PUT', 'db/:coll/:id', async (req, res) => {
  const u = await collGuard(req, res, true); if (!u) return;
  let b = body(req);
  try { b = markExternal(req.params.coll, b, req.params.id); } catch (e) { return res.status(400).json({ error: e.message }); }
  if (JSON.stringify(b).length > 400_000) return res.status(413).json({ error: 'Demasiado grande' });
  // Fuera del alcance de la persona (o de la marca personal) no se cambia: para ella no existe.
  if (SCOPED.includes(req.params.coll) || ['content', 'sources'].includes(req.params.coll)) { const cur = await db.get(req.params.coll, req.params.id); if (cur && (!inScope(await scopeOf(u, req.params.coll), req.params.coll, cur) || !visible(u, req.params.coll, cur))) return res.status(404).json({ error: 'No existe' }); if (!personalOk(u, b.profile)) return res.status(403).json({ error: 'La marca personal es solo del CEO' }); }
  if (req.params.coll === 'settings' && req.params.id === 'role_views') forgetViews();
  if (req.params.coll === 'settings' && req.params.id === 'levels') b = { ...cleanLevels(b), v: b.v };
  // Library: mover una carpeta nunca la mete dentro de sí misma; si el cambio no trae parent_id, se queda donde estaba.
  if (req.params.coll === 'folders') { const all = await db.list('folders'); if (!('parent_id' in b)) b.parent_id = all.find((x) => x.id === req.params.id)?.parent_id || null; const why = parentError(all, req.params.id, b.parent_id || null); if (why) return res.status(400).json({ error: why }); b.parent_id = b.parent_id || null; }
  if (['tasks', 'quotes', 'budgets'].includes(req.params.coll)) { const why = await outOfScope(u, req.params.coll, b, await db.get(req.params.coll, req.params.id)); if (why) return res.status(403).json({ error: why }); }
  if (req.params.coll === 'accounts') b = keepAccesos(u, b, await db.get('accounts', req.params.id));
  // El PUT reemplaza el doc: el cliente de un presupuesto no cambia y, si la persona no ve los costos, se conservan los guardados.
  if (req.params.coll === 'budgets') { const cur = await db.get('budgets', req.params.id); if (cur) { b.client_slug = cur.client_slug; if (b.costs_hidden || b.lines === undefined) b.lines = cur.lines; } delete b.costs_hidden; b = cleanBudget(b); }
  if (req.params.coll === 'leads') {
    const cur = await db.get('leads', req.params.id); if (!cur) return res.status(404).json({ error: 'No existe' });
    b = leads.keepFirstReply(cur, leads.normalize(b)); b.activity = leads.mergeActivity(cur.activity, b.activity);
    const bad = leads.check(b); if (bad) return res.status(400).json({ error: bad });
  }
  if (req.params.coll === 'recipes') { try { b = { ...recipes.cleanRecipe(b), v: b.v }; } catch (e) { return res.status(400).json({ error: e.message }); } }
  if (req.params.coll === 'invoices') { try { b = { ...limpiarFactura(b), v: b.v }; } catch (e) { return res.status(400).json({ error: e.message }); } }
  if (req.params.coll === 'cost_recipes') { try { b = { ...limpiarReceta({ ...b, client: (await db.get('cost_recipes', req.params.id))?.client || b.client }), v: b.v }; } catch (e) { return res.status(400).json({ error: e.message }); } }
  if (req.params.coll === 'lead_sources') { const cur = await db.get('lead_sources', req.params.id); b = { ...leads.cleanSource({ ...cur, ...b, key: cur?.key || b.key }), log: cur?.log || [], n: cur?.n || null, v: b.v }; }
  if (req.params.coll === 'tasks') {
    b = cleanTask(b);
    const cur = await db.get('tasks', req.params.id);
    if (!visible(u, 'tasks', cur)) return res.status(404).json({ error: 'No existe' });
    b = results.stampDone(cur, b); // el día en que quedó «Hecha»: así se mide si se entregó a tiempo
    // Una tarea con dependencias sin terminar no avanza (el CEO y el COO pueden forzarlo).
    if (b.status && b.status !== 'Por empezar' && b.status !== cur?.status && !['ceo', 'coo'].includes(u.role)) {
      const all = (b.depends_on || cur?.depends_on || []).length ? await db.list('tasks') : [];
      const wait = blockersOf({ depends_on: b.depends_on || cur?.depends_on }, all);
      if (wait.length) return res.status(423).json({ error: `Bloqueada: primero tiene que estar hecho «${wait.map((x) => x.title).join('», «')}»` });
    }
  }
  const d = await db.update(req.params.coll, req.params.id, b, Number(b.v), u.email);
  d ? res.json(shape(u, req.params.coll, d, await scopeOf(u, req.params.coll), null)) : res.status(409).json({ error: 'Alguien más cambió esto. Recarga para ver la última versión.' });
});
on('DELETE', 'db/:coll/:id', async (req, res) => {
  const u = await collGuard(req, res, true); if (!u) return;
  const cur = await db.get(req.params.coll, req.params.id);
  if (cur && (!visible(u, req.params.coll, cur) || !inScope(await scopeOf(u, req.params.coll), req.params.coll, cur))) return res.status(404).json({ error: 'No existe' });
  if (req.params.coll === 'settings' && req.params.id === 'role_views') forgetViews();
  res.json({ ok: await db.remove(req.params.coll, req.params.id, u.email) });
});

// ---------- del repo: solo economía y clientes ----------
on('GET', 'repo/economia', async (req, res) => {
  // Costos y márgenes por plan: solo el CEO, aunque Finance se vea en resumen.
  const u = await guard(req, res, 'finanzas'); if (!u) return;
  if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO ve los costos' });
  const [eco, op] = await Promise.all([readFile('inherent/06-ECONOMIA.md'), readFile('inherent/05-OPERACION.md')]);
  if (!eco) return res.status(502).json({ error: 'No pude leer 06-ECONOMIA.md del repo. Vuelve a publicar la app (el build copia el repo).', code: 'NO_REPO' });
  res.json({ ...parseEconomia(eco.content), ...(op ? parseOperacion(op.content) : { roles: [], slots: [] }) });
});
on('GET', 'repo/precios', async (req, res) => {
  // Para Sales: precios y volumen, sin costos (salvo al CEO).
  const u = await guard(req, res, 'sales'); if (!u) return;
  if (summaryOf(u, 'services')) return res.status(403).json({ error: 'Tu vista de Comercial es «resumen»: sin catálogo ni precios' });
  const eco = await readFile('inherent/06-ECONOMIA.md');
  if (!eco) return res.status(502).json({ error: 'No pude leer los planes del repo', code: 'NO_REPO' });
  const { plans = [], tipoCambio = null } = parseEconomia(eco.content);
  res.json({ tipoCambio, plans: plans.map((p) => ({ id: p.id, name: p.name, precio: p.precio, precioUsd: p.precioUsd, volumen: p.volumen, promete: p.promete, hace: p.hace, incluye: p.incluye, ...(u.role === 'ceo' ? { costo: p.costo, margen: p.margen } : {}) })) });
});
on('GET', 'repo/clients', async (req, res) => {
  const u = await guardAny(req, res, ['operations', 'clients', 'library', 'work']); if (!u) return;
  const sc = await scoper(u);
  const dirs = (await listDir('clients')).filter((d) => d.type === 'dir' && !d.name.startsWith('_') && (!sc || sc.client(d.name)));
  const clients = await Promise.all(dirs.map(async (d) => {
    const f = await readFile(`clients/${d.name}/00-onboarding/plan-contratado.md`);
    return f ? { slug: d.name, hasPlan: true, ...parsePlanContratado(f.content, u.role) } : { slug: d.name, hasPlan: false };
  }));
  res.json({ clients });
});


// ---------- Content: lee el folder del perfil en el repo + scrape semanal con Apify ----------
const slugOk = (s) => /^[\w-]{2,60}$/.test(String(s || ''));
// Los perfiles de Content que ve una persona: la marca personal solo el CEO; los clientes, según su alcance.
async function profilesFor(u) {
  const sc = await scoper(u);
  return (await content.profiles()).filter((p) => personalOk(u, p.slug) && (!sc || p.slug === 'inherent' || sc.client(p.slug)));
}
const profGuard = (u, slug) => personalOk(u, slug);
// Contenido en «resumen» solo ve el rendimiento (Analytics): Research, la semana, referencias e ideas no se entregan.
const contentFull = (u, res) => { if (u.role === 'ceo' || !u.views || u.views.content !== 'resumen') return true; res.status(403).json({ error: 'Tu vista de Contenido es «resumen»: solo el rendimiento' }); return false; };
on('GET', 'repo/content', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  const list = await profilesFor(u);
  if (!list.length) return res.status(403).json({ error: 'No tienes perfiles de Content asignados' });
  const p = list.find((x) => x.slug === req.query.profile) || list[0];
  res.json({ profiles: list.map(({ slug, name }) => ({ slug, name })), profile: await content.profile(p), cfg: await content.cfg(p.slug), apify: content.apifyOn() });
});
on('PUT', 'content/cfg', async (req, res) => {
  const u = await guard(req, res, 'content', { write: true }); if (!u) return;
  const b = body(req); if (!slugOk(b.profile) || !profGuard(u, b.profile)) return res.status(400).json({ error: 'Perfil inválido' });
  const c = content.cleanCfg(b);
  await db.upsert('sources', 'cfg-' + b.profile, { profile: b.profile, ...c }, u.email);
  res.json(c);
});
on('POST', 'content/scrape', async (req, res) => {
  const u = await guard(req, res, 'content', { write: true }); if (!u) return;
  const slug = String(body(req).profile || ''); if (!slugOk(slug) || !profGuard(u, slug)) return res.status(400).json({ error: 'Perfil inválido' });
  try { const d = await content.scrape(slug, u.email); res.json({ week: d.week, at: d.at }); }
  catch (e) { if (e.status === 400) return res.status(400).json({ error: e.message }); throw e; }
});
on('GET', 'content/week', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return; if (!contentFull(u, res)) return;
  const slug = String(req.query.profile || ''); if (!slugOk(slug) || !profGuard(u, slug)) return res.status(400).json({ error: 'Perfil inválido' });
  let doc = await db.get('sources', 'scrape-' + slug), warn = null;
  if (doc?.runs?.length && !doc.result && content.apifyOn()) { try { doc = await content.settle(slug, u.email); } catch (e) { warn = e.message; } }
  const an = await db.get('sources', 'analytics-' + slug);
  res.json({ apify: content.apifyOn(), week: doc?.week || null, at: doc?.at || null, status: !doc?.runs?.length ? 'none' : doc.result ? 'done' : 'running', runs: (doc?.runs || []).map(({ red, status }) => ({ red, status })), result: doc?.result || null, analytics: an?.history || [], warn });
});
// Referencias por pilar: videos que pega el equipo → Apify busca similares → se desglosan con Claude.
on('GET', 'content/refs', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return; if (!contentFull(u, res)) return;
  const slug = String(req.query.profile || ''); if (!slugOk(slug) || !profGuard(u, slug)) return res.status(400).json({ error: 'Perfil inválido' });
  let doc = await refs.get(slug), warn = null;
  if (doc.runs?.length && !doc.result && refs.on()) { try { doc = await refs.settle(slug, u.email); } catch (e) { warn = e.message; } }
  res.json({ apify: refs.on(), videos: doc.videos || {}, breakdown: doc.breakdown || {}, result: doc.result || null, status: !doc.runs ? 'none' : doc.result ? 'done' : 'running', phase: doc.phase || 0, at: doc.at || null, warn });
});
on('PUT', 'content/refs', async (req, res) => {
  const u = await guard(req, res, 'content', { write: true }); if (!u) return;
  const b = body(req); if (!slugOk(b.profile) || !profGuard(u, b.profile)) return res.status(400).json({ error: 'Perfil inválido' });
  const d = await refs.saveVideos(b.profile, b.videos, u.email); res.json({ videos: d.videos });
});
on('POST', 'content/refs/scrape', async (req, res) => {
  const u = await guard(req, res, 'content', { write: true }); if (!u) return;
  const slug = String(body(req).profile || ''); if (!slugOk(slug) || !profGuard(u, slug)) return res.status(400).json({ error: 'Perfil inválido' });
  try { await refs.start(slug, u.email); res.json({ ok: true }); }
  catch (e) { if (e.status || e.code) return res.status(e.status || 503).json({ error: e.message }); throw e; }
});
on('PUT', 'content/refs/breakdown', async (req, res) => {
  const u = await guard(req, res, 'content', { write: true }); if (!u) return;
  const b = body(req); if (!slugOk(b.profile) || !profGuard(u, b.profile) || !b.pillar) return res.status(400).json({ error: 'Falta el perfil o el pilar' });
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
  const slug = String(req.query.profile || ''); if (!slugOk(slug) || !profGuard(u, slug)) return res.status(400).json({ error: 'Perfil inválido' });
  res.json(await content.cfg(slug));
});
on('PUT', 'content/connect', async (req, res) => {
  const u = await guard(req, res, 'content', { write: true }); if (!u) return;
  const b = body(req); if (!slugOk(b.profile) || !profGuard(u, b.profile)) return res.status(400).json({ error: 'Perfil inválido' });
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
  const p = (await profilesFor(u)).find((x) => x.slug === req.query.profile); if (!p) return res.status(400).json({ error: 'Perfil inválido' });
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
  const u = await guard(req, res, 'content'); if (!u) return; if (!contentFull(u, res)) return;
  const slug = String(req.query.profile || ''); if (!slugOk(slug) || !profGuard(u, slug)) return res.status(400).json({ error: 'Perfil inválido' });
  const d = await db.get('sources', 'ideas-' + slug);
  res.json({ at: d?.at || null, week: d?.week || null, ideas: d?.ideas || [] });
});
on('PUT', 'content/ideas', async (req, res) => {
  const u = await guard(req, res, 'content', { write: true }); if (!u) return;
  const b = body(req); const slug = String(b.profile || ''); if (!slugOk(slug) || !profGuard(u, slug)) return res.status(400).json({ error: 'Perfil inválido' });
  const list = cleanIdeas(b.ideas); if (!list.length) return res.status(400).json({ error: 'No encontré ideas en lo que pegaste' });
  const doc = { profile: slug, at: new Date().toISOString(), week: String(b.week || '').slice(0, 12) || null, ideas: list };
  await db.upsert('sources', 'ideas-' + slug, doc, u.email);
  res.json(doc);
});
// Bandeja de comunidad (Zernio): comentarios y DMs de las cuentas propias del perfil.
on('GET', 'community/inbox', async (req, res) => {
  const u = await guard(req, res, 'content'); if (!u) return;
  if (!zernio.zernioOn()) return res.json({ connected: false });
  const p = (await profilesFor(u)).find((x) => x.slug === req.query.profile); if (!p) return res.status(400).json({ error: 'Perfil inválido' });
  const handles = (await content.profile(p)).own.map((a) => a.handle);
  if (!handles.length) return res.json({ connected: true, noAccounts: true });
  try { res.json({ connected: true, handles, ...(await zernio.inbox(handles)) }); } catch (e) { res.status(502).json({ error: e.message }); }
});

// Vercel Cron, una vez a la semana (lunes): Fase 4 · arranca la investigación de cada marca activa (con ficha de
// oferta y referentes), en las redes de su ficha. Solo arranca los runs de Apify; los recoge el webhook (investigacion.js).
on('GET', 'cron/scrape', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado' });
  if (!content.apifyOn()) return res.json(await inv.anotarCron({ skipped: 'Falta la llave de Apify (APIFY_TOKEN) en Vercel' }));
  res.json(await inv.anotarCron(await inv.cronScrape('cron')));
});
// Cada día recoge lo que quedó corriendo (por si el webhook de Apify no llegó y nadie abrió Investigación).
on('GET', 'cron/settle', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado' });
  // Sin Apify no hay nada que recoger, pero los pendientes de Laya se reintentan igual.
  res.json(await inv.cronSettle('cron', { soloLaya: !content.apifyOn() }));
});

// Cada día deja lista la tarea de cada responsabilidad recurrente que ya toca (recetas internas activas).
on('GET', 'cron/recurrentes', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado' });
  const r = await recurring.run('sistema'); res.json({ creadas: r.creadas });
});

// ---------- Clientes: su perfil del repo ----------
on('GET', 'repo/client/:slug', async (req, res) => {
  const u = await guardAny(req, res, ['clients', 'work']); if (!u) return;
  const slug = req.params.slug; if (!slugOk(slug)) return res.status(400).json({ error: 'Cliente inválido' });
  { const sc = await scoper(u); if (sc && !sc.client(slug)) return res.status(404).json({ error: 'Ese cliente no está entre los tuyos' }); }
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

// ---------- Marca › Diseño › Design system: el sistema visual de la marca y sus logos ----------
// Lee 02-marca/sistema-visual.md (lo escribe ②B Branding con br-sistema), los logos SVG que nombra su § Logo y el kit de redes.
on('GET', 'repo/client/:slug/sistema', async (req, res) => {
  const u = await guardAny(req, res, ['clients', 'content']); if (!u) return;
  const slug = req.params.slug; if (!slugOk(slug) || slug === 'personal') return res.status(400).json({ error: 'Marca inválida' });
  if (slug !== 'inherent') { const sc = await scoper(u); if (sc && !sc.client(slug)) return res.status(404).json({ error: 'Esa marca no está entre las tuyas' }); }
  const root = slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${slug}`, path = `${root}/02-marca/sistema-visual.md`;
  const [f, kit] = await Promise.all([readFile(path), readFile(`${root}/02-marca/kit-de-redes/kit.md`)]);
  if (!f) return res.json({ slug, path, md: '', logos: {}, kit: kit?.content || '' });
  const logos = {};
  for (const l of leerSistema(f.content).logos) {
    if (logos[l.archivo] || !/^[\w.-]+\.svg$/i.test(l.archivo)) continue;
    const svg = await readFile(`${root}/02-marca/logos/${l.archivo}`).catch(() => null);
    if (svg && svg.content.length < 300000 && /<svg[\s>]/i.test(svg.content)) logos[l.archivo] = 'data:image/svg+xml;base64,' + Buffer.from(svg.content).toString('base64');
  }
  res.json({ slug, path, md: f.content, logos, kit: kit?.content || '', kitPath: kit ? `${root}/02-marca/kit-de-redes/kit.md` : '' });
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
  const u = await guardAny(req, res, ['clients', 'operations'], { write: true }); if (!u) return;
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
  const u = await guard(req, res, 'library', { write: true }); if (!u) return;
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
  const u = await guard(req, res, 'finanzas', { write: true }); if (!u) return;
  if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO puede cambiar esto' });
  const url = String(body(req).url || '').trim();
  if (url && !sheetId(url)) return res.status(400).json({ error: 'Pega el link de una hoja de Google Sheets' });
  await db.upsert('settings', 'finance_sheet', { url }, u.email);
  res.json({ url });
});
// ---------- Finanzas → Facturas: cobros del mes, marcar pagada y el cruce con el banco (solo el CEO) ----------
const ceoFin = async (req, res) => { const u = await guard(req, res, 'finanzas', { write: true }); if (!u) return null; if (u.role !== 'ceo') { res.status(403).json({ error: 'Solo el CEO puede cambiar esto' }); return null; } return u; };
const finFail = (res, e) => (e.status >= 400 && e.status < 500 ? res.status(e.status).json({ error: e.message }) : fail(res, e));
on('POST', 'finance/cobros', async (req, res) => {
  const u = await ceoFin(req, res); if (!u) return;
  const period = String(body(req).period || new Date().toISOString().slice(0, 7));
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return res.status(400).json({ error: 'El mes va como AAAA-MM' });
  try { res.json(await facturas.generarCobros(u, period)); } catch (e) { finFail(res, e); }
});
on('POST', 'finance/pagada/:id', async (req, res) => {
  const u = await ceoFin(req, res); if (!u) return;
  const b = body(req);
  try { res.json(await facturas.marcarPagada(u, req.params.id, { paid_at: b.paid_at, bank_ref: String(b.bank_ref || '').slice(0, 120) })); } catch (e) { finFail(res, e); }
});
on('POST', 'finance/banco', async (req, res) => {
  const u = await ceoFin(req, res); if (!u) return;
  try { res.json(await facturas.guardarMovimientos(u, body(req).moves)); } catch (e) { finFail(res, e); }
});
on('POST', 'finance/cruce', async (req, res) => {
  const u = await ceoFin(req, res); if (!u) return;
  const b = body(req);
  try { res.json(await facturas.conciliar(u, b.invoice_id, b.move_id)); } catch (e) { finFail(res, e); }
});
on('POST', 'finance/sheet', async (req, res) => {
  const u = await guard(req, res, 'finanzas', { write: true }); if (!u) return;
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
  if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO' });
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
    slug, name: acc?.name || slug.toUpperCase(), plan: f ? levelName(String(parsePlanContratado(f.content, 'team').plan || '').replace(/^[⬜🔷🟨]️?\s*/u, '')) : '',
    projects: ps.map((x) => {
      const ts = pt(x.id);
      return { name: x.name, kind: x.kind, phases: (x.phases || []).map(({ name, start, end, status }) => ({ name, start, end, status })), progress: pct(ts),
        services: (x.services || []).map((sv) => { const st = ts.filter((t) => String(t.title).startsWith(sv.name + ' ·')); return { name: sv.name, level: sv.level, days: sv.days || null, includes: sv.includes || [], progress: pct(st), status: !st.length ? 'Por empezar' : st.every((t) => t.status === 'Hecha') ? 'Entregado' : st.some((t) => t.status === 'En revisión') ? 'En revisión' : st.some((t) => ['En curso', 'Hecha'].includes(t.status)) ? 'En curso' : 'Por empezar', due: st.map((t) => t.due).filter(Boolean).sort().at(-1) || null }; }) };
    }),
    meetings: ps.flatMap((x) => (x.meetings || []).filter((m) => (m.who || []).includes('cliente')).map((m) => ({ date: m.date, name: m.name, topics: m.topics || [], approves: m.approves || '', status: m.status || 'todo' }))).sort((a, z) => a.date.localeCompare(z.date)),
    content: portal.piezas(posts, slug, today),
    goals: portal.metas(acc?.goals),
    delivered: ps.flatMap((x) => pt(x.id).filter((t) => t.status === 'Hecha').map((t) => ({ title: t.title.replace(/\s·\s[^·]+\(\d+(\.\d+)? h\)$/, ''), date: t.done_at || String(t._meta?.updated_at || '').slice(0, 10) }))).sort((a, z) => z.date.localeCompare(a.date)).slice(0, 20),
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
    if (out.analytics) out.ig = await portal.ig(out.analytics.handles, today);
  }
  // El portal como el dashboard de la web: resumen (5 indicadores, gráfica y leads por fuente), entregas de la semana. Solo datos reales.
  const mine = ps.flatMap((x) => (x.meetings || []).filter((m) => (m.who || []).includes('cliente')));
  out.resumen = portal.resumen({ slug, T: today, posts, leads: await db.list('leads'), meetings: mine, analytics: out.analytics, ig: out.ig });
  out.entregas = portal.entregas(ps, pt, today);
  delete out.ig;
  res.json(out);
});
// El cliente aprueba una pieza o pide cambios (solo las de su propia marca): la deja «Listo» o con su nota.
on('POST', 'portal/content/:id', async (req, res) => {
  const u = await guard(req, res, 'portal', { client: true }); if (!u) return;
  if (u.role !== 'client') return res.status(403).json({ error: 'Solo el cliente aprueba sus piezas' });
  if (!slugOk(u.client_slug)) return res.status(400).json({ error: 'Cliente inválido' });
  try { res.json(await portal.decidir(u, u.client_slug, req.params.id, body(req))); }
  catch (e) { if (e.status) return res.status(e.status).json({ error: e.message }); throw e; }
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
  const b = body(req), ok = (x) => !x || /^[\w-]{3,30}$/.test(String(x)), txt = (x, n) => String(x || '').trim().slice(0, n);
  const cur = (await db.get('accounts', 'acc-' + slug))?.ads || {};
  // El encargo (objetivo en una métrica, oferta y canales) lo escribe Ads; las cuentas y el presupuesto también.
  const ads = { meta: txt(b.meta ?? cur.meta).replace(/^act_/, ''), google: txt(b.google ?? cur.google), linkedin: txt(b.linkedin ?? cur.linkedin), budget: Math.max(0, +(b.budget ?? cur.budget) || 0) || null, note: txt(b.note ?? cur.note, 300),
    objetivo: txt(b.objetivo ?? cur.objetivo, 300), metrica: txt(b.metrica ?? cur.metrica, 120), oferta: txt(b.oferta ?? cur.oferta, 300), canales: txt(b.canales ?? cur.canales, 200) };
  if (![ads.meta, ads.google, ads.linkedin].every(ok)) return res.status(400).json({ error: 'Usa solo el número de la cuenta' });
  // El OK del CEO (gate ⑩): solo él lo da o lo quita; vale para el mes y para ese presupuesto. Si cambia el monto, se vuelve a pedir.
  if (u.role === 'ceo' && 'ok' in b) ads.ok = b.ok ? { at: new Date().toISOString().slice(0, 10), by: u.email, month: new Date().toISOString().slice(0, 7), budget: ads.budget } : null;
  else if (cur.ok && cur.ok.budget === ads.budget) ads.ok = cur.ok;
  if (!ads.ok) delete ads.ok;
  await db.upsert('accounts', 'acc-' + slug, { ads }, u.email);
  res.json({ ok: true, ads });
});
// Lo que ⑩ Ads dejó escrito en el repo para un cliente: el aprendizaje vigente (lo escribe ad-loop al cerrar el ciclo)
// y si ya existen el plan y el reporte de pauta. Sin costos ni márgenes: son archivos del área 06-pauta del cliente.
on('GET', 'repo/client/:slug/pauta', async (req, res) => {
  const u = await guardAny(req, res, ['clients', 'work']); if (!u) return;
  const slug = req.params.slug; if (!slugOk(slug)) return res.status(400).json({ error: 'Cliente inválido' });
  { const sc = await scoper(u); if (sc && !sc.client(slug)) return res.status(404).json({ error: 'Ese cliente no está entre los tuyos' }); }
  const dir = `clients/${slug}/06-pauta`;
  const [ap, plan, rep] = await Promise.all([readFile(`${dir}/aprendizaje-de-pauta.md`), readFile(`${dir}/plan-de-pauta.md`), readFile(`${dir}/reporte-de-pauta.md`)]);
  res.json({ slug, aprendizaje: ap ? ap.content.slice(0, 60_000) : null, plan: Boolean(plan), reporte: Boolean(rep), dir });
});

// Intel: el trabajo de fondo de los agentes en la carpeta de un cliente (avatar, estrategia, marca, plan, reportes…), por departamento.
// Es estrategia: es información del cliente, pero no para el cliente. El rol `client` recibe 403 siempre. El equipo ve lo de su
// alcance por cliente; los montos (presupuesto de producción) solo los ve quien ya ve costos. La ruta de cada archivo sale del
// mapa (public/js/intel-mapa.js), nunca de la petición.
on('GET', 'repo/client/:slug/intel', async (req, res) => {
  const u = await guard(req, res, undefined, { client: true }); if (!u) return;
  if (u.role === 'client') return res.status(403).json({ error: 'Esta información es solo del equipo' });
  const slug = String(req.params.slug || '');
  if (!['clients', 'operations', 'content', 'work', 'portal'].some((a) => u.areas.includes(a))) return res.status(403).json({ error: 'Sin acceso a esta área' });
  { const sc = await scoper(u); if (sc && !sc.client(slug)) return res.status(404).json({ error: 'Ese cliente no está entre los tuyos' }); }
  if (!(await intel.slugValido(slug))) return res.status(404).json({ error: 'No existe' });
  res.json(await intel.intelFor(slug, { vista: 'equipo', costos: managesAccesos(u) }));
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

// ---------- Resultados: los números reales de Inherent y de cada cliente ----------
// Cada bloque sale solo si la persona ve su sección de origen; lo que no tiene dato va vacío, nunca en cero.
on('GET', 'results', async (req, res) => {
  const u = await guard(req, res, 'resultados'); if (!u) return;
  res.json(await results.compute(u, { dias: +req.query.dias || 90 }));
});
// Las redes de un cliente (Instagram por Windsor): aparte, porque tarda.
on('GET', 'results/redes/:slug', async (req, res) => {
  const u = await guard(req, res, 'resultados'); if (!u) return;
  const slug = req.params.slug; if (!slugOk(slug) || slug === 'personal') return res.status(400).json({ error: 'Cliente inválido' });
  if (!u.areas.includes('clients')) return res.status(403).json({ error: 'Sin acceso a esta área' });
  const sc = await scoper(u); if (sc && !sc.client(slug)) return res.status(404).json({ error: 'No existe' });
  try { res.json(await results.redes(slug)); } catch (e) { res.status(502).json({ error: e.message }); }
});

// ---------- Flujo: lead → cotización → pago → proyecto ----------
on('POST', 'flow/quote/:id', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const b = body(req);
  // Fuera del alcance (o con Comercial en «resumen» y sin ser quien sube el pago) la cotización no existe para la persona.
  { const q = await db.get('quotes', req.params.id); if (q && !inScope(await scoper(u), 'quotes', q)) return res.status(404).json({ error: 'La cotización no existe' }); }
  try { res.json(await flow.step(u, req.params.id, String(b.action || ''), b, appUrl(req))); }
  catch (e) { if (e.status) return res.status(e.status).json({ error: e.message }); throw e; }
});
// Paquete o plan → proyecto con las tareas de las recetas; rol → persona por proyecto; lo recurrente.
// Quien cambia proyectos necesita nivel «edita» en Operations; el alcance (clientes asignados) se respeta.
const fail4 = (res, e) => { if (e.status) return res.status(e.status).json({ error: e.message }); throw e; };
on('GET', 'flow/bundles', async (req, res) => {
  const u = await guardAny(req, res, ['operations', 'sales']); if (!u) return;
  res.json({ bundles: await flow.bundleList() });
});
on('POST', 'flow/activate', async (req, res) => {
  const u = await guard(req, res, 'operations', { write: true }); if (!u) return;
  const b = body(req), slug = flow.slugify(b.slug);
  const sc = await scoper(u); if (sc && slug !== 'inherent' && !sc.client(slug)) return res.status(403).json({ error: 'Ese cliente no está entre los tuyos' });
  try { res.json(await flow.activate(u, { bundle_id: b.bundle_id, plan: b.plan === true || b.plan === 'si', slug, label: b.label, start: b.start, name: b.name })); } catch (e) { fail4(res, e); }
});
on('POST', 'flow/role', async (req, res) => {
  const u = await guard(req, res, 'operations', { write: true }); if (!u) return;
  const b = body(req), p = await db.get('projects', String(b.project_id || ''));
  if (p && !inScope(await scoper(u), 'projects', p)) return res.status(404).json({ error: 'El proyecto no existe' });
  try { res.json(await flow.setRole(u, b)); } catch (e) { fail4(res, e); }
});
on('POST', 'recipes/run', async (req, res) => {
  const u = await guard(req, res, 'operations', { write: true }); if (!u) return;
  if (!['ceo', 'coo'].includes(u.role)) return res.status(403).json({ error: 'Solo el CEO o el COO generan lo recurrente' });
  res.json(await recurring.run(u.email));
});
on('GET', 'flow/proof/:id', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  let p = await flow.proof(u, req.params.id);
  if (p) { const q = await db.get('quotes', p.quote_id); if (q && !inScope(await scoper(u), 'quotes', q)) p = null; }
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
// Sin sesión: la clave de la fuente (Comercial → Fuentes) es lo que autoriza. CORS abierto para que
// formularios, el quiz, Zapier o la web puedan mandar. Cuerpo chico, sin duplicados, y todo queda en el registro de la fuente.
const keyOk = (k) => /^[\w-]{16,80}$/.test(String(k || ''));
// Dos defensas simples para la puerta pública: un honeypot (un campo oculto llamado «_hp» que solo llenan los bots;
// el quiz ya lo trae, y un formulario externo lo agrega igual) y un límite por IP y clave (12 envíos cada
// 10 minutos, en memoria: alcanza para formularios y el quiz en Vercel; cada instancia cuenta lo suyo).
const HONEY = ['_hp', 'hp', 'fax'];
const isBot = (b) => HONEY.some((k) => String(b?.[k] || '').trim());
const ipOf = (req) => String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '').split(',')[0].trim() || 'sin-ip';
const RATE = { max: 12, window: 10 * 60_000, hits: new Map() };
export function rateOk(ip, key, now = Date.now()) {
  if (RATE.hits.size > 5000) for (const [k, v] of RATE.hits) if (now - v.at > RATE.window) RATE.hits.delete(k);
  const k = ip + '|' + key, h = RATE.hits.get(k);
  if (!h || now - h.at > RATE.window) { RATE.hits.set(k, { at: now, n: 1 }); return true; }
  h.n++; return h.n <= RATE.max;
}
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
  if (!rateOk(ipOf(req), req.params.key)) return res.status(429).json({ error: 'Demasiados envíos. Inténtalo en unos minutos.' });
  const b = formBody(req);
  // Un bot llenó el campo oculto: se le dice que sí y no se guarda nada (queda en el registro de la fuente, sin contar como fallo).
  if (isBot(b)) { await leads.logSource(src, { ok: false, spam: true, error: 'Descartado: parece un bot (honeypot)' }).catch(() => {}); return res.json({ ok: true, id: null }); }
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

// ---------- Buscador global (⌘K): clientes, proyectos, tareas, leads, cotizaciones, servicios, paquetes, docs, research e ideas ----------
// Busca con las mismas reglas que las listas: la matriz (área oculta = no entra), el alcance (todos · asignados · propio),
// «resumen» (summaryOf), las tareas privadas y la marca personal (solo el CEO). Devuelve hasta 30, cada uno con a dónde lleva.
const fold = (x) => String(x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SEARCH_TYPES = ['cliente', 'proyecto', 'tarea', 'lead', 'cotizacion', 'servicio', 'paquete', 'doc', 'research', 'idea'];
const PER_TYPE = 8, MAX_RESULTS = 30;
// ¿Esta persona lee la colección? Igual que collGuard, sin responder.
const readsColl = (u, coll) => { const area = COLLS[coll]; return Boolean(area) && canRead(u.role, coll) && [area, ...(READ_ALSO[coll] || [])].some((a) => u.areas.includes(a)); };
export async function search(u, q) {
  const words = fold(q).trim().slice(0, 80).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const sc = await scoper(u), lists = {};
  const list = async (coll) => {
    if (!readsColl(u, coll)) return [];
    if (!lists[coll]) { const sum = summaryOf(u, coll); lists[coll] = (await db.list(coll)).filter((d) => visible(u, coll, d) && inScope(sc, coll, d) && profInScope(sc, coll, d)).map((d) => shape(u, coll, d, sc, sum)).filter(Boolean); }
    return lists[coll];
  };
  const has = (a) => u.areas.includes(a);
  const out = [];
  // Puntaje: el título empieza con lo buscado (3), el título lo tiene todo (2), lo demás lo tiene todo (1).
  const add = (type, d, { title, sub = '', status = '', route, hay = [] }) => {
    const t = fold(title), all = fold([title, sub, ...hay].join(' '));
    if (!words.every((w) => all.includes(w))) return;
    const score = t.startsWith(words.join(' ')) ? 3 : words.every((w) => t.includes(w)) ? 2 : 1;
    out.push({ type, id: String(d.id ?? d.slug ?? title), title: String(title || '').slice(0, 140), sub: String(sub || '').slice(0, 140), status: String(status || ''), route, score });
  };
  const [projects, tasks, accounts, leadsL, quotes, services, docs, contentL] = await Promise.all(['projects', 'tasks', 'accounts', 'leads', 'quotes', 'services', 'docs', 'content'].map(list));
  // Clientes: los folders del repo (con su alcance) y las cuentas de la base. Se abren en Proyectos → Clientes.
  if (has('clients')) {
    const seen = new Set(), nameOf = (slug) => accounts.find((a) => (a.slug || String(a.id).replace(/^acc-/, '')) === slug)?.name;
    let dirs = []; try { dirs = (await listDir('clients')).filter((d) => d.type === 'dir' && !d.name.startsWith('_') && (!sc || sc.client(d.name))).map((d) => d.name); } catch {}
    for (const slug of [...dirs, ...accounts.map((a) => a.slug || String(a.id).replace(/^acc-/, ''))]) {
      if (!slug || seen.has(slug)) continue; seen.add(slug);
      const a = accounts.find((x) => (x.slug || String(x.id).replace(/^acc-/, '')) === slug);
      add('cliente', { id: slug }, { title: nameOf(slug) || slug.toUpperCase(), sub: [slug, a?.contact].filter(Boolean).join(' · '), status: a?.from_quote ? 'Desde cotización' : 'Cliente', route: `#/clients/${slug}`, hay: [slug, a?.contact, a?.email, a?.notes] });
    }
  }
  const pname = (id) => projects.find((p) => p.id === id);
  for (const p of projects) add('proyecto', p, { title: p.name || 'Proyecto', sub: [p.client || p.client_slug, p.kind].filter(Boolean).join(' · '), status: p.status === 'cerrado' ? 'Cerrado' : 'Activo', route: has('operations') ? `#/operations/p/${encodeURIComponent(p.id)}` : '#/work', hay: [p.client_slug, p.kind, p.line] });
  for (const t of tasks) { const p = pname(t.project_id); add('tarea', t, { title: t.title || 'Tarea', sub: [p?.client || p?.name || (t.tipo === 'Personal' ? 'Personal' : 'Interna'), t.due ? `vence ${t.due}` : ''].filter(Boolean).join(' · '), status: t.status || 'Por empezar', route: t.project_id && has('operations') ? `#/operations/p/${encodeURIComponent(t.project_id)}` : '#/work/kanban', hay: [t.dept, t.description, p?.name] }); }
  for (const l of leadsL) add('lead', l, { title: l.name || 'Lead', sub: [l.company, l.source].filter(Boolean).join(' · '), status: l.stage || 'Nuevo', route: `#/sales/crm/${encodeURIComponent(l.id)}`, hay: [l.company, l.email, l.phone, l.wants, l.source, ...(Array.isArray(l.tags) ? l.tags : [])] });
  for (const x of quotes) add('cotizacion', x, { title: [x.number, x.client].filter(Boolean).join(' · ') || 'Cotización', sub: x.date || '', status: x.status || 'Borrador', route: 'items' in x ? `#/sales/quotes/${encodeURIComponent(x.id)}` : '#/sales', hay: [x.client_slug] });
  for (const x of services) add('servicio', x, { title: x.name || 'Servicio', sub: x.category || '', status: x.unit || '', route: '#/services/servicios', hay: [x.description] });
  // Paquetes: el CEO los lee de la base; quien ve Proyectos o Comercial completo, la lista sin precios (como en Servicios).
  if (u.role === 'ceo' || ((has('operations') || has('sales')) && !summaryOf(u, 'services'))) {
    const bundles = u.role === 'ceo' ? await db.list('bundles') : await flow.bundleList().catch(() => []);
    for (const b of bundles) add('paquete', b, { title: b.name || 'Paquete', sub: [b.industry, levelName(b.level || b.nivel || '') || ''].filter(Boolean).join(' · '), status: 'Paquete', route: '#/services/paquetes', hay: [b.desc] });
  }
  for (const d of docs) add('doc', d, { title: d.title || 'Documento', sub: d.kind || 'Nota', status: d.kind || '', route: `#/library/${encodeURIComponent(d.folder_id || '_')}/${encodeURIComponent(d.id)}`, hay: [String(d.body || '').slice(0, 4000)] });
  // Research e ideas: el contenido de cada marca (la personal solo le llega al CEO por visible()).
  for (const c of contentL) {
    if (!c.profile) continue;
    if (c.kind === 'research') add('research', c, { title: c.title || String(c.text || '').split('\n')[0].slice(0, 80) || `@${c.handle || 'referencia'}`, sub: [c.handle ? '@' + c.handle : '', marcaDe(c.profile)].filter(Boolean).join(' · '), status: c.tipo || '', route: `#/marcas/${encodeURIComponent(c.profile)}/investigacion`, hay: [c.handle, c.pillar, ...(Array.isArray(c.tags) ? c.tags : [])] });
    else if (c.kind === 'post') add('idea', c, { title: c.name || nombreAuto(marcaDe(c.profile), c.format, c.title), sub: c.date ? `sale ${c.date}` : 'sin fecha', status: archivado(c) ? 'Archivado' : estadoDe(c), route: `#/marcas/${encodeURIComponent(c.profile)}/ideas`, hay: [c.title, c.pillar, c.caption] });
  }
  // Los mejores de cada tipo (máx. 8) y 30 en total; el orden de los tipos es el de SEARCH_TYPES.
  const by = SEARCH_TYPES.map((t) => out.filter((x) => x.type === t).sort((a, z) => z.score - a.score || a.title.localeCompare(z.title)).slice(0, PER_TYPE));
  const picked = [];
  for (let i = 0; i < PER_TYPE && picked.length < MAX_RESULTS; i++) for (const l of by) if (l[i] && picked.length < MAX_RESULTS) picked.push(l[i]);
  return picked.sort((a, z) => SEARCH_TYPES.indexOf(a.type) - SEARCH_TYPES.indexOf(z.type) || z.score - a.score).map(({ score, ...x }) => x);
}
// ---------- Laya (Fase 3): el juicio como dato — puertas, texto, juicios y pendientes ----------
// ---------- Ventas › Buscar leads: scraping de prospectos con Apify ----------
buscar.rutas(on);
laya.rutas(on);
// ---------- App 02 · Estrategia: 5 bloques por cliente, el estado de cada uno y las fuentes de Hormozi ----------
estrategia.rutas(on);
// ---------- App 01 · Marca › Cliente ideal: los avatares de cada marca, con su peso y el OK del CEO ----------
avatares.rutas(on);
// ---------- App 01 · Marca › Crear: formatos (plantillas) y guiones ----------
creacion.rutas(on);
planMes.rutas(on);
// ---------- Investigación (Fase 4): referentes por marca, scraping automático con Apify y «Usar como formato» ----------
inv.rutas(on);
// ---------- La app de escritorio: si hay versión nueva y el link para bajarla ----------
escritorio.rutas(on);
// ---------- Lo interno (costos, baseline, paquetes por industria): solo desde el servidor ----------
internos.rutas(on);

on('GET', 'search', async (req, res) => {
  const u = await guard(req, res); if (!u) return;
  const q = String(req.query.q || '').slice(0, 80);
  res.json({ q, items: await search(u, q) });
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
