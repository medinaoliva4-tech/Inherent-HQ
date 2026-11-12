// Pruebas de Production (public/js/produccion.js y production/brief.js): las 16 columnas del CSV, el techo de realidad, las faltas del
// brief, leer(), limpiar(), prompt(), tareasDe() y la lectura de la shot list de ④.
// node scripts/test-produccion.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as P from '../public/js/produccion.js';
import * as B from '../public/js/production/brief.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const F = '```';
const pieza = (i, material = 'video', producible = 'si') => ({ id_creativo: `C-${i}`, formato: 'Reel', fecha: '2026-11-05', material, producible, nota: '' });
const FICHA = { incluye: [{ k: 'volumen', v: '2 horas de grabación al mes en 2 sesiones' }] };

t('COLUMNAS_CSV: las 16 de siempre, en el orden del método (el CSV ya no está en agents/: el formato es del OS)', () => {
  assert.equal(P.COLUMNAS_CSV.length, 16);
  assert.equal(P.COLUMNAS_CSV.join(','), 'id,id_creativo,campana,escena,accion,encuadre,duracion_s,locacion,talento,recursos,equipo,jornada,costo_estimado,riesgo,destino,estado');
});
t('aCsv: 16 columnas y costo_estimado vacío sin permiso', () => {
  const x = P.aCsv([{ id: 'PR-001', id_creativo: 'C-1', costo_estimado: 'Q500', accion: 'dice, con coma' }]).split('\n');
  assert.equal(x[0].split(',').length, 16); assert.ok(!x[1].includes('Q500')); assert.ok(x[1].includes('"dice, con coma"'));
  assert.ok(P.aCsv([{ id: 'PR-001', costo_estimado: 'Q500' }], { costos: true }).includes('Q500'));
});
t('techo: horas y sesiones salen de la ficha; sin dato, null; manda la menor', () => {
  assert.deepEqual([P.techo(FICHA).horas, P.techo(FICHA).sesiones], [2, 2]);
  const v = P.techo(null); assert.equal(v.horas, null); assert.equal(v.sesiones, null);
  assert.equal(P.techo(FICHA, { horas: 1.5 }).horas, 1.5); assert.equal(P.techo('4 horas', { horas: 9 }).horas, 4);
});
t('carga: videos × 20 min; foto y «no» no cuentan; pasarse pone pasa', () => {
  const tt = { horas: 2, sesiones: 2 };
  const ok6 = P.carga([...[1, 2, 3, 4, 5, 6].map((i) => pieza(i)), pieza(7, 'foto'), pieza(8, 'video', 'no')], tt);
  assert.equal(ok6.videos, 6); assert.equal(ok6.horas, 2); assert.equal(ok6.pasa, false); assert.equal(ok6.caben, 6);
  const pasa = P.carga([1, 2, 3, 4, 5, 6, 7].map((i) => pieza(i)), tt);
  assert.equal(pasa.pasa, true); assert.ok(pasa.sobran > 0); assert.equal(P.carga([pieza(1)], { horas: null }).pasa, false);
});
t('shotData y pieceText leen el plan de ④', () => {
  const months = [{ mes: '2026-11', files: [{ name: 'plan-de-contenido.csv', content: 'id,fecha,formato,pilar,idea,material,estado\nC-1,2026-11-05,Reel,Mesa,Plato,Video,listo\nC-2,,Estático,Mesa,Foto,ninguno,' },
    { name: 'ideas-reel.md', content: '## C-1 · Plato\nTexto\n## C-9\notro' }] }];
  const { rows, m } = P.shotData(months);
  assert.equal(rows.length, 2); assert.equal(rows[0].material, 'video'); assert.equal(rows[0].concepto, 'Plato');
  assert.equal(P.pieceText(m, rows[0]), '## C-1 · Plato\nTexto'); assert.equal(P.pieceText(m, rows[1]), null); assert.equal(P.shotData([]).m, null);
});
t('limpiar: solo lo conocido, sin costos ni duplicados, 2 alternativas', () => {
  const c = B.limpiar({ mes: '2026-11', costo: 5, tarifa: 9, techo: { horas: '2', sesiones: 2.4, precio: 1 }, piezas: [pieza(1), pieza(1), { id_creativo: 'X', material: 'Foto', producible: 'Sí', fecha: 'mal' }, { formato: 'sin id' }], devueltas: [{ id_creativo: 'C-1', motivo: '<b>x</b>', alternativas: ['a', 'b', 'c'] }] });
  assert.equal(c.piezas.length, 2); assert.equal(c.piezas[1].material, 'foto'); assert.equal(c.piezas[1].producible, 'si'); assert.equal(c.piezas[1].fecha, '');
  assert.equal(c.techo.horas, 2); assert.equal(c.techo.sesiones, 2); assert.equal(c.costo, undefined); assert.equal(c.techo.precio, undefined);
  assert.equal(c.devueltas[0].alternativas.length, 2); assert.equal(B.limpiar(null).piezas.length, 0); assert.deepEqual(B.limpiar(B.vacio()), B.vacio());
});
t('faltas: vacío, sin techo, capacidad pasada, sin decidir y devoluciones', () => {
  assert.ok(B.faltas(B.vacio()).length >= 3);
  const base = () => ({ mes: '2026-11', techo: { horas: 2, sesiones: 2 }, piezas: [1, 2, 3].map((i) => pieza(i)), devueltas: [] });
  assert.deepEqual(B.faltas(base()), []);
  const pasada = base(); pasada.piezas = [1, 2, 3, 4, 5, 6, 7].map((i) => pieza(i));
  assert.ok(B.faltas(pasada).some((x) => /capacidad está pasada/.test(x)));
  const sin = base(); sin.techo = { horas: null, sesiones: null }; assert.ok(B.faltas(sin).some((x) => /SIN DATOS/.test(x)));
  assert.ok(B.faltas(sin, { ficha: FICHA }).every((x) => !/SIN DATOS/.test(x)));
  const dec = base(); dec.piezas[0].producible = ''; assert.ok(B.faltas(dec).some((x) => /sin decidir/.test(x)));
  const no = base(); no.piezas[0].producible = 'no'; assert.ok(B.faltas(no).some((x) => /Sin devolver/.test(x)));
  no.devueltas = [{ id_creativo: 'C-1', motivo: '', alternativas: ['a', ''] }];
  const f = B.faltas(no); assert.ok(f.some((x) => /motivo/.test(x)) && f.some((x) => /2 alternativas/.test(x)));
  no.devueltas = [{ id_creativo: 'C-1', motivo: 'Sin locación', alternativas: ['a', 'b'] }]; assert.deepEqual(B.faltas(no), []);
});
t('tareasDe: una por devolución, clave estable, para Creatividad', () => {
  const x = B.tareasDe({ mes: '2026-11', devueltas: [{ id_creativo: 'C 1', motivo: 'No hay locación', alternativas: ['a', 'b'] }, { id_creativo: 'C-2', motivo: '', alternativas: ['', ''] }] });
  assert.equal(x.length, 1); assert.equal(x[0].dept, 'Creatividad'); assert.equal(x[0].fila, 'dev-c-1'); assert.ok(x[0].por_que.includes('Alternativa 2'));
});
t('leer: bloque produccion + criterios; roto o ausente → null', () => {
  const j = { mes: '2026-11', techo: { horas: 2, sesiones: 2 }, piezas: [pieza(1)], devueltas: [] };
  const r = B.leer(`Resumen\n${F}produccion\n${JSON.stringify(j)}\n${F}\n${F}criterios\n{"entregable":"Production Brief","cumple":["a"],"falta":["b"]}\n${F}`);
  assert.equal(r.contenido.piezas.length, 1); assert.deepEqual(r.criterios.cumple, ['a']);
  assert.equal(B.leer(`${F}produccion\n{roto\n${F}`), null); assert.equal(B.leer('nada'), null);
});
t('prompt: < 5000, pide sus dos bloques, sin economía ni tarifas', () => {
  const ctx = { hoy: '2026-10-27', mes: '2026-11', cliente: { slug: 'akai', nombre: 'AKAI' }, ficha: { incluye: FICHA.incluye, fuera: 'x'.repeat(900) }, piezas: Array.from({ length: 40 }, (_, i) => pieza(i)), aprendizajes: ['y'.repeat(400)] };
  const p = B.prompt(ctx);
  assert.ok(p.length < 5000, String(p.length)); assert.ok(p.includes('```produccion') && p.includes('```criterios')); assert.ok(p.includes('Nunca leas ni cites inherent/06-ECONOMIA.md'));
  assert.ok(B.prompt({}).length < 5000);
});
t('aMd y resumenTexto: SIN DATOS y sin costos', () => {
  const md = B.aMd({ mes: '2026-11', piezas: [pieza(1)] }); assert.ok(md.includes('SIN DATOS') && md.includes('C-1') && !/Q\d|costo|tarifa/i.test(md));
  assert.ok(B.resumenTexto(B.vacio()).includes('SIN DATOS'));
});
console.log(`\n${ok} pruebas bien`);
