import { pricesOf } from './cycle.js';

// Servicios que usan los paquetes y todavía no estaban en el catálogo (aprobados por el CEO).
// Se cargan una vez con el botón temporal de Sales → Catálogo; los que ya existen (mismo nombre) no se tocan.
// h: horas por rol { rol: [nivel 5, nivel 10] }. b: lo que incluye en sencillo · a: lo que se suma en fuerte.
export const NUEVOS = [
  { name: 'Diagnóstico y estrategia comercial', cat: 'CRM y ventas', days: [3, 7], h: { Estrategia: [4, 10], Operador: [2, 4] },
    b: ['Revisamos cómo vendes hoy: de dónde llegan tus clientes y por qué te compran.', 'Miramos tus números básicos: ventas, ticket promedio y clientes por mes.', 'Detectamos dónde se pierden las ventas.', 'Elegimos la meta de crecimiento y cómo medirla.', 'Plan de acción con los 3 pasos que más mueven la venta.'],
    a: ['Entrevistas con clientes para entender qué valoran.', 'Análisis de tu competencia y de tu lugar en el mercado.', 'Recorrido completo del cliente, desde que te conoce hasta que vuelve a comprar.', 'Plan de 90 días con responsables y fechas.', 'Revisión a los 30 días para ajustar el plan.'],
    on: ['Ventas de los últimos meses', 'Lista de productos o servicios con precios', 'Quién decide de tu lado'] },
  { name: 'Oferta, precios y paquetes', cat: 'CRM y ventas', days: [3, 6], h: { Estrategia: [4, 9], Operador: [1, 3] },
    b: ['Revisamos lo que vendes y a qué precio.', 'Definimos tu oferta principal: qué incluye y para quién es.', 'Precio recomendado según tus costos y tu mercado.', 'Mensaje corto para explicar la oferta.'],
    a: ['Paquetes por nivel (básico, medio, completo) para que el cliente elija.', 'Ofertas adicionales para subir el ticket.', 'Garantías y condiciones que dan confianza.', 'Prueba de la oferta con clientes reales y ajuste.', 'Guía de cómo presentarla en una venta.'],
    on: ['Lista de productos con precios y costos', 'Lo que más te compran hoy'] },
  { name: 'WhatsApp para negocios + Catálogo', cat: 'CRM y ventas', days: [2, 4], h: { Estrategia: [1, 1], Operador: [2, 5], Diseño: [0, 2] },
    b: ['Cuenta de WhatsApp Business separada de tu WhatsApp personal: no tocas tu número ni tus chats.', 'Un número de teléfono distinto para el negocio.', 'Perfil completo: nombre, logo, descripción, horario, dirección y enlaces.', 'Catálogo con tus productos o servicios y sus precios, para que te conozcan.', 'Mensaje de bienvenida y mensaje fuera de horario.', 'Etiquetas para ordenar a tus clientes.'],
    a: ['Catálogo grande con fotos y descripciones cuidadas, ordenado por colecciones.', 'Respuestas rápidas para lo que más te preguntan.', 'Enlace y código QR para que te escriban directo.', 'Botón de WhatsApp en tu web y redes.', 'Capacitación a tu equipo.'],
    on: ['Un número de teléfono nuevo para el negocio', 'Tu logo', 'Productos con fotos y precios'] },
  { name: 'Automatización de procesos', cat: 'IA y automatización', days: [5, 12], h: { Estrategia: [2, 3], 'Dev / Tech': [6, 16], Operador: [2, 5] },
    b: ['Elegimos la tarea repetitiva que más tiempo te quita.', 'La automatizamos de punta a punta.', 'Conectamos las herramientas que ya usas: formularios, hojas, correo o WhatsApp.', 'Avisos cuando algo falla.', 'Guía corta de cómo funciona.'],
    a: ['Hasta 3 procesos automatizados.', 'Tablero para ver qué se hizo solo y cuánto tiempo ahorra.', 'Reportes automáticos para tu equipo.', 'Capacitación al equipo.', 'Ajustes durante el primer mes.'],
    on: ['Accesos a las herramientas que usas', 'Quién hace hoy la tarea'] },
  { name: 'Prospección B2B y cuentas clave', cat: 'CRM y ventas', days: [5, 15], h: { Estrategia: [3, 6], Operador: [5, 14] },
    b: ['Definimos tu cliente ideal: tipo de empresa, tamaño y quién decide.', 'Lista de empresas a contactar.', 'Mensajes de primer contacto por correo y LinkedIn.', 'Seguimiento de quién respondió y en qué va cada uno.'],
    a: ['Campaña de contacto con varios mensajes de seguimiento.', 'Plan para tus cuentas más importantes: qué ofrecerles y cuándo.', 'Presentación de ventas para reuniones.', 'Reporte semanal de reuniones conseguidas.', 'Conexión con tu CRM.'],
    on: ['Tus mejores clientes actuales', 'Qué ofreces y a qué precio', 'Acceso a tu LinkedIn y tu correo'] },
  { name: 'Campañas de marketing', cat: 'Marketing y publicidad', days: [5, 10], h: { Estrategia: [3, 6], Diseño: [4, 10], Operador: [3, 8] },
    b: ['Una campaña con un objetivo claro: ventas, visitas o mensajes.', 'Mensaje principal y oferta de la campaña.', 'Piezas para redes: publicaciones e historias.', 'Calendario de publicación.', 'Resultados al cierre.'],
    a: ['Campaña en varios canales: redes, correo y WhatsApp.', 'Anuncios pagados con varias versiones para probar.', 'Página o formulario para captar interesados.', 'Seguimiento a los interesados.', 'Reporte con lo que funcionó y qué repetir.'],
    on: ['Qué quieres vender y para cuándo', 'Logo y fotos', 'Presupuesto de anuncios, si aplica'] },
  { name: 'Retención y recompra', cat: 'CRM y ventas', days: [5, 10], h: { Estrategia: [2, 4], 'Dev / Tech': [3, 8], Operador: [3, 6] },
    b: ['Lista de tus clientes ordenada por su última compra.', 'Mensajes para que vuelvan a comprar.', 'Recordatorio después de cada compra.', 'Pedido de reseñas a clientes contentos.'],
    a: ['Programa de puntos o beneficios para clientes frecuentes.', 'Mensajes automáticos según lo que compró cada cliente.', 'Campañas para recuperar a quien dejó de comprar.', 'Ofertas para cumpleaños y fechas especiales.', 'Reporte mensual de recompra.'],
    on: ['Lista de clientes con sus compras', 'Qué beneficios puedes dar'] },
  { name: 'Expansión a nueva sucursal o mercado', cat: 'Operación y estructura', days: [7, 20], h: { Estrategia: [6, 14], Operador: [4, 10] },
    b: ['Calculamos si la nueva sucursal o mercado conviene: cuánto debe vender para no perder.', 'Revisamos la ubicación o el mercado y la competencia.', 'Lista de lo que hay que tener listo antes de abrir.', 'Plan de apertura con fechas.'],
    a: ['Copia de los procesos que ya te funcionan para la nueva sede.', 'Plan de marketing para la apertura.', 'Contratación y capacitación del equipo nuevo.', 'Tablero para comparar la nueva sede con la actual.', 'Acompañamiento el primer mes.'],
    on: ['Números de la sede actual', 'Opciones de ubicación o mercado', 'Presupuesto disponible'] },
  { name: 'Estructura financiera', cat: 'Analítica y medición', days: [3, 7], h: { Estrategia: [3, 8], Operador: [2, 4] },
    b: ['Tabla de costos de cada producto o servicio.', 'Precio actual contra precio sugerido.', 'Ganancia por producto, en quetzales y en porcentaje.', 'Costos fijos del mes.', 'Punto de equilibrio: cuánto hay que vender para no perder.', 'Entrega en Google Sheets, lista para actualizar.'],
    a: ['Escenarios: qué pasa si sube un costo o baja una venta.', 'Precios por paquete o por tipo de cliente.', 'Margen por línea de negocio.', 'Plan de inversión: cuánto invertir y cuándo regresa.', 'Tablero mensual de ventas, costos y ganancia.'],
    on: ['Costos de tus productos', 'Ventas de los últimos meses', 'Gastos fijos del mes'] },
  { name: 'Estructura empresarial: quién hace qué y cómo', cat: 'Operación y estructura', days: [4, 8], h: { Estrategia: [3, 8], Operador: [3, 6] },
    b: ['Organigrama: quién es quién.', 'Roles: qué hace cada persona y ante quién responde.', 'Tabla de «quién hace qué».', 'Los 3 procesos más importantes, paso a paso: cómo se vende, cómo se entrega y cómo se cobra.', 'Entrega en documento listo para compartir.'],
    a: ['Todos los procesos clave documentados: pasos, responsables y tiempos.', 'Quién aprueba qué y a quién se le escala cada problema.', 'Calendario de reuniones y revisiones.', 'Indicadores por rol, para que cada quien sepa si va bien.', 'Guía de ingreso para gente nueva.', 'Capacitación al equipo.'],
    on: ['Lista de personas y qué hace cada una', 'Procesos que ya tengas escritos'] },
];

const key = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// Crea en el catálogo los que falten. Devuelve { creados, existentes } y el catálogo resultante.
export async function agregarNuevos(S, services, rates = null) {
  const out = [...services]; let creados = 0, existentes = 0;
  for (const d of NUEVOS) {
    if (out.some((x) => key(x.name) === key(d.name))) { existentes++; continue; }
    const doc = { name: d.name, category: d.cat, unit: 'proyecto', description: '', level: 5, price: null,
      tasks: Object.entries(d.h).map(([role, [h5, h10]]) => ({ role, hours: h5, hours10: h10 })),
      includes5: d.b.join('\n'), includes10: d.a.join('\n'), days5: d.days[0], days10: d.days[1], onboarding: d.on.join('\n') };
    const prices = rates ? pricesOf(doc, rates) : null;
    if (prices) { doc.prices = prices; doc.price = prices[5]; }
    out.push(await S.create(doc)); creados++;
  }
  return { creados, existentes, services: out };
}
