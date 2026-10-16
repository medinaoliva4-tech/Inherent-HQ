import { SECTIONS, GROUPS, SUMMARY, LEVELS, LEVEL_HELP, SCOPES, SCOPE_HELP, STARTS, baseAreas } from '../roleviews.js';
import { events, html, raw, mount, col, api, drawer, closeDrawer, ask, toast, initials, IC, acts, confirmAsk, teamList, squareImage, cropImage, WORK_ROLES, roleName, $, teamDoc, ico } from '../core.js';
import { bdayText } from './me.js';
import { recetasPanel } from '../recetas.js';

const COLORS = ['#36271b', '#997d65', '#87684e', '#a18770', '#a68d77', '#735741'];
const KIND = { persona: 'Persona', ia: 'Agente IA', externo: 'Externo' };
const ROLE = { ceo: 'CEO · acceso total', coo: 'COO · todo menos Finanzas', team: 'Equipo · Workspace, Contenido, Conocimiento' };
const T = col('team'), RV = col('settings');

export async function render(el, { me, sub = [] }) {
  let people = (await teamList()).filter((p) => p.active !== false || me.role === 'ceo');
  const isCeo = me.role === 'ceo';
  // Organigrama y Perfiles son pestañas de aquí; Vistas por rol y Recetas son pestañas de Administración (#/team/vistas, #/team/recetas).
  let view = ['people', 'vistas', 'recetas'].includes(sub[0]) && (isCeo || sub[0] === 'people') ? sub[0] : 'org';
  // Quién ocupa cada rol según el manual (tabla de slots de 05-OPERACION.md) y los pagos por servicio, y que no
  // está todavía en el organigrama. Las herramientas (IA, scraping, Zernio, Figma) no son personas.
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\(.*\)/, '').trim();
  let missing = [];
  async function findMissing() {
    if (!isCeo) return;
    const byName = new Map();
    const add = (name, role, kind = 'persona') => { const k = norm(name); if (!k) return; const x = byName.get(k) || byName.set(k, { name: name.replace(/\s*\(.*\)/, '').trim(), roles: [], kind }).get(k); if (!x.roles.includes(role)) x.roles.push(role); if (kind === 'ia') x.kind = 'ia'; };
    try {
      const eco = await api('repo/economia');
      for (const s of eco.slots || []) {
        if (/^(CEO|IA|Scraping|Diseño|Publicaci)/i.test(s.slot)) continue;
        const ia = /agente/i.test(s.hoy); add(s.hoy.split(/\s+—\s+/)[0], s.slot, ia ? 'ia' : 'persona');
      }
    } catch {}
    try { const pay = await col('payroll').get('default'); for (const pp of pay.personas || []) { const roles = Object.entries(pay.reparto || {}).filter(([, sp]) => sp.some((x) => x.p === pp.id && +x.pct > 0)).map(([r]) => r); if (!roles.length) add(pp.nombre, 'Nómina'); else roles.forEach((r) => add(pp.nombre, r)); } } catch {}
    missing = [...byName.values()].filter((x) => !people.some((p) => norm(p.name) === norm(x.name) || norm(p.name).split(' ')[0] === norm(x.name)));
  }
  async function importMissing() {
    const coo = missing.find((x) => x.roles.includes('COO')) || null;
    const order = [...missing].sort((a, b) => (b === coo) - (a === coo));
    let cooId = people.find((p) => /\bCOO\b/.test(p.title || ''))?.id || null;
    try {
      for (const x of order) {
        const r = await T.create({ name: x.name, title: x.roles.join(' · '), kind: x.kind, role: 'team', active: true, reports_to: x === coo ? me.email : cooId || me.email, color: COLORS[(people.length + 1) % COLORS.length] });
        people.push(r); if (x === coo) cooId = r.id;
      }
      toast(`${order.length} ${order.length === 1 ? 'persona agregada' : 'personas agregadas'} al organigrama`); missing = []; paint();
    } catch (e) { toast(e.message, true); }
  }
  const byId = (id) => people.find((p) => p.id === id);
  const av = (p, size = 56) => p.picture
    ? html`<img src="${p.picture}" referrerpolicy="no-referrer" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:3px solid #fdfaf3;box-shadow:0 6px 16px rgba(26,18,12,.12)">`
    : html`<div class="bigav" style="width:${size}px;height:${size}px;background:${p.color || COLORS[0]}">${initials(p.name)}</div>`;

  function node(p) {
    const cls = p.kind === 'ia' ? 'ai' : !p.reports_to ? 'dark' : '';
    return html`<div class="node ${cls}" data-act="open" data-id="${p.id}"><div style="display:flex;justify-content:center;margin-bottom:10px">${av(p)}</div><b>${p.name}</b><span class="mut sm">${p.title || KIND[p.kind] || ''}</span>${p.birthday ? html`<span class="mut sm">${ico('cake')} ${bdayText(p.birthday)}</span>` : ''}</div>`;
  }
  function org() {
    if (!people.length) return html`<div class="empty"><b>Todavía no hay nadie</b>Cada persona aparece aquí cuando entra con Google por primera vez.</div>`;
    const roots = people.filter((p) => !p.reports_to || !byId(p.reports_to));
    const levels = [roots]; const seen = new Set(roots.map((r) => r.id));
    while (levels.length < 6) {
      const next = people.filter((p) => !seen.has(p.id) && levels.at(-1).some((x) => x.id === p.reports_to));
      if (!next.length) break; next.forEach((n) => seen.add(n.id)); levels.push(next);
    }
    return html`<div class="org">${levels.map((lv, i) => html`<div class="lvl ${i === 0 ? 'first' : ''} ${lv.length > 2 ? 'wide' : ''}">${lv.map(node)}</div>`)}</div>`;
  }
  function cards() {
    return html`<div class="grid g3">${people.map((p) => html`<div class="card" style="cursor:pointer" data-act="open" data-id="${p.id}">
      <div class="row">${av(p, 52)}<div><b style="font-weight:500;font-size:16px">${p.name}</b><div class="mut sm">${p.title || KIND[p.kind] || ''}</div></div><div class="arrow light" style="width:34px;height:34px;margin-left:auto">↗</div></div>
      <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:14px">
        ${p.kind === 'ia' ? html`<span class="chip">Agente IA</span>` : p.kind === 'externo' ? html`<span class="chip">Externo</span>` : html`<span class="chip ${p.google ? 'green' : ''}">${p.google ? 'Google conectado' : 'Aún no entra'}</span>`}
        ${p.active === false ? html`<span class="chip red">Desactivado</span>` : ''}
      </div></div>`)}</div>`;
  }
  // ---------- Vistas por rol: qué sección ve cada perfil de trabajo, qué tan a fondo, qué datos y dónde abre ----------
  // Se aplica en el servidor (API y conector de Claude), no solo en la pantalla. El CEO siempre ve y edita todo.
  let rv = null, rvRole = 'content', rvLoaded = false;
  const rvCfg = () => (rv?.views || {})[rvRole];
  // Lo de siempre para un perfil: lo que ve su rol de acceso sin configurar (el COO sus áreas; los demás, las del equipo).
  const rvBase = (sec) => (baseAreas(rvRole === 'coo' ? 'coo' : 'team', [rvRole]).includes(sec) ? 'edita' : 'oculto');
  const rvLevel = (sec) => (rvCfg()?.[sec] in LEVEL_HELP ? rvCfg()[sec] : rvBase(sec));
  const rvScope = () => (rv?.scope || {})[rvRole] || 'todos';
  const rvStart = () => (rv?.start || {})[rvRole] || (rvRole === 'coo' ? 'control' : 'work');
  const rvShort = (k) => roleName(k).split(' · ')[0];
  // Lo que la matriz no cambia: Finance se queda en resumen para quien no es CEO; Team siempre se ve al menos en resumen.
  const rvFixed = (sec, v) => (sec === 'finanzas' && (v === 'completo' || v === 'edita')) || (sec === 'team' && v === 'oculto');
  function vistas() {
    if (!rvLoaded) { RV.get('role_views').then((d) => { rv = d; }).catch(() => { rv = null; }).then(() => { rvLoaded = true; if (view === 'vistas') paint(); }); return html`<p class="loading">Cargando…</p>`; }
    const holders = people.filter((p) => (p.roles || []).includes(rvRole) && p.active !== false);
    const touched = Boolean(rvCfg()) || Boolean((rv?.scope || {})[rvRole]) || Boolean((rv?.start || {})[rvRole]);
    return html`<div class="card" style="padding:22px">
      <div class="mut sm" style="max-width:680px">Elige un perfil de trabajo y decide <b>qué ve</b>, <b>qué tan a fondo</b>, <b>de qué clientes</b> y <b>dónde abre</b>. Se guarda al tocar y se aplica en el servidor: lo oculto no sale ni por la app ni por el conector de Claude. Un perfil sin configurar sigue como hoy. Si una persona tiene varios perfiles, gana el más amplio. Tú, como CEO, siempre ves y editas todo.</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin:16px 0">${WORK_ROLES.filter(([k]) => k !== 'ceo').map(([k]) => html`<button class="chip ${rvRole === k ? 'dark' : ''}" data-act="rvrole" data-r="${k}" style="padding:8px 14px">${rvShort(k)}${(rv?.views || {})[k] || (rv?.scope || {})[k] || (rv?.start || {})[k] ? ' ●' : ''}</button>`)}</div>
      <div class="row sm" style="margin-bottom:6px"><b style="font-weight:500">${roleName(rvRole)}</b><span class="mut">${holders.length ? ' · lo tienen: ' + holders.map((x) => x.name.split(' ')[0]).join(', ') : ' · nadie lo tiene todavía'}</span><div class="sp"></div>${touched ? html`<button class="btn ghost xs" data-act="rvreset">Restablecer (como hoy)</button>` : html`<span class="mut sm">Sin configurar · como hoy</span>`}</div>
      <div class="grid g11" style="gap:12px;margin:10px 0 6px">
        <div class="card" style="padding:14px 16px"><b style="font-weight:500">Qué datos ve</b><div class="mut sm" style="margin:2px 0 8px">${SCOPE_HELP[rvScope()]}</div>
          <div class="tabs mini" style="margin:0">${SCOPES.map(([v, lb]) => html`<button class="${rvScope() === v ? 'on' : ''}" data-act="rvscope" data-v="${v}">${lb}</button>`)}</div></div>
        <div class="card" style="padding:14px 16px"><b style="font-weight:500">Dónde abre al entrar</b><div class="mut sm" style="margin:2px 0 8px">El «para qué»: cada perfil abre en lo que tiene que hacer, no en un tablero general.</div>
          <select class="in" data-act="rvstart" style="width:auto">${STARTS.map(([v, lb]) => html`<option value="${v}" ${rvStart() === v ? raw('selected') : ''}>${lb}</option>`)}</select></div>
      </div>
      <div class="row sm mut" style="gap:14px;flex-wrap:wrap;margin:14px 0 4px">${LEVELS.map(([v, lb]) => html`<span><b style="font-weight:500">${lb}</b>: ${LEVEL_HELP[v]}</span>`)}</div>
      ${GROUPS.map(([g, gl, list]) => html`${list.length > 1 ? html`<div class="lbl" style="margin:18px 0 2px">${gl}</div>` : ''}${SECTIONS.filter(([k]) => list.includes(k)).map(([k, l]) => html`<div class="row" style="gap:12px;flex-wrap:wrap;padding:11px 0;border-top:1px solid var(--line)"><div style="flex:1;min-width:150px"><b style="font-weight:500">${l}</b>${rvCfg()?.[k] in LEVEL_HELP ? '' : html` <span class="mut sm">· como hoy</span>`}${SUMMARY[k] ? html`<div class="mut sm">Resumen: ${SUMMARY[k]}</div>` : ''}${k === 'finanzas' ? html`<div class="mut sm">Costos, márgenes, tarifas y pagos son solo del CEO: para los demás, Finanzas llega hasta resumen.</div>` : k === 'team' ? html`<div class="mut sm">Siempre se ve (quién es quién); cambiar personas y esta matriz es solo tuyo.</div>` : k === 'resultados' ? html`<div class="mut sm">Cada bloque (Comercial, entregas, Finanzas, clientes) sale solo si también ve esa sección.</div>` : ''}</div>
        <div class="tabs mini" style="margin:0">${LEVELS.filter(([v]) => v !== 'resumen' || SUMMARY[k]).map(([v, lb]) => html`<button class="${rvLevel(k) === v ? 'on' : ''}" data-act="rvset" data-s="${k}" data-l="${v}" ${rvFixed(k, v) ? 'disabled' : ''}>${lb}</button>`)}</div></div>`)}`)}
    </div>`;
  }
  async function rvSave(patch) {
    try {
      const doc = { ...(rv || {}), id: 'role_views', views: rv?.views || {}, scope: rv?.scope || {}, start: rv?.start || {}, ...patch };
      const r = rv?.v != null ? await RV.save(doc) : await RV.create(doc);
      rv = r; paint(); events.dispatchEvent(new CustomEvent('roleviews', { detail: r })); toast('Guardado');
    } catch (e) { toast(e.message, true); if (/cambió|Recarga/i.test(e.message)) { rvLoaded = false; rv = null; paint(); } }
  }
  function paint() {
    const admin = view === 'vistas' || view === 'recetas';
    const TITLE = { vistas: ['Vistas por rol', 'Qué ve cada perfil, <em>qué tan a fondo</em> y dónde abre.'], recetas: ['Recetas', 'Cómo se arma el trabajo: <em>tareas, dueños y fechas</em>.'] };
    mount(el, html`<div class="row" style="align-items:flex-end;margin-bottom:24px;flex-wrap:wrap;gap:12px">
      <div class="hello"><h1>${admin ? TITLE[view][0] : 'Equipo'}</h1><p style="margin:0">${admin ? raw(TITLE[view][1]) : html`Quién hace qué en <em>Inherent</em>.`}</p></div><div class="sp"></div>
      ${admin ? '' : html`<div class="tabs" style="margin:0"><button class="${view === 'org' ? 'on' : ''}" data-act="view" data-v="org">Organigrama</button><button class="${view === 'people' ? 'on' : ''}" data-act="view" data-v="people">Perfiles</button></div>
      ${isCeo ? html`<button class="btn" data-act="add">+ Agregar</button>` : ''}`}
    </div>
    ${missing.length && !admin ? html`<div class="warnbox" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px"><span style="flex:1">${missing.length === 1 ? '1 persona' : missing.length + ' personas'} del manual y la nómina no ${missing.length === 1 ? 'está' : 'están'} en el organigrama: <b>${missing.map((x) => x.name + ' (' + x.roles.join(', ') + ')').join(' · ')}</b></span><button class="btn" data-act="import">Agregarlas</button></div>` : ''}
    ${view === 'org' ? html`<div class="card" style="padding:34px 22px">${org()}</div>` : view === 'vistas' && isCeo ? vistas() : view === 'recetas' && isCeo ? html`<div id="rcbody"></div>` : cards()}`);
    if (view === 'recetas' && isCeo) recetasPanel($('#rcbody', el));
    const st = $('[data-act=rvstart]', el); if (st) st.onchange = () => rvSave({ start: { ...(rv?.start || {}), [rvRole]: st.value } });
  }

  async function edit(p) {
    const v = await ask(p ? `Editar a ${p.name}` : 'Agregar al equipo', [
      { k: 'name', l: 'Nombre', v: p?.name, req: true },
      ...(p ? [] : [{ k: 'email', l: 'Correo @inherentglobal.com (si va a entrar a la app)', t: 'email' }]),
      { k: 'title', l: 'Puesto', v: p?.title, half: true },
      { k: 'kind', l: 'Tipo', t: 'select', opts: Object.entries(KIND), v: p?.kind || 'persona', half: true },
      { k: 'role', l: 'Acceso a la app', t: 'select', opts: Object.entries(ROLE), v: p?.role || 'team' },
      { k: 'roles', l: 'Perfiles de trabajo (su Workspace)', t: 'checks', opts: WORK_ROLES, v: p?.roles || [] },
      { k: 'reports_to', l: 'Reporta a', t: 'select', opts: [['', '— nadie (arriba del organigrama)']].concat(people.filter((x) => x.id !== p?.id).map((x) => [x.id, x.name])), v: p?.reports_to || '' },
      { k: 'phone', l: 'Teléfono', v: p?.phone, half: true },
      { k: 'color', l: 'Color', t: 'select', opts: COLORS.map((c, i) => [c, ['Café', 'Terracota', 'Azul', 'Oliva', 'Dorado', 'Tierra'][i]]), v: p?.color || COLORS[0], half: true },
      ...(p ? [{ k: 'active', l: 'Estado', t: 'select', opts: [['true', 'Activo'], ['false', 'Desactivado (no puede entrar)']], v: String(p.active !== false) }] : []),
    ]);
    if (!v) return;
    try {
      if (p) {
        const saved = { ...(await T.save(teamDoc({ ...p, ...v, active: v.active !== 'false' }))) }; saved.google_picture = saved.picture; saved.picture = saved.photo || saved.picture;
        people = people.map((x) => (x.id === saved.id ? saved : x));
      } else {
        const id = v.email ? v.email.toLowerCase() : undefined;
        delete v.email;
        people.push(await T.create({ ...v, ...(id ? { id, email: id } : {}), active: true }));
      }
      toast('Guardado'); closeDrawer(); paint();
    } catch (e) { toast(e.message, true); }
  }

  async function setPhoto(p, photo) {
    try {
      if (p.id === me.email) await api('me/photo', { method: 'PUT', body: { photo } });
      else { const r = await T.save(teamDoc({ ...p, photo })); Object.assign(p, r); }
      p.photo = photo; p.picture = photo || p.google_picture || null;
      toast(photo ? 'Foto actualizada' : 'Foto quitada'); people = people.map((x) => (x.id === p.id ? p : x)); paint(); open(p);
      if (p.id === me.email) { const a = $('#avatar'); if (a && photo) a.innerHTML = `<img src="${photo}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`; }
    } catch (e) { toast(e.message, true); }
  }
  function open(p) {
    const boss = byId(p.reports_to);
    drawer(html`<div class="row"><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <div style="margin-top:6px">${av(p, 84)}</div>
      <h2>${p.name}</h2><div class="mut">${p.title || KIND[p.kind] || ''}</div>
      ${p.birthday || p.phone || p.bio ? html`<div class="sm" style="margin-top:10px;display:grid;gap:4px">${p.birthday ? html`<div>${ico('cake')} ${bdayText(p.birthday)}</div>` : ''}${p.phone ? html`<div>${ico('mobile')} ${p.phone}</div>` : ''}${p.bio ? html`<div class="mut">${p.bio}</div>` : ''}</div>` : ''}
      <div class="kv"><span>Tipo</span><b style="font-weight:500">${KIND[p.kind] || 'Persona'}</b>
        <span>Reporta a</span><b style="font-weight:500">${boss ? boss.name : '—'}</b>
        ${p.email ? html`<span>Correo</span><b style="font-weight:500">${p.email}</b>` : ''}
        ${p.phone ? html`<span>Teléfono</span><b style="font-weight:500">${p.phone}</b>` : ''}
        ${p.email ? html`<span>Acceso</span><b style="font-weight:500">${ROLE[p.role || 'team']}</b>` : ''}
        <span>Perfiles</span><b style="font-weight:500">${(p.roles || []).length ? p.roles.map(roleName).join(' · ') : '—'}</b>
        ${p.email ? html`<span>Google</span><span class="row" style="color:var(--ink)">${p.google?.calendar ? html`<span class="gbadge">${IC.cal} Calendar</span>` : ''}${p.google?.drive ? html`<span class="gbadge">${IC.drive} Drive</span>` : ''}${!p.google ? 'Aún no entra' : ''}</span>` : ''}
      </div>
      ${p.id === me.email || isCeo ? html`<div class="row" style="margin-bottom:10px"><label class="btn ghost" style="cursor:pointer">${ico('camera')} ${p.photo ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" id="photoIn" hidden></label>${p.photo ? html`<button class="btn ghost" data-act="nophoto">Quitar foto</button>` : ''}</div>` : ''}
      ${isCeo && p.id !== me.email && p.kind !== 'ia' ? html`<a class="btn ghost" href="#/work/zona/_/${p.email || p.id}" style="margin-bottom:10px;text-decoration:none">${ico('eye')} Ver su Workspace</a>` : ''}
      ${isCeo ? html`<div class="row"><button class="btn" data-act="edit">Editar perfil</button>${p.id !== me.email ? html`<button class="btn ghost" data-act="del">Quitar</button>` : ''}</div>` : ''}`,
    { nophoto: () => setPhoto(p, null), edit: () => edit(p), del: async () => { if (!(await confirmAsk(`¿Quitar a ${p.name} del equipo?`))) return; await T.remove(p.id); people = people.filter((x) => x.id !== p.id); closeDrawer(); paint(); } });
    const pi = $('#photoIn'); if (pi) pi.onchange = async () => { if (pi.files[0]) try { const ph = await cropImage(pi.files[0]); pi.value = ''; if (ph) await setPhoto(p, ph); } catch (err) { toast(err.message, true); } };
  }

  acts(el, {
    rvrole: (b) => { rvRole = b.dataset.r; paint(); },
    // Al tocar una sección, el perfil queda configurado con todo lo que se ve en pantalla (lo demás como hoy).
    rvset: (b) => { const base = Object.fromEntries(SECTIONS.map(([k]) => [k, rvLevel(k)])); rvSave({ views: { ...(rv?.views || {}), [rvRole]: { ...base, [b.dataset.s]: b.dataset.l } } }); },
    rvscope: (b) => rvSave({ scope: { ...(rv?.scope || {}), [rvRole]: b.dataset.v } }),
    rvreset: () => { const v = { ...(rv?.views || {}) }, sc = { ...(rv?.scope || {}) }, st = { ...(rv?.start || {}) }; delete v[rvRole]; delete sc[rvRole]; delete st[rvRole]; rvSave({ views: v, scope: sc, start: st }); },
    view: (b) => { view = b.dataset.v; history.replaceState(null, '', view === 'org' ? '#/team' : '#/team/' + view); paint(); }, add: () => edit(null), open: (b) => open(byId(b.dataset.id)), import: importMissing });
  paint();
  findMissing().then(() => missing.length && paint());
}
