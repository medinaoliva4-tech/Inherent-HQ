// Servicios → Paquetes → Por industria: los 108 paquetes por industria con sus fases, horas por rol, tarifas editables, margen y % de crecimiento.
// Solo el CEO (lleva costos). Los ajustes viven en la colección `packages` (id «default»). «Cotizar» arma una cotización con el formato nuevo.
import { html, raw, mount, col, api, toast, Q, $, $$, ico, openClaude } from './core.js';

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

  function vDetail(p, c) {
    const e = c.e, j = justify(p, c);
    const MODES = { project: 'Project', operations: 'Operations', growth_partnership: 'Growth Partnership' };
    const roleRows = S.roles.filter((r) => c.hr[r.id]).map((r) => { const b = c.by[r.id]; return html`<tr><td>${r.n}</td><td class="n">${N(b.h)}</td><td class="n">${r.dir ? 'capacidad' : Q(r.c)}</td><td class="n">${Q(b.cost)}</td><td class="n">${Q(b.val * c.cxm)}</td></tr>`; });
    return html`
      <div class="card feat olive">
        <div class="row" style="align-items:flex-start;gap:16px;flex-wrap:wrap"><div class="grow" style="min-width:240px"><div class="lbl">${IND[p.ind]} · ${p.cat === 'growth' ? 'Growth Solution' : 'Operations Solution'}</div><h2 style="margin:4px 0 6px;font-size:26px;font-weight:500">${p.n}</h2><div style="opacity:.8">${p.d}</div>
          <div style="margin-top:10px">${p.st === 'standard' ? html`<span class="chip">Prioritario</span> ` : html`<span class="chip">Sujeto a diagnóstico</span> `}${p.mod.map((m) => html`<span class="chip">${MODES[m]}</span> `)}${e.edited ? html`<span class="chip">Ajustado</span>` : ''}</div></div>
          <div style="text-align:right"><div class="lbl">Precio del proyecto</div><div class="big" style="font-size:46px">${Q(c.price)}</div><div style="opacity:.75" class="sm">${c.monthly ? '+ ' + Q(c.monthly) + '/mes de operación' : 'sin operación mensual'}</div></div></div>
        <div class="split" style="margin-top:16px"><div><span class="lbl">Costo directo</span><b>${Q(c.direct)}</b></div><div><span class="lbl">Margen</span><b>${Q(c.margin)} · ${N(c.pct, 0)}%</b></div><div><span class="lbl">Horas</span><b>${N(c.hours)} h</b></div><div><span class="lbl">Precio por hora</span><b>${Q(c.eph)}</b></div></div>
        <div class="foot" style="margin-top:18px;opacity:1"><button class="btn cream" data-pk="quote">Cotizar este paquete →</button>${e.edited ? html`<button class="btn ghost" data-pk="reset" style="background:transparent;color:#fdfaf3;border-color:rgba(253,250,243,.4)">Volver a lo original</button>` : ''}</div>
      </div>

      ${bun ? bun.servicesCard(linked(p.id), p.id) : ''}
      <div class="card" style="margin-top:16px"><div class="row" style="flex-wrap:wrap;gap:10px"><div><h3>Cómo se desarrolla</h3><div class="mut sm">${e.ph.length} fases. Cambia horas y texto; el precio se mueve solo.</div></div><div class="sp"></div>
        <label class="sm mut">Complejidad <select class="in" style="width:auto" data-pk-in="cx">${Object.entries(CX).map(([k, l]) => html`<option value="${k}" ${k === e.cx ? raw('selected') : ''}>${l} ×${S.cx[k]}</option>`)}</select></label>
        <label class="sm mut">Mentor (sesiones) <input class="in" style="width:70px" type="number" min="0" data-pk-in="mt" value="${e.mt}"></label></div>
        ${e.ph.map((f, i) => { const pc = phCalc(f, e); return html`<details class="pkph" ${i === 0 ? raw('open') : ''}><summary><span class="no">${i + 1}</span><b>${f.n}</b><span class="mut sm">semanas <input class="in" style="width:70px;display:inline-block" data-pk-w="${i}" value="${f.w}"></span><span class="sp"></span><span>${Q(pc.val)} <span class="mut sm">· ${N(pc.h)} h</span></span></summary>
          <div class="pkbody"><label class="sm mut">Qué se hace en esta fase<textarea class="in" data-pk-t="${i}">${f.t}</textarea></label>
          <div class="sm mut">Responsable: ${f.r || '—'} · Se acepta cuando: ${f.a || '—'}</div>
          <div class="pkgrid">${S.roles.map((r) => html`<label class="sm mut">${r.n}<input class="in" type="number" min="0" step="0.5" data-pk-h="${i}|${r.id}" value="${+(f.h?.[r.id] || 0)}"></label>`)}</div>
          <div><button class="btn ghost xs" data-pk="delph" data-i="${i}">Quitar fase</button></div></div></details>`; })}
        <div style="margin-top:12px"><button class="btn ghost" data-pk="addph">+ Agregar fase</button></div></div>

      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>Qué recibe el cliente</h3><ul class="svinc">${p.inc.map((x) => html`<li><b style="font-weight:500">${x[0]}</b> — ${x[1]}<div class="mut sm">Se mide: ${x[2]}</div></li>`)}</ul>${p.opt.length ? html`<div class="sm"><b style="font-weight:500">Opcional:</b> ${p.opt.join(' · ')}</div>` : ''}<div class="sm mut" style="margin-top:6px"><b style="font-weight:500">No incluye:</b> ${p.ex.join(' · ')}</div></div>
        ${p.med ? html`<div class="card"><h3>Medición y pauta que incluye</h3><div class="mut sm" style="margin-bottom:6px">Qué se mide, en lenguaje simple.</div><ul class="svinc">${p.med.map((x) => html`<li><b style="font-weight:500">${x[0]}</b> — ${x[1]}</li>`)}</ul></div>` : html`<div class="card"><h3>Con qué se entrega</h3><div class="chips" style="margin-top:8px">${p.mods.map((m) => html`<span class="chip">${m}</span> `)}</div></div>`}</div>

      <div class="card" style="margin-top:16px"><div class="row"><h3>Descripción para el cliente</h3><div class="sp"></div><button class="btn ghost xs" data-pk="claude">${ico('spark', 14)} Crear con Claude</button></div><div class="mut sm" style="margin-bottom:8px">Editable. Sale en la cotización antes del precio: qué recibe y cómo se traduce en crecimiento.</div><textarea class="in" style="min-height:${p.custom ? 340 : 110}px" data-pk-in="desc" placeholder="Qué recibe el cliente y qué crecimiento busca.">${e.desc}</textarea></div>

      <div class="card" style="margin-top:16px"><h3>Precio de venta y otros costos</h3><div class="mut sm" style="margin-bottom:8px">Con precio fijo, el margen se calcula sobre ese precio. En 0, el precio sale de las horas.</div>
        <div class="pkgrid"><label class="sm mut">Precio fijo (Q)<input class="in" type="number" min="0" step="50" data-pk-in="fixed" value="${c.svc ? +(S.ov[p.id]?.fixed || 0) : e.fixed || 0}"></label><label class="sm mut">Otros costos (Q)<input class="in" type="number" min="0" step="10" data-pk-in="otros" value="${e.otros || 0}"></label><label class="sm mut">En dólares (US$1 = Q7.70)<input class="in" disabled value="${N(c.price / 7.7, 0)}"></label></div></div>

      ${c.svc ? (() => { const by = {}; c.svc.ls.forEach((x) => (x.roles || []).forEach((r) => { const o = by[r.role] || (by[r.role] = { h: 0, c: 0 }); o.h += r.hours; o.c += r.cost || 0; })); const mg = bun.margin;
        return html`<div class="card" style="margin-top:16px"><h3>De dónde sale el precio</h3><div class="mut sm">De los servicios del paquete: horas por rol × costo por hora, con margen ${Math.round(mg * 100)}%.</div>
        <div class="tw" style="margin-top:10px"><table class="pktab"><thead><tr><th>Rol</th><th class="n">Horas</th><th class="n">Costo/h</th><th class="n">Costo</th><th class="n">Cobro</th></tr></thead><tbody>${Object.entries(by).map(([r, o]) => html`<tr><td>${r}</td><td class="n">${N(o.h)}</td><td class="n">${Q(o.h ? o.c / o.h : 0)}</td><td class="n">${Q(o.c)}</td><td class="n">${Q(o.c / (1 - mg))}</td></tr>`)}${c.svc.ls.filter((x) => !x.roles?.length && x.cost).map((x) => html`<tr><td>${x.name}</td><td class="n">—</td><td class="n">—</td><td class="n">${Q(x.cost)}</td><td class="n">${Q(x.price)}</td></tr>`)}${e.otros ? html`<tr><td>Otros costos</td><td class="n">—</td><td class="n">—</td><td class="n">${Q(e.otros)}</td><td class="n">—</td></tr>` : ''}</tbody></table></div>
        <div class="mut sm" style="margin-top:10px">Precio = suma de los servicios ${Q(c.svc.price)}${+(S.ov[p.id]?.fixed || 0) > 0 ? ` · usas precio fijo ${Q(S.ov[p.id].fixed)}` : ''} · Margen = precio − costo directo</div></div>`; })() : html`<div class="card" style="margin-top:16px"><h3>De dónde sale el precio</h3>
        <div class="tw" style="margin-top:10px"><table class="pktab"><thead><tr><th>Rol</th><th class="n">Horas</th><th class="n">Costo/h</th><th class="n">Costo</th><th class="n">Cobro</th></tr></thead><tbody>${roleRows}${e.otros ? html`<tr><td>Otros costos</td><td class="n">—</td><td class="n">—</td><td class="n">${Q(e.otros)}</td><td class="n">${Q(e.otros)}</td></tr>` : ''}${c.ment ? html`<tr><td>Mentor (${e.mt} ses.)</td><td class="n">—</td><td class="n">${Q(S.mentor)}</td><td class="n">${Q(c.ment)}</td><td class="n">${Q(c.ment)}</td></tr>` : ''}<tr><td><b>Total</b></td><td class="n"><b>${N(c.hours)}</b></td><td></td><td class="n"><b>${Q(c.direct)}</b></td><td class="n"><b>${Q(c.price)}</b></td></tr></tbody></table></div>
        <div class="mut sm" style="margin-top:10px">Precio = (costo del equipo ${Q(c.cost)} × markup ${S.markup} + dirección ${Q(c.dirV)}) × complejidad ${c.cxm} + mentor ${Q(c.ment)} · Margen = precio − costo directo − overhead ${S.ovh}%</div></div>`}

      <div class="card" style="margin-top:16px"><h3>¿Se justifica? Lo que el cliente gana</h3><div class="mut sm" style="margin-bottom:8px">Cambia el escenario del cliente. Los números son de ejemplo.</div>
        <div class="pkgrid"><label class="sm mut">Venta mensual actual (Q)<input class="in" type="number" step="1000" data-pk-sc="base" value="${S.sc.base}"></label><label class="sm mut">Crecimiento esperado (%)<input class="in" type="number" data-pk-sc="gr" value="${S.sc.gr}"></label><label class="sm mut">Margen del cliente (%)<input class="in" type="number" data-pk-sc="marg" value="${S.sc.marg}"></label><label class="sm mut">Meses de cobro del %<input class="in" type="number" data-pk-sc="months" value="${S.sc.months}"></label></div>
        <div class="split" style="margin-top:12px"><div><span class="lbl">Venta extra al mes</span><b>${Q(j.extra)}</b></div><div><span class="lbl">Utilidad extra al mes</span><b>${Q(j.util)}</b></div><div><span class="lbl">Para pagarse en 6 meses</span><b>${Q(j.need6)}/mes</b></div></div>
        <div class="warnbox" style="margin-top:12px;${j.pay && j.pay <= 12 ? 'background:var(--ink);color:var(--cream)' : ''}">${j.pay ? html`<b>Se paga en ${N(j.pay, 1)} meses.</b> ${Q(c.price)} de inversión contra ${Q(j.net)} netos al mes.` : html`<b>Con este escenario no se recupera.</b> Sube el crecimiento esperado o baja el precio.`}</div></div>

      <div class="card" style="margin-top:16px"><h3>Growth Partnership</h3>
        <div class="grid g2" style="margin-top:8px"><div>${j.canFee ? html`<label class="sm mut">% del crecimiento atribuido<input class="in" type="number" step="0.5" data-pk-in="pct" value="${e.pct}"></label><div class="split" style="margin-top:10px"><div><span class="lbl">Fee por mes</span><b>${Q(j.fee)}</b></div><div><span class="lbl">Fee en ${S.sc.months} meses</span><b>${Q(j.feeTotal)}</b></div></div><div class="sm" style="margin-top:8px"><b style="font-weight:500">Cómo se mide limpio:</b> ${p.att || '—'}</div>` : html`<div class="warnbox sm">Este paquete <b>no admite cobro por resultado</b>${p.id.includes('investor') ? ': captar dinero del público sin autorización es delito en Guatemala' : ': no hay forma de atribuir la venta limpia'}. Solo se cobra el proyecto.</div>`}</div>
          <div><div class="sm mut" style="margin-bottom:6px">Horas de operación al mes</div><div class="pkgrid">${S.roles.map((r) => html`<label class="sm mut">${r.n}<input class="in" type="number" min="0" step="0.5" data-pk-m="${r.id}" value="${+(e.mo[r.id] || 0)}"></label>`)}</div><div class="sm" style="margin-top:8px">Operación mensual: <b style="font-weight:500">${c.monthly ? Q(c.monthly) : '—'}</b></div></div></div></div>`;
  }

  const own = () => (bun?.list || []).filter((b) => !b.pkg && (!F.q.trim() || b.name.toLowerCase().includes(F.q.trim().toLowerCase())));
  const linked = (id) => (bun?.list || []).find((b) => b.pkg === id);
  function vBundle(b) {
    const t = bun.totals(b);
    return html`<div class="card feat olive"><div class="row" style="align-items:flex-start;gap:16px;flex-wrap:wrap"><div class="grow" style="min-width:240px"><div class="lbl">${b.industry || 'Sin industria'} · Paquete propio</div><h2 style="margin:4px 0 6px;font-size:26px;font-weight:500">${b.name}</h2><div style="opacity:.8">${b.desc || ''}</div></div>
        <div style="text-align:right"><div class="lbl">Precio del paquete</div><div class="big" style="font-size:46px">${Q(t.price)}</div></div></div>
      <div class="foot" style="margin-top:18px;opacity:1"><button class="btn cream" data-pk="bquote" data-id="${b.id}">Cotizar este paquete →</button></div></div>
      ${bun.servicesCard(b)}
      ${(b.phases || []).filter((f) => f.n).length ? html`<div class="card" style="margin-top:16px"><h3>Cómo se desarrolla</h3>${b.phases.filter((f) => f.n).map((f) => html`<div class="row" style="padding:9px 0;border-top:1px solid var(--line)"><b style="font-weight:500">${f.n}</b><div class="sp"></div><span class="mut sm">${f.w ? `Semanas ${f.w}` : ''}</span></div>`)}</div>` : ''}`;
  }
  function vPk() {
    const list = items(), mine = own(), bsel = SEL.startsWith('b:') ? mine.find((b) => 'b:' + b.id === SEL) : null, p = bsel ? null : PB[SEL] || list[0];
    return html`<div class="pk">
      <aside class="card pklist"><div style="display:grid;gap:8px"><select class="in" data-pk-f="ind"><option value="">Todas las industrias</option>${data.ind.map((i) => html`<option value="${i.id}" ${F.ind === i.id ? raw('selected') : ''}>${i.n}</option>`)}</select><input class="in" type="search" placeholder="Buscar paquete" data-pk-f="q" value="${F.q}"><label class="sw-row"><input type="checkbox" class="switch" data-pk-f="std" ${F.std ? raw('checked') : ''}> Solo prioritarios ${ico('star', 13)}</label></div>
        ${bun ? html`<button class="btn" style="width:100%;margin-top:10px" data-pk="bnew">+ Paquete</button>` : ''}
        ${mine.length ? html`<div class="mut sm" style="margin:12px 0 4px">Tus paquetes</div>${mine.map((b) => html`<button class="pkitem ${'b:' + b.id === SEL ? 'on' : ''}" data-pk="sel" data-id="b:${b.id}"><span>${b.name}</span><small>${Q(bun.totals(b).price)}</small></button>`)}<div class="mut sm" style="margin:12px 0 4px">Por industria</div>` : ''}
        <div style="margin-top:10px">${list.map((x) => html`<button class="pkitem ${x.id === p?.id ? 'on' : ''}" data-pk="sel" data-id="${x.id}"><span>${x.n}${x.st === 'standard' ? ico('star', 13) : ''}</span><small>${Q(calc(x).price)}</small></button>`)}</div></aside>
      <section>${bsel ? vBundle(bsel) : vDetail(p, calc(p))}</section></div>`;
  }
  function vEq() {
    return html`<div class="card"><div class="row"><div><h3>Equipo y tarifas por hora</h3><div class="mut sm">Costo/h es lo que le pagas a la persona. Dirección no cuesta: se valora para que el precio refleje tu tiempo.</div></div><div class="sp"></div><button class="btn" data-pk="addrole">+ Agregar rol</button></div>
      <div class="tw" style="margin-top:12px"><table class="pktab"><thead><tr><th>Rol</th><th class="n">Costo/h (Q)</th><th class="n">Cobro/h (medio)</th><th></th></tr></thead><tbody>${S.roles.map((r) => html`<tr><td><input class="in" data-pk-rn="${r.id}" value="${r.n}"></td><td class="n"><input class="in" style="text-align:right;max-width:110px" type="number" min="0" step="10" data-pk-rc="${r.id}" value="${r.dir ? S.dirVal : r.c}"></td><td class="n">${r.dir ? 'valor de tu tiempo' : Q(r.c * S.markup)}</td><td class="n">${r.dir ? '' : html`<button class="btn ghost xs" data-pk="delrole" data-id="${r.id}">Quitar</button>`}</td></tr>`)}</tbody></table></div></div>
      <div class="card" style="margin-top:16px"><h3>Reglas generales</h3><div class="pkgrid" style="margin-top:10px"><label class="sm mut">Markup sobre costo<input class="in" type="number" step="0.1" data-pk-g="markup" value="${S.markup}"></label><label class="sm mut">Overhead o buffer (%)<input class="in" type="number" data-pk-g="ovh" value="${S.ovh}"></label><label class="sm mut">Valor/h de dirección (Q)<input class="in" type="number" step="10" data-pk-g="dirVal" value="${S.dirVal}"></label><label class="sm mut">Mentor por sesión (Q)<input class="in" type="number" step="100" data-pk-g="mentor" value="${S.mentor}"></label><label class="sm mut">Redondear precio a (Q)<input class="in" type="number" data-pk-g="round" value="${S.round}"></label></div>
        <div class="sm mut" style="margin:14px 0 6px">Multiplicador de complejidad</div><div class="pkgrid"><label class="sm mut">Sencillo ×<input class="in" type="number" step="0.05" data-pk-cx="S" value="${S.cx.S}"></label><label class="sm mut">Medio ×<input class="in" type="number" step="0.05" data-pk-cx="M" value="${S.cx.M}"></label><label class="sm mut">Fuerte ×<input class="in" type="number" step="0.05" data-pk-cx="X" value="${S.cx.X}"></label></div>
        <div class="sm mut" style="margin:14px 0 6px">% de crecimiento por defecto</div><div class="pkgrid"><label class="sm mut">% del crecimiento atribuido<input class="in" type="number" step="0.5" data-pk-sc="pct" value="${S.sc.pct}"></label></div></div>`;
  }
  function vRs() {
    const rows = P.map((p) => ({ p, c: calc(p) })).filter((x) => (!F.ind || x.p.ind === F.ind) && (!F.std || x.p.st === 'standard')).sort((a, b) => b.c.price - a.c.price);
    return html`<div class="card"><div class="row" style="flex-wrap:wrap"><h3>Los ${rows.length} paquetes</h3><div class="sp"></div><select class="in" style="width:auto" data-pk-f="ind"><option value="">Todas las industrias</option>${data.ind.map((i) => html`<option value="${i.id}" ${F.ind === i.id ? raw('selected') : ''}>${i.n}</option>`)}</select></div>
      <div class="tw" style="margin-top:12px"><table class="pktab"><thead><tr><th>Industria</th><th>Paquete</th><th class="n">Precio</th><th class="n">Margen</th><th class="n">Horas</th><th class="n">Operación/mes</th></tr></thead><tbody>${rows.map(({ p, c }) => html`<tr class="pkrow" data-pk="go" data-id="${p.id}"><td>${IND[p.ind]}</td><td><b style="font-weight:500">${p.n}</b>${p.st === 'standard' ? ico('star', 13) : ''}</td><td class="n">${Q(c.price)}</td><td class="n">${N(c.pct, 0)}%</td><td class="n">${N(c.hours)}</td><td class="n">${c.monthly ? Q(c.monthly) : '—'}</td></tr>`)}</tbody></table></div></div>`;
  }
  function paint() {
    const y = scrollY;
    mount(body, html`<div class="tabs" style="margin:0 0 16px"><button class="${sub === 'pk' ? 'on' : ''}" data-pk="sub" data-s="pk">Paquetes</button><button class="${sub === 'eq' ? 'on' : ''}" data-pk="sub" data-s="eq">Equipo y tarifas</button><button class="${sub === 'rs' ? 'on' : ''}" data-pk="sub" data-s="rs">Los 108</button></div>${sub === 'pk' ? vPk() : sub === 'eq' ? vEq() : vRs()}`);
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
