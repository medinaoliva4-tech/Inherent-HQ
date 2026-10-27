// Pruebas de las 3 herramientas de Consulting que tocan dinero y metas: Money Model Lab (escenarios), Plan de crecimiento 90 días
// (blueprint) e Impact Tracker (impacto). Cuidan que un insumo que falta dé null (nunca 0), que los cálculos se hagan aquí y no
// en la IA, que lo que sale al cliente no lleve internos y que cada módulo lea y limpie lo que contesta un modelo.
// node scripts/test-consulting-dinero.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reglasPrompt, ECUACION } from '../public/js/consulting/marcos.js';
import * as E from '../public/js/consulting/escenarios.js';
import * as B from '../public/js/consulting/blueprint.js';
import * as I from '../public/js/consulting/impacto.js';

const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..');
let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const nulos = (o) => Object.values(o).every((v) => v === null);
const bloque = (tag, o) => `\`\`\`${tag}\n${typeof o === 'string' ? o : JSON.stringify(o)}\n\`\`\``;

// ---------- Money Model Lab ----------
const BASE = { precio: 1000, costo: 600, volumen: 10, cac: 250, retencion: 0.8, meses: null };

t('escenarios · un insumo que falta da null en lo que depende de él, nunca 0', () => {
  assert.ok(nulos(E.calcular({})), 'sin nada, todo null');
  assert.ok(nulos(E.calcular({ ...BASE, costo: null })), 'sin costo no hay margen, ni LTV, ni LTGP:CAC, ni caja');
  assert.ok(nulos(E.calcular({ ...BASE, precio: null })));
  assert.deepEqual(E.calcular({ ...BASE, cac: null }), { margen: 400, margenPct: 40, ltv: 2000, ltgpCac: null, caja30: null });
  assert.deepEqual(E.calcular({ ...BASE, volumen: null }), { margen: 400, margenPct: 40, ltv: 2000, ltgpCac: 8, caja30: null });
  assert.deepEqual(E.calcular({ ...BASE, retencion: null }), { margen: 400, margenPct: 40, ltv: null, ltgpCac: null, caja30: 1500 }, 'sin retención ni meses no hay LTV');
  assert.equal(E.calcular({ ...BASE, retencion: null, meses: 10 }).ltv, 4000, 'sin retención usa los meses que dijo el cliente');
  assert.equal(E.calcular({ ...BASE, cac: 0 }).ltgpCac, null, 'con CAC 0 no hay razón que calcular');
  assert.equal(E.calcular({ ...BASE, cac: 0 }).caja30, 4000);
  assert.equal(E.calcular({ ...BASE, precio: 0, costo: 0 }).margenPct, null, 'precio 0 no divide');
});

t('escenarios · LTV, LTGP:CAC y caja a 30 días se calculan (no los escribe la IA)', () => {
  assert.deepEqual(E.calcular(BASE), { margen: 400, margenPct: 40, ltv: 2000, ltgpCac: 8, caja30: 1500 });
  assert.equal(E.calcular({ ...BASE, retencion: 1 }).ltv, 24000, 'la vida de un cliente se acota a 60 meses');
  assert.equal(E.vidaMeses(0.9), 10);
  assert.equal(E.calcular({ ...BASE, retencion: '80%' }).ltv, 2000, 'la retención acepta 80 y «80%»');
  assert.equal(E.calcular({ precio: 'Q1,000', costo: '600' }).margen, 400);
  assert.equal(E.calcular({ precio: '$ 1 000.50', costo: 'GTQ 600' }).margen, 400.5);
  assert.equal(E.calcular({ ...BASE, cac: 2000 }).caja30, 10 * 400 - 10 * 2000, 'la caja puede salir negativa');
});

t('escenarios · aplicar cambia solo lo que dice el escenario (valores nuevos) y correrEscenarios compara contra hoy', () => {
  assert.deepEqual(E.aplicar(BASE, { precio: 1100 }), { ...BASE, precio: 1100 });
  assert.deepEqual(E.aplicar(BASE, { precio: null, costo: 'abc', raro: 5 }), BASE, 'lo que no es número no cambia nada');
  assert.equal(E.aplicar(BASE, { retencion: 90 }).retencion, 0.9);
  assert.equal(E.aplicar(BASE, { precio: 'Q1,100' }).precio, 1100);
  // Lo que no se puede leer sin adivinar es null, no un número equivocado: «+10%» es relativo, «1.5M» perdería su escala.
  for (const raro of ['+10%', '10%', '+100', '1.5M', '1.2k', '12 clientes', 'mucho', '-5']) assert.deepEqual(E.aplicar(BASE, { precio: raro }), BASE, raro);
  assert.equal(E.aplicar({ ...BASE, retencion: null }, { retencion: '1%' }).retencion, 0.01, '1% es 0.01, no 100%');
  assert.equal(E.aplicar(BASE, { retencion: '150' }).retencion, 0.8, 'una retención de 150% no existe');
  const r = E.correrEscenarios({ base: BASE, escenarios: [{ nombre: 'Subir precio', cambios: { precio: 1100 } }, { nombre: 'Más retención', cambios: { retencion: 0.9 } }] });
  assert.deepEqual(r.base, E.calcular(BASE));
  assert.deepEqual(r.escenarios[0].resultado, { margen: 500, margenPct: 45.45, ltv: 2500, ltgpCac: 10, caja30: 2500 });
  assert.deepEqual(r.escenarios[0].delta, { margen: 100, margenPct: 5.45, ltv: 500, ltgpCac: 2, caja30: 1000 });
  assert.deepEqual(r.escenarios[1].delta, { margen: 0, margenPct: 0, ltv: 2000, ltgpCac: 8, caja30: 0 });
  const sinCac = E.correrEscenarios({ base: { ...BASE, cac: null }, escenarios: [{ nombre: 'Subir precio', cambios: { precio: 1100 } }] });
  assert.equal(sinCac.escenarios[0].delta.ltgpCac, null, 'sin CAC no hay diferencia que inventar');
  assert.equal(sinCac.escenarios[0].delta.ltv, 500);
});

t('escenarios · el cuadrante BCG: los 4 casos, los bordes y null si falta un dato', () => {
  assert.equal(E.cuadranteBCG(15, 2), 'estrella');
  assert.equal(E.cuadranteBCG(5, 2), 'vaca');
  assert.equal(E.cuadranteBCG(15, 0.4), 'interrogante');
  assert.equal(E.cuadranteBCG(5, 0.4), 'perro');
  assert.equal(E.cuadranteBCG(10, 1), 'estrella', 'el umbral cuenta como alto');
  assert.equal(E.cuadranteBCG(-3, 0.2), 'perro', 'un mercado que se encoge');
  assert.equal(E.cuadranteBCG('15%', '2'), 'estrella');
  assert.equal(E.cuadranteBCG(15, 0.4, { crecimiento: 10, participacion: 0.3 }), 'estrella', 'los umbrales se pueden cambiar');
  for (const par of [[null, 2], [15, null], [undefined, undefined], ['x', 2], [15, '']]) assert.equal(E.cuadranteBCG(...par), null, JSON.stringify(par));
  assert.deepEqual(['estrella', 'vaca', 'interrogante', 'perro', null].map(E.accionSugerida), ['empujar', 'sostener', 'revisar', 'retirar', '']);
});

const BMC_LLENO = Object.fromEntries(Object.keys(E.vacio().bmc).map((id) => [id, { texto: `Texto de ${id}`, semaforo: 'verde', nota: '' }]));
const ESC_OK = { bmc: BMC_LLENO, base: BASE, escenarios: [{ nombre: 'Subir precio', cambios: { precio: 1100 } }, { nombre: 'Bajar CAC', cambios: { cac: 200 } }] };

t('escenarios · faltas: menos de 2 escenarios, un escenario sin cambios y el BMC con menos de 9 bloques', () => {
  assert.equal(Object.keys(E.vacio().bmc).length, 9);
  assert.deepEqual(E.faltas(ESC_OK), []);
  const f = E.faltas(E.vacio());
  assert.ok(f.includes('Agrega al menos 2 escenarios (hay 0).'));
  assert.ok(f.some((x) => /^El BMC tiene 0 de 9 bloques/.test(x)));
  assert.ok(E.faltas({ ...ESC_OK, escenarios: [ESC_OK.escenarios[0]] }).some((x) => /al menos 2 escenarios \(hay 1\)/.test(x)));
  assert.ok(E.faltas({ ...ESC_OK, escenarios: [ESC_OK.escenarios[0], { nombre: 'Nada', cambios: {} }] }).some((x) => x.includes('«Nada» no cambia nada')));
  const ocho = { ...BMC_LLENO, costos: { texto: '', semaforo: '', nota: '' } };
  assert.ok(E.faltas({ ...ESC_OK, bmc: ocho }).some((x) => /8 de 9 bloques: falta Estructura de costos/.test(x)));
});

t('escenarios · el export dice SIN DATOS donde no hay dato, nunca 0', () => {
  const md = E.aMd(E.vacio());
  assert.match(md, /⚠️ SIN DATOS/);
  assert.ok(!/\| 0 \|/.test(md), 'una celda sin dato no sale en 0');
  const lleno = E.aMd({ ...ESC_OK, cartera: [{ linea: 'Café', ventas: 5000, margen: 40, crecimiento: 15, participacion: 2, accion: 'empujar' }] });
  assert.match(lleno, /\| Café \| 5,000 \| 40 \| 15 \| 2 \| Estrella \| empujar \|/);
  assert.match(lleno, /\| LTGP:CAC \| 8 \| 10 \| 10 \|/);
});

t('escenarios · sinCostos quita costo, CAC, margen de las líneas y los cambios de costo/cac; no toca el original ni lo demás', () => {
  const c = { ...E.vacio(), cartera: [{ linea: 'Tacos', ventas: 1000, margen: 62, crecimiento: 5, participacion: 1.2, accion: 'empujar' }], base: BASE,
    escenarios: [{ nombre: 'Bajar costo', cambios: { costo: 500 } }, { nombre: 'Subir precio', cambios: { precio: 1200, cac: 200 } }] };
  const copia = JSON.stringify(c), s = E.sinCostos(c);
  assert.equal(JSON.stringify(c), copia, 'no muta lo que recibe');
  assert.equal(s.base.costo, null); assert.equal(s.base.cac, null); assert.equal(s.base.precio, 1000); assert.equal(s.base.volumen, 10);
  assert.equal(s.cartera[0].margen, null); assert.equal(s.cartera[0].ventas, 1000);
  assert.deepEqual(s.escenarios.map((e) => e.cambios), [{}, { precio: 1200 }]);
  assert.ok(!/\b(500|62|250|200)\b/.test(JSON.stringify(s.base) + JSON.stringify(s.cartera) + JSON.stringify(s.escenarios)), 'ningún número de costo queda');
  assert.deepEqual(E.sinCostos(E.sinCostos(c)), s, 'es idempotente');
  assert.deepEqual(E.sinCostos(null), E.vacio());
});

t('escenarios · conCostos pone de vuelta los costos guardados y descarta los que mandó quien no los ve', () => {
  const guardado = { ...E.vacio(), cartera: [{ linea: 'Tacos', ventas: 1000, margen: 62, crecimiento: 5, participacion: 1.2, accion: 'empujar' }, { linea: 'Bebidas', ventas: 500, margen: 80, crecimiento: 3, participacion: 0.5, accion: 'revisar' }], base: BASE,
    escenarios: [{ nombre: 'Bajar costo', cambios: { costo: 500 } }, { nombre: 'Subir precio', cambios: { precio: 1200, cac: 200 } }] };
  // Lo que ve y manda quien no ve costos: precio nuevo, una línea de más, un escenario movido de lugar y números de costo inventados.
  const mandado = E.sinCostos(guardado);
  mandado.base.precio = 1100; mandado.base.costo = 1; mandado.cartera = [mandado.cartera[1], mandado.cartera[0], { linea: 'Postres', ventas: 100, margen: 99, crecimiento: null, participacion: null, accion: '' }];
  mandado.escenarios = [mandado.escenarios[1], { ...mandado.escenarios[0], cambios: { costo: 1, volumen: 12 } }];
  const r = E.conCostos(guardado, mandado);
  assert.equal(r.base.precio, 1100, 'lo demás sí se guarda'); assert.equal(r.base.costo, 600); assert.equal(r.base.cac, 250);
  assert.deepEqual(r.cartera.map((l) => [l.linea, l.margen]), [['Bebidas', 80], ['Tacos', 62], ['Postres', null]], 'las líneas se emparejan por nombre; la nueva queda sin margen');
  assert.deepEqual(r.escenarios.map((e) => [e.nombre, e.cambios]), [['Subir precio', { precio: 1200, cac: 200 }], ['Bajar costo', { costo: 500, volumen: 12 }]], 'los escenarios se emparejan por nombre');
  assert.deepEqual(E.conCostos(guardado, E.sinCostos(guardado)), E.limpiar(guardado), 'sin cambios: queda igual que lo guardado');
  // Un entregable nuevo (nada guardado): no entra ningún costo.
  const nuevo = E.conCostos(null, guardado);
  assert.equal(nuevo.base.costo, null); assert.equal(nuevo.base.cac, null); assert.ok(nuevo.cartera.every((l) => l.margen === null)); assert.deepEqual(nuevo.escenarios.map((e) => e.cambios), [{}, { precio: 1200 }]);
});

// ---------- Plan de crecimiento 90 días ----------
const OBJ = 'Reducir el CAC de Q180 a Q120 para el 31/12/2026';
const fila = (o = {}) => ({ id: 'f1', objetivo: OBJ, restriccion_ref: 'Diagnóstico: leads', sistema: 'conversion', innovacion: 'proceso', dueno: 'Marketing', primer_paso: 'Pausar los 3 anuncios con el CAC más alto', metrica: 'CAC', mes: 1, fuera_alcance: false, tipo: 'demanda', ...o });

t('blueprint · una fila completa no falta nada; sin fecha, sin dueño, sin primer paso o sin métrica, sí', () => {
  assert.deepEqual(B.faltas({ filas: [fila()] }), []);
  const sinFecha = B.faltas({ filas: [fila({ objetivo: 'Reducir el CAC de Q180 a Q120' })] });
  assert.equal(sinFecha.length, 1);
  assert.match(sinFecha[0], /^Fila 1: el objetivo no cumple la fórmula/);
  assert.match(sinFecha[0], /fecha/i);
  assert.ok(B.faltas({ filas: [fila({ objetivo: 'Mejorar el servicio' })] }).length === 1);
  assert.deepEqual(B.faltas({ filas: [fila(), fila({ id: 'f2', dueno: '' })] }), ['Fila 2: falta el dueño (un rol).']);
  assert.deepEqual(B.faltas({ filas: [fila({ primer_paso: '' })] }), ['Fila 1: falta el primer paso.']);
  assert.deepEqual(B.faltas({ filas: [fila({ metrica: '' })] }), ['Fila 1: falta la métrica.']);
  assert.deepEqual(B.faltas(B.vacio()), ['Agrega al menos una fila al plan.']);
});

t('blueprint · con la capacidad en rojo, la demanda no va antes que la capacidad', () => {
  const demandaAntes = { filas: [fila({ id: 'f1', tipo: 'demanda', mes: 1 }), fila({ id: 'f2', tipo: 'capacidad', mes: 2 })] };
  assert.deepEqual(B.faltas(demandaAntes, { capacidadRoja: true }), [B.MENSAJE_CAPACIDAD]);
  assert.equal(B.MENSAJE_CAPACIDAD, 'Con la capacidad en rojo, primero las filas de capacidad.');
  assert.deepEqual(B.faltas(demandaAntes, { capacidadRoja: false }), [], 'con la capacidad en verde no se exige');
  assert.deepEqual(B.faltas(demandaAntes), []);
  assert.deepEqual(B.faltas({ filas: [fila({ id: 'f1', tipo: 'capacidad', mes: 1 }), fila({ id: 'f2', tipo: 'demanda', mes: 2 })] }, { capacidadRoja: true }), [], 'capacidad primero: bien');
  assert.deepEqual(B.faltas({ filas: [fila({ id: 'f1', tipo: 'capacidad', mes: 2 }), fila({ id: 'f2', tipo: 'demanda', mes: 2 })] }, { capacidadRoja: true }), [], 'el mismo mes no es «antes»');
  assert.deepEqual(B.faltas({ filas: [fila({ tipo: 'demanda' })] }, { capacidadRoja: true }), [B.MENSAJE_CAPACIDAD], 'solo demanda y ninguna fila de capacidad');
  assert.deepEqual(B.faltas({ filas: [fila({ tipo: '' })] }, { capacidadRoja: true }), [], 'una fila sin tipo no es de demanda');
});

t('blueprint · tareasDe salta las fuera de alcance y las sin primer paso, y no repite ids', () => {
  const c = { filas: [fila({ id: 'f1' }), fila({ id: 'f2', fuera_alcance: true }), fila({ id: 'f3', primer_paso: '' }), fila({ id: 'f1', primer_paso: 'Otra cosa' }), fila({ id: 'f5' })] };
  const ts = B.tareasDe(c);
  assert.equal(ts.length, 3);
  assert.deepEqual(Object.keys(ts[0]).sort(), ['dept', 'due', 'fila', 'por_que', 'title']);
  assert.equal(ts[0].title, 'Pausar los 3 anuncios con el CAC más alto');
  assert.equal(ts[0].fila, 'f1');
  assert.equal(ts[0].por_que, OBJ);
  assert.equal(ts[0].due, '');
  const ids = ts.map((x) => x.fila);
  assert.equal(new Set(ids).size, ids.length, 'ninguna fila se repite');
  assert.ok(!ids.includes('f2') && !ids.includes('f3'));
  assert.deepEqual(B.tareasDe(c), ts, 'dos corridas dan lo mismo (la clave es estable)');
  assert.deepEqual(B.tareasDe(B.vacio()), []);
});

t('blueprint · aMetas: la métrica de cada fila en la forma de goals.js, con su origen y sin las fuera de alcance', () => {
  const ms = B.aMetas({ filas: [fila(), fila({ id: 'f2', fuera_alcance: true }), fila({ id: 'f3', metrica: '' })] }, { deliverable_id: 'del-9' });
  assert.equal(ms.length, 1);
  assert.equal(ms[0].titulo, 'CAC');
  assert.deepEqual({ goal: ms[0].goal, metric: ms[0].metric, baseline: ms[0].baseline, target: ms[0].target, current: ms[0].current, due: ms[0].due }, { goal: OBJ, metric: 'CAC', baseline: 'Q180', target: 'Q120', current: 'Q180', due: '2026-12-31' });
  assert.equal(ms[0].origen, 'consulting');
  assert.equal(ms[0].blueprint_ref, 'del-9');
  assert.equal(ms[0].blueprint_fila, 'f1');
  assert.deepEqual(ms[0].tasks, []); assert.deepEqual(ms[0].checks, []); assert.equal(ms[0].note, '');
  assert.equal(B.aMetas({ filas: [fila()] })[0].blueprint_ref, '', 'sin entregable, vacío');
});

t('blueprint · partesObjetivo saca de X, a Y y la fecha; lo que no entiende sale vacío', () => {
  assert.deepEqual(B.partesObjetivo('Aumentar las ventas de $1M a $1.5M para el 31/12/2027'), { de: '$1M', a: '$1.5M', fecha: '2027-12-31' });
  assert.deepEqual(B.partesObjetivo('Reducir el costo de adquisición de Q180 a Q120 antes del 15 de diciembre de 2026'), { de: 'Q180', a: 'Q120', fecha: '2026-12-15' });
  assert.deepEqual(B.partesObjetivo('Subir la conversión de 2% a 3.5% en 90 días'), { de: '2%', a: '3.5%', fecha: '' });
  assert.deepEqual(B.partesObjetivo('Mejorar el servicio'), { de: '', a: '', fecha: '' });
  assert.equal(B.partesObjetivo('Subir ventas de 10 a 20 para el 31/02/2026').fecha, '', 'una fecha que no existe no se acepta');
  assert.equal(B.partesObjetivo('Subir ventas de 10 a 20 para 2027-06-30').fecha, '2027-06-30');
});

t('blueprint · limpiar quita llaves desconocidas, id, v y _meta, normaliza y deja el HTML como texto', () => {
  const sucio = { id: 'x', v: 3, _meta: { a: 1 }, secreto: 'SECRETO', horizontes: { h12: 'a', h35: 'b', otro: 'SECRETO' }, filas: [
    { id: 'A B!', _meta: {}, v: 2, secreto: 'SECRETO', objetivo: '<b>Aumentar</b>', sistema: 'Conversion OS', innovacion: 'Modelo de negocio', dueno: 'COO', primer_paso: 'x', metrica: 'y', mes: 'mes 2', fuera_alcance: 'sí', tipo: 'Capacidad' },
    { id: 'a-b', objetivo: 'z', mes: 9, sistema: 'raro', tipo: 'otro' }, 'basura', null, 7] };
  const c = B.limpiar(sucio);
  assert.deepEqual(Object.keys(c), ['horizontes', 'filas']);
  assert.ok(!JSON.stringify(c).includes('SECRETO'));
  assert.equal(c.filas.length, 2);
  assert.deepEqual(Object.keys(c.filas[0]).sort(), Object.keys(B.filaVacia()).sort());
  assert.deepEqual({ ...c.filas[0] }, { id: 'a-b', objetivo: '<b>Aumentar</b>', restriccion_ref: '', sistema: 'conversion', innovacion: 'modelo', dueno: 'COO', primer_paso: 'x', metrica: 'y', mes: 2, fuera_alcance: true, tipo: 'capacidad' });
  assert.deepEqual([c.filas[1].id, c.filas[1].mes, c.filas[1].sistema, c.filas[1].tipo], ['f1', 3, '', ''], 'un id repetido recibe uno nuevo');
  assert.deepEqual(B.limpiar(c), c, 'limpiar es idempotente');
  assert.equal(B.limpiar({ filas: Array.from({ length: 20 }, (_, i) => ({ objetivo: `o${i}` })) }).filas.length, B.MAX_FILAS);
  for (const x of [null, undefined, 'texto', 7, []]) assert.deepEqual(B.limpiar(x), B.vacio());
  assert.equal(B.filaVacia([{ id: 'f1' }, { id: 'f2' }]).id, 'f3');
});

t('blueprint · el export lleva los 3 meses y marca lo que falta', () => {
  const md = B.aMd({ horizontes: { h12: 'Duplicar ventas', h35: '' }, filas: [fila(), fila({ id: 'f2', mes: 3, dueno: '', fuera_alcance: true })] });
  assert.match(md, /## Mes 1[\s\S]*## Mes 2[\s\S]*Sin filas este mes\.[\s\S]*## Mes 3/);
  assert.match(md, /A 1-2 años: Duplicar ventas/);
  assert.match(md, /Dueño \(rol\): ⚠️ SIN DATOS/);
  assert.match(md, /FUERA DEL ALCANCE/);
});

// ---------- Impact Tracker ----------
const COMPLETO = { leads: 100, conversion: 0.1, ticket: 500, frecuencia: 2, retencion: 0.8 };

t('impacto · la ecuación es null si falta un factor (un cero sin medir no cuenta) y se calcula si están todos', () => {
  assert.deepEqual(ECUACION, ['leads', 'conversion', 'ticket', 'frecuencia', 'retencion']);
  assert.equal(I.ecuacion(COMPLETO), 8000);
  for (const f of ECUACION) assert.equal(I.ecuacion({ ...COMPLETO, [f]: null }), null, `sin ${f}`);
  assert.equal(I.ecuacion({}), null);
  assert.equal(I.ecuacion(), null);
  assert.equal(I.ecuacion({ ...COMPLETO, conversion: '10%', retencion: 80 }), 8000, 'las tasas aceptan 10 y «10%»');
  assert.equal(I.ecuacion({ ...COMPLETO, leads: 0 }), 0, 'un 0 medido sí cuenta');
});

t('impacto · el avance va de antes a la meta (0-100) y es null si falta un dato', () => {
  const antes = COMPLETO, ahora = { ...COMPLETO, leads: 150 }, meta = { ...COMPLETO, leads: 200 };
  assert.equal(I.avance(antes, ahora, meta), 50);
  assert.equal(I.avance(antes, antes, meta), 0);
  assert.equal(I.avance(antes, { ...COMPLETO, leads: 400 }, meta), 100, 'se acota a 100 como goals.js');
  assert.equal(I.avance(antes, { ...COMPLETO, leads: 50 }, meta), 0, 'y a 0');
  assert.equal(I.avance(antes, { ...ahora, ticket: null }, meta), null);
  assert.equal(I.avance(antes, ahora, antes), null, 'meta igual al punto de partida');
  assert.equal(I.avance(10, 15, 20), 50, 'también con números ya listos');
  assert.equal(I.avance(null, 15, 20), null);
  const pf = I.avancePorFactor(antes, ahora, meta);
  assert.equal(pf.leads, 50);
  assert.equal(pf.ticket, null, 'un factor que no cambió ni debe cambiar no tiene avance');
  assert.deepEqual(Object.keys(pf), ECUACION);
  assert.equal(I.avancePorFactor(antes, { ...ahora, leads: null }, meta).leads, null);
});

const IMPACTO_SUCIO = { id: 'x', v: 4, _meta: { z: 1 }, nota_interna: 'SECRETO', antes: { ...COMPLETO, secreto: 'SECRETO' }, ahora: { leads: 'abc', conversion: '12%', ticket: 'Q1,200', frecuencia: 2, retencion: 85 }, meta: COMPLETO,
  metas: [{ titulo: 'CAC', valor: 120, actual: '150', fecha: '2026-12-31', nota: 'SECRETO' }, { titulo: '<i>x</i>', fecha: '2026-13-45' }, 'basura'], horas_ahorradas: '40', delta_margen: -5,
  reporte: 'Este mes bajó el CAC.\nEl margen subió 6 puntos.\n\n\n\nLos márgenes mejoraron.\nSe ahorraron 40 horas de trabajo.\nRespondemos en menos de 2 horas.\nSeguimos con el plan.\nNota interna: el costo del equipo fue alto.' };

t('impacto · versionCliente no trae horas, margen ni notas internas', () => {
  const v = I.versionCliente({ ...IMPACTO_SUCIO, horas_ahorradas: 37, delta_margen: 12.5 });
  assert.deepEqual(Object.keys(v).sort(), ['ahora', 'antes', 'meta', 'metas', 'reporte']);
  assert.ok(!('horas_ahorradas' in v) && !('delta_margen' in v));
  const s = JSON.stringify(v);
  assert.ok(!s.includes('SECRETO') && !s.includes('37') && !s.includes('12.5'));
  assert.equal(v.reporte, 'Este mes bajó el CAC.\n\nRespondemos en menos de 2 horas.\nSeguimos con el plan.', 'las líneas de margen (con o sin acento), horas ahorradas, costos y notas internas no salen; un plazo de respuesta sí');
  assert.deepEqual(Object.keys(v.metas[0]), ['titulo', 'valor', 'actual', 'fecha']);
  assert.deepEqual(I.versionCliente(I.vacio()).antes, I.vacio().antes);
  const md = I.aMdCliente({ ...IMPACTO_SUCIO, horas_ahorradas: 37 });
  assert.ok(!/Horas ahorradas|Delta de margen|SECRETO/.test(md));
  assert.match(I.aMd({ ...IMPACTO_SUCIO, horas_ahorradas: 37 }), /Horas ahorradas: 37/, 'la versión interna sí las trae');
});

t('impacto · limpiar quita llaves desconocidas, id, v y _meta, y lee lo que se parece a un número', () => {
  const c = I.limpiar(IMPACTO_SUCIO);
  assert.deepEqual(Object.keys(c), Object.keys(I.vacio()));
  assert.ok(!JSON.stringify(c).includes('SECRETO'));
  assert.deepEqual(Object.keys(c.antes), ECUACION);
  assert.deepEqual(c.ahora, { leads: null, conversion: 0.12, ticket: 1200, frecuencia: 2, retencion: 0.85 });
  assert.equal(c.metas.length, 2);
  assert.deepEqual(c.metas[0], { titulo: 'CAC', valor: 120, actual: 150, fecha: '2026-12-31' });
  assert.deepEqual(c.metas[1], { titulo: '<i>x</i>', valor: null, actual: null, fecha: '' });
  assert.equal(c.horas_ahorradas, 40);
  assert.equal(c.delta_margen, -5);
  assert.equal(I.limpiar({ horas_ahorradas: '40 h' }).horas_ahorradas, null, 'una unidad pegada no se adivina');
  assert.equal(I.limpiar({ ahora: { leads: '+20%', ticket: '1.5M', conversion: '1%' } }).ahora.leads, null, 'un cambio relativo no es un valor');
  assert.deepEqual([I.limpiar({ ahora: { ticket: '1.5M', conversion: '1%' } }).ahora.ticket, I.limpiar({ ahora: { conversion: '1%' } }).ahora.conversion], [null, 0.01]);
  assert.equal(I.limpiar({ delta_margen: 500 }).delta_margen, null);
  assert.match(c.reporte, /^Este mes bajó el CAC\.\nEl margen subió 6 puntos\.\n\nLos márgenes/, 'el reporte conserva sus párrafos (y junta los saltos de más)');
  assert.deepEqual(I.limpiar(c), c, 'limpiar es idempotente');
  for (const x of [null, undefined, 'texto', 7, []]) assert.deepEqual(I.limpiar(x), I.vacio());
  assert.ok(Object.values(I.vacio().antes).every((v) => v === null), 'vacío es null, no 0');
});

t('impacto · el reporte vacío es la única falta; el export dice SIN DATOS donde no hay dato', () => {
  assert.equal(I.faltas(I.vacio()).length, 1);
  assert.match(I.faltas(I.vacio())[0], /reporte/i);
  assert.equal(I.faltas({ reporte: '   ' }).length, 1);
  assert.deepEqual(I.faltas({ reporte: 'Bajó el CAC.' }), []);
  const md = I.aMd(I.vacio());
  assert.match(md, /⚠️ SIN DATOS/);
  assert.ok(!/\| 0 \|/.test(md));
  assert.match(I.aMd({ antes: COMPLETO, ahora: { ...COMPLETO, leads: 150 }, meta: { ...COMPLETO, leads: 200 } }), /\| Leads \| 100 \| 150 \| 200 \| 50% \|/);
});

// ---------- Lo que comparten los 3 ----------
const MODULOS = [['escenarios', E, ESC_OK], ['blueprint', B, { filas: [fila()] }], ['impacto', I, { antes: COMPLETO, reporte: 'Bajó el CAC.' }]];
const CTX = { hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'AKAI', nivel: { id: 'partnership', nombre: 'Growth Partnership' } },
  ficha: { incluye: [{ k: 'Consulting', v: 'Money OS' }, { k: 'Operations', v: 'SOPs de las áreas contratadas' }], fuera: 'Producción de video' },
  estrategia: { etapa: { n: 3, confirmada: true }, trabado: 'capacidad', meta: 'Facturar Q120K al mes' },
  entradas: [{ tool: 'business-health-assessment', titulo: 'Diagnóstico de octubre', version: 2, contenido: { restriccion: 'ventas' } }], aprendizajes: ['El seguimiento por WhatsApp subió el cierre de 20% a 28%'] };
const CTX_GRANDE = { ...CTX, ficha: { incluye: Array.from({ length: 30 }, (_, i) => ({ k: `Área ${i}`, v: 'x'.repeat(200) })), fuera: 'y'.repeat(900) }, estrategia: { ...CTX.estrategia, meta: 'z'.repeat(900) },
  entradas: Array.from({ length: 5 }, (_, i) => ({ tool: `tool-${i}`, titulo: 'w'.repeat(300), version: i + 1, contenido: { texto: 'q'.repeat(5000) } })), aprendizajes: Array.from({ length: 9 }, () => 'a'.repeat(400)) };

t('los 3 · el prompt pide su bloque y los criterios, mide menos de 5 000 y no usa 06-ECONOMIA como fuente', () => {
  for (const [n, m] of MODULOS) {
    assert.equal(m.BLOQUE, n);
    for (const [k, c] of [['con contexto', CTX], ['sin contexto', {}], ['contexto enorme', CTX_GRANDE], ['sin argumentos', undefined]]) {
      const p = m.prompt(c);
      assert.ok(p.includes(`\`\`\`${m.BLOQUE}\n`), `${n} (${k}) pide su bloque`);
      assert.ok(p.includes('```criterios\n'), `${n} (${k}) pide los criterios`);
      assert.ok(p.length < 5000, `${n} (${k}) mide ${p.length}`);
      assert.ok(p.includes('Evidencia o etiqueta') && p.includes('SIN DATOS'), `${n} lleva las reglas comunes`);
      assert.ok(!p.replace(reglasPrompt(c || {}), '').includes('06-ECONOMIA'), `${n}: lo propio no nombra 06-ECONOMIA`);
      for (const l of p.split('\n').filter((x) => x.includes('06-ECONOMIA'))) assert.match(l, /Nunca/, `${n}: 06-ECONOMIA solo como prohibición`);
    }
    assert.ok(m.prompt(CTX).includes('AKAI') && m.prompt(CTX).includes('Growth Partnership'), `${n} lleva el cliente`);
  }
  assert.ok(Array.isArray(E.SEMILLAS) && E.SEMILLAS.length === 5 && [B, I].every((m) => m.SEMILLAS.length >= 1));
});

t('escenarios · el prompt manda el cambio de precio a Strategy, recomienda el modo privado y cita rutas que existen', () => {
  const p = E.prompt(CTX);
  assert.match(p, /se manda a Strategy \(Offer Architect\)/);
  assert.match(p, /modo privado/);
  assert.match(p, /100m-money-models/);
  assert.match(p, /LTV, LTGP:CAC ni caja/, 'le dice a la IA que no calcule');
  const base = join(RAIZ, 'agents/01-strategy/brain/skills/hormozi-brain/references/books');
  if (!existsSync(base)) return console.log('  (omitida la revisión de rutas: no hay agents/ en esta copia)');
  const completas = [...p.matchAll(/agents\/[\w./-]+\.md/g)].map((x) => x[0]);
  assert.ok(completas.length >= 2);
  for (const r of completas) assert.ok(existsSync(join(RAIZ, r)), r);
  const carpetas = [...new Set(completas.map((r) => dirname(join(RAIZ, r))))];
  for (const corto of [...p.matchAll(/(?<![\w/])(\d{2}-[a-z0-9-]+\.md)/g)].map((x) => x[1])) assert.ok(carpetas.some((d) => readdirSync(d).includes(corto)), corto);
});

t('los 3 · leer() lee un bloque bueno, ignora uno a medias y da null con basura', () => {
  const CRIT = bloque('criterios', { entregable: 'X', cumple: ['Tiene el dato'], falta: ['El CAC'] });
  for (const [n, m, c] of MODULOS) {
    const r = m.leer(`Aquí va lo que encontré.\n${bloque(m.BLOQUE, c)}\n${CRIT}`);
    assert.deepEqual(r.contenido, m.limpiar(c), `${n}: el contenido sale limpio`);
    assert.deepEqual(r.criterios, { cumple: ['Tiene el dato'], falta: ['El CAC'] });
    assert.deepEqual(m.leer(bloque(m.BLOQUE, c)).criterios, { cumple: [], falta: [] }, `${n}: sin criterios salen vacíos`);
    const aMedias = `Voy en esto:\n\`\`\`${m.BLOQUE}\n${JSON.stringify(c).slice(0, 25)}`;
    assert.equal(m.leer(aMedias), null, `${n}: bloque a medias`);
    assert.equal(m.leer(`${aMedias}\n${CRIT}`), null, `${n}: a medias y luego los criterios`);
    assert.ok(m.leer(`${aMedias}\n\`\`\`\n${bloque(m.BLOQUE, c)}`), `${n}: un bloque malo no tapa uno bueno`);
    for (const basura of ['hola', '', null, undefined, 42, bloque(m.BLOQUE, 'no es json'), bloque(m.BLOQUE, '[1,2]'), bloque(m.BLOQUE, '{"foo":1}'), bloque(m.BLOQUE, '{}'), bloque('otro', c), CRIT]) assert.equal(m.leer(basura), null, `${n}: ${String(basura).slice(0, 30)}`);
  }
});

t('los 3 · limpiar quita llaves desconocidas, id, v y _meta, y deja el HTML como texto', () => {
  for (const [n, m, c] of MODULOS) {
    const sucio = { ...c, id: 'doc-1', v: 7, _meta: { por: 'x' }, estado: 'Aprobado', aprobado: { por: 'x' }, historial: [1], secreto: 'SECRETO', ...(n === 'impacto' ? { reporte: '<script>alert(1)</script>Bajó el CAC.' } : {}) };
    const limpio = m.limpiar(sucio);
    assert.deepEqual(Object.keys(limpio), Object.keys(m.vacio()), `${n}: solo las llaves del contenido`);
    for (const k of ['id', 'v', '_meta', 'estado', 'aprobado', 'historial', 'secreto']) assert.ok(!(k in limpio), `${n}: sin ${k}`);
    assert.ok(!JSON.stringify(limpio).includes('SECRETO'));
    assert.deepEqual(m.limpiar(limpio), limpio, `${n}: idempotente`);
    for (const x of [null, undefined, 'texto', 7, [], { id: 'x' }]) assert.deepEqual(m.limpiar(x), m.vacio(), `${n}: ${JSON.stringify(x)} da el contenido vacío`);
    assert.equal(typeof m.aMd(c), 'string');
    assert.ok(m.aMd(m.vacio()).startsWith('# '), `${n}: el export empieza con su título`);
  }
  assert.equal(I.limpiar({ reporte: '<script>alert(1)</script>Bajó el CAC.' }).reporte, '<script>alert(1)</script>Bajó el CAC.', 'el HTML queda como texto: html`…` lo escapa al pintar');
});

t('los 3 · son puros: solo importan marcos.js, sin DOM, red, economía ni rutas del OS', () => {
  for (const n of ['escenarios', 'blueprint', 'impacto']) {
    const src = readFileSync(join(AQUI, '..', 'public/js/consulting', `${n}.js`), 'utf8');
    assert.deepEqual([...src.matchAll(/^import .* from '(.+)';/gm)].map((x) => x[1]), ['./marcos.js'], `${n}: sus imports`);
    assert.ok(!/\b(document|window|localStorage|fetch|XMLHttpRequest)\b/.test(src), `${n}: sin DOM ni red`);
    assert.ok(!/api\/repo\/economia|cost_recipes|\brates\b|06-ECONOMIA/.test(src), `${n}: no toca la economía de Inherent`);
    assert.ok(!/raw\(|innerHTML/.test(src), `${n}: no arma HTML`);
  }
});

console.log(`\n${ok} pruebas de Consulting (dinero y metas) pasaron`);
