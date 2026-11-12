// Production Planner (herramienta production-planner de Production). SIN Tool Shell: su casa son las jornadas de grabación (content kind:'shoot',
// por /api/db/content; las de hoy aparecen sin migrar). Pinta la tira de días 1-20 con la línea roja del día 11, la jornada elegida (call time,
// locación, crew, talento, equipo, orden de tiro con márgenes de montaje, luz y traslado, recursos), el medidor contra la ficha y el call sheet
// imprimible. Los montos solo los ven y editan el CEO y el COO; el candado del día 11 lo pone el servidor (423, salvo el CEO).
// Pinta con html`…` (todo se escapa; nada de raw con texto de usuario). Lo vacío dice «⚠️ SIN DATOS» y de dónde sale.
import { html, mount, api, col, ico, toast, confirmAsk, docView, docHead, skel, today, $ } from '../core.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { DIA_LIMITE, ESTADOS, MARGENES, camposProduccion, limpiarJornada, tira, vivas, mesDe, diaDe, ordenDeTiro, mover, escenasDeShotlist, medidor, veMontos, crewDe, callSheet, archivar, desarchivar, totalRecursos } from './planner.js';

const enc = encodeURIComponent;
const lista = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
const mesMas = (mes, n) => { const d = new Date(`${mes}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };
const nombreMes = (mes) => new Date(`${mes}-01T12:00:00Z`).toLocaleDateString('es', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const num = (v) => { const t = String(v ?? '').trim(); const n = Number(t); return t !== '' && Number.isFinite(n) && n >= 0 ? n : null; };

// host: dónde se monta · me: quien mira · slug/b: el cliente · alive(): ¿sigue en pantalla?
export async function plannerTool(host, { me, slug, b, alive } = {}) {
  mount(host, skel('pagina'));
  const C = col('content'), montos = veMontos(me?.role), esCeo = me?.role === 'ceo';
  const S = { todas: [], mes: today().slice(0, 7), sel: '', ficha: null, puede: true, ocupado: false, borrador: null, archivadas: false };
  const jornadas = () => S.todas.filter((x) => x?.kind === 'shoot' && x.profile === slug);
  const actual = () => S.todas.find((x) => x.id === S.sel) || null;
  async function leer() {
    const [l, est] = await Promise.all([C.list(), api(`estrategia/${enc(slug)}`).catch(() => null)]);
    S.todas = l; S.ficha = est?.ficha?.hay ? { incluye: est.ficha.incluye || [] } : null;
    if (!actual()) S.sel = '';
  }
  async function recargar() { try { await leer(); } catch (e) { if (alive()) toast(e.message, true); return; } if (alive()) pintar(); }
  const haz = async (fn) => { if (S.ocupado) return; S.ocupado = true; try { await fn(); } catch (e) { if (alive()) { toast(e?.message || 'No se pudo completar. Inténtalo de nuevo.', true); if (e?.status === 409) recargar(); } } S.ocupado = false; };

  // ---------- Pintar ----------
  const chipJ = (j) => html`<button type="button" class="pl-j" data-a="elegir" data-id="${j.id}" data-estado="${j.status}" aria-pressed="${j.id === S.sel}">${j.time ? `${j.time} · ` : ''}${j.title || 'Jornada'}</button>`;
  function tiraHtml() {
    const t = tira(jornadas(), S.mes);
    return html`<div class="pl-tira" role="list" aria-label="Días 1 a 20 de ${nombreMes(S.mes)}">${t.dias.map((d) => html`${d.dia === DIA_LIMITE + 1 ? html`<div class="pl-linea" role="separator" aria-label="Línea roja: después del día ${DIA_LIMITE} no se graba"><span>Día ${DIA_LIMITE}: último para producir</span></div>` : ''}
      <div class="pl-dia" role="listitem" data-tarde="${d.tarde ? 1 : 0}" data-n="${d.jornadas.length}"><button type="button" class="pl-dn" data-a="dia" data-f="${d.fecha}" aria-label="Agendar jornada el día ${d.dia}">${d.dia}</button>${d.jornadas.map(chipJ)}</div>`)}</div>
      ${t.despues11.length ? html`<p class="pl-aviso" role="status">${ico('triangle-alert', 14)} ${t.despues11.length === 1 ? 'Hay 1 jornada' : `Hay ${t.despues11.length} jornadas`} después del día ${DIA_LIMITE}: ${t.despues11.map((j) => `${j.title || 'Jornada'} (${diaDe(j.date)})`).join(', ')}. Ya no se graba nada del ciclo.</p>` : ''}
      ${t.fuera.length ? html`<p class="mut sm">Fuera de la tira (después del 20): ${t.fuera.map((j) => j.title || 'Jornada').join(', ')}.</p>` : ''}
      ${!t.dias.some((d) => d.jornadas.length) ? html`<p class="pl-sd">${SIN_DATOS}: aún no hay jornadas este mes. Toca un día para agendar la grabación.</p>` : ''}`;
  }
  function medidorHtml() {
    const m = medidor(jornadas(), S.ficha, S.mes), pct = Math.min(100, m.pct ?? 0);
    return html`<section class="pl-med" aria-label="Medidor contra la ficha"><h4>Contra la ficha</h4>
      ${m.sinTecho ? html`<p class="pl-sd">${SIN_DATOS}: el techo de horas y sesiones sale de la ficha de oferta del cliente.</p>` : ''}
      <p class="sm">${m.estimadas === null ? html`<span class="pl-sd">${SIN_DATOS}: las horas estimadas salen de cada jornada</span>` : html`<b>${m.estimadas} h</b> estimadas`}${m.techoHoras !== null ? ` de ${m.techoHoras} h de la ficha` : ''}${m.reales !== null ? ` · ${m.reales} h reales` : ''}</p>
      ${m.pct !== null ? html`<div class="pl-bar" data-sobre="${m.pasaHoras ? 1 : 0}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Horas estimadas contra el techo de la ficha"><span style="width:${pct}%"></span></div>` : ''}
      <p class="sm">${m.sesiones} ${m.sesiones === 1 ? 'sesión' : 'sesiones'}${m.techoSesiones !== null ? ` de ${m.techoSesiones} de la ficha` : ''}${m.pasaHoras || m.pasaSesiones ? html` · <b class="pl-rojo">te pasas del techo</b>` : ''}${m.sinEstimar ? html` · <span class="mut">${m.sinEstimar} sin horas estimadas</span>` : ''}</p></section>`;
  }
  const campo = (rot, k, valor, o = {}) => html`<label class="pl-c ${o.mitad ? 'mitad' : ''}"><span>${rot}</span>${o.area ? html`<textarea class="in" data-k="${k}" rows="2" ${S.puede ? '' : 'disabled'}>${valor ?? ''}</textarea>` : html`<input class="in" type="${o.tipo || 'text'}" ${o.tipo === 'number' ? 'min="0" step="any" inputmode="decimal"' : ''} data-k="${k}" value="${valor ?? ''}" placeholder="${o.ph || ''}" autocomplete="off" ${S.puede ? '' : 'disabled'}>`}</label>`;
  function jornadaHtml() {
    const x = S.borrador;
    if (!x) return html`<p class="mut">Elige una jornada de la tira o toca un día para agendar una.</p>`;
    const j = limpiarJornada(x), o = ordenDeTiro(j), c = j.produccion, nuevo = !x.id, ed = S.puede && !j.archivado;
    const tarde = !esCeo && j.date && diaDe(j.date) > DIA_LIMITE && (nuevo || x.date !== S.original?.date);
    return html`<section class="pl-jor" aria-label="Jornada" ${ed ? '' : 'data-ro="1"'}><header class="pl-jor-h"><h4>${nuevo ? 'Nueva jornada' : j.title || 'Jornada'}</h4>${j.archivado ? html`<span class="chip">Archivada</span>` : ''}</header>
      ${tarde ? html`<p class="pl-aviso" role="alert">${ico('triangle-alert', 14)} Después del día ${DIA_LIMITE} no se graba nada del ciclo: el servidor no la guarda salvo que la autorice el CEO.</p>` : ''}
      <div class="pl-grid">${campo('¿Qué se graba?', 'title', j.title)}${campo('Fecha', 'date', j.date, { tipo: 'date', mitad: 1 })}${campo('Call time', 'time', j.time, { tipo: 'time', mitad: 1 })}
        ${campo('Locación', 'place', j.place, { mitad: 1 })}
        <label class="pl-c mitad"><span>Estado</span><select class="in" data-k="status" ${ed ? '' : 'disabled'}>${ESTADOS.map((e) => html`<option ${j.status === e ? 'selected' : ''}>${e}</option>`)}</select></label>
        ${campo('Crew (roles, separados por coma)', 'crew', crewDe(j).join(', '))}${campo('Talento (roles)', 'talento', c.talento.join(', '), { mitad: 1 })}${campo('Equipo', 'equipo', c.equipo.join(', '), { mitad: 1 })}
        ${campo('Contacto en el set', 'contacto', c.contacto)}${campo('Horas estimadas', 'horas_estimadas', j.horas_estimadas, { tipo: 'number', mitad: 1 })}${campo('Horas reales', 'horas_reales', j.horas_reales, { tipo: 'number', mitad: 1 })}</div>
      <h5>Márgenes (minutos)</h5><div class="pl-grid">${MARGENES.map(([k, n]) => html`<label class="pl-c mitad"><span>${n}</span><input class="in" type="number" min="0" step="1" data-m="${k}" value="${j.margenes[k] ?? ''}" placeholder="${SIN_DATOS}" ${ed ? '' : 'disabled'}></label>`)}</div>
      ${o.sinMargenes ? html`<p class="pl-sd">${SIN_DATOS}: los márgenes de montaje, luz y traslado los define Producción; sin ellos el orden de tiro no los cuenta.</p>` : ''}
      <h5>Orden de tiro</h5>${ordenHtml(j, o, ed)}
      <h5>Recursos${montos ? ' y montos' : ''}</h5>${recursosHtml(j, ed)}
      <label class="pl-c"><span>Notas</span><textarea class="in" data-k="notes" rows="2" ${ed ? '' : 'disabled'}>${j.notes}</textarea></label>
      <div class="pl-acts">${ed ? html`<button type="button" class="btn" data-a="guardar">${ico('check', 14)} Guardar</button>` : ''}${!nuevo ? html`<button type="button" class="btn ghost" data-a="callsheet">${ico('file-text', 14)} Call sheet</button>${S.puede ? html`<button type="button" class="btn ghost" data-a="${j.archivado ? 'desarchivar' : 'archivar'}">${j.archivado ? 'Desarchivar' : 'Archivar'}</button>` : ''}` : ''}<button type="button" class="btn ghost" data-a="cerrar">Cerrar</button></div></section>`;
  }
  function ordenHtml(j, o, ed) {
    if (!j.escenas.length) return html`<p class="pl-sd">${SIN_DATOS}: las escenas salen de la Shot List del mes.</p>${ed ? html`<button type="button" class="btn" data-a="shotlist">${ico('download', 14)} Traer de la Shot List</button>` : ''}`;
    return html`<p class="mut sm">${o.sinCall ? `${SIN_DATOS}: pon el call time para ver las horas` : `Termina ${o.fin || SIN_DATOS}`} · ${o.horas} h con márgenes${o.faltan.length ? ` · faltan los minutos de ${o.faltan.join(', ')}` : ''}</p>
      <ol class="pl-orden">${o.filas.map((e, i) => html`<li data-id="${e.id}"><b>${e.inicio || '--:--'}</b> <span>${e.id} · ${e.accion || e.id_creativo || ''}${e.lugar ? html` <span class="mut">· ${e.lugar}</span>` : ''}</span>
        <input class="in sm" type="number" min="0" step="1" data-e="${e.id}" value="${e.min ?? ''}" placeholder="min" aria-label="Minutos de ${e.id}" ${ed ? '' : 'disabled'}>
        ${ed ? html`<button type="button" class="btn ghost" data-a="subir" data-id="${e.id}" aria-label="Subir ${e.id}" ${i ? '' : 'disabled'}>↑</button><button type="button" class="btn ghost" data-a="bajar" data-id="${e.id}" aria-label="Bajar ${e.id}" ${i < o.filas.length - 1 ? '' : 'disabled'}>↓</button>` : ''}</li>`)}</ol>
      ${ed ? html`<button type="button" class="btn" data-a="shotlist">${ico('download', 14)} Traer de la Shot List otra vez</button>` : ''}`;
  }
  function recursosHtml(j, ed) {
    const r = j.produccion.recursos, t = montos ? totalRecursos(j) : null;
    return html`${r.length ? html`<ul class="pl-rec">${r.map((x, i) => html`<li><input class="in" data-r="${i}" data-f="nombre" value="${x.nombre}" aria-label="Recurso" ${ed ? '' : 'disabled'}><input class="in sm" type="number" min="0" data-r="${i}" data-f="cantidad" value="${x.cantidad ?? ''}" placeholder="cant." aria-label="Cantidad" ${ed ? '' : 'disabled'}>
      ${montos ? html`<input class="in sm" type="number" min="0" step="any" data-r="${i}" data-f="monto" value="${x.monto ?? ''}" placeholder="monto" aria-label="Monto" ${ed ? '' : 'disabled'}>` : ''}${ed ? html`<button type="button" class="btn ghost" data-a="quitar-r" data-i="${i}" aria-label="Quitar recurso">${ico('x', 14)}</button>` : ''}</li>`)}</ul>` : html`<p class="pl-sd">${SIN_DATOS}: aún no hay recursos (transporte, renta de equipo, comida…).</p>`}
      ${montos ? html`<p class="sm">Total de recursos: ${t === null ? html`<span class="pl-sd">${SIN_DATOS}</span>` : html`<b>${t}</b>`}</p>` : ''}${ed ? html`<button type="button" class="btn" data-a="agregar-r">${ico('plus', 14)} Recurso</button>` : ''}`;
  }
  function pintar() {
    if (!alive()) return;
    const arch = jornadas().filter((x) => x.archivado);
    mount(host, html`<div class="pl"><header class="pl-head"><h2>${ico('clock', 16)} Production Planner</h2><span class="grm-cli">${b?.name || slug}</span></header>
      <div class="pl-mes"><button type="button" class="btn ghost" data-a="mes" data-n="-1" aria-label="Mes anterior">←</button><b>${nombreMes(S.mes)}</b><button type="button" class="btn ghost" data-a="mes" data-n="1" aria-label="Mes siguiente">→</button></div>
      <div class="pl-cuerpo"><div class="pl-izq">${tiraHtml()}${medidorHtml()}</div><div class="pl-der" id="pl-jor">${jornadaHtml()}</div></div>
      ${arch.length ? html`<details class="pl-arch" ${S.archivadas ? 'open' : ''}><summary>Archivadas (${arch.length})</summary>${arch.map((j) => html`<button type="button" class="pl-j" data-a="elegir" data-id="${j.id}" data-estado="Cancelado">${j.date || ''} · ${j.title || 'Jornada'}</button>`)}</details>` : ''}</div>`);
  }
  const pintarJor = () => { const el = $('#pl-jor', host); if (el) mount(el, jornadaHtml()); };

  // ---------- Acciones ----------
  const abrir = (x) => { S.borrador = structuredClone(x); S.original = structuredClone(x); S.sel = x.id || ''; };
  // Lo que escribió la persona en el formulario pasa al borrador (sin repintar: no se pierde el foco).
  function tomarForm() {
    const x = S.borrador; if (!x) return;
    const p = { ...(x.produccion || {}) };
    for (const el of host.querySelectorAll('#pl-jor [data-k]')) {
      const k = el.dataset.k, v = el.value;
      if (k === 'crew') p.crew = lista(v); else if (k === 'talento') p.talento = lista(v); else if (k === 'equipo') p.equipo = lista(v); else if (k === 'contacto') p.contacto = v;
      else if (k === 'horas_estimadas' || k === 'horas_reales') x[k] = num(v); else x[k] = v;
    }
    x.produccion = p;
    x.margenes = { ...(x.margenes || {}) }; for (const el of host.querySelectorAll('#pl-jor [data-m]')) x.margenes[el.dataset.m] = num(el.value);
    const escenas = (x.escenas || []).map((e) => ({ ...e })); for (const el of host.querySelectorAll('#pl-jor [data-e]')) { const e = escenas.find((y) => y.id === el.dataset.e); if (e) e.min = num(el.value); } x.escenas = escenas;
    const rs = (p.recursos || []).map((r) => ({ ...r })); for (const el of host.querySelectorAll('#pl-jor [data-r]')) { const r = rs[Number(el.dataset.r)], f = el.dataset.f; if (r) r[f] = f === 'nombre' ? el.value : num(el.value); } p.recursos = rs;
  }
  async function guardar() {
    tomarForm(); const x = S.borrador, j = limpiarJornada(x);
    if (!j.title) return toast('Dile qué se graba', true);
    if (!j.date) return toast('Elige la fecha', true);
    const campos = { title: j.title, date: j.date, time: j.time, place: j.place, notes: j.notes, status: j.status, ...camposProduccion({ ...x, archivado: false }) };
    if (!montos) campos.produccion = { ...campos.produccion, recursos: campos.produccion.recursos.map(({ monto, ...r }) => r) };
    const r = x.id ? await C.save({ ...S.todas.find((y) => y.id === x.id), ...campos, archivado: Boolean(x.archivado) }) : await C.create({ kind: 'shoot', profile: slug, ...campos });
    S.todas = x.id ? S.todas.map((y) => (y.id === r.id ? r : y)) : [...S.todas, r]; abrir(r); toast('Jornada guardada'); pintar();
  }
  async function deShotlist() {
    const x = S.borrador, r = await api(`entregables?ws=production&slug=${enc(slug)}&tool=shot-list-builder&ciclo=${enc(mesDe(x.date) || S.mes)}`), d = (r.items || []).find((y) => !y.archivado);
    if (!d?.contenido) return toast(`${SIN_DATOS}: no hay Shot List de ${nombreMes(mesDe(x.date) || S.mes)} (sale del Shot List Builder)`, true);
    tomarForm();
    const jor = String(x.title || '').match(/\bJ\d+\b/i)?.[0]?.toUpperCase() || '', nuevas = escenasDeShotlist(d.contenido, jor);
    if (!nuevas.length) return toast(jor ? `La Shot List no tiene escenas en ${jor}` : 'La Shot List no tiene escenas con jornada. Pon «J1» en el nombre de la jornada o asígnalas en el Shot List Builder', true);
    const previo = new Map((x.escenas || []).map((e) => [e.id, e.min]));
    x.escenas = nuevas.map((e) => ({ ...e, min: previo.get(e.id) ?? null })); x.orden = [...(x.orden || []).filter((id) => x.escenas.some((e) => e.id === id)), ...x.escenas.map((e) => e.id).filter((id) => !(x.orden || []).includes(id))];
    toast(`${nuevas.length} escenas de ${jor || 'la Shot List'}`); pintarJor();
  }
  function callSheetVer() {
    const c = callSheet(S.borrador, { marca: b?.name || slug }), dato = (v) => (v ? v : html`<span class="pl-sd">${SIN_DATOS}</span>`), l = (a) => (a.length ? a.join(', ') : html`<span class="pl-sd">${SIN_DATOS}</span>`);
    docView(html`<div class="pl-cs">${docHead(`Call sheet · ${c.titulo || 'Jornada'}`, `${c.marca} · ${c.fecha || ''}`)}
      <dl class="pl-cs-d"><dt>Fecha</dt><dd>${dato(c.fecha)}</dd><dt>Call time</dt><dd>${dato(c.call)}</dd><dt>Locación</dt><dd>${dato(c.locacion)}</dd><dt>Crew</dt><dd>${l(c.crew)}</dd><dt>Talento</dt><dd>${l(c.talento)}</dd><dt>Equipo</dt><dd>${l(c.equipo)}</dd><dt>Contacto</dt><dd>${dato(c.contacto)}</dd></dl>
      <table class="pl-cs-t"><thead><tr><th>Hora</th><th>Escena</th><th>Pieza</th><th>Acción</th><th>Plano</th><th>Lugar</th><th>Min</th></tr></thead><tbody>${c.orden.map((e) => html`<tr><td>${e.inicio || '--:--'}</td><td>${e.id}</td><td>${e.id_creativo}</td><td>${e.accion}</td><td>${e.plano}</td><td>${e.lugar}</td><td>${e.min ?? ''}</td></tr>`)}</tbody></table>
      ${c.recursos.length ? html`<p><b>Recursos:</b> ${c.recursos.map((r) => `${r.nombre}${r.cantidad !== null ? ` × ${r.cantidad}` : ''}`).join(', ')}</p>` : ''}${c.notas ? html`<p><b>Notas:</b> ${c.notas}</p>` : ''}</div>`);
  }

  host.onclick = (ev) => {
    const t = ev.target.closest?.('[data-a]'); if (!t) return;
    const a = t.dataset.a, id = t.dataset.id;
    if (a === 'mes') { S.mes = mesMas(S.mes, Number(t.dataset.n)); return pintar(); }
    if (a === 'elegir') { const x = S.todas.find((y) => y.id === id); if (x) { S.archivadas = Boolean(x.archivado); abrir(x); pintar(); } return; }
    if (a === 'dia') {
      const f = t.dataset.f;
      if (!esCeo && diaDe(f) > DIA_LIMITE) return toast(`El día ${DIA_LIMITE} es el último para producir: después no se graba nada del ciclo`, true);
      S.borrador = { kind: 'shoot', profile: slug, date: f, status: ESTADOS[0], time: '', place: '', title: '' }; S.original = null; S.sel = ''; return pintar();
    }
    if (a === 'cerrar') { S.borrador = null; S.sel = ''; return pintar(); }
    if (!S.borrador) return;
    if (['subir', 'bajar', 'agregar-r', 'quitar-r'].includes(a)) tomarForm();
    if (a === 'subir' || a === 'bajar') { S.borrador.orden = mover(camposProduccion(S.borrador).orden, id, a === 'subir' ? -1 : 1); return pintarJor(); }
    if (a === 'agregar-r') { const p = S.borrador.produccion ||= {}; p.recursos = [...(p.recursos || []), { nombre: '', cantidad: null, monto: null }]; return pintarJor(); }
    if (a === 'quitar-r') { S.borrador.produccion.recursos = S.borrador.produccion.recursos.filter((_, i) => i !== Number(t.dataset.i)); return pintarJor(); }
    if (a === 'callsheet') { tomarForm(); return callSheetVer(); }
    if (a === 'guardar') return haz(guardar);
    if (a === 'shotlist') return haz(deShotlist);
    if (a === 'archivar') return haz(async () => {
      if (!(await confirmAsk(`¿Archivar «${S.borrador.title || 'la jornada'}»? No se borra: queda en Archivadas.`))) return;
      const cur = S.todas.find((y) => y.id === S.borrador.id), r = await C.save({ ...cur, ...archivar(cur) }); S.todas = S.todas.map((y) => (y.id === r.id ? r : y)); S.archivadas = true; abrir(r); toast('Jornada archivada'); pintar();
    });
    if (a === 'desarchivar') return haz(async () => { const cur = S.todas.find((y) => y.id === S.borrador.id), r = await C.save({ ...cur, ...desarchivar(cur) }); S.todas = S.todas.map((y) => (y.id === r.id ? r : y)); abrir(r); toast('Jornada desarchivada'); pintar(); });
  };
  // Cambiar la fecha o el estado repinta (el aviso del día 11 y el estado); el resto no, para no perder el foco al tabular.
  host.onchange = (ev) => { const k = ev.target?.dataset?.k; if (k === 'date' || k === 'status' || k === 'time') { tomarForm(); pintarJor(); } };

  await recargar();
  if (alive() && !S.borrador) { const m = vivas(jornadas()).filter((x) => mesDe(x.date) === S.mes).sort((a, z) => String(a.date).localeCompare(String(z.date)))[0]; if (m) { abrir(m); pintar(); } }
}
