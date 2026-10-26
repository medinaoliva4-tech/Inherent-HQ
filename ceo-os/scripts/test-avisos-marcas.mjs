// Avisos · clientes-marcas: cada regla del grupo con datos armados y el día fijo (el plan del mes, las campañas, las piezas, el
// diseño y la grabación de cada marca). Puro: no toca la base ni la red. Uso: node scripts/test-avisos-marcas.mjs
import assert from 'node:assert/strict';
import { personaDe, correr, posponer, aplicarPospuestos } from '../public/js/avisos-reglas/base.js';
import { CLIENTES_MARCAS } from '../public/js/avisos-reglas/clientes-marcas.js';
import { candado } from '../public/js/calendario-contenido.js';
import { slotsAPiezas } from '../public/js/plan-mes.js';

let n = 0;
const t = (nombre, fn) => { fn(); n++; console.log('✓', nombre); };
const vacio = { tasks: [], projects: [], team: [], leads: [], quotes: [], invoices: [], accounts: [], content: [], campaigns: [], mentors: [], strategy: [], plans: [], campanas: [], ad_variants: [], judgments: [], clientes: [], yo: {}, settings: {}, guias: [], env: null, push: { listo: false }, tieneGoogle: true };
const datos = (o = {}) => ({ ...vacio, ...o });

// Las personas: el CEO (sin nadie más con el perfil content, el operador es él), el operador (perfil content, edita Marcas),
// quien solo ve Marcas · contenido completo, quien la ve en «resumen», el COO por defecto (sin Marcas) y el COO con Marcas.
const CEO = personaDe({ email: 'ceo@x.com', role: 'ceo' });
const OPE = personaDe({ email: 'ope@x.com', role: 'team', areas: ['home', 'work', 'content'] });
const VE = personaDe({ email: 've@x.com', role: 'team', areas: ['work', 'content'], niveles: { content: 'completo' } });
const VEOP = personaDe({ email: 'veop@x.com', role: 'team', areas: ['work', 'content'], niveles: { content: 'completo' } });
const RES = personaDe({ email: 'res@x.com', role: 'team', areas: ['work', 'content'], niveles: { content: 'resumen' } });
const COO = personaDe({ email: 'coo@x.com', role: 'coo', areas: ['home', 'control', 'clients', 'sales', 'operations', 'work', 'resultados', 'library', 'team'] });
const COOC = personaDe({ email: 'cooc@x.com', role: 'coo', areas: ['clients', 'operations', 'work', 'content'], niveles: { content: 'completo' } });
const YO = { [OPE.email]: { roles: ['content'] }, [VEOP.email]: { roles: ['content'] } };
const TODOS = [CEO, OPE, VE, VEOP, RES, COO, COOC];

// Un cliente como lo arma avisos-datos.js (más briefCiclo y aprobada, los datos nuevos de este grupo).
const NOMBRES = { foundation: 'Brand Foundation', growth: 'Brand Growth', partnership: 'Growth Partnership', medida: 'A la medida' };
const C = (slug, nivel = 'growth', o = {}) => ({ slug, nombre: o.nombre || slug.toUpperCase(), presentes: o.presentes || [], ...('briefCiclo' in o ? { briefCiclo: o.briefCiclo } : {}), ...('aprobada' in o ? { aprobada: o.aprobada } : {}),
  ficha: { hay: true, nombre: o.nombre || slug.toUpperCase(), plan: '', nivel: nivel ? { id: nivel, nombre: NOMBRES[nivel] } : null, linea: '', incluye: [], fuera: '', pipeline: o.pipeline ?? [], redes: o.redes ?? '' } });
const P = (...pasos) => pasos.map((paso) => ({ paso, que: '…' }));
const pres = (...xs) => xs.map((x) => (Array.isArray(x) ? { id: x[0], mes: x[1], variante: '', costos: false } : { id: x, mes: '', variante: '', costos: false }));
const post = (id, date, o = {}) => ({ id, kind: 'post', profile: 'akai', title: 'Pieza ' + id, format: 'Reel', status: 'Idea', date, ...o });
const shoot = (id, date, o = {}) => ({ id, kind: 'shoot', profile: 'akai', title: 'Grabación ' + id, status: 'Por grabar', date, ...o });
const SLOT = (id, o = {}) => ({ id, semana: 1, canal: 'Instagram', formato: 'Reel', funcion: 'Hero', temperatura: 'Frío', consciencia: 'Inconsciente', balance: 'Marca', objetivo: 'o', traza: 'A', ...o });
const plan = (o = {}) => ({ id: 'akai--2026-11', profile: 'akai', mes: '2026-11', ...o });
// La marca de siempre: Brand Growth, con el brief de comunicación de noviembre y la estrategia aprobada.
const AKAI = (o = {}) => C('akai', 'growth', { presentes: pres(['brief-comunicacion', '2026-11']), aprobada: true, ...o });

const regla = (id) => CLIENTES_MARCAS.find((r) => r.id === id) || assert.fail('falta la regla ' + id);
const corre = (id, d, p = CEO, hoy = '2026-10-26') => { const r = correr([regla(id)], datos({ yo: YO[p.email] || {}, ...d }), p, hoy); assert.deepEqual(r.errores, [], id); return r.items; };
const urg = (id, d, hoy, p = CEO) => corre(id, d, p, hoy).map((x) => x.urgencia);
const DIAS = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-09', '2026-10-13', '2026-10-17', '2026-10-20', '2026-10-26', '2026-12-28'];

t('el grupo: ids únicos, grupo clientes y, con datos vacíos, ninguna regla falla ni avisa', () => {
  const ids = CLIENTES_MARCAS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['mk-plan-del-mes', 'cr-sin-brief', 'cr-ideas-faltan', 'gd-sin-sistema-visual', 'pr-dia11-grabacion', 'ciclo-20-faltan-piezas', 'pz-vencidas', 'mk-campana-a-tiempo', 'mk-campana-sin-piezas', 'mk-plan-por-revisar', 'mk-plan-desactualizado', 'mk-canal-fuera-ficha', 'mk-campana-incompleta', 'gd-por-disenar', 'po-sin-hora-red']) regla(id);
  assert.equal(ids.length, 15);
  for (const r of CLIENTES_MARCAS) { assert.equal(r.grupo, 'clientes', r.id); assert.ok(['alta', 'media', 'baja'].includes(r.urgencia), r.id); assert.equal(typeof r.calcular, 'function', r.id); }
  for (const hoy of DIAS) for (const p of TODOS) { const r = correr(CLIENTES_MARCAS, datos({ yo: YO[p.email] || {} }), p, hoy); assert.deepEqual(r.errores, []); assert.deepEqual(r.items, []); }
  // Una marca con lo mínimo (sin presentes, sin nivel, piezas y campañas a medias) tampoco rompe nada.
  const raro = datos({ clientes: [{ slug: 'x', nombre: 'X', ficha: { hay: true } }, { slug: 'y' }], plans: [{ id: 'x--2026-11', slots: [{}], a_creatividad: '2026-10-02' }], campanas: [{ profile: 'x', nombre: 'Z' }, { profile: 'x', nombre: 'W', ancla: '2026-11-02', estado: 'En curso' }], content: [{ kind: 'post', profile: 'x' }, { kind: 'shoot', profile: 'x' }, null] });
  for (const hoy of DIAS) assert.deepEqual(correr(CLIENTES_MARCAS, raro, CEO, hoy).errores, []);
});

t('la marca personal nunca, sin ficha nada, y en «resumen» o sin Marcas no sale nada', () => {
  const content = [post('a', '2026-10-20'), post('b', '2026-10-20', { profile: 'personal' }), post('c', '2026-11-03', { profile: 'personal' })];
  const clientes = [{ ...AKAI(), slug: 'personal', nombre: 'Mi marca' }, { slug: 'nao', nombre: 'NAO', ficha: { hay: false }, presentes: [] }];
  for (const hoy of DIAS) for (const p of TODOS) assert.deepEqual(correr(CLIENTES_MARCAS, datos({ clientes, content, yo: YO[p.email] || {} }), p, hoy).items, [], `${p.email} ${hoy}`);
  const d = datos({ clientes: [AKAI({ briefCiclo: [] })], content: [post('a', '2026-10-20')] });
  for (const hoy of DIAS) { assert.deepEqual(correr(CLIENTES_MARCAS, d, RES, hoy).items, [], 'resumen ' + hoy); assert.deepEqual(correr(CLIENTES_MARCAS, d, COO, hoy).items, [], 'COO ' + hoy); }
});

t('mk-plan-del-mes: vacío, borrador o sin pasar; media del 1 al 3, alta desde el 4, nada después del 20', () => {
  const c = { clientes: [AKAI()] };
  const [x] = corre('mk-plan-del-mes', c, CEO, '2026-10-02');
  assert.equal(x.titulo, 'El plan de noviembre de AKAI está vacío'); assert.equal(x.clave, 'mk-plan-del-mes:akai');
  assert.deepEqual(x.accion, { label: 'Armar el plan', href: '#/marcas/akai/plan/2026-11' });
  assert.deepEqual(['2026-10-01', '2026-10-03', '2026-10-04', '2026-10-13', '2026-10-20', '2026-10-21', '2026-10-26'].map((h) => urg('mk-plan-del-mes', c, h).join()), ['media', 'media', 'alta', 'alta', 'alta', '', '']);
  assert.equal(corre('mk-plan-del-mes', c, VE, '2026-10-02')[0].accion.label, 'Ver el plan', 'quien no edita, solo lo ve');
  assert.equal(corre('mk-plan-del-mes', { ...c, plans: [plan({ campana: { nombre: 'N' }, mensaje: [{ titulo: 'm' }] })] }, CEO, '2026-10-02')[0].titulo, 'El plan de noviembre de AKAI va en borrador: 2 de 5');
  // Con slots y sin pasar: el botón lo pasa (solo quien edita); con slots por revisar, primero se ve.
  const conSlots = { ...c, plans: [plan({ slots: [SLOT('MK-001'), SLOT('MK-002')] })] };
  const [y] = corre('mk-plan-del-mes', conSlots, CEO, '2026-10-05');
  assert.equal(y.titulo, 'El plan de noviembre de AKAI tiene 2 piezas sin pasar a Ideas');
  assert.deepEqual(y.accion.api, { method: 'POST', ruta: 'plan/akai/2026-11/a-creatividad', body: {} });
  const [v] = corre('mk-plan-del-mes', conSlots, VE, '2026-10-05');
  assert.ok(v.accion.href && /Las pasa quien edita/.test(v.detalle));
  assert.equal(corre('mk-plan-del-mes', { ...c, plans: [plan({ slots: [SLOT('MK-001', { traza: '' })] })] }, CEO, '2026-10-05')[0].accion.label, 'Revisar y pasar');
  assert.deepEqual(corre('mk-plan-del-mes', { ...c, plans: [plan({ slots: [SLOT('MK-001')], a_creatividad: '2026-10-03T10:00:00Z' })] }, CEO, '2026-10-05'), [], 'ya pasó a Ideas');
});

t('mk-plan-del-mes: bloqueado sin estrategia aprobada o sin brief de comunicación, sin botón; y solo si corren ③ y ④', () => {
  const b = (o, p = CEO) => corre('mk-plan-del-mes', { clientes: [AKAI(o)] }, p, '2026-10-05')[0];
  let x = b({ aprobada: false });
  assert.equal(x.titulo, 'El plan de noviembre de AKAI está bloqueado: falta la estrategia aprobada'); assert.equal(x.accion, null); assert.match(x.detalle, /la apruebas tú/);
  assert.match(b({ aprobada: false }, OPE).detalle, /la aprueba el CEO/);
  assert.equal(b({ presentes: [] }).titulo, 'El plan de noviembre de AKAI está bloqueado: falta el brief de comunicación');
  assert.equal(b({ presentes: pres(['brief-comunicacion', '2026-10']) }).titulo, 'El plan de noviembre de AKAI está vacío', 'vale el brief del mes del ciclo o el del contenido');
  assert.equal(b({ aprobada: false, presentes: [] }).titulo, 'El plan de noviembre de AKAI está bloqueado: falta la estrategia aprobada y el brief de comunicación');
  // Sin el dato nuevo (aprobada): el CEO lo lee del doc viva; quien no ve Estrategia no sabe, y no se le dice «bloqueado».
  const sin = { clientes: [C('akai', 'growth', { presentes: pres(['brief-comunicacion', '2026-11']) })] };
  assert.match(corre('mk-plan-del-mes', sin, CEO, '2026-10-05')[0].titulo, /bloqueado/);
  assert.match(corre('mk-plan-del-mes', { ...sin, strategy: [{ id: 'akai--viva', aprobado: { por: 'ceo@x.com', en: '2026-09-30' } }] }, CEO, '2026-10-05')[0].titulo, /vacío/);
  assert.match(corre('mk-plan-del-mes', sin, OPE, '2026-10-05')[0].titulo, /vacío/);
  // Foundation no tiene ciclo; a la medida, solo si su pipeline trae ③ y ④; Inherent corre todo.
  assert.deepEqual(corre('mk-plan-del-mes', { clientes: [AKAI({ nombre: 'F' }), C('fo', 'foundation', { aprobada: true }), C('me', 'medida', { aprobada: true, pipeline: P('③ Marketing') }), C('inherent', null, { nombre: 'Inherent', aprobada: true, presentes: pres(['brief-comunicacion', '2026-11']) })] }, CEO, '2026-10-05').map((x) => x.cliente).sort(), ['akai', 'inherent']);
  assert.equal(corre('mk-plan-del-mes', { clientes: [C('me', 'medida', { aprobada: true, pipeline: P('③ Marketing', '④ Creatividad'), presentes: pres(['brief-comunicacion', '2026-11']) })] }, CEO, '2026-10-05').length, 1);
});

t('mk-plan-del-mes: si tu tarea ③ de la receta ya venció, el aviso la enlaza y la tapa', () => {
  const d = { clientes: [AKAI()], projects: [{ id: 'p1', kind: 'Ciclo mensual', client_slug: 'akai', cycle: '2026-10' }], tasks: [{ id: 't3', project_id: 'p1', dept: '③ Marketing', assignee: 'ceo@x.com', status: 'Por empezar', due: '2026-10-03' }] };
  const [x] = corre('mk-plan-del-mes', d, CEO, '2026-10-05');
  assert.deepEqual(x.accion2, { label: 'Abrir la tarea', abre: 'tarea', id: 't3' }); assert.deepEqual(x.tapa, ['tareas-vencidas:t3']);
  assert.equal(corre('mk-plan-del-mes', d, CEO, '2026-10-02')[0].tapa, undefined, 'todavía no vence');
});

t('mk-plan-por-revisar: slots, pilares y la idea del mes; media antes de pasar a Ideas y baja después', () => {
  const malo = plan({ slots: [SLOT('MK-001', { traza: '' }), SLOT('MK-002')], pilares: [{ nombre: 'A', peso: 60 }, { nombre: 'B', peso: 30 }], campana: { nombre: 'N', traza: 'A', meta: '' } });
  const [x] = corre('mk-plan-por-revisar', { clientes: [AKAI()], plans: [malo] });
  assert.equal(x.titulo, 'El plan de noviembre de AKAI tiene 3 cosas por revisar'); assert.equal(x.urgencia, 'media');
  assert.equal(x.detalle, '1 pieza con algo por revisar (MK-001: Sin traza a una MUST BE TRUE) · los pilares suman 90%, no 100% · la idea del mes no tiene meta');
  assert.equal(corre('mk-plan-por-revisar', { clientes: [AKAI()], plans: [{ ...malo, a_creatividad: '2026-10-03' }] })[0].urgencia, 'baja');
  assert.deepEqual(corre('mk-plan-por-revisar', { clientes: [AKAI()], plans: [plan({ slots: [SLOT('MK-001')], pilares: [{ nombre: 'A', peso: 100 }], campana: { nombre: 'N', traza: 'A', meta: '+8%' } })] }), [], 'el plan está bien');
  assert.deepEqual(corre('mk-plan-por-revisar', { clientes: [AKAI()], plans: [malo] }, COO), [], 'sin Marcas no sale');
});

t('mk-plan-desactualizado: cambió después de pasar a Ideas o le faltan piezas; solo quien edita Marcas', () => {
  const pl = plan({ slots: [SLOT('MK-001'), SLOT('MK-002')], a_creatividad: '2026-10-03T10:00:00Z', actualizado: { slots: '2026-10-04T09:00:00Z' } });
  const todas = slotsAPiezas(pl, 'akai', '2026-11').map((x) => ({ id: x.id, ...x.data }));
  const [x] = corre('mk-plan-desactualizado', { clientes: [AKAI()], plans: [pl], content: todas }, OPE);
  assert.equal(x.titulo, 'El plan de noviembre de AKAI cambió después de pasarlo a Ideas'); assert.equal(x.accion.label, 'Poner al día'); assert.equal(x.accion.api.ruta, 'plan/akai/2026-11/a-creatividad');
  const viejo = { ...pl, actualizado: { slots: '2026-10-02T09:00:00Z' } };
  assert.equal(corre('mk-plan-desactualizado', { clientes: [AKAI()], plans: [viejo], content: todas.slice(1) })[0].titulo, 'A Ideas le falta 1 pieza del plan de noviembre de AKAI');
  assert.deepEqual(corre('mk-plan-desactualizado', { clientes: [AKAI()], plans: [viejo], content: todas }), [], 'al día');
  assert.deepEqual(corre('mk-plan-desactualizado', { clientes: [AKAI()], plans: [pl], content: todas }, VE), [], 'quien solo ve no lo puede poner al día');
});

t('mk-canal-fuera-ficha: un canal del plan que no está en «Redes»; solo el CEO; sin «Redes» no se calcula', () => {
  const pl = plan({ slots: [SLOT('MK-001', { canal: 'LinkedIn' }), SLOT('MK-002', { canal: 'instagram' })], canales: [{ canal: 'TikTok' }] });
  const nao = AKAI({ redes: 'Instagram · TikTok · Facebook' });
  const [x] = corre('mk-canal-fuera-ficha', { clientes: [nao], plans: [pl] });
  assert.equal(x.titulo, 'El plan de noviembre de AKAI pone piezas en LinkedIn, que no está en su ficha'); assert.match(x.detalle, /lo decides tú/);
  assert.equal(corre('mk-canal-fuera-ficha', { clientes: [nao], plans: [plan({ slots: [SLOT('MK-001')], canales: [{ canal: 'YouTube' }, { canal: 'X' }] })] })[0].titulo, 'El plan de noviembre de AKAI usa YouTube y X, que no están en su ficha');
  const cer = AKAI({ redes: 'Instagram · LinkedIn · Facebook · Google (perfil de Google Maps) · web · presentación comercial. Qué hace cada una se define en la estrategia de canales' });
  assert.deepEqual(corre('mk-canal-fuera-ficha', { clientes: [cer], plans: [plan({ slots: [SLOT('MK-001', { canal: 'Google Maps' }), SLOT('MK-002', { canal: 'Web' }), SLOT('MK-003', { canal: 'IG' })] })] }), []);
  assert.deepEqual(corre('mk-canal-fuera-ficha', { clientes: [AKAI()], plans: [pl] }), [], 'sin «Redes» en la ficha');
  assert.deepEqual(corre('mk-canal-fuera-ficha', { clientes: [nao], plans: [pl] }, OPE), [], 'el alcance va al CEO');
});

t('cr-sin-brief: el candado de Mc cerrado, con las dos rutas del brief; media del 1 al 3 y alta desde el 4', () => {
  const c = (o = {}, extra = {}) => ({ clientes: [AKAI({ briefCiclo: [], ...o })], ...extra });
  const [x] = corre('cr-sin-brief', c(), CEO, '2026-10-02');
  assert.equal(x.titulo, 'Noviembre de AKAI sigue cerrado: falta el brief del ciclo'); assert.equal(x.urgencia, 'media');
  assert.deepEqual(x.accion, { label: 'Abrir el mes sin brief', href: '#/marcas/akai/calendario' });
  assert.deepEqual(corre('cr-sin-brief', c(), OPE, '2026-10-05')[0].accion, { label: 'Ver qué falta', href: '#/marcas/akai/brief' });
  assert.deepEqual(['2026-10-01', '2026-10-03', '2026-10-04', '2026-10-20', '2026-10-21'].map((h) => urg('cr-sin-brief', c(), h).join()), ['media', 'media', 'alta', 'alta', '']);
  assert.deepEqual(corre('cr-sin-brief', c({ briefCiclo: ['2026-11'] }), CEO, '2026-10-05'), [], 'brief en la ruta del servidor');
  assert.deepEqual(corre('cr-sin-brief', c({ presentes: pres(['brief-comunicacion', '2026-11'], ['brief-ciclo', '2026-11']) }), CEO, '2026-10-05'), [], 'brief en la ruta del manual (ideas/)');
  assert.deepEqual(corre('cr-sin-brief', c({}, { settings: { brief_open: { marcas: { akai: [{ mes: '2026-11', por: 'ceo@x.com' }] } } } }), CEO, '2026-10-05'), [], 'el CEO abrió el mes');
  assert.deepEqual(corre('cr-sin-brief', { clientes: [AKAI()] }, CEO, '2026-10-05'), [], 'sin el dato nuevo no se sabe: no se avisa');
  assert.deepEqual(corre('cr-sin-brief', c(), VE, '2026-10-05'), [], 'no corre ④');
  assert.deepEqual(corre('cr-sin-brief', { clientes: [C('me', 'medida', { briefCiclo: [], pipeline: P('③ Marketing') })] }, CEO, '2026-10-05'), [], 'su pipeline no trae ④');
});

t('cr-sin-brief: el aviso y el candado dicen lo mismo', () => {
  const casos = [[[], []], [['2026-11'], []], [['2026-10'], []], [[], [{ mes: '2026-11' }]], [[], [{ mes: '2026-12' }]]];
  for (const [briefs, abiertos] of casos) {
    const sale = corre('cr-sin-brief', { clientes: [AKAI({ briefCiclo: briefs })], settings: { brief_open: { marcas: { akai: abiertos } } } }, CEO, '2026-10-05').length > 0;
    assert.equal(sale, candado('2026-11', briefs, abiertos).cerrado, JSON.stringify({ briefs, abiertos }));
  }
});

t('cr-ideas-faltan: piezas del plan sin idea, cuando ya pasó a Ideas; media del 1 al 3 y alta desde el 4', () => {
  const pzs = [post('a', '2026-11-01', { slot: { plan: 'akai--2026-11', id: 'MK-001' } }), post('b', '2026-11-08', { slot: { plan: 'akai--2026-11', id: 'MK-002' } }), post('c', '2026-11-08', { slot: { plan: 'akai--2026-11', id: 'MK-003' }, idea_chat: { titulo: 'x' } }), post('d', '2026-11-08')];
  const d = { clientes: [AKAI()], plans: [plan({ slots: [SLOT('MK-001')], a_creatividad: '2026-10-02' })], content: pzs };
  const [x] = corre('cr-ideas-faltan', d, OPE, '2026-10-02');
  assert.equal(x.titulo, 'A 2 piezas del plan de noviembre de AKAI les falta su idea'); assert.equal(x.urgencia, 'media');
  assert.deepEqual(x.accion, { label: 'Pedir las ideas', abre: 'diseno', slug: 'akai', etapa: 'ideas', mes: '2026-11' });
  assert.deepEqual(['2026-10-03', '2026-10-04', '2026-10-21'].map((h) => urg('cr-ideas-faltan', d, h).join()), ['media', 'alta', '']);
  assert.equal(corre('cr-ideas-faltan', d, VEOP, '2026-10-05')[0].accion.label, 'Ver las ideas', 'quien no edita no las pide');
  assert.deepEqual(corre('cr-ideas-faltan', d, VE, '2026-10-05'), [], 'no es el perfil content');
  assert.deepEqual(corre('cr-ideas-faltan', { ...d, plans: [plan({ slots: [SLOT('MK-001')] })] }, CEO, '2026-10-05'), [], 'el plan no ha pasado a Ideas');
  assert.equal(corre('cr-ideas-faltan', { ...d, content: pzs.slice(1) }, CEO, '2026-10-05')[0].titulo, 'A 1 pieza del plan de noviembre de AKAI le falta su idea');
});

t('mk-campana-a-tiempo: el aviso llegó tarde o el primer aviso pasó en borrador (alta); no está en el plan (media o alta)', () => {
  const camp = (o) => ({ id: 'akai--' + o.nombre.toLowerCase(), profile: 'akai', frase: 'f', mbt: 'A', se_nota: 's', no_es: 'n', estado: 'En curso', ...o });
  const tarde = camp({ nombre: 'Apertura', tipo: 'apertura', ancla: '2026-10-05' });
  const [x] = corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [tarde] }, CEO, '2026-10-02');
  assert.equal(x.titulo, 'El aviso de «Apertura» de AKAI llegó tarde'); assert.equal(x.urgencia, 'alta'); assert.equal(x.accion.href, '#/marcas/akai/campanas');
  assert.deepEqual(corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [tarde] }, CEO, '2026-10-06'), [], 'la campaña ya pasó');
  const gala = camp({ nombre: 'Gala', tipo: 'evento', ancla: '2026-11-15', estado: 'Borrador', evento: { objetivo: 'o', medicion: 'm' } });
  assert.equal(corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [gala] }, CEO, '2026-10-26')[0].titulo, 'El primer aviso de «Gala» de AKAI ya pasó y sigue en borrador');
  // (b) El primer aviso (35 días antes) cae el 27 de octubre y nadie la nombra.
  const nav = camp({ nombre: 'Navidad', tipo: 'temporada', ancla: '2026-12-01', estado: 'Borrador' });
  const b = (o = {}, hoy = '2026-10-13', p = CEO) => corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [nav], ...o }, p, hoy);
  assert.equal(b()[0].titulo, 'El primer aviso de «Navidad» de AKAI cae en este ciclo y no está en el plan');
  assert.deepEqual(b()[0].accion, { label: 'Meterla al plan', href: '#/marcas/akai/plan/2026-11' });
  assert.deepEqual(['2026-10-13', '2026-10-20', '2026-10-21'].map((h) => b({}, h).map((x) => x.urgencia).join()), ['media', 'alta', '']);
  assert.deepEqual(b({ plans: [plan({ campana: { nombre: 'navidad' } })] }), [], 'el plan la nombra');
  assert.deepEqual(b({ content: [post('n1', '2026-11-20', { campana: 'Navidad' })] }), [], 'una pieza la nombra');
  // A la persona responsable le sale en «Tu trabajo»; quien solo ve Marcas la ve sin poder meterla.
  assert.equal(corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [{ ...nav, responsable: 'ope@x.com' }] }, OPE, '2026-10-13')[0].grupo, 'trabajo');
  assert.equal(b({}, '2026-10-13', CEO)[0].grupo, 'clientes');
  assert.equal(b({}, '2026-10-13', VE)[0].accion.label, 'Ver el plan');
  assert.deepEqual(b({}, '2026-10-13', RES), []);
  assert.deepEqual(corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [{ ...tarde, estado: 'Cerrada' }] }, CEO, '2026-10-02'), [], 'cerrada');
});

t('mk-campana-incompleta: lo que le falta a cada campaña y más de 2 en el ciclo; baja si su primer aviso está lejos', () => {
  const base = { profile: 'akai', estado: 'Borrador' };
  const [x] = corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: [{ ...base, id: 'akai--x', nombre: 'X', tipo: 'lanzamiento', ancla: '2026-11-20' }] });
  assert.equal(x.titulo, 'A la campaña «X» de AKAI le falta su frase, la MUST BE TRUE que mueve, en qué se va a notar y qué NO es'); assert.equal(x.urgencia, 'media');
  assert.equal(corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: [{ ...base, nombre: 'Lejos', tipo: 'lanzamiento', ancla: '2027-03-20' }] })[0].urgencia, 'baja');
  const gala = { ...base, nombre: 'Gala', tipo: 'evento', frase: 'f', mbt: 'A', se_nota: 's', no_es: 'n', ancla: '2026-11-20', evento: {} };
  assert.equal(corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: [gala] })[0].titulo, 'Al evento «Gala» de AKAI le falta su objetivo comercial y cómo se mide');
  const ok = (nombre, ancla) => ({ ...base, nombre, tipo: 'lanzamiento', frase: 'f', mbt: 'A', se_nota: 's', no_es: 'n', ancla });
  assert.deepEqual(corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: [ok('Bien', '2026-11-20')] }), [], 'la campaña está completa');
  const tres = [ok('A', '2026-11-10'), ok('B', '2026-11-20'), ok('C', '2026-11-28')];
  const [m] = corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: tres });
  assert.equal(m.titulo, 'Noviembre de AKAI tiene 3 campañas: ninguna está definida'); assert.equal(m.clave, 'mk-campana-incompleta:akai:2026-11');
  assert.deepEqual(corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: tres.slice(0, 2) }), [], 'dos como máximo');
  assert.equal(corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: [{ ...base, nombre: 'Y', responsable: 'ope@x.com' }] }, OPE)[0].grupo, 'trabajo');
});

t('mk-campana-sin-piezas: cada paso de la anticipación con su pieza; alta si falta el último empujón o un paso está cerca', () => {
  // Lanzamiento el 10 de noviembre: primer aviso 13/10, recordatorios 27/10 y 03/11, el día 10/11.
  const lan = { id: 'akai--lanzamiento', profile: 'akai', nombre: 'Lanzamiento', tipo: 'lanzamiento', ancla: '2026-11-10', estado: 'En curso' };
  const d = (content) => ({ clientes: [AKAI()], campanas: [lan], content });
  const [x] = corre('mk-campana-sin-piezas', d([post('l1', '2026-10-26', { campana: 'lanzamiento' })]));
  assert.equal(x.titulo, 'La campaña «Lanzamiento» de AKAI no tiene piezas para su recordatorio y el día'); assert.equal(x.urgencia, 'alta');
  assert.equal(x.detalle, 'Recordatorio el 3 de noviembre · El día el 10 de noviembre. El último empujón siempre existe.');
  assert.equal(corre('mk-campana-sin-piezas', d([post('l1', '2026-10-26', { campana: 'Lanzamiento' }), post('l2', '2026-11-02', { campana: 'Lanzamiento' }), post('l3', '2026-11-09', { campana: 'Lanzamiento' })]))[0].titulo,
    'La campaña «Lanzamiento» de AKAI no tiene pieza para el día', '«El día» pide una pieza ese mismo día');
  assert.deepEqual(corre('mk-campana-sin-piezas', d([post('l1', '2026-10-26', { campana: 'Lanzamiento' }), post('l2', '2026-11-02', { campana: 'Lanzamiento' }), post('l3', '2026-11-10', { campana: 'Lanzamiento' })])), [], 'todos los pasos con pieza');
  // Navidad el 20 de diciembre: en este ciclo solo caen el primer aviso (15/11) y un recordatorio (29/11): media.
  const nav = { id: 'akai--navidad', profile: 'akai', nombre: 'Navidad', tipo: 'temporada', ancla: '2026-12-20', estado: 'En curso' };
  const [y] = corre('mk-campana-sin-piezas', { clientes: [AKAI()], campanas: [nav] });
  assert.equal(y.titulo, 'La campaña «Navidad» de AKAI no tiene piezas para su primer aviso y su recordatorio'); assert.equal(y.urgencia, 'media');
  assert.deepEqual(corre('mk-campana-sin-piezas', { clientes: [AKAI()], campanas: [{ ...nav, estado: 'Borrador' }] }), [], 'solo las que están en curso');
  // A la persona responsable que no ve las piezas no se le dice que faltan: no lo puede saber.
  const COOR = personaDe({ email: 'coor@x.com', role: 'coo', areas: ['work'] });
  assert.deepEqual(corre('mk-campana-sin-piezas', { clientes: [AKAI()], campanas: [{ ...nav, responsable: 'coor@x.com' }] }, COOR), []);
  assert.deepEqual(corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [{ ...nav, estado: 'Borrador', ancla: '2026-12-01', tipo: 'temporada', responsable: 'coor@x.com' }] }, COOR, '2026-10-13'), []);
  assert.equal(corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: [{ ...nav, estado: 'Borrador', responsable: 'coor@x.com' }] }, COOR)[0].grupo, 'trabajo', 'lo que le falta a su campaña sí');
});

t('gd-sin-sistema-visual: si corre ⑥A y falta 02-marca/sistema-visual.md; alta desde el 12 o con piezas por diseñar', () => {
  const d = (o = {}, content = []) => ({ clientes: [AKAI(o)], content });
  const [x] = corre('gd-sin-sistema-visual', d(), OPE, '2026-10-05');
  assert.equal(x.titulo, 'AKAI no tiene sistema visual: ⑥A Diseño no puede arrancar'); assert.equal(x.urgencia, 'media'); assert.equal(x.accion.href, '#/marcas/akai/design');
  assert.equal(urg('gd-sin-sistema-visual', d(), '2026-10-13').join(), 'alta');
  assert.equal(urg('gd-sin-sistema-visual', d({}, [post('c', '2026-11-04', { format: 'Carrusel' })]), '2026-10-05').join(), 'alta', 'ya hay un carrusel esperando');
  assert.equal(urg('gd-sin-sistema-visual', d({}, [post('r', '2026-11-04')]), '2026-10-05').join(), 'media', 'un reel no lo diseña ⑥A');
  assert.deepEqual(corre('gd-sin-sistema-visual', d({ presentes: pres('sistema-visual') })), []);
  assert.deepEqual(corre('gd-sin-sistema-visual', { clientes: [C('cer', 'medida', { pipeline: P('① Strategy', '②B Branding', '⑤ Producción') })] }), [], 'no lleva ⑥A');
  assert.deepEqual(corre('gd-sin-sistema-visual', d(), VE), [], 'no es el perfil content');
});

t('pr-dia11-grabacion: del 4 al 11, sin grabación antes del 11, después del 11 o «¿se grabó?»; media del 4 al 7, alta del 8 al 11', () => {
  const d = (content = []) => ({ clientes: [AKAI()], content });
  const [x] = corre('pr-dia11-grabacion', d(), CEO, '2026-10-05');
  assert.equal(x.titulo, 'AKAI no tiene grabación antes del día 11'); assert.equal(x.accion.label, 'Agendar la grabación'); assert.deepEqual([x.accion.abre, x.accion.slug, x.accion.filtro], ['calendario', 'akai', 'operativo']);
  assert.deepEqual(['2026-10-03', '2026-10-04', '2026-10-07', '2026-10-08', '2026-10-11', '2026-10-12'].map((h) => urg('pr-dia11-grabacion', d(), h).join()), ['', 'media', 'media', 'alta', 'alta', '']);
  assert.deepEqual(corre('pr-dia11-grabacion', d([shoot('s1', '2026-10-08')]), CEO, '2026-10-05'), [], 'ya está agendada');
  assert.equal(corre('pr-dia11-grabacion', d([shoot('s1', '2026-10-08')]), CEO, '2026-10-09')[0].titulo, 'La grabación de AKAI del 8 sigue «Por grabar»: ¿se grabó?');
  assert.deepEqual(corre('pr-dia11-grabacion', d([shoot('s1', '2026-10-08', { status: 'Grabado' })]), CEO, '2026-10-09'), []);
  assert.equal(corre('pr-dia11-grabacion', d([shoot('s1', '2026-10-14')]), CEO, '2026-10-05')[0].titulo, 'La grabación de AKAI cae el 14: después del 11 ya no se graba nada del ciclo');
  assert.equal(corre('pr-dia11-grabacion', d([shoot('s1', '2026-10-08', { status: 'Cancelado' })]), CEO, '2026-10-05')[0].titulo, 'AKAI no tiene grabación antes del día 11', 'la cancelada no cuenta');
  assert.deepEqual(corre('pr-dia11-grabacion', d(), COO, '2026-10-05'), [], 'el COO sin Marcas: le llega por su tarea ⑤');
  assert.equal(corre('pr-dia11-grabacion', d(), COOC, '2026-10-05')[0].accion.label, 'Ver el calendario');
  assert.deepEqual(corre('pr-dia11-grabacion', { clientes: [C('me', 'medida', { pipeline: P('④ Creatividad') })] }, CEO, '2026-10-05'), [], 'no corre ⑤');
});

t('gd-por-disenar: del 12 al 19, carruseles, estáticos y stories de Mc sin diseñar; media del 12 al 15 y alta del 16 al 19', () => {
  const pzs = [post('c1', '2026-11-02', { format: 'Carrusel' }), post('e1', '2026-11-05', { format: 'Estático', status: 'En proceso', slot: { plan: 'akai--2026-11' }, idea_chat: { titulo: 'i' } }),
    post('s1', '2026-11-05', { format: 'Story', slot: { plan: 'akai--2026-11' } }), post('r1', '2026-11-05'), post('c2', '2026-11-06', { format: 'Carrusel', diseno: { at: 'x' } }), post('c3', '2026-11-06', { format: 'Carrusel', status: 'Listo' }), post('c4', '2026-10-28', { format: 'Carrusel' })];
  const d = { clientes: [AKAI({ presentes: pres('sistema-visual') })], content: pzs };
  const [x] = corre('gd-por-disenar', d, OPE, '2026-10-13');
  assert.equal(x.titulo, '2 piezas de AKAI por diseñar: el paquete va el 19'); assert.equal(x.detalle, 'De noviembre: 1 carrusel · 1 estático.');
  assert.deepEqual(x.accion, { label: 'Diseñar en el chat', abre: 'diseno', slug: 'akai', etapa: 'diseno', mes: '2026-11' });
  assert.deepEqual(['2026-10-11', '2026-10-12', '2026-10-15', '2026-10-16', '2026-10-19', '2026-10-20'].map((h) => urg('gd-por-disenar', d, h, OPE).join()), ['', 'media', 'media', 'alta', 'alta', '']);
  assert.deepEqual(corre('gd-por-disenar', { ...d, clientes: [AKAI()] }, OPE, '2026-10-13'), [], 'sin sistema visual sale gd-sin-sistema-visual');
  assert.equal(corre('gd-por-disenar', d, CEO, '2026-10-13').length, 1, 'sin nadie con el perfil content, lo lleva el CEO');
  assert.deepEqual(corre('gd-por-disenar', { ...d, team: [{ email: 'ope@x.com', roles: ['content'] }] }, CEO, '2026-10-13'), [], 'con operador, al CEO no le sale');
  assert.equal(corre('gd-por-disenar', d, VEOP, '2026-10-13')[0].accion.label, 'Ver el calendario');
});

t('ciclo-20-faltan-piezas: desde el 12, las piezas de Mc sin terminar; media del 12 al 15, alta desde el 16; del 21 «salen desde el día 1»', () => {
  const pzs = [post('a', '2026-11-02'), post('b', '2026-11-03'), post('c', '2026-11-04', { status: 'En proceso' }), post('d', '2026-11-05', { status: 'Listo' }), post('e', '2026-11-06', { archived: true }), post('f', '2026-10-30')];
  const d = { clientes: [AKAI()], content: pzs };
  const [x] = corre('ciclo-20-faltan-piezas', d, CEO, '2026-10-13');
  assert.equal(x.titulo, 'Faltan 3 piezas de noviembre de AKAI para la presentación del 20'); assert.equal(x.detalle, '2 en idea · 1 en proceso. El 20 llega completo, revisado y programado.');
  assert.deepEqual(['2026-10-11', '2026-10-12', '2026-10-15', '2026-10-16', '2026-10-20', '2026-10-21'].map((h) => urg('ciclo-20-faltan-piezas', d, h).join()), ['', 'media', 'media', 'alta', 'alta', 'alta']);
  assert.equal(corre('ciclo-20-faltan-piezas', d, CEO, '2026-10-26')[0].titulo, 'Faltan 3 piezas de noviembre de AKAI: salen desde el día 1');
  assert.deepEqual(corre('ciclo-20-faltan-piezas', { ...d, content: pzs.slice(3) }, CEO, '2026-10-13'), [], 'todo listo');
  assert.deepEqual(corre('ciclo-20-faltan-piezas', d, COO, '2026-10-17'), [], 'el COO sin Marcas: le llega por QA y PRES');
  assert.equal(corre('ciclo-20-faltan-piezas', d, COOC, '2026-10-17').length, 1);
});

t('po-sin-hora-red: piezas listas sin hora o sin red; las de Mc desde el 16 y las de 7 días siempre; alta si salen en 2 días', () => {
  const L = (id, date, o = {}) => post(id, date, { status: 'Listo', time: '10:00', red: 'Instagram', ...o });
  const pzs = [L('a', '2026-10-27', { time: '', red: '', slot: { canal: 'TikTok' } }), L('b', '2026-11-15', { red: '' }), L('c', '2026-10-20', { time: '' }), L('d', '2026-11-03'), post('e', '2026-10-28', { time: '' })];
  const d = { clientes: [AKAI()], content: pzs };
  const [x] = corre('po-sin-hora-red', d, OPE, '2026-10-26');
  assert.equal(x.titulo, '2 piezas listas de AKAI no tienen hora o red'); assert.equal(x.urgencia, 'alta'); assert.equal(x.accion.label, 'Ponerles hora y red');
  assert.equal(x.detalle, '1 sin hora · 1 sin red. La primera sale el 27. ④ Creatividad pone la fecha; ⑨ Posting, la hora.');
  assert.deepEqual(corre('po-sin-hora-red', { ...d, content: [L('b', '2026-11-15', { red: '' })] }, OPE, '2026-10-13'), [], 'antes del 16, las de Mc todavía no');
  const [y] = corre('po-sin-hora-red', { ...d, content: [L('g', '2026-10-31', { time: '' })] }, OPE, '2026-10-26');
  assert.equal(y.titulo, '1 pieza lista de AKAI no tiene hora'); assert.equal(y.urgencia, 'media');
  const [z] = corre('po-sin-hora-red', { ...d, content: [L('h', '2026-10-28', { time: '', red: '' })] }, OPE, '2026-10-26');
  assert.equal(z.titulo, '1 pieza lista de AKAI no tiene hora ni red'); assert.equal(z.detalle, 'La primera sale el 28. ④ Creatividad pone la fecha; ⑨ Posting, la hora.'); assert.equal(z.urgencia, 'alta');
  assert.deepEqual(corre('po-sin-hora-red', { ...d, content: [L('d', '2026-10-27')] }, OPE), [], 'con hora y red');
  assert.deepEqual(corre('po-sin-hora-red', { ...d, team: [{ email: 'ope@x.com', roles: ['content'] }] }, CEO), [], 'lo programa el operador');
});

t('pz-vencidas: de hace 30 días a ayer y sin salir', () => {
  const pzs = [post('a', '2026-10-20', { title: 'Reel lanzamiento' }), post('b', '2026-10-24', { status: 'Listo', title: 'Carrusel menú' }), post('c', '2026-10-25', { status: 'Publicado' }), post('d', '2026-09-20'), post('e', '2026-10-26'), post('f', '2026-10-22', { archived: true })];
  const [x] = corre('pz-vencidas', { clientes: [AKAI()], content: pzs });
  assert.equal(x.titulo, '2 piezas de AKAI ya pasaron su fecha y no salieron'); assert.equal(x.urgencia, 'alta');
  assert.equal(x.detalle, '«Reel lanzamiento» (el 20) · «Carrusel menú» (el 24). Márcalas Publicado o cámbiales la fecha.');
  assert.equal(corre('pz-vencidas', { clientes: [AKAI()], content: pzs.slice(1) })[0].titulo, '1 pieza de AKAI ya pasó su fecha y no salió');
  assert.deepEqual(corre('pz-vencidas', { clientes: [AKAI()], content: pzs.slice(2) }), []);
  assert.deepEqual(corre('pz-vencidas', { clientes: [AKAI()], content: pzs }, VE), [], 'no es el perfil content');
  assert.equal(corre('pz-vencidas', { clientes: [AKAI()], content: pzs }, VEOP)[0].accion.label, 'Ver el calendario');
});

t('claves únicas y huellas que cambian con lo que avisan', () => {
  const d = { clientes: [AKAI({ briefCiclo: [] }), C('nao', 'growth', { briefCiclo: [], presentes: pres(['brief-comunicacion', '2026-11']), aprobada: true })] };
  const xs = correr(CLIENTES_MARCAS, datos(d), CEO, '2026-10-05').items;
  assert.equal(new Set(xs.map((x) => x.clave)).size, xs.length);
  assert.ok(xs.every((x) => x.cliente && ['akai', 'nao'].includes(x.cliente) && x.huella));
  const h = (hoy) => corre('cr-sin-brief', d, CEO, hoy)[0].huella;
  assert.notEqual(h('2026-10-02'), h('2026-10-05'), 'subió la urgencia: un pospuesto vuelve');
});

// ---------- Lo que encontró la revisión (cada prueba fallaba antes del arreglo) ----------
// Un pospuesto se guarda con su clave y su huella (base.js · posponer) y vuelve si cambia la huella.
const posp = (x, hasta, hoy) => posponer({}, { clave: x.clave, hasta, huella: x.huella }, x, hoy).pos;
const visible = (x, pos, hoy) => aplicarPospuestos([x], pos, hoy).visibles.length === 1;

t('revisión: un pospuesto del plan de un mes no tapa el del siguiente (mk-plan-por-revisar y mk-canal-fuera-ficha)', () => {
  // Los slots se llaman MK-001… todos los meses: con el mismo problema, la huella tiene que llevar el mes.
  const nao = AKAI({ redes: 'Instagram · TikTok · Facebook' });
  const mal = (mes) => ({ id: 'akai--' + mes, profile: 'akai', mes, slots: [SLOT('MK-001', { traza: '', canal: 'LinkedIn' })] });
  for (const id of ['mk-plan-por-revisar', 'mk-canal-fuera-ficha']) {
    const [nov] = corre(id, { clientes: [nao], plans: [mal('2026-11')] }, CEO, '2026-10-25');
    const pos = posp(nov, '2026-11-08', '2026-10-25');
    assert.equal(visible(nov, pos, '2026-10-30'), false, id + ': el de noviembre quedó pospuesto');
    const [dic] = corre(id, { clientes: [nao], plans: [mal('2026-12')] }, CEO, '2026-11-02');
    assert.equal(dic.clave, nov.clave);
    assert.ok(visible(dic, pos, '2026-11-02'), id + ': el plan de diciembre sale aunque el de noviembre siga pospuesto');
  }
});

t('revisión: mk-canal-fuera-ficha lee «Redes» sin signos y con los alias de los dos lados', () => {
  const pl = plan({ slots: [SLOT('MK-001', { canal: 'Facebook' }), SLOT('MK-002', { canal: 'Instagram' }), SLOT('MK-003', { canal: 'TikTok' })] });
  assert.deepEqual(corre('mk-canal-fuera-ficha', { clientes: [AKAI({ redes: 'Instagram · TikTok · Facebook.' })], plans: [pl] }), [], 'el punto al final no saca a Facebook');
  assert.deepEqual(corre('mk-canal-fuera-ficha', { clientes: [AKAI({ redes: 'IG · TT · FB' })], plans: [pl] }), [], 'IG, TT y FB en la ficha');
  const [x] = corre('mk-canal-fuera-ficha', { clientes: [AKAI({ redes: 'Instagram · TikTok · Facebook.' })], plans: [plan({ slots: [SLOT('MK-001', { canal: 'LinkedIn' })] })] });
  assert.equal(x.titulo, 'El plan de noviembre de AKAI pone piezas en LinkedIn, que no está en su ficha');
  assert.equal(x.detalle, 'Su ficha dice: Instagram · TikTok · Facebook. El alcance lo decides tú: se quita del plan o se cotiza aparte.');
});

t('revisión: si sube la urgencia, el pospuesto vuelve (mk-campana-incompleta y mk-campana-sin-piezas)', () => {
  // Incompleta: el primer aviso (28 días antes del 20 de diciembre) es el 22 de noviembre: baja el 20 de octubre, media el 26.
  const inc = { id: 'akai--lejos', profile: 'akai', nombre: 'Lejos', tipo: 'lanzamiento', ancla: '2026-12-20', estado: 'Borrador' };
  const [a] = corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: [inc] }, CEO, '2026-10-20');
  const [b] = corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: [inc] }, CEO, '2026-10-26');
  assert.deepEqual([a.urgencia, b.urgencia], ['baja', 'media']);
  assert.ok(visible(b, posp(a, '2026-11-03', '2026-10-20'), '2026-10-26'), 'pasó a media: vuelve');
  // Sin piezas: temporada el 7 de diciembre (primer aviso el 2 de noviembre). El 20 de octubre, media; el 26 está a 7 días: alta.
  const tem = { id: 'akai--fiesta', profile: 'akai', nombre: 'Fiesta', tipo: 'temporada', ancla: '2026-12-07', estado: 'En curso' };
  const [c] = corre('mk-campana-sin-piezas', { clientes: [AKAI()], campanas: [tem] }, CEO, '2026-10-20');
  const [d] = corre('mk-campana-sin-piezas', { clientes: [AKAI()], campanas: [tem] }, CEO, '2026-10-26');
  assert.deepEqual([c.urgencia, d.urgencia], ['media', 'alta']);
  assert.ok(visible(d, posp(c, '2026-11-03', '2026-10-20'), '2026-10-26'), 'pasó a alta: vuelve');
});

t('revisión: mk-campana-sin-piezas cuenta los recordatorios repetidos', () => {
  const tem = { id: 'akai--fiesta', profile: 'akai', nombre: 'Fiesta', tipo: 'temporada', ancla: '2026-12-07', estado: 'En curso' };
  const [x] = corre('mk-campana-sin-piezas', { clientes: [AKAI()], campanas: [tem] }, CEO, '2026-10-20');
  assert.equal(x.titulo, 'La campaña «Fiesta» de AKAI no tiene piezas para su primer aviso y sus 3 recordatorios');
  assert.equal(x.detalle, 'Primer aviso el 2 de noviembre · Recordatorio el 16 de noviembre · Recordatorio el 23 de noviembre · Recordatorio el 30 de noviembre. Nunca un solo aviso: cada paso lleva su pieza.');
});

t('revisión: sin Marcas · contenido no hay botón a la campaña; a quien no edita, el detalle le dice quién la edita', () => {
  // La persona responsable que no abre Marcas (si avisos-datos le manda sus campañas): GET campanas le responde 403.
  const COOR = personaDe({ email: 'coor@x.com', role: 'coo', areas: ['work'] });
  const inc = { id: 'akai--y', profile: 'akai', nombre: 'Y', tipo: 'lanzamiento', ancla: '2026-11-20', estado: 'Borrador', responsable: 'coor@x.com' };
  const [x] = corre('mk-campana-incompleta', { clientes: [AKAI()], campanas: [inc] }, COOR);
  assert.equal(x.grupo, 'trabajo'); assert.equal(x.accion, null); assert.match(x.detalle, /La edita quien edita Marcas · contenido\.$/);
  const tarde = { id: 'akai--apertura', profile: 'akai', nombre: 'Apertura', tipo: 'apertura', ancla: '2026-10-05', estado: 'En curso', frase: 'f', mbt: 'A', se_nota: 's', no_es: 'n', responsable: 'coor@x.com' };
  const [y] = corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [tarde] }, COOR, '2026-10-02');
  assert.equal(y.grupo, 'trabajo'); assert.equal(y.accion, null);
  // Quien ve Marcas sin editar: ve la campaña y el plan, y el detalle no le pide que la meta él.
  assert.deepEqual(corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [{ ...tarde, responsable: '' }] }, VE, '2026-10-02')[0].accion, { label: 'Ver la campaña', href: '#/marcas/akai/campanas' });
  const nav = { id: 'akai--navidad', profile: 'akai', nombre: 'Navidad', tipo: 'temporada', ancla: '2026-12-01', estado: 'Borrador' };
  assert.equal(corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [nav] }, VE, '2026-10-13')[0].detalle, 'Su primer aviso es el 27. La anticipación no puede exceder el ciclo: va en el plan de noviembre, y la mete quien edita Marcas · contenido.');
  assert.equal(corre('mk-campana-a-tiempo', { clientes: [AKAI()], campanas: [nav] }, CEO, '2026-10-13')[0].detalle, 'Su primer aviso es el 27. La anticipación no puede exceder el ciclo: métela al plan de noviembre.');
});

t('revisión: «Ponerle» a una sola pieza, «y N más» en las vencidas y, al CEO, a qué mes ir para abrirlo sin brief', () => {
  const L = (id, date, o = {}) => post(id, date, { status: 'Listo', time: '10:00', red: 'Instagram', ...o });
  assert.equal(corre('po-sin-hora-red', { clientes: [AKAI()], content: [L('g', '2026-10-31', { time: '' })] }, OPE)[0].accion.label, 'Ponerle hora');
  const pzs = ['20', '21', '22', '23'].map((dd) => post('v' + dd, `2026-10-${dd}`, { title: 'P' + dd }));
  assert.equal(corre('pz-vencidas', { clientes: [AKAI()], content: pzs })[0].detalle, '«P20» (el 20) · «P21» (el 21) · y 2 más. Márcalas Publicado o cámbiales la fecha.');
  // El calendario abre en el mes de hoy: el botón «Abrir el mes sin brief» está en el de noviembre.
  assert.match(corre('cr-sin-brief', { clientes: [AKAI({ briefCiclo: [] })] }, CEO, '2026-10-05')[0].detalle, /en el calendario, pasa a noviembre\.$/);
});

t('revisión: con Marcas · contenido en «resumen» no sale nada, aunque tenga el perfil content', () => {
  // El catálogo (alcance): «con Marcas · contenido en resumen, no sale nada de content ni de plans». Ni el brief ni el sistema visual.
  const d = datos({ yo: { roles: ['content'] }, clientes: [AKAI({ briefCiclo: [] })], content: [post('a', '2026-10-02'), post('c', '2026-11-04', { format: 'Carrusel' })] });
  for (const hoy of DIAS) assert.deepEqual(correr(CLIENTES_MARCAS, d, RES, hoy).items.map((x) => x.id), [], hoy);
  assert.deepEqual(correr(CLIENTES_MARCAS, d, VEOP, '2026-10-05').items.map((x) => x.id).sort(), ['cr-sin-brief', 'gd-sin-sistema-visual', 'mk-plan-del-mes', 'pr-dia11-grabacion', 'pz-vencidas'], 'con la vista completa, sí');
});

t('revisión: una lista con huecos (null) no tumba ninguna regla', () => {
  const d = { clientes: [AKAI({ briefCiclo: [] })], campanas: [null, { profile: 'akai', nombre: 'Z', estado: 'Borrador' }], plans: [null], projects: [null], tasks: [null], content: [null] };
  for (const hoy of DIAS) for (const p of [CEO, OPE, VE]) assert.deepEqual(correr(CLIENTES_MARCAS, datos({ yo: YO[p.email] || {}, ...d }), p, hoy).errores, [], `${p.email} ${hoy}`);
});

console.log(`\n${n} pruebas de Avisos · clientes-marcas pasaron`);
