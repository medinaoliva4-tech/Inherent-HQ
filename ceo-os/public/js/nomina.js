import { h, api, Q, toast, readJSON, saveJSON, PALETTE } from './core.js';

// Nómina = Σ de lo que cada cuenta paga a cada rol, repartido en % entre las personas de ese rol.
const FILE = 'ceo-os/data/finanzas/nomina.json';
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const planIdOf = (t = '') => (/tailor/i.test(t) ? 'tailor' : /pro\b/i.test(t) ? 'pro' : /accelerate/i.test(t) ? 'accelerate' : /compound/i.test(t) ? 'compound' : /marketing/i.test(t) ? 'marketing' : 'tailor');
const SLOT_OF = { 'Grabación': 'Producción', 'Fotografía': 'Fotografía', 'Edición de video': 'Editor de video', 'Operador de agentes': 'Operador de agentes' };

export async function renderNomina(box, { plans, rubroNames, slots }) {
  const rubros = rubroNames.filter((r) => !/buffer/i.test(r));
  const color = (r) => PALETTE[rubroNames.indexOf(r) % PALETTE.length];
  const planOpts = [...plans.map((p) => [p.id, p.name]), ['tailor', 'TAILOR MADE']];

  let { data: d, sha } = await readJSON(FILE, null);
  let clients = [];
  try { clients = (await api('/api/clients')).clients; } catch (e) { toast(e.message, true); }

  let seeded = false;
  if (!d) { // primera vez: se siembra del repo, y NO se guarda hasta que el CEO lo confirme
    seeded = true;
    d = { personas: [], reparto: {}, cuentas: [] };
    for (const r of rubros) {
      const nombre = slots.find((s) => s.slot.startsWith(SLOT_OF[r] || '§'))?.hoy.replace(/\s*\(.*\)/, '').trim();
      if (!nombre) continue;
      const id = slug(nombre);
      if (!d.personas.find((p) => p.id === id)) d.personas.push({ id, nombre });
      d.reparto[r] = [{ p: id, pct: 100 }];
    }
    const byCost = new Map();
    for (const c of clients.filter((x) => x.hasPlan)) {
      const pid = planIdOf(c.plan);
      const key = pid === 'tailor' && c.costo != null ? `t:${c.costo}` : `s:${c.slug}`; // mismo costo declarado = una sola cuenta compartida
      (byCost.get(key) || byCost.set(key, []).get(key)).push({ c, pid });
    }
    for (const g of byCost.values()) {
      d.cuentas.push({ id: slug(g.map((x) => x.c.slug).join('-')), nombre: g.map((x) => x.c.slug.toUpperCase()).join(' + '), planId: g[0].pid, costoDeclarado: g[0].c.costo ?? null, montos: {}, reparto: {} });
    }
  }
  d.personas ||= []; d.reparto ||= {}; d.cuentas ||= [];

  const live = h('div');

  function compute() {
    const pay = {}, det = {}, pool = {}, sin = [], falta = [];
    for (const p of d.personas) { pay[p.id] = 0; det[p.id] = []; }
    for (const c of d.cuentas) {
      const plan = plans.find((x) => x.id === c.planId);
      for (const r of rubros) {
        const base = c.montos?.[r] ?? plan?.rubros.find((x) => x.label === r)?.monto;
        if (base == null) { falta.push(`${c.nombre} · ${r}`); continue; }
        if (!base) continue;
        pool[r] = (pool[r] || 0) + base;
        const split = c.reparto?.[r] ?? d.reparto[r] ?? [];
        const tot = split.reduce((a, s) => a + (+s.pct || 0), 0);
        if (tot < 99.99) sin.push({ cuenta: c.nombre, r, q: (base * (100 - tot)) / 100 });
        if (tot > 100.01) sin.push({ cuenta: c.nombre, r, q: 0, exceso: tot });
        for (const s of split) { const q = (base * (+s.pct || 0)) / 100; if (pay[s.p] == null) continue; pay[s.p] += q; det[s.p].push({ cuenta: c.nombre, r, q }); }
      }
    }
    return { pay, det, pool, sin, falta };
  }

  function editSplit(titulo, current, onSave) {
    const rows = (current || []).map((s) => ({ ...s }));
    const list = h('div', { class: 'grid' });
    const paint = () => {
      const tot = rows.reduce((a, s) => a + (+s.pct || 0), 0);
      list.replaceChildren(
        ...rows.map((s, i) => h('div', { class: 'row' },
          h('select', { onchange: (e) => (s.p = e.target.value) }, d.personas.map((p) => h('option', { value: p.id, selected: p.id === s.p }, p.nombre))),
          h('input', { type: 'number', min: 0, max: 100, value: s.pct, class: 'fit', oninput: (e) => { s.pct = +e.target.value; paint2(); } }),
          h('button', { class: 'btn danger sm fit', onclick: () => { rows.splice(i, 1); paint(); } }, '✕'))),
        h('div', { class: 'sm ' + (Math.abs(tot - 100) < 0.01 ? 'ok' : 'warn') }, `Suma: ${tot}% ${Math.abs(tot - 100) < 0.01 ? '✅' : '— debe sumar 100%'}`));
    };
    const paint2 = () => {};
    const dlg = h('dialog', { class: 'dlg' }, h('div', { class: 'grid' }, h('h3', { style: { margin: 0 } }, titulo), list,
      h('div', { class: 'row' }, h('button', { class: 'btn sec', onclick: () => { rows.push({ p: d.personas[0]?.id, pct: 0 }); paint(); } }, '+ Persona'),
        h('button', { class: 'btn', onclick: () => { onSave(rows.filter((s) => s.p)); dlg.close(); } }, 'Aplicar'), h('button', { class: 'btn sec', onclick: () => dlg.close() }, 'Cancelar'))));
    document.body.append(dlg); dlg.addEventListener('close', () => dlg.remove()); paint(); dlg.showModal();
  }

  // Los handlers llaman paint() (diferido): repintar en pleno evento change/blur rompe el DOM que lo disparó.
  const paint = () => setTimeout(draw, 0);
  function draw() {
    const { pay, det, pool, sin, falta } = compute();
    const total = Object.values(pay).reduce((a, b) => a + b, 0);
    const poolTot = Object.values(pool).reduce((a, b) => a + b, 0);
    const sinTot = sin.reduce((a, s) => a + s.q, 0);
    const kpi = (t, v, s, c) => h('div', { class: 'card' }, h('h4', {}, t), h('div', { class: 'big ' + (c || '') }, v), h('div', { class: 'sm mut' }, s));

    live.replaceChildren(h('div', {},
      seeded ? h('p', { class: 'warn' }, '⚠️ Borrador sembrado del repo (clientes + ocupantes de cada rol). Revísalo y dale «Guardar en el repo».') : null,
      h('div', { class: 'grid g4' },
        kpi('Nómina del mes', Q(total), `${d.personas.length} persona(s) · ${d.cuentas.length} cuenta(s)`),
        kpi('Pool de rubros', Q(poolTot), 'lo que las cuentas pagan a los roles'),
        kpi('Sin asignar', Q(sinTot), sin.length ? `${sin.length} rubro(s) sin 100%` : 'todo repartido', sin.length ? 'warn' : 'ok'),
        kpi('Sin datos', String(falta.length), falta.length ? 'cuenta × rubro sin monto' : 'completo', falta.length ? 'bad' : 'ok')),

      h('h3', {}, '👤 El mes de cada persona'),
      !d.personas.length ? h('p', { class: 'warn' }, '⚠️ SIN DATOS — agrega personas abajo.') : null,
      h('div', { class: 'grid g2' }, d.personas.map((p) => {
        const roles = d.reparto && Object.entries(d.reparto).filter(([, v]) => v.some((s) => s.p === p.id)).map(([r, v]) => [r, v.find((s) => s.p === p.id).pct]);
        return h('div', { class: 'card' }, h('h4', {}, p.nombre), h('div', { class: 'big' }, Q(pay[p.id])), h('div', { class: 'sm mut' }, total ? `${((pay[p.id] / total) * 100).toFixed(0)}% de la nómina` : ''),
          h('div', { class: 'bar' }, h('i', { style: { width: (total ? (pay[p.id] / total) * 100 : 0) + '%' } })),
          h('div', { class: 'chips' }, roles.length ? roles.map(([r, pct]) => h('span', { class: 'chip' }, `${r} ${pct}%`)) : h('span', { class: 'chip warn' }, 'sin rol asignado')),
          det[p.id].length ? h('details', { style: { marginTop: '10px' } }, h('summary', { class: 'sm mut' }, 'De dónde sale'),
            h('table', {}, h('tbody', {}, det[p.id].map((x) => h('tr', {}, h('td', { class: 'sm' }, x.cuenta), h('td', { class: 'sm mut' }, x.r), h('td', { class: 'n sm' }, Q(x.q))))))) : null);
      })),

      h('h3', {}, '🎚️ Reparto por rol (% del rubro entre personas)'),
      h('p', { class: 'sub' }, 'Se define una vez por rol. Una cuenta puede tener su propio reparto con el botón 👥.'),
      h('div', { class: 'grid g2' }, rubros.map((r) => {
        const split = d.reparto[r] || []; const tot = split.reduce((a, s) => a + (+s.pct || 0), 0);
        return h('div', { class: 'card' }, h('h4', {}, h('i', { style: { background: color(r), display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', marginRight: '8px' } }), r),
          h('div', { class: 'sm mut' }, `pool del mes: ${Q(pool[r] || 0)}`),
          !split.length ? h('div', { class: 'sm warn' }, '⚠️ SIN DATOS — nadie ocupa este rol todavía') :
            h('table', {}, h('tbody', {}, split.map((s) => h('tr', {}, h('td', {}, d.personas.find((p) => p.id === s.p)?.nombre || '?'), h('td', { class: 'n' }, `${s.pct}%`), h('td', { class: 'n mut sm' }, Q(((pool[r] || 0) * s.pct) / 100)))))),
          h('div', { class: 'row', style: { marginTop: '8px' } },
            h('span', { class: 'sm ' + (Math.abs(tot - 100) < 0.01 ? 'ok' : split.length ? 'warn' : 'mut') }, split.length ? `${tot}% ${Math.abs(tot - 100) < 0.01 ? '✅' : '⚠️'}` : ''),
            h('button', { class: 'btn sec sm fit', onclick: () => editSplit(`Reparto de ${r}`, split, (rows) => { d.reparto[r] = rows; paint(); }) }, 'Editar')));
      })),

      h('h3', {}, '🧾 Cuentas — lo que cada una paga a cada rol'),
      h('p', { class: 'sub' }, 'Planes de lista: el monto viene del manual (gris). Tailor Made o excepción: escríbelo tú. 👥 = reparto propio de esa cuenta.'),
      h('div', { class: 'card tscroll' }, h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Cuenta'), h('th', {}, 'Plan'), ...rubros.map((r) => h('th', { class: 'n' }, r.replace(/\s*\(.*\)/, ''))), h('th', {}))),
        h('tbody', {}, d.cuentas.map((c, ci) => {
          const plan = plans.find((x) => x.id === c.planId);
          const sum = rubros.reduce((a, r) => a + (c.montos?.[r] ?? plan?.rubros.find((x) => x.label === r)?.monto ?? 0), 0);
          return h('tr', {},
            h('td', {}, h('input', { value: c.nombre, onchange: (e) => (c.nombre = e.target.value) }), c.costoDeclarado != null ? h('div', { class: 'sm ' + (c.planId === 'tailor' && Math.abs(sum - c.costoDeclarado) > 1 ? 'warn' : 'mut') }, `🔒 costo declarado ${Q(c.costoDeclarado)} · suma rubros ${Q(sum)}`) : null),
            h('td', {}, h('select', { onchange: (e) => { c.planId = e.target.value; paint(); } }, planOpts.map(([v, l]) => h('option', { value: v, selected: v === c.planId }, l)))),
            ...rubros.map((r) => h('td', { class: 'n' },
              h('input', { type: 'number', class: 'mini', value: c.montos?.[r] ?? '', placeholder: plan ? String(plan.rubros.find((x) => x.label === r)?.monto ?? '') : 'Q', onchange: (e) => { c.montos ||= {}; if (e.target.value === '') delete c.montos[r]; else c.montos[r] = +e.target.value; paint(); } }),
              h('button', { class: 'btn sm ' + (c.reparto?.[r] ? '' : 'sec'), title: 'Reparto propio de esta cuenta', onclick: () => editSplit(`${c.nombre} · ${r}`, c.reparto?.[r] ?? d.reparto[r], (rows) => { c.reparto ||= {}; c.reparto[r] = rows; paint(); }) }, '👥'))),
            h('td', {}, h('button', { class: 'btn danger sm', onclick: () => { if (confirm(`¿Quitar la cuenta ${c.nombre}?`)) { d.cuentas.splice(ci, 1); paint(); } } }, '✕')));
        })))),
      sin.length ? h('div', { class: 'card warn-card' }, h('h4', {}, '⚠️ Rubros sin repartir al 100%'), h('ul', {}, sin.map((s) => h('li', { class: 'sm' }, s.exceso ? `${s.cuenta} · ${s.r}: suma ${s.exceso}% (pasa de 100)` : `${s.cuenta} · ${s.r}: ${Q(s.q)} sin asignar`)))) : null,
      falta.length ? h('div', { class: 'card warn-card' }, h('h4', {}, '⚠️ SIN DATOS — falta el monto'), h('div', { class: 'sm' }, falta.join(' · '))) : null,

      h('h3', {}, '➕ Agregar'),
      h('div', { class: 'grid g2' },
        addForm('Persona', [['nombre', 'Nombre', 'text']], (v) => { const id = slug(v.nombre); if (!id || d.personas.find((p) => p.id === id)) return toast('Nombre vacío o repetido', true); d.personas.push({ id, nombre: v.nombre }); paint(); }),
        addForm('Cuenta', [['nombre', 'Cliente(s)', 'text'], ['plan', 'Plan', planOpts]], (v) => { if (!v.nombre) return; d.cuentas.push({ id: slug(v.nombre), nombre: v.nombre, planId: v.plan, montos: {}, reparto: {} }); paint(); })),
      h('div', { class: 'row noprint', style: { marginTop: '14px' } },
        h('button', { class: 'btn fit', onclick: async () => {
          try { const r = await saveJSON(FILE, d, sha, 'nómina'); sha = r.sha; seeded = false; paint(); toast('Nómina guardada en el repo ✅'); }
          catch (e) { toast(e.message, true); } } }, 'Guardar en el repo'))));
  }

  function addForm(titulo, fields, onAdd) {
    const f = h('form', { class: 'card grid', onsubmit: (e) => { e.preventDefault(); onAdd(Object.fromEntries(fields.map(([k]) => [k, f.elements[k].value.trim()]))); f.reset(); } },
      h('h4', {}, titulo), ...fields.map(([k, l, t]) => h('div', {}, h('label', {}, l), Array.isArray(t) ? h('select', { name: k }, t.map(([v, n]) => h('option', { value: v }, n))) : h('input', { name: k, type: t }))),
      h('button', { class: 'btn sec' }, '+ Agregar'));
    return f;
  }

  box.append(live); draw();
}
