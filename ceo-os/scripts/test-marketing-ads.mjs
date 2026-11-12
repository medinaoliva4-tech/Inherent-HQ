// Pruebas de Ads Intelligence (Marketing › Campaigns): lo puro (public/js/marketing/ads.js: las cuentas de la pauta, la tabla, las
// recomendaciones con su evidencia, el pedido a la IA y su lectura), el servidor de la tabla (api/_lib/ads.js, con Windsor simulado y una base
// en memoria) y lo que dicen los archivos de la vista, de la competencia y de Mis tareas.
// node scripts/test-marketing-ads.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as A from '../public/js/marketing/ads.js';

let ok = 0; const t = (n, f) => { try { const r = f(); if (r && typeof r.then === 'function') throw new Error('usa tt() para lo asíncrono'); ok++; console.log('✓', n); } catch (e) { console.log('✗', n); throw e; } };
const tt = async (n, f) => { await f(); ok++; console.log('✓', n); };
const leerArchivo = (rel) => fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
const F = '```';

// ---------- Datos de ejemplo ----------
const r2 = (x) => Math.round(x * 100) / 100;
const fila = (nivel, nombre, f, extra = {}) => ({ nivel, plat: 'meta', nombre, campana: nivel === 'campana' ? nombre : 'Camp', conjunto: '', ...f, ...A.metricas(f), h1: null, h2: null, ...extra });
const CAMPANAS = [
  fila('campana', 'Reservas', { gasto: 1200, imp: 90000, clics: 1800, conv: 60, ingresos: 6000 }),   // CPA 20
  fila('campana', 'Promo', { gasto: 1000, imp: 50000, clics: 900, conv: 12, ingresos: 600 }),        // CPA 83.33
  fila('campana', 'Alcance', { gasto: 300, imp: 80000, clics: 150, conv: 0, ingresos: 0 }),         // 150 clics, 0 conv
];
const ANUNCIO_CANSADO = fila('anuncio', 'Reel del sol', { gasto: 900, imp: 35000, clics: 580, conv: 5, ingresos: 400 },
  { h1: { gasto: 400, imp: 20000, clics: 400, conv: 4 }, h2: { gasto: 500, imp: 15000, clics: 180, conv: 1 } }); // CTR 2 → 1.2, CPM 20 → 33.33
const SERIE = Array.from({ length: 30 }, (_, i) => ({ date: A.sumaDias('2026-09-28', i), spend: 100 })); // 28 sep → 27 oct: 27 días de octubre
const datosDe = (extra = {}) => ({
  dias: 30, hoy: '2026-10-27', presupuesto: 3000, ok: { vigente: true, month: '2026-10', budget: 3000 },
  total: { spend: 2500, imp: 220000, clicks: 2850, conv: 72, rev: 6600, tiene: { conv: true, rev: true } }, series: SERIE,
  tabla: { campanas: CAMPANAS, conjuntos: [], anuncios: [ANUNCIO_CANSADO], tiene: { conv: true, ingresos: true } }, ...extra,
});
const tipos = (rs) => rs.map((r) => r.tipo);

// ---------- Las cuentas ----------
t('metricas: CTR, CPC, CPA y ROAS de una fila; un insumo null da null, nunca 0', () => {
  assert.deepEqual(A.metricas({ spend: 100, impressions: 1000, clicks: 20, conversions: 4, revenue: 300 }), { ctr: 2, cpc: 5, cpa: 25, roas: 3 });
  assert.deepEqual(A.metricas({ gasto: 100, imp: 1000, clics: 20, conv: 4, ingresos: 300 }), { ctr: 2, cpc: 5, cpa: 25, roas: 3 }, 'también con los nombres de la tabla');
  assert.equal(A.metricas({ spend: 100, impressions: null, clicks: 20 }).ctr, null, 'sin impresiones no hay CTR');
  assert.equal(A.metricas({ spend: 100, impressions: 1000, clicks: null }).ctr, null, 'sin clics no hay CTR');
  assert.equal(A.metricas({ spend: 100, impressions: 1000, clicks: null }).cpc, null);
  assert.equal(A.metricas({ spend: null, clicks: 20 }).cpc, null, 'sin gasto no hay CPC');
  assert.equal(A.metricas({ spend: 100, conversions: null }).cpa, null, 'sin conversiones (Windsor no las mandó) no hay CPA');
  assert.equal(A.metricas({ spend: 100, conversions: 0 }).cpa, null, 'con 0 conversiones no se puede dividir');
  assert.equal(A.metricas({ spend: 100, revenue: null }).roas, null, 'sin ingresos no hay ROAS');
  assert.equal(A.metricas({ spend: 0, revenue: 50 }).roas, null);
  assert.equal(A.metricas({ spend: 100, revenue: 0 }).roas, 0, 'un ingreso de 0 es un dato: ROAS 0');
  assert.deepEqual(A.metricas(null), { ctr: null, cpc: null, cpa: null, roas: null });
  assert.deepEqual(A.metricas({ spend: 'abc', impressions: '12x', clicks: NaN, conversions: -4 }), { ctr: null, cpc: null, cpa: null, roas: null }, 'lo que no es un número limpio no cuenta');
  assert.equal(A.metricas({ spend: '100', impressions: '1000', clicks: '20' }).ctr, 2, 'un texto numérico limpio sí');
  assert.deepEqual(Object.keys(A.metricas({})), ['ctr', 'cpc', 'cpa', 'roas']);
});
t('metricasDe: sin montos usa el CTR y el ROAS que el servidor calculó antes; kpisDe igual', () => {
  assert.deepEqual(A.metricasDe({ ctr: 1.5, roas: 2.4, imp: 100, clics: 2 }), { ctr: 2, cpc: null, cpa: null, roas: 2.4 }, 'lo calculado con los insumos manda; lo que falta sale del guardado');
  assert.equal(A.metricasDe({ ctr: 1.5 }).ctr, 1.5);
  const k = A.kpisDe({ imp: 1000, clicks: 20, conv: 4, roas: 2.1, tiene: { conv: true, rev: true } });
  assert.deepEqual([k.ctr, k.cpa, k.roas, k.gasto], [2, null, 2.1, null], 'sin gasto no hay CPA; el ROAS guardado sigue valiendo');
  assert.equal(A.kpisDe({ spend: 100, imp: 1000, clicks: 20, conv: 0, tiene: { conv: false } }).conv, null, 'Windsor no mandó conversiones: null, no 0');
  assert.equal(A.kpisDe({ spend: 100, imp: 1000, clicks: 20, conv: 5, cpa: 20, tiene: { conv: true } }).cpa, 20);
});
t('gastoDelMes: suma el mes de hoy y dice si la ventana lo cubre', () => {
  assert.deepEqual(A.gastoDelMes(SERIE, { hoy: '2026-10-27', dias: 30 }), { mes: '2026-10', gasto: 2700, cubre: true, dia: 27, diasMes: 31 });
  assert.equal(A.gastoDelMes(SERIE, { hoy: '2026-10-27', dias: 7 }).cubre, false, '7 días no llegan al día 1');
  assert.equal(A.gastoDelMes([], { hoy: '2026-10-27', dias: 30 }), null, 'sin serie: ⚠️ SIN DATOS');
  assert.equal(A.gastoDelMes(null, { hoy: '2026-10-27', dias: 30 }), null);
  assert.equal(A.gastoDelMes(SERIE, { hoy: 'ayer', dias: 30 }), null);
  assert.equal(A.gastoDelMes([{ date: '2026-10-02', spend: null }], { hoy: '2026-10-27', dias: 30 }), null, 'un gasto que falta no es 0');
});

t('gastoPorPeriodo: por día hasta 31 puntos; con más, por semana (desde el lunes); un día sin dato no se inventa', () => {
  const d = A.gastoPorPeriodo(SERIE); assert.equal(d.paso, 'dia'); assert.equal(d.puntos.length, 30); assert.deepEqual(d.puntos[0], { fecha: '2026-09-28', gasto: 100 });
  const largo = Array.from({ length: 90 }, (_, i) => ({ date: A.sumaDias('2026-08-01', i), spend: 10 })), s = A.gastoPorPeriodo(largo);
  assert.equal(s.paso, 'semana'); assert.equal(s.puntos[0].fecha, '2026-07-27', 'el 1 de agosto de 2026 es sábado: su semana empieza el lunes 27'); assert.equal(s.puntos[0].gasto, 20);
  assert.equal(s.puntos.reduce((a, p) => a + p.gasto, 0), 900, 'no se pierde nada'); assert.ok(s.puntos.slice(1, -1).every((p) => p.gasto === 70));
  assert.deepEqual(A.gastoPorPeriodo([{ date: '2026-10-01', spend: null }, { date: 'x', spend: 5 }, null]).puntos, [], 'lo que falta no es 0');
  assert.deepEqual(A.gastoPorPeriodo(null), { paso: 'dia', puntos: [] });
});
// ---------- La tabla ----------
t('normalizarFila: los nombres de Windsor de cada conector y los números que no llegaron quedan en null', () => {
  const m = A.normalizarFila({ account_id: 'act_123', date: '2026-10-05', campaign: 'Camp | A', adset_name: 'Set', ad_name: 'Ad 1', spend: '10.5', impressions: 100, clicks: 3 }, 'meta');
  assert.deepEqual(m, { cuenta: '123', fecha: '2026-10-05', campana: 'Camp / A', conjunto: 'Set', anuncio: 'Ad 1', gasto: 10.5, imp: 100, clics: 3, conv: null, ingresos: null });
  const g = A.normalizarFila({ account_id: '1', campaign: 'C', ad_group: 'Grupo', spend: 5 }, 'google');
  assert.equal(g.conjunto, 'Grupo'); assert.equal(g.conv, null); assert.equal(g.anuncio, '');
  const l = A.normalizarFila({ account_id: '1', campaign: 'C', creative_id: 77, spend: 5 }, 'linkedin');
  assert.equal(l.conjunto, ''); assert.equal(l.anuncio, 'Anuncio 77');
  assert.equal(A.normalizarFila(null), null);
});
t('agregarTabla: tres niveles, ordenados por gasto, con CTR/CPC/CPA/ROAS y las dos mitades; sin el campo de conversiones, conv es null', () => {
  const filas = [];
  for (let d = 1; d <= 10; d++) for (const [c, ad, g, imp, cl, cv] of [['A', 'a1', 50, 4000, 80, 2], ['A', 'a2', 20, 2000, 30, 0], ['B', 'b1', 100, 5000, 70, 1]]) {
    filas.push({ cuenta: '1', fecha: `2026-10-${String(d).padStart(2, '0')}`, campana: c, conjunto: 'S', anuncio: ad, gasto: g, imp, clics: cl, conv: cv, ingresos: cv * 100 });
  }
  const t1 = A.agregarTabla(filas, { plat: 'meta' });
  assert.deepEqual(t1.campanas.map((x) => x.nombre), ['B', 'A'], 'por gasto');
  assert.equal(t1.campanas[1].gasto, 700); assert.equal(t1.campanas[1].conv, 20); assert.equal(t1.campanas[1].conjunto, '', 'una campaña no trae conjunto');
  assert.equal(t1.conjuntos.length, 2); assert.equal(t1.anuncios.length, 3);
  assert.equal(t1.campanas[0].cpa, 1000 / 10); assert.equal(t1.campanas[0].roas, 1);
  assert.ok(t1.campanas[0].h1 && t1.campanas[0].h2, '10 días: hay dos mitades');
  assert.equal(t1.campanas[0].h1.gasto + t1.campanas[0].h2.gasto, t1.campanas[0].gasto);
  assert.deepEqual(t1.tiene, { conv: true, ingresos: true });
  const sinConv = A.agregarTabla(filas.map(({ conv, ingresos, ...r }) => ({ ...r, conv: null, ingresos: null })), { plat: 'meta' });
  assert.equal(sinConv.campanas[0].conv, null); assert.equal(sinConv.campanas[0].cpa, null); assert.equal(sinConv.campanas[0].roas, null);
  assert.deepEqual(sinConv.tiene, { conv: false, ingresos: false });
  assert.equal(A.agregarTabla(filas.slice(0, 3), {}).campanas[0].h1, null, 'menos de 6 días: sin mitades');
  assert.deepEqual(A.agregarTabla([], {}), { tiene: { conv: false, ingresos: false }, campanas: [], conjuntos: [], anuncios: [] });
  assert.equal(A.agregarTabla(filas.map((f) => ({ ...f, anuncio: '' })), {}).anuncios.length, 0, 'sin anuncios: el nivel queda vacío');
  assert.equal(A.agregarTabla(Array.from({ length: 60 }, (_, i) => ({ fecha: '', campana: `C${i}`, gasto: i })), { tope: 40 }).campanas.length, 40, 'tope de filas');
  const j = A.juntarTablas([t1, A.agregarTabla([{ campana: 'G', gasto: 9999, imp: 1, clics: 1 }], { plat: 'google' })]);
  assert.equal(j.campanas[0].nombre, 'G'); assert.equal(j.campanas.length, 3);
});
t('sinMontos: quien no ve costos no recibe gasto, presupuesto, ingresos, CPC ni CPA en ninguna parte; queda CTR, ROAS, clics y conversiones', () => {
  const rep = { on: true, days: 30, errors: {}, clients: [{ slug: 'akai', name: 'AKAI', budget: 3000, ok: { vigente: true, month: '2026-10', at: '2026-10-02', budget: 3000 }, series: SERIE,
    plats: { meta: { spend: 2500, imp: 220000, clicks: 2850, conv: 72, rev: 6600, found: true, tiene: { conv: true, rev: true }, ctr: 1.3, cpa: 34.72, roas: 2.64 } },
    total: { spend: 2500, imp: 220000, clicks: 2850, conv: 72, rev: 6600, tiene: { conv: true, rev: true }, cpa: 34.72, roas: 2.64 },
    tabla: { campanas: CAMPANAS, conjuntos: [], anuncios: [ANUNCIO_CANSADO], tiene: { conv: true, ingresos: true } } }] };
  const sin = A.sinMontos(rep), c = sin.clients[0];
  assert.equal(sin.costos, false); assert.equal(c.budget, null); assert.deepEqual(c.series, []); assert.equal(c.ok.budget, null); assert.equal(c.ok.vigente, true, 'si hay OK vigente se sigue sabiendo');
  const json = JSON.stringify(sin);
  for (const llave of ['spend', 'rev', 'cpa', 'cpc', 'gasto', 'ingresos']) assert.ok(!new RegExp(`"${llave}":[\\d.]`).test(json), `sin ${llave} con monto (tiene.rev es un sí o no, no un monto)`);
  for (const monto of ['2500', '3000', '6600', '34.72', '1200', '83.33', '2700']) assert.ok(!json.includes(monto), `sin el monto ${monto}`);
  assert.equal(c.total.imp, 220000); assert.equal(c.total.roas, 2.64); assert.equal(c.plats.meta.ctr, 1.3);
  assert.equal(c.tabla.campanas[0].ctr, 2); assert.equal(c.tabla.campanas[0].roas, 5); assert.equal(c.tabla.campanas[0].conv, 60); assert.equal(c.tabla.campanas[0].clics, 1800);
  assert.equal(rep.clients[0].budget, 3000, 'no cambia el original');
  assert.equal(A.sinMontos({ on: false }).on, false);
});

// ---------- Las recomendaciones calculadas ----------
t('recomendaciones: con la tabla salen pausar, sin conversiones, fatiga y subir presupuesto, cada una con sus números, su regla y su periodo', () => {
  const rs = A.recomendaciones(datosDe());
  assert.deepEqual(tipos(rs), ['pausar', 'sin_conversiones', 'fatiga', 'subir_presupuesto'], 'en orden de prioridad');
  for (const r of rs) {
    assert.ok(A.recValida(r), r.tipo); assert.ok(Number.isFinite(r.evidencia.valor) && Number.isFinite(r.evidencia.umbral), `${r.tipo}: valor y umbral`);
    assert.equal(r.evidencia.periodo, 'últimos 30 días'); assert.match(r.regla, /^ad-corrida §/, `${r.tipo}: cita su sección`); assert.equal(r.origen, 'calculada'); assert.equal(r.estado, 'abierta');
    assert.equal(r.regla, A.REGLAS[r.tipo]); assert.ok(r.clave.startsWith(r.tipo));
  }
  const por = Object.fromEntries(rs.map((r) => [r.tipo, r]));
  assert.deepEqual([por.pausar.evidencia.metrica, por.pausar.evidencia.valor, por.pausar.evidencia.umbral], ['CPA', 83.33, r2(2 * (2500 / 72))]);
  assert.equal(por.pausar.donde.nombre, 'Promo');
  assert.deepEqual([por.sin_conversiones.evidencia.metrica, por.sin_conversiones.evidencia.valor, por.sin_conversiones.evidencia.umbral], ['Clics sin conversiones', 150, 100]);
  assert.deepEqual([por.fatiga.evidencia.metrica, por.fatiga.evidencia.valor, por.fatiga.evidencia.umbral], ['CTR', 1.2, 1.6]);
  assert.equal(por.fatiga.donde.nivel, 'anuncio'); assert.match(por.fatiga.detalle, /CTR 2% → 1\.2%.*CPM Q20 → Q33\.33/);
  assert.deepEqual([por.subir_presupuesto.evidencia.valor, por.subir_presupuesto.donde.nombre], [20, 'Reservas']);
  assert.ok(por.subir_presupuesto.evidencia.valor <= por.subir_presupuesto.evidencia.umbral);
  assert.equal(A.textoEvidencia(por.pausar), 'CPA Q83.33 · umbral Q69.44 · últimos 30 días');
});
t('recomendaciones: un cambio de presupuesto o una pausa SIEMPRE requiere el OK del CEO; rotar un creativo o revisar un destino, no', () => {
  const por = Object.fromEntries(A.recomendaciones(datosDe()).map((r) => [r.tipo, r]));
  assert.equal(por.pausar.requiere_ceo, true); assert.equal(por.subir_presupuesto.requiere_ceo, true);
  assert.equal(por.fatiga.requiere_ceo, false); assert.equal(por.sin_conversiones.requiere_ceo, false);
  assert.match(por.subir_presupuesto.accion, /OK del CEO/);
  const exceso = A.recomendaciones(datosDe({ presupuesto: 2500, ok: { vigente: true, month: '2026-10', budget: 2500 } }));
  assert.equal(exceso[0].tipo, 'pacing_exceso'); assert.equal(exceso[0].requiere_ceo, true);
  assert.deepEqual([exceso[0].evidencia.metrica, exceso[0].evidencia.valor, exceso[0].evidencia.umbral], ['Gasto vs presupuesto', 108, 100]);
  assert.ok(!tipos(exceso).includes('subir_presupuesto'), 'no se recomienda subir presupuesto mientras se pasa del aprobado');
  const sinOk = A.recomendaciones(datosDe({ ok: null }));
  assert.equal(sinOk[0].tipo, 'sin_ok'); assert.equal(sinOk[0].requiere_ceo, true); assert.deepEqual([sinOk[0].evidencia.valor, sinOk[0].evidencia.umbral], [2700, 0]);
  assert.equal(A.recomendaciones(datosDe({ ok: { vigente: false, month: '2026-09', budget: 3000 } }))[0].tipo, 'sin_ok', 'un OK de otro mes no vale');
  assert.equal(A.recomendaciones(datosDe({ presupuesto: 3500 }))[0].tipo === 'sin_ok', true, 'si cambió el monto, el OK se cayó');
  const lento = A.recomendaciones(datosDe({ presupuesto: 9000, ok: { vigente: true, month: '2026-10', budget: 9000 } }));
  assert.ok(tipos(lento).includes('pacing_bajo')); assert.equal(lento.find((r) => r.tipo === 'pacing_bajo').requiere_ceo, false);
  const ritmo = A.recomendaciones(datosDe({ presupuesto: 2800, ok: { vigente: true, month: '2026-10', budget: 2800 } }));
  assert.equal(ritmo[0].tipo, 'pacing_exceso'); assert.equal(ritmo[0].evidencia.umbral, 110); assert.match(ritmo[0].evidencia.periodo, /ritmo a fin de mes/);
});
t('recomendaciones: una recomendación sin números NO se emite (sin periodo, sin la métrica, con un dato que falta o sin montos)', () => {
  assert.deepEqual(A.recomendaciones(datosDe({ dias: undefined })), [], 'sin periodo no hay evidencia');
  assert.deepEqual(A.recomendaciones(null), []); assert.deepEqual(A.recomendaciones({}), []);
  const sinConv = A.recomendaciones(datosDe({ tabla: { campanas: CAMPANAS.map((c) => ({ ...c, conv: null, cpa: null, roas: null, ingresos: null })), conjuntos: [], anuncios: [] }, total: { spend: 2500, imp: 220000, clicks: 2850, conv: 0, rev: 0, tiene: { conv: false, rev: false } } }));
  assert.ok(!tipos(sinConv).includes('sin_conversiones'), 'conversiones que Windsor no mandó no son «0 conversiones»');
  assert.ok(!tipos(sinConv).includes('pausar') && !tipos(sinConv).includes('subir_presupuesto'));
  const sinGasto = A.recomendaciones(datosDe({ series: [], ok: null, tabla: { campanas: [], conjuntos: [], anuncios: [ANUNCIO_CANSADO] } }));
  assert.deepEqual(tipos(sinGasto), ['fatiga'], 'sin la serie no hay ritmo ni «sin OK»');
  // Quien no ve costos: sin montos solo salen las que no los necesitan.
  const { gasto, ingresos, cpc, cpa, ...resto } = CAMPANAS[1];
  const sinMontos = A.recomendaciones(datosDe({ series: [], presupuesto: null, ok: { vigente: true, month: '2026-10', budget: null }, total: { imp: 220000, clicks: 2850, conv: 72, roas: 2.64, tiene: { conv: true, rev: true } },
    tabla: { campanas: [CAMPANAS[2], resto].map(({ gasto: g, ingresos: i, cpc: c, cpa: p, ...r }) => r), conjuntos: [], anuncios: [] } }));
  assert.deepEqual(tipos(sinMontos), ['pausar', 'sin_conversiones'], 'sin gasto no hay CPA, CPM ni ritmo: solo lo que sale de clics, conversiones y el ROAS que el servidor calculó antes');
  assert.deepEqual([sinMontos[0].evidencia.metrica, sinMontos[0].evidencia.valor, sinMontos[0].evidencia.umbral], ['ROAS', 0.6, 1], 'la pausa sin montos se apoya en el ROAS, no en el CPA');
  for (const r of [...A.recomendaciones(datosDe()), ...sinMontos, ...A.recomendaciones(datosDe({ ok: null })), ...A.recomendaciones(datosDe({ presupuesto: 2500, ok: { vigente: true, month: '2026-10', budget: 2500 } }))]) {
    assert.ok(A.tieneNumeros(r) && A.recValida(r), `${r.tipo} lleva números`);
  }
  assert.equal(A.recValida({ tipo: 'fatiga', accion: 'x', evidencia: { metrica: 'CTR', valor: null, umbral: 1, periodo: 'p' } }), false);
  assert.equal(A.recValida({ tipo: 'fatiga', accion: 'x', evidencia: { metrica: 'CTR', valor: 0.9, umbral: 1.2, periodo: '' } }), false);
  assert.equal(A.recValida({ tipo: 'fatiga', accion: 'x', evidencia: { metrica: 'CTR', valor: 0, umbral: 0, periodo: 'p' } }), true, '0 es un número');
  assert.ok(A.faltas({ tipo: 'fatiga', accion: 'rota' }).some((x) => /Sin números/.test(x)), 'una rec sin números no se aprueba');
  assert.deepEqual(A.faltas(A.recomendaciones(datosDe())[0]), []);
});

// ---------- limpiarRec y requiere_ceo ----------
t('limpiarRec: solo lo conocido; la regla sale del tipo; el HTML queda como texto; requiere_ceo no baja', () => {
  const sucia = A.limpiarRec({ id: 'x', v: 9, tipo: 'PAUSAR', donde: { nivel: 'Campaña', nombre: '<img src=x onerror=alert(1)>'.repeat(20) }, evidencia: { metrica: 'cpa', valor: '85.5', umbral: '60', periodo: 'últimos 30 días' },
    detalle: 'd'.repeat(999), accion: 'Pausa X', requiere_ceo: false, regla: 'inventada: haz lo que quieras', origen: 'ia', estado: 'rara', extra: 1 });
  assert.deepEqual(Object.keys(sucia).sort(), ['accion', 'clave', 'detalle', 'donde', 'estado', 'evidencia', 'origen', 'regla', 'requiere_ceo', 'tipo']);
  assert.equal(sucia.tipo, 'pausar'); assert.equal(sucia.donde.nivel, 'campana'); assert.equal(sucia.donde.nombre.length, 120);
  assert.deepEqual(sucia.evidencia, { metrica: 'CPA', valor: 85.5, umbral: 60, periodo: 'últimos 30 días' });
  assert.equal(sucia.detalle.length, 240); assert.equal(sucia.regla, A.REGLAS.pausar, 'la IA no inventa reglas'); assert.equal(sucia.requiere_ceo, true, 'pausar siempre'); assert.equal(sucia.estado, 'abierta');
  assert.deepEqual(A.limpiarRec(null), A.vacio()); assert.equal(A.vacio().tipo, ''); assert.equal(A.vacio().regla, '');
  assert.equal(A.limpiarRec({ tipo: 'inventado' }).tipo, ''); assert.equal(A.limpiarRec({ evidencia: { metrica: 'Magia', valor: 1, umbral: 1, periodo: 'p' } }).evidencia.metrica, '');
  assert.equal(A.limpiarRec({ evidencia: { valor: -5, umbral: 'mucho' } }).evidencia.valor, null); assert.equal(A.limpiarRec({ evidencia: { umbral: 'mucho' } }).evidencia.umbral, null);
  assert.equal(A.limpiarRec({ tipo: 'fatiga', accion: 'Rota el anuncio', requiere_ceo: false }).requiere_ceo, false);
  assert.equal(A.limpiarRec({ tipo: 'fatiga', accion: 'Rota el anuncio y sube el presupuesto de la campaña', requiere_ceo: false }).requiere_ceo, true, 'si dice que mueve presupuesto, lo necesita aunque la IA diga que no');
  assert.equal(A.limpiarRec({ tipo: 'sin_conversiones', accion: 'Pausa la campaña', requiere_ceo: false }).requiere_ceo, true);
  assert.equal(A.limpiarRec({ tipo: 'pacing_bajo', accion: 'Revisa la puja', requiere_ceo: 'sí' }).requiere_ceo, true, 'si la IA lo pide, se respeta');
  for (const x of ['pausa', 'Pausar', 'mover presupuesto', 'baja el presupuesto', 'Sube la inversión', 'reasigna lo que gasta', 'apaga el anuncio']) assert.equal(A.tocaPresupuesto(x), true, x);
  for (const x of ['Rota el anuncio a otra variante de hook', 'Revisa el destino y el tracking', 'Cambia el público']) assert.equal(A.tocaPresupuesto(x), false, x);
  for (const tipo of ['sin_ok', 'pacing_exceso', 'pausar', 'subir_presupuesto']) assert.equal(A.limpiarRec({ tipo, accion: 'x' }).requiere_ceo, true, tipo);
  assert.equal(A.limpiar, A.limpiarRec);
});
t('recSinMontos y tareaDeRec: quien no ve costos no recibe montos; la tarea es para ⑩ Ads y no se duplica (clave)', () => {
  const r = A.recomendaciones(datosDe()).find((x) => x.tipo === 'pausar');
  const sin = A.recSinMontos(r);
  assert.equal(sin.evidencia.valor, null); assert.equal(sin.evidencia.umbral, null); assert.equal(sin.detalle, ''); assert.equal(A.recValida(sin), false);
  const ctr = A.recSinMontos(A.recomendaciones(datosDe()).find((x) => x.tipo === 'fatiga'));
  assert.equal(ctr.evidencia.valor, 1.2, 'un CTR no es un monto'); assert.ok(!/Q\d/.test(ctr.detalle));
  assert.ok(!/Q\s?\d/.test(A.recSinMontos({ ...r, accion: 'Pausa X: gasta Q1,200 y cuesta $85.50' }).accion));
  const tarea = A.tareaDeRec(r);
  assert.equal(tarea.dept, '⑩ Ads'); assert.equal(tarea.fila, r.clave); assert.match(tarea.title, /^Ads · Pausa «Promo»/); assert.ok(tarea.title.length <= 200);
  assert.match(tarea.por_que, /CPA Q83\.33/); assert.match(tarea.por_que, /Necesita el OK del CEO/); assert.match(tarea.por_que, /ad-corrida §4 #2/);
  assert.ok(!/Necesita el OK/.test(A.tareaDeRec(A.recomendaciones(datosDe()).find((x) => x.tipo === 'fatiga')).por_que));
  assert.match(A.tituloRec(r), /^Pausar lo que no rinde · Promo$/);
});

// ---------- Leer lo que contesta la IA ----------
const REC_BUENA = { tipo: 'pausar', donde: { nivel: 'campana', nombre: 'Promo' }, evidencia: { metrica: 'CPA', valor: 83.33, umbral: 69.44, periodo: 'últimos 30 días' }, accion: 'Pausa «Promo» o mueve su presupuesto', requiere_ceo: false };
t('leer: un bloque bueno (objeto o lista) da las recomendaciones limpias, siempre como de la IA', () => {
  const r = A.leer(`Resumen corto.\n${F}recs\n${JSON.stringify({ recs: [REC_BUENA] })}\n${F}\n`);
  assert.equal(r.recs.length, 1); assert.deepEqual([r.sin_numeros, r.inventadas], [0, 0]);
  assert.equal(r.recs[0].origen, 'ia'); assert.equal(r.recs[0].requiere_ceo, true, 'pausar: el CEO, aunque la IA dijo que no'); assert.equal(r.recs[0].regla, A.REGLAS.pausar);
  assert.equal(A.leer(`${F}recs\n${JSON.stringify([REC_BUENA])}\n${F}`).recs.length, 1, 'una lista también sirve');
  assert.equal(A.leer(`${F}RECS \n${JSON.stringify({ recs: [REC_BUENA] })}\n${F}`).recs.length, 1);
  assert.equal(A.leer(`${F}recs\n${JSON.stringify({ recs: [] })}\n${F}`).recs.length, 0, 'la IA dice que no hay nada que mover: es una respuesta, no un error');
  const dos = A.leer(`${F}recs\n${JSON.stringify({ recs: [{ ...REC_BUENA, evidencia: { ...REC_BUENA.evidencia, valor: 1 } }] })}\n${F}\ntexto\n${F}recs\n${JSON.stringify({ recs: [REC_BUENA] })}\n${F}`);
  assert.equal(dos.recs[0].evidencia.valor, 83.33, 'manda el último bloque');
  assert.equal(A.leer(`${F}recs\n${JSON.stringify({ recs: [REC_BUENA, REC_BUENA] })}\n${F}`).recs.length, 1, 'sin repetidas');
  assert.ok(A.leer(`${F}recs\n${JSON.stringify({ recs: Array.from({ length: 30 }, (_, i) => ({ ...REC_BUENA, donde: { nivel: 'campana', nombre: `C${i}` } })) })}\n${F}`).recs.length <= 8, 'máximo 8');
});
t('leer: sin números, sin tipo o sin acción se descartan (y se cuentan); con los datos, también la que cita un número que no está en la tabla', () => {
  const sinNum = { ...REC_BUENA, evidencia: { metrica: 'CPA', periodo: 'últimos 30 días' } }, sinAccion = { ...REC_BUENA, accion: '' }, sinTipo = { ...REC_BUENA, tipo: 'magia' };
  const r = A.leer(`${F}recs\n${JSON.stringify({ recs: [REC_BUENA, sinNum, sinAccion, sinTipo] })}\n${F}`);
  assert.equal(r.recs.length, 1); assert.equal(r.sin_numeros, 3);
  const d = datosDe();
  const buena = A.leer(`${F}recs\n${JSON.stringify({ recs: [REC_BUENA] })}\n${F}`, d);
  assert.equal(buena.recs.length, 1, '83.33 y 69.44 están en la tabla'); assert.equal(buena.inventadas, 0);
  const inventada = A.leer(`${F}recs\n${JSON.stringify({ recs: [{ ...REC_BUENA, evidencia: { ...REC_BUENA.evidencia, valor: 91.17 } }, { ...REC_BUENA, donde: { nivel: 'campana', nombre: 'Otra' }, evidencia: { ...REC_BUENA.evidencia, umbral: 12.34 } }] })}\n${F}`, d);
  assert.equal(inventada.recs.length, 0); assert.equal(inventada.inventadas, 2, 'valor o umbral que no salen de la tabla');
  const nums = A.numerosDe(d);
  for (const n of [83.33, 69.44, 20, 1.2, 1.6, 2700, 100, 150, 24.3]) assert.ok(nums.some((x) => Math.abs(x - n) < 0.02), `${n} está permitido`);
  assert.ok(!nums.some((x) => Math.abs(x - 91.17) < 0.02));
});
t('leer: un bloque a medias, roto o sin bloque da null', () => {
  assert.equal(A.leer(`Texto.\n${F}recs\n{"recs":[{"tipo":"pausar"`), null, 'sin cierre');
  assert.equal(A.leer(`${F}recs\n{"recs":[{"tipo":"pausar","evidencia":{"metrica":"CPA"\n${F}`), null, 'JSON cortado');
  assert.equal(A.leer(`${F}recs\nesto no es json\n${F}`), null);
  assert.equal(A.leer(`${F}recs\n${JSON.stringify({ otra: 1 })}\n${F}`), null, 'sin la lista de recs');
  assert.equal(A.leer(`${F}recs\n"hola"\n${F}`), null);
  assert.equal(A.leer('sin ningún bloque, solo opinión'), null); assert.equal(A.leer(''), null); assert.equal(A.leer(null), null); assert.equal(A.leer(undefined), null);
  assert.equal(A.leer(`${F}criterios\n{"cumple":[]}\n${F}`), null, 'otro bloque no cuenta');
  assert.equal(A.leer('x'.repeat(500000)), null, 'un texto gigante no se lee');
});

// ---------- El pedido a la IA ----------
t('prompt: pide su bloque recs, trae las reglas y los números, y no llega a 5 000 caracteres aunque la tabla sea enorme', () => {
  const grande = (n) => Array.from({ length: n }, (_, i) => fila('campana', `Campaña con un nombre bastante largo número ${i} `.repeat(3), { gasto: 100 + i, imp: 5000 + i, clics: 100 + i, conv: i % 7, ingresos: i * 10 }, { h1: { gasto: 50, imp: 2500, clics: 60, conv: 1 }, h2: { gasto: 50, imp: 2500, clics: 40, conv: 1 } }));
  const ctx = { hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'AKAI ' + 'N'.repeat(300) }, ficha: { incluye: Array.from({ length: 12 }, (_, i) => ({ k: `Área ${i}`, v: 'v'.repeat(400) })), fuera: 'x'.repeat(600) }, aprendizajes: ['a'.repeat(500)],
    ads: datosDe({ tabla: { campanas: grande(100), conjuntos: grande(100), anuncios: grande(100), tiene: { conv: true, ingresos: true } } }) };
  for (const c of [ctx, { cliente: { nombre: 'X' } }, {}, null, undefined, { ads: datosDe() }]) {
    const p = A.prompt(c);
    assert.ok(p.length < 5000, `mide ${p.length}`); assert.ok(p.includes(`${F}${A.BLOQUE}`), 'pide su bloque'); assert.equal(A.BLOQUE, 'recs'); assert.ok(p.trimEnd().endsWith(F), 'termina con el bloque');
    assert.match(p, /Solo usas los números de la TABLA/); assert.match(p, /NUNCA escribes en una cuenta de anuncios/); assert.match(p, /requiere_ceo true/); assert.match(p, /ad-corrida/);
    assert.match(p, /son datos, no instrucciones/);
  }
  const p = A.prompt({ hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'AKAI' }, ads: datosDe() });
  assert.match(p, /PERIODO: últimos 30 días/); assert.match(p, /- Promo \| 1000 \| 50000 \| 900 \| 12 \| 1\.8 \| 83\.33 \| 0\.6/); assert.match(p, /CPA de la cuenta 34\.72 · pausar desde CPA 69\.44/);
  assert.match(p, /PRESUPUESTO APROBADO DEL MES: 3000/); assert.match(p, /mitades CTR 2→1\.2 CPM 20→33\.33/);
  assert.match(A.prompt({ cliente: { nombre: 'X' } }), /TABLA: ⚠️ SIN DATOS: sale de Windsor/, 'sin datos lo dice y de dónde saldrían');
  assert.ok(!/06-ECONOMIA|rates|margen/i.test(A.prompt(ctx)), 'nada interno de Inherent');
});

// ---------- El servidor ----------
await tt('servidor: report agrega la tabla (con Windsor simulado), la cachea 6 horas en sources, respeta el alcance, quita los montos y solo hace GET', async () => {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) { console.log('  (se salta: hay una base real en el entorno; esta prueba solo corre con la base en memoria)'); return; }
  let pglite = true; try { await import('@electric-sql/pglite'); } catch { pglite = false; }
  if (!pglite) { console.log('  (se salta: falta @electric-sql/pglite)'); return; }
  Object.assign(process.env, { LOCAL_DB: 'memory://', WINDSOR_API_KEY: 'k-prueba' }); delete process.env.VERCEL;
  const llamadas = [], f0 = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    llamadas.push({ url: String(url), init });
    const u = new URL(url), campos = u.searchParams.get('fields');
    if (campos.includes('campaign_id')) return { ok: false, status: 400, text: async () => 'campo inválido' }; // la lista más rica falla: se prueba la siguiente
    const rows = [];
    for (let d = 1; d <= 20; d++) for (const [c, ad, g, imp, cl, cv] of [['Camp A', 'Ad 1', 50, 4000, 80, d <= 10 ? 3 : 0], ['Camp A', 'Ad 2', 20, 2000, 30, 1], ['Camp B', 'Ad 3', 40, 3000, 50, 0]]) rows.push({ account_id: '123', date: `2026-10-${String(d).padStart(2, '0')}`, campaign: c, adset_name: 'Set', ad_name: ad, spend: g, impressions: imp, clicks: cl, conversions: cv, revenue: cv * 100 });
    rows.push({ account_id: '999', date: '2026-10-01', campaign: 'DE OTRO', adset_name: 'S', ad_name: 'X', spend: 777, impressions: 1, clicks: 1, conversions: 1, revenue: 1 });
    return { ok: true, status: 200, json: async () => ({ data: rows }) };
  };
  try {
    const db = await import('../api/_lib/db.js'), ads = await import('../api/_lib/ads.js');
    const mes = new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 7);
    await db.upsert('accounts', 'acc-akai', { name: 'AKAI', ads: { meta: 'act_123', budget: 3000, ok: { at: `${mes}-02`, by: 'ceo@x.com', month: mes, budget: 3000 } } }, 't');
    await db.upsert('accounts', 'acc-otro', { name: 'OTRO', ads: { meta: '999', budget: 500, ok: { at: '2020-01-02', by: 'ceo@x.com', month: '2020-01', budget: 500 } } }, 't');
    const full = await ads.report(30, { costos: true }), akai = full.clients.find((c) => c.slug === 'akai');
    assert.equal(full.costos, true); assert.deepEqual(full.errors, {});
    assert.equal(akai.total.spend, 2200); assert.deepEqual(akai.total.tiene, { conv: true, rev: true });
    assert.deepEqual(akai.ok, { vigente: true, month: mes, at: `${mes}-02`, budget: 3000 }); assert.ok(!('by' in akai.ok), 'sin quién dio el OK');
    assert.equal(full.clients.find((c) => c.slug === 'otro').ok.vigente, false, 'un OK de otro mes no es vigente');
    assert.deepEqual(akai.tabla.campanas.map((c) => c.nombre), ['Camp A', 'Camp B']); assert.equal(akai.tabla.anuncios.length, 3); assert.equal(akai.tabla.conjuntos.length, 2);
    assert.ok(!JSON.stringify(akai.tabla).includes('DE OTRO') && !JSON.stringify(akai.tabla).includes('777'), 'nada de otra cuenta');
    assert.ok(akai.tabla.campanas[0].h1 && akai.tabla.campanas[0].h2); assert.equal(akai.tabla.cache, undefined);
    const n1 = llamadas.length, otra = await ads.report(30, { costos: true });
    assert.equal(llamadas.length, n1, 'la segunda vez sale del caché: ninguna llamada a Windsor'); assert.equal(otra.clients.find((c) => c.slug === 'akai').tabla.cache, true);
    const doc = await db.get('sources', 'ads-akai-tabla');
    assert.equal(doc.profile, 'akai'); assert.deepEqual(Object.keys(doc.por_dias), ['30']); assert.ok(Date.now() - Date.parse(doc.por_dias['30'].at) < 60000);
    await db.upsert('sources', 'ads-akai-tabla', { por_dias: { 30: { ...doc.por_dias['30'], at: new Date(Date.now() - 7 * 3600e3).toISOString() } } }, 't');
    await ads.report(30, { costos: true }); // pasadas 6 horas la tabla se vuelve a armar (las filas siguen en memoria 1 h) y el caché se renueva
    assert.ok(Date.now() - Date.parse((await db.get('sources', 'ads-akai-tabla')).por_dias['30'].at) < 60000, 'caducado: se rearmó y se guardó otra vez');
    const sin = await ads.report(30, { sc: null }), s0 = sin.clients.find((c) => c.slug === 'akai'), json = JSON.stringify(sin);
    assert.equal(sin.costos, false, 'sin pasar costos: cierra cerrado'); assert.equal(s0.budget, null); assert.deepEqual(s0.series, []); assert.equal(s0.total.spend, undefined);
    for (const llave of ['spend', 'rev', 'gasto', 'ingresos', 'cpa', 'cpc']) assert.ok(!new RegExp(`"${llave}":[\\d.]`).test(json), `sin ${llave}`);
    assert.equal(s0.total.imp, akai.total.imp); assert.ok(s0.tabla.campanas[0].ctr > 0);
    const alcance = await ads.report(30, { costos: true, sc: { client: (s) => s === 'otro' } });
    assert.deepEqual(alcance.clients.map((c) => c.slug), ['otro'], 'solo los clientes del alcance, con su tabla');
    assert.deepEqual(alcance.clients[0].tabla.campanas.map((c) => c.nombre), ['DE OTRO']); assert.ok(!JSON.stringify(alcance).includes('Ad 1') && !JSON.stringify(alcance).includes('Camp A'), 'nada de AKAI en lo de OTRO');
    assert.equal((await ads.report(30, { costos: true, tabla: false })).clients[0].tabla, undefined, 'tabla: false se la salta');
    assert.ok(llamadas.length > 0 && llamadas.every((l) => l.init === undefined && l.url.startsWith('https://connectors.windsor.ai/')), 'solo lecturas (GET) a Windsor, nada más');
  } finally { globalThis.fetch = f0; }
});

// ---------- Lo que dicen los archivos ----------
t('estáticas · api/_lib/ads.js: solo lee de Windsor, nada de AdWhispr, cierra cerrado y respeta sc', () => {
  const src = leerArchivo('api/_lib/ads.js'), rep = src.slice(src.indexOf('export async function report'), src.indexOf('// ---------- Competencia'));
  assert.ok(!/adwhispr/i.test(src.replace(/^\/\/.*$/gm, '')), 'no usa AdWhispr'); assert.ok(!/update_budget|pause_campaign|resume_campaign|launch_|execute_action/.test(src), 'ninguna llamada de escritura a una plataforma');
  const llamadas = [...src.matchAll(/fetch\(([^)]*)\)/g)].map((m) => m[0]);
  assert.ok(llamadas.some((l) => l.includes('connectors.windsor.ai')) && llamadas.some((l) => l.includes('api.apify.com')), 'solo Windsor y Apify');
  assert.ok(!/connectors\.windsor\.ai[^`]*`[^)]*method/.test(src), 'Windsor sin method: es GET');
  assert.match(src, /costos = false/); assert.match(rep, /sc\.client\(slugDe\(a\)\)/); assert.match(rep, /costos \? \{ \.\.\.out, costos: true \} : sinMontos\(out\)/);
  assert.match(src, /import \{[^}]*sinMontos[^}]*\} from '\.\.\/\.\.\/public\/js\/marketing\/ads\.js'/); assert.match(src, /ads-\$\{slug\}-tabla/); assert.match(src, /SEIS_HORAS = 6 \* 3600e3/); assert.match(src, /profile: slug/);
  assert.ok(!/db\.(update|create|remove)\(/.test(rep), 'solo el caché de la tabla, por upsert (no es un doc con historial)');
});
t('estáticas · ads.js (puro): sin DOM, sin red, sin escribir en ninguna plataforma; la IA solo propone', () => {
  const src = leerArchivo('public/js/marketing/ads.js');
  assert.ok(!/\b(document|window|localStorage|fetch|XMLHttpRequest)\b/.test(src.replace(/^\/\/.*$/gm, '')), 'puro');
  assert.ok(!/^import .*(core|api|app)\.js/m.test(src), 'no importa core.js'); assert.ok(!/raw\(/.test(src));
  assert.match(src, /export const BLOQUE = 'recs'/); assert.match(src, /export function prompt\(ctx\)/); assert.match(src, /export function leer\(texto/); assert.match(src, /export function limpiarRec/);
});
t('estáticas · competencia-ui.js: las mismas rutas de Apify, https para links e imágenes y nada de raw() sobre lo que viene de afuera', () => {
  const src = leerArchivo('public/js/marketing/competencia-ui.js');
  assert.match(src, /export function competenciaUI\(host, \{ me, slugs = \[\], alive/); assert.match(src, /api\('ads\/competitors\/' \+ encodeURIComponent\(slug\)\)/); assert.match(src, /api\('ads\/competitors\/' \+ encodeURIComponent\(slug\), \{ method: 'POST', body: \{ list \} \}\)/);
  assert.ok([...src.matchAll(/raw\(([^)]*)\)/g)].every((m) => /^'(selected|disabled)'$/.test(m[1])), 'raw() solo con textos propios');
  assert.match(src, /Anuncios de la competencia/); assert.match(src, /Buscar anuncios/); assert.match(src, /adstransparency\.google\.com/); assert.match(src, /linkedin\.com\/ad-library/);
  assert.match(src, /const https = /); assert.ok(!src.includes('a.link || \'#\''), 'un link de Apify solo si es https');
});
t('estáticas · ads-intel-ui.js: monta con la firma del contrato, no escribe en cuentas de anuncios y guarda por /api/entregables', () => {
  const crudo = leerArchivo('public/js/marketing/ads-intel-ui.js'), src = crudo.replace(/^\/\/.*$/gm, '');
  assert.match(src, /export async function adsIntelTool\(host, \{ me, slug, b, alive = \(\) => true, resto = \[\] \} = \{\}\)/);
  assert.ok([...src.matchAll(/raw\(([^)]*)\)/g)].every((m) => /^'(selected|disabled)'$/.test(m[1])), 'raw() solo con textos propios: nada de lo que dice un modelo');
  assert.ok(!/windsor\.ai|adwhispr|ads\/accounts|ads-studio|method: 'PUT'/i.test(src), 'no habla con Windsor ni AdWhispr, ni toca las cuentas ni el OK del CEO desde aquí');
  const rutas = [...src.matchAll(/\bapi\((`[^`]*`|'[^']*')/g)].map((m) => m[1].slice(1, -1));
  assert.ok(rutas.length >= 4 && rutas.every((r) => /^(ads\/report\?|entregables)/.test(r)), `solo lee el reporte y usa /api/entregables: ${rutas.join(' · ')}`);
  assert.match(src, /api\('entregables', \{ method: 'POST', body: \{ tool: A\.TOOL, client_slug: slug/); assert.match(src, /entregables\/\$\{enc\(doc\.id\)\}\/tareas/); assert.match(src, /A\.tareaDeRec\(r\)/); assert.match(src, /entregables\/\$\{enc\(doc\.id\)\}\/archivar/);
  assert.match(src, /body: \{ v: doc\.v/); assert.ok(!/method: 'DELETE'/.test(src), 'nada se borra: se archiva');
  assert.match(src, /import \{ bars, PAL \} from '\.\.\/charts\.js'/, 'el gasto diario con charts.js'); assert.match(src, /correrIA\(me, \{ tool: T, ctx/); assert.match(src, /A\.leer\(out\.texto, d\)/); assert.match(src, /adsUI\(\$\('#ain-var', box\), \{ me, b, alive: vivo \}\)/); assert.match(src, /competenciaUI\(\$\('#ain-comp', box\), \{ me, slugs: \[slug\], alive: vivo \}\)/);
  assert.match(src, /Necesita el OK del CEO/); assert.match(src, /Solo CEO, COO o quien edita Clientes|A\.FUENTE_COSTOS/); assert.match(src, /Conecta Windsor/); assert.match(src, /resto\[0\]/);
  assert.ok(A.FUENTE_COSTOS === 'Solo CEO, COO o quien edita Clientes');
  for (const ico of [...src.matchAll(/ico\('([\w-]+)'/g)].map((m) => m[1])) assert.ok(new RegExp(`['"]?${ico}['"]?\\s*:`).test(leerArchivo('public/js/iconos.js')), `el ícono ${ico} existe en iconos.js`);
  assert.match(src, /localStorage\.(get|set)Item\(K_DIAS[^\n]*\} catch/, 'localStorage dentro de try/catch');
});
t('estáticas · Mis tareas: la pestaña de pauta ya no pinta adsReport ni adsComp; deja un link por cliente a Ads Intelligence y la competencia compartida', () => {
  const w = leerArchivo('public/js/screens/work.js');
  assert.ok(!/adsReport|adsComp|adsRep\b|compSel|compRun|compRefresh|adsDays|id="adsch"/.test(w), 'se fue');
  assert.match(w, /import \{ rutaModulo, rutaHerramienta \} from '\.\.\/herramientas\.js'/); assert.match(w, /import \{ competenciaUI \} from '\.\.\/marketing\/competencia-ui\.js'/);
  assert.match(w, /rutaHerramienta\('marketing', sl, 'ads-intelligence'\)/); assert.match(w, /competenciaUI\(cd, \{ me, slugs, alive/);
  assert.match(w, /\$\{pautaBox\(withAds\)\}\$\{cuentasBox\(slugs\)\}/, 'la pestaña Campañas conserva Cuentas de pauta');
  assert.ok(!/ads\/report/.test(w), 'Mis tareas ya no lee el reporte de Windsor'); assert.match(w, /campsBox\(adsSel\)/); assert.match(w, /encargoBox\(adsSel\)/); assert.match(w, /data-act="adsOk"/, 'el OK del CEO sigue en Mis tareas › Ads');
});

console.log(`\n${ok} pruebas bien`);
