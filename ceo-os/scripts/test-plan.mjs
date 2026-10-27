// Pruebas del Plan del mes (③ Marketing): lo que manda Claude se limpia, se junta, se revisa y pasa al calendario sin duplicar.
// npm run test:plan
import assert from 'node:assert/strict';
import { limpiarPlan, aplicarPlan, revisarSlots, sumaPilares, avancePlan, leerPlan, promptPlan, slotsAPiezas, diaDeSemana, idPlan } from '../public/js/plan-mes.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('Solo entran campos conocidos y el vocabulario del método', () => {
  const p = limpiarPlan({ campana: { nombre: 'El delivery', tipo: 'Campaña', hack: 1 }, slots: [{ canal: 'Instagram', semana: 9, funcion: 'hero', temperatura: 'frio', consciencia: 'inconsciente', balance: 'marca', objetivo: 'Que sepan' }], raro: 1 });
  assert.equal(p.campana.tipo, 'campaña'); assert.equal(p.raro, undefined); assert.equal(p.campana.hack, undefined);
  assert.deepEqual([p.slots[0].semana, p.slots[0].funcion, p.slots[0].temperatura, p.slots[0].consciencia, p.slots[0].balance, p.slots[0].id], [5, 'Hero', 'Frío', 'Inconsciente', 'Marca', 'MK-001']);
});
t('El parche se junta por sección y dice qué cambió', () => {
  const { plan, cambiadas } = aplicarPlan({ mensaje: [{ titulo: 'Ya' }] }, { pilares: [{ nombre: 'Prueba', peso: 60 }, { nombre: 'Antojo', peso: 40 }] }, '2026-10-21T00:00:00Z');
  assert.deepEqual(cambiadas, ['pilares']); assert.equal(plan.mensaje[0].titulo, 'Ya'); assert.equal(sumaPilares(plan.pilares), 100); assert.equal(plan.actualizado.pilares, '2026-10-21T00:00:00Z');
  assert.equal(avancePlan(plan), 2);
});
t('Las combinaciones prohibidas se marcan', () => {
  const a = revisarSlots([{ id: 'MK-001', funcion: 'Community', temperatura: 'Frío', traza: 'A' }, { id: 'MK-002', funcion: 'Conversion', consciencia: 'Inconsciente', balance: 'Marca' }, { id: 'MK-003', funcion: 'Hero', canal: 'TikTok', traza: 'B' }], [{ canal: 'TikTok', funcion: 'Series' }]);
  assert.equal(a.length, 3);
  assert.ok(a[0].avisos[0].includes('Community')); assert.equal(a[1].avisos.length, 3); assert.ok(a[2].avisos[0].includes('TikTok'));
});
t('El bloque final se lee y se quita del texto', () => {
  const r = leerPlan('Listo.\n```plan\n{"campana":{"nombre":"X","idea":"Y"},"pregunta":{"texto":"¿Pauta?","opciones":["Sí","No"]}}\n```');
  assert.equal(r.texto, 'Listo.'); assert.equal(r.parche.campana.nombre, 'X'); assert.deepEqual(r.pregunta.opciones, ['Sí', 'No']);
  assert.deepEqual(leerPlan('```plan\n{roto\n```').parche, {});
});
t('La primera vez el pedido lleva el método de Marketing y la estrategia', () => {
  const p = promptPlan({ marca: 'Ejemplo', slug: 'ejemplo', mes: '2026-10', estrategia: '{"meta":1}', pedido: 'Arma el plan', primera: true });
  for (const x of ['③ Marketing', 'agents/03-marketing/brain/WORKFLOW.md', 'plan-contratado.md', 'LA ESTRATEGIA EN EL OS', '```plan', 'octubre 2026', 'Pedido: Arma el plan']) assert.ok(p.includes(x), x);
  assert.ok(!promptPlan({ marca: 'E', slug: 'e', mes: '2026-10', pedido: 'Sigue', primera: false }).includes('WORKFLOW.md'));
});
t('Cada slot es una pieza del calendario, con id fijo y su semana', () => {
  assert.equal(diaDeSemana('2026-10', 1), '2026-10-01'); assert.equal(diaDeSemana('2026-10', 3), '2026-10-15'); assert.equal(diaDeSemana('2026-02', 5), '2026-02-28');
  const ps = slotsAPiezas({ campana: { nombre: 'El delivery' }, slots: [{ id: 'MK-001', semana: 2, canal: 'Instagram', formato: 'carrusel', objetivo: 'Responder «llega frío»' }] }, 'ejemplo', '2026-10');
  assert.equal(ps[0].id, 'post-ejemplo-2026-10-mk-001'); assert.equal(ps[0].data.format, 'Carrusel'); assert.equal(ps[0].data.date, '2026-10-08');
  assert.equal(ps[0].data.slot.plan, idPlan('ejemplo', '2026-10')); assert.equal(ps[0].data.campana, 'El delivery');
});

// Las ideas del chat: mensaje + formato que ya funciona + adaptación.
const { leerIdeas, promptIdeas } = await import('../public/js/ideas-chat.js');
t('Una idea trae qué comunicamos, el formato ganador y cómo se adapta', () => {
  const r = leerIdeas('Listo.\n```ideas\n{"ideas":[{"slot":"mk-1","titulo":"T","mensaje":"Llega caliente","referente":"https://ig/reel/1","por_que":"Comparación","adaptacion":"Pediste vs llegó"}]}\n```');
  assert.equal(r.ideas[0].slot, 'MK-1'); assert.equal(r.ideas[0].mensaje, 'Llega caliente'); assert.equal(r.ideas[0].adaptacion, 'Pediste vs llegó');
  const p = promptIdeas({ marca: 'X', slug: 'x', mes: '2026-10', slots: [], investigacion: '', formatos: 'FORMATOS DE LA MARCA…', pedido: 'Ideas', primera: true });
  assert.ok(p.includes('adaptacion') && p.includes('todavía no hay posts ganadores') && p.includes('FORMATOS DE LA MARCA…'));
});
// La línea del trabajo: cada herramienta viene de y pasa a una que existe.
// brandlist.js importa el DOM: se leen sus tres listas como datos.
const src = (await import('node:fs')).readFileSync(new URL('../public/js/brandlist.js', import.meta.url), 'utf8');
const lista = (nombre) => Function(`return ${src.match(new RegExp(`export const ${nombre} = ([\\[{][\\s\\S]*?\\n[\\]}]);`))[1]}`)();
const FLUJO = lista('FLUJO'), MODULES = lista('MODULES'), AREAS = lista('AREAS');
t('La línea del trabajo apunta a herramientas que existen; Marketing planea y Diseño crea', () => {
  const keys = MODULES.map(([k]) => k);
  for (const [k, [de, , a]] of Object.entries(FLUJO)) { assert.ok(keys.includes(k), k); if (de) assert.ok(keys.includes(de), de); if (a) assert.ok(keys.includes(a), a); }
  assert.deepEqual(AREAS.find(([k]) => k === 'planear')[3], ['plan', 'campanas']);
  assert.deepEqual(AREAS.find(([k]) => k === 'crear')[3], ['brief', 'formatos', 'ideas', 'creacion']);
  // cada grupo dice su área y cada módulo está en un solo grupo
  assert.ok(AREAS.every((g) => ['marketing', 'diseno', 'ambas'].includes(g[5])), 'cada grupo tiene área');
  const todos = AREAS.flatMap((g) => g[3]); assert.equal(new Set(todos).size, todos.length);
  assert.deepEqual([...new Set(todos)].sort(), [...keys].sort(), 'todos los módulos tienen grupo');
});

// Campañas y eventos (mk-campana): la anticipación, lo que falta y una por ciclo.
const C = await import('../public/js/campanas.js');
t('Campañas: la anticipación de mk-campana, lo que falta y una por ciclo', () => {
  const ev = C.limpiarCampana({ nombre: '  Cata de vinos ', tipo: 'Evento con cupo', ancla: '2026-11-28', frase: 'Que vengan a probar', mbt: 'B', se_nota: '+40 reservas', no_es: 'No es una fiesta', evento: { objetivo: 'Vender la membresía', medicion: 'Membresías vendidas', cupo: '60' }, canales: { 'primer-aviso': { instagram: { activo: true } } }, briefs: [{ fase: 'primer-aviso', canal: 'instagram', objetivo: 'Que se enteren' }], raro: 1 });
  assert.equal(ev.nombre, 'Cata de vinos'); assert.equal(ev.tipo, 'evento'); assert.equal(ev.evento.cupo, 60); assert.equal(ev.raro, undefined);
  assert.deepEqual(C.anticipacion(ev).map((x) => [x.fecha, x.que]), [['2026-11-07', 'Primer aviso'], ['2026-11-21', 'Recordatorio'], ['2026-11-26', 'Último empujón'], ['2026-11-28', 'El día']]);
  assert.deepEqual(C.revisarCampana(ev, '2026-10-26'), [], 'completa: no le falta nada');
  // promoción: el último día va sobre «hasta»
  const pr = C.limpiarCampana({ nombre: 'Black Friday', tipo: 'promocion', ancla: '2026-11-27', hasta: '2026-11-30' });
  assert.equal(C.anticipacion(pr).at(-1).fecha, '2026-11-30'); assert.equal(C.anticipacion(pr).at(-1).que, 'Último día');
  // lo que falta y las reglas
  const f = C.revisarCampana(C.limpiarCampana({ nombre: 'X', tipo: 'apertura', ancla: '2026-12-03' }), '2026-10-26');
  assert.ok(f.some((x) => /frase/.test(x)) && f.some((x) => /MUST BE TRUE/.test(x)) && f.some((x) => /qué NO es/.test(x)));
  assert.ok(f.some((x) => /ciclo anterior/.test(x)), 'una apertura el 3 se avisa desde el ciclo anterior');
  assert.ok(C.revisarCampana(C.limpiarCampana({ nombre: 'Y', tipo: 'promocion', ancla: '2026-12-04' }), '2026-12-01').some((x) => /llegó tarde/.test(x)), 'promo en los primeros 7 días y el ciclo ya empezó: llegó tarde');
  assert.ok(C.revisarCampana(C.limpiarCampana({ nombre: 'Z' })).some((x) => /pilar/.test(x)), 'sin fecha es un pilar');
  // una por ciclo, dos como máximo
  const xs = ['a', 'b', 'c'].map((n) => C.limpiarCampana({ nombre: n, tipo: 'campana', ancla: '2026-12-10', estado: 'En curso' }));
  assert.match(C.revisarMes(xs, '2026-12'), /3 campañas/); assert.equal(C.revisarMes(xs.slice(0, 2), '2026-12'), '');
  assert.equal(C.campanasDelMes([ev], '2026-11').length, 1); assert.equal(C.campanasDelMes([ev], '2026-10').length, 0);
  assert.equal(C.idCampana('nao', 'Apertura Cayalá!'), 'nao--apertura-cayala');
  assert.equal(C.leerCampana({ tipo: 'evento' }), null, 'sin nombre no hay campaña');
});

// El calendario de la marca: los 3 filtros.
const CV = await import('../public/js/calendario-vistas.js');
t('Calendario: Operativo, Planificación y Programado salen de lo que ya existe', () => {
  const ev = CV.eventosMarca({ slug: 'x', from: '2026-10-01', to: '2026-10-31', hoy: '2026-10-22',
    posts: [{ id: 'a', kind: 'post', date: '2026-10-05', status: 'Idea' }, { id: 'b', kind: 'post', date: '2026-10-23', status: 'Listo', time: '18:30', red: 'TikTok' }, { id: 'c', kind: 'post', date: '2026-10-24', status: 'Listo' }, { id: 'd', kind: 'post', date: '2026-11-02', status: 'Idea' }],
    shoots: [{ id: 's', profile: 'x', date: '2026-10-07' }, { id: 's2', profile: 'otra', date: '2026-10-07' }],
    projects: [{ id: 'p1', client_slug: 'x', name: 'Ciclo', meetings: [{ name: 'Día 1', date: '2026-10-01' }] }, { id: 'p2', client_slug: 'otra' }],
    tasks: [{ id: 't1', project_id: 'p1', due: '2026-10-10', title: 'Grabar' }, { id: 't2', project_id: 'p2', due: '2026-10-10' }, { id: 't3', project_id: 'p1', due: '2026-10-10', status: 'Hecha' }] });
  const de = (k) => ev.filter((e) => e.tipo === k);
  assert.equal(de('operativo').filter((e) => !e.ciclo).length, 3); assert.equal(de('operativo').filter((e) => e.ciclo).length, 3);
  assert.equal(de('planificacion').length, 1); assert.ok(de('planificacion')[0].late);
  assert.equal(de('programado').length, 2); assert.ok(de('programado').find((e) => e.k === 'p-c').falta); assert.ok(!de('programado').find((e) => e.k === 'p-b').falta);
  assert.equal(CV.redDe({ format: 'TikTok' }), '');
});

// ---------- Content Strategy Studio: el diff de la IA, la suma de pilares, el techo y lo que se revisa antes de «Pasar a Ideas» ----------
const P = await import('../public/js/plan-mes.js');
const ACTUAL = {
  campana: { nombre: 'El delivery', idea: 'Que llegue caliente', tipo: 'campaña', traza: 'A', meta: '+8% pedidos' },
  mensaje: [{ titulo: 'Llega caliente', para: 'Quien pide', consciencia: 'Inconsciente' }],
  pilares: [{ nombre: 'Prueba', peso: 60 }, { nombre: 'Antojo', peso: 40 }],
  canales: [{ canal: 'Instagram', funcion: 'Proof y Hero' }],
  slots: [{ id: 'MK-001', semana: 1, canal: 'Instagram', formato: 'Reel', funcion: 'Hero', temperatura: 'Frío', consciencia: 'Inconsciente', balance: 'Activación', objetivo: 'Que sepan', traza: 'A' },
    { id: 'MK-002', semana: 2, canal: 'Instagram', formato: 'Carrusel', funcion: 'Proof', temperatura: 'Tibio', consciencia: 'Consciente del problema', balance: 'Activación', objetivo: 'Probarlo', traza: 'A' }],
};
t('sumaPilares acepta la lista o el plan, y una lista vacía suma 0 (no inventa 100)', () => {
  assert.equal(P.sumaPilares(ACTUAL.pilares), 100); assert.equal(P.sumaPilares(ACTUAL), 100);
  assert.equal(P.sumaPilares([]), 0); assert.equal(P.sumaPilares({}), 0); assert.equal(P.sumaPilares([{ peso: 30 }, { peso: 'x' }]), 30);
});
t('Ajustar a 100 reparte en proporción, sin perder ni sobrar un punto', () => {
  assert.deepEqual(P.ajustarA100([{ nombre: 'a', peso: 60 }, { nombre: 'b', peso: 30 }]).map((x) => x.peso), [67, 33]);
  assert.deepEqual(P.ajustarA100([{ peso: 0 }, { peso: 0 }, { peso: 0 }]).map((x) => x.peso), [34, 33, 33]);
  for (const l of [[{ peso: 10 }, { peso: 10 }, { peso: 10 }], [{ peso: 1 }, { peso: 99 }], [{ peso: 33 }, { peso: 33 }, { peso: 33 }, { peso: 7 }]]) assert.equal(P.sumaPilares(P.ajustarA100(l)), 100);
  assert.deepEqual(P.ajustarA100([]), []); assert.equal(P.ajustarA100([{ nombre: 'solo', peso: 5 }])[0].nombre, 'solo');
});
t('difPlan: cada sección dice antes, después y si cambia; lo que la IA no trae no cambia', () => {
  const d = P.difPlan(ACTUAL, { pilares: [{ nombre: 'Prueba', peso: 50 }, { nombre: 'Antojo', peso: 30 }, { nombre: 'Comunidad', peso: 20 }], canales: [], campana: { nombre: 'El delivery', idea: 'Que llegue caliente', tipo: 'Campaña', traza: 'A', meta: '+8% pedidos' }, raro: 1 });
  assert.deepEqual(Object.keys(d), ['campana', 'mensaje', 'pilares', 'canales', 'slots']);
  assert.equal(d.pilares.cambia, true); assert.equal(d.pilares.antes.length, 2); assert.equal(d.pilares.despues.length, 3);
  assert.equal(d.campana.cambia, false, 'la misma campaña (con otra escritura) no cambia');
  assert.equal(d.canales.cambia, false, 'una lista vacía no borra la sección'); assert.deepEqual(d.canales.despues, d.canales.antes);
  assert.equal(d.mensaje.cambia, false); assert.deepEqual(d.slots.despues, d.slots.antes);
  assert.equal(P.difPlan({}, {}).slots.cambia, false); assert.equal(P.difPlan({}, {}).campana.antes, null); assert.deepEqual(P.difPlan({}, {}).pilares.antes, []);
});
t('difPlan: el orden de los slots no cuenta; un cambio de campo sí; no escribe en lo que recibe', () => {
  const invertidos = [...ACTUAL.slots].reverse(), copia = JSON.stringify(ACTUAL);
  assert.equal(P.difPlan(ACTUAL, { slots: invertidos }).slots.cambia, false);
  const otro = ACTUAL.slots.map((s) => (s.id === 'MK-002' ? { ...s, semana: 3 } : s));
  const d = P.difPlan(ACTUAL, { slots: otro, campana: { nombre: 'El delivery', idea: 'Otra idea' } });
  assert.equal(d.slots.cambia, true); assert.equal(d.campana.cambia, true); assert.equal(JSON.stringify(ACTUAL), copia);
  assert.equal(P.difPlan({ campana: { nombre: 'X' } }, { campana: { nombre: 'Y' } }).campana.despues.nombre, 'Y');
});
t('El detalle del diff: filas nuevas, quitadas y cambiadas, y un resumen corto', () => {
  const nuevos = [...ACTUAL.slots.filter((s) => s.id !== 'MK-001').map((s) => ({ ...s, semana: 4 })), { id: 'MK-003', semana: 1, canal: 'TikTok', formato: 'TikTok', funcion: 'Series' }];
  const d = P.difPlan(ACTUAL, { slots: nuevos }), x = P.detalleDif('slots', d.slots);
  assert.deepEqual(x.nuevas.map((s) => s.id), ['MK-003']); assert.deepEqual(x.quitadas.map((s) => s.id), ['MK-001']);
  assert.equal(x.cambiadas.length, 1); assert.deepEqual(x.cambiadas[0].campos.map((c) => [c.campo, c.antes, c.despues]), [['semana', 2, 4]]);
  assert.equal(P.resumenDif('slots', d.slots), '1 nueva · 1 quitada · 1 cambian');
  const c = P.difPlan(ACTUAL, { campana: { nombre: 'El delivery', idea: 'Otra', meta: '+10%' } });
  assert.deepEqual(P.detalleDif('campana', c.campana).campos.map((y) => y.campo), ['idea', 'tipo', 'meta', 'traza']);
  assert.equal(P.resumenDif('campana', c.campana), '4 campos cambian'); assert.equal(P.resumenDif('pilares', P.difPlan(ACTUAL, {}).pilares), '');
  assert.equal(P.resumenDif('pilares', P.difPlan(ACTUAL, { pilares: [{ nombre: 'Prueba', peso: 60 }, { nombre: 'Antojo', peso: 40 }, { nombre: 'Nuevo', peso: 0 }] }).pilares), '1 nuevo');
});
t('El mensaje por consciencia: 5 filas fijas, los planes de antes quedan sin nivel y se guarda sin perder nada', () => {
  const l = P.limpiarPlan({ mensaje: [{ titulo: 'Uno', consciencia: 'inconsciente' }, { titulo: 'Dos', consciencia: '4' }, { titulo: 'De antes', para: 'x' }, { titulo: 'Raro', consciencia: 'nada' }] }).mensaje;
  assert.deepEqual(l.map((m) => m.consciencia), ['Inconsciente', 'Consciente del producto', undefined, undefined]);
  const { niveles, sinNivel } = P.mensajeEnNiveles(l);
  assert.equal(niveles.length, 5); assert.equal(niveles[0].titulo, 'Uno'); assert.equal(niveles[3].titulo, 'Dos'); assert.equal(niveles[1].titulo, '');
  assert.deepEqual(sinNivel.map((m) => m.titulo), ['De antes', 'Raro']);
  assert.equal(P.nivelesAMensaje(niveles, sinNivel).length, 4, 'las filas vacías no se guardan');
  assert.deepEqual(P.limpiarPlan({ mensaje: P.nivelesAMensaje(niveles, sinNivel) }).mensaje, l, 'ida y vuelta sin pérdidas');
  assert.equal(P.limpiarPlan({ mensaje: [{ titulo: 'Sin nivel' }] }).mensaje[0].consciencia, undefined, 'el nivel es opcional');
  assert.equal(P.mensajeEnNiveles([{ titulo: 'A', consciencia: 'Inconsciente' }, { titulo: 'B', consciencia: 'Inconsciente' }]).sinNivel[0].titulo, 'B', 'dos del mismo nivel: el segundo queda aparte');
});
t('Lo que dice una ficha de piezas al mes: solo con claridad, nunca a ojo', () => {
  assert.equal(P.piezasDeTexto('12 piezas al mes'), 12); assert.equal(P.piezasDeTexto('12 Piezas / mes (4 reels y 8 estáticos)'), 12);
  assert.equal(P.piezasDeTexto('4 reels + 8 estáticos + 12 stories'), 24);
  assert.equal(P.piezasDeTexto('9 planificados + 4 derivados, TOTAL mínimo 13'), 13);
  assert.equal(P.piezasDeTexto('3 reels por semana'), null, 'una cadencia no se multiplica a ojo');
  assert.equal(P.piezasDeTexto('9 videos planificados + 4 derivados'), null, 'si un número no es de una pieza, no se suma una parte');
  assert.equal(P.piezasDeTexto('Los define esta ficha por ciclo'), null); assert.equal(P.piezasDeTexto(''), null); assert.equal(P.piezasDeTexto(null), null);
});
t('El techo sale de la ficha; sin total, de la estrategia aprobada (y lo dice); sin nada, null y nunca 0', () => {
  const f = (v) => ({ hay: true, incluye: [{ k: 'Resultado que busca', v: 'Más pedidos' }, { k: 'Frecuencia y volumen', v }] });
  const a = P.leerTecho({ ficha: f('20 piezas al mes'), viva: { contenido: { piezas: 14 } } });
  assert.deepEqual([a.piezas, a.fuente, a.hayFicha], [20, 'ficha', true]); assert.match(a.texto, /^Frecuencia y volumen: 20/);
  const b = P.leerTecho({ ficha: f('3 por semana'), viva: { contenido: { piezas: 14 } } });
  assert.deepEqual([b.piezas, b.fuente], [14, 'estrategia']); assert.match(b.texto, /3 por semana/, 'la línea de la ficha se muestra aunque no dé el total');
  const c = P.leerTecho({ ficha: f('3 por semana'), viva: {} });
  assert.deepEqual([c.piezas, c.fuente], [null, '']); assert.equal(P.leerTecho({ ficha: { hay: false }, viva: { contenido: { piezas: 14 } } }).hayFicha, false);
  assert.equal(P.leerTecho({}).hayFicha, null, 'sin lectura de la ficha no se sabe'); assert.equal(P.leerTecho({ viva: { contenido: { piezas: 0 } } }).piezas, null);
});
t('Los slots que pasan el techo se marcan (los últimos por semana) y sin techo no se marca ninguno', () => {
  const s = [{ id: 'A', semana: 3 }, { id: 'B', semana: 1 }, { id: 'C', semana: 1 }, { id: 'D', semana: 2 }];
  assert.deepEqual(P.techoSlots(s, 2), { techo: 2, total: 4, sobran: 2, fuera: ['D', 'A'] });
  assert.deepEqual(P.techoSlots(s, { piezas: 4, fuente: 'ficha' }), { techo: 4, total: 4, sobran: 0, fuera: [] });
  for (const sin of [null, undefined, 0, NaN, { piezas: null }]) assert.deepEqual(P.techoSlots(s, sin), { techo: null, total: 4, sobran: null, fuera: [] });
});
t('Los avisos juntan lo prohibido y el techo; sin techo son los de revisarSlots', () => {
  const plan = { slots: [{ id: 'MK-001', semana: 1, canal: 'IG', funcion: 'Hero', traza: 'A' }, { id: 'MK-002', semana: 2, canal: 'IG', funcion: 'Community', temperatura: 'Frío', traza: 'A' }, { id: 'MK-003', semana: 3, canal: 'IG', funcion: 'Hero', traza: 'A' }], canales: [] };
  assert.deepEqual(P.avisosPlan(plan).map((a) => [a.id, a.fuera]), [['MK-002', false]]);
  assert.deepEqual(P.avisosPlan(plan).map(({ id, avisos }) => ({ id, avisos })), P.revisarSlots(plan.slots, plan.canales), 'sin techo = revisarSlots');
  const conTecho = P.avisosPlan(plan, { piezas: 2, fuente: 'ficha' });
  assert.deepEqual(conTecho.map((a) => [a.id, a.fuera]), [['MK-002', false], ['MK-003', true]]);
  assert.match(conTecho[1].avisos[0], /FUERA DEL ALCANCE.*techo de la ficha \(2 al mes\)/);
  assert.match(P.avisosPlan(plan, { piezas: 2, fuente: 'estrategia' })[1].avisos[0], /estrategia aprobada/);
});
t('Antes de «Pasar a Ideas»: los pilares a 100 bloquean; lo del techo y lo prohibido se marca', () => {
  const ok = { ...ACTUAL, slots: ACTUAL.slots.map((s) => ({ ...s })) };
  assert.deepEqual(P.revisarParaIdeas(ok, {}), { bloquea: [], avisos: [], fuera: 0 });
  assert.deepEqual(P.revisarParaIdeas({ ...ok, pilares: [{ nombre: 'Prueba', peso: 60 }, { nombre: 'Antojo', peso: 30 }] }).bloquea, ['Los pilares suman 90%, no 100%']);
  assert.match(P.revisarParaIdeas({ ...ok, pilares: [] }).bloquea[0], /Faltan los pilares/);
  assert.match(P.revisarParaIdeas({ ...ok, slots: [] }).bloquea[0], /todavía no tiene piezas/);
  assert.match(P.revisarParaIdeas(ok, { sinFicha: true }).bloquea[0], /Sin ficha de oferta/);
  const r = P.revisarParaIdeas(ok, { techo: { piezas: 1, fuente: 'ficha' } });
  assert.equal(r.bloquea.length, 0); assert.equal(r.fuera, 1); assert.deepEqual(r.avisos.map((a) => a.id), ['MK-002']);
});
t('Dos canales con la misma función se avisan y un slot nuevo toma el siguiente id sin renumerar', () => {
  assert.deepEqual(P.funcionesRepetidas([{ canal: 'Instagram', funcion: 'Proof y Hero' }, { canal: 'TikTok', funcion: 'proof y hero' }, { canal: 'Email', funcion: '' }, { canal: 'WhatsApp', funcion: 'Conversion' }]), [['Instagram', 'TikTok']]);
  assert.equal(P.idSlotNuevo([]), 'MK-001'); assert.equal(P.idSlotNuevo([{ id: 'MK-001' }, { id: 'MK-007' }, { id: 'MK-003' }]), 'MK-008'); assert.equal(P.idSlotNuevo([{ id: 'raro' }]), 'MK-001');
  assert.equal(P.limpiarPlan({ slots: [{ id: P.idSlotNuevo([{ id: 'MK-009' }]), canal: 'Instagram' }] }).slots[0].id, 'MK-010', 'cabe en el id de 12');
});
t('El pedido de la herramienta lleva la ficha, el techo y el mensaje por consciencia, y la pauta va sin montos', () => {
  const p = P.promptStudio({ cliente: { nombre: 'Akai', slug: 'akai' }, mes: '2026-11', plan: ACTUAL, pedido: 'Empujemos el combo', techo: { piezas: 20, fuente: 'ficha' }, ficha: { incluye: [{ k: 'Frecuencia y volumen', v: '20 piezas al mes' }], fuera: 'pauta' },
    estrategiaTexto: P.estrategiaTexto({ nivel: { nombre: 'Brand Growth' }, vivaAprobada: { en: 'x' }, viva: { meta: { objetivo: 50000 }, pauta: { mensual: 3000, cpm: 60 }, contenido: { piezas: 14 } } }) });
  for (const x of ['Content Strategy Studio', 'noviembre 2026', 'LA FICHA DE OFERTA', 'Frecuencia y volumen: 20 piezas al mes', 'Techo de piezas al mes: 20', 'FUERA DEL ALCANCE', '```plan', '"consciencia": "Inconsciente"', 'por nivel de consciencia', 'EL PLAN COMO VA', 'Pedido: Empujemos el combo', '"piezas":14']) assert.ok(p.includes(x), x);
  assert.ok(!p.includes('3000') && !p.includes('"cpm"'), 'ni el monto ni el CPM de la pauta viajan al modelo');
  assert.ok(P.promptStudio({}).includes('Pedido: Arma o ajusta el plan'), 'sin pedido, el de siempre');
  assert.equal(P.estrategiaTexto(null), ''); assert.equal(P.estrategiaTexto({}), ''); assert.ok(P.estrategiaTexto({ viva: { pauta: { mensual: 5 } } }).includes('"entra":true'));
  assert.ok(promptPlan({ marca: 'E', slug: 'e', mes: '2026-10', pedido: 'x', primera: true }).includes('el chat de Diseño gráfico'), 'el chat de Diseño sigue igual');
});
t('Lo que la IA devuelve se lee, se limpia y se compara; un bloque roto no cambia nada', () => {
  const r = leerPlan('Listo.\n```plan\n{"pilares":[{"nombre":"Prueba","peso":70},{"nombre":"Antojo","peso":40}],"slots":[{"id":"MK-001","semana":1,"canal":"Instagram","formato":"Reel","funcion":"hero"}],"hack":1}\n```');
  const d = P.difPlan(ACTUAL, r.parche);
  assert.equal(d.pilares.cambia, true); assert.equal(P.sumaPilares(d.pilares.despues), 110, 'se ve que no suma 100 antes de aceptar'); assert.equal(d.slots.despues.length, 1);
  assert.equal(d.slots.cambia, true); assert.equal(P.detalleDif('slots', d.slots).quitadas.length, 1, 'la IA que trae menos slots deja ver los que quita');
  assert.deepEqual(Object.keys(d), ['campana', 'mensaje', 'pilares', 'canales', 'slots'], 'un campo desconocido no abre una sección');
  assert.ok(Object.values(P.difPlan(ACTUAL, leerPlan('```plan\n{roto\n```').parche)).every((x) => !x.cambia));
});
console.log(`\n${ok} pruebas pasaron`);
