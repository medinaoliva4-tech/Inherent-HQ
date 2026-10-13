// Sales → Paquetes: paquetes armados con lo que ya existe. Un paquete es una lista de servicios del catálogo
// (cada uno con su nivel y cantidad) y, si aplica, especialistas. Su precio es la suma de sus líneas, con el
// mismo margen del catálogo, y la cotización muestra cuánto vale cada cosa. Solo el CEO (lleva costos).
import { html, raw, mount, col, api, drawer, closeDrawer, toast, confirmAsk, Q, USD, $, $$, ico } from './core.js';
import { svcCost, svcHours, svcPrice, svcAuto, marginOf, includesAt } from './cycle.js';

const B = col('bundles');
const r50 = (n) => Math.round(n / 50) * 50;
const num = (v, d = 0) => { const n = parseFloat(v); return isNaN(n) ? d : n; };
const uid = () => Math.random().toString(36).slice(2, 9);
const lvName = (lv) => (lv <= 6 ? 'Sencillo' : lv >= 9 ? 'Fuerte' : 'Medio');

export async function bundlesSection(body, { services, rates, industries = [], onQuote }) {
  mount(body, html`<p class="loading">Cargando paquetes armados…</p>`);
  let [bundles, mentors] = await Promise.all([B.list(), col('mentors').list().catch(() => [])]);
  // Tipo de cambio: los especialistas cobran en dólares; el paquete se cotiza en quetzales.
  let qPerUsd = 7.7, fxOk = false;
  try { const r = await api('fx?to=USD'); if (r?.rate > 0) { qPerUsd = 1 / r.rate; fxOk = true; } } catch {}
  const margin = marginOf(rates) / 100;

  // ---------- precio de cada línea ----------
  const svc = (id) => services.find((s) => s.id === id);
  const svcPriceAt = (s, lv) => (rates && !s.price_fixed && !(s.price && !s.prices) ? svcAuto(s, rates, lv) : null) ?? svcPrice(s, lv);
  function line(l) {
    if (l.type === 'mentor') {
      const m = mentors.find((x) => x.id === l.mentor_id);
      const usd = num(l.usd, num(m?.price)) * num(l.qty, 1), cost = usd * qPerUsd;
      return { name: m ? `Especialista: ${m.name}` : 'Especialista', sub: m ? `${m.industry || ''} · ${num(l.qty, 1)} ${m.unit === 'mes' ? 'mes(es)' : 'sesión(es)'} · ${USD(usd)}` : 'Elige un especialista', cost, price: cost ? r50(cost / (1 - margin)) : 0, hours: 0, ok: Boolean(m) };
    }
    const s = svc(l.service_id), lv = Math.max(5, Math.min(10, Math.round(num(l.level, 5)))), qty = Math.max(1, num(l.qty, 1));
    if (!s) return { name: 'Servicio', sub: 'Elige un servicio del catálogo', cost: 0, price: 0, hours: 0, ok: false };
    const c = rates ? svcCost(s, rates, lv) : null, p = svcPriceAt(s, lv);
    return { name: s.name, sub: `${lvName(lv)} · nivel ${lv}${qty > 1 ? ` · ×${qty}` : ''} · ${svcHours(s, lv) * qty} h`, cost: c && !c.miss.length ? c.cost * qty : 0, price: (p || 0) * qty, hours: svcHours(s, lv) * qty, ok: p != null, miss: c?.miss?.length ? c.miss : null };
  }
  function totals(b) {
    const ls = (b.lines || []).map(line), price = ls.reduce((a, x) => a + x.price, 0), cost = ls.reduce((a, x) => a + x.cost, 0);
    return { ls, price, cost, hours: ls.reduce((a, x) => a + x.hours, 0), mg: price ? Math.round((1 - cost / price) * 100) : null };
  }

  // ---------- lista ----------
  function paint() {
    mount(body, html`<div class="sec-title" style="margin-top:0"><h2>Paquetes armados</h2><span class="mut sm">Servicios del catálogo y especialistas · cada línea con su precio · margen ${Math.round(margin * 100)}%</span><div class="sp"></div><button class="btn" data-bact="new">+ Paquete</button></div>
      ${bundles.length ? html`<div class="grid g3" style="margin-bottom:24px">${bundles.map((b) => { const t = totals(b), nS = (b.lines || []).filter((l) => l.type !== 'mentor').length, nM = (b.lines || []).length - nS; return html`<div class="card svcard" style="cursor:pointer" data-bact="open" data-id="${b.id}">
          <div class="row"><span class="chip">${b.industry || 'Sin industria'}</span><div class="sp"></div><span class="mut sm">${nS} servicio${nS === 1 ? '' : 's'}${nM ? ` · ${nM} especialista${nM === 1 ? '' : 's'}` : ''}</span></div>
          <h3 style="font-size:19px;font-weight:500;letter-spacing:-.4px;margin:12px 0 4px">${b.name}</h3><div class="mut sm">${b.desc || ''}</div>
          <div class="row" style="margin-top:12px"><span class="mut sm">${t.hours} h</span><div class="sp"></div><b style="font-size:22px;font-weight:500;letter-spacing:-.5px">${Q(t.price)}</b></div>
          <div class="mut sm" style="margin-top:8px;border-top:1px solid var(--line);padding-top:8px">${ico('lock', 13)} Costo ${Q(t.cost)}${t.mg != null ? ` · Margen ${t.mg}%` : ''}</div></div>`; })}</div>`
        : html`<div class="empty" style="margin-bottom:24px"><b>Todavía no hay paquetes armados</b>Crea uno con «+ Paquete»: eliges servicios del catálogo y especialistas, y cada uno sale con su precio.</div>`}`);
  }

  // ---------- editor ----------
  function edit(orig) {
    const b = orig ? JSON.parse(JSON.stringify(orig)) : { name: '', industry: '', desc: '', lines: [], phases: [] };
    b.lines = b.lines || []; b.phases = b.phases || [];
    const svcOpts = (sel) => html`<option value="">Elige un servicio…</option>${services.map((s) => html`<option value="${s.id}" ${s.id === sel ? raw('selected') : ''}>${s.name}</option>`)}`;
    const mOpts = (sel) => html`<option value="">Elige un especialista…</option>${mentors.map((m) => html`<option value="${m.id}" ${m.id === sel ? raw('selected') : ''}>${m.name} · ${m.industry || ''} · ${m.price ? USD(m.price) : 'sin precio'}</option>`)}`;
    const draw = () => {
      const t = totals(b), keep = $('#drawer')?.scrollTop || 0;
      drawer(html`<div class="row"><span class="chip dark">${ico('lock', 13)} Solo CEO</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
        <h2>${orig ? 'Editar paquete' : 'Nuevo paquete'}</h2>
        <div class="form" style="margin-top:14px">
          <div><label class="f">Nombre *</label><input class="in" data-k="name" value="${b.name}"></div>
          <div class="two"><div><label class="f">Industria</label><input class="in" data-k="industry" list="bind" value="${b.industry}"><datalist id="bind">${industries.map((i) => html`<option value="${i}">`)}</datalist></div><div></div></div>
          <div><label class="f">Para quién es y qué logra (sale en la cotización)</label><textarea class="in" data-k="desc">${b.desc}</textarea></div>
        </div>
        <div class="sec-title" style="margin:18px 0 8px"><h3 style="margin:0">Qué incluye</h3></div>
        ${t.ls.map((x, i) => { const l = b.lines[i]; return html`<div class="card glass" style="padding:12px 14px;margin-bottom:8px;border-radius:18px">
          <div class="row" style="gap:8px">${l.type === 'mentor' ? html`<select class="in" data-li="${i}" data-lf="mentor_id">${mOpts(l.mentor_id)}</select>` : html`<select class="in" data-li="${i}" data-lf="service_id">${svcOpts(l.service_id)}</select>`}<button class="btn ghost xs" data-act="rmLine" data-i="${i}" aria-label="Quitar">${ico('trash', 15)}</button></div>
          <div class="row" style="gap:10px;margin-top:8px;flex-wrap:wrap">${l.type === 'mentor'
            ? html`<label class="sm mut">Sesiones<input class="in" style="max-width:80px" type="number" min="1" data-li="${i}" data-lf="qty" value="${l.qty || 1}"></label><label class="sm mut">USD por sesión<input class="in" style="max-width:100px" type="number" step="1" data-li="${i}" data-lf="usd" value="${l.usd ?? ''}" placeholder="del especialista"></label>`
            : html`<label class="sm mut" style="flex:1;min-width:160px">Nivel ${num(l.level, 5)} · ${lvName(num(l.level, 5))}<input type="range" min="5" max="10" step="1" style="width:100%" data-li="${i}" data-lf="level" value="${l.level || 5}"></label><label class="sm mut">Cantidad<input class="in" style="max-width:80px" type="number" min="1" data-li="${i}" data-lf="qty" value="${l.qty || 1}"></label>`}
            <div class="sp"></div><div style="text-align:right"><b style="font-weight:500">${x.price ? Q(x.price) : '—'}</b><div class="mut sm">${x.sub}</div></div></div>
          ${x.miss ? html`<div class="mut sm" style="margin-top:6px">${ico('alert', 13)} Falta costo por hora de: ${x.miss.join(', ')}</div>` : ''}</div>`; })}
        <div class="row" style="gap:8px;margin-top:6px"><button class="btn ghost" data-act="addSvc">+ Servicio</button><button class="btn ghost" data-act="addMentor">+ Especialista</button></div>
        ${b.lines.some((l) => l.type === 'mentor') && !fxOk ? html`<div class="mut sm" style="margin-top:8px">Tipo de cambio aproximado: Q${qPerUsd} por dólar.</div>` : ''}

        <div class="sec-title" style="margin:20px 0 8px"><h3 style="margin:0">Fases (el plan de trabajo)</h3></div>
        ${b.phases.map((f, i) => html`<div class="row" style="gap:8px;margin-bottom:8px;flex-wrap:wrap"><input class="in" style="flex:2;min-width:160px" placeholder="Nombre de la fase" data-fi="${i}" data-ff="n" value="${f.n || ''}"><input class="in" style="max-width:110px" placeholder="Semanas" data-fi="${i}" data-ff="w" value="${f.w || ''}"><select class="in" style="flex:2;min-width:160px" data-fi="${i}" data-ff="line"><option value="">Servicio que entrega…</option>${b.lines.map((l, k) => html`<option value="${l.id}" ${l.id === f.line ? raw('selected') : ''}>${t.ls[k].name}</option>`)}</select><button class="btn ghost xs" data-act="rmPh" data-i="${i}" aria-label="Quitar">${ico('trash', 15)}</button></div>`)}
        <button class="btn ghost" data-act="addPh" style="padding:8px 14px">+ Fase</button>

        <div class="card feat olive" style="margin-top:20px;min-height:0"><div class="lbl">Total del paquete</div><div class="big" style="font-size:40px;margin-top:6px">${Q(t.price)}</div>
          <div class="foot"><span>${t.hours} h · ${b.lines.length} línea${b.lines.length === 1 ? '' : 's'}</span><span style="font-weight:700">${ico('lock', 12)} Costo ${Q(t.cost)}${t.mg != null ? ` · ${t.mg}%` : ''}</span></div></div>
        <div class="row" style="margin-top:18px;gap:8px"><button class="btn" data-act="save">Guardar</button><button class="btn ghost" data-act="quote">Cotizar</button><div class="sp"></div>${orig ? html`<button class="btn ghost" data-act="del" aria-label="Eliminar">${ico('trash', 16)}</button>` : ''}</div>`,
      {
        addSvc: () => { b.lines.push({ id: uid(), type: 'service', service_id: '', level: 5, qty: 1 }); draw(); },
        addMentor: () => { b.lines.push({ id: uid(), type: 'mentor', mentor_id: '', qty: 1, usd: null }); draw(); },
        rmLine: (x) => { const [l] = b.lines.splice(+x.dataset.i, 1); b.phases.forEach((f) => { if (f.line === l.id) f.line = ''; }); draw(); },
        addPh: () => { b.phases.push({ n: '', w: '', line: '' }); draw(); },
        rmPh: (x) => { b.phases.splice(+x.dataset.i, 1); draw(); },
        save: async () => {
          if (!b.name.trim()) return toast('Falta el nombre', true);
          const doc = { ...b, name: b.name.trim(), lines: b.lines.filter((l) => l.service_id || l.mentor_id) };
          try { const r = orig ? await B.save(doc) : await B.create(doc); bundles = orig ? bundles.map((x) => (x.id === r.id ? r : x)) : [...bundles, r]; toast('Paquete guardado'); closeDrawer(); paint(); }
          catch (e) { toast(e.message, true); }
        },
        quote: () => { const tt = totals(b); if (!tt.ls.some((x) => x.ok)) return toast('Agrega al menos un servicio', true); closeDrawer(); onQuote(quoteOf(b, tt)); },
        del: async () => { if (!(await confirmAsk(`¿Eliminar el paquete «${orig.name}»?`))) return; try { await B.remove(orig.id); bundles = bundles.filter((x) => x.id !== orig.id); closeDrawer(); paint(); } catch (e) { toast(e.message, true); } },
      });
      const d = $('#drawer'); d.scrollTop = keep;
      // Lo escrito se guarda en el paquete al momento (así nunca se lee un formulario viejo).
      $$('[data-k]', d).forEach((x) => x.addEventListener('input', () => { b[x.dataset.k] = x.value; }));
      $$('[data-li]', d).forEach((x) => x.addEventListener('change', () => { const l = b.lines[+x.dataset.li], f = x.dataset.lf; l[f] = f === 'service_id' || f === 'mentor_id' ? x.value : x.value === '' ? null : num(x.value); draw(); }));
      $$('[data-fi]', d).forEach((x) => x.addEventListener(x.tagName === 'SELECT' ? 'change' : 'input', () => { b.phases[+x.dataset.fi][x.dataset.ff] = x.value; }));
    };
    draw();
  }

  // ---------- a cotización: una línea por servicio y por especialista, cada una con su precio ----------
  function quoteOf(b, t) {
    const items = (b.lines || []).map((l, i) => {
      const x = t.ls[i]; if (!x.ok) return null;
      if (l.type === 'mentor') return { name: x.name, description: x.sub, qty: 1, price: x.price, cost: Math.round(x.cost) };
      const s = svc(l.service_id), lv = Math.round(num(l.level, 5));
      return { service_id: s.id, name: s.name, description: s.description || '', qty: Math.max(1, num(l.qty, 1)), level: lv, price: x.price / Math.max(1, num(l.qty, 1)), includes: includesAt(s, lv) };
    }).filter(Boolean);
    const plan = (b.phases || []).filter((f) => f.n).map((f) => `${f.n}${f.w ? ` (semanas ${f.w})` : ''}${f.line ? ` · ${t.ls[b.lines.findIndex((l) => l.id === f.line)]?.name || ''}` : ''}`);
    return { items, intro: b.desc || '', notes: plan.length ? `Plan de trabajo (${b.name}):\n${plan.map((x) => '• ' + x).join('\n')}` : '' };
  }

  // Los botones de la lista usan data-bact (no data-act) para no chocar con las acciones de Sales.
  body.addEventListener('click', (e) => { const t = e.target.closest('[data-bact]'); if (!t || !body.contains(t)) return; if (t.dataset.bact === 'new') edit(null); else if (t.dataset.bact === 'open') edit(bundles.find((b) => b.id === t.dataset.id)); });
  paint();
}
