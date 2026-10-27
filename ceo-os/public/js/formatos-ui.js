// App 01 · Marca › Crear › Formatos: las plantillas de la marca y las del método.
//   Arriba: el filtro por tipo (Reel · Story · Ficha de referente) y las acciones (+ Formato · Desde un referente).
//   «De <marca>»: los formatos propios (se editan). «Plantillas del método»: las bases de ④ Creatividad (se duplican).
//   Cada tarjeta lleva a «Escribir guion» con ese formato (Crear › Creación).
import { html, raw, mount, api, toast, ico, $, $$, confirmAsk, drawer, closeDrawer, col } from './core.js';
import { TIPOS, BASE, DURACION } from './formatos.js';
import { rutaModulo } from './herramientas.js';

export async function formatosUI(el, { me, b, alive }) {
  const S = { base: BASE, marca: [], puede: {}, tipo: '', refs: [] };
  mount(el, html`<p class="loading">Cargando…</p>`);
  try {
    const [r, all] = await Promise.all([api(`formatos?profile=${encodeURIComponent(b.slug)}`), col('content').list().catch(() => [])]);
    Object.assign(S, { base: r.base, marca: r.marca, puede: r.puede, refs: all.filter((x) => x.kind === 'research' && x.profile === b.slug && x.replicar === true) });
  } catch (e) { if (alive()) mount(el, html`<div class="empty"><b>No pude abrir los formatos</b>${e.message}</div>`); return; }
  if (!alive()) return;
  const ed = () => Boolean(S.puede.editar), tipoNombre = (k) => TIPOS.find(([x]) => x === k)?.[1] || k;
  const nuevoGuion = (id) => rutaModulo(b.slug, 'creacion', ['nuevo', `f:${id}`]);

  function card(f) {
    return html`<article class="fm-card"><header><span class="chip sm2">${tipoNombre(f.tipo)}</span>${f.base ? html`<span class="mut sm">Del método</span>` : f.ref ? html`<span class="mut sm">${ico('repeat', 11)} De un referente</span>` : ''}</header>
      <h3>${f.nombre}</h3>${f.mejor_para ? html`<p class="mut sm">${f.mejor_para}</p>` : ''}
      <ol class="fm-tramos">${(f.partes || []).map((p) => html`<li title="${p.que}"><b>${p.nombre}</b>${p.seg ? html`<span>${p.seg}</span>` : ''}</li>`)}</ol>
      <footer><a class="btn xs" href="${nuevoGuion(f.id)}">${ico('edit', 13)} Escribir guion</a>${ed() ? (f.base ? html`<button class="btn ghost xs" data-fm="dup" data-id="${f.id}">Duplicar para ${b.name}</button>` : html`<button class="btn ghost xs" data-fm="edit" data-id="${f.id}">Editar</button>`) : html`<button class="btn ghost xs" data-fm="ver" data-id="${f.id}">Ver</button>`}</footer></article>`;
  }
  function paint() {
    if (!alive()) return;
    const f = (l) => l.filter((x) => !S.tipo || x.tipo === S.tipo);
    mount(el, html`<div class="fm"><div class="fm-bar"><div class="tabs mini" role="tablist" aria-label="Tipo">${[['', 'Todos'], ...TIPOS].map(([k, l]) => html`<button role="tab" class="${S.tipo === k ? 'on' : ''}" aria-selected="${S.tipo === k ? 'true' : 'false'}" data-fm="tipo" data-k="${k}">${l}</button>`)}</div><span class="sp"></span>
        ${ed() ? html`<button class="btn ghost xs" data-fm="ref" ${S.refs.length ? '' : raw('disabled title="Marca un post de Investigación con «Usar como formato»"')}>${ico('repeat', 13)} Desde un referente${S.refs.length ? ` · ${S.refs.length}` : ''}</button><button class="btn xs" data-fm="nuevo">${ico('plus', 13)} Formato</button>` : ''}</div>
      <section><h2 class="fm-h">De ${b.name}</h2>${f(S.marca).length ? html`<div class="fm-grid">${f(S.marca).map(card)}</div>` : html`<p class="mut fm-vacio">Todavía no hay formatos propios. Duplica una plantilla del método y ajústala a la marca, o arma uno desde un referente que funcionó.</p>`}</section>
      <section><h2 class="fm-h">Plantillas del método <span class="mut sm">· ④ Creatividad: cr-estructura-reel y cr-estructura-story</span></h2><div class="fm-grid">${f(S.base).map(card)}</div></section></div>`);
  }

  // ---------- El editor (vista grande) ----------
  function editor(f, { soloVer = false } = {}) {
    const partes = (f.partes || []).map((p) => ({ ...p }));
    const fila = (p, i) => html`<div class="fm-p" data-i="${i}"><input class="in" data-p="nombre" value="${p.nombre}" placeholder="Tramo" aria-label="Nombre del tramo" ${soloVer ? raw('disabled') : ''}><input class="in" data-p="seg" value="${p.seg || ''}" placeholder="0-3 s" aria-label="Tiempo" ${soloVer ? raw('disabled') : ''}><input class="in" data-p="que" value="${p.que || ''}" placeholder="Qué pasa en este tramo" aria-label="Qué pasa" ${soloVer ? raw('disabled') : ''}>${soloVer ? '' : html`<button type="button" class="av-x" data-act="quitar" data-i="${i}" aria-label="Quitar tramo">×</button>`}</div>`;
    const pintar = () => { const box = $('#fm-partes'); if (box) mount(box, html`${partes.map(fila)}`); };
    const leer = () => $$('#fm-partes .fm-p').forEach((row) => { const i = +row.dataset.i; for (const k of ['nombre', 'seg', 'que']) partes[i][k] = $(`[data-p="${k}"]`, row).value; });
    drawer(html`<article class="fm-ed"><span class="lbl">${f.base ? 'Plantilla del método' : f.id ? 'Formato de ' + b.name : 'Nuevo formato'}</span>
        <div class="fm-ed-g"><label class="av-f w"><span class="av-l">Nombre</span><input class="in" id="fm-nombre" value="${f.nombre || ''}" ${soloVer ? raw('disabled') : ''}></label>
          <label class="av-f"><span class="av-l">Tipo</span><select class="in" id="fm-tipo" ${soloVer ? raw('disabled') : ''}>${TIPOS.map(([k, l]) => html`<option value="${k}" ${f.tipo === k ? raw('selected') : ''}>${l}</option>`)}</select></label>
          <label class="av-f"><span class="av-l">Duración (s)</span><input class="in" id="fm-dur" type="number" min="0" max="180" value="${f.duracion || ''}" placeholder="${DURACION}" ${soloVer ? raw('disabled') : ''}></label>
          <label class="av-f w"><span class="av-l">Mejor para</span><input class="in" id="fm-mejor" value="${f.mejor_para || ''}" placeholder="Ej. MOF · confianza" ${soloVer ? raw('disabled') : ''}></label></div>
        <span class="lbl" style="margin-top:18px">Tramos, en orden</span><div id="fm-partes" class="fm-partes"></div>${soloVer ? '' : html`<button type="button" class="btn ghost xs" data-act="mas">${ico('plus', 13)} Tramo</button>`}
        <label class="av-f w" style="margin-top:14px"><span class="av-l">Notas (ritmo, voz, safe zones…)</span><textarea class="in" id="fm-notas" rows="3" ${soloVer ? raw('disabled') : ''}>${f.notas || ''}</textarea></label>
        <div class="row" style="margin-top:18px;gap:8px">${soloVer ? '' : html`<button class="btn" data-act="guardar">${ico('check', 14)} Guardar</button>`}${f.id && !f.base && !soloVer ? html`<button class="btn ghost" data-act="archivar">Archivar</button>` : ''}${f.id ? html`<a class="btn ghost" href="${nuevoGuion(f.id)}" data-act="cerrar">${ico('edit', 14)} Escribir guion</a>` : ''}</div></article>`,
      {
        mas: () => { leer(); partes.push({ nombre: '', seg: '', que: '' }); pintar(); },
        quitar: (t) => { leer(); partes.splice(+t.dataset.i, 1); pintar(); },
        cerrar: () => closeDrawer(),
        archivar: async () => { if (!(await confirmAsk(`¿Archivar «${f.nombre}»?`))) return; try { await api(`formatos/${f.id}/archivar`, { method: 'POST', body: {} }); S.marca = S.marca.filter((x) => x.id !== f.id); closeDrawer(); paint(); } catch (e) { toast(e.message, true); } },
        guardar: async () => {
          leer(); const body = { nombre: $('#fm-nombre').value.trim(), tipo: $('#fm-tipo').value, duracion: $('#fm-dur').value, mejor_para: $('#fm-mejor').value, notas: $('#fm-notas').value, partes: partes.filter((p) => p.nombre.trim()) };
          try { const d = f.id ? await api(`formatos/${f.id}`, { method: 'PUT', body }) : await api('formatos', { method: 'POST', body: { profile: b.slug, ...body, ref: f.ref || null } });
            S.marca = [...S.marca.filter((x) => x.id !== d.id), d]; toast('Formato guardado'); closeDrawer(); paint(); } catch (e) { toast(e.message, true); }
        },
      }, { section: 'Formatos', title: f.nombre || 'Nuevo formato' });
    pintar();
  }

  el.onclick = async (e) => {
    const t = e.target.closest('[data-fm]'); if (!t) return;
    const a = t.dataset.fm, f = [...S.base, ...S.marca].find((x) => x.id === t.dataset.id);
    if (a === 'tipo') { S.tipo = t.dataset.k; return paint(); }
    if (a === 'nuevo') return editor({ tipo: S.tipo || 'reel', nombre: '', partes: [{ nombre: 'HOOK', seg: '0-3 s', que: '' }, { nombre: 'BODY', seg: '', que: '' }, { nombre: 'PAYOFF', seg: '', que: '' }, { nombre: 'CTA', seg: '', que: '' }] });
    if (a === 'edit') return editor(f);
    if (a === 'ver') return editor(f, { soloVer: true });
    if (a === 'dup') { try { const d = await api('formatos', { method: 'POST', body: { profile: b.slug, de: f.id, marca: b.name } }); S.marca = [...S.marca, d]; toast('Duplicado: ajústalo a la marca'); paint(); editor(d); } catch (er) { toast(er.message, true); } return; }
    if (a === 'ref') {
      // Desde un referente: se elige el post (de Investigación, marcado «Usar como formato») y el esqueleto que más se le parece.
      drawer(html`<article class="fm-ed"><span class="lbl">Desde un referente</span><h2 style="margin:4px 0 12px">¿Cuál post se vuelve formato?</h2><div class="fm-refs">${S.refs.map((r) => html`<button class="fm-ref" data-act="elegir" data-id="${r.id}"><b>${r.title || '@' + (r.handle || '—')}</b><span class="mut sm">@${r.handle || '—'} · ${r.format || 'post'}${r.why?.hook ? ` · «${String(r.why.hook).slice(0, 60)}»` : ''}</span></button>`)}</div></article>`,
        { elegir: (x) => { const r = S.refs.find((y) => y.id === x.dataset.id); const base = BASE.find((y) => y.id === (r.format === 'carrusel' || r.format === 'estatico' ? 'base-reel-estatico' : 'base-reel-acamara'));
          editor({ tipo: 'reel', nombre: `Replica · ${r.title || '@' + r.handle}`.slice(0, 80), mejor_para: r.why?.por_que ? String(r.why.por_que).slice(0, 120) : '', ref: r.id, partes: (Array.isArray(r.why?.estructura) && r.why.estructura.length ? r.why.estructura.map((s, i) => ({ nombre: i === 0 ? 'HOOK' : `Tramo ${i + 1}`, seg: '', que: String(s).slice(0, 400) })) : base.partes.map((p) => ({ ...p }))), notas: `Referente: ${r.url}` }); } },
        { section: 'Formatos', title: 'Desde un referente' });
    }
  };
  paint();
}
