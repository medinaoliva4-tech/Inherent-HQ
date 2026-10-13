// Subir un pago: lo usan Control (CEO/COO) y el Workspace (quien tiene la tarea de cobro).
import { api, ask, toast, today } from './core.js';

const fileToData = (f) => new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = bad; r.readAsDataURL(f); });
export async function payDialog({ quote_id, client, currency = 'GTQ', amount }) {
  const v = await ask(`Subir el pago · ${client || ''}`, [
    { k: 'amount', l: `Monto (${currency})`, t: 'number', v: amount ?? '', req: true, half: true },
    { k: 'date', l: 'Fecha', t: 'date', v: today(), req: true, half: true },
    { k: 'method', l: 'Método', t: 'select', opts: ['Transferencia', 'Depósito', 'Tarjeta', 'Efectivo', 'Otro'], half: true },
    { k: 'ref', l: 'Referencia / no. de boleta', half: true },
    { k: 'proof', l: 'Comprobante (imagen o PDF, máx. 2 MB)', t: 'file', accept: 'image/*,application/pdf' }], 'Subir pago');
  if (!v) return null;
  let proof = null;
  if (v.proof) { if (v.proof.size > 2_000_000) { toast('El comprobante pesa más de 2 MB', true); return null; } proof = await fileToData(v.proof); }
  try { await api('flow/quote/' + quote_id, { method: 'POST', body: { action: 'payment', amount: v.amount, date: v.date, method: v.method, ref: v.ref, proof, proof_name: v.proof?.name } }); }
  catch (e) { toast(e.message, true); return null; }
  toast('Pago subido · falta que lo confirme el CEO o el COO');
  return true;
}
// Abre un comprobante guardado (imagen o PDF) en otra pestaña.
export async function openProof(id) {
  try {
    const p = await api('flow/proof/' + id);
    const [head, b64] = p.data.split(','); const type = head.slice(5).split(';')[0];
    const bin = atob(b64), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    window.open(URL.createObjectURL(new Blob([bytes], { type })), '_blank');
  } catch (e) { toast(e.message, true); }
}
