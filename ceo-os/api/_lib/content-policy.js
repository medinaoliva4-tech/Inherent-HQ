// Adaptador único: carga hechos del servidor antes de evaluar la misma política en toda entrada.
import * as db from './db.js';
import { readFile } from './gh.js';
import { scoper, edits } from './access.js';
import { personalOk } from './leer.js';
import { tables, clean } from './parse.js';
import { leerTecho } from '../../public/js/plan-mes.js';
import { evaluarContenido, necesitaOrigen } from '../../public/js/content-reglas.js';
const rootOf = (slug) => slug === 'inherent' ? 'inherent/inherent-social-media' : slug === 'personal' ? 'clients/marca-personal' : `clients/${slug}`;
const aprobado = (d) => d && !d.archivado && ['Aprobado', 'Entregado'].includes(d.estado) && d.aprobado?.version === d.version;
const icp = new Set(['customer-bullseye', 'icp-builder', 'ideal-customer-profile-builder']);
export function trazaICP(d, all, slug, seen = new Set()) {
  if (!aprobado(d) || d.client_slug !== slug || seen.has(d.id) || seen.size >= 40) return false;
  if (icp.has(d.tool)) return true;
  const next = new Set([...seen, d.id]);
  return (d.entradas || []).some((e) => { const p = all.find((x) => x.id === e.deliverable_id && x.version === e.version); return trazaICP(p, all, slug, next); });
}
export async function origenesContenido(u, slug) {
  if (!/^[\w-]{2,60}$/.test(String(slug || '')) || !personalOk(u, slug)) return [];
  const sc = await scoper(u); if (sc && !sc.client(slug)) return [];
  const all = await db.list('deliverables');
  return all.filter((d) => trazaICP(d, all, slug)).map((d) => ({ id: d.id, version: d.version, titulo: d.titulo || d.tool, tool: d.tool }));
}
export async function validarContenido(u, b, cur = null, { pending = [] } = {}) {
  if (!['post', 'shoot'].includes(b?.kind)) return evaluarContenido(u, b, cur);
  const slug = String(b.profile || '');
  const sc = await scoper(u);
  if (!/^[\w-]{2,60}$/.test(slug) || !personalOk(u, slug) || (sc && !sc.client(slug))) return { status: 403, code: 'FUERA_DEL_ALCANCE', error: 'Esa marca no está entre las tuyas' };
  const root = rootOf(slug), f = await readFile(`${root}/00-onboarding/plan-contratado.md`);
  const c = { ficha: Boolean(f), origen: false, brief: false, techo: null, total: 0 };
  if (f && necesitaOrigen(b)) {
    const refs = Array.isArray(b.viene_de) ? b.viene_de : [], origins = await origenesContenido(u, slug);
    c.origen = refs.length > 0 && refs.every((r) => origins.some((d) => d.id === r.id && d.version === r.version));
    const mes = String(b.date || '').slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(mes)) {
      const [a, z, opened] = await Promise.all([readFile(`${root}/04-contenido/${mes}/brief-del-ciclo.md`), readFile(`${root}/04-contenido/${mes}/ideas/brief-del-ciclo.md`), db.get('settings', 'brief_open')]);
      c.brief = Boolean(a || z || (opened?.marcas?.[slug] || []).some((x) => x.mes === mes));
      const inc = tables(f.content).find((t) => /qu[eé] incluye/i.test(t.heading));
      c.techo = leerTecho({ ficha: { hay: true, incluye: (inc?.rows || []).map((r) => ({ k: clean(r[0]), v: clean(r[1]) })) } }).piezas;
      const docs = [...new Map([...(await db.list('content')), ...pending].map((d) => [d.id, d])).values()];
      c.total = docs.filter((d) => d.id !== (cur?.id || b.id) && d.profile === slug && d.kind === 'post' && !d.archivado && d.status !== 'Archivado' && String(d.date || '').startsWith(mes)).length + (b.kind === 'post' ? 1 : 0);
    }
  }
  return evaluarContenido(u, b, cur, c);
}
export async function exigirContenido(u, b, cur = null) {
  const bad = await validarContenido(u, b, cur); if (bad) throw Object.assign(new Error(bad.error), bad);
  return b;
}
export function rutasContenido(on, { guard }) {
  on('GET', 'content/origenes', async (req, res) => {
    const u = await guard(req, res, 'content'); if (!u) return;
    if (!edits(u, 'content')) return res.status(403).json({ error: 'Tu perfil solo puede ver contenido' });
    res.json({ items: await origenesContenido(u, String(req.query.profile || '')) });
  });
}
