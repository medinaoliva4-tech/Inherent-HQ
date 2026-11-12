import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarCatalogo, validarMarca, guiaDeEdicion, aplicarMarca } from '../marcas.mjs';
import { normalizarCorte } from '../corte.mjs';
import { cargarEstilos } from '../estilos.mjs';
import { argsFinal } from '../ffmpeg.mjs';

const catalogo = cargarCatalogo();

test('catálogo base: secciones con ids únicos; lo que dice tener render trae una receta válida', () => {
  for (const s of ['transiciones', 'efectos', 'animaciones_texto']) {
    const ids = catalogo[s].map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, `${s}: ids repetidos`);
    for (const x of catalogo[s]) {
      assert.ok(x.nombre && x.descripcion, `${s}/${x.id}: nombre y descripción`);
      assert.equal(typeof x.render, 'boolean');
      if (!x.receta) continue;
      // cada receta se puede poner en una escena real (con texto e imagen por si la pide)
      const r = ['animacion-capa', 'detras-de-persona'].includes(x.receta.tipo) ? { ...x.receta, capa: 'img' } : x.receta.tipo === 'animacion-texto' ? { ...x.receta, capa: 'principal' } : x.receta;
      normalizarCorte({ escenas: [{ clip: 'a.mp4', inicio: 0, fin: 1, texto: 'x', capas: [{ id: 'img', tipo: 'imagen', ruta: 'i.png' }], estilos: [r] }] });
    }
  }
  assert.ok(catalogo.transiciones.some((x) => !x.render), 'hay transiciones listadas que todavía no tienen render');
});

test('marca: validación y valores limpios', () => {
  assert.throws(() => validarMarca({ id: 'AKAI', nombre: 'x' }), /id/);
  assert.throws(() => validarMarca({ id: 'a', nombre: 'x', colores: [{ nombre: 'r', hex: 'rojo' }] }), /hex/);
  assert.throws(() => validarMarca({ id: 'a', nombre: 'x', musica: [{ nombre: 'm' }] }), /sin ruta/);
  const m = validarMarca({ id: 'a', nombre: ' A ', elegidos: { transiciones: ['corte', 'corte', 3] } });
  assert.deepEqual(m.elegidos, { transiciones: ['corte'], efectos: [], animaciones_texto: [], estilos: [] });
  assert.equal(m.nombre, 'A');
});

test('guía de edición: solo lo elegido, con receta y render; predeterminados y reglas', () => {
  const m = validarMarca({ id: 'n', nombre: 'NAO', elegidos: { transiciones: ['corte', 'no-existe'], efectos: ['zoom-lento'], estilos: ['cta-final'] },
    tipografias: [{ nombre: 'Georgia Bold', ruta: 'marcas/n/fuentes/g.ttf', uso: 'titulos' }], colores: [{ nombre: 'T', hex: '#ffffff', uso: 'texto' }], guia: 'Sin humor negro.' });
  const g = guiaDeEdicion(m, catalogo, cargarEstilos());
  assert.deepEqual(g.transiciones.map((x) => x.id), ['corte'], 'lo que ya no está en el catálogo no aparece');
  assert.deepEqual(g.efectos[0].receta, { tipo: 'zoom', desde: 1, hasta: 1.1, x: 0.5, y: 0.45 });
  assert.deepEqual(g.estilos.map((x) => x.id), ['cta-final']);
  assert.equal(g.predeterminados.fuente, 'Georgia Bold');
  assert.ok(g.reglas.includes('Sin humor negro.'));
});

test('aplicar marca: tipografía, colores y música solo donde faltan', () => {
  const m = validarMarca({ id: 'n', nombre: 'NAO', tipografias: [{ nombre: 'Georgia Bold', ruta: 'x.ttf' }], colores: [{ nombre: 'T', hex: '#ffffff', uso: 'texto' }, { nombre: 'C', hex: '#111111', uso: 'caja' }], musica: [{ nombre: 'Tema', ruta: 'marcas/n/musica/t.m4a' }] });
  const v = normalizarCorte({ escenas: [{ clip: 'a.mp4', inicio: 0, fin: 1, capas: [{ id: 'principal', tipo: 'texto', texto: 'Hola' }, { id: 'b', tipo: 'texto', texto: 'Caja', caja: '#f3ead8', color: '#000000' }, { id: 'c', tipo: 'texto', texto: 'Propia', fuente: 'Arial' }] }] });
  const x = normalizarCorte(aplicarMarca(v, m));
  const [a, b, c] = x.escenas[0].capas;
  assert.deepEqual([a.fuente, a.color], ['Georgia Bold', '#ffffff']);
  assert.deepEqual([b.caja, b.color], ['#111111', '#000000']);
  assert.equal(c.fuente, 'Arial', 'no pisa una tipografía elegida');
  assert.equal(x.marca, 'n');
  assert.deepEqual(x.musica, { ruta: 'marcas/n/musica/t.m4a', volumen: 0.22, inicio: 0, ducking: true });
  const conMusica = aplicarMarca({ ...v, musica: { ruta: 'otra.m4a', volumen: 0.5 } }, m);
  assert.equal(conMusica.musica.ruta, 'otra.m4a', 'no pisa la música del video');
});

test('ducking en el render: la música baja sola bajo la voz', () => {
  const a = argsFinal({ entrada: '/u.mp4', salida: '/o.mp4', musica: { ruta: '/m.m4a', volumen: 0.2, ducking: true } });
  assert.match(a[a.indexOf('-filter_complex') + 1], /\[m0\]\[llave\]sidechaincompress/);
  const b = argsFinal({ entrada: '/u.mp4', salida: '/o.mp4', musica: { ruta: '/m.m4a', volumen: 0.2 } });
  assert.doesNotMatch(b[b.indexOf('-filter_complex') + 1], /sidechaincompress/);
});
