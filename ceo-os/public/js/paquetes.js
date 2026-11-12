// Servicios → Paquetes → Por industria: los 108 paquetes por industria con sus fases, horas por rol, tarifas editables, margen y % de crecimiento.
// Solo el CEO (lleva costos). Los ajustes viven en la colección `packages` (id «default»). «Cotizar» arma una cotización con el formato nuevo.
import { html, raw, mount, col, api, toast, Q, $, $$, ico, openClaude } from './core.js';
import { tabla } from './tabla.js';
import { cifrasHtml } from './cifras.js';

const CX = { S: 'Sencillo', M: 'Medio', X: 'Fuerte' };
const rnd = (x, s) => (s > 0 ? Math.round(x / s) * s : Math.round(x));
const N = (n, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('en-US');
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

export async function packagesTab(body, { onQuote, bun }) {
  mount(body, html`<div class="mut">Cargando paquetes…</div>`);
  // Los paquetes y sus reglas de costo los entrega el servidor, solo al CEO (antes estaban en public/: cualquiera los bajaba).
  let data, DEF;
  try { const r = await api('internos/paquetes'); data = r.data; DEF = () => JSON.parse(JSON.stringify(r.def)); } catch (e) { return mount(body, html`<div class="warnbox">${e.message}</div>`); }
  const saved = await col('packages').get('default').catch(() => null);
  const P = data.p, IND = Object.fromEntries(data.ind.map((i) => [i.id, i.n])), PB = Object.fromEntries(P.map((p) => [p.id, p]));
  const D = col('packages');
  let S = Object.assign(DEF(), saved || {}), exists = !!saved, sub = 'pk', SEL = 'bm-arranque', F = { ind: '', q: '', std: false };
  let tm; const save = () => { clearTimeout(tm); tm = setTimeout(async () => { try { const r = exists ? await D.save(S) : await D.create(S); exists = true; S = Object.assign(S, { id: 'default' }); void r; } catch (e) { toast(e.message, true); } }, 500); };

  const ov = (id) => S.ov[id] || (S.ov[id] = {});
  const eff = (p) => { const o = S.ov[p.id] || {}; return { ...p, ph: o.ph || p.ph, cx: o.cx || p.cx, mt: o.mt ?? p.mt, mo: o.mo || p.mo || {}, pct: o.pct ?? S.sc.pct, fixed: +(o.fixed ?? p.fixed ?? 0) || 0, otros: +(o.otros ?? p.otros ?? 0) || 0, desc: o.desc ?? p.dsc ?? '', edited: !!(o.ph || o.cx || o.mt != null || o.mo || o.pct != null || o.fixed != null || o.otros != null || o.desc != null) }; };
  // Si el paquete ya tiene sus servicios, el precio, el costo y las horas salen de ellos. Solo un «Precio fijo» que pongas tú lo cambia.
  function calc(p) {
    const c = calc0(p), b = linked(p.id); if (!b || !(b.lines || []).length) return c;
    const t = bun.totals(b), own = +(S.ov[p.id]?.fixed || 0), price = own > 0 ? own : t.price, direct = t.cost + c.e.otros, margin = price - direct;
    return { ...c, svc: t, price, direct, ovh: 0, margin, pct: price ? (margin / price) * 100 : 0, hours: t.hours, eph: t.hours ? price / t.hours : 0 };
  }
  function calc0(p) {
    const e = eff(p), hr = {};
    e.ph.forEach((f) => Object.entries(f.h || {}).forEach(([r, v]) => (hr[r] = (hr[r] || 0) + (+v || 0))));
    let cost = 0, dirV = 0; const by = {};
    for (const r of S.roles) { const h = hr[r.id] || 0; if (!h) continue; if (r.dir) { dirV = h * S.dirVal; by[r.id] = { h, cost: 0, val: dirV }; } else { cost += h * r.c; by[r.id] = { h, cost: h * r.c, val: h * r.c * S.markup }; } }
    const cxm = S.cx[e.cx] || 1, ment = e.mt * S.mentor;
    let price = rnd((cost * S.markup + dirV) * cxm + ment, S.round); if (e.fixed > 0) price = e.fixed;
    const direct = cost + ment + e.otros, ovh = (price * S.ovh) / 100, margin = price - direct - ovh;
    const hours = Object.values(hr).reduce((a, b) => a + b, 0);
    let mc = 0, md = 0, mh = 0; for (const r of S.roles) { const h = +(e.mo[r.id] || 0); if (!h) continue; mh += h; r.dir ? (md += h * S.dirVal) : (mc += h * r.c); }
    return { e, hr, by, cost, dirV, cxm, ment, price, direct, ovh, margin, pct: price ? (margin / price) * 100 : 0, hours, eph: hours ? price / hours : 0, monthly: mh ? rnd(mc * S.markup + md, 250) : 0, mh, mCost: mc };
  }
  const phCalc = (f, e) => { let h = 0, val = 0; for (const r of S.roles) { const x = +(f.h?.[r.id] || 0); if (!x) continue; h += x; val += r.dir ? x * S.dirVal : x * r.c * S.markup; } return { h, val: val * (S.cx[e.cx] || 1) }; };
  function justify(p, c) { const s = S.sc, e = c.e, extra = (s.base * s.gr) / 100, util = (extra * s.marg) / 100, fee = (extra * e.pct) / 100, canFee = p.mod.includes('growth_partnership'), net = util - (canFee ? fee : 0) - c.monthly; return { extra, util, fee, canFee, net, pay: net > 0 ? c.price / net : null, need6: c.price / 6 / (s.marg / 100), feeTotal: canFee ? fee * s.months : 0 }; }

  const items = () => { const q = F.q.trim().toLowerCase(); return P.filter((p) => (!F.ind || p.ind === F.ind) && (!F.std || p.st === 'standard') && (!q || p.n.toLowerCase().includes(q))); };

  // El detalle de un paquete. Tarjeta solo arriba: el paquete elegido (se cotiza desde ahí). Lo demás es documento:
  // fases como timeline, qué recibe como lista, de dónde sale el precio como tabla y el escenario como cifras.
  function vDetail(p, c) {
    const e = c.e, j = justify(p, c);
    const MODES = { project: 'Project', operations: 'Operations', growth_partnership: 'Growth Partnership' };
    const roleRows = S.roles.filter((r) => c.hr[r.id]).map((r) => { const b = c.by[r.id]; return html`<tr><th scope="row">${r.n}</th><td class="n" data-l="Horas">${N(b.h)}</td><td class="n" data-l="Costo/h">${r.dir ? 'capacidad' : Q(r.c)}</td><td class="n" data-l="Costo">${Q(b.cost)}</td><td class="n" data-l="Cobro">${Q(b.val * c.cxm)}</td></tr>`; });
    const cabPrecio = html`<thead><tr><th scope="col">Rol</th><th scope="col" class="n">Horas</th><th scope="col" class="n">Costo/h</th><th scope="col" class="n">Costo</th><th scope="col" class="n">Cobro</th></tr></thead>`;
    return html`
      <div class="card feat olive vpp-elegido">
        <div class="row" style="align-items:flex-start;gap:16px;flex-wrap:wrap"><div class="grow" style="min-width:240px"><div class="lbl">${IND[p.ind]} · ${p.cat === 'growth' ? 'Growth Solution' : 'Operations Solution'}</div><h2 style="margin:4px 0 6px;font-size:26px;font-weight:500">${p.n}</h2><div style="opacity:.8">${p.d}</div>
          <div style="margin-top:10px">${p.st === 'standard' ? html`<span class="chip">Prioritario</span> ` : html`<span class="chip">Sujeto a diagnóstico</span> `}${p.mod.map((m) => html`<span class="chip">${MODES[m]}</span> `)}${e.edited ? html`<span class="chip">Ajustado</span>` : ''}</div></div>
          <div style="text-align:right"><div class="lbl">Precio del proyecto</div><div class="big" style="font-size:46px">${Q(c.price)}</div><div style="opacity:.75" class="sm">${c.monthly ? '+ ' + Q(c.monthly) + '/mes de operación' : 'sin operación mensual'}</div></div></div>
        <div class="split" style="margin-top:16px"><div><span class="lbl">Costo directo</span><b>${Q(c.direct)}</b></div><div><span class="lbl">Margen</span><b>${Q(c.margin)} · ${N(c.pct, 0)}%</b></div><div><span class="lbl">Horas</span><b>${N(c.hours)} h</b></div><div><span class="lbl">Precio por hora</span><b>${Q(c.eph)}</b></div></div>
        <div class="foot" style="margin-top:18px;opacity:1"><button class="btn ghost" data-pk="quote">Cotizar este paquete →</button>${e.edited ? html`<button class="btn ghost" data-pk="reset" >Volver a lo original</button>` : ''}</div>
      </div>

      ${bun ? bun.servicesCard(linked(p.id), p.id) : ''}
      <section class="vpp-sec" style="margin-top:22px"><div class="vpp-h"><h2>Cómo se desarrolla</h2><span class="vpp-n">${e.ph.length} fases</span><span class="vpp-sp"></span>
        <label class="sm mut">Complejidad <select class="in" style="width:auto" data-pk-in="cx">${Object.entries(CX).map(([k, l]) => html`<option value="${k}" ${k === e.cx ? raw('selected') : ''}>${l} ×${S.cx[k]}</option>`)}</select></label>
        <label class="sm mut">Mentor (sesiones) <input class="in" style="width:70px" type="number" min="0" data-pk-in="mt" value="${e.mt}"></label></div>
        <p class="vpp-ayuda" style="margin:0 0 8px">Cambia horas y texto; el precio se mueve solo.</p>
        <ol class="vpp-tl">${e.ph.map((f, i) => { const pc = phCalc(f, e); return html`<li><span class="vpp-no" aria-hidden="true">${i + 1}</span><details ${i === 0 ? raw('open') : ''}><summary><b>${f.n}</b><span class="mut sm">semanas <input class="in" style="width:64px;display:inline-block" data-pk-w="${i}" value="${f.w}" aria-label="Semanas de ${f.n}"></span><span class="sp"></span><span>${Q(pc.val)} <span class="mut sm">· ${N(pc.h)} h</span></span></summary>
          <div class="vpp-tlb"><label class="sm mut">Qué se hace en esta fase<textarea class="in" data-pk-t="${i}">${f.t}</textarea></label>
          <div class="sm mut">Responsable: ${f.r || '—'} · Se acepta cuando: ${f.a || '—'}</div>
          <div class="pkgrid">${S.roles.map((r) => html`<label class="sm mut">${r.n}<input class="in" type="number" min="0" step="0.5" data-pk-h="${i}|${r.id}" value="${+(f.h?.[r.id] || 0)}"></label>`)}</div>
          <div><button class="btn ghost sm" data-pk="delph" data-i="${i}">Quitar fase</button></div></div></details></li>`; })}</ol>
        <div style="margin-top:8px"><button class="btn ghost sm" data-pk="addph">+ Fase</button></div></section>

      <div class="vpp-cols" style="--vpp-c:2">
        <section class="vpp-sec"><div class="vpp-h"><h2>Qué recibe el cliente</h2><span class="vpp-n">${p.inc.length}</span></div><ul class="svinc">${p.inc.map((x) => html`<li><b style="font-weight:500">${x[0]}</b> — ${x[1]}<div class="mut sm">Se mide: ${x[2]}</div></li>`)}</ul>${p.opt.length ? html`<div class="sm"><b style="font-weight:500">Opcional:</b> ${p.opt.join(' · ')}</div>` : ''}<div class="sm mut" style="margin-top:6px"><b style="font-weight:500">No incluye:</b> ${p.ex.join(' · ')}</div></section>
        ${p.med ? html`<section class="vpp-sec"><div class="vpp-h"><h2>Medición y pauta</h2></div><ul class="svinc">${p.med.map((x) => html`<li><b style="font-weight:500">${x[0]}</b> — ${x[1]}</li>`)}</ul></section>` : html`<section class="vpp-sec"><div class="vpp-h"><h2>Con qué se entrega</h2></div><div class="chips" style="margin-top:8px">${p.mods.map((m) => html`<span class="chip">${m}</span> `)}</div></section>`}</div>

      <section class="vpp-sec"><div class="vpp-h"><h2>Descripción para el cliente</h2><span class="vpp-sp"></span><button class="btn ghost sm" data-pk="claude">${ico('spark', 14)} Crear con Claude</button></div><p class="vpp-ayuda">Sale en la cotización antes del precio: qué recibe y cómo se traduce en crecimiento.</p><textarea class="in" style="min-height:${p.custom ? 340 : 110}px" data-pk-in="desc" placeholder="Qué recibe el cliente y qué crecimiento busca." aria-label="Descripción para el cliente">${e.desc}</textarea></section>

      <section class="vpp-sec"><div class="vpp-h"><h2>Precio de venta y otros costos</h2></div><p class="vpp-ayuda" title="Con precio fijo, el margen se calcula sobre ese precio. En 0, el precio sale de las horas.">Precio fijo en 0 = el precio sale de las horas.</p>
        <div class="pkgrid"><label class="sm mut">Precio fijo (Q)<input class="in" type="number" min="0" step="50" data-pk-in="fixed" value="${c.svc ? +(S.ov[p.id]?.fixed || 0) : e.fixed || 0}"></label><label class="sm mut">Otros costos (Q)<input class="in" type="number" min="0" step="10" data-pk-in="otros" value="${e.otros || 0}"></label><label class="sm mut">En dólares (US$1 = Q7.70)<input class="in" disabled value="${N(c.price / 7.7, 0)}"></label></div></section>

      ${c.svc ? (() => { const by = {}; c.svc.ls.forEach((x) => (x.roles || []).forEach((r) => { const o = by[r.role] || (by[r.role] = { h: 0, c: 0 }); o.h += r.hours; o.c += r.cost || 0; })); const mg = bun.margin;
        return html`<section class="vpp-sec"><div class="vpp-h"><h2>De dónde sale el precio</h2><span class="vpp-n">margen ${Math.round(mg * 100)}%</span></div><p class="vpp-ayuda">De los servicios del paquete: horas por rol × costo por hora.</p>
        <div class="tdn"><table><caption class="tdn-sr">De dónde sale el precio</caption>${cabPrecio}<tbody>${Object.entries(by).map(([r, o]) => html`<tr><th scope="row">${r}</th><td class="n" data-l="Horas">${N(o.h)}</td><td class="n" data-l="Costo/h">${Q(o.h ? o.c / o.h : 0)}</td><td class="n" data-l="Costo">${Q(o.c)}</td><td class="n" data-l="Cobro">${Q(o.c / (1 - mg))}</td></tr>`)}${c.svc.ls.filter((x) => !x.roles?.length && x.cost).map((x) => html`<tr><th scope="row">${x.name}</th><td class="n" data-l="Horas">—</td><td class="n" data-l="Costo/h">—</td><td class="n" data-l="Costo">${Q(x.cost)}</td><td class="n" data-l="Cobro">${Q(x.price)}</td></tr>`)}${e.otros ? html`<tr><th scope="row">Otros costos</th><td class="n" data-l="Horas">—</td><td class="n" data-l="Costo/h">—</td><td class="n" data-l="Costo">${Q(e.otros)}</td><td class="n" data-l="Cobro">—</td></tr>` : ''}</tbody></table></div>
        <p class="mut sm" style="margin-top:10px">Precio = suma de los servicios ${Q(c.svc.price)}${+(S.ov[p.id]?.fixed || 0) > 0 ? ` · usas precio fijo ${Q(S.ov[p.id].fixed)}` : ''} · Margen = precio − costo directo</p></section>`; })() : html`<section class="vpp-sec"><div class="vpp-h"><h2>De dónde sale el precio</h2></div>
        <div class="tdn"><table><caption class="tdn-sr">De dónde sale el precio</caption>${cabPrecio}<tbody>${roleRows}${e.otros ? html`<tr><th scope="row">Otros costos</th><td class="n" data-l="Horas">—</td><td class="n" data-l="Costo/h">—</td><td class="n" data-l="Costo">${Q(e.otros)}</td><td class="n" data-l="Cobro">${Q(e.otros)}</td></tr>` : ''}${c.ment ? html`<tr><th scope="row">Mentor (${e.mt} ses.)</th><td class="n" data-l="Horas">—</td><td class="n" data-l="Costo/h">${Q(S.mentor)}</td><td class="n" data-l="Costo">${Q(c.ment)}</td><td class="n" data-l="Cobro">${Q(c.ment)}</td></tr>` : ''}</tbody><tfoot><tr><td><b>Total</b></td><td class="n" data-l="Horas"><b>${N(c.hours)}</b></td><td class="n"></td><td class="n" data-l="Costo"><b>${Q(c.direct)}</b></td><td class="n" data-l="Cobro"><b>${Q(c.price)}</b></td></tr></tfoot></table></div>
        <details class="vpp-ayuda" style="margin-top:10px"><summary>La fórmula</summary>Precio = (costo del equipo ${Q(c.cost)} × markup ${S.markup} + dirección ${Q(c.dirV)}) × complejidad ${c.cxm} + mentor ${Q(c.ment)} · Margen = precio − costo directo − overhead ${S.ovh}%</details></section>`}

      <section class="vpp-sec"><div class="vpp-h"><h2>¿Se justifica?</h2><span class="vpp-n" title="Cambia el escenario del cliente. Los números son de ejemplo.">escenario de ejemplo</span></div>
        <div class="pkgrid"><label class="sm mut">Venta mensual actual (Q)<input class="in" type="number" step="1000" data-pk-sc="base" value="${S.sc.base}"></label><label class="sm mut">Crecimiento esperado (%)<input class="in" type="number" data-pk-sc="gr" value="${S.sc.gr}"></label><label class="sm mut">Margen del cliente (%)<input class="in" type="number" data-pk-sc="marg" value="${S.sc.marg}"></label><label class="sm mut">Meses de cobro del %<input class="in" type="number" data-pk-sc="months" value="${S.sc.months}"></label></div>
        <div style="margin-top:12px">${cifrasHtml([{ t: 'Venta extra al mes', v: Q(j.extra) }, { t: 'Utilidad extra al mes', v: Q(j.util) }, { t: 'Para pagarse en 6 meses', v: `${Q(j.need6)}/mes` }, { t: 'Se paga en', v: j.pay ? `${N(j.pay, 1)} meses` : 'no se recupera', tono: j.pay && j.pay <= 12 ? 'ok' : 'bad', nota: j.pay ? `${Q(c.price)} contra ${Q(j.net)} netos al mes` : 'sube el crecimiento o baja el precio' }], { etiqueta: 'Lo que el cliente gana' })}</div></section>

      <section class="vpp-sec"><div class="vpp-h"><h2>Growth Partnership</h2></div>
        <div class="vpp-cols" style="--vpp-c:2"><div>${j.canFee ? html`<label class="sm mut">% del crecimiento atribuido<input class="in" type="number" step="0.5" data-pk-in="pct" value="${e.pct}"></label>${cifrasHtml([{ t: 'Fee por mes', v: Q(j.fee) }, { t: `Fee en ${S.sc.months} meses`, v: Q(j.feeTotal) }], { etiqueta: 'Fee por crecimiento', clase: 'cfr-s' })}<div class="sm"><b style="font-weight:500">Cómo se mide limpio:</b> ${p.att || '—'}</div>` : html`<div class="warnbox sm">Este paquete <b>no admite cobro por resultado</b>${p.id.includes('investor') ? ': captar dinero del público sin autorización es delito en Guatemala' : ': no hay forma de atribuir la venta limpia'}. Solo se cobra el proyecto.</div>`}</div>
          <div><div class="sm mut" style="margin-bottom:6px">Horas de operación al mes</div><div class="pkgrid">${S.roles.map((r) => html`<label class="sm mut">${r.n}<input class="in" type="number" min="0" step="0.5" data-pk-m="${r.id}" value="${+(e.mo[r.id] || 0)}"></label>`)}</div><div class="sm" style="margin-top:8px">Operación mensual: <b style="font-weight:500">${c.monthly ? Q(c.monthly) : '—'}</b></div></div></div></section>`;
  }

  const own = () => (bun?.list || []).filter((b) => !b.pkg && (!F.q.trim() || b.name.toLowerCase().includes(F.q.trim().toLowerCase())));
  const linked = (id) => (bun?.list || []).find((b) => b.pkg === id);
  function vBundle(b) {
    const t = bun.totals(b);
    return html`<div class="card feat olive vpp-elegido"><div class="row" style="align-items:flex-start;gap:16px;flex-wrap:wrap"><div class="grow" style="min-width:240px"><div class="lbl">${b.industry || 'Sin industria'} · Paquete propio</div><h2 style="margin:4px 0 6px;font-size:26px;font-weight:500">${b.name}</h2><div style="opacity:.8">${b.desc || ''}</div></div>
        <div style="text-align:right"><div class="lbl">Precio del paquete</div><div class="big" style="font-size:46px">${Q(t.price)}</div></div></div>
      <div class="foot" style="margin-top:18px;opacity:1"><button class="btn ghost" data-pk="bquote" data-id="${b.id}">Cotizar este paquete →</button></div></div>
      ${bun.servicesCard(b)}
      ${(b.phases || []).filter((f) => f.n).length ? html`<section class="vpp-sec" style="margin-top:22px"><div class="vpp-h"><h2>Cómo se desarrolla</h2><span class="vpp-n">${b.phases.filter((f) => f.n).length} fases</span></div><ol class="vpp-tl">${b.phases.filter((f) => f.n).map((f, i) => html`<li><span class="vpp-no" aria-hidden="true">${i + 1}</span><div class="row" style="min-height:34px"><b style="font-weight:500">${f.n}</b><div class="sp"></div><span class="mut sm">${f.w ? `Semanas ${f.w}` : ''}</span></div></li>`)}</ol></section>` : ''}`;
  }
  function vPk() {
    const list = items(), mine = own(), bsel = SEL.startsWith('b:') ? mine.find((b) => 'b:' + b.id === SEL) : null, p = bsel ? null : PB[SEL] || list[0];
    return html`<div class="pk">
      <aside class="pklist vpp-lado" aria-label="Paquetes"><div style="display:grid;gap:8px"><select class="in" data-pk-f="ind" aria-label="Industria"><option value="">Todas las industrias</option>${data.ind.map((i) => html`<option value="${i.id}" ${F.ind === i.id ? raw('selected') : ''}>${i.n}</option>`)}</select><input class="in" type="search" placeholder="Buscar paquete" data-pk-f="q" value="${F.q}" aria-label="Buscar paquete"><label class="sw-row"><input type="checkbox" class="switch" data-pk-f="std" ${F.std ? raw('checked') : ''}> Solo prioritarios ${ico('star', 13)}</label></div>
        ${bun ? html`<button class="btn" style="width:100%;margin-top:10px" data-pk="bnew">+ Paquete</button>` : ''}
        ${mine.length ? html`<h3 class="lsd-h" style="margin:14px 0 4px">Tus paquetes <span>${mine.length}</span></h3>${mine.map((b) => html`<button class="pkitem ${'b:' + b.id === SEL ? 'on' : ''}" data-pk="sel" data-id="b:${b.id}" aria-current="${'b:' + b.id === SEL ? 'true' : 'false'}"><span>${b.name}</span><small>${Q(bun.totals(b).price)}</small></button>`)}<h3 class="lsd-h" style="margin:14px 0 4px">Por industria <span>${list.length}</span></h3>` : ''}
        <div style="margin-top:10px">${list.map((x) => html`<button class="pkitem ${x.id === p?.id ? 'on' : ''}" data-pk="sel" data-id="${x.id}" aria-current="${x.id === p?.id ? 'true' : 'false'}"><span>${x.n}${x.st === 'standard' ? ico('star', 13) : ''}</span><small>${Q(calc(x).price)}</small></button>`)}</div></aside>
      <section>${bsel ? vBundle(bsel) : vDetail(p, calc(p))}</section></div>`;
  }
  function vEq() {
    return html`<section class="vpp-sec"><div class="vpp-h"><h2>Equipo y tarifas por hora</h2><span class="vpp-sp"></span><button class="btn sm" data-pk="addrole">+ Rol</button></div>
      <details class="vpp-ayuda"><summary>Costo y cobro</summary>Costo/h es lo que le pagas a la persona. Dirección no cuesta: se valora para que el precio refleje tu tiempo.</details>
      <div class="tdn"><table><caption class="tdn-sr">Equipo y tarifas por hora</caption><thead><tr><th scope="col">Rol</th><th scope="col" class="n">Costo/h (Q)</th><th scope="col" class="n">Cobro/h (medio)</th><th scope="col" class="tdn-a"><span class="tdn-sr">Quitar</span></th></tr></thead><tbody>${S.roles.map((r) => html`<tr class="tdn-f"><td class="tdn-t"><input class="in" data-pk-rn="${r.id}" value="${r.n}" aria-label="Nombre del rol"></td><td class="n" data-l="Costo/h (Q)"><input class="in" style="text-align:right;max-width:110px" type="number" min="0" step="10" data-pk-rc="${r.id}" value="${r.dir ? S.dirVal : r.c}" aria-label="Costo por hora de ${r.n}"></td><td class="n" data-l="Cobro/h">${r.dir ? 'valor de tu tiempo' : Q(r.c * S.markup)}</td><td class="tdn-a">${r.dir ? '' : html`<button class="btn-icon" data-pk="delrole" data-id="${r.id}" title="Quitar" aria-label="Quitar ${r.n}">${ico('x', 15)}</button>`}</td></tr>`)}</tbody></table></div></section>
      <section class="vpp-sec"><div class="vpp-h"><h2>Reglas generales</h2></div><div class="pkgrid"><label class="sm mut">Markup sobre costo<input class="in" type="number" step="0.1" data-pk-g="markup" value="${S.markup}"></label><label class="sm mut">Overhead o buffer (%)<input class="in" type="number" data-pk-g="ovh" value="${S.ovh}"></label><label class="sm mut">Valor/h de dirección (Q)<input class="in" type="number" step="10" data-pk-g="dirVal" value="${S.dirVal}"></label><label class="sm mut">Mentor por sesión (Q)<input class="in" type="number" step="100" data-pk-g="mentor" value="${S.mentor}"></label><label class="sm mut">Redondear precio a (Q)<input class="in" type="number" data-pk-g="round" value="${S.round}"></label></div>
        <div class="sm mut" style="margin:14px 0 6px">Multiplicador de complejidad</div><div class="pkgrid"><label class="sm mut">Sencillo ×<input class="in" type="number" step="0.05" data-pk-cx="S" value="${S.cx.S}"></label><label class="sm mut">Medio ×<input class="in" type="number" step="0.05" data-pk-cx="M" value="${S.cx.M}"></label><label class="sm mut">Fuerte ×<input class="in" type="number" step="0.05" data-pk-cx="X" value="${S.cx.X}"></label></div>
        <div class="sm mut" style="margin:14px 0 6px">% de crecimiento por defecto</div><div class="pkgrid"><label class="sm mut">% del crecimiento atribuido<input class="in" type="number" step="0.5" data-pk-sc="pct" value="${S.sc.pct}"></label></div></section>`;
  }
  // Los 108 lado a lado: tabla comparativa ordenable. La fila abre el paquete.
  const filasRs = () => P.map((p) => ({ id: p.id, p, c: calc(p) })).filter((x) => (!F.ind || x.p.ind === F.ind) && (!F.std || x.p.st === 'standard'));
  function vRs() {
    return html`<section class="vpp-sec"><div class="vpp-h"><h2>Los ${filasRs().length} paquetes</h2><span class="vpp-sp"></span><select class="in" style="width:auto" data-pk-f="ind" aria-label="Industria"><option value="">Todas las industrias</option>${data.ind.map((i) => html`<option value="${i.id}" ${F.ind === i.id ? raw('selected') : ''}>${i.n}</option>`)}</select></div><div id="tPkRs"></div></section>`;
  }
  function tablaRs() {
    const box = $('#tPkRs', body); if (!box) return;
    tabla(box, {
      etiqueta: 'Los paquetes por industria, lado a lado', filas: filasRs(), orden: { k: 'price', dir: 'desc' },
      abrir: (x) => { SEL = x.id; sub = 'pk'; paint(); scrollTo(0, 0); },
      vacio: { icono: 'inbox', titulo: 'Sin paquetes con ese filtro', linea: 'Cambia la industria.' },
      cols: [
        { k: 'n', t: 'Paquete', orden: (x) => x.p.n, celda: (x) => html`<b>${x.p.n}</b>${x.p.st === 'standard' ? html` ${ico('star', 13)}` : ''}` },
        { k: 'ind', t: 'Industria', orden: (x) => IND[x.p.ind], celda: (x) => IND[x.p.ind] },
        { k: 'price', t: 'Precio', num: true, orden: (x) => x.c.price, celda: (x) => Q(x.c.price) },
        { k: 'pct', t: 'Margen', num: true, orden: (x) => x.c.pct, celda: (x) => `${N(x.c.pct, 0)}%` },
        { k: 'hours', t: 'Horas', num: true, orden: (x) => x.c.hours, celda: (x) => N(x.c.hours) },
        { k: 'monthly', t: 'Operación/mes', num: true, orden: (x) => x.c.monthly || null, celda: (x) => (x.c.monthly ? Q(x.c.monthly) : '—') },
      ],
    });
  }
  function paint() {
    const y = scrollY;
    mount(body, html`<div class="tabs" style="margin:0 0 16px"><button class="${sub === 'pk' ? 'on' : ''}" data-pk="sub" data-s="pk">Paquetes</button><button class="${sub === 'eq' ? 'on' : ''}" data-pk="sub" data-s="eq">Equipo y tarifas</button><button class="${sub === 'rs' ? 'on' : ''}" data-pk="sub" data-s="rs">Los 108</button></div>${sub === 'pk' ? vPk() : sub === 'eq' ? vEq() : vRs()}`);
    if (sub === 'rs') tablaRs();
    scrollTo(0, y);
  }
  const ownPh = () => { const o = ov(SEL); if (!o.ph) o.ph = JSON.parse(JSON.stringify(PB[SEL].ph)); return o.ph; };

  body.onclick = (e) => {
    const t = e.target.closest('[data-pk]'); if (!t) return; const a = t.dataset.pk;
    if (a === 'bnew') { bun.edit(null, (r) => { if (r) SEL = 'b:' + r.id; paint(); }); return; }
    if (a === 'bedit') { const b = (bun.list || []).find((x) => x.id === t.dataset.id) || (t.dataset.pkg ? { name: PB[t.dataset.pkg].n, industry: IND[PB[t.dataset.pkg].ind], pkg: t.dataset.pkg } : null); bun.edit(b, (r) => { if (r === null && SEL.startsWith('b:')) SEL = 'bm-arranque'; paint(); }); return; }
    if (a === 'bquote') { bun.quote(bun.list.find((x) => x.id === t.dataset.id)); return; }
    if (a === 'claude') { const p = PB[SEL], b = linked(SEL); openClaude(`Escribe la descripción para el cliente del paquete «${p.n}» (${IND[p.ind]}) de Inherent. Español, de «tú», lenguaje simple, sin jerga, 4 a 6 líneas: qué recibe y cómo se traduce en crecimiento. Háblale de lo que desea, no de servicios.\n\nQué es: ${p.d}\nQué recibe: ${p.inc.map((x) => x[0]).join('; ')}${b ? `\nServicios: ${b.lines.length ? bun.totals(b).ls.map((x) => x.name).join('; ') : ''}` : ''}`); toast('Prompt copiado. Pega el texto aquí cuando esté listo.'); return; }
    if (a === 'sub') { sub = t.dataset.s; paint(); } else if (a === 'sel') { SEL = t.dataset.id; paint(); scrollTo(0, 0); } else if (a === 'go') { SEL = t.dataset.id; sub = 'pk'; paint(); scrollTo(0, 0); }
    else if (a === 'addph') { ownPh().push({ k: 'construccion', n: 'Nueva fase', w: '1', t: 'Describe qué se hace.', r: '', a: '', h: {} }); save(); paint(); }
    else if (a === 'delph') { const ph = ownPh(); if (ph.length > 1) { ph.splice(+t.dataset.i, 1); save(); paint(); } }
    else if (a === 'reset') { delete S.ov[SEL]; save(); paint(); }
    else if (a === 'addrole') { S.roles.push({ id: 'r' + Date.now().toString(36), n: 'Nuevo rol', c: 150 }); save(); paint(); }
    else if (a === 'delrole') { S.roles = S.roles.filter((r) => r.id !== t.dataset.id); save(); paint(); }
    else if (a === 'quote' && linked(SEL)?.lines?.length) { const b = linked(SEL); bun.quote({ ...b, desc: eff(PB[SEL]).desc || b.desc }); }
    else if (a === 'quote') { const p = PB[SEL], c = calc(p), e = c.e; const dsc = String(e.desc || ''), gm = dsc.match(/LO QUE ESTO SE TRADUCE EN CRECIMIENTO\n([\s\S]*?)(?:\n\n[A-ZÁÉÍÓÚ ]{8,}\n|$)/), nm = dsc.match(/LO QUE NO INCLUYE\n([\s\S]*)$/), clean = (t) => t.split('\n').map((l) => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean).join('\n');
    onQuote({ items: [{ name: p.n, description: p.prom || p.d, qty: 1, price: c.price, why: p.ou.map((o) => `${o[0]} — se mide con: ${o[1]}`), includes: [...p.inc.map((x) => `${x[0]}: ${x[1]}`), ...(p.med ? ['Medición de pauta: ' + p.med.map((x) => x[0]).join(', ')] : [])] }, ...(c.monthly ? [{ name: p.n + ' · operación mensual', description: 'Se cobra cada mes.', qty: 1, price: c.monthly, why: [], includes: [] }] : [])], intro: gm ? clean(gm[1]) : dsc, notes: nm ? 'No incluye:\n' + clean(nm[1]) : '' }); }
  };
  body.onchange = (e) => {
    const t = e.target, d = t.dataset; let r = true;
    if (d.pkF) { const k = d.pkF; if (k === 'ind') F.ind = t.value; else if (k === 'q') F.q = t.value; else F.std = t.checked; }
    else if (d.pkW !== undefined) { ownPh()[+d.pkW].w = t.value; r = false; } else if (d.pkT !== undefined) { ownPh()[+d.pkT].t = t.value; r = false; }
    else if (d.pkH) { const [i, rid] = d.pkH.split('|'); const f = ownPh()[+i]; f.h = f.h || {}; f.h[rid] = num(t.value); }
    else if (d.pkM) { const o = ov(SEL); o.mo = Object.assign({}, eff(PB[SEL]).mo); o.mo[d.pkM] = num(t.value); }
    else if (d.pkIn) { const k = d.pkIn, o = ov(SEL); if (k === 'cx') o.cx = t.value; else if (k === 'desc') { o.desc = t.value; r = false; } else if (k === 'mt') o.mt = Math.max(0, Math.round(num(t.value))); else o[k] = num(t.value); }
    else if (d.pkSc) S.sc[d.pkSc] = num(t.value);
    else if (d.pkRn) { S.roles.find((x) => x.id === d.pkRn).n = t.value; r = false; }
    else if (d.pkRc) { const x = S.roles.find((y) => y.id === d.pkRc); x.dir ? (S.dirVal = num(t.value)) : (x.c = num(t.value)); }
    else if (d.pkG) S[d.pkG] = d.pkG === 'markup' ? Math.max(1, num(t.value)) : num(t.value);
    else if (d.pkCx) S.cx[d.pkCx] = num(t.value) || 1;
    else return;
    save(); if (r) paint();
  };
  paint();
}
