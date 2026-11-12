// App 01 · Marca › Diseño › Video: arriba el kit de edición de la marca (sale de su design system y se fija al guardarlo);
// abajo, una tarjeta por video. La ficha (vista grande): formato y duración, la vista previa del cuadro con el kit, la línea
// de tiempo, los cortes, los assets y la música. «Armar con Claude» abre el pedido para ⑦ Video Editing: el OS no edita.
// Post-Production Workspace: el tablero por capas (recepción → export), las versiones por ficha, el checklist QA y los comentarios al segundo.
import { html, raw, mount, api, toast, ico, $, $$, confirmAsk, drawer, closeDrawer, openClaude } from './core.js';
import { leerSistema } from './sistema-visual.js';
import { ESTADOS_V, FORMATOS_V, TRANSICIONES, POSICIONES, kitDesdeSistema, limpiarKit, pedidoVideo, seg, reloj, duracionCortes, CAPAS, QA_ITEMS, limpiarQA, puedeEnviar, qaHechas, tablero, siguienteVersion, limpiarVersiones, comentariosVisibles } from './video.js';
import { fallo } from './visual.js';

const PROP = { '9:16': [9, 16], '4:5': [4, 5], '1:1': [1, 1], '16:9': [16, 9] };
const REV = { Pendiente: 'Pendiente de revisión', Cambios: 'Con cambios pedidos', Aprobado: 'Aprobado' };
const TONO = { 'Por editar': '', 'En edición': 'av-st-borr', 'En revisión': 'av-st-borr', Listo: 'av-st-ok' };

// El cuadro con el kit: la safe zone punteada y el subtítulo con su fuente, tamaño, color y lugar. ancho = px en pantalla.
export function cuadro(formato, kit, texto, ancho = 170) {
  const [w, h] = PROP[formato] || PROP['9:16'], alto = Math.round((ancho * h) / w), s = kit.subtitulos, k = ancho / 1080;
  const fondo = kit.colores[0] || '#262523', z = kit.safe;
  const pos = s.posicion === 'arriba' ? `top:${z.arriba + 4}%` : s.posicion === 'centro' ? 'top:50%;transform:translateY(-50%)' : `bottom:${z.abajo + 4}%`;
  const letra = `font-family:'${String(s.fuente || 'Inter').replace(/'/g, '')}',Inter,system-ui,sans-serif;font-size:${Math.max(7, Math.round(s.tamano * k * 1.6))}px;color:${s.color};${s.fondo ? `background:${s.fondo};padding:1px 4px;` : ''}${s.mayusculas ? 'text-transform:uppercase;' : ''}`;
  return html`<div class="vd-cuadro" style="${raw(`width:${ancho}px;height:${alto}px;background:${fondo}`)}" role="img" aria-label="Vista previa ${formato} con el kit de la marca">
    <i class="vd-safe" style="${raw(`top:${z.arriba}%;bottom:${z.abajo}%;left:${z.lados}%;right:${z.lados}%`)}"></i>
    <span class="vd-sub" style="${raw(`${pos};left:${z.lados}%;right:${z.lados}%;${letra}`)}">${texto || 'Así se ven los subtítulos'}</span></div>`;
}
// La línea de tiempo: un tramo por corte, del ancho de lo que dura.
export function lineaTiempo(cortes = []) {
  const total = duracionCortes(cortes);
  if (!cortes.length || !total) return html`<div class="vd-linea vacia"><span class="mut sm">La línea de tiempo aparece cuando los cortes tienen su inicio y su fin.</span></div>`;
  return html`<div class="vd-linea" role="list" aria-label="Línea de tiempo">${cortes.map((c, i) => { const d = Math.max(0, (c.hasta ?? 0) - (c.desde ?? 0)); return html`<span role="listitem" class="vd-tramo t${i % 4}" style="${raw(`flex:${d || 0.5}`)}" title="${`${i + 1}. ${reloj(c.desde)}–${reloj(c.hasta)} · ${c.toma || ''}${c.texto ? ` · «${c.texto}»` : ''}`}">${i + 1}</span>`; })}</div>
    <div class="vd-linea-pie mut sm"><span>0:00</span><span>${reloj(total)}</span></div>`;
}

export async function videoUI(el, { b, alive }) {
  const S = { kit: null, fichas: [], puede: {}, sis: null, estado: '', vista: 'fichas' };
  mount(el, html`<p class="loading">Cargando…</p>`);
  try {
    const [r, sis] = await Promise.all([api(`video?profile=${encodeURIComponent(b.slug)}`), b.personal ? { md: '' } : api(`repo/client/${encodeURIComponent(b.slug)}/sistema`).catch(() => ({ md: '' }))]);
    Object.assign(S, { kit: r.kit ? limpiarKit(r.kit) : null, fichas: r.fichas || [], puede: r.puede || {}, sis: sis?.md ? leerSistema(sis.md) : null });
  } catch (e) { if (alive()) mount(el, html`${fallo({ titulo: 'No pude abrir Video', linea: e.message })}`); return; }
  if (!alive()) return;
  const ed = () => Boolean(S.puede.editar);
  const kit = () => S.kit || kitDesdeSistema(S.sis);
  const carpeta = b.slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${b.slug}`;

  function card(f) {
    const dur = duracionCortes(f.cortes || []);
    return html`<article class="fm-card vd-card"><header><span class="chip sm2">${f.formato}</span><span class="chip sm2 ${TONO[f.estado] || ''}">${f.estado}</span><span class="chip sm2" title="Versión vigente">v${f.version || 1}</span>${f.derivada_de ? html`<span class="chip sm2" title="Sale de otro video">${ico('repeat', 11)} Derivada</span>` : ''}</header>
      <h3>${f.titulo}</h3><p class="mut sm">${(f.cortes || []).length} corte${(f.cortes || []).length === 1 ? '' : 's'}${dur ? ` · ${reloj(dur)}` : ''}${(f.assets || []).length ? ` · ${f.assets.length} asset${f.assets.length === 1 ? '' : 's'}` : ''} · QA ${qaHechas(f.qa)}/${QA_ITEMS.length}${(f.comentarios || []).length ? ` · ${f.comentarios.length} comentario${f.comentarios.length === 1 ? '' : 's'}` : ''}${f.revision ? ` · ${REV[f.revision]}` : ''}</p>
      ${lineaTiempo(f.cortes || [])}
      <footer><button class="btn sm" data-vd="abrir" data-id="${f.id}">${ico('edit', 13)} Abrir la ficha</button><button class="btn ghost sm" data-vd="claude" data-id="${f.id}">${ico('spark', 13)} Armar con Claude</button></footer></article>`;
  }
  function kitCard() {
    const k = kit(), guardado = Boolean(S.kit);
    const fila = (l, v) => (v ? html`<div><dt>${l}</dt><dd>${v}</dd></div>` : '');
    return html`<section class="vd-kit"><div class="vd-kit-prev">${cuadro('9:16', k, 'Así se ven los subtítulos', 150)}</div>
      <div class="vd-kit-b"><div class="row" style="gap:8px;align-items:center"><h2 class="fm-h" style="margin:0">El kit de edición</h2>${guardado ? html`<span class="chip sm2 av-st-ok">${ico('check', 11)} Guardado</span>` : html`<span class="chip sm2">Sale del design system</span>`}<span class="sp"></span>${ed() ? html`<button class="btn ghost sm" data-vd="kit">${ico('edit', 13)} Editar el kit</button>` : ''}</div>
        ${k.colores.length ? html`<div class="vd-colores">${k.colores.map((c) => html`<span class="vd-col" style="${raw(`background:${c}`)}" title="${c}"></span>`)}</div>` : ''}
        <dl class="vd-dl">${fila('Subtítulos', [k.subtitulos.fuente, `${k.subtitulos.tamano} px`, k.subtitulos.posicion].filter(Boolean).join(' · '))}${fila('Ritmo', k.ritmo)}${fila('Cómo entra el texto', k.animacion)}${fila('Transiciones', k.transiciones.join(' · '))}${fila('Cierre', k.outro)}${fila('Música y voz', k.musica)}${fila('Prohibido', k.prohibido)}</dl>
        ${!guardado ? html`<p class="mut sm">${S.sis ? 'Lo llené con su design system. Guárdalo para fijarlo: así lo usa ⑦ en cada video.' : 'Esta marca todavía no tiene design system en el repo: llena el kit a mano.'}</p>` : ''}</div></section>`;
  }
  // El tablero por capas: una columna por capa del pipeline; el botón de la ficha la pasa a la siguiente capa.
  function capas(lista) {
    const t = tablero(lista), nombre = (id) => S.fichas.find((x) => x.id === id)?.titulo || 'otro video';
    return html`<div class="vd-capas" role="list">${t.map((c, i) => html`<section class="vd-capa" role="listitem" aria-label="${c.label}"><h3 class="lbl">${c.label} <span class="mut">${c.fichas.length}</span></h3>
      ${c.fichas.length ? c.fichas.map((f) => html`<article class="fm-card vd-card vd-mini"><h4>${f.titulo}</h4><p class="mut sm">${f.formato} · v${f.version || 1} · QA ${qaHechas(f.qa)}/${QA_ITEMS.length}${f.derivada_de ? ` · de «${nombre(f.derivada_de)}»` : ''}</p>
        <footer><button class="btn sm" data-vd="abrir" data-id="${f.id}">${ico('edit', 12)} Abrir</button>${ed() && i < t.length - 1 ? html`<button class="btn ghost sm" data-vd="capa" data-id="${f.id}" data-k="${t[i + 1].k}" title="Pasar a ${t[i + 1].label}">${t[i + 1].label} →</button>` : ''}</footer></article>`) : html`<p class="mut sm">Vacía</p>`}</section>`)}</div>`;
  }
  function paint() {
    if (!alive()) return;
    const lista = S.fichas.filter((f) => !S.estado || f.estado === S.estado);
    mount(el, html`<div class="fm vd">${kitCard()}
      <div class="fm-bar"><div class="seg mini" role="tablist" aria-label="Estado">${[['', 'Todos'], ...ESTADOS_V.map((x) => [x, x])].map(([k, l]) => html`<button role="tab" class="${S.estado === k ? 'on' : ''}" aria-selected="${S.estado === k ? 'true' : 'false'}" data-vd="estado" data-k="${k}">${l}${k ? html` <span class="mut">${S.fichas.filter((f) => f.estado === k).length}</span>` : ''}</button>`)}</div>
        <div class="seg mini" role="tablist" aria-label="Vista">${[['fichas', 'Fichas'], ['capas', 'Capas']].map(([k, l]) => html`<button role="tab" class="${S.vista === k ? 'on' : ''}" aria-selected="${S.vista === k ? 'true' : 'false'}" data-vd="vista" data-k="${k}">${l}</button>`)}</div>
        <span class="sp"></span>${ed() ? html`<button class="btn sm" data-vd="nuevo">${ico('plus', 13)} Video</button>` : ''}</div>
      ${S.vista === 'capas' ? capas(lista) : lista.length ? html`<div class="fm-grid">${lista.map(card)}</div>` : html`<p class="mut fm-vacio">${S.fichas.length ? 'No hay videos en este estado.' : 'Todavía no hay fichas de video. Crea una por cada video del mes: los cortes, los assets y la música, y ⑦ lo arma con el kit de la marca.'}</p>`}</div>`);
  }

  // ---------- El kit (vista grande) ----------
  function editarKit() {
    const k = kit();
    drawer(html`<article class="fm-ed vd-ed"><span class="lbl">Kit de edición · ${b.name}</span><h2 style="margin:4px 0 14px">Cómo se edita esta marca</h2>
      <div class="vd-ed-g"><div class="vd-ed-f">
        <span class="lbl">Subtítulos</span>
        <div class="fm-ed-g"><label class="av-f w"><span class="av-l">Fuente</span><input class="in" id="vk-fuente" value="${k.subtitulos.fuente}"></label>
          <label class="av-f"><span class="av-l">Tamaño (px en 1080)</span><input class="in" id="vk-tam" type="number" min="16" max="160" value="${k.subtitulos.tamano}"></label>
          <label class="av-f"><span class="av-l">Lugar</span><select class="in" id="vk-pos">${POSICIONES.map(([v, l]) => html`<option value="${v}" ${k.subtitulos.posicion === v ? raw('selected') : ''}>${l}</option>`)}</select></label>
          <label class="av-f"><span class="av-l">Color</span><input class="in" id="vk-color" type="color" value="${k.subtitulos.color}"></label>
          <label class="av-f"><span class="av-l">Fondo (vacío = sin fondo)</span><input class="in" id="vk-fondo" value="${k.subtitulos.fondo}" placeholder="#000000"></label>
          <label class="sw-row"><input type="checkbox" class="switch" id="vk-may" ${k.subtitulos.mayusculas ? raw('checked') : ''}> En mayúsculas</label>
          <label class="av-f w"><span class="av-l">Nota</span><input class="in" id="vk-nota" value="${k.subtitulos.nota}"></label></div>
        <label class="av-f w"><span class="av-l">Colores (hex, separados por coma)</span><input class="in" id="vk-colores" value="${k.colores.join(', ')}"></label>
        <span class="lbl" style="margin-top:12px">Transiciones permitidas</span>
        <div class="checks">${[...new Set([...TRANSICIONES, ...k.transiciones])].map((t) => html`<label class="check"><input type="checkbox" name="vk-tr" value="${t}" ${k.transiciones.includes(t) ? raw('checked') : ''}> ${t}</label>`)}</div>
        <div class="fm-ed-g"><label class="av-f w"><span class="av-l">Ritmo</span><input class="in" id="vk-ritmo" value="${k.ritmo}" placeholder="Ej. un corte cada 1.5 s; sin cortes rápidos"></label>
          <label class="av-f w"><span class="av-l">Cómo entra el texto</span><input class="in" id="vk-anim" value="${k.animacion}"></label>
          <label class="av-f w"><span class="av-l">Intro</span><input class="in" id="vk-intro" value="${k.intro}"></label>
          <label class="av-f w"><span class="av-l">Cierre</span><input class="in" id="vk-outro" value="${k.outro}"></label>
          <label class="av-f w"><span class="av-l">Música y voz</span><input class="in" id="vk-musica" value="${k.musica}"></label></div>
        <span class="lbl" style="margin-top:12px">Safe zones (% del cuadro)</span>
        <div class="fm-ed-g"><label class="av-f"><span class="av-l">Arriba</span><input class="in" id="vk-sa" type="number" min="0" max="40" value="${k.safe.arriba}"></label><label class="av-f"><span class="av-l">Abajo</span><input class="in" id="vk-sb" type="number" min="0" max="40" value="${k.safe.abajo}"></label><label class="av-f"><span class="av-l">Lados</span><input class="in" id="vk-sl" type="number" min="0" max="30" value="${k.safe.lados}"></label></div>
        <label class="av-f w"><span class="av-l">Encuadre</span><input class="in" id="vk-enc" value="${k.encuadre}"></label>
        <label class="av-f w"><span class="av-l">Prohibido</span><input class="in" id="vk-proh" value="${k.prohibido}"></label>
      </div><div class="vd-ed-prev" id="vk-prev"></div></div>
      <div class="row" style="margin-top:18px;gap:8px"><button class="btn" data-act="guardar">${ico('check', 14)} Guardar el kit</button>${S.sis ? html`<button class="btn ghost" data-act="sistema">Traer del design system</button>` : ''}<button class="btn ghost" data-act="cerrar">Cerrar</button></div></article>`,
    {
      cerrar: () => closeDrawer(),
      sistema: () => { S.kit = null; closeDrawer(); editarKit(); },
      guardar: async () => {
        try { const d = await api(`video/kit/${encodeURIComponent(b.slug)}`, { method: 'PUT', body: leerKit() }); S.kit = limpiarKit(d); toast('Kit guardado'); closeDrawer(); paint(); } catch (e) { toast(e.message, true); }
      },
    }, { section: 'Video', title: 'Kit de edición' });
    const leerKit = () => limpiarKit({ subtitulos: { fuente: $('#vk-fuente').value, tamano: $('#vk-tam').value, posicion: $('#vk-pos').value, color: $('#vk-color').value, fondo: $('#vk-fondo').value, mayusculas: $('#vk-may').checked, nota: $('#vk-nota').value },
      colores: $('#vk-colores').value.split(/[,\s]+/), transiciones: $$('input[name="vk-tr"]:checked').map((x) => x.value), ritmo: $('#vk-ritmo').value, animacion: $('#vk-anim').value, intro: $('#vk-intro').value, outro: $('#vk-outro').value, musica: $('#vk-musica').value,
      safe: { arriba: $('#vk-sa').value, abajo: $('#vk-sb').value, lados: $('#vk-sl').value }, encuadre: $('#vk-enc').value, prohibido: $('#vk-proh').value });
    const prev = () => { const box = $('#vk-prev'); if (box) mount(box, html`<span class="lbl">Vista previa</span>${cuadro('9:16', leerKit(), 'Así se ven los subtítulos', 220)}`); };
    $('.vd-ed')?.addEventListener('input', prev); prev();
  }

  // ---------- La ficha (vista grande) ----------
  function editar(f0) {
    const f = { titulo: '', formato: '9:16', duracion: '', estado: 'Por editar', assets: [], cortes: [], transicion: '', musica: '', notas: '', capa: 'recepcion', versiones: [], escenas: [], qa: limpiarQA({}), comentarios: [], ...f0 };
    f.qa = limpiarQA(f.qa); const versiones = limpiarVersiones(f.versiones), tenia = new Set(versiones.map((x) => x.v)), escenas = (f.escenas || []).map((c) => ({ ...c }));
    const cortes = (f.cortes || []).map((c) => ({ ...c })), assets = (f.assets || []).map((a) => ({ ...a }));
    const soloVer = !ed(), dis = soloVer ? raw('disabled') : '';
    const trans = [...new Set([...(kit().transiciones.length ? kit().transiciones : TRANSICIONES), f.transicion].filter(Boolean))];
    const filaCorte = (c, i) => html`<div class="vd-c" data-i="${i}"><span class="vd-n">${i + 1}</span><input class="in" data-c="desde" value="${c.desde != null ? reloj(c.desde) : ''}" placeholder="0:00" aria-label="Inicio" ${dis}><input class="in" data-c="hasta" value="${c.hasta != null ? reloj(c.hasta) : ''}" placeholder="0:03" aria-label="Fin" ${dis}>
      <input class="in" data-c="toma" value="${c.toma || ''}" placeholder="Toma o asset" aria-label="Toma" ${dis}><input class="in" data-c="texto" value="${c.texto || ''}" placeholder="Texto en pantalla" aria-label="Texto en pantalla" ${dis}><input class="in" data-c="nota" value="${c.nota || ''}" placeholder="Nota" aria-label="Nota" ${dis}>
      ${soloVer ? '' : html`<button type="button" class="btn ghost sm" data-act="quitarCorte" data-i="${i}" aria-label="Quitar el corte">×</button>`}</div>`;
    const filaAsset = (a, i) => html`<div class="vd-a" data-i="${i}"><input class="in" data-a="nombre" value="${a.nombre || ''}" placeholder="Nombre" aria-label="Nombre del asset" ${dis}><input class="in" data-a="url" value="${a.url || ''}" placeholder="https://drive.google.com/…" aria-label="Link del asset" ${dis}>${a.url ? html`<a class="btn ghost sm" href="${a.url}" target="_blank" rel="noopener noreferrer">${ico('link', 12)}</a>` : ''}${soloVer ? '' : html`<button type="button" class="btn ghost sm" data-act="quitarAsset" data-i="${i}" aria-label="Quitar el asset">×</button>`}</div>`;
    const pipeline = () => ({ capa: $('#vd-capa')?.value || f.capa, versiones, escenas, derivada_de: $('#vd-deriv')?.value ?? f.derivada_de ?? '', post: f.post || '',
      qa: limpiarQA({ ...Object.fromEntries(QA_ITEMS.map(([k]) => [k, Boolean($(`#vq-${k}`)?.checked)])), motivo: $('#vq-motivo')?.value }) });
    const filaVersion = (x) => html`<div class="vd-v" data-v="${x.v}"><span class="chip sm2">v${x.v}</span>${tenia.has(x.v) || soloVer ? html`<span class="mut sm">${x.nota || 'Sin nota'}${x.por ? ` · ${x.por}` : ''}${x.en ? ` · ${x.en.slice(0, 10)}` : ''}</span>` : html`<input class="in" data-vv="nota" value="${x.nota}" placeholder="Qué cambió" aria-label="Nota de la versión">`}
      ${tenia.has(x.v) || soloVer ? '' : html`<input class="in" data-vv="link" value="${x.link}" placeholder="https://…" aria-label="Link de la versión">`}${x.link ? html`<a class="btn ghost sm" href="${x.link}" target="_blank" rel="noopener noreferrer">${ico('link', 12)}</a>` : ''}</div>`;
    const filaEscena = (c, i) => html`<div class="vd-c vd-e" data-i="${i}"><span class="vd-n">${i + 1}</span><input class="in" data-e="id" value="${c.id || ''}" placeholder="PR-001" aria-label="Id de la escena" ${dis}><input class="in" data-e="desde" value="${c.desde != null ? reloj(c.desde) : ''}" placeholder="0:00" aria-label="Inicio" ${dis}><input class="in" data-e="hasta" value="${c.hasta != null ? reloj(c.hasta) : ''}" placeholder="0:03" aria-label="Fin" ${dis}>
      <input class="in" data-e="toma" value="${c.toma || ''}" placeholder="Toma" aria-label="Toma" ${dis}><input class="in" data-e="texto" value="${c.texto || ''}" placeholder="Texto" aria-label="Texto" ${dis}>${soloVer ? '' : html`<button type="button" class="btn ghost sm" data-act="quitarEscena" data-i="${i}" aria-label="Quitar la escena">×</button>`}</div>`;
    const filaCom = (c) => html`<li class="vd-com"><b>${c.seg != null ? reloj(c.seg) : 'General'}</b> <span class="mut sm">v${c.version} · ${c.por}${c.interno ? ' · interno' : ''}</span><br>${c.texto}</li>`;
    const leer = () => {
      $$('#vd-versiones .vd-v').forEach((r) => { const x = versiones.find((y) => y.v === +r.dataset.v); if (!x || tenia.has(x.v)) return; x.nota = $('[data-vv="nota"]', r)?.value ?? x.nota; x.link = ($('[data-vv="link"]', r)?.value ?? x.link).trim(); });
      $$('#vd-escenas .vd-e').forEach((r) => { const i = +r.dataset.i; for (const k of ['id', 'toma', 'texto']) escenas[i][k] = $(`[data-e="${k}"]`, r).value; for (const k of ['desde', 'hasta']) escenas[i][k] = seg($(`[data-e="${k}"]`, r).value); });
      $$('#vd-cortes .vd-c').forEach((r) => { const i = +r.dataset.i; for (const k of ['toma', 'texto', 'nota']) cortes[i][k] = $(`[data-c="${k}"]`, r).value; for (const k of ['desde', 'hasta']) cortes[i][k] = seg($(`[data-c="${k}"]`, r).value); });
      $$('#vd-assets .vd-a').forEach((r) => { const i = +r.dataset.i; assets[i].nombre = $('[data-a="nombre"]', r).value; assets[i].url = $('[data-a="url"]', r).value.trim(); });
    };
    const pintar = () => {
      mount($('#vd-cortes'), html`${cortes.length ? cortes.map(filaCorte) : html`<p class="mut sm">Sin cortes todavía.</p>`}`);
      mount($('#vd-versiones'), html`${versiones.length ? versiones.map(filaVersion) : html`<p class="mut sm">⚠️ SIN DATOS: todavía no hay versiones. La primera sale del corte que sube el editor.</p>`}`);
      mount($('#vd-escenas'), html`${escenas.length ? escenas.map(filaEscena) : html`<p class="mut sm">Sin escenas todavía.</p>`}`);
      if ($('#vd-coms')) mount($('#vd-coms'), html`${(f.comentarios || []).length ? html`<ul class="vd-coms">${comentariosVisibles(f).map(filaCom)}</ul>` : html`<p class="mut sm">Sin comentarios todavía.</p>`}`);
      mount($('#vd-assets'), html`${assets.length ? assets.map(filaAsset) : html`<p class="mut sm">Sin assets todavía: los links de Drive de lo que se grabó.</p>`}`);
      prev();
    };
    const prev = () => { const box = $('#vd-prev'); if (!box) return; const fmt = $('#vd-formato')?.value || f.formato; mount(box, html`<span class="lbl">Vista previa</span>${cuadro(fmt, kit(), cortes.find((c) => c.texto)?.texto, fmt === '16:9' ? 300 : 210)}<span class="lbl" style="margin-top:14px">Línea de tiempo</span>${lineaTiempo(cortes)}`); };
    const datos = () => { leer(); return { titulo: $('#vd-titulo').value.trim(), formato: $('#vd-formato').value, duracion: $('#vd-dur').value, estado: $('#vd-estado').value, transicion: $('#vd-trans').value, musica: $('#vd-musica').value, notas: $('#vd-notas').value, cortes, assets, ...pipeline() }; };
    drawer(html`<article class="fm-ed vd-ed"><span class="lbl">${f.id ? 'Ficha de video' : 'Nuevo video'} · ${b.name}</span>
      <div class="vd-ed-g"><div class="vd-ed-f">
        <div class="fm-ed-g"><label class="av-f w"><span class="av-l">Título</span><input class="in" id="vd-titulo" value="${f.titulo}" placeholder="Ej. Reel · antes y después de la cocina" ${dis}></label>
          <label class="av-f"><span class="av-l">Formato</span><select class="in" id="vd-formato" ${dis}>${FORMATOS_V.map(([k, l]) => html`<option value="${k}" ${f.formato === k ? raw('selected') : ''}>${l}</option>`)}</select></label>
          <label class="av-f"><span class="av-l">Duración objetivo (s)</span><input class="in" id="vd-dur" type="number" min="1" max="3600" value="${f.duracion ?? ''}" ${dis}></label>
          <label class="av-f"><span class="av-l">Estado</span><select class="in" id="vd-estado" ${dis}>${ESTADOS_V.map((x) => html`<option ${f.estado === x ? raw('selected') : ''}>${x}</option>`)}</select></label>
          <label class="av-f"><span class="av-l">Transición</span><select class="in" id="vd-trans" ${dis}><option value="">La del kit</option>${trans.map((t) => html`<option ${f.transicion === t ? raw('selected') : ''}>${t}</option>`)}</select></label>
          <label class="av-f w"><span class="av-l">Música</span><input class="in" id="vd-musica" value="${f.musica}" placeholder="Canción, estilo o «la del kit»" ${dis}></label></div>
        <span class="lbl" style="margin-top:16px">Cortes, en orden</span><div class="vd-c vd-c-h" aria-hidden="true"><span></span><span>Inicio</span><span>Fin</span><span>Toma</span><span>Texto en pantalla</span><span>Nota</span></div><div id="vd-cortes" class="vd-cortes"></div>${soloVer ? '' : html`<button type="button" class="btn ghost sm" data-act="corte">${ico('plus', 13)} Corte</button>`}
        <span class="lbl" style="margin-top:16px">Assets</span><div id="vd-assets"></div>${soloVer ? '' : html`<button type="button" class="btn ghost sm" data-act="asset">${ico('plus', 13)} Asset</button>`}
        <span class="lbl" style="margin-top:16px">Pipeline</span>
        <div class="fm-ed-g"><label class="av-f"><span class="av-l">Capa</span><select class="in" id="vd-capa" ${dis}>${CAPAS.map(([k, l]) => html`<option value="${k}" ${f.capa === k ? raw('selected') : ''}>${l}</option>`)}</select></label>
          <label class="av-f"><span class="av-l">Sale de</span><select class="in" id="vd-deriv" ${dis}><option value="">Es un master</option>${S.fichas.filter((x) => x.id !== f.id).map((x) => html`<option value="${x.id}" ${f.derivada_de === x.id ? raw('selected') : ''}>${x.titulo}</option>`)}</select></label></div>
        <span class="lbl" style="margin-top:12px">Versiones${f.revision ? html` · <span class="chip sm2 ${f.revision === 'Aprobado' ? 'av-st-ok' : 'av-st-borr'}">${REV[f.revision]}${f.aprobacion ? ` · v${f.aprobacion.v}` : ''}</span>` : ''}</span><div id="vd-versiones"></div>${soloVer ? '' : html`<button type="button" class="btn ghost sm" data-act="version">${ico('plus', 13)} Nueva versión</button>`}
        <span class="lbl" style="margin-top:16px">Checklist QA · ${QA_ITEMS.filter(([k]) => f.qa[k]).length}/${QA_ITEMS.length}</span>
        <div class="checks">${QA_ITEMS.map(([k, l]) => html`<label class="check"><input type="checkbox" id="vq-${k}" ${f.qa[k] ? raw('checked') : ''} ${dis}> ${l}</label>`)}</div>
        <label class="av-f w"><span class="av-l">Motivo, si se envía sin el QA completo</span><input class="in" id="vq-motivo" value="${f.qa.motivo}" ${dis}></label>
        <span class="lbl" style="margin-top:16px">Escenas</span><div id="vd-escenas"></div>${soloVer ? '' : html`<button type="button" class="btn ghost sm" data-act="escena">${ico('plus', 13)} Escena</button>`}
        ${f.id ? html`<span class="lbl" style="margin-top:16px">Comentarios</span><div id="vd-coms"></div>${soloVer ? '' : html`<div class="fm-ed-g"><label class="av-f"><span class="av-l">Segundo</span><input class="in" id="vc-seg" placeholder="0:07"></label><label class="av-f w"><span class="av-l">Comentario</span><input class="in" id="vc-txt"></label><label class="sw-row"><input type="checkbox" class="switch" id="vc-int"> Interno</label></div><button type="button" class="btn ghost sm" data-act="comentar">${ico('plus', 13)} Comentar</button>`}` : ''}
        <label class="av-f w" style="margin-top:14px"><span class="av-l">Notas para el editor</span><textarea class="in" id="vd-notas" rows="3" ${dis}>${f.notas}</textarea></label>
      </div><div class="vd-ed-prev" id="vd-prev"></div></div>
      <div class="row" style="margin-top:18px;gap:8px;flex-wrap:wrap">${soloVer ? '' : html`<button class="btn" data-act="guardar">${ico('check', 14)} Guardar</button>`}<button class="btn ghost" data-act="claude">${ico('spark', 14)} Armar con Claude</button>${f.id && !soloVer && f.estado !== 'En revisión' ? html`<button class="btn ghost" data-act="enviar">${ico('send', 14)} Enviar a revisión</button>` : ''}${f.id && !soloVer ? html`<button class="btn ghost" data-act="archivar">Archivar</button>` : ''}<button class="btn ghost" data-act="cerrar">Cerrar</button></div></article>`,
    {
      corte: () => { leer(); const u = cortes[cortes.length - 1]; cortes.push({ desde: u?.hasta ?? (cortes.length ? null : 0), hasta: null, toma: '', texto: '', nota: '' }); pintar(); },
      quitarCorte: (t) => { leer(); cortes.splice(+t.dataset.i, 1); pintar(); },
      asset: () => { leer(); assets.push({ nombre: '', url: '' }); pintar(); },
      quitarAsset: (t) => { leer(); assets.splice(+t.dataset.i, 1); pintar(); },
      version: () => { leer(); versiones.push({ v: siguienteVersion({ versiones }), link: '', nota: '', por: '', en: '', capa: '' }); pintar(); },
      escena: () => { leer(); const u = escenas[escenas.length - 1]; escenas.push({ id: '', desde: u?.hasta ?? (escenas.length ? null : 0), hasta: null, toma: '', texto: '' }); pintar(); },
      quitarEscena: (t) => { leer(); escenas.splice(+t.dataset.i, 1); pintar(); },
      comentar: async () => {
        const texto = $('#vc-txt').value.trim(); if (!texto) return toast('Escribe el comentario', true);
        try { const r = await api(`video/${f.id}/comentarios`, { method: 'POST', body: { seg: $('#vc-seg').value, texto, interno: $('#vc-int').checked, version: f.version, v: f.v } });
          f.v = r.v; f.comentarios = r.comentarios; S.fichas = S.fichas.map((x) => (x.id === r.id ? r : x)); $('#vc-txt').value = ''; pintar(); toast('Comentario guardado'); } catch (e) { toast(e.message, true); }
      },
      enviar: async () => {
        const body = datos(), falta = puedeEnviar(body); if (falta) return toast(falta, true);
        if (!body.titulo) return toast('Ponle un título al video', true);
        try { const d = await api(`video/${f.id}`, { method: 'PUT', body: { ...body, estado: 'En revisión', v: f.v } }); S.fichas = [...S.fichas.filter((x) => x.id !== d.id), d]; toast('Enviado a revisión'); closeDrawer(); paint(); } catch (e) { toast(e.message, true); }
      },
      cerrar: () => closeDrawer(),
      claude: () => { const d = soloVer ? f : { ...f, ...datos() }; armar(d); },
      archivar: async () => { if (!(await confirmAsk(`¿Archivar «${f.titulo}»?`))) return; try { await api(`video/${f.id}`, { method: 'PUT', body: { archivado: true, v: f.v } }); S.fichas = S.fichas.filter((x) => x.id !== f.id); closeDrawer(); paint(); } catch (e) { toast(e.message, true); } },
      guardar: async () => {
        const body = datos(); if (!body.titulo) return toast('Ponle un título al video', true);
        if (body.assets.some((a) => a.url && !/^https:\/\//.test(a.url))) return toast('Los links de los assets empiezan con https://', true);
        try { const d = f.id ? await api(`video/${f.id}`, { method: 'PUT', body: { ...body, v: f.v } }) : await api('video', { method: 'POST', body: { profile: b.slug, ...body } });
          S.fichas = [...S.fichas.filter((x) => x.id !== d.id), d]; toast('Ficha guardada'); closeDrawer(); paint(); } catch (e) { toast(e.message, true); }
      },
    }, { section: 'Video', title: f.titulo || 'Nuevo video' });
    $('.vd-ed')?.addEventListener('change', (e) => { if (e.target.id === 'vd-formato' || e.target.dataset.c) { leer(); prev(); } });
    $('.vd-ed')?.addEventListener('input', (e) => { if (e.target.dataset.c === 'texto') { leer(); prev(); } });
    pintar();
  }
  function armar(f) {
    const cabe = openClaude(pedidoVideo(f, kit(), b.name, carpeta));
    toast(cabe ? 'Se abrió Claude Code con el pedido para ⑦ Video Editing (también quedó copiado)' : 'El pedido quedó copiado: pégalo en Claude Code');
  }

  el.onclick = (e) => {
    const t = e.target.closest('[data-vd]'); if (!t) return;
    const a = t.dataset.vd, f = S.fichas.find((x) => x.id === t.dataset.id);
    if (a === 'estado') { S.estado = t.dataset.k; return paint(); }
    if (a === 'vista') { S.vista = t.dataset.k; return paint(); }
    if (a === 'capa' && f) return api(`video/${f.id}`, { method: 'PUT', body: { capa: t.dataset.k, v: f.v } }).then((d) => { S.fichas = S.fichas.map((x) => (x.id === d.id ? d : x)); paint(); }).catch((er) => toast(er.message, true));
    if (a === 'kit') return editarKit();
    if (a === 'nuevo') return editar({});
    if (a === 'abrir' && f) return editar(f);
    if (a === 'claude' && f) return armar(f);
  };
  paint();
}
