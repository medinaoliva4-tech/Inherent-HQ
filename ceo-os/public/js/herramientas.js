// El registro de herramientas del OS: los 5 workspaces, sus pestañas, las 42 herramientas y las rutas (nuevas y viejas).
// Es la única lista: la barra lateral, la página de un workspace (screens/workspace.js), los alias de app.js y las
// pruebas (scripts/test-herramientas.mjs) leen de aquí. Puro: sin DOM ni red, sin importar brandlist/core/app.
// Los permisos los pone el servidor; puede() y puedeWs() solo reflejan la misma regla (copiada de brandAccess y hasEstrategia).
// Las herramientas de Consulting traen aquí lo que ya hace su módulo puro (public/js/consulting/<m>.js: prompt, leer, limpiar,
// faltas, aMd…): con eso el shell, el servidor (que limpia y mide las faltas al aprobar) y las pruebas leen lo mismo.
import * as salud from './consulting/salud.js';
import * as causas from './consulting/causas.js';
import * as procesos from './consulting/procesos.js';
import * as escenarios from './consulting/escenarios.js';
import * as blueprint from './consulting/blueprint.js';
import * as impacto from './consulting/impacto.js';

// ---------- El flujo compartido (7 pasos) ----------
export const FLUJO = [
  { id: 'objective', nombre: 'Objective' },
  { id: 'research', nombre: 'Research' },
  { id: 'plan', nombre: 'Plan' },
  { id: 'execute', nombre: 'Execute' },
  { id: 'deliver', nombre: 'Deliver' },
  { id: 'measure', nombre: 'Measure' },
  { id: 'improve', nombre: 'Improve' },
];

// ---------- Los workspaces ----------
// color = token --ui-m-<id> de app.css · modo = el modo del Chat (llm/modos.js) · paso = su lugar en el flujo.
const P = (id, nombre, paso) => ({ id, nombre, paso });
export const WORKSPACES = [
  { id: 'strategy', nombre: 'Strategy', sub: 'Entender el negocio y diseñar el crecimiento', icono: 'nav-strategy', color: '--ui-m-strategy', modo: 'estrategia',
    pestanas: [P('overview', 'Overview', 'objective'), P('research', 'Research', 'research'), P('analysis', 'Analysis', 'research'), P('strategy', 'Strategy', 'plan'), P('roadmap', 'Roadmap', 'deliver')] },
  { id: 'marketing', nombre: 'Marketing', sub: 'Generar demanda y optimizar ingresos', icono: 'nav-marketing', color: '--ui-m-marketing', modo: 'marketing',
    pestanas: [P('overview', 'Overview', 'objective'), P('audience', 'Audience', 'research'), P('campaigns', 'Campaigns', 'plan'), P('content', 'Content', 'execute'), P('analytics', 'Analytics', 'measure')] },
  { id: 'creative', nombre: 'Creative', sub: 'De la estrategia aprobada a la identidad y las piezas', icono: 'nav-creative', color: '--ui-m-creative', modo: 'diseno',
    pestanas: [P('overview', 'Overview', 'objective'), P('brief', 'Brief', 'research'), P('concepts', 'Concepts', 'plan'), P('design', 'Design', 'execute'), P('review', 'Review', 'deliver')] },
  { id: 'consulting', nombre: 'Consulting', sub: 'Que la empresa aguante la demanda y deje más', icono: 'nav-consulting', color: '--ui-m-consulting', modo: 'consulting',
    pestanas: [P('overview', 'Overview', 'objective'), P('assessment', 'Assessment', 'research'), P('analysis', 'Analysis', 'research'), P('solutions', 'Solutions', 'plan'), P('implementation', 'Implementation', 'measure')] },
  { id: 'production', nombre: 'Production', sub: 'Planear, grabar y entregar producciones', icono: 'nav-production', color: '--ui-m-production', modo: 'produccion',
    pestanas: [P('overview', 'Overview', 'objective'), P('pre-production', 'Pre-production', 'plan'), P('production', 'Production', 'execute'), P('post-production', 'Post-production', 'execute'), P('delivery', 'Delivery', 'deliver')] },
];
export const wsDe = (id) => WORKSPACES.find((w) => w.id === id) || null;
export const pestanaDe = (ws, id) => wsDe(ws)?.pestanas.find((p) => p.id === id) || null;

// ---------- Quién puede (refleja; el servidor decide) ----------
// Copia de brandAccess (brandlist.js) y hasEstrategia (app.js): no se importan porque tocan el DOM.
const areas = (me) => me?.areas || [];
export const veEstrategia = (me) => Boolean(me) && me.role !== 'client' && areas(me).includes('estrategia');
export const acc = (me) => {
  const content = areas(me).includes('content'), clients = areas(me).includes('clients');
  return {
    content, contentFull: content && me?.views?.content !== 'resumen',
    clients, clientsFull: clients && me?.views?.clients !== 'resumen',
    any: Boolean(me) && me.role !== 'client' && (content || clients || me.role === 'ceo'),
  };
};
// b = el cliente del contexto ({ slug, personal, content, client }) o null.
const soloEstrategia = (me) => veEstrategia(me);
const contenido = (me) => acc(me).contentFull;
const contenidoNoPersonal = (me, b) => !b?.personal && acc(me).contentFull;
const marca = (me, b) => (b?.personal ? me?.role === 'ceo' : acc(me).clientsFull);
const sistema = (me, b) => !b?.personal && (acc(me).contentFull || acc(me).clientsFull);
const resultados = (me) => acc(me).content;
export const puedeWs = (me, wsId) => (wsId === 'strategy' || wsId === 'consulting' ? veEstrategia(me) : wsDe(wsId) ? acc(me).any : false);

// ---------- Las 42 herramientas ----------
// Forma: ver PLAN-WORKSPACES.md §4.1. estado: 'lista' (existe) · 'parcial' (se monta lo que hay) · 'pronto' (su tarjeta abre la ficha).
// monta: la clave de la tabla de montaje de screens/workspace.js; null si es 'pronto'. viene_de se calcula abajo (el inverso de va_a).
// puede(me, b) = abre el workspace (puedeWs) y cumple la regla propia de la herramienta.
const H = (o) => ({ estado: 'pronto', monta: null, aprueba: 'coo', viene_de: [], va_a: [], ...o, puede: (me, b) => puedeWs(me, o.ws) && o.puede(me, b) });
const D = (nota) => ({ coll: 'deliverables', nota });
// Una herramienta con entregable que se monta en el Tool Shell: m = su módulo puro, vista = la clave de su vista (consulting/<vista>-ui.js).
// El shell pide bloque, prompt, leer, limpiar, faltas y aMd; tareasDe (opcional) enciende «Convertir en tareas».
// sinCostos(contenido) y conCostos(actual, nuevo) (opcionales): el servidor los usa con quien no ve costos (quita los del cliente al leer y los conserva al guardar).
const SH = (m, vista, extra = {}) => ({ estado: 'parcial', monta: 'shell', vista, bloque: m.BLOQUE, vacio: m.vacio, prompt: m.prompt, leer: m.leer, limpiar: m.limpiar, faltas: m.faltas, aMd: m.aMd, ...extra });
// El Plan de 90 días no recomienda demanda con la capacidad en rojo. El servidor pasa extra.capacidadRoja (del último Diagnóstico
// aprobado); en pantalla el shell pasa las entradas leídas (extra.ctx.entradas), de donde se saca el mismo dato.
const capacidadRojaDe = (extra = {}) => {
  if (typeof extra.capacidadRoja === 'boolean') return extra.capacidadRoja;
  const d = (Array.isArray(extra.ctx?.entradas) ? extra.ctx.entradas : []).find((e) => e?.tool === 'business-health-assessment');
  return d ? salud.capacidadRoja(salud.limpiar(d.contenido)) : false;
};
const faltasPlan = (c, extra = {}) => blueprint.faltas(c, { ...extra, capacidadRoja: capacidadRojaDe(extra) });
export const HERRAMIENTAS = [
  // Strategy — entender el negocio, encontrar oportunidades, diseñar crecimiento rentable (9)
  H({ id: 'customer-bullseye', ws: 'strategy', pestana: 'research', nombre: 'Customer Bullseye', produce: 'La diana: ICP, segmentos por prioridad y un mensaje por anillo',
    estado: 'parcial', prioridad: 'P1', icono: 'target', monta: 'bullseye', guarda: { coll: 'sources', nota: 'cfg-<slug>.bullseye + espejo en deliverables' },
    va_a: ['customer-avatar-studio', 'offer-architect', 'campaign-architect'], aprueba: 'ceo', puede: soloEstrategia }),
  H({ id: 'customer-avatar-studio', ws: 'strategy', pestana: 'research', nombre: 'Customer Avatar Studio', produce: 'Avatares con buyer journey de 5 etapas y pesos que suman 100',
    estado: 'parcial', prioridad: 'P1', icono: 'user', monta: 'avatar', guarda: { coll: 'avatars', nota: 'por sus rutas (PUT avatares/:id con v); se archiva, no se borra' },
    va_a: ['offer-architect', 'copywriting-studio'], aprueba: 'ceo', puede: soloEstrategia }),
  H({ id: 'competitor-radar', ws: 'strategy', pestana: 'research', nombre: 'Competitor Radar', produce: 'Panorama de competidores, mapa de posicionamiento y huecos con evidencia',
    prioridad: 'P2', icono: 'radar', guarda: D('un doc por radar; la competencia se escribe por la ruta de content'),
    va_a: ['opportunity-map', 'pricing-packages'], aprueba: 'ceo', puede: soloEstrategia }),
  H({ id: 'business-xray', ws: 'strategy', pestana: 'analysis', nombre: 'Business X-Ray', produce: 'La etapa, un tablero de salud de 6 ejes y dónde está trabado',
    estado: 'parcial', prioridad: 'P1', icono: 'eye', monta: 'strategy', bloque_hz: 'diagnostico', guarda: D('tool business-xray; se refleja en viva.contexto y viva.analisis'),
    va_a: ['opportunity-map', 'customer-bullseye'], aprueba: 'ceo', puede: soloEstrategia }),
  H({ id: 'commercial-diagnosis', ws: 'strategy', pestana: 'analysis', nombre: 'Commercial Diagnosis', produce: 'Score comercial, embudo con cuellos de botella y plan de 3 a 5 acciones',
    prioridad: 'P2', icono: 'chart-no-axes-column', guarda: { coll: 'strategy', nota: 'viva.comercial { bottlenecks, acciones }; el score se calcula, no se guarda' },
    va_a: ['opportunity-map'], aprueba: 'ceo', puede: soloEstrategia }),
  H({ id: 'opportunity-map', ws: 'strategy', pestana: 'strategy', nombre: 'Opportunity Map', produce: 'Matriz impacto × dificultad con un ranking calculado',
    prioridad: 'P2', icono: 'compass', guarda: D('items con origen, puntajes y fuera_alcance'),
    va_a: ['growth-roadmap'], aprueba: 'ceo', puede: soloEstrategia }),
  H({ id: 'offer-architect', ws: 'strategy', pestana: 'strategy', nombre: 'Offer Architect', produce: 'La ecuación de valor, el stack Grand Slam y 2 o 3 variaciones de oferta',
    estado: 'parcial', prioridad: 'P1', icono: 'layers', monta: 'strategy', bloque_hz: 'oferta', guarda: D('espejo; la aprobación sigue en strategy <slug>--oferta y <slug>--modelo'),
    va_a: ['pricing-packages', 'campaign-architect', 'growth-roadmap'], aprueba: 'ceo', puede: soloEstrategia }),
  H({ id: 'pricing-packages', ws: 'strategy', pestana: 'strategy', nombre: 'Pricing & Packages Builder', produce: 'Matriz de precios, paquetes y simulador de margen',
    prioridad: 'P2', icono: 'tag', guarda: D('los costos del cliente etiquetados; los resultados del simulador no se guardan'),
    va_a: ['campaign-architect'], aprueba: 'ceo', puede: soloEstrategia }),
  H({ id: 'growth-roadmap', ws: 'strategy', pestana: 'roadmap', nombre: 'Growth Roadmap Builder', produce: 'Timeline por área y trimestre, con hitos y tareas',
    estado: 'parcial', prioridad: 'P1', icono: 'rocket', monta: 'strategy', bloque_hz: 'roadmap', guarda: { coll: 'strategy', nota: 'viva.roadmap + items; los hitos van a accounts.goals' },
    va_a: ['content-strategy-studio'], aprueba: 'ceo', puede: soloEstrategia }),

  // Marketing — generar demanda, construir audiencias, adquirir y optimizar ingresos (10)
  H({ id: 'viral-intelligence-lab', ws: 'marketing', pestana: 'audience', nombre: 'Viral Intelligence Lab', produce: 'Trend Radar, Pattern Report y oportunidades de contenido',
    estado: 'parcial', prioridad: 'P1', icono: 'flame', monta: 'research', guarda: D('un doc por patrón; research y sources/cfg siguen igual'),
    va_a: ['customer-bullseye', 'hook-laboratory', 'content-strategy-studio'], puede: contenido }),
  H({ id: 'hook-laboratory', ws: 'marketing', pestana: 'content', nombre: 'Hook Laboratory', produce: 'Biblioteca de hooks y matriz de pruebas',
    prioridad: 'P2', icono: 'zap', guarda: D('los hooks salen del research sin reescribirlos'),
    va_a: ['copywriting-studio', 'creative-direction-lab'], puede: contenido }),
  H({ id: 'content-strategy-studio', ws: 'marketing', pestana: 'content', nombre: 'Content Strategy Studio', produce: 'El plan del mes: campaña, pilares a 100 y slots por semana y canal',
    estado: 'parcial', prioridad: 'P1', icono: 'clipboard-list', monta: 'plan', guarda: { coll: 'plans', nota: 'por /api/plan con v' },
    va_a: ['creative-direction-lab', 'content-calendar'], puede: contenidoNoPersonal }),
  H({ id: 'copywriting-studio', ws: 'marketing', pestana: 'content', nombre: 'Copywriting Studio', produce: 'Marco de mensajes y variantes de copy con contador por canal',
    prioridad: 'P2', icono: 'pencil', guarda: D('la elegida va a ad_variants, al caption de la pieza o a la landing'),
    va_a: ['ads-intelligence', 'design-studio'], puede: contenido }),
  H({ id: 'content-calendar', ws: 'marketing', pestana: 'content', nombre: 'Content Calendar', produce: 'El calendario del mes con cada pieza en su día',
    estado: 'lista', prioridad: 'P1', icono: 'calendar', monta: 'calendario', guarda: { coll: 'content', nota: 'por /api/db/content; reglasPieza y el candado del brief aplican' },
    va_a: ['marketing-performance-center', 'production-planner'], puede: contenido }),
  H({ id: 'campaign-architect', ws: 'marketing', pestana: 'campaigns', nombre: 'Campaign Architect', produce: 'Blueprint de campaña, plan de canales por fase y briefs creativos',
    estado: 'parcial', prioridad: 'P1', icono: 'calendar-days', monta: 'campanas', guarda: { coll: 'mk_campaigns', nota: 'extendido con canales, briefs y resultados' },
    va_a: ['creative-direction-lab', 'content-strategy-studio', 'funnel-builder', 'ads-intelligence'], puede: contenidoNoPersonal }),
  H({ id: 'funnel-builder', ws: 'marketing', pestana: 'campaigns', nombre: 'Funnel Builder', produce: 'El embudo con sus caídas por etapa; sitios y landings',
    estado: 'parcial', prioridad: 'P2', icono: 'funnel', monta: 'tech', guarda: D('las landings siguen en tech por sus rutas'),
    va_a: ['marketing-performance-center'], puede: contenidoNoPersonal }),
  H({ id: 'ads-intelligence', ws: 'marketing', pestana: 'campaigns', nombre: 'Ads Intelligence', produce: 'Dashboard de pauta, recomendaciones con evidencia y variaciones de anuncio',
    estado: 'parcial', prioridad: 'P1', icono: 'megaphone', monta: 'ads', guarda: D('una recomendación por doc; nunca escribe a una plataforma de anuncios'),
    va_a: ['marketing-performance-center'], aprueba: 'ceo', puede: contenidoNoPersonal }),
  H({ id: 'marketing-performance-center', ws: 'marketing', pestana: 'analytics', nombre: 'Marketing Performance Center', produce: 'KPIs con su fuente, tabla por función, pilar y canal, y el reporte mensual',
    estado: 'parcial', prioridad: 'P1', icono: 'chart-column', monta: 'analytics', guarda: D('uno por mes'),
    va_a: ['growth-experiment-lab', 'creative-performance-analyzer'], puede: resultados }),
  H({ id: 'growth-experiment-lab', ws: 'marketing', pestana: 'analytics', nombre: 'Growth Experiment Lab', produce: 'Kanban de experimentos con su muestra mínima',
    prioridad: 'P3', icono: 'kanban', guarda: D('migra bx.calib'), puede: contenido }),

  // Creative — convertir la estrategia aprobada en identidad y piezas (7)
  H({ id: 'brand-dna-studio', ws: 'creative', pestana: 'brief', nombre: 'Brand DNA Studio', produce: 'Territorio, personalidad, voz y activos distintivos de la marca',
    estado: 'parcial', prioridad: 'P1', icono: 'heart', monta: 'brandBoard', guarda: { coll: 'brand_boards', nota: 'campo dna; exportar al repo solo el CEO (decisión 7.2-f)' },
    va_a: ['moodboard-studio', 'visual-identity-builder', 'creative-direction-lab'], puede: marca }),
  H({ id: 'moodboard-studio', ws: 'creative', pestana: 'concepts', nombre: 'Moodboard Studio', produce: 'Moodboard por zonas con 2 o 3 direcciones',
    estado: 'parcial', prioridad: 'P1', icono: 'image', monta: 'brandBoard', guarda: { coll: 'brand_boards', nota: 'images extendido (zona, nota, fuente, ojo) + direcciones' },
    va_a: ['creative-direction-lab', 'visual-identity-builder'], puede: marca }),
  H({ id: 'creative-direction-lab', ws: 'creative', pestana: 'concepts', nombre: 'Creative Direction Lab', produce: 'Insight, big idea y 3 a 5 conceptos comparables',
    estado: 'parcial', prioridad: 'P1', icono: 'lightbulb', monta: 'ideas', guarda: D('uno por marca y mes, con la campaña como entrada'),
    va_a: ['design-studio', 'production-brief', 'script-storyboard-studio'], puede: contenido }),
  H({ id: 'visual-identity-builder', ws: 'creative', pestana: 'design', nombre: 'Visual Identity Builder', produce: 'El sistema visual: paleta, tipografía, logos, grilla y prohibido',
    estado: 'parcial', prioridad: 'P1', icono: 'palette', monta: 'design', guarda: { coll: 'brand_boards', nota: 'sistema_borrador; publicar al repo solo el CEO (decisión 7.2-f)' },
    va_a: ['design-studio', 'brand-consistency-checker'], puede: sistema }),
  H({ id: 'design-studio', ws: 'creative', pestana: 'design', nombre: 'Design Studio', produce: 'Las láminas de cada pieza con variaciones A, B y C',
    estado: 'parcial', prioridad: 'P1', icono: 'pen-tool', monta: 'disenoChat', guarda: { coll: 'content', nota: 'diseno + variaciones[] + elegida' },
    va_a: ['brand-consistency-checker', 'content-calendar'], puede: contenido }),
  H({ id: 'brand-consistency-checker', ws: 'creative', pestana: 'review', nombre: 'Brand Consistency Checker', produce: 'Un reporte por pieza: color, tipografía, composición, prohibido, voz y parecido',
    prioridad: 'P2', icono: 'badge-check', guarda: { coll: 'content', nota: 'cumplimiento, con historial que solo se agrega' },
    va_a: ['review-approval-studio'], puede: contenido }),
  H({ id: 'creative-performance-analyzer', ws: 'creative', pestana: 'overview', nombre: 'Creative Performance Analyzer', produce: 'Scorecard por pieza publicada y 3 patrones ganadores',
    prioridad: 'P2', icono: 'chart-no-axes-column-increasing', guarda: { coll: 'content', nota: 'resultado + un deliverable de aprendizaje por marca y mes' },
    puede: contenido }),

  // Consulting — el backend del crecimiento: que la empresa aguante la demanda y que cada venta deje más (8)
  H({ id: 'business-health-assessment', ws: 'consulting', pestana: 'assessment', nombre: 'Diagnóstico de crecimiento', alias: 'Business Health Assessment',
    ...SH(salud, 'salud'),
    produce: 'La etapa, la restricción, capacidad vs demanda y el scorecard de los 4 sistemas', prioridad: 'P1', icono: 'chart-pie',
    guarda: D('tool business-health-assessment; lee la etapa y trabado de Strategy, no los duplica'),
    va_a: ['root-cause-explorer', 'organization-architect'], aprueba: 'ceo', puede: soloEstrategia }),
  H({ id: 'root-cause-explorer', ws: 'consulting', pestana: 'analysis', nombre: 'Árbol de la brecha', alias: 'Root Cause Explorer',
    ...SH(causas, 'causas', { tareasDe: causas.tareasDe }),
    produce: 'La brecha de la meta, abierta por la ecuación de ingresos hasta sus causas', prioridad: 'P1', icono: 'git-branch',
    guarda: D('el diagrama (diagram-model.js); las pruebas se vuelven tareas area consulting'),
    va_a: ['process-mapper', 'financial-scenario-lab'], puede: soloEstrategia }),
  H({ id: 'process-mapper', ws: 'consulting', pestana: 'analysis', nombre: 'Mapa del camino del dinero', alias: 'Process Mapper',
    ...SH(procesos, 'procesos'),
    produce: 'El recorrido lead → venta → entrega → recompra, hoy vs optimizado', prioridad: 'P1', icono: 'shuffle',
    guarda: D('el diagrama con carriles por rol + el estándar de entrega'),
    va_a: ['automation-opportunity-finder', 'organization-architect', 'solution-blueprint-builder'], puede: soloEstrategia }),
  H({ id: 'financial-scenario-lab', ws: 'consulting', pestana: 'analysis', nombre: 'Money Model Lab', alias: 'Financial Scenario Lab',
    ...SH(escenarios, 'escenarios', { sinCostos: escenarios.sinCostos, conCostos: escenarios.conCostos }), // el servidor las usa con quien no ve costos
    produce: 'BMC, BCG, modelo de dinero y 2 a 4 escenarios con margen, CAC, LTV y caja', prioridad: 'P1', icono: 'wallet',
    guarda: D('los números del cliente etiquetados; un cambio de precio u oferta se manda a Strategy como encargo'),
    va_a: ['solution-blueprint-builder', 'offer-architect', 'pricing-packages'], aprueba: 'ceo', puede: soloEstrategia }),
  H({ id: 'automation-opportunity-finder', ws: 'consulting', pestana: 'solutions', nombre: 'Automation Opportunity Finder', alias: 'Automation Opportunity Finder',
    produce: 'Matriz impacto en ventas × esfuerzo sobre los pasos manuales', prioridad: 'P2', icono: 'wrench',
    guarda: D('las horas vienen del cliente o dicen SIN DATOS'),
    va_a: ['solution-blueprint-builder'], puede: soloEstrategia }),
  H({ id: 'organization-architect', ws: 'consulting', pestana: 'solutions', nombre: 'Equipo para la siguiente etapa', alias: 'Organization Architect',
    produce: 'Organigrama de hoy vs la siguiente etapa, RACI, perfiles y rituales', prioridad: 'P2', icono: 'users',
    guarda: D('nunca lee team ni recipes (son de Inherent)'),
    va_a: ['solution-blueprint-builder'], puede: soloEstrategia }),
  H({ id: 'solution-blueprint-builder', ws: 'consulting', pestana: 'solutions', nombre: 'Plan de crecimiento 90 días', alias: 'Solution Blueprint Builder',
    ...SH(blueprint, 'blueprint', { tareasDe: blueprint.tareasDe, faltas: faltasPlan }),
    produce: 'Filas con objetivo, restricción, sistema, dueño, primer paso y métrica', prioridad: 'P1', icono: 'list-checks',
    guarda: D('se convierte en tareas area consulting; las métricas van a accounts.goals'),
    va_a: ['impact-tracker'], puede: soloEstrategia }),
  H({ id: 'impact-tracker', ws: 'consulting', pestana: 'implementation', nombre: 'Impact Tracker', alias: 'Impact Tracker',
    ...SH(impacto, 'impacto'),
    produce: 'Antes vs después de la ecuación de ingresos y del scorecard, con el reporte para el cliente', prioridad: 'P1', icono: 'trending-up',
    guarda: D('las metas en accounts.goals por la ruta que ya existe; el reporte como deliverable'),
    puede: soloEstrategia }),

  // Production — planear, crear, coordinar y entregar producciones audiovisuales (8)
  H({ id: 'production-brief', ws: 'production', pestana: 'pre-production', nombre: 'Production Brief Builder', produce: 'El brief del ciclo: piezas video y foto, techo de horas y devoluciones',
    prioridad: 'P1', icono: 'file-text', guarda: D('tool production-brief, uno por ciclo AAAA-MM'),
    va_a: ['shot-list-builder', 'script-storyboard-studio', 'production-planner'], puede: contenido }),
  H({ id: 'script-storyboard-studio', ws: 'production', pestana: 'pre-production', nombre: 'Script & Storyboard Studio', produce: 'Guiones con storyboard por tramo y versiones',
    estado: 'parcial', prioridad: 'P1', icono: 'square-pen', monta: 'creacion', guarda: { coll: 'scripts', nota: 'por sus rutas; frames[] y versiones[]; se archiva, no se borra' },
    va_a: ['shot-list-builder'], puede: contenido }),
  H({ id: 'shot-list-builder', ws: 'production', pestana: 'pre-production', nombre: 'Shot List Builder', produce: 'Escenas PR-xxx agrupadas por locación, talento y setup; CSV de 16 columnas',
    prioridad: 'P1', icono: 'table', guarda: D('tool shot-list-builder, por ciclo; costo_estimado vacío para quien no ve costos'),
    va_a: ['production-planner'], puede: contenido }),
  H({ id: 'production-planner', ws: 'production', pestana: 'production', nombre: 'Production Planner', produce: 'Jornadas, orden de tiro y call sheet, con el candado del día 11',
    prioridad: 'P2', icono: 'clock', guarda: { coll: 'content', nota: 'kind shoot (sin migrar) + produccion, escenas, orden; archivar, no borrar' },
    va_a: ['post-production-workspace'], puede: contenido }),
  H({ id: 'ai-video-lab', ws: 'production', pestana: 'production', nombre: 'AI Video Lab', produce: 'Pedidos de video con IA: prompt, links y el veredicto del ojo',
    prioridad: 'P3', icono: 'sparkles', guarda: D('solo integra; la generación corre afuera'),
    va_a: ['post-production-workspace'], puede: contenido }),
  H({ id: 'post-production-workspace', ws: 'production', pestana: 'post-production', nombre: 'Post-Production Workspace', produce: 'Pipeline por capas, versiones y checklist QA de cada video',
    estado: 'parcial', prioridad: 'P1', icono: 'video', monta: 'video', guarda: { coll: 'videos', nota: 'por sus rutas; capa, version, versiones[], qa, derivada_de y post' },
    va_a: ['review-approval-studio', 'content-repurposing'], puede: contenido }),
  H({ id: 'review-approval-studio', ws: 'production', pestana: 'delivery', nombre: 'Review & Approval Studio', produce: 'Reproductor con comentarios al segundo, versiones y aprobar o pedir cambios',
    prioridad: 'P1', icono: 'circle-check', guarda: { coll: 'videos', nota: 'revision, comentarios[], aprobacion; espejado en la pieza ligada' },
    va_a: ['content-repurposing'], puede: contenido }),
  H({ id: 'content-repurposing', ws: 'production', pestana: 'delivery', nombre: 'Content Repurposing Engine', produce: 'Matriz maestro × salidas y derivadas, con el medidor 1:2',
    prioridad: 'P2', icono: 'repeat', guarda: { coll: 'videos', nota: 'las derivadas son fichas con derivada_de; las variantes de hook van a Ads Studio' },
    va_a: ['ads-intelligence'], puede: contenido }),
];

// viene_de = quién le manda (el inverso de va_a), más los lazos de aprendizaje que no son una arista del grafo.
const APRENDE_DE = { 'business-health-assessment': ['impact-tracker'] };
for (const h of HERRAMIENTAS) h.viene_de = [...new Set([...HERRAMIENTAS.filter((o) => o.va_a.includes(h.id)).map((o) => o.id), ...(APRENDE_DE[h.id] || [])])];

export const herramientaDe = (id) => HERRAMIENTAS.find((h) => h.id === id) || null;
export const deWorkspace = (ws, pestana) => HERRAMIENTAS.filter((h) => h.ws === ws && (!pestana || h.pestana === pestana));
// Los va_a en profundidad hasta el final, sin repetir, en orden BFS, empezando por el propio id.
export function cadena(id) {
  const out = [], cola = [id], visto = new Set();
  while (cola.length) {
    const x = cola.shift(); const h = herramientaDe(x);
    if (!h || visto.has(x)) continue;
    visto.add(x); out.push(x);
    for (const y of h.va_a) if (!visto.has(y)) cola.push(y);
  }
  return out;
}

// ---------- Las rutas viejas (PLAN §3.6) ----------
// Módulo de Marcas → ws/pestaña[/herramienta[/resto]] · bloque de Estrategia → pestaña/herramienta[/resto].
export const LEGACY_MODULO = {
  inicio: 'marketing/overview',
  investigacion: 'marketing/audience/viral-intelligence-lab',
  icp: 'strategy/research/customer-avatar-studio',
  brief: 'creative/brief',
  plan: 'marketing/content/content-strategy-studio',
  campanas: 'marketing/campaigns/campaign-architect',
  ideas: 'creative/concepts/creative-direction-lab',
  formatos: 'creative/concepts/creative-direction-lab/formatos',
  creacion: 'production/pre-production/script-storyboard-studio',
  marca: 'creative/brief/brand-dna-studio',
  design: 'creative/design/visual-identity-builder',
  video: 'production/post-production/post-production-workspace',
  calendario: 'marketing/content/content-calendar',
  ads: 'marketing/campaigns/ads-intelligence',
  tech: 'marketing/campaigns/funnel-builder',
  resultados: 'marketing/analytics/marketing-performance-center',
};
export const LEGACY_BLOQUE = {
  diagnostico: 'analysis/business-xray',
  oferta: 'strategy/offer-architect',
  modelo: 'strategy/offer-architect/modelo',
  leads: 'strategy/offer-architect/leads',
  roadmap: 'roadmap/growth-roadmap',
};
// El módulo viejo cuya ruta termina en esta herramienta (el primero), o ''.
export const moduloDe = (toolId) => (Object.entries(LEGACY_MODULO).find(([, r]) => r.split('/').pop() === toolId) || [''])[0];

// ---------- Las rutas nuevas ----------
const limpio = (xs) => xs.map((x) => String(x ?? '').trim()).filter(Boolean);
// → '#/ws/<ws>/<slug>/<pestaña>/<herramienta>[/<resto>]'. La herramienta manda sobre el ws y la pestaña (vive en un solo lugar).
export function rutaHerramienta(ws, slug, toolId, resto = []) {
  const h = herramientaDe(toolId), w = h ? h.ws : ws;
  if (!wsDe(w)) return '#/home';
  if (!slug) return `#/ws/${w}`;
  if (h) return ['#/ws', w, slug, h.pestana, h.id, ...limpio(resto)].join('/');
  return `#/ws/${w}/${slug}/${pestanaDe(w, toolId) ? toolId : 'overview'}`;
}
// → '#/ws/strategy/<slug>/<pestaña>/<herramienta>[/<bloque>]' para un bloque de la estrategia de hoy.
export const rutaBloque = (slug, bloque) => (slug ? `#/ws/strategy/${slug}/${LEGACY_BLOQUE[bloque] || 'overview'}` : '#/ws/strategy');
// → '#/ws/<ws>/<slug>/…' para una clave de módulo de Marcas (LEGACY_MODULO); módulo desconocido → el Overview de Marketing.
export function rutaModulo(slug, modulo, resto = []) {
  const [ws, ...camino] = (LEGACY_MODULO[modulo] || 'marketing/overview').split('/');
  return slug ? ['#/ws', ws, slug, ...camino, ...limpio(resto)].join('/') : `#/ws/${ws}`;
}

// ---------- Leer una ruta (nueva o vieja) ----------
const partes = (hash) => String(hash ?? '').replace(/^#?\/?/, '').replace(/\/+$/, '').split('/').filter(Boolean);
const con = (ws, slug, ...resto) => (slug ? ['ws', ws, slug, ...resto].join('/') : `ws/${ws}`);

// Una ruta '#/ws/…' → { ws, slug, pestana, tool, resto, ruta } ya validada; null si el workspace no existe.
function leerWs(r) {
  const ws = r[0];
  if (!wsDe(ws)) return null;
  const slug = r[1] || '';
  if (!slug) return { ws, slug: '', pestana: 'overview', tool: '', resto: [], ruta: `ws/${ws}` };
  let pestana = pestanaDe(ws, r[2]) ? r[2] : 'overview', tool = '', resto = [];
  // La herramienta puede venir en su lugar (4.º) o directo después del cliente; su pestaña manda.
  const i = pestanaDe(ws, r[2]) ? 3 : 2, h = herramientaDe(r[i]);
  if (h && h.ws === ws) { tool = h.id; pestana = h.pestana; resto = r.slice(i + 1); }
  return { ws, slug, pestana, tool, resto, ruta: ['ws', ws, slug, pestana, ...(tool ? [tool, ...resto] : [])].join('/') };
}
// #/marcas… (la tabla de 3.6).
function viejaMarcas(r, contexto) {
  if (!r.length) return { ruta: 'home' };
  if (r[0] === 'diseno') return { ruta: con('creative', r[1] || contexto, 'design', 'design-studio') };
  const [slug, mod, ...resto] = r;
  const destino = LEGACY_MODULO[mod];
  if (!destino) return { ruta: con('marketing', slug, 'overview') };
  const [ws, ...camino] = destino.split('/');
  return { ruta: con(ws, slug, ...camino, ...resto) };
}
// #/estrategia[/<cliente>[/<bloque>[/resto]]].
function viejaEstrategia(r, contexto) {
  const slug = r[0] || contexto;
  if (!slug) return { ruta: 'ws/strategy' };
  const bloque = LEGACY_BLOQUE[r[1]];
  return { ruta: con('strategy', slug, ...(bloque ? [...bloque.split('/'), ...r.slice(2)] : ['overview'])) };
}
// hash: con o sin '#/' inicial. (a) '#/ws/…' → { ws, slug, pestana, tool, resto, ruta } · (b) una ruta vieja → { ruta } traducida
// (contexto = el cliente abierto, para las viejas que no traen slug) · (c) null si no es ninguna (eso lo resuelve app.js).
export function wsDeRuta(hash, { contexto = '' } = {}) {
  const [a, ...r] = partes(hash);
  if (!a) return null;
  if (a === 'ws') return leerWs(r);
  if (a === 'marcas') return viejaMarcas(r, contexto);
  if (a === 'estrategia') return viejaEstrategia(r, contexto);
  if (a === 'consulting') return { ruta: con('consulting', r[0] || contexto, 'overview') };
  if (a === 'content' && r[0] === 'fuentes') return { ruta: con('strategy', r[1] || contexto, 'research', 'customer-bullseye') };
  return null;
}
