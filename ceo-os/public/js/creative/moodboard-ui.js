// Vista de Moodboard Studio (herramienta moodboard-studio de Creative). NO usa el Tool Shell: su casa es brand_boards (images extendido
// y direcciones), el mismo tablero que sigue usando Mi marca. Arriba 2 o 3 direcciones (que citan imágenes por su índice real); abajo un
// masonry por zonas (Color, Textura, Foto, Tipografía, Personas, Referentes) con nota y chip del ojo por imagen (sin CLIP no hay chip,
// nunca 0%). Solo links https o archivos subidos a Drive. «Quitar» archiva (el índice se conserva). Guarda con la v leída (409).
// Edita solo quien edita Clientes (canEdit(me,'clients')). Pinta con html`…`: lo del modelo pasa por limpiar() y nunca por raw().
import { html, mount, col, ico, toast, acts, skel, confirmAsk, uploadToDrive, $ } from '../core.js';
import { canEdit } from '../roleviews.js';
import { herramientaDe } from '../herramientas.js';
import { armarCtx, correrIA } from '../ia-herramienta.js';
import { ojoEstado, verImagen, ojoChip } from '../ojo.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { BLOQUE, ZONAS, MAX_IMAGENES, esHttps, zonaDe, limpiarImagenes, porZona, limpiar, faltas, prompt, leer } from './moodboard.js';
import { fallo, vacio } from '../visual.js';

const BB = col('brand_boards');
const driveThumb = (id) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w800`;

export async function moodboardTool(host, { me, slug, b, alive } = {}) {
  mount(host, skel('pagina'));
  const T = { id: 'moodboard-studio', ws: 'creative', nombre: 'Moodboard Studio', ...herramientaDe('moodboard-studio'), prompt, bloque: BLOQUE };
  const S = { doc: null, nuevo: false, imgs: [], dirs: [], prop: null, ocupado: '', ojo: { on: false }, zona: 'foto' };
  const edit = canEdit(me, 'clients'), nombre = b?.name || slug;
  const canDrive = Boolean(me?.google?.drive);
  const hayOjo = () => Boolean(S.ojo?.on && S.ojo?.disponible);

  async function leerTodo() {
    const r = await BB.get(slug).then((d) => ({ d, nuevo: false })).catch((e) => (e.status === 404 ? { d: { id: slug }, nuevo: true } : Promise.reject(e)));
    S.doc = r.d; S.nuevo = r.nuevo; S.imgs = limpiarImagenes(r.d.images); S.dirs = limpiar(r.d.direcciones, S.imgs.length).direcciones;
    S.ojo = await ojoEstado().catch(() => ({ on: false }));
  }
  // Guarda images y direcciones juntas, con la v leída. repintar:false deja en paz el campo donde se escribe.
  async function guardar({ repintar = true } = {}) {
    if (!edit) return false;
    const next = { id: slug, images: [], pinterest: '', spotify: '', people: [], brands: [], tone: [], dont: [], ...S.doc, images: limpiarImagenes(S.imgs), direcciones: limpiar({ direcciones: S.dirs }, S.imgs.length).direcciones };
    try { const r = S.nuevo ? await BB.create(next) : await BB.save(next); S.doc = r; S.nuevo = false; S.imgs = limpiarImagenes(r.images); S.dirs = limpiar(r.direcciones, S.imgs.length).direcciones; toast('Guardado'); if (repintar) pintar(); return true; }
    catch (e) {
      toast(e.status === 409 ? 'Alguien más guardó el tablero. Recargo lo último: repite tu cambio.' : e.status === 403 ? 'Este tablero está fuera de tu alcance' : e.message, true);
      if (e.status === 409) { await leerTodo().catch(() => {}); pintar(); }
      return false;
    }
  }

  // ---------- Pintar ----------
  const tile = (im) => html`<figure class="mb-tile ${im.fijada ? 'fija' : ''}" data-i="${im.i}">
    <a href="${im.link || im.url}" target="_blank" rel="noopener noreferrer"><img src="${im.url}" alt="${im.nota || 'Referencia ' + im.i}" loading="lazy" referrerpolicy="no-referrer"></a>
    <span class="mb-n">#${im.i}</span>${im.ojo ? html`<span class="mb-ojo">${ojoChip(im.ojo, { compact: true })}</span>` : ''}
    <figcaption><input data-nota="${im.i}" value="${im.nota}" placeholder="Nota: qué te dice esta imagen" ${edit ? '' : 'disabled'}>${im.fuente ? html`<span class="mut sm">${im.fuente}</span>` : ''}
      ${edit ? html`<div class="mb-acts"><button data-act="fijar" data-i="${im.i}" title="${im.fijada ? 'Quitar de fijadas' : 'Fijar'}">${ico('pin', 14)}</button>
        <select data-zona="${im.i}" title="Mover de zona">${ZONAS.map((z) => html`<option value="${z.id}" ${z.id === im.zona ? 'selected' : ''}>${z.nombre}</option>`)}</select>
        ${hayOjo() ? html`<button data-act="ojo" data-i="${im.i}" title="Ver con el ojo">${ico('eye', 14)}</button>` : ''}<button data-act="quitar" data-i="${im.i}" title="Quitar (se archiva)">${ico('x', 14)}</button></div>` : ''}</figcaption></figure>`;
  const dir = (d, k) => html`<article class="mb-dir"><div class="mb-dir-h"><b>${k + 1}</b><input data-dnombre="${k}" value="${d.nombre}" placeholder="Nombre de la dirección" ${edit ? '' : 'disabled'}>${edit ? html`<button data-act="quitardir" data-k="${k}" title="Quitar dirección">${ico('x', 14)}</button>` : ''}</div>
    <p>${d.idea || SIN_DATOS}</p>${d.palabras.length ? html`<div class="mb-pal">${d.palabras.map((w) => html`<span class="chip">${w}</span>`)}</div>` : ''}
    ${d.paleta.length ? html`<div class="mb-sw">${d.paleta.map((c) => html`<span style="background:${c}" title="${c}"></span>`)}</div>` : ''}
    <div class="mb-refs">${d.refs.map((i) => (S.imgs[i] ? html`<a href="#mb-${i}" data-act="ir" data-i="${i}" title="#${i}"><img src="${S.imgs[i].url}" alt="#${i}" loading="lazy" referrerpolicy="no-referrer"></a>` : '')) || ''}${d.refs.length ? '' : html`<span class="mut sm">${SIN_DATOS}: no cita ninguna imagen</span>`}</div></article>`;

  function pintar() {
    if (!alive()) return;
    const z = porZona(S.imgs), vivas = S.imgs.filter((i) => !i.archivada).length, f = faltas({ direcciones: S.dirs }, { imagenes: S.imgs });
    mount(host, html`<div class="mb" id="mb-raiz">
      <div class="mb-top"><div><h2>Moodboard Studio</h2><span class="mut sm">${nombre} · ${vivas} ${vivas === 1 ? 'imagen' : 'imágenes'} · ${S.dirs.length} ${S.dirs.length === 1 ? 'dirección' : 'direcciones'}</span></div><span class="sp"></span>
        ${hayOjo() ? html`<span class="chip lime" title="El ojo compara cada imagen con el moodboard y la descripción de la marca">${ico('eye', 12)} Ojo encendido</span>` : html`<span class="chip" title="Sin el puente de tu compu (CLIP) no hay chip de parecido">${ico('eye', 12)} Sin ojo: no hay chip</span>`}
        ${edit && hayOjo() && vivas ? html`<button class="btn ghost xs" data-act="ojotodas" ${S.ocupado ? 'disabled' : ''}>${S.ocupado === 'ojo' ? 'Mirando…' : 'Mirar todas'}</button>` : ''}</div>
      <section class="mb-dirs"><div class="mb-sec-h"><h3>Direcciones</h3><span class="sp"></span>${edit ? html`<button class="btn xs" data-act="gen" ${vivas && !S.ocupado ? '' : 'disabled'} title="${vivas ? '' : 'Primero suma imágenes al moodboard'}">${ico('sparkles', 13)} ${S.ocupado === 'gen' ? 'Generando…' : 'Generar direcciones'}</button>` : ''}</div>
        ${S.prop ? html`<div class="mb-prop"><b>${ico('sparkles', 13)} Propuesta de la IA (${S.prop.length})</b><div class="mb-dirs-g">${S.prop.map((d, k) => dir(d, k))}</div><div class="mb-acts2"><button class="btn xs" data-act="aceptar">${ico('check', 13)} Aceptar y guardar</button><button class="btn ghost xs" data-act="descartar">Descartar</button></div></div>` : ''}
        ${S.dirs.length ? html`<div class="mb-dirs-g">${S.dirs.map(dir)}</div>` : html`${vacio({ icono: 'inbox', titulo: 'Sin direcciones', linea: `${SIN_DATOS}: salen de este moodboard. Suma imágenes y genera 2 o 3 direcciones que citen las que ya tienes.`, compacto: true })}`}</section>
      ${edit ? html`<section class="mb-add"><select id="mb-zona">${ZONAS.map((x) => html`<option value="${x.id}" ${x.id === S.zona ? 'selected' : ''}>${x.nombre}</option>`)}</select><input id="mb-url" placeholder="https://… link de la imagen"><button class="btn xs" data-act="addurl">${ico('plus', 13)} Sumar link</button>
        <label class="btn ghost xs" ${canDrive ? '' : 'title="Conecta tu Drive para subir"'}>${ico('plus', 13)} Subir a Drive<input type="file" accept="image/*" multiple hidden data-up ${canDrive ? '' : 'disabled'}></label></section>` : ''}
      ${ZONAS.map((zn) => html`<section class="mb-zona"><div class="mb-sec-h"><h3>${zn.nombre}</h3><span class="mut sm">${z[zn.id].length}</span></div>
        ${z[zn.id].length ? html`<div class="mb-masonry">${z[zn.id].map((im) => html`<span id="mb-${im.i}">${tile(im)}</span>`)}</div>` : html`<p class="mut sm">${SIN_DATOS}: sin imágenes en ${zn.nombre}</p>`}</section>`)}
      ${f.length ? html`<section class="mb-sec"><h3>Para cerrar el moodboard</h3><ul>${f.map((m) => html`<li>${m}</li>`)}</ul></section>` : ''}</div>`);
  }

  // ---------- Cambios que no repintan ----------
  host.addEventListener('change', async (e) => {
    const t = e.target; if (!edit || !t.dataset) return;
    if (t.dataset.nota !== undefined) { const im = S.imgs[+t.dataset.nota]; if (im) { im.nota = t.value; await guardar({ repintar: false }); } }
    else if (t.dataset.dnombre !== undefined) { const d = S.dirs[+t.dataset.dnombre]; if (d) { d.nombre = t.value; await guardar({ repintar: false }); } }
    else if (t.dataset.zona !== undefined) { const im = S.imgs[+t.dataset.zona]; if (im) { im.zona = zonaDe(t.value); await guardar(); } }
    else if (t.id === 'mb-zona') S.zona = zonaDe(t.value);
    else if (t.dataset.up !== undefined) {
      const files = [...(t.files || [])].slice(0, 12); if (!files.length) return;
      toast(`Subiendo ${files.length} ${files.length === 1 ? 'imagen' : 'imágenes'} a Drive…`);
      for (const f of files) { try { const r = await uploadToDrive(f, `Moodboard · ${nombre} · ${f.name}`, () => {}, {}); S.imgs.push({ url: driveThumb(r.id), link: r.link, drive_id: r.id, zona: S.zona, nota: '', fuente: 'Drive' }); } catch (er) { toast(`${f.name}: ${er.message}`, true); } }
      t.value = ''; S.imgs = limpiarImagenes(S.imgs); await guardar();
    }
  });
  async function mirar(i) {
    const im = S.imgs[i]; if (!im) return;
    try { const r = await verImagen(slug, { url: im.url }); im.ojo = r && r.parecido > 0 ? { parecido: r.parecido, refs: r.refs || 0, at: r.at } : null; if (!im.ojo) toast('El ojo no pudo medir esta imagen', true); } catch (e) { toast(e.message, true); }
  }
  async function generar() {
    S.ocupado = 'gen'; pintar();
    try {
      const base = await armarCtx(me, { tool: T, slug });
      const r = await correrIA(me, { tool: T, ctx: { ...base, imagenes: S.imgs } });
      const l = leer(r.texto), d = l ? limpiar(l.contenido, S.imgs.length).direcciones : [];
      if (!d.length) toast('La IA no devolvió direcciones que se puedan leer. Reintenta.', true); else { S.prop = d; toast('Propuesta lista: revisa y acepta'); }
    } catch (e) { if (e.name !== 'AbortError') toast(e.message, true); }
    S.ocupado = ''; pintar();
  }
  acts(host, {
    addurl: async () => {
      const u = ($('#mb-url', host)?.value || '').trim();
      if (!esHttps(u)) return toast('Solo links que empiecen con https://', true);
      if (S.imgs.length >= MAX_IMAGENES) return toast(`Máximo ${MAX_IMAGENES} imágenes`, true);
      S.imgs.push({ url: u, zona: S.zona, nota: '', fuente: 'Link' }); await guardar();
    },
    fijar: async (t) => { const im = S.imgs[+t.dataset.i]; if (im) { im.fijada = !im.fijada; await guardar(); } },
    quitar: async (t) => { const im = S.imgs[+t.dataset.i]; if (!im) return; if (!(await confirmAsk('¿Quitar esta imagen? Se archiva: su número se conserva.'))) return; im.archivada = true; await guardar(); },
    quitardir: async (t) => { S.dirs.splice(+t.dataset.k, 1); await guardar(); },
    ojo: async (t) => { await mirar(+t.dataset.i); await guardar(); },
    ojotodas: async () => { S.ocupado = 'ojo'; pintar(); for (let i = 0; i < S.imgs.length; i++) if (!S.imgs[i].archivada && !S.imgs[i].ojo) await mirar(i); S.ocupado = ''; await guardar(); },
    gen: generar,
    aceptar: async () => { S.dirs = S.prop; S.prop = null; await guardar(); },
    descartar: () => { S.prop = null; pintar(); },
    ir: (t, e) => { e.preventDefault(); document.getElementById('mb-' + t.dataset.i)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
  });

  try { await leerTodo(); } catch (e) { if (alive()) mount(host, html`${fallo({ titulo: 'No pude leer el moodboard', linea: e.status === 403 ? 'Este tablero está fuera de tu alcance.' : e.message })}`); return; }
  pintar();
}
