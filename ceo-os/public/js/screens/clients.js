import { html, raw, mount, col, api, acts, toast, fdate, fdateLong, today, initials, IC, $, docView, docHead, ask, confirmAsk } from '../core.js';
import { loadPosts, postsBoard } from '../posts.js';

// Clients: la página entera de cada cliente. El plan y los accesos salen del repo;
// el roadmap, los datos de contacto y la lista de accesos internos viven en la base (accounts).
const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
const RM = { todo: ['Pendiente', ''], now: ['En curso', 'lime'], done: ['Logrado', 'green'] };
const COLORS = ['olive', 'terra', 'ink'];
const cleanPlan = (s) => String(s || '').replace(/^[⬜🔷🟨]️?\s*/u, '');
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };

export async function render(el, { sub, alive }) {
  const AC = col('accounts');
  const [repo, accounts, projects, tasks, team] = await Promise.all([api('repo/clients').catch(() => ({ clients: [] })), AC.list(), col('projects').list(), col('tasks').list(), col('team').list()]);
  const clients = repo.clients.filter((c) => c.hasPlan).map((c) => ({ ...c, plan: cleanPlan(c.plan) }));
  const acct = (slug) => accounts.find((a) => a.id === 'acc-' + slug);
  const slug = sub[0];
  if (!slug) return list();
  return page(slug);

  // ---------- Lista de clientes ----------
  function list() {
    mount(el, html`<div class="hello"><h1>Clients</h1><p>Cada cliente, <em>su página</em>.</p></div>
      ${clients.length ? html`<div class="grid g3">${clients.map((c, i) => { const a = acct(c.slug); const rm = a?.roadmap || []; const done = rm.filter((x) => x.status === 'done').length; const ps = projects.filter((p) => p.client_slug === c.slug);
        const next = rm.filter((x) => x.status !== 'done').sort((x, z) => String(x.date || '9').localeCompare(String(z.date || '9')))[0];
        return html`<a class="card feat ${COLORS[i % 3]}" href="#/clients/${c.slug}" style="min-height:230px;text-decoration:none">
          <div class="chead"><div class="ico" style="font-size:13px;font-weight:700">${initials(a?.name || c.slug)}</div><h3>${a?.name || c.slug.toUpperCase()}<br><span class="lbl">${c.plan || 'Sin plan'}</span></h3><span class="arrow">↗</span></div>
          <div class="lbl">Roadmap</div><div class="big" style="font-size:46px">${done}<small>/${rm.length}</small></div>
          <div class="foot"><span>${next ? 'Sigue: ' + next.t : rm.length ? 'Roadmap completo' : 'Sin roadmap todavía'}</span><span>${ps.length} proyecto${ps.length === 1 ? '' : 's'}</span></div></a>`; })}</div>`
      : html`<div class="empty"><b>No encontré clientes en el repo</b>Cada cliente es un folder en clients/ con su 00-onboarding/plan-contratado.md.</div>`}`);
  }

  // ---------- Página del cliente ----------
  async function page(slug) {
    const c = clients.find((x) => x.slug === slug);
    let info = null; try { info = await api(`repo/client/${encodeURIComponent(slug)}`); } catch (e) { return mount(el, html`<a class="btn ghost" href="#/clients">← Clients</a><div class="empty" style="margin-top:16px"><b>No encontré ese cliente</b>${e.message}</div>`); }
    if (!alive()) return;
    let a = acct(slug) || { id: 'acc-' + slug, name: slug.toUpperCase(), contact: '', phone: '', email: '', notes: '', roadmap: [], accesos: [] };
    let posts = null;
    const ps = projects.filter((p) => p.client_slug === slug);
    const tk = tasks.filter((t) => ps.some((p) => p.id === t.project_id));
    const person = (email) => team.find((t) => t.id === email || t.email === email);
    const saveAcc = async (next) => { try { const r = next.v ? await AC.save(next) : await AC.create(next); a = r; return r; } catch (e) { toast(e.message, true); return null; } };

    function paint() {
      const rm = [...(a.roadmap || [])].map((x, i) => ({ ...x, i })).sort((x, z) => String(x.date || '9').localeCompare(String(z.date || '9')));
      const done = rm.filter((x) => x.status === 'done').length;
      const arts = ps.flatMap((p) => DEPTS.map(([n, name]) => ({ p, n, name, art: p.pipeline?.[n]?.artifact })).filter((x) => x.art?.url));
      mount(el, html`
        <div class="row" style="margin-bottom:14px"><a class="btn ghost" href="#/clients">← Clients</a></div>
        <div class="card feat olive" style="min-height:auto;padding:30px">
          <div class="row" style="flex-wrap:wrap;gap:14px;align-items:flex-start"><div class="ico" style="width:64px;height:64px;font-size:20px;font-weight:700">${initials(a.name)}</div>
            <div style="flex:1;min-width:240px"><div class="lbl">${cleanPlan(info.plan) || 'Sin plan'}</div><h1 style="font-size:52px;font-weight:500;letter-spacing:-1.6px;line-height:1.05">${a.name}</h1>
              <div style="opacity:.85;margin-top:6px">${[a.contact, a.phone, a.email].filter(Boolean).join(' · ') || 'Sin contacto'}</div></div>
            <div class="row" style="gap:8px"><button class="btn cream" data-act="pdf">↓ Roadmap PDF</button><button class="btn ghost" data-act="editAcc" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4)">Editar datos</button></div></div>
          <div class="split" style="margin-top:26px"><div><span class="lbl">Roadmap</span><b>${done}/${rm.length}</b></div><div><span class="lbl">Proyectos</span><b>${ps.length}</b></div><div><span class="lbl">Tareas abiertas</span><b>${tk.filter((t) => t.status !== 'Hecha').length}</b></div><div><span class="lbl">Entregables</span><b>${arts.length}</b></div></div>
        </div>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin:18px 0 6px">${[['rm', 'Roadmap'], ['tl', 'Timeline'], ['tk', 'Tareas'], ['ct', 'Contenido'], ['ac', 'Accesos'], ['en', 'Entregables'], ['pl', 'Plan']].map(([k, l]) => html`<button class="chip" data-act="jump" data-k="${k}" style="padding:8px 14px">${l}</button>`)}</div>

        <div class="sec-title" id="s-rm"><h2>Roadmap</h2><span class="mut sm">Los hitos grandes: a dónde vamos y cuándo</span></div>
        <div class="card">
          ${rm.length ? html`<div class="road">${rm.map((x) => html`<div class="step ${x.status}"><i></i><div style="flex:1"><div class="row" style="gap:8px"><b style="font-weight:500;font-size:16px">${x.t}</b><button class="chip ${RM[x.status]?.[1] || ''}" data-act="rmst" data-i="${x.i}" style="font-size:11px">${RM[x.status]?.[0] || 'Pendiente'}</button><div class="sp"></div><span class="mut sm">${x.date ? fdateLong(x.date) : 'Sin fecha'}</span><button class="sm mut" data-act="rmedit" data-i="${x.i}" title="Editar">✎</button><button class="sm mut" data-act="rmdel" data-i="${x.i}" title="Quitar">✕</button></div>${x.note ? html`<div class="mut sm" style="margin-top:4px">${x.note}</div>` : ''}</div></div>`)}</div>`
            : html`<div class="mut sm">Todavía no hay hitos. Agrega el primero abajo.</div>`}
          <div class="row" style="margin-top:14px;gap:6px"><input class="in" id="rmt" placeholder="Nuevo hito (ej. Lanzar la nueva oferta)"><input class="in" id="rmd" type="date" style="max-width:160px"><button class="btn" data-act="rmadd">+ Hito</button></div>
        </div>

        <div class="sec-title" id="s-tl"><h2>Timeline</h2><a href="#/operations/time">En Operations →</a></div>
        ${timeline()}

        <div class="sec-title" id="s-tk"><h2>Tareas</h2><a href="#/operations/tasks">En Operations →</a></div>
        ${tk.length ? html`<div class="card"><table><thead><tr><th></th><th>Tarea</th><th>Proyecto</th><th>Responsable</th><th>Vence</th><th>Estado</th></tr></thead><tbody>
          ${[...tk].sort((x, z) => (x.status === 'Hecha') - (z.status === 'Hecha') || String(x.due || '9').localeCompare(String(z.due || '9'))).map((t) => { const who = person(t.assignee); return html`<tr><td style="width:30px"><input type="checkbox" data-act="tdone" data-id="${t.id}" ${t.status === 'Hecha' ? raw('checked') : ''}></td><td><b style="font-weight:500;${t.status === 'Hecha' ? 'text-decoration:line-through;opacity:.5' : ''}">${t.title}</b>${t.dept ? html`<div class="mut sm">${t.dept}</div>` : ''}</td><td class="mut">${ps.find((p) => p.id === t.project_id)?.name || '—'}</td><td>${who ? html`<span class="av" style="background:${who.color || '#6b5a45'}" title="${who.name}">${initials(who.name)}</span>` : '—'}</td><td>${t.due ? fdate(t.due) : '—'}</td><td><span class="chip">${t.status || 'Por empezar'}</span></td></tr>`; })}</tbody></table></div>`
          : html`<div class="empty"><b>Sin tareas</b>Las tareas de los proyectos de este cliente aparecen aquí.</div>`}

        <div class="sec-title" id="s-ct"><h2>Contenido</h2><a href="#/content/semana/${slug}">En Content →</a></div>
        ${info.months.length ? html`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:12px">${info.months.map((m) => html`<a class="chip" href="#/content/guiones/${slug}" style="padding:8px 14px;text-decoration:none;color:inherit">✎ ${m.mes} · ${m.files.length} archivo${m.files.length === 1 ? '' : 's'} en el repo</a>`)}</div>` : ''}
        <div id="posts"></div>

        <div class="sec-title" id="s-ac"><h2>Accesos</h2><span class="mut sm">🔒 Nunca contraseñas aquí: solo dónde están</span></div>
        <div class="grid g11" style="align-items:start">
          <div class="card"><b style="font-weight:500">Del repo</b><div class="mut sm" style="margin-bottom:8px">clients/${slug}/00-onboarding/LINKS.md</div>
            ${info.links.length ? info.links.map((l) => html`<div class="row sm" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="mut" style="min-width:110px">${l.k}</span>${l.url && /^https:\/\//.test(l.url) ? html`<a href="${l.url}" target="_blank" rel="noopener noreferrer" style="color:inherit;flex:1">${l.v}</a>` : html`<span style="flex:1">${l.v}</span>`}</div>`) : html`<div class="mut sm">Este cliente no tiene LINKS.md.</div>`}</div>
          <div class="card"><b style="font-weight:500">Accesos del equipo</b><div class="mut sm" style="margin-bottom:8px">Qué cuenta, qué usuario y dónde está la clave (ej. «Bitwarden · carpeta NAO»)</div>
            ${(a.accesos || []).map((x, i) => html`<div class="row sm" style="padding:8px 0;border-bottom:1px solid var(--line)"><b style="font-weight:500;min-width:110px">${x.servicio}</b><span style="flex:1">${x.usuario || '—'}<span class="mut"> · ${x.donde || '—'}</span></span><button class="sm mut" data-act="acdel" data-i="${i}">✕</button></div>`)}
            <button class="btn ghost" data-act="acadd" style="margin-top:10px">+ Acceso</button></div>
        </div>

        <div class="sec-title" id="s-en"><h2>Entregables</h2></div>
        ${arts.length ? html`<div class="grid g3">${arts.map((x) => html`<a class="artifact" href="${/^https?:\/\//.test(x.art.url) ? x.art.url : '#'}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit"><span class="fi" style="background:#4f7790;color:#fff">${IC.drive}</span><div><b style="font-weight:500">${x.art.name || 'Entregable'}</b><div class="mut" style="font-size:11px">${x.n} ${x.name} · ${x.p.name}</div></div></a>`)}</div>`
          : html`<div class="empty"><b>Sin entregables todavía</b>Se agregan en Operations → Pipeline, en cada departamento.</div>`}

        <div class="sec-title" id="s-pl"><h2>Plan contratado</h2><span class="mut sm">Del repo</span></div>
        <div class="card">${info.fields.length ? info.fields.map((f) => html`<div class="row" style="padding:9px 0;border-bottom:1px solid var(--line);align-items:flex-start"><span class="mut sm" style="min-width:170px">${f.key}</span><span class="sm" style="flex:1">${cleanPlan(f.value)}</span></div>`) : html`<div class="mut sm">Sin plan contratado en el repo.</div>`}
          ${info.pipeline?.length ? html`<b class="sm" style="display:block;margin-top:16px">Su pipeline</b>${info.pipeline.map((r) => html`<div class="row sm" style="padding:6px 0"><span style="min-width:170px">${r.paso}</span><span class="mut" style="flex:1">${r.que}</span></div>`)}` : ''}</div>`);
      renderPosts();
    }

    function timeline() {
      const rows = ps.flatMap((p) => (p.phases || []).filter((x) => x.start && x.end).map((x) => ({ p, x })));
      if (!rows.length) return html`<div class="empty"><b>Sin fases con fecha</b>Crea un proyecto para este cliente en Operations.</div>`;
      const min = rows.reduce((m, r) => (r.x.start < m ? r.x.start : m), rows[0].x.start);
      const s0 = new Date(min + 'T12:00'); s0.setDate(s0.getDate() - ((s0.getDay() + 6) % 7));
      const weeks = Array.from({ length: 8 }, (_, i) => { const d = new Date(s0); d.setDate(d.getDate() + i * 7); return iso(d); });
      const W = (s) => (new Date(s + 'T12:00') - new Date(weeks[0] + 'T12:00')) / (7 * 864e5);
      const tw = W(today());
      return html`<div class="card tscroll"><div class="gantt" style="grid-template-columns:220px repeat(8,1fr);min-width:820px"><div class="h">Fase</div>${weeks.map((w) => html`<div class="h">${fdate(w)}</div>`)}
        ${rows.map(({ p, x }) => { const s = W(x.start), e = W(addDays(x.end, 1)); const c0 = Math.floor(s);
          return html`<div class="lab">${x.name}<div class="mut" style="font-size:11px;font-weight:400">${p.name}</div></div>${weeks.map((_, i) => html`<div class="cell">${i === Math.max(0, c0) && s < 8 ? html`<div class="bar ${x.status === 'done' ? 'b1' : x.status === 'now' ? 'b2' : 'b4'}" title="${x.name}" style="left:${((s - c0) * 100).toFixed(1)}%;width:calc(${((Math.min(e, 8) - s) * 100).toFixed(1)}% - 4px)">${x.name}</div>` : ''}${i === Math.floor(tw) && tw >= 0 && tw < 8 ? html`<div class="tline" style="left:${((tw % 1) * 100).toFixed(1)}%"></div>` : ''}</div>`)}`; })}</div></div>`;
    }

    function renderPosts() {
      const b = $('#posts', el); if (!b) return;
      if (!posts) { mount(b, html`<p class="loading">Cargando contenido…</p>`); loadPosts(slug).then((l) => { posts = l; if (alive()) renderPosts(); }).catch((e) => mount(b, html`<div class="warnbox">${e.message}</div>`)); return; }
      postsBoard(b, slug, posts, (l) => { posts = l; renderPosts(); });
    }

    function roadmapPdf() {
      const rm = [...(a.roadmap || [])].sort((x, z) => String(x.date || '9').localeCompare(String(z.date || '9')));
      docView(html`${docHead('Roadmap', html`${a.name}<br>${fdateLong(today())}`)}
        <div class="qto"><div><div class="lbl2">CLIENTE</div><b style="font-weight:500;font-size:15px">${a.name}</b>${cleanPlan(info.plan) ? html`<div>${cleanPlan(info.plan)}</div>` : ''}</div>
          <div><div class="lbl2">AVANCE</div><b style="font-weight:500;font-size:15px">${rm.filter((x) => x.status === 'done').length} de ${rm.length} hitos logrados</b></div></div>
        <div class="road pdf">${rm.map((x) => html`<div class="step ${x.status}"><i></i><div style="flex:1"><div class="row"><b style="font-weight:500;font-size:15px">${x.t}</b><div class="sp"></div><span style="color:#6b6257;font-size:12px">${x.date ? fdateLong(x.date) : ''}</span></div><div style="font-size:11px;letter-spacing:1px;font-weight:700;color:${x.status === 'done' ? '#4f6b12' : x.status === 'now' ? '#7f9631' : '#8f877b'}">${(RM[x.status]?.[0] || 'Pendiente').toUpperCase()}</div>${x.note ? html`<div style="color:#4a433a;font-size:12.5px;margin-top:2px">${x.note}</div>` : ''}</div></div>`)}</div>
        <div class="qfoot"><span>Inherent · Growth Operator</span><span>inherentglobal.com</span></div>`);
    }

    acts(el, {
      jump: (t) => $('#s-' + t.dataset.k, el)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      pdf: roadmapPdf,
      rmadd: async () => { const t = $('#rmt', el).value.trim(); if (!t) return toast('Escribe el hito', true); if (await saveAcc({ ...a, roadmap: [...(a.roadmap || []), { t, date: $('#rmd', el).value, status: 'todo' }] })) { toast('Hito agregado ✅'); paint(); } },
      rmst: async (t) => { const rmx = JSON.parse(JSON.stringify(a.roadmap)); const x = rmx[+t.dataset.i]; x.status = { todo: 'now', now: 'done', done: 'todo' }[x.status] || 'now'; if (await saveAcc({ ...a, roadmap: rmx })) paint(); },
      rmedit: async (t) => { const i = +t.dataset.i; const x = a.roadmap[i]; const v = await ask('Editar hito', [{ k: 't', l: 'Hito', v: x.t, req: true }, { k: 'date', l: 'Fecha', t: 'date', v: x.date, half: true }, { k: 'status', l: 'Estado', t: 'select', opts: Object.entries(RM).map(([k, [l]]) => [k, l]), v: x.status, half: true }, { k: 'note', l: 'Nota (sale en el PDF)', t: 'textarea', v: x.note }]); if (!v) return; const rmx = JSON.parse(JSON.stringify(a.roadmap)); rmx[i] = { ...x, ...v }; if (await saveAcc({ ...a, roadmap: rmx })) paint(); },
      rmdel: async (t) => { if (!(await confirmAsk('¿Quitar este hito?'))) return; if (await saveAcc({ ...a, roadmap: a.roadmap.filter((_, i) => i !== +t.dataset.i) })) paint(); },
      editAcc: async () => { const v = await ask('Datos del cliente', [{ k: 'name', l: 'Nombre', v: a.name, req: true }, { k: 'contact', l: 'Contacto', v: a.contact, half: true }, { k: 'phone', l: 'Teléfono / WhatsApp', v: a.phone, half: true }, { k: 'email', l: 'Correo', t: 'email', v: a.email }, { k: 'notes', l: 'Notas', t: 'textarea', v: a.notes }]); if (v && (await saveAcc({ ...a, ...v }))) { toast('Guardado ✅'); paint(); } },
      acadd: async () => { const v = await ask('Nuevo acceso', [{ k: 'servicio', l: 'Cuenta o servicio', req: true }, { k: 'usuario', l: 'Usuario', half: true }, { k: 'donde', l: 'Dónde está la clave', half: true }]); if (!v) return; if (/contrase|password|clave:/i.test(v.usuario + ' ' + v.donde) && !(await confirmAsk('Parece que escribiste una contraseña. Aquí solo va DÓNDE está. ¿Guardar igual?'))) return; if (await saveAcc({ ...a, accesos: [...(a.accesos || []), v] })) paint(); },
      acdel: async (t) => { if (await saveAcc({ ...a, accesos: (a.accesos || []).filter((_, i) => i !== +t.dataset.i) })) paint(); },
      tdone: async (cb) => { const t = tasks.find((x) => x.id === cb.dataset.id); try { Object.assign(t, await col('tasks').save({ ...t, status: cb.checked ? 'Hecha' : 'En curso' })); paint(); } catch (e) { cb.checked = !cb.checked; toast(e.message, true); } },
    });
    paint();
  }
}
