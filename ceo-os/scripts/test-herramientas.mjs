// Pruebas del registro de herramientas (public/js/herramientas.js): los 42 registros, el grafo viene_de/va_a sin ciclos,
// los íconos, los módulos viejos cubiertos y las rutas (nuevas y viejas) que wsDeRuta traduce.
// npm run test:herramientas
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tieneIco } from '../public/js/iconos.js';
import { WORKSPACES, FLUJO, HERRAMIENTAS, LEGACY_MODULO, LEGACY_BLOQUE, wsDe, pestanaDe, herramientaDe, deWorkspace, cadena, moduloDe, rutaHerramienta, rutaBloque, rutaChat, rutaModulo, wsDeRuta, puedeWs, mesesDeCiclo } from '../public/js/herramientas.js';
import { cambiaBloqueado } from '../public/js/strategy/oferta.js';

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
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.estado === 'lista').map((h) => h.id), ['customer-bullseye','customer-avatar-studio','competitor-radar','business-xray','commercial-diagnosis','opportunity-map','offer-architect','pricing-packages','growth-roadmap','viral-intelligence-lab','hook-laboratory','content-strategy-studio','copywriting-studio','content-calendar','campaign-architect','funnel-builder','ads-intelligence','marketing-performance-center','brand-dna-studio','moodboard-studio','creative-direction-lab','visual-identity-builder','design-studio','brand-consistency-checker','creative-performance-analyzer','automation-opportunity-finder','organization-architect','production-brief','script-storyboard-studio','shot-list-builder','production-planner','post-production-workspace','review-approval-studio','content-repurposing'], 'las de Strategy de la Fase 3a + las de Marketing de la 3b + las P1 de Creative de la 3c + las P1 de Production de la 3d + las 13 P2 de la 3e');
  assert.equal(HERRAMIENTAS.filter((h) => h.estado === 'parcial').length, 6, 'las 6 P1 de Consulting de la Fase 2 (la 3e pasó el Funnel Builder y las 2 P2 de Consulting a lista)');
  assert.equal(HERRAMIENTAS.filter((h) => h.monta).length, 40, 'todas menos las 2 P3 (Growth Experiment Lab y AI Video Lab), que siguen Pronto con su ficha');
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.monta).map((h) => [h.id, h.monta]), [['customer-bullseye','shell'],['customer-avatar-studio','avatar'],['competitor-radar','shell'],['business-xray','shell'],['commercial-diagnosis','comercial'],['opportunity-map','shell'],['offer-architect','shell'],['pricing-packages','shell'],['growth-roadmap','roadmap'],['viral-intelligence-lab','viral'],['hook-laboratory','shell'],['content-strategy-studio','plan'],['copywriting-studio','shell'],['content-calendar','calendario'],['campaign-architect','campanas'],['funnel-builder','shell'],['ads-intelligence','adsIntel'],['marketing-performance-center','shell'],['brand-dna-studio','dna'],['moodboard-studio','moodboard'],['creative-direction-lab','shell'],['visual-identity-builder','design'],['design-studio','disenoChat'],['brand-consistency-checker','consistencia'],['creative-performance-analyzer','shell'],['business-health-assessment','shell'],['root-cause-explorer','shell'],['process-mapper','shell'],['financial-scenario-lab','shell'],['automation-opportunity-finder','shell'],['organization-architect','shell'],['solution-blueprint-builder','shell'],['impact-tracker','shell'],['production-brief','shell'],['script-storyboard-studio','creacion'],['shot-list-builder','shell'],['production-planner','planner'],['post-production-workspace','video'],['review-approval-studio','review'],['content-repurposing','shell']]);
  // Consulting lleva el nombre en español y el inglés como alias.
  for (const h of deWorkspace('consulting')) assert.ok(h.alias, `${h.id}: alias`);
  assert.equal(herramientaDe('business-health-assessment').nombre, 'Diagnóstico de crecimiento');
  // Los 3 bloques de strategy.js que ya solo se abren por …/chat (rutaChat); ninguna herramienta monta strategy.js ni la vieja diana directo.
  assert.ok(HERRAMIENTAS.every((h) => h.monta !== 'strategy' && h.monta !== 'bullseye'), 'la clave strategy y la bullseye ya no montan nada');
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
  assert.equal(rutaBloque('akai', 'modelo'), '#/ws/strategy/akai/strategy/offer-architect/chat/modelo', 'Modelo y Leads no tienen herramienta: abren el chat de ese bloque');
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
  assert.equal(r('#/estrategia/akai/modelo'), 'ws/strategy/akai/strategy/offer-architect/chat/modelo');
  assert.equal(r('#/estrategia/akai/leads'), 'ws/strategy/akai/strategy/offer-architect/chat/leads');
  assert.equal(r('#/estrategia/akai/oferta'), 'ws/strategy/akai/strategy/offer-architect', 'la Oferta abre Offer Architect, no su chat');
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

// ---------- Fase 2 · la colección «deliverables» (public/js/entregables.js y su servidor) ----------
const E = await import('../public/js/entregables.js');
const TIPOS_TAREA = ['Delivery', 'Comercial', 'Interna', 'Personal'];
const aprobadoDe = (o = {}) => ({ id: 'e1', tool: 'customer-bullseye', ws: 'strategy', titulo: 'La diana de Akai', client_slug: 'akai', ciclo: '', project_id: 'p1', estado: 'Aprobado', version: 3, aprobado: { por: 'ceo@x.com', en: '2026-10-01T00:00:00Z', version: 3 }, contenido: { a: 1, b: { c: 2 } }, criterios: { cumple: [], falta: [] }, ...o });

t('pasoPermitido: Borrador→En revisión→Aprobado→Entregado y nada más', () => {
  assert.deepEqual(E.ESTADOS, ['Borrador', 'En revisión', 'Aprobado', 'Entregado']);
  assert.equal(E.pasoPermitido('Borrador', 'En revisión'), 'edita');
  assert.equal(E.pasoPermitido('En revisión', 'Borrador'), 'edita');
  assert.equal(E.pasoPermitido('En revisión', 'Aprobado'), 'aprobador');
  assert.equal(E.pasoPermitido('Aprobado', 'Entregado'), 'edita');
  assert.equal(E.pasoPermitido('Aprobado', 'Borrador'), null, 'un Aprobado solo vuelve a Borrador por una versión nueva');
  assert.equal(E.pasoPermitido('Borrador', 'Aprobado'), null, 'no se aprueba sin pasar por revisión');
  assert.equal(E.pasoPermitido('Entregado', 'Borrador'), null);
  assert.equal(E.pasoPermitido('Entregado', 'Aprobado'), null);
  assert.equal(E.pasoPermitido('Borrador', 'Borrador'), null);
  assert.equal(E.pasoPermitido('constructor', 'toString'), null);
});

t('puedeAprobar: aprueba «ceo» solo el CEO; «coo», el CEO o el COO', () => {
  const ceo = { role: 'ceo' }, coo = { role: 'coo' }, equipo = { role: 'team' }, cliente = { role: 'client' };
  const delCeo = herramientaDe('customer-bullseye'), delCoo = herramientaDe('hook-laboratory');
  assert.equal(delCeo.aprueba, 'ceo'); assert.equal(delCoo.aprueba, 'coo');
  assert.ok(E.puedeAprobar(ceo, delCeo) && !E.puedeAprobar(coo, delCeo) && !E.puedeAprobar(equipo, delCeo));
  assert.ok(E.puedeAprobar(ceo, delCoo) && E.puedeAprobar(coo, delCoo) && !E.puedeAprobar(equipo, delCoo) && !E.puedeAprobar(cliente, delCoo));
  assert.ok(E.puedeAprobar(ceo, null) && !E.puedeAprobar(coo, null), 'una herramienta que ya no existe la aprueba solo el CEO');
});

t('faltas() bloquea aprobar: los «falta» del entregable más los de la herramienta', () => {
  const h = herramientaDe('growth-experiment-lab'), antes = h.faltas;
  try {
    assert.deepEqual(E.faltas(aprobadoDe({ tool: 'growth-experiment-lab', criterios: { cumple: ['x'], falta: [] } })), [], 'sin faltas se puede aprobar');
    assert.deepEqual(E.faltas(aprobadoDe({ tool: 'growth-experiment-lab', criterios: { cumple: [], falta: ['Falta la fuente'] } })), ['Falta la fuente']);
    assert.deepEqual(E.faltas(aprobadoDe({ tool: 'nada', criterios: { falta: ['Una'] } })), ['Una'], 'una herramienta que no existe no rompe');
    assert.deepEqual(E.faltas({ tool: 'growth-experiment-lab' }), [], 'sin criterios tampoco');
    h.faltas = (c, extra) => [...(c.vacio ? ['Contenido vacío'] : []), ...(extra.capacidadRoja ? ['Capacidad en rojo'] : [])];
    assert.deepEqual(E.faltas(aprobadoDe({ tool: 'growth-experiment-lab', contenido: { vacio: true }, criterios: { falta: ['Una'] } }), { capacidadRoja: true }), ['Una', 'Contenido vacío', 'Capacidad en rojo']);
    assert.deepEqual(E.faltas(aprobadoDe({ tool: 'growth-experiment-lab', contenido: {} })), []);
  } finally { if (antes) h.faltas = antes; else delete h.faltas; }
});

t('cambioDeContenido: un Aprobado editado sube la versión, vuelve a Borrador y pierde el OK', () => {
  const cur = aprobadoDe();
  assert.deepEqual(E.cambioDeContenido(cur, { a: 2, b: { c: 2 } }), { version: 4, estado: 'Borrador', aprobado: null });
  assert.deepEqual(E.cambioDeContenido({ ...cur, estado: 'Entregado' }, { a: 9 }), { version: 4, estado: 'Borrador', aprobado: null });
  assert.deepEqual(E.cambioDeContenido({ ...cur, estado: 'En revisión', aprobado: null }, { a: 9 }), { version: 4, estado: 'En revisión', aprobado: null }, 'en revisión sigue en revisión');
  assert.deepEqual(E.cambioDeContenido({ ...cur, estado: 'Borrador', aprobado: null }, { a: 9 }), { version: 4, estado: 'Borrador', aprobado: null });
});

t('cambioDeContenido: sin cambio no sube la versión (ni con las llaves en otro orden, como las devuelve jsonb)', () => {
  const cur = aprobadoDe();
  assert.deepEqual(E.cambioDeContenido(cur, { a: 1, b: { c: 2 } }), { version: 3, estado: 'Aprobado', aprobado: cur.aprobado });
  assert.deepEqual(E.cambioDeContenido(cur, { b: { c: 2 }, a: 1 }), { version: 3, estado: 'Aprobado', aprobado: cur.aprobado }, 'el orden de las llaves no es un cambio');
  assert.equal(E.cambioDeContenido({ ...cur, contenido: { x: [1, { y: 2, z: 3 }] } }, { x: [1, { z: 3, y: 2 }] }).version, 3);
  assert.equal(E.cambioDeContenido({ ...cur, contenido: { x: [1, 2] } }, { x: [2, 1] }).version, 4, 'el orden de una lista sí es un cambio');
  assert.equal(E.idVersion('abc', 4), 'abc--v4');
});

t('siguienteDe: solo desde Aprobado, solo a una herramienta de su va_a, con las entradas de la versión aprobada', () => {
  const doc = aprobadoDe({ version: 5, aprobado: { por: 'ceo@x.com', en: '2026-10-01T00:00:00Z', version: 4 } });
  const s = E.siguienteDe(doc, 'customer-avatar-studio');
  assert.deepEqual(s, { tool: 'customer-avatar-studio', ws: 'strategy', pestana: 'research', titulo: 'La diana de Akai', client_slug: 'akai', project_id: 'p1', ciclo: '',
    entradas: [{ deliverable_id: 'e1', version: 4, tool: 'customer-bullseye' }], contenido: {} });
  assert.equal(s.entradas[0].version, doc.aprobado.version, 'apunta a la versión aprobada, no a la abierta');
  assert.equal(E.siguienteDe(doc, 'campaign-architect').ws, 'marketing', 'puede cruzar de workspace si está en va_a');
  assert.equal(E.siguienteDe({ ...doc, estado: 'Borrador', aprobado: null }, 'customer-avatar-studio'), null, 'un Borrador no pasa');
  assert.equal(E.siguienteDe({ ...doc, estado: 'En revisión', aprobado: null }, 'customer-avatar-studio'), null, 'en revisión tampoco');
  assert.ok(E.siguienteDe({ ...doc, estado: 'Entregado' }, 'customer-avatar-studio'), 'un Entregado ya fue aprobado');
  assert.equal(E.siguienteDe(doc, 'content-calendar'), null, 'no está en su va_a');
  assert.equal(E.siguienteDe(doc, 'customer-bullseye'), null, 'ni a sí misma');
  assert.equal(E.siguienteDe(doc, 'nada'), null);
  assert.equal(E.siguienteDe(aprobadoDe({ tool: 'nada' }), 'customer-avatar-studio'), null);
  assert.equal(E.siguienteDe(null, 'customer-avatar-studio'), null);
});

t('tareasDeEntregable: tipo válido, Por empezar, origen entregable, ligadas al entregable y al cliente (máx. 12)', () => {
  const doc = aprobadoDe({ tool: 'solution-blueprint-builder', ws: 'consulting', titulo: 'Plan 90 días', version: 2 });
  const filas = [{ title: 'Documentar el cierre', due: '2026-11-15', assignee: 'ops@x.com', dept: '③ Marketing', fila: 'F1', por_que: 'La restricción es el cierre' }, { title: '   ' }, { title: 'Sin fecha ni dueño', due: 'mañana', fila: 'F2' }];
  const ts = E.tareasDeEntregable(doc, filas, { email: 'yo@x.com', ws: 'consulting' });
  assert.equal(ts.length, 2, 'la fila sin título se ignora');
  for (const x of ts) {
    assert.ok(TIPOS_TAREA.includes(x.tipo), x.tipo);
    assert.equal(x.status, 'Por empezar'); assert.equal(x.origen, 'entregable'); assert.equal(x.deliverable_id, 'e1');
    assert.equal(x.client_slug, 'akai'); assert.equal(x.cliente, 'akai'); assert.equal(x.area, 'consulting'); assert.equal(x.project_id, 'p1'); assert.equal(x.visibility, 'all');
  }
  assert.deepEqual(ts[0], { title: 'Documentar el cierre', description: 'La restricción es el cierre · Entregable «Plan 90 días» v2', status: 'Por empezar', tipo: 'Delivery', dept: '③ Marketing', due: '2026-11-15',
    assignee: 'ops@x.com', visibility: 'all', project_id: 'p1', client_slug: 'akai', cliente: 'akai', area: 'consulting', origen: 'entregable', deliverable_id: 'e1', fila: 'F1' });
  assert.equal(ts[1].assignee, 'yo@x.com', 'sin dueño, quien convierte'); assert.equal(ts[1].due, '', 'una fecha mal escrita se quita'); assert.equal(ts[1].description, 'Entregable «Plan 90 días» v2');
  assert.equal(E.tareasDeEntregable(doc, Array.from({ length: 20 }, (_, i) => ({ title: `T${i}` })), { email: 'a@x.com' }).length, 12, 'máximo 12');
  assert.equal(E.tareasDeEntregable(doc, null, {}).length, 0);
  assert.equal(E.tareasDeEntregable(aprobadoDe({ ws: 'strategy' }), [{ title: 'x' }], { email: 'a@x.com', ws: 'strategy' })[0].visibility, 'private', 'Strategy es privada, como los encargos');
});

t('limpiarEntregable quita lo que pone el servidor y acota lo demás', () => {
  const sucio = { id: 'x', v: 9, _meta: { a: 1 }, estado: 'Aprobado', aprobado: { por: 'a' }, historial: [{ x: 1 }], version: 7, owner: 'otro@x.com', tareas: ['t'], resultado: [{}], siguientes: [{}], archivado: true, ws: 'strategy', pestana: 'research',
    tool: 'customer-bullseye', titulo: 'T'.repeat(300), client_slug: ' AKAI ', ciclo: '2026-10', project_id: 'p-1', contenido: { id: 'dentro', v: 2, _meta: 1, ok: 'sí', anidado: { id: 'a', v: 1, texto: 'x'.repeat(5000), lista: Array.from({ length: 300 }, (_, i) => i) } },
    criterios: { cumple: Array.from({ length: 20 }, (_, i) => `c${i}`), falta: ['y'.repeat(500), '', 3] }, entradas: Array.from({ length: 15 }, (_, i) => ({ deliverable_id: `d${i}`, version: 2, tool: 'customer-bullseye', extra: 1 })), ia: { via: 'hermes', modelo: 'm'.repeat(200) } };
  const l = E.limpiarEntregable(sucio);
  assert.deepEqual(Object.keys(l).sort(), ['ciclo', 'client_slug', 'contenido', 'criterios', 'entradas', 'ia', 'project_id', 'titulo', 'tool']);
  for (const k of ['id', 'v', '_meta', 'estado', 'aprobado', 'historial', 'version', 'owner', 'tareas', 'resultado', 'siguientes', 'archivado']) assert.ok(!(k in l), k);
  assert.equal(l.titulo.length, 120); assert.equal(l.client_slug, 'akai'); assert.equal(l.ciclo, '2026-10'); assert.equal(l.project_id, 'p-1');
  assert.deepEqual(l.contenido, { ok: 'sí', anidado: { texto: 'x'.repeat(4000), lista: Array.from({ length: 200 }, (_, i) => i) } }, 'sin id, v ni _meta en ningún nivel; textos y listas acotados');
  assert.equal(l.criterios.cumple.length, 12); assert.deepEqual(l.criterios.falta, ['y'.repeat(200), '3']);
  assert.equal(l.entradas.length, 10); assert.deepEqual(l.entradas[0], { deliverable_id: 'd0', version: 2, tool: 'customer-bullseye' });
  assert.deepEqual(l.ia, { via: 'hermes', modelo: 'm'.repeat(80) });
  const vacio = E.limpiarEntregable({ tool: 'x y', ciclo: '2026-13', contenido: 'texto', ia: { via: 'inventada' }, entradas: [{ deliverable_id: '../x', version: 1 }, { deliverable_id: 'ok', version: 0 }] });
  assert.deepEqual(vacio, { tool: '', titulo: '', client_slug: '', ciclo: '', project_id: '', contenido: {}, criterios: { cumple: [], falta: [] }, entradas: [], ia: { via: 'manual', modelo: '' } });
  assert.deepEqual(E.limpiarEntregable({ contenido: { a: 1 } }, (c) => ({ a: c.a + 1 })).contenido, { a: 2 }, 'usa el limpiar() de la herramienta');
  assert.deepEqual(E.limpiarEntregable(JSON.parse('{"contenido":{"__proto__":{"x":1},"y":2}}')).contenido, { y: 2 }, 'nada que toque el prototipo');
  assert.deepEqual(E.limpiarGenerico([1, 2]), {}); assert.deepEqual(E.limpiarGenerico(null), {});
});

t('estáticas · collGuard bloquea deliverables y deliverable_versions; COLLS y scoper los tienen', () => {
  const index = fs.readFileSync(new URL('../api/index.js', import.meta.url), 'utf8'), access = fs.readFileSync(new URL('../api/_lib/access.js', import.meta.url), 'utf8');
  const guard = index.slice(index.indexOf('async function collGuard'), index.indexOf('// El tipo de una tarea'));
  assert.match(guard, /coll === 'deliverables' \|\| coll === 'deliverable_versions'\) \{ res\.status\(404\)\.json\(\{ error: 'Los entregables están en \/api\/entregables' \}\)/, 'collGuard: 404 con el aviso');
  assert.match(access, /deliverables: 'content'/); assert.match(access, /deliverable_versions: 'content'/);
  const scoper = access.slice(access.indexOf('export async function scoper'), access.indexOf('export const inScope'));
  assert.match(scoper, /deliverables: \(d\) => lc\(d\.client_slug\) === 'inherent' \|\| slugs\.has\(lc\(d\.client_slug\)\)/, 'scoper: deliverables');
  assert.match(scoper, /deliverable_versions: \(d\) =>/, 'scoper: las versiones también');
  assert.ok(!/CEO_WRITE = new Set\([^)]*deliverables/.test(access), 'deliverables no es solo del CEO');
});

t('estáticas · entregables.js: sin upsert, todo db.update lleva v, sin { client: true }; index.js lo registra', () => {
  const src = fs.readFileSync(new URL('../api/_lib/entregables.js', import.meta.url), 'utf8'), index = fs.readFileSync(new URL('../api/index.js', import.meta.url), 'utf8');
  assert.ok(!src.includes('db.upsert'), 'ninguna ruta usa db.upsert');
  assert.ok(!src.includes('client: true') && !/client\s*:\s*true/.test(src), 'ninguna ruta abre la puerta al cliente');
  // Cada db.update( tiene 5 argumentos: colección, id, datos, la v y quien escribe.
  let n = 0;
  for (let i = src.indexOf('db.update('); i !== -1; i = src.indexOf('db.update(', i + 1)) {
    let depth = 0, comas = 0, q = '', j = i + 'db.update'.length;
    for (; j < src.length; j++) {
      const c = src[j];
      if (q) { if (c === '\\') j++; else if (c === q) q = ''; continue; }
      if ('\'"`'.includes(c)) q = c;
      else if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) { depth--; if (depth === 0) break; }
      else if (c === ',' && depth === 1) comas++;
    }
    assert.equal(comas + 1, 5, `db.update #${n + 1} lleva ${comas + 1} argumentos`); n++;
  }
  assert.ok(n >= 1, 'hay al menos un db.update');
  assert.ok(index.includes('entregables.rutas(on'), 'api/index.js registra entregables.rutas(on');
  assert.match(index, /import \* as entregables from '\.\/_lib\/entregables\.js'/);
  assert.match(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'), /"test:consulting": "node scripts\/test-consulting\.mjs && node scripts\/test-consulting-dinero\.mjs && node scripts\/test-consulting-p2\.mjs"/);
});

t('estáticas · costos y versión: toda respuesta con un entregable pasa por salida(), aprobar exige v y el shell la manda', () => {
  const src = fs.readFileSync(new URL('../api/_lib/entregables.js', import.meta.url), 'utf8'), shell = fs.readFileSync(new URL('../public/js/tool-shell.js', import.meta.url), 'utf8');
  // Las únicas respuestas que llevan un doc crudo son las que no son un doc (la lista de versiones, el aviso del alcance, las tareas).
  const crudas = [...src.matchAll(/res\.json\((.*)\)/g)].map((m) => m[1]).filter((x) => !/salida\(/.test(x));
  assert.deepEqual(crudas.map((x) => x.slice(0, 12)), ['{ items: [],', '{ versiones:', '{ creadas: [', '{ creadas: i'], 'ninguna respuesta con contenido sale sin pasar por salida()');
  assert.match(src, /import \{[^}]*seesCosts[^}]*\} from '\.\/access\.js'/, 'usa seesCosts de access.js');
  assert.ok(src.includes('tool.conCostos(null, limpio.contenido)') && src.includes('tool.conCostos(cur.contenido, limpio.contenido)'), 'POST y PUT conservan o descartan los costos');
  // Aprobar: sin v, 400; con una v vieja, 409; las dos antes de las faltas.
  const apr = src.slice(src.indexOf("if (a === 'Aprobado') {"), src.indexOf('const f = faltas(cur'));
  assert.match(apr, /b\.v == null[^\n]*400[^\n]*FALTA_V/); assert.match(apr, /Number\(b\.v\) !== cur\.v[^\n]*409[^\n]*CONFLICTO/);
  // El shell manda la versión que leyó en estado, tareas, siguiente, resultado y archivar.
  for (const ruta of ['estado', 'tareas', 'siguiente', 'resultado', 'archivar']) assert.match(shell, new RegExp('/' + ruta + '`, \\{ method: \'POST\', body: \\{ v: S\\.doc\\.v'), `tool-shell: /${ruta} manda v`);
  // Solo tres herramientas tienen costos que ocultar: las recomendaciones de pauta, el reporte del Performance Center y el Money Model Lab.
  assert.deepEqual(HERRAMIENTAS.filter((h) => typeof h.sinCostos === 'function' || typeof h.conCostos === 'function').map((h) => h.id), ['pricing-packages', 'ads-intelligence', 'marketing-performance-center', 'financial-scenario-lab', 'shot-list-builder']);
  for (const id of ['ads-intelligence', 'marketing-performance-center', 'financial-scenario-lab', 'shot-list-builder']) { const h = herramientaDe(id); assert.equal(typeof h.sinCostos, 'function', id); assert.equal(typeof h.conCostos, 'function', id); }
});

// ---------- Fase 2: las 6 herramientas reales de Consulting se montan en el Tool Shell ----------
const REALES = [['business-health-assessment', 'salud'], ['root-cause-explorer', 'causas'], ['process-mapper', 'procesos'], ['financial-scenario-lab', 'escenarios'], ['solution-blueprint-builder', 'blueprint'], ['impact-tracker', 'impacto']];
t('Consulting: 6 herramientas con monta shell, su vista y las funciones de su módulo puro; las otras 2 siguen Pronto', () => {
  for (const [id, vista] of REALES) {
    const h = herramientaDe(id);
    assert.equal(h.estado, 'parcial', id); assert.equal(h.monta, 'shell', id); assert.equal(h.vista, vista, id);
    assert.equal(h.guarda.coll, 'deliverables', id);
    assert.ok(typeof h.bloque === 'string' && h.bloque, `${id}: bloque`);
    for (const f of ['vacio', 'prompt', 'leer', 'limpiar', 'faltas', 'aMd']) assert.equal(typeof h[f], 'function', `${id}.${f}`);
    assert.ok(fs.existsSync(new URL(`../public/js/consulting/${vista}-ui.js`, import.meta.url)), `${id}: falta consulting/${vista}-ui.js`);
    // El prompt pide su bloque y sus criterios, y cabe en 5 000 caracteres.
    const p = h.prompt({ hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'Akai', nivel: { id: 'medida', nombre: 'A la medida' } }, ficha: null, estrategia: { etapa: null, trabado: '', meta: '' }, entradas: [], aprendizajes: [] });
    assert.ok(p.includes(h.bloque) && p.includes('criterios') && p.length < 5000, `${id}: prompt`);
    // limpiar tira id, v y _meta del contenido.
    const l = h.limpiar({ ...h.vacio(), id: 'x', v: 9, _meta: { a: 1 } });
    assert.ok(!('id' in l) && !('v' in l) && !('_meta' in l), `${id}: limpiar`);
  }
  assert.equal(new Set(REALES.map(([id]) => herramientaDe(id).bloque)).size, 6, 'cada herramienta pide su propio bloque');
  assert.deepEqual(REALES.filter(([id]) => typeof herramientaDe(id).tareasDe === 'function').map(([id]) => id), ['root-cause-explorer', 'solution-blueprint-builder'], 'solo el Árbol (pruebas) y el Plan (primer paso) se vuelven tareas');
  for (const [id, vista] of [['automation-opportunity-finder', 'automatizacion'], ['organization-architect', 'organizacion']]) { const h = herramientaDe(id); assert.equal(h.estado, 'lista', id); assert.equal(h.monta, 'shell', id); assert.equal(h.vista, vista, id); assert.equal(h.bloque, vista, id); }
});

t('Plan de 90 días: con la capacidad en rojo (extra o Diagnóstico en las entradas) la demanda antes que la capacidad no deja aprobar', () => {
  const fila = (id, tipo, mes) => ({ id, objetivo: 'Aumentar las ventas de $1M a $1.5M para el 31/12/2027', dueno: 'Ventas', primer_paso: 'Llamar a los leads', metrica: 'Ventas del mes', mes, tipo });
  const c = { horizontes: { h12: '', h35: '' }, filas: [fila('f1', 'demanda', 1), fila('f2', 'capacidad', 2)] };
  const h = herramientaDe('solution-blueprint-builder');
  assert.deepEqual(h.faltas(c, {}), [], 'sin Diagnóstico no hay regla');
  assert.equal(h.faltas(c, { capacidadRoja: true }).length, 1, 'extra.capacidadRoja (lo que manda el servidor)');
  assert.equal(h.faltas(c, { capacidadRoja: false }).length, 0, 'extra manda sobre las entradas');
  const diag = (capacidad) => ({ ctx: { entradas: [{ tool: 'business-health-assessment', titulo: 'Diagnóstico', version: 2, contenido: { capacidad } }] } });
  assert.equal(h.faltas(c, diag('rojo')).length, 1, 'el shell pasa las entradas leídas');
  assert.equal(h.faltas(c, diag('verde')).length, 0);
  assert.equal(h.faltas({ ...c, filas: [fila('f1', 'capacidad', 1), fila('f2', 'demanda', 2)] }, diag('rojo')).length, 0, 'capacidad primero: pasa');
  // faltas() de entregables.js suma las del registro (lo que llama el servidor al aprobar).
  assert.equal(E.faltas({ tool: 'solution-blueprint-builder', contenido: c, criterios: { cumple: [], falta: ['otra'] } }, { capacidadRoja: true }).length, 2);
});

// ---------- Fase 3a: Strategy se monta en el Tool Shell (diana, X-Ray, oferta), el Roadmap en su hoja y el chat de hoy por /chat ----------
const ESTRATEGIA = [['customer-bullseye', 'diana', 'bullseye'], ['business-xray', 'xray', 'xray'], ['offer-architect', 'oferta', 'oferta']];
const CTX = (nivel) => ({ hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'Akai', nivel: { id: nivel, nombre: nivel } }, ficha: null, estrategia: { etapa: null, trabado: '', meta: '' }, entradas: [], aprendizajes: [] });
t('Strategy 3a: diana, X-Ray y oferta con monta shell, su vista y las funciones de su módulo puro; todas en estado lista', () => {
  for (const [id, vista, bloque] of ESTRATEGIA) {
    const h = herramientaDe(id);
    assert.equal(h.estado, 'lista', id); assert.equal(h.monta, 'shell', id); assert.equal(h.vista, vista, id); assert.equal(h.bloque, bloque, id);
    for (const f of ['vacio', 'prompt', 'leer', 'limpiar', 'faltas', 'aMd']) assert.equal(typeof h[f], 'function', `${id}.${f}`);
    assert.ok(fs.existsSync(new URL(`../public/js/strategy/${vista}-ui.js`, import.meta.url)), `${id}: falta strategy/${vista}-ui.js`);
    for (const nivel of ['foundation', 'growth', 'partnership', 'medida']) { const p = h.prompt(CTX(nivel)); assert.ok(p.includes(bloque) && p.includes('criterios') && p.length < 5000, `${id}/${nivel}: prompt`); }
    const l = h.limpiar({ ...h.vacio(), id: 'x', v: 9, _meta: { a: 1 } });
    assert.ok(!('id' in l) && !('v' in l) && !('_meta' in l), `${id}: limpiar`);
  }
  assert.equal(new Set(ESTRATEGIA.map(([, , b]) => b)).size, 3, 'cada una pide su propio bloque de IA');
  // Solo la diana y la oferta (Strategy) , el reporte del Performance Center (Marketing, 3b), el Funnel Builder y el Creative Performance Analyzer (3e) traen alUsar; solo la oferta se aprueba con su bloque.
  assert.deepEqual(HERRAMIENTAS.filter((h) => typeof h.alUsar === 'function').map((h) => h.id), ['customer-bullseye', 'offer-architect', 'funnel-builder', 'marketing-performance-center', 'creative-performance-analyzer']);
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.aprobarConBloque).map((h) => [h.id, h.aprobarConBloque]), [['offer-architect', 'oferta']]);
  assert.equal(herramientaDe('offer-architect').aprueba, 'ceo');
  assert.equal(herramientaDe('customer-bullseye').guarda.coll, 'sources'); assert.match(herramientaDe('customer-bullseye').guarda.nota, /PUT estrategia\/:slug\/bullseye/);
  assert.equal(herramientaDe('business-xray').guarda.coll, 'deliverables'); assert.equal(herramientaDe('customer-avatar-studio').guarda.coll, 'avatars');
  // El Roadmap: su hoja propia (sin shell, sin vista) y su casa es viva.roadmap; el Avatar Studio sigue como está.
  const rm = herramientaDe('growth-roadmap');
  assert.equal(rm.monta, 'roadmap'); assert.equal(rm.estado, 'lista'); assert.equal(rm.vista, undefined); assert.equal(rm.guarda.coll, 'strategy'); assert.match(rm.guarda.nota, /viva\.roadmap/);
  assert.equal(herramientaDe('customer-avatar-studio').monta, 'avatar'); assert.equal(herramientaDe('customer-avatar-studio').estado, 'lista');
  const ui = fs.readFileSync(new URL('../public/js/strategy/roadmap-ui.js', import.meta.url), 'utf8');
  assert.match(ui, /export async function roadmapTool\(host, \{ me, slug, b, alive, resto/, 'roadmap-ui.js exporta roadmapTool con la firma del contrato');
  for (const [id, vista] of ESTRATEGIA.map(([i, v]) => [i, v])) assert.match(fs.readFileSync(new URL(`../public/js/strategy/${vista}-ui.js`, import.meta.url), 'utf8'), /export const vista = \{/, `${id}: strategy/${vista}-ui.js exporta vista`);
});

t('Strategy 3a: «Usar esta propuesta» no pierde los lotes de la diana ni toca lo que el nivel de la oferta bloquea', () => {
  // Diana: la propuesta de la IA no trae calib; alUsar conserva los lotes que ya había.
  const dn = herramientaDe('customer-bullseye'), actual = dn.limpiar({ ...dn.vacio(), center: 'Dueños de restaurante', calib: [{ at: '2026-10-01', n: 3, ok: 2 }] });
  const prop = dn.limpiar({ ...dn.vacio(), center: 'Otro centro' });
  const rd = dn.alUsar(prop, actual, CTX('growth'));
  assert.equal(rd.center, 'Otro centro', 'lo nuevo entra'); assert.deepEqual(rd.calib, actual.calib, 'los lotes se quedan');
  // Oferta: partimos de un contenido lleno y la IA propone otra cosa.
  const of = herramientaDe('offer-architect');
  const lleno = of.limpiar({ ecuacion: { sueno: { valor: 8, evidencia: 'a' }, probabilidad: { valor: 7, evidencia: 'b' }, tiempo: { valor: 3, evidencia: 'c' }, esfuerzo: { valor: 2, evidencia: 'd' } },
    stack: { problemas: ['p'], soluciones: ['s'], vehiculos: ['v'], bonos: ['b'], garantia: 'g', escasez: 'e', nombre: 'N' }, propuesta: 'La propuesta', variaciones: [{ nombre: 'A', precio: 'Q1,500', para_quien: 'x', diferencia: 'y' }, { nombre: 'B', precio: 'Q2,500', para_quien: 'x', diferencia: 'y' }],
    escalera: { atraccion: { hoy: 'h', propuesta: 'p', cita: 'c' }, upsell: {}, downsell: {}, continuidad: {} }, empujar: { oferta: 'Vieja', mensaje: 'Vieja' } });
  const vaciaIA = of.limpiar({ empujar: { oferta: 'Nueva', mensaje: 'El mensaje nuevo' } });
  // Brand Growth: solo cambia lo que empuja; todo lo demás se queda como estaba (y el servidor no lo rechaza).
  const g = of.alUsar(vaciaIA, lleno, CTX('growth'));
  assert.deepEqual(g.empujar, { oferta: 'Nueva', mensaje: 'El mensaje nuevo' }); assert.deepEqual({ ...g, empujar: null }, { ...lleno, empujar: null });
  assert.deepEqual(cambiaBloqueado(lleno, g, 'growth'), [], 'cambiaBloqueado de Growth no ve nada');
  // Foundation y a la medida: la escalera no entra y se queda; Partnership: todo lo de la IA entra.
  for (const n of ['foundation', 'medida']) { const r = of.alUsar(vaciaIA, lleno, CTX(n)); assert.deepEqual(r.escalera, lleno.escalera, `${n}: la escalera se queda`); }
  assert.deepEqual(of.alUsar(vaciaIA, lleno, CTX('partnership')), vaciaIA, 'Partnership: la propuesta entra completa');
  // Sin nivel o con basura no lanza.
  assert.doesNotThrow(() => of.alUsar(null, undefined, null)); assert.doesNotThrow(() => dn.alUsar('x', 5, undefined));
});

t('Strategy 3a: rutaChat arma …/<herramienta>/chat[/<bloque>] y wsDeRuta la lee con el resto intacto', () => {
  assert.equal(rutaChat('akai', 'diagnostico'), '#/ws/strategy/akai/analysis/business-xray/chat');
  assert.equal(rutaChat('akai', 'oferta'), '#/ws/strategy/akai/strategy/offer-architect/chat');
  assert.equal(rutaChat('akai', 'modelo'), '#/ws/strategy/akai/strategy/offer-architect/chat/modelo');
  assert.equal(rutaChat('akai', 'leads'), '#/ws/strategy/akai/strategy/offer-architect/chat/leads');
  assert.equal(rutaChat('akai', 'roadmap'), '#/ws/strategy/akai/roadmap/growth-roadmap/chat');
  assert.equal(rutaChat('akai', 'nada'), '#/ws/strategy/akai/overview'); assert.equal(rutaChat('', 'oferta'), '#/ws/strategy');
  assert.equal(rutaHerramienta('strategy', 'akai', 'business-xray', ['chat']), rutaChat('akai', 'diagnostico'));
  assert.deepEqual(wsDeRuta('#/ws/strategy/akai/strategy/offer-architect/chat/modelo'), { ws: 'strategy', slug: 'akai', pestana: 'strategy', tool: 'offer-architect', resto: ['chat', 'modelo'], ruta: 'ws/strategy/akai/strategy/offer-architect/chat/modelo' });
  assert.deepEqual(wsDeRuta('#/ws/strategy/akai/roadmap/growth-roadmap/chat').resto, ['chat']);
  // Las rutas viejas de la Fase 1 (offer-architect/modelo) las atiende workspace.js; aquí siguen leyéndose como resto.
  assert.deepEqual(wsDeRuta('#/ws/strategy/akai/strategy/offer-architect/modelo').resto, ['modelo']);
});

t('Strategy 3a · estáticas: workspace.js monta las vistas, el roadmap y el chat solo por /chat; el avatar lo abre quien ve Strategy', () => {
  const ws = fs.readFileSync(new URL('../public/js/screens/workspace.js', import.meta.url), 'utf8');
  for (const v of ['diana', 'xray', 'oferta']) assert.match(ws, new RegExp(`${v}: \\(\\) => import\\('\\.\\./strategy/${v}-ui\\.js'\\)`), `VISTAS.${v}`);
  assert.match(ws, /case 'roadmap':[\s\S]*import\('\.\.\/strategy\/roadmap-ui\.js'\)[\s\S]*roadmapTool\(host, \{ me, slug, b, alive, resto \}\)/, 'monta roadmap');
  assert.ok(!/case 'strategy':|case 'bullseye':/.test(ws) && !/bullseyeTool/.test(ws), 'ya no hay montaje directo de strategy.js ni de la vieja diana');
  assert.match(ws, /resto\[0\] !== 'chat'/, 'el chat se abre por /chat');
  assert.match(ws, /const chat = bloqueChat\(t\);\s*if \(chat\) return strategy\(host, \{ me, sub: \[slug, chat\], alive \}\)/, 'strategy.js se monta como hoy: strategy(host, { me, sub: [slug, bloque], alive })');
  assert.ok(!/avatar: 'icp'/.test(ws), 'el Avatar Studio no pide el módulo icp de Contenido: el servidor acepta Contenido o Estrategia');
  assert.match(fs.readFileSync(new URL('../public/js/screens/strategy.js', import.meta.url), 'utf8'), /rutaChat\(slug, x\.id\)/, 'el menú de bloques del chat se queda en el chat');
});

t('Strategy 3a · estáticas: el shell aprueba y reabre Offer Architect con su bloque, cierra todo con APROBADO y trae «Chat de Strategy»', () => {
  const sh = fs.readFileSync(new URL('../public/js/tool-shell.js', import.meta.url), 'utf8');
  // (a) Aprobar y Reabrir van por la ruta del bloque con { aprobar }; aprobar lleva además la v del entregable que se revisó (el servidor
  // la compara y corre sus faltas); con aprobarConBloque nunca se manda «Aprobado» a /estado.
  assert.match(sh, /api\(`estrategia\/\$\{enc\(slug\)\}\/\$\{enc\(bloque\)\}\/aprobar`, \{ method: 'POST', body: si \? \{ aprobar: true, v: S\.doc\.v \} : \{ aprobar: false \} \}\)/);
  assert.match(sh, /'tsh-aprobar': \(\) => \(tool\.aprobarConBloque \? aprobarBloque\(true\) : cambiarEstado\('Aprobado'\)\), 'tsh-reabrir': \(\) => aprobarBloque\(false\)/);
  assert.ok(!/aprobarBloque[\s\S]{0,900}\/estado/.test(sh.slice(sh.indexOf('async function aprobarBloque'), sh.indexOf('// ---------- Tareas'))), 'aprobarBloque no toca /estado');
  // (b) alcance APROBADO: otro aviso, otro tono; los 409 APROBADO releen el alcance sin perder lo editado.
  assert.match(sh, /a\.code === 'APROBADO'\) return mount\(el, html`<div class="tsh-aprobada" role="status"/);
  assert.match(sh, /e\?\.status === 409 && e\.code === 'APROBADO'/);
  // (c) El botón del chat de Strategy: solo en Strategy y con bloque; no reemplaza a «Continuar en el Chat».
  assert.match(sh, /tool\.ws === 'strategy' && tool\.bloque_hz\) salida\.push\(html`<a class="btn ghost sm tsh-act-chat" href="\$\{rutaHerramienta\(tool\.ws, slug, tool\.id, \['chat'\]\)\}"/);
  assert.match(sh, /'tsh-chat': \(\) => abrirEnChat\(me\.email, \{ modo, slug \}\)/);
  // «Usar esta propuesta» pasa por alUsar de la herramienta.
  assert.match(sh, /tool\.alUsar\(nuevo, clon\(S\.contenido\), S\.ctx\)/);
  // Cerrado (aprobado con su bloque): ni Generar ni Guardar.
  assert.match(sh, /const editable = \(\) => escribe\(\) && !cerrado\(\)/);
});

// ---------- Fase 3b: Marketing P1 ----------
const M = await import('../public/js/marketing/reporte.js');
const A = await import('../public/js/marketing/ads.js');
const PAT = await import('../public/js/marketing/patrones.js');
const leerSrc = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

t('Marketing 3b: las 6 herramientas P1 quedan «lista» con su montaje; solo el Performance Center va al shell y solo él tiene ciclo', () => {
  const montaje = { 'viral-intelligence-lab': 'viral', 'content-strategy-studio': 'plan', 'content-calendar': 'calendario', 'campaign-architect': 'campanas', 'ads-intelligence': 'adsIntel', 'marketing-performance-center': 'shell' };
  for (const [id, monta] of Object.entries(montaje)) { const h = herramientaDe(id); assert.equal(h.estado, 'lista', id); assert.equal(h.monta, monta, id); assert.equal(h.ws, 'marketing', id); assert.ok(h.guarda.coll && h.guarda.nota, `${id}: guarda`); }
  assert.equal(herramientaDe('marketing-performance-center').vista, 'rendimiento');
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.ciclo && h.ws === 'marketing').map((h) => h.id), ['marketing-performance-center'], 'en Marketing, un solo entregable por mes: solo el Performance Center');
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.monta === 'shell' && h.ws === 'marketing').map((h) => h.id), ['hook-laboratory', 'copywriting-studio', 'funnel-builder', 'marketing-performance-center']);
  assert.equal(herramientaDe('campaign-architect').guarda.coll, 'mk_campaigns'); assert.equal(herramientaDe('content-strategy-studio').guarda.coll, 'plans'); assert.equal(herramientaDe('content-calendar').guarda.coll, 'content');
  assert.equal(herramientaDe('growth-experiment-lab').estado, 'pronto', 'el Growth Experiment Lab (P3) sigue Pronto');
});

t('Marketing 3b: el Performance Center trae las funciones de reporte.js; su prompt pide su bloque y sus criterios y cabe en 5 000', () => {
  const h = herramientaDe('marketing-performance-center');
  assert.equal(h.bloque, 'reporte'); assert.equal(h.bloque, M.BLOQUE);
  for (const f of ['vacio', 'prompt', 'leer', 'limpiar', 'faltas', 'aMd', 'tareasDe', 'alUsar', 'sinCostos', 'conCostos']) assert.equal(typeof h[f], 'function', `mpc.${f}`);
  assert.equal(h.vacio, M.vacio); assert.equal(h.limpiar, M.limpiar); assert.equal(h.faltas, M.faltas); assert.equal(h.sinCostos, M.sinCostos); assert.equal(h.conCostos, M.conCostos); assert.equal(h.alUsar, M.alUsar); assert.equal(h.tareasDe, M.tareasDe);
  const p = h.prompt({ hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'Akai', nivel: { id: 'medida', nombre: 'A la medida' } }, ficha: null, estrategia: { etapa: null, trabado: '', meta: '' }, entradas: [], aprendizajes: [] });
  assert.ok(p.includes('reporte') && p.includes('criterios') && p.length < 5000, 'prompt');
  const l = h.limpiar({ ...h.vacio('2026-10'), id: 'x', v: 9, _meta: { a: 1 } });
  assert.ok(!('id' in l) && !('v' in l) && !('_meta' in l) && l.mes === '2026-10', 'limpiar');
  // alUsar: el mes de la pantalla manda y los KPIs salen del contexto, nunca del modelo.
  const u = h.alUsar({ mes: '2026-01', resumen: 'Algo', kpis: [{ id: 'alcance', valor: 999999, fuente: 'modelo' }] }, { mes: '2026-10', kpis: [] }, { kpis: [{ id: 'alcance', valor: 1200, fuente: 'Windsor' }] });
  assert.equal(u.mes, '2026-10'); assert.deepEqual(u.kpis, [{ id: 'alcance', valor: 1200, fuente: 'Windsor' }]);
});

t('Marketing 3b: el Performance Center: quien no ve costos recibe el reporte sin gasto, CPA ni ROAS y al guardar no los pierde ni los escribe', () => {
  const h = herramientaDe('marketing-performance-center');
  const doc = { mes: '2026-10', resumen: 'Subió el alcance.', kpis: [{ id: 'alcance', valor: 1200, fuente: 'Windsor' }, { id: 'gasto', valor: 3400, fuente: 'Windsor' }, { id: 'cpa', valor: 85, fuente: 'Windsor' }],
    hallazgos: [{ texto: 'El alcance subió 20%.', kpi: 'alcance' }, { texto: 'El CPA bajó a 85.', kpi: 'cpa' }], siguientes: [{ accion: 'Subir los reels', area: 'Marketing', fecha: '2026-11-03' }], nota_interna: 'Se lo dije al cliente.' };
  const visto = h.sinCostos(doc);
  assert.equal(visto.kpis.find((k) => k.id === 'gasto').valor, null); assert.equal(visto.kpis.find((k) => k.id === 'cpa').valor, null); assert.equal(visto.kpis.find((k) => k.id === 'alcance').valor, 1200);
  assert.ok(!JSON.stringify(visto).includes('3400') && !JSON.stringify(visto).includes('85'), 'ningún monto viaja');
  assert.equal(visto.hallazgos.length, 1, 'el hallazgo que cita el CPA no se ve');
  const guardado = h.conCostos(doc, { ...visto, resumen: 'Subió el alcance y lo celebramos.' });
  assert.equal(guardado.kpis.find((k) => k.id === 'gasto').valor, 3400, 'lo guardado vuelve'); assert.equal(guardado.hallazgos.length, 2); assert.equal(guardado.resumen, 'Subió el alcance y lo celebramos.');
  const nuevo = h.conCostos(null, { ...doc, kpis: [{ id: 'gasto', valor: 1, fuente: 'yo' }] });
  assert.ok(nuevo.kpis.every((k) => k.id !== 'gasto' || k.valor === null), 'quien no ve costos no escribe un monto nuevo');
});

t('Marketing 3b: Ads Intelligence trae limpiar y faltas de ads.js; una rec sin números no se aprueba; sin costos, sin montos y se conservan al guardar', () => {
  const h = herramientaDe('ads-intelligence');
  assert.equal(h.bloque, 'recs'); assert.equal(h.limpiar, A.limpiarRec); assert.equal(h.faltas, A.faltas); assert.equal(typeof h.vacio, 'function');
  assert.equal(h.aprueba, 'ceo');
  assert.ok(h.faltas({ tipo: 'pausar', accion: 'Pausar' }).length > 0, 'sin evidencia no se aprueba');
  const rec = { tipo: 'pausar', donde: { nivel: 'campana', nombre: 'Verano' }, evidencia: { metrica: 'CPA', valor: 85, umbral: 60, periodo: 'últimos 30 días' }, detalle: 'CPA Q85 contra Q60', accion: 'Pausar Verano (gasto Q1,200)', origen: 'calculada' };
  const l = h.limpiar(rec);
  assert.deepEqual(h.faltas(l), []); assert.equal(l.requiere_ceo, true);
  const visto = h.sinCostos(l);
  assert.equal(visto.evidencia.valor, null); assert.equal(visto.evidencia.umbral, null); assert.ok(!/85|60|1,200/.test(JSON.stringify(visto)), 'ningún monto viaja');
  const guardado = h.conCostos(l, { ...visto, estado: 'aplicada' });
  assert.equal(guardado.estado, 'aplicada'); assert.equal(guardado.evidencia.valor, 85); assert.equal(guardado.evidencia.umbral, 60); assert.equal(guardado.detalle, 'CPA Q85 contra Q60'); assert.equal(guardado.accion, 'Pausar Verano (gasto Q1,200)');
  const nueva = h.conCostos(null, rec);
  assert.equal(nueva.evidencia.valor, null, 'quien no ve costos no escribe montos nuevos');
  // Una rec sin monto (CTR) no se toca.
  const ctr = h.limpiar({ tipo: 'fatiga', donde: { nivel: 'anuncio', nombre: 'A' }, evidencia: { metrica: 'CTR', valor: 0.8, umbral: 1, periodo: '7 días' }, accion: 'Rotar el creativo' });
  assert.deepEqual(h.conCostos(ctr, { ...h.sinCostos(ctr), estado: 'descartada' }), { ...ctr, estado: 'descartada' });
  // El servidor limpia el contenido con limpiar() de la herramienta y no guarda lo que no conoce.
  const ent = E.limpiarEntregable({ tool: 'ads-intelligence', client_slug: 'akai', contenido: { ...rec, id: 'x', v: 3, _meta: {}, extra: 1 } }, h.limpiar);
  assert.ok(!('id' in ent.contenido) && !('extra' in ent.contenido) && ent.contenido.tipo === 'pausar');
});

t('Marketing 3b: el Viral Lab trae limpiar, faltas, prompt y leer de patrones.js; un patrón necesita 2 posts reales para aprobarse', () => {
  const h = herramientaDe('viral-intelligence-lab');
  assert.equal(h.bloque, 'patrones'); assert.equal(h.bloque, PAT.BLOQUE);
  for (const f of ['vacio', 'prompt', 'leer', 'limpiar', 'faltas', 'aMd']) assert.equal(typeof h[f], 'function', `viral.${f}`);
  assert.equal(h.limpiar, PAT.limpiar); assert.equal(h.faltas, PAT.faltas);
  const l = h.limpiar({ nombre: 'El antes y después', items: ['instagram:abc'], v: 4, _meta: { a: 1 }, raro: 1 }); // el patrón tiene su propio id; v, _meta y lo desconocido se caen
  assert.ok(!('v' in l) && !('_meta' in l) && !('raro' in l));
  assert.ok(h.faltas(l).length > 0, 'con menos de 2 posts reales no se aprueba');
  assert.ok(h.prompt({ hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'Akai' }, items: [], patrones: [] }).length < 5000);
});

t('Marketing 3b: mesesDeCiclo da el actual y los 11 anteriores, también a través de un año; sin fecha válida, nada', () => {
  const l = mesesDeCiclo('2026-10-27', 12);
  assert.equal(l.length, 12); assert.equal(l[0], '2026-10'); assert.equal(l[1], '2026-09'); assert.equal(l[11], '2025-11'); assert.equal(new Set(l).size, 12);
  assert.deepEqual(mesesDeCiclo('2026-01', 3), ['2026-01', '2025-12', '2025-11']);
  assert.deepEqual(mesesDeCiclo('', 12), []); assert.deepEqual(mesesDeCiclo('2026-13-01', 12), []); assert.deepEqual(mesesDeCiclo(null), []);
  assert.ok(l.every((m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m)));
});

t('Marketing 3b: quien tiene Contenido en «resumen» solo ve el Performance Center en Marketing; el equipo ve las demás', () => {
  const resumen = { role: 'team', areas: ['content'], views: { content: 'resumen' } }, equipo = { role: 'team', areas: ['content'], views: {} }, akai = { slug: 'akai', personal: false, content: true, client: true };
  assert.deepEqual(deWorkspace('marketing').filter((h) => h.puede(resumen, akai)).map((h) => h.id), ['marketing-performance-center']);
  assert.deepEqual(deWorkspace('marketing').filter((h) => h.puede(equipo, akai)).map((h) => h.id), deWorkspace('marketing').map((h) => h.id));
  // Por ruta: la herramienta de rendimiento abre con el mes al final.
  assert.equal(rutaHerramienta('marketing', 'akai', 'marketing-performance-center', ['2026-09']), '#/ws/marketing/akai/analytics/marketing-performance-center/2026-09');
  const r = wsDeRuta('#/ws/marketing/akai/analytics/marketing-performance-center/2026-09');
  assert.equal(r.tool, 'marketing-performance-center'); assert.deepEqual(r.resto, ['2026-09']);
  // Las rutas viejas de Investigación, Ads y Resultados siguen llegando a su herramienta.
  assert.equal(wsDeRuta('#/marcas/akai/investigacion').ruta, 'ws/marketing/akai/audience/viral-intelligence-lab');
  assert.equal(wsDeRuta('#/marcas/akai/ads').ruta, 'ws/marketing/akai/campaigns/ads-intelligence');
  assert.equal(wsDeRuta('#/marcas/akai/resultados').ruta, 'ws/marketing/akai/analytics/marketing-performance-center');
});

t('Marketing 3b · estáticas: workspace.js monta el Viral Lab, Ads Intelligence y el rendimiento; pasa resto al plan y a las campañas', () => {
  const ws = leerSrc('public/js/screens/workspace.js');
  assert.match(ws, /rendimiento: \(\) => import\('\.\.\/marketing\/rendimiento-ui\.js'\)/, 'VISTAS.rendimiento');
  assert.match(ws, /case 'viral': case 'adsIntel':[\s\S]*'\.\.\/marketing\/viral-ui\.js', 'viralTool'[\s\S]*'\.\.\/marketing\/ads-intel-ui\.js', 'adsIntelTool'[\s\S]*hoja\(host, \{ me, slug, b, alive, resto \}\)/, 'monta viralTool y adsIntelTool con { me, slug, b, alive, resto }');
  assert.match(ws, /case 'campanas': return campanasUI\(host, \{ me, b, alive, resto \}\)/); assert.match(ws, /case 'plan': return planMesUI\(host, \{ me, b, alive, resto \}\)/);
  assert.match(ws, /viral: 'investigacion'/); assert.match(ws, /adsIntel: 'ads'/);
  assert.ok(!/case 'research'|case 'ads':|adsUI|analytics: 'resultados'/.test(ws), 'ya no hay montaje de las claves viejas research y ads');
  assert.match(ws, /resto\[0\] === 'instagram'[\s\S]*embed\(sede, 'analytics'\)/, 'los analytics de Instagram de siempre siguen en el Performance Center');
  // La diana y los avatares de Strategy solo se ofrecen (por link) a quien abre Strategy; quien ve solo el rendimiento pide solo esa herramienta.
  assert.match(ws, /pestana\.id === 'audience' && veEstrategia\(me\)/);
  assert.match(ws, /soloRendimiento \? '&tool=marketing-performance-center' : ''/);
  assert.ok(fs.existsSync(new URL('../public/js/marketing/rendimiento-ui.js', import.meta.url)) && fs.existsSync(new URL('../public/js/marketing/viral-ui.js', import.meta.url)) && fs.existsSync(new URL('../public/js/marketing/ads-intel-ui.js', import.meta.url)));
  assert.match(leerSrc('public/js/marketing/rendimiento-ui.js'), /export const vista = \{/); assert.match(leerSrc('public/js/marketing/viral-ui.js'), /export async function viralTool\(/); assert.match(leerSrc('public/js/marketing/ads-intel-ui.js'), /export async function adsIntelTool\(/);
});

t('Marketing 3b · estáticas: el shell con ciclo trae el selector de mes, pide la lista con ?ciclo=, guarda con el mes y recuerda el mes en la ruta', () => {
  const sh = leerSrc('public/js/tool-shell.js');
  assert.match(sh, /const conCiclo = Boolean\(tool\.ciclo\)/);
  assert.match(sh, /conCiclo && S\.ciclo \? `&ciclo=\$\{enc\(S\.ciclo\)\}` : ''/, 'la lista se pide con &ciclo=<mes>');
  assert.match(sh, /mesesDeCiclo\(today\(\), 12\)/, 'el actual y los 11 anteriores');
  assert.match(sh, /data-act="tsh-ciclo"/); assert.match(sh, /'tsh-ciclo': \(el\) => cambiarCiclo\(el\.value\)/);
  assert.match(sh, /ciclo: doc\?\.ciclo \|\| \(conCiclo \? mesDeTrabajo\(\) : ''\)/, 'el POST manda el ciclo');
  assert.match(sh, /conCiclo \? \(S\.ciclo \? \[S\.ciclo\] : \[\]\) : S\.doc \? \[S\.doc\.id\] : \[\]/, 'la ruta lleva el mes (resto[0] = AAAA-MM)');
  assert.match(sh, /`\$\{tool\.nombre\} · \$\{mesDeTrabajo\(\)\}`/, 'el título por defecto es «<herramienta> · <mes>»');
  assert.match(sh, /S\.ctx = \{ \.\.\.S\.ctx, mes: S\.ciclo \}/, 'la IA recibe el mes elegido');
  // Una herramienta sin ciclo se pide como siempre: sin ciclo en la URL.
  assert.ok(sh.includes("`entregables?ws=${enc(tool.ws)}&slug=${enc(slug)}&tool=${enc(tool.id)}${conCiclo"), 'la URL de la lista es la de siempre más el ciclo opcional');
});

// ---------- Fase 3c: Creative ----------
t('Creative 3c: las 5 P1 quedan «lista» con su montaje; solo el Creative Direction Lab va al shell y tiene ciclo; las 2 P2 siguen Pronto', () => {
  const montaje = { 'brand-dna-studio': 'dna', 'moodboard-studio': 'moodboard', 'creative-direction-lab': 'shell', 'visual-identity-builder': 'design', 'design-studio': 'disenoChat' };
  for (const [id, monta] of Object.entries(montaje)) { const h = herramientaDe(id); assert.equal(h.estado, 'lista', id); assert.equal(h.monta, monta, id); assert.equal(h.ws, 'creative', id); assert.ok(h.guarda.coll && h.guarda.nota, `${id}: guarda`); }
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.monta === 'shell' && h.ws === 'creative').map((h) => h.id), ['creative-direction-lab', 'creative-performance-analyzer']);
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.ciclo && h.ws === 'creative').map((h) => h.id), ['creative-direction-lab', 'creative-performance-analyzer']);
  for (const id of ['brand-consistency-checker', 'creative-performance-analyzer']) assert.equal(herramientaDe(id).estado, 'lista', id);
  assert.equal(herramientaDe('brand-dna-studio').guarda.coll, 'brand_boards'); assert.equal(herramientaDe('moodboard-studio').guarda.coll, 'brand_boards'); assert.equal(herramientaDe('creative-direction-lab').guarda.coll, 'deliverables');
});

t('Creative 3c: el Creative Direction Lab trae las funciones de direccion.js; su prompt pide su bloque y sus criterios y cabe en 5 000', () => {
  const h = herramientaDe('creative-direction-lab');
  assert.equal(h.vista, 'direccion'); assert.equal(h.bloque, 'direccion');
  for (const f of ['vacio', 'prompt', 'leer', 'limpiar', 'faltas', 'aMd']) assert.equal(typeof h[f], 'function', f);
  const p = h.prompt({ cliente: { nombre: 'X', slug: 'x' }, hoy: '2026-10-27', mes: '2026-10', entradas: [] });
  assert.ok(p.includes('direccion') && p.includes('criterios') && p.length < 5000, 'prompt');
  assert.match(p, /nunca leas ni cites inherent\/06-ECONOMIA/i, 'el prompt prohíbe leer los costos de Inherent');
  assert.equal(h.limpiar(h.vacio()).conceptos.length, 0);
});

t('Creative 3c · estáticas: workspace.js monta la dirección, el DNA y el moodboard; Ideas y Formatos siguen como sub-vistas sin shell', () => {
  const ws = leerSrc('public/js/screens/workspace.js');
  assert.match(ws, /direccion: \(\) => import\('\.\.\/creative\/direccion-ui\.js'\)/, 'VISTAS.direccion');
  assert.match(ws, /case 'dna': case 'moodboard':[\s\S]*'\.\.\/creative\/dna-ui\.js', 'dnaTool'[\s\S]*'\.\.\/creative\/moodboard-ui\.js', 'moodboardTool'[\s\S]*hoja\(host, \{ me, slug, b, alive, resto \}\)/, 'monta dnaTool y moodboardTool con { me, slug, b, alive, resto }');
  assert.match(ws, /dna: 'marca', moodboard: 'marca'/, 'DNA y Moodboard piden el módulo Identidad de Marcas');
  assert.match(ws, /t\.id === 'creative-direction-lab' && \['ideas', 'formatos'\]\.includes\(resto\[0\]\)/, 'ideas y formatos salen de resto[0]');
  assert.match(ws, /if \(sv === 'ideas'\) return embed\(sede, 'postear'\);\s*if \(sv === 'formatos'\) return formatosUI\(sede, \{ me, b, alive \}\)/, 'Ideas y Formatos no pasan por el shell');
  assert.match(ws, /case 'dna': case 'moodboard': \{\s*if \(b\.personal\) return meBrand\(/, 'la marca personal sigue en meBrand');
  assert.ok(!/case 'ideas':/.test(ws), 'ya no hay montaje de la clave vieja ideas');
  for (const f of ['direccion', 'dna', 'moodboard']) assert.ok(fs.existsSync(new URL(`../public/js/creative/${f}-ui.js`, import.meta.url)), `${f}-ui.js`);
  assert.match(leerSrc('public/js/creative/direccion-ui.js'), /export const vista = \{/); assert.match(leerSrc('public/js/creative/dna-ui.js'), /export async function dnaTool\(/); assert.match(leerSrc('public/js/creative/moodboard-ui.js'), /export async function moodboardTool\(/);
});

t('Creative 3c · las rutas viejas de Ideas y Formatos siguen llegando al Creative Direction Lab', () => {
  assert.equal(wsDeRuta('#/ws/creative/akai/concepts/creative-direction-lab/ideas').resto[0], 'ideas');
  assert.equal(wsDeRuta('#/ws/creative/akai/concepts/creative-direction-lab/2026-10').resto[0], '2026-10');
  assert.equal(wsDeRuta('#/ws/creative/akai/concepts/creative-direction-lab/formatos').tool, 'creative-direction-lab');
});

t('Creative 3c · estáticas: package.json trae test:creative y app.css el bloque de Creative solo con tokens --ui-*', () => {
  const pk = JSON.parse(leerSrc('package.json')); assert.match(pk.scripts['test:creative'], /test-creative\.mjs.*test-creative-marca\.mjs/);
  const css = leerSrc('public/app.css'); assert.match(css, /FASE 3c · Creative/);
  for (const k of ['.dl{', '.dl-cons{', '.dz.dz3{', '.dz-cola{', '.dna,.mb{', '.dse{']) assert.ok(css.includes(k), k);
  const bloque = css.slice(css.indexOf('FASE 3c · Creative'), css.indexOf('FASE 3d · Production'));
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(bloque.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:root(\[[^\]]*\])?\{[^}]*\}/g, '')), 'el bloque no trae colores sueltos: solo tokens (los :root que los definen no cuentan)');
});

// ---------- Fase 3d: Production ----------
t('Production 3d: las 5 P1 quedan «lista» con su montaje; el Brief y el Shot List van al shell con ciclo; de las otras 3 solo el AI Video Lab sigue Pronto', () => {
  const montaje = { 'production-brief': 'shell', 'script-storyboard-studio': 'creacion', 'shot-list-builder': 'shell', 'post-production-workspace': 'video', 'review-approval-studio': 'review' };
  for (const [id, monta] of Object.entries(montaje)) { const h = herramientaDe(id); assert.equal(h.estado, 'lista', id); assert.equal(h.monta, monta, id); assert.equal(h.ws, 'production', id); assert.ok(h.guarda.coll && h.guarda.nota, `${id}: guarda`); }
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.monta === 'shell' && h.ws === 'production').map((h) => h.id), ['production-brief', 'shot-list-builder', 'content-repurposing']);
  assert.deepEqual(HERRAMIENTAS.filter((h) => h.ciclo && h.ws === 'production').map((h) => h.id), ['production-brief', 'shot-list-builder']);
  assert.equal(herramientaDe('ai-video-lab').estado, 'pronto'); assert.equal(herramientaDe('ai-video-lab').monta, null); for (const id of ['production-planner', 'content-repurposing']) assert.equal(herramientaDe(id).estado, 'lista', id);
  assert.equal(herramientaDe('production-brief').guarda.coll, 'deliverables'); assert.equal(herramientaDe('shot-list-builder').guarda.coll, 'deliverables');
  assert.equal(herramientaDe('script-storyboard-studio').guarda.coll, 'scripts'); assert.equal(herramientaDe('post-production-workspace').guarda.coll, 'videos'); assert.equal(herramientaDe('review-approval-studio').guarda.coll, 'videos');
});

t('Production 3d: Brief y Shot List traen las funciones de su módulo puro; cada prompt pide su bloque y sus criterios, cabe en 5 000 y no toca costos', () => {
  for (const [id, vista, bloque] of [['production-brief', 'brief', 'produccion'], ['shot-list-builder', 'shotlist', 'shotlist']]) {
    const h = herramientaDe(id);
    assert.equal(h.vista, vista, id); assert.equal(h.bloque, bloque, id);
    for (const f of ['vacio', 'prompt', 'leer', 'limpiar', 'faltas', 'aMd']) assert.equal(typeof h[f], 'function', `${id}.${f}`);
    const p = h.prompt({ cliente: { nombre: 'X', slug: 'x' }, hoy: '2026-10-27', mes: '2026-10', entradas: [] });
    assert.ok(p.includes(bloque) && p.includes('criterios') && p.length < 5000, `${id}: prompt`);
    assert.ok(!/06-ECONOMIA/.test(p.replace(/nunca leas ni cites inherent\/06-ECONOMIA/i, '')), `${id}: no pide la economía de Inherent`);
  }
  assert.equal(typeof herramientaDe('production-brief').tareasDe, 'function', 'el brief convierte las devueltas en tareas');
  assert.equal(herramientaDe('production-brief').tareasDe({ devueltas: [] }).length, 0);
  const sl = herramientaDe('shot-list-builder');
  assert.equal(typeof sl.sinCostos, 'function'); assert.equal(typeof sl.conCostos, 'function');
  const c = sl.limpiar({ escenas: [{ id: 'PR-001', id_creativo: 'C-01', costo_estimado: 250 }] });
  assert.equal(sl.sinCostos(c).escenas[0].costo_estimado, null, 'quien no ve costos no lee el costo estimado');
  assert.equal(sl.conCostos(c, sl.sinCostos(c)).escenas[0].costo_estimado, 250, 'ni lo pisa al guardar');
});

t('Production 3d: la cadena Bullseye → Offer → Campaign → Creative → Production Brief está en el registro y siguienteDe la arma con entradas', () => {
  const cadenaTools = ['customer-bullseye', 'offer-architect', 'campaign-architect', 'creative-direction-lab', 'production-brief'];
  for (let i = 0; i < cadenaTools.length - 1; i++) assert.ok(herramientaDe(cadenaTools[i]).va_a.includes(cadenaTools[i + 1]), `${cadenaTools[i]} → ${cadenaTools[i + 1]}`);
  assert.ok(cadena('customer-bullseye').includes('production-brief'));
  let doc = { id: 'd-0', tool: cadenaTools[0], estado: 'Aprobado', version: 1, aprobado: { version: 1 }, titulo: 'Diana', client_slug: 'akai', ciclo: '' };
  for (const sig of cadenaTools.slice(1)) {
    const n = E.siguienteDe(doc, sig);
    assert.ok(n, `siguienteDe → ${sig}`); assert.equal(n.entradas[0].deliverable_id, doc.id); assert.equal(n.entradas[0].tool, doc.tool);
    doc = { ...n, id: `d-${sig}`, estado: 'Aprobado', version: 1, aprobado: { version: 1 } };
  }
  assert.equal(doc.tool, 'production-brief');
  const campanas = leerSrc('public/js/campanas-ui.js');
  assert.match(campanas, /entradasDe\(S\.W\)[\s\S]*body: \{ \.\.\.base, entradas \}/, '«Enviar a Creative» lleva las entradas de la campaña (la Oferta aprobada)');
});

t('Production 3d · estáticas: workspace.js monta el brief, el shot list y el studio de revisión; el portal y el servidor montan sus rutas; Kit por cliente enlaza Post-production', () => {
  const ws = leerSrc('public/js/screens/workspace.js');
  assert.match(ws, /brief: \(\) => import\('\.\.\/production\/brief-ui\.js'\)/, 'VISTAS.brief');
  assert.match(ws, /shotlist: \(\) => import\('\.\.\/production\/shotlist-ui\.js'\)/, 'VISTAS.shotlist');
  assert.match(ws, /case 'review': \{[\s\S]*'\.\.\/production\/review-ui\.js'[\s\S]*reviewTool\(host, \{ me, slug, b, alive, resto \}\)/, 'monta reviewTool con { me, slug, b, alive, resto }');
  assert.match(ws, /review: 'video'/, 'el studio de revisión pide el módulo Video de Marcas');
  assert.match(leerSrc('api/index.js'), /portal\.rutasVideo\(\{ on, guard, body, slugOk \}\)/, 'las rutas de video del portal');
  assert.match(leerSrc('public/js/screens/work.js'), /rutaHerramienta\('production', clientSel, 'post-production-workspace'\)/, 'Kit por cliente → Post-production');
  const pk = JSON.parse(leerSrc('package.json')); assert.match(pk.scripts['test:produccion'], /test-produccion\.mjs.*test-shotlist\.mjs/);
  const css = leerSrc('public/app.css'); assert.match(css, /FASE 3d · Production/);
  for (const k of ['.pb{', '.pb-bar>span{', '.pb-bar[data-sobre="1"]>span{', '.pb-pie{', '.sl{', '.sl-gr{', '.sl-tablero{', '.vd-capas{', '.vd-v{', '.vd-coms{', '.cr-fr-ed{']) assert.ok(css.includes(k), k);
  const bloque = css.slice(css.indexOf('FASE 3d · Production'), css.indexOf('OS simple · Áreas e Inherent AI'));
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(bloque.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:root(\[[^\]]*\])?\{[^}]*\}/g, '')), 'el bloque no trae colores sueltos: solo tokens (los :root que los definen no cuentan)');
});

// ---------- Fase 3e · P2: las 13 herramientas P2 quedan «lista» ----------
t('Fase 3e P2: 13 herramientas «lista» con su montaje, su vista y su módulo puro; las 2 P3 siguen Pronto con su ficha', () => {
  const shell = [['competitor-radar', 'radar', 'radar'], ['opportunity-map', 'oportunidades', 'oportunidades'], ['pricing-packages', 'precios', 'precios'], ['organization-architect', 'organizacion', 'organizacion'], ['automation-opportunity-finder', 'automatizacion', 'automatizacion'],
    ['hook-laboratory', 'hooks', 'hooks'], ['copywriting-studio', 'copy', 'copy'], ['funnel-builder', 'funnel', 'funnel'], ['creative-performance-analyzer', 'rendimientoCreativo', 'rendimientoCreativo'], ['content-repurposing', 'repurposing', 'repurposing']];
  for (const [id, vista, bloque] of shell) {
    const h = herramientaDe(id);
    assert.equal(h.estado, 'lista', id); assert.equal(h.monta, 'shell', id); assert.equal(h.vista, vista, id); assert.equal(h.bloque, bloque, id);
    for (const f of ['vacio', 'prompt', 'leer', 'limpiar', 'faltas', 'aMd']) assert.equal(typeof h[f], 'function', `${id}.${f}`);
    const dir = { radar: 'strategy', oportunidades: 'strategy', precios: 'strategy', organizacion: 'consulting', automatizacion: 'consulting', hooks: 'marketing', copy: 'marketing', funnel: 'marketing', rendimientoCreativo: 'creative', repurposing: 'production' }[vista];
    const archivo = vista === 'rendimientoCreativo' ? 'rendimiento-creativo' : vista;
    assert.ok(fs.existsSync(new URL(`../public/js/${dir}/${archivo}-ui.js`, import.meta.url)), `${id}: falta ${dir}/${archivo}-ui.js`);
    assert.match(fs.readFileSync(new URL(`../public/js/${dir}/${archivo}-ui.js`, import.meta.url), 'utf8'), /export const vista = \{/, `${id}: exporta vista`);
  }
  for (const [id, monta, archivo, fn] of [['commercial-diagnosis', 'comercial', 'strategy/comercial-ui.js', 'comercialTool'], ['brand-consistency-checker', 'consistencia', 'creative/consistencia-ui.js', 'consistenciaTool'], ['production-planner', 'planner', 'production/planner-ui.js', 'plannerTool']]) {
    const h = herramientaDe(id); assert.equal(h.estado, 'lista', id); assert.equal(h.monta, monta, id); assert.equal(h.vista, undefined, `${id}: sin shell, sin vista`);
    assert.match(fs.readFileSync(new URL(`../public/js/${archivo}`, import.meta.url), 'utf8'), new RegExp(`export async function ${fn}\\(`), `${id}: exporta ${fn}`);
  }
  for (const id of ['growth-experiment-lab', 'ai-video-lab']) { const h = herramientaDe(id); assert.equal(h.estado, 'pronto', id); assert.equal(h.monta, null, id); assert.equal(h.prioridad, 'P3', id); }
  assert.equal(herramientaDe('pricing-packages').sinCostos.name, 'sinCostos'); assert.equal(typeof herramientaDe('pricing-packages').conCostos, 'function', 'el servidor quita y conserva los costos con ellas');
  assert.equal(herramientaDe('creative-performance-analyzer').ciclo, true, 'un entregable por marca y mes'); assert.ok(!herramientaDe('funnel-builder').ciclo && !herramientaDe('content-repurposing').ciclo);
  assert.equal(typeof herramientaDe('funnel-builder').tareasDe, 'function'); assert.equal(typeof herramientaDe('funnel-builder').alUsar, 'function');
  // Las faltas del Organization Architect leen los pasos del fundador del Mapa que el shell ya trajo.
  const mapa = { tool: 'process-mapper', contenido: { hoy: [{ id: 'p1', nombre: 'Aprueba cada cotización', etapa: 'venta', rol: 'Fundador', fundador: true }] } };
  const fs1 = herramientaDe('organization-architect').faltas({}, { ctx: { entradas: [mapa] } }).join(' ');
  assert.ok(fs1.length > 0, 'faltas con el Mapa en el contexto no revienta');
});

t('Fase 3e P2 · estáticas: workspace.js monta las vistas nuevas, las hojas sin shell y el Funnel con sus «Sitios y landings»; package.json suma las pruebas; el CSS no trae colores sueltos', () => {
  const ws = leerSrc('public/js/screens/workspace.js');
  for (const [k, f] of [['radar', 'strategy/radar'], ['oportunidades', 'strategy/oportunidades'], ['precios', 'strategy/precios'], ['organizacion', 'consulting/organizacion'], ['automatizacion', 'consulting/automatizacion'], ['hooks', 'marketing/hooks'], ['copy', 'marketing/copy'], ['funnel', 'marketing/funnel'], ['rendimientoCreativo', 'creative/rendimiento-creativo'], ['repurposing', 'production/repurposing']])
    assert.ok(ws.includes(`${k}: () => import('../${f}-ui.js')`), `VISTAS.${k}`);
  assert.match(ws, /case 'comercial': case 'consistencia': case 'planner':[\s\S]*comercialTool[\s\S]*consistenciaTool[\s\S]*plannerTool[\s\S]*hoja\(host, \{ me, slug, b, alive, resto \}\)/, 'monta las 3 hojas sin shell con { me, slug, b, alive, resto }');
  assert.match(ws, /t\.id === 'funnel-builder' && resto\[0\] === 'sitios'/, 'Sitios y landings: …/funnel-builder/sitios');
  assert.match(ws, /if \(sitios\) return techUI\(sede, \{ me, b, alive \}\)/, 'Sitios y landings monta techUI sin shell');
  assert.ok(!/case 'tech':/.test(ws), 'ya no hay montaje de la clave vieja tech');
  const pk = JSON.parse(leerSrc('package.json'));
  for (const [s, f] of [['test:consulting', 'test-consulting-p2'], ['test:strategy', 'test-strategy-p2'], ['test:strategy', 'test-strategy-radar'], ['test:marketing', 'test-marketing-p2'], ['test:produccion', 'test-produccion-p2'], ['test:creative', 'test-creative-p2']]) assert.ok(pk.scripts[s].includes(`${f}.mjs`), `${s} corre ${f}`);
  const css = leerSrc('public/app.css'); assert.match(css, /Fase 3e · P2/);
  const bloque = css.slice(css.indexOf('Fase 3e · P2'), css.indexOf('OS simple · Áreas e Inherent AI')).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const k of ['.cd{', '.om-svg{', '.rd-svg{', '.pr-mx{', '.org-raci{', '.aut-mx{', '.hk-grid', '.cp-act{', '.fnl-canvas{', '.cns-g{', '.rcr-grid{', '.pl-tira{', '.pl-linea{', '.rp-tabla{']) assert.ok(bloque.includes(k.replace(/[{]$/, '')) || css.includes(k), k);
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(bloque.replace(/:root(\[[^\]]*\])?\{[^}]*\}/g, '')), 'el bloque de la 3e P2 no trae colores sueltos: solo tokens --ui-*');
  assert.match(css, /\.rd-sd,\.pr-sd\)/, 'los «sin datos» del Radar y de Pricing usan el estilo ámbar');
  const srv = leerSrc('api/_lib/entregables.js'); assert.match(srv, /cur\.tool === 'pricing-packages'\) return \{ nivelId/, 'las faltas de Pricing reciben el nivel del servidor');
});

console.log(`\n${ok} pruebas OK`);
