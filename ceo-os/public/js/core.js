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
// Los errores llegan en lenguaje humano: sin conexión, sin acceso, falló el servidor. El detalle técnico va en `detail`.
export const HUMAN = { net: 'Sin conexión. Revisa tu internet e inténtalo de nuevo.', server: 'Algo falló de nuestro lado. Inténtalo otra vez en un momento.', denied: 'No tienes acceso a esto.', gone: 'Eso ya no existe.', generic: 'No se pudo completar. Inténtalo de nuevo.' };
export async function api(path, opts = {}) {
  let r;
  try {
    r = await fetch('/api/' + path, {
      method: opts.method || 'GET', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CEOOS': '1' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) { throw Object.assign(new Error(HUMAN.net), { status: 0, detail: e.message }); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== 'me') events.dispatchEvent(new Event('logout'));
  if (!r.ok) {
    const msg = r.status >= 500 ? HUMAN.server : j.error || (r.status === 403 ? HUMAN.denied : r.status === 404 ? HUMAN.gone : HUMAN.generic);
    throw Object.assign(new Error(msg), { status: r.status, code: j.code, detail: j.error || `HTTP ${r.status}` });
  }
  return j;
}
// Para mostrar un error sin asustar: el mensaje humano arriba y el detalle técnico plegado.
export const techDetail = (e) => (e?.detail && e.detail !== e.message ? html`<details class="tech"><summary>Detalle técnico</summary><code>${e.detail}</code></details>` : '');
// Colecciones de la base de datos
// El equipo, con la foto que cada quien subió por encima de la de Google.
// El equipo (sin los accesos de clientes al portal).
export const teamList = async () => (await api('db/team')).items.filter((p) => p.role !== 'client').map((p) => ({ ...p, google_picture: p.picture || null, picture: p.photo || p.picture || null }));
// Para guardar una persona: devuelve la foto de Google a su lugar (la de perfil va en `photo`).
export const teamDoc = (p) => { const { google_picture, ...rest } = p; return { ...rest, picture: google_picture ?? rest.picture ?? null }; };
// Recorta una imagen a un cuadrado chico (para fotos de perfil) y la devuelve como data URL JPEG.
// Elegir cómo queda la foto: arrastrar para mover, deslizar (o pellizcar en el cel) para acercar. Devuelve null si cancela.
export function cropImage(file, size = 256) {
  return new Promise((ok, ko) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('No pude leer esa imagen')); };
    img.onload = () => {
      const V = 260, base = V / Math.min(img.width, img.height); let z = 1, x = 0, y = 0;
      const dlg = document.createElement('dialog'); dlg.className = 'dlg';
      mount(dlg, html`<div class="in-dlg"><h3>Acomoda tu foto</h3><div class="crop"><canvas width="${V * 2}" height="${V * 2}"></canvas></div>
        <div class="row" style="gap:10px;margin:14px 0 4px;flex-wrap:nowrap"><span class="mut">−</span><input type="range" min="1" max="4" step="0.01" value="1" style="flex:1"><span class="mut">+</span></div>
        <div class="mut sm" style="text-align:center">Arrastra para mover · desliza o pellizca para acercar</div>
        <div class="row" style="margin-top:14px"><button class="btn" data-ok>Guardar</button><button class="btn ghost" data-x>Cancelar</button></div></div>`);
      document.body.append(dlg);
      const cv = dlg.querySelector('canvas'), rg = dlg.querySelector('input[type=range]');
      let fin = false; const done = (v) => { if (fin) return; fin = true; URL.revokeObjectURL(url); dlg.close(); dlg.remove(); ok(v); };
      const clamp = () => { const s = base * z, mx = Math.max(0, (img.width * s - V) / 2), my = Math.max(0, (img.height * s - V) / 2); x = Math.min(mx, Math.max(-mx, x)); y = Math.min(my, Math.max(-my, y)); };
      const draw = (ctx, W) => { const k = W / V, s = base * z * k; ctx.fillStyle = '#fdfaf3'; ctx.fillRect(0, 0, W, W); ctx.drawImage(img, W / 2 - (img.width * s) / 2 + x * k, W / 2 - (img.height * s) / 2 + y * k, img.width * s, img.height * s); };
      const paint = () => { clamp(); draw(cv.getContext('2d'), V * 2); };
      const zoom = (v) => { z = Math.min(4, Math.max(1, v)); rg.value = z; paint(); };
      rg.oninput = () => zoom(+rg.value);
      const pts = new Map(); let last = null, pinch = null;
      cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); last = { x: e.clientX, y: e.clientY }; pinch = null; };
      cv.onpointermove = (e) => {
        if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) zoom((z * d) / pinch); pinch = d; return; }
        x += e.clientX - last.x; y += e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; paint();
      };
      cv.onpointerup = cv.onpointercancel = (e) => { pts.delete(e.pointerId); pinch = null; const r = [...pts.values()][0]; if (r) last = r; };
      cv.onwheel = (e) => { e.preventDefault(); zoom(z - e.deltaY * 0.002); };
      dlg.querySelector('[data-ok]').onclick = () => { const o = document.createElement('canvas'); o.width = o.height = size; draw(o.getContext('2d'), size); done(o.toDataURL('image/jpeg', 0.85)); };
      dlg.querySelector('[data-x]').onclick = () => done(null);
      dlg.addEventListener('close', () => done(null));
      dlg.showModal(); paint();
    };
    img.src = url;
  });
}
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
// ---------- La vista grande: lo que antes se abría en un panel de costado ahora se abre a pantalla completa ----------
// drawer(content, map, opts) es la misma API de siempre. Arriba lleva «← <Sección> / <título>»: la flecha (o Esc)
// regresa al lugar exacto, con el scroll como estaba. opts: { section, title, back } o solo el nombre de la sección;
// sin sección, sale de la ruta actual (la registra app.js con setViewSection); sin título, del contenido (su h2).
let bvSection = () => '', bvBack = null, bvFrom = null;
export const setViewSection = (fn) => { bvSection = fn; };
const bvTitle = (b) => { const h = b.querySelector('h1,h2'); if (h?.textContent.trim()) return h.textContent.trim();
  const i = b.querySelector('input[id$="title"]'); return i?.value?.trim() || b.querySelector('h3')?.textContent.trim() || b.querySelector('.chip')?.textContent.trim() || ''; };
export function drawer(content, map = {}, opts = {}) {
  if (typeof opts === 'string') opts = { section: opts };
  const d = $('#drawer'), was = d.classList.contains('on');
  if (!was || !bvFrom) bvFrom = { y: scrollY, ay: $('.app')?.scrollTop || 0, focus: was ? bvFrom?.focus : document.activeElement };
  if (opts.section || !bvFrom.section) { let s = opts.section; if (!s) { try { s = bvSection(); } catch {} } bvFrom.section = s || 'Inicio'; }
  mount(d, html`<div class="bv-bar"><div class="bv-in"><button class="bv-back" type="button" data-act="close" aria-label="Volver a ${bvFrom.section}">${ico('arrow-left', 18)}<span>${bvFrom.section}</span></button><span class="bv-crumb"></span></div></div><div class="bv-body">${content}</div>`);
  const t = opts.title || bvTitle($('.bv-body', d)); $('.bv-crumb', d).textContent = t ? '/ ' + t : '';
  bvBack = opts.back || null;
  d.onclick = (e) => { const t = e.target.closest('[data-act]'); if (!t) return; if (t.dataset.act === 'close') return (bvBack || closeDrawer)(); map[t.dataset.act]?.(t, e); };
  if (!was) {
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', t || bvFrom.section);
    d.scrollTop = 0; d.classList.add('on'); document.documentElement.classList.add('bv-on');
    // El foco entra a la vista (sin anillo); con Tab, lo primero es la flecha de regresar.
    d.tabIndex = -1; setTimeout(() => { if (d.classList.contains('on') && !d.contains(document.activeElement)) d.focus({ preventScroll: true }); }, 60);
  }
  return d;
}
// Cambio suave (View Transitions: Chrome, Edge y Safari 18+; sin soporte, cambia directo).
// Al cambiar de pestaña quedan quietos el título y las pestañas; solo se anima lo de abajo.
// El modo noche usa sus propios colores (no un filtro), así que la transición se ve igual de día y de noche.
export const canTransition = () => typeof document.startViewTransition === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
// Pestañas: se cambia el contenido y solo el cuerpo entra con un fundido corto (sin fotos ni estiramientos).
export function swap(el, update) {
  // La página no salta: se guarda la altura y el scroll mientras la pestaña nueva carga.
  const y = scrollY; el.style.minHeight = el.offsetHeight + 'px';
  update(); scrollTo(0, y);
  clearTimeout(el._swapT); el._swapT = setTimeout(() => { el.style.minHeight = ''; }, 1500);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const b = el.querySelector('#body,#fbody,#obody,#wbody,#cbody'); if (!b) return;
  b.classList.remove('tabin'); void b.offsetWidth; b.classList.add('tabin');
}
export function closeDrawer() {
  const d = $('#drawer'); if (!d) return; const was = d.classList.contains('on');
  d.classList.remove('on'); $('#veil')?.classList.remove('on'); document.documentElement.classList.remove('bv-on'); bvBack = null;
  // Vuelve exactamente a donde estaba: el scroll de la página (en el cel se desliza .app) y el foco.
  if (was && bvFrom) { const f = bvFrom; bvFrom = null; scrollTo({ top: f.y, left: 0, behavior: 'instant' }); const a = $('.app'); if (a) a.scrollTop = f.ay; if (f.focus?.isConnected) f.focus.focus({ preventScroll: true }); }
}
// Esc regresa (si no hay un diálogo abierto encima).
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#drawer')?.classList.contains('on') && !document.querySelector('dialog[open]')) (bvBack || closeDrawer)(); });

// fields: [{k, l, t:'text'|'number'|'date'|'select'|'textarea'|'email', opts:[], v, req, half}]
// Hasta 4 campos: el modal pequeño. Más de 4: se abre en la vista grande. Siempre devuelve una Promise con los valores (o null).
const askInput = (f) => f.t === 'checks' ? html`<div class="checks">${(f.opts || []).map(([v, l]) => html`<label class="check"><input type="checkbox" name="${f.k}" value="${v}" ${(f.v || []).includes(v) ? raw('checked') : ''}> ${l}</label>`)}</div>`
  : f.t === 'select' ? html`<select class="in" name="${f.k}">${(f.opts || []).map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return html`<option value="${v}" ${String(v) === String(f.v ?? '') ? raw('selected') : ''}>${l}</option>`; })}</select>`
  : f.t === 'textarea' ? html`<textarea class="in" name="${f.k}" placeholder="${f.ph || ''}">${f.v ?? ''}</textarea>`
  : f.t === 'file' ? html`<input class="in" name="${f.k}" type="file" accept="${f.accept || ''}">`
  : html`<input class="in" name="${f.k}" type="${f.t || 'text'}" value="${f.v ?? ''}" placeholder="${f.ph || ''}" ${f.t === 'number' ? raw('step="any"') : ''}>`;
function askRows(fields) {
  const rows = []; let pend = [];
  fields.forEach((f) => { const cell = html`<div><label class="f">${f.l}${f.req ? ' *' : ''}</label>${askInput(f)}</div>`; if (f.half) { pend.push(cell); if (pend.length === 2) { rows.push(html`<div class="two">${pend}</div>`); pend = []; } } else { if (pend.length) { rows.push(html`<div class="two">${pend}</div>`); pend = []; } rows.push(cell); } });
  if (pend.length) rows.push(html`<div class="two">${pend}</div>`);
  return rows;
}
// Lee el formulario; si falta un campo obligatorio avisa y devuelve null.
function askRead(form, fields) {
  const out = {};
  for (const f of fields) { if (f.t === 'file') { out[f.k] = form.elements[f.k].files[0] || null; continue; } if (f.t === 'checks') { out[f.k] = [...form.querySelectorAll(`input[name="${f.k}"]:checked`)].map((x) => x.value); continue; } let v = form.elements[f.k].value.trim(); if (f.t === 'number') v = v === '' ? null : Number(v); out[f.k] = v; }
  const miss = fields.find((f) => f.req && (out[f.k] === '' || out[f.k] == null));
  if (miss) { toast(`Falta: ${miss.l}`, true); return null; }
  return out;
}
export function ask(title, fields, okLabel = 'Guardar') {
  if (fields.length > 4) return askBig(title, fields, okLabel);
  return new Promise((resolve) => {
    const dlg = document.createElement('dialog'); dlg.className = 'dlg';
    mount(dlg, html`<form class="in-dlg form" method="dialog"><h3>${title}</h3>${askRows(fields)}<div class="row" style="margin-top:6px"><button class="btn" value="ok">${okLabel}</button><button class="btn ghost" value="no" type="button" data-x>Cancelar</button></div></form>`);
    document.body.append(dlg);
    const form = $('form', dlg);
    $('[data-x]', dlg).onclick = () => dlg.close();
    form.onsubmit = (e) => { e.preventDefault(); const out = askRead(form, fields); if (out) { resolve(out); dlg.close(); } };
    dlg.addEventListener('close', () => { resolve(null); dlg.remove(); });
    dlg.showModal(); form.querySelector('.in')?.focus();
  });
}
// El mismo formulario en la vista grande. Si ya había algo abierto en grande (ej. una ficha), al terminar vuelve a eso.
function askBig(title, fields, okLabel) {
  return new Promise((resolve) => {
    const d = $('#drawer'), prev = d.classList.contains('on') ? { nodes: [...d.childNodes], onclick: d.onclick, back: bvBack, y: d.scrollTop } : null;
    let done = false, watch = null;
    const finish = (v) => {
      if (done) return; done = true; watch?.disconnect(); resolve(v);
      if (!d.classList.contains('on')) return;
      if (prev) { d.replaceChildren(...prev.nodes); d.onclick = prev.onclick; bvBack = prev.back; d.scrollTop = prev.y; } else closeDrawer();
    };
    const submit = () => { const out = askRead($('#bvask', d), fields); if (out) finish(out); };
    drawer(html`<form class="form bv-ask" id="bvask"><h2>${title}</h2>${askRows(fields)}</form>
      <div class="row bv-actions"><button class="btn" type="button" data-act="bvok">${okLabel}</button><button class="btn ghost" type="button" data-act="close">Cancelar</button></div>`,
    { bvok: submit }, { title, back: prev ? () => finish(null) : null });
    const form = $('#bvask', d);
    form.onsubmit = (e) => { e.preventDefault(); submit(); };
    form.onkeydown = (e) => { if (e.key === 'Enter' && e.target.matches('input:not([type=checkbox]):not([type=file])')) { e.preventDefault(); submit(); } };
    // Cerrar la vista (flecha, Esc o cambiar de pantalla) = cancelar.
    watch = new MutationObserver(() => { if (!d.classList.contains('on')) finish(null); });
    watch.observe(d, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => form.querySelector('.in')?.focus({ preventScroll: true }), 60);
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
// Íconos de línea (sin emojis): toman el color del texto. Uso: ${ico('lock')} o ${ico('cal', 18)}.
const ICO = {
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  down: '<path d="M6 9l6 6 6-6"/>', redo: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>', right: '<path d="M9 6l6 6-6 6"/>', 'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>', check: '<path d="M5 12l5 5 9-10"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.5"/>', trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10l5-3v10l-5-3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  cake: '<path d="M4 20h16v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/><path d="M4 16c3 2 5-2 8 0s5 2 8 0M12 12V8M12 8c-1-1-1-2 0-3 1 1 1 2 0 3z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.5 2.5 2.2 4 2.2s3-.7 4-2.2M9 9.5v.5M15 9.5v.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h11M15 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H6M9 21l-3-3 3-3"/>',
  puzzle: '<path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4H6v-4H4a2 2 0 1 1 0-4h2V6h4z"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="9" r="1.3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  ruler: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  tool: '<path d="M14.5 6.5a4 4 0 0 0-5 5L3 18l3 3 6.5-6.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5M3 17.5l9 5 9-5"/>',
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  hand: '<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6c-2.5 0-4-1-5.5-3L3 13.5a1.5 1.5 0 0 1 2.4-1.8L8 14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  music: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  circle: '<circle cx="12" cy="12" r="8"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.2-.8-1.6-.8-2.6 0-1 .8-1.4 1.8-1.4H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>',
  bars: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mobile: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11h6M9 15h6"/>',
  shuffle: '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  megaphone: '<path d="M3 10v4a1 1 0 0 0 1 1h2.5L15 19.5V4.5L6.5 9H4a1 1 0 0 0-1 1z"/><path d="M18.5 9a4 4 0 0 1 0 6M6.5 15l1.2 5h2.6l-1.1-4.6"/>',
  stairs: '<path d="M3 21h5v-5h5v-5h5V6h3"/><path d="M4 11l7-7M7 4h4v4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.5"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  rocket: '<path d="M14 4c4 0 6 2 6 6-3 0-6 3-6 6l-2 2-4-4 2-2c3 0 6-3 6-6z"/><path d="M8 16l-4 4M7 11l-3 1M13 17l-1 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', play: '<path d="M7 4l13 8-13 8z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5"/>',
  dot: '<circle cx="12" cy="12" r="6" fill="currentColor"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  upload: '<path d="M12 16V4M6 10l6-6 6 6M5 20h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
};
export const ico = (n, s = 15) => raw(`<svg class="lni" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px;flex:none">${ICO[n] || ''}</svg>`);
export const emblem = (dark) => raw(`<img src="/brand/${dark ? 'emblem-dark' : 'emblem'}.svg" alt="Inherent" style="width:100%;display:block">`);

// Matriz de puntos decorativa: retirada. Se conserva el export para no tocar las pantallas que la llaman.
export const matrix = () => '';

// ---------- gráfica de línea con tooltip ----------
// fmt: cómo se ve el número en el tooltip (por defecto 1.2K; Finance pasa Q).
export function lineChart(el, labels, series, { fmt = K } = {}) {
  const W = 640, H = el.clientHeight || 210, P = { l: 8, r: 8, t: 18, b: 26 };
  const max = Math.max(1, ...series.flatMap((s) => s.v)) * 1.15;
  const x = (i) => P.l + (labels.length < 2 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (labels.length - 1));
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const path = (v) => v.map((n, i) => { if (!i) return `M${x(0)},${y(n)}`; const cx = (x(i - 1) + x(i)) / 2; return `C${cx},${y(v[i - 1])} ${cx},${y(n)} ${x(i)},${y(n)}`; }).join(' ');
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="g${el.id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d6f35a" stop-opacity=".45"/><stop offset="1" stop-color="#d6f35a" stop-opacity="0"/></linearGradient></defs>`;
  [0.25, 0.5, 0.75].forEach((f) => s += `<line x1="0" x2="${W}" y1="${P.t + f * (H - P.t - P.b)}" y2="${P.t + f * (H - P.t - P.b)}" stroke="rgba(44,31,22,.06)"/>`);
  series.forEach((se) => { if (se.fill) s += `<path d="${path(se.v)} L${x(se.v.length - 1)},${H - P.b} L${x(0)},${H - P.b}Z" fill="url(#g${el.id})"/>`; s += `<path d="${path(se.v)}" fill="none" stroke="${se.c}" stroke-width="2" ${se.dash ? 'stroke-dasharray="4 5"' : ''} stroke-linecap="round"/>`; });
  const every = Math.max(1, Math.ceil(labels.length / (el.clientWidth < 500 ? 4 : 7))); // máx. ~7 etiquetas (4 en el cel): no se enciman
  // Las etiquetas van en HTML, no dentro del SVG: el SVG se estira y deformaba las letras.
  const xl = labels.map((m, i) => (((i % every || labels.length - 1 - i < every) && i !== labels.length - 1) ? '' : `<span style="position:absolute;bottom:4px;left:${(x(i) / W) * 100}%;transform:translateX(${i === 0 ? '0' : i === labels.length - 1 ? '-100%' : '-50%'});font-size:11px;color:#9f846d;white-space:nowrap">${esc(m)}</span>`)).join('');
  const last = series[0].v.length - 1;
  s += `<line class="xh" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" stroke="#2c1f16" stroke-dasharray="3 4" opacity="0"/><circle cx="${x(last)}" cy="${y(series[0].v[last])}" r="9" fill="#efe7dc" stroke="#fdfaf3" stroke-width="2"/><circle cx="${x(last)}" cy="${y(series[0].v[last])}" r="3" fill="#2c1f16"/><rect width="${W}" height="${H}" fill="transparent"/></svg>${xl}<div class="tip"></div>`;
  el.innerHTML = s;
  const svg = $('svg', el), tip = $('.tip', el), xh = $('.xh', el);
  svg.addEventListener('mousemove', (e) => { const r = svg.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; const i = Math.max(0, Math.min(labels.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (labels.length - 1)))); xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.setAttribute('opacity', '.35'); tip.style.left = (x(i) / W) * r.width + 'px'; tip.style.top = (y(series[0].v[i]) / H) * r.height + 'px'; tip.style.opacity = 1; tip.innerHTML = `${esc(labels[i])} · ` + series.map((se) => `${esc(se.name)} <b>${esc(fmt(se.v[i]))}</b>`).join(' · '); });
  svg.addEventListener('mouseleave', () => { tip.style.opacity = 0; xh.setAttribute('opacity', 0); });
}

// ---------- Markdown del repo → HTML seguro (se escapa TODO primero) ----------
export function inline(s) {
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
const INH = '<g transform="translate(5.5 4) scale(.034)"><path d="M134.936 1.5C208.296 1.50026 268.37 78.4372 268.37 174.189C268.37 269.941 208.296 346.878 134.936 346.878C61.5752 346.878 1.50017 269.942 1.5 174.189C1.5 78.4371 61.5751 1.5 134.936 1.5Z" stroke="#2c1f16" stroke-width="22" fill="none"/><path d="M123.247 51.0248L75.5173 50.7031L75.3556 65.3753C130.487 87.0898 126.667 260.476 72.9892 280.123L72.7834 298.797L120.514 299.119L123.247 51.0248Z" fill="#2c1f16"/><path d="M148.517 51.195L196.247 51.5166L196.085 66.1888C140.483 87.1571 140.482 260.569 193.719 280.937L193.513 299.61L145.783 299.289L148.517 51.195Z" fill="#2c1f16"/></g>';
const VID = '<path d="M7 5l8 5-8 5z" fill="#2c1f16"/>';
const badge = (x, inner) => `<g transform="translate(${x} 66)"><circle r="10" cx="10" cy="10" fill="#fdfaf3"/>${inner}</g>`;
const TONE = { gris: ['#624936', '#82634b'], oliva: ['#6b513c', '#a18770'], terra: ['#5c4533', '#81634b'], cafe: ['#463325', '#735741'], azul: ['#584231', '#87684e'] };
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
export const docHead = (title, meta) => html`<div class="qh"><div class="qlogo"><img src="/brand/emblem-dark.svg" alt=""><div><img src="/brand/wordmark-dark.svg" alt="Inherent" style="height:26px;width:auto;display:block"><div class="go" style="margin-top:6px">GROWTH PARTNER</div></div></div><div class="qmeta"><b>${title}</b>${meta}</div></div>`;
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
    sc.onload = () => { window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', fontFamily: 'Inter, system-ui, sans-serif',
      themeVariables: { primaryColor: '#fbf7ef', primaryBorderColor: '#2c1f16', primaryTextColor: '#2c1f16', lineColor: '#735741', secondaryColor: '#f0e9de', tertiaryColor: '#f4eee4', fontSize: '15px' } }); ok(window.mermaid); };
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
// Vistas por rol: cuando el perfil solo puede ver una sección, la pantalla lo dice (el servidor lo aplica de todos modos).
export { canEdit, isSummary } from './roleviews.js';
export const roChip = (me, area) => (!me?.views || me.views[area] === 'edita' ? '' : html`<span class="chip" title="Tu perfil ve esta sección pero no la cambia. Lo decide el CEO en Administración → Vistas por rol.">${me.views[area] === 'resumen' ? 'Resumen' : 'Solo lectura'}</span>`);
export const WORK_ROLES = [['ceo', 'CEO'], ['coo', 'COO · Operaciones'], ['content', 'Content · Agent operator'], ['video', 'Video editor · Agent operator'], ['finance', 'Finance + Business mapping · clientes'], ['cobros', 'Finanzas de Inherent · cobros'], ['ads', 'Ads management · Meta, Google, LinkedIn'], ['ventas', 'Ventas · CRM y seguimiento']];
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
      mount(v, html`<div class="wizbox"><div class="row"><span class="mut sm">${title}</span><div class="sp"></div><span class="wizdots">${L.map((_, j) => html`<i class="${j <= i ? 'on' : ''}"></i>`)}</span><button class="arrow light" data-w="x" style="margin-left:10px">${ico('x', 16)}</button></div>
        <h2 class="wizq">${typeof s.q === 'function' ? s.q(a) : s.q}</h2>${s.sub ? html`<div class="mut" style="margin:-6px 0 14px">${typeof s.sub === 'function' ? s.sub(a) : s.sub}</div>` : ''}
        ${s.type === 'cards' || s.type === 'multi' ? html`<div class="wizopts ${opts.length > 6 ? 'many' : ''}">${opts.map((o) => { const on = s.type === 'multi' ? (val || []).includes(o.v) : val === o.v; return html`<button class="wizopt ${on ? 'on' : ''}" data-w="opt" data-v="${o.v}">${o.i ? html`<span class="wi">${o.i}</span>` : ''}<b>${o.l}</b>${o.d ? html`<span class="mut sm">${o.d}</span>` : ''}${s.type === 'multi' ? html`<span class="wck">${on ? ico('check', 12) : ''}</span>` : ''}</button>`; })}</div>`
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
  claude: raw('<img src="/brand/ai/claude.svg" alt="Claude">'),
  chatgpt: raw('<img src="/brand/ai/chatgpt.svg" alt="ChatGPT">'),
  codex: raw('<img src="/brand/ai/codex.svg" alt="Codex">'),
  claudecode: raw('<img src="/brand/ai/claudecode.svg" alt="Claude Code">'),
  meta: raw('<img src="/brand/ads/meta.svg" alt="Meta">'),
  google: raw('<img src="/brand/ads/google.svg" alt="Google Ads">'),
  linkedin: raw('<img src="/brand/ads/linkedin.svg" alt="LinkedIn">'),
  windsor: raw('<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1f2a44"/><path d="M5 8l2.5 8L10 9l2 7 2-7 2.5 7L19 8" fill="none" stroke="#7fd1ff" stroke-width="1.8" stroke-linejoin="round"/></svg>'),
};
// Un botón o tarjeta para conectar. `on` = ya conectado (muestra el nombre y «Cambiar»).
export const connectChip = (logo, label, act, on, extra = '') => html`<button class="connect ${on ? 'on' : ''}" data-act="${act}" ${raw(extra)}><span class="lg">${LOGO[logo]}</span>${label}</button>`;
export const connectCard = (logo, title, sub, act, btn = 'Conectar') => html`<div class="connectcard"><span class="lg big">${LOGO[logo]}</span><div class="grow"><b style="font-weight:500">${title}</b><div class="mut sm">${sub}</div></div><button class="btn" data-act="${act}">${btn}</button></div>`;

// Qué calendarios se ven: por defecto solo el de Inherent; «Todos» es opcional y se recuerda.
export const calAll = () => { try { return localStorage.getItem('cal.all') === '1'; } catch { return false; } };
export const setCalAll = (v) => { try { localStorage.setItem('cal.all', v ? '1' : '0'); } catch {} };
export const calQ = () => (calAll() ? '' : '&only=inherent');

// ---------- Claude con la cuenta de cada persona (sus créditos, sin API) ----------
// Abre claude.ai con el prompt listo (y lo deja copiado). Si se pide `json`, espera que la persona
// pegue la respuesta y la devuelve ya leída.
// Se abre en Claude Code (claude.ai/code) con el repo de Inherent, así tiene el manual a la mano.
const CLAUDE_REPO = 'medinaoliva4-tech/Inherent-HQ';
export function openClaude(prompt) {
  const fits = prompt.length < 5000;
  navigator.clipboard?.writeText(prompt).catch(() => {}); // antes de abrir: con la pestaña nueva al frente el navegador ya no deja copiar
  window.open('https://claude.ai/code?' + new URLSearchParams({ ...(fits ? { prompt } : {}), repositories: CLAUDE_REPO }), '_blank', 'noopener');
  return fits;
}
export async function claudeJSON(title, prompt, hint) {
  const fits = openClaude(prompt);
  const v = await ask(title, [{ k: 'out', t: 'textarea', req: true, l: (fits ? '' : 'El prompt quedó copiado: pégalo en tu Claude. ') + (hint || (fits ? 'Se abrió tu Claude Code con todo listo: dale enviar. Cuando responda, copia su respuesta y pégala aquí.' : 'Cuando responda, copia su respuesta y pégala aquí.')) }], 'Listo');
  if (!v) return null;
  const m = String(v.out).match(/[[{][\s\S]*[\]}]/);
  try { return JSON.parse(m ? m[0] : v.out); } catch { toast('No pude leer la respuesta. Pídele a Claude que conteste solo con el JSON y vuelve a pegarla.', true); return null; }
}

// Íconos de línea, minimalistas (16px, heredan el color del texto).
const ic = (d) => raw(`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`);
export const ICON = {
  user: ic('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5"/>'),
  target: ic('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2"/>'),
  star: ic('<path d="M12 4l2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 15.9 7.4 18.3l.9-5.2-3.8-3.6 5.2-.7z"/>'),
  versus: ic('<path d="M5 5l6 6M11 5L5 11"/><path d="M13 13l6 6M19 13l-6 6"/>'),
  radar: ic('<path d="M4 12a8 8 0 1 0 8-8"/><path d="M8 12a4 4 0 1 0 4-4"/><path d="M12 12l6-6"/>'),
  bulb: ic('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'),
  inbox: ic('<path d="M4 13l2.5-7h11L20 13v5H4z"/><path d="M4 13h4.5l1 2h5l1-2H20"/>'),
  play: ic('<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M10.5 9.5v5l4-2.5z"/>'),
  slides: ic('<rect x="7" y="5" width="12" height="14" rx="2"/><path d="M4 8v8"/>'),
  sparkle: ic('<path d="M12 4v4M12 16v4M4 12h4M16 12h4M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2"/>'),
  check: ic('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'),
  folder: ic('<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>'),
  cal: ic('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  upload: ic('<path d="M12 16V5M7.5 9.5L12 5l4.5 4.5"/><path d="M5 19h14"/>'),
  book: ic('<path d="M5 5a2 2 0 0 1 2-2h11v16H7a2 2 0 0 0-2 2z"/><path d="M5 19V5"/>'),
  list: ic('<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/>'),
  chart: ic('<path d="M4 19h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/>'),
  team: ic('<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M15 15.2c2.4-.3 4.6 1 5.5 3.8"/>'),
};
// El ícono que le toca a una tarjeta por su título (para no repetir el mapeo en cada pantalla).
export const iconFor = (t) => { const x = String(t || '').toLowerCase();
  return /reuni/.test(x) ? ICON.team : /calend|agenda|hoy/.test(x) ? ICON.cal : /subir|entrega/.test(x) ? ICON.upload : /checklist/.test(x) ? ICON.check : /sop|library|plantilla|prompt|acceso r/.test(x) ? ICON.book
    : /cliente|material|drive|asset/.test(x) ? ICON.folder : /cola|tarea|pendiente|plan|matriz/.test(x) ? ICON.list : /idea/.test(x) ? ICON.bulb : /diseñ|static/.test(x) ? ICON.slides : /equipo|team/.test(x) ? ICON.team : /número|finanz|revenue|métric/.test(x) ? ICON.chart : ICON.sparkle; };

// ---------- ⓘ: qué es cada sección ----------
// Junto a cada título conocido aparece un circulito con «i»; al pasar el mouse o tocarlo explica para qué sirve.
const INFO = [
  [/^hoy$/i, 'Tu día: tu agenda de Google Calendar y tus tareas abiertas. Marca la casilla cuando termines.'],
  [/^home$/i, 'El resumen del día: lo que entra, lo que se mueve y lo que tienes pendiente.'],
  [/^revenue$/i, 'Lo que se facturó este mes, sacado de los ingresos de Finanzas.'],
  [/^leads$/i, 'Los prospectos abiertos en Sales. = interés alto.'],
  [/^engagement$/i, 'De cada 100 personas que vieron tus posts, cuántas interactuaron (like, comentario, guardado, compartido). La flecha compara con el periodo anterior.'],
  [/^content$/i, 'Lo que se produce y se publica de cada perfil: shot list, planner, guiones, por postear, referencias y métricas.'],
  [/^mi trabajo$/i, 'Tus tareas abiertas de la semana. El detalle está en tu Workspace.'],
  [/^control$/i, 'El panel del CEO y el COO: todo lo que entra, de lead a proyecto, y lo que necesita atención hoy.'],
  [/^el flujo$/i, 'Cada columna es un paso: lead → cotización → aprobada → pago → confirmado. Cada tarjeta trae su siguiente paso.'],
  [/^necesita atención$/i, 'Lo que está atrasado, bloqueado o esperando una decisión. Lo urgente va primero.'],
  [/^workspace$/i, 'Tu lugar de trabajo: tus tareas, tu kanban y lo propio de tu perfil.'],
  [/^mis tareas de hoy/i, 'Lo que vence hoy o mañana. Escribe abajo y Enter para agregar una tarea rápida.'],
  [/^mis tareas$/i, 'Todo lo que tienes abierto, de lo más urgente a lo que puede esperar.'],
  [/^cola de decisiones/i, 'Lo que espera tu OK: la estrategia (① Strategy), el plan y presupuesto de pauta (⑩ Ads) y lo que te rinde cuentas.'],
  [/^agenda y contenido/i, 'Tus reuniones de hoy y lo que se publica en los próximos 7 días.'],
  [/^pipelines/i, 'Cómo van las tareas de cada línea (Contenido y Business Growth): quién lo hace y quién rinde cuentas.'],
  [/^accountability/i, 'Cuántas tareas del mes lleva cada persona. El punto se pone rojo si tiene atrasadas.'],
  [/^lo tuyo como ceo/i, 'Tus carriles como CEO: estrategia, clientes y los gates de pauta.'],
  [/^entregas por revisar/i, 'Lo que te entregaron y espera tu visto bueno. ✓ lo aprueba.'],
  [/^próximos controles/i, 'Las fases de los proyectos que arrancan o están en curso en los próximos 10 días.'],
  [/^carga del equipo/i, 'Cuántas tareas abiertas tiene cada persona, para repartir mejor.'],
  [/^entregas recientes/i, 'Lo último que entregaste y si ya lo aprobaron.'],
  [/^mis sops/i, 'Los documentos de la Library marcados para tu perfil.'],
  [/^acceso rápido/i, 'SOPs y prompts generales que usas seguido.'],
  [/^por cliente/i, 'Los assets, guiones, videos y prompts de cada marca, en un solo lugar.'],
  [/^cola de producción/i, 'Tus videos y ads ordenados por fecha de entrega.'],
  [/^plan de contenido por cliente/i, 'Las piezas de cada perfil según su etapa: idea, guion, edición y lista para publicar.'],
  [/^matriz de publicaciones/i, 'Qué sale, cuándo, en qué formato y con qué CTA.'],
  [/^diseño y static/i, 'Tus tareas de ⑥A Diseño gráfico y static ads.'],
  [/^material del cliente/i, 'Lo que el cliente nos dio: links, assets y lo del repo.'],
  [/^mis proyectos/i, 'Tus proyectos de Business Growth y en qué fase va cada uno.'],
  [/^cuentas de pauta/i, 'Las cuentas de Meta, Google Ads y LinkedIn de cada cliente. Desde aquí abres su Ads Manager.'],
  [/^cómo va la pauta/i, 'Gasto, conversiones, CPA y ROAS reales de cada cliente, leídos de sus cuentas de pauta conectadas.'],
  [/^plan y presupuesto/i, 'Gate ⑩: el CEO aprueba el plan y el presupuesto antes de lanzar cualquier campaña.'],
  [/^anuncios de la competencia/i, 'Los anuncios que la competencia tiene activos en Meta, leídos de su biblioteca de anuncios.'],
  [/^mis próximas reuniones/i, 'Las reuniones de tus proyectos en los próximos 30 días: quién va y de qué se habla.'],
  [/^tus cuentas/i, 'Las cuentas de la marca. De aquí salen Analytics, la Bandeja y «lo tuyo» en la lectura semanal.'],
  [/^referentes/i, 'Cuentas de las que tomamos estilo y temas. No se copian: se leen.'],
  [/^competencia/i, 'Contra quién compite la marca. Las del onboarding vienen de ① Strategy.'],
  [/^scrape semanal/i, 'Cada lunes se leen 10 posts por fuente (tus cuentas, referentes, competencia y hashtags) para ver qué está funcionando.'],
  [/la diana de/i, 'A quién le habla el contenido: una persona exacta al centro y 4 anillos más amplios. 3 videos de cada 5 van al centro.'],
  [/^top 10 del nicho/i, 'Los posts que más rindieron en tu nicho esta semana, contra el promedio de cada cuenta.'],
  [/^lo último de/i, 'Lo más reciente que publicaron, para estar al día.'],
  [/^vistas promedio/i, 'Cuántas vistas tuvo en promedio cada post, semana por semana.'],
  [/^tus últimos posts/i, 'Lo último que publicaste, con sus números.'],
  [/^mejores posts/i, 'Tus posts con más interacción en el periodo.'],
  [/^alcance/i, 'A cuántas personas llegaste cada día.'],
  [/^reels · /i, 'Hasta qué punto del video llega la gente antes de irse.'],
  [/^sales$/i, 'Leads, cotizaciones y servicios: todo lo que entra antes de ser cliente.'],
  [/^servicios$/i, 'El catálogo de lo que vendemos, con su precio.'],
  [/^planes$/i, 'Los planes de Inherent y lo que incluye cada uno.'],
  [/^finance$/i, 'Caja, ingresos, gastos y nómina de Inherent.'],
  [/^revenue vs/i, 'Lo que entró contra lo que costó, mes a mes.'],
  [/^costo/i, 'Lo que cuesta cada plan por rubro. Solo lo ve el CEO.'],
  [/^reparto por rol/i, 'Cuánto se le paga a cada rol por cuenta, según el plan.'],
  [/^el mes de cada persona/i, 'Lo que le toca cobrar a cada persona este mes por los servicios y cuentas que atiende. No hay nómina fija: se paga por servicio.'],
  [/^¿qué tan fuerte/i, 'Cuánto aporta cada servicio a la facturación.'],
  [/^clients$/i, 'Cada cliente: su plan, sus accesos, su roadmap y su portal.'],
  [/^plan contratado/i, 'Lo que el cliente compró: el techo de lo que se entrega.'],
  [/^roadmap/i, 'Las fases del cliente y en cuál va.'],
  [/^accesos/i, 'Las cuentas y contraseñas que el cliente nos compartió.'],
  [/^en onboarding/i, 'Clientes que todavía están terminando su onboarding.'],
  [/^entregables/i, 'Lo que se le entregó al cliente y su estado.'],
  [/^operations$/i, 'Los proyectos por fase, su calendario y su timeline.'],
  [/^timeline/i, 'Las fases de cada proyecto en el tiempo.'],
  [/^tareas$/i, 'Todas las tareas, con responsable y fecha.'],
  [/^library$/i, 'SOPs, plantillas, prompts y documentos del equipo.'],
  [/^documentos/i, 'Los documentos de esta carpeta.'],
  [/^team$/i, 'Quién es quién, qué perfil de trabajo tiene y a quién le reporta.'],
  [/^especialista/i, 'La red de mentores por industria que hace la auditoría de la línea Growth.'],
  [/^tus conexiones/i, 'Los permisos de Google que tiene la app y tu IA conectada.'],
];
const tipFor = (t) => INFO.find(([re]) => re.test(t.trim()))?.[1];
export function infoTips(root) {
  for (const h of root.querySelectorAll('h1,h2,h3:not([data-tipped])')) {
    if (h.dataset.tipped || h.closest('dialog,.login,.nav')) continue;
    h.dataset.tipped = '1';
    const br0 = h.querySelector('br'), nodes = [...h.childNodes];
    const tip = tipFor(br0 ? nodes.slice(0, nodes.indexOf(br0)).map((n) => n.textContent).join('') : h.textContent); if (!tip) continue;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'itip'; b.dataset.tip = tip; b.setAttribute('aria-label', tip); b.textContent = 'i';
    // Dentro de un título con salto de línea (ej. «Revenue<br>…») va después de la primera palabra.
    const br = h.querySelector('br'); br ? h.insertBefore(b, br) : h.appendChild(b);
  }
}
// Tocar la «i» no abre la tarjeta que la contiene.
document.addEventListener('click', (e) => { const b = e.target.closest?.('.itip'); if (b) { e.stopPropagation(); e.preventDefault(); b.focus(); } }, true);

// ---------- «De dónde sale»: el chip pequeño que dice de dónde viene un dato y lleva ahí ----------
// fromLink({ label, href })                    → «⌁ de <label>» con link a esa pantalla
// fromLink({ repo: 'clients/x/…/LINKS.md', docs }) → «⌁ del repo: LINKS.md»: abre el doc en la Library si está ahí; si no, muestra la ruta
// plain: true → sin link (para usarlo dentro de algo que ya es un link)
export function fromLink(src = {}) {
  if (!src) return '';
  if (src.repo) {
    const file = String(src.repo).split('/').pop();
    const d = (src.docs || []).find((x) => x.repo === src.repo || String(x.title || '').toLowerCase().includes(file.replace(/\.md$/i, '').toLowerCase()));
    const label = `del repo: ${file}`;
    return d && !src.plain ? html`<a class="fromlink" href="#/library/${d.folder_id || '_'}/${d.id}" title="Abrir en la Library · ${src.repo}">⌁ ${label}</a>`
      : html`<span class="fromlink" title="${src.repo}">⌁ ${label}<span class="fromlink-path">${src.repo}</span></span>`;
  }
  const label = src.label ? `de ${src.label}` : 'de dónde sale';
  return src.href && !src.plain ? html`<a class="fromlink" href="${src.href}" title="${src.title || 'De dónde sale este dato'}">⌁ ${label}</a>` : html`<span class="fromlink" title="${src.title || ''}">⌁ ${label}</span>`;
}

// ---------- El sheet de edición: los mismos campos que ask(), en la vista grande ----------
// sheetForm(title, fields, { okLabel, chip, note }) → Promise de los valores (o null si se cierra).
export function sheetForm(title, fields, { okLabel = 'Guardar', chip = '', note = '' } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (done) return; done = true; resolve(v); };
    const input = (f) => f.t === 'select' ? html`<select class="in" name="${f.k}">${(f.opts || []).map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return html`<option value="${v}" ${String(v) === String(f.v ?? '') ? raw('selected') : ''}>${l}</option>`; })}</select>`
      : f.t === 'textarea' ? html`<textarea class="in" name="${f.k}" rows="3">${f.v ?? ''}</textarea>`
      : html`<input class="in" name="${f.k}" type="${f.t || 'text'}" value="${f.v ?? ''}" ${f.t === 'number' ? raw('step="any" inputmode="decimal"') : ''}>`;
    const d = drawer(html`<div class="row">${chip ? html`<span class="chip">${chip}</span>` : ''}<div class="sp"></div><button class="arrow light" type="button" data-act="close" aria-label="Cerrar">${ico('x', 16)}</button></div>
      <form class="form" id="sheetform"><h2>${title}</h2>${note ? html`<div class="mut sm" style="margin:-4px 0 12px">${note}</div>` : ''}
        ${fields.map((f) => html`<div style="margin-bottom:12px"><label class="f">${f.l}${f.req ? ' *' : ''}</label>${input(f)}${f.help ? html`<div class="mut sm" style="margin-top:4px">${f.help}</div>` : ''}</div>`)}</form>
      <div class="row" style="gap:8px"><button class="btn" type="button" data-act="ok">${okLabel}</button><button class="btn ghost" type="button" data-act="close">Cancelar</button></div>`, {
      ok: () => {
        const form = $('#sheetform', d), out = {};
        for (const f of fields) { let v = String(form.elements[f.k].value ?? '').trim(); if (f.t === 'number') v = v === '' ? null : Number(v); out[f.k] = v; }
        const miss = fields.find((f) => f.req && (out[f.k] === '' || out[f.k] == null)); if (miss) return toast(`Falta: ${miss.l}`, true);
        finish(out); closeDrawer();
      },
    });
    const form = $('#sheetform', d); form.onsubmit = (e) => { e.preventDefault(); d.querySelector('[data-act=ok]')?.click(); };
    // Cerrar el panel (X, velo o Esc) = cancelar.
    const watch = new MutationObserver(() => { if (!d.classList.contains('on')) { watch.disconnect(); finish(null); } });
    watch.observe(d, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => form.querySelector('.in')?.focus(), 60);
  });
}
