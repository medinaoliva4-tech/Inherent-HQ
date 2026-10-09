import { h, svg, api, Q, toast, PALETTE } from './core.js';
import { renderNomina } from './nomina.js';

const SLOT_OF = { 'Grabación': 'Producción', 'Fotografía': 'Fotografía', 'Edición de video': 'Editor de video', 'Operador de agentes': 'Operador de agentes' };

export async function render(el) {
  const eco = await api('/api/economia');
  if (eco.error) { el.append(h('p', { class: 'bad' }, eco.error)); return; }
  const { plans, piso, scraping, slots = [], roles = [] } = eco;
  const sc = scraping || { marketing: 4.7, growth: 9.4 };

  // Escenario del simulador: es un MODELO, no la realidad de clientes (esa vive en Operations).
  const st = { counts: { marketing: 1, pro: 0, accelerate: 0, compound: 0 }, ceo: piso.ceo ?? 0, ia: piso.ia ?? 0 };
  const rubroNames = [...new Set(plans.flatMap((p) => p.rubros.map((r) => r.label)))];
  const color = (label) => PALETTE[rubroNames.indexOf(label) % PALETTE.length];
  const live = h('div');
  const nominaBox = h('div');

  const model = () => {
    let ing = 0, cost = 0, scrap = 0, n = 0;
    const rubros = {};
    for (const p of plans) {
      const c = st.counts[p.id]; n += c;
      ing += c * p.precio; cost += c * p.costo;
      scrap += c * (p.id === 'marketing' || p.id === 'pro' ? sc.marketing : sc.growth);
      for (const r of p.rubros) rubros[r.label] = (rubros[r.label] || 0) + c * r.monto;
    }
    const fijo = st.ceo + st.ia + scrap;
    const utilCuentas = ing - cost;
    return { n, ing, cost, rubros, fijo, scrap, utilCuentas, neta: utilCuentas - fijo, margen: ing ? (utilCuentas / ing) * 100 : 0 };
  };

  function paint() {
    const m = model();
    live.replaceChildren(
      h('div', { class: 'grid g4' },
        kpi('Ingresos / mes', Q(m.ing), `${m.n} cuenta(s)`),
        kpi('Costo de cuentas', Q(m.cost), 'fijo por rubro'),
        kpi('Utilidad de cuentas', Q(m.utilCuentas), `${m.margen.toFixed(0)}% de margen`, 'ok'),
        kpi('Utilidad tras piso', Q(m.neta), `piso ${Q(m.fijo)}`, m.neta >= 0 ? 'ok' : 'bad')),
      h('p', { class: 'sm mut' }, `Piso = CEO ${Q(st.ceo)} + IA ${Q(st.ia)} + scraping ${Q(m.scrap)}. Modelo editable, no la realidad de clientes.`));
  }

  function kpi(t, v, s, cls) {
    return h('div', { class: 'card' }, h('h4', {}, t), h('div', { class: 'big ' + (cls || '') }, v), h('div', { class: 'sm mut' }, s));
  }

  function stepper(p) {
    const val = h('b', {}, String(st.counts[p.id]));
    const set = (d) => { st.counts[p.id] = Math.max(0, st.counts[p.id] + d); val.textContent = st.counts[p.id]; paint(); };
    return h('div', { class: 'card' }, h('h4', {}, p.name),
      h('div', { class: 'row', style: { alignItems: 'center', marginTop: '6px' } },
        h('button', { class: 'btn sec fit', onclick: () => set(-1) }, '−'),
        h('div', { style: { textAlign: 'center', fontSize: '22px' } }, val),
        h('button', { class: 'btn sec fit', onclick: () => set(1) }, '+')),
      h('div', { class: 'sm mut' }, `${Q(p.utilidad)} utilidad c/u`));
  }

  // --- barras de costo apiladas (SVG) ---
  function stack() {
    const W = 760, rowH = 38, max = Math.max(...plans.map((p) => p.costo));
    const g = svg('svg', { viewBox: `0 0 ${W} ${plans.length * rowH + 6}`, width: '100%', role: 'img', 'aria-label': 'Costo por rubro y plan' });
    plans.forEach((p, i) => {
      let x = 110; const y = i * rowH + 4;
      g.append(svg('text', { x: 0, y: y + 20, fill: 'var(--tx)', 'font-size': 13 }, p.name));
      for (const r of p.rubros.filter((r) => r.monto)) {
        const w = (r.monto / max) * (W - 190);
        g.append(svg('rect', { x, y, width: w, height: 26, rx: 4, fill: color(r.label) }, svg('title', {}, `${p.name} · ${r.label}: ${Q(r.monto)}`)));
        x += w + 1;
      }
      g.append(svg('text', { x: x + 8, y: y + 19, fill: 'var(--mut)', 'font-size': 12 }, Q(p.costo)));
    });
    return g;
  }

  el.append(
    h('h2', {}, '💰 Finanzas'), h('p', { class: 'sub' }, 'Todo sale de 06-ECONOMIA y 05-OPERACION. Cambia el manual y esto cambia.'),
    h('div', { class: 'grid g4' }, plans.map((p) => h('div', { class: 'card' },
      h('h4', {}, p.name), h('div', { class: 'big' }, Q(p.precio)), h('div', { class: 'sm mut' }, `$${p.precioUsd ?? '—'} · ${p.volumen?.piezas ?? '—'} piezas`),
      h('div', { class: 'bar' }, h('i', { style: { width: (p.margen || 0) + '%', background: 'var(--ok)' } })),
      h('div', { class: 'sm' }, `Margen ${p.margen}% · utilidad ${Q(p.utilidad)}`),
      h('div', { class: 'chips' }, h('span', { class: 'chip' }, `costo ${Q(p.costo)}`), h('span', { class: 'chip' }, `${Q(p.costoPorPieza)}/pieza`),
        h('span', { class: 'chip ' + (p.checks.cuadra ? 'ok' : 'bad') }, p.checks.cuadra ? 'cuadra ✅' : `NO cuadra ❌ (suma ${Q(p.checks.sumaRubros)})`))))),
    h('h3', {}, 'Dónde se va el costo'), h('div', { class: 'card' }, stack(),
      h('div', { class: 'legend' }, rubroNames.map((r) => h('span', {}, h('i', { style: { background: color(r) } }), r)))),
    h('h3', {}, '🎛️ Simulador — ¿cuántos clientes de cada plan?'),
    h('div', { class: 'grid g4' }, plans.map(stepper)),
    h('div', { class: 'row', style: { margin: '12px 0' } },
      h('div', {}, h('label', {}, 'Piso: CEO (Q/mes)'), h('input', { type: 'number', value: st.ceo, oninput: (e) => { st.ceo = +e.target.value || 0; paint(); } })),
      h('div', {}, h('label', {}, 'Piso: IA (Q/mes)'), h('input', { type: 'number', value: st.ia, oninput: (e) => { st.ia = +e.target.value || 0; paint(); } }))),
    live,
    h('h3', {}, '👥 Roles — quién cobra qué'),
    h('div', { class: 'card' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Rubro', ...plans.map((p) => p.name), 'Ocupa hoy'].map((t, i) => h('th', { class: i && i <= plans.length ? 'n' : '' }, t)))),
      h('tbody', {}, rubroNames.map((r) => h('tr', {}, h('td', {}, r), ...plans.map((p) => h('td', { class: 'n' }, Q(p.rubros.find((x) => x.label === r)?.monto || 0))),
        h('td', { class: 'mut' }, slots.find((s) => s.slot.startsWith(SLOT_OF[r] || '§'))?.hoy || '—')))))),
    roles.length ? h('details', { class: 'card', style: { marginTop: '12px' } }, h('summary', {}, 'Los roles y cómo cobra cada uno (05-OPERACION)'),
      h('table', {}, h('tbody', {}, roles.map((r) => h('tr', {}, h('td', {}, h('b', {}, r.rol)), h('td', { class: 'mut' }, r.hace), h('td', {}, r.cobra)))))) : null,
    h('h3', {}, '💵 Nómina — lo que le pagamos a cada persona'), nominaBox);

  paint();
  try { await renderNomina(nominaBox, { plans, rubroNames, slots }); } catch (e) { nominaBox.append(h('p', { class: 'bad' }, e.message)); toast(e.message, true); }
}
