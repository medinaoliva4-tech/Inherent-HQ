// Pruebas de Inherent AI (#/ai, antes «AI Harness»): la lista fija de los 12 agentes del repo (public/js/harness/agentes.js, ya sin
// pantalla), el menú de app.js solo trae Chat y MCPs, el router de harness.js solo conoce la portada y «mcps», la pantalla es de solo
// lectura (sin backend, sin costos, sin mostrar la llave de Hermes) y las dos páginas cargan sin errores con y sin Hermes (con un
// navegador de mentira).
// npm run test:harness
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AGENTES, agenteDe, agentesDeModo } from '../public/js/harness/agentes.js';
import { MODOS } from '../public/js/llm/modos.js';
import { tieneIco } from '../public/js/iconos.js';

let ok = 0; const t = (n, f) => Promise.resolve().then(f).then(() => { ok++; console.log('✓', n); });
const RAIZ = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8');
const SRC = leer('public/js/screens/harness.js');

// ---------- Los agentes ----------
await t('agentes.js trae los 12 agentes del repo, con id y número únicos y todos sus campos', () => {
  assert.equal(AGENTES.length, 12);
  assert.equal(new Set(AGENTES.map((a) => a.id)).size, 12, 'ids únicos');
  assert.equal(new Set(AGENTES.map((a) => a.n)).size, 12, 'números únicos');
  for (const a of AGENTES) for (const k of ['n', 'id', 'nombre', 'depto', 'hace', 'ventana', 'carpeta']) assert.ok(String(a[k] || '').trim(), `${a.id}: falta ${k}`);
  assert.deepEqual(AGENTES.map((a) => a.n), ['00', '01', '01.2', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  assert.equal(agenteDe('strategy').depto, '① Strategy');
  assert.equal(agenteDe('nada'), null);
});
await t('cada agente con modo apunta a un modo real del Chat y cada carpeta existe en el repo (si el repo está)', () => {
  for (const a of AGENTES) assert.ok(!a.modo || MODOS.some((m) => m.id === a.modo), `${a.id}: modo ${a.modo}`);
  assert.deepEqual(agentesDeModo('produccion').map((a) => a.id), ['production', 'video-editing']);
  const repo = path.join(RAIZ, '..', 'agents');
  if (fs.existsSync(repo)) { const hay = fs.readdirSync(repo).filter((d) => /^\d/.test(d)); for (const a of AGENTES) assert.ok(hay.includes(a.carpeta.split('/')[1]), `${a.carpeta} no está en agents/`); assert.equal(hay.length, AGENTES.length, 'agents/ y la lista fija difieren'); }
});
await t('una línea por agente: lo que hace cabe en una frase corta', () => { for (const a of AGENTES) assert.ok(a.hace.length <= 140 && !a.hace.includes('\n'), a.id); });

// ---------- El menú (app.js) y el router de harness.js (se leen como texto) ----------
const APP = leer('public/js/app.js');
await t('el menú de Inherent AI en app.js trae solo Chat y MCPs, y ninguna de las seis páginas viejas', () => {
  assert.match(APP, /Inherent AI/);
  assert.ok(!/AI Harness/.test(APP), 'app.js ya no dice «AI Harness»');
  assert.match(APP, /#\/chat/); assert.match(APP, /#\/ai\/mcps/);
  const ids = [...APP.matchAll(/'ai\/([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(ids)], ['mcps']);
  for (const v of ['agents', 'skills', 'workflows', 'memory', 'models', 'evals']) assert.ok(!APP.includes(`'ai/${v}'`), `ai/${v} sigue en el menú`);
});
await t('harness.js solo conoce la portada y «mcps»; cualquier otra página se canoniza a #/ai; sus íconos existen', () => {
  assert.match(SRC, /pagina !== 'mcps'/);
  assert.match(SRC, /replaceState\(null, '', '#\/ai'\)/);
  assert.ok(!/AI Harness/.test(SRC), 'la pantalla ya no dice «AI Harness»');
  for (const v of ['agents', 'skills', 'workflows', 'memory', 'models', 'evals']) assert.ok(!new RegExp(`['"]${v}['"]`).test(SRC), `${v} sigue en el router`);
  assert.match(SRC, /href="#\/chat"/); assert.match(SRC, /href="#\/ai\/mcps"/);
  for (const m of SRC.matchAll(/\bico\(\s*'([\w-]+)'/g)) assert.ok(tieneIco(m[1]), `ícono ${m[1]}`);
});
await t('Inherent AI es de solo lectura, sin backend y sin costos', () => {
  assert.ok(!/method\s*:\s*'(POST|PUT|PATCH|DELETE)'/.test(SRC) && !/\bbody\s*:/.test(SRC), 'sin escrituras');
  assert.ok(!/\.(save|create|remove)\(/.test(SRC), 'sin col().save/create/remove');
  assert.ok(!/client:\s*true/.test(SRC), 'sin { client: true }');
  assert.ok(!/\bapi\(|\bcol\(/.test(SRC), 'no habla con el servidor del OS (solo con Hermes y connectai)');
  for (const x of ['BASELINE', 'baseline', 'internos', 'payroll', 'finanzas', "'audit'", 'audit/', 'rates', 'seesCosts', 'USD_GTQ']) assert.ok(!SRC.includes(x), `no debe nombrar ${x}`);
});

// ---------- Cada página carga sin errores, con y sin Hermes ----------
const noop = () => {};
const store = new Map();
globalThis.window = globalThis;
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.location = { hash: '' };
const reemplazos = [];
globalThis.history = { replaceState: (_s, _t, u) => reemplazos.push(u) };
Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true });
const falso = () => new Proxy(function () {}, { get: (_, k) => (k === Symbol.toPrimitive ? () => '' : k === 'querySelector' ? () => null : k === 'querySelectorAll' ? () => [] : k === 'length' ? 0 : falso()), apply: () => falso(), set: () => true });
globalThis.document = falso();

const LLAVE = 'sk-llave-secreta-123';
const HERMES = {
  '/health': { status: 'ok', version: '1.2' }, '/v1/capabilities': {},
  '/api/model/options': { provider: 'anthropic', model: 'anthropic/claude-opus-5-5', providers: [{ slug: 'anthropic', name: 'Claude', authenticated: true, is_current: true, models: ['claude-opus-5-5'] }] },
  '/v1/toolsets': { toolsets: [
    { name: 'web', label: '🌐 Web <b>x</b>', enabled: true, configured: true, tools: ['web_search', { name: 'web_extract' }] },
    { name: 'memory', label: 'Memoria', enabled: true, configured: false, tools: ['memory_read'] },
    { name: 'browser', label: 'Navegador', enabled: false, configured: false, tools: [] },
  ] },
};
let hermesOn = false, llamadasOS = [];
const resp = (ok, status, data) => ({ ok, status, json: async () => data });
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.startsWith('http://127.0.0.1:8642')) { const r = hermesOn ? HERMES[u.slice('http://127.0.0.1:8642'.length).split('?')[0]] : null; if (!r) throw new Error('sin Hermes'); return resp(true, 200, r); }
  llamadasOS.push(u); return resp(false, 404, { error: 'no' });
};

const { render } = await import('../public/js/screens/harness.js');
const ceo = { email: 'ceo@x.com', role: 'ceo', areas: ['estrategia', 'content', 'clients', 'library', 'operations'] };
const otro = { email: 'ed@x.com', role: 'content', areas: ['content'] };
// Un nodo falso por cada id que la pantalla pinta (también los anidados): querySelector('#id') lo encuentra donde sea que esté.
async function pagina(me, id, conHermes) {
  hermesOn = conHermes; llamadasOS = []; reemplazos.length = 0;
  globalThis.inherentEscritorio = conHermes ? { hermes: { key: LLAVE } } : undefined;
  const nodos = {};
  const todo = () => el.innerHTML + Object.values(nodos).map((n) => n.innerHTML).join('');
  const el = { innerHTML: '', addEventListener: noop, querySelectorAll: () => [], contains: () => true, querySelector(sel) { return /^#iai-[\w-]+$/.test(sel) && todo().includes(`id="${sel.slice(1)}"`) ? (nodos[sel] ||= { innerHTML: '' }) : null; } };
  await render(el, { me, sub: id ? [id] : [], alive: () => true });
  await new Promise((r) => setTimeout(r, 80)); // lo que se llena después (Hermes)
  return todo();
}
const limpio = (s, c) => { assert.ok(s.length > 400, `${c}: salió casi vacío`); assert.ok(!/undefined|\[object Object\]|NaN/.test(s), `${c}: ${s.match(/.{30}(undefined|\[object Object\]|NaN).{30}/)?.[0]}`); assert.ok(!/<b>x<\/b>|<img src=x/.test(s), `${c}: sin escapar`); assert.ok(!/(?:\bQ\d{2,}|\$\d{2,}(?![\dM]))/.test(s), `${c}: monto`); assert.ok(!s.includes(LLAVE), `${c}: muestra la llave de Hermes`); };

for (const conHermes of [false, true]) for (const [me, quien] of [[ceo, 'CEO'], [otro, 'no CEO']]) for (const id of ['', 'mcps']) {
  await t(`#/ai/${id} carga sin errores · ${quien} · ${conHermes ? 'con' : 'sin'} Hermes`, async () => {
    const s = await pagina(me, id, conHermes), c = `${id || 'portada'}/${quien}/${conHermes}`;
    limpio(s, c);
    assert.match(s, /Inherent AI/); assert.ok(!/AI Harness/.test(s), `${c}: dice «AI Harness»`);
    assert.match(s, /href="#\/chat"/); assert.match(s, /href="#\/ai\/mcps"/);
    assert.deepEqual(llamadasOS, [], `${c}: llamó al servidor del OS`);
    if (id === '') {
      assert.match(s, /Abrir el Chat/); assert.match(s, /Ver los MCPs/); assert.ok(!/aria-current/.test(s), 'en la portada ninguna pestaña está abierta');
      if (conHermes) { assert.match(s, /Encendido/); assert.match(s, /Hermes v1\.2/); assert.match(s, /claude-opus-5-5/); assert.match(s, /2 capacidades activas/); assert.match(s, /de 3/); }
      else { assert.match(s, /Apagado/); assert.match(s, /Cómo encenderlo/); }
    } else {
      assert.match(s, /aria-current="page"/);
      for (const x of ['Lo que tu Inherent AI puede usar hoy', 'Conectar un MCP a tu Inherent AI', 'Los MCPs viven en Hermes', 'Quitar o probar un MCP', 'Habla con Inherent OS desde tu IA', 'inherent mcp list', 'https://inherent-work.vercel.app/mcp']) assert.ok(s.includes(x), `${c}: falta «${x}»`);
      assert.match(s, /id="iai-n"/); assert.match(s, /id="iai-u"/); assert.match(s, /id="iai-a"/);
      if (conHermes) { assert.match(s, /Web &lt;b&gt;x&lt;\/b&gt;/); assert.match(s, /web search/); assert.match(s, /web extract/); assert.match(s, /Activa, falta configurarla/); assert.match(s, /Sin configurar/); assert.ok(s.indexOf('Navegador') > s.indexOf('Memoria'), 'las activas van primero'); }
      else assert.match(s, /Hermes no responde/);
    }
  });
}
await t('una página desconocida cae en la portada y canoniza la ruta a #/ai', async () => {
  const s = await pagina(ceo, 'agents', false);
  assert.match(s, /Abrir el Chat/); assert.match(s, /Ver los MCPs/); assert.ok(!/aria-current/.test(s));
  assert.deepEqual(reemplazos, ['#/ai']);
});
await t('la portada de #/ai y #/ai/mcps no tocan la ruta', async () => { await pagina(ceo, '', true); await pagina(ceo, 'mcps', true); assert.deepEqual(reemplazos, []); });

console.log(`\n${ok} pruebas de Inherent AI pasaron`);
