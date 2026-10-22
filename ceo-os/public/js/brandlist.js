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
// [clave, nombre, ícono, qué hará (solo los que llegan después)]. Los que traen texto se ven como «Pronto».
export const MODULES = [
  ['inicio', 'Inicio', 'home'],
  ['investigacion', 'Investigación', 'search'],
  ['icp', 'Cliente ideal', 'target'],
  ['brief', 'Brief del ciclo', 'doc'],
  ['plan', 'Plan del mes', 'target'],
  ['ideas', 'Ideas', 'bulb'],
  ['creacion', 'Guiones', 'edit'],
  ['formatos', 'Formatos', 'copy'],
  ['marca', 'Identidad', 'palette'],
  ['design', 'Design system', 'layers'],
  ['video', 'Video', 'video'],
  ['calendario', 'Calendario', 'cal'],
  ['ads', 'Ads', 'megaphone'],
  ['tech', 'Tech', 'globe'],
  ['resultados', 'Resultados', 'bars'],
];
// Las áreas: los módulos agrupados por función, en el orden del trabajo (entender → crear → diseñar → publicar y medir).
// [clave, nombre, ícono, módulos, para qué]. Inicio es el panel de la marca: va solo.
export const AREAS = [
  ['inicio', 'Inicio', 'home', ['inicio'], 'Cómo va la marca hoy'],
  ['entender', 'Entender', 'search', ['investigacion', 'icp', 'brief'], 'Qué funciona, a quién le hablamos y qué decimos este mes'],
  ['crear', 'Crear', 'bulb', ['plan', 'formatos', 'ideas', 'creacion'], 'Del plan del mes al guion, en una sola línea'],
  ['diseno', 'Diseño', 'palette', ['marca', 'design', 'video'], 'Cómo se ve y cómo suena la marca'],
  ['publicar', 'Publicar y medir', 'cal', ['calendario', 'ads', 'resultados'], 'Qué sale, cuándo, con qué pauta y qué funcionó'],
  ['tech', 'Tech', 'globe', ['tech'], 'Su web, sus landings y sus herramientas'],
];
// La línea del trabajo: de dónde viene cada herramienta, qué se hace en ella y a dónde pasa. Es la misma cabecera en todas.
// clave → [viene de, qué haces aquí, pasa a]
export const FLUJO = {
  investigacion: [null, 'Los posts que ganan en su mercado, con su porqué. De aquí salen los formatos.', 'formatos'],
  icp: ['investigacion', 'A quién le hablamos, con qué peso y cómo se nota en el video.', 'brief'],
  brief: ['icp', 'Qué decimos este mes y su candado: sin brief no hay ideas.', 'plan'],
  plan: ['brief', 'Qué se dice este mes, en qué canal y semana, y para qué sirve cada pieza. Se arma en el chat de Diseño gráfico.', 'formatos'],
  formatos: ['investigacion', 'Los formatos que ya funcionan, sacados de los posts ganadores. Una idea se cuenta en uno de estos.', 'ideas'],
  ideas: ['plan', 'Cada idea junta tres cosas: qué comunicamos (el plan), el formato que ya funciona y cómo se adapta.', 'creacion'],
  creacion: ['ideas', 'El guion, tramo por tramo, con el formato de la idea y el brief al lado.', 'calendario'],
  marca: [null, 'La identidad: territorio, voz y lo que la hace reconocible.', 'design'],
  design: ['marca', 'Cómo se ve la marca, en valores que se ejecutan. El chat de Diseño gráfico lo usa para armar las piezas.', 'calendario'],
  calendario: ['creacion', 'Lo que hay que hacer, lo que se planea y lo que ya está programado: se prende y se apaga cada uno.', 'resultados'],
  video: ['design', 'El kit de edición de la marca y una ficha por video: assets, cortes y música. ⑦ Video Editing lo arma con Claude.', 'calendario'],
  ads: ['calendario', 'De lo que funcionó, variaciones por avatar para Meta y Google. Solo se lanza con el OK del CEO.', 'resultados'],
  tech: ['design', 'Su web, landings y herramientas: la landing conectada al CRM, la web viva y la auditoría de SEO.', 'resultados'],
  resultados: ['calendario', 'Qué funcionó y qué no. Vuelve a Investigación y al plan del mes siguiente.', 'investigacion'],
};
export const areaOf = (k) => AREAS.find(([, , , mods]) => mods.includes(k)) || AREAS[0];
export const isSoon = (k) => Boolean(MODULES.find(([x]) => x === k)?.[3]);
// Los módulos que ya funcionan y que este perfil puede abrir en esta marca.
export function modulesFor(me, b) {
  const A = brandAccess(me);
  if (!b) return [];
  const ok = {
    inicio: A.any,
    investigacion: A.contentFull,
    icp: A.contentFull,
    brief: A.contentFull,
    plan: !b.personal && A.contentFull,
    ideas: A.contentFull,
    creacion: A.contentFull,
    formatos: A.contentFull,
    calendario: A.contentFull,
    resultados: A.content,
    marca: b.personal ? me.role === 'ceo' : A.clientsFull,
    design: !b.personal && (A.contentFull || A.clientsFull),
    video: A.contentFull,
    ads: !b.personal && A.contentFull,
    tech: !b.personal && A.contentFull,
  };
  return MODULES.filter(([k, , , soon]) => !soon && ok[k]).map(([k]) => k);
}
// El módulo con el que abre una marca: su Inicio (o el primero que este perfil puede abrir).
export const defaultModule = (me, b) => modulesFor(me, b)[0] || 'creacion';
// El módulo con el que abre un área: el primero que funciona para este perfil, o el primero «Pronto».
export const firstOfArea = (me, b, area) => { const mods = (AREAS.find(([k]) => k === area) || AREAS[0])[3], live = modulesFor(me, b); return mods.find((k) => live.includes(k)) || mods.find(isSoon) || mods[0]; };
