// Servicios → Paquetes: arriba los 3 niveles (editables por el CEO con el lápiz: settings «levels»; el baseline solo lo ve el CEO); cada nivel abre sus
// paquetes (colección `bundles`, campo `level`); abajo «Otros paquetes» (sin nivel). Un paquete se arma con el editor
// de armados.js, se cotiza y se activa en un cliente (flow.activate → proyecto con tareas, dueños, fechas y SOP).
import { html, raw, mount, api, ask, toast, Q, ico, today, canEdit, col, sheetForm, fromLink } from './core.js';
import { LEVELS, BASELINE, levelOf, applyLevels, levelDefaults, LEVELS_ID, USD_GTQ } from './levels.js';
import { bundleResp, sinResp } from './responsabilidades.js';

const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');

// ctx: { me, services, bundles, R, bun (createBundles, solo CEO), onQuote, onChange, sel (nivel abierto), setSel }
export function paquetesTab(el, ctx) {
  const { me, services, bundles, R, bun } = ctx, ceo = me.role === 'ceo', canAct = canEdit(me, 'operations') && me.areas.includes('operations');
  // El nivel de un paquete: su id («growth») o, si viene de datos viejos, el nombre que se traduce con levelOf.
  const lvOf = (b) => { const v = b.level || b.nivel || ''; return (LEVELS.find((l) => l.id === v) || levelOf(v))?.id || ''; };
  const ofLevel = (id) => bundles.filter((b) => lvOf(b) === id);
  const others = bundles.filter((b) => !lvOf(b));
  const sel = ctx.sel && LEVELS.some((l) => l.id === ctx.sel) ? ctx.sel : (LEVELS.find((l) => ofLevel(l.id).length) || LEVELS[0]).id;
  const level = LEVELS.find((l) => l.id === sel);

  // La tarjeta de un paquete: qué incluye, precio (solo con costos: CEO), responsables y acciones.
  function card(b) {
    const t = bun ? bun.totals(b) : null, resp = bundleResp(R, b, services);
    const lines = b.lines ? (t ? t.ls.map((x) => x.name) : []) : (b.servicios || []).map((s) => s.nombre);
    const fuera = String(b.excludes || b.fuera || '').split('\n').map((x) => x.trim()).filter(Boolean);
    return html`<div class="sp-tile bdl">
      <div class="row" style="gap:6px;flex-wrap:wrap"><span class="chip sm2">${b.industry || (lvOf(b) ? LEVELS.find((l) => l.id === lvOf(b)).name : 'Paquete')}</span>${resp.ok ? (resp.own ? html`<span class="chip sm2 green">Con responsables</span>` : '') : sinResp(resp.missing.length ? 'Sin responsables: ' + resp.missing.join(', ') : 'Sin servicios: agrega al menos uno')}<div class="sp"></div>${ceo ? html`<button class="sm mut" data-act="bedit" data-id="${b.id}" title="Editar">${ico('edit')}</button>` : ''}</div>
      <h3 style="font-size:17px;font-weight:500;margin:8px 0 2px">${b.name || 'Paquete'}</h3>
      ${b.desc ? html`<div class="mut sm">${b.desc}</div>` : ''}
      ${lines.length ? html`<ul class="svinc sm">${lines.slice(0, 6).map((x) => html`<li>${x}</li>`)}${lines.length > 6 ? html`<li class="mut">y ${lines.length - 6} más</li>` : ''}</ul>` : html`<div class="mut sm" style="margin-top:6px">Todavía no tiene servicios.</div>`}
      ${fuera.length ? html`<div class="mut sm" style="margin-top:6px"><b style="font-weight:500">Queda fuera:</b> ${fuera.join(' · ')}</div>` : ''}
      ${t ? html`<div class="row" style="margin-top:10px;gap:8px;align-items:baseline"><b style="font-size:22px;font-weight:500;letter-spacing:-.5px">${t.price ? Q(t.price) : '—'}</b><span class="mut sm">${t.manual ? 'precio manual' : 'suma del catálogo'}${t.hours ? ` · ${t.hours} h` : ''}</span>${t.manual ? '' : fromLink({ label: 'catálogo', href: '#/services/servicios', title: 'El precio es la suma de cada servicio del catálogo en su complejidad' })}<div class="sp"></div><span class="mut sm">${ico('lock', 12)} ${t.cost ? `Costo ${Q(t.cost)}${t.mg != null ? ` · ${t.mg}%` : ''}` : 'sin costo'}</span></div>` : ''}
      <div class="row" style="margin-top:12px;gap:6px;flex-wrap:wrap">
        ${canAct ? html`<button class="btn xs" data-act="activate" data-id="${b.id}">Activar en un cliente</button>` : ''}
        ${ceo && bun ? html`<button class="btn ghost xs" data-act="bquote" data-id="${b.id}">Cotizar</button>` : ''}
        <a class="btn ghost xs" href="#/services/responsabilidades/b:${b.id}">Responsabilidades ${ico('right', 12)}</a></div></div>`;
  }
  const grid = (list) => html`<div class="sp-tiles" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${list.map(card)}</div>`;

  mount(el, html`
    <div class="sec-title" style="margin-top:0"><h2>Niveles</h2><span class="mut sm">Un sistema de tres profundidades · el nivel dice qué tan adentro entramos, no cuántas piezas</span></div>
    <div class="grid g3" style="margin-bottom:8px">${LEVELS.map((l, i) => { const n = ofLevel(l.id).length, bl = BASELINE[l.id]; return html`<div class="sp-cover sm ${['t1', '', 't2'][i]} lvl ${l.id === sel ? 'on' : ''}" data-act="lvl" data-id="${l.id}" role="button" tabindex="0" aria-pressed="${l.id === sel ? 'true' : 'false'}">
      <div class="row"><div class="lbl">${l.name}</div><div class="sp"></div>${l.id === sel ? html`<span class="chip sm2" style="background:rgb(255 255 255 / .16);color:#fdfaf3">Abierto</span>` : ''}${ceo ? html`<button class="lvl-edit" data-act="lvedit" data-id="${l.id}" title="Editar ${l.name}" aria-label="Editar ${l.name}">${ico('edit', 14)}</button>` : ''}</div>
      <div class="tag">«${l.tag}»</div>
      ${ceo && bl ? html`<div class="base">${ico('lock', 11)} Baseline ${usd(bl.usd)} · Q${bl.gtq.toLocaleString('en-US')} ${bl.per}</div>` : ''}
      <div class="foot"><span>${l.how}</span><span>${n ? `${n} paquete${n === 1 ? '' : 's'}` : 'sin paquetes'}</span></div></div>`; })}</div>
    <div class="sec-title"><h2>${level.name}</h2><span class="mut sm">${level.who}</span>${ceo && bun ? html`<a data-act="bnew" data-level="${sel}" style="cursor:pointer">+ Paquete en este nivel</a>` : ''}</div>
    ${ofLevel(sel).length ? grid(ofLevel(sel)) : html`<div class="empty"><b>Sin paquetes en ${level.name}</b>${ceo ? 'Arma el primero: nombre, servicios del catálogo con su complejidad y cantidad, qué queda fuera y el precio.' : 'El CEO los arma aquí.'}</div>`}
    <div class="sec-title"><h2>Otros paquetes</h2><span class="mut sm">Paquetes sin nivel: por industria o a la medida</span>${ceo && bun ? html`<a data-act="bnew" data-level="" style="cursor:pointer">+ Paquete</a>` : ''}</div>
    ${others.length ? grid(others) : html`<div class="empty sm"><b>Sin otros paquetes</b>Los que no caben en un nivel viven aquí.</div>`}`);

  el.onclick = async (e) => {
    const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
    if (a === 'lvedit') { e.stopPropagation(); await editLevel(t.dataset.id); return; }
    if (a === 'lvl') { ctx.setSel(t.dataset.id); return; }
    if (a === 'bnew' && bun) { bun.edit({ level: t.dataset.level || '' }, () => ctx.onChange()); return; }
    if (a === 'bedit' && bun) { bun.edit(bundles.find((x) => x.id === t.dataset.id), () => ctx.onChange()); return; }
    if (a === 'bquote' && bun) { const b = bundles.find((x) => x.id === t.dataset.id); if (!bun.totals(b).ls.some((x) => x.ok)) return toast('El paquete necesita al menos un servicio con precio', true); bun.quote(b); return; }
    if (a === 'activate') { await activate(bundles.find((x) => x.id === t.dataset.id)); }
  };
  el.onkeydown = (e) => { if (e.key === 'Enter' && e.target.dataset?.act === 'lvl') ctx.setSel(e.target.dataset.id); };

  // Editar un nivel (solo el CEO): nombre, frase, descripción, formato, baseline y cómo se cobra. Se guarda en settings
  // «levels» y se aplica en vivo a todo lo que usa el nombre o el baseline del nivel (el quiz público no cambia).
  async function editLevel(id) {
    const l = LEVELS.find((x) => x.id === id), b = BASELINE[id], d0 = levelDefaults(id); if (!l || !ceo) return;
    const v = await sheetForm(`Editar ${l.name}`, [
      { k: 'name', l: 'Nombre', v: l.name, req: true, help: `Por defecto: ${d0.name}` },
      { k: 'tag', l: 'Frase', v: l.tag, help: 'Va entre comillas en la tarjeta' },
      { k: 'who', l: 'Descripción · para quién es', t: 'textarea', v: l.who },
      { k: 'how', l: 'Formato', v: l.how, help: 'Ej. «Proyecto con inicio y cierre.»' },
      { k: 'usd', l: 'Baseline en USD', t: 'number', v: b?.usd, help: `El piso interno desde el que se cotiza. Solo lo ves tú. En quetzales: × ${USD_GTQ}.` },
      { k: 'per', l: 'Cómo se cobra', v: b?.per, help: 'Ej. «por proyecto» o «al mes»' },
    ], { chip: html`${ico('lock', 12)} Solo CEO`, note: 'Cambia el nivel en toda la app: Clientes, Comercial, cotizaciones y paquetes. El diagnóstico público no cambia.' });
    if (!v) return;
    if (v.usd != null && !(v.usd > 0)) return toast('El baseline es un número mayor que cero', true);
    const S = col('settings');
    let cur = null; try { cur = (await S.list()).find((x) => x.id === LEVELS_ID) || null; } catch {}
    const doc = { ...(cur || {}), id: LEVELS_ID, levels: { ...(cur?.levels || {}), [id]: { name: v.name, tag: v.tag, who: v.who, how: v.how, usd: v.usd, per: v.per } } };
    try { const r = cur ? await S.save(doc) : await S.create(doc); applyLevels(r); toast(`${v.name} guardado`); ctx.onLevels?.(); } catch (err) { toast(err.message, true); }
  }

  // Activar: el paquete se vuelve un proyecto del cliente con las tareas de sus responsabilidades (dueño, fecha, SOP, dependencias).
  async function activate(b) {
    if (!b) return;
    const resp = bundleResp(R, b, services);
    if (!resp.ok) { toast(resp.missing.length ? `Sin responsables en: ${resp.missing.join(', ')}. Prográmalos en Responsabilidades.` : 'El paquete no tiene servicios', true); return; }
    let clients = [];
    try { clients = (await api('repo/clients')).clients || []; } catch {}
    const opts = [...clients.map((c) => [c.slug, c.name || c.slug]), ['inherent', 'Inherent (nosotros)']];
    const v = await ask(`Activar «${b.name}» en un cliente`, [
      { k: 'slug', l: 'Cliente', t: 'select', opts, v: opts[0]?.[0] },
      { k: 'start', l: 'Arranca el', t: 'date', v: today(), half: true }, { k: 'name', l: 'Nombre del proyecto (opcional)', v: '', half: true },
    ], 'Activar');
    if (!v) return;
    try {
      const r = await api('flow/activate', { method: 'POST', body: { bundle_id: b.id, slug: v.slug, start: v.start, name: v.name || undefined } });
      const n = (r.tasks || []).length;
      toast(n ? `Listo: ${n} tarea${n === 1 ? '' : 's'} con dueño, fecha y SOP en ${r.projects?.[0]?.name || 'el proyecto'}` : 'Paquete activado');
      if (r.projects?.[0]?.id) location.hash = '/operations';
    } catch (err) { toast(err.message, true); }
  }
}
