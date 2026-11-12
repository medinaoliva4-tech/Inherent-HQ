// Las ocho vistas del diseño de Code OS, ubicadas en las herramientas que ya viven en el OS.
// Una vista puede reunir varias herramientas; nunca crea una segunda copia de sus datos.
// pendiente = todavía no hay una herramienta equivalente en el OS.
export const MAPA_TRABAJO = [
  { id: 'icp', area: 'strategy', nombre: 'Perfil del cliente ideal', herramientas: ['customer-bullseye'], nota: 'La diana existe; faltan los criterios económicos del ICP.' },
  { id: 'adquisicion', area: 'strategy', nombre: 'Adquisición de clientes', herramientas: [], pendiente: true, nota: 'Calculadora inbound y outbound por conectar al perfil.' },
  { id: 'dolores', area: 'strategy', nombre: 'Dolores, deseos e historia', herramientas: [], pendiente: true, nota: 'Datos del comprador por conectar al ICP y a la comunicación.' },
  { id: 'radar', area: 'marketing', nombre: 'Radar con sentido', herramientas: ['viral-intelligence-lab'], nota: 'Referentes, atención del ICP y patrones de contenido.' },
  { id: 'pilares', area: 'marketing', nombre: 'Pilares y ángulos', herramientas: ['content-strategy-studio'], nota: 'La comunicación estratégica alimenta ideas y piezas de Creative.' },
  { id: 'campanas', area: 'marketing', nombre: 'Campañas', herramientas: ['campaign-architect'], nota: 'Copy, ideas, piezas y resultado esperado en el mismo recorrido.' },
  { id: 'pre', area: 'production', nombre: 'Preproducción', herramientas: ['production-brief', 'script-storyboard-studio', 'shot-list-builder', 'production-planner'], nota: 'Brief, guion, tomas y jornada son pasos del mismo trabajo.' },
  { id: 'video', area: 'production', nombre: 'Posproducción', herramientas: ['post-production-workspace'], nota: 'Video por instrucciones, referencias y desglose; el montaje se decide en el área.' },
];

export const vistasDeArea = (area) => MAPA_TRABAJO.filter((v) => v.area === area);
