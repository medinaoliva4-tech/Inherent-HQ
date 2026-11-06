import crypto from 'node:crypto';
import * as db from './db.js';
import { guard, userFor, effective, viewsDoc, scoper } from './access.js';
import { avisoPublico } from '../../public/js/chat-avisos-datos.js';

const lc = (x) => String(x || '').toLowerCase();
async function permitido(u, r, sc) {
  const owner = lc(r.coll === 'chat_sesiones' ? r.owner : r.creado_por);
  if (!u?.active || u.role === 'client' || !owner || owner !== lc(u.email) || owner !== lc(r.aviso?.owner)) return false;
  if (r.cliente === 'personal') return u.role === 'ceo';
  if (r.cliente && r.cliente !== 'inherent') { sc = sc === undefined ? await scoper(u) : sc; if (sc && !sc.client(r.cliente)) return false; }
  return true;
}
export async function avisosChatDe(u) {
  const xs = await db.avisosChat({ owner: u.email }), out = [], sc = xs.length ? await scoper(u) : null;
  for (const r of xs) if (await permitido(u, r, sc)) { const a = avisoPublico(r.coll, r.id, r.aviso); if (a) out.push(a); }
  return out;
}
// La fuente de verdad es la base: el caller no elige destinatario, título ni enlace.
export async function entregarAvisosChat(mandar) {
  const xs = (await db.avisosChat({ pendientes: true })).slice(0, 4), vd = await viewsDoc();
  const resultados = await Promise.allSettled(xs.map(async (r) => {
    const u = effective(await userFor(r.aviso.owner), vd), a = avisoPublico(r.coll, r.id, r.aviso);
    if (a && await permitido(u, r)) await mandar(u.email, a, { estricto: true });
    await db.avisoChatEntregado(r.coll, r.id, r.aviso.id);
  }));
  return { entregados: resultados.filter((r) => r.status === 'fulfilled').length, pendientes: resultados.filter((r) => r.status === 'rejected').length };
}
export function rutasChatAvisos(on, mandar) {
  on('GET', 'avisos/chat', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    res.json({ items: await avisosChatDe(u) });
  });
  on('POST', 'avisos/chat/entregar', async (req, res) => {
    const esperado = Buffer.from(process.env.GATEWAY_TOKEN || ''), dado = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    if (esperado.length < 32 || esperado.length !== dado.length || !crypto.timingSafeEqual(esperado, dado)) return res.status(401).json({ error: 'No autorizado' });
    res.json(await entregarAvisosChat(mandar));
  });
}
