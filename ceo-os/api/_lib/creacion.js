// App 01 · Marca › Crear › Formatos y Creación (servidor). Dos colecciones (área content), una marca por documento:
//   formats  { profile, nombre, tipo: reel|story|ficha, esqueleto, mejor_para, duracion, partes: [{ nombre, seg, que }], notas, ref (Research), de (base), archivado }
//   scripts  { profile, titulo, formato, avatar, angulo, consciencia, tramos: [{ nombre, seg, dice, pantalla, visual }], caption, estado, post, inspo, archivado }
// Las plantillas base viven en public/js/formatos.js (salen del método); aquí solo lo de cada marca. Nada se borra: se archiva.
// «Pasar a Ideas» crea (o pone al día) la pieza del calendario con el guion enlazado.
import * as db from './db.js';
import { guard, scoper, edits } from './access.js';
import { body } from './http.js';
import { COLL_F, COLL_G, BASE, limpiarFormato, limpiarGuion, tramosDe } from '../../public/js/formatos.js';
import { CONSCIENCIA } from '../../public/js/calendario-contenido.js';

const slugOk = (s) => /^[\w-]{2,60}$/.test(String(s || ''));
const completo = (u) => u.role === 'ceo' || !u.views || u.views.content !== 'resumen';
async function puedeVer(u, slug) {
  if (!slugOk(slug)) return false;
  if (slug === 'personal' && u.role !== 'ceo') return false;
  const sc = await scoper(u);
  return !sc || slug === 'inherent' || sc.client(slug);
}
async function abre(req, res, slug, write = false) {
  const u = await guard(req, res, 'content', { write }); if (!u) return null;
  if (!completo(u)) { res.status(403).json({ error: 'Tu vista de Contenido es «resumen»: solo el rendimiento' }); return null; }
  if (!(await puedeVer(u, slug))) { res.status(404).json({ error: 'Esa marca no está entre las tuyas' }); return null; }
  return u;
}
const deMarca = async (coll, slug) => (await db.list(coll)).filter((x) => x.profile === slug && !x.archivado);
const formatoDe = async (id) => BASE.find((f) => f.id === id) || (await db.get(COLL_F, id).catch(() => null));

export function rutas(on) {
  // ---------- Formatos ----------
  on('GET', 'formatos', async (req, res) => {
    const slug = String(req.query.profile || ''), u = await abre(req, res, slug); if (!u) return;
    res.json({ base: BASE, marca: await deMarca(COLL_F, slug), puede: { editar: edits(u, 'content') } });
  });
  on('POST', 'formatos', async (req, res) => {
    const b = body(req), slug = String(b.profile || ''), u = await abre(req, res, slug, true); if (!u) return;
    // Duplicar una base (o un formato de la marca) o empezar uno nuevo; desde un referente lleva su id en «ref».
    const src = b.de ? await formatoDe(String(b.de)) : null;
    const f = limpiarFormato({ ...(src ? { ...src, nombre: `${src.nombre} · ${b.marca || 'marca'}` } : {}), ...b, partes: b.partes || src?.partes || [], de: src?.id || null });
    if (!f.nombre) return res.status(400).json({ error: 'Ponle un nombre al formato' });
    if (!f.partes.length) return res.status(400).json({ error: 'El formato necesita al menos un tramo' });
    res.json(await db.create(COLL_F, { profile: slug, ...f }, u.email));
  });
  on('PUT', 'formatos/:id', async (req, res) => {
    const cur = await db.get(COLL_F, String(req.params.id || '')); if (!cur || cur.archivado) return res.status(404).json({ error: 'No existe (las plantillas base no se editan: duplícalas)' });
    const u = await abre(req, res, cur.profile, true); if (!u) return;
    const d = await db.update(COLL_F, cur.id, { ...cur, ...limpiarFormato({ ...cur, ...body(req) }) }, cur.v, u.email);
    if (!d) return res.status(409).json({ error: 'Alguien lo cambió justo ahora. Recarga y vuelve a intentar.' });
    res.json(d);
  });
  on('POST', 'formatos/:id/archivar', async (req, res) => {
    const cur = await db.get(COLL_F, String(req.params.id || '')); if (!cur || cur.archivado) return res.status(404).json({ error: 'No existe' });
    const u = await abre(req, res, cur.profile, true); if (!u) return;
    res.json({ ok: Boolean(await db.update(COLL_F, cur.id, { ...cur, archivado: true }, cur.v, u.email)) });
  });

  // ---------- Guiones ----------
  on('GET', 'guiones', async (req, res) => {
    const slug = String(req.query.profile || ''), u = await abre(req, res, slug); if (!u) return;
    const l = (await deMarca(COLL_G, slug)).sort((a, z) => String(z._meta?.updated_at || '').localeCompare(String(a._meta?.updated_at || '')));
    res.json({ guiones: l, puede: { editar: edits(u, 'content') } });
  });
  on('POST', 'guiones', async (req, res) => {
    const b = body(req), slug = String(b.profile || ''), u = await abre(req, res, slug, true); if (!u) return;
    const f = await formatoDe(String(b.formato || 'base-reel-acamara')); if (!f) return res.status(400).json({ error: 'Ese formato no existe' });
    const g = limpiarGuion({ ...b, formato: f.id, tramos: b.tramos?.length ? b.tramos : tramosDe(f) });
    if (!g.titulo) return res.status(400).json({ error: 'Ponle un título a la idea' });
    res.json(await db.create(COLL_G, { profile: slug, ...g }, u.email));
  });
  on('PUT', 'guiones/:id', async (req, res) => {
    const cur = await db.get(COLL_G, String(req.params.id || '')); if (!cur || cur.archivado) return res.status(404).json({ error: 'No existe' });
    const u = await abre(req, res, cur.profile, true); if (!u) return;
    const b = body(req), next = limpiarGuion({ ...cur, ...b });
    // Cambiar de formato: los tramos se reparten de nuevo (lo escrito se conserva por nombre de tramo).
    if (b.formato && b.formato !== cur.formato) { const f = await formatoDe(String(b.formato)); if (!f) return res.status(400).json({ error: 'Ese formato no existe' }); next.tramos = tramosDe(f).map((t) => ({ ...t, ...(cur.tramos || []).find((x) => x.nombre === t.nombre) || {}, nombre: t.nombre, seg: t.seg })); }
    const d = await db.update(COLL_G, cur.id, { ...cur, ...next }, cur.v, u.email);
    if (!d) return res.status(409).json({ error: 'Alguien lo cambió justo ahora. Recarga y vuelve a intentar.' });
    res.json(d);
  });
  on('POST', 'guiones/:id/archivar', async (req, res) => {
    const cur = await db.get(COLL_G, String(req.params.id || '')); if (!cur || cur.archivado) return res.status(404).json({ error: 'No existe' });
    const u = await abre(req, res, cur.profile, true); if (!u) return;
    res.json({ ok: Boolean(await db.update(COLL_G, cur.id, { ...cur, archivado: true }, cur.v, u.email)) });
  });
  // Pasar a Ideas: la pieza del calendario (colección content, kind «post») con el guion enlazado. Si ya existe, se pone al día.
  on('POST', 'guiones/:id/a-ideas', async (req, res) => {
    const g = await db.get(COLL_G, String(req.params.id || '')); if (!g || g.archivado) return res.status(404).json({ error: 'No existe' });
    const u = await abre(req, res, g.profile, true); if (!u) return;
    const f = await formatoDe(g.formato);
    const fmt = f?.tipo === 'story' ? 'Story' : 'Reel';
    const datos = { title: g.titulo, format: fmt, guion: g.id, ...(g.avatar ? { avatar: g.avatar } : {}), ...(g.angulo ? { angulo: g.angulo } : {}), ...(g.consciencia ? { consciencia: CONSCIENCIA[g.consciencia - 1] } : {}), ...(g.caption ? { caption: g.caption } : {}) };
    let post = g.post ? await db.get('content', g.post).catch(() => null) : null;
    if (post) post = await db.upsert('content', post.id, datos, u.email);
    else post = await db.create('content', { kind: 'post', profile: g.profile, status: 'Idea', ...datos }, u.email);
    if (g.post !== post.id) await db.update(COLL_G, g.id, { ...g, post: post.id }, g.v, u.email);
    res.json({ post });
  });
}
