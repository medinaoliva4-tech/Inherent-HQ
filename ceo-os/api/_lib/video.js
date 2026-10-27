// App 01 · Marca › Diseño › Video (servidor): el kit de edición de la marca y sus fichas de video, en la colección «videos»
// (área content). Las reglas viven en public/js/video.js. Nada se borra: una ficha se archiva.
import * as db from './db.js';
import { edits } from './access.js';
import { body } from './http.js';
import { abreMarca } from './creacion.js';
import { COLL_V, idKit, limpiarKit, limpiarFicha, fusionarVersiones, limpiarComentario, limpiarComentarios, puedeEnviar, decidirRevision } from '../../public/js/video.js';

const idOk = (s) => /^[\w-]{1,80}$/.test(String(s || ''));
const sinMeta = ({ id, v, _meta, ...d }) => d;
const ahora = () => new Date().toISOString();
const quien = (u) => (u.role === 'client' ? 'cliente' : u.roles?.[0] || u.role || 'equipo');
const ERR_V = 'Alguien cambió esta ficha justo ahora. Recarga y vuelve a intentar.';
// Un cliente (portal) solo toca fichas de su marca; el resto lo decide la puerta de la ruta (abreMarca).
const esDeCliente = (u, f) => u.role !== 'client' || f.profile === u.client_slug;
const fichaDe = async (u, id) => { const f = idOk(id) ? await db.get(COLL_V, String(id)) : null; return f && f.kind === 'ficha' && !f.archivado && esDeCliente(u, f) ? f : null; };
const noHay = { status: 404, error: 'Esa ficha ya no existe' };

// Comentar al segundo. Lo usan la ruta del equipo y el portal: el cliente nunca deja un comentario interno.
export async function comentar(u, id, b = {}) {
  const f = await fichaDe(u, id); if (!f) return noHay;
  const texto = String(b.texto || '').trim(); if (!texto) return { status: 400, error: 'Escribe el comentario' };
  const c = limpiarComentario({ id: db.newId(), seg: b.seg, texto, interno: u.role === 'client' ? false : b.interno === true, por: quien(u), en: ahora(), version: b.version || f.version || 1 });
  const out = await db.update(COLL_V, f.id, { ...sinMeta(f), comentarios: [...limpiarComentarios(f.comentarios), c] }, b.v ?? f.v, u.email);
  return out ? { doc: out, comentario: c } : { status: 409, error: ERR_V };
}
// Aprobar o pedir cambios. Aprobar pone la pieza ligada (colección content) en «Listo» con la versión aprobada.
export async function revisar(u, id, b = {}) {
  const f = await fichaDe(u, id); if (!f) return noHay;
  const r = decidirRevision(f, b, { por: quien(u), en: ahora() }); if (r.error) return r;
  if (b.accion === 'cambios' && b.nota) r.patch.comentarios = [...limpiarComentarios(f.comentarios), limpiarComentario({ id: db.newId(), seg: null, texto: b.nota, por: quien(u), en: ahora(), version: b.version || f.version || 1 })];
  const out = await db.update(COLL_V, f.id, { ...sinMeta(f), ...r.patch }, b.v ?? f.v, u.email);
  if (!out) return { status: 409, error: ERR_V };
  if (b.accion === 'aprobar' && f.post) {
    const post = await db.get('content', f.post).catch(() => null);
    if (post && post.profile === f.profile) await db.upsert('content', post.id, { status: 'Listo', video_aprobacion: { video: f.id, ...r.patch.aprobacion } }, u.email);
  }
  return { doc: out };
}
const responde = (res, r) => (r.error ? res.status(r.status || 400).json({ error: r.error }) : res.json(r.doc));
// La pieza y el master a los que apunta una ficha tienen que ser de la misma marca; si no, se sueltan.
async function enlaces(slug, f, selfId) {
  const post = f.post ? await db.get('content', f.post).catch(() => null) : null;
  const master = f.derivada_de && f.derivada_de !== selfId ? await db.get(COLL_V, f.derivada_de).catch(() => null) : null;
  return { post: post && post.profile === slug ? f.post : '', derivada_de: master && master.kind === 'ficha' && master.profile === slug ? f.derivada_de : '' };
}

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
    const por = quien(u), en = ahora();
    res.json(await db.create(COLL_V, { profile: slug, kind: 'ficha', ...f, ...(await enlaces(slug, f)), versiones: f.versiones.map((x) => ({ ...x, por, en })), qa: f.qa, revision: '', comentarios: [], aprobacion: null }, u.email));
  });
  on('PUT', 'video/:id', async (req, res) => {
    const id = String(req.params.id || ''), cur = idOk(id) ? await db.get(COLL_V, id) : null;
    const u = await abreMarca(req, res, cur?.profile || 'sin-marca', true); if (!u) return;
    if (!cur || cur.kind !== 'ficha') return res.status(404).json({ error: 'Esa ficha ya no existe' });
    const b = body(req);
    let data;
    if (b.archivado) data = { ...sinMeta(cur), archivado: true };
    else {
      // revision, comentarios y aprobacion no se escriben desde aquí (van por sus rutas); las versiones solo se agregan.
      const f = limpiarFicha({ ...cur, ...b, versiones: fusionarVersiones(cur.versiones, b.versiones ?? cur.versiones) });
      const tenia = new Set((cur.versiones || []).map((x) => x.v)), nuevas = f.versiones.filter((x) => !tenia.has(x.v));
      f.versiones = f.versiones.map((x) => (tenia.has(x.v) ? x : { ...x, por: quien(u), en: ahora() }));
      data = { ...sinMeta(cur), ...f, ...(await enlaces(cur.profile, f, id)) };
      if (f.estado === 'En revisión' && cur.estado !== 'En revisión') {
        const falta = puedeEnviar(f); if (falta) return res.status(400).json({ error: falta });
        data.revision = 'Pendiente';
      } else if (nuevas.length && cur.revision === 'Cambios') data.revision = '';
    }
    const out = await db.update(COLL_V, id, data, b.v ?? cur.v, u.email);
    if (!out) return res.status(409).json({ error: ERR_V });
    res.json(out);
  });
  const deFicha = async (req, res) => {
    const id = String(req.params.id || ''), cur = idOk(id) ? await db.get(COLL_V, id) : null;
    if (cur?.kind !== 'ficha') { res.status(404).json({ error: noHay.error }); return null; }
    return abreMarca(req, res, cur.profile, true);
  };
  on('POST', 'video/:id/comentarios', async (req, res) => { const u = await deFicha(req, res); if (u) responde(res, await comentar(u, req.params.id, body(req))); });
  on('POST', 'video/:id/revision', async (req, res) => { const u = await deFicha(req, res); if (u) responde(res, await revisar(u, req.params.id, body(req))); });
}
