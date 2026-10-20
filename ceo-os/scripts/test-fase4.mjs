// Fase 4 · Marcas: entender. Las reglas puras (sin base ni red): Cliente ideal, candado del brief, etapa del funnel,
// la mezcla del mes con avatares y los errores de Apify. Uso: node scripts/test-fase4.mjs
import assert from 'node:assert/strict';
import { limpiarCampos, limpiarAngulos, reglaX, mercado, sumaPesos, vivos, leerPropuesta, avance, resumenAvatar } from '../public/js/avatares.js';
import { candado, mesesConBrief, etapaFunnel, mezclaDelMes, filtrar } from '../public/js/calendario-contenido.js';
import { apifyError } from '../api/_lib/content.js';

let n = 0; const ok = (nombre, fn) => { fn(); n++; console.log('✅', nombre); };

ok('Cliente ideal · los campos se limpian por tipo', () => {
  const c = limpiarCampos({ precio: 'Q45,000', ingreso: '', dolor: 7, nivel: 2, dolores: 'a\n\n b \n', zona: 'Zona 10', inventado: 'x' });
  assert.equal(c.precio, 45000); assert.equal(c.ingreso, null); assert.equal(c.dolor, null); assert.equal(c.nivel, 2);
  assert.deepEqual(c.dolores, ['a', 'b']); assert.equal(c.zona, 'Zona 10'); assert.ok(!('inventado' in c));
});
ok('Cliente ideal · regla 10× del CEO', () => {
  assert.deepEqual(reglaX({ precio: 1000, ingreso: 12000 }), { x: 12, ok: true, sugerido: 10000 });
  assert.equal(reglaX({ precio: 1000, ingreso: 5000 }).ok, false);
  assert.equal(reglaX({ precio: 1000 }), null);
});
ok('Cliente ideal · mercado, pesos y avance', () => {
  assert.deepEqual(mercado({ dolor: 4, poder: 5 }), { suma: 9, de: 10, completo: false });
  const l = [{ nombre: 'B', peso: 30 }, { nombre: 'A', peso: 70 }, { nombre: 'X', peso: 50, archivado: true }];
  assert.equal(sumaPesos(l), 100); assert.equal(vivos(l)[0].nombre, 'A');
  assert.equal(avance({ campos: {} }), 0); assert.ok(avance({ campos: { zona: 'x', dolores: ['y'] } }) > 0);
});
ok('Cliente ideal · se lee el bloque JSON de Claude', () => {
  const p = leerPropuesta('Resumen.\n```json\n{"campos":{"edad":"30 a 40","dolor":4,"x":1},"angulos":[{"tipo":"Raro","texto":"hola"},{"tipo":"Deseo","texto":""}]}\n```');
  assert.deepEqual(p.campos, { edad: '30 a 40', dolor: 4 }); assert.deepEqual(p.angulos, [{ tipo: 'Dolor', texto: 'hola' }]);
  assert.equal(leerPropuesta('sin bloque'), null);
  assert.deepEqual(limpiarAngulos([{ tipo: 'Prueba', texto: ' caso ' }]), [{ tipo: 'Prueba', texto: 'caso' }]);
  assert.match(resumenAvatar({ nombre: 'A', peso: 60, campos: { edad: '30', dolores: ['d'] } }), /A \(60%\).*30 años.*le duele: d/);
});
ok('Candado del brief', () => {
  const meses = mesesConBrief([{ mes: '2026-10', files: [{ name: 'brief-del-ciclo.md' }] }, { mes: '2026-11', files: [{ name: 'otro.md' }] }]);
  assert.deepEqual(meses, ['2026-10']);
  assert.equal(candado('2026-10', meses).cerrado, false);
  assert.equal(candado('2026-11', meses).cerrado, true);
  assert.equal(candado('2026-11', meses, [{ mes: '2026-11', por: 'ceo@x' }]).por, 'ceo');
  assert.equal(candado('', meses).cerrado, false); // sin fecha (idea): nunca se bloquea
});
ok('Etapa del funnel sale de la consciencia', () => {
  assert.equal(etapaFunnel({ consciencia: 1 }), 'TOF'); assert.equal(etapaFunnel({ consciencia: 'Consciente del problema' }), 'TOF');
  assert.equal(etapaFunnel({ consciencia: 3 }), 'MOF'); assert.equal(etapaFunnel({ consciencia: 5 }), 'BOF'); assert.equal(etapaFunnel({}), '');
});
ok('Mezcla del mes · etapa y avatar contra su peso', () => {
  const av = [{ id: 'a1', nombre: 'Gerente', peso: 70 }, { id: 'a2', nombre: 'Dueño', peso: 30 }];
  const posts = [{ date: '2026-10-02', consciencia: 1, avatar: 'a1' }, { date: '2026-10-05', consciencia: 5, avatar: 'a1' }, { date: '2026-10-07', consciencia: 3, avatar: 'a2' }, { date: '2026-09-01', avatar: 'a2' }];
  const m = mezclaDelMes(posts, '2026-10', [], av);
  assert.equal(m.total, 3);
  assert.deepEqual(m.avatar.map((r) => [r.k, r.pct, r.meta]), [['Gerente', 67, 70], ['Dueño', 33, 30]]);
  assert.deepEqual(m.etapa.map((r) => r.k), ['TOF', 'MOF', 'BOF']);
  assert.equal(filtrar(posts, { avatar: 'Gerente', avatares: av }).length, 2);
  assert.equal(filtrar(posts, { etapa: 'BOF' }).length, 1);
});
ok('Apify · el tope de la cuenta no es «sin crédito»', () => {
  assert.equal(apifyError(403, 'Monthly usage hard limit exceeded').code, 'APIFY_TOPE_CUENTA');
  assert.equal(apifyError(402, 'Not enough credit').code, 'APIFY_CREDIT');
  assert.equal(apifyError(401, '').code, 'APIFY_TOKEN');
});
console.log(`\n${n} pruebas de la Fase 4 pasaron.`);
