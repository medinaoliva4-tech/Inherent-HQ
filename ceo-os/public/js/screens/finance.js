import { svcHours, svcCost, svcPrice, svcAuto } from '../cycle.js';
import { byScope, proposal, targetMargin, LEVELS, PRICING_ID } from '../finscope.js';
import { fit, priceLabel, monthly } from '../mentors.js';
import { facturasTab, costosPorCliente } from '../facturas-ui.js';
import { CATS_IN, CATS_OUT, estadoFactura, cruzar } from '../facturas.js';
import { html, raw, mount, col, api, drawer, closeDrawer, ask, toast, acts, confirmAsk, Q, K, fdate, today, $, $$, IC, matrix, lineChart, csv, connectChip, wizard, swap, ico, isSummary, canEdit, roChip, fromLink } from '../core.js';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const ym = (d) => String(d || '').slice(0, 7);
const mLabel = (m) => `${MONTHS[+m.slice(5) - 1]} ${m.slice(2, 4)}`;
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const planIdOf = (t = '') => (/tailor/i.test(t) ? 'tailor' : /pro\b/i.test(t) ? 'pro' : /accelerate/i.test(t) ? 'accelerate' : /compound/i.test(t) ? 'compound' : /marketing/i.test(t) ? 'marketing' : 'tailor');
const SLOT_OF = { 'Grabación': 'Producción', 'Fotografía': 'Fotografía', 'Edición de video': 'Editor de video', 'Operador de agentes': 'Operador de agentes' };

export async function render(el, { me, sub }) {
  const F = col('finance'), P = col('payroll');
  // Vista por rol: para quien no es CEO, Finance llega hasta «resumen»: los movimientos del mes (ingresos y gastos),
  // sin costos, rentabilidad, precios ni pagos. Esos datos el servidor tampoco los entrega: ni se piden.
  const resumen = isSummary(me, 'finanzas') || me?.role !== 'ceo', edit = canEdit(me, 'finanzas') && me?.role === 'ceo';
  // Todo en paralelo: una sola espera en vez de cinco seguidas.
  let ecoErr = null;
  let [manual, services, rates, eco, clients, payroll, sheet, projects, quotes, accounts, pricingDoc] = await Promise.all([F.list(), resumen ? [] : col('services').list(), resumen ? null : col('rates').get('default').catch(() => null),
    resumen ? null : api('repo/economia').then((r) => (r?.plans?.length ? r : (ecoErr = r?.error || 'El manual ya no trae costos por plan: el precio se arma por alcance', null))).catch((e) => { ecoErr = e.message; return null; }), resumen ? [] : api('repo/clients').then((r) => r.clients).catch(() => []), resumen ? null : P.get('default').catch(() => null),
    api('finance/sheet').catch((e) => ({ error: e.message })),
    // Por alcance: los proyectos y cotizaciones de cada cliente (sus módulos) y el margen objetivo de las propuestas.
    resumen ? [] : col('projects').list().catch(() => []), resumen ? [] : col('quotes').list().catch(() => []), resumen ? [] : col('accounts').list().catch(() => []),
    resumen ? null : col('settings').get(PRICING_ID).catch(() => null)]);
  // Los movimientos salen de la hoja de Google Sheets; los que se agregan a mano aquí se suman.
  const fromSheet = (sh) => {
    if (!sh?.csv) return [];
    const [head = [], ...rows] = csv(sh.csv);
    const H = head.map((h) => String(h).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
    const col_ = (k) => H.findIndex((h) => h.startsWith(k));
    const [cF, cT, cC, cM, cK, cL] = ['fecha', 'tipo', 'concepto', 'monto', 'categ', 'cliente'].map(col_);
    const day = (v) => { v = String(v || '').trim(); let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; return ''; };
    return rows.map((r, i) => {
      const raw_ = Number(String(r[cM] ?? '').replace(/[^\d.-]/g, '')); const t = String(r[cT] ?? '').toLowerCase();
      const type = /ingres|entrad|cobr|venta|income/.test(t) ? 'ingreso' : /gast|salid|pag|egres|expense/.test(t) ? 'gasto' : raw_ < 0 ? 'gasto' : 'ingreso';
      return { id: 'sheet-' + i, sheet: true, date: day(r[cF]), type, concept: String(r[cC] ?? '').trim() || '—', amount: Math.abs(raw_) || 0, category: String(r[cK] ?? '').trim(), client: String(r[cL] ?? '').trim().toUpperCase() };
    }).filter((e) => e.date && e.amount);
  };
  let entries = [...manual, ...fromSheet(sheet)];

  // Facturas: la primera para el CEO. En resumen (el perfil Cobros) llega solo lo por cobrar, después de Movimientos.
  const TABS = resumen ? [['mov', 'Movimientos'], ['fact', 'Facturas']] : [['res', 'Resumen'], ['fact', 'Facturas'], ['mov', 'Movimientos'], ['costs', 'Costos'], ['profit', 'Rentabilidad'], ['pricing', 'Precios'], ['nomina', 'Pagos por servicio']];
  // Las de todos los días arriba; las de vez en cuando, más chicas (y también como tarjetas al final del Resumen).
  const MAS = ['costs', 'profit', 'pricing', 'nomina'];
  let tab = TABS.some(([k]) => k === sub[0]) ? sub[0] : TABS[0][0];
  const now = today().slice(0, 7);
  let month = now;
  const months8 = Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 7 + i); return d.toISOString().slice(0, 7); });
  const sum = (type, m, f = () => true) => entries.filter((e) => e.type === type && ym(e.date) === m && f(e)).reduce((a, e) => a + (+e.amount || 0), 0);

  function paint() {
    const rev = sum('ingreso', month), cost = sum('gasto', month);
    if (tab === 'res') return resumenHtml();
    mount(el, html`
      <div class="hello row" style="align-items:flex-end"><div><h1>Finanzas</h1><p>Cuánto entra, cuánto cuesta, <em>cuánto queda</em>.</p></div><div class="sp"></div>${roChip(me, 'finanzas')}</div>
      <div class="grid g21" ${raw(TABS.some(([k]) => k === 'res') ? 'hidden' : '')}>
        <div class="card">
          <div class="chead"><div class="ico">↗</div><h3>Revenue vs. costo · 8 meses</h3><div class="sp"></div>
            <span class="sm row" style="gap:14px"><span class="row" style="gap:6px"><i style="width:16px;height:2px;background:var(--ui-ink2);display:inline-block"></i>Revenue</span><span class="row" style="gap:6px"><i style="width:16px;height:0;border-top:2px dashed var(--ui-ink2);display:inline-block"></i>Costo</span></span></div>
          ${entries.length ? html`<div class="chart" id="chFin" style="height:240px"></div>` : html`<div class="empty" style="margin-top:20px"><b>Sin movimientos todavía</b>Registra ingresos y gastos en «Movimientos» y aquí aparece la gráfica.</div>`}
        </div>
        <div class="card feat ink">
          <div class="chead"><div class="ico">${IC.ring(78)}<span style="font-size:15px">${ico('target', 16)}</span></div><h3>Revenue<br><span class="lbl">${mLabel(month)}</span></h3></div>
          <div class="big">${rev ? html`<span class="cur">Q</span>${K(rev)}` : '—'}</div>
          <div class="split" style="margin-top:18px"><div><span class="lbl">Gross</span><b>${Q(rev - cost)}</b></div><div><span class="lbl">Cost</span><b>${Q(cost)}</b></div><div><span class="lbl">Margen</span><b style="color:var(--lime)">${rev ? Math.round(((rev - cost) / rev) * 100) + '%' : '—'}</b></div></div>
          ${matrix(rev ? Math.max(2, Math.round(((rev - cost) / rev) * 34)) : 0)}
          <div class="foot"><span>${entries.filter((e) => ym(e.date) === month).length} movimientos</span>
            <select class="in" data-act="month" style="width:auto;padding:6px 10px;background:rgba(253,250,243,.12);color:#fdfaf3;border-color:rgba(253,250,243,.25)">${months8.slice().reverse().map((m) => html`<option value="${m}" ${m === month ? raw('selected') : ''}>${mLabel(m)}</option>`)}</select></div>
        </div>
      </div>
      <div class="row" style="margin:24px 0 18px;flex-wrap:wrap">
        ${tabsHtml()}
        <div class="sp"></div>
        ${tab === 'mov' && edit ? html`${connectChip('sheets', sheet?.url ? 'Google Sheet conectado' : 'Conectar Google Sheet', 'sheet', Boolean(sheet?.url))}${sheet?.url ? html`<button class="sm mut" data-act="sheetset" style="margin:0 6px">Cambiar</button>` : ''}<button class="btn ghost" data-act="add" data-type="gasto">+ Gasto</button><button class="btn" data-act="add" data-type="ingreso">+ Ingreso</button>` : ''}
      </div>
      <div id="fbody"></div>`);
    if ($('#chFin', el)) lineChart($('#chFin', el), months8.map(mLabel), [
      { name: 'Revenue', v: months8.map((m) => sum('ingreso', m)), c: 'var(--ui-ink2)', fill: true },
      { name: 'Costo', v: months8.map((m) => sum('gasto', m)), c: 'var(--ui-ink2)', dash: true }], { fmt: Q });
    $('[data-act=month]', el).onchange = (e) => { month = e.target.value; paint(); };
    const b = $('#fbody', el);
    ({ fact, mov, costs, profit, pricing, nomina, res: () => {} })[tab](b);
  }

  const tabsHtml = () => html`<div class="tabs" style="margin:0">${TABS.filter(([k]) => !MAS.includes(k)).map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>${TABS.some(([k]) => MAS.includes(k)) ? html`<div class="tabs mini fx-mas" style="margin:0">${TABS.filter(([k]) => MAS.includes(k)).map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>` : ''}`;

  // ---------- Resumen (como el tablero de Xero) + el reparto de Profit First ----------
  // El reparto: settings › reparto = { utilidad, impuestos, operacion } en %. De arranque: 40 · 15 · 45 (utilidad sana ~40%).
  // La meta de margen de cada producto: settings › reparto.margen (80%).
  let reparto = null, invs = null, moves = null;
  const REP0 = { utilidad: 40, impuestos: 15, operacion: 45, margen: 80 };
  const rep = () => ({ ...REP0, ...(reparto || {}) });
  async function cargarRes() {
    [reparto, invs, moves] = await Promise.all([col('settings').get('reparto').catch(() => null), col('invoices').list().catch(() => []), col('bank_moves').list().catch(() => [])]);
    if (tab === 'res') resumenHtml();
  }
  function resumenHtml() {
    const T = today(), T7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const rev = sum('ingreso', month), cost = sum('gasto', month), queda = rev - cost;
    const m6 = months8.slice(-6), maxV = Math.max(1, ...m6.flatMap((m) => [sum('ingreso', m), sum('gasto', m)]));
    const iv = invs || [], est = (i) => estadoFactura(i, T);
    const cobrar = iv.filter((i) => i.kind === 'cobrar' && ['pendiente', 'vencida'].includes(est(i))).sort((a, z) => String(a.due).localeCompare(String(z.due)));
    const pagar = iv.filter((i) => i.kind === 'pagar' && ['pendiente', 'vencida'].includes(est(i))).sort((a, z) => String(a.due).localeCompare(String(z.due)));
    const monto = (i) => (i.currency === 'USD' ? (+i.amount || 0) * 7.7 : +i.amount || 0);
    const suma = (l) => l.reduce((a, i) => a + monto(i), 0);
    const venc = cobrar.filter((i) => est(i) === 'vencida'), semana = cobrar.filter((i) => est(i) !== 'vencida' && i.due <= T7), aldia = cobrar.filter((i) => est(i) !== 'vencida' && i.due > T7);
    const tot = suma(cobrar) || 1;
    const pagarSem = pagar.filter((i) => est(i) === 'vencida' || i.due <= T7);
    const quien = (i) => (i.kind === 'cobrar' ? (accounts.find((a) => (a.slug || String(a.id).replace(/^acc-/, '')) === i.client)?.name || String(i.client || '').toUpperCase()) : i.vendor || '—');
    const tel = (i) => String(accounts.find((a) => (a.slug || String(a.id).replace(/^acc-/, '')) === i.client)?.phone || '').replace(/\D/g, '');
    const fila = (i) => html`<div class="fx-li"><span>${quien(i)} <small>· ${i.concept || ''}</small></span><b class="${est(i) === 'vencida' ? 'late' : ''}">${i.currency === 'USD' ? '$' : 'Q'}${(+i.amount || 0).toLocaleString('es-GT')} · ${est(i) === 'vencida' ? 'venció ' : ''}${fdate(i.due)}</b></div>`;
    const sinConc = (moves || []).filter((m) => !m.invoice_id), ultimo = (moves || []).map((m) => m.date).filter(Boolean).sort().at(-1);
    const pares = invs && moves ? cruzar(invs, moves, T).length : 0;
    // El ingreso real (Profit First): lo que entró menos lo que es de terceros (la pauta que paga el cliente).
    const terceros = sum('gasto', month, (e) => e.category === 'Pauta'), real = Math.max(0, rev - terceros), R = rep();
    const parte = (k) => Math.round((real * (+R[k] || 0)) / 100), opGasto = cost - terceros;
    const scope = byScope({ month, services, rates, projects, quotes, accounts, entries }).rows.filter((x) => x.pct != null).sort((a, z) => z.pct - a.pct);
    const tono = (pct) => (pct >= R.margen ? '#2f7a4d' : pct >= R.margen - 20 ? '#c49a3c' : '#b4472f');
    const recordar = venc[0] || semana[0];
    mount(el, html`<div class="hello row" style="align-items:flex-end"><div><h1>Finanzas</h1><p>Cuánto entra, cuánto cuesta, <em>cuánto queda</em>.</p></div><div class="sp"></div>${roChip(me, 'finanzas')}</div>
      <div class="row" style="margin:0 0 16px;flex-wrap:wrap;gap:8px">${tabsHtml()}<div class="sp"></div><select class="in" data-act="month" style="width:auto" aria-label="Mes">${months8.slice().reverse().map((m) => html`<option value="${m}" ${m === month ? raw('selected') : ''}>${mLabel(m)}</option>`)}</select></div>
      <div class="fx">
        <section class="card fx-hero"><div class="fx-queda"><span class="lbl">Lo que queda en ${mLabel(month)}</span><b class="${queda < 0 ? 'late' : ''}">${rev || cost ? Q(queda) : '—'}</b>${rev || cost ? '' : html`<span class="mut sm" style="display:block;margin-top:4px">Sale de los movimientos del mes: facturas pagadas y gastos anotados.</span>`}
            <div class="fx-tres"><div><small>Entró</small><b class="ok">${rev ? Q(rev) : '—'}</b></div><div><small>Salió</small><b class="bad">${cost ? Q(cost) : '—'}</b></div><div><small>Margen</small><b>${rev ? Math.round((queda / rev) * 100) + '%' : '—'}</b></div></div></div>
          <div><div class="row fx-leg"><span class="lbl" style="margin:0">Entra y sale · 6 meses</span><div class="sp"></div><span><i class="ent"></i>Entra</span><span><i class="sal"></i>Sale</span></div>
            <div class="fx-bars">${m6.map((m) => html`<div class="fx-m ${m === month ? 'on' : ''}" title="${mLabel(m)} · entra ${Q(sum('ingreso', m))} · sale ${Q(sum('gasto', m))}"><div class="fx-b"><i class="ent" style="height:${(sum('ingreso', m) / maxV) * 100}%"></i><i class="sal" style="height:${(sum('gasto', m) / maxV) * 100}%"></i></div><span>${mLabel(m).split(' ')[0]}</span></div>`)}</div></div></section>
        <div class="fx-row3">
          <section class="card fx-card"><div class="row"><span class="lbl">Te deben</span><div class="sp"></div><button class="sm wslink" data-act="tab" data-t="fact">Ver todo ›</button></div>
            ${invs === null ? html`<p class="mut sm">Cargando…</p>` : html`<b class="fx-big">${cobrar.length ? Q(suma(cobrar)) : '—'}</b><small class="mut">${cobrar.length ? `${cobrar.length} factura${cobrar.length === 1 ? '' : 's'}` : 'Nadie te debe · las facturas por cobrar salen de aquí'}${venc.length ? ` · ${venc.length} vencida${venc.length === 1 ? '' : 's'}` : ''}</small>
            ${cobrar.length ? html`<div class="fx-age"><i style="width:${(suma(aldia) / tot) * 100}%;background:#2f7a4d"></i><i style="width:${(suma(semana) / tot) * 100}%;background:#c49a3c"></i><i style="width:${(suma(venc) / tot) * 100}%;background:#b4472f"></i></div><div class="fx-agel"><span><i style="background:#2f7a4d"></i>Al día</span><span><i style="background:#c49a3c"></i>Vence esta semana</span><span><i style="background:#b4472f"></i>Vencida</span></div>` : ''}
            ${cobrar.slice(0, 3).map(fila)}
            <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:4px"><button class="btn xs" data-act="tab" data-t="fact">Generar cobros del mes</button>${recordar && tel(recordar) ? html`<a class="btn ghost xs" target="_blank" rel="noopener" href="https://wa.me/${tel(recordar)}?text=${encodeURIComponent(`Hola, ¿cómo estás? Te escribo de Inherent por la factura de ${recordar.concept || 'este mes'} (${recordar.currency === 'USD' ? '$' : 'Q'}${(+recordar.amount || 0).toLocaleString('es-GT')}) que ${est(recordar) === 'vencida' ? 'venció' : 'vence'} el ${fdate(recordar.due)}. Cualquier cosa me dices. ¡Gracias!`)}">✆ Recordar a ${quien(recordar)}</a>` : ''}</div>`}</section>
          <section class="card fx-card"><div class="row"><span class="lbl">Por pagar</span><div class="sp"></div><button class="sm wslink" data-act="tab" data-t="fact">Ver todo ›</button></div>
            ${invs === null ? html`<p class="mut sm">Cargando…</p>` : html`<b class="fx-big">${pagarSem.length ? Q(suma(pagarSem)) : '—'}</b><small class="mut">${pagarSem.length ? `esta semana · ${pagarSem.length} factura${pagarSem.length === 1 ? '' : 's'}` : 'Nada por pagar esta semana'}${pagar.length > pagarSem.length ? ` · ${pagar.length - pagarSem.length} más adelante` : ''}</small>
            ${pagarSem.slice(0, 3).map(fila)}
            <div class="row" style="gap:6px;margin-top:4px"><button class="btn ghost xs" data-act="tab" data-t="fact">+ Por pagar</button></div>`}</section>
          <section class="card fx-card"><div class="row"><span class="lbl">Banco</span><div class="sp"></div><button class="sm wslink" data-act="tab" data-t="fact">Cruce ›</button></div>
            ${moves === null ? html`<p class="mut sm">Cargando…</p>` : html`<b class="fx-big">${(moves || []).length ? `${sinConc.length}` : '—'}</b><small class="mut">${(moves || []).length ? `movimientos sin conciliar · último del ${fdate(ultimo)}` : 'Todavía no se ha subido un estado de cuenta'}</small>
            ${pares ? html`<div class="fx-li"><span>Pagos que empatan con una factura</span><b class="ok">${pares}</b></div>` : ''}
            <div class="row" style="margin-top:4px"><button class="btn xs" data-act="tab" data-t="fact">↑ Subir estado de cuenta</button></div>`}</section>
        </div>
        <div class="fx-row2">
          <section class="card fx-card"><div class="row"><span class="lbl">El reparto · Profit First</span><div class="sp"></div><button class="sm wslink" data-act="repEdit">Ajustar % ›</button></div>
            <div class="fx-li" style="border:0;padding-top:0"><span>Entró ${rev ? Q(rev) : '—'} − terceros ${terceros ? Q(terceros) : '—'} <small>(la pauta del cliente)</small></span><b>Ingreso real ${real ? Q(real) : '—'}</b></div>
            <div class="fx-split"><span style="width:${R.utilidad}%;background:#2f7a4d">Utilidad ${R.utilidad}%</span><span style="width:${R.impuestos}%;background:#9a7414">Impuestos ${R.impuestos}%</span><span style="width:${R.operacion}%;background:var(--ui-ink2)">Operación ${R.operacion}%</span></div>
            <div class="fx-sl"><div><small>Utilidad</small><b>${real ? Q(parte('utilidad')) : '—'}</b></div><div><small>Impuestos</small><b>${real ? Q(parte('impuestos')) : '—'}</b></div><div><small>Operación</small><b>${real ? Q(parte('operacion')) : '—'}</b></div><div><small>Gastaste en operación</small><b class="${opGasto > parte('operacion') ? 'bad' : 'ok'}">${opGasto ? Q(opGasto) : '—'} ${!real && !opGasto ? '' : opGasto > parte('operacion') ? '↑' : '✓'}</b></div></div>
            <span class="mut sm">El CEO y el COO cobran de la utilidad. Meta: utilidad sana de ~${R.utilidad}% y margen de ${R.margen}% en cada producto.</span></section>
          <section class="card fx-card"><div class="row"><span class="lbl">Rentabilidad por cliente · ${mLabel(month)}</span><div class="sp"></div><button class="sm wslink" data-act="tab" data-t="profit">Ver todo ›</button></div>
            ${scope.length ? scope.slice(0, 6).map((x) => html`<div class="fx-rc"><b>${x.name}</b><div class="fx-rb"><i style="width:${Math.max(2, Math.min(100, x.pct))}%;background:${tono(x.pct)}"></i></div><span style="color:${tono(x.pct)}">${x.pct}%</span></div>`) : html`<p class="mut sm">Sin datos de alcance este mes: aparecen los clientes con módulos y su ingreso.</p>`}
            <span class="mut sm">Meta: ${R.margen}% de margen en cada producto. En ámbar hasta 20 puntos abajo; en rojo, más abajo: se cotiza extra o se cambia la mezcla.</span></section>
        </div>
        <div class="fx-more">${[['costs', '◫', '#9a7414', 'Costos', 'Por rubro y por rol'], ['pricing', '$', '#3f6ea8', 'Precios', 'Baselines y servicios'], ['nomina', '⇄', '#7a5aa0', 'Pagos por servicio', 'Lo que se paga a cada rol']].map(([k, ic, c, t, sb]) => html`<button type="button" class="fx-mi" data-act="tab" data-t="${k}"><i style="background:${c}1f;color:${c}">${ic}</i><span><b>${t}</b><small>${sb}</small></span></button>`)}</div>
      </div>`);
    $('[data-act=month]', el).onchange = (e) => { month = e.target.value; resumenHtml(); };
    if (invs === null) cargarRes();
  }
  async function editarReparto() {
    const R = rep();
    const v = await ask('El reparto (Profit First)', [{ k: 'utilidad', l: 'Utilidad %', t: 'number', v: R.utilidad, half: true }, { k: 'impuestos', l: 'Impuestos %', t: 'number', v: R.impuestos, half: true }, { k: 'operacion', l: 'Operación %', t: 'number', v: R.operacion, half: true }, { k: 'margen', l: 'Meta de margen por producto %', t: 'number', v: R.margen, half: true }]);
    if (!v) return;
    const n = { utilidad: +v.utilidad, impuestos: +v.impuestos, operacion: +v.operacion, margen: +v.margen };
    if (n.utilidad + n.impuestos + n.operacion !== 100) return toast('Utilidad + impuestos + operación tienen que sumar 100%', true);
    try { reparto = reparto?.v ? await col('settings').save({ ...reparto, ...n }) : await col('settings').create({ id: 'reparto', ...n }); toast('Reparto guardado'); resumenHtml(); } catch (e) { toast(e.message, true); }
  }

  // ---------- Facturas: por cobrar, por pagar y el cruce con el banco (facturas-ui.js) ----------
  // Lo que se registra solo al marcar una factura pagada (ingreso o gasto) entra a los movimientos sin recargar.
  let openInv = null; // la factura que se abre al llegar desde el enlace de un movimiento
  const onMov = (m) => { manual = [...manual.filter((x) => x.id !== m.id), m]; entries = [...manual, ...fromSheet(sheet)]; };
  const goInv = (id) => { closeDrawer(); tab = 'fact'; openInv = id; history.replaceState(null, '', '#/finanzas/fact'); swap(el, paint); };
  function fact(b) { const open = openInv; openInv = null; facturasTab(b, { me, clients, movs: manual, onMov, open }); }

  // ---------- Movimientos ----------
  function mov(b) {
    const list = entries.filter((e) => ym(e.date) === month).sort((x, y) => String(y.date).localeCompare(String(x.date)));
    const note = sheet?.error ? html`<div class="warnbox" style="margin-bottom:12px">Google Sheet: ${sheet.error}</div>`
      : !sheet?.url && edit ? html`<div class="mut sm" style="margin-bottom:12px">${ico('bulb')} Conecta tu Google Sheet (arriba) y los movimientos entran solos. Columnas: fecha, tipo, concepto, monto, categoría y cliente.</div>` : '';
    mount(b, !list.length ? html`${note}<div class="empty"><b>Sin movimientos en ${mLabel(month)}</b>${sheet?.url ? 'Agrega filas a tu hoja de Google Sheets y recarga.' : 'Conecta tu Google Sheet o registra un ingreso o gasto.'}</div>`
      : html`${note}<div class="card"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Cliente</th><th>Categoría</th><th class="n">Monto</th></tr></thead><tbody>
        ${list.map((e) => html`<tr class="click" data-act="${e.sheet ? 'sheet' : 'edit'}" data-id="${e.id}"><td class="mut">${fdate(e.date)}</td><td><b style="font-weight:500">${e.concept}</b>${e.sheet ? html` <span class="mut sm">· Sheet</span>` : ''}${e.source === 'auto' ? html` <span class="chip sm2">auto</span>${e.invoice_id && !resumen ? html` <a class="sm mov-inv" data-act="inv" data-id="${e.invoice_id}">factura</a>` : ''}` : ''}</td><td>${e.client || '—'}</td><td><span class="chip">${e.category || '—'}</span></td>
          <td class="n"><b style="color:${e.type === 'ingreso' ? 'var(--ui-ink2)' : 'var(--ui-ink2)'}">${e.type === 'ingreso' ? '+' : '−'}${Q(e.amount)}</b></td></tr>`)}
      </tbody></table></div>`);
  }
  async function editEntry(e, type) {
    type = e?.type || type;
    const clientNames = [...new Set([...clients.map((c) => c.slug.toUpperCase()), ...entries.map((x) => x.client).filter(Boolean)])];
    const v = await ask(`${e ? 'Editar' : 'Nuevo'} ${type}`, [
      { k: 'concept', l: 'Concepto', v: e?.concept, req: true },
      { k: 'amount', l: 'Monto (Q)', t: 'number', v: e?.amount, req: true, half: true }, { k: 'date', l: 'Fecha', t: 'date', v: e?.date || today(), req: true, half: true },
      { k: 'category', l: 'Categoría', t: 'select', opts: type === 'ingreso' ? CATS_IN : CATS_OUT, v: e?.category, half: true },
      { k: 'client', l: 'Cliente (opcional)', t: 'select', opts: [['', '—'], ...clientNames.map((c) => [c, c])], v: e?.client || '', half: true },
    ]);
    if (!v) return;
    try {
      const r = e ? await F.save({ ...e, ...v }) : await F.create({ ...v, type });
      entries = e ? entries.map((x) => (x.id === r.id ? r : x)) : [...entries, r]; manual = entries.filter((x) => !x.sheet);
      month = ym(r.date); toast('Guardado'); paint();
    } catch (err) { toast(err.message, true); }
  }

  // ---------- Costos: cada servicio del catálogo en sus 4 complejidades (horas por rol × costo por hora) ----------
  function costs(b) {
    const cell = (sv, lv) => { const c = svcCost(sv, rates, lv), h = svcHours(sv, lv);
      return html`<td class="n">${!(sv.tasks || []).length ? html`<span class="mut sm">sin horas</span>` : !c ? '—' : c.miss.length ? html`<span title="Faltan costos por hora: ${c.miss.join(', ')}">${ico('alert')} ${Q(c.cost)}</span>` : html`<b style="font-weight:500">${Q(c.cost)}</b>`}<div class="mut sm">${h} h</div></td>`; };
    mount(b, html`
      <div id="recCost" style="margin-bottom:24px"></div>
      <div class="mut sm" style="margin-bottom:12px">${ico('lock')} Lo que cuesta entregar cada módulo según su complejidad. Las horas por rol salen del catálogo (Servicios → Servicios) y el costo por hora de «Costos por hora». El costo de cada cliente es la suma de sus módulos: ver «Rentabilidad».</div>
      ${!rates ? html`<div class="warnbox" style="margin-bottom:14px">Sin costos por hora todavía: el costo de cada módulo vendrá de Servicios → Servicios → Costos por hora.</div>` : ''}
      ${!services.length ? html`<div class="empty"><b>Sin servicios</b>Los módulos del catálogo de Comercial aparecen aquí con su costo en cada complejidad.</div>`
      : html`<div class="card tscroll"><table><thead><tr><th>Servicio</th><th>Equipo</th>${LEVELS.map((lv) => html`<th class="n">Complejidad ${lv}</th>`)}<th class="n">Precio (5)</th></tr></thead><tbody>
        ${services.map((sv) => html`<tr><td><b style="font-weight:500">${sv.name}</b><div class="mut sm">${sv.category || ''} · por ${sv.unit || 'proyecto'}</div></td><td>${(sv.tasks || []).map((t) => html`<span class="chip" style="margin:2px">${t.role}</span>`)}</td>${LEVELS.map((lv) => cell(sv, lv))}<td class="n">${(() => { const pr = svcAuto(sv, rates, 5) ?? svcPrice(sv, 5); return pr ? Q(pr) : '—'; })()}</td></tr>`)}
      </tbody></table></div>`}<div id="espCost"></div>`);
    espCosts($('#espCost', b));
    costosPorCliente($('#recCost', b), { services, rates, projects, quotes, accounts, clients, edit });
  }

  // Los especialistas asignados a cada cliente: cuánto cuestan al mes y si van como add-on.
  async function espCosts(box) {
    const [accs, ms] = await Promise.all([col('accounts').list().catch(() => []), col('mentors').list().catch(() => [])]);
    const rows = accs.flatMap((a) => (a.mentors || []).map((x) => ({ a, x, m: ms.find((y) => y.id === x.id) }))).filter((r) => r.m);
    if (!box.isConnected) return;
    mount(box, html`<div class="sec-title"><h2>Especialistas por cliente</h2><span class="mut sm">USD · las membresías son de Inherent y no se cargan por cliente</span></div>
      ${rows.length ? html`<div class="card"><table><thead><tr><th>Cliente</th><th>Especialista</th><th>Precio</th><th>Cadencia</th><th class="n">≈ al mes</th><th>Dónde cae</th></tr></thead><tbody>
        ${rows.map(({ a, x, m }) => { const [f, c] = fit(m); return html`<tr><td><b style="font-weight:500">${a.name}</b></td><td>${m.name}<div class="mut sm">${m.industry}</div></td><td>${priceLabel(m)}</td><td class="mut">${x.cadence}</td><td class="n"><b>${monthly(m, x.cadence) ? '$' + monthly(m, x.cadence) : '—'}</b></td><td><span class="chip ${c}" style="font-size:11px">${f}</span></td></tr>`; })}
        <tr><td colspan="4"><b>Total</b></td><td class="n"><b>$${rows.reduce((t, r) => t + monthly(r.m, r.x.cadence), 0)}</b></td><td></td></tr></tbody></table></div>`
      : html`<div class="mut sm">Ningún cliente tiene especialista asignado. Se asigna en Clientes → el cliente → Especialista.</div>`}`);
  }

  // ---------- Rentabilidad por alcance: por cliente, costo de sus módulos vs. lo cotizado o cobrado ----------
  function profit(b) {
    const r = byScope({ month, services, rates, projects, quotes, accounts, entries }), t = r.totals;
    const money = (v) => (v == null ? html`<span class="mut">—</span>` : Q(v));
    const kpi = [['Ingreso', t.income == null ? '—' : Q(t.income)], ['Costo de módulos', t.cost == null ? '—' : Q(t.cost)], ['Margen', t.margin == null ? '—' : Q(t.margin)], ['Margen %', t.pct == null ? '—' : t.pct + '%']];
    mount(b, html`
      <div class="mut sm" style="margin-bottom:12px">${ico('lock')} <b>${mLabel(month)}</b> · Costo = la suma de los módulos de cada cliente (servicio × complejidad del catálogo). Ingreso = lo cobrado en movimientos con ese cliente o, si no hay, lo cotizado y aceptado. Los módulos por mes caen cada mes activo; los demás, el mes en que arranca el proyecto.
        <div class="row" style="gap:6px;margin-top:6px">${fromLink({ label: 'catálogo', href: '#/services/servicios', title: 'Servicios → Servicios: horas y precio de cada módulo' })}${fromLink({ label: 'costos por hora', href: '#/services/servicios', title: 'Servicios → Servicios → Costos por hora' })}${fromLink({ label: 'cotizaciones', href: '#/sales/quotes' })}</div></div>
      <div class="grid g4" style="margin-bottom:16px">${kpi.map(([l, v]) => html`<div class="card glass"><span class="mut sm">${l}</span><div class="big" style="font-size:38px">${v}</div></div>`)}</div>
      ${r.rows.length ? html`<div class="card tscroll"><table><thead><tr><th>Cliente</th><th>Módulos</th><th class="n">Costo</th><th class="n">Cotizado</th><th class="n">Cobrado</th><th class="n">Margen</th><th style="width:22%">%</th></tr></thead><tbody>
        ${r.rows.map((x) => html`<tr class="click" data-act="scope" data-k="${x.slug}"><td><b style="font-weight:500">${x.name}</b>${x.need.length ? html`<div class="mut sm">${ico('alert')} ${x.need.length === 1 ? 'Falta un dato' : `Faltan ${x.need.length} datos`}</div>` : ''}</td>
          <td>${x.modules.length ? html`<span class="chip">${x.modules.length} módulo${x.modules.length === 1 ? '' : 's'}</span>` : html`<span class="mut sm">sin módulos</span>`}</td>
          <td class="n">${x.cost == null ? html`<span class="mut">—</span>` : html`${x.partial ? ico('alert') : ''} ${Q(x.cost)}`}</td><td class="n">${money(x.quoted)}</td><td class="n">${money(x.received)}</td>
          <td class="n"><b>${money(x.margin)}</b></td>
          <td>${x.pct == null ? html`<span class="mut sm">${x.income == null ? 'sin ingreso' : 'sin costo'}</span>` : html`<div class="row"><div style="flex:1;height:8px;border-radius:99px;background:var(--fill)"><div style="width:${Math.max(0, Math.min(100, x.pct))}%;height:100%;border-radius:99px;background:${x.pct >= 70 ? 'var(--ui-ink2)' : x.pct >= 55 ? 'var(--ui-ink2)' : 'var(--ui-ink2)'}"></div></div><span class="sm" style="width:40px;text-align:right">${x.pct}%</span></div>`}</td></tr>`)}
        <tr><td colspan="2"><b>Total del mes</b></td><td class="n"><b>${money(t.cost)}</b></td><td class="n"><b>${money(t.quoted)}</b></td><td class="n"><b>${money(t.received)}</b></td><td class="n"><b>${money(t.margin)}</b></td><td>${t.pct == null ? '' : html`<b>${t.pct}%</b>`}</td></tr>
      </tbody></table></div>
      ${t.unassigned ? html`<div class="mut sm" style="margin-top:8px">${ico('bulb')} ${Q(t.unassigned)} de ingresos del mes no tienen cliente: asígnalo en «Movimientos» para que cuente en su fila.</div>` : ''}`
      : html`<div class="empty"><b>Sin datos de alcance en ${mLabel(month)}</b>Aparecen aquí los clientes con proyectos o cotizaciones aceptadas (sus módulos del catálogo) y los ingresos con cliente en «Movimientos».</div>`}
      ${clients.some((c) => c.costo != null) ? html`<div class="sec-title"><h2>Costo declarado en la ficha</h2><span class="mut sm">De clients/*/plan-contratado.md</span></div>
        <div class="card"><table><thead><tr><th>Cliente</th><th>Alcance</th><th class="n">Precio</th><th class="n">${ico('lock')} Costo</th></tr></thead><tbody>${clients.filter((c) => c.hasPlan).map((c) => html`<tr><td><b style="font-weight:500">${c.slug.toUpperCase()}</b></td><td class="mut">${c.plan}</td><td class="n">${c.precio != null ? Q(c.precio) : '—'}</td><td class="n">${c.costo != null ? Q(c.costo) : '—'}</td></tr>`)}</tbody></table></div>` : ''}`);
    b.onclick = (e) => { const tr = e.target.closest('[data-act=scope]'); if (!tr) return; const x = r.rows.find((y) => y.slug === tr.dataset.k); if (x) scopeDrawer(x); };
  }
  function scopeDrawer(x) {
    drawer(html`<div class="row"><span class="chip dark">${mLabel(month)}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>${x.name}</h2>
      <div class="kv"><span>Costo</span><b style="font-weight:500">${x.cost == null ? '—' : Q(x.cost)}${x.partial ? ' (incompleto)' : ''}</b><span>Ingreso</span><b style="font-weight:500">${x.income == null ? '—' : `${Q(x.income)} · ${x.incomeFrom === 'movimientos' ? 'cobrado' : 'cotizado'}`}</b><span>Margen</span><b style="font-weight:500">${x.margin == null ? '—' : `${Q(x.margin)}${x.pct != null ? ` · ${x.pct}%` : ''}`}</b>${x.spent != null ? html`<span>Gastos con su nombre</span><b style="font-weight:500">${Q(x.spent)}</b>` : ''}</div>
      ${x.modules.length ? html`<table><thead><tr><th>Módulo</th><th class="n">Nivel</th><th class="n">Costo</th><th class="n">Precio</th></tr></thead><tbody>${x.modules.map((m) => html`<tr><td>${m.name}${m.qty > 1 ? ` ×${m.qty}` : ''}<div class="mut sm">${m.from} · por ${m.unit}</div>${m.why ? html`<div class="mut sm">${m.why}</div>` : ''}</td><td class="n">${m.level}</td><td class="n">${m.cost == null ? '—' : html`${m.miss.length ? ico('alert') : ''} ${Q(m.cost)}`}</td><td class="n">${m.price == null ? '—' : Q(m.price)}</td></tr>`)}</tbody></table>` : ''}
      ${x.need.length ? html`<div class="warnbox" style="margin-top:12px">${x.need.map((n) => html`<div class="sm">${n}</div>`)}</div>` : ''}`);
  }

  // ---------- Precios: una propuesta = los módulos elegidos; precio sugerido = costo ÷ (1 − margen objetivo) ----------
  let prop = [];
  function pricing(b) {
    const m = targetMargin(pricingDoc, rates);
    if (!prop.length && services.length) prop = [{ sid: services[0].id, lv: 5, qty: 1 }];
    const r = proposal(prop, services, rates, m);
    const catalogPrice = r.rows.reduce((a, x) => { const sv = services.find((y) => y.id === x.sid); const p = sv ? svcAuto(sv, rates, x.lv) ?? svcPrice(sv, x.lv) : null; return p == null || a == null ? null : a + p * x.qty; }, 0);
    mount(b, html`
      <div class="mut sm" style="margin-bottom:12px">${ico('lock')} Arma una propuesta con los módulos del catálogo. Su costo es la suma de cada servicio en su complejidad; el precio sugerido deja el margen objetivo. ${fromLink({ label: 'catálogo', href: '#/services/servicios' })} ${fromLink({ label: 'costos por hora', href: '#/services/servicios' })}</div>
      ${!services.length ? html`<div class="empty"><b>Sin servicios</b>Primero carga el catálogo en Servicios → Servicios.</div>` : html`
      <div class="grid g21">
        <div class="card"><div class="row" style="margin-bottom:10px"><b class="ttl" style="font-size:16px">Módulos de la propuesta</b><div class="sp"></div><button class="btn ghost xs" data-pact="add">+ Módulo</button></div>
          <table><thead><tr><th>Servicio</th><th>Complejidad</th><th class="n">Cantidad</th><th class="n">Horas</th><th class="n">Costo</th><th></th></tr></thead><tbody>
          ${r.rows.map((x, i) => html`<tr><td><select class="in" data-i="${i}" data-f="sid">${services.map((sv) => html`<option value="${sv.id}" ${sv.id === x.sid ? raw('selected') : ''}>${sv.name}</option>`)}</select><div class="mut sm">por ${x.unit}${x.why ? ' · ' + x.why : ''}</div></td>
            <td><select class="in" data-i="${i}" data-f="lv">${LEVELS.map((lv) => html`<option value="${lv}" ${lv === +x.lv ? raw('selected') : ''}>${lv}</option>`)}</select></td>
            <td class="n"><input class="in mini" type="number" min="1" data-i="${i}" data-f="qty" value="${x.qty}"></td><td class="n">${x.hours == null ? '—' : x.hours + ' h'}</td>
            <td class="n">${x.cost == null ? '—' : html`${x.miss.length ? html`<span title="Faltan costos por hora: ${x.miss.join(', ')}">${ico('alert')}</span>` : ''} ${Q(x.cost)}`}</td><td><button class="btn ghost" data-pact="rm" data-i="${i}" style="padding:6px 10px">${ico('x', 16)}</button></td></tr>`)}
          </tbody></table></div>
        <div class="card feat ink"><div class="lbl">Precio sugerido</div><div class="big" style="font-size:44px;margin-top:6px">${r.price == null ? '—' : Q(r.price)}</div>
          <div class="split" style="margin-top:16px"><div><span class="lbl">Costo</span><b>${r.cost == null ? '—' : Q(r.cost)}</b></div><div><span class="lbl">Margen objetivo</span><b>${m}%</b></div><div><span class="lbl">Catálogo</span><b>${catalogPrice ? Q(catalogPrice) : '—'}</b></div></div>
          ${!r.complete && r.rows.length ? html`<div class="sm" style="margin-top:12px;opacity:.85">${ico('alert')} Sin precio sugerido: ${!rates ? 'faltan los costos por hora (Servicios → Servicios → Costos por hora)' : 'a un módulo le faltan horas o costos por hora'}.</div>` : ''}
          ${catalogPrice && r.cost ? html`<div class="sm" style="margin-top:8px;opacity:.85">Al precio del catálogo el margen sería ${Math.round((1 - r.cost / catalogPrice) * 100)}%.</div>` : ''}
          ${edit ? html`<div class="row" style="margin-top:16px;gap:8px"><input class="in mini" type="number" min="1" max="95" id="pmargin" value="${m}" style="max-width:90px"><span>%</span><button class="btn cream xs" data-pact="margin">Guardar margen objetivo</button></div>` : ''}</div>
      </div>`}`);
    $$('[data-f]', b).forEach((inp) => inp.addEventListener('change', () => { const x = prop[+inp.dataset.i]; x[inp.dataset.f] = inp.dataset.f === 'sid' ? inp.value : Math.max(1, +inp.value || 1); pricing(b); }));
    b.onclick = async (e) => {
      const t = e.target.closest('[data-pact]'); if (!t) return;
      if (t.dataset.pact === 'add') { prop.push({ sid: services[0].id, lv: 5, qty: 1 }); pricing(b); }
      if (t.dataset.pact === 'rm') { prop.splice(+t.dataset.i, 1); pricing(b); }
      if (t.dataset.pact === 'margin') {
        const v = +$('#pmargin', b).value; if (!(v >= 1 && v <= 95)) return toast('El margen objetivo va de 1% a 95%', true);
        try { pricingDoc = pricingDoc ? await col('settings').save({ ...pricingDoc, margin: v }) : await col('settings').create({ id: PRICING_ID, margin: v }); toast('Margen objetivo guardado'); pricing(b); }
        catch (err) { toast(err.message, true); }
      }
    };
  }

  // ---------- Pagos por servicio (no hay nómina): el mes de cada persona = Σ (lo que cada cuenta paga a su rol × su % del rol) ----------
  function nomina(b) {
    if (!eco) return mount(b, html`<div class="warnbox">Los pagos por servicio usan los rubros del manual y no pude leerlo: ${ecoErr || 'sin datos'}</div>`);
    const plans = eco.plans;
    const rubros = [...new Set(plans.flatMap((p) => p.rubros.map((r) => r.label)))].filter((r) => !/buffer/i.test(r));
    let d = payroll ? JSON.parse(JSON.stringify(payroll)) : null;
    let seeded = false;
    if (!d) {
      seeded = true; d = { personas: [], reparto: {}, cuentas: [] };
      for (const r of rubros) {
        const nombre = (eco.slots || []).find((s) => s.slot.startsWith(SLOT_OF[r] || '§'))?.hoy.replace(/\s*\(.*\)/, '').trim();
        if (!nombre) continue;
        const id = slug(nombre);
        if (!d.personas.find((p) => p.id === id)) d.personas.push({ id, nombre });
        d.reparto[r] = [{ p: id, pct: 100 }];
      }
      const groups = new Map();
      for (const c of clients.filter((x) => x.hasPlan)) { const pid = planIdOf(c.plan); const key = pid === 'tailor' && c.costo != null ? `t:${c.costo}` : `s:${c.slug}`; (groups.get(key) || groups.set(key, []).get(key)).push({ c, pid }); }
      for (const g of groups.values()) d.cuentas.push({ id: slug(g.map((x) => x.c.slug).join('-')), nombre: g.map((x) => x.c.slug.toUpperCase()).join(' + '), planId: g[0].pid, costoDeclarado: g[0].c.costo ?? null, montos: {} });
    }
    const base = (c, r) => c.montos?.[r] ?? plans.find((p) => p.id === c.planId)?.rubros.find((x) => x.label === r)?.monto;
    const compute = () => {
      const pay = Object.fromEntries(d.personas.map((p) => [p.id, 0])), det = Object.fromEntries(d.personas.map((p) => [p.id, []])), pool = {}, sin = [], falta = [];
      for (const c of d.cuentas) for (const r of rubros) {
        const m = base(c, r);
        if (m == null) { falta.push(`${c.nombre} · ${r}`); continue; }
        if (!m) continue;
        pool[r] = (pool[r] || 0) + m;
        const split = d.reparto[r] || []; const tot = split.reduce((a, s) => a + (+s.pct || 0), 0);
        if (Math.abs(tot - 100) > 0.01) sin.push(`${c.nombre} · ${r}: ${tot}%`);
        for (const s of split) if (pay[s.p] != null) { const q = (m * (+s.pct || 0)) / 100; pay[s.p] += q; det[s.p].push({ c: c.nombre, r, q }); }
      }
      return { pay, det, pool, sin, falta };
    };
    const draw = () => {
      const { pay, det, pool, sin, falta } = compute();
      const total = Object.values(pay).reduce((a, x) => a + x, 0), poolT = Object.values(pool).reduce((a, x) => a + x, 0);
      mount(b, html`
        ${seeded ? html`<div class="warnbox" style="margin-bottom:14px">Borrador sembrado del manual (ocupantes de cada rol) y de los clientes del repo. Revísalo y dale «Guardar».</div>` : ''}
        <div class="grid g4">
          <div class="card glass"><span class="mut sm">Pagos del mes</span><div class="big" style="font-size:40px">${Q(total)}</div></div>
          <div class="card glass"><span class="mut sm">Pool de rubros</span><div class="big" style="font-size:40px">${Q(poolT)}</div></div>
          <div class="card glass"><span class="mut sm">Roles sin repartir al 100%</span><div class="big" style="font-size:40px;color:${sin.length ? 'var(--ui-ink2)' : 'inherit'}">${sin.length}</div></div>
          <div class="card glass"><span class="mut sm">Montos sin datos</span><div class="big" style="font-size:40px;color:${falta.length ? 'var(--ui-ink2)' : 'inherit'}">${falta.length}</div></div>
        </div>
        <div class="sec-title"><h2>El mes de cada persona</h2><button class="btn ghost" data-act="addP" style="margin-left:auto">+ Persona</button></div>
        <div class="grid g3">${d.personas.map((p) => html`<div class="card"><div class="row"><b style="font-weight:500;font-size:16px">${p.nombre}</b><div class="sp"></div><button class="btn ghost" data-act="rmP" data-id="${p.id}" style="padding:6px 10px">${ico('x', 16)}</button></div>
          <div class="big" style="font-size:40px;margin-top:6px">${Q(pay[p.id])}</div><div class="mut sm">${total ? Math.round((pay[p.id] / total) * 100) : 0}% de los pagos del mes</div>
          <div class="chips">${Object.entries(d.reparto).filter(([, v]) => v.some((s) => s.p === p.id)).map(([r, v]) => html`<span class="chip">${r} ${v.find((s) => s.p === p.id).pct}%</span>`)}</div>
          ${det[p.id].length ? html`<details style="margin-top:10px"><summary class="sm mut">De dónde sale</summary><table><tbody>${det[p.id].map((x) => html`<tr><td class="sm">${x.c}</td><td class="sm mut">${x.r}</td><td class="n sm">${Q(x.q)}</td></tr>`)}</tbody></table></details>` : ''}</div>`)}</div>
        <div class="sec-title"><h2>Reparto por rol</h2><span class="mut sm">% del rubro entre personas · se define una vez</span></div>
        <div class="grid g3">${rubros.map((r) => { const sp = d.reparto[r] || []; const tot = sp.reduce((a, s) => a + (+s.pct || 0), 0); return html`<div class="card"><div class="row"><b style="font-weight:500">${r}</b><div class="sp"></div><span class="chip ${!sp.length ? '' : Math.abs(tot - 100) < 0.01 ? 'green' : 'amber'}">${sp.length ? tot + '%' : 'sin nadie'}</span></div>
          <div class="mut sm" style="margin:4px 0 10px">pool ${Q(pool[r] || 0)}</div>
          ${sp.map((s, i) => html`<div class="row" style="margin-bottom:6px"><select class="in" data-r="${r}" data-i="${i}" data-f="p">${d.personas.map((p) => html`<option value="${p.id}" ${p.id === s.p ? raw('selected') : ''}>${p.nombre}</option>`)}</select><input class="in" type="number" style="max-width:80px" data-r="${r}" data-i="${i}" data-f="pct" value="${s.pct}"><span class="mut">%</span><button class="btn ghost" data-act="rmS" data-r="${r}" data-i="${i}" style="padding:6px 10px">${ico('x', 16)}</button></div>`)}
          <button class="btn ghost" data-act="addS" data-r="${r}" style="padding:6px 12px">+ Persona</button></div>`; })}</div>
        <div class="sec-title"><h2>Cuentas</h2><span class="mut sm">Lo que cada cuenta paga a cada rol. Gris = del manual; Tailor Made: escríbelo tú</span><button class="btn ghost" data-act="addC" style="margin-left:auto">+ Cuenta</button></div>
        <div class="card tscroll"><table><thead><tr><th>Cuenta</th><th>Plan</th>${rubros.map((r) => html`<th class="n">${r.replace(/\s*\(.*\)/, '')}</th>`)}<th></th></tr></thead><tbody>
          ${d.cuentas.map((c, ci) => html`<tr><td><b style="font-weight:500">${c.nombre}</b>${c.costoDeclarado != null ? html`<div class="mut sm">${ico('lock')} declarado ${Q(c.costoDeclarado)}</div>` : ''}</td>
            <td><select class="in" data-c="${ci}" data-f="plan">${[...plans.map((p) => [p.id, p.name]), ['tailor', 'TAILOR MADE']].map(([v, l]) => html`<option value="${v}" ${v === c.planId ? raw('selected') : ''}>${l}</option>`)}</select></td>
            ${rubros.map((r) => { const pm = plans.find((p) => p.id === c.planId)?.rubros.find((x) => x.label === r)?.monto; return html`<td class="n"><input class="in mini" type="number" data-c="${ci}" data-r="${r}" data-f="monto" value="${c.montos?.[r] ?? ''}" placeholder="${pm ?? 'Q'}"></td>`; })}
            <td><button class="btn ghost" data-act="rmC" data-i="${ci}" style="padding:6px 10px">${ico('x', 16)}</button></td></tr>`)}
        </tbody></table></div>
        ${falta.length ? html`<div class="warnbox" style="margin-top:12px">${ico('alert')} SIN DATOS — falta el monto: ${falta.slice(0, 8).join(' · ')}${falta.length > 8 ? ' …' : ''}</div>` : ''}
        <div class="row" style="margin-top:16px"><button class="btn" data-act="saveN">Guardar pagos</button></div>`);
      $$('[data-f]', b).forEach((inp) => inp.addEventListener('change', () => {
        const f = inp.dataset.f;
        if (f === 'p' || f === 'pct') { const s = d.reparto[inp.dataset.r][+inp.dataset.i]; s[f] = f === 'pct' ? +inp.value : inp.value; }
        if (f === 'plan') d.cuentas[+inp.dataset.c].planId = inp.value;
        if (f === 'monto') { const c = d.cuentas[+inp.dataset.c]; c.montos ||= {}; if (inp.value === '') delete c.montos[inp.dataset.r]; else c.montos[inp.dataset.r] = +inp.value; }
        setTimeout(draw, 0);
      }));
    };
    b.onclick = async (e) => {
      const t = e.target.closest('[data-act]'); if (!t) return;
      const a = t.dataset.act;
      if (a === 'addS') { (d.reparto[t.dataset.r] ||= []).push({ p: d.personas[0]?.id, pct: 0 }); draw(); }
      if (a === 'rmS') { d.reparto[t.dataset.r].splice(+t.dataset.i, 1); draw(); }
      if (a === 'addP') { const v = await ask('Agregar persona', [{ k: 'nombre', l: 'Nombre', req: true }]); if (v) { d.personas.push({ id: slug(v.nombre) || String(Date.now()), nombre: v.nombre }); draw(); } }
      if (a === 'rmP') { d.personas = d.personas.filter((p) => p.id !== t.dataset.id); Object.values(d.reparto).forEach((sp) => sp.splice(0, sp.length, ...sp.filter((s) => s.p !== t.dataset.id))); draw(); }
      if (a === 'addC') { const v = await ask('Agregar cuenta', [{ k: 'nombre', l: 'Cliente(s)', req: true }, { k: 'planId', l: 'Plan', t: 'select', opts: [...plans.map((p) => [p.id, p.name]), ['tailor', 'TAILOR MADE']] }]); if (v) { d.cuentas.push({ id: slug(v.nombre), nombre: v.nombre, planId: v.planId, montos: {} }); draw(); } }
      if (a === 'rmC') { d.cuentas.splice(+t.dataset.i, 1); draw(); }
      if (a === 'saveN') {
        try { payroll = payroll ? await P.save({ ...payroll, ...d }) : await P.create({ id: 'default', ...d }); seeded = false; d = JSON.parse(JSON.stringify(payroll)); toast('Pagos guardados'); draw(); }
        catch (err) { toast(err.message, true); }
      }
    };
    draw();
  }

  async function connectSheet() {
    const a = await wizard('Movimientos desde Google Sheets', [
      { k: 'how', q: '¿De dónde salen tus movimientos?', type: 'cards', req: true, opts: [{ v: 'new', i: ico('spark'), l: 'Crear una hoja nueva', d: 'Con las columnas listas, en tu Drive' }, { v: 'link', i: ico('link'), l: 'Ya tengo una hoja', d: 'Pega el link' }] },
      { k: 'url', q: 'Pega el link de la hoja', sub: 'Columnas: fecha · tipo (ingreso/gasto) · concepto · monto · categoría · cliente', type: 'text', req: true, ph: 'https://docs.google.com/spreadsheets/d/…', show: (x) => x.how === 'link', v: sheet?.url },
    ], 'Conectar');
    if (!a) return;
    try {
      const r = a.how === 'new' ? await api('finance/sheet', { method: 'POST' }) : await api('finance/sheet', { method: 'PUT', body: { url: a.url } });
      if (a.how === 'new') window.open(r.url, '_blank', 'noopener');
      sheet = await api('finance/sheet').catch((e) => ({ url: r.url, error: e.message }));
      entries = [...manual, ...fromSheet(sheet)]; toast('Google Sheet conectado'); paint();
    } catch (e) { toast(e.message, true); }
  }
  acts(el, {
    tab: (t) => { tab = t.dataset.t; history.replaceState(null, '', '#/finanzas/' + tab); swap(el, paint); },
    repEdit: () => editarReparto(),
    inv: (t) => goInv(t.dataset.id),
    add: (t) => editEntry(null, t.dataset.type),
    sheet: async () => { if (sheet?.url) return window.open(sheet.url, '_blank', 'noopener'); connectSheet(); },
    sheetset: () => connectSheet(),
    edit: async (t) => {
      const e = entries.find((x) => x.id === t.dataset.id);
      drawer(html`<div class="row"><span class="chip ${e.type === 'ingreso' ? 'green' : 'red'}">${e.type}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
        <h2>${e.concept}</h2><div class="big" style="font-size:44px;margin-top:10px">${Q(e.amount)}</div>
        <div class="kv"><span>Fecha</span><b style="font-weight:500">${fdate(e.date)}</b><span>Categoría</span><b style="font-weight:500">${e.category || '—'}</b><span>Cliente</span><b style="font-weight:500">${e.client || '—'}</b>${e.source === 'auto' ? html`<span>Origen</span><b style="font-weight:500">Registrado solo, al pagarse su factura</b>` : ''}</div>
        ${e.invoice_id && !resumen ? html`<button class="btn ghost" data-act="inv" data-id="${e.invoice_id}" style="margin-bottom:10px">${ico('doc')} Ver factura</button>` : ''}
        ${edit ? html`<div class="row"><button class="btn" data-act="ed">Editar</button><button class="btn ghost" data-act="del">Eliminar</button></div>` : ''}`,
      { inv: (t) => goInv(t.dataset.id), ed: () => { closeDrawer(); editEntry(e); }, del: async () => { if (!(await confirmAsk('¿Eliminar este movimiento?'))) return; await F.remove(e.id); entries = entries.filter((x) => x.id !== e.id); manual = entries.filter((x) => !x.sheet); closeDrawer(); paint(); } });
    },
  });
  paint();
}
