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
import { repoSource, readFile } from './gh.js';
import { parseOperacion } from './parse.js';
import { COLL_C } from '../../public/js/campanas.js';
import { personaDe, cicloDe, hoyGT } from '../../public/js/avisos-reglas/base.js';
import { vivaId } from '../../public/js/estrategia-viva.js';

const COLLS = ['tasks', 'projects', 'team', 'leads', 'quotes', 'invoices', 'accounts', 'content', 'campaigns', 'mentors'];
const hay = (...ks) => ks.every((k) => Boolean(process.env[k]?.trim()));
const pushListo = () => hay('VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY');
const SETTINGS = ['drive', 'brief_open', 'laya_gates'];
const SOLO_RUTA = ['strategy', 'plans', COLL_C, 'ad_variants', 'judgments']; // no salen por db/:coll: aquí se aplica la regla de su ruta
let MEM = { at: 0, v: null, ver: -1 }, REPO = { at: 0, v: null };
async function crudo() {
  if (MEM.v && MEM.ver === db.version() && Date.now() - MEM.at < 20_000) return MEM.v;
  const ls = await Promise.all([...COLLS, ...SOLO_RUTA].map((c) => db.list(c).catch(() => [])));
  const v = Object.fromEntries([...COLLS, ...SOLO_RUTA].map((c, i) => [c, ls[i]]));
  v.settings = Object.fromEntries((await Promise.all(SETTINGS.map((id) => db.get('settings', id).catch(() => null)))).map((d, i) => [SETTINGS[i], d ?? null]));
  v.docs = await db.list('docs').catch(() => null);
  MEM = { at: Date.now(), v, ver: db.version() };
  return v;
}
export const olvidar = () => { MEM = { at: 0, v: null, ver: -1 }; };
// El brief del ciclo de este mes y del que viene, en las dos rutas (04-contenido/<mes>/ y …/ideas/: la del candado y la del
// manual). → ['AAAA-MM', …]. Si GitHub falla, la promesa falla y el cliente queda sin el campo: el aviso calla antes que
// decir «cerrado» sin saberlo.
async function briefCicloDe(slug) {
  const root = intel.rootOf(slug), { M, Mc } = cicloDe(hoyGT());
  const tiene = async (m) => Boolean((await readFile(`${root}/04-contenido/${m}/brief-del-ciclo.md`)) || (await readFile(`${root}/04-contenido/${m}/ideas/brief-del-ciclo.md`)));
  const si = await Promise.all([M, Mc].map(tiene));
  return [M, Mc].filter((m, i) => si[i]);
}
// Los clientes del repo: su ficha de oferta, qué entregables hay en su carpeta (sin leerlos) y su brief del ciclo.
async function repo() {
  if (REPO.v && Date.now() - REPO.at < 60_000) return REPO.v;
  const slugs = ['inherent', ...(await intel.clientSlugs().catch(() => []))];
  const v = await Promise.all(slugs.map(async (slug) => {
    const [f, p, b] = await Promise.all([ficha(slug).catch(() => null), intel.presentes(slug).catch(() => []), briefCicloDe(slug).catch(() => null)]);
    return { slug, nombre: f?.nombre || slug, ficha: f || { hay: false, nivel: null, incluye: [], pipeline: [], redes: '' }, presentes: p, ...(b ? { briefCiclo: b } : {}) };
  }));
  REPO = { at: Date.now(), v };
  return v;
}
// La tabla de slots del manual (quién ocupa cada rol: 05-OPERACION, sin costos), para pla-arranque. Se guarda 60 s.
let OPER = { at: 0, v: null };
async function slotsDelManual() {
  if (Date.now() - OPER.at < 60_000) return OPER.v;
  const f = await readFile('inherent/05-OPERACION.md').catch(() => null);
  OPER = { at: Date.now(), v: f ? parseOperacion(f.content).slots || null : null };
  return OPER.v;
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
  // aprobada: el candado del plan y las campañas (la estrategia viva con el OK del CEO), para quien opera Marcas o ve Estrategia.
  const veAprob = veContenidoCompleto(u) || sees(u, 'estrategia');
  const clientes = veClientes ? (await repo()).filter((x) => enAlcance(x.slug)).map((x) => ({ ...x, presentes: u.role === 'ceo' ? x.presentes : x.presentes.filter((p) => !p.costos), ...(veAprob ? { aprobada: Boolean(c.strategy.find((s) => s.id === vivaId(x.slug))?.aprobado) } : {}) })) : [];
  // Estrategia: quien la ve, de los clientes de su alcance (la regla de /api/estrategia).
  const strategy = sees(u, 'estrategia') || u.role === 'ceo' ? c.strategy.filter((d) => enAlcance(d.slug || slugDeId(d.id))) : [];
  // El plan del mes y las campañas: Marcas · contenido en completo o edita, sin la marca personal (la regla de /api/plan y /api/campanas).
  const marcaOk = (slug) => slug && slug !== 'personal' && enAlcance(slug);
  const plans = veContenidoCompleto(u) ? c.plans.filter((d) => marcaOk(d.profile || slugDeId(d.id))) : [];
  // La persona responsable de una campaña la recibe aunque no opere Marcas (sin piezas ni planes: las reglas no los cruzan).
  const campanas = c[COLL_C].filter((d) => marcaOk(d.profile) && (veContenidoCompleto(u) || String(d.responsable || '').toLowerCase() === u.email));
  // Los ciclos armados (solo cliente y mes) de los clientes de su alcance, aunque no vea ese proyecto: para ciclo-sin-armar.
  const ciclos = sees(u, 'operations') || u.role === 'ceo' ? c.projects.filter((p) => p.kind === 'Ciclo mensual' && p.client_slug && enAlcance(p.client_slug)).map((p) => ({ client_slug: p.client_slug, cycle: p.cycle || '' })) : [];
  // Los anuncios por aprobar: solo el CEO los aprueba.
  const ad_variants = u.role === 'ceo' ? c.ad_variants : [];
  // Los juicios de Laya: solo los del elemento que esta persona ve (la regla de /api/laya/juicios).
  const cache = {}, judgments = [];
  for (const j of c.judgments.filter((x) => x.status === 'pendiente' || x.gate === 'factura')) if (await verObjetivo(u, j.target?.coll, j.target?.id, cache).catch(() => null)) judgments.push(j);
  const yo = (await db.get('team', u.email).catch(() => null)) || {};
  const datos = {
    ...L, strategy, plans, campanas, ciclos, ad_variants, judgments, clientes, yo,
    settings: { drive: u.role === 'ceo' ? c.settings.drive ?? null : null, brief_open: c.settings.brief_open, laya_gates: u.role === 'ceo' ? c.settings.laya_gates : null },
    // El Arranque (solo el CEO, pla-arranque): la tabla de slots de 05-OPERACION y los títulos de la Library (sin el cuerpo).
    slots: u.role === 'ceo' ? await slotsDelManual() : null,
    docs: u.role === 'ceo' && c.docs ? c.docs.map((x) => ({ id: x.id, title: x.title || '' })) : null,
    guias: await guias().catch(() => []),
    tieneGoogle: Boolean(await db.vaultGet('google:' + u.email).catch(() => null)),
    // Lo del servidor solo para el CEO, y solo si está o no (nunca un valor).
    env: u.role === 'ceo' ? { push: pushListo(), cron: hay('CRON_SECRET'), github: repoSource() === 'local' || hay('GITHUB_TOKEN'), portal: hay('GOOGLE_PORTAL_CLIENT_ID', 'GOOGLE_PORTAL_CLIENT_SECRET') } : null,
    push: { listo: pushListo() },
  };
  const persona = personaDe({ email: u.email, nombre: u.name || yo.name || '', role: u.role, areas: u.areas || [], niveles: u.views || {}, puesto: yo.title || '' });
  return { persona, datos };
}
