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

// Las ideas del chat: mensaje + formato que ya funciona + adaptación.
const { leerIdeas, promptIdeas } = await import('../public/js/ideas-chat.js');
t('Una idea trae qué comunicamos, el formato ganador y cómo se adapta', () => {
  const r = leerIdeas('Listo.\n```ideas\n{"ideas":[{"slot":"mk-1","titulo":"T","mensaje":"Llega caliente","referente":"https://ig/reel/1","por_que":"Comparación","adaptacion":"Pediste vs llegó"}]}\n```');
  assert.equal(r.ideas[0].slot, 'MK-1'); assert.equal(r.ideas[0].mensaje, 'Llega caliente'); assert.equal(r.ideas[0].adaptacion, 'Pediste vs llegó');
  const p = promptIdeas({ marca: 'X', slug: 'x', mes: '2026-10', slots: [], investigacion: '', formatos: 'FORMATOS DE LA MARCA…', pedido: 'Ideas', primera: true });
  assert.ok(p.includes('adaptacion') && p.includes('todavía no hay posts ganadores') && p.includes('FORMATOS DE LA MARCA…'));
});
// La línea del trabajo: cada herramienta viene de y pasa a una que existe.
// brandlist.js importa el DOM: se leen sus tres listas como datos.
const src = (await import('node:fs')).readFileSync(new URL('../public/js/brandlist.js', import.meta.url), 'utf8');
const lista = (nombre) => Function(`return ${src.match(new RegExp(`export const ${nombre} = ([\\[{][\\s\\S]*?\\n[\\]}]);`))[1]}`)();
const FLUJO = lista('FLUJO'), MODULES = lista('MODULES'), AREAS = lista('AREAS');
t('La línea del trabajo apunta a herramientas que existen y Crear va en orden', () => {
  const keys = MODULES.map(([k]) => k);
  for (const [k, [de, , a]] of Object.entries(FLUJO)) { assert.ok(keys.includes(k), k); if (de) assert.ok(keys.includes(de), de); if (a) assert.ok(keys.includes(a), a); }
  assert.deepEqual(AREAS.find(([k]) => k === 'crear')[3], ['plan', 'formatos', 'ideas', 'creacion']);
});

console.log(`\n${ok} pruebas pasaron`);
