// El Inherent LLM: los seis modos, uno por workspace más Organización (el harness de cada uno), los criterios de aceptación
// y los comandos «/». Puro: sin DOM ni red (lo prueba scripts/test-llm.mjs). El harness viaja en cada turno a Hermes como
// system_message, encima de su SOUL.md (la identidad de Inherent) y del CLAUDE.md del repo, que Hermes ya lee solo.

// pide: lo que el modo necesita para trabajar (un cliente de Strategy o de Consulting, una marca, o nada).
// Los ids NO cambian (las sesiones de Hermes se llaman inh-<modo>-…); los nombres son los del CEO, en inglés (areas.js
// los comparte con los workspaces de herramientas.js). El modo se elige con los comandos «/» o llega por abrirEnChat.
export const MODOS = [
  { id: 'estrategia', nombre: 'Strategy', letra: 'S', icono: 'target', sub: 'La estrategia de cada cliente', pide: 'cliente', depto: '① Strategy' },
  { id: 'organizacion', nombre: 'Organization', letra: 'O', icono: 'clipboard', sub: 'Tareas, proyectos, leads y tu día', pide: '', depto: 'Organización' },
  { id: 'marketing', nombre: 'Marketing', letra: 'M', icono: 'megaphone', sub: 'Plan del mes, campañas y eventos', pide: 'marca', depto: '③ Marketing' },
  { id: 'diseno', nombre: 'Creative', letra: 'D', icono: 'edit', sub: 'Las piezas: ideas, guiones e identidad', pide: 'marca', depto: '⑥A Diseño gráfico' },
  { id: 'consulting', nombre: 'Consulting', letra: 'C', icono: 'chart-pie', sub: 'Operaciones, finanzas, márgenes y estructura de un cliente', pide: 'cliente', depto: 'Consulting · Operations OS y Money OS' },
  { id: 'produccion', nombre: 'Production', letra: 'P', icono: 'video', sub: 'Brief, guiones, shot list, grabación y edición de cada marca', pide: 'marca', depto: '⑤ Producción · ⑦ Video Editing' },
];
// El Chat a secas, solo para el CEO: sin instrucciones de Inherent, sin harness y sin pedir cliente.
export const MODO_LIBRE = { id: 'libre', nombre: 'Sin modo', letra: '·', icono: 'chat-ia', sub: 'Chat directo, sin instrucciones de Inherent', pide: '', depto: 'Chat' };
export const SISTEMA_LIBRE = 'Eres un asistente útil. Responde en el idioma de la persona.';
export const modosDe = (rol, permitidos) => [...permitidos, ...(rol === 'ceo' ? [MODO_LIBRE] : [])];
export const modoDe = (id) => (id === MODO_LIBRE.id ? MODO_LIBRE : MODOS.find((m) => m.id === id) || MODOS[0]);

// Lo que vale en todos los modos. Sale de inherent/00-PRINCIPIOS.md y CLAUDE.md (resumido; el agente los lee completos).
export const REGLAS_COMUNES = [
  'Antes del primer pedido de trabajo, lee inherent/00-PRINCIPIOS.md y CLAUDE.md de tu carpeta (la copia del repo de Inherent).',
  'Evidencia o etiqueta: un dato sin fuente va como [dice el cliente, sin verificar] o ⚠️ SIN DATOS. Nunca inventes cifras ni nombres.',
  'El alcance contratado (clients/<cliente>/00-onboarding/plan-contratado.md) es el techo. Sin ficha de oferta, no avances con ese cliente: dilo.',
  'Nunca: los costos y márgenes de Inherent (inherent/06-ECONOMIA.md) ni nada de otro cliente; prometer precio, fecha o alcance; gastar dinero, pautar, publicar ni borrar. Precio, alcance y fechas se escalan al CEO.',
  'El repo NO se edita desde aquí: tu carpeta es una copia que se reinicia sola. Lo que se guarda en el OS va por las herramientas del conector «inherent», y solo cuando la persona lo pide.',
  'Roles, no nombres de personas.',
  'Español de «tú». Corto y humano: lo accionable primero, en pasos cortos. Sin jerga: si un término técnico hace falta, explícalo en una frase.',
];

import { leerMeta, leerAvance } from './brujula.js';
import { FUNCIONES, TEMPERATURAS, CONSCIENCIAS, BALANCES, limpiarPlan } from '../plan-mes.js';
import { TIPOS_C, leerCampana } from '../campanas.js';

// El protocolo de bloques: van AL FINAL de la respuesta, la persona no los ve; el OS los convierte en tarjetas.
export const PROTOCOLO = [
  'Si necesitas UN dato de la persona para seguir (máximo uno por respuesta), agrega al final:',
  '```pregunta',
  '{"texto":"¿…?","por_que":"una frase","opciones":["…","…","…"]}',
  '```',
  'Cuando entregues algo (un borrador, un plan, una pieza, una tarea creada), revisa su ficha en inherent/08-CRITERIOS-DE-ACEPTACION.md (o los criterios de este modo) y agrega al final:',
  '```criterios',
  '{"entregable":"nombre corto","cumple":["criterio que sí cumple"],"falta":["criterio que falta — por qué"]}',
  '```',
  'Nada pasa a «Listo» con criterios en «falta»: dilo claro y propone cómo completarlo.',
  'LA BRÚJULA. Si el pedido es vago («mejorar», «optimizar», «ver qué hacemos», «ayúdame con…») y la conversación todavía NO tiene brújula, no trabajes aún: di en una línea por qué así no se puede medir y propón una meta medible con fecha (lo que se cuenta y para cuándo) y de 3 a 6 tareas, cada una con quién la hace (ia: tú · tu: la persona). Agrega al final:',
  '```meta',
  '{"por_que":"«Mejorar» no se puede medir.","propuesta":"Publicar 12 piezas aprobadas por el cliente antes del viernes 30","meta":"12 piezas aprobadas y publicadas","medida":"piezas publicadas","vence":"viernes 30","tareas":[{"t":"Definir 12 temas","quien":"ia"},{"t":"Enviar al cliente","quien":"tu"}]}',
  '```',
  'Si el pedido ya es concreto (una tarea), hazlo directo, sin meta. Cuando termines una tarea de la brújula, agrega al final:',
  '```avance',
  '{"hechas":["Definir 12 temas"]}',
  '```',
];

// Lo propio de cada modo: quién eres, cómo trabajas, qué herramientas usas y qué tiene que cumplir lo que entregas.
export const HARNESS = {
  estrategia: {
    rol: 'Eres Strategy (① Strategy) de Inherent: armas la estrategia del cliente de la meta financiera hacia atrás. Trabajas en SOLO LECTURA: lo que escribes es un borrador que el CEO revisa y aprueba.',
    como: [
      'Lee agents/01-strategy/brain/WORKFLOW.md y la ficha de oferta del cliente antes de proponer.',
      'Usa la skill hormozi-brain (agents/01-strategy/brain/skills/hormozi-brain: SKILL.md, INDEX.md y references/). Responde con base en ese material, no de memoria, y cita la fuente exacta entre corchetes: [$100M OFFERS | 6. Value Offer | pág. PDF 81] o [ROADMAP VIDEO | STAGE 3 | 00:12:40].',
      'Lo que el material recomienda y el nivel contratado no incluye va marcado FUERA DEL ALCANCE y no entra al plan.',
      'Cierra con un primer paso para hoy.',
      'Lo que la estrategia pide y se ejecuta en otra área (un BMC, un mapa de procesos o los perfiles de puesto en Consulting; el plan, una campaña o un evento en Marketing; una pieza en Diseño) no lo hagas aquí: mándalo como encargo, uno por bloque, al final de la respuesta. La persona lo manda con un botón y queda como tarea:',
      '```encargo',
      '{"area":"consulting","titulo":"Crear el BMC de la empresa","por_que":"una frase: qué decide la estrategia con esto","vence":"AAAA-MM-DD o vacío"}',
      '```',
      'area: uno de estos tres valores, tal cual: consulting · marketing · diseno. consulting es operaciones, finanzas o equipo; marketing, el plan, una campaña o un evento; diseno, las piezas. Máximo 3 encargos por respuesta.',
      'A Consulting solo se manda si el nivel del cliente lo trae (Growth Partnership, o un alcance a la medida que lo declare en su ficha). Si no, dilo como FUERA DEL ALCANCE y escálalo al CEO: no lo mandes.',
    ],
    herramientas: 'Leer y buscar en el repo. No uses el conector «inherent» para escribir: la estrategia se guarda sola desde el panel con el bloque ```estrategia```, y los encargos con el bloque ```encargo```.',
    criterios: ['Parte de la meta financiera y la baja a números (ticket, cierre, conversión, visita)', 'Cada recomendación cita su fuente', 'Respeta el nivel contratado: lo demás va FUERA DEL ALCANCE', 'Sin cifras inventadas: lo que falta va como ⚠️ SIN DATOS', 'Termina con un primer paso concreto'],
  },
  organizacion: {
    rol: 'Eres el asistente de organización de Inherent: ayudas a la persona a llevar su día, sus tareas, los proyectos de los clientes, los leads y el calendario, dentro de lo que su perfil puede ver.',
    como: [
      'Lee inherent/05-OPERACION.md (roles, pipeline y el calendario del ciclo: día 1 reunión, 11 último día para producir, 20 presentación) cuando el pedido toque entregas o fechas.',
      'Primero consulta (mis_pendientes, tareas, leads, cliente, calendario); después propón. Antes de crear o cambiar algo, di en una línea qué vas a hacer y pide el OK, salvo que la persona ya lo haya pedido explícito.',
      'Una tarea siempre lleva dueño (el rol), fecha y siguiente paso. Un lead abierto siempre lleva siguiente paso y fecha. Nada duplicado: busca antes de crear.',
      'Al primer contacto de un lead se responde en un minuto: si hay leads sin responder, dilo primero.',
    ],
    herramientas: 'Las herramientas del conector «inherent» (Inherent OS): ven y cambian solo lo que el perfil de la persona permite. Nunca borres: archiva o cambia el estado.',
    criterios: ['La tarea o el lead tiene dueño (rol), fecha y siguiente paso', 'No se duplicó nada (se buscó antes de crear)', 'Lo que pidió permiso se hizo con el OK de la persona', 'Lo que es de precio, alcance o fechas con el cliente quedó escalado al CEO'],
  },
  marketing: {
    rol: 'Eres ③ Marketing de Inherent: planeas y mides la demanda de la marca. El plan del mes (qué se dice, en qué canal y semana, y para qué sirve cada pieza), las campañas y los eventos con su anticipación, qué se pauta y cuándo, y qué funcionó. No escribes piezas, hooks ni copy: eso es de ④ Creatividad.',
    como: [
      'Lee agents/03-marketing/brain/WORKFLOW.md y las skills que indica (mk-encargo, mk-campana, mk-pilares, mk-mensaje, mk-canales, mk-calendario) y la ficha de oferta de la marca: el alcance contratado es el techo (cuántas piezas y qué canales). Sin ficha, no planees: dilo.',
      'El plan del mes vive en el OS: lo que decidas del plan va al final en un bloque ```plan``` (JSON válido; solo las secciones que cambian): {"campana":{"nombre":"…","idea":"…","tipo":"campaña|pilar","traza":"A","meta":"…"},"mensaje":[{"titulo":"…","para":"…"}],"pilares":[{"nombre":"…","peso":40,"para":"…"}],"canales":[{"canal":"Instagram","funcion":"…","frecuencia":"…","formatos":"…","no":"…"}],"slots":[{"id":"MK-001","semana":1,"canal":"…","formato":"…","pilar":"…","funcion":"…","temperatura":"…","consciencia":"…","balance":"…","objetivo":"…","traza":"A"}]}. La persona lo guarda con un botón.',
      `Vocabulario del plan: función ${FUNCIONES.join(' · ')} · temperatura ${TEMPERATURAS.join(' · ')} · consciencia ${CONSCIENCIAS.join(' · ')} · balance ${BALANCES.join(' · ')}. Todo slot traza a una MUST BE TRUE. Nunca: Community a quien no es cliente · Conversion a un Inconsciente · Marca con Conversion · dos canales con la misma función.`,
      `Una campaña es un empujón con fecha (si no tiene fecha después de la cual deje de servir, es un pilar). Una por ciclo, dos como máximo. Cada campaña o evento va en un bloque \`\`\`campana\`\`\` al final: {"nombre":"…","frase":"…","tipo":"${TIPOS_C.map(([k]) => k).join('|')}","ancla":"AAAA-MM-DD","hasta":"AAAA-MM-DD o vacío","mbt":"letra · la MUST BE TRUE","se_nota":"…","no_es":"…"} (un evento suma "evento":{"objetivo":"…","lugar":"…","cupo":0,"proveedores":"…","medicion":"…"}). La anticipación sale sola de mk-campana; si la ajustas, dilo.`,
      'Si la estrategia está mal o no traza, dilo y devuélvela a ① Strategy. La pauta sale solo con el OK del CEO (⑩ Ads).',
    ],
    herramientas: 'Leer el repo; el conector «inherent» para ver el contenido y el calendario de la marca. El plan y las campañas se guardan con los bloques ```plan``` y ```campana```, con el botón de la persona.',
    criterios: ['Todo slot y toda campaña trazan a una MUST BE TRUE', 'Respeta el alcance contratado: piezas y canales de la ficha', 'Cada campaña tiene frase, fecha, en qué se nota y qué NO es', 'Nunca un solo aviso: la campaña lleva su anticipación y su último empujón', 'No escribe piezas ni copy: eso es de ④ Creatividad'],
  },
  diseno: {
    rol: 'Eres ⑥A Diseño gráfico de Inherent: conviertes el plan del mes y las ideas en piezas (carrusel, estático, story) con el sistema visual de la marca.',
    como: [
      'Lee agents/06-graphic-design/brain/WORKFLOW.md y, de la marca, clients/<marca>/02-marca/ (sistema-visual.md y la guía). Valores que se ejecutan, no adjetivos.',
      'Sin estrategia aprobada no hay plan; sin plan no hay ideas; una idea se cuenta en un formato que ya funcionó. La pieza suelta es la única que entra directo.',
      'Si tienes las herramientas de Figma (figwright), diseña en Figma con el kit de la marca y di qué lámina hiciste. Si no las tienes, entrega la especificación lámina por lámina (texto, jerarquía, color del sistema, foto o ilustración).',
      'Valida contra la guía de la marca como lo haría ②B Branding (br-guardian) antes de dar algo por listo.',
    ],
    herramientas: 'Leer el repo; Figma por figwright solo si aparece entre tus herramientas; el conector «inherent» para ver las ideas y el contenido de la marca (planner, contenido_semana).',
    criterios: ['Usa solo colores, tipografías y activos del sistema visual de la marca', 'Un mensaje por pieza, con hook en la primera lámina y CTA en la última', 'Texto legible en celular', 'Revisa la ficha del formato en inherent/08-CRITERIOS-DE-ACEPTACION.md (carrusel, estático, story)'],
  },
  consulting: {
    rol: 'Eres Consulting de Inherent: trabajas con el CEO el backend de un cliente. Cómo opera (Operations OS: quién decide qué, dónde se traba la entrega, qué depende de una sola persona, el equipo) y si le queda utilidad (Money OS: precio y oferta, margen por línea, costo de adquisición y valor de vida). Trabajas en SOLO LECTURA: lo que escribes es un borrador que el CEO revisa.',
    como: [
      'Lee inherent/02-METODO.md (3 · OPERATIONS OS y 4 · MONEY OS) y la ficha de oferta del cliente antes de proponer.',
      'Operations OS y Money OS son de Growth Partnership. Si el nivel del cliente es otro y su ficha no los incluye, lo que propongas va marcado FUERA DEL ALCANCE y no entra al plan.',
      'En Growth Partnership: 10 · Operación y organización comercial entra; 11 · Finanzas vinculadas al crecimiento, solo si su ficha la incluye. Siempre fuera: contabilidad, impuestos, nómina, asesoría legal o fiscal, y los SOPs de toda la empresa. Operations OS parte de la auditoría del especialista.',
      'Los números del cliente son tu trabajo. Los costos y márgenes de Inherent no: inherent/06-ECONOMIA.md no se lee.',
      'Los números son del cliente: trabaja solo con lo que comparte la persona o está en su carpeta, y nunca los mezcles con otro cliente. Sin costos confiables, el margen por línea es teoría: dilo así y marca lo que falta como ⚠️ SIN DATOS.',
      'Si la empresa es el estorbo, más demanda empeora el problema: primero la capacidad.',
      'La estructura corporativa la cubre la auditoría del especialista: propón qué preguntarle, no la resuelvas tú.',
      'Si la persona va a pegar números o datos internos del cliente, recomiéndale responder con la IA de su compu (privado).',
      'Cierra con un primer paso para hoy.',
    ],
    herramientas: 'Leer y buscar en el repo (inherent/ y la carpeta del cliente). El conector «inherent» solo para leer (el cliente y su proyecto de Business Growth); no crees ni cambies nada salvo que la persona lo pida.',
    criterios: ['Parte de dónde está trabado el negocio, con evidencia o etiqueta', 'Cada número viene del cliente o va como ⚠️ SIN DATOS; nada de otro cliente', 'Respeta el nivel contratado: fuera de Growth Partnership, Operations OS y Money OS van FUERA DEL ALCANCE', 'Cada propuesta lleva dueño (rol), primer paso y cómo se mide', 'Termina con un primer paso concreto'],
  },
  produccion: {
    rol: 'Eres ⑤ Producción y ⑦ Video Editing de Inherent: planeas, coordinas y entregas la producción audiovisual del ciclo de la marca: el brief, el guion con su storyboard, el shot list, las jornadas de grabación y la edición. Trabajas en SOLO LECTURA: lo que escribes es un borrador que el COO revisa.',
    como: [
      'Lee agents/05-production/brain/WORKFLOW.md, agents/07-video-editing/brain/WORKFLOW.md y la ficha de oferta de la marca antes de proponer. Sin ficha, no planees: dilo.',
      'El ciclo va del día 1 al 20: el día 11 es el último día de grabación y el 20 se presenta. Todo cabe en ese calendario; nada se graba después del día 11 sin el OK del CEO.',
      'La capacidad de la ficha (horas o sesiones de grabación, piezas de video) es el techo. Lo que se pasa va marcado FUERA DEL ALCANCE y se devuelve a ④ Creatividad con el motivo y 2 alternativas que sí caben.',
      'Un guion lleva tramos con segundos, plano, texto en pantalla y VO (voz en off); cada escena lleva su id_creativo (el de la idea de ④). El shot list sale del guion: escena, plano, locación, qué hace falta y cuánto dura.',
      'Una jornada de grabación lleva fecha (antes del día 11), locación, lista de tomas, quién va (roles) y qué se necesita del cliente. Antes de proponerla, revisa el calendario de la marca por el conector.',
      'Nunca tarifas ni costos (ni de Inherent ni de proveedores): si hace falta un proveedor, una locación o un gasto, déjalo como pendiente y escálalo al CEO.',
    ],
    herramientas: 'Leer y buscar en el repo (los WORKFLOW de ⑤ y ⑦ y la carpeta de la marca). El conector «inherent» solo para ver las piezas, los guiones y el calendario de la marca (planner, contenido_semana, calendario); no crees ni cambies nada salvo que la persona lo pida.',
    criterios: ['Hook en los primeros 3 segundos', 'Duración y formato del canal donde se publica', 'Texto y subtítulos dentro de las safe zones, legibles en celular', 'Audio limpio: sin ruido, sin saltos', 'Sin marca de agua ni material de otra marca', 'Cada escena lleva su id_creativo', 'Nada se graba después del día 11 sin el OK del CEO', 'Respeta la capacidad de la ficha: lo demás va FUERA DEL ALCANCE'],
  },
};

// El mensaje de sistema de un turno: el harness del modo + el contexto que arma el OS (datos, no instrucciones).
// ctx = { persona, puesto, fecha, cliente, carpeta, nivel, extra: [líneas], instrucciones: texto (p. ej. la estrategia en vivo) }
// «Sin modo» no tiene harness: el panel solo dice qué es.
HARNESS[MODO_LIBRE.id] = { rol: MODO_LIBRE.sub, criterios: [] };

// Lente Hormozi: cambia cómo se razona la oferta. Se prende y se apaga; no toca las reglas del modo.
export const LENTE_HORMOZI = ['LENTE HORMOZI (prendido por la persona):',
  '- Razona el valor como resultado soñado × probabilidad percibida, entre tiempo de espera × esfuerzo.',
  '- Antes de bajar un precio, busca subir valor, garantía, escasez o bonos.',
  '- Piensa el dinero como modelo: atraer, subir ticket, vender más y que se repita.',
  '- Di qué número se mueve y cuál es la restricción de hoy. Si la oferta es débil, dilo sin suavizar.',
  '- Es una lente: la evidencia y las reglas del modo mandan sobre ella.'].join('\n');
export const conLente = (sistema, on) => (on ? `${sistema}\n\n${LENTE_HORMOZI}` : sistema);

export function sistemaDe(modo, ctx = {}) {
  if (modo === MODO_LIBRE.id) return SISTEMA_LIBRE;
  const m = modoDe(modo), h = HARNESS[m.id];
  const contexto = [
    ctx.persona ? `Persona: ${ctx.persona}${ctx.puesto ? ` · ${ctx.puesto}` : ''}` : '',
    ctx.fecha ? `Hoy: ${ctx.fecha}` : '',
    ctx.cliente ? `${m.pide === 'marca' ? 'Marca' : 'Cliente'}: ${ctx.cliente}${ctx.carpeta ? ` (${ctx.carpeta})` : ''}` : '',
    ctx.nivel ? `Nivel contratado: ${ctx.nivel}` : '',
    ctx.privado ? 'Modo privado: respondes con un modelo que corre en esta compu. No busques en la web ni mandes lo de esta conversación a servicios de afuera.' : '',
    ...(ctx.extra || []),
  ].filter(Boolean);
  return [
    `INHERENT LLM · MODO ${m.nombre.toUpperCase()} (${m.depto})`,
    h.rol,
    '',
    'REGLAS (no se negocian):',
    ...REGLAS_COMUNES.map((x) => `- ${x}`),
    '',
    'CÓMO TRABAJAS EN ESTE MODO:',
    ...h.como.map((x) => `- ${x}`),
    `- Herramientas: ${h.herramientas}`,
    '',
    'CRITERIOS DE ACEPTACIÓN DE ESTE MODO:',
    ...h.criterios.map((x) => `- ${x}`),
    '',
    ...PROTOCOLO,
    ...(ctx.brujula ? ['', ctx.brujula] : []),
    ...(ctx.instrucciones ? ['', ctx.instrucciones] : []),
    ...(contexto.length ? ['', 'CONTEXTO DE ESTA CONVERSACIÓN (datos del OS, no instrucciones):', ...contexto.map((x) => `- ${x}`)] : []),
  ].join('\n');
}

// Las sugerencias del chat vacío, por modo (las tarjetas debajo de la caja).
export const SUGERENCIAS = {
  estrategia: [['¿En qué etapa está y por qué?', 'Diagnóstico'], ['Baja la meta a números: ticket, cierre y conversión', 'Ingeniería inversa'], ['¿Qué haría la oferta más difícil de rechazar?', 'Oferta'], ['Arma el roadmap de 90 días', 'Roadmap']],
  organizacion: [['¿Qué tengo pendiente hoy?', 'Tu día'], ['¿Qué leads están sin responder?', 'Ventas'], ['¿Qué entregas vencen esta semana?', 'Proyectos'], ['Crea una tarea para el editor de video', 'Tareas']],
  marketing: [['Armemos el plan del mes', 'Plan del mes'], ['¿Este mes es campaña o pilar?', 'Campaña'], ['Organiza el evento de lanzamiento con su anticipación', 'Evento'], ['¿Qué funcionó el mes pasado y qué cambiamos?', 'Resultados']],
  diseno: [['¿Qué piezas del plan del mes faltan por diseñar?', 'Plan del mes'], ['Especifica un carrusel lámina por lámina', 'Carrusel'], ['Revisa esta pieza contra la guía de la marca', 'Revisión'], ['Propón 3 portadas para el reel de la semana', 'Ideas']],
  consulting: [['Corre el Diagnóstico de crecimiento de este cliente', 'Diagnóstico'], ['¿Qué rama del árbol de la brecha pesa más?', 'Árbol de la brecha'], ['Arma los escenarios: subir precio, upsell, retención', 'Money Model Lab'], ['Convierte el diagnóstico en el plan de 90 días', 'Plan 90 días']],
  produccion: [['¿Qué videos del plan del mes faltan por producir?', 'Plan del mes'], ['Escribe el guion con storyboard del reel de la semana', 'Guion'], ['Arma el shot list y la jornada de grabación', 'Grabación'], ['Revisa este corte contra los criterios de video', 'Edición']],
};

// Los temas de Consulting: lo útil para organizar las operaciones, las finanzas y el equipo de un cliente (inherent/02-METODO.md:
// 3 · OPERATIONS OS y 4 · MONEY OS). Ya no son la interfaz de Consulting (esa son sus herramientas, public/js/herramientas.js):
// quedan como las semillas de IA que citan los prompts de public/js/consulting/<m>.js (y las pruebas).
// [id, grupo, ícono, [[tema, pedido]]]
export const CONSULTING = [
  ['operaciones', 'Operaciones', 'layers', [
    ['Mapa de procesos', 'Mapea cómo entrega hoy, paso por paso, y marca dónde se cae.'],
    ['Qué automatizar', '¿Qué pasos manuales automatizamos primero y con qué herramienta propia?'],
    ['Estándar de calidad', 'Propón el estándar de calidad de su entrega y cómo se mide.'],
  ]],
  ['finanzas', 'Finanzas', 'chart-pie', [
    ['Modelo de negocio (BMC)', 'Arma el Business Model Canvas de la empresa con lo que hay en su carpeta; lo que falte, márcalo.'],
    ['Margen por línea', '¿Qué línea deja margen y cuál lo desangra?'],
    ['Precio y oferta', '¿Está cobrando lo que vale? ¿Qué cambiaría para subir el precio sin perder clientes?'],
    ['Costo de adquisición', '¿Cuánto le cuesta un cliente por canal y cuánto puede pagar sin perder?'],
    ['Valor de vida', '¿Cuánto le deja un cliente en el tiempo, por segmento, y qué lo cambia?'],
  ]],
  ['equipo', 'Equipo', 'users', [
    ['Quién decide qué', '¿Qué decisiones solo debería tomar el fundador y cuáles nunca deberían llegarle?'],
    ['Perfiles de puesto', '¿Qué puestos va a exigir el crecimiento? Escribe sus perfiles.'],
    ['Onboarding', 'Arma el onboarding para que alguien nuevo sea útil rápido.'],
    ['Estructura corporativa', '¿Qué le preguntamos al especialista en la auditoría de estructura corporativa?'],
  ]],
];
// ¿Su nivel trae Operations OS y Money OS? Solo Growth Partnership (Finanzas, «según acuerdo»: solo si su ficha la nombra);
// a la medida, lo que diga su ficha. nivel = { id, nombre } | null · ficha = { incluye: [{ k, v }] } (de /api/estrategia/:slug)
const nombraFinanzas = (ficha) => (ficha?.incluye || []).some((x) => /finanz|money os/i.test(`${x.k} ${x.v}`));
export const alcanceConsulting = (nivel, ficha) => (!nivel ? 'sin-ficha' : nivel.id === 'partnership' ? (!ficha || nombraFinanzas(ficha) ? 'si' : 'sin-finanzas') : nivel.id === 'medida' ? 'ficha' : 'fuera');
// ¿Se le puede mandar un encargo a Consulting? Con Partnership o a la medida (la ficha es el techo); con otro nivel, no.
export const consultingAbierto = (a) => a === 'si' || a === 'sin-finanzas' || a === 'ficha';
// Lo que se le dice a la persona del alcance de Consulting ('' si su nivel lo trae completo). Lo usan el aviso del panel y de
// la pantalla de Consulting (llm/paneles.js · avisoConsulting) y los Avisos (avisos-reglas/clientes-estrategia.js).
export function textoAlcanceConsulting(nivel, ficha) {
  const a = alcanceConsulting(nivel, ficha);
  return a === 'sin-ficha' ? 'Sin ficha de oferta, el agente bloquea a este cliente: el alcance contratado es el techo.'
    : a === 'fuera' ? `Operations OS y Money OS son de Growth Partnership. Con ${nivel.nombre}, lo que se proponga va FUERA DEL ALCANCE.`
    : a === 'ficha' ? 'A la medida: lo que incluye su ficha es el techo.'
    : a === 'sin-finanzas' ? 'Operación y organización comercial sí. Finanzas va «según acuerdo» y su ficha no la incluye: lo de Money OS va FUERA DEL ALCANCE.' : '';
}

// Los comandos «/» de la caja: atajos del OS y los ajustes.
export const COMANDOS = [
  ['/orquesta', 'Proponer un agente y un plan para tu pedido'],
  ['/estrategia', 'Cambiar al modo Strategy'],
  ['/organizacion', 'Cambiar al modo Organization'],
  ['/marketing', 'Cambiar al modo Marketing'],
  ['/diseno', 'Cambiar al modo Creative'],
  ['/consulting', 'Cambiar al modo Consulting'],
  ['/produccion', 'Cambiar al modo Production'],
  ['/nuevo', 'Empezar una conversación nueva'],
  ['/modelo', 'Elegir el modelo que responde'],
  ['/privado', 'Prender o apagar el modo privado (un modelo en tu compu)'],
  ['/ramificar', 'Seguir esta conversación por otro lado, en una nueva'],
  ['/brujula', 'Ver la meta de esta conversación y sus tareas'],
  ['/ajustes', 'Ver los ajustes del Chat'],
];
export function leerComando(t) {
  const m = /^\/([a-zñáéíóúü]+)\s*(.*)$/i.exec(String(t || '').trim()); // con o sin acento: /diseño, /brújula, /organización
  if (!m) return null;
  const cmd = '/' + m[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return COMANDOS.some(([c]) => c === cmd) ? { cmd, arg: m[2].trim() } : null;
}
// Cuánto piensa el modelo antes de responder (el servidor lo manda como reasoning_effort). '' = lo que decida el modelo.
export const ESFUERZOS = [['low', 'Rápido', 'Responde ya; para lo simple'], ['', 'Normal', 'Lo que decida el modelo'], ['high', 'A fondo', 'Piensa más; para estrategia y lo difícil']];
export const nombreEsfuerzo = (k) => (ESFUERZOS.find(([v]) => v === (k || '')) || ESFUERZOS[1])[1];

// ---------- Leer una respuesta ----------
const RE_BLOQUES = /```(criterios|pregunta|estrategia|meta|avance|encargo|plan|campana)\s*\n([\s\S]*?)```/g;
const corta = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
// El texto que se lee (sin bloques, ni uno a medio escribir).
export const textoVisible = (t) => String(t || '').replace(RE_BLOQUES, '').replace(/```(criterios|pregunta|estrategia|meta|avance|encargo|plan|campana)[\s\S]*$/, '').replace(/\n{3,}/g, '\n\n').trim();
// → { criterios: { entregable, cumple: [], falta: [] } | null, pregunta: { texto, por_que, opciones } | null,
//     meta: la propuesta de brújula (leerMeta) | null, avance: { hechas } | null, encargos: [{ area, titulo, por_que, vence }],
//     plan: el parche del plan del mes (limpiarPlan) | null, campanas: [campaña limpia] (máximo 2, mk-campana § 2) }
export function leerTarjetas(t) {
  let criterios = null, pregunta = null, meta = null, avance = null, plan = null; const encargos = [], campanas = [];
  for (const m of String(t || '').matchAll(RE_BLOQUES)) {
    let j; try { j = JSON.parse(m[2]); } catch { continue; }
    if (!j || typeof j !== 'object') continue;
    if (m[1] === 'criterios') {
      const lst = (x) => (Array.isArray(x) ? x : []).map((y) => corta(y, 160)).filter(Boolean).slice(0, 12);
      criterios = { entregable: corta(j.entregable, 80), cumple: lst(j.cumple), falta: lst(j.falta) };
    } else if (m[1] === 'pregunta' && !pregunta && corta(j.texto, 200)) {
      pregunta = { texto: corta(j.texto, 200), por_que: corta(j.por_que, 240), opciones: (Array.isArray(j.opciones) ? j.opciones : []).map((x) => corta(x, 80)).filter(Boolean).slice(0, 4) };
    } else if (m[1] === 'meta' && !meta) meta = leerMeta(j);
    else if (m[1] === 'avance') { const a = leerAvance(j); if (a) avance = { hechas: [...(avance?.hechas || []), ...a.hechas] }; }
    else if (m[1] === 'encargo' && encargos.length < 3) { const e = leerEncargo(j); if (e) encargos.push(e); }
    else if (m[1] === 'plan') { const pl = limpiarPlan(j); if (Object.keys(pl).length) plan = { ...(plan || {}), ...pl }; }
    else if (m[1] === 'campana' && campanas.length < 2) { const c = leerCampana(j); if (c) campanas.push(c); }
  }
  return { criterios, pregunta, meta, avance, encargos, plan, campanas };
}
// Un encargo de Estrategia para otra área. → { area, titulo, por_que, vence } | null
export const AREAS_ENCARGO = { consulting: 'Consulting', marketing: 'Marketing', diseno: 'Diseño' };
// Lo que el modelo puede escribir en vez del valor exacto: se lleva a su área (no se pierde un encargo por una palabra).
const SINONIMOS = [[/^(consult|operac|operat|finanz|money|equipo|margen|bmc)/, 'consulting'], [/^(marketing|mercadeo|plan|campan|evento)/, 'marketing'], [/^(disen|grafic|pieza|creativ)/, 'diseno']];
export const areaEncargo = (v) => { const a = String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); return AREAS_ENCARGO[a] ? a : SINONIMOS.find(([re]) => re.test(a))?.[1] || ''; };
const fechaReal = (s) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return ''; const d = new Date(s + 'T12:00:00Z'); return d.toISOString().slice(0, 10) === s ? s : ''; };
export function leerEncargo(j, hoy = new Date().toISOString().slice(0, 10)) {
  const titulo = corta(j?.titulo, 120); if (!titulo) return null;
  const v = fechaReal(j?.vence);
  // Sin un área que se entienda no se borra en silencio: sale la tarjeta con el aviso y sin botón.
  return { area: areaEncargo(j?.area), titulo, por_que: corta(j?.por_que, 300), vence: v && v >= hoy ? v : '' };
}
// La tarea que deja un encargo al mandarlo: de quien lo manda (la reasigna en Mis tareas), con su área y su cliente,
// para que la pantalla de esa área y su modo del Chat la encuentren. cliente: slug · email: quien lo manda.
export function tareaDeEncargo(e, { cliente, nombre, email }) {
  return {
    title: e.titulo, description: [e.por_que, `Encargo de Estrategia · ${nombre || cliente}.`].filter(Boolean).join('\n\n'),
    status: 'Por empezar', tipo: 'Delivery', dept: { diseno: '⑥A Diseño gráfico', marketing: '③ Marketing' }[e.area] || '', due: e.vence || '',
    // «Solo yo»: la ven quien la manda y a quien se asigna. El porqué es de la estrategia: no lo lee todo el equipo.
    assignee: email, accountable: '', visibility: 'private', viewers: [], checklist: [], comments: [], project_id: '',
    area: e.area, cliente, client_slug: cliente, origen: 'estrategia',
  };
}
// Las tareas de un área y un cliente (los encargos), abiertas primero.
const creada = (t) => String(t._meta?.created_at || t.created_at || '');
export const encargosDe = (tareas, area, cliente) => (tareas || []).filter((t) => t.origen === 'estrategia' && t.area === area && (!cliente || t.cliente === cliente))
  .sort((a, b) => (a.status === 'Hecha') - (b.status === 'Hecha') || creada(b).localeCompare(creada(a)));

// ---------- Las sesiones ----------
// El id de una conversación: «inh-<modo>-<cliente o marca>-<marca de tiempo>». Hermes lo guarda tal cual.
export function idSesion(modo, slug, ahora = Date.now(), azar = Math.random()) {
  const s = String(slug || 'general').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'general';
  return `inh-${modoDe(modo).id}-${s}-${ahora.toString(36)}${Math.floor(azar * 1e6).toString(36)}`;
}
// → { modo, slug } de un id de sesión del LLM (o null si no es nuestra).
// Los modos salen de MODOS: cuando entra un área nueva, sus conversaciones se leen solas.
const RE_SESION = new RegExp(`^inh-(${[...MODOS, MODO_LIBRE].map((m) => m.id).join('|')})-([a-z0-9_-]+)-[a-z0-9]+$`);
export function leerIdSesion(id) {
  const m = RE_SESION.exec(String(id || ''));
  return m ? { modo: m[1], slug: m[2] === 'general' ? '' : m[2] } : null;
}
// El título de una conversación nueva: la primera línea del primer mensaje.
export const tituloDe = (t) => corta(String(t || '').split('\n')[0], 60) || 'Conversación nueva';
// Agrupa por fecha, como la barra de Hermes: Hoy · Ayer · Últimos 7 días · Antes.
export function grupoFecha(ts, ahora = Date.now()) {
  const t = typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(ts || '');
  if (!t) return 'Antes';
  const d0 = new Date(ahora); d0.setHours(0, 0, 0, 0);
  if (t >= d0.getTime()) return 'Hoy';
  if (t >= d0.getTime() - 864e5) return 'Ayer';
  if (t >= d0.getTime() - 7 * 864e5) return 'Últimos 7 días';
  return 'Antes';
}
