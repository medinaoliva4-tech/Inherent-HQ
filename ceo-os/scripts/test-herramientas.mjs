// Pruebas del registro de herramientas (public/js/herramientas.js): los 42 registros, el grafo viene_de/va_a sin ciclos,
// los íconos, los módulos viejos cubiertos y las rutas (nuevas y viejas) que wsDeRuta traduce.
// npm run test:herramientas
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tieneIco } from '../public/js/iconos.js';
import { WORKSPACES, FLUJO, HERRAMIENTAS, LEGACY_MODULO, LEGACY_BLOQUE, wsDe, pestanaDe, herramientaDe, deWorkspace, cadena, moduloDe, rutaHerramienta, rutaBloque, rutaModulo, wsDeRuta, puedeWs } from '../public/js/herramientas.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const ids = HERRAMIENTAS.map((h) => h.id);

t('5 workspaces con 5 pestañas cada uno, cada pestaña con un paso del flujo', () => {
  assert.deepEqual(WORKSPACES.map((w) => w.id), ['strategy', 'marketing', 'creative', 'consulting', 'production']);
  assert.equal(FLUJO.length, 7);
  const pasos = FLUJO.map((p) => p.id);
  for (const w of WORKSPACES) {
    assert.equal(w.pestanas.length, 5, w.id);
    assert.equal(w.pestanas[0].id, 'overview', w.id);
    assert.ok(w.nombre && w.sub && w.modo && w.color === `--ui-m-${w.id}` && w.icono === `nav-${w.id}`, w.id);
    for (const p of w.pestanas) assert.ok(pasos.includes(p.paso), `${w.id}/${p.id}: paso ${p.paso}`);
    assert.ok(tieneIco(w.icono), w.icono);
  }
  assert.deepEqual(WORKSPACES.map((w) => w.modo), ['estrategia', 'marketing', 'diseno', 'consulting', 'produccion']);
  assert.equal(wsDe('nada'), null); assert.equal(pestanaDe('strategy', 'content'), null); assert.equal(pestanaDe('marketing', 'content').paso, 'execute');
});

t('42 ids únicos: 9 Strategy · 10 Marketing · 7 Creative · 8 Consulting · 8 Production', () => {
  assert.equal(HERRAMIENTAS.length, 42);
  assert.equal(new Set(ids).size, 42);
  assert.deepEqual(WORKSPACES.map((w) => deWorkspace(w.id).length), [9, 10, 7, 8, 8]);
  assert.ok(ids.every((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)), 'ids en kebab');
});

t('cada herramienta: ws válido, pestaña del ws, prioridad, estado, aprueba, guarda, puede y nombre', () => {
  for (const h of HERRAMIENTAS) {
    assert.ok(wsDe(h.ws), `${h.id}: ws ${h.ws}`);
    assert.ok(pestanaDe(h.ws, h.pestana), `${h.id}: pestaña ${h.pestana} no está en ${h.ws}`);
    assert.ok(['P1', 'P2', 'P3'].includes(h.prioridad), `${h.id}: prioridad`);
    assert.ok(['lista', 'parcial', 'pronto'].includes(h.estado), `${h.id}: estado`);
    assert.ok(['ceo', 'coo'].includes(h.aprueba), `${h.id}: aprueba`);
    assert.ok(h.nombre && h.produce && h.guarda?.coll && typeof h.guarda.nota === 'string', `${h.id}: nombre/produce/guarda`);
    assert.equal(typeof h.puede, 'function', `${h.id}: puede`);
    if (h.estado !== 'pronto') assert.ok(h.monta, `${h.id}: ${h.estado} sin monta`); else assert.equal(h.monta, null, `${h.id}: pronto con monta`);
  }
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.estado === 'lista').map((h) => h.id), ['content-calendar']);
  assert.equal(HERRAMIENTAS.filter((h) => h.estado === 'parcial').length, 18);
  assert.equal(HERRAMIENTAS.filter((h) => h.monta).length, 19, 'las 19 que se montan en la Fase 1');
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.monta).map((h) => [h.id, h.monta]), [['customer-bullseye', 'bullseye'], ['customer-avatar-studio', 'avatar'], ['business-xray', 'strategy'], ['offer-architect', 'strategy'], ['growth-roadmap', 'strategy'], ['viral-intelligence-lab', 'research'], ['content-strategy-studio', 'plan'], ['content-calendar', 'calendario'], ['campaign-architect', 'campanas'], ['funnel-builder', 'tech'], ['ads-intelligence', 'ads'], ['marketing-performance-center', 'analytics'], ['brand-dna-studio', 'brandBoard'], ['moodboard-studio', 'brandBoard'], ['creative-direction-lab', 'ideas'], ['visual-identity-builder', 'design'], ['design-studio', 'disenoChat'], ['script-storyboard-studio', 'creacion'], ['post-production-workspace', 'video']]);
  // Consulting lleva el nombre en español y el inglés como alias.
  for (const h of deWorkspace('consulting')) assert.ok(h.alias, `${h.id}: alias`);
  assert.equal(herramientaDe('business-health-assessment').nombre, 'Diagnóstico de crecimiento');
  // Los 3 bloques de strategy.js que se montan.
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.bloque_hz).map((h) => [h.id, h.bloque_hz]), [['business-xray', 'diagnostico'], ['offer-architect', 'oferta'], ['growth-roadmap', 'roadmap']]);
});

t('aprueba: el CEO en todo Strategy, en Ads, en el Diagnóstico y en el Money Model Lab; el COO en lo demás', () => {
  const ceo = HERRAMIENTAS.filter((h) => h.aprueba === 'ceo').map((h) => h.id).sort();
  assert.deepEqual(ceo, [...deWorkspace('strategy').map((h) => h.id), 'ads-intelligence', 'business-health-assessment', 'financial-scenario-lab'].sort());
  assert.ok(deWorkspace('creative').every((h) => h.aprueba === 'coo'), 'Creative no agrega aprobaciones del CEO');
});

t('todo viene_de y va_a existe; va_a es acíclico; viene_de es el inverso (más el lazo del Impact Tracker)', () => {
  for (const h of HERRAMIENTAS) for (const o of [...h.viene_de, ...h.va_a]) assert.ok(ids.includes(o), `${h.id} → ${o}`);
  // DFS con colores: gris = en la pila.
  const color = {}; const visita = (id, pila) => {
    if (color[id] === 'gris') throw new Error(`ciclo: ${[...pila, id].join(' → ')}`);
    if (color[id] === 'negro') return;
    color[id] = 'gris'; for (const y of herramientaDe(id).va_a) visita(y, [...pila, id]); color[id] = 'negro';
  };
  for (const id of ids) visita(id, []);
  for (const h of HERRAMIENTAS) for (const de of h.viene_de) {
    const inverso = herramientaDe(de).va_a.includes(h.id);
    assert.ok(inverso || (h.id === 'business-health-assessment' && de === 'impact-tracker'), `${h.id} viene_de ${de} sin arista`);
  }
  assert.ok(herramientaDe('business-health-assessment').viene_de.includes('impact-tracker'));
  for (const h of HERRAMIENTAS) for (const a of h.va_a) assert.ok(herramientaDe(a).viene_de.includes(h.id), `${a} no sabe que viene de ${h.id}`);
});

t('la cadena customer-bullseye → offer-architect → campaign-architect → creative-direction-lab → production-brief es alcanzable', () => {
  const c = cadena('customer-bullseye');
  assert.equal(c[0], 'customer-bullseye');
  for (const id of ['offer-architect', 'campaign-architect', 'creative-direction-lab', 'production-brief']) assert.ok(c.includes(id), id);
  assert.ok(c.indexOf('offer-architect') < c.indexOf('campaign-architect') && c.indexOf('campaign-architect') < c.indexOf('creative-direction-lab') && c.indexOf('creative-direction-lab') < c.indexOf('production-brief'));
  assert.equal(new Set(c).size, c.length, 'sin repetidos');
  assert.deepEqual(cadena('impact-tracker'), ['impact-tracker']);
  assert.deepEqual(cadena('nada'), []);
});

t('todo ícono existe (herramientas, workspaces, barra y harness)', () => {
  const faltan = HERRAMIENTAS.filter((h) => !tieneIco(h.icono)).map((h) => `${h.id}: ${h.icono}`);
  for (const k of ['nav-home', 'nav-organization', 'nav-ai', 'nav-strategy', 'nav-marketing', 'nav-creative', 'nav-consulting', 'nav-production', 'nav-library', 'nav-finances', 'agents', 'skills', 'workflows', 'memory', 'models', 'evals']) if (!tieneIco(k)) faltan.push(k);
  assert.deepEqual(faltan, []);
});

// brandlist.js importa el DOM: sus MODULES se leen como texto, como hace scripts/test-plan.mjs.
const src = fs.readFileSync(new URL('../public/js/brandlist.js', import.meta.url), 'utf8');
const MODULES = Function(`return ${src.match(/export const MODULES = (\[[\s\S]*?\n\]);/)[1]}`)();
t('LEGACY_MODULO cubre los 16 módulos de MODULES y apunta a pestañas y herramientas que existen', () => {
  const keys = MODULES.map(([k]) => k);
  assert.equal(keys.length, 16);
  assert.deepEqual(Object.keys(LEGACY_MODULO).sort(), [...keys].sort());
  for (const [k, r] of Object.entries(LEGACY_MODULO)) {
    const [ws, pestana, tool] = r.split('/');
    assert.ok(pestanaDe(ws, pestana), `${k}: ${ws}/${pestana}`);
    if (tool) assert.equal(herramientaDe(tool)?.ws, ws, `${k}: ${tool}`); if (tool) assert.equal(herramientaDe(tool).pestana, pestana, `${k}: ${tool} no vive en ${pestana}`);
  }
  for (const [b, r] of Object.entries(LEGACY_BLOQUE)) { const [pestana, tool] = r.split('/'); assert.ok(pestanaDe('strategy', pestana), b); assert.equal(herramientaDe(tool)?.pestana, pestana, b); }
  assert.equal(moduloDe('content-strategy-studio'), 'plan');
  assert.equal(moduloDe('creative-direction-lab'), 'ideas');
  assert.equal(moduloDe('offer-architect'), '');
});

t('rutaHerramienta y rutaBloque arman la ruta canónica', () => {
  assert.equal(rutaBloque('akai', 'modelo'), '#/ws/strategy/akai/strategy/offer-architect/modelo');
  assert.equal(rutaBloque('akai', 'diagnostico'), '#/ws/strategy/akai/analysis/business-xray');
  assert.equal(rutaBloque('akai', 'nada'), '#/ws/strategy/akai/overview');
  assert.equal(rutaBloque('', 'oferta'), '#/ws/strategy');
  assert.equal(rutaHerramienta('marketing', 'akai', 'content-strategy-studio', ['2026-10']), '#/ws/marketing/akai/content/content-strategy-studio/2026-10');
  assert.equal(rutaHerramienta('strategy', 'akai', 'customer-bullseye'), '#/ws/strategy/akai/research/customer-bullseye');
  // rutaModulo: la clave de módulo de Marcas de antes → su herramienta (con resto); desconocida → Marketing › Overview.
  assert.equal(rutaModulo('akai', 'plan', ['2026-10']), '#/ws/marketing/akai/content/content-strategy-studio/2026-10');
  assert.equal(rutaModulo('akai', 'creacion', ['nuevo', 'f:x1']), '#/ws/production/akai/pre-production/script-storyboard-studio/nuevo/f:x1');
  assert.equal(rutaModulo('akai', 'formatos'), '#/ws/creative/akai/concepts/creative-direction-lab/formatos');
  assert.equal(rutaModulo('akai', 'brief'), '#/ws/creative/akai/brief');
  assert.equal(rutaModulo('akai', 'inicio'), '#/ws/marketing/akai/overview');
  assert.equal(rutaModulo('akai', 'loquesea'), '#/ws/marketing/akai/overview');
  assert.equal(rutaModulo('', 'plan'), '#/ws/marketing');
  for (const k of Object.keys(LEGACY_MODULO)) assert.equal('#/' + wsDeRuta(`marcas/akai/${k}`).ruta, rutaModulo('akai', k), k);
  assert.equal(rutaHerramienta('marketing', 'akai', 'customer-bullseye'), '#/ws/strategy/akai/research/customer-bullseye', 'la herramienta manda sobre el ws');
  assert.equal(rutaHerramienta('marketing', 'akai', ''), '#/ws/marketing/akai/overview');
  assert.equal(rutaHerramienta('marketing', 'akai', 'content'), '#/ws/marketing/akai/content', 'una pestaña también sirve');
  assert.equal(rutaHerramienta('marketing', '', 'content-calendar'), '#/ws/marketing');
  assert.equal(rutaHerramienta('nada', 'akai', ''), '#/home');
});

t('wsDeRuta traduce cada ruta vieja de la tabla 3.6 (los ejemplos de «Alias»)', () => {
  const r = (h, contexto = '') => wsDeRuta(h, { contexto })?.ruta ?? null;
  assert.equal(r('#/marcas'), 'home');
  assert.equal(r('#/marcas/akai'), 'ws/marketing/akai/overview');
  assert.equal(r('#/marcas/akai/plan/2026-10'), 'ws/marketing/akai/content/content-strategy-studio/2026-10');
  assert.equal(r('#/marcas/akai/video'), 'ws/production/akai/post-production/post-production-workspace');
  assert.equal(r('#/marcas/akai/creacion'), 'ws/production/akai/pre-production/script-storyboard-studio');
  assert.equal(r('#/marcas/akai/creacion/abc'), 'ws/production/akai/pre-production/script-storyboard-studio/abc');
  assert.equal(r('#/marcas/akai/formatos'), 'ws/creative/akai/concepts/creative-direction-lab/formatos');
  assert.equal(r('#/marcas/akai/inicio'), 'ws/marketing/akai/overview');
  assert.equal(r('#/marcas/akai/brief'), 'ws/creative/akai/brief');
  assert.equal(r('#/marcas/akai/loquesea'), 'ws/marketing/akai/overview', 'módulo desconocido → overview');
  assert.equal(r('#/marcas/diseno/akai'), 'ws/creative/akai/design/design-studio');
  assert.equal(r('#/marcas/diseno', 'nao'), 'ws/creative/nao/design/design-studio');
  assert.equal(r('#/marcas/diseno'), 'ws/creative');
  assert.equal(r('#/marcas/personal/marca'), 'ws/creative/personal/brief/brand-dna-studio');
  assert.equal(r('#/estrategia/akai/roadmap'), 'ws/strategy/akai/roadmap/growth-roadmap');
  assert.equal(r('#/estrategia/akai/modelo'), 'ws/strategy/akai/strategy/offer-architect/modelo');
  assert.equal(r('#/estrategia/akai'), 'ws/strategy/akai/overview');
  assert.equal(r('#/estrategia', 'nao'), 'ws/strategy/nao/overview');
  assert.equal(r('#/estrategia'), 'ws/strategy');
  assert.equal(r('#/consulting/akai'), 'ws/consulting/akai/overview');
  assert.equal(r('#/consulting', 'nao'), 'ws/consulting/nao/overview');
  assert.equal(r('#/consulting'), 'ws/consulting');
  assert.equal(r('#/content/fuentes/akai'), 'ws/strategy/akai/research/customer-bullseye');
  assert.equal(r('content/fuentes/akai'), 'ws/strategy/akai/research/customer-bullseye', 'sin #/ también');
  assert.equal(r('/marcas/akai/'), 'ws/marketing/akai/overview', 'con barra al final también');
  assert.equal(r('#/content/research/akai'), null, 'las demás de content las resuelve app.js');
  assert.equal(r('#/org/home'), null);
  assert.equal(r('#/mimarca'), null);
  assert.equal(r(''), null);
});

t('wsDeRuta lee y valida una ruta #/ws/…', () => {
  assert.deepEqual(wsDeRuta('#/ws/strategy/akai'), { ws: 'strategy', slug: 'akai', pestana: 'overview', tool: '', resto: [], ruta: 'ws/strategy/akai/overview' });
  assert.deepEqual(wsDeRuta('#/ws/strategy'), { ws: 'strategy', slug: '', pestana: 'overview', tool: '', resto: [], ruta: 'ws/strategy' });
  assert.deepEqual(wsDeRuta('#/ws/marketing/akai/content/lo-que-sea'), { ws: 'marketing', slug: 'akai', pestana: 'content', tool: '', resto: [], ruta: 'ws/marketing/akai/content' });
  assert.deepEqual(wsDeRuta('#/ws/marketing/akai/content/content-strategy-studio/2026-10'), { ws: 'marketing', slug: 'akai', pestana: 'content', tool: 'content-strategy-studio', resto: ['2026-10'], ruta: 'ws/marketing/akai/content/content-strategy-studio/2026-10' });
  assert.equal(wsDeRuta('#/ws/marketing/akai/nada').ruta, 'ws/marketing/akai/overview', 'pestaña inválida → overview');
  assert.equal(wsDeRuta('#/ws/marketing/akai/content/customer-bullseye').ruta, 'ws/marketing/akai/content', 'herramienta de otro ws se quita');
  assert.equal(wsDeRuta('#/ws/strategy/akai/overview/customer-bullseye').ruta, 'ws/strategy/akai/research/customer-bullseye', 'la pestaña de la herramienta manda');
  assert.equal(wsDeRuta('#/ws/strategy/akai/customer-bullseye').ruta, 'ws/strategy/akai/research/customer-bullseye', 'la herramienta directa después del cliente');
  assert.equal(wsDeRuta('#/ws/nada'), null);
  assert.equal(wsDeRuta('#/ws'), null);
});

t('puede y puedeWs reflejan brandAccess y hasEstrategia', () => {
  const ceo = { role: 'ceo', areas: ['estrategia', 'content', 'clients'], views: {} };
  const equipo = { role: 'team', areas: ['content'], views: {} };
  const resumen = { role: 'team', areas: ['content'], views: { content: 'resumen' } };
  const cuentas = { role: 'team', areas: ['clients'], views: {} };
  const cliente = { role: 'client', areas: ['estrategia', 'content', 'clients'], views: {} };
  const akai = { slug: 'akai', personal: false, content: true, client: true }, personal = { slug: 'personal', personal: true, content: true, client: false };
  for (const ws of WORKSPACES) assert.ok(puedeWs(ceo, ws.id), ws.id);
  assert.deepEqual(WORKSPACES.filter((w) => puedeWs(equipo, w.id)).map((w) => w.id), ['marketing', 'creative', 'production']);
  assert.deepEqual(WORKSPACES.filter((w) => puedeWs(cliente, w.id)), []);
  assert.deepEqual(WORKSPACES.filter((w) => puedeWs({ role: 'team', areas: ['estrategia'] }, w.id)).map((w) => w.id), ['strategy', 'consulting']);
  assert.equal(puedeWs(ceo, 'nada'), false);
  const p = (id, me, b = akai) => herramientaDe(id).puede(me, b);
  assert.ok(p('customer-bullseye', ceo) && !p('customer-bullseye', equipo) && !p('customer-bullseye', cliente));
  assert.ok(p('business-health-assessment', ceo) && !p('business-health-assessment', equipo));
  assert.ok(p('content-calendar', equipo) && !p('content-calendar', resumen) && !p('content-calendar', cuentas));
  assert.ok(p('marketing-performance-center', resumen), 'resumen también ve el Performance Center');
  assert.ok(p('content-strategy-studio', equipo) && !p('content-strategy-studio', equipo, personal), 'el plan no aplica a la marca personal');
  assert.ok(!p('ads-intelligence', equipo, personal) && !p('funnel-builder', equipo, personal) && !p('campaign-architect', equipo, personal));
  assert.ok(p('brand-dna-studio', cuentas) && !p('brand-dna-studio', equipo) && p('brand-dna-studio', ceo, personal) && !p('brand-dna-studio', cuentas, personal));
  assert.ok(p('visual-identity-builder', equipo) && p('visual-identity-builder', cuentas) && !p('visual-identity-builder', ceo, personal));
  assert.ok(p('post-production-workspace', equipo) && !p('post-production-workspace', cliente));
  assert.ok(p('content-calendar', equipo, null), 'sin contexto también se puede');
  assert.ok(!p('customer-bullseye', null, null), 'sin persona no hay nada');
});

console.log(`\n${ok} pruebas OK`);
