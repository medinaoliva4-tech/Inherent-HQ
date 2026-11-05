// F4.5 · UI generativa en el Chat (PLAN-GATEWAY §20.10). El modelo escribe un bloque ```ui en OpenUI Lang y aquí se dibuja con
// los componentes y el vidrio del OS. De OpenUI solo se usa su lector (public/vendor, MIT, sin React y sin telemetría):
// se carga la primera vez que un mensaje trae un bloque. Lo que escribe un modelo es dato no confiable: todo se escapa, nada
// lleva enlaces, y un botón Pedir solo deja un texto en la caja, a la vista, y la persona decide si lo envía.
const str = {}, arr = { type: 'array' }; // str sin tipo: un número (Metric("x", 10000)) también se muestra
const comp = (props, required) => ({ type: 'object', properties: props, required });
export const ESQUEMA_UI = {
  $defs: {
    Stack: comp({ children: arr }, ['children']),
    Card: comp({ titulo: str, children: arr }, ['titulo']),
    Text: comp({ texto: str }, ['texto']),
    Metric: comp({ label: str, valor: str, nota: str }, ['label', 'valor']),
    Table: comp({ columnas: arr, filas: arr }, ['columnas', 'filas']),
    Steps: comp({ items: arr }, ['items']),
    List: comp({ items: arr }, ['items']),
    Question: comp({ texto: str, opciones: arr }, ['texto', 'opciones']),
    Pedir: comp({ label: str, pedido: str }, ['label', 'pedido']),
  },
};
ESQUEMA_UI.properties = Object.fromEntries(Object.keys(ESQUEMA_UI.$defs).map((k) => [k, {}]));

export const PROMPT_GENUI = `INTERFAZ EN EL CHAT
Cuando una comparación, unas cifras, unos pasos u opciones se entiendan mejor que un párrafo, dibújalos con un bloque \`\`\`ui en OpenUI Lang. Lo demás va en texto normal, y el texto explica lo que el bloque muestra.
Cada línea es nombre = Componente(argumentos en orden). La primera siempre es root = Stack([...]). Se referencian por nombre.
Componentes:
Stack(children) · Card(titulo, children) · Text(texto) · Metric(label, valor, nota) · Table(columnas, filas) · Steps(items) · List(items) · Question(texto, opciones) · Pedir(label, pedido)
Reglas: solo datos reales (de tus herramientas, del OS o de lo hablado); si no tienes el dato no lo llenes. Máximo 1 bloque por respuesta. Pedir no hace nada por sí solo: deja «pedido» escrito en la caja para que la persona lo revise y lo envíe. Sin colores ni enlaces.
Ejemplo:
\`\`\`ui
root = Stack([c, t, q])
c = Card("Ventas de enero", [m])
m = Metric("Total", "Q10,000", "5% más que diciembre")
t = Table(["Canal", "Ventas"], [["Instagram", "Q6,000"], ["WhatsApp", "Q4,000"]])
q = Question("¿Qué revisamos primero?", ["Instagram", "WhatsApp"])
\`\`\``;

// El mensaje partido en texto e interfaz. Un bloque sin cerrar es el que se está escribiendo.
export function partirUi(texto) {
  const t = String(texto || ''), out = [], re = /```ui[ \t]*\r?\n([\s\S]*?)(?:```|$)/g;
  let i = 0, m;
  while ((m = re.exec(t))) {
    if (m.index > i) out.push({ tipo: 'md', t: t.slice(i, m.index) });
    out.push({ tipo: 'ui', t: m[1] });
    i = m.index + m[0].length;
    if (m[0].length === 0) break;
  }
  if (i < t.length || !out.length) out.push({ tipo: 'md', t: t.slice(i) });
  return out;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lista = (x, n = 40) => (Array.isArray(x) ? x.slice(0, n) : []);
const txt0 = (x) => (x && typeof x === 'object' ? '' : x);
const txt = (x) => esc(txt0(x));
// Lo que el modelo pone en un botón no puede arrancar un comando ni llamar a un agente, y tiene tope.
export const limpiaPedido = (t) => String(t ?? '').trim().replace(/^[/@\s]+/, '').slice(0, 300);
// Topes: un bloque chico puede expandirse sin fin con referencias (a = Stack([b, b]), b = Stack([c, c])…).
const MAX_FUENTE = 12000, MAX_NODOS = 300, MAX_HTML = 50000;
const sinCadenas = (l) => l.replace(/"(?:[^"\\]|\\.)*"?/g, '""');
function expandeDemasiado(src) {
  const defs = new Map();
  for (const l of String(src).split('\n')) { const m = /^\s*([A-Za-z_]\w*)\s*=\s*(.*)$/.exec(l); if (m) defs.set(m[1], sinCadenas(m[2])); }
  const memo = new Map();
  const peso = (k, pila) => {
    if (memo.has(k)) return memo.get(k);
    if (pila.has(k)) return Infinity; // se llama a sí mismo
    pila.add(k);
    let n = 1;
    for (const m of (defs.get(k) || '').matchAll(/\b[A-Za-z_]\w*\b/g)) if (defs.has(m[0])) { n += peso(m[0], pila); if (n > MAX_NODOS * 4) break; }
    pila.delete(k); memo.set(k, n); return n;
  };
  return (defs.has('root') ? peso('root', new Set()) : 0) > MAX_NODOS * 4;
}
function dibujar(n, o) {
  if (Array.isArray(n)) return n.map((x) => dibujar(x, o)).join('');
  if (!n || n.type !== 'element' || ++o.nodos > MAX_NODOS) return '';
  const p = n.props || {}, hijos = () => dibujar(lista(p.children), o), off = o.apagado ? ' disabled' : '';
  switch (n.typeName) {
    case 'Stack': return `<div class="gu-stack">${hijos()}</div>`;
    case 'Card': return `<section class="gu-card"><b>${txt(p.titulo)}</b>${hijos()}</section>`;
    case 'Text': return `<p class="gu-text">${txt(p.texto)}</p>`;
    case 'Metric': return `<div class="gu-metric"><span>${txt(p.label)}</span><b>${txt(p.valor)}</b>${p.nota ? `<small>${txt(p.nota)}</small>` : ''}</div>`;
    case 'Table': return `<div class="gu-tabla"><table><thead><tr>${lista(p.columnas, 12).map((c) => `<th>${txt(c)}</th>`).join('')}</tr></thead><tbody>${lista(p.filas, 60).map((f) => `<tr>${lista(f, 12).map((c) => `<td>${txt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'Steps': return `<ol class="gu-steps">${lista(p.items).map((x) => `<li>${txt(x)}</li>`).join('')}</ol>`;
    case 'List': return `<ul class="gu-list">${lista(p.items).map((x) => `<li>${txt(x)}</li>`).join('')}</ul>`;
    case 'Question': return `<div class="gu-q"><b>${txt(p.texto)}</b><div class="lm-ops">${lista(p.opciones, 6).map((x) => `<button type="button" data-a="opcion" data-t="${esc(limpiaPedido(txt0(x)))}"${off}>${txt(x)}</button>`).join('')}</div></div>`;
    case 'Pedir': return `<div class="lm-ops"><button type="button" class="si" data-a="ui-pedir" data-t="${esc(limpiaPedido(txt0(p.pedido)))}"${off}>${txt(p.label)}</button></div>`;
    default: return '';
  }
}
const fuente = (src) => `<pre class="gu-src">${esc(String(src).slice(0, 2000))}</pre>`;
// → el HTML de un bloque (ya escapado). '' si todavía no hay nada que dibujar. final: la respuesta terminó, así que lo que no se
// pudo dibujar se muestra como texto en vez de desaparecer.
export function uiHtml(src, createStreamingParser, { apagado = false, final = false } = {}) {
  const t = String(src || ''); if (!t.trim()) return '';
  const nada = final ? fuente(t) : '';
  if (t.length > MAX_FUENTE || expandeDemasiado(t)) return final ? fuente(t) : '';
  try {
    const r = createStreamingParser(ESQUEMA_UI, 'Stack').set(t, true);
    if (!r.root) return nada;
    const h = dibujar(r.root, { apagado, nodos: 0 });
    if (h.length > MAX_HTML) return nada;
    return /<(b|p|td|li|span|button)\b/.test(h) ? `<div class="gu">${h}</div>` : nada;
  } catch { return nada; }
}
// El mensaje sin el código del bloque, con sus datos (para el contexto de los agentes y para Copiar).
export function sinUi(texto) {
  return String(texto || '').replace(/```ui[ \t]*\r?\n([\s\S]*?)(?:```|$)/g, (_, src) => {
    const xs = [...src.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\(.)/g, '$1'));
    return xs.join(' · ');
  }).trim();
}

// El lector se trae una sola vez. Si no se pudo traer, el bloque se muestra como texto (lectorUi.fallo) y no se reintenta hasta recargar.
let lector = null, cargando = null, avisar = null;
export const lectorFallo = () => cargando === 'fallo';
export function lectorUi(onListo) {
  if (lector) return lector;
  avisar = onListo;
  cargando ||= import('../../vendor/openui-lang-core-1.1.0.min.js').then((m) => { lector = m.createStreamingParser; avisar?.(); }).catch(() => { cargando = 'fallo'; avisar?.(); });
  return null;
}
