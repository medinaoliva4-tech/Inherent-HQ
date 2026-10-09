import { html, raw, mount, col, api, drawer, closeDrawer, ask, toast, acts, confirmAsk, Q, K, fdate, today, $, $$, IC, matrix, lineChart, csv, connectChip, wizard } from '../core.js';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CATS_IN = ['Plan mensual', 'Proyecto', 'Performance fee', 'Otro'];
const CATS_OUT = ['Nómina', 'Herramientas / IA', 'Producción', 'Pauta', 'Oficina', 'Impuestos', 'Otro'];
const ym = (d) => String(d || '').slice(0, 7);
const mLabel = (m) => `${MONTHS[+m.slice(5) - 1]} ${m.slice(2, 4)}`;
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const planIdOf = (t = '') => (/tailor/i.test(t) ? 'tailor' : /pro\b/i.test(t) ? 'pro' : /accelerate/i.test(t) ? 'accelerate' : /compound/i.test(t) ? 'compound' : /marketing/i.test(t) ? 'marketing' : 'tailor');
const SLOT_OF = { 'Grabación': 'Producción', 'Fotografía': 'Fotografía', 'Edición de video': 'Editor de video', 'Operador de agentes': 'Operador de agentes' };

export async function render(el, { sub }) {
  const F = col('finance'), P = col('payroll');
  // Todo en paralelo: una sola espera en vez de cinco seguidas.
  let ecoErr = null;
  let [manual, services, rates, eco, clients, payroll, sheet] = await Promise.all([F.list(), col('services').list(), col('rates').get('default').catch(() => null),
    api('repo/economia').catch((e) => { ecoErr = e.message; return null; }), api('repo/clients').then((r) => r.clients).catch(() => []), P.get('default').catch(() => null),
    api('finance/sheet').catch((e) => ({ error: e.message }))]);
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

  let tab = ['mov', 'costs', 'profit', 'pricing', 'nomina'].includes(sub[0]) ? sub[0] : 'mov';
  const now = today().slice(0, 7);
  let month = now;
  const months8 = Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 7 + i); return d.toISOString().slice(0, 7); });
  const sum = (type, m, f = () => true) => entries.filter((e) => e.type === type && ym(e.date) === m && f(e)).reduce((a, e) => a + (+e.amount || 0), 0);

  function paint() {
    const rev = sum('ingreso', month), cost = sum('gasto', month);
    mount(el, html`
      <div class="hello"><h1>Finance</h1><p>Cuánto entra, cuánto cuesta, <em>cuánto queda</em>.</p></div>
      <div class="grid g21">
        <div class="card">
          <div class="chead"><div class="ico">↗</div><h3>Revenue vs. costo · 8 meses</h3><div class="sp"></div>
            <span class="sm row" style="gap:14px"><span class="row" style="gap:6px"><i style="width:16px;height:2px;background:#171410;display:inline-block"></i>Revenue</span><span class="row" style="gap:6px"><i style="width:16px;height:0;border-top:2px dashed #c2735a;display:inline-block"></i>Costo</span></span></div>
          ${entries.length ? html`<div class="chart" id="chFin" style="height:240px"></div>` : html`<div class="empty" style="margin-top:20px"><b>Sin movimientos todavía</b>Registra ingresos y gastos en «Movimientos» y aquí aparece la gráfica.</div>`}
        </div>
        <div class="card feat ink">
          <div class="chead"><div class="ico">${IC.ring(78)}<span style="font-size:15px">◎</span></div><h3>Revenue<br><span class="lbl">${mLabel(month)}</span></h3></div>
          <div class="big">${rev ? html`<span class="cur">Q</span>${K(rev)}` : '—'}</div>
          <div class="split" style="margin-top:18px"><div><span class="lbl">Gross</span><b>${Q(rev - cost)}</b></div><div><span class="lbl">Cost</span><b>${Q(cost)}</b></div><div><span class="lbl">Margen</span><b style="color:var(--lime)">${rev ? Math.round(((rev - cost) / rev) * 100) + '%' : '—'}</b></div></div>
          ${matrix(rev ? Math.max(2, Math.round(((rev - cost) / rev) * 34)) : 0)}
          <div class="foot"><span>${entries.filter((e) => ym(e.date) === month).length} movimientos</span>
            <select class="in" data-act="month" style="width:auto;padding:6px 10px;background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.25)">${months8.slice().reverse().map((m) => html`<option value="${m}" ${m === month ? raw('selected') : ''}>${mLabel(m)}</option>`)}</select></div>
        </div>
      </div>
      <div class="row" style="margin:24px 0 18px;flex-wrap:wrap">
        <div class="tabs" style="margin:0">${[['mov', 'Movimientos'], ['costs', 'Costs'], ['profit', 'Profitability'], ['pricing', 'Pricing'], ['nomina', 'Nómina']].map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>
        <div class="sp"></div>
        ${tab === 'mov' ? html`${connectChip('sheets', sheet?.url ? 'Google Sheet conectado' : 'Conectar Google Sheet', 'sheet', Boolean(sheet?.url))}${sheet?.url ? html`<button class="sm mut" data-act="sheetset" style="margin:0 6px">Cambiar</button>` : ''}<button class="btn ghost" data-act="add" data-type="gasto">+ Gasto</button><button class="btn" data-act="add" data-type="ingreso">+ Ingreso</button>` : ''}
      </div>
      <div id="fbody"></div>`);
    if ($('#chFin', el)) lineChart($('#chFin', el), months8.map(mLabel), [
      { name: 'Revenue', v: months8.map((m) => sum('ingreso', m)), c: '#171410', fill: true },
      { name: 'Costo', v: months8.map((m) => sum('gasto', m)), c: '#c2735a', dash: true }], { fmt: Q });
    $('[data-act=month]', el).onchange = (e) => { month = e.target.value; paint(); };
    const b = $('#fbody', el);
    ({ mov, costs, profit, pricing, nomina })[tab](b);
  }

  // ---------- Movimientos ----------
  function mov(b) {
    const list = entries.filter((e) => ym(e.date) === month).sort((x, y) => String(y.date).localeCompare(String(x.date)));
    const note = sheet?.error ? html`<div class="warnbox" style="margin-bottom:12px">Google Sheet: ${sheet.error}</div>`
      : !sheet?.url ? html`<div class="mut sm" style="margin-bottom:12px">💡 Conecta una hoja de Google Sheets y los movimientos salen de ahí (fecha · tipo · concepto · monto · categoría · cliente). Ya no hay que meterlos a mano.</div>` : '';
    mount(b, !list.length ? html`${note}<div class="empty"><b>Sin movimientos en ${mLabel(month)}</b>${sheet?.url ? 'Agrega filas a tu hoja de Google Sheets y recarga.' : 'Conecta tu Google Sheet o registra un ingreso o gasto.'}</div>`
      : html`${note}<div class="card"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Cliente</th><th>Categoría</th><th class="n">Monto</th></tr></thead><tbody>
        ${list.map((e) => html`<tr class="click" data-act="${e.sheet ? 'sheet' : 'edit'}" data-id="${e.id}"><td class="mut">${fdate(e.date)}</td><td><b style="font-weight:500">${e.concept}</b>${e.sheet ? html` <span class="mut sm">· Sheet</span>` : ''}</td><td>${e.client || '—'}</td><td><span class="chip">${e.category || '—'}</span></td>
          <td class="n"><b style="color:${e.type === 'ingreso' ? '#3c6a1c' : '#a3392a'}">${e.type === 'ingreso' ? '+' : '−'}${Q(e.amount)}</b></td></tr>`)}
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
      month = ym(r.date); toast('Guardado ✅'); paint();
    } catch (err) { toast(err.message, true); }
  }

  // ---------- Costs (Hours | Team | Service | Total) ----------
  function costs(b) {
    const rateOf = (role) => rates?.roles?.find((r) => r.role === role)?.rate;
    mount(b, html`
      ${!rates ? html`<div class="warnbox" style="margin-bottom:14px">Define los costos por hora en Sales → Catálogo → Costos por hora.</div>` : ''}
      ${!services.length ? html`<div class="empty"><b>Sin servicios</b>Los servicios del catálogo de Sales aparecen aquí con su costo.</div>`
      : html`<div class="card"><table><thead><tr><th>Servicio</th><th>Equipo</th><th class="n">Horas</th><th class="n">Costo / h</th><th class="n">Total</th><th class="n">Precio</th><th class="n">Margen</th></tr></thead><tbody>
        ${services.map((s) => { const h = (s.tasks || []).reduce((a, t) => a + (+t.hours || 0), 0); const miss = (s.tasks || []).some((t) => rateOf(t.role) == null); const c = (s.tasks || []).reduce((a, t) => a + (rateOf(t.role) || 0) * (+t.hours || 0), 0);
          return html`<tr><td><b style="font-weight:500">${s.name}</b><div class="mut sm">${s.category || ''}</div></td><td>${(s.tasks || []).map((t) => html`<span class="chip" style="margin:2px">${t.role} · ${t.hours}h</span>`)}</td><td class="n">${h} h</td><td class="n">${h && !miss ? Q(c / h) : '—'}</td><td class="n"><b>${miss ? '⚠️' : Q(c)}</b></td><td class="n">${s.price ? Q(s.price) : '—'}</td><td class="n">${s.price && !miss ? Math.round(((s.price - c) / s.price) * 100) + '%' : '—'}</td></tr>`; })}
      </tbody></table></div>`}`);
  }

  // ---------- Profitability ----------
  function profit(b) {
    const byClient = {};
    entries.filter((e) => ym(e.date) === month).forEach((e) => { const k = e.client || 'Sin cliente (general)'; byClient[k] ||= { i: 0, c: 0 }; byClient[k][e.type === 'ingreso' ? 'i' : 'c'] += +e.amount || 0; });
    const rows = Object.entries(byClient).sort((a, z) => z[1].i - a[1].i);
    mount(b, html`
      ${rows.length ? html`<div class="card"><table><thead><tr><th>Cliente</th><th class="n">Ingreso</th><th class="n">Costo</th><th class="n">Utilidad</th><th style="width:30%">Margen</th></tr></thead><tbody>
        ${rows.map(([n, { i, c }]) => { const m = i ? Math.round(((i - c) / i) * 100) : null; return html`<tr><td><b style="font-weight:500">${n}</b></td><td class="n">${Q(i)}</td><td class="n">${Q(c)}</td><td class="n"><b>${Q(i - c)}</b></td><td>${m == null ? html`<span class="mut sm">solo gastos</span>` : html`<div class="row"><div style="flex:1;height:8px;border-radius:99px;background:#ebe5da"><div style="width:${Math.max(0, Math.min(100, m))}%;height:100%;border-radius:99px;background:${m >= 70 ? '#171410' : m >= 55 ? '#7f9631' : '#c2735a'}"></div></div><span class="sm" style="width:40px;text-align:right">${m}%</span></div>`}</td></tr>`; })}
      </tbody></table></div>` : html`<div class="empty"><b>Sin datos en ${mLabel(month)}</b>Asigna el cliente a cada ingreso y gasto para ver qué tan rentable es cada uno.</div>`}
      ${clients.some((c) => c.costo != null) ? html`<div class="sec-title"><h2>Costo fijo declarado por cuenta</h2><span class="mut sm">De clients/*/plan-contratado.md</span></div>
        <div class="card"><table><thead><tr><th>Cliente</th><th>Plan</th><th class="n">Precio</th><th class="n">🔒 Costo</th></tr></thead><tbody>${clients.filter((c) => c.hasPlan).map((c) => html`<tr><td><b style="font-weight:500">${c.slug.toUpperCase()}</b></td><td class="mut">${c.plan}</td><td class="n">${Q(c.precio)}</td><td class="n">${c.costo != null ? Q(c.costo) : '—'}</td></tr>`)}</tbody></table></div>` : ''}`);
  }

  // ---------- Pricing (del manual) ----------
  function pricing(b) {
    if (!eco) return mount(b, html`<div class="warnbox">No pude leer la economía del repo: ${ecoErr || 'sin datos'}</div>`);
    const rubros = [...new Set(eco.plans.flatMap((p) => p.rubros.map((r) => r.label)))];
    mount(b, html`<div class="grid g4">${eco.plans.map((p, i) => html`<div class="card feat ${['olive', 'terra', 'ink', 'olive'][i]}"><div class="lbl">${p.name}</div><div class="big" style="font-size:40px;margin-top:8px">${Q(p.precio)}</div>${matrix(Math.round((p.margen / 100) * 34))}<div class="foot"><span>Costo ${Q(p.costo)} · ${p.volumen?.piezas ?? '—'} piezas</span><span style="font-weight:700;font-size:14px">${p.margen}% margen</span></div></div>`)}</div>
      <div class="sec-title"><h2>Costo por rubro</h2><span class="mut sm">Fijo por cuenta · del manual</span></div>
      <div class="mut sm" style="margin:-6px 0 10px">✏️ <b>¿Cambiar estos costos?</b> Viven en el manual (<code>inherent/06-ECONOMIA.md</code>): pídeselo a Claude en Claude Code, se actualiza con tu OK y aquí se ve después de publicar. Los costos por hora de cada servicio se editan en Sales → Catálogo → Costos por hora.</div>
      <div class="card"><table><thead><tr><th>Rubro</th>${eco.plans.map((p) => html`<th class="n">${p.name}</th>`)}</tr></thead><tbody>
        ${rubros.map((r) => html`<tr><td>${r}</td>${eco.plans.map((p) => html`<td class="n">${Q(p.rubros.find((x) => x.label === r)?.monto || 0)}</td>`)}</tr>`)}
        <tr><td><b>Costo</b></td>${eco.plans.map((p) => html`<td class="n"><b>${Q(p.costo)}</b></td>`)}</tr>
        <tr><td><b>Utilidad</b></td>${eco.plans.map((p) => html`<td class="n"><b>${Q(p.utilidad)}</b></td>`)}</tr>
      </tbody></table></div>`);
  }

  // ---------- Nómina: el mes de cada persona = Σ (lo que cada cuenta paga a su rol × su % del rol) ----------
  function nomina(b) {
    if (!eco) return mount(b, html`<div class="warnbox">La nómina usa los rubros del manual y no pude leerlo: ${ecoErr || 'sin datos'}</div>`);
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
          <div class="card glass"><span class="mut sm">Nómina del mes</span><div class="big" style="font-size:40px">${Q(total)}</div></div>
          <div class="card glass"><span class="mut sm">Pool de rubros</span><div class="big" style="font-size:40px">${Q(poolT)}</div></div>
          <div class="card glass"><span class="mut sm">Roles sin repartir al 100%</span><div class="big" style="font-size:40px;color:${sin.length ? '#86570e' : 'inherit'}">${sin.length}</div></div>
          <div class="card glass"><span class="mut sm">Montos sin datos</span><div class="big" style="font-size:40px;color:${falta.length ? '#a3392a' : 'inherit'}">${falta.length}</div></div>
        </div>
        <div class="sec-title"><h2>El mes de cada persona</h2><button class="btn ghost" data-act="addP" style="margin-left:auto">+ Persona</button></div>
        <div class="grid g3">${d.personas.map((p) => html`<div class="card"><div class="row"><b style="font-weight:500;font-size:16px">${p.nombre}</b><div class="sp"></div><button class="btn ghost" data-act="rmP" data-id="${p.id}" style="padding:6px 10px">✕</button></div>
          <div class="big" style="font-size:40px;margin-top:6px">${Q(pay[p.id])}</div><div class="mut sm">${total ? Math.round((pay[p.id] / total) * 100) : 0}% de la nómina</div>
          <div class="chips">${Object.entries(d.reparto).filter(([, v]) => v.some((s) => s.p === p.id)).map(([r, v]) => html`<span class="chip">${r} ${v.find((s) => s.p === p.id).pct}%</span>`)}</div>
          ${det[p.id].length ? html`<details style="margin-top:10px"><summary class="sm mut">De dónde sale</summary><table><tbody>${det[p.id].map((x) => html`<tr><td class="sm">${x.c}</td><td class="sm mut">${x.r}</td><td class="n sm">${Q(x.q)}</td></tr>`)}</tbody></table></details>` : ''}</div>`)}</div>
        <div class="sec-title"><h2>Reparto por rol</h2><span class="mut sm">% del rubro entre personas · se define una vez</span></div>
        <div class="grid g3">${rubros.map((r) => { const sp = d.reparto[r] || []; const tot = sp.reduce((a, s) => a + (+s.pct || 0), 0); return html`<div class="card"><div class="row"><b style="font-weight:500">${r}</b><div class="sp"></div><span class="chip ${!sp.length ? '' : Math.abs(tot - 100) < 0.01 ? 'green' : 'amber'}">${sp.length ? tot + '%' : 'sin nadie'}</span></div>
          <div class="mut sm" style="margin:4px 0 10px">pool ${Q(pool[r] || 0)}</div>
          ${sp.map((s, i) => html`<div class="row" style="margin-bottom:6px"><select class="in" data-r="${r}" data-i="${i}" data-f="p">${d.personas.map((p) => html`<option value="${p.id}" ${p.id === s.p ? raw('selected') : ''}>${p.nombre}</option>`)}</select><input class="in" type="number" style="max-width:80px" data-r="${r}" data-i="${i}" data-f="pct" value="${s.pct}"><span class="mut">%</span><button class="btn ghost" data-act="rmS" data-r="${r}" data-i="${i}" style="padding:6px 10px">✕</button></div>`)}
          <button class="btn ghost" data-act="addS" data-r="${r}" style="padding:6px 12px">+ Persona</button></div>`; })}</div>
        <div class="sec-title"><h2>Cuentas</h2><span class="mut sm">Lo que cada cuenta paga a cada rol. Gris = del manual; Tailor Made: escríbelo tú</span><button class="btn ghost" data-act="addC" style="margin-left:auto">+ Cuenta</button></div>
        <div class="card tscroll"><table><thead><tr><th>Cuenta</th><th>Plan</th>${rubros.map((r) => html`<th class="n">${r.replace(/\s*\(.*\)/, '')}</th>`)}<th></th></tr></thead><tbody>
          ${d.cuentas.map((c, ci) => html`<tr><td><b style="font-weight:500">${c.nombre}</b>${c.costoDeclarado != null ? html`<div class="mut sm">🔒 declarado ${Q(c.costoDeclarado)}</div>` : ''}</td>
            <td><select class="in" data-c="${ci}" data-f="plan">${[...plans.map((p) => [p.id, p.name]), ['tailor', 'TAILOR MADE']].map(([v, l]) => html`<option value="${v}" ${v === c.planId ? raw('selected') : ''}>${l}</option>`)}</select></td>
            ${rubros.map((r) => { const pm = plans.find((p) => p.id === c.planId)?.rubros.find((x) => x.label === r)?.monto; return html`<td class="n"><input class="in mini" type="number" data-c="${ci}" data-r="${r}" data-f="monto" value="${c.montos?.[r] ?? ''}" placeholder="${pm ?? 'Q'}"></td>`; })}
            <td><button class="btn ghost" data-act="rmC" data-i="${ci}" style="padding:6px 10px">✕</button></td></tr>`)}
        </tbody></table></div>
        ${falta.length ? html`<div class="warnbox" style="margin-top:12px">⚠️ SIN DATOS — falta el monto: ${falta.slice(0, 8).join(' · ')}${falta.length > 8 ? ' …' : ''}</div>` : ''}
        <div class="row" style="margin-top:16px"><button class="btn" data-act="saveN">Guardar nómina</button></div>`);
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
        try { payroll = payroll ? await P.save({ ...payroll, ...d }) : await P.create({ id: 'default', ...d }); seeded = false; d = JSON.parse(JSON.stringify(payroll)); toast('Nómina guardada ✅'); draw(); }
        catch (err) { toast(err.message, true); }
      }
    };
    draw();
  }

  async function connectSheet() {
    const a = await wizard('Movimientos desde Google Sheets', [
      { k: 'how', q: '¿De dónde salen tus movimientos?', type: 'cards', req: true, opts: [{ v: 'new', i: '✨', l: 'Crear una hoja nueva', d: 'Con las columnas listas, en tu Drive' }, { v: 'link', i: '🔗', l: 'Ya tengo una hoja', d: 'Pega el link' }] },
      { k: 'url', q: 'Pega el link de la hoja', sub: 'Columnas: fecha · tipo (ingreso/gasto) · concepto · monto · categoría · cliente', type: 'text', req: true, ph: 'https://docs.google.com/spreadsheets/d/…', show: (x) => x.how === 'link', v: sheet?.url },
    ], 'Conectar');
    if (!a) return;
    try {
      const r = a.how === 'new' ? await api('finance/sheet', { method: 'POST' }) : await api('finance/sheet', { method: 'PUT', body: { url: a.url } });
      if (a.how === 'new') window.open(r.url, '_blank', 'noopener');
      sheet = await api('finance/sheet').catch((e) => ({ url: r.url, error: e.message }));
      entries = [...manual, ...fromSheet(sheet)]; toast('Google Sheet conectado ✅'); paint();
    } catch (e) { toast(e.message, true); }
  }
  acts(el, {
    tab: (t) => { tab = t.dataset.t; history.replaceState(null, '', '#/finanzas/' + tab); paint(); },
    add: (t) => editEntry(null, t.dataset.type),
    sheet: async () => { if (sheet?.url) return window.open(sheet.url, '_blank', 'noopener'); connectSheet(); },
    sheetset: () => connectSheet(),
    edit: async (t) => {
      const e = entries.find((x) => x.id === t.dataset.id);
      drawer(html`<div class="row"><span class="chip ${e.type === 'ingreso' ? 'green' : 'red'}">${e.type}</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
        <h2>${e.concept}</h2><div class="big" style="font-size:44px;margin-top:10px">${Q(e.amount)}</div>
        <div class="kv"><span>Fecha</span><b style="font-weight:500">${fdate(e.date)}</b><span>Categoría</span><b style="font-weight:500">${e.category || '—'}</b><span>Cliente</span><b style="font-weight:500">${e.client || '—'}</b></div>
        <div class="row"><button class="btn" data-act="ed">Editar</button><button class="btn ghost" data-act="del">Eliminar</button></div>`,
      { ed: () => { closeDrawer(); editEntry(e); }, del: async () => { if (!(await confirmAsk('¿Eliminar este movimiento?'))) return; await F.remove(e.id); entries = entries.filter((x) => x.id !== e.id); manual = entries.filter((x) => !x.sheet); closeDrawer(); paint(); } });
    },
  });
  paint();
}
