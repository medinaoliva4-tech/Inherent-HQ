import { pricesOf } from './cycle.js';

// Restaura el catálogo después de que el editor de servicios mezcló datos entre tarjetas.
// Trabaja por id (los nombres quedaron repetidos). No toca precios fijos ni nada de lo que está bien.
const E = 'Estrategia', T = 'Dev / Tech', O = 'Operador';
const H = (h) => Object.entries(h).map(([role, hours]) => ({ role, hours, hours10: hours * 2 }));
// id → qué le corresponde. restore = recuperar sus horas originales aunque ya tenga otras; las que no tienen horas las reciben.
const SERVICIOS = {
  mv13anz199ee3e15: { cat: 'IA y automatización', restore: true, h: { [E]: 4, [T]: 18, [O]: 6 } },
  mv13ao3n96c3f0e1: { cat: 'IA y automatización', h: { [E]: 3, [T]: 12 } },
  mv13ao7q73d070b8: { cat: 'CRM y ventas', restore: true, h: { [E]: 3, [T]: 14, [O]: 4 }, name: 'CRM ligero + automatizaciones', description: 'Pipeline, recordatorios y reportes', days5: 3, days10: 7,
    includes5: "Página de 2–3 secciones para captar clientes potenciales.\nFormulario de contacto.\nListado de contactos y oportunidades.\nPipeline visual para seguimiento de prospectos.\nEstado del prospecto.\nOrigen del contacto.\nProbabilidad de cierre.\nFecha estimada de cierre (urgencia).\nPersonas que toman la decisión.\nValor potencial de venta.\nRegistro y actualización manual de contactos.\nCambio manual de estados y prioridades.\nSeguimiento de oportunidades comerciales.",
    includes10: "Landing page de 2–3 secciones, diseñada para captar y convertir prospectos.\nFormulario de captación conectado directamente al CRM.\nBase de datos centralizada de contactos y prospectos.\nRegistro automático de nuevos leads.\nHistorial de interacciones y seguimiento comercial.\nEstado comercial: nuevo, contactado, en negociación, ganado o perdido.\nOrigen del lead: redes sociales, publicidad, referidos, página web, etc.\nProbabilidad de cierre: alta, media o baja.\nFecha estimada de cierre: clasificación por urgencia.\nTomadores de decisión: identificación de las personas involucradas en aprobar la compra.\nPróxima acción: seguimiento pendiente y fecha programada.\nCaptura y registro automático de información.\nClasificación inteligente de prospectos.\nActualización automática de campos según las interacciones disponibles.\nRecordatorios de seguimiento y oportunidades prioritarias." },
  mv13aobkc03abfbf: { cat: 'Landing y conversión', restore: true, h: { Diseño: 10, [T]: 12 } },
  mv13aofd1c204505: { cat: 'Marketing y publicidad', h: { [E]: 10, [O]: 6 } },
  mv13aojc34ce65ac: { cat: 'Marketing y publicidad', h: { [E]: 4, Pauta: 10, Diseño: 6 } },
  mv13aon9c16e38f5: { cat: 'Producción de video', h: { Producción: 4, [O]: 2 } },
  mv13aor0a91dd839: { cat: 'Producción de video', h: { Edición: 12, [O]: 3 } },
  mv13aov8c55b8af7: { cat: 'Fotografía', h: { Fotografía: 3, Diseño: 4 } },
  mv64o4l7f5a1c862: { cat: 'CRM y ventas', h: { [E]: 5, [T]: 8, [O]: 3 } },
  mv64o4rk6511f128: { cat: 'CRM y ventas', h: { [E]: 2, [T]: 8, [O]: 2 } },
  mv64o4vt42b1d34b: { cat: 'Analítica y medición', h: { [E]: 1, [T]: 8, Pauta: 3 } },
  mv64o4zuc739f0fe: { cat: 'UGC y contenido mensual', h: { [E]: 2, Producción: 4, Edición: 8, [O]: 2 } },
  mv64o53r10307f83: { cat: 'UGC y contenido mensual', restore: true, h: { [E]: 4, Producción: 4, Edición: 10, Diseño: 4, [O]: 4 }, name: 'Sistema mensual de contenido corto', description: '',
    includes5: "Plan mensual de qué publicar en tus redes.\nIdeas de videos cortos y publicaciones cada mes.\nGuiones listos para grabar.\nCalendario con fechas de publicación.\nProducción de los contenidos del mes.",
    includes10: "Estrategia que explica por qué publicas lo que publicas.\nTemas fijos de contenido para que tu marca se reconozca.\nGrabación del contenido por parte de nuestro equipo.\nVideos cortos, carruseles (publicaciones con varias imágenes) e historias.\nAnuncios para dar más alcance a lo que mejor funciona.\nAnálisis mensual de qué gustó y qué no.\nAjustes cada mes para mejorar el mes siguiente." },
  mv64o57qbf2ca3d8: { cat: 'Landing y conversión', h: { [E]: 3, Diseño: 4, [T]: 5 } },
  mv64o5c54d131122: { cat: 'Email marketing', h: { [E]: 3, Diseño: 4, [T]: 4, [O]: 3 } },
  mv64o5mqce5ce0e7: { cat: 'SEO local', restore: true, h: { [E]: 3, [O]: 7 }, name: 'Google Business Profile + SEO local', description: '',
    includes5: "Creamos o arreglamos tu perfil de Google, el que aparece en Google Maps cuando te buscan.\nInformación correcta: dirección, horario, teléfono y página web.\nDescripción de tu negocio y lista de servicios o productos.\nFotos de tu negocio.\nLas categorías correctas para que te encuentren.\nGuía de cómo pedirle reseñas a tus clientes.",
    includes10: "Estudio de qué palabras usa la gente para buscar lo que tú vendes.\nPublicaciones periódicas en tu perfil.\nRespuesta a reseñas, buenas y malas.\nPáginas de tu sitio web pensadas para cada zona donde quieres vender.\nSeguimiento de en qué lugar apareces en Google cada mes.\nReporte de cuántas llamadas, visitas y mensajes llegaron desde Google." },
  mv64o5v0f10f6a3f: { cat: 'Analítica y medición', h: { [E]: 2, [T]: 8, [O]: 2 } },
  mv64o5z573c37ed6: { cat: 'IA y automatización', h: { [E]: 4, [T]: 3, [O]: 8 } },
};
const VIEJAS = ['IA', 'Tech', 'Marketing', 'Producción', 'Branding', 'Consultoría'];
const sinHoras = (s) => !(s.tasks || []).some((t) => +t.hours > 0);

// Devuelve { restaurados, sinCambio, faltan } y el catálogo resultante.
export async function repararCatalogo(S, services, rates = null) {
  const out = [...services], r = { restaurados: 0, sinCambio: 0, faltan: [] };
  for (const [id, d] of Object.entries(SERVICIOS)) {
    const sv = out.find((x) => x.id === id);
    if (!sv) { r.faltan.push(d.name || id); continue; }
    const doc = { ...sv };
    if (VIEJAS.includes(sv.category) || !sv.category) doc.category = d.cat;
    for (const k of ['name', 'description', 'includes5', 'includes10', 'days5', 'days10']) if (d.restore && d[k] !== undefined) doc[k] = d[k];
    if (d.restore || sinHoras(sv)) { doc.tasks = H(d.h); doc.level = sv.level || 5; doc.price_fixed = null; }
    if (doc.tasks !== sv.tasks && rates) { const prices = pricesOf(doc, rates); if (prices) { doc.prices = prices; doc.price = prices[doc.level]; } }
    if (JSON.stringify(doc) === JSON.stringify(sv)) { r.sinCambio++; continue; }
    const saved = await S.save(doc); out[out.indexOf(sv)] = saved; r.restaurados++;
  }
  return { ...r, services: out };
}
