// Pruebas del chat de Diseño: el pedido lleva el método, el bloque final se lee limpio y la pieza queda Lista.
// npm run test:diseno
import assert from 'node:assert/strict';
import { promptDiseno, leerDiseno, sinBloque, piezaLista, bytesDe, carpetaDe, MESES_CTX, etiquetaCtx, textoCalendario, textoPlan, textoRefs, textoFormatos, textoIdea, SUGERENCIAS, variacionesDe, letraLibre, elegirVariacion, colaDelMes } from '../public/js/diseno.js';
import { figmaDe, tipoAsset } from '../public/js/sistema-visual.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('La primera vez el pedido lleva el método, la marca y el contexto', () => {
  const p = promptDiseno({ marca: 'Cerantola', slug: 'cerantola', formato: 'Carrusel', contexto: textoIdea({ title: 'La apertura' }, 'Portada: el hotel'), pedido: 'Arma el carrusel', primera: true });
  for (const x of ['agents/06-graphic-design/brain/WORKFLOW.md', 'clients/cerantola/02-marca/sistema-visual.md', 'kit-de-redes/kit.md', 'plan-contratado.md', 'get_screenshot', '```diseno', 'CONTEXTO QUE AGREGÓ LA PERSONA', 'IDEA DEL CALENDARIO', 'Portada: el hotel', 'Pedido: Arma el carrusel']) assert.ok(p.includes(x), x);
  assert.match(p, /\n\nCUANDO TERMINES/);
});
t('Después solo va el pedido, la lámina y el cierre', () => {
  const p = promptDiseno({ marca: 'Cerantola', slug: 'cerantola', lamina: { id: '1:4', nombre: '04 Las cifras' }, pedido: 'Deja una sola cifra naranja', primera: false });
  assert.ok(p.includes('«04 Las cifras» (nodo 1:4)')); assert.ok(p.includes('```diseno')); assert.ok(!p.includes('WORKFLOW.md'));
});
t('+ Contexto: los meses, las etiquetas y el calendario con lo que falta diseñar', () => {
  assert.deepEqual(MESES_CTX(new Date(2026, 11, 3)), ['2026-12', '2027-01']);
  assert.equal(etiquetaCtx('cal:2026-10', { marca: 'Cerantola' }), 'Calendario de Cerantola · Octubre 2026');
  assert.equal(etiquetaCtx('idea:x', { ideas: [{ id: 'x', title: 'La apertura' }] }), 'Idea · La apertura');
  const c = textoCalendario({ marca: 'Cerantola', mes: '2026-10', piezas: [{ date: '2026-10-09', format: 'Carrusel', title: 'Cifras', status: 'Idea' }, { date: '2026-10-02', format: 'Reel', title: 'Apertura', status: 'Publicado' }, { date: '2026-11-01', format: 'Story', title: 'Otro mes' }] });
  assert.ok(c.includes('2 piezas, 1 por diseñar')); assert.ok(c.indexOf('Apertura') < c.indexOf('Cifras')); assert.ok(c.includes('FALTA DISEÑAR')); assert.ok(!c.includes('Otro mes'));
  assert.ok(textoPlan({ root: 'clients/cerantola', mes: '2026-10' }).includes('clients/cerantola/03-marketing/2026-10/'));
  const rf = textoRefs([{ handle: 'a', views: 10 }, { handle: 'c', x: 4 }, { handle: 'b', views: 99, replicar: true }]); assert.ok(rf.indexOf('@b') < rf.indexOf('@c') && rf.indexOf('@c') < rf.indexOf('@a')); assert.ok(rf.includes('rinde ×4'));
  const fm = textoFormatos([{ nombre: 'Pediste vs llegó', tipo: 'reel', ref: { url: 'https://x/reel/1' }, partes: [{ nombre: 'Hook' }, { nombre: 'Prueba' }] }]); assert.ok(fm.includes('sale de https://x/reel/1') && fm.includes('Hook → Prueba'));
});
t('Lo nuevo del contexto también llega después del primer mensaje', () => assert.ok(promptDiseno({ marca: 'X', slug: 'x', contexto: 'REFERENTES…', pedido: 'Sigue', primera: false }).includes('REFERENTES…')));
t('Inherent usa su propia carpeta', () => assert.equal(carpetaDe('inherent'), 'inherent/inherent-social-media'));
t('El bloque final se lee y se quita del texto', () => {
  const r = leerDiseno('Listo.\n\n```diseno\n{"titulo":"La apertura","formato":"Carrusel","figma":"https://www.figma.com/design/x?node-id=1-2","laminas":[{"id":"1:2","nombre":"01 Portada"},{"id":"1:3"}],"revision":[{"ok":false,"texto":"Dos acentos"}],"pregunta":{"texto":"¿Qué foto?","opciones":["A","B"]}}\n```');
  assert.equal(r.texto, 'Listo.'); assert.equal(r.resultado.laminas.length, 2); assert.equal(r.resultado.laminas[1].nombre, 'Lámina 02');
  assert.deepEqual(r.resultado.revision, [{ ok: false, texto: 'Dos acentos' }]); assert.deepEqual(r.pregunta, { texto: '¿Qué foto?', opciones: ['A', 'B'] });
});
t('Un bloque roto, sin láminas o con un link que no es de Figma no pasa', () => {
  assert.equal(leerDiseno('Hola ```diseno {roto```').resultado, null);
  assert.equal(leerDiseno('```diseno\n{"laminas":[]}\n```').resultado, null);
  assert.equal(leerDiseno('```diseno\n{"figma":"https://malo.com","laminas":[{"id":"1:2"}]}\n```').resultado.figma, '');
  assert.equal(sinBloque('Armando…\n```diseno\n{"tit'), 'Armando…');
});
t('Al guardar, la pieza queda Lista con su formato, su Figma y sus láminas', () => {
  const r = { formato: 'Carrusel', figma: 'https://www.figma.com/design/x', laminas: [{ id: '1:2', nombre: '01' }, { id: '1:3', nombre: '02' }] };
  const p = piezaLista({ id: 'p1', title: 'La apertura', format: 'Reel', status: 'Idea' }, r, [{ drive_id: 'd1', url: 'https://drive/1' }, null], '2026-10-21T00:00:00Z');
  assert.equal(p.status, 'Listo'); assert.equal(p.format, 'Carrusel'); assert.equal(p.drive_id, 'd1'); assert.equal(p.diseno.laminas[1].drive_id, undefined); assert.equal(p.diseno.at, '2026-10-21T00:00:00Z');
  const q = piezaLista({ id: 'p2', title: 'X' }, { ...r, formato: 'Plantilla' }, []); assert.equal(q.url, 'https://www.figma.com/design/x'); assert.equal(q.format, 'Carrusel');
});
t('Las imágenes se vuelven bytes para Drive', () => assert.deepEqual([...bytesDe('AAEC')], [0, 1, 2]));
t('Design system: el link de Figma del kit y el grupo de cada asset', () => {
  assert.equal(figmaDe('| **Figma** | [Kit](https://www.figma.com/design/abc?node-id=1-2) · página'), 'https://www.figma.com/design/abc?node-id=1-2');
  assert.equal(tipoAsset({ name: 'icono-casa.svg', mime: 'image/svg+xml' }), 'Íconos');
  assert.equal(tipoAsset({ name: 'textura-madera.jpg', mime: 'image/jpeg' }), 'Texturas');
  assert.equal(tipoAsset({ name: 'lobby.jpg', mime: 'image/jpeg' }), 'Fotos e imágenes');
  assert.equal(tipoAsset({ name: 'Logos', mime: 'application/vnd.google-apps.folder' }), 'Carpetas');
});
t('Sin «Retocar fotos con IA» en las sugerencias', () => assert.ok(!SUGERENCIAS.some((x) => /retocar|foto/i.test(x))));
t('Variaciones: A, B y C se guardan, elegir no borra y rehacer una letra conserva la versión anterior', () => {
  const r = (n) => ({ titulo: 'T', formato: 'Carrusel', figma: 'https://www.figma.com/design/x' + n, laminas: [{ id: n, nombre: 'L' + n }], revision: [{ ok: true, texto: 'ok' }] });
  let p = piezaLista({ id: 'p', title: 'T', format: 'Carrusel' }, r('1'), [], '2026-10-01');
  assert.equal(p.diseno.elegida, 'A'); assert.equal(p.diseno.laminas[0].id, '1');
  p = piezaLista(p, r('2'), [], '2026-10-02'); p = piezaLista(p, r('3'), [], '2026-10-03');
  assert.deepEqual(p.diseno.variaciones.map((v) => v.id), ['A', 'B', 'C']); assert.equal(p.diseno.elegida, 'A'); assert.equal(letraLibre(p.diseno.variaciones), 'D');
  p = elegirVariacion(p, 'C'); assert.equal(p.diseno.elegida, 'C'); assert.equal(p.diseno.laminas[0].id, '3'); assert.equal(p.diseno.variaciones.length, 3);
  p = piezaLista(p, r('9'), [], '2026-10-04', { letra: 'B' }); const b = p.diseno.variaciones.find((v) => v.id === 'B');
  assert.equal(b.laminas[0].id, '9'); assert.equal(b.versiones[0].laminas[0].id, '2'); assert.equal(p.diseno.elegida, 'C'); assert.equal(p.status, 'Listo');
});
t('Una pieza vieja con solo laminas cuenta como variación A', () => {
  const v = variacionesDe({ title: 'X', format: 'Estático', diseno: { figma: 'f', laminas: [{ id: '1', nombre: 'a' }] } });
  assert.equal(v.variaciones[0].id, 'A'); assert.equal(v.elegida, 'A'); assert.deepEqual(variacionesDe({ title: 'Y' }), { variaciones: [], elegida: '' });
});
t('La cola del mes: orden por fecha, lo que falta y cuántas variaciones lleva', () => {
  const c = colaDelMes({ mes: '2026-10', piezas: [{ id: 'a', date: '2026-10-09', format: 'Carrusel', title: 'Cifras', status: 'Idea' }, { id: 'b', date: '2026-10-02', format: 'Reel', title: 'Apertura' }, { id: 'c', date: '2026-10-03', format: 'Story', title: 'Hecha', status: 'Listo', diseno: { laminas: [{ id: '1' }] } }, { id: 'd', date: '2026-11-01', format: 'Story' }] });
  assert.deepEqual(c.map((x) => x.id), ['c', 'a']); assert.equal(c[0].variaciones, 1); assert.equal(c[0].falta, false); assert.equal(c[1].falta, true);
});
t('La variación pide otra dirección y nombra las anteriores', () => {
  const p = promptDiseno({ marca: 'X', slug: 'x', pedido: 'Otra', primera: false, variacion: 'B', otras: [{ id: 'A', titulo: 'Cifra grande' }] });
  assert.ok(p.includes('VARIACIÓN B') && p.includes('A: Cifra grande'));
});
console.log(`\n${ok} pruebas pasaron`);
