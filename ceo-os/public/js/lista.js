// Lista densa de una línea: el patrón para tareas, entregables, pasos, seguimientos y facturas por cobrar. Ver docs/patrones-de-presentacion.md.
// Cada renglón: estado · título · dueño · fecha (+ un extra al final: un monto, un chip o un botón), agrupado con encabezados.
// Un renglón con `act` es un botón (abre el detalle con el manejador data-act de la pantalla); sin `act` es texto.
// Puro (sin DOM): corre en Node (scripts/test-tablas.mjs). Estilos: tablas.css («lsd-»).
//
// listaHtml({
//   etiqueta: 'Seguimiento vencido',                        // aria-label de la lista
//   grupos: [{ t: 'Vencido', items: [...] }] | items: [...],
//   renglon: (x) => ({ estado?: { tono: 'caido'|'medio'|'vivo'|'info'|'off', texto }, titulo, sub?, dueno?, fecha?, fechaTono?: 'late', extra?, act?, id?, data? }),
//   vacio?: { icono, titulo, linea },                       // visual.js › vacio (compacto)
//   max?: 30,                                               // tope de renglones por grupo («y N más»)
// })
import { vacio } from './visual.js';
import { aTexto } from './tabla.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const core = typeof document === 'undefined' ? null : await import('./core.js');
const out = (s) => (core ? core.raw(s) : s);
const TONOS = ['vivo', 'medio', 'caido', 'off', 'info'];

export function renglonHtml(r) {
  const tono = TONOS.includes(r.estado?.tono) ? r.estado.tono : null;
  const data = Object.entries(r.data || {}).filter(([k]) => /^[a-z][a-z0-9-]*$/.test(k)).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  const cuerpo = `${tono ? `<span class="lsd-e"><i class="vz-punto vz-p-${tono}" aria-hidden="true"></i>${r.estado.texto ? `<span class="lsd-et">${esc(r.estado.texto)}</span>` : ''}</span>` : ''}`
    + `<span class="lsd-ti"><b>${aTexto(r.titulo)}</b>${r.sub ? `<small>${aTexto(r.sub)}</small>` : ''}</span>`
    + `${r.dueno ? `<span class="lsd-d">${aTexto(r.dueno)}</span>` : ''}${r.fecha ? `<span class="lsd-f${r.fechaTono === 'late' ? ' late' : ''}">${aTexto(r.fecha)}</span>` : ''}`;
  const extra = r.extra ? `<span class="lsd-x">${aTexto(r.extra)}</span>` : '';
  // El renglón entero es el botón; lo que va al final (un botón propio) queda fuera para no anidar botones.
  return r.act
    ? `<li class="lsd-r lsd-ab"><button type="button" class="lsd-b" data-act="${esc(r.act)}"${r.id != null ? ` data-id="${esc(r.id)}"` : ''}${data}>${cuerpo}</button>${extra}</li>`
    : `<li class="lsd-r"><div class="lsd-b">${cuerpo}</div>${extra}</li>`;
}
export function listaHtml({ etiqueta = 'Lista', grupos, items, renglon, vacio: v, max = 0 } = {}) {
  const gs = grupos || [{ t: '', items: items || [] }];
  if (!gs.some((g) => (g.items || []).length)) return out(v ? `<div class="lsd-vacio">${aTexto(vacio({ compacto: true, icono: 'inbox', ...v }))}</div>` : '');
  return out(`<div class="lsd" role="group" aria-label="${esc(etiqueta)}">${gs.filter((g) => (g.items || []).length).map((g) => {
    const lista = max ? g.items.slice(0, max) : g.items, resto = g.items.length - lista.length;
    return `${g.t ? `<h3 class="lsd-h">${esc(g.t)} <span>${g.items.length}</span></h3>` : ''}<ul class="lsd-u" role="list">${lista.map((x) => renglonHtml(renglon(x))).join('')}${resto > 0 ? `<li class="lsd-mas">y ${resto} más</li>` : ''}</ul>`;
  }).join('')}</div>`);
}
