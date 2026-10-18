// Quién ve qué y para qué. Lo decide el CEO en Administración → Vistas por rol, por perfil de trabajo.
// Este archivo lo comparten el servidor (access.js, mcp.js) y la interfaz: la misma regla en los dos lados.
// Se guarda en settings (id «role_views») como
//   { views: { <perfil>: { <sección>: 'oculto' | 'resumen' | 'completo' | 'edita' } },
//     scope: { <perfil>: 'todos' | 'asignados' | 'propio' },      ← qué clientes y tareas ve
//     start: { <perfil>: <sección> } }                             ← dónde abre al entrar
// Sin configuración, todo sigue como siempre: cada rol ve sus áreas de siempre y puede editarlas.
// Un perfil que no está en la lista no opina; si una persona tiene varios perfiles, gana el más amplio.
export const SECTIONS = [['home', 'Hoy'], ['control', 'Control'], ['clients', 'Clientes'], ['sales', 'Comercial · prospectos'], ['operations', 'Proyectos'], ['work', 'Workspace'], ['content', 'Contenido'], ['resultados', 'Indicadores'], ['roadmap', 'Roadmap'], ['finanzas', 'Finanzas'], ['library', 'Library'], ['team', 'Equipo']];
// Las 8 secciones de la barra y qué pantallas (áreas) agrupa cada una. Una sección aparece si su perfil ve al menos una.
// La primera pantalla de cada lista es la que abre la sección; las demás siguen existiendo por su ruta (Equipo → «Más»).
// «Mi marca» (#/mimarca) es solo del CEO y no entra en la matriz: no agrupa ninguna pantalla.
export const GROUPS = [
  ['hoy', 'Hoy', ['home', 'control', 'work', 'resultados']],
  ['clientes', 'Clientes', ['clients', 'operations']],
  ['servicios', 'Servicios', ['sales', 'finanzas']],
  ['contenido', 'Contenido', ['content']],
  ['mimarca', 'Mi marca', []],
  ['roadmap', 'Roadmap', ['roadmap']],
  ['equipo', 'Equipo', ['team']],
  ['library', 'Library', ['library']],
];
export const groupOf = (area) => (GROUPS.find(([, , l]) => l.includes(area)) || [])[0] || null;
export const AREAS = SECTIONS.map(([k]) => k);
export const LEVELS = [['oculto', 'Oculto'], ['resumen', 'Resumen'], ['completo', 'Completo'], ['edita', 'Edita']];
export const RANK = { oculto: 0, resumen: 1, completo: 2, edita: 3 };
export const LEVEL_HELP = { oculto: 'No aparece ni se entrega por la API ni por el conector de Claude', resumen: 'Indicadores y lo que requiere acción', completo: 'Lo ve todo, sin cambiar nada', edita: 'Lo ve todo y puede crear o cambiar' };
// Las secciones con vista «resumen» y qué muestra cada una (lo demás solo se ve en «completo»).
export const SUMMARY = {
  home: 'Tus responsabilidades de hoy, con su fecha y su área de entrega; sin números de la empresa',
  control: 'Los indicadores del flujo y «Necesita atención»; sin las tarjetas del embudo',
  operations: 'Los proyectos con su avance y las tareas atrasadas o en revisión; sin pipeline, calendario ni timeline',
  clients: 'La lista de clientes con su nivel, su avance y sus metas; sin accesos, links, precios ni portal',
  sales: 'Los indicadores del CRM y los seguimientos vencidos; sin catálogo, precios ni cotizaciones',
  finanzas: 'Los movimientos del mes (ingresos y gastos); sin costos, rentabilidad, precios ni pagos',
  content: 'Solo el rendimiento (Analytics), sin Research ni Calendario',
};
// El alcance de los datos: qué proyectos, tareas, clientes y leads entran en las listas.
export const SCOPES = [['todos', 'Todos los clientes'], ['asignados', 'Solo sus clientes'], ['propio', 'Solo lo suyo']];
export const SCOPE_RANK = { propio: 0, asignados: 1, todos: 2 };
export const SCOPE_HELP = { todos: 'Ve los proyectos, tareas, clientes y leads de toda la empresa', asignados: 'Solo los proyectos donde tiene tareas (y sus clientes y tareas); los leads de su rol', propio: 'Solo sus tareas, los proyectos donde las tiene y los leads que creó' };
// Dónde abre cada perfil al entrar. Por defecto: sus responsabilidades de hoy; el CEO en Hoy, el COO en Control.
export const STARTS = [['work', 'Hoy · sus responsabilidades'], ['home', 'Hoy'], ['control', 'Control (vía Equipo → Más)'], ['clients', 'Clientes'], ['operations', 'Clientes · proyectos'], ['sales', 'Servicios · prospectos'], ['finanzas', 'Servicios · finanzas'], ['content', 'Contenido'], ['resultados', 'Indicadores (vía Equipo → Más)'], ['library', 'Library']];
const DEFAULT_START = { ceo: 'home', coo: 'control' };
// Lo que nunca cambia la matriz: Finanzas para quien no es CEO se queda en resumen (costos, márgenes,
// tarifas y pagos son solo del CEO), y Team siempre se ve (quién es quién); cambiarlo ya es solo del CEO.
const CAP = { finanzas: 'resumen' };
const FLOOR = { team: 'completo' };

// Las áreas de siempre de cada rol de acceso (sin configuración, esto es lo que ve cada quien).
// Resultados (los indicadores) lo ven por defecto el CEO y el COO; cada bloque además pide ver su sección de origen.
const ROLE_AREAS = { ceo: AREAS, coo: AREAS.filter((a) => a !== 'finanzas' && a !== 'roadmap'), team: ['home', 'work', 'content', 'library', 'team'], client: [] };
// Content es para decidir: solo el CEO y quien tiene el perfil de trabajo «content».
// Sales entra también con el perfil de trabajo «ventas» (el CRM lo opera un rol, no una persona).
export const baseAreas = (role, roles = []) => [...(ROLE_AREAS[role] || []), ...(role === 'team' && roles.includes('ventas') ? ['sales'] : [])].filter((a) => a !== 'content' || role === 'ceo' || roles.includes('content'));

// Los perfiles de trabajo de una persona (igual que el Workspace).
export const rolesOf = (me) => (me.roles?.length ? me.roles : me.role === 'ceo' ? ['ceo'] : me.role === 'coo' ? ['coo'] : []);
const byRank = (rank) => (a, z) => (rank[a] > rank[z] ? a : z);

// La profundidad de cada sección para una persona. El CEO siempre lo ve y lo edita todo.
// Con perfiles configurados gana el más amplio; lo que un perfil no toca sigue como siempre.
export function levelsFor(doc, me) {
  const roles = rolesOf(me), base = new Set(baseAreas(me.role, roles));
  const cfg = roles.filter((r) => doc?.views?.[r] && typeof doc.views[r] === 'object');
  const out = {};
  for (const k of AREAS) {
    if (me.role === 'ceo') { out[k] = 'edita'; continue; }
    const b = base.has(k) ? 'edita' : 'oculto';
    let lv = cfg.length ? cfg.map((r) => (doc.views[r][k] in RANK ? doc.views[r][k] : b)).reduce(byRank(RANK)) : b;
    if (CAP[k] && RANK[lv] > RANK[CAP[k]]) lv = CAP[k];
    if (FLOOR[k] && RANK[lv] < RANK[FLOOR[k]]) lv = FLOOR[k];
    if (lv === 'resumen' && !SUMMARY[k]) lv = 'completo'; // sin vista resumen, no hay término medio
    out[k] = lv;
  }
  return out;
}
// El alcance de una persona: el más amplio de sus perfiles configurados; sin configurar, todo (como siempre).
export function scopeFor(doc, me) {
  if (me.role === 'ceo') return 'todos';
  const l = rolesOf(me).map((r) => doc?.scope?.[r]).filter((s) => s in SCOPE_RANK);
  return l.length ? l.reduce(byRank(SCOPE_RANK)) : 'todos';
}
// Dónde abre: lo configurado para su primer perfil que lo tenga; si no, su cola de hoy. El CEO siempre en Home.
export function startFor(doc, me, views) {
  const want = (me.role === 'ceo' ? null : rolesOf(me).map((r) => doc?.start?.[r]).find((s) => AREAS.includes(s))) || DEFAULT_START[me.role] || 'work';
  if (views && views[want] !== 'oculto') return want;
  return AREAS.find((a) => views?.[a] && views[a] !== 'oculto') || 'home';
}
export const canEdit = (me, area) => !me?.views || me.views[area] === 'edita';
export const isSummary = (me, area) => me?.views?.[area] === 'resumen';

// Deja en `me` lo que se aplica: me.views, me.scope, me.start y me.areas (solo las visibles).
export function applyViews(me, doc) {
  me.areasAll ||= [...(me.areas || [])];
  me.viewsDoc = doc || null;
  if (me.role === 'client') return me;
  const lv = levelsFor(doc, me);
  me.views = lv; me.scope = scopeFor(doc, me); me.start = startFor(doc, me, lv);
  let areas = AREAS.filter((a) => lv[a] !== 'oculto');
  if (me.areasAll.includes('portal')) areas.push('portal');
  if (!areas.length) areas = ['home'];
  me.areas = areas;
  return me;
}
