// Avisos · Tu trabajo: lo que te toca a ti (ver index.js y el catálogo en el comentario de cada regla).
// Cada regla: { id, grupo, area, urgencia, fijo?, necesita?, calcular(datos, persona, hoy, ciclo) → [aviso] }.
// Los datos llegan ya filtrados con lo que la persona ve (api/_lib/avisos-datos.js): aquí no se vuelve a filtrar el alcance.
import { aviso, plural, puede, masDias, diasEntre, nombreMes } from './base.js';
import { isWaiting, createdAt, stageKey, stageLabel, FLOW, invoiceSoon } from '../ventas-flujo.js';
import { estadoFactura, mesLabel } from '../facturas.js';
import { estadoDe, nombreDe, marcaDe } from '../element.js';
import { faltas } from '../ads-studio.js';
import { puertasDe, resumen, cumple, frase } from '../laya.js';
import { vivaId, avance } from '../estrategia-viva.js';
import { AREAS_ENCARGO } from '../llm/modos.js';
import { cadenaDe, okOf } from '../tareas-cadena.js';

const lc = (x) => String(x || '').toLowerCase();
const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const corta = (s, n = 120) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const primerNombre = (s) => String(s || '').trim().split(/\s+/)[0] || '';
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
// «el 5» si es de este mes; «el 5 de septiembre» si no.
const elDia = (iso, hoy) => `el ${+iso.slice(8, 10)}${iso.slice(0, 7) === hoy.slice(0, 7) ? '' : ` de ${nombreMes(iso)}`}`;
// Cuándo vence, en palabras: «venció ayer», «vence hoy», «vence el jueves», «vence el 5 de noviembre».
function cuando(iso, hoy) {
  const n = diasEntre(hoy, iso);
  if (n === -1) return 'venció ayer';
  if (n < 0) return `venció ${elDia(iso, hoy)}`;
  if (n === 0) return 'vence hoy';
  if (n === 1) return 'vence mañana';
  if (n < 7) return `vence el ${DIAS[new Date(iso + 'T12:00:00Z').getUTCDay()]}`;
  return `vence ${elDia(iso, hoy)}`;
}
const dinero = (n, moneda = 'GTQ') => `${moneda === 'USD' ? '$' : 'Q'}${(Math.round((+n || 0) * 100) / 100).toLocaleString('en-US')}`;
// El nombre de un cliente o marca: el de su ficha; si no, el slug en mayúsculas (como Mis tareas).
const nombreCli = (d, slug) => marcaDe(slug, Object.fromEntries((d.clientes || []).filter((c) => c.nombre && c.nombre !== c.slug).map((c) => [c.slug, c.nombre])));
const proyecto = (d, id) => (id ? (d.projects || []).find((x) => x.id === id) : null);
const clienteDe = (d, t) => proyecto(d, t.project_id)?.client_slug || t.client_slug || '';
// La cadena de mando (tareas-cadena.js, la misma de Mis tareas). Si nadie del equipo es el CEO, lo es quien mira (si lo es).
const cadena = (d, p) => cadenaDe(d.team || [], p.esCeo ? p.email : '');

// lead-sin-responder · inherent/05-OPERACION.md §3 «Primer contacto: un minuto». Uno por lead esperando, del más viejo
// al más nuevo; el reloj corre en vivo (vivo.desde). Se apaga solo al guardar la primera respuesta. No se pospone.
const LEAD = { id: 'lead-sin-responder', grupo: 'trabajo', area: 'organizacion', urgencia: 'alta', fijo: true, necesita: { area: 'sales' } };
LEAD.calcular = (d) => (d.leads || []).filter(isWaiting).sort((a, b) => createdAt(a) - createdAt(b)).map((l) => aviso(LEAD, {
  clave: `lead-sin-responder:${l.id}`, titulo: `${l.name || 'Un lead'} escribió y nadie le ha respondido`, detalle: [l.source, l.need || l.note].filter(Boolean).join(' · '),
  vivo: { desde: createdAt(l) }, desde: new Date(createdAt(l)).toISOString(), huella: l.id, accion: { label: 'Responder', href: `#/org/sales/crm/${encodeURIComponent(l.id)}` },
}));

// tareas-vencidas · inherent/05-OPERACION.md §4 «Los dos límites». Las tuyas con fecha de hoy o atrasadas (las de cobro
// van en falta-pago). Hasta 3, una por tarea; con más, un solo aviso con el número.
const VENCIDAS = { id: 'tareas-vencidas', grupo: 'trabajo', area: 'todas', urgencia: 'alta' };
VENCIDAS.calcular = (d, p, hoy) => {
  const xs = (d.tasks || []).filter((t) => lc(t.assignee) === p.email && t.status !== 'Hecha' && /^\d{4}-\d{2}-\d{2}$/.test(String(t.due || '')) && t.due <= hoy && t.kind !== 'pago')
    .sort((a, b) => a.due.localeCompare(b.due));
  if (!xs.length) return [];
  const atras = xs.filter((t) => t.due < hoy).length, deHoy = xs.length - atras;
  if (xs.length <= 3) return xs.map((t) => aviso(VENCIDAS, {
    clave: `tareas-vencidas:${t.id}`, titulo: t.due < hoy ? `Atrasada: «${t.title}»` : `Para hoy: «${t.title}»`, detalle: [t.dept, t.due < hoy ? `vencía el ${t.due.slice(8)}/${t.due.slice(5, 7)}` : ''].filter(Boolean).join(' · '),
    urgencia: 'alta', desde: t.due, huella: `${t.status}|${t.due}`, cliente: t.client_slug || '', accion: { label: 'Abrir', abre: 'tarea', id: t.id },
  }));
  return [aviso(VENCIDAS, {
    clave: 'tareas-vencidas', titulo: `Tienes ${[deHoy ? plural(deHoy, 'tarea para hoy', 'tareas para hoy') : '', atras ? plural(atras, 'atrasada', 'atrasadas') : ''].filter(Boolean).join(' y ')}`,
    desde: xs[0].due, huella: xs.map((t) => t.id).join(','), accion: { label: 'Ver', href: atras ? '#/org/work/atrasadas' : '#/org/work/hoy' },
  })];
};

// Las cotizaciones con el pago subido que falta confirmar (flow.js · payment las deja «por confirmar»).
const porConfirmar = (d) => (d.quotes || []).filter((q) => q.status === 'Aceptada' && q.payment?.status === 'por confirmar');

// pago-por-confirmar · inherent/05-OPERACION.md §3 «Sin input no hay etapa» y 08-CRITERIOS-DE-ACEPTACION.md §9 Factura #1.
// Confirmar crea el ingreso, el cliente, el proyecto y el onboarding: solo el CEO o el COO. Tapa la revisión de su tarea de cobro.
const PAGO_OK = { id: 'pago-por-confirmar', grupo: 'trabajo', area: 'organizacion', urgencia: 'alta', necesita: { rol: ['ceo', 'coo'] } };
PAGO_OK.calcular = (d) => porConfirmar(d).map((q) => aviso(PAGO_OK, {
  clave: `pago-por-confirmar:${q.id}`, cliente: q.client_slug || '', titulo: `Llegó el comprobante de ${q.client || 'un cliente'}: confirma el pago para arrancar`,
  detalle: [q.number, q.payment.amount ? dinero(q.payment.amount, q.payment.currency) : '', q.payment.method].filter(Boolean).join(' · '),
  desde: q.payment.at || '', huella: q.payment.at || q.payment.proof_id || 'por confirmar', accion: { label: 'Confirmar pago', abre: 'confirmar-pago', id: q.id },
  accion2: q.payment.proof_id ? { label: 'Ver comprobante', abre: 'comprobante', id: q.payment.proof_id } : null,
}));

// revision-esperando-ok · inherent/05-OPERACION.md §2 «La cadena de mando» y 08-CRITERIOS-DE-ACEPTACION.md: nada pasa a Listo
// sin cumplir su ficha. Le toca a quien revisa (accOf: accountable → jefe directo → CEO). Hasta 3 una por una; con más, una sola.
const REVISION = { id: 'revision-esperando-ok', grupo: 'trabajo', area: 'todas', urgencia: 'alta' };
REVISION.calcular = (d, p) => {
  const { person, accOf } = cadena(d, p);
  const yaSale = puede(p, PAGO_OK.necesita) ? new Set(porConfirmar(d).map((q) => q.id)) : new Set(); // la tarea de cobro ya va en pago-por-confirmar
  const xs = (d.tasks || []).filter((t) => t.status === 'En revisión' && lc(accOf(t)) === p.email && !(t.kind === 'pago' && yaSale.has(t.quote_id)))
    .sort((a, b) => String(a._meta?.updated_at || '').localeCompare(String(b._meta?.updated_at || '')));
  if (!xs.length) return [];
  if (xs.length > 3) return [aviso(REVISION, { clave: 'revision-esperando-ok', titulo: `Tienes ${plural(xs.length, 'entrega', 'entregas')} esperando tu revisión`, detalle: 'Aprueba o devuelve con el porqué escrito.', desde: xs[0]._meta?.updated_at || '', huella: xs.map((t) => t.id).join(','), accion: { label: 'Revisar', href: '#/org/work/decisiones' } })];
  return xs.map((t) => {
    const quien = lc(t.assignee) === p.email ? '' : primerNombre(person(t.assignee)?.name) || String(t.assignee || '').split('@')[0], slug = clienteDe(d, t);
    return aviso(REVISION, {
      clave: `revision-esperando-ok:${t.id}`, cliente: slug, titulo: quien ? `${quien} entregó «${t.title}» y espera tu revisión` : `«${t.title}» espera tu revisión`,
      detalle: [slug ? proyecto(d, t.project_id)?.client || nombreCli(d, slug) : '', t.dept].filter(Boolean).join(' · '), desde: t._meta?.updated_at || '',
      huella: `${t.link || ''}|${(t.files || []).length}|${(t.comments || []).length}`, accion: { label: 'Revisar', abre: 'tarea', id: t.id },
    });
  });
};

// tarea-devuelta · 08-CRITERIOS-DE-ACEPTACION.md: cada rechazo deja escrito el porqué; 05-OPERACION.md §4, días 16-19.
// La devolvieron con «↩ <nota>» y volvió a «En curso». Cuenta la última devolución aunque después alguien comente o la
// reasignen: se apaga solo al volver a entregarla (pasa a «En revisión»).
const DEVUELTA = { id: 'tarea-devuelta', grupo: 'trabajo', area: 'todas', urgencia: 'alta' };
const devolucion = (t) => [...(Array.isArray(t.comments) ? t.comments : [])].reverse().find((c) => String(c?.text || '').startsWith('↩ '));
DEVUELTA.calcular = (d, p) => (d.tasks || []).filter((t) => lc(t.assignee) === p.email && t.status === 'En curso' && devolucion(t)).map((t) => {
  const c = devolucion(t), nota = corta(c.text.slice(2)), slug = clienteDe(d, t);
  return aviso(DEVUELTA, {
    clave: `tarea-devuelta:${t.id}`, cliente: slug, titulo: `Te devolvieron «${t.title}»${nota ? `: «${nota}»` : ''}`,
    detalle: [c.who ? `La devolvió ${c.who}` : '', 'Cámbiala y vuelve a entregarla'].filter(Boolean).join(' · '), desde: c.at || '', huella: c.at || nota,
    accion: { label: 'Ver qué cambiar', abre: 'tarea', id: t.id },
  });
});

// est-por-aprobar · CLAUDE.md «Reglas»: el CEO bloquea en ① Strategy (agents/01-strategy/brain/WORKFLOW.md §7 «5 · El gate del CEO»).
// La estrategia viva ya tiene su roadmap y no tiene el OK: la misma condición de POST estrategia/:slug/viva/aprobar.
const EST_OK = { id: 'est-por-aprobar', grupo: 'trabajo', area: 'estrategia', urgencia: 'alta', necesita: { rol: ['ceo'] } };
EST_OK.calcular = (d) => (d.clientes || []).map((c) => [c, (d.strategy || []).find((s) => s.id === vivaId(c.slug))])
  .filter(([, s]) => s && !s.aprobado && avance(s.viva || {}).listo.entrega).map(([c, s]) => aviso(EST_OK, {
    clave: `est-por-aprobar:${c.slug}`, cliente: c.slug, titulo: `La estrategia de ${nombreCli(d, c.slug)} está lista para tu OK`,
    detalle: 'Ya tiene su roadmap: sin tu OK no pasa a los departamentos.', desde: s.viva.actualizado?.roadmap || '',
    huella: s.viva.actualizado?.roadmap || String(s.viva.roadmap.filas.length), accion: { label: 'Revisar y aprobar', href: `#/estrategia/${encodeURIComponent(c.slug)}` },
  }));

// ads-sin-ok · CLAUDE.md «Reglas»: en ⑩ Ads el CEO aprueba el plan y el presupuesto antes de lanzar, y cada cambio (00-PRINCIPIOS
// «Reglas duras» 2 y 4). El OK vale para el mes y ese monto (okOf). Lo da el CEO; el perfil ads lo ve «esperando». Corriendo: no se pospone.
// PUT ads/accounts guarda el mes del OK en UTC: el último día del mes, después de las 18:00 de Guatemala, queda con el mes
// siguiente (Mc). Ese OK también vale: el CEO lo acaba de dar (si no, el aviso seguiría diciendo «sin OK» hasta medianoche).
const ADS_OK = { id: 'ads-sin-ok', grupo: 'trabajo', area: 'marketing', urgencia: 'alta' };
const okVigente = (ads, ciclo) => okOf(ads, ciclo.M) || okOf(ads, ciclo.Mc);
ADS_OK.calcular = (d, p, hoy, ciclo) => {
  if (!p.esCeo && !(d.yo?.roles || []).includes('ads')) return [];
  return (d.accounts || []).filter((a) => /^acc-/.test(String(a.id || '')) && +a.ads?.budget > 0 && !okVigente(a.ads, ciclo)).map((a) => {
    const slug = String(a.id).replace(/^acc-/, ''), ads = a.ads, n = nombreCli(d, slug), monto = `${dinero(ads.budget)}/mes`;
    const corre = (d.campaigns || []).some((c) => c.client_slug === slug && c.status === 'Activa')
      || (d.tasks || []).some((t) => t.kind === 'campaign' && proyecto(d, t.project_id)?.client_slug === slug && t.campaign?.status === 'Activa');
    const porque = !ads.ok ? '' : ![ciclo.M, ciclo.Mc].includes(ads.ok.month) ? `El OK que tenía era de ${nombreMes(ads.ok.month)}.` : `Cambió el presupuesto: el OK era por ${dinero(ads.ok.budget)}/mes.`;
    const base = { clave: `ads-sin-ok:${slug}`, cliente: slug, fijo: corre, huella: `${ciclo.M}|${ads.budget}` };
    if (p.esCeo) return aviso(ADS_OK, { ...base,
      titulo: corre ? `La pauta de ${n} está corriendo sin tu OK de este mes` : `La pauta de ${n} espera tu OK: ${monto}`,
      detalle: [porque, corre ? `${monto}. Dale el OK o pide que la pausen.` : 'Sin tu OK al plan y al presupuesto no se lanza nada.'].filter(Boolean).join(' '),
      accion: { label: `Dar OK · ${monto}`, api: { method: 'PUT', ruta: `ads/accounts/${encodeURIComponent(slug)}`, body: { ok: true } }, hecho: 'Listo: la pauta tiene tu OK de este mes' } });
    return aviso(ADS_OK, { ...base,
      titulo: corre ? `La pauta de ${n} está corriendo sin el OK del CEO de este mes` : `La pauta de ${n} espera el OK del CEO: ${monto}`,
      detalle: [porque, corre ? 'Sin su OK no se pauta: pídeselo o pausa la campaña.' : 'Sin su OK al plan y al presupuesto no se lanza nada.'].filter(Boolean).join(' '),
      accion: { label: 'Ver encargo', href: '#/org/work/zona/ads' } });
  });
};

// cambios-del-cliente · inherent/05-OPERACION.md §4, días 16-19 «Cambios, QA y programación», y §7 «Cómo se entrega al cliente».
// El cliente pidió cambios desde su portal. Urgente si la pieza sale en 7 días o menos, o desde el día 16. Se apaga al reenviarla.
// La urgencia va en la huella: uno pospuesto vuelve cuando se vuelve urgente.
const CAMBIOS = { id: 'cambios-del-cliente', grupo: 'trabajo', area: 'diseno', urgencia: 'alta', necesita: { area: 'content', nivel: 'edita' } };
CAMBIOS.calcular = (d, p, hoy, ciclo) => (d.content || []).filter((x) => x.kind === 'post' && x.aprobacion?.estado === 'cambios' && estadoDe(x) === 'En proceso' && x.por_aprobar !== true).map((x) => {
  const marca = nombreCli(d, x.profile), dia = String(x.date || '').slice(0, 10), nota = corta(x.aprobacion.nota);
  const urgencia = (esFecha(dia) && diasEntre(hoy, dia) <= 7) || ciclo.d >= 16 ? 'alta' : 'media';
  return aviso(CAMBIOS, {
    clave: `cambios-del-cliente:${x.id}`, cliente: x.profile || '', urgencia,
    titulo: `${marca} pidió cambios en «${x.name || x.title || nombreDe(x, marca)}»${nota ? `: «${nota}»` : ''}`,
    detalle: [esFecha(dia) ? (dia < hoy ? `Tenía que salir ${elDia(dia, hoy)}` : `Sale ${dia === hoy ? 'hoy' : elDia(dia, hoy)}`) : '', 'Cuando quede, envíala otra vez a aprobación.'].filter(Boolean).join(' · '),
    desde: x.aprobacion.at || '', huella: `${x.aprobacion.at || nota}|${urgencia}`, accion: { label: 'Abrir la pieza', href: `#/marcas/${encodeURIComponent(x.profile || '')}/calendario` },
  });
});

// fac-cobrar-vencida · inherent/administracion/README.md § «Cobros y pagos» (invoice-chase) y 08-CRITERIOS-DE-ACEPTACION.md §9 #4.
// Por cobrar y vencida; se salta el cliente con un pago marcado en los últimos 14 días. El recordatorio sale solo con el sí del CEO.
const COBRAR = { id: 'fac-cobrar-vencida', grupo: 'trabajo', area: 'organizacion', urgencia: 'alta', necesita: { area: 'finanzas' } };
COBRAR.calcular = (d, p, hoy) => {
  const fs = (d.invoices || []).filter((i) => i.kind === 'cobrar');
  const pagoReciente = new Set(fs.filter((i) => estadoFactura(i, hoy) === 'pagada' && String(i.paid_at || '').slice(0, 10) >= masDias(hoy, -14)).map((i) => lc(i.client)));
  return fs.filter((i) => estadoFactura(i, hoy) === 'vencida' && !pagoReciente.has(lc(i.client))).sort((a, b) => a.due.localeCompare(b.due)).map((i) => aviso(COBRAR, {
    clave: `fac-cobrar-vencida:${i.id}`, cliente: i.client || '', titulo: `La factura de ${nombreCli(d, i.client)} (${dinero(i.amount, i.currency)}) ${cuando(i.due, hoy)} y no se ha cobrado`,
    detalle: [i.concept, i.period ? mesLabel(i.period) : '', p.esCeo ? 'Si ya entró, márcala pagada.' : 'El recordatorio al cliente sale con el sí del CEO.'].filter(Boolean).join(' · '),
    desde: i.due, huella: `${i.due}|${i.amount}`, accion: { label: 'Cobrar', href: '#/org/finanzas/fact' },
  }));
};

// anuncios-por-aprobar · CLAUDE.md «Reglas» (el gate de ⑩ Ads) y la skill ad-creativos, GATE 1: solo el CEO aprueba las variaciones.
// Una por marca: las de Borrador sin faltas y, en la segunda línea, las aprobadas que falta mandar a lanzar.
const ANUNCIOS = { id: 'anuncios-por-aprobar', grupo: 'trabajo', area: 'marketing', urgencia: 'media', necesita: { rol: ['ceo'] } };
ANUNCIOS.calcular = (d) => {
  const por = {};
  for (const v of d.ad_variants || []) {
    if (v.archivado || !v.profile) continue;
    const k = v.estado === 'Borrador' && !faltas(v).length ? 'listos' : v.estado === 'Aprobada' && !v.lanzar ? 'lanzar' : null;
    if (k) (por[v.profile] ||= { listos: [], lanzar: [] })[k].push(v);
  }
  return Object.entries(por).map(([slug, { listos, lanzar }]) => {
    const m = nombreCli(d, slug), n = listos.length, l = lanzar.length;
    const faltaLanzar = l === 1 ? '1 aprobado falta mandarlo a lanzar' : `${l} aprobados falta mandarlos a lanzar`;
    return aviso(ANUNCIOS, {
      clave: `anuncios-por-aprobar:${slug}`, cliente: slug,
      titulo: n ? (n === 1 ? `Hay 1 anuncio de ${m} listo para tu OK` : `Hay ${n} anuncios de ${m} listos para tu OK`) : l === 1 ? `1 anuncio aprobado de ${m}: falta mandarlo a lanzar` : `${l} anuncios aprobados de ${m}: falta mandarlos a lanzar`,
      detalle: n && l ? `Y ${faltaLanzar}.` : n ? 'Sin tu OK no se pautan.' : 'Elige cuáles y con qué presupuesto: así le llega la tarea a ⑩ Ads.',
      huella: [...listos, ...lanzar].map((v) => v.id).sort().join(','), accion: { label: 'Revisar anuncios', href: `#/marcas/${encodeURIComponent(slug)}/ads` },
    });
  });
};

// Los leads abiertos (api/_lib/leads.js · OPEN): las etapas del flujo antes del cierre.
const ABIERTOS = FLOW.filter((f) => f.id !== 'cierre').flatMap((f) => f.keys);

// lead-seguimiento · inherent/administracion/crm/README.md: «Toda oportunidad abierta tiene siguiente_paso y fecha_siguiente_paso» y
// § «La cola». El seguimiento vencido o sin siguiente paso (lo que espera respuesta va en lead-sin-responder). Hasta 3; con más, uno.
const SEGUIMIENTO = { id: 'lead-seguimiento', grupo: 'trabajo', area: 'organizacion', urgencia: 'media', necesita: { area: 'sales' } };
SEGUIMIENTO.calcular = (d, p, hoy) => {
  const xs = (d.leads || []).filter((l) => !l.archived && ABIERTOS.includes(stageKey(l.stage) || 'Nuevo') && !isWaiting(l) && (!l.next_step || !esFecha(l.next_date) || l.next_date < hoy))
    .map((l) => ({ l, desde: esFecha(l.next_date) ? l.next_date : createdAt(l) != null ? new Date(createdAt(l)).toISOString().slice(0, 10) : '' })).sort((a, b) => a.desde.localeCompare(b.desde));
  if (!xs.length) return [];
  if (xs.length > 3) {
    const atras = xs.filter(({ l }) => l.next_step && esFecha(l.next_date)).length, sin = xs.length - atras;
    return [aviso(SEGUIMIENTO, { clave: 'lead-seguimiento', titulo: `Tienes ${plural(xs.length, 'lead', 'leads')} sin seguimiento al día`, detalle: [atras ? `${atras} con el seguimiento vencido` : '', sin ? `${sin} sin siguiente paso o sin fecha` : ''].filter(Boolean).join(' · '), desde: xs[0].desde, huella: xs.map(({ l }) => `${l.id}:${l.next_date || ''}`).join(','), accion: { label: 'Dar seguimiento', href: '#/org/sales/crm' } })];
  }
  return xs.map(({ l, desde }) => {
    const nom = l.name || 'Un lead', paso = corta(l.next_step, 80);
    return aviso(SEGUIMIENTO, {
      clave: `lead-seguimiento:${l.id}`, titulo: !paso ? `${nom} no tiene siguiente paso` : !esFecha(l.next_date) ? `${nom} no tiene fecha para «${paso}»` : `Seguimiento a ${nom}: ${cuando(l.next_date, hoy)} «${paso}»`,
      detalle: [stageLabel(l.stage), l.company, l.source].filter(Boolean).join(' · '), desde, huella: `${stageKey(l.stage)}|${l.next_step || ''}|${l.next_date || ''}`,
      accion: { label: 'Dar seguimiento', href: `#/org/sales/crm/${encodeURIComponent(l.id)}` },
    });
  });
};

// lead-por-cotizar · inherent/05-OPERACION.md §3 «Primer contacto: un minuto»: el precio se da con el caso entendido (CLAUDE.md
// § La economía). En «Reunión» o «Propuesta» y sin cotización viva. Cotiza quien edita Ventas.
const COTIZAR = { id: 'lead-por-cotizar', grupo: 'trabajo', area: 'organizacion', urgencia: 'media', necesita: { area: 'sales', nivel: 'edita' } };
COTIZAR.calcular = (d) => {
  const conCot = new Set((d.quotes || []).filter((q) => q.status !== 'Rechazada').map((q) => q.lead_id).filter(Boolean));
  return (d.leads || []).filter((l) => !l.archived && ['Reunión', 'Propuesta'].includes(stageKey(l.stage)) && !conCot.has(l.id)).map((l) => aviso(COTIZAR, {
    clave: `lead-por-cotizar:${l.id}`, titulo: `Ya entendiste el caso de ${l.name || 'este lead'}: falta darle el precio`, detalle: [l.company, stageLabel(l.stage), 'Con el alcance delante.'].filter(Boolean).join(' · '),
    desde: createdAt(l) != null ? new Date(createdAt(l)).toISOString() : '', huella: stageKey(l.stage), accion: { label: 'Cotizar', href: `#/org/sales/quotes/new/${encodeURIComponent(l.id)}` },
  }));
};

// cotizacion-borrador · 08-CRITERIOS-DE-ACEPTACION.md §10 #10: «No sale sin el sí del CEO». Al CEO, para revisarla y enviarla;
// a quien la armó, como «espera el sí del CEO», sin botón. Sin status cuenta como Borrador (como Ventas y Control).
const BORRADOR = { id: 'cotizacion-borrador', grupo: 'trabajo', area: 'organizacion', urgencia: 'media', necesita: { area: 'sales' } };
BORRADOR.calcular = (d, p) => (d.quotes || []).filter((q) => (q.status || 'Borrador') === 'Borrador' && (p.esCeo || lc(q._meta?.created_by) === p.email)).map((q) => {
  const cual = `${q.number ? q.number + ' ' : ''}de ${q.client || 'un cliente'}`, base = { clave: `cotizacion-borrador:${q.id}`, cliente: q.client_slug || '', desde: q.date || q._meta?.created_at || '', huella: q._meta?.updated_at || q.status };
  return p.esCeo
    ? aviso(BORRADOR, { ...base, titulo: `La cotización ${cual} espera tu sí para salir`, detalle: 'No sale sin tu sí: revísala y envíala.', accion: { label: 'Revisar y enviar', href: `#/org/sales/quotes/${encodeURIComponent(q.id)}` } })
    : aviso(BORRADOR, { ...base, urgencia: 'baja', titulo: `Tu cotización ${cual} espera el sí del CEO`, detalle: 'No sale sin su sí: él la revisa y la envía.' });
});

// El total de una cotización en su moneda (el mismo cálculo de Hoy · «Subir pago»).
const totalCot = (q) => (q.items || []).reduce((a, i) => a + (+i.qty || 0) * (+i.price || 0), 0) * (1 - (+q.discount_pct || 0) / 100) * (q.currency && q.currency !== 'GTQ' ? +q.rate || 1 : 1);

// falta-pago · 08-CRITERIOS-DE-ACEPTACION.md §9 Factura #1 e inherent/administracion/README.md § «Cobros y pagos».
// La cotización aprobada sin pago (o con el pago devuelto). A quien tiene la tarea de cobro y al CEO. Urgente si la tarea ya vence
// (la urgencia va en la huella: uno pospuesto vuelve el día que vence).
const FALTA_PAGO = { id: 'falta-pago', grupo: 'trabajo', area: 'organizacion', urgencia: 'media' };
FALTA_PAGO.calcular = (d, p, hoy) => {
  const tareas = d.tasks || [], out = [], vistas = new Set();
  const sale = ({ quote_id, client, number, currency, amount, devuelto, nota, t, desde }) => { const urgencia = esFecha(t?.due) && t.due <= hoy ? 'alta' : 'media'; return aviso(FALTA_PAGO, {
    clave: `falta-pago:${quote_id}`, urgencia,
    titulo: devuelto ? `El pago de ${client} fue devuelto: súbelo otra vez` : `${client} aprobó la cotización: falta subir su pago`,
    detalle: [number, devuelto && nota ? `«${corta(nota)}»` : '', esFecha(t?.due) ? cuando(t.due, hoy) : ''].filter(Boolean).join(' · '),
    desde: desde || '', huella: `${devuelto ? 'devuelto' : 'sin-pago'}|${nota || ''}|${t?.due || ''}|${urgencia}`,
    accion: { label: 'Subir pago', abre: 'pago', datos: { quote_id, client, currency: currency || 'GTQ', amount: amount > 0 ? amount : undefined } },
  }); };
  for (const q of d.quotes || []) {
    if (q.status !== 'Aceptada' || (q.payment && q.payment.status !== 'rechazado')) continue;
    vistas.add(q.id);
    const t = tareas.find((x) => x.id === q.pay_task_id);
    if (!p.esCeo && lc(t?.assignee) !== p.email) continue;
    out.push(sale({ quote_id: q.id, client: q.client || 'El cliente', number: q.number, currency: q.currency, amount: t?.amount_due ?? Math.round(totalCot(q) * 100) / 100,
      devuelto: q.payment?.status === 'rechazado', nota: q.payment?.note, t, desde: q.approved_at }));
  }
  // Quien sube el pago y no ve Ventas no recibe la cotización: le basta su tarea de cobro (flow.js · approve la crea).
  for (const t of tareas) {
    if (t.kind !== 'pago' || !t.quote_id || vistas.has(t.quote_id) || lc(t.assignee) !== p.email || !['Por empezar', 'En curso'].includes(t.status || 'Por empezar')) continue;
    const m = /^Subir el pago de (.+) · ([^·]+)$/.exec(String(t.title || '')), ult = String((t.comments || []).at(-1)?.text || '');
    out.push(sale({ quote_id: t.quote_id, client: m?.[1] || 'El cliente', number: m?.[2]?.trim(), currency: t.currency, amount: +t.amount_due || 0,
      devuelto: t.status === 'En curso' && /^Pago devuelto/.test(ult), nota: ult.replace(/^Pago devuelto:?\s*/, ''), t, desde: t.assigned_at || t._meta?.created_at }));
  }
  return out;
};

// encargo-recibido · agents/01-strategy/brain/WORKFLOW.md §9: Strategy decide el qué y lo ejecuta otra área (05-OPERACION.md §3
// «Sin input no hay etapa»). Un encargo que alguien más te pasó y no has empezado (si ya vence, va en tareas-vencidas).
const ENCARGO = { id: 'encargo-recibido', grupo: 'trabajo', area: 'todas', urgencia: 'media' };
// A dónde lleva cada área (solo si la persona abre ese espacio: Consulting pide Estrategia; Diseño, Marcas). Si no, abre la tarea.
const DONDE_ENCARGO = { consulting: ['estrategia', (s) => `#/consulting/${encodeURIComponent(s)}`], diseno: ['content', (s) => `#/marcas/${encodeURIComponent(s)}/design`] };
ENCARGO.calcular = (d, p, hoy) => (d.tasks || []).filter((t) => t.origen === 'estrategia' && lc(t.assignee) === p.email && lc(t._meta?.created_by) !== p.email && (t.status || 'Por empezar') === 'Por empezar' && !(esFecha(t.due) && t.due <= hoy)).map((t) => {
  const slug = t.cliente || t.client_slug || '', [area, a] = DONDE_ENCARGO[t.area] || [], ir = slug && a && p.ve(area) ? a : null;
  return aviso(ENCARGO, {
    clave: `encargo-recibido:${t.id}`, cliente: slug, titulo: `Te llegó un encargo de Estrategia: «${t.title}${slug ? ` · ${nombreCli(d, slug)}` : ''}»`,
    detalle: [AREAS_ENCARGO[t.area] ? `Para ${AREAS_ENCARGO[t.area]}` : '', esFecha(t.due) ? cuando(t.due, hoy) : ''].filter(Boolean).join(' · '),
    desde: t.assigned_at || t._meta?.updated_at || '', huella: `${t.assignee}|${t.due || ''}`, accion: ir ? { label: 'Abrir', href: ir(slug) } : { label: 'Abrir', abre: 'tarea', id: t.id },
  });
});

// equipo-atrasado · inherent/05-OPERACION.md §1 «Los roles» (el COO coordina las entregas) y §4 «Los dos límites». Las atrasadas
// de los demás, dentro de tu alcance, por persona y por cliente (las tuyas ya salen en tareas-vencidas).
const EQUIPO = { id: 'equipo-atrasado', grupo: 'trabajo', area: 'organizacion', urgencia: 'media', necesita: { rol: ['ceo', 'coo'] } };
EQUIPO.calcular = (d, p, hoy) => {
  const xs = (d.tasks || []).filter((t) => t.status !== 'Hecha' && esFecha(t.due) && t.due < hoy && lc(t.assignee) !== p.email).sort((a, b) => a.due.localeCompare(b.due));
  if (!xs.length) return [];
  const { person } = cadena(d, p);
  const cuenta = (f) => Object.entries(xs.reduce((o, t) => { const k = f(t); if (k) o[k] = (o[k] || 0) + 1; return o; }, {})).sort((a, b) => b[1] - a[1]);
  const [top] = cuenta((t) => clienteDe(d, t)), quienes = cuenta((t) => lc(t.assignee) || '—');
  const cli = top && ((d.projects || []).find((x) => x.client_slug === top[0])?.client || nombreCli(d, top[0]));
  const de = !top ? '' : top[1] === xs.length ? (xs.length === 1 ? ` (es de ${cli})` : ` (todas de ${cli})`) : ` (${top[1]} ${top[1] === 1 ? 'es' : 'son'} de ${cli})`;
  return [aviso(EQUIPO, {
    clave: 'equipo-atrasado', titulo: `${xs.length === 1 ? '1 tarea del equipo está atrasada' : `${xs.length} tareas del equipo están atrasadas`}${de}`,
    detalle: quienes.slice(0, 3).map(([k, n]) => `${k === '—' ? 'Sin asignar' : primerNombre(person(k)?.name) || k.split('@')[0]} ${n}`).join(' · '),
    desde: xs[0].due, huella: xs.map((t) => t.id).sort().join(','), accion: { label: 'Ver equipo', href: '#/org/work/equipo' },
  })];
};

// fac-pagar · 08-CRITERIOS-DE-ACEPTACION.md §9 por pagar #8 («¿Duplicada? ¿Monto raro?») y #10 («Nada se paga sin el sí del CEO»).
// Lo que vence en 7 días o ya venció; si Laya la juzgó duplicada (umbral de la puerta o 0.5), no se paga todavía. Sin montos: es costo.
// Si se vence mientras está pospuesta, vuelve (la huella cambia).
const PAGAR = { id: 'fac-pagar', grupo: 'trabajo', area: 'organizacion', urgencia: 'media', necesita: { rol: ['ceo'] } };
PAGAR.calcular = (d, p, hoy) => {
  const puerta = puertasDe(d.settings?.laya_gates).factura, q = puerta.preguntas.find((x) => x.id === 'duplicada');
  return (d.invoices || []).filter((i) => i.kind === 'pagar' && invoiceSoon(i, hoy)).sort((a, b) => a.due.localeCompare(b.due)).map((i) => {
    const j = q ? resumen((d.judgments || []).filter((x) => x.gate === 'factura' && x.target?.coll === 'invoices' && x.target?.id === i.id), puerta).ultimos[q.id] : null;
    const dup = Boolean(j && j.status === 'hecho' && Number.isFinite(j.prob) && (cumple(q, j) ?? j.prob >= 0.5));
    const quien = i.vendor || 'un proveedor', base = { clave: `fac-pagar:${i.id}`, desde: i.due, huella: `${i.due}|${i.due < hoy ? 'vencida' : ''}|${dup ? 'duplicada:' + j.at : ''}` };
    return dup
      ? aviso(PAGAR, { ...base, titulo: `Laya cree que la factura de ${quien} está duplicada: no la pagues todavía`, detalle: [frase(j, q), i.concept, cuando(i.due, hoy)].filter(Boolean).join(' · '), accion: { label: 'Revisar', href: '#/org/finanzas/fact' } })
      : aviso(PAGAR, { ...base, titulo: `Pagar a ${quien}: ${cuando(i.due, hoy)}`, detalle: [i.concept, i.category].filter(Boolean).join(' · '), accion: { label: 'Revisar y pagar', href: '#/org/finanzas/fact' } });
  });
};

export const TRABAJO = [LEAD, VENCIDAS, PAGO_OK, REVISION, DEVUELTA, EST_OK, ADS_OK, CAMBIOS, COBRAR, ANUNCIOS, SEGUIMIENTO, COTIZAR, BORRADOR, FALTA_PAGO, ENCARGO, EQUIPO, PAGAR];
