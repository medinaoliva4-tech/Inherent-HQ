// App 02 · Estrategia en vivo: el panel visual junto al chat. Se lee de arriba hacia abajo: la meta, el avance de los 5 pasos y una
// sección por paso (con las herramientas de Hormozi que usa). Lo recién cambiado se marca «Actualizado ahora».
// Los supuestos subrayados se tocan para cambiarlos (data-act="viva-edit"); el resto se llena desde el chat.
import { html } from './core.js';
import { PASOS, cascada, avance } from './estrategia-viva.js';
import { rutaBloque } from './herramientas.js';

const RECIENTE = 3 * 60_000;
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const FMT = { reel: 'Reel', story: 'Story', carrusel: 'Carr.', estatico: 'Estático', video: 'Video', live: 'Live' };

const corto = (n) => (n == null ? '—' : n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}k` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : `${Math.round(n)}`);
const dinero = (n, m = 'Q') => (n == null ? '—' : `${m}${n >= 1e4 ? corto(n) : Math.round(n).toLocaleString('es-GT')}`);
const pct = (x) => (x == null ? null : `${+(x * 100).toFixed(1)}%`);
const unoDe = (x) => (x == null ? null : x >= 0.1 ? `1 de cada ${Math.round(1 / x)}` : `${+(x * 100).toFixed(1)} de cada 100`);

export function panelViva({ v = {}, data, bid, editable, esCeo, aprobada }) {
  const M = v.meta?.moneda || 'Q', c = cascada(v), { listo, ahora, n } = avance(v);
  const nuevo = (k) => { const t = v.actualizado?.[k]; return t && Date.now() - Date.parse(t) < RECIENTE ? 'fresh' : ''; };
  // Un supuesto que se toca para cambiarlo.
  const sup = (campo, valor, vacio = 'sin dato') => (editable ? html`<button type="button" class="ev-sup ${valor == null ? 'falta' : ''}" data-act="viva-edit" data-campo="${campo}">${valor ?? `⚠️ ${vacio}`}</button>` : html`<span class="ev-sup ${valor == null ? 'falta' : ''}">${valor ?? `⚠️ ${vacio}`}</span>`);
  const hz = (ids) => html`<div class="ev-hz">${ids.map((id) => { const b = data.bloques.find((x) => x.id === id); if (!b) return ''; const off = b.limite && /no se cambia|fuera/i.test(`${b.limite.titulo} ${b.limite.texto}`);
    return html`<a class="ev-tool ${b.id === bid ? 'on' : ''} ${off ? 'off' : ''}" href="${rutaBloque(data.slug, b.id)}" title="${b.limite ? `${b.limite.titulo}: ${b.limite.texto}` : `Hormozi · ${b.pide}`}"><i class="${b.estado === 'aprobado' ? 'ok' : b.estado === 'trabajo' ? 'w' : ''}"></i>Hormozi · ${b.nombre}</a>`; })}</div>`;
  const sec = (p, cuerpo, k = p.id) => html`<section class="ev-sec ${nuevo(k)} ${ahora === p.id ? 'now' : ''}"><header><span class="lbl">${p.n} · ${p.largo}</span>${listo[p.id] ? html`<span class="ev-ok">✓</span>` : ''}</header>${cuerpo}${p.hz.length ? hz(p.hz) : ''}</section>`;
  const max = c.ventas || 1, i = v.inversa || {}, a = v.analisis || {}, m = v.metodologia || {}, ct = v.contenido || {}, pa = v.pauta || {}, rm = v.roadmap || {};
  const fila = (num, w, txt, cls = '') => html`<div class="ev-fr"><b>${num}</b><div class="ev-bar ${cls}" style="width:${Math.max(18, Math.min(100, w))}%">${txt}</div></div>`;
  const P = Object.fromEntries(PASOS.map((p) => [p.id, p]));

  return html`<div class="evv">
    <div class="ev-hero"><div><span class="lbl">La meta</span>
      <h2 class="ev-meta">${editable ? html`<button type="button" class="ev-big" data-act="viva-edit" data-campo="meta">${v.meta?.objetivo ? html`${v.meta.actual ? html`${dinero(v.meta.actual, M)} <span>→</span> ` : ''}${dinero(v.meta.objetivo, M)}` : 'Define la meta'}</button>` : v.meta?.objetivo ? dinero(v.meta.objetivo, M) : 'Sin meta'} <small>/ mes${v.meta?.meses ? ` en ${v.meta.meses} meses` : ''}</small></h2></div>
      <div class="ev-prog" aria-label="${n} de 5 pasos listos">${PASOS.map((p) => html`<span class="${listo[p.id] ? 'ok' : ahora === p.id ? 'now' : ''}"><i></i>${p.nombre}</span>`)}</div></div>

    ${sec(P.contexto, v.contexto?.conclusion ? html`<p class="ev-concl"><b>${v.contexto.conclusion}</b>${v.contexto.detalle ? html` ${v.contexto.detalle}` : ''}</p>` : html`<p class="ev-vacio">Cuéntale a Strategy del negocio o adjunta documentos de la Library: aquí queda la conclusión y la etapa.</p>`)}

    ${sec(P.analisis, html`<div class="ev-g3">${[['MUST BE TRUE', a.mbt], ['UNFAIR', a.unfair], ['GO GET', a.goget]].map(([l, t]) => html`<div class="ev-c ${t ? '' : 'vac'}"><span class="lbl">${l}</span>${t || 'Falta'}</div>`)}</div>
      ${a.trabado ? html`<p class="ev-note"><b>Dónde está trabado: ${a.trabado}.</b> ${a.porque || ''}</p>` : ''}`)}

    ${sec(P.inversa, html`<div class="ev-fun">
        ${fila(dinero(c.ventas, M), 100, 'ventas al mes', 'k')}
        ${fila(corto(c.clientes), 86, html`clientes · ticket ${sup('inversa.ticket', i.ticket != null ? dinero(i.ticket, M) : null)}`)}
        ${fila(corto(c.conversaciones), 72, html`conversaciones · cierra ${sup('inversa.cierre', unoDe(i.cierre))}`)}
        ${fila(corto(c.visitas), 58, html`visitas · escribe ${sup('inversa.conversion', unoDe(i.conversion))}`, i.conversion == null ? 'w' : '')}
        ${fila(corto(c.alcance), 44, html`alcance · visita ${sup('inversa.visita', unoDe(i.visita))}`, i.visita == null ? 'w' : '')}</div>
      ${(v.riesgos || []).length ? html`<div class="ev-real"><span class="lbl">Para que sea real</span>${v.riesgos.map((r) => html`<div class="ev-ck ${r.estado}"><i></i><div>${r.texto}${r.nota ? html`<em>${r.nota}</em>` : ''}</div></div>`)}</div>` : ''}`)}

    <section class="ev-sec ${nuevo('contenido') || nuevo('pauta')}"><header><span class="lbl">De dónde sale el alcance</span>${c.cubre != null ? html`<span class="mut sm">cubre ${Math.round(c.cubre * 100)}%</span>` : ''}</header>
      <div class="ev-mix"><div class="ev-c"><b class="ev-n">${sup('contenido.piezas', ct.piezas != null ? `${ct.piezas} piezas` : null)} <small>/ mes</small></b><span class="mut sm">${c.deContenido != null ? `${corto(c.deContenido)} de alcance` : ''} · ${sup('contenido.alcance_pieza', ct.alcance_pieza != null ? `${corto(ct.alcance_pieza)} por pieza` : null)}</span>
        <div class="ev-week">${DIAS.map((d) => html`<i>${d}</i>`)}${Array.from({ length: 7 }, (_, k) => { const f = ct.semana?.[k] || ''; return html`<span class="${f === 'reel' || f === 'video' ? 'r' : f ? 's' : ''}">${FMT[f] || ''}</span>`; })}</div>${ct.nota ? html`<span class="mut sm">${ct.nota}</span>` : ''}</div>
        <div class="ev-c"><b class="ev-n">${sup('pauta.mensual', pa.mensual != null ? dinero(pa.mensual, M) : null)} <small>/ mes</small></b><span class="mut sm">${c.dePauta != null ? `${corto(c.dePauta)} de alcance · ` : ''}CPM ${sup('pauta.cpm', pa.cpm != null ? dinero(pa.cpm, M) : null)}</span>${pa.nota ? html`<span class="mut sm">${pa.nota}</span>` : ''}<span class="mut sm">Aparte del fee: la pauta la paga el cliente.</span></div></div></section>

    ${sec(P.metodologia, html`${m.oferta ? html`<div class="ev-c"><span class="lbl">Oferta</span>${m.oferta}</div>` : ''}
      <div class="ev-g4">${[['Atracción', 'atraccion'], ['Upsell', 'upsell'], ['Downsell', 'downsell'], ['Continuidad', 'continuidad']].map(([l, k]) => html`<div class="ev-c ${m.modelo?.[k] ? '' : 'vac'}"><span class="lbl">${l}</span>${m.modelo?.[k] || 'Falta'}</div>`)}</div>
      ${m.canales?.length ? html`<div class="ev-chips">${m.canales.map((x) => html`<span>${x}</span>`)}</div>` : ''}`)}

    ${sec(P.entrega, rm.filas?.length ? html`<div class="ev-rm"><div></div>${['Mes 1–3', '4–6', '7–9', '10–12'].map((t) => html`<div class="h">${t}</div>`)}
        ${rm.filas.map((f) => html`<div class="d">${f.area}</div>${f.celdas.map((x, k) => html`<div>${x ? html`<span class="${k === 0 && f.area === rm.filas[0].area ? 'k' : ''}">${x}</span>` : ''}</div>`)}`)}
        ${rm.hitos?.some((x) => x != null) ? html`<div class="d">Meta</div>${rm.hitos.map((x) => html`<div><b>${x != null ? dinero(x, M) : ''}</b></div>`)}` : ''}</div>
        <div class="ev-end">${aprobada ? html`<span class="ev-aprob">✓ Aprobada por el CEO</span>${esCeo ? html`<button type="button" class="btn ghost xs" data-act="viva-aprobar" data-no="1">Reabrir</button>` : ''}` : esCeo ? html`<button type="button" class="btn xs" data-act="viva-aprobar">Aprobar la estrategia</button>` : html`<span class="mut sm">El CEO la aprueba antes de pasar a los departamentos.</span>`}</div>`
      : html`<p class="ev-vacio">Cuando los pasos estén listos, Strategy arma el roadmap por trimestres (en el Tablero de Estrategia: «✦ Agregar roadmap»).</p>`, 'roadmap')}
  </div>`;
}
