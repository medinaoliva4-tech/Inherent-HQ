// App 01 · Marca › Publicar › Ads (servidor): las variaciones de anuncio de cada marca, en la colección «ad_variants»
// (área content). Las reglas viven en public/js/ads-studio.js.
// Pautar gasta dinero del cliente: solo el CEO aprueba (y reabre). «Lanzar» no toca ninguna cuenta de anuncios: crea la
// tarea para ⑩ Ads con lo aprobado y el presupuesto que dio el CEO, y ⑩ lanza con ad-lanzamiento.
import * as db from './db.js';
import { edits } from './access.js';
import { body } from './http.js';
import { abreMarca } from './creacion.js';
import { marcaDe } from '../../public/js/element.js';
import { COLL_A, limpiarVariante, faltas, pasoPermitido, tareaLanzar } from '../../public/js/ads-studio.js';

const idOk = (s) => /^[\w-]{1,80}$/.test(String(s || ''));
const sinMeta = ({ id, v, _meta, ...d }) => d;
const ahora = () => new Date().toISOString();
// Quién lanza: la primera persona activa con el perfil de trabajo de Ads; si no hay, quien lanza (el CEO).
async function responsableAds(ceo) {
  const t = (await db.list('team')).find((p) => p.active !== false && Array.isArray(p.roles) && p.roles.includes('ads') && p.role !== 'client');
  return t?.id || t?.email || ceo;
}

export function rutas(on) {
  on('GET', 'ads-studio', async (req, res) => {
    const slug = String(req.query.profile || ''), u = await abreMarca(req, res, slug); if (!u) return;
    const items = (await db.list(COLL_A)).filter((x) => x.profile === slug && !x.archivado);
    res.json({ items, puede: { editar: edits(u, 'content'), aprobar: u.role === 'ceo' } });
  });
  // Variaciones nuevas (del chat o escritas a mano): siempre entran como Borrador.
  on('POST', 'ads-studio', async (req, res) => {
    const b = body(req), slug = String(b.profile || ''), u = await abreMarca(req, res, slug, true); if (!u) return;
    const lista = (Array.isArray(b.variaciones) ? b.variaciones : [b]).slice(0, 40).map((x) => limpiarVariante({ ...x, madre: x.madre || b.madre })).filter((v) => v.title);
    if (!lista.length) return res.status(400).json({ error: 'No llegó ninguna variación con gancho' });
    const hechas = [];
    for (const v of lista) hechas.push(await db.create(COLL_A, { profile: slug, ...v, estado: 'Borrador' }, u.email));
    res.json({ items: hechas });
  });
  // Cambiar el texto (solo en Borrador), el estado (con su regla) o archivar.
  on('PUT', 'ads-studio/:id', async (req, res) => {
    const id = String(req.params.id || ''), cur = idOk(id) ? await db.get(COLL_A, id) : null;
    const u = await abreMarca(req, res, cur?.profile || 'sin-marca', true); if (!u) return;
    if (!cur) return res.status(404).json({ error: 'Esa variación ya no existe' });
    const b = body(req);
    let data = sinMeta(cur);
    if (b.archivado) {
      if (cur.estado === 'Lanzada') return res.status(409).json({ error: 'Está corriendo: márcala Ganadora o Quemada antes de archivarla' });
      data = { ...data, archivado: true };
    } else if (b.estado && b.estado !== cur.estado) {
      const quien = pasoPermitido(cur.estado, b.estado);
      if (!quien) return res.status(409).json({ error: `De «${cur.estado}» no se pasa a «${b.estado}»` });
      if (quien === 'ceo' && u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO aprueba o reabre una variación: pautar gasta dinero del cliente' });
      if (b.estado === 'Aprobada') { const f = faltas(cur); if (f.length) return res.status(400).json({ error: f.join(' · ') }); }
      if (b.estado === 'Lanzada' && !cur.lanzar) return res.status(409).json({ error: 'Primero el CEO la manda a lanzar (crea la tarea de ⑩ Ads)' });
      data = { ...data, estado: b.estado, ...(b.estado === 'Aprobada' ? { aprobada: { por: u.email, en: ahora() } } : {}), ...(b.estado === 'Borrador' ? { aprobada: null } : {}),
        ...(b.estado === 'Lanzada' ? { lanzada: { en: ahora(), campana: /^https:\/\/\S+$/.test(String(b.campana || '')) ? String(b.campana).slice(0, 400) : '' } } : {}), ...(b.nota !== undefined ? { nota: String(b.nota).slice(0, 400) } : {}) };
    } else {
      if (cur.estado !== 'Borrador') return res.status(409).json({ error: 'Ya tiene el OK del CEO: para cambiar el texto, que la reabra' });
      data = { ...data, ...limpiarVariante({ ...cur, ...b, madre: cur.madre }) };
    }
    const out = await db.update(COLL_A, id, data, b.v ?? cur.v, u.email);
    if (!out) return res.status(409).json({ error: 'Alguien cambió esta variación justo ahora. Recarga y vuelve a intentar.' });
    res.json(out);
  });
  // Lanzar (solo el CEO): las aprobadas elegidas + presupuesto → una tarea para ⑩ Ads. No se toca ninguna cuenta de anuncios.
  on('POST', 'ads-studio/:slug/lanzar', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await abreMarca(req, res, slug, true); if (!u) return;
    if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO manda a lanzar: es su OK al plan y al presupuesto' });
    const b = body(req), presupuesto = String(b.presupuesto || '').replace(/\s+/g, ' ').trim().slice(0, 120), fechas = String(b.fechas || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (!presupuesto) return res.status(400).json({ error: 'Falta el presupuesto: sin presupuesto aprobado no se lanza' });
    const ids = new Set((Array.isArray(b.ids) ? b.ids : []).map(String));
    const vs = (await db.list(COLL_A)).filter((x) => x.profile === slug && ids.has(x.id) && x.estado === 'Aprobada' && !x.lanzar);
    if (!vs.length) return res.status(400).json({ error: 'Elige al menos una variación aprobada que no se haya mandado a lanzar' });
    const en = ahora(), t = tareaLanzar({ marca: marcaDe(slug), variantes: vs, presupuesto, fechas, por: u.email, en });
    const tarea = await db.create('tasks', { title: t.title, description: t.description, assignee: await responsableAds(u.email), due: '', project_id: '', status: 'Por empezar', visibility: 'all', tipo: 'Delivery', client_slug: slug === 'inherent' ? '' : slug }, u.email);
    for (const v of vs) await db.upsert(COLL_A, v.id, { lanzar: { tarea: tarea.id, presupuesto, fechas, por: u.email, en } }, u.email);
    res.json({ tarea: { id: tarea.id, title: tarea.title, assignee: tarea.assignee }, n: vs.length });
  });
}
