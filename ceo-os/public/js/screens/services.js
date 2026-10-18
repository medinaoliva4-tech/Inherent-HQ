// Servicios: el catálogo (qué vendemos, qué incluye, horas y precio por complejidad), el armador de propuesta del CEO,
// el margen por cliente del mes y las cotizaciones. Los movimientos y pagos siguen en #/finanzas (Equipo → Más).
import { svcHours, svcPrice, svcAuto, svcCost } from '../cycle.js';
import { byScope, proposal, targetMargin, LEVELS, PRICING_ID } from '../finscope.js';
import { html, raw, mount, col, api, ask, toast, acts, confirmAsk, Q, fdate, today, $, $$, ico, isSummary, canEdit, roChip, csv } from '../core.js';
import { hbars, PAL } from '../charts.js';

const CATS = ['IA y automatización', 'CRM y ventas', 'Landing y conversión', 'Marketing y publicidad', 'Producción de video', 'Fotografía', 'Email marketing', 'SEO local', 'Analítica y medición', 'UGC y contenido mensual', 'Operación y procesos', 'Otro'];
const QSTATUS = { Borrador: 'amber', Enviada: 'blue', Aceptada: 'green', Rechazada: 'red' };
const total = (q) => (q.items || []).reduce((a, i) => a + (+i.price || 0) * (+i.qty || 0), 0) * (1 - (+q.discount_pct || 0) / 100);
const ym = (d) => String(d || '').slice(0, 7);

export async function render(el, { me, alive }) {
  const S = col('services'), ceo = me.role === 'ceo';
  const resumen = isSummary(me, 'sales'), edit = canEdit(me, 'sales');
  let [services, quotes, rates, pricingDoc, projects, accounts, finance, sheet] = await Promise.all([S.list().catch(() => []), col('quotes').list().catch(() => []), ceo ? col('rates').get('default').catch(() => null) : null,
    ceo ? col('settings').get(PRICING_ID).catch(() => null) : null, ceo ? col('projects').list().catch(() => []) : [], ceo ? col('accounts').list().catch(() => []) : [], ceo ? col('finance').list().catch(() => []) : [], ceo ? api('finance/sheet').catch(() => null) : null]);
  // Los ingresos del mes también salen de la hoja de Google (igual que Finanzas).
  const fromSheet = (sh) => { if (!sh?.csv) return []; const [head = [], ...rows] = csv(sh.csv); const H = head.map((h) => String(h).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()); const ix = (k) => H.findIndex((h) => h.startsWith(k)); const [cF, cT, cM, cL] = ['fecha', 'tipo', 'monto', 'cliente'].map(ix);
    return rows.map((r) => { const n = Number(String(r[cM] ?? '').replace(/[^\d.-]/g, '')), t = String(r[cT] ?? '').toLowerCase(); return { date: String(r[cF] ?? '').slice(0, 10), type: /ingres|entrad|cobr|venta|income/.test(t) ? 'ingreso' : /gast|salid|pag|egres|expense/.test(t) ? 'gasto' : n < 0 ? 'gasto' : 'ingreso', amount: Math.abs(n) || 0, client: String(r[cL] ?? '').trim().toUpperCase() }; }).filter((e) => /^\d{4}-\d{2}/.test(e.date) && e.amount); };
  const entries = [...finance, ...fromSheet(sheet)];
  const M = today().slice(0, 7);
  let showOff = false, prop = [];
  const priceAt = (s, lv) => (ceo && rates && !s.price_fixed && !(s.price && !s.prices) ? svcAuto(s, rates, lv) : null) ?? svcPrice(s, lv);
  const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

  function paint() {
    if (!alive()) return;
    if (resumen) return mount(el, html`<div class="hello"><h1>Servicios</h1><p>Tu perfil ve Comercial <em>en resumen</em>.</p></div><div class="empty"><b>El catálogo y los precios no entran en tu vista</b>Los prospectos y sus seguimientos están en Clientes → cada cliente → Prospectos.</div>`);
    const on = services.filter((s) => s.active !== false), off = services.filter((s) => s.active === false);
    mount(el, html`<div class="hello row" style="align-items:flex-end"><div><h1>Servicios</h1><p>Qué vendemos, <em>a qué precio</em> y cómo va cada cliente.</p></div><div class="sp"></div>${roChip(me, 'sales')}${edit ? html`<button class="btn" data-act="new">+ Servicio</button>` : ''}</div>
      ${ceo ? html`<div class="grid g11" style="margin-bottom:18px;align-items:start"><div id="prop"></div>${marginCard()}</div>` : ''}
      ${!on.length && !off.length ? html`<div class="empty"><b>Sin servicios todavía</b>${edit ? 'Crea el primero con «+ Servicio»: nombre, qué incluye y las horas de cada rol.' : 'El CEO los crea aquí.'}</div>`
      : html`<div class="grid g3">${on.map(card)}</div>
        ${off.length ? html`<div class="row" style="margin-top:14px"><button class="chip" data-act="showOff">${showOff ? 'Ocultar' : 'Ver'} ${off.length} apagado${off.length === 1 ? '' : 's'}</button></div>${showOff ? html`<div class="grid g3" style="margin-top:12px;opacity:.7">${off.map(card)}</div>` : ''}` : ''}`}
      ${quotesTable()}`);
    if (ceo) propBuilder($('#prop', el));
  }
  function card(s) {
    const c = ceo && rates ? svcCost(s, rates, s.level || 5) : null;
    return html`<div class="card wkbox svc ${s.active === false ? 'off' : ''}">
      <div class="row" style="gap:6px;flex-wrap:wrap"><span class="chip sm2">${s.category || 'Sin categoría'}</span><span class="mut sm">por ${s.unit || 'proyecto'}</span><div class="sp"></div>${edit ? html`<button class="sm mut" data-act="edit" data-id="${s.id}" title="Editar">${ico('edit')}</button><button class="sm mut" data-act="toggle" data-id="${s.id}" title="${s.active === false ? 'Encender' : 'Apagar'}">${ico(s.active === false ? 'play' : 'x', 15)}</button>` : ''}</div>
      <h3 style="font-size:17px;font-weight:500;margin:8px 0 2px">${s.name}</h3>
      ${s.description ? html`<div class="mut sm">${s.description}</div>` : ''}
      ${lines(s.includes5).length ? html`<ul class="svinc sm">${lines(s.includes5).slice(0, 5).map((x) => html`<li>${x}</li>`)}</ul>` : html`<div class="mut sm" style="margin-top:6px">Sin «qué incluye» todavía.</div>`}
      <div class="svlv"><span class="lbl">Complejidad</span>${LEVELS.map((lv) => { const p = priceAt(s, lv), h = svcHours(s, lv); return html`<div><b>${lv}</b><span>${h ? h + ' h' : '—'}</span><span class="pr">${p ? Q(p) : html`<span class="mut">—</span>`}</span></div>`; })}</div>
      ${ceo ? html`<div class="mut sm" style="margin-top:6px">${ico('lock', 12)} ${!(s.tasks || []).length ? 'Sin horas por rol: no se puede costear' : !rates ? 'Costo: faltan los costos por hora (Comercial → Catálogo → Costos por hora)' : c?.miss?.length ? `Costo incompleto: falta el costo por hora de ${c.miss.join(', ')}` : `Costo en 5: ${Q(c.cost)}`}${s.price_fixed ? ' · precio fijo' : ''}</div>` : ''}</div>`;
  }
  // Margen por cliente este mes (lo que cuesta entregar sus módulos vs. lo cobrado o cotizado).
  function marginCard() {
    const r = byScope({ month: M, services, rates, projects, quotes, accounts, entries });
    const rows = r.rows.map((x) => ({ label: x.name, pct: x.pct, text: x.pct == null ? (x.income == null ? 'sin ingreso' : 'sin costo') : `${x.pct}% · ${Q(x.margin)}`, c: x.pct == null ? '' : x.pct >= 70 ? PAL.ink : x.pct >= 55 ? PAL.brown : PAL.sand }));
    return html`<div class="card wkbox"><div class="wkhead"><div><h3>${ico('lock', 13)} Margen por cliente · este mes</h3><span class="mut sm">Costo de sus módulos vs. lo cobrado (o cotizado)${r.totals.pct != null ? ` · total ${r.totals.pct}%` : ''}</span></div><a class="sm mut" href="#/finanzas/profit" style="margin-left:auto">Detalle →</a></div>
      ${hbars(rows, { empty: 'Sin datos este mes: aparecen con los proyectos (sus módulos) y los ingresos con cliente en Finanzas.' })}
      ${r.totals.sinDatos ? html`<div class="mut sm" style="margin-top:8px">${ico('alert', 13)} ${r.totals.sinDatos} cliente${r.totals.sinDatos === 1 ? '' : 's'} con datos incompletos (horas, costos por hora o ingreso).</div>` : ''}</div>`;
  }
  // El armador de propuesta: módulos elegidos → costo y precio sugerido = costo ÷ (1 − margen objetivo).
  function propBuilder(b) {
    if (!b) return;
    const on = services.filter((s) => s.active !== false);
    const m = targetMargin(pricingDoc, rates);
    if (!prop.length && on.length) prop = [{ sid: on[0].id, lv: 5, qty: 1 }];
    const r = proposal(prop, services, rates, m);
    const cat = r.rows.reduce((a, x) => { const sv = services.find((y) => y.id === x.sid); const p = sv ? priceAt(sv, x.lv) : null; return p == null || a == null ? null : a + p * x.qty; }, 0);
    mount(b, html`<div class="card wkbox"><div class="wkhead"><div><h3>${ico('lock', 13)} Armar una propuesta</h3><span class="mut sm">Elige módulos y su complejidad: el precio sugerido deja el margen objetivo</span></div><div class="sp"></div>${on.length ? html`<button class="btn ghost xs" data-pact="add">+ Módulo</button>` : ''}</div>
      ${!on.length ? html`<div class="mut sm">Primero crea un servicio.</div>` : html`
      ${r.rows.map((x, i) => html`<div class="row" style="gap:6px;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid var(--line)"><select class="in" data-i="${i}" data-f="sid" style="flex:1;min-width:160px">${on.map((sv) => html`<option value="${sv.id}" ${sv.id === x.sid ? raw('selected') : ''}>${sv.name}</option>`)}</select>
        <select class="in" data-i="${i}" data-f="lv" style="width:auto">${LEVELS.map((lv) => html`<option value="${lv}" ${lv === +x.lv ? raw('selected') : ''}>${lv}</option>`)}</select><input class="in mini" type="number" min="1" data-i="${i}" data-f="qty" value="${x.qty}" style="width:64px">
        <span class="sm" style="min-width:90px;text-align:right">${x.cost == null ? html`<span class="mut" title="${x.why || ''}">sin costo</span>` : html`${x.miss.length ? ico('alert', 12) : ''} ${Q(x.cost)}`}</span><button class="sm mut" data-pact="rm" data-i="${i}">${ico('x', 15)}</button></div>`)}
      <div class="split" style="margin-top:12px"><div><span class="lbl">Precio sugerido</span><b>${r.price == null ? '—' : Q(r.price)}</b></div><div><span class="lbl">Costo</span><b>${r.cost == null ? '—' : Q(r.cost)}</b></div><div><span class="lbl">Margen objetivo</span><b>${m}%</b></div><div><span class="lbl">Catálogo</span><b>${cat ? Q(cat) : '—'}</b></div></div>
      ${!r.complete && r.rows.length ? html`<div class="mut sm" style="margin-top:8px">${ico('alert', 13)} Sin precio sugerido: ${!rates ? 'faltan los costos por hora' : 'a un módulo le faltan horas o costos por hora'}.</div>` : ''}
      <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><input class="in mini" type="number" min="1" max="95" id="pmargin" value="${m}" style="width:80px"><span class="sm">% margen objetivo</span><button class="btn ghost xs" data-pact="margin">Guardar</button><div class="sp"></div><a class="btn xs" href="#/sales/quotes">Cotizar →</a></div>`}</div>`);
    $$('[data-f]', b).forEach((inp) => inp.addEventListener('change', () => { const x = prop[+inp.dataset.i]; x[inp.dataset.f] = inp.dataset.f === 'sid' ? inp.value : Math.max(1, +inp.value || 1); propBuilder(b); }));
    b.onclick = async (e) => { const t = e.target.closest('[data-pact]'); if (!t) return;
      if (t.dataset.pact === 'add') { prop.push({ sid: on[0].id, lv: 5, qty: 1 }); propBuilder(b); }
      if (t.dataset.pact === 'rm') { prop.splice(+t.dataset.i, 1); propBuilder(b); }
      if (t.dataset.pact === 'margin') { const v = +$('#pmargin', b).value; if (!(v >= 1 && v <= 95)) return toast('El margen objetivo va de 1% a 95%', true); try { pricingDoc = pricingDoc ? await col('settings').save({ ...pricingDoc, margin: v }) : await col('settings').create({ id: PRICING_ID, margin: v }); toast('Margen objetivo guardado'); paint(); } catch (err) { toast(err.message, true); } } };
  }
  function quotesTable() {
    const list = [...quotes].sort((a, z) => String(z.date || '').localeCompare(String(a.date || ''))).slice(0, 12);
    return html`<div class="sec-title"><h2>Cotizaciones</h2><span class="mut sm">Las últimas · el flujo completo sigue en Comercial</span><a href="#/sales/quotes">Ver todas →</a></div>
      ${list.length ? html`<div class="card"><table><thead><tr><th>Número</th><th>Cliente</th><th class="n">Monto</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>${list.map((q) => html`<tr class="click" data-act="quote" data-id="${q.id}"><td><b style="font-weight:500">${q.number || '—'}</b></td><td>${q.client || '—'}</td><td class="n">${q.items ? Q(total(q)) : html`<span class="mut">—</span>`}</td><td><span class="chip sm2 ${QSTATUS[q.status] || ''}">${q.status || '—'}</span>${q.payment?.status ? html` <span class="mut sm">· pago ${q.payment.status}</span>` : ''}</td><td class="mut">${q.date ? fdate(q.date) : '—'}</td></tr>`)}</tbody></table></div>`
      : html`<div class="empty"><b>Sin cotizaciones</b>${edit ? html`Se crean en <a href="#/sales/quotes" style="color:inherit">Comercial → Cotizaciones</a>.` : 'Aparecen aquí cuando existan.'}</div>`}`;
  }
  // Crear o editar un servicio: nombre, qué incluye y las horas de cada rol en complejidad 5 y 10 (una línea por rol).
  async function form(s) {
    const roles = (rates?.roles || []).map((r) => r.role);
    const v = await ask(s ? 'Editar servicio' : 'Nuevo servicio', [
      { k: 'name', l: 'Nombre', v: s?.name, req: true },
      { k: 'category', l: 'Categoría', t: 'select', opts: [...new Set([...CATS, s?.category].filter(Boolean))].map((c) => [c, c]), v: s?.category || CATS[0], half: true },
      { k: 'unit', l: 'Se cobra por', t: 'select', opts: [['proyecto', 'Proyecto'], ['mes', 'Mes'], ['pieza', 'Pieza']], v: s?.unit || 'proyecto', half: true },
      { k: 'description', l: 'En una línea', v: s?.description },
      { k: 'includes5', l: 'Qué incluye (complejidad 5) · uno por línea', t: 'textarea', v: s?.includes5 },
      { k: 'includes10', l: 'Qué agrega en complejidad 10 · uno por línea', t: 'textarea', v: s?.includes10 },
      { k: 'tasks', l: `Horas por rol · «Rol: horas en 5 / horas en 10», uno por línea${roles.length ? ` (roles: ${roles.join(', ')})` : ''}`, t: 'textarea', v: (s?.tasks || []).map((t) => `${t.role}: ${t.hours}${t.hours10 != null ? ' / ' + t.hours10 : ''}`).join('\n') },
      { k: 'days5', l: 'Días hábiles (5)', t: 'number', v: s?.days5, half: true }, { k: 'days10', l: 'Días hábiles (10)', t: 'number', v: s?.days10, half: true },
      { k: 'price_fixed', l: 'Precio fijo en Q (vacío = automático por horas × costo × margen)', t: 'number', v: s?.price_fixed ?? null },
    ]);
    if (!v) return;
    const tasks = lines(v.tasks).map((l) => { const m = l.match(/^(.+?)\s*:\s*([\d.]+)\s*(?:\/\s*([\d.]+))?/); return m ? { role: m[1].trim(), hours: +m[2], hours10: m[3] != null ? +m[3] : +m[2] * 2 } : null; }).filter(Boolean);
    const doc = { ...(s || { level: 5, markup: 2.2, active: true }), ...v, tasks, price_fixed: v.price_fixed || null, days5: v.days5 || null, days10: v.days10 || null };
    try { const r = s ? await S.save(doc) : await S.create(doc); services = s ? services.map((x) => (x.id === r.id ? r : x)) : [...services, r]; toast('Guardado'); paint(); } catch (e) { toast(e.message, true); }
  }
  acts(el, {
    new: () => form(null),
    edit: (t) => form(services.find((x) => x.id === t.dataset.id)),
    toggle: async (t) => { const s = services.find((x) => x.id === t.dataset.id); const off = s.active !== false; if (off && !(await confirmAsk(`¿Apagar «${s.name}»? Deja de ofrecerse; lo ya vendido no cambia.`))) return; try { const r = await S.save({ ...s, active: !off }); services = services.map((x) => (x.id === r.id ? r : x)); toast(off ? 'Apagado' : 'Encendido'); paint(); } catch (e) { toast(e.message, true); } },
    showOff: () => { showOff = !showOff; paint(); },
    quote: () => { location.hash = '/sales/quotes'; },
  });
  paint();
}
