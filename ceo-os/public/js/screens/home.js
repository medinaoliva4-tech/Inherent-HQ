import { html, raw, mount, col, api, Q, K, USD, fdate, today, ask, toast, acts, matrix, IC, $ , calQ, calAll, setCalAll, teamList } from '../core.js';
import { bdayText } from './me.js';
import { videoCard } from './content.js';
import { connectNotice, hookNotice } from '../connectai.js';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening'; };

export async function render(el, { me, alive }) {
  const can = (a) => me.areas.includes(a);
  const [leads, tasks, finance, content] = await Promise.all([
    can('sales') ? col('leads').list() : [], col('tasks').list(),
    can('finanzas') ? col('finance').list() : [], col('content').list().catch(() => []),
  ]);
  const first = (me.name || '').split(' ')[0];
  // Cumpleaños del equipo: hoy y los próximos 7 días.
  const people = me.role === 'client' ? [] : await teamList().catch(() => []);
  const md = (d) => d.toISOString().slice(5, 10);
  const soon = Array.from({ length: 8 }, (_, i) => md(new Date(Date.now() + i * 864e5)));
  const bdays = people.filter((p) => p.active !== false && p.birthday && soon.includes(p.birthday)).sort((a, z) => soon.indexOf(a.birthday) - soon.indexOf(z.birthday));
  let agenda = null, agErr = null;
  let week = null, weekP = null;
  if (can('content')) Promise.all(['inherent', 'personal'].map((p) => api(`content/week?profile=${p}`).catch(() => null))).then(([a, b]) => { week = a; weekP = b; if (alive()) paint(); });
  // Engagement en vivo de Windsor (lo mismo que Content → Analytics); el scrape semanal queda de respaldo.
  let igI = null, igP = null;
  if (can('content')) Promise.all(['inherent', 'personal'].map((p) => api(`analytics/instagram?profile=${p}&days=30`).catch((e) => ({ error: e.message })))).then(([a, b]) => { igI = a; igP = b; if (alive()) paint(); });
  const loadAgenda = () => api(`google/calendar?from=${today()}&to=${today()}${calQ()}`).then((r) => { agenda = r.events; agErr = null; if (alive()) paint(); }).catch((e) => { agErr = e.message; agenda = []; if (alive()) paint(); });
  loadAgenda();
  // La agenda se actualiza al volver a la pestaña y cada 2 minutos.
  const iv = setInterval(() => (alive() ? document.visibilityState === 'visible' && loadAgenda() : clearInterval(iv)), 120000);
  const onVis = () => { if (!alive()) return document.removeEventListener('visibilitychange', onVis); if (document.visibilityState === 'visible') loadAgenda(); };
  document.addEventListener('visibilitychange', onVis);

  // Revenue real: entradas de Finance tipo ingreso
  const ym = (d) => String(d || '').slice(0, 7);
  const now = new Date(); const thisM = today().slice(0, 7);
  const months = Array.from({ length: 8 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 7 + i, 1); return d.toISOString().slice(0, 7); });
  const inc = (m) => finance.filter((f) => f.type === 'ingreso' && ym(f.date) === m).reduce((a, f) => a + (+f.amount || 0), 0);
  const exp = (m) => finance.filter((f) => f.type === 'gasto' && ym(f.date) === m).reduce((a, f) => a + (+f.amount || 0), 0);
  const revNow = inc(thisM), costNow = exp(thisM), revSeries = months.map(inc);

  const open = leads.filter((l) => !['Ganado', 'Perdido'].includes(l.stage));
  const hot = open.filter((l) => (l.interest || 0) >= 4);
  const pipe = open.reduce((a, l) => a + (+l.value_usd || 0), 0);
  const next = content.filter((c) => c.kind === 'post' && c.status !== 'Publicado').sort((a, b) => String(a.date || '9').localeCompare(String(b.date || '9'))).slice(0, 3);
  const mine = tasks.filter((t) => t.assignee === me.email && t.status !== 'Hecha').sort((a, b) => String(a.due || '9').localeCompare(String(b.due || '9')));

  // Para el equipo: el resumen de su trabajo (el detalle está en su Workspace).
  function summary() {
    const late = mine.filter((t) => t.due && t.due < today()).length, rev = tasks.filter((t) => t.assignee === me.email && t.status === 'En revisión').length;
    return html`<div class="card feat olive"><div class="chead"><div class="ico">✓</div><h3>Mi trabajo<br><span class="lbl">Lo tuyo esta semana</span></h3><a class="arrow" href="#/work">↗</a></div>
      <div class="lbl">Pendientes</div><div class="big">${mine.length}${late ? html`<small> · ${late} atrasada${late === 1 ? '' : 's'}</small>` : ''}</div>
      ${matrix(Math.min(34, mine.length * 3))}
      <div class="foot"><span>${rev} en revisión</span><span>Abrir mi Workspace →</span></div></div>`;
  }
  function paint() {
    mount(el, html`
      <div class="hello"><h1>${greet()}, ${first}.</h1><p>Esto es lo que pasa hoy en <em>Inherent</em>.</p></div>
      ${bdays.length ? html`<div class="bday">${bdays.map((p) => { const isToday = p.birthday === soon[0], mine = (p.email || p.id) === me.email;
        return html`<span class="bdi ${isToday ? 'now' : ''}">${p.picture ? html`<img src="${p.picture}" alt="" referrerpolicy="no-referrer">` : ''}${isToday ? (mine ? html`🎉 <b>¡Feliz cumpleaños, ${first}!</b>` : html`🎂 <b>Hoy cumple ${p.name.split(' ')[0]}</b> · ¡felicítalo!`) : html`🎂 ${p.name.split(' ')[0]} cumple el ${bdayText(p.birthday)}`}</span>`; })}</div>` : ''}
      ${connectNotice(me)}
      ${me.role === 'ceo' && !tasks.length ? html`<a class="asbar" href="#/setup" style="display:flex">⚙ La app todavía está vacía: <b>haz el Arranque</b> (4 pasos) y queda lista con lo que ya dice el repo →</a>` : ''}
      <div class="grid g3">
        ${can('finanzas') ? html`<div class="card feat olive">
          <div class="chead"><div class="ico">${IC.ring(78)}<span style="font-size:15px">◎</span></div><h3>Revenue<br><span class="lbl">${MONTHS[now.getMonth()]} ${now.getFullYear()}</span></h3><a class="arrow" href="#/finanzas">↗</a></div>
          <div class="lbl">Facturado este mes</div>
          <div class="big">${revNow ? html`<span class="cur">Q</span>${K(revNow)}` : '—'}</div>
          ${matrix(revNow ? Math.min(34, Math.round((revNow / Math.max(...revSeries, 1)) * 34)) : 0)}
          <div class="foot"><span>${revNow ? `Gross ${Q(revNow - costNow)} · Cost ${Q(costNow)}` : 'Se llena con los ingresos de Finance'}</span></div>
        </div>` : ''}
        ${can('sales') ? html`<div class="card feat terra">
          <div class="chead"><div class="ico">${IC.ring(46)}<span style="font-size:15px">☺</span></div><h3>Leads<br><span class="lbl">Pipeline abierto</span></h3><a class="arrow" href="#/sales">↗</a></div>
          <div class="lbl">Leads activos</div>
          <div class="big">${open.length}<small> · ${hot.length} 🔥</small></div>
          ${matrix(Math.min(34, open.length * 2))}
          <div class="foot"><span>Pipeline ${USD(pipe)} / mes</span><span>${leads.filter((l) => l.stage === 'Ganado').length} ganados</span></div>
        </div>` : ''}
        ${!can('content') ? summary() : ''}
        ${!can('content') ? '' : html`<div class="card">
          <div class="chead"><div class="ico">♡</div><h3>Engagement<br><span class="mut sm">Personal + Inherent</span></h3><a class="arrow" href="#/content">↗</a></div>
          ${(() => {
            // Por perfil: primero Windsor (en vivo, 30 días); si no trae, la foto del último scrape.
            const pick = (ig, wk) => (ig?.matched && ig.er != null ? { er: ig.er, reach: ig.reach, days: ig.erDays, src: 'w' } : wk?.analytics?.at(-1)?.er != null ? { er: wk.analytics.at(-1).er, views: wk.analytics.at(-1).avgViews, src: 's' } : null);
            const e1 = pick(igI, week), e2 = pick(igP, weekP);
            if (e1 || e2) return html`<div class="split" style="margin-top:6px"><div><span class="lbl">Inherent</span><b style="font-size:34px;font-weight:500">${e1 ? e1.er + '%' : '—'}</b></div><div><span class="lbl">Personal</span><b style="font-size:34px;font-weight:500">${e2 ? e2.er + '%' : '—'}</b></div></div>
              <div class="mut sm" style="margin-top:12px">${[e1, e2].some((x) => x?.src === 'w') ? `Instagram, últimos ${Math.max(e1?.days || 0, e2?.days || 0) || 30} días${e1?.reach || e2?.reach ? ` · alcance ${K((e1?.reach || 0) + (e2?.reach || 0))}` : ''}` : 'Engagement de la última semana'}</div>`;
            if (igI === null && igP === null) return html`<p class="loading">Cargando…</p>`;
            // Sin datos: decir exactamente por qué, para saber qué arreglar.
            const why = [['Inherent', igI], ['Personal', igP]].map(([n, r]) => r?.error ? `${n}: ${/api key/i.test(r.error) ? 'la API key de Windsor no es válida (Vercel → WINDSOR_API_KEY)' : r.error.replace(/\{.*\}/, '').trim()}` : r?.connected === false ? 'Falta conectar Windsor (WINDSOR_API_KEY)' : r && !r.handles?.length ? `${n}: falta su cuenta de Instagram en Content → Fuentes` : r && !r.matched ? `${n}: Windsor no trae @${r.handles.join(', @')}${r.accounts?.length ? ` (trae: @${r.accounts.slice(0, 3).join(', @')})` : ''}` : '').filter(Boolean);
            return html`<div class="big">—</div><div class="mut sm" style="margin-top:14px">${why.length ? why.map((w) => html`<div>${w}</div>`) : 'Todavía sin datos.'}</div>`; })()}
        </div>`}
      </div>
      <div class="grid g2" style="margin-top:18px">
        ${!can('content') ? html`<div class="card"><div class="chead"><div class="ico">▤</div><h3>Library<br><span class="mut sm">SOPs, prompts y plantillas de tu perfil</span></h3><a class="arrow" href="#/library">↗</a></div>
          <div class="mut sm">Todo lo que necesitas para entregar está en tu <a href="#/work" style="color:inherit">Workspace</a>: tus tareas, el material de cada cliente y dónde subir tu entrega.</div></div>` : ''}
        ${!can('content') ? '' : html`<div class="card">
          ${(() => {
            // UNA sola vista de Content: los ganadores del nicho (scrape semanal); si aún no corre,
            // tus mejores posts reales de Instagram (Windsor). Nunca los dos.
            const niche = week?.result?.top || [];
            const own = [[igI, 'inherent'], [igP, 'personal']].flatMap(([r]) => (r?.matched ? (r.top || []).map((x) => ({ url: x.url, thumb: x.thumb, handle: r.handles?.[0] || '', red: 'instagram', at: x.date, views: x.views, likes: x.likes, comments: x.comments, text: x.caption, eng: x.eng })) : [])).sort((x, z) => z.eng - x.eng);
            const [title, sub, list] = niche.length ? ['Content esta semana', 'Lo que más rinde en tu nicho', niche] : ['Tu mejor contenido', 'Instagram, últimos 30 días', own];
            return html`<div class="chead"><div class="ico">▶</div><h3>${title}<br><span class="mut sm">${sub}</span></h3><a class="arrow" href="#/content">↗</a></div>
              ${week === null && igI === null ? html`<p class="loading">Cargando…</p>` : list.length ? html`<div class="grid homevids">${list.slice(0, 3).map(videoCard)}</div>`
                : html`<div class="empty" style="margin-top:10px"><b>${week?.status === 'running' ? 'Apify está scrapeando…' : 'Sin videos todavía'}</b>${niche.length || own.length ? '' : 'El scrape del nicho corre cada lunes (Content → Fuentes). Tus posts salen de Windsor.'}</div>`}`; })()}
          ${next.length ? html`<div class="lbl" style="margin-top:16px">Lo próximo por postear</div>${next.map((p) => html`<a class="agenda" href="#/content/postear/${p.profile}" style="text-decoration:none;color:inherit"><span class="t">${p.date ? fdate(p.date) : '—'}</span><span class="bar2" style="background:#c2735a"></span><div><b style="font-weight:500">${p.title}</b><div class="mut sm">${p.format || 'Pieza'} · ${p.status || 'Idea'}</div></div></a>`)}` : ''}
        </div>`}
        <div class="card todo">
          <div class="chead"><div class="ico">✓</div><h3>Hoy</h3><span class="gbadge" style="margin-left:auto">${IC.cal} Google Calendar</span><button class="btn ghost" style="padding:8px 14px" data-act="addTask">+ Tarea</button></div>
          ${agenda === null ? html`<p class="mut sm">Cargando tu agenda…</p>` : agErr ? html`<div class="mut sm" style="margin-bottom:8px">Calendar: ${agErr}</div>`
            : agenda.length ? agenda.slice(0, 3).map((e) => html`<a class="agenda" href="${e.link}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit"><span class="t">${e.allDay ? 'Día' : String(e.start).slice(11, 16)}</span><span class="bar2" style="background:#7f9631"></span><div><b style="font-weight:500">${e.summary}</b>${e.meet ? html`<div class="mut sm">Google Meet</div>` : e.location ? html`<div class="mut sm">${e.location}</div>` : ''}</div></a>`)
            : html`<div class="mut sm" style="margin-bottom:8px">Sin eventos hoy en tu calendario.</div>`}
          ${mine.length ? html`<ul>${mine.slice(0, 6).map((t) => html`<li><input type="checkbox" data-act="done" data-id="${t.id}"><span>${t.title}</span><span class="who mut sm">${t.due ? fdate(t.due) : ''}</span></li>`)}</ul>`
            : html`<div class="empty" style="margin-top:8px"><b>Nada pendiente</b>Tus tareas aparecen aquí.</div>`}
        </div>
      </div>`);
  }

  acts(el, {
    done: async (cb) => {
      const t = tasks.find((x) => x.id === cb.dataset.id);
      try { Object.assign(t, await col('tasks').save({ ...t, status: 'Hecha' })); toast('Tarea hecha ✅'); setTimeout(() => { mine.splice(mine.indexOf(t), 1); paint(); }, 500); }
      catch (e) { cb.checked = false; toast(e.message, true); }
    },
    addTask: async () => {
      const { newTask } = await import('../create.js'); const { teamList } = await import('../core.js');
      const t = await newTask({ team: await teamList(), me, projects: await col('projects').list(), pre: { assignee: me.email } });
      if (t) { tasks.push(t); mine.push(t); paint(); }
    },
  }, 'click');
  hookNotice(el, me, () => alive() && paint());
  paint();
}
