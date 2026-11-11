import type { Aviso, Marca, Nodo } from '@/lib/hilo'

/**
 * Datos de EJEMPLO del hilo para el modo mock. Las marcas son inventadas (no son clientes reales):
 * sirven para ver las herramientas, las tarjetas de decisión y los avisos sin backend.
 */
export const marcasEjemplo: Marca[] = [
  { id: 'lumbre', nombre: 'Lumbre Catering (ejemplo)', industria: 'Catering corporativo', nivel: 'Brand Growth' },
  { id: 'norte', nombre: 'Estudio Norte (ejemplo)', industria: 'Arquitectura de interiores', nivel: 'Brand Foundation' },
]

const hace = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()

let orden = 0
function n(id: string, tipo: Nodo['tipo'], titulo: string, contenido: Record<string, unknown>, extra: Partial<Nodo> = {}): Nodo {
  orden++
  return {
    id,
    cliente: 'lumbre',
    tipo,
    titulo,
    contenido,
    estado: 'hipotesis',
    fuente: 'hipótesis',
    viene_de: [],
    version: 1,
    actualizado: hace(200 - orden),
    ...extra,
  }
}

export function nodosEjemplo(): Nodo[] {
  orden = 0
  const ok = { estado: 'aprobado' as const }
  return [
    n('lu-producto', 'producto', 'Catering para reuniones de empresa', {
      decide: 'Qué vendemos: menú para reuniones de 15 a 80 personas, con entrega a hora fija.',
      texto: 'Menú para reuniones de 15 a 80 personas. Ticket de Q4,500 por evento. Entrega con hora fija y factura el mismo día.',
      precio: 'Q4,500 por evento',
    }, { ...ok, fuente: 'Reunión del día 1 (notas del CEO)' }),
    n('lu-icp', 'icp', 'Empresas de 30 a 200 personas en la capital', {
      decide: 'A quién le vendemos primero.',
      facturacion: 'Q300,000 o más al mes',
      ticket: 'Q4,500 por evento',
      frecuencia: '2 a 4 eventos al mes',
      demanda: 'alta',
      ciclo: 'rapido',
      margen: 'Suficiente para pagar Q4,500 sin pedir aprobación del dueño',
      capacidad: 'Hasta 6 eventos por semana',
      decisor: 'Asistente de gerencia o jefa de recursos humanos',
      industrias: 'Despachos legales, agencias, oficinas regionales de multinacionales',
      geografia: 'Zonas 9, 10, 14 y Carretera a El Salvador · LinkedIn y correo',
      regla: 'El cliente factura ~70× el ticket del evento',
    }, { ...ok, fuente: 'hipótesis', viene_de: ['lu-producto'] }),
    n('lu-adq', 'adquisicion', 'Outbound: 5 clientes en 4 semanas', {
      decide: 'Cuántas empresas hay que prospectar para cerrar la meta.',
      outbound: { meta: 5, conversion: 0.01, probabilidad: 0.95, semanas: 4 },
      resultado: { prospectos: 913, porSemana: 229, porDiaHabil: 46 },
    }, { viene_de: ['lu-icp'] }),
    n('lu-dolor-1', 'dolor', 'Pedir comida para 40 es un caos de WhatsApps', {
      decide: 'El dolor que más se repite en las entrevistas.',
      texto: 'La asistente coordina con 3 proveedores por WhatsApp, cambia el número de personas dos veces y nadie confirma.',
    }, { ...ok, fuente: 'Entrevistas 1–4 (resumen del agente, revisado)', viene_de: ['lu-icp'] }),
    n('lu-dolor-2', 'dolor', 'La comida llega tarde y la reunión empieza sin nada', {
      decide: 'Segundo dolor: puntualidad. Define el ángulo «el reloj».',
      texto: 'Si la comida llega 20 minutos tarde, la asistente queda mal frente a gerencia.',
    }, { ...ok, version: 2, actualizado: hace(3), fuente: 'Entrevista 2 [hipótesis en el monto]', viene_de: ['lu-icp'] }),
    n('lu-dolor-3', 'dolor', 'La factura llega a fin de mes y contabilidad se queja', {
      decide: 'Tercer dolor: la factura.',
      texto: 'Contabilidad necesita la factura el mismo día para cerrar la caja chica.',
    }, { viene_de: ['lu-icp'] }),
    n('lu-deseo-1', 'deseo', 'Quedar bien con gerencia sin pensar en la comida', {
      decide: 'El deseo que mueve la compra.',
      texto: 'Que la reunión salga perfecta y a ella la feliciten.',
    }, { ...ok, fuente: 'Entrevistas 1 y 3', viene_de: ['lu-icp'] }),
    n('lu-deseo-2', 'deseo', 'Un solo proveedor de confianza para todo el año', {
      decide: 'Deseo de largo plazo: dejar de buscar proveedor.',
      texto: 'Tener a alguien que ya sepa cómo le gusta a la empresa.',
    }, { viene_de: ['lu-icp'] }),
    n('lu-historia', 'historia', 'La asistente que dejó de apagar incendios', {
      decide: 'La historia que cuentan todas las piezas.',
      villano: 'El caos de última hora: WhatsApps, cambios y comida tarde',
      heroe: 'La asistente de gerencia',
      guia: 'Lumbre: un solo número, hora fija y factura el mismo día',
      plan: '1) Mandas número de personas · 2) Confirmamos menú en 10 min · 3) Llega 15 min antes',
      exito: 'La reunión empieza a tiempo y gerencia la felicita',
      fracaso: 'Otra reunión improvisada con pizzas frías',
    }, { viene_de: ['lu-dolor-1', 'lu-deseo-1'] }),
    n('lu-pilar-1', 'pilar', 'Reuniones sin caos', { decide: 'Pilar 1: el orden detrás de cada evento.' }, { ...ok, viene_de: ['lu-dolor-1'] }),
    n('lu-pilar-2', 'pilar', 'Comida que llega bien', { decide: 'Pilar 2: puntualidad y temperatura.' }, { viene_de: ['lu-dolor-2'] }),
    n('lu-pilar-3', 'pilar', 'Detrás de cocina', { decide: 'Pilar 3: quiénes cocinan y cómo.' }, { viene_de: ['lu-producto'] }),
    n('lu-angulo-1', 'angulo', 'Antes y después de la reunión', { decide: 'Mostrar el caos de antes y la calma de después.' }, { viene_de: ['lu-dolor-1'] }),
    n('lu-angulo-2', 'angulo', 'El reloj', { decide: 'Cuenta regresiva: llega 15 min antes, siempre.' }, { viene_de: ['lu-dolor-2'] }),
    n('lu-angulo-3', 'angulo', 'La que quedó bien', { decide: 'La asistente felicitada por gerencia.' }, { viene_de: ['lu-deseo-1'] }),
    n('lu-idea-1', 'idea', '40 WhatsApps vs. 1 mensaje', { decide: 'Reel de pantalla dividida.' }, { viene_de: ['lu-pilar-1', 'lu-angulo-1'] }),
    n('lu-idea-2', 'idea', 'Cronómetro en la entrega', { decide: 'Seguimos una entrega con el reloj en pantalla.' }, { viene_de: ['lu-pilar-2', 'lu-angulo-2'] }),
    n('lu-idea-3', 'idea', 'El chef prepara a las 6 a. m.', { decide: 'Detrás de cocina antes de un evento grande.' }, { viene_de: ['lu-pilar-3', 'lu-angulo-1'] }),
    n('lu-idea-4', 'idea', '«Te felicitaron por la comida»', { decide: 'Testimonio de una asistente.' }, { viene_de: ['lu-pilar-1', 'lu-angulo-3'] }),
    n('lu-ref-1', 'referente', '@cateringdeoficina (MX)', {
      red: 'Instagram',
      winners: [
        { titulo: 'POV: eres la asistente y faltan 10 min', vistas: 1_200_000, patron: 'POV + reloj en pantalla', quemado: false },
        { titulo: 'Unboxing de bandejas', vistas: 340_000, patron: 'Unboxing cenital', quemado: true },
      ],
    }),
    n('lu-ref-2', 'referente', '@officelunchco (US)', {
      red: 'TikTok',
      winners: [
        { titulo: 'What 50 people eat at a board meeting', vistas: 2_400_000, patron: 'Número + curiosidad', quemado: false },
        { titulo: 'Rating our clients’ reactions', vistas: 610_000, patron: 'Reacciones', quemado: false },
      ],
    }),
    n('lu-ref-3', 'referente', '@cocinadelmercado (GT)', {
      red: 'Instagram',
      winners: [{ titulo: 'Así se ve una cocina a las 5 a. m.', vistas: 95_000, patron: 'Madrugada + ASMR', quemado: true }],
    }),
    n('lu-campana-1', 'campana', 'Reuniones a tiempo — noviembre', {
      decide: 'La campaña del mes: puntualidad y orden.',
      copy: 'Tu reunión empieza a las 9. La comida, a las 8:45.\n\nUn mensaje con el número de personas. Confirmamos menú en 10 minutos. Llegamos 15 minutos antes y la factura sale el mismo día.\n\nEscríbenos «REUNIÓN» y te mandamos el menú de esta semana.',
      resultado: '12 conversaciones calificadas y 3 eventos cerrados en 4 semanas [hipótesis]',
      ideas: ['lu-idea-1', 'lu-idea-2', 'lu-idea-4'],
    }, { viene_de: ['lu-angulo-1', 'lu-angulo-2'] }),
    n('lu-pieza-1', 'pieza', 'Reel «40 WhatsApps vs. 1 mensaje»', { decide: 'Reel 9:16, 20 s.', formato: 'Reel', idea: 'lu-idea-1' }, { viene_de: ['lu-campana-1', 'lu-idea-1'] }),
    n('lu-pieza-2', 'pieza', 'Reel «Cronómetro en la entrega»', { decide: 'Reel 9:16, 30 s.', formato: 'Reel', idea: 'lu-idea-2' }, { viene_de: ['lu-campana-1', 'lu-idea-2'] }),
    n('lu-pre', 'pre', 'Grabación del 18 de noviembre', {
      decide: 'Plan de la jornada de grabación.',
      jornada: { fecha: '18 de noviembre', lugar: 'Cocina de Lumbre + oficina de un cliente', llamado: '6:00 a. m.', bloques: [
        { hora: '6:00', que: 'Cocina: preparación y emplatado' },
        { hora: '8:00', que: 'Traslado con cronómetro (pieza 2)' },
        { hora: '8:45', que: 'Montaje en la oficina' },
        { hora: '9:30', que: 'Pantalla dividida WhatsApps (pieza 1)' },
      ] },
      guion: 'Pieza 1: abre con 40 notificaciones; corte seco a un solo mensaje «40 personas, 9 a. m.». Cierre: «Reunión resuelta».',
      shots: [
        { plano: 'Cenital', descripcion: 'Teléfono con 40 notificaciones', hook: '¿40 mensajes para una reunión?', listo: false },
        { plano: 'Medio', descripcion: 'Asistente escribe un solo mensaje', hook: 'Un mensaje. Listo.', listo: false },
        { plano: 'Detalle', descripcion: 'Cronómetro sobre la bandeja', hook: 'Faltan 15 minutos…', listo: true },
      ],
      permisos: [
        { texto: 'Permiso de grabación en la oficina del cliente', listo: false },
        { texto: 'Autorización de imagen de la asistente', listo: false },
      ],
      compras: [
        { texto: 'Cronómetro de pantalla grande', costo: 'Q180', listo: false },
        { texto: 'Bandejas de muestra', costo: 'Q0 (las pone Lumbre)', listo: true },
      ],
      hooks: ['«Tu reunión empieza a las 9. La comida, a las 8:45.»', '«Deja de coordinar comida por WhatsApp.»'],
    }, { viene_de: ['lu-pieza-1', 'lu-pieza-2'] }),
  ]
}

/** Aviso inicial: el dolor #2 cambió (versión 2) y afecta lo que viene de él. */
export function avisosEjemplo(nodos: Nodo[], dependientes: (id: string) => string[]): Aviso[] {
  const d2 = nodos.find((x) => x.id === 'lu-dolor-2')
  if (!d2) return []
  return [
    {
      id: 'av-1',
      cliente: 'lumbre',
      nodo: d2.id,
      version: d2.version,
      afectados: dependientes(d2.id),
      mensaje: 'Strategy cambió «dolor #2»: ahora el monto de tiempo es una hipótesis.',
      creado: d2.actualizado,
    },
  ]
}

export function nodosNorte(): Nodo[] {
  return [
    {
      id: 'no-producto',
      cliente: 'norte',
      tipo: 'producto',
      titulo: 'Diseño de interiores para oficinas pequeñas',
      contenido: { decide: 'Qué vendemos.', texto: 'Proyecto llave en mano para oficinas de 50 a 300 m².' },
      estado: 'hipotesis',
      fuente: 'hipótesis',
      viene_de: [],
      version: 1,
      actualizado: hace(30),
    },
  ]
}
