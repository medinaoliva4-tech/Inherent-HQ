// El área de entrega de una tarea: qué es, para cuándo, y dónde se entrega (link o archivo a Drive).
// Es el mismo flujo del Workspace: el link o el archivo subido dejan la tarea «En revisión» de quien rinde cuentas.
import { html, raw, mount, col, api, drawer, closeDrawer, toast, fdate, today, $, IC, ico, uploadToDrive, confirmAsk } from './core.js';

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
