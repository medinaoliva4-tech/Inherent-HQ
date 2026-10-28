// Áreas → #/areas/<id> (Strategy, Marketing, Creative, Consulting, Production): lo que cada área sabe y lo importante, en un solo lugar.
// Arriba lo que viene («Próximo») y lo importante (las notas fijadas, en grande); debajo todo lo demás, con buscador y filtro por cliente y por tipo.
// Cada nota puede llevar fecha y estado (Por hacer · En curso · Hecho) y se ve como Lista, Tablero (columnas por estado) o Calendario (el mes).
// Las notas viven en «area_notes» (por /api/db, con su v: si alguien la cambió antes, el 409 avisa). Nada se borra: se archiva.
import { html, raw, mount, col, acts, toast, ico, md, ask, confirmAsk, fdate, fdateLong, skel, uploadToDrive, canEdit, $ } from '../core.js';
import { TIPOS, TIPO_NOMBRE, TIPO_ICONO, SIN_CLIENTE, ESTADOS, SIN_ESTADO, VISTAS, VISTA_NOMBRE, VISTA_ICONO, areaInfo, limpiarNota, leerNota, notaError, deArea, ordenar, filtrar, linkSeguro, hostDe, vistaOk, fechaHoy, mesDe, moverMes, grillaMes, diasHasta, porEstado, porDia, proximas, vencida, DIAS_PROXIMO } from '../areas-notas.js';
import { abrirEnChat } from '../areas.js';
import { cargarContexto, contextoLista } from '../contexto.js';

export const esqueleto = () => skel('pagina');

// La clave de cada estado para las clases (ar-e-<clave>): '' = sin estado.
const CLAVE = { 'Por hacer': 'por', 'En curso': 'curso', Hecho: 'hecho' };
const clave = (e) => CLAVE[e] || 'sin';
const DIAS_CORTO = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const nombreMes = (mes) => { const s = new Date(`${mes}-15T12:00:00`).toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };
const MAX_PROXIMO = 5;

export async function render(el, { me, sub, alive }) {
  const area = areaInfo(sub?.[0]), C = col('area_notes');
  const puede = canEdit(me, 'library'), drive = Boolean(me.google?.drive);
  const f = { q: '', cliente: '', tipo: '' };
  let notas = [], verArchivadas = false;
  // La forma de verlas se recuerda por persona (en este navegador: si no se puede guardar, simplemente no se recuerda).
  const llave = `os.areas.vista.${String(me.email || '').toLowerCase()}`;
  let vista = (() => { try { return vistaOk(localStorage.getItem(llave)); } catch { return 'lista'; } })();
  const guardarVista = (v) => { try { localStorage.setItem(llave, v); } catch {} };
  const hoy = () => fechaHoy();
  let mes = mesDe(hoy());
  // Arrastrar tarjetas entre columnas solo en la compu (ratón); en el cel se cambia con el selector de la tarjeta.
  const dnd = puede && typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
  let arrastrando = '';

  try { notas = (await C.list()).map(leerNota); }
  catch (e) { return mount(el, html`<div class="empty"><b>${e.status === 403 ? 'Tu perfil no ve esta sección' : `No pude leer ${area.nombre}`}</b>${e.message}</div>`); }
  if (!alive()) return;
  // La lista de clientes suele estar ya (la usa el Chat); si no, llega después y se repintan el filtro y los nombres.
  if (!contextoLista().length) cargarContexto(me).then(() => { if (alive()) { pintarClientes(); paintDatos(); } }).catch(() => {});

  // ---------- Clientes ----------
  // «personal» (la marca del CEO) no se ofrece: esta sección la ve todo el equipo.
  const nombreCliente = (s) => contextoLista().find((x) => x.slug === s)?.name || String(s).toUpperCase();
  function opcionesCliente() {
    const vistos = new Set(), out = [];
    for (const c of contextoLista()) { if (c.slug === 'personal' || vistos.has(c.slug)) continue; vistos.add(c.slug); out.push([c.slug, c.name || c.slug]); }
    for (const n of deArea(notas, area.id, { archivadas: 'todas' })) if (n.cliente && n.cliente !== 'personal' && !vistos.has(n.cliente)) { vistos.add(n.cliente); out.push([n.cliente, n.cliente.toUpperCase()]); }
    return out;
  }
  const selCliente = () => { const l = opcionesCliente(); return !l.length ? '' : html`<select class="in ar-sel" id="ar-cliente" aria-label="Filtrar por cliente"><option value="">Todos los clientes</option><option value="${SIN_CLIENTE}" ${f.cliente === SIN_CLIENTE ? raw('selected') : ''}>Sin cliente</option>${l.map(([s, n]) => html`<option value="${s}" ${f.cliente === s ? raw('selected') : ''}>${n}</option>`)}</select>`; };
  function pintarClientes() { const box = $('#ar-cl', el); if (box) mount(box, selCliente()); }
  const clienteDelFiltro = () => (f.cliente && f.cliente !== SIN_CLIENTE ? f.cliente : '');

  // ---------- Fecha y estado ----------
  const chipFecha = (n, h) => {
    if (!n.fecha) return '';
    const tarde = vencida(n, h);
    return html`<span class="ar-due ${tarde ? 'is-late' : ''}" title="${fdateLong(n.fecha)}${tarde ? ' · ya pasó' : ''}">${ico('calendar-days', 12)} ${fdate(n.fecha)}${tarde ? ' · pasó' : ''}</span>`;
  };
  const chipEstado = (n) => (n.estado ? html`<span class="ar-est ar-e-${clave(n.estado)}">${n.estado}</span>` : '');
  // Cuándo vence, en palabras: «Hoy», «Mañana» o «30 oct».
  const cuando = (n, h) => { const d = diasHasta(n.fecha, h); return d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : fdate(n.fecha); };
  // El selector de estado de una tarjeta del tablero (en el cel es la única forma de moverla).
  const selEstado = (n) => html`<label class="ar-est-wrap"><span class="sr-only">Estado</span><select class="in ar-est-sel ar-e-${clave(n.estado)}" data-id="${n.id}" aria-label="Estado de «${n.titulo}»">${[['', SIN_ESTADO], ...ESTADOS.map((e) => [e, e])].map(([v, l]) => html`<option value="${v}" ${(n.estado || '') === v ? raw('selected') : ''}>${l}</option>`)}</select></label>`;

  // ---------- Una tarjeta ----------
  // modo: 'lista' (la de siempre) · 'grande' (las importantes, arriba) · 'tablero' (compacta, con el selector de estado).
  function tarjeta(n, modo = 'lista') {
    const grande = modo === 'grande', tab = modo === 'tablero', h = hoy();
    const link = linkSeguro(n.link), arc = n.archivo && linkSeguro(n.archivo.url) ? n.archivo : null;
    const act = n._meta?.updated_at ? fdate(n._meta.updated_at) : '';
    const largo = !tab && (n.texto.length > 320 || n.texto.split('\n').length > 6);
    const acciones = !puede ? '' : n.archivado
      ? html`<button class="btn ghost ar-rest" type="button" data-act="restaurar">${ico('rotate-cw', 13)} Restaurar</button>`
      : html`<button class="ar-btn ar-pin ${n.importante ? 'on' : ''}" type="button" data-act="fijar" aria-pressed="${n.importante ? 'true' : 'false'}" title="${n.importante ? 'Quitar de importante' : 'Fijar como importante'}" aria-label="${n.importante ? 'Quitar de importante' : 'Fijar como importante'}">${ico('star', 15)}</button>
        <button class="ar-btn" type="button" data-act="editar" title="Editar" aria-label="Editar">${ico('pencil', 15)}</button>
        <button class="ar-btn" type="button" data-act="archivar" title="Archivar" aria-label="Archivar">${ico('inbox', 15)}</button>`;
    return html`<article class="ar-card ${grande ? 'ar-big' : ''} ${tab ? 'ar-kcard' : ''} ${n.importante ? 'is-pin' : ''} ${n.archivado ? 'is-arch' : ''} ${n.estado === 'Hecho' ? 'is-hecho' : ''}" data-id="${n.id}" ${tab && dnd && !n.archivado ? raw('draggable="true"') : ''}>
      <div class="ar-card-h"><span class="ar-tipo ar-tipo-${n.tipo}">${ico(TIPO_ICONO[n.tipo], 13)} ${TIPO_NOMBRE[n.tipo]}</span>
        ${n.cliente ? html`<span class="chip ar-cli">${nombreCliente(n.cliente)}</span>` : ''}
        ${chipFecha(n, h)}${tab ? '' : chipEstado(n)}
        ${act && !tab ? html`<span class="mut sm ar-fecha">${act}</span>` : ''}
        <div class="sp"></div>${acciones}</div>
      <h3 class="ar-t">${n.titulo || 'Sin título'}</h3>
      ${n.texto ? html`<div class="ar-texto ${largo || tab ? 'ar-clamp' : ''}">${md(n.texto)}</div>${largo ? html`<button class="ar-mas" type="button" data-act="mas">Ver más</button>` : ''}` : ''}
      ${link || arc ? html`<div class="ar-adj">${link ? html`<a class="ar-link" href="${link}" target="_blank" rel="noopener noreferrer">${ico('external-link', 13)} ${hostDe(link) || 'Abrir link'}</a>` : ''}${arc ? html`<a class="ar-link" href="${arc.url}" target="_blank" rel="noopener noreferrer">${ico('paperclip', 13)} ${arc.nombre}</a>` : ''}</div>` : ''}
      ${n.etiquetas.length ? html`<div class="ar-tags">${n.etiquetas.map((t) => html`<span class="ar-tag">${t}</span>`)}</div>` : ''}
      ${tab && puede && !n.archivado ? selEstado(n) : ''}
    </article>`;
  }

  // ---------- Las tres formas de verlas ----------
  const selVistas = () => html`<div class="ar-vistas" role="group" aria-label="Cómo verlas">${VISTAS.map((v) => { const on = vista === v && !verArchivadas; return html`<button class="ar-vista ${on ? 'on' : ''}" type="button" data-act="vista" data-vista="${v}" aria-pressed="${on ? 'true' : 'false'}">${ico(VISTA_ICONO[v], 14)} <span>${VISTA_NOMBRE[v]}</span></button>`; })}</div>`;
  function pintarVistas() { const box = $('#ar-vs', el); if (box) mount(box, selVistas()); }

  // Próximo: lo que vence en los próximos días (lo ya Hecho no aparece).
  function secProximo(prox, h) {
    const mas = prox.length - MAX_PROXIMO;
    return html`<section class="ar-sec ar-sec-prox"><div class="ar-sec-h"><h2>${ico('clock', 15)} Próximo</h2><span class="mut sm">lo que vence en ${DIAS_PROXIMO} días</span></div>
      <div class="ar-prox">${prox.slice(0, MAX_PROXIMO).map((n) => html`<div class="ar-pr" data-id="${n.id}"><span class="ar-due ${diasHasta(n.fecha, h) === 0 ? 'is-hoy' : ''}">${ico('calendar-days', 12)} ${cuando(n, h)}</span>
        ${puede ? html`<button class="ar-pr-t" type="button" data-act="editar" data-id="${n.id}">${n.titulo || 'Sin título'}</button>` : html`<b class="ar-pr-t">${n.titulo || 'Sin título'}</b>`}
        ${n.cliente ? html`<span class="chip ar-cli">${nombreCliente(n.cliente)}</span>` : ''}${chipEstado(n)}</div>`)}</div>
      ${mas > 0 ? html`<div class="ar-hint mut">y ${mas} más en el calendario</div>` : ''}</section>`;
  }

  function secImportante(pins) {
    return html`<section class="ar-sec ar-sec-pin"><div class="ar-sec-h"><h2>${ico('star', 15)} Importante</h2>${pins.length ? html`<span class="mut sm">${pins.length} fijada${pins.length === 1 ? '' : 's'}</span>` : ''}</div>
      ${pins.length ? html`<div class="ar-pins">${pins.map((n) => tarjeta(n, 'grande'))}</div>` : html`<div class="ar-hint mut">Fija aquí lo que no se puede perder: toca la estrella de cualquier nota.</div>`}</section>`;
  }

  // Lista: la de siempre (las importantes ya están arriba).
  function secLista(resto, pins, hayFiltro, acc) {
    return html`<section class="ar-sec"><div class="ar-sec-h"><h2>${verArchivadas ? 'Archivadas' : pins.length ? 'Todo lo demás' : 'Todo'}</h2><div class="sp"></div>${acc}</div>
      ${resto.length ? html`<div class="ar-lista">${resto.map((n) => tarjeta(n, 'lista'))}</div>`
        : html`<div class="empty ar-sin"><b>${verArchivadas && !hayFiltro ? 'No hay notas archivadas' : hayFiltro ? 'Nada coincide con eso' : 'Todavía no hay más notas'}</b>${hayFiltro ? html`<button class="btn ghost" type="button" data-act="limpiar">Quitar los filtros</button>` : ''}</div>`}</section>`;
  }

  // Tablero: una columna por estado. Se mueve con el selector de la tarjeta (y, en la compu, arrastrándola).
  function secTablero(vis, acc) {
    const g = porEstado(vis);
    return html`<section class="ar-sec ar-sec-tab"><div class="ar-sec-h"><h2>Tablero</h2><div class="sp"></div>${acc}</div>
      <div class="ar-board">${[...ESTADOS, SIN_ESTADO].map((e) => {
        const val = e === SIN_ESTADO ? '' : e, l = g[e];
        return html`<section class="ar-col ar-e-${clave(val)}" data-estado="${val}" aria-label="${e}"><div class="ar-col-h"><h3>${e}</h3><span class="ar-n">${l.length}</span><div class="sp"></div>${puede ? html`<button class="ar-btn" type="button" data-act="nueva" data-estado="${val}" title="Agregar en «${e}»" aria-label="Agregar en «${e}»">${ico('plus', 15)}</button>` : ''}</div>
          <div class="ar-col-b">${l.length ? l.map((n) => tarjeta(n, 'tablero')) : html`<div class="ar-col-vacia mut sm">${dnd ? 'Arrastra una nota aquí' : 'Sin notas'}</div>`}</div></section>`;
      })}</div></section>`;
  }

  // Calendario: el mes (lunes a domingo), cada nota en su día; abajo, las que no tienen fecha.
  function secCalendario(vis, acc, h) {
    const dias = porDia(vis, mes), sinFecha = vis.filter((n) => !n.fecha);
    const chipDia = (n) => (puede
      ? html`<button class="ar-cn ar-e-${clave(n.estado)} ${n.importante ? 'is-pin' : ''}" type="button" data-act="editar" data-id="${n.id}" title="${n.titulo}">${n.importante ? ico('star', 11) : ''}<span>${n.titulo || 'Sin título'}</span></button>`
      : html`<span class="ar-cn ar-e-${clave(n.estado)} ${n.importante ? 'is-pin' : ''}" title="${n.titulo}">${n.importante ? ico('star', 11) : ''}<span>${n.titulo || 'Sin título'}</span></span>`);
    const celda = (d, i) => {
      const dentro = d.startsWith(`${mes}-`), l = dias[d] || [];
      return html`<div class="ar-dia ${dentro ? '' : 'fuera'} ${d === h ? 'hoy' : ''} ${l.length ? 'con' : 'vacio'}" data-fecha="${d}"><div class="ar-dia-h"><span class="ar-dia-n">${Number(d.slice(8))}</span><span class="ar-dia-s">${DIAS_CORTO[i % 7]}</span>
        ${puede && dentro ? html`<button class="ar-btn ar-dia-add" type="button" data-act="nueva" data-fecha="${d}" title="Agregar en este día" aria-label="Agregar el ${fdateLong(d)}">${ico('plus', 13)}</button>` : ''}</div>${dentro ? l.map(chipDia) : ''}</div>`;
    };
    const mini = (n) => html`<div class="ar-mini" data-id="${n.id}"><span class="ar-tipo ar-tipo-${n.tipo}" title="${TIPO_NOMBRE[n.tipo]}">${ico(TIPO_ICONO[n.tipo], 13)}</span><span class="ar-mini-t">${n.titulo || 'Sin título'}</span>${n.cliente ? html`<span class="chip ar-cli">${nombreCliente(n.cliente)}</span>` : ''}${chipEstado(n)}<div class="sp"></div>${puede ? html`<button class="ar-btn" type="button" data-act="editar" title="Editar" aria-label="Editar">${ico('pencil', 15)}</button>` : ''}</div>`;
    return html`<section class="ar-sec ar-sec-cal"><div class="ar-sec-h"><h2>Calendario</h2><div class="sp"></div>${acc}</div>
      <div class="ar-cal"><div class="ar-cal-h"><button class="ar-btn" type="button" data-act="mes-ant" title="Mes anterior" aria-label="Mes anterior">${ico('chevron-left', 16)}</button><h3 class="ar-cal-mes" aria-live="polite">${nombreMes(mes)}</h3><button class="ar-btn" type="button" data-act="mes-sig" title="Mes siguiente" aria-label="Mes siguiente">${ico('chevron-right', 16)}</button><div class="sp"></div><button class="btn ghost" type="button" data-act="mes-hoy">Hoy</button></div>
        <div class="ar-grid">${DIAS_CORTO.map((d) => html`<div class="ar-dh">${d}</div>`)}${grillaMes(mes).flat().map(celda)}</div></div>
      <div class="ar-sin-fecha"><div class="ar-sec-h"><h2>Sin fecha</h2><span class="mut sm">${sinFecha.length}</span></div>
        ${sinFecha.length ? html`<div class="ar-minis">${sinFecha.map(mini)}</div>` : html`<div class="ar-hint mut">Todas las notas tienen fecha.</div>`}</div></section>`;
  }

  // ---------- La página ----------
  function paint() {
    const hay = deArea(notas, area.id, { archivadas: 'todas' }).length > 0;
    mount(el, html`<div class="hello sp-hero ar-head" style="--ar-c:var(${area.color})"><span class="ar-ico">${ico(area.icono, 22)}</span>
        <div class="ar-tit"><h1>${area.nombre}</h1><p>Lo que esta área sabe y lo importante, en un solo lugar.</p></div>
        <div class="ar-acc"><button class="btn ghost" type="button" data-act="chat">${ico('sparkles', 14)} Hablar con Inherent AI</button>${puede ? html`<button class="btn" type="button" data-act="nueva">${ico('plus', 14)} Agregar</button>` : ''}</div></div>
      ${!hay ? html`<div class="empty ar-vacio" style="--ar-c:var(${area.color})"><span class="ar-ico">${ico(area.icono, 26)}</span><b>Aquí va lo que ${area.nombre} sabe</b>
          Una nota, un link, un archivo o una decisión. Lo importante se fija arriba.${puede ? html`<button class="btn" type="button" data-act="nueva">${ico('plus', 14)} Agregar la primera</button>` : html`<span class="mut sm">Tu perfil solo puede leer esto.</span>`}</div>`
      : html`<div class="ar-bar" style="--ar-c:var(${area.color})"><label class="ar-search">${ico('search', 14)}<input class="in" id="ar-q" type="search" value="${f.q}" placeholder="Buscar en ${area.nombre}…" aria-label="Buscar"></label>
          <span class="ar-cl" id="ar-cl">${selCliente()}</span>
          <select class="in ar-sel" id="ar-tipo" aria-label="Filtrar por tipo"><option value="">Todos los tipos</option>${TIPOS.map((t) => html`<option value="${t}" ${f.tipo === t ? raw('selected') : ''}>${TIPO_NOMBRE[t]}</option>`)}</select>
          <span class="ar-vs" id="ar-vs">${selVistas()}</span></div>
        <div id="ar-datos" style="--ar-c:var(${area.color})"></div>`}`);
    paintDatos();
  }
  function paintDatos() {
    const box = $('#ar-datos', el); if (!box) return;
    const izq = $('.ar-board', box)?.scrollLeft || 0; // el tablero conserva su desplazamiento al repintarse
    const nArch = deArea(notas, area.id, { archivadas: true }).length, hayFiltro = Boolean(f.q || f.cliente || f.tipo);
    const vis = ordenar(filtrar(deArea(notas, area.id, { archivadas: verArchivadas }), f));
    const pins = verArchivadas ? [] : vis.filter((n) => n.importante), resto = verArchivadas ? vis : vis.filter((n) => !n.importante);
    const h = hoy(), prox = verArchivadas ? [] : proximas(vis, h);
    const modo = verArchivadas ? 'lista' : vista;
    const verPins = !verArchivadas && (pins.length > 0 || !hayFiltro);
    const verLista = resto.length > 0 || verArchivadas || nArch > 0 || (hayFiltro && !pins.length);
    const acc = html`${hayFiltro && modo !== 'lista' ? html`<button class="btn ghost" type="button" data-act="limpiar">Quitar los filtros</button>` : ''}${verArchivadas ? html`<button class="btn ghost" type="button" data-act="activas">← Volver a ${area.nombre}</button>` : nArch ? html`<button class="btn ghost" type="button" data-act="archivadas">Ver archivadas (${nArch})</button>` : ''}`;
    // Lo importante va arriba en las tres; el tablero y el calendario muestran todas las notas (también las fijadas) para no dejar fuera ninguna.
    mount(box, html`${prox.length ? secProximo(prox, h) : ''}${verPins ? secImportante(pins) : ''}
      ${modo === 'tablero' ? secTablero(vis, acc) : modo === 'calendario' ? secCalendario(vis, acc, h) : verLista ? secLista(resto, pins, hayFiltro, acc) : ''}`);
    const b = $('.ar-board', box); if (b && izq) b.scrollLeft = izq;
    pintarVistas();
  }
  // Si es la primera nota (o la vista no estaba pintada) se pinta todo; si no, solo las listas.
  const refrescar = () => ($('#ar-datos', el) && deArea(notas, area.id, { archivadas: 'todas' }).length ? paintDatos() : paint());

  // ---------- Guardar (con la v que se leyó) ----------
  async function falla(e) {
    if (e?.status === 409) { toast('Alguien la cambió justo ahora. Recarga', true); try { notas = (await C.list()).map(leerNota); if (alive()) refrescar(); } catch {} }
    else toast(e?.message || 'No se pudo guardar. Inténtalo de nuevo.', true);
  }
  async function guardar(n, datos, aviso) {
    try {
      const doc = leerNota(n ? await C.save({ ...datos, id: n.id, v: n.v }) : await C.create(datos));
      notas = n ? notas.map((x) => (x.id === n.id ? doc : x)) : [...notas, doc];
      toast(aviso); refrescar();
    } catch (e) { await falla(e); }
  }
  const cambiar = (n, patch, aviso) => guardar(n, limpiarNota({ ...n, ...patch }), aviso);
  // Cambiar el estado (del selector o arrastrando): guarda con la v de la nota.
  const moverA = (n, estado) => { if (n && puede && (n.estado || '') !== estado) cambiar(n, { estado }, estado ? `Movida a «${estado}»` : 'Sin estado'); };

  // ---------- Agregar y editar ----------
  const checks = (k, l, texto, on) => ({ k, l, t: 'checks', opts: [['1', texto]], v: on ? ['1'] : [] });
  function campos(v, actual) {
    return [
      { k: 'tipo', l: 'Tipo', t: 'select', opts: TIPOS.map((t) => [t, TIPO_NOMBRE[t]]), v: v.tipo },
      { k: 'titulo', l: 'Título', t: 'text', req: true, v: v.titulo, ph: 'Lo que otra persona buscaría' },
      { k: 'texto', l: 'Texto', t: 'textarea', v: v.texto, ph: 'Lo que hay que saber. Acepta **negritas**, listas con - y títulos con #.' },
      { k: 'link', l: drive ? 'Link (https)' : 'Link o archivo (https, por ejemplo de Drive)', t: 'text', v: v.link, ph: 'https://…' },
      { k: 'cliente', l: 'Cliente', t: 'select', opts: [['', 'Sin cliente (general del área)'], ...opcionesCliente()], v: v.cliente },
      { k: 'fecha', l: 'Fecha (opcional)', t: 'date', v: v.fecha, half: true },
      { k: 'estado', l: 'Estado', t: 'select', opts: [['', 'Sin estado'], ...ESTADOS.map((e) => [e, e])], v: v.estado, half: true },
      { k: 'etiquetas', l: 'Etiquetas', t: 'text', v: v.etiquetas.join(', '), ph: 'separadas por coma' },
      checks('importante', 'Importante', 'Fijarla arriba, en «Importante»', v.importante),
      ...(drive ? [{ k: 'archivo', l: actual ? `Archivo: ${actual.nombre}. Sube otro para reemplazarlo` : 'Archivo (se sube a tu Drive)', t: 'file' }] : []),
      ...(actual ? [checks('quitar', 'Archivo adjunto', 'Quitar el archivo adjunto', false)] : []),
    ];
  }
  // pre: lo que ya viene puesto al agregar (la fecha del día donde se tocó el «+», el estado de la columna).
  async function formulario(n, pre = {}) {
    let v = n ? { ...n } : { tipo: 'nota', titulo: '', texto: '', link: '', cliente: clienteDelFiltro(), fecha: limpiarNota({ fecha: pre.fecha }).fecha, estado: limpiarNota({ estado: pre.estado }).estado, etiquetas: [], importante: false, archivo: null };
    for (;;) {
      const r = await ask(n ? 'Editar' : `Agregar a ${area.nombre}`, campos(v, v.archivo), 'Guardar');
      if (!r) return;
      const nuevo = r.archivo instanceof File ? r.archivo : null;
      const datos = limpiarNota({ ...(n || {}), area: area.id, tipo: r.tipo, titulo: r.titulo, texto: r.texto, link: r.link, cliente: r.cliente, fecha: r.fecha, estado: r.estado, etiquetas: r.etiquetas, importante: (r.importante || []).includes('1'), archivo: (r.quitar || []).includes('1') ? null : v.archivo });
      const err = notaError({ ...datos, link: r.link, fecha: r.fecha }, { archivoNuevo: Boolean(nuevo) });
      if (err) { toast(err, true); v = { ...datos, link: String(r.link || '').trim() }; continue; }
      let archivo = datos.archivo;
      if (nuevo) {
        try {
          const d = await uploadToDrive(nuevo, nuevo.name, (p) => toast(`Subiendo «${nuevo.name}»… ${Math.round(p * 100)}%`), { client: datos.cliente || 'Inherent', sub: `Áreas · ${area.nombre}` });
          archivo = { url: d.link, nombre: d.name || nuevo.name };
        } catch (e) { toast(e?.message || 'No se pudo subir el archivo. Inténtalo de nuevo.', true); v = datos; continue; }
        if (!limpiarNota({ archivo }).archivo) { toast('Drive no devolvió el link del archivo. Inténtalo de nuevo.', true); v = datos; continue; }
      }
      return guardar(n, limpiarNota({ ...datos, archivo }), n ? 'Guardado' : 'Agregada');
    }
  }

  // ---------- Acciones ----------
  const deTarjeta = (t) => notas.find((n) => n.id === t.closest('[data-id]')?.dataset.id);
  acts(el, {
    chat: () => abrirEnChat(me.email, { modo: area.modo, slug: clienteDelFiltro() }),
    nueva: (t) => { if (puede) formulario(null, { fecha: t.dataset.fecha, estado: t.dataset.estado }); },
    editar: (t) => { const n = puede && deTarjeta(t); if (n) formulario(n); },
    fijar: (t) => { const n = deTarjeta(t); if (n) cambiar(n, { importante: !n.importante }, n.importante ? 'Quitada de importante' : 'Fijada en importante'); },
    archivar: async (t) => {
      const n = deTarjeta(t); if (!n) return;
      if (await confirmAsk(`¿Archivar «${n.titulo}»? No se borra: queda en «Ver archivadas».`)) cambiar(n, { archivado: true }, 'Archivada');
    },
    restaurar: (t) => { const n = deTarjeta(t); if (n) cambiar(n, { archivado: false }, 'Restaurada'); },
    archivadas: () => { verArchivadas = true; paintDatos(); },
    activas: () => { verArchivadas = false; paintDatos(); },
    limpiar: () => { f.q = ''; f.cliente = ''; f.tipo = ''; paint(); },
    mas: (t) => { const abierto = t.previousElementSibling?.classList.toggle('ar-open'); t.textContent = abierto ? 'Ver menos' : 'Ver más'; },
    vista: (t) => { vista = vistaOk(t.dataset.vista); verArchivadas = false; guardarVista(vista); paintDatos(); },
    'mes-ant': () => { mes = moverMes(mes, -1) || mes; paintDatos(); },
    'mes-sig': () => { mes = moverMes(mes, 1) || mes; paintDatos(); },
    'mes-hoy': () => { mes = mesDe(hoy()); paintDatos(); },
  });
  el.addEventListener('input', (e) => { if (e.target.id === 'ar-q') { f.q = e.target.value; paintDatos(); } });
  el.addEventListener('change', (e) => {
    if (e.target.id === 'ar-cliente') { f.cliente = e.target.value; paintDatos(); }
    if (e.target.id === 'ar-tipo') { f.tipo = e.target.value; paintDatos(); }
    if (e.target.classList?.contains('ar-est-sel')) moverA(notas.find((n) => n.id === e.target.dataset.id), e.target.value);
  });

  // Arrastrar una tarjeta a otra columna (solo en la compu). Soltarla cambia su estado y guarda con la v.
  if (dnd) {
    const colDe = (t) => (t instanceof Element ? t.closest('.ar-col[data-estado]') : null);
    const limpiarDrag = () => { arrastrando = ''; el.querySelectorAll('.ar-col.over, .ar-kcard.is-drag').forEach((x) => x.classList.remove('over', 'is-drag')); };
    el.addEventListener('dragstart', (e) => {
      const c = e.target instanceof Element ? e.target.closest('.ar-kcard[data-id]') : null; if (!c) return;
      arrastrando = c.dataset.id; e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', arrastrando); } catch {}
      c.classList.add('is-drag');
    });
    el.addEventListener('dragover', (e) => { const c = arrastrando && colDe(e.target); if (!c) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; c.classList.add('over'); });
    el.addEventListener('dragleave', (e) => { const c = colDe(e.target); if (c && !c.contains(e.relatedTarget)) c.classList.remove('over'); });
    el.addEventListener('drop', (e) => {
      const c = arrastrando && colDe(e.target); if (!c) return;
      e.preventDefault(); const id = arrastrando, estado = c.dataset.estado; limpiarDrag();
      moverA(notas.find((n) => n.id === id), estado);
    });
    el.addEventListener('dragend', limpiarDrag);
  }
  paint();
}
