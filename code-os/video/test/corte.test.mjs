import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarCorte, receta, duracionCorte, ErrorCorte } from '../corte.mjs';
import { primerCorte } from '../primer-corte.mjs';

const escena = (x = {}) => ({ clip: 'a.mp4', inicio: 1, fin: 4, ...x });

test('completa valores por defecto y calcula duración', () => {
  const c = normalizarCorte({ escenas: [escena(), escena({ inicio: 0, fin: 2 })] });
  assert.equal(c.formato, '9:16');
  assert.equal(c.version, 1);
  assert.deepEqual(c.escenas[0].capas, []);
  assert.deepEqual(c.escenas[0].estilos, []);
  assert.equal(duracionCorte(c), 5);
});

test('texto/fuente crean la capa principal y la mantienen sincronizada', () => {
  const c = normalizarCorte({ escenas: [escena({ texto: 'Hola', fuente: 'Inter-Bold' })] });
  const p = c.escenas[0].capas.find((x) => x.id === 'principal');
  assert.equal(p.texto, 'Hola'); assert.equal(p.fuente, 'Inter-Bold'); assert.equal(p.tipo, 'texto');
  // el agente cambia solo `texto`: manda sobre la capa
  const c2 = normalizarCorte({ escenas: [{ ...c.escenas[0], texto: 'Adiós' }] });
  assert.equal(c2.escenas[0].capas.find((x) => x.id === 'principal').texto, 'Adiós');
  assert.equal(c2.escenas[0].texto, 'Adiós');
  // texto vacío quita la capa
  const c3 = normalizarCorte({ escenas: [{ ...c.escenas[0], texto: '' }] });
  assert.equal(c3.escenas[0].capas.length, 0);
});

test('limita valores fuera de rango', () => {
  const c = normalizarCorte({ escenas: [escena({ capas: [{ tipo: 'texto', texto: 'x', x: 3, tam: 9 }], estilos: [{ tipo: 'zoom', desde: 0.2, hasta: 9 }] })] });
  assert.equal(c.escenas[0].capas[0].x, 1);
  assert.equal(c.escenas[0].capas[0].tam, 0.25);
  assert.deepEqual(c.escenas[0].estilos[0], { tipo: 'zoom', desde: 1, hasta: 4, x: 0.5, y: 0.5 });
});

test('errores claros para el agente', () => {
  assert.throws(() => normalizarCorte({ escenas: [] }), ErrorCorte);
  assert.throws(() => normalizarCorte({ formato: '4:5', escenas: [escena()] }), /formato inválido/);
  assert.throws(() => normalizarCorte({ escenas: [escena({ fin: 1 })] }), /fin/);
  assert.throws(() => normalizarCorte({ escenas: [{ inicio: 0, fin: 2 }] }), /falta clip/);
  assert.throws(() => normalizarCorte({ escenas: [escena({ estilos: [{ tipo: 'glitch' }] })] }), /estilo desconocido/);
  assert.throws(() => normalizarCorte({ escenas: [escena({ estilos: [{ tipo: 'color', preset: 'neon' }] })] }), /no existe/);
  assert.throws(() => normalizarCorte({ escenas: [escena({ estilos: [{ tipo: 'detras-de-persona', capa: 'nada' }] })] }), /no existe/);
  assert.throws(() => normalizarCorte({ escenas: [escena({ estilos: [{ tipo: 'zoom' }, { tipo: 'zoom' }] })] }), /repetido/);
  assert.throws(() => normalizarCorte({ escenas: [escena({ capas: [{ tipo: 'imagen' }] })] }), /ruta/);
});

test('receta: lo que muestra la tarjeta del tablero', () => {
  const c = normalizarCorte({ musica: { ruta: 'musica/pista.mp3' }, escenas: [escena({
    texto: 'Sal de la rutina', fuente: 'Inter-Bold',
    capas: [{ id: 'sol', tipo: 'imagen', ruta: 'imagenes/sol.png' }],
    estilos: [{ tipo: 'zoom', desde: 1, hasta: 1.2 }, { tipo: 'color', preset: 'calido' }, { tipo: 'transicion', entrada: 'fundido', duracion: 0.5 },
      { tipo: 'detras-de-persona', capa: 'sol' }],
  })] });
  assert.deepEqual(receta(c.escenas[0], c), [
    'Zoom acercando 100→120%', 'Color: Cálido', 'Entra con fundido 0.5s', 'Animación detrás de la persona (falta máscara)',
    'Imagen sol.png', 'Texto «Sal de la rutina» · Inter-Bold', 'Música: pista.mp3 (todo el video)',
  ]);
});

test('primer corte: empata tomas con clips por campo o por nombre y reporta faltantes', () => {
  const shotlist = { titulo: 'Reel', fuente: 'Inter-Bold', tomas: [
    { id: 'E01', duracion: 3, texto: 'Hook' },
    { id: 'E02', duracion: 4, estilos: [{ tipo: 'color', preset: 'bn' }] },
    { id: 'E03', duracion: 2 },
    { id: 'E04', duracion: 2 },
  ] };
  const clips = [
    { ruta: 'crudo/toma-e02-b.mp4', duracion: 10, inicio: 2 },
    { ruta: 'crudo/x.mp4', toma: 'E01', duracion: 2 },
    { ruta: 'crudo/E03.mov', duracion: 5 },
    { ruta: 'crudo/E030.mov', duracion: 5 },
  ];
  const { corte, faltantes } = primerCorte({ shotlist, clips });
  assert.deepEqual(corte.escenas.map((e) => e.clip), ['crudo/x.mp4', 'crudo/toma-e02-b.mp4', 'crudo/E03.mov']);
  assert.equal(corte.escenas[0].fin, 2); // el clip solo dura 2 s
  assert.equal(corte.escenas[0].texto, 'Hook');
  assert.equal(corte.escenas[0].fuente, 'Inter-Bold');
  assert.deepEqual(corte.escenas[1].estilos, [{ tipo: 'color', preset: 'bn' }]);
  assert.equal(corte.escenas[1].inicio, 2); assert.equal(corte.escenas[1].fin, 6);
  assert.equal(corte.escenas[2].estilos[0].tipo, 'zoom'); // receta por defecto
  assert.deepEqual(faltantes.map((f) => f.toma), ['E01', 'E04']);
  assert.equal(corte.origen.faltantes.length, 2);
});
