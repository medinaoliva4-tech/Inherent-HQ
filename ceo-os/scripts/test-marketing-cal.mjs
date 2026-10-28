// Pruebas del Content Calendar (Marketing · Fase 3b): mover una pieza de día (y revertir si el servidor dice que no), las bandas de
// campaña, el badge del slot del Plan y las métricas de lo Publicado. Todo puro: sin DOM, sin red, sin base.
// Uso: node scripts/test-marketing-cal.mjs   (lo suma «test:marketing» de package.json)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fechaOk, motivoNoMover, moverPieza, moverEnLista, ponerPieza, falloAlMover, bandasDelMes, bandasPorDia, slotDe, tituloSlot, metricasDe, compacto, resumenMetricas, candado } from '../public/js/calendario-contenido.js';
import { eventosMarca } from '../public/js/calendario-vistas.js';
import { slotsAPiezas } from '../public/js/plan-mes.js';

let ok = 0; const t = async (n, f) => { await f(); ok++; console.log('✓', n); };

// ---------- Mover una pieza ----------
await t('fechaOk: solo fechas que existen', () => {
  assert.ok(fechaOk('2026-10-27')); assert.ok(fechaOk('2028-02-29'));
  assert.ok(!fechaOk('2026-02-31')); assert.ok(!fechaOk('2026-13-01')); assert.ok(!fechaOk('27/10/2026')); assert.ok(!fechaOk('')); assert.ok(!fechaOk(null));
});
await t('moverPieza: la misma pieza con la fecha nueva, sin tocar lo demás ni la original', () => {
  const p = { id: 'post-a', kind: 'post', profile: 'akai', title: 'Detrás de cocina', status: 'En proceso', date: '2026-10-05', time: '18:30', v: 7, slot: { plan: 'akai--2026-10', id: 'MK-003', semana: 1 }, caption: 'x' };
  const q = moverPieza(p, '2026-10-12');
  assert.deepEqual(q, { ...p, date: '2026-10-12' }); assert.equal(q.v, 7, 'la v que se leyó viaja con ella (el PUT da 409 si cambió)');
  assert.equal(p.date, '2026-10-05', 'no muta la original'); assert.notEqual(q, p);
  assert.equal(moverPieza(p, '2026-02-31'), null); assert.equal(moverPieza(p, ''), null); assert.equal(moverPieza(null, '2026-10-12'), null);
});
await t('moverPieza: lo que ya salió, lo archivado y lo que no es pieza no se mueve (y dice por qué)', () => {
  assert.equal(motivoNoMover({ id: 'a', kind: 'post', status: 'Idea' }), ''); assert.equal(motivoNoMover({ id: 'a', status: 'Programado' }), '', 'los estados viejos se leen como los nuevos');
  assert.match(motivoNoMover({ id: 'a', kind: 'post', status: 'Publicado', date: '2026-10-01' }), /Ya salió/);
  assert.match(motivoNoMover({ id: 'a', kind: 'post', archived: true }), /archivada/);
  assert.match(motivoNoMover({ id: 'r', kind: 'research' }), /piezas/); assert.match(motivoNoMover({}), /No encontré/);
  assert.equal(moverPieza({ id: 'a', kind: 'post', status: 'Publicado' }, '2026-10-12'), null);
});
await t('moverEnLista: se ve ya en su día nuevo; si no cambia de día o no está, null', () => {
  const lista = [{ id: 'a', kind: 'post', date: '2026-10-05', v: 1 }, { id: 'b', kind: 'post', date: '2026-10-06', v: 4 }];
  const m = moverEnLista(lista, 'b', '2026-10-20');
  assert.deepEqual(m.lista.map((x) => x.date), ['2026-10-05', '2026-10-20']); assert.equal(m.nueva.date, '2026-10-20'); assert.equal(m.antes.date, '2026-10-06');
  assert.equal(lista[1].date, '2026-10-06', 'la lista de antes queda intacta');
  assert.equal(moverEnLista(lista, 'b', '2026-10-06'), null, 'mismo día: nada que guardar');
  assert.equal(moverEnLista(lista, 'zzz', '2026-10-20'), null); assert.equal(moverEnLista(lista, 'a', 'mañana'), null);
});

// El servidor de mentira cumple la regla de verdad (api/index.js · reglasPieza + el 409 de db.update): el calendario solo arma, manda y revierte.
function servidor({ conBrief = [], abiertos = [], v = 1 } = {}) {
  return async (pieza, previa) => {
    const mes = String(pieza.date || '').slice(0, 7);
    if (mes !== String(previa.date || '').slice(0, 7) && !conBrief.includes(mes) && !abiertos.includes(mes)) throw Object.assign(new Error(`Sin brief del ciclo de ${mes}: guárdala como idea sin fecha, pide el brief a ④ Creatividad o que el CEO abra el mes.`), { status: 423 });
    if (pieza.v !== v) throw Object.assign(new Error('Alguien más cambió esto. Recarga para ver la última versión.'), { status: 409 });
    return { ...pieza, v: v + 1 };
  };
}
// Lo mismo que hace moverA de screens/content.js, con las piezas puras.
async function mover(lista, id, fecha, put) {
  const m = moverEnLista(lista, id, fecha); if (!m) return { lista, msg: '', mal: false, recargar: false };
  let cur = m.lista, msg = 'ok', mal = false, recargar = false;
  try { cur = ponerPieza(cur, await put(m.nueva, m.antes)); } catch (e) { const f = falloAlMover(e); msg = f.mensaje; mal = true; recargar = f.recargar; cur = ponerPieza(cur, m.antes); }
  return { lista: cur, msg, mal, recargar };
}
await t('mover a un mes sin brief: el servidor dice 423, la pieza vuelve a su día y se muestra SU mensaje', async () => {
  const lista = [{ id: 'a', kind: 'post', date: '2026-10-28', v: 1 }];
  const r = await mover(lista, 'a', '2026-11-03', servidor({ conBrief: ['2026-10'] }));
  assert.deepEqual(r.lista, lista); assert.ok(r.mal); assert.match(r.msg, /^Sin brief del ciclo de 2026-11/); assert.equal(r.recargar, false);
});
await t('mover a un mes que el CEO abrió, o dentro del mismo mes: entra y trae la v nueva', async () => {
  const lista = [{ id: 'a', kind: 'post', date: '2026-10-28', v: 1 }];
  const abierto = await mover(lista, 'a', '2026-11-03', servidor({ abiertos: ['2026-11'] }));
  assert.equal(abierto.lista[0].date, '2026-11-03'); assert.equal(abierto.lista[0].v, 2); assert.ok(!abierto.mal);
  const mismo = await mover(lista, 'a', '2026-10-02', servidor());
  assert.equal(mismo.lista[0].date, '2026-10-02', 'dentro del mismo mes el candado no aplica');
});
await t('409 (alguien la cambió): revierte, muestra el mensaje del servidor y pide volver a leer las piezas', async () => {
  const lista = [{ id: 'a', kind: 'post', date: '2026-10-05', v: 1 }];
  const r = await mover(lista, 'a', '2026-10-12', servidor({ v: 3 }));
  assert.deepEqual(r.lista, lista); assert.ok(r.mal); assert.equal(r.recargar, true); assert.match(r.msg, /Alguien más cambió esto/);
  assert.equal(falloAlMover(new Error()).mensaje, 'No se pudo mover la pieza'); assert.equal(falloAlMover(null).recargar, false);
});
await t('contrato con el servidor: el PUT de /api/db/content aplica reglasPieza (423) y la v (409); el mismo mes no se bloquea', () => {
  const src = readFileSync(new URL('../api/index.js', import.meta.url), 'utf8');
  assert.match(src, /on\('PUT', 'db\/:coll\/:id'[\s\S]*?reglasPieza\(b, await db\.get\('content', req\.params\.id\)\)[\s\S]*?status\(423\)/);
  assert.match(src, /String\(cur\?\.date \|\| ''\)\.slice\(0, 7\) === mes\) return null/, 'solo cuando la fecha cambia de mes');
  assert.match(src, /db\.update\(req\.params\.coll, req\.params\.id, b, Number\(b\.v\)[\s\S]*?status\(409\)/);
  // y el candado de la pantalla sigue siendo el de siempre
  assert.equal(candado('2026-11', ['2026-10']).cerrado, true); assert.equal(candado('2026-11', ['2026-10'], [{ mes: '2026-11' }]).cerrado, false);
});

// ---------- Bandas de campaña ----------
const camp = (o) => ({ id: `x--${o.nombre}`, estado: 'En curso', tipo: 'campana', ...o });
await t('bandasDelMes: franja entre ancla y hasta, recortada al mes; sin hasta, solo el día del ancla', () => {
  const xs = [
    camp({ nombre: 'Promo', tipo: 'promocion', ancla: '2026-10-12', hasta: '2026-10-18' }),
    camp({ nombre: 'Evento', tipo: 'evento', ancla: '2026-10-24' }),
    camp({ nombre: 'Temporada', tipo: 'temporada', ancla: '2026-10-28', hasta: '2026-11-04' }),
  ];
  const oct = bandasDelMes(xs, '2026-10');
  assert.deepEqual(oct.map((b) => [b.nombre, b.desde, b.fin, b.dias]), [['Promo', '2026-10-12', '2026-10-18', 7], ['Evento', '2026-10-24', '2026-10-24', 1], ['Temporada', '2026-10-28', '2026-10-31', 4]]);
  assert.equal(oct[2].sigue, true); assert.equal(oct[2].hasta, '2026-11-04', 'guarda el hasta real'); assert.equal(oct[0].sigue, false);
  const nov = bandasDelMes(xs, '2026-11');
  assert.deepEqual(nov.map((b) => [b.nombre, b.desde, b.fin, b.desdeAntes]), [['Temporada', '2026-11-01', '2026-11-04', true]]);
  assert.deepEqual(bandasDelMes(xs, '2026-12'), []);
});
await t('bandasDelMes: sin ancla, archivadas, el primer aviso de una campaña que cae el mes que viene y fechas malas no salen ni tumban nada', () => {
  const xs = [
    camp({ nombre: 'Sin ancla' }),
    camp({ nombre: 'Vieja', ancla: '2026-10-10', estado: 'Archivada' }),
    camp({ nombre: 'Cerrada', ancla: '2026-10-03', estado: 'Cerrada' }),
    camp({ nombre: 'Aviso', tipo: 'evento', ancla: '2026-11-10' }), // su primer aviso (21 días antes) cae en octubre, pero la franja no
    camp({ nombre: 'Fecha mala', tipo: 'promocion', ancla: '2026-02-31', hasta: 'x' }),
    camp({ nombre: 'Hasta malo', tipo: 'promocion', ancla: '2026-10-20', hasta: 'basura' }),
    null, 'texto',
  ];
  assert.deepEqual(bandasDelMes(xs, '2026-10').map((b) => b.nombre), ['Cerrada', 'Hasta malo']);
  assert.equal(bandasDelMes(xs, '2026-10')[1].hasta, '2026-10-20', 'un hasta malo se lee como sin hasta');
  assert.deepEqual(bandasDelMes(xs, '2026-1'), []); assert.deepEqual(bandasDelMes(null, '2026-10'), []);
});
await t('bandasDelMes: dos franjas que se cruzan van en carriles distintos; la que no se cruza reutiliza el carril', () => {
  const xs = [camp({ nombre: 'A', ancla: '2026-10-01', hasta: '2026-10-10' }), camp({ nombre: 'B', ancla: '2026-10-05', hasta: '2026-10-08' }), camp({ nombre: 'C', ancla: '2026-10-12', hasta: '2026-10-14' })];
  assert.deepEqual(bandasDelMes(xs, '2026-10').map((b) => [b.nombre, b.carril]), [['A', 0], ['B', 1], ['C', 0]]);
});
await t('bandasPorDia: posición de cada día, dónde va el nombre (primer día y cada lunes) y el orden por carril', () => {
  const xs = [camp({ nombre: 'Larga', tipo: 'promocion', ancla: '2026-10-08', hasta: '2026-10-14' }), camp({ nombre: 'Corta', ancla: '2026-10-09', hasta: '2026-10-10' })];
  const d = bandasPorDia(bandasDelMes(xs, '2026-10'));
  assert.deepEqual(Object.keys(d), ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14']);
  assert.deepEqual(d['2026-10-08'].map((b) => [b.nombre, b.pos, b.rotulo]), [['Larga', 'ini', true]]);
  assert.deepEqual(d['2026-10-09'].map((b) => [b.nombre, b.carril, b.pos]), [['Larga', 0, 'mid'], ['Corta', 1, 'ini']]);
  assert.equal(d['2026-10-09'][0].rotulo, false); assert.equal(d['2026-10-12'][0].rotulo, true, '2026-10-12 es lunes: el nombre se repite en cada renglón');
  assert.equal(d['2026-10-14'][0].pos, 'fin');
  assert.ok(bandasPorDia(bandasDelMes(xs, '2026-10'), { rotuloSiempre: true })['2026-10-10'].every((b) => b.rotulo), 'la vista de semana pone el nombre en cada día');
  const solo = bandasPorDia(bandasDelMes([camp({ nombre: 'Un día', tipo: 'evento', ancla: '2026-10-24' })], '2026-10'));
  assert.equal(solo['2026-10-24'][0].pos, 'solo');
  const cont = bandasPorDia(bandasDelMes([camp({ nombre: 'Cruza', tipo: 'promocion', ancla: '2026-10-29', hasta: '2026-11-02' })], '2026-10'));
  assert.equal(cont['2026-10-31'][0].sigueDespues, true); assert.equal(cont['2026-10-29'][0].sigueAntes, false);
});

// ---------- Badge del slot ----------
await t('slotDe: la pieza que viene de un slot del Plan lleva su id; sin slot, nada', () => {
  assert.equal(slotDe({ id: 'a' }), null); assert.equal(slotDe({ slot: 'MK-001' }), null); assert.equal(slotDe({ slot: { plan: 'akai--2026-10' } }), null, 'sin id no hay chip'); assert.equal(slotDe(null), null);
  const s = slotDe({ date: '2026-10-08', slot: { plan: 'akai--2026-10', id: 'MK-003', semana: 2, canal: 'Instagram', funcion: 'Hero' } });
  assert.deepEqual(s, { id: 'MK-003', plan: 'akai--2026-10', mes: '2026-10', semana: 2, canal: 'Instagram', funcion: 'Hero', fuera: false });
  assert.match(tituloSlot(s), /^Slot MK-003 del Plan del mes · semana 2 · Instagram · Hero$/); assert.equal(tituloSlot(null), '');
});
await t('slotDe: marca cuando la pieza ya no está en la semana (ni el mes) que el plan le dio; semana 5 = días 29 al 31', () => {
  const base = { plan: 'akai--2026-10', id: 'MK-001', semana: 1 };
  assert.equal(slotDe({ date: '2026-10-07', slot: base }).fuera, false); assert.equal(slotDe({ date: '2026-10-08', slot: base }).fuera, true);
  assert.equal(slotDe({ date: '2026-11-02', slot: base }).fuera, true); assert.equal(slotDe({ slot: base }).fuera, false, 'sin fecha no se juzga');
  assert.equal(slotDe({ date: '2026-10-31', slot: { ...base, semana: 5 } }).fuera, false); assert.equal(slotDe({ date: '2026-10-28', slot: { ...base, semana: 5 } }).fuera, true);
  assert.match(tituloSlot(slotDe({ date: '2026-10-28', slot: { ...base, semana: 5 } })), /ya no está en su semana del plan/);
});
await t('slotDe: coincide con cómo plan-mes.js pone cada slot en el calendario (primer día de su semana)', () => {
  const plan = { campana: { nombre: 'Apertura' }, slots: [{ id: 'MK-001', semana: 1, canal: 'Instagram', formato: 'Reel' }, { id: 'MK-002', semana: 3, canal: 'TikTok', formato: 'TikTok' }, { id: 'MK-003', semana: 5, canal: 'Instagram', formato: 'Carrusel' }] };
  for (const { data } of slotsAPiezas(plan, 'akai', '2026-10')) assert.equal(slotDe(data).fuera, false, `${data.slot.id} cae en su semana`);
});

// ---------- Métricas de lo Publicado ----------
await t('metricasDe: solo si está Publicada y solo lo que la pieza ya trae; sin datos, nada (nunca 0 por un dato que falta)', () => {
  assert.deepEqual(metricasDe({ status: 'Publicado' }), []); assert.deepEqual(metricasDe({ status: 'Listo', metricas: { alcance: 900 } }), []); assert.deepEqual(metricasDe(null), []);
  assert.deepEqual(metricasDe({ status: 'Publicado', metricas: { alcance: null, vistas: '', likes: undefined, comentarios: 'n/a', guardados: -3 } }), []);
  const m = metricasDe({ status: 'Publicado', metricas: { alcance: 1234, vistas: 56000, likes: 0, comentarios: '12', compartidos: 7 } });
  assert.deepEqual(m.map((x) => [x.k, x.v, x.t]), [['alcance', 1234, '1.2K'], ['vistas', 56000, '56K'], ['likes', 0, '0'], ['comentarios', 12, '12'], ['compartidos', 7, '7']], 'un 0 de verdad sí sale; guardados no vino y no sale');
});
await t('metricasDe: lee metricas, metrics o analytics de la pieza, o sueltas; en inglés o en español', () => {
  assert.deepEqual(metricasDe({ status: 'Publicado', metrics: { reach: 10, views: 20, saves: 3 } }).map((x) => [x.k, x.v]), [['alcance', 10], ['vistas', 20], ['guardados', 3]]);
  assert.deepEqual(metricasDe({ status: 'Publicado', analytics: { likes: 5, shares: 2 } }).map((x) => [x.k, x.v]), [['likes', 5], ['compartidos', 2]]);
  assert.deepEqual(metricasDe({ status: 'Publicado', reach: 800, comments: 4 }).map((x) => [x.k, x.v]), [['alcance', 800], ['comentarios', 4]]);
  assert.deepEqual(metricasDe({ status: 'Publicado', analytics: [{ reach: 1 }] }), [], 'una lista no es un objeto de métricas');
  assert.equal(metricasDe({ status: 'Publicado', metricas: { alcance: 10 }, reach: 99 })[0].v, 10, 'manda lo de metricas');
});
await t('compacto y resumenMetricas', () => {
  assert.deepEqual([999, 1000, 1500, 12400, 2500000, 1000000].map(compacto), ['999', '1K', '1.5K', '12.4K', '2.5M', '1M']);
  const m = metricasDe({ status: 'Publicado', metricas: { alcance: 1234, likes: 340, vistas: 9000 } });
  assert.equal(resumenMetricas(m, 1), '1.2K alcance'); assert.equal(resumenMetricas(m, 2), '1.2K alcance · 9K vistas'); assert.equal(resumenMetricas([]), '');
});

// ---------- El calendario de la marca ----------
await t('eventosMarca: el slot y las métricas van en el texto de ayuda de la pieza; lo demás sigue igual', () => {
  const ev = eventosMarca({ slug: 'x', from: '2026-10-01', to: '2026-10-31', hoy: '2026-10-22', posts: [
    { id: 'a', kind: 'post', date: '2026-10-05', status: 'Idea', format: 'Reel', slot: { plan: 'x--2026-10', id: 'MK-002', semana: 1 } },
    { id: 'b', kind: 'post', date: '2026-10-12', status: 'En proceso', slot: { plan: 'x--2026-10', id: 'MK-004', semana: 1 } },
    { id: 'c', kind: 'post', date: '2026-10-08', status: 'Publicado', red: 'Instagram', format: 'Reel', metricas: { alcance: 2100, likes: 88 } },
    { id: 'd', kind: 'post', date: '2026-10-09', status: 'Publicado', red: 'TikTok' },
    { id: 'e', kind: 'post', date: '2026-10-10', status: 'Listo', time: '18:00', red: 'Instagram', metricas: { alcance: 5 } }] });
  const k = (id) => ev.find((e) => e.k === `p-${id}`);
  assert.equal(k('a').sub, 'Reel · Idea · Slot MK-002'); assert.equal(k('b').sub, 'En proceso · Slot MK-004 (fuera de su semana)');
  assert.equal(k('c').sub, 'Instagram · Reel · ya salió · 2.1K alcance · 88 me gusta'); assert.equal(k('d').sub, 'TikTok · ya salió', 'Publicada sin métricas: nada');
  assert.equal(k('e').sub, 'Instagram', 'las métricas solo salen de lo Publicado');
  assert.deepEqual([k('a'), k('b')].map((e) => e.tipo), ['planificacion', 'planificacion']); assert.deepEqual([k('c'), k('d'), k('e')].map((e) => e.tipo), ['programado', 'programado', 'programado']);
  assert.deepEqual(k('a').go, { act: 'pedit', id: 'a' });
});
console.log(`\n${ok} pruebas del Content Calendar pasaron.`);
