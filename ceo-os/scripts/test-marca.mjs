// Pruebas de Marca › Video, Ads y Tech: las reglas puras (sin base ni red).
// npm run test:marca
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { limpiarKit, kitDesdeSistema, limpiarFicha, pedidoVideo, seg, reloj, duracionCortes } from '../public/js/video.js';
import { leerSistema } from '../public/js/sistema-visual.js';
import { limpiarVariante, leerVariaciones, faltas, pasoPermitido, tareaLanzar } from '../public/js/ads-studio.js';
import { limpiarSitio, formularioLanding, puntajeDe, piezaPublica } from '../public/js/tech.js';

const root = new URL('../../', import.meta.url).pathname;
let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('Video: los tiempos se leen como «0:12» y se escriben igual', () => {
  assert.equal(seg('0:12'), 12); assert.equal(seg('1:05.5'), 65.5); assert.equal(seg('7'), 7); assert.equal(seg('x'), null);
  assert.equal(reloj(65.5), '1:05.5'); assert.equal(reloj(3), '0:03');
});
t('Video: el kit sale del design system de la marca, sin inventar', () => {
  const k = kitDesdeSistema(leerSistema(fs.readFileSync(root + 'clients/cerantola/02-marca/sistema-visual.md', 'utf8')));
  assert.equal(k.subtitulos.tamano, 40); assert.ok(k.colores.length >= 3); assert.match(k.ritmo, /Planos sostenidos/); assert.match(k.outro, /logo/);
  assert.deepEqual(kitDesdeSistema(null), limpiarKit({}));
});
t('Video: la ficha descarta links que no son https y ordena los cortes', () => {
  const f = limpiarFicha({ titulo: 'A', cortes: [{ desde: '0:00', hasta: '0:03', toma: 'x' }, { desde: '0:03', hasta: '0:08', toma: 'y' }], assets: [{ nombre: 'a', url: 'http://inseguro.com' }, { nombre: 'b', url: 'https://drive.google.com/x' }] });
  assert.equal(f.assets[0].url, ''); assert.equal(f.assets[1].url, 'https://drive.google.com/x'); assert.equal(duracionCortes(f.cortes), 8);
  const p = pedidoVideo(f, limpiarKit({ colores: ['#262523'] }), 'Cerantola', 'clients/cerantola');
  assert.match(p, /^\/video-editing/); assert.match(p, /1\. 0:00–0:03 · x/); assert.match(p, /#262523/); assert.ok(!/\n\n\n/.test(p));
});
t('Ads: lee las variaciones de Claude y las liga a su avatar', () => {
  const r = 'Hola\n```variaciones\n[{"avatar":"Dueña","plataforma":"meta","formato":"4:5","gancho":"G","texto":"T","titulo":"Ti","cta":"Reservar"},{"plataforma":"google","gancho":"H","titulos":["a","b","c"],"descripciones":["d","e"]},{"plataforma":"meta"}]\n```';
  const vs = leerVariaciones(r, [{ id: 'av1', nombre: 'Dueña' }]);
  assert.equal(vs.length, 2); assert.equal(vs[0].avatar.id, 'av1'); assert.equal(vs[0].meta.cta, 'Reservar'); assert.equal(vs[1].formato, 'Búsqueda');
  assert.deepEqual(leerVariaciones('sin bloque'), []);
});
t('Ads: Google no se aprueba con títulos de más de 30 caracteres ni con menos de 3', () => {
  assert.deepEqual(faltas(limpiarVariante({ plataforma: 'google', gancho: 'g', google: { titulos: ['a', 'b', 'c'], descripciones: ['d', 'e'] } })), []);
  assert.ok(faltas(limpiarVariante({ plataforma: 'google', gancho: 'g', google: { titulos: ['a'.repeat(31), 'b', 'c'], descripciones: ['d', 'e'] } })).some((x) => /30 caracteres/.test(x)));
  assert.ok(faltas(limpiarVariante({ plataforma: 'google', gancho: 'g', google: { titulos: ['a'], descripciones: ['d', 'e'] } })).some((x) => /al menos 3/.test(x)));
});
t('Ads: solo el CEO aprueba; lanzar va de Aprobada a Lanzada', () => {
  assert.equal(pasoPermitido('Borrador', 'Aprobada'), 'ceo'); assert.equal(pasoPermitido('Aprobada', 'Borrador'), 'ceo');
  assert.equal(pasoPermitido('Aprobada', 'Lanzada'), 'equipo'); assert.equal(pasoPermitido('Borrador', 'Lanzada'), null);
  const tarea = tareaLanzar({ marca: 'NAO', variantes: [limpiarVariante({ plataforma: 'meta', gancho: 'G' })], presupuesto: 'Q3,000', fechas: '', por: 'ceo', en: '2026-10-22T00:00:00Z' });
  assert.match(tarea.title, /NAO: 1 variación aprobada/); assert.match(tarea.description, /GATE 1/); assert.match(tarea.description, /Q3,000/);
});
t('Tech: solo links https, el formulario trae su trampa para bots y la web viva no comparte links internos', () => {
  assert.equal(limpiarSitio({ nombre: 'W', url: 'http://x.com' }).url, ''); assert.equal(limpiarSitio({ nombre: 'W', url: 'https://x.com/a' }).url, 'https://x.com/a');
  const f = formularioLanding('k'.repeat(20), 'https://os.example.com/', 'NAO');
  assert.match(f, /action="https:\/\/os\.example\.com\/api\/intake\/k{20}"/); assert.match(f, /name="_hp"/);
  assert.equal(puntajeDe('Puntaje: 72/100\n…'), 72); assert.equal(puntajeDe('sin puntaje'), null);
  assert.equal(piezaPublica({ title: 'a', url: 'https://drive.google.com/x' }).link, ''); assert.equal(piezaPublica({ title: 'a', url: 'https://www.instagram.com/p/1/' }).link, 'https://www.instagram.com/p/1/');
});
console.log(`\n${ok} pruebas pasaron`);
