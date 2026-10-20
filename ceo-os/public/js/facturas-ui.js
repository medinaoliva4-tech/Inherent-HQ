// Finanzas → Facturas: lo por cobrar y lo por pagar, con un chip de estado, y el cruce con el estado de cuenta de BAC.
// El CEO lo ve y lo opera todo. Quien ve Finanzas en resumen (el perfil Cobros) solo ve «Por cobrar», sin acciones:
// el servidor tampoco le entrega lo por pagar ni el banco.
import { html, mount, col, api, ask, drawer, closeDrawer, toast, Q, USD, fdate, today, csv, ico } from './core.js';
import { estadoFactura, totales, cruzar, quienFactura, mesLabel, leerEstadoDeCuenta, movimientosBanco, filaEncabezado, filasBanco } from './facturas.js';

const ESTADO = { pendiente: 'Pendiente', vencida: 'Vencida', pagada: 'Pagada', anulada: 'Anulada' };
const money = (i) => (i.currency === 'USD' ? USD(i.amount) : Q(i.amount));
const nextMonth = (m) => { const d = new Date(m + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 7); };
const Mes = (p) => { const s = mesLabel(p); return s.charAt(0).toUpperCase() + s.slice(1); };
const XLS = 'Baja la versión "Archivo separado por comas" en la banca de BAC';

export async function facturasTab(b, { me, clients = [] }) {
  const ceo = me?.role === 'ceo';
  mount(b, html`<p class="loading">Cargando…</p>`);
  let [invs, moves, accounts] = await Promise.all([col('invoices').list().catch((e) => ({ error: e.message })), ceo ? col('bank_moves').list().catch(() => []) : [], col('accounts').list().catch(() => [])]);
  if (!b.isConnected) return;
  if (invs?.error) return mount(b, html`<div class="warnbox">No pude leer las facturas: ${invs.error}</div>`);
  const T = today();
  let gen = null; // lo que dejó la última generación (sin precio, por proyecto)
  const name = (i) => quienFactura(i, accounts);
  const clientOpts = () => { const s = [...new Set([...clients.filter((c) => c.hasPlan !== false).map((c) => c.slug), ...accounts.map((a) => a.slug || String(a.id).replace(/^acc-/, ''))])].filter(Boolean).sort(); return s.map((x) => [x, accounts.find((a) => (a.slug || String(a.id).replace(/^acc-/, '')) === x)?.name || x.toUpperCase()]); };

  function paint() {
    const t = totales(invs, T), pairs = ceo ? cruzar(invs, moves, T) : [];
    const kpis = [['Por cobrar', t.porCobrar, `${t.nPorCobrar} ${t.nPorCobrar === 1 ? 'factura' : 'facturas'}`], ['Vencido', t.vencido, t.nVencidas ? `${t.nVencidas} sin pagar` : 'Al día', t.vencido > 0], ...(ceo ? [['Por pagar este mes', t.porPagarMes, `${t.nPorPagarMes} ${t.nPorPagarMes === 1 ? 'factura' : 'facturas'}`]] : [])];
    mount(b, html`
      <div class="fx-kpis ${ceo ? '' : 'two'}">${kpis.map(([l, v, s, warn]) => html`<div class="fx-kpi ${warn ? 'warn' : ''}"><span class="lbl">${l}</span><b>${Q(v)}</b><span class="mut sm">${s}</span></div>`)}</div>
      ${t.usd ? html`<div class="mut sm fx-note">Los montos en USD se suman a Q7.70.</div>` : ''}
      ${ceo ? html`<div class="fx-acts"><button class="btn" data-fx="gen">Generar cobros del mes</button><button class="btn ghost" data-fx="addpagar">+ Por pagar</button><button class="btn ghost" data-fx="bank">${ico('upload')} Subir estado de cuenta</button></div>` : ''}
      ${pairs.length ? html`<button class="fx-banner" data-fx="cruce">${ico('link')} <span><b>${pairs.length} ${pairs.length === 1 ? 'movimiento del banco empata' : 'movimientos del banco empatan'}</b> con facturas pendientes</span><span class="sp"></span><span class="chip">Revisar</span></button>` : ''}
      ${gen ? html`<div class="fx-gen">${gen.creadas.length ? html`<div>${ico('spark')} ${gen.creadas.length} ${gen.creadas.length === 1 ? 'cobro creado' : 'cobros creados'} para ${mesLabel(gen.period)}.</div>` : html`<div>${ico('spark')} Nada nuevo para ${mesLabel(gen.period)}.</div>`}
        ${gen.sinPrecio.length ? html`<div>${ico('alert')} Sin precio: ${gen.sinPrecio.map((x) => x.nombre).join(' · ')}</div>` : ''}
        ${gen.porProyecto.length ? html`<div>${ico('bulb')} Por proyecto, agrégalos a mano: ${gen.porProyecto.map((x) => x.nombre).join(' · ')}</div>` : ''}</div>` : ''}
      <div class="fx-lists ${ceo ? '' : 'one'}">${lista('cobrar')}${ceo ? lista('pagar') : ''}</div>`);
  }

  function lista(kind) {
    const mine = invs.filter((i) => i.kind === kind);
    const open = mine.filter((i) => ['pendiente', 'vencida'].includes(estadoFactura(i, T))).sort((a, z) => String(a.due).localeCompare(String(z.due)));
    const closed = mine.filter((i) => !open.includes(i)).sort((a, z) => String(z.paid_at || z.due).localeCompare(String(a.paid_at || a.due)));
    return html`<section class="fx-list"><div class="fx-head"><h3>${kind === 'cobrar' ? 'Por cobrar' : 'Por pagar'}</h3><span class="mut sm">${open.length || ''}</span><span class="sp"></span>${ceo && kind === 'cobrar' ? html`<button class="btn ghost xs" data-fx="addcobrar">+ Por cobrar</button>` : ''}</div>
      ${open.length ? open.map(fila) : html`<div class="empty sm"><b>${kind === 'cobrar' ? 'Nada por cobrar' : 'Nada por pagar'}</b>${ceo ? (kind === 'cobrar' ? 'Genera los cobros del mes.' : 'Agrega una con «+ Por pagar».') : 'Todo cobrado.'}</div>`}
      ${closed.length ? html`<details class="fx-closed"><summary class="sm mut">Pagadas y anuladas · ${closed.length}</summary>${closed.slice(0, 30).map(fila)}</details>` : ''}</section>`;
  }
  function fila(i) {
    const e = estadoFactura(i, T), open = e === 'pendiente' || e === 'vencida';
    return html`<div class="fx-row ${e}" data-fx="open" data-id="${i.id}">
      <div class="fx-who"><b>${name(i)}</b><span class="mut sm">${i.concept}</span></div>
      <span class="fx-due mut sm">${e === 'pagada' ? `pagada ${fdate(i.paid_at)}` : fdate(i.due)}</span>
      <b class="fx-amt">${money(i)}</b>
      <span class="chip sm2 fx-st ${e}">${ESTADO[e]}</span>
      ${ceo && open ? html`<button class="btn ghost xs" data-fx="paid" data-id="${i.id}">Marcar pagada</button>` : ''}</div>`;
  }

  // ---------- acciones ----------
  const put = (r) => { invs = invs.some((x) => x.id === r.id) ? invs.map((x) => (x.id === r.id ? r : x)) : [...invs, r]; };
  async function generar() {
    const m = T.slice(0, 7);
    const v = await ask('Generar cobros del mes', [{ k: 'period', l: 'Mes', t: 'select', opts: [[m, Mes(m)], [nextMonth(m), Mes(nextMonth(m))]], v: m }], 'Generar');
    if (!v) return;
    try { gen = await api('finance/cobros', { method: 'POST', body: { period: v.period } }); gen.creadas.forEach(put); toast(gen.creadas.length ? `${gen.creadas.length} ${gen.creadas.length === 1 ? 'cobro creado' : 'cobros creados'}` : 'No había cobros nuevos'); paint(); }
    catch (e) { toast(e.message, true); }
  }
  async function editar(i, kind) {
    kind = i?.kind || kind;
    const f = kind === 'cobrar'
      ? [{ k: 'client', l: 'Cliente', t: 'select', opts: clientOpts(), v: i?.client, req: true }]
      : [{ k: 'vendor', l: 'Proveedor', v: i?.vendor, req: true }];
    const v = await ask(`${i ? 'Editar' : 'Nueva'} factura por ${kind}`, [...f,
      { k: 'concept', l: 'Concepto', v: i?.concept, req: true },
      { k: 'amount', l: 'Monto', t: 'number', v: i?.amount, req: true, half: true }, { k: 'currency', l: 'Moneda', t: 'select', opts: [['GTQ', 'Quetzales'], ['USD', 'Dólares']], v: i?.currency || 'GTQ', half: true },
      { k: 'issued', l: 'Emitida', t: 'date', v: i?.issued || T, half: true }, { k: 'due', l: 'Vence', t: 'date', v: i?.due || '', req: true, half: true },
      { k: 'file_url', l: 'Link al archivo (opcional)', v: i?.file_url || '' }]);
    if (!v) return;
    try { const r = i ? await col('invoices').save({ ...i, ...v }) : await col('invoices').create({ kind, ...v, source: 'manual' }); put(r); toast('Guardada'); paint(); }
    catch (e) { toast(e.message, true); }
  }
  async function pagar(i) {
    const v = await ask(`Marcar pagada · ${name(i)}`, [{ k: 'paid_at', l: 'Fecha del pago', t: 'date', v: T, half: true }, { k: 'bank_ref', l: 'Referencia (opcional)', v: '', half: true }], 'Marcar pagada');
    if (!v) return;
    try { put(await api(`finance/pagada/${encodeURIComponent(i.id)}`, { method: 'POST', body: v })); toast('Pagada'); closeDrawer(); paint(); }
    catch (e) { toast(e.message, true); }
  }
  function abrir(i) {
    const e = estadoFactura(i, T), open = e === 'pendiente' || e === 'vencida';
    drawer(html`<div class="row"><span class="chip fx-st ${e}">${ESTADO[e]}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>${name(i)}</h2><div class="mut">${i.concept}</div><div class="big" style="font-size:44px;margin-top:10px">${money(i)}</div>
      <div class="kv"><span>Tipo</span><b style="font-weight:500">Por ${i.kind}</b><span>Emitida</span><b style="font-weight:500">${fdate(i.issued)}</b><span>Vence</span><b style="font-weight:500">${fdate(i.due)}</b>
        ${i.paid_at ? html`<span>Pagada</span><b style="font-weight:500">${fdate(i.paid_at)}</b>` : ''}${i.bank_ref ? html`<span>Banco</span><b style="font-weight:500">${i.bank_ref}</b>` : ''}
        <span>Origen</span><b style="font-weight:500">${{ auto: 'Generada sola', manual: 'A mano', claude: 'Desde Claude' }[i.source] || '—'}</b>${i.notes ? html`<span>Notas</span><b style="font-weight:500">${i.notes}</b>` : ''}</div>
      ${i.file_url ? html`<a class="btn ghost" href="${i.file_url}" target="_blank" rel="noopener">${ico('doc')} Ver archivo</a>` : ''}
      ${ceo ? html`<div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">${open ? html`<button class="btn" data-act="paid">Marcar pagada</button>` : ''}${i.status !== 'anulada' ? html`<button class="btn ghost" data-act="ed">Editar</button><button class="btn ghost" data-act="void">Anular</button>` : ''}</div>` : ''}`,
    { paid: () => pagar(i), ed: () => { closeDrawer(); editar(i); },
      void: async () => { const v = await ask('¿Anular esta factura?', [], 'Anular'); if (!v) return; try { put(await col('invoices').save({ ...i, status: 'anulada' })); closeDrawer(); toast('Anulada'); paint(); } catch (err) { toast(err.message, true); } } });
  }

  // ---------- el estado de cuenta (BAC) ----------
  async function texto(file) {
    const buf = await file.arrayBuffer();
    try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { return new TextDecoder('windows-1252').decode(buf); }
  }
  async function columnas(rows) {
    const h = filaEncabezado(rows), head = filasBanco(rows)[h] || [];
    const opts = [['-1', '—'], ...head.map((x, k) => [String(k), String(x || '').trim() || `Columna ${k + 1}`])];
    const v = await ask('No reconocí las columnas: escógelas', [{ k: 'fecha', l: 'Fecha', t: 'select', opts, req: true }, { k: 'desc', l: 'Descripción', t: 'select', opts, half: true }, { k: 'ref', l: 'Referencia', t: 'select', opts, half: true },
      { k: 'debito', l: 'Débito', t: 'select', opts, half: true }, { k: 'credito', l: 'Crédito', t: 'select', opts, half: true }, { k: 'monto', l: 'Monto (si va en una sola columna)', t: 'select', opts }], 'Leer movimientos');
    if (!v) return null;
    const cols = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, +x]));
    if (cols.fecha < 0 || (cols.debito < 0 && cols.credito < 0 && cols.monto < 0)) { toast('Hace falta la fecha y el monto (débito, crédito o monto)', true); return null; }
    return movimientosBanco(rows, { fila: h, cols });
  }
  async function banco() {
    const v = await ask('Subir estado de cuenta', [{ k: 'file', l: 'El archivo de BAC (CSV)', t: 'file', accept: '.csv,.xls,.xlsx,text/csv', req: true }], 'Subir');
    if (!v?.file) return;
    if (/\.xlsx?$/i.test(v.file.name)) return toast(XLS, true);
    const txt = await texto(v.file);
    if (/^PK|\u0000|^\s*<(html|table|\?xml)/i.test(txt.slice(0, 200))) return toast(XLS, true);
    const rows = csv(txt), r = leerEstadoDeCuenta(rows);
    const list = r.ok ? r.moves : await columnas(rows);
    if (!list) return;
    if (!list.length) return toast('No encontré movimientos en ese archivo', true);
    try {
      const out = await api('finance/banco', { method: 'POST', body: { moves: list } });
      moves = out.moves; toast(`${out.nuevos} ${out.nuevos === 1 ? 'movimiento nuevo' : 'movimientos nuevos'}${out.repetidos ? ` · ${out.repetidos} ya estaban` : ''}`);
      paint();
      if (cruzar(invs, moves, T).length) cruce(); else toast('Ningún movimiento empata con una factura pendiente');
    } catch (e) { toast(e.message, true); }
  }
  function cruce() {
    const pairs = cruzar(invs, moves, T);
    if (!pairs.length) { closeDrawer(); return; }
    const I = (id) => invs.find((x) => x.id === id), M = (id) => moves.find((x) => x.id === id);
    drawer(html`<div class="row"><span class="chip dark">Banco</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>Cruce con el banco</h2><p class="mut sm" style="margin:4px 0 14px">Mismo monto y fecha cerca del vencimiento. Confirma las que estén bien.</p>
      ${pairs.map((p) => { const i = I(p.invoice_id), m = M(p.move_id); return html`<div class="fx-pair">
        <div><b>${name(i)}</b><span class="mut sm">${i.concept} · vence ${fdate(i.due)}</span><span class="sm">${money(i)}</span></div>
        <span class="fx-arrow">${ico('link')}</span>
        <div><b>${m.type === 'credito' ? 'Crédito' : 'Débito'} · ${fdate(m.date)}</b><span class="mut sm">${m.desc || m.ref || '—'}</span><span class="sm">${Q(m.amount)}</span></div>
        <button class="btn xs" data-act="ok" data-i="${i.id}" data-m="${m.id}">Confirmar</button></div>`; })}
      ${pairs.length > 1 ? html`<div class="row" style="margin-top:14px"><button class="btn" data-act="all">Confirmar todas</button></div>` : ''}`,
    { ok: async (t) => { await uno(t.dataset.i, t.dataset.m); cruce(); },
      all: async () => { for (const p of cruzar(invs, moves, T)) if (!(await uno(p.invoice_id, p.move_id))) break; cruce(); } });
  }
  async function uno(invoice_id, move_id) {
    try { put(await api('finance/cruce', { method: 'POST', body: { invoice_id, move_id } })); moves = moves.map((x) => (x.id === move_id ? { ...x, invoice_id } : x)); toast('Pagada con el banco'); paint(); return true; }
    catch (e) { toast(e.message, true); return false; }
  }

  b.onclick = (e) => {
    const t = e.target.closest('[data-fx]'); if (!t || !b.contains(t)) return;
    const a = t.dataset.fx, i = invs.find((x) => x.id === t.dataset.id);
    if (a === 'paid') { e.stopPropagation(); return i && pagar(i); }
    if (a === 'open') return i && abrir(i);
    if (!ceo) return;
    if (a === 'gen') generar(); if (a === 'addpagar') editar(null, 'pagar'); if (a === 'addcobrar') editar(null, 'cobrar'); if (a === 'bank') banco(); if (a === 'cruce') cruce();
  };
  paint();
}
