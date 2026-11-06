// Pruebas del enrutador del orquestador (F6 · PLAN-GATEWAY §13, CONTINUAR-KIMI §7.5).
// Todo puro: sin red, sin base, sin modelo. Cubrimos el prompt del pedido y la limpieza de la respuesta.
// npm run test:orquestador
import assert from 'node:assert/strict';
import { AREAS_AGENTE, pedidoRuta, leerRuta, quiereOrquestar, areaRuta } from '../public/js/orquestador.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

const CLIENTES = ['akai', { slug: 'natura', nombre: 'Natura' }, { slug: 'casa-raiz', nombre: 'Casa Raíz' }];

t('hay un área por cada workspace del flujo y cada una trae pistas', () => {
  assert.deepEqual(AREAS_AGENTE.map((a) => a.id), ['estrategia', 'marketing', 'diseno', 'consulting', 'produccion']);
  for (const a of AREAS_AGENTE) { assert.ok(a.nombre); assert.ok(Array.isArray(a.pistas) && a.pistas.length > 0, a.id); }
});

t('pedidoRuta arma el sistema con agentes y clientes, y el usuario es el texto', () => {
  const { sistema, usuario } = pedidoRuta('Arma el mes de AKAI', AREAS_AGENTE, CLIENTES);
  assert.equal(usuario, 'Arma el mes de AKAI');
  assert.ok(sistema.includes('enrutador'), 'dice qué es');
  assert.ok(sistema.includes('"agente"'), 'pide el JSON');
  assert.ok(sistema.includes('- marketing:'), 'lista agentes');
  assert.ok(sistema.includes('akai'), 'lista clientes');
  assert.ok(sistema.toLowerCase().includes('cliente'), 'menciona el cliente');
});

t('pedidoRuta con listas vacías o basura no revienta y deja el texto limpio', () => {
  const a = pedidoRuta('  hola  ', [], []);
  assert.equal(a.usuario, 'hola');
  assert.ok(a.sistema.includes('(ninguno'));
  const b = pedidoRuta(null, undefined, null);
  assert.equal(b.usuario, '');
  assert.ok(typeof b.sistema === 'string');
});

t('leerRuta toma un JSON limpio y lo valida contra agentes y clientes reales', () => {
  const r = leerRuta('{"agente":"marketing","cliente":"akai","objetivo":"Armar el mes","confianza":0.9}', AREAS_AGENTE, CLIENTES);
  assert.deepEqual(r, { agente: 'marketing', cliente: 'akai', objetivo: 'Armar el mes', confianza: 0.9 });
});

t('leerRuta acepta un objeto ya parseado y mapea nombre de agente y nombre de cliente al id/slug', () => {
  const r = leerRuta({ agente: 'Marketing', cliente: 'Casa Raíz', objetivo: 'Plan', confianza: 0.7 }, AREAS_AGENTE, CLIENTES);
  assert.deepEqual(r, { agente: 'marketing', cliente: 'casa-raiz', objetivo: 'Plan', confianza: 0.7 });
  const r2 = leerRuta({ agente: 'Estrategia', cliente: 'Natura' }, AREAS_AGENTE, CLIENTES);
  assert.equal(r2.agente, 'estrategia'); assert.equal(r2.cliente, 'natura');
});

t('leerRuta saca el JSON aunque venga envuelto en ``` o en palabras', () => {
  const envuelto = 'Claro, aquí va:\n```json\n{"agente":"diseno","cliente":"akai","objetivo":"Logo","confianza":0.6}\n```\nListo.';
  const r = leerRuta(envuelto, AREAS_AGENTE, CLIENTES);
  assert.deepEqual(r, { agente: 'diseno', cliente: 'akai', objetivo: 'Logo', confianza: 0.6 });
});

t('leerRuta acepta sinónimos de llaves (area/marca/tarea/confidence)', () => {
  const r = leerRuta({ area: 'produccion', marca: 'akai', tarea: 'Shotlist del reel', confidence: 0.5 }, AREAS_AGENTE, CLIENTES);
  assert.deepEqual(r, { agente: 'produccion', cliente: 'akai', objetivo: 'Shotlist del reel', confianza: 0.5 });
});

t('leerRuta devuelve null si no hay agente válido (la tarjeta no se muestra)', () => {
  assert.equal(leerRuta('{"cliente":"akai","objetivo":"x"}', AREAS_AGENTE, CLIENTES), null);
  assert.equal(leerRuta('{"agente":"astronomia","objetivo":"x"}', AREAS_AGENTE, CLIENTES), null);
  assert.equal(leerRuta('no json', AREAS_AGENTE, CLIENTES), null);
  assert.equal(leerRuta('{"a":1}', AREAS_AGENTE, CLIENTES), null);
  assert.equal(leerRuta(null), null);
  assert.equal(leerRuta('[1,2]'), null);
});

t('el cliente desconocido queda vacío, pero no tira la ruta', () => {
  const r = leerRuta({ agente: 'marketing', cliente: 'no-existe', objetivo: 'Mes' }, AREAS_AGENTE, CLIENTES);
  assert.equal(r.agente, 'marketing'); assert.equal(r.cliente, '');
});

t('la confianza se fuerza a 0..1 y lo no numérico baja a 0', () => {
  assert.equal(leerRuta({ agente: 'marketing', confianza: 5 }, AREAS_AGENTE, CLIENTES).confianza, 1);
  assert.equal(leerRuta({ agente: 'marketing', confianza: -2 }, AREAS_AGENTE, CLIENTES).confianza, 0);
  assert.equal(leerRuta({ agente: 'marketing', confianza: 'alta' }, AREAS_AGENTE, CLIENTES).confianza, 0);
  assert.equal(leerRuta({ agente: 'marketing' }, AREAS_AGENTE, CLIENTES).confianza, 0);
});

t('el objetivo se recorta a una línea y 200 caracteres', () => {
  const largo = leerRuta({ agente: 'marketing', objetivo: 'a'.repeat(500) }, AREAS_AGENTE, CLIENTES);
  assert.equal(largo.objetivo.length, 200);
  const multi = leerRuta({ agente: 'marketing', objetivo: 'uno\ndos\t  tres' }, AREAS_AGENTE, CLIENTES);
  assert.equal(multi.objetivo, 'uno dos tres');
});

t('quiereOrquestar solo con /orquesta o /orquestar al inicio', () => {
  assert.ok(quiereOrquestar('/orquesta arma el mes'));
  assert.ok(quiereOrquestar('  /Orquestar esto'));
  assert.ok(!quiereOrquestar('arma el mes de akai'));
  assert.ok(!quiereOrquestar('dime /orquesta después'));
  assert.ok(!quiereOrquestar(''));
  assert.ok(!quiereOrquestar(null));
});

console.log(`\n${ok} pruebas del orquestador en verde`);

t('las áreas guardadas del workflow llegan al enrutador correcto', () => {
  for (const [a,b] of [['strategy','estrategia'],['creative','diseno'],['production','produccion'],['marketing','marketing'],['consulting','consulting'],['estrategia','estrategia']]) {
    assert.equal(areaRuta(a),b);
    const agentes=AREAS_AGENTE.filter(x=>x.id===areaRuta(a));
    assert.equal(agentes.length,1);
    assert.equal(leerRuta({agente:b,cliente:''},agentes,[]).agente,b);
  }
});
