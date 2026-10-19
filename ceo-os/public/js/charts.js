// Gráficas simples en SVG, con los colores de la marca. Sin librerías: barras, números y una línea de tiempo del mes.
// Nunca inventan datos: si todo está en cero, lo dicen.
import { html, raw, esc, fdate } from './core.js';

export const PAL = { ink: '#2c1f16', brown: '#795c45', sand: '#a18770', light: '#d9cbbb', red: '#654c38', lime: '#efe7dc' };

// Una fila de números: [[etiqueta, valor, color?]]. Si todos son cero, no se pinta nada (sin ruido).
export const kpis = (list, { always = false } = {}) => (!always && list.every(([, v]) => !v) ? '' : html`<div class="wkkpis">${list.map(([l, v, c]) => html`<div class="wkkpi"><span class="lbl">${l}</span><b style="${c ? `color:${c}` : ''}">${v}</b></div>`)}</div>`);

// Barras por grupo: groups = [{ label, values: [n, n…] }], series = [{ name, c }]. Apiladas si stack; si no, lado a lado.
export function bars(groups, series, { h = 150, stack = false, empty = 'Sin datos todavía' } = {}) {
  const tot = (g) => (stack ? g.values.reduce((a, v) => a + (+v || 0), 0) : Math.max(...g.values.map((v) => +v || 0)));
  const max = Math.max(1, ...groups.map(tot));
  if (!groups.some((g) => g.values.some((v) => +v > 0))) return html`<div class="empty sm" style="padding:16px">${empty}</div>`;
  const W = 100 * Math.max(1, groups.length), P = { t: 10, b: 4 }, H = h;
  const gw = W / groups.length, bw = stack ? gw * 0.5 : (gw * 0.6) / series.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px;display:block">`;
  [0.5, 1].forEach((f) => (s += `<line x1="0" x2="${W}" y1="${P.t + (1 - f) * (H - P.t - P.b)}" y2="${P.t + (1 - f) * (H - P.t - P.b)}" stroke="rgba(44,31,22,.07)"/>`));
  groups.forEach((g, i) => {
    let y0 = H - P.b;
    series.forEach((se, k) => {
      const v = +g.values[k] || 0, bh = (v / max) * (H - P.t - P.b);
      const x = stack ? i * gw + (gw - bw) / 2 : i * gw + gw * 0.2 + k * bw;
      const y = stack ? y0 - bh : H - P.b - bh;
      s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${se.c}"><title>${esc(g.label)} · ${esc(se.name)}: ${v}</title></rect>`;
      if (stack) y0 -= bh;
    });
  });
  s += '</svg>';
  return html`<div class="barchart">${raw(s)}
    <div class="barlabels" style="grid-template-columns:repeat(${groups.length},1fr)">${groups.map((g) => html`<span>${g.label}</span>`)}</div>
    <div class="barlegend">${series.map((se) => html`<span><i style="background:${se.c}"></i>${se.name}</span>`)}</div></div>`;
}

// Barras horizontales con porcentaje: rows = [{ label, pct, text, c }]. pct null = sin dato (se dice por qué en text).
export const hbars = (rows, { empty = 'Sin datos todavía' } = {}) => (!rows.length ? html`<div class="empty sm" style="padding:16px">${empty}</div>`
  : html`<div class="hbars">${rows.map((r) => html`<div class="hbar"><span class="hl">${r.label}</span><div class="gbar">${r.pct == null ? '' : html`<i style="width:${Math.max(0, Math.min(100, r.pct))}%;background:${r.c || PAL.brown}"></i>`}</div><span class="ht ${r.pct == null ? 'mut' : ''}">${r.text}</span></div>`)}</div>`);

// La línea de tiempo del mes: los días 1..N con marcas. marks = [{ day, label, c, done }]; hoy se marca solo.
export function monthStrip(month, marks, { today: T = '' } = {}) {
  const [y, m] = month.split('-').map(Number), days = new Date(y, m, 0).getDate(), td = T.slice(0, 7) === month ? +T.slice(8) : 0;
  const by = {}; for (const k of marks) (by[k.day] ||= []).push(k);
  return html`<div class="mstrip" style="grid-template-columns:repeat(${days},1fr)">${Array.from({ length: days }, (_, i) => { const d = i + 1, l = by[d] || [];
    return html`<div class="md ${d === td ? 'today' : ''} ${d < td ? 'past' : ''}" title="${l.map((k) => `${fdate(`${month}-${String(d).padStart(2, '0')}`)} · ${k.label}`).join('\n')}"><span class="n">${d}</span>${l.slice(0, 3).map((k) => html`<i style="background:${k.done ? PAL.ink : k.c || PAL.sand}"></i>`)}</div>`; })}</div>`;
}
