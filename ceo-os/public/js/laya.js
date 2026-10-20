// Fase 3 · Laya: el juicio como dato. Laya es un motor de decisiones de código abierto que corre en la compu
// de cada persona (no en Vercel): responde preguntas fijas sobre un texto — choice (una opción), score (un punto
// en una escala) y noul (sí o no, con probabilidad). Solo lee texto.
// Estos helpers son puros (sin DOM ni red): los usan la app, el servidor (api/_lib/laya.js) y el conector MCP.
//   puertas  → qué se le pregunta a cada tipo de elemento (settings «laya_gates», las edita el CEO)
//   juicio   → { target:{coll,id}, gate, question_id, answer, prob|score, why, engine, model, at, by }

import { CATS_OUT } from './facturas.js';
import { OPCIONES_ETAPA, textoEtapa } from './estrategia.js';

export const PUENTE = 'http://127.0.0.1:7357';
export const GATES_ID = 'laya_gates';
// Los motores, en el orden en que se intentan. «claude» queda declarado para el juicio visual (Fase 6): sin implementar.
export const ENGINES = ['laya-local', 'laya-mcp', 'claude'];
export const ENGINE_LISTO = { 'laya-local': true, 'laya-mcp': true, claude: false };
export const ENGINE_LABEL = { 'laya-local': 'Laya en tu compu', 'laya-mcp': 'Laya vía Claude Code', claude: 'Claude (Fase 6)' };
export const TIPOS = ['noul', 'score', 'choice'];
export const TIPO_LABEL = { noul: 'Sí o no', score: 'Escala', choice: 'Elegir una opción' };
// El modelo de Laya que lee español (y 100+ idiomas). Se fija para no bajar el checkpoint en inglés.
export const MODELO = 'multilingual';
// Cómo se instala y se enciende el puente (ceo-os/tools/laya-puente/), desde la raíz del repo.
export const INSTALAR = 'pip install "laya[serve]"';
export const ENCENDER = 'python ceo-os/tools/laya-puente/puente.py';
export const COMANDO = `${INSTALAR} && ${ENCENDER}`;
// El instalador de un comando (public/laya/): deja el puente corriendo siempre en la compu de cada quien.
export const INSTALADOR = 'https://inherent-work.vercel.app/laya';
export const INSTALAR_MAC = `curl -fsSL ${INSTALADOR}/instalar.sh | bash`;
export const INSTALAR_WIN = `irm ${INSTALADOR}/instalar.ps1 | iex`;
// El modelo local (opcional): el mismo instalador con --modelo-local / -ModeloLocal. Instala Ollama y un modelo
// pequeño que escribe español para el texto repetitivo (variantes de caption, alt text, títulos cortos).
export const OLLAMA = 'http://127.0.0.1:11434';
export const MODELO_LOCAL = 'gemma3:4b';
export const INSTALAR_MODELO_MAC = `curl -fsSL ${INSTALADOR}/instalar.sh | bash -s -- --modelo-local`;
export const INSTALAR_MODELO_WIN = `& ([scriptblock]::Create((irm ${INSTALADOR}/instalar.ps1))) -ModeloLocal`;
// 'win' | 'linux' | 'mac' según el user agent (Mac y Linux usan el mismo comando).
export const sistemaDe = (ua = '') => (/Windows/i.test(ua) ? 'win' : /Linux|X11|CrOS/i.test(ua) && !/Android/i.test(ua) ? 'linux' : 'mac');
// Sin puente: Claude Code, en una compu con Laya por MCP, resuelve los pendientes.
export const INSTALAR_MCP = 'pip install "laya[mcp]" && claude mcp add laya -- laya-mcp-server';

// Las categorías de gasto: las mismas de Finanzas (CATS_OUT de facturas.js, las que usa screens/finance.js).
export const CATS_GASTO = CATS_OUT;
const CAT_DESC = {
  'Pagos por servicio': 'pago a una persona o proveedor por un trabajo o servicio prestado',
  'Herramientas / IA': 'software, suscripciones, apps o inteligencia artificial',
  Producción: 'producción de contenido: equipo, locación, talento, utilería, sesiones',
  Pauta: 'publicidad pagada en redes o buscadores',
  Oficina: 'oficina, renta, servicios, papelería y gastos del local',
  Impuestos: 'impuestos, SAT, contador o trámites fiscales',
  Otro: 'nada de lo anterior',
};
export const NIVELES = ['Brand Foundation', 'Brand Growth', 'Growth Partnership'];

// Las puertas de fábrica. El CEO cambia las preguntas en Inherent → Laya. Los umbrales quedan vacíos: «sin umbral».
// noul: texto (+ si/no opcionales) · score: niveles de menor a mayor («corto: descripción») · choice: opciones { etiqueta: descripción }.
export const PUERTAS = {
  lead: { label: 'Lead', donde: 'Ventas', area: 'sales', coll: 'leads', preguntas: [
    { id: 'encaja', tipo: 'noul', chip: 'encaja', texto: '¿Este lead encaja con Inherent, un Brand Growth Partner que construye marcas y los sistemas de crecimiento detrás de ellas?',
      si: 'tiene una marca o negocio que quiere crecer y busca estrategia, marca, marketing o sistemas', no: 'busca algo fuera de eso: solo piezas sueltas, un empleo, vender algo o spam', umbral: null },
    { id: 'urgencia', tipo: 'score', chip: 'urgencia', texto: '¿Qué tan urgente es para este lead empezar?',
      niveles: ['nada: solo está explorando, sin fecha', 'baja: quiere empezar en unos meses', 'media: quiere empezar pronto', 'alta: lo necesita ya, tiene una fecha encima'], umbral: null },
    { id: 'nivel', tipo: 'choice', chip: 'nivel', texto: '¿Qué nivel de Inherent necesita este lead?', opciones: {
      'Brand Foundation': 'crear o reposicionar la marca: todavía no tiene marca, oferta o posicionamiento claros',
      'Brand Growth': 'la marca ya existe y quiere más atención y demanda: contenido, redes, pauta',
      'Growth Partnership': 'el negocio ya vende y se siente estancado: quiere integrar marca, ventas, procesos y finanzas' } },
    { id: 'precio_primero', tipo: 'noul', chip: 'pidió precio primero', texto: '¿Pregunta el precio sin explicar qué necesita?', umbral: null },
  ] },
  factura: { label: 'Factura por pagar', donde: 'Finanzas', area: 'finanzas', coll: 'invoices', kind: 'pagar', preguntas: [
    { id: 'duplicada', tipo: 'noul', chip: 'duplicada', texto: '¿Esta factura parece duplicada de alguna de las otras facturas que aparecen en la lista (mismo proveedor, monto y fechas parecidas)?', umbral: null },
    { id: 'categoria', tipo: 'choice', chip: 'categoría', texto: '¿En qué categoría de gasto va esta factura?', opciones: Object.fromEntries(CATS_GASTO.map((c) => [c, CAT_DESC[c] || c])) },
  ] },
  referente: { label: 'Referente', donde: 'Investigación', area: 'content', coll: 'content', kind: 'research', preguntas: [
    { id: 'sirve', tipo: 'noul', chip: 'sirve', texto: '¿Este post de referencia le sirve a la marca descrita al inicio?', umbral: null },
    { id: 'por_que', tipo: 'choice', chip: 'funciona por', texto: '¿Por qué funciona este post?', opciones: {
      gancho: 'el gancho: los primeros segundos o la primera línea', formato: 'el formato o la estructura del post', tema: 'el tema del que habla',
      talento: 'la persona que sale y cómo habla', producción: 'la producción: cámara, edición, estética' } },
  ] },
  idea: { label: 'Hook o copy', donde: 'Ideas', area: 'content', coll: 'content', kind: 'post', preguntas: [
    { id: 'engancha', tipo: 'score', chip: 'engancha', texto: '¿Qué tanto engancha este hook o copy al cliente ideal (ICP) de la marca?',
      niveles: ['nada: no le habla', 'poco: genérico, podría ser de cualquiera', 'bastante: le habla a su problema', 'mucho: lo detiene y lo hace seguir leyendo'], umbral: null },
    { id: 'suena', tipo: 'noul', chip: 'suena a la marca', texto: '¿Este hook o copy suena a la marca descrita al inicio?', umbral: null },
  ] },
  // App 02 · Estrategia, bloque Diagnóstico: Laya propone la etapa del $100M Scaling Roadmap (0 a 9) y el CEO la confirma.
  // Las 10 opciones y sus descripciones salen del roadmap (public/js/estrategia.js → ETAPAS).
  etapa: { label: 'Etapa del negocio', donde: 'Estrategia', area: 'estrategia', coll: 'strategy', preguntas: [
    { id: 'etapa', tipo: 'choice', chip: 'etapa', texto: '¿En qué etapa del $100M Scaling Roadmap de Acquisition.com (de la 0 a la 9) está este negocio hoy?', opciones: OPCIONES_ETAPA },
  ] },
};
export const GATES = Object.keys(PUERTAS);
// La puerta que le toca a un elemento de una colección (content se separa por kind).
export function puertaDeDoc(coll, d) {
  if (coll === 'leads') return 'lead';
  if (coll === 'invoices') return d?.kind === 'pagar' ? 'factura' : null;
  if (coll === 'content') return d?.kind === 'research' ? 'referente' : d?.kind === 'post' ? 'idea' : null;
  if (coll === 'strategy') return d?.bloque === 'diagnostico' ? 'etapa' : null;
  return null;
}

// ---------- limpiar lo que manda el CEO ----------
const str = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const qid = (v) => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
const umbralOk = (v) => (v === null || v === undefined || v === '' ? null : Number.isFinite(+v) && +v >= 0 && +v <= 1 ? Math.round(+v * 1000) / 1000 : null);
// Una pregunta válida, o null. Lanza con un mensaje humano si viene rota.
export function limpiarPregunta(p, i = 0) {
  if (!p || typeof p !== 'object') throw new Error(`La pregunta ${i + 1} viene vacía`);
  const tipo = TIPOS.includes(p.tipo) ? p.tipo : null; if (!tipo) throw new Error(`La pregunta ${i + 1}: el tipo es sí/no, escala u opción`);
  const texto = str(p.texto, 400); if (!texto) throw new Error(`La pregunta ${i + 1} no tiene texto`);
  const id = qid(p.id || p.chip || texto); if (!id) throw new Error(`La pregunta ${i + 1} no tiene id`);
  const o = { id, tipo, chip: str(p.chip, 40) || id.replace(/_/g, ' '), texto };
  if (tipo === 'noul') { const si = str(p.si, 300), no = str(p.no, 300); if (si) o.si = si; if (no) o.no = no; o.umbral = umbralOk(p.umbral); }
  if (tipo === 'score') {
    const niveles = (Array.isArray(p.niveles) ? p.niveles : []).map((x) => str(x, 200)).filter(Boolean).slice(0, 10);
    if (niveles.length < 2) throw new Error(`La pregunta «${o.chip}» necesita al menos 2 niveles`);
    o.niveles = niveles; o.umbral = umbralOk(p.umbral);
  }
  if (tipo === 'choice') {
    const src = Array.isArray(p.opciones) ? p.opciones.map((x) => (Array.isArray(x) ? x : [x?.etiqueta ?? x?.label ?? x, x?.descripcion ?? x?.desc ?? ''])) : Object.entries(p.opciones || {});
    const op = {};
    for (const [k, v] of src) { const kk = str(k, 60); if (kk && !(kk in op)) op[kk] = str(v, 200) || kk; }
    if (Object.keys(op).length < 2) throw new Error(`La pregunta «${o.chip}» necesita al menos 2 opciones`);
    o.opciones = Object.fromEntries(Object.entries(op).slice(0, 12));
  }
  return o;
}
// Lo que se guarda en settings «laya_gates»: { id, gates: { <puerta>: { preguntas: [...] } } }. Solo las 4 puertas.
export function limpiarPuertas(b = {}) {
  const gates = {};
  for (const g of GATES) {
    const src = b?.gates?.[g]; if (!src) continue;
    const list = (Array.isArray(src.preguntas) ? src.preguntas : []).slice(0, 8).map(limpiarPregunta);
    if (!list.length) throw new Error(`La puerta «${PUERTAS[g].label}» necesita al menos una pregunta`);
    const seen = new Set(); for (const q of list) { if (seen.has(q.id)) throw new Error(`En «${PUERTAS[g].label}» hay dos preguntas con el id «${q.id}»`); seen.add(q.id); }
    gates[g] = { preguntas: list };
  }
  return { id: GATES_ID, gates };
}
// Las puertas que aplican: lo guardado por el CEO encima de las de fábrica. Lo guardado roto no rompe nada: vuelve a fábrica.
export function puertasDe(settings) {
  const out = {};
  for (const g of GATES) {
    let preguntas = PUERTAS[g].preguntas;
    try { const s = settings?.gates?.[g]; if (s) preguntas = limpiarPuertas({ gates: { [g]: s } }).gates[g].preguntas; } catch { /* roto: de fábrica */ }
    out[g] = { ...PUERTAS[g], preguntas: preguntas.map((q) => ({ ...q })) };
  }
  return out;
}

// ---------- las preguntas en el formato de Laya ----------
// Devuelve { <question_id>: { type, instructions, criteria } } — lo que reciben Router.predict, /v1/systemone y laya_predict.
export function preguntasDe(gate, settings) {
  const p = puertasDe(settings)[gate]; if (!p) throw new Error(`Puerta desconocida: ${gate}`);
  const out = {};
  for (const q of p.preguntas) {
    if (q.tipo === 'noul') out[q.id] = { type: 'noul', instructions: q.texto, ...(q.si || q.no ? { criteria: { ...(q.no ? { false: q.no } : {}), ...(q.si ? { true: q.si } : {}) } } : {}) };
    if (q.tipo === 'score') out[q.id] = { type: 'score', instructions: q.texto, criteria: [...q.niveles] };
    if (q.tipo === 'choice') out[q.id] = { type: 'choice', instructions: q.texto, criteria: { ...q.opciones } };
  }
  return out;
}

// ---------- el texto que se juzga ----------
const MAX_TEXTO = 6000;
const linea = (k, v) => { const s = String(v ?? '').trim(); return s ? `${k}: ${s}` : ''; };
const lista = (l) => (Array.isArray(l) ? l : []).map((x) => (typeof x === 'string' ? x : x?.name || '')).filter(Boolean).join(', ');
const resp = (a) => (a && typeof a === 'object' ? Object.entries(a).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v && typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n') : String(a || ''));
const sistema = (t) => /^(Etapa|Siguiente paso|Responsable|Motivo de pérdida|Primera respuesta|Volvió a entrar)\b/.test(String(t || ''));
function marcaTexto(marca) {
  if (!marca) return '';
  const m = typeof marca === 'string' ? { name: marca } : marca, a = m.audience || {};
  // Con avatares aprobados (Cliente ideal), van ellos, el principal primero; si no, lo que diga la configuración de la marca.
  const icp = m.avatares?.length ? `\n${m.avatares.map((x) => '- ' + x).join('\n')}` : [a.exacto, a.nicho, a.general].filter(Boolean).join(' · ');
  return [linea('Marca', m.name), linea('Cliente ideal (ICP)', icp), linea('Pilares de contenido', lista(m.pillars)), linea('Voz de la marca', m.voz)].filter(Boolean).join('\n');
}
// gate + el elemento (+ la marca, + contexto: otras facturas para la de duplicadas) → un texto en español.
export function textoDe(gate, el = {}, marca = null, contexto = {}) {
  el = el || {};
  let t = '';
  if (gate === 'lead') {
    // El mensaje: lo que escribió (message), o lo que dejó en el diagnóstico, o lo primero que anotó el equipo que no es del sistema.
    const msg = el.message || el.mensaje || (el.answers ? resp(el.answers) : '') || (el.activity || []).map((x) => x?.text).find((x) => x && !sistema(x)) || '';
    t = [linea('Lead', [el.name, el.company && el.company !== el.name ? el.company : ''].filter(Boolean).join(' · ')), linea('Fuente', el.source), linea('Interesado en', el.wants),
      msg ? `Mensaje:\n${String(msg).trim()}` : 'Mensaje: (sin mensaje)', el.notes ? `Notas:\n${String(el.notes).trim()}` : ''].filter(Boolean).join('\n');
  } else if (gate === 'factura') {
    const money = (i) => `${i.currency === 'USD' ? 'USD' : 'Q'} ${(+i.amount || 0).toFixed(2)}`;
    const otras = (contexto?.otras || []).filter((x) => x && x.id !== el.id).slice(0, 12);
    t = [linea('Factura por pagar de', el.vendor), linea('Concepto', el.concept), linea('Monto', money(el)), linea('Emitida', el.issued), linea('Vence', el.due), linea('Notas', el.notes),
      otras.length ? `Otras facturas del mismo proveedor o el mismo monto:\n${otras.map((i) => `- ${i.vendor || '—'} · ${i.concept || '—'} · ${money(i)} · emitida ${i.issued || '—'} · vence ${i.due || '—'}${i.status === 'anulada' ? ' · anulada' : ''}`).join('\n')}` : 'Otras facturas del mismo proveedor o el mismo monto: ninguna'].filter(Boolean).join('\n');
  } else if (gate === 'referente') {
    const w = el.why && typeof el.why === 'object' ? el.why : {};
    t = [marcaTexto(marca), '', 'Post de referencia:', linea('Cuenta', el.handle ? '@' + el.handle : ''), linea('Red', el.red), linea('Formato', el.format), linea('Título', el.title), linea('Hook', w.hook),
      linea('Pilar', el.pillar), linea('Tipo', el.style), linea('Por qué funcionó (análisis)', w.por_que), el.text ? `Texto del post:\n${String(el.text).trim()}` : ''].filter((x) => x !== null && x !== undefined && x !== false).join('\n').replace(/\n{3,}/g, '\n\n');
  } else if (gate === 'idea') {
    t = [marcaTexto(marca), '', linea('Formato', el.format), linea('Pilar', el.pillar), linea('Hook o idea', el.title), el.caption ? `Copy:\n${String(el.caption).trim()}` : ''].join('\n').replace(/\n{3,}/g, '\n\n');
  } else if (gate === 'etapa') {
    t = textoEtapa(contexto);
  } else throw new Error(`Puerta desconocida: ${gate}`);
  t = t.trim();
  return t.length > MAX_TEXTO ? t.slice(0, MAX_TEXTO) : t;
}

// ---------- leer lo que devuelve Laya ----------
const num01 = (v) => (Number.isFinite(+v) && v !== null && v !== '' && typeof v !== 'boolean' ? Math.min(1, Math.max(0, +v)) : null);
const pct = (p) => `${Math.round(p * 100)}%`;
export const corto = (s) => String(s || '').split(':')[0].trim();
// Acepta el resultado completo de Laya ({ model, answers, routing, usage }), el de laya_predict por MCP
// ({ answers, routing }), solo answers, o el mismo en texto JSON. Devuelve { ok, model, respuestas:[{ question_id, tipo, answer, prob?, score?, max?, why }] }.
// Con «preguntas» (las de preguntasDe) se queda solo con las que se hicieron y revisa que el tipo cuadre.
export function leerRespuesta(res, preguntas = null) {
  let r = res;
  if (typeof r === 'string') { try { r = JSON.parse(r); } catch { return { ok: false, model: null, respuestas: [], error: 'La respuesta de Laya no es JSON' }; } }
  if (!r || typeof r !== 'object') return { ok: false, model: null, respuestas: [], error: 'Laya no devolvió nada' };
  const answers = r.answers && typeof r.answers === 'object' ? r.answers : r;
  // routing.model dice qué checkpoint contestó («multilingual»); model a veces es solo el nombre genérico del agente.
  const model = str(r.routing?.model || r.model || '', 80) || null;
  const respuestas = [];
  for (const [id, a] of Object.entries(answers)) {
    if (!a || typeof a !== 'object' || !TIPOS.includes(a.type)) continue;
    const q = preguntas ? preguntas[id] : null;
    if (preguntas && (!q || q.type !== a.type)) continue;
    if (a.type === 'noul') {
      const p = num01(a.noul); if (p === null) continue;
      respuestas.push({ question_id: id, tipo: 'noul', answer: p >= 0.5 ? 'sí' : 'no', prob: Math.round(p * 10000) / 10000, why: `sí ${pct(p)} · no ${pct(1 - p)}` });
    } else if (a.type === 'score') {
      const legend = a.legend && typeof a.legend === 'object' ? a.legend : {};
      const levels = Object.keys(legend).length ? Object.keys(legend).sort((x, z) => +x - +z).map((k) => String(legend[k])) : (q?.criteria || []).map(String);
      const max = Math.max(1, levels.length - 1), s = Number.isFinite(+a.score) && a.score !== null ? Math.min(max, Math.max(0, +a.score)) : null; if (s === null) continue;
      const lvl = levels[Math.round(s)] || String(Math.round(s));
      respuestas.push({ question_id: id, tipo: 'score', answer: lvl, score: Math.round(s * 10000) / 10000, max, why: `${s.toFixed(1)} de ${max} · más cerca de «${corto(lvl)}»` });
    } else {
      const probs = a.probabilities && typeof a.probabilities === 'object' ? a.probabilities : {};
      const choice = typeof a.choice === 'string' ? a.choice : null; if (!choice) continue;
      if (q?.criteria && !(choice in q.criteria)) continue;
      const p = num01(probs[choice]);
      const top = Object.entries(probs).map(([k, v]) => [k, num01(v)]).filter(([, v]) => v !== null).sort((x, z) => z[1] - x[1]).slice(0, 3);
      respuestas.push({ question_id: id, tipo: 'choice', answer: choice, ...(p !== null ? { prob: Math.round(p * 10000) / 10000 } : {}), why: top.length ? top.map(([k, v]) => `${k} ${pct(v)}`).join(' · ') : '' });
    }
  }
  return { ok: respuestas.length > 0, model, respuestas, ...(respuestas.length ? {} : { error: 'Laya no devolvió respuestas que se puedan leer' }) };
}

// ---------- el umbral (vacío = sin umbral) ----------
// noul: la probabilidad de «sí» contra el umbral · score: la posición en la escala (0 a 1) contra el umbral · choice: no lleva.
export function cumple(q, j) {
  if (!q || q.umbral === null || q.umbral === undefined || !j) return null;
  if (q.tipo === 'noul' && Number.isFinite(j.prob)) return j.prob >= q.umbral;
  if (q.tipo === 'score' && Number.isFinite(j.score)) return j.score / (j.max || 1) >= q.umbral;
  return null;
}
export const umbralTexto = (q) => (q?.tipo === 'choice' ? '' : q?.umbral === null || q?.umbral === undefined ? 'sin umbral' : `umbral ${pct(q.umbral)}`);

// ---------- el chip ----------
// Lo que se dice de una respuesta en pocas palabras: «encaja 82%», «urgencia alta», «nivel Brand Growth».
export function frase(j, q) {
  const chip = q?.chip || String(j?.question_id || '').replace(/_/g, ' ');
  if (!j) return chip;
  if (j.tipo === 'noul') return `${chip} ${pct(j.prob)}`;
  if (j.tipo === 'score') return `${chip} ${corto(j.answer)}`;
  return `${chip} ${corto(j.answer)}`;
}
// Fase 4 · Investigación: el juicio de un referente en una línea — «Laya · sirve 84% · gancho» — y si sirve.
// Usa la primera pregunta sí/no (sirve) y la primera de opción (por qué funciona) de la puerta, aunque el CEO les cambie el id.
// r: lo que devuelve resumen(). sirve: true/false según el umbral (vacío = 50%), o null sin juicio.
export function chipReferente(r, puerta) {
  const qs = puerta?.preguntas || [], qS = qs.find((q) => q.tipo === 'noul'), qP = qs.find((q) => q.tipo === 'choice');
  const s = qS ? r?.ultimos?.[qS.id] : null, p = qP ? r?.ultimos?.[qP.id] : null;
  const prob = Number.isFinite(s?.prob) ? s.prob : null, um = Number.isFinite(qS?.umbral) ? qS.umbral : 0.5;
  const estado = r?.estado || 'vacio', por = p ? corto(p.answer) : null;
  if (prob === null && !por) return { estado, chip: estado === 'pendiente' ? 'Laya · pendiente' : 'Laya · sin juicio', sirve: null, prob: null, por: null };
  return { estado, chip: ['Laya', prob !== null ? `${qS.chip} ${pct(prob)}` : null, por].filter(Boolean).join(' · '), sirve: prob === null ? null : prob >= um, prob, por };
}
// Lo último por pregunta de los juicios de UN elemento → { estado:'vacio'|'pendiente'|'listo', chip:'Laya · encaja 82%', extra:[...], ultimos:{qid:juicio}, at }.
// Un pendiente más nuevo que la última respuesta manda: el chip dice «pendiente».
export function resumen(juicios = [], puerta = null) {
  const list = (Array.isArray(juicios) ? juicios : []).filter(Boolean).slice().sort((a, z) => String(z.at || '').localeCompare(String(a.at || '')));
  const pend = list.find((j) => j.status === 'pendiente'), hechos = list.filter((j) => j.status !== 'pendiente' && j.question_id);
  const ultimos = {}; for (const j of hechos) if (!ultimos[j.question_id]) ultimos[j.question_id] = j;
  const qs = puerta?.preguntas || [], orden = qs.length ? qs.map((q) => q.id).filter((id) => ultimos[id]) : Object.keys(ultimos);
  const at = hechos[0]?.at || null;
  if (pend && (!at || String(pend.at) >= String(at))) return { estado: 'pendiente', chip: 'Laya · pendiente', extra: orden.map((id) => frase(ultimos[id], qs.find((q) => q.id === id))), ultimos, at: pend.at, pendiente: pend };
  if (!orden.length) return { estado: 'vacio', chip: 'Laya · sin juicio', extra: [], ultimos, at: null };
  const [first, ...rest] = orden;
  return { estado: 'listo', chip: `Laya · ${frase(ultimos[first], qs.find((q) => q.id === first))}`, extra: rest.map((id) => frase(ultimos[id], qs.find((q) => q.id === id))), ultimos, at };
}
