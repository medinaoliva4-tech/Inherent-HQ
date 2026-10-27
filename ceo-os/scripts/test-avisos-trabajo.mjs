// Avisos · Tu trabajo: cada regla de trabajo.js con datos armados y el día fijo (que sale, que no sale cuando el dato está
// bien, quién la ve y la urgencia por tramo del ciclo cuando el catálogo la da). Y la cadena de mando de tareas-cadena.js.
// Puro: no toca la base ni la red. Uso: node scripts/test-avisos-trabajo.mjs
import assert from 'node:assert/strict';
import { personaDe, correr, posponer, aplicarPospuestos } from '../public/js/avisos-reglas/base.js';
import { TRABAJO } from '../public/js/avisos-reglas/trabajo.js';
import { cadenaDe, okOf } from '../public/js/tareas-cadena.js';

let n = 0;
const t = (nombre, fn) => { fn(); n++; console.log('✓', nombre); };
const vacio = { tasks: [], projects: [], team: [], leads: [], quotes: [], invoices: [], accounts: [], content: [], campaigns: [], mentors: [], strategy: [], plans: [], campanas: [], ad_variants: [], judgments: [], clientes: [], yo: {}, settings: {}, guias: [], env: null, push: { listo: false } };
const datos = (o = {}) => ({ ...vacio, ...o });
const HOY = '2026-10-26';
const regla = (id) => TRABAJO.find((r) => r.id === id) || assert.fail('falta la regla ' + id);
const corre = (id, d, p = CEO, hoy = HOY) => { const r = correr([regla(id)], datos(d), p, hoy); assert.deepEqual(r.errores, [], id); return r.items; };

// Las personas (como las arma el servidor: rol, áreas y niveles de su perfil).
const CEO = personaDe({ email: 'ceo@x.com', role: 'ceo' });
const COO = personaDe({ email: 'coo@x.com', role: 'coo', areas: ['home', 'control', 'clients', 'sales', 'operations', 'work', 'content', 'estrategia', 'resultados', 'library', 'team'] });
const ANA = personaDe({ email: 'ana@x.com', role: 'team', areas: ['home', 'work', 'content', 'library', 'team'] });
const COBROS = personaDe({ email: 'cob@x.com', role: 'team', areas: ['home', 'work', 'finanzas', 'team'], niveles: { finanzas: 'resumen' } });
const VENTAS = personaDe({ email: 'ven@x.com', role: 'team', areas: ['home', 'work', 'sales', 'team'] });
const team = [
  { id: 'ceo@x.com', email: 'ceo@x.com', name: 'Dirección General', role: 'ceo' },
  { id: 'coo@x.com', email: 'coo@x.com', name: 'Operaciones Uno', role: 'coo', roles: ['coo'], reports_to: 'ceo@x.com' },
  { id: 'ana@x.com', email: 'ana@x.com', name: 'Ana Diseño', role: 'team', roles: ['content'], reports_to: 'coo@x.com' },
  { id: 'luis@x.com', email: 'luis@x.com', name: 'Luis Video', role: 'team', roles: ['video'] },
];
const clientes = [{ slug: 'nao', nombre: 'NAO', ficha: { hay: true } }, { slug: 'akai', nombre: 'akai', ficha: { hay: true } }];
const projects = [{ id: 'pr-nao', client_slug: 'nao', client: 'NAO', name: 'NAO · Ciclo' }];

t('tareas-cadena: quién revisa (accountable → jefe directo → CEO), la cadena y el OK de pauta', () => {
  const c = cadenaDe(team, 'ceo@x.com');
  assert.equal(c.ceoKey, 'ceo@x.com'); assert.equal(c.cooKey, 'coo@x.com');
  assert.equal(c.accOf({ assignee: 'ana@x.com' }), 'coo@x.com', 'sin accountable revisa su jefe directo');
  assert.equal(c.accOf({ assignee: 'luis@x.com' }), 'ceo@x.com', 'sin jefe revisa el CEO');
  assert.equal(c.accOf({ assignee: 'ana@x.com', accountable: 'ceo@x.com' }), 'ceo@x.com');
  assert.deepEqual(c.chain({ assignee: 'ana@x.com' }), ['ana@x.com', 'coo@x.com', 'ceo@x.com']);
  assert.equal(cadenaDe([], 'yo@x.com').ceoKey, 'yo@x.com', 'sin CEO en el equipo cuenta quien mira (como Mis tareas)');
  const ads = { budget: 3000, ok: { month: '2026-10', budget: 3000 } };
  assert.ok(okOf(ads, '2026-10')); assert.equal(okOf(ads, '2026-11'), null, 'otro mes'); assert.equal(okOf({ ...ads, budget: 4000 }, '2026-10'), null, 'otro monto');
});

t('con todo vacío, ninguna regla de trabajo falla ni avisa (para ninguna persona)', () => {
  for (const p of [CEO, COO, ANA, COBROS, VENTAS]) { const r = correr(TRABAJO, datos(), p, HOY); assert.deepEqual(r.errores, []); assert.deepEqual(r.items, []); }
});

// ---------- Pagos y revisiones ----------
const payQ = { id: 'q1', number: 'COT-2026-014', client: 'Nao', status: 'Aceptada', pay_task_id: 'tp1', payment: { status: 'por confirmar', amount: 18480, currency: 'GTQ', method: 'Transferencia', at: '2026-10-25T15:00:00Z' } };
const payT = { id: 'tp1', kind: 'pago', quote_id: 'q1', title: 'Subir el pago de Nao · COT-2026-014', assignee: 'cob@x.com', accountable: 'ceo@x.com', status: 'En revisión', due: '2026-10-28', amount_due: 18480, currency: 'GTQ' };

t('pago-por-confirmar: al CEO y al COO, con «Confirmar pago»; no con el pago ya confirmado', () => {
  const [x, ...resto] = corre('pago-por-confirmar', { quotes: [payQ, { ...payQ, id: 'q2', payment: { status: 'confirmado' } }, { ...payQ, id: 'q3', payment: null }] });
  assert.equal(resto.length, 0);
  assert.equal(x.clave, 'pago-por-confirmar:q1'); assert.equal(x.urgencia, 'alta');
  assert.equal(x.titulo, 'Llegó el comprobante de Nao: confirma el pago para arrancar');
  assert.equal(x.detalle, 'COT-2026-014 · Q18,480 · Transferencia');
  assert.deepEqual(x.accion, { label: 'Confirmar pago', abre: 'confirmar-pago', id: 'q1' });
  assert.equal(corre('pago-por-confirmar', { quotes: [payQ] }, COO).length, 1);
  assert.deepEqual(corre('pago-por-confirmar', { quotes: [payQ] }, VENTAS), [], 'solo el CEO o el COO confirman');
});

t('pago-por-confirmar esconde la revisión de su tarea de cobro (y si no sale, la revisión sí)', () => {
  const r = correr(TRABAJO, datos({ team, quotes: [payQ], tasks: [payT] }), CEO, HOY);
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.items.map((x) => x.clave), ['pago-por-confirmar:q1']);
  assert.deepEqual(corre('revision-esperando-ok', { team, quotes: [{ ...payQ, payment: { status: 'confirmado' } }], tasks: [payT] }).map((x) => x.clave), ['revision-esperando-ok:tp1']);
});

t('revision-esperando-ok: a quien revisa por la cadena (jefe directo o CEO); con más de 3, uno solo', () => {
  const T = (id, o) => ({ id, title: 'Pieza ' + id, status: 'En revisión', project_id: 'pr-nao', dept: '⑥A Diseño gráfico', _meta: { updated_at: `2026-10-2${id.length}T10:00:00Z` }, ...o });
  const tasks = [T('a', { assignee: 'ana@x.com' }), T('bb', { assignee: 'luis@x.com' }), T('ccc', { assignee: 'ana@x.com', accountable: 'ceo@x.com' }), T('d', { assignee: 'luis@x.com', status: 'En curso' })];
  const coo = corre('revision-esperando-ok', { team, projects, tasks }, COO);
  assert.deepEqual(coo.map((x) => x.titulo), ['Ana entregó «Pieza a» y espera tu revisión'], 'la de Ana sin accountable la revisa su jefe directo');
  assert.equal(coo[0].detalle, 'NAO · ⑥A Diseño gráfico'); assert.deepEqual(coo[0].accion, { label: 'Revisar', abre: 'tarea', id: 'a' });
  assert.deepEqual(corre('revision-esperando-ok', { team, projects, tasks }).map((x) => x.clave), ['revision-esperando-ok:bb', 'revision-esperando-ok:ccc']);
  assert.deepEqual(corre('revision-esperando-ok', { team, projects, tasks }, ANA), [], 'Ana no revisa nada');
  const muchas = [1, 2, 3, 4].map((i) => T('x' + i, { assignee: 'luis@x.com' }));
  const [uno, ...mas] = corre('revision-esperando-ok', { team, projects, tasks: muchas });
  assert.equal(mas.length, 0); assert.equal(uno.titulo, 'Tienes 4 entregas esperando tu revisión'); assert.equal(uno.accion.href, '#/org/work/decisiones');
});

t('tarea-devuelta: con la nota del «↩ Devolver»; se apaga al volver a entregarla', () => {
  const tk = { id: 'r3', title: 'Reel 3 · Nao', assignee: 'ana@x.com', status: 'En curso', project_id: 'pr-nao', comments: [{ who: 'Operaciones Uno', at: '2026-10-25T18:00:00Z', text: '↩ el logo va abajo' }] };
  const [x] = corre('tarea-devuelta', { projects, tasks: [tk] }, ANA);
  assert.equal(x.titulo, 'Te devolvieron «Reel 3 · Nao»: «el logo va abajo»'); assert.equal(x.urgencia, 'alta');
  assert.deepEqual(x.accion, { label: 'Ver qué cambiar', abre: 'tarea', id: 'r3' }); assert.equal(x.cliente, 'nao');
  assert.deepEqual(corre('tarea-devuelta', { tasks: [{ ...tk, status: 'En revisión' }] }, ANA), [], 'ya la volvió a entregar');
  assert.deepEqual(corre('tarea-devuelta', { tasks: [{ ...tk, status: 'Hecha' }] }, ANA), [], 'ya la aprobaron');
  assert.deepEqual(corre('tarea-devuelta', { tasks: [{ ...tk, comments: [{ who: 'Ana', text: 'Voy con esta' }] }] }, ANA), [], 'sin «↩» no hay devolución');
  assert.deepEqual(corre('tarea-devuelta', { tasks: [tk] }, COO), [], 'solo a quien la hace');
});

// ---------- Aprobaciones del CEO ----------
t('est-por-aprobar: con roadmap y sin OK, solo al CEO', () => {
  const viva = { id: 'nao--viva', slug: 'nao', viva: { roadmap: { filas: [{ area: 'Contenido', celdas: ['', '', '', ''] }] }, actualizado: { roadmap: '2026-10-24T12:00:00Z' } } };
  const [x] = corre('est-por-aprobar', { clientes, strategy: [viva] });
  assert.equal(x.titulo, 'La estrategia de NAO está lista para tu OK'); assert.equal(x.accion.href, '#/estrategia/nao'); assert.equal(x.urgencia, 'alta');
  assert.deepEqual(corre('est-por-aprobar', { clientes, strategy: [{ ...viva, aprobado: { por: 'ceo@x.com' } }] }), [], 'ya aprobada');
  assert.deepEqual(corre('est-por-aprobar', { clientes, strategy: [{ ...viva, viva: { roadmap: { filas: [] } } }] }), [], 'sin roadmap no se aprueba');
  assert.deepEqual(corre('est-por-aprobar', { clientes, strategy: [viva] }, COO), [], 'solo el CEO');
});

t('ads-sin-ok: el OK vale para el mes y el monto; el CEO lo da desde el aviso; corriendo no se pospone', () => {
  const acc = (ads) => ({ accounts: [{ id: 'acc-nao', ads }], clientes });
  const [x] = corre('ads-sin-ok', acc({ budget: 3000 }));
  assert.equal(x.titulo, 'La pauta de NAO espera tu OK: Q3,000/mes'); assert.equal(x.fijo, false); assert.equal(x.huella, '2026-10|3000');
  assert.deepEqual(x.accion.api, { method: 'PUT', ruta: 'ads/accounts/nao', body: { ok: true } }); assert.equal(x.accion.label, 'Dar OK · Q3,000/mes');
  assert.deepEqual(corre('ads-sin-ok', acc({ budget: 3000, ok: { month: '2026-10', budget: 3000 } })), [], 'con el OK del mes no sale');
  assert.deepEqual(corre('ads-sin-ok', acc({ budget: 0 })), [], 'sin presupuesto no hay pauta');
  assert.match(corre('ads-sin-ok', acc({ budget: 3000, ok: { month: '2026-09', budget: 3000 } }))[0].detalle, /era de septiembre/);
  assert.match(corre('ads-sin-ok', acc({ budget: 4000, ok: { month: '2026-10', budget: 3000 } }))[0].detalle, /Cambió el presupuesto/);
  const [c] = corre('ads-sin-ok', { ...acc({ budget: 3000 }), campaigns: [{ id: 'c1', client_slug: 'nao', status: 'Activa' }] });
  assert.equal(c.titulo, 'La pauta de NAO está corriendo sin tu OK de este mes'); assert.equal(c.fijo, true);
  const enTarea = corre('ads-sin-ok', { ...acc({ budget: 3000 }), projects, tasks: [{ id: 'tc', kind: 'campaign', project_id: 'pr-nao', campaign: { status: 'Activa' } }] });
  assert.equal(enTarea[0].fijo, true, 'la campaña guardada como tarea de ⑩ también cuenta');
  const ads = personaDe({ email: 'ads@x.com', role: 'team', areas: ['work'] });
  const [y] = corre('ads-sin-ok', { ...acc({ budget: 3000 }), yo: { roles: ['ads'] } }, ads);
  assert.equal(y.titulo, 'La pauta de NAO espera el OK del CEO: Q3,000/mes'); assert.deepEqual(y.accion, { label: 'Ver encargo', href: '#/org/work/zona/ads' });
  assert.deepEqual(corre('ads-sin-ok', acc({ budget: 3000 }), ANA), [], 'sin el perfil ads no le sale');
});

t('anuncios-por-aprobar: los de Borrador sin faltas y las aprobadas sin lanzar, uno por marca, solo al CEO', () => {
  const V = (id, o) => ({ id, profile: 'nao', estado: 'Borrador', plataforma: 'meta', title: 'Gancho', caption: 'Texto', ...o });
  const ad_variants = [V('v1'), V('v2'), V('v3', { caption: '' }), V('v4', { estado: 'Aprobada' }), V('v5', { estado: 'Aprobada', lanzar: { tarea: 't' } }), V('v6', { archivado: true }), V('v7', { estado: 'Lanzada' })];
  const [x, ...resto] = corre('anuncios-por-aprobar', { clientes, ad_variants });
  assert.equal(resto.length, 0);
  assert.equal(x.titulo, 'Hay 2 anuncios de NAO listos para tu OK'); assert.equal(x.detalle, 'Y 1 aprobado falta mandarlo a lanzar.');
  assert.equal(x.accion.href, '#/marcas/nao/ads'); assert.equal(x.urgencia, 'media'); assert.equal(x.huella, 'v1,v2,v4');
  assert.equal(corre('anuncios-por-aprobar', { clientes, ad_variants: [V('v4', { estado: 'Aprobada' })] })[0].titulo, '1 anuncio aprobado de NAO: falta mandarlo a lanzar');
  assert.deepEqual(corre('anuncios-por-aprobar', { clientes, ad_variants: [V('v3', { caption: '' })] }), [], 'con faltas no se puede aprobar');
  assert.deepEqual(corre('anuncios-por-aprobar', { clientes, ad_variants }, COO), [], 'solo el CEO');
});

t('cotizacion-borrador: al CEO con «Revisar y enviar»; a quien la armó, sin botón', () => {
  const quotes = [{ id: 'q7', number: 'COT-2026-014', client: 'Nao', status: 'Borrador', _meta: { created_by: 'ven@x.com' } }, { id: 'q8', number: 'COT-2026-015', client: 'Otro', status: 'Enviada' }];
  const [x] = corre('cotizacion-borrador', { quotes });
  assert.equal(x.titulo, 'La cotización COT-2026-014 de Nao espera tu sí para salir'); assert.equal(x.accion.href, '#/org/sales/quotes/q7');
  const [y] = corre('cotizacion-borrador', { quotes }, VENTAS);
  assert.equal(y.titulo, 'Tu cotización COT-2026-014 de Nao espera el sí del CEO'); assert.equal(y.accion, null); assert.equal(y.urgencia, 'baja');
  const otra = personaDe({ email: 'otra@x.com', role: 'team', areas: ['sales'] });
  assert.deepEqual(corre('cotizacion-borrador', { quotes }, otra), [], 'si no la armó y no es el CEO, no le toca');
});

// ---------- Ventas ----------
t('lead-seguimiento: vencido o sin siguiente paso; lo que espera respuesta no; con más de 3, uno solo', () => {
  const L = (id, o) => ({ id, name: 'Lead ' + id, stage: 'Contactado', created_at: '2026-10-01T12:00:00Z', first_reply_at: '2026-10-01T12:01:00Z', ...o });
  const leads = [
    L('1', { name: 'Nao', next_step: 'mandar propuesta', next_date: '2026-10-25' }), L('2', { stage: 'Reunión' }), L('3', { next_step: 'llamar', next_date: '2026-10-30' }),
    L('4', { stage: 'Nuevo', first_reply_at: null }), L('5', { stage: 'Ganado' }), L('6', { archived: true }), L('7', { next_step: 'escribirle' }),
  ];
  const xs = corre('lead-seguimiento', { leads });
  assert.deepEqual(xs.map((x) => x.titulo).sort(), ['Lead 2 no tiene siguiente paso', 'Lead 7 no tiene fecha para «escribirle»', 'Seguimiento a Nao: venció ayer «mandar propuesta»']);
  assert.ok(xs.every((x) => x.urgencia === 'media' && x.accion.href.startsWith('#/org/sales/crm/')));
  const resumen = personaDe({ email: 'r@x.com', role: 'team', areas: ['sales'], niveles: { sales: 'resumen' } });
  assert.equal(corre('lead-seguimiento', { leads }, resumen).length, 3, 'en «resumen» también: Ventas promete los seguimientos vencidos');
  assert.deepEqual(corre('lead-seguimiento', { leads }, ANA), [], 'sin Ventas no sale');
  const [uno, ...mas] = corre('lead-seguimiento', { leads: [1, 2, 3, 4].map((i) => L('m' + i, { next_step: 'x', next_date: '2026-10-20' })) });
  assert.equal(mas.length, 0); assert.equal(uno.titulo, 'Tienes 4 leads sin seguimiento al día'); assert.equal(uno.accion.href, '#/org/sales/crm');
});

t('lead-por-cotizar: caso entendido y sin cotización viva; solo quien edita Ventas', () => {
  const leads = [{ id: 'a', name: 'Nao', stage: 'Reunión' }, { id: 'b', name: 'Con cot', stage: 'Propuesta' }, { id: 'c', name: 'Rechazó', stage: 'Propuesta' }, { id: 'd', name: 'Temprano', stage: 'Contactado' }, { id: 'e', name: 'Viejo', stage: 'Reunión', archived: true }];
  const quotes = [{ id: 'q1', lead_id: 'b', status: 'Enviada' }, { id: 'q2', lead_id: 'c', status: 'Rechazada' }];
  const xs = corre('lead-por-cotizar', { leads, quotes });
  assert.deepEqual(xs.map((x) => x.clave).sort(), ['lead-por-cotizar:a', 'lead-por-cotizar:c']);
  assert.equal(xs.find((x) => x.clave.endsWith(':a')).titulo, 'Ya entendiste el caso de Nao: falta darle el precio');
  assert.equal(xs[0].accion.label, 'Cotizar'); assert.match(xs[0].accion.href, /^#\/org\/sales\/quotes\/new\//);
  assert.equal(corre('lead-por-cotizar', { leads, quotes }, VENTAS).length, 2);
  const completo = personaDe({ email: 'v@x.com', role: 'team', areas: ['sales'], niveles: { sales: 'completo' } });
  assert.deepEqual(corre('lead-por-cotizar', { leads, quotes }, completo), [], 'sin editar Ventas no cotiza');
});

// ---------- Cobros y pagos ----------
t('falta-pago: al CEO y a quien sube el pago; el devuelto lleva la nota; urgente si la tarea ya vence', () => {
  const q = { id: 'q2', number: 'COT-2026-014', client: 'Nao', status: 'Aceptada', pay_task_id: 'tp2', approved_at: '2026-10-24T12:00:00Z', currency: 'GTQ', items: [{ qty: 1, price: 18480 }] };
  const tp = { id: 'tp2', kind: 'pago', quote_id: 'q2', title: 'Subir el pago de Nao · COT-2026-014', assignee: 'cob@x.com', status: 'Por empezar', due: '2026-10-29', amount_due: 18480, currency: 'GTQ' };
  const [x] = corre('falta-pago', { quotes: [q], tasks: [tp] });
  assert.equal(x.titulo, 'Nao aprobó la cotización: falta subir su pago'); assert.equal(x.urgencia, 'media'); assert.equal(x.detalle, 'COT-2026-014 · vence el jueves');
  assert.deepEqual(x.accion, { label: 'Subir pago', abre: 'pago', datos: { quote_id: 'q2', client: 'Nao', currency: 'GTQ', amount: 18480 } });
  assert.equal(corre('falta-pago', { quotes: [q], tasks: [{ ...tp, due: '2026-10-26' }] })[0].urgencia, 'alta', 'la tarea de cobro vence hoy');
  const [dev] = corre('falta-pago', { quotes: [{ ...q, payment: { status: 'rechazado', note: 'falta la boleta' } }], tasks: [tp] });
  assert.equal(dev.titulo, 'El pago de Nao fue devuelto: súbelo otra vez'); assert.match(dev.detalle, /«falta la boleta»/);
  assert.deepEqual(corre('falta-pago', { quotes: [{ ...q, payment: { status: 'por confirmar' } }], tasks: [tp] }), [], 'ya subieron el pago');
  assert.deepEqual(corre('falta-pago', { quotes: [q], tasks: [tp] }, VENTAS), [], 'no es suya la tarea de cobro');
  // Quien sube el pago y no ve Ventas: le llega por su tarea de cobro.
  const [c] = corre('falta-pago', { quotes: [], tasks: [tp] }, COBROS);
  assert.equal(c.titulo, 'Nao aprobó la cotización: falta subir su pago'); assert.equal(c.accion.datos.quote_id, 'q2'); assert.equal(c.accion.datos.amount, 18480);
  const [c2] = corre('falta-pago', { tasks: [{ ...tp, status: 'En curso', comments: [{ text: 'Pago devuelto: falta la boleta' }] }] }, COBROS);
  assert.equal(c2.titulo, 'El pago de Nao fue devuelto: súbelo otra vez');
  assert.deepEqual(corre('falta-pago', { tasks: [{ ...tp, status: 'En revisión' }] }, COBROS), [], 'ya lo subió');
});

t('fac-cobrar-vencida: la vencida sin cobrar; se salta al cliente con un pago en los últimos 14 días', () => {
  const f = { id: 'f1', kind: 'cobrar', client: 'nao', amount: 18480, currency: 'GTQ', due: '2026-10-05', status: 'pendiente', concept: 'Plan mensual' };
  const [x] = corre('fac-cobrar-vencida', { clientes, invoices: [f, { ...f, id: 'f2', due: '2026-11-05' }, { ...f, id: 'f3', status: 'pagada', paid_at: '2026-09-01' }] });
  assert.equal(x.titulo, 'La factura de NAO (Q18,480) venció el 5 y no se ha cobrado'); assert.equal(x.urgencia, 'alta'); assert.equal(x.accion.href, '#/org/finanzas/fact');
  assert.deepEqual(corre('fac-cobrar-vencida', { invoices: [f, { ...f, id: 'f3', status: 'pagada', paid_at: '2026-10-20' }] }), [], 'pagó hace 6 días: no se le cobra encima');
  assert.match(corre('fac-cobrar-vencida', { invoices: [f] }, COBROS)[0].detalle, /sí del CEO/, 'Cobros la ve en resumen');
  assert.deepEqual(corre('fac-cobrar-vencida', { invoices: [f] }, ANA), [], 'sin Finanzas no sale');
  assert.equal(corre('fac-cobrar-vencida', { invoices: [{ ...f, due: '2026-09-28' }] })[0].titulo, 'La factura de NAO (Q18,480) venció el 28 de septiembre y no se ha cobrado');
});

t('fac-pagar: lo que vence en 7 días, sin montos; la duplicada según Laya (umbral de la puerta o 0.5); solo al CEO', () => {
  const f = { id: 'p1', kind: 'pagar', vendor: 'Proveedor X', amount: 2300, currency: 'GTQ', due: '2026-10-29', status: 'pendiente', concept: 'Licencia' };
  const invoices = [f, { ...f, id: 'p2', due: '2026-11-20' }, { ...f, id: 'p3', status: 'pagada' }];
  const [x, ...resto] = corre('fac-pagar', { invoices });
  assert.equal(resto.length, 0);
  assert.equal(x.titulo, 'Pagar a Proveedor X: vence el jueves'); assert.ok(!/Q|2,?300/.test(x.titulo + x.detalle), 'un costo de Inherent: sin montos');
  assert.equal(x.accion.label, 'Revisar y pagar');
  const J = (prob, at = '2026-10-25T10:00:00Z') => ({ id: 'j' + prob, gate: 'factura', target: { coll: 'invoices', id: 'p1' }, status: 'hecho', question_id: 'duplicada', tipo: 'noul', prob, at });
  const [d] = corre('fac-pagar', { invoices, judgments: [J(0.82)] });
  assert.equal(d.titulo, 'Laya cree que la factura de Proveedor X está duplicada: no la pagues todavía'); assert.match(d.detalle, /^duplicada 82%/);
  assert.notEqual(d.huella, x.huella, 'un pospuesto vuelve si Laya dice que está duplicada');
  assert.equal(corre('fac-pagar', { invoices, judgments: [J(0.3)] })[0].titulo, 'Pagar a Proveedor X: vence el jueves');
  assert.equal(corre('fac-pagar', { invoices, judgments: [J(0.82, '2026-10-20T10:00:00Z'), J(0.2, '2026-10-25T10:00:00Z')] })[0].titulo, 'Pagar a Proveedor X: vence el jueves', 'cuenta el último juicio');
  const conUmbral = { laya_gates: { gates: { factura: { preguntas: [{ id: 'duplicada', tipo: 'noul', texto: '¿Duplicada?', umbral: 0.9 }, { id: 'categoria', tipo: 'choice', texto: '¿Categoría?', opciones: { Pauta: 'pauta', Otro: 'otro' } }] } } } };
  assert.equal(corre('fac-pagar', { invoices, judgments: [J(0.82)], settings: conUmbral })[0].titulo, 'Pagar a Proveedor X: vence el jueves', 'con umbral 0.9, un 82% no basta');
  assert.equal(corre('fac-pagar', { invoices: [{ ...f, due: '2026-10-20' }] })[0].titulo, 'Pagar a Proveedor X: venció el 20');
  assert.deepEqual(corre('fac-pagar', { invoices }, COO), [], 'solo el CEO');
});

// ---------- Marcas y encargos ----------
t('cambios-del-cliente: la nota del cliente; urgente si sale en 7 días o desde el día 16 (por tramo del ciclo)', () => {
  const P = (o) => ({ id: 'p1', kind: 'post', profile: 'nao', title: 'Reel lanzamiento', status: 'En proceso', date: '2026-12-15', aprobacion: { estado: 'cambios', nota: 'cambiar la música', at: '2026-10-01T12:00:00Z' }, ...o });
  const [x] = corre('cambios-del-cliente', { clientes, content: [P()] });
  assert.equal(x.titulo, 'NAO pidió cambios en «Reel lanzamiento»: «cambiar la música»'); assert.equal(x.accion.href, '#/marcas/nao/calendario');
  // La misma pieza (sale en diciembre) en cada tramo del ciclo: 1-3, 4-11, 12-15 → media; 16-20 y 21 en adelante → alta.
  const tramos = { '2026-10-02': 'media', '2026-10-05': 'media', '2026-10-09': 'media', '2026-10-13': 'media', '2026-10-17': 'alta', '2026-10-26': 'alta' };
  for (const [hoy, u] of Object.entries(tramos)) assert.equal(corre('cambios-del-cliente', { content: [P()] }, CEO, hoy)[0].urgencia, u, hoy);
  assert.equal(corre('cambios-del-cliente', { content: [P({ date: '2026-10-18' })] }, CEO, '2026-10-13')[0].urgencia, 'alta', 'sale en 5 días');
  assert.deepEqual(corre('cambios-del-cliente', { content: [P({ por_aprobar: true })] }), [], 'ya se reenvió a aprobación');
  assert.deepEqual(corre('cambios-del-cliente', { content: [P({ status: 'Listo' })] }), []);
  assert.deepEqual(corre('cambios-del-cliente', { content: [P({ aprobacion: { estado: 'aprobada' } })] }), []);
  assert.equal(corre('cambios-del-cliente', { content: [P()] }, ANA).length, 1, 'el perfil content edita Marcas');
  const resumen = personaDe({ email: 'r@x.com', role: 'team', areas: ['content'], niveles: { content: 'resumen' } });
  assert.deepEqual(corre('cambios-del-cliente', { content: [P()] }, resumen), [], 'con contenido en «resumen» no llega');
});

t('encargo-recibido: el que te pasaron y no has empezado; lleva a su área', () => {
  const E = (id, o) => ({ id, title: 'Perfiles de puesto', origen: 'estrategia', area: 'consulting', cliente: 'nao', client_slug: 'nao', assignee: 'ana@x.com', status: 'Por empezar', _meta: { created_by: 'ceo@x.com' }, ...o });
  const tasks = [E('e1'), E('e2', { _meta: { created_by: 'ana@x.com' } }), E('e3', { status: 'En curso' }), E('e4', { due: '2026-10-26' }), E('e5', { area: 'marketing' }), E('e6', { area: 'diseno', due: '2026-11-02' })];
  const xs = corre('encargo-recibido', { clientes, tasks }, ANA);
  assert.deepEqual(xs.map((x) => x.clave).sort(), ['encargo-recibido:e1', 'encargo-recibido:e5', 'encargo-recibido:e6']);
  const e1 = xs.find((x) => x.clave.endsWith('e1'));
  assert.equal(e1.titulo, 'Te llegó un encargo de Estrategia: «Perfiles de puesto · NAO»'); assert.equal(e1.detalle, 'Para Consulting');
  assert.deepEqual(e1.accion, { label: 'Abrir', abre: 'tarea', id: 'e1' }, 'sin Estrategia no abre Consulting: abre la tarea');
  const conEstrategia = personaDe({ email: 'ana@x.com', role: 'team', areas: ['work', 'content', 'estrategia'] });
  assert.equal(corre('encargo-recibido', { clientes, tasks: [E('e1')] }, conEstrategia)[0].accion.href, '#/consulting/nao');
  assert.equal(xs.find((x) => x.clave.endsWith('e6')).accion.href, '#/marcas/nao/design');
  assert.deepEqual(xs.find((x) => x.clave.endsWith('e5')).accion, { label: 'Abrir', abre: 'tarea', id: 'e5' });
  assert.deepEqual(corre('encargo-recibido', { tasks }, COO), [], 'solo a quien lo recibe');
});

t('equipo-atrasado: las atrasadas de los demás por persona y cliente; las propias no; al COO y al CEO', () => {
  const T = (id, o) => ({ id, title: 'T' + id, status: 'En curso', due: '2026-10-20', ...o });
  const tasks = [T('1', { assignee: 'ana@x.com', project_id: 'pr-nao' }), T('2', { assignee: 'ana@x.com', project_id: 'pr-nao', due: '2026-10-22' }), T('3', { assignee: 'luis@x.com' }), T('4', { assignee: 'coo@x.com' }), T('5', { assignee: 'luis@x.com', status: 'Hecha' }), T('6', { assignee: 'luis@x.com', due: '2026-10-26' })];
  const [x] = corre('equipo-atrasado', { team, projects, tasks }, COO);
  assert.equal(x.titulo, '3 tareas del equipo están atrasadas (2 son de NAO)'); assert.equal(x.detalle, 'Ana 2 · Luis 1'); assert.equal(x.accion.href, '#/org/work/equipo');
  assert.equal(x.desde, '2026-10-20');
  assert.equal(corre('equipo-atrasado', { team, projects, tasks }).at(0).titulo, '4 tareas del equipo están atrasadas (2 son de NAO)', 'para el CEO cuenta también la del COO');
  assert.deepEqual(corre('equipo-atrasado', { team, projects, tasks }, ANA), [], 'lo coordina el COO');
  assert.deepEqual(corre('equipo-atrasado', { team, tasks: [T('9', { assignee: 'coo@x.com' })] }, COO), [], 'las propias van en tareas-vencidas');
});

// ---------- Lo que encontró la revisión (cada una fallaba antes del arreglo) ----------
// Pospone el aviso el día «de» hasta «hasta» y dice si el día «ver» sigue escondido.
const sigueEscondido = (id, d, p, de, hasta, ver) => {
  const [x] = corre(id, d, p, de); assert.ok(x, `${id} sale el ${de}`);
  const { pos } = posponer({}, { clave: x.clave, hasta, huella: x.huella }, x, de);
  const [y] = corre(id, d, p, ver); assert.ok(y, `${id} sale el ${ver}`);
  return aplicarPospuestos([y], pos, ver).pospuestos.length === 1;
};

t('revisión · ads-sin-ok: el OK que el CEO da el último día después de las 18:00 (queda con el mes siguiente en UTC) vale', () => {
  const acc = (ok) => ({ accounts: [{ id: 'acc-nao', ads: { budget: 3000, ok } }], clientes });
  assert.deepEqual(corre('ads-sin-ok', acc({ month: '2026-11', budget: 3000 }), CEO, '2026-10-31'), [], 'el 31 a las 19:00 el server guardó «2026-11»');
  assert.deepEqual(corre('ads-sin-ok', acc({ month: '2027-01', budget: 3000 }), CEO, '2026-12-31'), [], 'también en diciembre (Mc es enero del año siguiente)');
  assert.deepEqual(corre('ads-sin-ok', acc({ month: '2026-11', budget: 3000 }), CEO, '2026-11-01'), [], 'y al día siguiente sigue valiendo');
  assert.match(corre('ads-sin-ok', acc({ month: '2026-11', budget: 2000 }), CEO, '2026-10-31')[0].detalle, /Cambió el presupuesto/, 'con otro monto: el porqué es el monto, no el mes');
  assert.match(corre('ads-sin-ok', acc({ month: '2026-09', budget: 3000 }), CEO, '2026-10-31')[0].detalle, /era de septiembre/);
});

t('revisión · anuncios-por-aprobar: con 1 aprobado sin lanzar dice «mandarlo», no «mandarlos»', () => {
  const V = (id, o) => ({ id, profile: 'nao', estado: 'Aprobada', plataforma: 'meta', title: 'Gancho', caption: 'Texto', ...o });
  assert.equal(corre('anuncios-por-aprobar', { clientes, ad_variants: [V('v4')] })[0].titulo, '1 anuncio aprobado de NAO: falta mandarlo a lanzar');
  assert.equal(corre('anuncios-por-aprobar', { clientes, ad_variants: [V('v4'), V('v5')] })[0].titulo, '2 anuncios aprobados de NAO: falta mandarlos a lanzar');
});

t('revisión · tarea-devuelta: un comentario después (o la reasignación) no la apaga; solo volver a entregarla', () => {
  const dev = { who: 'Operaciones Uno', at: '2026-10-25T18:00:00Z', text: '↩ el logo va abajo' };
  const tk = (comments, o) => ({ id: 'r3', title: 'Reel 3 · Nao', assignee: 'ana@x.com', status: 'En curso', project_id: 'pr-nao', comments, ...o });
  const [x] = corre('tarea-devuelta', { projects, tasks: [tk([dev, { who: 'Ana Diseño', at: '2026-10-25T19:00:00Z', text: '¿abajo a la izquierda?' }])] }, ANA);
  assert.equal(x?.titulo, 'Te devolvieron «Reel 3 · Nao»: «el logo va abajo»', 'Ana preguntó algo: todavía no la entrega');
  assert.equal(x.huella, dev.at);
  const [y] = corre('tarea-devuelta', { projects, tasks: [tk([dev, { who: 'Operaciones Uno', at: '2026-10-26T09:00:00Z', text: 'Reasignada: Luis Video → Ana Diseño' }])] }, ANA);
  assert.ok(y, 'la reasignación deja un comentario del sistema: la devolución sigue en pie');
  const [z] = corre('tarea-devuelta', { projects, tasks: [tk([{ ...dev, text: '↩ primero esto' }, { who: 'Ana', text: 'Listo' }, { ...dev, at: '2026-10-26T10:00:00Z', text: '↩ ahora el color' }, { who: 'Ana', text: 'ok' }])] }, ANA);
  assert.equal(z.titulo, 'Te devolvieron «Reel 3 · Nao»: «ahora el color»', 'cuenta la última devolución');
});

t('revisión · falta-pago: pospuesto, vuelve el día que vence su tarea de cobro (se vuelve urgente)', () => {
  const q = { id: 'q2', number: 'COT-2026-014', client: 'Nao', status: 'Aceptada', pay_task_id: 'tp2', approved_at: '2026-10-24T12:00:00Z', currency: 'GTQ', items: [{ qty: 1, price: 18480 }] };
  const tp = { id: 'tp2', kind: 'pago', quote_id: 'q2', title: 'Subir el pago de Nao · COT-2026-014', assignee: 'cob@x.com', status: 'Por empezar', due: '2026-10-29', amount_due: 18480, currency: 'GTQ' };
  const d = { quotes: [q], tasks: [tp] };
  assert.equal(corre('falta-pago', d, CEO, '2026-10-29')[0].urgencia, 'alta');
  assert.equal(sigueEscondido('falta-pago', d, CEO, '2026-10-26', '2026-11-02', '2026-10-27'), true, 'mientras no vence, sigue pospuesto');
  assert.equal(sigueEscondido('falta-pago', d, CEO, '2026-10-26', '2026-11-02', '2026-10-29'), false, 'el día que vence, vuelve');
});

t('revisión · cambios-del-cliente: pospuesto, vuelve al volverse urgente (día 16 o a 7 días de salir)', () => {
  const P = (o) => ({ id: 'p1', kind: 'post', profile: 'nao', title: 'Reel lanzamiento', status: 'En proceso', date: '2026-12-15', aprobacion: { estado: 'cambios', nota: 'cambiar la música', at: '2026-10-01T12:00:00Z' }, ...o });
  assert.equal(corre('cambios-del-cliente', { content: [P()] }, CEO, '2026-10-15')[0].urgencia, 'media', 'el 15 todavía no');
  assert.equal(corre('cambios-del-cliente', { content: [P()] }, CEO, '2026-10-16')[0].urgencia, 'alta', 'el 16 sí');
  assert.equal(sigueEscondido('cambios-del-cliente', { content: [P()] }, ANA, '2026-10-12', '2026-10-20', '2026-10-15'), true);
  assert.equal(sigueEscondido('cambios-del-cliente', { content: [P()] }, ANA, '2026-10-12', '2026-10-20', '2026-10-16'), false, 'el día 16 vuelve');
  assert.equal(sigueEscondido('cambios-del-cliente', { content: [P({ date: '2026-11-11' })] }, ANA, '2026-11-01', '2026-11-08', '2026-11-04'), false, 'a 7 días de salir vuelve');
});

t('revisión · fac-pagar: pospuesta, vuelve si se vence', () => {
  const f = { id: 'p1', kind: 'pagar', vendor: 'Proveedor X', amount: 2300, currency: 'GTQ', due: '2026-10-29', status: 'pendiente', concept: 'Licencia' };
  assert.equal(sigueEscondido('fac-pagar', { invoices: [f] }, CEO, '2026-10-26', '2026-11-05', '2026-10-29'), true, 'el día que vence sigue pospuesta');
  assert.equal(sigueEscondido('fac-pagar', { invoices: [f] }, CEO, '2026-10-26', '2026-11-05', '2026-10-30'), false, 'vencida, vuelve');
});

t('revisión · cotizacion-borrador: una cotización sin status cuenta como Borrador (como Ventas y Control)', () => {
  const [x] = corre('cotizacion-borrador', { quotes: [{ id: 'q9', number: 'COT-2026-016', client: 'Nao', _meta: { created_by: 'ven@x.com' } }] });
  assert.equal(x?.titulo, 'La cotización COT-2026-016 de Nao espera tu sí para salir');
});

t('bordes: días 1, 3, 11, 12, 15, 16, 20, 21 y fin de mes; diciembre a enero', () => {
  const P = { id: 'p1', kind: 'post', profile: 'nao', title: 'Reel', status: 'En proceso', date: '2027-03-01', aprobacion: { estado: 'cambios', nota: 'x', at: '2026-10-01T12:00:00Z' } };
  const esperado = { '01': 'media', '03': 'media', 11: 'media', 12: 'media', 15: 'media', 16: 'alta', 20: 'alta', 21: 'alta', 31: 'alta' };
  for (const [dia, u] of Object.entries(esperado)) assert.equal(corre('cambios-del-cliente', { content: [P] }, CEO, `2026-12-${String(dia).padStart(2, '0')}`)[0].urgencia, u, `día ${dia}`);
  const f = (due) => ({ id: 'p1', kind: 'pagar', vendor: 'Proveedor X', due, status: 'pendiente' });
  assert.equal(corre('fac-pagar', { invoices: [f('2027-01-05')] }, CEO, '2026-12-30')[0].titulo, 'Pagar a Proveedor X: vence el martes', 'cruza el año');
  assert.equal(corre('fac-pagar', { invoices: [f('2026-12-31')] }, CEO, '2027-01-01')[0].titulo, 'Pagar a Proveedor X: venció ayer');
  const acc = (ok) => ({ accounts: [{ id: 'acc-nao', ads: { budget: 3000, ok } }], clientes });
  assert.match(corre('ads-sin-ok', acc({ month: '2026-12', budget: 3000 }), CEO, '2027-01-01')[0].detalle, /era de diciembre/, 'el 1 de enero el OK de diciembre ya no vale');
  assert.deepEqual(corre('ads-sin-ok', acc({ month: '2026-12', budget: 3000 }), CEO, '2026-12-31'), [], 'el 31 todavía vale');
});

console.log(`\n${n} pruebas de Avisos · Tu trabajo pasaron`);
