// Vistas por rol: el CEO decide, por perfil de trabajo, qué secciones ve cada quien y con qué profundidad.
// Se guarda en settings (id «role_views») como { views: { <perfil>: { <sección>: 'oculto' | 'resumen' | 'completo' } } }.
// Sin configuración, todo se ve completo, como siempre. Un perfil que no está en la lista no opina.
export const SECTIONS = [['home', 'Home'], ['control', 'Control'], ['work', 'Workspace'], ['finanzas', 'Finance'], ['sales', 'Sales'], ['operations', 'Operations'], ['roadmap', 'Roadmap'], ['clients', 'Clients'], ['content', 'Content'], ['library', 'Library'], ['team', 'Team']];
// Las secciones que tienen una vista «resumen» y qué muestra.
export const SUMMARY = { content: 'Solo el rendimiento (Analytics), sin Research ni Calendario' };
export const LEVELS = [['oculto', 'Oculto'], ['resumen', 'Resumen'], ['completo', 'Completo']];
const RANK = { oculto: 0, resumen: 1, completo: 2 };

// Los perfiles de trabajo de una persona (igual que el Workspace).
export const rolesOf = (me) => (me.roles?.length ? me.roles : me.role === 'ceo' ? ['ceo'] : me.role === 'coo' ? ['coo'] : []);

// La profundidad de cada sección para una persona: lo máximo que le da cualquiera de sus perfiles configurados.
export function levelsFor(doc, roles) {
  const views = doc?.views || {}, cfg = roles.filter((r) => views[r] && typeof views[r] === 'object');
  const out = {};
  for (const [k] of SECTIONS) {
    if (!cfg.length) { out[k] = 'completo'; continue; }
    let best = -1;
    for (const r of cfg) { const l = views[r][k] in RANK ? views[r][k] : 'completo'; best = Math.max(best, RANK[l]); }
    out[k] = best === 0 ? 'oculto' : best === 1 ? 'resumen' : 'completo';
    if (out[k] === 'resumen' && !SUMMARY[k]) out[k] = 'completo'; // sin vista resumen, no hay término medio
  }
  return out;
}
// Deja en `me` lo que se aplica: me.views (profundidad por sección) y me.areas (sin las ocultas).
export function applyViews(me, doc) {
  me.areasAll ||= [...me.areas];
  me.viewsDoc = doc || null;
  if (me.role === 'client') return me;
  const lv = levelsFor(doc, rolesOf(me));
  if (me.role === 'ceo') lv.team = 'completo'; // el CEO nunca se queda sin poder cambiar esto
  me.views = lv;
  let areas = me.areasAll.filter((a) => lv[a] !== 'oculto');
  if (!areas.length) areas = [me.areasAll.includes('home') ? 'home' : me.areasAll[0]].filter(Boolean);
  me.areas = areas;
  return me;
}
