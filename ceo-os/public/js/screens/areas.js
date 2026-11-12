// Áreas → #/areas/<id> (Strategy, Marketing, Creative, Consulting, Production): lo que cada área sabe y lo importante, en un solo lugar.
// Arriba lo que viene («Próximo») y lo importante (las notas fijadas, en grande); debajo todo lo demás, con buscador y filtro por cliente y por tipo.
// Cada nota puede llevar fecha y estado (Por hacer · En curso · Hecho) y se ve como Lista, Tablero (columnas por estado) o Calendario (el mes).
// Las notas viven en «area_notes» (por /api/db, con su v: si alguien la cambió antes, el 409 avisa). Nada se borra: se archiva.
// Cada nota se lee de un vistazo (visual.js): franja del color del área, el tipo en un cuadrito de ícono, título fuerte, dos líneas
// de texto y abajo chips (cliente con monograma, estado con su punto, fecha con cuánto falta). «Próximo» va agrupado por fecha
// relativa (Atrasado · Hoy · Esta semana · Próxima semana · Después) y el avance del área, en un anillo.
import { html, raw, mount, col, acts, toast, ico, md, ask, confirmAsk, fdate, fdateLong, uploadToDrive, canEdit, escalonar, $ } from '../core.js';
import { TIPOS, TIPO_NOMBRE, TIPO_ICONO, SIN_CLIENTE, ESTADOS, SIN_ESTADO, VISTAS, VISTA_NOMBRE, VISTA_ICONO, areaInfo, limpiarNota, leerNota, notaError, deArea, ordenar, filtrar, linkSeguro, hostDe, vistaOk, fechaHoy, mesDe, moverMes, grillaMes, porEstado, porDia, proximas, vencida, DIAS_PROXIMO } from '../areas-notas.js';
import { abrirEnChat } from '../areas.js';
import { cargarContexto, contextoLista } from '../contexto.js';
import { anillo, proporcion, cuentaChip, agruparPorFecha, monograma, cuadrito, vacio, recuerda, recordar } from '../visual.js';

// La forma de la página mientras carga: cabecera, barra de búsqueda y tarjetas (cero salto de layout).
export const esqueleto = () => html`<div class="skel skel-areas" aria-busy="true"><span class="sr-only">Cargando…</span><i class="sk-t"></i><i class="sk-s"></i><i class="sk-bar"></i><div class="sk-cards">${[1, 2, 3, 4, 5, 6].map(() => html`<i class="sk-card"></i>`)}</div></div>`;

// La clave de cada estado para las clases (ar-e-<clave>): '' = sin estado.
const CLAVE = { 'Por hacer': 'por', 'En curso': 'curso', Hecho: 'hecho' };
const clave = (e) => CLAVE[e] || 'sin';
const DIAS_CORTO = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const nombreMes = (mes) => { const s = new Date(`${mes}-15T12:00:00`).toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };
const MAX_PROXIMO = 8; // filas de «Próximo» a la vista (lo atrasado va primero)
// El color de cada estado en la barra del tablero (tokens): gris = por hacer, azul = en curso, verde = hecho, gris claro = sin estado.
const COLOR_ESTADO = { 'Por hacer': 'var(--ui-mut2)', 'En curso': 'var(--ui-info)', Hecho: 'var(--ui-ok)', [SIN_ESTADO]: 'var(--ui-line2)' };
// Qué entra escalonado en cada forma de verlas (solo lo de la hoja: nada anidado, para que no suba dos veces).
const SEL_DATOS = { lista: '.ar-pr, .ar-card', tablero: '.ar-resumen, .ar-col', calendario: '.ar-cal' };

// Las pestañas de un área: lo que sabe (Notas) y quién trabaja en ella (Agents).
const tab = (a, ruta, on, k, icono, nombre) => html`<a href="#/areas/${a.id}${ruta}" ${on === k ? raw('aria-current="page"') : ''}>${ico(icono, 14)} ${nombre}</a>`;
const tabsArea = (a, on) => html`<nav class="tabs" data-iai aria-label="${a.nombre}">${tab(a, '', on, 'herramientas', 'layout-grid', 'Herramientas')}${tab(a, '/movimientos', on, 'movimientos', 'list-checks', 'Movimientos')}${tab(a, '/notas', on, 'notas', 'file-text', 'Notas')}<a href="#/areas/${a.id}/agents" ${on === 'agents' ? raw('aria-current="page"') : ''}>${ico('agents', 14)} Agentes</a></nav>`;

export async function render(el, { me, sub, alive }) {
  // Agents del área (#/areas/<área>/agents): los mismos agentes del Agent Area, filtrados por esta área.
  if (sub?.[1] === 'agents') {
    const a = areaInfo(sub[0]), { pintarAgentes } = await import('../agentes-ui.js');
    mount(el, html`<div class="hello sp-hero ar-head" style="--ar-c:var(${a.color})"><span class="ar-ico">${ico(a.icono, 22)}</span><div class="ar-tit"><h1>${a.nombre}</h1><p>Los agentes que trabajan en ${a.nombre}.</p></div></div>${tabsArea(a, 'agents')}<div class="ar-agents"></div>`);
    return pintarAgentes(el.querySelector('.ar-agents'), me, alive, { area: a.id, cabecera: false });
  }
  if (!sub?.[1]) { const { pintarMesas } = await import('../area-mesas.js'); return pintarMesas(el, { me, area: areaInfo(sub?.[0]), tabs: tabsArea, alive }); }
  if (sub[1] === 'embudo' || sub[1] === 'rentabilidad') { const { pintarDinero } = await import('../dinero-ui.js'); return pintarDinero(el, { me, area: areaInfo(sub[0]), tabs: tabsArea, vista: sub[1], alive }); }
  if (sub[1] === 'radar' || sub[1] === 'resultados') { const { pintarMarketing } = await import('../marketing-ui.js'); return pintarMarketing(el, { me, area: areaInfo(sub[0]), tabs: tabsArea, vista: sub[1], alive }); }
  if (sub[1] === 'meta' || sub[1] === 'voz') { const { pintarEstrategia } = await import('../estrategia-ui.js'); return pintarEstrategia(el, { me, area: areaInfo(sub[0]), tabs: tabsArea, vista: sub[1], alive }); }
  if (sub[1] === 'costo') { const { pintarProduccion } = await import('../produccion-ui.js'); return pintarProduccion(el, { me, area: areaInfo(sub[0]), tabs: tabsArea, alive }); }
  if (sub[1] === 'movimientos') {
    const a = areaInfo(sub[0]), { pintarMovimientos } = await import('../movimientos-ui.js');
    mount(el, html`<div class="hello sp-hero ar-head" style="--ar-c:var(${a.color})"><span class="ar-ico">${ico(a.icono, 22)}</span><div class="ar-tit"><h1>${a.nombre}</h1><p>Qué se hizo, qué costó y qué provocó.</p></div></div>${tabsArea(a, 'movimientos')}<div id="mv"></div>`);
    return pintarMovimientos($('#mv', el), { me, area: a.id, alive });
  }
  const area = areaInfo(sub?.[0]), C = col('area_notes');
  const puede = canEdit(me, 'library'), drive = Boolean(me.google?.drive);
  const f = { q: '', cliente: '', tipo: '' };
  let notas = [], verArchivadas = false;
  // La forma de verlas se recuerda por persona (en este navegador: si no se puede guardar, simplemente no se recuerda).
  const llave = `os.areas.vista.${String(me.email || '').toLowerCase()}`;
  let vista = (() => { try { return vistaOk(localStorage.getItem(llave)); } catch { return 'lista'; } })();
  const guardarVista = (v) => { try { localStorage.setItem(llave, v); } catch {} };
  // «Después» (lo que vence más allá de la semana que viene) empieza cerrado; se recuerda como lo deje la persona.
  const llaveDespues = `os.areas.despues.${String(me.email || '').toLowerCase()}`;
  let despuesAbierto = recuerda(llaveDespues) === '1';
  const hoy = () => fechaHoy();
  let mes = mesDe(hoy());
  // Arrastrar tarjetas entre columnas solo en la compu (ratón); en el cel se cambia con el selector de la tarjeta.
  const dnd = puede && typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
  let arrastrando = '';

  try { notas = (await C.list()).map(leerNota); }
  catch (e) { return mount(el, html`${vacio({ icono: 'lock', titulo: `${e.status === 403 ? 'Tu perfil no ve esta sección' : `No pude leer ${area.nombre}`}`, linea: e.message })}`); }
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

  // ---------- Fecha, estado y cliente ----------
  // La fecha dice cuánto falta (Hoy, Mañana, En 3 días, Pasó hace 2 días) con su tono; lo Hecho no corre y queda con su fecha corta.
  const chipFecha = (n, h) => cuentaChip(n.fecha, h, { hecho: n.estado === 'Hecho' });
  const chipEstado = (n) => (n.estado ? html`<span class="ar-est ar-e-${clave(n.estado)}">${n.estado}</span>` : '');
  // El cliente: su monograma (siempre el mismo color) y el nombre.
  const chipCliente = (n) => (n.cliente ? html`<span class="ar-cliente" title="Cliente">${monograma(nombreCliente(n.cliente), { tam: 'sm' })}<span>${nombreCliente(n.cliente)}</span></span>` : '');
  // El selector de estado de una tarjeta del tablero (en el cel es la única forma de moverla).
  const selEstado = (n) => html`<label class="ar-est-wrap"><span class="sr-only">Estado</span><select class="in ar-est-sel ar-e-${clave(n.estado)}" data-id="${n.id}" aria-label="Estado de «${n.titulo}»">${[['', SIN_ESTADO], ...ESTADOS.map((e) => [e, e])].map(([v, l]) => html`<option value="${v}" ${(n.estado || '') === v ? raw('selected') : ''}>${l}</option>`)}</select></label>`;

  // ---------- Una tarjeta ----------
  // modo: 'lista' (la de siempre) · 'grande' (las importantes, arriba) · 'tablero' (compacta, con el selector de estado).
  // De arriba abajo: [tipo en cuadrito · título] / dos líneas de texto / adjuntos y etiquetas / chips (cliente · estado · fecha) y las acciones.
  function tarjeta(n, modo = 'lista') {
    const grande = modo === 'grande', tab = modo === 'tablero', h = hoy();
    const link = linkSeguro(n.link), arc = n.archivo && linkSeguro(n.archivo.url) ? n.archivo : null;
    const act = n._meta?.updated_at ? fdate(n._meta.updated_at) : '';
    const largo = !tab && (n.texto.length > (grande ? 200 : 140) || n.texto.split('\n').filter(Boolean).length > (grande ? 3 : 2));
    const acciones = !puede ? '' : n.archivado
      ? html`<button class="btn ghost ar-rest" type="button" data-act="restaurar">${ico('rotate-cw', 13)} Restaurar</button>`
      : html`<button class="btn-icon ar-pin ${n.importante ? 'on' : ''}" type="button" data-act="fijar" aria-pressed="${n.importante ? 'true' : 'false'}" title="${n.importante ? 'Quitar de importante' : 'Fijar como importante'}" aria-label="${n.importante ? 'Quitar de importante' : 'Fijar como importante'}">${ico('star', 15)}</button>
        <button class="btn-icon" type="button" data-act="editar" title="Editar" aria-label="Editar">${ico('pencil', 15)}</button>
        <button class="btn-icon" type="button" data-act="archivar" title="Archivar" aria-label="Archivar">${ico('inbox', 15)}</button>`;
    const chips = [chipCliente(n), tab ? '' : chipEstado(n), chipFecha(n, h)].filter((x) => x && String(x));
    return html`<article class="ar-card ar-card2 ${grande ? 'ar-big' : ''} ${tab ? 'ar-kcard' : ''} ${n.importante ? 'is-pin' : ''} ${n.archivado ? 'is-arch' : ''} ${n.estado === 'Hecho' ? 'is-hecho' : ''}" data-id="${n.id}" ${tab && dnd && !n.archivado ? raw('draggable="true"') : ''}>
      <div class="ar-top">${cuadrito(TIPO_ICONO[n.tipo], { color: 'var(--ar-c)', titulo: TIPO_NOMBRE[n.tipo], tam: tab ? 'sm' : 'md' })}
        <div class="ar-top-t"><h3 class="ar-t">${n.titulo || 'Sin título'}</h3>${act && !tab ? html`<span class="ar-meta mut sm">Actualizada ${act}</span>` : ''}</div></div>
      ${n.texto ? html`<div class="ar-texto ar-l2 ${grande ? 'ar-l3' : ''}">${md(n.texto)}</div>${largo ? html`<button class="ar-mas" type="button" data-act="mas">Ver más</button>` : ''}` : ''}
      ${link || arc ? html`<div class="ar-adj">${link ? html`<a class="ar-link" href="${link}" target="_blank" rel="noopener noreferrer">${ico('external-link', 13)} ${hostDe(link) || 'Abrir link'}</a>` : ''}${arc ? html`<a class="ar-link" href="${arc.url}" target="_blank" rel="noopener noreferrer">${ico('paperclip', 13)} ${arc.nombre}</a>` : ''}</div>` : ''}
      ${n.etiquetas.length ? html`<div class="ar-tags">${n.etiquetas.map((t) => html`<span class="ar-tag">${t}</span>`)}</div>` : ''}
      ${chips.length || acciones ? html`<div class="ar-chips">${chips}${acciones ? html`<span class="ar-acts">${acciones}</span>` : ''}</div>` : ''}
      ${tab && puede && !n.archivado ? selEstado(n) : ''}
    </article>`;
  }

  // ---------- Las tres formas de verlas ----------
  const selVistas = () => html`<div class="ar-vistas" role="group" aria-label="Cómo verlas">${VISTAS.map((v) => { const on = vista === v && !verArchivadas; return html`<button class="ar-vista ${on ? 'on' : ''}" type="button" data-act="vista" data-vista="${v}" aria-pressed="${on ? 'true' : 'false'}">${ico(VISTA_ICONO[v], 14)} <span>${VISTA_NOMBRE[v]}</span></button>`; })}</div>`;
  function pintarVistas() { const box = $('#ar-vs', el); if (box) mount(box, selVistas()); }

  // Próximo: lo atrasado y lo que vence en los próximos días (lo ya Hecho no aparece), agrupado por fecha relativa:
  // Atrasado (rojo) · Hoy · Esta semana · Próxima semana · Después (cerrado hasta que se abre). Los grupos vacíos no se pintan.
  function secProximo(items, h) {
    const grupos = agruparPorFecha(items, (n) => n.fecha, h);
    let cupo = MAX_PROXIMO;
    const fila = (n) => html`<div class="ar-pr" data-id="${n.id}"><span class="ar-pr-c">${chipFecha(n, h)}</span>
      ${puede ? html`<button class="ar-pr-t" type="button" data-act="editar" data-id="${n.id}">${n.titulo || 'Sin título'}</button>` : html`<b class="ar-pr-t">${n.titulo || 'Sin título'}</b>`}
      ${chipCliente(n)}${chipEstado(n)}</div>`;
    const cuerpo = grupos.map((g) => {
      const filas = g.items.slice(0, Math.max(cupo, 0)); cupo -= filas.length;
      if (!filas.length) return '';
      const cab = html`<span>${g.etiqueta}</span><b>· ${g.items.length}</b>`;
      if (g.grupo !== 'Después') return html`<div class="vz-grupo vz-g-${g.grupo === 'Pasado' ? 'tarde' : g.grupo === 'Hoy' ? 'hoy' : 'sig'}"><div class="vz-gh">${cab}</div>${filas.map(fila)}</div>`;
      return html`<div class="vz-grupo vz-g-sig ${despuesAbierto ? 'is-open' : ''}"><button type="button" class="vz-gh vz-gh--btn" data-act="grupo" aria-expanded="${despuesAbierto ? 'true' : 'false'}">${cab}${ico('chevron-down', 14)}</button>
        <div class="vz-colapsa"><div class="vz-colapsa-in" ${despuesAbierto ? '' : raw('inert')}>${filas.map(fila)}</div></div></div>`;
    });
    const mas = items.length - MAX_PROXIMO;
    return html`<section class="ar-sec ar-sec-prox"><div class="ar-sec-h"><h2>${ico('clock', 15)} Próximo</h2><span class="mut sm">lo atrasado y lo que vence en ${DIAS_PROXIMO} días</span></div>
      <div class="ar-prox">${cuerpo}</div>
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
        : html`<div class="ar-sin">${vacio({ icono: hayFiltro ? 'search' : 'inbox', titulo: verArchivadas && !hayFiltro ? 'No hay notas archivadas' : hayFiltro ? 'Nada coincide con eso' : 'Todavía no hay más notas',
          linea: hayFiltro ? 'Prueba con otras palabras o quita los filtros.' : verArchivadas ? 'Lo que archives queda aquí: nada se borra.' : 'Lo que agregues sin fijar aparece aquí.', boton: hayFiltro ? { texto: 'Quitar los filtros', act: 'limpiar' } : null, compacto: true })}</div>`}</section>`;
  }

  // Tablero: una columna por estado. Se mueve con el selector de la tarjeta (y, en la compu, arrastrándola).
  function secTablero(vis, acc) {
    const g = porEstado(vis);
    // Arriba, una barra con el reparto de todas las notas por estado (la longitud se compara sola) y su leyenda con el número.
    const resumen = proporcion([...ESTADOS, SIN_ESTADO].map((e) => ({ valor: g[e].length, label: e, color: COLOR_ESTADO[e] })), { label: `Notas por estado: ${[...ESTADOS, SIN_ESTADO].map((e) => `${e} ${g[e].length}`).join(', ')}` });
    return html`<section class="ar-sec ar-sec-tab"><div class="ar-sec-h"><h2>Tablero</h2><div class="sp"></div>${acc}</div>
      ${String(resumen) ? html`<div class="ar-resumen">${resumen}</div>` : ''}
      <div class="ar-board">${[...ESTADOS, SIN_ESTADO].map((e) => {
        const val = e === SIN_ESTADO ? '' : e, l = g[e];
        return html`<section class="ar-col ar-e-${clave(val)}" data-estado="${val}" aria-label="${e}"><div class="ar-col-h"><h3>${e}</h3><span class="ar-n" aria-label="${l.length} en «${e}»">${l.length}</span><div class="sp"></div>${puede ? html`<button class="btn-icon" type="button" data-act="nueva" data-estado="${val}" title="Agregar en «${e}»" aria-label="Agregar en «${e}»">${ico('plus', 15)}</button>` : ''}</div>
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
        ${puede && dentro ? html`<button class="btn-icon ar-dia-add" type="button" data-act="nueva" data-fecha="${d}" title="Agregar en este día" aria-label="Agregar el ${fdateLong(d)}">${ico('plus', 13)}</button>` : ''}</div>${dentro ? l.map(chipDia) : ''}</div>`;
    };
    const mini = (n) => html`<div class="ar-mini" data-id="${n.id}">${cuadrito(TIPO_ICONO[n.tipo], { color: 'var(--ar-c)', titulo: TIPO_NOMBRE[n.tipo], tam: 'sm' })}<span class="ar-mini-t">${n.titulo || 'Sin título'}</span>${chipCliente(n)}${chipEstado(n)}<div class="sp"></div>${puede ? html`<button class="btn-icon" type="button" data-act="editar" title="Editar" aria-label="Editar">${ico('pencil', 15)}</button>` : ''}</div>`;
    return html`<section class="ar-sec ar-sec-cal"><div class="ar-sec-h"><h2>Calendario</h2><div class="sp"></div>${acc}</div>
      <div class="ar-cal"><div class="ar-cal-h"><button class="btn-icon" type="button" data-act="mes-ant" title="Mes anterior" aria-label="Mes anterior">${ico('chevron-left', 16)}</button><h3 class="ar-cal-mes" aria-live="polite">${nombreMes(mes)}</h3><button class="btn-icon" type="button" data-act="mes-sig" title="Mes siguiente" aria-label="Mes siguiente">${ico('chevron-right', 16)}</button><div class="sp"></div><button class="btn ghost" type="button" data-act="mes-hoy">Hoy</button></div>
        <div class="ar-grid">${DIAS_CORTO.map((d) => html`<div class="ar-dh">${d}</div>`)}${grillaMes(mes).flat().map(celda)}</div></div>
      <div class="ar-sin-fecha"><div class="ar-sec-h"><h2>Sin fecha</h2><span class="mut sm">${sinFecha.length}</span></div>
        ${sinFecha.length ? html`<div class="ar-minis">${sinFecha.map(mini)}</div>` : html`<div class="ar-hint mut">Todas las notas tienen fecha.</div>`}</div></section>`;
  }

  // ---------- La página ----------
  function paint() {
    const hay = deArea(notas, area.id, { archivadas: 'todas' }).length > 0;
    // El avance del área: de las notas que llevan estado, cuántas están Hechas. Sin ninguna con estado no se pinta anillo (no hay total).
    const conEstado = deArea(notas, area.id).filter((n) => n.estado), hechas = conEstado.filter((n) => n.estado === 'Hecho').length;
    const avance = conEstado.length ? html`<div class="ar-avance" title="Notas hechas de las que tienen estado">${anillo(Math.round((hechas / conEstado.length) * 100), { tam: 46, color: 'var(--ar-c)', label: `${hechas} de ${conEstado.length} notas hechas` })}<span class="ar-avance-t"><b>${hechas} de ${conEstado.length}</b><small>hechas</small></span></div>` : '';
    mount(el, html`<div class="hello sp-hero ar-head" style="--ar-c:var(${area.color})"><span class="ar-ico">${ico(area.icono, 22)}</span>
        <div class="ar-tit"><h1>${area.nombre}</h1><p>Lo que esta área sabe y lo importante, en un solo lugar.</p></div>
        ${avance}<div class="ar-acc"><button class="btn ghost" type="button" data-act="chat">${ico('sparkles', 14)} Hablar con Inherent AI</button>${puede ? html`<button class="btn" type="button" data-act="nueva">${ico('plus', 14)} Agregar</button>` : ''}</div></div>
      ${tabsArea(area, 'notas')}
      ${!hay ? html`<div class="ar-vacio" style="--ar-c:var(${area.color})">${vacio({ icono: area.icono, titulo: `Aquí va lo que ${area.nombre} sabe`, linea: puede ? 'Una nota, un link, un archivo o una decisión. Lo importante se fija arriba.' : 'Una nota, un link, un archivo o una decisión. Tu perfil solo puede leer esto.', boton: puede ? { texto: 'Agregar la primera', act: 'nueva' } : null })}</div>`
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
    // Lo atrasado (con fecha ya pasada y sin estar Hecho) se suma a lo que viene: «Próximo» lo muestra primero, en rojo.
    const h = hoy(), prox = verArchivadas ? [] : [...vis.filter((n) => vencida(n, h)), ...proximas(vis, h)];
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

  // ---------- Entradas escalonadas ----------
  // Una vez al abrir la página y al cambiar de forma de verlas; al buscar o filtrar no se repiten. escalonar (core.js) pone .entra y --i
  // y los quita al terminar, así un repintado nunca vuelve a animar.
  const entrarDatos = () => { const box = $('#ar-datos', el); if (box) escalonar(box, { sel: SEL_DATOS[verArchivadas ? 'lista' : vista], max: 9 }); };
  const entrarTodo = () => escalonar(el, { sel: `.ar-head, .ar-bar, ${SEL_DATOS[verArchivadas ? 'lista' : vista]}`, max: 10 });

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
    vista: (t) => { vista = vistaOk(t.dataset.vista); verArchivadas = false; guardarVista(vista); paintDatos(); entrarDatos(); },
    // «Después»: se abre y se cierra sin repintar (el chevron gira y la altura pasa de 0fr a 1fr) y se recuerda.
    grupo: (t) => {
      const g = t.closest('.vz-grupo'); if (!g) return;
      despuesAbierto = g.classList.toggle('is-open'); t.setAttribute('aria-expanded', despuesAbierto ? 'true' : 'false');
      g.querySelector('.vz-colapsa-in')?.toggleAttribute('inert', !despuesAbierto);
      recordar(llaveDespues, despuesAbierto ? '1' : '0');
    },
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
  entrarTodo();
}
