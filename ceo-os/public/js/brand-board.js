import { html, raw, mount, col, acts, ask, confirmAsk, toast, ico, $, $$, uploadToDrive } from './core.js';
import { fallo } from './visual.js';

// Asociaciones de una marca (Mi marca → Asociaciones · Cliente → Marca): el moodboard (imágenes por link o subidas a Drive,
// más el tablero de Pinterest), la música (una playlist de Spotify embebida), las personas y las marcas con las que se asocia.
// Para un cliente (business) se suma el tono en 3 palabras y el no-hacer. Vive en brand_boards con id = «personal» o el slug del cliente.
const BB = col('brand_boards');
const HTTPS = /^https:\/\/\S+$/;
const safeUrl = (u) => (HTTPS.test(String(u || '')) ? u : '#');
// Un link de Spotify (playlist, álbum, canción o artista) → su embed oficial.
export const spotifyEmbed = (u) => { const m = String(u || '').match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(playlist|album|track|artist)\/([A-Za-z0-9]+)/); return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null; };
// La imagen de un archivo de Drive, como la sirve Drive (img-src la permite).
const driveThumb = (id) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w800`;
const empty = (id) => ({ id, images: [], pinterest: '', spotify: '', people: [], brands: [], tone: [], dont: [] });

// ctx: { el, me, id, name, edit, business, folder } → pinta el tablero en el, con sus acciones (isla: no le habla a la pantalla de afuera).
export async function brandBoard({ el, me, id, name, edit, business = false, folder = '' }) {
  el.dataset.island = '1';
  mount(el, html`<p class="loading">Cargando…</p>`);
  let doc = null, isNew = false;
  try { doc = await BB.get(id); } catch (e) { if (e.status === 404) { doc = empty(id); isNew = true; } else return mount(el, html`${fallo({ titulo: 'No pude leer las asociaciones', linea: e.message })}`); }
  doc = { ...empty(id), ...doc };
  const canDrive = Boolean(me?.google?.drive);

  const save = async (patch) => {
    const next = { ...doc, ...patch };
    try { const r = isNew ? await BB.create(next) : await BB.save(next); doc = { ...empty(id), ...r }; isNew = false; toast('Guardado'); paint(); return true; }
    catch (e) { toast(e.message, true); return false; }
  };
  // Personas y marcas: cada una es una tile (inicial, nombre, por qué); editar y quitar aparecen al pasar.
  const refList = (title, key, hint) => { const list = doc[key] || []; return html`<section class="sp-panel" style="padding-bottom:18px"><div class="wkhead"><div><h3 class="ttl">${ico(key === 'people' ? 'user' : 'tag')} ${title}</h3><span class="mut sm">${hint}</span></div><div class="sp"></div>${edit ? html`<button class="btn ghost xs" data-act="refadd" data-k="${key}">+ ${key === 'people' ? 'Persona' : 'Marca'}</button>` : ''}</div>
    ${list.length ? html`<div class="sp-tiles" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin-top:10px">${list.map((x, i) => html`<div class="sp-tile ref"><div class="sp-tile-top"><span class="sp-mono ${key === 'people' ? '' : 't1'}" style="${key === 'people' ? 'border-radius:50%' : ''}">${String(x.name || '?').trim()[0].toUpperCase()}</span></div>
      <div class="sp-tile-name">${HTTPS.test(x.url || '') ? html`<a href="${x.url}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">${x.name} ↗</a>` : x.name}</div><div class="why">${x.why || ''}</div>
      ${edit ? html`<div class="acts"><button data-act="refedit" data-k="${key}" data-i="${i}" title="Editar">${ico('edit', 14)}</button><button data-act="refdel" data-k="${key}" data-i="${i}" title="Quitar">${ico('x', 14)}</button></div>` : ''}</div>`)}</div>` : html`<div class="mut sm" style="padding:10px 0 0">Nadie todavía.</div>`}</section>`; };

  function paint() {
    const sp = spotifyEmbed(doc.spotify), imgs = doc.images || [];
    mount(el, html`
      <section class="sp-panel" style="margin-bottom:16px;padding-bottom:20px"><div class="wkhead" style="flex-wrap:wrap"><h3 class="ttl">${ico('image')} Moodboard</h3><span class="mut sm" style="display:inline">${imgs.length} ${imgs.length === 1 ? 'imagen' : 'imágenes'}</span><div class="sp"></div>
          ${HTTPS.test(doc.pinterest) ? html`<a class="chip" href="${doc.pinterest}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;padding:7px 12px">${ico('pin')} Tablero de Pinterest ↗</a>` : ''}
          ${edit ? html`<button class="btn ghost xs" data-act="pin">${doc.pinterest ? 'Cambiar Pinterest' : '+ Link de Pinterest'}</button>` : ''}</div>
        <div class="mut sm" style="margin:6px 0 2px">Lo que se ve, se siente y se quiere parecer. Pega links de imágenes (los pines de Pinterest sirven) o súbelas a Drive.</div>
        <div class="mbgrid sp-masonry">${imgs.map((x, i) => html`<div class="mbimg" title="${x.note || ''}"><img src="${safeUrl(x.url)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="ph">${ico('image', 18)}<br>${x.link || x.url ? html`<a href="${safeUrl(x.link || x.url)}" target="_blank" rel="noopener noreferrer" style="color:inherit">Ver imagen ↗</a>` : 'Sin vista previa'}</span>${x.note ? html`<span class="n">${x.note}</span>` : ''}${edit ? html`<button class="x" data-act="imgdel" data-i="${i}" title="Quitar">${ico('x', 14)}</button>` : ''}</div>`)}
          ${edit ? html`<button class="mbadd" data-act="imgurl"><span>${ico('plus', 18)}<br>Por link</span></button>${canDrive ? html`<button class="mbadd" data-act="imgup"><span>${ico('upload', 18)}<br>Subir a Drive</span></button>` : ''}` : ''}
          ${!imgs.length && !edit ? html`<div class="mut sm" style="grid-column:1/-1">Sin imágenes todavía.</div>` : ''}</div>
        <input type="file" accept="image/*" multiple hidden data-act="up"></section>
      ${business ? html`<div class="grid g11" style="align-items:start;margin-bottom:16px">
        <div class="sp-panel" style="padding-bottom:18px"><div class="wkhead"><h3 class="ttl">${ico('chat')} Tono en 3 palabras</h3><div class="sp"></div>${edit ? html`<button class="btn ghost xs" data-act="tone">Editar</button>` : ''}</div>
          <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">${(doc.tone || []).filter(Boolean).length ? doc.tone.filter(Boolean).map((t) => html`<span class="chip dark tonechip">${t}</span>`) : html`<span class="mut sm">Cómo suena la marca, en tres palabras.</span>`}</div></div>
        <div class="sp-panel" style="padding-bottom:18px"><div class="wkhead"><h3 class="ttl">${ico('alert')} No-hacer</h3><div class="sp"></div>${edit ? html`<button class="btn ghost xs" data-act="dont">Editar</button>` : ''}</div>
          ${(doc.dont || []).filter(Boolean).length ? html`<ul style="margin:10px 0 0 18px;font-size:14px;line-height:1.7">${doc.dont.filter(Boolean).map((d) => html`<li>${d}</li>`)}</ul>` : html`<div class="mut sm" style="margin-top:10px">Lo que esta marca nunca hace ni dice.</div>`}</div></div>`
      : html`<section class="sp-panel" style="margin-bottom:16px;padding-bottom:18px"><div class="wkhead" style="flex-wrap:wrap"><h3 class="ttl">${ico('music')} Música</h3><div class="sp"></div>${HTTPS.test(doc.spotify) ? html`<a class="chip" href="${doc.spotify}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;padding:7px 12px">Abrir en Spotify ↗</a>` : ''}${edit ? html`<button class="btn ghost xs" data-act="spotify">${doc.spotify ? 'Cambiar playlist' : '+ Playlist de Spotify'}</button>` : ''}</div>
        ${sp ? html`<div class="spembed"><iframe src="${sp}" title="Spotify" loading="lazy" allow="encrypted-media; clipboard-write; fullscreen"></iframe></div>` : doc.spotify ? html`<div class="mut sm" style="margin-top:8px">Ese link no es una playlist, álbum o canción de Spotify.</div>` : html`<div class="mut sm" style="margin-top:8px">La playlist que suena como la marca.</div>`}</section>`}
      <div class="grid" style="gap:16px">${refList('Personas', 'people', business ? 'Referentes y voces con las que el negocio quiere que lo asocien.' : 'Con quién quieres que te asocien y por qué.')}${refList('Marcas', 'brands', business ? 'Las marcas que marcan el estándar que esta busca.' : 'Las marcas que se parecen a lo que quieres construir.')}</div>`);
    // Si una imagen no carga (host fuera de la política de imágenes o link roto) queda el link para abrirla.
    $$('.mbimg img', el).forEach((im) => im.addEventListener('error', () => im.closest('.mbimg').classList.add('broken')));
  }

  const refForm = async (key, x) => { const v = await ask(`${x ? 'Editar' : 'Nueva'} ${key === 'people' ? 'persona' : 'marca'}`, [{ k: 'name', l: 'Nombre', v: x?.name, req: true }, { k: 'why', l: 'Por qué', t: 'textarea', v: x?.why }, { k: 'url', l: 'Link (opcional)', v: x?.url }]); if (!v) return null; if (v.url && !HTTPS.test(v.url)) { toast('El link debe empezar con https://', true); return null; } return v; };
  acts(el, {
    pin: async () => { const v = await ask('Tablero de Pinterest', [{ k: 'u', l: 'Link del tablero', v: doc.pinterest }]); if (!v) return; if (v.u && !/^https:\/\/([a-z]{2,3}\.)?pinterest\.[a-z.]+\//.test(v.u)) return toast('Pega el link de un tablero de Pinterest', true); save({ pinterest: v.u }); },
    spotify: async () => { const v = await ask('Playlist de Spotify', [{ k: 'u', l: 'Link de la playlist', v: doc.spotify }]); if (!v) return; if (v.u && !spotifyEmbed(v.u)) return toast('Pega el link de una playlist de Spotify (open.spotify.com/playlist/…)', true); save({ spotify: v.u }); },
    imgurl: async () => { const v = await ask('Imagen por link', [{ k: 'url', l: 'Link https de la imagen', req: true }, { k: 'note', l: 'Nota (opcional)' }]); if (!v) return; if (!HTTPS.test(v.url)) return toast('El link debe empezar con https://', true); save({ images: [...doc.images, { url: v.url, note: v.note }] }); },
    imgup: () => $('input[type=file]', el).click(),
    imgdel: async (t) => { if (await confirmAsk('¿Quitar esta imagen del moodboard?')) save({ images: doc.images.filter((_, i) => i !== +t.dataset.i) }); },
    tone: async () => { const v = await ask('Tono en 3 palabras', [0, 1, 2].map((i) => ({ k: 't' + i, l: `Palabra ${i + 1}`, v: doc.tone?.[i] || '' }))); if (!v) return; save({ tone: [v.t0, v.t1, v.t2].map((x) => x.trim()).filter(Boolean).slice(0, 3) }); },
    dont: async () => { const v = await ask('No-hacer', [{ k: 'l', l: 'Uno por línea', t: 'textarea', v: (doc.dont || []).join('\n') }]); if (!v) return; save({ dont: v.l.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 20) }); },
    refadd: async (t) => { const v = await refForm(t.dataset.k, null); if (v) save({ [t.dataset.k]: [...(doc[t.dataset.k] || []), v] }); },
    refedit: async (t) => { const l = [...(doc[t.dataset.k] || [])]; const v = await refForm(t.dataset.k, l[+t.dataset.i]); if (v) { l[+t.dataset.i] = v; save({ [t.dataset.k]: l }); } },
    refdel: async (t) => { if (await confirmAsk('¿Quitar esta referencia?')) save({ [t.dataset.k]: (doc[t.dataset.k] || []).filter((_, i) => i !== +t.dataset.i) }); },
  });
  // Subir a Drive: la carpeta de assets del cliente si existe; la imagen queda en Drive y aquí su vista previa.
  acts(el, { up: async (inp) => {
    const files = [...(inp.files || [])].slice(0, 12); if (!files.length) return;
    toast(`Subiendo ${files.length} ${files.length === 1 ? 'imagen' : 'imágenes'} a Drive…`);
    const added = [];
    for (const f of files) { try { const r = await uploadToDrive(f, `Moodboard · ${name} · ${f.name}`, () => {}, folder ? { folder } : {}); added.push({ url: driveThumb(r.id), link: r.link, drive_id: r.id, note: '' }); } catch (e) { toast(`${f.name}: ${e.message}`, true); } }
    inp.value = '';
    if (added.length) save({ images: [...doc.images, ...added] });
  } }, 'change');
  paint();
}
