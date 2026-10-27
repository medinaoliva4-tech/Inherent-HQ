// «Por postear»: los videos y piezas propias de un perfil, de la idea a publicado.
// Se usa en Content y en la página de cada cliente. Vive en la colección content.
import { html, raw, mount, col, ask, toast, fdate, $, $$, confirmAsk, drawer, closeDrawer, embedUrl , wizard, api, connectChip, ask as askF, ico, uploadToDrive } from './core.js';
import { REDES } from './calendario-vistas.js';
import { ESTADOS, ESTADOS_TODOS, ESTADO_CLS, ESTADO_AYUDA, estadoDe, separar, conEstado, nombreAuto, nombreDe } from './element.js';
import { layaBox } from './laya-ui.js';
import { verImagen, ojoChip } from './ojo.js';
import { CONSCIENCIA, consciencia, replicasDe, replicaNombre, conReplica } from './calendario-contenido.js';
import { ANGULOS, ANGULO_AYUDA } from './avatares.js';
import { rutaModulo } from './herramientas.js';

// Los estados son los del modelo de elemento (Idea · En proceso · Listo · Publicado, más Archivado).
// Los viejos (Grabado, Editado, Programado) se leen como los nuevos: nada se reescribe en la base.
export const PSTATUS = ESTADOS;
const PCLS = ESTADO_CLS;
const C = col('content');

export const loadPosts = async (profile) => (await C.list()).filter((p) => p.profile === profile && p.kind === 'post');

// Los pilares de contenido de cada perfil (se definen en Contenido → Planner).
export const pillarsOf = (profile) => conn[profile]?.pillars || [];
export async function loadConn(profile) { if (!conn[profile] || conn[profile].loading) conn[profile] = await api(`content/cfg?profile=${encodeURIComponent(profile)}`).catch(() => ({})); return conn[profile]; }
export function setConn(profile, patch) { conn[profile] = { ...(conn[profile] || {}), ...patch }; }
// En Drive o por subir: lo que dice el Planner de cada pieza.
export const driveState = (p) => (p.drive_id || /^https:\/\//.test(p.url || '') ? [ico('folder', 14), 'En Drive'] : estadoDe(p) === 'Idea' ? [ico('edit', 14), 'Por grabar'] : [ico('upload', 14), 'Por subir']);

// pre.brand: el nombre de la marca, para el nombre automático «Marca – Formato – Tema».
// Cada pieza es la suma de investigación + pilar o campaña + formato (calendario-contenido.js): guarda pillar, campana, format,
// consciencia (los 5 niveles del método) y replica_de (el post de Research que replica). pre.replicas: los referentes marcados
// «Usar como formato» (si no vienen, se leen de Research); pre.campanas: las campañas que ya existen.
const DAW = ['No sabe que tiene el problema', 'Sabe el problema, no la solución', 'Conoce la solución, no la marca', 'Te conoce, no está convencido', 'Convencido, falta la acción'];
export async function editPost(profile, p, pre = {}) {
  const pillars = pillarsOf(profile);
  const refs = pre.replicas || replicasDe(await C.list().catch(() => []), profile);
  const camps = [...new Set([...(pre.campanas || []), p?.campana].filter(Boolean))];
  // Cliente ideal: a qué avatar le habla la pieza y con qué ángulo (Marca › Entender › Cliente ideal).
  const avs = (pre.avatares || await api(`avatares?profile=${encodeURIComponent(profile)}`).then((r) => r.avatares).catch(() => [])).filter((x) => !x.archivado);
  const angulosDe = (id) => { const a = avs.find((x) => x.id === id); const propios = (a?.angulos || []).map((g) => ({ v: `${g.tipo} · ${g.texto}`, l: g.tipo, d: g.texto })); return propios.length ? propios : ANGULOS.map((t) => ({ v: t, l: t, d: ANGULO_AYUDA[t] })); };
  const named = (o) => ({ ...o, name: nombreAuto(pre.brand || p?.brand_name || '', o.format, o.title) });
  const withRef = (o) => { const r = refs.find((x) => x.id === o.replica_de); const out = conReplica(o, r || (o.replica_de ? { id: o.replica_de } : null)); if (!out.consciencia) delete out.consciencia; if (!out.campana) delete out.campana; if (!out.avatar) delete out.avatar; if (!out.angulo) delete out.angulo; return out; };
  if (!p) { // nueva pieza: con preguntas
    const a = await wizard('Nueva pieza', [
      { k: 'replica_de', q: '¿Replica un referente?', sub: 'De Investigación: los posts marcados «Usar como formato».', type: 'cards', v: pre.replica_de, show: () => refs.length > 0 && pre.replica_de === undefined, after: (x) => { const r = refs.find((y) => y.id === x.replica_de); if (r) Object.assign(x, conReplica({ format: x.format }, r)); },
        opts: [{ v: '', i: ico('edit'), l: 'Original', d: 'Sin referente' }, ...refs.map((r) => ({ v: r.id, i: ico('repeat'), l: `Replicar: ${replicaNombre(r)}`, d: r.format || '' }))] },
      { k: 'format', q: '¿Qué formato?', type: 'cards', req: true, v: pre.format, show: (x) => !pre.format && !refs.find((r) => r.id === x.replica_de), opts: [['Reel', ico('video')], ['TikTok', ico('music')], ['Carrusel', ico('folder')], ['Story', ico('circle')], ['Estático', ico('image')], ['YouTube', ico('play', 13)]].map(([v, i]) => ({ v, i, l: v })) },
      { k: 'title', q: '¿Cuál es la idea?', type: 'text', req: true, ph: 'Ej. Detrás de cocina', v: pre.title },
      { k: 'pillar', q: '¿De qué pilar?', type: 'cards', show: () => pillars.length > 0, v: pre.pillar, opts: pillars.map((x) => ({ v: x.name, i: ico('dot', 12), l: x.name })) },
      { k: 'campana', q: '¿De qué campaña?', type: 'cards', show: () => camps.length > 0, v: pre.campana, opts: [{ v: '', l: 'Ninguna' }, ...camps.map((x) => ({ v: x, i: ico('megaphone'), l: x }))] },
      { k: 'consciencia', q: '¿A quién le habla?', sub: 'Su nivel de consciencia', type: 'cards', req: true, v: pre.consciencia, opts: CONSCIENCIA.map((x, i) => ({ v: x, l: `${i + 1} · ${x}`, d: DAW[i] })) },
      { k: 'avatar', q: '¿A qué avatar le habla?', sub: 'De Cliente ideal: el principal recibe más volumen', type: 'cards', show: () => avs.length > 0, v: pre.avatar, opts: avs.map((a) => ({ v: a.id, i: ico('target'), l: a.nombre, d: `Peso ${a.peso || 0}%${a.estado === 'aprobado' ? ' · aprobado' : ''}` })) },
      { k: 'angulo', q: '¿Con qué ángulo?', sub: 'La misma oferta, presentada distinto', type: 'cards', show: (x) => avs.length > 0 && Boolean(x.avatar), opts: (x) => angulosDe(x.avatar) },
      { k: 'date', q: '¿Cuándo sale?', type: 'when', v: pre.date, show: () => !pre.date },
      { k: 'status', q: '¿En qué va?', type: 'cards', req: true, opts: ESTADOS.map((v) => ({ v, l: v, d: ESTADO_AYUDA[v] })) },
    ], 'Agregar');
    if (!a) return null;
    // El candado del brief: sin el brief del ciclo de ese mes no se crean piezas con fecha (las ideas sin fecha, sí).
    const k = a.date && pre.candado ? pre.candado(a.date) : null;
    if (k?.cerrado) { toast(`Sin brief del ciclo de ese mes: guárdala como idea sin fecha o pide el brief a ④ Creatividad`, true); return null; }
    try { return await C.create(named(withRef(conEstado({ ...a, ...(pre.caption ? { caption: pre.caption } : {}), profile, kind: 'post', ...(pre.brand ? { brand_name: pre.brand } : {}) }, a.status)))); } catch (e) { toast(e.message, true); return null; }
  }
  const v = await ask(p ? 'Editar pieza' : 'Nueva pieza por postear', [
    { k: 'title', l: 'Título', v: p?.title, req: true },
    { k: 'format', l: 'Formato', t: 'select', opts: ['Reel', 'TikTok', 'Carrusel', 'Story', 'Estático', 'YouTube'].map((x) => [x, x]), v: p?.format || 'Reel', half: true },
    { k: 'date', l: 'Fecha de publicación', t: 'date', v: p?.date, half: true },
    { k: 'status', l: 'Estado', t: 'select', opts: ESTADOS_TODOS.map((x) => [x, x]), v: estadoDe(p), half: true },
    { k: 'time', l: 'Hora de salida', t: 'time', v: p?.time || '', half: true },
    { k: 'red', l: 'Red', t: 'select', opts: [['', '—'], ...REDES.map((x) => [x, x])], v: p?.red || p?.slot?.canal || '', half: true },
    ...(pillars.length ? [{ k: 'pillar', l: 'Pilar', t: 'select', opts: [['', '—'], ...pillars.map((x) => [x.name, x.name])], v: p?.pillar || '', half: true }] : []),
    { k: 'campana', l: 'Campaña', v: p?.campana || '', half: true },
    ...(avs.length ? [{ k: 'avatar', l: 'Avatar', t: 'select', opts: [['', '—'], ...avs.map((a) => [a.id, `${a.nombre} · ${a.peso || 0}%`])], v: p?.avatar || '', half: true }, { k: 'angulo', l: 'Ángulo', v: p?.angulo || '', half: true }] : []),
    { k: 'consciencia', l: 'Nivel de consciencia', t: 'select', opts: [['', '—'], ...CONSCIENCIA.map((x, i) => [x, `${i + 1} · ${x}`])], v: consciencia(p), half: true },
    ...(refs.length || p?.replica_de ? [{ k: 'replica_de', l: 'Replica', t: 'select', opts: [['', 'Original · sin referente'], ...refs.map((r) => [r.id, `Replicar: ${replicaNombre(r)}`]), ...(p?.replica_de && !refs.some((r) => r.id === p.replica_de) ? [[p.replica_de, 'El referente ya no está en Research']] : [])], v: p?.replica_de || '', half: true }] : []),
    { k: 'url', l: 'Video o archivo (Drive)', v: p?.url, half: true },
    { k: 'caption', l: 'Caption', t: 'textarea', v: p?.caption },
  ], p ? 'Guardar' : 'Agregar');
  if (!v) return null;
  if (v.url && !/^https:\/\//.test(v.url)) { toast('El link debe empezar con https://', true); return null; }
  try { return p ? await C.save(named(withRef(conEstado({ ...p, ...v }, v.status)))) : await C.create(named(withRef(conEstado({ ...v, profile, kind: 'post' }, v.status)))); } catch (e) { toast(e.message, true); return null; }
}

// Tablero por estado, con arrastrar y soltar. onChange(list) recibe la lista actualizada.
// «Por postear» puede venir de una carpeta de Drive: cada video o imagen de la carpeta es una pieza.
const conn = {};
const FMT = (f) => (/video/.test(f.mime) ? 'Reel' : /image/.test(f.mime) ? 'Estático' : 'Pieza');
export async function syncDrive(profile, list) {
  const folder = conn[profile]?.postear_drive; if (!folder) return [];
  const r = await api(`google/drive?folder=${encodeURIComponent(folder)}`);
  const have = new Set(list.map((p) => p.drive_id).filter(Boolean)); const made = [];
  for (const f of r.files.filter((x) => /video|image/.test(x.mime) && !have.has(x.id))) made.push(await C.create({ kind: 'post', profile, title: f.name.replace(/\.[^.]+$/, ''), format: FMT(f), url: f.link, drive_id: f.id, status: 'En proceso' }));
  return made;
}
// opts.brand: el nombre de la marca (nombre automático). Lo publicado hace más de 30 días o archivado va a «Archivo» (filtro).
const showArch = {};
export function postsBoard(b, profile, list, onChange, opts = {}) {
  if (!conn[profile]) { conn[profile] = { loading: true }; api(`content/cfg?profile=${encodeURIComponent(profile)}`).then((c) => { conn[profile] = c; if (b.isConnected) postsBoard(b, profile, list, onChange, opts); if (c.postear_drive) syncDrive(profile, list).then((m) => m.length && (toast(`${m.length} pieza${m.length === 1 ? '' : 's'} nueva${m.length === 1 ? '' : 's'} desde Drive`), onChange([...list, ...m]))).catch((e) => toast(e.message, true)); }).catch(() => { conn[profile] = {}; }); }
  const dr = conn[profile]?.postear_drive;
  const { vivos, archivo } = separar(list), arch = Boolean(showArch[profile]);
  const sorted = (s) => vivos.filter((p) => estadoDe(p) === s).sort((a, z) => String(a.date || '9').localeCompare(String(z.date || '9')));
  const card = (p, s) => html`<div class="kcard itile" draggable="true" data-pact="open" data-id="${p.id}" tabindex="0" role="button" title="${nombreDe(p, opts.brand)}"><div class="row"><span class="chip ${PCLS[s]}" style="font-size:11px">${p.format || 'Pieza'}</span><div class="sp"></div><span class="mut sm">${p.date ? fdate(p.date) : ''}</span></div><b>${p.title}</b>${p.caption ? html`<div class="mut sm icap">${p.caption}</div>` : ''}<div class="sm mut ifoot">${driveState(p)[0]} ${driveState(p)[1]}${p.pillar ? ' · ' + p.pillar : ''}</div></div>`;
  mount(b, html`<div class="row" style="margin-bottom:12px;gap:8px"><span class="mut sm">${vivos.length} pieza${vivos.length === 1 ? '' : 's'} · arrastra para cambiar de estado</span><button class="chip ${arch ? 'dark' : ''}" data-pact="arch" aria-pressed="${arch ? 'true' : 'false'}" title="Lo publicado hace más de 30 días o archivado">${ico('folder', 13)} Archivo · ${archivo.length}</button><div class="sp"></div>${connectChip('drive', dr ? 'Drive conectado · actualizar' : 'Conectar con Drive', 'x', Boolean(dr), 'data-pact="drive"')}${dr ? html`<button class="sm mut" data-pact="driveset" style="margin:0 8px">Cambiar carpeta</button>` : ''}<button class="btn" data-pact="new">+ Pieza</button></div>
    ${arch ? html`<section class="igroup el-archive"><h4><i class="idot"></i><span>Archivo</span><span class="mut">${archivo.length}</span><span class="mut sm" style="font-weight:400">Lo publicado hace más de 30 días o marcado «Archivado»</span></h4>
      <div class="igrid">${archivo.length ? archivo.sort((a, z) => String(z.date || '').localeCompare(String(a.date || ''))).map((p) => card(p, estadoDe(p))) : html`<div class="iempty">Nada archivado todavía</div>`}</div></section>` : ''}
    <div class="ideas-board swap">${ESTADOS.map((s) => html`<section class="kcol igroup" data-st="${s}"><h4><i class="idot st-${PCLS[s] || 'idea'}"></i><span>${s}</span><span class="mut">${sorted(s).length}</span></h4>
      <div class="igrid">${sorted(s).map((p) => card(p, s))}${sorted(s).length ? '' : html`<div class="iempty">Arrastra aquí una pieza</div>`}</div></section>`)}</div>`);
  const save = (r) => { if (!r) return; list = list.some((x) => x.id === r.id) ? list.map((x) => (x.id === r.id ? r : x)) : [...list, r]; onChange(list); };
  b.onclick = async (e) => {
    const t = e.target.closest('[data-pact]'); if (!t) return;
    if (t.dataset.pact === 'new') return save(await editPost(profile, null, { brand: opts.brand }));
    if (t.dataset.pact === 'arch') { showArch[profile] = !showArch[profile]; return postsBoard(b, profile, list, onChange, opts); }
    if (t.dataset.pact === 'drive' || t.dataset.pact === 'driveset') {
      if (dr && t.dataset.pact === 'drive') { try { const m = await syncDrive(profile, list); toast(m.length ? `${m.length} pieza${m.length === 1 ? '' : 's'} nueva${m.length === 1 ? '' : 's'} desde Drive` : 'Ya está al día con Drive'); if (m.length) onChange([...list, ...m]); } catch (err) { toast(err.message, true); } return; }
      const v = await askF('Conectar «Por postear» con Drive', [{ k: 'url', l: 'Link de la carpeta de Drive con las piezas listas (videos e imágenes)', v: dr, req: true }], 'Conectar');
      if (!v) return;
      try { await api('content/connect', { method: 'PUT', body: { profile, postear_drive: v.url } }); conn[profile] = { ...conn[profile], postear_drive: v.url }; const m = await syncDrive(profile, list); toast(`Conectado${m.length ? ` · ${m.length} piezas` : ''}`); onChange([...list, ...m]); } catch (err) { toast(err.message, true); }
      return;
    }
    const p = list.find((x) => x.id === t.dataset.id); if (p) openPost(p);
  };
  // Los archivos de la pieza (foto, video, lámina) que ya están en Drive: miniatura, link y subir uno más.
  const miniatura = (a) => (/^image\//.test(a.mime || '') ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(a.id)}&sz=w320` : '');
  function assetsHtml(p) {
    const l = p.assets || [];
    return html`<b class="sm" style="display:block;margin-top:18px">Archivos en Drive${l.length ? ` · ${l.length}` : ''} <span id="as-ojo">${ojoChip(p.ojo, { compact: true })}</span></b>
      ${l.length ? html`<div class="as-grid">${l.map((a) => html`<div class="as-i">${miniatura(a) ? html`<a href="${a.link || '#'}" target="_blank" rel="noopener noreferrer"><img src="${miniatura(a)}" alt="${a.name}" loading="lazy"></a>` : html`<a class="as-f" href="${a.link || '#'}" target="_blank" rel="noopener noreferrer">${ico(/^video\//.test(a.mime || '') ? 'video' : 'doc', 18)}</a>`}
        <span class="as-n" title="${a.name}">${a.name}</span><button type="button" class="as-x" data-act="aquitar" data-id="${a.id}" aria-label="Quitar de la pieza">×</button></div>`)}</div>` : html`<p class="mut sm" style="margin-top:4px">Todavía no hay archivos: sube la foto, el video o la lámina y queda en Drive, ligado a esta pieza.</p>`}
      <div class="row" style="gap:8px;margin-top:8px;align-items:center"><button type="button" class="btn ghost xs" data-act="asub">${ico('upload', 13)} Subir a Drive</button><span class="mut sm" id="as-prog"></span><input type="file" id="as-file" accept="image/*,video/*,.pdf" style="display:none"></div>`;
  }
  function openPost(p) {
    queueMicrotask(() => { const i = $('#as-file'); if (i) i.onchange = () => subirAsset(p, i.files[0]); });
    // El ojo visual sobre la primera imagen de la pieza (si el puente lo tiene): queda guardado en la pieza.
    if (!p.ojo && profile) { const a = (p.assets || []).find((x) => /^image\//.test(x.mime || '')); const url = a ? miniatura(a) : /^https:\/\/.*\.(png|jpe?g|webp)(\?|$)/i.test(p.url || '') ? p.url : ''; if (url) verImagen(profile, { url }).then(async (r) => { if (!r) return; try { const s = await C.save({ ...p, ojo: r }); save(s); } catch { /* se queda sin guardar */ } const el = $('#as-ojo'); if (el) el.innerHTML = String(ojoChip(r, { compact: true })); }).catch(() => {}); }
    queueMicrotask(() => layaBox(document.getElementById('laya-idea'), { coll: 'content', id: p.id })); // Fase 3 · Laya: ¿engancha?, ¿suena a la marca?
    const em = embedUrl(p.url);
    const e = estadoDe(p);
    drawer(html`<div class="row"><span class="chip ${PCLS[e]}">${e}</span><span class="chip">${p.format || 'Pieza'}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
      <h2>${p.title}</h2><div class="mut sm" style="margin-top:2px">${nombreDe(p, opts.brand)}</div><div class="mut">${p.date ? 'Sale el ' + fdate(p.date) : 'Sin fecha'}${p.published_at ? ` · publicado el ${fdate(p.published_at)}` : ''}</div>
      ${em ? html`<iframe src="${em}" style="width:100%;aspect-ratio:9/12;border:0;border-radius:18px;margin-top:16px;background:#1a120c" allow="autoplay; fullscreen" loading="lazy"></iframe>` : p.url ? html`<a class="artifact" href="${p.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin-top:14px"><span class="fi">${ico('play', 13)}</span><div><b style="font-weight:500">Abrir video</b></div></a>` : ''}
      ${p.caption ? html`<b class="sm" style="display:block;margin-top:18px">Caption</b><p style="white-space:pre-wrap;margin-top:6px">${p.caption}</p>` : ''}
      ${assetsHtml(p)}
      <div id="laya-idea" style="margin-top:16px"></div>
      ${e === 'En proceso' ? html`<div class="row" style="margin-top:18px;gap:8px"><button class="btn ${p.por_aprobar ? 'ghost' : ''}" data-act="aprob">${p.por_aprobar ? 'Quitar de aprobación' : 'Enviar a aprobación'}</button><span class="mut sm">${p.por_aprobar ? 'El cliente la ve en «Por aprobar»' : 'El cliente solo aprueba lo que envías aquí'}</span></div>` : ''}
      <b class="sm" style="display:block;margin-top:18px">Mover a</b>
      <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:8px">${ESTADOS_TODOS.map((s) => html`<button class="chip ${s === e ? 'dark' : ''}" data-act="st" data-s="${s}" style="padding:8px 12px" title="${ESTADO_AYUDA[s]}">${s}</button>`)}</div>
      <div class="row" style="margin-top:22px"><button class="btn" data-act="edit">Editar</button>${profile ? html`<a class="btn ghost" href="${rutaModulo(profile, 'creacion', p.guion ? [p.guion] : ['nuevo', `post:${p.id}`])}" data-act="aguion">${ico('edit', 14)} ${p.guion ? 'Ver el guion' : 'Convertir en guion'}</a>` : ''}<div class="sp"></div><button class="btn ghost" data-act="del">${ico('trash')}</button></div>`, {
      st: async (t) => { try { const r = await C.save(conEstado(p, t.dataset.s)); save(r); openPost(r); } catch (err) { toast(err.message, true); } },
      aprob: async () => { try { const { aprobacion, ...rest } = p; const r = await C.save(p.por_aprobar ? { ...p, por_aprobar: false } : { ...rest, por_aprobar: true }); save(r); openPost(r); toast(r.por_aprobar ? 'Enviada: el cliente ya la ve en «Por aprobar»' : 'Quitada de aprobación'); } catch (err) { toast(err.message, true); } },
      aguion: () => closeDrawer(),
      edit: async () => { closeDrawer(); save(await editPost(profile, p, { brand: opts.brand })); },
      asub: () => $('#as-file')?.click(),
      aquitar: async (t) => { try { const r = await C.save({ ...p, assets: (p.assets || []).filter((a) => a.id !== t.dataset.id) }); save(r); openPost(r); } catch (err) { toast(err.message, true); } },
      del: async () => { if (!(await confirmAsk(`¿Eliminar «${p.title}»?`))) return; await C.remove(p.id); closeDrawer(); list = list.filter((x) => x.id !== p.id); onChange(list); },
    });
  }
  // Subir un archivo a Drive y dejarlo en la pieza (en la carpeta de piezas de la marca, si está conectada).
  async function subirAsset(p, file) {
    if (!file) return;
    const bar = $('#as-prog'); if (bar) bar.textContent = 'Subiendo… 0%';
    try {
      const f = await uploadToDrive(file, file.name, (x) => { if (bar) bar.textContent = `Subiendo… ${Math.round(x * 100)}%`; }, conn[profile]?.postear_drive || {});
      const r = await C.save({ ...p, assets: [...(p.assets || []), { id: f.id, name: f.name, mime: f.mime, link: f.link, at: new Date().toISOString() }] });
      save(r); openPost(r); toast('Subido a Drive');
    } catch (err) { if (bar) bar.textContent = ''; toast(err.message, true); }
  }
  $$('.kcard', b).forEach((c) => c.addEventListener('dragstart', (e) => e.dataTransfer.setData('id', c.dataset.id)));
  $$('.kcard', b).forEach((c) => c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); } }));
  $$('.kcol', b).forEach((k) => {
    k.addEventListener('dragover', (e) => { e.preventDefault(); k.classList.add('over'); });
    k.addEventListener('dragleave', () => k.classList.remove('over'));
    k.addEventListener('drop', async (e) => {
      e.preventDefault(); k.classList.remove('over');
      const p = list.find((x) => x.id === e.dataTransfer.getData('id'));
      if (!p || estadoDe(p) === k.dataset.st) return;
      try { save(await C.save(conEstado(p, k.dataset.st))); } catch (err) { toast(err.message, true); }
    });
  });
}
