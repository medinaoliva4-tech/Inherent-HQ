// Facturas en el servidor: generar los cobros del mes, registrar, marcar pagada y el cruce con el banco.
// Lo usan la API (Finanzas → Facturas) y el conector de Claude. Todo es solo del CEO: quien llama ya lo verificó.
// Las reglas puras (estado, totales, cobros del mes, lectura del CSV y el cruce) viven en public/js/facturas.js.
import crypto from 'node:crypto';
import * as db from './db.js';
import { readFile, listDir } from './gh.js';
import { parsePlanContratado } from './parse.js';
import { limpiarFactura, cobrosDelMes, claveMovimiento, estadoFactura } from '../../public/js/facturas.js';

const hoy = () => new Date().toISOString().slice(0, 10);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const err = (msg, status = 400) => Object.assign(new Error(msg), { status });

// Los clientes del repo con su ficha de oferta (el precio y los campos, como los ve el CEO).
export async function clientesDelRepo() {
  const dirs = (await listDir('clients')).filter((d) => d.type === 'dir' && !d.name.startsWith('_'));
  return Promise.all(dirs.map(async (d) => {
    const f = await readFile(`clients/${d.name}/00-onboarding/plan-contratado.md`);
    return f ? { slug: d.name, hasPlan: true, ...parsePlanContratado(f.content, 'ceo') } : { slug: d.name, hasPlan: false };
  }));
}

// Genera las facturas por cobrar del mes. No duplica: la clave es cliente + period (y el id es fijo: cobro-<slug>-<mes>).
export async function generarCobros(u, period) {
  const [clients, accounts, projects, quotes, services, existing] = await Promise.all([clientesDelRepo(), db.list('accounts'), db.list('projects'), db.list('quotes'), db.list('services'), db.list('invoices')]);
  const plan = cobrosDelMes({ period, clients, accounts, projects, quotes, services, existing, hoy: hoy() });
  const creadas = [];
  for (const { id, ...inv } of plan.crear) {
    try { creadas.push(await db.create('invoices', inv, u.email, id)); }
    catch (e) { if (/duplicate|unique/i.test(e.message)) plan.yaExisten.push(inv.client); else throw e; } // otra pestaña la creó un instante antes
  }
  return { period, creadas, yaExisten: plan.yaExisten, sinPrecio: plan.sinPrecio, porProyecto: plan.porProyecto };
}

// Registra una factura (a mano o desde Claude). Por pagar: si ya existe una igual (proveedor, monto y fecha), no la duplica.
export async function registrar(u, data, source = 'manual') {
  const inv = limpiarFactura({ ...data, source }, hoy());
  if (inv.kind === 'pagar') {
    const k = (s) => String(s || '').trim().toLowerCase();
    const dup = (await db.list('invoices')).find((i) => i.kind === 'pagar' && i.status !== 'anulada' && k(i.vendor) === k(inv.vendor) && +i.amount === inv.amount && (i.issued === inv.issued || i.due === inv.due));
    if (dup) return { ...dup, ya_existia: true };
  }
  return db.create('invoices', inv, u.email);
}

// Marca una factura como pagada (con la fecha y la referencia del banco, si se saben).
export async function marcarPagada(u, id, { paid_at, bank_ref } = {}) {
  const cur = await db.get('invoices', String(id || ''));
  if (!cur) throw err('No encontré esa factura', 404);
  if (cur.status === 'anulada') throw err('Esa factura está anulada');
  if (cur.status === 'pagada') return { ...cur, ya_estaba: true };
  const { id: _i, v, _meta, ...doc } = cur;
  const next = limpiarFactura({ ...doc, status: 'pagada', paid_at: isDate(paid_at) ? paid_at : hoy(), bank_ref: bank_ref || cur.bank_ref }, hoy());
  const r = await db.update('invoices', cur.id, next, cur.v, u.email);
  if (!r) throw err('Alguien la cambió justo ahora; intenta de nuevo', 409);
  return r;
}

// Guarda los movimientos del estado de cuenta sin duplicar (la clave es fecha + monto + referencia).
export const idMovimiento = (m) => 'mv-' + crypto.createHash('sha1').update(claveMovimiento(m)).digest('hex').slice(0, 24);
export async function guardarMovimientos(u, moves = []) {
  if (!Array.isArray(moves) || !moves.length) throw err('El archivo no trae movimientos');
  if (moves.length > 3000) throw err('Son demasiados movimientos: sube un mes a la vez');
  let nuevos = 0, repetidos = 0, malos = 0;
  const at = new Date().toISOString();
  for (const m0 of moves) {
    const m = { date: String(m0?.date || ''), amount: Math.round(+m0?.amount * 100) / 100, type: m0?.type === 'debito' ? 'debito' : m0?.type === 'credito' ? 'credito' : '', ref: String(m0?.ref || '').slice(0, 120), desc: String(m0?.desc || '').slice(0, 200) };
    if (!isDate(m.date) || !(m.amount > 0) || !m.type) { malos++; continue; }
    const id = idMovimiento(m);
    if (await db.get('bank_moves', id)) { repetidos++; continue; }
    try { await db.create('bank_moves', { ...m, key: claveMovimiento(m), bank: 'BAC', uploaded_at: at }, u.email, id); nuevos++; }
    catch (e) { if (/duplicate|unique/i.test(e.message)) repetidos++; else throw e; }
  }
  return { nuevos, repetidos, malos, moves: await db.list('bank_moves') };
}

// Confirma una pareja del cruce: la factura queda pagada (paid_at = fecha del movimiento, bank_ref = su referencia)
// y el movimiento queda ligado a esa factura.
export async function conciliar(u, invoiceId, moveId) {
  const [inv, mv] = await Promise.all([db.get('invoices', String(invoiceId || '')), db.get('bank_moves', String(moveId || ''))]);
  if (!inv || !mv) throw err('No encontré la factura o el movimiento', 404);
  if (mv.invoice_id && mv.invoice_id !== inv.id) throw err('Ese movimiento ya está ligado a otra factura');
  if ((mv.type === 'credito') !== (inv.kind === 'cobrar')) throw err(mv.type === 'credito' ? 'Un crédito solo paga una factura por cobrar' : 'Un débito solo paga una factura por pagar');
  if (!['pendiente', 'vencida'].includes(estadoFactura(inv, hoy())) && inv.status !== 'pagada') throw err('Esa factura no está pendiente');
  const r = inv.status === 'pagada' ? inv : await marcarPagada(u, inv.id, { paid_at: mv.date, bank_ref: mv.ref || mv.desc.slice(0, 60) || mv.id });
  const { id: _i, v, _meta, ...m } = mv;
  await db.update('bank_moves', mv.id, { ...m, invoice_id: inv.id }, mv.v, u.email);
  return r;
}
