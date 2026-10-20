// Servicios → Paquetes: paquetes armados con lo que ya existe. Un paquete es una lista de servicios del catálogo
// (cada uno con su nivel y cantidad) y, si aplica, especialistas. Su precio es la suma de sus líneas, con el
// mismo margen del catálogo, y la cotización muestra cuánto vale cada cosa. Solo el CEO (lleva costos).
import { html, raw, mount, col, api, drawer, closeDrawer, toast, confirmAsk, Q, USD, $, $$, ico } from './core.js';
import { svcCost, svcHours, svcPrice, svcAuto, marginOf, includesAt, hoursAt, rateAt } from './cycle.js';
import { LEVELS } from './levels.js';

const B = col('bundles');
const r50 = (n) => Math.round(n / 50) * 50;
const num = (v, d = 0) => { const n = parseFloat(v); return isNaN(n) ? d : n; };
const uid = () => Math.random().toString(36).slice(2, 9);
const lvName = (lv) => (lv <= 4 ? 'Básico' : lv <= 6 ? 'Sencillo' : lv >= 9 ? 'Fuerte' : 'Medio');

// Devuelve las piezas para que Paquetes muestre los armados en su misma lista y edite los servicios de cada paquete.
export async function createBundles({ services, rates, industries = [], onQuote }) {
  let onDone = () => {};
  let [bundles, mentors] = await Promise.all([B.list(), col('mentors').list().catch(() => [])]);
  // Tipo de cambio: los especialistas cobran en dólares; el paquete se cotiza en quetzales.
  let qPerUsd = 7.7, fxOk = false;
  try { const r = await api('fx?to=USD'); if (r?.rate > 0) { qPerUsd = 1 / r.rate; fxOk = true; } } catch {}
  const margin = marginOf(rates) / 100;
  const roleNames = (rates?.roles || []).map((r) => r.role).filter(Boolean);

  // ---------- precio de cada línea ----------
  const svc = (id) => services.find((s) => s.id === id);
  const svcPriceAt = (s, lv) => (rates && !s.price_fixed && !(s.price && !s.prices) ? svcAuto(s, rates, lv) : null) ?? svcPrice(s, lv);
  function line(l) {
    // Servicio propio: no está en el catálogo, lo requiere este paquete. Se cotiza igual: horas por rol × costo, con el mismo margen.
    if (l.type === 'custom') {
      const roles = (l.roles || []).filter((r) => r.role && +r.hours > 0), c = rates ? svcCost({ tasks: roles.map((r) => ({ role: r.role, hours: +r.hours, hours10: +r.hours })) }, rates, 5) : null;
      const cost = c ? c.cost : 0, hours = roles.reduce((a, r) => a + +r.hours, 0);
      return { name: l.name || 'Servicio propio', sub: `Servicio propio · ${hours} h${hours ? '' : ' · ponle horas'}`, cost, price: cost ? r50(cost / (1 - margin)) : 0, hours, ok: Boolean(l.name && cost), roles: roles.map((r) => ({ role: r.role, hours: +r.hours, cost: (rateAt(rates, r.role, 5) || 0) * +r.hours })), miss: c?.miss?.length ? c.miss : null };
    }
    if (l.type === 'mentor') {
      const m = mentors.find((x) => x.id === l.mentor_id);
      const usd = num(l.usd, num(m?.price)) * num(l.qty, 1), cost = usd * qPerUsd;
      return { name: m ? `Especialista: ${m.name}` : 'Especialista', sub: m ? `${m.industry || ''} · ${num(l.qty, 1)} ${m.unit === 'mes' ? 'mes(es)' : 'sesión(es)'} · ${USD(usd)}` : 'Elige un especialista', cost, price: cost ? r50(cost / (1 - margin)) : 0, hours: 0, ok: Boolean(m), roles: [] };
    }
    const s = svc(l.service_id), lv = Math.max(3, Math.min(10, Math.round(num(l.level, 5)))), qty = Math.max(1, num(l.qty, 1));
    if (!s) return { name: 'Servicio', sub: 'Elige un servicio del catálogo', cost: 0, price: 0, hours: 0, ok: false, roles: [] };
    const c = rates ? svcCost(s, rates, lv) : null, p = svcPriceAt(s, lv);
    return { name: s.name, sub: `${lvName(lv)} · nivel ${lv}${qty > 1 ? ` · ×${qty}` : ''} · ${svcHours(s, lv) * qty} h`, cost: c && !c.miss.length ? c.cost * qty : 0, price: (p || 0) * qty, hours: svcHours(s, lv) * qty, ok: p != null, roles: (s.tasks || []).map((t) => ({ role: t.role, hours: hoursAt(t, lv) * qty, cost: (rateAt(rates, t.role, lv) || 0) * hoursAt(t, lv) * qty })), miss: c?.miss?.length ? c.miss : null };
  }
  // El precio del paquete: la suma del catálogo o, si el CEO lo fijó a mano, ese (el costo no cambia).
  function totals(b) {
    const ls = (b.lines || []).map(line), sum = ls.reduce((a, x) => a + x.price, 0), cost = ls.reduce((a, x) => a + x.cost, 0), manual = +b.price_fixed > 0 ? +b.price_fixed : 0, price = manual || sum;
    return { ls, price, sum, manual, cost, hours: ls.reduce((a, x) => a + x.hours, 0), mg: price ? Math.round((1 - cost / price) * 100) : null };
  }

  // ---------- editor ----------
  function edit(orig) {
    const b = orig?.id ? JSON.parse(JSON.stringify(orig)) : { name: '', industry: '', desc: '', level: '', excludes: '', price_fixed: null, lines: [], phases: [], ...(orig || {}) };
    if (!orig?.id) orig = null;
    b.lines = b.lines || []; b.phases = b.phases || [];
    const svcOpts = (sel) => html`<option value="">Elige un servicio…</option>${services.map((s) => html`<option value="${s.id}" ${s.id === sel ? raw('selected') : ''}>${s.name}</option>`)}`;
    const mOpts = (sel) => html`<option value="">Elige un especialista…</option>${mentors.map((m) => html`<option value="${m.id}" ${m.id === sel ? raw('selected') : ''}>${m.name} · ${m.industry || ''} · ${m.price ? USD(m.price) : 'sin precio'}</option>`)}`;
    const draw = () => {
      const t = totals(b), keep = $('#drawer')?.scrollTop || 0;
      drawer(html`<div class="row"><span class="chip dark">${ico('lock', 13)} Solo CEO</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
        <h2>${orig ? 'Editar paquete' : 'Nuevo paquete'}</h2>
        <div class="form" style="margin-top:14px">
          <div><label class="f">Nombre *</label><input class="in" data-k="name" value="${b.name}"></div>
          <div class="two"><div><label class="f">Nivel</label><select class="in" data-k="level"><option value="">Sin nivel · otro paquete</option>${LEVELS.map((l) => html`<option value="${l.id}" ${l.id === b.level ? raw('selected') : ''}>${l.name}</option>`)}</select></div>
            <div><label class="f">Industria</label><input class="in" data-k="industry" list="bind" value="${b.industry}"><datalist id="bind">${industries.map((i) => html`<option value="${i}">`)}</datalist></div></div>
          <div><label class="f">Para quién es y qué logra (sale en la cotización)</label><textarea class="in" data-k="desc">${b.desc}</textarea></div>
          <div><label class="f">Qué queda fuera · uno por línea</label><textarea class="in" data-k="excludes" placeholder="Pauta (se cobra aparte)&#10;Producción especial">${b.excludes || ''}</textarea></div>
        </div>
        <div class="sec-title" style="margin:18px 0 8px"><h3 style="margin:0">Qué incluye</h3></div>
        ${t.ls.map((x, i) => { const l = b.lines[i]; if (l.type === 'custom') return html`<div class="card glass" style="padding:12px 14px;margin-bottom:8px;border-radius:18px">
          <div class="row" style="gap:8px"><input class="in" placeholder="Nombre del servicio propio" data-li="${i}" data-lf="name" value="${l.name || ''}"><button class="btn ghost xs" data-act="rmLine" data-i="${i}" aria-label="Quitar">${ico('trash', 15)}</button></div>
            ${(l.roles || []).map((r, k) => html`<div class="row" style="gap:8px;margin-top:8px"><select class="in" data-li="${i}" data-rk="${k}" data-rf="role"><option value="">Rol…</option>${roleNames.map((n) => html`<option value="${n}" ${n === r.role ? raw('selected') : ''}>${n}</option>`)}</select><input class="in" style="max-width:90px" type="number" min="0" step="0.5" placeholder="Horas" data-li="${i}" data-rk="${k}" data-rf="hours" value="${r.hours ?? ''}"><button class="btn ghost xs" data-act="rmRole" data-i="${i}" data-k="${k}" aria-label="Quitar">${ico('x', 14)}</button></div>`)}
            <div class="row" style="margin-top:8px"><button class="btn ghost xs" data-act="addRole" data-i="${i}">+ Rol y horas</button><div class="sp"></div><div style="text-align:right"><b style="font-weight:500">${x.price ? Q(x.price) : '—'}</b><div class="mut sm">${x.sub}</div></div></div>
            ${x.miss ? html`<div class="mut sm" style="margin-top:6px">${ico('alert', 13)} Falta costo por hora de: ${x.miss.join(', ')}</div>` : ''}</div>`;
          return html`<div class="card glass" style="padding:12px 14px;margin-bottom:8px;border-radius:18px">
          <div class="row" style="gap:8px">${l.type === 'mentor' ? html`<select class="in" data-li="${i}" data-lf="mentor_id">${mOpts(l.mentor_id)}</select>` : html`<select class="in" data-li="${i}" data-lf="service_id">${svcOpts(l.service_id)}</select>`}<button class="btn ghost xs" data-act="rmLine" data-i="${i}" aria-label="Quitar">${ico('trash', 15)}</button></div>
          <div class="row" style="gap:10px;margin-top:8px;flex-wrap:wrap">${l.type === 'mentor'
            ? html`<label class="sm mut">Sesiones<input class="in" style="max-width:80px" type="number" min="1" data-li="${i}" data-lf="qty" value="${l.qty || 1}"></label><label class="sm mut">USD por sesión<input class="in" style="max-width:100px" type="number" step="1" data-li="${i}" data-lf="usd" value="${l.usd ?? ''}" placeholder="del especialista"></label>`
            : html`<label class="sm mut" style="flex:1;min-width:160px">Nivel ${num(l.level, 5)} · ${lvName(num(l.level, 5))}<input type="range" min="3" max="10" step="1" style="width:100%" data-li="${i}" data-lf="level" value="${l.level || 5}"></label><label class="sm mut">Cantidad<input class="in" style="max-width:80px" type="number" min="1" data-li="${i}" data-lf="qty" value="${l.qty || 1}"></label>`}
            <div class="sp"></div><div style="text-align:right"><b style="font-weight:500">${x.price ? Q(x.price) : '—'}</b><div class="mut sm">${x.sub}</div></div></div>
          ${x.miss ? html`<div class="mut sm" style="margin-top:6px">${ico('alert', 13)} Falta costo por hora de: ${x.miss.join(', ')}</div>` : ''}</div>`; })}
        <div class="row" style="gap:8px;margin-top:6px"><button class="btn ghost" data-act="addSvc">+ Servicio</button><button class="btn ghost" data-act="addMentor">+ Especialista</button><button class="btn ghost" data-act="addCustom">+ Servicio propio</button></div>
        ${b.lines.some((l) => l.type === 'mentor') && !fxOk ? html`<div class="mut sm" style="margin-top:8px">Tipo de cambio aproximado: Q${qPerUsd} por dólar.</div>` : ''}

        <div class="sec-title" style="margin:20px 0 8px"><h3 style="margin:0">Fases (el plan de trabajo)</h3></div>
        ${b.phases.map((f, i) => html`<div class="row" style="gap:8px;margin-bottom:8px;flex-wrap:wrap"><input class="in" style="flex:2;min-width:160px" placeholder="Nombre de la fase" data-fi="${i}" data-ff="n" value="${f.n || ''}"><input class="in" style="max-width:110px" placeholder="Semanas" data-fi="${i}" data-ff="w" value="${f.w || ''}"><select class="in" style="flex:2;min-width:160px" data-fi="${i}" data-ff="line"><option value="">Servicio que entrega…</option>${b.lines.map((l, k) => html`<option value="${l.id}" ${l.id === f.line ? raw('selected') : ''}>${t.ls[k].name}</option>`)}</select><button class="btn ghost xs" data-act="rmPh" data-i="${i}" aria-label="Quitar">${ico('trash', 15)}</button></div>`)}
        <button class="btn ghost" data-act="addPh" style="padding:8px 14px">+ Fase</button>

        <div style="margin-top:16px"><label class="f">Precio del paquete en Q (vacío = la suma del catálogo${t.sum ? `: ${Q(t.sum)}` : ''})</label><input class="in" type="number" min="0" step="50" data-k="price_fixed" value="${+b.price_fixed > 0 ? +b.price_fixed : ''}" placeholder="${t.sum ? 'Suma del catálogo: ' + Q(t.sum) : 'Suma del catálogo'}"></div>
        <div class="card feat olive" style="margin-top:14px;min-height:0"><div class="lbl">Total del paquete${t.manual ? ' · precio manual' : ''}</div><div class="big" style="font-size:40px;margin-top:6px">${Q(t.price)}</div>
          <div class="foot"><span>${t.hours} h · ${b.lines.length} línea${b.lines.length === 1 ? '' : 's'}</span><span style="font-weight:700">${ico('lock', 12)} Costo ${Q(t.cost)}${t.mg != null ? ` · ${t.mg}%` : ''}</span></div></div>
        <div class="row" style="margin-top:18px;gap:8px"><button class="btn" data-act="save">Guardar</button><button class="btn ghost" data-act="quote">Cotizar</button><div class="sp"></div>${orig ? html`<button class="btn ghost" data-act="del" aria-label="Eliminar">${ico('trash', 16)}</button>` : ''}</div>`,
      {
        addSvc: () => { b.lines.push({ id: uid(), type: 'service', service_id: '', level: 5, qty: 1 }); draw(); },
        addCustom: () => { b.lines.push({ id: uid(), type: 'custom', name: '', roles: [{ role: '', hours: null }] }); draw(); },
        addRole: (x) => { const l = b.lines[+x.dataset.i]; l.roles = [...(l.roles || []), { role: '', hours: null }]; draw(); },
        rmRole: (x) => { b.lines[+x.dataset.i].roles.splice(+x.dataset.k, 1); draw(); },
        addMentor: () => { b.lines.push({ id: uid(), type: 'mentor', mentor_id: '', qty: 1, usd: null }); draw(); },
        rmLine: (x) => { const [l] = b.lines.splice(+x.dataset.i, 1); b.phases.forEach((f) => { if (f.line === l.id) f.line = ''; }); draw(); },
        addPh: () => { b.phases.push({ n: '', w: '', line: '' }); draw(); },
        rmPh: (x) => { b.phases.splice(+x.dataset.i, 1); draw(); },
        save: async () => {
          if (!b.name.trim()) return toast('Falta el nombre', true);
          const doc = { ...b, name: b.name.trim(), level: LEVELS.some((l) => l.id === b.level) ? b.level : '', excludes: String(b.excludes || '').trim(), price_fixed: +b.price_fixed > 0 ? +b.price_fixed : null, lines: b.lines.filter((l) => l.service_id || l.mentor_id || (l.type === 'custom' && l.name)) };
          try { const r = orig ? await B.save(doc) : await B.create(doc); bundles = orig ? bundles.map((x) => (x.id === r.id ? r : x)) : [...bundles, r]; toast('Paquete guardado'); closeDrawer(); onDone(r); }
          catch (e) { toast(e.message, true); }
        },
        quote: () => { const tt = totals(b); if (!tt.ls.some((x) => x.ok)) return toast('Agrega al menos un servicio', true); closeDrawer(); onQuote(quoteOf(b, tt)); },
        del: async () => { if (!(await confirmAsk(`¿Eliminar el paquete «${orig.name}»?`))) return; try { await B.remove(orig.id); bundles = bundles.filter((x) => x.id !== orig.id); closeDrawer(); onDone(null); } catch (e) { toast(e.message, true); } },
      });
      const d = $('#drawer'); d.scrollTop = keep;
      // Lo escrito se guarda en el paquete al momento (así nunca se lee un formulario viejo).
      $$('[data-k]', d).forEach((x) => x.addEventListener('input', () => { b[x.dataset.k] = x.value; }));
      $$('[data-k=level],[data-k=price_fixed]', d).forEach((x) => x.addEventListener('change', () => { b[x.dataset.k] = x.value; draw(); }));
      $$('[data-rk]', d).forEach((x) => x.addEventListener('change', () => { const r = b.lines[+x.dataset.li].roles[+x.dataset.rk]; r[x.dataset.rf] = x.dataset.rf === 'hours' ? (x.value === '' ? null : num(x.value)) : x.value; draw(); }));
      $$('[data-li][data-lf]', d).forEach((x) => x.addEventListener('change', () => { const l = b.lines[+x.dataset.li], f = x.dataset.lf; l[f] = f === 'service_id' || f === 'mentor_id' || f === 'name' ? x.value : x.value === '' ? null : num(x.value); draw(); }));
      $$('[data-fi]', d).forEach((x) => x.addEventListener(x.tagName === 'SELECT' ? 'change' : 'input', () => { b.phases[+x.dataset.fi][x.dataset.ff] = x.value; }));
    };
    draw();
  }

  // ---------- a cotización: una línea por servicio y por especialista, cada una con su precio ----------
  function quoteOf(b, t) {
    const items = (b.lines || []).map((l, i) => {
      const x = t.ls[i]; if (!x.ok) return null;
      if (l.type === 'custom') return { name: x.name, description: '', qty: 1, price: x.price, cost: Math.round(x.cost) };
      if (l.type === 'mentor') return { name: x.name, description: x.sub, qty: 1, price: x.price, cost: Math.round(x.cost) };
      const s = svc(l.service_id), lv = Math.round(num(l.level, 5));
      return { service_id: s.id, name: s.name, description: s.description || '', qty: Math.max(1, num(l.qty, 1)), level: lv, price: x.price / Math.max(1, num(l.qty, 1)), includes: includesAt(s, lv) };
    }).filter(Boolean);
    if (t.manual && items.length) { const inc = items.flatMap((i) => (i.includes?.length ? i.includes : [i.name])); items.splice(0, items.length, { name: b.name || 'Paquete', description: b.desc || '', qty: 1, price: t.manual, cost: Math.round(t.cost), includes: inc.slice(0, 20) }); }
    const plan = (b.phases || []).filter((f) => f.n).map((f) => `${f.n}${f.w ? ` (semanas ${f.w})` : ''}${f.line ? ` · ${t.ls[b.lines.findIndex((l) => l.id === f.line)]?.name || ''}` : ''}`);
    return { items, intro: b.desc || '', notes: plan.length ? `Plan de trabajo (${b.name}):\n${plan.map((x) => '• ' + x).join('\n')}` : '' };
  }

  // Tarjeta «Servicios» (solo lectura) para el detalle del paquete.
  function servicesCard(b, pkg) {
    const t = totals(b || { lines: [] });
    return html`<div class="card" style="margin-top:16px"><div class="row" style="flex-wrap:wrap;gap:10px"><div><h3>Servicios</h3><div class="mut sm">Lo que se entrega, del catálogo, cada uno con su precio.</div></div><div class="sp"></div><button class="btn ghost" data-pk="bedit" data-id="${b?.id || ''}" data-pkg="${pkg || ''}">${ico('edit', 15)} ${t.ls.length ? 'Editar servicios' : '+ Agregar servicios'}</button></div>
      ${t.ls.length ? html`<div style="margin-top:10px">${t.ls.map((x, k) => html`<div class="row" style="padding:9px 0;border-top:1px solid var(--line);gap:10px"><div class="grow"><b style="font-weight:500">${x.name}</b><div class="mut sm">${x.sub}</div>${(b.lines[k]?.covers || []).length ? html`<div class="sm" style="margin-top:3px">Cubre: ${b.lines[k].covers.join(' · ')}</div>` : ''}</div><b style="font-weight:500">${x.price ? Q(x.price) : '—'}</b></div>`)}
        <div class="row" style="padding-top:10px;border-top:1px solid var(--line)"><span class="mut sm">${ico('lock', 13)} Costo ${Q(t.cost)}${t.mg != null ? ` · Margen ${t.mg}%` : ''} · ${t.hours} h</span><div class="sp"></div><b style="font-size:20px;font-weight:500">${Q(t.price)}</b></div></div>`
        : html`<div class="mut sm" style="margin-top:10px">Todavía no tiene servicios del catálogo.</div>`}</div>`;
  }

  return {
    get list() { return bundles; }, rates, totals, servicesCard, margin,
    edit: (orig, done) => { onDone = done || (() => {}); edit(orig); },
    quote: (b) => onQuote(quoteOf(b, totals(b))),
  };
}
