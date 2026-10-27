// Pruebas de la Estrategia en vivo: lo que manda Strategy se limpia, se junta y la cascada se calcula bien.
// npm run test:viva
import assert from 'node:assert/strict';
import { limpiarParche, aplicar, cascada, avance, leerBloques, sinBloques } from '../public/js/estrategia-viva.js';
import { limpiarItems, limpiarHitos } from '../public/js/strategy/roadmap.js';
import { fichaMd, rutaEditable } from '../public/js/ficha.js';
import { parsePlanContratado } from '../api/_lib/parse.js';
import { nivelDe } from '../public/js/estrategia.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('Solo entran campos conocidos, con tipo', () => {
  const p = limpiarParche({ meta: { objetivo: 'Q120,000', hack: 1 }, inversa: { cierre: '25%', ticket: -5 }, raro: { x: 1 } });
  assert.deepEqual(p, { meta: { objetivo: 120000 }, inversa: { cierre: 0.25 } });
});
t('El parche se junta por sección y marca qué cambió', () => {
  const { viva, cambiadas } = aplicar({ meta: { actual: 40000 } }, { meta: { objetivo: 120000 }, contexto: { conclusion: 'Etapa 3' } }, '2026-10-21T00:00:00Z');
  assert.deepEqual(viva.meta, { actual: 40000, objetivo: 120000 });
  assert.deepEqual(cambiadas, ['meta', 'contexto']);
  assert.equal(viva.actualizado.meta, '2026-10-21T00:00:00Z');
});
t('La cascada va de la meta para atrás y deja null lo que falta', () => {
  const c = cascada({ meta: { objetivo: 120000 }, inversa: { ticket: 4800, cierre: 0.25, conversion: 0.02 } });
  assert.equal(c.clientes, 25); assert.equal(c.conversaciones, 100); assert.equal(c.visitas, 5000); assert.equal(c.alcance, null);
});
t('El avance dice qué paso sigue', () => {
  assert.equal(avance({ contexto: { conclusion: 'x' } }).ahora, 'analisis');
});
t('Los bloques de Strategy se leen y no se muestran', () => {
  const r = 'Hola.\n```estrategia\n{"meta":{"objetivo":1000}}\n```\n```pregunta\n{"texto":"¿Cuánto?","opciones":["a","b"]}\n```';
  const b = leerBloques(r);
  assert.equal(b.parche.meta.objetivo, 1000); assert.equal(b.preguntas[0].texto, '¿Cuánto?');
  assert.equal(sinBloques(r), 'Hola.');
  assert.equal(sinBloques('Hola.\n```estrategia\n{"me'), 'Hola.');
});
t('roadmap.items y roadmap.hitos pasan por el módulo puro del roadmap; no entra nada de más', () => {
  const items = [{ id: 'r1', oportunidad_id: 'o1', area: 'marketing', trimestre: 'T2', titulo: 'Plan de canales', tareas: [{ title: 'Definir canales', due: '2026-11-20' }], raro: 1 }];
  const hitos = [{ id: 'h1', titulo: 'Primeras 10 ventas', fecha: '2026-12-01', meta: '10 ventas' }];
  const p = limpiarParche({ roadmap: { items, hitos, hack: 1 }, raro: { x: 1 } });
  assert.deepEqual(p.roadmap.items, limpiarItems(items)); assert.deepEqual(p.roadmap.hitos, limpiarHitos(hitos));
  assert.equal(p.roadmap.items.length, 1); assert.equal(p.roadmap.items[0].area, 'marketing'); assert.equal(p.roadmap.items[0].trimestre, 'T2');
  assert.equal(p.roadmap.items[0].raro, undefined); assert.equal(p.roadmap.hack, undefined); assert.equal(p.raro, undefined);
  assert.deepEqual(limpiarParche({ roadmap: { items: 'no es lista' } }), {});
});
t('Los hitos de siempre (4 números de meta por trimestre) y las filas viejas siguen igual', () => {
  const p = limpiarParche({ roadmap: { filas: [{ area: 'Strategy', celdas: ['a', 'b'] }], hitos: [55000, '75000', null] } });
  assert.deepEqual(p.roadmap.hitos, [55000, 75000, null, null]);
  assert.deepEqual(p.roadmap.filas, [{ area: 'Strategy', celdas: ['a', 'b', '', ''] }]);
});
t('Los items se juntan con las filas que ya había (no las pisan) y cuentan como roadmap entregado', () => {
  const cur = { roadmap: { filas: [{ area: 'Strategy', celdas: ['a', '', '', ''] }] } };
  const { viva } = aplicar(cur, limpiarParche({ roadmap: { items: [{ id: 'r1', area: 'ads', trimestre: 'T1', titulo: 'Probar pauta' }] } }), '2026-10-27T00:00:00Z');
  assert.equal(viva.roadmap.filas.length, 1); assert.equal(viva.roadmap.items.length, 1);
  assert.equal(avance({ roadmap: { items: viva.roadmap.items } }).listo.entrega, true);
  assert.equal(avance({ roadmap: { items: [] } }).listo.entrega, false);
});
t('analisis.trabado y porque (los llena el X-Ray) entran con los cuatro valores de Hormozi y no con otros', () => {
  assert.deepEqual(limpiarParche({ contexto: { conclusion: 'La capacidad frena' }, analisis: { trabado: 'capacidad', porque: 'No aguanta más demanda' } }), { contexto: { conclusion: 'La capacidad frena' }, analisis: { trabado: 'capacidad', porque: 'No aguanta más demanda' } });
  for (const v of ['precio', '', 'Oferta', 1]) assert.equal(limpiarParche({ analisis: { trabado: v } }).analisis?.trabado, undefined, String(v));
});
t('La ficha que se crea en el OS la leen los agentes, y lo vacío queda como «SIN DATOS»', () => {
  const md = fichaMd({ nombre: 'Akai', nivel: 'Brand Growth', linea: 'Growth', fuera: 'Pauta | web\nEventos' });
  const pc = parsePlanContratado(md, 'team');
  assert.equal(nivelDe(pc.plan).id, 'growth');
  assert.equal(pc.fields.find((f) => f.key === 'Queda fuera').value, 'Pauta / web · Eventos');
  assert.match(md, /\*\*Rondas de revisión\*\* \| ⚠️ SIN DATOS/);
  assert.equal(nivelDe(parsePlanContratado(fichaMd({ nombre: 'X', nivel: 'A la medida' }), 'team').plan).id, 'medida');
});
t('Desde el OS solo se editan textos dentro de la carpeta del cliente', () => {
  assert.ok(rutaEditable('00-onboarding/plan-contratado.md'));
  assert.ok(rutaEditable('03-marketing/2026-10/plan.csv'));
  for (const r of ['../akai/00-onboarding/plan-contratado.md', '/etc/passwd.md', 'a/../../b.md', 'foto.png', '', null]) assert.ok(!rutaEditable(r), String(r));
});
console.log(`\n${ok} pruebas pasaron`);
