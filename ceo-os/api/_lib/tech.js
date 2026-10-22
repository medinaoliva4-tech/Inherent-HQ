// App 01 · Marca › Tech (servidor): los sitios y herramientas de cada marca, su web viva y sus auditorías de SEO, en la
// colección «tech» (área content). Las reglas viven en public/js/tech.js.
// · Conectar una landing al CRM crea su fuente de leads (solo el CEO: las fuentes son suyas) y guarda la llave en el sitio.
// · La web viva la enciende solo el CEO, por marca. Encendida, /api/publico/<marca>/publicado entrega sin sesión lo que esa
//   marca ya publicó en redes (título, texto, fecha, formato y el link si es de una red pública). Apagada, responde 404.
import * as db from './db.js';
import { edits } from './access.js';
import { body } from './http.js';
import { abreMarca } from './creacion.js';
import * as leads from './leads.js';
import { marcaDe } from '../../public/js/element.js';
import { COLL_T, idViva, limpiarSitio, limpiarAuditoria, piezaPublica } from '../../public/js/tech.js';

const idOk = (s) => /^[\w-]{1,80}$/.test(String(s || ''));
const sinMeta = ({ id, v, _meta, ...d }) => d;
const ahora = () => new Date().toISOString();
const origen = () => (process.env.PUBLIC_URL || process.env.APP_URL || 'https://inherent-work.vercel.app').replace(/\/+$/, '');

export function rutas(on) {
  on('GET', 'tech', async (req, res) => {
    const slug = String(req.query.profile || ''), u = await abreMarca(req, res, slug); if (!u) return;
    const todo = (await db.list(COLL_T)).filter((x) => x.profile === slug && !x.archivado);
    res.json({ sitios: todo.filter((x) => x.kind === 'sitio'), auditorias: todo.filter((x) => x.kind === 'auditoria').sort((a, z) => String(z.fecha).localeCompare(String(a.fecha))),
      viva: todo.find((x) => x.id === idViva(slug)) || null, origen: origen(), puede: { editar: edits(u, 'content'), ceo: u.role === 'ceo' } });
  });
  on('POST', 'tech', async (req, res) => {
    const b = body(req), slug = String(b.profile || ''), u = await abreMarca(req, res, slug, true); if (!u) return;
    if (b.kind === 'auditoria') {
      const a = limpiarAuditoria({ fecha: new Date().toISOString().slice(0, 10), ...b });
      if (!a.resumen) return res.status(400).json({ error: 'Pega el resultado de la auditoría' });
      return res.json(await db.create(COLL_T, { profile: slug, ...a, por: u.email }, u.email));
    }
    const s = limpiarSitio(b); if (!s.nombre) return res.status(400).json({ error: 'Ponle un nombre' });
    res.json(await db.create(COLL_T, { profile: slug, ...s }, u.email));
  });
  on('PUT', 'tech/:id', async (req, res) => {
    const id = String(req.params.id || ''), cur = idOk(id) ? await db.get(COLL_T, id) : null;
    const u = await abreMarca(req, res, cur?.profile || 'sin-marca', true); if (!u) return;
    if (!cur || cur.kind !== 'sitio') return res.status(404).json({ error: 'Ese sitio ya no existe' });
    const b = body(req);
    const data = b.archivado ? { ...sinMeta(cur), archivado: true } : { ...sinMeta(cur), ...limpiarSitio({ ...cur, ...b }) };
    const out = await db.update(COLL_T, id, data, b.v ?? cur.v, u.email);
    if (!out) return res.status(409).json({ error: 'Alguien cambió este sitio justo ahora. Recarga y vuelve a intentar.' });
    res.json(out);
  });
  // La landing al CRM: crea su fuente de leads (tipo formulario) y deja la llave en el sitio. Solo el CEO.
  on('POST', 'tech/:id/conectar', async (req, res) => {
    const id = String(req.params.id || ''), cur = idOk(id) ? await db.get(COLL_T, id) : null;
    const u = await abreMarca(req, res, cur?.profile || 'sin-marca', true); if (!u) return;
    if (!cur || cur.kind !== 'sitio') return res.status(404).json({ error: 'Ese sitio ya no existe' });
    if (u.role !== 'ceo') return res.status(403).json({ error: 'Las fuentes de leads las crea el CEO' });
    if (cur.intake?.key) return res.json(cur);
    const src = await db.create('lead_sources', leads.cleanSource({ name: `${cur.nombre.toLowerCase().startsWith(cur.tipo.toLowerCase()) ? cur.nombre : `${cur.tipo} · ${cur.nombre}`} · ${marcaDe(cur.profile)}`, type: 'formulario', notes: `Formulario de ${cur.url || cur.nombre} (Marca › Tech)` }), u.email);
    res.json(await db.upsert(COLL_T, id, { intake: { key: src.key, fuente: src.id, nombre: src.name } }, u.email));
  });
  // Encender o apagar la web viva de una marca. Solo el CEO.
  on('PUT', 'tech/viva/:slug', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await abreMarca(req, res, slug, true); if (!u) return;
    if (u.role !== 'ceo') return res.status(403).json({ error: 'La web viva la enciende el CEO: publica sin sesión lo que la marca ya sacó en redes' });
    if (slug === 'personal') return res.status(400).json({ error: 'La marca personal no tiene web viva' });
    res.json(await db.upsert(COLL_T, idViva(slug), { profile: slug, kind: 'viva', on: body(req).on === true, por: u.email, en: ahora() }, u.email));
  });

  // ---------- Pública (sin sesión): lo que la marca ya publicó, para su web ----------
  on('OPTIONS', 'publico/:slug/publicado', async (req, res) => { cors(res); res.status(204).end(); });
  on('GET', 'publico/:slug/publicado', async (req, res) => {
    cors(res);
    const slug = String(req.params.slug || '');
    if (!/^[\w-]{2,60}$/.test(slug) || slug === 'personal') return res.status(404).json({ error: 'No existe' });
    const viva = await db.get(COLL_T, idViva(slug)).catch(() => null);
    if (!viva?.on) return res.status(404).json({ error: 'Esta marca no tiene la web viva encendida' });
    const piezas = (await db.list('content')).filter((p) => p.kind === 'post' && p.profile === slug && p.status === 'Publicado' && !p.archivado)
      .sort((a, z) => String(z.date || '').localeCompare(String(a.date || ''))).slice(0, 30).map(piezaPublica);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({ marca: marcaDe(slug), piezas });
  });
}
function cors(res) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); }
