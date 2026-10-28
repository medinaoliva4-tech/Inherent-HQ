// Pruebas de las 2 herramientas de Consulting de la etapa P2: Equipo para la siguiente etapa (organization-architect) y Automation
// Opportunity Finder. Cuidan que cada fila de la RACI lleve exactamente una A, que cada decisión del fundador tenga destino, que
// lo que falta salga null y diga ⚠️ SIN DATOS (nunca 0), que las horas no se inventen, que lo que pierde ventas vaya primero y que
// cada módulo lea y limpie lo que contesta un modelo. node scripts/test-consulting-p2.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUTAS_HORMOZI, SIN_DATOS } from '../public/js/consulting/marcos.js';
import * as P from '../public/js/consulting/procesos.js';
import * as O from '../public/js/consulting/organizacion.js';
import * as A from '../public/js/consulting/automatizacion.js';

const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..');
let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const bloque = (tag, o) => `\`\`\`${tag}\n${typeof o === 'string' ? o : JSON.stringify(o)}\n\`\`\``;
const CRIT = bloque('criterios', { entregable: 'x', cumple: ['a'], falta: ['b'] });

const MAPA = P.limpiar({ hoy: [
  { id: 'h1', nombre: 'Responde el WhatsApp', etapa: 'contacto', rol: 'Ventas', minutos: 15, modo: 'manual', perdida: 30, fundador: true },
  { id: 'h2', nombre: 'Seguimiento a cotizaciones', etapa: 'venta', rol: 'Ventas', minutos: null, modo: 'manual', perdida: 20, fundador: false },
  { id: 'h3', nombre: 'Genera la factura', etapa: 'entrega', rol: 'Admin', minutos: 10, modo: 'manual', perdida: null, fundador: false },
  { id: 'h4', nombre: 'Agenda la cita', etapa: 'contacto', rol: 'Ventas', minutos: 2, modo: 'auto', perdida: 5, fundador: false },
] });
const CTX = { cliente: { nombre: 'Cliente de prueba', slug: 'demo' }, hoy: '2026-10-27', estrategia: { etapa: { n: 3, confirmada: true } },
  entradas: [{ tool: 'process-mapper', contenido: MAPA }, { tool: 'business-health-assessment', contenido: {} }] };

const ORG = {
  hoy: [{ id: 'h1', rol: 'Fundador', reporta: '', fundador: true }, { id: 'h2', rol: 'Ventas', reporta: 'h1' }],
  siguiente: { etapa: 4, headcount: '6 personas', rol_fundador: 'Dirige y delega', cita: '[ROADMAP VIDEO | STAGE 4 | 00:10:00]', puestos: [{ id: 's1', rol: 'Fundador', reporta: '', fundador: true }, { id: 's2', rol: 'Gerente de operaciones', reporta: 's1' }] },
  decisiones: [{ texto: 'Responder cotizaciones', destino: 'delega', criterio: 'Hasta Q5,000 decide Ventas', rol: 'Ventas' }, { texto: 'Fijar precios', destino: 'queda' }, { texto: 'Aprobar cada post', destino: 'elimina', criterio: 'Hay guía de marca' }],
  valores: [{ valor: 'Velocidad', criterio: 'Si el lead espera más de 5 minutos, se contesta antes que cualquier otra cosa' }],
  raci: { roles: [{ id: 'r1', nombre: 'Fundador' }, { id: 'r2', nombre: 'Ventas' }], filas: [{ actividad: 'Cotizar', celdas: { r1: 'I', r2: 'A' } }] },
  perfiles: [{ rol: 'Gerente de operaciones', mision: 'Que la entrega salga a tiempo', responde_por: ['Entregas'], decide: [], escala: [], mide: [] }],
  rituales: [{ id: 'monday-hour-one', nombre: 'Monday Hour One', ritmo: 'Cada lunes', dueno: 'Gerente de operaciones' }, { id: 'gametape', nombre: 'Gametape Review', ritmo: 'Cada mes', dueno: 'Ventas' }],
  estructura: ['¿Qué figura legal conviene?'],
};

// ---------- Equipo para la siguiente etapa ----------
t('organizacion · el método de Hormozi que cita existe en el repo', () => {
  for (const r of O.RITUALES) assert.ok(existsSync(join(RAIZ, r.ruta)), r.ruta);
  assert.ok(existsSync(join(RAIZ, RUTAS_HORMOZI.monday_hour_one)) && existsSync(join(RAIZ, RUTAS_HORMOZI.gametape)));
  assert.deepEqual(O.RITUALES.map((r) => r.id), ['monday-hour-one', 'gametape']);
});

t('organizacion · limpiar: ids únicos, jefes que existen, sin ciclos y celdas solo R, A, C o I', () => {
  const c = O.limpiar({ hoy: [{ id: 'a', rol: 'A', reporta: 'b' }, { id: 'b', rol: 'B', reporta: 'a' }, { id: 'a', rol: 'Otro', reporta: 'a' }, { id: 'c', rol: 'C', reporta: 'zzz' }, { rol: '' }, 'x'],
    raci: { roles: [{ id: 'r1', nombre: 'Uno' }], filas: [{ actividad: 'X', celdas: { r1: 'a', r9: 'A', r2: 'Z' } }, { actividad: 'Y', celdas: { r1: 'Z' } }] },
    decisiones: [{ texto: 'D', destino: 'Se delega' }, { texto: 'E', destino: 'se elimina' }, { texto: 'F', destino: 'raro' }], siguiente: { etapa: 14 } });
  assert.equal(new Set(c.hoy.map((p) => p.id)).size, c.hoy.length, 'ids únicos');
  assert.equal(c.hoy.length, 4, 'sin rol o no objeto, se cae');
  const by = Object.fromEntries(c.hoy.map((p) => [p.id, p]));
  assert.ok(by.a.reporta === '' || by.b.reporta === '', 'el ciclo se corta');
  assert.equal(by.c.reporta, '', 'un jefe que no existe se limpia');
  assert.deepEqual(c.raci.filas[0].celdas, { r1: 'A' }, 'solo roles que existen y letras válidas, en mayúscula');
  assert.deepEqual(c.raci.filas[1].celdas, {});
  assert.deepEqual(c.decisiones.map((d) => d.destino), ['delega', 'elimina', '']);
  assert.equal(c.siguiente.etapa, null, 'una etapa fuera de 0-9 es null');
  assert.deepEqual(O.limpiar(c), c, 'idempotente');
  for (const x of [null, undefined, 'texto', 7, [], { id: 'x' }]) assert.deepEqual(O.limpiar(x), { ...O.vacio(), rituales: [], estructura: [] }, 'sin dato no se inventan filas');
  assert.ok(!JSON.stringify(O.limpiar({ ...ORG, v: 3, id: 'd', _meta: { por: 'x' }, secreto: 'SECRETO' })).includes('SECRETO'));
});

t('organizacion · RACI: cada fila exactamente una A (con 0 o 2 bloquea)', () => {
  const con = (celdas) => ({ ...ORG, raci: { roles: ORG.raci.roles, filas: [{ actividad: 'Cotizar', celdas }] } });
  const raci = (celdas) => O.faltas(con(celdas), {}).filter((x) => x.includes('RACI'));
  assert.equal(raci({ r1: 'I', r2: 'A' }).length, 0);
  assert.match(raci({ r1: 'R', r2: 'I' })[0], /ninguna A/);
  assert.match(raci({ r1: 'A', r2: 'A' })[0], /2 A/);
  assert.equal(O.conteoA({ celdas: { r1: 'A', r2: 'R' } }), 1);
  assert.equal(O.filasSinUnaA(O.limpiar(con({ r1: 'A', r2: 'A' }))).length, 1);
});

t('organizacion · cada decisión del fundador tiene destino y las dos columnas salen de ahí', () => {
  const f = (d) => O.faltas({ ...ORG, decisiones: d }, {});
  assert.ok(f([{ texto: 'Fijar precios', destino: '' }]).some((x) => /no tiene destino/.test(x)));
  assert.ok(f([{ texto: 'X', destino: 'delega', criterio: '', rol: 'Ventas' }]).some((x) => /sin criterio/.test(x)));
  assert.ok(f([{ texto: 'X', destino: 'delega', criterio: 'si pasa Y', rol: '' }]).some((x) => /sin rol/.test(x)));
  assert.ok(f([{ texto: 'X', destino: 'elimina' }]).some((x) => /sin decir por qué/.test(x)));
  assert.equal(f(ORG.decisiones).filter((x) => /decisi/.test(x)).length, 0);
  const col = O.columnas(O.limpiar(ORG));
  assert.deepEqual([col.fundador.length, col.nuncaLlega.length, col.sinDestino.length], [1, 2, 0]);
  assert.ok(O.faltas({ ...ORG, decisiones: [] }, { pasosFundador: ['Responde el WhatsApp'] }).some((x) => /Mapa marca 1 paso/.test(x)));
});

t('organizacion · aprobar: valores sin criterio, perfiles, rituales y preguntas del especialista', () => {
  assert.deepEqual(O.faltas(ORG, {}), [], 'un contenido completo no falta nada');
  assert.ok(O.faltas({ ...ORG, valores: [{ valor: 'Velocidad', criterio: '' }] }).some((x) => /no es un criterio/.test(x)));
  assert.ok(O.faltas({ ...ORG, perfiles: [] }).some((x) => /Gerente de operaciones.*no tiene perfil/.test(x)), 'el del fundador no lleva perfil');
  assert.ok(O.faltas({ ...ORG, rituales: [ORG.rituales[0]] }).some((x) => /Gametape Review necesita ritmo y dueño/.test(x)));
  assert.ok(O.faltas({ ...ORG, estructura: [] }).some((x) => /estructura corporativa/.test(x)));
  assert.ok(O.faltas({ ...ORG, siguiente: { ...ORG.siguiente, cita: '' } }).some((x) => /cita/.test(x)));
  assert.ok(O.faltas(O.vacio()).length >= 6, 'vacío falta de todo');
  assert.ok(O.vacio().estructura.every((q) => /^¿.*\?$/.test(q)), 'la estructura corporativa son preguntas, no estructura legal');
});

t('organizacion · el diagrama: un nodo por puesto, una arista por jefe y de arriba hacia abajo', () => {
  const d = O.aDiagrama(O.limpiar(ORG).siguiente.puestos);
  assert.equal(d.dir, 'TD'); assert.equal(d.nodes.length, 2); assert.equal(d.edges.length, 1);
  assert.ok(d.nodes[1].y > d.nodes[0].y, 'el subordinado va abajo');
  assert.equal(d.nodes[0].fill, 'tierra', 'el fundador se distingue');
  assert.equal(O.aDiagrama([]).nodes.length, 0);
  assert.equal(O.aDiagrama(null).edges.length, 0);
});

t('organizacion · el pedido (< 5 000), lee su bloque y no pide el equipo ni las recetas de Inherent', () => {
  const p = O.prompt(CTX);
  assert.ok(p.length < 5000, `${p.length} caracteres`);
  for (const x of ['```organizacion', '```criterios', 'monday-hour-one', 'gametape', 'Responde el WhatsApp', 'stage-4']) assert.ok(p.includes(x), x);
  assert.ok(/No leas el equipo ni las recetas de Inherent/.test(p));
  assert.ok(O.prompt({}).length < 5000 && O.prompt({}).includes(SIN_DATOS));
  const r = O.leer(`Listo.\n${bloque(O.BLOQUE, ORG)}\n${CRIT}`);
  assert.deepEqual(r.contenido.decisiones.map((d) => d.destino), ['delega', 'queda', 'elimina']);
  assert.deepEqual(r.criterios.falta, ['b']);
  for (const basura of ['hola', '', null, 42, bloque(O.BLOQUE, 'no es json'), bloque(O.BLOQUE, '[1]'), bloque('otro', ORG), CRIT]) assert.equal(O.leer(basura), null, String(basura).slice(0, 30));
});

t('organizacion · exportar: lo que falta dice SIN DATOS, no 0', () => {
  const md = O.aMd(O.vacio());
  assert.ok(md.startsWith('# Equipo para la siguiente etapa') && md.includes(SIN_DATOS) && !/\b0 puestos\b/.test(md));
  const lleno = O.aMd(ORG);
  for (const x of ['Solo el fundador', 'Nunca le debería llegar', 'Matriz RACI', 'Monday Hour One', 'Gametape Review', 'preguntas para el especialista']) assert.ok(lleno.includes(x), x);
  assert.match(O.resumenTexto(ORG), /1 decisiones se quedan con el fundador y 2 no le deberían llegar/);
});

// ---------- Automation Opportunity Finder ----------
t('automatizacion · las filas nacen de los pasos manuales de hoy del Mapa, sin inventar impacto, esfuerzo ni horas', () => {
  const s = A.desdeProcesos(MAPA);
  assert.deepEqual(s.map((f) => f.id), ['h1', 'h2', 'h3'], 'el paso automático no entra');
  assert.ok(s.every((f) => f.impacto === null && f.esfuerzo === null && f.horas_mes === null && f.elegida === false));
  assert.deepEqual(s.map((f) => f.pierde), ['leads', 'ventas', ''], 'solo clasifica lo que el Mapa dice que se pierde');
  assert.equal(A.desdeProcesos(MAPA, [{ id: 'h1' }]).length, 2, 'no repite lo que ya está');
  assert.deepEqual(A.desdeProcesos(null), []);
});

const FILAS = A.limpiar({ filas: [
  { id: 'a', paso: 'Genera la factura', etapa: 'entrega', pierde: 'tiempo', impacto: 5, esfuerzo: 1 },
  { id: 'b', paso: 'Responde el WhatsApp', etapa: 'contacto', pierde: 'leads', impacto: 4, esfuerzo: 3, perdida: 30 },
  { id: 'c', paso: 'Seguimiento', etapa: 'venta', pierde: 'ventas', impacto: 5, esfuerzo: 2, perdida: 20, horas_mes: 12, fuente_horas: 'Gerente, 20 oct', que: 'Recordatorios', elegida: true },
  { id: 'd', paso: 'Sin evaluar', pierde: 'cobro' },
  { id: 'e', paso: 'Cobro', pierde: 'cobro', impacto: 2, esfuerzo: 5 },
] });

t('automatizacion · el cuadrante: sin impacto o sin esfuerzo no hay cuadrante (null, no «después»)', () => {
  assert.equal(A.cuadranteDe({ impacto: 5, esfuerzo: 1 }), 'ya');
  assert.equal(A.cuadranteDe({ impacto: 4, esfuerzo: 3 }), 'planear');
  assert.equal(A.cuadranteDe({ impacto: 3, esfuerzo: 2 }), 'rapido');
  assert.equal(A.cuadranteDe({ impacto: 2, esfuerzo: 5 }), 'despues');
  assert.equal(A.cuadranteDe({ impacto: null, esfuerzo: 1 }), null);
  assert.equal(A.cuadranteDe({}), null);
  const q = A.porCuadrante(FILAS);
  assert.deepEqual([q.ya.length, q.planear.length, q.despues.length, q.sinEvaluar.length], [2, 1, 1, 1]);
});

t('automatizacion · primero lo que pierde leads o ventas, aunque otro paso tenga más impacto', () => {
  const o = A.ordenar(FILAS.filas);
  assert.deepEqual(o.map((f) => f.id), ['c', 'b', 'e', 'd', 'a'], 'seguimiento y WhatsApp (pierden) antes que la factura; sin evaluar al final de su grupo');
  assert.deepEqual(o.map((f) => f.prioridad), [1, 2, 3, 4, 5]);
  assert.ok(A.pierdeVentas({ pierde: 'cobro' }) && !A.pierdeVentas({ pierde: 'tiempo' }) && !A.pierdeVentas({ pierde: '' }));
  assert.deepEqual(A.ordenar(null), []);
});

t('automatizacion · las horas son del cliente: sin cifra, null (nunca 0, nunca los minutos del paso)', () => {
  assert.equal(FILAS.filas.find((f) => f.id === 'a').horas_mes, null);
  assert.equal(A.limpiar({ filas: [{ paso: 'X', horas_mes: 'mucho' }] }).filas[0].horas_mes, null);
  assert.deepEqual(A.horasElegidas({ filas: [{ id: 'x', paso: 'X', elegida: true, horas_mes: null }] }), { horas: null, sinDato: 1 });
  assert.deepEqual(A.horasElegidas(FILAS), { horas: 12, sinDato: 0 });
  assert.deepEqual(A.horasElegidas(A.vacio()), { horas: null, sinDato: 0 });
  assert.ok(A.faltas({ filas: [{ paso: 'X', impacto: 3, esfuerzo: 3, horas_mes: 5, fuente_horas: '', elegida: true, que: 'q' }] }).some((x) => /horas sin fuente/.test(x)));
  assert.ok(A.faltas({ filas: [{ paso: 'X', impacto: 3, esfuerzo: 3, horas_mes: null, elegida: true, que: 'q' }] }).length === 0, 'sin horas es válido: dice SIN DATOS');
});

t('automatizacion · cada fila elegida se manda al Plan de 90 días con su sistema', () => {
  const plan = A.paraPlan(FILAS);
  assert.deepEqual(plan.map((f) => f.id), ['c']);
  assert.equal(plan[0].sistema, 'conversion'); assert.equal(plan[0].que, 'Recordatorios');
  assert.equal(A.sistemaDe({ etapa: 'entrega' }), 'operations');
  assert.equal(A.sistemaDe({ etapa: 'entrega', pierde: 'cobro' }), 'money');
  assert.deepEqual(A.paraPlan(A.vacio()), []);
  assert.ok(A.faltas({ filas: [{ paso: 'X', impacto: 3, esfuerzo: 3 }] }).some((x) => /al menos una fila/.test(x)));
  assert.ok(A.faltas({ filas: [{ paso: 'X', impacto: 3, esfuerzo: 3, elegida: true }] }).some((x) => /qué se automatiza/.test(x)));
  assert.ok(A.faltas(FILAS).some((x) => /«Sin evaluar» no tiene impacto ni esfuerzo/.test(x)));
  assert.match(A.faltas(A.vacio())[0], /Mapa del camino del dinero aprobado/);
  assert.ok(A.avisos({ filas: [{ paso: 'Factura', pierde: 'tiempo', elegida: true }, { paso: 'WhatsApp', pierde: 'leads' }] })[0].includes('WhatsApp'));
});

t('automatizacion · limpiar, el pedido (< 5 000) y leer', () => {
  const sucio = A.limpiar({ filas: [{ id: 'x', paso: '<script>alert(1)</script>', impacto: 9, esfuerzo: 0, pierde: 'Leads', etapa: 'Contacto', raro: 1 }, { id: 'x', paso: 'Otro' }, { paso: '' }], id: 'd', v: 2, secreto: 'S' });
  assert.deepEqual(Object.keys(sucio), ['filas']);
  assert.equal(sucio.filas.length, 2); assert.notEqual(sucio.filas[0].id, sucio.filas[1].id);
  assert.equal(sucio.filas[0].paso, '<script>alert(1)</script>', 'el HTML queda como texto');
  assert.deepEqual([sucio.filas[0].impacto, sucio.filas[0].esfuerzo, sucio.filas[0].pierde, sucio.filas[0].etapa], [null, null, 'leads', 'contacto']);
  assert.deepEqual(A.limpiar(sucio), sucio, 'idempotente');
  for (const x of [null, undefined, 'texto', 7, [], { id: 'x' }]) assert.deepEqual(A.limpiar(x), A.vacio());
  const p = A.prompt(CTX);
  assert.ok(p.length < 5000, `${p.length} caracteres`);
  for (const x of ['```automatizacion', '```criterios', 'Responde el WhatsApp', 'h1:', 'nunca las calcules de los minutos', 'Genera la factura']) assert.ok(p.includes(x), x);
  assert.ok(!p.includes('Agenda la cita'), 'el paso automático no va');
  assert.ok(A.prompt({}).includes(SIN_DATOS) && A.prompt({}).length < 5000);
  assert.deepEqual(A.leer(`Listo.\n${bloque(A.BLOQUE, { filas: [{ id: 'h1', paso: 'WhatsApp', impacto: 5, esfuerzo: 2 }] })}\n${CRIT}`).contenido.filas.map((f) => f.id), ['h1']);
  for (const basura of ['hola', '', null, 42, bloque(A.BLOQUE, 'no es json'), bloque(A.BLOQUE, '[1]'), bloque('otro', { filas: [] }), CRIT]) assert.equal(A.leer(basura), null, String(basura).slice(0, 30));
  const md = A.aMd(A.vacio());
  assert.ok(md.startsWith('# Automation Opportunity Finder') && md.includes(SIN_DATOS));
  assert.ok(A.aMd(FILAS).includes('Va al Plan de 90 días') && A.aMd(FILAS).includes(`| ${SIN_DATOS} |`));
});

// ---------- Los dos ----------
t('los 2 · puros: sin DOM, red, economía ni raw(); no leen el equipo ni las recetas; las vistas sin raw ni red', () => {
  for (const n of ['organizacion', 'automatizacion']) {
    const src = readFileSync(join(AQUI, '..', 'public/js/consulting', `${n}.js`), 'utf8');
    assert.ok([...src.matchAll(/^import .* from '(.+)';/gm)].every((x) => /^\.\/(marcos|procesos|salud)\.js$|^\.\.\/diagram-model\.js$/.test(x[1])), `${n}: sus imports`);
    assert.ok(!/\b(document|window|localStorage|fetch|XMLHttpRequest)\b/.test(src.replace(/\/\/.*$/gm, '')), `${n}: sin DOM ni red`);
    assert.ok(!/api\/repo\/economia|cost_recipes|\brates\b|payroll|\bcoll\(|\/api\//.test(src), `${n}: no toca la economía ni las colecciones de Inherent`);
    assert.ok(!/raw\(|innerHTML/.test(src), `${n}: no arma HTML`);
    const ui = readFileSync(join(AQUI, '..', 'public/js/consulting', `${n}-ui.js`), 'utf8');
    assert.ok(!/raw\(|innerHTML\s*=(?!\s*'')|\bfetch\(|client: true|localStorage/.test(ui), `${n}-ui: sin raw, red directa ni localStorage`);
  }
});

console.log(`\n${ok} pruebas de Consulting (P2: equipo y automatización) pasaron`);
