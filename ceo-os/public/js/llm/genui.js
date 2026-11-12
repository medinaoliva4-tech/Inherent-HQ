// F4.5 · UI generativa en el Chat (PLAN-GATEWAY §20.10). El modelo escribe un bloque ```ui en OpenUI Lang y aquí se dibuja con
// los componentes y el vidrio del OS. De OpenUI solo se usa su lector (public/vendor, MIT, sin React y sin telemetría):
// se carga la primera vez que un mensaje trae un bloque. Lo que escribe un modelo es dato no confiable: todo se escapa, nada
// lleva enlaces, y ningún botón corre solo. Pedir y Question dejan un texto en la caja; los botones del OS (Boton, Decision,
// Tool, Guardar…) pasan por el registro cerrado de llm/acciones-os.js, y la persona hace clic.
// El catálogo (docs/openui.md): cada contenido pide su patrón. Resumen primero, detalle plegado; tabla para datos, timeline para
// procesos, matriz para cruces y tarjeta solo para decisiones. Gráficas en CSS/SVG propio, con los tokens --ui-*.
import { validarAccion, instalarAccionesUi, ejecutarAccion } from './acciones-os.js';

const str = {}, arr = { type: 'array' }; // str sin tipo: un número (Metric("x", 10000)) también se muestra
const comp = (props, required) => ({ type: 'object', properties: props, required });
// El orden de las propiedades es el orden de los argumentos: Componente(arg1, arg2, …).
export const ESQUEMA_UI = {
  $defs: {
    Stack: comp({ children: arr }, ['children']),
    Row: comp({ children: arr }, ['children']),
    Card: comp({ titulo: str, children: arr }, ['titulo']),
    Text: comp({ texto: str }, ['texto']),
    Metric: comp({ label: str, valor: str, nota: str }, ['label', 'valor']),
    Summary: comp({ conclusion: str, cifras: arr }, ['conclusion']),
    Callout: comp({ tono: str, titulo: str, texto: str }, ['tono', 'titulo']),
    Tag: comp({ texto: str, tono: str }, ['texto']),
    Table: comp({ columnas: arr, filas: arr, barra: str }, ['columnas', 'filas']),
    KeyValue: comp({ pares: arr }, ['pares']),
    Compare: comp({ columnas: arr, filas: arr, recomendada: str }, ['columnas', 'filas']),
    Timeline: comp({ items: arr }, ['items']),
    Steps: comp({ items: arr }, ['items']),
    List: comp({ items: arr }, ['items']),
    Checklist: comp({ titulo: str, items: arr }, ['titulo', 'items']),
    Collapse: comp({ titulo: str, children: arr }, ['titulo', 'children']),
    Heatmap: comp({ filas: arr, columnas: arr, valores: arr, nota: str }, ['filas', 'columnas', 'valores']),
    Chart: comp({ tipo: str, etiquetas: arr, series: arr, unidad: str }, ['tipo', 'series']),
    Gauge: comp({ label: str, valor: str, max: str, nota: str }, ['label', 'valor']),
    Decision: comp({ titulo: str, recomendacion: str, motivo: str, accion: str }, ['titulo', 'recomendacion']),
    Actions: comp({ botones: arr }, ['botones']),
    Boton: comp({ label: str, accion: str, args: str }, ['label', 'accion']),
    Tool: comp({ id: str, slug: str, titulo: str }, ['id']),
    Artifact: comp({ ref: str, titulo: str }, ['ref']),
    Guardar: comp({ destino: str, slug: str, datos: str, resumen: str }, ['destino', 'datos']),
    Question: comp({ texto: str, opciones: arr }, ['texto', 'opciones']),
    Pedir: comp({ label: str, pedido: str }, ['label', 'pedido']),
  },
};
ESQUEMA_UI.properties = Object.fromEntries(Object.keys(ESQUEMA_UI.$defs).map((k) => [k, {}]));
export const COMPONENTES = Object.keys(ESQUEMA_UI.$defs);

export const PROMPT_GENUI = `INTERFAZ EN EL CHAT
Cuando unas cifras, una comparación, un proceso, un cruce o una decisión se entiendan mejor que un párrafo, dibújalos con un bloque \`\`\`ui en OpenUI Lang. El texto normal explica lo que el bloque muestra.
Cada línea es nombre = Componente(argumentos en orden; null salta uno). La primera siempre es root = Stack([...]). Se referencian por nombre.
Resumen primero, detalle plegado: abre con Summary y deja lo largo en Collapse. Elige el patrón por el contenido:
- cifras: Summary(conclusión, [["Ventas","Q10,000"], …máx 3]) · Metric(label, valor, nota) · Gauge(label, valor, max, nota) · Row([…]) los pone lado a lado
- datos: Table(columnas, filas, barra) (barra = la columna numérica que lleva barra en línea) · KeyValue([[clave, valor]]) · Compare(["", "A", "B"], filas, recomendada)
- procesos: Timeline([[texto, "hecho"|"ahora"|"pendiente"|"bloqueado", fecha]]) · Steps(items) · Checklist(titulo, items) (la persona marca)
- cruces: Heatmap(filas, columnas, valores numéricos, nota) · tendencias: Chart("barras"|"linea"|"sparkline", etiquetas, [números] o [["Serie", [números]]] máx 3, unidad)
- avisos: Callout("ok"|"atencion"|"error"|"info", titulo, texto) · Tag(texto, tono) va también dentro de una celda (p. ej. Tag("quemado", "error"))
- decisiones: Decision(titulo, recomendación, motivo, Boton) (Aprobar corre el Boton; Cambiar y Después los decide la persona) · Card(titulo, children) solo para agrupar una decisión
- acciones: Actions([Boton(label, accion, {args})]) con accion: abrirHerramienta {id, slug} · abrirEnChat {modo, slug, borrador} · imprimir {} · crearTarea {titulo} · copiar {texto} · pedir {texto}
- herramientas: Tool(id, slug, titulo) abre una herramienta del OS · Artifact(ref, titulo) la abre en el panel · Guardar(destino, slug, {datos}, resumen) propone guardar lo platicado (la persona aprueba)
- la conversación: Question(texto, opciones) · Pedir(label, pedido) deja el pedido en la caja
Reglas: solo datos reales (de tus herramientas, del OS o de lo hablado); si no tienes el dato no lo llenes. Máximo 3 bloques por respuesta, uno casi siempre basta. Ningún botón hace algo solo: la persona hace clic. Sin colores ni enlaces.
Ejemplo:
\`\`\`ui
root = Stack([s, t, d])
s = Summary("Instagram vende 60% con la mitad del esfuerzo", [["Total", "Q10,000"], ["Instagram", "Q6,000"], ["WhatsApp", "Q4,000"]])
t = Collapse("Ver por canal", [tb])
tb = Table(["Canal", "Ventas", "Estado"], [["Instagram", 6000, Tag("sube", "ok")], ["WhatsApp", 4000, Tag("quemado", "error")]], "Ventas")
d = Decision("Mover pauta a Instagram", "Pasar Q1,000 de WhatsApp a Instagram en diciembre", "Rinde 1.5× por quetzal", Boton("Crear la tarea", "crearTarea", {titulo: "Mover Q1,000 de pauta a Instagram"}))
\`\`\``;
// Para la voz o un modo con su propio sistema (Code): lo mínimo. No se usa todavía (ver docs/openui.md · «Code y voz»).
export const PROMPT_GENUI_MIN = 'Si una cifra o una tabla ayuda, puedes cerrar con UN bloque ```ui chico (root = Stack([...]) con Summary, Table o Timeline). Nunca lo leas en voz alta ni pongas botones.';

// ---------- Partir el mensaje ----------
export const MAX_BLOQUES = 3;
// El mensaje partido en texto e interfaz. Un bloque sin cerrar es el que se está escribiendo. Del 4º bloque en adelante se queda
// como texto (código), no se dibuja.
export function partirUi(texto) {
  const t = String(texto || ''), out = [], re = /```ui[ \t]*\r?\n([\s\S]*?)(?:```|$)/g;
  let i = 0, m, n = 0;
  while ((m = re.exec(t))) {
    if (m.index > i) out.push({ tipo: 'md', t: t.slice(i, m.index) });
    out.push(++n > MAX_BLOQUES ? { tipo: 'md', t: m[0] } : { tipo: 'ui', t: m[1] });
    i = m.index + m[0].length;
    if (m[0].length === 0) break;
  }
  if (i < t.length || !out.length) out.push({ tipo: 'md', t: t.slice(i) });
  // Los bloques de texto seguidos (el 4º bloque y lo que lo rodea) se juntan.
  return out.reduce((a, p) => { const u = a[a.length - 1]; if (u && u.tipo === 'md' && p.tipo === 'md') u.t += p.t; else a.push({ ...p }); return a; }, []);
}

// ---------- Utilidades ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lista = (x, n = 40) => (Array.isArray(x) ? x.slice(0, n) : []);
const txt0 = (x) => (x && typeof x === 'object' ? '' : x);
const txt = (x) => esc(txt0(x));
const esEl = (x) => x && typeof x === 'object' && x.type === 'element';
const num = (x) => { if (typeof x === 'number') return Number.isFinite(x) ? x : null; const s = String(txt0(x) ?? '').replace(/[^\d.,-]/g, '').replace(/,/g, ''); const n = parseFloat(s); return Number.isFinite(n) ? n : null; };
const pct = (v, max) => Math.max(0, Math.min(100, Math.round((v / (max || 1)) * 1000) / 10));
// Lo que el modelo pone en un botón no puede arrancar un comando ni llamar a un agente, y tiene tope.
export const limpiaPedido = (t) => String(t ?? '').trim().replace(/^[/@\s]+/, '').slice(0, 300);
// Los tonos de estado del OS (visual.js · estado()): ok → vivo, atención → medio, error → caído, info.
const TONO = { ok: 'ok', atencion: 'amb', 'atención': 'amb', warn: 'amb', error: 'bad', info: 'info' };
const PUNTO = { ok: 'vivo', amb: 'medio', bad: 'caido', info: 'info' };
export const tonoUi = (t) => TONO[String(txt0(t) || '').toLowerCase().trim()] || '';
const punto = (t) => `<i class="vz-punto vz-p-${PUNTO[t] || 'off'}" aria-hidden="true"></i>`;
const ESTADOS_TL = { hecho: 'hecho', listo: 'hecho', ahora: 'ahora', 'en curso': 'ahora', pendiente: 'pendiente', bloqueado: 'bloqueado' };
const NOMBRE_TL = { hecho: 'Hecho', ahora: 'En curso', pendiente: 'Pendiente', bloqueado: 'Bloqueado' };

// La llave de un bloque para recordar lo que la persona marcó (Checklist, Decision): la conversación + el bloque + su nombre.
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };
const sesionActual = () => { try { return /#\/chat\/(?:trabajo\/)?([^/?#]+)/.exec(location.hash)?.[1] || 'chat'; } catch { return 'chat'; } };
export function leerEstadoUi(k) { try { return JSON.parse(localStorage.getItem('gu.' + k) || 'null'); } catch { return null; } }
export function guardarEstadoUi(k, v) { try { localStorage.setItem('gu.' + k, JSON.stringify(v)); } catch { /* sin memoria no se recuerda */ } }

// Un botón del OS: solo si la acción pasa el registro. off: el bloque todavía se está escribiendo.
function boton(label, accion, args, o, clase = '') {
  const v = validarAccion(accion, args && typeof args === 'object' ? args : {});
  if (!v) return '';
  return `<button type="button" class="gu-b${clase ? ' ' + clase : ''}" data-gu-acc="${esc(v.nombre)}" data-gu-args="${esc(JSON.stringify(v.args))}"${o.vivo ? '' : ' disabled'}>${txt(label) || esc(v.nombre)}</button>`;
}
const botonDe = (n, o, clase) => (esEl(n) && n.typeName === 'Boton' ? boton(n.props?.label, n.props?.accion, n.props?.args, o, clase) : '');

// Una celda o un dato: texto, número o un Tag adentro.
function celda(x, o) {
  if (esEl(x)) return x.typeName === 'Tag' || x.typeName === 'Boton' ? dibujar(x, o) : '';
  return txt(x);
}

// ---------- Gráficas (sin librería: CSS y SVG con los tokens del tema) ----------
// Barras: columnas HTML (nítidas a cualquier ancho). Línea y sparkline: SVG estirado con trazo que no escala. Cada marca lleva
// su título (el tooltip nativo) y abajo va la tabla para lectores de pantalla.
function seriesDe(p) {
  const s = lista(p.series, 3);
  if (s.length && s.every((x) => typeof x === 'number' || num(x) !== null && !Array.isArray(x))) return [{ nombre: '', v: lista(p.series, 60).map(num) }];
  return s.filter(Array.isArray).map((x) => ({ nombre: String(txt0(x[0]) ?? ''), v: lista(x[1], 60).map(num) })).filter((x) => x.v.length);
}
function chart(p, o) {
  const tipo = ['barras', 'linea', 'sparkline'].includes(p.tipo) ? p.tipo : 'barras', ss = seriesDe(p);
  if (!ss.length) return '';
  const n = Math.max(...ss.map((s) => s.v.length)), et = Array.from({ length: n }, (_, i) => String(txt0(lista(p.etiquetas, 60)[i]) ?? ''));
  const vs = ss.flatMap((s) => s.v).filter((v) => v !== null), max = Math.max(0, ...vs), min = Math.min(0, ...vs), u = txt(p.unidad), uR = String(txt0(p.unidad) ?? '');
  const tabla = `<table class="sr-only"><thead><tr><th>${u || 'Dato'}</th>${ss.map((s) => `<th>${esc(s.nombre || 'Valor')}</th>`).join('')}</tr></thead><tbody>${et.map((e, i) => `<tr><td>${esc(e)}</td>${ss.map((s) => `<td>${s.v[i] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const leyenda = ss.length > 1 ? `<div class="gu-ley">${ss.map((s, k) => `<span><i class="gu-c${k + 1}"></i>${esc(s.nombre)}</span>`).join('')}</div>` : '';
  if (tipo === 'sparkline') {
    const v = ss[0].v, pts = v.map((y, i) => (y === null ? null : `${(i / Math.max(1, v.length - 1)) * 100},${40 - ((y - min) / ((max - min) || 1)) * 36 - 2}`)).filter(Boolean).join(' ');
    const ult = v.filter((x) => x !== null).at(-1);
    return `<span class="gu-spark" role="img" aria-label="${esc(`${ss[0].nombre || 'Tendencia'}: ${v.filter((x) => x !== null).join(', ')}${uR ? ' ' + uR : ''}`)}"><svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" vector-effect="non-scaling-stroke"/></svg><b>${ult ?? ''}${u ? ' ' + u : ''}</b></span>`;
  }
  if (tipo === 'linea') {
    const lineas = ss.map((s, k) => `<polyline class="gu-l${k + 1}" points="${s.v.map((y, i) => (y === null ? null : `${(i / Math.max(1, n - 1)) * 100},${100 - ((y - min) / ((max - min) || 1)) * 92 - 4}`)).filter(Boolean).join(' ')}" vector-effect="non-scaling-stroke"/>`).join('');
    const zonas = et.map((e, i) => `<i title="${esc(`${e}: ${ss.map((s) => `${s.nombre ? s.nombre + ' ' : ''}${s.v[i] ?? '—'}`).join(' · ')}${uR ? ' ' + uR : ''}`)}"></i>`).join('');
    return `<figure class="gu-chart gu-linea">${leyenda}<div class="gu-plot"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line class="gu-base" x1="0" x2="100" y1="96" y2="96" vector-effect="non-scaling-stroke"/>${lineas}</svg><div class="gu-zonas" style="--n:${n}">${zonas}</div><span class="gu-ymax">${max}${u ? ' ' + u : ''}</span></div><div class="gu-ejex"><span>${esc(et[0])}</span><span>${esc(et[n - 1])}</span></div>${tabla}</figure>`;
  }
  const grupos = et.map((e, i) => `<div class="gu-g" title="${esc(`${e}: ${ss.map((s) => `${s.nombre ? s.nombre + ' ' : ''}${s.v[i] ?? '—'}`).join(' · ')}${uR ? ' ' + uR : ''}`)}"><div class="gu-bs">${ss.map((s, k) => `<i class="gu-c${k + 1}" style="height:${pct(Math.max(0, s.v[i] ?? 0), max)}%"></i>`).join('')}</div><span>${esc(e)}</span></div>`).join('');
  return `<figure class="gu-chart gu-barras">${leyenda}<div class="gu-plot" aria-hidden="true"><span class="gu-ymax">${max}${u ? ' ' + u : ''}</span><div class="gu-gs">${grupos}</div></div>${tabla}</figure>`;
}

// Matriz de calor: una tabla de verdad (se lee con lector de pantalla), con un solo tono de luz a oscuro en 5 escalones.
function heatmap(p) {
  const fs = lista(p.filas, 12), cs = lista(p.columnas, 10), vs = lista(p.valores, 12).map((f) => lista(f, 10).map(num));
  const todos = vs.flat().filter((v) => v !== null); if (!todos.length) return '';
  const lo = Math.min(...todos), hi = Math.max(...todos), paso = (v) => (v === null ? 0 : 1 + Math.min(4, Math.floor(((v - lo) / ((hi - lo) || 1)) * 4.999)));
  return `<figure class="gu-heat"><div class="gu-tabla"><table><thead><tr><th></th>${cs.map((c) => `<th scope="col">${txt(c)}</th>`).join('')}</tr></thead><tbody>${fs.map((f, i) => `<tr><th scope="row">${txt(f)}</th>${cs.map((c, j) => { const v = vs[i]?.[j] ?? null; return `<td class="gu-h${paso(v)}" title="${esc(`${txt0(f)} × ${txt0(c)}: ${v ?? '—'}`)}">${v ?? '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><figcaption><span>${lo}</span><i class="gu-esc" aria-hidden="true"><b class="gu-h1"></b><b class="gu-h2"></b><b class="gu-h3"></b><b class="gu-h4"></b><b class="gu-h5"></b></i><span>${hi}</span>${p.nota ? `<small>${txt(p.nota)}</small>` : ''}</figcaption></figure>`;
}

// Medidor: un arco (0 a max) con la cifra en el centro. Sin max: 100.
function gauge(p) {
  const v = num(p.valor), max = num(p.max) || 100; if (v === null) return '';
  const q = pct(v, max);
  return `<div class="gu-gauge" role="meter" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${v}" aria-label="${esc(txt0(p.label))}"><svg viewBox="0 0 100 56" aria-hidden="true"><path class="gu-arc" d="M8 50 A42 42 0 0 1 92 50" pathLength="100"/><path class="gu-arc-v" d="M8 50 A42 42 0 0 1 92 50" pathLength="100" stroke-dasharray="${q} 100"/></svg><b>${txt(p.valor)}</b><span>${txt(p.label)}${p.max != null ? ` · de ${txt(p.max)}` : ''}</span>${p.nota ? `<small>${txt(p.nota)}</small>` : ''}</div>`;
}

function tabla(p, o) {
  const cols = lista(p.columnas, 12), filas = lista(p.filas, 60).map((f) => lista(f, 12));
  const bi = p.barra == null ? -1 : typeof p.barra === 'number' ? p.barra : cols.findIndex((c) => String(txt0(c)) === String(txt0(p.barra)));
  const max = bi >= 0 ? Math.max(0, ...filas.map((f) => num(f[bi]) ?? 0)) : 0;
  const td = (c, j) => (j === bi && !esEl(c) && num(c) !== null ? `<td class="gu-con-barra"><span class="gu-bar"><i style="width:${pct(num(c), max)}%"></i></span><span>${txt(c)}</span></td>` : `<td${typeof c === 'number' ? ' class="gu-n"' : ''}>${celda(c, o)}</td>`);
  return `<div class="gu-tabla"><table><thead><tr>${cols.map((c) => `<th scope="col">${txt(c)}</th>`).join('')}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map(td).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function dibujar(n, o) {
  if (Array.isArray(n)) return n.map((x) => dibujar(x, o)).join('');
  if (!esEl(n) || ++o.nodos > MAX_NODOS) return '';
  const p = n.props || {}, hijos = () => dibujar(lista(p.children), o), off = o.apagado ? ' disabled' : '', k = `${o.clave}.${n.statementId || o.nodos}`;
  switch (n.typeName) {
    case 'Stack': return `<div class="gu-stack">${hijos()}</div>`;
    case 'Row': return `<div class="gu-row">${hijos()}</div>`;
    case 'Card': return `<section class="gu-card"><b>${txt(p.titulo)}</b>${hijos()}</section>`;
    case 'Text': return `<p class="gu-text">${txt(p.texto)}</p>`;
    case 'Metric': return `<div class="gu-metric"><span>${txt(p.label)}</span><b>${txt(p.valor)}</b>${p.nota ? `<small>${txt(p.nota)}</small>` : ''}</div>`;
    case 'Summary': {
      const cifras = lista(p.cifras, 3).map((c) => (esEl(c) && c.typeName === 'Metric' ? [c.props?.label, c.props?.valor] : Array.isArray(c) ? c : null)).filter(Boolean);
      return `<section class="gu-sum"><p>${txt(p.conclusion)}</p>${cifras.length ? `<dl>${cifras.map(([l, v]) => `<div><dt>${txt(l)}</dt><dd>${txt(v)}</dd></div>`).join('')}</dl>` : ''}</section>`;
    }
    case 'Callout': { const t = tonoUi(p.tono) || 'info'; return `<div class="gu-callout gu-t-${t}" role="${t === 'bad' ? 'alert' : 'note'}">${punto(t)}<div><b>${txt(p.titulo)}</b>${p.texto ? `<p>${txt(p.texto)}</p>` : ''}</div></div>`; }
    case 'Tag': { const t = tonoUi(p.tono); return `<span class="gu-tag${t ? ' gu-t-' + t : ''}">${t ? punto(t) : ''}${txt(p.texto)}</span>`; }
    case 'Table': return tabla(p, o);
    case 'KeyValue': return `<dl class="gu-kv">${lista(p.pares, 30).filter(Array.isArray).map(([a, b]) => `<dt>${txt(a)}</dt><dd>${celda(b, o)}</dd>`).join('')}</dl>`;
    case 'Compare': {
      const cols = lista(p.columnas, 4), filas = lista(p.filas, 30).map((f) => lista(f, 4));
      const r = typeof p.recomendada === 'number' ? p.recomendada : cols.findIndex((c, i) => i > 0 && String(txt0(c)) === String(txt0(p.recomendada)));
      const cl = (j) => (j > 0 && j === r ? ' class="gu-rec"' : '');
      return `<div class="gu-tabla gu-compare"><table><thead><tr>${cols.map((c, j) => `<th scope="col"${cl(j)}>${txt(c)}${j > 0 && j === r ? ' <span class="gu-tag gu-t-ok">Recomendada</span>' : ''}</th>`).join('')}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c, j) => (j === 0 ? `<th scope="row">${celda(c, o)}</th>` : `<td${cl(j)}>${celda(c, o)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    case 'Timeline': return `<ol class="gu-tl">${lista(p.items, 20).map((x) => {
      const [t, e, f] = Array.isArray(x) ? x : [x], es = ESTADOS_TL[String(txt0(e) || '').toLowerCase()] || 'pendiente';
      return `<li class="gu-tl-${es}"><i aria-hidden="true"></i><div><b>${txt(t)}</b><span>${NOMBRE_TL[es]}${f ? ` · ${txt(f)}` : ''}</span></div></li>`;
    }).join('')}</ol>`;
    case 'Steps': return `<ol class="gu-steps">${lista(p.items).map((x) => `<li>${txt(x)}</li>`).join('')}</ol>`;
    case 'List': return `<ul class="gu-list">${lista(p.items).map((x) => `<li>${celda(x, o)}</li>`).join('')}</ul>`;
    case 'Checklist': {
      const xs = lista(p.items, 20).map((x) => (Array.isArray(x) ? [x[0], Boolean(x[1])] : [x, false])), guardado = o.leer(k);
      const marcado = (i) => (Array.isArray(guardado) ? guardado.includes(i) : xs[i][1]), hechos = xs.filter((_, i) => marcado(i)).length;
      return `<fieldset class="gu-check" data-gu-k="${esc(k)}"><legend>${txt(p.titulo)} <span class="gu-avance">${hechos} de ${xs.length}</span></legend>${xs.map(([t], i) => `<label><input type="checkbox" data-gu-chk="${i}"${marcado(i) ? ' checked' : ''}${o.vivo ? '' : ' disabled'}><span>${txt(t)}</span></label>`).join('')}</fieldset>`;
    }
    case 'Collapse': return `<details class="gu-col"><summary>${txt(p.titulo) || 'Ver detalle'}</summary><div class="gu-stack">${hijos()}</div></details>`;
    case 'Heatmap': return heatmap(p);
    case 'Chart': return chart(p, o);
    case 'Gauge': return gauge(p);
    case 'Decision': {
      const est = o.leer(k), acc = esEl(p.accion) && p.accion.typeName === 'Boton' ? validarAccion(p.accion.props?.accion, p.accion.props?.args || {}) : null;
      const dis = o.vivo ? '' : ' disabled';
      return `<section class="gu-dec" data-gu-k="${esc(k)}" data-estado="${esc(['aprobada', 'despues'].includes(est) ? est : '')}"${acc ? ` data-gu-acc-dec="${esc(acc.nombre)}" data-gu-args-dec="${esc(JSON.stringify(acc.args))}"` : ''}>
        <span class="gu-dec-k">Decisión</span><b>${txt(p.titulo)}</b><p>${txt(p.recomendacion)}</p>${p.motivo ? `<small>${txt(p.motivo)}</small>` : ''}
        <div class="gu-acts"><button type="button" class="gu-b gu-pri" data-gu-dec="aprobar"${dis}>${acc ? txt(p.accion.props?.label) || 'Aprobar' : 'Aprobar'}</button><button type="button" class="gu-b" data-gu-dec="cambiar"${dis}>Cambiar</button><button type="button" class="gu-b gu-q" data-gu-dec="despues"${dis}>Después</button></div>
        <div class="gu-dec-est"><span data-e="aprobada">${punto('ok')} Aprobada</span><span data-e="despues">${punto('')} La dejaste para después</span><button type="button" class="gu-b gu-q" data-gu-dec="deshacer">Deshacer</button></div></section>`;
    }
    case 'Actions': { const bs = lista(p.botones, 4).map((b, i) => botonDe(b, o, i === 0 ? 'gu-pri' : '')).join(''); return bs ? `<div class="gu-acts">${bs}</div>` : ''; }
    case 'Boton': return boton(p.label, p.accion, p.args, o);
    case 'Tool': case 'Artifact': {
      const id = n.typeName === 'Tool' ? p.id : p.ref, b = boton(n.typeName === 'Tool' ? 'Abrir' : 'Abrir en el panel', 'abrirHerramienta', { id: String(txt0(id) || '').replace(/^herramienta:/, ''), slug: p.slug }, o, 'gu-pri');
      return b ? `<div class="gu-tool"><span class="gu-tool-k">${n.typeName === 'Tool' ? 'Herramienta' : 'Artefacto'}</span><b>${txt(p.titulo) || txt(id)}</b>${b}</div>` : '';
    }
    case 'Guardar': {
      const datos = p.datos && typeof p.datos === 'object' && !esEl(p.datos) ? p.datos : null; if (!datos) return '';
      const b = boton('Guardar', 'guardarEnHerramienta', { destino: p.destino, slug: p.slug, datos }, o, 'gu-pri'); if (!b) return '';
      const filas = Object.entries(datos).slice(0, 12).map(([a, v]) => `<dt>${esc(a)}</dt><dd>${esc(typeof v === 'object' ? JSON.stringify(v).slice(0, 400) : v)}</dd>`).join('');
      return `<section class="gu-guardar"><span class="gu-dec-k">Propuesta para guardar</span><b>${txt(p.resumen) || 'Guardar lo platicado'}</b><details class="gu-col"><summary>Ver lo que se guarda</summary><dl class="gu-kv">${filas}</dl></details><div class="gu-acts">${b}</div></section>`;
    }
    case 'Question': return `<div class="gu-q"><b>${txt(p.texto)}</b><div class="lm-ops">${lista(p.opciones, 6).map((x) => `<button type="button" data-a="opcion" data-t="${esc(limpiaPedido(txt0(x)))}"${off}>${txt(x)}</button>`).join('')}</div></div>`;
    case 'Pedir': return `<div class="lm-ops"><button type="button" class="si" data-a="ui-pedir" data-t="${esc(limpiaPedido(txt0(p.pedido)))}"${off}>${txt(p.label)}</button></div>`;
    default: return '';
  }
}

// Topes: un bloque chico puede expandirse sin fin con referencias (a = Stack([b, b]), b = Stack([c, c])…).
const MAX_FUENTE = 12000, MAX_NODOS = 300, MAX_HTML = 80000;
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
const fuente = (src) => `<pre class="gu-src">${esc(String(src).slice(0, 2000))}</pre>`;
// → el HTML de un bloque (ya escapado). '' si todavía no hay nada que dibujar. final: la respuesta terminó, así que lo que no se
// pudo dibujar se muestra como texto en vez de desaparecer. apagado: las opciones viejas (Question/Pedir) ya no se tocan. Los
// botones del OS, la Checklist y la Decision se pueden usar cuando el bloque terminó (final), también en mensajes viejos.
export function uiHtml(src, createStreamingParser, { apagado = false, final = false, leer = leerEstadoUi, sesion = '' } = {}) {
  const t = String(src || ''); if (!t.trim()) return '';
  const nada = final ? fuente(t) : '';
  if (t.length > MAX_FUENTE || expandeDemasiado(t)) return final ? fuente(t) : '';
  try {
    const r = createStreamingParser(ESQUEMA_UI, 'Stack').set(t, true);
    if (!r.root) return nada;
    const h = dibujar(r.root, { apagado, vivo: final, nodos: 0, leer, clave: `${sesion || sesionActual()}.${hash(t.trim())}` });
    if (h.length > MAX_HTML) return nada;
    if (!/<(b|p|td|th|dt|li|span|button|i|input)\b/.test(h)) return nada;
    instalarUi();
    return `<div class="gu">${h}</div>`;
  } catch { return nada; }
}
// El mensaje sin el código del bloque, con sus datos (para el contexto de los agentes y para Copiar).
export function sinUi(texto) {
  return String(texto || '').replace(/```ui[ \t]*\r?\n([\s\S]*?)(?:```|$)/g, (_, src) => {
    const xs = [...src.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\(.)/g, '$1'));
    return xs.join(' · ');
  }).trim();
}

// ---------- Lo interactivo (navegador) ----------
// Un solo oyente para todo el documento: no hace falta tocar la pantalla del Chat. Checklist y Decision recuerdan lo marcado
// en este navegador, por conversación y bloque (gu.<sesión>.<bloque>.<nombre>).
let uiInstalada = false;
export function instalarUi() {
  if (uiInstalada || typeof document === 'undefined') return; uiInstalada = true;
  instalarAccionesUi(document);
  document.addEventListener('change', (e) => {
    const i = e.target.closest?.('[data-gu-chk]'), f = i?.closest('[data-gu-k]'); if (!f) return;
    const hechos = [...f.querySelectorAll('[data-gu-chk]')].filter((x) => x.checked).map((x) => +x.dataset.guChk);
    guardarEstadoUi(f.dataset.guK, hechos);
    const a = f.querySelector('.gu-avance'); if (a) a.textContent = `${hechos.length} de ${f.querySelectorAll('[data-gu-chk]').length}`;
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('[data-gu-dec]'), d = b?.closest('.gu-dec'); if (!d || b.disabled) return;
    const que = b.dataset.guDec, titulo = d.querySelector(':scope > b')?.textContent || '', poner = (estado) => { d.dataset.estado = estado; guardarEstadoUi(d.dataset.guK, estado || null); };
    if (que === 'aprobar') {
      if (d.dataset.guAccDec) { let args = {}; try { args = JSON.parse(d.dataset.guArgsDec || '{}'); } catch { /* sin args */ } ejecutarAccion(d.dataset.guAccDec, args, { el: b }); }
      else ejecutarAccion('pedir', { texto: `Apruebo: ${titulo}` }, { el: b });
      return poner('aprobada');
    }
    if (que === 'cambiar') return ejecutarAccion('pedir', { texto: `Quiero cambiar «${titulo}»: ` }, { el: b });
    if (que === 'despues') return poner('despues');
    if (que === 'deshacer') return poner('');
  });
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
