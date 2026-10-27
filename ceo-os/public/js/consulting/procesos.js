// Mapa del camino del dinero (herramienta process-mapper de Consulting): el recorrido lead → primer contacto → venta → entrega →
// recompra y referidos, hoy vs optimizado, paso por paso (rol, minutos, manual o automático, % que se pierde, dolor y si depende del
// fundador), más el estándar de entrega con 5-Star Service. Existe para que los pasos, sus cálculos, su forma de diagrama (con carriles
// por rol), el pedido a la IA y la lectura de su respuesta vivan en un módulo puro (sin DOM ni red) que comparten la vista, el
// servidor y las pruebas. Lo que no tiene dato sale null y se lee ⚠️ SIN DATOS, nunca 0.
import { empty } from '../diagram-model.js';
import { RUTAS_HORMOZI, etapaHormozi, sinAcentos, corta, plano, numeroONull, textos, verdadero, leerHerramienta, armarPrompt, entradaDe, celda, SIN_DATOS } from './marcos.js';
import { resumenTexto as resumenSalud } from './salud.js';
import { resumenTexto as resumenArbol } from './causas.js';

export const BLOQUE = 'procesos';
export const ETAPAS_CAMINO = [
  { id: 'lead', nombre: 'Lead' }, { id: 'contacto', nombre: 'Primer contacto' }, { id: 'venta', nombre: 'Venta' },
  { id: 'entrega', nombre: 'Entrega' }, { id: 'recompra', nombre: 'Recompra y referidos' },
];
// Las 5 estrellas del estándar de servicio (5 Star Service Framework SOP, Acquisition.com).
export const ESTRELLAS = [
  { id: 'concern', nombre: 'Concern', que: 'mostrar interés por su bienestar y su situación' },
  { id: 'courtesy', nombre: 'Courtesy', que: 'tratarlo con respeto y profesionalismo' },
  { id: 'one-and-done', nombre: 'One & Done', que: 'resolver su caso y lo que depende de él a la primera' },
  { id: 'educate', nombre: 'Educate & Empower', que: 'explicarle el porqué y dejarlo listo para la próxima vez' },
  { id: 'timeliness', nombre: 'Timeliness', que: 'impresionarlo con la rapidez, no solo dejarlo satisfecho' },
];
// Los temas de Consulting que dejan de ser botones y quedan como semilla de esta herramienta.
export const SEMILLAS = [
  ['Mapa de procesos', 'Mapea cómo entrega hoy, paso por paso, y marca dónde se cae.'],
  ['Estándar de calidad', 'Propón el estándar de calidad de su entrega y cómo se mide.'],
];
const CAMPOS_PASO = ['nombre', 'etapa', 'rol', 'minutos', 'modo', 'perdida', 'dolor', 'fundador'];

export const vacio = () => ({ hoy: [], optimizado: [], estandar: { promesa: '', pasos: [] } });

// ---------- Limpiar ----------
const limpioId = (v) => corta(v, 40).replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
const idLibre = (base, usados) => { let id = base, k = 2; while (usados.has(id)) id = `${base}-${k++}`; return id; };
const etapaDe = (v) => { const s = sinAcentos(v); return s.includes('lead') ? 'lead' : s.includes('contact') ? 'contacto' : /venta|cierre/.test(s) ? 'venta' : s.includes('entreg') ? 'entrega' : /recompra|referid/.test(s) ? 'recompra' : ''; };
function limpiarPaso(p, i, usados, pref = 'p') {
  if (!plano(p)) return null;
  const nombre = corta(p.nombre, 120); if (!nombre) return null;
  const id = idLibre(limpioId(p.id) || `${pref}${i + 1}`, usados); usados.add(id);
  return { id, nombre, etapa: etapaDe(p.etapa), rol: corta(p.rol, 60), minutos: numeroONull(p.minutos, { min: 0, max: 100000 }), modo: sinAcentos(p.modo).startsWith('auto') ? 'auto' : 'manual',
    perdida: numeroONull(p.perdida, { min: 0, max: 100 }), dolor: corta(p.dolor, 300), fundador: verdadero(p.fundador) };
}
// Un paso sin id recibe uno propio de su lista (h1 en hoy, o1 en optimizado): así no se confunde con un paso de la otra lista.
const limpiarPasos = (lista, pref) => { const usados = new Set(); return (Array.isArray(lista) ? lista : []).slice(0, 30).map((p, i) => limpiarPaso(p, i, usados, pref)).filter(Boolean); };

// Solo lo conocido, con su tipo y su tamaño. Lo demás (llaves de más, id, v, _meta de arriba) se cae; el HTML queda como texto.
export function limpiar(c) {
  const o = plano(c) ? c : {}, e = plano(o.estandar) ? o.estandar : {};
  return {
    hoy: limpiarPasos(o.hoy, 'h'), optimizado: limpiarPasos(o.optimizado, 'o'),
    estandar: { promesa: corta(e.promesa, 300), pasos: textos((Array.isArray(e.pasos) ? e.pasos : []).map((x) => (plano(x) ? x.texto ?? x.paso ?? x.nombre : x)), 12, 240) },
  };
}

// ---------- Cálculos ----------
const lista = (c, cual) => (Array.isArray(c?.[cual]) ? c[cual] : []);
// Los pasos que se hacen a mano (los que viajan al Automation Finder) y los que dependen del fundador (los que viajan a Equipo).
export const pasosManuales = (c, cual = 'hoy') => lista(c, cual).filter((p) => p.modo === 'manual');
export const pasosFundador = (c, cual = 'hoy') => lista(c, cual).filter((p) => p.fundador === true);
export const pasosSinRol = (c) => ['hoy', 'optimizado'].flatMap((cual) => lista(c, cual).filter((p) => !corta(p.rol, 60)).map((p) => ({ ...p, lista: cual })));
// Las cifras de un recorrido; minutos y pérdida salen null si ningún paso trae dato (nunca 0).
export function medidas(pasos) {
  const ps = Array.isArray(pasos) ? pasos : [], con = ps.filter((p) => typeof p.minutos === 'number'), peor = ps.filter((p) => typeof p.perdida === 'number').sort((a, b) => b.perdida - a.perdida)[0];
  return {
    pasos: ps.length, manuales: ps.filter((p) => p.modo === 'manual').length, fundador: ps.filter((p) => p.fundador === true).length,
    minutos: con.length ? con.reduce((a, p) => a + p.minutos, 0) : null, sinMinutos: ps.length - con.length,
    mayorPerdida: peor ? { id: peor.id, nombre: peor.nombre, perdida: peor.perdida } : null, sinPerdida: ps.filter((p) => typeof p.perdida !== 'number').length,
  };
}
// Hoy vs optimizado por id: lo nuevo, lo que ya no está y lo que cambió (con qué campos).
export function diferencias(c) {
  const hoy = new Map(lista(c, 'hoy').map((p) => [p.id, p])), opt = new Map(lista(c, 'optimizado').map((p) => [p.id, p]));
  const cambiados = [], iguales = [];
  for (const [id, p] of opt) { if (!hoy.has(id)) continue; const campos = CAMPOS_PASO.filter((k) => hoy.get(id)[k] !== p[k]); if (campos.length) cambiados.push({ id, campos }); else iguales.push(id); }
  return { nuevos: [...opt.keys()].filter((id) => !hoy.has(id)), quitados: [...hoy.keys()].filter((id) => !opt.has(id)), cambiados, iguales };
}

// ---------- Diagrama con carriles por rol (diagram-model.js, con el campo opcional lane en cada nodo) ----------
// x por orden del paso; y por carril (el rol, en orden de aparición; sin rol es el carril ''). El texto del nodo es el nombre del paso.
const W = 176, H = 64, GX = 48, LANE = 112;
const colorDe = (p) => (!corta(p.rol, 60) ? 'barro' : p.fundador ? 'tierra' : p.modo === 'auto' ? 'salvia' : 'arena');
export function aDiagrama(pasos) {
  const ps = Array.isArray(pasos) ? pasos : [], carriles = [...new Set(ps.map((p) => p.rol || ''))];
  const d = empty('LR'); d.edgeStyle = 'ortho';
  ps.forEach((p, i) => d.nodes.push({ id: p.id, type: 'rect', x: i * (W + GX), y: carriles.indexOf(p.rol || '') * LANE, w: W, h: H, text: p.nombre, fill: colorDe(p), lane: p.rol || '' }));
  ps.slice(1).forEach((p, i) => d.edges.push({ id: `e${i + 1}`, from: ps[i].id, to: p.id, label: '', style: '', head: true, fromPort: '', toPort: '' }));
  return d;
}
// La vuelta: del diagrama (tal vez editado) a los pasos. Conserva los ids y todo lo que el diagrama no dibuja (minutos, pérdida, dolor…);
// el nombre sale del texto del nodo y el rol de su carril. Un nodo nuevo entra como paso manual sin datos.
export function dePasosDiagrama(d, base = []) {
  const antes = new Map((Array.isArray(base) ? base : []).map((p) => [p.id, p])), usados = new Set();
  return (Array.isArray(d?.nodes) ? d.nodes : []).map((n, i) => { const p = antes.get(n.id); return limpiarPaso({ ...(p || {}), id: n.id, nombre: n.text, rol: n.lane !== undefined ? n.lane : p?.rol }, i, usados); }).filter(Boolean);
}

// ---------- Aprobar ----------
// Lo que falta para poder aprobar: un paso sin rol se resalta antes de aprobar.
export function faltas(contenido) {
  const c = limpiar(contenido), f = [];
  if (!c.hoy.length) f.push('Falta mapear cómo se entrega hoy: el recorrido de hoy no tiene pasos');
  for (const p of pasosSinRol(c)) f.push(`El paso «${corta(p.nombre, 80)}» (${p.lista === 'hoy' ? 'hoy' : 'optimizado'}) no tiene rol: di quién lo hace`);
  return f;
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const es = plano(ctx?.estrategia) ? ctx.estrategia : {}, e = es.etapa && es.etapa.n != null ? etapaHormozi(es.etapa.n) : null;
  const dx = entradaDe(ctx, 'business-health-assessment'), ar = entradaDe(ctx, 'root-cause-explorer');
  const extra = dx || ar ? [dx ? resumenSalud(dx.contenido) : '', ar ? resumenArbol(ar.contenido) : ''].filter(Boolean).map((x) => `Entrada aprobada · ${x}`) : [`Entradas: ${SIN_DATOS}: salen del Diagnóstico y del Árbol de la brecha, que aún no están aprobados`];
  const cuerpo = [
    'MÉTODO',
    `Lee en hormozi-brain: ${RUTAS_HORMOZI.cinco_estrellas} y ${e ? e.ruta : RUTAS_HORMOZI.overview}. Semillas: «${SEMILLAS[0][0]}» (${SEMILLAS[0][1]}) y «${SEMILLAS[1][0]}» (${SEMILLAS[1][1]})`,
    `RECORRIDO: ${ETAPAS_CAMINO.map((x) => x.id).join(' → ')}. Dos listas: hoy (cómo se hace de verdad) y optimizado (el mismo camino mejorado); un paso que ya existe hoy conserva su id.`,
    `CADA PASO: id, nombre, etapa (${ETAPAS_CAMINO.map((x) => x.id).join('|')}), rol (el puesto, nunca una persona), minutos de trabajo humano, modo (manual|auto), perdida (% de leads o ventas que se pierden ahí, 0-100), dolor (qué se cae) y fundador (true si depende del fundador). Sin dato, minutos y perdida van null = ⚠️ SIN DATOS.`,
    'Busca primero dónde se pierde la venta: la respuesta, el seguimiento y el cobro. Lo que el material recomiende y la ficha no incluya va FUERA DEL ALCANCE.',
    `ESTÁNDAR DE CALIDAD: la promesa de entrega en una frase y 5 pasos, uno por estrella de 5-Star Service (${ESTRELLAS.map((x) => x.nombre).join(', ')}), cada uno con cómo se mide. Cita [5 SCALING FRAMEWORKS SOPS | 5 Star Service Framework SOP | pág. PDF N].`,
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"hoy":[{"id":"h1","nombre":"Responde el WhatsApp","etapa":"contacto","rol":"Ventas","minutos":15,"modo":"manual","perdida":30,"dolor":"…","fundador":true}],"optimizado":[…],"estandar":{"promesa":"…","pasos":["Concern: … Se mide: …"]}}',
    F,
    `${F}criterios`,
    '{"entregable":"Mapa del camino del dinero","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Consulting de Inherent. Arma el MAPA DEL CAMINO DEL DINERO de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: del lead a la recompra, hoy vs optimizado.`, cuerpo, salida, extra }, ctx);
}

// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), L = ['# Mapa del camino del dinero'];
  const tabla = (titulo, ps) => {
    L.push('', `## ${titulo}`, '');
    if (!ps.length) { L.push(`${SIN_DATOS}: todavía no hay pasos.`); return; }
    L.push('| # | Paso | Etapa | Rol | Minutos | Modo | Se pierde | Fundador | Dolor |', '|---|---|---|---|---|---|---|---|---|');
    ps.forEach((p, i) => L.push(`| ${i + 1} | ${celda(p.nombre)} | ${ETAPAS_CAMINO.find((x) => x.id === p.etapa)?.nombre || '—'} | ${celda(p.rol) || SIN_DATOS} | ${p.minutos === null ? SIN_DATOS : p.minutos} | ${p.modo === 'auto' ? 'automático' : 'manual'} | ${p.perdida === null ? SIN_DATOS : `${p.perdida}%`} | ${p.fundador ? 'sí' : 'no'} | ${celda(p.dolor)} |`));
  };
  tabla('Hoy', c.hoy); tabla('Optimizado', c.optimizado);
  const dif = diferencias(c);
  L.push('', '## Qué cambia', '', `- Pasos nuevos: ${dif.nuevos.length}`, `- Pasos que ya no están: ${dif.quitados.length}`, `- Pasos que cambian: ${dif.cambiados.length}`);
  L.push('', '## Estándar de entrega (5-Star Service)', '', c.estandar.promesa ? `**Promesa:** ${c.estandar.promesa}` : `${SIN_DATOS}: falta la promesa de entrega.`, '');
  L.push(...(c.estandar.pasos.length ? c.estandar.pasos.map((x, i) => `${i + 1}. ${x}`) : [`${SIN_DATOS}: faltan los pasos del estándar.`]));
  return L.join('\n');
}
