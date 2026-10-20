// App 02 · Estrategia — lo que comparten el servidor (api/_lib/estrategia.js), Laya (la puerta «etapa») y la interfaz.
// Todo es puro (sin DOM ni red). Los datos salen de:
//   · agents/01-strategy/brain/WORKFLOW.md (el flujo, el techo del alcance y hasta dónde cierra la estrategia en cada nivel)
//   · agents/02-growth/brain/WORKFLOW.md y gr-oferta · gr-upsells · gr-captura · gr-canales-grandes (qué corre en cada nivel)
//   · agents/01-strategy/brain/skills/hormozi-brain (INDEX.md y las guías del $100M Scaling Roadmap: cada etapa)
//   · inherent/03-OFERTA.md (los tres niveles y sus límites)
// Nada se inventa: lo que un workflow no dice, no está aquí.
import { levelOf } from './levels.js';

export const AREA = 'estrategia';
export const COLL = 'strategy';
export const HORMOZI = 'agents/01-strategy/brain/skills/hormozi-brain';

// ---------- Las 10 etapas del $100M Scaling Roadmap (0 a 9) ----------
// rol · gente · traba · graduar: la tabla «YOUR ROLE · HEADCOUNT · BOTTOM LINE · GRADUATE BY» de la guía de cada etapa (literal, en inglés).
// es: la misma idea en español, para quien la lee y para Laya. video / guia: dónde está en hormozi-brain/references.
const G = (n) => `roadmap/guides/guide-stage-${n}`;
export const ETAPAS = [
  { n: 0, id: 'improvise', nombre: 'Improvise', rol: 'Researcher', gente: 'N/A', traba: 'Nothing is happening', graduar: 'Get people to try your stuff for free',
    es: 'Todavía no pasa nada: nadie ha probado lo que vende. Para pasar de etapa, que la gente lo pruebe gratis.', video: 'roadmap/stage-0-improvise.md', guia: { ruta: `${G(0)}-improvise.md`, pag: 3 } },
  { n: 1, id: 'monetize', nombre: 'Monetize', rol: 'Starter', gente: '1', traba: 'Your business makes no money', graduar: 'Make your first sale',
    es: 'El negocio no genera dinero todavía. Para pasar de etapa, hacer la primera venta.', video: 'roadmap/stage-1-monetize.md', guia: { ruta: `${G(0)}-improvise.md`, pag: 11 } },
  { n: 2, id: 'advertise', nombre: 'Advertise', rol: 'Doer', gente: '1', traba: 'New customers are inconsistent', graduar: 'Let more people know about your stuff',
    es: 'Ya vende, pero los clientes nuevos llegan de forma irregular. Para pasar de etapa, que más gente conozca lo que vende.', video: 'roadmap/stage-2-advertise.md', guia: { ruta: `${G(2)}-advertise.md`, pag: 24 } },
  { n: 3, id: 'stabilize', nombre: 'Stabilize', rol: 'Trainer', gente: '1 to 4', traba: 'There’s too much for one person to do', graduar: 'Get help',
    es: 'Hay demasiado para una sola persona. Para pasar de etapa, conseguir ayuda.', video: 'roadmap/stage-3-stabilize.md', guia: { ruta: `${G(3)}-stabilize.md`, pag: 55 } },
  { n: 4, id: 'prioritize', nombre: 'Prioritize', rol: 'Manager', gente: '5 to 9', traba: 'Trying to be everything to everyone', graduar: 'Niche down to serve only people like your best customers',
    es: 'Intenta ser todo para todos. Para pasar de etapa, enfocarse solo en gente como sus mejores clientes.', video: 'roadmap/stage-4-prioritize.md', guia: { ruta: `${G(4)}-prioritize.md`, pag: 83 } },
  { n: 5, id: 'productize', nombre: 'Productize', rol: 'Director', gente: '10 to 19', traba: 'Not making enough per customer. Low LTV:CAC.', graduar: 'Make and sell your second premium product to customers',
    es: 'Gana muy poco por cliente (LTV:CAC bajo). Para pasar de etapa, crear y vender un segundo producto premium.', video: 'roadmap/stage-5-productize.md', guia: { ruta: `${G(5)}-productize.md`, pag: 108 } },
  { n: 6, id: 'optimize', nombre: 'Optimize', rol: 'Leader', gente: '20-49', traba: 'Everthing is inefficient', graduar: 'Doing better rather than doing more',
    es: 'Todo es ineficiente. Para pasar de etapa, hacerlo mejor en vez de hacer más.', video: 'roadmap/stage-6-optimize.md', guia: { ruta: `${G(6)}-optimize.md`, pag: 134 } },
  { n: 7, id: 'categorize', nombre: 'Categorize', rol: 'Executive', gente: '50 to 99', traba: 'Every system is overwhelmed. The business is disorganized.', graduar: 'Triage appropriately.',
    es: 'Todos los sistemas están saturados y el negocio está desordenado. Para pasar de etapa, priorizar bien (triage).', video: 'roadmap/stage-7-categorize.md', guia: { ruta: `${G(7)}-categorize.md`, pag: 160 } },
  { n: 8, id: 'specialize', nombre: 'Specialize', rol: 'President', gente: '100 to 249', traba: 'No one is good enough to know everything', graduar: 'Create dedicated people and teams for specific tasks',
    es: 'Nadie puede saberlo todo. Para pasar de etapa, crear personas y equipos dedicados a tareas específicas.', video: 'roadmap/stage-8-specialize.md', guia: { ruta: `${G(8)}-specialize.md`, pag: 186 } },
  { n: 9, id: 'capitalize', nombre: 'Capitalize', rol: 'Chairman', gente: '250 to 500', traba: 'Not sure where the next big growth comes from', graduar: 'Make a big bet on the future',
    es: 'No está claro de dónde viene el siguiente gran crecimiento. Para pasar de etapa, hacer una gran apuesta por el futuro.', video: 'roadmap/stage-9-capitalize.md', guia: { ruta: `${G(9)}-capitalize.md`, pag: 213 } },
];
export const etapaLabel = (e) => `Etapa ${e.n} · ${e.nombre}`;
export const etapaDe = (n) => ETAPAS.find((e) => e.n === +n) || null;
// La respuesta de Laya a la puerta «etapa» es una de las 10 etiquetas («Etapa 3 · Stabilize»).
export const etapaDeRespuesta = (answer) => { const m = /^\s*Etapa\s+(\d)\b/i.exec(String(answer || '')); return m ? etapaDe(+m[1]) : null; };
// Las opciones de la pregunta de Laya: { 'Etapa 3 · Stabilize': 'descripción' } (≤ 200 caracteres cada una).
const rec = (s, n = 200) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);
export const OPCIONES_ETAPA = Object.fromEntries(ETAPAS.map((e) => [etapaLabel(e), rec(`${e.rol}, ${e.gente} personas. «${e.traba}». ${e.es}`)]));

// ---------- Los 5 bloques, en orden ----------
// entregables: los ids del mapa de Intel (public/js/intel-mapa.js) que alimentan el bloque, en orden de importancia. `sec` = la
// sección («§ La oferta») de motor-de-crecimiento.md que le toca al bloque: ese documento junta las de varios bloques.
// `apoyo` = contexto que se muestra, pero que por sí solo no cuenta como «el entregable del bloque» (el bloque sigue Vacío).
// material: lo que Hormozi dice del tema (archivo dentro de hormozi-brain/references), para tenerlo a un clic aunque el chat no lo haya citado.
const LIB = (b, f, t) => ({ ruta: `books/${b}/${f}.md`, titulo: t });
export const BLOQUES = [
  { id: 'diagnostico', n: 1, nombre: 'Diagnóstico', corto: 'La etapa', pide: 'En qué etapa del $100M Scaling Roadmap (0 a 9) está el negocio.',
    entregables: [{ id: 'comprension' }, { id: 'nucleo' }],
    material: [{ ruta: 'roadmap/overview-las-10-etapas.md', titulo: 'Roadmap · las 10 etapas' }] },
  { id: 'oferta', n: 2, nombre: 'Oferta', corto: 'Ecuación de valor y Grand Slam', pide: 'La ecuación de valor y la Grand Slam Offer, dentro del nivel que contrató.',
    entregables: [{ id: 'ofertas-a-empujar' }, { id: 'motor-de-crecimiento', sec: /^§?\s*la oferta/i, secLabel: '§ La oferta' }, { id: 'estrategia', apoyo: true }],
    material: [LIB('100m-offers', '04-ch02-grand-slam-offers', '$100M Offers · 2. Grand Slam Offers'), LIB('100m-offers', '10-ch06-the-value-equation', '$100M Offers · 6. La ecuación de valor'),
      LIB('100m-offers', '13-ch09-grand-slam-offer-part-1-problems-solutions', '$100M Offers · 9. Problemas y soluciones'), LIB('100m-offers', '14-ch10-grand-slam-offer-part-2-trim-stack', '$100M Offers · 10. Recortar y apilar')] },
  { id: 'modelo', n: 3, nombre: 'Modelo de dinero', corto: 'Atracción, upsell, downsell, continuidad', pide: 'Cómo se gana dinero con cada cliente: atracción, upsell, downsell y continuidad.',
    entregables: [{ id: 'motor-de-crecimiento', sec: /^§?\s*la escalera/i, secLabel: '§ La escalera' }, { id: 'numeros' }, { id: 'estrategia', apoyo: true }],
    material: [LIB('100m-money-models', '03-the-four-types-of-offers', '$100M Money Models · Los 4 tipos de oferta'), LIB('100m-money-models', '13-upsell-classic-upsell', '$100M Money Models · Upsell clásico'),
      LIB('100m-money-models', '19-downsell-payment-plan', '$100M Money Models · Downsell: plan de pagos'), LIB('100m-money-models', '24-continuity-bonus-offers', '$100M Money Models · Continuidad con bono')] },
  { id: 'leads', n: 4, nombre: 'Leads', corto: 'Core Four y lead getters', pide: 'Dónde va a conseguir clientes este negocio con esta oferta: Core Four y lead getters.',
    entregables: [{ id: 'motor-de-crecimiento', sec: /^§?\s*(captura|canales grandes)/i, secLabel: '§ Captura y § Canales grandes' }, { id: 'plan-por-canal' }, { id: 'estrategia', apoyo: true }],
    material: [LIB('100m-leads', '08-core4-1-warm-outreach', '$100M Leads · Core Four 1: contacto cercano'), LIB('100m-leads', '09-core4-2-post-free-content-part-1', '$100M Leads · Core Four 2: contenido gratis'),
      LIB('100m-leads', '12-core4-3-cold-outreach', '$100M Leads · Core Four 3: contacto en frío'), LIB('100m-leads', '13-core4-4-paid-ads-part-1-making-an-ad', '$100M Leads · Core Four 4: anuncios'),
      LIB('100m-leads', '16-section-4-get-lead-getters', '$100M Leads · Lead getters')] },
  { id: 'roadmap', n: 5, nombre: 'Roadmap', corto: 'El plan de 90 días', pide: 'El plan de 90 días según su etapa, con lo que dice Hormozi de esa etapa.',
    entregables: [{ id: 'estrategia' }, { id: 'posicionamiento' }],
    material: [] }, // el material del roadmap sale de la etapa confirmada: video y guía (ver fuentesDeEtapa)
];
// De un documento con secciones («## § La oferta»), solo las que coinciden con `re` (hasta el siguiente título del mismo nivel o mayor).
export function seccion(md, re) {
  const L = String(md || '').split('\n'), out = []; let nivel = 0;
  for (const ln of L) {
    const h = /^(#{1,4})\s+(.*)$/.exec(ln);
    if (h) {
      const txt = h[2].replace(/[*`_]/g, '').trim();
      if (nivel && h[1].length <= nivel) nivel = 0;
      if (!nivel && re.test(txt)) { nivel = h[1].length; out.push(ln); continue; }
    }
    if (nivel) { if (/^\s*---+\s*$/.test(ln)) { nivel = 0; continue; } out.push(ln); }
  }
  return out.join('\n').trim();
}
export const bloqueDe = (id) => BLOQUES.find((b) => b.id === id) || null;
export const BLOQUE_IDS = BLOQUES.map((b) => b.id);
// Los videos y la guía de una etapa, para tenerlos a un clic.
export const fuentesDeEtapa = (n) => { const e = etapaDe(n); return e ? [{ ruta: e.video, titulo: `Roadmap · ${etapaLabel(e)} (video)` }, { ruta: e.guia.ruta, titulo: `Roadmap · ${etapaLabel(e)} (guía)`, p: e.guia.pag }] : []; };

// ---------- Estado de un bloque ----------
// Vacío (no hay nada) · En trabajo (hay un borrador o ya existe el entregable en el repo) · Aprobado por el CEO (solo él lo aprueba).
export const ESTADOS = [['vacio', 'Vacío'], ['trabajo', 'En trabajo'], ['aprobado', 'Aprobado por el CEO']];
export const estadoLabel = (e) => (ESTADOS.find(([k]) => k === e) || ESTADOS[0])[1];
export const estadoDe = (doc, hayRepo = false) => (doc?.estado === 'aprobado' && doc?.aprobado?.por ? 'aprobado' : doc?.borrador?.texto || hayRepo ? 'trabajo' : 'vacio');
export const docId = (slug, bloque) => `${slug}--${bloque}`;
export const parseDocId = (id) => { const m = /^([a-z0-9][a-z0-9_-]{1,59})--([a-z]{3,20})$/.exec(String(id || '')); return m && BLOQUE_IDS.includes(m[2]) ? { slug: m[1], bloque: m[2] } : null; };

// ---------- El nivel contratado y sus límites ----------
// nivelId: 'foundation' | 'growth' | 'partnership' | 'medida' (Tailor Made: manda su ficha) | null (sin ficha o sin nivel).
export function nivelDe(plan) {
  const l = levelOf(plan); if (l) return { id: l.id, nombre: l.name };
  return /tailor|a la medida|⬜/i.test(String(plan || '')) ? { id: 'medida', nombre: 'A la medida' } : null;
}
const S = (estado, titulo, texto) => ({ estado, titulo, texto }); // estado: 'si' · 'parcial' · 'no'
const MEDIDA = S('parcial', 'A la medida', 'El techo es lo que dice su ficha: «Qué incluye» y «Su pipeline». Lo que no está ahí no entra.');
export const LIMITES = {
  diagnostico: {
    foundation: S('si', 'Entra', 'El diagnóstico de marca, oferta, audiencia y canales actuales es el primer entregable de Foundation.'),
    growth: S('si', 'Entra', 'La estrategia existe entera en Brand Growth; lo que cambia es hasta dónde llega.'),
    partnership: S('si', 'Entra', 'Completo, más el diagnóstico del recorrido (conoce → compra → vuelve).'),
    medida: MEDIDA,
  },
  oferta: {
    foundation: S('si', 'Se trabaja la oferta', 'La estructura de oferta (productos o servicios, propuesta de valor y mensajes) sale en la estrategia.'),
    growth: S('no', 'Solo el mensaje', 'No cambia qué se vende, en qué paquetes ni a qué precio: se elige cuáles de las ofertas que ya existen se empujan. Tocar la oferta es de Partnership o de un proyecto de Foundation.'),
    partnership: S('si', 'Oferta completa', 'Se trabaja qué se vende, cómo se empaqueta y a qué precio. Una oferta o un precio nuevo se escala al CEO antes de llevarlo al cliente.'),
    medida: MEDIDA,
  },
  modelo: {
    foundation: S('no', 'No entra', 'Upsells, downsell y continuidad no se activan en Foundation: no se le puede vender más a quien todavía no compró una vez.'),
    growth: S('no', 'No entra', 'Upsells, downsell y continuidad no se activan en Brand Growth: es la escalera de Growth Partnership.'),
    partnership: S('si', 'Entra', 'La escalera de upsells con el momento exacto de cada escalón. Los números por línea solo si la ficha incluye finanzas vinculadas al crecimiento.'),
    medida: MEDIDA,
  },
  leads: {
    foundation: S('parcial', 'Solo como plan', 'La ejecución continua (contenido, campañas, canales) no va en Foundation: se cotiza como Brand Growth o como módulos.'),
    growth: S('parcial', 'Atención, no captura', 'El contenido trae atención y la llamada a la acción va al DM o al WhatsApp del cliente. No se arma la captura (receta, embudo, auto-DM) ni los canales grandes.'),
    partnership: S('si', 'Entra', 'La captura (receta y meta interna de leads) y los canales grandes. La meta de leads no se le promete al cliente.'),
    medida: MEDIDA,
  },
  roadmap: {
    foundation: S('si', 'Cierra en 90 días', 'La estrategia cierra en el plan de lanzamiento o de crecimiento a 90 días y la lista priorizada de próximos trabajos.'),
    growth: S('si', 'Cierra en el ciclo', 'Cierra en el alcance y el volumen del ciclo que fija la ficha. No promete un % de crecimiento.'),
    partnership: S('si', 'Cierra en facturación', 'Llega hasta facturación porque hay atribución que lo sostenga.'),
    medida: MEDIDA,
  },
};
export const limiteDe = (bloque, nivelId) => (LIMITES[bloque] || {})[nivelId] || null;

// ---------- La puerta de Laya «etapa» ----------
// El texto que se juzga: lo que ya está en el repo del cliente (recortado). contexto: { nombre, nivel, comprension, nucleo }.
const MAX_ETAPA = 5200;
const limpio = (s) => String(s || '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*>.*$/gm, '').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
export function textoEtapa(contexto = {}) {
  const parte = (t, n) => { const s = limpio(t); return s.length > n ? s.slice(0, n) + '…' : s; };
  const t = [`Negocio: ${contexto.nombre || ''}`.trim(), contexto.nivel ? `Nivel contratado en Inherent: ${contexto.nivel}` : '',
    contexto.comprension ? `Lo que sabemos del negocio (comprensión):\n${parte(contexto.comprension, 3400)}` : 'Lo que sabemos del negocio: (todavía no hay comprensión escrita)',
    contexto.nucleo ? `El núcleo de la estrategia:\n${parte(contexto.nucleo, 1500)}` : ''].filter(Boolean).join('\n\n');
  return t.length > MAX_ETAPA ? t.slice(0, MAX_ETAPA) : t;
}

// ---------- El prompt del chat ----------
// Lo arma el OS y lo corre el Claude de cada persona en su compu (puente local, solo lectura).
// d: { cliente, slug, carpeta, bloque, nivel, nivelId, limite, incluye, etapa, etapaConfirmada, entregables:[ruta], mensaje }
export function promptDe(d) {
  const b = bloqueDe(d.bloque), e = d.etapa != null ? etapaDe(d.etapa) : null;
  const L = d.limite;
  const etapa = e ? `${etapaLabel(e)} (${d.etapaConfirmada ? 'confirmada por el CEO' : 'propuesta, sin confirmar'})` : 'sin diagnosticar todavía';
  const rutas = (d.entregables || []).map((r) => `- ${r}`).join('\n');
  return [
    `Eres Strategy (① Strategy) de Inherent. Estás en el OS, en la pantalla de Estrategia, y trabajas en SOLO LECTURA: no puedes ni debes crear o cambiar archivos; tu respuesta es un borrador que el CEO revisará.`,
    '',
    `Cliente: ${d.cliente} (${d.carpeta})`,
    `Nivel contratado: ${d.nivel || 'SIN FICHA DE OFERTA'}${L ? ` · límite en este bloque: ${L.titulo}. ${L.texto}` : ''}`,
    ...(d.incluye?.length ? [`Su ficha incluye: ${d.incluye.map((x) => `${x.k}: ${x.v}`).join(' · ')}`] : []),
    `Etapa del $100M Scaling Roadmap: ${etapa}`,
    `Bloque: ${b.n}. ${b.nombre} — ${b.pide}`,
    '',
    'Antes de responder, lee:',
    '- inherent/00-PRINCIPIOS.md',
    `- ${d.carpeta}/00-onboarding/plan-contratado.md (el alcance contratado es el techo)`,
    '- agents/01-strategy/brain/WORKFLOW.md',
    ...(rutas ? ['El entregable de este bloque, si existe:', rutas] : []),
    '',
    'Reglas:',
    `- Usa la skill hormozi-brain: lee ${HORMOZI}/SKILL.md y ${HORMOZI}/INDEX.md, y busca con Grep en ${HORMOZI}/references/. Responde solo con base en ese material, nunca de memoria. Si no está: «No está en el material».`,
    '- Cita SIEMPRE la fuente exacta, entre corchetes y con el formato del INDEX: [$100M OFFERS | 6. Value Offer: The Value Equation | pág. PDF 81] para un libro, o [ROADMAP VIDEO | STAGE 3: STABILIZE | 00:12:40] para un video (libro y capítulo, o etapa y timestamp). Pega el pasaje literal en inglés y explícalo aparte en español.',
    '- Lo que el material recomienda y el nivel contratado no incluye, márcalo FUERA DEL ALCANCE y no lo metas al plan.',
    '- Evidencia o etiqueta: un dato del cliente sin fuente va como [dice el cliente, sin verificar] o ⚠️ SIN DATOS. Nunca inventes cifras.',
    '- No hables de costos, márgenes ni de otro cliente. No prometas resultados garantizados.',
    '- Español de «tú». Breve, con viñetas y lo accionable arriba. Cierra con un primer paso para hoy.',
    '',
    `Pedido: ${String(d.mensaje || '').trim()}`,
  ].join('\n');
}

// ---------- Las citas que salen del chat ----------
// Formas que entiende:
//   [$100M OFFERS | 6. Value Offer: The Value Equation | pág. PDF 81] · [ROADMAP VIDEO | STAGE 3: STABILIZE | 00:12:40]
//   «$100M Offers, cap. 6» · «Etapa 3, 12:40»
// Devuelve [{ raw, src, sec, extra: [..] }]. El servidor las resuelve contra el INDEX (api/_lib/estrategia.js).
export function extraerCitas(texto) {
  const out = [], seen = new Set(), t = String(texto || '');
  const add = (c) => { const k = JSON.stringify([c.src, c.sec, c.extra]); if (!seen.has(k)) { seen.add(k); out.push(c); } };
  for (const m of t.matchAll(/\[([^\[\]\n]{3,400})\]/g)) {
    const p = m[1].split('|').map((x) => x.trim()).filter(Boolean);
    if (p.length >= 2) add({ raw: `[${m[1].trim()}]`, src: p[0], sec: p[1], extra: p.slice(2) });
  }
  for (const m of t.matchAll(/\$100M\s+(Offers|Leads|Money Models|Lost Chapters)\s*[,·:-]?\s*cap(?:[ií]tulo|\.)?\s*(\d{1,2})\b/gi)) add({ raw: m[0], src: `$100M ${m[1]}`, sec: '', extra: [], cap: +m[2] });
  for (const m of t.matchAll(/\bEtapa\s+(\d)\b\s*[,·:-]?\s*((?:\d{1,2}:)?\d{1,2}:\d{2})/gi)) add({ raw: m[0], src: 'ROADMAP VIDEO', sec: '', extra: [m[2]], etapa: +m[1] });
  return out.slice(0, 40);
}
// «12:40» → «00:12:40» · «1:02:03» → «01:02:03»; null si no es un tiempo.
export function tiempo(s) {
  const m = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/.exec(String(s || '').trim()); if (!m) return null;
  const p = (x) => String(x).padStart(2, '0'); return `${p(m[1] || 0)}:${p(m[2])}:${m[3]}`;
}
const num = (s) => { const m = /p[aá]g(?:ina|\.)?\s*(?:PDF\s*)?(\d{1,4})/i.exec(String(s || '')); return m ? +m[1] : null; };
// El pasaje exacto que pide una cita: { t: 'HH:MM:SS' | null, p: número de página | null }.
export function dondeDe(c) {
  let t = null, p = null;
  for (const x of c.extra || []) { t ||= tiempo(x); p ||= num(x); }
  return { t, p };
}
