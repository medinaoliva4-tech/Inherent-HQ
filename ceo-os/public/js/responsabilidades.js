// Servicios → Responsabilidades: el pipeline programable. Una tabla por paquete o servicio donde cada fila es una
// responsabilidad: qué, rol responsable, rol revisor, cuándo, horas, SOP, tipo y de qué depende. Son las recetas de
// public/js/recipes.js (colección `recipes`): al activar un paquete en un cliente, estas filas se vuelven tareas con
// dueño, fecha y SOP. Solo el CEO edita. Los proyectos (ciclo, growth…) y lo recurrente se editan completos en recetas.js.
import { html, raw, mount, col, toast, confirmAsk, ico, $, $$ } from './core.js';
import { recipesWith, isDefaultId, serviceRecipe, bundleRecipe, RECIPE_ROLES, TASK_TIPOS, repeatText } from './recipes.js';
import { isLink } from './tasktype.js';
import { recetasPanel } from './recetas.js';

const RC = col('recipes');
const clone = (o) => JSON.parse(JSON.stringify(o));
const roleLabel = (k) => RECIPE_ROLES.find(([x]) => x === k)?.[1] || k || '—';

// ---------- ¿Tiene responsables? ----------
// Un servicio tiene responsables si tiene su receta (filas con rol) o, al menos, horas por rol en el catálogo (sale una tarea por rol).
export const svcResp = (R, s) => (serviceRecipe(R, s?.id) ? 'receta' : (s?.tasks || []).some((t) => t.role && +t.hours > 0) ? 'roles' : null);
// Un paquete tiene responsables si cada servicio que incluye los tiene (los propios, con horas por rol) y tiene al menos una línea.
export function bundleResp(R, b, services) {
  const lines = b?.lines || [], missing = [];
  for (const l of lines) {
    if (l.type === 'mentor') continue;
    if (l.type === 'custom') { if (!(l.roles || []).some((r) => r.role && +r.hours > 0)) missing.push(l.name || 'Servicio propio'); continue; }
    const s = services.find((x) => x.id === l.service_id); if (!s) { missing.push('Servicio que ya no existe'); continue; }
    if (!svcResp(R, s)) missing.push(s.name);
  }
  // Paquete del conector (sin líneas crudas): se fía de lo que trae.
  if (!lines.length && (b?.servicios || []).length) return { ok: true, missing: [], own: !!bundleRecipe(R, b.id) };
  return { ok: lines.length > 0 && !missing.length, missing, own: !!bundleRecipe(R, b?.id) };
}
export const sinResp = (title = '') => html`<span class="chip red sm2" title="${title || 'Sin responsables: programa quién hace qué en Servicios → Responsabilidades'}">${ico('alert', 11)} Sin responsables</span>`;

// ---------- la pestaña ----------
// ctx: { me, services, bundles, R (recetas en uso), docs (Library), reload() → recarga recetas, onChange() → repinta la pantalla, pick (qué abrir: b:<id> · s:<id> · r:<id>) }
export async function responsabilidadesTab(el, ctx) {
  const { me, services, bundles, docs } = ctx, ceo = me.role === 'ceo';
  let R = ctx.R, rc = null, isNew = false, key = ctx.pick || '';
  const bundleName = (id) => bundles.find((b) => b.id === id)?.name || id;
  const svcName = (id) => services.find((s) => s.id === id)?.name || id;
  const sopDocs = [...(docs || []).filter((d) => d.kind === 'SOP'), ...(docs || []).filter((d) => d.kind !== 'SOP' && d.kind !== 'Prompt')];
  const NEW_ROW = (i) => ({ key: 't' + (Math.max(0, ...(rc?.tasks || []).map((t) => +String(t.key).replace(/\D/g, '') || 0)) + 1 + i), title: '', dept: '', day: rc?.type === 'interna' ? 1 : 3, role: 'content', reviewer: rc?.type === 'interna' ? '' : 'coo', hours: 0, sop: '', tipo: rc?.type === 'interna' ? 'Interna' : 'Delivery', after: [], desc: '' });

  // Qué se puede abrir: paquetes, servicios y, para completar, los proyectos y lo recurrente.
  const options = () => {
    const by = (t) => R.filter((r) => r.type === t);
    return [
      ['Paquetes', bundles.map((b) => ['b:' + b.id, b.name || 'Paquete', !!bundleRecipe(R, b.id)])],
      ['Servicios', services.filter((s) => s.active !== false).map((s) => ['s:' + s.id, s.name, !!serviceRecipe(R, s.id)])],
      ['Proyectos', by('proyecto').map((r) => ['r:' + r.id, r.name, true])],
      ['Responsabilidades recurrentes de Inherent', by('interna').map((r) => ['r:' + r.id, r.name, true])],
    ];
  };
  // La receta que corresponde a lo elegido (o una nueva, vacía, si todavía no existe).
  function pick(k) {
    key = k; isNew = false;
    if (!k) { rc = null; return; }
    const [t, id] = [k.slice(0, 1), k.slice(2)];
    const found = t === 'b' ? R.find((r) => r.type === 'paquete' && r.bundle_id === id) : t === 's' ? R.find((r) => r.type === 'servicio' && r.service_id === id) : R.find((r) => r.id === id);
    if (found) { rc = clone(found); rc.tasks ||= []; return; }
    isNew = true;
    rc = t === 'b' ? { name: `Responsabilidades · ${bundleName(id)}`, type: 'paquete', bundle_id: id, active: true, unit: 'habil', tasks: [] } : { name: `Responsabilidades · ${svcName(id)}`, type: 'servicio', service_id: id, active: true, unit: 'habil', tasks: [] };
    rc.tasks = [NEW_ROW(0)];
  }
  const dayLabel = () => (rc.type === 'interna' ? '' : rc.type === 'proyecto' && rc.unit !== 'habil' ? 'Día del ciclo' : 'Día hábil');
  const dayHint = () => (rc.type === 'interna' ? '' : rc.type === 'proyecto' && rc.unit !== 'habil' ? 'día del ciclo en que vence' : 'días hábiles desde que arranca');

  function row(r, i) {
    const dis = ceo ? '' : raw('disabled'), others = rc.tasks.filter((x, j) => j !== i), link = isLink(r.sop), known = !r.sop || link || sopDocs.some((d) => d.id === r.sop);
    const sel = (f, opts, v, cls = '') => html`<select class="in ${cls}" data-i="${i}" data-f="${f}" ${dis}>${opts.map(([k, l]) => html`<option value="${k}" ${String(k) === String(v ?? '') ? raw('selected') : ''}>${l}</option>`)}</select>`;
    return html`<div class="rr" data-row="${i}">
      <div class="num"><span class="chip sm2">${i + 1}</span></div>
      <div class="full"><div class="lb">Qué</div><input class="in" data-i="${i}" data-f="title" value="${r.title || ''}" placeholder="Qué hay que hacer" ${dis}></div>
      <div><div class="lb">Responsable</div>${sel('role', RECIPE_ROLES, r.role)}</div>
      <div><div class="lb">Revisa</div>${sel('reviewer', [['', '— nadie'], ...RECIPE_ROLES], r.reviewer)}</div>
      <div><div class="lb">${dayLabel() || 'Día'}</div>${rc.type === 'interna' ? html`<span class="mut sm">${repeatText(rc.repeat)}</span>` : html`<input class="in" type="number" min="0" max="365" data-i="${i}" data-f="day" value="${r.day ?? 0}" title="${dayHint()}" ${dis}>`}</div>
      <div><div class="lb">Horas</div><input class="in" type="number" min="0" step="0.5" data-i="${i}" data-f="hours" value="${r.hours || 0}" ${dis}></div>
      <div><div class="lb">SOP</div><select class="in" data-i="${i}" data-f="sop" ${dis}><option value="">— Ninguno</option>${sopDocs.map((d) => html`<option value="${d.id}" ${d.id === r.sop ? raw('selected') : ''}>${d.kind === 'SOP' ? '' : d.kind + ' · '}${d.title}</option>`)}${!known ? html`<option value="${r.sop}" selected>SOP (${r.sop})</option>` : ''}<option value="__link" ${link ? raw('selected') : ''}>Otro: pegar un link…</option></select>
        <input class="in" data-i="${i}" data-f="soplink" placeholder="https://…" value="${link ? r.sop : ''}" style="margin-top:4px" ${link ? '' : raw('hidden')} ${dis}></div>
      <div><div class="lb">Tipo</div>${sel('tipo', TASK_TIPOS.map((t) => [t, t]), r.tipo || 'Delivery')}</div>
      <div><div class="lb">Depende de</div>${others.length ? html`<div class="deps">${r.after?.includes('*') ? html`<span class="chip sm2">todo lo anterior</span>` : ''}${rc.tasks.map((x, j) => (j === i ? '' : html`<button type="button" class="${(r.after || []).includes(x.key) ? 'on' : ''}" data-dep="${x.key}" data-i="${i}" title="${x.title || x.key}" ${dis}>${j + 1}</button>`))}</div>` : html`<span class="mut sm">—</span>`}</div>
      <div class="rm">${ceo ? html`<button class="btn ghost xs" data-rsp="rm" data-i="${i}" title="Quitar">${ico('trash', 14)}</button>` : ''}</div>
    </div>`;
  }
  function paint() {
    const opts = options(), def = rc && isDefaultId(rc.id);
    const all = opts.flatMap(([, l]) => l), cur = all.find(([k]) => k === key);
    mount(el, html`<div class="card" style="padding:22px">
      <div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end">
        <div style="flex:1;min-width:240px"><label class="f">Paquete / Servicio</label><select class="in" id="rspick"><option value="">Elige qué programar…</option>${opts.map(([g, l]) => (l.length ? html`<optgroup label="${g}">${l.map(([k, n, has]) => html`<option value="${k}" ${k === key ? raw('selected') : ''}>${n}${has ? '' : ' · sin responsables'}</option>`)}</optgroup>` : ''))}</select></div>
        ${rc && ceo ? html`<button class="btn" data-rsp="add">${ico('plus', 13)} Responsabilidad</button>` : ''}</div>
      <div class="mut sm" style="margin-top:10px;max-width:720px">Al activar un paquete en un cliente, estas responsabilidades se vuelven tareas con dueño (quien cubre el rol), fecha y SOP, en el orden que marcan las dependencias.${ceo ? '' : ' Solo el CEO las edita.'}</div>
      ${!rc ? html`<div class="empty" style="margin-top:18px"><b>Elige un paquete o un servicio</b>Verás quién hace qué, cuándo y con qué SOP. ${bundles.length || services.length ? '' : 'Primero crea un servicio o un paquete.'}</div>` : html`
        <div class="row" style="margin-top:18px;gap:8px;flex-wrap:wrap"><h3 style="margin:0;font-weight:500">${cur?.[1] || rc.name}</h3><span class="chip sm2">${rc.type === 'paquete' ? 'Paquete' : rc.type === 'servicio' ? 'Servicio' : rc.type === 'interna' ? 'Recurrente' : 'Proyecto'}</span>${isNew ? html`<span class="chip sm2 amber">Nueva · sin guardar</span>` : rc.edited ? html`<span class="chip sm2 dark">${rc.own ? 'Tuya' : 'Editada'}</span>` : html`<span class="chip sm2">De siempre</span>`}<div class="sp"></div>
          ${ceo ? html`<label class="chip rdep"><input type="checkbox" id="rsactive" ${rc.active !== false ? raw('checked') : ''}> Activa</label>` : ''}</div>
        ${rc.type === 'paquete' ? html`<div class="mut sm" style="margin:4px 0 10px">Lo propio del paquete. Cada servicio que incluye suma además sus propias responsabilidades (elígelo arriba para verlas).</div>` : ''}
        <div class="rsp" style="margin-top:12px">
          <div class="rh"><span></span><span>Qué</span><span>Responsable</span><span>Revisa</span><span>${dayLabel() || 'Cuándo'}</span><span>Horas</span><span>SOP</span><span>Tipo</span><span>Depende de</span><span></span></div>
          ${rc.tasks.length ? rc.tasks.map(row) : html`<div class="mut sm" style="padding:10px 4px">Sin responsabilidades todavía.${ceo ? ' Agrega la primera con «+ Responsabilidad».' : ''}</div>`}
        </div>
        ${rc.type === 'interna' ? '' : html`<div class="mut sm" style="margin-top:8px">${dayLabel() === 'Día del ciclo' ? '«Día del ciclo»: el día del mes de contenido en que vence (1 a 20).' : '«Día hábil»: cuántos días hábiles después del arranque vence. 0 = el mismo día.'}</div>`}
        ${ceo ? html`<div class="row" style="margin-top:18px;gap:8px;flex-wrap:wrap"><button class="btn" data-rsp="save">Guardar</button>${def && rc.edited ? html`<button class="btn ghost" data-rsp="reset">Volver a la de siempre</button>` : ''}${!def && !isNew ? html`<button class="btn ghost" data-rsp="del">${ico('trash')} Borrar</button>` : ''}</div>` : ''}`}
      ${ceo ? html`<details class="fold" id="rsmore" style="margin-top:26px;border-top:1px solid var(--line);padding-top:14px"><summary>${ico('right', 13)} Proyectos y recurrentes completos: reuniones, lo que se pide al cliente y checklists</summary><div id="rsrec" style="margin-top:12px"></div></details>` : ''}
    </div>`);
    const more = $('#rsmore', el); if (more) more.addEventListener('toggle', () => { if (more.open && !more.dataset.on) { more.dataset.on = '1'; recetasPanel($('#rsrec', el), { solo: ['proyecto', 'interna'] }); } }, { once: true });
  }
  const redraw = () => { const y = scrollY; paint(); scrollTo(0, y); };

  // Los campos escriben directo en la fila (sin repintar, para no perder el cursor).
  const sync = (e) => {
    const t = e.target;
    if (t.id === 'rspick') { pick(t.value); paint(); return; }
    if (!rc) return;
    if (t.id === 'rsactive') { rc.active = t.checked; return; }
    if (t.dataset.i == null || !t.dataset.f) return;
    const r = rc.tasks[+t.dataset.i], f = t.dataset.f; if (!r) return;
    if (f === 'sop') { const inp = t.parentElement.querySelector('[data-f=soplink]'); inp.hidden = t.value !== '__link'; r.sop = t.value === '__link' ? (isLink(inp.value) ? inp.value.trim() : '') : t.value; if (!inp.hidden) inp.focus(); return; }
    if (f === 'soplink') { r.sop = isLink(t.value.trim()) ? t.value.trim() : ''; return; }
    r[f] = f === 'day' || f === 'hours' ? +t.value || 0 : t.value;
  };
  el.addEventListener('input', sync); el.addEventListener('change', sync);
  el.onclick = async (e) => {
    const d = e.target.closest('[data-dep]'); if (d && ceo && rc) { const r = rc.tasks[+d.dataset.i], k = d.dataset.dep; r.after = (r.after || []).includes(k) ? r.after.filter((x) => x !== k) : [...(r.after || []).filter((x) => x !== '*'), k]; d.classList.toggle('on'); return; }
    if (e.target.id === 'rspick') return;
    const b = e.target.closest('[data-rsp]'); if (!b || !rc) return;
    const a = b.dataset.rsp;
    if (a === 'add') { rc.tasks.push(NEW_ROW(0)); redraw(); setTimeout(() => $$('.rr [data-f=title]', el).at(-1)?.focus(), 0); return; }
    if (a === 'rm') { const i = +b.dataset.i, k = rc.tasks[i].key; rc.tasks.splice(i, 1); rc.tasks.forEach((t) => { t.after = (t.after || []).filter((x) => x !== k); }); redraw(); return; }
    if (a === 'save') {
      if (rc.tasks.some((t) => !String(t.title || '').trim())) return toast('Cada responsabilidad necesita un «qué»', true);
      const body = { ...rc }; delete body.edited; delete body.own; delete body._meta;
      try {
        if (isNew || !rc.edited) { if (!isNew) body.id = rc.id; await RC.create(body); } else await RC.save({ ...body, id: rc.id, v: rc.v });
        toast('Responsabilidades guardadas'); R = await ctx.reload(); pick(key); paint(); ctx.onChange?.();
      } catch (err) { toast(err.message, true); if (/cambió|Recarga|Alguien/i.test(err.message)) { R = await ctx.reload(); pick(key); paint(); } }
      return;
    }
    if (a === 'reset') { if (!(await confirmAsk(`¿Volver «${rc.name}» a la receta de siempre? Se pierden tus cambios.`))) return; try { await RC.remove(rc.id); toast('Vuelve a la de siempre'); R = await ctx.reload(); pick(key); paint(); ctx.onChange?.(); } catch (err) { toast(err.message, true); } return; }
    if (a === 'del') { if (!(await confirmAsk(`¿Borrar las responsabilidades de «${rc.name}»? Las tareas que ya salieron no se tocan.`))) return; try { await RC.remove(rc.id); toast('Borradas'); R = await ctx.reload(); pick(key); paint(); ctx.onChange?.(); } catch (err) { toast(err.message, true); } return; }
  };
  pick(key); paint();
}
