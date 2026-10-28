// Competitor Radar (herramienta competitor-radar de Strategy): una tarjeta por competidor (oferta, precio si se sabe, canales, post con más
// resonancia), un mapa de posicionamiento de 2 ejes (0-100) con el punto del cliente y los huecos. Toda posición o hueco lleva la url de su
// evidencia o dice ⚠️ SIN DATOS; sin ninguna posición con evidencia el mapa no pinta nada. Nada se borra: un competidor se archiva.
// Módulo puro (sin DOM ni red): lo comparten la vista, el servidor y las pruebas. Sin dato va vacío (null), nunca 0.
import { plano, corta, numeroONull, entero, textos, SIN_DATOS, armarPrompt, leerHerramienta, celda, sinAcentos } from '../consulting/marcos.js';

export const BLOQUE = 'radar';
export const MAX_COMPETIDORES = 8;
export const MAX_HUECOS = 8;
export const CANALES = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'web', 'whatsapp', 'google', 'otro'];

// Solo https y con el tamaño de una url normal: una url que no lo cumple no es evidencia.
export function urlOk(u) {
  const s = typeof u === 'string' ? u.trim() : '';
  if (!s || s.length > 300 || /\s/.test(s) || !/^https:\/\/[^/\s.]+\.[^/\s]+/i.test(s)) return '';
  try { return new URL(s).protocol === 'https:' ? s : ''; } catch { return ''; }
}
const idLimpio = (v, n = 40) => corta(v, n).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');

const eje = (nombre, bajo, alto) => ({ nombre, bajo, alto });
const competidorVacio = (i = 1) => ({ id: `c${i}`, nombre: '', url: '', oferta: '', precio: { monto: null, moneda: '', url: '' }, canales: [], post: { texto: '', url: '', resonancia: '' }, pos: { x: null, y: null, url: '' }, archivado: false });
// El contenido inicial: sin competidores, sin posiciones y sin huecos (el mapa no pinta nada).
export function vacio() {
  return { ejes: { x: eje('Precio', 'Económico', 'Premium'), y: eje('Propuesta', 'Genérica', 'Especializada') }, competidores: [], cliente: { x: null, y: null }, huecos: [] };
}

const ejeLimpio = (e, base) => { const o = plano(e) ? e : {}; return eje(corta(o.nombre, 40) || base.nombre, corta(o.bajo, 40) || base.bajo, corta(o.alto, 40) || base.alto); };
const punto = (v) => entero(v, 0, 100);
function competidor(c, i) {
  const o = plano(c) ? c : {}, p = plano(o.precio) ? o.precio : {}, po = plano(o.post) ? o.post : {}, ps = plano(o.pos) ? o.pos : {};
  const canales = (Array.isArray(o.canales) ? o.canales : []).map((x) => sinAcentos(x)).filter((x) => CANALES.includes(x));
  return { id: idLimpio(o.id) || `c${i + 1}`, nombre: corta(o.nombre, 80), url: urlOk(o.url), oferta: corta(o.oferta, 300),
    precio: { monto: numeroONull(p.monto, { min: 0 }), moneda: corta(p.moneda, 8).toUpperCase(), url: urlOk(p.url) }, canales: [...new Set(canales)].slice(0, 9),
    post: { texto: corta(po.texto, 240), url: urlOk(po.url), resonancia: corta(po.resonancia, 80) },
    pos: { x: punto(ps.x), y: punto(ps.y), url: urlOk(ps.url) }, archivado: o.archivado === true };
}
// Solo lo conocido, con su tipo y su tamaño. Lo que se mande de más (id, v, _meta, llaves raras) se cae; el HTML queda como texto.
export function limpiar(contenido) {
  const o = plano(contenido) ? contenido : {}, ej = plano(o.ejes) ? o.ejes : {}, cl = plano(o.cliente) ? o.cliente : {}, base = vacio().ejes;
  const vistos = new Set(), competidores = [];
  for (const [i, c] of (Array.isArray(o.competidores) ? o.competidores : []).slice(0, 40).entries()) {
    const x = competidor(c, i);
    if (!x.nombre && !x.url && !x.oferta) continue;
    while (vistos.has(x.id)) x.id = `${x.id}-${vistos.size}`;
    vistos.add(x.id); competidores.push(x);
  }
  return { ejes: { x: ejeLimpio(ej.x, base.x), y: ejeLimpio(ej.y, base.y) }, competidores: competidores.slice(0, 40), cliente: { x: punto(cl.x), y: punto(cl.y) },
    huecos: (Array.isArray(o.huecos) ? o.huecos : []).filter(plano).map((h) => ({ texto: corta(h.texto, 300), url: urlOk(h.url), archivado: h.archivado === true })).filter((h) => h.texto).slice(0, 30) };
}

// ---------- Cálculos ----------
export const activos = (c) => limpiar(c).competidores.filter((x) => !x.archivado);
// Las posiciones que el mapa puede pintar: con x, y y la url de su evidencia. Sin evidencia no hay punto.
export const puntosDelMapa = (c) => activos(c).filter((x) => x.pos.x !== null && x.pos.y !== null && x.pos.url).map((x) => ({ id: x.id, nombre: x.nombre || x.url, x: x.pos.x, y: x.pos.y, url: x.pos.url }));
export const mapaVacio = (c) => puntosDelMapa(c).length === 0;
// El punto del cliente solo se pinta con el mapa vivo (con al menos un competidor con evidencia).
export const clienteEnMapa = (c) => { const o = limpiar(c); return mapaVacio(o) ? null : { x: o.cliente.x ?? 50, y: o.cliente.y ?? 50, puesto: o.cliente.x !== null && o.cliente.y !== null }; };
export const huecosDe = (c) => limpiar(c).huecos.filter((h) => !h.archivado);
// Los huecos con evidencia: los únicos que se mandan al Opportunity Map.
export const huecosConEvidencia = (c) => huecosDe(c).filter((h) => h.url);
// El precio de cada competidor que sí se sabe (monto y su url): lo que lee Pricing & Packages. Sin url, el precio no cuenta.
export const preciosConocidos = (c) => activos(c).filter((x) => x.precio.monto !== null && x.precio.url).map((x) => ({ nombre: x.nombre || x.url, monto: x.precio.monto, moneda: x.precio.moneda, url: x.precio.url }));
export const textoPrecio = (p) => (p?.monto === null || p?.monto === undefined ? `${SIN_DATOS}: sale de la página de precios del competidor` : `${p.moneda ? `${p.moneda} ` : ''}${p.monto}${p.url ? '' : ' [sin url]'}`);

// Lo que falta para poder aprobar (cada texto es un criterio en «falta»).
export function faltas(contenido) {
  const c = limpiar(contenido), f = [], act = c.competidores.filter((x) => !x.archivado), n = (x) => x.nombre || x.url || x.id;
  if (!act.length) f.push('Falta al menos un competidor');
  for (const x of act) {
    if (!x.oferta) f.push(`«${n(x)}» no dice qué ofrece: ${SIN_DATOS}`);
    if ((x.pos.x !== null || x.pos.y !== null) && !x.pos.url) f.push(`La posición de «${n(x)}» no trae la url de su evidencia: sin url va ${SIN_DATOS} (sin posición)`);
    if (x.precio.monto !== null && !x.precio.url) f.push(`El precio de «${n(x)}» no trae url: sin url va ${SIN_DATOS}`);
  }
  if (act.length && mapaVacio(c)) f.push(`El mapa no tiene ninguna posición con evidencia: ${SIN_DATOS}`);
  for (const h of c.huecos.filter((x) => !x.archivado)) if (!h.url) f.push(`El hueco «${corta(h.texto, 60)}» no trae url de evidencia: sin url va ${SIN_DATOS}`);
  return f;
}

// Una línea para otras herramientas (Pricing, Opportunity Map).
export function resumenTexto(contenido) {
  const c = limpiar(contenido), a = activos(c), p = preciosConocidos(c), h = huecosConEvidencia(c);
  return [`Radar: ${a.length} competidor${a.length === 1 ? '' : 'es'}`, p.length ? `precios: ${p.slice(0, 5).map((x) => `${corta(x.nombre, 30)} ${x.moneda ? `${x.moneda} ` : ''}${x.monto} (${x.url})`).join('; ')}` : `precios: ${SIN_DATOS}`,
    h.length ? `huecos: ${h.slice(0, 4).map((x) => `${corta(x.texto, 80)} (${x.url})`).join('; ')}` : `huecos: ${SIN_DATOS}`].join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const comp = (Array.isArray(ctx?.marca?.competencia) ? ctx.marca.competencia : []).map((x) => corta(x, 60)).filter(Boolean).slice(0, 8);
  const cuerpo = [
    'MÉTODO',
    `1) COMPETIDORES: ${comp.length ? `parte de los que ya tiene la marca (${comp.join(', ')}); ` : ''}máximo ${MAX_COMPETIDORES}. Por cada uno: nombre, url, qué ofrece, precio SOLO si lo ves publicado (monto, moneda y la url donde lo viste; si no, monto null), canales (${CANALES.join(', ')}) y su post con más resonancia (texto corto, url y por qué: «3x su promedio»).`,
    '2) MAPA: elige 2 ejes que separen a los competidores (nombre, extremo bajo, extremo alto). Pon a cada competidor en x e y de 0 a 100 y la url que prueba esa posición (su página, su post). Sin url, x e y van null: no se inventa una posición. El punto del cliente lo mueve la persona: déjalo en null.',
    '3) HUECOS: máximo 5 espacios que nadie ocupa, cada uno con la url de evidencia que lo muestra. Sin url, no lo escribas.',
    'Todo es del mercado público: nada de datos internos de Inherent ni de otro cliente. Los precios son datos de otros, no una recomendación: el precio del cliente se decide en Pricing & Packages.',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"ejes":{"x":{"nombre":"Precio","bajo":"Económico","alto":"Premium"},"y":{"nombre":"…","bajo":"…","alto":"…"}},"competidores":[{"nombre":"…","url":"https://…","oferta":"…","precio":{"monto":null,"moneda":"GTQ","url":""},"canales":["instagram"],"post":{"texto":"…","url":"https://…","resonancia":"…"},"pos":{"x":70,"y":40,"url":"https://…"}}],"cliente":{"x":null,"y":null},"huecos":[{"texto":"…","url":"https://…"}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Competitor Radar","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Strategy de Inherent. Arma el COMPETITOR RADAR de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: quién compite, dónde está cada uno y qué espacio queda libre.`, cuerpo, salida }, ctx);
}
// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), L = ['# Competitor Radar', '', '## Competidores', ''];
  const act = c.competidores.filter((x) => !x.archivado);
  if (!act.length) L.push(`${SIN_DATOS}: sale de la investigación de la competencia.`);
  for (const x of act) {
    L.push(`### ${x.nombre || x.url || x.id}`, '', x.url ? `- Sitio: ${x.url}` : '', `- Oferta: ${x.oferta || SIN_DATOS}`, `- Precio: ${textoPrecio(x.precio)}${x.precio.url ? ` (${x.precio.url})` : ''}`,
      `- Canales: ${x.canales.length ? x.canales.join(', ') : SIN_DATOS}`, `- Post con más resonancia: ${x.post.texto ? `${x.post.texto}${x.post.resonancia ? ` — ${x.post.resonancia}` : ''}${x.post.url ? ` (${x.post.url})` : ''}` : SIN_DATOS}`,
      `- Posición: ${x.pos.x !== null && x.pos.y !== null && x.pos.url ? `${c.ejes.x.nombre} ${x.pos.x}, ${c.ejes.y.nombre} ${x.pos.y} (${x.pos.url})` : SIN_DATOS}`, '');
  }
  L.push('## Mapa de posicionamiento', '');
  if (mapaVacio(c)) L.push(`${SIN_DATOS}: ningún competidor tiene posición con evidencia.`);
  else {
    L.push(`Ejes: ${c.ejes.x.nombre} (${c.ejes.x.bajo} → ${c.ejes.x.alto}) × ${c.ejes.y.nombre} (${c.ejes.y.bajo} → ${c.ejes.y.alto})`, '', '| Quién | X | Y | Evidencia |', '|---|---|---|---|');
    for (const p of puntosDelMapa(c)) L.push(`| ${celda(p.nombre)} | ${p.x} | ${p.y} | ${celda(p.url)} |`);
    L.push(c.cliente.x !== null && c.cliente.y !== null ? `| Cliente | ${c.cliente.x} | ${c.cliente.y} | decisión del equipo |` : '');
  }
  L.push('', '## Huecos', '');
  const hs = huecosDe(c);
  L.push(...(hs.length ? hs.map((h) => `- ${h.texto} — ${h.url || SIN_DATOS}`) : [`${SIN_DATOS}: sale de comparar las posiciones del mapa.`]));
  return L.filter((x) => x !== undefined).join('\n');
}
