// Avisos: la base (fechas, ciclo, posponer, quién ve qué) y cada regla del catálogo con datos armados y el día fijo.
// Puro: no toca la base ni la red. Uso: npm run test:avisos
import assert from 'node:assert/strict';
import { hoyGT, cicloDe, aviso, ordenar, contar, personaDe, puede, correr, aplicarPospuestos, posponer, finDeMes } from '../public/js/avisos-reglas/base.js';
import { REGLAS } from '../public/js/avisos-reglas/index.js';

let n = 0;
const t = (nombre, fn) => { fn(); n++; console.log('✓', nombre); };
export const CEO = personaDe({ email: 'ceo@x.com', role: 'ceo', areas: [] });
const vacio = { tasks: [], projects: [], team: [], leads: [], quotes: [], invoices: [], accounts: [], content: [], campaigns: [], mentors: [], strategy: [], plans: [], campanas: [], ad_variants: [], judgments: [], clientes: [], yo: {}, settings: {}, guias: [], env: null, push: { listo: false } };
export const datos = (o = {}) => ({ ...vacio, ...o });

t('el día es el de Guatemala y el ciclo da la vuelta del año', () => {
  assert.equal(hoyGT(new Date('2026-10-27T01:00:00Z')), '2026-10-26', 'a las 19:00 de Guatemala sigue siendo el mismo día');
  assert.equal(hoyGT(new Date('2026-10-27T06:30:00Z')), '2026-10-27');
  assert.deepEqual(cicloDe('2026-12-09'), { d: 9, M: '2026-12', Mc: '2027-01', Ma: '2026-11', finMc: '2027-01-31' });
  assert.equal(cicloDe('2026-01-02').Ma, '2025-12');
  assert.equal(finDeMes('2028-02'), '2028-02-29');
});

t('quién ve qué: el nivel de cada área y el rol', () => {
  const p = personaDe({ email: 'A@x.com', role: 'team', areas: ['sales', 'work'], niveles: { sales: 'resumen', work: 'edita' } });
  assert.equal(p.email, 'a@x.com');
  assert.ok(puede(p, { area: 'sales' }) && !puede(p, { area: 'sales', nivel: 'completo' }) && puede(p, { area: 'work', nivel: 'edita' }));
  assert.ok(!puede(p, { area: 'estrategia' }) && !puede(p, { rol: ['ceo'] }) && puede(CEO, { area: 'estrategia', nivel: 'edita' }));
  assert.ok(puede(p, { area: ['estrategia', 'work'] }), 'con una de varias áreas basta');
});

t('correr: una regla que falla no tumba las demás, y sin ficha solo sale ese aviso del cliente', () => {
  const R = (id, grupo, f) => ({ id, grupo, urgencia: 'media', calcular: f });
  const reglas = [
    R('cli-sin-ficha', 'clientes', () => [aviso({ id: 'cli-sin-ficha', grupo: 'clientes' }, { clave: 'cli-sin-ficha:nao', cliente: 'nao', titulo: 'Sin ficha', urgencia: 'alta' })]),
    R('otro', 'clientes', () => [aviso({ id: 'otro', grupo: 'clientes' }, { clave: 'otro:nao', cliente: 'nao', titulo: 'Otro de nao' }), aviso({ id: 'otro', grupo: 'clientes' }, { clave: 'otro:akai', cliente: 'akai', titulo: 'Otro de akai' })]),
    R('rota', 'trabajo', () => { throw new Error('se cayó'); }),
  ];
  const r = correr(reglas, datos(), CEO, '2026-10-26');
  assert.deepEqual(r.items.map((x) => x.clave), ['cli-sin-ficha:nao', 'otro:akai']);
  assert.deepEqual(r.errores, ['rota: se cayó']);
});

t('orden y cuenta: lo urgente primero y lo que más espera arriba', () => {
  const A = { id: 'a', grupo: 'trabajo' };
  const xs = ordenar([aviso(A, { clave: '1', titulo: 'b', urgencia: 'media', desde: '2026-10-01' }), aviso(A, { clave: '2', titulo: 'a', urgencia: 'alta', desde: '2026-10-20' }), aviso(A, { clave: '3', titulo: 'c', urgencia: 'alta', desde: '2026-10-02' })]);
  assert.deepEqual(xs.map((x) => x.clave), ['3', '2', '1']);
  assert.deepEqual(contar(xs), { total: 3, alta: 2, media: 1, baja: 0, trabajo: 3, clientes: 0, plataforma: 0 });
});

t('posponer: vuelve si cambia la huella, lo urgente un día como máximo y lo fijo nunca', () => {
  const A = { id: 'a', grupo: 'trabajo' }, hoy = '2026-10-26';
  const media = aviso(A, { clave: 'm', titulo: 'm', urgencia: 'media', huella: 'h1' }), alta = aviso(A, { clave: 'u', titulo: 'u', urgencia: 'alta', huella: 'x' }), fijo = aviso(A, { clave: 'f', titulo: 'f', fijo: true });
  let { pos } = posponer({ viejo: { hasta: '2026-10-01' } }, { clave: 'm', hasta: '2026-11-02', huella: 'h1' }, media, hoy);
  assert.deepEqual(pos, { m: { hasta: '2026-11-02', huella: 'h1' } }, 'lo vencido se limpia al guardar');
  assert.equal(posponer(pos, { clave: 'u', hasta: '2026-11-30' }, alta, hoy).pos.u.hasta, '2026-10-27');
  assert.ok(posponer({}, { clave: 'f', hasta: '2026-10-27' }, fijo, hoy).error);
  assert.ok(posponer({}, { clave: 'm', hasta: '2026-10-26' }, media, hoy).error, 'hoy no es «después»');
  assert.deepEqual(aplicarPospuestos([media], pos, hoy).pospuestos.map((x) => x.clave), ['m']);
  assert.deepEqual(aplicarPospuestos([{ ...media, huella: 'h2' }], pos, hoy).visibles.map((x) => x.clave), ['m'], 'cambió lo que avisa: vuelve');
  assert.deepEqual(aplicarPospuestos([media], pos, '2026-11-02').visibles.map((x) => x.clave), ['m'], 'llegó el día: vuelve');
  assert.deepEqual(posponer(pos, { clave: 'm', volver: true }, media, hoy).pos, {});
});

t('el catálogo: cada regla tiene id único, grupo, urgencia y calcular', () => {
  const ids = REGLAS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos: ' + ids.filter((x, i) => ids.indexOf(x) !== i));
  for (const r of REGLAS) { assert.ok(['trabajo', 'clientes', 'plataforma'].includes(r.grupo), r.id); assert.ok(['alta', 'media', 'baja'].includes(r.urgencia), r.id); assert.equal(typeof r.calcular, 'function', r.id); }
  // Con todo vacío, ninguna regla falla ni avisa de más.
  const r = correr(REGLAS, datos({ yo: { primer_dia: { hecho_at: '2026-01-01' } } }), CEO, '2026-10-26');
  assert.deepEqual(r.errores, []); assert.deepEqual(r.items, []);
});

// ---------- Las reglas ----------
const regla = (id) => REGLAS.find((r) => r.id === id) || assert.fail('falta la regla ' + id);
const corre = (id, d, p = CEO, hoy = '2026-10-26') => correr([regla(id)], datos(d), p, hoy).items;

t('lead-sin-responder: uno por lead esperando, el más viejo arriba, fijo y con reloj', () => {
  const leads = [{ id: 'l2', name: 'Nuevo', stage: 'Nuevo', created_at: '2026-10-26T15:00:00Z' }, { id: 'l1', name: 'Viejo', stage: 'Nuevo', created_at: '2026-10-26T14:00:00Z' }, { id: 'l3', name: 'Ya', stage: 'Nuevo', created_at: '2026-10-26T14:00:00Z', first_reply_at: '2026-10-26T14:01:00Z' }, { id: 'l4', name: 'Salimos', stage: 'Nuevo', direction: 'out', created_at: '2026-10-26T14:00:00Z' }];
  const xs = corre('lead-sin-responder', { leads });
  assert.deepEqual(xs.map((x) => x.clave), ['lead-sin-responder:l1', 'lead-sin-responder:l2']);
  assert.ok(xs.every((x) => x.fijo && x.vivo?.desde && x.accion.href.startsWith('#/org/sales/crm/')));
  assert.deepEqual(corre('lead-sin-responder', { leads }, personaDe({ email: 'a@x.com', role: 'team', areas: ['work'] })), [], 'sin Ventas no sale');
});

t('tareas-vencidas: hasta 3 una por una; con más, un solo aviso', () => {
  const T = (id, due, o = {}) => ({ id, title: 'T' + id, assignee: 'ceo@x.com', status: 'Por empezar', due, ...o });
  assert.deepEqual(corre('tareas-vencidas', { tasks: [T(1, '2026-10-20'), T(2, '2026-10-26'), T(3, '2026-10-27'), T(4, '2026-10-20', { status: 'Hecha' }), T(5, '2026-10-20', { kind: 'pago' }), T(6, '2026-10-20', { assignee: 'otra@x.com' })] }).map((x) => x.titulo), ['Atrasada: «T1»', 'Para hoy: «T2»']);
  const xs = corre('tareas-vencidas', { tasks: [1, 2, 3, 4].map((i) => T(i, i < 3 ? '2026-10-20' : '2026-10-26')) });
  assert.equal(xs.length, 1); assert.equal(xs[0].titulo, 'Tienes 2 tareas para hoy y 2 atrasadas'); assert.equal(xs[0].accion.href, '#/org/work/atrasadas');
});

t('cli-sin-ficha: fijo, y el botón solo para el CEO', () => {
  const clientes = [{ slug: 'nao', nombre: 'NAO', ficha: { hay: false } }, { slug: 'akai', nombre: 'Akai', ficha: { hay: true, nivel: { id: 'growth' } } }];
  const [x] = corre('cli-sin-ficha', { clientes });
  assert.equal(x.clave, 'cli-sin-ficha:nao'); assert.ok(x.fijo && x.accion);
  assert.equal(corre('cli-sin-ficha', { clientes }, personaDe({ email: 'a@x.com', role: 'team', areas: ['estrategia'] }))[0].accion, null);
});

t('pla-primer-dia: hasta que lo termines', () => {
  assert.equal(corre('pla-primer-dia', { yo: { primer_dia: { hechos: { quien: 1, google: 1 } } } })[0].titulo, 'Tu primer día va en 2 de 6: termina de dejar todo listo');
  assert.deepEqual(corre('pla-primer-dia', { yo: { primer_dia: { hecho_at: '2026-10-01' } } }), []);
});

console.log(`\n${n} pruebas de Avisos pasaron`);
