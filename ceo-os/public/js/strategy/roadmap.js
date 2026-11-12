// Growth Roadmap Builder (herramienta growth-roadmap de Strategy): el roadmap por área (Strategy, Marketing, Creative, Production, Ads,
// Consulting) y por trimestre (T1 a T4), con las tareas de cada fila y los hitos. Vive en la estrategia en vivo (viva.roadmap), no en un
// entregable, y por eso su pedido a la IA es el bloque ```estrategia {"roadmap":…} que ya usa instrucciones() de estrategia-viva.js.
// De aquí salen las tareas (con la forma de tareaDeEncargo) y las metas del cliente (con la forma de goals.js); nada se escribe solo.
// Módulo puro (sin DOM ni red): lo comparten la vista, el servidor y las pruebas. Brand Growth nunca promete un % de crecimiento.
import { etapaDe, limiteDe } from '../estrategia.js';
import { tareaDeEncargo } from '../llm/modos.js';
import { plano, corta, sinAcentos, SIN_DATOS, armarPrompt, leerBloque, leerHerramienta, etapaHormozi, entradaDe, RUTAS_HORMOZI, celda } from '../consulting/marcos.js';
import { resumenTexto as resumenOferta } from './oferta.js';
import { resumenTexto as resumenXray } from './xray.js';

export const BLOQUE = 'estrategia';
export const MAX_ITEMS = 60;
export const MAX_HITOS = 20;
export const MAX_TAREAS = 8;
export const TRIMESTRES = ['T1', 'T2', 'T3', 'T4'];
export const TRIMESTRE_NOMBRE = { T1: 'Meses 1-3', T2: 'Meses 4-6', T3: 'Meses 7-9', T4: 'Meses 10-12' };
// Las filas de la grilla, en orden. AREAS_RM_INFO lleva el nombre, el departamento de la tarea y el modo del Chat (llm/modos.js) del área.
export const AREAS_RM = ['strategy', 'marketing', 'creative', 'production', 'ads', 'consulting'];
export const AREAS_RM_INFO = [
  { id: 'strategy', nombre: 'Strategy', legado: 'Strategy', dept: '① Strategy', modo: 'estrategia' },
  { id: 'marketing', nombre: 'Marketing', legado: 'Marketing', dept: '③ Marketing', modo: 'marketing' },
  { id: 'creative', nombre: 'Creative', legado: 'Creatividad', dept: '⑥A Diseño gráfico', modo: 'diseno' },
  { id: 'production', nombre: 'Production', legado: 'Producción', dept: '⑤ Producción', modo: 'produccion' },
  { id: 'ads', nombre: 'Ads', legado: 'Ads', dept: '⑩ Ads', modo: 'marketing' },
  { id: 'consulting', nombre: 'Consulting', legado: 'Consulting', dept: '', modo: 'consulting' },
];
export const areaInfo = (id) => AREAS_RM_INFO.find((a) => a.id === id) || null;

// ---------- Lo que se entiende por área y trimestre ----------
const SINONIMOS_AREA = { estrategia: 'strategy', mercadeo: 'marketing', creatividad: 'creative', diseno: 'creative', design: 'creative', 'diseno grafico': 'creative', produccion: 'production', pauta: 'ads', ads: 'ads', consultoria: 'consulting' };
// El área de AREAS_RM, venga el id o el nombre en español («Creatividad», «Producción», «Pauta»); '' si no es ninguna.
export const areaDe = (v) => { const k = sinAcentos(v); return AREAS_RM.find((a) => a === k) || SINONIMOS_AREA[k] || ''; };
// T1 a T4, venga como «T1», «Q2», «trimestre 3», 4 o «meses 7-9»; '' si no es ninguno.
export function trimestreDe(v) {
  const s = sinAcentos(v);
  let m = /^(?:t|q|trimestre\s*)?\s*([1-4])$/.exec(s); if (m) return `T${m[1]}`;
  m = /^meses?\s*(\d{1,2})\s*(?:-|a|–)\s*\d{1,2}$/.exec(s);
  return m && [1, 4, 7, 10].includes(Number(m[1])) ? `T${(Number(m[1]) + 2) / 3}` : '';
}
const fechaReal = (s) => { const t = String(s ?? '').trim(); if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return ''; const d = new Date(`${t}T12:00:00Z`); return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== t ? '' : t; };
const idLimpio = (v, n = 24) => String(v ?? '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, n);
// Cada fila lleva un id estable: sin id, o repetido, recibe uno nuevo (r1, r2…) que no choca con los demás.
function asignarIds(crudos, prefijo) {
  const usados = new Set();
  const ids = crudos.map((v) => { const id = idLimpio(v); if (id && !usados.has(id)) { usados.add(id); return id; } return ''; });
  let n = 0;
  return ids.map((id) => { if (id) return id; do { n++; } while (usados.has(`${prefijo}${n}`)); usados.add(`${prefijo}${n}`); return `${prefijo}${n}`; });
}

// ---------- Limpiar (la salida de un modelo es dato no confiable) ----------
export const vacio = () => ({ items: [], hitos: [] });
function limpiarTareas(lista) {
  return (Array.isArray(lista) ? lista : []).map((t) => (typeof t === 'string' ? { title: t } : t)).filter(plano)
    .map((t) => ({ title: corta(t.title ?? t.titulo, 120), due: fechaReal(t.due ?? t.vence) })).filter((t) => t.title).slice(0, MAX_TAREAS);
}
// Las filas de la grilla: área y trimestre válidos y un título (las demás se caen), hasta 60. El texto queda como texto.
export function limpiarItems(items) {
  const buenos = [];
  for (const x of Array.isArray(items) ? items : []) {
    if (!plano(x)) continue;
    const area = areaDe(x.area), trimestre = trimestreDe(x.trimestre), titulo = corta(x.titulo, 160);
    if (!area || !trimestre || !titulo) continue;
    buenos.push({ x, area, trimestre, titulo });
    if (buenos.length >= MAX_ITEMS) break;
  }
  const ids = asignarIds(buenos.map((b) => b.x.id), 'r');
  return buenos.map((b, i) => ({ id: ids[i], oportunidad_id: idLimpio(b.x.oportunidad_id, 40), area: b.area, trimestre: b.trimestre, titulo: b.titulo, tareas: limpiarTareas(b.x.tareas) }));
}
// Los hitos: título, fecha real (AAAA-MM-DD) o vacía, y la meta en texto. Hasta 20. Lo que no es un objeto con título (los números sueltos
// del formato viejo de viva.roadmap.hitos) no entra.
export function limpiarHitos(hitos) {
  const buenos = [];
  for (const x of Array.isArray(hitos) ? hitos : []) {
    const h = typeof x === 'string' ? { titulo: x } : x;
    if (!plano(h)) continue;
    const titulo = corta(h.titulo ?? h.title, 120);
    if (!titulo) continue;
    buenos.push({ h, titulo });
    if (buenos.length >= MAX_HITOS) break;
  }
  const ids = asignarIds(buenos.map((b) => b.h.id), 'h');
  return buenos.map((b, i) => ({ id: ids[i], titulo: b.titulo, fecha: fechaReal(b.h.fecha), meta: corta(b.h.meta, 240) }));
}
// Solo lo conocido. Lo que se mande de más (id, v, _meta, llaves raras) no entra.
export const limpiar = (contenido) => { const c = plano(contenido) ? contenido : {}; return { items: limpiarItems(c.items), hitos: limpiarHitos(c.hitos) }; };

// ---------- La grilla ----------
// { T1: { strategy: [filas], marketing: [], … }, T2: …, T3: …, T4: … }: siempre los 4 trimestres y las 6 áreas, aunque estén vacíos.
export function porTrimestre(items) {
  const out = Object.fromEntries(TRIMESTRES.map((t) => [t, Object.fromEntries(AREAS_RM.map((a) => [a, []]))]));
  for (const it of limpiarItems(items)) out[it.trimestre][it.area].push(it);
  return out;
}
// Las filas con el formato viejo de viva.roadmap.filas ([{ area, celdas: [4 textos] }]), para que el panel y el Overview de hoy sigan
// leyendo lo mismo. Solo las áreas con alguna fila; cada celda junta los títulos del trimestre.
export function aFilas(items) {
  const g = porTrimestre(items);
  return AREAS_RM_INFO.map((a) => ({ area: a.legado, celdas: TRIMESTRES.map((t) => g[t][a.id].map((x) => x.titulo).join(' · ').slice(0, 160)) })).filter((f) => f.celdas.some(Boolean));
}

// ---------- A tareas y a metas ----------
// Una tarea por cada tarea de la fila (o la fila misma si no trae tareas), con la forma EXACTA de tareaDeEncargo (llm/modos.js):
// origen 'estrategia', privada, área = el modo del Chat del área de la fila, departamento por área. Nada se crea solo: quien llama las manda.
function* tareasConFila(items, { slug = '', nombre = '', email = '' } = {}) {
  for (const it of limpiarItems(items)) {
    const info = areaInfo(it.area), lista = it.tareas.length ? it.tareas : [{ title: it.titulo, due: '' }];
    for (let i = 0; i < lista.length; i++) {
      const t = lista[i], task = tareaDeEncargo({ area: info.modo, titulo: t.title, por_que: `${it.titulo} · ${it.trimestre} · ${info.nombre}`, vence: t.due }, { cliente: slug, nombre, email });
      yield { task: { ...task, dept: info.dept }, item: it, n: it.tareas.length ? i + 1 : 0 };
    }
  }
}
export const tareasDe = (items, quien) => [...tareasConFila(items, quien)].map((x) => x.task);
// La clave de una tarea del roadmap: la fila (su id estable) y cuál de sus tareas es («0» = la fila misma, cuando no trae tareas; «1», «2»… las de
// su lista). El id de la tarea sale de la clave: crear dos veces la misma da «ya existe» en la base, sin importar su estado ni quién la ve.
export const claveTarea = (itemId, n = 0) => `${idLimpio(itemId, 24)}:${Number(n) || 0}`;
export const idTarea = (slug, itemId, n = 0) => `rm-${idLimpio(slug, 60)}-${idLimpio(itemId, 24)}-${Number(n) || 0}`.slice(0, 120);
// Lo mismo que tareasDe, marcando cada tarea con su fila (roadmap_item) y cuál es (roadmap_tarea), y con su id estable: así no se duplica al
// convertir otra vez aunque ya esté Hecha o la haya creado alguien cuyas tareas esta persona no ve.
export function tareasMarcadas(items, quien) {
  return [...tareasConFila(items, quien)].map(({ task, item, n }) => ({ ...task, id: idTarea(quien?.slug, item.id, n), roadmap_item: item.id, roadmap_tarea: String(n) }));
}
// Las metas del cliente (accounts.goals) con la forma de goals.js: una por hito, origen 'estrategia'. roadmap_hito es la clave para no
// duplicarla al mandarla otra vez (ver claveHito).
export function aMetas(hitos) {
  return limpiarHitos(hitos).map((h) => ({ goal: h.titulo, metric: h.titulo, baseline: '', target: h.meta, current: '', due: h.fecha, status: 'todo', note: '', every: '', tasks: [], checks: [], origen: 'estrategia', roadmap_hito: h.id }));
}
export const claveHito = (g) => (g?.origen === 'estrategia' && g.roadmap_hito ? `estrategia|${g.roadmap_hito}` : '');

// ---------- Lo que falta (bloquea aprobar) ----------
const RE_PORCENTAJE = /\d+(?:[.,]\d+)?\s?%/;
const RE_CRECIMIENTO = /\b(crec\w*|aument\w*|increment\w*|sub[ei]\w*|mult\w*|duplic\w*|triplic\w*|ventas|ingresos|factur\w*)\b/;
// ¿El texto promete un % de crecimiento? (un número con % junto a crecer, subir, ventas o ingresos).
export const prometePorcentaje = (texto) => { const t = sinAcentos(texto); return RE_PORCENTAJE.test(t) && RE_CRECIMIENTO.test(t); };
// c = viva.roadmap ({ items, hitos, filas }). Sin filas (ni items ni las filas del formato viejo) no se aprueba. extra.nivelId (el
// servidor) o extra.ctx.cliente.nivel.id (el shell): con Brand Growth, ningún texto promete un % de crecimiento.
export function faltas(contenido, extra = {}) {
  const c = plano(contenido) ? contenido : {}, items = limpiarItems(c.items), hitos = limpiarHitos(c.hitos), f = [];
  if (!items.length && !(Array.isArray(c.filas) && c.filas.some(plano))) f.push('Sin filas no se aprueba');
  if ((extra?.nivelId ?? extra?.ctx?.cliente?.nivel?.id) === 'growth') {
    const textos = [...items.flatMap((x) => [x.titulo, ...x.tareas.map((t) => t.title)]), ...hitos.flatMap((h) => [h.titulo, h.meta])];
    for (const t of textos) if (prometePorcentaje(t)) f.push(`«${corta(t, 70)}» promete un % de crecimiento: Brand Growth no lo promete (se mide en alcance y volumen del ciclo)`);
  }
  return f;
}

// Una línea para que otras herramientas lean el roadmap.
export function resumenTexto(contenido) {
  const c = limpiar(contenido), g = porTrimestre(c.items);
  return [`Roadmap: ${c.items.length} fila${c.items.length === 1 ? '' : 's'}`, ...TRIMESTRES.map((t) => `${t} ${AREAS_RM.reduce((n, a) => n + g[t][a].length, 0)}`),
    c.hitos.length ? `hitos: ${c.hitos.map((h) => h.titulo).join(', ')}` : ''].filter(Boolean).join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {}, es = plano(c.estrategia) ? c.estrategia : {}, nivel = corta(c.cliente?.nivel?.id, 20);
  const lim = limiteDe('roadmap', nivel), e = es.etapa && es.etapa.n != null ? etapaDe(es.etapa.n) : null, eh = e ? etapaHormozi(e.n) : null;
  const entrada = (tool, f) => { const x = entradaDe(c, tool); return x ? `Entrada aprobada · ${corta(x.titulo, 60) || tool} v${Number(x.version) || 1}: ${corta(f(x.contenido), 380)}` : ''; };
  const opp = entradaDe(c, 'opportunity-map'), oportunidades = (Array.isArray(opp?.contenido?.items) ? opp.contenido.items : []).filter(plano).slice(0, 8).map((i) => `${idLimpio(i.id, 40)} = ${corta(i.titulo, 60)}`).filter((x) => !x.startsWith(' ='));
  const extra = [entrada('business-xray', resumenXray), entrada('offer-architect', resumenOferta), oportunidades.length ? `Oportunidades aprobadas (usa su id en oportunidad_id): ${oportunidades.join('; ')}` : ''].filter(Boolean);
  const cuerpo = [
    'MÉTODO',
    `${lim ? `Límite del nivel en el roadmap: ${lim.titulo}. ${lim.texto}` : `Nivel: ${SIN_DATOS}, sin ficha de oferta.`} Brand Growth nunca promete un % de crecimiento: sus hitos son de alcance y volumen del ciclo.`,
    `Lee en la biblioteca de Hormozi: ${RUTAS_HORMOZI.overview}${eh ? ` y ${eh.ruta}` : ''}.`,
    `1) T1 (meses 1-3) es el plan de 90 días${e ? ` y debe llevar a graduar la etapa ${e.n}: «${e.graduar}»` : ''}. T2 a T4 construyen sobre T1.`,
    '2) items (máximo 24): cada fila = area (strategy, marketing, creative, production, ads o consulting) + trimestre (T1 a T4) + titulo (un resultado, no una actividad suelta) + tareas (máximo 4: title y due AAAA-MM-DD o vacío) + oportunidad_id (el id del Opportunity Map si viene de ahí; si no, vacío).',
    '3) Solo áreas que la ficha incluye: lo demás es FUERA DEL ALCANCE, no entra a la grilla y se escala al CEO.',
    '4) hitos (3 a 6): titulo, fecha AAAA-MM-DD o vacía y meta (el número o resultado que dice que se logró). Las cifras salen del cliente o de la estrategia; sin dato, ⚠️ SIN DATOS, nunca 0.',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"roadmap":{"items":[{"id":"r1","oportunidad_id":"","area":"marketing","trimestre":"T1","titulo":"…","tareas":[{"title":"…","due":"2026-11-30"}]}],"hitos":[{"id":"h1","titulo":"…","fecha":"2026-12-31","meta":"…"}]}}',
    F,
    `${F}criterios`,
    '{"entregable":"Growth Roadmap","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Strategy de Inherent. Arma el ROADMAP DE CRECIMIENTO de «${corta(c.cliente?.nombre, 80) || 'el cliente'}»: qué se hace, en qué área y en qué trimestre, para llegar a la meta de la estrategia.`, cuerpo, salida, extra }, c);
}

// Lo que contesta la IA → { contenido: { items, hitos }, criterios } | null (JSON roto, bloque a medias, sin bloque o sin items ni hitos).
export function leer(texto) {
  const j = leerBloque(texto, BLOQUE), r = j && plano(j.roadmap) ? j.roadmap : null;
  return r && ('items' in r || 'hitos' in r) ? leerHerramienta(texto, BLOQUE, (b) => limpiar(b.roadmap)) : null;
}

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), g = porTrimestre(c.items), L = ['# Growth Roadmap'];
  if (!c.items.length) L.push('', `${SIN_DATOS}: el roadmap no tiene filas.`);
  for (const t of TRIMESTRES) {
    const filas = AREAS_RM.filter((a) => g[t][a].length);
    L.push('', `## ${t} · ${TRIMESTRE_NOMBRE[t]}`, '');
    if (!filas.length) { L.push('Sin filas este trimestre.'); continue; }
    for (const a of filas) {
      L.push(`**${areaInfo(a).nombre}**`);
      for (const x of g[t][a]) L.push(`- ${x.titulo}${x.oportunidad_id ? ` (oportunidad ${x.oportunidad_id})` : ''}`, ...x.tareas.map((k) => `  - ${k.title}${k.due ? ` · ${k.due}` : ''}`));
      L.push('');
    }
  }
  L.push('## Hitos', '');
  if (!c.hitos.length) L.push(`${SIN_DATOS}: faltan los hitos.`);
  else { L.push('| Hito | Fecha | Meta |', '|---|---|---|'); for (const h of c.hitos) L.push(`| ${celda(h.titulo)} | ${h.fecha || SIN_DATOS} | ${celda(h.meta) || SIN_DATOS} |`); }
  return L.join('\n');
}
