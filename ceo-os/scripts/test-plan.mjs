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
t('La línea del trabajo apunta a herramientas que existen; Marketing planea y Diseño crea', () => {
  const keys = MODULES.map(([k]) => k);
  for (const [k, [de, , a]] of Object.entries(FLUJO)) { assert.ok(keys.includes(k), k); if (de) assert.ok(keys.includes(de), de); if (a) assert.ok(keys.includes(a), a); }
  assert.deepEqual(AREAS.find(([k]) => k === 'planear')[3], ['plan', 'campanas']);
  assert.deepEqual(AREAS.find(([k]) => k === 'crear')[3], ['brief', 'formatos', 'ideas', 'creacion']);
  // cada grupo dice su área y cada módulo está en un solo grupo
  assert.ok(AREAS.every((g) => ['marketing', 'diseno', 'ambas'].includes(g[5])), 'cada grupo tiene área');
  const todos = AREAS.flatMap((g) => g[3]); assert.equal(new Set(todos).size, todos.length);
  assert.deepEqual([...new Set(todos)].sort(), [...keys].sort(), 'todos los módulos tienen grupo');
});

// Campañas y eventos (mk-campana): la anticipación, lo que falta y una por ciclo.
const C = await import('../public/js/campanas.js');
t('Campañas: la anticipación de mk-campana, lo que falta y una por ciclo', () => {
  const ev = C.limpiarCampana({ nombre: '  Cata de vinos ', tipo: 'Evento con cupo', ancla: '2026-11-28', frase: 'Que vengan a probar', mbt: 'B', se_nota: '+40 reservas', no_es: 'No es una fiesta', evento: { objetivo: 'Vender la membresía', medicion: 'Membresías vendidas', cupo: '60' }, raro: 1 });
  assert.equal(ev.nombre, 'Cata de vinos'); assert.equal(ev.tipo, 'evento'); assert.equal(ev.evento.cupo, 60); assert.equal(ev.raro, undefined);
  assert.deepEqual(C.anticipacion(ev).map((x) => [x.fecha, x.que]), [['2026-11-07', 'Primer aviso'], ['2026-11-21', 'Recordatorio'], ['2026-11-26', 'Último empujón'], ['2026-11-28', 'El día']]);
  assert.deepEqual(C.revisarCampana(ev, '2026-10-26'), [], 'completa: no le falta nada');
  // promoción: el último día va sobre «hasta»
  const pr = C.limpiarCampana({ nombre: 'Black Friday', tipo: 'promocion', ancla: '2026-11-27', hasta: '2026-11-30' });
  assert.equal(C.anticipacion(pr).at(-1).fecha, '2026-11-30'); assert.equal(C.anticipacion(pr).at(-1).que, 'Último día');
  // lo que falta y las reglas
  const f = C.revisarCampana(C.limpiarCampana({ nombre: 'X', tipo: 'apertura', ancla: '2026-12-03' }), '2026-10-26');
  assert.ok(f.some((x) => /frase/.test(x)) && f.some((x) => /MUST BE TRUE/.test(x)) && f.some((x) => /qué NO es/.test(x)));
  assert.ok(f.some((x) => /ciclo anterior/.test(x)), 'una apertura el 3 se avisa desde el ciclo anterior');
  assert.ok(C.revisarCampana(C.limpiarCampana({ nombre: 'Y', tipo: 'promocion', ancla: '2026-12-04' }), '2026-12-01').some((x) => /llegó tarde/.test(x)), 'promo en los primeros 7 días y el ciclo ya empezó: llegó tarde');
  assert.ok(C.revisarCampana(C.limpiarCampana({ nombre: 'Z' })).some((x) => /pilar/.test(x)), 'sin fecha es un pilar');
  // una por ciclo, dos como máximo
  const xs = ['a', 'b', 'c'].map((n) => C.limpiarCampana({ nombre: n, tipo: 'campana', ancla: '2026-12-10', estado: 'En curso' }));
  assert.match(C.revisarMes(xs, '2026-12'), /3 campañas/); assert.equal(C.revisarMes(xs.slice(0, 2), '2026-12'), '');
  assert.equal(C.campanasDelMes([ev], '2026-11').length, 1); assert.equal(C.campanasDelMes([ev], '2026-10').length, 0);
  assert.equal(C.idCampana('nao', 'Apertura Cayalá!'), 'nao--apertura-cayala');
  assert.equal(C.leerCampana({ tipo: 'evento' }), null, 'sin nombre no hay campaña');
});

// El calendario de la marca: los 3 filtros.
const CV = await import('../public/js/calendario-vistas.js');
t('Calendario: Operativo, Planificación y Programado salen de lo que ya existe', () => {
  const ev = CV.eventosMarca({ slug: 'x', from: '2026-10-01', to: '2026-10-31', hoy: '2026-10-22',
    posts: [{ id: 'a', kind: 'post', date: '2026-10-05', status: 'Idea' }, { id: 'b', kind: 'post', date: '2026-10-23', status: 'Listo', time: '18:30', red: 'TikTok' }, { id: 'c', kind: 'post', date: '2026-10-24', status: 'Listo' }, { id: 'd', kind: 'post', date: '2026-11-02', status: 'Idea' }],
    shoots: [{ id: 's', profile: 'x', date: '2026-10-07' }, { id: 's2', profile: 'otra', date: '2026-10-07' }],
    projects: [{ id: 'p1', client_slug: 'x', name: 'Ciclo', meetings: [{ name: 'Día 1', date: '2026-10-01' }] }, { id: 'p2', client_slug: 'otra' }],
    tasks: [{ id: 't1', project_id: 'p1', due: '2026-10-10', title: 'Grabar' }, { id: 't2', project_id: 'p2', due: '2026-10-10' }, { id: 't3', project_id: 'p1', due: '2026-10-10', status: 'Hecha' }] });
  const de = (k) => ev.filter((e) => e.tipo === k);
  assert.equal(de('operativo').filter((e) => !e.ciclo).length, 3); assert.equal(de('operativo').filter((e) => e.ciclo).length, 3);
  assert.equal(de('planificacion').length, 1); assert.ok(de('planificacion')[0].late);
  assert.equal(de('programado').length, 2); assert.ok(de('programado').find((e) => e.k === 'p-c').falta); assert.ok(!de('programado').find((e) => e.k === 'p-b').falta);
  assert.equal(CV.redDe({ format: 'TikTok' }), '');
});
console.log(`\n${ok} pruebas pasaron`);
