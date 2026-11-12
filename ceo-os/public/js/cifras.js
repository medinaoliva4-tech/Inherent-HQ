// Fila de cifras: el patrón para métricas. Un solo contenedor con una fila horizontal; por métrica, la cifra grande, su delta
// y una sparkline, sin marco propio. Reemplaza la rejilla de tarjetas de KPI (.grid.g4 > .card). Ver docs/patrones-de-presentacion.md.
// Puro (sin DOM): corre en Node (scripts/test-tablas.mjs). Estilos: tablas.css («cfr-»).
//
// cifrasHtml([{ t: 'Entró', v: 'Q27,720', delta?: { v: 12 (en %), bueno?: 'sube' | 'baja', texto? }, serie?: [n…], tono?: 'ok'|'bad'|'warn',
//               ayuda?: 'title', act?, data? }], { etiqueta })
import { sparkline } from './visual.js';
import { aTexto } from './tabla.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const core = typeof document === 'undefined' ? null : await import('./core.js');
const out = (s) => (core ? core.raw(s) : s);

// El delta: «↑ 12%» o «↓ 4%». Es bueno o malo según hacia dónde debe ir la métrica (bueno: 'sube' por defecto; los costos, 'baja').
export function deltaDe(d) {
  if (!d || d.v == null || !Number.isFinite(+d.v)) return null;
  const n = Math.round(+d.v), sube = n > 0, igual = n === 0;
  const bien = igual ? null : (d.bueno || 'sube') === 'sube' ? sube : !sube;
  return { flecha: igual ? '' : sube ? '↑' : '↓', texto: `${igual ? 'igual' : Math.abs(n) + '%'}${d.texto ? ' ' + d.texto : ''}`.trim(), tono: bien == null ? '' : bien ? 'ok' : 'bad' };
}
export function cifrasHtml(items, { etiqueta = 'Cifras', clase = '' } = {}) {
  const xs = (items || []).filter(Boolean);
  return out(`<dl class="cfr${clase ? ' ' + esc(clase) : ''}" aria-label="${esc(etiqueta)}">${xs.map((x) => {
    const d = deltaDe(x.delta), sp = x.serie && x.serie.some((v) => +v) ? aTexto(sparkline(x.serie, { ancho: 72, alto: 22, label: `Tendencia de ${typeof x.t === 'string' ? x.t : ''}` })) : '';
    const data = Object.entries(x.data || {}).filter(([k]) => /^[a-z][a-z0-9-]*$/.test(k)).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
    const val = `<dd class="cfr-v${x.tono ? ' cfr-' + esc(x.tono) : ''}">${aTexto(x.v ?? '—')}</dd>`;
    return `<div class="cfr-i"${x.ayuda ? ` title="${esc(x.ayuda)}"` : ''}><dt>${x.act ? `<button type="button" class="cfr-b" data-act="${esc(x.act)}"${data}>${aTexto(x.t)}</button>` : aTexto(x.t)}</dt>${val}`
      + `${d || sp || x.nota ? `<dd class="cfr-m">${d ? `<span class="cfr-d ${d.tono}">${d.flecha} ${esc(d.texto)}</span>` : ''}${x.nota ? `<span class="cfr-n">${aTexto(x.nota)}</span>` : ''}${sp}</dd>` : ''}</div>`;
  }).join('')}</dl>`);
}
