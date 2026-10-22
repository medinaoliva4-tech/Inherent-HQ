// App 01 · Marca › Diseño › Video (servidor): el kit de edición de la marca y sus fichas de video, en la colección «videos»
// (área content). Las reglas viven en public/js/video.js. Nada se borra: una ficha se archiva.
import * as db from './db.js';
import { edits } from './access.js';
import { body } from './http.js';
import { abreMarca } from './creacion.js';
import { COLL_V, idKit, limpiarKit, limpiarFicha } from '../../public/js/video.js';

const idOk = (s) => /^[\w-]{1,80}$/.test(String(s || ''));
const sinMeta = ({ id, v, _meta, ...d }) => d;

export function rutas(on) {
  on('GET', 'video', async (req, res) => {
    const slug = String(req.query.profile || ''), u = await abreMarca(req, res, slug); if (!u) return;
    const todo = (await db.list(COLL_V)).filter((x) => x.profile === slug);
    res.json({ kit: todo.find((x) => x.id === idKit(slug)) || null, fichas: todo.filter((x) => x.kind === 'ficha' && !x.archivado), puede: { editar: edits(u, 'content') } });
  });
  on('PUT', 'video/kit/:slug', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await abreMarca(req, res, slug, true); if (!u) return;
    res.json(await db.upsert(COLL_V, idKit(slug), { profile: slug, kind: 'kit', ...limpiarKit(body(req)) }, u.email));
  });
  on('POST', 'video', async (req, res) => {
    const b = body(req), slug = String(b.profile || ''), u = await abreMarca(req, res, slug, true); if (!u) return;
    const f = limpiarFicha(b); if (!f.titulo) return res.status(400).json({ error: 'Ponle un título al video' });
    res.json(await db.create(COLL_V, { profile: slug, kind: 'ficha', ...f }, u.email));
  });
  on('PUT', 'video/:id', async (req, res) => {
    const id = String(req.params.id || ''), cur = idOk(id) ? await db.get(COLL_V, id) : null;
    const u = await abreMarca(req, res, cur?.profile || 'sin-marca', true); if (!u) return;
    if (!cur || cur.kind !== 'ficha') return res.status(404).json({ error: 'Esa ficha ya no existe' });
    const b = body(req);
    const data = b.archivado ? { ...sinMeta(cur), archivado: true } : { ...sinMeta(cur), ...limpiarFicha({ ...cur, ...b }) };
    const out = await db.update(COLL_V, id, data, b.v ?? cur.v, u.email);
    if (!out) return res.status(409).json({ error: 'Alguien cambió esta ficha justo ahora. Recarga y vuelve a intentar.' });
    res.json(out);
  });
}
