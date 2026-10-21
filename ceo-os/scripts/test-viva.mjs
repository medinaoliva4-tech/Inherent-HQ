// Pruebas de la Estrategia en vivo: lo que manda Strategy se limpia, se junta y la cascada se calcula bien.
// npm run test:viva
import assert from 'node:assert/strict';
import { limpiarParche, aplicar, cascada, avance, leerBloques, sinBloques } from '../public/js/estrategia-viva.js';

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
console.log(`\n${ok} pruebas pasaron`);
