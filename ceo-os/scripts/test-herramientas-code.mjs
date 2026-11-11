// La pestaña «Herramientas» del Chat: Code OS embebido (public/js/llm/herramientas-code.js) con el contrato de
// code-os/ui/docs/embebido.md (PR #298): pase por URL solo la primera vez y después por postMessage, origen exacto, contexto,
// «codeos:al-chat» y el CSP del OS (frame-src y connect-src). npm run test:herramientas-code
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { origenDe, urlEmbebida, mensajeValido, rolCodeOS, contextoCodeOS, leerAlChat, acciones, montarHerramientas, VERSION_CONTRATO } from '../public/js/llm/herramientas-code.js';
import { urlUi, urlCode } from '../api/_lib/code.js';

let ok = 0; const t = async (n, f) => { await f(); ok++; console.log('✓', n); };
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const VERCEL = JSON.parse(fs.readFileSync(path.join(AQUI, '..', 'vercel.json'), 'utf8'));
const LLM = fs.readFileSync(path.join(AQUI, '..', 'public/js/screens/llm.js'), 'utf8');
const CODE = 'https://code.inherentglobal.com';

await t('origen y URL: solo https (o localhost), modo embebido y el pase de la primera carga', () => {
  assert.equal(origenDe(CODE + '/'), CODE); assert.equal(origenDe('http://localhost:5173'), 'http://localhost:5173');
  assert.equal(origenDe('http://code.inherentglobal.com'), '', 'http no'); assert.equal(origenDe('javascript:alert(1)'), ''); assert.equal(origenDe(''), '');
  assert.equal(urlEmbebida(CODE, 'a.b.c'), `${CODE}/?embed=1&pase=a.b.c`);
  assert.equal(urlEmbebida(CODE), `${CODE}/?embed=1`); assert.equal(urlEmbebida('ftp://x'), '');
  assert.equal(VERSION_CONTRATO, 1);
});
await t('mensajes: solo de nuestro iframe, de su origen exacto y con un tipo del contrato', () => {
  const ventana = {}; const ok1 = { origin: CODE, source: ventana, data: { tipo: 'codeos:listo', version: 1 } };
  assert.ok(mensajeValido(ok1, { origen: CODE, ventana }));
  assert.ok(!mensajeValido({ ...ok1, origin: 'https://evil.example' }, { origen: CODE, ventana }), 'otro origen');
  assert.ok(!mensajeValido({ ...ok1, origin: 'https://code.inherentglobal.com.evil.example' }, { origen: CODE, ventana }), 'un origen parecido');
  assert.ok(!mensajeValido({ ...ok1, source: {} }, { origen: CODE, ventana }), 'otra ventana (otro iframe o un popup)');
  assert.ok(!mensajeValido({ ...ok1, data: 'codeos:listo' }, { origen: CODE, ventana }), 'sin objeto');
  assert.ok(!mensajeValido({ ...ok1, data: { tipo: 'otro' } }, { origen: CODE, ventana }), 'tipo ajeno');
  assert.ok(!mensajeValido(ok1, { origen: '', ventana }), 'sin origen configurado nada pasa');
});
await t('acciones: listo → pase y contexto; pedir-pase → pase nuevo; al-chat limpio; lo demás se ignora', () => {
  assert.deepEqual(acciones({ tipo: 'codeos:listo', version: 1 }), [{ hacer: 'pase', forzar: false }, { hacer: 'contexto' }]);
  assert.deepEqual(acciones({ tipo: 'codeos:pedir-pase' }), [{ hacer: 'pase', forzar: true }]);
  assert.deepEqual(acciones({ tipo: 'codeos:al-chat', texto: ' @produccion corta el reel ', enviar: true, modelo: 'nivel-alto' }), [{ hacer: 'al-chat', texto: '@produccion corta el reel', enviar: true, modelo: 'nivel-alto' }]);
  assert.deepEqual(leerAlChat({ texto: 'x', enviar: 'true', modelo: 'claude-opus' }), { texto: 'x', enviar: false, modelo: '' }, 'enviar solo con true; un modelo que no es nivel se ignora');
  assert.equal(leerAlChat({ texto: '   ' }), null); assert.equal(leerAlChat({ texto: 'y'.repeat(30000) }).texto.length, 20000);
  assert.deepEqual(acciones({ tipo: 'codeos:pase', pase: 'x' }), [], 'lo que manda el OS no lo atiende el OS');
  assert.deepEqual(acciones(null), []);
});
await t('contexto: solo campos válidos del contrato; el rol del OS se traduce al «Ver como» de Code OS', () => {
  const c = contextoCodeOS({ cliente: 'akai', sesion: '0f8b7a1e-1c2d-4e5f-8a9b-0c1d2e3f4a5b', rol: 'ceo', tema: 'light', nivel: 'nivel-medio', aislada: false, seccion: 'herramientas' });
  assert.deepEqual(c, { tipo: 'codeos:contexto', cliente: 'akai', sesion: '0f8b7a1e-1c2d-4e5f-8a9b-0c1d2e3f4a5b', rol: 'ceo', tema: 'light', seccion: 'herramientas', nivel: 'nivel-medio', aislada: false });
  assert.deepEqual(contextoCodeOS({ cliente: '../x', sesion: 'inh-estrategia-1', rol: 'admin', tema: 'azul', nivel: 'opus', aislada: 'si' }), { tipo: 'codeos:contexto' });
  assert.equal(rolCodeOS({ role: 'ceo' }), 'ceo'); assert.equal(rolCodeOS({ role: 'coo' }), 'coo');
  assert.equal(rolCodeOS({ role: 'team', title: 'Editor de video' }), 'editor');
  assert.equal(rolCodeOS({ role: 'prod' }), 'produccion'); assert.equal(rolCodeOS({ role: 'team', modo: 'estrategia' }), 'estrategia');
  assert.equal(rolCodeOS({ role: 'team', modo: 'diseno' }), 'diseno'); assert.equal(rolCodeOS({ role: 'team', modo: 'marketing' }), 'creativo');
});
await t('montar: pide el pase, responde «listo» con pase + contexto, renueva con «pedir-pase» y pasa «al-chat» a la caja', async () => {
  const oyentes = []; const enviados = [];
  globalThis.window = { addEventListener: (k, f) => oyentes.push(f), removeEventListener: (k, f) => oyentes.splice(oyentes.indexOf(f), 1) };
  const ventana = { postMessage: (m, o) => enviados.push([m, o]) };
  globalThis.document = { createElement: () => ({ setAttribute() {}, remove() {}, contentWindow: ventana }) };
  const caja = { replaceChildren(x) { this.hijo = x; } };
  const pases = []; const alChat = [];
  const ctl = await montarHerramientas(caja, { pase: async (forzar) => { pases.push(forzar); return { pase: `p${pases.length}`, expira: 1000, url: CODE, ui: CODE }; }, contexto: () => ({ cliente: 'akai', rol: 'coo', tema: 'dark' }), alChat: (x) => alChat.push(x) });
  assert.equal(caja.hijo.src, `${CODE}/?embed=1&pase=p1`);
  const e = (data, origin = CODE, source = ventana) => Promise.all(oyentes.map((f) => f({ data, origin, source })));
  await e({ tipo: 'codeos:listo', version: 1 });
  assert.deepEqual(enviados.map(([m, o]) => [m.tipo, o]), [['codeos:pase', CODE], ['codeos:contexto', CODE]]);
  assert.equal(enviados[0][0].pase, 'p2'); assert.deepEqual(enviados[1][0], { tipo: 'codeos:contexto', cliente: 'akai', rol: 'coo', tema: 'dark' });
  await e({ tipo: 'codeos:pedir-pase' }); assert.deepEqual(pases, [false, false, true], 'pedir-pase fuerza un pase nuevo');
  await e({ tipo: 'codeos:al-chat', texto: 'Revisa el diff', enviar: true, modelo: 'nivel-alto' });
  assert.deepEqual(alChat, [{ texto: 'Revisa el diff', enviar: true, modelo: 'nivel-alto' }]);
  await e({ tipo: 'codeos:al-chat', texto: 'malo' }, 'https://evil.example'); await e({ tipo: 'codeos:pedir-pase' }, CODE, {});
  assert.equal(alChat.length, 1); assert.equal(pases.length, 3, 'nada de otro origen ni de otra ventana');
  ctl.destruir(); assert.equal(oyentes.length, 0);
  delete globalThis.window; delete globalThis.document;
});
await t('CSP del OS: frame-src y connect-src permiten Code OS; el OS sigue sin dejarse enmarcar', () => {
  const csp = VERCEL.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy').value;
  assert.match(csp, /frame-src [^;]*https:\/\/code\.inherentglobal\.com/);
  assert.match(csp, /connect-src [^;]*https:\/\/code\.inherentglobal\.com/);
  assert.match(csp, /frame-ancestors 'none'/);
});
await t('la URL de la interfaz: CODEOS_UI_URL si es https o localhost; si no, la del puente', () => {
  assert.equal(urlUi({}), urlCode({}));
  assert.equal(urlUi({ CODEOS_UI_URL: 'https://code-staging.inherentglobal.com/' }), 'https://code-staging.inherentglobal.com');
  assert.equal(urlUi({ CODEOS_UI_URL: 'http://localhost:5173' }), 'http://localhost:5173');
  assert.equal(urlUi({ CODEOS_UI_URL: 'http://evil.example' }), urlCode({}));
  assert.equal(urlUi({ CODEOS_UI_URL: 'https://x.example/ruta' }), urlCode({}), 'sin rutas: solo el origen');
});
await t('la pantalla: pestaña Herramientas para el equipo, pase de /api/code/pase y «al-chat» con el nivel que venga', () => {
  assert.match(LLM, /pestanasHtml\(/); assert.match(LLM, /\{ herramientas: conHerramientas\(\) \}/);
  assert.match(LLM, /const conHerramientas = \(\) => me\.role !== 'client'/);
  assert.match(LLM, /pase: \(forzar\) => paseCode\(forzar\)/);
  assert.match(LLM, /enviar\(texto, \{ nivelForzado: modelo \}\)/);
});

console.log(`\n${ok} pruebas de Herramientas (Code OS embebido) OK`);
