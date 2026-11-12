// Servicios → Paquetes: arriba los 3 niveles (editables por el CEO con el lápiz: settings «levels»; el baseline solo lo ve el CEO); cada nivel abre sus
// paquetes (colección `bundles`, campo `level`); abajo «Otros paquetes» (sin nivel). Un paquete se arma con el editor
// de armados.js, se cotiza y se activa en un cliente (flow.activate → proyecto con tareas, dueños, fechas y SOP).
import { html, raw, mount, api, ask, toast, Q, ico, today, canEdit, col, sheetForm, fromLink, $ } from './core.js';
import { LEVELS, BASELINE, levelOf, applyLevels, levelDefaults, LEVELS_ID, USD_GTQ } from './levels.js';
import { bundleResp, sinResp } from './responsabilidades.js';
import { vacio } from './visual.js';

const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');

// ctx: { me, services, bundles, R, bun (createBundles, solo CEO), onQuote, onChange, sel (nivel abierto), setSel }
export function paquetesTab(el, ctx) {
  const { me, services, bundles, R, bun } = ctx, ceo = me.role === 'ceo', canAct = canEdit(me, 'operations') && me.areas.includes('operations');
  const meta = +ctx.meta || 80; // la meta de margen por producto (Finanzas › reparto.margen; manual: 80%)
  // El nivel de un paquete: su id («growth») o, si viene de datos viejos, el nombre que se traduce con levelOf.
  const lvOf = (b) => { const v = b.level || b.nivel || ''; return (LEVELS.find((l) => l.id === v) || levelOf(v))?.id || ''; };
  const ofLevel = (id) => bundles.filter((b) => lvOf(b) === id);
  const industrias = [...new Set(bundles.filter((b) => !lvOf(b) && b.industry).map((b) => b.industry))].sort();
  const medida = bundles.filter((b) => !lvOf(b) && !b.industry);
  // La colección abierta (como en Shopify): «lv:growth», «ind:Food & Beverage» o «otros».
  const S = ctx.state || (ctx.state = {});
  if (!S.col) S.col = ctx.sel ? `lv:${ctx.sel}` : (LEVELS.find((l) => ofLevel(l.id).length) ? `lv:${LEVELS.find((l) => ofLevel(l.id).length).id}` : industrias[0] ? `ind:${industrias[0]}` : 'otros');
  S.q ??= ''; S.orden ??= 'margen'; S.vista ??= 'tarjetas';
  const enCol = (b) => (S.col.startsWith('lv:') ? lvOf(b) === S.col.slice(3) : S.col.startsWith('ind:') ? !lvOf(b) && b.industry === S.col.slice(4) : !lvOf(b) && !b.industry);
  const tot = (b) => (bun ? bun.totals(b) : null);
  const IND_IC = (n) => (/food|bebid|restaur/i.test(n) ? 'cake' : /retail|commerce|tienda/i.test(n) ? 'tag' : /distrib|mayore/i.test(n) ? 'layers' : /salud|health|medic/i.test(n) ? 'smile' : /hotel|turis/i.test(n) ? 'home' : 'puzzle');
  const TONOS = ['#a8503a', '#3f6ea8', '#7a5aa0', '#2f7a4d', '#9a7414', '#6b513c'];
  const tonoInd = (n) => TONOS[Math.abs([...String(n)].reduce((a, c) => a + c.charCodeAt(0), 0)) % TONOS.length];
  const LV_IC = { foundation: ['layers', '#9a7414'], growth: ['bolt', '#2f7a4d'], partnership: ['users', '#6b513c'] };
  const icoDe = (b) => (lvOf(b) ? LV_IC[lvOf(b)] || ['puzzle', '#6b513c'] : b.industry ? [IND_IC(b.industry), tonoInd(b.industry)] : ['puzzle', '#8a7563']);
  const mgTono = (mg) => (mg == null ? '' : mg >= meta ? 'ok' : mg >= meta - 20 ? 'am' : 'bad');
  const lineas = (b) => (b.lines ? (tot(b)?.ls || []).map((x) => x.name) : (b.servicios || []).map((x) => x.nombre));

  function lista() {
    const q = S.q.toLowerCase();
    let l = bundles.filter(enCol).filter((b) => !q || [b.name, b.desc, b.industry, ...lineas(b)].join(' ').toLowerCase().includes(q));
    const k = { margen: (b) => -(tot(b)?.mg ?? -999), precio: (b) => -(tot(b)?.price || 0), nombre: (b) => String(b.name || '').toLowerCase() }[S.orden];
    return l.sort((a, z) => (k(a) < k(z) ? -1 : k(a) > k(z) ? 1 : 0));
  }
  function card(b) {
    const t = tot(b), resp = bundleResp(R, b, services), ls = lineas(b), [ic, c] = icoDe(b);
    return html`<button type="button" class="sc-card ${S.sel === b.id ? 'on' : ''}" data-act="bver" data-id="${b.id}">
      <div class="sc-t"><span class="sc-ic" style="background:${c}1c;color:${c}">${ico(ic, 16)}</span><span><b>${b.name || 'Paquete'}</b>${b.desc ? html`<small>${String(b.desc).slice(0, 70)}</small>` : ''}</span></div>
      ${ls.length ? html`<ul>${ls.slice(0, 3).map((x) => html`<li>${x}</li>`)}</ul>` : html`<small class="mut">Todavía no tiene servicios.</small>`}
      <small class="${resp.ok ? 'mut' : 'sc-warn'}">${resp.ok ? '' : html`${ico('alert', 11)} Sin responsables · `}${ls.length > 3 ? `+${ls.length - 3} servicio${ls.length - 3 === 1 ? '' : 's'} más` : ''}${t?.hours ? `${ls.length > 3 || !resp.ok ? ' · ' : ''}${t.hours} h` : ''}</small>
      <div class="sc-f"><b>${t?.price ? Q(t.price) : '—'}</b>${t?.mg != null ? html`<span class="sc-mg ${mgTono(t.mg)}">${t.mg}% margen</span>` : ''}</div></button>`;
  }
  function fila(b) {
    const t = tot(b), [ic, c] = icoDe(b);
    return html`<tr class="click" data-act="bver" data-id="${b.id}"><td><span class="sc-ic sm" style="background:${c}1c;color:${c}">${ico(ic, 13)}</span> <b style="font-weight:500">${b.name}</b></td><td class="sm">${lineas(b).length} servicios</td><td class="n">${t?.hours ? `${t.hours} h` : '—'}</td><td class="n"><b>${t?.price ? Q(t.price) : '—'}</b></td><td class="n">${t?.mg != null ? html`<span class="sc-mg ${mgTono(t.mg)}">${t.mg}%</span>` : '—'}</td></tr>`;
  }
  function detalle(b) {
    if (!b) return html`<div class="sc-det sc-det-vacio"><span class="mut">Toca un paquete para ver qué incluye, cuánto deja y quién lo hace.</span></div>`;
    const t = tot(b), resp = bundleResp(R, b, services), [ic, c] = icoDe(b);
    const fuera = String(b.excludes || b.fuera || '').split('\n').map((x) => x.trim()).filter(Boolean);
    const roles = [...new Set((t?.ls || []).flatMap((x) => (x.roles || []).map((r) => r.role || r.name || r)).filter((x) => typeof x === 'string' && x))];
    const falta = t && t.mg != null && t.mg < meta && t.cost ? Math.ceil(t.cost / (1 - meta / 100) / 50) * 50 : null;
    return html`<div class="sc-det"><span class="lbl">${lvOf(b) ? LEVELS.find((l) => l.id === lvOf(b)).name : b.industry || 'A la medida'}</span>
      <h3><span class="sc-ic" style="background:${c}1c;color:${c}">${ico(ic, 16)}</span>${b.name}</h3>${b.desc ? html`<p class="mut sm" style="margin:0">${b.desc}</p>` : ''}
      ${t ? html`<div class="sc-kv"><div><small>Precio</small><b>${t.price ? Q(t.price) : '—'}</b></div><div><small>${ico('lock', 10)} Costo</small><b>${t.cost ? Q(t.cost) : '—'}</b></div><div><small>Margen</small><b class="${mgTono(t.mg)}">${t.mg != null ? t.mg + '%' : '—'}</b></div><div><small>Horas</small><b>${t.hours ? t.hours + ' h' : '—'}</b></div></div>
        ${falta ? html`<p class="sc-tip">Meta: ${meta}% de margen. Para llegar: subir a ${Q(falta)} o cambiar la mezcla (más derivados, contenido crudo del cliente).</p>` : t.mg != null && t.mg >= meta ? html`<p class="sc-tip ok">Llega a la meta de ${meta}% de margen.</p>` : ''}` : ''}
      <span class="lbl">Lo que incluye · ${lineas(b).length} servicio${lineas(b).length === 1 ? '' : 's'}</span>
      <div class="sc-mods">${t ? t.ls.map((x) => html`<div><span>${x.name}<small> · ${x.sub || ''}</small></span><b>${x.price ? Q(x.price) : '—'}</b></div>`) : lineas(b).map((x) => html`<div><span>${x}</span></div>`)}</div>
      ${fuera.length ? html`<p class="mut sm" style="margin:0"><b style="font-weight:500">Queda fuera:</b> ${fuera.join(' · ')}</p>` : ''}
      <span class="lbl">Quién lo hace</span>${roles.length ? html`<div class="sc-who">${roles.map((r) => html`<span>${r}</span>`)}</div>` : ''}${resp.ok ? '' : sinResp(resp.missing.length ? 'Sin responsables: ' + resp.missing.join(', ') : 'Sin servicios: agrega al menos uno')}
      <div class="row" style="gap:6px;flex-wrap:wrap">${canAct ? html`<button class="btn xs" data-act="activate" data-id="${b.id}">Activar en un cliente</button>` : ''}${ceo && bun ? html`<button class="btn ghost xs" data-act="bquote" data-id="${b.id}">Cotizar</button><button class="btn ghost xs" data-act="bedit" data-id="${b.id}">${ico('edit', 12)} Editar</button>` : ''}<a class="btn ghost xs" href="#/services/responsabilidades/b:${b.id}">Responsabilidades ${ico('right', 12)}</a></div></div>`;
  }
  function paint() {
    const l = lista(), sel = bundles.find((b) => b.id === S.sel && enCol(b)) || null;
    const item = (k, label, n, ic, c, extra = '') => html`<button type="button" class="sc-v ${S.col === k ? 'on' : ''}" data-act="bcol" data-k="${k}"><i style="background:${c}1c;color:${c}">${ico(ic, 12)}</i><span>${label}</span><small>${n}</small>${extra}</button>`;
    const lvSel = S.col.startsWith('lv:') ? LEVELS.find((x) => x.id === S.col.slice(3)) : null, bl = lvSel && BASELINE[lvSel.id];
    mount(el, html`<div class="sc">
      <aside class="sc-side"><span class="sc-h">Niveles</span>${LEVELS.map((x) => item(`lv:${x.id}`, x.name, ofLevel(x.id).length, ...(LV_IC[x.id] || ['puzzle', '#6b513c'])))}
        ${industrias.length ? html`<span class="sc-h">Por industria</span>${industrias.map((n) => item(`ind:${n}`, n, bundles.filter((b) => !lvOf(b) && b.industry === n).length, IND_IC(n), tonoInd(n)))}` : ''}
        ${medida.length ? item('otros', 'A la medida', medida.length, 'puzzle', '#8a7563') : ''}
        <span class="sc-h">Lo que lo compone</span><a class="sc-v" href="#/services/servicios"><i style="background:#6b513c1c;color:#6b513c">${ico('list', 12)}</i><span>Catálogo de servicios</span><small>${services.length}</small></a><a class="sc-v" href="#/services/especialistas"><i style="background:#9a74141c;color:#9a7414">${ico('star', 12)}</i><span>Especialistas</span></a><a class="sc-v" href="#/services/responsabilidades"><i style="background:#7a5aa01c;color:#7a5aa0">${ico('repeat', 12)}</i><span>Responsabilidades</span></a></aside>
      <main class="sc-main">
        ${lvSel ? html`<div class="sc-lv"><div><b>${lvSel.name}</b> <span class="mut sm">«${lvSel.tag}» · ${lvSel.how}</span>${ceo && bl ? html` <span class="mut sm">· ${ico('lock', 10)} baseline ${usd(bl.usd)} ${bl.per}</span>` : ''}</div>${ceo ? html`<button class="btn ghost xs" data-act="lvedit" data-id="${lvSel.id}">${ico('edit', 12)} Editar nivel</button>` : ''}</div>` : ''}
        <div class="row sc-bar"><input class="in" id="scq" placeholder="Buscar paquete o servicio…" value="${S.q}"><div class="tabs mini" style="margin:0">${[['tarjetas', 'Tarjetas'], ['lista', 'Lista']].map(([k, t]) => html`<button class="${S.vista === k ? 'on' : ''}" data-act="bvista" data-k="${k}">${t}</button>`)}</div>${bun ? html`<div class="tabs mini" style="margin:0">${[['margen', 'Margen'], ['precio', 'Precio'], ['nombre', 'Nombre']].map(([k, t]) => html`<button class="${S.orden === k ? 'on' : ''}" data-act="borden" data-k="${k}">${t}</button>`)}</div>` : ''}${ceo && bun ? html`<button class="btn xs" data-act="bnew" data-level="${S.col.startsWith('lv:') ? S.col.slice(3) : ''}">+ Paquete</button>` : ''}</div>
        ${!l.length ? html`${vacio({ icono: 'inbox', titulo: 'Sin paquetes aquí', linea: `${ceo ? 'Arma el primero con «+ Paquete»: nombre, servicios del catálogo, qué queda fuera y el precio.' : 'El CEO los arma aquí.'}` })}`
          : S.vista === 'lista' ? html`<div class="card tscroll"><table><thead><tr><th>Paquete</th><th>Incluye</th><th class="n">Horas</th><th class="n">Precio</th><th class="n">Margen</th></tr></thead><tbody>${l.map(fila)}</tbody></table></div>`
          : html`<div class="sc-grid">${l.map(card)}</div>`}</main>
      <aside class="sc-right">${detalle(sel)}</aside></div>`);
    const qi = $('#scq', el); if (qi) qi.oninput = () => { S.q = qi.value; const pos = qi.selectionStart; paint(); const n = $('#scq', el); n.focus(); n.setSelectionRange(pos, pos); };
  }
  paint();

  el.onclick = async (e) => {
    const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
    if (a === 'lvedit') { e.stopPropagation(); await editLevel(t.dataset.id); return; }
    if (a === 'bcol') { S.col = t.dataset.k; S.sel = null; return paint(); }
    if (a === 'bver') { S.sel = t.dataset.id; return paint(); }
    if (a === 'bvista') { S.vista = t.dataset.k; return paint(); }
    if (a === 'borden') { S.orden = t.dataset.k; return paint(); }
    if (a === 'bnew' && bun) { bun.edit({ level: t.dataset.level || '' }, () => ctx.onChange()); return; }
    if (a === 'bedit' && bun) { bun.edit(bundles.find((x) => x.id === t.dataset.id), () => ctx.onChange()); return; }
    if (a === 'bquote' && bun) { const b = bundles.find((x) => x.id === t.dataset.id); if (!bun.totals(b).ls.some((x) => x.ok)) return toast('El paquete necesita al menos un servicio con precio', true); bun.quote(b); return; }
    if (a === 'activate') { await activate(bundles.find((x) => x.id === t.dataset.id)); }
  };

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
