// Vista del Production Brief Builder (herramienta production-brief de Production): a la izquierda las piezas de ④ a producir (video y foto,
// con «¿se puede producir?»); a la derecha el techo de realidad de la ficha (horas y sesiones, barra roja al pasarse) y las devueltas a ④
// con su motivo y 2 alternativas. Cada devolución sale como tarea para ④ Creatividad con «Convertir en tareas» del shell (POST entregables/:id/tareas).
// Existe para que tool-shell.js pinte el centro con un solo contrato (nuevo, pintar, resumen). Pinta con html`…` (todo se escapa), lee con
// inputs nativos y avisa cada cambio con el contenido completo y limpio. Sin tarifas ni costos: no los lleva el brief.
import { html, mount, api, ico, toast } from '../core.js';
import { SIN_DATOS, corta } from '../consulting/marcos.js';
import { shotData, techo as techoFicha, MIN_POR_VIDEO } from '../produccion.js';
import { vacio, limpiar, faltas, cargaDe, sinDevolver, devueltaVacia, PRODUCIBLE, resumenTexto } from './brief.js';

const clon = (x) => { try { return structuredClone(x && typeof x === 'object' ? x : {}); } catch { return {}; } };
const num = (v) => { const n = Number(String(v ?? '').replace(',', '.')); return String(v ?? '').trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null; };
const SD = { piezas: 'salen de ④ Creatividad (plan-de-contenido.csv): trae las filas con material video o foto', horas: 'sale de la ficha de oferta del cliente', sesiones: 'sale de la ficha de oferta del cliente' };

export const vista = {
  nuevo(ctx) {
    const c = vacio(), t = techoFicha(ctx?.ficha);
    if (/^\d{4}-\d{2}$/.test(String(ctx?.mes ?? ''))) c.mes = ctx.mes;
    if (t.horas !== null || t.sesiones !== null) c.techo = { horas: t.horas, sesiones: t.sesiones, fuente: t.fuente };
    return c;
  },

  resumen: (contenido) => resumenTexto(contenido),

  pintar(el, { contenido, editable, onCambio, ctx, slug } = {}) {
    const ed = Boolean(editable), c = limpiar(clon(contenido)), S = { trayendo: false };
    const avisar = () => { if (typeof onCambio === 'function') onCambio(limpiar(clon(c))); };
    const extra = () => ({ ficha: ctx?.ficha || null });

    // ---- Regiones derivadas (nunca contienen un campo editable) ----
    function pintarTecho() {
      const r = el.querySelector('#pb-techo'); if (!r) return;
      const k = cargaDe(c, extra()), pct = k.pct === null ? 0 : Math.min(100, k.pct);
      mount(r, html`<p class="pb-cifras"><b>${k.videos}</b> videos × ${MIN_POR_VIDEO} min = <b>${k.horas} h</b> de cámara
        ${k.techoHoras === null ? html`<span class="pb-sd">${SIN_DATOS}: el techo de horas ${SD.horas}</span>` : html`de <b>${k.techoHoras} h</b> de la ficha${k.sesiones !== null && k.techoSesiones !== null ? html` · ${k.sesiones} de ${k.techoSesiones} sesiones` : ''}`}</p>
        <div class="pb-bar" data-sobre="${k.pasa ? 1 : 0}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${k.pct ?? 0}" aria-label="Horas pedidas contra el techo de la ficha"><span style="width:${pct}%"></span></div>
        ${k.pasa ? html`<p class="pb-alto" role="alert">${ico('triangle-alert', 15)} Te pasas${k.sobran ? ` ${k.sobran} h` : ''}: caben ${k.caben ?? '—'} videos. Marca «No» y devuelve las que sobran a ④, o escala el alcance al CEO.</p>` : ''}`);
    }
    function pintarPie() {
      const r = el.querySelector('#pb-pie'); if (!r) return;
      const f = faltas(c, extra());
      mount(r, html`${f.length ? html`<ul class="pb-faltas" aria-label="Lo que falta para cerrar">${f.map((x) => html`<li>${x}</li>`)}</ul>` : html`<p class="pb-ok">${ico('check', 14)} Listo para cerrar.</p>`}
        ${ed ? html`<button type="button" class="btn" data-act="cerrar" ${f.length || c.cerrado ? 'disabled' : ''}>${c.cerrado ? 'Brief cerrado' : 'Cerrar brief'}</button>` : ''}`);
    }
    const derivadas = () => { pintarTecho(); pintarPie(); };

    // ---- Estructura ----
    function draw() {
      const pend = sinDevolver(c);
      mount(el, html`<div class="pb" data-editable="${ed ? 1 : 0}">
        <section class="pb-izq" aria-label="Piezas a producir"><div class="row" style="gap:8px;flex-wrap:wrap"><h3 class="pb-t">${ico('video', 15)} Piezas a producir <span class="mut sm">${c.piezas.length}</span></h3><div class="sp"></div>
          ${ed ? html`<button type="button" class="btn ghost sm" data-act="traer" ${S.trayendo ? 'disabled' : ''}>${S.trayendo ? 'Leyendo ④…' : 'Traer de ④'}</button>` : ''}</div>
          ${c.piezas.length ? html`<div class="card tscroll"><table class="wktable pb-tbl"><thead><tr><th>Pieza</th><th>Formato</th><th>Fecha</th><th>Material</th><th>¿Se puede producir?</th></tr></thead><tbody>
            ${c.piezas.map((p, i) => html`<tr><td><b>${p.id_creativo}</b>${p.nota ? html`<div class="mut sm">${p.nota}</div>` : ''}</td><td>${p.formato || '—'}</td><td>${p.fecha || '—'}</td>
              <td>${p.material === 'foto' ? html`${ico('camera', 14)} foto` : html`${ico('video', 14)} video`}</td>
              <td>${ed ? html`<select class="in" data-p="${i}" aria-label="¿Se puede producir ${p.id_creativo}?"><option value="">${SIN_DATOS}</option>${PRODUCIBLE.map(([v, l]) => html`<option value="${v}" ${p.producible === v ? 'selected' : ''}>${l}</option>`)}</select>` : html`<span class="chip pb-prod" data-prod="${p.producible}">${PRODUCIBLE.find((x) => x[0] === p.producible)?.[1] || SIN_DATOS}</span>`}</td></tr>`)}
          </tbody></table></div>` : html`<p class="pb-sd">${SIN_DATOS}: las piezas ${SD.piezas}.</p>`}</section>
        <aside class="pb-der" aria-label="Techo de realidad y devueltas">
          <section class="pb-sec"><h3 class="pb-t">${ico('clock', 15)} Techo de realidad</h3>
            <div class="pb-campos"><label>Horas de grabación al mes ${ed ? html`<input class="in" type="number" min="0" step="0.5" data-t="horas" value="${c.techo.horas ?? ''}" placeholder="${SIN_DATOS}">` : html`<b>${c.techo.horas ?? SIN_DATOS}</b>`}</label>
              <label>Sesiones al mes ${ed ? html`<input class="in" type="number" min="0" step="1" data-t="sesiones" value="${c.techo.sesiones ?? ''}" placeholder="${SIN_DATOS}">` : html`<b>${c.techo.sesiones ?? SIN_DATOS}</b>`}</label></div>
            <p class="mut sm">${c.techo.fuente ? `Fuente: ${c.techo.fuente}.` : `${SIN_DATOS}: ${SD.horas}. Si el cliente declara menos, manda la menor.`}</p>
            <div id="pb-techo"></div></section>
          <section class="pb-sec"><h3 class="pb-t">${ico('file-text', 15)} Devueltas a ④ <span class="mut sm">${c.devueltas.length}</span></h3>
            ${c.devueltas.length ? c.devueltas.map((d, i) => html`<article class="pb-dev"><b>${d.id_creativo}</b>
              <label>Motivo ${ed ? html`<textarea class="in" rows="2" maxlength="300" data-d="${i}" data-k="motivo" placeholder="Locación, talento, fecha o tiempo">${d.motivo}</textarea>` : html`<span>${d.motivo || SIN_DATOS}</span>`}</label>
              ${[0, 1].map((j) => html`<label>Alternativa ${j + 1} ${ed ? html`<input class="in" type="text" maxlength="240" data-d="${i}" data-k="alt" data-j="${j}" value="${d.alternativas[j] || ''}">` : html`<span>${d.alternativas[j] || SIN_DATOS}</span>`}</label>`)}</article>`)
              : html`<p class="mut sm">Ninguna. Una pieza marcada «No» se devuelve a ④ con motivo y 2 alternativas.</p>`}
            ${ed && pend.length ? html`<div class="pb-pend">${pend.map((p) => html`<button type="button" class="btn ghost sm" data-act="devolver" data-id="${p.id_creativo}">Devolver ${p.id_creativo} a ④</button>`)}</div>` : ''}
            <p class="mut sm">Cada devolución sale como tarea para ④ Creatividad con «Convertir en tareas».</p></section>
          <footer class="pb-pie" id="pb-pie"></footer>
        </aside></div>`);
      derivadas();
    }

    // ---- Eventos ----
    async function traer() {
      const mes = c.mes || ctx?.mes || '';
      S.trayendo = true; draw();
      try {
        const rc = await api(`repo/content?profile=${encodeURIComponent(slug)}`);
        const { rows } = shotData((rc?.profile?.months) || [], mes || null);
        const hay = new Set(c.piezas.map((p) => p.id_creativo)); let n = 0;
        for (const r of rows) { if (!['video', 'foto'].includes(r.material) || hay.has(r.id)) continue; c.piezas.push({ id_creativo: r.id, formato: r.formato, fecha: r.fecha, material: r.material, producible: '', nota: corta(r.concepto, 120) }); hay.add(r.id); n++; }
        const l = limpiar(c); c.piezas = l.piezas;
        toast(n ? `${n} pieza${n === 1 ? '' : 's'} de ④ en el brief` : rows.length ? 'No hay piezas nuevas con video o foto' : 'Todavía no hay plan de contenido de ④ en el repo');
        if (n) avisar();
      } catch (e) { toast(e.message, true); }
      S.trayendo = false; draw();
    }
    el.onclick = (e) => {
      const t = e.target.closest('[data-act]'); if (!t || !el.contains(t) || !ed) return;
      if (t.dataset.act === 'traer') traer();
      else if (t.dataset.act === 'devolver') { const id = t.dataset.id; if (!c.devueltas.some((d) => d.id_creativo === id)) c.devueltas.push({ ...devueltaVacia(), id_creativo: id }); avisar(); draw(); }
      else if (t.dataset.act === 'cerrar') { if (faltas(c, extra()).length) return; c.cerrado = true; avisar(); pintarPie(); }
    };
    el.onchange = (e) => {
      const s = e.target.closest('select[data-p]'); if (!s || !ed) return;
      c.piezas[+s.dataset.p].producible = s.value; c.cerrado = false; avisar(); draw();
    };
    el.oninput = (e) => {
      if (!ed) return; const t = e.target;
      if (t.dataset.t) { c.techo[t.dataset.t] = num(t.value); c.techo.fuente = c.techo.fuente || 'lo que escribiste aquí'; c.cerrado = false; }
      else if (t.dataset.d !== undefined) { const d = c.devueltas[+t.dataset.d]; if (!d) return; if (t.dataset.k === 'motivo') d.motivo = t.value; else d.alternativas[+t.dataset.j] = t.value; }
      else return;
      avisar(); derivadas();
    };
    draw();
  },
};
