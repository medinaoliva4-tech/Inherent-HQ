import { paraPocket } from '../pocket.js';
import { svcHours, svcCost, svcPrice, svcAuto } from '../cycle.js';
import { byScope, proposal, targetMargin, LEVELS, PRICING_ID } from '../finscope.js';
import { fit, priceLabel, monthly } from '../mentors.js';
import { facturasTab, costosPorCliente } from '../facturas-ui.js';
import { CATS_IN, CATS_OUT, estadoFactura, cruzar } from '../facturas.js';
import { html, raw, mount, col, api, drawer, closeDrawer, ask, toast, acts, confirmAsk, Q, fdate, today, $, $$, lineChart, csv, connectChip, wizard, swap, ico, isSummary, canEdit, roChip, fromLink } from '../core.js';
import { vacio } from '../visual.js';
import { tabla } from '../tabla.js';
import { listaHtml } from '../lista.js';
import { cifrasHtml } from '../cifras.js';

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
  const TODAS = resumen ? [['mov', 'Movimientos'], ['fact', 'Facturas']] : [['res', 'Resumen'], ['fact', 'Facturas'], ['mov', 'Movimientos'], ['costs', 'Costos'], ['profit', 'Rentabilidad'], ['pricing', 'Precios'], ['nomina', 'Pagos por servicio']];
  // Las de todos los días arriba; las de vez en cuando, más chicas (y también como tarjetas al final del Resumen).
  const TABS = paraPocket(TODAS, ([k]) => `org/finanzas/${k}`);
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
      <div class="row" style="margin:0 0 18px;flex-wrap:wrap;gap:8px">
        ${tabsHtml()}
        <div class="sp"></div>${monthSel()}
        ${tab === 'mov' && edit ? html`${connectChip('sheets', sheet?.url ? 'Google Sheet conectado' : 'Conectar Google Sheet', 'sheet', Boolean(sheet?.url))}${sheet?.url ? html`<button class="sm mut" data-act="sheetset" style="margin:0 6px">Cambiar</button>` : ''}<button class="btn ghost" data-act="add" data-type="gasto">+ Gasto</button><button class="btn" data-act="add" data-type="ingreso">+ Ingreso</button>` : ''}
      </div>
      ${TABS.some(([k]) => k === 'res') ? '' : html`${cifrasHtml([
        { t: `Entró · ${mLabel(month)}`, v: rev ? Q(rev) : '—', serie: months8.map((m) => sum('ingreso', m)) },
        { t: 'Salió', v: cost ? Q(cost) : '—', serie: months8.map((m) => sum('gasto', m)) },
        { t: 'Queda', v: rev || cost ? Q(rev - cost) : '—', tono: rev - cost < 0 ? 'bad' : '' },
        { t: 'Margen', v: rev ? Math.round(((rev - cost) / rev) * 100) + '%' : '—', nota: `${entries.filter((e) => ym(e.date) === month).length} movimientos` }], { etiqueta: `Finanzas de ${mLabel(month)}` })}
      ${entries.length ? html`<section class="vpp-sec"><div class="vpp-h"><h2>Revenue vs. costo · 8 meses</h2><span class="vpp-sp"></span>
          <span class="sm row" style="gap:14px"><span class="row" style="gap:6px"><i style="width:16px;height:2px;background:var(--ui-ink2);display:inline-block"></i>Revenue</span><span class="row" style="gap:6px"><i style="width:16px;height:0;border-top:2px dashed var(--ui-ink2);display:inline-block"></i>Costo</span></span></div>
        <div class="chart" id="chFin" style="height:220px"></div></section>` : ''}`}
      <div id="fbody"></div>`);
    if ($('#chFin', el)) lineChart($('#chFin', el), months8.map(mLabel), [
      { name: 'Revenue', v: months8.map((m) => sum('ingreso', m)), c: 'var(--ui-ink2)', fill: true },
      { name: 'Costo', v: months8.map((m) => sum('gasto', m)), c: 'var(--ui-ink2)', dash: true }], { fmt: Q });
    $('[data-act=month]', el).onchange = (e) => { month = e.target.value; paint(); };
    const b = $('#fbody', el);
    ({ fact, mov, costs, profit, pricing, nomina, res: () => {} })[tab](b);
  }

  const monthSel = () => html`<select class="in" data-act="month" style="width:auto" aria-label="Mes">${months8.slice().reverse().map((m) => html`<option value="${m}" ${m === month ? raw('selected') : ''}>${mLabel(m)}</option>`)}</select>`;
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
    // Cada factura, un renglón: estado · quién · concepto · vence · monto. Tocarlo abre Facturas.
    const renglon = (i) => ({ estado: est(i) === 'vencida' ? { tono: 'caido', texto: 'Vencida' } : i.due <= T7 ? { tono: 'medio' } : { tono: 'off' }, titulo: quien(i), sub: i.concept || '', fecha: `${est(i) === 'vencida' ? 'venció ' : ''}${fdate(i.due)}`, fechaTono: est(i) === 'vencida' ? 'late' : '', extra: html`<b>${i.currency === 'USD' ? '$' : 'Q'}${(+i.amount || 0).toLocaleString('es-GT')}</b>`, act: 'tab', data: { t: 'fact' } });
    const mi = months8.indexOf(month), prev = mi > 0 ? months8[mi - 1] : null;
    const delta = (a, b) => (prev && b ? ((a - b) / Math.abs(b)) * 100 : null);
    const sinConc = (moves || []).filter((m) => !m.invoice_id), ultimo = (moves || []).map((m) => m.date).filter(Boolean).sort().at(-1);
    const pares = invs && moves ? cruzar(invs, moves, T).length : 0;
    // El ingreso real (Profit First): lo que entró menos lo que es de terceros (la pauta que paga el cliente).
    const terceros = sum('gasto', month, (e) => e.category === 'Pauta'), real = Math.max(0, rev - terceros), R = rep();
    const parte = (k) => Math.round((real * (+R[k] || 0)) / 100), opGasto = cost - terceros;
    const scope = byScope({ month, services, rates, projects, quotes, accounts, entries }).rows.filter((x) => x.pct != null).sort((a, z) => z.pct - a.pct);
    const tono = (pct) => (pct >= R.margen ? 'var(--ui-ok)' : pct >= R.margen - 20 ? 'var(--ui-amb-f)' : 'var(--ui-bad)');
    const recordar = venc[0] || semana[0];
    mount(el, html`<div class="hello row" style="align-items:flex-end"><div><h1>Finanzas</h1><p>Cuánto entra, cuánto cuesta, <em>cuánto queda</em>.</p></div><div class="sp"></div>${roChip(me, 'finanzas')}</div>
      <div class="row" style="margin:0 0 16px;flex-wrap:wrap;gap:8px">${tabsHtml()}<div class="sp"></div>${monthSel()}</div>
      ${cifrasHtml([
        { t: `Queda en ${mLabel(month)}`, v: rev || cost ? Q(queda) : '—', tono: queda < 0 ? 'bad' : '', delta: { v: delta(queda, prev && sum('ingreso', prev) - sum('gasto', prev)), texto: 'vs. mes anterior' }, ayuda: 'Sale de los movimientos del mes: facturas pagadas y gastos anotados.' },
        { t: 'Entró', v: rev ? Q(rev) : '—', tono: rev ? 'ok' : '', delta: { v: delta(rev, prev && sum('ingreso', prev)) }, serie: m6.map((m) => sum('ingreso', m)) },
        { t: 'Salió', v: cost ? Q(cost) : '—', delta: { v: delta(cost, prev && sum('gasto', prev)), bueno: 'baja' }, serie: m6.map((m) => sum('gasto', m)) },
        { t: 'Margen', v: rev ? Math.round((queda / rev) * 100) + '%' : '—' }], { etiqueta: `Finanzas de ${mLabel(month)}` })}
      <section class="vpp-sec"><div class="vpp-h"><h2>Entra y sale · 6 meses</h2><span class="vpp-sp"></span><span class="row fx-leg" style="margin:0"><span><i class="ent"></i>Entra</span><span><i class="sal"></i>Sale</span></span></div>
        <div class="fx-bars" role="img" aria-label="Entra y sale de los últimos 6 meses">${m6.map((m) => html`<div class="fx-m ${m === month ? 'on' : ''}" title="${mLabel(m)} · entra ${Q(sum('ingreso', m))} · sale ${Q(sum('gasto', m))}"><div class="fx-b"><i class="ent" style="height:${(sum('ingreso', m) / maxV) * 100}%"></i><i class="sal" style="height:${(sum('gasto', m) / maxV) * 100}%"></i></div><span>${mLabel(m).split(' ')[0]}</span></div>`)}</div></section>
      <div class="vpp-cols">
        <section class="vpp-sec"><div class="vpp-h"><h2>Te deben</h2><span class="vpp-n">${cobrar.length ? `${Q(suma(cobrar))} · ${cobrar.length}` : ''}</span><span class="vpp-sp"></span><button class="sm wslink" data-act="tab" data-t="fact">Ver todo ›</button></div>
          ${invs === null ? html`<p class="mut sm">Cargando…</p>` : html`${cobrar.length ? html`<div class="fx-age" style="margin:4px 0 6px" title="Al día · vence esta semana · vencida"><i style="width:${(suma(aldia) / tot) * 100}%;background:var(--ui-ok)"></i><i style="width:${(suma(semana) / tot) * 100}%;background:var(--ui-amb-f)"></i><i style="width:${(suma(venc) / tot) * 100}%;background:var(--ui-bad)"></i></div>` : ''}
            ${listaHtml({ etiqueta: 'Facturas por cobrar', items: cobrar, renglon, max: 5, vacio: { titulo: 'Nadie te debe', linea: 'Las facturas por cobrar aparecen aquí.' } })}
            <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" data-act="tab" data-t="fact">Generar cobros del mes</button>${recordar && tel(recordar) ? html`<a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/${tel(recordar)}?text=${encodeURIComponent(`Hola, ¿cómo estás? Te escribo de Inherent por la factura de ${recordar.concept || 'este mes'} (${recordar.currency === 'USD' ? '$' : 'Q'}${(+recordar.amount || 0).toLocaleString('es-GT')}) que ${est(recordar) === 'vencida' ? 'venció' : 'vence'} el ${fdate(recordar.due)}. Cualquier cosa me dices. ¡Gracias!`)}">${ico('phone', 14)} Recordar a ${quien(recordar)}</a>` : ''}</div>`}</section>
        <section class="vpp-sec"><div class="vpp-h"><h2>Por pagar</h2><span class="vpp-n">${pagarSem.length ? `${Q(suma(pagarSem))} esta semana` : ''}</span><span class="vpp-sp"></span><button class="sm wslink" data-act="tab" data-t="fact">Ver todo ›</button></div>
          ${invs === null ? html`<p class="mut sm">Cargando…</p>` : html`${listaHtml({ etiqueta: 'Facturas por pagar esta semana', items: pagarSem, renglon, max: 5, vacio: { titulo: 'Nada por pagar esta semana', linea: pagar.length ? `${pagar.length} más adelante.` : 'Las facturas por pagar aparecen aquí.' } })}
            ${pagarSem.length && pagar.length > pagarSem.length ? html`<p class="mut sm" style="margin:6px 0 0">${pagar.length - pagarSem.length} más adelante</p>` : ''}
            <div class="row" style="gap:6px;margin-top:10px"><button class="btn ghost sm" data-act="tab" data-t="fact">+ Por pagar</button></div>`}</section>
        <section class="vpp-sec"><div class="vpp-h"><h2>Banco</h2><span class="vpp-sp"></span><button class="sm wslink" data-act="tab" data-t="fact">Cruce ›</button></div>
          ${moves === null ? html`<p class="mut sm">Cargando…</p>` : (moves || []).length ? html`${listaHtml({ etiqueta: 'Banco', items: [['Sin conciliar', sinConc.length, sinConc.length ? 'medio' : 'vivo'], ['Empatan con una factura', pares, 'info'], ['Último movimiento', fdate(ultimo), 'off']], renglon: ([t, v, tono]) => ({ estado: { tono }, titulo: t, extra: html`<b>${v}</b>` }) })}`
            : html`${vacio({ compacto: true, icono: 'inbox', titulo: 'Sin estado de cuenta', linea: 'Súbelo para cruzar pagos con facturas.' })}`}
          ${moves === null ? '' : html`<div class="row" style="margin-top:10px"><button class="btn sm" data-act="tab" data-t="fact">↑ Subir estado de cuenta</button></div>`}</section>
      </div>
      <div class="vpp-cols" style="--vpp-c:2">
        <section class="vpp-sec"><div class="vpp-h"><h2>El reparto · Profit First</h2><span class="vpp-sp"></span><button class="sm wslink" data-act="repEdit">Ajustar % ›</button></div>
          <div class="fx-li" style="border:0;padding-top:0"><span>Entró ${rev ? Q(rev) : '—'} − terceros ${terceros ? Q(terceros) : '—'} <small title="La pauta que paga el cliente">(pauta)</small></span><b>Ingreso real ${real ? Q(real) : '—'}</b></div>
          <div class="fx-split" style="margin:6px 0 12px"><span style="width:${R.utilidad}%;background:var(--ui-ok)">Utilidad ${R.utilidad}%</span><span style="width:${R.impuestos}%;background:var(--ui-amb)">Impuestos ${R.impuestos}%</span><span style="width:${R.operacion}%;background:var(--ui-ink2)">Operación ${R.operacion}%</span></div>
          ${cifrasHtml([{ t: 'Utilidad', v: real ? Q(parte('utilidad')) : '—' }, { t: 'Impuestos', v: real ? Q(parte('impuestos')) : '—' }, { t: 'Operación', v: real ? Q(parte('operacion')) : '—' }, { t: 'Gastaste en operación', v: opGasto ? Q(opGasto) : '—', tono: !real && !opGasto ? '' : opGasto > parte('operacion') ? 'bad' : 'ok', nota: !real && !opGasto ? '' : opGasto > parte('operacion') ? 'arriba de lo repartido' : 'dentro de lo repartido' }], { etiqueta: 'El reparto del mes', clase: 'cfr-s' })}
          <details class="vpp-ayuda"><summary>Cómo se reparte</summary>El CEO y el COO cobran de la utilidad. Meta: utilidad sana de ~${R.utilidad}% y margen de ${R.margen}% en cada producto.</details></section>
        <section class="vpp-sec"><div class="vpp-h"><h2>Rentabilidad por cliente</h2><span class="vpp-n">${mLabel(month)}</span><span class="vpp-sp"></span><button class="sm wslink" data-act="tab" data-t="profit">Ver todo ›</button></div>
          ${scope.length ? scope.slice(0, 6).map((x) => html`<div class="fx-rc"><b>${x.name}</b><div class="fx-rb"><i style="width:${Math.max(2, Math.min(100, x.pct))}%;background:${tono(x.pct)}"></i></div><span style="color:${tono(x.pct)}">${x.pct}%</span></div>`) : html`${vacio({ compacto: true, icono: 'inbox', titulo: 'Sin datos de alcance este mes', linea: 'Aparecen los clientes con módulos y su ingreso.' })}`}
          <details class="vpp-ayuda"><summary>Cómo se lee</summary>Meta: ${R.margen}% de margen en cada producto. En ámbar hasta 20 puntos abajo; en rojo, más abajo: se cotiza extra o se cambia la mezcla.</details></section>
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
    mount(b, html`${note}<div id="tMov"></div>`);
    // Tabla densa: la fila abre el movimiento (o la hoja, si viene de Google Sheets); editar va como acción de la fila.
    const firmado = (e) => (e.type === 'ingreso' ? 1 : -1) * (+e.amount || 0);
    tabla($('#tMov', b), {
      etiqueta: `Movimientos de ${mLabel(month)}`, filas: list, orden: { k: 'date', dir: 'desc' },
      vacio: { icono: 'inbox', titulo: `Sin movimientos en ${mLabel(month)}`, linea: sheet?.url ? 'Agrega filas a tu hoja de Google Sheets y recarga.' : 'Conecta tu Google Sheet o registra un ingreso o gasto.' },
      cols: [
        { k: 'concept', t: 'Concepto', orden: true, celda: (e) => html`<b>${e.concept}</b>${e.sheet ? html` <span class="mut sm">· Sheet</span>` : ''}${e.source === 'auto' ? html` <span class="chip sm2" title="Registrado solo, al pagarse su factura">auto</span>${e.invoice_id && !resumen ? html` <a class="sm mov-inv" data-act="inv" data-id="${e.invoice_id}">factura</a>` : ''}` : ''}` },
        { k: 'date', t: 'Fecha', orden: true, celda: (e) => fdate(e.date) },
        { k: 'client', t: 'Cliente', orden: true, celda: (e) => e.client || '—' },
        { k: 'category', t: 'Categoría', orden: true, celda: (e) => html`<span class="chip">${e.category || '—'}</span>` },
        { k: 'amount', t: 'Monto', num: true, orden: firmado, celda: (e) => html`<b class="${e.type === 'ingreso' ? 'mov-in' : 'mov-out'}">${e.type === 'ingreso' ? '+' : '−'}${Q(e.amount)}</b>` },
      ],
      pie: (fs) => [html`<b>Neto del mes</b>`, '', '', '', Q(fs.reduce((a, e) => a + firmado(e), 0))],
      abrir: (e) => (e.sheet ? (sheet?.url ? window.open(sheet.url, '_blank', 'noopener') : connectSheet()) : verMov(e.id)),
      acciones: edit ? (e) => (e.sheet ? [] : [{ t: 'Editar', ico: 'edit', fn: () => editEntry(e) }]) : null,
    });
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
      return html`${!(sv.tasks || []).length ? html`<span class="mut sm">sin horas</span>` : !c ? '—' : c.miss.length ? html`<span title="Faltan costos por hora: ${c.miss.join(', ')}">${ico('alert')} ${Q(c.cost)}</span>` : html`<b style="font-weight:500">${Q(c.cost)}</b>`}<small>${h} h</small>`; };
    const precio5 = (sv) => svcAuto(sv, rates, 5) ?? svcPrice(sv, 5);
    mount(b, html`
      <div id="recCost" style="margin-bottom:24px"></div>
      <section class="vpp-sec"><div class="vpp-h"><h2>${ico('lock')} Costo por módulo</h2><span class="vpp-n">${services.length}</span></div>
        <details class="vpp-ayuda"><summary>De dónde sale</summary>Lo que cuesta entregar cada módulo según su complejidad. Las horas por rol salen del catálogo (Servicios → Servicios) y el costo por hora de «Costos por hora». El costo de cada cliente es la suma de sus módulos: ver «Rentabilidad».</details>
        ${!rates ? html`<div class="warnbox" style="margin-bottom:14px">Sin costos por hora todavía: el costo de cada módulo vendrá de Servicios → Servicios → Costos por hora.</div>` : ''}
        <div id="tCost"></div></section><div id="espCost"></div>`);
    tabla($('#tCost', b), {
      etiqueta: 'Costo de cada módulo por complejidad', filas: services, clase: 'tdn-ancha',
      vacio: { icono: 'inbox', titulo: 'Sin servicios', linea: 'Los módulos del catálogo aparecen aquí con su costo en cada complejidad.' },
      cols: [
        { k: 'name', t: 'Servicio', orden: true, celda: (sv) => html`<b>${sv.name}</b><small>${sv.category || ''} · por ${sv.unit || 'proyecto'}</small>` },
        { k: 'tasks', t: 'Equipo', movil: 'oculta', celda: (sv) => (sv.tasks || []).map((t) => t.role).join(' · ') || '—' },
        ...LEVELS.map((lv) => ({ k: 'c' + lv, t: `Complejidad ${lv}`, num: true, orden: (sv) => svcCost(sv, rates, lv)?.cost ?? null, celda: (sv) => cell(sv, lv) })),
        { k: 'p5', t: 'Precio (5)', num: true, orden: precio5, celda: (sv) => (precio5(sv) ? Q(precio5(sv)) : '—') },
      ],
    });
    espCosts($('#espCost', b));
    costosPorCliente($('#recCost', b), { services, rates, projects, quotes, accounts, clients, edit });
  }

  // Los especialistas asignados a cada cliente: cuánto cuestan al mes y si van como add-on.
  async function espCosts(box) {
    const [accs, ms] = await Promise.all([col('accounts').list().catch(() => []), col('mentors').list().catch(() => [])]);
    const rows = accs.flatMap((a) => (a.mentors || []).map((x, i) => ({ id: `${a.id}-${x.id}-${i}`, a, x, m: ms.find((y) => y.id === x.id) }))).filter((r) => r.m);
    if (!box.isConnected) return;
    mount(box, html`<section class="vpp-sec"><div class="vpp-h"><h2>Especialistas por cliente</h2><span class="vpp-sp"></span><span class="vpp-n" title="Las membresías son de Inherent y no se cargan por cliente">USD</span></div><div id="tEsp"></div></section>`);
    tabla($('#tEsp', box), {
      etiqueta: 'Especialistas por cliente', filas: rows,
      vacio: { icono: 'inbox', titulo: 'Sin especialistas asignados', linea: 'Se asignan en Clientes → el cliente → Especialista.' },
      cols: [
        { k: 'cliente', t: 'Cliente', orden: (r) => r.a.name, celda: (r) => html`<b>${r.a.name}</b>` },
        { k: 'esp', t: 'Especialista', orden: (r) => r.m.name, celda: (r) => html`${r.m.name}<small>${r.m.industry}</small>` },
        { k: 'precio', t: 'Precio', celda: (r) => priceLabel(r.m) },
        { k: 'cad', t: 'Cadencia', orden: (r) => r.x.cadence, celda: (r) => r.x.cadence },
        { k: 'mes', t: '≈ al mes', num: true, orden: (r) => monthly(r.m, r.x.cadence) || null, celda: (r) => html`<b>${monthly(r.m, r.x.cadence) ? '$' + monthly(r.m, r.x.cadence) : '—'}</b>` },
        { k: 'fit', t: 'Dónde cae', celda: (r) => { const [f, c] = fit(r.m); return html`<span class="chip ${c}">${f}</span>`; } },
      ],
      pie: (fs) => [html`<b>Total</b>`, '', '', '', `$${fs.reduce((t, r) => t + monthly(r.m, r.x.cadence), 0)}`, ''],
    });
  }

  // ---------- Rentabilidad por alcance: por cliente, costo de sus módulos vs. lo cotizado o cobrado ----------
  function profit(b) {
    const r = byScope({ month, services, rates, projects, quotes, accounts, entries }), t = r.totals;
    const money = (v) => (v == null ? html`<span class="mut">—</span>` : Q(v));
    const barra = (x) => (x.pct == null ? html`<span class="mut sm">${x.income == null ? 'sin ingreso' : 'sin costo'}</span>` : html`<span class="row" style="gap:8px;justify-content:flex-end"><span style="flex:1;min-width:40px;max-width:120px;height:6px;border-radius:var(--r-pill);background:var(--ui-fill2)"><span style="display:block;width:${Math.max(0, Math.min(100, x.pct))}%;height:100%;border-radius:var(--r-pill);background:var(--ui-ink2)"></span></span><b>${x.pct}%</b></span>`);
    mount(b, html`
      ${cifrasHtml([{ t: 'Ingreso', v: t.income == null ? '—' : Q(t.income) }, { t: 'Costo de módulos', v: t.cost == null ? '—' : Q(t.cost) }, { t: 'Margen', v: t.margin == null ? '—' : Q(t.margin) }, { t: 'Margen %', v: t.pct == null ? '—' : t.pct + '%' }], { etiqueta: `Rentabilidad de ${mLabel(month)}` })}
      <section class="vpp-sec"><div class="vpp-h"><h2>${ico('lock')} Por cliente</h2><span class="vpp-n">${mLabel(month)}</span><span class="vpp-sp"></span>${fromLink({ label: 'catálogo', href: '#/services/servicios', title: 'Servicios → Servicios: horas y precio de cada módulo' })}${fromLink({ label: 'costos por hora', href: '#/services/servicios', title: 'Servicios → Servicios → Costos por hora' })}${fromLink({ label: 'cotizaciones', href: '#/sales/quotes' })}</div>
        <details class="vpp-ayuda"><summary>Cómo se calcula</summary>Costo = la suma de los módulos de cada cliente (servicio × complejidad del catálogo). Ingreso = lo cobrado en movimientos con ese cliente o, si no hay, lo cotizado y aceptado. Los módulos por mes caen cada mes activo; los demás, el mes en que arranca el proyecto.</details>
        <div id="tProfit"></div>
        ${t.unassigned ? html`<p class="mut sm" style="margin-top:8px">${ico('bulb')} ${Q(t.unassigned)} de ingresos del mes no tienen cliente: asígnalo en «Movimientos» para que cuente en su fila.</p>` : ''}</section>
      ${clients.some((c) => c.costo != null) ? html`<section class="vpp-sec"><div class="vpp-h"><h2>Costo declarado en la ficha</h2><span class="vpp-sp"></span><span class="vpp-n" title="De clients/*/plan-contratado.md">ficha de oferta</span></div><div id="tDecl"></div></section>` : ''}`);
    tabla($('#tProfit', b), {
      etiqueta: `Rentabilidad por cliente en ${mLabel(month)}`, filas: r.rows, id: (x) => x.slug, orden: { k: 'pct', dir: 'desc' }, abrir: (x) => scopeDrawer(x),
      vacio: { icono: 'inbox', titulo: `Sin datos de alcance en ${mLabel(month)}`, linea: 'Aparecen los clientes con proyectos o cotizaciones aceptadas y los ingresos con cliente en «Movimientos».' },
      cols: [
        { k: 'name', t: 'Cliente', orden: true, celda: (x) => html`<b>${x.name}</b>${x.need.length ? html`<small>${ico('alert')} ${x.need.length === 1 ? 'Falta un dato' : `Faltan ${x.need.length} datos`}</small>` : ''}` },
        { k: 'mods', t: 'Módulos', num: true, orden: (x) => x.modules.length, celda: (x) => (x.modules.length ? `${x.modules.length}` : html`<span class="mut sm">sin módulos</span>`) },
        { k: 'cost', t: 'Costo', num: true, orden: true, celda: (x) => (x.cost == null ? html`<span class="mut">—</span>` : html`${x.partial ? ico('alert') : ''} ${Q(x.cost)}`) },
        { k: 'quoted', t: 'Cotizado', num: true, orden: true, celda: (x) => money(x.quoted) },
        { k: 'received', t: 'Cobrado', num: true, orden: true, celda: (x) => money(x.received) },
        { k: 'margin', t: 'Margen', num: true, orden: true, celda: (x) => html`<b>${money(x.margin)}</b>` },
        { k: 'pct', t: '%', num: true, orden: true, ancho: '18%', celda: barra },
      ],
      pie: () => [html`<b>Total del mes</b>`, '', money(t.cost), money(t.quoted), money(t.received), money(t.margin), t.pct == null ? '' : `${t.pct}%`],
    });
    if ($('#tDecl', b)) tabla($('#tDecl', b), {
      etiqueta: 'Costo declarado en la ficha de cada cliente', filas: clients.filter((c) => c.hasPlan), id: (c) => c.slug,
      cols: [
        { k: 'slug', t: 'Cliente', orden: true, celda: (c) => html`<b>${c.slug.toUpperCase()}</b>` },
        { k: 'plan', t: 'Alcance', orden: true, celda: (c) => c.plan },
        { k: 'precio', t: 'Precio', num: true, orden: true, celda: (c) => (c.precio != null ? Q(c.precio) : '—') },
        { k: 'costo', t: 'Costo', num: true, orden: true, celda: (c) => (c.costo != null ? Q(c.costo) : '—') },
      ],
    });
  }
  function scopeDrawer(x) {
    drawer(html`<div class="row"><span class="chip dark">${mLabel(month)}</span><div class="sp"></div><button class="btn-icon end" data-act="close">${ico('x', 16)}</button></div>
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
      ${!services.length ? html`${vacio({ icono: 'inbox', titulo: 'Sin servicios', linea: 'Primero carga el catálogo en Servicios → Servicios.' })}` : html`
      <div class="vpp-forma">
        <section class="vpp-sec"><div class="vpp-h"><h2>${ico('lock')} Módulos de la propuesta</h2><span class="vpp-n">${r.rows.length}</span><span class="vpp-sp"></span>${fromLink({ label: 'catálogo', href: '#/services/servicios' })}${fromLink({ label: 'costos por hora', href: '#/services/servicios' })}<button class="btn ghost sm" data-pact="add">+ Módulo</button></div>
          <details class="vpp-ayuda"><summary>Cómo se arma</summary>Arma una propuesta con los módulos del catálogo. Su costo es la suma de cada servicio en su complejidad; el precio sugerido deja el margen objetivo.</details>
          <div class="tdn"><table><caption class="tdn-sr">Módulos de la propuesta</caption><thead><tr><th scope="col">Servicio</th><th scope="col">Complejidad</th><th scope="col" class="n">Cantidad</th><th scope="col" class="n">Horas</th><th scope="col" class="n">Costo</th><th scope="col" class="tdn-a"><span class="tdn-sr">Quitar</span></th></tr></thead><tbody>
          ${r.rows.map((x, i) => html`<tr class="tdn-f"><td class="tdn-t"><select class="in" data-i="${i}" data-f="sid" aria-label="Servicio">${services.map((sv) => html`<option value="${sv.id}" ${sv.id === x.sid ? raw('selected') : ''}>${sv.name}</option>`)}</select><small>por ${x.unit}${x.why ? ' · ' + x.why : ''}</small></td>
            <td data-l="Complejidad"><select class="in" data-i="${i}" data-f="lv" aria-label="Complejidad">${LEVELS.map((lv) => html`<option value="${lv}" ${lv === +x.lv ? raw('selected') : ''}>${lv}</option>`)}</select></td>
            <td class="n" data-l="Cantidad"><input class="in mini" type="number" min="1" data-i="${i}" data-f="qty" value="${x.qty}" aria-label="Cantidad" style="max-width:72px"></td><td class="n" data-l="Horas">${x.hours == null ? '—' : x.hours + ' h'}</td>
            <td class="n" data-l="Costo">${x.cost == null ? '—' : html`${x.miss.length ? html`<span title="Faltan costos por hora: ${x.miss.join(', ')}">${ico('alert')}</span>` : ''} ${Q(x.cost)}`}</td><td class="tdn-a"><button class="btn-icon" data-pact="rm" data-i="${i}" title="Quitar" aria-label="Quitar módulo">${ico('x', 16)}</button></td></tr>`)}
          </tbody></table></div></section>
        <aside class="vpp-aside" aria-label="Precio sugerido">
          ${cifrasHtml([{ t: 'Precio sugerido', v: r.price == null ? '—' : Q(r.price) }], { etiqueta: 'Precio sugerido' })}
          ${cifrasHtml([{ t: 'Costo', v: r.cost == null ? '—' : Q(r.cost) }, { t: 'Margen objetivo', v: `${m}%` }, { t: 'Catálogo', v: catalogPrice ? Q(catalogPrice) : '—' }], { etiqueta: 'Desglose', clase: 'cfr-s' })}
          ${!r.complete && r.rows.length ? html`<p class="sm">${ico('alert')} Sin precio sugerido: ${!rates ? 'faltan los costos por hora (Servicios → Servicios → Costos por hora)' : 'a un módulo le faltan horas o costos por hora'}.</p>` : ''}
          ${catalogPrice && r.cost ? html`<p class="sm mut">Al precio del catálogo el margen sería ${Math.round((1 - r.cost / catalogPrice) * 100)}%.</p>` : ''}
          ${edit ? html`<div class="row" style="margin-top:12px;gap:8px"><label class="sm mut" for="pmargin">Margen objetivo</label><input class="in mini" type="number" min="1" max="95" id="pmargin" value="${m}" style="max-width:80px"><span>%</span><button class="btn ghost sm" data-pact="margin">Guardar</button></div>` : ''}
        </aside>
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
        ${cifrasHtml([{ t: 'Pagos del mes', v: Q(total) }, { t: 'Pool de rubros', v: Q(poolT) }, { t: 'Roles sin repartir al 100%', v: sin.length, tono: sin.length ? 'warn' : '' }, { t: 'Montos sin datos', v: falta.length, tono: falta.length ? 'warn' : '' }], { etiqueta: 'Pagos por servicio del mes' })}
        <section class="vpp-sec"><div class="vpp-h"><h2>El mes de cada persona</h2><span class="vpp-n">${d.personas.length}</span><span class="vpp-sp"></span><button class="btn ghost sm" data-act="addP">+ Persona</button></div><div id="tPers"></div></section>
        <section class="vpp-sec"><div class="vpp-h"><h2>Reparto por rol</h2><span class="vpp-n" title="% del rubro entre personas · se define una vez">% del rubro</span></div>
          <div class="tdn"><table><caption class="tdn-sr">Reparto de cada rol entre personas</caption><thead><tr><th scope="col">Rol</th><th scope="col" class="n">Pool</th><th scope="col">Personas y %</th><th scope="col" class="n">Suma</th></tr></thead><tbody>
          ${rubros.map((r) => { const sp = d.reparto[r] || []; const tot = sp.reduce((a, s) => a + (+s.pct || 0), 0); return html`<tr class="tdn-f"><th scope="row" class="tdn-t"><b>${r}</b></th><td class="n" data-l="Pool">${Q(pool[r] || 0)}</td>
            <td data-l="Personas"><div style="display:grid;gap:4px">${sp.map((s, i) => html`<div class="row" style="gap:6px;flex-wrap:nowrap"><select class="in" data-r="${r}" data-i="${i}" data-f="p" aria-label="Persona">${d.personas.map((p) => html`<option value="${p.id}" ${p.id === s.p ? raw('selected') : ''}>${p.nombre}</option>`)}</select><input class="in" type="number" style="max-width:72px" data-r="${r}" data-i="${i}" data-f="pct" value="${s.pct}" aria-label="Porcentaje"><span class="mut">%</span><button class="btn-icon" data-act="rmS" data-r="${r}" data-i="${i}" title="Quitar" aria-label="Quitar persona del rol">${ico('x', 14)}</button></div>`)}<button class="btn ghost sm" data-act="addS" data-r="${r}" style="justify-self:start">+ Persona</button></div></td>
            <td class="n" data-l="Suma"><span class="chip ${!sp.length ? '' : Math.abs(tot - 100) < 0.01 ? 'green' : 'amber'}">${sp.length ? tot + '%' : 'sin nadie'}</span></td></tr>`; })}
          </tbody></table></div></section>
        <section class="vpp-sec"><div class="vpp-h"><h2>Cuentas</h2><span class="vpp-n" title="Gris = del manual; Tailor Made: escríbelo tú">lo que cada cuenta paga a cada rol</span><span class="vpp-sp"></span><button class="btn ghost sm" data-act="addC">+ Cuenta</button></div>
          <div class="tdn tdn-ancha"><table><caption class="tdn-sr">Lo que cada cuenta paga a cada rol</caption><thead><tr><th scope="col">Cuenta</th><th scope="col">Plan</th>${rubros.map((r) => html`<th scope="col" class="n">${r.replace(/\s*\(.*\)/, '')}</th>`)}<th scope="col" class="tdn-a"><span class="tdn-sr">Quitar</span></th></tr></thead><tbody>
          ${d.cuentas.map((c, ci) => html`<tr class="tdn-f"><th scope="row" class="tdn-t"><b>${c.nombre}</b>${c.costoDeclarado != null ? html`<small>${ico('lock')} declarado ${Q(c.costoDeclarado)}</small>` : ''}</th>
            <td data-l="Plan"><select class="in" data-c="${ci}" data-f="plan" aria-label="Plan">${[...plans.map((p) => [p.id, p.name]), ['tailor', 'TAILOR MADE']].map(([v, l]) => html`<option value="${v}" ${v === c.planId ? raw('selected') : ''}>${l}</option>`)}</select></td>
            ${rubros.map((r) => { const pm = plans.find((p) => p.id === c.planId)?.rubros.find((x) => x.label === r)?.monto; return html`<td class="n" data-l="${r.replace(/\s*\(.*\)/, '')}"><input class="in mini" type="number" data-c="${ci}" data-r="${r}" data-f="monto" value="${c.montos?.[r] ?? ''}" placeholder="${pm ?? 'Q'}" aria-label="${r}" style="max-width:96px"></td>`; })}
            <td class="tdn-a"><button class="btn-icon" data-act="rmC" data-i="${ci}" title="Quitar cuenta" aria-label="Quitar ${c.nombre}">${ico('x', 16)}</button></td></tr>`)}
          </tbody></table></div></section>
        ${falta.length ? html`<div class="warnbox" style="margin-top:12px">${ico('alert')} SIN DATOS — falta el monto: ${falta.slice(0, 8).join(' · ')}${falta.length > 8 ? ' …' : ''}</div>` : ''}
        <div class="row" style="margin-top:16px"><button class="btn" data-act="saveN">Guardar pagos</button></div>`);
      // Cada persona, una fila: lo que le toca este mes. La fila abre «de dónde sale»; quitarla va como acción.
      tabla($('#tPers', b), {
        etiqueta: 'El mes de cada persona', filas: d.personas, orden: { k: 'pago', dir: 'desc' },
        vacio: { icono: 'inbox', titulo: 'Sin personas', linea: 'Agrega a quien cobra por servicio con «+ Persona».' },
        cols: [
          { k: 'nombre', t: 'Persona', orden: true, celda: (p) => html`<b>${p.nombre}</b>` },
          { k: 'pago', t: 'Este mes', num: true, orden: (p) => pay[p.id], celda: (p) => html`<b>${Q(pay[p.id])}</b>` },
          { k: 'pct', t: '% del total', num: true, orden: (p) => pay[p.id], celda: (p) => `${total ? Math.round((pay[p.id] / total) * 100) : 0}%` },
          { k: 'roles', t: 'Roles', movil: 'oculta', celda: (p) => Object.entries(d.reparto).filter(([, v]) => v.some((s) => s.p === p.id)).map(([r, v]) => `${r} ${v.find((s) => s.p === p.id).pct}%`).join(' · ') || '—' },
        ],
        abrir: (p) => drawer(html`<div class="row"><span class="chip">${Q(pay[p.id])} este mes</span><div class="sp"></div><button class="btn-icon end" data-act="close">${ico('x', 16)}</button></div><h2>${p.nombre}</h2><p class="mut sm">De dónde sale: cada cuenta × su % del rol.</p>
          ${det[p.id].length ? html`<div class="tdn"><table><caption class="tdn-sr">De dónde sale</caption><thead><tr><th scope="col">Cuenta</th><th scope="col">Rol</th><th scope="col" class="n">Monto</th></tr></thead><tbody>${det[p.id].map((x) => html`<tr><td>${x.c}</td><td class="mut">${x.r}</td><td class="n">${Q(x.q)}</td></tr>`)}</tbody></table></div>` : html`${vacio({ compacto: true, icono: 'inbox', titulo: 'Sin pagos este mes', linea: 'Asígnale un % en «Reparto por rol».' })}`}`),
        acciones: (p) => [{ t: 'Quitar', ico: 'x', peligro: true, fn: () => quitarP(p.id) }],
      });
      $$('[data-f]', b).forEach((inp) => inp.addEventListener('change', () => {
        const f = inp.dataset.f;
        if (f === 'p' || f === 'pct') { const s = d.reparto[inp.dataset.r][+inp.dataset.i]; s[f] = f === 'pct' ? +inp.value : inp.value; }
        if (f === 'plan') d.cuentas[+inp.dataset.c].planId = inp.value;
        if (f === 'monto') { const c = d.cuentas[+inp.dataset.c]; c.montos ||= {}; if (inp.value === '') delete c.montos[inp.dataset.r]; else c.montos[inp.dataset.r] = +inp.value; }
        setTimeout(draw, 0);
      }));
    };
    const quitarP = (id) => { d.personas = d.personas.filter((p) => p.id !== id); Object.values(d.reparto).forEach((sp) => sp.splice(0, sp.length, ...sp.filter((s) => s.p !== id))); draw(); };
    b.onclick = async (e) => {
      const t = e.target.closest('[data-act]'); if (!t) return;
      const a = t.dataset.act;
      if (a === 'addS') { (d.reparto[t.dataset.r] ||= []).push({ p: d.personas[0]?.id, pct: 0 }); draw(); }
      if (a === 'rmS') { d.reparto[t.dataset.r].splice(+t.dataset.i, 1); draw(); }
      if (a === 'addP') { const v = await ask('Agregar persona', [{ k: 'nombre', l: 'Nombre', req: true }]); if (v) { d.personas.push({ id: slug(v.nombre) || String(Date.now()), nombre: v.nombre }); draw(); } }
      if (a === 'rmP') quitarP(t.dataset.id);
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
    edit: (t) => verMov(t.dataset.id),
  });
  function verMov(id) {
      const e = entries.find((x) => x.id === id); if (!e) return;
      drawer(html`<div class="row"><span class="chip ${e.type === 'ingreso' ? 'green' : 'red'}">${e.type}</span><div class="sp"></div><button class="btn-icon end" data-act="close">${ico('x', 16)}</button></div>
        <h2>${e.concept}</h2><div class="big" style="font-size:44px;margin-top:10px">${Q(e.amount)}</div>
        <div class="kv"><span>Fecha</span><b style="font-weight:500">${fdate(e.date)}</b><span>Categoría</span><b style="font-weight:500">${e.category || '—'}</b><span>Cliente</span><b style="font-weight:500">${e.client || '—'}</b>${e.source === 'auto' ? html`<span>Origen</span><b style="font-weight:500">Registrado solo, al pagarse su factura</b>` : ''}</div>
        ${e.invoice_id && !resumen ? html`<button class="btn ghost" data-act="inv" data-id="${e.invoice_id}" style="margin-bottom:10px">${ico('doc')} Ver factura</button>` : ''}
        ${edit ? html`<div class="row"><button class="btn" data-act="ed">Editar</button><button class="btn ghost" data-act="del">Eliminar</button></div>` : ''}`,
      { inv: (t) => goInv(t.dataset.id), ed: () => { closeDrawer(); editEntry(e); }, del: async () => { if (!(await confirmAsk('¿Eliminar este movimiento?'))) return; await F.remove(e.id); entries = entries.filter((x) => x.id !== e.id); manual = entries.filter((x) => !x.sheet); closeDrawer(); paint(); } });
  }
  paint();
}
