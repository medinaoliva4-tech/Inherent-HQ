// Pruebas de visual.js (los helpers de «información fácil de digerir»): anillo, barra, proporción, sparkline, cuenta regresiva,
// grupos por fecha, monogramas, cuadritos, estados vacíos y números. Todo puro (sin navegador). También que las pantallas lo usen
// bien (sin handlers ni scripts en línea, sin 0 falsos) y que nada raro pueda colarse por una etiqueta o un color.
// npm run test:visual
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { anillo, barra, proporcion, leyenda, sparkline, cuenta, cuentaChip, GRUPOS, GRUPO_ETIQUETA, semanaDe, grupoRelativo, agruparPorFecha,
  resumenEventos, TONOS, iniciales, tonoDe, monograma, monogramas, punto, estado, cuadrito, vacio, formatear, numero, contarNumeros, recuerda, recordar } from '../public/js/visual.js';
import { tieneIco } from '../public/js/iconos.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const S = (x) => String(x);
const leer = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const HOY = '2026-10-27'; // martes

t('el día de prueba es martes (los grupos de la semana cuentan desde el lunes)', () => {
  assert.equal(new Date(`${HOY}T12:00:00Z`).getUTCDay(), 2);
});

// ---------- anillo ----------
t('anillo: sin dato es un anillo vacío punteado, nunca un 0 falso', () => {
  for (const v of [null, undefined, '', 'abc', NaN, true]) {
    const s = S(anillo(v));
    assert.match(s, /data-vacio="1"/, String(v)); assert.match(s, /stroke-dasharray="2 4"/); assert.match(s, /aria-label="Sin dato"/);
    assert.ok(!/vz-ring-fg|vz-ring-n|NaN|undefined/.test(s), String(v));
  }
  assert.match(S(anillo(null, { label: 'Aún sin entregas' })), /aria-label="Aún sin entregas"/);
});
t('anillo: el avance es longitud (dasharray = 2πr, dashoffset = 2πr·(1−p)), empieza arriba y sin 0 pintado', () => {
  const s = S(anillo(25, { tam: 28, grosor: 3.5 }));
  const r = (28 - 3.5) / 2, circ = +(2 * Math.PI * r).toFixed(2);
  assert.match(s, new RegExp(`stroke-dasharray="${circ}"`));
  assert.match(s, new RegExp(`stroke-dashoffset="${+(circ * 0.75).toFixed(2)}"`));
  assert.match(s, /transform="rotate\(-90 14 14\)"/); assert.match(s, /stroke-linecap="round"/);
  assert.match(s, /aria-label="25%"/); assert.match(s, /role="img"/);
  assert.ok(!/vz-ring-n/.test(s), 'en 28 px no lleva número (el ícono o nada)');
  assert.ok(!/vz-ring-fg/.test(S(anillo(0))), 'con 0 solo el fondo: un trazo redondo de largo 0 dibuja un puntito');
  assert.match(S(anillo(0)), /vz-ring-bg/); assert.match(S(anillo(0)), /aria-label="0%"/);
  assert.match(S(anillo(100)), /stroke-dashoffset="0"/);
  assert.match(S(anillo(250)), /aria-label="100%"/); assert.match(S(anillo(-5)), /aria-label="0%"/);
  assert.match(S(anillo('62')), /aria-label="62%"/);
});
t('anillo: el número al centro solo en los grandes; el color es un token y todo lo dicho se escapa', () => {
  const g = S(anillo(62, { tam: 56 }));
  assert.match(g, /vz-ring-n[^>]*>62%</); assert.match(S(anillo(62, { tam: 44 })), /vz-ring-n[^>]*>62%</); assert.match(S(anillo(62, { tam: 40 })), /vz-ring-n[^>]*>62</);
  assert.match(S(anillo(62, { tam: 28, num: true })), /vz-ring-n[^>]*>62</);
  assert.match(S(anillo(62, { color: 'var(--ui-m-marketing)' })), /--vz-col:var\(--ui-m-marketing\)/);
  assert.match(S(anillo(62, { color: 'red;background:url(x)' })), /--vz-col:var\(--ui-acc\)/, 'un color raro cae al acento');
  const x = S(anillo(10, { label: '<img src=x onerror=alert(1)>' }));
  assert.ok(!/<img/.test(x)); assert.match(x, /&lt;img/);
  assert.ok(!/NaN|undefined|null/.test(g));
});

// ---------- barra ----------
t('barra: sin dato no pinta nada (quien llama pone «define tu meta»); con dato es un progressbar', () => {
  for (const v of [null, undefined, '', 'x']) assert.equal(S(barra(v)), '');
  const s = S(barra(62.4, 'var(--ui-m-creative)'));
  assert.match(s, /role="progressbar"/); assert.match(s, /aria-valuenow="62"/); assert.match(s, /--vz-w:62.4%/); assert.match(s, /--vz-col:var\(--ui-m-creative\)/);
  assert.ok(!/vz-bar-m/.test(s) && !/is-bajo|is-meta/.test(s), 'sin meta no hay rayita');
});
t('barra: la rayita es la meta o el ritmo; por debajo, ámbar (is-bajo); al llegar, verde (is-meta)', () => {
  const bajo = S(barra(40, { marca: 60, label: 'Ingresos', marcaLabel: 'Ritmo del mes' }));
  assert.match(bajo, /is-bajo/); assert.match(bajo, /--vz-m:60%/); assert.match(bajo, /vz-bar-m/); assert.match(bajo, /aria-label="Ingresos"/); assert.match(bajo, /title="Ritmo del mes"/);
  assert.ok(!/is-bajo/.test(S(barra(70, { marca: 60 }))), 'al ritmo o por encima no se pinta ámbar');
  assert.match(S(barra(100, { marca: 80 })), /is-meta/); assert.match(S(barra(180)), /aria-valuenow="100"/);
});

// ---------- proporción ----------
t('proporción: cada segmento crece por su valor, lo que vale 0 no se pinta y sin nada devuelve vacío', () => {
  assert.equal(S(proporcion([])), ''); assert.equal(S(proporcion(null)), '');
  assert.equal(S(proporcion([{ valor: 0, label: 'a' }, { valor: null, label: 'b' }, { valor: 'x', label: 'c' }, { valor: -3, label: 'd' }])), '');
  const s = S(proporcion([{ valor: 5, color: 'var(--ui-bad)', label: 'Vencidas' }, { valor: 0, label: 'Nada' }, { valor: 3, color: 'var(--ui-acc)', label: 'En plazo' }]));
  assert.equal((s.match(/class="vz-seg/g) || []).length, 2);
  assert.match(s, /flex-grow:5;--i:0;--seg:var\(--ui-bad\)/); assert.match(s, /flex-grow:3;--i:1;--seg:var\(--ui-acc\)/);
  assert.match(s, /role="img" aria-label="Vencidas 5, En plazo 3"/);
  assert.match(s, /vz-ley-t">Vencidas</); assert.match(s, /vz-ley-n">5</); assert.ok(!/Nada/.test(s));
  assert.ok(!/vz-ley/.test(S(proporcion([{ valor: 1, label: 'a' }], { leyenda: false }))));
  assert.match(S(proporcion([{ valor: 1, label: 'a' }], { label: 'Resumen' })), /aria-label="Resumen"/);
  assert.equal(S(proporcion([{ valor: 4, label: 'a' }, { valor: 0, label: 'b' }], { minimo: 2 })), '', 'con un solo segmento no hay nada que comparar');
  assert.match(S(proporcion([{ valor: 4, label: 'a' }, { valor: 1, label: 'b' }], { minimo: 2 })), /vz-prop-bar/);
});
t('proporción: la leyenda es clicable solo con data-* y aria-pressed; todo se escapa; los colores raros caen al acento', () => {
  const s = S(proporcion([{ valor: 2, label: '<b>x</b>', color: 'var(--ui-info)', clase: 't-entregas is-off" onclick="alert(1)', attrs: { 'data-act': 'ctipo', 'data-t': 'entregas"><script>', 'aria-pressed': 'false', onclick: 'alert(1)', style: 'x' } }]));
  assert.ok(!/<script|<b>|onclick=|style="x/.test(s), s);
  assert.match(s, /<button type="button" class="vz-ley-i /); assert.match(s, /data-act="ctipo"/); assert.match(s, /aria-pressed="false"/); assert.match(s, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.match(S(proporcion([{ valor: 1, label: 'a', color: 'url(javascript:1)' }])), /--seg:var\(--ui-acc\)/);
  assert.match(S(proporcion([{ valor: 1, label: 'a' }])), /<span class="vz-ley-i"/, 'sin attrs, la entrada no es un botón');
});
t('proporción: un segmento puede subdividirse (las notas por área) y la leyenda sale sola', () => {
  const s = S(proporcion([{ valor: 3, label: 'Entregas', color: 'var(--ui-acc)' }, { valor: 3, label: 'Notas', clase: 't-areas', partes: [{ valor: 2, label: 'Strategy', color: 'var(--ui-m-strategy)' }, { valor: 1, label: 'Marketing', color: 'var(--ui-m-marketing)' }] }]));
  assert.match(s, /vz-seg vz-seg--grupo t-areas/); assert.match(s, /<i style="flex-grow:2;--seg:var\(--ui-m-strategy\)" title="Strategy: 2"><\/i>/);
  assert.equal((S(leyenda([{ valor: 2, label: 'a' }, { valor: 0, label: 'b' }])).match(/<li>/g) || []).length, 1);
  assert.equal(S(leyenda([])), '');
});

// ---------- resumen de eventos ----------
t('resumenEventos: cuenta por tipo en el rango, sin los hitos y sin repetir un evento de varios días', () => {
  const evs = [
    { k: 'g1-2026-10-27', tipo: 'reuniones', date: '2026-10-27' }, { k: 'g1-2026-10-28', tipo: 'reuniones', date: '2026-10-28' }, { k: 'g1-2026-10-29', tipo: 'reuniones', date: '2026-10-29' },
    { k: 'g2-2026-10-28', tipo: 'reuniones', date: '2026-10-28' }, { k: 't-1', tipo: 'entregas', date: '2026-10-27' }, { k: 't-2', tipo: 'entregas', date: '2026-10-30' },
    { k: 'a-n1', tipo: 'areas', date: '2026-10-28', area: 'marketing' }, { k: 'a-n2', tipo: 'areas', date: '2026-10-29', area: 'marketing' }, { k: 'a-n3', tipo: 'areas', date: '2026-10-29', area: 'strategy' },
    { k: 'c-1', tipo: 'ciclo', date: '2026-10-28' }, { k: 't-3', tipo: 'entregas', date: '2026-11-09' }, { k: 'x', tipo: 'ventas', date: 'mal' }, null, { k: 'y', date: '2026-10-28' },
  ];
  const r = resumenEventos(evs, { from: '2026-10-26', to: '2026-11-01' });
  assert.deepEqual(r.porTipo, { reuniones: 2, entregas: 2, areas: 3 }); assert.equal(r.total, 7);
  assert.deepEqual(r.porArea, { marketing: 2, strategy: 1 });
  assert.equal(resumenEventos(evs, { from: '2026-10-26', to: '2026-11-30' }).porTipo.entregas, 3);
  assert.equal(resumenEventos(evs).porTipo.ciclo, undefined, 'el ciclo no es trabajo');
  assert.equal(resumenEventos(evs, { excluir: [] }).porTipo.ciclo, 1);
  assert.deepEqual(resumenEventos(null), { total: 0, porTipo: {}, porArea: {} }); assert.deepEqual(resumenEventos([], { from: '2026-10-26' }), { total: 0, porTipo: {}, porArea: {} });
});

// ---------- sparkline ----------
t('sparkline: con menos de 3 puntos no se dibuja; sin números válidos, tampoco', () => {
  for (const v of [undefined, null, [], [1], [1, 2], [1, null, 'x', NaN, undefined, 4], 'abc']) assert.equal(S(sparkline(v)), '', JSON.stringify(v));
});
t('sparkline: la línea llega al último punto (círculo de 2.5), sube con el valor y todo cabe en el viewBox', () => {
  const s = S(sparkline([2, 4, 3, 8, 6, 9, 12], { ancho: 80, alto: 24 }));
  assert.match(s, /viewBox="0 0 80 24"/); assert.match(s, /stroke-width="1.5"/); assert.match(s, /stroke-linecap="round"/); assert.match(s, /r="2.5"/);
  assert.match(s, /pathLength="1"/); assert.match(s, /stop-opacity="\.12"/);
  const pts = s.match(/points="([^"]+)"/)[1].split(' ').map((p) => p.split(',').map(Number));
  assert.equal(pts.length, 7);
  for (const [x, y] of pts) { assert.ok(x >= 2.5 && x <= 77.5, `x ${x}`); assert.ok(y >= 2.5 && y <= 21.5, `y ${y}`); }
  assert.ok(pts[6][1] < pts[0][1], 'el valor más alto va más arriba (y menor)');
  assert.deepEqual(pts[6], [+s.match(/cx="([\d.]+)"/)[1], +s.match(/cy="([\d.]+)"/)[1]]);
  assert.match(S(sparkline([1, 2, 3], { label: 'Últimos 7 días', color: 'var(--ui-ok)' })), /aria-label="Últimos 7 días"[^>]*--vz-col:var\(--ui-ok\)/);
});
t('sparkline: una serie plana va al medio y los valores no numéricos se ignoran; cada una tiene su propio degradado', () => {
  const plana = S(sparkline([5, 5, 5, 5]));
  assert.ok([...plana.matchAll(/points="([^"]+)"/g)][0][1].split(' ').every((p) => p.endsWith(',12')), 'a media altura');
  assert.equal(S(sparkline([1, '2', null, 3, 4])).match(/points="([^"]+)"/)[1].split(' ').length, 4);
  const a = S(sparkline([1, 2, 3])), b = S(sparkline([1, 2, 3]));
  assert.notEqual(a.match(/id="(vzg\d+)"/)[1], b.match(/id="(vzg\d+)"/)[1]);
  assert.ok(!/NaN|undefined|Infinity/.test(a));
});

// ---------- cuenta regresiva ----------
t('cuenta: en palabras y con su tono (rojo si pasó, rojo sólido hoy, ámbar mañana, neutro después)', () => {
  const c = (f) => cuenta(f, HOY);
  assert.deepEqual(c('2026-10-27'), { dias: 0, tono: 'hoy', texto: 'Hoy' });
  assert.deepEqual(c('2026-10-28'), { dias: 1, tono: 'pronto', texto: 'Mañana' });
  assert.deepEqual(c('2026-10-30'), { dias: 3, tono: 'ok', texto: 'En 3 días' });
  assert.deepEqual(c('2026-10-25'), { dias: -2, tono: 'tarde', texto: 'Pasó hace 2 días' });
  assert.equal(c('2026-10-26').texto, 'Pasó hace 1 día');
  assert.equal(c('2026-11-09').texto, 'En 13 días'); assert.equal(c('2026-11-10').texto, 'En 2 sem.'); assert.equal(c('2026-11-17').texto, 'En 3 sem.');
  assert.equal(c('2026-12-20').texto, 'En 8 sem.'); assert.equal(c('2026-12-27').texto, 'En 2 meses'); assert.equal(c('2027-02-27').texto, 'En 4 meses');
  assert.equal(c('2026-08-27').texto, 'Pasó hace 2 meses');
  for (const f of ['', null, undefined, 'mañana', '2026-02-30', '27/10/2026']) assert.equal(c(f), null, String(f));
});
t('cuentaChip: reloj, texto, la fecha completa en title y aria-label; sin fecha real no hay chip; lo hecho no corre', () => {
  const s = S(cuentaChip('2026-10-25', HOY));
  assert.match(s, /vz-cuenta vz-t-tarde/); assert.match(s, /Pasó hace 2 días/); assert.match(s, /<svg/);
  assert.match(s, /title="[^"]*2026[^"]*"/); assert.match(s, /aria-label="Pasó hace 2 días · [^"]*2026[^"]*"/);
  assert.match(S(cuentaChip('2026-10-27', HOY)), /vz-t-hoy/); assert.match(S(cuentaChip('2026-10-28', HOY)), /vz-t-pronto/); assert.match(S(cuentaChip('2026-11-05', HOY)), /vz-t-ok/);
  for (const f of ['', null, 'x', '2026-13-01']) assert.equal(S(cuentaChip(f, HOY)), '', String(f));
  const hecho = S(cuentaChip('2026-10-20', HOY, { hecho: true }));
  assert.match(hecho, /vz-t-hecho/); assert.ok(!/Pasó hace/.test(hecho), 'lo ya hecho no se marca como atrasado');
});

// ---------- grupos por fecha ----------
t('grupoRelativo: Pasado · Hoy · Esta semana · Próxima semana · Después · Sin fecha (semana de lunes a domingo)', () => {
  const g = (f) => grupoRelativo(f, HOY);
  assert.equal(g('2026-10-26'), 'Pasado'); assert.equal(g('2025-01-01'), 'Pasado');
  assert.equal(g('2026-10-27'), 'Hoy');
  assert.equal(g('2026-10-28'), 'Esta semana'); assert.equal(g('2026-11-01'), 'Esta semana');
  assert.equal(g('2026-11-02'), 'Próxima semana'); assert.equal(g('2026-11-08'), 'Próxima semana');
  assert.equal(g('2026-11-09'), 'Después'); assert.equal(g('2027-05-01'), 'Después');
  for (const f of ['', null, undefined, 'x', '2026-02-30']) assert.equal(g(f), 'Sin fecha', String(f));
  assert.equal(grupoRelativo('2026-10-27', 'basura'), 'Sin fecha');
  assert.equal(grupoRelativo('2026-11-02', '2026-11-01'), 'Próxima semana', 'en domingo, el lunes ya es la semana que viene');
  assert.deepEqual(semanaDe(HOY), { from: '2026-10-26', to: '2026-11-01' }); assert.deepEqual(semanaDe('2026-11-01'), { from: '2026-10-26', to: '2026-11-01' }); assert.equal(semanaDe('x'), null);
  assert.deepEqual(GRUPOS, ['Pasado', 'Hoy', 'Esta semana', 'Próxima semana', 'Después', 'Sin fecha']);
  assert.equal(GRUPO_ETIQUETA.Pasado, 'Atrasado');
});
t('agruparPorFecha: en el orden de los grupos, sin los vacíos y con lo más cercano primero', () => {
  const l = [{ id: 'a', fecha: '2026-11-20' }, { id: 'b', fecha: '2026-10-29' }, { id: 'c', fecha: '' }, { id: 'd', fecha: '2026-10-20' }, { id: 'e', fecha: '2026-10-27' }, { id: 'f', fecha: '2026-10-28' }, { id: 'g', fecha: '2026-10-19' }];
  const r = agruparPorFecha(l, (x) => x.fecha, HOY);
  assert.deepEqual(r.map((x) => x.grupo), ['Pasado', 'Hoy', 'Esta semana', 'Después', 'Sin fecha']);
  assert.deepEqual(r.map((x) => x.etiqueta), ['Atrasado', 'Hoy', 'Esta semana', 'Después', 'Sin fecha']);
  assert.deepEqual(r[0].items.map((x) => x.id), ['g', 'd'], 'lo más atrasado primero');
  assert.deepEqual(r[2].items.map((x) => x.id), ['f', 'b']);
  assert.deepEqual(agruparPorFecha([], undefined, HOY), []); assert.deepEqual(agruparPorFecha(null, undefined, HOY), []);
  assert.deepEqual(agruparPorFecha([{ fecha: '2026-10-27' }], undefined, HOY).map((x) => x.grupo), ['Hoy'], 'por defecto lee .fecha');
});

// ---------- monogramas ----------
t('iniciales: 1 o 2 letras, en mayúscula, sin romper letras con acento', () => {
  assert.equal(iniciales('Akai'), 'AK'); assert.equal(iniciales('Rodrigo Medina'), 'RM'); assert.equal(iniciales('  ana  maría  lópez '), 'AM');
  assert.equal(iniciales('Ñandú'), 'ÑA'); assert.equal(iniciales('a'), 'A'); assert.equal(iniciales('😀 Fiesta'), '😀F');
  for (const v of ['', '   ', null, undefined]) assert.equal(iniciales(v), '');
});
t('tonoDe: siempre el mismo color por nombre (sin importar mayúsculas ni acentos), entre 6 y bien repartido', () => {
  assert.equal(TONOS, 6);
  assert.equal(tonoDe('Akai'), tonoDe('akai')); assert.equal(tonoDe('Akai'), tonoDe('  AKAI ')); assert.equal(tonoDe('Café Nao'), tonoDe('cafe nao'));
  const nombres = ['Akai', 'Nao', 'Atelier', 'Cerantola', 'Rodrigo', 'Inherent', 'Naru', 'Nokiate', 'Panza Verde', 'California', 'Veggie', 'Zernio', 'Buzz', 'Hermes', 'Laya', 'Limitless', 'Figma', 'Vercel', 'Apify', 'Windsor'];
  const usados = new Set(nombres.map(tonoDe));
  for (const x of usados) assert.ok(Number.isInteger(x) && x >= 0 && x < TONOS);
  assert.ok(usados.size >= 4, `solo ${usados.size} tonos`);
  assert.equal(tonoDe(''), tonoDe(null));
});
t('monograma: círculo con iniciales y su tono; sin nombre, nada (nunca una imagen inventada); el nombre se escapa', () => {
  const s = S(monograma('Akai'));
  assert.match(s, new RegExp(`class="vz-mono vz-m-${tonoDe('Akai')}"`)); assert.match(s, />AK</); assert.match(s, /aria-hidden="true"/);
  assert.match(S(monograma('Akai', { solo: true })), /role="img" aria-label="Akai"/); assert.match(S(monograma('Akai', { tam: 'sm' })), /vz-mono--sm/);
  assert.equal(S(monograma('')), ''); assert.equal(S(monograma(null)), ''); assert.ok(!/<img/.test(s));
  assert.ok(!/<script/.test(S(monograma('<script>alert(1)</script>', { solo: true }))));
});
t('monogramas: uno solo es un monograma; varios se apilan con «+N» y su texto para lector de pantalla', () => {
  assert.equal(S(monogramas([])), ''); assert.equal(S(monogramas(null)), ''); assert.equal(S(monogramas(['', null])), '');
  assert.match(S(monogramas(['Akai'])), /role="img" aria-label="Akai"/); assert.ok(!/vz-monos/.test(S(monogramas(['Akai', 'akai '])) === '' ? 'x' : S(monogramas(['Akai', 'Akai']))), 'sin repetir');
  const s = S(monogramas(['Akai', 'Nao', 'Atelier', 'Cerantola', 'Naru']));
  assert.match(s, /class="vz-monos"/); assert.equal((s.match(/class="vz-mono /g) || []).length, 4, '3 círculos y el +2'); assert.match(s, /vz-m-mas[^>]*>\+2</);
  assert.match(s, /aria-label="Akai, Nao, Atelier y 2 más"/);
  assert.ok(!/vz-m-mas/.test(S(monogramas(['A', 'B', 'C']))), 'con 3 o menos no hay +N');
  assert.match(S(monogramas(['A', 'B', 'C', 'D'], { max: 2 })), />\+2</);
});

// ---------- punto de estado, cuadrito y vacío ----------
t('punto y estado: el verde es lo vivo; un tono desconocido es «sin configurar» y siempre lleva texto', () => {
  for (const x of ['vivo', 'medio', 'caido', 'off', 'info']) assert.match(S(punto(x)), new RegExp(`vz-p-${x}`));
  assert.match(S(punto('rojo-fosforito')), /vz-p-off/); assert.match(S(punto()), /vz-p-off/); assert.match(S(punto('vivo')), /aria-hidden="true"/);
  const e = S(estado('vivo', 'En línea · hace 3 min'));
  assert.match(e, /vz-estado/); assert.match(e, /vz-p-vivo/); assert.match(e, /En línea · hace 3 min/);
  assert.ok(!/<b>/.test(S(estado('off', '<b>x</b>'))));
});
t('cuadrito: ícono en cuadro tintado con su color; un ícono que no existe cae a uno que sí; con título es una imagen con nombre', () => {
  const s = S(cuadrito('file-text', { color: 'var(--ui-m-marketing)', titulo: 'Nota' }));
  assert.match(s, /vz-tipo/); assert.match(s, /--tipo-c:var\(--ui-m-marketing\)/); assert.match(s, /<svg/); assert.match(s, /role="img" aria-label="Nota" title="Nota"|title="Nota" role="img" aria-label="Nota"/);
  assert.match(S(cuadrito('no-existe-xyz')), /<svg/); assert.match(S(cuadrito('link')), /aria-hidden="true"/);
  assert.match(S(cuadrito('link', { tam: 'sm' })), /vz-tipo--sm/); assert.match(S(cuadrito('link', { tam: 'lg' })), /vz-tipo--lg/);
  assert.match(S(cuadrito('link', { color: 'x;y' })), /--tipo-c:var\(--ui-acc\)/);
});
t('vacío: círculo discontinuo + ícono, título, de dónde saldría y una sola acción (botón o link); nada raro en el link', () => {
  const s = S(vacio({ icono: 'calendar', titulo: 'Aún no hay notas aquí', linea: 'Se llena cuando agregues la primera', boton: { texto: 'Agregar', act: 'nueva', data: { estado: 'Por hacer', 'x y': 'z' } }, animar: true }));
  assert.match(s, /vz-vacio vz-vacio--entra/); assert.match(s, /stroke-dasharray="3 5"/); assert.match(s, /vz-vacio-t">Aún no hay notas aquí</); assert.match(s, /vz-vacio-l">Se llena/);
  assert.match(s, /<button type="button" class="btn ghost vz-vacio-b" data-act="nueva" data-estado="Por hacer">Agregar<\/button>/); assert.ok(!/x y/.test(s));
  assert.equal((s.match(/<button|<a /g) || []).length, 1);
  assert.match(S(vacio({ titulo: 'x', boton: { texto: 'Ir', href: '#/areas/marketing' } })), /<a class="btn ghost vz-vacio-b" href="#\/areas\/marketing">Ir<\/a>/);
  assert.ok(!/href=/.test(S(vacio({ titulo: 'x', boton: { texto: 'Ir', href: 'javascript:alert(1)' } }))), 'un link raro no pasa');
  assert.ok(!/<button|<a /.test(S(vacio({ titulo: 'Solo lectura', linea: 'Tu perfil solo puede leer esto.' }))));
  assert.ok(!/vz-vacio--entra|vz-vacio--c/.test(S(vacio({ titulo: 'x' }))) && /vz-vacio--c/.test(S(vacio({ titulo: 'x', compacto: true }))));
  assert.ok(!/<script/.test(S(vacio({ titulo: '<script>', linea: '<script>' }))));
});

// ---------- números ----------
t('numero: sin dato es «—» (nunca 0); con dato trae su valor final y lo necesario para contar', () => {
  for (const v of [null, undefined, '', 'x', NaN, true]) { const s = S(numero(v)); assert.match(s, /vz-num is-vacio">—</); assert.ok(!/data-n/.test(s), String(v)); }
  assert.match(S(numero(null, { vacio: 'n/d' })), />n\/d</);
  const s = S(numero(12500, { pre: 'Q', clave: 'ingresos' }));
  assert.match(s, /data-n="12500"/); assert.match(s, /data-pre="Q"/); assert.match(s, /data-k="ingresos"/); assert.match(s, />Q12,500</);
  assert.match(S(numero(0)), /data-n="0"[^>]*>0</, 'un 0 real, dado como dato, se muestra tal cual');
  assert.match(S(numero(7.6, { suf: ' d' })), />8 d</);
  assert.equal(formatear(1234567), '1,234,567'); assert.equal(formatear(-500, 'Q'), '-Q500'); assert.equal(formatear(0), '0');
});
t('contarNumeros no toca nada fuera del navegador; recuerda/recordar no truenan si no hay storage', () => {
  assert.equal(contarNumeros(null), 0); assert.equal(contarNumeros({}), 0);
  assert.equal(recuerda('os.x'), ''); assert.equal(recuerda('os.x', '0'), '0');
  assert.doesNotThrow(() => recordar('os.x', '1'));
});

// ---------- Las pantallas usan lo anterior bien ----------
const home = leer('../public/js/screens/home.js'), areas = leer('../public/js/screens/areas.js'), cal = leer('../public/js/screens/calendario.js'), vis = leer('../public/js/visual.js');
t('las tres pantallas importan visual.js y visual.js sigue puro (sin red, sin storage, el DOM solo en contarNumeros)', () => {
  for (const [n, s] of [['home', home], ['areas', areas], ['calendario', cal]]) assert.match(s, /from '\.\.\/visual\.js'/, n);
  assert.ok(!/\b(?:fetch|XMLHttpRequest|innerHTML|eval|new Function)\b/.test(vis));
  const antes = vis.slice(0, vis.indexOf('// ---------- Fin de lo puro'));
  assert.ok(antes.length > 1000 && antes.includes('export const anillo'), 'el corte está donde debe');
  assert.ok(!/\b(?:document|window|matchMedia|requestAnimationFrame|performance|localStorage|sessionStorage)\b/.test(antes.replace(/typeof document === 'undefined'/g, '')), 'lo puro no toca el DOM ni el storage');
});
t('nada de handlers ni scripts en línea en las pantallas (CSP) y los íconos nombrados existen', () => {
  for (const [n, s] of [['home', home], ['areas', areas], ['calendario', cal], ['visual', vis]]) {
    assert.ok(!/\son(?:click|change|input|submit|keydown|load|error|mouse\w+)\s*=/i.test(s), `${n}: handler en línea`);
    assert.ok(!/<script/i.test(s), `${n}: script en línea`);
    for (const m of s.matchAll(/\b(?:ico|svgIco|cuadrito|vacio)\(\s*'([\w-]+)'/g)) if (!m[1].endsWith('-')) assert.ok(tieneIco(m[1]), `${n}: ícono ${m[1]}`);
  }
});
t('Home y Áreas: lo sin dato sale vacío con su fuente (nada de pintar 0 en un KPI) y las entradas no se repiten en cada repintado', () => {
  assert.ok(!/big:\s*[^,]*\|\|\s*0\b/.test(home), 'un KPI sin dato no se vuelve 0');
  assert.match(home, /contarNumeros/); assert.match(home, /escalonar/);
  assert.match(areas, /escalonar/); assert.ok(!/class="[^"]*\bentra\b/.test(areas), 'areas.js no deja .entra en la plantilla (se repetiría en cada filtro): usa escalonar una vez');
});

console.log(`\n${ok} pruebas de visual.js bien`);
