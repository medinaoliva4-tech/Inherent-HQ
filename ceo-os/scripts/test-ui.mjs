// Pruebas del sistema de diseño (sin navegador): los íconos que usa el OS existen, cada color tiene día y noche,
// y el texto se lee (contraste AA) en los dos temas.
// npm run test:ui
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { tieneIco, svgIco, nombreIco } from '../public/js/iconos.js';
import { contraste } from '../public/js/sistema-visual.js';
import { workspacesDe, rutaDeVuelta, esApp } from '../public/js/workspaces.js';
import { soloCompu } from '../public/js/pocket.js';
import { limpiarMarketing, veredicto, analizarCanales, aMovimiento, equilibrio } from '../public/js/marketing-datos.js';
import { rutaAccion, leerReproduccion, motivoSpotify, tiempo, idEquipo, elegirEquipo, fotoPermitida, rutaPortada, leerEquipos } from '../public/js/spotify-datos.js';
import { limpiarEstrategia, analizarMeta, resumenVoces } from '../public/js/estrategia-datos.js';
import { conLente, LENTE_HORMOZI } from '../public/js/llm/modos.js';
import { limpiarProduccion, analizarPiezas, estadoEntrega } from '../public/js/produccion-datos.js';
import { migasDe } from '../public/js/migas.js';
import { limpiarEmbudo, analizarEmbudo, analizarLineas, etapasDeLeads, idEmbudo } from '../public/js/embudo-datos.js';
import { MESAS, FUERA } from '../public/js/mesas.js';
import { HERRAMIENTAS, WORKSPACES } from '../public/js/herramientas.js';
import { limpiarMovimiento, errorMovimiento, filtrarMovimientos, resumenMovimientos } from '../public/js/movimientos-datos.js';
import { setupVoz, aPcm16, aFloat, leerMensaje, urlVoz } from '../public/js/voz-gemini.js';
import { estadoApp } from '../public/js/app-mac-estado.js';
import { siguiente, limpiarParaVoz, frasesNuevas, brilloDelAro } from '../public/js/conversacion.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const RAIZ = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'public');
const archivos = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
const JS = archivos(path.join(RAIZ, 'js')).map((f) => [path.relative(RAIZ, f), fs.readFileSync(f, 'utf8')]);
const PRIM = fs.readFileSync(path.join(RAIZ, 'primitives.css'), 'utf8'); // los tokens viven en primitives.css
const CSS = PRIM + '\n' + fs.readFileSync(path.join(RAIZ, 'app.css'), 'utf8');

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
const v2 = CSS.slice(CSS.indexOf('/* ===================== SISTEMA v2'));
// El bloque de tokens --ui-* de un selector (el primero que trae --ui-bg).
const bloque = (sel) => { let i = -1; do { i = PRIM.indexOf(sel + '{', i + 1); } while (i >= 0 && !PRIM.slice(i, PRIM.indexOf('\n}', i)).includes('--ui-bg:')); const j = PRIM.indexOf('\n}', i); return PRIM.slice(i, j); };
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
  // El texto de la acción principal se lee en ambos temas.
  for (const [tema, T] of [['día', DIA], ['noche', NOCHE]]) { const c = contraste(T['ui-acc-ink'], T['ui-acc']); if (c < 4.5) malos.push(`${tema}: texto de acción = ${c}`); }
  assert.deepEqual(malos, []);
});

t('las zonas de papel (cotización, portadas) usan grises neutros', () => {
  const papel = v2.match(/:is\(\.qdoc,\.feat,\.bx,\.rview,\.recbar,\.inbox,\.sp-cover\)\{([^}]*)\}/);
  assert.ok(papel, 'falta la regla de papel');
  for (const k of ['--bg:var(--ui-paper-bg)', '--ink:var(--ui-paper-ink)', '--surface:var(--ui-paper-surf)', '--ui-ink:var(--ui-paper-ink)']) assert.ok(papel[1].includes(k), k);
  const tokens = fs.readFileSync(path.join(RAIZ, 'primitives.css'), 'utf8');
  for (const k of ['--ui-paper-bg:#f4f4f5', '--ui-paper-ink:#18181b', '--ui-paper-surf:#ffffff']) assert.ok(tokens.includes(k), k);
});

t('el tema arranca antes de pintar y sin destellos', () => {
  const idx = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  assert.ok(idx.indexOf('/js/tema-boot.js') > 0 && idx.indexOf('/js/tema-boot.js') < idx.indexOf('/app.css'), 'tema-boot va en el head, antes del CSS');
  const boot = fs.readFileSync(path.join(RAIZ, 'js/tema-boot.js'), 'utf8');
  const iniciar = (guardado, luz) => {
    const attrs = {}, meta = {}, chat = {}, memoria = {};
    let alCambiar;
    const sistema = { matches: luz, addEventListener: (_ev, fn) => { alCambiar = fn; } };
    const document = {
      documentElement: { setAttribute: (k, v) => { attrs[k] = v; } },
      querySelector: (s) => s === '.llm' ? { setAttribute: (k, v) => { chat[k] = v; } } : { setAttribute: (k, v) => { meta[k] = v; } },
    };
    const window = { matchMedia: () => sistema };
    const localStorage = { getItem: () => guardado, setItem: (k, v) => { memoria[k] = v; } };
    vm.runInNewContext(boot, { document, window, localStorage });
    return { attrs, meta, chat, memoria, sistema, alCambiar, tema: window.inherentTema };
  };
  const automatico = iniciar(null, true);
  assert.equal(automatico.attrs['data-theme'], 'light');
  automatico.sistema.matches = false; automatico.alCambiar();
  assert.equal(automatico.attrs['data-theme'], 'dark');
  assert.equal(automatico.meta.content, '#0d0d0e');
  automatico.tema.elegir('claro');
  assert.equal(automatico.attrs['data-theme'], 'light');
  assert.equal(automatico.memoria['os.modo'], 'claro');
  assert.equal(automatico.chat['data-tema'], 'dia');
  assert.equal(iniciar('oscuro', true).attrs['data-theme'], 'dark');
  assert.equal(NOCHE['ui-bg'], '#0d0d0e');
});

const v3 = CSS.slice(CSS.indexOf('SISTEMA v3 (PLAN-GATEWAY')) + '\n' + PRIM; // los tokens viven en primitives.css
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
t('light mode: el texto se lee sobre blanco y silver', () => {
  const b = PRIM.slice(PRIM.indexOf(':root[data-theme="light"]{')), v = (k) => b.match(new RegExp(`--${k}:(#[0-9a-f]{6})`))[1];
  const malos = []; for (const tx of ['ui-ink', 'ui-ink2', 'ui-mut']) for (const f of ['ui-bg', 'ui-surf', 'ui-side']) { const c = contraste(v(tx), v(f)); if (c < 4.5) malos.push(`${tx}/${f}=${c}`); }
  assert.deepEqual(malos, []);
  assert.ok(!CSS.split('/* Chat: esconder el panel')[1].slice(0, 3000).includes('rgb(255 255 255 / .08)'));
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
t('Chat y Code conservan su propia columna de carpetas', () => {
  const llm = JS.find(([f]) => f === path.join('js', 'screens', 'llm.js'))[1];
  assert.match(llm, /const lado = \(\) => C\('llm-side'\)/);
  assert.match(llm, /ch-volver-os/);
  assert.doesNotMatch(llm, /getElementById\('lat-ctx'\)/);
  assert.match(CSS, /html\[data-pantalla="chat"\] \.lat\{display:none\}/);
});
t('el fondo no instala luz que siga el cursor', () => {
  assert.doesNotMatch(APP, /instalarLuz\(\)/);
  assert.doesNotMatch(CSS, /#luz(?:-aro)?\b/);
});
t('vidrio: el fondo se ve a través del contenido, y lo que flota sigue sólido', () => {
  const bloque = CSS.slice(CSS.indexOf('/* ===== Vidrio de fondo'));
  assert.match(bloque, /#main\{[^}]*--ui-surf:rgb\(var\(--ui-tint\) \/ \.0/);
  for (const s of ['.ui-menu', '.ui-dlg', '.ag-foot', '.cma-tabla th']) assert.ok(bloque.includes(s), `${s} debe seguir sólido`);
  assert.match(bloque, /prefers-reduced-transparency/);
});
t('vidrio real: en la app de la Mac se ve lo que hay detrás de la ventana', () => {
  const main = fs.readFileSync(path.join(RAIZ, '..', 'escritorio', 'main.js'), 'utf8');
  const pre = fs.readFileSync(path.join(RAIZ, '..', 'escritorio', 'preload.js'), 'utf8');
  const boot = fs.readFileSync(path.join(RAIZ, 'js/tema-boot.js'), 'utf8');
  assert.match(main, /vibrancy:\s*'under-window'/); assert.match(main, /'#00000000'/);
  assert.match(pre, /vidrio:/);
  assert.match(boot, /inherentEscritorio[^;]*vidrio/); // una app vieja no pide transparencia: se quedaría sin fondo
  assert.match(CSS, /html\[data-vidrio="real"\]\{background:rgb\(/);
});
t('vidrio en la web: formas grandes detrás, sin textura y apagadas si piden menos transparencia', () => {
  const bloque = CSS.slice(CSS.indexOf('/* ===== Vidrio de fondo'));
  assert.match(bloque, /html::before,html::after\{/);
  assert.match(bloque, /prefers-reduced-transparency:reduce\)\{[^\n]*html::before/);
});
t('Pocket: lo de pantalla grande se abre en la compu y el día a día se queda', () => {
  for (const r of ['org/setup', 'org/team/vistas', 'org/team/laya', 'org/finanzas/profit', 'org/operations/time', 'ai/agentes/abc1/workflow']) assert.ok(soloCompu(r), r);
  for (const r of ['home', 'chat', 'org/work', 'org/operations', 'org/finanzas/fact', 'org/team/org', 'ai/agentes', 'ai/agentes/abc1', 'org/clients/akai/info']) assert.ok(!soloCompu(r), r);
  assert.match(APP, /soloCompu\(cur\.url\)/);
});
t('Pocket: mapas y tableros cambian de forma en el iPhone', () => {
  const b = CSS.slice(CSS.indexOf('/* ===== Pocket'));
  assert.match(b, /\.wc-cal \.dh/); assert.match(b, /\.kb-board\{display:grid;grid-template-columns:minmax\(0,1fr\)/); assert.match(b, /\.mt-side\{/);
  assert.match(b, /\.ainoti,/);
});
t('conversación: el mic grande pausa, detiene o interrumpe según el momento', () => {
  assert.equal(siguiente('escuchando', 'mic'), 'pausa'); assert.equal(siguiente('pausa', 'mic'), 'escuchando');
  assert.equal(siguiente('hablando', 'mic'), 'escuchando'); assert.equal(siguiente('pensando', 'mic'), 'escuchando');
  assert.equal(siguiente('escuchando', 'enviado'), 'pensando'); assert.equal(siguiente('pensando', 'voz'), 'hablando');
  assert.equal(siguiente('pausa', 'fin'), 'pausa'); assert.equal(siguiente('hablando', 'fin'), 'escuchando');
});
t('conversación: en voz alta no se leen código, enlaces ni tablas', () => {
  assert.equal(limpiarParaVoz('**Hola** [mira](https://x.co)\n```js\nconst a\n```\n| a | b |\n- uno'), 'Hola mira uno');
});
t('conversación: las frases se dicen enteras y lo último sale al terminar', () => {
  const a = frasesNuevas('Hola Rodrigo. Hoy tienes', 0);
  assert.deepEqual(a.frases, ['Hola Rodrigo.']);
  const b = frasesNuevas('Hola Rodrigo. Hoy tienes tres', a.dichas, { fin: true });
  assert.deepEqual(b.frases, ['Hoy tienes tres']); assert.equal(b.dichas, 'Hola Rodrigo. Hoy tienes tres'.length);
});
t('conversación: el aro brilla en su banda y se apaga afuera', () => {
  assert.equal(brilloDelAro(100, 100, 30), 1); assert.equal(brilloDelAro(131, 100, 30), 0); assert.ok(brilloDelAro(115, 100, 30) < 1);
});
t('conversación: usa los colores de Inherent y se abre desde el Chat', () => {
  const b = CSS.slice(CSS.indexOf('/* ===== Modo conversación'));
  assert.match(b, /\.vz-m\{/); assert.ok(!/#e[0-9a-f]5|orange/i.test(b.slice(0, 2600)));
  const llm = JS.find(([f]) => f === path.join('js', 'screens', 'llm.js'))[1];
  assert.match(llm, /abrirConversacion\(/); assert.match(llm, /PROMPT_VOZ/);
});
t('ventana de Mac: toda es la app, sin barra de título aparte', () => {
  const main = fs.readFileSync(path.join(RAIZ, '..', 'escritorio', 'main.js'), 'utf8');
  assert.match(main, /titleBarStyle:\s*'hiddenInset'/);
  assert.match(CSS, /-webkit-app-region:drag/); assert.match(CSS, /-webkit-app-region:no-drag/);
});
t('barra del OS: el Chat se abre desde el selector, no desde una fila', () => {
  assert.match(NAV_SRC, /id: 'chat'[^\n]*oculto: true/);
  assert.match(APP, /!n\.oculto/);
  assert.ok(!APP.includes('lat-nueva'), 'Nueva conversación vive dentro del Chat');
  assert.ok(!/const latIt = [^\n]*href="#\/\$\{ruta\}" title=/.test(APP), 'la etiqueta ya se lee: sin aviso encima');
});
t('transiciones (Apple Motion): breves, sin desplazamiento y se pueden interrumpir', () => {
  const b = CSS.slice(CSS.indexOf('/* ===== Foundations'));
  assert.match(b, /::view-transition\{pointer-events:none\}/);
  assert.match(b, /view-transition-old\(vt-main\)\{animation:vtFuera 110ms/);
  assert.match(b, /prefers-contrast:more/);
});
t('acentos: azul en lo activo y rojo en lo que borra', () => {
  const b = CSS.slice(CSS.indexOf('/* ===== Acentos')) + PRIM;
  assert.match(b, /--ui-azul:#4a86e8/); assert.match(b, /--ui-rojo:#ff6b5e/);
  assert.match(b, /input\.switch:checked/); assert.match(b, /\.sp-meter i/); assert.match(b, /data-act="del"/);
});
t('sin café: el buscador es neutro', () => {
  assert.ok(!/rgb\(33 27 22/.test(CSS));
  assert.match(CSS, /\.spot\{border:0;background:rgb\(28 28 30/);
});
t('entrada al OS: neutra, sin café ni textura', () => {
  const b = CSS.slice(CSS.indexOf('/* ===== Entrada al OS'));
  assert.match(b, /\.login\{[^}]*#0d0d0e/); assert.ok(!APP.includes('class="art"'), 'la entrada no lleva foto'); assert.match(b, /\.login \.side::after\{display:none\}/);
  assert.ok(!/style="[^"]*--cream/.test(APP));
});
t('app de Mac: dictado y conversación usan el dictado del sistema', () => {
  const main = fs.readFileSync(path.join(RAIZ, '..', 'escritorio', 'main.js'), 'utf8');
  const pre = fs.readFileSync(path.join(RAIZ, '..', 'escritorio', 'preload.js'), 'utf8');
  assert.match(main, /sendActionToFirstResponder\('startDictation:'\)/); assert.match(pre, /dictar:/);
  const voz = JS.find(([f]) => f === path.join('js', 'voz.js'))[1];
  const ui = JS.find(([f]) => f === path.join('js', 'conversacion-ui.js'))[1];
  assert.match(voz, /inherentEscritorio\?\.dictar/); assert.match(ui, /class DictadoMac/);
});
t('Pocket: arriba el menú y el título; todo vive en el menú lateral', () => {
  assert.match(APP, /class="top-hoja" data-hoja="mas"/); assert.match(APP, /id="top-t"/); assert.match(APP, /hoja-nueva/);
  const b = CSS.slice(CSS.indexOf('/* ===== Pocket'));
  assert.match(b, /\.nav-cel\{display:none!important\}/); assert.match(b, /\.hoja\{top:0;right:auto/);
});
t('voz real: setup con Kore, transcripción y sin llave en el navegador', () => {
  const s = setupVoz({ modelo: 'gemini-3.8-live', voz: 'Kore', sistema: 'x' }).setup;
  assert.equal(s.model, 'models/gemini-3.8-live');
  assert.equal(s.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Kore');
  assert.deepEqual(s.inputAudioTranscription, {}); assert.deepEqual(s.outputAudioTranscription, {});
  assert.equal(setupVoz({ modelo: 'm', voz: 'K', sistema: 'x', handle: 'h' }).setup.sessionResumption.handle, 'h');
  assert.match(urlVoz('a/b'), /access_token=a%2Fb$/);
  for (const [f, s2] of JS) assert.ok(!/GEMINI_API_KEY/.test(s2), f);
  assert.match(fs.readFileSync(path.join(RAIZ, '..', 'vercel.json'), 'utf8'), /connect-src[^;]*wss:\/\/generativelanguage\.googleapis\.com/);
});
t('voz real: el audio se convierte bien', () => {
  const s = aPcm16(new Float32Array([0, 1, -1, 0.5, 0, 0]), 48000);
  assert.deepEqual([...s], [0, 16383]);
  assert.equal(aPcm16(new Float32Array(4800), 48000).length, 1600);
  const f = aFloat(new Uint8Array(new Int16Array([0, 16384]).buffer)); assert.equal(f[1], 0.5);
});
t('voz real: lee interrupción, fin, audio y reconexión', () => {
  const m = leerMensaje({ serverContent: { interrupted: true, turnComplete: true, inputTranscription: { text: 'hola' }, modelTurn: { parts: [{ inlineData: { data: 'QQ' } }] } } });
  assert.ok(m.interrumpido && m.fin); assert.equal(m.oido, 'hola'); assert.deepEqual(m.audio, ['QQ']);
  assert.equal(leerMensaje({ sessionResumptionUpdate: { resumable: true, newHandle: 'h' } }).handle, 'h');
  assert.ok(leerMensaje({ goAway: {} }).salir); assert.ok(leerMensaje({ setupComplete: {} }).listo);
});
t('Spotify: lee lo que suena y solo acepta los cuatro controles', () => {
  const r = leerReproduccion({ is_playing: true, device: { name: 'Mac' }, item: { name: 'Canción', artists: [{ name: 'A' }, { name: 'B' }], album: { images: [{ url: 'g' }, { url: 'p' }] } } });
  assert.deepEqual([r.sonando, r.titulo, r.artista, r.portada, r.dispositivo], [true, 'Canción', 'A, B', 'p', 'Mac']);
  assert.equal(leerReproduccion(null).sonando, false);
  assert.ok(['play', 'pause', 'next', 'previous'].every((a) => rutaAccion(a)));
});
t('Spotify: control escondible, solo CEO y sin secreto', () => {
  assert.match(APP, /id="lat-sp"/);
  const js = JS.find(([f]) => f === path.join('js', 'spotify.js'))[1];
  assert.match(js, /me\?\.role !== 'ceo'/); assert.match(js, /data-sp="cerrar"/);
  const srv = fs.readFileSync(path.join(RAIZ, '..', 'api', '_lib', 'spotify.js'), 'utf8');
  assert.match(srv, /code_challenge_method: 'S256'/); assert.ok(!/client_secret/.test(srv));
});
t('áreas: tres mesas por área y cada herramienta en un solo lugar', () => {
  const usadas = [];
  for (const w of WORKSPACES) { assert.equal(MESAS[w.id].mesas.length, 3, w.id); assert.ok(MESAS[w.id].numero, `${w.id} sin número`); for (const m of MESAS[w.id].mesas) usadas.push(...m.herramientas); }
  assert.equal(new Set(usadas).size, usadas.length, 'una herramienta quedó en dos mesas');
  assert.deepEqual([...usadas, ...FUERA].sort(), HERRAMIENTAS.map((h) => h.id).sort());
});
t('movimientos: guarda lo esencial y el resumen cuadra', () => {
  const m = limpiarMovimiento({ titulo: ' Campaña ', client_slug: 'nao', area: 'nada', costo: 'Q2,500', espera: 'Más mesas', decision: 'Otra' });
  assert.deepEqual([m.titulo, m.area, m.costo, m.decision], ['Campaña', 'strategy', 2500, 'Pendiente']);
  assert.equal(errorMovimiento(limpiarMovimiento({})), 'Escribe qué se hizo');
  assert.equal(errorMovimiento(m), '');
  const xs = filtrarMovimientos([{ ...m, area: 'marketing', paso: 'x', decision: 'Repetir', fecha: '2026-11-01' }, { ...m, area: 'marketing', costo: 500, fecha: '2026-11-02' }, { ...m, area: 'creative' }, { ...m, area: 'marketing', archivado: true }], { area: 'marketing' });
  assert.equal(xs.length, 2); assert.equal(xs[0].fecha, '2026-11-02');
  assert.deepEqual(resumenMovimientos(xs), { total: 2, invertido: 3000, sinResultado: 1, repetir: 1, parar: 0 });
});
t('resultados: el veredicto depende del margen', () => {
  assert.equal(equilibrio(50), 2); assert.equal(equilibrio(0), null);
  assert.equal(veredicto({ gasto: 100, ingreso: 300 }, 50), 'Escalar');
  assert.equal(veredicto({ gasto: 100, ingreso: 200 }, 50), 'Mantener');
  assert.equal(veredicto({ gasto: 100, ingreso: 199 }, 50), 'Parar o cambiar');
  assert.equal(veredicto({ gasto: 100, ingreso: 500 }, 0), 'Falta margen');
  assert.equal(veredicto({ gasto: 0, ingreso: 500 }, 50), 'Sin gasto');
  const r = analizarCanales([{ nombre: 'A', gasto: 100, ingreso: 100, leads: 5, ventas: 1 }, { nombre: 'B', gasto: 100, ingreso: 400, leads: 0, ventas: 2 }], 50);
  assert.equal(r.filas[0].nombre, 'B'); assert.equal(r.filas[1].porLead, 20); assert.equal(r.roas, 2.5);
});
t('radar: tres oportunidades como máximo y solo enlaces web', () => {
  const o = { competidor: 'X', movida: 'Y', fuente: 'javascript:alert(1)' };
  const d = limpiarMarketing({ radar: [o, o, o, o] });
  assert.equal(d.radar.length, 3); assert.equal(d.radar[0].fuente, '');
  assert.equal(limpiarMarketing({ canales: [{ nombre: 'Meta', gasto: '-5' }] }).canales[0].gasto, 0);
  assert.equal(aMovimiento('nao', '2026-11', 'T', 'E').area, 'marketing');
});
t('meta: dice qué haría falta por palanca', () => {
  const a = analizarMeta(limpiarEstrategia({ meta: 40000, actual: 20000, ticket: 2000, leads: 100, cierre_pct: 10 }));
  assert.equal(a.falta, 20000); assert.equal(a.avance, 0.5); assert.equal(a.ventasMeta, 20);
  assert.deepEqual(a.palancas.map((p) => Math.round(p.a * 100) / 100), [200, 0.2, 4000]);
  const no = analizarMeta(limpiarEstrategia({ meta: 300000, actual: 20000, ticket: 2000, leads: 100, cierre_pct: 10 }));
  assert.equal(no.palancas[1].posible, false);
  assert.equal(analizarMeta(limpiarEstrategia({ meta: 100 })).listo, false);
  assert.deepEqual(analizarMeta(limpiarEstrategia({ meta: 100, actual: 200, ticket: 1, leads: 1, cierre_pct: 1 })).palancas, []);
  assert.equal(limpiarEstrategia({ pasos: [1, 2, 3, 4].map((n) => ({ texto: `p${n}` })) }).pasos.length, 3);
});
t('voz: cuenta por tipo y agrupa temas sin importar mayúsculas', () => {
  const d = limpiarEstrategia({ voces: [{ frase: 'a', tipo: 'Deseo', tema: 'Precio' }, { frase: 'b', tipo: 'Objeción', tema: 'precio' }, { frase: '', tipo: 'Deseo' }, { frase: 'c', tipo: 'otro' }] });
  const r = resumenVoces(d.voces);
  assert.equal(d.voces.length, 3); assert.equal(r.porTipo.Deseo, 1); assert.equal(r.porTipo.Dolor, 1);
  assert.deepEqual(r.temas, [{ tema: 'Precio', n: 2 }]);
});
t('Chat: la lente Hormozi se prende y se apaga', () => {
  assert.equal(conLente('base', false), 'base');
  assert.equal(conLente('base', true), `base\n\n${LENTE_HORMOZI}`);
});
t('producción: costo, margen y entrega por pieza', () => {
  const d = limpiarProduccion({ costo_hora: 100, piezas: [{ nombre: 'Reel', horas: 5, costo: 200, cobrado: 1000, promesa: '2026-11-10', entrega: '2026-11-09' }, { nombre: 'Foto', horas: 10, costo: 500, cobrado: 800, promesa: '2026-11-10', entrega: '2026-11-12' }, { nombre: 'Post', horas: 0, cobrado: 300 }, { nombre: '' }] });
  const r = analizarPiezas(d.piezas, d.costo_hora);
  assert.equal(r.filas.length, 3); assert.equal(r.total, 2200); assert.equal(r.margen, -100);
  assert.equal(r.aTiempo, 0.5); assert.equal(r.peor.nombre, 'Foto'); assert.equal(r.peor.margen, -700);
  assert.equal(estadoEntrega({ entrega: '' }), 'Pendiente'); assert.equal(estadoEntrega({ entrega: '2026-11-01' }), 'Sin promesa');
  assert.equal(analizarPiezas([], 0).aTiempo, null);
});
t('producción: el enlace de costos es solo para el CEO', () => {
  const e = MESAS.production.mesas.flatMap((m) => m.enlaces).find(([, r]) => r.endsWith('/costo'));
  assert.equal(e[2], 'ceo');
});
t('embudo: encuentra la mayor fuga y le pone valor', () => {
  const d = limpiarEmbudo({ client_slug: 'nao', mes: '2026-11', ticket: '1000', margen_pct: 50, etapas: [{ n: 1000 }, { n: 100 }, { n: 50 }, { n: 10 }, { n: 5 }] });
  const a = analizarEmbudo(d.etapas, d);
  assert.deepEqual([a.fuga.de, a.fuga.a], ['Calificados', 'Propuestas']);
  assert.equal(a.fuga.tasa, 0.2);
  assert.equal(Math.round(a.fuga.extraClientes * 10) / 10, 2.5);
  assert.equal(Math.round(a.fuga.extraMargen), 1250);
  assert.equal(analizarEmbudo(limpiarEmbudo({}).etapas).fuga, null);
  assert.equal(idEmbudo('nao', '2026-11'), 'nao--2026-11');
});
t('embudo: del CRM cuenta solo el mes y sin prospectos', () => {
  const l = (stage, m = '2026-11') => ({ stage, _meta: { created_at: `${m}-03` } });
  const e = etapasDeLeads([l('Nuevo'), l('Reunión'), l('Propuesta'), l('Ganado'), l('Perdido'), l('Prospecto'), l('Ganado', '2026-10')], '2026-11');
  assert.deepEqual(e.map((x) => x.n), [5, 5, 3, 2, 1]);
});
t('rentabilidad: ordena por margen y marca la peor línea', () => {
  const r = analizarLineas(limpiarEmbudo({ lineas: [{ nombre: 'A', ingreso: 1000, costo: 1200 }, { nombre: 'B', ingreso: 2000, costo: 500 }, { nombre: '', ingreso: 9 }] }).lineas);
  assert.equal(r.mejor.nombre, 'B'); assert.equal(r.peor.nombre, 'A'); assert.equal(r.peor.margen, -200); assert.equal(r.margen, 1300); assert.equal(r.filas.length, 2);
});
t('Spotify: volumen y tiempo se acotan', () => {
  assert.deepEqual(rutaAccion('volumen', 140), ['PUT', 'volume?volume_percent=100']);
  assert.deepEqual(rutaAccion('buscar', -5), ['PUT', 'seek?position_ms=0']);
  assert.deepEqual(rutaAccion('play'), ['PUT', 'play']);
  assert.equal(rutaAccion('volumen', 'x'), null);
  assert.equal(rutaAccion('constructor'), null);
  assert.equal(tiempo(125000), '2:05');
});
t('Spotify: solo acepta ids de equipo limpios y marca el equipo activo', () => {
  assert.equal(idEquipo('abc-123_x'), 'abc-123_x'); assert.equal(idEquipo('a/b?c'), ''); assert.equal(idEquipo(''), '');
  assert.equal(leerReproduccion({ device: { is_active: true } }).activo, true);
  assert.equal(leerReproduccion(null).activo, false);
});
t('Spotify: prefiere el equipo activo, luego la compu', () => {
  const tel = { id: 't', type: 'Smartphone' }, mac = { id: 'm', type: 'Computer' };
  assert.equal(elegirEquipo([tel, mac]).id, 'm');
  assert.equal(elegirEquipo([mac, { ...tel, is_active: true }]).id, 't');
  assert.equal(elegirEquipo([{ ...mac, is_restricted: true }]), null);
  assert.equal(elegirEquipo([]), null);
});
t('Spotify: solo pasa fotos de Spotify por el servidor', () => {
  assert.ok(fotoPermitida('https://i.scdn.co/image/a')); assert.ok(fotoPermitida('https://image-cdn-ak.spotifycdn.com/image/a'));
  assert.ok(!fotoPermitida('http://i.scdn.co/a')); assert.ok(!fotoPermitida('https://scdn.co.evil.com/a')); assert.ok(!fotoPermitida('nada'));
  assert.equal(rutaPortada('https://evil.com/a'), '');
  assert.match(rutaPortada('https://i.scdn.co/image/a'), /^\/api\/spotify\/portada\?u=https%3A/);
  assert.deepEqual(leerEquipos({ devices: [{ id: 'a', name: 'Mac', type: 'Computer', is_active: true }, { id: 'b', is_restricted: true }] }), [{ id: 'a', nombre: 'Mac', tipo: 'Computer', activo: true }]);
});
t('migas: la dirección dice cliente, área y herramienta', () => {
  const n = { cliente: () => 'AKAI', area: () => 'Strategy', herramienta: () => 'Radar', pestana: () => 'Research' };
  assert.deepEqual(migasDe('ws/strategy/akai/overview', n).map((x) => x.t), ['Clientes', 'AKAI', 'Strategy']);
  assert.deepEqual(migasDe('ws/strategy/akai/research/competitor-radar', n).map((x) => x.t), ['Clientes', 'AKAI', 'Strategy', 'Research', 'Radar']);
  assert.deepEqual(migasDe('areas/strategy/meta', n).map((x) => x.t), ['Áreas', 'Strategy', 'Mapa de la Meta']);
  assert.deepEqual(migasDe('org/clients/akai/x', n).map((x) => x.t), ['Clientes', 'AKAI']);
  assert.deepEqual(migasDe('home', { pagina: 'Hoy' }).map((x) => x.t), ['Hoy']);
});
t('Spotify: la política deja cargar el reproductor oficial', () => {
  const v = fs.readFileSync(path.join(RAIZ, '..', 'vercel.json'), 'utf8');
  assert.match(v, /script-src 'self' https:\/\/sdk\.scdn\.co;/);
  assert.match(v, /frame-src [^;]*https:\/\/sdk\.scdn\.co/);
  assert.match(v, /encrypted-media=\(self/);
});
t('Spotify: lee el player y dice el motivo real', () => {
  const r = leerReproduccion({ is_playing: true, progress_ms: 1000, device: { name: 'Mac', volume_percent: 40, supports_volume: true }, item: { name: 'A', duration_ms: 9000, artists: [{ name: 'B' }], album: { images: [{ url: 'g' }, { url: 'm' }, { url: 'c' }] } } });
  assert.deepEqual([r.portada, r.volumen, r.duracion], ['m', 40, 9000]);
  assert.equal(leerReproduccion({ device: { supports_volume: false, volume_percent: 3 } }).volumen, null);
  assert.match(motivoSpotify(403, 'PREMIUM_REQUIRED'), /Premium/);
  assert.match(motivoSpotify(403, 'UNKNOWN'), /no permite/);
  assert.match(motivoSpotify(404, ''), /Abre Spotify/);
});
t('Chat: el panel se esconde con un botón', () => {
  const llm = JS.find(([f]) => f === path.join('js', 'screens', 'llm.js'))[1];
  assert.match(llm, /\[data-lat=\\?"mini\\?"\]/);
  assert.ok(!/html\[data-pantalla="chat"\] \.lat-top>\.lat-ib\{display:none\}/.test(CSS));
  assert.match(CSS, /data-pantalla="chat"\]\[data-lat-mini\] \.lat\{transform/);
});
t('páginas: cada una se llama como en la barra y sus datos van en español', () => {
  const de = (n) => JS.find(([f]) => f === path.join('js', 'screens', n))[1];
  assert.match(de('library.js'), /<h1>Biblioteca<\/h1>/);
  assert.match(de('sales.js'), /<h1>CRM<\/h1>/);
  assert.match(de('setup.js'), /<h1>Configuración<\/h1>/);
  assert.match(de('harness.js'), /'Conexiones'/);
  for (const n of ['Active projects', 'Tasks due', 'Monthly revenue', 'Active clients', 'Ask InherentOS anything" data-act']) assert.ok(!de('home.js').includes(n), n);
});

t('toast: una sola capa de CSS, con tipos, acción y cola; el error no es gris', () => {
  const core = fs.readFileSync(path.join(RAIZ, 'js', 'core.js'), 'utf8');
  assert.equal((CSS.match(/^#toast\{/gm) || []).length, 1, 'un solo bloque #toast');
  assert.ok(!/#toast\.(on|err)/.test(CSS), 'ya no hay capas viejas de #toast.on / #toast.err');
  for (const k of ['toast-ok', 'toast-error', 'toast-info', 'toast-a']) assert.ok(CSS.includes('.' + k), k);
  assert.match(core, /export function toast\(msg, opts\)/); assert.match(core, /TOAST_MAX = 3/); assert.match(core, /accion/); assert.match(CSS, /\.toast-error\{background:color-mix\(in srgb,var\(--ui-bad\)/, 'el error va en tono de error, no gris');
});

console.log(`\n${ok} pruebas del sistema de diseño pasaron`);
