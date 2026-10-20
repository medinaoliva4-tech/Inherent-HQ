// Quién ve qué y para qué. Lo decide el CEO en Administración → Vistas por rol, por perfil de trabajo.
// Este archivo lo comparten el servidor (access.js, mcp.js) y la interfaz: la misma regla en los dos lados.
// Se guarda en settings (id «role_views») como
//   { views: { <perfil>: { <sección>: 'oculto' | 'resumen' | 'completo' | 'edita' } },
//     scope: { <perfil>: 'todos' | 'asignados' | 'propio' },      ← qué clientes y tareas ve
//     start: { <perfil>: <sección> } }                             ← dónde abre al entrar
// Sin configuración, todo sigue como siempre: cada rol ve sus áreas de siempre y puede editarlas.
// Un perfil que no está en la lista no opina; si una persona tiene varios perfiles, gana el más amplio.
// «sales» abre Ventas (CRM, cotizaciones, fuentes) y Servicios (paquetes, catálogo, especialistas, responsabilidades).
export const SECTIONS = [['home', 'Hoy'], ['control', 'Control del flujo'], ['clients', 'Clientes'], ['sales', 'Ventas y Servicios'],['operations', 'Proyectos'], ['work', 'Workspace'], ['content', 'Marcas · contenido'], ['estrategia', 'Estrategia'], ['resultados', 'Indicadores'], ['roadmap', 'Roadmap'], ['finanzas', 'Finanzas'], ['library', 'Library'], ['team', 'Equipo']];
// Los dos espacios del OS y sus secciones. El interruptor de arriba cambia de espacio; cada uno tiene su propia barra.
//   Organization (cómo se maneja la empresa): Hoy · Proyectos · Ventas · Servicios · Finanzas · Inherent.
//   Marcas (cómo se crean marcas): una marca por cliente, Inherent y la marca personal del CEO (privada).
// [clave, nombre, áreas de la matriz que agrupa, espacio]. Una sección aparece si su perfil ve al menos una de sus áreas
// (Servicios pide ver Comercial completo; Inherent también tiene Visión y misión, que ve todo el equipo).
// El Centro de control ya no es una sección: sus herramientas viven en Hoy, Ventas, Servicios, Finanzas e Inherent.
export const GROUPS = [
  ['hoy', 'Hoy', ['home', 'work', 'control', 'resultados'], 'org'],
  ['proyectos', 'Proyectos', ['clients', 'operations'], 'org'],
  ['ventas', 'Ventas', ['sales'], 'org'],
  ['servicios', 'Servicios', [], 'org'],
  ['finanzas', 'Finanzas', ['finanzas'], 'org'],
  ['inherent', 'Inherent', ['team', 'roadmap', 'library'], 'org'],
  ['estrategia', 'Estrategia', ['estrategia'], 'estrategia'],
  ['marcas', 'Marcas', ['content'], 'marcas'],
];
// Tres espacios: Organization · Estrategia (App 02: lo ve el CEO y quien él habilite aquí) · Marcas.
export const SPACES = [['org', 'Organization'], ['estrategia', 'Estrategia'], ['marcas', 'Marcas']];
// Cada cosa vive en un solo lugar: Ventas = conseguir y cerrar (CRM · Cotizaciones · Fuentes); Servicios = lo que vendemos
// y cómo se entrega (Paquetes · Servicios · Especialistas · Responsabilidades); Proyectos = ejecutar (Tareas · Calendario · Timeline).
// Las rutas viejas de lo que se mudó redirigen a su lugar nuevo (las usa el router de app.js). Lo que sigue a la ruta se conserva.
export const MOVED = {
  'sales/cat': 'services/servicios', 'sales/catalogo': 'services/servicios', 'sales/servicios': 'services/servicios',
  'sales/esp': 'services/especialistas', 'sales/especialistas': 'services/especialistas',
  'sales/pkg': 'services/paquetes/industria', 'sales/paquetes': 'services/paquetes',
  'services/quotes': 'sales/quotes', 'services/cotizaciones': 'sales/quotes',
  'operations/calendario': 'operations/cal', 'operations/timeline': 'operations/time',
};
// ['org','sales','cat',…] o ['sales','cat',…] → ['org','services','servicios',…]; null si la ruta no se mudó.
export function movedRoute(parts = []) {
  const p = parts[0] === 'org' ? parts.slice(1) : parts;
  const to = MOVED[`${p[0]}/${p[1]}`];
  return to ? ['org', ...to.split('/'), ...p.slice(2)] : null;
}
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
export const STARTS = [['work', 'Hoy · sus responsabilidades'], ['home', 'Hoy'], ['control', 'Hoy · Control del flujo'], ['clients', 'Proyectos · clientes'], ['operations', 'Proyectos'], ['sales', 'Ventas · CRM'], ['finanzas', 'Finanzas'], ['content', 'Marcas'], ['resultados', 'Hoy · Indicadores'], ['library', 'Inherent · Library']];
const DEFAULT_START = { ceo: 'home', coo: 'control' };
// Lo que nunca cambia la matriz: Finanzas para quien no es CEO se queda en resumen (costos, márgenes,
// tarifas y pagos son solo del CEO), y Team siempre se ve (quién es quién); cambiarlo ya es solo del CEO.
const CAP = { finanzas: 'resumen' };
const FLOOR = { team: 'completo' };

// Las áreas de siempre de cada rol de acceso (sin configuración, esto es lo que ve cada quien).
// Resultados (los indicadores) lo ven por defecto el CEO y el COO; cada bloque además pide ver su sección de origen.
const ROLE_AREAS = { ceo: AREAS, coo: AREAS.filter((a) => a !== 'finanzas' && a !== 'roadmap'), team: ['home', 'work', 'content', 'library', 'team'], client: [] };
// Estrategia es del CEO y de quien él habilite en esta matriz (nadie la ve por defecto; el cliente nunca).
// Content es para decidir: solo el CEO y quien tiene el perfil de trabajo «content».
// Sales entra también con el perfil de trabajo «ventas» (el CRM lo opera un rol, no una persona).
export const baseAreas = (role, roles = []) => [...(ROLE_AREAS[role] || []), ...(role === 'team' && roles.includes('ventas') ? ['sales'] : [])].filter((a) => (a !== 'content' || role === 'ceo' || roles.includes('content')) && (a !== 'estrategia' || role === 'ceo'));

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

// ---------- El puesto: qué ve cada perfil, para qué lo ve y qué hace ahí ----------
// Lo leen Hoy, el Workspace y Mi perfil (tarjeta «Tu puesto») y el CEO en Equipo → Vistas por rol.
// Una frase por cosa, en lenguaje humano. Los perfiles que hoy no se asignan solos (diseño, producción,
// community) dicen dentro de cuál viven, para que el CEO sepa dónde cae ese trabajo.
export const PURPOSE = {
  ceo: { name: 'CEO', short: 'Decides estrategia, precio y pauta, y revisas lo que te rinde cuentas.', sees: 'Toda la empresa: clientes, dinero, equipo, contenido y pauta.', why: 'Para decidir: estrategia, precio, alcance y presupuesto de pauta.', does: 'Aprueba la estrategia (① Strategy) y la pauta (⑩ Ads), revisa lo que le rinde cuentas y vende.',
    sections: { home: 'Qué pasa hoy en Inherent: entregas, lo que espera tu decisión y la agenda', control: 'El flujo completo de la empresa y lo que necesita atención', work: 'Tu día: tus tareas, las decisiones que esperan tu OK, la agenda y el equipo', resultados: 'Los indicadores reales de la empresa', clients: 'Cada cliente: ficha, accesos, portal y metas', operations: 'Proyectos, pipeline por cliente y calendario del ciclo', sales: 'El CRM y las cotizaciones', finanzas: 'Caja, cobros, costos y rentabilidad', content: 'Research, planner y rendimiento de cada perfil', estrategia: 'La estrategia de cada cliente por bloques, con el chat de Strategy y su aprobación', roadmap: 'Los megaproyectos de Inherent', library: 'SOPs, playbooks y prompts', team: 'Quién es quién, perfiles y la matriz de vistas' } },
  coo: { name: 'COO · Operaciones', short: 'Que cada entrega salga a tiempo y bien: revisas y coordinas.', sees: 'Todos los proyectos, las tareas y la carga del equipo.', why: 'Para que cada entrega salga a tiempo y con calidad.', does: 'Coordina, revisa las entregas (QA final) y presenta el día 20.',
    sections: { home: 'Qué pasa hoy: entregas y lo que necesita atención', control: 'El flujo del mes y los cuellos de botella', work: 'Tu día: entregas por revisar, controles del ciclo y carga del equipo', operations: 'Proyectos, fases y responsables', clients: 'La ficha y el avance de cada cliente', sales: 'Seguimiento comercial', content: 'El plan de contenido de cada cliente', library: 'SOPs y plantillas del equipo', team: 'Perfiles y roles por proyecto' } },
  content: { name: 'Content · Agent operator', short: 'Ideas, diseño y publicaciones de cada cliente, a tiempo.', sees: 'Las ideas, el plan y las piezas de cada cliente que tiene asignado.', why: 'Para que cada ciclo tenga ideas, guion, diseño y publicación a tiempo.', does: 'Opera los agentes de ④ Creatividad, ⑥A Diseño y ⑨ Posting, y sube el trabajo a revisión.',
    sections: { home: 'Tus responsabilidades de hoy con su fecha', work: 'Tu día: plan de contenido, diseño y community', content: 'Research, planner y calendario de cada perfil', library: 'Tus SOPs y prompts', team: 'Quién hace qué' } },
  video: { name: 'Video editor · Agent operator', short: 'Editas los videos del ciclo y subes cada corte a revisión.', sees: 'Su cola de videos y ads por fecha de entrega, con los assets y prompts de cada marca.', why: 'Para editar lo planificado sin buscar material ni adivinar el estilo.', does: 'Edita, exporta y sube el corte a revisión.',
    sections: { home: 'Qué cortes vencen hoy y esta semana', work: 'Tu día: cola de producción y kit por cliente', library: 'SOPs de edición y prompts generales', team: 'Quién hace qué' } },
  finance: { name: 'Finance + Business mapping', short: 'Mapeas el negocio del cliente para que gane más y gaste menos.', sees: 'Los proyectos de Business Growth y sus tareas.', why: 'Para que el cliente gane más y gaste menos, con números.', does: 'Mapea el negocio, entrega los análisis y los sube a revisión.',
    sections: { home: 'Tus entregas de hoy', work: 'Tus proyectos de Business Growth y tu checklist', library: 'SOPs de finanzas y mapping', team: 'Quién hace qué' } },
  cobros: { name: 'Finanzas de Inherent · cobros', short: 'Cobras a tiempo y cuadras la caja.', sees: 'Los movimientos del mes: ingresos y gastos, sin costos ni márgenes.', why: 'Para que se cobre a tiempo y la caja cuadre.', does: 'Registra cobros y pagos y persigue lo vencido.',
    sections: { home: 'Qué se cobra hoy', work: 'Tu día: tus tareas de cobro y lo pendiente por cobrar', finanzas: 'Los movimientos del mes (resumen)', library: 'SOP de caja y cobros', team: 'Quién hace qué' } },
  ads: { name: 'Ads management', short: 'Compras resultado con el dinero del cliente, solo con el OK del CEO.', sees: 'Por cliente con pauta: el encargo, el OK del CEO, sus tareas de ⑩, las campañas y el aprendizaje.', why: 'Para comprar resultado con el dinero del cliente sin lanzar nada que el CEO no aprobó.', does: 'Corre las capas de ⑩ Ads con sus skills ad-*, registra campañas y entrega cada tarea.',
    sections: { home: 'Tus tareas de ⑩ Ads que vencen hoy', work: 'Tu día: encargo, campañas y aprendizaje de cada cliente con pauta', library: 'SOPs de pauta y prompts', team: 'Quién hace qué' } },
  ventas: { name: 'Ventas · CRM y seguimiento', short: 'Que ningún lead se enfríe: das seguimiento a tiempo.', sees: 'Los prospectos y su seguimiento; sin precios internos ni cotizaciones de otros.', why: 'Para que ningún lead se enfríe.', does: 'Mueve leads, anota la actividad y agenda el siguiente paso.',
    sections: { home: 'Seguimientos de hoy', work: 'Tu día: tus tareas comerciales y los seguimientos del CRM', sales: 'El CRM: prospectos, etapas y seguimientos', library: 'Guiones y SOP de ventas', team: 'Quién hace qué' } },
  client: { name: 'Cliente', sees: 'Su portal: el plan, las entregas y los resultados de su marca.', why: 'Para saber qué se hizo, qué viene y cómo va.', does: 'Revisa y aprueba lo que se le presenta.', sections: { portal: 'Su plan, entregas y resultados' } },
  // Trabajo que hoy vive dentro de otro perfil (no se asigna solo).
  diseno: { name: 'Diseño gráfico', within: 'content', sees: 'Sus tareas de ⑥A Diseño y static ads, con el material de cada cliente.', why: 'Para componer con las plantillas del kit, sin inventar la marca.', does: 'Diseña, exporta y sube a revisión (Workspace → Contenido → Diseño).' },
  produccion: { name: 'Producción', within: 'video', sees: 'Las jornadas de grabación y el shot list del ciclo.', why: 'Para grabar lo planificado antes del día 11.', does: 'Graba y sube el crudo al Drive del cliente (Workspace → Video).' },
  community: { name: 'Community', within: 'content', sees: 'El setup de community de cada cliente: tono, FAQ, escalamiento y plantillas.', why: 'Para que la bandeja se conteste con la ficha y nadie invente.', does: 'Completa la ficha y revisa la corrida (Workspace → Contenido → Community).' },
};
// Para qué sirve cada sección, cuando el perfil no dice nada más específico.
export const SECTION_PURPOSE = { home: 'Qué te toca hoy, con su fecha', control: 'El flujo de la empresa y lo que necesita atención', clients: 'La ficha y el avance de cada cliente', sales: 'Prospectos y seguimiento', operations: 'Proyectos y sus fases', work: 'Tu trabajo, en orden', content: 'Research, planner y calendario', resultados: 'Indicadores reales', roadmap: 'Los megaproyectos', finanzas: 'Los números', library: 'SOPs, plantillas y prompts', team: 'Quién es quién', portal: 'Lo que ve el cliente' };
// El perfil principal de una persona: el CEO y el COO por su rol; el equipo, su primer perfil de trabajo.
export const mainProfile = (me) => (me.role === 'ceo' ? 'ceo' : me.role === 'coo' ? 'coo' : me.role === 'client' ? 'client' : rolesOf(me).find((r) => PURPOSE[r]) || null);
// El texto de «Tu puesto» para una persona: su perfil, para qué ve lo que ve y qué hace, y cada sección
// habilitada con su nivel y su propósito. Usa me.views si ya viene aplicado; si no, lo calcula con la matriz (doc).
export function rolePurpose(me, doc = me?.viewsDoc) {
  const key = mainProfile(me), p = key ? PURPOSE[key] : null;
  const others = rolesOf(me).filter((r) => r !== key && PURPOSE[r]).map((r) => PURPOSE[r].name);
  const views = me.role === 'client' ? { portal: 'completo' } : me.views || levelsFor(doc, me);
  const sections = [...SECTIONS, ['portal', 'Portal']].filter(([k]) => views[k] && views[k] !== 'oculto').map(([k, label]) => ({ k, label, level: views[k], purpose: p?.sections?.[k] || SECTION_PURPOSE[k] || '' }));
  return { key, name: p?.name || 'Sin perfil de trabajo', sees: p?.sees || 'Tus tareas y tu Kanban.', why: p?.why || 'Para entregar lo tuyo a tiempo.', does: p?.does || 'Pide al CEO tu perfil en Equipo → tu persona → Perfiles de trabajo.', others, sections, start: me.start || null, scope: me.scope || null };
}
