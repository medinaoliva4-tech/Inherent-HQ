// Árbol de la brecha (herramienta root-cause-explorer de Consulting): la raíz es la brecha de la meta (meta − actual), el primer nivel son
// los 5 factores de la ecuación de ingresos y de ahí bajan las causas de operación o de dinero. Una causa solo se valida con evidencia.
// Existe para que el árbol, sus cálculos (la brecha y el factor con más brecha: se calculan, no se escriben), el pedido a la IA y la
// lectura de su respuesta vivan en un módulo puro (sin DOM ni red) que comparten la vista, el servidor y las pruebas.
import { empty } from '../diagram-model.js';
import { ECUACION, nombreFactor, SISTEMAS_IDS, SISTEMAS, RUTAS_HORMOZI, etapaHormozi, sinAcentos, corta, plano, numeroONull, leerHerramienta, armarPrompt, entradaDe, celda, miles, SIN_DATOS } from './marcos.js';
import { resumenTexto as resumenSalud } from './salud.js';

export const BLOQUE = 'causas';
export const ESTADOS = ['hipotesis', 'validada', 'descartada'];
// Hipótesis = arena, validada = salvia, descartada = lino (la paleta de diagram-model.js).
export const COLOR_ESTADO = { hipotesis: 'arena', validada: 'salvia', descartada: 'lino' };
const TOOL_DIAGNOSTICO = 'business-health-assessment';

// El contenido inicial: sin meta ni actual (⚠️ SIN DATOS) y los 5 factores vacíos.
export const vacio = () => ({ meta: null, actual: null, factores: ECUACION.map((id) => ({ id, actual: null, necesario: null })), nodos: [] });

const limpioId = (v) => corta(v, 40).replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
const idLibre = (base, usados) => { let id = base, k = 2; while (usados.has(id)) id = `${base}-${k++}`; return id; };
const estadoDe = (v) => { const s = sinAcentos(v); return s.startsWith('valid') ? 'validada' : s.startsWith('descart') ? 'descartada' : 'hipotesis'; };
const sistemaDe = (v) => { const s = sinAcentos(v); return s.startsWith('conv') ? 'conversion' : s.startsWith('oper') ? 'operations' : s.startsWith('mone') || s.startsWith('dine') ? 'money' : ''; };

// Solo lo conocido, con su tipo y su tamaño. Lo demás (llaves de más, id, v, _meta de arriba) se cae; el HTML queda como texto.
// Las ramas apuntan a un factor o a otra causa que exista; un padre perdido o un ciclo cuelga la causa de la raíz.
export function limpiar(c) {
  const o = plano(c) ? c : {}, vistos = new Set(), factores = [];
  for (const f of Array.isArray(o.factores) ? o.factores : []) {
    const id = plano(f) ? sinAcentos(f.id) : '';
    if (!ECUACION.includes(id) || vistos.has(id)) continue;
    vistos.add(id); factores.push({ id, actual: numeroONull(f.actual, { min: 0 }), necesario: numeroONull(f.necesario, { min: 0 }) });
  }
  factores.sort((a, b) => ECUACION.indexOf(a.id) - ECUACION.indexOf(b.id));
  const usados = new Set([...ECUACION, 'raiz']), nodos = [];
  (Array.isArray(o.nodos) ? o.nodos : []).filter(plano).slice(0, 120).forEach((n, i) => {
    const texto = corta(n.texto, 200); if (!texto) return;
    const id = idLibre(limpioId(n.id) || `c${i + 1}`, usados); usados.add(id);
    nodos.push({ id, padre: limpioId(n.padre), texto, estado: estadoDe(n.estado), evidencia: corta(n.evidencia, 300), falta: corta(n.falta, 300), prueba: corta(n.prueba, 300), sistema: sistemaDe(n.sistema) });
  });
  const porId = new Map(nodos.map((n) => [n.id, n]));
  for (const n of nodos) if (n.padre && !ECUACION.includes(n.padre) && (!porId.has(n.padre) || n.padre === n.id)) n.padre = '';
  for (const n of nodos) { // rompe los ciclos
    const arriba = new Set(); let p = n.padre;
    while (p && porId.has(p) && !arriba.has(p)) { if (p === n.id) { n.padre = ''; break; } arriba.add(p); p = porId.get(p).padre; }
  }
  return { meta: numeroONull(o.meta, { min: 0 }), actual: numeroONull(o.actual, { min: 0 }), factores, nodos };
}

// ---------- Cálculos (null si falta un dato: nunca 0) ----------
// La brecha de la meta: meta − actual. null si falta cualquiera de las dos.
export const brecha = (c) => (typeof c?.meta === 'number' && typeof c?.actual === 'number' ? c.meta - c.actual : null);
// Los 5 factores siempre, en el orden de la ecuación, con null donde no hay dato.
export const factoresDe = (c) => ECUACION.map((id) => ({ id, actual: null, necesario: null, ...((Array.isArray(c?.factores) ? c.factores : []).find((f) => f?.id === id) || {}) }));
// Cuántas veces hay que multiplicar el factor para llegar a lo que hace falta (necesario / actual). Un actual vacío o en 0 no es dato.
export const razonFactor = (f) => (typeof f?.actual === 'number' && f.actual > 0 && typeof f?.necesario === 'number' && f.necesario >= 0 ? f.necesario / f.actual : null);
export const factoresSinDatos = (c) => factoresDe(c).filter((f) => razonFactor(f) === null).map((f) => f.id);
// El id del factor con mayor (necesario / actual). null si falta el dato de alguno de los 5 (con { parcial: true }, compara solo los que tienen).
export function factorMayorBrecha(factores, { parcial = false } = {}) {
  const razones = factoresDe({ factores }).map((f) => [f.id, razonFactor(f)]);
  if (!parcial && razones.some(([, r]) => r === null)) return null;
  const con = razones.filter(([, r]) => r !== null);
  return con.length ? con.reduce((a, b) => (b[1] > a[1] ? b : a))[0] : null;
}

// ---------- Aprobar y convertir en tareas ----------
// Lo que falta para poder aprobar: un nodo validado sin evidencia sigue siendo una hipótesis.
export const faltas = (contenido) => limpiar(contenido).nodos.filter((n) => n.estado === 'validada' && !n.evidencia).map((n) => `La causa «${corta(n.texto, 80)}» está validada sin evidencia: sin evidencia sigue siendo hipótesis`);
// Las pruebas de las hipótesis abiertas, como filas para «Convertir en tareas» (máximo 12; la clave estable es el id de la causa).
export const tareasDe = (contenido) => limpiar(contenido).nodos.filter((n) => n.estado === 'hipotesis' && n.prueba).slice(0, 12).map((n) => ({ title: n.prueba, por_que: `Para validar la causa «${corta(n.texto, 80)}»`, fila: n.id, due: '', assignee: '', dept: '' }));

// Una línea para que otras herramientas (el Mapa, el Plan) lean el árbol aprobado.
export function resumenTexto(contenido) {
  const c = limpiar(contenido), b = brecha(c), mayor = factorMayorBrecha(c.factores), v = c.nodos.filter((n) => n.estado === 'validada');
  return [
    `Árbol de la brecha: ${b === null ? `brecha ${SIN_DATOS}` : `brecha de ${miles(b)}`}`,
    mayor ? `el factor con más brecha es ${nombreFactor(mayor).toLowerCase()}` : 'factor con más brecha sin calcular (faltan datos)',
    `${c.nodos.length} causas, ${v.length} validadas${v.length ? `: ${v.slice(0, 3).map((n) => corta(n.texto, 70)).join('; ')}` : ''}`,
  ].join(' · ');
}

// ---------- El árbol como diagrama (diagram-model.js): raíz a la izquierda, factores, causas ----------
const W = 208, H = 80, GX = 96, GY = 32, GRID = 16;
const num = (v) => (typeof v === 'number' ? miles(v) : SIN_DATOS);
export function aDiagrama(contenido, { moneda = '' } = {}) {
  const c = limpiar(contenido), factores = factoresDe(c), mayor = factorMayorBrecha(c.factores), b = brecha(c);
  const hijos = new Map([['raiz', [...factores.map((f) => f.id), ...c.nodos.filter((n) => !n.padre).map((n) => n.id)]]]);
  for (const f of factores) hijos.set(f.id, c.nodos.filter((n) => n.padre === f.id).map((n) => n.id));
  for (const n of c.nodos) hijos.set(n.id, c.nodos.filter((m) => m.padre === n.id).map((m) => m.id));
  const pos = new Map(); let fila = 0;
  const colocar = (id, nivel) => {
    const hs = hijos.get(id) || []; hs.forEach((h) => colocar(h, nivel + 1));
    pos.set(id, { nivel, y: hs.length ? (pos.get(hs[0]).y + pos.get(hs[hs.length - 1]).y) / 2 : fila++ * (H + GY) });
  };
  colocar('raiz', 0);
  const d = empty('LR'), snap = (v) => Math.round(v / GRID) * GRID;
  const nodo = (id, text, fill, type = 'rect') => { const p = pos.get(id); d.nodes.push({ id, type, x: p.nivel * (W + GX), y: snap(p.y), w: W, h: H, text, fill }); };
  nodo('raiz', b === null ? `Brecha\n${SIN_DATOS}: sale de la meta de Strategy` : `Brecha: ${moneda}${miles(b)}`, 'espresso', 'ellipse');
  for (const f of factores) nodo(f.id, `${nombreFactor(f.id)}\n${num(f.actual)} → ${num(f.necesario)}`, f.id === mayor ? 'barro' : 'crema');
  for (const n of c.nodos) nodo(n.id, n.texto, COLOR_ESTADO[n.estado]);
  for (const [padre, hs] of hijos) for (const h of hs) d.edges.push({ id: `e-${h}`, from: padre, to: h, label: '', style: '', head: true, fromPort: '', toPort: '' });
  d.edgeStyle = 'ortho';
  return d;
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const es = plano(ctx?.estrategia) ? ctx.estrategia : {}, e = es.etapa && es.etapa.n != null ? etapaHormozi(es.etapa.n) : null;
  const dx = entradaDe(ctx, TOOL_DIAGNOSTICO);
  const extra = [dx ? `Diagnóstico aprobado (v${Number(dx.version) || '?'}): ${resumenSalud(dx.contenido)}` : `Diagnóstico aprobado: ${SIN_DATOS}: sale del Diagnóstico de crecimiento, que aún no está aprobado`];
  const cuerpo = [
    'MÉTODO',
    `Lee en hormozi-brain: ${e ? e.ruta : RUTAS_HORMOZI.overview} y ${RUTAS_HORMOZI.valor}.`,
    `RAÍZ: la brecha de la meta de Strategy, meta − actual en dinero (${es.meta ? 'la meta está en el contexto' : `meta y actual en null: ${SIN_DATOS}, sale de la meta de Strategy`}).`,
    `PRIMER NIVEL: los 5 factores de la ecuación de ingresos (leads × conversión × ticket × frecuencia × retención): ids ${ECUACION.join(', ')}. Cada uno con su número actual y el que haría falta, en la misma unidad (las tasas, de 0 a 1). Sin dato, null.`,
    `RAMAS: de cada factor baja a las causas de operación o de dinero (sistema: ${SISTEMAS_IDS.join(', ')}; palancas en ${SISTEMAS_IDS.map((s) => SISTEMAS[s].nombre).join(', ')}). padre = el id del factor o de otra causa. Empieza por la restricción del Diagnóstico.`,
    'ESTADO: toda causa nace como hipotesis. Pasa a validada solo con evidencia (dato y fuente); sin evidencia sigue como hipótesis y dices qué dato falta y qué prueba la validaría. descartada si la evidencia la tumba.',
    'No escribas cuál factor tiene más brecha: el OS lo calcula.',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"meta":1500000,"actual":1000000,"factores":[{"id":"leads","actual":400,"necesario":600}],"nodos":[{"id":"c1","padre":"leads","texto":"…","estado":"hipotesis","evidencia":"","falta":"…","prueba":"…","sistema":"operations"}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Árbol de la brecha","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Consulting de Inherent. Arma el ÁRBOL DE LA BRECHA de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: ¿por qué no llega a la meta?`, cuerpo, salida, extra }, ctx);
}

// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), b = brecha(c), mayor = factorMayorBrecha(c.factores);
  const L = ['# Árbol de la brecha', '', '## La brecha', '', b === null ? `${SIN_DATOS}: falta la meta o el actual (salen de Strategy).` : `Meta ${miles(c.meta)} − actual ${miles(c.actual)} = **${miles(b)}**`];
  L.push('', '## Ecuación de ingresos', '', '| Factor | Actual | Necesario | Veces |', '|---|---|---|---|');
  for (const f of factoresDe(c)) { const r = razonFactor(f); L.push(`| ${nombreFactor(f.id)} | ${num(f.actual)} | ${num(f.necesario)} | ${r === null ? SIN_DATOS : `${Math.round(r * 100) / 100}x`} |`); }
  L.push('', mayor ? `**Factor con más brecha: ${nombreFactor(mayor)}**` : `Factor con más brecha: ${SIN_DATOS} (faltan datos en ${factoresSinDatos(c).map(nombreFactor).join(', ')}).`, '', '## Causas', '');
  const rama = (padre, nivel) => c.nodos.filter((n) => n.padre === padre).forEach((n) => {
    L.push(`${'  '.repeat(nivel)}- **[${n.estado}]** ${n.texto}${n.sistema ? ` (${n.sistema})` : ''}`);
    if (n.evidencia) L.push(`${'  '.repeat(nivel + 1)}- Evidencia: ${celda(n.evidencia)}`);
    if (n.falta) L.push(`${'  '.repeat(nivel + 1)}- Falta: ${celda(n.falta)}`);
    if (n.prueba) L.push(`${'  '.repeat(nivel + 1)}- Prueba: ${celda(n.prueba)}`);
    rama(n.id, nivel + 1);
  });
  for (const f of factoresDe(c)) { const hs = c.nodos.filter((n) => n.padre === f.id); if (hs.length) { L.push(`- **${nombreFactor(f.id)}**`); rama(f.id, 1); } }
  if (c.nodos.some((n) => !n.padre)) { L.push('- **Sin factor**'); rama('', 1); }
  if (!c.nodos.length) L.push(`${SIN_DATOS}: todavía no hay causas.`);
  return L.join('\n');
}
