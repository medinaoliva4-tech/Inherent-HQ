// Los avisos al celular (web push): el OS instalado como app avisa cuando entra un lead y, cada mañana, lo que necesita atención.
//   GET  avisos/clave      → la clave pública (null si el servidor no tiene las claves VAPID)
//   POST avisos/suscribir  → guarda la suscripción de este dispositivo (team.<email>.push, hasta 5)
//   POST avisos/quitar     → la quita
//   POST avisos/probar     → manda un aviso de prueba a la persona
//   GET  cron/avisos       → el resumen de la mañana (Vercel Cron, con CRON_SECRET)
// Las claves van en VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT (mailto:). Sin ellas, nada se rompe: el botón dice que falta configurarlo.
import webpush from 'web-push';
import * as db from './db.js';
import { guard, userFor, effective, viewsDoc } from './access.js';
import { body } from './http.js';
import { isWaiting } from '../../public/js/ventas-flujo.js';

export const listo = () => Boolean(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
let configurado = false;
function conf() {
  if (!listo()) return false;
  if (!configurado) { webpush.setVapidDetails(process.env.VAPID_SUBJECT?.trim() || 'mailto:hola@inherentglobal.com', process.env.VAPID_PUBLIC_KEY.trim(), process.env.VAPID_PRIVATE_KEY.trim()); configurado = true; }
  return true;
}
const subOk = (s) => s && typeof s.endpoint === 'string' && /^https:\/\//.test(s.endpoint) && s.keys?.p256dh && s.keys?.auth;

// Manda un aviso a todos los dispositivos de una persona. Las suscripciones muertas (404/410) se olvidan solas.
export async function mandar(email, aviso) {
  if (!conf()) return 0;
  const t = await db.get('team', email); const subs = (t?.push || []).filter(subOk); if (!subs.length) return 0;
  const vivas = []; let n = 0;
  for (const s of subs) {
    try { await webpush.sendNotification(s, JSON.stringify({ title: String(aviso.title || 'Inherent OS').slice(0, 80), body: String(aviso.body || '').slice(0, 200), url: String(aviso.url || '/'), tag: aviso.tag || '' }), { TTL: 6 * 3600 }); vivas.push(s); n++; }
    catch (e) { if (![404, 410].includes(e.statusCode)) vivas.push(s); }
  }
  if (vivas.length !== subs.length) await db.upsert('team', email, { push: vivas }, 'sistema');
  return n;
}
// Quién tiene avisos encendidos, con su perfil aplicado (áreas y vistas).
async function conAvisos() {
  const vd = await viewsDoc();
  const out = [];
  for (const t of (await db.list('team')).filter((x) => x.role !== 'client' && x.active !== false && (x.push || []).some(subOk))) {
    try { out.push(effective(await userFor(t.email || t.id), vd)); } catch {}
  }
  return out;
}
// Entró un lead: a quien ve Ventas, para responder en un minuto.
export async function nuevoLead(lead) {
  if (!listo() || !lead || lead.direction === 'out') return;
  try {
    for (const u of await conAvisos()) if (u.areas.includes('sales')) await mandar(u.email, { title: 'Lead nuevo · responde en un minuto', body: [lead.name, lead.source].filter(Boolean).join(' · ').slice(0, 120), url: '/#/org/sales', tag: 'lead-' + lead.id });
  } catch (e) { console.error('aviso de lead', e.message); }
}
// La mañana: tus tareas de hoy o vencidas y los leads sin responder (si ves Ventas).
export async function resumenDiario(hoy = new Date().toISOString().slice(0, 10)) {
  if (!listo()) return { mandados: 0 };
  const [tasks, leads] = await Promise.all([db.list('tasks'), db.list('leads')]);
  const esperando = leads.filter(isWaiting).length;
  let mandados = 0;
  for (const u of await conAvisos()) {
    const mias = tasks.filter((t) => String(t.assignee || '').toLowerCase() === u.email && t.status !== 'Hecha' && t.due && t.due <= hoy);
    const partes = [mias.length ? `${mias.length} ${mias.length === 1 ? 'tarea' : 'tareas'} para hoy` : '', u.areas.includes('sales') && esperando ? `${esperando} ${esperando === 1 ? 'lead sin responder' : 'leads sin responder'}` : ''].filter(Boolean);
    if (!partes.length) continue;
    mandados += await mandar(u.email, { title: 'Hoy en Inherent OS', body: partes.join(' · '), url: u.areas.includes('home') ? '/#/org/home' : '/#/org/work', tag: 'manana-' + hoy });
  }
  return { mandados };
}

export function rutas(on) {
  on('GET', 'avisos/clave', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const t = await db.get('team', u.email);
    res.json({ clave: listo() ? process.env.VAPID_PUBLIC_KEY.trim() : null, dispositivos: (t?.push || []).filter(subOk).map((s) => s.endpoint) });
  });
  on('POST', 'avisos/suscribir', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = body(req).sub; if (!subOk(s)) return res.status(400).json({ error: 'Suscripción inválida' });
    const t = await db.get('team', u.email);
    const push = [{ endpoint: s.endpoint, expirationTime: s.expirationTime || null, keys: { p256dh: String(s.keys.p256dh), auth: String(s.keys.auth) } }, ...(t?.push || []).filter((x) => subOk(x) && x.endpoint !== s.endpoint)].slice(0, 5);
    await db.upsert('team', u.email, { push }, u.email);
    res.json({ ok: true, dispositivos: push.length });
  });
  on('POST', 'avisos/quitar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const endpoint = String(body(req).endpoint || ''), t = await db.get('team', u.email);
    const push = (t?.push || []).filter((x) => subOk(x) && x.endpoint !== endpoint);
    await db.upsert('team', u.email, { push }, u.email);
    res.json({ ok: true, dispositivos: push.length });
  });
  on('POST', 'avisos/probar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (!listo()) return res.status(503).json({ error: 'Faltan las claves de avisos en el servidor (VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY)' });
    res.json({ ok: true, mandados: await mandar(u.email, { title: 'Inherent OS', body: 'Así se ven los avisos. Listo ✓', url: '/#/me', tag: 'prueba' }) });
  });
  on('GET', 'cron/avisos', async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado' });
    res.json(await resumenDiario());
  });
}
