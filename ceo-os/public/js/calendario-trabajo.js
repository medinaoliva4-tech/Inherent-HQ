// El calendario de trabajo: uno solo, con todo lo operativo (Proyectos → Calendario).
//   Reuniones (Google Calendar y las de los proyectos) · Producción (grabaciones, tareas de ⑤ y fases de producir) ·
//   Entregas (tareas con fecha y fases) · Ventas (el siguiente paso de cada lead) · Facturas (vencimientos) ·
//   Ciclo (día 1 reunión, día 11 último día para producir, día 20 presentación: inherent/05-OPERACION.md).
// Cada quien ve lo que su perfil permite: Ventas pide el área de Ventas; Facturas, la de Finanzas (y las por pagar, solo el CEO,
// igual que el servidor: api/_lib/access.js → stripInvoice). El servidor además filtra cada colección por alcance.
// Arriba: funciones puras (las usan la pantalla y las pruebas). Abajo: cómo se pinta (solo en el navegador).
import { rutaModulo } from './herramientas.js';
const core = typeof document === 'undefined' ? null : await import('./core.js');

export const TIPOS = [['reuniones', 'Reuniones'], ['produccion', 'Producción'], ['entregas', 'Entregas'], ['ventas', 'Ventas'], ['facturas', 'Facturas'], ['ciclo', 'Ciclo']];
const ORDEN = Object.fromEntries(TIPOS.map(([k], i) => [k, i]));
// Los tres límites del ciclo de contenido (día, nombre, qué pasa).
export const HITOS = [
  [1, 'Reunión con el cliente', 'Arranca el ciclo: el CEO se reúne con cada cliente. Del 1 al 3 se arma el plan.'],
  [11, 'Último día para producir', 'Se graba y se fotografía del 6 al 10. El 11 es el límite: lo que no se produjo, no entra al mes.'],
  [20, 'Presentación al cliente', 'Se presenta lo del mes (COO en Brand Growth, CEO en Growth Partnership). Se publica desde el día 1 del mes siguiente.'],
];
const OPEN = ['Nuevo', 'Contactado', 'Reunión', 'Propuesta'];
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const pad = (n) => String(n).padStart(2, '0');

// Qué tipos puede ver un perfil. Reuniones, producción, entregas y ciclo: todo el que entra a Proyectos.
export function tiposVisibles(me) {
  const a = me?.areas || [];
  return TIPOS.map(([k]) => k).filter((k) => (k === 'ventas' ? a.includes('sales') : k === 'facturas' ? a.includes('finanzas') : true));
}
// Quita lo que el perfil no ve (por si llegó algo de más).
export function filtrarPorRol(evs = [], me) {
  const ok = new Set(tiposVisibles(me));
  return evs.filter((e) => ok.has(e.tipo) && !(e.tipo === 'facturas' && e.kind === 'pagar' && me?.role !== 'ceo'));
}

// Los días que cubre la vista: el mes de `fecha` o su semana (de lunes a domingo).
export function rango(vista, fecha) {
  const f = isDate(fecha) ? fecha : new Date().toISOString().slice(0, 10);
  if (vista === 'semana') {
    const wd = (new Date(f + 'T12:00:00Z').getUTCDay() + 6) % 7, from = addDays(f, -wd);
    const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
    return { from, to: days[6], days };
  }
  const [y, m] = f.slice(0, 7).split('-').map(Number), n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days = Array.from({ length: n }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`);
  return { from: days[0], to: days[n - 1], days };
}

// Los hitos del ciclo de cada mes que toca el rango.
export function hitosCiclo(from, to) {
  if (!isDate(from) || !isDate(to)) return [];
  const out = []; let [y, m] = from.slice(0, 7).split('-').map(Number);
  for (let i = 0; i < 24; i++) {
    for (const [d, name] of HITOS) { const date = `${y}-${pad(m)}-${pad(d)}`; if (date >= from && date <= to) out.push({ k: `ciclo-${date}`, tipo: 'ciclo', date, time: '', title: `Día ${d} · ${name}`, go: { act: 'hito', d } }); }
    if (`${y}-${pad(m)}` >= to.slice(0, 7)) break;
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

// Una tarea es de producción si es de ⑤ Producción, del rol de producción o si dice grabar, rodaje o fotos.
export const esProduccion = (t) => t?.role === 'prod' || /^⑤/.test(String(t?.dept || '').trim()) || /grab(ar|aci)|rodaje|sesi[oó]n de fotos|photo ?shoot|shooting/i.test(String(t?.title || ''));
const faseTipo = (name) => (/producci|producir|rodaje|grabaci/i.test(name) ? 'produccion' : /reuni/i.test(name) ? 'reuniones' : 'entregas');

// Junta todo lo operativo de un rango en una sola lista: { k, tipo, date, time, title, sub?, late?, go: {act,…} | {href} }.
export function juntarEventos({ google = [], tasks = [], projects = [], shoots = [], leads = [], invoices = [], from, to, hoy = new Date().toISOString().slice(0, 10) } = {}) {
  const out = [], inR = (d) => isDate(d) && d >= from && d <= to;
  // Google Calendar: los eventos de varios días aparecen en cada día; cada calendario con su color.
  google.forEach((e, i) => {
    const s0 = String(e.start || '').slice(0, 10); if (!isDate(s0)) return;
    const e0 = e.allDay ? addDays(String(e.end || e.start).slice(0, 10), -1) : String(e.end || e.start).slice(0, 10);
    for (let d = s0, n = 0; d <= (isDate(e0) ? e0 : s0) && n < 40; d = addDays(d, 1), n++) if (inR(d)) out.push({ k: `g${i}-${d}`, tipo: 'reuniones', date: d, time: e.allDay || d !== s0 ? '' : String(e.start).slice(11, 16), title: e.summary || 'Evento', sub: e.calName || 'Google Calendar', color: /^#[0-9a-f]{6}$/i.test(e.color || '') ? e.color : null, go: { act: 'ev', i } });
  });
  for (const t of tasks) {
    if (!t || t.status === 'Hecha' || !inR(t.due)) continue;
    out.push({ k: `t-${t.id}`, tipo: esProduccion(t) ? 'produccion' : 'entregas', date: t.due, time: '', title: t.title || 'Tarea', sub: t.dept || '', late: t.due < hoy, go: { act: 'task', id: t.id } });
  }
  for (const p of projects) {
    const href = `#/operations/p/${encodeURIComponent(p.id)}`;
    (p.phases || []).forEach((ph, j) => { if (inR(ph.start) && ph.status !== 'done') out.push({ k: `f-${p.id}-${j}`, tipo: faseTipo(ph.name || ''), date: ph.start, time: '', title: `${ph.name} · ${p.name}`, sub: 'Fase', go: { href } }); });
    // Las reuniones con link ya están en Google Calendar: no se repiten.
    (p.meetings || []).forEach((m, j) => { if (inR(m.date) && m.status !== 'hecha' && !m.link) out.push({ k: `m-${p.id}-${j}`, tipo: 'reuniones', date: m.date, time: m.time || '', title: `${m.name} · ${p.client || p.name}`, sub: 'Reunión del proyecto', go: { href } }); });
  }
  for (const x of shoots) {
    if (!x || (x.kind && x.kind !== 'shoot') || x.status === 'Cancelado' || !inR(x.date)) continue;
    out.push({ k: `s-${x.id}`, tipo: 'produccion', date: x.date, time: x.time || '', title: `Grabación · ${x.title || ''}`.trim(), sub: x.place || '', go: { href: rutaModulo(encodeURIComponent(x.profile || ''), 'calendario', ['grabacion']) } });
  }
  for (const l of leads) {
    if (!l || l.archived || !OPEN.includes(l.stage || 'Nuevo') || !inR(l.next_date)) continue;
    out.push({ k: `l-${l.id}`, tipo: 'ventas', date: l.next_date, time: '', title: `${l.next_step || 'Seguimiento'} · ${l.name}`, sub: 'Seguimiento', late: l.next_date < hoy, go: { href: `#/sales/crm/${encodeURIComponent(l.id)}` } });
  }
  for (const f of invoices) {
    if (!f || ['pagada', 'anulada'].includes(f.status) || !inR(f.due)) continue;
    const who = f.kind === 'pagar' ? f.vendor : String(f.client || '').toUpperCase();
    out.push({ k: `i-${f.id}`, tipo: 'facturas', kind: f.kind, date: f.due, time: '', title: `${f.kind === 'pagar' ? 'Pago' : 'Cobro'} · ${who || 'Factura'}`, sub: f.concept || '', late: f.due < hoy, go: { href: '#/finanzas/fact' } });
  }
  out.push(...hitosCiclo(from, to));
  return out.sort((a, z) => a.date.localeCompare(z.date) || (a.tipo === 'ciclo' ? -1 : z.tipo === 'ciclo' ? 1 : 0) || String(a.time || '').localeCompare(String(z.time || '')) || ORDEN[a.tipo] - ORDEN[z.tipo]);
}
export const contarPorTipo = (evs = [], lista = TIPOS) => evs.reduce((o, e) => ({ ...o, [e.tipo]: (o[e.tipo] || 0) + 1 }), Object.fromEntries(lista.map(([k]) => [k, 0])));
export function porDia(evs = []) { const o = {}; for (const e of evs) (o[e.date] ||= []).push(e); return o; }

// ---------- Cómo se pinta (solo en el navegador) ----------
// ctx: { vista, fecha, eventos (ya filtrados por rol), off (Set de tipos apagados), tipos (los visibles), info, err, ceo, hoy }
// El calendario de una marca usa el mismo: ctx.lista (sus filtros), ctx.botones (en vez de «+ Evento») y ctx.pie (en vez de Google).
// Un evento: un link si lleva a otra pantalla; un botón si abre algo aquí mismo (evento de Google, tarea, hito).
export function itemHtml(e) {
  const { html, raw, esc } = core;
  const cls = `wc-ev t-${e.tipo}${e.late ? ' late' : ''}`, tt = [e.time, e.title, e.sub].filter(Boolean).join(' · ');
  const inner = html`${e.time ? html`<b>${e.time}</b> ` : ''}${e.title}`, st = e.color ? raw(`style="border-left-color:${e.color}"`) : '';
  if (e.go.href) return html`<a class="${cls}" href="${e.go.href}" data-act="go" title="${tt}" ${st}>${inner}</a>`;
  const data = [e.go.id != null && `data-id="${esc(e.go.id)}"`, e.go.i != null && `data-i="${+e.go.i}"`, e.go.d != null && `data-d="${+e.go.d}"`].filter(Boolean).join(' ');
  return html`<button class="${cls}" data-act="${e.go.act}" ${raw(data)} title="${tt}" ${st}>${inner}</button>`;
}
export function calendarioHtml(ctx) {
  const { html, fdate, IC } = core;
  const { vista, fecha, eventos, off, tipos, info, err, ceo, hoy, lista = TIPOS } = ctx;
  const R = rango(vista, fecha), cnt = contarPorTipo(eventos, lista), on = eventos.filter((e) => !off.has(e.tipo)), byDay = porDia(on);
  const label = vista === 'semana' ? `${fdate(R.from)} – ${fdate(R.to)}` : new Date(R.from + 'T12:00').toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase());
  const item = itemHtml;
  const chips = html`<div class="wc-chips" role="group" aria-label="Qué se ve">${lista.filter(([k]) => tipos.includes(k)).map(([k, l]) => html`<button class="wc-chip t-${k} ${off.has(k) ? 'off' : ''}" data-act="ctipo" data-t="${k}" aria-pressed="${off.has(k) ? 'false' : 'true'}"><i></i>${l}<span>${cnt[k] || 0}</span></button>`)}</div>`;
  const head = html`<div class="wc-head"><h3>${label}</h3>
    <div class="seg wc-vista" role="tablist" aria-label="Vista">${[['mes', 'Mes'], ['semana', 'Semana']].map(([k, l]) => html`<button role="tab" class="${vista === k ? 'on' : ''}" aria-selected="${vista === k ? 'true' : 'false'}" data-act="cvista" data-v="${k}">${l}</button>`)}</div>
    <div class="sp"></div><div class="wc-nav"><button class="btn-icon end" data-act="mprev" aria-label="Anterior">‹</button><button class="btn ghost sm" data-act="mtoday">Hoy</button><button class="btn-icon end" data-act="mnext" aria-label="Siguiente">›</button><button class="btn-icon end" data-act="mrefresh" title="Actualizar" aria-label="Actualizar">↻</button>${ctx.botones ?? html`<button class="btn sm" data-act="newEvent">+ Evento</button>`}</div></div>`;
  let grid;
  if (vista === 'semana') {
    grid = html`<div class="wc-week">${R.days.map((d, i) => { const l = byDay[d] || []; return html`<section class="wc-day ${d === hoy ? 'today' : ''} ${i > 4 ? 'we' : ''}" data-act="day" data-date="${d}"><div class="wc-dh"><span>${['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'][i]}</span><b>${+d.slice(8)}</b></div><div class="wc-dl">${l.length ? l.map(item) : html`<span class="wc-none">—</span>`}</div></section>`; })}</div>`;
  } else {
    const lead = (new Date(R.from + 'T12:00:00Z').getUTCDay() + 6) % 7, cells = [];
    for (let i = 0; i < 42; i++) { const n = i - lead + 1; if (i >= 35 && n > R.days.length) break; cells.push(n); }
    grid = html`<div class="cal wc-cal">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => html`<div class="dh">${d}</div>`)}
      ${cells.map((n) => { const d = R.days[n - 1]; if (!d) return html`<div class="d o"></div>`; const l = byDay[d] || [];
        return html`<div class="d ${d === hoy ? 'today' : ''} ${l.length ? 'con' : ''}" data-act="day" data-date="${d}" title="Toca un espacio libre para crear un evento"><span class="n" data-dia="${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date(`${d}T12:00`).getDay()]}">${n}</span>${l.slice(0, 4).map(item)}${l.length > 4 ? html`<button class="wc-more" data-act="dayall" data-date="${d}">+${l.length - 4} más</button>` : ''}</div>`; })}</div>`;
  }
  const foot = ctx.pie !== undefined ? ctx.pie : html`<div class="wc-foot">${err ? html`<span class="chip amber">Google Calendar: ${err}</span>` : html`<span class="gbadge">${IC.cal} ${info?.allCals !== false ? `${(info?.calendars || []).length} calendario${(info?.calendars || []).length === 1 ? '' : 's'} de Google` : 'Solo tu calendario principal · sal y vuelve a entrar para ver todos'}</span>`}
    <button class="chip ${ctx.all ? '' : 'dark'}" data-act="calscope">${ctx.all ? 'Todos mis calendarios' : 'Solo Inherent'}</button>${ceo ? html`<button class="chip" data-act="calpick">Calendario de Inherent</button>` : ''}</div>`;
  return html`<div class="card wc">${head}${chips}${grid}${foot}</div>`;
}
// La lista de un día (el «+N más» del mes).
export const diaHtml = (eventos) => core.html`<div class="wc-daylist">${eventos.map(itemHtml)}</div>`;
// Lo que dice un hito del ciclo.
export const hitoHtml = (d) => { const h = HITOS.find(([x]) => x === +d); return h ? core.html`<h2>Día ${h[0]} · ${h[1]}</h2><p class="mut" style="margin-top:8px">${h[2]}</p>` : ''; };
