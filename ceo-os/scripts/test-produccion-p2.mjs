// Pruebas de Production P2 (Production Planner y Content Repurposing Engine): el candado del día 11, el historial que solo se agrega, los
// montos, el orden de tiro, el medidor, la matriz, la razón 1:2, el límite de caption y «una derivada no agrega assets nuevos».
// node scripts/test-produccion-p2.mjs
import assert from 'node:assert/strict';
import * as P from '../public/js/production/planner.js';
import * as R from '../public/js/production/repurposing.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('día 11: después del 11 da regla salvo CEO; fecha sin cambio, archivar y cancelar pasan', () => {
  const b = { kind: 'shoot', date: '2026-11-15', status: 'Por grabar' };
  assert.ok(P.reglaDia11(b, null, 'coo')); assert.equal(P.reglaDia11(b, null, 'ceo'), '');
  assert.equal(P.reglaDia11({ ...b, date: '2026-11-11' }, null, 'coo'), '');
  assert.equal(P.reglaDia11(b, { date: '2026-11-15' }, 'coo'), '');
  assert.equal(P.reglaDia11({ ...b, archivado: true }, null, 'coo'), ''); assert.equal(P.reglaDia11({ ...b, status: 'Cancelado' }, null, 'coo'), '');
  assert.equal(P.reglaDia11({ kind: 'post', date: '2026-11-15' }, null, 'coo'), '');
});
t('historial: solo se agrega', () => {
  const cur = { cumplimiento: { historial: [{ a: 1 }, { a: 2 }] } };
  assert.equal(P.reglaHistorial({ cumplimiento: { historial: [{ a: 1 }, { a: 2 }, { a: 3 }] } }, cur), '');
  assert.ok(P.reglaHistorial({ cumplimiento: { historial: [{ a: 1 }] } }, cur)); assert.ok(P.reglaHistorial({ cumplimiento: { historial: [{ a: 9 }, { a: 2 }] } }, cur)); assert.ok(P.reglaHistorial({}, cur));
  assert.equal(P.reglaHistorial({}, {}), '');
});
t('tira: 20 días, línea del 11, los shoots de hoy sin migrar; archivados y cancelados fuera', () => {
  const s = [{ id: 'a', kind: 'shoot', date: '2026-11-05', title: 'A' }, { id: 'b', kind: 'shoot', date: '2026-11-14', title: 'B' }, { id: 'c', kind: 'shoot', date: '2026-11-06', archivado: true }, { id: 'd', kind: 'shoot', date: '2026-11-07', status: 'Cancelado' }];
  const x = P.tira(s, '2026-11'); assert.equal(x.dias.length, 20); assert.equal(x.dias[10].limite, true);
  assert.equal(x.dias[4].jornadas.length, 1); assert.equal(x.despues11.length, 1); assert.equal(x.dias[5].jornadas.length, 0);
  const j = P.limpiarJornada(s[0]); assert.deepEqual(j.produccion.crew, []); assert.equal(j.horas_estimadas, null);
});
t('archivar no borra y se puede deshacer', () => {
  const a = P.archivar({ status: 'Por grabar' }); assert.deepEqual(a, { archivado: true, status_previo: 'Por grabar', status: 'Cancelado' });
  assert.equal(P.desarchivar(a).status, 'Por grabar');
});
t('orden de tiro: montaje, luz, traslado; sin minutos queda en faltan', () => {
  const j = { time: '08:00', margenes: { montaje: 30, luz: 10, traslado: 20 }, escenas: [{ id: 'PR-001', min: 30, lugar: 'A' }, { id: 'PR-002', min: 20, lugar: 'B' }, { id: 'PR-003', lugar: 'B' }] };
  const o = P.ordenDeTiro(j); assert.equal(o.filas[0].inicio, '08:30'); assert.equal(o.filas[1].inicio, '09:30'); assert.deepEqual(o.faltan, ['PR-003']);
  assert.equal(P.ordenDeTiro({ escenas: [{ id: 'x', min: 5 }] }).sinCall, true);
  assert.deepEqual(P.mover(['a', 'b', 'c'], 'c', -1), ['a', 'c', 'b']);
});
t('medidor: contra la ficha; sin dato, null', () => {
  const f = { incluye: [{ k: 'volumen', v: '4 horas de grabación al mes en 2 sesiones' }] };
  const js = [{ kind: 'shoot', date: '2026-11-05', horas_estimadas: 3 }, { kind: 'shoot', date: '2026-11-06', horas_estimadas: 2 }, { kind: 'shoot', date: '2026-11-07' }];
  const m = P.medidor(js, f, '2026-11'); assert.equal(m.estimadas, 5); assert.equal(m.pasaHoras, true); assert.equal(m.pasaSesiones, true); assert.equal(m.sinEstimar, 1);
  const v = P.medidor([{ kind: 'shoot', date: '2026-11-05' }], null, '2026-11'); assert.equal(v.estimadas, null); assert.equal(v.sinTecho, true); assert.equal(v.pct, null);
});
t('montos: solo CEO y COO; quien no los ve no los pisa', () => {
  assert.ok(P.veMontos('ceo') && P.veMontos('coo') && !P.veMontos('team'));
  const d = { produccion: { recursos: [{ nombre: 'Luces', monto: 500 }] } };
  assert.equal(P.sinMontos(d).produccion.recursos[0].monto, undefined);
  const c = P.conMontos(d, { produccion: { recursos: [{ nombre: 'Luces' }, { nombre: 'Nuevo', monto: 9 }] } }); assert.equal(c.produccion.recursos[0].monto, 500); assert.equal(c.produccion.recursos[1].monto, null);
  assert.ok(!JSON.stringify(P.callSheet({ title: 'x', produccion: { recursos: [{ nombre: 'Luces', monto: 500 }] } })).includes('500'));
});
t('planner: faltas y call sheet', () => {
  const f = P.faltas({ jornadas: [{ title: 'J1', date: '2026-11-15' }] }); assert.ok(f.some((x) => /después del día 11/.test(x))); assert.ok(f.some((x) => /call time/.test(x)));
  assert.ok(P.callSheetMd({ title: 'J1' }).includes('⚠️ SIN DATOS'));
});
t('repurposing: limpiar, salidas válidas y una celda por maestro y salida', () => {
  const c = R.limpiar({ celdas: [{ maestro: 'm1', salida: '9:16' }, { maestro: 'm1', salida: '9:16' }, { maestro: 'm1', salida: '2:3' }, { maestro: '', salida: '1:1' }, { maestro: 'm1', salida: 'hook', hooks: [{ texto: 'x' }, { texto: '' }] }] });
  assert.equal(c.celdas.length, 2); assert.equal(c.celdas[1].hooks.length, 1);
});
t('razón 1:2: sin maestros null; con maestros mide', () => {
  assert.equal(R.razon(R.vacio()).razon, null);
  const c = { celdas: [{ maestro: 'm1', salida: '9:16', estado: 'hecha' }, { maestro: 'm1', salida: '1:1', estado: 'pendiente' }, { maestro: 'm2', salida: '9:16', estado: 'hecha' }] };
  const r = R.razon(c); assert.deepEqual([r.maestros, r.derivadas, r.razon, r.ok, r.faltan], [2, 2, 1, false, 2]);
  assert.equal(R.razon({ celdas: [{ maestro: 'm1', salida: '9:16', estado: 'hecha' }, { maestro: 'm1', salida: '1:1', estado: 'hecha' }] }).ok, true);
});
t('maestros aprobados: solo aprobados, sin derivadas ni archivados', () => {
  const f = [{ id: 'a', revision: 'Aprobado' }, { id: 'b', revision: 'Pendiente' }, { id: 'c', revision: 'Aprobado', derivada_de: 'a' }, { id: 'd', revision: 'Aprobado', archivado: true }, { id: 'kit', kind: 'kit' }];
  assert.deepEqual(R.maestrosAprobados(f).map((x) => x.id), ['a']);
});
t('caption: pasar el límite se marca y bloquea el hook', () => {
  assert.equal(R.pasaLimite('x'.repeat(126), 'hook'), true); assert.equal(R.pasaLimite('x'.repeat(125), 'hook'), false);
  const c = { celdas: [{ maestro: 'm1', salida: 'hook', hooks: [{ texto: 'ok', caption: 'corto' }, { texto: 'largo', caption: 'x'.repeat(200) }] }] };
  const v = R.variantesDeHook(c, [{ id: 'm1', titulo: 'Reel' }]); assert.equal(v.listas.length, 1); assert.equal(v.bloqueadas.length, 1); assert.equal(v.listas[0].variante.madre.titulo, 'Reel');
  assert.ok(R.faltas({ celdas: [{ maestro: 'm1', salida: '9:16', caption: 'x'.repeat(2300) }] }).some((x) => /límite/.test(x)));
  assert.equal(R.variantesDeHook({ celdas: [{ maestro: 'm1', salida: 'hook', hooks: [{ texto: 'a', enviado: true }] }] }).listas.length, 0);
});
t('faltas: maestro no aprobado, corte fuera de 7-15 s, hecha sin ficha', () => {
  const c = { celdas: [{ maestro: 'm9', salida: 'corte', estado: 'hecha', duracion_s: 30 }] };
  const f = R.faltas(c, { maestros: ['m1'] }); assert.ok(f.some((x) => /no es un maestro aprobado/.test(x))); assert.ok(f.some((x) => /entre 7 y 15/.test(x))); assert.ok(f.some((x) => /derivada/.test(x)));
  assert.equal(R.corteOk(7) && R.corteOk(15) && !R.corteOk(16) && !R.corteOk(null), true);
});
t('derivada: copia los assets del maestro y no agrega nuevos', () => {
  const m = { id: 'm1', titulo: 'Reel', formato: '9:16', assets: [{ nombre: 'a', url: 'https://x.com/a' }] };
  const body = R.fichaDerivada(m, { salida: '1:1' }, { profile: 'akai' });
  assert.equal(body.derivada_de, 'm1'); assert.equal(body.formato, '1:1'); assert.equal(R.assetsNuevos(body.assets, m.assets).length, 0);
  assert.equal(R.assetsNuevos([...body.assets, { nombre: 'b', url: 'https://x.com/b' }], m.assets).length, 1);
  assert.equal(R.assetsNuevos([{ nombre: 'Solo' }], [{ nombre: 'solo' }]).length, 0);
});
t('contrato de IA: prompt corto, sin economía; leer ida y vuelta; aMd', () => {
  const p = R.prompt({ cliente: { nombre: 'X' }, maestros: [{ id: 'm1', titulo: 'Reel' }] }); assert.ok(p.length < 5000 && p.includes('criterios') && !/06-ECONOMIA/.test(p.replace(/nunca leas ni cites inherent\/06-ECONOMIA/i, '')));
  const l = R.leer('Listo.\n```repurposing\n{"celdas":[{"maestro":"m1","salida":"9:16"}]}\n```\n```criterios\n{"entregable":"x","cumple":["a"],"falta":[]}\n```');
  assert.equal(l.contenido.celdas.length, 1); assert.equal(R.leer('sin bloque'), null);
  assert.ok(R.aMd(R.vacio()).includes('SIN DATOS'));
});
console.log(`\n${ok} pruebas ok`);
