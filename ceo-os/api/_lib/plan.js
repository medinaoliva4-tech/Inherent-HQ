// Marca › Crear › Plan del mes (servidor): el plan de ③ Marketing de cada marca y mes, en la colección «plans»
// (id = <marca>--<AAAA-MM>, área content). «Pasar a Creatividad» vuelve cada slot una pieza del calendario (estado Idea)
// con su slot adentro; el id es fijo, así que volver a pasarlo pone al día y no duplica (lo que ya avanzó no se toca).
import * as db from './db.js';
import { guard, scoper, edits } from './access.js';
import { body } from './http.js';
import { COLL_P, idPlan, mesOk, aplicarPlan, slotsAPiezas } from '../../public/js/plan-mes.js';

const slugOk = (s) => /^[\w-]{2,60}$/.test(String(s || ''));
async function abre(req, res, write = false) {
  const u = await guard(req, res, 'content', { write }); if (!u) return null;
  if (u.role !== 'ceo' && u.views?.content === 'resumen') { res.status(403).json({ error: 'Tu vista de Contenido es «resumen»: solo el rendimiento' }); return null; }
  const { slug, mes } = req.params;
  if (!slugOk(slug) || slug === 'personal' || !mesOk(mes)) { res.status(400).json({ error: 'Marca o mes inválido' }); return null; }
  const sc = await scoper(u);
  if (sc && slug !== 'inherent' && !sc.client(slug)) { res.status(404).json({ error: 'Esa marca no está entre las tuyas' }); return null; }
  return u;
}

export function rutas(on) {
  on('GET', 'plan/:slug/:mes', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const { slug, mes } = req.params;
    const plan = await db.get(COLL_P, idPlan(slug, mes));
    const piezas = (await db.list('content')).filter((x) => x.kind === 'post' && x.slot?.plan === idPlan(slug, mes)).length;
    res.json({ plan: plan || null, piezas, puede: { editar: edits(u, 'content') } });
  });
  on('PUT', 'plan/:slug/:mes', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const { slug, mes } = req.params, id = idPlan(slug, mes);
    const cur = await db.get(COLL_P, id);
    const { plan, cambiadas } = aplicarPlan(cur || { profile: slug, mes }, body(req).parche || {});
    if (!cambiadas.length) return res.json({ plan: cur, cambiadas });
    const out = cur ? await db.update(COLL_P, id, { ...plan, profile: slug, mes }, cur.v, u.email) : await db.create(COLL_P, { ...plan, profile: slug, mes }, u.email, id);
    if (!out) return res.status(409).json({ error: 'Alguien cambió el plan justo ahora. Recarga y vuelve a intentar.' });
    res.json({ plan: out, cambiadas });
  });
  on('POST', 'plan/:slug/:mes/a-creatividad', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const { slug, mes } = req.params;
    const plan = await db.get(COLL_P, idPlan(slug, mes));
    if (!plan?.slots?.length) return res.status(400).json({ error: 'El plan todavía no tiene slots' });
    let nuevas = 0, puestas = 0;
    for (const { id, data } of slotsAPiezas(plan, slug, mes)) {
      const cur = await db.get('content', id);
      if (!cur) { await db.create('content', { ...data, status: 'Idea' }, u.email, id); nuevas++; continue; }
      // Ya existe: solo se pone al día el slot (lo que escribió Creatividad, su estado y su día no se tocan).
      await db.upsert('content', id, { slot: data.slot, pillar: data.pillar, campana: data.campana, consciencia: data.consciencia }, u.email); puestas++;
    }
    await db.upsert(COLL_P, idPlan(slug, mes), { a_creatividad: new Date().toISOString() }, u.email);
    res.json({ nuevas, puestas });
  });
}
