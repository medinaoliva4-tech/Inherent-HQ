import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarEstilos, validarEstilo, aplicarEstilo, plantillaPara, resumen, CATEGORIAS, ErrorEstilo } from '../estilos.mjs';
import { normalizarCorte, receta } from '../corte.mjs';
import { movimientoCapa, assTexto, argsEscena } from '../ffmpeg.mjs';

const catalogo = cargarEstilos();
const porId = Object.fromEntries(catalogo.map((e) => [e.id, e]));
const corte = (n, extra = {}) => normalizarCorte({ id: 'c1', formato: '9:16', escenas: Array.from({ length: n }, (_, i) => ({ id: `e${i}`, clip: `crudo/E0${i}.mp4`, inicio: 0, fin: 3, texto: `Frase ${i + 1}`, fuente: i === 0 ? 'DIN Condensed Bold' : null, nota: `toma ${i}` })), ...extra });

test('el catálogo inicial es válido, chico y cubre las categorías', () => {
  assert.ok(catalogo.length >= 6 && catalogo.length <= 10, `${catalogo.length} estilos`);
  for (const c of Object.keys(CATEGORIAS)) assert.ok(catalogo.some((e) => e.categoria === c), `falta la categoría ${c}`);
  for (const e of catalogo) {
    assert.match(e.prompt, new RegExp(e.id), 'el prompt nombra el id para que el agente lo encuentre');
    assert.ok(e.descripcion.length <= 120, `${e.id}: descripción de una línea`);
    assert.ok(e.ejemplo?.textos?.length, `${e.id}: textos de ejemplo para la vista previa`);
  }
  assert.deepEqual(Object.keys(resumen(catalogo[0])).sort(), ['categoria', 'categoriaNombre', 'descripcion', 'formato', 'id', 'nombre', 'prompt', 'requiere']);
});

test('validación: errores claros', () => {
  const base = structuredClone(porId['cta-final']);
  assert.throws(() => validarEstilo({ ...base, categoria: 'memes' }), /categoría/);
  assert.throws(() => validarEstilo({ ...base, id: 'CTA Final' }), /id/);
  assert.throws(() => validarEstilo({ ...base, escenas_plantilla: [{ rol: 'intro' }] }), /rol/);
  assert.throws(() => validarEstilo({ ...base, escenas_plantilla: [{ rol: 'gancho', estilos: [{ tipo: 'color', preset: 'neon' }] }] }), /no existe/);
});

test('cada escena recibe su plantilla: gancho, cuerpo en ciclo, cierre', () => {
  const e = porId['caja-subtitulos']; // cuerpo A = acercamiento, cuerpo B = sin zoom
  const roles = [0, 1, 2, 3, 4].map((i) => e.escenas_plantilla.indexOf(plantillaPara(e, i, 5)));
  assert.deepEqual(roles, [0, 1, 2, 1, 3]);
  assert.equal(e.escenas_plantilla.indexOf(plantillaPara(e, 0, 1)), 0, 'una sola escena = gancho');
});

test('aplicar conserva clip, tramo, nota, texto y tipografía; pone capas y estilos de la receta', () => {
  const { corte: c, pendientes } = aplicarEstilo(corte(4), porId['caja-subtitulos']);
  assert.equal(c.estilo, 'caja-subtitulos');
  assert.deepEqual(pendientes, []);
  assert.deepEqual(c.escenas.map((e) => e.clip), ['crudo/E00.mp4', 'crudo/E01.mp4', 'crudo/E02.mp4', 'crudo/E03.mp4']);
  assert.deepEqual(c.escenas.map((e) => e.texto), ['Frase 1', 'Frase 2', 'Frase 3', 'Frase 4']);
  assert.equal(c.escenas[0].capas[0].caja, '#f3ead8');
  assert.equal(c.escenas[0].capas[0].fuente, 'DIN Condensed Bold');
  assert.equal(c.escenas[1].estilos[0].desde, 1.18);
  assert.equal(c.escenas[0].nota, 'toma 0');
  assert.ok(receta(c.escenas[0], c).some((r) => /en caja/.test(r)));
});

test('aplicar pide los recursos que el estilo necesita y los pone en las capas', () => {
  assert.throws(() => aplicarEstilo(corte(3), porId['reels-sobre-la-cabeza']), (e) => e instanceof ErrorEstilo && /3 × reels/.test(e.message));
  const { corte: c } = aplicarEstilo(corte(3), porId['reels-sobre-la-cabeza'], { reels: ['imagenes/a.png', 'imagenes/b.png', 'imagenes/c.png'] });
  assert.deepEqual(c.escenas[0].capas.filter((x) => x.tipo === 'imagen').map((x) => x.ruta), ['imagenes/a.png', 'imagenes/c.png', 'imagenes/b.png']);
  assert.equal(c.escenas[0].estilos.filter((s) => s.tipo === 'animacion-capa' && s.animacion === 'abanico').length, 3);
});

test('detrás de la persona deja pendiente la máscara y reusa la que ya había', () => {
  const { corte: c, pendientes } = aplicarEstilo(corte(3), porId['detras-de-la-cabeza']);
  assert.deepEqual(pendientes.map((p) => p.escena), ['e0', 'e2']);
  const conMascara = normalizarCorte({ ...c, escenas: c.escenas.map((e, i) => (i === 0 ? { ...e, estilos: e.estilos.map((s) => (s.tipo === 'detras-de-persona' ? { ...s, mascara: 'mascaras/E00.mp4' } : s)) } : e)) });
  const otra = aplicarEstilo(conMascara, porId['detras-de-la-cabeza']);
  assert.deepEqual(otra.pendientes.map((p) => p.escena), ['e2']);
});

test('el estilo fija su formato y quita capas de texto si la escena no tiene texto', () => {
  const sinTexto = normalizarCorte({ escenas: [{ clip: 'a.mp4', inicio: 0, fin: 2 }, { clip: 'b.mp4', inicio: 0, fin: 2, texto: 'Hola' }] });
  const { corte: c } = aplicarEstilo(sinTexto, porId['anuncio-corto']);
  assert.equal(c.formato, '1:1');
  assert.equal(c.escenas[0].capas.length, 0);
  assert.equal(c.escenas[0].estilos.some((s) => s.tipo === 'animacion-texto'), false, 'la animación de una capa que no existe se quita');
});

test('render: caja de texto (BorderStyle 3) y animaciones de imagen', () => {
  const a = assTexto('9:16', { texto: 'Hola', x: 0.5, y: 0.7, tam: 0.04, color: '#111111', caja: '#f3ead8' }, 2, null);
  assert.match(a, /,0,3,3,0,5,/, 'BorderStyle 3 = caja');
  assert.match(a, /\\bord20\\3c&HD8EAF3&/);
  assert.equal(movimientoCapa(null).filtro, '');
  assert.match(movimientoCapa({ animacion: 'subir', retraso: 0.3 }).filtro, /fade=t=in:st=0.3:d=0.6:alpha=1/);
  assert.match(movimientoCapa({ animacion: 'subir', retraso: 0 }).dy, /main_h\*0.08/);
  assert.match(movimientoCapa({ animacion: 'abanico', angulo: -14, retraso: 0 }).filtro, /rotate=a='-14\*PI\/180/);
  assert.match(movimientoCapa({ animacion: 'flotar', angulo: 20 }).dy, /sin\(2\*PI\*t\/3\+2\)/);
  const { corte: c } = aplicarEstilo(corte(2), porId['reels-sobre-la-cabeza'], { reels: ['r/a.png', 'r/b.png', 'r/c.png'] });
  const e = c.escenas[0];
  const args = argsEscena({ escena: e, formato: '9:16', salida: '/t/e.mp4', tieneAudio: true,
    rutas: { clip: '/m/a.mp4', capas: Object.fromEntries(e.capas.filter((x) => x.tipo === 'imagen').map((x) => [x.id, `/m/${x.ruta}`])), textos: { principal: '/t/p.ass' } } });
  const f = args[args.indexOf('-filter_complex') + 1];
  assert.equal((f.match(/rotate=/g) ?? []).length, 2, 'dos reels giran (el del centro no)');
  assert.ok(f.indexOf('subtitles=') > f.lastIndexOf('overlay='), 'el texto queda arriba de los reels');
});
