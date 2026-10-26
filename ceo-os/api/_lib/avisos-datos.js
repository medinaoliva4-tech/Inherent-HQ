// Avisos (servidor): junta, para una persona, todo lo que las reglas necesitan, ya filtrado con lo que esa persona podría
// pedir por la API (leer.js: visibilidad, alcance, «resumen», costos). Ningún aviso se calcula con datos que no ve.
// Las listas se leen una vez cada 20 s por instancia; lo del repo (fichas y archivos de cada cliente), cada 60 s.
import * as db from './db.js';
import { sees, levelOf, scoper, SCOPED } from './access.js';
import { leer } from './leer.js';
import * as intel from './intel.js';
import { ficha } from './estrategia.js';
import { guias } from './guia.js';
import { verObjetivo } from './laya.js';
import { repoSource } from './gh.js';
import { COLL_C } from '../../public/js/campanas.js';
import { personaDe } from '../../public/js/avisos-reglas/base.js';

const COLLS = ['tasks', 'projects', 'team', 'leads', 'quotes', 'invoices', 'accounts', 'content', 'campaigns', 'mentors'];
const pushListo = () => Boolean(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
const SOLO_RUTA = ['strategy', 'plans', COLL_C, 'ad_variants', 'judgments']; // no salen por db/:coll: aquí se aplica la regla de su ruta
let MEM = { at: 0, v: null, ver: -1 }, REPO = { at: 0, v: null };
async function crudo() {
  if (MEM.v && MEM.ver === db.version() && Date.now() - MEM.at < 20_000) return MEM.v;
  const ls = await Promise.all([...COLLS, ...SOLO_RUTA].map((c) => db.list(c).catch(() => [])));
  const v = Object.fromEntries([...COLLS, ...SOLO_RUTA].map((c, i) => [c, ls[i]]));
  v.settings = Object.fromEntries((await Promise.all(['drive', 'brief_open'].map((id) => db.get('settings', id).catch(() => null)))).map((d, i) => [['drive', 'brief_open'][i], d]));
  MEM = { at: Date.now(), v, ver: db.version() };
  return v;
}
export const olvidar = () => { MEM = { at: 0, v: null, ver: -1 }; };
// Los clientes del repo: su ficha de oferta y qué entregables hay en su carpeta (sin leerlos).
async function repo() {
  if (REPO.v && Date.now() - REPO.at < 60_000) return REPO.v;
  const slugs = ['inherent', ...(await intel.clientSlugs().catch(() => []))];
  const v = await Promise.all(slugs.map(async (slug) => { const [f, p] = await Promise.all([ficha(slug).catch(() => null), intel.presentes(slug).catch(() => [])]); return { slug, nombre: f?.nombre || slug, ficha: f || { hay: false, nivel: null, incluye: [], pipeline: [], redes: '' }, presentes: p }; }));
  REPO = { at: Date.now(), v };
  return v;
}
const slugDeId = (id) => String(id || '').split('--')[0];
const veContenidoCompleto = (u) => u.role === 'ceo' || ['completo', 'edita'].includes(levelOf(u, 'content'));

// → { persona, datos } para las reglas (public/js/avisos-reglas/).
export async function datosDe(u) {
  const c = await crudo();
  const sc = await scoper(u, { tasks: c.tasks, projects: c.projects, leads: c.leads });
  const scDe = (coll) => (SCOPED.includes(coll) || ['content', 'sources'].includes(coll) ? sc : null);
  const L = Object.fromEntries(await Promise.all(COLLS.map(async (coll) => [coll, await leer(u, coll, { pre: c[coll], sc: scDe(coll) })])));
  const enAlcance = (slug) => !sc || slug === 'inherent' || sc.client(slug);
  // Los clientes que esta persona ve (para los avisos de «Clientes»): los de su alcance, si ve algo de su trabajo.
  const veClientes = ['estrategia', 'clients', 'operations', 'work', 'content'].some((a) => sees(u, a)) || u.role === 'ceo';
  const clientes = veClientes ? (await repo()).filter((x) => enAlcance(x.slug)).map((x) => ({ ...x, presentes: u.role === 'ceo' ? x.presentes : x.presentes.filter((p) => !p.costos) })) : [];
  // Estrategia: quien la ve, de los clientes de su alcance (la regla de /api/estrategia).
  const strategy = sees(u, 'estrategia') || u.role === 'ceo' ? c.strategy.filter((d) => enAlcance(d.slug || slugDeId(d.id))) : [];
  // El plan del mes y las campañas: Marcas · contenido en completo o edita, sin la marca personal (la regla de /api/plan y /api/campanas).
  const marcaOk = (slug) => slug && slug !== 'personal' && enAlcance(slug);
  const plans = veContenidoCompleto(u) ? c.plans.filter((d) => marcaOk(d.profile || slugDeId(d.id))) : [];
  const campanas = veContenidoCompleto(u) ? c[COLL_C].filter((d) => marcaOk(d.profile)) : [];
  // Los anuncios por aprobar: solo el CEO los aprueba.
  const ad_variants = u.role === 'ceo' ? c.ad_variants : [];
  // Los juicios de Laya: solo los del elemento que esta persona ve (la regla de /api/laya/juicios).
  const cache = {}, judgments = [];
  for (const j of c.judgments.filter((x) => x.status === 'pendiente' || x.gate === 'factura')) if (await verObjetivo(u, j.target?.coll, j.target?.id, cache).catch(() => null)) judgments.push(j);
  const yo = (await db.get('team', u.email).catch(() => null)) || {};
  const datos = {
    ...L, strategy, plans, campanas, ad_variants, judgments, clientes, yo,
    settings: { drive: u.role === 'ceo' ? c.settings.drive : null, brief_open: c.settings.brief_open },
    guias: await guias().catch(() => []),
    tieneGoogle: Boolean(await db.vaultGet('google:' + u.email).catch(() => null)),
    // Lo del servidor solo para el CEO, y solo si está o no (nunca un valor).
    env: u.role === 'ceo' ? { push: pushListo(), cron: Boolean(process.env.CRON_SECRET), github: repoSource() === 'local' || Boolean(process.env.GITHUB_TOKEN), portal: Boolean(process.env.GOOGLE_PORTAL_CLIENT_ID && process.env.GOOGLE_PORTAL_CLIENT_SECRET) } : null,
    push: { listo: pushListo() },
  };
  const persona = personaDe({ email: u.email, nombre: u.name || yo.name || '', role: u.role, areas: u.areas || [], niveles: u.views || {}, puesto: yo.title || '' });
  return { persona, datos };
}
