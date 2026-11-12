// Ads Intelligence (herramienta ads-intelligence de Marketing › Campaigns): el dashboard de la pauta de un cliente (gasto del mes contra el
// presupuesto aprobado accounts.ads.ok, CTR, CPA, ROAS, gasto diario y la tabla por campaña, conjunto y anuncio, todo de Windsor), las
// recomendaciones (las calculadas por ads.js y las que pide a la IA: la persona confirma) guardadas como entregables, y dos sub-vistas:
// Variaciones de anuncio (ads-ui.js) y Anuncios de la competencia (competencia-ui.js). resto[0] puede ser 'variaciones' o 'competencia'.
// SOLO LEE Y RECOMIENDA: nunca escribe en una plataforma de anuncios (Windsor y AdWhispr son de solo lectura). Una recomendación se vuelve
// una tarea para ⑩ Ads o, si toca presupuesto o pausa, espera el OK del CEO (accounts.ads.ok, que el CEO da en Mis tareas › Ads).
// Los montos (gasto, presupuesto, CPA, CPC) los quita el servidor a quien no ve costos: aquí solo se dice por qué faltan.
// Pinta con html`…` (todo se escapa; lo que dice un modelo pasa por limpiarRec/leer de ads.js y nunca por raw()). Lo vacío dice «⚠️ SIN DATOS».
import { html, raw, mount, api, ico, toast, confirmAsk, skel, fdate, $ } from '../core.js';
import { bars, PAL } from '../charts.js';
import { herramientaDe, rutaHerramienta } from '../herramientas.js';
import { hoyGT } from '../avisos-reglas/base.js';
import { armarCtx, correrIA } from '../ia-herramienta.js';
import { adsUI } from '../ads-ui.js';
import { competenciaUI } from './competencia-ui.js';
import * as A from './ads.js';
import { vacio } from '../visual.js';

const K_DIAS = 'os.ain.dias';
const DIAS = [7, 30, 90];
const SUBS = [['resumen', 'Resumen'], ['variaciones', 'Variaciones'], ['competencia', 'Competencia']];
const NIVELES = [['campanas', 'Campañas'], ['conjuntos', 'Conjuntos'], ['anuncios', 'Anuncios']];
const PLAT = { meta: 'Meta', google: 'Google Ads', linkedin: 'LinkedIn' };
const ORIGEN = { calculada: 'Calculada', ia: 'IA' };
const enc = encodeURIComponent;
const Qn = (v) => (v == null ? '—' : `Q${Math.round(v).toLocaleString('en-US')}`);
const Q2 = (v) => (v == null ? '—' : `Q${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const num = (v, d = 0) => (v == null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: d }));
const sd = (deDonde) => html`<span class="ain-sd mut sm">sale de ${deDonde}</span>`; // el valor ya dice ⚠️ SIN DATOS: esto dice de dónde saldría
const sinCostos = html`<span class="ain-sd ain-costos">${ico('lock', 12)} ${A.FUENTE_COSTOS}</span>`;

// host: dónde se monta · me: quien mira · slug/b: el cliente · alive(): ¿sigue en pantalla? · resto: lo que viene en la ruta.
export async function adsIntelTool(host, { me, slug, b, alive = () => true, resto = [] } = {}) {
  mount(host, skel('pagina'));
  const HOY = hoyGT(), nombre = b?.name || slug;
  const S = { sub: SUBS.some(([k]) => k === resto[0]) ? resto[0] : 'resumen', dias: 30, nivel: 'campanas', rep: undefined, docs: null, docsError: '', puede: {}, alcance: null, ia: null, ctrl: null, ocupado: false, calc: [] };
  try { const d = Number(localStorage.getItem(K_DIAS)); if (DIAS.includes(d)) S.dias = d; } catch { /* sin almacenamiento */ }
  const yo = (host.__ainId = (host.__ainId || 0) + 1); // si el mismo host se monta otra vez, la vez anterior deja de pintar
  const vivo = () => alive() && host.isConnected && host.__ainId === yo;
  const cliente = () => (S.rep?.on ? S.rep.clients?.find((x) => x.slug === slug) || null : null);
  const costos = () => S.rep?.costos === true;
  const editar = () => Boolean(S.puede.editar) && (!S.alcance || S.alcance.abierto !== false);
  const datos = () => { const c = cliente(); return c ? A.datosDe(c, { dias: S.dias, hoy: HOY }) : null; };

  // ---------- Leer ----------
  const leerDocs = () => api(`entregables?ws=marketing&slug=${enc(slug)}&tool=${A.TOOL}`)
    .then((r) => { S.docs = Array.isArray(r.items) ? r.items : []; S.puede = r.puede || {}; S.alcance = r.alcance || null; S.docsError = ''; })
    .catch((e) => { S.docs = []; S.docsError = e.message; });
  const leerReporte = () => api(`ads/report?days=${S.dias}`).then((r) => { S.rep = r; }).catch((e) => { S.rep = { error: e.message, status: e.status }; });
  async function cargar() {
    S.rep = undefined; if (S.sub === 'resumen') pintarCuerpo();
    await Promise.all([leerReporte(), S.docs === null ? leerDocs() : Promise.resolve()]);
    if (!vivo()) return;
    if (S.sub === 'resumen') { pintarResumen(); pintarRecs(); }
    pintarChips();
  }

  // ---------- Pantalla ----------
  mount(host, html`<div class="ain" data-tool="${A.TOOL}"><header class="ain-head"><div class="ain-head-t"><h2>${ico('megaphone', 16)} Ads Intelligence</h2><span class="ain-cli">${nombre}</span></div><div class="ain-head-m" id="ain-chips"></div></header>
    <p class="ain-aviso mut sm">${ico('lock', 12)} Aquí se mira y se recomienda. Nada se cambia en las cuentas de anuncios: una recomendación es una tarea para ⑩ Ads o espera el OK del CEO.</p>
    <nav class="tabs mini ain-subs" role="tablist" aria-label="Ads Intelligence" id="ain-subs"></nav><div id="ain-cuerpo"></div></div>`);

  function pintarSubs() {
    const el = $('#ain-subs', host); if (!el) return;
    mount(el, html`${SUBS.map(([k, l]) => html`<button type="button" role="tab" class="${S.sub === k ? 'on' : ''}" aria-selected="${S.sub === k ? 'true' : 'false'}" data-ain="sub" data-k="${k}">${l}</button>`)}`);
  }
  function pintarChips() {
    const el = $('#ain-chips', host); if (!el) return;
    const r = S.rep, c = cliente();
    mount(el, html`${r?.on ? html`<span class="chip lime">Windsor conectado</span>` : r && !r.error ? html`<span class="chip">Sin Windsor</span>` : ''}
      ${c?.ok?.vigente ? html`<span class="chip lime" title="El CEO aprobó el presupuesto de este mes">${ico('check', 12)} OK del CEO de ${c.ok.month}</span>` : c ? html`<span class="chip" title="El CEO lo da en Mis tareas › Ads">${ico('lock', 12)} Sin OK del CEO este mes</span>` : ''}`);
  }
  function pintarCuerpo() {
    if (!vivo()) return;
    pintarSubs(); pintarChips();
    const box = $('#ain-cuerpo', host); if (!box) return;
    if (S.sub === 'variaciones') {
      mount(box, html`<div class="ain-sec"><p class="mut sm">Variaciones de anuncio por avatar. Solo el CEO aprueba y lanza; «Lanzar» crea la tarea para ⑩ Ads y el OS no toca ninguna cuenta.</p><div id="ain-var"></div></div>`);
      return void adsUI($('#ain-var', box), { me, b, alive: vivo });
    }
    if (S.sub === 'competencia') {
      mount(box, html`<div class="ain-sec"><div id="ain-comp"></div></div>`);
      return void competenciaUI($('#ain-comp', box), { me, slugs: [slug], alive: vivo });
    }
    mount(box, html`<div id="ain-res"></div><section class="ain-sec ain-recs" id="ain-recs"></section>`);
    pintarResumen(); pintarRecs();
  }

  // ---------- Resumen: los KPIs, el gasto diario y la tabla ----------
  const erroresDe = (rep) => Object.entries(rep?.errors || {}).map(([k, e]) => { const [p, t] = k.split(':'); return html`<div><b>${PLAT[p] || p}${t ? ' (tabla)' : ''}</b>: ${/no .*accounts? .*configured|not configured|401|403/i.test(e) ? 'conecta la cuenta en Windsor' : e}</div>`; });
  function kpis(c) {
    const k = c ? A.kpisDe(c.total) : null, cos = costos(), gm = c ? A.gastoDelMes(c.series, { hoy: HOY, dias: S.dias }) : null;
    const apr = c?.ok?.vigente ? c.ok.budget : null;
    let gasto;
    if (!c) gasto = html`<div class="ain-kpi-v">${A.SIN_DATOS}</div>${sd('Windsor: las cuentas de pauta de este cliente')}`;
    else if (!cos) gasto = html`<div class="ain-kpi-v">—</div>${sinCostos}`;
    else if (gm && gm.cubre) {
      const pct = apr ? Math.round((gm.gasto / apr) * 100) : null;
      gasto = html`<div class="ain-kpi-v">${Qn(gm.gasto)}</div><span class="mut sm">${apr ? `de ${Qn(apr)} aprobados · ${pct}%` : `sin OK del CEO este mes${c.budget ? ` · el cliente puso ${Qn(c.budget)}` : ''}`}</span>
        ${apr ? html`<div class="ctlbar ain-bar"><i style="width:${Math.min(100, pct)}%;${pct > 100 ? 'background:#654c38' : ''}"></i></div>` : ''}`;
    } else if (k?.gasto != null) gasto = html`<div class="ain-kpi-v">${Qn(k.gasto)}</div><span class="mut sm">en los últimos ${S.dias} días. Para compararlo con el presupuesto del mes elige 30 o 90 días.</span>`;
    else gasto = html`<div class="ain-kpi-v">${A.SIN_DATOS}</div>${sd('Windsor (el gasto de las cuentas de pauta)')}`;
    const ctr = k?.ctr != null ? html`<div class="ain-kpi-v">${num(k.ctr, 2)}%</div><span class="mut sm">${num(k.clics)} clics · ${num(k.imp)} impresiones</span>` : html`<div class="ain-kpi-v">${A.SIN_DATOS}</div>${sd('Windsor (clics e impresiones)')}`;
    const cpa = !c ? html`<div class="ain-kpi-v">${A.SIN_DATOS}</div>${sd('Windsor (gasto y conversiones)')}` : !cos ? html`<div class="ain-kpi-v">—</div>${sinCostos}`
      : k.cpa != null ? html`<div class="ain-kpi-v">${Q2(k.cpa)}</div><span class="mut sm">${num(k.conv)} conversiones</span>`
      : k.conv === 0 ? html`<div class="ain-kpi-v">—</div><span class="mut sm">0 conversiones en el periodo: no hay CPA</span>`
      : html`<div class="ain-kpi-v">${A.SIN_DATOS}</div>${sd('Windsor (las conversiones de la cuenta: el conector no las mandó)')}`;
    const roas = k?.roas != null ? html`<div class="ain-kpi-v">${num(k.roas, 2)}x</div><span class="mut sm">lo que vendió la pauta por cada quetzal</span>` : html`<div class="ain-kpi-v">${A.SIN_DATOS}</div>${sd('Windsor (el valor de las conversiones: el conector no lo mandó)')}`;
    return html`<div class="ain-kpis"><div class="ain-kpi"><span class="lbl">Gasto del mes vs presupuesto aprobado</span>${gasto}</div><div class="ain-kpi"><span class="lbl">CTR</span>${ctr}</div>
      <div class="ain-kpi"><span class="lbl">CPA</span>${cpa}</div><div class="ain-kpi"><span class="lbl">ROAS</span>${roas}</div></div>`;
  }
  // El gasto diario (por semana si el periodo es largo) con charts.js: solo para quien ve costos y solo con la serie de Windsor.
  function grafica(c) {
    const g = A.gastoPorPeriodo(c.series);
    if (g.puntos.length < 2) return '';
    return html`<div class="ain-grafica"><span class="lbl">${g.paso === 'dia' ? 'Gasto diario (Q, por día del mes)' : 'Gasto por semana (Q, desde el lunes de cada una)'} · Windsor</span>
      ${bars(g.puntos.map((p) => ({ label: g.paso === 'dia' ? String(Number(p.fecha.slice(8))) : fdate(p.fecha), values: [p.gasto] })), [{ name: 'Gasto', c: PAL.brown }], { h: 150, empty: 'Sin gasto en este periodo' })}</div>`;
  }
  function tabla(c) {
    const t = c?.tabla, cos = costos();
    const filas = Array.isArray(t?.[S.nivel]) ? t[S.nivel] : [];
    const nivelNom = NIVELES.find(([k]) => k === S.nivel)[1];
    const cab = html`<div class="ain-sec-h"><h3>Por campaña, conjunto y anuncio</h3><div class="tabs mini">${NIVELES.map(([k, l]) => html`<button type="button" class="${S.nivel === k ? 'on' : ''}" data-ain="nivel" data-k="${k}">${l}${t ? html` <span class="mut">${(t[k] || []).length}</span>` : ''}</button>`)}</div></div>`;
    if (!c) return html`<section class="ain-sec">${cab}<p class="mut sm">${A.SIN_DATOS}: la tabla sale de Windsor (campaña, conjunto y anuncio de las cuentas de pauta de este cliente).</p></section>`;
    if (!t || t.error) return html`<section class="ain-sec">${cab}<p class="mut sm">${A.SIN_DATOS}: ${t?.error || 'Windsor no devolvió la tabla por campaña'}. Sale de Windsor y se guarda 6 horas.</p></section>`;
    const aviso = html`${t.viejo ? html`<p class="warnbox sm">Windsor no respondió: esta es la última tabla que se guardó (${t.at ? fdate(t.at.slice(0, 10)) : '—'}).</p>` : ''}${t.parcial?.length ? html`<p class="warnbox sm">Faltó la tabla de ${t.parcial.map((p) => PLAT[p] || p).join(', ')}: Windsor no la devolvió.</p>` : ''}`;
    return html`<section class="ain-sec">${cab}${aviso}${filas.length ? html`<div class="ain-tabla"><table class="wktable"><thead><tr><th>${nivelNom.slice(0, -1)}</th>${cos ? html`<th class="n">Gasto</th>` : ''}<th class="n">Impr.</th><th class="n">Clics</th><th class="n">CTR</th>${cos ? html`<th class="n">CPC</th>` : ''}<th class="n">Conv.</th>${cos ? html`<th class="n">CPA</th>` : ''}<th class="n">ROAS</th></tr></thead><tbody>
      ${filas.map((f) => { const m = A.metricasDe(f); return html`<tr><td><b style="font-weight:500">${f.nombre}</b> <span class="chip sm2 ain-plat">${PLAT[f.plat] || f.plat}</span>${S.nivel !== 'campanas' && f.campana ? html`<div class="mut sm">${f.campana}${S.nivel === 'anuncios' && f.conjunto ? ` · ${f.conjunto}` : ''}</div>` : ''}</td>
        ${cos ? html`<td class="n">${Qn(f.gasto)}</td>` : ''}<td class="n">${num(f.imp)}</td><td class="n">${num(f.clics)}</td><td class="n">${m.ctr != null ? `${num(m.ctr, 2)}%` : '—'}</td>${cos ? html`<td class="n">${Q2(m.cpc)}</td>` : ''}<td class="n">${num(f.conv)}</td>${cos ? html`<td class="n">${Q2(m.cpa)}</td>` : ''}<td class="n">${m.roas != null ? `${num(m.roas, 2)}x` : '—'}</td></tr>`; })}</tbody></table></div>
      <p class="mut sm ain-nota">— = ${A.SIN_DATOS}: Windsor no mandó ese campo para ese nivel. Fuente: Windsor${t.at ? ` · leído ${fdate(t.at.slice(0, 10))}${t.cache ? ' (caché de 6 horas)' : ''}` : ''}.${cos ? '' : ` Gasto, CPC y CPA: ${A.FUENTE_COSTOS}.`}</p>`
      : html`<p class="mut sm">${A.SIN_DATOS}: Windsor no devolvió ${nivelNom.toLowerCase()} para las cuentas de este cliente en estos ${S.dias} días.</p>`}</section>`;
  }
  function pintarResumen() {
    const el = $('#ain-res', host); if (!el) return;
    const dias = html`<div class="tabs mini ain-dias" role="tablist" aria-label="Periodo">${DIAS.map((d) => html`<button type="button" role="tab" class="${d === S.dias ? 'on' : ''}" aria-selected="${d === S.dias ? 'true' : 'false'}" data-ain="dias" data-d="${d}">${d} días</button>`)}</div>`;
    const r = S.rep;
    if (r === undefined) return mount(el, html`<section class="ain-sec"><div class="ain-sec-h"><h3>Cómo va la pauta</h3>${dias}</div>${skel('fila', 3)}</section>`);
    if (r?.error) {
      const sin = r.status === 403;
      return mount(el, html`<section class="ain-sec"><div class="ain-sec-h"><h3>Cómo va la pauta</h3>${dias}</div>${sin ? html`${vacio({ icono: 'lock', titulo: 'Tu perfil no lee la pauta', linea: `${r.error}. Las variaciones de anuncio sí están en su pestaña.` })}` : html`<div class="warnbox">${r.error}</div>`}</section>${kpis(null)}`);
    }
    const c = cliente();
    const aviso = !r.on ? html`${vacio({ icono: 'inbox', titulo: 'Conecta Windsor', linea: 'Las cuentas de pauta todavía no están conectadas al OS. Pídeselo a quien administra la app; mientras, esto queda vacío y cada número dice de dónde saldrá.' })}`
      : !c ? html`${vacio({ icono: 'inbox', titulo: 'Este cliente no tiene cuentas de pauta', linea: 'Agrégalas en Mis tareas › Ads › Cuentas (Meta, Google Ads o LinkedIn) y aquí aparece su pauta.' })}` : '';
    const errs = erroresDe(r);
    mount(el, html`<section class="ain-sec"><div class="ain-sec-h"><h3>Cómo va la pauta</h3>${dias}</div><p class="mut sm">Últimos ${S.dias} días · Meta, Google Ads y LinkedIn vía Windsor (solo lectura).</p>
      ${aviso}${errs.length ? html`<div class="warnbox sm" style="margin:8px 0">${errs}</div>` : ''}${kpis(c)}
      ${c && costos() ? grafica(c) : ''}</section>${tabla(c)}`);
  }

  // ---------- Recomendaciones ----------
  const guardadas = () => (S.docs || []).filter((d) => !d.archivado).map((d) => ({ d, r: A.limpiarRec(d.contenido) }))
    .filter(({ d, r }) => A.recValida(r) || (d.costs_hidden && r.tipo && r.accion));
  function evidencia(r, oculto) {
    return oculto && A.esMonto(r.evidencia.metrica) ? html`${r.evidencia.metrica}: ${A.FUENTE_COSTOS} · ${r.evidencia.periodo}` : html`${A.textoEvidencia(r)}`;
  }
  function tarjeta(r, { doc = null, src = 'calc', i = 0 } = {}) {
    const oculto = Boolean(doc?.costs_hidden), ok = cliente()?.ok;
    const ed = editar(), conTarea = Boolean(doc?.tareas?.length);
    return html`<article class="ain-rec" data-ceo="${r.requiere_ceo ? 1 : 0}"><header class="ain-rec-h"><span class="chip sm2">${A.nombreTipo(r.tipo)}</span>${r.donde.nombre ? html`<span class="ain-rec-d">${r.donde.nombre}</span>` : ''}<span class="sp"></span>${r.origen ? html`<span class="chip sm2">${ORIGEN[r.origen]}</span>` : ''}${doc ? html`<span class="chip sm2" data-estado="${doc.estado || 'Borrador'}">${doc.estado || 'Borrador'}</span>` : ''}</header>
      <p class="ain-rec-acc">${r.accion}</p>
      <p class="ain-rec-ev">${ico('chart-column', 12)} ${evidencia(r, oculto)}</p>${r.detalle && !oculto ? html`<p class="mut sm">${r.detalle}</p>` : ''}
      <p class="mut sm ain-rec-regla">${ico('book-open', 12)} ${r.regla}</p>
      ${r.requiere_ceo ? html`<p class="ain-ceo">${ico('lock', 13)} <span><b>Necesita el OK del CEO.</b> ${ok?.vigente ? `Hay OK de ${ok.month}.` : 'Todavía no hay OK de este mes.'} El CEO lo da en <a href="#/work/zona/ads">Mis tareas › Ads</a>.</span></p>` : ''}
      <footer class="ain-rec-f">${doc ? html`${conTarea ? html`<span class="chip sm2 lime">${ico('check', 11)} Tarea creada para ⑩ Ads</span>` : ed ? html`<button type="button" class="btn sm" data-ain="tarea" data-id="${doc.id}" ${S.ocupado ? raw('disabled') : ''}>${ico('list-checks', 13)} Crear tarea para ⑩ Ads</button>` : ''}${ed ? html`<button type="button" class="btn ghost sm" data-ain="archivar" data-id="${doc.id}" ${S.ocupado ? raw('disabled') : ''}>Archivar</button>` : ''}`
        : ed ? html`<button type="button" class="btn sm" data-ain="tarea-nueva" data-src="${src}" data-i="${i}" ${S.ocupado ? raw('disabled') : ''}>${ico('list-checks', 13)} Crear tarea para ⑩ Ads</button><button type="button" class="btn ghost sm" data-ain="guardar" data-src="${src}" data-i="${i}" ${S.ocupado ? raw('disabled') : ''}>Guardar</button>${src === 'ia' ? html`<button type="button" class="btn ghost sm" data-ain="quitar" data-i="${i}">Descartar</button>` : ''}` : ''}</footer></article>`;
  }
  function panelIA() {
    const ia = S.ia;
    if (!ia) return '';
    if (ia.fase === 'corriendo') return html`<div class="ain-ia"><span class="lbl">La IA está leyendo la tabla…</span><pre class="ain-ia-t">${ia.texto || ia.paso || 'Pidiéndole recomendaciones con los números de la tabla'}</pre><button type="button" class="btn ghost sm" data-ain="ia-cancelar">Cancelar</button></div>`;
    if (ia.fase === 'error') return html`<div class="warnbox sm">${ia.error} <button type="button" class="linkish sm" data-ain="ia">Reintentar</button></div>`;
    const guardadasClaves = new Set(guardadas().map(({ r }) => r.clave)), pend = ia.recs.map((r, i) => ({ r, i })).filter(({ r }) => !guardadasClaves.has(r.clave));
    const descartes = [ia.sin_numeros ? `${ia.sin_numeros} sin números` : '', ia.inventadas ? `${ia.inventadas} con números que no están en la tabla` : ''].filter(Boolean).join(' y ');
    return html`<div class="ain-ia-r"><div class="ain-sec-h"><h4>Propuestas de la IA <span class="mut sm">· ${ia.modelo || ia.via} · revísalas antes de guardar</span></h4>${pend.length > 1 && editar() ? html`<button type="button" class="btn ghost sm" data-ain="guardar-ia" ${S.ocupado ? raw('disabled') : ''}>Guardar todas</button>` : ''}</div>
      ${descartes ? html`<p class="mut sm">Descarté ${descartes}: una recomendación sin números de la tabla no se muestra.</p>` : ''}
      ${pend.length ? html`<div class="ain-lista">${pend.map(({ r, i }) => tarjeta(r, { src: 'ia', i }))}</div>` : html`<p class="mut sm">La IA no propuso nada nuevo con estos números.</p>`}</div>`;
  }
  function pintarRecs() {
    const el = $('#ain-recs', host); if (!el || !vivo()) return;
    const c = cliente(), g = guardadas(), claves = new Set(g.map(({ r }) => r.clave));
    const calc = c ? A.recomendaciones(datos()).filter((r) => !claves.has(r.clave)) : [];
    S.calc = calc;
    const corriendo = S.ia?.fase === 'corriendo';
    mount(el, html`<div class="ain-sec-h"><h3>Recomendaciones</h3><button type="button" class="btn sm" data-ain="ia" ${!c || corriendo || S.ocupado ? raw('disabled') : ''} title="${c ? 'Le pasa la tabla a la IA: solo puede usar esos números' : 'Sin datos de Windsor no hay qué pedirle a la IA'}">${ico('sparkles', 13)} Pedir recomendaciones a la IA</button></div>
      <p class="mut sm">Un cambio a la vez, y nada sin datos suficientes (ad-corrida §1). Cada recomendación trae su evidencia: sin números no se muestra.</p>
      ${S.alcance?.abierto === false ? html`<div class="warnbox sm">${S.alcance.texto || 'Este cliente no tiene ficha de oferta: no se pueden guardar recomendaciones.'}</div>` : ''}
      ${S.docsError ? html`<div class="warnbox sm">No pude leer las recomendaciones guardadas: ${S.docsError}</div>` : !S.puede.editar && S.docs ? html`<p class="mut sm">Tu perfil solo las lee: guardarlas y crear tareas es de quien edita Contenido.</p>` : ''}
      ${panelIA()}
      <h4 class="ain-sub-h">Calculadas con la tabla</h4>
      ${!c ? html`<p class="mut sm">${A.SIN_DATOS}: se calculan con la tabla de Windsor de este cliente.</p>` : calc.length ? html`<div class="ain-lista">${calc.map((r, i) => tarjeta(r, { src: 'calc', i }))}</div>`
        : html`<p class="mut sm">Con estos números no hay nada que mover${costos() ? '' : ` (sin montos no se calculan el CPA ni el ritmo del gasto: ${A.FUENTE_COSTOS})`}.</p>`}
      <h4 class="ain-sub-h">Guardadas</h4>
      ${S.docs === null ? skel('fila', 2) : g.length ? html`<div class="ain-lista">${g.map(({ d, r }) => tarjeta(r, { doc: d }))}</div>` : html`<p class="mut sm">Todavía no hay recomendaciones guardadas. Guarda una y queda como entregable de Ads Intelligence (versiones y tareas incluidas).</p>`}`);
  }

  // ---------- Acciones ----------
  const falla = (e) => { if (e?.name === 'AbortError') return; toast(e?.message || 'No se pudo completar. Inténtalo de nuevo.', true); if (e?.code === 'CONFLICTO') leerDocs().then(() => vivo() && pintarRecs()); };
  async function haz(fn) {
    if (S.ocupado) return;
    S.ocupado = true; pintarRecs();
    try { await fn(); } catch (e) { if (vivo()) falla(e); }
    S.ocupado = false; if (vivo()) pintarRecs();
  }
  const origenDe = (src, i) => (src === 'ia' ? S.ia?.recs?.[i] : S.calc?.[i]);
  const iaDe = (src) => (src === 'ia' ? { via: ['hermes', 'puente', 'claude-web'].includes(S.ia?.via) ? S.ia.via : 'manual', modelo: S.ia?.modelo || '' } : { via: 'manual', modelo: 'Cálculo del OS' });
  async function guardar(r, src) {
    const d = await api('entregables', { method: 'POST', body: { tool: A.TOOL, client_slug: slug, titulo: A.tituloRec(r), ciclo: HOY.slice(0, 7), contenido: r, ia: iaDe(src) } });
    S.docs = [d, ...(S.docs || [])]; return d;
  }
  async function conTarea(doc) {
    const r = A.limpiarRec(doc.contenido), t = A.tareaDeRec(r);
    if (doc.costs_hidden) t.por_que = `Evidencia: ${A.FUENTE_COSTOS}${r.requiere_ceo ? ' · Necesita el OK del CEO antes de moverse (Mis tareas › Ads)' : ''}`;
    const x = await api(`entregables/${enc(doc.id)}/tareas`, { method: 'POST', body: { v: doc.v, tareas: [t] } });
    toast(x.creadas?.length ? 'Tarea creada para ⑩ Ads' : 'Esa recomendación ya tenía su tarea');
    await leerDocs();
  }
  function pedirIA() {
    const c = cliente(), d = datos(); if (!c || !d || S.ia?.fase === 'corriendo') return;
    const ctrl = new AbortController(); S.ctrl = ctrl; S.ia = { fase: 'corriendo', texto: '', paso: '' }; pintarRecs();
    (async () => {
      // La herramienta del registro con el pedido y el bloque de ads.js: correrIA() los usa; la persona revisa y guarda.
      const T = { id: A.TOOL, ws: 'marketing', nombre: 'Ads Intelligence', ...herramientaDe(A.TOOL), prompt: A.prompt, bloque: A.BLOQUE };
      const ctx = { ...(await armarCtx(me, { tool: T, slug })), ads: d };
      const out = await correrIA(me, { tool: T, ctx, signal: ctrl.signal, onDelta: (t) => { if (S.ia?.fase === 'corriendo') { S.ia.texto = String(t || '').slice(-600); const p = $('.ain-ia-t', host); if (p) p.textContent = S.ia.texto; } }, onTool: (p) => { if (S.ia?.fase === 'corriendo') S.ia.paso = String(p || '').slice(0, 120); } });
      const r = A.leer(out.texto, d);
      S.ia = r ? { fase: 'lista', ...r, via: out.via, modelo: out.modelo } : { fase: 'error', error: 'No pude leer recomendaciones en la respuesta de la IA. Inténtalo otra vez.' };
    })().catch((e) => { S.ia = e?.name === 'AbortError' ? null : { fase: 'error', error: e?.message || 'La IA no respondió.' }; }).then(() => vivo() && pintarRecs());
  }

  const onClick = (e) => {
    const t = e.target.closest('[data-ain]'); if (!t || !host.contains(t)) return;
    const a = t.dataset.ain, id = t.dataset.id, doc = (S.docs || []).find((x) => x.id === id), src = t.dataset.src, i = Number(t.dataset.i);
    if (a === 'sub') { S.sub = t.dataset.k; try { history.replaceState(null, '', rutaHerramienta('marketing', slug, A.TOOL, S.sub === 'resumen' ? [] : [S.sub])); } catch { /* sin historial */ } return pintarCuerpo(); }
    if (a === 'dias') { S.dias = Number(t.dataset.d); try { localStorage.setItem(K_DIAS, String(S.dias)); } catch { /* sin almacenamiento */ } S.ia = null; return void cargar(); }
    if (a === 'nivel') { S.nivel = t.dataset.k; return pintarResumen(); }
    if (a === 'ia') return pedirIA();
    if (a === 'ia-cancelar') return void S.ctrl?.abort();
    if (a === 'quitar') { S.ia?.recs?.splice(i, 1); return pintarRecs(); }
    if (a === 'guardar') return void haz(async () => { const r = origenDe(src, i); if (r) { await guardar(r, src); toast('Guardada: queda como entregable de Ads Intelligence'); } });
    if (a === 'tarea-nueva') return void haz(async () => { const r = origenDe(src, i); if (r) await conTarea(await guardar(r, src)); });
    if (a === 'guardar-ia') return void haz(async () => {
      const claves = new Set(guardadas().map((x) => x.r.clave)); let n = 0;
      for (const r of (S.ia?.recs || []).filter((x) => !claves.has(x.clave))) { await guardar(r, 'ia'); n++; }
      toast(`${n} guardada${n === 1 ? '' : 's'}`);
    });
    if (a === 'tarea' && doc) return void haz(() => conTarea(doc));
    if (a === 'archivar' && doc) return void haz(async () => {
      if (!(await confirmAsk('¿Archivar esta recomendación? No se borra: queda archivada.'))) return;
      await api(`entregables/${enc(doc.id)}/archivar`, { method: 'POST', body: { v: doc.v } });
      S.docs = S.docs.filter((x) => x.id !== doc.id);
    });
  };
  host.__adsIntelOff?.();
  host.addEventListener('click', onClick);
  host.__adsIntelOff = () => { host.removeEventListener('click', onClick); S.ctrl?.abort(); };

  if (S.sub === 'resumen') await cargar(); else { pintarCuerpo(); cargar(); }
}
