// Pruebas del Shot List Builder (public/js/production/shotlist.js): limpiar, faltas, CSV de ida y vuelta (16 columnas), costos, prompt y leer.
// node scripts/test-shotlist.mjs
import assert from 'node:assert/strict';
import * as S from '../public/js/production/shotlist.js';
import { COLUMNAS_CSV } from '../public/js/produccion.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const F = '```';
const muestra = () => ({ escenas: [
  { id: 'PR-001', id_creativo: 'C-01', pieza: 'Reel, "el sol"', accion: 'Sale el platillo,\ncon humo', plano: 'detalle', duracion_s: 3.5, lugar: 'Cocina', talento: 'Chef', setup: 'Luz lateral', producto: 'Panza Verde', material: 'video', jornada: 'J1', riesgo: 'luz', estado: 'grabada', costo_estimado: 250, escena: '1' },
  { id: 'PR-002', id_creativo: 'C-02', pieza: 'Foto', accion: 'Mesa completa', plano: 'general', duracion_s: null, lugar: 'Terraza', talento: '', setup: '', producto: '', material: 'foto', jornada: '', riesgo: '', estado: 'pendiente', costo_estimado: null, escena: '' },
] });

t('la plantilla tiene las 16 columnas', () => {
  assert.equal(COLUMNAS_CSV.length, 16);
  assert.deepEqual(Object.values(S.COLUMNA_DE).sort(), [...COLUMNAS_CSV].sort());
  assert.equal(S.aCsv(muestra()).split('\n')[0], COLUMNAS_CSV.join(','));
});
t('CSV ida y vuelta sin pérdida (con costos)', () => {
  const c = S.limpiar(muestra()), vuelta = S.deCsv(S.aCsv(c, { costos: true }));
  assert.deepEqual(vuelta, c);
});
t('sin costos el CSV sale vacío en costo_estimado', () => {
  const csv = S.aCsv(muestra(), { costos: false });
  assert.ok(!csv.includes('250'));
  assert.equal(S.deCsv(csv).escenas[0].costo_estimado, null);
  assert.equal(S.deCsv(csv).escenas[0].accion, S.limpiar(muestra()).escenas[0].accion);
});
t('importar un CSV ajeno devuelve null', () => { assert.equal(S.deCsv('a,b\n1,2'), null); assert.equal(S.deCsv(''), null); });
t('mezclar reemplaza por id, agrega y no borra', () => {
  const m = S.mezclar(muestra(), { escenas: [{ id: 'PR-002', id_creativo: 'C-09' }, { id: 'PR-010', id_creativo: 'C-10' }] });
  assert.deepEqual(m.escenas.map((e) => e.id), ['PR-001', 'PR-002', 'PR-010']);
  assert.equal(m.escenas[1].id_creativo, 'C-09');
});
t('faltas: escena sin id_creativo y piezas sin escena', () => {
  const c = muestra(); c.escenas.push({ id: 'PR-003', accion: 'x' });
  const f = S.faltas(c);
  assert.equal(f.length, 1); assert.match(f[0], /PR-003.*id_creativo/);
  assert.equal(S.faltas(muestra()).length, 0);
  assert.match(S.faltas(muestra(), { ids: ['C-01', 'C-77'] })[0], /C-77/);
  assert.equal(S.faltas({}).length, 1);
});
t('limpiar: ids, tipos, tamaño y basura', () => {
  const c = S.limpiar({ escenas: [{ id: 'PR-001', id_creativo: '<b>x</b>', duracion_s: '-3', estado: 'otra', material: 'gif', costo_estimado: 'abc', extra: 1 }, { id: 'PR-001' }, { id: 'zzz' }, 5, null], v: 3 });
  assert.deepEqual(c.escenas.map((e) => e.id), ['PR-001', 'PR-002', 'PR-003']);
  assert.equal(c.escenas[0].duracion_s, null); assert.equal(c.escenas[0].estado, 'pendiente'); assert.equal(c.escenas[0].material, 'video');
  assert.equal(c.escenas[0].costo_estimado, null); assert.ok(!('extra' in c.escenas[0])); assert.ok(!('v' in c));
  assert.deepEqual(S.limpiar(null), { escenas: [] });
  assert.equal(S.limpiar({ escenas: Array.from({ length: 400 }, () => ({})) }).escenas.length, 300);
});
t('agrupar y progreso', () => {
  const c = S.limpiar(muestra());
  assert.deepEqual(S.agrupar(c.escenas, 'jornada', 'Sin').map((g) => g.titulo), ['J1', 'Sin']);
  assert.deepEqual(S.progreso(c), { total: 2, grabadas: 1 });
  assert.deepEqual(S.jornadasDe(c), ['J1']);
});
t('prompt < 5000, pide sus bloques y no toca costos', () => {
  const p = S.prompt({ cliente: { nombre: 'AKAI' }, entradas: [{ tool: 'production-brief', contenido: { piezas: [{ id_creativo: 'C-01', formato: 'reel', material: 'video', producible: 'si' }] } }] });
  assert.ok(p.length < 5000, String(p.length)); assert.ok(p.includes('```shotlist')); assert.ok(p.includes('```criterios')); assert.ok(p.includes('C-01'));
  assert.ok(!/costo_estimado|tarifa de/i.test(p.split('MÉTODO')[1].split('```shotlist')[0].replace('No pongas costos ni tarifas.', '')));
  assert.ok(S.prompt({}).length < 5000);
});
t('leer: bloque bueno, roto y ausente', () => {
  const j = JSON.stringify({ escenas: [{ id: 'PR-001', id_creativo: 'C-01', accion: 'a' }] });
  const r = S.leer(`Listo\n${F}shotlist\n${j}\n${F}\n${F}criterios\n{"cumple":["ok"],"falta":[]}\n${F}`);
  assert.equal(r.contenido.escenas[0].id_creativo, 'C-01'); assert.deepEqual(r.criterios.cumple, ['ok']);
  assert.equal(S.leer(`${F}shotlist\n{roto\n${F}`), null); assert.equal(S.leer('nada'), null);
});
t('aMd lista por jornada', () => { const md = S.aMd(muestra()); assert.match(md, /## J1/); assert.match(md, /## Sin jornada/); assert.ok(!md.includes('250')); });
t('sinCostos y conCostos: quien no ve costos ni los lee ni los pisa', () => {
  const c = S.limpiar(muestra());
  assert.ok(c.escenas.some((e) => e.costo_estimado != null));
  assert.ok(S.sinCostos(c).escenas.every((e) => e.costo_estimado === null));
  const tocado = { escenas: [...S.sinCostos(c).escenas.map((e) => ({ ...e, accion: e.accion + '!', costo_estimado: 999 })), { id: 'PR-009', id_creativo: 'C-09', costo_estimado: 5 }] };
  const g = S.conCostos(c, tocado);
  assert.deepEqual(g.escenas.slice(0, c.escenas.length).map((e) => e.costo_estimado), c.escenas.map((e) => e.costo_estimado));
  assert.equal(g.escenas[g.escenas.length - 1].costo_estimado, null);
  assert.ok(S.conCostos(null, c).escenas.every((e) => e.costo_estimado === null));
});

console.log(`\n${ok} pruebas ok`);
