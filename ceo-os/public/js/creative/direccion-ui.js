// Vista del Creative Direction Lab (herramienta creative-direction-lab de Creative): el brief del ciclo a la izquierda, el insight y la
// big idea arriba y de 3 a 5 conceptos lado a lado. Acciones propias: Elegir, Descartar (se marca, no se borra), «Convertir en piezas»
// (las mismas rutas de «Pasar a Creatividad» y «Enviar a Ideas»), modo Deck 16:9 → PDF (jsPDF) y links a Design Studio y Production Brief.
// Existe para que tool-shell.js pinte el centro con un solo contrato (nuevo, pintar, resumen). Pinta con html`…` (todo se escapa), lee con
// inputs nativos y avisa cada cambio con el contenido completo y limpio. El deck no lleva costos ni notas internas.
import { html, mount, api, col, ico, toast, confirmAsk } from '../core.js';
import { SIN_DATOS, corta } from '../consulting/marcos.js';
import { brandBrief } from '../brand-brief.js';
import { pasarPlan } from '../plan-mes-ui.js';
import { idPlan } from '../plan-mes.js';
import { rutaHerramienta } from '../herramientas.js';
import { vacio, limpiar, conceptoVacio, ideaDeConcepto, MIN_CONCEPTOS, MAX_CONCEPTOS, TECNICAS } from './direccion.js';

const FORMATOS = ['Reel', 'Carrusel', 'Story', 'Estático', 'TikTok', 'YouTube'];
const SD = { insight: 'sale del brief del ciclo y del lenguaje del comprador', big: 'sale de aplicar una técnica al insight', conceptos: 'salen de la big idea: 3 a 5, distintos entre sí' };
const clon = (x) => { try { return structuredClone(x && typeof x === 'object' ? x : {}); } catch { return {}; } };
const mesDe = (c) => c.mes || '';
const imgsTxt = (l) => l.map((i) => i + 1).join(', ');
const imgsLeer = (t) => String(t ?? '').split(/[,\s]+/).map((x) => Number(x) - 1).filter((n) => Number.isInteger(n) && n >= 0);
const sinEmoji = (s) => String(s ?? '').replace(/⚠️/g, 'SIN DATOS').replace(/[^\u0000-ÿ–—‘-”…€]/g, '');

// ---------- Deck 16:9 → PDF ----------
const loadJs = (src) => new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => ko(new Error('No pude cargar el generador de PDF')); document.head.appendChild(s); });
export async function deckPdf(contenido, nombre = 'Dirección creativa') {
  if (!window.jspdf) await loadJs('/vendor/jspdf.umd.min.js');
  const c = limpiar(contenido), W = 960, H = 540, M = 56, pdf = new window.jspdf.jsPDF({ unit: 'pt', format: [W, H], orientation: 'landscape' });
  let primera = true;
  const hoja = (kicker) => { if (!primera) pdf.addPage([W, H], 'landscape'); primera = false; pdf.setFillColor(250, 247, 242); pdf.rect(0, 0, W, H, 'F'); pdf.setTextColor(120, 98, 80); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text(sinEmoji(kicker).toUpperCase(), M, M); };
  const texto = (t, x, y, { size = 18, bold = false, ancho = W - 2 * M, color = [50, 38, 28], alto = 24 } = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(...color);
    const l = pdf.splitTextToSize(sinEmoji(t || SIN_DATOS), ancho); pdf.text(l, x, y); return y + l.length * alto;
  };
  hoja('Dirección creativa'); texto(c.campana.nombre || nombre, M, 200, { size: 44, bold: true, alto: 50 }); texto(c.campana.frase, M, 300, { size: 20 });
  hoja('Insight'); texto(c.insight, M, 160, { size: 28, alto: 36 });
  hoja('Big idea'); texto(c.big_idea, M, 160, { size: 32, bold: true, alto: 40 });
  for (const k of c.conceptos.filter((x) => !x.descartado)) {
    hoja(`Concepto${k.id === c.elegido ? ' · elegido' : ''}`);
    let y = texto(k.nombre, M, 110, { size: 30, bold: true, alto: 36 }) + 10;
    y = texto(k.idea, M, y, { size: 17, alto: 24 }) + 14;
    for (const [e, v] of [['Hook', k.hook], ['Técnica', k.tecnica], ['Formato', k.formato], ['Laya', k.laya]]) y = texto(`${e}: ${v || SIN_DATOS}`, M, y, { size: 14, alto: 20, color: [90, 72, 58] }) + 4;
  }
  pdf.save(`Dirección creativa - ${sinEmoji(c.campana.nombre) || 'concepto'}.pdf`);
}

// ---------- Piezas ----------
// Los slots del plan del mes que aún no tienen idea (las que ya la tienen no se duplican: el id de la pieza es fijo por slot).
async function cargarSlots(slug, mes) {
  const [e, todo] = await Promise.all([api(`plan/${encodeURIComponent(slug)}/${mes}`), col('content').list().catch(() => [])]);
  const conIdea = new Set(todo.filter((x) => x.kind === 'post' && x.slot?.plan === idPlan(slug, mes) && x.idea_chat).map((x) => x.slot?.id));
  return { e, slots: e.plan?.slots || [], conIdea };
}

// ---------- La vista ----------
const area = (k, v, o) => html`<textarea class="in" data-c="${k}" rows="${o.filas || 2}" maxlength="${o.max}" placeholder="${o.ph || ''}" aria-label="${o.label}">${v ?? ''}</textarea>`;
const campo = (k, v, o) => html`<input class="in" type="text" data-c="${k}" value="${v ?? ''}" maxlength="${o.max || 200}" placeholder="${o.ph || ''}" aria-label="${o.label}" autocomplete="off">`;
const ro = (v, sd) => html`<span class="dl-ro" data-vacio="${v ? 0 : 1}">${v || `${SIN_DATOS}: ${sd}`}</span>`;

function tarjeta(k, i, c, ed) {
  const elegido = c.elegido === k.id;
  return html`<article class="dl-con" data-i="${i}" data-elegido="${elegido ? 1 : 0}" data-descartado="${k.descartado ? 1 : 0}">
    <header class="dl-con-h"><b class="dl-con-n">${k.nombre || `Concepto ${i + 1}`}</b>${elegido ? html`<span class="chip">${ico('check', 12)} Elegido</span>` : ''}${k.descartado ? html`<span class="chip">Descartado</span>` : ''}</header>
    ${ed ? html`<label class="dl-f"><span class="lbl">Nombre</span>${campo(`conceptos.${i}.nombre`, k.nombre, { max: 80, label: 'Nombre del concepto' })}</label>
      <label class="dl-f"><span class="lbl">Idea</span>${area(`conceptos.${i}.idea`, k.idea, { max: 400, filas: 3, label: 'Idea del concepto', ph: 'En una o dos frases' })}</label>
      <label class="dl-f"><span class="lbl">Hook</span>${campo(`conceptos.${i}.hook`, k.hook, { max: 240, label: 'Hook' })}</label>
      <label class="dl-f"><span class="lbl">Técnica</span><input class="in" list="dl-tec" data-c="conceptos.${i}.tecnica" value="${k.tecnica}" maxlength="80" aria-label="Técnica"></label>
      <label class="dl-f"><span class="lbl">Formato</span><select class="in" data-c="conceptos.${i}.formato" aria-label="Formato"><option value="">—</option>${FORMATOS.map((f) => html`<option value="${f}" ${k.formato === f ? 'selected' : ''}>${f}</option>`)}</select></label>
      <label class="dl-f"><span class="lbl">Imágenes del moodboard <span class="mut sm">(números, máx. 3)</span></span><input class="in" type="text" data-c="@img.${i}" value="${imgsTxt(k.imagenes)}" maxlength="20" aria-label="Imágenes del moodboard" autocomplete="off"></label>
      <label class="dl-f"><span class="lbl">Laya</span>${campo(`conceptos.${i}.laya`, k.laya, { max: 300, label: 'Lo que mide Laya' })}</label>`
    : html`<p>${ro(k.idea, 'la idea del concepto')}</p><dl class="dl-dl"><dt>Hook</dt><dd>${ro(k.hook, 'el hook')}</dd><dt>Técnica</dt><dd>${ro(k.tecnica, 'la técnica')}</dd><dt>Formato</dt><dd>${ro(k.formato, 'el formato')}</dd><dt>Imágenes</dt><dd>${k.imagenes.length ? `#${imgsTxt(k.imagenes).replace(/, /g, ', #')}` : `${SIN_DATOS}: sale del Moodboard Studio`}</dd><dt>Laya</dt><dd>${ro(k.laya, 'lo que Laya mide')}</dd></dl>`}
    ${ed ? html`<footer class="dl-con-a"><button type="button" class="btn ghost xs" data-act="elegir" data-i="${i}" ${k.descartado ? 'disabled' : ''}>${elegido ? 'Quitar elección' : 'Elegir'}</button><button type="button" class="btn ghost xs" data-act="descartar" data-i="${i}">${k.descartado ? 'Recuperar' : 'Descartar'}</button>${elegido ? html`<button type="button" class="btn xs" data-act="convertir">Convertir en piezas ${ico('right', 12)}</button>` : ''}</footer>` : ''}
  </article>`;
}

export const vista = {
  nuevo(ctx) {
    const c = vacio(), cam = (Array.isArray(ctx?.entradas) ? ctx.entradas : []).filter((e) => e?.tool === 'campaign-architect').pop();
    if (cam) c.campana = limpiar({ campana: cam.contenido?.campana ?? cam.contenido }).campana;
    return c;
  },

  pintar(el, { contenido, editable, onCambio, ctx, me, slug } = {}) {
    const ed = Boolean(editable), c = limpiar(clon(contenido)), S = { panel: null, ocupado: false };
    const avisar = () => { if (typeof onCambio === 'function') onCambio(limpiar(clon(c))); };
    const nombreMarca = corta(ctx?.cliente?.nombre, 80) || slug;
    function draw() {
      const activos = c.conceptos.filter((k) => !k.descartado).length;
      mount(el, html`<div class="dl" data-editable="${ed ? 1 : 0}">
        <aside class="dl-brief" aria-label="Brief del ciclo"><h3 class="dl-t">${ico('file-text', 15)} Brief del ciclo</h3><div id="dl-brief"></div></aside>
        <div class="dl-main">
          <section class="dl-sec dl-camp"><span class="mut sm">Campaña</span> <b>${c.campana.nombre || `${SIN_DATOS}: llega de Campaign Architect (Enviar a Creative)`}</b>${c.campana.frase ? html` <span class="mut">· ${c.campana.frase}</span>` : ''}</section>
          <section class="dl-sec dl-arriba">
            <label class="dl-f"><span class="lbl">Insight</span>${ed ? area('insight', c.insight, { max: 500, filas: 3, label: 'Insight', ph: 'Lo que el comprador siente o dice, en sus palabras' }) : ro(c.insight, SD.insight)}</label>
            <label class="dl-f"><span class="lbl">Big idea</span>${ed ? area('big_idea', c.big_idea, { max: 300, filas: 3, label: 'Big idea', ph: 'Una frase' }) : ro(c.big_idea, SD.big)}</label>
          </section>
          <section class="dl-sec"><h3 class="dl-t">${ico('lightbulb', 15)} Conceptos <span class="mut sm">${activos} de ${MIN_CONCEPTOS} a ${MAX_CONCEPTOS}</span></h3>
            ${c.conceptos.length ? html`<div class="dl-cons">${c.conceptos.map((k, i) => tarjeta(k, i, c, ed))}</div>` : html`<p class="dl-ro" data-vacio="1">${SIN_DATOS}: ${SD.conceptos}</p>`}
            ${ed && c.conceptos.length < MAX_CONCEPTOS ? html`<button type="button" class="btn ghost sm" data-act="nuevo">${ico('plus', 13)} Concepto</button>` : ''}
            <datalist id="dl-tec">${TECNICAS.map((t) => html`<option value="${t}"></option>`)}</datalist></section>
          <section class="dl-sec dl-panel" id="dl-panel" ${S.panel ? '' : 'hidden'}></section>
          <footer class="dl-pie"><button type="button" class="btn ghost sm" data-act="deck" ${activos ? '' : 'disabled'}>${ico('download', 13)} Deck 16:9 (PDF)</button>
            <a class="btn ghost sm" href="${rutaHerramienta('creative', slug, 'design-studio')}">Enviar a Design Studio ${ico('right', 12)}</a>
            <a class="btn ghost sm" href="${rutaHerramienta('production', slug, 'production-brief')}">Enviar a Production Brief ${ico('right', 12)}</a></footer>
        </div></div>`);
      const b = el.querySelector('#dl-brief');
      if (b && slug) brandBrief(b, { me, b: { slug, name: nombreMarca }, alive: () => b.isConnected }).catch(() => mount(b, html`<p class="mut sm">${SIN_DATOS}: no pude leer el brief del ciclo</p>`));
      pintarPanel();
    }
    function pintarPanel() {
      const p = el.querySelector('#dl-panel'); if (!p) return;
      p.hidden = !S.panel;
      if (!S.panel) return mount(p, '');
      const { slots, conIdea, mes, k, error } = S.panel;
      mount(p, html`<h3 class="dl-t">${ico('calendar', 15)} Convertir «${k.nombre}» en piezas · ${mes}</h3>
        ${error ? html`<p class="dl-ro" data-vacio="1">${error}</p>` : slots.length ? html`<p class="mut sm">Elige los slots del plan que cuentan este concepto. Los que ya tienen una idea no se tocan. Sin brief del ciclo el servidor no crea piezas con fecha (423).</p>
          <ul class="dl-slots">${slots.map((s) => html`<li><label><input type="checkbox" data-slot="${s.id}" ${conIdea.has(s.id) ? 'disabled' : ''}> <b>${s.id}</b> · semana ${s.semana} · ${s.canal} ${s.formato ? `· ${s.formato}` : ''} <span class="mut sm">${conIdea.has(s.id) ? 'ya tiene idea' : corta(s.objetivo, 80)}</span></label></li>`)}</ul>`
          : html`<p class="dl-ro" data-vacio="1">${SIN_DATOS}: el plan de ${mes} no tiene slots; sale de Content Strategy Studio</p>`}
        <div class="row" style="gap:8px"><button type="button" class="btn sm" data-act="convertir-ok" ${S.ocupado || !slots.length ? 'disabled' : ''}>${S.ocupado ? 'Enviando…' : 'Enviar a Ideas'}</button><button type="button" class="btn ghost sm" data-act="convertir-no">Cerrar</button></div>`);
    }
    async function convertir() {
      const k = c.conceptos.find((x) => x.id === c.elegido && !x.descartado), mes = mesDe(c);
      if (!k) return toast('Elige un concepto primero', true);
      if (!mes) return toast('Este entregable no tiene mes: abre el selector de mes del ciclo', true);
      try { const { slots, conIdea, e } = await cargarSlots(slug, mes); S.panel = { slots, conIdea, mes, k, plan: e.plan, error: e.plan ? '' : `${SIN_DATOS}: el plan de ${mes} no existe; sale de Content Strategy Studio` }; }
      catch (e) { S.panel = { slots: [], conIdea: new Set(), mes, k, error: e.message }; }
      pintarPanel();
    }
    async function enviar() {
      const P = S.panel, ids = [...el.querySelectorAll('[data-slot]:checked')].map((x) => x.dataset.slot);
      if (!P || !ids.length || S.ocupado) return toast('Marca al menos un slot', true);
      S.ocupado = true; pintarPanel();
      try {
        if (!P.plan?.a_creatividad) { const n = await pasarPlan({ slug }, P.mes, P.plan || {}); if (n == null) throw new Error('El plan no pasó a Creatividad'); }
        const x = await api(`plan/${encodeURIComponent(slug)}/${P.mes}/ideas`, { method: 'POST', body: { ideas: ids.map((s) => ideaDeConcepto(P.k, s)) } });
        toast(`${x.puestas} idea${x.puestas === 1 ? '' : 's'} en Ideas${x.faltan?.length ? ` · ${x.faltan.length} sin slot en el plan` : ''}`);
        S.panel = null;
      } catch (e) { toast(e.message, true); }
      S.ocupado = false; pintarPanel();
    }
    el.onclick = (e) => {
      const t = e.target.closest('[data-act]'); if (!t || !el.contains(t)) return;
      const a = t.dataset.act, i = Number(t.dataset.i);
      if (a === 'deck') return void deckPdf(c).catch((x) => toast(x.message, true));
      if (a === 'convertir') return void convertir();
      if (a === 'convertir-ok') return void enviar();
      if (a === 'convertir-no') { S.panel = null; return pintarPanel(); }
      if (!ed) return;
      if (a === 'nuevo') { let n = c.conceptos.length + 1; while (c.conceptos.some((k) => k.id === `c${n}`)) n++; c.conceptos.push({ ...conceptoVacio(n), nombre: `Concepto ${n}` }); }
      else if (a === 'elegir') c.elegido = c.elegido === c.conceptos[i]?.id ? '' : c.conceptos[i]?.id || '';
      else if (a === 'descartar') { const k = c.conceptos[i]; if (!k) return; k.descartado = !k.descartado; if (k.descartado && c.elegido === k.id) c.elegido = ''; }
      else return;
      avisar(); draw();
    };
    const poner = (e) => {
      const t = e.target, k = t?.dataset?.c; if (!ed || !k || !el.contains(t)) return;
      if (k.startsWith('@img.')) { const k2 = c.conceptos[Number(k.slice(5))]; if (k2) k2.imagenes = imgsLeer(t.value).slice(0, 3); }
      else { const p = k.split('.'), ult = p.pop(); let o = c; for (const x of p) o = o?.[x]; if (o) o[ult] = t.value; }
      avisar();
    };
    el.oninput = poner; el.onchange = poner;
    draw();
  },

  // Una línea para el Overview: big idea, conceptos y elegido.
  resumen(contenido) {
    const c = limpiar(clon(contenido)), n = c.conceptos.filter((k) => !k.descartado).length, e = c.conceptos.find((k) => k.id === c.elegido);
    return html`<span class="dl-res"><span class="chip">${c.big_idea ? `Big idea: ${corta(c.big_idea, 60)}` : `Big idea: ${SIN_DATOS}`}</span><span class="chip">${n} concepto${n === 1 ? '' : 's'}</span><span class="chip">${e ? `Elegido: ${e.nombre}` : 'Sin elegir'}</span></span>`;
  },
};
