// Facturas de Inherent: por cobrar (a clientes) y por pagar (a proveedores), y el cruce con el estado de cuenta del banco.
// Módulo puro: lo comparten la pantalla de Finanzas, el servidor (api/_lib/facturas.js), el conector de Claude y las pruebas.
//
// La forma de una factura (colección «invoices») es un contrato: otras pantallas la leen. No se cambia.
//   { kind:'cobrar'|'pagar', client:'slug' (cobrar) | vendor:'texto' (pagar), concept, amount, currency:'GTQ'|'USD',
//     issued:'AAAA-MM-DD', due:'AAAA-MM-DD', status:'pendiente'|'pagada'|'anulada', paid_at, bank_ref,
//     source:'auto'|'manual'|'claude', period:'AAAA-MM' (cobrar auto), file_url?, notes? }
// «Vencida» no se guarda: se calcula (pendiente y due < hoy).
import { levelOf, USD_GTQ } from './levels.js';
import { projectSpan, keyOf } from './finscope.js';

export const KINDS = ['cobrar', 'pagar'];
export const STATUS = ['pendiente', 'pagada', 'anulada'];
export const ESTADOS = ['pendiente', 'vencida', 'pagada', 'anulada'];
export const SOURCES = ['auto', 'manual', 'claude'];
export const CURRENCIES = ['GTQ', 'USD'];
export const DIA_COBRO = 5; // si el cliente no tiene día de cobro, vence el 5 del mes
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const isMonth = (s) => /^\d{4}-\d{2}$/.test(String(s || ''));
const hoyISO = () => new Date().toISOString().slice(0, 10);
const r2 = (n) => Math.round(n * 100) / 100;
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 86_400_000);
const lastDay = (period) => { const [y, m] = period.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
export const mesLabel = (period) => (isMonth(period) ? `${MESES[+period.slice(5) - 1]} ${period.slice(0, 4)}` : String(period || ''));

// ---------- El estado de una factura ----------
export function estadoFactura(inv, hoy = hoyISO()) {
  const s = STATUS.includes(inv?.status) ? inv.status : 'pendiente';
  if (s !== 'pendiente') return s;
  return isDate(inv?.due) && inv.due < hoy ? 'vencida' : 'pendiente';
}
const abierta = (inv, hoy) => ['pendiente', 'vencida'].includes(estadoFactura(inv, hoy));
// Lo pendiente que vence de hoy a «dias» días (sin las ya vencidas), de la más próxima a la más lejana.
export function porVencer(invs = [], hoy = hoyISO(), dias = 7) {
  const hasta = addDays(hoy, dias);
  return invs.filter((i) => estadoFactura(i, hoy) === 'pendiente' && isDate(i.due) && i.due >= hoy && i.due <= hasta).sort((a, z) => a.due.localeCompare(z.due));
}
// El monto en quetzales (USD a Q7.70, el tipo de cambio del manual).
export const enGTQ = (inv) => (+inv?.amount || 0) * (inv?.currency === 'USD' ? USD_GTQ : 1);
// Los tres números de arriba, en quetzales:
//   porCobrar   = lo pendiente por cobrar (incluye lo vencido)
//   vencido     = lo que ya pasó su fecha sin pagarse (por cobrar)
//   porPagarMes = lo por pagar que vence este mes o ya venció
// Además: cuántas son de cada cosa, lo cobrado y lo pagado en el mes, y si alguna viene en USD.
export function totales(invs = [], hoy = hoyISO()) {
  const mes = hoy.slice(0, 7), finMes = `${mes}-${String(lastDay(mes)).padStart(2, '0')}`;
  const t = { porCobrar: 0, vencido: 0, porPagarMes: 0, vencidoPagar: 0, cobradoMes: 0, pagadoMes: 0, nPorCobrar: 0, nVencidas: 0, nPorPagarMes: 0, usd: false, moneda: 'GTQ' };
  for (const i of invs) {
    const e = estadoFactura(i, hoy), q = enGTQ(i);
    if (i.currency === 'USD' && e !== 'anulada') t.usd = true;
    if (i.kind === 'cobrar') {
      if (e === 'pendiente' || e === 'vencida') { t.porCobrar += q; t.nPorCobrar++; }
      if (e === 'vencida') { t.vencido += q; t.nVencidas++; }
      if (e === 'pagada' && String(i.paid_at || '').slice(0, 7) === mes) t.cobradoMes += q;
    } else if (i.kind === 'pagar') {
      if ((e === 'pendiente' || e === 'vencida') && isDate(i.due) && i.due <= finMes) { t.porPagarMes += q; t.nPorPagarMes++; }
      if (e === 'vencida') t.vencidoPagar += q;
      if (e === 'pagada' && String(i.paid_at || '').slice(0, 7) === mes) t.pagadoMes += q;
    }
  }
  for (const k of ['porCobrar', 'vencido', 'porPagarMes', 'vencidoPagar', 'cobradoMes', 'pagadoMes']) t[k] = r2(t[k]);
  return t;
}

// ---------- Guardar: la factura limpia (la usan el servidor y el conector) ----------
// Lanza un Error con un mensaje humano si falta algo. hoy: para las fechas por defecto.
export function limpiarFactura(b = {}, hoy = hoyISO()) {
  const kind = KINDS.includes(b.kind) ? b.kind : null;
  if (!kind) throw new Error('Falta el tipo: cobrar o pagar');
  const o = { kind };
  if (kind === 'cobrar') {
    const c = String(b.client || '').trim().toLowerCase();
    if (!/^[\w-]{2,60}$/.test(c)) throw new Error('Falta el cliente (su slug)');
    o.client = c;
  } else {
    const v = String(b.vendor || '').trim().slice(0, 120);
    if (!v) throw new Error('Falta el proveedor');
    o.vendor = v;
  }
  o.concept = String(b.concept || '').trim().slice(0, 200);
  if (!o.concept) throw new Error('Falta el concepto');
  const amount = typeof b.amount === 'string' ? leerMonto(b.amount) : +b.amount;
  if (!(Number.isFinite(amount) && amount > 0)) throw new Error('El monto tiene que ser mayor que cero');
  o.amount = r2(amount);
  o.currency = b.currency === 'USD' ? 'USD' : 'GTQ';
  o.issued = isDate(b.issued) ? b.issued : hoy;
  o.due = isDate(b.due) ? b.due : o.issued;
  o.status = STATUS.includes(b.status) ? b.status : 'pendiente';
  if (o.status === 'pagada') o.paid_at = isDate(b.paid_at) ? b.paid_at : hoy;
  const ref = String(b.bank_ref || '').trim().slice(0, 120); if (ref) o.bank_ref = ref;
  o.source = SOURCES.includes(b.source) ? b.source : 'manual';
  if (kind === 'cobrar' && isMonth(b.period)) o.period = b.period;
  const f = String(b.file_url || '').trim(); if (f) { if (!/^https:\/\/\S+$/i.test(f)) throw new Error('El link del archivo tiene que empezar con https://'); o.file_url = f.slice(0, 600); }
  const n = String(b.notes || '').trim(); if (n) o.notes = n.slice(0, 2000);
  return o;
}
// El nombre que se muestra: el cliente en mayúsculas (o su nombre en la cuenta) o el proveedor.
export const quienFactura = (inv, accounts = []) => (inv?.kind === 'cobrar' ? accounts.find((a) => (a.slug || String(a.id).replace(/^acc-/, '')) === inv.client)?.name || String(inv.client || '').toUpperCase() : inv?.vendor || '—');

// ---------- Los cobros del mes: una factura por cliente activo con su precio mensual ----------
// Precio de la ficha: «Q2,500 al mes», «USD 2,400 / mes», «$1,200 por proyecto». null si no trae un monto.
export function precioDeFicha(text) {
  const s = String(text || '').replace(/\*/g, '');
  if (/sin datos/i.test(s)) return null;
  const m = s.match(/(?:\b(USD|US\$|GTQ)\s?|(\$)\s?|\bQ\s?)([\d][\d,]*(?:\.\d+)?)/i);
  if (!m) return null;
  const amount = +m[3].replace(/,/g, ''); if (!(amount > 0)) return null;
  const usd = /usd|us\$/i.test(m[1] || '') || m[2] === '$';
  return { amount, currency: usd ? 'USD' : 'GTQ', mensual: /al mes|por mes|mensual|\/\s*mes|\bmes\b/i.test(s), proyecto: /proyecto/i.test(s) };
}
// El día de cobro: el de la cuenta (dia_cobro) o el de la ficha («Día de cobro» / «Día de pago»). null si no hay.
export function diaDeCobro(account, fields = []) {
  const a = Math.round(+account?.dia_cobro);
  if (a >= 1 && a <= 31) return a;
  const f = (fields || []).find((x) => /d[ií]a de (cobro|pago)/i.test(String(x.key || '')));
  const n = f ? Math.round(+(String(f.value).match(/\d{1,2}/) || [])[0]) : NaN;
  return n >= 1 && n <= 31 ? n : null;
}
// El fee mensual de un cliente para el mes. Orden: la ficha de oferta del repo (el contrato) y, si no trae un precio
// mensual, los módulos «por mes» con precio de sus proyectos activos o de su cotización aceptada sin proyecto.
// Devuelve { amount, currency, from } o { amount:null, why }.
export function feeMensual({ slug, ficha, period, projects = [], quotes = [], services = [] }) {
  const p = ficha ? precioDeFicha(ficha.precioText ?? (ficha.fields || []).find((f) => /^precio$/i.test(f.key))?.value ?? (ficha.precio != null ? `Q${ficha.precio}` : '')) : null;
  if (p && p.mensual) return { amount: p.amount, currency: p.currency, from: 'ficha de oferta' };
  const unitOf = (it) => services.find((x) => x.id === (it.service_id || it.id))?.unit || '';
  let sum = 0, n = 0;
  for (const pr of projects) {
    if (keyOf(pr.client_slug || pr.client) !== slug) continue;
    const span = projectSpan(pr); if (!span.start || span.start > period || period > span.end) continue; // el proyecto corre ese mes
    const q = pr.quote_id ? quotes.find((x) => x.id === pr.quote_id) : null, factor = 1 - (+q?.discount_pct || 0) / 100;
    for (const it of Array.isArray(pr.services) ? pr.services : []) if (unitOf(it) === 'mes' && +it.price > 0) { sum += +it.price * Math.max(1, +it.qty || 1) * factor; n++; }
  }
  for (const q of quotes) {
    if (q.status !== 'Aceptada' || q.project_id || keyOf(q.client_slug || q.client) !== slug) continue;
    if (String(q.approved_at || q.date || '').slice(0, 7) > period) continue;
    const factor = 1 - (+q.discount_pct || 0) / 100;
    for (const it of q.items || []) if (unitOf(it) === 'mes' && +it.price > 0) { sum += +it.price * Math.max(1, +it.qty || 1) * factor; n++; }
  }
  if (n) return { amount: r2(sum), currency: 'GTQ', from: 'módulos mensuales' };
  if (p && p.proyecto) return { amount: null, porProyecto: true, why: 'Se cobra por proyecto: agrégala a mano' };
  if (p) return { amount: null, why: 'La ficha trae precio, pero no dice si es al mes' };
  return { amount: null, why: 'Sin precio en su ficha ni en una cotización aceptada' };
}
// Arma las facturas del mes, sin duplicar (la clave es cliente + period; cuenta cualquier factura por cobrar que ya exista).
//   clients: [{ slug, plan, fields, precio, hasPlan }] (los de clients/ en el repo) · accounts: la base (las de cotización también cuentan)
//   existing: las facturas que ya existen · hoy: para la fecha de emisión si el mes ya empezó
// Devuelve { period, crear: [factura con id], yaExisten: [slug], sinPrecio: [{ slug, nombre, why }], porProyecto: [{ slug, nombre }] }.
export const idCobro = (slug, period) => `cobro-${slug}-${period}`;
export function cobrosDelMes({ period, clients = [], accounts = [], projects = [], quotes = [], services = [], existing = [], hoy = hoyISO() }) {
  if (!isMonth(period)) throw new Error('El mes va como AAAA-MM');
  const slugOf = (a) => a.slug || String(a.id).replace(/^acc-/, '');
  const acc = (slug) => accounts.find((a) => slugOf(a) === slug);
  // Los clientes activos: los del repo con ficha y las cuentas que entraron por cotización. Una cuenta con active:false no cuenta.
  const list = [...clients.filter((c) => c.hasPlan !== false).map((c) => ({ slug: c.slug, ficha: c }))];
  for (const a of accounts) { const s = slugOf(a); if (a.from_quote && s && !list.some((x) => x.slug === s)) list.push({ slug: s, ficha: null }); }
  const out = { period, crear: [], yaExisten: [], sinPrecio: [], porProyecto: [] };
  const ya = new Set(existing.filter((i) => i.kind === 'cobrar' && i.period).map((i) => `${i.client}|${i.period}`));
  for (const { slug, ficha } of list) {
    const a = acc(slug), nombre = a?.name || slug.toUpperCase();
    if (a?.active === false) continue;
    if (ficha && /pausad|inactiv|de baja|terminad/i.test((ficha.fields || []).find((f) => /^estado$/i.test(f.key))?.value || '')) continue;
    if (ya.has(`${slug}|${period}`)) { out.yaExisten.push(slug); continue; }
    if (ficha && levelOf(String(ficha.plan || '').replace(/^[⬜🔷🟨]️?\s*/u, ''))?.id === 'foundation') { out.porProyecto.push({ slug, nombre }); continue; }
    const fee = feeMensual({ slug, ficha, period, projects, quotes, services });
    if (fee.porProyecto) { out.porProyecto.push({ slug, nombre }); continue; }
    if (fee.amount == null) { out.sinPrecio.push({ slug, nombre, why: fee.why }); continue; }
    const dia = Math.min(diaDeCobro(a, ficha?.fields) || DIA_COBRO, lastDay(period));
    const issued = hoy.slice(0, 7) === period ? hoy : `${period}-01`;
    out.crear.push({ id: idCobro(slug, period), kind: 'cobrar', client: slug, concept: `Fee mensual · ${mesLabel(period)}`, amount: fee.amount, currency: fee.currency, issued, due: `${period}-${String(dia).padStart(2, '0')}`, status: 'pendiente', source: 'auto', period, notes: `Precio: ${fee.from}` });
  }
  return out;
}

// ---------- El estado de cuenta del banco (BAC: «Archivo separado por comas») ----------
// Fecha dd/mm/aaaa (o dd-mm-aaaa, o aaaa-mm-dd) → AAAA-MM-DD. '' si no es fecha.
export function leerFecha(v) {
  const s = String(v ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/); if (!m) return '';
  const y = m[3].length === 2 ? '20' + m[3] : m[3], mo = +m[2], d = +m[1];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= 31 ? `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` : '';
}
// «1,234.50», «Q 1,234.50», «-1,234.50», «(1,234.50)» → número. null si está vacío o no es número.
export function leerMonto(v) {
  let s = String(v ?? '').trim(); if (!s) return null;
  const neg = /^\(.*\)$/.test(s) || /^-|-$/.test(s.replace(/[^\d.,()-]/g, ''));
  s = s.replace(/[^\d.,]/g, '');
  if (!s) return null;
  // «1.234,50» (coma decimal) también se entiende; lo normal en BAC es «1,234.50».
  if (s.lastIndexOf(',') > s.lastIndexOf('.') && /,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, '');
  const n = parseFloat(s); if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}
const COLS = {
  fecha: (h) => /^fecha/.test(h) && !/valor|proceso/.test(h),
  desc: (h) => !/^fecha/.test(h) && /descrip|concepto|detalle|transacc|movimiento|observ/.test(h),
  ref: (h) => !/^fecha/.test(h) && /referencia|^ref\b|^no\.? ?(doc|documento|ref)|documento|comprobante|autoriz/.test(h),
  debito: (h) => /debito|debe\b|cargo|retiro|egreso/.test(h),
  credito: (h) => /credito|haber\b|abono|deposito|ingreso/.test(h),
  monto: (h) => /^(monto|importe|valor)\b/.test(h),
};
// BAC trae filas de encabezado (nombre, cuenta, periodo) antes de la tabla: el encabezado es la primera fila que
// tiene «fecha» y (débito/crédito o monto). Devuelve { fila, cols: { fecha, desc, ref, debito, credito, monto } } o null.
// Una fila separada por «;» también se entiende.
export const filasBanco = (rows) => (rows || []).map((r) => (r.length === 1 && String(r[0]).includes(';') ? String(r[0]).split(';') : r));
export function detectarColumnas(rows) {
  const R = filasBanco(rows);
  for (let i = 0; i < Math.min(R.length, 40); i++) {
    const H = R[i].map(norm), find = (k) => H.findIndex((h) => h && COLS[k](h));
    const cols = { fecha: find('fecha'), desc: find('desc'), ref: find('ref'), debito: find('debito'), credito: find('credito'), monto: find('monto') };
    if (cols.ref === cols.desc) cols.ref = -1;
    if (cols.fecha >= 0 && (cols.debito >= 0 || cols.credito >= 0 || cols.monto >= 0)) return { fila: i, cols };
  }
  return null;
}
// Los movimientos de la tabla, con las columnas detectadas o escogidas a mano. Cada uno: { date, amount (positivo),
// type:'credito'|'debito', ref, desc }. Lo que no tiene fecha o monto (saldos, totales, líneas en blanco) se salta.
export function movimientosBanco(rows, { fila = 0, cols } = {}) {
  const R = filasBanco(rows), c = (r, k) => (cols[k] >= 0 ? String(r[cols[k]] ?? '').trim() : '');
  const out = [];
  for (const r of R.slice(fila + 1)) {
    const date = leerFecha(c(r, 'fecha')); if (!date) continue;
    const deb = leerMonto(c(r, 'debito')), cre = leerMonto(c(r, 'credito')), mon = leerMonto(c(r, 'monto'));
    let amount = 0, type = '';
    if (cre && Math.abs(cre) > 0) { amount = Math.abs(cre); type = 'credito'; }
    else if (deb && Math.abs(deb) > 0) { amount = Math.abs(deb); type = 'debito'; }
    else if (mon) { amount = Math.abs(mon); type = mon < 0 ? 'debito' : 'credito'; }
    if (!(amount > 0)) continue;
    out.push({ date, amount: r2(amount), type, ref: c(r, 'ref').slice(0, 120), desc: c(r, 'desc').slice(0, 200) });
  }
  return out;
}
// Todo de una vez: { ok:true, fila, cols, moves } o { ok:false } (hay que escoger las columnas a mano).
export function leerEstadoDeCuenta(rows) {
  const d = detectarColumnas(rows);
  return d ? { ok: true, ...d, moves: movimientosBanco(rows, d) } : { ok: false };
}
// La fila que más se parece a un encabezado (la más llena entre las primeras), para escoger columnas a mano.
export function filaEncabezado(rows) {
  const R = filasBanco(rows).slice(0, 40); let best = 0;
  R.forEach((r, i) => { if (r.filter((x) => String(x).trim()).length > R[best].filter((x) => String(x).trim()).length) best = i; });
  return best;
}
// La clave de un movimiento para no duplicarlo: fecha + monto + referencia (sin referencia, la descripción).
export const claveMovimiento = (m) => `${m.date}|${(+m.amount).toFixed(2)}|${norm(m.ref || m.desc || '')}`;

// ---------- El cruce: banco ↔ facturas ----------
// Un crédito empata con una factura por cobrar pendiente (o vencida) y un débito con una por pagar,
// si el monto es igual (±1%) y la fecha cae dentro de ±10 días del vencimiento. Cada factura y cada movimiento, una vez.
// Gana la pareja con el monto más cercano y, después, la fecha más cercana. Devuelve [{ invoice_id, move_id, diff, dias }].
export const TOL_MONTO = 0.01, TOL_DIAS = 10;
export function cruzar(invs = [], moves = [], hoy = hoyISO()) {
  const cands = [];
  const libres = moves.filter((m) => !m.invoice_id && isDate(m.date) && +m.amount > 0);
  for (const m of libres) for (const i of invs) {
    if (!abierta(i, hoy) || !(+i.amount > 0) || !isDate(i.due)) continue;
    if ((m.type === 'credito' && i.kind !== 'cobrar') || (m.type === 'debito' && i.kind !== 'pagar')) continue;
    const diff = Math.abs(+m.amount - +i.amount) / +i.amount, dias = Math.abs(daysBetween(m.date, i.due));
    if (diff <= TOL_MONTO + 1e-9 && dias <= TOL_DIAS) cands.push({ invoice_id: i.id, move_id: m.id, diff: Math.round(diff * 10000) / 10000, dias });
  }
  cands.sort((a, z) => a.diff - z.diff || a.dias - z.dias);
  const usI = new Set(), usM = new Set(), out = [];
  for (const c of cands) { if (usI.has(c.invoice_id) || usM.has(c.move_id)) continue; usI.add(c.invoice_id); usM.add(c.move_id); out.push(c); }
  return out;
}
