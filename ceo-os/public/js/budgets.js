import { html, mount, col, acts, ask, confirmAsk, toast, ico, Q, USD, fdate, fdateLong, today, drawer, closeDrawer, docView, docHead } from './core.js';
import { fallo, vacio } from './visual.js';

// Presupuestos de un cliente (Clientes → Presupuestos): photo shoots, pauta, eventos u otros. Cada uno trae sus renglones
// (concepto · cantidad · costo unitario · quién paga), su total y su estado. Los costos los ven el CEO, el COO y quien edita
// Clientes; a los demás el servidor les manda el presupuesto sin montos. La gráfica «presupuesto vs gastado» sale de Finanzas:
// los egresos del cliente ligados al presupuesto (budget_id) o, en pauta, los de categoría «Pauta» de ese mes.
const B = col('budgets');
export const BTYPES = [['Photo shoot', 'Photo shoot'], ['Ads', 'Ads'], ['Evento', 'Evento'], ['Otro', 'Otro']];
const STATUS = { borrador: ['Borrador', ''], enviado: ['Enviado', 'amber'], aprobado: ['Aprobado', 'green'] };
const NEXT = { borrador: ['enviado', 'Marcar enviado'], enviado: ['aprobado', 'Marcar aprobado'], aprobado: ['borrador', 'Volver a borrador'] };
const PLATFORMS = ['Meta', 'Google', 'TikTok', 'LinkedIn', 'Otra'];
const ticon = (t) => ico(t === 'Photo shoot' ? 'camera' : t === 'Ads' ? 'megaphone' : t === 'Evento' ? 'cal' : 'clipboard');
const money = (b, n) => (b.currency === 'USD' ? USD(n) : Q(n));
const sum = (b, payer) => (b.lines || []).filter((l) => !payer || (l.payer || 'cliente') === payer).reduce((x, l) => x + (l.subtotal ?? (l.qty || 0) * (l.cost || 0)), 0);
// Lo gastado de un presupuesto según Finanzas (solo quien ve Finanzas tiene los movimientos).
export function spentOf(b, entries, slug) {
  const up = String(slug || '').toUpperCase();
  const mine = (entries || []).filter((e) => e.type === 'egreso' && String(e.client || '').toUpperCase() === up);
  const linked = mine.filter((e) => e.budget_id === b.id);
  if (linked.length) return linked.reduce((x, e) => x + (Number(e.amount) || 0), 0);
  if (b.type === 'Ads' && b.month) return mine.filter((e) => e.category === 'Pauta' && String(e.date || '').slice(0, 7) === b.month).reduce((x, e) => x + (Number(e.amount) || 0), 0);
  return null;
}

// ctx: { el, me, slug, name, edit, entries } — entries: los movimientos de Finanzas si la persona los ve; null si no.
export async function budgetsTab({ el, me, slug, name, edit, entries = null }) {
  el.dataset.island = '1';
  mount(el, html`<p class="loading">Cargando…</p>`);
  let list = [];
  try { list = (await B.list()).filter((b) => b.client_slug === slug); } catch (e) { return mount(el, html`${fallo({ titulo: 'No pude leer los presupuestos', linea: e.message })}`); }
  const sort = () => list.sort((a, z) => String(z.date || '').localeCompare(String(a.date || '')));

  const save = async (b) => { try { const r = b.v ? await B.save(b) : await B.create(b); list = [...list.filter((x) => x.id !== r.id), r]; return r; } catch (e) { toast(e.message, true); return null; } };
  const adsF = (b) => [{ k: 'month', l: 'Mes', t: 'month', v: b?.month || today().slice(0, 7), half: true }, { k: 'daily', l: 'Presupuesto diario', t: 'number', v: b?.daily, half: true }, { k: 'platform', l: 'Plataforma', t: 'select', opts: PLATFORMS, v: b?.platform || 'Meta' }];
  const form = async (b) => {
    const base = await ask(b ? 'Editar presupuesto' : 'Crear presupuesto', [{ k: 'type', l: 'Tipo', t: 'select', opts: BTYPES, v: b?.type || 'Photo shoot', half: true }, { k: 'date', l: 'Fecha', t: 'date', v: b?.date || today(), req: true, half: true }, { k: 'name', l: 'Nombre', v: b?.name, req: true }, { k: 'currency', l: 'Moneda', t: 'select', opts: [['GTQ', 'Quetzales (Q)'], ['USD', 'Dólares ($)']], v: b?.currency || 'GTQ', half: true }, { k: 'note', l: 'Nota', t: 'textarea', v: b?.note }], b ? 'Guardar' : 'Crear');
    if (!base) return null;
    if (base.type === 'Ads') { const a = await ask('Pauta: mes, diario y plataforma', adsF(b), 'Listo'); if (!a) return null; Object.assign(base, a); }
    return base;
  };

  function chart() {
    if (!list.length) return '';
    if (!entries) return html`<div class="card" style="margin-bottom:16px"><h3 class="ttl">${ico('chart')} Presupuesto vs gastado</h3><div class="mut sm" style="margin-top:4px">Vendrá de Finanzas: los egresos de ${name} ligados a cada presupuesto. Tu perfil no ve Finanzas, así que aquí no hay montos gastados.</div></div>`;
    const rows = list.map((b) => ({ b, spent: spentOf(b, entries, slug) }));
    if (!rows.some((r) => r.spent != null)) return html`<div class="card" style="margin-bottom:16px"><h3 class="ttl">${ico('chart')} Presupuesto vs gastado</h3><div class="mut sm" style="margin-top:4px">Todavía no hay movimientos de Finanzas ligados: un egreso del cliente con el presupuesto (budget_id) o, en pauta, los de categoría «Pauta» del mes.</div></div>`;
    const max = Math.max(...rows.map((r) => Math.max(r.b.total || 0, r.spent || 0)), 1);
    return html`<div class="card" style="margin-bottom:16px"><h3 class="ttl">${ico('chart')} Presupuesto vs gastado</h3>
      <div class="hbars" style="margin-top:10px">${rows.map(({ b, spent }) => html`<div class="hbar"><span class="hl">${b.name}</span><div style="display:grid;gap:3px"><div class="gbar" style="margin:0"><i style="width:${Math.round(((b.total || 0) / max) * 100)}%;background:#d9cdbd"></i></div><div class="gbar" style="margin:0"><i style="width:${Math.round(((spent || 0) / max) * 100)}%;background:${spent > (b.total || 0) ? '#8c4a3a' : 'var(--ink)'}"></i></div></div><span class="ht">${money(b, b.total)} · ${spent == null ? html`<span class="mut">sin gasto ligado</span>` : html`gastado ${money(b, spent)}`}</span></div>`)}</div>
      <div class="barlegend"><span><i style="background:#d9cdbd"></i> Presupuesto</span><span><i style="background:var(--ink)"></i> Gastado</span></div></div>`;
  }
  const card = (b) => { const [sl, sc] = STATUS[b.status] || STATUS.borrador; return html`<div class="card bdg" data-act="open" data-id="${b.id}">
      <div class="row" style="gap:8px"><span class="chip">${ticon(b.type)} ${b.type}</span><span class="chip ${sc}">${sl}</span><div class="sp"></div><span class="mut sm">${fdate(b.date)}</span></div>
      <b style="font-weight:500;font-size:17px;letter-spacing:-.3px">${b.name}</b>
      ${b.type === 'Ads' ? html`<div class="mut sm">${[b.platform, b.month && 'mes ' + b.month, b.daily != null && !b.costs_hidden && money(b, b.daily) + ' / día'].filter(Boolean).join(' · ')}</div>` : ''}
      <div class="big">${b.costs_hidden ? html`<span class="mut" style="font-size:16px;letter-spacing:0">Sin montos para tu perfil</span>` : money(b, b.total)}</div>
      <div class="bl"><span>${(b.lines || []).length} renglón${(b.lines || []).length === 1 ? '' : 'es'}</span><span>${b.costs_hidden ? '' : `cliente ${money(b, sum(b, 'cliente'))} · Inherent ${money(b, sum(b, 'inherent'))}`}</span></div></div>`; };

  function paint() {
    sort();
    mount(el, html`<div class="row" style="margin-bottom:12px;flex-wrap:wrap;gap:8px"><span class="mut sm">Photo shoots, pauta y eventos de ${name}: qué cuesta, quién lo paga y en qué estado va.</span><div class="sp"></div>${edit ? html`<button class="btn" data-act="new">${ico('plus')} Crear presupuesto</button>` : ''}</div>
      ${chart()}
      ${list.length ? html`<div class="grid g3">${list.map(card)}</div>` : html`${vacio({ icono: 'inbox', titulo: 'Sin presupuestos todavía', linea: `${edit ? 'Crea el primero: un photo shoot, la pauta del mes o un evento.' : 'Cuando haya uno, aparece aquí.'}` })}`}`);
  }

  function open(id) {
    const b = list.find((x) => x.id === id); if (!b) return;
    const [sl, sc] = STATUS[b.status] || STATUS.borrador, hid = Boolean(b.costs_hidden);
    drawer(html`<div class="row"><span class="chip">${ticon(b.type)} ${b.type}</span><span class="chip ${sc}">${sl}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>${b.name}</h2><div class="mut sm">${[fdateLong(b.date || today()), b.type === 'Ads' && b.platform, b.type === 'Ads' && b.month && 'mes ' + b.month, b.type === 'Ads' && b.daily != null && !hid && money(b, b.daily) + ' / día'].filter(Boolean).join(' · ')}</div>
      ${hid ? '' : html`<div class="split" style="margin-top:14px"><div><span class="lbl">Total</span><b>${money(b, b.total)}</b></div><div><span class="lbl">Paga el cliente</span><b>${money(b, sum(b, 'cliente'))}</b></div><div><span class="lbl">Paga Inherent</span><b>${money(b, sum(b, 'inherent'))}</b></div></div>`}
      <div class="row" style="margin-top:16px"><b style="font-weight:500">Renglones</b><div class="sp"></div>${edit ? html`<button class="btn ghost xs" data-act="ladd" data-id="${b.id}">+ Renglón</button>` : ''}</div>
      ${(b.lines || []).length ? html`<table class="bdlines"><thead><tr><th>Concepto</th><th>Cant.</th>${hid ? '' : html`<th style="text-align:right">Unitario</th><th style="text-align:right">Subtotal</th>`}<th>Paga</th>${edit ? html`<th></th>` : ''}</tr></thead><tbody>
        ${(b.lines || []).map((l, i) => html`<tr><td>${l.concept}</td><td class="n">${l.qty}</td>${hid ? '' : html`<td class="n">${money(b, l.cost)}</td><td class="n">${money(b, l.subtotal ?? l.qty * l.cost)}</td>`}<td>${(l.payer || 'cliente') === 'inherent' ? 'Inherent' : 'Cliente'}</td>${edit ? html`<td class="n"><button class="sm mut" data-act="ledit" data-id="${b.id}" data-i="${i}">${ico('edit')}</button> <button class="sm mut" data-act="ldel" data-id="${b.id}" data-i="${i}">${ico('x', 16)}</button></td>` : ''}</tr>`)}</tbody></table>`
      : html`<div class="mut sm" style="margin-top:8px">Sin renglones. ${edit ? 'Agrega el primero: concepto, cantidad, costo unitario y quién paga.' : ''}</div>`}
      ${b.note ? html`<div class="mut sm" style="margin-top:14px;white-space:pre-wrap">${b.note}</div>` : ''}
      <div class="row" style="margin-top:18px;flex-wrap:wrap;gap:8px">${hid ? '' : html`<button class="btn ghost xs" data-act="pdf" data-id="${b.id}">↓ PDF</button>`}${edit ? html`<button class="btn ghost xs" data-act="edit" data-id="${b.id}">Editar</button><button class="btn xs" data-act="status" data-id="${b.id}">${NEXT[b.status || 'borrador'][1]}</button><button class="btn ghost xs" data-act="del" data-id="${b.id}">${ico('trash')}</button>` : ''}</div>`, map);
  }
  const lineForm = async (l) => { const v = await ask(l ? 'Editar renglón' : 'Nuevo renglón', [{ k: 'concept', l: 'Concepto', v: l?.concept, req: true }, { k: 'qty', l: 'Cantidad', t: 'number', v: l?.qty ?? 1, req: true, half: true }, { k: 'cost', l: 'Costo unitario', t: 'number', v: l?.cost ?? '', req: true, half: true }, { k: 'payer', l: 'Quién paga', t: 'select', opts: [['cliente', 'El cliente'], ['inherent', 'Inherent']], v: l?.payer || 'cliente' }]); return v; };
  const withLines = async (id, fn) => { const b = list.find((x) => x.id === id); if (!b) return; const lines = await fn([...(b.lines || [])]); if (!lines) return; const r = await save({ ...b, lines }); if (r) { toast('Guardado'); paint(); open(r.id); } };
  function pdf(b) {
    docView(html`${docHead('Presupuesto', html`${name}<br>${fdateLong(b.date || today())}`)}
      <div class="qto"><div><div class="lbl2">CLIENTE</div><b style="font-weight:500;font-size:15px">${name}</b><div>${b.type}${b.type === 'Ads' && b.platform ? ' · ' + b.platform : ''}${b.type === 'Ads' && b.month ? ' · ' + b.month : ''}</div></div>
        <div><div class="lbl2">ESTADO</div><b style="font-weight:500;font-size:15px">${(STATUS[b.status] || STATUS.borrador)[0]}</b>${b.type === 'Ads' && b.daily != null ? html`<div>${money(b, b.daily)} por día</div>` : ''}</div></div>
      <h2 style="font-size:22px;font-weight:500;letter-spacing:-.5px;margin:18px 0 6px">${b.name}</h2>
      <table class="bdlines"><thead><tr><th>Concepto</th><th>Cant.</th><th style="text-align:right">Unitario</th><th style="text-align:right">Subtotal</th><th>Paga</th></tr></thead><tbody>${(b.lines || []).map((l) => html`<tr><td>${l.concept}</td><td class="n">${l.qty}</td><td class="n">${money(b, l.cost)}</td><td class="n">${money(b, l.subtotal ?? l.qty * l.cost)}</td><td>${(l.payer || 'cliente') === 'inherent' ? 'Inherent' : 'Cliente'}</td></tr>`)}</tbody></table>
      <div class="row" style="margin-top:14px;gap:22px;flex-wrap:wrap"><div><div class="lbl2">TOTAL</div><b style="font-size:20px;font-weight:500">${money(b, b.total)}</b></div><div><div class="lbl2">PAGA EL CLIENTE</div><b style="font-size:16px;font-weight:500">${money(b, sum(b, 'cliente'))}</b></div><div><div class="lbl2">PAGA INHERENT</div><b style="font-size:16px;font-weight:500">${money(b, sum(b, 'inherent'))}</b></div></div>
      ${b.note ? html`<div style="color:var(--ink2);font-size:12.5px;margin-top:14px;white-space:pre-wrap">${b.note}</div>` : ''}
      <div class="qfoot"><span>Inherent · Growth Partner</span><span>inherentglobal.com</span></div>`);
  }
  const map = {
    new: async () => { const v = await form(null); if (!v) return; const r = await save({ ...v, client_slug: slug, lines: [], status: 'borrador' }); if (r) { toast('Presupuesto creado'); paint(); open(r.id); } },
    open: (t) => open(t.dataset.id),
    edit: async (t) => { const b = list.find((x) => x.id === t.dataset.id); if (!b) return; const v = await form(b); if (!v) return; const r = await save({ ...b, ...v }); if (r) { toast('Guardado'); paint(); open(r.id); } },
    status: async (t) => { const b = list.find((x) => x.id === t.dataset.id); if (!b) return; const r = await save({ ...b, status: NEXT[b.status || 'borrador'][0] }); if (r) { toast(STATUS[r.status][0]); paint(); open(r.id); } },
    del: async (t) => { const b = list.find((x) => x.id === t.dataset.id); if (!b || !(await confirmAsk(`¿Borrar el presupuesto «${b.name}»?`))) return; try { await B.remove(b.id); list = list.filter((x) => x.id !== b.id); closeDrawer(); toast('Borrado'); paint(); } catch (e) { toast(e.message, true); } },
    ladd: (t) => withLines(t.dataset.id, async (l) => { const v = await lineForm(null); return v ? [...l, v] : null; }),
    ledit: (t) => withLines(t.dataset.id, async (l) => { const v = await lineForm(l[+t.dataset.i]); if (!v) return null; l[+t.dataset.i] = v; return l; }),
    ldel: (t) => withLines(t.dataset.id, async (l) => ((await confirmAsk('¿Quitar este renglón?')) ? l.filter((_, i) => i !== +t.dataset.i) : null)),
    pdf: (t) => { const b = list.find((x) => x.id === t.dataset.id); if (b) pdf(b); },
  };
  acts(el, map);
  paint();
}
