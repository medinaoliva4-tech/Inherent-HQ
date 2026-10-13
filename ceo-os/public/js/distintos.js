// Temporal (aprobado por el CEO): «Lo que nos hace distintos» de cada servicio del catálogo.
// Solo llena los servicios que todavía no lo tienen; lo que ya esté escrito no se toca.
export const DISTINTOS = {
  'Agente de WhatsApp con IA': 'Entrenado con tus precios y respuestas reales, no con respuestas genéricas.',
  'IA entrenada con la marca': 'Aprende cómo hablas tú, no como habla cualquier chatbot.',
  'CRM ligero + automatizaciones': 'Hecho a la medida de cómo vendes, no una plantilla que tienes que adaptar.',
  'Landing de conversión': 'Escrita para vender una sola oferta, con su medición puesta desde el día uno.',
  'Estrategia de lanzamiento': 'Se decide con números: qué vender, a quién y cuánto invertir antes de gastar.',
  'Pauta Meta · setup + 1 mes': 'Cada quetzal se mide contra ventas, no contra likes.',
  'Jornada de rodaje (4 h)': 'Llegamos con guion y tomas planeadas: 4 horas rinden para todo el mes.',
  'Paquete de 8 reels editados': 'Cada reel nace de una idea con estrategia, no de tendencias al azar.',
  'Sesión de fotos de producto': 'Fotos pensadas para vender en catálogo, web y anuncios.',
  'Embudo de ventas por WhatsApp': 'Cada mensaje lleva a la persona un paso más cerca de comprar.',
  'Seguimiento automático de leads': 'Ningún interesado se queda sin respuesta, aunque tu equipo esté ocupado.',
  'Conversion API y tracking avanzado': 'Sabes qué anuncio trajo cada venta, no solo cuántos clics hubo.',
  'UGC y videos tipo testimonio': 'Clientes reales hablando de ti: la prueba que más convence.',
  'Sistema mensual de contenido corto': 'Un sistema que publica cada semana, no piezas sueltas.',
  'Optimización de landing y pruebas A/B': 'Cambios que se prueban con datos antes de quedarse.',
  'Email marketing y automatizaciones': 'Correos que salen solos en el momento justo de cada cliente.',
  'Google Business Profile + SEO local': 'Que te encuentren primero cuando te buscan cerca.',
  'Dashboard mensual de marketing': 'Tus números en una sola vista, explicados en lenguaje simple.',
  'Biblioteca de conocimiento para IA': 'Todo lo que sabe tu negocio, ordenado para que la IA lo use bien.',
  'Presencia digital': 'Una presencia constante que hace que tu marca se vea seria y activa.',
  'Diagnóstico y estrategia comercial': 'Encontramos dónde se pierden tus ventas antes de proponer nada.',
  'Oferta, precios y paquetes': 'Precios con base en tus costos reales, no en lo que cobra la competencia.',
  'WhatsApp para negocios + Catálogo': 'Tu número personal queda aparte; el negocio tiene el suyo, ordenado.',
  'Automatización de procesos': 'Le quitamos a tu equipo las tareas repetidas para que venda más.',
  'Prospección B2B y cuentas clave': 'Lista y mensajes hechos para tu cliente ideal, no envíos masivos.',
  'Campañas de marketing': 'Una sola meta por campaña, medida de inicio a fin.',
  'Retención y recompra': 'Vender otra vez a quien ya te compró: la venta más barata que hay.',
  'Expansión a nueva sucursal o mercado': 'Calculamos si conviene antes de que inviertas.',
  'Estructura financiera': 'Armada por nuestro equipo de finanzas, no con una plantilla de internet.',
  'Estructura empresarial: quién hace qué y cómo': 'Tu empresa funciona aunque tú no estés.',
};
const key = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const BYKEY = Object.fromEntries(Object.entries(DISTINTOS).map(([n, t]) => [key(n), t]));
export const faltan = (services) => services.filter((s) => !String(s.edge || '').trim() && BYKEY[key(s.name)]);
export async function cargar(S, services) {
  let n = 0; const out = [...services];
  for (const s of faltan(services)) { const r = await S.save({ ...s, edge: BYKEY[key(s.name)] }); out[out.findIndex((x) => x.id === r.id)] = r; n++; }
  return { n, services: out };
}
