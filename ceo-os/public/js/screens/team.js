import { html, mount, col, drawer, closeDrawer, ask, toast, initials, IC, acts, confirmAsk } from '../core.js';

const COLORS = ['#26201a', '#c2735a', '#4f7790', '#7f9631', '#b08a5f', '#6b5a45'];
const KIND = { persona: 'Persona', ia: 'Agente IA', externo: 'Externo' };
const ROLE = { ceo: 'CEO · acceso total', coo: 'COO · todo menos Finance', team: 'Equipo · Operations, Content, Library' };
const T = col('team');

export async function render(el, { me }) {
  let people = (await T.list()).filter((p) => p.active !== false || me.role === 'ceo');
  const isCeo = me.role === 'ceo';
  let view = 'org';
  const byId = (id) => people.find((p) => p.id === id);
  const av = (p, size = 56) => p.picture
    ? html`<img src="${p.picture}" referrerpolicy="no-referrer" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.12)">`
    : html`<div class="bigav" style="width:${size}px;height:${size}px;background:${p.color || COLORS[0]}">${initials(p.name)}</div>`;

  function node(p) {
    const cls = p.kind === 'ia' ? 'ai' : !p.reports_to ? 'dark' : '';
    return html`<div class="node ${cls}" data-act="open" data-id="${p.id}"><div style="display:flex;justify-content:center;margin-bottom:10px">${av(p)}</div><b>${p.name}</b><span class="mut sm">${p.title || KIND[p.kind] || ''}</span></div>`;
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
  function paint() {
    mount(el, html`<div class="row" style="align-items:flex-end;margin-bottom:24px">
      <div class="hello"><h1>Team</h1><p style="margin:0">Quién hace qué en <em>Inherent</em>.</p></div><div class="sp"></div>
      <div class="tabs" style="margin:0"><button class="${view === 'org' ? 'on' : ''}" data-act="view" data-v="org">Organigrama</button><button class="${view === 'people' ? 'on' : ''}" data-act="view" data-v="people">Perfiles</button></div>
      ${isCeo ? html`<button class="btn" data-act="add" style="margin-left:10px">+ Agregar</button>` : ''}
    </div>
    ${view === 'org' ? html`<div class="card" style="padding:34px 22px">${org()}</div>` : cards()}`);
  }

  async function edit(p) {
    const v = await ask(p ? `Editar a ${p.name}` : 'Agregar al equipo', [
      { k: 'name', l: 'Nombre', v: p?.name, req: true },
      ...(p ? [] : [{ k: 'email', l: 'Correo @inherentglobal.com (si va a entrar a la app)', t: 'email' }]),
      { k: 'title', l: 'Puesto', v: p?.title, half: true },
      { k: 'kind', l: 'Tipo', t: 'select', opts: Object.entries(KIND), v: p?.kind || 'persona', half: true },
      { k: 'role', l: 'Acceso a la app', t: 'select', opts: Object.entries(ROLE), v: p?.role || 'team' },
      { k: 'reports_to', l: 'Reporta a', t: 'select', opts: [['', '— nadie (arriba del organigrama)']].concat(people.filter((x) => x.id !== p?.id).map((x) => [x.id, x.name])), v: p?.reports_to || '' },
      { k: 'phone', l: 'Teléfono', v: p?.phone, half: true },
      { k: 'color', l: 'Color', t: 'select', opts: COLORS.map((c, i) => [c, ['Café', 'Terracota', 'Azul', 'Oliva', 'Dorado', 'Tierra'][i]]), v: p?.color || COLORS[0], half: true },
      ...(p ? [{ k: 'active', l: 'Estado', t: 'select', opts: [['true', 'Activo'], ['false', 'Desactivado (no puede entrar)']], v: String(p.active !== false) }] : []),
    ]);
    if (!v) return;
    try {
      if (p) {
        const saved = await T.save({ ...p, ...v, active: v.active !== 'false' });
        people = people.map((x) => (x.id === saved.id ? saved : x));
      } else {
        const id = v.email ? v.email.toLowerCase() : undefined;
        delete v.email;
        people.push(await T.create({ ...v, ...(id ? { id, email: id } : {}), active: true }));
      }
      toast('Guardado ✅'); closeDrawer(); paint();
    } catch (e) { toast(e.message, true); }
  }

  function open(p) {
    const boss = byId(p.reports_to);
    drawer(html`<div class="row"><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
      <div style="margin-top:6px">${av(p, 84)}</div>
      <h2>${p.name}</h2><div class="mut">${p.title || KIND[p.kind] || ''}</div>
      <div class="kv"><span>Tipo</span><b style="font-weight:500">${KIND[p.kind] || 'Persona'}</b>
        <span>Reporta a</span><b style="font-weight:500">${boss ? boss.name : '—'}</b>
        ${p.email ? html`<span>Correo</span><b style="font-weight:500">${p.email}</b>` : ''}
        ${p.phone ? html`<span>Teléfono</span><b style="font-weight:500">${p.phone}</b>` : ''}
        ${p.email ? html`<span>Acceso</span><b style="font-weight:500">${ROLE[p.role || 'team']}</b>` : ''}
        ${p.email ? html`<span>Google</span><span class="row" style="color:var(--ink)">${p.google?.calendar ? html`<span class="gbadge">${IC.cal} Calendar</span>` : ''}${p.google?.drive ? html`<span class="gbadge">${IC.drive} Drive</span>` : ''}${!p.google ? 'Aún no entra' : ''}</span>` : ''}
      </div>
      ${isCeo ? html`<div class="row"><button class="btn" data-act="edit">Editar perfil</button>${p.id !== me.email ? html`<button class="btn ghost" data-act="del">Quitar</button>` : ''}</div>` : ''}`,
    { edit: () => edit(p), del: async () => { if (!(await confirmAsk(`¿Quitar a ${p.name} del equipo?`))) return; await T.remove(p.id); people = people.filter((x) => x.id !== p.id); closeDrawer(); paint(); } });
  }

  acts(el, { view: (b) => { view = b.dataset.v; paint(); }, add: () => edit(null), open: (b) => open(byId(b.dataset.id)) });
  paint();
}
