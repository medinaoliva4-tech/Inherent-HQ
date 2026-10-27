// Marca › Campañas › Campaign Architect (herramienta campaign-architect de Marketing). Sin Tool Shell: su casa es la colección mk_campaigns
// (api/_lib/campanas.js). Cada campaña con su frase, su fecha y su anticipación; al abrirla: el blueprint (frase, MBT, se nota, no es, ancla y
// hasta + la anticipación como un Gantt simple), el plan de canales (fases × canales: activar, fecha, pieza y monto —el monto solo para quien
// ve costos—), un brief creativo por celda activa (panel lateral), lo que pide Strategy de leads (solo lectura) y el canal Pauta ligado a una
// campaña de «campaigns». Guardar lleva la versión que se leyó (409 si alguien la cambió). «Enviar a Creative» crea el entregable de Creative
// Direction Lab con la campaña y sus briefs. «Generar con IA» propone el blueprint, los canales y los briefs: nada se guarda hasta que la persona
// los carga, los revisa y guarda. Nunca se escribe en una plataforma de anuncios: la pauta solo se liga y se pide a ⑩ Ads.
// Pinta con html`…` (todo se escapa; lo que dice un modelo pasa por limpiarCampana y nunca por raw()). Lo vacío dice «⚠️ SIN DATOS».
// Rutas: #/ws/marketing/<marca>/campaigns/campaign-architect[/<id de la campaña>]
import { html, raw, mount, api, col, toast, ico, fdate, wizard, initials, confirmAsk, ask, md, $ } from './core.js';
import { TIPOS_C, FASES_C, CANALES_C, NOMBRE_FASE_C, NOMBRE_CANAL_C, BLOQUE, tipoDe, anticipacion, revisarCampana, revisarMes, proximaFecha, limpiarCampana, idCampana, idBrief, ganttDe,
  canalesActivos, fechaDeFase, faltaParaCreative, contenidoParaCreative, resumenPlan, totalMontos, campanaDeEntrada, fusionarPropuesta, pedidoCampana } from './campanas.js';
import { abrirEnChat } from './areas.js';
import { herramientaDe, rutaHerramienta, rutaChat, veEstrategia } from './herramientas.js';
import { armarCtx, correrIA } from './ia-herramienta.js';
import { armarPrompt, SIN_DATOS } from './consulting/marcos.js';
import { leerTarjetas } from './llm/modos.js';

const enc = encodeURIComponent;
const hoyISO = () => new Date().toISOString().slice(0, 10);
const mesISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const clon = (x) => JSON.parse(JSON.stringify(x));
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const ICO_T = { evento: 'users', apertura: 'door-open', lanzamiento: 'rocket', promocion: 'tag', temporada: 'calendar-days', campana: 'target' };
const ICO_CANAL = { instagram: 'image', tiktok: 'music', pauta: 'megaphone', whatsapp: 'smartphone', email: 'mail', evento: 'users' };
const FORMATOS = ['reel', 'carrusel', 'story', 'post', 'video corto', 'anuncio', 'correo', 'mensaje de WhatsApp', 'invitación', 'activación en sitio'];
// De dónde sale cada dato cuando falta («⚠️ SIN DATOS: sale de …»).
const SD = {
  frase: 'la prueba de la frase de mk-campana: la que el equipo repite de memoria',
  mbt: 'la estrategia aprobada: la MUST BE TRUE que mueve, con su letra',
  se_nota: 'el objetivo del ciclo: el cambio que se ve al cierre',
  no_es: 'el malentendido más probable, escrito antes de que pase',
  ancla: 'la fecha del evento, la apertura o el lanzamiento',
};
const MAX_LEADS_VISTO = 6000;
// Lo que le falta a una campaña, para pintarlo: sin la línea «Blueprint incompleto» (cada pieza que falta ya sale suelta).
const faltasDe = (c) => revisarCampana(c, hoyISO()).filter((x) => !x.startsWith('Blueprint incompleto'));

// host: dónde se monta · me: quien mira · b: la marca ({ slug, name }) · alive(): ¿sigue en pantalla? · resto: lo que viene en la ruta (resto[0] = la campaña que se abre).
export async function campanasUI(el, { me, b, alive, resto = [] } = {}) {
  el.dataset.island = '1';
  mount(el, html`<p class="loading">Cargando…</p>`);
  const slug = b.slug;
  let d, team = [];
  try { [d, team] = await Promise.all([api(`campanas/${enc(slug)}`), col('team').list().catch(() => [])]); }
  catch (e) { return mount(el, html`<div class="empty"><b>No pude abrir las campañas</b>${e.message}</div>`); }
  if (!alive()) return;
  const gente = team.filter((p) => p.active !== false && p.kind !== 'ia');
  const nombreDe = (email) => gente.find((p) => (p.email || p.id) === email)?.name || email || '';
  let xs = d.campanas || [];
  const edit = Boolean(d.puede?.editar), costos = Boolean(d.puede?.costos), aprobada = Boolean(d.estrategia?.aprobada);
  // La herramienta del registro, con el pedido y el bloque de campanas.js: correrIA() los pide.
  const T = { id: 'campaign-architect', ws: 'marketing', nombre: 'Campaign Architect', ...herramientaDe('campaign-architect'), bloque: BLOQUE };
  // S: la campaña abierta (W es la copia de trabajo; key, lo guardado), la celda cuyo brief se escribe, la propuesta de la IA y lo que se lee aparte.
  const S = { id: null, W: null, key: '', sel: null, gen: null, ocupado: false, entr: null, entrItems: [], leads: undefined, pautas: undefined, creative: null, enviado: null };
  let root = null;

  // ---------- Lo que hay y lo que se puede hacer ----------
  const llave = (c) => JSON.stringify(limpiarCampana(c));
  const sucio = () => Boolean(S.W) && llave(S.W) !== S.key;
  const cerrada = () => ['Cerrada', 'Archivada'].includes(S.W?.estado);
  const editable = () => edit && aprobada && Boolean(S.W) && !cerrada();
  const puedeGuardar = () => edit && aprobada && Boolean(S.W) && S.W.estado !== 'Archivada';
  const ruta = (id) => { try { history.replaceState(null, '', rutaHerramienta('marketing', slug, 'campaign-architect', id ? [enc(id)] : [])); } catch {} };
  function tomar(c) { S.W = { ...c, ...limpiarCampana(c) }; S.key = llave(S.W); }
  const poner = (c) => { xs = [...xs.filter((x) => x.id !== c.id), c]; };
  function falla(e) {
    if (e?.name === 'AbortError') return;
    if (e?.status === 409 && e.code === 'CONFLICTO') return recargarAviso();
    toast(e?.message || 'No se pudo completar. Inténtalo de nuevo.', true);
  }
  // Alguien más cambió la campaña: se lee otra vez (lo que no guardaste se pierde, y se dice).
  async function recargarAviso() {
    if (!(await confirmAsk('Alguien cambió esta campaña mientras la editabas. ¿La recargo? Pierdes lo que no guardaste.')) || !alive()) return;
    try { const r = await api(`campanas/${enc(slug)}`); if (!alive()) return; xs = r.campanas || []; const c = xs.find((x) => x.id === S.id); if (!c) return lista(); tomar(c); S.sel = null; pintarTodo(); } catch (e) { toast(e.message, true); }
  }
  const haz = async (fn) => {
    if (S.ocupado) return;
    S.ocupado = true; if (S.W) pintarCab();
    try { await fn(); } catch (e) { if (alive()) falla(e); }
    if (!alive()) return;
    S.ocupado = false; if (S.W) pintarCab();
  };

  // =============================== La lista ===============================
  const linea = (c) => {
    const hoy = hoyISO(), prox = proximaFecha(c, hoy);
    return html`<ol class="cm-linea">${anticipacion(c).map((x) => html`<li class="${x.fecha < hoy ? 'paso' : x === prox ? 'prox' : ''}"><b>${fdate(x.fecha)}</b><span>${x.que}</span></li>`)}<li class="ancla ${c.ancla < hoy ? 'paso' : ''}"><b>${fdate(c.ancla)}</b><span>${c.tipo === 'evento' ? 'El evento' : 'La fecha'}</span></li></ol>`;
  };
  const tarjeta = (c) => {
    const [, tn] = tipoDe(c.tipo), falta = faltasDe(c), cer = c.estado === 'Cerrada' || c.estado === 'Archivada';
    return html`<article class="cm-card ${cer ? 'cerrada' : ''}" data-id="${c.id}">
      <header><span class="cm-tipo">${ico(ICO_T[c.tipo] || 'target', 14)} ${tn}</span><span class="cm-est">${c.estado}</span></header>
      <h3>${c.nombre}</h3>${c.frase ? html`<p class="cm-frase">«${c.frase}»</p>` : ''}
      ${c.ancla ? linea(c) : ''}
      <dl class="cm-dl">${c.mbt ? html`<div><dt>Mueve</dt><dd>${c.mbt}</dd></div>` : ''}${c.se_nota ? html`<div><dt>Se va a notar en</dt><dd>${c.se_nota}</dd></div>` : ''}${c.no_es ? html`<div><dt>Qué NO es</dt><dd>${c.no_es}</dd></div>` : ''}
        <div><dt>Plan</dt><dd>${resumenPlan(c)}</dd></div>
        ${c.evento ? html`${c.evento.objetivo ? html`<div><dt>Objetivo</dt><dd>${c.evento.objetivo}</dd></div>` : ''}${c.evento.lugar || c.evento.cupo ? html`<div><dt>Dónde</dt><dd>${[c.evento.lugar, c.evento.cupo ? `${c.evento.cupo} personas` : ''].filter(Boolean).join(' · ')}</dd></div>` : ''}${c.evento.proveedores ? html`<div><dt>Proveedores</dt><dd>${c.evento.proveedores}</dd></div>` : ''}${c.evento.medicion ? html`<div><dt>Se mide con</dt><dd>${c.evento.medicion}</dd></div>` : ''}` : ''}</dl>
      ${falta.length && !cer ? html`<ul class="cm-falta">${falta.map((f) => html`<li>${ico('alert', 12)} ${f}</li>`)}</ul>` : ''}
      <footer><span class="cm-resp">${c.responsable ? html`<i>${initials(nombreDe(c.responsable))}</i>${nombreDe(c.responsable)}` : html`<span class="mut">Sin responsable</span>`}</span><span class="sp"></span>
        <button type="button" class="btn ghost xs" data-cm="chat">${ico('chat-ia', 13)} Trabajarla en el Chat</button>
        ${edit && c.estado !== 'Archivada' ? html`<button type="button" class="btn ghost xs" data-cm="estado" data-e="${cer ? 'En curso' : 'Cerrada'}">${cer ? 'Reabrir' : 'Cerrar'}</button><button type="button" class="btn ghost xs" data-cm="estado" data-e="Archivada" title="No se borra: se archiva">Archivar</button>` : ''}
        ${edit && c.estado === 'Archivada' ? html`<button type="button" class="btn ghost xs" data-cm="estado" data-e="En curso">Reabrir</button>` : ''}
        <button type="button" class="btn xs" data-cm="abrir">${ico('arrow-right', 13)} Abrir</button></footer></article>`;
  };
  // Lo que llegó de otra herramienta (los entregables de Campaign Architect en Borrador con entradas, p. ej. el de Offer Architect).
  const pendientes = () => { const usados = new Set(xs.map((c) => c.entregable_ref).filter(Boolean)); return (S.entr || []).filter((x) => !usados.has(x.item.id)); };
  const nomTool = (id) => herramientaDe(id)?.nombre || id;
  const entradasHtml = () => {
    const l = pendientes(); if (!l.length) return '';
    const puede = edit && aprobada;
    return html`<section class="cma-entradas"><h3>${ico('arrow-right', 14)} Llegó de otra herramienta</h3><p class="mut sm">Lo que mandó Strategy: crea la campaña con eso y sigue desde ahí.</p>
      <div class="cm-grid">${l.map(({ item, e, origen }) => { const pre = origen ? campanaDeEntrada({ tool: e.tool, titulo: origen.titulo, version: e.version, contenido: origen.contenido }) : null;
        return html`<article class="cm-card" data-ent="${item.id}"><header><span class="cm-tipo">${ico('layers', 14)} Viene de ${nomTool(e.tool)} v${e.version}</span><span class="cm-est">Borrador</span></header>
          <h3>${item.titulo || 'Campaña'}</h3>
          ${pre && (pre.oferta || pre.mensaje) ? html`<dl class="cm-dl">${pre.oferta ? html`<div><dt>Oferta</dt><dd>${pre.oferta}</dd></div>` : ''}${pre.mensaje ? html`<div><dt>Mensaje</dt><dd>${pre.mensaje}</dd></div>` : ''}</dl>`
            : html`<p class="cma-sd">${SIN_DATOS}: no pude leer lo que mandó ${nomTool(e.tool)} (sale de esa herramienta; tu perfil puede no verla). Puedes crear la campaña y llenarla a mano.</p>`}
          <footer><span class="sp"></span><button type="button" class="btn xs" data-cm="crear-entrada" ${puede ? '' : raw('disabled')} title="${puede ? '' : aprobada ? 'Tu perfil solo ve las campañas' : 'Primero el CEO aprueba la estrategia'}">${ico('plus', 13)} Crear campaña con esto</button></footer></article>`; })}</div></section>`;
  };
  function lista() {
    S.gen?.ctrl?.abort(); S.id = null; S.W = null; S.sel = null; S.gen = null; S.enviado = null; root = null; ruta('');
    const hoy = hoyISO(), activas = xs.filter((c) => c.estado !== 'Archivada' && c.estado !== 'Cerrada' && (c.hasta || c.ancla || '9999') >= hoy).sort((a, z) => (a.ancla || '9').localeCompare(z.ancla || '9'));
    const pasadas = xs.filter((c) => !activas.includes(c) && c.estado !== 'Archivada'), archivadas = xs.filter((c) => c.estado === 'Archivada');
    const m0 = mesISO(), m1 = mesISO(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)), avisoMes = revisarMes(xs, m0) || revisarMes(xs, m1);
    mount(el, html`<div class="cm">
      <div class="cm-top"><p class="mut">Una campaña es un empujón con fecha: una apertura, un lanzamiento, una temporada, una promoción o un evento. Una por ciclo, dos como máximo.</p><span class="sp"></span>
        <button type="button" class="btn ghost" data-cm="chat-nueva">${ico('chat-ia', 14)} Armarla en el Chat</button>${edit ? html`<button type="button" class="btn" data-cm="nueva" ${aprobada ? '' : raw('disabled')}>${ico('plus', 14)} Nueva</button>` : ''}</div>
      ${aprobada ? '' : html`<div class="cm-aviso">${ico('lock', 13)} Primero el CEO aprueba la estrategia de ${b.name}: sin estrategia aprobada no hay campañas.</div>`}
      ${avisoMes ? html`<div class="cm-aviso">${ico('alert', 13)} ${avisoMes}</div>` : ''}
      <div id="cma-entradas">${entradasHtml()}</div>
      ${activas.length ? html`<div class="cm-grid">${activas.map(tarjeta)}</div>` : html`<div class="empty">Todavía no hay campañas ni eventos por delante.</div>`}
      ${pasadas.length ? html`<h4 class="cm-h">Ya pasaron</h4><div class="cm-grid">${pasadas.map(tarjeta)}</div>` : ''}
      ${archivadas.length ? html`<details class="cm-arch"><summary>Archivadas · ${archivadas.length}</summary><div class="cm-grid">${archivadas.map(tarjeta)}</div></details>` : ''}</div>`);
  }
  async function cargarEntradas() {
    const r = await api(`entregables?ws=marketing&slug=${enc(slug)}&tool=campaign-architect`).catch(() => null); if (!alive()) return;
    const items = Array.isArray(r?.items) ? r.items.filter((i) => !i.archivado) : [];
    S.entrItems = items;
    const nuevos = items.filter((i) => i.estado === 'Borrador' && i.entradas?.length).slice(0, 5);
    S.entr = await Promise.all(nuevos.map(async (item) => { const e = item.entradas[0], origen = await api(`entregables/${enc(e.deliverable_id)}/versiones/${enc(e.version)}`).catch(() => null); return { item, e, origen }; }));
    if (!alive()) return;
    const box = $('#cma-entradas', el); if (box && !S.W) mount(box, entradasHtml());
  }

  // Nueva (o con lo que trae una entrada): con preguntas, como todo lo que se crea en el OS. Abre la campaña al terminar.
  async function preguntar(pre = {}) {
    const t = (x) => x.tipo;
    const a = await wizard('Nueva campaña o evento', [
      { k: 'tipo', q: '¿Qué es?', type: 'cards', req: true, opts: TIPOS_C.map(([k, n, av]) => ({ v: k, i: ico(ICO_T[k], 16), l: n, d: av ? `Primer aviso ${av} días antes` : 'Un ángulo sostenido durante el ciclo' })) },
      { k: 'nombre', q: '¿Cómo se llama?', sub: 'Corto e interno: así lo encuentran Creatividad y la pauta.', type: 'text', req: true, v: pre.nombre ?? '', ph: 'Apertura sucursal Cayalá' },
      { k: 'frase', q: 'La frase, en lenguaje de persona', sub: 'La que el equipo repite de memoria. ❌ «Awareness y consideración» · ✅ «Que sepan que abrimos los domingos»', type: 'text', req: true, v: pre.frase ?? '', ph: 'Que sepan que…' },
      { k: 'ancla', q: (x) => (t(x) === 'evento' ? '¿Qué día es el evento?' : t(x) === 'promocion' ? '¿Qué día empieza?' : '¿Cuál es la fecha?'), type: 'when', req: true },
      { k: 'hasta', q: '¿Hasta cuándo dura?', type: 'when', show: (x) => ['promocion', 'temporada', 'campana'].includes(t(x)) },
      { k: 'mbt', q: '¿Qué MUST BE TRUE mueve?', sub: 'Una, con su letra, de la estrategia aprobada. Si no traza a ninguna, es un tema, no una campaña.', type: 'text', ph: 'B · Que nos encuentren en Google Maps' },
      { k: 'se_nota', q: '¿En qué se va a notar al cierre?', type: 'text', ph: '+30 reservas el fin de semana de apertura' },
      { k: 'no_es', q: '¿Qué NO es?', sub: 'El malentendido más probable, escrito antes de que pase.', type: 'text', ph: 'No es una promoción de descuento' },
      { k: 'objetivo', q: '¿Cuál es el objetivo comercial del evento?', type: 'text', show: (x) => t(x) === 'evento' },
      { k: 'lugar', q: '¿Dónde es y para cuántas personas?', type: 'text', ph: 'Terraza zona 10 · 80', show: (x) => t(x) === 'evento' },
      { k: 'proveedores', q: '¿Qué proveedores hacen falta?', type: 'textarea', ph: 'Sonido, catering, fotografía…', show: (x) => t(x) === 'evento' },
      { k: 'medicion', q: '¿Cómo se mide?', type: 'text', ph: 'Asistentes, reservas, ventas del día', show: (x) => t(x) === 'evento' },
      { k: 'responsable', q: '¿Quién la lleva?', sub: 'La responsabilidad se asigna por campaña.', type: 'cards', opts: [{ v: '', i: '—', l: 'Después' }, ...gente.map((p) => ({ v: p.email || p.id, i: ico('user'), l: (p.email || p.id) === me.email ? `${p.name} (yo)` : p.name }))] },
    ], 'Crear');
    if (!a || !alive()) return;
    const yaId = idCampana(slug, String(a.nombre || '').trim().slice(0, 60)), ya = xs.find((x) => x.id === yaId);
    if (ya) { toast('Ya hay una campaña con ese nombre: la abro'); return abrir(ya.id); }
    const [lugar, cupo] = String(a.lugar || '').split('·').map((s) => s.trim());
    const datos = { ...a, ...(pre.notas ? { notas: pre.notas } : {}), ...(pre.entregable_ref ? { entregable_ref: pre.entregable_ref } : {}), ...(t(a) === 'evento' ? { evento: { objetivo: a.objetivo, lugar, cupo: +cupo || null, proveedores: a.proveedores, medicion: a.medicion } } : {}) };
    try {
      const r = await api(`campanas/${enc(slug)}`, { method: 'POST', body: { ...datos, estado: 'Borrador' } });
      poner(r.campana); toast('Campaña creada');
      if (alive()) abrir(r.campana.id);
    } catch (e) { falla(e); }
  }
  async function cambiarEstado(c, e) {
    if (S.W && S.id === c.id && sucio()) return toast('Guarda o descarta tus cambios primero.', true);
    try {
      const r = await api(`campanas/${enc(slug)}/${enc(c.id)}`, { method: 'PUT', body: { estado: e, v: c.v } });
      poner(r.campana); toast(`Campaña ${e.toLowerCase()}`);
      if (!alive()) return;
      if (S.W && S.id === c.id) { tomar(r.campana); pintarTodo(); } else lista();
    } catch (er) { falla(er); }
  }
  const chatDe = (c) => abrirEnChat(me.email, { modo: 'marketing', slug, borrador: `Trabajemos la campaña «${c.nombre}» (${tipoDe(c.tipo)[1].toLowerCase()}${c.ancla ? `, ${c.ancla}` : ''}). ${faltasDe(c).length ? `Le falta: ${faltasDe(c).join('; ')}.` : 'Revisemos sus piezas de anticipación.'}` });

  // =============================== La campaña abierta ===============================
  function abrir(id) {
    const c = xs.find((x) => x.id === id);
    if (!c) { toast('No encontré esa campaña', true); return lista(); }
    S.id = id; S.sel = null; S.gen = null; S.enviado = null; S.creative = null; tomar(c); ruta(id);
    mount(el, html`<div class="cm cma" id="cma"><div id="cma-cab"></div><div id="cma-aviso"></div><div id="cma-enviado"></div><div id="cma-gen"></div>
      <div class="cma-cuerpo"><div class="cma-main">
        <section class="cma-sec" id="cma-bp" aria-label="Blueprint"></section><section class="cma-sec" id="cma-gantt" aria-label="Anticipación"></section>
        <section class="cma-sec" id="cma-canales" aria-label="Plan de canales"></section><section class="cma-sec" id="cma-leads" aria-label="Lo que pide Strategy de leads"></section>
        <section class="cma-sec" id="cma-pauta" aria-label="Pauta"></section><section class="cma-sec" id="cma-res" aria-label="Resultados"></section></div>
        <aside class="cma-lado" id="cma-brief" aria-label="Brief creativo"></aside></div>
      <datalist id="cma-formatos">${FORMATOS.map((f) => html`<option value="${f}"></option>`)}</datalist></div>`);
    root = $('#cma', el);
    pintarTodo(); cargarLeads(); cargarPautas(); cargarCreative();
  }
  function pintarTodo() { pintarCab(); pintarAviso(); pintarEnviado(); pintarGen(); pintarBp(); pintarGantt(); pintarCanales(); pintarLeads(); pintarPauta(); pintarRes(); pintarBrief(); }
  // Algo cambió en lo que se escribe: se repintan las regiones que NO tienen campos (los campos no se tocan mientras se escribe).
  const cambio = () => { pintarCab(); pintarAviso(); pintarGantt(); };
  const R = (id) => $(`#cma-${id}`, root);

  function pintarCab() {
    const c = S.W, el_ = R('cab'); if (!el_) return;
    const [, tn] = tipoDe(c.tipo), su = sucio(), falta = faltaParaCreative(c), corriendo = S.gen?.fase === 'corriendo', ed = editable(), enviada = (S.creative || []).length > 0;
    const btn = (act, icono, txt, { primario = false, off = false, tip = '' } = {}) => html`<button type="button" class="btn ${primario ? '' : 'ghost'} sm" data-cma="${act}" title="${tip}" ${off || S.ocupado ? raw('disabled') : ''}>${ico(icono, 14)} ${txt}</button>`;
    const tipCreative = !aprobada ? 'Primero el CEO aprueba la estrategia' : su ? 'Guarda tus cambios: Creative recibe lo guardado' : falta.length ? `Para enviar a Creative falta: ${falta.join(' · ')}` : 'Crea el entregable de Creative Direction Lab con esta campaña y sus briefs';
    mount(el_, html`<header class="cma-cab" data-id="${c.id}"><div class="cma-cab-t"><button type="button" class="btn ghost xs" data-cma="lista">← Campañas</button>
      <h2>${ico(ICO_T[c.tipo] || 'target', 16)} ${c.nombre}</h2><span class="cm-tipo">${tn}</span><span class="cm-est">${c.estado}</span>
      ${su ? html`<span class="chip cma-sucio">Sin guardar</span>` : ''}${enviada ? html`<span class="chip" title="Ya hay un Borrador de Creative con esta campaña">Enviada a Creative</span>` : ''}</div>
      <div class="cma-acts">
        ${ed ? btn('generar', 'sparkles', 'Generar con IA', { primario: true, off: corriendo }) : ''}
        ${puedeGuardar() ? btn('guardar', 'check', 'Guardar', { off: !su, tip: su ? '' : 'No hay cambios que guardar' }) : ''}${puedeGuardar() && su ? btn('descartar', 'x', 'Descartar cambios') : ''}
        ${edit && c.estado !== 'Archivada' ? btn('creative', 'send', 'Enviar a Creative', { off: !aprobada || su || falta.length > 0, tip: tipCreative }) : ''}
        ${btn('chat', 'chat-ia', 'Trabajarla en el Chat')}
        ${edit && c.estado !== 'Archivada' ? html`<button type="button" class="btn ghost sm" data-cm="estado" data-e="${cerrada() ? 'En curso' : 'Cerrada'}" ${S.ocupado ? raw('disabled') : ''}>${cerrada() ? 'Reabrir' : 'Cerrar'}</button><button type="button" class="btn ghost sm" data-cm="estado" data-e="Archivada" title="No se borra: se archiva" ${S.ocupado ? raw('disabled') : ''}>Archivar</button>` : ''}
        ${edit && c.estado === 'Archivada' ? html`<button type="button" class="btn ghost sm" data-cm="estado" data-e="En curso">Reabrir</button>` : ''}</div></header>`);
  }
  function pintarAviso() {
    const el_ = R('aviso'); if (!el_) return;
    const c = S.W, falta = faltasDe(c), msg = !aprobada ? `Primero el CEO aprueba la estrategia de ${b.name}: sin ella la campaña es solo lectura.` : !edit ? 'Solo lectura: tu perfil ve la campaña, pero no la cambia.' : c.estado === 'Archivada' ? 'Archivada: reábrela para cambiarla.' : c.estado === 'Cerrada' ? 'Cerrada: reábrela para cambiarla. Los resultados sí se pueden anotar.' : '';
    mount(el_, html`${msg ? html`<div class="cm-aviso">${ico('lock', 13)} ${msg}</div>` : ''}${falta.length && !cerrada() ? html`<ul class="cm-falta cma-falta">${falta.map((f) => html`<li>${ico('alert', 12)} ${f}</li>`)}</ul>` : ''}`);
  }
  function pintarEnviado() {
    const el_ = R('enviado'); if (!el_) return;
    mount(el_, S.enviado ? html`<div class="cm-aviso cma-ok" role="status">${ico('check', 13)} Enviada a Creative. <a href="${S.enviado.href}">Abrir Creative Direction Lab ${ico('arrow-right', 12)}</a></div>` : '');
  }

  // ---------- El blueprint ----------
  function campo(ruta_, valor, o = {}) {
    const ed = editable(), v = valor ?? '';
    if (!ed) return html`<span class="cma-ro" data-vacio="${v ? 0 : 1}">${v ? (o.type === 'date' ? fdate(v) : v) : o.sd ? `${SIN_DATOS}: sale de ${o.sd}` : '—'}</span>`;
    if (o.area) return html`<textarea class="in" data-c="${ruta_}" rows="${o.filas || 2}" maxlength="${o.max || 400}" placeholder="${o.ph || ''}" aria-label="${o.label}">${v}</textarea>`;
    return html`<input class="in" type="${o.type || 'text'}" data-c="${ruta_}" value="${v}" ${o.max ? raw(`maxlength="${o.max}"`) : ''} ${o.type === 'number' ? raw('min="0" step="1"') : ''} placeholder="${o.ph || ''}" aria-label="${o.label}" autocomplete="off">`;
  }
  function pintarBp() {
    const el_ = R('bp'); if (!el_) return;
    const c = S.W, ed = editable(), ev = c.tipo === 'evento', ver = (k) => c[k] || '';
    const fila = (etq, ayuda, contenido, ancho = false) => html`<label class="cma-campo ${ancho ? 'ancho' : ''}"><span class="lbl">${etq}</span>${ayuda ? html`<span class="mut sm">${ayuda}</span>` : ''}${contenido}</label>`;
    mount(el_, html`<div class="cma-sec-h"><h3>${ico('file-text', 15)} Blueprint</h3><span class="mut sm">la frase, lo que mueve y cuándo</span></div>
      <div class="cma-bp">
        ${fila('Qué es', '', ed ? html`<select class="in" data-c="tipo" aria-label="Tipo de campaña">${TIPOS_C.map(([k, n]) => html`<option value="${k}" ${k === c.tipo ? raw('selected') : ''}>${n}</option>`)}</select>` : html`<span class="cma-ro">${tipoDe(c.tipo)[1]}</span>`)}
        ${fila(ev ? 'Día del evento' : 'La fecha', '', campo('ancla', c.ancla, { type: 'date', label: 'La fecha', sd: SD.ancla }))}
        ${['promocion', 'temporada', 'campana'].includes(c.tipo) || c.hasta ? fila('Hasta cuándo', '', campo('hasta', c.hasta, { type: 'date', label: 'Hasta cuándo' })) : ''}
        ${fila('La frase', 'En lenguaje de persona: la que el equipo repite de memoria', campo('frase', c.frase, { max: 160, label: 'La frase', sd: SD.frase, ph: 'Que sepan que…' }), true)}
        ${fila('MUST BE TRUE que mueve', 'Una, con su letra', campo('mbt', c.mbt, { max: 80, label: 'MUST BE TRUE', sd: SD.mbt, ph: 'B · Que nos encuentren en Google Maps' }), true)}
        ${fila('En qué se va a notar', 'El cambio que se ve al cierre', campo('se_nota', c.se_nota, { max: 200, label: 'En qué se va a notar', sd: SD.se_nota, ph: '+30 reservas el fin de semana' }), true)}
        ${fila('Qué NO es', 'El malentendido más probable', campo('no_es', c.no_es, { max: 200, label: 'Qué NO es', sd: SD.no_es, ph: 'No es una promoción de descuento' }), true)}
        ${fila('Quién la lleva', '', ed ? html`<select class="in" data-c="responsable" aria-label="Responsable"><option value="">Sin responsable</option>${gente.map((p) => html`<option value="${p.email || p.id}" ${(p.email || p.id) === c.responsable ? raw('selected') : ''}>${p.name}</option>`)}</select>` : html`<span class="cma-ro" data-vacio="${c.responsable ? 0 : 1}">${c.responsable ? nombreDe(c.responsable) : 'Sin responsable'}</span>`)}
        ${ev ? html`${fila('Objetivo comercial del evento', '', campo('evento.objetivo', c.evento?.objetivo, { max: 200, label: 'Objetivo del evento' }))}
          ${fila('Dónde', '', campo('evento.lugar', c.evento?.lugar, { max: 120, label: 'Lugar del evento', ph: 'Terraza zona 10' }))}${fila('Cupo', '', campo('evento.cupo', c.evento?.cupo, { type: 'number', label: 'Cupo del evento' }))}
          ${fila('Proveedores', '', campo('evento.proveedores', c.evento?.proveedores, { area: true, max: 300, label: 'Proveedores' }), true)}${fila('Cómo se mide', '', campo('evento.medicion', c.evento?.medicion, { max: 200, label: 'Cómo se mide' }))}` : ''}
        ${ed || ver('notas') ? fila('Notas', '', campo('notas', c.notas, { area: true, max: 600, label: 'Notas', ph: 'Lo que viene de otra herramienta, acuerdos, pendientes…' }), true) : ''}
      </div>`);
  }

  // ---------- La anticipación (Gantt simple) ----------
  function pintarGantt() {
    const el_ = R('gantt'); if (!el_) return;
    const c = S.W, g = ganttDe(c), hoy = hoyISO();
    const cab = html`<div class="cma-sec-h"><h3>${ico('calendar-days', 15)} Anticipación</h3><span class="mut sm">cuándo se avisa: lo que fija mk-campana según el tipo</span></div>`;
    if (!g) return mount(el_, html`${cab}<p class="cma-sd">${c.ancla ? 'Una campaña del ciclo no avisa con anticipación: sostiene un ángulo durante todo el ciclo.' : `${SIN_DATOS}: sin fecha no hay anticipación. Sale de la fecha de la campaña.`}</p>`);
    mount(el_, html`${cab}<div class="cma-gantt" role="group" aria-label="Anticipación de ${fdate(g.desde)} a ${fdate(g.hasta)}">
      <div class="cma-g-eje"><span>${fdate(g.desde)}</span><span>${fdate(g.hasta)}</span></div>
      ${g.filas.map((f) => html`<div class="cma-g-fila"><span class="cma-g-n">${f.nombre}</span>
        <div class="cma-g-pista"><i class="cma-g-barra" data-fase="${f.fase}" style="left:${f.izq}%;width:${f.ancho}%"></i>${f.pasos.map((p) => html`<b class="cma-g-marca ${p.fecha < hoy ? 'paso' : ''}" style="left:${p.pos}%" title="${p.que} · ${fdate(p.fecha)}"></b>`)}</div>
        <span class="cma-g-f">${fdate(f.ini)}${f.fin !== f.ini ? ` → ${fdate(f.fin)}` : ''}</span></div>`)}</div>${linea(c)}`);
  }

  // ---------- El plan de canales (canales × fases) ----------
  const celdaDe = (f, ca) => S.W.canales[f][ca];
  const briefDe = (f, ca) => S.W.briefs.find((x) => x.fase === f && x.canal === ca);
  const tieneBrief = (f, ca) => { const x = briefDe(f, ca); return Boolean(x && (x.objetivo || x.mensaje)); };
  function celdaHtml(f, ca) {
    const k = celdaDe(f, ca), ed = editable(), sel = S.sel?.fase === f && S.sel?.canal === ca, listo = tieneBrief(f, ca), at = `data-f="${f}" data-ca="${ca}"`;
    const nombre = `${NOMBRE_CANAL_C[ca]}, ${NOMBRE_FASE_C[f]}`;
    return html`<td class="cma-celda" data-activo="${k.activo ? 1 : 0}" data-sel="${sel ? 1 : 0}">
      <label class="cma-on"><input type="checkbox" data-k="activo" ${raw(at)} ${k.activo ? raw('checked') : ''} ${ed ? '' : raw('disabled')} aria-label="Activar ${nombre}"> <span>${k.activo ? 'Activo' : 'Activar'}</span></label>
      ${k.activo ? html`<div class="cma-celda-in">
        ${ed ? html`<input class="in" type="date" data-k="fecha" ${raw(at)} value="${k.fecha}" aria-label="Fecha de ${nombre}">` : html`<span class="cma-ro" data-vacio="${k.fecha ? 0 : 1}">${k.fecha ? fdate(k.fecha) : 'Sin fecha'}</span>`}
        ${ed ? html`<input class="in" type="text" data-k="pieza" ${raw(at)} value="${k.pieza}" maxlength="160" placeholder="Pieza o acción" aria-label="Pieza de ${nombre}" autocomplete="off">` : html`<span class="cma-ro" data-vacio="${k.pieza ? 0 : 1}">${k.pieza || 'Sin pieza'}</span>`}
        ${costos ? (ed ? html`<span class="cma-monto"><i aria-hidden="true">Q</i><input class="in" type="number" min="0" step="any" data-k="monto" ${raw(at)} value="${k.monto ?? ''}" placeholder="Monto" aria-label="Monto en quetzales de ${nombre}"></span>` : html`<span class="cma-ro" data-vacio="${k.monto === null ? 1 : 0}">${k.monto === null ? 'Sin monto' : `Q${k.monto.toLocaleString('en-US')}`}</span>`) : ''}
        <button type="button" class="btn ghost xs cma-bt" data-cma="brief" ${raw(at)} data-listo="${listo ? 1 : 0}" aria-pressed="${sel ? 'true' : 'false'}">${ico(listo ? 'check' : 'pencil', 12)} <span class="cma-bt-t">${listo ? 'Brief listo' : 'Escribir brief'}</span></button></div>` : ''}</td>`;
  }
  function pintarTotal() {
    const el_ = $('#cma-total', root); if (!el_) return;
    const t = totalMontos(S.W);
    mount(el_, !costos ? '' : t === null ? html`<span class="cma-sd">${SIN_DATOS}: el monto de cada celda lo pone quien ve presupuestos</span>` : html`<span>Total del plan: <b>Q${t.toLocaleString('en-US')}</b></span>`);
  }
  function pintarCanales() {
    const el_ = R('canales'); if (!el_) return;
    const c = S.W, n = canalesActivos(c).length;
    mount(el_, html`<div class="cma-sec-h"><h3>${ico('layers', 15)} Plan de canales</h3><span class="mut sm">qué se hace en cada canal y en cada fase${costos ? '' : ' · los montos los ve quien ve presupuestos'}</span></div>
      ${n ? '' : html`<p class="cma-sd">${SIN_DATOS}: enciende las celdas donde sí se va a avisar. Un canal entra solo si existe la cuenta, hay quien la opere y la ficha lo cubre (mk-canales).</p>`}
      <div class="cma-sc"><table class="cma-tabla" aria-label="Plan de canales por fase">
        <thead><tr><td><span class="sr-only">Canal</span></td>${FASES_C.map((f) => html`<th scope="col"><b>${NOMBRE_FASE_C[f]}</b><span class="mut sm">${fechaDeFase(c, f) ? fdate(fechaDeFase(c, f)) : ''}</span></th>`)}</tr></thead>
        <tbody>${CANALES_C.map((ca) => html`<tr data-canal="${ca}"><th scope="row"><span class="cma-canal">${ico(ICO_CANAL[ca], 14)} ${NOMBRE_CANAL_C[ca]}</span>${ca === 'pauta' && c.pauta_id ? html`<span class="chip sm2" title="Ligada a una campaña de pauta">Ligada</span>` : ''}</th>${FASES_C.map((f) => celdaHtml(f, ca))}</tr>`)}</tbody></table></div>
      <p class="cma-total" id="cma-total"></p>`);
    pintarTotal();
  }

  // ---------- El brief de la celda (panel lateral) ----------
  function pintarBrief() {
    const el_ = R('brief'); if (!el_) return;
    const act = canalesActivos(S.W), ed = editable(), s = S.sel;
    if (s && !celdaDe(s.fase, s.canal)?.activo) S.sel = null;
    if (!S.sel) {
      return mount(el_, html`<h3>${ico('pencil', 15)} Briefs creativos</h3><p class="mut sm">Un brief por cada celda activa: lo que Creative necesita para pensar la pieza.</p>
        ${act.length ? html`<ul class="cma-lado-l">${act.map(({ fase, canal }) => { const listo = tieneBrief(fase, canal);
          return html`<li><button type="button" class="cma-lado-r" data-cma="brief" data-f="${fase}" data-ca="${canal}" data-listo="${listo ? 1 : 0}"><span class="cma-lado-n">${ico(ICO_CANAL[canal], 14)} ${NOMBRE_CANAL_C[canal]} · ${NOMBRE_FASE_C[fase]}</span><span class="cma-lado-e">${listo ? 'Listo' : 'Sin brief'}</span></button></li>`; })}</ul>`
          : html`<p class="cma-sd">${SIN_DATOS}: sin celdas activas no hay briefs. Salen del plan de canales.</p>`}`);
    }
    const { fase, canal } = S.sel, k = celdaDe(fase, canal), x = briefDe(fase, canal) || {};
    const area = (clave, etq, max, filas = 3, ph = '') => html`<label class="cma-campo"><span class="lbl">${etq}</span>${ed ? html`<textarea class="in" data-bf="${clave}" rows="${filas}" maxlength="${max}" placeholder="${ph}" aria-label="${etq}">${x[clave] || ''}</textarea>` : html`<span class="cma-ro" data-vacio="${x[clave] ? 0 : 1}">${x[clave] || '—'}</span>`}</label>`;
    mount(el_, html`<div class="cma-lado-cab"><button type="button" class="btn ghost xs" data-cma="brief-cerrar">← Todos</button><h3>${ico(ICO_CANAL[canal], 15)} ${NOMBRE_CANAL_C[canal]} · ${NOMBRE_FASE_C[fase]}</h3></div>
      <p class="mut sm">${[k.fecha ? fdate(k.fecha) : '', k.pieza].filter(Boolean).join(' · ') || 'Esta celda todavía no tiene fecha ni pieza'}</p>
      ${area('objetivo', 'Objetivo', 200, 2, 'Qué cambia en quien lo ve')}${area('mensaje', 'Mensaje', 400, 3, 'Una frase')}
      <label class="cma-campo"><span class="lbl">Formato</span>${ed ? html`<input class="in" type="text" data-bf="formato" list="cma-formatos" maxlength="80" value="${x.formato || ''}" placeholder="reel, carrusel, story…" aria-label="Formato" autocomplete="off">` : html`<span class="cma-ro" data-vacio="${x.formato ? 0 : 1}">${x.formato || '—'}</span>`}</label>
      <label class="cma-campo"><span class="lbl">Llamada a la acción</span>${ed ? html`<input class="in" type="text" data-bf="cta" maxlength="120" value="${x.cta || ''}" placeholder="Escríbenos por WhatsApp" aria-label="Llamada a la acción" autocomplete="off">` : html`<span class="cma-ro" data-vacio="${x.cta ? 0 : 1}">${x.cta || '—'}</span>`}</label>
      <p class="mut sm">Creative recibe los briefs de las celdas activas que tengan objetivo o mensaje.</p>`);
  }
  function marcarBrief(f, ca) {
    const listo = tieneBrief(f, ca);
    for (const bt of root.querySelectorAll(`.cma-bt[data-f="${f}"][data-ca="${ca}"]`)) { bt.dataset.listo = listo ? '1' : '0'; const t = $('.cma-bt-t', bt); if (t) t.textContent = listo ? 'Brief listo' : 'Escribir brief'; }
  }

  // ---------- Lo que pide Strategy de leads (solo lectura) ----------
  async function cargarLeads() {
    if (S.leads !== undefined) return;
    if (!veEstrategia(me)) { S.leads = { sinAcceso: true }; return pintarLeads(); }
    S.leads = 'cargando'; pintarLeads();
    try {
      const e = await api(`estrategia/${enc(slug)}`), bl = (e.bloques || []).find((x) => x.id === 'leads');
      S.leads = { texto: String(bl?.borrador?.texto || '').trim(), por: bl?.borrador?.por || '', en: bl?.borrador?.en || '', estado: bl?.estado || '', limite: bl?.limite || null };
    } catch (er) { S.leads = { error: er.status === 403 || er.status === 404 ? 'Tu perfil no ve la estrategia de esta marca.' : 'No pude leer la estrategia de esta marca.' }; }
    if (alive() && root) pintarLeads();
  }
  function pintarLeads() {
    const el_ = root && R('leads'); if (!el_) return;
    const L = S.leads, link = rutaChat(slug, 'leads');
    const cab = html`<div class="cma-sec-h"><h3>${ico('inbox', 15)} Lo que pide Strategy de leads</h3><span class="chip sm2">Solo lectura</span></div>`;
    if (L === undefined || L === 'cargando') return mount(el_, html`${cab}<p class="mut sm">Cargando…</p>`);
    if (L.sinAcceso) return mount(el_, html`${cab}<p class="cma-sd">Tu perfil no ve Estrategia. Lo que pide de leads lo cuenta quien la lleva.</p>`);
    if (L.error) return mount(el_, html`${cab}<p class="cma-sd">${L.error}</p>`);
    if (!L.texto) return mount(el_, html`${cab}<p class="cma-sd">${SIN_DATOS}: el bloque Leads de Strategy todavía no tiene borrador. Sale del Chat de Strategy (bloque Leads). <a href="${link}">Abrirlo ${ico('arrow-right', 12)}</a></p>`);
    const largo = L.texto.length > MAX_LEADS_VISTO;
    mount(el_, html`${cab}${L.limite ? html`<p class="mut sm">Con el nivel contratado: <b>${L.limite.titulo}</b>. ${L.limite.texto}</p>` : ''}
      <details class="cma-leads" open><summary>El borrador del bloque${L.estado === 'aprobado' ? ' · aprobado' : ''}</summary>${md(L.texto.slice(0, MAX_LEADS_VISTO))}${largo ? html`<p class="mut sm">Se corta aquí: el resto está en Strategy.</p>` : ''}</details>
      <p class="mut sm"><a href="${link}">Abrir en el Chat de Strategy ${ico('arrow-right', 12)}</a></p>`);
  }

  // ---------- El canal Pauta, ligado a una campaña de «campaigns» ----------
  async function cargarPautas() {
    if (S.pautas !== undefined) return;
    S.pautas = 'cargando';
    try { S.pautas = (await col('campaigns').list()).filter((p) => String(p.client_slug || '').toLowerCase() === String(slug).toLowerCase()); } catch { S.pautas = null; }
    if (alive() && root) pintarPauta();
  }
  function pintarPauta() {
    const el_ = root && R('pauta'); if (!el_) return;
    const c = S.W, P = S.pautas, ed = editable(), adsLink = '#/work/zona/ads';
    const cab = html`<div class="cma-sec-h"><h3>${ico('megaphone', 15)} Pauta</h3><span class="mut sm">la campaña de pauta que sostiene el canal Pauta</span></div>`;
    const nota = html`<p class="mut sm">Aquí solo se liga: la campaña de pauta la arma ⑩ Ads en <a href="${adsLink}">Mis tareas › Ads</a> y se lanza con el OK del CEO. Esta pantalla nunca escribe en Meta, Google ni TikTok.</p>`;
    if (P === undefined || P === 'cargando') return mount(el_, html`${cab}<p class="mut sm">Cargando…</p>`);
    if (P === null) return mount(el_, html`${cab}<p class="cma-sd">Tu perfil no ve la pauta de este cliente. ${c.pauta_id ? 'Esta campaña ya está ligada a una.' : 'Lo liga quien ve Mis tareas › Ads.'}</p>${nota}`);
    const otra = (p) => xs.find((x) => x.pauta_id === p.id && x.id !== c.id);
    mount(el_, html`${cab}${P.length ? html`<label class="cma-campo"><span class="lbl">Campaña de pauta ligada</span>
        ${ed ? html`<select class="in" data-c="pauta_id" aria-label="Campaña de pauta ligada"><option value="">Sin ligar</option>${P.map((p) => html`<option value="${p.id}" ${p.id === c.pauta_id ? raw('selected') : ''} ${otra(p) ? raw('disabled') : ''}>${[p.name, p.platform, p.status || 'Borrador'].filter(Boolean).join(' · ')}${otra(p) ? ` (ligada a «${otra(p).nombre}»)` : ''}</option>`)}</select>` : html`<span class="cma-ro" data-vacio="${c.pauta_id ? 0 : 1}">${P.find((p) => p.id === c.pauta_id)?.name || (c.pauta_id ? 'Una campaña de pauta' : 'Sin ligar')}</span>`}</label>
      <div id="cma-pauta-i"></div>`
      : html`<p class="cma-sd">${SIN_DATOS}: este cliente todavía no tiene campañas de pauta registradas. ⑩ Ads las anota en <a href="${adsLink}">Mis tareas › Ads</a>.</p>`}${nota}`);
    pintarPautaInfo();
  }
  function pintarPautaInfo() {
    const el_ = $('#cma-pauta-i', root); if (!el_) return;
    const p = (Array.isArray(S.pautas) ? S.pautas : []).find((x) => x.id === S.W.pauta_id);
    const activa = (canalesActivos(S.W).some((x) => x.canal === 'pauta')) && !S.W.pauta_id;
    mount(el_, p ? html`<dl class="cm-dl cma-pauta-d"><div><dt>Plataforma</dt><dd>${p.platform || '—'}</dd></div><div><dt>Estado</dt><dd>${p.status || 'Borrador'}</dd></div>
        <div><dt>Fechas</dt><dd>${p.from ? fdate(p.from) : '—'} → ${p.to ? fdate(p.to) : '—'}</dd></div>${costos ? html`<div><dt>Diario</dt><dd>${p.daily ? `Q${Number(p.daily).toLocaleString('en-US')}` : '—'}</dd></div>` : ''}</dl>
      <p class="mut sm"><a href="#/work/zona/ads">Ver en Mis tareas › Ads ${ico('arrow-right', 12)}</a></p>`
      : activa ? html`<p class="cma-sd">El canal Pauta está activo y no está ligado a una campaña de pauta.</p>` : '');
  }

  // ---------- Resultados (lo que dejó la campaña; solo se agregan) ----------
  function pintarRes() {
    const el_ = R('res'); if (!el_) return;
    const c = S.W, rs = c.resultados || [], puede = edit && aprobada && c.estado !== 'Archivada';
    mount(el_, html`<div class="cma-sec-h"><h3>${ico('list-checks', 15)} Resultados</h3><span class="mut sm">lo que dejó la campaña; solo se agregan</span></div>
      ${rs.length ? html`<ul class="cma-res">${rs.map((r) => html`<li><b>${r.metrica}</b><span>${r.valor || '—'}</span>${r.nota ? html`<span class="mut sm">${r.nota}</span>` : ''}<span class="mut sm">${r.en ? fdate(r.en) : ''}</span></li>`)}</ul>` : html`<p class="cma-sd">${SIN_DATOS}: los resultados salen de lo que se mide al cierre (reservas, asistentes, leads…).</p>`}
      ${puede ? html`<button type="button" class="btn ghost xs" data-cma="resultado">${ico('plus', 13)} Anotar un resultado</button>` : ''}`);
  }
  async function anotarResultado() {
    const v = await ask('Anotar un resultado', [{ k: 'metrica', l: 'Qué se midió', req: true }, { k: 'valor', l: 'Cuánto', half: true }, { k: 'nota', l: 'Nota', half: true }], 'Anotar');
    if (!v || !alive() || !S.W) return;
    S.W.resultados = [...(S.W.resultados || []), { en: new Date().toISOString(), metrica: v.metrica, valor: v.valor || '', nota: v.nota || '' }];
    pintarRes(); cambio(); toast('Anotado: presiona Guardar para dejarlo en la campaña');
  }

  // ---------- Editar: campos, celdas y briefs ----------
  const ponerRuta = (obj, r, v) => { const p = r.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) o = o[k] && typeof o[k] === 'object' ? o[k] : (o[k] = {}); o[ultimo] = v; };
  function enCampo(t, tipo) {
    if (!S.W || !editable()) return;
    const c = t.dataset.c, k = t.dataset.k, bf = t.dataset.bf;
    if (c) {
      ponerRuta(S.W, c, t.value);
      if (c === 'tipo') { pintarBp(); $(`[data-c="tipo"]`, root)?.focus(); }
      if (c === 'pauta_id') pintarPautaInfo();
      if (c === 'ancla' || c === 'tipo' || c === 'hasta') pintarCanales();
      return cambio();
    }
    if (k) {
      const f = t.dataset.f, ca = t.dataset.ca, x = celdaDe(f, ca); if (!x) return;
      if (k === 'activo') {
        if (tipo !== 'change') return;
        x.activo = t.checked;
        if (x.activo && !x.fecha) x.fecha = fechaDeFase(S.W, f);
        if (!x.activo && S.sel?.fase === f && S.sel?.canal === ca) S.sel = null;
        pintarCanales(); pintarBrief(); cambio();
        return root.querySelector(`[data-k="activo"][data-f="${f}"][data-ca="${ca}"]`)?.focus();
      }
      x[k] = k === 'monto' ? (t.value === '' || !Number.isFinite(Number(t.value)) ? null : Number(t.value)) : t.value;
      if (k === 'monto') pintarTotal();
      return cambio();
    }
    if (bf && S.sel) {
      const { fase, canal } = S.sel; let x = briefDe(fase, canal);
      if (!x) { x = { id: idBrief(fase, canal), fase, canal, objetivo: '', mensaje: '', formato: '', cta: '' }; S.W.briefs.push(x); }
      x[bf] = t.value;
      if (!x.objetivo && !x.mensaje && !x.formato && !x.cta) S.W.briefs = S.W.briefs.filter((y) => y !== x);
      marcarBrief(fase, canal); return cambio();
    }
  }
  const verBrief = (f, ca) => { S.sel = { fase: f, canal: ca }; pintarCanales(); pintarBrief(); root.querySelector('#cma-brief')?.scrollIntoView?.({ block: 'nearest' }); $('[data-bf="objetivo"]', root)?.focus(); };

  // ---------- Guardar, descartar y enviar a Creative ----------
  async function guardar() {
    if (!puedeGuardar() || !sucio()) return;
    const W = S.W, r = await api(`campanas/${enc(slug)}/${enc(W.id)}`, { method: 'PUT', body: { ...limpiarCampana(W), v: W.v } });
    if (!alive()) return;
    poner(r.campana); tomar(r.campana); pintarTodo(); toast('Campaña guardada');
  }
  function descartar() { const c = xs.find((x) => x.id === S.id); if (!c) return; tomar(c); S.sel = null; pintarTodo(); }
  async function cargarCreative(fresco = false) {
    if (S.creative !== null && !fresco) return;
    const r = await api(`entregables?ws=creative&slug=${enc(slug)}&tool=creative-direction-lab`).catch(() => null); if (!alive()) return;
    S.creative = (r?.items || []).filter((i) => !i.archivado && i.contenido?.campana?.id === S.id);
    if (root && !fresco) pintarCab();
  }
  async function enviarCreative() {
    const falta = faltaParaCreative(S.W);
    if (!aprobada) return toast('Primero el CEO aprueba la estrategia.', true);
    if (falta.length) return toast(`Para enviar a Creative falta: ${falta.join(' · ')}`, true);
    if (sucio()) return toast('Guarda los cambios antes de enviar: Creative recibe lo guardado.', true);
    await cargarCreative(true); if (!alive()) return;
    if (S.creative?.length && !(await confirmAsk(`Ya enviaste «${S.W.nombre}» a Creative. ¿La mando otra vez como un Borrador nuevo?`))) return;
    if (!alive()) return;
    const r = await api('entregables', { method: 'POST', body: { tool: 'creative-direction-lab', client_slug: slug, titulo: `Dirección creativa · ${S.W.nombre}`, contenido: contenidoParaCreative(S.W) } });
    if (!alive()) return;
    S.creative = [...(S.creative || []), r]; S.enviado = { href: rutaHerramienta('creative', slug, 'creative-direction-lab') };
    pintarCab(); pintarEnviado(); toast('Enviada a Creative');
  }

  // ---------- Generar con IA: la propuesta se revisa y se carga; nada se guarda hasta «Guardar» ----------
  // La carpeta de entradas de la campaña: las del entregable que la originó (las versiones aprobadas que lo alimentan).
  async function entradasDe(c) {
    if (!c.entregable_ref) return [];
    const item = S.entrItems.find((i) => i.id === c.entregable_ref) || await api(`entregables/${enc(c.entregable_ref)}`).catch(() => null);
    return Array.isArray(item?.entradas) ? item.entradas.slice(0, 10) : [];
  }
  function leerRespuesta(txt, { via, modelo }) {
    let prop = null;
    try {
      const t = leerTarjetas(txt), ps = t.campanas || [], p = ps.find((x) => fold(x.nombre) === fold(S.W.nombre)) || ps[0];
      if (p && (p.frase || p.briefs.length || canalesActivos(p).length)) prop = { campana: p, criterios: t.criterios || { cumple: [], falta: [] } };
    } catch { prop = null; }
    S.gen = prop ? { fase: 'propuesta', prop, via, modelo } : { fase: 'sin-bloque', texto: txt, via, modelo };
  }
  async function generar(preferir) {
    if (!editable() || S.gen?.fase === 'corriendo') return;
    const ctrl = new AbortController(), mio = () => S.gen?.ctrl === ctrl;
    S.gen = { fase: 'corriendo', texto: '', paso: '', ctrl };
    pintarGen(); pintarCab();
    try {
      const entradas = await entradasDe(S.W); if (!alive() || !mio()) return;
      await cargarLeads();
      const base = clon(limpiarCampana(S.W)), leads = S.leads && typeof S.leads === 'object' ? S.leads.texto || '' : '';
      const tool = { ...T, prompt: (c) => armarPrompt(pedidoCampana({ ...base, nombre: S.W.nombre }, { leads, entradas: c.entradas }), c) };
      const ctx = await armarCtx(me, { tool, slug, entradas }); if (!alive() || !mio()) return;
      const out = await correrIA(me, { tool, ctx, signal: ctrl.signal, preferir,
        onDelta: (t) => { if (!alive()) return ctrl.abort(); if (mio()) { S.gen.texto = t; verStream(); } },
        onTool: (p) => { if (mio()) { S.gen.paso = String(p || ''); verPaso(); } } });
      if (!alive() || !mio()) return;
      leerRespuesta(out.texto, out);
    } catch (e) {
      if (!alive() || !mio()) return;
      S.gen = e?.name === 'AbortError' || ctrl.signal.aborted ? null : { fase: 'error', error: e?.message || 'La IA no pudo responder' };
    }
    pintarGen(); pintarCab();
  }
  async function pegar() {
    const v = await ask('Pegar la respuesta', [{ k: 't', t: 'textarea', req: true, l: `Pega la respuesta completa de la IA, con su bloque ${BLOQUE}.` }], 'Leer');
    if (!v || !alive() || !S.W) return;
    leerRespuesta(v.t, { via: 'manual', modelo: '' });
    pintarGen(); pintarCab();
  }
  async function usar(blueprint) {
    const g = S.gen; if (g?.fase !== 'propuesta' || !editable()) return;
    if ((canalesActivos(S.W).length || S.W.briefs.length) && !(await confirmAsk('Esto reemplaza el plan de canales de la pantalla (los montos se quedan) y los briefs de las celdas que la propuesta toca. Nada se guarda hasta que presiones Guardar. ¿Continuar?'))) return;
    if (!alive() || !S.W) return;
    S.W = fusionarPropuesta(S.W, g.prop.campana, { blueprint });
    S.gen = null; S.sel = null; pintarTodo(); toast('Cargué la propuesta. Revísala y guarda.');
  }
  const verStream = () => { const pre = $('.cma-stream', root); if (pre && S.gen) { pre.textContent = S.gen.texto || ''; pre.scrollTop = pre.scrollHeight; } };
  const verPaso = () => { const p = $('.cma-paso', root); if (p && S.gen) p.textContent = S.gen.paso || ''; };
  function pintarGen() {
    const g = S.gen, el_ = root && R('gen'); if (!el_) return;
    if (!g) return mount(el_, '');
    const otros = html`<button type="button" class="btn ghost sm" data-cma="gen-claude">${ico('refresh-cw', 14)} Probar con claude.ai</button><button type="button" class="btn ghost sm" data-cma="gen-pegar">Pegar la respuesta</button><button type="button" class="btn ghost sm" data-cma="gen-cerrar">${ico('x', 14)} Cerrar</button>`;
    if (g.fase === 'corriendo') {
      mount(el_, html`<section class="cma-gen" data-fase="corriendo"><header><span class="cma-gen-t">${ico('loader-circle', 14)} Generando con IA…</span><span class="mut sm cma-paso"></span><button type="button" class="btn ghost sm" data-cma="gen-parar">${ico('stop-lleno', 12)} Parar</button></header><pre class="cma-stream" aria-live="polite"></pre></section>`);
      verStream(); verPaso(); return;
    }
    if (g.fase === 'propuesta') {
      const c = g.prop.campana, cr = g.prop.criterios || { cumple: [], falta: [] }, act = canalesActivos(c), conBp = Boolean(S.W.frase || S.W.mbt || S.W.se_nota || S.W.no_es);
      mount(el_, html`<section class="cma-prop" data-fase="propuesta"><header><h3>${ico('sparkles', 14)} Propuesta de la IA</h3><span class="mut sm">${g.via === 'manual' ? 'Pegada a mano' : g.modelo || g.via}</span></header>
        <dl class="cm-dl">${c.frase ? html`<div><dt>La frase</dt><dd>${c.frase}</dd></div>` : ''}${c.mbt ? html`<div><dt>Mueve</dt><dd>${c.mbt}</dd></div>` : ''}${c.se_nota ? html`<div><dt>Se nota en</dt><dd>${c.se_nota}</dd></div>` : ''}${c.no_es ? html`<div><dt>Qué NO es</dt><dd>${c.no_es}</dd></div>` : ''}
          <div><dt>Canales</dt><dd>${act.length ? act.map(({ fase, canal, celda }) => `${NOMBRE_CANAL_C[canal]} · ${NOMBRE_FASE_C[fase]}${celda.pieza ? ` (${celda.pieza})` : ''}`).join(' — ') : 'Ninguno encendido'}</dd></div>
          <div><dt>Briefs</dt><dd>${plural(c.briefs.length, 'brief', 'briefs')}</dd></div></dl>
        ${c.briefs.length ? html`<details class="cma-prop-d"><summary>Ver los briefs</summary><ul class="cma-prop-l">${c.briefs.map((x) => html`<li><b>${NOMBRE_CANAL_C[x.canal]} · ${NOMBRE_FASE_C[x.fase]}</b> ${x.objetivo}${x.mensaje ? ` — ${x.mensaje}` : ''}${x.formato ? html` <span class="mut sm">(${x.formato})</span>` : ''}</li>`)}</ul></details>` : ''}
        ${(cr.cumple || []).length + (cr.falta || []).length ? html`<ul class="cma-crit">${(cr.cumple || []).map((x) => html`<li class="ok"><span aria-hidden="true">✓</span><span class="sr-only">Cumple: </span>${x}</li>`)}${(cr.falta || []).map((x) => html`<li class="falta"><span aria-hidden="true">✗</span><span class="sr-only">Falta: </span>${x}</li>`)}</ul>` : ''}
        <p class="mut sm">Nada se guarda hasta que presiones Guardar. Los montos y las fechas de la campaña no cambian.</p>
        <div class="cma-prop-bt"><button type="button" class="btn sm" data-cma="gen-usar">${ico('check', 14)} Cargar ${conBp ? 'todo' : 'en la campaña'}</button>${conBp ? html`<button type="button" class="btn ghost sm" data-cma="gen-usar-canales">Solo canales y briefs</button>` : ''}<button type="button" class="btn ghost sm" data-cma="gen-reintentar">${ico('refresh-cw', 14)} Reintentar</button><button type="button" class="btn ghost sm" data-cma="gen-cerrar">Descartar</button></div></section>`);
      return;
    }
    mount(el_, html`<section class="cma-gen" data-fase="${g.fase}" role="alert"><p>${g.fase === 'error' ? g.error : 'No vino el bloque de la campaña con su frase, canales o briefs. Reintenta o pega la respuesta.'}</p>
      ${g.fase === 'sin-bloque' && g.texto ? html`<details><summary>Ver lo que respondió</summary><pre class="cma-stream">${g.texto}</pre></details>` : ''}
      <div class="cma-prop-bt"><button type="button" class="btn sm" data-cma="gen-reintentar">${ico('refresh-cw', 14)} Reintentar</button>${otros}</div></section>`);
  }

  // =============================== Eventos ===============================
  el.onclick = async (e) => {
    const t = e.target.closest('[data-cm],[data-cma]'); if (!t || !el.contains(t)) return;
    const k = t.dataset.cm || t.dataset.cma, id = t.closest('[data-id]')?.dataset.id, c = xs.find((x) => x.id === id);
    if (t.dataset.cm) {
      if (k === 'nueva') return preguntar();
      if (k === 'abrir' && c) return abrir(c.id);
      if (k === 'chat-nueva') return abrirEnChat(me.email, { modo: 'marketing', slug, borrador: `Armemos la próxima campaña de ${b.name}: ¿es campaña o pilar?, su frase, la MUST BE TRUE que mueve y cuándo se avisa.` });
      if (k === 'chat' && c) return chatDe(c);
      if (k === 'estado' && c) return cambiarEstado(c, t.dataset.e);
      if (k === 'crear-entrada') {
        const x = (S.entr || []).find((y) => y.item.id === t.closest('[data-ent]')?.dataset.ent); if (!x) return;
        const pre = campanaDeEntrada({ tool: x.e.tool, titulo: x.origen?.titulo, version: x.e.version, contenido: x.origen?.contenido });
        return preguntar({ nombre: pre.nombre, frase: pre.frase, notas: pre.notas, entregable_ref: x.item.id });
      }
      return;
    }
    if (!S.W) return;
    if (k === 'lista') { if (sucio() && !(await confirmAsk('Tienes cambios sin guardar. ¿Salir y descartarlos?'))) return; return alive() && lista(); }
    if (k === 'generar') return generar();
    if (k === 'guardar') return haz(guardar);
    if (k === 'descartar') return descartar();
    if (k === 'creative') return haz(enviarCreative);
    if (k === 'chat') return chatDe(S.W);
    if (k === 'brief') return verBrief(t.dataset.f, t.dataset.ca);
    if (k === 'brief-cerrar') { S.sel = null; pintarCanales(); return pintarBrief(); }
    if (k === 'resultado') return anotarResultado();
    if (k === 'gen-parar') { S.gen?.ctrl?.abort(); S.gen = null; pintarGen(); return pintarCab(); }
    if (k === 'gen-usar') return usar(true);
    if (k === 'gen-usar-canales') return usar(false);
    if (k === 'gen-reintentar') return generar();
    if (k === 'gen-claude') return generar('claude-web');
    if (k === 'gen-pegar') return pegar();
    if (k === 'gen-cerrar') { S.gen = null; pintarGen(); return pintarCab(); }
  };
  el.oninput = (e) => { if (e.target.matches('[data-c],[data-k],[data-bf]')) enCampo(e.target, 'input'); };
  el.onchange = (e) => { if (e.target.matches('[data-c],[data-k],[data-bf]')) enCampo(e.target, 'change'); };

  // Arranque: la lista, o la campaña que viene en la ruta.
  const pide = (() => { try { return resto[0] ? decodeURIComponent(resto[0]) : ''; } catch { return ''; } })();
  if (pide && xs.some((x) => x.id === pide)) abrir(pide); else lista();
  cargarEntradas();
}
