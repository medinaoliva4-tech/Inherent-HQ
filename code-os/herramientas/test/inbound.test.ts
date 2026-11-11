import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularInbound, calibrarInbound, type EntradaInbound } from '../src/inbound.js';
import { desdeZernio } from '../src/zernio.js';

const base: EntradaInbound = {
  clientes_meta: 10,
  tasas: { clic: 0.01, lead: 0.2, cliente: 0.1 },
  engagement_objetivo: 0.05,
  frecuencia: 1.5,
  cpm: 4,
  cpc: 0.5,
  presupuesto: 3000,
  segmentacion: 'Dueños de restaurantes en Guatemala, 28–50',
  angulos: ['precio', 'rapidez', 'confianza'],
};

test('inbound: embudo alcance → clic → lead → cliente con ceil en cada paso', () => {
  const r = calcularInbound(base);
  assert.equal(r.clientes, 10);
  assert.equal(r.leads, 100); // 10 / 0.1
  assert.equal(r.clics, 500); // 100 / 0.2
  assert.equal(r.alcance, 50_000); // 500 / 0.01
  assert.equal(r.impresiones, 75_000); // 50 000 × 1.5
  assert.equal(r.interacciones_objetivo, 2500);
  assert.equal(r.presupuesto_estimado.por_cpm, 300); // 75 000 / 1000 × 4
  assert.equal(r.presupuesto_estimado.por_cpc, 250);
  assert.equal(r.presupuesto_estimado.estimado, 300); // el mayor (conservador)
  assert.deepEqual(r.con_presupuesto && [r.con_presupuesto.alcanza, r.con_presupuesto.faltante], [true, 0]);
  assert.equal(r.reels_prueba.length, 3);
  assert.equal(r.reels_prueba[0]!.angulo, 'precio');
  assert.equal(r.reels_prueba.reduce((s, x) => s + x.impresiones, 0) >= r.impresiones, true);
  assert.equal(r.origen.clic.fuente, 'supuesto');
  assert.equal(r.origen.frecuencia.fuente, 'supuesto');
  assert.equal(r.entradas.segmentacion, base.segmentacion);
});

test('inbound: presupuesto corto dice cuánto falta y cuántos clientes alcanza', () => {
  const r = calcularInbound({ ...base, presupuesto: 150 });
  assert.equal(r.con_presupuesto!.alcanza, false);
  assert.equal(r.con_presupuesto!.faltante, 150);
  assert.equal(r.con_presupuesto!.clientes_esperados, 5); // la mitad del presupuesto → la mitad de clientes
});

test('inbound: sin CPM/CPC no inventa presupuesto; sin ángulos propone 3 reels genéricos', () => {
  const r = calcularInbound({ clientes_meta: 2, tasas: { clic: 0.02, lead: 0.1, cliente: 0.5 }, engagement_objetivo: 0.04 });
  assert.equal(r.presupuesto_estimado.estimado, null);
  assert.equal(r.reels_prueba.length, 3);
  assert.equal(r.reels_prueba[0]!.presupuesto, null);
  assert.equal(r.impresiones, r.alcance); // frecuencia supuesta 1
});

test('inbound: entradas inválidas', () => {
  for (const e of [{ ...base, clientes_meta: 0 }, { ...base, tasas: { ...base.tasas, clic: 0 } }, { ...base, tasas: { ...base.tasas, lead: 2 } }, { ...base, cpm: -1 }, { ...base, frecuencia: 0.5 }, { ...base, engagement_objetivo: 1.5 }])
    assert.throws(() => calcularInbound(e as any), /inbound/i);
});

const diario = {
  dateRange: { from: '2026-10-01', to: '2026-10-31' },
  totals: { impressions: 120_000, reach: 80_000, likes: 3000, comments: 400, shares: 300, saves: 300, clicks: 1200, views: 90_000 },
  dailyData: [{ date: '2026-10-01', impressions: 1000 }],
  leads: 60,
  ventas: 9,
};

test('zernio: adaptador de métricas diarias (totals) con leads y ventas', () => {
  const m = desdeZernio(diario);
  assert.deepEqual(m, { desde: '2026-10-01', hasta: '2026-10-31', impresiones: 120_000, alcance: 80_000, clics: 1200, interacciones: 4000, leads: 60, ventas: 9, publicaciones: undefined, gasto: undefined });
});

test('zernio: adaptador de lista de posts (analytics por post) y rango por fechas de publicación', () => {
  const posts = { posts: [
    { publishedAt: '2026-10-03T10:00:00Z', analytics: { impressions: 1000, reach: 800, likes: 50, comments: 5, shares: 3, saves: 2, clicks: 20 } },
    { publishedAt: '2026-10-09T10:00:00Z', analytics: { impressions: 3000, reach: 2000, engagement: 140, clicks: 40 } },
  ] };
  const m = desdeZernio(posts, { gasto: 25 });
  assert.equal(m.impresiones, 4000); assert.equal(m.alcance, 2800); assert.equal(m.clics, 60);
  assert.equal(m.interacciones, 60 + 140); assert.equal(m.publicaciones, 2);
  assert.deepEqual([m.desde, m.hasta], ['2026-10-03', '2026-10-09']);
  assert.equal(m.gasto, 25); assert.equal(m.leads, undefined);
  assert.throws(() => desdeZernio({ algo: 1 }), /Zernio/);
});

test('autocalibración: las tasas reales reemplazan a las supuestas y se marca de dónde sale cada número', () => {
  const { entrada, origen, advertencias } = calibrarInbound(base, desdeZernio({ ...diario, gasto: 480 }));
  assert.equal(entrada.tasas.clic, 1200 / 80_000);
  assert.equal(entrada.tasas.lead, 60 / 1200);
  assert.equal(entrada.tasas.cliente, 9 / 60);
  assert.equal(entrada.frecuencia, 1.5);
  assert.equal(entrada.cpm, 4); // 480 / 120 000 × 1000
  assert.equal(entrada.cpc, 0.4);
  assert.deepEqual(origen.clic, { fuente: 'real', desde: '2026-10-01', hasta: '2026-10-31', numerador: 1200, denominador: 80_000 });
  assert.equal(origen.engagement.fuente, 'real');
  // el engagement objetivo NO se reemplaza (es meta), pero el real queda a la vista
  assert.equal(entrada.engagement_objetivo, 0.05);
  assert.ok(Array.isArray(advertencias));
  const r = calcularInbound(entrada, origen);
  assert.equal(r.origen.lead.fuente, 'real');
  assert.equal(r.engagement_real, 4000 / 80_000);
});

test('autocalibración: sin leads/ventas conserva las supuestas; tasa real 0 o muestra chica avisa', () => {
  const { entrada, origen, advertencias } = calibrarInbound(base, desdeZernio({ totals: { impressions: 500, reach: 400, clicks: 0, likes: 4 }, dateRange: { from: '2026-10-01', to: '2026-10-07' } }));
  assert.equal(entrada.tasas.lead, 0.2); assert.equal(origen.lead.fuente, 'supuesto');
  assert.equal(entrada.tasas.clic, 0.01); assert.equal(origen.clic.fuente, 'supuesto');
  assert.ok(advertencias.some((a) => /clic/.test(a) && /0/.test(a)));
  assert.ok(advertencias.some((a) => /muestra/i.test(a)));
});
