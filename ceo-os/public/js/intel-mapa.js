// Intel · el mapa de entregables: departamento → entregable → ruta en la carpeta del cliente → ¿lo ve el cliente?
// Sale de los brain/WORKFLOW.md de cada agente (y del CONTEXTO.md de cada folder de clients/_plantilla). No inventa nada:
// si un workflow no dice dónde vive un archivo, ese archivo no está aquí (ver «FUERA» abajo).
// Lo comparten el servidor (api/_lib/intel.js, scripts/snapshot.mjs) y la interfaz (intel-ui.js).
//
// Cómo se lee una ruta (relativa a la carpeta del cliente):
//   {mes}  → una carpeta o archivo AAAA-MM        ·  *  → una palabra (ideas-*.md → ideas-reel.md)
//   Si `ruta` es una lista, vale cualquiera de las rutas (la primera que exista).
// `cliente: true` = el workflow dice que es para el cliente. Es solo un dato: Intel es estrategia y ya no se abre para el cliente
// (la API le responde 403). Todo Intel lo ve únicamente el equipo.
// `costos: true` = lleva montos: solo lo ve quien ya ve costos (CEO, COO y quien edita Clientes), nunca el cliente.

export const DEPTS = [
  ['00', '⓪ Account'],
  ['01', '① Strategy'],
  ['01.2', '②B Branding'],
  ['02', '② Growth'],
  ['03', '③ Marketing'],
  ['04', '④ Creatividad'],
  ['05', '⑤ Producción'],
  ['06', '⑥A Diseño gráfico'],
  ['07', '⑦ Video Editing'],
  ['08', '⑧ Community'],
  ['09', '⑨ Posting'],
  ['10', '⑩ Ads'],
];

const E = (id, dept, ruta, titulo, sirve, cliente = false, extra = {}) => ({ id, dept, ruta, titulo, sirve, cliente, fmt: /\.csv$/.test([].concat(ruta)[0]) ? 'csv' : 'md', ...extra });

export const ENTREGABLES = [
  // ⓪ Account — lo que escribe la secretaria (agents/00-account/brain/WORKFLOW.md §5)
  E('reuniones', '00', '01-estrategia/reuniones/{mes}.md', 'Reuniones', 'Lo acordado en la reunión y lo que quedó por escrito'),

  // ① Strategy — agents/01-strategy/brain/WORKFLOW.md §7
  E('comprension', '01', '00-onboarding/comprension.md', 'Comprensión', 'El negocio, su cliente y su competencia'),
  E('estrategia', '01', '01-estrategia/estrategia.md', 'Estrategia', 'De dónde partimos, a dónde vamos y qué no haremos', true),
  E('nucleo', '01', '01-estrategia/nucleo.md', 'Núcleo', 'En qué ganar: el WIN, las tres verdades y el arquetipo'),
  E('posicionamiento', '01', '01-estrategia/posicionamiento.md', 'Posicionamiento', 'Objetivos, plataforma de marca y renuncias'),
  E('brief-comunicacion', '01', '01-estrategia/brief-de-comunicacion-{mes}.md', 'Brief de comunicación', 'Qué decimos este ciclo, a quién y cómo'),
  E('ingenieria-inversa', '01', '99-referencias/investigacion/ingenieria-inversa.md', 'Ingeniería inversa', 'Qué funciona allá afuera, con evidencia'),
  E('revision-20', '01', '01-estrategia/revisiones-del-20/{mes}.md', 'Revisión del 20', 'Qué funcionó y qué no en el ciclo'),
  E('reporte', '01', '01-estrategia/reportes/{mes}.md', 'Reporte del mes', 'Cómo va el mes, en claro', true),

  // ②B Branding — agents/01.2-branding/brain/WORKFLOW.md §2
  E('guia-de-marca', '01.2', '02-marca/guia-de-marca.md', 'Guía de marca', 'Territorio, voz, activos y cómo se ve en cada formato', true),
  E('sistema-visual', '01.2', '02-marca/sistema-visual.md', 'Sistema visual', 'Colores, tipografías y reglas para ejecutar'),
  E('kit', '01.2', '02-marca/kit-de-redes/kit.md', 'Kit de redes', 'El Figma de la marca y sus exportes en Drive'),
  E('aprendizaje-branding', '01.2', '02-marca/aprendizaje-de-branding.md', 'Aprendizaje de marca', 'Qué se reconoció y qué cambia'),

  // ② Growth — agents/02-growth/brain/WORKFLOW.md §0 y §4
  E('ofertas-a-empujar', '02', '07-oferta-y-ventas/ofertas-a-empujar.md', 'Ofertas a empujar', 'Qué ofertas se empujan este ciclo y con qué objetivo'),
  // Growth Partnership: el workflow de ② Growth (§4) llama `motor-de-crecimiento.md` al documento que junta § La oferta, § La escalera, § Captura,
  // § Canales grandes y § Los números, pero no dice en qué carpeta vive; el CONTEXTO de 07-oferta-y-ventas dice que ahí escribe ② Growth (y lista `numeros.md`).
  E('motor-de-crecimiento', '02', '07-oferta-y-ventas/motor-de-crecimiento.md', 'Motor de crecimiento', 'La oferta, la escalera de upsells, la captura y los canales grandes (Growth Partnership)'),
  E('numeros', '02', '07-oferta-y-ventas/numeros.md', 'Los números', 'Los unit economics del cliente (Growth Partnership)', false, { costos: true }),

  // ③ Marketing — agents/03-marketing/brain/WORKFLOW.md §2
  E('estrategia-contenido', '03', '03-marketing/{mes}/estrategia-de-contenido.md', 'Estrategia de contenido', 'La idea de campaña, los pilares y el mensaje'),
  E('plan-por-canal', '03', '03-marketing/{mes}/plan-por-canal.md', 'Plan por canal', 'Para qué sirve cada canal y qué no se hace ahí'),
  E('calendario', '03', '03-marketing/{mes}/calendario.csv', 'Calendario de slots', 'Qué sale, en qué canal y en qué semana'),

  // ④ Creatividad — agents/04-creative/brain/WORKFLOW.md §1 y «La carpeta del cliente»
  E('brief-ciclo', '04', '04-contenido/{mes}/ideas/brief-del-ciclo.md', 'Brief del ciclo', 'La dirección creativa y las grandes ideas del mes', true),
  E('plan-contenido', '04', '04-contenido/{mes}/ideas/plan-de-contenido.csv', 'Plan de contenido', 'Una fila por pieza del ciclo', true),
  E('ideas', '04', '04-contenido/{mes}/ideas/ideas-*.md', 'Ideas', 'El guion, el copy y la dirección de cada pieza', true),
  E('swipe-file', '04', '99-referencias/investigacion/swipe-file.md', 'Swipe file', 'La bóveda de referencias'),
  E('aprendizaje-creativo', '04', '04-contenido/aprendizaje-creativo.md', 'Aprendizaje creativo', 'Qué patrón ganó y qué se refresca'),

  // ⑤ Producción — agents/05-production/brain/WORKFLOW.md §7 (el presupuesto lleva montos: nunca al cliente)
  E('presupuesto', '05', '04-contenido/{mes}/produccion/presupuesto.md', 'Presupuesto de producción', 'Qué se produce, cuándo y cuánto cuesta', false, { costos: true }),
  E('plan-rodaje', '05', '04-contenido/{mes}/produccion/plan-de-rodaje.md', 'Plan de rodaje', 'Jornadas, orden de tiro y entrega'),
  E('material', '05', '04-contenido/{mes}/produccion/MATERIAL.md', 'Material grabado', 'Los links al Drive: crudo y final de cada sesión'),
  E('aprendizaje-produccion', '05', '04-contenido/{mes}/produccion/aprendizaje-de-produccion.md', 'Aprendizaje de producción', 'Qué se grabó, qué falló y qué se ajusta'),

  // ⑥A Diseño gráfico — agents/06-graphic-design/brain/WORKFLOW.md §2
  E('entregas-diseno', '06', '04-contenido/{mes}/diseno/entregas-diseno.md', 'Entregas de diseño', 'Cada pieza con su link al Drive y su estado'),
  E('aprendizaje-diseno', '06', '04-contenido/aprendizaje-de-diseno.md', 'Aprendizaje de diseño', 'Qué plantilla rindió y qué falta'),

  // ⑦ Video Editing — agents/07-video-editing/brain/WORKFLOW.md §2
  E('entregas-video', '07', '04-contenido/{mes}/video/entregas-video.md', 'Entregas de video', 'Cada reel y derivado con su link y su estado'),
  E('aprendizaje-video', '07', '04-contenido/aprendizaje-de-video.md', 'Aprendizaje de video', 'Qué se devolvió y cuánto rindió cada grabación'),

  // ⑧ Community — agents/08-community-management/brain/WORKFLOW.md §7
  E('respuestas', '08', '05-comunidad/respuestas.md', 'Ficha de respuestas', 'Lo único que Community puede contestar'),
  E('seguimiento', '08', '05-comunidad/seguimiento/{mes}.md', 'Seguimiento', 'Quién preguntó y qué'),

  // ⑨ Posting — agents/09-posting/brain/WORKFLOW.md
  E('publicaciones', '09', '04-contenido/{mes}/publicacion/publicaciones.md', 'Publicaciones', 'Cada publicación con su caption, fecha y QA'),
  E('calendario-publicacion', '09', '04-contenido/{mes}/publicacion/calendario-de-publicacion.csv', 'Calendario de publicación', 'El registro de lo programado'),
  E('aprendizaje-posting', '09', '04-contenido/{mes}/publicacion/aprendizaje-de-posting.md', 'Aprendizaje de posting', 'Qué salió a tiempo y qué se atoró'),

  // ⑩ Ads — agents/10-ads-management/brain/WORKFLOW.md §4. El plan y el reporte no dicen carpeta: el CONTEXTO de 06-pauta
  // los pone por mes y el OS (repo/client/:slug/pauta) los lee en la raíz; vale cualquiera de las dos.
  E('plan-pauta', '10', ['06-pauta/{mes}/plan-de-pauta.md', '06-pauta/plan-de-pauta.md'], 'Plan de pauta', 'Objetivo, estructura, públicos y creativos'),
  E('reporte-pauta', '10', ['06-pauta/{mes}/reporte-de-pauta.md', '06-pauta/reporte-de-pauta.md'], 'Reporte de pauta', 'Qué corrió, qué rindió y qué se cambió'),
  E('aprendizaje-pauta', '10', '06-pauta/aprendizaje-de-pauta.md', 'Aprendizaje de pauta', 'Qué ángulo ganó y qué se le devuelve a Creatividad'),
];

// Lo que NO está en el mapa porque su workflow no dice dónde se guarda (o es trabajo de línea, no un documento):
//   aprendizaje-de-growth.md (② Growth) · aprendizaje-de-marketing.md y plan-de-busqueda.md (③ Marketing)
//   voz.md (el CONTEXTO de 02-marca lo lista, pero el workflow de Branding la pone dentro de guia-de-marca.md)
//   plan-de-produccion.csv · plan-de-fotos.csv · presupuesto.csv (⑤ Producción: trabajo interno de línea; el último lleva costos)
//   00-onboarding/plan-contratado.md y 10-finanzas/ (llevan precios y costos: no son Intel)
export const FUERA = ['aprendizaje-de-growth', 'aprendizaje-de-marketing', 'plan-de-busqueda', 'voz', 'plan-de-produccion', 'plan-de-fotos', 'presupuesto.csv', 'plan-contratado', '10-finanzas'];

// ---------- El avatar: de qué entregable sale cada celda ----------
// [id del entregable, cómo se llama la etiqueta en el documento]. La primera fuente que tenga dato gana.
// Una etiqueta se busca como fila de tabla, como «**Etiqueta:** texto» o como título de sección.
// `audiencias`: la tabla «Las audiencias» de posicionamiento.md (una fila por audiencia).
export const AVATAR = {
  arquetipo: [['nucleo', /c[oó]mo se le llama/i], ['comprension', /^arquetipo/i]],
  campos: [
    { k: 'quien', label: 'Quién es', fuentes: [['nucleo', /qui[eé]n compra/i], ['brief-comunicacion', /a qui[eé]n/i], ['comprension', /^(su cliente|audiencia actual|su audiencia)/i], ['posicionamiento', /audiencia profunda/i], ['posicionamiento', 'audiencias:nombre']] },
    { k: 'duele', label: 'Qué le duele', fuentes: [['brief-comunicacion', /dolor|le duele/i], ['posicionamiento', /tensi[oó]n cultural/i]] },
    { k: 'quiere', label: 'Qué quiere', fuentes: [['brief-comunicacion', /qu[eé] quiere|lo que quiere/i], ['posicionamiento', 'audiencias:sueno']] },
    { k: 'donde', label: 'Dónde está', fuentes: [['comprension', /c[oó]mo se descubre|audience behavior|comportamiento de la audiencia/i]] },
    { k: 'compra', label: 'Qué lo hace comprar', fuentes: [['nucleo', /d[oó]nde vive la confianza/i], ['comprension', /c[oó]mo se compra/i]] },
  ],
};

// ---------- Rutas ----------
const esc = (s) => s.replace(/[.+?^$()|[\]\\]/g, '\\$&');
const rx = (tpl) => new RegExp('^' + esc(tpl).replace(/\{mes\}/g, '(\\d{4}-(?:0[1-9]|1[0-2]))').replace(/\*/g, '([a-z0-9-]{1,40})') + '$');
const plantillas = (e) => [].concat(e.ruta);
// Si `rel` es de este entregable: { mes, variante, ruta } o null.
export function coincide(e, rel) {
  for (const tpl of plantillas(e)) {
    const m = rx(tpl).exec(rel); if (!m) continue;
    const parts = [...tpl.matchAll(/\{mes\}|\*/g)].map((x) => x[0]); let mes = null, variante = null;
    parts.forEach((p, i) => { if (p === '{mes}') mes = m[i + 1]; else variante = m[i + 1]; });
    return { mes, variante };
  }
  return null;
}
export const entregableDe = (rel) => { for (const e of ENTREGABLES) { const c = coincide(e, rel); if (c) return { e, ...c }; } return null; };
export const esIntel = (rel) => Boolean(entregableDe(rel));
// Las carpetas de primer nivel de un cliente que Intel lee.
export const CARPETAS = [...new Set(ENTREGABLES.flatMap(plantillas).map((t) => t.split('/')[0]))];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const mesLabel = (m) => { const x = /^(\d{4})-(\d{2})$/.exec(m || ''); return x ? `${MESES[+x[2] - 1]} ${x[1]}` : ''; };
const VARIANTES = { reel: 'Reels', reels: 'Reels', carrusel: 'Carruseles', story: 'Stories', stories: 'Stories', tiktok: 'TikTok', newsletter: 'Newsletter', estatico: 'Estáticos', estaticos: 'Estáticos', youtube: 'YouTube', linkedin: 'LinkedIn', email: 'Email', anuncio: 'Anuncios', anuncios: 'Anuncios' };
export const varianteLabel = (v) => VARIANTES[v] || (v ? v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, ' ') : '');
