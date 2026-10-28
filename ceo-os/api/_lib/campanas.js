// Marca › Planear › Campañas y eventos (servidor): las campañas de ③ Marketing de cada marca, en la colección
// «mk_campaigns» (id = <marca>--<nombre>, área content). Mismo candado que el plan del mes: sin estrategia aprobada no hay
// campañas. No se borran: se archivan (estado «Archivada»).
// Campaign Architect (Fase 3b): además del blueprint guarda el plan de canales (fases × canales), los briefs creativos, los resultados
// (solo se agregan), la liga a la campaña de pauta (colección «campaigns», por id) y el entregable que la originó. Cada escritura lleva la
// versión (v) que se leyó: si alguien cambió la campaña antes, 409. Los montos del plan solo los ve y los escribe quien ve costos
// (seesCosts: CEO, COO o quien edita Clientes): a los demás se les quitan al leer y se conservan al guardar, como los presupuestos.
import * as db from './db.js';
import { guard, scoper, edits, seesCosts } from './access.js';
import { body } from './http.js';
import { COLL_C, limpiarCampana, idCampana, mezclarCanales, canalesConMontos, conservarPlan, resultadosAlGuardar, sinMontos } from '../../public/js/campanas.js';
import { vivaId } from '../../public/js/estrategia-viva.js';

const slugOk = (s) => /^[\w-]{2,60}$/.test(String(s || ''));
const SIN_ESTRATEGIA = { error: 'Primero el CEO aprueba la estrategia de esta marca (Estrategia › Aprobar). Sin estrategia aprobada no hay campañas.', code: 'SIN_ESTRATEGIA' };
const CONFLICTO = { error: 'Alguien cambió esta campaña justo ahora. Recarga y vuelve a intentar.', code: 'CONFLICTO' };
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
// La versión que mandó quien edita (la que leyó); sin ella, la de hoy.
const vDe = (b, cur) => (b?.v != null && Number.isInteger(Number(b.v)) ? Number(b.v) : cur.v);
// Quien no ve costos recibe la campaña sin montos (y sin los resultados de gasto): nunca se toca lo guardado.
const salida = (u, c) => (seesCosts(u) ? c : sinMontos(c));
// Las dos ligas se miran contra la base: la campaña de pauta tiene que ser de esta marca y el entregable, de Campaign Architect de esta marca.
// Solo cuando cambian (un entregable archivado después no impide seguir editando). → texto del error o null
async function ligasMal(slug, c, cur) {
  const lc = (x) => String(x || '').toLowerCase();
  if (c.pauta_id && c.pauta_id !== (cur?.pauta_id || '')) {
    const p = await db.get('campaigns', c.pauta_id).catch(() => null);
    if (!p || lc(p.client_slug) !== lc(slug)) return 'Esa campaña de pauta no es de esta marca';
  }
  if (c.entregable_ref && c.entregable_ref !== (cur?.entregable_ref || '')) {
    const e = await db.get('deliverables', c.entregable_ref).catch(() => null);
    if (!e || e.tool !== 'campaign-architect' || lc(e.client_slug) !== lc(slug)) return 'Ese entregable no es de Campaign Architect de esta marca';
  }
  return null;
}
// Las campañas de una marca (las usa también el conector). Con el usuario (u), sin los montos de quien no ve costos.
export const campanasDe = async (slug, u) => (await db.list(COLL_C)).filter((c) => c.profile === slug).map((c) => (u ? salida(u, c) : c));

export function rutas(on) {
  on('GET', 'campanas/:slug', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const { slug } = req.params;
    res.json({ campanas: await campanasDe(slug, u), estrategia: { aprobada: await aprobada(slug) }, puede: { editar: edits(u, 'content'), costos: seesCosts(u) } });
  });
  // Crear (o poner al día si ya existe una con ese nombre en esa marca: no se duplica). Al ponerla al día, lo que el cuerpo no trae
  // (plan de canales, briefs, ligas) se conserva y los resultados solo se agregan.
  on('POST', 'campanas/:slug', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const { slug } = req.params;
    if (!(await aprobada(slug))) return res.status(409).json(SIN_ESTRATEGIA);
    const b = body(req);
    let c = limpiarCampana(b);
    if (!c.nombre) return res.status(400).json({ error: 'La campaña necesita un nombre' });
    const id = idCampana(slug, c.nombre), cur = await db.get(COLL_C, id);
    const mal = await ligasMal(slug, c, cur); if (mal) return res.status(400).json({ error: mal });
    if (cur) c = conservarPlan(cur, c);
    if (!seesCosts(u)) c = { ...c, canales: canalesConMontos(cur?.canales, c.canales) }; // quien no ve costos no los escribe
    c = { ...c, resultados: resultadosAlGuardar(cur?.resultados, c.resultados) };
    const out = cur ? await db.update(COLL_C, id, { ...cur, ...c, profile: slug }, vDe(b, cur), u.email) : await db.create(COLL_C, { ...c, profile: slug }, u.email, id);
    if (!out) return res.status(409).json(CONFLICTO);
    res.json({ campana: salida(u, out), nueva: !cur });
  });
  on('PUT', 'campanas/:slug/:id', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const { slug, id } = req.params, cur = await db.get(COLL_C, id);
    if (!cur || cur.profile !== slug) return res.status(404).json({ error: 'No encontré esa campaña' });
    // Cerrar o archivar no pide la estrategia; cambiar la campaña sí.
    const b = body(req), soloEstado = Object.keys(b).every((k) => k === 'estado' || k === 'v');
    if (!soloEstado && !(await aprobada(slug))) return res.status(409).json(SIN_ESTRATEGIA);
    // El cuerpo es un parche: lo que no trae se queda como estaba (las celdas del plan, también una por una).
    const canales = 'canales' in b ? mezclarCanales(cur.canales, b.canales) : cur.canales;
    let c = limpiarCampana({ ...cur, ...b, canales, evento: { ...(cur.evento || {}), ...(b.evento || {}) } });
    const mal = await ligasMal(slug, c, cur); if (mal) return res.status(400).json({ error: mal });
    if (!seesCosts(u)) c = { ...c, canales: canalesConMontos(cur.canales, c.canales) }; // quien no ve costos no los cambia
    c = { ...c, resultados: resultadosAlGuardar(cur.resultados, c.resultados) };
    const out = await db.update(COLL_C, id, { ...cur, ...c, nombre: cur.nombre, profile: slug }, vDe(b, cur), u.email);
    if (!out) return res.status(409).json(CONFLICTO);
    res.json({ campana: salida(u, out) });
  });
}
