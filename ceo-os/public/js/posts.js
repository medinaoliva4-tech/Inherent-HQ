// «Por postear»: los videos y piezas propias de un perfil, de la idea a publicado.
// Se usa en Content y en la página de cada cliente. Vive en la colección content.
import { html, raw, mount, col, ask, toast, fdate, $, $$, confirmAsk, drawer, closeDrawer, embedUrl , wizard } from './core.js';

export const PSTATUS = ['Idea', 'Grabado', 'Editado', 'Programado', 'Publicado'];
const PCLS = { Idea: '', Grabado: 'amber', Editado: 'blue', Programado: 'lime', Publicado: 'green' };
const C = col('content');

export const loadPosts = async (profile) => (await C.list()).filter((p) => p.profile === profile && p.kind === 'post');

export async function editPost(profile, p) {
  if (!p) { // nueva pieza: con preguntas
    const a = await wizard('Nueva pieza', [
      { k: 'format', q: '¿Qué formato?', type: 'cards', req: true, opts: [['Reel', '🎬'], ['TikTok', '🎵'], ['Carrusel', '🗂️'], ['Story', '⭕'], ['Estático', '🖼️'], ['YouTube', '▶️']].map(([v, i]) => ({ v, i, l: v })) },
      { k: 'title', q: '¿Cuál es la idea?', type: 'text', req: true, ph: 'Ej. Detrás de cocina' },
      { k: 'date', q: '¿Cuándo sale?', type: 'when' },
      { k: 'status', q: '¿En qué va?', type: 'cards', req: true, opts: PSTATUS.map((v) => ({ v, l: v })) },
    ], 'Agregar');
    if (!a) return null;
    try { return await C.create({ ...a, profile, kind: 'post' }); } catch (e) { toast(e.message, true); return null; }
  }
  const v = await ask(p ? 'Editar pieza' : 'Nueva pieza por postear', [
    { k: 'title', l: 'Título', v: p?.title, req: true },
    { k: 'format', l: 'Formato', t: 'select', opts: ['Reel', 'TikTok', 'Carrusel', 'Story', 'Estático', 'YouTube'].map((x) => [x, x]), v: p?.format || 'Reel', half: true },
    { k: 'date', l: 'Fecha de publicación', t: 'date', v: p?.date, half: true },
    { k: 'status', l: 'Estado', t: 'select', opts: PSTATUS.map((x) => [x, x]), v: p?.status || 'Idea', half: true },
    { k: 'url', l: 'Video o archivo (Drive)', v: p?.url, half: true },
    { k: 'caption', l: 'Caption', t: 'textarea', v: p?.caption },
  ], p ? 'Guardar' : 'Agregar');
  if (!v) return null;
  if (v.url && !/^https:\/\//.test(v.url)) { toast('El link debe empezar con https://', true); return null; }
  try { return p ? await C.save({ ...p, ...v }) : await C.create({ ...v, profile, kind: 'post' }); } catch (e) { toast(e.message, true); return null; }
}

// Tablero por estado, con arrastrar y soltar. onChange(list) recibe la lista actualizada.
export function postsBoard(b, profile, list, onChange) {
  const sorted = (s) => list.filter((p) => (p.status || 'Idea') === s).sort((a, z) => String(a.date || '9').localeCompare(String(z.date || '9')));
  mount(b, html`<div class="row" style="margin-bottom:12px"><span class="mut sm">${list.length} piezas · arrastra para cambiar de estado</span><div class="sp"></div><button class="btn" data-pact="new">+ Pieza</button></div>
    <div class="kanban swap">${PSTATUS.map((s) => html`<div class="kcol" data-st="${s}"><h4><span>${s}</span><span class="mut">${sorted(s).length}</span></h4>
      ${sorted(s).map((p) => html`<div class="kcard" draggable="true" data-pact="open" data-id="${p.id}"><div class="row"><span class="chip ${PCLS[s]}" style="font-size:11px">${p.format || 'Pieza'}</span><div class="sp"></div><span class="mut sm">${p.date ? fdate(p.date) : ''}</span></div><b style="margin-top:8px">${p.title}</b>${p.caption ? html`<div class="mut sm" style="margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.caption}</div>` : ''}${p.url ? html`<div class="sm" style="margin-top:6px">🎬 Con video</div>` : ''}</div>`)}</div>`)}</div>`);
  const save = (r) => { if (!r) return; list = list.some((x) => x.id === r.id) ? list.map((x) => (x.id === r.id ? r : x)) : [...list, r]; onChange(list); };
  b.onclick = async (e) => {
    const t = e.target.closest('[data-pact]'); if (!t) return;
    if (t.dataset.pact === 'new') return save(await editPost(profile, null));
    const p = list.find((x) => x.id === t.dataset.id); if (p) openPost(p);
  };
  function openPost(p) {
    const em = embedUrl(p.url);
    drawer(html`<div class="row"><span class="chip ${PCLS[p.status || 'Idea']}">${p.status || 'Idea'}</span><span class="chip">${p.format || 'Pieza'}</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
      <h2>${p.title}</h2><div class="mut">${p.date ? 'Sale el ' + fdate(p.date) : 'Sin fecha'}</div>
      ${em ? html`<iframe src="${em}" style="width:100%;aspect-ratio:9/12;border:0;border-radius:18px;margin-top:16px;background:#000" allow="autoplay; fullscreen" loading="lazy"></iframe>` : p.url ? html`<a class="artifact" href="${p.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin-top:14px"><span class="fi">▶</span><div><b style="font-weight:500">Abrir video</b></div></a>` : ''}
      ${p.caption ? html`<b class="sm" style="display:block;margin-top:18px">Caption</b><p style="white-space:pre-wrap;margin-top:6px">${p.caption}</p>` : ''}
      <b class="sm" style="display:block;margin-top:18px">Mover a</b>
      <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:8px">${PSTATUS.map((s) => html`<button class="chip ${s === (p.status || 'Idea') ? 'dark' : ''}" data-act="st" data-s="${s}" style="padding:8px 12px">${s}</button>`)}</div>
      <div class="row" style="margin-top:22px"><button class="btn" data-act="edit">Editar</button><div class="sp"></div><button class="btn ghost" data-act="del">🗑</button></div>`, {
      st: async (t) => { try { const r = await C.save({ ...p, status: t.dataset.s }); save(r); openPost(r); } catch (err) { toast(err.message, true); } },
      edit: async () => { closeDrawer(); save(await editPost(profile, p)); },
      del: async () => { if (!(await confirmAsk(`¿Eliminar «${p.title}»?`))) return; await C.remove(p.id); closeDrawer(); list = list.filter((x) => x.id !== p.id); onChange(list); },
    });
  }
  $$('.kcard', b).forEach((c) => c.addEventListener('dragstart', (e) => e.dataTransfer.setData('id', c.dataset.id)));
  $$('.kcol', b).forEach((k) => {
    k.addEventListener('dragover', (e) => { e.preventDefault(); k.classList.add('over'); });
    k.addEventListener('dragleave', () => k.classList.remove('over'));
    k.addEventListener('drop', async (e) => {
      e.preventDefault(); k.classList.remove('over');
      const p = list.find((x) => x.id === e.dataTransfer.getData('id'));
      if (!p || p.status === k.dataset.st) return;
      try { save(await C.save({ ...p, status: k.dataset.st })); } catch (err) { toast(err.message, true); }
    });
  });
}
