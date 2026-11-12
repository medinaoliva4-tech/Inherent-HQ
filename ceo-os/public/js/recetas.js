// Recetas: cómo se arma el trabajo, editable por el CEO. Es la pantalla de public/js/recipes.js. Vive en Servicios → Responsabilidades
// (plegada, para proyectos y recurrentes); la tabla por paquete o servicio está en responsabilidades.js.
//   · Proyectos: Ciclo mensual, Business Growth, Proyecto y Custom (tareas, reuniones, lo que se pide al cliente)
//   · Servicios: las tareas de un servicio del catálogo; al activar un paquete o una cotización salen de aquí
//   · Recurrentes: las responsabilidades de Inherent (semanal, mensual, fecha fija) que dejan su tarea Interna con SOP y fecha
// Lo que no se edita sigue como siempre (las recetas de siempre son los valores por defecto).
import { html, raw, mount, col, api, toast, confirmAsk, ico, $ } from './core.js';
import { recipesWith, isDefaultId, RECIPE_ROLES, WHO, DOW, MONTHS, repeatText } from './recipes.js';
import { tipoSopFields, bindSop, readTipoSop } from './tasktype.js';

const RC = col('recipes');
// Las recetas en uso (las de siempre + lo que el CEO editó). Sin permiso o sin red, las de siempre.
export const loadRecipes = async () => recipesWith(await RC.list().catch(() => []));

const roleLabel = (k) => RECIPE_ROLES.find(([x]) => x === k)?.[1] || k;
const clone = (o) => JSON.parse(JSON.stringify(o));
const setP = (o, path, v) => { const k = path.split('.'); let t = o; for (let i = 0; i < k.length - 1; i++) t = t[k[i]]; t[k.at(-1)] = v; };
const getP = (o, path) => path.split('.').reduce((t, k) => t?.[k], o);
const ROW = (rc, i) => ({ key: 't' + (Math.max(0, ...(rc.tasks || []).map((t) => +String(t.key).replace(/\D/g, '') || 0)) + 1 + i), title: '', dept: '', day: rc.type === 'servicio' ? 3 : 1, role: 'content', reviewer: rc.type === 'interna' ? '' : 'coo', hours: 0, sop: '', tipo: rc.type === 'interna' ? 'Interna' : 'Delivery', after: [], desc: '' });
const TYPE_NAME = { proyecto: 'Proyecto', servicio: 'Servicio', interna: 'Recurrente' };

// `solo`: qué secciones mostrar (proyecto · servicio · interna). Servicios → Responsabilidades monta solo proyectos y recurrentes.
export async function recetasPanel(el, { solo = ['proyecto', 'servicio', 'interna'] } = {}) {
  const show = (t) => solo.includes(t);
  mount(el, html`<p class="loading">Cargando recetas…</p>`);
  let [docs, services, library] = await Promise.all([RC.list().catch(() => []), col('services').list().catch(() => []), col('docs').list().catch(() => [])]);
  let R = recipesWith(docs), rc = null, isNew = false;
  const svcName = (id) => services.find((s) => s.id === id)?.name || id;
  const reload = async () => { docs = await RC.list().catch(() => docs); R = recipesWith(docs); };

  // ---------- la lista ----------
  const row = (r) => html`<div class="row rcrow" data-rc="open" data-id="${r.id}" style="gap:10px;padding:13px 4px;border-top:1px solid var(--line);cursor:pointer;flex-wrap:wrap">
    <div style="flex:1;min-width:200px"><b style="font-weight:500">${r.name}</b><div class="mut sm">${r.type === 'servicio' ? `Servicio: ${svcName(r.service_id)} · ` : r.type === 'interna' ? `${repeatText(r.repeat)} · ` : ''}${(r.tasks || []).length} ${(r.tasks || []).length === 1 ? 'tarea' : 'tareas'}${(r.meetings || []).length ? ` · ${r.meetings.length} reuniones` : ''}</div></div>
    ${r.type === 'interna' ? html`<span class="chip ${r.active !== false ? 'green' : ''}">${r.active !== false ? 'Encendida' : 'Apagada'}</span>` : r.active === false ? html`<span class="chip">Apagada</span>` : ''}
    <span class="chip ${r.edited ? 'dark' : ''}">${r.edited ? (r.own ? 'Tuya' : 'Editada') : 'De siempre'}</span><span class="mut">${ico('right', 14)}</span></div>`;
  function list() {
    const by = (t) => R.filter((r) => r.type === t);
    mount(el, html`<div class="card" style="padding:22px">
      <div class="row" style="flex-wrap:wrap;gap:10px"><div style="flex:1;min-width:240px"><h3 style="margin:0 0 4px">Recetas</h3><div class="mut sm" style="max-width:640px">Así se arma el trabajo: qué tareas salen, de quién, para cuándo, con qué SOP y en qué orden. Si no editas nada, todo sigue como siempre. Al activar un paquete o un plan, el proyecto sale de estas recetas.${show('servicio') ? '' : ' Las de cada paquete y servicio se programan arriba, en la tabla.'}</div></div>
        <button class="btn ghost" data-rc="run" title="Deja creadas las tareas recurrentes que ya toca hacer">${ico('repeat')} Generar lo recurrente</button></div>
      ${show('proyecto') ? html`<div class="sec-title" style="margin-top:20px"><h2>Proyectos</h2></div>${by('proyecto').map(row)}` : ''}
      ${show('servicio') ? html`<div class="row" style="margin-top:22px"><div class="sec-title" style="margin:0"><h2>Servicios</h2></div><div class="sp"></div><button class="btn ghost xs" data-rc="new" data-t="servicio">${ico('plus', 13)} Receta de un servicio</button></div>
      <div class="mut sm" style="margin:4px 0 6px">Cuando un paquete o una cotización lleva este servicio, sus tareas salen de aquí. Sin receta, sale una tarea por rol, con las horas del catálogo.</div>
      ${by('servicio').length ? by('servicio').map(row) : html`<div class="mut sm" style="padding:10px 0;border-top:1px solid var(--line)">Todavía no hay recetas de servicios.</div>`}` : ''}
      ${show('interna') ? html`<div class="row" style="margin-top:22px"><div class="sec-title" style="margin:0"><h2>Responsabilidades recurrentes</h2></div><div class="sp"></div><button class="btn ghost xs" data-rc="new" data-t="interna">${ico('plus', 13)} Nueva responsabilidad</button></div>
      <div class="mut sm" style="margin:4px 0 6px">Tareas Internas que se crean solas con su SOP y su fecha. Vienen apagadas: enciende las que quieras.</div>${by('interna').map(row)}` : ''}
    </div>`);
  }

  // ---------- el editor ----------
  const sel = (path, opts, v) => html`<select class="in" data-p="${path}">${opts.map(([k, l]) => html`<option value="${k}" ${String(k) === String(v) ? raw('selected') : ''}>${l}</option>`)}</select>`;
  const dayHint = (r) => (rc.type === 'interna' ? '' : r.pos === 'fin' ? 'Días hábiles tras la última entrega' : r.pos === 'inicio' ? 'Días hábiles desde el arranque' : rc.unit === 'habil' ? 'Día hábil desde el arranque' : rc.kind === 'Growth' ? 'Día desde el arranque' : 'Día del ciclo en que vence');
  function task(r, i) {
    const others = rc.tasks.filter((x, j) => j !== i);
    return html`<div class="rtask"><div class="row" style="gap:8px;flex-wrap:nowrap"><span class="chip sm2">${i + 1}</span><input class="in" style="min-width:0" data-p="tasks.${i}.title" value="${r.title}" placeholder="Qué hay que hacer"><button class="btn ghost xs" data-rc="rmtask" data-i="${i}" title="Quitar">${ico('trash', 14)}</button></div>
      <div class="rgrid">
        <div><label class="f">Lo hace</label>${sel(`tasks.${i}.role`, RECIPE_ROLES, r.role)}</div>
        <div><label class="f">Lo revisa</label>${sel(`tasks.${i}.reviewer`, [['', '— nadie'], ...RECIPE_ROLES], r.reviewer)}</div>
        ${rc.type === 'interna' ? '' : html`<div><label class="f">${dayHint(r)}</label><input class="in" type="number" min="0" max="365" data-n="1" data-p="tasks.${i}.day" value="${r.day}"></div>`}
        <div><label class="f">Horas</label><input class="in" type="number" min="0" step="0.5" data-n="1" data-p="tasks.${i}.hours" value="${r.hours || 0}"></div></div>
      <div class="form">${tipoSopFields(r, library, 'rt' + i)}</div>
      ${rc.type !== 'interna' && others.length ? html`<div style="margin-top:10px"><label class="f">Depende de (tiene que estar hecho antes)</label><div class="row" style="gap:6px;flex-wrap:wrap">${r.after?.includes('*') ? html`<span class="chip">Todo lo anterior</span>` : ''}${others.map((x) => html`<label class="chip rdep"><input type="checkbox" data-chk="tasks.${i}.after" data-v="${x.key}" ${(r.after || []).includes(x.key) ? raw('checked') : ''}>${(x.title || x.key).slice(0, 30)}</label>`)}</div></div>` : ''}
      <div style="margin-top:10px"><label class="f">Descripción (opcional)</label><textarea class="in" rows="2" data-p="tasks.${i}.desc">${r.desc || ''}</textarea></div></div>`;
  }
  const meeting = (m, i) => html`<div class="rtask"><div class="row" style="gap:8px;flex-wrap:nowrap"><input class="in" style="min-width:0" data-p="meetings.${i}.name" value="${m.name}" placeholder="Nombre de la reunión"><input class="in" style="max-width:96px" type="number" min="1" max="365" data-n="1" data-p="meetings.${i}.day" value="${m.day}" title="Día desde que arranca"><button class="btn ghost xs" data-rc="rmmeet" data-i="${i}">${ico('trash', 14)}</button></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin:10px 0 4px"><span class="mut sm">Quiénes</span>${Object.entries(WHO).map(([k, l]) => html`<label class="chip rdep"><input type="checkbox" data-chk="meetings.${i}.who" data-v="${k}" ${(m.who || []).includes(k) ? raw('checked') : ''}>${l}</label>`)}</div>
    <label class="f">Temas (uno por línea)</label><textarea class="in" rows="3" data-lines="1" data-p="meetings.${i}.topics">${(m.topics || []).join('\n')}</textarea>
    <label class="f" style="margin-top:8px">Qué se aprueba</label><input class="in" data-p="meetings.${i}.approves" value="${m.approves || ''}"></div>`;
  function edit() {
    const own = rc.type, def = isDefaultId(rc.id);
    const freq = rc.repeat?.freq;
    mount(el, html`<div class="card" style="padding:22px">
      <div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn ghost xs" data-rc="back">← Recetas</button><span class="chip">${TYPE_NAME[own]}${rc.kind ? ' · ' + rc.kind : ''}</span><div class="sp"></div>
        <label class="sw-row"><input type="checkbox" class="switch" data-p="active" ${rc.active !== false ? raw('checked') : ''}> ${own === 'interna' ? 'Encendida' : 'Activa'}</label></div>
      <div class="form" style="margin-top:14px">
        <div><label class="f">Nombre</label><input class="in" data-p="name" value="${rc.name || ''}" placeholder="${own === 'interna' ? 'Ej. Revisar gastos sin comprobante' : 'Nombre de la receta'}"></div>
        ${own === 'servicio' ? html`<div><label class="f">Servicio del catálogo</label><select class="in" data-p="service_id" data-svc="1"><option value="">Elige un servicio…</option>${services.filter((s) => s.id === rc.service_id || !R.some((r) => r.type === 'servicio' && r.service_id === s.id)).map((s) => html`<option value="${s.id}" ${s.id === rc.service_id ? raw('selected') : ''}>${s.name}</option>`)}</select><div class="mut sm" style="margin-top:4px">«Día» cuenta días hábiles desde que arranca el proyecto.</div></div>` : ''}
        ${own === 'interna' ? html`<div class="two"><div><label class="f">Frecuencia</label>${sel('repeat.freq', [['semanal', 'Cada semana'], ['mensual', 'Cada mes'], ['anual', 'Cada año']], freq)}</div>
          <div>${freq === 'semanal' ? html`<label class="f">Qué día</label>${sel('repeat.dow', DOW, rc.repeat.dow)}` : freq === 'mensual' ? html`<label class="f">Del día … al día … del mes</label><div class="row" style="gap:8px"><input class="in" type="number" min="1" max="31" data-n="1" data-p="repeat.from" value="${rc.repeat.from}"><input class="in" type="number" min="1" max="31" data-n="1" data-p="repeat.to" value="${rc.repeat.to}"></div>` : html`<label class="f">Fecha</label><div class="row" style="gap:8px"><input class="in" type="number" min="1" max="31" data-n="1" data-p="repeat.day" value="${rc.repeat.day}">${sel('repeat.month', MONTHS.map((m, k) => [k + 1, m]), rc.repeat.month)}</div>`}</div></div>
          <div class="mut sm">${repeatText(rc.repeat)}. Usa «{mes}» en el título para que diga el mes. La tarea aparece 7 días antes y se asigna a quien tiene ese perfil.</div>` : ''}
      </div>
      <div class="sec-title" style="margin-top:22px"><h2>Tareas</h2></div>
      ${rc.tasks.map(task)}
      ${rc.kind === 'Custom' ? html`<div class="mut sm" style="margin-top:8px">Las tareas del proyecto custom salen de la receta de cada servicio. Aquí se edita el arranque y el cierre.</div>` : html`<div style="margin-top:10px"><button class="btn ghost xs" data-rc="addtask">${ico('plus', 13)} Agregar tarea</button></div>`}
      ${own === 'proyecto' ? html`<div class="sec-title" style="margin-top:22px"><h2>Reuniones</h2></div>${rc.meetings.map(meeting)}<div style="margin-top:10px"><button class="btn ghost xs" data-rc="addmeet">${ico('plus', 13)} Agregar reunión</button></div>
        <div class="sec-title" style="margin-top:22px"><h2>Lo que se pide al cliente</h2></div><div class="mut sm" style="margin-bottom:6px">Uno por línea. Es su lista de onboarding; los servicios suman lo suyo.</div><textarea class="in" rows="5" data-lines="1" data-p="ask">${(rc.ask || []).join('\n')}</textarea>` : ''}
      ${rc.checks ? html`<div class="sec-title" style="margin-top:22px"><h2>Checklist del ciclo por perfil</h2></div><div class="mut sm" style="margin-bottom:6px">Lo que cada perfil marca en su Workspace cada mes. Uno por línea.</div>${Object.keys(rc.checks).map((r) => html`<label class="f" style="margin-top:8px">${roleLabel(r)}</label><textarea class="in" rows="4" data-lines="1" data-p="checks.${r}">${(rc.checks[r] || []).join('\n')}</textarea>`)}` : ''}
      <div class="row" style="margin-top:24px;gap:8px;flex-wrap:wrap"><button class="btn" data-rc="save">Guardar</button>${def && rc.edited ? html`<button class="btn ghost" data-rc="reset">Volver a la de siempre</button>` : ''}${!def && !isNew ? html`<button class="btn ghost" data-rc="del">${ico('trash')} Borrar</button>` : ''}</div>
    </div>`);
    for (let i = 0; i < rc.tasks.length; i++) bindSop('rt' + i);
  }
  const redraw = () => { const y = scrollY; edit(); scrollTo(0, y); };

  // Los campos escriben directo en la receta que se edita (sin repintar, para no perder el cursor).
  const sync = (e) => {
    const t = e.target; if (!rc) return;
    const m = /^rt(\d+)(tipo|sop|soplink)$/.exec(t.id || ''); if (m) { const r = readTipoSop('rt' + m[1]); rc.tasks[+m[1]].tipo = r.tipo; rc.tasks[+m[1]].sop = r.sop; return; }
    if (t.dataset.chk) { const a = getP(rc, t.dataset.chk) || []; const v = t.dataset.v; setP(rc, t.dataset.chk, t.checked ? [...new Set([...a, v])] : a.filter((x) => x !== v)); return; }
    if (!t.dataset.p) return;
    let v = t.type === 'checkbox' ? t.checked : t.value;
    if (t.dataset.n) v = +v || 0;
    if (t.dataset.lines) v = v.split('\n').map((x) => x.trim()).filter(Boolean);
    if (t.dataset.p === 'repeat.dow' || t.dataset.p === 'repeat.month') v = +v;
    setP(rc, t.dataset.p, v);
    if (t.dataset.p === 'repeat.freq') { rc.repeat = v === 'semanal' ? { freq: v, dow: 1 } : v === 'mensual' ? { freq: v, from: 1, to: 5 } : { freq: v, month: 1, day: 1 }; redraw(); }
    if (t.dataset.svc && !rc.name) { rc.name = `Receta · ${svcName(v)}`; const n = $('[data-p=name]', el); if (n) n.value = rc.name; }
  };
  el.addEventListener('input', sync); el.addEventListener('change', sync);

  const open = (r) => { rc = clone(r); isNew = false; rc.tasks ||= []; rc.meetings ||= []; rc.ask ||= []; edit(); scrollTo(0, 0); };
  const make = (type) => {
    rc = { name: '', type, active: true, unit: type === 'servicio' ? 'habil' : 'dia', tasks: [], meetings: [], ask: [], ...(type === 'servicio' ? { service_id: '' } : { repeat: { freq: 'semanal', dow: 1 } }) };
    rc.tasks = [ROW(rc, 0)]; isNew = true; edit(); scrollTo(0, 0);
  };
  async function save() {
    for (let i = 0; i < rc.tasks.length; i++) { const r = readTipoSop('rt' + i); rc.tasks[i].tipo = r.tipo; rc.tasks[i].sop = r.sop; }
    const body = { ...rc }; delete body.edited; delete body.own; delete body._meta;
    try {
      if (isNew || !rc.edited) { if (!isNew) body.id = rc.id; await RC.create(body); } else await RC.save({ ...body, id: rc.id, v: rc.v });
      toast('Receta guardada'); await reload(); rc = null; list();
    } catch (e) { toast(e.message, true); if (/cambió|Recarga|Alguien/i.test(e.message)) { await reload(); } }
  }
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-rc]'); if (!b || !el.contains(b)) return;
    const a = b.dataset.rc;
    if (a === 'open') return open(R.find((r) => r.id === b.dataset.id));
    if (a === 'new') return make(b.dataset.t);
    if (a === 'back') { rc = null; return list(); }
    if (a === 'addtask') { rc.tasks.push(ROW(rc, 0)); return redraw(); }
    if (a === 'rmtask') { const i = +b.dataset.i, k = rc.tasks[i].key; rc.tasks.splice(i, 1); rc.tasks.forEach((t) => { t.after = (t.after || []).filter((x) => x !== k); }); return redraw(); }
    if (a === 'addmeet') { rc.meetings.push({ name: '', day: 1, who: ['ceo'], topics: [], approves: '' }); return redraw(); }
    if (a === 'rmmeet') { rc.meetings.splice(+b.dataset.i, 1); return redraw(); }
    if (a === 'save') return save();
    if (a === 'reset') { if (!(await confirmAsk(`¿Volver «${rc.name}» a la receta de siempre? Se pierden tus cambios.`))) return; try { await RC.remove(rc.id); toast('Vuelve a la de siempre'); await reload(); rc = null; list(); } catch (err) { toast(err.message, true); } return; }
    if (a === 'del') { if (!(await confirmAsk(`¿Borrar la receta «${rc.name}»? Las tareas que ya salieron de ella no se tocan.`))) return; try { await RC.remove(rc.id); toast('Receta borrada'); await reload(); rc = null; list(); } catch (err) { toast(err.message, true); } return; }
    if (a === 'run') { try { const r = await api('recipes/run', { method: 'POST', body: {} }); toast(r.creadas ? `${r.creadas} ${r.creadas === 1 ? 'tarea creada' : 'tareas creadas'}` : 'Nada nuevo: ya está todo creado'); } catch (err) { toast(err.message, true); } }
  });
  list();
}
