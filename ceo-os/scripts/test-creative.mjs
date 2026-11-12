// Pruebas de Creative (public/js/creative): Creative Direction Lab (direccion.js): faltas, limpiar, leer, prompt, aMd.
// node scripts/test-creative.mjs
import assert from 'node:assert/strict';
import * as d from '../public/js/creative/direccion.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const F = '```';
const concepto = (n) => ({ id: `c${n}`, nombre: `Concepto ${n}`, idea: `Idea ${n}`, hook: 'Hook', tecnica: 'escala', imagenes: [0, 2], formato: 'Reel', laya: '' });
const completo = () => ({ mes: '2026-11', campana: { id: 'k1', nombre: 'Sol', frase: 'El sol como sistema', mbt: 'm', briefs: [{ slot: 'MK-001', titulo: 'x' }] }, insight: 'Nadie sabe qué pedir', big_idea: 'Pedir es fácil', conceptos: [1, 2, 3].map(concepto), elegido: 'c2' });

t('vacío: faltan tres cosas', () => assert.equal(d.faltas(d.vacio()).length, 3));
t('completo: sin faltas', () => assert.deepEqual(d.faltas(completo()), []));
t('faltas: 2 conceptos, sin insight ni big idea', () => {
  const c = completo(); c.conceptos.pop(); c.insight = ''; c.big_idea = '';
  assert.equal(d.faltas(c).length, 3);
});
t('descartar resta de los conceptos válidos y suelta el elegido', () => {
  const c = completo(); c.conceptos[1].descartado = true;
  assert.equal(d.faltas(c).length, 1); assert.equal(d.limpiar(c).elegido, '');
  assert.equal(d.limpiar(c).conceptos.length, 3);
});
t('limpiar: máximo 5, ids únicos, 3 imágenes, HTML como texto', () => {
  const c = d.limpiar({ x: 1, _meta: {}, mes: 'mal', conceptos: Array.from({ length: 8 }, () => ({ id: 'c1', nombre: '<b>a</b>', idea: 'i', imagenes: [3, 3, 1, 2, 9, 'x'] })), elegido: 'zzz' });
  assert.equal(c.conceptos.length, 5); assert.equal(new Set(c.conceptos.map((k) => k.id)).size, 5);
  assert.deepEqual(c.conceptos[0].imagenes, [3, 1, 2]); assert.equal(c.mes, ''); assert.equal(c.elegido, ''); assert.equal('x' in c, false);
});
t('limpiar: basura no truena', () => { for (const x of [null, 5, 'hola', [], { conceptos: 'no', campana: 7 }]) assert.deepEqual(d.limpiar(x), d.vacio()); });
t('limpiar: idempotente y conserva la campaña', () => { const c = d.limpiar(completo()); assert.deepEqual(d.limpiar(c), c); assert.equal(c.campana.briefs.length, 1); });
t('leer: bueno', () => {
  const j = JSON.stringify({ insight: 'i', big_idea: 'b', conceptos: [1, 2, 3].map(concepto), elegido: '' });
  const r = d.leer(`Listo.\n${F}direccion\n${j}\n${F}\n${F}criterios\n{"cumple":["a"],"falta":["b"]}\n${F}`);
  assert.equal(r.contenido.conceptos.length, 3); assert.deepEqual(r.criterios, { cumple: ['a'], falta: ['b'] });
});
t('leer: a medias y basura → null', () => {
  assert.equal(d.leer(`${F}direccion\n{"insight":"i","conceptos":[`), null);
  assert.equal(d.leer('sin bloque'), null); assert.equal(d.leer(null), null);
});
t('prompt: < 5000, pide su bloque, criterios y el método; sin economía', () => {
  const p = d.prompt({ cliente: { nombre: 'X'.repeat(60), slug: 'akai' }, hoy: '2026-10-27', aprendizajes: ['a'.repeat(300)], entradas: [{ tool: 'campaign-architect', contenido: { campana: { nombre: 'Sol', frase: 'f'.repeat(240), mbt: 'm'.repeat(400) } } }] });
  assert.ok(p.length < 5000, String(p.length));
  for (const s of [`${F}direccion`, `${F}criterios`, 'recepcion', 'mc-campanas-piezas', 'mc-campanas-piezas']) assert.ok(p.includes(s), s);
  assert.ok(p.indexOf('recepcion') < p.indexOf('mc-campanas-piezas') && p.indexOf('mc-campanas-piezas') < p.lastIndexOf('mc-campanas-piezas'), 'recepcion → campaña → piezas');
  assert.ok(/nunca leas ni cites inherent\/06-ECONOMIA/i.test(p));
  assert.ok(d.prompt({}).length < 5000);
});
t('aMd: sin costos, vacío dice SIN DATOS', () => {
  assert.ok(d.aMd(d.vacio()).includes('⚠️ SIN DATOS')); const m = d.aMd(completo());
  assert.ok(m.includes('(elegido)')); assert.ok(!/costo|margen|06-ECONOMIA/i.test(m));
});
t('ideaDeConcepto: slot en mayúsculas y campos cortos', () => { const i = d.ideaDeConcepto(concepto(1), 'mk-001'); assert.equal(i.slot, 'MK-001'); assert.equal(i.titulo, 'Concepto 1'); });
console.log(`\n${ok} pruebas ok`);
