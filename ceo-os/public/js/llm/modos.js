// El Inherent LLM: los cuatro modos, uno por área (el harness de cada uno), los criterios de aceptación y los comandos «/».
// Puro: sin DOM ni red (lo prueba scripts/test-llm.mjs). El harness viaja en cada turno a Hermes como system_message,
// encima de su SOUL.md (la identidad de Inherent) y del CLAUDE.md del repo, que Hermes ya lee solo.

// pide: lo que el modo necesita para trabajar (un cliente de Estrategia o de Consulting, una marca de Marcas o nada).
// Los modos son las áreas de areas.js: el switch de áreas del Chat elige el modo.
export const MODOS = [
  { id: 'estrategia', nombre: 'Estrategia', letra: 'S', icono: 'target', sub: 'La estrategia de cada cliente', pide: 'cliente', depto: '① Strategy' },
  { id: 'organizacion', nombre: 'Organización', letra: 'O', icono: 'clipboard', sub: 'Tareas, proyectos, leads y tu día', pide: '', depto: 'Organización' },
  { id: 'diseno', nombre: 'Diseño', letra: 'D', icono: 'edit', sub: 'Plan del mes, ideas y piezas', pide: 'marca', depto: '⑥A Diseño gráfico' },
  { id: 'consulting', nombre: 'Consulting', letra: 'C', icono: 'chart-pie', sub: 'Operaciones, finanzas, márgenes y estructura de un cliente', pide: 'cliente', depto: 'Consulting · Operations OS y Money OS' },
];
export const modoDe = (id) => MODOS.find((m) => m.id === id) || MODOS[0];

// Lo que vale en todos los modos. Sale de inherent/00-PRINCIPIOS.md y CLAUDE.md (resumido; el agente los lee completos).
export const REGLAS_COMUNES = [
  'Antes del primer pedido de trabajo, lee inherent/00-PRINCIPIOS.md y CLAUDE.md de tu carpeta (la copia del repo de Inherent).',
  'Evidencia o etiqueta: un dato sin fuente va como [dice el cliente, sin verificar] o ⚠️ SIN DATOS. Nunca inventes cifras ni nombres.',
  'El alcance contratado (clients/<cliente>/00-onboarding/plan-contratado.md) es el techo. Sin ficha de oferta, no avances con ese cliente: dilo.',
  'Nunca: costos, márgenes ni nada de otro cliente; prometer precio, fecha o alcance; gastar dinero, pautar, publicar ni borrar. Precio, alcance y fechas se escalan al CEO.',
  'El repo NO se edita desde aquí: tu carpeta es una copia que se reinicia sola. Lo que se guarda en el OS va por las herramientas del conector «inherent», y solo cuando la persona lo pide.',
  'Roles, no nombres de personas.',
  'Español de «tú». Corto y humano: lo accionable primero, en pasos cortos. Sin jerga: si un término técnico hace falta, explícalo en una frase.',
];

import { leerMeta, leerAvance } from './brujula.js';

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
      'Lo que la estrategia pide y se ejecuta en otra área (un BMC, un mapa de procesos o los perfiles de puesto en Consulting; una pieza en Diseño) no lo hagas aquí: mándalo como encargo, uno por bloque, al final de la respuesta. La persona lo manda con un botón y queda como tarea:',
      '```encargo',
      '{"area":"consulting","titulo":"Crear el BMC de la empresa","por_que":"una frase: qué decide la estrategia con esto","vence":"AAAA-MM-DD o vacío"}',
      '```',
      'area: consulting (operaciones, finanzas, equipo) o diseno (piezas). Máximo 3 encargos por respuesta.',
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
  diseno: {
    rol: 'Eres ⑥A Diseño gráfico de Inherent: conviertes el plan del mes y las ideas en piezas (carrusel, estático, story) con el sistema visual de la marca.',
    como: [
      'Lee agents/06-graphic-design/brain/WORKFLOW.md y, de la marca, clients/<marca>/02-marca/ (sistema-visual.md y la guía). Valores que se ejecutan, no adjetivos.',
      'Sin estrategia aprobada no hay plan; sin plan no hay ideas; una idea se cuenta en un formato que ya funcionó. La pieza suelta es la única que entra directo.',
      'Si tienes las herramientas de Figma (figwright), diseña en Figma con el kit de la marca y di qué lámina hiciste. Si no las tienes, entrega la especificación lámina por lámina (texto, jerarquía, color del sistema, foto o ilustración).',
      'Valida contra la guía de la marca como lo haría ②B Branding (br-guardian) antes de dar algo por listo.',
    ],
    herramientas: 'Leer el repo; Figma por figwright si está conectado; el conector «inherent» para ver el plan del mes y las ideas de la marca.',
    criterios: ['Usa solo colores, tipografías y activos del sistema visual de la marca', 'Un mensaje por pieza, con hook en la primera lámina y CTA en la última', 'Texto legible en celular', 'Revisa la ficha del formato en inherent/08-CRITERIOS-DE-ACEPTACION.md (carrusel, estático, story)'],
  },
  consulting: {
    rol: 'Eres Consulting de Inherent: trabajas con el CEO el backend de un cliente. Cómo opera (Operations OS: quién decide qué, dónde se traba la entrega, qué depende de una sola persona, el equipo) y si le queda utilidad (Money OS: precio y oferta, margen por línea, costo de adquisición y valor de vida). Trabajas en SOLO LECTURA: lo que escribes es un borrador que el CEO revisa.',
    como: [
      'Lee inherent/02-METODO.md (3 · OPERATIONS OS y 4 · MONEY OS) y la ficha de oferta del cliente antes de proponer.',
      'Operations OS y Money OS son de Growth Partnership. Si el nivel del cliente es otro y su ficha no los incluye, lo que propongas va marcado FUERA DEL ALCANCE y no entra al plan.',
      'Los números son del cliente: trabaja solo con lo que comparte la persona o está en su carpeta, y nunca los mezcles con otro cliente. Sin costos confiables, el margen por línea es teoría: dilo así y marca lo que falta como ⚠️ SIN DATOS.',
      'Si la empresa es el estorbo, más demanda empeora el problema: primero la capacidad.',
      'La estructura corporativa la cubre la auditoría del especialista: propón qué preguntarle, no la resuelvas tú.',
      'Si la persona va a pegar números o datos internos del cliente, recomiéndale responder con la IA de su compu (privado).',
      'Cierra con un primer paso para hoy.',
    ],
    herramientas: 'Leer y buscar en el repo (inherent/ y la carpeta del cliente). El conector «inherent» solo para leer (el cliente y su proyecto de Business Growth); no crees ni cambies nada salvo que la persona lo pida.',
    criterios: ['Parte de dónde está trabado el negocio, con evidencia o etiqueta', 'Cada número viene del cliente o va como ⚠️ SIN DATOS; nada de otro cliente', 'Respeta el nivel contratado: fuera de Growth Partnership, Operations OS y Money OS van FUERA DEL ALCANCE', 'Cada propuesta lleva dueño (rol), primer paso y cómo se mide', 'Termina con un primer paso concreto'],
  },
};

// El mensaje de sistema de un turno: el harness del modo + el contexto que arma el OS (datos, no instrucciones).
// ctx = { persona, puesto, fecha, cliente, carpeta, nivel, extra: [líneas], instrucciones: texto (p. ej. la estrategia en vivo) }
export function sistemaDe(modo, ctx = {}) {
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
  diseno: [['¿Qué piezas del plan del mes faltan por diseñar?', 'Plan del mes'], ['Arma un carrusel con la plantilla de la marca', 'Carrusel'], ['Revisa esta pieza contra la guía de la marca', 'Revisión'], ['Propón 3 portadas para el reel de la semana', 'Ideas']],
  consulting: [['¿Dónde se traba la operación hoy?', 'Operaciones'], ['¿Qué decisiones solo debería tomar el fundador?', 'Estructura'], ['¿Qué línea deja margen y cuál lo desangra?', 'Márgenes'], ['¿Cuánto puede pagar por un cliente sin perder?', 'Finanzas']],
};

// Los temas de Consulting: lo útil para organizar las operaciones, las finanzas y el equipo de un cliente (inherent/02-METODO.md:
// 3 · OPERATIONS OS y 4 · MONEY OS). Cada tema abre el Chat con su pedido. Los usan el panel del modo y la pantalla de Consulting.
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
// ¿Su nivel trae Operations OS y Money OS? Solo Growth Partnership; a la medida, lo que diga su ficha. nivel = { id, nombre } | null
export const alcanceConsulting = (nivel) => (!nivel ? 'sin-ficha' : nivel.id === 'partnership' ? 'si' : nivel.id === 'medida' ? 'ficha' : 'fuera');

// Los comandos «/» de la caja: atajos del OS y las capacidades de Hermes (skills y la Terminal).
export const COMANDOS = [
  ['/estrategia', 'Cambiar al modo Estrategia'],
  ['/organizacion', 'Cambiar al modo Organización'],
  ['/diseno', 'Cambiar al modo Diseño'],
  ['/consulting', 'Cambiar al modo Consulting'],
  ['/nuevo', 'Empezar una conversación nueva'],
  ['/modelo', 'Elegir el modelo que responde'],
  ['/privado', 'Prender o apagar el modo privado (un modelo en tu compu)'],
  ['/ramificar', 'Seguir esta conversación por otro lado, en una nueva'],
  ['/brujula', 'Ver la meta de esta conversación y sus tareas'],
  ['/skill', 'Usar una skill de Hermes (las del repo y las suyas)'],
  ['/terminal', 'Ver los comandos de Hermes en la Terminal'],
];
export function leerComando(t) {
  const m = /^\/([a-zñáéíóúü]+)\s*(.*)$/i.exec(String(t || '').trim()); // con o sin acento: /diseño, /brújula, /organización
  if (!m) return null;
  const cmd = '/' + m[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return COMANDOS.some(([c]) => c === cmd) ? { cmd, arg: m[2].trim() } : null;
}
// Los comandos de la Terminal que hacen funcionar a Hermes (perfil «inherent»): el backend se alimenta desde ahí.
export const TERMINAL = [
  ['Instalar Hermes', 'curl -fsSL https://inherent-work.vercel.app/laya/hermes/instalar.sh | bash'],
  ['Actualizar Hermes (si algo no abre)', 'inherent update'],
  ['Elegir el modelo (suscripción, API o local)', 'inherent model'],
  ['Conectar ChatGPT con tu suscripción', 'inherent auth add openai-codex --browser'],
  ['Conectar Claude', 'inherent auth add anthropic'],
  ['Autorizar el conector de Inherent OS', 'inherent mcp login inherent'],
  ['Modelo local, gratis y privado (con Ollama instalado)', 'ollama pull qwen3-coder:30b'],
  ['Darle al modelo local la memoria que Hermes necesita (64K)', 'inherent config set model.ollama_num_ctx 65536'],
  ['Ver las skills que tiene', 'inherent skills list'],
  ['Revisar que todo esté bien', 'inherent doctor'],
  ['Ver la llave del OS', 'cat ~/.inherent/hermes/api-key'],
];

// Cuánto piensa el modelo antes de responder (Hermes lo manda como reasoning_effort). '' = lo que decida el modelo.
export const ESFUERZOS = [['low', 'Rápido', 'Responde ya; para lo simple'], ['', 'Normal', 'Lo que decida el modelo'], ['high', 'A fondo', 'Piensa más; para estrategia y lo difícil']];
export const nombreEsfuerzo = (k) => (ESFUERZOS.find(([v]) => v === (k || '')) || ESFUERZOS[1])[1];

// ---------- Leer una respuesta ----------
const RE_BLOQUES = /```(criterios|pregunta|estrategia|meta|avance|encargo)\s*\n([\s\S]*?)```/g;
const corta = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
// El texto que se lee (sin bloques, ni uno a medio escribir).
export const textoVisible = (t) => String(t || '').replace(RE_BLOQUES, '').replace(/```(criterios|pregunta|estrategia|meta|avance|encargo)[\s\S]*$/, '').replace(/\n{3,}/g, '\n\n').trim();
// → { criterios: { entregable, cumple: [], falta: [] } | null, pregunta: { texto, por_que, opciones } | null,
//     meta: la propuesta de brújula (leerMeta) | null, avance: { hechas } | null, encargos: [{ area, titulo, por_que, vence }] }
export function leerTarjetas(t) {
  let criterios = null, pregunta = null, meta = null, avance = null; const encargos = [];
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
  }
  return { criterios, pregunta, meta, avance, encargos };
}
// Un encargo de Estrategia para otra área. → { area, titulo, por_que, vence } | null
export const AREAS_ENCARGO = { consulting: 'Consulting', diseno: 'Diseño' };
export function leerEncargo(j) {
  const area = String(j?.area || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), titulo = corta(j?.titulo, 120);
  if (!AREAS_ENCARGO[area] || !titulo) return null;
  const vence = /^\d{4}-\d{2}-\d{2}$/.test(String(j?.vence || '')) ? j.vence : '';
  return { area, titulo, por_que: corta(j?.por_que, 300), vence };
}
// La tarea que deja un encargo al mandarlo: de quien lo manda (la reasigna en Mis tareas), con su área y su cliente,
// para que la pantalla de esa área y su modo del Chat la encuentren. cliente: slug · email: quien lo manda.
export function tareaDeEncargo(e, { cliente, nombre, email }) {
  return {
    title: e.titulo, description: [e.por_que, `Encargo de Estrategia · ${nombre || cliente}.`].filter(Boolean).join('\n\n'),
    status: 'Por empezar', tipo: 'Delivery', dept: e.area === 'diseno' ? '⑥A Diseño gráfico' : '', due: e.vence || '',
    assignee: email, accountable: '', visibility: 'all', viewers: [], checklist: [], comments: [], project_id: '',
    area: e.area, cliente, origen: 'estrategia',
  };
}
// Las tareas de un área y un cliente (los encargos), abiertas primero.
export const encargosDe = (tareas, area, cliente) => (tareas || []).filter((t) => t.area === area && (!cliente || t.cliente === cliente))
  .sort((a, b) => (a.status === 'Hecha') - (b.status === 'Hecha') || String(b.created_at || '').localeCompare(String(a.created_at || '')));

// ---------- Las sesiones ----------
// El id de una conversación: «inh-<modo>-<cliente o marca>-<marca de tiempo>». Hermes lo guarda tal cual.
export function idSesion(modo, slug, ahora = Date.now(), azar = Math.random()) {
  const s = String(slug || 'general').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'general';
  return `inh-${modoDe(modo).id}-${s}-${ahora.toString(36)}${Math.floor(azar * 1e6).toString(36)}`;
}
// → { modo, slug } de un id de sesión del LLM (o null si no es nuestra).
export function leerIdSesion(id) {
  const m = /^inh-(estrategia|organizacion|diseno)-([a-z0-9_-]+)-[a-z0-9]+$/.exec(String(id || ''));
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
