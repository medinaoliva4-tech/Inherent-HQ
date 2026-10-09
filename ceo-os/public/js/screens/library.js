import { html, raw, mount, col, api, acts, toast, fdate, ask, confirmAsk, drawer, closeDrawer, md, $, folderSvg, TONES, embedUrl, IC } from '../core.js';

// Library: SOPs, playbooks, videos y notas que el equipo escribe aquí, en carpetas.
// Una carpeta se puede conectar a una carpeta de Google Drive: se ve su contenido y se crean Docs ahí.
const KINDS = ['SOP', 'Playbook', 'Video', 'Nota'];
const KCOL = { SOP: '#4f7790', Playbook: '#7f9631', Video: '#26201a', Nota: '#c2735a' };
const MIME = (m) => (/folder/.test(m) ? ['DIR', '#6b6b66'] : /document/.test(m) ? ['DOC', '#4f7790'] : /spreadsheet/.test(m) ? ['XLS', '#3c8a4a'] : /presentation/.test(m) ? ['PPT', '#d08a2e'] : /pdf/.test(m) ? ['PDF', '#c8432f'] : /video/.test(m) ? ['MP4', '#26201a'] : /image/.test(m) ? ['IMG', '#8a5fa8'] : ['FILE', '#8f877b']);
const driveOk = (u) => /^https:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?folders\/[-\w]{20,}/.test(String(u || ''));

export async function render(el, { sub, alive }) {
  const F = col('folders'), D = col('docs');
  let [folders, docs] = await Promise.all([F.list(), D.list()]);
  let q = '';
  const [fid, did] = sub;

  async function newFolder(f) {
    const v = await ask(f ? 'Editar carpeta' : 'Nueva carpeta', [
      { k: 'name', l: 'Nombre', v: f?.name, req: true },
      { k: 'tone', l: 'Color', t: 'select', opts: TONES.map((t) => [t, t[0].toUpperCase() + t.slice(1)]), v: f?.tone || 'gris', half: true },
      { k: 'drive', l: 'Carpeta de Google Drive (opcional)', v: f?.drive, half: true },
      { k: 'desc', l: 'Para qué es', t: 'textarea', v: f?.desc },
    ]);
    if (!v) return null;
    if (v.drive && !driveOk(v.drive)) { toast('Pega el link de una carpeta de Drive (drive.google.com/drive/folders/…)', true); return null; }
    try { const r = f ? await F.save({ ...f, ...v }) : await F.create(v); folders = f ? folders.map((x) => (x.id === r.id ? r : x)) : [...folders, r]; toast('Carpeta guardada ✅'); return r; } catch (e) { toast(e.message, true); return null; }
  }
  async function newDoc(folderId) {
    const v = await ask('Nuevo documento', [
      { k: 'title', l: 'Título', req: true },
      { k: 'kind', l: 'Tipo', t: 'select', opts: KINDS.map((k) => [k, k]), half: true },
      { k: 'folder_id', l: 'Carpeta', t: 'select', opts: [['', '— Sin carpeta'], ...folders.map((f) => [f.id, f.name])], v: folderId || '', half: true },
      { k: 'url', l: 'Video o link (YouTube, Loom, Vimeo, Drive) — opcional' },
    ], 'Crear');
    if (!v) return;
    if (v.url && !/^https:\/\//.test(v.url)) return toast('El link debe empezar con https://', true);
    try { const r = await D.create({ ...v, body: '' }); location.hash = `/library/${r.folder_id || '_'}/${r.id}/edit`; } catch (e) { toast(e.message, true); }
  }
  const docRow = (d) => html`<tr class="click" data-act="doc" data-id="${d.id}"><td><span class="ftype" style="background:${KCOL[d.kind] || '#8f877b'}">${(d.kind || 'Doc').slice(0, 4).toUpperCase()}</span><b style="font-weight:500">${d.title}</b></td><td class="mut">${folders.find((f) => f.id === d.folder_id)?.name || '—'}</td><td class="mut">${d._meta?.updated_at ? fdate(String(d._meta?.updated_at).slice(0, 10)) : ''}</td><td class="mut sm">${d._meta?.updated_by || ''}</td></tr>`;

  // ---------- Inicio: carpetas + documentos recientes ----------
  function home() {
    const ql = q.toLowerCase();
    const list = docs.filter((d) => !ql || (d.title + ' ' + (d.body || '')).toLowerCase().includes(ql)).sort((a, z) => String(z._meta?.updated_at || '').localeCompare(String(a._meta?.updated_at || '')));
    mount(el, html`<div class="hello"><h1>Library</h1><p>SOPs, playbooks y videos. <em>Todo en un lugar.</em></p></div>
      <div class="row" style="margin-bottom:18px;gap:8px;flex-wrap:wrap"><input class="in" id="q" placeholder="Buscar en la library…" value="${q}" style="max-width:340px"><div class="sp"></div><button class="btn ghost" data-act="newFolder">+ Carpeta</button><button class="btn" data-act="newDoc">+ Documento</button></div>
      ${folders.length ? html`<div class="folders">${folders.map((f) => html`<div class="folder" data-act="folder" data-id="${f.id}">${folderSvg({ drive: Boolean(f.drive), tone: f.tone, video: docs.some((d) => d.folder_id === f.id && d.kind === 'Video') })}<b>${f.name}</b><span class="mut sm">${docs.filter((d) => d.folder_id === f.id).length} documentos${f.drive ? ' · Drive' : ''}</span></div>`)}</div>`
        : html`<div class="empty"><b>Todavía no hay carpetas</b>Crea la primera: «Onboarding de cliente», «Producción», «Playbooks de venta»… y conéctala a una carpeta de Drive si quieres.</div>`}
      <div class="sec-title"><h2>${q ? 'Resultados' : 'Recientes'}</h2></div>
      ${list.length ? html`<div class="card"><table><thead><tr><th>Documento</th><th>Carpeta</th><th>Actualizado</th><th>Por</th></tr></thead><tbody>${list.slice(0, 30).map(docRow)}</tbody></table></div>` : html`<div class="empty"><b>${q ? 'Nada con eso' : 'Sin documentos'}</b>${q ? 'Prueba otra palabra.' : 'Crea uno con «+ Documento».'}</div>`}`);
    const qi = $('#q', el); qi.oninput = () => { q = qi.value; const pos = qi.selectionStart; home(); const n = $('#q', el); n.focus(); n.setSelectionRange(pos, pos); };
  }

  // ---------- Carpeta: sus documentos + su Drive ----------
  async function folderPage(id) {
    const f = folders.find((x) => x.id === id);
    if (!f) return mount(el, html`<a class="btn ghost" href="#/library">← Library</a><div class="empty" style="margin-top:16px"><b>Esa carpeta no existe</b></div>`);
    let drive = null, dErr = null;
    const paint = () => {
      const list = docs.filter((d) => d.folder_id === id);
      mount(el, html`<div class="row" style="margin-bottom:14px"><a class="btn ghost" href="#/library">← Library</a></div>
        <div class="row" style="gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:20px"><div style="width:110px">${folderSvg({ w: 110, drive: Boolean(f.drive), tone: f.tone })}</div>
          <div style="flex:1;min-width:240px"><h1 style="font-size:46px;font-weight:500;letter-spacing:-1.4px">${f.name}</h1>${f.desc ? html`<div class="mut">${f.desc}</div>` : ''}</div>
          <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost" data-act="editFolder">Editar</button><button class="btn" data-act="newDocHere">+ Documento</button></div></div>
        <div class="sec-title" style="margin-top:0"><h2>Documentos</h2></div>
        ${list.length ? html`<div class="grid g3">${list.map((d) => html`<div class="card" data-act="doc" data-id="${d.id}" style="cursor:pointer"><div class="row"><span class="chip" style="background:${KCOL[d.kind] || '#8f877b'};color:#fff">${d.kind || 'Doc'}</span><div class="sp"></div>${d.url ? html`<span class="mut sm">▶ video</span>` : ''}</div><h3 style="font-size:19px;font-weight:500;letter-spacing:-.4px;margin-top:14px">${d.title}</h3><div class="mut sm" style="margin-top:6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${String(d.body || '').replace(/[#*>`|-]/g, '').slice(0, 200) || 'Vacío'}</div></div>`)}</div>`
          : html`<div class="empty"><b>Sin documentos aquí</b>Crea un SOP, playbook o video con «+ Documento».</div>`}
        <div class="sec-title"><h2>Google Drive</h2>${f.drive ? html`<div class="row" style="gap:8px"><button class="btn ghost" data-act="gnew" style="padding:8px 14px">+ Google Doc</button><a class="btn ghost" href="${f.drive}" target="_blank" rel="noopener noreferrer" style="padding:8px 14px;text-decoration:none">${IC.drive} Abrir en Drive</a></div>` : ''}</div>
        ${!f.drive ? html`<div class="empty"><b>Esta carpeta no está conectada a Drive</b>Dale «Editar» y pega el link de una carpeta de Google Drive para ver y crear archivos ahí.</div>`
          : drive === null ? html`<p class="loading">Leyendo tu Drive…</p>` : dErr ? html`<div class="warnbox">${dErr}</div>`
          : drive.files.length ? html`<div class="card"><table><thead><tr><th>Archivo</th><th>Dueño</th><th>Modificado</th></tr></thead><tbody>${drive.files.map((x) => { const [t, c] = MIME(x.mime); return html`<tr class="click" data-act="dfile" data-id="${x.id}"><td><span class="ftype" style="background:${c}">${t}</span><b style="font-weight:500">${x.name}</b></td><td class="mut">${x.owner || '—'}</td><td class="mut">${x.modified ? fdate(x.modified.slice(0, 10)) : ''}</td></tr>`; })}</tbody></table></div>`
          : html`<div class="empty"><b>La carpeta de Drive está vacía</b>Crea un Google Doc con el botón de arriba.</div>`}`);
    };
    const loadDrive = () => api(`google/drive?folder=${encodeURIComponent(f.drive)}`).then((r) => { drive = r; dErr = null; }).catch((e) => { drive = { files: [] }; dErr = e.message; }).then(() => alive() && paint());
    acts(el, {
      editFolder: async () => { const r = await newFolder(f); if (r) { Object.assign(f, r); drive = null; paint(); if (f.drive) loadDrive(); } },
      newDocHere: () => newDoc(id),
      doc: (t) => { location.hash = `/library/${id}/${t.dataset.id}`; },
      gnew: async () => { const v = await ask('Nuevo archivo en Drive', [{ k: 'name', l: 'Nombre', req: true }, { k: 'type', l: 'Tipo', t: 'select', opts: [['doc', 'Google Doc'], ['sheet', 'Google Sheet'], ['slides', 'Google Slides'], ['folder', 'Carpeta']] }], 'Crear'); if (!v) return;
        try { const r = await api('google/drive', { method: 'POST', body: { ...v, folder: f.drive } }); toast('Creado en tu Drive ✅'); if (r.link) window.open(r.link, '_blank', 'noopener'); drive = null; paint(); loadDrive(); } catch (e) { toast(e.message, true); } },
      dfile: (t) => { const x = drive.files.find((y) => y.id === t.dataset.id); const em = /folder/.test(x.mime) ? null : `https://drive.google.com/file/d/${x.id}/preview`;
        drawer(html`<div class="row"><span class="ftype" style="background:${MIME(x.mime)[1]}">${MIME(x.mime)[0]}</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div><h2>${x.name}</h2><div class="mut">${x.owner || ''}${x.modified ? ' · ' + fdate(x.modified.slice(0, 10)) : ''}</div>
          ${em ? html`<iframe src="${em}" style="width:100%;height:58vh;border:0;border-radius:18px;margin-top:16px;background:#fff" loading="lazy"></iframe>` : ''}
          <a class="btn" href="${x.link}" target="_blank" rel="noopener noreferrer" style="margin-top:16px;text-decoration:none;display:inline-flex">Abrir en Drive ↗</a>`); },
    });
    paint();
    if (f.drive) loadDrive();
  }

  // ---------- Documento: leer y editar ----------
  async function docPage(id) {
    let d = docs.find((x) => x.id === id);
    if (!d) return mount(el, html`<a class="btn ghost" href="#/library">← Library</a><div class="empty" style="margin-top:16px"><b>Ese documento no existe</b></div>`);
    let editing = sub[2] === 'edit';
    const back = d.folder_id ? `#/library/${d.folder_id}` : '#/library';
    const paint = () => {
      const em = embedUrl(d.url);
      mount(el, html`<div class="row" style="margin-bottom:14px;gap:8px"><a class="btn ghost" href="${back}">← ${folders.find((f) => f.id === d.folder_id)?.name || 'Library'}</a><div class="sp"></div>
          ${editing ? html`<button class="btn ghost" data-act="cancel">Cancelar</button><button class="btn" data-act="save">Guardar</button>` : html`<button class="btn ghost" data-act="del">🗑</button><button class="btn" data-act="edit">Editar</button>`}</div>
        <div class="card" style="padding:34px;max-width:980px;margin:0 auto">
          ${editing ? html`<div class="row" style="gap:10px;flex-wrap:wrap"><select class="in" id="dkind" style="width:auto">${KINDS.map((k) => html`<option ${k === d.kind ? raw('selected') : ''}>${k}</option>`)}</select><select class="in" id="dfolder" style="width:auto"><option value="">— Sin carpeta</option>${folders.map((f) => html`<option value="${f.id}" ${f.id === d.folder_id ? raw('selected') : ''}>${f.name}</option>`)}</select></div>
              <input class="in" id="dtitle" value="${d.title}" style="font-size:34px;font-weight:500;letter-spacing:-1px;border:0;padding:10px 0;background:transparent;margin-top:8px">
              <input class="in" id="durl" value="${d.url || ''}" placeholder="Video o link (YouTube, Loom, Vimeo, Drive) — opcional" style="margin-bottom:12px">
              <div class="grid g11" style="gap:14px"><textarea class="in" id="dbody" style="min-height:58vh;font-family:ui-monospace,Menlo,monospace;font-size:13.5px;line-height:1.6" placeholder="# Título&#10;&#10;1. Primer paso&#10;2. Segundo paso&#10;&#10;> Nota importante">${d.body || ''}</textarea><div class="card glass" id="dprev" style="min-height:58vh;overflow:auto">${md(d.body || '')}</div></div>
              <div class="mut sm" style="margin-top:8px">Escribe en Markdown: # títulos, - listas, **negritas**, > notas, [links](https://…). La vista previa se actualiza sola.</div>`
            : html`<div class="row"><span class="chip" style="background:${KCOL[d.kind] || '#8f877b'};color:#fff">${d.kind || 'Doc'}</span><div class="sp"></div><span class="mut sm">${d._meta?.updated_at ? 'Actualizado ' + fdate(String(d._meta?.updated_at).slice(0, 10)) : ''}${d._meta?.updated_by ? ' · ' + d._meta?.updated_by : ''}</span></div>
              <h1 style="font-size:42px;font-weight:500;letter-spacing:-1.3px;margin:14px 0 18px">${d.title}</h1>
              ${em ? html`<iframe src="${em}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:20px;margin-bottom:22px;background:#000" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>` : d.url ? html`<a class="artifact" href="${d.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin-bottom:18px"><span class="fi">↗</span><div><b style="font-weight:500">Abrir link</b></div></a>` : ''}
              ${d.body ? md(d.body) : html`<div class="empty"><b>Documento vacío</b>Dale «Editar» para escribirlo.</div>`}`}
        </div>`);
      const ta = $('#dbody', el); if (ta) { let t0; ta.oninput = () => { clearTimeout(t0); t0 = setTimeout(() => mount($('#dprev', el), md(ta.value)), 120); }; }
    };
    acts(el, {
      edit: () => { editing = true; history.replaceState(null, '', `#/library/${d.folder_id || '_'}/${d.id}/edit`); paint(); },
      cancel: () => { editing = false; history.replaceState(null, '', `#/library/${d.folder_id || '_'}/${d.id}`); paint(); },
      save: async () => {
        const url = $('#durl', el).value.trim(); if (url && !/^https:\/\//.test(url)) return toast('El link debe empezar con https://', true);
        try { d = await D.save({ ...d, title: $('#dtitle', el).value.trim() || d.title, kind: $('#dkind', el).value, folder_id: $('#dfolder', el).value, url, body: $('#dbody', el).value }); editing = false; history.replaceState(null, '', `#/library/${d.folder_id || '_'}/${d.id}`); toast('Guardado ✅'); paint(); }
        catch (e) { toast(e.message, true); }
      },
      del: async () => { if (!(await confirmAsk(`¿Eliminar «${d.title}»?`))) return; await D.remove(d.id); location.hash = back.slice(1); },
    });
    paint();
  }

  // (acciones de la pantalla de inicio)
  function homeActs() {
    acts(el, {
      newFolder: async () => { if (await newFolder(null)) home(); },
      newDoc: () => newDoc(''),
      folder: (t) => { location.hash = `/library/${t.dataset.id}`; },
      doc: (t) => { const d = docs.find((x) => x.id === t.dataset.id); location.hash = `/library/${d.folder_id || '_'}/${d.id}`; },
    });
  }

  if (did) return docPage(did);
  if (fid) return folderPage(fid);
  homeActs();
  home();
}
