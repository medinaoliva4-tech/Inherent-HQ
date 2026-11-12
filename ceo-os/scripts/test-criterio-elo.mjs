import assert from 'node:assert/strict';
import { actualizar, probabilidad, limpiarComparaciones, clasificar, siguientePar, evidenciaPar } from '../public/js/creative/criterio-elo.js';
import { limpiar, alUsar, aMd } from '../public/js/creative/rendimiento-creativo.js';

const piezas = [{ id: 'uno', titulo: 'Pieza uno' }, { id: 'dos', titulo: 'Pieza dos' }, { id: 'tres', titulo: 'Pieza tres' }];
const voto = (id, a, b, resultado) => ({ id, a, b, resultado, fecha: '2026-11-12T10:00:00Z', nota: 'Criterio humano' });

assert.equal(probabilidad(1500, 1500), 0.5);
const [a, b] = actualizar(1500, 1500, 'a');
assert.equal(a, 1512); assert.equal(b, 1488); assert.equal(a + b, 3000);
assert.deepEqual(actualizar(1500, 1500, 'empate'), [1500, 1500]);

const eventos = [voto('1', 'uno', 'dos', 'a'), voto('2', 'dos', 'tres', 'a')];
const ranking = clasificar(piezas, eventos);
assert.equal(ranking[0].id, 'uno'); assert.equal(ranking[0].rating, 1512);
assert.equal(ranking[0].provisional, true);
assert.equal(siguientePar(piezas, eventos).n, 0);
assert.equal(evidenciaPar('uno', 'dos', eventos).media, 2 / 3);

const invalidos = [voto('x', 'uno', 'otro-cliente', 'a'), voto('y', 'uno', 'uno', 'a'), voto('z', 'uno', 'dos', 'inventado'), voto('1', 'uno', 'dos', 'b')];
assert.deepEqual(limpiarComparaciones(piezas, [...eventos, ...invalidos]), eventos);

const contenido = limpiar({ mes: '2026-11', piezas, comparaciones: [...eventos, ...invalidos] });
assert.equal(contenido.comparaciones.length, 2);
assert.deepEqual(limpiar(contenido), contenido);
assert.deepEqual(alUsar({ aprendizaje: 'Nueva lectura' }, contenido).comparaciones, eventos);
assert.match(aMd(contenido), /Ranking Elo provisional/);
assert.equal(limpiar({ ...contenido, piezas: [piezas[0]] }).comparaciones.length, 0);

console.log('✓ criterio Elo: cálculo, evidencia, cobertura, validación y persistencia');
