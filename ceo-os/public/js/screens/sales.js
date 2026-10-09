import { html, raw, mount, col, api, drawer, closeDrawer, ask, toast, acts, confirmAsk, Q, USD, fdate, fdateLong, today, $, $$, emblem , wizard } from '../core.js';
import { hoursAt, svcHours, svcCost } from '../cycle.js';
import { mentorsTab, editMentor } from '../mentors.js';

const STAGES = ['Nuevo', 'Contactado', 'Propuesta', 'Ganado', 'Perdido'];
const OPEN = ['Nuevo', 'Contactado', 'Propuesta'];
const TAGS = { 'High ticket': 'dark', 'No contestó': 'red', 'Interesado': 'green', 'Cotizando': 'amber', 'Propuesta enviada': 'blue', 'Referido': 'lime', 'Frío': '' };
const SOURCES = ['WhatsApp', 'Instagram', 'Web', 'Referido', 'Evento', 'LinkedIn', 'Otro'];
const CATS = ['IA', 'Tech', 'Marketing', 'Producción', 'Branding', 'Consultoría'];
const CATC = { IA: 'lime', Tech: 'blue', Marketing: 'amber', Producción: 'red', Branding: 'green', Consultoría: 'dark' };
const DEFAULT_ROLES = [['Estrategia', null], ['Producción', 150], ['Fotografía', null], ['Edición', null], ['Diseño', null], ['Dev / Tech', null], ['Operador', null], ['Pauta', null]];
const QSTATUS = { Borrador: 'amber', Enviada: 'blue', Aceptada: 'green', Rechazada: 'red' };

const score = (i) => html`<span class="score ${i >= 4 ? 'hot' : ''}">${[1, 2, 3, 4, 5].map((k) => html`<i class="${k <= (i || 0) ? 'on' : ''}"></i>`)}</span>`;
const tagChip = (t) => html`<span class="chip ${TAGS[t] ?? ''}" style="margin:2px">${t}</span>`;

export async function render(el, { me, sub, alive }) {
  const isCeo = me.role === 'ceo';
  const L = col('leads'), S = col('services'), C = col('quotes'), R = col('rates');
  let [leads, services, quotes] = await Promise.all([L.list(), S.list(), C.list()]);
  let rates = null;
  if (isCeo) { rates = await R.get('default').catch(() => null); }
  let plans = null, plansErr = null;
  api('repo/precios').then((r) => { plans = r; if (tab === 'cat' && alive()) paint(); }).catch((e) => { plansErr = e.message; });

  let tab = ['crm', 'cat', 'esp', 'quotes'].includes(sub[0]) ? sub[0] : 'crm';
  let mentors = null, mInd = 'Todas';
  let crmView = 'list', q = '', tagF = '', catF = 'Todos';

  // ---------- costos (solo CEO) ----------
  const rateOf = (role) => rates?.roles?.find((r) => r.role === role)?.rate ?? null;
  // Costo = horas de cada rol en el nivel del servicio (5 sencillo · 10 fuerte) × su costo por hora.
  const costOf = (s, lv) => svcCost(s, rates, lv);
  const hours = (s) => svcHours(s);
  const suggested = (s) => { const c = costOf(s); return c && !c.miss.length && c.cost ? Math.round((c.cost * (+s.markup || 2.2)) / 50) * 50 : null; };

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
        </div>
        <div class="sp"></div>
        ${tab === 'crm' ? html`<button class="btn" data-act="newLead">+ Nuevo lead</button>` : ''}
        ${tab === 'cat' ? html`${isCeo ? html`<button class="btn ghost" data-act="rates">Costos por hora</button>` : ''}<button class="btn" data-act="newService">+ Nuevo servicio</button>` : ''}
        ${tab === 'quotes' ? html`<button class="btn" data-act="newQuote">+ Nueva cotización</button>` : ''}
        ${tab === 'esp' && isCeo ? html`<button class="btn" data-act="newMentor">+ Especialista</button>` : ''}
      </div>
      <div id="body"></div>`);
    const body = $('#body', el);
    ({ crm, cat, esp, quotes: quotesTab })[tab](body);
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
        ${filtered.map((l) => html`<tr class="click" data-act="lead" data-id="${l.id}"><td><b style="font-weight:500">${l.name}</b><div class="mut sm">${[l.contact, l.company].filter(Boolean).join(' · ')}</div></td><td>${score(l.interest)}</td><td>${(l.tags || []).map(tagChip)}</td><td><span class="chip">${l.stage || 'Nuevo'}</span></td><td>${l.wants || '—'}</td><td class="n">${l.value_usd ? USD(l.value_usd) : '—'}</td><td class="sm ${late(l) ? 'bad' : ''}" style="${late(l) ? 'color:#a3392a;font-weight:700' : ''}">${l.next_step || '—'}${l.next_date ? html`<div class="mut">${fdate(l.next_date)}</div>` : ''}</td></tr>`)}
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
      <div class="sec-title"><h2>Servicios</h2><span class="mut sm">Costo = horas × costo por hora${isCeo ? '' : ' (solo lo ve el CEO)'}</span></div>
      <div class="row" style="margin-bottom:14px;gap:8px;flex-wrap:wrap">${cats.map((c) => html`<button class="chip ${catF === c ? 'dark' : ''}" data-act="catF" data-c="${c}" style="padding:8px 14px;font-size:13px">${c}</button>`)}</div>
      ${isCeo && rates && (rates.roles || []).some((r) => r.rate == null) ? html`<div class="warnbox" style="margin-bottom:14px">⚠️ Faltan costos por hora de: ${(rates.roles || []).filter((r) => r.rate == null).map((r) => r.role).join(', ')}. Sin eso no hay costo ni precio sugerido.</div>` : ''}
      ${!services.length ? html`<div class="empty"><b>Todavía no hay servicios</b>Crea uno con «+ Nuevo servicio», o carga ejemplos para editarlos.<div style="margin-top:14px"><button class="btn ghost" data-act="seed">Cargar 9 ejemplos para editar</button></div></div>`
      : html`<div class="grid g3">${list.map((s) => { const c = costOf(s); const sug = suggested(s); return html`<div class="card" style="cursor:pointer" data-act="service" data-id="${s.id}">
        <div class="row"><span class="chip ${CATC[s.category] ?? ''}">${s.category || 'Sin categoría'}</span><div class="sp"></div><span class="mut sm">Nivel ${s.level || 5} · ${hours(s)} h · ${s.unit || 'proyecto'}</span></div>
        <h3 style="font-size:19px;font-weight:500;letter-spacing:-.4px;margin:14px 0 4px">${s.name}</h3><div class="mut sm">${s.description || ''}</div>
        ${c ? html`<div style="margin:14px 0">${(s.tasks || []).map((t) => html`<div class="row sm" style="padding:3px 0"><span>${t.role}</span><span class="mut">${hoursAt(t, s.level || 5)} h × ${rateOf(t.role) == null ? '⚠️' : Q(rateOf(t.role))}</span><div class="sp"></div><span>${rateOf(t.role) == null ? '—' : Q(rateOf(t.role) * hoursAt(t, s.level || 5))}</span></div>`)}</div>` : html`<div style="height:14px"></div>`}
        <div class="row" style="border-top:1px solid var(--line);padding-top:12px">${c ? html`<div><div class="mut sm">Costo</div><b style="font-weight:500">${c.miss.length ? '⚠️ incompleto' : Q(c.cost)}</b></div>` : ''}<div class="sp"></div>
          <div style="text-align:right"><div class="mut sm">Precio</div><b style="font-size:24px;font-weight:500;letter-spacing:-.5px">${s.price ? Q(s.price) : sug ? html`<span class="mut" style="font-size:16px">sugerido ${Q(sug)}</span>` : '—'}</b></div></div></div>`; })}</div>`}`);
  }

  async function editService(s) {
    const roles = (rates?.roles || DEFAULT_ROLES.map(([role]) => ({ role }))).map((r) => r.role);
    let tasks = (s?.tasks || [{ role: roles[0], hours: 1 }]).map((t) => ({ ...t, hours10: t.hours10 ?? (+t.hours || 0) * 2 }));
    let level = s?.level || 5;
    const draw = () => {
      const cur = { ...(s || {}), tasks, level, markup: +($('#svmk')?.value || s?.markup || 2.2) };
      const c = costOf(cur), sug = suggested(cur);
      drawer(html`<div class="row"><span class="chip">Servicio</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
        <h2>${s ? 'Editar servicio' : 'Nuevo servicio'}</h2>
        <form class="form" id="sf" style="margin-top:14px">
          <div><label class="f">Nombre *</label><input class="in" name="name" value="${s?.name || ''}"></div>
          <div class="two"><div><label class="f">Categoría</label><select class="in" name="category">${[...new Set([...CATS, s?.category].filter(Boolean))].map((c2) => html`<option ${c2 === s?.category ? raw('selected') : ''}>${c2}</option>`)}</select></div>
            <div><label class="f">Se cobra por</label><select class="in" name="unit">${['proyecto', 'mes', 'pieza', 'hora', 'jornada'].map((u) => html`<option ${u === (s?.unit || 'proyecto') ? raw('selected') : ''}>${u}</option>`)}</select></div></div>
          <div><label class="f">Descripción (sale en la cotización)</label><input class="in" name="description" value="${s?.description || ''}"></div>
        </form>
        <div class="row sm mut" style="margin:18px 0 8px"><span style="flex:1">Horas por rol</span><span style="width:90px;text-align:center">Sencillo · 5</span><span style="width:90px;text-align:center">Fuerte · 10</span><span style="width:44px"></span></div>
        ${tasks.map((t, i) => html`<div class="row" style="margin-bottom:8px"><select class="in" data-i="${i}" data-f="role">${[...new Set([...roles, t.role])].map((r) => html`<option ${r === t.role ? raw('selected') : ''}>${r}</option>`)}</select><input class="in" style="max-width:90px" type="number" step="0.5" data-i="${i}" data-f="hours" value="${t.hours}"><input class="in" style="max-width:90px" type="number" step="0.5" data-i="${i}" data-f="hours10" value="${t.hours10}"><button class="btn ghost" data-act="rmTask" data-i="${i}" style="padding:8px 12px">✕</button></div>`)}
        <div class="card glass" style="margin-top:14px;padding:14px"><div class="row"><b style="font-weight:500">Nivel de entrega</b><div class="sp"></div><span class="chip ${level >= 8 ? 'dark' : ''}">${level <= 6 ? 'Sencillo' : level >= 9 ? 'Fuerte' : 'Medio'} · ${level}</span></div>
          <input type="range" min="5" max="10" step="1" value="${level}" id="svlv" style="width:100%;margin:10px 0 4px">
          <div class="mut sm">En este nivel: ${tasks.map((t) => `${t.role} ${hoursAt(t, level)} h`).join(' · ')} = <b>${svcHours(cur, level)} h</b>. El precio de abajo es el de este nivel; en un proyecto custom sube o baja con las horas.</div></div>
        <button class="btn ghost" data-act="addTask" style="padding:8px 14px">+ Rol</button>
        ${isCeo ? html`<div class="card glass" style="margin-top:18px;padding:16px"><div class="row"><div><div class="mut sm">Costo</div><b style="font-weight:500">${c ? (c.miss.length ? `⚠️ falta costo/h de ${c.miss.join(', ')}` : Q(c.cost)) : '—'}</b></div><div class="sp"></div>
          <div><label class="f">Multiplicador</label><input class="in" id="svmk" type="number" step="0.1" value="${cur.markup}" style="width:90px"></div>
          <div style="text-align:right;margin-left:14px"><div class="mut sm">Sugerido</div><b style="font-weight:500">${sug ? Q(sug) : '—'}</b></div></div></div>` : ''}
        <div style="margin-top:14px"><label class="f">Precio de venta (Q)</label><input class="in" id="svprice" type="number" value="${s?.price ?? ''}" placeholder="${sug ? 'Sugerido: ' + sug : ''}"></div>
        <div class="row" style="margin-top:18px"><button class="btn" data-act="saveSvc">Guardar</button>${sug ? html`<button class="btn ghost" data-act="useSug">Usar sugerido</button>` : ''}<div class="sp"></div>${s ? html`<button class="btn ghost" data-act="delSvc">🗑</button>` : ''}</div>`,
      {
        addTask: () => { sync(); tasks.push({ role: roles[0], hours: 1 }); draw(); },
        rmTask: (b) => { sync(); tasks.splice(+b.dataset.i, 1); draw(); },
        useSug: () => { $('#svprice').value = sug; },
        saveSvc: async () => {
          sync();
          const f = Object.fromEntries(new FormData($('#sf')));
          if (!f.name) return toast('Falta el nombre', true);
          const doc = { ...(s || {}), ...f, tasks, level, markup: +($('#svmk')?.value || s?.markup || 2.2), price: $('#svprice').value === '' ? null : +$('#svprice').value };
          try { const r = s ? await S.save(doc) : await S.create(doc); services = s ? services.map((x) => (x.id === r.id ? r : x)) : [...services, r]; toast('Guardado ✅'); closeDrawer(); paint(); }
          catch (e) { toast(e.message, true); }
        },
        delSvc: async () => { if (!(await confirmAsk(`¿Eliminar ${s.name}?`))) return; await S.remove(s.id); services = services.filter((x) => x.id !== s.id); closeDrawer(); paint(); },
      });
      $$('[data-f]', $('#drawer')).forEach((inp) => inp.addEventListener('change', () => { sync(); draw(); }));
      $('#svmk')?.addEventListener('change', draw);
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
      <div class="row" style="margin-top:18px"><button class="btn" data-act="saveRates">Guardar</button></div>`,
    {
      add: () => { sync(); roles.push({ role: '', rate: null }); draw(); },
      rm: (b) => { sync(); roles.splice(+b.dataset.i, 1); draw(); },
      saveRates: async () => {
        sync();
        const clean = roles.filter((r) => r.role.trim()).map((r) => ({ role: r.role.trim(), rate: r.rate === '' || r.rate == null || isNaN(r.rate) ? null : +r.rate }));
        try { rates = rates ? await R.save({ ...rates, roles: clean }) : await R.create({ id: 'default', roles: clean }); toast('Costos guardados ✅'); closeDrawer(); paint(); }
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

  // ---------- Cotizaciones ----------
  const subtotal = (qq) => (qq.items || []).reduce((a, i) => a + (+i.qty || 0) * (+i.price || 0), 0);
  const total = (qq) => subtotal(qq) * (1 - (+qq.discount_pct || 0) / 100);
  function quotesTab(body) {
    mount(body, !quotes.length ? html`<div class="empty"><b>Todavía no hay cotizaciones</b>Créala desde un lead del CRM o con «+ Nueva cotización».</div>`
      : html`<div class="card"><table><thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th class="n">Total</th></tr></thead><tbody>
        ${quotes.slice().reverse().map((qq) => html`<tr class="click" data-act="quote" data-id="${qq.id}"><td><b style="font-weight:500">${qq.number}</b></td><td>${qq.client || '—'}</td><td class="mut">${fdate(qq.date)}</td><td><span class="chip ${QSTATUS[qq.status] || ''}">${qq.status || 'Borrador'}</span></td><td class="n"><b>${Q(total(qq))}</b></td></tr>`)}
      </tbody></table></div>`);
  }

  function nextNumber() {
    const y = new Date().getFullYear();
    const n = quotes.filter((qq) => String(qq.number || '').startsWith(`COT-${y}-`)).length + 1;
    return `COT-${y}-${String(n).padStart(3, '0')}`;
  }

  function editQuote(qq, lead) {
    let doc = qq ? JSON.parse(JSON.stringify(qq)) : { number: nextNumber(), date: today(), valid_days: 15, status: 'Borrador', discount_pct: 0, items: [], notes: '', lead_id: lead?.id || '', client: lead?.name || '', contact: lead?.contact || '', email: lead?.email || '' };
    tab = 'quotes';
    const draw = () => {
      const st = subtotal(doc), tt = total(doc);
      const cost = isCeo && rates ? doc.items.reduce((a, i) => { const s = services.find((x) => x.id === i.service_id); const c = s ? costOf(s) : null; return a + (c && !c.miss.length ? c.cost * (+i.qty || 0) : 0); }, 0) : null;
      mount(el, html`
        <div class="row" style="margin-bottom:22px"><button class="btn ghost" data-act="back">← Cotizaciones</button><div class="sp"></div>
          <select class="in" id="qstatus" style="width:auto">${Object.keys(QSTATUS).map((s) => html`<option ${s === doc.status ? raw('selected') : ''}>${s}</option>`)}</select>
          <button class="btn ghost" data-act="pdf">Ver PDF</button><button class="btn" data-act="saveQ">Guardar</button></div>
        <div class="grid g2">
          <div class="card">
            <div class="chead"><div class="ico">✎</div><h3>${doc.number}<br><span class="mut sm">${fdateLong(doc.date)}</span></h3></div>
            <form class="form" id="qf">
              <div class="two"><div><label class="f">Cliente</label><input class="in" name="client" list="leadlist" value="${doc.client}"></div><div><label class="f">Contacto</label><input class="in" name="contact" value="${doc.contact || ''}"></div></div>
              <datalist id="leadlist">${leads.map((l) => html`<option value="${l.name}">`)}</datalist>
            </form>
            <div class="sm mut" style="margin:18px 0 8px">Servicios</div>
            ${doc.items.map((it, i) => html`<div class="card glass" style="padding:12px 14px;margin-bottom:8px;border-radius:18px"><div class="row"><input class="in" data-i="${i}" data-f="name" value="${it.name}" style="font-weight:500"><button class="btn ghost" data-act="rmItem" data-i="${i}" style="padding:8px 12px">✕</button></div>
              <div class="row" style="margin-top:8px"><input class="in" data-i="${i}" data-f="description" value="${it.description || ''}" placeholder="Descripción"><input class="in" style="max-width:80px" type="number" data-i="${i}" data-f="qty" value="${it.qty}"><span class="mut">×</span><input class="in" style="max-width:130px" type="number" data-i="${i}" data-f="price" value="${it.price ?? ''}" placeholder="Precio"></div></div>`)}
            <div class="row" style="margin-top:10px"><select class="in" id="addSvc"><option value="">+ Agregar del catálogo…</option>
              ${plans ? html`<optgroup label="Planes (mensual)">${plans.plans.map((p) => html`<option value="plan:${p.id}">Plan ${p.name} — ${Q(p.precio)}</option>`)}</optgroup>` : ''}
              ${services.length ? html`<optgroup label="Servicios del catálogo">${services.map((s) => html`<option value="${s.id}">${s.name}${s.price ? ' — ' + Q(s.price) : ''}</option>`)}</optgroup>` : ''}<option value="new">✚ Crear servicio nuevo (se guarda en el catálogo)</option><option value="free">Línea libre (solo esta cotización)</option></select></div>
            ${!services.length ? html`<div class="mut sm" style="margin-top:8px">Tu catálogo está vacío. Crea servicios aquí mismo o en «Catálogo de servicios».</div>` : ''}
            <div class="two" style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label class="f">Descuento %</label><input class="in" id="qdisc" type="number" value="${doc.discount_pct || 0}"></div><div><label class="f">Válida por (días)</label><input class="in" id="qvalid" type="number" value="${doc.valid_days || 15}"></div></div>
            <div style="margin-top:12px"><label class="f">Notas y condiciones (salen en el PDF)</label><textarea class="in" id="qnotes">${doc.notes || ''}</textarea></div>
          </div>
          <div class="card feat olive" style="align-self:start">
            <div class="chead"><div class="ico">◎</div><h3>Total<br><span class="lbl">${doc.client || 'Sin cliente'}</span></h3></div>
            <div class="big"><span class="cur">Q</span>${Math.round(tt).toLocaleString('en-US')}</div>
            <div class="split"><div><span class="lbl">Subtotal</span><b>${Q(st)}</b></div>${doc.discount_pct ? html`<div><span class="lbl">Descuento</span><b>-${doc.discount_pct}%</b></div>` : ''}
              ${cost != null ? html`<div><span class="lbl">🔒 Costo</span><b>${Q(cost)}</b></div><div><span class="lbl">🔒 Margen</span><b style="color:#f3ffc4">${tt ? Math.round(((tt - cost) / tt) * 100) + '%' : '—'}</b></div>` : ''}</div>
            <div class="foot" style="margin-top:22px;opacity:1"><button class="btn cream" data-act="pdf">↓ Ver PDF</button>${qq ? html`<button class="btn ghost" data-act="delQ" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4)">🗑</button>` : ''}</div>
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
        else if (v) { const s = services.find((x) => x.id === v); doc.items.push({ service_id: s.id, name: s.name, description: s.description || '', qty: 1, price: s.price ?? suggested(s) }); }
        draw();
      };
      $$('[data-f], #qdisc, #qvalid', el).forEach((inp) => inp.addEventListener('change', () => { sync(); draw(); }));
    };
    const sync = () => {
      $$('[data-f]', el).forEach((inp) => { const it = doc.items[+inp.dataset.i]; const f = inp.dataset.f; it[f] = f === 'qty' || f === 'price' ? (inp.value === '' ? null : +inp.value) : inp.value; });
      const f = $('#qf', el); if (f) Object.assign(doc, Object.fromEntries(new FormData(f)));
      if ($('#qdisc', el)) { doc.discount_pct = +$('#qdisc', el).value || 0; doc.valid_days = +$('#qvalid', el).value || 15; doc.notes = $('#qnotes', el).value; doc.status = $('#qstatus', el).value; }
    };
    const handlers = {
      back: () => { location.hash = '/sales/quotes'; paint(); },
      rmItem: (b) => { sync(); doc.items.splice(+b.dataset.i, 1); draw(); },
      saveQ: async () => {
        sync();
        if (!doc.client) return toast('Falta el cliente', true);
        try { const r = doc.id ? await C.save(doc) : await C.create(doc); quotes = doc.id ? quotes.map((x) => (x.id === r.id ? r : x)) : [...quotes, r]; doc = JSON.parse(JSON.stringify(r)); toast('Cotización guardada ✅'); draw(); }
        catch (e) { toast(e.message, true); }
      },
      pdf: () => { sync(); showPdf(doc); },
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
        <table><thead><tr><th>Servicio</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Total</th></tr></thead>
          <tbody>${doc.items.map((i) => html`<tr><td><b style="font-weight:500">${i.name}</b>${i.description ? html`<div style="color:#6b6257;font-size:12px">${i.description}</div>` : ''}</td><td class="n">${i.qty}</td><td class="n">${Q(i.price)}</td><td class="n">${Q((+i.qty || 0) * (+i.price || 0))}</td></tr>`)}</tbody></table>
        <div class="qsum"><div><span>Subtotal</span><span>${Q(st)}</span></div>${doc.discount_pct ? html`<div><span>Descuento (${doc.discount_pct}%)</span><span>-${Q(st - tt)}</span></div>` : ''}<div class="tot"><span>Total</span><span>${Q(tt)}</span></div></div>
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
    newLead, newService: () => editService(null), rates: editRates, seed,
    service: (b) => editService(services.find((s) => s.id === b.dataset.id)),
    newQuote: () => editQuote(null, null),
    newMentor: async () => { const r = await editMentor(null, [...new Set((mentors || []).map((m) => m.industry))]); if (r && !r.deleted) { mentors = [...(mentors || []), r]; paint(); } },
    quote: (b) => editQuote(quotes.find((x) => x.id === b.dataset.id)),
  });
  paint();
}
