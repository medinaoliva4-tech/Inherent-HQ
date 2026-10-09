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
    const input = (f) => f.t === 'select' ? html`<select class="in" name="${f.k}">${(f.opts || []).map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return html`<option value="${v}" ${String(v) === String(f.v ?? '') ? raw('selected') : ''}>${l}</option>`; })}</select>`
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
      for (const f of fields) { let v = form.elements[f.k].value.trim(); if (f.t === 'number') v = v === '' ? null : Number(v); out[f.k] = v; }
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
export function lineChart(el, labels, series) {
  const W = 640, H = el.clientHeight || 210, P = { l: 8, r: 8, t: 18, b: 26 };
  const max = Math.max(1, ...series.flatMap((s) => s.v)) * 1.15;
  const x = (i) => P.l + (labels.length < 2 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (labels.length - 1));
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const path = (v) => v.map((n, i) => { if (!i) return `M${x(0)},${y(n)}`; const cx = (x(i - 1) + x(i)) / 2; return `C${cx},${y(v[i - 1])} ${cx},${y(n)} ${x(i)},${y(n)}`; }).join(' ');
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="g${el.id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d6f35a" stop-opacity=".45"/><stop offset="1" stop-color="#d6f35a" stop-opacity="0"/></linearGradient></defs>`;
  [0.25, 0.5, 0.75].forEach((f) => s += `<line x1="0" x2="${W}" y1="${P.t + f * (H - P.t - P.b)}" y2="${P.t + f * (H - P.t - P.b)}" stroke="rgba(23,20,16,.06)"/>`);
  series.forEach((se) => { if (se.fill) s += `<path d="${path(se.v)} L${x(se.v.length - 1)},${H - P.b} L${x(0)},${H - P.b}Z" fill="url(#g${el.id})"/>`; s += `<path d="${path(se.v)}" fill="none" stroke="${se.c}" stroke-width="2" ${se.dash ? 'stroke-dasharray="4 5"' : ''} stroke-linecap="round"/>`; });
  labels.forEach((m, i) => s += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="#8f877b">${esc(m)}</text>`);
  const last = series[0].v.length - 1;
  s += `<line class="xh" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" stroke="#171410" stroke-dasharray="3 4" opacity="0"/><circle cx="${x(last)}" cy="${y(series[0].v[last])}" r="9" fill="#d6f35a" stroke="#fff" stroke-width="2"/><circle cx="${x(last)}" cy="${y(series[0].v[last])}" r="3" fill="#171410"/><rect width="${W}" height="${H}" fill="transparent"/></svg><div class="tip"></div>`;
  el.innerHTML = s;
  const svg = $('svg', el), tip = $('.tip', el), xh = $('.xh', el);
  svg.addEventListener('mousemove', (e) => { const r = svg.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; const i = Math.max(0, Math.min(labels.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (labels.length - 1)))); xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.setAttribute('opacity', '.35'); tip.style.left = (x(i) / W) * r.width + 'px'; tip.style.top = (y(series[0].v[i]) / H) * r.height + 'px'; tip.style.opacity = 1; tip.innerHTML = `${esc(labels[i])} · ` + series.map((se) => `${esc(se.name)} <b>${esc(Q(se.v[i]))}</b>`).join(' · '); });
  svg.addEventListener('mouseleave', () => { tip.style.opacity = 0; xh.setAttribute('opacity', 0); });
}
