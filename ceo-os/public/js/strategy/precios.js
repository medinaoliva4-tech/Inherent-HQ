// Pricing & Packages Builder (herramienta pricing-packages de Strategy): una matriz de paquetes × features, de 2 a 4 paquetes con la recomendada
// resaltada, y un simulador de margen (función pura). Todo precio es una PROPUESTA: se escala al CEO. Los costos son del cliente, van etiquetados
// con su fuente y solo los ve quien ve costos; los resultados del simulador se calculan y NO se guardan. No lee nada interno de Inherent.
// Módulo puro (sin DOM ni red): lo comparten la vista, el servidor y las pruebas. Sin dato va vacío (null), nunca 0.
import { plano, corta, numeroONull, textos, SIN_DATOS, armarPrompt, leerHerramienta, celda, entradaDe, sinAcentos } from '../consulting/marcos.js';
import { limpiar as limpiarOferta } from './oferta.js';
import { preciosConocidos, limpiar as limpiarRadar } from './radar.js';

export const BLOQUE = 'precios';
export const MAX_PAQUETES = 4;
export const MIN_PAQUETES = 2;
export const MAX_FEATURES = 12;
export const ETIQUETA_CLIENTE = '[dice el cliente, sin verificar]';
export const SALE_COSTOS = 'los costos y la adquisición que comparte el cliente (Finanzas en su ficha)';

const idLimpio = (v, n = 40) => corta(v, n).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
const costosVacios = () => ({ cac: null, volumen: null, compras: null, fuente: '' });
// El contenido inicial: sin paquetes, sin features y sin costos (⚠️ SIN DATOS).
export function vacio() { return { features: [], paquetes: [], porque: '', costos: costosVacios() }; }

function paquete(p, i) {
  const o = plano(p) ? p : {};
  return { id: idLimpio(o.id) || `p${i + 1}`, nombre: corta(o.nombre, 60), precio: numeroONull(o.precio, { min: 0 }), moneda: corta(o.moneda, 8).toUpperCase(), para_quien: corta(o.para_quien, 160),
    resumen: corta(o.resumen, 240), incluye: textos(o.incluye, MAX_FEATURES, 40).map((x) => idLimpio(x)).filter(Boolean), costo: numeroONull(o.costo, { min: 0 }), recomendado: o.recomendado === true, archivado: o.archivado === true };
}
// Solo lo conocido, con su tipo y su tamaño. Un solo paquete recomendado; no más de 4 paquetes vivos; el HTML queda como texto.
export function limpiar(contenido) {
  const o = plano(contenido) ? contenido : {}, co = plano(o.costos) ? o.costos : {};
  const fv = new Set(), features = [];
  for (const [i, f] of (Array.isArray(o.features) ? o.features : []).slice(0, 30).entries()) {
    const x = plano(f) ? f : { nombre: f }, nombre = corta(x.nombre, 80); let id = idLimpio(x.id) || `f${i + 1}`;
    if (!nombre) continue;
    while (fv.has(id)) id = `${id}-${fv.size}`;
    fv.add(id); features.push({ id, nombre });
  }
  const pv = new Set(); let vivos = 0, rec = false; const paquetes = [];
  for (const [i, p] of (Array.isArray(o.paquetes) ? o.paquetes : []).slice(0, 20).entries()) {
    const x = paquete(p, i);
    if (!x.nombre && x.precio === null && !x.resumen) continue;
    if (!x.archivado && vivos >= MAX_PAQUETES) continue;
    while (pv.has(x.id)) x.id = `${x.id}-${pv.size}`;
    pv.add(x.id); if (!x.archivado) vivos++;
    x.incluye = x.incluye.filter((id) => fv.has(id));
    if (x.recomendado && (rec || x.archivado)) x.recomendado = false; else if (x.recomendado) rec = true;
    paquetes.push(x);
  }
  return { features: features.slice(0, MAX_FEATURES), paquetes, porque: corta(o.porque, 500),
    costos: { cac: numeroONull(co.cac, { min: 0 }), volumen: numeroONull(co.volumen, { min: 0 }), compras: numeroONull(co.compras, { min: 0 }), fuente: corta(co.fuente, 200) } };
}

// ---------- Lo que ve cada quien ----------
// Quien no ve costos recibe el contenido sin costos (el servidor lo usa al leer: nunca toca el doc guardado).
export function sinCostos(contenido) {
  const c = limpiar(contenido);
  return { ...c, paquetes: c.paquetes.map((p) => ({ ...p, costo: null })), costos: costosVacios() };
}
// Lo que mandó alguien SIN acceso a costos con los costos guardados puestos de vuelta: lo que escriba sobre costos se descarta. actual = null: nada que conservar.
export function conCostos(actual, nuevo) {
  const a = limpiar(actual), n = limpiar(nuevo), previos = new Map(a.paquetes.map((p) => [p.id, p.costo]));
  return { ...n, paquetes: n.paquetes.map((p) => ({ ...p, costo: previos.get(p.id) ?? null })), costos: a.costos };
}
export const hayCostos = (c) => { const o = limpiar(c); return o.paquetes.some((p) => p.costo !== null) || Object.entries(o.costos).some(([k, v]) => k !== 'fuente' && v !== null); };
// Los costos reales del cliente solo entran con Growth Partnership y Finanzas en su ficha; sin eso el simulador es de ejemplo.
export function costosReales(ctx) {
  const nivel = ctx?.cliente?.nivel?.id, inc = Array.isArray(ctx?.ficha?.incluye) ? ctx.ficha.incluye : [];
  return nivel === 'partnership' && inc.some((x) => /finanzas/.test(sinAcentos(plano(x) ? `${x.k} ${x.v}` : x)));
}

// ---------- Cálculos ----------
const redondo = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const nn = (v) => numeroONull(v, { min: 0 });
// El simulador de margen. Entra: precio, costo (unitario), cac, volumen (clientes nuevos al mes) y compras (por cliente). Sale lo que se puede
// calcular con lo que hay; lo que falta es null (nunca 0): margen % y unitario, LTV (margen unitario × compras), LTV:CAC, equilibrio (compras
// por cliente para recuperar el CAC) y utilidad del mes (volumen × (margen de la primera compra − CAC)).
export function simular({ precio, costo, cac, volumen, compras } = {}) {
  const p = nn(precio), k = nn(costo), a = nn(cac), v = nn(volumen), n = nn(compras);
  const margenUnit = p !== null && k !== null ? redondo(p - k) : null;
  const margenPct = margenUnit !== null && p > 0 ? redondo((margenUnit / p) * 100, 1) : null;
  const ltv = margenUnit !== null && n !== null ? redondo(margenUnit * n) : null;
  const ltvCac = ltv !== null && a !== null && a > 0 ? redondo(ltv / a) : null;
  const equilibrio = margenUnit !== null && a !== null && margenUnit > 0 ? redondo(a / margenUnit) : null;
  const utilidadMes = margenUnit !== null && a !== null && v !== null ? redondo(v * (margenUnit - a)) : null;
  return { margenUnit, margenPct, ltv, ltvCac, equilibrio, utilidadMes };
}
export const paqueteRecomendado = (c) => limpiar(c).paquetes.find((p) => p.recomendado && !p.archivado) || null;
export const paquetesVivos = (c) => limpiar(c).paquetes.filter((p) => !p.archivado);
// La matriz: filas = features, columnas = paquetes vivos; true si el paquete lo incluye.
export function matriz(contenido) {
  const c = limpiar(contenido), cols = c.paquetes.filter((p) => !p.archivado);
  return { columnas: cols.map((p) => ({ id: p.id, nombre: p.nombre, recomendado: p.recomendado })), filas: c.features.map((f) => ({ id: f.id, nombre: f.nombre, celdas: cols.map((p) => p.incluye.includes(f.id)) })) };
}
export const textoPrecio = (p) => (p?.precio === null || p?.precio === undefined ? `${SIN_DATOS}: sale de Offer Architect y de los precios del Radar` : `${p.moneda ? `${p.moneda} ` : ''}${p.precio}`);

// Lo que falta para poder aprobar (cada texto es un criterio en «falta»). extra = { nivelId } (lo manda el servidor).
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), f = [], vivos = c.paquetes.filter((p) => !p.archivado);
  if (extra?.nivelId === 'growth') f.push('FUERA DEL ALCANCE: Pricing & Packages no entra en Brand Growth; se escala al CEO');
  if (vivos.length < MIN_PAQUETES) f.push(`Debe haber de ${MIN_PAQUETES} a ${MAX_PAQUETES} paquetes (hay ${vivos.length})`);
  for (const p of vivos) {
    if (!p.nombre) f.push(`El paquete ${p.id} no tiene nombre`);
    if (p.precio === null) f.push(`«${p.nombre || p.id}» no tiene precio: ${SIN_DATOS} (sale de Offer Architect y del Radar)`);
  }
  if (!c.features.length) f.push('La matriz no tiene features');
  if (vivos.filter((p) => p.recomendado).length !== 1) f.push('Debe haber exactamente 1 paquete recomendado');
  else if (!c.porque) f.push('Falta decir por qué se recomienda ese paquete');
  if (hayCostos(c) && !c.costos.fuente) f.push(`Los costos del cliente no dicen su fuente: usa «${ETIQUETA_CLIENTE}» o de dónde salen`);
  return f;
}
export function resumenTexto(contenido) {
  const c = limpiar(contenido), v = c.paquetes.filter((p) => !p.archivado), r = v.find((p) => p.recomendado);
  return [`Pricing: ${v.length} paquete${v.length === 1 ? '' : 's'}`, v.length ? v.map((p) => `${corta(p.nombre, 30) || p.id} ${p.precio === null ? SIN_DATOS : `${p.moneda ? `${p.moneda} ` : ''}${p.precio}`}`).join(' · ') : '', r ? `recomendado: ${corta(r.nombre, 40)}` : '', 'todo precio es propuesta: se escala al CEO'].filter(Boolean).join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const of = entradaDe(ctx, 'offer-architect'), rd = entradaDe(ctx, 'competitor-radar');
  const vars = of ? limpiarOferta(of.contenido).variaciones.map((v) => `${corta(v.nombre, 40)} (${corta(v.precio, 30) || SIN_DATOS}: ${corta(v.diferencia, 80)})`) : [];
  const precios = rd ? preciosConocidos(limpiarRadar(rd.contenido)).slice(0, 6).map((x) => `${corta(x.nombre, 30)} ${x.moneda} ${x.monto} (${x.url})`) : [];
  const cuerpo = [
    'MÉTODO',
    '1) PARTIDA: las variaciones de Offer Architect y los precios del Radar que vienen en el CONTEXTO. Sin ellos, ⚠️ SIN DATOS: no inventes un precio.',
    `2) PAQUETES: de ${MIN_PAQUETES} a ${MAX_PAQUETES}, cada uno con nombre, precio (null si no hay dato), moneda, para quién y qué incluye (ids de features). Una matriz de máximo ${MAX_FEATURES} features. Exactamente 1 recomendado y por qué (porque).`,
    `3) COSTOS: solo si el cliente los dio (Finanzas en su ficha): cac, volumen (clientes nuevos al mes), compras (por cliente) y costo por paquete, con su fuente («${ETIQUETA_CLIENTE}» si no está verificado). Sin dato, null. Nunca uses costos, tarifas ni márgenes de Inherent.`,
    'Todo precio es una PROPUESTA: dilo en «porque» y escálalo al CEO. No hay precio sin el dato que lo apoye.',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"features":[{"id":"f1","nombre":"…"}],"paquetes":[{"id":"p1","nombre":"…","precio":null,"moneda":"GTQ","para_quien":"…","resumen":"…","incluye":["f1"],"costo":null,"recomendado":true}],"porque":"… (propuesta: se escala al CEO)","costos":{"cac":null,"volumen":null,"compras":null,"fuente":""}}',
    F,
    `${F}criterios`,
    '{"entregable":"Pricing & Packages","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  const extra = [`Variaciones de Offer Architect: ${vars.length ? vars.join('; ') : `${SIN_DATOS}: no hay una oferta aprobada de entrada`}`, `Precios de la competencia (Radar, con url): ${precios.length ? precios.join('; ') : `${SIN_DATOS}: no hay precios con url`}`];
  return armarPrompt({ intro: `Eres Strategy de Inherent. Arma el PRICING & PACKAGES de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: la matriz de paquetes y cuál se recomienda.`, cuerpo, salida, extra }, ctx);
}
// Lo que contesta la IA → { contenido, criterios } | null.
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
// verCostos: sin él, el .md no lleva costos ni márgenes.
export function aMd(contenido, { verCostos = false } = {}) {
  const c = verCostos ? limpiar(contenido) : sinCostos(contenido), m = matriz(c), v = c.paquetes.filter((p) => !p.archivado);
  const L = ['# Pricing & Packages', '', '> Todo precio es una propuesta: se escala al CEO.', '', '## Matriz', ''];
  if (!v.length) L.push(`${SIN_DATOS}: sale de Offer Architect y de los precios del Radar.`);
  else {
    L.push(`| Feature | ${m.columnas.map((p) => celda(`${p.nombre || p.id}${p.recomendado ? ' ★' : ''}`)).join(' | ')} |`, `|---|${m.columnas.map(() => '---').join('|')}|`);
    L.push(`| **Precio** | ${v.map((p) => celda(textoPrecio(p))).join(' | ')} |`);
    for (const r of m.filas) L.push(`| ${celda(r.nombre)} | ${r.celdas.map((x) => (x ? 'sí' : '—')).join(' | ')} |`);
  }
  const r = v.find((p) => p.recomendado);
  L.push('', '## Recomendado', '', r ? `**${r.nombre}** — ${c.porque || SIN_DATOS}` : `${SIN_DATOS}: falta marcar el paquete recomendado.`);
  if (verCostos && hayCostos(c)) L.push('', '## Costos del cliente', '', `Fuente: ${c.costos.fuente || SIN_DATOS}`, `- CAC: ${c.costos.cac ?? SIN_DATOS}`, `- Clientes nuevos al mes: ${c.costos.volumen ?? SIN_DATOS}`, `- Compras por cliente: ${c.costos.compras ?? SIN_DATOS}`);
  return L.join('\n');
}
