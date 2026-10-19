// Library tipo Finder / Drive: menú contextual, arrastrar y soltar, y el diálogo «Mover a…».
import { flatTree, canMove } from './library-tree.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const FOLDER = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4.2l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg>';
const HOME = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/></svg>';
export const folderIcon = FOLDER, homeIcon = HOME;

// ---------- menú contextual (clic derecho o el botón ⋯) ----------
let open = null;
export function closeMenu() { if (!open) return; open.el.remove(); document.removeEventListener('pointerdown', open.out, true); document.removeEventListener('keydown', open.key, true); removeEventListener('scroll', open.close, true); open = null; }
// items: [{ l, run, danger, off }] o '-' para una línea
export function ctxMenu(x, y, items) {
  closeMenu();
  const el = document.createElement('div'); el.className = 'lib-menu'; el.setAttribute('role', 'menu');
  el.innerHTML = items.map((it, i) => (it === '-' ? '<hr>' : `<button type="button" role="menuitem" data-i="${i}" class="${it.danger ? 'danger' : ''}" ${it.off ? 'disabled' : ''}>${esc(it.l)}</button>`)).join('');
  document.body.append(el);
  const w = el.offsetWidth, h = el.offsetHeight;
  el.style.left = Math.max(8, Math.min(innerWidth - w - 8, x)) + 'px'; el.style.top = Math.max(8, Math.min(innerHeight - h - 8, y)) + 'px';
  el.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (!b) return; const it = items[b.dataset.i]; closeMenu(); it.run?.(); });
  const out = (e) => { if (!el.contains(e.target)) closeMenu(); };
  const key = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); closeMenu(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const bs = [...el.querySelectorAll('button:not([disabled])')]; const i = bs.indexOf(document.activeElement); bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length]?.focus(); }
  };
  open = { el, out, key, close: closeMenu };
  setTimeout(() => { document.addEventListener('pointerdown', out, true); document.addEventListener('keydown', key, true); addEventListener('scroll', closeMenu, true); }, 0);
  el.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
}

// ---------- arrastrar y soltar ----------
// Lo que se arrastra lleva data-drag="doc|folder" data-id; donde se suelta lleva data-drop="<id de carpeta>" ('' = la raíz).
let dragging = null;
export function wireDnd(root, { folders, onDrop }) {
  const valid = (target) => {
    if (!dragging) return false;
    const t = target || null;
    if (dragging.kind === 'folder') return dragging.id !== t && canMove(folders(), dragging.id, t) && (dragging.parent || null) !== t;
    return (dragging.folder || null) !== t;
  };
  root.addEventListener('dragstart', (e) => {
    const s = e.target.closest?.('[data-drag]'); if (!s || !root.contains(s)) return;
    dragging = { kind: s.dataset.drag, id: s.dataset.id, folder: s.dataset.folder || '', parent: s.dataset.parent || '' };
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('application/x-lib', JSON.stringify(dragging)); e.dataTransfer.setData('text/plain', s.dataset.name || ''); } catch {}
    s.classList.add('lib-dragging'); document.documentElement.classList.add('lib-dnd');
  });
  root.addEventListener('dragend', (e) => {
    e.target.closest?.('[data-drag]')?.classList.remove('lib-dragging'); dragging = null;
    document.documentElement.classList.remove('lib-dnd'); root.querySelectorAll('.lib-drop-on').forEach((x) => x.classList.remove('lib-drop-on'));
  });
  root.addEventListener('dragover', (e) => {
    const t = e.target.closest?.('[data-drop]'); if (!t || !root.contains(t) || !valid(t.dataset.drop)) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    if (!t.classList.contains('lib-drop-on')) { root.querySelectorAll('.lib-drop-on').forEach((x) => x.classList.remove('lib-drop-on')); t.classList.add('lib-drop-on'); }
  });
  root.addEventListener('dragleave', (e) => { const t = e.target.closest?.('[data-drop]'); if (t && !t.contains(e.relatedTarget)) t.classList.remove('lib-drop-on'); });
  root.addEventListener('drop', (e) => {
    const t = e.target.closest?.('[data-drop]'); if (!t || !dragging || !valid(t.dataset.drop)) return;
    e.preventDefault(); t.classList.remove('lib-drop-on');
    const d = dragging; dragging = null; document.documentElement.classList.remove('lib-dnd');
    onDrop(d.kind, d.id, t.dataset.drop || null);
  });
}

// ---------- «Mover a…»: el árbol completo, sin las carpetas a las que no puede ir ----------
export function moveDialog(folders, { title = 'Mover a…', kind = 'doc', id = null, current = null } = {}) {
  return new Promise((resolve) => {
    const dlg = document.createElement('dialog'); dlg.className = 'dlg lib-move';
    const rows = flatTree(folders);
    const ok = (fid) => (kind === 'folder' ? canMove(folders, id, fid) && fid !== id : true);
    const row = (fid, name, depth, icon) => `<button type="button" class="lib-mv${(current || null) === fid ? ' cur' : ''}" data-f="${esc(fid || '')}" style="--d:${depth}" ${ok(fid) && (current || null) !== fid ? '' : 'disabled'}>${icon}<span>${esc(name)}</span>${(current || null) === fid ? '<em>aquí está</em>' : ''}</button>`;
    dlg.innerHTML = `<div class="in-dlg"><h3>${esc(title)}</h3><div class="lib-mvlist">${row(null, 'Library (raíz)', 0, HOME)}${rows.map((r) => row(r.f.id, r.f.name, r.depth + 1, FOLDER)).join('')}</div>
      <div class="row" style="margin-top:14px"><button type="button" class="btn ghost" data-x>Cancelar</button></div></div>`;
    document.body.append(dlg);
    let out;
    dlg.addEventListener('click', (e) => { if (e.target.closest('[data-x]')) return dlg.close(); const b = e.target.closest('.lib-mv'); if (!b || b.disabled) return; out = b.dataset.f || null; dlg.close(); });
    dlg.addEventListener('close', () => { dlg.remove(); resolve(out === undefined ? undefined : out); });
    dlg.showModal(); dlg.querySelector('.lib-mv:not([disabled])')?.focus();
  });
}
