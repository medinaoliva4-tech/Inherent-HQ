// Pruebas de Competitor Radar y Pricing & Packages Builder (public/js/strategy/radar.js y precios.js): contenido, limpiar(), evidencia de cada posición
// y hueco, el mapa que no pinta sin datos, el simulador de margen (null si falta un dato), costos solo para quien los ve, prompt (< 5 000), leer(), aMd,
// el gate por nivel del servidor y la prueba estática de que ninguna de las dos lee datos internos de Inherent.
// node scripts/test-strategy-radar.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as radar from '../public/js/strategy/radar.js';
import * as precios from '../public/js/strategy/precios.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const AQUI = fileURLToPath(new URL('../', import.meta.url));
const leerArchivo = (r) => fs.readFileSync(AQUI + r, 'utf8');
const F = '```';
const U = 'https://ejemplo.com/p';

const CTX = { hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'AKAI', nivel: { id: 'partnership', nombre: 'Growth Partnership' } }, ficha: { incluye: [{ k: 'Áreas', v: 'Estrategia · Finanzas' }], fuera: '' },
  estrategia: { etapa: { n: 3, confirmada: true }, trabado: 'oferta', meta: 'Vender más' }, marca: { competencia: ['@rival1', '@rival2'] }, entradas: [], aprendizajes: [] };
const GRANDE = { ...CTX, cliente: { slug: 'x', nombre: 'N'.repeat(500), nivel: { id: 'partnership', nombre: 'P'.repeat(300) } }, ficha: { incluye: Array.from({ length: 40 }, (_, i) => ({ k: `K${i}`.padEnd(80, 'k'), v: 'v'.repeat(200) })), fuera: 'f'.repeat(3000) },
  marca: { competencia: Array.from({ length: 30 }, () => '@c'.repeat(50)) }, aprendizajes: Array.from({ length: 20 }, () => 'a'.repeat(500)),
  entradas: [{ tool: 'offer-architect', titulo: 'T'.repeat(300), version: 2, contenido: { variaciones: Array.from({ length: 3 }, () => ({ nombre: 'n'.repeat(80), precio: 'p'.repeat(60), diferencia: 'd'.repeat(240) })) } },
    { tool: 'competitor-radar', titulo: 'R', version: 1, contenido: { competidores: Array.from({ length: 8 }, (_, i) => ({ nombre: 'c'.repeat(80), oferta: 'o', precio: { monto: 100 + i, moneda: 'GTQ', url: 'https://x.com/' + 'u'.repeat(250) } })) } }] };
const CTXS = [['vacío', {}], ['sin argumento', undefined], ['normal', CTX], ['grande', GRANDE]];

const comp = (o = {}) => ({ nombre: 'Rival', url: 'https://rival.com', oferta: 'Pizza barata', precio: { monto: 80, moneda: 'gtq', url: U }, canales: ['Instagram', 'tiktok', 'telepatía'], post: { texto: 'Combo', url: U, resonancia: '3x' }, pos: { x: 70, y: 30, url: U }, ...o });
const radarOk = () => ({ ejes: { x: { nombre: 'Precio', bajo: 'Bajo', alto: 'Alto' }, y: { nombre: 'Calidad', bajo: 'Baja', alto: 'Alta' } }, competidores: [comp(), comp({ nombre: 'Otro', url: 'https://otro.com', pos: { x: 20, y: 80, url: U } })], cliente: { x: 50, y: 60 }, huecos: [{ texto: 'Nadie hace delivery sano', url: U }] });
const llaves = (x, acc = new Set()) => { if (Array.isArray(x)) x.forEach((y) => llaves(y, acc)); else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { acc.add(k); llaves(v, acc); } return acc; };

// ---------- Competitor Radar ----------
t('radar: vacío — sin competidores, sin posiciones, sin huecos; el mapa no pinta nada', () => {
  const v = radar.vacio();
  assert.deepEqual(v.competidores, []); assert.deepEqual(v.huecos, []); assert.equal(v.cliente.x, null);
  assert.ok(radar.mapaVacio(v)); assert.equal(radar.clienteEnMapa(v), null); assert.deepEqual(radar.limpiar(v), v);
});
t('radar: limpiar — solo lo conocido, urls https, HTML como texto, canales válidos, idempotente', () => {
  const sucio = { ...radarOk(), id: 'x', v: 3, _meta: {}, competidores: [comp({ nombre: '<img onerror=x>', url: 'http://inseguro.com', extra: 1 }), {}, comp({ pos: { x: 500, y: -4, url: 'javascript:alert(1)' }, precio: { monto: '120', moneda: 'usd', url: '' } })] };
  const c = radar.limpiar(sucio);
  assert.equal(c.competidores.length, 2); // el vacío se cae
  assert.equal(c.competidores[0].nombre, '<img onerror=x>'); assert.equal(c.competidores[0].url, ''); // http no es evidencia
  assert.deepEqual(c.competidores[0].canales, ['instagram', 'tiktok']);
  assert.equal(c.competidores[1].pos.url, ''); assert.equal(c.competidores[1].pos.x, null); assert.equal(c.competidores[1].pos.y, null); // 500 y -4 fuera de rango → null
  for (const k of ['id', 'v', '_meta', 'extra']) assert.ok(!llaves(c).has(k) || k === 'id', k);
  assert.deepEqual(radar.limpiar(c), c); assert.deepEqual(radar.limpiar(structuredClone(c)), c);
  for (const malo of [null, undefined, 5, 'x', [], { competidores: 'x', huecos: 7, ejes: [] }]) assert.doesNotThrow(() => radar.limpiar(malo));
});
t('radar: urlOk — solo https con dominio, sin espacios ni javascript:', () => {
  assert.equal(radar.urlOk('https://a.com/x'), 'https://a.com/x');
  for (const m of ['http://a.com', 'javascript:alert(1)', 'https://', 'https://a b.com', '', null, 5, `https://a.com/${'x'.repeat(400)}`]) assert.equal(radar.urlOk(m), '');
});
t('radar: el mapa solo pinta posiciones con evidencia; sin evidencia no hay punto ni punto del cliente', () => {
  const c = radarOk();
  assert.equal(radar.puntosDelMapa(c).length, 2); assert.deepEqual(radar.clienteEnMapa(c), { x: 50, y: 60, puesto: true });
  c.competidores[0].pos.url = ''; assert.equal(radar.puntosDelMapa(c).length, 1);
  c.competidores[1].pos.url = ''; assert.ok(radar.mapaVacio(c)); assert.equal(radar.clienteEnMapa(c), null);
  const sinCliente = radarOk(); sinCliente.cliente = { x: null, y: null };
  assert.deepEqual(radar.clienteEnMapa(sinCliente), { x: 50, y: 50, puesto: false });
});
t('radar: un competidor archivado no se pinta ni cuenta (nada se borra)', () => {
  const c = radarOk(); c.competidores[0].archivado = true;
  assert.equal(radar.activos(c).length, 1); assert.equal(radar.puntosDelMapa(c).length, 1); assert.equal(radar.limpiar(c).competidores.length, 2);
});
t('radar: huecos — solo los que traen url se mandan al Opportunity Map', () => {
  const c = radarOk(); c.huecos.push({ texto: 'Sin pruebas', url: '' }, { texto: 'Archivado', url: U, archivado: true });
  assert.equal(radar.huecosDe(c).length, 2); assert.deepEqual(radar.huecosConEvidencia(c).map((h) => h.texto), ['Nadie hace delivery sano']);
});
t('radar: precios conocidos — sin url no cuentan; sin monto dice ⚠️ SIN DATOS, nunca 0', () => {
  const c = radarOk(); c.competidores[1].precio = { monto: 50, moneda: 'GTQ', url: '' };
  assert.deepEqual(radar.preciosConocidos(c).map((p) => p.monto), [80]);
  assert.match(radar.textoPrecio({ monto: null }), /SIN DATOS/); assert.doesNotMatch(radar.textoPrecio({ monto: null }), /\b0\b/);
});
t('radar: faltas — posición, precio y hueco sin url; mapa vacío; sin competidores', () => {
  assert.deepEqual(radar.faltas(radarOk()), []);
  assert.ok(radar.faltas(radar.vacio()).some((x) => /al menos un competidor/.test(x)));
  const c = radarOk(); c.competidores[0].pos.url = ''; c.competidores[1].precio = { monto: 10, moneda: 'GTQ', url: '' }; c.huecos[0].url = '';
  const f = radar.faltas(c).join('\n');
  assert.match(f, /posición de «Rival»/); assert.match(f, /precio de «Otro»/); assert.match(f, /hueco/); assert.match(f, /SIN DATOS/);
  const sinMapa = radarOk(); sinMapa.competidores.forEach((x) => { x.pos.url = ''; });
  assert.ok(radar.faltas(sinMapa).some((x) => /mapa no tiene ninguna posición/.test(x)));
});
t('radar: prompt < 5 000 caracteres, pide su bloque y los criterios, nunca Economía ni costos de Inherent', () => {
  for (const [n, ctx] of CTXS) {
    const p = radar.prompt(ctx);
    assert.ok(p.length < 5000, `${n}: ${p.length}`);
    assert.ok(p.includes(`${F}radar`), n); assert.ok(p.includes(`${F}criterios`), n);
    assert.doesNotMatch(p, /Ten en cuenta 06-ECONOMIA|lee .*06-ECONOMIA/i);
  }
  assert.match(radar.prompt(CTX), /@rival1/);
});
t('radar: leer — el bloque y los criterios; JSON roto o sin bloque → null', () => {
  const txt = `Listo.\n${F}radar\n${JSON.stringify(radarOk())}\n${F}\n${F}criterios\n${JSON.stringify({ entregable: 'Competitor Radar', cumple: ['a'], falta: ['b'] })}\n${F}`;
  const r = radar.leer(txt);
  assert.equal(r.contenido.competidores.length, 2); assert.deepEqual(r.criterios, { cumple: ['a'], falta: ['b'] });
  assert.equal(radar.leer(`${F}radar\n{roto\n${F}`), null); assert.equal(radar.leer('hola'), null); assert.equal(radar.leer(''), null);
});
t('radar: aMd — cada posición y hueco con su url; lo vacío dice ⚠️ SIN DATOS', () => {
  const md = radar.aMd(radarOk());
  assert.match(md, /# Competitor Radar/); assert.match(md, /\| Rival \| 70 \| 30 \| https:\/\/ejemplo\.com\/p \|/); assert.match(md, /Nadie hace delivery sano — https:\/\/ejemplo\.com\/p/);
  const vacio = radar.aMd(radar.vacio());
  assert.match(vacio, /SIN DATOS/); assert.doesNotMatch(vacio, /\| Cliente \|/);
  assert.match(radar.resumenTexto(radarOk()), /precios: Rival GTQ 80/);
});

// ---------- Pricing & Packages ----------
const pkg = (o = {}) => ({ id: 'p1', nombre: 'Básico', precio: 100, moneda: 'gtq', para_quien: 'Quien empieza', resumen: 'Lo esencial', incluye: ['f1'], costo: 40, recomendado: false, ...o });
const preciosOk = () => ({ features: [{ id: 'f1', nombre: 'Reels' }, { id: 'f2', nombre: 'Pauta' }], paquetes: [pkg(), pkg({ id: 'p2', nombre: 'Pro', precio: 200, incluye: ['f1', 'f2'], costo: 90, recomendado: true })], porque: 'Cubre la pauta y el margen aguanta (propuesta).',
  costos: { cac: 50, volumen: 10, compras: 6, fuente: '[dice el cliente, sin verificar]' } });

t('precios: vacío — sin paquetes ni costos; limpiar lo deja igual', () => {
  const v = precios.vacio(); assert.deepEqual(v.paquetes, []); assert.deepEqual(v.costos, { cac: null, volumen: null, compras: null, fuente: '' }); assert.deepEqual(precios.limpiar(v), v);
});
t('precios: limpiar — máximo 4 vivos, un solo recomendado, features que existen, HTML como texto, idempotente', () => {
  const sucio = { features: [{ id: 'f1', nombre: '<b>Reels</b>' }, { nombre: '' }], paquetes: Array.from({ length: 7 }, (_, i) => pkg({ id: `p${i}`, nombre: `P${i}`, recomendado: true, incluye: ['f1', 'fantasma'] })), id: 'x', v: 2, costos: { cac: '-5', volumen: 'x' } };
  const c = precios.limpiar(sucio);
  assert.equal(c.paquetes.length, 4); assert.equal(c.paquetes.filter((p) => p.recomendado).length, 1); assert.deepEqual(c.paquetes[0].incluye, ['f1']);
  assert.equal(c.features.length, 1); assert.equal(c.features[0].nombre, '<b>Reels</b>'); assert.equal(c.costos.cac, null); assert.equal(c.costos.volumen, null);
  assert.deepEqual(precios.limpiar(c), c); assert.ok(!llaves(c).has('_meta'));
  for (const malo of [null, undefined, 5, [], { paquetes: 'x', features: 3, costos: [] }]) assert.doesNotThrow(() => precios.limpiar(malo));
  const arch = precios.limpiar({ paquetes: [...Array.from({ length: 4 }, (_, i) => pkg({ id: `v${i}`, nombre: `V${i}` })), pkg({ id: 'a1', nombre: 'Viejo', archivado: true, recomendado: true })] });
  assert.equal(arch.paquetes.length, 5); assert.equal(precios.paquetesVivos(arch).length, 4); assert.equal(arch.paquetes.find((p) => p.id === 'a1').recomendado, false); // un archivado no se recomienda
});
t('precios: simular — margen %, LTV, LTV:CAC, equilibrio y utilidad; la cuenta exacta', () => {
  const r = precios.simular({ precio: 200, costo: 90, cac: 55, volumen: 10, compras: 6 });
  assert.equal(r.margenUnit, 110); assert.equal(r.margenPct, 55); assert.equal(r.ltv, 660); assert.equal(r.ltvCac, 12); assert.equal(r.equilibrio, 0.5); assert.equal(r.utilidadMes, 550);
});
t('precios: simular — lo que falta es null, nunca 0; división entre cero y negativos no revientan', () => {
  assert.deepEqual(precios.simular({}), { margenUnit: null, margenPct: null, ltv: null, ltvCac: null, equilibrio: null, utilidadMes: null });
  const sinCac = precios.simular({ precio: 100, costo: 40, compras: 3 }); assert.equal(sinCac.margenPct, 60); assert.equal(sinCac.ltvCac, null); assert.equal(sinCac.equilibrio, null); assert.equal(sinCac.utilidadMes, null);
  assert.equal(precios.simular({ precio: 0, costo: 0 }).margenPct, null); // precio 0: no hay % que calcular
  assert.equal(precios.simular({ precio: 100, costo: 40, cac: 0, compras: 2 }).ltvCac, null); // CAC 0: el cociente no existe
  const perdida = precios.simular({ precio: 50, costo: 80, cac: 10, compras: 2 }); assert.equal(perdida.margenPct, -60); assert.equal(perdida.equilibrio, null);
  const raros = precios.simular({ precio: -1, costo: 'x', cac: NaN, volumen: Infinity, compras: '3' }); assert.equal(raros.margenPct, null); assert.equal(raros.ltv, null);
  assert.equal(precios.simular({ precio: '1,000', costo: '400' }).margenUnit, 600); // lo que escribe una persona con coma
});
t('precios: matriz — columnas son los paquetes vivos y las filas los features', () => {
  const c = preciosOk(); c.paquetes.push(pkg({ id: 'p3', nombre: 'Viejo', archivado: true }));
  const m = precios.matriz(c);
  assert.deepEqual(m.columnas.map((x) => x.id), ['p1', 'p2']); assert.deepEqual(m.filas.map((f) => f.celdas), [[true, true], [false, true]]);
  assert.equal(precios.paqueteRecomendado(c).id, 'p2');
});
t('precios: costos solo para quien los ve — sinCostos los quita y conCostos los devuelve', () => {
  const c = precios.limpiar(preciosOk()), oculto = precios.sinCostos(c);
  assert.equal(oculto.costos.cac, null); assert.equal(oculto.costos.fuente, ''); assert.ok(oculto.paquetes.every((p) => p.costo === null)); assert.equal(oculto.paquetes[1].precio, 200); // el precio no es costo
  assert.ok(!JSON.stringify(oculto).includes('90')); assert.ok(!JSON.stringify(oculto).includes('"cac":50'));
  // quien no los ve edita el nombre y manda costos inventados: se descartan y vuelven los guardados
  const editado = structuredClone(oculto); editado.paquetes[1].nombre = 'Pro+'; editado.paquetes[1].costo = 1; editado.costos = { cac: 1, volumen: 1, compras: 1, fuente: 'x' };
  const g = precios.conCostos(c, editado);
  assert.equal(g.paquetes[1].nombre, 'Pro+'); assert.equal(g.paquetes[1].costo, 90); assert.deepEqual(g.costos, c.costos);
  assert.equal(precios.conCostos(null, editado).paquetes[1].costo, null); assert.equal(precios.conCostos(null, editado).costos.cac, null); // nada que conservar: nada se escribe
  assert.ok(precios.hayCostos(c)); assert.ok(!precios.hayCostos(oculto));
});
t('precios: costosReales — solo Partnership con Finanzas en la ficha', () => {
  assert.equal(precios.costosReales(CTX), true);
  assert.equal(precios.costosReales({ ...CTX, ficha: { incluye: [{ k: 'Áreas', v: 'Estrategia · Marketing' }] } }), false);
  assert.equal(precios.costosReales({ ...CTX, cliente: { ...CTX.cliente, nivel: { id: 'foundation' } } }), false);
  for (const x of [undefined, {}, { cliente: {} }]) assert.equal(precios.costosReales(x), false);
});
t('precios: faltas — 2 a 4 paquetes, 1 recomendado con su porqué, precio, matriz y costos con fuente', () => {
  assert.deepEqual(precios.faltas(preciosOk(), {}), []);
  const f0 = precios.faltas(precios.vacio()).join('\n'); assert.match(f0, /de 2 a 4 paquetes/); assert.match(f0, /matriz no tiene features/); assert.match(f0, /exactamente 1 paquete recomendado/);
  const c = preciosOk(); c.paquetes[0].precio = null; c.porque = ''; c.costos.fuente = '';
  const f = precios.faltas(c).join('\n'); assert.match(f, /«Básico» no tiene precio: ⚠️ SIN DATOS/); assert.match(f, /por qué se recomienda/); assert.match(f, /sin verificar/);
  assert.ok(precios.faltas(preciosOk(), { nivelId: 'growth' }).some((x) => /FUERA DEL ALCANCE/.test(x)));
});
t('precios: prompt < 5 000 caracteres; usa las variaciones de Offer Architect y los precios del Radar (solo con url)', () => {
  for (const [n, ctx] of CTXS) {
    const p = precios.prompt(ctx);
    assert.ok(p.length < 5000, `${n}: ${p.length}`); assert.ok(p.includes(`${F}precios`), n); assert.ok(p.includes(`${F}criterios`), n);
  }
  const conEntradas = { ...CTX, entradas: [{ tool: 'offer-architect', titulo: 'Oferta', version: 1, contenido: { variaciones: [{ nombre: 'Variación A', precio: 'Q500', diferencia: 'Más rápido' }] } },
    { tool: 'competitor-radar', titulo: 'Radar', version: 1, contenido: radarOk() }] };
  const p = precios.prompt(conEntradas);
  assert.match(p, /Variación A/); assert.match(p, /Rival GTQ 80/); assert.match(p, /PROPUESTA/); assert.match(precios.prompt(CTX), /SIN DATOS: no hay una oferta aprobada/);
});
t('precios: leer — el bloque y los criterios; roto o sin bloque → null', () => {
  const txt = `Listo.\n${F}precios\n${JSON.stringify(preciosOk())}\n${F}\n${F}criterios\n${JSON.stringify({ entregable: 'Pricing & Packages', cumple: ['a'], falta: [] })}\n${F}`;
  const r = precios.leer(txt); assert.equal(r.contenido.paquetes.length, 2); assert.deepEqual(r.criterios.cumple, ['a']);
  assert.equal(precios.leer(`${F}precios\n{roto\n${F}`), null); assert.equal(precios.leer('nada'), null);
});
t('precios: aMd — la matriz y la recomendada; sin permiso de costos el .md no lleva costos', () => {
  const sin = precios.aMd(preciosOk()), con = precios.aMd(preciosOk(), { verCostos: true });
  assert.match(sin, /Todo precio es una propuesta/); assert.match(sin, /\| \*\*Precio\*\* \| GTQ 100 \| GTQ 200 \|/); assert.match(sin, /Pro ★/);
  assert.doesNotMatch(sin, /CAC/); assert.match(con, /CAC: 50/); assert.match(con, /sin verificar/);
  assert.match(precios.aMd(precios.vacio()), /SIN DATOS/); assert.match(precios.resumenTexto(preciosOk()), /recomendado: Pro/);
});

// ---------- Prueba estática: cero lecturas de datos internos de Inherent ----------
t('estático: ni radar ni precios ni sus vistas leen datos internos de Inherent', () => {
  const ARCHIVOS = ['radar.js', 'radar-ui.js', 'precios.js', 'precios-ui.js'].map((f) => `public/js/strategy/${f}`);
  for (const a of ARCHIVOS) {
    const src = leerArchivo(a);
    for (const imp of src.matchAll(/(?:import|export)[^'"\n]*from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const m = imp[1] || imp[2];
      assert.doesNotMatch(m, /catalogo|armados|paquetes|finscope|rates|packages|bundles|payroll|recipes|economia/i, `${a} importa ${m}`);
    }
    assert.doesNotMatch(src, /\b(?:api|fetch)\(\s*[`'"][^`'"]*(?:rates|packages|bundles|payroll|cost_recipes|economia|catalogo|finscope)/i, `${a} lee una ruta interna`);
    assert.doesNotMatch(src, /(?:leer|lee|read)[^\n]{0,30}06-ECONOMIA/i, a);
    assert.doesNotMatch(src, /\blocalStorage\b(?![^\n]*try)/, a);
  }
  // Las dos herramientas solo se apoyan en módulos del propio Strategy, de Consulting (marcos) y del núcleo de la interfaz.
  const imps = ARCHIVOS.flatMap((a) => [...leerArchivo(a).matchAll(/from\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
  for (const i of imps) assert.match(i, /^\.\/(radar|precios|oferta)\.js$|^\.\.\/core\.js$|^\.\.\/consulting\/marcos\.js$|^\.\.\/marketing\/competencia-ui\.js$/, i);
});
t('servidor: el gate por nivel (pricing-packages no entra en Brand Growth; funnel-builder solo en Partnership) vive en abre()', () => {
  const src = leerArchivo('api/_lib/entregables.js');
  assert.match(src, /'pricing-packages':\s*\(id\)\s*=>\s*id !== 'growth'/); assert.match(src, /'funnel-builder':\s*\(id\)\s*=>\s*id === 'partnership'/);
  assert.match(src, /nivelDeOferta\(slug\)/); assert.match(src, /FUERA_DEL_ALCANCE/);
  const abre = src.slice(src.indexOf('async function abre('), src.indexOf('async function deDoc('));
  assert.match(abre, /nivelMal\(tool, slug\)/); assert.match(abre, /status\(403\)/);
  assert.ok(abre.indexOf('nivelMal') > abre.indexOf('if (write)')); // solo en escrituras: leer no se bloquea
});
t('vistas: las dos exportan el contrato del shell (nuevo, pintar, resumen)', async () => {
  for (const [a, m] of [['radar-ui', radar], ['precios-ui', precios]]) {
    const src = leerArchivo(`public/js/strategy/${a}.js`);
    assert.match(src, /export const vista = \{/); for (const k of ['nuevo(', 'pintar(', 'resumen(']) assert.ok(src.includes(k), `${a} ${k}`);
    assert.ok(m.vacio && m.limpiar && m.faltas && m.prompt && m.leer && m.aMd && m.BLOQUE);
  }
  assert.equal(radar.BLOQUE, 'radar'); assert.equal(precios.BLOQUE, 'precios');
});

console.log(`\n${ok} pruebas pasaron`);
