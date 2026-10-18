// Servicios: tres pestañas en una sola sección.
//   · Paquetes: los 3 niveles arriba (cada uno abre sus paquetes) y los otros paquetes → servicios-paquetes.js
//   · Servicios: el catálogo tal cual (nivel 3 a 10, horas, precio, costo solo CEO) → catalogo.js, con el armador de
//     propuesta y el margen por cliente plegados arriba («Armar propuesta»)
//   · Responsabilidades: el pipeline programable por paquete o servicio (las recetas) → responsabilidades.js
// Las cotizaciones siguen en Comercial; los movimientos y pagos en #/finanzas (Equipo → Más).
import { byScope, proposal, targetMargin, LEVELS as CX, PRICING_ID } from '../finscope.js';
import { html, raw, mount, col, api, toast, acts, Q, today, $, $$, ico, isSummary, canEdit, roChip, csv, swap } from '../core.js';
import { hbars, PAL } from '../charts.js';
import { createCatalog } from '../catalogo.js';
import { createBundles } from '../armados.js';
import { recipesWith } from '../recipes.js';
import { paquetesTab } from '../servicios-paquetes.js';
import { responsabilidadesTab, svcResp, sinResp } from '../responsabilidades.js';

const TABS = [['paquetes', 'Paquetes'], ['servicios', 'Servicios'], ['responsabilidades', 'Responsabilidades']];

export async function render(el, { me, sub, alive }) {
  const ceo = me.role === 'ceo';
  const resumen = isSummary(me, 'sales'), edit = canEdit(me, 'sales');
  if (resumen) return mount(el, html`<div class="hello"><h1>Servicios</h1><p>Tu perfil ve Comercial <em>en resumen</em>.</p></div><div class="empty"><b>El catálogo y los precios no entran en tu vista</b>Los prospectos y sus seguimientos están en Clientes → cada cliente → Prospectos.</div>`);
  let [services, quotes, rates, pricingDoc, projects, accounts, finance, sheet, bundles, recDocs, docs, industries] = await Promise.all([
    col('services').list().catch(() => []), col('quotes').list().catch(() => []), ceo ? col('rates').get('default').catch(() => null) : null,
    ceo ? col('settings').get(PRICING_ID).catch(() => null) : null, ceo ? col('projects').list().catch(() => []) : [], ceo ? col('accounts').list().catch(() => []) : [], ceo ? col('finance').list().catch(() => []) : [], ceo ? api('finance/sheet').catch(() => null) : null,
    // Los paquetes con costos solo los lee el CEO; los demás ven la lista sin costos (flow/bundles).
    ceo ? col('bundles').list().catch(() => []) : api('flow/bundles').then((r) => (r.bundles || []).map((b) => ({ ...b, level: b.nivel }))).catch(() => []),
    col('recipes').list().catch(() => []), col('docs').list().catch(() => []), fetch('/data/paquetes.json').then((r) => r.json()).then((d) => d.ind.map((i) => i.n)).catch(() => [])]);
  let R = recipesWith(recDocs);
  let tab = TABS.some(([k]) => k === sub[0]) ? sub[0] : 'paquetes', lvSel = '', prop = [];
  const entries = [...finance, ...fromSheet(sheet)], M = today().slice(0, 7);
  const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

  // ---------- piezas compartidas ----------
  // Cotizar un paquete: queda una cotización en borrador y se abre en Comercial.
  const nextNumber = () => { const y = new Date().getFullYear(); return `COT-${y}-${String(quotes.filter((q) => String(q.number || '').startsWith(`COT-${y}-`)).length + 1).padStart(3, '0')}`; };
  const onQuote = async (pre) => { try { const q = await col('quotes').create({ number: nextNumber(), date: today(), valid_days: 15, status: 'Borrador', discount_pct: 0, notes: '', lead_id: '', client: '', contact: '', email: '', ...pre }); quotes.push(q); toast('Cotización creada en borrador'); location.hash = `/sales/quotes/${q.id}`; } catch (e) { toast(e.message, true); } };
  const bun = ceo ? await createBundles({ services, rates, industries, onQuote }).catch(() => null) : null;
  const CAT = createCatalog({ me, getS: () => services, setS: (l) => { services = l; }, getR: () => rates, setR: (r) => { rates = r; }, paint, alive, levels: false, isCat: () => tab === 'servicios',
    flag: (s) => (svcResp(R, s) ? '' : html`<div style="margin-top:8px">${sinResp(`Sin responsables: ${s.name} no tiene horas por rol ni responsabilidades programadas`)}</div>`) });
  CAT.bind(el);
  const reloadRecipes = async () => { recDocs = await col('recipes').list().catch(() => recDocs); R = recipesWith(recDocs); return R; };
  const reloadBundles = async () => { if (!ceo) return; bundles = bun ? bun.list : await col('bundles').list().catch(() => bundles); };

  // ---------- layout ----------
  function paint() {
    if (!alive()) return;
    mount(el, html`<div class="hello row" style="align-items:flex-end"><div><h1>Servicios</h1><p>Qué vendemos, <em>en qué paquetes</em> y quién lo hace.</p></div><div class="sp"></div>${roChip(me, 'sales')}</div>
      <div class="row" style="margin-bottom:18px;flex-wrap:wrap;gap:8px">
        <div class="tabs" style="margin:0">${TABS.map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div><div class="sp"></div>
        ${tab === 'servicios' && edit ? html`${ceo ? html`<button class="btn ghost" data-act="rates">Costos por hora</button>` : ''}<button class="btn" data-act="newService">+ Nuevo servicio</button>` : ''}
      </div>
      <div id="body"></div>`);
    const body = $('#body', el);
    if (tab === 'paquetes') return paquetesTab(body, { me, services, bundles, R, bun, onQuote, sel: lvSel, setSel: (v) => { lvSel = v; paint(); }, onChange: async () => { await reloadBundles(); paint(); } });
    if (tab === 'responsabilidades') return responsabilidadesTab(body, { me, services, bundles, R, docs, pick: sub[1] || '', reload: reloadRecipes, onChange: () => {} });
    mount(body, html`${ceo ? html`<details class="fold" id="propbox" style="margin-bottom:18px"><summary>${ico('right', 13)} Armar propuesta y margen por cliente</summary><div class="grid g11" style="margin-top:12px;align-items:start"><div id="prop"></div>${marginCard()}</div></details>` : ''}<div id="cat"></div>`);
    CAT.cat($('#cat', body));
    if (ceo) { const d = $('#propbox', body); d.addEventListener('toggle', () => { if (d.open) propBuilder($('#prop', body)); }); if (d.open) propBuilder($('#prop', body)); }
  }

  // ---------- el margen por cliente y el armador de propuesta (solo CEO, plegados) ----------
  function marginCard() {
    const r = byScope({ month: M, services, rates, projects, quotes, accounts, entries });
    const rows = r.rows.map((x) => ({ label: x.name, pct: x.pct, text: x.pct == null ? (x.income == null ? 'sin ingreso' : 'sin costo') : `${x.pct}% · ${Q(x.margin)}`, c: x.pct == null ? '' : x.pct >= 70 ? PAL.ink : x.pct >= 55 ? PAL.brown : PAL.sand }));
    return html`<div class="card wkbox"><div class="wkhead"><div><h3>${ico('lock', 13)} Margen por cliente · este mes</h3><span class="mut sm">Costo de sus módulos vs. lo cobrado (o cotizado)${r.totals.pct != null ? ` · total ${r.totals.pct}%` : ''}</span></div><a class="sm mut" href="#/finanzas/profit" style="margin-left:auto">Detalle →</a></div>
      ${hbars(rows, { empty: 'Sin datos este mes: aparecen con los proyectos (sus módulos) y los ingresos con cliente en Finanzas.' })}
      ${r.totals.sinDatos ? html`<div class="mut sm" style="margin-top:8px">${ico('alert', 13)} ${r.totals.sinDatos} cliente${r.totals.sinDatos === 1 ? '' : 's'} con datos incompletos (horas, costos por hora o ingreso).</div>` : ''}</div>`;
  }
  // Módulos elegidos → costo y precio sugerido = costo ÷ (1 − margen objetivo).
  function propBuilder(b) {
    if (!b) return;
    const on = services.filter((s) => s.active !== false), m = targetMargin(pricingDoc, rates);
    if (!prop.length && on.length) prop = [{ sid: on[0].id, lv: 5, qty: 1 }];
    const r = proposal(prop, services, rates, m);
    const cat = r.rows.reduce((a, x) => { const sv = services.find((y) => y.id === x.sid); const p = sv ? CAT.priceAt(sv, x.lv) : null; return p == null || a == null ? null : a + p * x.qty; }, 0);
    mount(b, html`<div class="card wkbox"><div class="wkhead"><div><h3>${ico('lock', 13)} Armar una propuesta</h3><span class="mut sm">Elige módulos y su complejidad: el precio sugerido deja el margen objetivo</span></div><div class="sp"></div>${on.length ? html`<button class="btn ghost xs" data-pact="add">+ Módulo</button>` : ''}</div>
      ${!on.length ? html`<div class="mut sm">Primero crea un servicio.</div>` : html`
      ${r.rows.map((x, i) => html`<div class="row" style="gap:6px;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid var(--line)"><select class="in" data-i="${i}" data-f="sid" style="flex:1;min-width:160px">${on.map((sv) => html`<option value="${sv.id}" ${sv.id === x.sid ? raw('selected') : ''}>${sv.name}</option>`)}</select>
        <select class="in" data-i="${i}" data-f="lv" style="width:auto">${CX.map((lv) => html`<option value="${lv}" ${lv === +x.lv ? raw('selected') : ''}>${lv}</option>`)}</select><input class="in mini" type="number" min="1" data-i="${i}" data-f="qty" value="${x.qty}" style="width:64px">
        <span class="sm" style="min-width:90px;text-align:right">${x.cost == null ? html`<span class="mut" title="${x.why || ''}">sin costo</span>` : html`${x.miss.length ? ico('alert', 12) : ''} ${Q(x.cost)}`}</span><button class="sm mut" data-pact="rm" data-i="${i}">${ico('x', 15)}</button></div>`)}
      <div class="split" style="margin-top:12px"><div><span class="lbl">Precio sugerido</span><b>${r.price == null ? '—' : Q(r.price)}</b></div><div><span class="lbl">Costo</span><b>${r.cost == null ? '—' : Q(r.cost)}</b></div><div><span class="lbl">Margen objetivo</span><b>${m}%</b></div><div><span class="lbl">Catálogo</span><b>${cat ? Q(cat) : '—'}</b></div></div>
      ${!r.complete && r.rows.length ? html`<div class="mut sm" style="margin-top:8px">${ico('alert', 13)} Sin precio sugerido: ${!rates ? 'faltan los costos por hora' : 'a un módulo le faltan horas o costos por hora'}.</div>` : ''}
      <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><input class="in mini" type="number" min="1" max="95" id="pmargin" value="${m}" style="width:80px"><span class="sm">% margen objetivo</span><button class="btn ghost xs" data-pact="margin">Guardar</button><div class="sp"></div><a class="btn xs" href="#/sales/quotes">Cotizar →</a></div>`}</div>`);
    $$('[data-f]', b).forEach((inp) => inp.addEventListener('change', () => { const x = prop[+inp.dataset.i]; x[inp.dataset.f] = inp.dataset.f === 'sid' ? inp.value : Math.max(1, +inp.value || 1); propBuilder(b); }));
    b.onclick = async (e) => { const t = e.target.closest('[data-pact]'); if (!t) return;
      if (t.dataset.pact === 'add') { prop.push({ sid: on[0].id, lv: 5, qty: 1 }); propBuilder(b); }
      if (t.dataset.pact === 'rm') { prop.splice(+t.dataset.i, 1); propBuilder(b); }
      if (t.dataset.pact === 'margin') { const v = +$('#pmargin', b).value; if (!(v >= 1 && v <= 95)) return toast('El margen objetivo va de 1% a 95%', true); try { pricingDoc = pricingDoc ? await col('settings').save({ ...pricingDoc, margin: v }) : await col('settings').create({ id: PRICING_ID, margin: v }); toast('Margen objetivo guardado'); propBuilder(b); } catch (err) { toast(err.message, true); } } };
  }
  acts(el, {
    tab: (b) => { tab = b.dataset.t; history.replaceState(null, '', '#/services/' + tab); swap(el, paint); },
    ...CAT.actions,
  });
  paint();
}

// Los ingresos del mes también salen de la hoja de Google (igual que Finanzas).
function fromSheet(sh) {
  if (!sh?.csv) return []; const [head = [], ...rows] = csv(sh.csv); const H = head.map((h) => String(h).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()); const ix = (k) => H.findIndex((h) => h.startsWith(k)); const [cF, cT, cM, cL] = ['fecha', 'tipo', 'monto', 'cliente'].map(ix);
  return rows.map((r) => { const n = Number(String(r[cM] ?? '').replace(/[^\d.-]/g, '')), t = String(r[cT] ?? '').toLowerCase(); return { date: String(r[cF] ?? '').slice(0, 10), type: /ingres|entrad|cobr|venta|income/.test(t) ? 'ingreso' : /gast|salid|pag|egres|expense/.test(t) ? 'gasto' : n < 0 ? 'gasto' : 'ingreso', amount: Math.abs(n) || 0, client: String(r[cL] ?? '').trim().toUpperCase() }; }).filter((e) => /^\d{4}-\d{2}/.test(e.date) && e.amount);
}
