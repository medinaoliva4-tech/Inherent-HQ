import { h, api, Q, today, toast, readFileRaw, save, parseCSV, toCSV, readJSON, saveJSON } from './core.js';

const P = { opp: 'inherent/administracion/crm/oportunidades.csv', con: 'inherent/administracion/crm/contactos.csv', act: 'inherent/administracion/crm/actividad.csv' };
const CAT = 'ceo-os/data/sales/catalogo.json';
const COT = 'ceo-os/data/sales/cotizaciones.json';
const STAGES = ['Nuevo', 'Propuesta enviada', 'Ganado', 'Perdido'];
const OPEN = ['Nuevo', 'Propuesta enviada'];
const OPP_HEAD = ['oportunidad', 'empresa', 'contacto', 'plan_de_interes', 'valor_mensual_usd', 'etapa', 'siguiente_paso', 'fecha_siguiente_paso', 'ultima_actividad', 'fuente', 'responsable', 'notas'];

async function loadCSV(path, head) {
  const f = await readFileRaw(path);
  const t = f.content ? parseCSV(f.content) : { headers: head, rows: [] };
  if (!t.headers.length) t.headers = head;
  return { t, sha: f.sha };
}

function modal(title, fields, onSave) {
  const dlg = h('dialog', { style: { background: 'var(--panel)', color: 'var(--tx)', border: '1px solid var(--line)', borderRadius: '14px', padding: '20px', width: 'min(520px,94vw)' } });
  const f = h('form', { method: 'dialog', class: 'grid', onsubmit: async (e) => {
    e.preventDefault();
    const v = Object.fromEntries(fields.map((x) => [x.k, f.elements[x.k].value.trim()]));
    const miss = fields.find((x) => x.req && !v[x.k]);
    if (miss) return toast(`Falta: ${miss.l}`, true);
    try { await onSave(v); dlg.close(); } catch (x) { toast(x.message, true); }
  } },
    h('h3', { style: { margin: 0 } }, title),
    ...fields.map((x) => h('div', {}, h('label', {}, x.l + (x.req ? ' *' : '')),
      x.opts ? h('select', { name: x.k }, x.opts.map((o) => h('option', { value: o, selected: o === x.v }, o)))
             : h('input', { name: x.k, type: x.t || 'text', value: x.v ?? '' }))),
    h('div', { class: 'row' }, h('button', { class: 'btn' }, 'Guardar'), h('button', { class: 'btn sec', type: 'button', onclick: () => dlg.close() }, 'Cancelar')));
  dlg.append(f); document.body.append(dlg); dlg.addEventListener('close', () => dlg.remove()); dlg.showModal();
}

export async function render(el, { me }) {
  const [opp, con, act, cat] = await Promise.all([loadCSV(P.opp, OPP_HEAD), loadCSV(P.con, ['nombre', 'empresa', 'industria', 'whatsapp', 'email', 'rol', 'primer_contacto', 'ultimo_contacto', 'notas']),
    loadCSV(P.act, ['fecha', 'tipo', 'contacto', 'oportunidad', 'resumen', 'siguiente_paso_definido']), api('/api/catalogo')]);
  let addons = { data: { items: [] }, sha: null }, quotes = { data: { items: [] }, sha: null };
  try { [addons, quotes] = await Promise.all([readJSON(CAT, { items: [] }), readJSON(COT, { items: [] })]); } catch (e) { toast(e.message, true); }

  const body = h('div');
  let tab = 'pipeline';
  const tabs = h('div', { class: 'tabs noprint' });
  const paintTabs = () => tabs.replaceChildren(...[['pipeline', '📊 Pipeline'], ['contactos', '👤 Contactos'], ['catalogo', '📦 Catálogo'], ['cotizador', '🧾 Cotizador']]
    .map(([k, l]) => h('button', { class: tab === k ? 'on' : '', onclick: () => { tab = k; go(); } }, l)));
  const go = () => { paintTabs(); body.replaceChildren(); ({ pipeline, contactos, catalogo, cotizador })[tab](); };

  async function persist(csv, path, msg) { const r = await save(path, toCSV(csv.t), csv.sha, msg); csv.sha = r.sha; }
  async function logActivity(o, resumen, paso) {
    act.t.rows.push({ fecha: today(), tipo: 'Nota', contacto: o.contacto, oportunidad: o.oportunidad, resumen, siguiente_paso_definido: paso ? 'Sí' : 'No' });
    await persist(act, P.act, `actividad: ${o.oportunidad}`);
  }
  async function moveTo(o, etapa) {
    if (o.etapa === etapa) return;
    if (OPEN.includes(etapa) && !o.siguiente_paso) {
      const sp = prompt('Toda oportunidad abierta necesita un siguiente paso. ¿Cuál?');
      if (!sp) return toast('Cancelado: falta siguiente paso', true);
      o.siguiente_paso = sp; o.fecha_siguiente_paso = prompt('¿Fecha (AAAA-MM-DD)?', today()) || today();
    }
    const from = o.etapa; o.etapa = etapa; o.ultima_actividad = today();
    try { await persist(opp, P.opp, `${o.oportunidad}: ${from} → ${etapa}`); await logActivity(o, `Etapa: ${from} → ${etapa}`, !!o.siguiente_paso); toast('Guardado en el repo ✅'); }
    catch (e) { o.etapa = from; toast(e.message, true); }
    go();
  }
  const oppForm = (o) => modal(o ? 'Editar oportunidad' : 'Nueva oportunidad', [
    { k: 'oportunidad', l: 'Oportunidad', req: 1, v: o?.oportunidad }, { k: 'empresa', l: 'Empresa', req: 1, v: o?.empresa }, { k: 'contacto', l: 'Contacto', v: o?.contacto },
    { k: 'plan_de_interes', l: 'Plan', opts: ['Marketing', 'Marketing Pro', 'Accelerate', 'Compound', 'Tailor Made'], v: o?.plan_de_interes },
    { k: 'valor_mensual_usd', l: 'Valor mensual USD', t: 'number', v: o?.valor_mensual_usd },
    { k: 'fuente', l: 'Fuente', opts: ['WhatsApp', 'Instagram', 'Web', 'Referido', 'Evento', 'Otro'], v: o?.fuente },
    { k: 'siguiente_paso', l: 'Siguiente paso', req: 1, v: o?.siguiente_paso }, { k: 'fecha_siguiente_paso', l: 'Fecha siguiente paso', t: 'date', req: 1, v: o?.fecha_siguiente_paso || today() },
    { k: 'notas', l: 'Notas', v: o?.notas },
  ], async (v) => {
    if (o) Object.assign(o, v, { ultima_actividad: today() });
    else opp.t.rows.push({ ...Object.fromEntries(OPP_HEAD.map((k) => [k, ''])), ...v, etapa: 'Nuevo', ultima_actividad: today(), responsable: 'CEO' });
    await persist(opp, P.opp, `${o ? 'edita' : 'nueva'}: ${v.oportunidad}`); toast('Guardado en el repo ✅'); go();
  });

  function pipeline() {
    const rows = opp.t.rows;
    const isLate = (o) => OPEN.includes(o.etapa) && (!o.siguiente_paso || !o.fecha_siguiente_paso || o.fecha_siguiente_paso < today());
    const cola = rows.filter(isLate);
    const won = rows.filter((o) => o.etapa === 'Ganado'), lost = rows.filter((o) => o.etapa === 'Perdido');
    const sum = (a) => a.reduce((s, o) => s + (+o.valor_mensual_usd || 0), 0);
    const k = (t, v, s, c) => h('div', { class: 'card' }, h('h4', {}, t), h('div', { class: 'big ' + (c || '') }, v), h('div', { class: 'sm mut' }, s));
    body.append(
      h('div', { class: 'grid g4' }, k('MRR ganado', '$' + sum(won).toLocaleString(), `${won.length} cuenta(s)`, 'ok'), k('Pipeline abierto', '$' + sum(rows.filter((o) => OPEN.includes(o.etapa))).toLocaleString(), `${rows.filter((o) => OPEN.includes(o.etapa)).length} abiertas`),
        k('Cierre', won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) + '%' : '—', `${won.length} ganadas · ${lost.length} perdidas`),
        k('🔥 Cola de hoy', String(cola.length), 'sin siguiente paso o vencidas', cola.length ? 'warn' : 'ok')),
      h('div', { class: 'row noprint', style: { margin: '14px 0' } }, h('button', { class: 'btn fit', onclick: () => oppForm() }, '+ Nueva oportunidad')),
      !rows.length ? h('p', { class: 'warn' }, '⚠️ SIN DATOS — el CRM está vacío. Crea la primera oportunidad.') : null,
      h('div', { class: 'kanban' }, STAGES.map((s) => {
        const col = h('div', { class: 'col', ondragover: (e) => { e.preventDefault(); col.classList.add('over'); }, ondragleave: () => col.classList.remove('over'),
          ondrop: (e) => { e.preventDefault(); col.classList.remove('over'); const o = rows[+e.dataTransfer.getData('i')]; if (o) moveTo(o, s); } },
          h('h4', {}, s, h('span', { class: 'mut' }, `${rows.filter((o) => o.etapa === s).length} · $${sum(rows.filter((o) => o.etapa === s)).toLocaleString()}`)),
          rows.map((o, i) => o.etapa !== s ? null : h('div', { class: 'opp ' + (isLate(o) ? (o.siguiente_paso ? 'late' : 'nostep') : ''), draggable: 'true', ondragstart: (e) => e.dataTransfer.setData('i', i), onclick: () => oppForm(o) },
            h('b', {}, o.oportunidad), h('div', { class: 'sm mut' }, `${o.empresa} · ${o.plan_de_interes || '—'} · $${o.valor_mensual_usd || 0}`),
            OPEN.includes(s) ? h('div', { class: 'sm' }, o.siguiente_paso ? `➜ ${o.siguiente_paso} (${o.fecha_siguiente_paso})` : '⚠️ sin siguiente paso') : null)));
        return col;
      })));
  }

  function contactos() {
    const q = h('input', { placeholder: 'Buscar contacto…' }); const t = h('div');
    const paint = () => { const s = q.value.toLowerCase(); const r = con.t.rows.filter((c) => Object.values(c).join(' ').toLowerCase().includes(s));
      t.replaceChildren(!con.t.rows.length ? h('p', { class: 'warn' }, '⚠️ SIN DATOS — no hay contactos.') : h('table', {}, h('thead', {}, h('tr', {}, ['Nombre', 'Empresa', 'Industria', 'WhatsApp', 'Último contacto'].map((x) => h('th', {}, x)))),
        h('tbody', {}, r.map((c) => h('tr', {}, h('td', {}, c.nombre), h('td', {}, c.empresa), h('td', {}, c.industria), h('td', {}, c.whatsapp), h('td', {}, c.ultimo_contacto)))))); };
    q.oninput = paint; body.append(h('div', { class: 'card' }, q, t)); paint();
  }

  function catalogo() {
    const items = addons.data.items;
    const box = h('div');
    const paint = () => box.replaceChildren(h('table', {}, h('thead', {}, h('tr', {}, ['Servicio / add-on', 'Q', 'Nota', ''].map((x, i) => h('th', { class: i === 1 ? 'n' : '' }, x)))),
      h('tbody', {}, items.map((it, i) => h('tr', {}, h('td', {}, h('input', { value: it.nombre, onchange: (e) => (it.nombre = e.target.value) })), h('td', { class: 'n' }, h('input', { type: 'number', value: it.precio, onchange: (e) => (it.precio = +e.target.value) })),
        h('td', {}, h('input', { value: it.nota || '', onchange: (e) => (it.nota = e.target.value) })), h('td', {}, h('button', { class: 'btn danger sm', onclick: () => { items.splice(i, 1); paint(); } }, '✕')))))),
      !items.length ? h('p', { class: 'warn' }, '⚠️ SIN DATOS — sin add-ons. Marcas o locaciones adicionales son add-on según el manual.') : null,
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn sec fit', onclick: () => { items.push({ nombre: '', precio: 0, nota: '' }); paint(); } }, '+ Add-on'),
        h('button', { class: 'btn fit', onclick: async () => { try { addons.sha = (await saveJSON(CAT, addons.data, addons.sha, 'catálogo de servicios')).sha; toast('Guardado en el repo ✅'); } catch (e) { toast(e.message, true); } } }, 'Guardar')));
    body.append(h('div', { class: 'grid g4' }, cat.plans.map((p) => h('div', { class: 'card' }, h('h4', {}, p.name), h('div', { class: 'big' }, Q(p.precio)), h('div', { class: 'sm mut' }, `$${p.precioUsd} · ${p.volumen?.piezas} piezas`),
      h('p', { class: 'sm' }, p.promete), h('div', { class: 'sm mut' }, p.incluye), p.margen != null ? h('div', { class: 'chips' }, h('span', { class: 'chip' }, `🔒 margen ${p.margen}%`)) : null))),
      h('h3', {}, 'Add-ons y servicios sueltos'), h('div', { class: 'card' }, box)); paint();
  }

  function cotizador() {
    const s = { plan: cat.plans[0]?.id, cliente: '', desc: 0, qty: {} };
    const out = h('div');
    const calc = () => { const p = cat.plans.find((x) => x.id === s.plan); const ad = addons.data.items.map((a, i) => ({ ...a, n: +s.qty[i] || 0 })).filter((a) => a.n);
      const base = p.precio * (1 - s.desc / 100); const total = base + ad.reduce((t, a) => t + a.precio * a.n, 0); return { p, ad, base, total }; };
    const paint = () => { const { p, ad, base, total } = calc();
      out.replaceChildren(h('div', { class: 'card' }, h('h4', {}, 'Total mensual'), h('div', { class: 'big' }, Q(total)), h('div', { class: 'sm mut' }, `≈ $${Math.round(total / (cat.tipoCambio || 7.7)).toLocaleString()} · plan ${Q(base)}${ad.length ? ' + add-ons' : ''}`),
        p.costo != null ? h('div', { class: 'sm ' + (((total - p.costo) / total) * 100 < p.margen - 0.5 ? 'warn' : 'ok') }, `🔒 margen de esta cotización: ${Math.round(((total - p.costo) / total) * 100)}% (lista ${p.margen}%)`) : null,
        s.desc > 0 ? h('div', { class: 'sm warn' }, '⚠️ Con descuento. Dentro de Marketing el bundle ya es descuento; no lo apiles sin decisión del CEO.') : null,
        h('div', { class: 'row noprint', style: { marginTop: '12px' } },
          h('button', { class: 'btn fit', onclick: () => propuesta() }, '📄 Generar propuesta'),
          h('button', { class: 'btn sec fit', onclick: async () => { quotes.data.items.push({ fecha: today(), cliente: s.cliente, plan: p.name, descuento: s.desc, addons: ad.map((a) => ({ nombre: a.nombre, n: a.n, precio: a.precio })), total, por: me.role });
            try { quotes.sha = (await saveJSON(COT, quotes.data, quotes.sha, `cotización ${s.cliente || p.name}`)).sha; toast('Cotización guardada ✅'); } catch (e) { toast(e.message, true); } } }, 'Guardar cotización'))),
        h('p', { class: 'sm mut' }, `${quotes.data.items.length} cotización(es) guardadas en el repo.`)); };
    function propuesta() { const { p, ad, base, total } = calc(); const v = p.volumen || {};
      body.replaceChildren(h('div', { class: 'noprint row', style: { marginBottom: '14px' } }, h('button', { class: 'btn fit', onclick: () => window.print() }, '🖨️ Imprimir / PDF'), h('button', { class: 'btn sec fit', onclick: go }, '← Volver')),
        h('div', { class: 'card', style: { maxWidth: '760px' } }, h('h2', {}, `Propuesta para ${s.cliente || '—'}`), h('p', { class: 'mut' }, `Inherent · ${today()}`),
          h('h3', {}, p.name), h('p', {}, h('b', {}, p.promete + ' — '), p.hace), h('p', {}, p.incluye),
          h('table', {}, h('tbody', {}, [['Piezas al mes', v.piezas], ['Videos', `${v.videosPlanificados} planificados + ${v.derivados} derivados`], ['Estáticos y carruseles', v.estaticos], ['Stories', v.stories], ['Grabación', v.grabacion], ['Revisiones por pieza', v.revisiones]].map(([a, b]) => h('tr', {}, h('td', { class: 'mut' }, a), h('td', {}, String(b ?? '—')))))),
          ad.length ? h('p', {}, 'Add-ons: ' + ad.map((a) => `${a.nombre} ×${a.n}`).join(', ')) : null,
          h('h3', {}, `Inversión mensual: ${Q(total)}`), s.desc ? h('p', { class: 'mut' }, `Incluye ${s.desc}% de descuento sobre el plan (${Q(base)}).`) : null)); }
    body.append(h('div', { class: 'grid g2' }, h('div', { class: 'card' },
      h('div', {}, h('label', {}, 'Cliente / prospecto'), h('input', { oninput: (e) => (s.cliente = e.target.value) })),
      h('div', { style: { marginTop: '10px' } }, h('label', {}, 'Plan'), h('select', { onchange: (e) => { s.plan = e.target.value; paint(); } }, cat.plans.map((p) => h('option', { value: p.id }, `${p.name} — ${Q(p.precio)}`)))),
      h('div', { style: { marginTop: '10px' } }, h('label', {}, 'Descuento %'), h('input', { type: 'number', min: 0, max: 100, value: 0, oninput: (e) => { s.desc = Math.min(100, Math.max(0, +e.target.value || 0)); paint(); } })),
      h('h4', { style: { margin: '14px 0 6px' } }, 'Add-ons'), !addons.data.items.length ? h('p', { class: 'sm mut' }, 'Sin add-ons. Créalos en Catálogo.') : null,
      addons.data.items.map((a, i) => h('div', { class: 'row', style: { marginBottom: '6px' } }, h('span', {}, `${a.nombre} (${Q(a.precio)})`), h('input', { type: 'number', min: 0, value: 0, style: { maxWidth: '80px' }, oninput: (e) => { s.qty[i] = e.target.value; paint(); } })))), out)); paint();
  }

  el.append(h('h2', {}, '🤝 Sales'), h('p', { class: 'sub' }, 'El CRM son los CSV del repo. Arrastra una tarjeta y se guarda como commit.'), tabs, body);
  go();
}
