// Las metas del cliente (su roadmap): qué queremos, cómo se mide, dónde estamos, el desglose y los checkpoints.
// Viven en la cuenta (accounts.goals). Lo usa la página del cliente (pestaña Info) y su PDF.
// Una meta que manda Consulting trae además `origen: 'consulting'`, `blueprint_ref` (el id del entregable del que salió) y
// `blueprint_fila` (la fila o meta dentro de él). Son campos opcionales: el wizard no los pide y editar una meta los conserva.
import { html, raw, fdate, fdateLong, today, ask, confirmAsk, toast, wizard, ico, docView, docHead } from './core.js';
import { priceLabel, avatar } from './mentors.js';
import { vacio } from './visual.js';

const RM = { todo: ['Pendiente', ''], now: ['En curso', 'lime'], done: ['Logrado', 'green'] };
const HEALTH = { ok: ['En camino', 'green', '#626263'], riesgo: ['En riesgo', 'amber', '#a0a0a1'], off: ['Fuera de ruta', 'red', '#515152'] };
// (Los hitos viejos se leen como metas sin métrica.)
export const goalsOf = (a) => a?.goals || (a?.roadmap || []).map((x) => ({ goal: x.t, due: x.date || '', status: x.status || 'todo', note: x.note || '', metric: '', baseline: '', target: '', current: '', tasks: [], checks: [] }));
const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : null; };
export const pctOf = (g) => { if (g.status === 'done') return 100; const b = num(g.baseline) ?? 0, t = num(g.target), c = num(g.current); if (t == null || c == null || t === b) return null; return Math.max(0, Math.min(100, Math.round(((c - b) / (t - b)) * 100))); };
export const healthOf = (g) => [...(g.checks || [])].reverse().find((c) => c.done)?.health || null;
// La clave de una meta de Consulting para no duplicarla al mandarla otra vez: entregable + fila. Sin las dos, no hay clave.
export const claveConsulting = (g) => (g?.origen === 'consulting' && g.blueprint_ref && g.blueprint_fila ? `${g.blueprint_ref}|${g.blueprint_fila}` : '');
// Suma las metas nuevas a las de la cuenta sin repetir las que ya llegaron: { goals, agregadas, repetidas }. No cambia las que ya había.
export function sumarMetas(actuales, nuevas) {
  const vistas = new Set((actuales || []).map(claveConsulting).filter(Boolean)), agregadas = [], repetidas = [];
  for (const g of nuevas || []) {
    const k = claveConsulting(g);
    if (k && vistas.has(k)) { repetidas.push(g); continue; }
    if (k) vistas.add(k);
    agregadas.push(g);
  }
  return { goals: [...(actuales || []), ...agregadas], agregadas, repetidas };
}
function checkpoints(from, to, every) {
  const out = []; const d = new Date(from + 'T12:00'), end = new Date((to || from) + 'T12:00');
  const step = () => (every === 'semanal' ? d.setDate(d.getDate() + 7) : every === 'quincenal' ? d.setDate(d.getDate() + 14) : d.setMonth(d.getMonth() + 1));
  step(); while (d < end && out.length < 24) { out.push({ date: d.toISOString().slice(0, 10), done: false }); step(); }
  out.push({ date: to || from, done: false, final: true }); return out;
}
async function goalWizard() {
  const a = await wizard('Nueva meta', [
    { k: 'goal', q: '¿Cuál es la meta?', type: 'text', req: true, ph: 'Ej. Facturar Q120K al mes', chips: ['Facturar más al mes', 'Duplicar los leads', 'Lanzar la nueva oferta', 'Subir el ticket promedio'] },
    { k: 'metric', q: '¿Cómo sabemos que se logró?', sub: 'La métrica que vamos a mirar', type: 'text', req: true, ph: 'Ej. Facturación mensual', chips: ['Facturación mensual', 'Leads por mes', 'Ventas cerradas', 'Ticket promedio', 'Seguidores', 'ROAS'] },
    { k: 'baseline', q: '¿Dónde está hoy?', type: 'text', ph: 'Ej. Q80,000' },
    { k: 'target', q: '¿A cuánto llegamos?', type: 'text', req: true, ph: 'Ej. Q120,000' },
    { k: 'due', q: '¿Para cuándo?', type: 'date', req: true },
    { k: 'tasks', q: 'El desglose: ¿qué hay que hacer?', sub: 'Una tarea por línea', type: 'textarea', ph: 'Nueva oferta con precio\nLanding y checkout\nCampaña de lanzamiento' },
    { k: 'every', q: '¿Cada cuánto revisamos cómo va?', type: 'cards', req: true, opts: [{ v: 'semanal', i: ico('pin'), l: 'Cada semana' }, { v: 'quincenal', i: ico('pin'), l: 'Cada 15 días' }, { v: 'mensual', i: ico('pin'), l: 'Cada mes' }] },
  ], 'Agregar meta');
  if (!a) return null;
  return { goal: a.goal, metric: a.metric, baseline: a.baseline || '', target: a.target, current: a.baseline || '', due: a.due, status: 'now', note: '', every: a.every,
    tasks: String(a.tasks || '').split('\n').map((t) => t.trim()).filter(Boolean).map((t) => ({ t, done: false })), checks: checkpoints(today(), a.due, a.every) };
}

// ctx: { get: () => cuenta, save: async (cuenta) => ok, repaint, mentors, edit }
export function goalsUI(ctx) {
  const { mentors = [], edit } = ctx;
  const G = () => JSON.parse(JSON.stringify(goalsOf(ctx.get())));
  const saveGoals = async (goals) => { if (await ctx.save({ ...ctx.get(), goals })) ctx.repaint(); };
  function card(g) {
    const a = ctx.get(), pct = pctOf(g), h = healthOf(g), td = (g.tasks || []).filter((t) => t.done).length;
    return html`<div class="card goal ${g.status}">
      <div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:500;font-size:17px">${g.goal}</b>
        <button class="chip ${RM[g.status]?.[1] || ''}" data-act="gst" data-g="${g.i}" style="font-size:11px" ${edit ? '' : raw('disabled')}>${RM[g.status]?.[0] || 'Pendiente'}</button>
        ${h ? html`<span class="chip ${HEALTH[h][1]}" style="font-size:11px">${HEALTH[h][0]}</span>` : ''}
        ${g.origen === 'consulting' ? html`<span class="chip" style="font-size:11px" title="Viene de un entregable de Consulting">Consulting</span>` : ''}
        <div class="sp"></div><span class="mut sm">${g.due ? 'Para el ' + fdateLong(g.due) : 'Sin fecha'}</span>${edit ? html`<button class="sm mut" data-act="gedit" data-g="${g.i}" title="Editar">${ico('edit')}</button><button class="sm mut" data-act="gdel" data-g="${g.i}" title="Quitar">${ico('x', 16)}</button>` : ''}</div>
      ${g.metric ? html`<div class="gmetric"><span class="mut sm">${ico('ruler')} ${g.metric}</span><div class="row" style="gap:10px;margin-top:6px"><span class="sm">Hoy <b style="font-weight:500">${g.current || g.baseline || '—'}</b></span><div class="gbar"><i style="width:${pct ?? 0}%"></i></div><span class="sm">Meta <b style="font-weight:500">${g.target || '—'}</b></span><span class="sm mut" style="width:40px;text-align:right">${pct == null ? '' : pct + '%'}</span></div></div>` : html`<div class="mut sm" style="margin-top:6px">Sin métrica todavía.</div>`}
      ${g.note ? html`<div class="mut sm" style="margin-top:6px">${g.note}</div>` : ''}
      ${(a.mentors || []).filter((x) => x.goal === g.i).map((x) => { const m = mentors.find((y) => y.id === x.id); return m ? html`<div class="row sm" style="gap:8px;margin-top:8px">${avatar(m, 24)}<span>Con <b style="font-weight:500">${m.name}</b> · ${m.industry} · ${priceLabel(m)}</span></div>` : ''; })}
      <details class="gmore"><summary class="sm mut">Desglose ${td}/${(g.tasks || []).length} · checkpoints ${(g.checks || []).filter((c) => c.done).length}/${(g.checks || []).length}</summary>
      <div class="gcols">
        <div><div class="lbl" style="color:var(--mut)">Desglose</div>
          ${(g.tasks || []).map((t, k) => html`<label class="check" style="padding:3px 0"><input type="checkbox" data-act="gtask" data-g="${g.i}" data-k="${k}" ${t.done ? raw('checked') : ''} ${edit ? '' : raw('disabled')}> <span style="${t.done ? 'text-decoration:line-through;opacity:.5' : ''}">${t.t}</span></label>`)}
          ${edit ? html`<button class="sm mut" data-act="gtadd" data-g="${g.i}" style="margin-top:4px">+ tarea</button>` : ''}</div>
        <div><div class="lbl" style="color:var(--mut)">Checkpoints${g.every ? ' · ' + g.every : ''}</div>
          <div class="gchecks">${(g.checks || []).map((c, k) => html`<button class="gck ${c.done ? 'done' : ''} ${c.date <= today() && !c.done ? 'due' : ''}" data-act="gcheck" data-g="${g.i}" data-k="${k}" title="${c.note || ''}" style="${c.done && c.health ? `border-color:${HEALTH[c.health][2]}` : ''}"><span class="d" style="${c.done && c.health ? `background:${HEALTH[c.health][2]}` : ''}"></span><span>${fdate(c.date)}${c.final ? ' · final' : ''}</span>${c.value ? html`<b>${c.value}</b>` : ''}</button>`)}${(g.checks || []).length ? '' : html`<span class="mut sm">Sin checkpoints.</span>`}</div>
          ${edit ? html`<button class="sm mut" data-act="gckadd" data-g="${g.i}" style="margin-top:6px">+ checkpoint</button>` : ''}</div>
      </div></details></div>`;
  }
  const section = () => { const rm = goalsOf(ctx.get()).map((x, i) => ({ ...x, i })); return html`<div class="sec-title"><h2>Metas</h2><span class="mut sm">${rm.length ? `${rm.filter((x) => x.status === 'done').length}/${rm.length} logradas` : 'Sin metas todavía'}</span><div class="sp"></div>${edit ? html`<button class="btn ghost xs" data-act="gadd">+ Meta</button>` : ''}<button class="btn ghost xs" data-act="gpdf">↓ PDF</button></div>
    ${rm.length ? html`<div class="goals">${rm.map(card)}</div>` : html`${vacio({ icono: 'inbox', titulo: 'Sin metas todavía', linea: 'Una meta trae cómo la medimos, dónde estamos, a dónde vamos y cuándo revisamos.' })}`}`; };
  function pdf(planName) {
    const a = ctx.get(), rm = goalsOf(a);
    docView(html`${docHead('Roadmap', html`${a.name}<br>${fdateLong(today())}`)}
      <div class="qto"><div><div class="lbl2">CLIENTE</div><b style="font-weight:500;font-size:15px">${a.name}</b>${planName ? html`<div>${planName}</div>` : ''}</div>
        <div><div class="lbl2">AVANCE</div><b style="font-weight:500;font-size:15px">${rm.filter((x) => x.status === 'done').length} de ${rm.length} metas logradas</b></div></div>
      ${rm.map((g) => { const pct = pctOf(g), h = healthOf(g); return html`<div class="pgoal"><div class="row"><b style="font-weight:500;font-size:15px">${g.goal}</b><div class="sp"></div><span style="color:#636364;font-size:12px">${g.due ? fdateLong(g.due) : ''}</span></div>
        <div style="font-size:11px;letter-spacing:1px;font-weight:700;color:${g.status === 'done' ? '#5f5f60' : '#8a8a8b'}">${(RM[g.status]?.[0] || 'Pendiente').toUpperCase()}${h ? ' · ' + HEALTH[h][0].toUpperCase() : ''}</div>
        ${g.metric ? html`<div style="font-size:12.5px;margin-top:6px"><b style="font-weight:500">Cómo se mide:</b> ${g.metric} · hoy ${g.current || g.baseline || '—'} → meta ${g.target || '—'}${pct == null ? '' : ` (${pct}%)`}</div>` : ''}
        ${(g.tasks || []).length ? html`<div style="font-size:12.5px;margin-top:6px"><b style="font-weight:500">Desglose:</b> ${g.tasks.map((t) => (t.done ? '✓ ' : '○ ') + t.t).join(' · ')}</div>` : ''}
        ${(g.checks || []).length ? html`<div style="font-size:12.5px;margin-top:4px"><b style="font-weight:500">Checkpoints:</b> ${g.checks.map((c) => `${fdate(c.date)}${c.done ? ` ✓${c.value ? ' ' + c.value : ''}` : ''}`).join(' · ')}</div>` : ''}
        ${(a.mentors || []).filter((x) => x.goal === rm.indexOf(g)).map((x) => { const m = mentors.find((y) => y.id === x.id); return m ? html`<div style="font-size:12.5px;margin-top:4px"><b style="font-weight:500">Especialista:</b> ${m.name} · ${m.industry}</div>` : ''; })}
        ${g.note ? html`<div style="color:var(--ink2);font-size:12.5px;margin-top:4px">${g.note}</div>` : ''}</div>`; })}
      <div class="qfoot"><span>Inherent · Growth Partner</span><span>inherentglobal.com</span></div>`);
  }
  const acts = {
    gadd: async () => { const g = await goalWizard(); if (g) { await saveGoals([...G(), g]); toast('Meta agregada'); } },
    gst: async (t) => { const g = G(); const x = g[+t.dataset.g]; x.status = { todo: 'now', now: 'done', done: 'todo' }[x.status] || 'now'; await saveGoals(g); },
    gedit: async (t) => { const g = G(); const x = g[+t.dataset.g]; const v = await ask('Editar meta', [{ k: 'goal', l: 'Meta', v: x.goal, req: true }, { k: 'metric', l: 'Cómo se mide', v: x.metric }, { k: 'baseline', l: 'Al arrancar', v: x.baseline, half: true }, { k: 'current', l: 'Hoy', v: x.current, half: true }, { k: 'target', l: 'Meta', v: x.target, half: true }, { k: 'due', l: 'Para cuándo', t: 'date', v: x.due, half: true }, { k: 'note', l: 'Nota (sale en el PDF)', t: 'textarea', v: x.note }]); if (!v) return; g[+t.dataset.g] = { ...x, ...v }; await saveGoals(g); },
    gdel: async (t) => { if (!(await confirmAsk('¿Quitar esta meta?'))) return; await saveGoals(G().filter((_, i) => i !== +t.dataset.g)); },
    gtask: async (cb) => { const g = G(); g[+cb.dataset.g].tasks[+cb.dataset.k].done = cb.checked; await saveGoals(g); },
    gtadd: async (t) => { const v = await ask('Nueva tarea de la meta', [{ k: 't', l: 'Tarea', req: true }]); if (!v) return; const g = G(); g[+t.dataset.g].tasks = [...(g[+t.dataset.g].tasks || []), { t: v.t, done: false }]; await saveGoals(g); },
    gckadd: async (t) => { const v = await ask('Nuevo checkpoint', [{ k: 'date', l: 'Fecha', t: 'date', req: true }]); if (!v) return; const g = G(); const x = g[+t.dataset.g]; x.checks = [...(x.checks || []), { date: v.date, done: false }].sort((p, q) => p.date.localeCompare(q.date)); await saveGoals(g); },
    gcheck: async (t) => {
      if (!edit) return; const g = G(); const x = g[+t.dataset.g]; const c = x.checks[+t.dataset.k];
      const v = await ask(`Checkpoint · ${fdate(c.date)}`, [{ k: 'value', l: `¿Cuánto va? (${x.metric || 'la métrica'})`, v: c.value || x.current, half: true }, { k: 'health', l: '¿Cómo vamos?', t: 'select', opts: Object.entries(HEALTH).map(([k, [l]]) => [k, l]), v: c.health || 'ok', half: true }, { k: 'note', l: 'Qué pasó y qué ajustamos', t: 'textarea', v: c.note }], 'Registrar');
      if (!v) return; x.checks[+t.dataset.k] = { ...c, ...v, done: true }; if (v.value) x.current = v.value; await saveGoals(g);
    },
  };
  return { section, pdf, acts };
}
