// Pruebas de la Estrategia en vivo: lo que manda Strategy se limpia, se junta y la cascada se calcula bien.
// npm run test:viva
import assert from 'node:assert/strict';
import { limpiarParche, aplicar, cascada, avance, leerBloques, sinBloques } from '../public/js/estrategia-viva.js';
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
