import { html, raw, mount, col, api, Q, K, USD, fdate, today, ask, toast, acts, matrix, IC, $ } from '../core.js';
import { videoCard } from './content.js';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening'; };

export async function render(el, { me, alive }) {
  const can = (a) => me.areas.includes(a);
  const [leads, tasks, finance, content] = await Promise.all([
    can('sales') ? col('leads').list() : [], col('tasks').list(),
    can('finanzas') ? col('finance').list() : [], col('content').list().catch(() => []),
  ]);
  const first = (me.name || '').split(' ')[0];
  let agenda = null, agErr = null;
  let week = null, weekP = null;
  if (can('content')) Promise.all(['inherent', 'personal'].map((p) => api(`content/week?profile=${p}`).catch(() => null))).then(([a, b]) => { week = a; weekP = b; if (alive()) paint(); });
  const loadAgenda = () => api(`google/calendar?from=${today()}&to=${today()}`).then((r) => { agenda = r.events; agErr = null; if (alive()) paint(); }).catch((e) => { agErr = e.message; agenda = []; if (alive()) paint(); });
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

  function paint() {
    mount(el, html`
      <div class="hello"><h1>${greet()}, ${first}.</h1><p>Esto es lo que pasa hoy en <em>Inherent</em>.</p></div>
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
        <div class="card">
          <div class="chead"><div class="ico">♡</div><h3>Engagement<br><span class="mut sm">Personal + Inherent</span></h3><a class="arrow" href="#/content">↗</a></div>
          ${(() => { const e1 = week?.analytics?.at(-1), e2 = weekP?.analytics?.at(-1);
            return e1 || e2 ? html`<div class="split" style="margin-top:6px"><div><span class="lbl">Inherent</span><b style="font-size:34px;font-weight:500">${e1?.er ?? '—'}${e1?.er != null ? '%' : ''}</b></div><div><span class="lbl">Personal</span><b style="font-size:34px;font-weight:500">${e2?.er ?? '—'}${e2?.er != null ? '%' : ''}</b></div></div><div class="mut sm" style="margin-top:12px">Engagement de la última semana · vistas promedio ${K(e1?.avgViews || e2?.avgViews || 0)}</div>`
              : html`<div class="big">—</div><div class="mut sm" style="margin-top:14px">Se llena con el scrape semanal de tus cuentas.</div>`; })()}
        </div>
      </div>
      <div class="grid g2" style="margin-top:18px">
        <div class="card">
          <div class="chead"><div class="ico">▶</div><h3>Content esta semana<br><span class="mut sm">Lo que más rinde en tu nicho</span></h3><a class="arrow" href="#/content">↗</a></div>
          ${!can('content') ? '' : week === null ? html`<p class="loading">Cargando…</p>` : week?.result?.top?.length ? html`<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:12px">${week.result.top.slice(0, 3).map(videoCard)}</div>`
            : html`<div class="empty" style="margin-top:10px"><b>${week?.status === 'running' ? 'Apify está scrapeando…' : 'Sin semana todavía'}</b>El scrape corre cada lunes. Configura el nicho en Content → Fuentes.</div>`}
          ${next.length ? html`<div class="lbl" style="margin-top:16px">Lo próximo por postear</div>${next.map((p) => html`<a class="agenda" href="#/content/postear/${p.profile}" style="text-decoration:none;color:inherit"><span class="t">${p.date ? fdate(p.date) : '—'}</span><span class="bar2" style="background:#c2735a"></span><div><b style="font-weight:500">${p.title}</b><div class="mut sm">${p.format || 'Pieza'} · ${p.status || 'Idea'}</div></div></a>`)}` : ''}
        </div>
        <div class="card todo">
          <div class="chead"><div class="ico">✓</div><h3>Hoy</h3><span class="gbadge" style="margin-left:auto">${IC.cal} Google Calendar</span><button class="btn ghost" style="padding:8px 14px" data-act="addTask">+ Tarea</button></div>
          ${agenda === null ? html`<p class="mut sm">Cargando tu agenda…</p>` : agErr ? html`<div class="mut sm" style="margin-bottom:8px">Calendar: ${agErr}</div>`
            : agenda.length ? agenda.slice(0, 3).map((e) => html`<a class="agenda" href="${e.link}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit"><span class="t">${e.allDay ? 'Día' : String(e.start).slice(11, 16)}</span><span class="bar2" style="background:#7f9631"></span><div><b style="font-weight:500">${e.summary}</b>${e.meet ? html`<div class="mut sm">Google Meet</div>` : e.location ? html`<div class="mut sm">${e.location}</div>` : ''}</div></a>`)
            : html`<div class="mut sm" style="margin-bottom:8px">Sin eventos hoy en tu calendario.</div>`}
          ${mine.length ? html`<ul>${mine.slice(0, 6).map((t) => html`<li><input type="checkbox" data-act="done" data-id="${t.id}"><span>${t.title}</span><span class="who mut sm">${t.due ? fdate(t.due) : ''}</span></li>`)}</ul>`
            : html`<div class="empty" style="margin-top:8px"><b>Nada pendiente</b>Tus tareas de Operations aparecen aquí.</div>`}
        </div>
      </div>
      <div class="sec-title"><h2>Content</h2><a href="#/content">Ver todo →</a></div>
      ${week?.result?.top?.length > 3 ? html`<div class="grid g5">${week.result.top.slice(3, 8).map(videoCard)}</div>`
        : html`<div class="empty"><b>Aún no hay videos</b>Los winners de la semana aparecen aquí.</div>`}`);
  }

  acts(el, {
    done: async (cb) => {
      const t = tasks.find((x) => x.id === cb.dataset.id);
      try { Object.assign(t, await col('tasks').save({ ...t, status: 'Hecha' })); toast('Tarea hecha ✅'); setTimeout(() => { mine.splice(mine.indexOf(t), 1); paint(); }, 500); }
      catch (e) { cb.checked = false; toast(e.message, true); }
    },
    addTask: async () => {
      const v = await ask('Nueva tarea', [{ k: 'title', l: 'Tarea', req: true }, { k: 'due', l: 'Vence', t: 'date', half: true }]);
      if (!v) return;
      const t = await col('tasks').create({ ...v, assignee: me.email, status: 'Por empezar' });
      tasks.push(t); mine.push(t); paint(); toast('Tarea creada ✅');
    },
  }, 'click');
  paint();
}
