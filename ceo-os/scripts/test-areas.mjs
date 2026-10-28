// Pruebas de las notas de cada área: limpiar lo que se guarda (con fecha y estado), ordenar (lo importante primero), filtrar,
// verlas por estado / por día / lo que viene, y que la colección y la pantalla estén cableadas.
// npm run test:areas
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AREAS_INFO, areaInfo, TIPOS, TIPO_NOMBRE, TIPO_ICONO, SIN_CLIENTE, LIMITES, limpiarNota, leerNota, notaError, limpiarEtiquetas, linkSeguro, ordenar, filtrar, deArea,
  ESTADOS, SIN_ESTADO, VISTAS, VISTA_NOMBRE, VISTA_ICONO, vistaOk, DIAS_PROXIMO, fechaLimpia, fechaHoy, sumarDias, diasHasta, mesOk, mesDe, moverMes, grillaMes, porEstado, porDia, proximas, vencida } from '../public/js/areas-notas.js';
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
  const n = limpiarNota({ area: 'marketing', tipo: 'decision', titulo: ' Pauta de  noviembre ', texto: 'Se pausa hasta el 5.', link: 'https://inherentglobal.com/x', cliente: 'Akai', etiquetas: ['ads', 'nov'], importante: true, fecha: ' 2026-11-05 ', estado: 'En curso',
    id: 'x1', v: 4, _meta: { created_by: 'a@b.c' }, costo: 900, margen: 0.4, __proto__: { raro: 1 }, script: '<img onerror=alert(1)>' });
  assert.deepEqual(Object.keys(n).sort(), ['archivado', 'archivo', 'area', 'cliente', 'estado', 'etiquetas', 'fecha', 'importante', 'link', 'tipo', 'texto', 'titulo'].sort());
  assert.deepEqual(n, { area: 'marketing', tipo: 'decision', titulo: 'Pauta de noviembre', texto: 'Se pausa hasta el 5.', link: 'https://inherentglobal.com/x', archivo: null, cliente: 'akai', fecha: '2026-11-05', estado: 'En curso', etiquetas: ['ads', 'nov'], importante: true, archivado: false });
  assert.deepEqual(limpiarNota(null), limpiarNota({}), 'sin nada, valores seguros');
  assert.deepEqual(limpiarNota(), { area: 'strategy', tipo: 'nota', titulo: '', texto: '', link: '', archivo: null, cliente: '', fecha: '', estado: '', etiquetas: [], importante: false, archivado: false });
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

const N = (id, o = {}) => ({ id, v: 1, area: 'strategy', tipo: 'nota', titulo: id, texto: '', link: '', archivo: null, cliente: '', fecha: '', estado: '', etiquetas: [], importante: false, archivado: false, _meta: meta('2026-10-01T10:00:00Z'), ...o });

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

t('fecha: solo un día que existe (AAAA-MM-DD); lo demás queda vacío', () => {
  assert.equal(limpiarNota({ fecha: '2026-10-30' }).fecha, '2026-10-30');
  assert.equal(limpiarNota({ fecha: '  2026-10-30  ' }).fecha, '2026-10-30', 'se recortan los espacios');
  assert.equal(limpiarNota({ fecha: '2028-02-29' }).fecha, '2028-02-29', 'un 29 de febrero que sí existe');
  for (const mal of ['2026-02-30', '2026-13-01', '2026-00-10', '2026-10-32', '2027-02-29', '2026-1-5', '26-10-30', '30/10/2026', 'mañana', '2026-10-30T10:00:00Z', '2026-10-30 10:00', '', '   ', null, undefined, 20261030, {}, []]) assert.equal(limpiarNota({ fecha: mal }).fecha, '', String(mal));
  assert.equal(fechaLimpia('2026-10-30'), '2026-10-30'); assert.equal(fechaLimpia('basura'), '');
  assert.equal(limpiarNota({}).fecha, '', 'una nota de antes (sin fecha) sigue valiendo');
  assert.equal(leerNota({ id: 'a', v: 1, fecha: '2026-10-30' }).fecha, '2026-10-30'); assert.equal(leerNota({ id: 'a', v: 1, fecha: '2026-99-99' }).fecha, '');
  assert.match(notaError({ titulo: 'x', fecha: '30/10/2026' }), /fecha/i, 'una fecha que se descartaría se avisa, no se pierde en silencio');
  assert.equal(notaError({ titulo: 'x', fecha: '2026-10-30' }), ''); assert.equal(notaError({ titulo: 'x', fecha: '' }), ''); assert.equal(notaError({ titulo: 'x' }), '');
});

t('estado: Por hacer · En curso · Hecho, o vacío', () => {
  assert.deepEqual(ESTADOS, ['Por hacer', 'En curso', 'Hecho']);
  for (const e of ESTADOS) assert.equal(limpiarNota({ estado: e }).estado, e);
  for (const mal of ['hecho', 'HECHO', 'Pendiente', 'Sin estado', ' En curso', 'Por hacer ', '', null, undefined, 1, true, {}, ['Hecho']]) assert.equal(limpiarNota({ estado: mal }).estado, '', String(mal));
  assert.equal(limpiarNota({}).estado, '', 'por defecto, sin estado');
  assert.equal(leerNota({ id: 'a', v: 2, estado: 'Hecho' }).estado, 'Hecho'); assert.equal(leerNota({ id: 'a', v: 2, estado: 'Ya casi' }).estado, '');
  // mover una tarjeta de columna es limpiarNota({ ...n, estado }): no pierde nada de lo demás
  const n = leerNota({ id: 'z', v: 5, area: 'creative', titulo: 'Paleta', cliente: 'akai', fecha: '2026-11-02', importante: true, estado: 'Por hacer' });
  assert.deepEqual(limpiarNota({ ...n, estado: 'Hecho' }), { ...limpiarNota(n), estado: 'Hecho' });
  assert.equal(limpiarNota({ ...n, estado: '' }).fecha, '2026-11-02', 'quitar el estado no quita la fecha');
});

t('las tres vistas: lista, tablero y calendario (y una desconocida cae en la lista)', () => {
  assert.deepEqual(VISTAS, ['lista', 'tablero', 'calendario']);
  for (const v of VISTAS) { assert.ok(VISTA_NOMBRE[v]); assert.ok(tieneIco(VISTA_ICONO[v]), `ícono ${VISTA_ICONO[v]}`); assert.equal(vistaOk(v), v); }
  for (const mal of ['', null, undefined, 'Tablero', 'kanban', 3]) assert.equal(vistaOk(mal), 'lista', String(mal));
});

t('fechas y meses: sumar días, días hasta, mover mes, hoy en la hora local', () => {
  assert.equal(sumarDias('2026-10-27', 14), '2026-11-10'); assert.equal(sumarDias('2026-12-25', 10), '2027-01-04'); assert.equal(sumarDias('2026-03-01', -1), '2026-02-28'); assert.equal(sumarDias('2028-02-28', 1), '2028-02-29');
  assert.equal(sumarDias('2026-10-27', 0), '2026-10-27'); assert.equal(sumarDias('basura', 3), '');
  assert.equal(diasHasta('2026-10-27', '2026-10-27'), 0); assert.equal(diasHasta('2026-10-28', '2026-10-27'), 1); assert.equal(diasHasta('2026-10-20', '2026-10-27'), -7); assert.equal(diasHasta('x', '2026-10-27'), null); assert.equal(diasHasta('2026-10-27', ''), null);
  assert.equal(mesOk('2026-10'), true); for (const mal of ['2026-13', '2026-00', '2026-1', '2026-10-01', '', null, 'octubre']) assert.equal(mesOk(mal), false, String(mal));
  assert.equal(mesDe('2026-10-27'), '2026-10'); assert.equal(mesDe('mal'), '');
  assert.equal(moverMes('2026-10', 1), '2026-11'); assert.equal(moverMes('2026-12', 1), '2027-01'); assert.equal(moverMes('2026-01', -1), '2025-12'); assert.equal(moverMes('2026-10', 0), '2026-10'); assert.equal(moverMes('2026-10', 14), '2027-12'); assert.equal(moverMes('mal', 1), '');
  assert.equal(fechaHoy(new Date(2026, 9, 27, 23, 59)), '2026-10-27', 'a las 11:59 pm de la compu sigue siendo hoy (no el día de UTC)'); assert.equal(fechaHoy(new Date(2026, 0, 5, 0, 1)), '2026-01-05');
  assert.match(fechaHoy(), /^\d{4}-\d{2}-\d{2}$/); assert.equal(fechaLimpia(fechaHoy()), fechaHoy());
});

t('grillaMes: semanas de lunes a domingo, con los días de al lado para completar', () => {
  const oct = grillaMes('2026-10'); // el 1 de octubre de 2026 es jueves
  assert.equal(oct.length, 5); assert.ok(oct.every((w) => w.length === 7));
  assert.equal(oct[0][0], '2026-09-28'); assert.equal(oct[0][3], '2026-10-01'); assert.equal(oct[4][6], '2026-11-01');
  assert.equal(oct.flat().filter((d) => d.startsWith('2026-10-')).length, 31, 'están los 31 días, una sola vez');
  for (const [mes, semanas] of [['2026-02', 5], ['2027-02', 4], ['2026-11', 6], ['2026-08', 6], ['2026-06', 5]]) {
    const g = grillaMes(mes), dias = g.flat();
    assert.equal(g.length, semanas, mes); assert.equal(new Date(`${dias[0]}T12:00:00Z`).getUTCDay(), 1, `${mes} empieza en lunes`);
    assert.ok(dias.every((d, i) => i === 0 || d === sumarDias(dias[i - 1], 1)), `${mes} sin saltos`);
    assert.equal(dias.filter((d) => d.startsWith(`${mes}-`)).length, Math.round(diasHasta(`${moverMes(mes, 1)}-01`, `${mes}-01`)));
  }
  assert.deepEqual(grillaMes('basura'), []); assert.deepEqual(grillaMes(''), []);
});

t('porEstado: las columnas del tablero (Por hacer, En curso, Hecho y Sin estado), en el orden en que llegan', () => {
  const l = [N('a', { estado: 'Hecho' }), N('b'), N('c', { estado: 'Por hacer' }), N('d', { estado: 'En curso' }), N('e', { estado: 'Por hacer' }), N('f', { estado: 'raro' })];
  const g = porEstado(l);
  assert.deepEqual(Object.keys(g), ['Por hacer', 'En curso', 'Hecho', 'Sin estado']); assert.equal(SIN_ESTADO, 'Sin estado');
  assert.deepEqual(g['Por hacer'].map((n) => n.id), ['c', 'e']); assert.deepEqual(g['En curso'].map((n) => n.id), ['d']); assert.deepEqual(g.Hecho.map((n) => n.id), ['a']);
  assert.deepEqual(g['Sin estado'].map((n) => n.id), ['b', 'f'], 'sin estado o con uno desconocido: va a Sin estado');
  assert.equal(Object.values(g).flat().length, l.length, 'ninguna se pierde ni se repite');
  assert.deepEqual(porEstado([]), { 'Por hacer': [], 'En curso': [], Hecho: [], 'Sin estado': [] });
  assert.deepEqual(porEstado(null), { 'Por hacer': [], 'En curso': [], Hecho: [], 'Sin estado': [] }); assert.deepEqual(porEstado(undefined)['Sin estado'], []);
  assert.deepEqual(porEstado([null, undefined, N('x')])['Sin estado'].map((n) => n.id), ['x'], 'ignora lo que no es una nota');
});

t('porDia: las notas con fecha de un mes, por día', () => {
  const l = [N('a', { fecha: '2026-10-05' }), N('b', { fecha: '2026-10-05', estado: 'Hecho' }), N('c', { fecha: '2026-10-31' }), N('d', { fecha: '2026-11-01' }), N('e', { fecha: '2026-09-30' }), N('f'), N('g', { fecha: '2025-10-05' }), N('h', { fecha: '2026-10-1' })];
  const d = porDia(l, '2026-10');
  assert.deepEqual(Object.keys(d).sort(), ['2026-10-05', '2026-10-31']);
  assert.deepEqual(d['2026-10-05'].map((n) => n.id), ['a', 'b'], 'en el orden en que llegan (también las Hechas: siguen en su día)'); assert.deepEqual(d['2026-10-31'].map((n) => n.id), ['c']);
  assert.deepEqual(porDia(l, '2026-11'), { '2026-11-01': [l[3]] }); assert.deepEqual(porDia(l, '2026-12'), {});
  assert.deepEqual(porDia(l, 'octubre'), {}); assert.deepEqual(porDia(l, undefined), {}); assert.deepEqual(porDia(null, '2026-10'), {}); assert.deepEqual(porDia([], '2026-10'), {});
});

t('proximas: lo que vence de hoy a 14 días, sin lo Hecho ni lo de fuera de rango', () => {
  const hoy = '2026-10-27', l = [
    N('hoy', { fecha: '2026-10-27' }), N('manana', { fecha: '2026-10-28', estado: 'Por hacer' }), N('limite', { fecha: '2026-11-10', estado: 'En curso' }),
    N('despues', { fecha: '2026-11-11' }), N('ayer', { fecha: '2026-10-26' }), N('hecha', { fecha: '2026-10-29', estado: 'Hecho' }),
    N('sin-fecha'), N('mal', { fecha: 'pronto' }), N('archivada', { fecha: '2026-10-30', archivado: true }), N('lejos', { fecha: '2027-03-01' }),
  ];
  assert.equal(DIAS_PROXIMO, 14);
  assert.deepEqual(proximas(l, hoy).map((n) => n.id), ['hoy', 'manana', 'limite'], 'incluye hoy y el día 14; excluye ayer, el día 15, Hecho, archivadas y sin fecha');
  assert.deepEqual(proximas(l, hoy, 14).map((n) => n.id), proximas(l, hoy).map((n) => n.id), '14 es lo normal');
  assert.deepEqual(proximas(l, hoy, 1).map((n) => n.id), ['hoy', 'manana']);
  assert.deepEqual(proximas(l, hoy, 0).map((n) => n.id), ['hoy']);
  assert.deepEqual(proximas(l, hoy, 400).map((n) => n.id), ['hoy', 'manana', 'limite', 'despues', 'lejos']);
  assert.deepEqual(proximas(l, '2026-10-26', 1).map((n) => n.id), ['ayer', 'hoy']);
  // ordenadas: la fecha más cercana primero; a igual día, la importante; a igual todo, como llegan
  const o = [N('c', { fecha: '2026-11-03' }), N('a', { fecha: '2026-10-28' }), N('b2', { fecha: '2026-10-30' }), N('b1', { fecha: '2026-10-30', importante: true }), N('b3', { fecha: '2026-10-30' })];
  assert.deepEqual(proximas(o, hoy).map((n) => n.id), ['a', 'b1', 'b2', 'b3', 'c']);
  assert.deepEqual(o.map((n) => n.id), ['c', 'a', 'b2', 'b1', 'b3'], 'no cambia la lista original');
  for (const mal of ['', 'hoy', null, undefined, '2026-02-30']) assert.deepEqual(proximas(l, mal), [], String(mal));
  assert.deepEqual(proximas(null, hoy), []); assert.deepEqual(proximas([], hoy), []);
  assert.deepEqual(proximas(l, hoy, 'x').map((n) => n.id), ['hoy', 'manana', 'limite'], 'días que no son un número: los de siempre');
  assert.deepEqual(proximas(l, hoy, -3).map((n) => n.id), ['hoy', 'manana', 'limite']);
});

t('vencida: ya pasó su fecha y no está Hecha', () => {
  assert.equal(vencida(N('a', { fecha: '2026-10-26' }), '2026-10-27'), true);
  assert.equal(vencida(N('a', { fecha: '2026-10-27' }), '2026-10-27'), false, 'hoy todavía no está vencida');
  assert.equal(vencida(N('a', { fecha: '2026-10-28' }), '2026-10-27'), false);
  assert.equal(vencida(N('a', { fecha: '2026-10-01', estado: 'Hecho' }), '2026-10-27'), false, 'lo Hecho no vence');
  assert.equal(vencida(N('a'), '2026-10-27'), false, 'sin fecha no vence'); assert.equal(vencida(N('a', { fecha: '2026-10-01' }), ''), false); assert.equal(vencida(null, '2026-10-27'), false);
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
  // la vista se recuerda por persona y, si el navegador no deja guardar, la pantalla sigue igual
  assert.match(s, /os\.areas\.vista\.\$\{String\(me\.email/); assert.match(s, /try \{ return vistaOk\(localStorage\.getItem\(llave\)\); \} catch/); assert.match(s, /try \{ localStorage\.setItem\(llave, v\); \} catch/);
  assert.equal((s.match(/localStorage/g) || []).length, 2, 'solo para recordar la vista');
});

t('la pantalla: Lista · Tablero · Calendario, Próximo, estado con la v y arrastrar solo en la compu', () => {
  const s = leer('../public/js/screens/areas.js');
  assert.match(s, /data-act="vista" data-vista="\$\{v\}"/); assert.match(s, /VISTAS\.map\(/);
  assert.match(s, /proximas\(vis, h\)/); assert.match(s, /Próximo/); assert.match(s, /lo que vence en \$\{DIAS_PROXIMO\} días/);
  assert.match(s, /porEstado\(vis\)/); assert.match(s, /porDia\(vis, mes\)/); assert.match(s, /grillaMes\(mes\)/);
  assert.match(s, /data-act="mes-ant"/); assert.match(s, /data-act="mes-sig"/); assert.match(s, /data-act="mes-hoy"/); assert.match(s, />Hoy</); assert.match(s, /Sin fecha/);
  assert.match(s, /class="in ar-est-sel/); assert.match(s, /classList\?\.contains\('ar-est-sel'\)/);
  assert.match(s, /cambiar\(n, \{ estado \}/, 'el estado se guarda como cualquier cambio: con la v de la nota');
  assert.match(s, /type: 'date'|t: 'date'/); assert.match(s, /k: 'estado'/); assert.match(s, /fecha: r\.fecha, estado: r\.estado/);
  assert.match(s, /matchMedia\('\(hover: hover\) and \(pointer: fine\)'\)/, 'arrastrar solo con ratón; en el cel, el selector');
  for (const ev of ['dragstart', 'dragover', 'dragleave', 'drop', 'dragend']) assert.match(s, new RegExp(`addEventListener\\('${ev}'`), ev);
  assert.match(s, /draggable="true"/); assert.match(s, /if \(dnd\) \{/);
  assert.match(s, /\.ar-col\[data-estado\]/); assert.ok(!/data-estado="\$\{e\}"/.test(s), 'la columna Sin estado guarda un estado vacío, no su nombre');
  assert.match(s, /Importante/); assert.ok(/secImportante\(pins\)/.test(s), 'Importante se pinta arriba en las tres vistas');
  assert.ok(!/\.remove\(n\.id|C\.remove|\.delete\(/.test(s), 'nada se borra');
});

console.log(`\n${ok} pruebas de las áreas pasaron`);
