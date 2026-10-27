// Áreas → #/areas/<id> (Strategy, Marketing, Creative, Consulting, Production): lo que cada área sabe y lo importante, en un solo lugar.
// Arriba lo importante (las notas fijadas, en grande); debajo todo lo demás, con buscador y filtro por cliente y por tipo.
// Las notas viven en «area_notes» (por /api/db, con su v: si alguien la cambió antes, el 409 avisa). Nada se borra: se archiva.
import { html, raw, mount, col, acts, toast, ico, md, ask, confirmAsk, fdate, skel, uploadToDrive, canEdit, $ } from '../core.js';
import { TIPOS, TIPO_NOMBRE, TIPO_ICONO, SIN_CLIENTE, areaInfo, limpiarNota, leerNota, notaError, deArea, ordenar, filtrar, linkSeguro, hostDe } from '../areas-notas.js';
import { abrirEnChat } from '../areas.js';
import { cargarContexto, contextoLista } from '../contexto.js';

export const esqueleto = () => skel('pagina');

export async function render(el, { me, sub, alive }) {
  const area = areaInfo(sub?.[0]), C = col('area_notes');
  const puede = canEdit(me, 'library'), drive = Boolean(me.google?.drive);
  const f = { q: '', cliente: '', tipo: '' };
  let notas = [], verArchivadas = false;

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

  // ---------- Una tarjeta ----------
  function tarjeta(n, grande) {
    const link = linkSeguro(n.link), arc = n.archivo && linkSeguro(n.archivo.url) ? n.archivo : null;
    const fecha = n._meta?.updated_at ? fdate(n._meta.updated_at) : '';
    const largo = n.texto.length > 320 || n.texto.split('\n').length > 6;
    const acciones = !puede ? '' : n.archivado
      ? html`<button class="btn ghost ar-rest" type="button" data-act="restaurar">${ico('rotate-cw', 13)} Restaurar</button>`
      : html`<button class="ar-btn ar-pin ${n.importante ? 'on' : ''}" type="button" data-act="fijar" aria-pressed="${n.importante ? 'true' : 'false'}" title="${n.importante ? 'Quitar de importante' : 'Fijar como importante'}" aria-label="${n.importante ? 'Quitar de importante' : 'Fijar como importante'}">${ico('star', 15)}</button>
        <button class="ar-btn" type="button" data-act="editar" title="Editar" aria-label="Editar">${ico('pencil', 15)}</button>
        <button class="ar-btn" type="button" data-act="archivar" title="Archivar" aria-label="Archivar">${ico('inbox', 15)}</button>`;
    return html`<article class="ar-card ${grande ? 'ar-big' : ''} ${n.importante ? 'is-pin' : ''} ${n.archivado ? 'is-arch' : ''}" data-id="${n.id}">
      <div class="ar-card-h"><span class="ar-tipo ar-tipo-${n.tipo}">${ico(TIPO_ICONO[n.tipo], 13)} ${TIPO_NOMBRE[n.tipo]}</span>
        ${n.cliente ? html`<span class="chip ar-cli">${nombreCliente(n.cliente)}</span>` : ''}
        ${fecha ? html`<span class="mut sm ar-fecha">${fecha}</span>` : ''}
        <div class="sp"></div>${acciones}</div>
      <h3 class="ar-t">${n.titulo || 'Sin título'}</h3>
      ${n.texto ? html`<div class="ar-texto ${largo ? 'ar-clamp' : ''}">${md(n.texto)}</div>${largo ? html`<button class="ar-mas" type="button" data-act="mas">Ver más</button>` : ''}` : ''}
      ${link || arc ? html`<div class="ar-adj">${link ? html`<a class="ar-link" href="${link}" target="_blank" rel="noopener noreferrer">${ico('external-link', 13)} ${hostDe(link) || 'Abrir link'}</a>` : ''}${arc ? html`<a class="ar-link" href="${arc.url}" target="_blank" rel="noopener noreferrer">${ico('paperclip', 13)} ${arc.nombre}</a>` : ''}</div>` : ''}
      ${n.etiquetas.length ? html`<div class="ar-tags">${n.etiquetas.map((t) => html`<span class="ar-tag">${t}</span>`)}</div>` : ''}
    </article>`;
  }

  // ---------- La página ----------
  function paint() {
    const hay = deArea(notas, area.id, { archivadas: 'todas' }).length > 0;
    mount(el, html`<div class="hello sp-hero ar-head" style="--ar-c:var(${area.color})"><span class="ar-ico">${ico(area.icono, 22)}</span>
        <div class="ar-tit"><h1>${area.nombre}</h1><p>Lo que esta área sabe y lo importante, en un solo lugar.</p></div>
        <div class="ar-acc"><button class="btn ghost" type="button" data-act="chat">${ico('sparkles', 14)} Hablar con Inherent AI</button>${puede ? html`<button class="btn" type="button" data-act="nueva">${ico('plus', 14)} Agregar</button>` : ''}</div></div>
      ${!hay ? html`<div class="empty ar-vacio" style="--ar-c:var(${area.color})"><span class="ar-ico">${ico(area.icono, 26)}</span><b>Aquí va lo que ${area.nombre} sabe</b>
          Una nota, un link, un archivo o una decisión. Lo importante se fija arriba.${puede ? html`<button class="btn" type="button" data-act="nueva">${ico('plus', 14)} Agregar la primera</button>` : html`<span class="mut sm">Tu perfil solo puede leer esto.</span>`}</div>`
      : html`<div class="ar-bar"><label class="ar-search">${ico('search', 14)}<input class="in" id="ar-q" type="search" value="${f.q}" placeholder="Buscar en ${area.nombre}…" aria-label="Buscar"></label>
          <span class="ar-cl" id="ar-cl">${selCliente()}</span>
          <select class="in ar-sel" id="ar-tipo" aria-label="Filtrar por tipo"><option value="">Todos los tipos</option>${TIPOS.map((t) => html`<option value="${t}" ${f.tipo === t ? raw('selected') : ''}>${TIPO_NOMBRE[t]}</option>`)}</select></div>
        <div id="ar-datos" style="--ar-c:var(${area.color})"></div>`}`);
    paintDatos();
  }
  function paintDatos() {
    const box = $('#ar-datos', el); if (!box) return;
    const nArch = deArea(notas, area.id, { archivadas: true }).length, hayFiltro = Boolean(f.q || f.cliente || f.tipo);
    const vis = ordenar(filtrar(deArea(notas, area.id, { archivadas: verArchivadas }), f));
    const pins = verArchivadas ? [] : vis.filter((n) => n.importante), resto = verArchivadas ? vis : vis.filter((n) => !n.importante);
    const verPins = !verArchivadas && (pins.length > 0 || !hayFiltro);
    const verLista = resto.length > 0 || verArchivadas || nArch > 0 || (hayFiltro && !pins.length);
    mount(box, html`${verPins ? html`<section class="ar-sec ar-sec-pin"><div class="ar-sec-h"><h2>${ico('star', 15)} Importante</h2>${pins.length ? html`<span class="mut sm">${pins.length} fijada${pins.length === 1 ? '' : 's'}</span>` : ''}</div>
        ${pins.length ? html`<div class="ar-pins">${pins.map((n) => tarjeta(n, true))}</div>` : html`<div class="ar-hint mut">Fija aquí lo que no se puede perder: toca la estrella de cualquier nota.</div>`}</section>` : ''}
      ${verLista ? html`<section class="ar-sec"><div class="ar-sec-h"><h2>${verArchivadas ? 'Archivadas' : pins.length ? 'Todo lo demás' : 'Todo'}</h2><div class="sp"></div>
          ${verArchivadas ? html`<button class="btn ghost" type="button" data-act="activas">← Volver a ${area.nombre}</button>` : nArch ? html`<button class="btn ghost" type="button" data-act="archivadas">Ver archivadas (${nArch})</button>` : ''}</div>
        ${resto.length ? html`<div class="ar-lista">${resto.map((n) => tarjeta(n, false))}</div>`
          : html`<div class="empty ar-sin"><b>${verArchivadas && !hayFiltro ? 'No hay notas archivadas' : hayFiltro ? 'Nada coincide con eso' : 'Todavía no hay más notas'}</b>${hayFiltro ? html`<button class="btn ghost" type="button" data-act="limpiar">Quitar los filtros</button>` : ''}</div>`}</section>` : ''}`);
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

  // ---------- Agregar y editar ----------
  const checks = (k, l, texto, on) => ({ k, l, t: 'checks', opts: [['1', texto]], v: on ? ['1'] : [] });
  function campos(v, actual) {
    return [
      { k: 'tipo', l: 'Tipo', t: 'select', opts: TIPOS.map((t) => [t, TIPO_NOMBRE[t]]), v: v.tipo },
      { k: 'titulo', l: 'Título', t: 'text', req: true, v: v.titulo, ph: 'Lo que otra persona buscaría' },
      { k: 'texto', l: 'Texto', t: 'textarea', v: v.texto, ph: 'Lo que hay que saber. Acepta **negritas**, listas con - y títulos con #.' },
      { k: 'link', l: drive ? 'Link (https)' : 'Link o archivo (https, por ejemplo de Drive)', t: 'text', v: v.link, ph: 'https://…' },
      { k: 'cliente', l: 'Cliente', t: 'select', opts: [['', 'Sin cliente (general del área)'], ...opcionesCliente()], v: v.cliente },
      { k: 'etiquetas', l: 'Etiquetas', t: 'text', v: v.etiquetas.join(', '), ph: 'separadas por coma' },
      checks('importante', 'Importante', 'Fijarla arriba, en «Importante»', v.importante),
      ...(drive ? [{ k: 'archivo', l: actual ? `Archivo: ${actual.nombre}. Sube otro para reemplazarlo` : 'Archivo (se sube a tu Drive)', t: 'file' }] : []),
      ...(actual ? [checks('quitar', 'Archivo adjunto', 'Quitar el archivo adjunto', false)] : []),
    ];
  }
  async function formulario(n) {
    let v = n ? { ...n } : { tipo: 'nota', titulo: '', texto: '', link: '', cliente: clienteDelFiltro(), etiquetas: [], importante: false, archivo: null };
    for (;;) {
      const r = await ask(n ? 'Editar' : `Agregar a ${area.nombre}`, campos(v, v.archivo), 'Guardar');
      if (!r) return;
      const nuevo = r.archivo instanceof File ? r.archivo : null;
      const datos = limpiarNota({ ...(n || {}), area: area.id, tipo: r.tipo, titulo: r.titulo, texto: r.texto, link: r.link, cliente: r.cliente, etiquetas: r.etiquetas, importante: (r.importante || []).includes('1'), archivo: (r.quitar || []).includes('1') ? null : v.archivo });
      const err = notaError({ ...datos, link: r.link }, { archivoNuevo: Boolean(nuevo) });
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
    nueva: () => formulario(null),
    editar: (t) => { const n = deTarjeta(t); if (n) formulario(n); },
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
  });
  el.addEventListener('input', (e) => { if (e.target.id === 'ar-q') { f.q = e.target.value; paintDatos(); } });
  el.addEventListener('change', (e) => {
    if (e.target.id === 'ar-cliente') { f.cliente = e.target.value; paintDatos(); }
    if (e.target.id === 'ar-tipo') { f.tipo = e.target.value; paintDatos(); }
  });
  paint();
}
