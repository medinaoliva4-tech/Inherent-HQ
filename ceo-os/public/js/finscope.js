// Finanzas por alcance: cuánto cuesta, cuánto entra y cuánto queda de cada cliente, con los datos de la plataforma.
// Ya no hay planes con costo fijo: cada cliente cuesta la suma de sus módulos (servicio del catálogo × su complejidad 3/5/8/10,
// con las horas de cada rol y el costo por hora de Comercial → Costos por hora). Lo comparten la pantalla de Finanzas y las pruebas.
//   Costo   = Σ módulos de sus proyectos (o de su cotización aceptada que todavía no tiene proyecto).
//   Ingreso = los movimientos de ingreso del mes con ese cliente; si no hay, lo cotizado/aceptado de esos módulos.
//   Margen  = ingreso − costo.
// Un módulo cobrado «por mes» cae en cada mes en que su proyecto está activo; los demás, una vez, en el mes en que arranca.
// Lo que no tiene dato va en null con de dónde vendrá: nunca se inventa ni se pone en cero.
import { svcCost, svcHours, rateAt, marginOf } from './cycle.js';

export const LEVELS = [3, 5, 8, 10];
// El margen objetivo de las propuestas: settings «pricing» (lo edita el CEO en Finanzas → Precios); si no hay, el de Costos por hora.
export const PRICING_ID = 'pricing';
export const targetMargin = (pricing, rates) => { const m = +pricing?.margin; return m >= 1 && m <= 95 ? m : marginOf(rates); };
// Precio sugerido = costo ÷ (1 − margen objetivo).
export const suggestedPrice = (cost, margin) => (cost > 0 && margin >= 0 && margin < 100 ? Math.round(cost / (1 - margin / 100)) : null);

export const keyOf = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const ym = (d) => String(d || '').slice(0, 7);
const lvOf = (n) => Math.max(3, Math.min(10, Math.round(+n || 5)));

// El costo de un módulo: servicio del catálogo en su nivel × cantidad. Sin el servicio en el catálogo, con las horas por rol
// que guardó el proyecto. miss = roles sin costo por hora (el costo queda incompleto, no en cero).
export function moduleCost(item, services, rates) {
  const lv = lvOf(item.level), s = services.find((x) => x.id === (item.service_id || item.id));
  if (!rates) return { cost: null, miss: [], why: 'Faltan los costos por hora (Comercial → Catálogo → Costos por hora)' };
  if (s) {
    const per = svcHours(s, lv), n = item.qty != null ? Math.max(1, +item.qty || 1) : per > 0 && +item.hours > 0 ? Math.max(1, Math.round(+item.hours / per)) : 1;
    const c = svcCost(s, rates, lv);
    if (!(s.tasks || []).length) return { cost: null, miss: [], why: `«${s.name}» no tiene horas por rol en el catálogo` };
    return { cost: c.cost * n, miss: [...new Set(c.miss)], qty: n, hours: per * n, unit: s.unit || 'proyecto' };
  }
  const roles = Array.isArray(item.roles) ? item.roles.filter((r) => r.role && +r.hours > 0) : [];
  if (!roles.length) return { cost: null, miss: [], why: `«${item.name || 'Módulo'}» no está en el catálogo ni trae horas por rol` };
  const miss = []; const cost = roles.reduce((a, r) => { const rt = rateAt(rates, r.role, lv); if (rt == null) miss.push(r.role); return a + (rt || 0) * r.hours; }, 0);
  return { cost, miss: [...new Set(miss)], qty: 1, hours: roles.reduce((a, r) => a + +r.hours, 0), unit: 'proyecto' };
}

// Cuándo corre un proyecto: de la primera a la última fase (o su ciclo, o el día en que se creó).
export function projectSpan(p) {
  const st = (p.phases || []).map((x) => x.start).filter(Boolean).sort(), en = (p.phases || []).map((x) => x.end).filter(Boolean).sort();
  const start = st[0] || (p.cycle ? p.cycle + '-01' : '') || String(p._meta?.created_at || '').slice(0, 10);
  return { start: ym(start), end: ym(en.at(-1) || start) };
}

const quoteFactor = (q) => 1 - (+q?.discount_pct || 0) / 100;
const unitOf = (item, services) => services.find((x) => x.id === (item.service_id || item.id))?.unit || 'proyecto';
// ¿Este módulo cae en el mes? Mensual: cada mes activo. Lo demás: el mes en que arranca.
const inMonth = (unit, span, month) => (unit === 'mes' ? span.start <= month && month <= span.end : span.start === month);

// El tablero del mes: una fila por cliente con módulos, ingreso o actividad en el mes.
export function byScope({ month, services = [], rates = null, projects = [], quotes = [], accounts = [], entries = [] }) {
  const rows = new Map();
  const nameOf = (k, fb) => accounts.find((a) => keyOf(a.slug || String(a.id).replace(/^acc-/, '')) === k)?.name || fb || k.toUpperCase();
  const row = (k, fb) => { if (!rows.has(k)) rows.set(k, { slug: k, name: nameOf(k, fb), modules: [], cost: null, costMiss: [], costWhy: [], quoted: null, received: null, spent: null, income: null, incomeFrom: null, margin: null, pct: null, active: false }); return rows.get(k); };
  const add = (r, item, { price, from, unit, factor = 1 }) => {
    const c = moduleCost(item, services, rates);
    r.modules.push({ name: item.name || 'Módulo', level: lvOf(item.level), qty: c.qty ?? 1, unit, from, cost: c.cost, miss: c.miss, why: c.why || '', price: price == null ? null : price * factor });
  };
  // 1) Proyectos con módulos (de una cotización o de un paquete) y proyectos activos sin módulos (ciclo o Growth del alcance).
  for (const p of projects) {
    const k = keyOf(p.client_slug || p.client); if (!k) continue;
    const span = projectSpan(p); if (!span.start) continue;
    const q = p.quote_id ? quotes.find((x) => x.id === p.quote_id) : null;
    const items = Array.isArray(p.services) ? p.services : [];
    const live = span.start <= month && month <= span.end;
    if (live) row(k, p.client).active = true;
    for (const it of items) {
      const unit = unitOf(it, services); if (!inMonth(unit, span, month)) continue;
      add(row(k, p.client), it, { price: +it.price > 0 ? +it.price : null, from: q ? `${p.name} · ${q.number || 'cotización'}` : p.bundle_name ? `${p.name} · paquete` : p.name, unit, factor: quoteFactor(q) });
    }
  }
  // 2) Cotizaciones aceptadas que todavía no tienen proyecto: sus módulos caen en el mes en que se aprobaron.
  for (const q of quotes) {
    if (q.status !== 'Aceptada' || q.project_id) continue;
    const k = keyOf(q.client_slug || q.client); if (!k) continue;
    const span = { start: ym(q.approved_at || q.date), end: ym(q.approved_at || q.date) };
    for (const it of (q.items || []).filter((i) => i.service_id)) {
      const unit = unitOf(it, services); if (!inMonth(unit, { ...span, end: unit === 'mes' ? '9999-12' : span.end }, month)) continue;
      add(row(k, q.client), it, { price: (+it.price || 0) * Math.max(1, +it.qty || 1) || null, from: `${q.number || 'Cotización'} · aceptada, sin proyecto`, unit, factor: quoteFactor(q) });
    }
  }
  // 3) Los movimientos del mes (Finanzas o la hoja de Google) con cliente.
  let unassigned = 0;
  for (const e of entries) {
    if (ym(e.date) !== month || !(+e.amount > 0)) continue;
    const k = keyOf(e.client);
    if (!k) { if (e.type === 'ingreso') unassigned += +e.amount; continue; }
    const r = row(k, e.client);
    if (e.type === 'ingreso') r.received = (r.received || 0) + +e.amount; else r.spent = (r.spent || 0) + +e.amount;
  }
  // 4) Cuentas de cada fila.
  for (const r of rows.values()) {
    const priced = r.modules.filter((m) => m.price != null);
    r.quoted = priced.length ? priced.reduce((a, m) => a + m.price, 0) : null;
    const costed = r.modules.filter((m) => m.cost != null);
    r.cost = costed.length ? costed.reduce((a, m) => a + m.cost, 0) : null;
    r.costMiss = [...new Set(r.modules.flatMap((m) => m.miss))];
    r.costWhy = [...new Set(r.modules.map((m) => m.why).filter(Boolean))];
    r.partial = r.costMiss.length > 0 || costed.length < r.modules.length;
    if (r.received != null) { r.income = r.received; r.incomeFrom = 'movimientos'; } else if (r.quoted != null) { r.income = r.quoted; r.incomeFrom = 'cotización'; }
    if (r.income != null && r.cost != null) { r.margin = r.income - r.cost; r.pct = r.income ? Math.round((r.margin / r.income) * 100) : null; }
    // De dónde vendrá lo que falta.
    r.need = [
      ...(!r.modules.length ? ['Costo: vendrá de los servicios del catálogo de su proyecto (cotización aceptada o paquete activado)'] : r.cost == null ? [r.costWhy[0] || 'Costo: faltan horas o costos por hora'] : []),
      ...(r.costMiss.length ? [`Costo incompleto: faltan los costos por hora de ${r.costMiss.join(', ')}`] : []),
      ...(r.income == null ? ['Ingreso: vendrá de un movimiento de ingreso con su cliente en Finanzas o de su cotización aceptada'] : []),
    ];
  }
  const list = [...rows.values()].filter((r) => r.modules.length || r.received != null || r.spent != null || r.active).sort((a, z) => (z.income ?? -1) - (a.income ?? -1) || a.name.localeCompare(z.name));
  const sum = (k) => { const l = list.filter((r) => r[k] != null); return l.length ? l.reduce((a, r) => a + r[k], 0) : null; };
  const income = sum('income'), cost = sum('cost'), withBoth = list.filter((r) => r.margin != null);
  const margin = withBoth.length ? withBoth.reduce((a, r) => a + r.margin, 0) : null, incBoth = withBoth.reduce((a, r) => a + r.income, 0);
  return { month, rows: list, totals: { income, cost, quoted: sum('quoted'), received: sum('received'), spent: sum('spent'), margin, pct: margin != null && incBoth ? Math.round((margin / incBoth) * 100) : null, unassigned: unassigned || null, sinDatos: list.filter((r) => r.need.length).length } };
}

// Una propuesta: los módulos elegidos (servicio + nivel + cantidad) → costo, precio de catálogo y precio sugerido al margen objetivo.
export function proposal(lines, services, rates, margin) {
  const rows = lines.map((l) => { const s = services.find((x) => x.id === l.sid); if (!s) return null; const c = moduleCost({ service_id: s.id, level: l.lv, qty: l.qty, name: s.name }, services, rates); return { ...l, name: s.name, unit: s.unit || 'proyecto', hours: c.hours ?? null, cost: c.cost, miss: c.miss, why: c.why || '' }; }).filter(Boolean);
  const ok = rows.length && rows.every((r) => r.cost != null && !r.miss.length);
  const cost = rows.reduce((a, r) => a + (r.cost || 0), 0);
  return { rows, cost: rows.length ? cost : null, complete: Boolean(ok), price: ok ? suggestedPrice(cost, margin) : null, margin };
}
