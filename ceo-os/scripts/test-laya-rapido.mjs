// Laya para los juicios rápidos de las herramientas de los departamentos (public/js/laya.js · RAPIDAS, pedidoRapido,
// juzgarRapido) y su camino desde Code OS embebido («codeos:juicio» → el OS → el puente local → «codeos:juicio-resultado»).
// npm run test:laya
import assert from 'node:assert/strict';
import { PUERTAS, GATES, RAPIDAS, pedidoRapido, juzgarRapido, puertasDe, limpiarPuertas, preguntasDe, AVISO_SIN_PUENTE, MODELO } from '../public/js/laya.js';
import { acciones, leerJuicio, montarHerramientas } from '../public/js/llm/herramientas-code.js';

let ok = 0; const t = async (n, f) => { await f(); ok++; console.log('✓', n); };

await t('las 5 puertas nuevas, en español y con su tipo: prospecto (score), dolor o deseo (choice), gancho (score), quemado y voz (sí/no)', () => {
  assert.deepEqual(RAPIDAS, ['prospecto', 'dolor_deseo', 'gancho', 'quemado', 'voz']);
  assert.deepEqual(RAPIDAS.map((g) => PUERTAS[g].preguntas.map((q) => q.tipo)), [['score'], ['choice'], ['score'], ['noul'], ['noul']]);
  for (const g of RAPIDAS) { assert.ok(GATES.includes(g), 'el CEO las edita en Inherent → Laya como las demás'); assert.equal(PUERTAS[g].coll, null); assert.match(PUERTAS[g].preguntas[0].texto, /^¿.+\?$/); }
  assert.deepEqual(Object.keys(PUERTAS.dolor_deseo.preguntas[0].opciones), ['dolor', 'deseo', 'ninguno']);
  for (const g of ['lead', 'factura', 'referente', 'idea', 'etapa']) assert.ok(!RAPIDAS.includes(g), `${g} sigue siendo de un elemento del OS`);
});
await t('el CEO las edita: lo guardado manda, lo roto vuelve a fábrica', () => {
  const s = limpiarPuertas({ gates: { gancho: { preguntas: [{ id: 'engancha', tipo: 'score', texto: '¿Detiene el scroll?', niveles: ['no', 'sí'], umbral: 0.5 }] } } });
  assert.equal(puertasDe(s).gancho.preguntas[0].texto, '¿Detiene el scroll?');
  assert.deepEqual(preguntasDe('gancho', s), { engancha: { type: 'score', instructions: '¿Detiene el scroll?', criteria: ['no', 'sí'] } });
  assert.equal(puertasDe({ gates: { voz: { preguntas: [{ tipo: 'raro' }] } } }).voz.preguntas[0].id, 'respeta_voz');
});
await t('el pedido: la marca, su ICP y su voz arriba; el texto después; sin texto o con otra puerta no se pide', () => {
  const p = pedidoRapido('voz', { texto: '¡Compra YA!', contexto: { marca: 'AKAI', icp: 'familias de la zona 10', voz: 'cálida, sin gritos' } });
  assert.equal(p.model, MODELO); assert.deepEqual(Object.keys(p.questions), ['respeta_voz']);
  assert.match(p.texto, /^Marca: AKAI\nCliente ideal \(ICP\): - familias de la zona 10\nVoz de la marca: cálida, sin gritos\n\nCopy:\n¡Compra YA!$/);
  assert.match(pedidoRapido('quemado', { texto: 'POV: abres la caja', contexto: { referencias: 'POV unboxing x40' } }).texto, /Lo que ya se vio en la categoría:\nPOV unboxing x40\n\nContenido:\nPOV/);
  assert.equal(pedidoRapido('prospecto', { texto: 'Restaurante, 3 sucursales' }).texto, 'Prospecto o lead:\nRestaurante, 3 sucursales');
  assert.throws(() => pedidoRapido('lead', { texto: 'x' }), /no es una puerta de juicio rápido/);
  assert.throws(() => pedidoRapido('gancho', { texto: '  ' }), /No hay texto/);
});
await t('degradación elegante: sin puente (o preparándose, o si falla) avisa y sigue; nunca lanza', async () => {
  const nunca = () => { throw new Error('no debía llamar al puente'); };
  assert.deepEqual(await juzgarRapido('gancho', { texto: 'x' }, { estado: async () => ({ on: false }), juzgar: nunca }), { ok: false, sinPuente: true, aviso: AVISO_SIN_PUENTE });
  assert.equal((await juzgarRapido('gancho', { texto: 'x' }, { estado: async () => { throw new Error('red'); }, juzgar: nunca })).sinPuente, true);
  assert.match((await juzgarRapido('gancho', { texto: 'x' }, { estado: async () => ({ on: true, listo: false }), juzgar: nunca })).aviso, /preparando/);
  assert.match((await juzgarRapido('gancho', { texto: 'x' }, { estado: async () => ({ on: true, listo: true }), juzgar: async () => { throw new Error('timeout'); } })).aviso, /timeout.*sigue/);
  assert.equal((await juzgarRapido('nada', { texto: 'x' }, { estado: nunca, juzgar: nunca })).ok, false);
});
await t('con puente: lee la respuesta de Laya con el chip de siempre (score, choice y sí/no)', async () => {
  const on = async () => ({ on: true, listo: true });
  const g = await juzgarRapido('gancho', { texto: 'Nadie te dice esto del café' }, { estado: on, juzgar: async (p) => { assert.ok(p.questions.engancha); return { routing: { model: 'multilingual' }, answers: { engancha: { type: 'score', score: 2.6 } } }; } });
  assert.equal(g.ok, true); assert.equal(g.engine, 'laya-local'); assert.equal(g.model, 'multilingual'); assert.equal(g.respuestas[0].frase, 'engancha mucho');
  const d = await juzgarRapido('dolor_deseo', { texto: 'Ya no sé cómo llenar el local los martes' }, { estado: on, juzgar: async () => ({ answers: { dolor_o_deseo: { type: 'choice', choice: 'dolor', probabilities: { dolor: 0.81, deseo: 0.12, ninguno: 0.07 } } } }) });
  assert.equal(d.respuestas[0].answer, 'dolor'); assert.equal(d.respuestas[0].prob, 0.81);
  const v = await juzgarRapido('voz', { texto: 'x' }, { estado: on, juzgar: async () => ({ answers: { respeta_voz: { type: 'noul', noul: 0.2 } } }) });
  assert.equal(v.respuestas[0].answer, 'no'); assert.equal(v.respuestas[0].frase, 'respeta la voz 20%'); assert.equal(v.respuestas[0].cumple, null, 'sin umbral');
  assert.match((await juzgarRapido('voz', { texto: 'x' }, { estado: on, juzgar: async () => ({ answers: {} }) })).aviso, /no devolvió/);
});
await t('Code OS lo pide por postMessage («codeos:juicio»): pedido limpio o se contesta inválido', () => {
  assert.deepEqual(leerJuicio({ id: 'j-1', puerta: 'gancho', texto: ' hook ', contexto: { marca: 'AKAI', otra: 'x', icp: 3 } }, ['gancho']), { id: 'j-1', puerta: 'gancho', entrada: { texto: 'hook', contexto: { marca: 'AKAI' } } });
  assert.deepEqual(acciones({ tipo: 'codeos:juicio', id: 'j-2', puerta: 'voz', texto: 'copy' }), [{ hacer: 'juicio', id: 'j-2', puerta: 'voz', entrada: { texto: 'copy', contexto: {} } }]);
  assert.deepEqual(acciones({ tipo: 'codeos:juicio', id: 'j-3', puerta: 'factura', texto: 'x' }), [{ hacer: 'juicio-invalido', id: 'j-3' }], 'solo las puertas rápidas');
  assert.deepEqual(acciones({ tipo: 'codeos:juicio', id: '<script>', puerta: 'voz', texto: 'x' }), [], 'sin id válido no se contesta');
});
await t('el camino completo: el iframe pide, el OS juzga con el puente y contesta solo a su origen; sin Laya, contesta el aviso', async () => {
  const CODE = 'https://code.inherentglobal.com', oyentes = [], enviados = [];
  globalThis.window = { addEventListener: (k, f) => oyentes.push(f), removeEventListener() {} };
  const ventana = { postMessage: (m, o) => enviados.push([m, o]) };
  globalThis.document = { createElement: () => ({ setAttribute() {}, remove() {}, contentWindow: ventana }) };
  const pedidos = [];
  await montarHerramientas({ replaceChildren() {} }, { pase: async () => ({ pase: 'p', expira: 1, url: CODE }), contexto: () => ({}), alChat() {},
    juicio: async (puerta, entrada) => { pedidos.push([puerta, entrada.texto]); return puerta === 'voz' ? { ok: false, sinPuente: true, aviso: AVISO_SIN_PUENTE } : { ok: true, respuestas: [{ question_id: 'engancha', frase: 'engancha mucho' }] }; } });
  const e = (data, origin = CODE) => Promise.all(oyentes.map((f) => f({ data, origin, source: ventana })));
  await e({ tipo: 'codeos:juicio', id: 'a', puerta: 'gancho', texto: 'hook' });
  await e({ tipo: 'codeos:juicio', id: 'b', puerta: 'voz', texto: 'copy' });
  await e({ tipo: 'codeos:juicio', id: 'c', puerta: 'gancho', texto: 'hook' }, 'https://evil.example');
  assert.deepEqual(pedidos, [['gancho', 'hook'], ['voz', 'copy']]);
  assert.deepEqual(enviados.map(([m, o]) => [m.tipo, m.id, m.ok, o]), [['codeos:juicio-resultado', 'a', true, CODE], ['codeos:juicio-resultado', 'b', false, CODE]]);
  assert.equal(enviados[1][0].aviso, AVISO_SIN_PUENTE); assert.equal(enviados[1][0].sinPuente, true);
  delete globalThis.window; delete globalThis.document;
});

console.log(`\n${ok} pruebas de Laya (juicios rápidos) OK`);
