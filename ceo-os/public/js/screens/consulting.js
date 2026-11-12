// Consulting: el backend de un cliente. Lo útil para organizar sus operaciones, sus finanzas y su equipo (Operations OS y
// Money OS, inherent/02-METODO.md), y los encargos que le manda Estrategia (por ejemplo, «Crear el BMC de la empresa»): cada
// encargo es una tarea con su área y su cliente, y se trabaja en el Chat. Lo ve quien ve Estrategia (lo lleva el CEO con Strategy).
// Hoy vive como el Overview del workspace Consulting (#/ws/consulting/<cliente>/overview, lo monta screens/workspace.js con
// consultingOverview): el hero (alcance, la etapa de Hormozi, LA restricción y el medidor de capacidad, leídos del último
// Diagnóstico de crecimiento aprobado), los encargos de Estrategia y los últimos entregables. Las herramientas son las tarjetas
// del workspace; los 12 temas de antes (llm/modos.js · CONSULTING) ya no son la interfaz: quedaron como semillas de los prompts.
// render() sigue para las rutas viejas #/consulting[/<cliente>] (alias). Las finanzas de Inherent viven en Organización → Finanzas.
import { html, mount, api, col, toast, ico, fdate, esc, initials, skel, $ } from '../core.js';
import { loadEstrategia, estrategiaNow } from '../stratlist.js';
import { datosEstrategia, avisoConsulting, pedidoDeEncargo, verTareas } from '../llm/paneles.js';
import { alcanceConsulting, consultingAbierto, encargosDe } from '../llm/modos.js';
import { etapaLabel, etapaDe } from '../estrategia.js';
import { abrirEnChat } from '../areas.js';
import { herramientaDe, rutaHerramienta } from '../herramientas.js';
import { ETAPAS_HORMOZI, SIN_DATOS } from '../consulting/marcos.js';
import { CAPACIDAD, limpiar as limpiarDiagnostico } from '../consulting/salud.js';
import { vacio } from '../visual.js';

export const esqueleto = () => skel('pagina');
const ALCANCE = { si: ['Growth Partnership', 'ok'], 'sin-finanzas': ['Growth Partnership · sin Finanzas', 'ok'], ficha: ['A la medida', ''], fuera: ['Fuera del alcance', 'fuera'], 'sin-ficha': ['Sin ficha', 'fuera'] };
// Inherent no es cliente de Consulting: sus finanzas y su operación viven en Organización.
const clientes = () => estrategiaNow().filter((c) => c.slug !== 'inherent');
const DIAGNOSTICO = 'business-health-assessment';
const APROBADOS = ['Aprobado', 'Entregado'];
const reciente = (d) => String(d._meta?.updated_at || d._meta?.created_at || '');

// Abre el Chat en modo Consulting con este cliente y el pedido escrito en la caja (se manda cuando la persona quiere).
const alChat = (me, slug, pedido) => abrirEnChat(me.email, { modo: 'consulting', slug, borrador: pedido });

// Las rutas viejas: #/consulting (la lista) y #/consulting/<cliente> (el detalle, con el link para volver).
export async function render(el, { me, sub = [], alive }) {
  const slug = sub[0] ? decodeURIComponent(sub[0]) : '';
  if (!slug) {
    const [, tareas] = await Promise.all([loadEstrategia(), verTareas(me) ? col('tasks').list().catch(() => []) : []]);
    if (!alive()) return;
    return lista(el, me, tareas);
  }
  mount(el, html`<div class="cs"><a class="btn ghost sm" href="#/ws/consulting">${ico('arrow-left', 14)} Todos los clientes</a><div id="cs-det"></div></div>`);
  return consultingOverview($('#cs-det', el), { me, slug, alive });
}

// El Diagnóstico de crecimiento aprobado más reciente (por la fecha de su aprobación) y su contenido ya limpio; null si no hay.
function diagnosticoAprobado(items) {
  const d = items.filter((x) => x.tool === DIAGNOSTICO && !x.archivado && APROBADOS.includes(x.estado))
    .sort((a, z) => String(z.aprobado?.en || '').localeCompare(String(a.aprobado?.en || '')))[0];
  return d ? { doc: d, c: limpiarDiagnostico(d.contenido) } : null;
}

// El medidor capacidad vs demanda: tres tramos, el del Diagnóstico encendido. Sin dato no se enciende ninguno.
function medidor(cap) {
  const x = CAPACIDAD.find((k) => k.id === cap);
  return html`<div class="cs-med" data-cap="${cap}" role="img" aria-label="${x ? `Capacidad en ${x.nombre.toLowerCase()}` : 'Capacidad sin datos'}">${CAPACIDAD.map((k) => html`<span class="cs-med-seg" data-cap="${k.id}" data-on="${k.id === cap ? '1' : '0'}"></span>`)}</div>
    ${x ? html`<span class="cs-hero-por"><b>${x.nombre}</b> · ${x.que}</span>` : html`<span class="cs-sd">${SIN_DATOS}: el Diagnóstico no marcó la capacidad</span>`}`;
}

// El hero: alcance, y (con alcance abierto) la etapa de Hormozi, LA restricción y la capacidad del último Diagnóstico aprobado.
function heroHtml({ slug, data, alc, abierto, items, falloEntregables }) {
  const [rotulo, cls] = ALCANCE[alc] || ALCANCE['sin-ficha'];
  const ruta = (id) => rutaHerramienta('consulting', slug, DIAGNOSTICO, id ? [encodeURIComponent(id)] : []);
  const ap = abierto ? diagnosticoAprobado(items) : null;
  let cuerpo = '';
  if (!abierto) cuerpo = html`<p class="cs-hero-por">Este plan no trae Consulting: no hay diagnóstico que mostrar.</p>`;
  else if (falloEntregables) cuerpo = html`<p class="cs-sd">${SIN_DATOS}: no pude leer los entregables de este cliente. Recarga la página.</p>`;
  else if (!ap) {
    const pendiente = items.filter((x) => x.tool === DIAGNOSTICO && !x.archivado).sort((a, z) => reciente(z).localeCompare(reciente(a)))[0];
    const etapaStrategy = data.etapa?.n != null ? etapaDe(data.etapa.n) : null;
    cuerpo = html`<p class="cs-sd">${SIN_DATOS}: sale del Diagnóstico de crecimiento</p>
      <p class="cs-hero-por">${pendiente ? `Hay un Diagnóstico ${pendiente.estado === 'En revisión' ? 'en revisión' : 'en borrador'}: se lee aquí cuando se apruebe.` : 'Todavía no hay uno. Con él salen la etapa, la restricción y la capacidad.'}</p>
      ${etapaStrategy ? html`<p class="cs-hero-ref">Strategy ubicó la etapa: ${etapaLabel(etapaStrategy)}${data.etapa?.confirmada ? '' : ' · propuesta'}.</p>` : ''}
      <a class="btn sm" href="${ruta(pendiente?.id)}">${ico('chart-pie', 14)} ${pendiente ? 'Abrir el Diagnóstico' : 'Empezar el Diagnóstico'}</a>`;
  } else {
    const { doc, c } = ap, e = c.etapa, r = c.restriccion;
    const et = e.n != null ? ETAPAS_HORMOZI.find((x) => x.n === e.n) : null;
    const etapaTxt = et ? `Etapa ${et.n} · ${et.nombre}` : e.entre ? `Entre las etapas ${e.entre[0]} y ${e.entre[1]}` : '';
    cuerpo = html`<div class="cs-hero-g">
      <div class="cs-hero-c" data-k="etapa"><span class="lbl">Etapa de Hormozi</span>${etapaTxt ? html`<b class="cs-hero-v">${etapaTxt}</b>${e.por_que ? html`<span class="cs-hero-por">${e.por_que}</span>` : ''}` : html`<span class="cs-sd">${SIN_DATOS}: el Diagnóstico no ubicó la etapa${e.falta ? ` · falta ${e.falta}` : ''}</span>`}</div>
      <div class="cs-hero-c" data-k="restriccion"><span class="lbl">La restricción</span>${r.funcion ? html`<b class="cs-hero-v">${r.funcion.charAt(0).toUpperCase() + r.funcion.slice(1)}</b>${r.por_que ? html`<span class="cs-hero-por">${r.por_que}</span>` : ''}` : html`<span class="cs-sd">${SIN_DATOS}: el Diagnóstico no la marcó</span>`}</div>
      <div class="cs-hero-c" data-k="capacidad"><span class="lbl">Capacidad vs demanda</span>${medidor(c.capacidad)}</div>
    </div>
    ${c.capacidad === 'rojo' ? html`<p class="cs-alto" role="status">${ico('alert', 14)} No subir demanda todavía</p>` : ''}
    <p class="cs-hero-src">Del <a href="${ruta(doc.id)}">Diagnóstico de crecimiento</a> v${doc.aprobado?.version ?? doc.version}${doc.aprobado?.en ? `, aprobado el ${fdate(doc.aprobado.en)}` : ''}.</p>`;
  }
  return html`<section class="cs-hero" data-alc="${alc}" data-cap="${ap ? ap.c.capacidad : ''}"><div class="cs-hero-top"><h2>Dónde está hoy</h2><span class="cs-alc ${cls}">${rotulo}</span></div>${cuerpo}</section>`;
}

// Los 5 entregables más recientes del cliente en Consulting, cada uno con su herramienta, su estado y su versión.
function entregablesHtml({ slug, items, falloEntregables }) {
  const xs = items.filter((d) => !d.archivado && d.tool).sort((a, z) => reciente(z).localeCompare(reciente(a))).slice(0, 5);
  const cuerpo = falloEntregables ? html`<div class="cs-vacio">${ico('alert', 16)}<span>No pude leer los entregables. Recarga la página.</span></div>`
    : xs.length ? html`<ul class="cs-ents">${xs.map((d) => {
      const h = herramientaDe(d.tool), nombre = h?.nombre || d.tool, f = reciente(d);
      return html`<li class="cs-ent"><a href="${rutaHerramienta('consulting', slug, d.tool, [encodeURIComponent(d.id)])}"><span class="cs-ent-t"><b>${nombre}</b>${d.titulo && d.titulo !== nombre ? html`<small>${d.titulo}</small>` : ''}</span>
        <span class="chip sm2 cs-ent-e" data-estado="${d.estado || 'Borrador'}">${d.estado || 'Borrador'}</span><span class="cs-ent-v mut sm">v${d.version || 1}${f ? ` · ${fdate(f)}` : ''}</span>${ico('right', 14)}</a></li>`;
    })}</ul>`
      : html`<div class="cs-vacio">${ico('chart-pie', 16)}<span>Todavía no hay entregables de Consulting. <a href="${rutaHerramienta('consulting', slug, DIAGNOSTICO)}">Empieza por el Diagnóstico de crecimiento</a>.</span></div>`;
  return html`<section class="cs-sec"><div class="cs-sec-h"><h2>Entregables recientes</h2><span class="mut sm">Lo último de cada herramienta, con su estado</span></div>${cuerpo}</section>`;
}

// El detalle de un cliente: el hero de Consulting, los encargos de Estrategia y los entregables recientes.
// cabecera:false lo pinta sin su cabecera (el workspace ya trae el hero del cliente). entregables: la lectura de /api/entregables
// (una promesa, null si falló) que el workspace ya hizo para sus tarjetas; sin ella, se lee aquí.
export async function consultingOverview(el, { me, slug, alive, cabecera = true, entregables }) {
  mount(el, html`<p class="loading">Cargando…</p>`);
  const [, tareas] = await Promise.all([loadEstrategia(), verTareas(me) ? col('tasks').list().catch(() => []) : []]);
  if (!alive() || !el.isConnected) return;
  const c = clientes().find((x) => x.slug === slug);
  if (!c) return mount(el, html`<div class="cs">${vacio({ icono: 'inbox', titulo: 'No encontré ese cliente en Estrategia', linea: `${slug === 'inherent' ? 'Inherent no es cliente de Consulting: su operación y sus finanzas viven en Organización.' : 'Puede que no esté en tu alcance o que todavía no tenga estrategia.'}` })}</div>`);
  // La estrategia y los entregables se leen a la vez; sin los entregables el hero dice SIN DATOS, no 0.
  const [data, ents] = await Promise.all([
    datosEstrategia(slug).catch(() => ({ nombre: c.nombre, nivel: c.nivel })),
    entregables || api(`entregables?ws=consulting&slug=${encodeURIComponent(slug)}`).catch(() => null),
  ]);
  if (!alive() || !el.isConnected) return;
  let enc = encargosDe(tareas, 'consulting', slug);
  // Con un nivel que no trae Consulting, los encargos no se trabajan: se escalan al CEO.
  const alc = alcanceConsulting(data.nivel, data.ficha), abierto = consultingAbierto(alc);
  const items = Array.isArray(ents?.items) ? ents.items : [], falloEntregables = abierto && !ents;

  const encargoHtml = (t) => html`<div class="cs-enc ${t.status === 'Hecha' ? 'hecho' : ''}"><span class="cs-enc-i">${ico(t.status === 'Hecha' ? 'check' : 'send', 14)}</span>
    <div class="cs-enc-t"><b>${t.title}</b><small>${t.status || 'Por empezar'}${t.due ? ` · vence ${fdate(t.due)}` : ''}${t.description ? ` · ${String(t.description).split('\n\n')[0]}` : ''}</small></div>
    ${t.status === 'Hecha' ? '' : !abierto ? html`<span class="cs-alc fuera">Fuera del alcance · escálalo al CEO</span>` : html`<button type="button" class="btn sm" data-c="hacer" data-id="${t.id}">${ico('chat-ia', 14)} Hacerlo en el Chat</button><button type="button" class="btn ghost sm" data-c="hecha" data-id="${t.id}">Hecha</button>`}</div>`;
  const pintar = () => mount(el, html`<div class="cs">
    ${cabecera ? html`<header class="cs-head"><span class="cs-mono">${initials(data.nombre || c.nombre)}</span><div><h1>${data.nombre || c.nombre}</h1><p>${data.nivel?.nombre || 'Sin ficha de oferta'} · operaciones, finanzas y equipo</p></div>
      <a class="btn ghost sm" href="#/ws/strategy/${esc(slug)}/overview">${ico('target', 14)} Su estrategia</a></header>` : ''}
    ${avisoConsulting(data.nivel, data.ficha)}
    ${heroHtml({ slug, data, alc, abierto, items, falloEntregables })}
    <section class="cs-sec"><div class="cs-sec-h"><h2>Encargos de Estrategia</h2><span class="mut sm">Lo que la estrategia pide que se haga aquí</span></div>
      ${!verTareas(me) ? html`<p class="mut sm">Los encargos viven en las tareas y tu perfil no las ve. Pídele al CEO que te abra Mis tareas.</p>` : enc.length ? html`<div class="cs-encs">${enc.map(encargoHtml)}</div>`
      : html`<div class="cs-vacio">${ico('send', 16)}<span>Cuando Estrategia mande algo (por ejemplo, «Crear el BMC de la empresa»), aparece aquí y en Mis tareas.</span></div>`}</section>
    ${abierto ? entregablesHtml({ slug, items, falloEntregables }) : ''}</div>`);
  pintar();

  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    const t = enc.find((x) => x.id === b.dataset.id); if (!t) return;
    if (b.dataset.c === 'hacer') return abierto && alChat(me, slug, pedidoDeEncargo(t));
    if (b.dataset.c === 'hecha') {
      try { const n = await col('tasks').save({ ...t, status: 'Hecha' }); enc = encargosDe(enc.map((x) => (x.id === t.id ? { ...t, ...n, status: 'Hecha' } : x)), 'consulting', slug); toast('Encargo hecho'); pintar(); }
      catch (er) { toast(er.status === 403 ? 'Tu perfil no puede cambiar tareas' : er.message, true); }
    }
  });
}

// Todos los clientes: su nivel (si trae Operations OS y Money OS) y cuántos encargos tiene abiertos.
function lista(el, me, tareas) {
  const cs = clientes();
  mount(el, html`<div class="cs">
    <header class="cs-head"><div><h1>Consulting</h1><p>El backend de cada cliente: <em>sus operaciones, sus finanzas y su equipo</em>.</p></div></header>
    ${cs.length ? html`<div class="cs-clientes">${cs.map((c) => {
      const [l, cls] = ALCANCE[alcanceConsulting(c.nivel)], n = encargosDe(tareas, 'consulting', c.slug).filter((t) => t.status !== 'Hecha').length;
      return html`<a class="cs-cliente" href="#/ws/consulting/${esc(c.slug)}/overview"><span class="cs-mono">${initials(c.nombre)}</span><span class="cs-cliente-t"><b>${c.nombre}</b><small class="cs-alc ${cls}">${l}</small></span>${n ? html`<span class="cs-n" title="Encargos de Estrategia abiertos">${n}</span>` : ''}${ico('right', 15)}</a>`;
    })}</div>` : html`${vacio({ icono: 'inbox', titulo: 'Aún no hay clientes que veas en Estrategia', linea: 'Cuando un cliente tenga su estrategia y tu perfil la vea, aparece aquí.' })}`}
    <p class="mut sm cs-pie">Operations OS y Money OS son de Growth Partnership. Las finanzas de Inherent están en Organización → Finanzas.</p></div>`);
}
