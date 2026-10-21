// Centro de control (#/control-hub): las herramientas de la empresa en un solo lugar, para el CEO y el COO.
// Arriba una grilla de tiles (qué es cada una y un número vivo); al tocar una, se abre ADENTRO
// (#/control-hub/<herramienta>/…) con un menú lateral en escritorio y chips arriba en el cel.
// Nada se duplica: cada herramienta es la pantalla de siempre montada como isla (como el CRM dentro de Clientes).
import { html, mount, col, api, today, ico, $, isSummary } from '../core.js';

const OPEN_LEAD = ['Nuevo', 'Contactado', 'Reunión', 'Propuesta'];
// [clave, nombre, qué es, icono, pantalla, área que hace falta | 'ceo']
const TOOLS = [
  ['control', 'Control del flujo', 'De lead a entrega: el embudo y lo que necesita atención', 'target', 'control', 'control'],
  ['operations', 'Proyectos', 'Pipeline, calendario y timeline de cada proyecto', 'layers', 'operations', 'operations'],
  ['work', 'Mis tareas', 'Lo tuyo para organizarte: hoy, atrasadas, decisiones y lo que viene', 'list', 'work', 'work'],
  ['sales', 'Comercial · CRM', 'Leads, cotizaciones, especialistas y fuentes', 'megaphone', 'sales', 'sales'],
  ['finanzas', 'Finanzas', 'Movimientos, costos, rentabilidad y pagos por servicio', 'bars', 'finance', 'finanzas'],
  ['resultados', 'Indicadores', 'Lo que de verdad pasó: leads, entregas, ingresos y metas', 'star', 'results', 'resultados'],
  ['responsabilidades', 'Responsabilidades', 'Quién hace qué en cada paquete y servicio', 'clipboard', 'services', 'sales'],
  ['vistas', 'Vistas por rol', 'Qué ve cada perfil, qué tan a fondo y dónde abre', 'eye', 'team', 'ceo'],
  ['setup', 'Arranque', 'Dejar la app lista desde el repo', 'rocket', 'setup', 'ceo'],
];

export async function render(el, { me, sub = [], alive }) {
  // Responsabilidades pide ver Comercial completo (como Servicios); lo demás, ver su sección.
  const ok = ([k, , , , , need]) => (need === 'ceo' ? me.role === 'ceo' : me.areas.includes(need) && (k !== 'responsabilidades' || !isSummary(me, 'sales')));
  const tools = TOOLS.filter(ok);
  const cur = tools.find(([k]) => k === sub[0]);
  if (sub[0] && !cur) { history.replaceState(null, '', '#/control-hub'); }
  if (cur) return open(cur);
  return grid();

  // ---------- la grilla ----------
  async function grid() {
    const T = today(), M = T.slice(0, 7), has = (k) => tools.some(([x]) => x === k);
    const N = {}; // clave → [número, etiqueta]
    const paint = () => {
      if (!alive()) return;
      mount(el, html`<div class="hello sp-hero"><h1>Centro de control</h1><p>Las herramientas de la empresa, <em>en un solo lugar</em>. Toca una para abrirla aquí.</p></div>
        <div class="hub-grid">${tools.map(([k, name, what, ic]) => { const n = N[k]; return html`<a class="sp-tile hub-tile" href="#/control-hub/${k}">
          <div class="row" style="gap:10px;align-items:center"><span class="hub-ic">${ico(ic, 18)}</span><b class="hub-name">${name}</b><span class="sp-tile-go">↗</span></div>
          <div class="mut sm hub-what">${what}</div>
          <div class="hub-num"><b>${n === undefined ? '…' : n?.[0] ?? '—'}</b><span class="mut sm">${n?.[1] || (n === undefined ? 'Cargando' : 'Sin dato')}</span></div></a>`; })}</div>`);
    };
    paint();
    const [leads, quotes, projects, tasks, fin, recs, rv, repo] = await Promise.all([
      has('sales') ? col('leads').list().catch(() => null) : null, has('sales') ? col('quotes').list().catch(() => null) : null,
      col('projects').list().catch(() => null), col('tasks').list().catch(() => null),
      has('finanzas') ? col('finance').list().catch(() => null) : null,
      has('responsabilidades') ? col('recipes').list().catch(() => null) : null,
      has('vistas') ? col('settings').get('role_views').catch(() => null) : null,
      has('setup') ? api('repo/clients').catch(() => null) : null]);
    const open1 = (t) => (t.status || 'Por empezar') !== 'Hecha';
    const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    if (projects) { const act = projects.filter((p) => p.status !== 'cerrado'); N.control = [act.length, act.length === 1 ? 'proyecto activo' : 'proyectos activos']; }
    if (tasks) {
      const late = tasks.filter((t) => open1(t) && t.due && t.due < T).length; N.operations = [late, late === 1 ? 'tarea atrasada' : 'tareas atrasadas'];
      const mine = tasks.filter((t) => open1(t) && t.assignee === me.email).length; N.work = [mine, mine === 1 ? 'tarea tuya abierta' : 'tareas tuyas abiertas'];
      const dueM = tasks.filter((t) => t.due && t.due.slice(0, 7) === M && t.due < T && (open1(t) || t.done_at)), onT = dueM.filter((t) => !open1(t) && String(t.done_at).slice(0, 10) <= t.due).length;
      N.resultados = dueM.length ? [`${Math.round((onT / dueM.length) * 100)}%`, 'entregas a tiempo este mes'] : ['—', 'sin entregas vencidas este mes'];
    }
    if (leads) { const o = leads.filter((l) => OPEN_LEAD.includes(l.stage || 'Nuevo')).length, q = (quotes || []).filter((x) => ['Borrador', 'Enviada'].includes(x.status)).length; N.sales = [o, `${o === 1 ? 'lead abierto' : 'leads abiertos'}${quotes ? ` · ${pl(q, 'cotización pendiente', 'cotizaciones pendientes')}` : ''}`]; }
    if (fin) { const m = fin.filter((e) => String(e.date || '').slice(0, 7) === M).length; N.finanzas = [m, m === 1 ? 'movimiento este mes' : 'movimientos este mes']; }
    if (recs) N.responsabilidades = [recs.length, recs.length === 1 ? 'receta programada' : 'recetas programadas'];
    if (has('vistas')) { const n = new Set([...Object.keys(rv?.views || {}), ...Object.keys(rv?.scope || {}), ...Object.keys(rv?.start || {})]).size; N.vistas = [n, n === 1 ? 'perfil configurado' : 'perfiles configurados']; }
    if (repo) { const n = (repo.clients || []).filter((c) => c.hasPlan).length; N.setup = [n, n === 1 ? 'cliente en el repo' : 'clientes en el repo']; }
    for (const [k] of tools) if (!(k in N)) N[k] = null;
    paint();
  }

  // ---------- una herramienta abierta ----------
  async function open([k, name, , , screen]) {
    mount(el, html`<div class="hub">
      <nav class="hub-side" aria-label="Herramientas del Centro de control">
        <a class="hub-back" href="#/control-hub">${ico('grid', 15)} Centro de control</a>
        ${tools.map(([x, n, , ic]) => html`<a class="hub-link ${x === k ? 'on' : ''}" href="#/control-hub/${x}" ${x === k ? 'aria-current="page"' : ''}>${ico(ic, 16)}<span>${n}</span></a>`)}
      </nav>
      <section class="hub-main" data-island="1" aria-label="${name}"><p class="loading">Cargando…</p></section></div>`);
    // En el cel los chips se deslizan hasta la herramienta abierta.
    const side = $('.hub-side', el), on = $('.hub-link.on', el); if (side && on && side.scrollWidth > side.clientWidth) side.scrollLeft = on.offsetLeft - (side.clientWidth - on.offsetWidth) / 2;
    const box = $('.hub-main', el);
    const rest = sub.slice(1);
    const ctx = k === 'vistas' ? { sub: ['vistas'], embed: 'vistas' } : k === 'responsabilidades' ? { sub: ['responsabilidades', ...rest], embed: 'responsabilidades' } : { sub: rest };
    try {
      const mod = await import(`./${screen}.js`);
      if (!alive()) return;
      await mod.render(box, { me, area: k, label: name, alive, ...ctx });
    } catch (e) { if (alive()) mount(box, html`<div class="warnbox">${e.code === 'NO_DB' ? 'La base de datos todavía no está conectada.' : e.message}</div>`); }
  }
}
