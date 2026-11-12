// Pruebas de las herramientas de Strategy (public/js/strategy): los módulos puros de Customer Bullseye (diana), Business X-Ray (xray),
// Offer Architect (oferta) y Growth Roadmap Builder (roadmap): su contenido, limpiar(), faltas(), prompt, leer(), aMd y lo que cada uno
// le entrega a otra parte (la diana a cleanBullseye, el X-Ray y el roadmap a limpiarParche, las tareas a tareaDeEncargo).
// node scripts/test-strategy.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as diana from '../public/js/strategy/diana.js';
import * as xray from '../public/js/strategy/xray.js';
import * as oferta from '../public/js/strategy/oferta.js';
import * as roadmap from '../public/js/strategy/roadmap.js';
import { ANGULOS } from '../public/js/avatares.js';
import { limpiarParche } from '../public/js/estrategia-viva.js';
import { tareaDeEncargo } from '../public/js/llm/modos.js';
import { cleanBullseye } from '../api/_lib/content.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const RAIZ = fileURLToPath(new URL('../../', import.meta.url)); // la raíz del repo (Inherent-HQ)
const AQUI = fileURLToPath(new URL('../', import.meta.url));    // ceo-os
const F = '```';
const MODULOS = [['diana', diana, 'bullseye'], ['xray', xray, 'xray'], ['oferta', oferta, 'oferta'], ['roadmap', roadmap, 'estrategia']];
const llaves = (x, acc = new Set()) => { if (Array.isArray(x)) x.forEach((y) => llaves(y, acc)); else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { acc.add(k); llaves(v, acc); } return acc; };

// ---------- fixtures ----------
const CTX = { hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'AKAI', nivel: { id: 'partnership', nombre: 'Growth Partnership' } }, ficha: { incluye: [{ k: 'Áreas', v: '10 · Operación' }], fuera: 'nómina' },
  estrategia: { etapa: { n: 3, confirmada: true }, trabado: 'capacidad', meta: 'Vender 1.5M al año' }, entradas: [], aprendizajes: ['El seguimiento subió las ventas 12%'] };
const conNivel = (id, nombre) => ({ ...CTX, cliente: { ...CTX.cliente, nivel: { id, nombre } } });
const GRANDE = { hoy: '2026-10-27', cliente: { slug: 'x', nombre: 'N'.repeat(500), nivel: { id: 'partnership', nombre: 'P'.repeat(300) } },
  ficha: { incluye: Array.from({ length: 40 }, (_, i) => ({ k: `Clave ${i}`.padEnd(80, 'k'), v: 'v'.repeat(200) })), fuera: 'f'.repeat(3000) },
  estrategia: { etapa: { n: 9, confirmada: false }, trabado: 'oferta', meta: 'm'.repeat(1000) }, aprendizajes: Array.from({ length: 20 }, () => 'a'.repeat(500)),
  entradas: [{ tool: 'business-xray', titulo: 'T'.repeat(300), version: 2, contenido: { conclusion: 'c'.repeat(900), salud: [] } }, { tool: 'customer-bullseye', titulo: 'x', version: 1, contenido: { center: 'c'.repeat(900) } },
    { tool: 'offer-architect', titulo: 'x', version: 1, contenido: { propuesta: 'p'.repeat(900) } }, { tool: 'opportunity-map', titulo: 'x', version: 1, contenido: { items: Array.from({ length: 30 }, (_, i) => ({ id: `o${i}`.padEnd(60, 'o'), titulo: 't'.repeat(200) })) } }],
  marca: { pilares: Array.from({ length: 30 }, () => 'p'.repeat(100)), referentes: Array.from({ length: 30 }, () => '@r'.repeat(50)), competencia: Array.from({ length: 30 }, () => '@c'.repeat(50)) },
  diana: { center: 'c'.repeat(900), rings: Array.from({ length: 5 }, () => ({ label: 'l'.repeat(500) })) },
  intel: { comprension: 'x'.repeat(5000), nucleo: 'y'.repeat(5000) }, library: Array.from({ length: 10 }, () => ({ titulo: 'L'.repeat(200) })), investigacion: Array.from({ length: 10 }, () => 'i'.repeat(200)) };
const CTXS = [['vacío', {}], ['sin argumento', undefined], ['normal', CTX], ['growth', conNivel('growth', 'Brand Growth')], ['foundation', conNivel('foundation', 'Brand Foundation')], ['a la medida', conNivel('medida', 'A la medida')], ['enorme', GRANDE]];

const dianaCompleta = () => ({
  center: 'Dueños de restaurante con 1 local que quieren abrir el segundo y batallan con la caja', buyer: '',
  rings: [
    { label: 'Dueños de restaurante con 1 local', relaxed: '', size: 'miles', conversion: 'alta', competition: 'casi vacía', search: ['dueño de restaurante', 'abrir segundo local'] },
    { label: 'Dueños de restaurante', relaxed: 'el número de locales', size: 'decenas de miles', conversion: 'media-alta', competition: 'media', search: ['restaurantero'] },
    { label: 'Dueños de negocios de comida', relaxed: 'el tipo de comida', size: 'cientos de miles', conversion: 'media', competition: 'media', search: ['emprender comida'] },
    { label: 'Dueños de negocios con local', relaxed: 'la industria', size: 'millones', conversion: 'baja', competition: 'llena', search: ['negocio con local'] },
    { label: 'Emprendedores', relaxed: 'el modelo', size: 'millones', conversion: 'baja', competition: 'llena', search: ['emprender'] },
  ],
  mix: [{ topic: 'Cómo saber si tu caja aguanta un segundo local' }, { topic: 'El error del primer mes' }, { topic: 'Cuánto vender antes de abrir' }, { topic: 'Dueños de restaurante: personal' }, { topic: 'Negocios de comida: proveedores' }],
  calib: [{ lote: 'Lote 1', c0: 5, c1: 2, c2: 1, decision: 'Seguir' }], at: '2026-10-27T10:00:00.000Z',
  mensajes: ANGULOS.slice(0, 5).map((angulo, anillo) => ({ anillo, mensaje: `Mensaje del anillo ${anillo}`, angulo })),
});
const xrayCompleto = () => ({
  salud: xray.EJES.map((e, i) => ({ eje: e.id, estado: i % 2 ? 'riesgo' : 'ok', evidencia: `Dato visto de ${e.nombre}`, fuente: '[dice el cliente, sin verificar]' })),
  conclusion: 'Vende bien pero no aguanta más pedidos', trabado: 'capacidad', porque: 'Una sola persona entrega todo', etapa_ref: { n: 3, confirmada: false },
});
const ecuacionLlena = () => ({ sueno: { valor: 8, evidencia: 'Lo pide en cada DM' }, probabilidad: { valor: 6, evidencia: 'Tiene casos' }, tiempo: { valor: 4, evidencia: 'Ve cambios en 30 días' }, esfuerzo: { valor: 5, evidencia: 'Requiere 2 horas al día' } });
const ofertaCompleta = () => ({
  ecuacion: ecuacionLlena(),
  stack: { problemas: ['No sabe cuánto gana'], soluciones: ['Tablero semanal'], vehiculos: ['Sesión en vivo'], bonos: ['Plantilla de costos'], garantia: 'Si no ves tus números en 30 días, seguimos gratis', escasez: '5 lugares al mes', nombre: 'Caja Clara' },
  propuesta: 'Sabes cuánto ganas cada semana, sin hojas de cálculo.',
  variaciones: [{ nombre: 'Esencial', precio: 'Q1,500 al mes', para_quien: '1 local', diferencia: 'Tablero + 1 sesión' }, { nombre: 'Completa', precio: 'Q3,000 al mes', para_quien: '2 locales', diferencia: 'Tablero + 4 sesiones' }],
  escalera: { atraccion: { hoy: 'Ninguna', propuesta: 'Diagnóstico gratis', cita: 'No está en el material' }, upsell: tramoV(), downsell: tramoV(), continuidad: tramoV() },
  empujar: { oferta: 'Esencial', mensaje: 'Empieza por saber cuánto ganas' },
});
function tramoV() { return { hoy: 'Nada', propuesta: 'Algo', cita: '[$100M MONEY MODELS | x | pág. PDF 1]' }; }
const itemsBuenos = () => [
  { id: 'r1', oportunidad_id: 'o1', area: 'marketing', trimestre: 'T1', titulo: 'Subir el alcance orgánico', tareas: [{ title: 'Definir 3 pilares', due: '2026-11-15' }, { title: 'Calendario del mes', due: '' }] },
  { id: 'r2', oportunidad_id: '', area: 'creative', trimestre: 'T1', titulo: 'Sistema de plantillas', tareas: [] },
  { id: 'r3', oportunidad_id: '', area: 'production', trimestre: 'T2', titulo: 'Banco de tomas', tareas: [{ title: 'Grabar el día 1', due: '2026-12-02' }] },
  { id: 'r4', oportunidad_id: '', area: 'consulting', trimestre: 'T3', titulo: 'Procesos de entrega', tareas: [] },
];
const hitosBuenos = () => [{ id: 'h1', titulo: 'Primer cliente nuevo', fecha: '2026-12-31', meta: '3 clientes' }, { id: 'h2', titulo: 'Plan aprobado', fecha: '', meta: '' }];
const COMPLETO = { diana: dianaCompleta, xray: xrayCompleto, oferta: ofertaCompleta, roadmap: () => ({ items: itemsBuenos(), hitos: hitosBuenos() }) };

// ============ Customer Bullseye ============
t('diana: los anillos (Centro=ICP · 1 Prioritario · 2 Secundario · 3 y 4 Baja prioridad) con id y nombre', () => {
  assert.deepEqual(diana.ANILLOS.map((a) => a.id), [0, 1, 2, 3, 4]);
  assert.match(diana.ANILLOS[0].nombre, /ICP/); assert.match(diana.ANILLOS[1].nombre, /Prioritario/); assert.match(diana.ANILLOS[2].nombre, /Secundario/);
  assert.match(diana.ANILLOS[3].nombre, /Baja prioridad/); assert.match(diana.ANILLOS[4].nombre, /Baja prioridad/);
  assert.ok(diana.ANILLOS.every((a) => a.nombre && a.que));
  assert.equal(diana.BLOQUE, 'bullseye');
});

t('diana limpiar: deja la forma que acepta cleanBullseye, más los mensajes', () => {
  const sucio = dianaCompleta();
  sucio.rings[0].label = `  ${'L'.repeat(300)}  `; sucio.rings[1].search = 'uno, dos,\n tres, cuatro, cinco, seis'; sucio.rings[2].size = 'a\n\n b\tc';
  sucio.calib = Array.from({ length: 15 }, (_, i) => ({ lote: `Lote ${i + 1}`, c0: i === 14 ? 99999 : i, c1: -5, c2: 'x', decision: 'd'.repeat(300) }));
  sucio.mix.push({ topic: 'sobra' }); sucio.rings.push({ label: 'sexto anillo' });
  const c = diana.limpiar(sucio), { mensajes, ...base } = c;
  assert.deepEqual(cleanBullseye(c), base, 'cleanBullseye no cambia nada de lo que dejó limpiar (con `at`)');
  assert.equal(c.rings.length, 5); assert.equal(c.mix.length, 5); assert.deepEqual(c.mix.map((m) => m.ring), [0, 0, 0, 1, 2]);
  assert.equal(c.rings[0].label.length, 160); assert.deepEqual(c.rings[1].search, ['uno', 'dos', 'tres', 'cuatro']); assert.equal(c.rings[2].size, 'a b c');
  assert.equal(c.calib.length, 12); assert.equal(c.calib[0].lote, 'Lote 4'); assert.equal(c.calib[11].c0, 9999); assert.equal(c.calib[11].c1, 0); assert.equal(c.calib[11].c2, 0); assert.equal(c.calib[0].decision.length, 200);
  assert.equal(mensajes.length, 5);
  // Sin `at` limpiar no inventa la hora (no hay reloj): cleanBullseye sí la pone.
  const sinAt = diana.limpiar({ ...dianaCompleta(), at: undefined }), { mensajes: _m, at: _a, ...resto } = sinAt, { at: _b, ...deClean } = cleanBullseye(sinAt);
  assert.equal(sinAt.at, ''); assert.deepEqual(deClean, resto);
  // Los límites de cada campo son los de cleanBullseye.
  const largo = diana.limpiar({ center: 'c'.repeat(900), buyer: 'b'.repeat(900), rings: [{ label: 'l'.repeat(900), relaxed: 'r'.repeat(900), size: 's'.repeat(900), conversion: 'v'.repeat(900), competition: 'k'.repeat(900), search: ['q'.repeat(900)] }] });
  assert.deepEqual([largo.center.length, largo.buyer.length, largo.rings[0].label.length, largo.rings[0].relaxed.length, largo.rings[0].size.length, largo.rings[0].conversion.length, largo.rings[0].competition.length, largo.rings[0].search[0].length], [400, 300, 160, 120, 120, 120, 120, 60]);
  assert.deepEqual(diana.limpiar(c), c, 'limpiar es idempotente');
});

t('diana limpiar: cada mensaje lleva un ángulo de ANGULOS (o vacío), uno por anillo y en orden', () => {
  const m = diana.limpiarMensajes([
    { anillo: 2, mensaje: 'Dos', angulo: 'objecion rota' }, { anillo: 0, mensaje: 'Cero', angulo: 'DOLOR' }, { anillo: '3', mensaje: 'Tres', angulo: 'inventado' },
    { anillo: 2, mensaje: 'Otro dos', angulo: 'Deseo' }, { anillo: 7, mensaje: 'Fuera', angulo: 'Dolor' }, { anillo: 1, mensaje: '', angulo: 'Dolor' }, { anillo: 'centro', mensaje: 'Centro repetido', angulo: 'Dolor' }, 'basura', null,
  ]);
  assert.deepEqual(m, [{ anillo: 0, mensaje: 'Cero', angulo: 'Dolor' }, { anillo: 2, mensaje: 'Dos', angulo: 'Objeción rota' }, { anillo: 3, mensaje: 'Tres', angulo: '' }]);
  for (const x of diana.limpiar(dianaCompleta()).mensajes) assert.ok(ANGULOS.includes(x.angulo), x.angulo);
  assert.equal(diana.limpiarMensajes('no es lista').length, 0); assert.equal(diana.limpiarMensajes([{ anillo: 0, mensaje: 'x'.repeat(900), angulo: 'Dolor' }])[0].mensaje.length, 300);
  assert.equal(diana.anguloDe('momento de vida'), 'Momento de vida'); assert.equal(diana.anguloDe('mecanismo unico'), 'Mecanismo único'); assert.equal(diana.anguloDe('x'), '');
});

t('diana faltas: centro, 5 niveles, lo que suelta cada anillo, y un mensaje con ángulo por anillo', () => {
  assert.deepEqual(diana.faltas(dianaCompleta()), []);
  const v = diana.faltas(diana.vacio()); assert.ok(v.some((x) => /centro \(el ICP\)/.test(x)) && v.some((x) => /Anillo 4/.test(x)), v.join(' | '));
  const c = dianaCompleta(); c.mensajes = c.mensajes.filter((m) => m.anillo !== 2); c.mensajes[0].angulo = 'inventado'; c.rings[3].relaxed = ''; c.center = '';
  const f = diana.faltas(c);
  assert.ok(f.some((x) => /Anillo 2 · Secundario no tiene mensaje/.test(x)), f.join(' | '));
  assert.ok(f.some((x) => /Centro · ICP no tiene un ángulo válido/.test(x)), f.join(' | '));
  assert.ok(f.some((x) => /Anillo 3 · Baja prioridad no dice qué restricción suelta/.test(x))); assert.ok(f.some((x) => /centro en una frase/.test(x)));
  assert.equal(diana.faltas(null).length, diana.faltas(diana.vacio()).length);
});

t('diana: conLotes conserva los lotes de calibración y audienciaDe es la de saveBx', () => {
  const actual = dianaCompleta(), nuevo = { ...dianaCompleta(), calib: [] };
  assert.equal(diana.conLotes(nuevo, actual).calib.length, 1); assert.equal(diana.conLotes(nuevo, null).calib.length, 0); assert.equal(diana.conLotes('x', actual).calib.length, 1);
  const a = diana.audienciaDe(actual); assert.deepEqual(a, { exacto: actual.center, nicho: actual.rings[1].label, general: actual.rings[3].label });
  assert.equal(diana.audienciaDe({ rings: [{ label: 'Solo el anillo' }] }).exacto, 'Solo el anillo');
});

// ============ Business X-Ray ============
t('xray: los 6 ejes, con nombre y de dónde sale el dato', () => {
  assert.deepEqual(xray.EJES.map((e) => e.id), ['oferta', 'modelo', 'leads', 'conversion', 'capacidad', 'marca']);
  assert.deepEqual(xray.EJES.map((e) => e.nombre), ['Oferta', 'Modelo de dinero', 'Leads/demanda', 'Conversión', 'Capacidad', 'Marca/atención']);
  assert.ok(xray.EJES.every((e) => e.mide && e.sale_de)); assert.equal(xray.BLOQUE, 'xray');
  assert.deepEqual(xray.vacio().salud.map((s) => s.estado), Array(6).fill('falta'));
});

t('xray limpiar: ejes por id o por nombre, sin repetir y en orden; el estado no se asume; la etapa es 0-9', () => {
  const c = xray.limpiar({ salud: [
    { eje: 'Marca/atención', estado: 'En riesgo', evidencia: 'e', fuente: 'f' }, { eje: 'LEADS/DEMANDA', estado: 'ok', evidencia: 'e2' }, { eje: 'oferta', estado: 'rojo' },
    { eje: 'oferta', estado: 'ok', evidencia: 'repetida' }, { eje: 'inventado', estado: 'ok' }, 'basura', { eje: 'Modelo de dinero', estado: 'quién sabe' }],
    conclusion: 'c', trabado: 'Modelo de dinero', porque: 'p', etapa_ref: { n: '3', confirmada: 'sí' } });
  assert.deepEqual(c.salud.map((s) => [s.eje, s.estado]), [['oferta', 'riesgo'], ['modelo', 'falta'], ['leads', 'ok'], ['marca', 'riesgo']]);
  assert.equal(c.salud[0].evidencia, '', 'el primero gana, aunque venga vacío'); assert.equal(c.trabado, 'modelo'); assert.deepEqual(c.etapa_ref, { n: 3, confirmada: true });
  assert.equal(xray.limpiar({ trabado: 'conversion' }).trabado, '', 'solo oferta, modelo, leads o capacidad'); assert.equal(xray.limpiar({ etapa_ref: { n: 12 } }).etapa_ref, null); assert.equal(xray.limpiar({ etapa_ref: { confirmada: true } }).etapa_ref, null);
  assert.equal(xray.limpiar({ salud: [{ eje: 'oferta', evidencia: 'x'.repeat(900), fuente: 'y'.repeat(900) }], conclusion: 'c'.repeat(900), porque: 'p'.repeat(900) }).salud[0].evidencia.length, 300);
  assert.deepEqual(xray.limpiar(xray.limpiar(xrayCompleto())), xray.limpiar(xrayCompleto()));
});

t('xray faltas: 6 ejes, un eje ok o riesgo sin evidencia, sin conclusión y sin trabado', () => {
  assert.deepEqual(xray.faltas(xrayCompleto()), []);
  const c = xrayCompleto(); c.salud = c.salud.slice(0, 4);
  assert.match(xray.faltas(c)[0], /Hay 4 de 6 ejes: faltan Capacidad, Marca\/atención/);
  const d = xrayCompleto(); d.salud[0].evidencia = ''; d.salud[1].evidencia = '⚠️ SIN DATOS'; d.salud[2].estado = 'falta'; d.salud[2].evidencia = ''; d.conclusion = ''; d.trabado = '';
  const f = xray.faltas(d);
  assert.ok(f.some((x) => /«Oferta» está en ok sin evidencia/.test(x)), f.join(' | ')); assert.ok(f.some((x) => /«Modelo de dinero» está en riesgo sin evidencia/.test(x)));
  assert.ok(!f.some((x) => /Leads/.test(x)), 'un eje en «falta» sin evidencia está bien: dice ⚠️ SIN DATOS');
  assert.ok(f.some((x) => /conclusión/.test(x))); assert.ok(f.some((x) => /dónde está trabado/.test(x)));
  assert.equal(xray.faltas(xray.vacio()).length, 2, 'vacío: sin conclusión y sin trabado (los 6 ejes en falta están bien)');
  assert.deepEqual(xray.ejesSinDatos(d).map((x) => x.eje).sort(), ['leads', 'modelo', 'oferta'].sort());
});

t('xray aViva: lo que manda a la estrategia en vivo son llaves que limpiarParche acepta y no manda nada vacío', () => {
  const c = xrayCompleto(), p = xray.aViva(c);
  assert.deepEqual(p, { contexto: { conclusion: c.conclusion }, analisis: { trabado: 'capacidad', porque: c.porque } });
  assert.deepEqual(limpiarParche(p), p, 'limpiarParche acepta cada llave tal cual');
  assert.deepEqual(xray.aViva({ ...c, porque: '' }), { contexto: { conclusion: c.conclusion }, analisis: { trabado: 'capacidad' } });
  assert.deepEqual(xray.aViva({ ...c, conclusion: '', trabado: '', porque: 'solo el porque' }), { analisis: { porque: 'solo el porque' } });
  assert.deepEqual(xray.aViva(xray.vacio()), {}); assert.deepEqual(xray.aViva(null), {});
  assert.deepEqual(xray.aViva({ conclusion: 'c'.repeat(900) }).contexto.conclusion.length, 400, 'el mismo tope que limpiarParche');
  assert.equal(limpiarParche(xray.aViva({ conclusion: 'c'.repeat(900) })).contexto.conclusion.length, 400);
  for (const id of xray.TRABADO.map((x) => x.id)) assert.equal(limpiarParche({ analisis: { trabado: id } }).analisis.trabado, id, `limpiarParche acepta trabado ${id}`);
});

// ============ Offer Architect ============
t('oferta valorPercibido: (sueño × probabilidad) / (tiempo × esfuerzo); con un factor sin valor es null', () => {
  assert.equal(oferta.valorPercibido(ecuacionLlena()), 2.4);
  assert.equal(oferta.valorPercibido(ofertaCompleta()), 2.4, 'también recibe el contenido entero');
  for (const id of oferta.FACTORES_IDS) { const e = ecuacionLlena(); e[id].valor = null; assert.equal(oferta.valorPercibido(e), null, id); }
  const e = ecuacionLlena(); e.sueno = { valor: 10, evidencia: '' }; e.probabilidad.valor = 10; e.tiempo.valor = 1; e.esfuerzo.valor = 1; assert.equal(oferta.valorPercibido(e), 100);
  assert.equal(oferta.valorPercibido(oferta.vacio().ecuacion), null); assert.equal(oferta.valorPercibido(null), null); assert.equal(oferta.valorPercibido({}), null);
  assert.equal(oferta.valorPercibido({ ...ecuacionLlena(), tiempo: { valor: 0 } }), null, 'un 0 no es un dato');
  assert.equal(oferta.valorPercibido({ sueno: { valor: 7 }, probabilidad: { valor: 3 }, tiempo: { valor: 3 }, esfuerzo: { valor: 3 } }), 2.33, 'redondea a 2 decimales');
});

t('oferta bloqueos: Brand Growth bloquea stack y variaciones; la escalera es solo de Growth Partnership', () => {
  assert.deepEqual(oferta.bloqueos('growth'), { ecuacion: true, stack: true, propuesta: true, variaciones: true, escalera: true });
  assert.deepEqual(oferta.bloqueos('partnership'), { ecuacion: false, stack: false, propuesta: false, variaciones: false, escalera: false });
  assert.deepEqual(oferta.bloqueos('foundation'), { ecuacion: false, stack: false, propuesta: false, variaciones: false, escalera: true });
  assert.deepEqual(oferta.bloqueos('medida'), { ecuacion: false, stack: false, propuesta: false, variaciones: false, escalera: true });
  assert.deepEqual(oferta.bloqueos(null), { ecuacion: false, stack: false, propuesta: false, variaciones: false, escalera: true }); assert.deepEqual(oferta.bloqueos(undefined), oferta.bloqueos(null));
});

t('oferta cambiaBloqueado: detecta el cambio de precio, del stack y de la escalera según el nivel', () => {
  const antes = ofertaCompleta(), precio = ofertaCompleta(); precio.variaciones[0].precio = 'Q1,200 al mes';
  assert.deepEqual(oferta.cambiaBloqueado(antes, precio, 'growth'), ['variaciones'], 'el precio');
  assert.deepEqual(oferta.cambiaBloqueado(antes, precio, 'partnership'), []); assert.deepEqual(oferta.cambiaBloqueado(antes, precio, 'foundation'), []);
  const stack = ofertaCompleta(); stack.stack.nombre = 'Otro nombre'; stack.escalera.upsell.propuesta = 'Otro upsell';
  assert.deepEqual(oferta.cambiaBloqueado(antes, stack, 'growth'), ['stack', 'escalera']); assert.deepEqual(oferta.cambiaBloqueado(antes, stack, 'foundation'), ['escalera']); assert.deepEqual(oferta.cambiaBloqueado(antes, stack, 'partnership'), []);
  const empuja = ofertaCompleta(); empuja.empujar.oferta = 'Completa'; empuja.empujar.mensaje = 'Otro';
  assert.deepEqual(oferta.cambiaBloqueado(antes, empuja, 'growth'), [], 'elegir qué se empuja y su mensaje sí se puede');
  const ofertaNueva = ofertaCompleta(); ofertaNueva.propuesta = 'Otra'; ofertaNueva.ecuacion.sueno.valor = 3;
  assert.deepEqual(oferta.cambiaBloqueado(antes, ofertaNueva, 'growth'), ['ecuacion', 'propuesta'], 'Brand Growth no cambia la oferta: ni la ecuación ni la propuesta');
  assert.deepEqual(oferta.cambiaBloqueado(antes, ofertaNueva, 'foundation'), []);
  assert.deepEqual(oferta.cambiaBloqueado(antes, antes, 'growth'), []);
  assert.deepEqual(oferta.cambiaBloqueado(null, ofertaCompleta(), 'growth'), ['ecuacion', 'stack', 'propuesta', 'variaciones', 'escalera'], 'un doc nuevo con la oferta completa en Brand Growth');
  assert.deepEqual(oferta.cambiaBloqueado(null, { empujar: { oferta: 'x', mensaje: 'y' } }, 'growth'), []);
  assert.deepEqual(oferta.cambiaBloqueado(antes, { ...ofertaCompleta(), v: 9, _meta: {}, raro: 1 }, 'growth'), [], 'lo que limpiar quita no cuenta como cambio');
  const c = oferta.conservarBloqueado(antes, { ...precio, empujar: { oferta: 'Completa', mensaje: 'M' } }, 'growth');
  assert.deepEqual(c.variaciones, antes.variaciones); assert.equal(c.empujar.oferta, 'Completa'); assert.deepEqual(oferta.cambiaBloqueado(antes, c, 'growth'), []);
});

t('oferta faltas: Brand Growth pide qué oferta se empuja y su mensaje; los demás, propuesta, 2 variaciones y evidencia', () => {
  assert.deepEqual(oferta.faltas(ofertaCompleta(), { nivelId: 'partnership' }), []); assert.deepEqual(oferta.faltas(ofertaCompleta()), []);
  assert.deepEqual(oferta.faltas({ empujar: { oferta: 'Esencial', mensaje: 'Empieza por saber cuánto ganas' } }, { nivelId: 'growth' }), []);
  assert.equal(oferta.faltas(oferta.vacio(), { nivelId: 'growth' }).length, 2); assert.match(oferta.faltas({ empujar: { oferta: 'x' } }, { nivelId: 'growth' })[0], /mensaje/);
  assert.equal(oferta.faltas(ofertaCompleta(), { ctx: { cliente: { nivel: { id: 'growth' } } } }).length, 0, 'el shell pasa el nivel en ctx');
  assert.equal(oferta.faltas({ ...ofertaCompleta(), empujar: {} }, { nivelId: 'growth' }).length, 2, 'en Brand Growth lo único que cuenta es lo que se empuja');
  const c = ofertaCompleta(); c.propuesta = ''; c.variaciones = c.variaciones.slice(0, 1); c.ecuacion.tiempo.evidencia = ''; c.ecuacion.esfuerzo = { valor: null, evidencia: '' };
  const f = oferta.faltas(c, { nivelId: 'foundation' });
  assert.ok(f.some((x) => /propuesta de valor/.test(x))); assert.ok(f.some((x) => /1 variación con nombre: se piden al menos 2/.test(x))); assert.ok(f.some((x) => /«Demora» tiene valor 4 sin evidencia/.test(x)));
  assert.ok(!f.some((x) => /Esfuerzo/.test(x)), 'sin valor no hay evidencia que pedir');
  assert.equal(oferta.faltas(oferta.vacio(), { nivelId: 'partnership' }).length, 2, 'vacío: propuesta y variaciones');
  assert.ok(oferta.faltas({ ...ofertaCompleta(), variaciones: [{ nombre: '', precio: 'Q1' }, { nombre: '', precio: 'Q2' }] }).some((x) => /0 variaciones/.test(x)), 'una variación sin nombre no cuenta');
});

t('oferta limpiar: la ecuación en 1-10 o null, el stack en listas, hasta 3 variaciones y la escalera de 4 tipos', () => {
  const c = oferta.limpiar({ ecuacion: { sueno: { valor: '8', evidencia: 'e' }, probabilidad: { valor: 11 }, tiempo: 0, esfuerzo: { valor: 'alto' }, extra: { valor: 1 } },
    stack: { problemas: ['a', '', 5, { x: 1 }], bonos: 'no es lista', garantia: 'g' }, propuesta: 'p', variaciones: [{ nombre: 'A' }, {}, 'x', { nombre: 'B' }, { nombre: 'C' }, { nombre: 'D' }],
    escalera: { atraccion: 'solo texto', upsell: { propuesta: 'u', hoy: 'h', cita: 'c', extra: 1 }, raro: { propuesta: 'x' } }, empujar: { oferta: 'o', mensaje: 'm', raro: 1 } });
  assert.deepEqual(c.ecuacion, { sueno: { valor: 8, evidencia: 'e' }, probabilidad: { valor: null, evidencia: '' }, tiempo: { valor: null, evidencia: '' }, esfuerzo: { valor: null, evidencia: '' } });
  assert.deepEqual(c.stack.problemas, ['a', '5']); assert.deepEqual(c.stack.bonos, []); assert.equal(c.variaciones.length, 3); assert.deepEqual(c.variaciones.map((v) => v.nombre), ['A', 'B', 'C']);
  assert.deepEqual(Object.keys(c.escalera), ['atraccion', 'upsell', 'downsell', 'continuidad']); assert.equal(c.escalera.atraccion.propuesta, 'solo texto'); assert.deepEqual(c.escalera.upsell, { hoy: 'h', propuesta: 'u', cita: 'c' });
  assert.deepEqual(oferta.limpiar(c), c); assert.deepEqual(oferta.limpiar('x'), oferta.vacio()); assert.deepEqual(Object.keys(c.variaciones[0]), ['nombre', 'precio', 'para_quien', 'diferencia']);
  assert.equal(oferta.limpiar({ stack: { problemas: Array.from({ length: 30 }, (_, i) => `p${i}`) } }).stack.problemas.length, 12);
});

// ============ Growth Roadmap Builder ============
t('roadmap limpiarItems: recorta, valida área y trimestre, y da ids que no chocan', () => {
  assert.deepEqual(roadmap.AREAS_RM, ['strategy', 'marketing', 'creative', 'production', 'ads', 'consulting']); assert.deepEqual(roadmap.TRIMESTRES, ['T1', 'T2', 'T3', 'T4']);
  const x = roadmap.limpiarItems([
    { id: 'A b', area: 'Marketing', trimestre: 'q2', titulo: `  ${'T'.repeat(300)}  `, oportunidad_id: 'OPP 1!', tareas: [{ title: 'a', due: '2026-02-31' }, { title: 'b', due: '2026-12-01', v: 1 }, 'c', { title: '' }, 5, ...Array.from({ length: 12 }, (_, i) => ({ title: `t${i}` }))] },
    { id: 'a-b', area: 'Creatividad', trimestre: 'Trimestre 3', titulo: 'Dos' }, { area: 'pauta', trimestre: 4, titulo: 'Tres' }, { id: 'r1', area: 'Producción', trimestre: 'meses 4-6', titulo: 'Cuatro' },
    { area: 'operaciones', trimestre: 'T1', titulo: 'área que no existe' }, { area: 'ads', trimestre: 'T5', titulo: 'trimestre que no existe' }, { area: 'ads', trimestre: 'T1', titulo: '' }, 'basura', null,
    { area: 'strategy', trimestre: 'T1', titulo: 'Cinco', v: 3, _meta: {}, raro: 1 }]);
  assert.deepEqual(x.map((i) => [i.area, i.trimestre]), [['marketing', 'T2'], ['creative', 'T3'], ['ads', 'T4'], ['production', 'T2'], ['strategy', 'T1']]);
  assert.equal(x[0].titulo.length, 160); assert.equal(x[0].oportunidad_id, 'opp-1'); assert.equal(new Set(x.map((i) => i.id)).size, 5, 'ids únicos'); assert.deepEqual(x.map((i) => i.id), ['a-b', 'r2', 'r3', 'r1', 'r4'], 'un id repetido o vacío recibe uno nuevo que no choca');
  assert.ok(x.every((i) => /^[a-z0-9_-]{1,24}$/.test(i.id)), 'los ids son seguros');
  assert.deepEqual(x[0].tareas, [{ title: 'a', due: '' }, { title: 'b', due: '2026-12-01' }, { title: 'c', due: '' }, ...Array.from({ length: 5 }, (_, i) => ({ title: `t${i}`, due: '' }))]);
  assert.equal(x[0].tareas.length, 8); assert.deepEqual(Object.keys(x[0]), ['id', 'oportunidad_id', 'area', 'trimestre', 'titulo', 'tareas']); assert.deepEqual(Object.keys(x[0].tareas[0]), ['title', 'due']);
  assert.equal(roadmap.limpiarItems(Array.from({ length: 90 }, (_, i) => ({ area: 'ads', trimestre: 'T1', titulo: `f${i}` }))).length, 60);
  assert.deepEqual(roadmap.limpiarItems('no es lista'), []); assert.deepEqual(roadmap.limpiarItems(roadmap.limpiarItems(itemsBuenos())), roadmap.limpiarItems(itemsBuenos()));
  assert.equal(roadmap.areaDe('Diseño'), 'creative'); assert.equal(roadmap.trimestreDe('Q4'), 'T4'); assert.equal(roadmap.trimestreDe('meses 10-12'), 'T4'); assert.equal(roadmap.trimestreDe('mes 2-4'), '');
});

t('roadmap limpiarHitos: título, fecha real o vacía y meta en texto, hasta 20', () => {
  const h = roadmap.limpiarHitos([{ id: 'x', titulo: 'Uno', fecha: '2026-12-31', meta: '3 clientes' }, { titulo: 'Dos', fecha: '31/12/2026', meta: 5 }, { titulo: 'Tres', fecha: '2026-13-01' }, { titulo: '' }, 100000, null, 'Cuatro', { title: 'Cinco' }]);
  assert.deepEqual(h, [{ id: 'x', titulo: 'Uno', fecha: '2026-12-31', meta: '3 clientes' }, { id: 'h1', titulo: 'Dos', fecha: '', meta: '5' }, { id: 'h2', titulo: 'Tres', fecha: '', meta: '' }, { id: 'h3', titulo: 'Cuatro', fecha: '', meta: '' }, { id: 'h4', titulo: 'Cinco', fecha: '', meta: '' }]);
  assert.deepEqual(roadmap.limpiarHitos([null, 0, 100000, null]), [], 'los números sueltos del formato viejo no son hitos');
  assert.equal(roadmap.limpiarHitos(Array.from({ length: 40 }, (_, i) => ({ titulo: `h${i}` }))).length, 20); assert.equal(roadmap.limpiarHitos([{ titulo: 'T'.repeat(300), meta: 'm'.repeat(500) }])[0].meta.length, 240);
});

t('roadmap porTrimestre: siempre los 4 trimestres y las 6 áreas, con las filas en su celda', () => {
  const g = roadmap.porTrimestre(itemsBuenos());
  assert.deepEqual(Object.keys(g), ['T1', 'T2', 'T3', 'T4']); for (const q of roadmap.TRIMESTRES) assert.deepEqual(Object.keys(g[q]), roadmap.AREAS_RM);
  assert.deepEqual(g.T1.marketing.map((i) => i.id), ['r1']); assert.deepEqual(g.T1.creative.map((i) => i.id), ['r2']); assert.deepEqual(g.T2.production.map((i) => i.id), ['r3']); assert.deepEqual(g.T3.consulting.map((i) => i.id), ['r4']);
  assert.equal(g.T4.ads.length, 0); assert.equal(Object.values(g).flatMap((q) => Object.values(q)).flat().length, 4);
  const vacio = roadmap.porTrimestre(null); assert.equal(Object.values(vacio).flatMap((q) => Object.values(q)).flat().length, 0); assert.deepEqual(Object.keys(vacio.T1), roadmap.AREAS_RM);
  const dos = roadmap.porTrimestre([{ id: 'a', area: 'ads', trimestre: 'T1', titulo: 'Uno' }, { id: 'b', area: 'ads', trimestre: 'T1', titulo: 'Dos' }]); assert.deepEqual(dos.T1.ads.map((i) => i.titulo), ['Uno', 'Dos'], 'en el orden que llegan');
});

t('roadmap tareasDe: la forma de tareaDeEncargo, origen estrategia, el área de la fila y sin inventar fechas', () => {
  const quien = { slug: 'akai', nombre: 'AKAI', email: 'ceo@inherent.test' }, tareas = roadmap.tareasDe(itemsBuenos(), quien);
  assert.equal(tareas.length, 5, '2 de r1, 1 de r2 (sin tareas: la fila), 1 de r3 y 1 de r4 (sin tareas: la fila)');
  const molde = tareaDeEncargo({ area: 'marketing', titulo: 'x', por_que: 'y', vence: '' }, { cliente: 'akai', nombre: 'AKAI', email: quien.email });
  for (const tk of tareas) {
    assert.deepEqual(Object.keys(tk), Object.keys(molde), 'las mismas llaves que tareaDeEncargo');
    assert.equal(tk.origen, 'estrategia'); assert.equal(tk.cliente, 'akai'); assert.equal(tk.client_slug, 'akai'); assert.equal(tk.assignee, quien.email); assert.equal(tk.visibility, 'private'); assert.equal(tk.status, 'Por empezar'); assert.equal(tk.project_id, '');
    assert.match(tk.description, /Encargo de Estrategia · AKAI\./);
  }
  assert.deepEqual(tareas.map((x) => [x.title, x.due]), [['Definir 3 pilares', '2026-11-15'], ['Calendario del mes', ''], ['Sistema de plantillas', ''], ['Grabar el día 1', '2026-12-02'], ['Procesos de entrega', '']]);
  assert.deepEqual(tareas.map((x) => [x.area, x.dept]), [['marketing', '③ Marketing'], ['marketing', '③ Marketing'], ['diseno', '⑥A Diseño gráfico'], ['produccion', '⑤ Producción'], ['consulting', '']]);
  assert.deepEqual(tareas.map((x) => x.description.split('\n')[0]), ['Subir el alcance orgánico · T1 · Marketing', 'Subir el alcance orgánico · T1 · Marketing', 'Sistema de plantillas · T1 · Creative', 'Banco de tomas · T2 · Production', 'Procesos de entrega · T3 · Consulting']);
  assert.deepEqual(roadmap.tareasDe([]), []); assert.deepEqual(roadmap.tareasDe(null, quien), []); assert.equal(roadmap.tareasDe([{ area: 'ads', trimestre: 'T1', titulo: 'Pauta de lanzamiento' }], quien)[0].dept, '⑩ Ads');
});

t('roadmap tareasMarcadas: cada tarea lleva su fila y su id estable (no se duplica al convertir otra vez); tareasDe no cambia', () => {
  const quien = { slug: 'akai', nombre: 'AKAI', email: 'ceo@inherent.test' }, base = roadmap.tareasDe(itemsBuenos(), quien), tareas = roadmap.tareasMarcadas(itemsBuenos(), quien);
  assert.equal(tareas.length, base.length, 'las mismas tareas que tareasDe');
  tareas.forEach((tk, i) => {
    const { id, roadmap_item, roadmap_tarea, ...resto } = tk;
    assert.deepEqual(resto, base[i], 'lo demás es exactamente la tarea de tareasDe'); assert.ok(!('id' in base[i]) && !('roadmap_item' in base[i]), 'tareasDe no se toca (la forma de tareaDeEncargo)');
    assert.match(id, /^[\w.@+-]{3,120}$/, 'el id lo acepta POST /api/db/tasks (y la base rechaza el repetido con 409)'); assert.equal(id, id.toLowerCase());
    assert.ok(roadmap_item && /^\d+$/.test(roadmap_tarea));
  });
  assert.equal(new Set(tareas.map((x) => x.id)).size, tareas.length, 'ids distintos');
  assert.deepEqual(tareas.map((x) => [x.roadmap_item, x.roadmap_tarea]), [['r1', '1'], ['r1', '2'], ['r2', '0'], ['r3', '1'], ['r4', '0']], '«0» = la fila misma (sin tareas); «1», «2»… las de su lista');
  assert.deepEqual(roadmap.tareasMarcadas(itemsBuenos(), quien).map((x) => x.id), tareas.map((x) => x.id), 'dos corridas dan lo mismo: la clave es estable');
  assert.notEqual(roadmap.tareasMarcadas(itemsBuenos(), { ...quien, slug: 'nao' })[0].id, tareas[0].id, 'el id lleva el cliente');
  assert.ok(roadmap.tareasMarcadas([{ id: 'x'.repeat(80), area: 'ads', trimestre: 'T1', titulo: 'Largo' }], { ...quien, slug: 's'.repeat(80) })[0].id.length <= 120);
  assert.deepEqual(roadmap.tareasMarcadas([], quien), []); assert.deepEqual(roadmap.tareasMarcadas(null), []);
});
t('Growth Roadmap · convertir en tareas: usa las marcadas, reconoce la clave sin mirar el estado y trata el 409 de la base como «ya estaba»', () => {
  const ui = fs.readFileSync(new URL('../public/js/strategy/roadmap-ui.js', import.meta.url), 'utf8');
  assert.match(ui, /tareasMarcadas\(items\.filter\(\(x\) => x\.trimestre === 'T1'\), dep\), todo = tareasMarcadas\(items, dep\)/); assert.ok(!/\btareasDe\b/.test(ui.replace(/\/\/.*$/gm, '')), 'ya no convierte con tareasDe a secas');
  const ya = ui.slice(ui.indexOf('const yaConvertida'), ui.indexOf('async function tareas()'));
  assert.match(ya, /x\.roadmap_item === t\.roadmap_item && x\.roadmap_tarea === t\.roadmap_tarea/); assert.ok(!/Hecha|status/.test(ya), 'la clave no cuenta el estado de la tarea');
  assert.match(ui, /if \(e\.status === 409\) \{ ya\+\+; continue; \}/, 'una tarea que la base ya tiene (de otra persona, fuera de su alcance) no se repite');
  assert.match(ui, /if \(yaConvertida\(ts, t\)\) \{ ya\+\+; continue; \}/);
});

t('roadmap aMetas y aFilas: metas con la forma de goals.js y las filas del formato viejo que acepta limpiarParche', () => {
  const metas = roadmap.aMetas(hitosBuenos());
  assert.equal(metas.length, 2);
  assert.deepEqual(metas[0], { goal: 'Primer cliente nuevo', metric: 'Primer cliente nuevo', baseline: '', target: '3 clientes', current: '', due: '2026-12-31', status: 'todo', note: '', every: '', tasks: [], checks: [], origen: 'estrategia', roadmap_hito: 'h1' });
  for (const k of ['goal', 'metric', 'baseline', 'target', 'current', 'due', 'status', 'note', 'every', 'tasks', 'checks']) assert.ok(k in metas[1], `goals.js: ${k}`);
  assert.ok(['todo', 'now', 'done'].includes(metas[1].status)); assert.equal(roadmap.claveHito(metas[0]), 'estrategia|h1'); assert.equal(roadmap.claveHito({ origen: 'consulting', roadmap_hito: 'h1' }), ''); assert.equal(roadmap.claveHito({}), '');
  assert.deepEqual(roadmap.aMetas([]), []); assert.deepEqual(roadmap.aMetas(null), []);
  const filas = roadmap.aFilas(itemsBuenos());
  assert.deepEqual(filas.map((f) => f.area), ['Marketing', 'Creatividad', 'Producción', 'Consulting']); assert.deepEqual(filas[0].celdas, ['Subir el alcance orgánico', '', '', '']); assert.deepEqual(filas[2].celdas, ['', 'Banco de tomas', '', '']);
  assert.deepEqual(limpiarParche({ roadmap: { filas } }).roadmap.filas, filas, 'limpiarParche acepta las filas tal cual'); assert.deepEqual(roadmap.aFilas([]), []);
});

t('roadmap faltas: sin filas no se aprueba; con Brand Growth ningún texto promete un % de crecimiento', () => {
  assert.deepEqual(roadmap.faltas({ items: [] }), ['Sin filas no se aprueba']); assert.deepEqual(roadmap.faltas({}), ['Sin filas no se aprueba']); assert.deepEqual(roadmap.faltas(null), ['Sin filas no se aprueba']); assert.deepEqual(roadmap.faltas(roadmap.vacio()), ['Sin filas no se aprueba']);
  assert.deepEqual(roadmap.faltas({ items: [{ area: 'ads', trimestre: 'T9', titulo: 'x' }] }), ['Sin filas no se aprueba'], 'una fila que limpiar tira no cuenta');
  assert.deepEqual(roadmap.faltas({ items: itemsBuenos(), hitos: hitosBuenos() }), []); assert.deepEqual(roadmap.faltas({ items: itemsBuenos() }, { nivelId: 'growth' }), []);
  assert.deepEqual(roadmap.faltas({ items: [], filas: [{ area: 'Marketing', celdas: ['a', '', '', ''] }] }), [], 'las filas del formato viejo también cuentan (el servidor las acepta)');
  const promete = { items: [{ area: 'marketing', trimestre: 'T1', titulo: 'Subir las ventas 30% en el trimestre' }, { area: 'ads', trimestre: 'T2', titulo: 'Reducir el CAC 20%' }], hitos: [{ titulo: 'Crecer 50% en ingresos', meta: '' }, { titulo: 'Doce reels al mes', meta: '12' }] };
  const f = roadmap.faltas(promete, { nivelId: 'growth' });
  assert.equal(f.length, 2, f.join(' | ')); assert.ok(f.every((x) => /promete un % de crecimiento/.test(x)));
  assert.deepEqual(roadmap.faltas(promete, { nivelId: 'partnership' }), []); assert.equal(roadmap.faltas(promete, { ctx: { cliente: { nivel: { id: 'growth' } } } }).length, 2);
  assert.ok(roadmap.prometePorcentaje('Crecer 30% en ventas') && roadmap.prometePorcentaje('Aumentar los ingresos un 12,5 %') && !roadmap.prometePorcentaje('Subir 30 reels') && !roadmap.prometePorcentaje('Reducir el CAC 20%') && !roadmap.prometePorcentaje('Más ventas'));
});

// ============ Los cuatro ============
t('exports: cada módulo trae lo que el shell y el servidor piden', () => {
  for (const [n, m, bloque] of MODULOS) {
    for (const k of ['BLOQUE', 'vacio', 'prompt', 'leer', 'limpiar', 'faltas', 'aMd', 'resumenTexto']) assert.ok(k in m, `${n}: falta export ${k}`);
    assert.equal(m.BLOQUE, bloque, n);
  }
  assert.equal(typeof xray.aViva, 'function');
});

t('prompt de los 4: Evidencia o etiqueta, su bloque y criterios, la biblioteca de Hormozi y < 5 000 caracteres', () => {
  for (const [n, m, bloque] of MODULOS) {
    for (const [nombre, ctx] of CTXS) {
      const p = m.prompt(ctx);
      assert.equal(typeof p, 'string', `${n}/${nombre}`);
      assert.ok(p.length < 5000, `${n}/${nombre}: ${p.length} caracteres`);
      assert.ok(p.includes('Evidencia o etiqueta'), `${n}/${nombre}`);
      assert.ok(p.includes(`${F}${bloque}\n`) && p.includes(`${F}criterios\n`), `${n}/${nombre}: pide su bloque y criterios`);
      assert.ok(p.includes('ceo-os/data/hormozi') && p.includes('«No está en el material»'), `${n}/${nombre}`);
      assert.ok(p.includes('FUERA DEL ALCANCE') && p.includes('⚠️ SIN DATOS'), `${n}/${nombre}`);
      for (const m06 of p.matchAll(/06-ECONOMIA/g)) assert.match(p.slice(Math.max(0, m06.index - 40), m06.index), /Nunca leas ni cites inherent\/$/, `${n}/${nombre}: 06-ECONOMIA solo como algo que NO se lee`);
      assert.ok(!/costos? de inherent[^.]*lee/i.test(p) && !/tarifas? de inherent/i.test(p.replace(/costos, márgenes o tarifas de Inherent/, '')), `${n}/${nombre}`);
      assert.ok(!/undefined|NaN|\[object/.test(p), `${n}/${nombre}: sin basura`);
    }
  }
});

t('prompt de diana: una sola pregunta a la vez, un mensaje y un ángulo por anillo, y no toca los lotes', () => {
  const p = diana.prompt(CTX);
  assert.match(p, /una sola pregunta a la vez/i); assert.match(p, /refleja en una frase/); assert.match(p, /nunca juntes/);
  assert.match(p, /UN mensaje .* y UN ángulo por anillo/); for (const a of ANGULOS) assert.ok(p.includes(a), a);
  for (const a of diana.ANILLOS) assert.ok(p.includes(a.nombre), a.nombre);
  assert.match(p, /3 al centro, 1 al anillo 1 y 1 al anillo 2/); assert.match(p, /No incluyas calib/);
  assert.ok(diana.prompt({ ...CTX, diana: dianaCompleta() }).includes('Diana actual (mejórala, no empieces de cero)'));
  assert.ok(!diana.prompt(CTX).includes('Diana actual'));
});

t('prompt de xray: nombra la ficha, comprension.md, nucleo.md, la Library y la Investigación, y pide 6 ejes', () => {
  const p = xray.prompt(CTX);
  for (const x of ['plan-contratado.md', 'comprension.md', 'nucleo.md', 'Library', 'Investigación']) assert.ok(p.includes(x), x);
  assert.ok(p.includes('clients/akai/00-onboarding/comprension.md') && p.includes('clients/akai/01-estrategia/nucleo.md'));
  for (const e of xray.EJES) assert.ok(p.includes(`${e.id} (${e.nombre})`), e.id);
  assert.match(p, /exactamente 6 ejes/); assert.match(p, /Sin evidencia el estado es falta/); assert.match(p, /Strategy ya ubicó la etapa 3 \(confirmada por el CEO\)/); assert.match(p, /solo del CEO/);
  assert.ok(p.includes('ceo-os/data/hormozi/roadmap/stage-3-stabilize.md')); assert.match(xray.prompt({ ...CTX, estrategia: {} }), /Strategy aún no la ubica: null/);
  const con = xray.prompt({ ...CTX, intel: { comprension: 'Vende pasteles', nucleo: 'WIN: caja' }, library: [{ titulo: 'Entrevista' }], investigacion: ['competencia.md'] });
  assert.ok(con.includes('Vende pasteles') && con.includes('WIN: caja') && con.includes('Entrevista') && con.includes('competencia.md'), 'lo que el ctx trae entra al pedido');
  assert.equal(xray.prompt({ ...CTX, cliente: { slug: 'inherent', nombre: 'Inherent' } }).includes('inherent/inherent-social-media/00-onboarding/comprension.md'), true);
});

t('prompt de oferta: cita resolvible o «No está en el material», rutas reales, y por nivel', () => {
  const rutas = (p) => [...p.matchAll(/\b(\d\d-[a-z0-9-]+\.md)/g)].map((m) => m[1]);
  const libros = `${RAIZ}ceo-os/data/hormozi/books/`;
  const existe = (n) => fs.existsSync(`${libros}100m-offers/${n}`) || fs.existsSync(`${libros}100m-money-models/${n}`);
  const socio = oferta.prompt(CTX), crecer = oferta.prompt(conNivel('growth', 'Brand Growth')), base = oferta.prompt(conNivel('foundation', 'Brand Foundation'));
  for (const [n, p] of [['partnership', socio], ['growth', crecer], ['foundation', base]]) {
    assert.ok(rutas(p).length >= 2, n); for (const r of rutas(p)) assert.ok(existe(r), `${n}: ${r} no existe en ceo-os/data/hormozi/books`);
    assert.ok(p.includes('[$100M OFFERS | 6. Value Offer: The Value Equation | pág. PDF 81]') && p.includes('«No está en el material»'), n);
  }
  assert.ok(rutas(socio).length >= 10 && socio.includes('100m-money-models/03-the-four-types-of-offers.md') && socio.includes('23-section-5-continuity-offers.md'));
  assert.ok(socio.includes('"escalera":') && socio.includes('"ecuacion":') && socio.includes('"stack":'));
  assert.ok(!base.includes('"escalera":') && /NO entra en este nivel/.test(base) && base.includes('"stack":'), 'Foundation: sin escalera');
  // Brand Growth: SOLO qué oferta empujar y su mensaje.
  assert.ok(crecer.includes('{"empujar":{"oferta"') && !crecer.includes('"stack":') && !crecer.includes('"ecuacion":') && !crecer.includes('"variaciones":') && !crecer.includes('"escalera":'));
  assert.match(crecer, /Brand Growth: NO se cambia qué se vende, ni el paquete, ni el precio/); assert.match(crecer, /Solo eliges cuál de las ofertas que YA existen se empuja/);
  assert.match(socio, /Todo precio es una PROPUESTA: se escala al CEO/);
  assert.ok(oferta.prompt({ ...CTX, entradas: [{ tool: 'business-xray', titulo: 'X-Ray', version: 2, contenido: xrayCompleto() }] }).includes('Entrada aprobada · X-Ray v2: X-Ray: Vende bien pero no aguanta más pedidos'));
});

t('prompt de roadmap: pide el bloque estrategia con {"roadmap":…}, la etapa a graduar y nunca un % de crecimiento', () => {
  const p = roadmap.prompt(CTX);
  assert.ok(p.includes(`${F}estrategia\n{"roadmap":{"items":[`) && p.includes('"hitos":['), 'el bloque que ya lee instrucciones() de estrategia-viva.js');
  assert.match(p, /Brand Growth nunca promete un % de crecimiento/); assert.match(p, /T1 \(meses 1-3\) es el plan de 90 días y debe llevar a graduar la etapa 3: «Get help»/);
  assert.ok(p.includes('ceo-os/data/hormozi/roadmap/stage-3-stabilize.md') && p.includes('ceo-os/data/hormozi/roadmap/overview-las-10-etapas.md'));
  for (const a of roadmap.AREAS_RM) assert.ok(p.includes(a), a); assert.match(p, /oportunidad_id/);
  const g = roadmap.prompt(conNivel('growth', 'Brand Growth')); assert.match(g, /Cierra en el alcance y el volumen del ciclo que fija la ficha\. No promete un % de crecimiento/);
  assert.match(roadmap.prompt({ ...CTX, cliente: { slug: 'x', nombre: 'X' }, ficha: null }), /SIN DATOS/);
  const o = roadmap.prompt({ ...CTX, entradas: [{ tool: 'opportunity-map', titulo: 'Mapa', version: 1, contenido: { items: [{ id: 'o1', titulo: 'Reactivar clientes' }, { id: 'o2', titulo: 'Sube el ticket' }, { titulo: 'sin id' }] } }] });
  assert.ok(o.includes('Oportunidades aprobadas (usa su id en oportunidad_id): o1 = Reactivar clientes; o2 = Sube el ticket'));
  // Lo que pide lo lee limpiarParche en las llaves que ya conoce, y el resto lo lee roadmap.leer().
  assert.equal(limpiarParche({ roadmap: { filas: roadmap.aFilas(itemsBuenos()) } }).roadmap.filas.length, 4);
});

t('leer: un bloque bien formado con sus criterios; a medias, roto o basura es null', () => {
  const criterios = `${F}criterios\n{"entregable":"E","cumple":["a"],"falta":["b — por qué"]}\n${F}`;
  for (const [n, m, bloque] of MODULOS) {
    const doc = COMPLETO[n](), cuerpo = n === 'roadmap' ? { roadmap: doc } : doc, entero = JSON.stringify(cuerpo);
    const bueno = `Resumen corto.\n${F}${bloque}\n${entero}\n${F}\n${criterios}`;
    const r = m.leer(bueno);
    assert.ok(r, `${n}: lee el bloque`); assert.deepEqual(r.contenido, m.limpiar(doc), `${n}: el contenido sale limpio`); assert.deepEqual(r.criterios, { cumple: ['a'], falta: ['b — por qué'] });
    assert.deepEqual(m.leer(`${F}${bloque}\n${entero}\n${F}`).criterios, { cumple: [], falta: [] }, `${n}: sin criterios`);
    assert.equal(m.leer(`Resumen.\n${F}${bloque}\n${entero.slice(0, entero.length >> 1)}`), null, `${n}: bloque a medias`);
    assert.equal(m.leer(`${F}${bloque}\n${entero.slice(0, entero.length >> 1)}\n${F}\n${criterios}`), null, `${n}: a medias y seguido de criterios`);
    assert.equal(m.leer(`${F}${bloque}\n{"roto": ,}\n${F}`), null, `${n}: JSON roto`); assert.equal(m.leer(`${F}${bloque}\n[1,2,3]\n${F}`), null, `${n}: un arreglo no es contenido`);
    assert.equal(m.leer(`${F}${bloque}\n{"sin":"nada conocido"}\n${F}`), null, `${n}: un objeto sin nada de la herramienta`); assert.equal(m.leer(`${F}otro\n${entero}\n${F}`), null, `${n}: otro bloque`);
    for (const basura of ['', 'hola', null, undefined, 42, {}, '```', `${F}${bloque}`, '\u0000\u0001 <script>alert(1)</script>']) assert.equal(m.leer(basura), null, `${n}: ${String(basura).slice(0, 20)}`);
  }
  // Un bloque a medias en datos (no en texto) sí se lee: lo que falta lo dirá faltas().
  assert.deepEqual(diana.leer(`${F}bullseye\n{"center":"Solo el centro"}\n${F}`).contenido.center, 'Solo el centro'); assert.ok(diana.faltas(diana.leer(`${F}bullseye\n{"center":"Solo el centro"}\n${F}`).contenido).length >= 4);
  assert.equal(xray.leer(`${F}xray\n{"conclusion":"c"}\n${F}`).contenido.salud.length, 0);
  assert.deepEqual(oferta.leer(`${F}oferta\n{"empujar":{"oferta":"o","mensaje":"m"}}\n${F}`).contenido.empujar, { oferta: 'o', mensaje: 'm' });
  assert.equal(roadmap.leer(`${F}estrategia\n{"meta":{"objetivo":5}}\n${F}`), null, 'un bloque estrategia sin roadmap'); assert.equal(roadmap.leer(`${F}estrategia\n{"roadmap":{"filas":[]}}\n${F}`), null, 'solo el formato viejo');
  assert.equal(roadmap.leer(`${F}estrategia\n{"meta":{"objetivo":5},"roadmap":{"hitos":[{"titulo":"H"}]}}\n${F}`).contenido.hitos[0].titulo, 'H');
});

t('limpiar: quita id, v, _meta y llaves desconocidas, y el HTML queda como texto', () => {
  const h = '<img src=x onerror=alert(1)>';
  for (const [n, m] of MODULOS) {
    const sucio = { ...COMPLETO[n](), id: 'x', v: 3, _meta: { created_at: 'hoy' }, raro: { a: 1 } };
    const c = m.limpiar(sucio), k = llaves(c);
    for (const malo of ['id_doc', 'v', '_meta', 'raro']) assert.ok(!k.has(malo), `${n}: ${malo}`);
    assert.ok(!('id' in c) && !('v' in c) && !('_meta' in c) && !('raro' in c), `${n}: arriba`);
    assert.deepEqual(m.limpiar(c), c, `${n}: idempotente`);
    for (const basura of [null, undefined, 'texto', 42, [], [1, 2]]) assert.deepEqual(m.limpiar(basura), m.limpiar({}), `${n}: ${JSON.stringify(basura)}`);
    assert.ok(typeof m.faltas(null) === 'object' && Array.isArray(m.faltas(null)), `${n}: faltas tolera basura`);
  }
  const k = roadmap.limpiar({ items: [{ id: 'r1', area: 'ads', trimestre: 'T1', titulo: 'T', v: 2, _meta: {}, raro: 1, tareas: [{ title: 'a', due: '', v: 1, _meta: 1, raro: 1 }] }], hitos: [{ id: 'h1', titulo: 'H', v: 1, _meta: 1, raro: 1 }] });
  assert.deepEqual([...llaves(k)].filter((x) => ['v', '_meta', 'raro'].includes(x)), [], 'roadmap');
  assert.deepEqual(Object.keys(k.hitos[0]), ['id', 'titulo', 'fecha', 'meta']);
  assert.equal(diana.limpiar({ center: h }).center, h); assert.equal(xray.limpiar({ conclusion: h, salud: [{ eje: 'oferta', evidencia: h, fuente: h }] }).salud[0].evidencia, h);
  assert.equal(oferta.limpiar({ propuesta: h }).propuesta, h); assert.equal(roadmap.limpiar({ items: [{ area: 'ads', trimestre: 'T1', titulo: h }] }).items[0].titulo, h);
  // Lo que no es texto ni número no se vuelve «[object Object]».
  assert.equal(diana.limpiar({ center: { a: 1 } }).center, ''); assert.equal(xray.limpiar({ conclusion: ['x'] }).conclusion, ''); assert.equal(oferta.limpiar({ propuesta: { a: 1 } }).propuesta, ''); assert.equal(roadmap.limpiar({ items: [{ area: 'ads', trimestre: 'T1', titulo: { a: 1 } }] }).items.length, 0);
  assert.equal(diana.limpiar({ center: 'a\u0000b\n\n c\t d' }).center, 'ab c d');
  // Lo que viaja por leer() también sale limpio.
  const r = oferta.leer(`${F}oferta\n${JSON.stringify({ id: 'x', _meta: 1, propuesta: h, v: 3 })}\n${F}`); assert.equal(r.contenido.propuesta, h); assert.ok(!('id' in r.contenido) && !('_meta' in r.contenido));
});

t('aMd: markdown legible; lo que no tiene dato dice ⚠️ SIN DATOS, sin undefined ni NaN', () => {
  const titulos = { diana: '# Customer Bullseye', xray: '# Business X-Ray', oferta: '# Offer Architect', roadmap: '# Growth Roadmap' };
  for (const [n, m] of MODULOS) {
    const md = m.aMd(COMPLETO[n]());
    assert.equal(typeof md, 'string', n); assert.ok(md.startsWith(titulos[n]), n); assert.ok(md.split('\n').length > 8, n); assert.ok(!/undefined|NaN|\[object/.test(md), `${n}: lleno sin basura`);
    const v = m.aMd(m.vacio()); assert.ok(v.includes('⚠️ SIN DATOS'), `${n}: vacío`); assert.ok(!/undefined|NaN|\[object|null/.test(v), `${n}: vacío sin basura`);
    assert.equal(m.aMd(null).startsWith(titulos[n]), true, `${n}: tolera basura`);
  }
  assert.match(oferta.aMd(ofertaCompleta()), /Valor percibido: \*\*2\.4\*\*/); assert.match(oferta.aMd(oferta.vacio()), /Valor percibido: ⚠️ SIN DATOS/); assert.match(oferta.aMd(ofertaCompleta()), /Esencial \| Q1,500 al mes/);
  assert.match(xray.aMd(xrayCompleto()), /\| Oferta \| ok \| Dato visto de Oferta \|/); assert.match(xray.aMd(xray.vacio()), /\| Oferta \| falta \| ⚠️ SIN DATOS \| sale de la ficha de oferta/); assert.match(xray.aMd(xrayCompleto()), /\*\*La capacidad\*\* — Una sola persona entrega todo/);
  assert.match(diana.aMd(dianaCompleta()), /- \*\*Centro · ICP\*\* \(Dolor\): Mensaje del anillo 0/); assert.match(diana.aMd(diana.vacio()), /Anillo 4 · Baja prioridad\*\*: ⚠️ SIN DATOS, falta el mensaje/);
  assert.match(roadmap.aMd(COMPLETO.roadmap()), /## T1 · Meses 1-3/); assert.match(roadmap.aMd(COMPLETO.roadmap()), /\*\*Marketing\*\*\n- Subir el alcance orgánico \(oportunidad o1\)\n {2}- Definir 3 pilares · 2026-11-15/);
  const pipe = diana.limpiar(dianaCompleta()); pipe.rings[1].label = 'a|b'; assert.ok(diana.aMd(pipe).includes('a\\|b'), 'el | de una celda se escapa');
  assert.ok(diana.resumenTexto(dianaCompleta()).startsWith('Diana: centro «Dueños de restaurante') && !/undefined/.test(roadmap.resumenTexto(null)) && xray.resumenTexto(xrayCompleto()).includes('trabado en la capacidad'));
});

t('puros: sin DOM ni red, sin importar core, brandlist, stratlist, contexto ni app, y sin nada interno de Inherent', () => {
  const prohibido = /from\s+['"](?:\.\.?\/)+(?:core|brandlist|stratlist|contexto|app|ia-herramienta|tool-shell)\.js['"]/;
  for (const f of ['diana', 'xray', 'oferta', 'roadmap']) {
    const src = fs.readFileSync(`${AQUI}public/js/strategy/${f}.js`, 'utf8');
    assert.ok(!prohibido.test(src), `${f}: importa algo con DOM o red`);
    assert.ok(!/\b(document|window|localStorage|fetch|innerHTML)\b/.test(src.replace(/^\s*\/\/.*$/gm, '')), `${f}: toca DOM o red`);
    assert.ok(!/\braw\s*\(/.test(src), `${f}: usa raw()`); assert.ok(!/06-ECONOMIA|finscope|\/api\/repo\/economia|packages|payroll|cost_recipes/.test(src), `${f}: nada de economía interna`);
    assert.match(src.split('\n')[0], /^\/\/ \S/, `${f}: comentario corto al inicio`);
  }
});

console.log(`\n${ok} pruebas de Strategy pasaron`);
