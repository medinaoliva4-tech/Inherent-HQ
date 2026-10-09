// El flujo comercial → operativo de Inherent, de punta a punta:
//   lead → cotización enviada → aprobada (se crea la tarea de cobro) → pago subido → pago confirmado
//   → ingreso en Finance + lead ganado + cliente + proyecto con responsables, fechas y dependencias.
// Lo usan el panel de Control, Sales y el conector MCP. Todo pasa aquí, en el servidor.
import * as db from './db.js';
import { phasesFor, meetingsFor, tasksFor, customTasks, createLinked, holders, DEPTS, svcHours, hoursAt, includesAt, daysAt, addDays, onboardingFor } from '../../public/js/cycle.js';
import { domain } from './access.js';
import * as google from './google.js';
import * as mail from './mail.js';

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
export const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const teamOf = async () => (await db.list('team')).filter((p) => p.role !== 'client' && p.active !== false).map((p) => ({ ...p, email: p.email || p.id }));
export const quoteTotal = (q) => (q.items || []).reduce((a, i) => a + (+i.price || 0) * (+i.qty || 0), 0) * (1 - (+q.discount_pct || 0) / 100);
// Lo que cobra la cotización, en su moneda (los precios se guardan en quetzales).
const inCur = (q, n) => (q.currency && q.currency !== 'GTQ' ? n * (+q.rate || 1) : n);
const toQ = (q, n) => (q.currency && q.currency !== 'GTQ' ? n / (+q.rate || 1) : n);
const put = (coll, id, data, who) => db.upsert(coll, id, data, who);
const log = (doc, who, text) => [...(doc.activity || []), { at: now(), who, text }].slice(-60);

// ---------- Proyecto con tareas enlazadas (lo usan el flujo y el MCP) ----------
export async function createProject(u, { slug, label, kind, start, quote, name }) {
  const [team, tasks] = await Promise.all([teamOf(), db.list('tasks')]);
  let items = null;
  if (kind === 'Custom') {
    if (!quote) throw new Error('Un proyecto Custom sale de una cotización');
    const services = await db.list('services');
    items = (quote.items || []).filter((i) => i.service_id).map((i) => { const s = services.find((x) => x.id === i.service_id); if (!s) return null; const lv = i.level || s.level || 5, n = +i.qty || 1;
      return { id: s.id, name: s.name, level: lv, days: daysAt(s, lv), includes: includesAt(s, lv), hours: svcHours(s, lv) * n, roles: (s.tasks || []).map((t) => ({ role: t.role, hours: hoursAt(t, lv) * n })), price: (+i.price || 0) * n }; }).filter(Boolean);
    if (!items.length) throw new Error('La cotización no tiene servicios del catálogo');
  }
  const lab = label || (slug === 'inherent' ? 'Inherent' : slug.toUpperCase());
  const p = await db.create('projects', { name: String(name || `${lab} · ${kind === 'Ciclo mensual' ? 'ciclo ' + start.slice(0, 7) : kind.toLowerCase()}`).slice(0, 120), kind, line: kind === 'Growth' ? 'growth' : 'contenido', cycle: kind === 'Ciclo mensual' ? start.slice(0, 7) : '', client: lab, client_slug: slug,
    phases: phasesFor(kind, start), meetings: meetingsFor(kind, start), ...(items ? { services: items, price: items.reduce((a, i) => a + (i.price || 0), 0) || null } : {}), ...(quote ? { quote_id: quote.id, lead_id: quote.lead_id || '' } : {}),
    pipeline: Object.fromEntries(DEPTS.map(([d]) => [d, { status: 'todo' }])), status: 'activo' }, u.email);
  const made = await createLinked(items ? customTasks(p, items, team, u.email) : tasksFor(p, team, tasks, u.email), (t) => db.create('tasks', { ...t, assigned_at: now() }, u.email));
  return { project: p, tasks: made };
}

// ---------- Los pasos de una cotización ----------
const ROLE_OK = (u) => u.role === 'ceo' || u.role === 'coo';
const EMAIL = /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/;
// Da acceso al portal de un cliente (correo aprobado de afuera). Nunca le baja el rol a alguien del equipo.
export async function portalAccess(u, slug, email, name) {
  const cur = await db.get('team', email);
  if (cur && cur.role && cur.role !== 'client') return false;
  if (cur && cur.client_slug && cur.client_slug !== slug) return false;
  await db.upsert('team', email, { email, name: String(name || email.split('@')[0]).slice(0, 80), role: 'client', client_slug: slug, external: !email.endsWith('@' + domain()), active: true, invited_by: u.email, invited_at: now() }, u.email);
  return true;
}
export async function step(u, id, action, b = {}, base = '') {
  const q = await db.get('quotes', id); if (!q) throw Object.assign(new Error('La cotización no existe'), { status: 404 });
  const lead = q.lead_id ? await db.get('leads', q.lead_id) : null;
  const team = await teamOf(), who = holders(team, u.email);
  const sales = u.areas.includes('sales');
  const payTask = q.pay_task_id ? await db.get('tasks', q.pay_task_id) : null;
  const deny = (m = 'Tu perfil no puede hacer este paso') => { throw Object.assign(new Error(m), { status: 403 }); };
  const setLead = async (stage, text) => { if (lead) await put('leads', lead.id, { stage, activity: log(lead, u.name, text) }, u.email); };

  if (action === 'send') {
    if (!sales) deny();
    await put('quotes', id, { status: 'Enviada', sent_at: now(), activity: log(q, u.name, 'Cotización enviada') }, u.email);
    await setLead('Propuesta', `Cotización ${q.number} enviada`);
  } else if (action === 'approve') {
    if (!sales) deny();
    if (q.status === 'Aceptada') return { ok: true };
    // El cliente aprobó: alguien tiene que subir el pago. Va a quien lleva los cobros de Inherent (o al CEO).
    const t = payTask || await db.create('tasks', { title: `Subir el pago de ${q.client || 'cliente'} · ${q.number}`, description: `La cotización ${q.number} fue aprobada. Sube el comprobante y el monto en Control → «Subir pago».`, assignee: who('cobros') || who('ceo') || u.email, accountable: who('ceo') || '', due: addDays(today(), 3), status: 'Por empezar', kind: 'pago', quote_id: id, amount_due: Math.round(inCur(q, quoteTotal(q)) * 100) / 100, currency: q.currency || 'GTQ', project_id: '', visibility: 'all', checklist: [], comments: [], assigned_at: now() }, u.email);
    await put('quotes', id, { status: 'Aceptada', approved_at: now(), pay_task_id: t.id, activity: log(q, u.name, 'Aprobada por el cliente · falta el pago') }, u.email);
    await setLead('Propuesta', `Aprobó la cotización ${q.number} · falta el pago`);
  } else if (action === 'reject') {
    if (!sales) deny();
    await put('quotes', id, { status: 'Rechazada', activity: log(q, u.name, 'Rechazada' + (b.note ? `: ${String(b.note).slice(0, 200)}` : '')) }, u.email);
    if (payTask && payTask.status !== 'Hecha') await put('tasks', payTask.id, { status: 'Hecha', description: (payTask.description || '') + '\n(Cotización rechazada)' }, u.email);
    await setLead('Perdido', `Rechazó la cotización ${q.number}`);
  } else if (action === 'payment') {
    if (!(sales || payTask?.assignee === u.email)) deny();
    if (q.status !== 'Aceptada') deny('Primero la cotización tiene que estar aprobada');
    const amount = +b.amount; if (!(amount > 0)) deny('Escribe el monto');
    let proof_id = q.payment?.proof_id || '';
    if (b.proof) {
      if (!/^data:(image\/(png|jpe?g|webp)|application\/pdf);base64,/.test(String(b.proof)) || String(b.proof).length > 3_000_000) deny('El comprobante tiene que ser una imagen o PDF de menos de 2 MB');
      proof_id = (await db.create('proofs', { quote_id: id, name: String(b.proof_name || 'comprobante').slice(0, 120), data: b.proof }, u.email)).id;
    }
    const payment = { amount, currency: q.currency || 'GTQ', date: /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : today(), method: String(b.method || '').slice(0, 60), ref: String(b.ref || '').slice(0, 120), proof_id, by: u.email, at: now(), status: 'por confirmar' };
    await put('quotes', id, { payment, activity: log(q, u.name, `Pago subido: ${payment.currency} ${amount}`) }, u.email);
    if (payTask) await put('tasks', payTask.id, { status: 'En revisión', accountable: who('ceo') || payTask.accountable || '' }, u.email);
  } else if (action === 'refuse') {
    if (!ROLE_OK(u)) deny('Solo el CEO o el COO confirman pagos');
    await put('quotes', id, { payment: { ...(q.payment || {}), status: 'rechazado', note: String(b.note || '').slice(0, 300) }, activity: log(q, u.name, 'Pago devuelto' + (b.note ? `: ${b.note}` : '')) }, u.email);
    if (payTask) await put('tasks', payTask.id, { status: 'En curso', comments: [...(payTask.comments || []), { at: now(), who: u.name, text: `Pago devuelto: ${b.note || 'revísalo'}` }] }, u.email);
  } else if (action === 'confirm') {
    if (!ROLE_OK(u)) deny('Solo el CEO o el COO confirman pagos');
    if (q.payment?.status !== 'por confirmar') deny('No hay un pago por confirmar');
    if (q.project_id) return { ok: true, project_id: q.project_id };
    const kind = ['Custom', 'Ciclo mensual', 'Proyecto', 'Growth'].includes(b.kind) ? b.kind : 'Custom';
    const start = /^\d{4}-\d{2}-\d{2}$/.test(b.start || '') ? b.start : today();
    const slug = slugify(b.slug || q.client_slug || q.client); if (slug.length < 2) deny('Falta el nombre corto del cliente');
    const label = String(b.label || q.client || slug).slice(0, 60);
    // 1) el ingreso entra a Finance (en quetzales)
    await db.create('finance', { type: 'ingreso', concept: `Pago ${q.number} · ${label}`, amount: Math.round(toQ(q, q.payment.amount) * 100) / 100, date: q.payment.date, category: 'Ventas', client: slug.toUpperCase(), quote_id: id }, u.email);
    // 2) el cliente existe (su ficha) y el lead queda ganado
    const acc = await db.get('accounts', 'acc-' + slug);
    if (!acc) await db.create('accounts', { name: label, slug, contact: q.contact || lead?.contact || '', email: q.email || lead?.email || '', phone: lead?.phone || '', notes: '', roadmap: [], accesos: [], since: today(), from_quote: id }, u.email, 'acc-' + slug);
    await setLead('Ganado', `Pagó la cotización ${q.number} · arranca el proyecto`);
    // 3) arranca el proyecto: fases, reuniones y tareas con responsables, fechas y dependencias
    const { project, tasks } = await createProject(u, { slug, label, kind, start, quote: q, name: b.name || `${label} · ${q.number}` });
    await put('quotes', id, { client_slug: slug, project_id: project.id, payment: { ...q.payment, status: 'confirmado', confirmed_by: u.email, confirmed_at: now() }, activity: log(q, u.name, `Pago confirmado · proyecto creado con ${tasks.length} tareas`) }, u.email);
    if (payTask) await put('tasks', payTask.id, { status: 'Hecha' }, u.email);
    // 4) el cliente: acceso a su portal, su onboarding (según lo que se le cotizó) y el correo de gracias
    const services = await db.list('services');
    const items = onboardingFor(kind, (q.items || []).map((i) => services.find((x) => x.id === i.service_id)).filter(Boolean));
    const prev = (await db.get('accounts', 'acc-' + slug))?.onboarding?.items || [];
    await put('accounts', 'acc-' + slug, { onboarding: { items: items.map((x) => prev.find((y) => y.t === x.t) || x), at: now(), from_quote: id, sender: u.email } }, u.email);
    let welcome = null;
    const to = String(b.email || '').trim().toLowerCase();
    if (EMAIL.test(to)) {
      await portalAccess(u, slug, to, q.contact || lead?.contact || label);
      if (b.welcome !== false && b.welcome !== 'no') {
        const kick = project.meetings?.[0]?.date;
        const m = mail.welcome({ base, to, name: q.contact || lead?.contact || '', client: label, project: project.name, kickoff: kick ? new Date(kick + 'T12:00').toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' }) : '', items: items.map((x) => x.t), sender: u.name });
        try { await google.sendMail(u.email, m); welcome = { sent: true, to }; }
        catch (e) { welcome = { sent: false, to, compose: mail.composeUrl(m), why: e.message }; }
      }
    }
    console.log(JSON.stringify({ evt: 'flow_confirm', quote: q.number, project: project.id, tasks: tasks.length, by: u.email, welcome: welcome?.sent }));
    return { ok: true, project_id: project.id, tasks: tasks.length, people: [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].length, welcome };
  } else deny('Paso desconocido');
  return { ok: true };
}

export async function proof(u, id) {
  const p = await db.get('proofs', id); if (!p) return null;
  const q = await db.get('quotes', p.quote_id);
  const t = q?.pay_task_id ? await db.get('tasks', q.pay_task_id) : null;
  return u.areas.includes('sales') || u.role === 'ceo' || t?.assignee === u.email ? p : null;
}
export { inCur, toQ };

// ---------- El onboarding desde el portal ----------
export async function onboarding(slug) { return (await db.get('accounts', 'acc-' + slug))?.onboarding || null; }
export async function saveOnboarding(u, slug, edits = []) {
  const ob = await onboarding(slug); if (!ob) return null;
  const items = ob.items.map((x, i) => { const e = edits[i]; return e ? { ...x, done: Boolean(e.done), note: String(e.note ?? x.note ?? '').slice(0, 1000) } : x; });
  const done = items.every((x) => x.done);
  await put('accounts', 'acc-' + slug, { onboarding: { ...ob, items, ...(done && !ob.done_at ? { done_at: now() } : {}), updated_by: u.email, updated_at: now() } }, u.email);
  return { items, done };
}
export async function inviteTeammate(u, slug, b, base) {
  const to = String(b.email || '').trim().toLowerCase(); if (!EMAIL.test(to)) throw Object.assign(new Error('Ese correo no es válido'), { status: 400 });
  const mates = (await db.list('team')).filter((p) => p.role === 'client' && p.client_slug === slug);
  if (mates.length >= 8 && !mates.some((p) => (p.email || p.id) === to)) throw Object.assign(new Error('Tu portal ya tiene 8 personas. Escríbenos para agregar más.'), { status: 400 });
  if (!(await portalAccess(u, slug, to, b.name))) throw Object.assign(new Error('Ese correo no se puede agregar'), { status: 400 });
  const acc = await db.get('accounts', 'acc-' + slug), ob = acc?.onboarding;
  const m = mail.invite({ base, to, name: b.name || '', by: u.name, client: acc?.name || slug.toUpperCase(), items: (ob?.items || []).filter((x) => !x.done).map((x) => x.t) });
  // Sale del Gmail de quien arrancó el proyecto en Inherent.
  try { if (!ob?.sender) throw new Error('sin remitente'); await google.sendMail(ob.sender, { ...m, replyTo: u.email }); return { ok: true, mailed: true }; }
  catch { return { ok: true, mailed: false, link: `${base}/api/auth/google?portal=1` }; }
}
