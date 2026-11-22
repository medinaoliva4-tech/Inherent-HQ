// Aprobación del cliente por enlace de UN SOLO USO (sin cuenta): el cliente abre el enlace en su celular, ve de qué se trata y toca
// «Aprobar» o «Pedir cambios». El enlace está atado a UNA versión de UN entregable de UN cliente y caduca.
//   · el token (256 bits) viaja en el fragmento de la URL (#t=…, no queda en registros ni en el Referer) y se guarda solo como hash;
//   · un uso: responder gasta el enlace (CAS); repetir → 410. Caduca (por defecto 7 días), se puede revocar y deja de valer si la pieza cambia de versión;
//   · lo que ve el cliente es una lista permitida: título, herramienta, versión y marca. NUNCA costos, horas, notas internas ni contenido del entregable;
//   · la respuesta del cliente se ANOTA en el entregable (aprobacion_cliente + historial); no mueve su estado interno: eso sigue siendo del CEO/COO;
//   · solo se emite sobre lo que el equipo ya aprobó por dentro (el QA va antes que el cliente).
import crypto from 'node:crypto';
import * as db from './db.js';
import { body } from './http.js';
import { herramientaDe } from '../../public/js/herramientas.js';
import { COLL } from '../../public/js/entregables.js';
import { interno } from './entregables.js';

export const COLL_LINK = 'portal_links', TTL_DIAS = 7, ACCIONES = ['aprobar', 'cambios'];
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const tokenOk = (t) => /^[A-Za-z0-9_-]{43}$/.test(String(t || ''));
const ahora = () => new Date().toISOString();
const nota = (x) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, 400);
const fail = (status, code, message) => { throw Object.assign(new Error(message), { status, code }); };
const lc = (x) => String(x || '').toLowerCase();

export async function emitir(u, doc, { ttlDias = TTL_DIAS, ahoraMs = Date.now() } = {}) {
  if (!['ceo', 'coo'].includes(u.role)) fail(403, 'ROL', 'Solo el CEO o el COO mandan una pieza al cliente');
  if (!['Aprobado', 'Entregado'].includes(doc.estado)) fail(409, 'SIN_QA', 'La pieza todavía no está aprobada por dentro: el cliente la ve después del QA');
  if (doc.archivado) fail(409, 'ARCHIVADO', 'Está archivada');
  const token = crypto.randomBytes(32).toString('base64url');
  await db.create(COLL_LINK, { deliverable_id: doc.id, version: doc.version || 1, client_slug: lc(doc.client_slug), exp: ahoraMs + Math.min(30, Math.max(1, ttlDias)) * 864e5, usado: false, revocado: false, creado_por: u.email }, u.email, sha(token));
  return { token, exp: new Date(ahoraMs + ttlDias * 864e5).toISOString() };
}
// Lo que dice un enlace: uno solo, sin pistas. Cualquier problema de forma o inexistencia es el mismo «no sirve».
async function leer(token, { ahoraMs = Date.now() } = {}) {
  if (!tokenOk(token)) fail(404, 'ENLACE', 'Este enlace no sirve.');
  const link = await db.get(COLL_LINK, sha(token)); if (!link) fail(404, 'ENLACE', 'Este enlace no sirve.');
  if (link.usado) fail(410, 'USADO', 'Este enlace ya se usó. Si necesitas cambiar tu respuesta, pídele a Inherent uno nuevo.');
  if (link.revocado) fail(410, 'REVOCADO', 'Inherent canceló este enlace. Pide uno nuevo.');
  if (link.exp < ahoraMs) fail(410, 'VENCIDO', 'Este enlace venció. Pídele a Inherent uno nuevo.');
  const doc = await db.get(COLL, link.deliverable_id);
  if (!doc || doc.archivado) fail(410, 'REVOCADO', 'Esta pieza ya no está disponible.');
  if (lc(doc.client_slug) !== link.client_slug) fail(403, 'CLIENTE', 'Este enlace no corresponde a esta pieza.'); // por si alguien movió el entregable de marca
  if ((doc.version || 1) !== link.version) fail(409, 'CAMBIO', 'Esta pieza cambió desde que te mandamos el enlace. Pídele a Inherent uno nuevo.');
  return { link, doc };
}
// La lista permitida: título, herramienta, versión y marca. Nada del contenido, nada interno.
const vistaPublica = (doc, link) => ({ titulo: String(doc.titulo || '').slice(0, 120), herramienta: herramientaDe(doc.tool)?.nombre || '', version: link.version, marca: link.client_slug, expira: new Date(link.exp).toISOString(), acciones: ACCIONES });
export async function ver(token, o) { const { doc, link } = await leer(token, o); return vistaPublica(doc, link); }
export async function responder(token, { accion, nota: n }, o) {
  if (!ACCIONES.includes(accion)) fail(400, 'ACCION', 'Elige Aprobar o Pedir cambios.');
  const texto = nota(n); if (accion === 'cambios' && !texto) fail(400, 'NOTA', 'Cuéntanos qué hay que cambiar.');
  const { link, doc } = await leer(token, o);
  const gastado = await db.update(COLL_LINK, sha(token), { ...link, usado: true, usado_en: ahora(), respuesta: accion }, link.v, 'cliente'); // CAS: dos toques a la vez, gana uno
  if (!gastado) fail(410, 'USADO', 'Este enlace ya se usó.');
  const cur = await db.get(COLL, doc.id);
  const data = { ...cur, aprobacion_cliente: { accion, nota: texto, version: link.version, en: ahora(), via: 'enlace' },
    historial: [...(Array.isArray(cur.historial) ? cur.historial : []), { en: ahora(), por: `cliente:${link.client_slug}`, accion: accion === 'aprobar' ? 'cliente-aprueba' : 'cliente-pide-cambios', nota: texto, version: link.version }] };
  await db.update(COLL, doc.id, data, cur.v, 'cliente');
  return { ok: true, mensaje: accion === 'aprobar' ? '¡Gracias! Quedó aprobado.' : 'Recibimos tus cambios. Te avisamos cuando estén.' };
}
export async function revocar(u, deliverableId) {
  if (!['ceo', 'coo'].includes(u.role)) fail(403, 'ROL', 'Solo el CEO o el COO revocan enlaces');
  let n = 0;
  for (const l of (await db.list(COLL_LINK)).filter((x) => x.deliverable_id === deliverableId && !x.usado && !x.revocado)) if (await db.update(COLL_LINK, l.id, { ...l, revocado: true }, l.v, u.email)) n++;
  return n;
}

const err = (res, e) => res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo completar. Vuelve a intentar.', code: e.code || 'SERVIDOR' });
export function rutas(on) {
  // Internas (con sesión): emitir y revocar sobre un entregable.
  on('POST', 'entregables/:id/enlace', async (req, res) => {
    const { cur, u } = await interno.deDoc(req, res, { write: true, cierra: false }); if (!u) return;
    try {
      const b = body(req), { token, exp } = await emitir(u, cur, { ttlDias: Number(b.dias) || TTL_DIAS });
      const base = String(process.env.APP_URL || '').replace(/\/$/, '');
      res.json({ url: `${base}/aprobar.html#t=${token}`, expira: exp, aviso: 'Este enlace se muestra una sola vez y sirve para UNA respuesta.' });
    } catch (e) { err(res, e); }
  });
  on('POST', 'entregables/:id/enlaces/revocar', async (req, res) => {
    const { cur, u } = await interno.deDoc(req, res, { write: true, cierra: false }); if (!u) return;
    try { res.json({ revocados: await revocar(u, cur.id) }); } catch (e) { err(res, e); }
  });
  // Públicas (sin sesión): el token va en el CUERPO, nunca en la ruta. Exigen el encabezado propio para que una página de afuera no responda por alguien.
  const sinCsrf = (req, res) => { if (req.headers['x-ceoos'] !== '1') { res.status(403).json({ error: 'Pedido no válido', code: 'PEDIDO' }); return true; } return false; };
  on('POST', 'portal/aprobacion/ver', async (req, res) => { if (sinCsrf(req, res)) return; try { res.json(await ver(body(req).token)); } catch (e) { err(res, e); } });
  on('POST', 'portal/aprobacion/responder', async (req, res) => { if (sinCsrf(req, res)) return; try { const b = body(req); res.json(await responder(b.token, { accion: b.accion, nota: b.nota })); } catch (e) { err(res, e); } });
}
