// Shot List Builder (herramienta shot-list-builder de Production): las escenas PR-001… de cada pieza (id_creativo, acción, plano, duración,
// lugar, talento, setup, producto, jornada, estado) y su export/import CSV de 16 columnas, idéntico a plan-de-produccion.csv.
// Existe para que el contenido, el pedido a la IA, la lectura de su respuesta, las faltas y el CSV de ida y vuelta vivan en un solo módulo
// puro (sin DOM ni red) que comparten la vista y las pruebas. Lo que no se sabe dice ⚠️ SIN DATOS, nunca 0; los costos no entran al pedido.
import { plano, corta, numeroONull, sinAcentos, leerHerramienta, armarPrompt, entradaDe, celda, SIN_DATOS } from '../consulting/marcos.js';
import { COLUMNAS_CSV, csv as leerCsv, aCsv as escribirCsv } from '../produccion.js';

export const BLOQUE = 'shotlist';
export const ESTADOS = [['pendiente', 'Pendiente'], ['grabada', 'Grabada']];
export const AGRUPAR = [['lugar', 'Locación'], ['talento', 'Talento'], ['setup', 'Setup'], ['producto', 'Producto']];
export const MATERIALES = ['video', 'foto'];
const MAX_ESCENAS = 300;
// Cómo cada campo de la escena cae en una columna de la plantilla (todos van y vuelven: nada se pierde en el CSV).
export const COLUMNA_DE = { id: 'id', id_creativo: 'id_creativo', pieza: 'campana', escena: 'escena', accion: 'accion', plano: 'encuadre', duracion_s: 'duracion_s', lugar: 'locacion', talento: 'talento', producto: 'recursos', setup: 'equipo', jornada: 'jornada', costo_estimado: 'costo_estimado', riesgo: 'riesgo', material: 'destino', estado: 'estado' };
const CAMPO_DE = Object.fromEntries(Object.entries(COLUMNA_DE).map(([k, v]) => [v, k]));

export const idEscena = (n) => `PR-${String(n).padStart(3, '0')}`;
export const escenaVacia = (id = '') => ({ id, id_creativo: '', pieza: '', escena: '', accion: '', plano: '', duracion_s: null, lugar: '', talento: '', setup: '', producto: '', material: 'video', jornada: '', riesgo: '', estado: 'pendiente', costo_estimado: null });
export const vacio = () => ({ escenas: [] });
const idOk = (s) => (/^PR-\d{3,5}$/i.test(String(s ?? '').trim()) ? String(s).trim().toUpperCase() : '');

// Solo lo conocido, con su tipo y su tamaño. Sin id se asigna el siguiente PR-xxx; ids repetidos, el repetido se renumera.
export function limpiar(c) {
  const o = plano(c) ? c : {}, usados = new Set(), lista = [];
  const crudas = (Array.isArray(o.escenas) ? o.escenas : []).filter(plano).slice(0, MAX_ESCENAS);
  for (const e of crudas) { const id = idOk(e.id); if (id && !usados.has(id)) usados.add(id); }
  let n = 0; const visto = new Set();
  const siguiente = () => { do { n++; } while (usados.has(idEscena(n))); const id = idEscena(n); usados.add(id); return id; };
  for (const e of crudas) {
    let id = idOk(e.id); if (!id || visto.has(id)) id = siguiente(); visto.add(id);
    const mat = sinAcentos(e.material), dur = numeroONull(e.duracion_s, { min: 0, max: 36000 });
    lista.push({
      id, id_creativo: corta(e.id_creativo, 40), pieza: corta(e.pieza, 120), escena: corta(e.escena, 60), accion: corta(e.accion, 400), plano: corta(e.plano, 120),
      duracion_s: dur === null ? null : Math.round(dur * 10) / 10, lugar: corta(e.lugar, 120), talento: corta(e.talento, 120), setup: corta(e.setup, 120), producto: corta(e.producto, 120),
      material: MATERIALES.includes(mat) ? mat : 'video', jornada: corta(e.jornada, 40), riesgo: corta(e.riesgo, 200), estado: sinAcentos(e.estado) === 'grabada' ? 'grabada' : 'pendiente',
      costo_estimado: numeroONull(e.costo_estimado, { min: 0 }),
    });
  }
  return { escenas: lista };
}

// ---------- Cálculos ----------
export const jornadasDe = (c) => [...new Set((c?.escenas || []).map((e) => e.jornada).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
export const segundos = (lista) => (lista || []).reduce((a, e) => a + (typeof e.duracion_s === 'number' ? e.duracion_s : 0), 0);
export const progreso = (c) => { const l = c?.escenas || []; return { total: l.length, grabadas: l.filter((e) => e.estado === 'grabada').length }; };
// Agrupa las escenas por un campo (lugar, talento, setup, producto, jornada); lo vacío cae en «Sin <campo>».
export function agrupar(lista, campo, vacioTxt = SIN_DATOS) {
  const m = new Map();
  for (const e of lista || []) { const k = e[campo] || ''; if (!m.has(k)) m.set(k, []); m.get(k).push(e); }
  return [...m.entries()].sort((a, b) => (a[0] === '') - (b[0] === '') || a[0].localeCompare(b[0], 'es', { numeric: true })).map(([k, escenas]) => ({ clave: k, titulo: k || vacioTxt, escenas }));
}

// Lo que falta para cerrar la shot list. extra = { ids: [id_creativo del brief] } (opcional) avisa de las piezas sin escena.
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), f = [];
  if (!c.escenas.length) f.push('No hay escenas: agrega al menos una');
  for (const e of c.escenas) if (!e.id_creativo) f.push(`La escena ${e.id} no tiene id_creativo: toda escena sale de una pieza de ④`);
  const con = new Set(c.escenas.map((e) => e.id_creativo).filter(Boolean));
  for (const id of (Array.isArray(extra?.ids) ? extra.ids : [])) if (id && !con.has(id)) f.push(`La pieza ${id} no tiene escenas`);
  return f;
}

// ---------- CSV (las 16 columnas de la plantilla) ----------
export function aCsv(contenido, { costos = false } = {}) {
  const filas = limpiar(contenido).escenas.map((e) => Object.fromEntries(Object.entries(COLUMNA_DE).map(([k, col]) => [col, e[k] === null ? '' : e[k]])));
  return escribirCsv(filas, { costos });
}
// El CSV → { escenas } | null (sin encabezado de la plantilla). Re-importar lo exportado devuelve las mismas escenas.
export function deCsv(texto) {
  const [head = [], ...cuerpo] = leerCsv(texto), H = head.map((h) => String(h).trim());
  if (!H.includes('id_creativo') || !H.includes('id')) return null;
  const escenas = cuerpo.filter((r) => r.some((x) => String(x).trim())).map((r) => {
    const e = {}; H.forEach((h, i) => { if (CAMPO_DE[h]) e[CAMPO_DE[h]] = r[i] ?? ''; });
    return e;
  });
  return limpiar({ escenas });
}
// Mezcla lo importado con lo que hay: mismo id = se reemplaza, id nuevo = se agrega. Nada se borra.
export function mezclar(actual, importado) {
  const a = limpiar(actual).escenas, i = limpiar(importado).escenas, por = new Map(a.map((e) => [e.id, e]));
  for (const e of i) por.set(e.id, e);
  return { escenas: [...por.values()] };
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const e = entradaDe(ctx, 'production-brief'), cont = plano(e?.contenido) ? e.contenido : {};
  const piezas = (Array.isArray(cont.piezas) ? cont.piezas : []).filter((p) => plano(p) && p.producible !== 'no').slice(0, 40).map((p) => `${corta(p.id_creativo, 40)} (${corta(p.formato, 30) || 'formato ⚠️ SIN DATOS'}, ${corta(p.material, 10) || 'video'})`);
  const cuerpo = [
    'MÉTODO',
    `1) Parte de las piezas producibles del brief: ${piezas.length ? piezas.join('; ') : `${SIN_DATOS}: el Production Brief aún no tiene piezas aprobadas`}.`,
    '2) Por cada pieza, escribe sus escenas con ids PR-001, PR-002… (consecutivos). Cada escena lleva el id_creativo de su pieza: sin id_creativo no es válida.',
    '3) Cada escena: acción (qué pasa, en una frase), plano (cerrado, medio, general, detalle…), duración en segundos, lugar, talento (rol, no nombre), setup (luz o montaje), producto y material (video o foto). Si no lo sabes, déjalo vacío: nunca lo inventes.',
    '4) Agrupa mentalmente por lugar y por talento para proponer una jornada (J1, J2…) que junte lo que comparte locación, y deja la jornada vacía si no hay base. No pongas costos ni tarifas.',
    '5) estado siempre «pendiente»: la escena se marca grabada en el set.',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"escenas":[{"id":"PR-001","id_creativo":"…","pieza":"…","accion":"…","plano":"medio","duracion_s":4,"lugar":"…","talento":"…","setup":"…","producto":"…","material":"video","jornada":"J1","estado":"pendiente"}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Shot list","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Production de Inherent. Arma la SHOT LIST de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: las escenas que hay que grabar, ordenadas para el set.`, cuerpo, salida }, ctx);
}

// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), p = progreso(c);
  const L = ['# Shot list', '', `${p.grabadas} de ${p.total} escenas grabadas · ${Math.round(segundos(c.escenas))} s en total`, ''];
  for (const g of agrupar(c.escenas, 'jornada', 'Sin jornada')) {
    L.push(`## ${g.titulo}`, '', '| Id | Pieza | Acción | Plano | Seg | Lugar | Talento | Setup | Estado |', '|---|---|---|---|---|---|---|---|---|');
    for (const e of g.escenas) L.push(`| ${e.id} | ${celda(e.id_creativo) || SIN_DATOS} | ${celda(e.accion)} | ${celda(e.plano)} | ${e.duracion_s ?? ''} | ${celda(e.lugar)} | ${celda(e.talento)} | ${celda(e.setup)} | ${e.estado} |`);
    L.push('');
  }
  return L.join('\n').trim() + '\n';
}

// ---------- Costos: lo que no sale a quien no los ve ----------
// sinCostos: lo que lee quien NO ve costos (el servidor lo usa al leer): sin costo_estimado en ninguna escena. No toca el original.
export const sinCostos = (contenido) => { const c = limpiar(contenido); return { ...c, escenas: c.escenas.map((e) => ({ ...e, costo_estimado: null })) }; };
// conCostos: lo que mandó quien no los ve (`nuevo`) con el costo guardado (`actual`) puesto de vuelta por id; las escenas nuevas salen sin costo.
export function conCostos(actual, nuevo) {
  const previo = new Map(limpiar(actual).escenas.map((e) => [e.id, e.costo_estimado]));
  const n = limpiar(nuevo);
  return { ...n, escenas: n.escenas.map((e) => ({ ...e, costo_estimado: previo.has(e.id) ? previo.get(e.id) : null })) };
}
export { COLUMNAS_CSV };
