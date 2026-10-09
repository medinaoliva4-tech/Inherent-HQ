export const $ = (s, r = document) => r.querySelector(s);

// h('div', {class:'x', onclick:fn}, 'texto', child…) — los strings van como texto, nunca como HTML.
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(9)) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(k));
  return el;
}
const NS = 'http://www.w3.org/2000/svg';
export function svg(tag, attrs, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  for (const k of kids.flat(9)) if (k != null) el.append(k.nodeType ? k : document.createTextNode(k));
  return el;
}

export const Q = (n) => (n == null || Number.isNaN(n) ? '—' : (n < 0 ? '-Q' : 'Q') + Math.abs(Math.round(n)).toLocaleString('en-US'));
export const today = () => new Date().toISOString().slice(0, 10);

let tt;
export function toast(msg, err) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'show' + (err ? ' err' : '');
  clearTimeout(tt); tt = setTimeout(() => (t.className = ''), 2600);
}

export const events = new EventTarget();
export async function api(path, opts = {}) {
  const r = await fetch(path, {
    credentials: 'same-origin',
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== '/api/login' && path !== '/api/me') events.dispatchEvent(new Event('logout'));
  if (!r.ok) throw Object.assign(new Error(j.error || `Error ${r.status}`), { status: r.status });
  return j;
}

// El repo como DB: un archivo = una colección. Cada save = un commit.
export async function readFileRaw(path) { return api('/api/file?path=' + encodeURIComponent(path)); }
export async function readJSON(path, fallback) {
  const f = await readFileRaw(path);
  return { data: f.content ? JSON.parse(f.content) : fallback, sha: f.sha };
}
export async function save(path, content, sha, message) {
  return api('/api/file', { method: 'PUT', body: { path, content, sha, message } });
}
export async function saveJSON(path, data, sha, message) {
  return save(path, JSON.stringify(data, null, 2) + '\n', sha, message);
}

// CSV (RFC 4180) para el CRM
export function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some((x) => x !== '')) rows.push(row); row = []; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const headers = rows.shift() || [];
  return { headers, rows: rows.map((r) => Object.fromEntries(headers.map((k, i) => [k, r[i] ?? '']))) };
}
export function toCSV({ headers, rows }) {
  const esc = (v) => (/[",\n\r]/.test(v ?? '') ? '"' + String(v).replace(/"/g, '""') + '"' : (v ?? ''));
  return [headers.join(','), ...rows.map((r) => headers.map((k) => esc(r[k])).join(','))].join('\n') + '\n';
}

export const PALETTE = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)', 'var(--c8)', 'var(--c9)', 'var(--c10)'];
