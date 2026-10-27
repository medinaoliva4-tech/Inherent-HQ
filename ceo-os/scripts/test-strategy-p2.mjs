// Pruebas de Commercial Diagnosis (strategy/comercial.js) y Opportunity Map (strategy/oportunidades.js): score reproducible, embudo y cuellos,
// limpiarParche con viva.comercial, tareas con la forma de tareaDeEncargo, ranking con pesos, lo FUERA DEL ALCANCE, prompts y lectura de la IA.
// node scripts/test-strategy-p2.mjs
import assert from 'node:assert/strict';
import * as cd from '../public/js/strategy/comercial.js';
import * as om from '../public/js/strategy/oportunidades.js';
import { limpiarParche, aplicar, cascada } from '../public/js/estrategia-viva.js';
import { tareaDeEncargo } from '../public/js/llm/modos.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const F = '```';
const VIVA = { meta: { objetivo: 120000 }, inversa: { ticket: 4800, cierre: 0.25, conversion: 0.02, visita: 0.03 }, contenido: { piezas: 14, alcance_pieza: 8000 }, pauta: { mensual: 1000, cpm: 60 },
  riesgos: [{ texto: 'Capacidad', estado: 'ok' }, { texto: 'Inventario', estado: 'riesgo' }] };
const CTX = { hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'AKAI', nivel: { id: 'partnership', nombre: 'Growth Partnership' } }, ficha: { incluye: [{ k: 'Áreas', v: '10' }], fuera: 'nómina' },
  estrategia: { etapa: { n: 3, confirmada: true }, trabado: 'leads', meta: 'Vender 1.5M' }, entradas: [], aprendizajes: [] };
const GRANDE = { ...CTX, cliente: { slug: 'x', nombre: 'N'.repeat(500), nivel: { id: 'p', nombre: 'P'.repeat(300) } }, ficha: { incluye: Array.from({ length: 40 }, (_, i) => ({ k: `K${i}`.padEnd(80, 'k'), v: 'v'.repeat(200) })), fuera: 'f'.repeat(3000) },
  aprendizajes: Array.from({ length: 20 }, () => 'a'.repeat(500)), comercial_resumen: 'r'.repeat(2000) };

// ---------- Commercial Diagnosis ----------
t('score: reproducible y entre 0 y 100', () => {
  const a = cd.score(VIVA), b = cd.score(JSON.parse(JSON.stringify(VIVA)));
  assert.deepEqual(a, b); assert.ok(a.score >= 0 && a.score <= 100); assert.equal(a.partes.reduce((n, p) => n + p.max, 0), 100);
  assert.equal(a.partes.find((p) => p.id === 'supuestos').pts, 35);
});
t('score: sin ningún dato es null (⚠️ SIN DATOS), nunca 0', () => {
  assert.equal(cd.score({}).score, null); assert.equal(cd.score(undefined).score, null); assert.equal(cd.score({ meta: {} }).score, null);
  assert.ok(cd.score({}).partes.some((p) => p.nota.includes('SIN DATOS')));
});
t('score: más supuestos o más cobertura sube el score', () => {
  const poco = cd.score({ meta: { objetivo: 120000 } }).score, mas = cd.score({ ...VIVA, riesgos: [] }).score;
  assert.ok(mas > poco);
  assert.ok(cd.score({ ...VIVA, contenido: { piezas: 40, alcance_pieza: 8000 } }).score >= cd.score(VIVA).score);
});
t('embudo: se recalcula al editar un supuesto', () => {
  const e1 = cd.embudo(VIVA), e2 = cd.embudo({ ...VIVA, inversa: { ...VIVA.inversa, cierre: 0.5 } });
  assert.equal(e1.pasos.length, 5); assert.equal(e1.pasos[1].valor, 25);
  assert.ok(e2.pasos[2].valor < e1.pasos[2].valor); assert.equal(e1.cubre, cascada(VIVA).cubre);
});
t('cuellos: tasa que falta y hueco de alcance mayor a 20%', () => {
  const sin = cd.cuellos({ meta: { objetivo: 1000 }, inversa: { ticket: 100 } });
  assert.deepEqual(sin.filter((x) => x.tipo === 'tasa').map((x) => x.etapa).sort(), ['alcance', 'conversaciones', 'visitas']);
  assert.ok(sin.every((x) => x.texto.includes('SIN DATOS')));
  const hueco = cd.cuellos(VIVA).find((x) => x.tipo === 'alcance'); assert.ok(hueco && hueco.hueco > 0.2);
  assert.equal(cd.cuellos({ ...VIVA, contenido: { piezas: 60, alcance_pieza: 8000 } }).filter((x) => x.tipo === 'alcance').length, 0, 'sin hueco no hay cuello');
  const nada = cd.cuellos({ meta: { objetivo: 1000 }, inversa: { ticket: 10, cierre: 0.5, conversion: 0.5, visita: 0.5 } }).find((x) => x.tipo === 'alcance');
  assert.ok(nada && nada.texto.includes('SIN DATOS'), 'sin contenido ni pauta, el alcance es un cuello sin dato');
});
t('limpiarParche acepta viva.comercial { bottlenecks, acciones } y ajusta tipos', () => {
  const p = limpiarParche({ comercial: { bottlenecks: [{ id: 'B 1!', etapa: 'alcance', tipo: 'alcance', texto: 'Falta alcance', nota: 'n' }, { etapa: 'inventada', texto: 'x' }, { texto: '' }],
    acciones: [{ titulo: 'Reels', area: 'Mercadeo', fecha: '2026-11-30', cuello: 'b1', extra: 'x' }, { titulo: 'Mala', area: 'nada', fecha: '30/11' }, ...Array.from({ length: 8 }, (_, i) => ({ titulo: `a${i}` }))], hack: 1 } });
  assert.deepEqual(Object.keys(p.comercial).sort(), ['acciones', 'bottlenecks']);
  assert.equal(p.comercial.bottlenecks.length, 2); assert.equal(p.comercial.bottlenecks[0].id, 'b1'); assert.equal(p.comercial.bottlenecks[1].etapa, '');
  assert.equal(p.comercial.acciones.length, 5, 'máximo 5'); assert.equal(p.comercial.acciones[0].area, 'marketing');
  assert.equal(p.comercial.acciones[1].area, ''); assert.equal(p.comercial.acciones[1].fecha, '');
  assert.ok(!('extra' in p.comercial.acciones[0]) && !('hack' in p.comercial));
  assert.deepEqual(limpiarParche({ comercial: 'x' }), {}); assert.deepEqual(limpiarParche({ comercial: { acciones: [] } }).comercial, { acciones: [] });
  const { viva } = aplicar({ comercial: { bottlenecks: [{ id: 'b1', texto: 'a' }], acciones: [] } }, limpiarParche({ comercial: { acciones: [{ titulo: 'z' }] } }));
  assert.equal(viva.comercial.bottlenecks.length, 1, 'un parche con solo acciones no borra los cuellos');
});
t('limpiar: idempotente y aguanta basura', () => {
  const c = cd.limpiar({ acciones: [{ titulo: 'A', area: 'ads', fecha: '2026-12-01' }], bottlenecks: [] });
  assert.deepEqual(cd.limpiar(c), c);
  for (const x of [null, undefined, 5, 'x', [], { acciones: 'x' }, { bottlenecks: [null, 1, {}] }]) assert.deepEqual(cd.limpiar(x), { bottlenecks: [], acciones: [] });
});
t('faltas: 3 a 5 acciones, con área y fecha', () => {
  assert.ok(cd.faltas({ acciones: [] }).some((x) => x.includes('3 a 5')));
  const A = (n, o = {}) => ({ titulo: `a${n}`, area: 'marketing', fecha: '2026-12-01', ...o });
  assert.deepEqual(cd.faltas({ acciones: [A(1), A(2), A(3)] }, { hoy: '2026-10-27' }), []);
  const f = cd.faltas({ acciones: [A(1, { area: '' }), A(2, { fecha: '' }), A(3, { fecha: '2026-01-01' })] }, { hoy: '2026-10-27' });
  assert.equal(f.length, 3 + 0 - 0); assert.ok(f.some((x) => x.includes('área')) && f.some((x) => x.includes('fecha pasada')));
});
t('tareasDe: la forma de tareaDeEncargo, privadas, id estable y sin repetir', () => {
  const acciones = [{ id: 'a1', titulo: 'Reels de producto', area: 'marketing', fecha: '2026-11-30' }, { id: 'a2', titulo: 'Sin área', area: '', fecha: '2026-11-30' }];
  const q = { slug: 'akai', nombre: 'AKAI', email: 'a@b.c' }, ts = cd.tareasDe(acciones, q), t1 = ts[0];
  assert.equal(ts.length, 1, 'sin área no se convierte');
  const base = tareaDeEncargo({ area: 'marketing', titulo: 'Reels de producto', por_que: 'x', vence: '2026-11-30' }, q);
  for (const k of Object.keys(base)) assert.ok(k in t1, `falta ${k}`);
  assert.equal(t1.visibility, 'private'); assert.equal(t1.origen, 'estrategia'); assert.equal(t1.due, '2026-11-30'); assert.equal(t1.client_slug, 'akai');
  assert.equal(t1.id, cd.tareasDe(acciones, q)[0].id); assert.match(t1.id, /^cd-akai-a1$/);
});
t('aOportunidades: los cuellos llegan sin puntajes y con su origen', () => {
  const o = cd.aOportunidades(cd.cuellos(VIVA)); assert.equal(o.length, 1);
  assert.equal(o[0].origen, 'commercial-diagnosis:alcance'); assert.ok(o[0].titulo && o[0].evidencia);
  const item = om.nuevoItem(o[0]); assert.equal(item.impacto, null); assert.equal(item.estado, 'propuesta'); assert.equal(item.origen, 'commercial-diagnosis:alcance');
});
t('prompt de comercial: < 5000, pide su bloque y criterios, sin costos de Inherent', () => {
  for (const c of [CTX, GRANDE, {}, null]) {
    const p = cd.prompt(c); assert.ok(p.length < 5000, `mide ${p.length}`);
    assert.ok(p.includes(`${F}estrategia`) && p.includes(`${F}criterios`) && p.includes('"comercial"'));
    assert.ok(!/costo de producción|rates|packages|payroll|margen de inherent/i.test(p));
  }
  assert.ok(!cd.resumenTexto(VIVA).includes('1000'), 'sin permiso de costos la pauta no viaja');
  assert.ok(cd.resumenTexto(VIVA, { conPauta: true }).includes('1000'));
  assert.ok(cd.resumenTexto({}).includes('SIN DATOS'));
});
t('leer de comercial: bloque bueno, JSON roto y sin bloque', () => {
  const j = { comercial: { bottlenecks: [{ etapa: 'visitas', tipo: 'tasa', texto: 'Falta conversión' }], acciones: [{ titulo: 'Landing', area: 'ads', fecha: '2026-11-20' }] } };
  const r = cd.leer(`Resumen\n${F}estrategia\n${JSON.stringify(j)}\n${F}\n${F}criterios\n{"entregable":"Commercial Diagnosis","cumple":["a"],"falta":["b — c"]}\n${F}`);
  assert.equal(r.contenido.acciones[0].area, 'ads'); assert.deepEqual(r.criterios.cumple, ['a']);
  assert.equal(cd.leer(`${F}estrategia\n{rota\n${F}`), null); assert.equal(cd.leer('nada'), null); assert.equal(cd.leer(`${F}estrategia\n{"meta":{"objetivo":5}}\n${F}`), null);
});
t('aMd de comercial: score, embudo y plan; lo vacío dice SIN DATOS', () => {
  const md = cd.aMd({ acciones: [{ id: 'a1', titulo: 'Reels', area: 'marketing', fecha: '2026-11-30' }] }, VIVA);
  assert.ok(md.includes('# Commercial Diagnosis') && md.includes('Reels') && md.includes('Marketing') && md.includes('/100'));
  assert.ok(cd.aMd({}, {}).includes('SIN DATOS'));
});

// ---------- Opportunity Map ----------
const I = (o = {}) => ({ id: 'x', titulo: 'T', origen: 'business-xray', impacto: 4, dificultad: 2, costo: 2, tiempo: 2, confianza: 4, evidencia: 'dato', estado: 'propuesta', fuera_alcance: false, ...o });
t('ranking: impacto×confianza/(dificultad×costo×tiempo) y orden', () => {
  assert.equal(om.rankingDe(I({ impacto: 5, confianza: 4, dificultad: 2, costo: 2, tiempo: 5 })), 1);
  assert.equal(om.rankingDe(I({ impacto: 4, confianza: 4, dificultad: 2, costo: 2, tiempo: 2 })), 2);
  const r = om.ranking({ items: [I({ id: 'a', titulo: 'A', impacto: 2 }), I({ id: 'b', titulo: 'B', impacto: 5 }), I({ id: 'c', titulo: 'C', confianza: null })] });
  assert.deepEqual(r.map((x) => x.id), ['b', 'a', 'c']); assert.equal(r[0].n, 1); assert.equal(r[2].ranking, null); assert.equal(r[2].n, null);
});
t('ranking: cambiar un puntaje reordena', () => {
  const c = { items: [I({ id: 'a', titulo: 'A' }), I({ id: 'b', titulo: 'B', impacto: 3 })] };
  assert.equal(om.ranking(c)[0].id, 'a'); c.items[1].impacto = 5; c.items[1].confianza = 5; assert.equal(om.ranking(c)[0].id, 'b');
});
t('ranking: los pesos se ven y cambian el orden', () => {
  const a = I({ id: 'a', titulo: 'A', impacto: 5, dificultad: 4 }), b = I({ id: 'b', titulo: 'B', impacto: 3, dificultad: 1 });
  assert.equal(om.ranking({ items: [a, b] })[0].id, 'b');
  const c = om.limpiar({ items: [a, b], pesos: { impacto: 3, dificultad: 0.5 } }); assert.equal(c.pesos.impacto, 3);
  assert.equal(om.ranking(c)[0].id, 'a'); assert.deepEqual(om.limpiar({ items: [], pesos: { impacto: 99, costo: 'x' } }).pesos, { impacto: 1, dificultad: 1, costo: 1, tiempo: 1, confianza: 1 });
});
t('cuadrante: 2×2 por impacto y dificultad', () => {
  assert.equal(om.cuadrante(I({ impacto: 5, dificultad: 1 })), 'rapida'); assert.equal(om.cuadrante(I({ impacto: 5, dificultad: 5 })), 'apuesta');
  assert.equal(om.cuadrante(I({ impacto: 1, dificultad: 1 })), 'relleno'); assert.equal(om.cuadrante(I({ impacto: 1, dificultad: 5 })), 'evitar'); assert.equal(om.cuadrante(I({ impacto: null })), null);
});
t('limpiar: puntajes 1 a 5 o null (nunca 0), ids únicos, origen siempre', () => {
  const c = om.limpiar({ items: [{ id: 'a', titulo: 'A', impacto: 0, dificultad: 9, costo: '3', tiempo: 'x', confianza: 5.4 }, { id: 'a', titulo: 'B' }, { titulo: '' }, { titulo: 'C', origen: '' }] });
  assert.equal(c.items.length, 3); assert.deepEqual(c.items[0], { id: 'a', titulo: 'A', origen: 'manual', impacto: null, dificultad: null, costo: 3, tiempo: null, confianza: null, evidencia: '', estado: 'propuesta', fuera_alcance: false });
  assert.equal(new Set(c.items.map((x) => x.id)).size, 3); assert.ok(c.items.every((x) => x.origen));
  const d = om.limpiar(c); assert.deepEqual(d, c);
  for (const x of [null, 3, 'x', [], { items: 'x' }, { items: [null, 1, {}] }]) assert.deepEqual(om.limpiar(x).items, []);
});
t('FUERA DEL ALCANCE: no se elige y no se envía al roadmap', () => {
  const c = om.limpiar({ items: [I({ id: 'a', titulo: 'A', estado: 'elegida' }), I({ id: 'b', titulo: 'B', estado: 'elegida', fuera_alcance: true }), I({ id: 'c', titulo: 'C', estado: 'enviada', fuera_alcance: 'true' })] });
  assert.equal(c.items[1].estado, 'propuesta'); assert.equal(c.items[2].estado, 'propuesta');
  assert.equal(om.puedeEnviar(c.items[0]), true); assert.equal(om.puedeEnviar(c.items[1]), false); assert.equal(om.puedeElegir(c.items[1]), false);
  const rm = om.aRoadmap(c.items, { area: 'Mercadeo', trimestre: 'Q2' }); assert.equal(rm.length, 1);
  assert.deepEqual([rm[0].oportunidad_id, rm[0].area, rm[0].trimestre], ['a', 'marketing', 'T2']);
  assert.equal(om.aRoadmap([I({ estado: 'propuesta' })]).length, 0); assert.equal(om.tareasDe(c.items, { slug: 'akai' }).length, 1);
  assert.equal(om.ranking(c).at(-1).fuera_alcance, true, 'lo fuera del alcance va al final');
});
t('cada ítem guarda su origen y el roadmap lo recibe con oportunidad_id', async () => {
  const { limpiarItems } = await import('../public/js/strategy/roadmap.js');
  const filas = limpiarItems(om.aRoadmap([I({ id: 'o-abc', estado: 'elegida' })]));
  assert.equal(filas[0].oportunidad_id, 'o-abc'); assert.equal(om.limpiar({ items: [I({ origen: 'commercial-diagnosis:alcance' })] }).items[0].origen, 'commercial-diagnosis:alcance');
});
t('tareasDe de oportunidades: la forma de tareaDeEncargo y id estable', () => {
  const q = { slug: 'akai', nombre: 'AKAI', email: 'a@b.c' }, ts = om.tareasDe([I({ id: 'a', estado: 'elegida' })], q), base = tareaDeEncargo({ area: 'estrategia', titulo: 'T', por_que: 'x', vence: '' }, q);
  for (const k of Object.keys(base)) assert.ok(k in ts[0]); assert.equal(ts[0].visibility, 'private'); assert.equal(ts[0].id, 'op-akai-a');
});
t('faltas: sin oportunidades, sin puntajes, sin evidencia o sin elegir', () => {
  assert.deepEqual(om.faltas({ items: [] }), ['Falta al menos una oportunidad']);
  assert.ok(om.faltas({ items: [I({ confianza: null, evidencia: '' })] }).length >= 3);
  assert.deepEqual(om.faltas({ items: [I({ estado: 'elegida' })] }), []);
  assert.ok(om.faltas({ items: [I({ estado: 'elegida', fuera_alcance: true })] }).some((x) => x.includes('Elige')));
});
t('prompt de oportunidades: < 5000, pide su bloque y criterios, marca FUERA DEL ALCANCE', () => {
  for (const c of [CTX, GRANDE, {}, null]) {
    const p = om.prompt(c); assert.ok(p.length < 5000, `mide ${p.length}`);
    assert.ok(p.includes(`${F}oportunidades`) && p.includes(`${F}criterios`) && p.includes('fuera_alcance') && p.includes('FUERA DEL ALCANCE'));
  }
  const p = om.prompt({ ...CTX, entradas: [{ tool: 'business-xray', titulo: 'X', version: 2, contenido: { conclusion: 'se traba en leads', trabado: 'leads', salud: [] } }] }); assert.ok(p.includes('Business X-Ray v2'));
});
t('leer de oportunidades: bloque bueno, JSON roto, sin bloque y objeto vacío', () => {
  const j = { items: [{ titulo: 'Alianza', origen: 'business-xray', impacto: 4, dificultad: 2, costo: 1, tiempo: 2, confianza: 3, evidencia: 'e', fuera_alcance: true }, { titulo: '<img src=x onerror=1>', impacto: 3 }] };
  const r = om.leer(`ok\n${F}oportunidades\n${JSON.stringify(j)}\n${F}\n${F}criterios\n{"entregable":"Opportunity Map","cumple":["a"],"falta":[]}\n${F}`);
  assert.equal(r.contenido.items.length, 2); assert.equal(r.contenido.items[0].fuera_alcance, true); assert.deepEqual(r.criterios.cumple, ['a']);
  assert.equal(om.leer(`${F}oportunidades\n{rota\n${F}`), null); assert.equal(om.leer('x'), null); assert.equal(om.leer(`${F}oportunidades\n{"items":[]}\n${F}`), null);
});
t('aMd y resumenTexto de oportunidades', () => {
  const c = { items: [I({ id: 'a', titulo: 'A|B', estado: 'elegida' }), I({ id: 'b', titulo: 'F', fuera_alcance: true, confianza: null, evidencia: '' })] };
  const md = om.aMd(c); assert.ok(md.includes('# Opportunity Map') && md.includes('FUERA DEL ALCANCE') && md.includes('SIN DATOS') && md.includes('A\\|B'));
  assert.ok(om.aMd({}).includes('SIN DATOS')); assert.ok(om.resumenTexto(c).includes('fuera del alcance 1'));
});
console.log(`\n${ok} pruebas ok`);
