// Pruebas de Hook Laboratory y Copywriting Studio (public/js/marketing/hooks.js y copy.js): limpieza, lo que falta, los hooks que salen del
// research sin reescribirse, la matriz con ⚠️ SIN DATOS, los contadores contra los límites de ads-studio.js, lo que se empuja a Ads (Borrador,
// nunca aprobado), el pedido a la IA (pide su bloque y criterios, < 5 000 caracteres, sin economía de Inherent) y la lectura de su respuesta.
// node scripts/test-marketing-p2.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as H from '../public/js/marketing/hooks.js';
import * as C from '../public/js/marketing/copy.js';
import { LIMITES, limpiarVariante } from '../public/js/ads-studio.js';
import { clavePost } from '../public/js/referentes.js';
import { tieneIco } from '../public/js/iconos.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const F = '```';
const AQUI = fileURLToPath(new URL('../', import.meta.url));
const post = (o) => ({ id: `rs-${o.n}`, kind: 'research', profile: 'akai', ...o });
const P1 = post({ n: 1, url: 'https://www.instagram.com/reel/AAAAA1/', red: 'instagram', handle: 'cafe_a', format: 'reel', x: 3.2, why: { hook: '¿Sabías que tu caja chica te miente?' } });
const P2 = post({ n: 2, url: 'https://www.tiktok.com/@c/video/7300000001', red: 'tiktok', handle: 'c', format: 'reel', text: '5 errores de tu local\nlinea dos' });
const NOHOOK = post({ n: 3, url: 'https://www.instagram.com/p/NOHOOK1/', red: 'instagram' });
const CTX = { hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'AKAI' }, ficha: null, estrategia: {}, aprendizajes: [] };

// ============ Hook Laboratory ============
t('hooks: bloque y exports', () => {
  assert.equal(H.BLOQUE, 'hooks');
  for (const k of ['vacio', 'limpiar', 'faltas', 'prompt', 'leer', 'aMd', 'desdeResearch', 'grilla', 'celdaTexto']) assert.ok(k in H, k);
  assert.equal(H.CAJAS.length, 7);
});
t('hooks: desdeResearch deja el texto IGUAL, con la clave y el multiplicador del post, y sin gancho no inventa', () => {
  const hs = H.desdeResearch([P1, P2, NOHOOK]);
  assert.equal(hs.length, 2);
  assert.equal(hs[0].texto, '¿Sabías que tu caja chica te miente?'); assert.equal(hs[0].clave, clavePost(P1.url)); assert.equal(hs[0].multiplicador, 3.2);
  assert.equal(hs[1].texto, '5 errores de tu local'); assert.equal(hs[1].multiplicador, null);
  assert.equal(H.desdeResearch([P1], hs).length, 0, 'no repite uno ya traído');
});
t('hooks: sin multiplicador dice ⚠️ SIN DATOS y de dónde sale (nunca 0)', () => {
  const [, h2] = H.desdeResearch([P1, P2]);
  assert.match(H.multTexto(h2), /⚠️ SIN DATOS: sale de la Investigación/); assert.ok(!/×0\b/.test(H.multTexto(h2)));
  assert.equal(H.multTexto({ multiplicador: 3.24 }), '×3.2');
});
t('hooks: Laya sin puente dice «pendiente»; con puntaje lo muestra', () => {
  assert.equal(H.layaTexto({ laya: { puntaje: null } }), 'pendiente'); assert.equal(H.layaTexto(H.limpiarHook({ id: 'a', texto: 'x', laya: { puntaje: 3, chip: 'engancha' } })), '3 / 4 · engancha');
  assert.equal(H.limpiarHook({ id: 'a', texto: 'x', laya: { puntaje: 9 } }).laya.puntaje, null);
});
t('hooks: limpiar deja solo lo conocido, ids únicos, texto plano y pruebas de hooks/variantes que existen', () => {
  const c = H.limpiar({ hooks: [{ id: 'h1', texto: '<img src=x onerror=1>', caja: 'question', consciencia: 7, fuente: 'raro', extra: 1 }, { id: 'h1', texto: 'dup' }, { id: '', texto: 'sin id' }],
    variantes: [{ id: 'v1', nombre: 'A' }, { id: 'v1', nombre: 'B' }], pruebas: [{ hook: 'h1', variante: 'v1', metrica: 'ctr', valor: '2.5' }, { hook: 'zz', variante: 'v1', valor: 1 }, { hook: 'h1', variante: 'v1', valor: 9 }] });
  assert.equal(c.hooks.length, 1); assert.equal(c.hooks[0].consciencia, null); assert.equal(c.hooks[0].fuente, 'nuevo'); assert.ok(!('extra' in c.hooks[0]));
  assert.equal(c.variantes.length, 1); assert.equal(c.pruebas.length, 1); assert.equal(c.pruebas[0].valor, 2.5);
  assert.deepEqual(H.limpiar(null), H.vacio()); assert.deepEqual(H.limpiar('x'), H.vacio());
});
t('hooks: matriz: celda sin métrica nombra su fuente; con valor lo muestra; el valor 0 sí es dato', () => {
  const c = H.limpiar({ hooks: [{ id: 'h1', texto: 'a', caja: 'pain' }, { id: 'h2', texto: 'b', caja: 'pain' }], variantes: [{ id: 'v1', nombre: 'A' }],
    pruebas: [{ hook: 'h1', variante: 'v1', metrica: 'hook_rate', valor: 42, fuente: 'Reel 12 oct' }, { hook: 'h2', variante: 'v1', metrica: 'hook_rate', valor: 0 }] });
  assert.match(H.celdaTexto(H.celdaPrueba(c, 'h1', 'v1')), /42% · Hook rate · Reel 12 oct/); assert.match(H.celdaTexto(null), /⚠️ SIN DATOS: sale de los analytics/);
  assert.match(H.celdaTexto({ valor: null, fuente: 'Ads de octubre' }), /Ads de octubre/); assert.ok(!/SIN DATOS/.test(H.celdaTexto(H.celdaPrueba(c, 'h2', 'v1'))));
  assert.equal(H.ganadorDe(c, 'v1'), 'h1');
});
t('hooks: grilla 7 cajas × 5 niveles + sin nivel, filtro por pilar, sin caja aparte', () => {
  const c = H.limpiar({ hooks: [{ id: 'a', texto: 'a', caja: 'question', consciencia: 2, pilar: 'Educa' }, { id: 'b', texto: 'b', caja: 'question', consciencia: 2, pilar: 'Vende' }, { id: 'c', texto: 'c' }, { id: 'd', texto: 'd', caja: 'pain', archivado: true }] });
  const g = H.grilla(c); assert.equal(g.celdas.length, 7); assert.equal(g.celdas.find((x) => x.caja === 'question').niveles[2].length, 2);
  assert.equal(g.sinCaja.length, 1); assert.deepEqual(g.pilares.sort(), ['Educa', 'Vende']); assert.equal(H.grilla(c, { pilar: 'Educa' }).celdas.find((x) => x.caja === 'question').niveles[2].length, 1);
  assert.equal(g.celdas.find((x) => x.caja === 'pain').niveles.flat().length, 0, 'archivado no sale');
});
t('hooks: faltas: caja, consciencia, cierre, reescrito, claim con dato, misma caja, nuevo con multiplicador', () => {
  assert.ok(H.faltas({}).some((x) => /No hay hooks/.test(x)));
  const base = (o) => ({ hooks: [{ id: 'h1', texto: 'Hook', caja: 'question', consciencia: 2, fuente: 'nuevo', ...o }] });
  assert.deepEqual(H.faltas(base({})), []);
  assert.ok(H.faltas(base({ caja: '' })).some((x) => /no tiene caja/.test(x))); assert.ok(H.faltas(base({ consciencia: null })).some((x) => /consciencia/.test(x)));
  assert.ok(H.faltas(base({ caja: 'curiosity-gap' })).some((x) => /cierre/.test(x))); assert.deepEqual(H.faltas(base({ caja: 'story-tease', cierre: 'Se resuelve en 20 s' })), []);
  assert.ok(H.faltas(base({ caja: 'bold-claim', texto: 'Vende 3x más' })).some((x) => /OK de Branding o Ads/.test(x))); assert.deepEqual(H.faltas(base({ caja: 'bold-claim', texto: 'Vende 3x más', aprobacion: 'Branding 27 oct' })), []);
  assert.ok(H.faltas(base({ multiplicador: 2 })).some((x) => /sin post real/.test(x)));
  const rw = H.faltas({ hooks: [{ id: 'h1', texto: 'Otro texto', caja: 'question', consciencia: 2, fuente: 'research', clave: clavePost(P1.url) }] }, { research: [P1] });
  assert.ok(rw.some((x) => /reescrito/.test(x))); assert.ok(!H.faltas({ hooks: [{ id: 'h1', texto: P1.why.hook, caja: 'question', consciencia: 2, fuente: 'research', clave: clavePost(P1.url) }] }, { research: [P1] }).some((x) => /reescrito/.test(x)));
  const mismas = { hooks: ['a', 'b', 'c'].map((id) => ({ id, texto: id, caja: 'pain', consciencia: 5, fuente: 'nuevo' })) }; assert.ok(H.faltas(mismas).some((x) => /misma caja/.test(x)));
});
t('hooks: el pedido pide su bloque y criterios, < 5 000 caracteres, sin economía de Inherent ni dinero', () => {
  const p = H.prompt({ ...CTX, research: [{ texto: 'x'.repeat(300), mult: 3 }], aprendizajes: Array(10).fill('a'.repeat(200)) });
  assert.ok(p.length < 5000, `${p.length}`); assert.ok(p.includes(`${F}hooks`) && p.includes(`${F}criterios`)); assert.ok(/palabra por palabra/.test(p));
  assert.ok(!/leas ni cites inherent\/06-ECONOMIA/.test(p) === false, 'la regla de no leer economía viene del marco'); assert.ok(!/costo de Inherent:|tarifa:/i.test(p));
  assert.ok(H.prompt({}).length < 5000);
});
t('hooks: leer: buena, a medias y basura', () => {
  const r = H.leer(`ok\n${F}hooks\n{"hooks":[{"id":"h1","texto":"Hola","caja":"pain","consciencia":2}],"variantes":[],"pruebas":[]}\n${F}\n${F}criterios\n{"cumple":["a"],"falta":["b"]}\n${F}`);
  assert.equal(r.contenido.hooks.length, 1); assert.deepEqual(r.criterios, { cumple: ['a'], falta: ['b'] });
  assert.equal(H.leer(`${F}hooks\n{"hooks":[`), null); assert.equal(H.leer('nada'), null); assert.equal(H.leer(`${F}hooks\n[1,2]\n${F}`), null);
});
t('hooks: aMd con ⚠️ SIN DATOS y sin romper la tabla', () => {
  const md = H.aMd({ hooks: [{ id: 'h1', texto: 'a | b', caja: 'pain' }], variantes: [{ id: 'v1', nombre: 'A' }] });
  assert.match(md, /a \\\| b/); assert.match(md, /⚠️ SIN DATOS/); assert.match(H.aMd({}), /⚠️ SIN DATOS/);
});

// ============ Copywriting Studio ============
const act = (o = {}) => ({ id: 'a1', nombre: 'Apertura', canal: 'meta', avatar: 'Dueño', variantes: [{ id: 'v1', titulo: 'Título uno', texto: 'Texto uno', elegida: true }, { id: 'v2', titulo: 'Título dos', texto: 'Texto dos' }], ...o });
t('copy: bloque, exports y límites son los de ads-studio.js', () => {
  assert.equal(C.BLOQUE, 'copy');
  for (const k of ['vacio', 'limpiar', 'faltas', 'prompt', 'leer', 'aMd', 'contador', 'paraAds', 'faltasEmpujar']) assert.ok(k in C, k);
  assert.equal(C.CANALES.meta.campos[0][2], LIMITES.meta.texto); assert.equal(C.CANALES.meta.campos[1][2], LIMITES.meta.titulo);
  assert.equal(C.CANALES.google.campos[0][2], LIMITES.google.descripcion); assert.equal(C.CANALES.google.campos[1][2], LIMITES.google.titulo);
});
t('copy: contador cuenta caracteres reales (emoji = 1), marca el exceso y landing no tiene límite', () => {
  assert.deepEqual(C.contador('meta', 'texto', 'a'.repeat(125)), { n: 125, max: 125, pasa: false, falta: 0 });
  assert.equal(C.contador('meta', 'texto', 'a'.repeat(126)).pasa, true); assert.equal(C.contador('meta', 'titulo', '🔥'.repeat(40)).pasa, false);
  assert.equal(C.contador('google', 'titulo', 'a'.repeat(31)).pasa, true); assert.equal(C.contador('landing', 'texto', 'a'.repeat(9999)).pasa, false);
  assert.equal(C.contadorTexto(C.contador('meta', 'texto', 'hola')), '4 / 125');
});
t('copy: limpiar: solo lo conocido, una sola elegida por activo, ids únicos, canal inválido cae a meta', () => {
  const c = C.limpiar({ marco: [{ consciencia: 9, mensaje: 'x' }, { consciencia: 2, anillo: 0, mensaje: '<b>hola</b>', prueba: '' }, { consciencia: 3 }], activos: [act({ canal: 'tiktok', variantes: [{ id: 'v1', texto: 'a', elegida: true }, { id: 'v2', texto: 'b', elegida: true }, { id: 'v1', texto: 'dup' }, { texto: '' }] }), act({ id: 'a1' })] });
  assert.equal(c.marco.length, 1); assert.equal(c.marco[0].mensaje, '<b>hola</b>', 'queda como texto (la vista lo escapa)');
  assert.equal(c.activos.length, 1); assert.equal(c.activos[0].canal, 'meta'); assert.equal(c.activos[0].variantes.length, 2); assert.equal(c.activos[0].variantes.filter((v) => v.elegida).length, 1);
  assert.deepEqual(C.limpiar(null), C.vacio());
});
t('copy: celda del marco sin prueba dice ⚠️ SIN DATOS y de dónde sale', () => {
  const c = C.limpiar({ marco: [{ consciencia: 2, anillo: 0, mensaje: 'm', prueba: '' }, { consciencia: 3, anillo: 1, mensaje: 'n', prueba: 'Caso real: 12 clientes' }] });
  assert.match(C.pruebaTexto(C.celdaMarco(c, 2, 0)), /⚠️ SIN DATOS: sale de un caso/); assert.equal(C.pruebaTexto(C.celdaMarco(c, 3, 1)), 'Caso real: 12 clientes'); assert.equal(C.celdaMarco(c, 5, 4), null);
});
t('copy: faltas: marco, prueba, ≥ 2 variantes, elegida y límite del canal', () => {
  assert.ok(C.faltas({}).some((x) => /marco/.test(x)));
  const buen = { marco: [{ consciencia: 2, anillo: 0, mensaje: 'm', prueba: 'real' }], activos: [act()] };
  assert.deepEqual(C.faltas(buen), []);
  assert.ok(C.faltas({ ...buen, marco: [{ consciencia: 2, anillo: 0, mensaje: 'm' }] }).some((x) => /no tiene prueba/.test(x)));
  assert.ok(C.faltas({ ...buen, activos: [act({ variantes: [{ id: 'v1', texto: 'a', elegida: true }] })] }).some((x) => /al menos 2/.test(x)));
  assert.ok(C.faltas({ ...buen, activos: [act({ variantes: [{ id: 'v1', texto: 'a' }, { id: 'v2', texto: 'b' }] })] }).some((x) => /no tiene variante elegida/.test(x)));
  assert.ok(C.faltas({ ...buen, activos: [act({ variantes: [{ id: 'v1', texto: 'a'.repeat(130), elegida: true }, { id: 'v2', texto: 'b' }] })] }).some((x) => /sobre el límite/.test(x)));
});
t('copy: empujar a Ads crea un Borrador SIN estado ni aprobación y respeta lo que ads-studio.js acepta', () => {
  const a = C.limpiar({ activos: [act()] }).activos[0], v = a.variantes[0], p = C.paraAds(a, v, { perfil: 'akai', marcaNombre: 'AKAI' });
  assert.equal(p.profile, 'akai'); assert.equal(p.plataforma, 'meta'); assert.equal(p.title, 'Título uno'); assert.equal(p.caption, 'Texto uno'); assert.equal(p.meta.cta, 'Más información');
  assert.ok(!('estado' in p) && !('aprobada' in p) && !('lanzar' in p), 'nada de estado: el servidor lo deja Borrador');
  assert.deepEqual(limpiarVariante(p).meta, p.meta); assert.match(p.nota, /falta el OK del CEO/);
  assert.equal(C.paraAds(act({ canal: 'caption' }), v, { perfil: 'akai' }), null, 'el caption no va a Ads');
  const g = C.paraAds({ ...a, canal: 'google' }, v, { perfil: 'akai' }); assert.deepEqual(g.google.titulos, ['Título uno']); assert.ok(C.faltasParaAprobar({ ...a, canal: 'google' }, v, { perfil: 'akai' }).some((x) => /3 títulos/.test(x)), 'Google pide más títulos antes del OK');
});
t('copy: no se empuja lo que pasa el límite ni lo vacío', () => {
  const a = C.limpiar({ activos: [act()] }).activos[0];
  assert.deepEqual(C.faltasEmpujar(a, a.variantes[0]), []); assert.ok(C.faltasEmpujar(a, { ...a.variantes[0], texto: 'a'.repeat(130) })[0].includes('5 caracteres')); assert.ok(C.faltasEmpujar(a, { titulo: 'x', texto: '' }).some((x) => /Falta el texto/.test(x)));
  assert.deepEqual(C.faltasEmpujar(a, null), ['Elige una variante']);
});
t('copy: el pedido pide su bloque y criterios, < 5 000 caracteres, con los límites del canal', () => {
  const p = C.prompt({ ...CTX, aprendizajes: Array(10).fill('a'.repeat(200)) });
  assert.ok(p.length < 5000, `${p.length}`); assert.ok(p.includes(`${F}copy`) && p.includes(`${F}criterios`)); assert.ok(p.includes(String(LIMITES.meta.texto)) && /no la inventes/.test(p) && /Borrador/.test(p));
  assert.ok(C.prompt({}).length < 5000);
});
t('copy: leer: buena, a medias y basura; aMd con contador y ⚠️ SIN DATOS', () => {
  const r = C.leer(`${F}copy\n{"marco":[{"consciencia":2,"anillo":0,"mensaje":"m"}],"activos":[${JSON.stringify(act())}]}\n${F}\n${F}criterios\n{"cumple":[],"falta":["x"]}\n${F}`);
  assert.equal(r.contenido.activos[0].variantes.length, 2); assert.deepEqual(r.criterios.falta, ['x']); assert.equal(C.leer(`${F}copy\n{"marco":`), null); assert.equal(C.leer(''), null);
  const md = C.aMd(r.contenido); assert.match(md, /texto principal \d+ \/ 125/); assert.match(md, /⚠️ SIN DATOS/); assert.match(md, /\(elegida\)/);
});
t('copy: resumen de una línea', () => { assert.equal(C.resumen({ marco: [{ consciencia: 1, mensaje: 'a' }], activos: [act()] }), '1 mensaje · 1 activo · 2 variantes'); });

// ============ Las vistas ============
t('vistas: exportan vista { nuevo, pintar, resumen } y usan solo íconos que existen', () => {
  for (const f of ['hooks-ui', 'copy-ui']) {
    const src = fs.readFileSync(`${AQUI}public/js/marketing/${f}.js`, 'utf8');
    assert.match(src, /export const vista = \{/); for (const k of ['nuevo()', 'resumen(', 'pintar(']) assert.ok(src.includes(k), `${f} ${k}`);
    assert.deepEqual([...src.matchAll(/\bico\(\s*'([\w-]+)'/g)].map((m) => m[1]).filter((n) => !tieneIco(n)), []);
    assert.ok(!/\braw\(/.test(src.replace(/^\/\/.*$/gm, '')), `${f}: sin raw()`); assert.ok(!/localStorage|sessionStorage|innerHTML|insertAdjacentHTML|eval\(/.test(src)); assert.ok(!/client:\s*true/.test(src));
    assert.ok(!/windsor|adwhispr|launch_|update_budget|ads-studio\/[^']*lanzar/i.test(src), 'nada de plataformas de anuncios ni de lanzar');
  }
});
t('vistas: copy-ui empuja a ads-studio solo con POST (Borrador) y nunca cambia el estado', () => {
  const src = fs.readFileSync(`${AQUI}public/js/marketing/copy-ui.js`, 'utf8');
  assert.ok(src.includes("api('ads-studio', { method: 'POST'")); assert.ok(!/estado\s*[:=]\s*'(Aprobada|Lanzada)/.test(src)); assert.ok(!/ads-studio\/\$\{/.test(src), 'sin PUT de estado');
});
t('puros: sin DOM ni red y con comentario inicial', () => {
  for (const f of ['hooks', 'copy']) {
    const src = fs.readFileSync(`${AQUI}public/js/marketing/${f}.js`, 'utf8');
    assert.ok(src.startsWith('// '), f); assert.ok(!/\bdocument\b|\bwindow\b|\bfetch\(|localStorage/.test(src), `${f} puro`);
  }
});

console.log(`\n${ok} pruebas de Hook Laboratory y Copywriting Studio pasaron`);
