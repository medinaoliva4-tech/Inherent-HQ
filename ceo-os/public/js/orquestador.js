// F6 · El orquestador (PLAN-GATEWAY §13). El enrutador: de un pedido en texto a qué agente y qué cliente.
// Todo es puro (sin DOM, sin red, sin base). El servidor llama a `pedidoRuta` para armar el prompt del modelo
// barato, y a `leerRuta` para validar y limpiar lo que el modelo respondió.
// Nunca arranca un workflow aquí: esto solo produce la propuesta { agente, cliente, objetivo, confianza }
// que la persona confirma en la tarjeta «Así lo voy a trabajar» (CONTINUAR-KIMI §7.5).

// Los sinónimos no son instrucciones: solo ayudan al modelo barato a no confundir áreas.
// Cada agente del flujo (agents/<area>) con lo que cubre. El id es el slug que ve la interfaz.
export const AREAS_AGENTE = [
  { id: 'estrategia', nombre: 'Estrategia', pistas: ['estrategia', 'posicionamiento', 'oferta', 'avatar', 'cliente ideal', 'precio', 'plan de marca', 'auditoría de marca', 'funnel', 'etapa'] },
  { id: 'marketing', nombre: 'Marketing', pistas: ['marketing', 'ads', 'pauta', 'campaña', 'contenido', 'reel', 'seo', 'calendario', 'mes', 'publicaciones', 'copy', 'anuncio'] },
  { id: 'diseno', nombre: 'Diseño', pistas: ['diseño', 'logo', 'identidad', 'marca visual', 'pieza gráfica', 'layout', 'portada', 'figma', 'arte'] },
  { id: 'consulting', nombre: 'Consulting', pistas: ['consulting', 'consultoría', 'finanzas', 'cotización', 'factura', 'proyecto', 'propuesta', 'números'] },
  { id: 'produccion', nombre: 'Producción', pistas: ['producción', 'video', 'rodaje', 'shotlist', 'grabación', 'edición', 'escena', 'plan de rodaje'] },
];

// El texto del sistema que recibe el modelo barato. El LLM propone, el servidor valida (§21): el JSON que
// devuelve no se confía; `leerRuta` lo limpia contra los agentes y clientes reales que sí existen y la persona ve.
export function pedidoRuta(texto, agentes, clientes) {
  const t = String(texto || '').trim();
  const ag = (Array.isArray(agentes) ? agentes : []).map((a) => `- ${a.id}: ${a.nombre || ''}${a.pistas ? ` (${a.pistas.join(', ')})` : ''}`).join('\n');
  const cl = (Array.isArray(clientes) ? clientes : []).map((c) => (typeof c === 'string' ? c : c.slug || c.nombre || '')).filter(Boolean);
  const sistema = [
    'Eres el enrutador de Inherent OS. Eliges UN agente y UN cliente para este pedido.',
    'Respondes SOLO con un objeto JSON, sin texto alrededor, con esta forma:',
    '{"agente":"<id>","cliente":"<slug>","objetivo":"<frase corta>","confianza":<0 a 1>}',
    'Si no hay cliente claro, "cliente" va vacío. Si nada te convence, confianza baja.',
    '',
    'Agentes:',
    ag || '(ninguno cargado)',
    '',
    `Clientes conocidos: ${cl.length ? cl.join(', ') : '(ninguno)'}`,
  ].join('\n');
  return { sistema, usuario: t };
}

// Convierte un id o nombre suelto al id real de un agente conocido, o '' si no calza.
function agenteDe(valor, agentes) {
  const v = String(valor || '').trim().toLowerCase();
  if (!v) return '';
  for (const a of agentes) {
    if (a.id === v) return a.id;
    if (String(a.nombre || '').toLowerCase() === v) return a.id;
  }
  // Calce por prefijo o por pista («estrategia de marca» → estrategia).
  for (const a of agentes) {
    if (v.includes(a.id)) return a.id;
    if ((a.pistas || []).some((p) => v === p || v.includes(p))) return a.id;
  }
  return '';
}

// Convierte un nombre o slug suelto al slug real de un cliente conocido, o '' si no calza.
function clienteDe(valor, clientes) {
  const v = String(valor || '').trim().toLowerCase();
  if (!v) return '';
  const slugs = (Array.isArray(clientes) ? clientes : [])
    .map((c) => (typeof c === 'string' ? { slug: c, nombre: c } : { slug: String(c.slug || '').toLowerCase(), nombre: String(c.nombre || '').toLowerCase() }))
    .filter((c) => c.slug);
  for (const c of slugs) if (c.slug === v) return c.slug;
  for (const c of slugs) if (c.nombre && (c.nombre === v || v.includes(c.nombre) || c.nombre.includes(v))) return c.slug;
  for (const c of slugs) if (v.includes(c.slug)) return c.slug;
  return '';
}

// Saca el primer objeto JSON balanceado de un texto, aunque el modelo lo envuelva en ``` o en palabras.
function primerJson(texto) {
  const s = String(texto || '');
  const inicio = s.indexOf('{');
  if (inicio < 0) return null;
  let nivel = 0;
  for (let i = inicio; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') nivel++;
    else if (ch === '}') { nivel--; if (nivel === 0) return s.slice(inicio, i + 1); }
  }
  return null;
}

// Limpia y valida lo que el modelo respondió. Devuelve null si no hay nada aprovechable.
// El resultado solo referencia agentes y clientes que de verdad existen en las listas dadas.
export function leerRuta(json, agentes = AREAS_AGENTE, clientes = []) {
  const crudo = typeof json === 'string' ? primerJson(json) : (json && typeof json === 'object' ? json : null);
  if (!crudo) return null;
  let o = crudo;
  if (typeof crudo === 'string') { try { o = JSON.parse(crudo); } catch { return null; } }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;

  const agente = agenteDe(o.agente ?? o.area ?? o.agent, agentes);
  if (!agente) return null; // sin agente claro no hay ruta: la tarjeta no se muestra y el chat sigue normal.
  const cliente = clienteDe(o.cliente ?? o.marca ?? o.brand, clientes);
  const objetivo = String(o.objetivo ?? o.tarea ?? o.task ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  let confianza = Number(o.confianza ?? o.confidence ?? 0);
  if (!Number.isFinite(confianza)) confianza = 0;
  confianza = Math.min(1, Math.max(0, confianza));

  return { agente, cliente, objetivo, confianza };
}

// ¿El pedido pide orquestar? Lo usa el Chat para enseñar la tarjeta solo cuando toca.
export function quiereOrquestar(texto) {
  const t = String(texto || '').trim().toLowerCase();
  return t.startsWith('/orquesta') || t.startsWith('/orquestar');
}

// Los workflows guardan áreas en inglés; el enrutador usa identificadores en español.
export function areaRuta(area) {
  const a = String(area || 'strategy').trim().toLowerCase();
  return ({ strategy: 'estrategia', creative: 'diseno', production: 'produccion' })[a] || a;
}
