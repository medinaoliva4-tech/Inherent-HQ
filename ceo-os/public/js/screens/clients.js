import { html, raw, mount, col, api, acts, toast, fdate, fdateLong, today, initials, IC, $, docView, docHead, ask, confirmAsk , teamList, wizard, ICON, ico } from '../core.js';
import { upcoming, meetingRows, schedule, markDone } from '../meetings.js';
import { fit, priceLabel, monthly, avatar, CADENCE } from '../mentors.js';
import { loadPosts, postsBoard } from '../posts.js';

// Clients: la página entera de cada cliente. El plan y los accesos salen del repo;
// el roadmap, los datos de contacto y la lista de accesos internos viven en la base (accounts).
const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
const RM = { todo: ['Pendiente', ''], now: ['En curso', 'lime'], done: ['Logrado', 'green'] };
const COLORS = ['olive', 'terra', 'ink'];
// El roadmap son METAS: qué queremos, cómo se mide, dónde estamos, el desglose de tareas y los checkpoints.
// (Los hitos viejos se leen como metas sin métrica.)
const HEALTH = { ok: ['En camino', 'green', '#795c45'], riesgo: ['En riesgo', 'amber', '#b29b86'], off: ['Fuera de ruta', 'red', '#654c38'] };
const goalsOf = (a) => a?.goals || (a?.roadmap || []).map((x) => ({ goal: x.t, due: x.date || '', status: x.status || 'todo', note: x.note || '', metric: '', baseline: '', target: '', current: '', tasks: [], checks: [] }));
const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : null; };
const pctOf = (g) => { if (g.status === 'done') return 100; const b = num(g.baseline) ?? 0, t = num(g.target), c = num(g.current); if (t == null || c == null || t === b) return null; return Math.max(0, Math.min(100, Math.round(((c - b) / (t - b)) * 100))); };
const healthOf = (g) => [...(g.checks || [])].reverse().find((c) => c.done)?.health || null;
function checkpoints(from, to, every) {
  const out = []; const d = new Date(from + 'T12:00'), end = new Date((to || from) + 'T12:00');
  const step = () => (every === 'semanal' ? d.setDate(d.getDate() + 7) : every === 'quincenal' ? d.setDate(d.getDate() + 14) : d.setMonth(d.getMonth() + 1));
  step(); while (d < end && out.length < 24) { out.push({ date: d.toISOString().slice(0, 10), done: false }); step(); }
  out.push({ date: to || from, done: false, final: true }); return out;
}
async function goalWizard() {
  const a = await wizard('Nueva meta del roadmap', [
    { k: 'goal', q: '¿Cuál es la meta?', type: 'text', req: true, ph: 'Ej. Facturar Q120K al mes', chips: ['Facturar más al mes', 'Duplicar los leads', 'Lanzar la nueva oferta', 'Subir el ticket promedio'] },
    { k: 'metric', q: '¿Cómo sabemos que se logró?', sub: 'La métrica que vamos a mirar', type: 'text', req: true, ph: 'Ej. Facturación mensual', chips: ['Facturación mensual', 'Leads por mes', 'Ventas cerradas', 'Ticket promedio', 'Seguidores', 'ROAS'] },
    { k: 'baseline', q: '¿Dónde está hoy?', type: 'text', ph: 'Ej. Q80,000' },
    { k: 'target', q: '¿A cuánto llegamos?', type: 'text', req: true, ph: 'Ej. Q120,000' },
    { k: 'due', q: '¿Para cuándo?', type: 'date', req: true },
    { k: 'tasks', q: 'El desglose: ¿qué hay que hacer?', sub: 'Una tarea por línea', type: 'textarea', ph: 'Nueva oferta con precio\nLanding y checkout\nCampaña de lanzamiento' },
    { k: 'every', q: '¿Cada cuánto revisamos cómo va?', type: 'cards', req: true, opts: [{ v: 'semanal', i: ico('pin'), l: 'Cada semana' }, { v: 'quincenal', i: ico('pin'), l: 'Cada 15 días' }, { v: 'mensual', i: ico('pin'), l: 'Cada mes' }] },
  ], 'Agregar meta');
  if (!a) return null;
  return { goal: a.goal, metric: a.metric, baseline: a.baseline || '', target: a.target, current: a.baseline || '', due: a.due, status: 'now', note: '', every: a.every,
    tasks: String(a.tasks || '').split('\n').map((t) => t.trim()).filter(Boolean).map((t) => ({ t, done: false })), checks: checkpoints(today(), a.due, a.every) };
}
const cleanPlan = (s) => String(s || '').replace(/^[⬜🔷🟨]️?\s*/u, '');
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };

export async function render(el, { me, sub, alive }) {
  const AC = col('accounts');
  const [repo, accounts, projects, tasks, team, mentors] = await Promise.all([api('repo/clients').catch(() => ({ clients: [] })), AC.list(), col('projects').list(), col('tasks').list(), teamList(), col('mentors').list().catch(() => [])]);
  const clients = repo.clients.filter((c) => c.hasPlan).map((c) => ({ ...c, plan: cleanPlan(c.plan) }));
  // Los que entraron por un pago (Control) viven en la app aunque todavía no tengan folder en el repo.
  const inRepo = new Set(repo.clients.map((c) => c.slug));
  for (const a of accounts) { const sl = a.slug || String(a.id).replace(/^acc-/, ''); if (a.from_quote && !inRepo.has(sl)) clients.push({ slug: sl, hasPlan: false, plan: 'Desde cotización', app: true }); }
  const onboarding = repo.clients.filter((c) => !c.hasPlan);
  const acct = (slug) => accounts.find((a) => a.id === 'acc-' + slug);
  const slug = sub[0];
  if (!slug) return list();
  return page(slug);

  // ---------- Lista de clientes ----------
  function list() {
    mount(el, html`<div class="hello"><h1>Clients</h1><p>Cada cliente, <em>su página</em>.</p></div>
      ${clients.length ? html`<div class="grid g3">${clients.map((c, i) => { const a = acct(c.slug); const rm = goalsOf(a); const done = rm.filter((x) => x.status === 'done').length; const ps = projects.filter((p) => p.client_slug === c.slug);
        const next = rm.filter((x) => x.status !== 'done').sort((x, z) => String(x.due || '9').localeCompare(String(z.due || '9')))[0];
        return html`<a class="card feat ${COLORS[i % 3]}" href="#/clients/${c.slug}" style="min-height:230px;text-decoration:none">
          <div class="chead"><div class="ico" style="font-size:13px;font-weight:700">${initials(a?.name || c.slug)}</div><h3>${a?.name || c.slug.toUpperCase()}<br><span class="lbl">${c.plan || 'Sin plan'}</span></h3><span class="arrow">↗</span></div>
          <div class="lbl">Roadmap</div><div class="big" style="font-size:46px">${done}<small>/${rm.length}</small></div>
          <div class="foot"><span>${next ? 'Meta: ' + next.goal : rm.length ? 'Metas logradas' : 'Sin roadmap todavía'}</span><span>${ps.length} proyecto${ps.length === 1 ? '' : 's'}</span></div></a>`; })}</div>`
      : html`<div class="empty"><b>No encontré clientes en el repo</b>Cada cliente es un folder en clients/ con su 00-onboarding/plan-contratado.md.</div>`}
      ${onboarding.length ? html`<div class="sec-title"><h2>En onboarding</h2><span class="mut sm">Tienen folder en el repo pero todavía no su plan contratado</span></div><div class="grid g4">${onboarding.map((c) => html`<div class="card wkbox"><b style="font-weight:500">${c.slug.toUpperCase()}</b><div class="mut sm" style="margin-top:4px">Falta <code>00-onboarding/plan-contratado.md</code> (lo deja ① Strategy). Cuando exista, aparece arriba y se puede crear su ciclo.</div></div>`)}</div>` : ''}`);
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
    let portalPeople = me.role === 'client' ? [] : (await api('db/team').catch(() => ({ items: [] }))).items.filter((x) => x.role === 'client' && x.client_slug === slug);
    const isGrowth = () => /accelerate|compound/i.test(info?.plan || '') || ps.some((p) => p.line === 'growth');
    const person = (email) => team.find((t) => t.id === email || t.email === email);
    const saveAcc = async (next) => { try { const r = next.v ? await AC.save(next) : await AC.create(next); a = r; return r; } catch (e) { toast(e.message, true); return null; } };

    function paint() {
      const rm = goalsOf(a).map((x, i) => ({ ...x, i }));
      const done = rm.filter((x) => x.status === 'done').length;
      const arts = ps.flatMap((p) => DEPTS.map(([n, name]) => ({ p, n, name, art: p.pipeline?.[n]?.artifact })).filter((x) => x.art?.url));
      mount(el, html`
        <div class="row" style="margin-bottom:14px"><a class="btn ghost" href="#/clients">← Clients</a></div>
        <div class="card feat olive" style="min-height:auto;padding:30px">
          <div class="row" style="flex-wrap:wrap;gap:14px;align-items:flex-start"><div class="ico" style="width:64px;height:64px;font-size:20px;font-weight:700">${initials(a.name)}</div>
            <div style="flex:1;min-width:240px"><div class="lbl">${cleanPlan(info.plan) || (info.app ? 'Desde cotización' : 'Sin plan')}</div><h1 style="font-size:52px;font-weight:500;letter-spacing:-1.6px;line-height:1.05">${a.name}</h1>
              <div style="opacity:.85;margin-top:6px">${[a.contact, a.phone, a.email].filter(Boolean).join(' · ') || 'Sin contacto'}</div></div>
            <div class="row" style="gap:8px"><button class="btn cream" data-act="pdf">↓ Roadmap PDF</button><button class="btn ghost" data-act="editAcc" style="background:transparent;color:#fdfaf3;border-color:rgba(253,250,243,.4)">Editar datos</button></div></div>
          <div class="split" style="margin-top:26px"><div><span class="lbl">Roadmap</span><b>${done}/${rm.length}</b></div><div><span class="lbl">Proyectos</span><b>${ps.length}</b></div><div><span class="lbl">Tareas abiertas</span><b>${tk.filter((t) => t.status !== 'Hecha').length}</b></div><div><span class="lbl">Entregables</span><b>${arts.length}</b></div></div>
        </div>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin:18px 0 6px">${[['rm', 'Roadmap'], ['es', 'Especialista'], ['mt', 'Reuniones'], ['tl', 'Timeline'], ['tk', 'Tareas'], ['ct', 'Contenido'], ['ac', 'Accesos'], ['en', 'Entregables'], ['pl', 'Plan']].map(([k, l]) => html`<button class="chip" data-act="jump" data-k="${k}" style="padding:8px 14px">${l}</button>`)}</div>

        ${a.drive ? html`<div class="row" style="gap:6px;flex-wrap:wrap;margin:8px 0 4px"><a class="connect on" href="${a.drive}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit"><span class="lg">${IC.drive}</span>Drive de ${a.name}</a>${Object.entries(a.drive_dirs || {}).map(([k, u]) => html`<a class="chip" href="${u}" target="_blank" rel="noopener noreferrer" style="padding:7px 12px;text-decoration:none;color:inherit">${ico('folder')} ${k.replace(/^\d+ /, '')}</a>`)}</div>`
          : html`<div class="connectcard" style="margin:8px 0 4px"><span class="lg big">${IC.drive}</span><div class="grow"><b style="font-weight:500">Crea el Drive de ${a.name}</b><div class="mut sm">Onboarding · Assets · Guiones · Crudo · Por postear · Entregables · Reportes${isGrowth() ? ' · Números y auditoría' : ''}. Quedan conectadas a Content y al Workspace.</div></div><button class="btn" data-act="mkdrive">Crear carpetas</button></div>`}

        <div class="card" style="margin:10px 0 4px;padding:14px 16px"><div class="row" style="gap:10px;flex-wrap:wrap"><b class="ttl" style="font-size:16px">${ICON.user}Portal del cliente</b><span class="mut sm">Ve su avance, contenido, reuniones, metas y redes. Nada de costos ni notas internas.</span><div class="sp"></div><a class="btn ghost xs" href="#/portal/${slug}">${ico('eye')} Ver su portal</a>${me.role === 'ceo' ? html`<button class="btn xs" data-act="portalAdd">+ Dar acceso</button>` : ''}</div>
          ${portalPeople.length ? html`<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px">${portalPeople.map((x) => html`<span class="chip">${x.email}${me.role === 'ceo' ? html` <button class="sm mut" data-act="portalDel" data-id="${x.id}" style="margin-left:4px">${ico('x', 16)}</button>` : ''}</span>`)}</div>` : html`<div class="mut sm" style="margin-top:6px">Nadie tiene acceso todavía.</div>`}</div>

        <div class="sec-title" id="s-rm"><h2>Roadmap</h2><span class="mut sm">Metas · cómo se miden · desglose · checkpoints</span><div class="sp"></div><button class="btn" data-act="gadd">+ Meta</button></div>
        ${rm.length ? html`<div class="goals">${rm.map(goalCard)}</div>` : html`<div class="empty"><b>Sin metas todavía</b>Una meta trae cómo la medimos, dónde estamos, a dónde vamos, las tareas y cuándo revisamos.</div>`}

        <div class="sec-title" id="s-es"><h2>Especialista</h2><span class="mut sm">${isGrowth() ? 'Incluido en su plan Growth, dentro del techo por sesión' : 'Su plan no lo incluye: va como add-on facturado'}</span><div class="sp"></div><button class="btn ghost" data-act="esadd">+ Especialista</button></div>
        ${(a.mentors || []).length ? html`<div class="grid g3">${a.mentors.map((x, k) => { const m = mentors.find((y) => y.id === x.id); if (!m) return ''; const [f, c] = isGrowth() ? fit(m) : ['Add-on facturado al cliente', 'red']; const g = goalsOf(a)[x.goal];
          return html`<div class="card mcard"><div class="row" style="gap:10px">${avatar(m)}<div style="min-width:0;flex:1"><b style="font-weight:500">${m.name}</b><div class="mut sm">${m.industry} · ${m.platform || ''}</div></div><button class="sm mut" data-act="esdel" data-k="${k}">${ico('x', 16)}</button></div>
            <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap"><b style="font-weight:500">${priceLabel(m)}</b><span class="mut sm">· ${CADENCE.find(([v]) => v === x.cadence)?.[1] || ''}</span>${monthly(m, x.cadence) ? html`<span class="mut sm">≈ $${monthly(m, x.cadence)}/mes</span>` : ''}</div>
            <span class="chip ${c}" style="font-size:11px;margin-top:8px">${f}</span>${g ? html`<div class="sm" style="margin-top:8px">${ico('target', 16)} Para la meta: <b style="font-weight:500">${g.goal}</b></div>` : ''}${x.note ? html`<div class="mut sm" style="margin-top:4px">${x.note}</div>` : ''}</div>`; })}</div>`
          : html`<div class="mut sm">Sin especialista. ${mentors.length ? 'Agrégalo con «+ Especialista» y ligalo a una meta del roadmap.' : 'Primero carga la red en Sales → Especialistas.'}</div>`}

        <div class="sec-title" id="s-mt"><h2>Reuniones</h2><span class="mut sm">Las de cada proyecto, con quiénes van y qué se aprueba</span></div>
        <div class="card">${meetingRows(upcoming(ps), team, me, true)}</div>

        <div class="sec-title" id="s-tl"><h2>Timeline</h2><a href="#/operations/time">En Operations →</a></div>
        ${timeline()}

        <div class="sec-title" id="s-tk"><h2>Tareas</h2><a href="#/operations/tasks">En Operations →</a></div>
        ${tk.length ? html`<div class="card"><table><thead><tr><th></th><th>Tarea</th><th>Proyecto</th><th>Responsable</th><th>Vence</th><th>Estado</th></tr></thead><tbody>
          ${[...tk].sort((x, z) => (x.status === 'Hecha') - (z.status === 'Hecha') || String(x.due || '9').localeCompare(String(z.due || '9'))).map((t) => { const who = person(t.assignee); return html`<tr><td style="width:30px"><input type="checkbox" data-act="tdone" data-id="${t.id}" ${t.status === 'Hecha' ? raw('checked') : ''}></td><td><b style="font-weight:500;${t.status === 'Hecha' ? 'text-decoration:line-through;opacity:.5' : ''}">${t.title}</b>${t.dept ? html`<div class="mut sm">${t.dept}</div>` : ''}</td><td class="mut">${ps.find((p) => p.id === t.project_id)?.name || '—'}</td><td>${who ? html`<span class="av" style="background:${who.color || '#735741'}" title="${who.name}">${initials(who.name)}</span>` : '—'}</td><td>${t.due ? fdate(t.due) : '—'}</td><td><span class="chip">${t.status || 'Por empezar'}</span></td></tr>`; })}</tbody></table></div>`
          : html`<div class="empty"><b>Sin tareas</b>Las tareas de los proyectos de este cliente aparecen aquí.</div>`}

        <div class="sec-title" id="s-ct"><h2>Contenido</h2>${me.areas.includes('content') ? html`<a href="#/content/plan/${slug}">Planner en Content →</a>` : ''}</div>
        <div id="posts"></div>

        <div class="sec-title" id="s-ac"><h2>Accesos</h2><span class="mut sm">${ico('lock')} Nunca contraseñas aquí: solo dónde están</span></div>
        <div class="grid g11" style="align-items:start">
          <div class="card"><b style="font-weight:500">Del repo</b><div class="mut sm" style="margin-bottom:8px">clients/${slug}/00-onboarding/LINKS.md</div>
            ${info.links.length ? info.links.map((l) => html`<div class="row sm" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="mut" style="min-width:110px">${l.k}</span>${l.url && /^https:\/\//.test(l.url) ? html`<a href="${l.url}" target="_blank" rel="noopener noreferrer" style="color:inherit;flex:1">${l.v}</a>` : html`<span style="flex:1">${l.v}</span>`}</div>`) : html`<div class="mut sm">Este cliente no tiene LINKS.md.</div>`}</div>
          <div class="card"><b style="font-weight:500">Accesos del equipo</b><div class="mut sm" style="margin-bottom:8px">Qué cuenta, qué usuario y dónde está la clave (ej. «Bitwarden · carpeta NAO»)</div>
            ${(a.accesos || []).map((x, i) => html`<div class="row sm" style="padding:8px 0;border-bottom:1px solid var(--line)"><b style="font-weight:500;min-width:110px">${x.servicio}</b><span style="flex:1">${x.usuario || '—'}<span class="mut"> · ${x.donde || '—'}</span></span><button class="sm mut" data-act="acdel" data-i="${i}">${ico('x', 16)}</button></div>`)}
            <button class="btn ghost" data-act="acadd" style="margin-top:10px">+ Acceso</button></div>
        </div>

        <div class="sec-title" id="s-en"><h2>Entregables</h2></div>
        ${arts.length ? html`<div class="grid g3">${arts.map((x) => html`<a class="artifact" href="${/^https?:\/\//.test(x.art.url) ? x.art.url : '#'}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit"><span class="fi" style="background:#87684e;color:#fdfaf3">${IC.drive}</span><div><b style="font-weight:500">${x.art.name || 'Entregable'}</b><div class="mut" style="font-size:11px">${x.n} ${x.name} · ${x.p.name}</div></div></a>`)}</div>`
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
      if (!me.areas.includes('content')) return mount(b, html`<div class="mut sm">El contenido de ${slug.toUpperCase()} lo ven el CEO y Content. Lo tuyo está en tu Workspace.</div>`);
      if (!posts) { mount(b, html`<p class="loading">Cargando contenido…</p>`); loadPosts(slug).then((l) => { posts = l; if (alive()) renderPosts(); }).catch((e) => mount(b, html`<div class="warnbox">${e.message}</div>`)); return; }
      postsBoard(b, slug, posts, (l) => { posts = l; renderPosts(); });
    }

    function goalCard(g) {
      const pct = pctOf(g), h = healthOf(g), td = (g.tasks || []).filter((t) => t.done).length;
      return html`<div class="card goal ${g.status}">
        <div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:500;font-size:17px">${g.goal}</b>
          <button class="chip ${RM[g.status]?.[1] || ''}" data-act="gst" data-g="${g.i}" style="font-size:11px">${RM[g.status]?.[0] || 'Pendiente'}</button>
          ${h ? html`<span class="chip ${HEALTH[h][1]}" style="font-size:11px">${HEALTH[h][0]}</span>` : ''}
          <div class="sp"></div><span class="mut sm">${g.due ? 'Para el ' + fdateLong(g.due) : 'Sin fecha'}</span><button class="sm mut" data-act="gedit" data-g="${g.i}" title="Editar">${ico('edit')}</button><button class="sm mut" data-act="gdel" data-g="${g.i}" title="Quitar">${ico('x', 16)}</button></div>
        ${g.metric ? html`<div class="gmetric"><span class="mut sm">${ico('ruler')} ${g.metric}</span><div class="row" style="gap:10px;margin-top:6px"><span class="sm">Hoy <b style="font-weight:500">${g.current || g.baseline || '—'}</b></span><div class="gbar"><i style="width:${pct ?? 0}%"></i></div><span class="sm">Meta <b style="font-weight:500">${g.target || '—'}</b></span><span class="sm mut" style="width:40px;text-align:right">${pct == null ? '' : pct + '%'}</span></div></div>` : html`<div class="mut sm" style="margin-top:6px">Sin métrica: ${ico('edit')} para definir cómo se mide.</div>`}
        ${g.note ? html`<div class="mut sm" style="margin-top:6px">${g.note}</div>` : ''}
        ${(a.mentors || []).filter((x) => x.goal === g.i).map((x) => { const m = mentors.find((y) => y.id === x.id); return m ? html`<div class="row sm" style="gap:8px;margin-top:8px">${avatar(m, 24)}<span>Con <b style="font-weight:500">${m.name}</b> · ${m.industry} · ${priceLabel(m)}</span></div>` : ''; })}
        <div class="gcols">
          <div><div class="lbl" style="color:var(--mut)">Desglose · ${td}/${(g.tasks || []).length}</div>
            ${(g.tasks || []).map((t, k) => html`<label class="check" style="padding:3px 0"><input type="checkbox" data-act="gtask" data-g="${g.i}" data-k="${k}" ${t.done ? raw('checked') : ''}> <span style="${t.done ? 'text-decoration:line-through;opacity:.5' : ''}">${t.t}</span></label>`)}
            <button class="sm mut" data-act="gtadd" data-g="${g.i}" style="margin-top:4px">+ tarea</button></div>
          <div><div class="lbl" style="color:var(--mut)">Checkpoints${g.every ? ' · ' + g.every : ''}</div>
            <div class="gchecks">${(g.checks || []).map((c, k) => html`<button class="gck ${c.done ? 'done' : ''} ${c.date <= today() && !c.done ? 'due' : ''}" data-act="gcheck" data-g="${g.i}" data-k="${k}" title="${c.note || ''}" style="${c.done && c.health ? `border-color:${HEALTH[c.health][2]}` : ''}"><span class="d" style="${c.done && c.health ? `background:${HEALTH[c.health][2]}` : ''}"></span><span>${fdate(c.date)}${c.final ? ' · final' : ''}</span>${c.value ? html`<b>${c.value}</b>` : ''}</button>`)}${(g.checks || []).length ? '' : html`<span class="mut sm">Sin checkpoints.</span>`}</div>
            <button class="sm mut" data-act="gckadd" data-g="${g.i}" style="margin-top:6px">+ checkpoint</button></div>
        </div></div>`;
    }
    const saveGoals = async (goals) => { if (await saveAcc({ ...a, goals })) paint(); };
    const G = () => JSON.parse(JSON.stringify(goalsOf(a)));

    function roadmapPdf() {
      const rm = goalsOf(a);
      docView(html`${docHead('Roadmap', html`${a.name}<br>${fdateLong(today())}`)}
        <div class="qto"><div><div class="lbl2">CLIENTE</div><b style="font-weight:500;font-size:15px">${a.name}</b>${cleanPlan(info.plan) ? html`<div>${cleanPlan(info.plan)}</div>` : ''}</div>
          <div><div class="lbl2">AVANCE</div><b style="font-weight:500;font-size:15px">${rm.filter((x) => x.status === 'done').length} de ${rm.length} metas logradas</b></div></div>
        ${rm.map((g) => { const pct = pctOf(g), h = healthOf(g); return html`<div class="pgoal"><div class="row"><b style="font-weight:500;font-size:15px">${g.goal}</b><div class="sp"></div><span style="color:#7a5d46;font-size:12px">${g.due ? fdateLong(g.due) : ''}</span></div>
          <div style="font-size:11px;letter-spacing:1px;font-weight:700;color:${g.status === 'done' ? '#755943' : '#9f846d'}">${(RM[g.status]?.[0] || 'Pendiente').toUpperCase()}${h ? ' · ' + HEALTH[h][0].toUpperCase() : ''}</div>
          ${g.metric ? html`<div style="font-size:12.5px;margin-top:6px"><b style="font-weight:500">Cómo se mide:</b> ${g.metric} · hoy ${g.current || g.baseline || '—'} → meta ${g.target || '—'}${pct == null ? '' : ` (${pct}%)`}</div>` : ''}
          ${(g.tasks || []).length ? html`<div style="font-size:12.5px;margin-top:6px"><b style="font-weight:500">Desglose:</b> ${g.tasks.map((t) => (t.done ? '✓ ' : '○ ') + t.t).join(' · ')}</div>` : ''}
          ${(g.checks || []).length ? html`<div style="font-size:12.5px;margin-top:4px"><b style="font-weight:500">Checkpoints:</b> ${g.checks.map((c) => `${fdate(c.date)}${c.done ? ` ✓${c.value ? ' ' + c.value : ''}` : ''}`).join(' · ')}</div>` : ''}
          ${(a.mentors || []).filter((x) => x.goal === rm.indexOf(g)).map((x) => { const m = mentors.find((y) => y.id === x.id); return m ? html`<div style="font-size:12.5px;margin-top:4px"><b style="font-weight:500">Especialista:</b> ${m.name} · ${m.industry}</div>` : ''; })}
          ${g.note ? html`<div style="color:#5a4331;font-size:12.5px;margin-top:4px">${g.note}</div>` : ''}</div>`; })}
        <div class="qfoot"><span>Inherent · Growth Operator</span><span>inherentglobal.com</span></div>`);
    }

    acts(el, {
      jump: (t) => $('#s-' + t.dataset.k, el)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      pdf: roadmapPdf,
      mkdrive: async (t) => { t.disabled = true; t.textContent = 'Creando…'; try { const r = await api('drive/client', { method: 'POST', body: { slug, growth: isGrowth() } }); const fresh = await AC.get(a.id).catch(() => null); a = { ...(fresh || a), drive: r.drive, drive_dirs: r.dirs, assets: (fresh || a).assets || r.dirs['01 Assets de marca'] }; toast('Drive creado y conectado'); paint(); } catch (e) { toast(e.message, true); t.disabled = false; t.textContent = 'Crear carpetas'; } },
      esadd: async () => {
        if (!mentors.length) return toast('Primero carga la red en Sales → Especialistas', true);
        const goals = goalsOf(a);
        const v = await ask('Agregar especialista', [
          { k: 'id', l: 'Especialista', t: 'select', req: true, opts: [...mentors].sort((x, z) => (x.industry + x.price).localeCompare(z.industry + z.price)).map((m) => [m.id, `${m.industry} · ${m.name} · ${priceLabel(m)}`]) },
          { k: 'cadence', l: 'Cada cuánto', t: 'select', opts: CADENCE, v: /compound/i.test(info?.plan || '') ? 'mensual' : 'trimestral', half: true },
          { k: 'goal', l: 'Para qué meta del roadmap', t: 'select', opts: [['', '— Ninguna'], ...goals.map((g, i) => [String(i), g.goal])], half: true },
          { k: 'note', l: 'Para qué lo traemos', t: 'textarea' },
        ], 'Agregar');
        if (!v) return;
        const m = mentors.find((x) => x.id === v.id);
        if (m && fit(m)[1] === 'red' && isGrowth() && !(await confirmAsk(`${m.name} pasa el techo por sesión del plan: va como add-on facturado al cliente. ¿Agregarlo igual?`))) return;
        if (await saveAcc({ ...a, mentors: [...(a.mentors || []), { id: v.id, cadence: v.cadence, goal: v.goal === '' ? null : +v.goal, note: v.note }] })) { toast('Especialista agregado'); paint(); }
      },
      esdel: async (t) => { if (!(await confirmAsk('¿Quitar este especialista del cliente?'))) return; if (await saveAcc({ ...a, mentors: a.mentors.filter((_, k) => k !== +t.dataset.k) })) paint(); },
      portalAdd: async () => {
        const v = await ask(`Acceso al portal de ${a.name}`, [{ k: 'email', l: 'Correo de Google de la persona del cliente', t: 'email', req: true }, { k: 'name', l: 'Nombre' }], 'Dar acceso');
        if (!v) return; const email = v.email.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast('Ese correo no es válido', true);
        try { const r = await col('team').create({ id: email, email, name: v.name || email.split('@')[0], role: 'client', client_slug: slug, active: true }); portalPeople = [...portalPeople, r]; toast('Listo Ya puede entrar con Google en «Soy cliente»'); paint(); } catch (e) { toast(e.message, true); }
      },
      portalDel: async (t) => { if (!(await confirmAsk('¿Quitarle el acceso al portal?'))) return; try { await col('team').remove(t.dataset.id); portalPeople = portalPeople.filter((x) => x.id !== t.dataset.id); paint(); } catch (e) { toast(e.message, true); } },
      gadd: async () => { const g = await goalWizard(); if (g) { await saveGoals([...G(), g]); toast('Meta agregada'); } },
      gst: async (t) => { const g = G(); const x = g[+t.dataset.g]; x.status = { todo: 'now', now: 'done', done: 'todo' }[x.status] || 'now'; await saveGoals(g); },
      gedit: async (t) => { const g = G(); const x = g[+t.dataset.g]; const v = await ask('Editar meta', [{ k: 'goal', l: 'Meta', v: x.goal, req: true }, { k: 'metric', l: 'Cómo se mide', v: x.metric }, { k: 'baseline', l: 'Al arrancar', v: x.baseline, half: true }, { k: 'current', l: 'Hoy', v: x.current, half: true }, { k: 'target', l: 'Meta', v: x.target, half: true }, { k: 'due', l: 'Para cuándo', t: 'date', v: x.due, half: true }, { k: 'note', l: 'Nota (sale en el PDF)', t: 'textarea', v: x.note }]); if (!v) return; g[+t.dataset.g] = { ...x, ...v }; await saveGoals(g); },
      gdel: async (t) => { if (!(await confirmAsk('¿Quitar esta meta?'))) return; await saveGoals(G().filter((_, i) => i !== +t.dataset.g)); },
      gtask: async (cb) => { const g = G(); g[+cb.dataset.g].tasks[+cb.dataset.k].done = cb.checked; await saveGoals(g); },
      gtadd: async (t) => { const v = await ask('Nueva tarea de la meta', [{ k: 't', l: 'Tarea', req: true }]); if (!v) return; const g = G(); g[+t.dataset.g].tasks = [...(g[+t.dataset.g].tasks || []), { t: v.t, done: false }]; await saveGoals(g); },
      gckadd: async (t) => { const v = await ask('Nuevo checkpoint', [{ k: 'date', l: 'Fecha', t: 'date', req: true }]); if (!v) return; const g = G(); const x = g[+t.dataset.g]; x.checks = [...(x.checks || []), { date: v.date, done: false }].sort((p, q) => p.date.localeCompare(q.date)); await saveGoals(g); },
      gcheck: async (t) => {
        const g = G(); const x = g[+t.dataset.g]; const c = x.checks[+t.dataset.k];
        const v = await ask(`Checkpoint · ${fdate(c.date)}`, [{ k: 'value', l: `¿Cuánto va? (${x.metric || 'la métrica'})`, v: c.value || x.current, half: true }, { k: 'health', l: '¿Cómo vamos?', t: 'select', opts: Object.entries(HEALTH).map(([k, [l]]) => [k, l]), v: c.health || 'ok', half: true }, { k: 'note', l: 'Qué pasó y qué ajustamos', t: 'textarea', v: c.note }], 'Registrar');
        if (!v) return; x.checks[+t.dataset.k] = { ...c, ...v, done: true }; if (v.value) x.current = v.value; await saveGoals(g);
      },
      mtsched: async (t) => { const p = projects.find((x) => x.id === t.dataset.p); const r = p && (await schedule(p, +t.dataset.i, team, me)); if (r) { Object.assign(p, r); paint(); } },
      mtdone: async (t) => { const p = projects.find((x) => x.id === t.dataset.p); const r = p && (await markDone(p, +t.dataset.i)); if (r) { Object.assign(p, r); paint(); } },
      editAcc: async () => { const v = await ask('Datos del cliente', [{ k: 'name', l: 'Nombre', v: a.name, req: true }, { k: 'contact', l: 'Contacto', v: a.contact, half: true }, { k: 'phone', l: 'Teléfono / WhatsApp', v: a.phone, half: true }, { k: 'email', l: 'Correo', t: 'email', v: a.email }, { k: 'assets', l: 'Carpeta de assets en Drive (logos, fotos, videos crudos)', v: a.assets }, { k: 'notes', l: 'Notas', t: 'textarea', v: a.notes }]); if (v && v.assets && !/^https:\/\/drive\.google\.com\//.test(v.assets)) return toast('La carpeta de assets debe ser un link de Google Drive', true); if (v && (await saveAcc({ ...a, ...v }))) { toast('Guardado'); paint(); } },
      acadd: async () => { const v = await ask('Nuevo acceso', [{ k: 'servicio', l: 'Cuenta o servicio', req: true }, { k: 'usuario', l: 'Usuario', half: true }, { k: 'donde', l: 'Dónde está la clave', half: true }]); if (!v) return; if (/contrase|password|clave:/i.test(v.usuario + ' ' + v.donde) && !(await confirmAsk('Parece que escribiste una contraseña. Aquí solo va DÓNDE está. ¿Guardar igual?'))) return; if (await saveAcc({ ...a, accesos: [...(a.accesos || []), v] })) paint(); },
      acdel: async (t) => { if (await saveAcc({ ...a, accesos: (a.accesos || []).filter((_, i) => i !== +t.dataset.i) })) paint(); },
      tdone: async (cb) => { const t = tasks.find((x) => x.id === cb.dataset.id); try { Object.assign(t, await col('tasks').save({ ...t, status: cb.checked ? 'Hecha' : 'En curso' })); paint(); } catch (e) { cb.checked = !cb.checked; toast(e.message, true); } },
    });
    paint();
  }
}
