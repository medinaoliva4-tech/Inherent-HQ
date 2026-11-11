// Los 9 departamentos de Inherent dentro del Chat (#/chat): `@estrategia`, `@marketing-creative`, `@produccion`, `@diseno`…
// Diseño aprobado: code-os/docs/diseno-departamentos.md · agents/README.md (9 agentes, 31 skills) · PLAN-GATEWAY §20 (F4.5).
//
// Un departamento en el Chat es una conversación con su orquestador (la skill de agents/<NN>-<área>/brain/skills/<orquestador>):
//   · corre en el motor Code (el puente del VPS, chat-code.js) con su propia sesión y sus lineamientos como systemPrompt;
//   · el modelo sale de los niveles (nivel-alto / medio / bajo) con el router por tarea (nivelDe), o el que la persona fijó;
//   · las preguntas del agente van en el Chat (el bloque ```pregunta``` de siempre, F4.5 §3);
//   · pasar el resultado a otro departamento es un gate: la persona lo lee y lo pasa ella (bloque ```pasar```, puedePasar).
// Puro: sin DOM ni red (lo prueba scripts/test-departamentos.mjs). harness/agentes.js deriva de aquí la lista del repo.
import { rutear } from './router-code.js';

const N = (n, id, carpeta) => ({ n, id, carpeta: `agents/${n}-${carpeta}/` });

// arroba: el nombre con el que se llama en el Chat. alias: otras formas que también entiende (sin acentos, minúsculas).
// modo: el modo del Chat que ya trabaja ese terreno (llm/modos.js); '' = ninguno. nivel: el de partida (lo ajusta nivelDe).
export const DEPARTAMENTOS = [
  { ...N('00', 'account', 'account'), arroba: 'account', alias: ['cuenta', 'secretaria'], nombre: 'Account Manager', depto: 'Cuenta',
    orquestador: '', skills: [], modo: '', nivel: 'nivel-medio', ventana: 'Siempre encendido',
    hace: 'El único agente que habla con el cliente (WhatsApp): sostiene la relación y escala precio, alcance y fechas.',
    como: ['Lee agents/00-account/brain/WORKFLOW.md completo antes de redactar.', 'En el Chat solo REDACTAS borradores de mensajes al cliente: nunca los envías tú.', 'Precio, alcance y fechas se escalan al CEO; lo demás al COO. Nunca costos, márgenes ni nada de otro cliente.'],
    criterios: ['Suena como la secretaria de Inherent: de tú, corto y humano', 'No compromete precio, fecha ni alcance', 'Lo que no puede resolver queda escalado al rol correcto'] },
  { ...N('01', 'strategy', 'strategy'), arroba: 'estrategia', alias: ['strategy', 'st'], nombre: 'Strategy', depto: '① Strategy',
    orquestador: 'strategy', skills: ['st-producto-icp', 'st-dolores-historia', 'st-panel-icp', 'st-adquisicion'], modo: 'estrategia', nivel: 'nivel-alto', ventana: 'Días 1 a 3 · revisión del 20',
    hace: 'La madre de todo: producto, cliente ideal (ICP), dolores e historia, y adquisición. El CEO aprueba antes de que salga.',
    como: ['Orden fijo: producto → ICP → dolores, deseos, entrevistas e historia villano-héroe → adquisición (calculadora outbound e inbound) → brief de comunicación.', 'Lo que sale del panel sintético del ICP (st-panel-icp) va siempre como [hipótesis].', 'La calculadora outbound debe dar el caso de referencia exacto (m=5, c=1 %, P=95 %, 4 semanas → 913 · 229 · 46).', 'Para citar a Hormozi usa la biblioteca del OS: ceo-os/data/hormozi (README.md e INDEX.md), con la referencia exacta.'],
    criterios: ['Todo traza al ICP', 'Cada número viene del cliente, de una fuente o va como ⚠️ SIN DATOS', 'Respeta el nivel contratado: lo demás va FUERA DEL ALCANCE', 'Termina en el gate del CEO: nada sale sin su OK'],
    gate: 'El CEO aprueba la estrategia antes de pasarla a cualquier departamento.' },
  { ...N('02', 'branding', 'branding'), arroba: 'branding', alias: ['marca', 'br'], nombre: 'Branding', depto: '② Branding',
    orquestador: 'branding', skills: ['br-territorio-voz', 'br-sistema', 'br-guardian'], modo: 'diseno', nivel: 'nivel-medio', ventana: 'Días 3 a 6 · valida del 16 al 19',
    hace: 'Territorio, voz y sistema visual de la marca; br-guardian valida piezas y claims con la regla escrita.',
    como: ['Parte del ICP, el villano y el posicionamiento aprobados de ① Strategy: sin eso, dilo y no inventes.', 'Valores ejecutables (hex, peso, tamaño, safe zones), no adjetivos.', 'Al validar, devuelve con la regla escrita, nunca con opinión.'],
    criterios: ['Cada decisión de marca cita su regla o su fuente', 'El sistema visual se puede ejecutar sin preguntar', 'Los claims dudosos quedan marcados para validar'] },
  { ...N('03', 'marketing-creative', 'marketing-creative'), arroba: 'marketing-creative', alias: ['marketing', 'creative', 'creativo', 'creatividad', 'mc'], nombre: 'Marketing y Creative', depto: '③ Marketing y Creative',
    orquestador: 'marketing-creative', skills: ['mc-radar', 'mc-pilares-angulos', 'mc-campanas-piezas'], modo: 'marketing', nivel: 'nivel-medio', ventana: 'Días 1 a 3',
    hace: 'Radar con sentido, tablero pilares × ángulos y campañas atadas al resultado esperado, con copy íntegro, ideas y piezas.',
    como: ['Sin el brief de comunicación de ① Strategy no arranca el ciclo: dilo.', 'Todo traza al ICP: pieza → campaña → pilar y ángulo → dolor, deseo u oferta → ICP.', 'Hooks literales (7 cajas, por nivel de conciencia), guion por tramo, copy, CTA, escenas y formato: listo para ④ Producción y ⑤ Diseño gráfico.', 'Del radar: winners adaptables y contenido quemado, con su enlace.'],
    criterios: ['Cada pieza traza a un pilar, un ángulo y al ICP', 'El copy está íntegro, no resumido', 'Respeta el alcance: piezas y canales de la ficha'] },
  { ...N('04', 'production', 'production'), arroba: 'produccion', alias: ['production', 'produccion', 'edicion', 'video', 'pr'], nombre: 'Producción', depto: '④ Producción',
    orquestador: 'produccion', skills: ['pr-pre', 'pr-post'], modo: 'produccion', nivel: 'nivel-medio', ventana: 'Días 3 a 15',
    hace: 'Pre (jornada, guiones, shot list, permisos, compras) en hoja imprimible y Post (primer corte por agente, derivadas, export).',
    como: ['El día 11 es el último para grabar; después se monta con lo que hay.', 'La hoja de Pre se imprime y se escribe encima: tablas claras, sin adornos.', 'Si el presupuesto pasa la referencia del onboarding, se escala al CEO y se sigue. Nunca tarifas de Inherent.'],
    criterios: ['Hook en los primeros 3 segundos', 'Cada escena lleva el id de su pieza', 'Nada se graba después del día 11 sin el OK del CEO'] },
  { ...N('05', 'graphic-design', 'graphic-design'), arroba: 'diseno', alias: ['diseño', 'graphic-design', 'design', 'gd'], nombre: 'Diseño gráfico', depto: '⑤ Diseño gráfico',
    orquestador: 'graphic-design', skills: ['gd-figma', 'gd-assets'], modo: 'diseno', nivel: 'nivel-medio', ventana: 'Días 12 a 19',
    hace: 'Borradores de carruseles, posts y stories en Figma sobre las plantillas; assets con IA solo con el OK del costo.',
    como: ['Copy literal de ③ Marketing y Creative; nada de reescribirlo.', 'Si tienes Figma (Figwright), diseña sobre las plantillas del cliente; si no, entrega la especificación lámina por lámina.', 'gd-assets: muestra el costo y pide el OK antes de generar una imagen.'],
    criterios: ['Jerarquía, un foco, un acento y safe zones', 'La slide 1 se entiende sola', 'Solo colores, tipografías y activos del sistema visual'] },
  { ...N('06', 'community', 'community'), arroba: 'community', alias: ['comunidad', 'cm'], nombre: 'Community', depto: '⑥ Community',
    orquestador: 'community', skills: ['cm-triage', 'cm-respuesta'], modo: '', nivel: 'nivel-bajo', ventana: 'Cada 2 horas en horario del cliente',
    hace: 'Clasifica comentarios y DMs en una sola caja y responde con la ficha, la voz y el cierre que lleva a pedir.',
    como: ['Primero clasifica (cm-triage), después escribe (cm-respuesta).', 'Si el dato no está en la ficha de respuestas, no lo inventes: escálalo.', 'En el Chat solo redactas: el envío por Zernio lo hace la corrida programada.'],
    criterios: ['Cada mensaje cae en una sola caja', 'La respuesta cierra con pedir, reservar o escribir', 'Lo escalado dice a quién y por qué'] },
  { ...N('07', 'posting', 'posting'), arroba: 'posting', alias: ['publicar', 'po'], nombre: 'Posting', depto: '⑦ Posting',
    orquestador: 'posting', skills: ['po-caption', 'po-carga'], modo: '', nivel: 'nivel-bajo', ventana: 'Días 16 a 19',
    hace: 'Captions finales, hashtags y alt text por plataforma, QA de specs, hora y cuenta, programación y verificación.',
    como: ['El copy de ③ Marketing y Creative no cambia de mensaje: solo se adapta al largo de cada plataforma.', 'En el Chat no programas ni publicas: dejas el paquete listo y lo dices.'],
    criterios: ['Hook antes del corte de la plataforma', 'Cada archivo cumple su spec', 'Cuenta y hora explícitas, sin pisarse'] },
  { ...N('08', 'ads', 'ads'), arroba: 'ads', alias: ['pauta', 'ad'], nombre: 'Ads', depto: '⑧ Ads',
    orquestador: 'ads', skills: ['ad-plan', 'ad-corrida'], modo: '', nivel: 'nivel-alto', ventana: 'Desde el día 1 del mes siguiente',
    hace: 'Plan de pauta hasta el GATE 1 del CEO, lanzamiento, optimización con GATE 2 en todo movimiento de presupuesto y atribución.',
    como: ['El presupuesto sale de la calculadora inbound de ① Strategy.', 'Nunca escribes en una cuenta de anuncios desde el Chat: propones y el CEO aprueba.', 'Un cambio a la vez, y nada sin datos suficientes.'],
    criterios: ['Objetivo en una métrica', '3+ variantes de hook con claims validados', 'Todo movimiento de presupuesto pasa por el CEO'],
    gate: 'El CEO aprueba el plan y el presupuesto (GATE 1) y cada cambio de presupuesto (GATE 2).' },
];

const plano = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const departamentoDe = (id) => {
  const k = plano(id).replace(/^@/, '');
  return DEPARTAMENTOS.find((d) => d.id === k || d.arroba === k || d.alias.includes(k)) || null;
};

/** «@marketing-creative arma la campaña» → { dep, resto }; null si no empieza con un departamento (un correo o una @cuenta no lo son). */
export function leerDepartamento(texto) {
  const t = String(texto || '').trim(); const m = /^@([^\s]+)\s*([\s\S]*)$/.exec(t); if (!m) return null;
  const dep = departamentoDe(m[1].replace(/[.,:;!?]+$/, '')); return dep ? { dep, resto: m[2].trim() } : null;
}

/** El menú de «@»: departamentos cuyo nombre empieza con lo escrito (o todos con «@»). */
export function menuDepartamentos(v) {
  const q = plano(String(v || '').trim().replace(/^@/, ''));
  return DEPARTAMENTOS.filter((d) => !q || [d.arroba, d.nombre, ...d.alias].some((x) => plano(x).startsWith(q) || plano(x).replace(/[^a-z0-9]/g, '').startsWith(q.replace(/[^a-z0-9]/g, ''))));
}

// ---------- El modelo: niveles y el router por tarea ----------
// El router de Code (router-code.js) decide en lo técnico y en la revisión (otro nivel distinto al que construyó). Encima,
// cada departamento sube o baja según lo que se pide: decidir y lo que tiene gate del CEO, arriba; lo mecánico, abajo.
const ALTO = /\b(estrategia|icp|cliente ideal|posicionamiento|oferta|precio|adquisici[oó]n|calculadora|presupuesto|plan de pauta|campa[ñn]a del mes|territorio|guion maestro|decid|prioriza|diagn[oó]stic)/i;
const BAJO = /\b(hashtags?|alt text|caption|formatea|resume|resumen corto|traduce|corrige ortograf|renombra|lista|clasifica|etiqueta|specs?)\b/i;
const NIVELES = ['nivel-bajo', 'nivel-medio', 'nivel-alto'];
export function nivelDe(dep, texto = '', { fijo = '', ultimo = '' } = {}) {
  if (fijo && fijo !== 'auto' && NIVELES.includes(fijo)) return { nivel: fijo, motivo: 'Fijado por ti' };
  const d = typeof dep === 'string' ? departamentoDe(dep) : dep;
  const r = rutear(texto, { ultimo });
  if (/revisi[oó]n/i.test(r.motivo)) return { nivel: r.nivel, motivo: r.motivo };
  if (r.cocinero === 'chef') return { nivel: 'nivel-alto', motivo: r.motivo };
  if (d?.gate || ALTO.test(texto)) return { nivel: 'nivel-alto', motivo: d?.gate ? 'Lleva gate del CEO: nunca barato' : 'Decidir cuesta más que escribir' };
  if (BAJO.test(texto)) return { nivel: 'nivel-bajo', motivo: 'Tarea mecánica' };
  return { nivel: d?.nivel || 'nivel-medio', motivo: `El de partida de ${d?.nombre || 'este departamento'}` };
}

// ---------- Pasar a otro departamento: el gate (F4.5 §20.7) ----------
// El agente PROPONE con ```pasar {"a":"marketing-creative","que":"arma la campaña con este brief","resumen":"…"}```;
// la persona lee y lo pasa ella. Nunca se encadena solo.
export function leerPase(texto) {
  const m = /```pasar\s*\n([\s\S]*?)```/.exec(String(texto || '')); if (!m) return null;
  let j; try { j = JSON.parse(m[1]); } catch { return null; }
  const a = departamentoDe(j?.a); if (!a) return null;
  return { a: a.id, que: String(j.que || '').trim().slice(0, 600), resumen: String(j.resumen || '').trim().slice(0, 2000) };
}
/** ¿Se puede pasar? → null si sí; si no, el motivo en una frase. El CEO aprueba lo que sale de Strategy y lo que entra a Ads. */
export function puedePasar({ de, a, leido = false, rol = '' }) {
  const d = departamentoDe(de), b = departamentoDe(a);
  if (!b) return 'Ese departamento no existe';
  if (d && d.id === b.id) return 'Ya estás en ese departamento';
  if (!leido) return 'Abre y lee el resultado antes de pasarlo';
  if ((d?.id === 'strategy' || b.id === 'ads') && rol !== 'ceo') return 'Este paso lo aprueba el CEO';
  return null;
}
/** El texto que queda en la caja del Chat al pasar (la persona lo revisa y lo envía). */
export const textoPase = (p, deId) => {
  const a = departamentoDe(p.a), d = departamentoDe(deId);
  return `@${a.arroba} ${p.que || 'Sigue con esto'}\n\nViene de ${d ? d.depto : 'el Chat'} (leído y aprobado por una persona)${p.resumen ? `:\n${p.resumen}` : '.'}`.trim();
};

// ---------- Los lineamientos (systemPrompt de la sesión del puente, máx. 8000) ----------
const COMUNES = [
  'Lee inherent/00-PRINCIPIOS.md y CLAUDE.md antes del primer pedido. El alcance contratado (clients/<cliente>/00-onboarding/plan-contratado.md) es el techo; sin ficha de oferta, no avances con ese cliente: dilo.',
  'Evidencia o etiqueta: un dato sin fuente va como [hipótesis], [dice el cliente, sin verificar] o ⚠️ SIN DATOS. Nunca inventes cifras ni nombres.',
  'Nunca: costos o márgenes de Inherent (inherent/06-ECONOMIA.md), nada de otro cliente, prometer precio, fecha o alcance, gastar, publicar, pautar ni borrar.',
  'Español de tú, corto y humano. Lo accionable primero.',
];
const F45 = [
  'Si te falta un dato que solo la persona tiene, pregúntalo AQUÍ en el Chat (máximo una pregunta por respuesta) con el bloque al final:',
  '```pregunta\n{"texto":"¿…?","por_que":"una frase","opciones":["…","…"]}\n```',
  'No sigas con supuestos donde el flujo pide la respuesta de la persona.',
  'Cuando tu entregable esté listo para otro departamento, NO lo pases tú: propónlo con el bloque al final y la persona lo lee y lo pasa:',
  '```pasar\n{"a":"<departamento>","que":"qué tiene que hacer","resumen":"lo que le entregas, íntegro o con su ruta"}\n```',
  `Departamentos: ${DEPARTAMENTOS.map((d) => `${d.arroba} (${d.depto})`).join(' · ')}.`,
];
export function sistemaDepartamento(dep, ctx = {}) {
  const d = typeof dep === 'string' ? departamentoDe(dep) : dep; if (!d) return '';
  const skills = [d.orquestador, ...d.skills].filter(Boolean);
  const out = [
    `INHERENT · ${d.depto.toUpperCase()} EN EL CHAT DEL OS`,
    `Eres el orquestador de ${d.depto} de Inherent: ${d.hace}`,
    `Tu método: ${d.carpeta}brain/WORKFLOW.md${skills.length ? ` y las skills ${skills.join(', ')} (${d.carpeta}brain/skills/<skill>/SKILL.md; las comunes recepcion y resultados en agents/_comun/skills/)` : ''}. Léelos antes de trabajar; si algo no está ahí, no lo hagas.`,
    ...(d.gate ? [`GATE: ${d.gate}`] : []),
    '', 'REGLAS:', ...COMUNES.map((x) => `- ${x}`),
    '', 'CÓMO TRABAJAS AQUÍ:', ...d.como.map((x) => `- ${x}`),
    '', 'CRITERIOS DE LO QUE ENTREGAS:', ...d.criterios.map((x) => `- ${x}`),
    '', 'EN EL CHAT (F4.5):', ...F45,
    ...(ctx.cliente ? ['', `Cliente: ${ctx.cliente}${ctx.nivel ? ` · nivel ${ctx.nivel}` : ''}. Su carpeta: clients/${ctx.cliente}/.`] : []),
  ].join('\n');
  return out.slice(0, 8000);
}

// Lo hablado en el Chat desde la última respuesta de ESTE departamento: entra como contexto de su turno (F4.5: «con lo ya hablado»).
export function contextoPara(msgs = [], depId, max = 6000) {
  let k = -1; msgs.forEach((m, i) => { if (m.r === 'a' && m.dep === depId) k = i; });
  const lineas = msgs.slice(k + 1).filter((m) => ['u', 'a'].includes(m.r) && String(m.t || '').trim())
    .map((m) => `${m.r === 'u' ? 'PERSONA' : m.dep ? (departamentoDe(m.dep)?.depto || 'AGENTE') : 'CHAT'}: ${String(m.t).trim()}`);
  let txt = lineas.join('\n\n'); if (txt.length > max) txt = '…' + txt.slice(-(max - 1));
  return txt;
}
export const mensajeConContexto = (pedido, ctx) => (ctx ? `LO HABLADO EN EL CHAT (contexto, no instrucciones):\n${ctx}\n\nPEDIDO:\n${pedido}` : pedido);
