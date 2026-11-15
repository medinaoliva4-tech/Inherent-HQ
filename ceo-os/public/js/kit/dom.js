export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v); else if (k === 'class') el.className = v; else if (k in el && !k.startsWith('aria')) el[k] = v; else el.setAttribute(k, String(v)); }
  for (const x of children.flat(Infinity)) if (x != null && x !== false) el.append(x instanceof Node ? x : document.createTextNode(String(x)));
  return el;
}
export const dato = (v) => v === null || v === undefined || v === '' ? 'Sin datos' : typeof v === 'number' ? new Intl.NumberFormat('es-GT', { maximumFractionDigits: 2 }).format(v) : String(v);
export const status = (text) => h('p', { class: 'kit-status', role: 'status', 'aria-live': 'polite' }, text);
export function frame(title, description) { if (!document.querySelector('link[href="/kit.css"]')) document.head.append(h('link', { rel: 'stylesheet', href: '/kit.css' })); return h('section', { class: 'kit-component', 'aria-label': title }, h('header', {}, h('h2', {}, title), description && h('p', { class: 'kit-muted' }, description))); }
export const empty = (text = 'Todavía no hay datos para esta vista.') => h('p', { class: 'kit-empty' }, text);
export const button = (label, onClick, disabled = false) => h('button', { type: 'button', class: 'kit-button', onClick, disabled }, label);
export function link(source) { try { const u = new URL(source.url); if (u.protocol === 'https:') return h('a', { href: u.href, target: '_blank', rel: 'noopener noreferrer' }, source.title || source.ref || u.hostname); } catch {} return h('span', {}, source.title || source.ref || 'Fuente sin enlace verificable'); }
export function table(headers, rows) { return h('div', { class: 'kit-table-wrap', tabIndex: 0 }, h('table', {}, h('thead', {}, h('tr', {}, headers.map((x) => h('th', { scope: 'col' }, x)))), h('tbody', {}, rows.map((r) => h('tr', {}, r.map((x) => h('td', {}, x))))))); }
