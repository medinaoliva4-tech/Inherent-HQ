// Pruebas de Inherent AI (#/ai, antes «AI Harness»): la lista fija de los 12 agentes del repo (public/js/harness/agentes.js, ya sin
// pantalla), el menú de app.js solo trae Chat y MCPs, el router de harness.js solo conoce la portada y «mcps», la pantalla es de solo
// lectura (sin backend, sin costos, sin mostrar la llave de Hermes) y las dos páginas cargan sin errores con y sin Hermes (con un
// navegador de mentira). La portada trae la tarjeta «Modelos abiertos · LM Studio»: conectado (con sus modelos) o los 4 pasos.
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
  assert.deepEqual([...new Set(ids)], ['mcps', 'workflows']);
  for (const v of ['agents', 'skills', 'memory', 'models', 'evals']) assert.ok(!APP.includes(`'ai/${v}'`), `ai/${v} sigue en el menú`);
});
await t('harness.js solo conoce la portada y «mcps»; cualquier otra página se canoniza a #/ai; sus íconos existen', () => {
  assert.match(SRC, /pagina !== 'mcps'/);
  assert.match(SRC, /replaceState\(null, '', '#\/ai'\)/);
  assert.ok(!/AI Harness/.test(SRC), 'la pantalla ya no dice «AI Harness»');
  for (const v of ['agents', 'skills', 'memory', 'models', 'evals']) assert.ok(!new RegExp(`['"]${v}['"]`).test(SRC), `${v} sigue en el router`);
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
  '/api/model/options': () => OPCIONES[escenario],
  '/v1/toolsets': { toolsets: [
    { name: 'web', label: '🌐 Web <b>x</b>', enabled: true, configured: true, tools: ['web_search', { name: 'web_extract' }] },
    { name: 'memory', label: 'Memoria', enabled: true, configured: false, tools: ['memory_read'] },
    { name: 'browser', label: 'Navegador', enabled: false, configured: false, tools: [] },
  ] },
};
// Qué tiene conectado Hermes en cada prueba: solo Claude, Claude + LM Studio (ocho modelos, uno, o ninguno) o que no devuelva los modelos.
const CLAUDE = { slug: 'anthropic', name: 'Claude', authenticated: true, is_current: true, models: ['claude-opus-5-5'] };
const OCHO = ['qwen/qwen3-8b', 'meta/llama-3.1-8b-instruct', 'google/gemma-3-12b', 'mistralai/mistral-7b', 'nousresearch/hermes-3-8b', 'qwen/qwen2.5-14b', 'otro/modelo-siete', 'otro/modelo-ocho'];
const OPCIONES = {
  claude: { provider: 'anthropic', model: 'anthropic/claude-opus-5-5', providers: [CLAUDE] },
  lm: { provider: 'lmstudio', model: 'qwen/qwen3-8b', providers: [{ ...CLAUDE, is_current: false }, { slug: 'lmstudio', name: 'LM Studio', authenticated: true, is_current: true, models: OCHO }] },
  'lm-vacio': { provider: 'anthropic', model: 'anthropic/claude-opus-5-5', providers: [CLAUDE, { slug: 'lmstudio', name: 'LM Studio', authenticated: true, models: [] }] },
  'lm-uno': { provider: 'anthropic', model: 'anthropic/claude-opus-5-5', providers: [CLAUDE, { slug: 'lmstudio', name: 'LM Studio', authenticated: true, models: ['solo/modelo-uno'] }] },
  nulo: null, // Hermes no devuelve los modelos
};
let escenario = 'claude';
let hermesOn = false, llamadasOS = [];
const resp = (ok, status, data) => ({ ok, status, json: async () => data });
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.startsWith('http://127.0.0.1:8642')) { let r = hermesOn ? HERMES[u.slice('http://127.0.0.1:8642'.length).split('?')[0]] : null; if (typeof r === 'function') r = r(); if (!r) throw new Error('sin Hermes'); return resp(true, 200, r); }
  llamadasOS.push(u); return resp(false, 404, { error: 'no' });
};

const { render } = await import('../public/js/screens/harness.js');
const ceo = { email: 'ceo@x.com', role: 'ceo', areas: ['estrategia', 'content', 'clients', 'library', 'operations'] };
const otro = { email: 'ed@x.com', role: 'content', areas: ['content'] };
// Un nodo falso por cada id que la pantalla pinta (también los anidados): querySelector('#id') lo encuentra donde sea que esté.
async function pagina(me, id, conHermes, esc = 'claude', sinLlave = false) {
  hermesOn = conHermes; escenario = esc; llamadasOS = []; reemplazos.length = 0;
  globalThis.inherentEscritorio = conHermes && !sinLlave ? { hermes: { key: LLAVE } } : undefined;
  const nodos = {};
  const todo = () => el.innerHTML + Object.values(nodos).map((n) => n.innerHTML).join('');
  const el = { innerHTML: '', addEventListener: noop, querySelectorAll: () => [], contains: () => true, querySelector(sel) { return /^#iai-[\w-]+$/.test(sel) && todo().includes(`id="${sel.slice(1)}"`) ? (nodos[sel] ||= { innerHTML: '' }) : null; } };
  await render(el, { me, sub: id ? [id] : [], alive: () => true });
  await new Promise((r) => setTimeout(r, 80)); // lo que se llena después (Hermes)
  return todo();
}
const limpio = (s, c) => { assert.ok(s.length > 400, `${c}: salió casi vacío`); assert.ok(!/undefined|\[object Object\]|NaN/.test(s), `${c}: ${s.match(/.{30}(undefined|\[object Object\]|NaN).{30}/)?.[0]}`); assert.ok(!/<b>x<\/b>|<img src=x/.test(s), `${c}: sin escapar`); assert.ok(!/(?:\bQ\d{2,}|\$\d{2,}(?![\dM]))/.test(s), `${c}: monto`); assert.ok(!s.includes(LLAVE), `${c}: muestra la llave de Hermes`); };

// Los 4 pasos de LM Studio: lo que se baja, el servidor, la carga con 64K y la conexión, cada comando en el bloque con «Copiar».
function pasosLM(s, c) {
  for (const x of ['Baja LM Studio y un modelo', 'Enciende su servidor', 'Cárgalo con 64K de contexto', 'Conéctalo a tu Inherent AI', 'Qwen, Llama, Gemma, Mistral', 'http://localhost:1234/v1', 'Opcional: que LM Studio cargue y descargue el modelo solo']) assert.ok(s.includes(x), `${c}: falta «${x}»`);
  for (const cm of ['lms server start', 'lms load &lt;modelo&gt; --context-length 64000', 'inherent model', 'inherent config set model.lmstudio_load_mode jit']) assert.ok(s.includes(`<code>${cm}</code>`), `${c}: falta el comando ${cm}`);
  for (const cm of ['lms server start', 'lms load <modelo> --context-length 64000', 'inherent model', 'inherent config set model.lmstudio_load_mode jit']) assert.ok(s.includes(`data-act="copiar" data-t="${cm.replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`), `${c}: «${cm}» no se puede copiar`);
  assert.ok(s.includes('href="https://lmstudio.ai" target="_blank" rel="noopener"'), `${c}: el link a lmstudio.ai`);
  assert.equal((s.match(/class="iai-lm-paso"/g) || []).length, 4, `${c}: son 4 pasos`);
  assert.ok(!/Conectado · \d/.test(s), `${c}: dice conectado sin LM Studio`);
}

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
      // La tarjeta de LM Studio siempre está, y sin LM Studio conectado trae los 4 pasos con sus comandos y el link.
      assert.match(s, /Modelos abiertos · LM Studio/); assert.match(s, /id="iai-lm"/); pasosLM(s, c);
      assert.match(s, conHermes ? /Sin conectar<\/b> · LM Studio todavía no aparece en tu Hermes/ : /Sin conectar<\/b> · Hermes no responde en esta compu/);
    } else {
      assert.match(s, /aria-current="page"/);
      for (const x of ['Lo que tu Inherent AI puede usar hoy', 'Conectar un MCP a tu Inherent AI', 'Los MCPs viven en Hermes', 'Quitar o probar un MCP', 'Habla con Inherent OS desde tu IA', 'inherent mcp list', 'https://inherent-work.vercel.app/mcp']) assert.ok(s.includes(x), `${c}: falta «${x}»`);
      assert.match(s, /id="iai-n"/); assert.match(s, /id="iai-u"/); assert.match(s, /id="iai-a"/);
      if (conHermes) { assert.match(s, /Web &lt;b&gt;x&lt;\/b&gt;/); assert.match(s, /web search/); assert.match(s, /web extract/); assert.match(s, /Activa, falta configurarla/); assert.match(s, /Sin configurar/); assert.ok(s.indexOf('Navegador') > s.indexOf('Memoria'), 'las activas van primero'); }
      else assert.match(s, /Hermes no responde/);
    }
  });
}
// ---------- La tarjeta «Modelos abiertos · LM Studio» ----------
await t('LM Studio conectado: «Conectado · 8 modelos», máximo 6 nombres, el que está en uso primero y marcado, sin los 4 pasos', async () => {
  const s = await pagina(ceo, '', true, 'lm');
  limpio(s, 'portada/lm');
  assert.match(s, /Modelos abiertos · LM Studio/);
  assert.match(s, /Conectado · 8 modelos/);
  assert.equal((s.match(/<li class="iai-lm-modelo[ "]/g) || []).length, 6, 'máximo 6 modelos');
  assert.match(s, /\+2 más/);
  assert.ok(s.indexOf('qwen3-8b') < s.indexOf('llama-3.1-8b-instruct'), 'el modelo en uso va primero');
  assert.equal((s.match(/iai-lm-uso/g) || []).length, 1, 'solo uno está en uso');
  assert.match(s, /iai-lm-modelo uso" title="qwen\/qwen3-8b"/);
  assert.ok(!s.includes('otro/modelo-ocho') && !s.includes('modelo-ocho'), 'el séptimo y el octavo no salen');
  assert.ok(!s.includes('class="iai-lm-paso"'), 'conectado no repite los pasos');
  assert.ok(!s.includes('lms server start'), 'conectado no pide encender el servidor');
  assert.match(s, /LM Studio · en uso|Modelo: <b>qwen3-8b<\/b> · LM Studio/, 'la tarjeta del Chat dice que el modelo actual es de LM Studio');
  assert.match(s, /href="#\/chat"/);
});
await t('LM Studio conectado con un solo modelo dice «1 modelo»; si no es el actual, no marca ninguno en uso', async () => {
  const s = await pagina(ceo, '', true, 'lm-uno');
  limpio(s, 'portada/lm-uno');
  assert.match(s, /Conectado · 1 modelo</); assert.ok(!/Conectado · 1 modelos/.test(s));
  assert.match(s, /modelo-uno/); assert.ok(!s.includes('iai-lm-uso'), 'ninguno en uso'); assert.ok(!/\+\d+ más/.test(s));
});
await t('LM Studio listo pero sin modelos no dice «Conectado · 0»: avisa y muestra los pasos', async () => {
  const s = await pagina(ceo, '', true, 'lm-vacio');
  limpio(s, 'portada/lm-vacio');
  assert.match(s, /LM Studio está conectado, pero sin modelos/); assert.ok(!/Conectado · \d/.test(s)); assert.ok(!/ 0 modelos/.test(s));
  pasosLM(s, 'lm-vacio');
});
await t('la tarjeta de LM Studio sale con los pasos si Hermes no devuelve los modelos o si el OS no tiene su llave', async () => {
  const a = await pagina(ceo, '', true, 'nulo');
  assert.match(a, /No pude leer los modelos de Hermes/); pasosLM(a, 'sin-modelos');
  const b = await pagina(ceo, '', true, 'claude', true); // Hermes responde, pero no hay llave
  assert.match(b, /el OS no tiene la llave de Hermes/); assert.match(b, /Los pasos 1 a 3 ya puedes hacerlos/); pasosLM(b, 'sin-llave');
});
await t('harness.js: el link a lmstudio.ai abre aparte y sin opener; los comandos salen de TERMINAL; la portada sigue con Chat y MCPs', () => {
  assert.match(SRC, /const LM_WEB = 'https:\/\/lmstudio\.ai'/);
  assert.match(SRC, /href="\$\{LM_WEB\}" target="_blank" rel="noopener"/);
  assert.ok(!/<a [^>]*target="_blank"(?![^>]*rel="noopener")/.test(SRC), 'todo link _blank lleva rel=noopener');
  assert.match(SRC, /TERMINAL\.find\(\(\[n\]\) => re\.test\(n\)\)/);
  assert.match(SRC, /id="iai-lm"/); assert.match(SRC, /iai-lm-pasos/); assert.match(SRC, /iai-lm-modelos/);
  assert.equal((SRC.match(/<a class="btn iai-go"/g) || []).length, 2, 'la portada sigue con dos destinos: Chat y MCPs');
  assert.ok(!/ai\/lm|'lmstudio'\s*:\s*\[/.test(SRC), 'no hay pestaña ni ruta nueva para LM Studio');
});
await t('los comandos de LM Studio de la Terminal no llevan llaves ni se mezclan con los pasos de encender Hermes', async () => {
  const { TERMINAL } = await import('../public/js/llm/modos.js');
  assert.ok(TERMINAL.filter(([n]) => /LM Studio/.test(n)).every(([, c]) => !/sk-|key=|LM_API_KEY/.test(c)));
  assert.ok(TERMINAL.filter(([n]) => /^(Instalar|Actualizar)/.test(n)).every(([, c]) => !/lms |lmstudio/.test(c)));
});
await t('una página desconocida cae en la portada y canoniza la ruta a #/ai', async () => {
  const s = await pagina(ceo, 'agents', false);
  assert.match(s, /Abrir el Chat/); assert.match(s, /Ver los MCPs/); assert.ok(!/aria-current/.test(s));
  assert.deepEqual(reemplazos, ['#/ai']);
});
await t('la portada de #/ai y #/ai/mcps no tocan la ruta', async () => { await pagina(ceo, '', true); await pagina(ceo, 'mcps', true); assert.deepEqual(reemplazos, []); });

console.log(`\n${ok} pruebas de Inherent AI pasaron`);
