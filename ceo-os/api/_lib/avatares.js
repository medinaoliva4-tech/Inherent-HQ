// App 01 · Marca › Entender › Cliente ideal (servidor). Colección «avatars» (área content): un documento por avatar.
//   { profile, nombre, peso (0–100), estado: 'borrador' | 'aprobado', aprobado: { por, en }, campos: {…}, angulos: [{ tipo, texto }], archivado }
// Lo edita quien edita Contenido de esa marca; solo el CEO aprueba. Cambiar la ficha de un avatar aprobado lo regresa a borrador.
// Nada se borra: se archiva. Nada de esta colección pasa por /api/db/avatars (la ruta genérica responde 404).
import * as db from './db.js';
import { guard, scoper, edits } from './access.js';
import { body } from './http.js';
import { COLL, limpiarCampos, limpiarAngulos, pesoOk, vivos, resumenAvatar } from '../../public/js/avatares.js';

const slugOk = (s) => /^[\w-]{2,60}$/.test(String(s || ''));
const ahora = () => new Date().toISOString();
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
const deMarca = async (slug) => (await db.list(COLL)).filter((a) => a.profile === slug);
// Los avatares aprobados de una marca, en una línea cada uno (los lee Laya para juzgar posts e ideas).
export async function aprobados(slug) { return vivos(await deMarca(slug)).filter((a) => a.estado === 'aprobado'); }
export const textoAprobados = async (slug) => (await aprobados(slug)).map(resumenAvatar);

export function rutas(on) {
  on('GET', 'avatares', async (req, res) => {
    const slug = String(req.query.profile || ''), u = await abre(req, res, slug); if (!u) return;
    res.json({ avatares: vivos(await deMarca(slug)), puede: { editar: edits(u, 'content'), aprobar: u.role === 'ceo' } });
  });
  on('POST', 'avatares', async (req, res) => {
    const b = body(req), slug = String(b.profile || ''), u = await abre(req, res, slug, true); if (!u) return;
    const nombre = String(b.nombre || '').trim().slice(0, 80); if (!nombre) return res.status(400).json({ error: 'Ponle un nombre al avatar' });
    const hay = vivos(await deMarca(slug));
    if (hay.length >= 6) return res.status(400).json({ error: 'Máximo 6 avatares por marca: mientras más puntual, mejor' });
    const d = await db.create(COLL, { profile: slug, nombre, peso: hay.length ? 0 : 100, estado: 'borrador', campos: limpiarCampos(b.campos || {}), angulos: limpiarAngulos(b.angulos) }, u.email);
    res.json(d);
  });
  on('PUT', 'avatares/:id', async (req, res) => {
    const cur = await db.get(COLL, String(req.params.id || '')); if (!cur || cur.archivado) return res.status(404).json({ error: 'No existe' });
    const u = await abre(req, res, cur.profile, true); if (!u) return;
    const b = body(req), patch = {};
    if ('nombre' in b) { const n = String(b.nombre || '').trim().slice(0, 80); if (n) patch.nombre = n; }
    if ('peso' in b) patch.peso = pesoOk(b.peso);
    let ficha = false;
    if (b.campos && typeof b.campos === 'object') { patch.campos = { ...(cur.campos || {}), ...limpiarCampos(b.campos) }; ficha = true; }
    if ('angulos' in b) { patch.angulos = limpiarAngulos(b.angulos); ficha = true; }
    // La ficha cambió: si estaba aprobada, vuelve a borrador (el CEO la aprueba otra vez). El peso no la desaprueba.
    if (ficha && cur.estado === 'aprobado') { patch.estado = 'borrador'; patch.aprobado = null; }
    const d = await db.update(COLL, cur.id, { ...cur, ...patch }, cur.v, u.email);
    if (!d) return res.status(409).json({ error: 'Alguien lo cambió justo ahora. Recarga y vuelve a intentar.' });
    res.json(d);
  });
  on('POST', 'avatares/:id/aprobar', async (req, res) => {
    const cur = await db.get(COLL, String(req.params.id || '')); if (!cur || cur.archivado) return res.status(404).json({ error: 'No existe' });
    const u = await abre(req, res, cur.profile, true); if (!u) return;
    if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO aprueba el cliente ideal' });
    const si = body(req).aprobar !== false;
    const d = await db.update(COLL, cur.id, { ...cur, estado: si ? 'aprobado' : 'borrador', aprobado: si ? { por: u.email, en: ahora() } : null }, cur.v, u.email);
    if (!d) return res.status(409).json({ error: 'Alguien lo cambió justo ahora. Recarga y vuelve a intentar.' });
    res.json(d);
  });
  on('POST', 'avatares/:id/archivar', async (req, res) => {
    const cur = await db.get(COLL, String(req.params.id || '')); if (!cur || cur.archivado) return res.status(404).json({ error: 'No existe' });
    const u = await abre(req, res, cur.profile, true); if (!u) return;
    const d = await db.update(COLL, cur.id, { ...cur, archivado: true, archivado_en: ahora() }, cur.v, u.email);
    res.json({ ok: Boolean(d) });
  });
}
