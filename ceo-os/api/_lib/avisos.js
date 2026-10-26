// Los avisos al celular (web push): el OS instalado como app avisa cuando entra un lead y, cada mañana, lo que necesita atención.
//   GET  avisos/clave      → la clave pública (null si el servidor no tiene las claves VAPID)
//   POST avisos/suscribir  → guarda la suscripción de este dispositivo (team.<email>.push, hasta 5)
//   POST avisos/quitar     → la quita
//   POST avisos/probar     → manda un aviso de prueba a la persona
//   GET  cron/avisos       → el resumen de la mañana (Vercel Cron, con CRON_SECRET)
//   GET  avisos            → los Avisos de la persona (#/avisos y la campanita): Tu trabajo · Clientes · La plataforma
//   POST avisos            → posponer uno { clave, hasta, huella } o regresarlo { clave, volver: true } (team.<email>.avisos_pos)
// Las claves van en VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT (mailto:). Sin ellas, nada se rompe: el botón dice que falta configurarlo.
import webpush from 'web-push';
import * as db from './db.js';
import { guard, userFor, effective, viewsDoc, scoper } from './access.js';
import { body } from './http.js';
import { datosDe } from './avisos-datos.js';
import { REGLAS } from '../../public/js/avisos-reglas/index.js';
import { correr, aplicarPospuestos, posponer, contar, hoyGT } from '../../public/js/avisos-reglas/base.js';

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
// Entró un lead: a quien ve Ventas y lo tiene en su alcance (con «asignados», los de su rol), para responder en un minuto.
export async function nuevoLead(lead) {
  if (!listo() || !lead || lead.direction === 'out') return;
  try {
    for (const u of await conAvisos()) { if (!u.areas.includes('sales')) continue; const sc = await scoper(u); if (sc && !sc.leads(lead)) continue; await mandar(u.email, { title: 'Lead nuevo · responde en un minuto', body: [lead.name, lead.source].filter(Boolean).join(' · ').slice(0, 120), url: '/#/org/sales', tag: 'lead-' + lead.id }); }
  } catch (e) { console.error('aviso de lead', e.message); }
}
// La mañana: lo urgente de tus Avisos (lo mismo que ves en #/avisos, sin lo que pospusiste).
export async function resumenDiario(hoy = hoyGT()) {
  if (!listo()) return { mandados: 0 };
  let mandados = 0;
  for (const u of await conAvisos()) {
    const r = await avisosDe(u, hoy).catch(() => null); const urg = (r?.items || []).filter((x) => x.urgencia === 'alta'); if (!urg.length) continue;
    mandados += await mandar(u.email, { title: 'Hoy en Inherent OS', body: urg.length === 1 ? urg[0].titulo : `${urg.length} cosas urgentes · ${urg[0].titulo}`, url: '/#/avisos', tag: 'manana-' + hoy });
  }
  return { mandados };
}
// Los Avisos de una persona, ya sin los que pospuso. errores: reglas que fallaron (solo se le muestran al CEO).
export async function avisosDe(u, hoy = hoyGT()) {
  const { persona, datos } = await datosDe(u);
  const { items, errores } = correr(REGLAS, datos, persona, hoy);
  const { visibles, pospuestos } = aplicarPospuestos(items, datos.yo?.avisos_pos || {}, hoy);
  return { hoy, items: visibles, pospuestos, n: contar(visibles), errores, pos: datos.yo?.avisos_pos || {}, todos: items };
}

export function rutas(on) {
  on('GET', 'avisos', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await avisosDe(u);
    res.json({ hoy: r.hoy, items: r.items, pospuestos: r.pospuestos, n: r.n, ...(u.role === 'ceo' && r.errores.length ? { errores: r.errores } : {}) });
  });
  on('POST', 'avisos', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const b = body(req), clave = String(b.clave || '').slice(0, 160); if (!clave) return res.status(400).json({ error: 'Falta el aviso' });
    const r = await avisosDe(u);
    const out = posponer(r.pos, { clave, hasta: b.hasta, huella: b.huella, volver: Boolean(b.volver) }, r.todos.find((x) => x.clave === clave), r.hoy);
    if (out.error) return res.status(400).json({ error: out.error });
    await db.upsert('team', u.email, { avisos_pos: out.pos }, u.email);
    res.json({ ok: true, hasta: out.pos[clave]?.hasta || null });
  });
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
