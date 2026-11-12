// Vista del Creative Performance Analyzer (herramienta creative-performance-analyzer de Creative, un entregable por marca y mes): los scorecards de cada pieza publicada contra la línea base
// de la misma marca, lo que Laya dijo antes contra lo que pasó, el veredicto, los 3 patrones ganadores y la fatiga (solo con datos de pauta); abajo lo que aprendimos. Sin Windsor dice
// «conecta Windsor». Existe para que tool-shell.js pinte el centro de la herramienta con un solo contrato (nuevo, pintar, resumen) y para que lo que falta diga «⚠️ SIN DATOS» y de dónde sale.
// Nada de esto va al portal. Pinta con html`…` (todo se escapa); lo que dice un modelo ya pasó por limpiar().
import { html, mount, api, col, ico, toast, today, techDetail } from '../core.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { nombreMes, mesOk } from '../plan-mes.js';
import { estadoDe } from '../element.js';
import { mesDe } from '../marketing/kpis.js';
import { DIMENSIONES, NIVELES, VEREDICTOS, LAYA_VS, MAX_PATRONES, CONECTA_WINDSOR, SIN_METRICAS, vacio, limpiar, armar, normalizar, patrones, fatigaDe, resultadoDePieza, recordarRendimiento } from './rendimiento-creativo.js';
import { clasificar, siguientePar, evidenciaPar } from './criterio-elo.js';
import { fallo } from '../visual.js';

const enc = encodeURIComponent;
const hoyDe = (ctx) => (/^\d{4}-\d{2}-\d{2}$/.test(String(ctx?.hoy ?? '')) ? ctx.hoy : today());
const ponerRuta = (obj, ruta, v) => { const p = ruta.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[ultimo] = v; };
const base = (contenido, mes) => { const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {})); if (!c.mes) c.mes = mes; return c; };
const nom = (k, l) => l.find(([x]) => x === k)?.[1] || k;
const publicada = (p) => estadoDe(p) === 'Publicado' || (estadoDe(p) === 'Archivado' && Boolean(p.published_at));
const num = (n) => Number(n).toLocaleString('en-US');

// La lectura que Laya dejó ANTES de publicar: «suena a la marca» (0..1) y «engancha» (escala normalizada a 0..1).
const layaDe = (r) => { const u = r?.resumen?.ultimos || {}, e = u.engancha; return { suena: Number.isFinite(u.suena?.prob) ? u.suena.prob : null, engancha: e && Number.isFinite(e.score) && e.max ? e.score / e.max : null }; };

// ---------- Pintar ----------
function tarjeta(p, ed, i) {
  const ancho = p.razon === null ? 0 : Math.min(200, Math.round(p.razon * 100)); // 100 % = la línea base
  return html`<article class="rcr-p" data-nivel="${p.nivel}" data-i="${i}">
    <header><b class="rcr-p-t">${p.titulo || p.id}</b><span class="mut sm">${[p.formato, p.pilar, p.etapa].filter(Boolean).join(' · ') || 'Sin formato definido'}</span></header>
    <div class="rcr-p-m"><span class="rcr-p-er">${p.metricas.er === undefined ? html`<span class="rcr-sd">${SIN_DATOS}</span>` : html`<b>${p.metricas.er}%</b> ER`}</span>
      ${p.metricas.alcance !== undefined ? html`<span class="mut sm">${num(p.metricas.alcance)} de alcance</span>` : ''}</div>
    ${p.razon === null ? html`<p class="rcr-sd">${SIN_DATOS}: ${p.metricas.er === undefined ? 'sale de Windsor y de ⑨ Posting (alcance e interacciones de la pieza)' : 'sale de la línea base de la marca (necesita 3 piezas con métricas)'}</p>`
      : html`<div class="rcr-vs" role="img" aria-label="${p.razon} veces la línea base"><span class="rcr-vs-b"><i style="width:${ancho / 2}%"></i></span><span class="rcr-vs-v">${p.razon}x la base</span></div>`}
    <div class="rcr-p-f"><span class="chip sm2 rcr-nivel" data-nivel="${p.nivel}">${nom(p.nivel, NIVELES)}</span><span class="chip sm2" data-vs="${p.laya_vs}" title="Lo que Laya dijo antes de publicar contra lo que pasó">${LAYA_VS[p.laya_vs]}</span><span class="chip sm2 rcr-ver" data-v="${p.veredicto}">${nom(p.veredicto, VEREDICTOS)}</span></div>
    ${ed ? html`<label class="rcr-nota"><span class="sr-only">Nota de ${p.titulo || p.id}</span><input class="in" type="text" data-c="piezas.${i}.nota" value="${p.nota}" maxlength="300" placeholder="Qué se ve en esta pieza" autocomplete="off"></label>` : p.nota ? html`<p class="rcr-ro sm">${p.nota}</p>` : ''}</article>`;
}
function patronesHtml(c, ed) {
  const l = c.patrones;
  return html`<div class="rcr-campo-h"><span class="lbl">Patrones ganadores</span><span class="mut sm">${MAX_PATRONES}, cada uno con 2 o más piezas por encima de la base</span><span class="rcr-cuenta" data-ok="${l.length === MAX_PATRONES ? 1 : 0}">${l.length} de ${MAX_PATRONES}</span></div>
    ${l.length ? html`<ol class="rcr-pats">${l.map((x, i) => html`<li class="rcr-pat"><b>${nom(x.dimension, DIMENSIONES)}: ${x.valor}</b><span class="mut sm"> · ${x.n} piezas · ${x.ratio === null ? SIN_DATOS : `${x.ratio}x la base`}</span>
      ${ed ? html`<label><span class="sr-only">Qué repetir del patrón ${i + 1}</span><input class="in" type="text" data-c="patrones.${i}.leccion" value="${x.leccion}" maxlength="300" placeholder="Qué repetir" autocomplete="off"></label>` : html`<p class="rcr-ro sm">${x.leccion || `${SIN_DATOS}: falta qué repetir`}</p>`}</li>`)}</ol>`
      : html`<p class="rcr-sd">${SIN_DATOS}: sin patrones. Hacen falta 2 o más piezas de un mismo formato, pilar o etapa por encima de la línea base.</p>`}
    ${ed ? html`<button type="button" class="btn ghost" data-a="patrones" ${c.piezas.length ? '' : 'disabled'}>${ico('chart-no-axes-column-increasing', 14)} Proponer los patrones de las piezas</button>` : ''}`;
}
function fatigaHtml(f) {
  return html`<div class="rcr-fat" data-estado="${f.estado}"><b>${f.estado === 'senal' ? 'Señal de fatiga' : f.estado === 'sin-senal' ? 'Sin señal de fatiga' : 'Fatiga sin datos'}</b>
    ${f.estado === 'sin-datos' ? html`<p class="rcr-sd">${f.fuente}</p>` : html`<p class="sm">CTR de 7 días ${f.ctr7}% contra ${f.ctr30}% de 30 días${f.caida_pct > 0 ? `: cayó ${f.caida_pct}%` : ''}. <span class="mut">Fuente: ${f.fuente}</span></p>`}</div>`;
}
function criterioHtml(c, ed) {
  const lista = clasificar(c.piezas, c.comparaciones), par = siguientePar(c.piezas, c.comparaciones);
  const evidencia = par ? evidenciaPar(par.a.id, par.b.id, c.comparaciones) : null;
  return html`<h3 class="rcr-t">${ico('chart-no-axes-column-increasing', 16)} Criterio entre piezas</h3>
    <p class="mut sm">Compara qué conviene repetir para esta marca. Elo ordena tus preferencias; las métricas de arriba muestran lo observado. Esto no prueba qué pieza causó más resultados.</p>
    ${par ? html`<div class="rcr-duelo" aria-label="Comparación sugerida">
      <div class="rcr-duelo-p"><span class="mut sm">Opción A</span><b>${par.a.titulo}</b></div><span class="mut">vs.</span><div class="rcr-duelo-p"><span class="mut sm">Opción B</span><b>${par.b.titulo}</b></div></div>
      <p class="mut sm">Este par: ${evidencia.n} ${evidencia.n === 1 ? 'comparación' : 'comparaciones'}${evidencia.n >= 3 ? ` · preferencia estimada por A: ${Math.round(evidencia.media * 100)}% (Bayes, todavía revisable)` : ' · evidencia escasa'}.</p>
      ${ed ? html`<label class="lbl" for="rcr-criterio-nota">Por qué eliges (opcional)</label><input class="in rcr-criterio-nota" id="rcr-criterio-nota" type="text" maxlength="240" placeholder="Ej.: comunica mejor la propuesta">
        <div class="rcr-acc"><button type="button" class="btn" data-a="elegir-a">Prefiero A</button><button type="button" class="btn" data-a="elegir-b">Prefiero B</button><button type="button" class="btn ghost" data-a="elegir-empate">Empate</button>${c.comparaciones.length ? html`<button type="button" class="btn ghost" data-a="deshacer-comparacion">Deshacer última</button>` : ''}</div>` : ''}`
      : html`<p class="rcr-sd">Se necesitan dos piezas publicadas del mismo mes para comparar.</p>`}
    ${lista.length && c.comparaciones.length ? html`<ol class="rcr-ranking">${lista.map((p) => html`<li><b>${p.titulo}</b><span class="mut sm">Elo ${p.rating} · ${p.n} comparaciones${p.provisional ? ' · provisional' : ''}</span></li>`)}</ol>` : ''}`;
}

export const vista = {
  nuevo(ctx) { return vacio(mesDe(hoyDe(ctx))); },

  pintar(el, { contenido, editable, onCambio, ctx, me, slug, docId } = {}) {
    const ed = Boolean(editable), nuevoDoc = !docId, hoy = hoyDe(ctx), c = base(contenido, mesDe(hoy)), S = { live: null, windsor: null, error: null, tok: 0 };
    mount(el, html`<div class="rcr" data-editable="${ed ? 1 : 0}">
      <section class="rcr-sec" aria-label="Scorecard por pieza"><h3 class="rcr-t">${ico('chart-no-axes-column-increasing', 16)} Piezas publicadas <span class="rcr-t-m" data-r="mes-n"></span></h3>
        <div data-r="aviso"></div><div data-r="base"></div><div data-r="piezas"></div>
        ${ed ? html`<div class="rcr-acc"><button type="button" class="btn ghost" data-a="leer">${ico('refresh-cw', 14)} Volver a leer el mes</button><button type="button" class="btn ghost" data-a="resultado" ${c.piezas.length ? '' : 'disabled'}>${ico('check', 14)} Guardar el resultado en cada pieza</button></div>` : ''}</section>
      <section class="rcr-sec" aria-label="Patrones y fatiga"><div data-r="patrones"></div><div class="rcr-bloque" data-r="fatiga"></div></section>
      <section class="rcr-sec" aria-label="Criterio entre piezas"><div data-r="criterio"></div></section>
      <section class="rcr-sec" aria-label="Lo que aprendimos"><label class="lbl" for="rcr-apr">Lo que aprendimos este mes</label>${ed
        ? html`<textarea class="in" id="rcr-apr" data-c="aprendizaje" rows="3" maxlength="800" placeholder="Una o dos frases: qué se repite y qué se ajusta">${c.aprendizaje}</textarea>`
        : c.aprendizaje ? html`<p class="rcr-ro">${c.aprendizaje}</p>` : html`<p class="rcr-sd">${SIN_DATOS}: falta lo que aprendimos del mes</p>`}
        <p class="mut sm">Es interno: nada de este análisis llega al portal del cliente.</p></section></div>`);
    const root = el.firstElementChild, region = (n) => root.querySelector(`[data-r="${n}"]`), vivo = () => root.isConnected;
    const emitir = () => { if (ed && typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };
    const aviso = () => {
      if (S.windsor === false) return html`<div class="rcr-conecta" role="status">${ico('triangle-alert', 14)} ${CONECTA_WINDSOR}</div>`;
      if (S.error) return html`${fallo({ titulo: 'No pude leer las piezas', linea: S.error.message || 'Inténtalo de nuevo en un momento.', detalle: techDetail(S.error) })}`;
      return '';
    };
    const pintar = () => {
      const mn = region('mes-n'); if (mn) mn.textContent = c.mes ? nombreMes(c.mes) : '';
      mount(region('aviso'), aviso());
      const b = c.base; mount(region('base'), html`<p class="rcr-base" data-estado="${b?.er != null ? 'ok' : 'sin-datos'}">${b?.er != null ? html`<b>Línea base de la marca:</b> ER ${b.er}% <span class="mut sm">· ${b.fuente}</span>` : b ? b.fuente : (S.live ? SIN_METRICAS : 'Leyendo las piezas del mes…')}</p>`);
      mount(region('piezas'), c.piezas.length ? html`<div class="rcr-grid">${c.piezas.map((p, i) => tarjeta(p, ed, i))}</div>` : html`<p class="rcr-sd">${S.live ? (S.windsor === false ? CONECTA_WINDSOR : SIN_METRICAS) : 'Leyendo las piezas del mes…'}</p>`);
      mount(region('patrones'), patronesHtml(c, ed)); mount(region('fatiga'), fatigaHtml(c.fatiga)); mount(region('criterio'), criterioHtml(c, ed));
      const r = root.querySelector('[data-a="resultado"]'); if (r) r.disabled = !c.piezas.length;
    };
    // Lo medido pasa al entregable conservando lo escrito (notas, lecciones, aprendizaje).
    const aplicar = (live) => {
      const notas = new Map(c.piezas.map((p) => [p.id, p.nota])), lec = new Map(c.patrones.map((x) => [`${x.dimension}|${x.valor}`, x.leccion]));
      const n = limpiar({ ...live, piezas: live.piezas.map((p) => ({ ...p, nota: notas.get(p.id) || '' })), patrones: live.patrones.map((x) => ({ ...x, leccion: lec.get(`${x.dimension}|${x.valor}`) || '' })), comparaciones: c.comparaciones, aprendizaje: c.aprendizaje });
      Object.assign(c, n, { mes: c.mes || n.mes }); emitir(); pintar();
    };
    async function cargar({ aplicarYa = false } = {}) {
      const tok = ++S.tok, mes = mesOk(c.mes) ? c.mes : mesDe(hoy); S.error = null; S.live = null;
      try {
        const [todas, ig, a7, a30] = await Promise.all([col('content').list(), api(`analytics/instagram?profile=${enc(slug)}`).catch(() => null), api('ads/report?days=7').catch(() => null), api('ads/report?days=30').catch(() => null)]);
        if (tok !== S.tok || !vivo()) return;
        S.windsor = ig === null ? null : Boolean(ig.connected);
        const suyas = todas.filter((p) => p.profile === slug && p.kind === 'post' && publicada(p)), delMes = suyas.filter((p) => mesDe(p.date) === mes).slice(0, 12);
        // Lo que Laya dijo antes de publicar (una lectura por pieza del mes; las que fallan quedan sin juicio, no sin pieza).
        const lays = await Promise.all(delMes.map((p) => api(`laya/juicios?coll=content&id=${enc(p.id)}`).then(layaDe).catch(() => null)));
        if (tok !== S.tok || !vivo()) return;
        const piezas = delMes.map((p, i) => normalizar(p, lays[i])).filter((p) => p.id), historicas = suyas.map((p) => normalizar(p, null)).filter((p) => p.metricas.er !== undefined);
        const ct = (r) => { const x = r?.on === false ? null : r?.clients?.find((k) => k.slug === slug); return x?.plats && Object.keys(x.plats).length ? { imp: x.total?.imp ?? null, clicks: x.total?.clicks ?? null } : null; };
        const p7 = ct(a7), p30 = ct(a30), pct = (x) => (x && x.imp > 0 ? Math.round((x.clicks / x.imp) * 10000) / 100 : null);
        const fatiga = fatigaDe({ conectado: Boolean(p7 || p30), ctr7: pct(p7), ctr30: pct(p30), imp7: p7?.imp ?? null });
        S.live = armar({ mes, piezas, historicas, fatiga });
        recordarRendimiento(slug, S.live);
      } catch (e) { if (tok !== S.tok || !vivo()) return; S.error = e; }
      if (tok !== S.tok || !vivo()) return;
      // Un borrador nuevo arranca con lo medido; uno ya guardado conserva su foto hasta que se pida leer otra vez.
      if (S.live && ed && (aplicarYa || (nuevoDoc && !c.piezas.length))) aplicar(S.live); else pintar();
    }
    pintar(); cargar().catch(() => {});

    root.addEventListener('input', (e) => { const t = e.target, k = t?.dataset?.c; if (!ed || !k || !root.contains(t)) return; ponerRuta(c, k, t.value); emitir(); });
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]'); if (!b || !root.contains(b) || !ed) return;
      const a = b.dataset.a;
      if (a === 'elegir-a' || a === 'elegir-b' || a === 'elegir-empate') {
        const par = siguientePar(c.piezas, c.comparaciones); if (!par) return;
        c.comparaciones.push({ id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, a: par.a.id, b: par.b.id,
          resultado: a === 'elegir-a' ? 'a' : a === 'elegir-b' ? 'b' : 'empate', fecha: new Date().toISOString(), nota: root.querySelector('#rcr-criterio-nota')?.value || '' });
        c.comparaciones = limpiar(c).comparaciones; emitir(); pintar(); return;
      }
      if (a === 'deshacer-comparacion') { c.comparaciones.pop(); emitir(); pintar(); return; }
      if (a === 'leer') { cargar({ aplicarYa: true }).catch(() => {}); return; }
      if (a === 'patrones') { const n = patrones(c.piezas, c.base).map((x) => ({ ...x, leccion: c.patrones.find((y) => y.dimension === x.dimension && y.valor === x.valor)?.leccion || '' })); c.patrones = limpiar({ ...c, patrones: n }).patrones; emitir(); pintar(); return; }
      if (a === 'resultado') {
        b.disabled = true; let ok = 0, mal = 0;
        for (const p of c.piezas.filter((x) => x.nivel !== 'sin-datos')) {
          try { const doc = await col('content').get(p.id); await col('content').save({ ...doc, resultado: resultadoDePieza(p, c.mes) }); ok++; } catch { mal++; }
        }
        if (vivo()) { b.disabled = false; toast(mal ? `Resultado guardado en ${ok} piezas; ${mal} no se pudieron guardar` : `Resultado guardado en ${ok} ${ok === 1 ? 'pieza' : 'piezas'}`, Boolean(mal && !ok)); }
      }
    });
  },

  // Para comparar versiones y para la propuesta de la IA: el mes, las piezas con su nivel y los patrones.
  resumen(contenido) {
    const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {}));
    return html`<div class="rcr-res"><span class="chip">${c.mes ? nombreMes(c.mes) : `Mes: ${SIN_DATOS}`}</span> <span class="chip">${c.piezas.length} ${c.piezas.length === 1 ? 'pieza' : 'piezas'}</span> <span class="chip">${c.patrones.length} de ${MAX_PATRONES} patrones</span> <span class="chip">${c.comparaciones.length} comparaciones humanas</span>
      ${c.patrones.length ? html`<ul>${c.patrones.map((p) => html`<li>${nom(p.dimension, DIMENSIONES)}: ${p.valor}<span class="mut sm"> · ${p.leccion || SIN_DATOS}</span></li>`)}</ul>` : ''}
      ${c.aprendizaje ? html`<p>${c.aprendizaje}</p>` : html`<p class="mut sm">${SIN_DATOS}: falta lo que aprendimos</p>`}</div>`;
  },
};
