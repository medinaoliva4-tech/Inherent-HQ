// Motor de diagramas de Inherent OS: el modelo, la geometría, el dibujo en SVG y la ida y vuelta con Mermaid.
// Funciones puras (sin DOM): las usa el editor visual (diagram-editor.js), la vista de lectura y las pruebas en Node.
//
// Un diagrama es { v, dir, edgeStyle, nodes, edges, viewport }:
//   nodo   { id, type: rect|diamond|ellipse|note, x, y, w, h, text, fill }   (x, y = esquina de arriba a la izquierda)
//   arista { id, from, to, label, style: curve|ortho, head, fromPort, toPort }   (puertos t|r|b|l; vacío = automático)
//   viewport { x, y, k }   pantalla = mundo × k + (x, y)

export const GRID = 16;
export const TYPES = ['rect', 'diamond', 'ellipse', 'note'];
export const SHAPES = {
  rect: { l: 'Proceso', w: 176, h: 64 },
  diamond: { l: 'Decisión', w: 168, h: 96 },
  ellipse: { l: 'Inicio / fin', w: 160, h: 64 },
  note: { l: 'Nota', w: 176, h: 96 },
};
// La paleta de marca: el color de día (el que se exporta) y el de la tinta encima.
export const PALETTE = [
  { k: 'papel', l: 'Papel', hex: '#fcf9f2', ink: '#2c1f16' },
  { k: 'crema', l: 'Crema', hex: '#f3ede3', ink: '#2c1f16' },
  { k: 'arena', l: 'Arena', hex: '#e8dccb', ink: '#2c1f16' },
  { k: 'lino', l: 'Lino', hex: '#d9cbbb', ink: '#2c1f16' },
  { k: 'salvia', l: 'Salvia', hex: '#dcdcc6', ink: '#2c1f16' },
  { k: 'barro', l: 'Barro', hex: '#ecd2c2', ink: '#2c1f16' },
  { k: 'tierra', l: 'Tierra', hex: '#a18770', ink: '#fdfaf3' },
  { k: 'cafe', l: 'Café', hex: '#795c45', ink: '#fdfaf3' },
  { k: 'espresso', l: 'Espresso', hex: '#36271b', ink: '#fdfaf3' },
];
const PAL = Object.fromEntries(PALETTE.map((p) => [p.k, p]));
export const INK = { stroke: '#2c1f16', edge: '#8c725c', label: '#4a3628', labelBg: '#fcf9f2', bg: '#f6f1e8' };
export const FONT = "'Inter', Helvetica, Arial, sans-serif";
export const FS = 14, LH = 19;

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 100) / 100 : d);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const snap = (v, g = GRID) => Math.round(v / g) * g;
export const empty = (dir = 'TD') => ({ v: 1, dir, edgeStyle: 'curve', nodes: [], edges: [], viewport: { x: 0, y: 0, k: 1 } });

// Un id corto que no choca con los que ya hay.
export function nextId(d, p = 'n') {
  const used = new Set([...(d.nodes || []), ...(d.edges || [])].map((x) => x.id)); let i = used.size + 1;
  while (used.has(p + i)) i++;
  return p + i;
}

// Lo que llega de afuera (el doc guardado, un import) se limpia: tipos válidos, números, ids únicos, aristas con dos puntas.
export function normalize(raw) {
  const d = raw && typeof raw === 'object' ? raw : {};
  const out = empty(d.dir === 'LR' ? 'LR' : 'TD');
  out.edgeStyle = d.edgeStyle === 'ortho' ? 'ortho' : 'curve';
  const seen = new Set();
  for (const n of (Array.isArray(d.nodes) ? d.nodes : []).slice(0, 600)) {
    if (!n || typeof n !== 'object') continue;
    let id = String(n.id || '').slice(0, 60) || 'n' + (seen.size + 1); while (seen.has(id)) id += '_';
    seen.add(id);
    const type = TYPES.includes(n.type) ? n.type : 'rect', S = SHAPES[type];
    out.nodes.push({ id, type, x: num(n.x), y: num(n.y), w: clamp(num(n.w, S.w), 40, 2000), h: clamp(num(n.h, S.h), 28, 2000),
      text: String(n.text ?? '').slice(0, 2000), fill: fillKey(n.fill) });
  }
  const eids = new Set();
  for (const e of (Array.isArray(d.edges) ? d.edges : []).slice(0, 1200)) {
    if (!e || !seen.has(e.from) || !seen.has(e.to)) continue;
    let id = String(e.id || '').slice(0, 60) || 'e' + (eids.size + 1); while (eids.has(id) || seen.has(id)) id += '_';
    eids.add(id);
    const port = (p) => (['t', 'r', 'b', 'l'].includes(p) ? p : '');
    out.edges.push({ id, from: e.from, to: e.to, label: String(e.label ?? '').slice(0, 300), style: e.style === 'ortho' ? 'ortho' : e.style === 'curve' ? 'curve' : '',
      head: e.head !== false, fromPort: port(e.fromPort), toPort: port(e.toPort) });
  }
  const vp = d.viewport || {};
  out.viewport = { x: num(vp.x), y: num(vp.y), k: clamp(num(vp.k, 1), 0.1, 4) };
  return out;
}

// Un color: la llave de la paleta, o el tono de la paleta más cercano a un hex.
export function fillKey(f) {
  if (PAL[f]) return f;
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(String(f || '').trim()); if (!m) return 'papel';
  let h = m[1]; if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const rgb = (x) => [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
  const [r, g, b] = rgb(h); let best = 'papel', bd = Infinity;
  for (const p of PALETTE) { const [R, G, B] = rgb(p.hex.slice(1)); const dd = (r - R) ** 2 + (g - G) ** 2 + (b - B) ** 2; if (dd < bd) { bd = dd; best = p.k; } }
  return best;
}
export const fillHex = (k) => (PAL[k] || PAL.papel).hex;
export const inkHex = (k) => (PAL[k] || PAL.papel).ink;

// ---------------- texto ----------------
// Mide con la función que le pasen (en el navegador, un canvas); si no, una aproximación por letra.
export const approxMeasure = (s, fs = FS) => [...String(s)].reduce((w, c) => w + (/[mwMW@]/.test(c) ? 0.86 : /[A-ZÁÉÍÓÚÑ0-9]/.test(c) ? 0.64 : /[ilj.,:;'!|]/.test(c) ? 0.3 : c === ' ' ? 0.3 : 0.54), 0) * fs;
export function wrap(text, maxW, measure = approxMeasure) {
  const out = [];
  for (const para of String(text || '').split('\n')) {
    const words = para.split(/\s+/).filter(Boolean); if (!words.length) { out.push(''); continue; }
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (measure(t) <= maxW || !line) {
        if (!line && measure(w) > maxW) { // una palabra más larga que la caja se corta
          let chunk = ''; for (const c of w) { if (measure(chunk + c) > maxW && chunk) { out.push(chunk); chunk = ''; } chunk += c; } line = chunk;
        } else line = t;
      } else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}
// El área donde cabe el texto según la forma (el rombo deja menos ancho).
export const textBox = (n) => (n.type === 'diamond' ? { w: n.w * 0.62, h: n.h * 0.62 } : n.type === 'ellipse' ? { w: n.w * 0.78, h: n.h * 0.8 } : { w: n.w - 24, h: n.h - 16 });
// Un tamaño que le queda al texto (al importar o al escribir mucho).
export function fitSize(type, text, measure = approxMeasure) {
  const S = SHAPES[type] || SHAPES.rect; let w = S.w;
  const longest = Math.max(0, ...String(text || '').split('\n').map((l) => measure(l)));
  const k = type === 'diamond' ? 0.62 : type === 'ellipse' ? 0.78 : 1, pad = type === 'diamond' || type === 'ellipse' ? 0 : 24;
  w = clamp(Math.ceil((longest / k + pad) / GRID) * GRID, S.w, 288);
  const lines = wrap(text, textBox({ type, w, h: S.h }).w, measure).length;
  const need = lines * LH / (type === 'diamond' ? 0.6 : type === 'ellipse' ? 0.78 : 1) + (type === 'rect' || type === 'note' ? 22 : 8);
  return { w, h: Math.max(S.h, Math.ceil(need / GRID) * GRID) };
}

// ---------------- geometría ----------------
const center = (n) => [n.x + n.w / 2, n.y + n.h / 2];
export const PORTS = ['t', 'r', 'b', 'l'];
const NORM = { t: [0, -1], r: [1, 0], b: [0, 1], l: [-1, 0] };
export function portPoint(n, p) {
  const [cx, cy] = center(n);
  return p === 't' ? [cx, n.y] : p === 'r' ? [n.x + n.w, cy] : p === 'b' ? [cx, n.y + n.h] : [n.x, cy];
}
// Si la arista no fija sus puertos, se eligen por dónde está el otro nodo.
export function pickPorts(a, b) {
  const [ax, ay] = center(a), [bx, by] = center(b);
  const dx = bx - ax, dy = by - ay;
  const sx = Math.abs(dx) / ((a.w + b.w) / 2 || 1), sy = Math.abs(dy) / ((a.h + b.h) / 2 || 1);
  if (sx > sy && Math.abs(dx) > (a.w + b.w) / 2 - 8) return dx > 0 ? ['r', 'l'] : ['l', 'r'];
  return dy >= 0 ? ['b', 't'] : ['t', 'b'];
}
function roundPoly(pts, r = 10) {
  // quita los puntos repetidos o en línea recta
  const p = pts.filter((q, i) => i === 0 || Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 0.5);
  const s = [];
  for (let i = 0; i < p.length; i++) { if (i > 0 && i < p.length - 1) { const [a, b, c] = [p[i - 1], p[i], p[i + 1]]; if (Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) < 0.01) continue; } s.push(p[i]); }
  let d = `M${f(s[0][0])} ${f(s[0][1])}`;
  for (let i = 1; i < s.length; i++) {
    const cur = s[i];
    if (i < s.length - 1) {
      const prev = s[i - 1], nxt = s[i + 1];
      const l1 = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]), l2 = Math.hypot(nxt[0] - cur[0], nxt[1] - cur[1]);
      const rr = Math.min(r, l1 / 2, l2 / 2);
      const a = [cur[0] - ((cur[0] - prev[0]) / l1) * rr, cur[1] - ((cur[1] - prev[1]) / l1) * rr];
      const b = [cur[0] + ((nxt[0] - cur[0]) / l2) * rr, cur[1] + ((nxt[1] - cur[1]) / l2) * rr];
      d += ` L${f(a[0])} ${f(a[1])} Q${f(cur[0])} ${f(cur[1])} ${f(b[0])} ${f(b[1])}`;
    } else d += ` L${f(cur[0])} ${f(cur[1])}`;
  }
  return { d, pts: s };
}
const f = (v) => Math.round(v * 10) / 10;
function polyMid(pts) {
  let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let half = total / 2;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (half <= l) { const t = l ? half / l : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; } half -= l; }
  return pts[pts.length - 1];
}
// El camino de una arista entre dos nodos (o hacia un punto suelto, mientras se arrastra).
export function edgeGeom(a, b, { style = 'curve', fromPort, toPort, toPoint } = {}) {
  let [pa, pb] = b ? pickPorts(a, b) : ['b', 't'];
  if (fromPort) pa = fromPort; if (toPort && b) pb = toPort;
  if (!b && toPoint) { const dx = toPoint[0] - center(a)[0], dy = toPoint[1] - center(a)[1]; pb = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'l' : 'r') : (dy > 0 ? 't' : 'b'); if (!fromPort) pa = { l: 'r', r: 'l', t: 'b', b: 't' }[pb]; }
  const p1 = portPoint(a, pa), p2 = b ? portPoint(b, pb) : toPoint;
  const n1 = NORM[pa], n2 = NORM[pb];
  if (style === 'ortho') {
    const o = 20, A = [p1[0] + n1[0] * o, p1[1] + n1[1] * o], B = [p2[0] + n2[0] * o, p2[1] + n2[1] * o];
    const v1 = n1[0] === 0, v2 = n2[0] === 0; let mid;
    if (v1 && v2) { const my = (A[1] + B[1]) / 2; mid = [[A[0], my], [B[0], my]]; }
    else if (!v1 && !v2) { const mx = (A[0] + B[0]) / 2; mid = [[mx, A[1]], [mx, B[1]]]; }
    else if (v1) mid = [[A[0], B[1]]]; else mid = [[B[0], A[1]]];
    const r = roundPoly([p1, A, ...mid, B, p2]);
    return { d: r.d, mid: polyMid(r.pts), p1, p2, ports: [pa, pb] };
  }
  const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), c = clamp(dist * 0.42, 24, 150);
  const c1 = [p1[0] + n1[0] * c, p1[1] + n1[1] * c], c2 = [p2[0] + n2[0] * c, p2[1] + n2[1] * c];
  const t = 0.5, u = 1 - t;
  const mid = [0, 1].map((i) => u * u * u * p1[i] + 3 * u * u * t * c1[i] + 3 * u * t * t * c2[i] + t * t * t * p2[i]);
  return { d: `M${f(p1[0])} ${f(p1[1])} C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`, mid, p1, p2, ports: [pa, pb] };
}
export function bounds(d, pad = 0) {
  const ns = d.nodes || []; if (!ns.length) return { x: -pad, y: -pad, w: 2 * pad, h: 2 * pad };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of ns) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + n.w); y1 = Math.max(y1, n.y + n.h); }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}

// ---------------- dibujo (SVG en texto) ----------------
const X = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const xesc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => X[c]);
export function shapeSVG(n, cls = 'dg-s') {
  const fill = fillHex(n.fill), a = `class="${cls}" fill="${fill}" stroke="${INK.stroke}" stroke-opacity="0.2" stroke-width="1.2"`;
  if (n.type === 'diamond') return `<path ${a} stroke-linejoin="round" d="M${f(n.w / 2)} 0 L${f(n.w)} ${f(n.h / 2)} L${f(n.w / 2)} ${f(n.h)} L0 ${f(n.h / 2)} Z"/>`;
  if (n.type === 'ellipse') return `<ellipse ${a} cx="${f(n.w / 2)}" cy="${f(n.h / 2)}" rx="${f(n.w / 2)}" ry="${f(n.h / 2)}"/>`;
  if (n.type === 'note') { const c = Math.min(18, n.w / 4, n.h / 4); return `<path ${a} stroke-linejoin="round" d="M6 0 H${f(n.w - c)} L${f(n.w)} ${f(c)} V${f(n.h - 6)} Q${f(n.w)} ${f(n.h)} ${f(n.w - 6)} ${f(n.h)} H6 Q0 ${f(n.h)} 0 ${f(n.h - 6)} V6 Q0 0 6 0 Z"/><path class="dg-fold" fill="${INK.stroke}" fill-opacity="0.08" d="M${f(n.w - c)} 0 V${f(c)} H${f(n.w)} Z"/>`; }
  return `<rect ${a} width="${f(n.w)}" height="${f(n.h)}" rx="14"/>`;
}
export function textSVG(n, measure = approxMeasure) {
  const tb = textBox(n), lines = wrap(n.text, tb.w, measure);
  const max = Math.max(1, Math.round(tb.h / LH)), show = lines.slice(0, max);
  if (lines.length > max && show.length) show[show.length - 1] = show[show.length - 1].replace(/.?$/, '…');
  const y0 = n.h / 2 - ((show.length - 1) * LH) / 2;
  return `<text class="dg-tx" fill="${inkHex(n.fill)}" font-family="${xesc(FONT)}" font-size="${FS}" font-weight="500" text-anchor="middle" dominant-baseline="central">${show.map((l, i) => `<tspan x="${f(n.w / 2)}" y="${f(y0 + i * LH)}">${xesc(l)}</tspan>`).join('')}</text>`;
}
export const nodeSVG = (n, measure) => `<g class="dg-n" data-n="${xesc(n.id)}" data-f="${xesc(n.fill)}" data-t="${n.type}" transform="translate(${f(n.x)} ${f(n.y)})">${shapeSVG(n)}${n.text ? textSVG(n, measure) : ''}</g>`;
export function edgeSVG(e, by, { measure = approxMeasure, defStyle = 'curve', mk = 'dg' } = {}) {
  const a = by.get(e.from), b = by.get(e.to); if (!a || !b) return '';
  const g = edgeGeom(a, b, { style: e.style || defStyle, fromPort: e.fromPort, toPort: e.toPort });
  let lab = '';
  if (e.label) { const w = Math.min(220, measure(e.label, 12.5) + 18), h = 22;
    lab = `<g class="dg-lab" transform="translate(${f(g.mid[0])} ${f(g.mid[1])})"><rect class="dg-lb" x="${f(-w / 2)}" y="${-h / 2}" width="${f(w)}" height="${h}" rx="11" fill="${INK.labelBg}" stroke="${INK.stroke}" stroke-opacity="0.12"/><text class="dg-lt" fill="${INK.label}" font-family="${xesc(FONT)}" font-size="12.5" font-weight="500" text-anchor="middle" dominant-baseline="central">${xesc(e.label)}</text></g>`; }
  return `<g class="dg-e" data-e="${xesc(e.id)}"><path class="dg-hit" d="${g.d}" fill="none" stroke="transparent" stroke-width="16"/><path class="dg-p" d="${g.d}" fill="none" stroke="${INK.edge}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"${e.head !== false ? ` marker-end="url(#${mk}-ah)"` : ''}/>${lab}</g>`;
}
export const defsSVG = (mk = 'dg') => `<defs><marker id="${mk}-ah" viewBox="0 0 12 12" refX="10.5" refY="6" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="dg-ah" d="M1.5 1.5 L10.5 6 L1.5 10.5 Q3.6 6 1.5 1.5 Z" fill="${INK.edge}"/></marker><marker id="${mk}-ahs" viewBox="0 0 12 12" refX="10.5" refY="6" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="dg-ahs" d="M1.5 1.5 L10.5 6 L1.5 10.5 Q3.6 6 1.5 1.5 Z" fill="${INK.stroke}"/></marker></defs>`;
// El SVG completo, con colores escritos (no depende de la hoja de estilos): para exportar.
export function toSVG(d, { pad = 40, measure = approxMeasure, bg = true } = {}) {
  const b = bounds(d, pad), by = new Map(d.nodes.map((n) => [n.id, n]));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(b.w)}" height="${Math.ceil(b.h)}" viewBox="${f(b.x)} ${f(b.y)} ${Math.ceil(b.w)} ${Math.ceil(b.h)}">${defsSVG('x')}${bg ? `<rect x="${f(b.x)}" y="${f(b.y)}" width="${Math.ceil(b.w)}" height="${Math.ceil(b.h)}" fill="${INK.bg}"/>` : ''}<g>${d.edges.map((e) => edgeSVG(e, by, { measure, defStyle: d.edgeStyle, mk: 'x' })).join('')}</g><g>${d.nodes.map((n) => nodeSVG(n, measure)).join('')}</g></svg>`;
}

// ---------------- auto-orden por niveles (flowchart TD / LR) ----------------
export function autoLayout(src, dir = src.dir || 'TD') {
  const d = { ...src, dir, nodes: src.nodes.map((n) => ({ ...n })), edges: src.edges.map((e) => ({ ...e, fromPort: '', toPort: '' })) };
  const ids = d.nodes.map((n) => n.id), by = new Map(d.nodes.map((n) => [n.id, n]));
  const out = new Map(ids.map((i) => [i, []])), inn = new Map(ids.map((i) => [i, []]));
  for (const e of d.edges) if (e.from !== e.to && by.has(e.from) && by.has(e.to)) { out.get(e.from).push(e.to); inn.get(e.to).push(e.from); }
  // 1. se rompen los ciclos (las aristas que vuelven hacia atrás no cuentan para el nivel)
  const state = new Map(), dag = new Map(ids.map((i) => [i, []]));
  const starts = [...ids.filter((i) => !inn.get(i).length), ...ids];
  for (const s of starts) {
    if (state.has(s)) continue;
    const stack = [[s, 0]]; state.set(s, 1);
    while (stack.length) {
      const top = stack[stack.length - 1], [v, i] = top, nx = out.get(v);
      if (i >= nx.length) { state.set(v, 2); stack.pop(); continue; }
      top[1]++; const w = nx[i];
      if (!state.has(w)) { dag.get(v).push(w); state.set(w, 1); stack.push([w, 0]); }
      else if (state.get(w) === 2) dag.get(v).push(w); // arista hacia adelante o cruzada: vale
    }
  }
  // 2. nivel = el camino más largo desde una raíz
  const indeg = new Map(ids.map((i) => [i, 0])); for (const v of ids) for (const w of dag.get(v)) indeg.set(w, indeg.get(w) + 1);
  const rank = new Map(ids.map((i) => [i, 0])), q = ids.filter((i) => !indeg.get(i)), order = [];
  while (q.length) { const v = q.shift(); order.push(v); for (const w of dag.get(v)) { rank.set(w, Math.max(rank.get(w), rank.get(v) + 1)); indeg.set(w, indeg.get(w) - 1); if (!indeg.get(w)) q.push(w); } }
  const preds = new Map(ids.map((i) => [i, []])); for (const v of ids) for (const w of dag.get(v)) preds.get(w).push(v);
  const succs = dag;
  const L = []; for (const v of ids) { const r = rank.get(v); (L[r] ||= []).push(v); }
  for (let r = 0; r < L.length; r++) L[r] ||= [];
  // 3. orden dentro de cada nivel: baricentro, unas pasadas hacia abajo y hacia arriba
  const pos = new Map(); const setPos = () => L.forEach((layer) => layer.forEach((v, i) => pos.set(v, i)));
  setPos();
  const bary = (v, nb) => { const ps = nb.get(v).map((u) => pos.get(u)); return ps.length ? ps.reduce((a, z) => a + z, 0) / ps.length : pos.get(v); };
  for (let it = 0; it < 4; it++) {
    for (let r = 1; r < L.length; r++) { L[r] = L[r].map((v, i) => [v, bary(v, preds), i]).sort((a, z) => a[1] - z[1] || a[2] - z[2]).map((x) => x[0]); setPos(); }
    for (let r = L.length - 2; r >= 0; r--) { L[r] = L[r].map((v, i) => [v, bary(v, succs), i]).sort((a, z) => a[1] - z[1] || a[2] - z[2]).map((x) => x[0]); setPos(); }
  }
  // 4. coordenadas: el nivel en un eje, el orden en el otro; cada nodo tiende a quedar centrado con sus padres
  const LR = dir === 'LR', main = (n) => (LR ? n.w : n.h), cross = (n) => (LR ? n.h : n.w);
  const gapMain = LR ? 96 : 72, gapCross = LR ? 32 : 48;
  const c = new Map(); // centro en el eje cruzado
  L.forEach((layer) => { let t = 0; const tot = layer.reduce((a, v) => a + cross(by.get(v)), 0) + gapCross * Math.max(0, layer.length - 1); t = -tot / 2; for (const v of layer) { const s = cross(by.get(v)); c.set(v, t + s / 2); t += s + gapCross; } });
  const settle = (layer, want) => { // respeta el orden y la separación mínima, lo más cerca posible de lo deseado
    const xs = layer.map((v) => want(v));
    for (let i = 1; i < layer.length; i++) { const min = xs[i - 1] + (cross(by.get(layer[i - 1])) + cross(by.get(layer[i]))) / 2 + gapCross; if (xs[i] < min) xs[i] = min; }
    const shift = (layer.reduce((a, v) => a + want(v), 0) - xs.reduce((a, z) => a + z, 0)) / (layer.length || 1);
    layer.forEach((v, i) => c.set(v, xs[i] + shift));
  };
  for (let it = 0; it < 3; it++) {
    for (let r = 1; r < L.length; r++) settle(L[r], (v) => { const p = preds.get(v); return p.length ? p.reduce((a, u) => a + c.get(u), 0) / p.length : c.get(v); });
    for (let r = L.length - 2; r >= 0; r--) settle(L[r], (v) => { const s = succs.get(v); return s.length ? s.reduce((a, u) => a + c.get(u), 0) / s.length : c.get(v); });
  }
  let m = 0; // se alinea el centro de cada nodo a la cuadrícula: así las flechas quedan rectas
  L.forEach((layer) => { const size = Math.max(0, ...layer.map((v) => main(by.get(v)))); for (const v of layer) { const n = by.get(v); const mm = snap(m + size / 2) - main(n) / 2, cc = snap(c.get(v)) - cross(n) / 2; if (LR) { n.x = mm; n.y = cc; } else { n.x = cc; n.y = mm; } } m += size + gapMain; });
  return d;
}

// ---------------- Mermaid ----------------
const RESERVED = new Set(['end', 'graph', 'flowchart', 'subgraph', 'style', 'class', 'classdef', 'click', 'linkstyle', 'direction', 'default']);
const mmText = (s) => String(s || '').replace(/"/g, '#quot;').replace(/\n/g, '<br>');
export function toMermaid(d) {
  const ids = new Map(), used = new Set();
  d.nodes.forEach((n, i) => { let s = /^[A-Za-z_][\w]*$/.test(n.id) && !RESERVED.has(n.id.toLowerCase()) ? n.id : 'n' + (i + 1); while (used.has(s)) s += '_'; used.add(s); ids.set(n.id, s); });
  const sh = { rect: ['[', ']'], diamond: ['{', '}'], ellipse: ['((', '))'], note: ['>', ']'] };
  const out = [`flowchart ${d.dir === 'LR' ? 'LR' : 'TD'}`];
  for (const n of d.nodes) { const [o, c] = sh[n.type] || sh.rect; out.push(`  ${ids.get(n.id)}${o}"${mmText(n.text)}"${c}`); }
  for (const e of d.edges) { if (!ids.has(e.from) || !ids.has(e.to)) continue; const a = e.head === false ? '---' : '-->'; out.push(`  ${ids.get(e.from)} ${a}${e.label ? `|"${mmText(e.label)}"|` : ''} ${ids.get(e.to)}`); }
  for (const n of d.nodes) if (n.fill && n.fill !== 'papel') out.push(`  style ${ids.get(n.id)} fill:${fillHex(n.fill)},color:${inkHex(n.fill)}`);
  return out.join('\n');
}
const unText = (s) => String(s).trim().replace(/^"([\s\S]*)"$/, '$1').replace(/<br\s*\/?>/gi, '\n').replace(/#quot;/g, '"').replace(/#35;/g, '#').replace(/^`([\s\S]*)`$/, '$1').trim();
const OPEN = [['(((', ')))', 'ellipse'], ['((', '))', 'ellipse'], ['([', '])', 'ellipse'], ['[[', ']]', 'rect'], ['[(', ')]', 'rect'], ['[/', '/]', 'rect'], ['[\\', '\\]', 'rect'], ['{{', '}}', 'diamond'], ['[', ']', 'rect'], ['(', ')', 'rect'], ['{', '}', 'diamond'], ['>', ']', 'note']];
const ID_RE = /^[\p{L}\p{N}_$][\p{L}\p{N}_$.]*/u;
function splitStatements(line) {
  const out = []; let cur = '', qt = false, depth = 0;
  for (const ch of line) {
    if (ch === '"') qt = !qt;
    if (!qt) { if ('[({'.includes(ch)) depth++; else if ('])}'.includes(ch)) depth = Math.max(0, depth - 1); else if (ch === ';' && !depth) { out.push(cur); cur = ''; continue; } }
    cur += ch;
  }
  out.push(cur); return out.map((s) => s.trim()).filter(Boolean);
}
// Lee un flowchart / graph de Mermaid (TD, TB, LR, RL, BT) con nodos [], {}, (( )), ( ), ([ ]), >] y aristas -->, ---, -.->, ==> con etiqueta.
// Devuelve el diagrama ya ordenado, o null si no es un flowchart.
export function fromMermaid(src, { measure = approxMeasure, layout = true } = {}) {
  const lines = String(src || '').replace(/%%.*$/gm, '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const head = /^(flowchart|graph)\b\s*(TD|TB|LR|RL|BT)?\s*;?\s*(.*)$/i.exec(lines[0]); if (!head) return null;
  const d = empty(/^(LR|RL)$/i.test(head[2] || '') ? 'LR' : 'TD');
  const by = new Map(), fills = new Map();
  const node = (id, text, type) => {
    let n = by.get(id);
    if (!n) { n = { id, type: type || 'rect', x: 0, y: 0, w: 0, h: 0, text: text ?? id, fill: 'papel' }; by.set(id, n); d.nodes.push(n); }
    else if (type) { n.type = type; n.text = text; }
    return n;
  };
  const parseRef = (s, i) => {
    while (s[i] === ' ') i++;
    const m = ID_RE.exec(s.slice(i)); if (!m) return null;
    let id = m[0]; i += id.length;
    // un id que termina en «-» no existe en Mermaid; el «.» final es parte de -.->
    while (id.endsWith('.')) { id = id.slice(0, -1); i--; }
    for (const [o, c, type] of OPEN) {
      if (!s.startsWith(o, i)) continue;
      let j = i + o.length, text;
      if (s[j] === '"') { const k = s.indexOf('"', j + 1); if (k < 0) return null; text = s.slice(j, k + 1); j = k + 1; const e = s.indexOf(c, j); if (e < 0) return null; j = e + c.length; }
      else { const e = s.indexOf(c, j); if (e < 0) return null; text = s.slice(j, e); j = e + c.length; }
      i = j; const cm = /^:::[\w-]+/.exec(s.slice(i)); if (cm) i += cm[0].length;
      return { id, text: unText(text), type, i };
    }
    const cm = /^:::[\w-]+/.exec(s.slice(i)); if (cm) i += cm[0].length;
    return { id, i };
  };
  const parseGroup = (s, i) => { const refs = []; for (;;) { const r = parseRef(s, i); if (!r) break; refs.push(r); i = r.i; const m = /^\s*&\s*/.exec(s.slice(i)); if (!m) break; i += m[0].length; } return refs.length ? { refs, i } : null; };
  const LINKS = [
    /^\s*<?(?:--|==|-\.)\s+(?!>)([^|]+?)\s+(?:-{2,}|={2,}|\.+-)([>ox]?)/, // A -- texto --> B
    /^\s*<?(-{2,}|={2,}|-\.+-)([>ox]?)\s*\|([^|]*)\|/, // A -->|texto| B
    /^\s*<?(-{2,}|={2,}|-\.+-)([>ox]?)/, // A --> B
  ];
  const parseLink = (s, i) => {
    const rest = s.slice(i);
    let m = LINKS[0].exec(rest); if (m) return { label: unText(m[1]), head: Boolean(m[2]), i: i + m[0].length };
    m = LINKS[1].exec(rest); if (m) return { label: unText(m[3]), head: Boolean(m[2]), i: i + m[0].length };
    m = LINKS[2].exec(rest); if (m) return { label: '', head: Boolean(m[2]), i: i + m[0].length };
    return null;
  };
  const body = [...(head[3] ? [head[3]] : []), ...lines.slice(1)];
  let eid = 0;
  for (const raw of body) for (const st of splitStatements(raw)) {
    if (/^(subgraph|end\b|classDef|class\s|click\s|linkStyle|direction\s)/i.test(st)) continue;
    const sm = /^style\s+(\S+)\s+(.*)$/i.exec(st); if (sm) { const fm = /fill:\s*(#[0-9a-f]{3,6})/i.exec(sm[2]); if (fm) fills.set(sm[1], fm[1]); continue; }
    let g = parseGroup(st, 0); if (!g) continue;
    let prev = g.refs.map((r) => node(r.id, r.text, r.type)); let i = g.i;
    for (;;) {
      const l = parseLink(st, i); if (!l) break;
      const nx = parseGroup(st, l.i); if (!nx) break;
      const cur = nx.refs.map((r) => node(r.id, r.text, r.type));
      for (const a of prev) for (const b of cur) d.edges.push({ id: 'e' + ++eid, from: a.id, to: b.id, label: l.label, style: '', head: l.head, fromPort: '', toPort: '' });
      prev = cur; i = nx.i;
    }
  }
  if (!d.nodes.length) return null;
  for (const [id, hex] of fills) if (by.has(id)) by.get(id).fill = fillKey(hex);
  for (const n of d.nodes) Object.assign(n, fitSize(n.type, n.text, measure));
  return layout ? autoLayout(d, d.dir) : d;
}

// ---------------- plantillas de arranque ----------------
const TPL_SRC = {
  flujo: `flowchart TD
  A(("Llega el pedido")) --> B{"¿Está en el plan?"}
  B -->|Sí| C["Se ejecuta"]
  B -->|No| D["Se escala al CEO"]
  C --> E["QA del COO"]
  E --> F(("Entrega al cliente"))
  style A fill:#36271b
  style F fill:#36271b
  style B fill:#e8dccb
  style D fill:#ecd2c2`,
  secuencia: `flowchart LR
  C(("Cliente")) -->|Pide un cambio| S["Secretaria"]
  S -->|Escala| O["COO"]
  O -->|Respuesta con fecha| C2(("Cliente"))
  N>"La secretaria nunca promete precio, fecha ni alcance"]
  style C fill:#795c45
  style C2 fill:#795c45
  style N fill:#ecd2c2`,
  mapa: `flowchart LR
  R(("Inherent")) --> M["Marketing"] & G["Growth"] & O["Operaciones"]
  M --> M1["Contenido"] & M2["Pauta"]
  G --> G1["Oferta"] & G2["Conversión"]
  O --> O1["SOPs"] & O2["Calendario"]
  style R fill:#36271b
  style M fill:#e8dccb
  style G fill:#dcdcc6
  style O fill:#ecd2c2`,
  tiempo: `flowchart LR
  A["Día 1<br>Reunión"] --> B["Días 1-3<br>Plan"] --> C["Días 6-11<br>Producción"] --> D["Días 12-15<br>Montaje"] --> E(("Día 20<br>Presentación"))
  style A fill:#e8dccb
  style E fill:#36271b`,
  org: `flowchart TD
  CEO["CEO"] --> COO["COO"]
  COO --> P["Producción"] & E["Edición"] & OP["Operador de agentes"]
  style CEO fill:#36271b
  style COO fill:#795c45`,
};
export const TEMPLATES = { flujo: 'Flujo', secuencia: 'Secuencia', mapa: 'Mapa mental', tiempo: 'Línea de tiempo', org: 'Organigrama' };
export const template = (k, measure) => normalize(fromMermaid(TPL_SRC[k] || TPL_SRC.flujo, { measure }));
export const templateMermaid = (k) => TPL_SRC[k] || TPL_SRC.flujo;

// ---------------- operaciones de edición (puras) ----------------
export function align(d, ids, how) {
  const ns = d.nodes.filter((n) => ids.includes(n.id)); if (ns.length < 2) return d;
  const x0 = Math.min(...ns.map((n) => n.x)), x1 = Math.max(...ns.map((n) => n.x + n.w)), y0 = Math.min(...ns.map((n) => n.y)), y1 = Math.max(...ns.map((n) => n.y + n.h));
  for (const n of ns) {
    if (how === 'l') n.x = x0; else if (how === 'r') n.x = x1 - n.w; else if (how === 'c') n.x = (x0 + x1) / 2 - n.w / 2;
    else if (how === 't') n.y = y0; else if (how === 'b') n.y = y1 - n.h; else if (how === 'm') n.y = (y0 + y1) / 2 - n.h / 2;
  }
  return d;
}
export function distribute(d, ids, axis) {
  const ns = d.nodes.filter((n) => ids.includes(n.id)); if (ns.length < 3) return d;
  const H = axis === 'h', p = H ? 'x' : 'y', s = H ? 'w' : 'h';
  ns.sort((a, z) => a[p] - z[p]);
  const start = ns[0][p], end = Math.max(...ns.map((n) => n[p] + n[s])), total = ns.reduce((a, n) => a + n[s], 0);
  const gap = (end - start - total) / (ns.length - 1); let t = start;
  for (const n of ns) { n[p] = Math.round(t); t += n[s] + gap; }
  return d;
}
// Duplicar: copia los nodos y las aristas que quedan adentro de la selección.
export function duplicate(d, ids, off = GRID * 2) {
  const map = new Map(), added = [];
  for (const n of d.nodes.filter((x) => ids.includes(x.id))) { const id = nextId(d, 'n'); const c = { ...n, id, x: n.x + off, y: n.y + off }; map.set(n.id, id); d.nodes.push(c); added.push(id); }
  for (const e of d.edges.filter((x) => map.has(x.from) && map.has(x.to))) d.edges.push({ ...e, id: nextId(d, 'e'), from: map.get(e.from), to: map.get(e.to) });
  return added;
}
export function removeNodes(d, ids) {
  const s = new Set(ids); d.nodes = d.nodes.filter((n) => !s.has(n.id)); d.edges = d.edges.filter((e) => !s.has(e.from) && !s.has(e.to)); return d;
}

// Del documento de la Library: el JSON guardado; si solo hay Mermaid (los diagramas viejos), se importa.
// Si alguien cambió el Mermaid por fuera (el MCP, a mano), el Mermaid manda: el JSON guardado ya no le corresponde.
export function fromDoc(doc, opts) {
  const body = String(doc?.body || '').trim();
  if (doc?.diagram && Array.isArray(doc.diagram.nodes)) { const dg = normalize(doc.diagram); if (!body || toMermaid(dg).trim() === body) return dg; }
  const m = fromMermaid(body, opts); if (m) return normalize(m);
  return doc?.diagram && Array.isArray(doc.diagram.nodes) && !/^\s*(sequenceDiagram|mindmap|timeline|classDiagram|stateDiagram|erDiagram|gantt|pie|journey)/.test(body) ? normalize(doc.diagram) : null;
}
