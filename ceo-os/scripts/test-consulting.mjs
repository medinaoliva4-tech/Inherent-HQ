// Pruebas de Consulting (public/js/consulting): los marcos compartidos (etapas de Hormozi, sistemas, ecuación, BMC, BCG, fórmula del
// objetivo) y los módulos puros del Diagnóstico de crecimiento, el Árbol de la brecha y el Mapa del camino del dinero: sus
// cálculos, sus faltas, su prompt, leer() y limpiar().
// node scripts/test-consulting.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as M from '../public/js/consulting/marcos.js';
import * as salud from '../public/js/consulting/salud.js';
import * as causas from '../public/js/consulting/causas.js';
import * as procesos from '../public/js/consulting/procesos.js';
import { ETAPAS } from '../public/js/estrategia.js';
import { normalize } from '../public/js/diagram-model.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const RAIZ = fileURLToPath(new URL('../../', import.meta.url)); // la raíz del repo (Inherent-HQ)
const F = '```';
const MODULOS = [['salud', salud, 'diagnostico'], ['causas', causas, 'causas'], ['procesos', procesos, 'procesos']];

// ---------- fixtures ----------
const saludCompleta = () => {
  const c = salud.vacio();
  for (const s of Object.keys(c.sistemas)) c.sistemas[s].forEach((p) => { p.puntaje = 3; p.evidencia = 'dato visto'; p.fuente = '[dice el cliente, sin verificar]'; });
  c.etapa = { n: 3, por_que: 'factura 40K al mes con 3 personas', cita: '[ROADMAP VIDEO | STAGE 3 | 00:12:40]', entre: null, falta: '' };
  c.restriccion = { funcion: 'ventas', por_que: 'nadie da seguimiento', cita: '[ROADMAP VIDEO | STAGE 3 | 00:20:00]' };
  c.capacidad = 'verde';
  c.prioridades = [1, 2, 3].map((o) => ({ orden: o, que: `Arreglar el punto ${o}`, numero: 'caja a 30 días' }));
  return c;
};
const FACTORES = [['leads', 100, 300], ['conversion', 0.02, 0.04], ['ticket', 50, 60], ['frecuencia', 2, 3], ['retencion', 0.5, 0.6]].map(([id, actual, necesario]) => ({ id, actual, necesario }));
const causasCompleta = () => ({ meta: 1500000, actual: 1000000, factores: FACTORES.map((f) => ({ ...f })), nodos: [
  { id: 'c1', padre: 'leads', texto: 'Nadie responde en menos de una hora', estado: 'validada', evidencia: 'Bandeja: 3 h de espera', falta: '', prueba: '', sistema: 'operations' },
  { id: 'c2', padre: 'c1', texto: 'Una sola persona contesta', estado: 'hipotesis', evidencia: '', falta: 'quién contesta', prueba: 'Contar quién responde en una semana', sistema: 'operations' },
] });
const procesosCompleto = () => ({
  hoy: [
    { id: 'p1', nombre: 'Responde el WhatsApp', etapa: 'contacto', rol: 'Ventas', minutos: 15, modo: 'manual', perdida: 30, dolor: 'tarda horas', fundador: true },
    { id: 'p2', nombre: 'Cotiza', etapa: 'venta', rol: 'Ventas', minutos: 40, modo: 'manual', perdida: null, dolor: '', fundador: false },
    { id: 'p3', nombre: 'Entrega el pedido', etapa: 'entrega', rol: 'Operaciones', minutos: null, modo: 'auto', perdida: 5, dolor: '', fundador: false },
  ],
  optimizado: [{ id: 'p1', nombre: 'Responde el WhatsApp', etapa: 'contacto', rol: 'Ventas', minutos: 1, modo: 'auto', perdida: 10, dolor: '', fundador: false }, { id: 'o2', nombre: 'Cobra por adelantado', etapa: 'venta', rol: 'Finanzas', minutos: 5, modo: 'auto', perdida: null, dolor: '', fundador: false }],
  estandar: { promesa: 'Tu pedido llega a tiempo y completo', pasos: ['Concern: confirmar el pedido. Se mide: % confirmados'] },
});
// El contexto que arma ia-herramienta.js.
const CTX = { hoy: '2026-10-27', cliente: { slug: 'akai', nombre: 'AKAI', nivel: { id: 'partnership', nombre: 'Growth Partnership' } }, ficha: { incluye: [{ k: 'Áreas', v: '10 · Operación' }], fuera: 'nómina' },
  estrategia: { etapa: { n: 3, confirmada: true }, trabado: 'capacidad', meta: 'Vender 1.5M al año' }, entradas: [], aprendizajes: ['El seguimiento subió las ventas 12%'] };
const GRANDE = { hoy: '2026-10-27', cliente: { slug: 'x', nombre: 'N'.repeat(500), nivel: { id: 'partnership', nombre: 'P'.repeat(300) } },
  ficha: { incluye: Array.from({ length: 40 }, (_, i) => ({ k: `Clave ${i}`.padEnd(80, 'k'), v: 'v'.repeat(200) })), fuera: 'f'.repeat(3000) },
  estrategia: { etapa: { n: 9, confirmada: false }, trabado: 'oferta', meta: 'm'.repeat(1000) }, aprendizajes: Array.from({ length: 20 }, () => 'a'.repeat(500)),
  entradas: [{ tool: 'business-health-assessment', titulo: 'T'.repeat(300), version: 2, contenido: saludCompleta() }, { tool: 'root-cause-explorer', titulo: 'x', version: 1, contenido: causasCompleta() }] };
const llaves = (x, acc = new Set()) => { if (Array.isArray(x)) x.forEach((y) => llaves(y, acc)); else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { acc.add(k); llaves(v, acc); } return acc; };

// ---------- marcos ----------
t('objetivoBien: verbo + área + «de X a Y» (o X→Y) con números + fecha', () => {
  for (const o of [
    'Aumentar las ventas de $1M a $1.5M para el 31/12/2027',
    'Reducir el costo por cliente de Q80 a Q50 antes de diciembre de 2027',
    'Subir la retención de 35% a 50% para 2027-06-30',
    'Bajar el ciclo de venta de 45 días a 30 días para el 30/09/2027',
    'Lograr ventas de 20 → 35 clientes para el 15/03/2027',
    'Aumentar el margen 28% -> 35% antes del 1/7/2027',
    'Crecer las ventas del 10% al 20% para diciembre de 2027',
    'Aumentar las ventas de 1.000.000 a 1.500.000 para el 31 de diciembre de 2027',
  ]) assert.equal(M.objetivoBien(o), true, o);
  const no = {
    'sin X→Y': 'Aumentar las ventas para el 31/12/2027',
    'sin fecha': 'Aumentar las ventas de $1M a $1.5M',
    'sin verbo': 'Las ventas de $1M a $1.5M para el 31/12/2027',
    'sin área': 'Aumentar de 10 a 20 para el 31/12/2027',
    'fecha imposible': 'Aumentar las ventas de $1M a $1.5M para el 31/13/2027',
    'sin números': 'Aumentar las ventas de mucho a muchísimo para el 31/12/2027',
  };
  for (const [por, o] of Object.entries(no)) assert.equal(M.objetivoBien(o), false, por);
  for (const v of ['', '   ', null, undefined, 42, {}, []]) assert.equal(M.objetivoBien(v), false);
  assert.equal(M.objetivoFaltas('Aumentar las ventas de $1M a $1.5M').length, 1, 'dice qué falta');
  assert.equal(M.objetivoFaltas('Aumentar las ventas de $1M a $1.5M para el 31/12/2027').length, 0);
});

t('los marcos: 10 etapas, 8 funciones, 3 sistemas × 4 palancas, ecuación, BMC, BCG, ofertas, innovación y horizontes', () => {
  assert.deepEqual(M.ETAPAS_HORMOZI.map((e) => e.n), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(M.ETAPAS_HORMOZI.map((e) => e.nombre), ETAPAS.map((e) => e.nombre), 'los mismos nombres que estrategia.js');
  assert.deepEqual(M.FUNCIONES, ['producto', 'marketing', 'ventas', 'servicio', 'IT', 'reclutamiento', 'RR. HH.', 'finanzas']);
  assert.deepEqual(Object.keys(M.SISTEMAS), ['conversion', 'operations', 'money']);
  const ids = M.PALANCAS.map((p) => p.id);
  for (const s of Object.values(M.SISTEMAS)) { assert.equal(s.palancas.length, 4); assert.ok(s.nombre && s.para); for (const p of s.palancas) assert.ok(p.id && p.nombre && p.mide && p.sale_de); }
  assert.equal(M.PALANCAS.length, 12); assert.equal(new Set(ids).size, 12, 'ids únicos');
  assert.deepEqual(M.ECUACION, ['leads', 'conversion', 'ticket', 'frecuencia', 'retencion']);
  assert.ok(M.ECUACION.every((id) => M.nombreFactor(id) && M.nombreFactor(id) !== id));
  assert.equal(M.BMC.length, 9); assert.deepEqual(M.BMC.map((b) => b.id).slice(0, 2), ['segmentos', 'propuesta']);
  assert.deepEqual(M.BCG.map((b) => b.id), ['estrella', 'vaca', 'interrogante', 'perro']);
  assert.deepEqual(M.BCG.map((b) => b.accion), ['empujar', 'sostener', 'revisar', 'retirar']); assert.ok(M.BCG.every((b) => b.regla));
  assert.deepEqual(M.TIPOS_OFERTA.map((o) => o.id), ['atraccion', 'upsell', 'downsell', 'continuidad']);
  assert.deepEqual(M.INNOVACION.map((o) => o.id), ['producto', 'proceso', 'modelo', 'experiencia']);
  assert.deepEqual(M.HORIZONTES.map((h) => h.id), ['90d', '1-2', '3-5', '6-10']);
  assert.deepEqual(M.PORTER.map((p) => p.id), ['costos', 'diferenciacion', 'enfoque']);
  assert.equal(M.funcionDe('rrhh'), 'RR. HH.'); assert.equal(M.funcionDe('Recursos humanos'), 'RR. HH.'); assert.equal(M.funcionDe(' Ventas '), 'ventas'); assert.equal(M.funcionDe('it'), 'IT'); assert.equal(M.funcionDe('cocina'), '');
  assert.equal(M.idPalanca('conversion', 'Respuesta inmediata'), 'respuesta'); assert.equal(M.idPalanca('money', 'respuesta'), '');
});

t('etapaHormozi: una etapa vacía es «sin ubicar» (null), no la etapa 0 · Improvise; el 0 de verdad sí existe', () => {
  for (const v of [null, undefined, '']) assert.equal(M.etapaHormozi(v), null);
  assert.equal(M.etapaHormozi(0).nombre, 'Improvise');
  assert.equal(M.etapaHormozi('3').nombre, 'Stabilize');
  assert.equal(M.etapaHormozi(12), null);
  assert.match(salud.resumenTexto(salud.vacio()), /etapa sin ubicar/);
  assert.ok(!/Improvise/.test(salud.aMd(salud.vacio())));
});

t('cada ruta de hormozi-brain existe en disco: las 10 etapas, el overview, el 5-Star y los 4 tipos de oferta', () => {
  for (const e of M.ETAPAS_HORMOZI) assert.ok(fs.existsSync(RAIZ + e.ruta), `etapa ${e.n}: ${e.ruta}`);
  for (const [k, r] of Object.entries(M.RUTAS_HORMOZI)) assert.ok(fs.existsSync(RAIZ + r), `${k}: ${r}`);
  for (const o of M.TIPOS_OFERTA) assert.ok(fs.existsSync(RAIZ + o.ruta), `oferta ${o.id}: ${o.ruta}`);
  assert.ok(M.RUTAS_HORMOZI.cinco_estrellas.endsWith('02-5-star-service-framework.md'));
});

t('leerBloque y miles: el último bloque válido; JSON roto o a medias es null', () => {
  assert.deepEqual(M.leerBloque(`${F}x\n{"a":1}\n${F}\n${F}x\n{"a":2}\n${F}`, 'x'), { a: 2 });
  assert.equal(M.leerBloque(`${F}x\n{"a":`, 'x'), null);
  assert.equal(M.leerBloque(`${F}x\n[1]\n${F}`, 'x'), null, 'un arreglo no es un objeto');
  assert.equal(M.miles(1500000), '1,500,000'); assert.equal(M.miles(-1500.5), '-1,500.5'); assert.equal(M.miles(0.02), '0.02'); assert.equal(M.miles(null), '');
});

// ---------- salud ----------
t('salud: vacio trae las 12 palancas con puntaje null; el scorecard sale null sin datos', () => {
  const v = salud.vacio();
  assert.equal(Object.values(v.sistemas).flat().length, 12);
  assert.deepEqual(Object.values(v.sistemas).map((l) => l.length), [4, 4, 4]);
  assert.ok(Object.values(v.sistemas).flat().every((p) => p.puntaje === null && !p.evidencia && !p.fuente));
  assert.deepEqual(v.etapa, { n: null, por_que: '', cita: '', entre: null, falta: '' });
  assert.deepEqual(salud.scorecard(v), { conversion: null, operations: null, money: null });
  assert.equal(salud.palancasSinDatos(v).length, 12);
  assert.deepEqual(salud.limpiar(v), v, 'limpiar(vacio()) no cambia nada');
});

t('salud: puntajeSistema promedia solo los que tienen dato; el semáforo y las palancas completas', () => {
  assert.equal(salud.puntajeSistema([{ puntaje: 3 }, { puntaje: 4 }, { puntaje: null }, { puntaje: 5 }]), 4);
  assert.equal(salud.puntajeSistema([{ puntaje: null }, { puntaje: null }]), null);
  assert.equal(salud.puntajeSistema([]), null); assert.equal(salud.puntajeSistema(undefined), null);
  assert.deepEqual([1, 2.4, 2.5, 3.4, 3.5, 5, null].map(salud.semaforoDe), ['rojo', 'rojo', 'ambar', 'ambar', 'verde', 'verde', '']);
  const c = salud.limpiar({ sistemas: { conversion: [{ palanca: 'Seguimiento que no se enfría', puntaje: 2, fuente: 'CRM' }] } });
  assert.equal(salud.palancasDe(c, 'conversion').length, 4, 'palancasDe siempre da las 4');
  assert.equal(salud.palancasDe(c, 'conversion')[1].puntaje, 2);
  assert.equal(salud.palancasDe(c, 'money')[0].puntaje, null);
});

t('salud faltas: completo = ninguna; las 12 palancas, la fuente, la restricción, el medidor y las 3 prioridades', () => {
  assert.deepEqual(salud.faltas(saludCompleta()), []);
  const f = salud.faltas(salud.vacio());
  assert.ok(f.some((x) => /función/.test(x)) && f.some((x) => /medidor de capacidad/.test(x)) && f.some((x) => /3 prioridades \(hay 0\)/.test(x)) && f.some((x) => /etapa no está ubicada/.test(x)));
  assert.ok(!f.some((x) => /palancas/.test(x) || /fuente/.test(x)), 'una palanca sin puntaje y sin fuente es ⚠️ SIN DATOS, no una falta');
  let c = saludCompleta(); c.sistemas.conversion.pop();
  assert.ok(salud.faltas(c).some((x) => /Hay 11 de 12 palancas/.test(x) && /Saber qué pasó/.test(x)));
  c = saludCompleta(); c.sistemas.money[2].fuente = '';
  assert.ok(salud.faltas(c).some((x) => /Costo de adquisición/.test(x) && /sin fuente/.test(x)), 'puntaje sin fuente');
  c = saludCompleta(); c.sistemas.money[2].fuente = '⚠️ SIN DATOS';
  assert.ok(salud.faltas(c).some((x) => /Costo de adquisición/.test(x)), 'la fuente «SIN DATOS» tampoco vale con puntaje');
  c = saludCompleta(); c.sistemas.money[2].puntaje = null; c.sistemas.money[2].fuente = '';
  assert.deepEqual(salud.faltas(c), [], 'sin puntaje y sin fuente = ⚠️ SIN DATOS, se puede aprobar');
  c = saludCompleta(); c.restriccion.funcion = '';
  assert.ok(salud.faltas(c).some((x) => /función/.test(x)));
  c = saludCompleta(); c.capacidad = '';
  assert.ok(salud.faltas(c).some((x) => /medidor/.test(x)));
  c = saludCompleta(); c.prioridades.pop();
  assert.ok(salud.faltas(c).some((x) => /exactamente 3 prioridades \(hay 2\)/.test(x)));
  c = saludCompleta(); c.prioridades[1].numero = '';
  assert.ok(salud.faltas(c).some((x) => /prioridad 2 no dice qué número/.test(x)));
  c = saludCompleta(); c.etapa = { n: null, por_que: '', cita: '', entre: [3, 4], falta: 'cuántas personas trabajan' };
  assert.deepEqual(salud.faltas(c), [], 'una etapa que no calza clara pero dice entre cuáles y qué falta es válida');
});

t('salud faltas: con la capacidad en rojo no se recomienda más demanda', () => {
  const AVISO = 'Con la capacidad en rojo no se recomienda más demanda';
  let c = saludCompleta(); c.capacidad = 'rojo'; c.prioridades[1].que = 'Subir pauta';
  assert.ok(salud.faltas(c).some((x) => x.includes(AVISO)), 'rojo + «Subir pauta»');
  for (const que of ['Lanzar una campaña de anuncios', 'Meta Ads para más leads', 'Subir el volumen de tráfico', 'Aumentar la pauta']) { c = saludCompleta(); c.capacidad = 'rojo'; c.prioridades[0].que = que; assert.ok(salud.faltas(c).some((x) => x.includes(AVISO)), que); }
  c = saludCompleta(); c.prioridades[1].que = 'Subir pauta';
  assert.ok(!salud.faltas(c).some((x) => x.includes(AVISO)), 'en verde la pauta no es un problema');
  for (const que of ['Pausar la pauta y arreglar el seguimiento', 'Documentar el seguimiento de leads', 'Contratar a alguien que contesta antes de subir volumen']) { c = saludCompleta(); c.capacidad = 'rojo'; c.prioridades[0].que = que; assert.ok(!salud.faltas(c).some((x) => x.includes(AVISO)), `no recomienda demanda: ${que}`); }
  assert.equal(salud.capacidadRoja({ capacidad: 'rojo' }), true); assert.equal(salud.capacidadRoja({ capacidad: 'verde' }), false);
});

t('salud limpiar: tipos, rangos, sinónimos y orden; una segunda pasada no cambia nada', () => {
  const c = salud.limpiar({ etapa: { n: '3', entre: [4, 2] }, restriccion: { funcion: 'rrhh' }, capacidad: 'Ámbar',
    sistemas: { conversion: [{ palanca: 'seguimiento', puntaje: '4' }, { palanca: 'respuesta', puntaje: 9 }, { palanca: 'seguimiento', puntaje: 1 }, { palanca: 'inventada', puntaje: 3 }, 'x'] },
    prioridades: [{ orden: 3, que: 'C', numero: 5 }, { orden: 1, que: 'A' }, { que: '' }, { orden: 2, que: 'B' }, { orden: 4, que: 'D' }] });
  assert.equal(c.etapa.n, 3); assert.equal(c.etapa.entre, null, 'con etapa, no hay «entre»');
  assert.equal(salud.limpiar({ etapa: { entre: [4, 2] } }).etapa.entre.join(), '2,4');
  assert.equal(salud.limpiar({ etapa: { n: 12 } }).etapa.n, null);
  assert.equal(c.restriccion.funcion, 'RR. HH.'); assert.equal(c.capacidad, 'ambar');
  assert.deepEqual(c.sistemas.conversion.map((p) => [p.palanca, p.puntaje]), [['respuesta', null], ['seguimiento', 4]], 'en el orden del sistema; sin repetidas ni inventadas; fuera de 1-5 es null');
  assert.deepEqual(c.prioridades.map((p) => [p.orden, p.que, p.numero]), [[1, 'A', ''], [2, 'B', ''], [3, 'C', '5']]);
  assert.deepEqual(salud.limpiar(c), c);
  assert.deepEqual(salud.limpiar(null), salud.limpiar({})); assert.deepEqual(salud.limpiar('basura'), salud.limpiar({}));
});

// ---------- causas ----------
t('causas: la brecha y el factor con más brecha se calculan; sin datos es null, nunca 0', () => {
  assert.equal(causas.brecha({ meta: 1500000, actual: 1000000 }), 500000);
  assert.equal(causas.brecha({ meta: 1500000, actual: null }), null); assert.equal(causas.brecha(causas.vacio()), null); assert.equal(causas.brecha(undefined), null);
  assert.equal(causas.factorMayorBrecha(FACTORES), 'leads', 'leads: 3x; conversión 2x');
  assert.equal(causas.factorMayorBrecha(FACTORES.map((f) => (f.id === 'ticket' ? { ...f, necesario: 500 } : f))), 'ticket');
  assert.equal(causas.factorMayorBrecha(causas.vacio().factores), null, 'sin datos');
  assert.equal(causas.factorMayorBrecha(FACTORES.map((f) => (f.id === 'ticket' ? { ...f, actual: null } : f))), null, 'si falta uno de los 5, no se compara');
  assert.equal(causas.factorMayorBrecha(FACTORES.map((f) => (f.id === 'ticket' ? { ...f, actual: 0 } : f))), null, 'un actual en 0 no es dato');
  assert.equal(causas.factorMayorBrecha(FACTORES.slice(0, 3).concat([{ id: 'frecuencia', actual: null, necesario: null }]), { parcial: true }), 'leads', 'parcial: compara los que tienen dato');
  assert.equal(causas.factorMayorBrecha(undefined), null); assert.equal(causas.factorMayorBrecha([]), null);
  assert.deepEqual(causas.factoresSinDatos({ factores: FACTORES.slice(0, 3) }), ['frecuencia', 'retencion']);
  assert.equal(causas.factoresDe({}).length, 5);
});

t('causas faltas: un nodo validado sin evidencia no pasa', () => {
  assert.deepEqual(causas.faltas(causasCompleta()), []);
  const c = causasCompleta(); c.nodos[0].evidencia = '';
  const f = causas.faltas(c);
  assert.equal(f.length, 1); assert.match(f[0], /validada sin evidencia/);
  c.nodos[0].estado = 'hipotesis';
  assert.deepEqual(causas.faltas(c), [], 'sin evidencia sigue siendo hipótesis');
  assert.deepEqual(causas.faltas(causas.vacio()), []);
});

t('causas limpiar: factores únicos en orden, padres que existen, sin ciclos, ids que no chocan', () => {
  const c = causas.limpiar({ id: 'z', v: 3, _meta: { a: 1 }, meta: '1,500,000', actual: -5,
    factores: [{ id: 'retención', actual: '0.5', necesario: 1 }, { id: 'leads', actual: 1, necesario: 2 }, { id: 'leads', actual: 9 }, { id: 'otro' }],
    nodos: [{ id: 'a', padre: 'b', texto: 'A' }, { id: 'b', padre: 'a', texto: 'B', estado: 'Validada' }, { id: 'leads', padre: 'nadie', texto: 'C', sistema: 'Dinero' }, { id: 'a', padre: 'leads', texto: 'D', estado: 'descartado' }, { texto: '' }] });
  assert.deepEqual(Object.keys(c), ['meta', 'actual', 'factores', 'nodos']);
  assert.equal(c.meta, 1500000); assert.equal(c.actual, null);
  assert.deepEqual(c.factores.map((f) => f.id), ['leads', 'retencion']); assert.equal(c.factores[1].actual, 0.5);
  assert.equal(new Set(c.nodos.map((n) => n.id)).size, c.nodos.length, 'ids únicos');
  assert.ok(!c.nodos.some((n) => ['leads', 'raiz'].includes(n.id)), 'un nodo no se llama como un factor');
  const por = Object.fromEntries(c.nodos.map((n) => [n.texto, n]));
  assert.equal(por.A.padre, '', 'el ciclo a↔b se rompe'); assert.equal(por.B.padre, 'a'); assert.equal(por.B.estado, 'validada');
  assert.equal(por.C.padre, '', 'un padre que no existe cuelga de la raíz'); assert.equal(por.C.sistema, 'money');
  assert.equal(por.D.padre, 'leads'); assert.equal(por.D.estado, 'descartada');
  assert.equal(c.nodos.length, 4, 'sin texto no hay nodo');
  assert.deepEqual(causas.limpiar(c), c, 'una segunda pasada no cambia nada');
  assert.deepEqual(causas.limpiar(causas.vacio()), causas.vacio());
});

t('causas: las pruebas de las hipótesis abiertas son filas para tareas; el diagrama pinta el árbol', () => {
  const c = causas.limpiar(causasCompleta());
  assert.deepEqual(causas.tareasDe(c).map((x) => [x.title, x.fila]), [['Contar quién responde en una semana', 'c2']]);
  const d = causas.aDiagrama(c);
  assert.equal(d.dir, 'LR'); assert.equal(d.nodes.length, 1 + 5 + 2); assert.equal(d.edges.length, 5 + 2);
  const por = Object.fromEntries(d.nodes.map((n) => [n.id, n]));
  assert.equal(por.c1.fill, 'salvia', 'validada'); assert.equal(por.c2.fill, 'arena', 'hipótesis'); assert.equal(por.leads.fill, 'barro', 'el factor con más brecha');
  assert.match(por.raiz.text, /500,000/); assert.match(causas.aDiagrama(causas.vacio()).nodes[0].text, /SIN DATOS/);
  const n = normalize(d); assert.equal(n.nodes.length, d.nodes.length); assert.equal(n.edges.length, d.edges.length, 'diagram-model.js lo acepta completo');
  assert.ok(d.edges.every((e) => por[e.from] && por[e.to]));
  assert.match(causas.resumenTexto(c), /factor con más brecha es leads/);
});

// ---------- procesos ----------
t('procesos: un paso sin rol es una falta; sin pasos hoy también', () => {
  assert.deepEqual(procesos.faltas(procesosCompleto()), []);
  const c = procesosCompleto(); c.hoy[1].rol = '';
  const f = procesos.faltas(c);
  assert.equal(f.length, 1); assert.match(f[0], /Cotiza.*\(hoy\).*no tiene rol/);
  c.optimizado[0].rol = ' ';
  assert.equal(procesos.faltas(c).length, 2, 'también en el optimizado');
  assert.ok(procesos.faltas(procesos.vacio()).some((x) => /cómo se entrega hoy/.test(x)));
  assert.deepEqual(procesos.pasosSinRol(c).map((p) => p.lista), ['hoy', 'optimizado']);
});

t('procesos: manuales, fundador y medidas (minutos y pérdida salen null sin datos)', () => {
  const c = procesosCompleto();
  assert.deepEqual(procesos.pasosManuales(c).map((p) => p.id), ['p1', 'p2']);
  assert.deepEqual(procesos.pasosFundador(c).map((p) => p.id), ['p1']);
  assert.deepEqual(procesos.pasosManuales(c, 'optimizado'), []);
  const m = procesos.medidas(c.hoy);
  assert.deepEqual([m.pasos, m.manuales, m.fundador, m.minutos, m.sinMinutos, m.sinPerdida], [3, 2, 1, 55, 1, 1]);
  assert.deepEqual(m.mayorPerdida, { id: 'p1', nombre: 'Responde el WhatsApp', perdida: 30 });
  const v = procesos.medidas([{ id: 'x', nombre: 'x', minutos: null, perdida: null, modo: 'manual' }]);
  assert.equal(v.minutos, null); assert.equal(v.mayorPerdida, null);
  assert.deepEqual(procesos.medidas([]).minutos, null);
  const d = procesos.diferencias(c);
  assert.deepEqual([d.nuevos, d.quitados, d.cambiados.map((x) => x.id)], [['o2'], ['p2', 'p3'], ['p1']]);
  assert.deepEqual(d.cambiados[0].campos, ['minutos', 'modo', 'perdida', 'dolor', 'fundador']);
});

t('procesos: aDiagrama ida y vuelta conserva los ids (y todo lo demás); el nodo lleva carril por rol', () => {
  const pasos = procesos.limpiar(procesosCompleto()).hoy, d = procesos.aDiagrama(pasos);
  assert.deepEqual(d.nodes.map((n) => n.id), pasos.map((p) => p.id));
  assert.deepEqual(d.nodes.map((n) => n.lane), ['Ventas', 'Ventas', 'Operaciones']);
  assert.equal(d.nodes[0].y, d.nodes[1].y, 'mismo rol, mismo carril'); assert.notEqual(d.nodes[0].y, d.nodes[2].y);
  assert.equal(d.nodes[0].text, 'Responde el WhatsApp'); assert.deepEqual(d.edges.map((e) => [e.from, e.to]), [['p1', 'p2'], ['p2', 'p3']]);
  assert.deepEqual(procesos.dePasosDiagrama(d, pasos), pasos, 'ida y vuelta idéntica');
  assert.deepEqual(procesos.dePasosDiagrama(JSON.parse(JSON.stringify(d)), pasos), pasos, 'también por JSON');
  assert.deepEqual(procesos.dePasosDiagrama(normalize(d), pasos), pasos, 'y por normalize() (que aún puede no conocer lane)');
  assert.deepEqual(procesos.dePasosDiagrama(d).map((p) => [p.id, p.nombre, p.rol]), pasos.map((p) => [p.id, p.nombre, p.rol]), 'sin base: ids, nombre y rol vuelven del diagrama');
  const n = normalize(d); assert.equal(n.nodes.length, 3); assert.equal(n.edges.length, 2);
  // Editado: se renombra un nodo, se mueve de carril y se agrega uno nuevo.
  const e = JSON.parse(JSON.stringify(d)); e.nodes[1].text = 'Cotiza en 1 hora'; e.nodes[1].lane = 'Gerencia'; e.nodes.push({ id: 'n9', type: 'rect', x: 0, y: 0, w: 176, h: 64, text: 'Paso nuevo', fill: 'papel', lane: 'Ventas' });
  const v = procesos.dePasosDiagrama(e, pasos);
  assert.deepEqual(v.map((p) => p.id), ['p1', 'p2', 'p3', 'n9']);
  assert.equal(v[1].nombre, 'Cotiza en 1 hora'); assert.equal(v[1].rol, 'Gerencia'); assert.equal(v[1].minutos, 40, 'lo que el diagrama no dibuja se conserva');
  assert.deepEqual([v[3].modo, v[3].minutos, v[3].perdida, v[3].fundador], ['manual', null, null, false]);
  const sinRol = procesos.aDiagrama([{ ...pasos[0], rol: '' }]); assert.equal(sinRol.nodes[0].fill, 'barro', 'un paso sin rol se resalta');
});

t('procesos limpiar: pasos con tipo y rango; los ids no chocan entre listas; el estándar acepta texto u objetos', () => {
  const c = procesos.limpiar({ hoy: [{ nombre: 'Uno', etapa: 'Primer contacto', minutos: '15', perdida: '130', fundador: 'sí', modo: 'Automático' }, { id: 'x y', nombre: 'Dos', perdida: '30%' }, { id: 'x-y', nombre: 'Tres' }, { nombre: '' }, 'basura'],
    optimizado: [{ nombre: 'Nuevo' }], estandar: { promesa: 'P', pasos: ['a', { texto: 'b' }, 5, null, {}] } });
  assert.deepEqual(c.hoy.map((p) => p.id), ['h1', 'x-y', 'x-y-2']);
  assert.deepEqual([c.hoy[0].etapa, c.hoy[0].minutos, c.hoy[0].perdida, c.hoy[0].fundador, c.hoy[0].modo], ['contacto', 15, null, true, 'auto']);
  assert.equal(c.hoy[1].perdida, 30); assert.equal(c.hoy[1].modo, 'manual'); assert.equal(c.optimizado[0].id, 'o1', 'un paso nuevo no se confunde con uno de hoy');
  assert.deepEqual(c.estandar.pasos, ['a', 'b', '5']);
  assert.deepEqual(procesos.limpiar(c), c); assert.deepEqual(procesos.limpiar(procesos.vacio()), procesos.vacio());
  assert.equal(procesos.limpiar({ hoy: Array.from({ length: 80 }, (_, i) => ({ nombre: `p${i}` })) }).hoy.length, 30);
});

// ---------- prompt ----------
t('prompt de los 3: Evidencia o etiqueta, su BLOQUE y criterios, hormozi-brain y < 5 000 caracteres', () => {
  for (const [n, m, bloque] of MODULOS) {
    assert.equal(m.BLOQUE, bloque, n);
    for (const [nombre, ctx] of [['vacío', {}], ['sin argumento', undefined], ['normal', CTX], ['enorme', GRANDE]]) {
      const p = m.prompt(ctx);
      assert.equal(typeof p, 'string', `${n}/${nombre}`);
      assert.ok(p.length < 5000, `${n}/${nombre}: ${p.length} caracteres`);
      assert.ok(p.includes('Evidencia o etiqueta'), `${n}/${nombre}`);
      assert.ok(p.includes(`${F}${bloque}\n`) && p.includes(`${F}criterios\n`), `${n}/${nombre}: pide su bloque y criterios`);
      assert.ok(p.includes('agents/01-strategy/brain/skills/hormozi-brain'), `${n}/${nombre}: nombra hormozi-brain`);
      assert.ok(p.includes('«No está en el material»'), `${n}/${nombre}: cita o dice que no está`);
      assert.ok(p.includes('FUERA DEL ALCANCE') && p.includes('⚠️ SIN DATOS'), n);
      for (const m06 of p.matchAll(/06-ECONOMIA/g)) assert.match(p.slice(Math.max(0, m06.index - 40), m06.index), /Nunca leas ni cites inherent\/$/, `${n}: 06-ECONOMIA solo como algo que NO se lee`);
      assert.ok(!/costos? de inherent[^.]*lee/i.test(p));
    }
  }
});

t('prompt de salud: lee la etapa y trabado de Strategy (no los duplica) y pide 1 restricción, 12 palancas, FODA y 3 prioridades', () => {
  const p = salud.prompt(CTX);
  assert.ok(p.includes(M.RUTAS_HORMOZI.overview) && p.includes(M.etapaHormozi(3).ruta), 'overview + el stage del contexto');
  assert.match(p, /Strategy ya la ubicó en la 3 \(confirmada por el CEO\) y marcó que se traba en la capacidad/);
  assert.match(p, /no lo dupliques ni se lo vuelvas a preguntar/);
  assert.ok(p.includes('¿Dónde se traba?'), 'la semilla');
  assert.match(p, /exactamente 1/); assert.match(p, /LAS 12 PALANCAS/); assert.match(p, /FODA/); assert.match(p, /PRIORIDADES: 3/);
  for (const pal of M.PALANCAS) assert.ok(p.includes(`${pal.id} (${pal.nombre})`), pal.id);
  const TRES = /Ubícala con las 3 preguntas de hormozi-brain: ¿cuánto factura al mes y desde cuándo\?, ¿cuántas personas trabajan\?, ¿dónde se traba\?/;
  assert.match(p, TRES, 'las 3 preguntas, también cuando Strategy ya ubicó la etapa');
  const sin = salud.prompt({ ...CTX, estrategia: { etapa: null, trabado: '', meta: '' } });
  assert.match(sin, TRES); assert.match(sin, /Strategy aún no la ubica: la ubicas tú/);
  assert.ok(!sin.includes('stage-3-stabilize') && !/Strategy ya la ubicó/.test(sin));
  assert.match(salud.prompt({ ...CTX, cliente: { ...CTX.cliente, nivel: null }, ficha: null }), /nivel|SIN DATOS: sin ficha/);
});

t('prompt de causas: la raíz es la brecha de la meta de Strategy, los 5 factores y el diagnóstico aprobado', () => {
  const dx = { tool: 'business-health-assessment', titulo: 'Diagnóstico', version: 2, contenido: saludCompleta() };
  const p = causas.prompt({ ...CTX, entradas: [dx] });
  assert.match(p, /meta − actual/); assert.match(p, /ids leads, conversion, ticket, frecuencia, retencion/); assert.match(p, /toda causa nace como hipotesis/);
  assert.match(p, /Diagnóstico aprobado \(v2\): Diagnóstico: etapa 3 · Stabilize · restricción en ventas/);
  assert.match(causas.prompt(CTX), /Diagnóstico aprobado: ⚠️ SIN DATOS/);
  assert.match(p, /el OS lo calcula/);
});

t('prompt de procesos: el recorrido, hoy vs optimizado, las semillas y el 5-Star Service con su archivo', () => {
  const p = procesos.prompt(CTX);
  assert.match(p, /lead → contacto → venta → entrega → recompra/); assert.ok(p.includes(M.RUTAS_HORMOZI.cinco_estrellas));
  assert.ok(p.includes('«Mapa de procesos»') && p.includes('«Estándar de calidad»'));
  assert.match(p, /Concern, Courtesy, One & Done, Educate & Empower, Timeliness/); assert.match(p, /5 Star Service Framework SOP \| pág\. PDF/);
  assert.match(p, /hoy.*optimizado/s); assert.match(p, /fundador/);
  const e = procesos.prompt({ ...CTX, entradas: [{ tool: 'business-health-assessment', version: 1, contenido: saludCompleta() }, { tool: 'root-cause-explorer', version: 1, contenido: causasCompleta() }] });
  assert.match(e, /Entrada aprobada · Diagnóstico: etapa 3/); assert.match(e, /Entrada aprobada · Árbol de la brecha: brecha de 500,000/);
});

// ---------- leer ----------
t('leer: lee un bloque bien formado con sus criterios; a medias, roto o basura es null', () => {
  const casos = [['salud', salud, saludCompleta()], ['causas', causas, causasCompleta()], ['procesos', procesos, procesosCompleto()]];
  for (const [n, m, doc] of casos) {
    const bueno = `Resumen corto.\n${F}${m.BLOQUE}\n${JSON.stringify(doc)}\n${F}\n${F}criterios\n{"entregable":"x","cumple":["a","b"],"falta":["c — por qué"]}\n${F}\n`;
    const r = m.leer(bueno);
    assert.ok(r, n); assert.deepEqual(r.contenido, m.limpiar(doc), `${n}: contenido limpio`); assert.deepEqual(r.criterios, { cumple: ['a', 'b'], falta: ['c — por qué'] }, n);
    assert.deepEqual(m.leer(`${F}${m.BLOQUE}\n${JSON.stringify(doc)}\n${F}`).criterios, { cumple: [], falta: [] }, `${n}: sin criterios`);
    const entero = JSON.stringify(doc);
    assert.equal(m.leer(`Resumen.\n${F}${m.BLOQUE}\n${entero.slice(0, entero.length >> 1)}`), null, `${n}: bloque a medias`);
    assert.equal(m.leer(`${F}${m.BLOQUE}\n${entero.slice(0, entero.length >> 1)}\n${F}\n${F}criterios\n{"cumple":["a"],"falta":[]}\n${F}`), null, `${n}: a medias y seguido de criterios`);
    assert.equal(m.leer(`${F}${m.BLOQUE}\n{"roto": ,}\n${F}`), null, `${n}: JSON roto`);
    assert.equal(m.leer(`${F}${m.BLOQUE}\n[1,2,3]\n${F}`), null, `${n}: un arreglo no es contenido`);
    assert.equal(m.leer(`${F}otro\n${entero}\n${F}`), null, `${n}: otro bloque`);
    for (const basura of ['', 'hola', null, undefined, 42, {}, '```', `${F}${m.BLOQUE}`, '\u0000\u0001 <script>alert(1)</script>']) assert.equal(m.leer(basura), null, `${n}: ${String(basura).slice(0, 20)}`);
  }
});

// ---------- limpiar ----------
t('limpiar: quita las llaves desconocidas, id, v y _meta de arriba, y deja el HTML como texto', () => {
  const sucio = { id: 'x', v: 4, _meta: { creado: 1 }, raro: 'no', owner: 'a@b.c' };
  const h = '<img src=x onerror=alert(1)><b>negrita</b> & "comillas"';
  for (const [n, m, doc] of [['salud', salud, saludCompleta()], ['causas', causas, causasCompleta()], ['procesos', procesos, procesosCompleto()]]) {
    const c = m.limpiar({ ...doc, ...sucio });
    for (const k of Object.keys(sucio)) assert.ok(!(k in c), `${n}: ${k}`);
    assert.deepEqual(Object.keys(c), Object.keys(m.vacio()), `${n}: solo las llaves de la herramienta`);
  }
  // Más abajo: lo desconocido y _meta, v desaparecen (id solo queda donde es parte del contenido: factores, causas y pasos).
  const s = salud.limpiar({ ...saludCompleta(), etapa: { n: 3, id: 'q', v: 1, _meta: {}, raro: 1 }, sistemas: { conversion: [{ palanca: 'respuesta', puntaje: 3, id: 'a', v: 1, _meta: {}, raro: 1, fuente: 'x' }] }, prioridades: [{ orden: 1, que: 'A', numero: 'n', id: 'q', _meta: {} }] });
  assert.deepEqual([...llaves(s)].filter((k) => ['id', 'v', '_meta', 'raro'].includes(k)), [], 'salud: ni id, v, _meta ni raro en ningún nivel');
  const k = causas.limpiar({ ...causasCompleta(), nodos: [{ id: 'c1', texto: 'T', v: 2, _meta: {}, raro: 1 }], factores: [{ id: 'leads', actual: 1, necesario: 2, v: 1, _meta: {}, raro: 1 }] });
  assert.deepEqual([...llaves(k)].filter((x) => ['v', '_meta', 'raro'].includes(x)), [], 'causas');
  assert.deepEqual(Object.keys(k.nodos[0]), ['id', 'padre', 'texto', 'estado', 'evidencia', 'falta', 'prueba', 'sistema']);
  const p = procesos.limpiar({ hoy: [{ id: 'p1', nombre: 'P', v: 2, _meta: {}, raro: 1 }] });
  assert.deepEqual([...llaves(p)].filter((x) => ['v', '_meta', 'raro'].includes(x)), [], 'procesos');
  assert.deepEqual(Object.keys(p.hoy[0]), ['id', 'nombre', 'etapa', 'rol', 'minutos', 'modo', 'perdida', 'dolor', 'fundador']);
  // El HTML es texto: no se interpreta, no se quita y no se escapa (html`…` lo escapa al pintar).
  assert.equal(salud.limpiar({ restriccion: { por_que: h } }).restriccion.por_que, h);
  assert.equal(causas.limpiar({ nodos: [{ id: 'a', texto: h }] }).nodos[0].texto, h);
  assert.equal(procesos.limpiar({ hoy: [{ nombre: h, rol: h, dolor: h }] }).hoy[0].nombre, h);
  assert.equal(procesos.limpiar({ estandar: { promesa: h } }).estandar.promesa, h);
  // Lo que no es texto ni número no se vuelve «[object Object]».
  assert.equal(salud.limpiar({ restriccion: { por_que: { a: 1 } } }).restriccion.por_que, '');
  assert.equal(procesos.limpiar({ hoy: [{ nombre: 'P', dolor: ['x'] }] }).hoy[0].dolor, '');
  // Tamaños y caracteres de control.
  assert.equal(salud.limpiar({ restriccion: { por_que: 'x'.repeat(5000) } }).restriccion.por_que.length, 400);
  assert.equal(salud.limpiar({ restriccion: { por_que: 'a\u0000b\n\n c\t d' } }).restriccion.por_que, 'ab c d');
  // Lo que viaja por leer() también sale limpio.
  const r = causas.leer(`${F}causas\n${JSON.stringify({ id: 'x', _meta: 1, meta: 5, nodos: [{ id: 'a', texto: h, v: 3 }] })}\n${F}`);
  assert.equal(r.contenido.nodos[0].texto, h); assert.ok(!('id' in r.contenido) && !('_meta' in r.contenido));
});

// ---------- exportar ----------
t('aMd: markdown legible, lo que no tiene dato dice ⚠️ SIN DATOS', () => {
  const casos = [['salud', salud, saludCompleta(), '# Diagnóstico de crecimiento'], ['causas', causas, causasCompleta(), '# Árbol de la brecha'], ['procesos', procesos, procesosCompleto(), '# Mapa del camino del dinero']];
  for (const [n, m, doc, titulo] of casos) {
    const md = m.aMd(doc);
    assert.equal(typeof md, 'string', n); assert.ok(md.startsWith(titulo), n); assert.ok(md.split('\n').length > 8, n);
    const v = m.aMd(m.vacio()); assert.ok(v.includes('⚠️ SIN DATOS'), `${n}: vacío`); assert.ok(!/undefined|null|NaN|\[object/.test(v), `${n}: vacío sin basura`);
    assert.ok(!/undefined|NaN|\[object/.test(md), `${n}: lleno sin basura`);
    assert.equal(m.aMd(null).startsWith(titulo), true, `${n}: tolera basura`);
  }
  assert.match(salud.aMd(saludCompleta()), /\| Respuesta inmediata \| 3 \|/); assert.match(salud.aMd(saludCompleta()), /Conversion OS — 3 \/ 5/);
  assert.match(causas.aMd(causasCompleta()), /\*\*Factor con más brecha: Leads\*\*/);
  assert.match(causas.aMd(causasCompleta()), /\*\*\[validada\]\*\* Nadie responde/);
  const pipe = salud.limpiar(saludCompleta()); pipe.sistemas.money[0].evidencia = 'a|b';
  assert.match(salud.aMd(pipe), /a\\\|b/, 'una barra no rompe la tabla');
});

// ---------- puros ----------
t('puros: ningún módulo importa core, brandlist, stratlist, contexto ni app, ni toca el DOM o la red', () => {
  const PERMITIDOS = new Set(['./marcos.js', './salud.js', './causas.js', '../llm/modos.js', '../diagram-model.js']);
  for (const f of ['marcos', 'salud', 'causas', 'procesos']) {
    const src = fs.readFileSync(new URL(`../public/js/consulting/${f}.js`, import.meta.url), 'utf8');
    for (const m of src.matchAll(/from\s+'([^']+)'/g)) assert.ok(PERMITIDOS.has(m[1]), `${f}.js importa ${m[1]}`);
    assert.ok(!/\b(document|window|localStorage|fetch|innerHTML|XMLHttpRequest)\b/.test(src.replace(/\/\/.*$/gm, '')), `${f}.js toca el DOM o la red`);
    assert.ok(/^\/\/ /.test(src), `${f}.js abre con su comentario`);
  }
  assert.ok(!/from '\.\/(salud|causas|procesos)\.js'/.test(fs.readFileSync(new URL('../public/js/consulting/marcos.js', import.meta.url), 'utf8')), 'marcos no depende de las herramientas');
  for (const [, m] of MODULOS) for (const k of ['BLOQUE', 'vacio', 'prompt', 'leer', 'limpiar', 'faltas', 'aMd']) assert.ok(k in m, `falta export ${k}`);
});

console.log(`\n${ok} pruebas de Consulting pasaron`);
