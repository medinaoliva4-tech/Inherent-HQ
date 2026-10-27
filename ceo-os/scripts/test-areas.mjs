// Pruebas de las notas de cada área: limpiar lo que se guarda, ordenar (lo importante primero), filtrar, y que la colección y la pantalla estén cableadas.
// npm run test:areas
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AREAS_INFO, areaInfo, TIPOS, TIPO_NOMBRE, TIPO_ICONO, SIN_CLIENTE, LIMITES, limpiarNota, leerNota, notaError, limpiarEtiquetas, linkSeguro, ordenar, filtrar, deArea } from '../public/js/areas-notas.js';
import { WORKSPACES } from '../public/js/herramientas.js';
import { areaDeModo } from '../public/js/areas.js';
import { tieneIco } from '../public/js/iconos.js';
import { COLLS } from '../api/_lib/access.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const leer = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const meta = (u, c = u) => ({ updated_at: u, created_at: c });

t('cinco áreas: las de los workspaces, con su color, su modo del Chat y un ícono que existe', () => {
  assert.deepEqual(AREAS_INFO.map((a) => a.id), ['strategy', 'marketing', 'creative', 'consulting', 'production']);
  assert.deepEqual(AREAS_INFO.map((a) => a.modo), ['estrategia', 'marketing', 'diseno', 'consulting', 'produccion']);
  for (const a of AREAS_INFO) {
    const w = WORKSPACES.find((x) => x.id === a.id);
    assert.ok(w, a.id); assert.equal(a.nombre, w.nombre); assert.equal(a.modo, w.modo); assert.equal(a.color, w.color); assert.equal(a.icono, w.icono);
    assert.ok(a.sub && /^--ui-m-/.test(a.color), a.id);
    assert.ok(tieneIco(a.icono), `ícono ${a.icono}`);
    assert.ok(areaDeModo(a.modo), `el Chat conoce el modo ${a.modo}`);
  }
  assert.equal(areaInfo('production').id, 'production');
  assert.equal(areaInfo('no-existe').id, 'strategy', 'un área que no existe es la primera');
  assert.equal(areaInfo(undefined).id, 'strategy');
  assert.deepEqual(TIPOS, ['nota', 'link', 'archivo', 'decision']);
  for (const x of TIPOS) { assert.ok(TIPO_NOMBRE[x]); assert.ok(tieneIco(TIPO_ICONO[x]), `ícono ${TIPO_ICONO[x]}`); }
});

t('limpiarNota deja solo sus llaves y tira las desconocidas', () => {
  const n = limpiarNota({ area: 'marketing', tipo: 'decision', titulo: ' Pauta de  noviembre ', texto: 'Se pausa hasta el 5.', link: 'https://inherentglobal.com/x', cliente: 'Akai', etiquetas: ['ads', 'nov'], importante: true,
    id: 'x1', v: 4, _meta: { created_by: 'a@b.c' }, costo: 900, margen: 0.4, __proto__: { raro: 1 }, script: '<img onerror=alert(1)>' });
  assert.deepEqual(Object.keys(n).sort(), ['archivado', 'archivo', 'area', 'cliente', 'etiquetas', 'importante', 'link', 'tipo', 'texto', 'titulo'].sort());
  assert.deepEqual(n, { area: 'marketing', tipo: 'decision', titulo: 'Pauta de noviembre', texto: 'Se pausa hasta el 5.', link: 'https://inherentglobal.com/x', archivo: null, cliente: 'akai', etiquetas: ['ads', 'nov'], importante: true, archivado: false });
  assert.deepEqual(limpiarNota(null), limpiarNota({}), 'sin nada, valores seguros');
  assert.deepEqual(limpiarNota(), { area: 'strategy', tipo: 'nota', titulo: '', texto: '', link: '', archivo: null, cliente: '', etiquetas: [], importante: false, archivado: false });
  assert.equal(limpiarNota({ area: 'finanzas' }).area, 'strategy', 'un área que no existe cae en la primera');
  assert.equal(limpiarNota({ tipo: 'borrar' }).tipo, 'nota');
});

t('limpiarNota recorta: título, texto, nombre del archivo y etiquetas', () => {
  const n = limpiarNota({ titulo: 'a'.repeat(300), texto: 'b'.repeat(25000) + '   ', archivo: { url: 'https://drive.google.com/file/d/abc', nombre: 'n'.repeat(500) } });
  assert.equal(n.titulo.length, LIMITES.titulo); assert.equal(n.titulo.length, 120);
  assert.equal(n.texto.length, 20000);
  assert.equal(n.archivo.nombre.length, 120);
  assert.equal(limpiarNota({ titulo: 'uno\ndos\t tres' }).titulo, 'uno dos tres', 'el título es de una línea');
  assert.equal(limpiarNota({ texto: 'a\r\nb\rc' }).texto, 'a\nb\nc', 'el texto conserva sus saltos');
  assert.equal(limpiarNota({ texto: 12 }).texto, '12'); assert.equal(limpiarNota({ titulo: 7 }).titulo, '7');
  assert.deepEqual(limpiarEtiquetas('#Ads, ads , reel;  nov\n  ,'), ['Ads', 'reel', 'nov'], 'sin #, sin repetir, sin vacías');
  assert.equal(limpiarEtiquetas(Array.from({ length: 20 }, (_, i) => 'e' + i)).length, 8);
  assert.equal(limpiarEtiquetas(['x'.repeat(100)])[0].length, 30);
  assert.deepEqual(limpiarEtiquetas(undefined), []); assert.deepEqual(limpiarEtiquetas([null, '', 3]), ['3']);
});

t('solo https: http, javascript:, data: y basura se descartan (link y archivo)', () => {
  assert.equal(limpiarNota({ link: 'https://a.com/x?y=1#z' }).link, 'https://a.com/x?y=1#z');
  for (const mal of ['http://a.com', 'javascript:alert(1)', 'data:text/html,<b>x</b>', 'ftp://a.com', '//a.com', 'a.com', 'https://', 'https://a.com/"onmouseover="x', 'https://a.com/ b', 'https://a.com/<x>', ' ', null, 5]) assert.equal(limpiarNota({ link: mal }).link, '', String(mal));
  assert.equal(limpiarNota({ link: 'https://a.com/' + 'x'.repeat(900) }).link, '', 'una URL larga de más se descarta, no se corta');
  assert.equal(limpiarNota({ link: '  https://a.com  ' }).link, 'https://a.com', 'se recortan los espacios');
  assert.equal(linkSeguro('HTTPS://A.COM/x'), 'HTTPS://A.COM/x');
  assert.deepEqual(limpiarNota({ archivo: { url: 'https://drive.google.com/file/d/abc/view', nombre: 'Brief.pdf', extra: 1 } }).archivo, { url: 'https://drive.google.com/file/d/abc/view', nombre: 'Brief.pdf' });
  assert.equal(limpiarNota({ archivo: { url: 'http://x.com/a.pdf', nombre: 'a' } }).archivo, null, 'archivo con http: no entra');
  assert.equal(limpiarNota({ archivo: { url: 'javascript:1', nombre: 'a' } }).archivo, null);
  assert.equal(limpiarNota({ archivo: 'https://a.com' }).archivo, null, 'tiene que ser { url, nombre }');
  assert.equal(limpiarNota({ archivo: { url: 'https://a.com/f' } }).archivo.nombre, 'Archivo');
});

t('cliente es un slug corto o vacío; importante y archivado solo son verdaderos si lo son', () => {
  assert.equal(limpiarNota({ cliente: ' AKAI ' }).cliente, 'akai');
  assert.equal(limpiarNota({ cliente: 'nao-2' }).cliente, 'nao-2');
  for (const mal of ['../x', 'a b', 'a/b', '<b>', 'x'.repeat(61), '', null, SIN_CLIENTE]) assert.equal(limpiarNota({ cliente: mal }).cliente, '', String(mal)); // el valor del filtro no es un slug de cliente
  assert.equal(limpiarNota({ cliente: 'x'.repeat(60) }).cliente.length, 60);
  assert.equal(limpiarNota({ importante: 'false' }).importante, false); assert.equal(limpiarNota({ importante: 0 }).importante, false); assert.equal(limpiarNota({ importante: 'si' }).importante, false);
  assert.equal(limpiarNota({ importante: true }).importante, true); assert.equal(limpiarNota({ archivado: 'true' }).archivado, true); assert.equal(limpiarNota({ archivado: true }).archivado, true);
});

t('notaError: dice lo que falta, en palabras humanas', () => {
  assert.equal(notaError({ titulo: 'Algo' }), '');
  assert.match(notaError({ titulo: '   ' }), /título/i);
  assert.match(notaError({}), /título/i);
  assert.match(notaError({ titulo: 'x', link: 'http://a.com' }), /https/, 'un link que se descartaría se avisa, no se pierde en silencio');
  assert.match(notaError({ titulo: 'x', tipo: 'link' }), /link/i);
  assert.equal(notaError({ titulo: 'x', tipo: 'link', link: 'https://a.com' }), '');
  assert.match(notaError({ titulo: 'x', tipo: 'archivo' }), /archivo/i);
  assert.equal(notaError({ titulo: 'x', tipo: 'archivo' }, { archivoNuevo: true }), '', 'un archivo por subir cuenta');
  assert.equal(notaError({ titulo: 'x', tipo: 'archivo', archivo: { url: 'https://a.com/f', nombre: 'f' } }), '');
  assert.equal(notaError({ titulo: 'x', tipo: 'archivo', link: 'https://drive.google.com/f' }), '', 'o su link');
});

t('leerNota: limpia y conserva id, v y _meta', () => {
  const d = { id: 'abc', v: 3, _meta: meta('2026-10-02T10:00:00Z'), area: 'creative', titulo: 'Paleta', link: 'javascript:1', otra: 1 };
  const n = leerNota(d);
  assert.equal(n.id, 'abc'); assert.equal(n.v, 3); assert.deepEqual(n._meta, d._meta);
  assert.equal(n.link, ''); assert.equal(n.area, 'creative'); assert.ok(!('otra' in n));
  assert.deepEqual(n.etiquetas, []); assert.equal(n.texto, '');
});

const N = (id, o = {}) => ({ id, v: 1, area: 'strategy', tipo: 'nota', titulo: id, texto: '', link: '', archivo: null, cliente: '', etiquetas: [], importante: false, archivado: false, _meta: meta('2026-10-01T10:00:00Z'), ...o });

t('ordenar: las importantes primero y, dentro de cada grupo, la más reciente arriba', () => {
  const l = [N('vieja', { _meta: meta('2026-09-01T10:00:00Z') }), N('imp-vieja', { importante: true, _meta: meta('2026-08-01T10:00:00Z') }), N('nueva', { _meta: meta('2026-10-20T10:00:00Z') }), N('imp-nueva', { importante: true, _meta: meta('2026-10-05T10:00:00Z') }), N('media', { _meta: meta('2026-10-01T10:00:00Z') })];
  assert.deepEqual(ordenar(l).map((n) => n.id), ['imp-nueva', 'imp-vieja', 'nueva', 'media', 'vieja']);
  assert.deepEqual(l.map((n) => n.id), ['vieja', 'imp-vieja', 'nueva', 'imp-nueva', 'media'], 'no cambia la lista original');
  assert.deepEqual(ordenar([N('a', { _meta: undefined }), N('b', { _meta: meta('2026-10-01T10:00:00Z') })]).map((n) => n.id), ['b', 'a'], 'sin fecha, al final');
  assert.deepEqual(ordenar([N('a', { _meta: { created_at: '2026-10-09T10:00:00Z' } }), N('b', { _meta: meta('2026-10-01T10:00:00Z') })]).map((n) => n.id), ['a', 'b'], 'sin updated_at usa created_at');
  assert.deepEqual(ordenar(null), []); assert.deepEqual(ordenar([]), []);
});

t('filtrar: por texto (sin acentos ni mayúsculas, todas las palabras), cliente y tipo', () => {
  const l = [
    N('a', { titulo: 'Posicionamiento de Akai', texto: 'La oferta es el **2x1**', cliente: 'akai', etiquetas: ['oferta'] }),
    N('b', { titulo: 'Reel de lanzamiento', tipo: 'link', link: 'https://instagram.com/p/xyz', cliente: 'nao' }),
    N('c', { titulo: 'Decisión: sin Halloween', tipo: 'decision', texto: 'Ni en el calendario', cliente: 'akai' }),
    N('d', { titulo: 'Brief de marca', tipo: 'archivo', archivo: { url: 'https://drive.google.com/f', nombre: 'Guía-Tipográfica.pdf' } }),
  ];
  const ids = (x) => x.map((n) => n.id);
  assert.deepEqual(ids(filtrar(l, {})), ['a', 'b', 'c', 'd']); assert.deepEqual(ids(filtrar(l)), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids(filtrar(l, { q: 'DECISION' })), ['c'], 'sin acentos ni mayúsculas');
  assert.deepEqual(ids(filtrar(l, { q: 'decisión' })), ['c']);
  assert.deepEqual(ids(filtrar(l, { q: 'oferta 2x1' })), ['a'], 'todas las palabras, en cualquier campo');
  assert.deepEqual(ids(filtrar(l, { q: 'oferta halloween' })), [], 'si falta una palabra, no entra');
  assert.deepEqual(ids(filtrar(l, { q: 'instagram' })), ['b'], 'busca en el link');
  assert.deepEqual(ids(filtrar(l, { q: 'tipografica' })), ['d'], 'busca en el nombre del archivo');
  assert.deepEqual(ids(filtrar(l, { cliente: 'akai' })), ['a', 'c']);
  assert.deepEqual(ids(filtrar(l, { cliente: SIN_CLIENTE })), ['d'], 'las que no son de ningún cliente');
  assert.deepEqual(ids(filtrar(l, { tipo: 'decision' })), ['c']);
  assert.deepEqual(ids(filtrar(l, { cliente: 'akai', tipo: 'nota' })), ['a']);
  assert.deepEqual(ids(filtrar(l, { q: 'akai', cliente: 'nao' })), [], 'los tres filtros se suman');
  assert.deepEqual(ids(filtrar(l, { q: '   ' })), ['a', 'b', 'c', 'd'], 'espacios no filtran');
  assert.deepEqual(filtrar(null, { q: 'x' }), []);
});

t('deArea: las activas, las archivadas y todas, de un área', () => {
  const l = [N('s1'), N('s2', { archivado: true }), N('m1', { area: 'marketing' }), N('m2', { area: 'marketing', archivado: true }), N('s3', { importante: true })];
  assert.deepEqual(deArea(l, 'strategy').map((n) => n.id), ['s1', 's3']);
  assert.deepEqual(deArea(l, 'strategy', { archivadas: true }).map((n) => n.id), ['s2']);
  assert.deepEqual(deArea(l, 'marketing', { archivadas: 'todas' }).map((n) => n.id), ['m1', 'm2']);
  assert.deepEqual(deArea(l, 'creative'), []); assert.deepEqual(deArea(undefined, 'strategy'), []);
});

t('la colección area_notes es de Library (la ve todo el equipo) y va por /api/db', () => {
  assert.equal(COLLS.area_notes, 'library');
  const idx = leer('../api/index.js');
  assert.ok(!/coll === 'area_notes'/.test(idx), 'collGuard no la bloquea: pasa por /api/db con su v y su audit');
  const acc = leer('../api/_lib/access.js');
  assert.match(acc, /area_notes: 'library'/); assert.match(acc, /Áreas: la información que cada área guarda/);
});

t('la pantalla: render y esqueleto, guarda con col(), nunca borra y no arma HTML con texto de la gente', () => {
  const s = leer('../public/js/screens/areas.js');
  assert.match(s, /export async function render\(el, \{ me, sub, alive \}\)/);
  assert.match(s, /export const esqueleto = /);
  assert.match(s, /col\('area_notes'\)/);
  assert.match(s, /abrirEnChat\(me\.email, \{ modo: area\.modo/);
  assert.match(s, /Alguien la cambió justo ahora\. Recarga/);
  assert.match(s, /e\?\.status === 409/);
  assert.match(s, /confirmAsk\(/); assert.match(s, /uploadToDrive\(/); assert.match(s, /\bmd\(n\.texto\)/);
  assert.ok(!/\bC\.remove\b|\.remove\(n\.id|col\('area_notes'\)\.remove/.test(s), 'nada se borra: se archiva');
  assert.ok(!/\braw\(\s*(n|notas?|r|datos|v)\b/.test(s), 'raw() nunca con datos de la gente');
  assert.ok(!/innerHTML/.test(s), 'siempre html`` y mount()');
  assert.ok(!/localStorage/.test(s), 'el filtro no se guarda: nada que pueda fallar');
});

console.log(`\n${ok} pruebas de las áreas pasaron`);
