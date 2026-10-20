// El catálogo de servicios: la tarjeta de cada servicio con su nivel de entrega (3 básico · 10 fuerte), horas, días, precio
// y costo (solo CEO); el editor del servicio y los costos por hora. Es el mismo código para Servicios → Servicios y para
// el editor de servicio de Ventas → Cotizaciones («Completar»): una sola presentación, una sola edición.
import { html, raw, mount, col, drawer, closeDrawer, toast, confirmAsk, Q, $, $$, ico } from './core.js';
import { hoursAt, svcHours, svcCost, svcPrice, svcAuto, pricesOf, marginOf, GROWTH, growthText, includesAt, daysAt } from './cycle.js';
import { LEVELS } from './levels.js';

export const CATS = ['IA y automatización', 'CRM y ventas', 'Landing y conversión', 'Marketing y publicidad', 'Producción de video', 'Fotografía', 'Email marketing', 'SEO local', 'Analítica y medición', 'UGC y contenido mensual', 'Operación y estructura'];
export const CATC = { 'IA y automatización': 'lime', 'CRM y ventas': 'blue', 'Landing y conversión': 'green', 'Marketing y publicidad': 'amber', 'Producción de video': 'red', Fotografía: 'dark', 'Email marketing': 'blue', 'SEO local': 'green', 'Analítica y medición': 'lime', 'UGC y contenido mensual': 'amber', 'Operación y estructura': 'dark' };
const DEFAULT_ROLES = [['Estrategia', null], ['Producción', 150], ['Fotografía', null], ['Edición', null], ['Diseño', null], ['Dev / Tech', null], ['Operador', null], ['Pauta', null]];
export const lvName = (lv) => (lv <= 4 ? 'Básico' : lv <= 6 ? 'Sencillo' : lv >= 9 ? 'Fuerte' : 'Medio');
const norm = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// `getS/setS` y `getR/setR` leen y escriben la lista de servicios y los costos por hora de la pantalla que lo monta;
// `paint` la repinta; `flag(s)` agrega un aviso a la tarjeta (ej. «Sin responsables»); `levels` muestra las tarjetas de los 3 niveles arriba.
export function createCatalog({ me, getS, setS, getR, setR, paint, alive = () => true, flag = () => '', levels = true, isCat = () => true }) {
  const isCeo = me.role === 'ceo';
  const S = col('services'), R = col('rates');
  let catF = 'Todos', svQ = '', cardLv = {}, sops = {};
  // Los SOPs de la Library: cada tarjeta enlaza al de su servicio (si no tienes acceso a la Library, no se muestra).
  col('docs').list().then((l) => { sops = Object.fromEntries(l.filter((d) => d.kind === 'SOP' && /^SOP · /.test(d.title)).map((d) => [d.title.slice(6).trim().toLowerCase(), d])); if (alive() && isCat()) paint(); }).catch(() => {});
  const sopOf = (s) => sops[String(s.name || '').trim().toLowerCase()];

  // ---------- costos (solo CEO) ----------
  // Costo = horas de cada rol en el nivel del servicio (5 sencillo · 10 fuerte) × su costo por hora.
  const costOf = (s, lv) => svcCost(s, getR(), lv);
  // Precio de un servicio en un nivel: el automático (horas × costo/h × multiplicador × complejidad) o, si se fijó uno, ese.
  const priceAt = (s, lv) => (isCeo && getR() && !s.price_fixed && !(s.price && !s.prices) ? svcAuto(s, getR(), lv) : null) ?? svcPrice(s, lv);
  const suggested = (s, lv = s.level || 5) => (isCeo && getR() ? svcAuto(s, getR(), lv) : null);
  // La tarjeta del catálogo en un nivel: precio, horas, días y qué incluye (cambia con el slider de afuera).
  const cardBody = (s, lv) => { const p = priceAt(s, lv), d = daysAt(s, lv), inc = includesAt(s, lv);
    return html`<div class="row sm"><b style="font-weight:500">${lvName(lv)} · ${lv}</b><span class="mut">&nbsp;· ${svcHours(s, lv)} h${d ? ` · ${d} días` : ''}</span><div class="sp"></div><b style="font-size:22px;font-weight:500;letter-spacing:-.5px">${p ? Q(p) : '—'}</b></div>
      ${inc.length ? html`<ul class="svinc">${inc.map((x) => html`<li>${x}</li>`)}</ul>` : ''}
      ${(() => { const c = costOf(s, lv); if (!c) return ''; const mg = p && !c.miss.length ? Math.round((1 - c.cost / p) * 100) : null; return html`<div class="mut sm" style="margin-top:8px;border-top:1px solid var(--line);padding-top:8px">${ico('lock', 13)} Costo ${c.miss.length ? 'incompleto' : Q(c.cost)}${mg != null ? ` · Margen ${mg}%` : ''}</div>`; })()}`; };

  // ---------- la pestaña ----------
  // Buscador del catálogo: filtra las tarjetas mientras escribes (sin redibujar, así no pierdes el cursor).
  const filterSv = (body) => { const q = norm(svQ).trim().split(/\s+/).filter(Boolean); let n = 0; $$('.svcard[data-q]', body).forEach((c) => { const ok = q.every((w) => c.dataset.q.includes(w)); c.style.display = ok ? '' : 'none'; if (ok) n++; }); const e = $('#svnone', body); if (e) e.style.display = n || !q.length ? 'none' : ''; };
  function cat(body) {
    const services = getS(), rates = getR();
    const cats = ['Todos', ...new Set([...CATS, ...services.map((s) => s.category).filter(Boolean)])];
    const list = services.filter((s) => catF === 'Todos' || s.category === catF);
    mount(body, html`
      ${levels ? html`<div class="sec-title" style="margin-top:0"><h2>Niveles</h2><span class="mut sm">El precio se arma por volumen y complejidad · el alcance exacto se define en cada propuesta</span></div>
        <div class="grid g3" style="margin-bottom:8px">${LEVELS.map((l, i) => html`<div class="card feat ${['olive', 'terra', 'ink'][i]}" style="min-height:170px"><div class="lbl">${l.name}</div><div style="font-size:15px;margin-top:8px">${l.tag}</div><div class="foot"><span>${l.how}</span></div></div>`)}</div>` : ''}
      <div class="sec-title" ${levels ? '' : raw('style="margin-top:0"')}><h2>Servicios</h2><span class="mut sm">Mueve el nivel de entrega de cada uno para ver su precio y lo que incluye</span></div>
      <input class="in" type="search" id="svq" placeholder="Buscar servicio: nombre, categoría o lo que incluye" value="${svQ}" style="margin-bottom:12px">
      <div class="row" style="margin-bottom:14px;gap:8px;flex-wrap:wrap">${cats.map((c) => html`<button class="chip ${catF === c ? 'dark' : ''}" data-act="catF" data-c="${c}" style="padding:8px 14px;font-size:13px">${c}</button>`)}</div>
      ${isCeo && rates && (rates.roles || []).some((r) => r.rate == null) ? html`<div class="warnbox" style="margin-bottom:14px">${ico('alert')} Faltan costos por hora de: ${(rates.roles || []).filter((r) => r.rate == null).map((r) => r.role).join(', ')}. Sin eso no hay costo ni precio sugerido.</div>` : ''}
      ${!services.length ? html`<div class="empty"><b>Todavía no hay servicios</b>Crea uno con «+ Nuevo servicio», o carga ejemplos para editarlos.<div style="margin-top:14px"><button class="btn ghost" data-act="seed">Cargar 9 ejemplos para editar</button></div></div>`
      : html`<div class="grid g3">${list.map((s) => { const lv = cardLv[s.id] || s.level || 5, g = growthText({ type: s.growth_type, pct: s.growth_pct }); return html`<div class="card svcard" style="cursor:pointer" data-act="service" data-id="${s.id}" data-q="${norm([s.name, s.category, s.description, s.includes5, s.includes10].join(' '))}">
        <div class="row"><span class="chip ${CATC[s.category] ?? ''}">${s.category || 'Sin categoría'}</span><div class="sp"></div><span class="mut sm">${s.unit || 'proyecto'}${s.price_fixed ? ' · precio fijo' : ''}</span></div>
        <h3 style="font-size:19px;font-weight:500;letter-spacing:-.4px;margin:12px 0 4px">${s.name}</h3><div class="mut sm">${s.description || ''}</div>
        ${g ? html`<div class="sm svgrow">${ico('trend', 14)} + ${g}</div>` : ''}
        ${flag(s)}
        <div class="svlv" data-stop><input type="range" min="3" max="10" step="1" value="${lv}" data-cardlv="${s.id}" aria-label="Nivel de entrega"><div class="row mut" style="font-size:11px"><span>3 · básico</span><div class="sp"></div><span>10 · fuerte</span></div></div>
        <div data-cardbody="${s.id}">${cardBody(s, lv)}</div>
        ${sopOf(s) ? html`<a class="sm" data-stop href="#/library/${sopOf(s).folder_id || '_'}/${sopOf(s).id}" style="display:inline-block;margin-top:10px;color:#87684e;font-weight:500">${ico('doc', 15)} Ver el SOP de este servicio ${ico('right', 14)}</a>` : ''}
</div>`; })}</div><div class="empty" id="svnone" style="display:none"><b>No encontré servicios</b>Prueba con otra palabra.</div>`}`);
    const sq = $('#svq', body); if (sq) { sq.addEventListener('input', () => { svQ = sq.value; filterSv(body); }); filterSv(body); }
  }

  // ---------- editar un servicio ----------
  async function editService(s, after) {
    const rates = getR();
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
          try { const r = s ? await S.save(doc) : await S.create(doc); const list = getS(); setS(s ? list.map((x) => (x.id === r.id ? r : x)) : [...list, r]); toast('Guardado'); closeDrawer(); after ? after(r) : paint(); }
          catch (e) { toast(e.message, true); }
        },
        delSvc: async () => { if (!(await confirmAsk(`¿Eliminar ${s.name}?`))) return; await S.remove(s.id); setS(getS().filter((x) => x.id !== s.id)); closeDrawer(); paint(); },
      });
      $$('[data-f]', $('#drawer')).forEach((inp) => inp.addEventListener('change', () => { sync(); draw(); }));
      $$('#sf [name=includes5], #sf [name=includes10], #sf [name=days5], #sf [name=days10]').forEach((x) => x.addEventListener('input', () => mount($('#svprev'), prev({ ...(s || {}), ...curForm() }))));
      $('#svlv').addEventListener('input', (e) => { sync(); level = +e.target.value; const y = $('#drawer').scrollTop; draw(); $('#drawer').scrollTop = y; });
    };
    const sync = () => $$('[data-f]', $('#drawer')).forEach((inp) => { tasks[+inp.dataset.i][inp.dataset.f] = inp.dataset.f === 'role' ? inp.value : +inp.value; });
    draw();
  }

  // ---------- costos por hora (solo CEO) ----------
  async function editRates() {
    const rates = getR();
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
        try { const nr = rates ? await R.save({ ...rates, roles: clean, margin }) : await R.create({ id: 'default', roles: clean, margin }); setR(nr);
          // Los precios automáticos se recalculan con los costos nuevos (los de precio fijo no se tocan).
          let n = 0;
          for (const sv of getS()) { if (sv.price_fixed || (sv.price && !sv.prices)) continue; const prices = pricesOf(sv, nr); if (JSON.stringify(prices) === JSON.stringify(sv.prices || null)) continue;
            try { const r = await S.save({ ...sv, prices, price: prices?.[sv.level || 5] ?? sv.price }); setS(getS().map((x) => (x.id === r.id ? r : x))); n++; } catch {} }
          toast(`Costos guardados${n ? ` · ${n} precio${n === 1 ? '' : 's'} recalculado${n === 1 ? '' : 's'}` : ''}`); closeDrawer(); paint(); }
        catch (e) { toast(e.message, true); }
      },
    });
    const sync = () => $$('[data-f]', $('#drawer')).forEach((inp) => { roles[+inp.dataset.i][inp.dataset.f] = inp.dataset.f === 'role' ? inp.value : inp.value === '' ? null : +inp.value; });
    draw();
  }

  // ---------- ejemplos para arrancar ----------
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
    const list = [...getS()];
    for (const [category, name, description, t] of EX) list.push(await S.create({ category, name, description, unit: 'proyecto', markup: 2.2, price: null, example: true, tasks: t.map(([role, hours]) => ({ role, hours })) }));
    setS(list); toast('9 ejemplos cargados. Ajusta horas y precios'); paint();
  }

  // Las acciones de la pestaña (para el `acts` de la pantalla) y el nivel de entrega desde afuera (el slider de cada tarjeta).
  const actions = {
    catF: (b) => { catF = b.dataset.c; paint(); },
    newService: () => editService(null), rates: editRates, seed,
    service: (b, e) => { if (e?.target.closest('[data-stop]')) return; editService(getS().find((s) => s.id === b.dataset.id)); },
  };
  function bind(el) {
    el.addEventListener('input', (e) => { const r = e.target.closest?.('[data-cardlv]'); if (!r) return; const sv = getS().find((x) => x.id === r.dataset.cardlv); if (!sv) return;
      cardLv[sv.id] = +r.value; const box = el.querySelector(`[data-cardbody="${sv.id}"]`); if (box) mount(box, cardBody(sv, +r.value)); });
  }
  return { cat, editService, editRates, seed, actions, bind, priceAt, costOf, cardBody };
}
