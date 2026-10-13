import { html, raw, mount, col, api, drawer, closeDrawer, ask, toast, acts, confirmAsk, Q, USD, fdate, fdateLong, today, $, $$, emblem , wizard, teamList } from '../core.js';
import { hoursAt, svcHours, svcCost, svcPrice, svcAuto, pricesOf, cxAt, GROWTH, growthText, includesAt, daysAt } from '../cycle.js';
import { newProject } from '../create.js';
import { mentorsTab, editMentor } from '../mentors.js';
import { packagesTab } from '../paquetes.js';
import { ajustarHoras } from '../ajuste-horas.js';

const STAGES = ['Nuevo', 'Contactado', 'Propuesta', 'Ganado', 'Perdido'];
const OPEN = ['Nuevo', 'Contactado', 'Propuesta'];
const TAGS = { 'High ticket': 'dark', 'No contestó': 'red', 'Interesado': 'green', 'Cotizando': 'amber', 'Propuesta enviada': 'blue', 'Referido': 'lime', 'Frío': '' };
const SOURCES = ['WhatsApp', 'Instagram', 'Web', 'Referido', 'Evento', 'LinkedIn', 'Otro'];
const CATS = ['IA y automatización', 'CRM y ventas', 'Landing y conversión', 'Marketing y publicidad', 'Producción de video', 'Fotografía', 'Email marketing', 'SEO local', 'Analítica y medición', 'UGC y contenido mensual'];
const CATC = { 'IA y automatización': 'lime', 'CRM y ventas': 'blue', 'Landing y conversión': 'green', 'Marketing y publicidad': 'amber', 'Producción de video': 'red', Fotografía: 'dark', 'Email marketing': 'blue', 'SEO local': 'green', 'Analítica y medición': 'lime', 'UGC y contenido mensual': 'amber' };
const DEFAULT_ROLES = [['Estrategia', null], ['Producción', 150], ['Fotografía', null], ['Edición', null], ['Diseño', null], ['Dev / Tech', null], ['Operador', null], ['Pauta', null]];
const QSTATUS = { Borrador: 'amber', Enviada: 'blue', Aceptada: 'green', Rechazada: 'red' };

const score = (i) => html`<span class="score ${i >= 4 ? 'hot' : ''}">${[1, 2, 3, 4, 5].map((k) => html`<i class="${k <= (i || 0) ? 'on' : ''}"></i>`)}</span>`;
const tagChip = (t) => html`<span class="chip ${TAGS[t] ?? ''}" style="margin:2px">${t}</span>`;

export async function render(el, { me, sub, alive }) {
  const isCeo = me.role === 'ceo';
  const canProject = me.areas.includes('operations');
  const L = col('leads'), S = col('services'), C = col('quotes'), R = col('rates');
  let [leads, services, quotes] = await Promise.all([L.list(), S.list(), C.list()]);
  let rates = null;
  if (isCeo) { rates = await R.get('default').catch(() => null); }
  let plans = null, plansErr = null;
  // Los SOPs de la Library: cada tarjeta del catálogo enlaza al de su servicio (si no tienes acceso a la Library, no se muestra).
  let sops = {};
  col('docs').list().then((l) => { sops = Object.fromEntries(l.filter((d) => d.kind === 'SOP' && /^SOP · /.test(d.title)).map((d) => [d.title.slice(6).trim().toLowerCase(), d])); if (tab === 'cat' && alive()) paint(); }).catch(() => {});
  const sopOf = (s) => sops[String(s.name || '').trim().toLowerCase()];
  api('repo/precios').then((r) => { plans = r; if (tab === 'cat' && alive()) paint(); }).catch((e) => { plansErr = e.message; });

  let tab = ['crm', 'cat', 'esp', 'quotes', ...(isCeo ? ['pkg'] : [])].includes(sub[0]) ? sub[0] : 'crm';
  let mentors = null, mInd = 'Todas';
  let crmView = 'list', q = '', tagF = '', catF = 'Todos';

  // ---------- costos (solo CEO) ----------
  const rateOf = (role) => rates?.roles?.find((r) => r.role === role)?.rate ?? null;
  // Costo = horas de cada rol en el nivel del servicio (5 sencillo · 10 fuerte) × su costo por hora.
  const costOf = (s, lv) => svcCost(s, rates, lv);
  const hours = (s) => svcHours(s);
  // Precio de un servicio en un nivel: el automático (horas × costo/h × multiplicador × complejidad) o, si se fijó uno, ese.
  const priceAt = (s, lv) => (isCeo && rates && !s.price_fixed && !(s.price && !s.prices) ? svcAuto(s, rates, lv) : null) ?? svcPrice(s, lv);
  let cardLv = {};
  // Lo que incluye y cuánto tarda un servicio en un nivel (para la cotización y su PDF).
  const incHtml = (sv, lv) => html`${daysAt(sv, lv) ? html`<div><b style="font-weight:500">⏱ ${daysAt(sv, lv)} días hábiles</b></div>` : ''}${includesAt(sv, lv).length ? html`<ul style="margin:4px 0 0 18px;padding:0">${includesAt(sv, lv).map((x) => html`<li>${x}</li>`)}</ul>` : ''}`;
  const quoteDays = (doc) => Math.max(0, ...doc.items.map((i) => { const sv = services.find((x) => x.id === i.service_id); return sv ? daysAt(sv, i.level || sv.level || 5) || 0 : 0; }));
  const lvName = (lv) => (lv <= 6 ? 'Sencillo' : lv >= 9 ? 'Fuerte' : 'Medio');
  const suggested = (s, lv = s.level || 5) => (isCeo && rates ? svcAuto(s, rates, lv) : null);
  // La tarjeta del catálogo en un nivel: precio, horas, días y qué incluye (cambia con el slider de afuera).
  const cardBody = (s, lv) => { const p = priceAt(s, lv), d = daysAt(s, lv), inc = includesAt(s, lv);
    return html`<div class="row sm"><b style="font-weight:500">${lvName(lv)} · ${lv}</b><span class="mut">&nbsp;· ${svcHours(s, lv)} h${d ? ` · ${d} días` : ''}</span><div class="sp"></div><b style="font-size:22px;font-weight:500;letter-spacing:-.5px">${p ? Q(p) : '—'}</b></div>
      ${inc.length ? html`<ul class="svinc">${inc.map((x) => html`<li>${x}</li>`)}</ul>` : ''}
      ${(() => { const c = costOf(s, lv); return c ? html`<div class="mut sm" style="margin-top:8px;border-top:1px solid var(--line);padding-top:8px">🔒 Costo ${c.miss.length ? '⚠️ incompleto' : Q(c.cost)} · hora ×${cxAt(rates, lv)} por complejidad</div>` : ''; })()}`; };

  // ---------- layout ----------
  function paint() {
    mount(el, html`
      <div class="hello"><h1>Sales</h1><p>Cada lead, calificado y con <em>su siguiente paso</em>.</p></div>
      <div class="row" style="margin-bottom:18px;flex-wrap:wrap">
        <div class="tabs" style="margin:0">
          <button class="${tab === 'crm' ? 'on' : ''}" data-act="tab" data-t="crm">CRM</button>
          <button class="${tab === 'cat' ? 'on' : ''}" data-act="tab" data-t="cat">Catálogo de servicios</button>
          <button class="${tab === 'esp' ? 'on' : ''}" data-act="tab" data-t="esp">Especialistas</button>
          <button class="${tab === 'quotes' ? 'on' : ''}" data-act="tab" data-t="quotes">Cotizaciones</button>
          ${isCeo ? html`<button class="${tab === 'pkg' ? 'on' : ''}" data-act="tab" data-t="pkg">Paquetes</button>` : ''}
        </div>
        <div class="sp"></div>
        ${tab === 'crm' ? html`<button class="btn" data-act="newLead">+ Nuevo lead</button>` : ''}
        ${tab === 'cat' ? html`${isCeo ? html`<button class="btn ghost" data-act="repair">Volver horas a la versión anterior</button><button class="btn ghost" data-act="rates">Costos por hora</button>` : ''}<button class="btn" data-act="newService">+ Nuevo servicio</button>` : ''}
        ${tab === 'quotes' ? html`<button class="btn" data-act="newQuote">+ Nueva cotización</button>` : ''}
        ${tab === 'esp' && isCeo ? html`<button class="btn" data-act="newMentor">+ Especialista</button>` : ''}
      </div>
      <div id="body"></div>`);
    const body = $('#body', el);
    ({ crm, cat, esp, quotes: quotesTab, pkg: (b) => packagesTab(b, { onQuote: (pre) => editQuote({ number: nextNumber(), date: today(), valid_days: 15, status: 'Borrador', discount_pct: 0, notes: '', lead_id: '', client: '', contact: '', email: '', ...pre }, null) }) })[tab](body);
  }

  // ---------- Especialistas por industria ----------
  function esp(body) {
    if (!mentors) { mount(body, html`<p class="loading">Cargando…</p>`); col('mentors').list().then((l) => { mentors = l; if (alive() && tab === 'esp') esp(body); }).catch((e) => mount(body, html`<div class="warnbox">${e.message}</div>`)); return; }
    mentorsTab(body, { list: mentors, isCeo, ind: mInd, onInd: (v) => { mInd = v; esp(body); }, onChange: (l) => { mentors = l; esp(body); } });
  }

  // ---------- CRM ----------
  function crm(body) {
    const open = leads.filter((l) => OPEN.includes(l.stage || 'Nuevo'));
    const filtered = leads.filter((l) => (!q || [l.name, l.company, l.contact, l.wants, l.notes].join(' ').toLowerCase().includes(q)) && (!tagF || (l.tags || []).includes(tagF)));
    const usedTags = [...new Set(leads.flatMap((l) => l.tags || []))];
    const late = (l) => l.next_date && l.next_date < today() && OPEN.includes(l.stage || 'Nuevo');
    mount(body, html`
      <div class="grid g4" style="margin-bottom:18px">
        <div class="card glass"><span class="mut sm">Calientes 🔥</span><div class="big" style="font-size:42px">${open.filter((l) => (l.interest || 0) >= 4).length}</div></div>
        <div class="card glass"><span class="mut sm">High ticket</span><div class="big" style="font-size:42px">${open.filter((l) => (l.tags || []).includes('High ticket')).length}</div></div>
        <div class="card glass"><span class="mut sm">No contestaron</span><div class="big" style="font-size:42px">${open.filter((l) => (l.tags || []).includes('No contestó')).length}</div></div>
        <div class="card glass"><span class="mut sm">Pipeline abierto / mes</span><div class="big" style="font-size:42px">${USD(open.reduce((a, l) => a + (+l.value_usd || 0), 0))}</div></div>
      </div>
      <div class="row" style="margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <input class="in" id="q" placeholder="Buscar lead…" value="${q}" style="max-width:260px">
        <button class="chip ${tagF ? '' : 'dark'}" data-act="tagF" data-t="" style="padding:8px 14px">Todos</button>
        ${usedTags.map((t) => html`<button class="chip ${tagF === t ? 'dark' : ''}" data-act="tagF" data-t="${t}" style="padding:8px 14px">${t}</button>`)}
        <div class="sp"></div>
        <div class="tabs" style="margin:0"><button class="${crmView === 'list' ? 'on' : ''}" data-act="crmView" data-v="list">Lista</button><button class="${crmView === 'board' ? 'on' : ''}" data-act="crmView" data-v="board">Tablero</button></div>
      </div>
      ${!leads.length ? html`<div class="empty"><b>Todavía no hay leads</b>Crea el primero con «+ Nuevo lead».</div>`
      : crmView === 'list' ? html`<div class="card"><table><thead><tr><th>Lead</th><th>Interés</th><th>Estado</th><th>Etapa</th><th>Interesado en</th><th class="n">Valor / mes</th><th>Siguiente paso</th></tr></thead><tbody>
        ${filtered.map((l) => html`<tr class="click" data-act="lead" data-id="${l.id}"><td><b style="font-weight:500">${l.name}</b><div class="mut sm">${[l.contact, l.company].filter(Boolean).join(' · ')}</div></td><td>${score(l.interest)}</td><td>${(l.tags || []).map(tagChip)}</td><td><span class="chip">${l.stage || 'Nuevo'}</span></td><td>${l.wants || '—'}</td><td class="n">${l.value_usd ? USD(l.value_usd) : '—'}</td><td class="sm ${late(l) ? 'bad' : ''}" style="${late(l) ? 'color:#654c38;font-weight:700' : ''}">${l.next_step || '—'}${l.next_date ? html`<div class="mut">${fdate(l.next_date)}</div>` : ''}</td></tr>`)}
        </tbody></table></div>`
      : html`<div class="kanban">${STAGES.map((s) => { const ls = filtered.filter((l) => (l.stage || 'Nuevo') === s); return html`<div class="kcol" data-stage="${s}"><h4><span>${s}</span><span class="mut">${ls.length}</span></h4>
          ${ls.map((l) => html`<div class="kcard" draggable="true" data-act="lead" data-id="${l.id}"><b>${l.name}</b><div class="mut sm">${l.wants || ''}</div><div class="row" style="margin-top:8px">${score(l.interest)}<div class="sp"></div><span class="sm">${l.value_usd ? USD(l.value_usd) : ''}</span></div></div>`)}</div>`; })}</div>`}`);
    const qi = $('#q', body);
    qi.oninput = () => { q = qi.value.toLowerCase(); const pos = qi.selectionStart; crm(body); const n = $('#q', body); n.focus(); n.setSelectionRange(pos, pos); };
    // drag & drop entre etapas
    $$('.kcard', body).forEach((c) => c.addEventListener('dragstart', (e) => e.dataTransfer.setData('id', c.dataset.id)));
    $$('.kcol', body).forEach((k) => {
      k.addEventListener('dragover', (e) => { e.preventDefault(); k.classList.add('over'); });
      k.addEventListener('dragleave', () => k.classList.remove('over'));
      k.addEventListener('drop', async (e) => {
        e.preventDefault(); k.classList.remove('over');
        const l = leads.find((x) => x.id === e.dataTransfer.getData('id'));
        if (!l || l.stage === k.dataset.stage) return;
        await saveLead({ ...l, stage: k.dataset.stage, activity: [...(l.activity || []), { at: new Date().toISOString(), who: me.name, text: `Etapa: ${l.stage || 'Nuevo'} → ${k.dataset.stage}` }] });
        crm(body);
      });
    });
  }

  async function saveLead(l) {
    try { const s = await L.save(l); leads = leads.map((x) => (x.id === s.id ? s : x)); toast('Guardado ✅'); return s; }
    catch (e) { toast(e.message, true); return null; }
  }

  function openLead(l) {
    let tags = [...(l.tags || [])], interest = l.interest || 0;
    const all = [...new Set([...Object.keys(TAGS), ...tags])];
    const d = drawer(html`<div class="row"><span class="chip">${l.source || 'Sin fuente'}</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
      <h2>${l.name}</h2><div class="mut">${[l.contact, l.company].filter(Boolean).join(' · ')}</div>
      <div style="margin:18px 0 6px" class="sm mut">Interés</div>
      <div class="scorein" id="sc">${[1, 2, 3, 4, 5].map((n) => html`<button data-act="score" data-n="${n}" class="${n <= interest ? 'on' : ''}" title="${n}"></button>`)}</div>
      <div style="margin:16px 0 6px" class="sm mut">Estado</div>
      <div class="tagbox" id="tg">${all.map((t) => html`<span class="chip ${tags.includes(t) ? TAGS[t] ?? 'dark' : 'off'}" data-act="tag" data-t="${t}">${t}</span>`)}<span class="chip off" data-act="newTag">+ etiqueta</span></div>
      <form class="form" id="lf" style="margin-top:18px">
        <div class="two"><div><label class="f">Etapa</label><select class="in" name="stage">${STAGES.map((s) => html`<option ${s === (l.stage || 'Nuevo') ? raw('selected') : ''}>${s}</option>`)}</select></div>
          <div><label class="f">Valor mensual (USD)</label><input class="in" name="value_usd" type="number" value="${l.value_usd ?? ''}"></div></div>
        <div><label class="f">Interesado en</label><input class="in" name="wants" value="${l.wants || ''}"></div>
        <div class="two"><div><label class="f">Siguiente paso</label><input class="in" name="next_step" value="${l.next_step || ''}"></div>
          <div><label class="f">Fecha</label><input class="in" name="next_date" type="date" value="${l.next_date || ''}"></div></div>
        <div class="two"><div><label class="f">Teléfono / WhatsApp</label><input class="in" name="phone" value="${l.phone || ''}"></div>
          <div><label class="f">Correo</label><input class="in" name="email" type="email" value="${l.email || ''}"></div></div>
        <div><label class="f">Notas</label><textarea class="in" name="notes">${l.notes || ''}</textarea></div>
      </form>
      <div class="row" style="margin:16px 0"><button class="btn" data-act="save">Guardar</button><button class="btn ghost" data-act="quote">Crear cotización</button><div class="sp"></div><button class="btn ghost" data-act="del" title="Eliminar">🗑</button></div>
      <b class="sm">Historial</b>
      <div class="row" style="margin:8px 0"><input class="in" id="note" placeholder="Registrar llamada, mensaje o nota…"><button class="btn ghost" data-act="note">Agregar</button></div>
      ${(l.activity || []).slice().reverse().map((a) => html`<div class="comment"><span class="av">${(a.who || '?')[0]}</span><p><span class="mut sm">${fdate(a.at.slice(0, 10))} · ${a.who}</span><br>${a.text}</p></div>`)}`,
    {
      score: (b) => { interest = +b.dataset.n; $$('#sc button').forEach((x) => x.classList.toggle('on', +x.dataset.n <= interest)); },
      tag: (b) => { const t = b.dataset.t; tags = tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]; b.className = `chip ${tags.includes(t) ? TAGS[t] ?? 'dark' : 'off'}`; },
      newTag: async () => { const v = await ask('Nueva etiqueta', [{ k: 't', l: 'Etiqueta', req: true }], 'Agregar'); if (v) { tags.push(v.t); await persist(); openLead(leads.find((x) => x.id === l.id)); } },
      save: async () => { if (await persist()) { closeDrawer(); paint(); } },
      note: async () => { const n = $('#note').value.trim(); if (!n) return; l = leads.find((x) => x.id === l.id); const s = await saveLead({ ...l, ...formVals(), tags, interest, activity: [...(l.activity || []), { at: new Date().toISOString(), who: me.name, text: n }] }); if (s) openLead(s); },
      quote: async () => { await persist(); closeDrawer(); editQuote(null, leads.find((x) => x.id === l.id)); },
      del: async () => { if (!(await confirmAsk(`¿Eliminar a ${l.name}?`))) return; await L.remove(l.id); leads = leads.filter((x) => x.id !== l.id); closeDrawer(); paint(); },
    });
    const formVals = () => { const f = $('#lf', d); const o = Object.fromEntries(new FormData(f)); o.value_usd = o.value_usd === '' ? null : +o.value_usd; return o; };
    async function persist() {
      const cur = leads.find((x) => x.id === l.id);
      const v = formVals();
      const changes = cur.stage !== v.stage ? [{ at: new Date().toISOString(), who: me.name, text: `Etapa: ${cur.stage || 'Nuevo'} → ${v.stage}` }] : [];
      const s = await saveLead({ ...cur, ...v, tags, interest, activity: [...(cur.activity || []), ...changes] });
      if (s) l = s; return s;
    }
  }

  async function newLead() {
    const v = await wizard('Nuevo lead', [
      { k: 'name', q: '¿Qué empresa o marca es?', type: 'text', req: true, ph: 'Nombre de la marca' },
      { k: 'wants', q: '¿Qué le interesa?', type: 'cards', req: true, opts: [
        { v: 'Marketing', i: '🔷', l: 'Marketing', d: 'Que lo conozcan' }, { v: 'Marketing Pro', i: '🔷', l: 'Marketing Pro', d: 'Presencia sostenida' },
        { v: 'Accelerate', i: '🟨', l: 'Accelerate', d: 'Está estancado, quiere facturar' }, { v: 'Compound', i: '🟨', l: 'Compound', d: 'Escalar y sistematizar' },
        { v: 'Proyecto puntual', i: '🧩', l: 'Proyecto puntual' }, { v: 'No sé todavía', i: '❔', l: 'No sé todavía' }] },
      { k: 'interest', q: '¿Qué tan caliente está?', type: 'cards', req: true, opts: [['1', '🧊', 'Frío'], ['2', '🌤️', 'Tibio'], ['3', '🙂', 'Interesado'], ['4', '🔥', 'Caliente'], ['5', '🚀', 'Listo para cerrar']].map(([v, i, l]) => ({ v, i, l })) },
      { k: 'source', q: '¿Cómo llegó?', type: 'cards', req: true, opts: SOURCES.map((x) => ({ v: Array.isArray(x) ? x[0] : x, l: Array.isArray(x) ? x[1] : x })) },
      { k: 'contact', q: '¿Con quién hablamos?', sub: 'Nombre y WhatsApp (puedes dejarlo vacío)', type: 'text', ph: 'Nombre · +502 …' },
    ], 'Crear lead');
    if (!v) return;
    const [contact, phone] = String(v.contact || '').split('·').map((x) => x.trim());
    const l = await L.create({ name: v.name, wants: v.wants, source: v.source, contact: contact || '', phone: phone || '', stage: 'Nuevo', interest: +v.interest, tags: +v.interest >= 4 ? ['Interesado'] : [], activity: [{ at: new Date().toISOString(), who: me.name, text: 'Lead creado' }] });
    leads.push(l); paint(); openLead(l);
  }


  // ---------- Catálogo ----------
  function cat(body) {
    const cats = ['Todos', ...new Set([...CATS, ...services.map((s) => s.category).filter(Boolean)])];
    const list = services.filter((s) => catF === 'Todos' || s.category === catF);
    mount(body, html`
      ${plans ? html`<div class="sec-title" style="margin-top:0"><h2>Planes</h2><span class="mut sm">Del manual de Inherent · precio mensual</span></div>
        <div class="grid g4" style="margin-bottom:8px">${plans.plans.map((p, i) => html`<div class="card feat ${['olive', 'terra', 'ink', 'olive'][i]}" style="min-height:170px"><div class="lbl">${p.name}</div><div class="big" style="font-size:38px;margin-top:8px">${Q(p.precio)}</div><div class="foot"><span>${p.volumen?.piezas ?? '—'} piezas · ${USD(p.precioUsd)}</span>${isCeo && p.margen != null ? html`<span style="font-weight:700">${p.margen}% margen</span>` : ''}</div></div>`)}</div>`
        : plansErr ? html`<div class="warnbox" style="margin-bottom:14px">No pude leer los planes del repo: ${plansErr}</div>` : ''}
      <div class="sec-title"><h2>Servicios</h2><span class="mut sm">Mueve el nivel de entrega de cada uno para ver su precio y lo que incluye</span></div>
      <div class="row" style="margin-bottom:14px;gap:8px;flex-wrap:wrap">${cats.map((c) => html`<button class="chip ${catF === c ? 'dark' : ''}" data-act="catF" data-c="${c}" style="padding:8px 14px;font-size:13px">${c}</button>`)}</div>
      ${isCeo && rates && (rates.roles || []).some((r) => r.rate == null) ? html`<div class="warnbox" style="margin-bottom:14px">⚠️ Faltan costos por hora de: ${(rates.roles || []).filter((r) => r.rate == null).map((r) => r.role).join(', ')}. Sin eso no hay costo ni precio sugerido.</div>` : ''}
      ${!services.length ? html`<div class="empty"><b>Todavía no hay servicios</b>Crea uno con «+ Nuevo servicio», o carga ejemplos para editarlos.<div style="margin-top:14px"><button class="btn ghost" data-act="seed">Cargar 9 ejemplos para editar</button></div></div>`
      : html`<div class="grid g3">${list.map((s) => { const lv = cardLv[s.id] || s.level || 5, g = growthText({ type: s.growth_type, pct: s.growth_pct }); return html`<div class="card svcard" style="cursor:pointer" data-act="service" data-id="${s.id}">
        <div class="row"><span class="chip ${CATC[s.category] ?? ''}">${s.category || 'Sin categoría'}</span><div class="sp"></div><span class="mut sm">${s.unit || 'proyecto'}${s.price_fixed ? ' · precio fijo' : ''}</span></div>
        <h3 style="font-size:19px;font-weight:500;letter-spacing:-.4px;margin:12px 0 4px">${s.name}</h3><div class="mut sm">${s.description || ''}</div>
        ${g ? html`<div class="sm svgrow">📈 + ${g}</div>` : ''}
        <div class="svlv" data-stop><input type="range" min="5" max="10" step="1" value="${lv}" data-cardlv="${s.id}" aria-label="Nivel de entrega"><div class="row mut" style="font-size:11px"><span>5 · sencillo</span><div class="sp"></div><span>10 · fuerte</span></div></div>
        <div data-cardbody="${s.id}">${cardBody(s, lv)}</div>
        ${sopOf(s) ? html`<a class="sm" data-stop href="#/library/${sopOf(s).folder_id || '_'}/${sopOf(s).id}" style="display:inline-block;margin-top:10px;color:#87684e;font-weight:500">📋 Ver el SOP de este servicio →</a>` : ''}
</div>`; })}</div>`}`);
  }

  async function editService(s, after) {
    const roles = (rates?.roles || DEFAULT_ROLES.map(([role]) => ({ role }))).map((r) => r.role);
    let tasks = (s?.tasks || [{ role: roles[0], hours: 1 }]).map((t) => ({ ...t, hours10: t.hours10 ?? (+t.hours || 0) * 2 }));
    let level = s?.level || 5;
    // Lo que va escrito en el formulario (para que la vista previa del nivel use lo último).
    const curForm = () => { const f = $('#sf'); return f ? Object.fromEntries(new FormData(f)) : {}; };
    // La vista previa del nivel (horas, días y qué incluye). Se actualiza sola mientras escribes.
    const prev = (fv) => { const cur = { ...fv, tasks, level }; return html`<div class="mut sm">En este nivel: ${tasks.map((t) => `${t.role} ${hoursAt(t, level)} h`).join(' · ')} = <b>${svcHours(cur, level)} h</b>${daysAt(fv, level) ? html` · tarda <b>${daysAt(fv, level)} días hábiles</b>` : ''}. El precio de abajo es el de este nivel.</div>
          ${includesAt(fv, level).length ? html`<div class="sm" style="margin-top:8px"><b style="font-weight:500">Incluye en este nivel:</b><ul style="margin:4px 0 0 18px;padding:0">${includesAt(fv, level).map((x) => html`<li>${x}</li>`)}</ul></div>` : ''}`; };
    let fresh = true; // la primera vez no se lee el formulario: lo que queda montado es el de la tarjeta anterior
    const draw = () => {
      const keep = fresh ? {} : curForm(); fresh = false; const fv = { ...(s || {}), ...keep };
      const cur = { ...(s || {}), tasks, level, markup: +($('#svmk')?.value || s?.markup || 2.2) };
      const c = costOf(cur, level), sug = suggested(cur, level);
      drawer(html`<div class="row"><span class="chip">Servicio</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
        <h2>${s ? 'Editar servicio' : 'Nuevo servicio'}</h2>
        <form class="form" id="sf" style="margin-top:14px">
          <div><label class="f">Nombre *</label><input class="in" name="name" value="${fv.name || ''}"></div>
          <div class="two"><div><label class="f">Categoría</label><select class="in" name="category">${[...new Set([...CATS, fv.category].filter(Boolean))].map((c2) => html`<option ${c2 === fv.category ? raw('selected') : ''}>${c2}</option>`)}</select></div>
            <div><label class="f">Se cobra por</label><select class="in" name="unit">${['proyecto', 'mes', 'pieza', 'hora', 'jornada'].map((u) => html`<option ${u === (fv.unit || 'proyecto') ? raw('selected') : ''}>${u}</option>`)}</select></div></div>
          <div><label class="f">Descripción (sale en la cotización)</label><input class="in" name="description" value="${fv.description || ''}"></div>
          <div class="two"><div><label class="f">Incluye en sencillo (5) · uno por línea</label><textarea class="in" name="includes5" placeholder="Landing de 1 sección&#10;Formulario de contacto&#10;1 ronda de cambios">${fv.includes5 || ''}</textarea></div>
            <div><label class="f">Se suma al subir a fuerte (10)</label><textarea class="in" name="includes10" placeholder="Copy con investigación&#10;Pruebas A/B&#10;Integración con CRM">${fv.includes10 || ''}</textarea></div></div>
          <div class="two"><div><label class="f">Tarda en sencillo (días hábiles)</label><input class="in" name="days5" type="number" value="${fv.days5 ?? ''}"></div><div><label class="f">Tarda en fuerte (días hábiles)</label><input class="in" name="days10" type="number" value="${fv.days10 ?? ''}"></div></div>
          <div><label class="f">Qué necesitamos del cliente para arrancar · uno por línea <span class="mut">(su onboarding en el portal)</span></label><textarea class="in" name="onboarding" placeholder="Acceso al dominio y hosting&#10;Logo y manual de marca&#10;Quién aprueba de su lado">${fv.onboarding || ''}</textarea></div>
          <div class="two"><div><label class="f">¿Genera crecimiento directo? Qué tipo</label><select class="in" name="growth_type"><option value="">No · solo se cobra el precio</option>${Object.keys(GROWTH).map((k) => html`<option ${k === fv.growth_type ? raw('selected') : ''}>${k}</option>`)}</select></div>
            <div><label class="f">% del crecimiento que se cobra</label><input class="in" name="growth_pct" type="number" step="0.5" value="${fv.growth_pct ?? 10}"></div></div>
          <div><label class="f">Cómo genera ese crecimiento <span class="mut">(sale en la cotización)</span></label><input class="in" name="growth_how" value="${fv.growth_how || ''}" placeholder="Ej. el agente responde y agenda 24/7: más leads atendidos = más ventas"></div>
        </form>
        <div class="row sm mut" style="margin:18px 0 8px"><span style="flex:1">Horas por rol</span><span style="width:90px;text-align:center">Sencillo · 5</span><span style="width:90px;text-align:center">Fuerte · 10</span><span style="width:44px"></span></div>
        ${tasks.map((t, i) => html`<div class="row" style="margin-bottom:8px"><select class="in" data-i="${i}" data-f="role">${[...new Set([...roles, t.role])].map((r) => html`<option ${r === t.role ? raw('selected') : ''}>${r}</option>`)}</select><input class="in" style="max-width:90px" type="number" step="0.5" data-i="${i}" data-f="hours" value="${t.hours}"><input class="in" style="max-width:90px" type="number" step="0.5" data-i="${i}" data-f="hours10" value="${t.hours10}"><button class="btn ghost" data-act="rmTask" data-i="${i}" style="padding:8px 12px">✕</button></div>`)}
        <div class="card glass" style="margin-top:14px;padding:14px"><div class="row"><b style="font-weight:500">Nivel de entrega</b><div class="sp"></div><span class="chip ${level >= 8 ? 'dark' : ''}">${level <= 6 ? 'Sencillo' : level >= 9 ? 'Fuerte' : 'Medio'} · ${level}</span></div>
          <input type="range" min="5" max="10" step="1" value="${level}" id="svlv" style="width:100%;margin:10px 0 4px">
          <div id="svprev">${prev(fv)}</div></div>
        <button class="btn ghost" data-act="addTask" style="padding:8px 14px">+ Rol</button>
        ${isCeo ? html`<div class="card glass" style="margin-top:18px;padding:16px"><div class="row" style="flex-wrap:wrap;gap:12px"><div><div class="mut sm">Costo en este nivel</div><b style="font-weight:500">${c ? (c.miss.length ? `⚠️ falta costo/h de ${c.miss.join(', ')}` : Q(c.cost)) : '—'}</b></div>
          <div><div class="mut sm">Complejidad</div><b style="font-weight:500">hora ×${cxAt(rates, level)}</b></div><div class="sp"></div>
          <div><label class="f">Multiplicador</label><input class="in" id="svmk" type="number" step="0.1" value="${cur.markup}" style="width:90px"></div>
          <div style="text-align:right"><div class="mut sm">Precio automático</div><b style="font-size:22px;font-weight:500">${sug ? Q(sug) : '—'}</b></div></div>
          <div class="mut sm" style="margin-top:8px">= horas del experto × costo por hora × multiplicador × complejidad. Se recalcula solo si cambian las horas o los costos.</div></div>` : ''}
        <div style="margin-top:14px"><label class="f">Precio fijo (opcional · déjalo vacío para que sea automático)</label><input class="in" id="svprice" type="number" value="${s?.price_fixed ?? (s?.price && !s?.prices ? s.price : '')}" placeholder="${sug ? 'Automático: ' + sug : ''}"></div>
        <div class="row" style="margin-top:18px"><button class="btn" data-act="saveSvc">Guardar</button><div class="sp"></div>${s ? html`<button class="btn ghost" data-act="delSvc">🗑</button>` : ''}</div>`,
      {
        addTask: () => { sync(); tasks.push({ role: roles[0], hours: 1 }); draw(); },
        rmTask: (b) => { sync(); tasks.splice(+b.dataset.i, 1); draw(); },
        saveSvc: async () => {
          sync();
          const f = Object.fromEntries(new FormData($('#sf')));
          if (!f.name) return toast('Falta el nombre', true);
          const fixed = $('#svprice').value === '' ? null : +$('#svprice').value;
          const doc = { ...(s || {}), ...f, growth_pct: f.growth_type ? +f.growth_pct || 0 : null, tasks, level, markup: +($('#svmk')?.value || s?.markup || 2.2), price_fixed: fixed };
          if (isCeo && rates) doc.prices = pricesOf(doc, rates);
          doc.price = fixed ?? doc.prices?.[level] ?? s?.price ?? null;
          try { const r = s ? await S.save(doc) : await S.create(doc); services = s ? services.map((x) => (x.id === r.id ? r : x)) : [...services, r]; toast('Guardado ✅'); closeDrawer(); after ? after(r) : paint(); }
          catch (e) { toast(e.message, true); }
        },
        delSvc: async () => { if (!(await confirmAsk(`¿Eliminar ${s.name}?`))) return; await S.remove(s.id); services = services.filter((x) => x.id !== s.id); closeDrawer(); paint(); },
      });
      $$('[data-f]', $('#drawer')).forEach((inp) => inp.addEventListener('change', () => { sync(); draw(); }));
      $('#svmk')?.addEventListener('change', draw);
      $$('#sf [name=includes5], #sf [name=includes10], #sf [name=days5], #sf [name=days10]').forEach((x) => x.addEventListener('input', () => mount($('#svprev'), prev({ ...(s || {}), ...curForm() }))));
      $('#svlv').addEventListener('input', (e) => { sync(); level = +e.target.value; const y = $('#drawer').scrollTop; draw(); $('#drawer').scrollTop = y; });
    };
    const sync = () => $$('[data-f]', $('#drawer')).forEach((inp) => { tasks[+inp.dataset.i][inp.dataset.f] = inp.dataset.f === 'role' ? inp.value : +inp.value; });
    draw();
  }

  async function editRates() {
    let roles = (rates?.roles || DEFAULT_ROLES.map(([role, rate]) => ({ role, rate }))).map((r) => ({ ...r }));
    const draw = () => drawer(html`<div class="row"><span class="chip dark">🔒 Solo CEO</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
      <h2>Costos por hora</h2><p class="mut sm" style="margin-top:6px">Lo que le cuesta a Inherent una hora de cada rol. Con esto se calcula el costo de cada servicio.</p>
      <div style="margin-top:18px">${roles.map((r, i) => html`<div class="row" style="margin-bottom:8px"><input class="in" data-i="${i}" data-f="role" value="${r.role}"><span class="mut">Q</span><input class="in" style="max-width:110px" type="number" data-i="${i}" data-f="rate" value="${r.rate ?? ''}" placeholder="⚠️"><span class="mut sm">/h</span><button class="btn ghost" data-act="rm" data-i="${i}" style="padding:8px 12px">✕</button></div>`)}</div>
      <button class="btn ghost" data-act="add" style="padding:8px 14px">+ Rol</button>
      <div class="card glass" style="margin-top:18px;padding:14px"><b style="font-weight:500">Complejidad</b><p class="mut sm" style="margin:4px 0 10px">Una hora de trabajo fuerte (nivel 10) vale más que una sencilla (nivel 5). En medio sube parejo.</p>
        <div class="row" style="gap:8px"><span class="sm">La hora en nivel 10 vale</span><span class="mut">×</span><input class="in" id="cx10" type="number" step="0.05" min="1" value="${rates?.cx10 ?? 1.5}" style="max-width:90px"><span class="mut sm">la del nivel 5</span></div></div>
      <div class="row" style="margin-top:18px"><button class="btn" data-act="saveRates">Guardar</button></div>`,
    {
      add: () => { sync(); roles.push({ role: '', rate: null }); draw(); },
      rm: (b) => { sync(); roles.splice(+b.dataset.i, 1); draw(); },
      saveRates: async () => {
        sync();
        const clean = roles.filter((r) => r.role.trim()).map((r) => ({ role: r.role.trim(), rate: r.rate === '' || r.rate == null || isNaN(r.rate) ? null : +r.rate }));
        const cx10 = Math.max(1, +$('#cx10').value || 1.5);
        try { rates = rates ? await R.save({ ...rates, roles: clean, cx10 }) : await R.create({ id: 'default', roles: clean, cx10 });
          // Los precios automáticos se recalculan con los costos nuevos (los de precio fijo no se tocan).
          let n = 0;
          for (const sv of services) { if (sv.price_fixed || (sv.price && !sv.prices)) continue; const prices = pricesOf(sv, rates); if (JSON.stringify(prices) === JSON.stringify(sv.prices || null)) continue;
            try { const r = await S.save({ ...sv, prices, price: prices?.[sv.level || 5] ?? sv.price }); services = services.map((x) => (x.id === r.id ? r : x)); n++; } catch {} }
          toast(`Costos guardados ✅${n ? ` · ${n} precio${n === 1 ? '' : 's'} recalculado${n === 1 ? '' : 's'}` : ''}`); closeDrawer(); paint(); }
        catch (e) { toast(e.message, true); }
      },
    });
    const sync = () => $$('[data-f]', $('#drawer')).forEach((inp) => { roles[+inp.dataset.i][inp.dataset.f] = inp.dataset.f === 'rate' ? (inp.value === '' ? null : +inp.value) : inp.value; });
    draw();
  }

  async function seed() {
    const EX = [
      ['IA', 'Agente de WhatsApp con IA', 'Responde, califica y agenda 24/7', [['Estrategia', 4], ['Dev / Tech', 18], ['Operador', 6]]],
      ['IA', 'IA entrenada con la marca', 'Tu equipo pregunta y responde con tu voz', [['Estrategia', 3], ['Dev / Tech', 12]]],
      ['Tech', 'CRM ligero + automatizaciones', 'Pipeline, recordatorios y reportes', [['Estrategia', 3], ['Dev / Tech', 14], ['Operador', 4]]],
      ['Tech', 'Landing de conversión', 'Diseño, desarrollo y tracking', [['Diseño', 10], ['Dev / Tech', 12]]],
      ['Marketing', 'Estrategia de lanzamiento', 'Oferta, mensaje y plan de 30 días', [['Estrategia', 10], ['Operador', 6]]],
      ['Marketing', 'Pauta Meta · setup + 1 mes', 'Estructura, creativos y optimización', [['Estrategia', 4], ['Pauta', 10], ['Diseño', 6]]],
      ['Producción', 'Jornada de rodaje (4 h)', 'Grabación por setup', [['Producción', 4], ['Operador', 2]]],
      ['Producción', 'Paquete de 8 reels editados', 'Edición, subtítulos y derivados', [['Edición', 12], ['Operador', 3]]],
      ['Producción', 'Sesión de fotos de producto', '30 fotos editadas', [['Fotografía', 3], ['Diseño', 4]]],
    ];
    for (const [category, name, description, t] of EX) services.push(await S.create({ category, name, description, unit: 'proyecto', markup: 2.2, price: null, example: true, tasks: t.map(([role, hours]) => ({ role, hours })) }));
    toast('9 ejemplos cargados. Ajusta horas y precios ✅'); paint();
  }

  async function repair() {
    if (!(await confirmAsk('¿Devolver las horas de Agente de WhatsApp (6 y 18 h), Landing de conversión (5 y 44 h) y Sistema mensual de contenido corto (6 y 16 h) a como estaban? Solo cambia las horas de esos tres.'))) return;
    try { const r = await ajustarHoras(S, services, rates); services = r.services; toast(`Listo ✅ · ${r.n} servicios ajustados${r.faltan.length ? ` · no encontré ${r.faltan.length}` : ''}`); paint(); }
    catch (e) { toast(e.message, true); paint(); }
  }

  // ---------- Cotizaciones ----------
  // La cotización guarda todo en quetzales y se muestra en su moneda (rate = 1 Q en esa moneda).
  const CUR = (() => { try { return Intl.supportedValuesOf('currency'); } catch { return ['GTQ', 'USD', 'EUR', 'MXN']; } })();
  const curName = (() => { try { const dn = new Intl.DisplayNames(['es'], { type: 'currency' }); return (c) => dn.of(c); } catch { return (c) => c; } })();
  const money = (qq, n) => { const c = qq.currency || 'GTQ', r = c === 'GTQ' ? 1 : +qq.rate || 1; try { return new Intl.NumberFormat('es-GT', { style: 'currency', currency: c, maximumFractionDigits: c === 'GTQ' ? 0 : 2 }).format((+n || 0) * r); } catch { return Q(n); } };
  const subtotal = (qq) => (qq.items || []).reduce((a, i) => a + (+i.qty || 0) * (+i.price || 0), 0);
  const total = (qq) => subtotal(qq) * (1 - (+qq.discount_pct || 0) / 100);
  function quotesTab(body) {
    mount(body, !quotes.length ? html`<div class="empty"><b>Todavía no hay cotizaciones</b>Créala desde un lead del CRM o con «+ Nueva cotización».</div>`
      : html`<div class="card"><table><thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th class="n">Total</th></tr></thead><tbody>
        ${quotes.slice().reverse().map((qq) => html`<tr class="click" data-act="quote" data-id="${qq.id}"><td><b style="font-weight:500">${qq.number}</b></td><td>${qq.client || '—'}</td><td class="mut">${fdate(qq.date)}</td><td><span class="chip ${QSTATUS[qq.status] || ''}">${qq.status || 'Borrador'}</span></td><td class="n"><b>${money(qq, total(qq))}</b></td></tr>`)}
      </tbody></table></div>`);
  }

  function nextNumber() {
    const y = new Date().getFullYear();
    const n = quotes.filter((qq) => String(qq.number || '').startsWith(`COT-${y}-`)).length + 1;
    return `COT-${y}-${String(n).padStart(3, '0')}`;
  }

  // El % del crecimiento que genera un servicio (si genera crecimiento directo).
  const growthOf = (sv) => (sv?.growth_type ? { type: sv.growth_type, pct: +sv.growth_pct || 10, how: sv.growth_how || '' } : null);
  const fees = (doc) => doc.items.filter((i) => i.growth?.type && +i.growth.pct);
  function editQuote(qq, lead) {
    let doc = qq ? JSON.parse(JSON.stringify(qq)) : { number: nextNumber(), date: today(), valid_days: 15, status: 'Borrador', discount_pct: 0, items: [], notes: '', lead_id: lead?.id || '', client: lead?.name || '', contact: lead?.contact || '', email: lead?.email || '' };
    tab = 'quotes';
    const draw = () => {
      // Un servicio que genera crecimiento lleva su % solo (a menos que se haya quitado a mano).
      doc.items.forEach((i) => { if (i.growth === undefined) { const g = growthOf(services.find((x) => x.id === i.service_id)); if (g) i.growth = g; } });
      const st = subtotal(doc), tt = total(doc);
      const cost = isCeo && rates ? doc.items.reduce((a, i) => { const s = services.find((x) => x.id === i.service_id); const c = s ? costOf(s, i.level || s.level || 5) : null; return a + (c && !c.miss.length ? c.cost * (+i.qty || 0) : 0); }, 0) : null;
      mount(el, html`
        <div class="row" style="margin-bottom:22px"><button class="btn ghost" data-act="back">← Cotizaciones</button><div class="sp"></div>
          <select class="in" id="qcur" style="width:auto;max-width:230px" title="Moneda">${CUR.map((c) => html`<option value="${c}" ${c === (doc.currency || 'GTQ') ? raw('selected') : ''}>${c} · ${curName(c)}</option>`)}</select>
          ${doc.currency && doc.currency !== 'GTQ' ? html`<label class="sm mut row" style="gap:6px">1 Q =<input class="in" id="qrate" type="number" step="0.0001" value="${doc.rate || ''}" style="width:100px"></label>` : ''}
          <select class="in" id="qstatus" style="width:auto">${Object.keys(QSTATUS).map((s) => html`<option ${s === doc.status ? raw('selected') : ''}>${s}</option>`)}</select>
          <button class="btn ghost" data-act="pdf">Ver PDF</button>${doc.id && doc.items.some((i) => i.service_id) && canProject ? html`<button class="btn ghost" data-act="toProject">→ Crear proyecto</button>` : ''}<button class="btn" data-act="saveQ">Guardar</button></div>
        <div class="grid g2">
          <div class="card">
            <div class="chead"><div class="ico">✎</div><h3>${doc.number}<br><span class="mut sm">${fdateLong(doc.date)}</span></h3></div>
            <form class="form" id="qf">
              <div class="two"><div><label class="f">Cliente</label><input class="in" name="client" list="leadlist" value="${doc.client}"></div><div><label class="f">Contacto</label><input class="in" name="contact" value="${doc.contact || ''}"></div></div>
              <datalist id="leadlist">${leads.map((l) => html`<option value="${l.name}">`)}</datalist>
            </form>
            <div class="sm mut" style="margin:18px 0 8px">Servicios</div>
            ${doc.items.map((it, i) => html`<div class="card glass" style="padding:12px 14px;margin-bottom:8px;border-radius:18px"><div class="row"><input class="in" data-i="${i}" data-f="name" value="${it.name}" style="font-weight:500"><button class="btn ghost" data-act="rmItem" data-i="${i}" style="padding:8px 12px">✕</button></div>
              <div class="row" style="margin-top:8px"><input class="in" data-i="${i}" data-f="description" value="${it.description || ''}" placeholder="Descripción"><input class="in" style="max-width:80px" type="number" data-i="${i}" data-f="qty" value="${it.qty}"><span class="mut">×</span>${it.service_id ? html`<span class="in qprice" data-pshow="${i}" title="Calculado por el nivel de entrega">${it.price != null ? money(doc, it.price) : '—'}</span>` : html`<input class="in" style="max-width:130px" type="number" data-i="${i}" data-f="price" value="${it.price ?? ''}" placeholder="Precio (Q)">`}</div>
              ${(() => { const sv = services.find((x) => x.id === it.service_id); if (!sv || !(sv.tasks || []).length) return ''; const lv = it.level || sv.level || 5;
                const miss = [priceAt(sv, lv) == null ? 'precio (o costos por hora)' : '', !String(sv.includes5 || '').trim() ? 'lo que incluye' : '', !sv.days5 ? 'días' : ''].filter(Boolean);
                return html`${miss.length ? html`<div class="warnbox sm" style="margin-top:10px">A «${sv.name}» le falta en el catálogo: <b>${miss.join(', ')}</b>. Sin eso el nivel no cambia el precio ni lo que incluye. <button class="btn ghost xs" data-act="fixSvc" data-id="${sv.id}" style="margin-left:6px">Completar</button></div>` : ''}<div class="qlv"><div class="row sm"><span>Nivel de entrega</span><div class="sp"></div><b style="font-weight:500" data-lvl="${i}">${lvName(lv)} · ${lv} · ${svcHours(sv, lv)} h</b></div>
                  <input type="range" min="5" max="10" step="1" value="${lv}" data-qlv="${i}" style="width:100%">
                  <div class="row mut" style="font-size:11px"><span>5 · sencillo</span><div class="sp"></div><span>10 · fuerte</span></div>
                  ${includesAt(sv, lv).length || daysAt(sv, lv) ? html`<div class="sm" style="margin-top:8px" data-inc="${i}">${incHtml(sv, lv)}</div>` : ''}</div>`; })()}
              ${it.growth ? html`<div class="qgrow"><span>📈 + fee por crecimiento</span><input class="in" type="number" step="0.5" data-i="${i}" data-f="growth_pct" value="${it.growth.pct}"><span class="mut">% de ${GROWTH[it.growth.type] || it.growth.type}</span><button class="btn ghost xs" data-act="rmGrowth" data-i="${i}" title="Quitar el fee">✕</button></div>` : ''}</div>`)}
            <div class="row" style="margin-top:10px"><select class="in" id="addSvc"><option value="">+ Agregar del catálogo…</option>
              ${plans ? html`<optgroup label="Planes (mensual)">${plans.plans.map((p) => html`<option value="plan:${p.id}">Plan ${p.name} — ${Q(p.precio)}</option>`)}</optgroup>` : ''}
              ${services.length ? html`<optgroup label="Servicios del catálogo">${services.map((s) => html`<option value="${s.id}">${s.name}${s.price ? ' — ' + Q(s.price) : ''}</option>`)}</optgroup>` : ''}<option value="new">✚ Crear servicio nuevo (se guarda en el catálogo)</option><option value="free">Línea libre (solo esta cotización)</option></select></div>
            ${!services.length ? html`<div class="mut sm" style="margin-top:8px">Tu catálogo está vacío. Crea servicios aquí mismo o en «Catálogo de servicios».</div>` : ''}
            <div class="two" style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label class="f">Descuento %</label><input class="in" id="qdisc" type="number" value="${doc.discount_pct || 0}"></div><div><label class="f">Válida por (días)</label><input class="in" id="qvalid" type="number" value="${doc.valid_days || 15}"></div></div>
            <div style="margin-top:12px"><label class="f">Lo que esto va a provocar en su negocio (sale ANTES del precio)</label><textarea class="in" id="qintro" style="min-height:120px" placeholder="Cómo se traduce en crecimiento lo que vamos a implementar.">${doc.intro || ''}</textarea></div>
            <div style="margin-top:12px"><label class="f">Siguientes pasos (uno por línea; si lo dejas vacío salen los de siempre)</label><textarea class="in" id="qnext">${doc.next || ''}</textarea></div>
            <div style="margin-top:12px"><label class="f">Notas y condiciones (salen en el PDF)</label><textarea class="in" id="qnotes">${doc.notes || ''}</textarea></div>
          </div>
          <div class="card feat olive" style="align-self:start">
            <div class="chead"><div class="ico">◎</div><h3>Total<br><span class="lbl">${doc.client || 'Sin cliente'}</span></h3></div>
            <div class="big" style="font-size:52px">${money(doc, tt)}</div>
            <div class="split"><div><span class="lbl">Subtotal</span><b>${money(doc, st)}</b></div>${quoteDays(doc) ? html`<div><span class="lbl">Tiempo</span><b>${quoteDays(doc)} días</b></div>` : ''}${doc.discount_pct ? html`<div><span class="lbl">Descuento</span><b>-${doc.discount_pct}%</b></div>` : ''}
              ${cost != null ? html`<div><span class="lbl">🔒 Costo</span><b>${money(doc, cost)}</b></div><div><span class="lbl">🔒 Margen</span><b style="color:#faf6ee">${tt ? Math.round(((tt - cost) / tt) * 100) + '%' : '—'}</b></div>` : ''}</div>
            ${fees(doc).length ? html`<div class="qfees"><span class="lbl">+ Fee por crecimiento (variable, se suma cada mes)</span>${fees(doc).map((i) => html`<div>📈 ${growthText(i.growth)} <span style="opacity:.7">· ${i.name}</span></div>`)}</div>` : ''}
            <div class="foot" style="margin-top:22px;opacity:1"><button class="btn cream" data-act="pdf">↓ Ver PDF</button>${qq ? html`<button class="btn ghost" data-act="delQ" style="background:transparent;color:#fdfaf3;border-color:rgba(253,250,243,.4)">🗑</button>` : ''}</div>
          </div>
        </div>`);
      $('#addSvc', el).onchange = async (e) => {
        sync(); const v = e.target.value;
        if (v === 'new') {
          const n = await ask('Nuevo servicio', [{ k: 'name', l: 'Nombre', req: true }, { k: 'category', l: 'Categoría', t: 'select', opts: CATS.map((c) => [c, c]), half: true }, { k: 'unit', l: 'Se cobra por', t: 'select', opts: [['proyecto', 'Proyecto'], ['mes', 'Mes'], ['pieza', 'Pieza'], ['hora', 'Hora']], half: true }, { k: 'price', l: 'Precio (Q)', t: 'number', req: true }, { k: 'description', l: 'Descripción (sale en la cotización)', t: 'textarea' }]);
          if (!n) return draw();
          try { const r = await S.create({ ...n, price: +n.price || 0, tasks: [] }); services.push(r); doc.items.push({ service_id: r.id, name: r.name, description: r.description || '', qty: 1, price: r.price }); toast('Servicio creado y agregado ✅ · Sus horas se editan en el Catálogo'); }
          catch (err) { toast(err.message, true); }
          return draw();
        }
        if (v.startsWith('plan:')) { const p = plans.plans.find((x) => x.id === v.slice(5)); doc.items.push({ name: `Plan ${p.name} — mensual`, description: p.promete || '', qty: 1, price: p.precio }); }
        else if (v === 'free') doc.items.push({ name: 'Servicio', description: '', qty: 1, price: null });
        else if (v) { const s = services.find((x) => x.id === v); const lv = s.level || 5; doc.items.push({ service_id: s.id, name: s.name, description: s.description || '', qty: 1, level: lv, price: priceAt(s, lv) ?? s.price ?? null, ...(growthOf(s) ? { growth: growthOf(s) } : {}) }); }
        draw();
      };
      $$('[data-f], #qdisc, #qvalid, #qrate', el).forEach((inp) => inp.addEventListener('change', () => { sync(); draw(); }));
      $('#qcur', el).onchange = async (e) => { sync(); doc.currency = e.target.value; if (doc.currency === 'GTQ') { doc.rate = 1; return draw(); } try { doc.rate = (await api('fx?to=' + doc.currency)).rate; toast(`1 Q = ${doc.rate} ${doc.currency}`); } catch (err) { doc.rate = doc.rate || null; toast(err.message, true); } draw(); };
      // Arrastrar el nivel: mientras se mueve solo cambian el texto y el precio; al soltar se recalcula todo.
      $$('[data-qlv]', el).forEach((r) => {
        const i = +r.dataset.qlv, it = doc.items[i], sv = services.find((x) => x.id === it.service_id);
        r.addEventListener('input', () => { const lv = +r.value; const p = priceAt(sv, lv); $(`[data-lvl="${i}"]`, el).textContent = `${lvName(lv)} · ${lv} · ${svcHours(sv, lv)} h`; if (p != null) $(`[data-pshow="${i}"]`, el).textContent = money(doc, p); const inc = $(`[data-inc="${i}"]`, el); if (inc) mount(inc, incHtml(sv, lv)); });
        r.addEventListener('change', () => { sync(); it.level = +r.value; const p = priceAt(sv, it.level); if (p != null) it.price = p; draw(); });
      });
    };
    const sync = () => {
      $$('[data-f]', el).forEach((inp) => { const it = doc.items[+inp.dataset.i]; const f = inp.dataset.f; if (f === 'growth_pct') { if (it.growth) it.growth.pct = +inp.value || 0; return; } it[f] = f === 'qty' || f === 'price' ? (inp.value === '' ? null : +inp.value) : inp.value; });
      const f = $('#qf', el); if (f) Object.assign(doc, Object.fromEntries(new FormData(f)));
      if ($('#qrate', el)) doc.rate = +$('#qrate', el).value || doc.rate;
      if ($('#qdisc', el)) { doc.discount_pct = +$('#qdisc', el).value || 0; doc.valid_days = +$('#qvalid', el).value || 15; doc.notes = $('#qnotes', el).value; doc.intro = $('#qintro', el)?.value || ''; doc.next = $('#qnext', el)?.value || ''; doc.status = $('#qstatus', el).value; }
    };
    const handlers = {
      back: () => { location.hash = '/sales/quotes'; paint(); },
      rmItem: (b) => { sync(); doc.items.splice(+b.dataset.i, 1); draw(); },
      rmGrowth: (b) => { sync(); doc.items[+b.dataset.i].growth = null; draw(); },
      saveQ: async () => {
        sync();
        if (!doc.client) return toast('Falta el cliente', true);
        // Enviada, aprobada o rechazada no es solo una etiqueta: dispara el flujo (tarea de cobro, lead, Control).
        const STEP = { Enviada: 'send', Aceptada: 'approve', Rechazada: 'reject' };
        const prev = (doc.id && quotes.find((x) => x.id === doc.id)?.status) || 'Borrador', want = doc.status, go = STEP[want] && want !== prev;
        if (go) doc.status = prev;
        try { let r = doc.id ? await C.save(doc) : await C.create(doc);
          if (go) { await api('flow/quote/' + r.id, { method: 'POST', body: { action: STEP[want] } }); r = await C.get(r.id); }
          quotes = quotes.some((x) => x.id === r.id) ? quotes.map((x) => (x.id === r.id ? r : x)) : [...quotes, r]; doc = JSON.parse(JSON.stringify(r));
          toast(go && want === 'Aceptada' ? 'Aprobada ✅ · se creó la tarea para subir el pago' : 'Cotización guardada ✅'); draw(); }
        catch (e) { toast(e.message, true); }
      },
      pdf: () => { sync(); showPdf(doc); },
      fixSvc: (b) => { sync(); const sv = services.find((x) => x.id === b.dataset.id); if (sv) editService(sv, (r) => { doc.items.filter((i) => i.service_id === r.id).forEach((i) => { const p = priceAt(r, i.level || r.level || 5); if (p != null) i.price = p; }); draw(); }); },
      // De cotización a proyecto: los mismos servicios con su nivel, sus horas y sus tareas.
      toProject: async () => {
        sync();
        const items = doc.items.filter((i) => i.service_id).map((i) => { const sv = services.find((x) => x.id === i.service_id); if (!sv) return null; const lv = i.level || sv.level || 5;
          return { id: sv.id, name: sv.name, level: lv, days: daysAt(sv, lv) || null, includes: includesAt(sv, lv), hours: svcHours(sv, lv) * (+i.qty || 1), roles: (sv.tasks || []).map((t) => ({ role: t.role, hours: hoursAt(t, lv) * (+i.qty || 1) })), price: (+i.price || 0) * (+i.qty || 1) }; }).filter(Boolean);
        const r = await newProject({ team: await teamList(), me, projects: await col('projects').list(), tasks: [], pre: { kind: 'Custom', items, name: `${doc.client} · ${doc.number}`, quote_id: doc.id } });
        if (r) { if (doc.status !== 'Aceptada') { doc.status = 'Aceptada'; try { const q = await C.save(doc); doc = JSON.parse(JSON.stringify(q)); quotes = quotes.map((x) => (x.id === q.id ? q : x)); } catch {} } toast('Proyecto creado desde la cotización ✅'); location.hash = '/operations/pipe'; }
      },
      delQ: async () => { if (!(await confirmAsk(`¿Eliminar ${doc.number}?`))) return; await C.remove(doc.id); quotes = quotes.filter((x) => x.id !== doc.id); paint(); },
    };
    el.onclick = (e) => { const t = e.target.closest('[data-act]'); if (t && handlers[t.dataset.act]) { e.stopImmediatePropagation(); handlers[t.dataset.act](t, e); } };
    draw();
  }

  function showPdf(doc) {
    const valid = new Date(doc.date + 'T12:00'); valid.setDate(valid.getDate() + (+doc.valid_days || 15));
    const st = subtotal(doc), tt = total(doc);
    const v = document.createElement('div'); v.className = 'qview';
    mount(v, html`<div class="qbar"><button class="btn" data-x="print">↓ Descargar PDF</button><button class="btn ghost" data-x="close">Cerrar</button><div class="sp"></div><span class="sm" style="color:var(--cream);align-self:center">En el diálogo elige «Guardar como PDF»</span></div>
      <div class="qdoc">
        <div class="qh"><div class="qlogo"><img src="/brand/emblem-dark.svg" alt=""><div><img src="/brand/wordmark-dark.svg" alt="Inherent" style="height:26px;width:auto;display:block"><div class="go" style="margin-top:6px">GROWTH OPERATOR</div></div></div>
          <div class="qmeta"><b>Cotización</b>${doc.number}<br>${fdateLong(doc.date)}<br>Válida hasta el ${fdateLong(valid.toISOString().slice(0, 10))}</div></div>
        <div class="qto"><div><div class="lbl2">PARA</div><b style="font-weight:500;font-size:15px">${doc.client}</b>${doc.contact ? html`<div>${doc.contact}</div>` : ''}</div>
          <div><div class="lbl2">DE</div><b style="font-weight:500;font-size:15px">Inherent</b><div>inherentglobal.com</div></div></div>
        ${(() => { const lines = String(doc.intro || '').split('\n').map((l) => l.trim()).filter(Boolean), whys = doc.items.filter((i) => (i.why || []).length);
          return lines.length || whys.length ? html`<div class="qsec"><div class="lbl2">LO QUE VAMOS A LOGRAR EN TU NEGOCIO</div>${lines.map((l) => html`<p>${l}</p>`)}${whys.map((i) => html`<div class="qwhy"><b>${i.name}</b><ul>${i.why.map((w) => html`<li>${w}</li>`)}</ul></div>`)}</div>` : ''; })()}
        <div class="qsec"><div class="lbl2">QUÉ ENTREGAMOS Y CÓMO TE AYUDA</div>${doc.items.map((i) => { const sv = services.find((x) => x.id === i.service_id), lv = i.level || sv?.level || 5, inc = i.includes?.length ? i.includes : sv ? includesAt(sv, lv) : [], d = sv ? daysAt(sv, lv) : 0;
          return html`<div class="qwhy"><b>${i.name}</b>${i.level ? html` <span class="qlv">· entrega ${lvName(i.level).toLowerCase()}</span>` : ''}${i.description ? html`<div class="qd">${i.description}</div>` : ''}${d ? html`<div class="qd"><b style="font-weight:500">Entrega en ${d} días hábiles.</b></div>` : ''}${inc.length ? html`<ul>${inc.map((x) => html`<li>${x}</li>`)}</ul>` : ''}</div>`; })}</div>
        <div class="lbl2" style="margin-top:22px">INVERSIÓN</div>
        <table><thead><tr><th>Servicio</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Total</th></tr></thead>
          <tbody>${doc.items.map((i) => html`<tr><td><b style="font-weight:500">${i.name}</b></td><td class="n">${i.qty}</td><td class="n">${money(doc, i.price)}</td><td class="n">${money(doc, (+i.qty || 0) * (+i.price || 0))}</td></tr>`)}</tbody></table>
        <div class="qsum"><div><span>Subtotal</span><span>${money(doc, st)}</span></div>${doc.discount_pct ? html`<div><span>Descuento (${doc.discount_pct}%)</span><span>-${money(doc, st - tt)}</span></div>` : ''}<div class="tot"><span>Total</span><span>${money(doc, tt)}</span></div>${quoteDays(doc) ? html`<div><span>Tiempo estimado</span><span>${quoteDays(doc)} días hábiles</span></div>` : ''}</div>
        ${fees(doc).length ? html`<div class="qnotes"><div class="lbl2">FEE POR CRECIMIENTO · VARIABLE</div>${fees(doc).map((i) => html`<div><b style="font-weight:500">${i.name}:</b> ${growthText(i.growth)}${i.growth.how ? html` <span style="color:#7a5d46">— ${i.growth.how}</span>` : ''}</div>`)}<div style="color:#7a5d46;font-size:11.5px;margin-top:6px">Se calcula cada mes sobre el crecimiento medido y atribuible a este servicio. Sin atribución clara, no se cobra.</div></div>` : ''}
        <div class="qsec"><div class="lbl2">SIGUIENTES PASOS</div><ol>${(String(doc.next || '').split('\n').map((l) => l.trim()).filter(Boolean).length ? String(doc.next).split('\n').map((l) => l.trim()).filter(Boolean) : ['Confirmas esta propuesta y el alcance.', 'Hacemos una llamada de arranque para tomar tus datos y accesos.', 'Coordinamos el primer pago y firmamos.', 'Empezamos y te mostramos avances en cada entrega.']).map((l) => html`<li>${l}</li>`)}</ol></div>
        ${doc.notes ? html`<div class="qnotes"><div class="lbl2">NOTAS Y CONDICIONES</div>${doc.notes.split('\n').map((l) => html`<div>${l}</div>`)}</div>` : ''}
        <div class="qfoot"><span>Inherent · Growth Operator</span><span>inherentglobal.com</span></div>
      </div>`);
    document.body.append(v);
    v.onclick = (e) => { const x = e.target.closest('[data-x]')?.dataset.x; if (x === 'print') window.print(); if (x === 'close' || e.target === v) v.remove(); };
  }

  // ---------- acciones ----------
  acts(el, {
    tab: (b) => { tab = b.dataset.t; location.hash = '/sales/' + tab; },
    crmView: (b) => { crmView = b.dataset.v; paint(); },
    tagF: (b) => { tagF = b.dataset.t; paint(); },
    catF: (b) => { catF = b.dataset.c; paint(); },
    lead: (b) => openLead(leads.find((l) => l.id === b.dataset.id)),
    newLead, newService: () => editService(null), rates: editRates, seed, repair,
    service: (b, e) => { if (e?.target.closest('[data-stop]')) return; editService(services.find((s) => s.id === b.dataset.id)); },
    newQuote: () => editQuote(null, null),
    newMentor: async () => { const r = await editMentor(null, [...new Set((mentors || []).map((m) => m.industry))]); if (r && !r.deleted) { mentors = [...(mentors || []), r]; paint(); } },
    quote: (b) => editQuote(quotes.find((x) => x.id === b.dataset.id)),
  });
  // El nivel de entrega desde afuera: el precio, las horas y lo que incluye cambian mientras arrastras.
  el.addEventListener('input', (e) => { const r = e.target.closest?.('[data-cardlv]'); if (!r) return; const sv = services.find((x) => x.id === r.dataset.cardlv); if (!sv) return;
    cardLv[sv.id] = +r.value; const box = el.querySelector(`[data-cardbody="${sv.id}"]`); if (box) mount(box, cardBody(sv, +r.value)); });
  paint();
  // Desde Control: #/sales/quotes/new/<lead> abre una cotización para ese lead; #/sales/quotes/<id> la abre.
  if (sub[0] === 'quotes' && sub[1] === 'new') editQuote(null, leads.find((x) => x.id === sub[2]) || null);
  else if (sub[0] === 'quotes' && sub[1]) { const qq = quotes.find((x) => x.id === sub[1]); if (qq) editQuote(qq); }
}
