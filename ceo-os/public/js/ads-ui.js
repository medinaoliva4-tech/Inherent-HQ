// App 01 · Marca › Publicar › Ads: de una pieza que funcionó (o un guion) salen variaciones por avatar para Meta y Google.
//   «Crear variaciones»: eliges la pieza madre, los avatares y las plataformas; Claude las escribe (por el puente de tu compu,
//   o pegando la respuesta de Claude Code) y Laya las califica. Entran como Borrador.
//   Solo el CEO aprueba. «Lanzar» (CEO) junta las aprobadas con su presupuesto y crea la tarea para ⑩ Ads: el OS no toca
//   ninguna cuenta de anuncios. Lanzada → Ganadora o Quemada.
import { html, raw, mount, api, col, toast, ico, ask, $, $$, confirmAsk, drawer, closeDrawer, claudeJSON } from './core.js';
import { layaBox, juzgarLocal, puenteEstado } from './laya-ui.js';
import { tokenDe, saludPuente, preguntar } from './puente-chat.js';
import { resumenAvatar } from './avatares.js';
import { ESTADOS_A, ESTADO_AYUDA, PLATAFORMAS, FORMATOS_A, CTAS, LIMITES, faltas, siguientes, promptVariaciones, leerVariaciones } from './ads-studio.js';
import { fallo } from './visual.js';

const TONO = { Borrador: '', Aprobada: 'av-st-ok', Lanzada: 'av-st-borr', Ganadora: 'av-st-ok', Quemada: 'av-st-no' };
const plat = (k) => PLATAFORMAS.find(([x]) => x === k)?.[1] || k;
const cuenta = (t, max) => html`<span class="ax-cnt ${t.length > max ? 'mal' : ''}">${t.length}/${max}</span>`;

export async function adsUI(el, { me, b, alive }) {
  const S = { items: [], puede: {}, estado: '', sel: new Set(), avatares: [], piezas: [], guiones: [] };
  mount(el, html`<p class="loading">Cargando…</p>`);
  try {
    const [r, av, todo, g] = await Promise.all([api(`ads-studio?profile=${encodeURIComponent(b.slug)}`), api(`avatares?profile=${encodeURIComponent(b.slug)}`).catch(() => ({ avatares: [] })),
      col('content').list().catch(() => []), api(`guiones?profile=${encodeURIComponent(b.slug)}`).catch(() => ({ guiones: [] }))]);
    Object.assign(S, { items: r.items || [], puede: r.puede || {}, avatares: (av.avatares || []).filter((a) => a.estado === 'aprobado'),
      piezas: todo.filter((p) => p.kind === 'post' && p.profile === b.slug && ['Listo', 'Publicado'].includes(p.status) && !p.archivado).sort((a, z) => String(z.date || '').localeCompare(String(a.date || ''))).slice(0, 40),
      guiones: (g.guiones || []).slice(0, 40) });
  } catch (e) { if (alive()) mount(el, html`${fallo({ titulo: 'No pude abrir Ads', linea: e.message })}`); return; }
  if (!alive()) return;
  const ed = () => Boolean(S.puede.editar), ceo = () => Boolean(S.puede.aprobar);
  const carpeta = b.slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${b.slug}`;

  function card(v) {
    const f = faltas(v), elegible = ceo() && v.estado === 'Aprobada' && !v.lanzar, sig = siguientes(v.estado);
    const g = v.google || { titulos: [], descripciones: [] };
    return html`<article class="fm-card ax-card ${S.sel.has(v.id) ? 'sel' : ''}"><header><span class="chip sm2">${plat(v.plataforma)} · ${v.formato}</span>${v.avatar?.nombre ? html`<span class="chip sm2">${ico('user', 11)} ${v.avatar.nombre}</span>` : ''}<span class="sp"></span><span class="chip sm2 ${TONO[v.estado] || ''}" title="${ESTADO_AYUDA[v.estado] || ''}">${v.estado}</span></header>
      <h3>${v.title}</h3>
      ${v.plataforma === 'meta' ? html`${v.caption ? html`<p class="ax-txt">${v.caption}</p>` : ''}<p class="mut sm">${v.meta?.titulo ? html`<b>${v.meta.titulo}</b> · ` : ''}${v.meta?.cta || ''}</p>`
        : html`<ul class="ax-g">${g.titulos.map((t) => html`<li>${t} ${cuenta(t, LIMITES.google.titulo)}</li>`)}</ul><ul class="ax-g d">${g.descripciones.map((t) => html`<li>${t} ${cuenta(t, LIMITES.google.descripcion)}</li>`)}</ul>`}
      ${v.madre?.titulo ? html`<p class="mut sm">${ico('repeat', 11)} De: ${v.madre.titulo}</p>` : ''}
      ${v.estado === 'Borrador' && f.length ? html`<p class="ax-falta">${f.join(' · ')}</p>` : ''}
      ${v.lanzar ? html`<p class="mut sm">${ico('check', 11)} En la cola de ⑩ Ads · ${v.lanzar.presupuesto}</p>` : ''}${v.lanzada?.campana ? html`<p class="sm"><a href="${v.lanzada.campana}" target="_blank" rel="noopener noreferrer">${ico('link', 11)} La campaña</a></p>` : ''}
      <div class="ax-laya" data-laya="${v.id}"></div>
      <footer>${elegible ? html`<label class="check"><input type="checkbox" data-ax="sel" data-id="${v.id}" ${S.sel.has(v.id) ? raw('checked') : ''}> Para lanzar</label>` : ''}
        ${v.estado === 'Borrador' && ed() ? html`<button class="btn ghost sm" data-ax="editar" data-id="${v.id}">${ico('edit', 13)} Editar</button>` : ''}
        ${sig.filter((s) => (s === 'Aprobada' || (v.estado === 'Aprobada' && s === 'Borrador') ? ceo() : ed() && (s !== 'Lanzada' || v.lanzar))).map((s) => html`<button class="btn ${s === 'Aprobada' ? '' : 'ghost'} sm" data-ax="estado" data-id="${v.id}" data-a="${s}" ${s === 'Aprobada' && f.length ? raw('disabled') : ''}>${s === 'Aprobada' ? html`${ico('check', 13)} Aprobar` : s === 'Borrador' ? 'Reabrir' : `Marcar ${s.toLowerCase()}`}</button>`)}
        ${['Borrador', 'Aprobada', 'Ganadora', 'Quemada'].includes(v.estado) && ed() && !(v.estado === 'Aprobada' && v.lanzar) ? html`<button class="btn ghost sm" data-ax="archivar" data-id="${v.id}" aria-label="Archivar">${ico('trash', 13)}</button>` : ''}</footer></article>`;
  }
  function paint() {
    if (!alive()) return;
    const lista = S.items.filter((v) => !S.estado || v.estado === S.estado), nSel = S.sel.size;
    mount(el, html`<div class="fm ax"><div class="fm-bar"><div class="seg mini" role="tablist" aria-label="Estado">${[['', 'Todas'], ...ESTADOS_A.map((x) => [x, x])].map(([k, l]) => html`<button role="tab" class="${S.estado === k ? 'on' : ''}" aria-selected="${S.estado === k ? 'true' : 'false'}" data-ax="filtro" data-k="${k}">${l}${k ? html` <span class="mut">${S.items.filter((v) => v.estado === k).length}</span>` : ''}</button>`)}</div><span class="sp"></span>
        ${ceo() ? html`<button class="btn sm" data-ax="lanzar" ${nSel ? '' : raw('disabled title="Marca «Para lanzar» en las aprobadas"')}>${ico('rocket', 13)} Lanzar${nSel ? ` (${nSel})` : ''}</button>` : ''}
        ${ed() ? html`<button class="btn ${ceo() ? 'ghost' : ''} sm" data-ax="crear">${ico('spark', 13)} Crear variaciones</button>` : ''}</div>
      <p class="mut sm ax-regla">${ico('lock', 12)} Pautar gasta dinero del cliente: solo el CEO aprueba, y «Lanzar» crea la tarea para ⑩ Ads con el presupuesto. El OS no toca ninguna cuenta de anuncios.</p>
      ${lista.length ? html`<div class="fm-grid">${lista.map(card)}</div>` : html`<p class="mut fm-vacio">${S.items.length ? 'No hay variaciones en este estado.' : 'Todavía no hay variaciones. Elige una pieza que funcionó y Claude escribe una por avatar, para Meta y para Google.'}</p>`}</div>`);
    for (const box of $$('[data-laya]', el)) layaBox(box, { coll: 'ad_variants', id: box.dataset.laya, compact: true }).catch(() => {});
  }

  // ---------- Crear variaciones ----------
  async function crear() {
    const opts = [['', 'Escribir la idea a mano'], ...S.piezas.map((p) => [`p:${p.id}`, `Pieza · ${p.title || 'sin título'}${p.status === 'Publicado' ? ' (publicada)' : ''}`]), ...S.guiones.map((g) => [`g:${g.id}`, `Guion · ${g.titulo || 'sin título'}`])];
    const v = await ask(`Variaciones para ${b.name}`, [
      { k: 'madre', l: 'La pieza madre', t: 'select', opts },
      { k: 'idea', l: 'Si la escribes a mano: la idea o el texto', t: 'textarea' },
      { k: 'av', l: 'Avatares', t: 'checks', opts: S.avatares.map((a) => [a.id, a.nombre]), v: S.avatares.map((a) => a.id) },
      { k: 'plat', l: 'Plataformas', t: 'checks', opts: PLATAFORMAS, v: ['meta', 'google'] },
      { k: 'n', l: 'Cuántas por avatar y plataforma', t: 'select', opts: [['1', '1'], ['2', '2'], ['3', '3']], v: '2' },
    ], 'Pedírselas a Claude');
    if (!v) return;
    if (!v.plat.length) return toast('Elige al menos una plataforma', true);
    const [tipo, id] = v.madre ? v.madre.split(':') : ['libre', ''];
    const pieza = tipo === 'p' ? S.piezas.find((p) => p.id === id) : null, guion = tipo === 'g' ? S.guiones.find((g) => g.id === id) : null;
    if (!pieza && !guion && !String(v.idea || '').trim()) return toast('Elige una pieza madre o escribe la idea', true);
    const madre = pieza ? { tipo: 'pieza', id: pieza.id, titulo: pieza.title || '', texto: [pieza.hook && `Gancho: ${pieza.hook}`, pieza.caption && `Copy: ${pieza.caption}`].filter(Boolean).join('\n') }
      : guion ? { tipo: 'guion', id: guion.id, titulo: guion.titulo || '', texto: [(guion.tramos || []).map((t) => `${t.nombre}: ${t.dice || ''}${t.pantalla ? ` [pantalla: ${t.pantalla}]` : ''}`).join('\n'), guion.caption && `Caption: ${guion.caption}`].filter(Boolean).join('\n') }
      : { tipo: 'libre', id: '', titulo: String(v.idea).trim().split('\n')[0].slice(0, 120), texto: String(v.idea).trim() };
    const avs = S.avatares.filter((a) => v.av.includes(a.id)).map((a) => ({ id: a.id, nombre: a.nombre, resumen: resumenAvatar(a) }));
    const prompt = promptVariaciones({ marca: b.name, carpeta, madre, avatares: avs, plataformas: v.plat, n: +v.n || 2 });
    let texto = '';
    const salud = await saludPuente(4000), token = tokenDe(me);
    if (salud.on && salud.listo && token) {
      drawer(html`<article class="fm-ed"><span class="lbl">Claude está escribiendo · en tu compu</span><h2 style="margin:4px 0 10px">Variaciones de ${b.name}</h2><pre class="ax-stream" id="ax-stream">Leyendo la voz de la marca…</pre></article>`, {}, { section: 'Ads', title: 'Crear variaciones' });
      try { texto = await preguntar({ prompt, token, onDelta: (t) => { const p = $('#ax-stream'); if (p) p.textContent = t.slice(-1800); }, onTool: (t) => { const p = $('#ax-stream'); if (p && !p.textContent.trim()) p.textContent = t; } }); }
      catch (e) { closeDrawer(); return toast(e.message, true); }
      closeDrawer();
    } else {
      const j = await claudeJSON(`Variaciones de ${b.name}`, prompt, 'Se abrió Claude Code con el pedido. Cuando conteste, pega aquí su respuesta completa.');
      if (!j) return;
      texto = '```variaciones\n' + JSON.stringify(Array.isArray(j) ? j : j.variaciones || []) + '\n```';
    }
    const nuevas = leerVariaciones(texto, avs);
    if (!nuevas.length) return toast('No pude leer variaciones en la respuesta. Inténtalo otra vez.', true);
    try {
      const r = await api('ads-studio', { method: 'POST', body: { profile: b.slug, madre: { tipo: madre.tipo, id: madre.id, titulo: madre.titulo }, variaciones: nuevas } });
      S.items = [...r.items, ...S.items]; S.estado = ''; paint(); toast(`${r.items.length} variaciones nuevas en Borrador`);
      juzgar(r.items);
    } catch (e) { toast(e.message, true); }
  }
  // Laya califica cada variación nueva (gancho y texto) si el puente de la compu tiene Laya lista. Si no, se queda sin chip.
  async function juzgar(items) {
    const st = await puenteEstado(true).catch(() => null); if (!st?.listo) return;
    for (const v of items) {
      try { const t = await api(`laya/texto?coll=ad_variants&id=${encodeURIComponent(v.id)}`); const resultado = await juzgarLocal(t); await api('laya/juicios', { method: 'POST', body: { coll: 'ad_variants', id: v.id, engine: 'laya-local', resultado } }); const box = $(`[data-laya="${v.id}"]`, el); if (box) layaBox(box, { coll: 'ad_variants', id: v.id, compact: true }).catch(() => {}); } catch { /* sigue con las demás */ }
    }
  }

  // ---------- Editar una variación (solo en Borrador) ----------
  function editar(v) {
    const meta = v.plataforma === 'meta', g = v.google || { titulos: [], descripciones: [] };
    drawer(html`<article class="fm-ed ax-ed"><span class="lbl">${plat(v.plataforma)}${v.avatar?.nombre ? ` · ${v.avatar.nombre}` : ''} · Borrador</span><h2 style="margin:4px 0 14px">Editar la variación</h2>
      <div class="fm-ed-g"><label class="av-f w"><span class="av-l">Gancho (la primera línea o los primeros 3 s)</span><input class="in" id="ax-gancho" value="${v.title}"></label>
        <label class="av-f"><span class="av-l">Formato</span><select class="in" id="ax-formato">${FORMATOS_A[v.plataforma].map((x) => html`<option ${v.formato === x ? raw('selected') : ''}>${x}</option>`)}</select></label></div>
      ${meta ? html`<label class="av-f w"><span class="av-l">Texto principal <span class="ax-live" data-max="${LIMITES.meta.texto}" data-for="ax-texto"></span></span><textarea class="in" id="ax-texto" rows="4">${v.caption}</textarea></label>
        <div class="fm-ed-g"><label class="av-f w"><span class="av-l">Título <span class="ax-live" data-max="${LIMITES.meta.titulo}" data-for="ax-titulo"></span></span><input class="in" id="ax-titulo" value="${v.meta?.titulo || ''}"></label>
          <label class="av-f"><span class="av-l">Botón</span><select class="in" id="ax-cta">${CTAS.map((x) => html`<option ${v.meta?.cta === x ? raw('selected') : ''}>${x}</option>`)}</select></label></div>`
      : html`<label class="av-f w"><span class="av-l">Títulos, uno por línea (de 3 a ${LIMITES.google.titulos}, máximo ${LIMITES.google.titulo} caracteres cada uno)</span><textarea class="in" id="ax-titulos" rows="6">${g.titulos.join('\n')}</textarea></label><div class="ax-lineas" id="ax-tl"></div>
        <label class="av-f w"><span class="av-l">Descripciones, una por línea (de 2 a ${LIMITES.google.descripciones}, máximo ${LIMITES.google.descripcion})</span><textarea class="in" id="ax-descs" rows="4">${g.descripciones.join('\n')}</textarea></label><div class="ax-lineas" id="ax-dl"></div>`}
      <div class="row" style="margin-top:18px;gap:8px"><button class="btn" data-act="guardar">${ico('check', 14)} Guardar</button><button class="btn ghost" data-act="cerrar">Cerrar</button></div></article>`,
    {
      cerrar: () => closeDrawer(),
      guardar: async () => {
        const body = { v: v.v, title: $('#ax-gancho').value, formato: $('#ax-formato').value, ...(meta ? { caption: $('#ax-texto').value, meta: { titulo: $('#ax-titulo').value, cta: $('#ax-cta').value } }
          : { google: { titulos: $('#ax-titulos').value.split('\n'), descripciones: $('#ax-descs').value.split('\n') } }) };
        try { const d = await api(`ads-studio/${v.id}`, { method: 'PUT', body }); S.items = S.items.map((x) => (x.id === d.id ? d : x)); toast('Guardada'); closeDrawer(); paint(); } catch (e) { toast(e.message, true); }
      },
    }, { section: 'Ads', title: 'Editar la variación' });
    // Los contadores en vivo: en rojo lo que pasa del límite.
    const vivo = () => {
      for (const s of $$('.ax-live')) { const n = ($(`#${s.dataset.for}`)?.value || '').length; s.textContent = `${n}/${s.dataset.max}`; s.classList.toggle('mal', n > +s.dataset.max); }
      const lineas = (id, max, box) => { const b2 = $(box); if (b2) mount(b2, html`${($(id)?.value || '').split('\n').filter((x) => x.trim()).map((t) => html`<span class="ax-cnt ${t.trim().length > max ? 'mal' : ''}">${t.trim().length}/${max}</span>`)}`); };
      lineas('#ax-titulos', LIMITES.google.titulo, '#ax-tl'); lineas('#ax-descs', LIMITES.google.descripcion, '#ax-dl');
    };
    $('.ax-ed')?.addEventListener('input', vivo); vivo();
  }

  async function cambiar(v, estado) {
    let extra = {};
    if (estado === 'Lanzada') { const r = await ask('Marcar como lanzada', [{ k: 'campana', l: 'Link de la campaña (opcional, https://…)' }], 'Marcar lanzada'); if (!r) return; extra = { campana: r.campana }; }
    if (estado === 'Aprobada' && !(await confirmAsk('¿Aprobar esta variación? Queda lista para lanzar con tu presupuesto.'))) return;
    try { const d = await api(`ads-studio/${v.id}`, { method: 'PUT', body: { estado, v: v.v, ...extra } }); S.items = S.items.map((x) => (x.id === d.id ? d : x)); if (estado !== 'Aprobada') S.sel.delete(v.id); paint(); } catch (e) { toast(e.message, true); }
  }
  async function lanzar() {
    const ids = [...S.sel]; if (!ids.length) return;
    const r = await ask(`Lanzar ${ids.length} variaci${ids.length === 1 ? 'ón' : 'ones'} de ${b.name}`, [
      { k: 'presupuesto', l: 'Presupuesto aprobado (ej. Q3,000 en total o Q100 al día)', req: true },
      { k: 'fechas', l: 'Fechas (ej. del 1 al 30 de noviembre)' },
    ], 'Crear la tarea para ⑩ Ads');
    if (!r) return;
    try { const x = await api(`ads-studio/${encodeURIComponent(b.slug)}/lanzar`, { method: 'POST', body: { ids, presupuesto: r.presupuesto, fechas: r.fechas } });
      toast(`Listo: tarea para ⑩ Ads con ${x.n} variaci${x.n === 1 ? 'ón' : 'ones'}`); S.sel.clear();
      const d = await api(`ads-studio?profile=${encodeURIComponent(b.slug)}`); S.items = d.items || S.items; paint(); } catch (e) { toast(e.message, true); }
  }

  el.onclick = async (e) => {
    const t = e.target.closest('[data-ax]'); if (!t) return;
    const a = t.dataset.ax, v = S.items.find((x) => x.id === t.dataset.id);
    if (a === 'filtro') { S.estado = t.dataset.k; return paint(); }
    if (a === 'crear') return crear();
    if (a === 'lanzar') return lanzar();
    if (a === 'sel' && v) { t.checked ? S.sel.add(v.id) : S.sel.delete(v.id); return paint(); }
    if (a === 'editar' && v) return editar(v);
    if (a === 'estado' && v) return cambiar(v, t.dataset.a);
    if (a === 'archivar' && v) { if (!(await confirmAsk('¿Archivar esta variación?'))) return; try { await api(`ads-studio/${v.id}`, { method: 'PUT', body: { archivado: true, v: v.v } }); S.items = S.items.filter((x) => x.id !== v.id); S.sel.delete(v.id); paint(); } catch (err) { toast(err.message, true); } }
  };
  paint();
}
