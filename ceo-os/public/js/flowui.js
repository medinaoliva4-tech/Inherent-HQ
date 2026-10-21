// Subir un pago: lo usan Hoy y Control (CEO/COO) y Mis tareas (quien tiene la tarea de cobro).
import { api, ask, toast, today, confirmAsk } from './core.js';

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

// Confirmar el pago de una cotización y arrancar su proyecto (CEO/COO). Lo usan Hoy y Control.
// Devuelve lo que respondió el flujo ({ project_id, tasks, people, welcome }) o null si se canceló o falló.
const nextWorkday = () => { const d = new Date(); do d.setDate(d.getDate() + 1); while (!(d.getDay() % 6)); return d.toISOString().slice(0, 10); };
export async function confirmarYArrancar(q, { leads = [] } = {}) {
  const hasSvc = (q.items || []).some((i) => i.service_id);
  const v = await ask(`Confirmar el pago y arrancar · ${q.client}`, [
    { k: 'kind', l: 'Tipo de proyecto', t: 'select', v: hasSvc ? 'Custom' : 'Proyecto', opts: [['Custom', 'Custom · los servicios de la cotización'], ['Ciclo mensual', 'Ciclo de contenido'], ['Proyecto', 'Proyecto por fases'], ['Growth', 'Business Growth']] },
    { k: 'start', l: 'Arranca', t: 'date', v: nextWorkday(), req: true, half: true },
    { k: 'email', l: 'Correo del cliente (le da acceso a su portal)', t: 'email', v: q.email || leads.find((l) => l.id === q.lead_id)?.email || '' },
    { k: 'welcome', l: 'Correo de bienvenida', t: 'select', v: 'si', opts: [['si', 'Sí: gracias + su portal + su onboarding'], ['no', 'No mandar correo']] },
    { k: 'slug', l: 'Nombre corto del cliente', v: q.client_slug || String(q.client || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), req: true, half: true }], 'Confirmar y arrancar');
  if (!v) return null;
  const st = await api('status').catch(() => ({}));
  if (v.email && !st.portal) toast('Ojo: el cliente podrá entrar a su portal cuando termines el cliente de Google del portal', true);
  let r;
  try { r = await api('flow/quote/' + q.id, { method: 'POST', body: { action: 'confirm', ...v } }); } catch (e) { toast(e.message, true); return null; }
  if (r?.project_id) {
    toast(`Arrancó ${r.tasks} tareas para ${r.people} personas${r.welcome?.sent ? ` · correo enviado a ${r.welcome.to}` : ''}`);
    if (r.welcome && !r.welcome.sent && (await confirmAsk('No pude mandarlo desde tu Gmail (sal y vuelve a entrar para dar el permiso). ¿Lo abro en Gmail ya escrito?'))) window.open(r.welcome.compose, '_blank', 'noopener');
  }
  return r;
}
