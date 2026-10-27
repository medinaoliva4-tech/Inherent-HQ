// Marca › Planear › Campañas y eventos (servidor): las campañas de ③ Marketing de cada marca, en la colección
// «mk_campaigns» (id = <marca>--<nombre>, área content). Mismo candado que el plan del mes: sin estrategia aprobada no hay
// campañas. No se borran: se archivan (estado «Archivada»).
import * as db from './db.js';
import { guard, scoper, edits } from './access.js';
import { body } from './http.js';
import { COLL_C, limpiarCampana, idCampana } from '../../public/js/campanas.js';
import { vivaId } from '../../public/js/estrategia-viva.js';

const slugOk = (s) => /^[\w-]{2,60}$/.test(String(s || ''));
const SIN_ESTRATEGIA = { error: 'Primero el CEO aprueba la estrategia de esta marca (Estrategia › Aprobar). Sin estrategia aprobada no hay campañas.', code: 'SIN_ESTRATEGIA' };
async function abre(req, res, write = false) {
  const u = await guard(req, res, 'content', { write }); if (!u) return null;
  if (u.role !== 'ceo' && u.views?.content === 'resumen') { res.status(403).json({ error: 'Tu vista de Contenido es «resumen»: solo el rendimiento' }); return null; }
  const { slug } = req.params;
  if (!slugOk(slug) || slug === 'personal') { res.status(400).json({ error: 'Marca inválida' }); return null; }
  const sc = await scoper(u);
  if (sc && slug !== 'inherent' && !sc.client(slug)) { res.status(404).json({ error: 'Esa marca no está entre las tuyas' }); return null; }
  return u;
}
const aprobada = async (slug) => Boolean((await db.get('strategy', vivaId(slug)).catch(() => null))?.aprobado);
// Las campañas de una marca (las usa también el conector).
export const campanasDe = async (slug) => (await db.list(COLL_C)).filter((c) => c.profile === slug);

export function rutas(on) {
  on('GET', 'campanas/:slug', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const { slug } = req.params;
    res.json({ campanas: await campanasDe(slug), estrategia: { aprobada: await aprobada(slug) }, puede: { editar: edits(u, 'content') } });
  });
  // Crear (o poner al día si ya existe una con ese nombre en esa marca: no se duplica).
  on('POST', 'campanas/:slug', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const { slug } = req.params;
    if (!(await aprobada(slug))) return res.status(409).json(SIN_ESTRATEGIA);
    const c = limpiarCampana(body(req));
    if (!c.nombre) return res.status(400).json({ error: 'La campaña necesita un nombre' });
    const id = idCampana(slug, c.nombre), cur = await db.get(COLL_C, id);
    const out = cur ? await db.update(COLL_C, id, { ...cur, ...c, profile: slug }, cur.v, u.email) : await db.create(COLL_C, { ...c, profile: slug }, u.email, id);
    if (!out) return res.status(409).json({ error: 'Alguien cambió esta campaña justo ahora. Recarga y vuelve a intentar.' });
    res.json({ campana: out, nueva: !cur });
  });
  on('PUT', 'campanas/:slug/:id', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const { slug, id } = req.params, cur = await db.get(COLL_C, id);
    if (!cur || cur.profile !== slug) return res.status(404).json({ error: 'No encontré esa campaña' });
    // Cerrar o archivar no pide la estrategia; cambiar la campaña sí.
    const b = body(req), soloEstado = Object.keys(b).every((k) => k === 'estado' || k === 'v');
    if (!soloEstado && !(await aprobada(slug))) return res.status(409).json(SIN_ESTRATEGIA);
    const c = limpiarCampana({ ...cur, ...b, evento: { ...(cur.evento || {}), ...(b.evento || {}) } });
    const out = await db.update(COLL_C, id, { ...cur, ...c, nombre: cur.nombre, profile: slug }, cur.v, u.email);
    if (!out) return res.status(409).json({ error: 'Alguien cambió esta campaña justo ahora. Recarga y vuelve a intentar.' });
    res.json({ campana: out });
  });
}
