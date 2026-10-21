// Pruebas del chat de Diseño: el pedido lleva el método, el bloque final se lee limpio y la pieza queda Lista.
// npm run test:diseno
import assert from 'node:assert/strict';
import { promptDiseno, leerDiseno, sinBloque, piezaLista, bytesDe, carpetaDe } from '../public/js/diseno.js';
import { figmaDe, tipoAsset } from '../public/js/sistema-visual.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('La primera vez el pedido lleva el método, la marca y la idea', () => {
  const p = promptDiseno({ marca: 'Cerantola', slug: 'cerantola', formato: 'Carrusel', idea: { title: 'La apertura', guion: 'Portada: el hotel' }, pedido: 'Arma el carrusel', primera: true });
  for (const x of ['agents/06-graphic-design/brain/WORKFLOW.md', 'clients/cerantola/02-marca/sistema-visual.md', 'kit-de-redes/kit.md', 'plan-contratado.md', 'get_screenshot', '```diseno', 'IDEA DEL PLANNER', 'Portada: el hotel', 'Pedido: Arma el carrusel']) assert.ok(p.includes(x), x);
  assert.match(p, /\n\nCUANDO TERMINES/);
});
t('Después solo va el pedido, la lámina y el cierre', () => {
  const p = promptDiseno({ marca: 'Cerantola', slug: 'cerantola', lamina: { id: '1:4', nombre: '04 Las cifras' }, pedido: 'Deja una sola cifra naranja', primera: false });
  assert.ok(p.includes('«04 Las cifras» (nodo 1:4)')); assert.ok(p.includes('```diseno')); assert.ok(!p.includes('WORKFLOW.md'));
});
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
console.log(`\n${ok} pruebas pasaron`);
