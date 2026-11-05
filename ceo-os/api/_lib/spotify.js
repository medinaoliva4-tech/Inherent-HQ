// Spotify: controla el reproductor que ya tienes abierto. Sin secreto: OAuth con PKCE y el permiso cifrado por persona.
// Colecciones propias: spotify_conexiones (por correo) y spotify_pendientes (el login a medias, 10 min).
import crypto from 'node:crypto';
import * as db from './db.js';
import { guard } from './access.js';
import { body } from './http.js';
import { seal, open } from './vault.js';
import { ACCIONES, leerReproduccion } from '../../public/js/spotify-datos.js';

const CONN = 'spotify_conexiones', PEND = 'spotify_pendientes';
const CLIENT = () => (process.env.SPOTIFY_CLIENT_ID || '70d9110fca724c03b737e631460e968f').trim();
const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
const lc = (x) => String(x || '').toLowerCase();
const b64u = (b) => Buffer.from(b).toString('base64url');
const base = () => String(process.env.APP_URL || 'http://127.0.0.1:3000').trim().replace(/\/+$/, '');
const redirect = () => `${base()}/api/spotify/callback`;

async function guardar(email, t, prev) {
  const data = { email: lc(email), access: seal(t.access_token), refresh: t.refresh_token ? seal(t.refresh_token) : prev?.refresh || '', expira: Date.now() + (t.expires_in || 3600) * 1000 };
  if (prev) await db.update(CONN, lc(email), data, prev.v, email); else await db.create(CONN, data, email, lc(email));
}
async function pedirToken(form) {
  const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: CLIENT(), ...form }), signal: AbortSignal.timeout(12000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw Object.assign(new Error('Spotify no dio el permiso'), { status: 502 });
  return j;
}
async function permiso(email) {
  const c = await db.get(CONN, lc(email));
  if (!c?.refresh) return null;
  if (c.expira > Date.now() + 30000) return open(c.access);
  const t = await pedirToken({ grant_type: 'refresh_token', refresh_token: open(c.refresh) });
  await guardar(email, t, c);
  return t.access_token;
}
const llamar = (token, ruta, init = {}) => fetch(`https://api.spotify.com/v1/me/player${ruta}`, { ...init, headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });

export function rutas(on) {
  on('POST', 'spotify/conectar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const verifier = b64u(crypto.randomBytes(48)), state = b64u(crypto.randomBytes(18)), challenge = b64u(crypto.createHash('sha256').update(verifier).digest());
    await db.create(PEND, { email: lc(u.email), verifier: seal(verifier), exp: Date.now() + 600000 }, u.email, state);
    const q = new URLSearchParams({ response_type: 'code', client_id: CLIENT(), redirect_uri: redirect(), scope: SCOPES, state, code_challenge_method: 'S256', code_challenge: challenge });
    res.json({ url: `https://accounts.spotify.com/authorize?${q}` });
  });
  on('GET', 'spotify/callback', async (req, res) => {
    // Sin sesión a propósito: en la app de Mac el login abre en el navegador. El state, secreto y de un solo uso, dice de quién es.
    const volver = (q) => res.writeHead(302, { Location: `/?${q}#/home` }).end();
    const state = String(req.query.state || ''), p = state ? await db.get(PEND, state) : null;
    if (!p || !p.exp || p.exp < Date.now()) return volver('spotify=vencido');
    if (req.query.error) return volver('spotify=cancelado');
    try {
      const t = await pedirToken({ grant_type: 'authorization_code', code: String(req.query.code || ''), redirect_uri: redirect(), code_verifier: open(p.verifier) });
      await guardar(p.email, t, await db.get(CONN, p.email));
      const { id, v, _meta, ...resto } = p; await db.update(PEND, state, { ...resto, exp: 0 }, v, p.email).catch(() => {});
      volver('spotify=listo');
    } catch { volver('spotify=error'); }
  });
  on('GET', 'spotify/estado', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const t = await permiso(u.email);
    if (!t) return res.json({ conectado: false });
    const r = await llamar(t, '');
    if (r.status === 204) return res.json({ conectado: true, ...leerReproduccion(null) });
    if (!r.ok) return res.json({ conectado: true, ...leerReproduccion(null), aviso: r.status === 403 ? 'Spotify pide Premium o acceso a esta app.' : 'Spotify no respondió.' });
    res.json({ conectado: true, ...leerReproduccion(await r.json()) });
  });
  on('POST', 'spotify/accion', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const a = ACCIONES[String(body(req).accion || '')]; if (!a) return res.status(400).json({ error: 'Acción no válida' });
    const t = await permiso(u.email); if (!t) return res.status(409).json({ error: 'Conecta Spotify primero' });
    const r = await llamar(t, `/${a[1]}`, { method: a[0] });
    if (r.status === 404) return res.status(409).json({ error: 'Abre Spotify en algún equipo y dale play una vez.' });
    if (!r.ok && r.status !== 202 && r.status !== 204) return res.status(502).json({ error: r.status === 403 ? 'Spotify pide Premium para esto.' : 'Spotify no respondió.' });
    res.json({ ok: true });
  });
  on('POST', 'spotify/desconectar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const c = await db.get(CONN, lc(u.email));
    if (c) { const { id, v, _meta, ...d } = c; await db.update(CONN, lc(u.email), { ...d, access: '', refresh: '' }, v, u.email); }
    res.json({ ok: true });
  });
}
