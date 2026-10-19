// Las marcas del espacio Marcas: los clientes activos, Inherent y la marca personal del CEO (solo él la ve).
// Lo leen la barra de Marcas, su pantalla de inicio y el buscador. Se lee una vez por sesión (refresh() lo vuelve a leer).
import { api, col } from './core.js';
import { levelName } from './levels.js';

let cache = null, pending = null;
const cleanPlan = (s) => levelName(String(s || '').replace(/^[⬜🔷🟨]️?\s*/u, ''));
const slugOfAcc = (a) => a.slug || String(a.id || '').replace(/^acc-/, '');

// Qué ve cada perfil dentro de una marca. El servidor ya filtra; esto solo decide qué pestañas se ofrecen.
export const brandAccess = (me) => {
  const content = (me.areas || []).includes('content'), clients = (me.areas || []).includes('clients');
  return {
    content, contentFull: content && me.views?.content !== 'resumen',
    clients, clientsFull: clients && me.views?.clients !== 'resumen',
    any: me.role !== 'client' && (content || clients || me.role === 'ceo'),
  };
};

// [{ slug, name, sub, personal, content (tiene perfil de contenido), client (es cliente) }]
export function loadBrands(me, { force = false } = {}) {
  if (cache && !force) return Promise.resolve(cache);
  if (pending && !force) return pending;
  const A = brandAccess(me);
  if (!A.any) return Promise.resolve((cache = []));
  pending = Promise.all([
    A.content ? api('repo/content').catch(() => null) : null,
    A.clients ? api('repo/clients').catch(() => null) : null,
    A.clients ? col('accounts').list().catch(() => []) : [],
  ]).then(([cp, rc, accs]) => {
    const profs = new Map((cp?.profiles || []).map((p) => [p.slug, p]));
    const acc = (slug) => (accs || []).find((a) => slugOfAcc(a) === slug);
    const out = [];
    // Inherent primero: la marca de la casa.
    out.push({ slug: 'inherent', name: 'Inherent', sub: 'La marca de la casa', content: profs.has('inherent'), client: false });
    // Los clientes activos: con su ficha de oferta en el repo, o los que entraron por una cotización.
    const seen = new Set(['inherent', 'personal']);
    for (const c of (rc?.clients || []).filter((x) => x.hasPlan)) { if (seen.has(c.slug)) continue; seen.add(c.slug); out.push({ slug: c.slug, name: acc(c.slug)?.name || profs.get(c.slug)?.name || c.slug.toUpperCase(), sub: cleanPlan(c.plan) || 'Cliente', content: profs.has(c.slug), client: true }); }
    for (const a of accs || []) { const s = slugOfAcc(a); if (!a.from_quote || seen.has(s)) continue; seen.add(s); out.push({ slug: s, name: a.name || s.toUpperCase(), sub: 'Desde cotización', content: profs.has(s), client: true }); }
    // Los perfiles de contenido que no son un cliente con ficha (ej. un cliente nuevo que solo tiene su folder de contenido).
    for (const [s, p] of profs) { if (seen.has(s) || /-personal$/.test(s)) continue; seen.add(s); out.push({ slug: s, name: acc(s)?.name || p.name || s.toUpperCase(), sub: 'Cliente', content: true, client: A.clients }); }
    // La marca personal: solo el CEO, con candado.
    if (me.role === 'ceo') out.push({ slug: 'personal', name: 'Mi marca', sub: 'Tu marca personal', personal: true, content: profs.has('personal') || A.content, client: false });
    cache = out; pending = null; return out;
  }).catch(() => { pending = null; return (cache = []); });
  return pending;
}
export const brandsNow = () => cache || [];
export const forgetBrands = () => { cache = null; pending = null; };

// ---------- Los módulos de una marca (Marca › Módulo › Elemento) ----------
// [clave, nombre, ícono, qué hará (solo los que llegan después)]. Los 4 primeros ya funcionan; los demás se ven como «Próximamente».
export const MODULES = [
  ['investigacion', 'Investigación', 'search'],
  ['ideas', 'Ideas', 'bulb'],
  ['calendario', 'Calendario', 'cal'],
  ['marca', 'Marca', 'palette'],
  ['creacion', 'Creación', 'edit', 'Guiones de reel y story con la voz de la marca, desde una plantilla y con Claude al lado.'],
  ['formatos', 'Formatos', 'copy', 'Plantillas editables de reel, story y ficha de referente, listas para reusar.'],
  ['design', 'Design system', 'layers', 'Colores, tipografía, logo, grilla y componentes de la marca, sincronizados con Figma.'],
  ['video', 'Video', 'video', 'Una ficha por video: assets, cortes, lógica y transiciones, con vista previa.'],
  ['ads', 'Ads', 'megaphone', 'Variaciones de una pieza que funcionó, listas para pautar en Meta y Google con tu OK.'],
];
export const isSoon = (k) => Boolean(MODULES.find(([x]) => x === k)?.[3]);
// Los módulos que ya funcionan y que este perfil puede abrir en esta marca.
export function modulesFor(me, b) {
  const A = brandAccess(me);
  if (!b) return [];
  const ok = {
    investigacion: A.contentFull,
    ideas: A.contentFull,
    calendario: A.content,
    marca: b.personal ? me.role === 'ceo' : A.clientsFull,
  };
  return MODULES.filter(([k, , , soon]) => !soon && ok[k]).map(([k]) => k);
}
// El módulo con el que abre una marca: el primero que este perfil puede abrir (o Creación, si no hay ninguno).
export const defaultModule = (me, b) => modulesFor(me, b)[0] || 'creacion';
