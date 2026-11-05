// Pruebas del sistema de diseño (sin navegador): los íconos que usa el OS existen, cada color tiene día y noche,
// y el texto se lee (contraste AA) en los dos temas.
// npm run test:ui
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tieneIco, svgIco, nombreIco } from '../public/js/iconos.js';
import { contraste } from '../public/js/sistema-visual.js';
import { workspacesDe, rutaDeVuelta, esApp } from '../public/js/workspaces.js';
import { aroDe, SUPERFICIES } from '../public/js/luz.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const RAIZ = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'public');
const archivos = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
const JS = archivos(path.join(RAIZ, 'js')).map((f) => [path.relative(RAIZ, f), fs.readFileSync(f, 'utf8')]);
const CSS = fs.readFileSync(path.join(RAIZ, 'app.css'), 'utf8');

t('cada ícono que el OS nombra existe en el set', () => {
  const faltan = [];
  for (const [f, s] of JS) for (const m of s.matchAll(/\b(?:ico|svgIco)\(\s*'([\w-]+)'/g)) if (!m[1].endsWith('-') && !tieneIco(m[1])) faltan.push(`${f}: ${m[1]}`);
  // Los de la barra lateral se arman por entrada (ico('nav-home')) y los workspaces por su id (nav-strategy…).
  for (const k of ['home', 'organization', 'ai', 'strategy', 'marketing', 'creative', 'consulting', 'production', 'library', 'finances', 'portal']) if (!tieneIco('nav-' + k)) faltan.push(`nav-${k}`);
  // Los nombres de antes siguen como alias mientras algo los nombre.
  for (const k of ['hoy', 'proyectos', 'ventas', 'servicios', 'finanzas', 'inherent', 'marcas', 'estrategia', 'diseno']) if (!tieneIco('nav-' + k)) faltan.push(`nav-${k}`);
  // Los mapas de símbolos → ícono (Ventas, Mis tareas) también.
  for (const [f, s] of JS) for (const m of s.matchAll(/const GLIFO = \{([^}]*)\}/g)) for (const v of m[1].matchAll(/:\s*'([\w-]+)'/g)) if (!tieneIco(v[1])) faltan.push(`${f}: GLIFO ${v[1]}`);
  assert.deepEqual(faltan, []);
});

t('los íconos salen sin estilos sueltos y con su tamaño', () => {
  const s = svgIco('cal', 18);
  assert.match(s, /class="lni lni-lg"/);
  assert.match(s, /width="18" height="18"/);
  assert.ok(!/style=/.test(s));
  assert.match(svgIco('x', 'sm'), /lni-sm/);
  assert.equal(nombreIco('gear'), 'settings');
  assert.ok(svgIco('chat-ia', 20).includes('fill="currentColor"'), 'el ícono del Chat (la chispa) es el propio');
});

// Los tokens --ui-* del bloque «SISTEMA v2»: el primer :root{…} es el día y el primer :root[data-theme="dark"]{…} la noche.
const v2 = CSS.slice(CSS.indexOf('SISTEMA v2'));
const bloque = (sel) => { const i = v2.indexOf(sel + '{'); const j = v2.indexOf('\n}', i); return v2.slice(i, j); };
const tokens = (b) => Object.fromEntries([...b.matchAll(/--(ui-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const DIA = tokens(bloque(':root')), NOCHE = tokens(bloque(':root[data-theme="dark"]'));

t('cada color tiene su valor oscuro', () => {
  const colores = Object.keys(DIA).filter((k) => !/^ui-(focus)$/.test(k) && /^(#|rgb|0 )/.test(DIA[k]));
  const faltan = colores.filter((k) => !(k in NOCHE));
  assert.deepEqual(faltan, []);
  assert.ok(colores.length >= 20, `solo ${colores.length} colores`);
});

t('el texto se lee: contraste AA (4.5) en los dos temas', () => {
  const malos = [];
  for (const [tema, T] of [['día', DIA], ['noche', NOCHE]]) for (const tx of ['ui-ink', 'ui-ink2', 'ui-mut', 'ui-acc']) for (const fondo of ['ui-bg', 'ui-surf']) {
    const c = contraste(T[tx], T[fondo]); if (c < 4.5) malos.push(`${tema}: ${tx} sobre ${fondo} = ${c}`);
  }
  // El texto del botón café y los estados sobre su fondo.
  for (const [tema, T] of [['día', DIA], ['noche', NOCHE]]) { const c = contraste(T['ui-acc-ink'], T['ui-acc']); if (c < 4.5) malos.push(`${tema}: texto del botón café = ${c}`); }
  assert.deepEqual(malos, []);
});

t('las zonas de papel (cotización, login, portadas) conservan su paleta', () => {
  const papel = v2.match(/:is\(\.qdoc,\.feat,\.login,\.bx,\.rview,\.recbar,\.inbox,\.sp-cover\)\{([^}]*)\}/);
  assert.ok(papel, 'falta la regla de papel');
  for (const k of ['--bg:#f1eadf', '--ink:#2c1f16', '--surface:#fcf9f2', '--ui-ink:#2c1f16']) assert.ok(papel[1].includes(k), k);
});

t('el tema arranca antes de pintar y sin destellos', () => {
  const idx = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  assert.ok(idx.indexOf('/js/tema-boot.js') > 0 && idx.indexOf('/js/tema-boot.js') < idx.indexOf('/app.css'), 'tema-boot va en el head, antes del CSS');
  const boot = fs.readFileSync(path.join(RAIZ, 'js/tema-boot.js'), 'utf8');
  assert.ok(boot.includes("'dark'") && boot.includes('#0d0d0e'), 'arranca oscuro y la franja del iPhone usa su fondo');
  assert.ok(!boot.includes('localStorage'), 'no depende de una elección guardada');
  assert.equal(NOCHE['ui-bg'], '#0d0d0e');
});

const v3 = CSS.slice(CSS.indexOf('SISTEMA v3 (PLAN-GATEWAY'));
t('sistema v3: la paleta es la aprobada y solo los estados llevan color', () => {
  assert.deepEqual([NOCHE['ui-ink'], NOCHE['ui-mut'], NOCHE['ui-acc'], NOCHE['ui-ok']], ['#efebe4', '#a39f9a', '#f5f5f7', '#a7f3d0']);
  for (const k of ['ui-m-estrategia', 'ui-m-organizacion', 'ui-m-diseno']) {
    const [r, g, b] = NOCHE[k].slice(1).match(/../g).map((x) => parseInt(x, 16));
    assert.ok(Math.max(r, g, b) - Math.min(r, g, b) < 36, `${k} debe ser neutro`);
  }
});
t('sistema v3: sin texturas ni formas de fondo', () => {
  assert.match(v3, /body::after\{display:none\}/);
  assert.ok(!/radial-gradient\([^;]*dots|background-image:var\(--grain\)/.test(v3));
});
t('sistema v3: respeta reducir movimiento, reducir transparencia y más contraste', () => {
  for (const m of ['prefers-reduced-motion', 'prefers-reduced-transparency', 'prefers-contrast']) assert.ok(v3.includes(m), m);
});
t('solo oscuro: no quedan selectores de tema en la app', () => {
  for (const [f, s] of JS) if (f !== path.join('js', 'tema.js')) assert.ok(!/themebtn|ponerTema|temaElegido/.test(s), f);
});

t('transiciones: una sola curva suave, entradas sin saltos y reducir movimiento intacto', () => {
  assert.match(v3, /--suave:/);
  assert.match(v3, /view-transition-new\(vt-main\)\{animation:vt3In 320ms var\(--suave\)/);
  assert.match(v3, /\.lm\.llega/);
  const trans = v3.slice(v3.indexOf('TRANSICIONES'), v3.indexOf('/* ===== Workspaces y acciones'));
  assert.ok(!/#[0-9a-f]{6}|rgb\(|background:|border-radius/.test(trans.replace(/\.llega|transition[^;}]*/g, '')), 'este bloque solo mueve: no toca colores ni formas');
});
t('workspaces: según el rol; un cliente no tiene selector', () => {
  assert.deepEqual(workspacesDe({ role: 'client' }, { verChat: true }), []);
  assert.deepEqual(workspacesDe({ role: 'ceo' }, { verChat: true, rutaOS: 'org/work' }).map((w) => [w.nombre, w.ruta]), [['Inherent OS', 'org/work'], ['Inherent Chat', 'chat']]);
  assert.deepEqual(workspacesDe({ role: 'team' }, { verChat: false }).map((w) => w.id), ['os']);
});
t('workspaces: volver regresa a donde estabas; sin eso, al inicio de tu rol', () => {
  assert.equal(rutaDeVuelta('org/sales', 'home'), 'org/sales');
  assert.equal(rutaDeVuelta('chat/inh-x', 'org/work'), 'org/work');
  assert.equal(rutaDeVuelta('', 'org/work'), 'org/work');
  assert.equal(esApp('chat'), 'chat'); assert.equal(esApp('home'), 'os');
});
t('Chat: cambiar de conversación no reconstruye la pantalla', () => {
  const app = JS.find(([f]) => f === path.join('js', 'app.js'))[1];
  assert.match(app, /chatVivo\(\)/);
  const llm = JS.find(([f]) => f === path.join('js', 'screens', 'llm.js'))[1];
  assert.match(llm, /ponerChatVivo\(/);
});
const APP = JS.find(([f]) => f === path.join('js', 'app.js'))[1];
const NAV_SRC = APP.slice(APP.indexOf('const NAV = ['), APP.indexOf('const navDe'));
t('barra única: máximo dos niveles y nada repite al Chat', () => {
  assert.ok(!/company:/.test(NAV_SRC), 'Company era un tercer nivel');
  assert.ok(!/lat-chat"|Ask InherentOS.*data-lat/.test(APP), 'Ask InherentOS repetía al Chat');
  for (const n of ['Hoy', 'Chat', 'Agentes', 'Calendario', 'Organización', 'Empresa', 'Áreas', 'Biblioteca']) assert.ok(NAV_SRC.includes(`'${n}'`), n);
  for (const n of ['Home', 'Organization', 'Library', 'Projects', 'Tasks']) assert.ok(!NAV_SRC.includes(`'${n}'`), `${n} sigue en inglés`);
});
t('barra única: en la compu la lista del Chat vive en la barra del shell', () => {
  assert.match(APP, /id="lat-ctx"/);
  const llm = JS.find(([f]) => f === path.join('js', 'screens', 'llm.js'))[1];
  assert.match(llm, /getElementById\('lat-ctx'\)/);
  assert.ok(!/ el\.addEventListener\('(click|change|keydown|submit)', async/.test(llm.replace("el.addEventListener(tipo, fn)", '')), 'los clics también deben llegar a la lista movida');
});
t('luz: el aro se calcula sobre la superficie donde está el mouse', () => {
  const r = { left: 100, top: 40, width: 300, height: 200 };
  assert.deepEqual(aroDe(r, 160, 90), { x: 100, y: 40, ancho: 300, alto: 200, mx: 60, my: 50 });
});
t('luz: vive en todo el OS y respeta a quien pide menos movimiento', () => {
  for (const s of ['.lat', '.lc', '.llm-panel', '.card', '.home-kpi', '.gl']) assert.ok(SUPERFICIES.split(',').includes(s), s);
  assert.match(APP, /instalarLuz\(\)/);
  const luz = JS.find(([f]) => f === path.join('js', 'luz.js'))[1];
  assert.match(luz, /prefers-reduced-motion/); assert.match(luz, /hover:hover/);
});
t('vidrio: el fondo se ve a través del contenido, y lo que flota sigue sólido', () => {
  const bloque = CSS.slice(CSS.indexOf('/* ===== Vidrio de fondo'));
  assert.match(bloque, /#main\{[^}]*--ui-surf:rgb\(255 255 255 \/ \.0/);
  assert.match(bloque, /#luz\{/); assert.match(bloque, /#luz-aro/);
  for (const s of ['.avi-menu', '.ctx-pop', '.ag-foot', '.cma-tabla th']) assert.ok(bloque.includes(s), `${s} debe seguir sólido`);
  assert.match(bloque, /prefers-reduced-transparency/);
});
t('páginas: cada una se llama como en la barra y sus datos van en español', () => {
  const de = (n) => JS.find(([f]) => f === path.join('js', 'screens', n))[1];
  assert.match(de('library.js'), /<h1>Biblioteca<\/h1>/);
  assert.match(de('sales.js'), /<h1>CRM<\/h1>/);
  assert.match(de('setup.js'), /<h1>Configuración<\/h1>/);
  assert.match(de('harness.js'), /'Conexiones'/);
  for (const n of ['Active projects', 'Tasks due', 'Monthly revenue', 'Active clients', 'Ask InherentOS anything" data-act']) assert.ok(!de('home.js').includes(n), n);
});

console.log(`\n${ok} pruebas del sistema de diseño pasaron`);
