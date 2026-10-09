// ---------- HTML seguro: todo lo interpolado se escapa, salvo lo que ya es html`` ----------
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(String(s));
const val = (v) => (v instanceof Raw ? v.s : Array.isArray(v) ? v.map(val).join('') : v == null || v === false ? '' : esc(v));
export function html(strings, ...vals) { let o = ''; strings.forEach((s, i) => { o += s; if (i < vals.length) o += val(vals[i]); }); return new Raw(o); }
export function mount(el, content) { el.innerHTML = val(content); return el; }

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Delegación: elementos con data-act="nombre" llaman acts[nombre](el, event).
export function acts(root, map, type = 'click') {
  root.addEventListener(type, (e) => {
    const t = e.target.closest('[data-act]');
    if (t && root.contains(t) && map[t.dataset.act]) map[t.dataset.act](t, e);
  });
}

// ---------- formatos ----------
export const Q = (n) => (n == null || isNaN(n) ? '—' : (n < 0 ? '-Q' : 'Q') + Math.round(Math.abs(n)).toLocaleString('en-US'));
export const USD = (n) => (n == null || isNaN(n) ? '—' : '$' + Math.round(n).toLocaleString('en-US'));
export const K = (n) => (Math.abs(n) >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(Math.round(n)));
export const today = () => new Date().toISOString().slice(0, 10);
export const fdate = (d) => (d ? new Date(d + (d.length === 10 ? 'T12:00' : '')).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' }) : '—');
export const fdateLong = (d) => new Date(d + (d.length === 10 ? 'T12:00' : '')).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
export const initials = (n) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// ---------- API ----------
export const events = new EventTarget();
export async function api(path, opts = {}) {
  const r = await fetch('/api/' + path, {
    method: opts.method || 'GET', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CEOOS': '1' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== 'me') events.dispatchEvent(new Event('logout'));
  if (!r.ok) throw Object.assign(new Error(j.error || `Error ${r.status}`), { status: r.status, code: j.code });
  return j;
}
// Colecciones de la base de datos
// El equipo, con la foto que cada quien subió por encima de la de Google.
export const teamList = async () => (await api('db/team')).items.map((p) => ({ ...p, google_picture: p.picture || null, picture: p.photo || p.picture || null }));
// Para guardar una persona: devuelve la foto de Google a su lugar (la de perfil va en `photo`).
export const teamDoc = (p) => { const { google_picture, ...rest } = p; return { ...rest, picture: google_picture ?? rest.picture ?? null }; };
// Recorta una imagen a un cuadrado chico (para fotos de perfil) y la devuelve como data URL JPEG.
export function squareImage(file, size = 256) {
  return new Promise((ok, ko) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = size; const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.85)); };
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('No pude leer esa imagen')); }; img.src = url;
  });
}
export const col = (name) => ({
  list: async () => (await api('db/' + name)).items,
  get: (id) => api(`db/${name}/${encodeURIComponent(id)}`),
  create: (data) => api('db/' + name, { method: 'POST', body: data }),
  save: (doc) => api(`db/${name}/${encodeURIComponent(doc.id)}`, { method: 'PUT', body: doc }),
  remove: (id) => api(`db/${name}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
});

// ---------- UI: toast, drawer, diálogo ----------
let tt;
export function toast(msg, err) {
  const t = $('#toast'); t.textContent = msg; t.className = 'on' + (err ? ' err' : '');
  clearTimeout(tt); tt = setTimeout(() => (t.className = ''), 2800);
}
export function drawer(content, map = {}) {
  const d = $('#drawer'); mount(d, content);
  d.onclick = (e) => { const t = e.target.closest('[data-act]'); if (!t) return; if (t.dataset.act === 'close') return closeDrawer(); map[t.dataset.act]?.(t, e); };
  d.classList.add('on'); $('#veil').classList.add('on');
  return d;
}
export function closeDrawer() { $('#drawer').classList.remove('on'); $('#veil').classList.remove('on'); }

// fields: [{k, l, t:'text'|'number'|'date'|'select'|'textarea'|'email', opts:[], v, req, half}]
export function ask(title, fields, okLabel = 'Guardar') {
  return new Promise((resolve) => {
    const dlg = document.createElement('dialog'); dlg.className = 'dlg';
    const input = (f) => f.t === 'checks' ? html`<div class="checks">${(f.opts || []).map(([v, l]) => html`<label class="check"><input type="checkbox" name="${f.k}" value="${v}" ${(f.v || []).includes(v) ? raw('checked') : ''}> ${l}</label>`)}</div>`
      : f.t === 'select' ? html`<select class="in" name="${f.k}">${(f.opts || []).map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return html`<option value="${v}" ${String(v) === String(f.v ?? '') ? raw('selected') : ''}>${l}</option>`; })}</select>`
      : f.t === 'textarea' ? html`<textarea class="in" name="${f.k}">${f.v ?? ''}</textarea>`
      : html`<input class="in" name="${f.k}" type="${f.t || 'text'}" value="${f.v ?? ''}" ${f.t === 'number' ? raw('step="any"') : ''}>`;
    const rows = []; let pend = [];
    fields.forEach((f) => { const cell = html`<div><label class="f">${f.l}${f.req ? ' *' : ''}</label>${input(f)}</div>`; if (f.half) { pend.push(cell); if (pend.length === 2) { rows.push(html`<div class="two">${pend}</div>`); pend = []; } } else { if (pend.length) { rows.push(html`<div class="two">${pend}</div>`); pend = []; } rows.push(cell); } });
    if (pend.length) rows.push(html`<div class="two">${pend}</div>`);
    mount(dlg, html`<form class="in-dlg form" method="dialog"><h3>${title}</h3>${rows}<div class="row" style="margin-top:6px"><button class="btn" value="ok">${okLabel}</button><button class="btn ghost" value="no" type="button" data-x>Cancelar</button></div></form>`);
    document.body.append(dlg);
    const form = $('form', dlg);
    $('[data-x]', dlg).onclick = () => dlg.close();
    form.onsubmit = (e) => {
      e.preventDefault();
      const out = {};
      for (const f of fields) { if (f.t === 'checks') { out[f.k] = [...form.querySelectorAll(`input[name="${f.k}"]:checked`)].map((x) => x.value); continue; } let v = form.elements[f.k].value.trim(); if (f.t === 'number') v = v === '' ? null : Number(v); out[f.k] = v; }
      const miss = fields.find((f) => f.req && (out[f.k] === '' || out[f.k] == null));
      if (miss) return toast(`Falta: ${miss.l}`, true);
      resolve(out); dlg.close();
    };
    dlg.addEventListener('close', () => { resolve(null); dlg.remove(); });
    dlg.showModal(); form.querySelector('.in')?.focus();
  });
}
export const confirmAsk = async (msg) => (await ask(msg, [], 'Sí, confirmar')) !== null;

// ---------- íconos ----------
export const IC = {
  google: raw('<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.6 10.8l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/></svg>'),
  drive: raw('<svg viewBox="0 0 87.3 78"><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9.06 9.06 0 000 53h27.5z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#ea4335"/><path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="M73.4 26.5L60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg>'),
  cal: raw('<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="19" rx="4" fill="#fff" stroke="#4285F4" stroke-width="1.6"/><rect x="2" y="3" width="20" height="6" rx="3" fill="#4285F4"/><text x="12" y="19" text-anchor="middle" font-size="9" font-weight="700" fill="#1a73e8" font-family="Arial">31</text></svg>'),
  ring: (d = 78) => raw(`<svg class="ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18.5" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.5"/><circle cx="20" cy="20" r="18.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-dasharray="${d} 117" stroke-linecap="round" transform="rotate(-90 20 20)"/></svg>`),
};
export const emblem = (dark) => raw(`<img src="/brand/${dark ? 'emblem-dark' : 'emblem'}.svg" alt="Inherent" style="width:100%;display:block">`);

// Matriz de puntos de las tarjetas (on = cuántas columnas encendidas de 34)
export const matrix = (on) => raw(`<div class="matrix">${Array.from({ length: 68 }, (_, i) => `<i class="${(i % 34) < on && (i < 34 ? (i * 7) % 3 !== 0 : (i * 5) % 4 !== 1) ? 'on' : ''}"></i>`).join('')}</div>`);

// ---------- gráfica de línea con tooltip ----------
// fmt: cómo se ve el número en el tooltip (por defecto 1.2K; Finance pasa Q).
export function lineChart(el, labels, series, { fmt = K } = {}) {
  const W = 640, H = el.clientHeight || 210, P = { l: 8, r: 8, t: 18, b: 26 };
  const max = Math.max(1, ...series.flatMap((s) => s.v)) * 1.15;
  const x = (i) => P.l + (labels.length < 2 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (labels.length - 1));
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const path = (v) => v.map((n, i) => { if (!i) return `M${x(0)},${y(n)}`; const cx = (x(i - 1) + x(i)) / 2; return `C${cx},${y(v[i - 1])} ${cx},${y(n)} ${x(i)},${y(n)}`; }).join(' ');
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="g${el.id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d6f35a" stop-opacity=".45"/><stop offset="1" stop-color="#d6f35a" stop-opacity="0"/></linearGradient></defs>`;
  [0.25, 0.5, 0.75].forEach((f) => s += `<line x1="0" x2="${W}" y1="${P.t + f * (H - P.t - P.b)}" y2="${P.t + f * (H - P.t - P.b)}" stroke="rgba(23,20,16,.06)"/>`);
  series.forEach((se) => { if (se.fill) s += `<path d="${path(se.v)} L${x(se.v.length - 1)},${H - P.b} L${x(0)},${H - P.b}Z" fill="url(#g${el.id})"/>`; s += `<path d="${path(se.v)}" fill="none" stroke="${se.c}" stroke-width="2" ${se.dash ? 'stroke-dasharray="4 5"' : ''} stroke-linecap="round"/>`; });
  const every = Math.max(1, Math.ceil(labels.length / 7)); // máx. ~7 etiquetas: con 30 días no se enciman
  // Las etiquetas van en HTML, no dentro del SVG: el SVG se estira y deformaba las letras.
  const xl = labels.map((m, i) => ((i % every && i !== labels.length - 1) ? '' : `<span style="position:absolute;bottom:4px;left:${(x(i) / W) * 100}%;transform:translateX(${i === 0 ? '0' : i === labels.length - 1 ? '-100%' : '-50%'});font-size:11px;color:#8f877b;white-space:nowrap">${esc(m)}</span>`)).join('');
  const last = series[0].v.length - 1;
  s += `<line class="xh" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" stroke="#171410" stroke-dasharray="3 4" opacity="0"/><circle cx="${x(last)}" cy="${y(series[0].v[last])}" r="9" fill="#d6f35a" stroke="#fff" stroke-width="2"/><circle cx="${x(last)}" cy="${y(series[0].v[last])}" r="3" fill="#171410"/><rect width="${W}" height="${H}" fill="transparent"/></svg>${xl}<div class="tip"></div>`;
  el.innerHTML = s;
  const svg = $('svg', el), tip = $('.tip', el), xh = $('.xh', el);
  svg.addEventListener('mousemove', (e) => { const r = svg.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; const i = Math.max(0, Math.min(labels.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (labels.length - 1)))); xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.setAttribute('opacity', '.35'); tip.style.left = (x(i) / W) * r.width + 'px'; tip.style.top = (y(series[0].v[i]) / H) * r.height + 'px'; tip.style.opacity = 1; tip.innerHTML = `${esc(labels[i])} · ` + series.map((se) => `${esc(se.name)} <b>${esc(fmt(se.v[i]))}</b>`).join(' · '); });
  svg.addEventListener('mouseleave', () => { tip.style.opacity = 0; xh.setAttribute('opacity', 0); });
}

// ---------- Markdown del repo → HTML seguro (se escapa TODO primero) ----------
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s"]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}
export function md(text) {
  const out = []; let list = null, table = null, fence = null;
  const flush = () => { if (list) { out.push(`<${list.t}>${list.items.map((i) => { const c = /^\[( |x|X)\]\s+(.*)/.exec(i); return c ? `<li class="task"><input type="checkbox" disabled${c[1] === ' ' ? '' : ' checked'}> ${inline(c[2])}</li>` : `<li>${inline(i)}</li>`; }).join('')}</${list.t}>`); list = null; }
    if (table) { const [h, ...rows] = table; out.push(`<div class="tscroll"><table><thead><tr>${h.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); table = null; } };
  for (const line of String(text).split('\n')) {
    let m;
    if (fence) { if (/^\s*```\s*$/.test(line)) { out.push(fence.lang === 'mermaid' ? `<div class="mmd">${esc(fence.code.join('\n'))}</div>` : `<pre class="code">${esc(fence.code.join('\n'))}</pre>`); fence = null; } else fence.code.push(line); continue; }
    if ((m = /^\s*```\s*(\w*)/.exec(line))) { flush(); fence = { lang: m[1].toLowerCase(), code: [] }; continue; }
    if (/^\s*\|/.test(line)) { const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()); if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; if (list) flush(); (table ||= []).push(cells); continue; }
    if (table) flush();
    if ((m = /^(#{1,4})\s+(.*)/.exec(line))) { flush(); const n = Math.min(m[1].length + 1, 5); out.push(`<h${n}>${inline(m[2])}</h${n}>`); }
    else if ((m = /^\s*[-*]\s+(.*)/.exec(line))) { if (list?.t !== 'ul') { flush(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); }
    else if ((m = /^\s*\d+[.)]\s+(.*)/.exec(line))) { if (list?.t !== 'ol') { flush(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); }
    else if ((m = /^>\s?(.*)/.exec(line))) { flush(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); }
    else if (/^\s*(---|\*\*\*)\s*$/.test(line)) { flush(); out.push('<hr>'); }
    else if (line.trim()) { flush(); out.push(`<p>${inline(line)}</p>`); }
    else flush();
  }
  if (fence) out.push(`<pre class="code">${esc(fence.code.join('\n'))}</pre>`);
  flush();
  if (out.some((x) => x.startsWith('<div class="mmd">'))) setTimeout(diagrams, 0);
  return raw(`<div class="md">${out.join('')}</div>`);
}
export function csv(text) {
  const rows = []; let row = [], cur = '', q = false;
  const s = String(text).replace(/\r/g, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"' && s[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

// ---------- Carpetas (el diseño del prototipo) ----------
const DRV = '<g transform="translate(3.5 4.5) scale(.15)"><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.950 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9.06 9.06 0 000 53h27.5z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.750 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#ea4335"/><path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="M73.4 26.5L60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></g>';
const INH = '<g transform="translate(5.5 4) scale(.034)"><path d="M134.936 1.5C208.296 1.50026 268.37 78.4372 268.37 174.189C268.37 269.941 208.296 346.878 134.936 346.878C61.5752 346.878 1.50017 269.942 1.5 174.189C1.5 78.4371 61.5751 1.5 134.936 1.5Z" stroke="#171410" stroke-width="22" fill="none"/><path d="M123.247 51.0248L75.5173 50.7031L75.3556 65.3753C130.487 87.0898 126.667 260.476 72.9892 280.123L72.7834 298.797L120.514 299.119L123.247 51.0248Z" fill="#171410"/><path d="M148.517 51.195L196.247 51.5166L196.085 66.1888C140.483 87.1571 140.482 260.569 193.719 280.937L193.513 299.61L145.783 299.289L148.517 51.195Z" fill="#171410"/></g>';
const VID = '<path d="M7 5l8 5-8 5z" fill="#171410"/>';
const badge = (x, inner) => `<g transform="translate(${x} 66)"><circle r="10" cx="10" cy="10" fill="#fff"/>${inner}</g>`;
const TONE = { gris: ['#4c4c48', '#6b6b66'], oliva: ['#4f5b22', '#7f9631'], terra: ['#7a3a28', '#b8583c'], cafe: ['#3b2f22', '#6b5a45'], azul: ['#2e4756', '#4f7790'] };
export function folderSvg({ w = 120, papers = true, drive = false, video = false, tone = 'gris' } = {}) {
  const [back, front] = TONE[tone] || TONE.gris;
  const b = [badge(10, drive ? DRV : video ? VID : INH)].concat(drive && video ? [badge(26, VID)] : []).join('');
  return raw(`<svg viewBox="0 0 120 92" width="${w}"><path d="M8 10a8 8 0 0 1 8-8h26l8 8h54a8 8 0 0 1 8 8v58H8z" fill="${back}"/>${papers ? '<g class="sheet"><rect x="26" y="8" width="58" height="50" rx="5" fill="#fbfaf6" transform="rotate(-6 55 33)"/><rect x="44" y="12" width="56" height="50" rx="5" fill="#fff" transform="rotate(5 72 37)"/></g>' : ''}<path d="M4 34a8 8 0 0 1 8-8h96a8 8 0 0 1 8 8v42a12 12 0 0 1-12 12H16A12 12 0 0 1 4 76z" fill="${front}"/><path d="M4 50a8 8 0 0 1 8-8h96a8 8 0 0 1 8 8v26a12 12 0 0 1-12 12H16A12 12 0 0 1 4 76z" fill="rgba(0,0,0,.08)"/><path d="M12 30h96" stroke="rgba(255,255,255,.22)" stroke-width="2" stroke-linecap="round"/>${b}</svg>`);
}
export const TONES = Object.keys(TONE);

// ---------- Documento imprimible (cotización, roadmap): se descarga como PDF desde el navegador ----------
export function docView(inner) {
  const v = document.createElement('div'); v.className = 'qview';
  mount(v, html`<div class="qbar"><button class="btn" data-x="print">↓ Descargar PDF</button><button class="btn ghost" data-x="close">Cerrar</button><div class="sp"></div><span class="sm" style="color:var(--cream);align-self:center">En el diálogo elige «Guardar como PDF»</span></div><div class="qdoc">${inner}</div>`);
  document.body.append(v);
  v.onclick = (e) => { const x = e.target.closest('[data-x]')?.dataset.x; if (x === 'print') window.print(); if (x === 'close' || e.target === v) v.remove(); };
}
export const docHead = (title, meta) => html`<div class="qh"><div class="qlogo"><img src="/brand/emblem-dark.svg" alt=""><div><img src="/brand/wordmark-dark.svg" alt="Inherent" style="height:26px;width:auto;display:block"><div class="go" style="margin-top:6px">GROWTH OPERATOR</div></div></div><div class="qmeta"><b>${title}</b>${meta}</div></div>`;
export const embedUrl = (u) => {
  const s = String(u || ''); let m;
  if ((m = s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/))) return `https://www.youtube.com/embed/${m[1]}`;
  if ((m = s.match(/vimeo\.com\/(\d+)/))) return `https://player.vimeo.com/video/${m[1]}`;
  if ((m = s.match(/loom\.com\/share\/(\w+)/))) return `https://www.loom.com/embed/${m[1]}`;
  if ((m = s.match(/drive\.google\.com\/file\/d\/([-\w]+)/))) return `https://drive.google.com/file/d/${m[1]}/preview`;
  if ((m = s.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([-\w]+)/))) return `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
  return null;
};

// ---------- Diagramas (Mermaid, servido desde /vendor, modo estricto: sin HTML ni scripts) ----------
let mermaidP = null;
function loadMermaid() {
  return (mermaidP ||= new Promise((ok, ko) => {
    const sc = document.createElement('script'); sc.src = '/vendor/mermaid-11.12.0.min.js';
    sc.onload = () => { window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', fontFamily: '42dot Sans, system-ui, sans-serif',
      themeVariables: { primaryColor: '#fbfaf6', primaryBorderColor: '#171410', primaryTextColor: '#171410', lineColor: '#6b5a45', secondaryColor: '#e3f07e', tertiaryColor: '#f0ece3', fontSize: '15px' } }); ok(window.mermaid); };
    sc.onerror = () => { mermaidP = null; ko(new Error('No cargó el motor de diagramas')); };
    document.head.append(sc);
  }));
}
let mmdN = 0;
export async function diagrams(root = document) {
  const els = [...root.querySelectorAll('.mmd:not([data-done])')]; if (!els.length) return;
  let m; try { m = await loadMermaid(); } catch (e) { els.forEach((el) => { el.dataset.done = '1'; el.classList.add('err'); }); return; }
  for (const el of els) {
    if (el.dataset.done) continue; el.dataset.done = '1';
    const src = el.textContent;
    try { const { svg } = await m.render('mmd' + ++mmdN, src); el.innerHTML = svg; }
    catch (e) { el.classList.add('err'); el.textContent = 'El diagrama tiene un error: ' + String(e.message || e).split('\n')[0]; }
  }
}
export function diagram(src) { setTimeout(diagrams, 0); return html`<div class="mmd">${src}</div>`; }

// Perfiles de trabajo: se asignan a las personas en Team. Una persona puede tener varios.
export const WORK_ROLES = [['ceo', 'CEO'], ['coo', 'COO · Operaciones'], ['content', 'Content · Agent operator'], ['video', 'Video editor · Agent operator'], ['finance', 'Finance + Business mapping']];
export const roleName = (k) => (WORK_ROLES.find(([x]) => x === k) || [k, k])[1];

// ---------- Subir a Google Drive (directo del navegador a Google, con barra de avance) ----------
export async function uploadToDrive(file, name, onProgress = () => {}, where = {}) {
  const { url } = await api('google/upload', { method: 'POST', body: { name: name || file.name, mime: file.type || 'application/octet-stream', size: file.size, ...(typeof where === 'string' ? { folder: where } : where) } });
  const up = await new Promise((ok, ko) => {
    const x = new XMLHttpRequest(); x.open('PUT', url);
    x.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    x.onload = () => (x.status < 300 ? ok(JSON.parse(x.responseText || '{}')) : ko(new Error(`Drive ${x.status}`)));
    x.onerror = () => ko(new Error('Se cortó la subida. Revisa tu internet.'));
    x.send(file);
  });
  return api('google/upload/done', { method: 'POST', body: { id: up.id } });
}

// ---------- Asistente paso a paso: una pregunta por pantalla, con opciones para tocar ----------
// steps: [{ k, q, sub, type: 'cards'|'multi'|'text'|'textarea'|'date'|'when', opts: [{ v, l, d, i }], v, req, show(a) }]
// Devuelve las respuestas, o null si se cierra. Las tarjetas avanzan solas al elegir.
export function wizard(title, steps, doneLabel = 'Crear') {
  return new Promise((resolve) => {
    const a = {}; steps.forEach((s) => { if (s.v !== undefined && typeof s.v !== 'function') a[s.k] = s.v; });
    const v = document.createElement('div'); v.className = 'wiz';
    let i = 0; const live = () => steps.filter((s) => !s.show || s.show(a));
    const nextDay = (dow) => { const d = new Date(); d.setDate(d.getDate() + ((dow + 7 - d.getDay()) % 7 || 7)); return d.toISOString().slice(0, 10); };
    const plus = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    const month1 = () => { const d = new Date(); d.setMonth(d.getMonth() + 1, 1); return d.toISOString().slice(0, 10); };
    const WHEN = [['Hoy', () => today()], ['Mañana', () => plus(1)], ['Viernes', () => nextDay(5)], ['En una semana', () => plus(7)], ['Día 1 del próximo mes', month1]];
    const close = (out) => { v.remove(); document.removeEventListener('keydown', key); resolve(out); };
    const key = (e) => { if (e.key === 'Escape') close(null); if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); next(); } };
    function next() {
      const L = live(), s = L[i];
      if (s && ['text', 'textarea', 'date'].includes(s.type)) a[s.k] = (v.querySelector('[data-in]')?.value || '').trim();
      if (s && s.req && (a[s.k] == null || a[s.k] === '' || (Array.isArray(a[s.k]) && !a[s.k].length))) return toast('Elige o escribe una opción', true);
      if (i < L.length - 1) { i++; paint(); } else close(a);
    }
    function paint() {
      const L = live(); const s = L[i]; const last = i === L.length - 1;
      if (a[s.k] === undefined && typeof s.v === 'function') a[s.k] = s.v(a); // valor por defecto que depende de respuestas anteriores
      const val = a[s.k];
      const opts = (typeof s.opts === 'function' ? s.opts(a) : s.opts) || [];
      mount(v, html`<div class="wizbox"><div class="row"><span class="mut sm">${title}</span><div class="sp"></div><span class="wizdots">${L.map((_, j) => html`<i class="${j <= i ? 'on' : ''}"></i>`)}</span><button class="arrow light" data-w="x" style="margin-left:10px">✕</button></div>
        <h2 class="wizq">${typeof s.q === 'function' ? s.q(a) : s.q}</h2>${s.sub ? html`<div class="mut" style="margin:-6px 0 14px">${typeof s.sub === 'function' ? s.sub(a) : s.sub}</div>` : ''}
        ${s.type === 'cards' || s.type === 'multi' ? html`<div class="wizopts ${opts.length > 6 ? 'many' : ''}">${opts.map((o) => { const on = s.type === 'multi' ? (val || []).includes(o.v) : val === o.v; return html`<button class="wizopt ${on ? 'on' : ''}" data-w="opt" data-v="${o.v}">${o.i ? html`<span class="wi">${o.i}</span>` : ''}<b>${o.l}</b>${o.d ? html`<span class="mut sm">${o.d}</span>` : ''}${s.type === 'multi' ? html`<span class="wck">${on ? '✓' : ''}</span>` : ''}</button>`; })}</div>`
          : s.type === 'when' ? html`<div class="wizopts">${WHEN.map(([l, f]) => html`<button class="wizopt ${val === f() ? 'on' : ''}" data-w="when" data-v="${f()}"><b>${l}</b><span class="mut sm">${fdate(f())}</span></button>`)}<label class="wizopt"><b>Otra fecha</b><input class="in" type="date" data-w="date" value="${val && !WHEN.some(([, f]) => f() === val) ? val : ''}"></label>${s.req ? '' : html`<button class="wizopt ${val === '' ? 'on' : ''}" data-w="when" data-v=""><b>Sin fecha</b></button>`}</div>`
          : s.type === 'textarea' ? html`<textarea class="in" data-in placeholder="${s.ph || ''}" style="min-height:120px">${val || ''}</textarea>`
          : html`<input class="in wizin" data-in type="${s.type === 'date' ? 'date' : 'text'}" placeholder="${s.ph || ''}" value="${val || ''}">${(s.chips || []).length ? html`<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">${(typeof s.chips === 'function' ? s.chips(a) : s.chips).map((c) => html`<button class="chip" data-w="chip" data-v="${c}" style="padding:7px 12px">${c}</button>`)}</div>` : ''}`}
        <div class="row" style="margin-top:20px">${i ? html`<button class="btn ghost" data-w="back">← Atrás</button>` : ''}<div class="sp"></div>${s.type === 'cards' ? (s.req ? '' : html`<button class="btn ghost" data-w="next">${last ? doneLabel : 'Saltar →'}</button>`) : html`<button class="btn" data-w="next">${last ? doneLabel : 'Seguir →'}</button>`}</div></div>`);
      v.querySelector('[data-in]')?.focus();
    }
    v.onclick = (e) => {
      const t = e.target.closest('[data-w]'); if (!t) { if (e.target === v) close(null); return; }
      const L = live(), s = L[i], w = t.dataset.w;
      if (w === 'x') return close(null);
      if (w === 'back') { i--; return paint(); }
      if (w === 'next') return next();
      if (w === 'opt') { if (s.type === 'multi') { const cur = new Set(a[s.k] || []); cur.has(t.dataset.v) ? cur.delete(t.dataset.v) : cur.add(t.dataset.v); a[s.k] = [...cur]; return paint(); } a[s.k] = t.dataset.v; s.after?.(a); return next(); } // tocar una opción avanza (y en el último paso, termina)
      if (w === 'when') { a[s.k] = t.dataset.v; return next(); }
      if (w === 'chip') { const inp = v.querySelector('[data-in]'); inp.value = t.dataset.v; inp.focus(); }
    };
    v.onchange = (e) => { if (e.target.dataset.w === 'date' && e.target.value) { a[live()[i].k] = e.target.value; next(); } };
    document.addEventListener('keydown', key);
    document.body.append(v); paint();
  });
}

// ---------- «Conectar»: cada cosa que viene de afuera muestra el logo de su servicio ----------
export const LOGO = {
  drive: IC.drive,
  instagram: raw('<svg viewBox="0 0 24 24"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igg)"/><circle cx="12" cy="12" r="4.3" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/></svg>'),
  tiktok: raw('<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#111"/><path d="M15.6 5.5c.5 1.6 1.7 2.7 3.3 2.9v2.4c-1.2 0-2.3-.4-3.3-1v4.6a4.4 4.4 0 1 1-3.8-4.4v2.5a1.9 1.9 0 1 0 1.3 1.9V5.5z" fill="#fff"/></svg>'),
  sheets: raw('<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#0f9d58"/><path d="M15 2v5h5z" fill="#87ceac"/><rect x="7.5" y="10.5" width="9" height="7" rx=".6" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M7.5 14h9M11 10.5v7" stroke="#fff" stroke-width="1.4"/></svg>'),
  windsor: raw('<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1f2a44"/><path d="M5 8l2.5 8L10 9l2 7 2-7 2.5 7L19 8" fill="none" stroke="#7fd1ff" stroke-width="1.8" stroke-linejoin="round"/></svg>'),
};
// Un botón o tarjeta para conectar. `on` = ya conectado (muestra el nombre y «Cambiar»).
export const connectChip = (logo, label, act, on, extra = '') => html`<button class="connect ${on ? 'on' : ''}" data-act="${act}" ${raw(extra)}><span class="lg">${LOGO[logo]}</span>${label}</button>`;
export const connectCard = (logo, title, sub, act, btn = 'Conectar') => html`<div class="connectcard"><span class="lg big">${LOGO[logo]}</span><div class="grow"><b style="font-weight:500">${title}</b><div class="mut sm">${sub}</div></div><button class="btn" data-act="${act}">${btn}</button></div>`;
