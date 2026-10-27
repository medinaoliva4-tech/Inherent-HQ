// Marca › Planear › Campañas y eventos: la herramienta. Cada campaña con su frase, su fecha y su anticipación (primer aviso,
// recordatorio y último empujón, de mk-campana), lo que le falta, quién la lleva y el botón para trabajarla en el Chat.
// Un evento es una campaña de tipo «evento» (lugar, cupo, objetivo comercial, proveedores y cómo se mide).
// Rutas: #/marcas/<marca>/campanas
import { html, raw, mount, api, col, toast, ico, fdate, wizard, initials } from './core.js';
import { TIPOS_C, tipoDe, anticipacion, revisarCampana, revisarMes, proximaFecha } from './campanas.js';
import { abrirEnChat } from './areas.js';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const mesISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const ICO_T = { evento: 'users', apertura: 'door-open', lanzamiento: 'rocket', promocion: 'tag', temporada: 'calendar-days', campana: 'target' };

export async function campanasUI(el, { me, b, alive }) {
  el.dataset.island = '1';
  mount(el, html`<p class="loading">Cargando…</p>`);
  let d, team = [];
  try { [d, team] = await Promise.all([api(`campanas/${encodeURIComponent(b.slug)}`), col('team').list().catch(() => [])]); }
  catch (e) { return mount(el, html`<div class="empty"><b>No pude abrir las campañas</b>${e.message}</div>`); }
  if (!alive()) return;
  const gente = team.filter((p) => p.active !== false && p.kind !== 'ia');
  const nombreDe = (email) => gente.find((p) => (p.email || p.id) === email)?.name || email || '';
  let xs = d.campanas || [];
  const edit = Boolean(d.puede?.editar), aprobada = Boolean(d.estrategia?.aprobada);

  const linea = (c) => {
    const hoy = hoyISO(), prox = proximaFecha(c, hoy);
    return html`<ol class="cm-linea">${anticipacion(c).map((x) => html`<li class="${x.fecha < hoy ? 'paso' : x === prox ? 'prox' : ''}"><b>${fdate(x.fecha)}</b><span>${x.que}</span></li>`)}<li class="ancla ${c.ancla < hoy ? 'paso' : ''}"><b>${fdate(c.ancla)}</b><span>${c.tipo === 'evento' ? 'El evento' : 'La fecha'}</span></li></ol>`;
  };
  const tarjeta = (c) => {
    const [, tn] = tipoDe(c.tipo), falta = revisarCampana(c), cerrada = c.estado === 'Cerrada' || c.estado === 'Archivada';
    return html`<article class="cm-card ${cerrada ? 'cerrada' : ''}" data-id="${c.id}">
      <header><span class="cm-tipo">${ico(ICO_T[c.tipo] || 'target', 14)} ${tn}</span><span class="cm-est">${c.estado}</span></header>
      <h3>${c.nombre}</h3>${c.frase ? html`<p class="cm-frase">«${c.frase}»</p>` : ''}
      ${c.ancla ? linea(c) : ''}
      <dl class="cm-dl">${c.mbt ? html`<div><dt>Mueve</dt><dd>${c.mbt}</dd></div>` : ''}${c.se_nota ? html`<div><dt>Se va a notar en</dt><dd>${c.se_nota}</dd></div>` : ''}${c.no_es ? html`<div><dt>Qué NO es</dt><dd>${c.no_es}</dd></div>` : ''}
        ${c.evento ? html`${c.evento.objetivo ? html`<div><dt>Objetivo</dt><dd>${c.evento.objetivo}</dd></div>` : ''}${c.evento.lugar || c.evento.cupo ? html`<div><dt>Dónde</dt><dd>${[c.evento.lugar, c.evento.cupo ? `${c.evento.cupo} personas` : ''].filter(Boolean).join(' · ')}</dd></div>` : ''}${c.evento.proveedores ? html`<div><dt>Proveedores</dt><dd>${c.evento.proveedores}</dd></div>` : ''}${c.evento.medicion ? html`<div><dt>Se mide con</dt><dd>${c.evento.medicion}</dd></div>` : ''}` : ''}</dl>
      ${falta.length && !cerrada ? html`<ul class="cm-falta">${falta.map((f) => html`<li>${ico('alert', 12)} ${f}</li>`)}</ul>` : ''}
      <footer><span class="cm-resp">${c.responsable ? html`<i>${initials(nombreDe(c.responsable))}</i>${nombreDe(c.responsable)}` : html`<span class="mut">Sin responsable</span>`}</span><span class="sp"></span>
        <button type="button" class="btn ghost xs" data-cm="chat">${ico('chat-ia', 13)} Trabajarla en el Chat</button>
        ${edit ? html`${cerrada ? html`<button type="button" class="btn ghost xs" data-cm="estado" data-e="En curso">Reabrir</button>` : html`<button type="button" class="btn ghost xs" data-cm="editar">Editar</button><button type="button" class="btn ghost xs" data-cm="estado" data-e="Cerrada">Cerrar</button>`}
          ${c.estado !== 'Archivada' ? html`<button type="button" class="btn ghost xs" data-cm="estado" data-e="Archivada" title="No se borra: se archiva">Archivar</button>` : ''}` : ''}</footer></article>`;
  };
  const paint = () => {
    const hoy = hoyISO(), activas = xs.filter((c) => c.estado !== 'Archivada' && c.estado !== 'Cerrada' && (c.hasta || c.ancla || '9999') >= hoy).sort((a, z) => (a.ancla || '9').localeCompare(z.ancla || '9'));
    const pasadas = xs.filter((c) => !activas.includes(c) && c.estado !== 'Archivada'), archivadas = xs.filter((c) => c.estado === 'Archivada');
    const m0 = mesISO(), m1 = mesISO(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)), avisoMes = revisarMes(xs, m0) || revisarMes(xs, m1);
    mount(el, html`<div class="cm">
      <div class="cm-top"><p class="mut">Una campaña es un empujón con fecha: una apertura, un lanzamiento, una temporada, una promoción o un evento. Una por ciclo, dos como máximo.</p><span class="sp"></span>
        <button type="button" class="btn ghost" data-cm="chat-nueva">${ico('chat-ia', 14)} Armarla en el Chat</button>${edit ? html`<button type="button" class="btn" data-cm="nueva" ${aprobada ? '' : raw('disabled')}>${ico('plus', 14)} Nueva</button>` : ''}</div>
      ${aprobada ? '' : html`<div class="cm-aviso">${ico('lock', 13)} Primero el CEO aprueba la estrategia de ${b.name}: sin estrategia aprobada no hay campañas.</div>`}
      ${avisoMes ? html`<div class="cm-aviso">${ico('alert', 13)} ${avisoMes}</div>` : ''}
      ${activas.length ? html`<div class="cm-grid">${activas.map(tarjeta)}</div>` : html`<div class="empty">Todavía no hay campañas ni eventos por delante.</div>`}
      ${pasadas.length ? html`<h4 class="cm-h">Ya pasaron</h4><div class="cm-grid">${pasadas.map(tarjeta)}</div>` : ''}
      ${archivadas.length ? html`<details class="cm-arch"><summary>Archivadas · ${archivadas.length}</summary><div class="cm-grid">${archivadas.map(tarjeta)}</div></details>` : ''}</div>`);
  };
  paint();

  // Nueva o editar: con preguntas, como todo lo que se crea en el OS.
  async function preguntar(c = null) {
    const t = (x) => x.tipo || c?.tipo;
    const a = await wizard(c ? `Editar «${c.nombre}»` : 'Nueva campaña o evento', [
      { k: 'tipo', q: '¿Qué es?', type: 'cards', req: true, v: c?.tipo, opts: TIPOS_C.map(([k, n, av]) => ({ v: k, i: ico(ICO_T[k], 16), l: n, d: av ? `Primer aviso ${av} días antes` : 'Un ángulo sostenido durante el ciclo' })) },
      { k: 'nombre', q: '¿Cómo se llama?', sub: 'Corto e interno: así lo encuentran Creatividad y la pauta.', type: 'text', req: true, ph: 'Apertura sucursal Cayalá', show: () => !c },
      { k: 'frase', q: 'La frase, en lenguaje de persona', sub: 'La que el equipo repite de memoria. ❌ «Awareness y consideración» · ✅ «Que sepan que abrimos los domingos»', type: 'text', req: true, v: c?.frase, ph: 'Que sepan que…' },
      { k: 'ancla', q: (x) => (t(x) === 'evento' ? '¿Qué día es el evento?' : t(x) === 'promocion' ? '¿Qué día empieza?' : '¿Cuál es la fecha?'), type: 'when', req: true, v: c?.ancla },
      { k: 'hasta', q: '¿Hasta cuándo dura?', type: 'when', v: c?.hasta, show: (x) => ['promocion', 'temporada', 'campana'].includes(t(x)) },
      { k: 'mbt', q: '¿Qué MUST BE TRUE mueve?', sub: 'Una, con su letra, de la estrategia aprobada. Si no traza a ninguna, es un tema, no una campaña.', type: 'text', v: c?.mbt, ph: 'B · Que nos encuentren en Google Maps' },
      { k: 'se_nota', q: '¿En qué se va a notar al cierre?', type: 'text', v: c?.se_nota, ph: '+30 reservas el fin de semana de apertura' },
      { k: 'no_es', q: '¿Qué NO es?', sub: 'El malentendido más probable, escrito antes de que pase.', type: 'text', v: c?.no_es, ph: 'No es una promoción de descuento' },
      { k: 'objetivo', q: '¿Cuál es el objetivo comercial del evento?', type: 'text', v: c?.evento?.objetivo, show: (x) => t(x) === 'evento' },
      { k: 'lugar', q: '¿Dónde es y para cuántas personas?', type: 'text', v: [c?.evento?.lugar, c?.evento?.cupo].filter(Boolean).join(' · '), ph: 'Terraza zona 10 · 80', show: (x) => t(x) === 'evento' },
      { k: 'proveedores', q: '¿Qué proveedores hacen falta?', type: 'textarea', v: c?.evento?.proveedores, ph: 'Sonido, catering, fotografía…', show: (x) => t(x) === 'evento' },
      { k: 'medicion', q: '¿Cómo se mide?', type: 'text', v: c?.evento?.medicion, ph: 'Asistentes, reservas, ventas del día', show: (x) => t(x) === 'evento' },
      { k: 'responsable', q: '¿Quién la lleva?', sub: 'La responsabilidad se asigna por campaña.', type: 'cards', v: c?.responsable, opts: [{ v: '', i: '—', l: 'Después' }, ...gente.map((p) => ({ v: p.email || p.id, i: ico('user'), l: (p.email || p.id) === me.email ? `${p.name} (yo)` : p.name }))] },
    ], c ? 'Guardar' : 'Crear');
    if (!a) return;
    const [lugar, cupo] = String(a.lugar || '').split('·').map((s) => s.trim());
    const datos = { ...a, ...(t(a) === 'evento' ? { evento: { objetivo: a.objetivo, lugar, cupo: +cupo || null, proveedores: a.proveedores, medicion: a.medicion } } : {}) };
    try {
      const r = c ? await api(`campanas/${encodeURIComponent(b.slug)}/${encodeURIComponent(c.id)}`, { method: 'PUT', body: datos }) : await api(`campanas/${encodeURIComponent(b.slug)}`, { method: 'POST', body: { ...datos, estado: 'Borrador' } });
      xs = [...xs.filter((x) => x.id !== r.campana.id), r.campana]; toast(c ? 'Campaña guardada' : r.nueva ? 'Campaña creada' : 'Ya existía una con ese nombre: la puse al día');
      if (alive()) paint();
    } catch (e) { toast(e.message, true); }
  }
  el.onclick = async (e) => {
    const t = e.target.closest('[data-cm]'); if (!t) return;
    const c = xs.find((x) => x.id === t.closest('[data-id]')?.dataset.id), k = t.dataset.cm;
    if (k === 'nueva') return preguntar();
    if (k === 'editar' && c) return preguntar(c);
    if (k === 'chat-nueva') return abrirEnChat(me.email, { modo: 'marketing', slug: b.slug, borrador: `Armemos la próxima campaña de ${b.name}: ¿es campaña o pilar?, su frase, la MUST BE TRUE que mueve y cuándo se avisa.` });
    if (k === 'chat' && c) return abrirEnChat(me.email, { modo: 'marketing', slug: b.slug, borrador: `Trabajemos la campaña «${c.nombre}» (${tipoDe(c.tipo)[1].toLowerCase()}${c.ancla ? `, ${c.ancla}` : ''}). ${revisarCampana(c).length ? `Le falta: ${revisarCampana(c).join('; ')}.` : 'Revisemos sus piezas de anticipación.'}` });
    if (k === 'estado' && c) {
      try { const r = await api(`campanas/${encodeURIComponent(b.slug)}/${encodeURIComponent(c.id)}`, { method: 'PUT', body: { estado: t.dataset.e } }); xs = xs.map((x) => (x.id === c.id ? r.campana : x)); toast(`Campaña ${t.dataset.e.toLowerCase()}`); paint(); }
      catch (er) { toast(er.message, true); }
    }
  };
}
