import { html, mount, col, api, Q, K, USD, fdate, today, ask, toast, acts, matrix, IC, lineChart, $ } from '../core.js';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening'; };

export async function render(el, { me }) {
  const can = (a) => me.areas.includes(a);
  const [leads, tasks, finance, content] = await Promise.all([
    can('sales') ? col('leads').list() : [], col('tasks').list(),
    can('finanzas') ? col('finance').list() : [], col('content').list().catch(() => []),
  ]);
  const first = (me.name || '').split(' ')[0];

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
  const mine = tasks.filter((t) => t.assignee === me.email && t.status !== 'Hecha').sort((a, b) => String(a.due || '9').localeCompare(String(b.due || '9')));

  function paint() {
    mount(el, html`
      <div class="hello"><h1>${greet()}, ${first}.</h1><p>Esto es lo que pasa hoy en <em>Inherent</em>.</p></div>
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
          <div class="big">—</div>
          <div class="mut sm" style="margin-top:14px">Se llena con las métricas de Content (fase 4).</div>
        </div>
      </div>
      <div class="grid g2" style="margin-top:18px">
        ${can('finanzas') ? html`<div class="card">
          <div class="chead"><div class="ico">↗</div><h3>Revenue · últimos 8 meses</h3><span class="chip" style="margin-left:auto">Quetzales</span></div>
          ${revSeries.some(Boolean) ? html`<div class="chart" id="chHome"></div>` : html`<div class="empty" style="margin-top:20px"><b>Sin ingresos registrados</b>La gráfica aparece cuando cargues ingresos en Finance.</div>`}
        </div>` : html`<div></div>`}
        <div class="card todo">
          <div class="chead"><div class="ico">✓</div><h3>Mis tareas</h3><button class="btn ghost" style="margin-left:auto;padding:8px 14px" data-act="addTask">+ Tarea</button></div>
          ${mine.length ? html`<ul>${mine.slice(0, 6).map((t) => html`<li><input type="checkbox" data-act="done" data-id="${t.id}"><span>${t.title}</span><span class="who mut sm">${t.due ? fdate(t.due) : ''}</span></li>`)}</ul>`
            : html`<div class="empty" style="margin-top:8px"><b>Nada pendiente</b>Tus tareas de Operations aparecen aquí.</div>`}
        </div>
      </div>
      <div class="sec-title"><h2>Content</h2><a href="#/content">Ver todo →</a></div>
      ${content.length ? html`<div class="grid g4">${content.slice(-4).reverse().map((c, i) => html`<div class="card"><div class="thumb t${(i % 4) + 1}"><span class="chip tag">${c.format || 'Pieza'}</span><div class="play">▶</div></div><b style="font-weight:500">${c.title}</b></div>`)}</div>`
        : html`<div class="empty"><b>Aún no hay contenido</b>Los guiones e ideas de Content aparecen aquí (fase 4).</div>`}`);
    const ch = $('#chHome', el);
    if (ch) lineChart(ch, months.map((m) => MONTHS[+m.slice(5) - 1]), [{ name: 'Revenue', v: revSeries, c: '#171410', fill: true }]);
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
