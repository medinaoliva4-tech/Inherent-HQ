import { recorder } from '../recorder.js';
import { ENTREVISTA } from './library-entrevista.js';
import { WORK_ROLES, wizard, connectCard , openClaude, ICON, ico } from '../core.js';
import { html, raw, mount, col, api, acts, toast, fdate, ask, confirmAsk, drawer, closeDrawer, md, inline, $, folderSvg, TONES, embedUrl, IC, diagram, diagrams } from '../core.js';
import { childrenOf, parentOf, pathOf, pathLabel, descendants, canMove, contentsOf, flatTree } from '../library-tree.js';
import { ctxMenu, wireDnd, moveDialog, folderIcon, homeIcon } from '../library-ui.js';
import { diagramEditor, diagramView, measure, fromDoc, toMermaid, template, empty as emptyDiagram } from '../diagram-editor.js';
import { SECCIONES, nombreSeccion } from '../guia-secciones.js';
import { olvidarGuias } from '../guia.js';
import { vacio } from '../visual.js';

// Library: SOPs, playbooks, videos y notas que el equipo escribe aquí, en carpetas.
// Una carpeta se puede conectar a una carpeta de Google Drive: se ve su contenido y se crean Docs ahí.
const KINDS = ['SOP', 'Playbook', 'Entrevista', 'Prompt', 'Diagrama', 'Video', 'Nota'];
export const VTYPES = ['Reel', 'UGC / testimonio', 'Anuncio (Ads)', 'Derivado / corte', 'Story', 'YouTube / horizontal'];
const KICO = { SOP: 'clipboard', Playbook: 'target', Entrevista: 'chat', Prompt: 'spark', Diagrama: 'shuffle', Video: 'video', Nota: 'doc' };
const KCOL = { SOP: 'var(--ui-ink2)', Playbook: 'var(--ui-ink2)', Prompt: 'var(--ui-ink2)', Diagrama: 'var(--ui-ink2)', Video: 'var(--ui-ink2)', Nota: 'var(--ui-ink2)', Entrevista: 'var(--ui-ink2)' };
// El formato de cada tipo: lo que tiene que llevar. Se carga al crear el documento.
const TPL = {
  SOP: (t) => `# SOP · ${t}

> **Para qué sirve:** el resultado que deja este proceso, en una frase.
> **Dueño:** el rol responsable · **Cuándo se usa:** el disparador (día del ciclo, evento, pedido)
> **Tiempo:** cuánto toma · **Herramientas:** las que se abren

## Resultado esperado
Cómo se ve "bien hecho". Si se puede medir, con el número.

## Antes de empezar
- [ ] Lo que tiene que existir antes (archivo, acceso, aprobación)
- [ ] Lo que hay que leer

## Pasos
1. **Paso** — quién (rol) · dónde · cuánto tarda
2. **Paso** — quién (rol) · dónde · cuánto tarda
3. **Paso** — quién (rol) · dónde · cuánto tarda

## Checklist de calidad
- [ ] Revisión antes de entregar
- [ ] Revisión antes de entregar

## Errores comunes
- **Error:** cómo se evita

## Si algo falla
Precio, alcance y fechas → el CEO · lo demás → el COO.
`,
  Playbook: (t) => `# Playbook · ${t}

> **Objetivo:** qué se gana si se juega bien.
> **Cuándo se usa:** las señales de que aplica · **Para quién:** el rol que lo corre

## La situación
Qué está pasando cuando hace falta esta jugada. Las señales concretas.

## La jugada
La estrategia en un párrafo: qué hacemos distinto y por qué funciona.

## Paso a paso
1. **Movimiento** — qué se hace · quién · en cuánto tiempo
2. **Movimiento** — qué se hace · quién · en cuánto tiempo
3. **Movimiento** — qué se hace · quién · en cuánto tiempo

## Qué decir
> "El guion o mensaje literal, entre comillas."

## Objeciones y respuestas
| Si dicen… | Respondemos… |
|---|---|
| "Objeción" | "Respuesta" |

## Cómo sabemos que funcionó
- La métrica y el número que buscamos

## Si no funciona
El plan B y cuándo se escala.
`,
  Video: (t) => `# ${t}

> **Qué aprendes:** en una frase. · **Para:** el rol · **Duración:** minutos

## Capítulos
- 00:00 — Introducción
- 00:00 — Tema

## Resumen
Las 3 ideas clave del video.

## Para practicar
- [ ] Lo que hay que hacer después de verlo

## Recursos
- [Link](https://)
`,
  Entrevista: (t, d = {}) => ENTREVISTA(d.brand),
  Nota: (t) => `# ${t}

`,
  Diagrama: () => toMermaid(template('flujo', measure)),
  Prompt: (t, d = {}) => `Eres el editor de video de Inherent para ${d.client ? d.client.toUpperCase() : 'nuestras marcas'}. Tipo de video: ${d.vtype || '—'}.

Marca: respeta su guía (paleta, tipografías, tono y activos distintivos). Assets en su Drive.
Objetivo de la pieza: [pega aquí el objetivo o el brief]
Formato: [9:16 / 16:9 / 1:1] · Duración: [segundos]

Cómo debe quedar:
- Hook en los primeros 2 segundos
- [estructura: problema → giro → resultado]
- Subtítulos quemados, cortes cada 1.5-2 s
- Cierre con CTA: [CTA]

Entrega: plan de edición escena por escena (tiempo, toma, texto en pantalla, audio) y lista de exports (orgánico y Ads).`,
};
const MIME = (m) => (/folder/.test(m) ? ['DIR', 'var(--ui-ink2)'] : /document/.test(m) ? ['DOC', 'var(--ui-ink2)'] : /spreadsheet/.test(m) ? ['XLS', 'var(--ui-ink2)'] : /presentation/.test(m) ? ['PPT', 'var(--ui-ink2)'] : /pdf/.test(m) ? ['PDF', 'var(--ui-ink2)'] : /video/.test(m) ? ['MP4', 'var(--ui-ink2)'] : /image/.test(m) ? ['IMG', 'var(--ui-ink2)'] : ['FILE', 'var(--ui-ink2)']);
const driveOk = (u) => /^https:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?folders\/[-\w]{20,}/.test(String(u || ''));

export async function render(el, { me, sub, alive }) {
  // Abrir prompts en Claude (con la cuenta de cada quien): Content, Editor de video y CEO.
  const canClaude = me.role === 'ceo' || (me.roles || []).some((r) => r === 'content' || r === 'video');
  const canGuia = ['ceo', 'coo'].includes(me.role); // marcar un documento como el «Cómo se usa» de una sección
  const F = col('folders'), D = col('docs');
  let [folders, docs] = await Promise.all([F.list(), D.list()]);
  let q = '';
  const [fid, did] = sub;

  async function newFolder(f, parent = null) {
    const v = await ask(f ? 'Editar carpeta' : parent ? `Nueva carpeta en «${folders.find((x) => x.id === parent)?.name || ''}»` : 'Nueva carpeta', [
      { k: 'name', l: 'Nombre', v: f?.name, req: true },
      { k: 'tone', l: 'Color', t: 'select', opts: TONES.map((t) => [t, t[0].toUpperCase() + t.slice(1)]), v: f?.tone || 'gris', half: true },
      { k: 'drive', l: 'Carpeta de Google Drive (opcional)', v: f?.drive, half: true },
      { k: 'desc', l: 'Para qué es', t: 'textarea', v: f?.desc },
    ]);
    if (!v) return null;
    if (v.drive && !driveOk(v.drive)) { toast('Pega el link de una carpeta de Drive (drive.google.com/drive/folders/…)', true); return null; }
    try { const r = f ? await F.save({ ...f, ...v }) : await F.create({ ...v, parent_id: parent || null }); folders = f ? folders.map((x) => (x.id === r.id ? r : x)) : [...folders, r]; toast('Carpeta guardada'); return r; } catch (e) { toast(e.message, true); return null; }
  }
  async function newDoc(folderId) {
    let clients = []; try { clients = (await api('repo/clients')).clients.filter((c) => c.hasPlan).map((c) => c.slug); } catch {}
    const v = await wizard('Nuevo documento', [
      { k: 'kind', q: '¿Qué vas a crear?', type: 'cards', req: true, opts: [
        { v: 'SOP', i: ico('clipboard'), l: 'SOP', d: 'Un proceso paso a paso' }, { v: 'Playbook', i: ico('target', 16), l: 'Playbook', d: 'Una jugada para una situación' }, { v: 'Entrevista', i: ico('chat'), l: 'Entrevista', d: 'Preguntas con espacio para responder' },
        { v: 'Prompt', i: ico('spark'), l: 'Prompt de video', d: 'Para una marca y un tipo de video' }, { v: 'Diagrama', i: ico('shuffle'), l: 'Diagrama', d: 'Flujo, mapa, organigrama' },
        { v: 'Video', i: ico('video'), l: 'Video', d: 'Link de YouTube, Loom o Drive' }, { v: 'Nota', i: ico('doc'), l: 'Nota', d: 'Texto libre' }] },
      { k: 'client', q: '¿Para qué marca?', type: 'cards', req: true, show: (a) => a.kind === 'Prompt', opts: [{ v: '_', i: ico('globe'), l: 'General', d: 'Sirve para todas' }, ...clients.map((c) => ({ v: c, i: ico('tag'), l: c.toUpperCase() }))] },
      { k: 'vtype', q: '¿Qué tipo de video?', type: 'cards', req: true, show: (a) => a.kind === 'Prompt', opts: VTYPES.map((x) => ({ v: x, l: x })) },
      { k: 'url', q: 'Pega el link del video', type: 'text', req: true, show: (a) => a.kind === 'Video', ph: 'https://…' },
      { k: 'brand', q: '¿A qué marca vas a entrevistar?', type: 'text', req: true, show: (a) => a.kind === 'Entrevista', ph: 'Nombre de la marca' },
      { k: 'title', q: '¿Cómo se llama?', type: 'text', req: true, v: (a) => (a.kind === 'Prompt' ? `${a.client === '_' ? 'General' : (a.client || '').toUpperCase()} · ${a.vtype}` : a.kind === 'Entrevista' ? `Entrevista — Marketing · ${a.brand}` : undefined), ph: 'Título' },
      { k: 'folder_id', q: '¿En qué carpeta va?', type: 'cards', show: () => !folderId && folders.length > 0, v: '', opts: [{ v: '', i: '—', l: 'Sin carpeta' }, ...flatTree(folders).map((r) => ({ v: r.f.id, i: ico('folder'), l: pathLabel(folders, r.f.id) }))] },
    ], 'Crear');
    if (!v) return;
    if (v.url && !/^https:\/\//.test(v.url)) return toast('El link debe empezar con https://', true);
    const roles = v.kind === 'Prompt' ? ['video'] : [];
    const extra = v.kind === 'Prompt' ? { client: v.client === '_' ? '' : v.client, vtype: v.vtype } : {};
    const dg = v.kind === 'Diagrama' ? template('flujo', measure) : null;
    try { const r = await D.create({ title: v.title, kind: v.kind, url: v.url || '', folder_id: folderId || v.folder_id || '', roles, ...extra, ...(dg ? { diagram: dg } : {}), body: dg ? toMermaid(dg) : (TPL[v.kind] || TPL.Nota)(v.title, { ...extra, brand: (v.brand || '').trim() || undefined }) }); location.hash = `/library/${r.folder_id || '_'}/${r.id}/edit`; } catch (e) { toast(e.message, true); }
  }

  // Grabar (como Loom) → sube a Drive → queda como documento de tipo Video.
  function record(folderId) {
    recorder({ onDone: async ({ title, link }) => {
      try { const r = await D.create({ title, kind: 'Video', folder_id: folderId || '', url: link, body: `# ${title}\n\n> Grabado en Inherent OS. Drive tarda unos minutos en procesar el video.\n\n## Resumen\n\n` });
        toast('Video guardado en la Library'); location.hash = `/library/${r.folder_id || '_'}/${r.id}`; } catch (e) { toast(e.message, true); }
    } });
  }
  // ---------- carpetas anidadas (tipo Finder / Drive) ----------
  const inFolder = (d) => (d.folder_id && folders.some((f) => f.id === d.folder_id) ? d.folder_id : null);
  const byNew = (a, z) => String(z._meta?.updated_at || '').localeCompare(String(a._meta?.updated_at || ''));
  let openSet; try { openSet = new Set(JSON.parse(localStorage.getItem('lib.open') || '[]')); } catch { openSet = new Set(); }
  const saveOpen = () => { try { localStorage.setItem('lib.open', JSON.stringify([...openSet])); } catch {} };
  const CHEV = raw('<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>');
  const more = (kind, id) => html`<button type="button" class="lib-more" data-act="more" data-kind="${kind}" data-id="${id}" aria-label="Más acciones" title="Más acciones">${raw('<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>')}</button>`;
  // Cada documento es una fila en un panel: el ícono dice su tipo, luego el título, la carpeta y cuándo cambió. Se arrastra a otra carpeta.
  const docRow = (d, showFolder = true) => html`<div class="lib-row" role="button" tabindex="0" data-act="doc" data-id="${d.id}" data-ctx="doc" draggable="true" data-drag="doc" data-folder="${inFolder(d) || ''}" data-name="${d.title}"><span class="lib-ic" style="--k:${KCOL[d.kind] || 'var(--ui-ink2)'}">${ico(KICO[d.kind] || 'doc', 17)}</span>
    <span class="lib-t"><b>${d.title}</b><span class="mut sm">${[d.kind || 'Doc', showFolder && (inFolder(d) ? pathLabel(folders, d.folder_id) : 'Sin carpeta'), d.url && d.kind !== 'Video' && 'con video', d.guia && `Cómo se usa · ${nombreSeccion(d.guia)}`].filter(Boolean).join(' · ')}</span></span>
    <span class="lib-when mut sm">${d._meta?.updated_at ? fdate(String(d._meta?.updated_at).slice(0, 10)) : ''}${d._meta?.updated_by ? html`<span class="lib-by"> · ${d._meta.updated_by}</span>` : ''}</span>${more('doc', d.id)}</div>`;
  const folderTile = (f) => { const n = docs.filter((d) => d.folder_id === f.id).length, k = childrenOf(folders, f.id).length;
    return html`<div class="sp-tile lib-folder" role="link" tabindex="0" data-act="folder" data-id="${f.id}" data-ctx="folder" data-drop="${f.id}" draggable="true" data-drag="folder" data-parent="${parentOf(folders, f.id) || ''}" data-name="${f.name}">
      <div class="sp-tile-top"><span class="lib-fsvg">${folderSvg({ w: 54, drive: Boolean(f.drive), tone: f.tone, video: docs.some((d) => d.folder_id === f.id && d.kind === 'Video') })}</span>${more('folder', f.id)}</div>
      <div class="sp-tile-name">${f.name}</div>${f.desc ? html`<div class="sp-tile-sub lib-desc">${f.desc}</div>` : ''}
      <div class="sp-tile-foot"><span>${[k && `${k} carpeta${k === 1 ? '' : 's'}`, `${n} documento${n === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</span>${f.drive ? html`<span>${IC.drive} Drive</span>` : ''}</div></div>`; };
  // La ruta: Library › Carpeta › Sub. Cada paso es también un lugar donde soltar.
  const crumbs = (fid, tail) => html`<nav class="lib-crumbs" aria-label="Ruta"><a href="#/library" data-drop="">${raw(homeIcon)}<span>Library</span></a>${pathOf(folders, fid).map((f, i, all) => html`<span class="lib-cs" aria-hidden="true">${CHEV}</span><a href="#/library/${f.id}" data-drop="${f.id}" ${i === all.length - 1 && !tail ? raw('aria-current="page"') : ''}>${f.name}</a>`)}${tail ? html`<span class="lib-cs" aria-hidden="true">${CHEV}</span><span class="lib-ccur">${tail}</span>` : ''}</nav>`;
  // El árbol de la izquierda (escritorio): plegable, y cada carpeta recibe lo que sueltes.
  function tree(cur) {
    const out = []; let hide = Infinity;
    for (const r of flatTree(folders)) {
      if (r.depth > hide) continue; hide = Infinity;
      const isOpen = openSet.has(r.f.id);
      out.push(html`<div class="lib-tn${r.f.id === cur ? ' on' : ''}" style="--d:${r.depth}" data-drop="${r.f.id}" data-ctx="folder" data-id="${r.f.id}" draggable="true" data-drag="folder" data-parent="${parentOf(folders, r.f.id) || ''}" data-name="${r.f.name}">
        ${r.kids ? html`<button type="button" class="lib-tw${isOpen ? ' open' : ''}" data-act="twist" data-id="${r.f.id}" aria-label="${isOpen ? 'Cerrar' : 'Abrir'} ${r.f.name}" aria-expanded="${isOpen ? 'true' : 'false'}">${CHEV}</button>` : html`<span class="lib-tw"></span>`}
        <a href="#/library/${r.f.id}" draggable="false">${raw(folderIcon)}<span>${r.f.name}</span></a></div>`);
      if (r.kids && !isOpen) hide = r.depth;
    }
    return html`<aside class="lib-side" aria-label="Carpetas"><div class="lib-side-in"><div class="lib-tn root${!cur ? ' on' : ''}" data-drop=""><span class="lib-tw"></span><a href="#/library" draggable="false">${raw(homeIcon)}<span>Library</span></a></div>${out}
      <button type="button" class="lib-tadd" data-act="newFolderHere">+ Nueva carpeta</button></div></aside>`;
  }

  // ---------- mover, renombrar, borrar ----------
  let repaint = () => {}, curFid = null;
  const where = (fid) => (fid ? `«${folders.find((f) => f.id === fid)?.name || 'la carpeta'}»` : 'la raíz de la Library');
  async function moveTo(kind, id, target) {
    target = target || null;
    try {
      if (kind === 'doc') { const d = docs.find((x) => x.id === id); if (!d || inFolder(d) === target) return; const r = await D.save({ ...d, folder_id: target || '' }); docs = docs.map((x) => (x.id === r.id ? r : x)); toast(`«${d.title}» movido a ${where(target)}`); }
      else { const f = folders.find((x) => x.id === id); if (!f || parentOf(folders, id) === target) return; if (!canMove(folders, id, target)) return toast('Una carpeta no puede ir dentro de sí misma', true);
        const r = await F.save({ ...f, parent_id: target }); folders = folders.map((x) => (x.id === r.id ? r : x)); if (target) { openSet.add(target); saveOpen(); } toast(`Carpeta «${f.name}» movida a ${where(target)}`); }
    } catch (e) { toast(e.message, true); }
    repaint();
  }
  async function moveAsk(kind, id) {
    const it = kind === 'doc' ? docs.find((x) => x.id === id) : folders.find((x) => x.id === id); if (!it) return;
    const t = await moveDialog(folders, { title: `Mover «${kind === 'doc' ? it.title : it.name}» a…`, kind, id, current: kind === 'doc' ? inFolder(it) : parentOf(folders, id) });
    if (t !== undefined) await moveTo(kind, id, t);
  }
  async function rename(kind, id) {
    const it = kind === 'doc' ? docs.find((x) => x.id === id) : folders.find((x) => x.id === id); if (!it) return;
    const k = kind === 'doc' ? 'title' : 'name';
    const v = await ask('Renombrar', [{ k: 'n', l: kind === 'doc' ? 'Título' : 'Nombre', v: it[k], req: true }], 'Renombrar'); if (!v || v.n === it[k]) return;
    try { if (kind === 'doc') { const r = await D.save({ ...it, title: v.n }); docs = docs.map((x) => (x.id === r.id ? r : x)); } else { const r = await F.save({ ...it, name: v.n }); folders = folders.map((x) => (x.id === r.id ? r : x)); } toast('Listo'); } catch (e) { toast(e.message, true); }
    repaint();
  }
  async function delDoc(id) {
    const d = docs.find((x) => x.id === id); if (!d || !(await confirmAsk(`¿Eliminar «${d.title}»?`))) return;
    try { await D.remove(d.id); docs = docs.filter((x) => x.id !== d.id); toast('Documento eliminado'); } catch (e) { toast(e.message, true); }
    repaint();
  }
  // Una carpeta vacía se borra con un sí; si tiene cosas, se pregunta si lo de adentro sube un nivel o se borra todo.
  async function delFolder(id) {
    const f = folders.find((x) => x.id === id); if (!f) return;
    const c = contentsOf(folders, docs, id), up = parentOf(folders, id);
    let how = 'empty';
    if (!c.folders && !c.docs) { if (!(await confirmAsk(`¿Eliminar la carpeta «${f.name}»?${f.drive ? ' (Los archivos de Drive no se tocan.)' : ''}`))) return; }
    else {
      const parts = [c.docs && `${c.docs} documento${c.docs === 1 ? '' : 's'}`, c.folders && `${c.folders} carpeta${c.folders === 1 ? '' : 's'}`].filter(Boolean).join(' y ');
      const v = await ask(`«${f.name}» tiene ${parts}`, [{ k: 'how', l: '¿Qué hacemos con lo de adentro?', t: 'select', v: 'up', opts: [['up', `Moverlo a ${where(up)}`], ['all', `Eliminarlo todo (${parts})`]] }], 'Eliminar carpeta');
      if (!v) return; how = v.how;
      if (how === 'all' && !(await confirmAsk(`Se eliminan ${parts}. No se puede deshacer. ¿Seguro?`))) return;
    }
    try {
      if (how === 'up') {
        for (const s of childrenOf(folders, id)) { const r = await F.save({ ...s, parent_id: up }); folders = folders.map((x) => (x.id === r.id ? r : x)); }
        for (const d of docs.filter((x) => x.folder_id === id)) { const r = await D.save({ ...d, folder_id: up || '' }); docs = docs.map((x) => (x.id === r.id ? r : x)); }
      } else if (how === 'all') {
        for (const d of docs.filter((x) => c.ids.has(x.folder_id))) await D.remove(d.id);
        docs = docs.filter((x) => !c.ids.has(x.folder_id));
        for (const sid of [...c.ids].filter((x) => x !== id).reverse()) await F.remove(sid);
      }
      await F.remove(id); folders = folders.filter((x) => !(how === 'all' ? c.ids.has(x.id) : x.id === id));
      toast('Carpeta eliminada');
    } catch (e) { toast(e.message, true); }
    if (curFid && (how === 'all' ? c.ids.has(curFid) : curFid === id)) { location.hash = up ? `/library/${up}` : '/library'; return; }
    repaint();
  }
  function openCtx(kind, id, x, y) {
    if (kind === 'folder') {
      const f = folders.find((z) => z.id === id); if (!f) return;
      ctxMenu(x, y, [{ l: 'Abrir', run: () => { location.hash = `/library/${f.id}`; } }, { l: 'Nueva carpeta adentro', run: () => addFolder(f.id) }, { l: 'Nuevo documento adentro', run: () => newDoc(f.id) }, '-',
        { l: 'Renombrar', run: () => rename('folder', id) }, { l: 'Color, Drive y descripción…', run: () => editFolder(f) }, { l: 'Mover a…', run: () => moveAsk('folder', id) }, '-', { l: 'Eliminar…', danger: true, run: () => delFolder(id) }]);
    } else {
      const d = docs.find((z) => z.id === id); if (!d) return;
      ctxMenu(x, y, [{ l: 'Abrir', run: () => { location.hash = `/library/${d.folder_id || '_'}/${d.id}`; } }, { l: 'Editar', run: () => { location.hash = `/library/${d.folder_id || '_'}/${d.id}/edit`; } }, '-',
        { l: 'Renombrar', run: () => rename('doc', id) }, { l: 'Mover a…', run: () => moveAsk('doc', id) }, '-', { l: 'Eliminar', danger: true, run: () => delDoc(id) }]);
    }
  }
  async function addFolder(parent) { const r = await newFolder(null, parent); if (r) { if (parent) { openSet.add(parent); saveOpen(); } repaint(); } }
  let onFolderEdited = () => {};
  async function editFolder(f) { const r = await newFolder(f); if (r) { Object.assign(f, r); onFolderEdited(f); repaint(); } }
  // Lo que vale en cualquier vista de carpetas: menú contextual, teclado y arrastrar y soltar.
  function wireBrowse() {
    el.addEventListener('contextmenu', (e) => { const t = e.target.closest('[data-ctx]'); if (!t || !el.contains(t)) return; e.preventDefault(); openCtx(t.dataset.ctx, t.dataset.id, e.clientX, e.clientY); });
    el.addEventListener('keydown', (e) => {
      const t = e.target; if (!t.matches?.('[role=button][data-act],[role=link][data-act]')) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t.click(); }
      else if ((e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu') { e.preventDefault(); const r = t.getBoundingClientRect(); openCtx(t.dataset.ctx, t.dataset.id, r.left + 24, r.bottom); }
    });
    wireDnd(el, { folders: () => folders, onDrop: moveTo });
  }

  // ---------- una carpeta (o la raíz): ruta, subcarpetas, documentos y su Drive ----------
  async function browse(fid) {
    const f = fid ? folders.find((x) => x.id === fid) : null;
    if (fid && !f) return mount(el, html`<a class="btn ghost" href="#/library">← Library</a>${vacio({ icono: 'inbox', titulo: 'Esa carpeta no existe', linea: 'Puede que la hayan movido o borrado.' })}`);
    curFid = fid;
    if (f) { for (const a of pathOf(folders, fid)) openSet.add(a.id); saveOpen(); }
    let drive = null, dErr = null;
    const paint = () => {
      const ql = q.toLowerCase(), scope = fid ? new Set([fid, ...descendants(folders, fid)]) : null;
      const found = q ? docs.filter((d) => (!scope || scope.has(d.folder_id)) && (d.title + ' ' + (d.body || '')).toLowerCase().includes(ql)).sort(byNew) : [];
      const foundF = q ? folders.filter((x) => (!scope || scope.has(x.id)) && x.id !== fid && String(x.name).toLowerCase().includes(ql)) : [];
      const subs = childrenOf(folders, fid), here = docs.filter((d) => inFolder(d) === (fid || null)).sort(byNew);
      const recent = !fid ? [...docs].sort(byNew).slice(0, 8) : [];
      const y = scrollY;
      mount(el, html`<div class="lib-shell">${tree(fid)}<div class="lib-main">
        ${f ? html`${crumbs(fid)}<div class="sp-hero row lib-fhero"><div class="lib-fbig">${folderSvg({ w: 84, drive: Boolean(f.drive), tone: f.tone })}</div>
            <div style="flex:1;min-width:200px"><h1>${f.name}</h1><p>${f.desc || [subs.length && `${subs.length} carpeta${subs.length === 1 ? '' : 's'}`, `${here.length} documento${here.length === 1 ? '' : 's'}`, f.drive && 'conectada a Drive'].filter(Boolean).join(' · ')}</p></div>
            <div class="row lib-acts" style="gap:8px;flex-wrap:wrap"><button class="btn ghost" data-act="newFolderHere">+ Carpeta</button><button class="btn ghost" data-act="recHere">${ico('dot', 13)} Grabar video</button><button class="btn" data-act="newDocHere">+ Documento</button>${more('folder', f.id)}</div></div>`
          : html`<div class="hello sp-hero row lib-hero" style="align-items:flex-end"><div><h1>Biblioteca</h1><p>SOPs, playbooks y videos. <em>Todo en un lugar.</em></p></div><div class="sp"></div>
            <div class="row lib-acts" style="gap:8px;flex-wrap:wrap"><button class="btn ghost" data-act="newFolderHere">+ Carpeta</button><button class="btn ghost" data-act="recHere">${ico('dot', 13)} Grabar video</button><button class="btn" data-act="newDocHere">+ Documento</button></div></div>`}
        <label class="lib-search">${ico('search', 20)}<input class="in" id="q" type="search" placeholder="${f ? `Buscar en ${f.name}…` : 'Buscar en la biblioteca…'}" value="${q}" aria-label="Buscar"><span class="mut sm">${((n) => `${n} documento${n === 1 ? '' : 's'}`)((scope ? docs.filter((d) => scope.has(d.folder_id)) : docs).length)}</span></label>
        ${q ? html`${foundF.length ? html`<div class="sec-title"><h2>Carpetas</h2><span class="mut sm">${foundF.length}</span></div><div class="sp-tiles lib-folders">${foundF.map(folderTile)}</div>` : ''}
            <section class="sp-panel lib-list"><div class="sp-panel-h row"><h3>Resultados</h3><span class="mut sm">${found.length}</span></div>${found.length ? found.slice(0, 60).map((d) => docRow(d)) : html`${vacio({ icono: 'inbox', titulo: 'Nada con eso', linea: 'Prueba otra palabra.' })}`}</section>`
          : html`${subs.length ? html`<div class="sec-title"><h2>Carpetas</h2><span class="mut sm">${subs.length}</span></div><div class="sp-tiles lib-folders">${subs.map(folderTile)}<button type="button" class="sp-tile add lib-fadd" data-act="newFolderHere">+ Nueva carpeta</button></div>`
              : !fid ? html`${vacio({ icono: 'inbox', titulo: 'Aún no hay carpetas', linea: 'Crea la primera: «Onboarding de cliente», «Producción», «Playbooks de venta»… Adentro puedes poner más carpetas, y conectarla a una carpeta de Drive si quieres.' })}` : ''}
            ${fid || here.length ? html`<section class="sp-panel lib-list" data-drop="${fid || ''}"><div class="sp-panel-h row"><h3>${fid ? 'Documentos' : 'Sin carpeta'}</h3><span class="mut sm">${here.length}</span>${fid ? '' : html`<span class="mut sm lib-hint">Arrástralos a una carpeta</span>`}</div>
              ${here.length ? here.map((d) => docRow(d, false)) : html`${vacio({ icono: 'inbox', titulo: 'Sin documentos aquí', linea: 'Crea un SOP, playbook o video con «+ Documento», o arrastra uno desde otra carpeta.' })}`}</section>` : ''}
            ${recent.length ? html`<section class="sp-panel lib-list"><div class="sp-panel-h row"><h3>Recientes</h3></div>${recent.map((d) => docRow(d))}</section>` : ''}
            ${f ? html`<div class="sec-title"><h2>Google Drive</h2>${f.drive ? html`<div class="row" style="gap:8px"><button class="btn ghost sm" data-act="gnew">+ Google Doc</button><a class="btn ghost sm" href="${f.drive}" target="_blank" rel="noopener noreferrer" >${IC.drive} Abrir en Drive</a></div>` : ''}</div>
              ${!f.drive ? connectCard('drive', 'Conecta esta carpeta con Google Drive', 'Verás aquí sus archivos y podrás crear Docs, Sheets y Slides directo en ella.', 'connectDrive', 'Conectar con Drive')
                : drive === null ? html`<p class="loading">Leyendo tu Drive…</p>` : dErr ? html`<div class="warnbox">${dErr}</div>`
                : drive.files.length ? html`<section class="sp-panel lib-list">${drive.files.map((x) => { const [t, c] = MIME(x.mime); return html`<button class="lib-row" data-act="dfile" data-id="${x.id}"><span class="lib-ic mime" style="--k:${c}">${t}</span><span class="lib-t"><b>${x.name}</b><span class="mut sm">${x.owner || '—'}</span></span><span class="lib-when mut sm">${x.modified ? fdate(x.modified.slice(0, 10)) : ''}</span><span class="sp-tile-go" aria-hidden="true">↗</span></button>`; })}</section>`
                : html`${vacio({ icono: 'inbox', titulo: 'La carpeta de Drive está vacía', linea: 'Crea un Google Doc con el botón de arriba.' })}`}` : ''}`}
      </div></div>`);
      scrollTo(0, y);
      const qi = $('#q', el); qi.oninput = () => { q = qi.value; const pos = qi.selectionStart; paint(); const n = $('#q', el); n.focus(); n.setSelectionRange(pos, pos); };
    };
    repaint = paint;
    const loadDrive = () => api(`google/drive?folder=${encodeURIComponent(f.drive)}`).then((r) => { drive = r; dErr = null; }).catch((e) => { drive = { files: [] }; dErr = e.message; }).then(() => alive() && paint());
    onFolderEdited = (x) => { if (f && x.id === f.id) { drive = null; if (f.drive) loadDrive(); } };
    wireBrowse();
    acts(el, {
      connectDrive: async () => { const v = await ask('Conectar con Google Drive', [{ k: 'drive', l: 'Link de la carpeta de Drive', req: true }], 'Conectar'); if (!v) return; if (!driveOk(v.drive)) return toast('Pega el link de una carpeta de Drive (drive.google.com/drive/folders/…)', true); try { const r = await F.save({ ...f, drive: v.drive }); Object.assign(f, r); folders = folders.map((x) => (x.id === r.id ? r : x)); drive = null; paint(); loadDrive(); } catch (e) { toast(e.message, true); } },
      newFolderHere: () => addFolder(fid || null),
      newDocHere: () => newDoc(fid || ''),
      recHere: () => record(fid || ''),
      twist: (t) => { const id = t.dataset.id; openSet.has(id) ? openSet.delete(id) : openSet.add(id); saveOpen(); paint(); },
      more: (t, e) => { e.stopPropagation(); const r = t.getBoundingClientRect(); openCtx(t.dataset.kind, t.dataset.id, r.right - 220, r.bottom + 6); },
      folder: (t) => { location.hash = `/library/${t.dataset.id}`; },
      doc: (t) => { const d = docs.find((x) => x.id === t.dataset.id); location.hash = `/library/${d.folder_id || '_'}/${d.id}`; },
      gnew: async () => { const v = await ask('Nuevo archivo en Drive', [{ k: 'name', l: 'Nombre', req: true }, { k: 'type', l: 'Tipo', t: 'select', opts: [['doc', 'Google Doc'], ['sheet', 'Google Sheet'], ['slides', 'Google Slides'], ['folder', 'Carpeta']] }], 'Crear'); if (!v) return;
        try { const r = await api('google/drive', { method: 'POST', body: { ...v, folder: f.drive } }); toast('Creado en tu Drive'); if (r.link) window.open(r.link, '_blank', 'noopener'); drive = null; paint(); loadDrive(); } catch (e) { toast(e.message, true); } },
      dfile: (t) => { const x = drive.files.find((y) => y.id === t.dataset.id); const em = /folder/.test(x.mime) ? null : `https://drive.google.com/file/d/${x.id}/preview`;
        drawer(html`<div class="row"><span class="ftype" style="background:${MIME(x.mime)[1]}">${MIME(x.mime)[0]}</span><div class="sp"></div><button class="btn-icon end" data-act="close">${ico('x', 16)}</button></div><h2>${x.name}</h2><div class="mut">${x.owner || ''}${x.modified ? ' · ' + fdate(x.modified.slice(0, 10)) : ''}</div>
          ${em ? html`<iframe src="${em}" style="width:100%;height:58vh;border:0;border-radius:18px;margin-top:16px;background:var(--surface)" loading="lazy"></iframe>` : ''}
          <a class="btn" href="${x.link}" target="_blank" rel="noopener noreferrer" style="margin-top:16px;display:inline-flex">Abrir en Drive ↗</a>`); },
    });
    paint();
    if (f?.drive) loadDrive();
  }

  // Vista previa: un diagrama se dibuja entero; lo demás es Markdown (que también dibuja bloques mermaid).
  function prev(kind, body) { return kind === 'Diagrama' ? diagram(body) : kind === 'Entrevista' ? interview(body, {}, false).view : md(body); }

  // El prompt del diagnóstico: cada pregunta con su respuesta y «Lo ideal», y el formato que debe devolver Claude.
  function diagPrompt(d, items, client) {
    let qa = '', last = null;
    for (const it of items) {
      if (it.head !== last) { qa += `\n## ${it.head}\n`; last = it.head; }
      const a = String((d.answers || {})[it.k] || '').trim();
      qa += `\n- Pregunta: ${it.q.replace(/⭐\s*/, '')}\n  Respuesta: ${a || '(sin respuesta)'}${it.ideal.length ? `\n  Lo ideal: ${it.ideal.join(' ')}` : ''}\n`;
    }
    return `Eres el estratega de Inherent. Antes de escribir, lee del repo: CLAUDE.md, inherent/03-OFERTA.md (los planes y qué incluye cada uno) e inherent/02-METODO.md. Si tienes el MCP de Inherent, consulta el catálogo de servicios.

Esta es la entrevista «${d.title}» al CEO de ${client || 'el cliente'}. Debajo de cada pregunta está su respuesta y «Lo ideal» (cómo debería estar).

Haz el diagnóstico de esta entrevista. En español, de «tú», sin jerga y en Markdown, con estas secciones exactas:

### En una frase
El diagnóstico en una sola frase.

### Lo que está fuerte
Máximo 5 puntos, cada uno con la respuesta que lo prueba.

### Las brechas
Tabla: Tema | Hoy (lo que respondió) | Lo ideal | Gravedad (alta, media o baja). Ordenada de la más grave a la menos grave.

### Lo que falta saber
Las preguntas sin respuesta o con respuesta vaga, y cómo conseguir el dato.

### Qué le recomendamos
De 3 a 5 acciones en orden de prioridad. Cada una con el servicio o el plan de Inherent que la resuelve.

### El plan que le corresponde
Qué plan de Inherent encaja y por qué. Si algo cae fuera de ese plan, dilo como extra.

Reglas:
- Usa solo lo que dicen las respuestas. Lo que afirma el cliente va como [dice el cliente, sin verificar].
- Si falta un dato, escribe ⚠️ SIN DATOS. No inventes números.
- No prometas precio, fecha ni alcance: eso lo decide el CEO de Inherent.
- Responde SOLO con el diagnóstico, sin introducción ni cierre.

---
# ${d.title}
${qa}`;
  }

  // Entrevista: en los temas numerados («## 1 · Tema») cada pregunta («1. …») lleva su caja de respuesta, que se guarda sola en el documento.
  // «   > Lo ideal: …» debajo de la pregunta es la guía para quien entrevista: hacia dónde guiarlo y con qué servicio.
  function interview(body, answers = {}, live = true) {
    const out = [], items = []; let buf = [], sec = 0, head = '', cur = null, total = 0, done = 0;
    const flushMd = () => { if (buf.length) { out.push(md(buf.join('\n'))); buf = []; } };
    const flushQ = () => { if (!cur) return; const a = answers[cur.k] || ''; total++; if (a.trim()) done++; items.push({ ...cur, head });
      out.push(html`<div class="iq"><div class="iq-q"><span class="iq-n">${cur.n}</span><div>${raw(inline(cur.q))}</div></div>
        <textarea class="in iq-a" data-k="${cur.k}" rows="2" placeholder="${live ? 'Su respuesta…' : 'Aquí va la respuesta'}" ${live ? '' : raw('disabled')}>${a}</textarea>
        ${cur.ideal.length ? html`<div class="iq-ideal"><span>Lo ideal</span>${raw(cur.ideal.map(inline).join('<br>'))}</div>` : ''}</div>`); cur = null; };
    for (const line of String(body).split('\n')) {
      let m;
      if (cur && (m = /^\s+>\s*(?:\*\*)?lo ideal:?(?:\*\*)?:?\s*(.*)/i.exec(line))) { cur.ideal.push(m[1]); continue; }
      if (cur && /^\s+>\s?/.test(line)) { cur.ideal.push(line.replace(/^\s+>\s?/, '')); continue; }
      if (sec && (m = /^(\d+)[.)]\s+(.*)/.exec(line))) { flushQ(); flushMd(); cur = { n: m[1], q: m[2], k: `${sec}.${m[1]}`, ideal: [] }; continue; }
      if (cur && !line.trim()) continue;
      flushQ();
      if ((m = /^##\s+(?:(\d+)\s*·)?\s*(.*)/.exec(line))) { sec = m[1] || 0; head = m[2]; } // solo los temas numerados («## 1 · Tema») llevan preguntas
      buf.push(line);
    }
    flushQ(); flushMd();
    return { view: html`<div class="iview">${out}</div>`, items, total, done };
  }

  // ---------- Documento: leer y editar ----------
  async function docPage(id) {
    let d = docs.find((x) => x.id === id);
    if (!d) return mount(el, html`<a class="btn ghost" href="#/library">← Library</a>${vacio({ icono: 'inbox', titulo: 'Ese documento no existe' })}`);
    let editing = sub[2] === 'edit', ed = null;
    const back = inFolder(d) ? `#/library/${d.folder_id}` : '#/library';
    const paint = () => {
      const em = embedUrl(d.url), isDg = d.kind === 'Diagrama';
      // El diagrama: el JSON guardado; si solo hay Mermaid de flujo, se importa; si es otro Mermaid (secuencia, mindmap…), se muestra como antes.
      const dg = isDg ? fromDoc(d, { measure }) : null, dgOld = isDg && !dg && String(d.body || '').trim();
      ed = null;
      mount(el, html`<div class="row lib-dbar" style="margin-bottom:14px;gap:8px">${crumbs(inFolder(d), editing ? `Editando · ${d.title}` : d.title)}<div class="sp"></div>
          ${editing ? html`<button class="btn ghost" data-act="cancel">Cancelar</button><button class="btn" data-act="save">Guardar</button>` : html`<button class="btn ghost" data-act="del">${ico('trash')}</button><button class="btn" data-act="edit">Editar</button>`}</div>
        <div class="${editing ? `card lib-edit${isDg ? ' wide' : ''}` : 'sp-panel lib-read'}">
          ${editing ? html`${raw(isDg ? `<details class="lib-dmeta"${innerWidth > 760 ? ' open' : ''}><summary>Tipo, perfiles y carpeta</summary>` : '')}<div class="row" style="gap:10px;flex-wrap:wrap"><select class="in" id="dkind" style="width:auto">${KINDS.map((k) => html`<option ${k === d.kind ? raw('selected') : ''}>${k}</option>`)}</select><span class="mut sm" style="margin-left:6px">Perfil:</span>${WORK_ROLES.map(([k, l]) => html`<label class="chip" style="cursor:pointer;padding:6px 10px"><input type="checkbox" class="drole" value="${k}" ${(d.roles || []).includes(k) ? raw('checked') : ''} style="margin-right:4px">${l.split(' · ')[0]}</label>`)}<select class="in" id="dfolder" style="width:auto"><option value="">— Sin carpeta</option>${flatTree(folders).map((r) => html`<option value="${r.f.id}" ${r.f.id === d.folder_id ? raw('selected') : ''}>${pathLabel(folders, r.f.id)}</option>`)}</select>
              ${canGuia ? html`<select class="in" id="dguia" style="width:auto" title="Este documento es el «Cómo se usa» de una parte del OS: su botón aparece en esa sección"><option value="">— No es «Cómo se usa»</option>${SECCIONES.map(([k, l]) => html`<option value="${k}" ${k === d.guia ? raw('selected') : ''}>Cómo se usa · ${l}</option>`)}</select><input class="in" id="dorden" type="number" min="0" style="width:84px" placeholder="Orden" title="En qué orden se ve (la primera semana)" value="${d.orden || ''}">` : ''}</div>${raw(isDg ? '</details>' : '')}
              <input class="in" id="dtitle" value="${d.title}" style="font-size:34px;font-weight:500;letter-spacing:-1px;border:0;padding:10px 0;background:transparent;margin-top:8px">
              ${isDg ? html`${dgOld ? html`<div class="warnbox" style="margin:4px 0 12px">Este diagrama estaba escrito en Mermaid de otro tipo (no es un flujo) y no se puede pasar solo al editor visual. Abajo está cómo se veía: ármalo de nuevo con una plantilla. Al guardar, se reemplaza.</div>${diagram(d.body)}` : ''}
              <div class="lib-dged" id="dged"></div>
              <div class="mut sm" style="margin-top:10px">Doble clic para crear un nodo o escribir en él · arrastra desde un punto del borde para conectar · «?» muestra todos los atajos · ⌘S guarda.</div>`
              : html`<input class="in" id="durl" value="${d.url || ''}" placeholder="Video o link (YouTube, Loom, Vimeo, Drive) — opcional" style="margin-bottom:12px">
              <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px"><button class="chip" data-act="fmt" style="padding:7px 12px">↺ Insertar el formato de ${d.kind || 'Nota'}</button></div>
              <div class="grid g11" style="gap:14px"><textarea class="in" id="dbody" style="min-height:58vh;font-family:ui-monospace,Menlo,monospace;font-size:13.5px;line-height:1.6" placeholder="# Título&#10;&#10;1. Primer paso&#10;2. Segundo paso&#10;&#10;> Nota importante">${d.body || ''}</textarea><div class="card glass" id="dprev" style="min-height:58vh;overflow:auto">${prev(d.kind, d.body || '')}</div></div>
              <div class="mut sm" style="margin-top:8px">${d.kind === 'Entrevista' ? 'Los temas van numerados (## 1 · Tema). Dentro, cada pregunta numerada (1. …) lleva su caja de respuesta. Debajo, con sangría, «   > Lo ideal: …» es la guía para quien entrevista.' : 'Escribe en Markdown: # títulos, - listas, - [ ] checklist, **negritas**, > notas, [links](https://…). Para un diagrama dentro del texto usa un bloque ```mermaid. La vista previa se actualiza sola.'}</div>`}`
            : html`<div class="lib-prose${isDg ? ' wide' : ''}"><div class="lib-meta"><span class="lib-ic" style="--k:${KCOL[d.kind] || 'var(--ui-ink2)'}">${ico(KICO[d.kind] || 'doc', 16)}</span><span class="lbl">${d.kind || 'Doc'}</span><div class="sp"></div><span class="mut sm">${d._meta?.updated_at ? 'Actualizado ' + fdate(String(d._meta?.updated_at).slice(0, 10)) : ''}${d._meta?.updated_by ? ' · ' + d._meta?.updated_by : ''}</span></div>
              <h1 class="lib-title">${d.title}</h1>
              ${em ? html`<iframe src="${em}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:20px;margin-bottom:22px;background:var(--ui-ink2)" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>` : d.url ? html`<a class="artifact" href="${d.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin-bottom:18px"><span class="fi">↗</span><div><b style="font-weight:500">Abrir link</b></div></a>` : ''}
              ${d.kind === 'Prompt' ? html`<div class="row" style="gap:8px;margin-bottom:10px"><span class="chip">${d.client ? d.client.toUpperCase() : 'General'}</span><span class="chip">${d.vtype || 'Video'}</span><div class="sp"></div><button class="btn ghost" data-act="copyPrompt">Copiar prompt</button>${canClaude ? html`<button class="btn" data-act="claudePrompt">${ICON.sparkle} Abrir en Claude</button>` : ''}</div><pre class="repo-pre" id="ptext">${d.body || ''}</pre>`
                : isDg ? (dg ? (dg.nodes.length ? html`<div class="lib-dgview" id="dgview"></div>` : html`${vacio({ icono: 'inbox', titulo: 'Diagrama vacío', linea: 'Dale «Editar» para dibujarlo.' })}`) : d.body ? diagram(d.body) : html`${vacio({ icono: 'inbox', titulo: 'Diagrama vacío', linea: 'Dale «Editar» para dibujarlo.' })}`)
                : !d.body ? html`${vacio({ icono: 'inbox', titulo: 'Documento vacío', linea: 'Dale «Editar» para escribirlo.' })}`
                : d.kind === 'Entrevista' ? (() => { const iv = interview(d.body, d.answers || {}); return html`<div class="iq-bar"><span id="iqcount">${iv.done} de ${iv.total} respondidas</span><span class="sp"></span><span id="iqsave" class="mut"></span><button class="btn" data-act="diag">${ICON.sparkle} ${d.diagnosis ? 'Rehacer diagnóstico' : 'Pedir diagnóstico'}</button></div>
                  ${d.diagnosis ? html`<details class="iq-diag" open><summary><b>Diagnóstico</b><span class="mut sm">${d.diagnosis_at ? fdate(d.diagnosis_at) : ''}</span></summary>${md(d.diagnosis)}</details>` : ''}${iv.view}`; })() : html`<div class="lib-body">${md(d.body)}</div>`}</div>`}
        </div>`);
      const ta = $('#dbody', el); if (ta) { let t0; ta.oninput = () => { clearTimeout(t0); t0 = setTimeout(() => mount($('#dprev', el), prev(curKind(), ta.value)), d.kind === 'Diagrama' ? 400 : 120); }; }
      const ks = $('#dkind', el); if (ks) ks.onchange = () => { const cur = ed ? ed.get() : null; d = { ...d, kind: ks.value, body: ta ? ta.value : cur ? toMermaid(cur) : d.body, ...(cur ? { diagram: cur } : {}) }; paint(); };
      if (editing && isDg) ed = diagramEditor($('#dged', el), dg || emptyDiagram(), { title: d.title, confirm: confirmAsk, toast, onSave: () => doSave() });
      if (!editing && isDg && dg?.nodes.length) diagramView($('#dgview', el), dg, { title: d.title, toast });
      if (!editing && d.kind === 'Entrevista') wireAnswers();
    };
    // Las respuestas se guardan solas: un rato después de escribir, o al salir de la caja.
    let pend = {}, tSave = null, chain = Promise.resolve();
    const fit = (t) => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; };
    const stat = (s, bad) => { const x = $('#iqsave', el); if (x) { x.textContent = s; x.style.color = bad ? '#b4532a' : ''; } };
    const count = () => { const all = [...el.querySelectorAll('.iq-a')]; const c = $('#iqcount', el); if (c) c.textContent = `${all.filter((t) => t.value.trim()).length} de ${all.length} respondidas`; };
    const put = (add) => D.save({ ...d, answers: { ...(d.answers || {}), ...add } });
    const flush = () => { clearTimeout(tSave); chain = chain.then(async () => {
      const add = pend; pend = {}; if (!Object.keys(add).length) return; stat('Guardando…');
      try { try { d = await put(add); } catch { d = await D.get(d.id); d = await put(add); } // si alguien más guardó, se toma su versión y se suma la respuesta
        docs = docs.map((x) => (x.id === d.id ? d : x)); stat('Guardado'); }
      catch (e) { pend = { ...add, ...pend }; stat('No se guardó: revisa tu conexión', true); }
    }); return chain; };
    function wireAnswers() {
      el.querySelectorAll('.iq-a').forEach((t) => { fit(t);
        t.oninput = () => { fit(t); pend[t.dataset.k] = t.value; count(); stat('Sin guardar'); clearTimeout(tSave); tSave = setTimeout(flush, 800); };
        t.onblur = () => { if (Object.keys(pend).length) flush(); };
      });
    }
    addEventListener('hashchange', () => { if (Object.keys(pend).length) flush(); }, { once: true });
    const curKind = () => $('#dkind', el)?.value || d.kind;
    acts(el, {
      fmt: async () => { const ta = $('#dbody', el); const k = curKind(); if (ta.value.trim() && !(await confirmAsk(`¿Reemplazar el texto por el formato de ${k}?`))) return; ta.value = (TPL[k] || TPL.Nota)($('#dtitle', el).value || d.title); ta.oninput(); },
      claudePrompt: () => openClaude(d.body || ''),
      // Diagnóstico: primero se copia el pedido (con la pestaña activa, si no el navegador no deja copiar), después se abre Claude.
      diag: async () => {
        await flush();
        const iv = interview(d.body, d.answers || {});
        if (iv.done < iv.total * 0.3 && !(await confirmAsk(`Solo hay ${iv.done} de ${iv.total} respondidas. ¿Pedir el diagnóstico igual?`))) return;
        const prompt = diagPrompt(d, iv.items, folders.find((f) => f.id === d.folder_id)?.name || '');
        const copy = async () => { try { await navigator.clipboard.writeText(prompt); } catch { const ta = $('#dprompt'); ta.select(); document.execCommand('copy'); } };
        drawer(html`<div class="row"><b style="font-size:20px;font-weight:500">Diagnóstico con Claude</b><div class="sp"></div><button class="btn-icon end" data-act="close">${ico('x', 16)}</button></div>
          <p class="mut" style="margin:6px 0 16px">${iv.done} de ${iv.total} respondidas van en el pedido, con su pregunta y «Lo ideal».</p>
          <div class="dsteps">
            <div><span class="iq-n">1</span><div><b>Copia el pedido</b><button class="btn" data-act="dcopy" style="margin-top:8px">Copiar el pedido</button></div></div>
            <div><span class="iq-n">2</span><div><b>Abre Claude, pega y dale enviar</b><button class="btn ghost" data-act="dopen" style="margin-top:8px">${ICON.sparkle} Abrir Claude</button></div></div>
            <div><span class="iq-n">3</span><div style="flex:1"><b>Pega aquí lo que responde</b><textarea class="in" id="dout" placeholder="Pega el diagnóstico completo…" style="min-height:180px;margin-top:8px"></textarea><button class="btn" data-act="dsave" style="margin-top:8px">Guardar diagnóstico</button></div></div>
          </div>
          <details style="margin-top:14px"><summary class="mut sm" style="cursor:pointer">Ver el pedido</summary><textarea class="in" id="dprompt" readonly style="min-height:200px;margin-top:8px;font-size:12px">${prompt}</textarea></details>`, {
          dcopy: async (t) => { await copy(); t.textContent = 'Copiado ✓'; toast('Pedido copiado'); },
          dopen: async () => { await copy(); openClaude(prompt); },
          dsave: async () => {
            const out = $('#dout').value.trim(); if (!out) return toast('Pega primero lo que respondió Claude', true);
            try { d = await D.save({ ...d, diagnosis: out, diagnosis_at: new Date().toISOString().slice(0, 10) }); docs = docs.map((x) => (x.id === d.id ? d : x)); closeDrawer(); toast('Diagnóstico guardado'); paint(); } catch (e) { toast(e.message, true); }
          },
        });
      },
      copyPrompt: async () => { try { await navigator.clipboard.writeText(d.body || ''); toast('Prompt copiado'); } catch { toast('No pude copiar: selecciona el texto', true); } },
      edit: async () => { await flush(); editing = true; history.replaceState(null, '', `#/library/${d.folder_id || '_'}/${d.id}/edit`); paint(); },
      cancel: async () => { if (ed?.dirty && !(await confirmAsk('¿Salir sin guardar los cambios del diagrama?'))) return; editing = false; history.replaceState(null, '', `#/library/${d.folder_id || '_'}/${d.id}`); paint(); },
      save: () => doSave(),
      del: async () => { if (!(await confirmAsk(`¿Eliminar «${d.title}»?`))) return; await D.remove(d.id); docs = docs.filter((x) => x.id !== d.id); location.hash = back.slice(1); },
    });
    // Guardar: el diagrama va como JSON (nodos, conectores, vista) y también como Mermaid en el cuerpo, para leerlo desde el MCP o en Markdown.
    async function doSave() {
      const kind = $('#dkind', el).value, urlEl = $('#durl', el), url = urlEl ? urlEl.value.trim() : d.url || '';
      if (url && !/^https:\/\//.test(url)) return toast('El link debe empezar con https://', true);
      const dgm = kind === 'Diagrama' && ed ? ed.get() : null;
      const { diagram: _old, ...rest } = d;
      try {
        d = await D.save({ ...rest, title: $('#dtitle', el).value.trim() || d.title, kind, folder_id: $('#dfolder', el).value, url, body: dgm ? toMermaid(dgm) : $('#dbody', el)?.value ?? d.body, ...(dgm ? { diagram: dgm } : kind === 'Diagrama' && _old ? { diagram: _old } : {}), roles: [...el.querySelectorAll('.drole:checked')].map((x) => x.value), ...(canGuia ? { guia: $('#dguia', el)?.value || '', orden: Number($('#dorden', el)?.value) || 0 } : {}) });
        if (canGuia) olvidarGuias();
        docs = docs.map((x) => (x.id === d.id ? d : x)); ed?.clean(); editing = false; history.replaceState(null, '', `#/library/${d.folder_id || '_'}/${d.id}`); toast('Guardado'); paint();
      } catch (e) { toast(e.message, true); }
    }
    paint();
  }

  if (did) return docPage(did);
  return browse(fid && fid !== '_' ? fid : null);
}
