// Conectar Inherent OS como cualquier conector MCP: la persona pega `https://<app>/mcp` en Claude,
// ChatGPT, Claude Code o Codex, la app abre Inherent OS, la persona entra con su Google y le da «Permitir».
// Es OAuth 2.1 con PKCE (lo que pide el estándar MCP): registro dinámico de la app, código de un solo uso
// y tokens que se guardan solo como hash. Cada «Permitir» es un permiso (grant) que se puede revocar.
import crypto from 'node:crypto';
import * as db from './db.js';

const H = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
const rnd = (n = 32) => crypto.randomBytes(n).toString('base64url');
const now = () => Date.now();
const ACCESS_TTL = 7 * 864e5, REFRESH_TTL = 180 * 864e5, CODE_TTL = 5 * 60e3, REQ_TTL = 15 * 60e3;
const getJ = async (k) => { const v = await db.vaultGet(k); if (!v) return null; try { return JSON.parse(v); } catch { return null; } };
const setJ = (k, o) => db.vaultSet(k, o ? JSON.stringify(o) : '');

export const SCOPE = 'inherent';
export const meta = (base) => ({
  issuer: base,
  authorization_endpoint: `${base}/api/oauth/authorize`,
  token_endpoint: `${base}/api/oauth/token`,
  registration_endpoint: `${base}/api/oauth/register`,
  revocation_endpoint: `${base}/api/oauth/revoke`,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none'],
  scopes_supported: [SCOPE],
  client_id_metadata_document_supported: true,
});
export const resourceMeta = (base) => ({ resource: `${base}/mcp`, authorization_servers: [base], bearer_methods_supported: ['header'], scopes_supported: [SCOPE], resource_name: 'Inherent OS' });

// Solo https, o localhost para las apps de escritorio y terminal (Claude Code, Codex).
const okRedirect = (u) => { try { const x = new URL(u); return x.protocol === 'https:' || (x.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(x.hostname)); } catch { return false; } };
const clean = (s, n = 80) => String(s || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);

// Registro dinámico (RFC 7591): la app se presenta y recibe su client_id. No hay secreto: protege PKCE.
export async function register(b = {}) {
  const uris = Array.isArray(b.redirect_uris) ? b.redirect_uris.map(String).slice(0, 10) : [];
  if (!uris.length || !uris.every(okRedirect)) return { status: 400, json: { error: 'invalid_redirect_uri', error_description: 'redirect_uris debe tener URLs https (o localhost)' } };
  const client_id = 'ios_' + rnd(18);
  const c = { client_id, client_name: clean(b.client_name) || 'App', redirect_uris: uris, at: new Date().toISOString() };
  await setJ('oclient:' + client_id, c);
  return { status: 201, json: { ...c, client_id_issued_at: Math.floor(now() / 1000), token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], scope: SCOPE } };
}

// La app también puede presentarse con un documento propio (client_id = URL https con su metadata).
async function clientOf(id) {
  if (/^ios_[\w-]{10,40}$/.test(id)) return getJ('oclient:' + id);
  if (!/^https:\/\//.test(id) || id.length > 400) return null;
  try {
    const r = await fetch(id, { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' }, redirect: 'error' });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.client_id !== id || !Array.isArray(d.redirect_uris)) return null;
    return { client_id: id, client_name: clean(d.client_name) || new URL(id).hostname, redirect_uris: d.redirect_uris.map(String).filter(okRedirect).slice(0, 10) };
  } catch { return null; }
}

// Paso 1: la app manda a la persona aquí. Se valida y se guarda la solicitud; la pantalla de «Permitir»
// vive en la app (`/?connect=<id>`), que primero pide entrar con Google si hace falta.
export async function authorize(q) {
  const c = await clientOf(String(q.client_id || ''));
  if (!c) return { error: 'La app que intenta conectarse no está registrada. Vuelve a agregar el conector.' };
  const ru = String(q.redirect_uri || (c.redirect_uris.length === 1 ? c.redirect_uris[0] : ''));
  if (!c.redirect_uris.includes(ru)) return { error: 'La dirección de regreso de la app no coincide. Vuelve a agregar el conector.' };
  const back = (error) => { const u = new URL(ru); u.searchParams.set('error', error); if (q.state) u.searchParams.set('state', String(q.state)); return { redirect: u.toString() }; };
  if (q.response_type !== 'code') return back('unsupported_response_type');
  if (!q.code_challenge || (q.code_challenge_method || 'plain') !== 'S256') return back('invalid_request');
  const id = rnd(18);
  await setJ('oreq:' + id, { client_id: c.client_id, client_name: c.client_name, redirect_uri: ru, state: q.state ? String(q.state).slice(0, 500) : null, challenge: String(q.code_challenge).slice(0, 200), exp: now() + REQ_TTL });
  return { id };
}

export async function request(id) {
  if (!/^[\w-]{20,40}$/.test(String(id || ''))) return null;
  const r = await getJ('oreq:' + id);
  return r && r.exp > now() ? r : null;
}

// Paso 2: la persona (ya con sesión) dice «Permitir» o «Cancelar». Devuelve a dónde mandar el navegador.
export async function decide(id, email, allow) {
  const r = await request(id); if (!r) return null;
  await setJ('oreq:' + id, null);
  const u = new URL(r.redirect_uri);
  if (r.state) u.searchParams.set('state', r.state);
  if (!allow) { u.searchParams.set('error', 'access_denied'); return u.toString(); }
  const code = rnd(32);
  await setJ('ocode:' + H(code), { email, client_id: r.client_id, client_name: r.client_name, redirect_uri: r.redirect_uri, challenge: r.challenge, exp: now() + CODE_TTL });
  u.searchParams.set('code', code);
  return u.toString();
}

async function issue(g, email) {
  const access = rnd(32), refresh = rnd(32);
  await setJ('oat:' + H(access), { g, email, exp: now() + ACCESS_TTL });
  await setJ('ort:' + H(refresh), { g, email, exp: now() + REFRESH_TTL });
  return { status: 200, json: { access_token: access, token_type: 'Bearer', expires_in: ACCESS_TTL / 1000, refresh_token: refresh, scope: SCOPE } };
}
const bad = (error, error_description) => ({ status: 400, json: { error, ...(error_description ? { error_description } : {}) } });

// Paso 3: la app cambia el código por sus tokens (con el verificador PKCE), o renueva con el refresh.
export async function token(b = {}) {
  if (b.grant_type === 'authorization_code') {
    const k = 'ocode:' + H(b.code || ''); const c = await getJ(k);
    if (!c || c.exp < now()) return bad('invalid_grant', 'Código vencido o ya usado');
    await setJ(k, null); // un solo uso
    if (b.client_id && b.client_id !== c.client_id) return bad('invalid_grant');
    if (b.redirect_uri && b.redirect_uri !== c.redirect_uri) return bad('invalid_grant');
    if (!b.code_verifier || crypto.createHash('sha256').update(String(b.code_verifier)).digest('base64url') !== c.challenge) return bad('invalid_grant', 'PKCE no coincide');
    const g = rnd(12);
    await setJ('ogrant:' + g, { email: c.email, client_id: c.client_id, name: c.client_name, at: new Date().toISOString() });
    const me = await db.get('team', c.email);
    await db.upsert('team', c.email, { mcp_grants: [...(me?.mcp_grants || []).filter((x) => x.client_id !== c.client_id), { g, client_id: c.client_id, name: c.client_name, at: new Date().toISOString() }].slice(-12) }, c.email);
    return issue(g, c.email);
  }
  if (b.grant_type === 'refresh_token') {
    const k = 'ort:' + H(b.refresh_token || ''); const r = await getJ(k);
    if (!r || r.exp < now() || !(await getJ('ogrant:' + r.g))) return bad('invalid_grant');
    await setJ(k, null); // rotación: cada refresh sirve una vez
    return issue(r.g, r.email);
  }
  return bad('unsupported_grant_type');
}

// El Bearer que manda la app → el correo de la persona (si el permiso sigue vivo).
export async function emailOf(bearer) {
  if (!/^[\w-]{30,60}$/.test(String(bearer || ''))) return null;
  const t = await getJ('oat:' + H(bearer));
  if (!t || t.exp < now()) return null;
  const g = await getJ('ogrant:' + t.g);
  return g && g.email === t.email ? t.email : null;
}

export async function revokeToken(tok) {
  for (const p of ['oat:', 'ort:']) { const t = await getJ(p + H(tok || '')); if (t) await setJ(p + H(tok), null); }
}

// Desconectar: corta todas las apps de la persona (o solo una).
export async function revokeAll(email, g) {
  const me = await db.get('team', email);
  const all = me?.mcp_grants || [];
  for (const x of all) if (!g || x.g === g) await setJ('ogrant:' + x.g, null);
  await db.upsert('team', email, { mcp_grants: g ? all.filter((x) => x.g !== g) : [] }, email);
}
