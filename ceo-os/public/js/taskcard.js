// El área de entrega de una tarea: qué es, para cuándo, y dónde se entrega (link o archivo a Drive).
// Es el mismo flujo del Workspace: el link o el archivo subido dejan la tarea «En revisión» de quien rinde cuentas.
import { html, raw, mount, col, api, drawer, closeDrawer, toast, fdate, today, $, $$, IC, ico, uploadToDrive, confirmAsk, initials } from './core.js';

const TK = col('tasks');
export const STATES = ['Por empezar', 'En curso', 'En revisión', 'Hecha'];
export const dueChip = (t) => { const d = t.due, st = t.status || 'Por empezar', T = today(); if (!d) return html`<span class="mut sm">Sin fecha</span>`; if (st === 'Hecha') return html`<span class="mut sm">${fdate(d)}</span>`;
  return d < T ? html`<span class="chip red sm2">Atrasada · ${fdate(d)}</span>` : d === T ? html`<span class="chip red sm2">Hoy</span>` : html`<span class="chip sm2">${fdate(d)}</span>`; };
export const stChip = (t) => { const s = t.status || 'Por empezar'; return html`<span class="chip sm2 ${s === 'Hecha' ? 'green' : s === 'En revisión' ? 'amber' : s === 'En curso' ? 'lime' : ''}">${s}</span>`; };

// Abre el panel de entrega. ctx: { me, projects, team, canApprove }. onChange(task) se llama con la tarea guardada (o null si se borró).
export function openDelivery(t, ctx, onChange = () => {}) {
  const { me, projects = [], team = [] } = ctx;
  const proj = projects.find((p) => p.id === t.project_id);
  const who = (k) => team.find((p) => p.id === k || p.email === k)?.name || (k ? String(k).split('@')[0] : '—');
  const mine = t.assignee === me.email, open = (t.status || 'Por empezar') !== 'Hecha';
  const canApprove = ctx.canApprove || me.role === 'ceo' || me.role === 'coo' || (t.accountable && t.accountable === me.email);
  const save = async (patch) => { try { const r = await TK.save({ ...t, ...patch }); t = r; onChange(r); return r; } catch (e) { toast(e.message, true); return null; } };
  const draw = () => drawer(html`<div class="row"><span class="chip">${proj ? proj.client || proj.name : 'Interno'}</span>${t.dept ? html`<span class="chip sm2">${t.dept}</span>` : ''}<div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
    <h2 style="margin-top:12px">${t.title}</h2>
    <div class="row sm" style="gap:8px;margin-top:8px;flex-wrap:wrap">${dueChip(t)}${stChip(t)}<span class="mut">· ${who(t.assignee)}${t.accountable ? ` → revisa ${who(t.accountable).split(' ')[0]}` : ''}</span></div>
    ${t.description ? html`<p class="sm" style="margin-top:12px;white-space:pre-wrap">${t.description}</p>` : ''}
    ${(t.checklist || []).length ? html`<div class="lbl" style="margin-top:14px;color:var(--mut)">Qué incluye</div>${t.checklist.map((c, i) => html`<label class="check"><input type="checkbox" data-act="chk" data-i="${i}" ${c.done ? raw('checked') : ''}> ${c.t}</label>`)}` : ''}
    ${open ? html`<div class="card wkbox wkup" style="margin-top:16px"><div class="wkhead"><div><h3>Entregar</h3><span class="mut sm">Pega el link o sube el archivo: queda en revisión de quien rinde cuentas</span></div></div>
      <div class="row" style="gap:8px"><input class="in" id="dlink" value="${t.link || ''}" placeholder="https://drive.google.com/…" style="flex:1"><button class="btn" data-act="deliver">⇪ Entregar</button></div>
      <div class="wkdrop" id="ddrop" style="margin-top:10px"><b style="font-weight:500">o arrastra tu archivo aquí</b><label class="btn ghost xs" style="cursor:pointer">Seleccionar archivo<input type="file" id="dfile" hidden></label><div class="wkbar" id="dbar" hidden><i style="width:0%"></i></div></div></div>`
      : t.link && /^https?:\/\//.test(t.link) ? html`<a class="artifact" href="${t.link}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin-top:14px"><span class="fi" style="background:#87684e;color:#fdfaf3">${IC.drive}</span><div><b style="font-weight:500">Ver la entrega</b></div></a>` : ''}
    ${(t.files || []).length ? html`<div class="lbl" style="color:var(--mut);margin-top:12px">Archivos</div>${t.files.map((f) => html`<a class="wkrow" href="${/^https:\/\//.test(f.link) ? f.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="fi">${IC.drive}</span><span class="grow">${f.name}</span><span class="mut sm">${fdate(String(f.at).slice(0, 10))}</span></a>`)}` : ''}
    ${(t.comments || []).length ? html`<div class="lbl" style="color:var(--mut);margin-top:12px">Comentarios</div>${t.comments.slice(-3).map((c) => html`<div class="sm" style="padding:4px 0"><span class="mut">${c.who} · ${fdate(String(c.at).slice(0, 10))}</span><br>${c.text}</div>`)}` : ''}
    <div class="row" style="margin-top:18px;flex-wrap:wrap;gap:8px">
      ${open && t.status !== 'En curso' && mine ? html`<button class="btn ghost" data-act="start">Empezar</button>` : ''}
      ${t.status === 'En revisión' && canApprove ? html`<button class="btn" data-act="approve">${ico('check', 14)} Aprobar</button><button class="btn ghost" data-act="back">↩ Devolver</button>` : ''}
      ${!open && canApprove ? html`<button class="btn ghost" data-act="reopen">Reabrir</button>` : ''}
      <div class="sp"></div>${me.role === 'ceo' || me.role === 'coo' ? html`<button class="btn ghost" data-act="del">${ico('trash')}</button>` : ''}</div>`,
  {
    chk: async (cb) => { const l = JSON.parse(JSON.stringify(t.checklist || [])); l[+cb.dataset.i].done = cb.checked; await save({ checklist: l }); },
    start: async () => { if (await save({ status: 'En curso' })) draw(); },
    deliver: async () => { const link = $('#dlink').value.trim(); if (!link) { toast('Pega el link de tu entrega o sube el archivo', true); $('#dlink').focus(); return; } if (!/^https?:\/\//.test(link)) return toast('El link debe empezar con https://', true); if (await save({ link, status: 'En revisión' })) { toast('Entregado a revisión'); closeDrawer(); } },
    approve: async () => { if (await save({ status: 'Hecha' })) { toast('Aprobado'); closeDrawer(); } },
    back: async () => { const { ask } = await import('./core.js'); const v = await ask('¿Qué hay que cambiar?', [{ k: 'note', l: 'Comentario para quien lo hizo', t: 'textarea', req: true }], 'Devolver'); if (!v) return; if (await save({ status: 'En curso', comments: [...(t.comments || []), { who: me.name, at: new Date().toISOString(), text: '↩ ' + v.note }] })) { toast('Devuelto con comentario'); closeDrawer(); } },
    reopen: async () => { if (await save({ status: 'En curso' })) draw(); },
    del: async () => { if (!(await confirmAsk(`¿Eliminar «${t.title}»?`))) return; try { await TK.remove(t.id); onChange(null); closeDrawer(); } catch (e) { toast(e.message, true); } },
  });
  draw();
  // Subir archivo: directo a Drive (carpeta de entregas del cliente y del mes), y la tarea pasa a revisión.
  const hook = () => {
    const inp = $('#dfile'), drop = $('#ddrop'); if (!inp) return;
    const go = async (file) => {
      if (!file) return; const bar = $('#dbar'); bar.hidden = false;
      try {
        const f = await uploadToDrive(file, `${t.title} · ${file.name}`, (p) => { bar.firstElementChild.style.width = Math.round(p * 100) + '%'; }, { client: proj?.client || 'Interno', sub: today().slice(0, 7) });
        if (await save({ link: f.link, status: 'En revisión', files: [...(t.files || []), { name: f.name, link: f.link, at: new Date().toISOString() }] })) { toast('Subido y enviado a revisión'); closeDrawer(); }
      } catch (e) { bar.hidden = true; toast(e.message, true); }
    };
    inp.onchange = () => go(inp.files[0]);
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); }; drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); go(e.dataTransfer.files[0]); };
  };
  hook();
  // Al redibujar (empezar, reabrir) se vuelven a conectar los controles de subida.
  const d = $('#drawer'); const mo = new MutationObserver(() => { if (d.classList.contains('on')) hook(); else mo.disconnect(); }); mo.observe(d, { childList: true });
}

// ---------- La tarea completa en el sheet lateral (la abre la página de proyecto) ----------
// Todo en un lugar: propiedades (responsable, fecha, estado, fase, depende de, SOP), descripción, checklist,
// entregar (link o archivo a Drive), archivos, comentarios e historial. Quien no edita, la ve en solo lectura;
// quien es responsable puede empezarla, marcar su checklist, entregarla y comentar.
// ctx: { me, projects, team, docs, tasks, edit, phases: [{k, name}] }. onChange(task|null) con lo guardado.
export function openTaskSheet(t, ctx, onChange = () => {}) {
  const { me, projects = [], team = [], docs = [], tasks = [], edit = false, phases = [] } = ctx;
  const proj = projects.find((p) => p.id === t.project_id);
  const person = (k) => team.find((p) => p.id === k || p.email === k);
  const who = (k) => person(k)?.name || (k ? String(k).split('@')[0] : 'Sin responsable');
  const canApprove = me.role === 'ceo' || me.role === 'coo' || (t.accountable && t.accountable === me.email);
  const mine = t.assignee === me.email;
  const save = async (patch) => { try { const r = await TK.save({ ...t, ...patch }); t = r; onChange(r); return r; } catch (e) { toast(e.message, true); return null; } };
  const sopOf = () => { if (!t.sop) return ''; if (/^https?:\/\//.test(t.sop)) return { href: t.sop, name: t.sop.replace(/^https?:\/\//, '').slice(0, 40), ext: true }; const d = docs.find((x) => x.id === t.sop); return d ? { href: `#/library/${d.folder_id || '_'}/${d.id}`, name: d.title } : ''; };
  const deps = () => (t.depends_on || []).map((id) => tasks.find((x) => x.id === id)).filter(Boolean);
  // Quien edita: «Depende de» con casillas (solo tareas del mismo proyecto y sin ciclos: no puede depender de algo que ya depende de ella)
  // y el SOP de la Library o un link https.
  const depsEdit = () => {
    const others = tasks.filter((x) => x.id !== t.id && (x.project_id || '') === (t.project_id || '')), cur = new Set(t.depends_on || []);
    const down = new Set(); const walk = (i) => tasks.filter((x) => (x.depends_on || []).includes(i)).forEach((x) => { if (!down.has(x.id)) { down.add(x.id); walk(x.id); } }); walk(t.id);
    return others.length ? html`<div class="ts-dchecks">${others.map((x) => html`<label class="check ${down.has(x.id) ? 'mut' : ''}"><input type="checkbox" class="tsdep" value="${x.id}" ${cur.has(x.id) ? raw('checked') : ''} ${down.has(x.id) ? raw('disabled title="Ya depende de esta tarea"') : ''}> ${x.title}</label>`)}</div>` : html`<span class="mut">No hay otras tareas en este proyecto</span>`;
  };
  const sopEdit = () => {
    const list = [...docs.filter((d) => d.kind === 'SOP'), ...docs.filter((d) => d.kind !== 'SOP' && d.kind !== 'Prompt')], link = /^https?:/.test(t.sop || '') ? t.sop : '';
    return html`<div class="ts-sop"><select class="in ts-in" id="tssop" aria-label="SOP de la Library"><option value="">— Ninguno</option>${list.map((d) => html`<option value="${d.id}" ${d.id === t.sop ? raw('selected') : ''}>${d.title}</option>`)}</select>
      <input class="in ts-in" id="tssopl" placeholder="o un link https://…" value="${link}" aria-label="Link del SOP"></div>`;
  };
  const crew = team.filter((x) => x.active !== false && x.kind !== 'ia');
  const prop = (l, v) => html`<div class="ts-k">${l}</div><div class="ts-v">${v}</div>`;
  const draw = () => {
    const st = t.status || 'Por empezar', open = st !== 'Hecha', sop = sopOf(), ph = phases.find((x) => x.k === t.phase), dl = deps();
    const hist = [...(t.comments || []).map((c) => ({ ...c, kind: 'c' })), ...(t.activity || []).map((a) => ({ ...a, kind: 'a' }))].sort((a, z) => String(a.at).localeCompare(String(z.at)));
    drawer(html`<div class="row"><span class="chip">${proj ? proj.client || proj.name : 'Interno'}</span>${t.dept ? html`<span class="chip sm2">${t.dept}</span>` : ''}<div class="sp"></div><button class="arrow light" data-act="close" aria-label="Cerrar">${ico('x', 16)}</button></div>
      ${edit ? html`<input class="in ts-title" id="tstitle" value="${t.title}" aria-label="Título de la tarea">` : html`<h2 style="margin-top:8px">${t.title}</h2>`}
      <div class="ts-props">
        ${prop('Estado', edit || mine ? html`<select class="in ts-in" id="tsstatus">${STATES.map((s) => html`<option ${s === st ? raw('selected') : ''}>${s}</option>`)}</select>` : stChip(t))}
        ${prop('Responsable', edit ? html`<select class="in ts-in" id="tsassignee"><option value="">— Sin responsable</option>${crew.map((p) => html`<option value="${p.email || p.id}" ${(p.email || p.id) === t.assignee ? raw('selected') : ''}>${p.name}</option>`)}</select>` : html`<span>${who(t.assignee)}</span>`)}
        ${prop('Fecha', edit ? html`<input class="in ts-in" type="date" id="tsdue" value="${t.due || ''}">` : dueChip(t))}
        ${phases.length ? prop('Fase', edit ? html`<select class="in ts-in" id="tsphase"><option value="">— Sin fase</option>${phases.map((x) => html`<option value="${x.k}" ${x.k === t.phase ? raw('selected') : ''}>${x.name}</option>`)}</select>` : html`<span>${ph?.name || '—'}</span>`) : ''}
        ${t.accountable ? prop('Revisa', html`<span>${who(t.accountable)}</span>`) : ''}
        ${edit ? prop('Depende de', depsEdit()) : prop('Depende de', dl.length ? html`<span class="ts-deps">${dl.map((d) => html`<span class="chip sm2 ${d.status === 'Hecha' ? '' : 'red'}">${d.status === 'Hecha' ? ico('check', 11) : ico('lock', 11)} ${d.title}</span>`)}</span>` : html`<span class="mut">Nada</span>`)}
        ${edit ? prop('SOP', sopEdit()) : prop('SOP', sop ? html`<a href="${sop.href}" ${sop.ext ? raw('target="_blank" rel="noopener noreferrer"') : ''} class="ts-link">${ico('doc', 14)} ${sop.name}</a>` : html`<span class="mut">Sin SOP</span>`)}
      </div>
      <div class="lbl ts-h">Descripción</div>
      ${edit ? html`<textarea class="in" id="tsdesc" rows="3" placeholder="Qué es y qué incluye…">${t.description || ''}</textarea>` : t.description ? html`<p class="sm" style="white-space:pre-wrap;margin:0">${t.description}</p>` : html`<p class="mut sm" style="margin:0">Sin descripción.</p>`}
      <div class="lbl ts-h">Checklist ${(t.checklist || []).length ? html`<span class="mut">· ${(t.checklist || []).filter((c) => c.done).length}/${t.checklist.length}</span>` : ''}</div>
      ${(t.checklist || []).map((c, i) => html`<label class="check"><input type="checkbox" data-act="tschk" data-i="${i}" ${c.done ? raw('checked') : ''} ${edit || mine ? '' : raw('disabled')}> ${c.t}</label>`)}
      ${edit || mine ? html`<div class="row" style="margin-top:6px;gap:6px"><input class="in" id="tsnewchk" placeholder="Nuevo paso…"><button class="btn ghost xs" data-act="tsaddchk">Agregar</button></div>` : !(t.checklist || []).length ? html`<p class="mut sm" style="margin:0">Sin pasos.</p>` : ''}
      ${open && (mine || edit) ? html`<div class="card wkbox wkup" style="margin-top:16px"><div class="wkhead"><div><h3>Entregar</h3><span class="mut sm">Pega el link o sube el archivo: queda en revisión de quien rinde cuentas</span></div></div>
        <div class="row" style="gap:8px"><input class="in" id="dlink" value="${t.link || ''}" placeholder="https://drive.google.com/…" style="flex:1"><button class="btn" data-act="tsdeliver">⇪ Entregar</button></div>
        <div class="wkdrop" id="ddrop" style="margin-top:10px"><b style="font-weight:500">o arrastra tu archivo aquí</b><label class="btn ghost xs" style="cursor:pointer">Seleccionar archivo<input type="file" id="dfile" hidden></label><div class="wkbar" id="dbar" hidden><i style="width:0%"></i></div></div></div>`
        : t.link && /^https?:\/\//.test(t.link) ? html`<a class="artifact" href="${t.link}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin-top:14px"><span class="fi" style="background:#87684e;color:#fdfaf3">${IC.drive}</span><div><b style="font-weight:500">Ver la entrega</b></div></a>` : ''}
      ${(t.files || []).length ? html`<div class="lbl ts-h">Archivos</div>${t.files.map((f) => html`<a class="wkrow" href="${/^https:\/\//.test(f.link) ? f.link : '#'}" target="_blank" rel="noopener noreferrer"><span class="fi">${IC.drive}</span><span class="grow">${f.name}</span><span class="mut sm">${fdate(String(f.at).slice(0, 10))}</span></a>`)}` : ''}
      <div class="lbl ts-h">Comentarios e historial</div>
      ${hist.length ? html`<div class="ts-hist">${hist.map((c) => html`<div class="ts-c ${c.kind === 'a' || /^(↩|Reasignada)/.test(c.text || '') ? 'sys' : ''}"><span class="av sm">${initials(c.who)}</span><div><span class="mut sm">${c.who || '—'} · ${fdate(String(c.at).slice(0, 10))}</span><div>${c.text}</div></div></div>`)}</div>` : html`<p class="mut sm" style="margin:0">Todavía nada.</p>`}
      <div class="row" style="margin-top:8px;gap:6px"><input class="in" id="tsnewcom" placeholder="Escribe un comentario…"><button class="btn ghost xs" data-act="tsaddcom">Enviar</button></div>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        ${st === 'En revisión' && canApprove ? html`<button class="btn" data-act="tsapprove">${ico('check', 14)} Aprobar</button><button class="btn ghost" data-act="tsback">↩ Devolver</button>` : ''}
        ${edit ? html`<button class="btn" data-act="tssave">Guardar</button>` : open && st === 'Por empezar' && mine ? html`<button class="btn" data-act="tsstart">Empezar</button>` : ''}
        <div class="sp"></div>${edit && (me.role === 'ceo' || me.role === 'coo') ? html`<button class="btn ghost" data-act="tsdel" aria-label="Eliminar">${ico('trash')}</button>` : ''}</div>`,
    {
      tschk: async (cb) => { const l = JSON.parse(JSON.stringify(t.checklist || [])); l[+cb.dataset.i].done = cb.checked; await save({ checklist: l }); },
      tsaddchk: async () => { const v = $('#tsnewchk').value.trim(); if (!v) return; if (await save({ ...collect(), checklist: [...(t.checklist || []), { t: v, done: false }] })) draw(); },
      tsaddcom: async () => { const v = $('#tsnewcom').value.trim(); if (!v) return; if (await save({ ...collect(), comments: [...(t.comments || []), { who: me.name, at: new Date().toISOString(), text: v }] })) draw(); },
      tsstart: async () => { if (await save({ status: 'En curso' })) draw(); },
      tssave: async () => { const l = $('#tssopl')?.value.trim(); if (l && !/^https:\/\//.test(l)) return toast('El link del SOP debe empezar con https://', true); if (await save(collect())) { toast('Guardado'); closeDrawer(); } },
      tsdeliver: async () => { const link = $('#dlink').value.trim(); if (!link) { toast('Pega el link de tu entrega o sube el archivo', true); return $('#dlink').focus(); } if (!/^https?:\/\//.test(link)) return toast('El link debe empezar con https://', true); if (await save({ ...collect(), link, status: 'En revisión' })) { toast('Entregado a revisión'); closeDrawer(); } },
      tsapprove: async () => { if (await save({ status: 'Hecha' })) { toast('Aprobado'); closeDrawer(); } },
      tsback: async () => { const { ask } = await import('./core.js'); const v = await ask('¿Qué hay que cambiar?', [{ k: 'note', l: 'Comentario para quien lo hizo', t: 'textarea', req: true }], 'Devolver'); if (!v) return; if (await save({ status: 'En curso', comments: [...(t.comments || []), { who: me.name, at: new Date().toISOString(), text: '↩ ' + v.note }] })) { toast('Devuelto con comentario'); closeDrawer(); } },
      tsdel: async () => { if (!(await confirmAsk(`¿Eliminar «${t.title}»?`))) return; try { await TK.remove(t.id); onChange(null); closeDrawer(); } catch (e) { toast(e.message, true); } },
    });
    hook();
  };
  // Lo que se cambió en las propiedades (solo los campos que existen en la vista).
  const collect = () => {
    const o = {}, v = (id) => $('#' + id)?.value;
    if ($('#tstitle')) o.title = v('tstitle').trim() || t.title;
    if ($('#tsstatus')) o.status = v('tsstatus');
    if ($('#tsassignee')) o.assignee = v('tsassignee');
    if ($('#tsdue')) o.due = v('tsdue');
    if ($('#tsphase')) o.phase = v('tsphase');
    if ($('#tsdesc')) o.description = v('tsdesc');
    if ($('#tssop')) { const l = v('tssopl').trim(); o.sop = /^https:\/\//.test(l) ? l : v('tssop'); }
    if ($('.ts-dchecks')) o.depends_on = $$('.ts-dchecks .tsdep:checked').map((i) => i.value);
    return o;
  };
  // Quien es responsable (sin editar) cambia el estado al instante.
  const hook = () => {
    const s = $('#tsstatus'); if (s && !edit) s.onchange = async () => { if (!(await save({ status: s.value }))) s.value = t.status || 'Por empezar'; };
    const inp = $('#dfile'), drop = $('#ddrop'); if (!inp) return;
    const go = async (file) => {
      if (!file) return; const bar = $('#dbar'); bar.hidden = false;
      try {
        const f = await uploadToDrive(file, `${t.title} · ${file.name}`, (p) => { bar.firstElementChild.style.width = Math.round(p * 100) + '%'; }, { client: proj?.client || 'Interno', sub: today().slice(0, 7) });
        if (await save({ link: f.link, status: 'En revisión', files: [...(t.files || []), { name: f.name, link: f.link, at: new Date().toISOString() }] })) { toast('Subido y enviado a revisión'); closeDrawer(); }
      } catch (e) { bar.hidden = true; toast(e.message, true); }
    };
    inp.onchange = () => go(inp.files[0]);
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); }; drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); go(e.dataTransfer.files[0]); };
  };
  draw();
}
