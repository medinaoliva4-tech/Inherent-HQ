// Spotify: controla el reproductor que ya tienes abierto. Sin secreto: OAuth con PKCE y el permiso cifrado por persona.
// Colecciones propias: spotify_conexiones (por correo) y spotify_pendientes (el login a medias, 10 min).
import crypto from 'node:crypto';
import * as db from './db.js';
import { guard } from './access.js';
import { body } from './http.js';
import { seal, open } from './vault.js';
import { rutaAccion, leerReproduccion, motivoSpotify, idEquipo, elegirEquipo, rutaPortada, fotoPermitida, leerEquipos } from '../../public/js/spotify-datos.js';

const CONN = 'spotify_conexiones', PEND = 'spotify_pendientes';
const CLIENT = () => (process.env.SPOTIFY_CLIENT_ID || '70d9110fca724c03b737e631460e968f').trim();
const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming user-read-email user-read-private';
const lc = (x) => String(x || '').toLowerCase();
const b64u = (b) => Buffer.from(b).toString('base64url');
const base = () => String(process.env.APP_URL || 'http://127.0.0.1:3000').trim().replace(/\/+$/, '');
const redirect = () => `${base()}/api/spotify/callback`;

async function guardar(email, t, prev) {
  const data = { email: lc(email), access: seal(t.access_token), refresh: t.refresh_token ? seal(t.refresh_token) : prev?.refresh || '', scope: t.scope || prev?.scope || '', expira: Date.now() + (t.expires_in || 3600) * 1000 };
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
const llamar = (token, ruta, init = {}) => fetch(`https://api.spotify.com/v1/me/player${ruta}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers }, signal: AbortSignal.timeout(10000) });

// Si Spotify no trae la foto, se pide a su página pública. Se recuerda por canción.
const fotos = new Map();
async function conPortada(r) {
  const { enlace, ...resto } = r;
  let u = r.portada;
  if (!u && enlace) {
    if (fotos.has(enlace)) u = fotos.get(enlace);
    else {
      const o = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(enlace)}`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
      u = o?.ok ? (await o.json().catch(() => ({}))).thumbnail_url || '' : '';
      if (fotos.size > 200) fotos.clear();
      fotos.set(enlace, u);
    }
  }
  return { ...resto, portada: rutaPortada(u) };
}
// Pasa la música a un equipo y sigue donde iba.
const pasarA = (token, id) => llamar(token, '', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_ids: [id], play: true }) });

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
    const streaming = /\bstreaming\b/.test((await db.get(CONN, lc(u.email)))?.scope || ''), r = await llamar(t, '');
    if (r.status === 204) return res.json({ conectado: true, streaming, ...leerReproduccion(null) });
    if (!r.ok) return res.json({ conectado: true, streaming, ...leerReproduccion(null), aviso: r.status === 403 ? 'Spotify pide Premium o acceso a esta app.' : 'Spotify no respondió.' });
    res.json({ conectado: true, streaming, ...(await conPortada(leerReproduccion(await r.json()))) });
  });
  on('GET', 'spotify/portada', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const url = String(req.query.u || '');
    if (!fotoPermitida(url)) return res.status(400).json({ error: 'Foto no válida' });
    const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(8000) }).catch(() => null), tipo = r?.headers.get('content-type') || '';
    if (!r?.ok || !tipo.startsWith('image/')) return res.status(502).json({ error: 'Sin foto' });
    res.setHeader('Content-Type', tipo); res.setHeader('Cache-Control', 'private, max-age=86400');
    res.end(Buffer.from(await r.arrayBuffer()));
  });
  on('GET', 'spotify/equipos', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const t = await permiso(u.email); if (!t) return res.json({ equipos: [] });
    const r = await llamar(t, '/devices').catch(() => null);
    res.json({ equipos: r?.ok ? leerEquipos(await r.json()) : [] });
  });
  // El reproductor del navegador pide su permiso aquí: es de la misma persona y dura una hora.
  on('GET', 'spotify/token', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const t = await permiso(u.email);
    if (!t) return res.status(409).json({ error: 'Conecta Spotify primero' });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ token: t });
  });
  on('POST', 'spotify/accion', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const b = body(req), accion = String(b.accion || ''), ruta = rutaAccion(accion, b.valor);
    if (!ruta) return res.status(400).json({ error: 'Acción no válida' });
    try {
      const t = await permiso(u.email); if (!t) return res.status(409).json({ error: 'Conecta Spotify primero' });
      const equipo = accion === 'play' ? idEquipo(b.dispositivo) : '';
      let r = equipo ? await pasarA(t, equipo) : await llamar(t, `/${ruta[1]}`, { method: ruta[0] });
      if (r.status === 404 && accion === 'play' && !equipo) {
        // Sin equipo activo: pasa la música al primero que Spotify tenga abierto.
        const d = await llamar(t, '/devices'), lista = d.ok ? (await d.json()).devices || [] : [];
        const elegido = elegirEquipo(lista);
        if (!elegido) return res.status(409).json({ error: motivoSpotify(404, ''), code: 'SIN_EQUIPO' });
        r = await pasarA(t, elegido.id);
      }
      if (r.ok) return res.json({ ok: true });
      const j = await r.json().catch(() => ({})), razon = j.error?.reason || '';
      console.error('spotify/accion', accion, r.status, razon);
      res.status(409).json({ error: motivoSpotify(r.status, razon), code: razon || undefined });
    } catch (e) {
      console.error('spotify/accion', accion, e.name);
      res.status(409).json({ error: motivoSpotify(0, '') });
    }
  });
  on('POST', 'spotify/desconectar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const c = await db.get(CONN, lc(u.email));
    if (c) { const { id, v, _meta, ...d } = c; await db.update(CONN, lc(u.email), { ...d, access: '', refresh: '' }, v, u.email); }
    res.json({ ok: true });
  });
}
