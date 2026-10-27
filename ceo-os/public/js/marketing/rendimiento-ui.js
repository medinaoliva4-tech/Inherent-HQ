// Vista del Marketing Performance Center (herramienta marketing-performance-center, una por mes): arriba los KPIs del mes cada uno con su
// fuente (GET marketing/<cliente>/kpis), la tabla por función, pilar y canal y la franja del embudo; abajo el reporte mensual editable
// (resumen, hallazgos que citan un KPI, 3 a 5 siguientes acciones y la nota interna) con el aviso de que la versión del portal va sin costos
// ni notas internas. Existe para que tool-shell.js pinte el centro de la herramienta con un solo contrato (nuevo, pintar, resumen) y para que
// lo que falta diga «⚠️ SIN DATOS» y de dónde sale, nunca 0. Pinta con html`…` (todo se escapa); lo que dice un modelo ya pasó por limpiar().
import { html, mount, api, ico, toast, today, techDetail } from '../core.js';
import { canEdit } from '../roleviews.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { mesOk, nombreMes } from '../plan-mes.js';
import { KPIS, kpiDe, nombreKpi, textoValor, FUENTE_COSTOS, mesDe, mesesRecientes } from './kpis.js';
import { AREAS, MIN_SIGUIENTES, MAX_SIGUIENTES, vacio, limpiar, fotoDe, aMdPortal, recordarKpis } from './reporte.js';

const enc = encodeURIComponent;
const MAX_HALLAZGOS = 8, MAX_ACCIONES = MAX_SIGUIENTES;
const TTL_KPIS = 60_000; // los KPIs leídos hace menos de un minuto no se vuelven a pedir cuando el shell repinta
const LEIDOS = new Map(); // `${cliente}|${mes}` → { at, data }
const sinPrefijo = (f) => String(f ?? '').replace(/^⚠️ SIN DATOS:\s*/, '');
const hoyDe = (ctx) => (/^\d{4}-\d{2}-\d{2}$/.test(String(ctx?.hoy ?? '')) ? ctx.hoy : today());
const veCostos = (me) => Boolean(me) && (['ceo', 'coo'].includes(me.role) || canEdit(me, 'clients')); // refleja seesCosts del servidor; el servidor decide
const ponerRuta = (obj, ruta, v) => { const p = ruta.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[ultimo] = v; };

// El contenido de trabajo: el limpio, con el mes siempre puesto (el actual si el entregable no lo trae).
const base = (contenido, mes) => { const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {})); if (!c.mes) c.mes = mes; return c; };
// El valor de un KPI de la foto del reporte.
const valorFoto = (k) => (k.fuente === FUENTE_COSTOS ? 'Restringido' : textoValor({ formato: kpiDe(k.id)?.formato, valor: k.valor }) || SIN_DATOS);

// ---------- Arriba: los KPIs, la franja del embudo y las tablas ----------
function tarjeta(k) {
  const estado = k.restringido || k.fuente === FUENTE_COSTOS ? 'restringido' : k.valor === null || k.valor === undefined ? 'sin-datos' : 'ok';
  return html`<article class="rnd-kpi" data-id="${k.id}" data-estado="${estado}">
    <span class="rnd-kpi-n">${k.nombre}</span>
    <b class="rnd-kpi-v">${estado === 'restringido' ? html`${ico('lock', 14)} Restringido` : estado === 'sin-datos' ? SIN_DATOS : textoValor(k)}</b>
    <span class="rnd-kpi-f mut sm">${estado === 'ok' ? html`Fuente: ${k.fuente}` : estado === 'restringido' ? k.fuente : sinPrefijo(k.fuente)}</span>
    ${k.nota ? html`<span class="rnd-kpi-nota sm">${k.nota}</span>` : ''}
  </article>`;
}
function franja(embudo) {
  return html`<ol class="rnd-embudo" aria-label="El embudo del mes, de arriba (TOF) a abajo (BOF)">${(embudo || []).map((e) => html`<li class="rnd-emb" data-etapa="${e.etapa}" data-estado="${e.valor === null ? 'sin-datos' : 'ok'}">
    <b class="rnd-emb-e">${e.etapa}</b><span class="rnd-emb-m">${e.medida}</span>
    <span class="rnd-emb-v">${e.valor === null ? SIN_DATOS : textoValor({ formato: 'entero', valor: e.valor })}</span>
    <span class="rnd-emb-f mut sm">${e.valor === null ? sinPrefijo(e.fuente) : `Fuente: ${e.fuente}`}</span>
    ${e.piezas !== null && e.piezas !== undefined ? html`<span class="rnd-emb-p mut sm">${e.piezas} ${e.piezas === 1 ? 'pieza publicada' : 'piezas publicadas'}</span>` : ''}</li>`)}</ol>`;
}
function tabla(titulo, filas, vacioTxt) {
  return html`<div class="rnd-tabla-c"><h4>${titulo}</h4>${filas.length
    ? html`<table class="rnd-tabla"><thead><tr><th scope="col">${titulo.replace(/^Por /, '').replace(/^./, (x) => x.toUpperCase())}</th><th scope="col" class="n">Planeadas</th><th scope="col" class="n">Publicadas</th><th scope="col" class="n">Avance</th></tr></thead>
      <tbody>${filas.map((f) => html`<tr><th scope="row">${f.clave}</th><td class="n">${f.planeadas}</td><td class="n">${f.publicadas}</td><td class="n">${f.pct === null ? '—' : `${f.pct}%`}</td></tr>`)}</tbody></table>`
    : html`<p class="rnd-sd">${SIN_DATOS}: ${vacioTxt}</p>`}</div>`;
}
function mesHtml(S) {
  if (S.error) return html`<div class="empty rnd-err" role="alert"><b>No pude leer los KPIs</b>${S.error.message || 'Inténtalo de nuevo en un momento.'}${techDetail(S.error)}</div>`;
  const d = S.data;
  if (!d) return html`<p class="loading">Leyendo los KPIs del mes…</p>`;
  const sd = 'sin piezas con fecha en este mes (sale del Plan del mes y del calendario de contenido)';
  const f = d.fuentes || {};
  return html`<div class="rnd-kpis">${(d.kpis || []).map(tarjeta)}</div>
    <div class="rnd-bloque"><h4 class="rnd-h4">${ico('funnel', 14)} El embudo del mes</h4>${franja(d.embudo)}</div>
    <div class="rnd-bloque"><h4 class="rnd-h4">${ico('chart-column', 14)} Por función, pilar y canal</h4>
      <div class="rnd-tablas">${tabla('Por función', d.tabla?.porFuncion || [], sd)}${tabla('Por pilar', d.tabla?.porPilar || [], sd)}${tabla('Por canal', d.tabla?.porCanal || [], sd)}</div>
      ${d.tabla?.faltan ? html`<p class="rnd-sd">${d.tabla.faltan}</p>` : ''}</div>
    <ul class="rnd-fuentes mut sm" aria-label="De dónde salen los números">
      <li><b>Instagram</b> · ${f.windsor?.de_donde || '—'}</li>
      <li><b>Leads</b> · ${f.leads?.de_donde || '—'}</li>
      <li><b>Pauta</b> · ${f.ads?.oculto ? FUENTE_COSTOS : f.ads?.de_donde || '—'}</li></ul>`;
}

// ---------- Abajo: el reporte ----------
const optKpi = (c, h, costos) => {
  const enFoto = c.kpis.map((k) => k.id), lista = KPIS.filter((k) => (enFoto.length ? enFoto.includes(k.id) : true) && (costos || !k.costo || k.id === h.kpi));
  if (h.kpi && !lista.some((k) => k.id === h.kpi)) lista.push(kpiDe(h.kpi));
  return lista.filter(Boolean).map((k) => html`<option value="${k.id}" ${h.kpi === k.id ? 'selected' : ''}>${k.nombre}</option>`);
};
// Lo que falta o lo que sostiene un hallazgo: su KPI con el valor de la foto, o el aviso de que no cita ninguno.
function avisoHallazgo(c, i) {
  const h = c.hallazgos[i]; if (!h) return '';
  if (!h.kpi) return h.texto ? html`<p class="rnd-av" role="status">${ico('triangle-alert', 14)} Toda afirmación cita un KPI: elige cuál la sostiene</p>` : '';
  const k = c.kpis.find((x) => x.id === h.kpi);
  if (!k) return c.kpis.length ? html`<p class="rnd-av" role="status">${ico('triangle-alert', 14)} Ese KPI no está en la foto del mes</p>` : html`<p class="rnd-sd">${SIN_DATOS}: falta la foto de los KPIs del mes</p>`;
  return html`<p class="rnd-cita mut sm">KPI: <b>${nombreKpi(k.id)}</b> · ${valorFoto(k)}</p>`;
}
// Cuenta las acciones que ya dicen qué se hace (una fila vacía no cuenta: limpiar() la descarta).
const contadorAcciones = (c) => { const n = c.siguientes.filter((s) => String(s.accion ?? '').trim()).length, ok = n >= MIN_SIGUIENTES && n <= MAX_SIGUIENTES; return html`<span class="rnd-cuenta" data-ok="${ok ? 1 : 0}">${n} de ${MIN_SIGUIENTES} a ${MAX_SIGUIENTES}</span>`; };

function editorHtml({ c, S, ed, costos, nuevoDoc, meses }) {
  const foto = c.kpis.length
    ? html`<table class="rnd-tabla rnd-foto"><thead><tr><th scope="col">KPI</th><th scope="col" class="n">Valor</th><th scope="col">Fuente</th></tr></thead>
        <tbody>${c.kpis.map((k) => html`<tr data-estado="${k.fuente === FUENTE_COSTOS ? 'restringido' : k.valor === null ? 'sin-datos' : 'ok'}"><th scope="row">${nombreKpi(k.id)}</th><td class="n">${valorFoto(k)}</td><td class="mut sm">${k.fuente || '—'}</td></tr>`)}</tbody></table>`
    : html`<p class="rnd-sd">${SIN_DATOS}: la foto de los KPIs sale de los de arriba</p>`;
  const areaOpts = (area) => html`<option value="">— área</option>${AREAS.map(([, n]) => html`<option value="${n}" ${area === n ? 'selected' : ''}>${n}</option>`)}${area && !AREAS.some(([, n]) => n === area) ? html`<option value="${area}" selected>${area}</option>` : ''}`;
  return html`
    <div class="rnd-campo"><span class="lbl">Mes del reporte</span>${ed && nuevoDoc
      ? html`<select class="in" data-c="mes" aria-label="Mes del reporte">${meses.map((m) => html`<option value="${m}" ${c.mes === m ? 'selected' : ''}>${nombreMes(m)}</option>`)}</select>`
      : html`<b class="rnd-mes-n">${c.mes ? nombreMes(c.mes) : SIN_DATOS}</b>`}</div>

    <div class="rnd-campo"><label class="lbl" for="rnd-resumen">Resumen</label>${ed
      ? html`<textarea class="in" id="rnd-resumen" data-c="resumen" rows="3" maxlength="1200" placeholder="Dos o tres frases con lo que pasó este mes">${c.resumen}</textarea>`
      : c.resumen ? html`<p class="rnd-ro">${c.resumen}</p>` : html`<p class="rnd-sd">${SIN_DATOS}: falta el resumen del mes</p>`}</div>

    <div class="rnd-campo"><div class="rnd-campo-h"><span class="lbl">La foto de los KPIs del mes</span>${ed ? html`<button type="button" class="btn ghost sm" data-a="foto" ${S.data ? '' : 'disabled'}>${ico('chart-column', 14)} Usar los KPIs de arriba</button>` : ''}</div>${foto}</div>

    <div class="rnd-campo"><div class="rnd-campo-h"><span class="lbl">Qué vimos</span><span class="mut sm">Cada hallazgo cita un KPI</span></div>
      ${c.hallazgos.length ? html`<ol class="rnd-lista">${c.hallazgos.map((h, i) => html`<li class="rnd-h" data-i="${i}">${ed
        ? html`<div class="rnd-fila"><label class="rnd-f-ancho"><span class="sr-only">Hallazgo ${i + 1}</span><textarea class="in" data-c="hallazgos.${i}.texto" rows="2" maxlength="400" placeholder="Qué pasó, con su número" aria-label="Hallazgo ${i + 1}">${h.texto}</textarea></label>
            <label><span class="lbl">KPI</span><select class="in" data-c="hallazgos.${i}.kpi" aria-label="KPI del hallazgo ${i + 1}"><option value="">— elige un KPI</option>${optKpi(c, h, costos)}</select></label>
            <button type="button" class="btn ghost sm rnd-quitar" data-a="h-" data-i="${i}" aria-label="Quitar el hallazgo ${i + 1}">${ico('x', 14)}</button></div>`
        : html`<p class="rnd-ro">${h.texto}</p>`}<div data-r="h-av" data-i="${i}">${avisoHallazgo(c, i)}</div></li>`)}</ol>`
        : html`<p class="rnd-sd">${SIN_DATOS}: faltan los hallazgos (cada uno con su KPI)</p>`}
      ${ed && c.hallazgos.length < MAX_HALLAZGOS ? html`<button type="button" class="btn ghost sm" data-a="h+">${ico('plus', 14)} Agregar un hallazgo</button>` : ''}</div>

    <div class="rnd-campo"><div class="rnd-campo-h"><span class="lbl">Qué sigue</span><span class="mut sm">De ${MIN_SIGUIENTES} a ${MAX_SIGUIENTES} acciones, cada una con su área y su fecha</span><span data-r="cuenta">${contadorAcciones(c)}</span></div>
      ${c.siguientes.length ? html`<ol class="rnd-lista">${c.siguientes.map((s, i) => html`<li class="rnd-s" data-i="${i}">${ed
        ? html`<div class="rnd-fila"><label class="rnd-f-ancho"><span class="sr-only">Acción ${i + 1}</span><input class="in" type="text" data-c="siguientes.${i}.accion" value="${s.accion}" maxlength="240" placeholder="Qué se hace" aria-label="Acción ${i + 1}" autocomplete="off"></label>
            <label><span class="sr-only">Área de la acción ${i + 1}</span><select class="in" data-c="siguientes.${i}.area" aria-label="Área de la acción ${i + 1}">${areaOpts(s.area)}</select></label>
            <label><span class="sr-only">Fecha de la acción ${i + 1}</span><input class="in" type="date" data-c="siguientes.${i}.fecha" value="${s.fecha}" aria-label="Fecha de la acción ${i + 1}"></label>
            <button type="button" class="btn ghost sm rnd-quitar" data-a="s-" data-i="${i}" aria-label="Quitar la acción ${i + 1}">${ico('x', 14)}</button></div>`
        : html`<p class="rnd-ro">${s.accion}<span class="mut sm"> · ${s.area || SIN_DATOS} · ${s.fecha || SIN_DATOS}</span></p>`}</li>`)}</ol>`
        : html`<p class="rnd-sd">${SIN_DATOS}: faltan las siguientes acciones</p>`}
      ${ed && c.siguientes.length < MAX_ACCIONES ? html`<button type="button" class="btn ghost sm" data-a="s+">${ico('plus', 14)} Agregar una acción</button>` : ''}
      <p class="mut sm">Un cambio de pauta es una tarea para ⑩ Ads o el OK del CEO: aquí no se hace.</p></div>

    <div class="rnd-campo"><label class="lbl" for="rnd-nota">Nota interna <span class="mut sm">· solo el equipo, no va al portal</span></label>${ed
      ? html`<textarea class="in" id="rnd-nota" data-c="nota_interna" rows="2" maxlength="1200" placeholder="Lo que el cliente no necesita leer">${c.nota_interna}</textarea>`
      : c.nota_interna ? html`<p class="rnd-ro">${c.nota_interna}</p>` : html`<p class="mut sm">Sin nota interna.</p>`}</div>

    <aside class="rnd-portal" aria-label="La versión para el portal">
      <p class="rnd-portal-t">${ico('lock', 14)} La versión para el portal va sin costos ni notas internas</p>
      <details class="rnd-portal-prev"><summary>Ver cómo queda</summary><pre class="rnd-md" data-r="portal"></pre></details>
      <button type="button" class="btn ghost sm" data-a="portal-copiar">${ico('copy', 14)} Copiar la versión del portal</button>
    </aside>`;
}

// ---------- La vista ----------
export const vista = {
  // El contenido inicial: el mes de hoy y nada más (los KPIs de arriba se copian a la foto cuando se leen).
  nuevo(ctx) { return vacio(mesDe(hoyDe(ctx))); },

  pintar(el, { contenido, editable, onCambio, ctx, me, slug, docId } = {}) {
    const ed = Boolean(editable), nuevoDoc = !docId, costos = veCostos(me), hoy = hoyDe(ctx);
    const c = base(contenido, mesDe(hoy)), S = { data: null, error: null, tok: 0 };
    const meses = () => { const l = mesesRecientes(hoy, 12); if (c.mes && !l.includes(c.mes)) l.push(c.mes); return l; };
    mount(el, html`<div class="rnd" data-editable="${ed ? 1 : 0}">
      <section class="rnd-sec rnd-mes" aria-label="Los KPIs del mes"><h3 class="rnd-t">${ico('chart-column', 16)} El mes <span class="rnd-t-m" data-r="mes-n">${c.mes ? nombreMes(c.mes) : ''}</span></h3><div data-r="mes"></div></section>
      <section class="rnd-sec rnd-rep" aria-label="El reporte del mes"><h3 class="rnd-t">${ico('file-text', 16)} Reporte del mes <span class="mut sm">el que se presenta el día 20</span></h3><div data-r="editor"></div></section></div>`);
    const root = el.firstElementChild, region = (n) => root.querySelector(`[data-r="${n}"]`);
    const vivo = () => root.isConnected;
    const emitir = () => { if (ed && typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };

    // Lo que depende del contenido y no tiene campo propio: los avisos de cada hallazgo, la cuenta de acciones y la versión del portal.
    const derivados = () => {
      for (const n of root.querySelectorAll('[data-r="h-av"]')) mount(n, avisoHallazgo(c, Number(n.dataset.i)));
      const cu = region('cuenta'); if (cu) mount(cu, contadorAcciones(c));
      const pre = region('portal'); if (pre) { try { pre.textContent = aMdPortal(limpiar(structuredClone(c))); } catch { pre.textContent = ''; } }
    };
    const pintarEditor = () => { mount(region('editor'), editorHtml({ c, S, ed, costos, nuevoDoc, meses: meses() })); derivados(); };
    const pintarMes = () => { mount(region('mes'), mesHtml(S)); const n = region('mes-n'); if (n) n.textContent = c.mes ? nombreMes(c.mes) : ''; };

    // Leer los KPIs del mes del servidor (una sola ruta: marketing/<cliente>/kpis).
    async function cargar({ forzar = false } = {}) {
      const mes = mesOk(c.mes) ? c.mes : mesDe(hoy), clave = `${slug}|${mes}`, tok = ++S.tok, hit = LEIDOS.get(clave);
      S.error = null;
      if (!forzar && hit && Date.now() - hit.at < TTL_KPIS) S.data = hit.data;
      else {
        S.data = null; pintarMes();
        try { const d = await api(`marketing/${enc(slug)}/kpis?mes=${enc(mes)}`); LEIDOS.set(clave, { at: Date.now(), data: d }); if (LEIDOS.size > 40) LEIDOS.clear(); S.data = d; }
        catch (e) { if (tok !== S.tok || !vivo()) return; S.error = e; S.data = null; }
      }
      if (tok !== S.tok || !vivo()) return; // se cambió de mes o se repintó la vista mientras tanto
      if (S.data) recordarKpis(slug, mes, S.data.kpis); // la IA lee los mismos KPIs que se ven arriba
      pintarMes();
      // Un borrador nuevo arranca con la foto de los KPIs de arriba (en uno ya guardado, la foto se toma con el botón).
      if (S.data && ed && nuevoDoc && !c.kpis.length) { c.kpis = fotoDe(S.data.kpis); emitir(); pintarEditor(); }
      else if (S.data) { const b = root.querySelector('[data-a="foto"]'); if (b) b.disabled = false; }
    }

    pintarMes(); pintarEditor();
    cargar().catch(() => {});

    const enfocar = (sel) => { const n = root.querySelector(sel); if (n) n.focus(); };
    const alCambiar = (e) => {
      const t = e.target, k = t?.dataset?.c;
      if (!ed || !k || !root.contains(t)) return;
      ponerRuta(c, k, t.value);
      if (k === 'mes') { // otro mes: los KPIs y la foto son de ese mes
        c.kpis = []; emitir(); pintarEditor(); cargar({ forzar: false }).catch(() => {}); return;
      }
      emitir(); derivados();
    };
    root.addEventListener('input', alCambiar);
    root.addEventListener('change', alCambiar);
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]'); if (!b || !root.contains(b)) return;
      const a = b.dataset.a, i = Number(b.dataset.i);
      if (a === 'portal-copiar') {
        const md = aMdPortal(limpiar(structuredClone(c)));
        try { await navigator.clipboard.writeText(md); toast('Copiada la versión del portal'); } catch { toast('No pude copiar. Ábrela en «Ver cómo queda» y cópiala a mano.', true); }
        return;
      }
      if (!ed) return;
      if (a === 'foto') { if (!S.data) return; c.kpis = fotoDe(S.data.kpis); emitir(); pintarEditor(); return; }
      if (a === 'h+') { if (c.hallazgos.length >= MAX_HALLAZGOS) return; c.hallazgos.push({ texto: '', kpi: '' }); pintarEditor(); enfocar(`[data-c="hallazgos.${c.hallazgos.length - 1}.texto"]`); return; }
      if (a === 'h-') { c.hallazgos.splice(i, 1); emitir(); pintarEditor(); return; }
      if (a === 's+') { if (c.siguientes.length >= MAX_ACCIONES) return; c.siguientes.push({ accion: '', area: '', fecha: '' }); pintarEditor(); enfocar(`[data-c="siguientes.${c.siguientes.length - 1}.accion"]`); return; }
      if (a === 's-') { c.siguientes.splice(i, 1); emitir(); pintarEditor(); }
    });
  },

  // Una línea para comparar versiones y para la propuesta de la IA: el mes, el resumen, los hallazgos y las acciones.
  resumen(contenido) {
    const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {}));
    return html`<div class="rnd-res"><span class="rnd-res-ch"><span class="chip">${c.mes ? nombreMes(c.mes) : `Mes: ${SIN_DATOS}`}</span><span class="chip">${c.hallazgos.length} ${c.hallazgos.length === 1 ? 'hallazgo' : 'hallazgos'}</span><span class="chip">${c.siguientes.length} ${c.siguientes.length === 1 ? 'acción' : 'acciones'}</span></span>
      <p>${c.resumen || `${SIN_DATOS}: falta el resumen`}</p>
      ${c.hallazgos.length ? html`<ul>${c.hallazgos.map((h) => html`<li>${h.texto}${h.kpi ? html` <span class="mut sm">(${nombreKpi(h.kpi)})</span>` : html` <span class="mut sm">(sin KPI)</span>`}</li>`)}</ul>` : ''}
      ${c.siguientes.length ? html`<ul>${c.siguientes.map((s) => html`<li>${s.accion}<span class="mut sm"> · ${s.area || SIN_DATOS}${s.fecha ? ` · ${s.fecha}` : ''}</span></li>`)}</ul>` : ''}</div>`;
  },
};
