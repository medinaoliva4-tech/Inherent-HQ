// Pruebas del Plan del mes (③ Marketing): lo que manda Claude se limpia, se junta, se revisa y pasa al calendario sin duplicar.
// npm run test:plan
import assert from 'node:assert/strict';
import { limpiarPlan, aplicarPlan, revisarSlots, sumaPilares, avancePlan, leerPlan, promptPlan, slotsAPiezas, diaDeSemana, idPlan } from '../public/js/plan-mes.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('Solo entran campos conocidos y el vocabulario del método', () => {
  const p = limpiarPlan({ campana: { nombre: 'El delivery', tipo: 'Campaña', hack: 1 }, slots: [{ canal: 'Instagram', semana: 9, funcion: 'hero', temperatura: 'frio', consciencia: 'inconsciente', balance: 'marca', objetivo: 'Que sepan' }], raro: 1 });
  assert.equal(p.campana.tipo, 'campaña'); assert.equal(p.raro, undefined); assert.equal(p.campana.hack, undefined);
  assert.deepEqual([p.slots[0].semana, p.slots[0].funcion, p.slots[0].temperatura, p.slots[0].consciencia, p.slots[0].balance, p.slots[0].id], [5, 'Hero', 'Frío', 'Inconsciente', 'Marca', 'MK-001']);
});
t('El parche se junta por sección y dice qué cambió', () => {
  const { plan, cambiadas } = aplicarPlan({ mensaje: [{ titulo: 'Ya' }] }, { pilares: [{ nombre: 'Prueba', peso: 60 }, { nombre: 'Antojo', peso: 40 }] }, '2026-10-21T00:00:00Z');
  assert.deepEqual(cambiadas, ['pilares']); assert.equal(plan.mensaje[0].titulo, 'Ya'); assert.equal(sumaPilares(plan.pilares), 100); assert.equal(plan.actualizado.pilares, '2026-10-21T00:00:00Z');
  assert.equal(avancePlan(plan), 2);
});
t('Las combinaciones prohibidas se marcan', () => {
  const a = revisarSlots([{ id: 'MK-001', funcion: 'Community', temperatura: 'Frío', traza: 'A' }, { id: 'MK-002', funcion: 'Conversion', consciencia: 'Inconsciente', balance: 'Marca' }, { id: 'MK-003', funcion: 'Hero', canal: 'TikTok', traza: 'B' }], [{ canal: 'TikTok', funcion: 'Series' }]);
  assert.equal(a.length, 3);
  assert.ok(a[0].avisos[0].includes('Community')); assert.equal(a[1].avisos.length, 3); assert.ok(a[2].avisos[0].includes('TikTok'));
});
t('El bloque final se lee y se quita del texto', () => {
  const r = leerPlan('Listo.\n```plan\n{"campana":{"nombre":"X","idea":"Y"},"pregunta":{"texto":"¿Pauta?","opciones":["Sí","No"]}}\n```');
  assert.equal(r.texto, 'Listo.'); assert.equal(r.parche.campana.nombre, 'X'); assert.deepEqual(r.pregunta.opciones, ['Sí', 'No']);
  assert.deepEqual(leerPlan('```plan\n{roto\n```').parche, {});
});
t('La primera vez el pedido lleva el método de Marketing y la estrategia', () => {
  const p = promptPlan({ marca: 'Ejemplo', slug: 'ejemplo', mes: '2026-10', estrategia: '{"meta":1}', pedido: 'Arma el plan', primera: true });
  for (const x of ['③ Marketing', 'agents/03-marketing/brain/WORKFLOW.md', 'plan-contratado.md', 'LA ESTRATEGIA EN EL OS', '```plan', 'octubre 2026', 'Pedido: Arma el plan']) assert.ok(p.includes(x), x);
  assert.ok(!promptPlan({ marca: 'E', slug: 'e', mes: '2026-10', pedido: 'Sigue', primera: false }).includes('WORKFLOW.md'));
});
t('Cada slot es una pieza del calendario, con id fijo y su semana', () => {
  assert.equal(diaDeSemana('2026-10', 1), '2026-10-01'); assert.equal(diaDeSemana('2026-10', 3), '2026-10-15'); assert.equal(diaDeSemana('2026-02', 5), '2026-02-28');
  const ps = slotsAPiezas({ campana: { nombre: 'El delivery' }, slots: [{ id: 'MK-001', semana: 2, canal: 'Instagram', formato: 'carrusel', objetivo: 'Responder «llega frío»' }] }, 'ejemplo', '2026-10');
  assert.equal(ps[0].id, 'post-ejemplo-2026-10-mk-001'); assert.equal(ps[0].data.format, 'Carrusel'); assert.equal(ps[0].data.date, '2026-10-08');
  assert.equal(ps[0].data.slot.plan, idPlan('ejemplo', '2026-10')); assert.equal(ps[0].data.campana, 'El delivery');
});
console.log(`\n${ok} pruebas pasaron`);
