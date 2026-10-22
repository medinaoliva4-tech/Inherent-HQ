// Marca › Crear › Plan del mes (servidor): el plan de ③ Marketing de cada marca y mes, en la colección «plans»
// (id = <marca>--<AAAA-MM>, área content). «Pasar a Creatividad» vuelve cada slot una pieza del calendario (estado Idea)
// con su slot adentro; el id es fijo, así que volver a pasarlo pone al día y no duplica (lo que ya avanzó no se toca).
import * as db from './db.js';
import { guard, scoper, edits } from './access.js';
import { body } from './http.js';
import { COLL_P, idPlan, mesOk, aplicarPlan, slotsAPiezas } from '../../public/js/plan-mes.js';
import { limpiarIdeas } from '../../public/js/ideas-chat.js';
import { vivaId } from '../../public/js/estrategia-viva.js';

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

// La secuencia del chat de Diseño gráfico, también aquí (no solo en la pantalla): sin estrategia aprobada no hay plan;
// sin plan pasado a Creatividad no hay ideas. La pieza suelta no pasa por estas rutas.
const SIN_ESTRATEGIA = { error: 'Primero el CEO aprueba la estrategia de esta marca (Estrategia › Aprobar). Sin estrategia aprobada no hay plan.', code: 'SIN_ESTRATEGIA' };
async function estrategiaAprobada(slug) { const v = await db.get('strategy', vivaId(slug)).catch(() => null); return Boolean(v?.aprobado); }

export function rutas(on) {
  on('GET', 'plan/:slug/:mes', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const { slug, mes } = req.params;
    const [plan, viva, todo] = await Promise.all([db.get(COLL_P, idPlan(slug, mes)), db.get('strategy', vivaId(slug)).catch(() => null), db.list('content')]);
    const delPlan = todo.filter((x) => x.kind === 'post' && x.slot?.plan === idPlan(slug, mes));
    // La secuencia del chat de Diseño gráfico: sin estrategia aprobada no hay plan; sin plan pasado no hay ideas; sin ideas no hay diseño.
    res.json({ plan: plan || null, piezas: delPlan.length, conIdea: delPlan.filter((x) => x.idea_chat).length,
      estrategia: { aprobada: Boolean(viva?.aprobado), en: viva?.aprobado?.en || null }, puede: { editar: edits(u, 'content') } });
  });
  on('PUT', 'plan/:slug/:mes', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const { slug, mes } = req.params, id = idPlan(slug, mes);
    if (!(await estrategiaAprobada(slug))) return res.status(409).json(SIN_ESTRATEGIA);
    const cur = await db.get(COLL_P, id);
    const { plan, cambiadas } = aplicarPlan(cur || { profile: slug, mes }, body(req).parche || {});
    if (!cambiadas.length) return res.json({ plan: cur, cambiadas });
    const out = cur ? await db.update(COLL_P, id, { ...plan, profile: slug, mes }, cur.v, u.email) : await db.create(COLL_P, { ...plan, profile: slug, mes }, u.email, id);
    if (!out) return res.status(409).json({ error: 'Alguien cambió el plan justo ahora. Recarga y vuelve a intentar.' });
    res.json({ plan: out, cambiadas });
  });
  // ④ Creatividad, desde el chat: cada idea va a la pieza de su slot (título, hook y el porqué). Lo anterior queda en «antes».
  on('POST', 'plan/:slug/:mes/ideas', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const { slug, mes } = req.params, ideas = limpiarIdeas(body(req).ideas);
    if (!ideas.length) return res.status(400).json({ error: 'No llegó ninguna idea' });
    const plan = await db.get(COLL_P, idPlan(slug, mes));
    if (!plan?.a_creatividad) return res.status(409).json({ error: 'Primero pasa el plan del mes a Creatividad: sin plan no hay ideas.', code: 'SIN_PLAN' });
    const piezas = (await db.list('content')).filter((x) => x.kind === 'post' && x.slot?.plan === idPlan(slug, mes));
    let puestas = 0; const faltan = [];
    for (const i of ideas) {
      const p = piezas.find((x) => x.slot?.id === i.slot);
      if (!p) { faltan.push(i.slot); continue; }
      const antes = p.idea_chat ? [...(p.antes || []), { title: p.title, idea_chat: p.idea_chat }].slice(-5) : p.antes;
      await db.upsert('content', p.id, { title: i.titulo, ...(i.hook ? { hook: i.hook } : {}), idea_chat: { ...i, por: u.email, at: new Date().toISOString(), revisada: false }, ...(antes ? { antes } : {}) }, u.email);
      puestas++;
    }
    res.json({ puestas, faltan });
  });
  on('POST', 'plan/:slug/:mes/a-creatividad', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const { slug, mes } = req.params;
    if (!(await estrategiaAprobada(slug))) return res.status(409).json(SIN_ESTRATEGIA);
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
