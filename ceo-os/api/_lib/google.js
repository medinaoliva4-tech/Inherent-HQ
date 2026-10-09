// Google: login (solo @dominio), y acceso a Calendar y Drive con el permiso que dio cada persona.
import crypto from 'node:crypto';
import * as db from './db.js';
import { seal, open } from './vault.js';
import { domain } from './access.js';

export const SCOPES = [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive',
];
const cfg = () => {
  const id = process.env.GOOGLE_CLIENT_ID?.trim(), secret = process.env.GOOGLE_CLIENT_SECRET?.trim(), app = process.env.APP_URL?.trim();
  if (!id || !secret || !app) throw Object.assign(new Error('Falta configurar Google (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL)'), { code: 'NO_GOOGLE' });
  return { id, secret, redirect: `${app.replace(/\/$/, '')}/api/auth/callback` };
};
export const configured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.APP_URL);

export function authUrl(state) {
  const c = cfg();
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  Object.entries({
    client_id: c.id, redirect_uri: c.redirect, response_type: 'code', scope: SCOPES.join(' '),
    access_type: 'offline', include_granted_scopes: 'true', prompt: 'consent select_account', hd: domain(), state,
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}

async function token(params) {
  const c = cfg();
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: c.id, client_secret: c.secret, ...params }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Google token ${r.status}: ${j.error || ''}`);
  return j;
}

// Canjea el código y valida la identidad con Google. Devuelve el perfil solo si es del dominio.
export async function finishLogin(code) {
  const c = cfg();
  const t = await token({ code, redirect_uri: c.redirect, grant_type: 'authorization_code' });
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(t.id_token));
  const info = await r.json();
  const email = String(info.email || '').toLowerCase();
  const ok = r.ok && info.aud === c.id && ['accounts.google.com', 'https://accounts.google.com'].includes(info.iss)
    && String(info.email_verified) === 'true' && info.hd === domain() && email.endsWith('@' + domain());
  if (!ok) return null;
  if (t.refresh_token) await db.vaultSet('google:' + email, seal(t.refresh_token));
  return { email, name: info.name || email, picture: info.picture || null, scopes: String(t.scope || '').split(' ') };
}

const cache = new Map();
export async function accessToken(email) {
  const hit = cache.get(email);
  if (hit && hit.exp > Date.now() + 60_000) return hit.token;
  const sealed = await db.vaultGet('google:' + email);
  if (!sealed) throw Object.assign(new Error('Conecta tu cuenta de Google de nuevo'), { code: 'NO_GOOGLE_TOKEN' });
  const t = await token({ refresh_token: open(sealed), grant_type: 'refresh_token' });
  cache.set(email, { token: t.access_token, exp: Date.now() + t.expires_in * 1000 });
  return t.access_token;
}

export async function gapi(email, url, init = {}) {
  const r = await fetch(url, { ...init, headers: { Authorization: 'Bearer ' + (await accessToken(email)), 'Content-Type': 'application/json', ...(init.headers || {}) } });
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error?.message || `Google ${r.status}`), { status: r.status });
  return j;
}

export const newState = () => crypto.randomBytes(18).toString('base64url');
