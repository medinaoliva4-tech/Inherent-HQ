// Carpetas anidadas de la Library (tipo Finder / Drive). Funciones puras: no tocan el DOM, se prueban en Node.
// Una carpeta tiene parent_id (null = raíz). Las carpetas viejas sin parent_id, o con un padre que ya no existe, son raíz.

const pid = (f) => (f && f.parent_id ? String(f.parent_id) : null);

// El padre efectivo: si apunta a sí misma, a algo que no existe o a un ciclo, la carpeta vive en la raíz.
export function parentOf(folders, id) {
  const by = new Map(folders.map((f) => [f.id, f]));
  const f = by.get(id); if (!f) return null;
  const p = pid(f); if (!p || p === id || !by.has(p)) return null;
  // ciclo (datos viejos o editados a mano): si subiendo se vuelve a la misma, se corta en la raíz
  const seen = new Set([id]); let cur = p;
  while (cur) { if (seen.has(cur)) return null; seen.add(cur); cur = pid(by.get(cur)); if (cur && !by.has(cur)) break; }
  return p;
}

export const childrenOf = (folders, parent = null) => folders.filter((f) => parentOf(folders, f.id) === (parent || null))
  .sort((a, z) => String(a.name || '').localeCompare(String(z.name || ''), 'es', { sensitivity: 'base' }));

// La ruta de la raíz a la carpeta: [abuela, madre, carpeta].
export function pathOf(folders, id) {
  const by = new Map(folders.map((f) => [f.id, f]));
  const out = []; let cur = by.has(id) ? id : null; const seen = new Set();
  while (cur && !seen.has(cur)) { seen.add(cur); out.unshift(by.get(cur)); cur = parentOf(folders, cur); }
  return out;
}

// Todas las carpetas de adentro (hijas, nietas…), sin incluirla a ella.
export function descendants(folders, id) {
  const out = new Set(); const stack = [id];
  while (stack.length) { const cur = stack.pop(); for (const f of folders) if (!out.has(f.id) && f.id !== id && parentOf(folders, f.id) === cur) { out.add(f.id); stack.push(f.id); } }
  return out;
}

// ¿Se puede mover la carpeta «id» dentro de «target» (null = raíz)? No a sí misma ni a una de sus hijas.
export function canMove(folders, id, target) {
  if (!target) return true;
  if (target === id) return false;
  if (!folders.some((f) => f.id === target)) return false;
  return !descendants(folders, id).has(target);
}

// Por qué no se puede guardar ese padre (para el servidor): null si está bien.
export function parentError(folders, id, parent) {
  if (!parent) return null;
  if (typeof parent !== 'string') return 'La carpeta de arriba no es válida';
  if (!folders.some((f) => f.id === parent)) return 'La carpeta de arriba no existe';
  if (id && !canMove(folders, id, parent)) return 'Una carpeta no puede ir dentro de sí misma';
  return null;
}

// Lo que hay adentro, contando todo el árbol: para preguntar antes de borrar.
export function contentsOf(folders, docs, id) {
  const sub = descendants(folders, id); const all = new Set([id, ...sub]);
  return { folders: sub.size, docs: docs.filter((d) => all.has(d.folder_id)).length, ids: all };
}

// El árbol listo para pintar: [{ f, depth, kids }] en orden, empezando por la raíz.
export function flatTree(folders, parent = null, depth = 0, out = []) {
  for (const f of childrenOf(folders, parent)) { const kids = childrenOf(folders, f.id).length; out.push({ f, depth, kids }); flatTree(folders, f.id, depth + 1, out); }
  return out;
}

// El nombre con su ruta, para listas: «Producción / Guiones».
export const pathLabel = (folders, id) => pathOf(folders, id).map((f) => f.name).join(' / ');
