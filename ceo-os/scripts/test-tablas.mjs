// Pruebas de los patrones de presentación (sin navegador): tabla densa (orden, aria-sort, teclado, selección, grupos, vacío y carga),
// lista de una línea y fila de cifras. También que Finanzas, Ventas y Paquetes ya no envuelvan sus datos en tarjetas.
// npm run test:tablas   (la parte de navegador: npm run test:tablas -- --navegador, con el OS local corriendo)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ordenar, siguienteOrden, ariaOrden, moverFoco, alternar, todos, estadoTodos, tablaHtml, vistaFilas, valorOrden, aTexto } from '../public/js/tabla.js';
import { listaHtml, renglonHtml } from '../public/js/lista.js';
import { cifrasHtml, deltaDe } from '../public/js/cifras.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const leer = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

const FILAS = [
  { id: 'a', nombre: 'Ñandú', monto: 300, fecha: '2026-11-02' },
  { id: 'b', nombre: 'árbol', monto: 1200, fecha: '2026-11-09' },
  { id: 'c', nombre: 'Casa', monto: null, fecha: '' },
  { id: 'd', nombre: 'beta', monto: 45, fecha: '2026-10-30' },
];
const COLS = [
  { k: 'nombre', t: 'Nombre', orden: true },
  { k: 'monto', t: 'Monto', num: true, orden: true },
  { k: 'fecha', t: 'Fecha', orden: true },
];

// ---------- Orden ----------
t('ordenar: números como números, lo vacío al final en los dos sentidos', () => {
  assert.deepEqual(ordenar(FILAS, COLS[1], 'asc').map((f) => f.id), ['d', 'a', 'b', 'c']);
  assert.deepEqual(ordenar(FILAS, COLS[1], 'desc').map((f) => f.id), ['b', 'a', 'd', 'c']);
  assert.deepEqual(ordenar(FILAS, COLS[2], 'desc').map((f) => f.id), ['b', 'a', 'd', 'c']);
});
t('ordenar: texto en español, sin importar acentos ni mayúsculas (á con a, ñ después de n)', () => {
  assert.deepEqual(ordenar(FILAS, COLS[0], 'asc').map((f) => f.nombre), ['árbol', 'beta', 'Casa', 'Ñandú']);
});
t('ordenar: estable entre iguales y no toca el arreglo original', () => {
  const xs = [{ id: 1, v: 1 }, { id: 2, v: 1 }, { id: 3, v: 0 }];
  assert.deepEqual(ordenar(xs, { k: 'v', orden: true }, 'asc').map((x) => x.id), [3, 1, 2]);
  assert.deepEqual(ordenar(xs, { k: 'v', orden: true }, 'desc').map((x) => x.id), [1, 2, 3]);
  assert.deepEqual(xs.map((x) => x.id), [1, 2, 3]);
});
t('valorOrden: una función de orden manda; NaN y vacío cuentan como sin dato', () => {
  assert.equal(valorOrden({ k: 'x', orden: (f) => f.x * 2 }, { x: 3 }), 6);
  assert.equal(valorOrden({ k: 'x', orden: true }, { x: '' }), null);
  assert.equal(valorOrden({ k: 'x', orden: true }, { x: NaN }), null);
});
t('siguienteOrden: números arrancan de mayor a menor, texto de A a Z; la misma cabecera invierte', () => {
  assert.deepEqual(siguienteOrden(null, COLS[1]), { k: 'monto', dir: 'desc' });
  assert.deepEqual(siguienteOrden(null, COLS[0]), { k: 'nombre', dir: 'asc' });
  assert.deepEqual(siguienteOrden({ k: 'nombre', dir: 'asc' }, COLS[0]), { k: 'nombre', dir: 'desc' });
  assert.deepEqual(siguienteOrden({ k: 'nombre', dir: 'desc' }, COLS[1]), { k: 'monto', dir: 'desc' });
  assert.equal(ariaOrden({ k: 'monto', dir: 'desc' }, COLS[1]), 'descending');
  assert.equal(ariaOrden({ k: 'monto', dir: 'asc' }, COLS[1]), 'ascending');
  assert.equal(ariaOrden({ k: 'monto', dir: 'asc' }, COLS[0]), 'none');
});
t('vistaFilas: sin orden respeta el orden en que llegan (p. ej. por urgencia)', () => {
  assert.deepEqual(vistaFilas({ cols: COLS, filas: FILAS }, null).map((f) => f.id), ['a', 'b', 'c', 'd']);
  assert.deepEqual(vistaFilas({ cols: COLS, filas: FILAS }, { k: 'monto', dir: 'desc' }).map((f) => f.id), ['b', 'a', 'd', 'c']);
  assert.deepEqual(vistaFilas({ cols: [{ k: 'monto' }], filas: FILAS }, { k: 'monto', dir: 'desc' }).map((f) => f.id), ['a', 'b', 'c', 'd'], 'una columna no ordenable no ordena');
});

// ---------- Teclado ----------
t('moverFoco: flechas, Inicio/Fin y Re Pág/Av Pág, sin salirse de la tabla', () => {
  assert.equal(moverFoco(0, 'ArrowDown', 5), 1);
  assert.equal(moverFoco(4, 'ArrowDown', 5), 4);
  assert.equal(moverFoco(0, 'ArrowUp', 5), 0);
  assert.equal(moverFoco(2, 'Home', 5), 0);
  assert.equal(moverFoco(2, 'End', 5), 4);
  assert.equal(moverFoco(0, 'PageDown', 30), 10);
  assert.equal(moverFoco(3, 'PageUp', 30), 0);
  assert.equal(moverFoco(1, 'a', 5), null);
  assert.equal(moverFoco(0, 'ArrowDown', 0), null);
});

// ---------- Selección ----------
t('selección: alternar y «todas» (marca todo, o desmarca si ya estaban todas)', () => {
  let s = alternar(new Set(), 'a'); assert.deepEqual([...s], ['a']);
  s = alternar(s, 'a'); assert.equal(s.size, 0);
  assert.equal(estadoTodos(new Set(['a']), ['a', 'b']), 'mixto');
  s = todos(new Set(['a']), ['a', 'b']); assert.deepEqual([...s].sort(), ['a', 'b']);
  assert.equal(estadoTodos(s, ['a', 'b']), 'si');
  s = todos(s, ['a', 'b']); assert.equal(s.size, 0);
  assert.equal(estadoTodos(s, ['a', 'b']), 'no');
  assert.equal(estadoTodos(new Set(), []), 'no');
});

// ---------- HTML accesible ----------
const H = (cfg, st) => String(tablaHtml({ etiqueta: 'Prueba', cols: COLS, filas: FILAS, ...cfg }, st));
t('tabla: <table> real con caption, th scope=col, aria-sort y la primera celda como th scope=row', () => {
  const s = H({ orden: { k: 'monto', dir: 'desc' } });
  assert.match(s, /<table[^>]*><caption class="tdn-sr">Prueba<\/caption>/);
  assert.equal((s.match(/<th scope="col"/g) || []).length, 3);
  assert.match(s, /<th scope="col" aria-sort="descending" class="n">/);
  assert.equal((s.match(/aria-sort="none"/g) || []).length, 2);
  assert.equal((s.match(/<th scope="row"/g) || []).length, 4);
  assert.ok(s.indexOf('data-tdn-id="b"') < s.indexOf('data-tdn-id="a"'), 'ordenado por monto, de mayor a menor');
  assert.match(s, /<button type="button" class="tdn-o" data-tdn-orden="1">/, 'cada cabecera ordenable es un botón');
});
t('tabla: los números van a la derecha (td.n) y cada celda lleva su etiqueta para el cel', () => {
  const s = H({});
  assert.match(s, /<td class="n" data-l="Monto">300<\/td>/);
  assert.match(s, /<td data-l="Fecha">2026-11-02<\/td>/);
  assert.match(s, /data-tdn-osel/, 'en el cel el orden se elige con un select');
});
t('tabla: foco itinerante (solo una fila con tabindex=0) y filas clicables con nombre', () => {
  const s = H({ abrir: () => {} });
  assert.equal((s.match(/tabindex="0"/g) || []).length, 1);
  assert.equal((s.match(/<tr class="tdn-f tdn-ab"[^>]*tabindex="-1"/g) || []).length, 3);
  assert.match(s, /aria-label="Ñandú · abrir"/);
  assert.match(s, /class="tdn tdn-clic"/);
  assert.match(H({ abrir: () => {} }, { foco: 'c' }), /data-tdn-id="c" tabindex="0"/);
});
t('tabla: selección múltiple con casillas, aria-selected y «elegir todas» en estado mixto', () => {
  const s = H({ seleccion: { alCambiar: () => {} } }, { sel: new Set(['a']) });
  assert.match(s, /aria-multiselectable="true"/);
  assert.match(s, /data-tdn-id="a"[^>]*aria-selected="true"/);
  assert.match(s, /data-tdn-id="b"[^>]*aria-selected="false"/);
  assert.match(s, /data-tdn-todos aria-label="Elegir todas" data-mixto="1"/);
  assert.match(s, /role="status">1 elegida</);
  assert.ok(!/aria-selected/.test(H({})), 'sin selección no hay aria-selected');
});
t('tabla: acciones por fila con nombre accesible (se ven al pasar el mouse o con foco)', () => {
  const s = H({ acciones: (f) => (f.id === 'c' ? [] : [{ t: 'Editar', ico: 'edit', fn: () => {} }]) });
  assert.equal((s.match(/data-tdn-acc="0"/g) || []).length, 3);
  assert.match(s, /aria-label="Editar · Ñandú"/);
  assert.match(s, /<th scope="col" class="tdn-a"><span class="tdn-sr">Acciones<\/span><\/th>/);
});
t('tabla: vacío con vacio() y carga con filas fantasma (aria-busy)', () => {
  const v = H({ filas: [], vacio: { icono: 'inbox', titulo: 'Sin movimientos', linea: 'Registra uno.' } });
  assert.match(v, /class="tdn-vacio"/); assert.match(v, /vz-vacio/); assert.match(v, /Sin movimientos/); assert.ok(!/<table/.test(v));
  const c = H({ filas: [], cargando: true });
  assert.match(c, /<tbody aria-busy="true">/); assert.equal((c.match(/class="tdn-fan"/g) || []).length, 3);
  assert.ok(!/data-tdn-osel/.test(c));
});
t('tabla: grupos con encabezado (th scope=rowgroup y su cuenta) y fila de totales en tfoot', () => {
  const s = H({ grupo: (f) => (f.monto > 100 ? 'Grandes' : 'Chicos'), pie: (fs) => ['Total', fs.reduce((a, f) => a + (f.monto || 0), 0), ''] });
  assert.match(s, /<th scope="rowgroup" colspan="3">Grandes <span>2<\/span><\/th>/);
  assert.match(s, /<th scope="rowgroup" colspan="3">Chicos <span>2<\/span><\/th>/);
  assert.equal((s.match(/<tbody>/g) || []).length, 2);
  assert.match(s, /<tfoot><tr><td class="tdn-t">Total<\/td><td class="n" data-l="Monto">1545<\/td>/);
});
t('tabla: todo lo de los datos sale escapado; html`` (Raw) entra tal cual', () => {
  const s = H({ filas: [{ id: '"x', nombre: '<img src=x onerror=alert(1)>', monto: 1 }] });
  assert.ok(!s.includes('<img'), 'no se cuela HTML'); assert.match(s, /&lt;img/); assert.match(s, /data-tdn-id="&quot;x"/);
  assert.equal(aTexto({ s: '<b>ok</b>' }), '<b>ok</b>'); assert.equal(aTexto(['a', { s: '<i>b</i>' }]), 'a<i>b</i>'); assert.equal(aTexto(null), '');
});

// ---------- Lista de una línea ----------
t('lista: estado · título · dueño · fecha, agrupada con encabezados y tope «y N más»', () => {
  const s = String(listaHtml({ etiqueta: 'Seguimientos', grupos: [{ t: 'Vencido', items: [1, 2, 3] }, { t: 'Hoy', items: [] }], max: 2, renglon: (n) => ({ estado: { tono: 'caido', texto: 'Vencido' }, titulo: `Lead ${n}`, dueno: 'Ventas', fecha: 'venció 9 nov', fechaTono: 'late', act: 'lead', id: n }) }));
  assert.match(s, /role="group" aria-label="Seguimientos"/);
  assert.match(s, /<h3 class="lsd-h">Vencido <span>3<\/span><\/h3>/);
  assert.ok(!s.includes('>Hoy <'), 'un grupo vacío no se pinta');
  assert.equal((s.match(/class="lsd-r lsd-ab"/g) || []).length, 2);
  assert.match(s, /<li class="lsd-mas">y 1 más<\/li>/);
  assert.match(s, /<button type="button" class="lsd-b" data-act="lead" data-id="1">/);
  assert.match(s, /vz-p-caido/); assert.match(s, /class="lsd-f late"/);
});
t('lista: sin acción es texto (sin botón); el extra queda fuera del botón; vacío con vacio()', () => {
  const r = renglonHtml({ titulo: 'Banco', extra: { s: '<button>x</button>' } });
  assert.ok(!r.includes('class="lsd-b" data-act')); assert.match(r, /<div class="lsd-b">/);
  const r2 = renglonHtml({ titulo: 'A', act: 'tab', data: { t: 'fact', 'Mal"': 1 }, extra: 'Q1' });
  assert.match(r2, /data-t="fact"/); assert.ok(!r2.includes('Mal'), 'solo data-* válidos');
  assert.match(r2, /<\/button><span class="lsd-x">Q1<\/span><\/li>/);
  assert.match(String(listaHtml({ items: [], renglon: () => ({}), vacio: { titulo: 'Nadie te debe' } })), /vz-vacio--c[\s\S]*Nadie te debe/);
  assert.equal(String(listaHtml({ items: [], renglon: () => ({}) })), '');
});

// ---------- Fila de cifras ----------
t('cifras: un solo contenedor <dl>, cifra + delta + sparkline, sin una tarjeta por métrica', () => {
  const s = String(cifrasHtml([{ t: 'Entró', v: 'Q27,720', delta: { v: 12.4, texto: 'vs. mes anterior' }, serie: [1, 3, 2, 5] }, { t: 'Salió', v: 'Q8,650', delta: { v: 4, bueno: 'baja' }, tono: 'bad' }, null], { etiqueta: 'El mes' }));
  assert.match(s, /^<dl class="cfr" aria-label="El mes">/);
  assert.equal((s.match(/class="cfr-i"/g) || []).length, 2);
  assert.ok(!/class="card/.test(s));
  assert.match(s, /<span class="cfr-d ok">↑ 12% vs. mes anterior<\/span>/);
  assert.match(s, /<span class="cfr-d bad">↑ 4%<\/span>/, 'un costo que sube es malo');
  assert.match(s, /vz-spark/); assert.match(s, /class="cfr-v cfr-bad"/);
});
t('cifras: delta igual o sin dato; serie en ceros no dibuja sparkline', () => {
  assert.deepEqual(deltaDe({ v: 0.2 }), { flecha: '', texto: 'igual', tono: '' });
  assert.equal(deltaDe({ v: null }), null); assert.equal(deltaDe({ v: NaN }), null); assert.equal(deltaDe(null), null);
  assert.ok(!/vz-spark/.test(String(cifrasHtml([{ t: 'x', v: 1, serie: [0, 0, 0] }]))));
  assert.match(String(cifrasHtml([{ t: 'Meta', v: '—', act: 'metaEdit' }])), /<button type="button" class="cfr-b" data-act="metaEdit">Meta<\/button>/);
});

// ---------- Las pantallas migradas ----------
t('Finanzas y Ventas ya no envuelven datos en .card; Paquetes deja solo el paquete elegido', () => {
  const cards = (f) => (leer(f).match(/class="card[ "]/g) || []).length;
  assert.equal(cards('../public/js/screens/finance.js'), 0);
  assert.equal(cards('../public/js/screens/sales.js'), 0);
  const pk = leer('../public/js/paquetes.js');
  assert.equal(cards('../public/js/paquetes.js'), 2);
  assert.equal((pk.match(/class="card feat olive vpp-elegido"/g) || []).length, 2, 'las dos que quedan son el paquete abierto');
});
t('las pantallas usan los componentes y el kanban de leads sigue siendo de tarjetas (se arrastra)', () => {
  const fin = leer('../public/js/screens/finance.js'), ven = leer('../public/js/screens/sales.js'), pk = leer('../public/js/paquetes.js');
  for (const [n, s] of [['finance', fin], ['sales', ven]]) { assert.match(s, /from '\.\.\/tabla\.js'/, n); assert.match(s, /from '\.\.\/cifras\.js'/, n); assert.match(s, /from '\.\.\/lista\.js'/, n); }
  assert.match(pk, /from '\.\/tabla\.js'/);
  assert.match(ven, /class="kcard vx-cd/); assert.match(ven, /draggable="true"/);
});
t('tablas.css: solo tokens y sin clases que choquen con app.css', () => {
  const css = leer('../public/tablas.css'), app = leer('../public/app.css');
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'sin hex');
  const mias = new Set([...css.matchAll(/\.((?:tdn|lsd|cfr|vpp)-?[\w-]*)/g)].map((m) => m[1]));
  const choques = [...mias].filter((c) => new RegExp(`\\.${c}(?![\\w-])`).test(app));
  assert.deepEqual(choques, []);
  assert.match(leer('../public/index.html'), /<link rel="stylesheet" href="\/tablas\.css">/);
});

console.log(`\n${ok} pruebas de tablas, listas y cifras bien.`);

// ---------- En el navegador (opcional): orden con clic, teclado, selección y la fila que abre ----------
if (process.argv.includes('--navegador')) {
  const { createRequire } = await import('node:module'); const { execSync } = await import('node:child_process');
  let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright')); }
  const base = process.env.TEST_BASE || 'http://localhost:3000'; if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Solo pruebas locales');
  const b = await chromium.launch({ channel: 'chrome', headless: true }), p = await b.newPage();
  try {
    await p.goto(base + '/api/auth/dev');
    const r = await p.evaluate(async () => {
      const { tabla } = await import('/js/tabla.js');
      const caja = document.createElement('div'); document.body.append(caja); const abiertas = [], elegidas = [];
      const ctl = tabla(caja, { etiqueta: 'Prueba', filas: [{ id: 'a', n: 'Uno', m: 5 }, { id: 'b', n: 'Dos', m: 50 }, { id: 'c', n: 'Tres', m: 1 }], cols: [{ k: 'n', t: 'Nombre', orden: true }, { k: 'm', t: 'Monto', num: true, orden: true }], abrir: (f) => abiertas.push(f.id), seleccion: { alCambiar: (ids) => elegidas.push(ids.join(',')) }, acciones: () => [{ t: 'Editar', ico: 'edit', fn: (f) => abiertas.push('edit:' + f.id) }] });
      const ids = () => [...caja.querySelectorAll('tr.tdn-f')].map((tr) => tr.dataset.tdnId).join('');
      const out = { inicial: ids() };
      caja.querySelector('[data-tdn-orden="1"]').click(); out.montoDesc = ids(); out.aria = caja.querySelector('th[aria-sort="descending"]')?.textContent.trim();
      caja.querySelector('[data-tdn-orden="1"]').click(); out.montoAsc = ids();
      const tr0 = caja.querySelector('tr.tdn-f'); tr0.focus(); tr0.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      out.foco = document.activeElement?.dataset.tdnId;
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); out.sel = ctl.seleccion().join(',');
      out.focoTrasPintar = document.activeElement?.dataset.tdnId;
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      caja.querySelector('tr.tdn-f[data-tdn-id="b"] td:nth-child(3)').click();
      caja.querySelector('tr.tdn-f[data-tdn-id="c"] [data-tdn-acc]').click();
      caja.querySelector('[data-tdn-todos]').click(); out.todas = ctl.seleccion().sort().join(',');
      out.abiertas = abiertas.join(' '); out.elegidas = elegidas.join(' | ');
      ctl.pintar({ filas: [] }); out.vacio = Boolean(caja.querySelector('.vz-vacio'));
      return out;
    });
    assert.equal(r.inicial, 'abc'); assert.equal(r.montoDesc, 'bac'); assert.equal(r.aria, 'Monto'); assert.equal(r.montoAsc, 'cab');
    assert.equal(r.foco, 'a', 'flecha abajo pasa a la segunda fila'); assert.equal(r.sel, 'a', 'espacio elige'); assert.equal(r.focoTrasPintar, 'a', 'el foco sobrevive al repintar');
    assert.equal(r.abiertas, 'a b edit:c', 'Enter y clic abren; la acción no abre la fila');
    assert.equal(r.todas, 'a,b,c'); assert.match(r.elegidas, /^a \| [abc,]{5}$/, 'alCambiar avisa cada cambio');
    assert.ok(r.vacio);
    console.log('✓ navegador: orden con clic, teclado (flechas, espacio, Enter), acciones y vacío');
  } finally { await b.close(); }
}
