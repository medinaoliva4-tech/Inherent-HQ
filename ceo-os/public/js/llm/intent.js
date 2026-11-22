// Intent-to-Interface (puro: sin DOM ni red). La IA no se pregunta «¿cómo presento esto bonito?» sino
//   «¿qué intenta conseguir la persona y cuál es la interacción MÁS SENCILLA que se lo permite?»
//
//   texto + datos ──▶ entender (qué quiere lograr) ──▶ elegir (del catálogo CERRADO) ──▶ simplificar ──▶ cerrar con una acción
//
// Reglas (PAQUETES-VISION · «Interfaz elegida»):
//   · la IA elige del catálogo (COMPONENTES de genui.js) y de las acciones del OS (acciones-os.js); no inventa ninguno;
//   · toda interfaz termina en una acción real; nunca una pantalla muerta;
//   · evidencia y confianza viajan con ella; sin fuente, se dice «SIN DATOS»;
//   · el texto de la persona solo ELIGE la intención: jamás nombra un componente, una acción ni se vuelve código.
import { COMPONENTES } from './genui.js';
import { validarAccion } from './acciones-os.js';

export const CATALOGO_VERSION = '1';
export const INTENCIONES = ['aprobar', 'simular', 'decidir', 'medir', 'revisar', 'planificar', 'producir', 'explorar'];

const sinAcento = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Las señales de cada intención. El orden de INTENCIONES desempata (aprobar y simular pesan más que explorar).
const SENALES = {
  aprobar: [/\baprueb\w*|\baprobar\b|visto bueno|\bdale (el )?ok\b|autoriz\w*/],
  simular: [/cuantos? (clientes|leads|ventas|necesito|hay que|me faltan)|cuanto (necesito|tengo que|me|hay que)|\bsi (subo|bajo|vendo|invierto|cobro)\b|escenario|simul\w*|que pasa si|proyecci\w*|calcul\w*/],
  decidir: [/deberi\w+|\bdebo\b|conviene|que hago|elegir|decid\w*|mejor opcion|vale la pena|\bsubo\b|\bbajo\b|\bpauto\b/],
  medir: [/como (va|vamos|nos fue)|resultado\w*|metric\w*|rendimiento|cuanto (llevamos|facturamos|vendimos|gastamos)|\bkpi\b|avance|seguimiento|\bcifras?\b/],
  revisar: [/revis\w+|comprueb\w+|compar\w+|critic\w+|esta bien|valid\w+|audit\w+|\bchequea\w*/],
  planificar: [/\bplan\b|planific\w+|calendario|cronograma|\bpasos\b|como lo hago|roadmap|organiz\w+|agend\w+|\bprograma\b/],
  producir: [/\bcrea\w*|\barma\w*|escrib\w+|genera\w*|redact\w+|\bhaz\b|prepara\w*|\bgraba\w*|diseña\w*|disena\w*|\bsube\b/],
  explorar: [/que hay|investig\w+|\bbusca\w*|analiz\w+|mercado|competenc\w+|referent\w+|opciones|\bideas?\b|explor\w+/],
};

// → { intent, confianza: 'alta'|'media'|'baja', senales:[…] }. Sin señal clara: explorar, con confianza baja (se muestra, pero pregunta poco).
export function entender(texto) {
  const t = sinAcento(String(texto ?? '').slice(0, 600)), puntos = {};
  for (const k of INTENCIONES) puntos[k] = SENALES[k].reduce((n, re) => n + (t.match(new RegExp(re.source, 'g')) || []).length, 0);
  const orden = [...INTENCIONES].sort((a, z) => puntos[z] - puntos[a] || INTENCIONES.indexOf(a) - INTENCIONES.indexOf(z));
  const [mejor, segundo] = orden, p = puntos[mejor];
  if (!p) return { intent: 'explorar', confianza: 'baja', senales: [] };
  return { intent: mejor, confianza: p > puntos[segundo] ? (p >= 2 ? 'alta' : 'media') : 'baja', senales: INTENCIONES.filter((k) => puntos[k]) };
}

const hayFilas = (d) => Array.isArray(d.filas) && d.filas.length && Array.isArray(d.columnas) && d.columnas.length;
const hayPasos = (d) => Array.isArray(d.pasos) && d.pasos.length;
// Elegir: del catálogo, la forma que logra la intención con menos trabajo según la FORMA de los datos. → { component, motivo }
export function elegir(intent, d = {}) {
  const pick = (component, motivo) => ({ component, motivo });
  if (intent === 'aprobar' || intent === 'decidir') return d.recomendacion ? pick('Decision', 'Hay una propuesta que solo tú puedes aprobar') : Array.isArray(d.opciones) && d.opciones.length >= 2 && hayFilas(d) ? pick('Compare', 'Hay dos o tres opciones: se comparan lado a lado') : pick('Summary', 'Primero la conclusión; la decisión cuando haya una propuesta');
  if (intent === 'simular') return d.herramienta ? pick('Tool', 'Se mueve en vivo en la herramienta, no se lee en un párrafo') : hayFilas(d) ? pick('Table', 'Los escenarios lado a lado') : pick('Summary', 'Sin herramienta a la mano: la conclusión y qué mover');
  if (intent === 'planificar') return hayPasos(d) ? pick('Timeline', 'Un proceso: pasos con estado y fecha') : pick('Steps', 'Pasos en orden');
  if (intent === 'producir') return Array.isArray(d.items) && d.items.length ? pick('Checklist', 'Lo que hay que tener listo, marcable') : d.herramienta ? pick('Tool', 'Se produce en su herramienta') : pick('Summary', 'Qué se va a producir');
  if (intent === 'revisar') return hayFilas(d) && d.columnas.length <= 4 ? pick('Compare', 'Comparar contra el criterio') : Array.isArray(d.items) && d.items.length ? pick('Checklist', 'Los criterios, uno por uno') : pick('Callout', 'Una observación con su motivo');
  if (intent === 'medir') return Array.isArray(d.series) && d.series.length ? pick('Chart', 'Una serie en el tiempo con su contexto') : d.valor != null && d.max != null ? pick('Gauge', 'Cuánto llevas contra el techo') : Array.isArray(d.cifras) && d.cifras.length ? pick('Summary', 'Pocas cifras con su conclusión') : pick('Metric', 'Una cifra con su contexto');
  return Array.isArray(d.matriz) && d.matriz.length ? pick('Heatmap', 'Un cruce de dos cosas, en un solo tono') : hayFilas(d) ? pick('Table', 'Datos para recorrer') : pick('Summary', 'La conclusión primero');
}

// La acción con la que SIEMPRE cierra (acciones del OS: lista cerrada; validarAccion limpia los argumentos).
const CIERRE = {
  aprobar: (d) => ['crearTarea', { titulo: d.titulo || d.recomendacion || 'Aprobado' }], decidir: (d) => ['crearTarea', { titulo: d.titulo || d.recomendacion || 'Decisión' }],
  simular: (d) => ['abrirHerramienta', { id: d.herramienta, slug: d.slug }], planificar: (d) => ['crearTarea', { titulo: d.titulo || 'Primer paso del plan' }],
  producir: (d) => ['abrirHerramienta', { id: d.herramienta, slug: d.slug }], revisar: () => ['pedir', { texto: 'Pide los cambios que faltan' }],
  medir: () => ['pedir', { texto: 'Explícame qué mueve este número' }], explorar: () => ['pedir', { texto: 'Profundiza en lo más importante' }],
};
const PEDIR = ['pedir', { texto: 'Cuéntame cuál es el siguiente paso' }];
function cierre(intent, d) {
  for (const [n, a] of [d.accion ? [d.accion.nombre || d.accion.id, d.accion.args] : null, CIERRE[intent]?.(d), PEDIR].filter(Boolean)) { const v = validarAccion(n, a); if (v) return { id: v.nombre, args: v.args }; }
  return null;
}
const corto = (x, n = 240) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// armar(texto, datos) → la interfaz elegida: { intent, catalog_version, component, props, evidence, next_action, motivo }
// datos = lo que el llamador ya sabe y es REAL: { conclusion, recomendacion, motivo, titulo, filas, columnas, series, pasos, items, matriz, cifras,
//          valor, max, herramienta, slug, fuente, confianza, accion:{nombre,args} }. Lo que no se pasa, no se inventa.
export function armar(texto, datos = {}) {
  const d = datos && typeof datos === 'object' ? datos : {}, e = entender(texto), c = elegir(e.intent, d);
  const props = propsDe(c.component, d);
  const sinFuente = !corto(d.fuente);
  const spec = { intent: e.intent, catalog_version: CATALOGO_VERSION, component: c.component, props, motivo: c.motivo,
    evidence: { fuente: corto(d.fuente, 200), confianza: sinFuente ? 'sin datos' : ['alta', 'media', 'baja'].includes(d.confianza) ? d.confianza : 'media', sinDatos: sinFuente },
    next_action: cierre(e.intent, d), lectura: e.confianza };
  const v = validar(spec); if (!v.ok) throw new Error(`Interfaz no válida: ${v.errores.join(' · ')}`);
  return spec;
}
// Las props de cada componente: solo lo que el esquema de genui.js conoce, y con tope.
function propsDe(c, d) {
  const L = (a, n = 30) => (Array.isArray(a) ? a.slice(0, n) : []);
  switch (c) {
    case 'Decision': return { titulo: corto(d.titulo || d.recomendacion, 120), recomendacion: corto(d.recomendacion, 200), motivo: corto(d.motivo, 240) };
    case 'Compare': return { columnas: L(d.columnas, 3).map((x) => corto(x, 60)), filas: L(d.filas).map((f) => L(f, 4).map((x) => corto(x, 80))), recomendada: corto(d.recomendada, 60) };
    case 'Table': return { columnas: L(d.columnas, 8).map((x) => corto(x, 60)), filas: L(d.filas, 40).map((f) => L(f, 8).map((x) => corto(x, 80))) };
    case 'Timeline': return { items: L(d.pasos).map((p) => [corto(p[0], 80), ['hecho', 'ahora', 'pendiente', 'bloqueado'].includes(p[1]) ? p[1] : 'pendiente', corto(p[2], 40)]) };
    case 'Steps': return { items: L(d.pasos).map((p) => corto(Array.isArray(p) ? p[0] : p, 120)) };
    case 'Checklist': return { titulo: corto(d.titulo || 'Antes de empezar', 80), items: L(d.items).map((x) => corto(x, 100)) };
    case 'Chart': return { tipo: ['barras', 'linea', 'sparkline'].includes(d.tipo) ? d.tipo : 'linea', etiquetas: L(d.etiquetas).map((x) => corto(x, 20)), series: L(d.series, 3), unidad: corto(d.unidad, 20) };
    case 'Gauge': return { label: corto(d.titulo || 'Avance', 60), valor: corto(d.valor, 20), max: corto(d.max, 20), nota: corto(d.motivo, 80) };
    case 'Metric': return { label: corto(d.titulo || 'Cifra', 60), valor: corto(d.valor, 24), nota: corto(d.motivo, 80) };
    case 'Heatmap': return { filas: L(d.filas, 12).map((x) => corto(x, 40)), columnas: L(d.columnas, 12).map((x) => corto(x, 40)), valores: L(d.matriz, 12), nota: corto(d.motivo, 100) };
    case 'Tool': return { id: corto(d.herramienta, 60), slug: corto(d.slug, 60), titulo: corto(d.titulo, 80) };
    case 'Callout': return { tono: ['ok', 'atencion', 'error', 'info'].includes(d.tono) ? d.tono : 'info', titulo: corto(d.titulo || d.conclusion, 100), texto: corto(d.motivo, 240) };
    default: return { conclusion: corto(d.conclusion || d.titulo || d.recomendacion, 200), cifras: L(d.cifras, 3).map((x) => L(x, 2).map((y) => corto(y, 40))) };
  }
}

// ---------- Validar (para lo que venga de afuera: la respuesta de un modelo, un JSON guardado) ----------
const CODIGO = /<\s*\/?\s*[a-z!][^>]*>|javascript\s*:|data\s*:|\bon\w+\s*=|https?:\/\/|\/\/\w+\.\w+/i;
function limpioDe(x, prof = 0, errs = []) {
  if (prof > 6) { errs.push('demasiado anidado'); return; }
  if (typeof x === 'string') { if (CODIGO.test(x)) errs.push('contiene código, HTML o un enlace'); if (x.length > 600) errs.push('texto demasiado largo'); return; }
  if (Array.isArray(x)) { if (x.length > 60) errs.push('lista demasiado larga'); x.forEach((y) => limpioDe(y, prof + 1, errs)); return; }
  if (x && typeof x === 'object') { for (const [k, v] of Object.entries(x)) { if (['__proto__', 'constructor', 'prototype'].includes(k)) errs.push('llave prohibida'); limpioDe(v, prof + 1, errs); } }
}
export function validar(spec) {
  const errores = [];
  if (!spec || typeof spec !== 'object') return { ok: false, errores: ['no es una interfaz'] };
  if (spec.catalog_version !== CATALOGO_VERSION) errores.push('versión de catálogo distinta');
  if (!INTENCIONES.includes(spec.intent)) errores.push(`intención fuera del catálogo: ${corto(spec.intent, 30)}`);
  if (!COMPONENTES.includes(spec.component)) errores.push(`componente fuera del catálogo: ${corto(spec.component, 30)}`);
  if (!spec.props || typeof spec.props !== 'object' || Array.isArray(spec.props)) errores.push('faltan las props');
  if (!spec.evidence || typeof spec.evidence !== 'object') errores.push('falta la evidencia');
  if (!spec.next_action || !validarAccion(spec.next_action.id, spec.next_action.args)) errores.push('falta una acción real para cerrar (o no está en el catálogo)');
  limpioDe(spec.props, 0, errores); limpioDe(spec.evidence, 0, errores);
  if (JSON.stringify(spec).length > 20000) errores.push('demasiado grande');
  return { ok: !errores.length, errores: [...new Set(errores)] };
}

// ---------- A OpenUI Lang (lo que el Chat sabe dibujar) ----------
const q = (s) => JSON.stringify(String(s ?? ''));
const lista = (xs) => `[${xs.map((x) => (Array.isArray(x) ? lista(x) : typeof x === 'number' ? x : q(x))).join(', ')}]`;
export function aLang(spec) {
  const v = validar(spec); if (!v.ok) throw new Error(`Interfaz no válida: ${v.errores.join(' · ')}`);
  const p = spec.props, a = spec.next_action, boton = `Boton(${q(a.id === 'crearTarea' ? 'Crear tarea' : a.id === 'abrirHerramienta' ? 'Abrir' : 'Seguir')}, ${q(a.id)}, ${JSON.stringify(a.args)})`;
  const nodo = { Decision: () => `Decision(${q(p.titulo)}, ${q(p.recomendacion)}, ${q(p.motivo)}, b)`, Compare: () => `Compare(${lista(p.columnas)}, ${lista(p.filas)}, ${q(p.recomendada)})`,
    Table: () => `Table(${lista(p.columnas)}, ${lista(p.filas)})`, Timeline: () => `Timeline(${lista(p.items)})`, Steps: () => `Steps(${lista(p.items)})`, Checklist: () => `Checklist(${q(p.titulo)}, ${lista(p.items)})`,
    Chart: () => `Chart(${q(p.tipo)}, ${lista(p.etiquetas)}, ${lista(p.series)}, ${q(p.unidad)})`, Gauge: () => `Gauge(${q(p.label)}, ${Number(p.valor) || 0}, ${Number(p.max) || 1}, ${q(p.nota)})`,
    Metric: () => `Metric(${q(p.label)}, ${q(p.valor)}, ${q(p.nota)})`, Heatmap: () => `Heatmap(${lista(p.filas)}, ${lista(p.columnas)}, ${lista(p.valores)}, ${q(p.nota)})`,
    Tool: () => `Tool(${q(p.id)}, ${q(p.slug)}, ${q(p.titulo)})`, Callout: () => `Callout(${q(p.tono)}, ${q(p.titulo)}, ${q(p.texto)})`, Summary: () => `Summary(${q(p.conclusion)}, ${lista(p.cifras)})` }[spec.component];
  if (!nodo) throw new Error(`Sin forma de dibujar ${spec.component}`);
  const fuente = spec.evidence.sinDatos ? '⚠️ SIN DATOS' : `Fuente: ${spec.evidence.fuente} · confianza ${spec.evidence.confianza}`;
  const partes = ['x', 'f'], defs = [`x = ${nodo()}`, `f = Text(${q(fuente)})`];
  if (spec.component !== 'Decision') { partes.push('a'); defs.push('a = Actions([b])'); } // la Decision ya lleva su botón
  defs.push(`b = ${boton}`);
  return `root = Stack([${partes.join(', ')}])\n${defs.join('\n')}`;
}

// ---------- Lo que se le enseña al modelo (se suma a PROMPT_GENUI) ----------
export const PROMPT_INTENT = `INTENCIÓN ANTES QUE FORMA
Antes de dibujar nada pregúntate: «¿qué intenta conseguir esta persona y cuál es la interacción más sencilla que se lo permite?». No: «¿cómo presento esto bonito?».
1. ENTIENDE qué quiere lograr: aprobar · simular · decidir · medir · revisar · planificar · producir · explorar.
2. ELIGE del catálogo la forma que lo logra con menos trabajo (una propuesta → Decision; escenarios → la herramienta con sus controles, Tool; un proceso → Timeline; una serie → Chart; criterios → Checklist; dos opciones → Compare). Nunca inventes un componente ni una acción.
3. SIMPLIFICA: la conclusión primero; el detalle plegado. Simplificar no es esconder lo que hace falta para decidir.
4. CIERRA con una acción real (crear tarea, abrir la herramienta, pedir el siguiente paso). Una interfaz sin acción no se dibuja.
5. Si la persona puede lograrlo con una frase, usa una frase. Si falta el dato, dilo («⚠️ SIN DATOS») y di de dónde saldría; no lo rellenes.
Si hay algo que puedes averiguar tú (el sitio del cliente, su industria, lo ya aprobado), averígualo y propón; pregunta solo lo que únicamente la persona sabe.`;
