// Las áreas en simple (PLAN-GATEWAY §23): cada área tiene un propósito, un número y tres mesas de trabajo. Las herramientas siguen
// siendo las de herramientas.js; aquí solo se ordenan. Una herramienta vive en una sola mesa. Puro.
const M = (id, nombre, para, herramientas, enlaces = []) => ({ id, nombre, para, herramientas, enlaces });
export const MESAS = {
  strategy: { para: 'Entender qué pasos llevan a la meta.', numero: 'Distancia a la meta de ingresos', mesas: [
    M('mapa', 'Mapa de la Meta', 'Meta, palancas, cuello de botella y plan de 90 días.', ['commercial-diagnosis', 'business-xray', 'opportunity-map', 'growth-roadmap']),
    M('comprador', 'Comprador', 'ICP, dolores, deseos y entrevistas reales.', ['customer-bullseye', 'customer-avatar-studio']),
    M('oferta', 'Oferta y Dinero', 'Oferta, precios, bundles y money model.', ['offer-architect', 'pricing-packages']),
  ] },
  creative: { para: 'Diferenciar la marca y hacerla deseable.', numero: 'Piezas arriba del promedio de la marca', mesas: [
    M('marca', 'Marca', 'Identidad, reglas y consistencia.', ['brand-dna-studio', 'visual-identity-builder', 'brand-consistency-checker']),
    M('ideas', 'Ideas', 'Inspiración, comprador y marca convertidos en rutas.', ['moodboard-studio', 'creative-direction-lab']),
    M('piezas', 'Piezas', 'Diseño y lectura de lo que funcionó.', ['design-studio', 'creative-performance-analyzer']),
  ] },
  production: { para: 'Entregar alta calidad, a tiempo y con margen.', numero: 'Costo y entrega por pieza', mesas: [
    M('jornada', 'Jornada', 'Brief, guion, shot list y calendario.', ['production-brief', 'script-storyboard-studio', 'shot-list-builder', 'production-planner']),
    M('edicion', 'Edición', 'Avance, comentarios y aprobación.', ['post-production-workspace', 'review-approval-studio']),
    M('multiplicar', 'Multiplicar', 'Versiones por canal desde una misma pieza.', ['content-repurposing']),
  ] },
  marketing: { para: 'Conseguir demanda rentable.', numero: 'Ventas o leads calificados por quetzal invertido', mesas: [
    M('radar', 'Radar', 'Competidores, anuncios y contenido en alza.', ['competitor-radar', 'viral-intelligence-lab', 'ads-intelligence']),
    M('campana', 'Campaña', 'Meta, canales, copy, pauta y landing.', ['campaign-architect', 'content-strategy-studio', 'content-calendar', 'copywriting-studio', 'hook-laboratory', 'funnel-builder']),
    M('resultados', 'Resultados', 'Qué escalar y qué parar.', ['marketing-performance-center']),
  ] },
  consulting: { para: 'Que el crecimiento se cobre y se pueda sostener.', numero: 'Cierre, velocidad de respuesta y margen', mesas: [
    M('embudo', 'Embudo', 'Leads, seguimiento y cierre.', ['business-health-assessment'], [['CRM', '#/org/sales/crm']]),
    M('rentabilidad', 'Rentabilidad', 'Margen por oferta, canal y campaña.', ['financial-scenario-lab', 'root-cause-explorer', 'impact-tracker'], [['Finanzas', '#/org/finanzas/res']]),
    M('operacion', 'Operación', 'Roles, procesos y automatización.', ['process-mapper', 'organization-architect', 'automation-opportunity-finder', 'solution-blueprint-builder']),
  ] },
};
// Por construir: no entran hasta que muevan un número.
export const FUERA = ['growth-experiment-lab', 'ai-video-lab'];
export const mesasDe = (area) => MESAS[area] || null;
