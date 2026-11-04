// Conectores (MCPs) · el OS como puente hacia los servidores MCP remotos.
//   · tipo 'mcp' (OAuth): descubre el servidor de autorización (RFC 9728 / 8414), registra la app del OS (RFC 7591), abre el
//     login del servicio con PKCE y guarda el permiso CIFRADO (vault.js) por persona. Si vence, lo renueva solo.
//   · tipo 'token': la persona pega un token personal una vez (cifrado igual).
//   · Cliente MCP «Streamable HTTP»: initialize → tools/list → tools/call (respuesta JSON o SSE).
// Lo usan la pantalla de MCPs (estado, conectar, desconectar) y ia.js (los agentes llaman herramientas desde el servidor).
// Colecciones propias (no pasan por /api/db): mcp_conexiones (id «email|conector») y mcp_pendientes (el login a medias, 10 min).
import crypto from 'node:crypto';
import * as db from './db.js';
import { guard } from './access.js';
import { body } from './http.js';
import { seal, open } from './vault.js';
import { CONECTORES, conectorDe } from '../../public/js/conectores.js';

const CONN = 'mcp_conexiones', PEND = 'mcp_pendientes';
const lc = (x) => String(x || '').toLowerCase();
const idDe = (email, c) => `${lc(email)}|${c}`.slice(0, 120);
const app = () => String(process.env.APP_URL || '').trim().replace(/\/+$/, '');
const redirect = () => `${app()}/api/conectores/callback`;
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const PROTO = '2025-06-18';
const pedirJSON = async (url, opts = {}) => { const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(15000) }); if (!r.ok) throw Object.assign(new Error(`${new URL(url).host} respondió ${r.status}`), { status: r.status }); return r.json(); };

// ---------- Descubrir y registrar (OAuth para MCP) ----------
async function descubrir(url) {
  const u = new URL(url), path = u.pathname.replace(/\/+$/, '');
  let prm = null;
  for (const c of [`${u.origin}/.well-known/oauth-protected-resource${path}`, `${u.origin}/.well-known/oauth-protected-resource`]) { try { prm = await pedirJSON(c); break; } catch {} }
  if (!prm) {
    // Algunos lo dicen en el 401: WWW-Authenticate: Bearer resource_metadata="…"
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: PROTO, capabilities: {}, clientInfo: { name: 'Inherent OS', version: '1' } } }), signal: AbortSignal.timeout(15000) });
      const m = /resource_metadata="([^"]+)"/.exec(r.headers.get('www-authenticate') || '');
      if (m) prm = await pedirJSON(m[1]);
    } catch {}
  }
  const as = new URL(prm?.authorization_servers?.[0] || u.origin), asPath = as.pathname.replace(/\/+$/, '');
  let meta = null;
  for (const c of [`${as.origin}/.well-known/oauth-authorization-server${asPath}`, `${as.origin}/.well-known/oauth-authorization-server`, `${as.origin}/.well-known/openid-configuration${asPath}`, `${as.origin}/.well-known/openid-configuration`]) { try { meta = await pedirJSON(c); break; } catch {} }
  if (!meta?.authorization_endpoint || !meta?.token_endpoint) throw Object.assign(new Error('Este servicio todavía no permite conectarse directo desde el OS.'), { status: 400, code: 'SIN_OAUTH' });
  return { meta, resource: prm?.resource || url, scopes: prm?.scopes_supported || meta.scopes_supported || [] };
}
async function registrar(meta) {
  if (!meta.registration_endpoint) throw Object.assign(new Error('Este servicio pide una app aprobada a mano: todavía no se puede conectar directo desde el OS.'), { status: 400, code: 'SIN_REGISTRO' });
  const j = await pedirJSON(meta.registration_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_name: 'Inherent OS', redirect_uris: [redirect()], grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none', client_uri: app() }) });
  if (!j.client_id) throw new Error('El servicio no entregó una app para el OS');
  return { client_id: j.client_id, client_secret: j.client_secret || '' };
}

// ---------- La conexión guardada ----------
async function conexion(email, conector) {
  const d = await db.get(CONN, idDe(email, conector)); if (!d) return null;
  const c = conectorDe(conector);
  let token = ''; try { token = d.access ? open(d.access) : ''; } catch { return null; }
  // Renovar si vence en menos de un minuto.
  if (d.expira && Date.parse(d.expira) - Date.now() < 60000 && d.refresh) {
    try {
      const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: open(d.refresh), client_id: d.client_id, ...(d.resource ? { resource: d.resource } : {}) });
      if (d.client_secret) form.set('client_secret', open(d.client_secret));
      const t = await pedirJSON(d.token_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form });
      token = t.access_token;
      const { id, v, _meta, ...data } = d;
      await db.update(CONN, id, { ...data, access: seal(t.access_token), refresh: t.refresh_token ? seal(t.refresh_token) : d.refresh, expira: t.expires_in ? new Date(Date.now() + t.expires_in * 1000).toISOString() : '' }, v, email);
    } catch { /* si no renueva, se usa el que hay y el servicio dirá */ }
  }
  return { url: d.url || c?.url, token, conector, nombre: c?.nombre || conector };
}

// ---------- Cliente MCP (Streamable HTTP) ----------
let rid = 1;
async function rpc(cx, method, params, sesion, notif = false) {
  const r = await fetch(cx.url, { method: 'POST', signal: AbortSignal.timeout(60000), headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': PROTO, ...(cx.token ? { Authorization: `Bearer ${cx.token}` } : {}), ...(sesion ? { 'Mcp-Session-Id': sesion } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', ...(notif ? {} : { id: rid++ }), method, ...(params ? { params } : {}) }) });
  if (r.status === 401) throw Object.assign(new Error(`${cx.nombre}: el permiso venció. Vuelve a conectarlo en MCPs.`), { status: 401 });
  if (notif) return { sesion };
  if (!r.ok) throw new Error(`${cx.nombre} respondió ${r.status}`);
  const nueva = r.headers.get('mcp-session-id') || sesion;
  const tipo = r.headers.get('content-type') || '';
  let msg;
  if (tipo.includes('text/event-stream')) {
    const t = await r.text();
    for (const bloque of t.split(/\n\n/)) { const d = bloque.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join(''); if (!d) continue; try { const j = JSON.parse(d); if (j.result || j.error) { msg = j; break; } } catch {} }
  } else msg = await r.json();
  if (!msg) throw new Error(`${cx.nombre} no respondió`);
  if (msg.error) throw new Error(`${cx.nombre}: ${msg.error.message || 'error'}`);
  return { result: msg.result, sesion: nueva };
}
async function abrirSesion(cx) {
  const { sesion } = await rpc(cx, 'initialize', { protocolVersion: PROTO, capabilities: {}, clientInfo: { name: 'Inherent OS', version: '1' } });
  await rpc(cx, 'notifications/initialized', null, sesion, true).catch(() => {});
  return sesion;
}
export async function listarTools(cx) {
  const s = await abrirSesion(cx);
  const { result } = await rpc(cx, 'tools/list', {}, s);
  return { sesion: s, tools: (result?.tools || []).slice(0, 80) };
}
export async function llamarTool(cx, sesion, name, args) {
  const { result } = await rpc(cx, 'tools/call', { name, arguments: args || {} }, sesion);
  const partes = (result?.content || []).map((c) => (c.type === 'text' ? c.text : c.type === 'resource' ? c.resource?.text || c.resource?.uri : `[${c.type}]`)).filter(Boolean);
  return { texto: partes.join('\n').slice(0, 12000), error: Boolean(result?.isError) };
}
// Las herramientas de varios conectores de una persona, listas para la IA. → [{ conector, nombre, tool, cx, sesion }]
export async function toolsDe(email, ids) {
  const out = [];
  for (const id of [...new Set(ids)].slice(0, 6)) {
    const cx = await conexion(email, id); if (!cx?.url || !cx.token) continue;
    try { const { sesion, tools } = await listarTools(cx); for (const t of tools) out.push({ conector: id, cx, sesion, tool: t }); } catch { /* el conector que falla no tumba el trabajo */ }
  }
  return out;
}

// ---------- Rutas ----------
export function rutas(on) {
  on('GET', 'conectores/estado', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const [mias, team] = await Promise.all([db.list(CONN), db.get('team', u.email)]);
    const g = team?.google || {};
    const conectores = CONECTORES.map((c) => {
      const d = mias.find((x) => x.id === idDe(u.email, c.id));
      const conectado = c.tipo === 'os' ? (c.env ? Boolean(process.env[c.env]) : true) : c.tipo === 'google' ? Boolean(g[c.scope]) : Boolean(d?.access);
      return { id: c.id, conectado, at: d?._meta?.updated_at || '', puede: c.tipo === 'mcp' || c.tipo === 'token' ? Boolean(app()) : false };
    });
    res.json({ conectores, puente: Boolean(app()) });
  });

  on('POST', 'conectores/conectar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const b = body(req), c = conectorDe(b.id);
    if (!c || !['mcp', 'token'].includes(c.tipo)) return res.status(400).json({ error: 'Ese conector no se conecta así' });
    if (!app()) return res.status(500).json({ error: 'Falta APP_URL en el servidor' });
    try {
      if (c.tipo === 'token') {
        const token = String(b.token || '').trim(); if (token.length < 10) return res.status(400).json({ error: 'Pega el token completo' });
        const { tools } = await listarTools({ url: c.url, token, nombre: c.nombre });
        const id = idDe(u.email, c.id), prev = await db.get(CONN, id), data = { conector: c.id, email: lc(u.email), url: c.url, access: seal(token), refresh: '', expira: '' };
        if (prev) await db.update(CONN, id, data, prev.v, u.email); else await db.create(CONN, data, u.email, id);
        return res.json({ ok: true, tools: tools.length });
      }
      const { meta, resource, scopes } = await descubrir(c.url);
      const cli = await registrar(meta);
      const verifier = b64u(crypto.randomBytes(32)), challenge = b64u(crypto.createHash('sha256').update(verifier).digest()), state = b64u(crypto.randomBytes(18));
      await db.create(PEND, { email: lc(u.email), conector: c.id, verifier, client_id: cli.client_id, client_secret: cli.client_secret ? seal(cli.client_secret) : '', token_endpoint: meta.token_endpoint, resource, exp: Date.now() + 10 * 60000 }, u.email, state);
      const q = new URLSearchParams({ response_type: 'code', client_id: cli.client_id, redirect_uri: redirect(), code_challenge: challenge, code_challenge_method: 'S256', state, resource, ...(scopes.length ? { scope: scopes.join(' ') } : {}) });
      res.json({ url: `${meta.authorization_endpoint}?${q}` });
    } catch (e) { res.status(e.status && e.status < 500 ? e.status : 400).json({ error: e.message, code: e.code }); }
  });

  on('GET', 'conectores/callback', async (req, res) => {
    const volver = (q) => res.writeHead(302, { Location: `/?${q}#/ai/mcps` }).end();
    const u = await guard(req, res); if (!u) return;
    const state = String(req.query.state || ''), p = state ? await db.get(PEND, state) : null;
    if (!p || p.email !== lc(u.email) || p.exp < Date.now()) return volver('error=' + encodeURIComponent('El login venció. Vuelve a intentarlo.'));
    if (req.query.error) return volver('error=' + encodeURIComponent(String(req.query.error_description || req.query.error).slice(0, 160)));
    try {
      const form = new URLSearchParams({ grant_type: 'authorization_code', code: String(req.query.code || ''), redirect_uri: redirect(), client_id: p.client_id, code_verifier: p.verifier, ...(p.resource ? { resource: p.resource } : {}) });
      if (p.client_secret) form.set('client_secret', open(p.client_secret));
      const t = await pedirJSON(p.token_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form });
      if (!t.access_token) throw new Error('El servicio no entregó el permiso');
      const c = conectorDe(p.conector), id = idDe(u.email, p.conector), prev = await db.get(CONN, id);
      const data = { conector: p.conector, email: lc(u.email), url: c.url, access: seal(t.access_token), refresh: t.refresh_token ? seal(t.refresh_token) : '', expira: t.expires_in ? new Date(Date.now() + t.expires_in * 1000).toISOString() : '', token_endpoint: p.token_endpoint, client_id: p.client_id, client_secret: p.client_secret, resource: p.resource };
      if (prev) await db.update(CONN, id, data, prev.v, u.email); else await db.create(CONN, data, u.email, id);
      const { id: pid, v, _meta, ...resto } = p; await db.update(PEND, state, { ...resto, exp: 0 }, v, u.email).catch(() => {});
      volver('conectado=' + p.conector);
    } catch (e) { volver('error=' + encodeURIComponent(e.message.slice(0, 160))); }
  });

  on('POST', 'conectores/desconectar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const id = idDe(u.email, String(body(req).id || '')), d = await db.get(CONN, id);
    if (d) { const { id: x, v, _meta, ...data } = d; await db.update(CONN, id, { ...data, access: '', refresh: '', desconectado: new Date().toISOString() }, v, u.email); }
    res.json({ ok: true });
  });

  on('POST', 'conectores/probar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const cx = await conexion(u.email, String(body(req).id || ''));
    if (!cx?.token) return res.status(400).json({ error: 'No está conectado' });
    try { const { tools } = await listarTools(cx); res.json({ tools: tools.map((t) => ({ name: t.name, description: String(t.description || '').slice(0, 200) })) }); }
    catch (e) { res.status(e.status === 401 ? 401 : 400).json({ error: e.message }); }
  });
}
