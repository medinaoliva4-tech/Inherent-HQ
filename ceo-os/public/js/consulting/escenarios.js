// Money Model Lab (herramienta financial-scenario-lab de Consulting): el BMC con semáforo por bloque, la matriz BCG por línea,
// la escalera de dinero de Hormozi y de 2 a 4 escenarios. Módulo puro (sin DOM ni red) para que lo compartan la interfaz, el
// servidor y las pruebas. Los números (margen, LTV, LTGP:CAC, caja a 30 días) se CALCULAN aquí: la IA no los escribe, y un
// insumo que falta da null, nunca 0.
import { BMC, BCG, TIPOS_OFERTA, RUTAS_HORMOZI, SIN_DATOS, armarPrompt, celda, miles, corta, numeroONull, sinAcentos, plano as esObjeto, leerBloque, leerHerramienta } from './marcos.js';

export const BLOQUE = 'escenarios';
export const SEMAFOROS = ['verde', 'ambar', 'rojo'];
export const ACCIONES = BCG.map((c) => c.accion); // empujar, sostener, revisar, retirar
export const ESCALERA = TIPOS_OFERTA.map((t) => t.id); // atraccion, upsell, downsell, continuidad
export const CAMBIOS = ['precio', 'costo', 'volumen', 'cac', 'retencion']; // lo que un escenario puede mover
export const CALCULOS = ['margen', 'margenPct', 'ltv', 'ltgpCac', 'caja30'];
// BCG: crecimiento del mercado en % anual; participación RELATIVA (1 = igual que el líder). Con el umbral o más es «alto».
export const UMBRALES = { crecimiento: 10, participacion: 1 };
export const TOPE_MESES = 60; // la vida de un cliente nunca pasa de 5 años en el cálculo

// ---------- Utilidades ----------
// Un número o null. Acepta moneda y miles («Q1,200», «$ 1 200.50») y, si se pide, el % («15%»). Lo demás no se adivina: «1.5M» perdería
// su escala, «+10%» es un cambio relativo y «12 clientes» trae una unidad; todos dan null (⚠️ SIN DATOS) en vez de un número equivocado.
const leerNum = (v) => {
  if (typeof v === 'number') return { x: v, pct: false };
  const m = typeof v === 'string' ? /^(-?)\s*(?:US\$|GTQ|USD|[$Q€£])?\s*(\d[\d,\s]*(?:\.\d+)?)\s*(%?)$/i.exec(v.trim()) : null;
  return m ? { x: Number(m[1] + m[2].replace(/[,\s]/g, '')), pct: Boolean(m[3]) } : null;
};
const num = (v, min = 0, max = 1e12, { pct = false } = {}) => { const n = leerNum(v); return n && (pct || !n.pct) ? numeroONull(n.x, { min, max }) : null; };
// Las tasas: 0.8, 80 o «80%» quedan como 0.8.
const tasa = (v) => { const n = leerNum(v); return n ? numeroONull(n.pct || n.x > 1 ? n.x / 100 : n.x, { min: 0, max: 1 }) : null; };
const redondeo = (x) => Math.round(x * 100) / 100;
// La llave que escribió la IA → el id del bloque del BMC (por id o por nombre, sin acentos ni mayúsculas).
const idBmc = (clave) => { const c = sinAcentos(clave); return (BMC.find((b) => b.id === c) || BMC.find((b) => sinAcentos(b.nombre) === c))?.id || ''; };

// ---------- Cálculos ----------
// Meses de vida de un cliente: 1 / (1 − retención mensual), con tope. Sin retención usa los meses que dijo el cliente; sin ninguno, null.
const vida = (retencion, meses) => {
  const r = tasa(retencion);
  if (r !== null) return r >= 1 ? TOPE_MESES : Math.min(TOPE_MESES, 1 / (1 - r));
  const m = num(meses, 0, 600);
  return m === null ? null : Math.min(TOPE_MESES, m);
};
export const vidaMeses = (retencion, meses = null) => { const v = vida(retencion, meses); return v === null ? null : redondeo(v); };
// base = { precio, costo, volumen, cac, retencion (0-1), meses }. Cada resultado es null si le falta algún insumo.
// margenPct va de 0 a 100. caja30 = lo que deja un mes de ventas nuevas después de pagar su CAC.
export function calcular(base = {}) {
  const b = esObjeto(base) ? base : {};
  const precio = num(b.precio), costo = num(b.costo), volumen = num(b.volumen), cac = num(b.cac);
  const margen = precio !== null && costo !== null ? precio - costo : null;
  const margenPct = margen !== null && precio ? (margen / precio) * 100 : null;
  const meses = vida(b.retencion, b.meses);
  const ltv = margen !== null && meses !== null ? margen * meses : null;
  const ltgpCac = ltv !== null && cac ? ltv / cac : null; // sin CAC (o CAC 0) no hay razón que calcular
  const caja30 = volumen !== null && margen !== null && cac !== null ? volumen * margen - volumen * cac : null;
  const r = (x) => (x === null ? null : redondeo(x));
  return { margen: r(margen), margenPct: r(margenPct), ltv: r(ltv), ltgpCac: r(ltgpCac), caja30: r(caja30) };
}
const limpiarBase = (b) => { const o = esObjeto(b) ? b : {}; return { precio: num(o.precio), costo: num(o.costo), volumen: num(o.volumen), cac: num(o.cac), retencion: tasa(o.retencion), meses: num(o.meses, 0, 600) }; };
const limpiarCambios = (c) => {
  const o = esObjeto(c) ? c : {}, out = {};
  for (const k of CAMBIOS) { const v = k === 'retencion' ? tasa(o[k]) : num(o[k]); if (v !== null) out[k] = v; }
  return out;
};
// Lo que pasa si cambian algunos insumos. Los cambios son los valores NUEVOS (no porcentajes) y lo que no cambia se queda igual.
export const aplicar = (base, cambios) => ({ ...limpiarBase(base), ...limpiarCambios(cambios) });
// El cuadrante de una línea (un id de BCG): crecimiento del mercado (%) × participación relativa. null si falta alguno.
export function cuadranteBCG(crecimiento, participacion, umbrales = UMBRALES) {
  const c = num(crecimiento, -100, 1000, { pct: true }), p = num(participacion, 0, 1000);
  if (c === null || p === null) return null;
  const crece = c >= (umbrales?.crecimiento ?? UMBRALES.crecimiento), manda = p >= (umbrales?.participacion ?? UMBRALES.participacion);
  return crece ? (manda ? 'estrella' : 'interrogante') : (manda ? 'vaca' : 'perro');
}
// Lo que se haría con cada cuadrante (Money OS 2: cuál empujar, cuál retirar). La persona decide; esto solo propone.
export const accionSugerida = (cuadrante) => BCG.find((c) => c.id === cuadrante)?.accion || '';
// La base de hoy y cada escenario con sus resultados y su diferencia contra hoy (null si a alguno le falta un insumo).
export function correrEscenarios(contenido) {
  const c = limpiar(contenido), hoy = calcular(c.base);
  const delta = (r) => Object.fromEntries(CALCULOS.map((k) => [k, hoy[k] !== null && r[k] !== null ? redondeo(r[k] - hoy[k]) : null]));
  return { base: hoy, escenarios: c.escenarios.map((e) => { const base = aplicar(c.base, e.cambios), resultado = calcular(base); return { nombre: e.nombre, cambios: e.cambios, base, resultado, delta: delta(resultado) }; }) };
}

// ---------- El contenido ----------
export function vacio() {
  return {
    bmc: Object.fromEntries(BMC.map((b) => [b.id, { texto: '', semaforo: '', nota: '' }])),
    cartera: [],
    escalera: Object.fromEntries(ESCALERA.map((k) => [k, { hoy: '', hueco: '', cita: '' }])),
    base: { precio: null, costo: null, volumen: null, cac: null, retencion: null, meses: null },
    escenarios: [],
  };
}
const semaforo = (v) => { const s = sinAcentos(v); return SEMAFOROS.includes(s) ? s : /^(amarillo|naranja|medio)/.test(s) ? 'ambar' : ''; };
const accion = (v) => { const s = sinAcentos(v); return s.length >= 4 ? ACCIONES.find((a) => a.startsWith(s.slice(0, 4))) || '' : ''; };
// Deja solo lo conocido, con tipo y tamaño. Lo que la IA o la pantalla manden de más (id, v, _meta, HTML) no entra; el texto queda como texto.
export function limpiar(contenido) {
  const c = esObjeto(contenido) ? contenido : {}, out = vacio();
  if (esObjeto(c.bmc)) {
    for (const [clave, b] of Object.entries(c.bmc)) {
      const id = idBmc(clave);
      if (id && esObjeto(b)) out.bmc[id] = { texto: corta(b.texto, 400), semaforo: semaforo(b.semaforo), nota: corta(b.nota, 300) };
    }
  }
  if (Array.isArray(c.cartera)) {
    out.cartera = c.cartera.filter(esObjeto).slice(0, 12).map((l) => ({
      linea: corta(l.linea, 100), ventas: num(l.ventas), margen: num(l.margen, -100, 100, { pct: true }), crecimiento: num(l.crecimiento, -100, 1000, { pct: true }),
      participacion: num(l.participacion, 0, 1000), accion: accion(l.accion),
    }));
  }
  if (esObjeto(c.escalera)) {
    for (const k of ESCALERA) if (esObjeto(c.escalera[k])) out.escalera[k] = { hoy: corta(c.escalera[k].hoy, 300), hueco: corta(c.escalera[k].hueco, 300), cita: corta(c.escalera[k].cita, 200) };
  }
  out.base = limpiarBase(c.base);
  if (Array.isArray(c.escenarios)) {
    out.escenarios = c.escenarios.filter(esObjeto).slice(0, 4).map((e, i) => ({ nombre: corta(e.nombre, 80) || `Escenario ${i + 1}`, cambios: limpiarCambios(e.cambios) }));
  }
  return out;
}

// ---------- Los costos del cliente ----------
// Son costos: base.costo, base.cac, el margen de cada línea de la cartera y los cambios de costo y cac de cada escenario. Los ve
// quien ve costos (CEO, COO y quien edita Clientes); a los demás el servidor les entrega el entregable sin ellos (null = SIN DATOS)
// y, cuando lo guardan, conserva los que ya estaban. Ninguna de las dos toca el original.
export const sinCostos = (contenido) => {
  const c = limpiar(contenido);
  c.base.costo = null; c.base.cac = null;
  c.cartera = c.cartera.map((l) => ({ ...l, margen: null }));
  c.escenarios = c.escenarios.map((e) => { const { costo, cac, ...cambios } = e.cambios; return { ...e, cambios }; });
  return c;
};
// Empareja cada elemento nuevo con uno guardado: el que está en el mismo lugar si se llama igual; si no, el primero sin usar con ese nombre.
const emparejar = (guardados, nombre) => {
  const usados = new Set(), clave = (x) => sinAcentos(nombre(x));
  return (item, i) => {
    const k = clave(item), j = guardados[i] && !usados.has(i) && clave(guardados[i]) === k ? i : guardados.findIndex((x, q) => !usados.has(q) && clave(x) === k);
    if (j < 0) return null;
    usados.add(j); return guardados[j];
  };
};
// Lo que alguien SIN acceso a costos mandó (`nuevo`) con los costos que ya estaban guardados (`actual`) puestos de vuelta: lo que
// escriba ahí se descarta. Las líneas y los escenarios se emparejan por nombre; los que no tenían pareja quedan sin costos.
// actual = null (un entregable nuevo): no hay nada que conservar y los costos quedan vacíos.
export const conCostos = (actual, nuevo) => {
  const a = limpiar(actual), n = limpiar(nuevo);
  n.base.costo = a.base.costo; n.base.cac = a.base.cac;
  const lineas = emparejar(a.cartera, (l) => l.linea), escenarios = emparejar(a.escenarios, (e) => e.nombre);
  n.cartera = n.cartera.map((l, i) => ({ ...l, margen: lineas(l, i)?.margen ?? null }));
  n.escenarios = n.escenarios.map((e, i) => {
    const { costo, cac, ...cambios } = e.cambios, g = escenarios(e, i)?.cambios || {};
    return { ...e, cambios: { ...cambios, ...(g.costo !== undefined ? { costo: g.costo } : {}), ...(g.cac !== undefined ? { cac: g.cac } : {}) } };
  });
  return n;
};

// ---------- Lo que falta (bloquea aprobar) ----------
export function faltas(contenido, extra = {}) { // extra no cambia nada aquí: el contrato de las herramientas lo pasa siempre
  const c = limpiar(contenido), out = [];
  if (c.escenarios.length < 2) out.push(`Agrega al menos 2 escenarios (hay ${c.escenarios.length}).`);
  for (const e of c.escenarios) if (!Object.keys(e.cambios).length) out.push(`El escenario «${e.nombre}» no cambia nada: pon al menos un valor.`);
  const sin = BMC.filter((b) => !c.bmc[b.id].texto);
  if (sin.length) out.push(`El BMC tiene ${BMC.length - sin.length} de ${BMC.length} bloques: falta ${sin.map((b) => b.nombre).join(', ')}.`);
  return out;
}

// ---------- La IA ----------
// Las ideas de arranque del chat (antes eran los temas de Finanzas de Consulting).
export const SEMILLAS = [
  { id: 'bmc', titulo: 'Modelo de negocio (BMC)', prompt: 'Arma el Business Model Canvas de la empresa con lo que hay en su carpeta; lo que falte, márcalo.' },
  { id: 'margen', titulo: 'Margen por línea', prompt: '¿Qué línea deja margen y cuál lo desangra? Ponlas en la matriz BCG.' },
  { id: 'precio', titulo: 'Precio y oferta', prompt: '¿Está cobrando lo que vale? Arma el escenario de subir el precio; si hay cambio de precio u oferta, mándalo a Strategy.' },
  { id: 'cac', titulo: 'Costo de adquisición', prompt: '¿Cuánto le cuesta un cliente por canal y cuánto puede pagar sin perder? Arma el escenario de bajar el CAC.' },
  { id: 'ltv', titulo: 'Valor de vida', prompt: '¿Cuánto le deja un cliente en el tiempo y qué lo cambia? Arma el escenario de más retención.' },
];
const F = '`'.repeat(3);
const resumen = (e) => { let s = ''; try { s = JSON.stringify(e?.contenido ?? {}); } catch { s = ''; } return `Entrada aprobada · ${corta(e?.tool, 40)} «${corta(e?.titulo, 80)}» v${Number(e?.version) || 1}: ${s.slice(0, 380)}`; };
// El pedido a la IA (< 5 000 caracteres): las reglas comunes de Consulting, el contexto del cliente (lo único que se recorta) y el método.
export const prompt = (ctx = {}) => armarPrompt({
  intro: `Eres Consulting de Inherent. Arma el MONEY MODEL LAB de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: ¿convierte la demanda en ingresos, sin romperse y con más utilidad?`,
  cuerpo: [
    'Trabaja cuatro frentes, en orden:',
    `1. BMC: los ${BMC.length} bloques (ids: ${BMC.map((b) => b.id).join(', ')}), cada uno con una línea de lo que hay y su salud: verde, ambar o rojo. Utilidad = ingresos − costos.`,
    '2. BCG por línea: ventas, margen (0-100), crecimiento del mercado (% anual) y participación relativa (1 = igual que el líder). Una acción: empujar, sostener, revisar o retirar.',
    `3. Escalera de dinero de Hormozi (${ESCALERA.join(', ')}): qué hay hoy, qué hueco tiene y su cita [$100M MONEY MODELS | capítulo | pág. PDF N]. Lee ${RUTAS_HORMOZI.money_models} y, en esa carpeta, 28-section-6-make-your-money-model.md. Para precio: ${RUTAS_HORMOZI.valor}.`,
    '4. De 2 a 4 escenarios sobre «base» (precio, costo, volumen, cac, retencion de 0 a 1, meses): subir precio, agregar upsell, más retención, bajar CAC. En «cambios» solo los valores NUEVOS de lo que cambia.',
    `No calcules margen, LTV, LTGP:CAC ni caja a 30 días: la herramienta los calcula. Si falta un número, null y dilo en «falta» con ${SIN_DATOS}.`,
    'Un cambio de precio u oferta no se decide aquí: se manda a Strategy (Offer Architect) como encargo. Si van a pegar números del cliente, recomienda activar el modo privado.',
  ],
  salida: [
    'Al final, UN bloque (textos cortos, números sin formato) y otro de criterios:',
    `${F}${BLOQUE}`,
    '{"bmc":{"segmentos":{"texto":"…","semaforo":"verde","nota":"…"}},"cartera":[{"linea":"…","ventas":null,"margen":null,"crecimiento":null,"participacion":null,"accion":"revisar"}],"escalera":{"atraccion":{"hoy":"…","hueco":"…","cita":"…"},"upsell":{},"downsell":{},"continuidad":{}},"base":{"precio":null,"costo":null,"volumen":null,"cac":null,"retencion":null,"meses":null},"escenarios":[{"nombre":"Subir precio","cambios":{"precio":1100}}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Money Model Lab","cumple":["…"],"falta":["…"]}',
    F,
  ],
  extra: (ctx?.entradas || []).slice(0, 2).map(resumen),
}, ctx);
// Busca el bloque ```escenarios en la respuesta (el último bueno). JSON roto, bloque a medias o un objeto sin nada conocido → null.
const CLAVES = ['bmc', 'cartera', 'escalera', 'base', 'escenarios'];
export function leer(texto) {
  const j = leerBloque(texto, BLOQUE);
  return j && CLAVES.some((k) => k in j) ? leerHerramienta(texto, BLOQUE, limpiar) : null;
}

// ---------- Exportar ----------
const SEMAFORO_TXT = { verde: 'Verde', ambar: 'Ámbar', rojo: 'Rojo' };
const dato = (n) => miles(n) || SIN_DATOS;
export function aMd(contenido) {
  const c = limpiar(contenido), r = correrEscenarios(c);
  const L = ['# Money Model Lab', '', '## Modelo de negocio (BMC)', '', '| Bloque | Qué hay | Salud | Nota |', '|---|---|---|---|'];
  for (const b of BMC) { const x = c.bmc[b.id]; L.push(`| ${celda(b.nombre)} | ${celda(x.texto) || SIN_DATOS} | ${SEMAFORO_TXT[x.semaforo] || '—'} | ${celda(x.nota)} |`); }
  L.push('', '## Cartera (matriz BCG)', '');
  if (c.cartera.length) {
    L.push('| Línea | Ventas | Margen % | Crecimiento % | Participación relativa | Cuadrante | Acción |', '|---|---|---|---|---|---|---|');
    for (const l of c.cartera) {
      const q = cuadranteBCG(l.crecimiento, l.participacion);
      L.push(`| ${celda(l.linea)} | ${dato(l.ventas)} | ${dato(l.margen)} | ${dato(l.crecimiento)} | ${dato(l.participacion)} | ${BCG.find((x) => x.id === q)?.nombre || SIN_DATOS} | ${l.accion || '—'} |`);
    }
  } else L.push(`${SIN_DATOS}: las líneas de producto y sus ventas las da el cliente.`);
  L.push('', '## Escalera de dinero (Hormozi)', '');
  for (const t of TIPOS_OFERTA) { const x = c.escalera[t.id]; L.push(`- **${t.nombre}** — Hoy: ${x.hoy || SIN_DATOS} · Hueco: ${x.hueco || '—'}${x.cita ? ` · ${x.cita}` : ''}`); }
  L.push('', '## Escenarios', '');
  const col = [{ nombre: 'Hoy', res: r.base }, ...r.escenarios.map((e) => ({ nombre: e.nombre, res: e.resultado }))];
  L.push(`| | ${col.map((x) => celda(x.nombre)).join(' | ')} |`, `|---|${col.map(() => '---').join('|')}|`);
  for (const [k, n] of [['margen', 'Margen por venta'], ['margenPct', 'Margen %'], ['ltv', 'LTV'], ['ltgpCac', 'LTGP:CAC'], ['caja30', 'Caja a 30 días']]) L.push(`| ${n} | ${col.map((x) => dato(x.res[k])).join(' | ')} |`);
  L.push('', `${SIN_DATOS}: los números salen del cliente (precio, costo, volumen, CAC, retención); sin ellos no se calcula. Un cambio de precio u oferta se manda a Strategy.`, '');
  return L.join('\n');
}
