// Avisos · clientes-estrategia: cada regla del grupo con datos armados y el día fijo (la ficha, el ciclo, la estrategia y
// Consulting de cada cliente). Puro: no toca la base ni la red. Uso: node scripts/test-avisos-estrategia.mjs
import assert from 'node:assert/strict';
import { personaDe, correr } from '../public/js/avisos-reglas/base.js';
import { CLIENTES_ESTRATEGIA } from '../public/js/avisos-reglas/clientes-estrategia.js';

let n = 0;
const t = (nombre, fn) => { fn(); n++; console.log('✓', nombre); };
const vacio = { tasks: [], projects: [], team: [], leads: [], quotes: [], invoices: [], accounts: [], content: [], campaigns: [], mentors: [], strategy: [], plans: [], campanas: [], ad_variants: [], judgments: [], clientes: [], yo: {}, settings: {}, guias: [], env: null, push: { listo: false }, tieneGoogle: true };
const datos = (o = {}) => ({ ...vacio, ...o });

// Las personas: el CEO, el COO por defecto (sin Estrategia ni Marcas), quien edita Estrategia y quien solo la ve.
const CEO = personaDe({ email: 'ceo@x.com', role: 'ceo' });
const COO = personaDe({ email: 'coo@x.com', role: 'coo', areas: ['home', 'control', 'clients', 'sales', 'operations', 'work', 'resultados', 'library', 'team'] });
const EST = personaDe({ email: 'est@x.com', role: 'team', areas: ['estrategia', 'work'] });
const VE = personaDe({ email: 've@x.com', role: 'team', areas: ['estrategia', 'work'], niveles: { estrategia: 'completo' } });
const TEAM = personaDe({ email: 'team@x.com', role: 'team', areas: ['home', 'work', 'content', 'library', 'team'] });

// Un cliente como lo arma avisos-datos.js. nivel: 'foundation' | 'growth' | 'partnership' | 'medida' | null.
const NOMBRES = { foundation: 'Brand Foundation', growth: 'Brand Growth', partnership: 'Growth Partnership', medida: 'A la medida' };
const C = (slug, nivel, o = {}) => ({ slug, nombre: o.nombre || slug.toUpperCase(), presentes: o.presentes || [],
  ficha: { hay: true, nombre: o.nombre || slug.toUpperCase(), plan: '', nivel: nivel ? { id: nivel, nombre: NOMBRES[nivel] } : null, linea: '', incluye: o.incluye ?? [{ k: 'Áreas', v: 'Marca y contenido' }], fuera: '', pipeline: o.pipeline ?? [], redes: '' } });
const P = (...pasos) => pasos.map((paso) => ({ paso, que: '…' }));
const pres = (...xs) => xs.map((x) => (Array.isArray(x) ? { id: x[0], mes: x[1], variante: '', costos: x[0] === 'numeros' } : { id: x, mes: '', variante: '', costos: x === 'numeros' }));
// La estrategia viva: { viva, aprobado } con el id '<slug>--viva'.
const V = (slug, viva = {}, aprobado = null) => ({ id: `${slug}--viva`, slug, bloque: 'viva', viva, aprobado });
const VIVA_LISTA = { contexto: { conclusion: 'c' }, analisis: { mbt: 'm', unfair: 'u', goget: 'g' }, meta: { objetivo: 1 }, inversa: { ticket: 1, cierre: 0.2, conversion: 0.1, visita: 0.1 }, metodologia: { oferta: 'o' } };

const regla = (id) => CLIENTES_ESTRATEGIA.find((r) => r.id === id) || assert.fail('falta la regla ' + id);
const corre = (id, d, p = CEO, hoy = '2026-10-26') => { const r = correr([regla(id)], datos(d), p, hoy); assert.deepEqual(r.errores, [], id); return r.items; };
const urg = (id, d, hoy, p = CEO) => corre(id, d, p, hoy).map((x) => x.urgencia);

t('el grupo: ids únicos, grupo clientes y, con datos vacíos, ninguna regla falla ni avisa', () => {
  const ids = CLIENTES_ESTRATEGIA.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['cli-sin-ficha', 'cli-ficha-incompleta', 'ciclo-sin-armar', 'reunion-ciclo-por-agendar', 'est-sin-aprobar', 'est-brief-comunicacion', 'est-trabado-capacidad', 'cons-encargos-abiertos', 'est-trabado-fuera-de-nivel', 'est-ofertas-a-empujar', 'est-revision-20', 'est-carpeta-incompleta', 'cli-onboarding-pendiente', 'cons-encargo-fuera-de-alcance', 'cons-gp-sin-especialista', 'cons-money-sin-numeros', 'cons-replanteo-trimestral']) regla(id);
  for (const r of CLIENTES_ESTRATEGIA) { assert.equal(r.grupo, 'clientes', r.id); assert.ok(['alta', 'media', 'baja'].includes(r.urgencia), r.id); }
  for (const hoy of ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-09', '2026-10-13', '2026-10-17', '2026-10-26']) for (const p of [CEO, COO, EST, TEAM]) {
    const r = correr(CLIENTES_ESTRATEGIA, datos(), p, hoy); assert.deepEqual(r.errores, []); assert.deepEqual(r.items, []);
  }
  // Un cliente sin nada más que su nombre tampoco rompe nada.
  const r = correr(CLIENTES_ESTRATEGIA, datos({ clientes: [{ slug: 'x', nombre: 'X' }], strategy: [{ id: 'x--viva' }], projects: [{ id: 'p', kind: 'Ciclo mensual', cycle: '2026-10', meetings: [{}] }], accounts: [{ id: 'acc-x', onboarding: {} }], tasks: [{ id: 't', origen: 'estrategia', area: 'consulting', cliente: 'x' }] }), CEO, '2026-10-02');
  assert.deepEqual(r.errores, []);
});

t('sin ficha: de ese cliente solo sale cli-sin-ficha', () => {
  const d = datos({ clientes: [{ slug: 'nao', nombre: 'NAO', ficha: { hay: false, nivel: null, incluye: [], pipeline: [] }, presentes: [] }, C('akai', 'growth')], tasks: [{ id: 't1', origen: 'estrategia', area: 'consulting', cliente: 'nao', status: 'Por empezar', title: 'BMC' }] });
  const xs = correr(CLIENTES_ESTRATEGIA, d, CEO, '2026-10-05').items;
  assert.deepEqual(xs.filter((x) => x.cliente === 'nao').map((x) => x.id), ['cli-sin-ficha']);
  assert.ok(xs.some((x) => x.cliente === 'akai'), 'los demás clientes siguen');
});

t('cli-ficha-incompleta: sin nivel o sin pipeline es alta; sin «Qué incluye», media; el botón solo para el CEO', () => {
  const clientes = [C('cer', null), C('akai', 'medida', { incluye: [], pipeline: P('① Strategy', '③ Marketing') }), C('nao', 'medida', { incluye: [], pipeline: [] }), C('ok', 'medida', { pipeline: P('③ Marketing') }), C('gr', 'growth', { incluye: [] })];
  const xs = corre('cli-ficha-incompleta', { clientes });
  assert.deepEqual(xs.map((x) => [x.cliente, x.urgencia, x.titulo]), [
    ['cer', 'alta', 'La ficha de CER no dice qué nivel contrató'],
    ['nao', 'alta', 'La ficha de NAO no trae su pipeline ni dice qué incluye'],
    ['akai', 'media', 'La ficha de AKAI no dice qué incluye'],
  ]);
  assert.ok(xs.every((x) => x.accion?.href === `#/estrategia/${x.cliente}`));
  const ys = corre('cli-ficha-incompleta', { clientes }, VE);
  assert.equal(ys.length, 3); assert.ok(ys.every((x) => !x.accion && /La edita el CEO/.test(x.detalle)), 'quien ve Estrategia lo ve sin botón');
  assert.deepEqual(corre('cli-ficha-incompleta', { clientes }, COO), [], 'el COO por defecto no ve Estrategia');
});

t('ciclo-sin-armar: del 1 al 20, alta del 1 al 3 y media después; con su proyecto, Foundation o Inherent no sale', () => {
  const clientes = [C('nao', 'growth'), C('akai', 'medida', { pipeline: P('③ Marketing') }), C('cer', 'medida', { pipeline: P('②B Branding') }), C('fun', 'foundation'), C('inherent', 'growth'), C('gp', 'partnership')];
  const projects = [{ id: 'p1', client_slug: 'gp', kind: 'Ciclo mensual', cycle: '2026-10' }, { id: 'p2', client_slug: 'nao', kind: 'Ciclo mensual', cycle: '2026-09' }];
  const xs = corre('ciclo-sin-armar', { clientes, projects }, CEO, '2026-10-02');
  assert.deepEqual(xs.map((x) => x.cliente).sort(), ['akai', 'nao']);
  const nao = xs.find((x) => x.cliente === 'nao');
  assert.equal(nao.titulo, 'El ciclo de octubre de NAO no está armado: no hay tareas ni reuniones');
  assert.deepEqual(nao.accion.api, { method: 'POST', ruta: 'flow/activate', body: { slug: 'nao', plan: true, start: '2026-10-01', label: 'NAO' } });
  for (const [hoy, u] of [['2026-10-02', 'alta'], ['2026-10-05', 'media'], ['2026-10-09', 'media'], ['2026-10-13', 'media'], ['2026-10-17', 'media']]) assert.deepEqual(urg('ciclo-sin-armar', { clientes: [C('nao', 'growth')] }, hoy), [u], hoy);
  assert.deepEqual(corre('ciclo-sin-armar', { clientes: [C('nao', 'growth')] }, CEO, '2026-10-26'), [], 'del 21 en adelante no');
  assert.equal(corre('ciclo-sin-armar', { clientes: [C('nao', 'growth')] }, COO, '2026-10-05').length, 1, 'el COO edita Proyectos');
  assert.deepEqual(corre('ciclo-sin-armar', { clientes: [C('nao', 'growth')] }, EST, '2026-10-05'), [], 'quien no edita Proyectos no lo arma');
});

t('reunion-ciclo-por-agendar: la del día 1 al CEO; la del 20 al COO en Brand Growth y al CEO en Partnership', () => {
  const team = [{ email: 'ceo@x.com', roles: ['ceo'] }, { email: 'coo@x.com', roles: ['coo'] }];
  const M = (name, date, o = {}) => ({ name, date, who: ['ceo', 'coo', 'cliente'], topics: [], status: 'todo', ...o });
  const projects = [
    { id: 'pn', client_slug: 'nao', kind: 'Ciclo mensual', cycle: '2026-10', meetings: [M('Arranque del ciclo', '2026-10-01', { status: 'hecha' }), M('Plan y calendario', '2026-10-03', { who: ['ceo', 'content'] }), M('Presentación al cliente', '2026-10-20')] },
    { id: 'pn2', client_slug: 'nao', kind: 'Ciclo mensual', cycle: '2026-11', meetings: [M('Arranque del ciclo', '2026-11-01'), M('Presentación al cliente', '2026-11-20')] },
    { id: 'pg', client_slug: 'gp', kind: 'Ciclo mensual', cycle: '2026-10', meetings: [M('Presentación al cliente', '2026-10-20'), M('Arranque del ciclo', '2026-10-01', { status: 'agendada', link: 'https://cal' })] },
  ];
  const d = { team, projects, clientes: [C('nao', 'growth'), C('gp', 'partnership')] };
  const ceo = corre('reunion-ciclo-por-agendar', d);
  assert.deepEqual(ceo.map((x) => x.titulo).sort(), ['La presentación del 20 de GP no está agendada', 'La reunión del día 1 con NAO no está agendada']);
  assert.ok(ceo.every((x) => x.urgencia === 'alta' && x.accion?.abre === 'agendar' && x.accion.proyecto && Number.isInteger(x.accion.i)), 'con Proyectos en edita se agenda desde el aviso');
  assert.match(ceo.find((x) => x.cliente === 'gp').detalle, /^Era el 20\/10/);
  assert.equal(ceo.find((x) => x.cliente === 'nao').detalle, 'Es el 01/11.');
  const coo = corre('reunion-ciclo-por-agendar', d, COO);
  assert.deepEqual(coo.map((x) => x.titulo), ['La presentación del 20 de NAO no está agendada']);
  // Sin COO en el equipo, la presentación de Brand Growth la lleva el CEO; sin Google, el detalle lo dice.
  const solo = corre('reunion-ciclo-por-agendar', { ...d, team: [team[0]], tieneGoogle: false });
  assert.equal(solo.length, 3); assert.ok(solo.every((x) => /Conecta tu Google/.test(x.detalle)));
  assert.deepEqual(corre('reunion-ciclo-por-agendar', d, CEO, '2026-10-20').map((x) => x.titulo).sort(), ['La presentación del 20 de GP no está agendada'], 'el 1/11 está a más de 7 días');
  assert.deepEqual(corre('reunion-ciclo-por-agendar', d, EST), [], 'quien no lleva la reunión no la ve');
});

t('est-sin-aprobar: el paso que falta, la urgencia por tramo del ciclo y la variante del CEO', () => {
  const clientes = [C('nao', 'growth'), C('fun', 'foundation')];
  const strategy = [V('nao', { contexto: { conclusion: 'c' } }), V('fun', {})];
  const xs = corre('est-sin-aprobar', { clientes, strategy }, CEO, '2026-10-05');
  assert.deepEqual(xs.map((x) => [x.cliente, x.urgencia, x.titulo, x.accion.href]), [
    ['nao', 'alta', 'La estrategia de NAO va en 1 de 5: falta el análisis. Sin ella no hay plan de noviembre', '#/estrategia/nao'],
    ['fun', 'media', 'La estrategia de FUN va en 0 de 5: falta el contexto', '#/estrategia/fun/diagnostico'],
  ]);
  for (const [hoy, u] of [['2026-10-02', 'media'], ['2026-10-05', 'alta'], ['2026-10-09', 'alta'], ['2026-10-13', 'alta'], ['2026-10-17', 'alta'], ['2026-10-26', 'alta']]) assert.deepEqual(urg('est-sin-aprobar', { clientes: [clientes[0]], strategy }, hoy), [u], hoy);
  // Con roadmap le toca a est-por-aprobar; aprobada, a nadie: nunca salen juntos.
  assert.deepEqual(corre('est-sin-aprobar', { clientes, strategy: [V('nao', { ...VIVA_LISTA, roadmap: { filas: [{ area: 'Strategy', celdas: ['', '', '', ''] }] } }), V('fun', {}, { por: 'ceo@x.com', en: '2026-10-01T00:00:00Z' })] }), []);
  // Ya está en su carpeta: al CEO le pide pasarla al OS; quien edita Estrategia ve el paso que falta.
  const repo = [C('nao', 'growth', { presentes: pres('estrategia') })];
  const [c] = corre('est-sin-aprobar', { clientes: repo, strategy });
  assert.equal(c.titulo, 'La estrategia de NAO ya está en su carpeta, pero el OS no la tiene aprobada'); assert.equal(c.accion.href, '#/estrategia/nao/roadmap');
  const [e] = corre('est-sin-aprobar', { clientes: repo, strategy }, EST);
  assert.match(e.titulo, /va en 1 de 5/); assert.match(e.detalle, /La aprueba el CEO/);
  assert.deepEqual(corre('est-sin-aprobar', { clientes, strategy }, VE), [], 'quien solo ve Estrategia no');
  assert.deepEqual(corre('est-sin-aprobar', { clientes: [C('x', null)] }), [], 'sin nivel no (lo dice cli-ficha-incompleta)');
});

t('est-brief-comunicacion: del 1 al 20 si corre ③ Marketing; media el día 1 y alta desde el 2; vale el mes del ciclo o el del contenido', () => {
  const clientes = [C('nao', 'growth'), C('fun', 'foundation'), C('cer', 'medida', { pipeline: P('②B Branding') }), C('akai', 'medida', { pipeline: P('③ Marketing') })];
  const xs = corre('est-brief-comunicacion', { clientes }, CEO, '2026-10-05');
  assert.deepEqual(xs.map((x) => x.cliente).sort(), ['akai', 'nao']);
  const nao = xs.find((x) => x.cliente === 'nao');
  assert.equal(nao.titulo, 'A NAO le falta el brief de comunicación de noviembre: ③ Marketing no puede planear');
  assert.deepEqual(nao.accion.chat, { modo: 'estrategia', slug: 'nao', borrador: 'Arma el brief de comunicación de noviembre' });
  for (const [hoy, u] of [['2026-10-01', 'media'], ['2026-10-02', 'alta'], ['2026-10-09', 'alta'], ['2026-10-13', 'alta'], ['2026-10-17', 'alta']]) assert.deepEqual(urg('est-brief-comunicacion', { clientes: [clientes[0]] }, hoy), [u], hoy);
  assert.deepEqual(corre('est-brief-comunicacion', { clientes: [clientes[0]] }, CEO, '2026-10-26'), [], 'del 21 en adelante no');
  for (const mes of ['2026-10', '2026-11']) assert.deepEqual(corre('est-brief-comunicacion', { clientes: [C('nao', 'growth', { presentes: pres(['brief-comunicacion', mes]) })] }, CEO, '2026-10-05'), [], mes);
  assert.equal(corre('est-brief-comunicacion', { clientes: [C('nao', 'growth', { presentes: pres(['brief-comunicacion', '2026-09']) })] }, CEO, '2026-10-05').length, 1, 'el del mes pasado no cuenta');
  assert.deepEqual(corre('est-brief-comunicacion', { clientes }, COO, '2026-10-05'), []);
});

t('est-trabado-capacidad: alta si corre pauta; fuera de Partnership se escala al CEO', () => {
  const clientes = [C('nao', 'growth'), C('gp', 'partnership'), C('ok', 'growth')];
  const strategy = [V('nao', { analisis: { trabado: 'capacidad', porque: 'No dan abasto los fines de semana' } }), V('gp', { analisis: { trabado: 'capacidad' } }), V('ok', { analisis: { trabado: 'leads' } })];
  const accounts = [{ id: 'acc-nao', ads: { budget: 320 } }];
  const xs = corre('est-trabado-capacidad', { clientes, strategy, accounts });
  assert.deepEqual(xs.map((x) => [x.cliente, x.urgencia]), [['nao', 'alta'], ['gp', 'media']]);
  assert.equal(xs[0].titulo, 'NAO está trabado en capacidad: todavía no le generamos más demanda');
  assert.match(xs[0].detalle, /pauta está corriendo.*no entra en Brand Growth: lo decides tú.*«No dan abasto/);
  assert.doesNotMatch(xs[0].detalle, /320/, 'nunca el monto');
  assert.doesNotMatch(xs[1].detalle, /lo decide/);
  assert.match(corre('est-trabado-capacidad', { clientes, strategy, accounts }, EST)[0].detalle, /lo decide el CEO/);
  assert.equal(corre('est-trabado-capacidad', { clientes, strategy }).find((x) => x.cliente === 'nao').urgencia, 'media', 'sin pauta, media');
});

t('cons-encargos-abiertos: uno por cliente, alta si alguno venció; sin los tuyos, salvo los que tú mandaste', () => {
  const T = (id, o = {}) => ({ id, title: 'Encargo ' + id, origen: 'estrategia', area: 'consulting', cliente: 'gp', status: 'Por empezar', assignee: 'ceo@x.com', _meta: { created_by: 'ceo@x.com', created_at: `2026-10-0${id.length}` }, ...o });
  const clientes = [C('gp', 'partnership'), C('nao', 'growth'), C('inherent', 'growth')];
  const tasks = [T('a', { due: '2026-10-20' }), T('bb'), T('ccc', { status: 'Hecha' }), T('dddd', { area: 'marketing' }), T('e', { cliente: 'nao' }), T('f', { cliente: 'inherent' }), T('g', { assignee: 'est@x.com' })];
  const [x, ...resto] = corre('cons-encargos-abiertos', { clientes, tasks });
  assert.equal(resto.length, 0, 'ni el de un cliente fuera de alcance ni el de Inherent');
  assert.equal(x.titulo, 'GP tiene 3 encargos de Estrategia sin hacer en Consulting (1 vencido)'); assert.equal(x.urgencia, 'alta');
  assert.equal(x.accion.href, '#/consulting/gp');
  assert.equal(corre('cons-encargos-abiertos', { clientes, tasks: [T('bb')] })[0].urgencia, 'media');
  // A quien se lo asignaron le sale en sus tareas: aquí no.
  assert.equal(corre('cons-encargos-abiertos', { clientes, tasks }, EST)[0].titulo, 'GP tiene 2 encargos de Estrategia sin hacer en Consulting (1 vencido)');
  assert.deepEqual(corre('cons-encargos-abiertos', { clientes, tasks }, personaDe({ email: 'z@x.com', role: 'team', areas: ['estrategia'] })), [], 'sin ver tareas no');
  assert.deepEqual(corre('cons-encargos-abiertos', { clientes, tasks }, TEAM), []);
});

t('est-trabado-fuera-de-nivel: en Brand Growth, la oferta o la escalera; lo decide el CEO', () => {
  const clientes = [C('nao', 'growth'), C('akai', 'growth'), C('mo', 'growth'), C('gp', 'partnership'), C('ok', 'growth')];
  const strategy = [V('nao', { analisis: { trabado: 'oferta' } }), V('akai', { metodologia: { modelo: { upsell: 'Combo premium' } } }), { id: 'mo--modelo', slug: 'mo', bloque: 'modelo', borrador: { texto: 'Escalera…' } }, V('gp', { analisis: { trabado: 'oferta' } }), V('ok', { analisis: { trabado: 'leads' } })];
  const xs = corre('est-trabado-fuera-de-nivel', { clientes, strategy });
  const de = (s) => xs.find((x) => x.cliente === s);
  assert.deepEqual(xs.map((x) => [x.cliente, x.accion.href]).sort(), [['akai', '#/estrategia/akai/modelo'], ['mo', '#/estrategia/mo/modelo'], ['nao', '#/estrategia/nao/oferta']]);
  assert.equal(de('nao').titulo, 'NAO está trabado en la oferta y Brand Growth no la toca: lo decides tú');
  assert.match(de('nao').detalle, /^No cambia qué se vende/);
  assert.equal(de('akai').titulo, 'La estrategia de AKAI trae upsells o continuidad y Brand Growth no los incluye: lo decides tú');
  const ys = corre('est-trabado-fuera-de-nivel', { clientes, strategy }, EST);
  assert.ok(ys.every((x) => !x.accion && /lo decide el CEO$/.test(x.titulo)));
});

t('est-ofertas-a-empujar: con la estrategia aprobada, lo que le toca a ② Growth según su nivel', () => {
  const ok = { por: 'ceo@x.com', en: '2026-10-03T00:00:00Z' };
  const clientes = [C('nao', 'growth'), C('gp', 'partnership', { presentes: pres('ofertas-a-empujar') }), C('akai', 'medida', { pipeline: P('② Growth', '③ Marketing') }), C('cer', 'medida', { pipeline: P('②B Branding') }), C('fun', 'foundation'), C('sin', 'growth')];
  const strategy = ['nao', 'gp', 'akai', 'cer', 'fun'].map((s) => V(s, {}, ok)).concat(V('sin', {}));
  const xs = corre('est-ofertas-a-empujar', { clientes, strategy });
  assert.deepEqual(xs.map((x) => x.cliente).sort(), ['akai', 'gp', 'nao']);
  assert.equal(xs.find((x) => x.cliente === 'nao').titulo, 'NAO no tiene «ofertas a empujar»: la pauta no sabe qué pautar');
  assert.equal(xs.find((x) => x.cliente === 'gp').titulo, 'A GP le falta su motor de crecimiento: la pauta no sabe qué pautar');
  assert.ok(xs.every((x) => x.accion.href.endsWith('/oferta')));
  assert.deepEqual(corre('est-ofertas-a-empujar', { clientes: [C('nao', 'growth', { presentes: pres('ofertas-a-empujar') }), C('akai', 'medida', { pipeline: P('② Growth'), presentes: pres('motor-de-crecimiento') })], strategy }), []);
});

t('est-revision-20: del 21 a fin de mes la de este mes (media); del 1 al 3 la del mes pasado (alta)', () => {
  const clientes = [C('nao', 'growth'), C('fun', 'foundation'), C('akai', 'medida', { pipeline: P('③ Marketing') })];
  const xs = corre('est-revision-20', { clientes }, CEO, '2026-10-26');
  assert.deepEqual(xs.map((x) => [x.cliente, x.urgencia]).sort(), [['akai', 'media'], ['nao', 'media']]);
  const nao = xs.find((x) => x.cliente === 'nao');
  assert.equal(nao.titulo, 'Falta la revisión del 20 de octubre de NAO');
  assert.deepEqual(nao.accion.chat, { modo: 'estrategia', slug: 'nao', borrador: 'Haz la revisión del 20 de octubre: qué funcionó y qué no' });
  const [y] = corre('est-revision-20', { clientes: [clientes[0]] }, CEO, '2026-10-02');
  assert.equal(y.titulo, 'Falta la revisión del 20 de septiembre de NAO'); assert.equal(y.urgencia, 'alta');
  for (const hoy of ['2026-10-05', '2026-10-09', '2026-10-13', '2026-10-17']) assert.deepEqual(corre('est-revision-20', { clientes }, CEO, hoy), [], hoy);
  assert.deepEqual(corre('est-revision-20', { clientes: [C('nao', 'growth', { presentes: pres(['revision-20', '2026-10']) })] }), []);
  assert.deepEqual(corre('est-revision-20', { clientes }, VE), []);
});

t('est-carpeta-incompleta: aprobada y le faltan archivos; el botón solo para el CEO', () => {
  const ok = { por: 'ceo@x.com', en: '2026-10-03T00:00:00Z' };
  const clientes = [C('nao', 'growth', { presentes: pres('comprension', 'estrategia') }), C('akai', 'growth', { presentes: pres('comprension', 'estrategia', 'nucleo', 'posicionamiento') }), C('sin', 'growth')];
  const strategy = [V('nao', {}, ok), V('akai', {}, ok), V('sin', {})];
  const [x, ...resto] = corre('est-carpeta-incompleta', { clientes, strategy });
  assert.equal(resto.length, 0);
  assert.equal(x.titulo, 'NAO tiene la estrategia aprobada, pero a su carpeta le faltan el núcleo y el posicionamiento');
  assert.equal(x.accion.href, '#/estrategia/nao/diagnostico');
  assert.equal(corre('est-carpeta-incompleta', { clientes: [C('nao', 'growth', { presentes: pres('comprension', 'nucleo', 'posicionamiento') })], strategy })[0].titulo, 'NAO tiene la estrategia aprobada, pero a su carpeta le falta la estrategia');
  const [e] = corre('est-carpeta-incompleta', { clientes, strategy }, EST);
  assert.equal(e.accion, null); assert.match(e.detalle, /los escribe el CEO/);
});

t('cli-onboarding-pendiente: a los 2 días sin terminar, al CEO y al COO', () => {
  const I = (k, done) => Array.from({ length: k }, (_, i) => ({ t: 'Paso ' + i, done: i < done }));
  const accounts = [{ id: 'acc-nao', name: 'NAO', onboarding: { items: I(5, 2), at: '2026-10-20T10:00:00Z' } }, { id: 'acc-akai', name: 'Akai', onboarding: { items: I(3, 0), at: '2026-10-25T10:00:00Z' } }, { id: 'acc-cer', name: 'Cerantola', onboarding: { items: I(2, 2), at: '2026-10-01', done_at: '2026-10-05' } }, { id: 'acc-x', name: 'X' }];
  const [x, ...resto] = corre('cli-onboarding-pendiente', { accounts, clientes: [C('nao', 'growth', { nombre: 'NAO' })] });
  assert.equal(resto.length, 0);
  assert.equal(x.titulo, 'NAO no ha terminado su onboarding: 2 de 5 listos'); assert.equal(x.accion.href, '#/portal/nao'); assert.equal(x.cliente, 'nao');
  assert.match(x.detalle, /Desde el 20\/10\. Se lo pide la Secretaria/);
  assert.equal(corre('cli-onboarding-pendiente', { accounts }, CEO, '2026-10-27').length, 2, 'Akai cumple 2 días el 27');
  assert.equal(corre('cli-onboarding-pendiente', { accounts }, COO).length, 1);
  assert.deepEqual(corre('cli-onboarding-pendiente', { accounts }, EST), []);
});

t('cons-encargo-fuera-de-alcance: uno por encargo de un cliente fuera de alcance, al CEO y a quien lo tiene', () => {
  const T = (id, cliente, o = {}) => ({ id, title: 'Crear el BMC', origen: 'estrategia', area: 'consulting', cliente, status: 'Por empezar', assignee: 'est@x.com', ...o });
  const clientes = [C('nao', 'growth'), C('akai', 'medida', { incluye: [{ k: 'Áreas', v: 'Contenido' }], pipeline: P('③ Marketing') }), C('cer', 'medida', { incluye: [{ k: 'Finanzas', v: 'Margen por línea' }] }), C('gp', 'partnership'), C('inherent', 'growth')];
  const tasks = [T('t1', 'nao'), T('t2', 'akai', { assignee: 'otra@x.com' }), T('t3', 'cer'), T('t4', 'gp'), T('t5', 'inherent'), T('t6', 'nao', { status: 'Hecha' })];
  const xs = corre('cons-encargo-fuera-de-alcance', { clientes, tasks });
  assert.deepEqual(xs.map((x) => x.clave).sort(), ['cons-encargo-fuera-de-alcance:t1', 'cons-encargo-fuera-de-alcance:t2']);
  const nao = xs.find((x) => x.cliente === 'nao');
  assert.equal(nao.titulo, 'El encargo «Crear el BMC» de NAO está fuera de su alcance');
  assert.match(nao.detalle, /^Operations OS y Money OS son de Growth Partnership\. Con Brand Growth.*Lo decides tú: se cotiza aparte o se cierra\.$/);
  assert.match(xs.find((x) => x.cliente === 'akai').detalle, /^A la medida: lo que incluye su ficha es el techo\. Su ficha no nombra/);
  const est = corre('cons-encargo-fuera-de-alcance', { clientes, tasks }, EST);
  assert.deepEqual(est.map((x) => x.clave), ['cons-encargo-fuera-de-alcance:t1'], 'a quien lo tiene asignado, el suyo');
  assert.match(est[0].detalle, /Lo decide el CEO/); assert.equal(est[0].accion.href, '#/consulting/nao');
  const sinEst = personaDe({ email: 'est@x.com', role: 'team', areas: ['work'] });
  assert.deepEqual(corre('cons-encargo-fuera-de-alcance', { clientes, tasks }, sinEst)[0].accion, { label: 'Abrir el encargo', abre: 'tarea', id: 't1' });
  assert.deepEqual(corre('cons-encargo-fuera-de-alcance', { clientes, tasks }, VE), [], 'a quien no lo tiene, no');
  // Nunca a la vez que cons-encargos-abiertos del mismo cliente.
  const ab = corre('cons-encargos-abiertos', { clientes, tasks });
  assert.deepEqual(ab.map((x) => x.cliente).sort(), ['cer', 'gp']);
});

t('cons-gp-sin-especialista: Growth Partnership sin especialista; el botón, quien edita Clientes', () => {
  const clientes = [C('gp', 'partnership'), C('gp2', 'partnership'), C('nao', 'growth'), C('aud', 'medida', { incluye: [{ k: 'Auditoría', v: 'Con el especialista de la industria' }], pipeline: P('① Strategy') })];
  const accounts = [{ id: 'acc-gp', mentors: [] }, { id: 'acc-gp2', mentors: [{ id: 'm1', cadence: 'trimestral' }] }, { id: 'acc-nao', mentors: [] }, { id: 'acc-aud' }];
  const xs = corre('cons-gp-sin-especialista', { clientes, accounts });
  assert.deepEqual(xs.map((x) => x.cliente).sort(), ['aud', 'gp']);
  const gp = xs.find((x) => x.cliente === 'gp');
  assert.equal(gp.titulo, 'GP es Growth Partnership y no tiene especialista para su auditoría');
  assert.equal(gp.accion.href, '#/clients/gp');
  assert.equal(xs.find((x) => x.cliente === 'aud').titulo, 'La ficha de AUD trae auditoría y no tiene especialista');
  assert.equal(corre('cons-gp-sin-especialista', { clientes, accounts }, COO).length, 2, 'el COO también, y edita Clientes');
  const cooVe = personaDe({ email: 'coo@x.com', role: 'coo', areas: ['clients', 'work'], niveles: { clients: 'completo' } });
  const [y] = corre('cons-gp-sin-especialista', { clientes, accounts }, cooVe);
  assert.equal(y.accion, null); assert.match(y.detalle, /Lo agrega quien edita Clientes/);
  assert.deepEqual(corre('cons-gp-sin-especialista', { clientes, accounts }, EST), []);
  assert.doesNotMatch(xs.map((x) => x.detalle).join(' '), /\$|180/, 'nunca precios');
});

t('cons-money-sin-numeros: solo al CEO, con Money OS en su alcance y sin numeros.md', () => {
  const FIN = [{ k: 'Finanzas vinculadas al crecimiento', v: 'Margen por línea' }];
  const clientes = [C('gp', 'partnership', { incluye: FIN }), C('gp2', 'partnership'), C('gp3', 'partnership', { incluye: FIN, presentes: pres('numeros') }), C('med', 'medida', { incluye: [{ k: 'Money OS', v: 'Costos' }], pipeline: P('① Strategy') }), C('nao', 'growth')];
  const xs = corre('cons-money-sin-numeros', { clientes });
  assert.deepEqual(xs.map((x) => x.cliente).sort(), ['gp', 'med'], 'Partnership sin finanzas en su ficha no (va «según acuerdo»)');
  const gp = xs.find((x) => x.cliente === 'gp');
  assert.equal(gp.titulo, 'Money OS de GP sin números: el margen por línea todavía es teoría');
  assert.deepEqual(gp.accion.chat, { modo: 'consulting', slug: 'gp', borrador: '¿Qué línea deja margen y cuál lo desangra?' });
  assert.deepEqual(corre('cons-money-sin-numeros', { clientes }, COO), []);
  assert.deepEqual(corre('cons-money-sin-numeros', { clientes }, EST), []);
});

t('cons-replanteo-trimestral: Growth Partnership aprobada hace más de 90 días, solo al CEO', () => {
  const clientes = [C('gp', 'partnership'), C('gp2', 'partnership'), C('nao', 'growth')];
  const strategy = [V('gp', {}, { por: 'ceo@x.com', en: '2026-07-01T15:00:00Z' }), V('gp2', {}, { por: 'ceo@x.com', en: '2026-09-01T15:00:00Z' }), V('nao', {}, { por: 'ceo@x.com', en: '2026-01-01T15:00:00Z' })];
  const [x, ...resto] = corre('cons-replanteo-trimestral', { clientes, strategy });
  assert.equal(resto.length, 0);
  assert.equal(x.titulo, 'Toca el replanteo trimestral de la estrategia de GP'); assert.equal(x.urgencia, 'baja'); assert.match(x.detalle, /hace 117 días/);
  assert.deepEqual(corre('cons-replanteo-trimestral', { clientes, strategy }, COO), []);
  assert.deepEqual(corre('cons-replanteo-trimestral', { clientes, strategy }, CEO, '2026-09-29'), [], 'a los 90 días todavía no');
});

t('claves únicas y estables, y la huella cambia cuando cambia lo que avisa', () => {
  const d = { clientes: [C('nao', 'growth')], strategy: [V('nao', { contexto: { conclusion: 'c' } })] };
  const a = corre('est-sin-aprobar', d, CEO, '2026-10-02')[0], b = corre('est-sin-aprobar', d, CEO, '2026-10-05')[0];
  assert.equal(a.clave, b.clave); assert.notEqual(a.huella, b.huella, 'se volvió urgente: un pospuesto vuelve');
  const c = corre('est-sin-aprobar', { ...d, strategy: [V('nao', { contexto: { conclusion: 'c' }, analisis: { mbt: 'm', unfair: 'u', goget: 'g' } })] }, CEO, '2026-10-05')[0];
  assert.equal(c.clave, b.clave); assert.notEqual(c.huella, b.huella, 'avanzó un paso');
  const todo = correr(CLIENTES_ESTRATEGIA, datos({ clientes: [C('nao', 'growth'), C('gp', 'partnership')], strategy: [V('nao', { analisis: { trabado: 'capacidad' } })] }), CEO, '2026-10-02').items;
  assert.equal(new Set(todo.map((x) => x.clave)).size, todo.length);
});

// ---------- Lo que encontró la revisión ----------
t('los encargos con la fecha como llega de la base (Date): del más viejo al más nuevo y «desde» en ISO', () => {
  const T = (id, at, o = {}) => ({ id, title: 'Encargo ' + id, origen: 'estrategia', area: 'consulting', cliente: 'gp', status: 'Por empezar', assignee: 'ceo@x.com', _meta: { created_by: 'ceo@x.com', created_at: at }, ...o });
  const tasks = [T('nuevo', new Date('2026-10-20T10:00:00Z')), T('viejo', new Date('2026-09-01T10:00:00Z'))];
  const [x] = corre('cons-encargos-abiertos', { clientes: [C('gp', 'partnership')], tasks });
  assert.equal(x.desde, '2026-09-01T10:00:00.000Z', 'el que más espera');
  assert.equal(x.detalle, '«Encargo viejo» · «Encargo nuevo»');
  const [y] = corre('cons-encargo-fuera-de-alcance', { clientes: [C('nao', 'growth')], tasks: [T('t1', new Date('2026-10-20T10:00:00Z'), { cliente: 'nao' })] });
  assert.equal(y.desde, '2026-10-20T10:00:00.000Z');
  assert.equal(corre('cons-encargos-abiertos', { clientes: [C('gp', 'partnership')], tasks: [T('x', new Date('no es fecha'))] })[0].desde, '', 'una fecha rota no rompe nada');
});

t('datos raros de la base: una reunión, un paso del pipeline o un ítem del onboarding roto no tumban la regla', () => {
  const team = [null, { email: 'ceo@x.com', roles: ['ceo'] }];
  const projects = [
    { id: 'pn', client_slug: 'nao', kind: 'Ciclo mensual', cycle: '2026-10', meetings: [null, { name: 'Arranque del ciclo', date: '2026-10-01' }, { name: 'Arranque del ciclo', date: '2026-10-01', who: ['ceo', 'cliente'], status: 'todo' }] },
    { id: 'px', client_slug: 'nao', kind: 'Ciclo mensual', cycle: '2026-11', meetings: 'x' },
  ];
  assert.deepEqual(corre('reunion-ciclo-por-agendar', { team, projects, clientes: [C('nao', 'growth')] }).map((x) => x.clave), ['reunion-ciclo-por-agendar:pn:2'], 'la clave guarda el índice real de la reunión');
  const c = C('akai', 'medida', { pipeline: [{ paso: '③ Marketing', que: '…' }, { que: 'sin paso' }, null] });
  assert.equal(corre('est-brief-comunicacion', { clientes: [c] }, CEO, '2026-10-05').length, 1, 'el resto del pipeline se lee');
  assert.equal(corre('est-revision-20', { clientes: [c] }).length, 1);
  assert.deepEqual(corre('cli-ficha-incompleta', { clientes: [c] }), []);
  const accounts = [{ id: 'acc-nao', name: 'NAO', onboarding: { items: [null, { t: 'a', done: true }, { t: 'b' }], at: '2026-10-01' } }, { id: 'acc-x', onboarding: { items: 'x', at: '2026-10-01' } }];
  assert.deepEqual(corre('cli-onboarding-pendiente', { accounts }).map((x) => x.titulo), ['NAO no ha terminado su onboarding: 1 de 3 listos']);
});

t('Inherent no se cotiza a sí misma: sin «fuera de nivel» y la capacidad sin el «no entra en su nivel»', () => {
  const clientes = [C('inherent', 'growth', { nombre: 'Inherent' }), C('nao', 'growth')];
  const strategy = [V('inherent', { analisis: { trabado: 'oferta' }, metodologia: { modelo: { upsell: 'Mentoría' } } }), V('nao', { analisis: { trabado: 'oferta' } })];
  assert.deepEqual(corre('est-trabado-fuera-de-nivel', { clientes, strategy }).map((x) => x.cliente), ['nao']);
  const cap = corre('est-trabado-capacidad', { clientes, strategy: [V('inherent', { analisis: { trabado: 'capacidad' } })] });
  assert.equal(cap.length, 1); assert.equal(cap[0].detalle, 'Primero se arregla la capacidad.');
  assert.match(corre('est-trabado-capacidad', { clientes, strategy: [V('nao', { analisis: { trabado: 'capacidad' } })] })[0].detalle, /no entra en Brand Growth: lo decides tú/, 'un cliente de Brand Growth sí se escala');
});

t('ciclo-sin-armar con alcance «asignados»: el proyecto del mes que no ve también cuenta (datos.ciclos)', () => {
  const OPS = personaDe({ email: 'ops@x.com', role: 'team', areas: ['operations', 'work'] });
  const clientes = [C('nao', 'growth'), C('akai', 'growth')];
  // Sus proyectos (ya filtrados por su alcance) no traen el ciclo de NAO, pero existe.
  const ciclos = [{ client_slug: 'nao', cycle: '2026-10' }, { client_slug: 'akai', cycle: '2026-09' }];
  assert.deepEqual(corre('ciclo-sin-armar', { clientes, projects: [], ciclos }, OPS, '2026-10-05').map((x) => x.cliente), ['akai']);
  assert.deepEqual(corre('ciclo-sin-armar', { clientes, projects: [] }, OPS, '2026-10-05').map((x) => x.cliente).sort(), ['akai', 'nao'], 'sin el dato, como antes');
});

t('el cambio de año y los bordes del ciclo: diciembre mira a enero y enero pide la revisión de diciembre', () => {
  const clientes = [C('nao', 'growth')], strategy = [V('nao', {})];
  assert.match(corre('est-sin-aprobar', { clientes, strategy }, CEO, '2026-12-05')[0].titulo, /Sin ella no hay plan de enero$/);
  assert.equal(corre('est-brief-comunicacion', { clientes }, CEO, '2026-12-05')[0].titulo, 'A NAO le falta el brief de comunicación de enero: ③ Marketing no puede planear');
  assert.deepEqual(corre('est-brief-comunicacion', { clientes: [C('nao', 'growth', { presentes: pres(['brief-comunicacion', '2027-01']) })] }, CEO, '2026-12-05'), []);
  const [r] = corre('est-revision-20', { clientes }, CEO, '2027-01-02');
  assert.equal(r.titulo, 'Falta la revisión del 20 de diciembre de NAO'); assert.equal(r.urgencia, 'alta'); assert.equal(r.desde, '2026-12-20');
  assert.equal(corre('ciclo-sin-armar', { clientes, projects: [{ id: 'p', client_slug: 'nao', kind: 'Ciclo mensual', cycle: '2026-12' }] }, CEO, '2027-01-02')[0].titulo, 'El ciclo de enero de NAO no está armado: no hay tareas ni reuniones');
  const projects = [{ id: 'pe', client_slug: 'nao', kind: 'Ciclo mensual', cycle: '2027-01', meetings: [{ name: 'Arranque del ciclo', date: '2027-01-01', who: ['ceo', 'coo', 'cliente'], status: 'todo' }] }];
  assert.equal(corre('reunion-ciclo-por-agendar', { team: [], projects, clientes }, CEO, '2026-12-26')[0].detalle, 'Es el 01/01.', 'el ciclo de enero ya cuenta en diciembre');
  // El 3 todavía es la ventana de Strategy; el 20 cierra el ciclo y el 21 ya es la revisión.
  assert.deepEqual(urg('est-sin-aprobar', { clientes, strategy }, '2026-12-03'), ['media']);
  assert.deepEqual(urg('est-sin-aprobar', { clientes, strategy }, '2026-12-04'), ['alta']);
  assert.deepEqual(urg('ciclo-sin-armar', { clientes }, '2026-12-03'), ['alta']);
  assert.deepEqual(urg('ciclo-sin-armar', { clientes }, '2026-12-20'), ['media']);
  assert.deepEqual(corre('ciclo-sin-armar', { clientes }, CEO, '2026-12-21'), []);
  assert.deepEqual(urg('est-brief-comunicacion', { clientes }, '2026-12-20'), ['alta']);
  assert.deepEqual(corre('est-revision-20', { clientes }, CEO, '2026-12-20'), []);
  assert.deepEqual(urg('est-revision-20', { clientes }, '2026-12-21'), ['media']);
  assert.deepEqual(urg('est-revision-20', { clientes }, '2026-12-31'), ['media']);
});

console.log(`\n${n} pruebas de Avisos · clientes-estrategia pasaron`);
