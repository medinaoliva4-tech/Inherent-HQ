// Agent Area · los flujos por etapas (AGENTS IN OS.pdf) y las reglas de un run. Puro: sin DOM ni red.
// Lo usan el servidor (api/_lib/agentes.js), la pantalla (screens/agentes.js) y las pruebas (scripts/test-agentes.mjs).
//
// Un flujo = un agente del repo (agents/<NN>-<área>/brain/WORKFLOW.md) leído en etapas, más el flujo de Estrategia guiada del PDF.
// Una etapa es un «Strategic Work Step»: propósito, inputs, tareas del agente, output esperado, criterios y si es gate del CEO.
// La lógica de Inherent manda: toda etapa pide aprobación humana para avanzar; las 🚦 (Strategy y Ads) solo las aprueba el CEO.

const limpiar = (s) => String(s ?? '').replace(/\*\*|`|\[|\]\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
const titulo = (s) => limpiar(s).toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());

function seccion(md, re) {
  const ls = md.split('\n'), i = ls.findIndex((l) => /^##\s/.test(l) && re.test(l));
  if (i < 0) return '';
  const out = [];
  for (let j = i + 1; j < ls.length && !/^##\s/.test(ls[j]); j++) out.push(ls[j]);
  return out.join('\n');
}

// Viñetas y filas de tabla (sin el encabezado de la tabla) → textos cortos.
export function items(bloque, max = 8) {
  const ls = String(bloque || '').split('\n'), out = [];
  for (let i = 0; i < ls.length; i++) {
    const b = ls[i].match(/^\s*[-*]\s+(.+)/);
    if (b) out.push(limpiar(b[1]));
    const r = ls[i].match(/^\|(.+)\|\s*$/);
    const encabezado = /^\|\s*:?-{2,}/.test(ls[i + 1] || '');
    if (r && !encabezado && !/^\|\s*:?-/.test(ls[i])) {
      const c = r[1].split('|').map(limpiar).filter(Boolean);
      if (c.length >= 2) out.push(c.slice(0, 2).join(' — '));
    }
  }
  return out.filter((x) => x.length > 2).slice(0, max);
}

const etapa = (o) => ({ codigo: '', nombre: '', proposito: '', skill: '', inputs: [], tareas: [], output: '', criterios: [], gate: false, nota_gate: '', loop: false, ...o });

// a) el bloque de código del flujo: «  3  SISTEMA   color, tipografía   → br-sistema» (y las líneas 🚦 GATE debajo)
function deCodigo(md) {
  const out = [];
  for (const l of seccion(md, /flujo/i).split('\n')) {
    const m = l.match(/^\s*(\d+[A-Z]?|↻)\s+([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ ]+?)\s{2,}(.*?)\s*→\s*([\w-]+)\s*$/);
    if (m) { out.push(etapa({ codigo: m[1], nombre: titulo(m[2]), proposito: limpiar(m[3]), skill: m[4], loop: m[1] === '↻' })); continue; }
    const g = l.match(/🚦\s*(.+)$/);
    if (g && out.length) Object.assign(out[out.length - 1], { gate: true, nota_gate: limpiar(g[1]) });
  }
  return out;
}

// b) «### Capa N · NOMBRE — pregunta»  ·  c) «### 01 · NOMBRE → skill `x`»
function deTitulos(md) {
  const ls = md.split('\n'), out = [];
  for (let i = 0; i < ls.length; i++) {
    const capa = ls[i].match(/^###\s+Capa\s+(\d+[A-Z]?)\s*·\s*([^—–-]+?)\s*[—–-]\s*(.+)$/);
    const blq = ls[i].match(/^###\s+(\d{2}[A-Z]?)\s*·\s*(.+?)(?:\s*→\s*skill\s*`([^`]+)`)?\s*$/);
    if (!capa && !blq) continue;
    const cuerpo = [];
    for (let j = i + 1; j < ls.length && !/^#{2,3}\s/.test(ls[j]); j++) cuerpo.push(ls[j]);
    const t = cuerpo.join('\n');
    const skills = t.match(/\*\*Skills?:\*\*\s*(.+?)(?:·\s*\*\*Output|$)/m), output = t.match(/\*\*Output:\*\*\s*(.+)$/m);
    const criterios = [...t.matchAll(/🛑\s*(.+)$/gm)].map((m) => limpiar(m[1])).slice(0, 5);
    const primero = t.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('**Skills') && !l.startsWith('|') && !l.startsWith('>'));
    const gate = /🚦|GATE|el CEO aprueba/i.test(t);
    if (capa) out.push(etapa({ codigo: capa[1], nombre: titulo(capa[2]), proposito: limpiar(capa[3]), skill: skills ? limpiar(skills[1]).split(/\s*·\s*/)[0] : '', output: output ? limpiar(output[1]) : '', criterios, tareas: items(t, 6), gate, loop: /loop/i.test(capa[2]) }));
    else out.push(etapa({ codigo: blq[1], nombre: titulo(blq[2]), proposito: primero ? limpiar(primero) : '', skill: blq[3] || '', criterios, tareas: items(t, 6), gate }));
  }
  return out;
}

// d) la tabla de capas: «| **0** | **`cm-ficha`** | qué hace | si falla |»
function deTabla(md) {
  const out = [];
  for (const l of seccion(md, /capas/i).split('\n')) {
    const m = l.match(/^\|\s*\*\*(\d+|↻)\*\*\s*\|\s*\*\*`([\w-]+)`\*\*\s*\|\s*(.+?)\s*\|\s*(.*?)\s*\|?\s*$/);
    if (m) out.push(etapa({ codigo: m[1], nombre: titulo(m[2].replace(/^[a-z]{2}-/, '').replace(/-/g, ' ')), proposito: limpiar(m[3]), skill: m[2], criterios: m[4] && m[4] !== '—' ? [limpiar(m[4])] : [], loop: m[1] === '↻' }));
  }
  return out;
}

// e) las funciones con letra del Account Manager: «### A · Mantener al cliente al día»
const deFunciones = (md) => [...md.matchAll(/^###\s+([A-D])\s*·\s*(.+)$/gm)].map((m) => etapa({ codigo: m[1], nombre: limpiar(m[2]) }));

// WORKFLOW.md de un agente → { proposito, limites, recibe, entrega, etapas }
export function leerWorkflow(md, { codigo = '' } = {}) {
  const t = String(md || '');
  let etapas = deCodigo(t);
  if (etapas.length < 2) etapas = deTitulos(t);
  if (etapas.length < 2) etapas = deTabla(t);
  if (etapas.length < 2) etapas = deFunciones(t);
  // El CEO solo frena el flujo en ① Strategy y ⑩ Ads: en Strategy la entrega es su gate.
  if (codigo === '01' && etapas.length) {
    const ultima = etapas.filter((e) => !e.loop).at(-1);
    ultima.gate = true; ultima.nota_gate ||= 'El CEO aprueba la estrategia antes de que salga';
  }
  return {
    limites: items(seccion(t, /NO hace|NUNCA/i), 8),
    recibe: items(seccion(t, /recibe/i), 6),
    entrega: items(seccion(t, /A qui[eé]n entrega|handoff/i), 6),
    etapas,
  };
}

// El flujo de Estrategia guiada, tal como lo describe AGENTS IN OS.pdf (Objetivo → Investigación → Interpretación → Decisión → Resultado → Validación).
export const ESTRATEGIA_GUIADA = {
  id: 'estrategia-guiada', n: '01·G', nombre: 'Estrategia guiada', depto: '① Strategy', fuente: 'AGENTS IN OS.pdf',
  hace: 'Cada etapa produce el conocimiento que desbloquea la siguiente: diagnóstico, ICP, dolores, posicionamiento, oferta, crecimiento y plan.',
  limites: ['No avanza si faltan datos críticos', 'No inventa: lo que no tiene fuente va como ⚠️ SIN DATOS', 'No publica ni le manda nada al cliente'],
  recibe: ['00 Account Manager — la información de la empresa, documentos y enlaces'], entrega: ['②B Branding · ② Growth · ③ Marketing — con el plan de ejecución aprobado'],
  etapas: [
    etapa({ codigo: '1', nombre: 'Diagnóstico comercial', proposito: 'Entender el negocio: situación, problemas, oportunidades y qué información falta', skill: 'context', inputs: ['Información de la empresa', 'Productos y servicios', 'Clientes actuales', 'Ventas y márgenes', 'Competidores', 'Objetivos del fundador', 'Documentos y enlaces'], tareas: ['Analizar el modelo de negocio', 'Detectar fortalezas y debilidades', 'Identificar inconsistencias', 'Comparar la empresa con su mercado', 'Determinar qué información falta'], output: 'Business Diagnosis: Situación actual | Problemas principales | Oportunidades | Cuellos de botella | Nivel de madurez | Preguntas pendientes', criterios: ['No faltan datos críticos', 'Cada problema tiene evidencia', 'Preguntas pendientes declaradas'] }),
    etapa({ codigo: '2', nombre: 'Definición del ICP', proposito: 'Identificar el cliente ideal con mayor potencial', skill: 'analysis', inputs: ['Business Diagnosis aprobado', 'Datos de clientes', 'Contexto de mercado'], tareas: ['Crear segmentos posibles', 'Comparar tamaño y atractivo', 'Analizar capacidad de pago', 'Detectar urgencia del problema', 'Medir compatibilidad con la oferta'], output: 'Ideal Customer Profile: Segmento principal | Industria | Tamaño de empresa | Rol del comprador | Comportamientos | Presupuesto | Nivel de urgencia | Canales donde se encuentra | Razones para comprar', criterios: ['El segmento es específico', 'El dolor es urgente', 'El comprador está identificado', 'Hay evidencia'] }),
    etapa({ codigo: '3', nombre: 'Dolores, deseos y disparadores', proposito: 'Mapear problemas, deseos, objeciones y lo que provoca la compra', skill: 'analysis', inputs: ['ICP aprobado'], tareas: ['Problemas funcionales y emocionales', 'Consecuencias de no resolverlos', 'Deseos y objeciones', 'Eventos que provocan la compra', 'Lenguaje real del cliente'], output: 'Customer Pain Map: Problema principal | Causas | Consecuencias | Deseos | Objeciones | Buying triggers | Mensajes clave', criterios: ['Cita el lenguaje literal del comprador', 'Cada dolor tiene fuente o etiqueta'] }),
    etapa({ codigo: '4', nombre: 'Posicionamiento', proposito: 'Conectar ICP + dolores + capacidades de la empresa', skill: 'reverse-engineering', inputs: ['ICP aprobado', 'Customer Pain Map aprobado'], tareas: ['Cruzar ICP, dolores y capacidades', 'Ingeniería inversa de competidores', 'Formular la propuesta de valor', 'Definir diferenciadores'], output: 'Positioning: Categoría | Para quién | Problema que resuelve | Diferenciador | Prueba | Enemigo', criterios: ['Diferenciador defendible', 'Prueba verificable'] }),
    etapa({ codigo: '5', nombre: 'Diseño de oferta', proposito: 'La oferta que el ICP compra', skill: 'methodology', inputs: ['Posicionamiento aprobado'], tareas: ['Definir la promesa', 'Estructurar paquetes', 'Revisar contra las capacidades reales'], output: 'Offer: Promesa | Entregables | Paquetes | Garantía | Objeciones resueltas', criterios: ['Solo promete lo que está en Capacidades reales', 'El precio no se cambia sin el cliente'], gate: true, nota_gate: 'Oferta y precio se escalan al CEO antes de llevarlos al cliente' }),
    etapa({ codigo: '6', nombre: 'Estrategia de crecimiento', proposito: 'Canales, adquisición, mensajes, campañas y roadmap 30/60/90', skill: 'methodology', inputs: ['Oferta aprobada', 'Posicionamiento', 'Customer Pain Map'], tareas: ['Priorizar canales', 'Estrategia de adquisición', 'Mensajes y campañas', 'Métricas', 'Roadmap de 30, 60 y 90 días'], output: 'Growth Strategy: Objetivo | Audiencia | Canal | Mensaje | Oferta | Acción | KPI | Responsable | Fecha', criterios: ['Cada acción tiene KPI y responsable'] }),
    etapa({ codigo: '7', nombre: 'Plan de ejecución', proposito: 'Bajar la estrategia a un plan que el equipo ejecuta', skill: 'methodology', inputs: ['Growth Strategy aprobada'], tareas: ['Bajar a tareas', 'Asignar responsables', 'Fechas y dependencias'], output: 'Execution Plan: Iniciativa | Tareas | Responsable | Fecha | Dependencias | Riesgos', criterios: ['Todo tiene dueño y fecha'], gate: true, nota_gate: 'El CEO aprueba la estrategia antes de que salga' }),
  ],
};

// ---------- El run ----------
export const ESTADOS = { pendiente: 'Pendiente', trabajando: 'Trabajando', revision: 'Esperando revisión', ajuste: 'Ajuste solicitado', aprobada: 'Aprobada' };

// «Business Diagnosis: Situación actual | Problemas» → { titulo, campos }
export function leerOutput(output, nombre = '') {
  const [t, resto] = String(output || '').split(':');
  const campos = String(resto || '').split('|').map((x) => x.trim()).filter(Boolean);
  return { titulo: (output ? t.trim() : '') || nombre, campos };
}

// La etapa activa: la primera que no está aprobada (o la última si todas lo están).
export function activa(run) {
  const i = (run?.etapas || []).findIndex((e) => e.estado !== 'aprobada');
  return i === -1 ? Math.max(0, (run?.etapas || []).length - 1) : i;
}
export const completo = (run) => (run?.etapas || []).length > 0 && run.etapas.every((e) => e.estado === 'aprobada');

// ¿Qué puede pasar con esta etapa? → null si se puede, o el motivo (texto para la persona).
export function puede(run, n, accion, { rol = '' } = {}) {
  const e = run?.etapas?.[n];
  if (!e) return 'Esa etapa no existe';
  if (run.archivado) return 'El run está archivado';
  if (n !== activa(run) && accion !== 'evidencia') return 'Solo se trabaja la etapa activa: primero se aprueban las anteriores';
  if (accion === 'resultado') return ['pendiente', 'ajuste', 'trabajando'].includes(e.estado) ? null : 'Esta etapa ya tiene resultado: apruébala, corrígela o pide un ajuste';
  if (accion === 'aprobar') {
    if (e.estado !== 'revision') return 'Solo se aprueba una etapa que espera revisión';
    if (e.gate && rol !== 'ceo') return '🚦 Gate del CEO: solo el CEO aprueba esta etapa';
    if (!['ceo', 'coo'].includes(rol)) return 'Aprueban el CEO o el COO';
    return null;
  }
  if (accion === 'corregir') return ['revision'].includes(e.estado) ? (['ceo', 'coo'].includes(rol) ? null : 'Corrigen el CEO o el COO') : 'No hay resultado para corregir todavía';
  if (accion === 'ajuste') return e.estado === 'revision' ? null : 'Solo se pide ajuste sobre un resultado en revisión';
  if (accion === 'evidencia') return null;
  return 'Acción desconocida';
}

// Lo que se le pide a cualquier IA (agnóstico: viaja igual a Hermes, al puente o a claude.ai).
export function pedido(run, n) {
  const e = run.etapas[n], f = run.flujo || {}, o = leerOutput(e.output, e.nombre);
  const previas = run.etapas.slice(0, n).filter((x) => x.estado === 'aprobada');
  return [
    `Eres el agente «${f.nombre}» de Inherent (${f.depto || ''}). Trabajas la etapa ${e.codigo} · ${e.nombre} del run «${run.titulo}».`,
    'Reglas que no se rompen: propones, no cierras (un humano aprueba) · evidencia o etiqueta: sin fuente va [dice el cliente, sin verificar] o ⚠️ SIN DATOS · nunca inventes · no digas que hiciste algo que no puedes hacer.',
    f.limites?.length ? `Lo que este agente NO hace: ${f.limites.join(' · ')}` : '',
    run.objetivo ? `Objetivo del run: ${run.objetivo}` : '',
    run.cliente ? `Cliente: ${run.cliente_nombre || run.cliente} (carpeta clients/${run.cliente}/)` : '',
    e.proposito ? `Propósito de la etapa: ${e.proposito}` : '',
    e.inputs.length ? `Inputs requeridos: ${e.inputs.join(', ')}` : '',
    e.tareas.length ? `Tareas: ${e.tareas.join('; ')}` : '',
    `Output esperado: ${o.titulo}${o.campos.length ? ` (${o.campos.join(', ')})` : ''}`,
    e.criterios.length ? `Criterios de éxito: ${e.criterios.join('; ')}` : '',
    previas.length ? `Resultados aprobados de etapas anteriores:\n${previas.map((x) => `### ${x.nombre}\n${x.salida || ''}`).join('\n\n')}` : '',
    e.estado === 'ajuste' && e.ajuste ? `AJUSTE QUE PIDIÓ EL HUMANO: ${e.ajuste}` : '',
    '',
    'Responde con un bloque ```etapa con JSON: {"actividades":["qué hiciste, paso a paso"],"salida":"el resultado en markdown","evidencia":[{"titulo":"…","url":"…","extracto":"…"}]}',
  ].filter(Boolean).join('\n');
}

// La respuesta de una IA → { actividades, salida, evidencia }. Lo que dice un modelo es dato no confiable: la evidencia nunca sale verificada.
export function leerRespuesta(texto) {
  const t = String(texto || '');
  const m = t.match(/```etapa\s*([\s\S]*?)```/) || t.match(/(\{[\s\S]*"salida"[\s\S]*\})/);
  let j = null; try { j = m ? JSON.parse(m[1]) : null; } catch {}
  if (!j) return { actividades: ['La IA respondió sin el bloque pedido: se guardó su texto tal cual'], salida: t.trim(), evidencia: [] };
  return {
    actividades: (Array.isArray(j.actividades) ? j.actividades : []).map((x) => limpiar(typeof x === 'string' ? x : x?.texto || x?.text)).filter(Boolean).slice(0, 30),
    salida: String(j.salida || '').slice(0, 60000),
    evidencia: (Array.isArray(j.evidencia) ? j.evidencia : []).slice(0, 30).map((x) => ({ titulo: limpiar(x?.titulo || x?.url || 'Fuente').slice(0, 200), url: String(x?.url || '').slice(0, 500), extracto: limpiar(x?.extracto).slice(0, 600), verificada: false })),
  };
}

// STUB · el runner simulado: recorre la etapa con su definición real, sin llamar a ningún modelo. Todo campo sale ⚠️ SIN DATOS.
export function simular(run, n) {
  const e = run.etapas[n], f = run.flujo || {}, o = leerOutput(e.output, e.nombre);
  const previas = run.etapas.slice(0, n).filter((x) => x.estado === 'aprobada');
  const actividades = [
    `Leyendo la definición de la etapa (${f.fuente || 'el flujo'})`,
    e.skill ? `Cargando la lógica de la skill ${e.skill}` : '',
    run.cliente ? `Abriendo la carpeta del cliente clients/${run.cliente}/` : '',
    previas.length ? `Tomando como input lo aprobado: ${previas.map((x) => x.nombre).join(' → ')}` : '',
    ...e.inputs.map((x) => `Verificando input: ${x}`),
    e.estado === 'ajuste' && e.ajuste ? `Aplicando el ajuste: «${e.ajuste}»` : '',
    ...(e.tareas.length ? e.tareas : [e.proposito || `Trabajar ${e.nombre}`]).slice(0, 6),
    '⚠️ Simulado: no se consultaron fuentes. Lo que no tiene fuente queda ⚠️ SIN DATOS',
    ...e.criterios.slice(0, 4).map((x) => `Criterio: ${x}`),
    'Armando el resultado parcial para tu revisión',
  ].filter(Boolean);
  const campos = o.campos.length ? o.campos : e.criterios.length ? e.criterios : ['Hallazgos', 'Decisión propuesta', 'Preguntas abiertas'];
  const salida = [`## ${o.titulo}`, '', `> Etapa ${e.codigo} · ${e.nombre}${e.proposito ? ` — ${e.proposito}` : ''}`, run.objetivo ? `> Objetivo: ${run.objetivo}` : '', '',
    ...campos.flatMap((c) => [`### ${c}`, '⚠️ SIN DATOS — completar con una IA conectada o corregir a mano.', '']),
    e.estado === 'ajuste' && e.ajuste ? `### Ajuste aplicado\n- ${e.ajuste}\n` : '',
    e.gate ? `> 🚦 Gate del CEO: ${e.nota_gate || 'requiere su aprobación'}` : ''].filter((x) => x !== '').join('\n');
  const evidencia = [
    f.fuente ? { titulo: `Workflow · ${f.nombre}`, url: f.fuente, extracto: e.proposito, verificada: true } : null,
    e.skill && /^agents\//.test(f.fuente || '') ? { titulo: `Skill · ${e.skill}`, url: f.fuente.replace(/WORKFLOW\.md$/, `skills/${e.skill}/SKILL.md`), extracto: '', verificada: true } : null,
    run.cliente ? { titulo: `Carpeta del cliente · ${run.cliente_nombre || run.cliente}`, url: `clients/${run.cliente}/`, extracto: '', verificada: true } : null,
    { titulo: 'Sin fuentes externas (simulado)', url: '', extracto: 'Conecta tu IA (Hermes o el puente) para investigar con fuentes.', verificada: false },
  ].filter(Boolean);
  return { actividades, salida, evidencia };
}
