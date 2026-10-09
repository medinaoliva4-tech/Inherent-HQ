// Control: el panel del CEO y el COO. Todo lo que entra, de lead a entrega, conectado:
// lead → cotización → aprobada → pago → confirmado → proyecto con responsables, fechas y dependencias.
// Cada tarjeta trae su siguiente paso. Abajo, lo que necesita atención hoy (bloqueos, atrasos, revisiones).
import { html, mount, col, api, toast, acts, ask, drawer, fdate, today, teamList, Q } from '../core.js';
import { blockersOf, unlocksOf, addDays } from '../cycle.js';
import { payDialog, openProof } from '../flowui.js';

const STEPS = [
  ['lead', 'Leads', 'Por cotizar', '#a39a8c'],
  ['quote', 'Cotización', 'Esperando al cliente', '#7f9631'],
  ['pay', 'Aprobada', 'Falta el pago', '#d08a2e'],
  ['check', 'Pago subido', 'Por confirmar', '#b08a5f'],
  ['run', 'En marcha', 'Proyectos', '#4f6b12'],
];
const OPEN_LEAD = ['Nuevo', 'Contactado', 'Propuesta'];
const nextWorkday = () => { const d = new Date(); do d.setDate(d.getDate() + 1); while (!(d.getDay() % 6)); return d.toISOString().slice(0, 10); };

export async function render(el, { me }) {
  const ceoish = me.role === 'ceo' || me.role === 'coo';
  let leads, quotes, projects, tasks, team;
  async function load() {
    [leads, quotes, projects, tasks, team] = await Promise.all([col('leads').list(), col('quotes').list(), col('projects').list(), col('tasks').list(), teamList()]);
  }
  await load();
  const T = today();
  const nameOf = (e) => (team.find((p) => p.email === e || p.id === e)?.name || e || 'Sin responsable').split(' ')[0];
  const sub = (q) => (q.items || []).reduce((a, i) => a + (+i.qty || 0) * (+i.price || 0), 0) * (1 - (+q.discount_pct || 0) / 100);
  const money = (q, n) => { const c = q.currency || 'GTQ', r = c === 'GTQ' ? 1 : +q.rate || 1; try { return new Intl.NumberFormat('es-GT', { style: 'currency', currency: c, maximumFractionDigits: c === 'GTQ' ? 0 : 2 }).format(n * r); } catch { return Q(n); } };
  const pTasks = (p) => tasks.filter((t) => t.project_id === p.id);
  const isLate = (t) => t.due && t.due < T && t.status !== 'Hecha';

  // En qué paso va cada cosa
  function lanes() {
    const qByLead = new Set(quotes.filter((q) => q.status !== 'Rechazada').map((q) => q.lead_id).filter(Boolean));
    return {
      lead: leads.filter((l) => OPEN_LEAD.includes(l.stage || 'Nuevo') && !qByLead.has(l.id)),
      quote: quotes.filter((q) => ['Borrador', 'Enviada'].includes(q.status || 'Borrador')),
      pay: quotes.filter((q) => q.status === 'Aceptada' && (!q.payment || q.payment.status === 'rechazado')),
      check: quotes.filter((q) => q.status === 'Aceptada' && q.payment?.status === 'por confirmar'),
      run: projects.filter((p) => p.status !== 'cerrado' && (pTasks(p).some((t) => t.status !== 'Hecha') || !pTasks(p).length)),
    };
  }
  const progress = (p) => { const l = pTasks(p), d = l.filter((t) => t.status === 'Hecha').length; return { n: l.length, d, pct: l.length ? Math.round((d / l.length) * 100) : 0, late: l.filter(isLate).length, blocked: l.filter((t) => t.status !== 'Hecha' && blockersOf(t, tasks).length).length, next: l.filter((t) => t.status !== 'Hecha' && t.due).sort((a, z) => a.due.localeCompare(z.due))[0] }; };

  const card = {
    lead: (l) => html`<div class="kcard ctl"><b>${l.name}</b><div class="mut sm">${l.wants || l.company || '—'}</div>
      ${l.next_date ? html`<div class="sm ${l.next_date < T ? 'bad' : 'mut'}">${l.next_step || 'Seguimiento'} · ${fdate(l.next_date)}</div>` : ''}
      <div class="ctla"><a class="btn xs" href="#/sales/quotes/new/${l.id}">Cotizar →</a></div></div>`,
    quote: (q) => html`<div class="kcard ctl"><b>${q.client || '—'}</b><div class="mut sm">${q.number} · ${money(q, sub(q))}</div>
      <div class="sm mut">${q.status === 'Enviada' ? `Enviada ${q.sent_at ? fdate(q.sent_at.slice(0, 10)) : ''}` : 'Borrador'}</div>
      <div class="ctla">${q.status === 'Enviada' ? html`<button class="btn xs" data-act="step" data-a="approve" data-id="${q.id}">Aprobada ✓</button><button class="btn ghost xs" data-act="step" data-a="reject" data-id="${q.id}">Rechazada</button>`
        : html`<a class="btn ghost xs" href="#/sales/quotes/${q.id}">Abrir</a><button class="btn xs" data-act="step" data-a="send" data-id="${q.id}">Marcar enviada</button>`}</div></div>`,
    pay: (q) => { const t = tasks.find((x) => x.id === q.pay_task_id);
      return html`<div class="kcard ctl"><b>${q.client || '—'}</b><div class="mut sm">${q.number} · ${money(q, sub(q))}</div>
      ${t ? html`<div class="sm ${isLate(t) ? 'bad' : 'mut'}">Lo sube ${nameOf(t.assignee)} · vence ${fdate(t.due)}</div>` : ''}
      ${q.payment?.status === 'rechazado' ? html`<div class="sm bad">Pago devuelto${q.payment.note ? `: ${q.payment.note}` : ''}</div>` : ''}
      <div class="ctla"><button class="btn xs" data-act="pay" data-id="${q.id}">Subir pago</button></div></div>`; },
    check: (q) => html`<div class="kcard ctl"><b>${q.client || '—'}</b><div class="mut sm">${q.number} · pagó <b style="display:inline;font-weight:600">${new Intl.NumberFormat('es-GT', { style: 'currency', currency: q.payment.currency || 'GTQ' }).format(q.payment.amount)}</b></div>
      <div class="sm mut">${fdate(q.payment.date)}${q.payment.method ? ` · ${q.payment.method}` : ''} · subió ${nameOf(q.payment.by)}</div>
      <div class="ctla">${q.payment.proof_id ? html`<button class="btn ghost xs" data-act="proof" data-id="${q.payment.proof_id}">Comprobante</button>` : ''}
        ${ceoish ? html`<button class="btn xs" data-act="confirm" data-id="${q.id}">Confirmar y arrancar ⚡</button><button class="btn ghost xs" data-act="step" data-a="refuse" data-id="${q.id}">Devolver</button>` : html`<span class="sm mut">Lo confirma el CEO o el COO</span>`}</div></div>`,
    run: (p) => { const g = progress(p);
      return html`<div class="kcard ctl click" data-act="proj" data-id="${p.id}"><b>${p.client || p.name}</b><div class="mut sm">${p.name}</div>
      <div class="ctlbar"><i style="width:${g.pct}%"></i></div><div class="row sm"><span>${g.d}/${g.n} tareas</span><div class="sp"></div>${g.late ? html`<span class="chip red sm2">${g.late} atrasadas</span>` : ''}${g.blocked ? html`<span class="chip amber sm2">🔒 ${g.blocked}</span>` : ''}</div>
      ${g.next ? html`<div class="sm mut" style="margin-top:4px">Sigue: ${g.next.title.slice(0, 48)} · ${nameOf(g.next.assignee)} · ${fdate(g.next.due)}</div>` : ''}</div>`; },
  };

  // Lo que necesita atención hoy
  function attention() {
    const out = [];
    for (const t of tasks) {
      if (t.status === 'Hecha') continue;
      const w = blockersOf(t, tasks);
      const lateBlockers = w.filter(isLate);
      if (lateBlockers.length) out.push({ tone: 'red', ic: '🔒', t: `«${lateBlockers[0].title}» frena a «${t.title}»`, s: `${nameOf(lateBlockers[0].assignee)} va tarde desde ${fdate(lateBlockers[0].due)}`, id: t.project_id, w: 0 });
      else if (isLate(t) && !w.length) out.push({ tone: 'red', ic: '⏰', t: t.title, s: `${nameOf(t.assignee)} · venció ${fdate(t.due)}`, id: t.project_id, w: 1 });
      if (t.status === 'En revisión') out.push({ tone: 'amber', ic: '👀', t: `Revisar: ${t.title}`, s: `Lo entregó ${nameOf(t.assignee)}${t.accountable ? ` · aprueba ${nameOf(t.accountable)}` : ''}`, id: t.project_id, w: 2 });
    }
    for (const q of quotes) if (q.status === 'Enviada' && q.sent_at && q.sent_at.slice(0, 10) <= addDays(T, -5)) out.push({ tone: 'amber', ic: '📨', t: `${q.client} no ha respondido la ${q.number}`, s: `Enviada el ${fdate(q.sent_at.slice(0, 10))} · dale seguimiento`, href: `#/sales/quotes/${q.id}`, w: 3 });
    for (const l of leads) if (OPEN_LEAD.includes(l.stage || 'Nuevo') && l.next_date && l.next_date < T) out.push({ tone: 'amber', ic: '📞', t: `Seguimiento a ${l.name}`, s: `${l.next_step || 'Pendiente'} · era el ${fdate(l.next_date)}`, href: '#/sales/crm', w: 4 });
    return out.sort((a, z) => a.w - z.w);
  }

  function paint() {
    const L = lanes(), att = attention();
    const kp = [['Leads por cotizar', L.lead.length], ['Esperando al cliente', L.quote.length], ['Falta el pago', L.pay.length, L.pay.length ? '#d08a2e' : ''], ['Pagos por confirmar', L.check.length, L.check.length ? '#a3392a' : ''], ['Proyectos en marcha', L.run.length], ['Necesita atención', att.length, att.length ? '#a3392a' : '']];
    mount(el, html`<div class="hello"><h1>Control</h1><p class="mut">Todo lo que entra, de lead a entrega.</p></div>
      <div class="ctlkpis">${kp.map(([l, n, c]) => html`<div class="card ctlk"><div class="mut sm">${l}</div><div class="big" style="font-size:38px;${c ? `color:${c}` : ''}">${n}</div></div>`)}</div>
      <div class="sec-title" style="margin-top:18px"><h2>El flujo</h2><span class="mut sm">Cada tarjeta trae su siguiente paso</span></div>
      <div class="kanban ctlflow">${STEPS.map(([k, name, hint, c]) => html`<div class="kcol"><h4><span class="row" style="gap:8px"><i class="dot" style="background:${c}"></i>${name}</span><span class="mut">${L[k].length}</span></h4>
        <div class="mut sm" style="margin:-6px 6px 10px">${hint}</div>${L[k].length ? L[k].map(card[k]) : html`<div class="mut sm" style="padding:10px 6px">—</div>`}</div>`)}</div>
      <div class="sec-title" style="margin-top:22px"><h2>Necesita atención</h2><span class="mut sm">Bloqueos, atrasos y lo que espera una decisión</span></div>
      <div class="card">${att.length ? att.slice(0, 30).map((a) => html`<div class="wkrow ctlrow" data-href="${a.href || ''}" data-act="${a.id ? 'proj' : 'go'}" data-id="${a.id || ''}"><span class="ctlic">${a.ic}</span><span class="grow">${a.t}<span class="mut sm"> · ${a.s}</span></span><span class="chip ${a.tone} sm2">${a.tone === 'red' ? 'Urgente' : 'Hoy'}</span></div>`) : html`<div class="mut">Todo en orden ✅</div>`}</div>`);
  }

  async function refresh() { await load(); paint(); }
  async function step(id, action, extra = {}) {
    try { const r = await api('flow/quote/' + id, { method: 'POST', body: { action, ...extra } }); await refresh(); return r; }
    catch (e) { toast(e.message, true); return null; }
  }

  // Un proyecto con sus tareas en orden de dependencia: quién, cuándo, y qué lo frena.
  function openProject(id) {
    const p = projects.find((x) => x.id === id); if (!p) return;
    const l = pTasks(p).sort((a, z) => (a.due || '9').localeCompare(z.due || '9')), g = progress(p);
    const st = (t) => (t.status === 'Hecha' ? ['✓', 'green'] : blockersOf(t, tasks).length ? ['🔒', 'amber'] : isLate(t) ? ['!', 'red'] : t.status === 'En revisión' ? ['👀', 'blue'] : ['•', '']);
    drawer(html`<div class="row"><span class="chip">${p.kind || 'Proyecto'}</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
      <h2>${p.client || p.name}</h2><div class="mut">${p.name}</div>
      <div class="ctlbar" style="margin-top:12px"><i style="width:${g.pct}%"></i></div><div class="sm mut">${g.d}/${g.n} tareas · ${g.late} atrasadas · ${g.blocked} bloqueadas</div>
      <div style="margin-top:16px">${l.map((t) => { const [i, c] = st(t), w = blockersOf(t, tasks), u = unlocksOf(t, tasks);
        return html`<div class="ctltask"><span class="chip ${c} sm2">${i}</span><div class="grow"><div>${t.title}</div>
          <div class="sm mut">${nameOf(t.assignee)} · ${t.due ? fdate(t.due) : 'sin fecha'} · ${t.status || 'Por empezar'}</div>
          ${w.length ? html`<div class="sm" style="color:#86570e">Espera a: ${w.map((x) => x.title).join(' · ')}</div>` : ''}
          ${u.length && t.status !== 'Hecha' ? html`<div class="sm mut">Destraba: ${u.map((x) => x.title.slice(0, 40)).join(' · ')}</div>` : ''}</div></div>`; })}</div>
      <div class="row" style="margin-top:16px"><a class="btn ghost" href="#/operations/pipe">Abrir en Operations</a></div>`);
  }

  acts(el, {
    step: async (b) => {
      const a = b.dataset.a; let extra = {};
      if (a === 'reject' || a === 'refuse') { const v = await ask(a === 'reject' ? '¿Por qué la rechazó?' : '¿Qué está mal con el pago?', [{ k: 'note', l: 'Nota', t: 'textarea' }], a === 'reject' ? 'Rechazada' : 'Devolver pago'); if (!v) return; extra = v; }
      if (await step(b.dataset.id, a, extra)) toast(a === 'approve' ? 'Aprobada ✅ · tarea de cobro creada' : a === 'send' ? 'Marcada como enviada 📨' : 'Listo');
    },
    pay: async (b) => {
      const q = quotes.find((x) => x.id === b.dataset.id);
      if (await payDialog({ quote_id: q.id, client: q.client, currency: q.currency || 'GTQ', amount: Math.round(sub(q) * (q.currency && q.currency !== 'GTQ' ? +q.rate || 1 : 1) * 100) / 100 })) refresh();
    },
    confirm: async (b) => {
      const q = quotes.find((x) => x.id === b.dataset.id);
      const hasSvc = (q.items || []).some((i) => i.service_id);
      const v = await ask(`Confirmar el pago y arrancar · ${q.client}`, [
        { k: 'kind', l: 'Tipo de proyecto', t: 'select', v: hasSvc ? 'Custom' : 'Proyecto', opts: [['Custom', 'Custom · los servicios de la cotización'], ['Ciclo mensual', 'Ciclo de contenido'], ['Proyecto', 'Proyecto por fases'], ['Growth', 'Business Growth']] },
        { k: 'start', l: 'Arranca', t: 'date', v: nextWorkday(), req: true, half: true },
        { k: 'slug', l: 'Nombre corto del cliente', v: q.client_slug || String(q.client || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), req: true, half: true }], 'Confirmar y arrancar ⚡');
      if (!v) return;
      const r = await step(q.id, 'confirm', v);
      if (r?.project_id) { toast(`Arrancó ⚡ ${r.tasks} tareas para ${r.people} personas, con fechas y dependencias`); openProject(r.project_id); }
    },
    proof: (b) => openProof(b.dataset.id),
    proj: (b) => (b.dataset.id ? openProject(b.dataset.id) : b.dataset.href && (location.hash = b.dataset.href)),
    go: (b) => b.dataset.href && (location.hash = b.dataset.href),
  });
  paint();
}
