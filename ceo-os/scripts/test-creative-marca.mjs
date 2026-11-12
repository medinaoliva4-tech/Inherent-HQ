// Pruebas de Creative · marca (public/js/creative): Brand DNA Studio (dna.js) y Moodboard Studio (moodboard.js):
// limpiar, faltas, prompt, leer, aMd, radar y las reglas de https, ojo y citas.
// node scripts/test-creative-marca.mjs
import assert from 'node:assert/strict';
import * as dna from '../public/js/creative/dna.js';
import * as mb from '../public/js/creative/moodboard.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const F = '```';
const ctx = { hoy: '2026-10-27', cliente: { slug: 'demo', nombre: 'Demo' }, ficha: null, estrategia: {}, entradas: [], aprendizajes: [], aprobada: 'Meta: 40K al mes', imagenes: [] };

const dnaLleno = () => ({
  territorio: { territorio: 'Comida real, sin prisa', arquetipo: 'El cuidador', es: ['cálida'], no_es: ['gritona'] },
  personalidad: dna.EJES.map((e) => ({ eje: e.id, valor: 6 })),
  voz: { tono: ['cercano', 'claro', 'directo'], pares: [{ bien: 'Pídelo hoy', mal: 'Aproveche ya' }], si: ['hoy'], no: ['oferta'] },
  activos: [1, 2, 3].map((i) => ({ nombre: `Activo ${i}`, que: 'algo', prueba: 'se ve sin logo' })),
});

t('dna.vacio: 6 ejes en null, sin activos', () => { const v = dna.vacio(); assert.equal(v.personalidad.length, 6); assert(v.personalidad.every((p) => p.valor === null)); assert.deepEqual(v.activos, []); });
t('dna.limpiar: tipos, tope y HTML queda texto', () => {
  const c = dna.limpiar({ territorio: { territorio: '<b>x</b>', es: ['a', 5, null] }, personalidad: [{ eje: 'humor', valor: 99 }, { eje: 'raro', valor: 3 }, { eje: 'acceso', valor: '7' }], voz: { tono: ['a', 'b', 'c', 'd'] }, activos: Array.from({ length: 9 }, (_, i) => ({ nombre: 'n' + i })), extra: 1 });
  assert.equal(c.territorio.territorio, '<b>x</b>'); assert.equal(c.personalidad.find((p) => p.eje === 'humor').valor, null);
  assert.equal(c.personalidad.find((p) => p.eje === 'acceso').valor, 7); assert.equal(c.voz.tono.length, 3); assert.equal(c.activos.length, 5); assert(!('extra' in c));
  assert.deepEqual(dna.limpiar(null), dna.vacio());
});
t('dna.faltas: < 3 activos no valida; completo sí; sin ficha bloquea', () => {
  const c = dnaLleno(); assert.deepEqual(dna.faltas(c, { ficha: true }), []);
  c.activos = c.activos.slice(0, 2); assert(dna.faltas(c).some((f) => /menos de 3 activos/.test(f)));
  assert(dna.faltas(dnaLleno(), { ficha: false })[0].includes('ficha'));
  assert(dna.faltas(dna.vacio()).length >= 6);
});
t('dna.radar: valores null no cuentan; con menos de 3 no hay polígono', () => {
  assert.equal(dna.radar(dna.vacio()).poligono, ''); const r = dna.radar(dnaLleno()); assert.equal(r.ubicados, 6); assert.equal(r.poligono.split(' ').length, 6);
  const c = dna.vacio(); c.personalidad[0].valor = 0; assert.equal(dna.radar(c).ejes[0].punta.join(), '0,0');
});
t('dna.mezclar: solo cambia la sección aceptada', () => {
  const a = dnaLleno(), n = dna.vacio(); n.voz.tono = ['x']; const m = dna.mezclar(a, n, 'voz');
  assert.deepEqual(m.voz.tono, ['x']); assert.equal(m.activos.length, 3); assert(dna.seccionLlena(n, 'voz')); assert(!dna.seccionLlena(n, 'activos'));
});
t('dna.prompt: < 5000, pide dna y criterios, sin economía de Inherent', () => {
  const p = dna.prompt(ctx); assert(p.length < 5000); assert(p.includes(F + 'dna')); assert(p.includes(F + 'criterios')); assert(p.includes('Meta: 40K')); assert(/nada de costos/i.test(p));
  assert(!/Q\d|tarifa de/i.test(p)); assert(dna.prompt({ ...ctx, seccion: 'voz' }).includes('br-territorio-voz'));
  assert(dna.prompt({ ...ctx, aprobada: '' }).includes('SIN DATOS')); assert(dna.prompt({ ...ctx, aprobada: 'x'.repeat(9000), dna: dnaLleno() }).length < 5000);
});
t('dna.leer: bloque + criterios; roto → null', () => {
  const txt = `ok\n${F}dna\n${JSON.stringify(dnaLleno())}\n${F}\n${F}criterios\n{"entregable":"Brand DNA","cumple":["a"],"falta":[]}\n${F}`;
  const r = dna.leer(txt); assert.equal(r.contenido.activos.length, 3); assert.deepEqual(r.criterios.cumple, ['a']);
  assert.equal(dna.leer(`${F}dna\n{roto\n${F}`), null); assert.equal(dna.leer('nada'), null);
});
t('dna.aMd: sin datos dice SIN DATOS, nunca 0', () => { const md = dna.aMd(dna.vacio(), { cliente: 'Demo' }); assert(md.includes('SIN DATOS')); assert(!/\| 0 \|/.test(md)); assert(dna.aMd(dnaLleno()).includes('Activo 3')); });

const imgs = () => [{ url: 'https://x.com/a.jpg', zona: 'Color', note: 'vieja' }, { url: 'http://x.com/b.jpg' }, { url: 'javascript:alert(1)' }, { url: 'https://x.com/c.jpg', zona: 'tipografía', nota: 'serif', ojo: { parecido: 0, refs: 3 } }, { url: 'https://x.com/d.jpg', zona: 'otra', ojo: { parecido: 0.82, refs: 4, at: 'hoy' }, fijada: true }];
t('mb.limpiarImagenes: solo https, zona válida, nota vieja se conserva', () => {
  const l = mb.limpiarImagenes(imgs()); assert.equal(l.length, 3); assert.equal(l[0].zona, 'color'); assert.equal(l[0].nota, 'vieja'); assert.equal(l[1].zona, 'tipografia'); assert.equal(l[2].zona, 'foto');
});
t('mb.ojo: parecido 0 o ausente → null (nunca 0%)', () => { const l = mb.limpiarImagenes(imgs()); assert.equal(l[1].ojo, null); assert.equal(l[0].ojo, null); assert.equal(l[2].ojo.parecido, 0.82); assert(l[2].fijada); assert.equal(mb.limpiarOjo({ parecido: 'a' }), null); });
t('mb.archivada: se conserva, no se ve y no entra al prompt, pero guarda su índice', () => {
  const l = [{ url: 'https://x.com/a.jpg', archivada: true }, { url: 'https://x.com/b.jpg', zona: 'color' }];
  assert(mb.limpiarImagenes(l)[0].archivada); assert.deepEqual(mb.porZona(l).color.map((x) => x.i), [1]); assert(!mb.prompt({ imagenes: l }).includes('[0]')); assert(mb.prompt({ imagenes: l }).includes('[1] Color'));
});
t('mb.porZona: índices reales', () => { const z = mb.porZona(imgs()); assert.deepEqual(z.color.map((x) => x.i), [0]); assert.deepEqual(z.foto.map((x) => x.i), [2]); assert.equal(z.personas.length, 0); });
t('mb.limpiar: máx 3 direcciones, citas fuera de rango se caen, paleta hex', () => {
  const d = mb.limpiar({ direcciones: [{ nombre: 'A', refs: [0, 2, 9, -1, 1.5, 0], paleta: ['#ABCDEF', 'rojo', '123456'] }, { nombre: 'B' }, { idea: 'C' }, { nombre: 'D' }, {}] }, 3).direcciones;
  assert.equal(d.length, 3); assert.deepEqual(d[0].refs, [0, 2]); assert.deepEqual(d[0].paleta, ['#abcdef', '#123456']);
});
t('mb.faltas: sin imágenes, zonas vacías, direcciones sin citas', () => {
  assert(mb.faltas(mb.vacio(), { imagenes: [] })[0].includes('SIN DATOS'));
  const f = mb.faltas({ direcciones: [{ nombre: 'A', refs: [9] }] }, { imagenes: imgs() }); assert(f.some((x) => /Zonas sin imágenes/.test(x))); assert(f.some((x) => /Faltan direcciones/.test(x))); assert(f.some((x) => /no cita/.test(x)));
});
t('mb.prompt y leer', () => {
  const p = mb.prompt({ ...ctx, imagenes: imgs() }); assert(p.length < 5000); assert(p.includes(F + 'direcciones')); assert(p.includes(F + 'criterios')); assert(p.includes('[0] Color')); assert(!p.includes('http://'));
  const r = mb.leer(`${F}direcciones\n{"direcciones":[{"nombre":"A","idea":"i","refs":[0]}]}\n${F}\n${F}criterios\n{"cumple":["x"],"falta":[]}\n${F}`); assert.equal(r.contenido.direcciones.length, 1); assert.equal(mb.leer('x'), null);
  assert(mb.prompt({ ...ctx, imagenes: [] }).includes('SIN DATOS'));
});
t('mb.aMd cita urls reales', () => { const md = mb.aMd({ direcciones: [{ nombre: 'A', refs: [0, 7] }] }, { imagenes: imgs() }); assert(md.includes('https://x.com/a.jpg')); assert(!md.includes('undefined')); });

console.log(`\n${ok} pruebas bien`);
