// Las secciones del OS que pueden tener su video «Cómo se usa». La clave es la que app.js saca de la ruta: home, las
// secciones de Organization, ai, ws-<workspace> y la herramienta abierta (por su clave de módulo de antes: investigacion,
// icp, plan…, porque las herramientas se mapean a ellas y los videos ya grabados siguen calzando).
// El servidor (api/_lib/guia.js) usa esta misma lista para validar. Puro: sin DOM ni red.
export const SECCIONES = [['home', 'Home'], ['hoy', 'Hoy y Mis tareas'], ['proyectos', 'Clientes y Proyectos'], ['ventas', 'Ventas · CRM'], ['servicios', 'Servicios'], ['finanzas', 'Finanzas'], ['inherent', 'Company (Equipo, Visión, Library)'],
  ['ai', 'AI Harness'], ['ws-strategy', 'Strategy'], ['ws-marketing', 'Marketing'], ['ws-creative', 'Creative'], ['ws-consulting', 'Consulting'], ['ws-production', 'Production'],
  ['estrategia', 'Strategy · el tablero'], ['marcas', 'Marcas · la portada de antes'],
  ['investigacion', 'Marketing · Viral Intelligence Lab'], ['icp', 'Strategy · Customer Avatar Studio'], ['brief', 'Creative · Brief'], ['plan', 'Marketing · Content Strategy Studio'], ['campanas', 'Marketing · Campaign Architect'],
  ['formatos', 'Creative · Formatos'], ['ideas', 'Creative · Creative Direction Lab'], ['creacion', 'Production · Script & Storyboard Studio'], ['marca', 'Creative · Brand DNA Studio'], ['design', 'Creative · Visual Identity Builder'],
  ['video', 'Production · Post-Production Workspace'], ['calendario', 'Marketing · Content Calendar'], ['ads', 'Marketing · Ads Intelligence'], ['resultados', 'Marketing · Performance Center'], ['tech', 'Marketing · Funnel Builder'],
  ['diseno', 'Creative · Design Studio (el chat de Diseño)'], ['me', 'Mi perfil']];
export const nombreSeccion = (k) => (SECCIONES.find(([x]) => x === k) || [k, k])[1];
// Los videos que le tocan a una persona: los de su puesto (o los de todos) en el orden en que se grabaron para verse.
export const videosDe = (items, me) => items.filter((d) => me.role === 'ceo' || !d.roles?.length || d.roles.some((r) => (me.roles || []).includes(r)));
