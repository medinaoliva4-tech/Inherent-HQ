// Calendario → #/calendario: dos vistas, en pestañas.
//   Trabajo   (#/calendario/trabajo)           el calendario de trabajo único (calendario-trabajo.js), con los mismos datos y permisos
//                                              que Organization › Deadlines, MÁS las notas de las áreas que tienen fecha.
//   Contenido (#/calendario/contenido[/<marca>]) el calendario de contenido de una marca (el embed de content.js), eligiéndola arriba.
// Sin sub abre Trabajo. Nada se escribe aquí salvo los eventos de Google Calendar (como en Deadlines); las notas se editan en su área.
import { html, raw, mount, col, api, drawer, closeDrawer, ask, toast, acts, confirmAsk, fdate, today, skel, teamList, calQ, calAll, setCalAll, swap, ico, $, IC } from '../core.js';
import { juntarEventos, filtrarPorRol, tiposVisibles, rango, porDia, calendarioHtml, diaHtml, hitoHtml, TIPOS } from '../calendario-trabajo.js';
import { loadBrands, brandAccess, modulesFor } from '../brandlist.js';
import { areaInfo, leerNota } from '../areas-notas.js';
import { puedeWs } from '../herramientas.js';

export const esqueleto = () => skel('pagina');

// ---------- Puro: las notas de las áreas como eventos del calendario de trabajo ----------
// Un tipo más junto a los de siempre: «Áreas». Cada nota con fecha sale con el color de su área y lleva a #/areas/<área>.
export const TIPO_AREAS = ['areas', 'Áreas'];
const LISTA = [...TIPOS, TIPO_AREAS];
const ORDEN = Object.fromEntries(LISTA.map(([k], i) => [k, i]));
// Las notas con fecha dentro del rango, sin archivar y sin las que ya están hechas (igual que las tareas «Hecha»).
// leerNota (areas-notas.js) ya deja la fecha como AAAA-MM-DD o '' y el estado como Por hacer · En curso · Hecho o ''.
export function eventosNotas(docs = [], { from, to, hoy, puede = () => true } = {}) {
  const out = [];
  for (const d of Array.isArray(docs) ? docs : []) {
    const n = leerNota(d); if (!n.fecha || n.fecha < from || n.fecha > to || n.archivado || !n.titulo || n.estado === 'Hecho') continue;
    const a = areaInfo(n.area); if (!puede(a.id)) continue;
    out.push({ k: `a-${d.id}`, tipo: TIPO_AREAS[0], date: n.fecha, time: '', title: n.titulo, sub: n.estado ? `${a.nombre} · ${n.estado}` : a.nombre, color: `var(${a.color})`, late: n.fecha < hoy, go: { href: `#/areas/${a.id}` } });
  }
  return out;
}
// Mismo orden que juntarEventos: por día, el ciclo primero, luego la hora y el tipo.
const orden = (a, z) => a.date.localeCompare(z.date) || (a.tipo === 'ciclo' ? -1 : z.tipo === 'ciclo' ? 1 : 0) || String(a.time || '').localeCompare(String(z.time || '')) || ORDEN[a.tipo] - ORDEN[z.tipo];
// ---------- Fin de lo puro ----------

const TSTATUS = { 'Por empezar': '', 'En curso': 'amber', 'En revisión': 'blue', 'Hecha': 'green' };
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const lsGet = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export async function render(el, { me, sub, alive }) {
  let tab = sub?.[0] === 'contenido' ? 'contenido' : 'trabajo';
  // Trabajo: la vista (mes o semana) y los tipos apagados se recuerdan en este navegador, con las mismas llaves que Deadlines.
  let calView = lsGet('cal.vista', 'mes') === 'semana' ? 'semana' : 'mes', calDate = today();
  const calOff = new Set(String(lsGet('cal.off', '')).split(',').filter(Boolean));
  let events = null, evErr = null, extra = null, datos = null, calInfo = { allCals: true, calendars: [] }, dayMap = {};
  // Contenido: la marca elegida (la de la ruta, si no la última de esta persona, si no la primera).
  const lsMarca = `os.cal.marca.${me.email || 'yo'}`;
  let brands = null, marca = sub?.[0] === 'contenido' && sub[1] ? String(sub[1]) : null;

  const person = (email) => datos?.team.find((t) => t.id === email || t.email === email);
  const pname = (id) => datos?.projects.find((p) => p.id === id)?.name || '—';

  // ---------- La página ----------
  function paint() {
    mount(el, html`<div class="hello sp-hero cal-head"><h1>Calendario</h1><p>Todo, <em>día por día</em>.</p></div>
      <div class="row cal-bar"><div class="tabs" role="tablist" aria-label="Calendario">${[['trabajo', 'Trabajo'], ['contenido', 'Contenido']].map(([k, l]) => html`<button role="tab" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k ? 'true' : 'false'}" data-act="ctab" data-t="${k}">${l}</button>`)}</div></div>
      <div id="wbody"></div>`);
    const b = $('#wbody', el);
    return tab === 'contenido' ? contenido(b) : trabajo(b);
  }

  // ---------- Trabajo: el calendario de Deadlines (mismos datos, mismos permisos) + las notas de las áreas con fecha ----------
  async function loadEvents() {
    const R = rango(calView, calDate), from = new Date(Date.parse(R.from + 'T12:00:00Z') - 864e5).toISOString().slice(0, 10), to = new Date(Date.parse(R.to + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10);
    try { const r = await api(`google/calendar?from=${from}&to=${to}${calQ()}`); events = r.events || []; calInfo = { allCals: r.allCals !== false, calendars: r.calendars || [] }; evErr = null; } catch (e) { events = []; evErr = e.message; }
  }
  // Lo que no es de Proyectos: los seguimientos de Ventas, los vencimientos de Facturas y las grabaciones. Solo se pide lo que el perfil ve.
  async function loadExtra() {
    const a = me.areas || [];
    const [leads, invoices, content] = await Promise.all([a.includes('sales') ? col('leads').list().catch(() => []) : [], a.includes('finanzas') ? col('invoices').list().catch(() => []) : [],
      a.includes('content') && me.views?.content !== 'resumen' ? col('content').list().catch(() => []) : []]);
    extra = { leads, invoices, shoots: content.filter((x) => x.kind === 'shoot') };
  }
  // Tareas y proyectos (el servidor ya filtra por alcance), el equipo (nombres) y las notas de las áreas. Si algo no se puede leer, se ve sin eso.
  async function loadDatos() {
    const [tasks, projects, team, notas] = await Promise.all([col('tasks').list().catch(() => []), col('projects').list().catch(() => []), teamList().catch(() => []),
      col('area_notes').list().then((l) => ({ ok: true, l })).catch(() => ({ ok: false, l: [] }))]);
    datos = { tasks, projects, team, notas: notas.l, notasOk: notas.ok };
  }
  function trabajo(b) {
    if (datos === null || events === null || extra === null) {
      if (!b.querySelector('.wc')) mount(b, html`<p class="loading">Cargando el calendario…</p>`);
      Promise.all([datos === null ? loadDatos() : null, events === null ? loadEvents() : null, extra === null ? loadExtra() : null]).then(() => tab === 'trabajo' && alive() && b.isConnected && trabajo(b));
      return;
    }
    const R = rango(calView, calDate), T = today();
    const evs = [...filtrarPorRol(juntarEventos({ google: events, tasks: datos.tasks, projects: datos.projects, shoots: extra.shoots, leads: extra.leads, invoices: extra.invoices, from: R.from, to: R.to, hoy: T }), me),
      ...(datos.notasOk ? eventosNotas(datos.notas, { from: R.from, to: R.to, hoy: T, puede: (id) => puedeWs(me, id) }) : [])].sort(orden);
    dayMap = porDia(evs.filter((e) => !calOff.has(e.tipo)));
    mount(b, calendarioHtml({ vista: calView, fecha: calDate, eventos: evs, off: calOff, tipos: [...tiposVisibles(me), ...(datos.notasOk ? [TIPO_AREAS[0]] : [])], lista: LISTA, info: calInfo, err: evErr, ceo: me.role === 'ceo', hoy: T, all: calAll() }));
  }
  const calMove = (n) => { const d = new Date(calDate + 'T12:00:00Z'); if (calView === 'semana') d.setUTCDate(d.getUTCDate() + 7 * n); else d.setUTCMonth(d.getUTCMonth() + n, 1); calDate = d.toISOString().slice(0, 10); events = null; const b = $('#wbody', el); if (b) trabajo(b); };
  const repintar = () => { const b = $('#wbody', el); if (b && tab === 'trabajo') trabajo(b); };

  function openEvent(e) {
    if (!e) return;
    const when = e.allDay ? fdate(String(e.start).slice(0, 10)) + (String(e.end).slice(0, 10) > addDays(String(e.start).slice(0, 10), 1) ? ' – ' + fdate(addDays(String(e.end).slice(0, 10), -1)) : ' · todo el día')
      : `${fdate(String(e.start).slice(0, 10))} · ${String(e.start).slice(11, 16)} – ${String(e.end).slice(11, 16)}`;
    drawer(html`<div class="row"><span class="gbadge">${IC.cal} ${e.calName || 'Google Calendar'}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>${e.summary}</h2><div class="mut">${when}</div>
      ${e.location ? html`<div style="margin-top:12px">${ico('pin')} ${e.location}</div>` : ''}
      ${e.description ? html`<p class="sm" style="margin-top:12px;white-space:pre-wrap">${e.description}</p>` : ''}
      <div class="row" style="margin-top:20px;gap:8px">${e.meet && /^https:\/\//.test(e.meet) ? html`<a class="btn" href="${e.meet}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">Entrar a Meet</a>` : ''}
        ${/^https:\/\//.test(e.link || '') ? html`<a class="btn ghost" href="${e.link}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">Abrir en Google ↗</a>` : ''}
        <div class="sp"></div>${e.editable ? html`<button class="btn ghost" data-act="evdel">${ico('trash')}</button>` : ''}</div>`,
    { evdel: async () => { if (!(await confirmAsk(`¿Borrar «${e.summary}» de tu Google Calendar?`))) return; try { await api(`google/calendar/${encodeURIComponent(e.id)}`, { method: 'DELETE' }); closeDrawer(); toast('Evento borrado'); events = null; repintar(); } catch (err) { toast(err.message, true); } } });
  }
  async function newEvent(date) {
    const v = await ask('Nuevo evento en Google Calendar', [{ k: 'summary', l: 'Título', req: true }, { k: 'date', l: 'Fecha', t: 'date', v: date || today(), req: true, half: true }, { k: 'time', l: 'Hora (vacío = todo el día)', t: 'time', half: true }, { k: 'minutes', l: 'Duración (min)', t: 'number', v: 60, half: true }, { k: 'description', l: 'Notas', half: true }]);
    if (!v) return; try { await api('google/calendar', { method: 'POST', body: v }); toast('Evento creado en tu Google Calendar'); events = null; repintar(); } catch (e) { toast(e.message, true); }
  }
  // Una tarea: aquí solo se ve; se edita en su proyecto (o en Tareas si no tiene).
  function openTask(t) {
    if (!t) return;
    const st = t.status || 'Por empezar', quien = person(t.assignee)?.name || 'Sin responsable', enOps = (me.areas || []).includes('operations') && t.project_id;
    drawer(html`<div class="row"><span class="chip ${TSTATUS[st] || ''}">${st}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>${t.title}</h2><div class="mut">${pname(t.project_id)}${t.due ? ` · vence ${fdate(t.due)}` : ''} · ${quien}</div>
      ${t.description ? html`<p class="sm" style="margin-top:12px;white-space:pre-wrap">${t.description}</p>` : ''}
      <div class="row" style="margin-top:20px;gap:8px"><a class="btn" href="${enOps ? `#/operations/p/${encodeURIComponent(t.project_id)}` : '#/work'}" style="text-decoration:none">${enOps ? 'Abrir el proyecto' : 'Abrir en Tareas'}</a></div>`);
  }
  // Un hito del ciclo: qué pasa ese día y los proyectos de ciclo mensual a los que aplica.
  function openHito(d) {
    const cyc = (datos?.projects || []).filter((p) => p.kind === 'Ciclo mensual');
    drawer(html`<div class="row"><span class="chip">Ciclo de contenido</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>${hitoHtml(d)}
      <div class="sec-title" style="margin-top:18px"><h2 style="font-size:17px">Proyectos del ciclo</h2><span class="mut sm">${cyc.length}</span></div>
      ${cyc.length ? cyc.map((p) => html`<a class="wkrow" href="#/operations/p/${encodeURIComponent(p.id)}"><span class="grow">${p.name}</span><span class="mut sm">${p.client || ''}</span></a>`) : html`<div class="mut sm">Ningún proyecto de ciclo mensual todavía.</div>`}
      <p class="mut sm" style="margin-top:14px">Las fechas se ajustan cada mes al calendario real; los límites del 11 y el 20 se respetan.</p>`);
  }
  // El calendario compartido de la empresa: ahí caen las reuniones de los proyectos.
  async function calPick() {
    let r; try { r = await api('google/calendars'); } catch (e) { return toast(e.message, true); }
    const v = await ask('Calendario de Inherent', [{ k: 'id', l: 'Las reuniones de los proyectos se agendan aquí, con invitación a quienes van', t: 'select', opts: r.calendars.map((c) => [c.id, c.name + (c.primary ? ' (tu principal)' : '')]), v: r.current || r.calendars.find((c) => /inherent/i.test(c.name))?.id || '' }], 'Guardar');
    if (!v) return;
    try { await api('google/calendars', { method: 'PUT', body: { id: v.id, name: r.calendars.find((c) => c.id === v.id)?.name } }); toast('Listo. Compártelo en Google Calendar con el equipo («hacer cambios en eventos») para que también puedan agendar.'); } catch (e) { toast(e.message, true); }
  }

  // ---------- Contenido: el calendario de una marca (el embed de content.js) ----------
  async function contenido(b) {
    if (!brandAccess(me).contentFull) return mount(b, html`<div class="empty"><b>Tu perfil no ve el contenido de las marcas</b></div>`);
    if (brands === null) {
      mount(b, html`<p class="loading">Cargando las marcas…</p>`);
      brands = (await loadBrands(me).catch(() => [])).filter((x) => x.content && modulesFor(me, x).includes('calendario'));
      if (!alive() || tab !== 'contenido' || !b.isConnected) return;
    }
    if (!brands.length) return mount(b, html`<div class="empty"><b>Todavía no hay marcas con contenido</b>Cuando una marca tenga su perfil de contenido, su calendario sale aquí.</div>`);
    try { marca = decodeURIComponent(marca || ''); } catch { marca = ''; }
    const slug = [marca, lsGet(lsMarca, '')].find((s) => s && brands.some((x) => x.slug === s)) || brands[0].slug;
    mount(b, html`<div class="row cal-marcas"><label class="cal-marca-l" for="cal-marca">Marca</label>
        <select class="in cal-sel" id="cal-marca" data-act="cmarca">${brands.map((x) => html`<option value="${x.slug}" ${x.slug === slug ? raw('selected') : ''}>${x.name}</option>`)}</select></div>
      <div id="cal-host"></div>`);
    elegir(slug);
  }
  // Pone la marca: la recuerda, la escribe en la ruta y monta su calendario en un contenedor nuevo (así no se juntan escuchadores).
  function elegir(slug) {
    const m = (brands || []).find((x) => x.slug === slug), host = $('#cal-host', el); if (!m || !host) return;
    marca = slug; lsSet(lsMarca, slug); history.replaceState(null, '', '#/calendario/contenido/' + slug);
    const box = document.createElement('div'); box.dataset.island = '1'; host.replaceChildren(box);
    const vivo = () => alive() && box.isConnected && tab === 'contenido';
    import('./content.js').then((c) => c.render(box, { me, alive: vivo, fixed: slug, sub: ['calendario'], embed: { base: '#/calendario/contenido/' + slug, only: ['calendario'], brand: m.name } }))
      .catch((e) => { if (vivo()) mount(box, html`<div class="warnbox">${e?.message || 'No pude abrir el calendario de esta marca.'}</div>`); });
  }

  // La pantalla de contenido (content.js) trae sus propios botones: los de aquí no le hablan a lo que va dentro de una isla.
  const island = (map) => Object.fromEntries(Object.entries(map).map(([k, fn]) => [k, (t, e) => { if (t.closest('[data-island]')) return; return fn(t, e); }]));
  acts(el, island({
    ctab: (t) => {
      const k = t.dataset.t === 'contenido' ? 'contenido' : 'trabajo'; if (k === tab) return;
      tab = k; if (k === 'trabajo') events = null;
      history.replaceState(null, '', '#/calendario/' + k + (k === 'contenido' && marca ? '/' + encodeURIComponent(marca) : ''));
      swap(el, paint);
    },
    calpick: calPick,
    calscope: () => { setCalAll(!calAll()); events = null; repintar(); },
    cvista: (t) => { calView = t.dataset.v === 'semana' ? 'semana' : 'mes'; lsSet('cal.vista', calView); events = null; repintar(); },
    ctipo: (t) => { const k = t.dataset.t; calOff.has(k) ? calOff.delete(k) : calOff.add(k); lsSet('cal.off', [...calOff].join(',')); repintar(); },
    go: () => {}, // un link: el navegador lo abre
    hito: (t) => openHito(t.dataset.d),
    mrefresh: () => { events = null; extra = null; datos = null; repintar(); },
    mtoday: () => { calDate = today(); events = null; repintar(); },
    mprev: () => calMove(-1),
    mnext: () => calMove(1),
    newEvent: () => newEvent(),
    day: (t) => newEvent(t.dataset.date),
    ev: (t, e) => { e.stopPropagation(); openEvent(events?.[+t.dataset.i]); },
    task: (t) => openTask(datos?.tasks.find((x) => x.id === t.dataset.id)),
    dayall: (t) => { const d = t.dataset.date; drawer(html`<div class="row"><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div><h2>${fdate(d)}</h2><div style="margin-top:14px">${diaHtml(dayMap[d] || [])}</div>`,
      { ev: (x) => openEvent(events?.[+x.dataset.i]), task: (x) => openTask(datos?.tasks.find((y) => y.id === x.dataset.id)), hito: (x) => openHito(x.dataset.d) }); },
  }));
  acts(el, island({ cmarca: (t) => { if (t.value && t.value !== marca) elegir(t.value); } }), 'change');

  // Trabajo se actualiza solo: cada minuto mientras está abierto y al volver a la pestaña del navegador.
  const tick = () => { if (!alive()) return stop(); if (tab === 'trabajo' && document.visibilityState === 'visible' && !document.querySelector('dialog[open]') && !$('#drawer')?.classList.contains('on')) { events = null; repintar(); } };
  const iv = setInterval(tick, 60000), onVis = () => document.visibilityState === 'visible' && tick();
  document.addEventListener('visibilitychange', onVis);
  function stop() { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); }
  return paint();
}
