// La pestaña «Servicio» del cliente: lo contratado, módulo por módulo — precio, fechas, qué se hace en esas fechas
// (las tareas de la receta o las del proyecto) y quién (rol → persona del proyecto). Solo el CEO ve precio y costo.
import { html, fdate, today, Q, ico } from './core.js';
import { moduleCost } from './finscope.js';
import { serviceRecipe, RECIPE_ROLES } from './recipes.js';
import { monthStrip, PAL } from './charts.js';

const roleName = (r) => RECIPE_ROLES.find(([k]) => k === r)?.[1] || r;
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

// ctx: { me, slug, info, projects, tasks, quotes, services, rates, recipes (R), team, precioFicha }
export function serviceTab(ctx) {
  const { me, info, projects = [], tasks = [], quotes = [], services = [], rates = null, R = [], team = [] } = ctx;
  const ceo = me.role === 'ceo', T = today(), M = T.slice(0, 7);
  const person = (k) => team.find((p) => p.id === k || p.email === k)?.name || (k ? String(k).split('@')[0] : '');
  const who = (p, role) => { const k = p.roles_map?.[role] || tasks.find((t) => t.project_id === p.id && t.role === role && t.assignee)?.assignee; return k ? person(k) : null; };
  const money = (v) => (v == null ? html`<span class="mut">—</span>` : Q(v));
  const open = (t) => (t.status || 'Por empezar') !== 'Hecha';
  const span = (p) => { const st = (p.phases || []).map((x) => x.start).filter(Boolean).sort(), en = (p.phases || []).map((x) => x.end).filter(Boolean).sort(); return { start: st[0] || '', end: en.at(-1) || '' }; };
  const when = (p, unit) => { const s = span(p); if (unit === 'mes') return html`Cada mes${p.cycle ? ` · ciclo ${p.cycle}` : ''} · del día 1 al 20`; return s.start ? html`${fdate(s.start)} → ${s.end ? fdate(s.end) : 'sin fin'}` : html`<span class="mut">Sin fechas todavía: salen de las fases del proyecto</span>`; };
  // Qué se hace: la receta del servicio (día del ciclo + rol) o, si no hay, las tareas reales del proyecto.
  const steps = (p, item) => {
    const rec = item?.service_id ? serviceRecipe(R, item.service_id) : null;
    const s0 = span(p).start;
    if (rec) return rec.tasks.map((t) => ({ title: t.title, day: t.day, date: s0 ? addDays(s0, (+t.day || 1) - 1) : '', role: t.role, who: who(p, t.role), done: null }));
    const l = tasks.filter((t) => t.project_id === p.id && (!item?.service_id || t.service_id === item.service_id || !t.service_id)).sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
    return l.map((t) => ({ title: t.title, date: t.due || '', role: t.role || '', who: t.assignee ? person(t.assignee) : who(p, t.role), done: !open(t) }));
  };
  const stepRows = (l) => (!l.length ? html`<div class="mut sm" style="padding:6px 0">Sin tareas todavía. Salen de la receta del servicio (Equipo → Recetas) o de las tareas del proyecto.</div>`
    : l.slice(0, 14).map((s) => html`<div class="wkrow"><span class="wkt">${s.date ? fdate(s.date) : s.day ? `día ${s.day}` : '—'}</span><span class="grow"><span style="${s.done ? 'text-decoration:line-through;opacity:.55' : ''}">${s.title}</span></span><span class="chip sm2">${s.who || (s.role ? html`<span class="mut">${roleName(s.role)} · sin asignar</span>` : '—')}</span></div>`));
  // Los módulos: los servicios de cada proyecto; si el proyecto no trae módulos, el proyecto entero es el servicio.
  const mods = [];
  for (const p of projects) {
    const items = Array.isArray(p.services) && p.services.length ? p.services : [null];
    for (const it of items) {
      const sv = it && services.find((x) => x.id === (it.service_id || it.id));
      const unit = sv?.unit || (p.kind === 'Ciclo mensual' ? 'mes' : 'proyecto');
      const c = it && ceo ? moduleCost(it, services, rates) : null;
      mods.push({ p, it, name: it ? it.name || sv?.name || 'Módulo' : `${p.kind || 'Proyecto'}${p.name && p.name !== p.kind ? ` · ${p.name}` : ''}`, unit, level: it?.level, qty: it?.qty || 1,
        price: ceo ? (it ? (+it.price > 0 ? +it.price * (+it.qty || 1) : null) : +p.price > 0 ? +p.price : ctx.precioFicha ?? null) : null, cost: c?.cost ?? null, costWhy: c?.why || (c?.miss?.length ? `faltan costos por hora de ${c.miss.join(', ')}` : ''), includes: sv?.includes5 || it?.includes || '' });
    }
  }
  // Cotizaciones aceptadas que todavía no son proyecto.
  for (const q of quotes.filter((x) => x.status === 'Aceptada' && !x.project_id)) for (const it of q.items || []) mods.push({ q, it, name: it.name || 'Módulo', unit: services.find((x) => x.id === it.service_id)?.unit || 'proyecto', level: it.level, qty: it.qty || 1, price: ceo ? (+it.price || 0) * (+it.qty || 1) || null : null, cost: null, pending: `Cotización ${q.number || ''} aceptada · el proyecto arranca con el pago` });
  const total = ceo && mods.some((m) => m.price != null) ? mods.reduce((a, m) => a + (m.price || 0), 0) : null;
  const totalCost = ceo && mods.some((m) => m.cost != null) ? mods.reduce((a, m) => a + (m.cost || 0), 0) : null;
  // La línea de tiempo del mes: las tareas de sus proyectos con fecha este mes.
  const pids = new Set(projects.map((p) => p.id));
  const marks = tasks.filter((t) => pids.has(t.project_id) && String(t.due || '').slice(0, 7) === M).map((t) => ({ day: +t.due.slice(8), label: `${t.title}${t.assignee ? ' · ' + person(t.assignee).split(' ')[0] : ''}`, done: !open(t), c: t.due < T && open(t) ? PAL.red : PAL.sand }));
  const fields = (info?.fields || []).filter((f) => !/^(plan|precio|costo)$/i.test(f.key) || ceo);
  return html`
    ${ceo ? html`<div class="split" style="margin:0 0 16px"><div><span class="lbl">Precio</span><b>${money(total)}</b></div><div><span class="lbl">${ico('lock', 13)} Costo</span><b>${money(totalCost)}</b></div>${total && totalCost ? html`<div><span class="lbl">Margen</span><b>${Math.round(((total - totalCost) / total) * 100)}%</b></div>` : ''}<div><span class="lbl">Módulos</span><b>${mods.length}</b></div></div>` : ''}
    <div class="card wkbox" style="margin-bottom:14px"><div class="wkhead"><div><h3>Este mes</h3><span class="mut sm">Las entregas del mes, día por día · ${marks.length ? `${marks.filter((x) => x.done).length}/${marks.length} hechas` : 'sin entregas con fecha'}</span></div></div>${monthStrip(M, marks, { today: T })}</div>
    ${mods.length ? mods.map((m) => html`<div class="card wkbox svmod" style="margin-bottom:12px">
      <div class="wkhead"><div><h3>${m.name}</h3><span class="mut sm">${m.level ? `Complejidad ${m.level} · ` : ''}por ${m.unit}${m.qty > 1 ? ` · ×${m.qty}` : ''}${m.p ? ` · ${m.p.name}` : ''}</span></div><div class="sp"></div>
        ${ceo ? html`<div class="pr"><b style="font-weight:500">${m.price == null ? html`<span class="mut sm">precio: vendrá de su cotización o de la ficha</span>` : Q(m.price)}</b>${m.cost != null ? html`<div class="mut sm">${ico('lock', 12)} costo ${Q(m.cost)}</div>` : m.it ? html`<div class="mut sm">${ico('lock', 12)} costo: ${m.costWhy || 'sin dato'}</div>` : ''}</div>` : ''}</div>
      <div class="row sm" style="gap:8px;flex-wrap:wrap;margin:4px 0 8px"><span class="chip sm2">${ico('cal', 13)} ${m.pending ? m.pending : when(m.p, m.unit)}</span>${m.p?.roles_map ? Object.entries(m.p.roles_map).slice(0, 6).map(([r, k]) => html`<span class="chip sm2">${roleName(r)}: ${person(k).split(' ')[0]}</span>`) : ''}</div>
      ${m.includes ? html`<div class="mut sm" style="margin-bottom:6px">${String(m.includes).split('\n').filter(Boolean).slice(0, 4).join(' · ')}</div>` : ''}
      ${m.p ? stepRows(steps(m.p, m.it)) : ''}</div>`)
    : html`<div class="empty"><b>Sin servicio activo</b>Aparece cuando el cliente tiene un proyecto (se crea al confirmar el pago de su cotización, o en Proyectos).</div>`}
    ${fields.length || info?.pipeline?.length ? html`<details class="card wkbox" style="margin-top:4px"><summary class="sm" style="cursor:pointer">Ficha de oferta del repo</summary>
      ${fields.map((f) => html`<div class="row sm" style="padding:7px 0;border-top:1px solid var(--line);align-items:flex-start"><span class="mut" style="min-width:150px">${f.key}</span><span style="flex:1">${f.value}</span></div>`)}
      ${info?.pipeline?.length ? html`<div class="lbl" style="margin-top:12px;color:var(--mut)">Su pipeline</div>${info.pipeline.map((r) => html`<div class="row sm" style="padding:5px 0"><span style="min-width:150px">${r.paso}</span><span class="mut" style="flex:1">${r.que}</span></div>`)}` : ''}</details>` : ''}`;
}
