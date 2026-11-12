// Pruebas de Inherent AI (#/ai, antes «AI Harness»): la lista fija de los 9 agentes del repo (public/js/harness/agentes.js, ya sin
// pantalla), el menú de app.js trae Chat, Agent Area y MCPs, el router de harness.js solo conoce la portada y «mcps»; solo LEE
// (el servidor, los trabajos y las conexiones), sin escrituras ni costos. Ambas páginas cargan con el servidor en línea y fuera de
// línea (con un navegador de mentira). Hermes se retiró: no aparece en ninguna de las dos.
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
await t('agentes.js trae los 9 agentes del repo (PR #297), con id y número únicos y todos sus campos', () => {
  assert.equal(AGENTES.length, 9);
  assert.equal(new Set(AGENTES.map((a) => a.id)).size, 9, 'ids únicos');
  assert.equal(new Set(AGENTES.map((a) => a.n)).size, 9, 'números únicos');
  for (const a of AGENTES) for (const k of ['n', 'id', 'nombre', 'depto', 'hace', 'ventana', 'carpeta']) assert.ok(String(a[k] || '').trim(), `${a.id}: falta ${k}`);
  assert.deepEqual(AGENTES.map((a) => a.n), ['00', '01', '02', '03', '04', '05', '06', '07', '08']);
  assert.equal(agenteDe('strategy').depto, '① Strategy');
  assert.equal(agenteDe('nada'), null);
});
await t('cada agente con modo apunta a un modo real del Chat y cada carpeta existe en el repo (si el repo está)', () => {
  for (const a of AGENTES) assert.ok(!a.modo || MODOS.some((m) => m.id === a.modo), `${a.id}: modo ${a.modo}`);
  assert.deepEqual(agentesDeModo('produccion').map((a) => a.id), ['production']);
  const repo = path.join(RAIZ, '..', 'agents');
  if (fs.existsSync(repo)) { const hay = fs.readdirSync(repo).filter((d) => /^\d/.test(d)); for (const a of AGENTES) assert.ok(hay.includes(a.carpeta.split('/')[1]), `${a.carpeta} no está en agents/`); assert.equal(hay.length, AGENTES.length, 'agents/ y la lista fija difieren'); }
});
await t('una línea por agente: lo que hace cabe en una frase corta', () => { for (const a of AGENTES) assert.ok(a.hace.length <= 140 && !a.hace.includes('\n'), a.id); });

// ---------- El menú (app.js) y el router de harness.js (se leen como texto) ----------
const APP = leer('public/js/app.js');
await t('el menú de Inherent AI en app.js trae Chat, Agent Area y MCPs, y ninguna de las seis páginas viejas', () => {
  assert.match(APP, /Inherent AI/);
  assert.ok(!/AI Harness/.test(APP), 'app.js ya no dice «AI Harness»');
  assert.match(APP, /#\/chat/); assert.match(APP, /#\/ai\/mcps/);
  const ids = [...APP.matchAll(/'ai\/([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(ids)], ['agentes', 'mcps']);
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
await t('harness.js solo lee: sin escrituras, costos ni Hermes', () => {
  assert.ok(!/method\s*:\s*'(POST|PUT|PATCH|DELETE)'/.test(SRC) && !/\bbody\s*:/.test(SRC), 'sin escrituras');
  assert.ok(!/\.(save|create|remove)\(/.test(SRC), 'sin col().save/create/remove');
  assert.ok(!/client:\s*true/.test(SRC), 'sin { client: true }');
  assert.ok(!/hermes/i.test(SRC.replace(/Hermes se retiró/g, '')), 'Hermes se retiró: no queda en la pantalla');
  for (const x of ['BASELINE', 'baseline', 'internos', 'payroll', 'finanzas', "'audit'", 'audit/', 'rates', 'seesCosts', 'USD_GTQ']) assert.ok(!SRC.includes(x), `no debe nombrar ${x}`);
});

// ---------- Cada página carga sin errores, con el servidor en línea y fuera de línea ----------
const noop = () => {};
const store = new Map();
globalThis.window = globalThis;
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.location = { hash: '' };
const reemplazos = [];
globalThis.history = { replaceState: (_s, _t, u) => reemplazos.push(u) };
Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true });
const falso = () => new Proxy(function () {}, { get: (_, k) => (k === Symbol.toPrimitive ? () => '' : k === 'querySelector' ? () => null : k === 'querySelectorAll' ? () => [] : k === 'length' ? 0 : falso()), apply: () => falso() });
globalThis.document = falso();

let enLinea = true, llamadasOS = [];
const resp = (ok, status, data) => ({ ok, status, json: async () => data });
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  llamadasOS.push({ url: u, method: opts.method || 'GET' });
  if (u === '/api/chat/servidor') return resp(true, 200, { en_linea: enLinea, modelos: enLinea ? ['deepseek-v4-flash', 'deepseek-v4-pro'] : [], version: 'f3-7' });
  if (u === '/api/agentes/runs') return resp(true, 200, { items: [{ completo: false, activa: 0, etapas: [{ estado: 'revision' }] }, { completo: false, activa: 1, etapas: [{ estado: 'aprobada' }, { estado: 'pendiente' }] }] });
  if (u === '/api/conectores/estado') return resp(true, 200, { conectores: [{ id: 'notion', conectado: true }, { id: 'canva', conectado: false }], puente: false });
  return resp(false, 404, { error: 'no' });
};

const { render } = await import('../public/js/screens/harness.js');
const ceo = { email: 'ceo@x.com', role: 'ceo', areas: ['estrategia', 'content', 'clients', 'library', 'operations'] };
const otro = { email: 'ed@x.com', role: 'content', areas: ['content'] };
// Un nodo falso por cada id que la pantalla pinta (también los anidados): querySelector('#id') lo encuentra donde sea que esté.
async function pagina(me, id, online = true) {
  enLinea = online; llamadasOS = []; reemplazos.length = 0;
  const nodos = {};
  const todo = () => el.innerHTML + Object.values(nodos).map((n) => n.innerHTML).join('');
  const el = { innerHTML: '', addEventListener: noop, querySelectorAll: () => [], contains: () => true, querySelector(sel) { return /^#iai-[\w-]+$/.test(sel) && todo().includes(`id="${sel.slice(1)}"`) ? (nodos[sel] ||= { innerHTML: '', addEventListener: noop, querySelectorAll: () => [], querySelector: () => null }) : null; } };
  await render(el, { me, sub: id ? [id] : [], alive: () => true });
  await new Promise((r) => setTimeout(r, 80)); // lo que se llena después
  return todo();
}
const limpio = (s, c) => { assert.ok(s.length > 400, `${c}: salió casi vacío`); assert.ok(!/undefined|\[object Object\]|NaN/.test(s), `${c}: ${s.match(/.{30}(undefined|\[object Object\]|NaN).{30}/)?.[0]}`); };

for (const online of [true, false]) for (const [me, quien] of [[ceo, 'CEO'], [otro, 'no CEO']]) for (const id of ['', 'mcps']) {
  await t(`#/ai/${id} carga sin errores · ${quien} · servidor ${online ? 'en línea' : 'fuera de línea'}`, async () => {
    const s = await pagina(me, id, online), c = `${id || 'portada'}/${quien}/${online}`;
    limpio(s, c);
    assert.match(s, /Inherent AI/); assert.ok(!/AI Harness/.test(s), `${c}: dice «AI Harness»`); assert.ok(!/Hermes/.test(s), `${c}: menciona Hermes`);
    assert.match(s, /href="#\/chat"/); assert.match(s, /href="#\/ai\/mcps"/);
    assert.ok(llamadasOS.every((x) => x.method === 'GET'), `${c}: solo lee`);
    if (id === '') {
      assert.match(s, /Abrir el Chat/); assert.match(s, /Ver los agentes/); assert.match(s, /Ver conexiones/); assert.ok(!/aria-current/.test(s), 'en la portada ninguna pestaña está abierta');
      if (online) { assert.match(s, /En línea/); assert.match(s, /deepseek-v4-flash/); } else assert.match(s, /Fuera de línea/);
      assert.match(s, /1 trabajo espera tu OK/); assert.match(s, /2 trabajos en curso/); assert.match(s, /1 conexión/);
    } else assert.match(s, /aria-current="page"/);
  });
}
await t('una página desconocida cae en la portada y canoniza la ruta a #/ai', async () => {
  const s = await pagina(ceo, 'agents');
  assert.match(s, /Abrir el Chat/); assert.deepEqual(reemplazos, ['#/ai']);
});
await t('la portada de #/ai y #/ai/mcps no tocan la ruta', async () => { await pagina(ceo, ''); await pagina(ceo, 'mcps'); assert.deepEqual(reemplazos, []); });

console.log(`\n${ok} pruebas de Inherent AI pasaron`);
