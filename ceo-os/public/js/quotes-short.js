// La tabla corta de cotizaciones (Servicios y Clientes → Servicio): las últimas, con su estado y total.
// «Ver todas» lleva a Ventas → Cotizaciones.
import { html, Q, fdate } from './core.js';

const QSTATUS = { Borrador: 'amber', Enviada: 'blue', Aceptada: 'green', Rechazada: 'red' };
const totalOf = (q) => (q.items || []).reduce((a, i) => a + (+i.qty || 0) * (+i.price || 0), 0) * (1 - (+q.discount_pct || 0) / 100);
export const quotesBase = () => '#/sales/quotes';

export function quotesShort(quotes, me, { n = 5, title = 'Cotizaciones', sub = 'Las más recientes', empty = 'Todavía no hay cotizaciones. Se arman en Comercial, desde un lead o desde un paquete.' } = {}) {
  const base = quotesBase(me), list = [...(quotes || [])].sort((a, z) => String(z.date || '').localeCompare(String(a.date || ''))).slice(0, n);
  return html`<section class="sp-panel qshort"><div class="wkhead"><div><h3>${title}</h3><span class="mut sm">${sub}</span></div><div class="sp"></div><a class="sm" href="${base}" style="color:var(--ink2);text-decoration:none">Ver todas →</a></div>
    ${list.length ? list.map((q) => html`<a class="wkrow" href="${base}/${q.id}"><span class="wkt">${fdate(q.date)}</span><span class="grow" style="min-width:0"><b style="font-weight:500">${q.number || 'Cotización'}</b><span class="mut sm"> · ${q.client || 'Sin cliente'}</span></span><span class="chip sm2 ${QSTATUS[q.status] || ''}">${q.status || 'Borrador'}</span><span class="sm" style="min-width:76px;text-align:right">${(q.items || []).length ? Q(totalOf(q)) : '—'}</span></a>`)
    : html`<div class="mut sm" style="padding:8px 0">${empty}</div>`}</section>`;
}
