// Pruebas del AI Harness (Fase 4): los 12 agentes del repo como lista fija, cada página de #/ai existe en el router, el Harness es
// de solo lectura y sin costos, y cada página carga sin errores con y sin Hermes (con un navegador de mentira).
// npm run test:harness
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AGENTES, agenteDe, agentesDeModo } from '../public/js/harness/agentes.js';
import { MODOS } from '../public/js/llm/modos.js';
import { PUERTAS } from '../public/js/laya.js';
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

// ---------- El router de harness.js (se lee como texto) ----------
await t('cada página del menú de AI (app.js) existe en el router de harness.js', () => {
  const app = leer('public/js/app.js');
  const ids = [...app.matchAll(/'ai\/([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(ids)].sort(), ['agents', 'evals', 'memory', 'models', 'skills', 'workflows']);
  const paginas = [...SRC.matchAll(/^  \['([a-z]+)', '[A-Za-z ]+', '[\w-]+', '/gm)].map((m) => m[1]);
  assert.deepEqual([...paginas].sort(), ['agents', 'evals', 'memory', 'models', 'skills', 'workflows']);
  const router = SRC.match(/const PAG = \{([^}]*)\}/)[1];
  for (const id of paginas) assert.match(router, new RegExp(`\\b${id}:`), `${id} no está en PAG`);
  for (const m of SRC.matchAll(/^  \['[a-z]+', '[A-Za-z ]+', '([\w-]+)'/gm)) assert.ok(tieneIco(m[1]), `ícono ${m[1]}`);
  for (const m of SRC.matchAll(/\bico\(\s*'([\w-]+)'/g)) assert.ok(tieneIco(m[1]), `ícono ${m[1]}`);
});
await t('el Harness es de solo lectura y no lleva costos', () => {
  assert.ok(!/method\s*:\s*'(POST|PUT|PATCH|DELETE)'/.test(SRC) && !/\bbody\s*:/.test(SRC), 'sin escrituras');
  assert.ok(!/\.(save|create|remove)\(/.test(SRC), 'sin col().save/create/remove');
  assert.ok(!/client:\s*true/.test(SRC), 'sin { client: true }');
  for (const x of ['BASELINE', 'baseline', 'internos', 'payroll', 'finanzas', "'audit'", 'audit/', 'rates', 'seesCosts', 'USD_GTQ']) assert.ok(!SRC.includes(x), `no debe nombrar ${x}`);
  assert.ok(!/api\(\s*[`'"]agents/.test(SRC), 'no lee agents/ desde el servidor');
});

// ---------- Cada página carga sin errores, con y sin Hermes ----------
const noop = () => {};
const store = new Map();
globalThis.window = globalThis;
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.location = { hash: '' }; globalThis.history = { replaceState: noop };
Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true });
const falso = () => new Proxy(function () {}, { get: (_, k) => (k === Symbol.toPrimitive ? () => '' : k === 'querySelector' ? () => null : k === 'querySelectorAll' ? () => [] : k === 'length' ? 0 : falso()), apply: () => falso(), set: () => true });
globalThis.document = falso();

const DATOS = {
  'estrategia': { clientes: [{ slug: 'akai', nombre: 'AKAI', hayFicha: true, nivel: { id: 'growth', nombre: 'Brand Growth' } }], puede: {} },
  'estrategia/akai': { nombre: 'AKAI', nivel: { id: 'partnership', nombre: 'Growth Partnership' }, ficha: { hay: true, incluye: [{ k: 'Finanzas', v: 'según acuerdo' }] }, etapa: { n: 3, confirmada: true }, bloques: [{ estado: 'aprobado' }, { estado: 'vacio' }], vivaAprobada: null },
  'estrategia/library': { docs: [{ id: 'd1', titulo: 'SOP <img src=x onerror=alert(1)>', tipo: 'SOP', carpeta: 'Ventas', folder: 'f1' }] },
  'db/settings/vision': { vision: 'Una visión', mision: 'Una misión' },
  'db/projects': { items: [{ name: 'Ciclo <b>octubre</b>', kind: 'Ciclo mensual', client_slug: 'akai', status: 'activo' }] },
  'db/tasks': { items: [{ title: 'Cerrar el brief', status: 'Hecha', done_at: '2026-10-20', client_slug: 'akai' }, { title: 'Algo vencido', status: 'Por empezar', due: '2026-01-01' }] },
  'laya/juicios': { items: [{ target_label: 'Lead X', gate: 'lead', question_id: 'encaja', tipo: 'noul', prob: 0.8, at: '2026-10-20T10:00:00Z', engine: 'laya-local', status: 'listo' }], puertas: {} },
  'laya/puertas': { puertas: PUERTAS },
  'db/recipes': { items: [{ id: 'r-ceo', name: 'Mi receta', type: 'proyecto', kind: 'Custom', active: true, tasks: [{ key: 'a', title: 'Algo', day: 1, role: 'ceo', after: [] }], meetings: [] }] },
  'entregables?ws=strategy&slug=akai': { items: [{ tool: 'customer-bullseye', titulo: 'La diana', estado: 'Aprobado', criterios: { cumple: ['a'], falta: ['b'] }, historial: [{ en: '2026-10-01T00:00:00Z', accion: 'creó', version: 1 }] }] },
  'avatares?profile=akai': { avatares: [{ nombre: 'Ana', peso: 100 }] },
  'db/accounts/acc-akai': { onboarding: { items: [{ t: 'a', done: true }, { t: 'b' }] } },
  'repo/client/akai': { plan: 'Brand Growth', fields: [1, 2], links: [1], months: [1] },
  'db/brand_boards/akai': { id: 'akai' },
  'repo/client/akai/sistema': { md: 'x', logos: { 'a.svg': 'data:' }, kit: '' },
  'content/cfg?profile=akai': {},
};
const HERMES = {
  '/health': { status: 'ok', version: '1.2' }, '/v1/capabilities': {},
  '/api/model/options': { provider: 'anthropic', model: 'anthropic/claude-opus-5-5', providers: [{ slug: 'anthropic', name: 'Claude', authenticated: true, is_current: true, models: ['claude-opus-5-5'] }, { slug: 'ollama', name: 'Ollama', authenticated: true, models: ['qwen3'] }] },
  '/v1/skills': { data: [{ name: 'hormozi-brain', description: 'Cerebro de <Hormozi>' }] },
};
let hermesOn = false;
const resp = (ok, status, data) => ({ ok, status, json: async () => data });
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.startsWith('http://127.0.0.1:8642')) { const r = hermesOn ? HERMES[u.slice('http://127.0.0.1:8642'.length).split('?')[0]] : null; if (!r) throw new Error('sin Hermes'); return resp(true, 200, r); }
  if (u.startsWith('http://127.0.0.1')) throw new Error('sin puente');
  const ruta = u.replace(/^\/api\//, '');
  if (ruta in DATOS) return resp(true, 200, DATOS[ruta]);
  if (/^entregables\?/.test(ruta)) return resp(true, 200, { items: [] });
  if (/^estrategia\/fuente/.test(ruta)) return resp(true, 200, { titulo: 't', contenido: 'hola' });
  return resp(false, /library|settings|brand_boards/.test(ruta) ? 403 : 404, { error: 'no' });
};

const { render } = await import('../public/js/screens/harness.js');
const ceo = { email: 'ceo@x.com', role: 'ceo', areas: ['estrategia', 'content', 'clients', 'library', 'operations'] };
const otro = { email: 'ed@x.com', role: 'content', areas: ['content'] };
const PAGS = ['', 'agents', 'skills', 'workflows', 'memory', 'models', 'evals'];
async function pagina(me, id, conHermes) {
  hermesOn = conHermes; (globalThis.inherentEscritorio = conHermes ? { hermes: { key: 'k' } } : undefined);
  store.set(`os.ctx.${me.email}`, 'akai');
  const nodos = {};
  const el = { innerHTML: '', addEventListener: noop, querySelectorAll: () => [], querySelector(sel) { return /^#ai-/.test(sel) && this.innerHTML.includes(`id="${sel.slice(1)}"`) ? (nodos[sel] ||= { innerHTML: '' }) : null; } };
  await render(el, { me, sub: id ? [id] : [], alive: () => true });
  await new Promise((r) => setTimeout(r, 80)); // lo que se llena después (Hermes)
  return el.innerHTML + Object.values(nodos).map((n) => n.innerHTML).join('');
}
// «$100M» es el libro de Hormozi, no un monto.
const limpio = (s, c) => { assert.ok(s.length > 400, `${c}: salió casi vacío`); assert.ok(!/undefined|\[object Object\]|NaN/.test(s), `${c}: ${s.match(/.{30}(undefined|\[object Object\]|NaN).{30}/)?.[0]}`); assert.ok(!/<img src=x|<b>octubre|<Hormozi>/.test(s), `${c}: sin escapar`); assert.ok(!/(?:\bQ\d{2,}|\$\d{2,}(?![\dM]))/.test(s), `${c}: monto`); };

for (const conHermes of [false, true]) for (const [me, quien] of [[ceo, 'CEO'], [otro, 'no CEO']]) for (const id of PAGS) {
  await t(`#/ai/${id || ''} carga sin errores · ${quien} · ${conHermes ? 'con' : 'sin'} Hermes`, async () => {
    const s = await pagina(me, id, conHermes), c = `${id || 'overview'}/${quien}/${conHermes}`;
    limpio(s, c);
    assert.match(s, /AI Harness/);
    if (quien === 'no CEO') assert.ok(!/06-ECONOMIA/.test(s), `${c}: nombra los costos`);
    if (id === 'agents') { assert.equal((s.match(/class="ai-num"/g) || []).length, 12); for (const a of AGENTES) assert.ok(s.includes(a.nombre), a.id); }
    if (id === 'skills' && conHermes) assert.match(s, /hormozi-brain/);
    if (id === 'skills' && !conHermes) assert.match(s, /Instalar Hermes/);
    if (id === 'workflows') { assert.match(s, /<svg class="ai-grafo"/); assert.match(s, /Mi receta/); assert.equal((s.match(/class="ai-nd/g) || []).length, 42); assert.match(s, /Ciclo mensual/); }
    if (id === 'memory') { assert.match(s, /Organization/); assert.match(s, /Execution history/); assert.match(s, /AKAI/); }
    if (id === 'models') { assert.match(s, /Motores del Chat/); if (conHermes) { assert.match(s, /claude-opus-5-5/); assert.match(s, /qwen3/); } else assert.match(s, /Hermes no está conectado|Sin Hermes/); }
    if (id === 'evals') { assert.match(s, /Puertas de Laya/); assert.match(s, /Alcance de Consulting/); assert.match(s, /08-CRITERIOS-DE-ACEPTACION/); }
  });
}
await t('una página desconocida cae en la portada (#/ai)', async () => { const s = await pagina(ceo, 'nada', false); assert.match(s, /Deep Research/); assert.match(s, /Create Deliverable/); assert.match(s, /Run Workflow/); assert.match(s, /Analyze Performance/); });

console.log(`\n${ok} pruebas del Harness pasaron`);
