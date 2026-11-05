import { html, raw, mount, col, api, acts, toast, fdate, today, initials, IC, $, ask, confirmAsk, teamList, ico, isSummary, canEdit, roChip, swap, fromLink, sheetForm } from '../core.js';
import { upcoming, meetingRows, schedule, markDone } from '../meetings.js';
import { fit, priceLabel, CADENCE } from '../mentors.js';
import { levelName, isPartnership } from '../levels.js';
import { goalsUI, goalsOf } from '../goals.js';
import { serviceTab } from '../client-service.js';
import { recipesWith } from '../recipes.js';
import { brandBoard } from '../brand-board.js';
import { budgetsTab } from '../budgets.js';
import { render as content } from './content.js';
import { loadEstrategia } from '../stratlist.js';
import { BLOQUES, etapaLabel, etapaDe } from '../estrategia.js';
import { CYCLE } from '../cycle.js';
import { estadoFactura } from '../facturas.js';
import { rutaModulo, rutaBloque } from '../herramientas.js';

// Clientes: la lista (quién, su nivel, cómo va el mes) y la página de cada uno en pestañas: Info · Links · Servicio ·
// Presupuestos (photo shoots, pauta, eventos). Su Marca (asociaciones e inspo) vive en el espacio Marcas: aquí queda un link.
// El CRM ya no vive aquí: está en Ventas; la ficha solo dice «Vino de: <fuente>» con link a su lead. El plan y LINKS.md salen del repo
// (con su chip «del repo»); contacto, metas, links propios y accesos viven en la base (accounts).
const COLORS = ['olive', 'terra', 'ink'];
const CATS = [['fotos', 'Fotos'], ['videos', 'Videos'], ['drive', 'Drive'], ['redes', 'Redes'], ['web', 'Web'], ['otro', 'Otro']];
const catName = (k) => CATS.find(([x]) => x === k)?.[1] || 'Otro';
const cleanPlan = (s) => levelName(String(s || '').replace(/^[⬜🔷🟨]️?\s*/u, ''));
const slugOf = (a) => a.slug || String(a.id).replace(/^acc-/, '');

export async function render(el, { me, sub, alive }) {
  const AC = col('accounts');
  const [repo, accounts, projects, tasks, team, mentors] = await Promise.all([api('repo/clients').catch(() => ({ clients: [] })), AC.list(), col('projects').list(), col('tasks').list(), teamList(), col('mentors').list().catch(() => [])]);
  const clients = (repo.clients || []).filter((c) => c.hasPlan).map((c) => ({ ...c, plan: cleanPlan(c.plan) }));
  const inRepo = new Set((repo.clients || []).map((c) => c.slug));
  for (const a of accounts) if (a.from_quote && !inRepo.has(slugOf(a))) clients.push({ slug: slugOf(a), hasPlan: false, plan: 'Desde cotización', app: true });
  const acct = (slug) => accounts.find((a) => a.id === 'acc-' + slug);
  const resumen = isSummary(me, 'clients'), edit = canEdit(me, 'clients');
  const managesAcc = me.role === 'ceo' || me.role === 'coo' || edit;
  const T = today(), M = T.slice(0, 7);
  const person = (k) => team.find((t) => t.id === k || t.email === k);
  const open = (t) => (t.status || 'Por empezar') !== 'Hecha';
  // Cómo va el mes de un cliente: sus tareas con fecha este mes y el semáforo (atrasadas → rojo; vence en 3 días → ámbar).
  const month = (slug) => { const ps = projects.filter((p) => p.client_slug === slug), ids = new Set(ps.map((p) => p.id)); const tk = tasks.filter((t) => ids.has(t.project_id));
    const m = tk.filter((t) => String(t.due || '').slice(0, 7) === M), done = m.filter((t) => !open(t)).length, late = tk.filter((t) => open(t) && t.due && t.due < T).length, soon = tk.filter((t) => open(t) && t.due && t.due >= T && t.due <= addD(3)).length;
    return { ps, tk, total: m.length, done, pct: m.length ? Math.round((done / m.length) * 100) : null, light: late ? ['red', `${late} atrasada${late === 1 ? '' : 's'}`] : soon ? ['amber', `${soon} vence${soon === 1 ? '' : 'n'} pronto`] : ['green', 'Al día'] }; };
  const addD = (n) => { const d = new Date(T + 'T12:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  if (!sub[0]) return list();
  return page(sub[0], sub[1]);

  function list() {
    mount(el, html`<div class="hello sp-hero row" style="align-items:flex-end"><div><h1>Clientes</h1><p>Quiénes son y <em>cómo va su mes</em>.</p></div><div class="sp"></div>${roChip(me, 'clients')}</div>
      ${clients.length ? html`<div class="gl">${clients.map((c) => { const a = acct(c.slug), mo = month(c.slug), rm = goalsOf(a), next = rm.filter((x) => x.status !== 'done').sort((x, z) => String(x.due || '9').localeCompare(String(z.due || '9')))[0];
        return html`<a class="gl-f gl-cl" href="#/clients/${c.slug}"><span class="sp-mono">${initials(a?.name || c.slug)}</span>
          <span class="gl-t"><b>${a?.name || c.slug.toUpperCase()}</b><small>${c.plan || 'Sin nivel'}</small></span>
          <span class="gl-av" aria-label="Avance del mes"><span class="sp-meter"><i style="width:${mo.pct || 0}%"></i></span><small>${mo.pct == null ? 'Sin avance' : `${mo.pct}%`}</small></span>
          <span class="gl-e"><i class="dot light-${mo.light[0]}"></i>${mo.light[1]}</span>
          <span class="gl-n">${mo.total ? `${mo.done}/${mo.total} entregas` : next ? 'Meta: ' + next.goal : `${mo.ps.length} proyecto${mo.ps.length === 1 ? '' : 's'}`}</span>${ico('chevron-right', 15)}</a>`; })}</div>`
      : html`<div class="empty"><b>No encontré clientes</b>Cada cliente es un folder en clients/ con su 00-onboarding/plan-contratado.md, o entra por una cotización pagada.</div>`}`);
  }

  async function page(slug, tab0) {
    const c = clients.find((x) => x.slug === slug);
    let info = null; try { info = await api(`repo/client/${encodeURIComponent(slug)}`); } catch (e) { return mount(el, html`<a class="btn ghost" href="#/clients">← Clientes</a><div class="empty" style="margin-top:16px"><b>No encontré ese cliente</b>${e.message}</div>`); }
    if (!alive()) return;
    info = { links: [], fields: [], pipeline: [], ...(info || {}) };
    let a = acct(slug) || { id: 'acc-' + slug, name: slug.toUpperCase(), contact: '', phone: '', email: '', notes: '', roadmap: [], accesos: [], links: [] };
    const ps = projects.filter((p) => p.client_slug === slug);
    // Marca ya no es una pestaña: vive en Marcas → este cliente → Marca (un solo lugar). #/clients/<slug>/marca lleva allá.
    const TABS = [['info', 'Inicio'], ['movimientos', 'Movimientos'], ...(resumen ? [] : [['links', 'Links']]), ['servicio', 'Servicio'], ...(resumen ? [] : [['presupuestos', 'Presupuestos'], ['ajustes', 'Portal y accesos']])];
    const toBrand = !resumen && me.areas.includes('clients');
    // La pestaña vieja «Prospectos» lleva al CRM, que vive en Ventas.
    const hubBase = '#/sales';
    if (tab0 === 'prospectos') { location.hash = hubBase.slice(1) + '/crm'; return; }
    let tab = TABS.some(([k]) => k === tab0) ? tab0 : 'info';
    // De dónde vino: el lead que se volvió este cliente (por su cotización o porque el lead lo dice). Solo si se ve Comercial.
    let origin = null, docs = [];
    const planPath = `clients/${slug}/00-onboarding/plan-contratado.md`, linksPath = `clients/${slug}/00-onboarding/LINKS.md`;
    // Lo que llega después (docs de la Library, el lead de origen) solo repinta los chips y, si toca, la pestaña de Links o Servicio.
    const refresh = () => { if (!alive()) return; const ch = $('#cchips', el); if (ch) mount(ch, chips()); if (tab === 'links' || tab === 'servicio') { const b = $('#cbody', el); if (b) (tab === 'links' ? linksTab(b) : extra && mount(b, serviceTab({ me, slug, info, projects: ps, tasks, team, precioFicha: c?.precio ?? null, planPath: c?.hasPlan ? planPath : '', docs, ...extra }))); } };
    let msub = sub[2] === 'inspo' ? 'inspo' : 'asociaciones'; // Marca: Asociaciones · Inspo
    // Finanzas solo para quien la ve: alimenta «presupuesto vs gastado».
    let entries = null; const loadEntries = () => (me.areas.includes('finanzas') ? col('finance').list().catch(() => null) : Promise.resolve(null));
    let portalPeople = (await api('db/team').catch(() => ({ items: [] }))).items.filter((x) => x.role === 'client' && x.client_slug === slug);
    // Lo que pide la pestaña Servicio (cotizaciones, catálogo, costos, recetas): se lee una vez, sin bloquear la página.
    let extra = null;
    const loadExtra = () => Promise.all([col('quotes').list().catch(() => []), col('services').list().catch(() => []), me.role === 'ceo' ? col('rates').get('default').catch(() => null) : null, col('recipes').list().catch(() => [])])
      .then(([quotes, services, rates, rec]) => { extra = { quotes: quotes.filter((q) => q.client_slug === slug), services, rates, R: recipesWith(rec) }; if (alive() && tab === 'servicio') paint(); });
    const isGrowth = () => isPartnership(info?.plan) || ps.some((p) => p.line === 'growth');
    const saveAcc = async (next) => { try { const r = next.v ? await AC.save(next) : await AC.create(next); a = r; return r; } catch (e) { toast(e.message, true); return null; } };
    const goals = goalsUI({ get: () => a, save: saveAcc, repaint: () => paint(), mentors, edit });
    const nivel = cleanPlan(info.plan) || c?.plan || (info.app ? 'Desde cotización' : 'Sin nivel');

    function paint() {
      if (!alive()) return;
      const mo = month(slug);
      mount(el, html`
        <div class="row" style="margin-bottom:14px">${tab === 'info' ? html`<a class="btn ghost xs" href="#/clients">← Clientes</a>` : html`<button class="btn ghost xs" data-act="tab" data-t="info">← ${a.name}</button>`}</div>
        ${tab === 'info' ? html`<header class="cp-hd"><span class="cp-mono">${initials(a.name)}</span><div class="cp-hd-t"><h1>${a.name}</h1><p>Cómo va la cuenta hoy</p><div id="cchips">${chips()}</div></div>
          <div class="cp-hd-b">${toBrand ? html`<a class="btn ghost xs" href="#/ws/marketing/${slug}/overview">${ico('spark', 13)} Marketing ↗</a>` : ''}${edit ? html`<button class="btn ghost xs" data-act="editAcc">Editar datos</button>` : ''}</div></header>`
          : html`<header class="cp-hd sm"><div class="cp-hd-t"><h1>${(TABS.find(([k]) => k === tab) || [, ''])[1]}</h1><p>${a.name}</p></div></header>`}
        <div id="cbody"></div>`);
      const b = $('#cbody', el);
      if (tab === 'info') return infoTab(b);
      if (tab === 'movimientos') return import('../movimientos-ui.js').then((m) => m.pintarMovimientos(b, { me, cliente: slug, alive }));
      if (tab === 'ajustes') return ajustesTab(b);
      if (tab === 'links') return linksTab(b);
      if (tab === 'marca') return marcaTab(b);
      if (tab === 'presupuestos') { mount(b, html`<p class="loading">Cargando…</p>`); return loadEntries().then((en) => { entries = en; if (alive() && tab === 'presupuestos') budgetsTab({ el: b, me, slug, name: a.name, edit, entries }); }); }
      if (tab === 'servicio') { if (!extra) { mount(b, html`<p class="loading">Cargando…</p>`); return loadExtra(); } return mount(b, serviceTab({ me, slug, info, projects: ps, tasks, team, precioFicha: c?.precio ?? null, planPath: c?.hasPlan ? planPath : '', docs, ...extra })); }
    }

    function chips() {
      return html`<div class="sp-cover-chips"><span class="chip">${nivel}</span><span class="chip">${[a.contact, a.phone, a.email].filter(Boolean).join(' · ') || 'Sin contacto'}</span>${origin ? html`<a class="chip" style="text-decoration:none;color:inherit" href="${hubBase}/crm/${origin.id}" title="Abrir el lead «${origin.name}» en Comercial">Vino de: ${origin.source} ↗</a>` : ''}</div>
        ${c?.hasPlan ? html`<div style="margin-top:8px">${fromLink({ repo: planPath, docs })}</div>` : ''}`;
    }
    // El Inicio del cliente (como el Inicio de Marca): el ciclo y sus proyectos; lo de esta semana; el rumbo; y abajo, todo lo demás.
    let cobros = undefined; const veFin = me.role !== 'client' && (me.areas || []).includes('finanzas');
    if (veFin) col('invoices').list().then((l) => { cobros = l.filter((i) => i.kind === 'cobrar' && i.client === slug && ['pendiente', 'vencida'].includes(estadoFactura(i, today()))); if (alive() && tab === 'info') { const z = $('#cp-cobros', el); if (z) z.outerHTML = String(cobrosCard()); } }).catch(() => { cobros = null; });
    function cicloCard() {
      const dia = +today().slice(8, 10), fase = dia > 20 ? null : CYCLE.filter(([, x, z]) => dia >= x && dia <= z).at(-1) || null;
      const pa = ps.find((p) => p.status !== 'cerrado') || ps[0];
      return html`<section class="card cp-card"><div class="row"><span class="lbl">El ciclo de este mes</span><div class="sp"></div>${pa ? html`<a class="sm" href="#/operations/p/${encodeURIComponent(pa.id)}/timeline">Editar fechas ›</a>` : toBrand ? html`<a class="sm" href="${rutaModulo(slug, 'calendario')}">Calendario ›</a>` : ''}</div><div class="cp-dia"><b>${dia > 20 ? '20+' : `Día ${dia}`}</b><span class="mut">${dia > 20 ? 'Ya se presentó. Lo presentado se publica desde el día 1.' : fase ? fase[0] : ''}</span></div>
        <div class="bh-ciclo" aria-label="Fases del ciclo">${CYCLE.map(([n, x, z]) => html`<i class="${dia > z ? 'ok' : dia >= x ? 'now' : ''}" style="flex:${z - x + 1}" title="${n}"></i>`)}</div>
        <div class="bh-ciclo-l mut sm"><span>Día 1 · reunión</span><span>11 · último día para producir</span><span>20 · presentación</span></div></section>`;
    }
    function semanaCard() {
      const T0 = today(), T7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), ids = new Set(ps.map((p) => p.id));
      const l = tasks.filter((t) => ids.has(t.project_id) && (t.status || 'Por empezar') !== 'Hecha' && t.due && t.due <= T7).sort((x, z) => String(x.due).localeCompare(String(z.due)));
      return html`<section class="card cp-card"><div class="row"><span class="lbl">Lo que falta esta semana</span><div class="sp"></div>${ps[0] ? html`<a class="sm" href="#/operations/p/${encodeURIComponent(ps[0].id)}">Tareas ›</a>` : ''}</div>
        ${l.length ? l.slice(0, 4).map((t) => html`<a class="cp-it" href="#/operations/p/${encodeURIComponent(t.project_id)}"><i class="cp-c"></i><span><b>${t.title}</b><small class="${t.due < T0 ? 'cp-late' : ''}">${t.due < T0 ? 'Atrasada' : t.due === T0 ? 'Hoy' : fdate(t.due)}${t.dept ? ` · ${t.dept}` : ''}${t.status === 'En revisión' ? ' · En revisión' : ''}</small></span></a>`) : html`<p class="mut sm">Nada por entregar esta semana. ${ico('spark', 13)}</p>`}${l.length > 4 ? html`<span class="mut sm">y ${l.length - 4} más</span>` : ''}</section>`;
    }
    function reunionCard() {
      const m = upcoming(ps)[0];
      const d = m ? new Date(m.date + 'T12:00') : null;
      return html`<section class="card cp-card"><div class="row"><span class="lbl">Próxima reunión</span><div class="sp"></div>${(m?.p || ps[0]) ? html`<a class="sm" href="#/operations/p/${encodeURIComponent((m?.p || ps[0]).id)}/calendario">${m ? 'Ver o mover ›' : 'Agendar ›'}</a>` : ''}</div>${m ? html`<div class="cp-meet"><div class="cp-day"><span>${d.toLocaleDateString('es', { month: 'short' }).replace('.', '').toUpperCase()}</span><b>${d.getDate()}</b></div><div><b>${m.title || m.kind || 'Reunión'}</b><div class="mut sm">${[m.time, m.where || m.link ? 'En línea' : '', m.p?.name].filter(Boolean).join(' · ')}</div></div></div>` : html`<p class="mut sm">Sin reuniones por delante.</p>`}</section>`;
    }
    function cobrosCard() {
      if (!veFin) return '';
      const l = cobros || [], venc = l.filter((i) => estadoFactura(i, today()) === 'vencida');
      const tot = (cur) => l.filter((i) => (i.currency || 'GTQ') === cur).reduce((n, i) => n + (+i.amount || 0), 0);
      const q = tot('GTQ'), u = tot('USD');
      return html`<section class="card cp-card" id="cp-cobros"><div class="row"><span class="lbl">Cobros</span><div class="sp"></div><a class="sm" href="#/finanzas">Finanzas ›</a></div>
        ${cobros === undefined ? html`<p class="mut sm">Cargando…</p>` : cobros === null ? html`<p class="mut sm">No pude leer las facturas.</p>` : html`<b class="cp-money">${l.length ? [q ? `Q${q.toLocaleString('es-GT')}` : '', u ? `$${u.toLocaleString('en-US')}` : ''].filter(Boolean).join(' + ') : '—'}</b>
        <span class="mut sm">${l.length ? `Por cobrar · ${l.length === 1 ? 'vence' : 'la primera vence'} el ${fdate(l.map((i) => i.due).sort()[0])}` : 'Nada por cobrar · sale de las facturas de este cliente en Finanzas'}</span>
        <span class="cp-tag ${venc.length ? 'bad' : 'ok'}">${venc.length ? `${venc.length} vencida${venc.length === 1 ? '' : 's'}` : 'Al día con los pagos'}</span>`}</section>`;
    }
    function herramientas() {
      const t = (k, icon, titulo, sub, links) => html`<section class="cp-tool"><header><span class="cp-ti ${k}">${ico(icon, 15)}</span><div><b>${titulo}</b><span class="mut sm">${sub}</span></div></header>${links.map(([l, attrs]) => html`<${raw(attrs.href ? 'a' : 'button')} class="cp-tl" ${raw(attrs.href ? `href="${attrs.href}"` : `type="button" data-act="tab" data-t="${attrs.tab}"`)}>${l}<span>›</span></${raw(attrs.href ? 'a' : 'button')}>`)}</section>`;
      return html`<div class="sec-title"><h2>Todo del cliente</h2></div><div class="cp-tools">
        ${resumen ? '' : t('t1', 'link', 'Links', 'Drive, redes y archivos', [['Drive y links', { tab: 'links' }]])}
        ${t('t2', 'doc', 'Servicio', 'Qué contrató y qué no', [['Ficha y servicio', { tab: 'servicio' }], ...(resumen ? [] : [['Presupuestos', { tab: 'presupuestos' }]])])}
        ${resumen ? '' : t('t3', 'eye', 'Portal y accesos', 'Lo que ve el cliente y quién entra', [['Portal y especialista', { tab: 'ajustes' }], ['Ver su portal', { href: `#/portal/${slug}` }]])}
        ${toBrand ? t('t4', 'spark', 'Marca', 'Contenido, diseño y resultados', [['Inicio de la marca', { href: `#/ws/marketing/${slug}/overview` }], ['Calendario', { href: rutaModulo(slug, 'calendario') }]]) : ''}
        ${veEst ? t('t5', 'target', 'Estrategia', 'Etapa, meta y roadmap', [['Abrir la estrategia', { href: `#/ws/strategy/${slug}/overview` }]]) : ''}</div>`;
    }
    function infoTab(b) {
      mount(b, html`<div class="cpf">
        <div class="grid g11 cp-row">${cicloCard()}${proyectosCard()}</div>
        <details class="cp-mas"><summary>Más de este cliente<small>Semana, reunión, cobros, estrategia, metas y herramientas</small></summary>
        <div class="cp-row3">${semanaCard()}${reunionCard()}${cobrosCard()}</div>
        <div class="grid g11 cp-row">${estrategiaCard()}<section class="card cp-card cp-goals">${goals.section()}</section></div>
        ${herramientas()}</details></div>`);
    }
    // Portal, especialista y accesos del equipo: lo que se configura de vez en cuando.
    function ajustesTab(b) {
      if (resumen) return mount(b, html`<p class="mut">Tu vista de Clientes es resumen.</p>`);
      mount(b, html`<div class="grid g11" style="align-items:start;margin-top:22px">
          <div class="card"><div class="row"><b style="font-weight:500">Accesos del equipo</b><div class="sp"></div>${edit ? html`<button class="btn ghost xs" data-act="acadd">+ Acceso</button>` : ''}</div><div class="mut sm" style="margin:2px 0 8px">${ico('lock')} Nunca contraseñas: solo qué cuenta, qué usuario y dónde está la clave</div>
            ${!managesAcc && !('accesos' in a) ? html`<div class="mut sm">Solo los ven el CEO, el COO, quien edita Clientes y las personas que ellos elijan.</div>`
            : html`${(a.accesos || []).map((x, i) => html`<div class="row sm" style="padding:8px 0;border-bottom:1px solid var(--line)"><b style="font-weight:500;min-width:110px">${x.servicio}</b><span style="flex:1">${x.usuario || '—'}<span class="mut"> · ${x.donde || '—'}</span></span>${edit ? html`<button class="sm mut" data-act="acedit" data-i="${i}" title="Editar">${ico('edit')}</button><button class="sm mut" data-act="acdel" data-i="${i}" title="Quitar">${ico('x', 16)}</button>` : ''}</div>`)}${!(a.accesos || []).length ? html`<div class="mut sm">Sin accesos anotados.</div>` : ''}
            ${managesAcc ? html`<div class="mut sm" style="margin-top:12px">${ico('eye', 14)} También los ven: ${(a.accesos_to || []).length ? (a.accesos_to || []).map((e) => html`<span class="chip" style="margin:2px">${person(e)?.name || e}${edit ? html` <button class="sm mut" data-act="acwdel" data-e="${e}">${ico('x', 14)}</button>` : ''}</span>`) : 'nadie más'}${edit ? html` <button class="btn ghost xs" data-act="acwadd">+ Persona</button>` : ''}</div>` : ''}`}</div>
          <div class="card"><div class="row"><b style="font-weight:500">Portal y especialista</b></div>
            <div class="mut sm" style="margin:2px 0 8px">El cliente ve su avance, contenido, reuniones y metas. Nada de costos.</div>
            <div class="row" style="gap:6px;flex-wrap:wrap"><a class="btn ghost xs" href="#/portal/${slug}">${ico('eye')} Ver su portal</a>${me.role === 'ceo' ? html`<button class="btn xs" data-act="portalAdd">+ Dar acceso</button>` : ''}${portalPeople.map((x) => html`<span class="chip">${x.email}${me.role === 'ceo' ? html` <button class="sm mut" data-act="portalDel" data-id="${x.id}">${ico('x', 14)}</button>` : ''}</span>`)}</div>
            <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:14px"><span class="sm mut">${isGrowth() ? 'Especialista incluido en Growth Partnership' : 'Especialista: su nivel no lo incluye, va como add-on'}</span>${edit ? html`<button class="btn ghost xs" data-act="esadd">+ Especialista</button>` : ''}</div>
            ${(a.mentors || []).map((x, k) => { const m = mentors.find((y) => y.id === x.id); if (!m) return ''; const [f, cc] = isGrowth() ? fit(m) : ['Add-on facturado', 'red']; return html`<div class="row sm" style="padding:8px 0;border-top:1px solid var(--line)"><span style="flex:1"><b style="font-weight:500">${m.name}</b> · ${m.industry} · ${priceLabel(m)} · ${CADENCE.find(([v]) => v === x.cadence)?.[1] || ''}</span><span class="chip ${cc}" style="font-size:11px">${f}</span>${edit ? html`<button class="sm mut" data-act="esedit" data-k="${k}" title="Editar">${ico('edit')}</button><button class="sm mut" data-act="esdel" data-k="${k}" title="Quitar">${ico('x', 16)}</button>` : ''}</div>`; })}</div>
        </div>`);
    }

    // Marca: las asociaciones del negocio (moodboard, Pinterest, referentes, tono, no-hacer) y la inspo por plataforma (su Research).
    function marcaTab(b) {
      mount(b, html`<div class="row" style="margin-bottom:12px;flex-wrap:wrap;gap:8px"><div class="tabs mini" style="margin:0"><button class="${msub === 'asociaciones' ? 'on' : ''}" data-act="msub" data-m="asociaciones">Asociaciones</button><button class="${msub === 'inspo' ? 'on' : ''}" data-act="msub" data-m="inspo">Inspo</button></div><span class="mut sm">${msub === 'asociaciones' ? 'Con qué se asocia la marca: lo que ve, a quién sigue y cómo suena.' : 'Lo que inspira su contenido, por plataforma: IG · TikTok · LinkedIn.'}</span></div><div id="mbody"></div>`);
      const m = $('#mbody', b);
      if (msub === 'asociaciones') return brandBoard({ el: m, me, id: slug, name: a.name, edit, business: true, folder: a.assets || '' });
      m.dataset.island = '1'; return content(m, { me, sub: ['research'], alive, fixed: slug, embed: { base: `#/clients/${slug}/marca/inspo`, only: ['research'], inspo: true, plat: sub[3] } });
    }

    // Lo que este cliente tiene en Estrategia (etapa y bloques aprobados) y sus proyectos: lo primero que se ve en Info.
    let est = undefined; // undefined: cargando · null: sin acceso o sin estrategia
    const veEst = me.role !== 'client' && (me.areas || []).includes('estrategia');
    if (veEst) loadEstrategia().then((d) => { est = (d.clientes || []).find((x) => x.slug === slug) || null; if (alive() && tab === 'info') { const s0 = $('#cl-est', el); if (s0) s0.outerHTML = String(estrategiaCard()); } }).catch(() => { est = null; });
    function estrategiaCard() {
      if (!veEst) return '';
      const e = est;
      return html`<section class="card cl-card" id="cl-est"><div class="row"><b class="cl-h">Estrategia</b><div class="sp"></div><a class="btn ghost xs" href="#/ws/strategy/${slug}/overview">Abrir</a></div>
        ${e === undefined ? html`<p class="mut sm">Cargando…</p>` : !e ? html`<p class="mut sm">Este cliente todavía no tiene estrategia en el OS.</p>` : html`
        <div class="cl-kv"><div><span class="mut sm">Etapa</span><b>${e.etapa && etapaDe(e.etapa.n) ? `${etapaLabel(etapaDe(e.etapa.n))}${e.etapa.confirmada ? '' : ' · sin confirmar'}` : 'Sin etapa'}</b></div><div><span class="mut sm">Aprobado por el CEO</span><b>${e.aprobados} de 5 bloques</b></div></div>
        <div class="cl-blocks">${BLOQUES.map((x) => html`<a href="${rutaBloque(slug, x.id)}" class="${e.bloques[x.id] || 'vacio'}" title="${x.nombre}"><i></i><span>${x.nombre}</span></a>`)}</div>`}</section>`;
    }
    function proyectosCard() {
      const pct = (p) => { const ts = tasks.filter((t) => t.project_id === p.id); return ts.length ? Math.round((ts.filter((t) => t.status === 'Hecha').length / ts.length) * 100) : null; };
      const fase = (p) => (p.phases || []).find((f) => f.status === 'now')?.name || (p.phases || []).find((f) => f.status !== 'done')?.name || '';
      return html`<section class="card cl-card"><div class="row"><b class="cl-h">Proyectos</b><span class="mut sm">${ps.length || ''}</span><div class="sp"></div><a class="btn ghost xs" href="#/operations">Ver en Proyectos</a></div>
        ${ps.length ? html`<div class="cl-projs">${ps.map((p) => { const n = pct(p); return html`<a class="cl-proj" href="#/operations/p/${encodeURIComponent(p.id)}"><span class="cl-proj-t"><b>${p.name}</b><span class="mut sm">${[p.kind, fase(p)].filter(Boolean).join(' · ') || 'Sin fase'}</span></span><span class="cl-proj-p"><i style="width:${n ?? 0}%"></i></span><span class="mut sm cl-proj-n">${n == null ? '—' : n + '%'}</span></a>`; })}</div>`
          : html`<p class="mut sm">Todavía no hay proyectos de ${a.name}. Se crean en <a href="#/operations">Proyectos</a> y quedan ligados a este cliente.</p>`}</section>`;
    }
    function linksTab(b) {
      const mine = Array.isArray(a.links) ? a.links : [];
      const cats = CATS.filter(([k]) => mine.some((l) => (l.cat || 'otro') === k));
      mount(b, html`${resumen ? '' : a.drive ? html`<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:12px"><a class="connect on" href="${a.drive}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit"><span class="lg">${IC.drive}</span>Drive de ${a.name}</a>${Object.entries(a.drive_dirs || {}).map(([k, u]) => html`<a class="chip" href="${u}" target="_blank" rel="noopener noreferrer" style="padding:7px 12px;text-decoration:none;color:inherit">${ico('folder')} ${k.replace(/^\d+ /, '')}</a>`)}</div>`
          : !edit ? '' : html`<div class="connectcard" style="margin-bottom:12px"><span class="lg big">${IC.drive}</span><div class="grow"><b style="font-weight:500">Crea el Drive de ${a.name}</b><div class="mut sm">Onboarding · Assets · Guiones · Crudo · Por postear · Entregables · Reportes${isGrowth() ? ' · Números y auditoría' : ''}.</div></div><button class="btn" data-act="mkdrive">Crear carpetas</button></div>`}
        <div class="row" style="margin-bottom:12px;flex-wrap:wrap;gap:8px"><span class="mut sm">Los links del cliente por categoría: fotos, videos, Drive, redes, web.</span><div class="sp"></div>${edit ? html`<button class="btn" data-act="lkadd">+ Link</button>` : ''}</div>
        ${cats.length ? html`<div class="grid g3">${cats.map(([k, l]) => html`<div class="card wkbox"><div class="wkhead"><h3>${ico(k === 'fotos' ? 'image' : k === 'videos' ? 'video' : k === 'drive' ? 'folder' : k === 'web' ? 'link' : 'link', 15)} ${l}</h3></div>
          ${mine.map((x, i) => [x, i]).filter(([x]) => (x.cat || 'otro') === k).map(([x, i]) => html`<div class="wkrow"><a class="grow" href="${/^https?:\/\//.test(x.url) ? x.url : '#'}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none"><b style="font-weight:500">${x.label || x.url}</b><div class="mut sm" style="overflow:hidden;text-overflow:ellipsis">${x.url}</div></a>${edit ? html`<button class="sm mut" data-act="lkedit" data-i="${i}">${ico('edit')}</button><button class="sm mut" data-act="lkdel" data-i="${i}">${ico('x', 16)}</button>` : ''}</div>`)}</div>`)}</div>`
        : html`<div class="empty"><b>Sin links todavía</b>Agrega el primero: «Fotos» y su link, «Drive» y su link…</div>`}
        ${info.links.length ? html`<div class="sec-title"><h2>Del repo</h2><span class="mut sm">Solo lectura · se cambia en el repo</span>${fromLink({ repo: linksPath, docs })}</div>
          <div class="card">${info.links.map((l) => html`<div class="row sm" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="mut" style="min-width:110px">${l.k}</span>${l.url && /^https:\/\//.test(l.url) ? html`<a href="${l.url}" target="_blank" rel="noopener noreferrer" style="color:inherit;flex:1">${l.v}</a>` : html`<span style="flex:1">${l.v}</span>`}</div>`)}</div>` : ''}`);
    }
    const linkForm = async (x) => { const v = await ask(x ? 'Editar link' : 'Nuevo link', [{ k: 'cat', l: 'Categoría', t: 'select', opts: CATS, v: x?.cat || 'fotos', half: true }, { k: 'label', l: 'Nombre', v: x?.label, req: true, half: true }, { k: 'url', l: 'Link', v: x?.url, req: true }]); if (!v) return null; if (!/^https?:\/\/\S+$/.test(v.url)) { toast('El link debe empezar con https://', true); return null; } return v; };
    const saveLinks = async (links) => { if (await saveAcc({ ...a, links })) { toast('Guardado'); paint(); } };

    const island = (map) => Object.fromEntries(Object.entries(map).map(([k, fn]) => [k, (t, e) => { if (t.closest('[data-island]')) return; return fn(t, e); }]));
    acts(el, island({
      ...goals.acts, gpdf: () => goals.pdf(nivel),
      tab: (t) => { tab = t.dataset.t; history.replaceState(null, '', `#/clients/${slug}/${tab}`); swap(el, paint); },
      msub: (t) => { msub = t.dataset.m; history.replaceState(null, '', `#/clients/${slug}/marca/${msub}`); marcaTab($('#cbody', el)); },
      mkdrive: async (t) => { t.disabled = true; t.textContent = 'Creando…'; try { const r = await api('drive/client', { method: 'POST', body: { slug, growth: isGrowth() } }); const fresh = await AC.get(a.id).catch(() => null); a = { ...(fresh || a), drive: r.drive, drive_dirs: r.dirs, assets: (fresh || a).assets || r.dirs['01 Assets de marca'] }; toast('Drive creado y conectado'); paint(); } catch (e) { toast(e.message, true); t.disabled = false; t.textContent = 'Crear carpetas'; } },
      lkadd: async () => { const v = await linkForm(null); if (v) saveLinks([...(a.links || []), v]); },
      lkedit: async (t) => { const l = [...(a.links || [])]; const v = await linkForm(l[+t.dataset.i]); if (v) { l[+t.dataset.i] = v; saveLinks(l); } },
      lkdel: async (t) => { if (await confirmAsk('¿Quitar este link?')) saveLinks((a.links || []).filter((_, i) => i !== +t.dataset.i)); },
      esadd: async () => {
        if (!mentors.length) return toast('Primero carga la red de especialistas en Servicios → Especialistas', true);
        const gl = goalsOf(a);
        const v = await ask('Agregar especialista', [{ k: 'id', l: 'Especialista', t: 'select', req: true, opts: [...mentors].sort((x, z) => (x.industry + x.price).localeCompare(z.industry + z.price)).map((m) => [m.id, `${m.industry} · ${m.name} · ${priceLabel(m)}`]) }, { k: 'cadence', l: 'Cada cuánto', t: 'select', opts: CADENCE, v: 'trimestral', half: true }, { k: 'goal', l: 'Para qué meta', t: 'select', opts: [['', '— Ninguna'], ...gl.map((g, i) => [String(i), g.goal])], half: true }, { k: 'note', l: 'Para qué lo traemos', t: 'textarea' }], 'Agregar');
        if (!v) return; const m = mentors.find((x) => x.id === v.id);
        if (m && fit(m)[1] === 'red' && isGrowth() && !(await confirmAsk(`${m.name} pasa el techo por sesión: va como add-on facturado al cliente. ¿Agregarlo igual?`))) return;
        if (await saveAcc({ ...a, mentors: [...(a.mentors || []), { id: v.id, cadence: v.cadence, goal: v.goal === '' ? null : +v.goal, note: v.note }] })) { toast('Especialista agregado'); paint(); }
      },
      esdel: async (t) => { if (!(await confirmAsk('¿Quitar este especialista del cliente?'))) return; if (await saveAcc({ ...a, mentors: a.mentors.filter((_, k) => k !== +t.dataset.k) })) paint(); },
      portalAdd: async () => {
        const v = await ask(`Acceso al portal de ${a.name}`, [{ k: 'email', l: 'Correo de Google de la persona del cliente', t: 'email', req: true }, { k: 'name', l: 'Nombre' }], 'Dar acceso');
        if (!v) return; const email = v.email.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast('Ese correo no es válido', true);
        try { const r = await col('team').create({ id: email, email, name: v.name || email.split('@')[0], role: 'client', client_slug: slug, active: true }); portalPeople = [...portalPeople, r]; toast('Listo. Ya puede entrar con Google en «Soy cliente»'); paint(); } catch (e) { toast(e.message, true); }
      },
      portalDel: async (t) => { if (!(await confirmAsk('¿Quitarle el acceso al portal?'))) return; try { await col('team').remove(t.dataset.id); portalPeople = portalPeople.filter((x) => x.id !== t.dataset.id); paint(); } catch (e) { toast(e.message, true); } },
      mtsched: async (t) => { const p = projects.find((x) => x.id === t.dataset.p); const r = p && (await schedule(p, +t.dataset.i, team, me)); if (r) { Object.assign(p, r); paint(); } },
      mtdone: async (t) => { const p = projects.find((x) => x.id === t.dataset.p); const r = p && (await markDone(p, +t.dataset.i)); if (r) { Object.assign(p, r); paint(); } },
      editAcc: async () => { const v = await ask('Datos del cliente', [{ k: 'name', l: 'Nombre', v: a.name, req: true }, { k: 'contact', l: 'Contacto', v: a.contact, half: true }, { k: 'phone', l: 'Teléfono / WhatsApp', v: a.phone, half: true }, { k: 'email', l: 'Correo', t: 'email', v: a.email }, { k: 'assets', l: 'Carpeta de assets en Drive', v: a.assets }, { k: 'notes', l: 'Notas', t: 'textarea', v: a.notes }]); if (v && v.assets && !/^https:\/\/drive\.google\.com\//.test(v.assets)) return toast('La carpeta de assets debe ser un link de Google Drive', true); if (v && (await saveAcc({ ...a, ...v }))) { toast('Guardado'); paint(); } },
      acadd: async () => { const v = await ask('Nuevo acceso', [{ k: 'servicio', l: 'Cuenta o servicio', req: true }, { k: 'usuario', l: 'Usuario', half: true }, { k: 'donde', l: 'Dónde está la clave', half: true }]); if (!v) return; if (/contrase|password|clave:/i.test(v.usuario + ' ' + v.donde) && !(await confirmAsk('Parece que escribiste una contraseña. Aquí solo va DÓNDE está. ¿Guardar igual?'))) return; if (await saveAcc({ ...a, accesos: [...(a.accesos || []), v] })) paint(); },
      acedit: async (t) => { const i = +t.dataset.i, x = (a.accesos || [])[i]; if (!x) return; const v = await sheetForm('Editar acceso', [{ k: 'servicio', l: 'Cuenta o servicio', v: x.servicio, req: true }, { k: 'usuario', l: 'Usuario', v: x.usuario }, { k: 'donde', l: 'Dónde está la clave', v: x.donde, help: 'Nunca la contraseña: solo dónde está guardada' }], { chip: html`${ico('lock', 12)} Accesos` }); if (!v) return; if (/contrase|password|clave:/i.test(v.usuario + ' ' + v.donde) && !(await confirmAsk('Parece que escribiste una contraseña. Aquí solo va DÓNDE está. ¿Guardar igual?'))) return; const l = [...(a.accesos || [])]; l[i] = v; if (await saveAcc({ ...a, accesos: l })) { toast('Guardado'); paint(); } },
      esedit: async (t) => { const k = +t.dataset.k, x = (a.mentors || [])[k]; if (!x) return; const m = mentors.find((y) => y.id === x.id); const gl = goalsOf(a); const v = await sheetForm(`Editar especialista${m ? ' · ' + m.name : ''}`, [{ k: 'cadence', l: 'Cada cuánto', t: 'select', opts: CADENCE, v: x.cadence }, { k: 'goal', l: 'Para qué meta', t: 'select', opts: [['', '— Ninguna'], ...gl.map((g, i) => [String(i), g.goal])], v: x.goal == null ? '' : String(x.goal) }, { k: 'note', l: 'Para qué lo traemos', t: 'textarea', v: x.note }]); if (!v) return; const l = [...a.mentors]; l[k] = { ...x, cadence: v.cadence, goal: v.goal === '' ? null : +v.goal, note: v.note }; if (await saveAcc({ ...a, mentors: l })) { toast('Guardado'); paint(); } },
      acdel: async (t) => { if (await saveAcc({ ...a, accesos: (a.accesos || []).filter((_, i) => i !== +t.dataset.i) })) paint(); },
      acwadd: async () => { const opts = team.filter((p) => !(a.accesos_to || []).includes(p.email || p.id)).map((p) => [p.email || p.id, p.name || p.email || p.id]); if (!opts.length) return toast('No hay más personas en el equipo'); const v = await ask('¿Quién más ve los accesos?', [{ k: 'e', l: 'Persona', t: 'select', opts, req: true }]); if (!v) return; if (await saveAcc({ ...a, accesos_to: [...(a.accesos_to || []), v.e] })) paint(); },
      acwdel: async (t) => { if (await saveAcc({ ...a, accesos_to: (a.accesos_to || []).filter((e) => e !== t.dataset.e) })) paint(); },
    }));
    paint();
    if (me.areas.includes('library')) col('docs').list().then((l) => { docs = l || []; refresh(); }).catch(() => {});
    if (me.areas.includes('sales')) Promise.all([col('leads').list(), col('quotes').list().catch(() => [])]).then(([leads, qs]) => {
      const qIds = new Set([a.onboarding?.from_quote, a.from_quote].filter(Boolean));
      const lid = qs.filter((q) => q.client_slug === slug || qIds.has(q.id)).map((q) => q.lead_id).find(Boolean);
      const l = leads.find((x) => x.id === lid) || leads.find((x) => x.client_slug === slug);
      if (l) { origin = { id: l.id, source: l.source || 'Sin fuente', name: l.name }; refresh(); }
    }).catch(() => {});
  }
}
