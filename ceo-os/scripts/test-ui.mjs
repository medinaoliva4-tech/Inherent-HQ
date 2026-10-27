// Pruebas del sistema de diseño (sin navegador): los íconos que usa el OS existen, cada color tiene día y noche,
// y el texto se lee (contraste AA) en los dos temas.
// npm run test:ui
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tieneIco, svgIco, nombreIco } from '../public/js/iconos.js';
import { contraste } from '../public/js/sistema-visual.js';

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

t('cada color tiene su valor de día y de noche', () => {
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
  assert.ok(boot.includes('#1f1e1c') && boot.includes('#faf9f6'), 'la franja del iPhone usa el fondo de cada tema');
  assert.equal(DIA['ui-bg'], '#faf9f6'); assert.equal(NOCHE['ui-bg'], '#1f1e1c');
});

console.log(`\n${ok} pruebas del sistema de diseño pasaron`);
