// Descripciones del catálogo por nivel de entrega: 5/10 = Básico, 10/10 = Avanzado.
// Alimentan «Incluye en sencillo (5)» (b) y «Se suma al subir a fuerte (10)» (a) de cada servicio.
// `cat` solo se usa si el servicio todavía no existe en el catálogo.
export const DESCRIPCIONES = [
  { name: 'Agente de WhatsApp con IA', cat: 'IA',
    b: 'Agente que responde preguntas frecuentes, comparte información, captura datos y deriva los casos importantes a una persona.',
    a: 'Agente entrenado para recomendar productos, calificar clientes, cotizar, agendar citas, hacer seguimiento y escalar conversaciones complejas al equipo.' },
  { name: 'IA entrenada con la marca', cat: 'IA',
    b: 'Asistente interno con la información principal de la empresa, productos, servicios, precios y preguntas frecuentes.',
    a: 'Asistente personalizado con tono de marca, procesos internos, documentos, objeciones de venta, guías para el equipo y respuestas especializadas por área.' },
  { name: 'CRM ligero + automatizaciones', cat: 'Tech',
    b: 'CRM organizado con contactos, etapas de venta, responsables, recordatorios y seguimiento manual de oportunidades.',
    a: 'CRM automatizado con captura de leads, asignación de vendedores, seguimiento por WhatsApp o correo, alertas, reportes y automatizaciones según el comportamiento del cliente.' },
  { name: 'Landing de conversión', cat: 'Tech',
    b: 'Página enfocada en presentar una oferta, explicar sus beneficios y recibir contactos mediante formulario o WhatsApp.',
    a: 'Landing estratégica con copy de conversión, estructura de objeciones, prueba social, múltiples llamadas a la acción, analítica, eventos, remarketing y pruebas A/B.' },
  { name: 'Estrategia de lanzamiento', cat: 'Marketing',
    b: 'Definición de oferta, mensaje principal, calendario de contenido y plan de promoción para 30 días.',
    a: 'Sistema completo de lanzamiento con investigación, posicionamiento, campaña de expectativa, contenido, anuncios, embudo, seguimiento de leads, métricas y optimización semanal.' },
  { name: 'Pauta Meta · setup + 1 mes', cat: 'Marketing',
    b: 'Configuración de campañas, públicos, anuncios, presupuesto y seguimiento básico de resultados durante un mes.',
    a: 'Estructura completa de campañas con pruebas de creativos, remarketing, audiencias personalizadas, optimización semanal, conexión con WhatsApp o CRM y reporte de decisiones.' },
  { name: 'Jornada de rodaje (4 h)', cat: 'Producción',
    b: 'Grabación organizada de contenido para redes sociales a partir de un guion simple y una lista de tomas.',
    a: 'Producción dirigida con concepto creativo, guiones, variedad de formatos, tomas para anuncios, contenido orgánico, testimonios y material reutilizable para varias semanas.' },
  { name: 'Paquete de 8 reels editados', cat: 'Producción',
    b: 'Edición de 8 videos verticales con cortes, subtítulos, música, formato para redes y llamados a la acción básicos.',
    a: '8 reels con edición dinámica, hooks, storytelling, subtítulos diseñados, efectos, adaptación para anuncios, diferentes versiones y optimización para retención.' },
  { name: 'Sesión de fotos de producto', cat: 'Producción',
    b: 'Sesión fotográfica de hasta 30 productos o composiciones, con edición de color, encuadre y limpieza visual.',
    a: 'Producción visual completa con dirección de arte, fotografías de producto, lifestyle, detalles, composiciones para ecommerce, anuncios, redes y catálogo.' },
  { name: 'Embudo de ventas por WhatsApp', cat: 'Marketing',
    b: 'Diseño del recorrido desde el anuncio o formulario hasta WhatsApp, con mensajes iniciales y clasificación básica del cliente.',
    a: 'Embudo completo con anuncios, respuestas automáticas, calificación, cotización, seguimiento, recuperación de interesados y conexión con CRM.' },
  { name: 'Seguimiento automático de leads', cat: 'Tech',
    b: 'Configuración de recordatorios y mensajes para contactar nuevamente a personas que solicitaron información.',
    a: 'Secuencias automáticas por WhatsApp, correo o SMS según el comportamiento del cliente, con diferentes rutas para interesados, indecisos y compradores.' },
  { name: 'Conversion API y tracking avanzado', cat: 'Tech',
    b: 'Configuración de eventos principales para medir formularios, mensajes, llamadas y conversiones.',
    a: 'Implementación completa de Pixel, Conversion API, eventos personalizados, UTMs, seguimiento de ventas y conexión con CRM o ecommerce.' },
  { name: 'UGC y videos tipo testimonio', cat: 'Producción',
    b: 'Creación de videos naturales con testimonios, demostraciones o experiencias de clientes.',
    a: 'Sistema de contenido UGC con selección de creadores, guiones, diferentes hooks, versiones para anuncios y derechos de uso.' },
  { name: 'Sistema mensual de contenido corto', cat: 'Marketing',
    b: 'Plan mensual con ideas, guiones, calendario y producción de contenido para redes sociales.',
    a: 'Sistema completo con estrategia, pilares de contenido, grabación, reels, carruseles, historias, anuncios, análisis y optimización mensual.' },
  { name: 'Optimización de landing y pruebas A/B', cat: 'Tech',
    b: 'Revisión de textos, estructura, botones, formulario y experiencia general de la landing.',
    a: 'Creación de variantes, pruebas A/B, análisis de comportamiento, mapas de calor y optimización continua para aumentar conversiones.' },
  { name: 'Email marketing y automatizaciones', cat: 'Marketing',
    b: 'Configuración de correos de bienvenida, promociones y seguimiento de clientes.',
    a: 'Sistema completo de email marketing con segmentación, automatizaciones, recuperación de clientes, campañas, pruebas y reportes.' },
  { name: 'Google Business Profile + SEO local', cat: 'Marketing',
    b: 'Configuración y optimización del perfil de Google Business con información, servicios, fotos y categorías correctas.',
    a: 'Estrategia de SEO local con palabras clave, publicaciones, reseñas, páginas locales, seguimiento de posiciones y generación de oportunidades.' },
  { name: 'Dashboard mensual de marketing', cat: 'Tech',
    b: 'Reporte mensual con inversión, alcance, leads, mensajes, ventas y resultados principales.',
    a: 'Dashboard automatizado conectado a anuncios, CRM, WhatsApp o ecommerce, con análisis de rentabilidad y recomendaciones de acción.' },
  { name: 'Biblioteca de conocimiento para IA', cat: 'IA',
    b: 'Organización de información básica de la empresa, servicios, precios, preguntas frecuentes y políticas.',
    a: 'Sistema completo de conocimiento con documentos, procesos, tono de marca, objeciones, respuestas comerciales y actualización continua para que la IA responda con precisión.' },
];

// Compara nombres sin acentos, mayúsculas ni signos: «Pauta Meta — setup + 1 mes» = «Pauta Meta · setup + 1 mes».
const key = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// Carga las descripciones al catálogo. No toca precios, horas ni descripciones cortas, y no pisa un
// «incluye» que ya esté escrito. Devuelve { creados, actualizados, omitidos } y el catálogo resultante.
export async function cargarDescripciones(S, services) {
  const out = [...services], r = { creados: 0, actualizados: 0, omitidos: [] };
  for (const d of DESCRIPCIONES) {
    const sv = out.find((x) => key(x.name) === key(d.name));
    if (!sv) {
      out.push(await S.create({ category: d.cat, name: d.name, description: '', unit: 'proyecto', markup: 2.2, price: null, tasks: [], includes5: d.b, includes10: d.a }));
      r.creados++; continue;
    }
    const doc = { ...sv };
    if (!String(sv.includes5 || '').trim()) doc.includes5 = d.b; else r.omitidos.push(`${sv.name} (nivel 5)`);
    if (!String(sv.includes10 || '').trim()) doc.includes10 = d.a; else r.omitidos.push(`${sv.name} (nivel 10)`);
    if (doc.includes5 === sv.includes5 && doc.includes10 === sv.includes10) continue;
    const saved = await S.save(doc);
    out[out.indexOf(sv)] = saved; r.actualizados++;
  }
  return { ...r, services: out };
}
