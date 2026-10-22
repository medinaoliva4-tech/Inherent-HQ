// El primer día y los videos «Cómo se usa» (servidor).
//   GET  guia                → los documentos de la Library marcados como «Cómo se usa» de una sección (id, título, link, sección, orden, perfiles, cuerpo)
//   POST guia/visto          → anota que esta persona vio ese video (team.<email>.vistos)
//   GET  me/primer-dia       → cómo va el recorrido del primer día + si ya hizo la prueba final (creó algo en el OS)
//   PUT  me/primer-dia       → guarda el paso, lo hecho, si lo pausó y cuándo lo terminó
// Los documentos de la Library los puede ver todo el equipo (no el cliente); lo que ve cada quien de la Library como tal sigue en su puerta.
import * as db from './db.js';
import { guard } from './access.js';
import { body } from './http.js';

import { SECCIONES } from '../../public/js/guia-secciones.js';

const CLAVES = new Set(SECCIONES.map(([k]) => k));

const recorte = (d) => ({ id: d.id, title: d.title, url: d.url || '', guia: d.guia, orden: Number(d.orden) || 0, roles: d.roles || [], body: String(d.body || '').slice(0, 6000), kind: d.kind || 'Doc' });

export async function guias() {
  return (await db.list('docs')).filter((d) => d.guia && CLAVES.has(d.guia)).map(recorte).sort((a, b) => a.orden - b.orden || a.title.localeCompare(b.title));
}

// La prueba final del primer día: la persona ya creó algo en el OS (una pieza, una idea, una tarea, un lead…).
async function hizoPrueba(email) {
  for (const coll of ['content', 'tasks', 'leads', 'projects']) {
    const xs = await db.list(coll).catch(() => []);
    if (xs.some((x) => x._meta?.created_by === email)) return true;
  }
  return false;
}

export function rutas(on) {
  on('GET', 'guia', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const t = await db.get('team', u.email);
    res.json({ items: await guias(), vistos: t?.vistos || {} });
  });
  on('POST', 'guia/visto', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const id = String(body(req).id || ''); if (!id) return res.status(400).json({ error: 'Falta el video' });
    const t = await db.get('team', u.email);
    const vistos = { ...(t?.vistos || {}), [id]: new Date().toISOString() };
    await db.upsert('team', u.email, { vistos }, u.email);
    res.json({ ok: true, vistos });
  });
  on('GET', 'me/primer-dia', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const t = await db.get('team', u.email);
    res.json({ ...(t?.primer_dia || {}), prueba: await hizoPrueba(u.email) });
  });
  on('PUT', 'me/primer-dia', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const b = body(req), t = await db.get('team', u.email), prev = t?.primer_dia || {};
    const primer_dia = { paso: Math.max(0, Math.min(9, Number(b.paso) || 0)), hechos: { ...(prev.hechos || {}), ...Object.fromEntries(Object.entries(b.hechos || {}).map(([k, v]) => [String(k).slice(0, 20), Boolean(v)])) }, pausado: Boolean(b.pausado), hecho_at: b.hecho_at ? new Date().toISOString() : prev.hecho_at || null };
    await db.upsert('team', u.email, { primer_dia }, u.email);
    res.json({ ok: true, primer_dia });
  });
}
