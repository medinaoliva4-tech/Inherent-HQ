import { html, raw, mount, col, api, drawer, closeDrawer, ask, toast, acts, confirmAsk, Q, USD, fdate, fdateLong, today, $, $$, emblem , wizard, teamList, swap, ico } from '../core.js';
import { hoursAt, svcHours, svcCost, svcPrice, svcAuto, pricesOf, marginOf, GROWTH, growthText, includesAt, daysAt } from '../cycle.js';
import { newProject } from '../create.js';
import { mentorsTab, editMentor } from '../mentors.js';
import { packagesTab } from '../paquetes.js';
import { createBundles } from '../armados.js';

const STAGES = ['Nuevo', 'Contactado', 'Propuesta', 'Ganado', 'Perdido'];
const OPEN = ['Nuevo', 'Contactado', 'Propuesta'];
const TAGS = { 'High ticket': 'dark', 'No contestó': 'red', 'Interesado': 'green', 'Cotizando': 'amber', 'Propuesta enviada': 'blue', 'Referido': 'lime', 'Frío': '' };
const SOURCES = ['WhatsApp', 'Instagram', 'Web', 'Referido', 'Evento', 'LinkedIn', 'Otro'];
const CATS = ['IA y automatización', 'CRM y ventas', 'Landing y conversión', 'Marketing y publicidad', 'Producción de video', 'Fotografía', 'Email marketing', 'SEO local', 'Analítica y medición', 'UGC y contenido mensual', 'Operación y estructura'];
const CATC = { 'IA y automatización': 'lime', 'CRM y ventas': 'blue', 'Landing y conversión': 'green', 'Marketing y publicidad': 'amber', 'Producción de video': 'red', Fotografía: 'dark', 'Email marketing': 'blue', 'SEO local': 'green', 'Analítica y medición': 'lime', 'UGC y contenido mensual': 'amber', 'Operación y estructura': 'dark' };
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
  let crmView = 'list', q = '', tagF = '', catF = 'Todos', svQ = '';

  // ---------- costos (solo CEO) ----------
  const rateOf = (role) => rates?.roles?.find((r) => r.role === role)?.rate ?? null;
  // Costo = horas de cada rol en el nivel del servicio (5 sencillo · 10 fuerte) × su costo por hora.
  const costOf = (s, lv) => svcCost(s, rates, lv);
  const hours = (s) => svcHours(s);
  // Precio de un servicio en un nivel: el automático (horas × costo/h × multiplicador × complejidad) o, si se fijó uno, ese.
  const priceAt = (s, lv) => (isCeo && rates && !s.price_fixed && !(s.price && !s.prices) ? svcAuto(s, rates, lv) : null) ?? svcPrice(s, lv);
  let cardLv = {};
  // Lo que incluye y cuánto tarda un servicio en un nivel (para la cotización y su PDF).
  const incHtml = (sv, lv) => html`${daysAt(sv, lv) ? html`<div><b style="font-weight:500">${ico('clock')} ${daysAt(sv, lv)} días hábiles</b></div>` : ''}${includesAt(sv, lv).length ? html`<ul style="margin:4px 0 0 18px;padding:0">${includesAt(sv, lv).map((x) => html`<li>${x}</li>`)}</ul>` : ''}`;
  const autoDays = (doc) => Math.max(0, ...doc.items.map((i) => { const sv = services.find((x) => x.id === i.service_id); return sv ? daysAt(sv, i.level || sv.level || 5) || 0 : 0; }));
  // El tiempo total se puede escribir a mano (hay servicios que no se hacen en paralelo); si no, sale del servicio más largo.
  const quoteDays = (doc) => (+doc.days > 0 ? +doc.days : autoDays(doc));
  const lvName = (lv) => (lv <= 4 ? 'Básico' : lv <= 6 ? 'Sencillo' : lv >= 9 ? 'Fuerte' : 'Medio');
  const suggested = (s, lv = s.level || 5) => (isCeo && rates ? svcAuto(s, rates, lv) : null);
  // La tarjeta del catálogo en un nivel: precio, horas, días y qué incluye (cambia con el slider de afuera).
  const cardBody = (s, lv) => { const p = priceAt(s, lv), d = daysAt(s, lv), inc = includesAt(s, lv);
    return html`<div class="row sm"><b style="font-weight:500">${lvName(lv)} · ${lv}</b><span class="mut">&nbsp;· ${svcHours(s, lv)} h${d ? ` · ${d} días` : ''}</span><div class="sp"></div><b style="font-size:22px;font-weight:500;letter-spacing:-.5px">${p ? Q(p) : '—'}</b></div>
      ${inc.length ? html`<ul class="svinc">${inc.map((x) => html`<li>${x}</li>`)}</ul>` : ''}
      ${(() => { const c = costOf(s, lv); if (!c) return ''; const mg = p && !c.miss.length ? Math.round((1 - c.cost / p) * 100) : null; return html`<div class="mut sm" style="margin-top:8px;border-top:1px solid var(--line);padding-top:8px">${ico('lock', 13)} Costo ${c.miss.length ? 'incompleto' : Q(c.cost)}${mg != null ? ` · Margen ${mg}%` : ''}</div>`; })()}`; };

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
        ${tab === 'cat' ? html`${isCeo ? html`<button class="btn ghost" data-act="rates">Costos por hora</button>` : ''}<button class="btn" data-act="newService">+ Nuevo servicio</button>` : ''}
        ${tab === 'quotes' ? html`<button class="btn" data-act="newQuote">+ Nueva cotización</button>` : ''}
        ${tab === 'esp' && isCeo ? html`<button class="btn" data-act="newMentor">+ Especialista</button>` : ''}
      </div>
      <div id="body"></div>`);
    const body = $('#body', el);
    ({ crm, cat, esp, quotes: quotesTab, pkg: pkgTab })[tab](body);
  }

  // ---------- Paquetes: una sola lista — los propios (servicios y especialistas) y los de cada industria ----------
  function pkgTab(b) {
    const onQuote = (pre) => editQuote({ number: nextNumber(), date: today(), valid_days: 15, status: 'Borrador', discount_pct: 0, notes: '', lead_id: '', client: '', contact: '', email: '', ...pre }, null);
    mount(b, html`<p class="loading">Cargando paquetes…</p>`);
    fetch('/data/paquetes.json').then((r) => r.json()).then((d) => d.ind.map((i) => i.n)).catch(() => [])
      .then((industries) => createBundles({ services, rates, industries, onQuote })).catch(() => null)
      .then((bun) => packagesTab(b, { onQuote, bun }));
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
        <div class="card glass"><span class="mut sm">Calientes ${ico('flame')}</span><div class="big" style="font-size:42px">${open.filter((l) => (l.interest || 0) >= 4).length}</div></div>
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
    try { const s = await L.save(l); leads = leads.map((x) => (x.id === s.id ? s : x)); toast('Guardado'); return s; }
    catch (e) { toast(e.message, true); return null; }
  }

  function openLead(l) {
    let tags = [...(l.tags || [])], interest = l.interest || 0;
    const all = [...new Set([...Object.keys(TAGS), ...tags])];
    const d = drawer(html`<div class="row"><span class="chip">${l.source || 'Sin fuente'}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
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
      <div class="row" style="margin:16px 0"><button class="btn" data-act="save">Guardar</button><button class="btn ghost" data-act="quote">Crear cotización</button><div class="sp"></div><button class="btn ghost" data-act="del" title="Eliminar">${ico('trash', 16)}</button></div>
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
        { v: 'Marketing', i: ico('megaphone'), l: 'Marketing', d: 'Que lo conozcan' }, { v: 'Marketing Pro', i: ico('megaphone'), l: 'Marketing Pro', d: 'Presencia sostenida' },
        { v: 'Accelerate', i: ico('stairs'), l: 'Accelerate', d: 'Está estancado, quiere facturar' }, { v: 'Compound', i: ico('stairs'), l: 'Compound', d: 'Escalar y sistematizar' },
        { v: 'Proyecto puntual', i: ico('puzzle'), l: 'Proyecto puntual' }, { v: 'No sé todavía', i: ico('help'), l: 'No sé todavía' }] },
      { k: 'interest', q: '¿Qué tan caliente está?', type: 'cards', req: true, opts: [['1', ico('snow'), 'Frío'], ['2', ico('sun'), 'Tibio'], ['3', ico('smile'), 'Interesado'], ['4', ico('flame'), 'Caliente'], ['5', ico('rocket'), 'Listo para cerrar']].map(([v, i, l]) => ({ v, i, l })) },
      { k: 'source', q: '¿Cómo llegó?', type: 'cards', req: true, opts: SOURCES.map((x) => ({ v: Array.isArray(x) ? x[0] : x, l: Array.isArray(x) ? x[1] : x })) },
      { k: 'contact', q: '¿Con quién hablamos?', sub: 'Nombre y WhatsApp (puedes dejarlo vacío)', type: 'text', ph: 'Nombre · +502 …' },
    ], 'Crear lead');
    if (!v) return;
    const [contact, phone] = String(v.contact || '').split('·').map((x) => x.trim());
    const l = await L.create({ name: v.name, wants: v.wants, source: v.source, contact: contact || '', phone: phone || '', stage: 'Nuevo', interest: +v.interest, tags: +v.interest >= 4 ? ['Interesado'] : [], activity: [{ at: new Date().toISOString(), who: me.name, text: 'Lead creado' }] });
    leads.push(l); paint(); openLead(l);
  }


  // ---------- Catálogo ----------
  // Buscador del catálogo: filtra las tarjetas mientras escribes (sin redibujar, así no pierdes el cursor).
  const norm = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const filterSv = (body) => { const q = norm(svQ).trim().split(/\s+/).filter(Boolean); let n = 0; $$('.svcard[data-q]', body).forEach((c) => { const ok = q.every((w) => c.dataset.q.includes(w)); c.style.display = ok ? '' : 'none'; if (ok) n++; }); const e = $('#svnone', body); if (e) e.style.display = n || !q.length ? 'none' : ''; };
  function cat(body) {
    const cats = ['Todos', ...new Set([...CATS, ...services.map((s) => s.category).filter(Boolean)])];
    const list = services.filter((s) => catF === 'Todos' || s.category === catF);
    mount(body, html`
      ${plans ? html`<div class="sec-title" style="margin-top:0"><h2>Planes</h2><span class="mut sm">Del manual de Inherent · precio mensual</span></div>
        <div class="grid g4" style="margin-bottom:8px">${plans.plans.map((p, i) => html`<div class="card feat ${['olive', 'terra', 'ink', 'olive'][i]}" style="min-height:170px"><div class="lbl">${p.name}</div><div class="big" style="font-size:38px;margin-top:8px">${Q(p.precio)}</div><div class="foot"><span>${p.volumen?.piezas ?? '—'} piezas · ${USD(p.precioUsd)}</span>${isCeo && p.margen != null ? html`<span style="font-weight:700">${p.margen}% margen</span>` : ''}</div></div>`)}</div>`
        : plansErr ? html`<div class="warnbox" style="margin-bottom:14px">No pude leer los planes del repo: ${plansErr}</div>` : ''}
      <div class="sec-title"><h2>Servicios</h2><span class="mut sm">Mueve el nivel de entrega de cada uno para ver su precio y lo que incluye</span></div>
      <input class="in" type="search" id="svq" placeholder="Buscar servicio: nombre, categoría o lo que incluye" value="${svQ}" style="margin-bottom:12px">
      <div class="row" style="margin-bottom:14px;gap:8px;flex-wrap:wrap">${cats.map((c) => html`<button class="chip ${catF === c ? 'dark' : ''}" data-act="catF" data-c="${c}" style="padding:8px 14px;font-size:13px">${c}</button>`)}</div>
      ${isCeo && rates && (rates.roles || []).some((r) => r.rate == null) ? html`<div class="warnbox" style="margin-bottom:14px">${ico('alert')} Faltan costos por hora de: ${(rates.roles || []).filter((r) => r.rate == null).map((r) => r.role).join(', ')}. Sin eso no hay costo ni precio sugerido.</div>` : ''}
      ${!services.length ? html`<div class="empty"><b>Todavía no hay servicios</b>Crea uno con «+ Nuevo servicio», o carga ejemplos para editarlos.<div style="margin-top:14px"><button class="btn ghost" data-act="seed">Cargar 9 ejemplos para editar</button></div></div>`
      : html`<div class="grid g3">${list.map((s) => { const lv = cardLv[s.id] || s.level || 5, g = growthText({ type: s.growth_type, pct: s.growth_pct }); return html`<div class="card svcard" style="cursor:pointer" data-act="service" data-id="${s.id}" data-q="${norm([s.name, s.category, s.description, s.includes5, s.includes10].join(' '))}">
        <div class="row"><span class="chip ${CATC[s.category] ?? ''}">${s.category || 'Sin categoría'}</span><div class="sp"></div><span class="mut sm">${s.unit || 'proyecto'}${s.price_fixed ? ' · precio fijo' : ''}</span></div>
        <h3 style="font-size:19px;font-weight:500;letter-spacing:-.4px;margin:12px 0 4px">${s.name}</h3><div class="mut sm">${s.description || ''}</div>
        ${g ? html`<div class="sm svgrow">${ico('trend', 14)} + ${g}</div>` : ''}
        <div class="svlv" data-stop><input type="range" min="3" max="10" step="1" value="${lv}" data-cardlv="${s.id}" aria-label="Nivel de entrega"><div class="row mut" style="font-size:11px"><span>3 · básico</span><div class="sp"></div><span>10 · fuerte</span></div></div>
        <div data-cardbody="${s.id}">${cardBody(s, lv)}</div>
        ${sopOf(s) ? html`<a class="sm" data-stop href="#/library/${sopOf(s).folder_id || '_'}/${sopOf(s).id}" style="display:inline-block;margin-top:10px;color:#87684e;font-weight:500">${ico('doc', 15)} Ver el SOP de este servicio ${ico('right', 14)}</a>` : ''}
</div>`; })}</div><div class="empty" id="svnone" style="display:none"><b>No encontré servicios</b>Prueba con otra palabra.</div>`}`);
    const sq = $('#svq', body); if (sq) { sq.addEventListener('input', () => { svQ = sq.value; filterSv(body); }); filterSv(body); }
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
      const cur = { ...(s || {}), tasks, level };
      const c = costOf(cur, level), sug = suggested(cur, level);
      drawer(html`<div class="row"><span class="chip">Servicio</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
        <h2>${s ? 'Editar servicio' : 'Nuevo servicio'}</h2>
        <form class="form" id="sf" style="margin-top:14px">
          <div><label class="f">Nombre *</label><input class="in" name="name" value="${fv.name || ''}"></div>
          <div class="two"><div><label class="f">Categoría</label><select class="in" name="category">${[...new Set([...CATS, fv.category].filter(Boolean))].map((c2) => html`<option ${c2 === fv.category ? raw('selected') : ''}>${c2}</option>`)}</select></div>
            <div><label class="f">Se cobra por</label><select class="in" name="unit">${['proyecto', 'mes', 'pieza', 'hora', 'jornada'].map((u) => html`<option ${u === (fv.unit || 'proyecto') ? raw('selected') : ''}>${u}</option>`)}</select></div></div>
          <div><label class="f">Descripción (sale en la cotización)</label><input class="in" name="description" value="${fv.description || ''}"></div>
          <div><label class="f">Lo que nos hace distintos (una línea, sale en el PDF)</label><input class="in" name="edge" maxlength="110" placeholder="Ej.: Estructura armada por un equipo financiero, no por una plantilla." value="${fv.edge || ''}"></div>
          <div class="two"><div><label class="f">Incluye en sencillo (5) · uno por línea</label><textarea class="in" name="includes5" placeholder="Landing de 1 sección&#10;Formulario de contacto&#10;1 ronda de cambios">${fv.includes5 || ''}</textarea></div>
            <div><label class="f">Se suma al subir a fuerte (10)</label><textarea class="in" name="includes10" placeholder="Copy con investigación&#10;Pruebas A/B&#10;Integración con CRM">${fv.includes10 || ''}</textarea></div></div>
          <div class="two"><div><label class="f">Tarda en sencillo (días hábiles)</label><input class="in" name="days5" type="number" value="${fv.days5 ?? ''}"></div><div><label class="f">Tarda en fuerte (días hábiles)</label><input class="in" name="days10" type="number" value="${fv.days10 ?? ''}"></div></div>
          <div><label class="f">Qué necesitamos del cliente para arrancar · uno por línea <span class="mut">(su onboarding en el portal)</span></label><textarea class="in" name="onboarding" placeholder="Acceso al dominio y hosting&#10;Logo y manual de marca&#10;Quién aprueba de su lado">${fv.onboarding || ''}</textarea></div>
          <div class="two"><div><label class="f">¿Genera crecimiento directo? Qué tipo</label><select class="in" name="growth_type"><option value="">No · solo se cobra el precio</option>${Object.keys(GROWTH).map((k) => html`<option ${k === fv.growth_type ? raw('selected') : ''}>${k}</option>`)}</select></div>
            <div><label class="f">% del crecimiento que se cobra</label><input class="in" name="growth_pct" type="number" step="0.5" value="${fv.growth_pct ?? 10}"></div></div>
          <div><label class="f">Cómo genera ese crecimiento <span class="mut">(sale en la cotización)</span></label><input class="in" name="growth_how" value="${fv.growth_how || ''}" placeholder="Ej. el agente responde y agenda 24/7: más leads atendidos = más ventas"></div>
        </form>
        <div class="row sm mut" style="margin:18px 0 8px"><span style="flex:1">Horas por rol</span><span style="width:90px;text-align:center">Sencillo · 5</span><span style="width:90px;text-align:center">Fuerte · 10</span><span style="width:44px"></span></div>
        ${tasks.map((t, i) => html`<div class="row" style="margin-bottom:8px"><select class="in" data-i="${i}" data-f="role">${[...new Set([...roles, t.role])].map((r) => html`<option ${r === t.role ? raw('selected') : ''}>${r}</option>`)}</select><input class="in" style="max-width:90px" type="number" step="0.5" data-i="${i}" data-f="hours" value="${t.hours}"><input class="in" style="max-width:90px" type="number" step="0.5" data-i="${i}" data-f="hours10" value="${t.hours10}"><button class="btn ghost" data-act="rmTask" data-i="${i}" style="padding:8px 12px">${ico('x', 16)}</button></div>`)}
        <div class="card glass" style="margin-top:14px;padding:14px"><div class="row"><b style="font-weight:500">Nivel de entrega</b><div class="sp"></div><span class="chip ${level >= 8 ? 'dark' : ''}">${level <= 6 ? 'Sencillo' : level >= 9 ? 'Fuerte' : 'Medio'} · ${level}</span></div>
          <input type="range" min="3" max="10" step="1" value="${level}" id="svlv" style="width:100%;margin:10px 0 4px">
          <div id="svprev">${prev(fv)}</div></div>
        <button class="btn ghost" data-act="addTask" style="padding:8px 14px">+ Rol</button>
        ${isCeo ? html`<div class="card glass" style="margin-top:18px;padding:16px"><div class="row" style="flex-wrap:wrap;gap:12px"><div><div class="mut sm">Costo en este nivel</div><b style="font-weight:500">${c ? (c.miss.length ? `falta costo/h de ${c.miss.join(', ')}` : Q(c.cost)) : '—'}</b></div>
          <div><div class="mut sm">Margen objetivo</div><b style="font-weight:500">${marginOf(rates)}%</b></div><div class="sp"></div>
          <div style="text-align:right"><div class="mut sm">Precio automático</div><b style="font-size:22px;font-weight:500">${sug ? Q(sug) : '—'}</b></div></div>
          <div class="mut sm" style="margin-top:8px">= costo ÷ (1 − margen). El margen se cambia en «Costos por hora» y es el mismo para todos los servicios.</div></div>` : ''}
        <div style="margin-top:14px"><label class="f">Precio fijo (opcional · déjalo vacío para que sea automático)</label><input class="in" id="svprice" type="number" value="${s?.price_fixed ?? (s?.price && !s?.prices ? s.price : '')}" placeholder="${sug ? 'Automático: ' + sug : ''}"></div>
        <div class="row" style="margin-top:18px"><button class="btn" data-act="saveSvc">Guardar</button><div class="sp"></div>${s ? html`<button class="btn ghost" data-act="delSvc" aria-label="Eliminar">${ico('trash', 16)}</button>` : ''}</div>`,
      {
        addTask: () => { sync(); tasks.push({ role: roles[0], hours: 1 }); draw(); },
        rmTask: (b) => { sync(); tasks.splice(+b.dataset.i, 1); draw(); },
        saveSvc: async () => {
          sync();
          const f = Object.fromEntries(new FormData($('#sf')));
          if (!f.name) return toast('Falta el nombre', true);
          const fixed = $('#svprice').value === '' ? null : +$('#svprice').value;
          const doc = { ...(s || {}), ...f, growth_pct: f.growth_type ? +f.growth_pct || 0 : null, tasks, level, price_fixed: fixed };
          if (isCeo && rates) doc.prices = pricesOf(doc, rates);
          doc.price = fixed ?? doc.prices?.[level] ?? s?.price ?? null;
          try { const r = s ? await S.save(doc) : await S.create(doc); services = s ? services.map((x) => (x.id === r.id ? r : x)) : [...services, r]; toast('Guardado'); closeDrawer(); after ? after(r) : paint(); }
          catch (e) { toast(e.message, true); }
        },
        delSvc: async () => { if (!(await confirmAsk(`¿Eliminar ${s.name}?`))) return; await S.remove(s.id); services = services.filter((x) => x.id !== s.id); closeDrawer(); paint(); },
      });
      $$('[data-f]', $('#drawer')).forEach((inp) => inp.addEventListener('change', () => { sync(); draw(); }));
      $$('#sf [name=includes5], #sf [name=includes10], #sf [name=days5], #sf [name=days10]').forEach((x) => x.addEventListener('input', () => mount($('#svprev'), prev({ ...(s || {}), ...curForm() }))));
      $('#svlv').addEventListener('input', (e) => { sync(); level = +e.target.value; const y = $('#drawer').scrollTop; draw(); $('#drawer').scrollTop = y; });
    };
    const sync = () => $$('[data-f]', $('#drawer')).forEach((inp) => { tasks[+inp.dataset.i][inp.dataset.f] = inp.dataset.f === 'role' ? inp.value : +inp.value; });
    draw();
  }

  async function editRates() {
    let roles = (rates?.roles || DEFAULT_ROLES.map(([role, rate]) => ({ role, rate }))).map((r) => ({ ...r }));
    const draw = () => drawer(html`<div class="row"><span class="chip dark">${ico('lock', 13)} Solo CEO</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>Costos por hora</h2><p class="mut sm" style="margin-top:6px">Lo que le cuesta a Inherent una hora de cada rol, según el nivel del servicio. Los niveles de en medio se calculan solos. Si dejas vacío el 3 o el 10, se usa el del nivel 5.</p>
      <div class="row mut sm" style="margin-top:14px;gap:8px"><span style="flex:1">Rol</span><span style="width:84px;text-align:center">Nivel 3 (Q)</span><span style="width:84px;text-align:center">Nivel 5 (Q)</span><span style="width:84px;text-align:center">Nivel 10 (Q)</span><span style="width:44px"></span></div>
      <div style="margin-top:8px">${roles.map((r, i) => html`<div class="row" style="margin-bottom:8px;gap:8px"><input class="in" data-i="${i}" data-f="role" value="${r.role}"><span class="mut">Q</span><input class="in" style="max-width:84px" type="number" data-i="${i}" data-f="rate3" value="${r.rate3 ?? ''}" placeholder="= nivel 5" title="Nivel 3"><input class="in" style="max-width:84px" type="number" data-i="${i}" data-f="rate" value="${r.rate ?? ''}" placeholder="falta" title="Nivel 5"><input class="in" style="max-width:84px" type="number" data-i="${i}" data-f="rate10" value="${r.rate10 ?? ''}" placeholder="= nivel 5" title="Nivel 10"><button class="btn ghost" data-act="rm" data-i="${i}" style="padding:8px 12px">${ico('x', 16)}</button></div>`)}</div>
      <button class="btn ghost" data-act="add" style="padding:8px 14px">+ Rol</button>
      <div class="card glass" style="margin-top:18px;padding:14px"><b style="font-weight:500">Margen</b><p class="mut sm" style="margin:4px 0 10px">El precio de todos los servicios sale del costo para dejar este margen: precio = costo ÷ (1 − margen). El rango permitido es de 70 a 80%.</p>
        <div class="row" style="gap:8px"><span class="sm">Margen</span><input class="in" id="margin" type="number" step="1" min="1" max="95" value="${marginOf(rates)}" style="max-width:90px"><span class="mut">%</span></div></div>
      <div class="row" style="margin-top:18px"><button class="btn" data-act="saveRates">Guardar</button></div>`,
    {
      add: () => { sync(); roles.push({ role: '', rate: null }); draw(); },
      rm: (b) => { sync(); roles.splice(+b.dataset.i, 1); draw(); },
      saveRates: async () => {
        sync();
        const clean = roles.filter((r) => r.role.trim()).map((r) => { const n = (v) => (v === '' || v == null || isNaN(v) ? null : +v); return { role: r.role.trim(), rate: n(r.rate), rate3: n(r.rate3), rate10: n(r.rate10) }; });
        const margin = Math.min(95, Math.max(1, +$('#margin').value || 75));
        try { rates = rates ? await R.save({ ...rates, roles: clean, margin }) : await R.create({ id: 'default', roles: clean, margin });
          // Los precios automáticos se recalculan con los costos nuevos (los de precio fijo no se tocan).
          let n = 0;
          for (const sv of services) { if (sv.price_fixed || (sv.price && !sv.prices)) continue; const prices = pricesOf(sv, rates); if (JSON.stringify(prices) === JSON.stringify(sv.prices || null)) continue;
            try { const r = await S.save({ ...sv, prices, price: prices?.[sv.level || 5] ?? sv.price }); services = services.map((x) => (x.id === r.id ? r : x)); n++; } catch {} }
          toast(`Costos guardados${n ? ` · ${n} precio${n === 1 ? '' : 's'} recalculado${n === 1 ? '' : 's'}` : ''}`); closeDrawer(); paint(); }
        catch (e) { toast(e.message, true); }
      },
    });
    const sync = () => $$('[data-f]', $('#drawer')).forEach((inp) => { roles[+inp.dataset.i][inp.dataset.f] = inp.dataset.f === 'role' ? inp.value : inp.value === '' ? null : +inp.value; });
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
    toast('9 ejemplos cargados. Ajusta horas y precios'); paint();
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
      const cost = isCeo && rates ? doc.items.reduce((a, i) => { const s = services.find((x) => x.id === i.service_id); const c = s ? costOf(s, i.level || s.level || 5) : null; return a + (c && !c.miss.length ? c.cost * (+i.qty || 0) : (+i.cost || 0) * (+i.qty || 0)); }, 0) : null;
      mount(el, html`
        <div class="row" style="margin-bottom:22px"><button class="btn ghost" data-act="back">← Cotizaciones</button><div class="sp"></div>
          <select class="in" id="qcur" style="width:auto;max-width:230px" title="Moneda">${CUR.map((c) => html`<option value="${c}" ${c === (doc.currency || 'GTQ') ? raw('selected') : ''}>${c} · ${curName(c)}</option>`)}</select>
          ${doc.currency && doc.currency !== 'GTQ' ? html`<label class="sm mut row" style="gap:6px">1 Q =<input class="in" id="qrate" type="number" step="0.0001" value="${doc.rate || ''}" style="width:100px"></label>` : ''}
          <select class="in" id="qstatus" style="width:auto">${Object.keys(QSTATUS).map((s) => html`<option ${s === doc.status ? raw('selected') : ''}>${s}</option>`)}</select>
          <button class="btn ghost" data-act="pdf">Ver PDF</button>${doc.id && doc.items.some((i) => i.service_id) && canProject ? html`<button class="btn ghost" data-act="toProject">→ Crear proyecto</button>` : ''}<button class="btn" data-act="saveQ">Guardar</button></div>
        <div class="grid g2">
          <div class="card">
            <div class="chead"><div class="ico">${ico('edit')}</div><h3>${doc.number}<br><span class="mut sm">${fdateLong(doc.date)}</span></h3></div>
            <form class="form" id="qf">
              <div class="two"><div><label class="f">Cliente</label><input class="in" name="client" list="leadlist" placeholder="Elige del CRM o escribe uno nuevo" value="${doc.client}"></div><div><label class="f">Contacto</label><input class="in" name="contact" value="${doc.contact || ''}"></div></div>
              <datalist id="leadlist">${leads.map((l) => html`<option value="${l.name}">`)}</datalist>
            </form>
            <div class="sm mut" style="margin:18px 0 8px">Servicios</div>
            ${doc.items.map((it, i) => html`<div class="card glass" style="padding:12px 14px;margin-bottom:8px;border-radius:18px"><div class="row"><input class="in" data-i="${i}" data-f="name" value="${it.name}" style="font-weight:500"><button class="btn ghost" data-act="rmItem" data-i="${i}" style="padding:8px 12px"></button></div>
              <div class="row" style="margin-top:8px"><input class="in" data-i="${i}" data-f="description" value="${it.description || ''}" placeholder="Descripción"><input class="in" style="max-width:80px" type="number" data-i="${i}" data-f="qty" value="${it.qty}"><span class="mut">×</span>${it.service_id ? html`<span class="in qprice" data-pshow="${i}" title="Calculado por el nivel de entrega">${it.price != null ? money(doc, it.price) : '—'}</span>` : html`<input class="in" style="max-width:130px" type="number" data-i="${i}" data-f="price" value="${it.price ?? ''}" placeholder="Precio (Q)">`}</div>
              ${(() => { const sv = services.find((x) => x.id === it.service_id); if (!sv || !(sv.tasks || []).length) return ''; const lv = it.level || sv.level || 5;
                const miss = [priceAt(sv, lv) == null ? 'precio (o costos por hora)' : '', !String(sv.includes5 || '').trim() ? 'lo que incluye' : '', !sv.days5 ? 'días' : ''].filter(Boolean);
                return html`${miss.length ? html`<div class="warnbox sm" style="margin-top:10px">A «${sv.name}» le falta en el catálogo: <b>${miss.join(', ')}</b>. Sin eso el nivel no cambia el precio ni lo que incluye. <button class="btn ghost xs" data-act="fixSvc" data-id="${sv.id}" style="margin-left:6px">Completar</button></div>` : ''}<div class="qlv"><div class="row sm"><span>Nivel de entrega</span><div class="sp"></div><b style="font-weight:500" data-lvl="${i}">${lvName(lv)} · ${lv} · ${svcHours(sv, lv)} h</b></div>
                  <input type="range" min="3" max="10" step="1" value="${lv}" data-qlv="${i}" style="width:100%">
                  <div class="row mut" style="font-size:11px"><span>3 · básico</span><div class="sp"></div><span>10 · fuerte</span></div>
                  ${includesAt(sv, lv).length || daysAt(sv, lv) ? html`<div class="sm" style="margin-top:8px" data-inc="${i}">${incHtml(sv, lv)}</div>` : ''}</div>`; })()}
              ${it.growth ? html`<div class="qgrow"><span>${ico('trend', 14)} + fee por crecimiento</span><input class="in" type="number" step="0.5" data-i="${i}" data-f="growth_pct" value="${it.growth.pct}"><span class="mut">% de ${GROWTH[it.growth.type] || it.growth.type}</span><button class="btn ghost xs" data-act="rmGrowth" data-i="${i}" title="Quitar el fee"></button></div>` : ''}</div>`)}
            <div class="row" style="margin-top:10px"><select class="in" id="addSvc"><option value="">+ Agregar del catálogo…</option>
              ${plans ? html`<optgroup label="Planes (mensual)">${plans.plans.map((p) => html`<option value="plan:${p.id}">Plan ${p.name} — ${Q(p.precio)}</option>`)}</optgroup>` : ''}
              ${services.length ? html`<optgroup label="Servicios del catálogo">${services.map((s) => html`<option value="${s.id}">${s.name}${s.price ? ' — ' + Q(s.price) : ''}</option>`)}</optgroup>` : ''}<option value="new">Crear servicio nuevo (se guarda en el catálogo)</option><option value="free">Línea libre (solo esta cotización)</option></select></div>
            ${!services.length ? html`<div class="mut sm" style="margin-top:8px">Tu catálogo está vacío. Crea servicios aquí mismo o en «Catálogo de servicios».</div>` : ''}
            <div class="two" style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label class="f">Descuento %</label><input class="in" id="qdisc" type="number" value="${doc.discount_pct || 0}"></div><div><label class="f">Válida por (días)</label><input class="in" id="qvalid" type="number" value="${doc.valid_days || 15}"></div></div>
            <div style="margin-top:12px"><label class="f">Tiempo total (días hábiles)</label><input class="in" id="qdays" type="number" min="0" value="${+doc.days > 0 ? doc.days : ''}" placeholder="${autoDays(doc) ? `${autoDays(doc)} si todo va en paralelo` : 'Escribe los días'}"><div class="mut sm" style="margin-top:4px">Si hay servicios que van uno después de otro, escribe el total real.</div></div>
            <div style="margin-top:12px"><label class="f">Lo que esto va a provocar en su negocio (sale ANTES del precio)</label><textarea class="in" id="qintro" style="min-height:120px" placeholder="Cómo se traduce en crecimiento lo que vamos a implementar.">${doc.intro || ''}</textarea></div>
            <div style="margin-top:12px"><label class="f">Siguientes pasos (uno por línea; si lo dejas vacío salen los de siempre)</label><textarea class="in" id="qnext">${doc.next || ''}</textarea></div>
            <div style="margin-top:12px"><label class="f">Notas y condiciones (salen en el PDF)</label><textarea class="in" id="qnotes">${doc.notes || ''}</textarea></div>
          </div>
          <div class="card feat olive" style="align-self:start">
            <div class="chead"><div class="ico">${ico('target', 16)}</div><h3>Total<br><span class="lbl">${doc.client || 'Sin cliente'}</span></h3></div>
            <div class="big" style="font-size:52px">${money(doc, tt)}</div>
            <div class="split"><div><span class="lbl">Subtotal</span><b>${money(doc, st)}</b></div>${quoteDays(doc) ? html`<div><span class="lbl">Tiempo</span><b>${quoteDays(doc)} días</b></div>` : ''}${doc.discount_pct ? html`<div><span class="lbl">Descuento</span><b>-${doc.discount_pct}%</b></div>` : ''}
              ${cost != null ? (() => { const mg = tt ? Math.round(((tt - cost) / tt) * 100) : null; return html`<div><span class="lbl">${ico('lock', 12)} Costo</span><b>${money(doc, cost)}</b></div><div><span class="lbl">${ico('lock', 12)} Margen</span><b style="color:#faf6ee">${mg != null ? mg + '%' : '—'}</b>${mg != null && mg < 70 ? html`<span class="lbl" style="display:block;margin-top:4px">${ico('alert', 12)} Bajo el mínimo de 70%</span>` : ''}</div>`; })() : ''}</div>
            ${fees(doc).length ? html`<div class="qfees"><span class="lbl">+ Fee por crecimiento (variable, se suma cada mes)</span>${fees(doc).map((i) => html`<div>${ico('trend', 14)} ${growthText(i.growth)} <span style="opacity:.7">· ${i.name}</span></div>`)}</div>` : ''}
            <div class="foot" style="margin-top:22px;opacity:1"><button class="btn cream" data-act="pdf">↓ Ver PDF</button>${qq ? html`<button class="btn ghost" data-act="delQ" style="background:transparent;color:#fdfaf3;border-color:rgba(253,250,243,.4)">${ico('trash', 16)}</button>` : ''}</div>
          </div>
        </div>`);
      $('#addSvc', el).onchange = async (e) => {
        sync(); const v = e.target.value;
        if (v === 'new') {
          const n = await ask('Nuevo servicio', [{ k: 'name', l: 'Nombre', req: true }, { k: 'category', l: 'Categoría', t: 'select', opts: CATS.map((c) => [c, c]), half: true }, { k: 'unit', l: 'Se cobra por', t: 'select', opts: [['proyecto', 'Proyecto'], ['mes', 'Mes'], ['pieza', 'Pieza'], ['hora', 'Hora']], half: true }, { k: 'price', l: 'Precio (Q)', t: 'number', req: true }, { k: 'description', l: 'Descripción (sale en la cotización)', t: 'textarea' }]);
          if (!n) return draw();
          try { const r = await S.create({ ...n, price: +n.price || 0, tasks: [] }); services.push(r); doc.items.push({ service_id: r.id, name: r.name, description: r.description || '', qty: 1, price: r.price }); toast('Servicio creado y agregado · Sus horas se editan en el Catálogo'); }
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
      // Al elegir un lead del CRM se llenan su contacto y su correo.
      $('[name=client]', el)?.addEventListener('change', (ev) => { const l = leads.find((x) => x.name.trim().toLowerCase() === ev.target.value.trim().toLowerCase()); if (!l) return; doc.lead_id = l.id; const c = $('[name=contact]', el); if (c && !c.value) c.value = l.contact || ''; if (!doc.email) doc.email = l.email || ''; });
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
      if ($('#qdisc', el)) { doc.discount_pct = +$('#qdisc', el).value || 0; doc.valid_days = +$('#qvalid', el).value || 15; doc.days = +($('#qdays', el)?.value || 0) || null; doc.notes = $('#qnotes', el).value; doc.intro = $('#qintro', el)?.value || ''; doc.next = $('#qnext', el)?.value || ''; doc.status = $('#qstatus', el).value; }
    };
    const handlers = {
      back: () => { location.hash = '/sales/quotes'; paint(); },
      rmItem: (b) => { sync(); doc.items.splice(+b.dataset.i, 1); draw(); },
      rmGrowth: (b) => { sync(); doc.items[+b.dataset.i].growth = null; draw(); },
      saveQ: async () => {
        sync();
        if (!doc.client) return toast('Falta el cliente', true);
        // El cliente sale del CRM: si ya es lead se enlaza; si es nuevo, se crea en el CRM. Así en Control pasa de interesado a cotizado.
        try {
          const key = (x) => String(x || '').trim().toLowerCase();
          let ld = leads.find((l) => l.id === doc.lead_id && key(l.name) === key(doc.client)) || leads.find((l) => key(l.name) === key(doc.client));
          if (!ld) { ld = await L.create({ name: doc.client.trim(), contact: doc.contact || '', email: doc.email || '', stage: 'Propuesta', tags: [], activity: [] }); leads.push(ld); }
          else if (['Nuevo', 'Contactado'].includes(ld.stage || 'Nuevo')) { const r = await L.save({ ...ld, stage: 'Propuesta' }); leads = leads.map((x) => (x.id === r.id ? r : x)); }
          doc.lead_id = ld.id; if (!doc.contact) doc.contact = ld.contact || ''; if (!doc.email) doc.email = ld.email || '';
        } catch (e) { return toast(e.message, true); }
        // Enviada, aprobada o rechazada no es solo una etiqueta: dispara el flujo (tarea de cobro, lead, Control).
        const STEP = { Enviada: 'send', Aceptada: 'approve', Rechazada: 'reject' };
        const prev = (doc.id && quotes.find((x) => x.id === doc.id)?.status) || 'Borrador', want = doc.status, go = STEP[want] && want !== prev;
        if (go) doc.status = prev;
        try { let r = doc.id ? await C.save(doc) : await C.create(doc);
          if (go) { await api('flow/quote/' + r.id, { method: 'POST', body: { action: STEP[want] } }); r = await C.get(r.id); }
          quotes = quotes.some((x) => x.id === r.id) ? quotes.map((x) => (x.id === r.id ? r : x)) : [...quotes, r]; doc = JSON.parse(JSON.stringify(r));
          toast(go && want === 'Aceptada' ? 'Aprobada · se creó la tarea para subir el pago' : 'Cotización guardada'); draw(); }
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
        if (r) { if (doc.status !== 'Aceptada') { doc.status = 'Aceptada'; try { const q = await C.save(doc); doc = JSON.parse(JSON.stringify(q)); quotes = quotes.map((x) => (x.id === q.id ? q : x)); } catch {} } toast('Proyecto creado desde la cotización'); location.hash = '/operations/pipe'; }
      },
      delQ: async () => { if (!(await confirmAsk(`¿Eliminar ${doc.number}?`))) return; await C.remove(doc.id); quotes = quotes.filter((x) => x.id !== doc.id); paint(); },
    };
    el.onclick = (e) => { const t = e.target.closest('[data-act]'); if (t && handlers[t.dataset.act]) { e.stopImmediatePropagation(); handlers[t.dataset.act](t, e); } };
    draw();
  }

  // Descarga directa del PDF (sin el diálogo de imprimir), con nombre «Inherent cotización - Marca - fecha».
  // Ninguna tarjeta o bloque queda partido entre dos páginas.
  const loadJs = (src) => new Promise((ok, ko) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = () => ko(new Error('No pude cargar el generador de PDF')); document.head.appendChild(sc); });
  const loadH2p = async () => { if (!window.html2canvas) await loadJs('/vendor/html2canvas.min.js'); if (!window.jspdf) await loadJs('/vendor/jspdf.umd.min.js'); };
  async function downloadPdf(v, doc, btn) {
    const label = btn?.innerHTML; if (btn) { btn.disabled = true; btn.textContent = 'Generando PDF…'; }
    try {
      await loadH2p();
      const src = $('.qdoc', v), box = document.createElement('div'), clone = src.cloneNode(true);
      box.style.cssText = 'position:fixed;left:0;top:0;width:612px;background:#fff;z-index:-1;pointer-events:none'; clone.classList.add('qpdf'); box.appendChild(clone); document.body.appendChild(box);
      // Los logos SVG se pasan a imagen antes de convertir (el generador no dibuja SVG solo).
      await Promise.all([...clone.querySelectorAll('img')].filter((im) => /\.svg/.test(im.src)).map((im) => new Promise((ok) => {
        const w = im.getBoundingClientRect().width || 120, h = im.getBoundingClientRect().height || 40, i2 = new Image();
        i2.onload = () => { const c = document.createElement('canvas'); c.width = w * 3; c.height = h * 3; c.getContext('2d').drawImage(i2, 0, 0, c.width, c.height); im.style.width = w + 'px'; im.style.height = h + 'px'; im.src = c.toDataURL('image/png'); ok(); };
        i2.onerror = ok; i2.src = im.src; })));
      const safe = (t) => String(t || '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();
      const name = `Inherent cotización - ${safe(doc.client) || 'Cliente'} - ${doc.date || today()}.pdf`;
      // Tres hojas, una por sección: principal · qué entregamos · inversión. Cada sección se dibuja completa en una
      // hoja carta al mismo ancho; si no cabe, se dibuja más ancha (letra relativamente más chica) y se reduce a la
      // hoja, hasta que quepa. Solo si una sección es enorme se reparte en varias hojas, sin partir tarjetas.
      const kids = [...clone.children], iEnt = kids.findIndex((k) => k.classList.contains('qent')), iInv = kids.findIndex((k) => k.classList.contains('qinv'));
      const cuts = [0, iEnt, iInv, kids.length].filter((x, i, a) => x >= 0 && (i === 0 || x > a[i - 1]));
      const PW = 612, PH = 792, M = 22, AV = PH - 2 * M, sy = scrollY, sx = scrollX, pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
      clone.remove(); scrollTo(0, 0);
      const shot = (pg, W) => window.html2canvas(pg, { scale: 2.5 * 612 / W + 0.5, backgroundColor: '#ffffff', width: W, windowWidth: W, useCORS: true, x: 0, y: 0, scrollX: 0, scrollY: 0, logging: false });
      const mk = (els, W, cls = '') => { const pg = document.createElement('div'); pg.className = 'qdoc qpdf'; pg.style.setProperty('--pw', W + 'px'); box.style.width = W + 'px'; let host = pg;
        if (cls) { host = document.createElement('div'); host.className = cls; host.style.marginTop = '0'; pg.appendChild(host); } els.forEach((e) => host.appendChild(e)); box.replaceChildren(pg); return pg; };
      let first = true; const page = () => { if (!first) pdf.addPage('letter', 'portrait'); first = false; };
      try {
        for (let g = 0; g < cuts.length - 1; g++) {
          const els = kids.slice(cuts[g], cuts[g + 1]); let done = false;
          for (const W of [612, 660, 710, 770, 830, 900]) {
            const pg = mk(els, W);
            if (pg.offsetHeight * PW / W <= AV) { const cv = await shot(pg, W), dh = cv.height * PW / cv.width; page(); pdf.addImage(cv.toDataURL('image/jpeg', 0.95), 'JPEG', 0, M, PW, dh); done = true; break; }
          }
          if (done) continue;
          // Sección enorme: por bloques (cada título pegado a lo que sigue; tarjetas de dos en dos) al ancho más chico.
          const W = 900, blocks = []; let pend = null;
          const push = (e, cls) => { if (pend) { e = [...pend.e, ...e]; cls = pend.cls || cls; pend = null; } blocks.push({ e, cls }); };
          els.forEach((k) => {
            if (k.classList.contains('qsec')) [...k.children].forEach((c) => {
              if (c.classList.contains('lbl2') && !pend) pend = { e: [c], cls: k.className };
              else if (c.classList.contains('qgets')) { const cards = [...c.children]; for (let j = 0; j < cards.length; j += 2) { const row = document.createElement('div'); row.className = c.className; row.style.marginBottom = '10px'; cards.slice(j, j + 2).forEach((x) => row.appendChild(x)); push([row], k.className); } }
              else push([c], k.className);
            });
            else if (k.classList.contains('lbl2')) pend = { e: [k], cls: '' };
            else push([k], '');
          });
          if (pend) push([], '');
          let y = PH; 
          for (const bl of blocks) { const cv = await shot(mk(bl.e, W, bl.cls), W), dh = cv.height * PW / cv.width; if (y + dh > PH - M) { page(); y = M; } pdf.addImage(cv.toDataURL('image/jpeg', 0.95), 'JPEG', 0, y, PW, dh); y += dh; }
        }
      } finally { scrollTo(sx, sy); }
      const out = pdf.output('blob'), a = document.createElement('a'); a.href = URL.createObjectURL(out); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      box.remove();
    } catch (e) { toast(e.message || 'No se pudo generar el PDF', true); }
    if (btn) { btn.disabled = false; btn.innerHTML = label; }
  }

  function showPdf(doc) {
    const valid = new Date(doc.date + 'T12:00'); valid.setDate(valid.getDate() + (+doc.valid_days || 15));
    const st = subtotal(doc), tt = total(doc);
    const v = document.createElement('div'); v.className = 'qview';
    mount(v, html`<div class="qbar"><button class="btn" data-x="print">↓ Descargar PDF</button><button class="btn ghost" data-x="close">Cerrar</button><div class="sp"></div><span class="sm" style="color:var(--cream);align-self:center;display:none">En el diálogo elige «Guardar como PDF»</span></div>
      <div class="qdoc">
        <div class="qh"><div class="qlogo"><img src="/brand/emblem-dark.svg" alt=""><div><img src="/brand/wordmark-dark.svg" alt="Inherent" style="height:26px;width:auto;display:block"><div class="go" style="margin-top:6px">GROWTH OPERATOR</div></div></div>
          <div class="qmeta"><b>Cotización</b>${doc.number}<br>${fdateLong(doc.date)}<br>Válida hasta el ${fdateLong(valid.toISOString().slice(0, 10))}</div></div>
        <div class="qto"><div><div class="lbl2">PARA</div><b style="font-weight:500;font-size:15px">${doc.client}</b>${doc.contact ? html`<div>${doc.contact}</div>` : ''}</div>
          <div><div class="lbl2">DE</div><b style="font-weight:500;font-size:15px">Inherent</b><div>inherentglobal.com</div></div></div>
        ${(() => { const lines = String(doc.intro || '').split('\n').map((l) => l.trim()).filter(Boolean), whys = doc.items.filter((i) => (i.why || []).length);
          // El texto se arma por secciones (títulos en MAYÚSCULAS): lo que recibes en tarjetas con ícono, el crecimiento resaltado.
          const secs = [{ h: '', ls: [] }]; lines.forEach((l) => { if (l.length > 6 && l === l.toUpperCase() && /[A-ZÁÉÍÓÚ]/.test(l)) secs.push({ h: l, ls: [] }); else secs.at(-1).ls.push(l); });
          const icOf = (t) => { const x = t.toLowerCase(); return /financ|inversi|costo|precio|ganancia/.test(x) ? 'bars' : /whatsapp|contacto|mensaje|pedido|crm/.test(x) ? 'chat' : /web|sitio|página|landing|google/.test(x) ? 'monitor' : /instagram|redes|presencia|contenido|publica/.test(x) ? 'megaphone' : /video|foto/.test(x) ? 'camera' : /pauta|anuncio/.test(x) ? 'target' : 'check'; };
          const strip = (l) => l.replace(/^(\d+[.)]|[-•])\s*/, '');
          // Límites de texto del PDF (para que todo quepa en 3 hojas): se corta en la primera frase completa que quepa.
          const short = (t, n) => { t = String(t || '').trim(); if (t.length <= n) return t; const c = t.slice(0, n), k = Math.max(c.lastIndexOf('. '), c.lastIndexOf('; ')); return k > n * 0.5 ? c.slice(0, k + 1) : c.replace(/[\s,;:(]+\S*$/, '') + '…'; };
          const split2 = (l) => { const t = strip(l), m = t.match(/^([^.:]{3,80})[.:]\s+(.*)$/); return m ? [m[1], m[2]] : [t, '']; };
          const vSec = (sc) => { const h = sc.h.toLowerCase();
            if (/recib|incluye(?!.*no)|entregamos/.test(h) && !/no incluye/.test(h)) return html`<div class="lbl2" style="margin-top:14px">${sc.h}</div><div class="qgets">${sc.ls.map((l) => { const [t, d] = split2(l); return html`<div class="qget"><span class="qgi">${ico(icOf(t + ' ' + d), 18)}</span><div><b>${t}</b>${d ? html`<div>${short(d, 130)}</div>` : ''}</div></div>`; })}</div>`;
            if (/crecimiento|lograr|resultado/.test(h)) return html`<div class="qgrow"><div class="lbl2">${sc.h}</div>${sc.ls.map((l) => { const [t, d] = split2(l); return html`<div class="qgr"><span class="qgi up">${ico('trend', 16)}</span><div>${d ? html`<b>${t}.</b> ${short(d, 110)}` : short(t, 140)}</div></div>`; })}</div>`;
            if (/no incluye/.test(h)) return html`<div class="lbl2" style="margin-top:14px">${sc.h}</div><div class="qnot">${sc.ls.map((l) => html`<div>${ico('x', 12)} ${strip(l)}</div>`)}</div>`;
            return html`${sc.h ? html`<div class="lbl2" style="margin-top:14px">${sc.h}</div>` : ''}${sc.ls.map((l) => html`<p>${l}</p>`)}`; };
          return lines.length ? html`<div class="qsec"><div class="lbl2">LO QUE VAMOS A LOGRAR EN TU NEGOCIO</div>${secs.map(vSec)}</div>` : ''; })()}
        <div class="qsec qent"><div class="lbl2">QUÉ ENTREGAMOS Y CÓMO TE AYUDA</div><div class="qgets qsvc">${doc.items.map((i) => { const sv = services.find((x) => x.id === i.service_id), lv = i.level || sv?.level || 5, inc = i.includes?.length ? i.includes : sv ? includesAt(sv, lv) : [], d = sv ? daysAt(sv, lv) : 0;
          // Tarjeta corta por servicio: lo esencial y hasta 3 entregables (el resto se resume).
          const cut = (t, n) => { t = String(t || '').trim(); if (t.length <= n) return t; const c = t.slice(0, n), k = c.lastIndexOf('. '); return k > n * 0.5 ? c.slice(0, k + 1) : c.replace(/[\s,;:(]+\S*$/, '') + '…'; };
          return html`<div class="qget qs"><div><b>${i.name}</b><div class="qsm">${i.level ? `Entrega ${lvName(i.level).toLowerCase()}` : ''}${d ? `${i.level ? ' · ' : ''}${d} días hábiles` : ''}</div>${(sv?.edge || i.edge) ? html`<div class="qedge">${ico('spark', 12)} ${cut(sv?.edge || i.edge, 110)}</div>` : i.description ? html`<div>${cut(i.description, 110)}</div>` : ''}${inc.length ? html`<ul>${inc.slice(0, 3).map((x) => html`<li>${cut(x, 70)}</li>`)}${inc.length > 3 ? html`<li>y ${inc.length - 3} más</li>` : ''}</ul>` : ''}${(i.why || []).length ? html`<div class="qsm" style="margin-top:4px">Se mide: ${i.why.map((w) => cut(String(w).replace(/\s—\s*se mide con:.*$/i, ''), 60)).join(' · ')}</div>` : ''}</div></div>`; })}</div></div>
        <div class="lbl2 qinv" style="margin-top:22px">INVERSIÓN</div>
        <table><thead><tr><th>Servicio</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Total</th></tr></thead>
          <tbody>${doc.items.map((i) => html`<tr><td><b style="font-weight:500">${i.name}</b></td><td class="n">${i.qty}</td><td class="n">${money(doc, i.price)}</td><td class="n">${money(doc, (+i.qty || 0) * (+i.price || 0))}</td></tr>`)}</tbody></table>
        <div class="qsum"><div><span>Subtotal</span><span>${money(doc, st)}</span></div>${doc.discount_pct ? html`<div><span>Descuento (${doc.discount_pct}%)</span><span>-${money(doc, st - tt)}</span></div>` : ''}<div class="tot"><span>Total</span><span>${money(doc, tt)}</span></div>${quoteDays(doc) ? html`<div><span>Tiempo estimado</span><span>${quoteDays(doc)} días hábiles</span></div>` : ''}</div>
        ${fees(doc).length ? html`<div class="qnotes"><div class="lbl2">FEE POR CRECIMIENTO · VARIABLE</div>${fees(doc).map((i) => html`<div><b style="font-weight:500">${i.name}:</b> ${growthText(i.growth)}${i.growth.how ? html` <span style="color:#7a5d46">— ${i.growth.how}</span>` : ''}</div>`)}<div style="color:#7a5d46;font-size:11.5px;margin-top:6px">Se calcula cada mes sobre el crecimiento medido y atribuible a este servicio. Sin atribución clara, no se cobra.</div></div>` : ''}
        <div class="qsec"><div class="lbl2">SIGUIENTES PASOS</div><ol>${(String(doc.next || '').split('\n').map((l) => l.trim()).filter(Boolean).length ? String(doc.next).split('\n').map((l) => l.trim()).filter(Boolean) : ['Confirmas esta propuesta y el alcance.', 'Hacemos una llamada de arranque para tomar tus datos y accesos.', 'Coordinamos el primer pago y firmamos.', 'Empezamos y te mostramos avances en cada entrega.']).map((l) => html`<li>${l}</li>`)}</ol></div>
        ${doc.notes && !(/no incluye/i.test(doc.intro || '') && /^\s*no incluye/i.test(doc.notes)) ? html`<div class="qnotes"><div class="lbl2">NOTAS Y CONDICIONES</div>${doc.notes.split('\n').map((l) => html`<div>${l}</div>`)}</div>` : ''}
        <div class="qfoot"><span>Inherent · Growth Operator</span><span>inherentglobal.com</span></div>
      </div>`);
    document.body.append(v);
    v.onclick = (e) => { const x = e.target.closest('[data-x]')?.dataset.x; if (x === 'print') downloadPdf(v, doc, e.target.closest('[data-x]')); if (x === 'close' || e.target === v) v.remove(); };
  }

  // ---------- acciones ----------
  acts(el, {
    tab: (b) => { tab = b.dataset.t; history.replaceState(null, '', '#/sales/' + tab); swap(el, paint); },
    crmView: (b) => { crmView = b.dataset.v; paint(); },
    tagF: (b) => { tagF = b.dataset.t; paint(); },
    catF: (b) => { catF = b.dataset.c; paint(); },
    lead: (b) => openLead(leads.find((l) => l.id === b.dataset.id)),
    newLead, newService: () => editService(null), rates: editRates, seed,
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
