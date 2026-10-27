// Los 12 agentes del repo (agents/00-account … agents/10-ads-management) como lista fija, para la página Agents del
// Los 12 agentes del repo (antes la página #/ai/agents del AI Harness; hoy Inherent AI no la tiene, la lista se conserva). Puro: sin DOM ni red. El OS vive en Vercel y la carpeta agents/ NO está en la copia del build,
// así que no se lee ni se lista desde el servidor: esta lista se actualiza a mano cuando cambia agents/README.md
// (lo vigila scripts/test-harness.mjs: 12 agentes, ids únicos, números en orden).
// modo: el modo del Chat (llm/modos.js) que corre ese agente en el OS; '' = no tiene modo propio todavía.

// [n, id, nombre, departamento, qué hace (una línea), ventana en el ciclo, modo del Chat]
const FILAS = [
  ['00', 'account', 'Account Manager', 'Cuenta', 'El único agente que habla con el cliente: sostiene la relación y abre la sesión del agente que toca.', 'Siempre encendido', ''],
  ['01', 'strategy', 'Strategy', '① Strategy', 'Ingeniería inversa desde la meta financiera hasta la pieza; decide qué se activa según el alcance contratado.', 'Día 1 · revisión del 20', 'estrategia'],
  ['01.2', 'branding', 'Branding', '②B Branding', 'Convierte la dirección de Strategy en una marca que se puede ejecutar y valida lo que sale con br-guardian.', 'Antes del ciclo', 'diseno'],
  ['02', 'growth', 'Growth', '② Growth', 'El motor de crecimiento: la oferta, la captura de leads, los canales grandes y los upsells (no es la pauta).', 'Día 1 · Growth Partnership', ''],
  ['03', 'marketing', 'Marketing', '③ Marketing', 'Convierte la estrategia en el plan del ciclo: qué campaña, qué se dice, por qué canal y en qué semana.', 'Días 1 a 3', 'marketing'],
  ['04', 'creative', 'Creative', '④ Creatividad', 'Convierte el plan en ideas dirigidas y en el shot list, listos para que otro los ejecute sin adivinar.', 'Días 1 a 3', 'diseno'],
  ['05', 'production', 'Production', '⑤ Producción', 'Hace que exista el material: coordina equipo, jornadas y recursos para grabar antes del día 11.', 'Días 4 a 11', 'produccion'],
  ['06', 'graphic-design', 'Graphic Design', '⑥A Diseño gráfico', 'Los estáticos, carruseles y stories del ciclo con el sistema visual de la marca (el grueso del volumen).', 'Hasta el día 15', 'diseno'],
  ['07', 'video-editing', 'Video Editing', '⑦ Video Editing', 'Convierte lo grabado en los reels terminados y todas sus derivadas.', 'Hasta el día 15', 'produccion'],
  ['08', 'community', 'Community Management', '⑧ Community', 'Atiende comentarios y mensajes de las redes del cliente, según lo que incluya su ficha de oferta.', 'Hasta el día 19', ''],
  ['09', 'posting', 'Posting', '⑨ Posting', 'Deja lo aprobado listo para salir: caption final, ficha técnica, fecha y hora, programado en Zernio.', 'Días 16 a 19', ''],
  ['10', 'ads', 'Ads Management', '⑩ Ads', 'Que la pauta compre resultado, no alcance: presupuesto, ángulos y optimización, con el OK del CEO.', 'Hasta el día 19', ''],
];

// El nombre real de la carpeta en el repo, cuando no es «<NN>-<id>».
const CARPETA = { community: 'community-management', ads: 'ads-management' };
export const AGENTES = FILAS.map(([n, id, nombre, depto, hace, ventana, modo]) => ({ n, id, nombre, depto, hace, ventana, modo, carpeta: `agents/${n.length < 2 ? '0' + n : n}-${CARPETA[id] || id}/` }));
export const agenteDe = (id) => AGENTES.find((a) => a.id === id) || null;
// Los agentes que corren dentro de un modo del Chat (Creative: ②B, ④ y ⑥A; Production: ⑤ y ⑦).
export const agentesDeModo = (modo) => AGENTES.filter((a) => a.modo === modo);

