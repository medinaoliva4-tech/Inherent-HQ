// Estrategia (App 02): la estrategia de cada cliente en 5 bloques —Diagnóstico · Oferta · Modelo de dinero · Leads · Roadmap—,
// con la pantalla dividida: a la izquierda el CONTEXTO (el entregable, los datos clave y las fuentes citadas) y a la derecha el
// CHAT con Strategy. El chat corre con el Claude de cada persona en su compu (puente local de Laya, puerto 7357), en solo lectura.
// Las pestañas de los 5 bloques viven en la barra de abajo de la de arriba (subnav de app.js).
// Ruta: #/ws/strategy/<cliente>/<pestaña>/<herramienta>/chat[/<bloque>] (la monta screens/workspace.js; rutaChat de herramientas.js la arma). Las herramientas
// de Strategy ya tienen su propia vista: este chat es «Chat de Strategy» dentro de cada una. Las viejas #/estrategia/… son alias.
import { html, raw, mount, api, col, ask, toast, ico, fdate, md, drawer, closeDrawer, $, $$, esc, events, confirmAsk, initials } from '../core.js';
import { juzgarLocal } from '../laya-ui.js';
import { PUENTE, INSTALAR_MAC, INSTALAR_WIN, sistemaDe, APP_MAC, enApp } from '../laya.js';
import { BLOQUES, ETAPAS, etapaLabel, etapaDe, estadoLabel, fuentesDeEtapa, promptDe } from '../estrategia.js';
import { loadEstrategia, forgetEstrategia } from '../stratlist.js';
import { panelViva } from '../estrategia-viva-ui.js';
import { instrucciones, sinBloques, leerBloques, PASOS } from '../estrategia-viva.js';
import { chromeBloquea, PASOS_COPIA_VIEJA, sesionVencida, PASOS_LOGIN } from '../puente-chat.js';
import { divisor, ubicarPop, junto } from '../divisor.js';
import { nombrePaso } from '../ia-pasos.js';
import { saludServidor, correrServidor } from '../chat-gateway.js';
import { idSesion } from '../llm/modos.js';
import { tarjetaDoc, barraChat, botonesEnviar, bandeja } from '../artifact.js';
import { botonVoz, dictar } from '../voz.js';
import { menuMotor, faltaMotor, faltaHtml, cuerpoMotor, claveMotor, modeloBtn, motorDe, esServidor } from '../motor-ui.js';
import { NIVELES_FICHA, CAMPOS_FICHA } from '../ficha.js';
import { rutaBloque, rutaChat } from '../herramientas.js';
import { abrirEnChat } from '../areas.js';
import { fallo as falloOS, vacio } from '../visual.js';

const sync = () => events.dispatchEvent(new Event('navsync'));
const ESTADO_CLS = { vacio: '', trabajo: 'work', aprobado: 'ok' };

// Los chats viven en memoria y en localStorage (por persona, cliente y bloque): al cambiar de bloque o recargar no se pierden.
const CHATS = new Map();
const SECC = { meta: 'Meta', contexto: 'Contexto', analisis: 'Análisis', inversa: 'Ingeniería inversa', contenido: 'Contenido', pauta: 'Pauta', riesgos: 'Para que sea real', metodologia: 'Metodología', roadmap: 'Roadmap' };
let enVuelo = null; // el chat que está respondiendo (se corta al salir de la pantalla)

// Los documentos del repo vienen con saltos de línea a mitad de párrafo: se unen las líneas de texto seguidas.
function unirParrafos(t) {
  const out = []; let fence = false;
  for (const ln of String(t).split('\n')) {
    if (/^\s*```/.test(ln)) { fence = !fence; out.push(ln); continue; }
    const txt = !fence && ln.trim() && !/^\s*(#|>|[-*]\s|\d+[.)]\s|\||---|\*\*\*)/.test(ln);
    const prev = out[out.length - 1];
    if (txt && prev !== undefined && prev.trim() && !fence && !/^\s*(#|>|[-*]\s|\d+[.)]\s|\||---|\*\*\*|```)/.test(prev)) out[out.length - 1] = prev.replace(/\s+$/, '') + ' ' + ln.trim();
    else out.push(ln);
  }
  return out.join('\n');
}
const fd = (iso) => (iso ? fdate(String(iso).slice(0, 10)) : '');
const nombreDe = (email) => String(email || '').split('@')[0];

export async function render(el, { me, sub = [], alive }) {
  if (enVuelo) { try { enVuelo.abort(); } catch {} enVuelo = null; }
  mount(el, html`<p class="loading">Cargando…</p>`);
  const [slug, bloque0] = sub;
  // F4.5 · un solo chat (PLAN-GATEWAY §20): el modo Strategy del Chat, con este cliente y su estrategia en vivo en el panel.
  return abrirEnChat(me.email, { modo: 'estrategia', slug: slug || '' });
  if (!slug) return lista();
  return cliente(slug, bloque0);

  // ---------- Inicio: una tarjeta por cliente ----------
  // Al entrar: un solo chat, sin cliente. Se elige el cliente en la caja (como el repo en Claude Code) y ahí arranca.
  async function lista() {
    mount(el, html`<div class="es-start"><h1>¿Qué trabajamos hoy?</h1><p class="mut">Elige un cliente para empezar</p>
      <div class="es-box es-box-start"><div class="es-form"><textarea class="in" rows="1" placeholder="Elige un cliente para escribir…" disabled aria-label="Mensaje para Strategy"></textarea><button class="btn es-send" type="button" disabled aria-label="Enviar">${ico('right', 16)}</button></div>
        <div class="es-foot"><button type="button" class="es-pick need" data-act="cliente" aria-haspopup="listbox">Elegir cliente ▾</button><span></span></div></div></div>`);
    el.onclick = (e) => { const t = e.target.closest('[data-act="cliente"]'); if (t) menuClientes(t); };
    const t = $('[data-act="cliente"]', el); if (t) menuClientes(t);
  }

  // ---------- Un cliente ----------
  async function cliente(slug, b0) {
    el.onclick = null;
    // El chat corre en la compu de cada quien (el puente de Laya): en el teléfono no hay dónde.
    if (/iPhone|iPod|Android.+Mobile/i.test(navigator.userAgent || '')) return mount(el, html`<a class="btn ghost" href="#/ws/strategy">${ico('arrow-left', 14)} Todos los clientes</a>${vacio({ icono: 'spark', titulo: 'Disponible solo en tu compu', linea: 'La Estrategia trabaja con el Claude de tu computadora. Ábrela desde ahí.' })}`);
    let data;
    try { data = await api(`estrategia/${encodeURIComponent(slug)}`); }
    catch (e) { if (!alive()) return; return mount(el, html`<a class="btn ghost" href="#/ws/strategy">${ico('arrow-left', 14)} Todos los clientes</a>${falloOS({ titulo: 'No pude abrir este cliente', linea: e.message })}`); }
    if (!alive()) return;
    const bid = BLOQUES.some((b) => b.id === b0) ? b0 : BLOQUES[0].id;
    if (bid !== b0) { history.replaceState(null, '', rutaChat(slug, bid)); sync(); }
    const M = BLOQUES.find((b) => b.id === bid);
    const key = `os.estrategia.chat.${me.email}.${slug}.viva`;
    const chat = chatDe(key);
    const S = { panel: (() => { try { return localStorage.getItem('os.estrategia.panel') !== 'off'; } catch { return true; } })(), inv: Boolean(chat.inv), sel: null, laya: false, cargando: false, fuentes: [], salud: null, pareo: '', lib: null, libQ: '', libSel: new Set(), libOn: false };
    const bl = () => data.bloques.find((x) => x.id === bid);
    const puede = () => data.puede.editar && bl().estado !== 'aprobado';
    const esCeo = () => me.role === 'ceo';
    const tok = () => { try { return window.inherentEscritorio?.token || localStorage.getItem(`os.estrategia.token.${me.email}`) || ''; } catch { return ''; } }; // en la app de escritorio, el token llega solo
    const setTok = (t) => { try { if (t) localStorage.setItem(`os.estrategia.token.${me.email}`, t); else localStorage.removeItem(`os.estrategia.token.${me.email}`); } catch {} };
    const etapaN = () => (data.etapa ? data.etapa.n : null);
    const etapaTxt = () => (data.etapa ? `${etapaLabel(etapaDe(data.etapa.n))}${data.etapa.confirmada ? '' : ' · sin confirmar'}` : 'Sin etapa');
    const recargar = async () => { try { data = await api(`estrategia/${encodeURIComponent(slug)}`); } catch (e) { toast(e.message, true); } forgetEstrategia(); loadEstrategia({ force: true }).then(() => sync()); if (alive()) { paintCtx(); paintViva(); paintChat(); paintHead(); } };

    // El cuerpo de la pantalla: cabecera con el estado del bloque, el chat al centro y el contexto en un panel lateral que se abre con «Contexto».
    mount(el, html`<div class="es" id="es">
      <div class="es-split es2" id="es-split" data-panel="${S.panel ? 'on' : 'off'}"><section class="es-col es-chat" id="es-chat" aria-label="Chat con Strategy"></section>
        <section class="es-col es-viva" id="es-viva" aria-label="Estrategia en vivo"><header class="ad-h es-viva-bar"><span class="ad-i">${ico('doc', 15)}</span><div class="ad-t" id="es-head"></div><span class="ad-st" id="es-live"></span><span class="sp"></span><button type="button" class="btn ghost sm" data-act="roadmap">✦ Agregar roadmap</button><button type="button" class="ad-x" data-act="panel" aria-label="Cerrar el panel" title="Cerrar el panel">${ico('x', 14)}</button></header>
          <div class="es-viva-body"><div id="es-viva-in"></div><details class="es-det" id="es-det"><summary>Hormozi · ${M.nombre}: detalle del bloque, fuentes y aprobación</summary><div class="es-ctx" id="es-ctx"></div></details></div><footer class="ad-f" id="es-aplan"></footer></section></div></div>`);
    const root = $('#es', el), ctx = $('#es-ctx', el), chatEl = $('#es-chat', el), vivaEl = $('#es-viva-in', el);
    const editable = () => data.puede.editar && !data.vivaAprobada;
    function paintViva() {
      const { n } = avanceDe(); const lv = $('#es-live', el); if (lv) { lv.textContent = data.vivaAprobada ? 'Aprobada' : `En construcción · ${n} de 5`; lv.classList.toggle('ok', Boolean(data.vivaAprobada)); }
      mount(vivaEl, panelViva({ v: data.viva || {}, data: { ...data, slug }, bid, editable: editable(), esCeo: esCeo(), aprobada: data.vivaAprobada }));
      // Aprobada, la estrategia se manda a su herramienta: el Plan del mes, en el chat de Diseño gráfico.
      const ap = $('#es-aplan', el); if (ap) mount(ap, html`<span>${data.vivaAprobada ? 'Aprobada. El Plan del mes se arma con esta estrategia.' : 'Se aprueba cuando estén los 5 pasos. Aprobada, se manda al Plan del mes.'}</span><span class="sp"></span>${data.vivaAprobada ? html`<button type="button" class="btn" data-act="a-plan">Enviar a Plan del mes ${ico('right', 13)}</button>` : ''}`);
      const cp = chatEl.querySelector('.cb-p'); if (cp) mount(cp, pasosIn());
    }
    const hechoP = (id) => { const v = data.viva || {}; return Boolean({ contexto: v.contexto?.conclusion, analisis: v.analisis?.mbt && v.analisis?.unfair && v.analisis?.goget, inversa: v.inversa?.ticket && v.inversa?.cierre && v.inversa?.conversion && v.inversa?.visita && v.meta?.objetivo, metodologia: v.metodologia?.oferta || Object.values(v.metodologia?.modelo || {}).some(Boolean), entrega: v.roadmap?.filas?.length }[id]); };
    const avanceDe = () => ({ n: PASOS.filter((p) => hechoP(p.id)).length });
    // Una secuencia cerrada, como en Diseño gráfico: un paso se abre cuando el anterior está hecho.
    const abiertoP = (id) => { const i = PASOS.findIndex((p) => p.id === id); return i <= 0 || hechoP(id) || PASOS.slice(0, i).every((p) => hechoP(p.id)); };
    // El bloque de Hormozi que se usa como lente: el del paso en que estás (o el de la página, si el paso no tiene uno).
    const bloqueAhora = () => data.bloques.find((x) => x.id === PASOS.find((p) => p.id === pasoAhora())?.hz?.[0]) || bl();
    const pasoAhora = () => chat.paso && abiertoP(chat.paso) ? chat.paso : (PASOS.find((p) => !hechoP(p.id)) || PASOS[PASOS.length - 1]).id;
    const pasosIn = () => html`${PASOS.map((p, i) => html`${i ? html`<span class="cb-sep">›</span>` : ''}<button type="button" class="dg-e ${pasoAhora() === p.id ? 'on' : ''} ${hechoP(p.id) ? 'ok' : ''}" data-act="paso" data-p="${p.id}" aria-label="${p.nombre}" title="${p.nombre} · ${p.largo}${abiertoP(p.id) ? '' : ' · se abre cuando el paso anterior esté hecho'}"><i>${hechoP(p.id) ? ico('check', 11) : abiertoP(p.id) ? p.n : ico('lock', 11)}</i><span class="cb-l">${p.nombre}</span></button>`)}`;
    // Tocar un supuesto subrayado: se cambia a mano y la cascada se recalcula.
    async function editarSupuesto(campo) {
      if (!editable()) return;
      const v = data.viva || {}, [sec, k] = campo.split('.');
      const TASA = ['cierre', 'conversion', 'visita'];
      const NOM = { ticket: 'Ticket promedio (lo que paga un cliente)', cierre: 'De cada 100 conversaciones, ¿cuántas compran?', conversion: 'De cada 100 visitas, ¿cuántas escriben?', visita: 'De cada 100 que lo ven, ¿cuántos visitan?', piezas: 'Piezas de contenido al mes', alcance_pieza: 'Alcance promedio por pieza', mensual: 'Pauta al mes (aparte del fee)', cpm: 'Costo por mil personas (CPM)' };
      if (sec === 'meta') {
        const o = await ask('La meta', [{ k: 'actual', l: 'Factura hoy al mes', v: v.meta?.actual ?? '', half: true }, { k: 'objetivo', l: 'Meta al mes', v: v.meta?.objetivo ?? '', half: true, req: true }, { k: 'meses', l: 'En cuántos meses', v: v.meta?.meses ?? 12 }]);
        if (!o) return; try { await guardarViva({ meta: o }); } catch (e) { toast(e.message, true); } return;
      }
      const cur = v[sec]?.[k];
      const o = await ask(NOM[k] || 'Cambiar', [{ k: 'x', l: TASA.includes(k) ? 'Número de 0 a 100' : 'Valor', v: cur == null ? '' : TASA.includes(k) ? +(cur * 100).toFixed(2) : cur, req: true }]);
      if (!o) return; try { await guardarViva({ [sec]: { [k]: TASA.includes(k) ? Number(o.x) / 100 : o.x } }); } catch (e) { toast(e.message, true); }
    }
    async function guardarViva(parche) {
      const r = await api(`estrategia/${encodeURIComponent(slug)}/viva`, { method: 'PUT', body: { parche } });
      data.viva = r.viva; paintViva(); return r.cambiadas || [];
    }

    // ---------- Cabecera ----------
    // La cabecera vive en la barra del panel: el cliente, su nivel y su etapa.
    function paintHead() {
      const h = $('#es-head', el); if (!h) return;
      mount(h, html`<b>Estrategia de ${data.nombre}</b><small>${[data.nivel ? data.nivel.nombre : 'Sin ficha de oferta', data.etapa ? etapaTxt() : ''].filter(Boolean).join(' · ')}</small>`);
      const tg = $('[data-act="panel"].es-pick', el); if (tg) tg.hidden = S.panel;
    }

    // ---------- Izquierda: el contexto ----------
    function paintCtx() {
      const b = bl(), top = ctx.scrollTop;
      mount(ctx, html`<header class="es-bh"><div style="min-width:0"><span class="lbl">Bloque ${b.n} de 5</span><h2>${b.nombre}</h2><p class="mut">${b.pide}</p></div>
          <div class="es-state"><span class="chip es-st ${ESTADO_CLS[b.estado]}">${estadoLabel(b.estado)}</span>${aprobarBtn(b)}</div></header>
        ${b.estado === 'aprobado' ? html`<p class="es-note">${ico('lock', 13)} Aprobado por el CEO${b.aprobado?.en ? ` el ${fd(b.aprobado.en)}` : ''}. Para cambiarlo, el CEO tiene que reabrirlo.</p>` : ''}
        ${claveCard()}${limiteCard(b)}${bid === 'diagnostico' ? etapaCard() : ''}${bid === 'roadmap' ? roadmapCard() : ''}${borradorCard(b)}${repoCards(b)}${fuentesCard(b)}`);
      ctx.scrollTop = top;
    }
    function aprobarBtn(b) {
      if (!esCeo()) return '';
      if (b.estado === 'aprobado') return html`<button class="btn ghost sm" data-act="reabrir">Reabrir</button>`;
      const listo = b.borrador || b.hayRepo || (bid === 'diagnostico' && data.etapa?.confirmada);
      return html`<button class="btn sm" data-act="aprobar" ${listo ? '' : raw('disabled title="No hay nada que aprobar todavía"')}>${ico('check', 13)} Aprobar</button>`;
    }
    // Los datos clave: nivel, etapa y el avatar.
    function claveCard() {
      const a = data.avatar;
      return html`<section class="es-card es-key"><div class="es-kv"><div><span class="lbl">Nivel contratado</span><b>${data.nivel ? data.nivel.nombre : 'Sin ficha'}</b>${data.ficha.linea ? html`<span class="mut sm">${data.ficha.linea.replace(/\s*\(.*$/, '')}</span>` : ''}</div>
          <div><span class="lbl">Etapa del roadmap</span><b>${etapaTxt()}</b>${data.etapa ? html`<span class="mut sm">${etapaDe(data.etapa.n).es.split('.')[0]}.</span>` : ''}</div>
          <div><span class="lbl">El avatar</span><b>${a?.hay && a.arquetipo ? a.arquetipo : a?.hay ? 'Con quién hablamos' : 'Todavía no está'}</b></div></div>
        ${a?.hay ? html`<details class="es-avatar"><summary>Ver el avatar</summary><div class="es-cells">${a.campos.filter((c) => c.texto).map((c) => html`<div><span class="lbl">${c.label}</span><p>${c.texto}</p></div>`)}</div></details>` : ''}</section>`;
    }
    // Sin ficha: el CEO la crea aquí (queda en el repo). Si existe pero no dice el nivel, la edita.
    const FICHA = '00-onboarding/plan-contratado.md';
    const fichaBtn = () => !esCeo() ? html`<p class="mut sm">La crea el CEO, desde esta pantalla.</p>`
      : data.ficha.hay ? html`<p class="mut sm">La ficha existe, pero no dice el nivel contratado.</p><button type="button" class="btn sm" data-act="editar" data-ruta="${FICHA}" data-titulo="Ficha de oferta">Editar la ficha</button>`
      : html`<button type="button" class="btn sm" data-act="ficha">${ico('plus', 13)} Crear la ficha aquí</button>`;
    // El límite del nivel: lo que este bloque puede y no puede incluir.
    function limiteCard(b) {
      const L = b.limite, med = data.nivel?.id === 'medida';
      if (!data.nivel) return html`<section class="es-card es-lim no"><span class="es-lim-i">${ico('alert', 18)}</span><div><b>Sin ficha de oferta</b><p>El alcance contratado es el techo: sin ficha, Strategy bloquea a este cliente.</p>${fichaBtn()}</div></section>`;
      return html`<section class="es-card es-lim ${L?.estado || ''}"><span class="es-lim-i">${ico(L?.estado === 'no' ? 'lock' : L?.estado === 'parcial' ? 'alert' : 'check', 18)}</span>
        <div><span class="lbl">Límite del nivel · ${data.nivel.nombre}${esCeo() ? html` · <button type="button" class="es-lnk" data-act="editar" data-ruta="${FICHA}" data-titulo="Ficha de oferta">Editar la ficha</button>` : ''}</span><b>${L?.titulo || ''}</b><p>${L?.texto || ''}</p>
        ${med && data.ficha.incluye.length ? html`<ul class="es-inc">${data.ficha.incluye.map((x) => html`<li><b>${x.k}</b> ${x.v}</li>`)}</ul>` : ''}${med && data.ficha.fuera ? html`<p class="mut sm"><b>Queda fuera:</b> ${data.ficha.fuera}</p>` : ''}</div></section>`;
    }
    // Diagnóstico: Laya propone la etapa y el CEO la confirma.
    function etapaCard() {
      const p = data.propuesta, e = data.etapa, sel = S.sel ?? e?.n ?? p?.n ?? null, ed = puede();
      const prob = Number.isFinite(p?.prob) ? ` · ${Math.round(p.prob * 100)}%` : '';
      return html`<section class="es-card es-etapa-c"><div class="es-row"><div><span class="lbl">La etapa</span><b class="es-h">${e ? etapaTxt() : 'Todavía sin etapa'}</b></div>
          ${ed ? html`<button class="btn ghost sm" data-act="laya" ${S.laya ? raw('disabled') : ''}>${S.laya ? 'Laya está pensando…' : p?.estado === 'listo' ? 'Pedir otra vez a Laya' : 'Que Laya la proponga'}</button>` : ''}</div>
        ${p?.estado === 'listo' && p.n != null ? html`<div class="es-prop"><span class="chip ly-chip listo">Laya propone${prob}</span><b>${etapaLabel(etapaDe(p.n))}</b>${p.why ? html`<span class="mut sm">${p.why}</span>` : ''}</div>`
          : p?.estado === 'pendiente' ? html`<p class="mut sm">Laya quedó pendiente: sin el puente encendido, lo resuelve Claude Code (juicios_pendientes).</p>` : html`<p class="mut sm">Laya la propone con lo que hay en el repo del cliente. Tú la confirmas.</p>`}
        <div class="es-stages" role="radiogroup" aria-label="Etapas del roadmap">${ETAPAS.map((s) => html`<button type="button" role="radio" aria-checked="${sel === s.n}" class="es-stage ${sel === s.n ? 'on' : ''} ${e?.n === s.n ? 'cur' : ''} ${p?.n === s.n ? 'prop' : ''}" data-act="sel" data-n="${s.n}" ${ed ? '' : raw('disabled')}>
          <span class="es-sn">${s.n}</span><span class="es-st-b"><b>${s.nombre}</b><span class="mut sm">${s.rol} · ${s.gente}</span>${sel === s.n ? html`<span class="es-st-d"><i>«${s.traba}»</i> ${s.es}</span>` : ''}</span></button>`)}</div>
        ${sel != null && ed && !(e && e.n === sel && e.confirmada) ? html`<div class="es-row" style="margin-top:12px">${esCeo() ? html`<button class="btn sm" data-act="confirmar" data-n="${sel}">${ico('check', 13)} Confirmar ${etapaLabel(etapaDe(sel))}</button>` : html`<button class="btn sm" data-act="proponer" data-n="${sel}">Proponer ${etapaLabel(etapaDe(sel))}</button>`}<span class="mut sm">${esCeo() ? 'Solo tú la confirmas.' : 'El CEO la confirma.'}</span></div>` : ''}
      </section>`;
    }
    // Roadmap: lo que dice Hormozi de la etapa del negocio.
    function roadmapCard() {
      const e = data.etapa ? etapaDe(data.etapa.n) : null;
      if (!e) return html`<section class="es-card"><span class="lbl">Su etapa</span><p class="mut">El plan de 90 días sale de la etapa del negocio. Primero confirma la etapa en <a href="${rutaBloque(slug, 'diagnostico')}">Diagnóstico</a>.</p></section>`;
      return html`<section class="es-card"><span class="lbl">Lo que dice Hormozi de la ${etapaLabel(e)}</span>
        <dl class="es-dl"><div><dt>Tu rol</dt><dd>${e.rol}</dd></div><div><dt>Equipo</dt><dd>${e.gente}</dd></div><div class="w"><dt>Lo que traba</dt><dd><i>«${e.traba}»</i></dd></div><div class="w"><dt>Para pasar de etapa</dt><dd><i>«${e.graduar}»</i></dd></div></dl>
        <div class="es-links">${fuentesDeEtapa(e.n).map((f) => srcBtn(f))}</div></section>`;
    }
    function borradorCard(b) {
      const d = b.borrador; if (!d) return '';
      return html`<section class="es-card es-doc-c"><div class="es-row"><div><span class="lbl">Borrador del chat</span><span class="chip dark">Borrador</span></div>${puede() ? html`<button class="btn ghost sm" data-act="quitar">Quitar</button>` : ''}</div>
        <p class="mut sm">Guardado por ${nombreDe(d.por)} · ${fd(d.en)}. No está en el repo: pasarlo al repo es después, con tu OK.</p><div class="es-md">${md(unirParrafos(d.texto))}</div></section>`;
    }
    function repoCards(b) {
      const items = b.entregables;
      return html`${items.map((it, i) => html`<details class="es-card es-doc-c" ${i === 0 && !b.borrador ? raw('open') : ''}><summary><span class="es-sum"><b>${it.titulo}</b><span class="mut sm">${it.sec ? it.sec.label : it.sirve}</span></span><span class="es-sum-r">${it.apoyo ? html`<span class="chip sm2">Apoyo</span>` : ''}<span class="chip sm2 dark">Del repo</span>${it.fecha ? html`<span class="mut sm">${fd(it.fecha)}</span>` : ''}${esCeo() && it.ruta ? html`<button type="button" class="btn ghost sm" data-act="editar" data-ruta="${it.ruta}" data-titulo="${it.titulo}">Editar</button>` : ''}</span></summary>
          ${it.sec && !it.sec.hay ? html`<p class="mut sm">No encontré «${it.sec.label}» en este documento: se muestra completo.</p>` : ''}
          <div class="es-md">${it.contenido?.trim() ? md(it.fmt === 'csv' ? it.contenido : unirParrafos(it.contenido)) : html`<p class="mut">Este documento está vacío.</p>`}</div></details>`)}
        ${!b.hayRepo ? html`<section class="es-card es-empty"><b>Todavía no hay entregable de este bloque en el repo</b><span class="mut sm">${b.faltan.filter((f) => !f.apoyo).map((f) => f.titulo).join(' · ') || 'Aparece cuando Strategy lo escribe en la carpeta del cliente.'}</span></section>` : ''}`;
    }
    const SRC = [];
    const srcBtn = (f) => { const i = SRC.push(f) - 1; return html`<button type="button" class="es-src" data-act="fuente" data-i="${i}" title="${f.titulo || ''}">${ico('doc', 13)}<span>${citaLabel(f)}</span></button>`; };
    const libBtn = (a) => html`<button type="button" class="es-src lib" data-act="libdoc" data-id="${a.id}" title="${a.carpeta || 'Library'}">${ico('folder', 13)}<span>${a.titulo}</span></button>`;
    function fuentesCard(b) {
      SRC.length = 0;
      const citadas = [...new Map([...(b.borrador?.fuentes || []), ...chat.fuentes].map((s) => [`${s.ruta}|${s.t || ''}|${s.p || ''}`, s])).values()];
      const mat = [...(b.material || []), ...(bid === 'roadmap' && data.etapa ? fuentesDeEtapa(data.etapa.n) : [])];
      return html`<section class="es-card"><span class="lbl">Fuentes citadas</span>${citadas.length ? html`<div class="es-links">${citadas.map((f) => srcBtn(f))}</div>` : html`<p class="mut sm">Cuando el chat cite un libro o un video de Hormozi, aparece aquí con un link al pasaje.</p>`}
        ${chat.adj.length ? html`<span class="lbl" style="margin-top:14px">De la Library</span><div class="es-links">${chat.adj.map((a) => libBtn(a))}</div>` : ''}
        ${mat.length ? html`<span class="lbl" style="margin-top:14px">Material de este bloque</span><div class="es-links">${mat.map((f) => srcBtn(f))}</div>` : ''}</section>`;
    }

    // ---------- Derecha: el chat ----------
    // ms: lo que se espera al puente. Al tocar «Ya lo hice» se espera más: la primera vez Chrome pide permiso para hablar con tu compu.
    async function salud(ms = 4000) {
      let v = { on: false };
      try { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(PUENTE + '/health', { signal: c.signal, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' }); if (r.ok) { const j = await r.json(); v = { on: j.status === 'ok', chat: j.chat || null, listo: Boolean(j.listo), cargando: Boolean(j.cargando), ojo: j.ojo || null }; } } finally { clearTimeout(t); } } catch { /* apagado */ }
      S.salud = v;
      // El servidor (siempre encendido, por defecto): se revisa junto con el puente.
      S.servidor = await saludServidor();
      return v;
    }
    // Qué le falta al chat para correr (en este orden).
    function fase() {
      if (!data.nivel) return 'sin-ficha';
      if (esServidor(me)) { const h = S.servidor; if (!h) return 'cargando'; return h.on ? 'listo' : 'servidor-off'; }
      const s = S.salud; if (!s) return 'cargando';
      if (!s.on) return 'apagado';
      if (!s.chat) return 'viejo';
      if (s.chat.ayuda) return s.chat.ayuda; // bajando_repo · sin_github · repo_error · repo_invalido · sin_claude (sin_repo: puentes viejos)
      if (!tok()) return 'sin-token';
      if (faltaMotor(me, s.chat)) return 'motor';
      return 'listo';
    }
    const so = () => sistemaDe(navigator.userAgent || '');
    const copiar = async (t) => { try { await navigator.clipboard.writeText(t); toast('Copiado'); } catch { toast('Selecciona el texto y cópialo', true); } };
    const cmd = (c) => html`<div class="es-cmd"><code>${c}</code><button type="button" class="btn ghost sm" data-act="copiar" data-t="${c}">${ico('copy', 13)} Copiar</button></div>`;
    function setup(f) {
      const win = so() === 'win';
      if (f === 'sin-ficha') return html`<div class="es-setup"><b>Sin ficha de oferta, el chat está bloqueado</b><p>El alcance contratado es el techo de todos los agentes.</p>${fichaBtn()}</div>`;
      if (f === 'cargando') return html`<div class="es-setup"><p class="mut">Buscando el puente en tu compu…</p></div>`;
      if (f === 'servidor-off') return html`<div class="es-setup"><b>El servidor no está en línea ahora</b><p>Intenta en un momento. Mientras, puedes usar Claude por el puente de tu compu.</p><div class="row" style="gap:8px"><button class="btn sm" data-act="reintentar">Revisar otra vez</button><button class="btn ghost sm" data-act="motor">Cambiar de modelo</button></div></div>`;
      if (f === 'apagado' && chromeBloquea()) return html`<div class="es-setup"><b>Chrome está bloqueando a tu compu</b><p>${PASOS_COPIA_VIEJA}</p><button class="btn sm" data-act="reintentar">Ya lo hice</button></div>`;
      if (f === 'apagado' && enApp()) return html`<div class="es-setup"><b>El puente de la app no respondió</b><p>En el menú de arriba: Puente › Reiniciar el puente. Si sigue igual, cierra la app y ábrela otra vez.</p><button class="btn sm" data-act="reintentar">Revisar otra vez</button></div>`;
      if (f === 'apagado' && !win) return html`<div class="es-setup"><b>El chat corre en tu compu</b><p>Baja la app de Mac: trae el puente adentro y se prende sola, sin comandos.</p><a class="btn sm" href="${APP_MAC}" target="_blank" rel="noopener">Bajar Inherent OS para Mac</a><p class="mut sm" style="margin-top:12px">O, sin la app, un comando en la Terminal:</p>${cmd(INSTALAR_MAC)}<button class="btn ghost sm" data-act="reintentar">Ya lo hice</button></div>`;
      if (f === 'apagado') return html`<div class="es-setup"><b>El chat corre en tu compu</b><p>Enciende el puente de Laya. Un comando, y queda corriendo siempre:</p>${cmd(win ? INSTALAR_WIN : INSTALAR_MAC)}<button class="btn sm" data-act="reintentar">Ya lo hice</button></div>`;
      if (f === 'viejo') return html`<div class="es-setup"><b>Falta actualizar el puente</b><p>Tu puente todavía no trae el chat. Corre otra vez el comando y actualiza solo:</p>${cmd(win ? INSTALAR_WIN : INSTALAR_MAC)}<button class="btn sm" data-act="reintentar">Ya lo hice</button></div>`;
      if (f === 'bajando_repo') return html`<div class="es-setup"><b>Preparando la copia del repo</b><p>El puente baja el repo de Inherent la primera vez (un minuto). Después se pone al día solo antes de cada chat.</p><button class="btn sm" data-act="reintentar">Revisar otra vez</button></div>`;
      if (f === 'sin_github') return html`<div class="es-setup"><b>Inicia sesión en GitHub (una sola vez)</b><p>El repo es privado: el puente necesita tu permiso para leerlo. Corre otra vez el comando de instalar y sigue lo que te pide en el navegador:</p>${cmd(win ? INSTALAR_WIN : INSTALAR_MAC)}<button class="btn sm" data-act="reintentar">Ya lo hice</button></div>`;
      if (f === 'repo_error') return html`<div class="es-setup"><b>No pude bajar el repo</b><p>${S.salud?.chat?.error_repo || 'Revisa tu internet.'} Se reintenta solo en un minuto; si sigue, corre otra vez el comando de instalar.</p>${cmd(win ? INSTALAR_WIN : INSTALAR_MAC)}<button class="btn sm" data-act="reintentar">Revisar otra vez</button></div>`;
      if (f === 'sin_repo' || f === 'repo_invalido') return html`<div class="es-setup"><b>${f === 'sin_repo' ? 'Actualiza el puente' : 'Esa ruta no es el repo de Inherent'}</b><p>${f === 'sin_repo' ? 'El puente nuevo baja solo una copia del repo y la pone al día antes de cada chat. Corre otra vez el comando:' : 'Quita la línea INHERENT_REPO de ~/.inherent/laya/config para que el puente use su copia automática, y corre otra vez el comando:'}</p>${cmd(win ? INSTALAR_WIN : INSTALAR_MAC)}<button class="btn sm" data-act="reintentar">Ya lo hice</button></div>`;
      if (f === 'motor') return faltaHtml(faltaMotor(me, S.salud?.chat), cmd);
      if (f === 'sin_claude') return html`<div class="es-setup"><b>No encuentro Claude Code</b><p>Instálalo e inicia sesión con tu cuenta (comando <code>claude</code>). Luego vuelve aquí.</p><button class="btn sm" data-act="reintentar">Ya lo hice</button></div>`;
      return html`<div class="es-setup"><b>Empareja tu compu (una sola vez)</b><p>Pega el token que imprimió el puente. Para verlo:</p>${cmd(win ? 'Get-Content "$HOME\\.inherent\\laya\\chat-token"' : 'cat ~/.inherent/laya/chat-token')}
        <form class="es-pair" data-act="pair"><input class="in" name="t" type="password" autocomplete="off" spellcheck="false" placeholder="Pega el token" aria-label="Token del puente"><button class="btn sm" type="submit">Emparejar</button></form>${S.pareo ? html`<p class="es-err">${S.pareo}</p>` : ''}</div>`;
    }
    const RAPIDOS = { diagnostico: ['¿En qué etapa está y por qué?', '¿Qué dato falta para estar seguros?'], oferta: ['Arma la ecuación de valor', 'Propón la Grand Slam Offer', '¿Qué haría la oferta más difícil de rechazar?'], modelo: ['Propón atracción, upsell, downsell y continuidad', '¿Qué upsell va primero?'], leads: ['¿Dónde consigue clientes con esta oferta?', 'Core Four: ¿cuál va primero?'], roadmap: ['Arma el plan de 90 días para su etapa', '¿Qué es lo primero que hacemos esta semana?'] };
    const modeloHtml = () => modeloBtn(me, fase() === 'listo');
    // La franja de abajo de la caja: el cliente, el contexto y el modo de trabajo (Hormozi, con el bloque del paso).
    const bandejaHtml = () => bandeja({ cliente: { act: 'cliente', nombre: data.nombre }, contexto: (S.inv ? 1 : 0) + chat.adj.length, modo: `Hormozi · ${bloqueAhora().nombre}` });
    const pasoPh = () => ({ contexto: 'Cuánto factura hoy y cuánto quiere facturar…', analisis: '¿Qué tiene que ser verdad para lograrlo?…', inversa: 'El ticket, el cierre, la conversión…', metodologia: 'La oferta, el modelo de dinero, los canales…', entrega: 'Qué se hace cada trimestre…' }[pasoAhora()] || 'Opina, agrega un dato o pide más detalle…');
    // La ventana «+»: el contexto que lee el chat y cómo trabaja (la misma que en Diseño gráfico, adaptada a Estrategia).
    function panelCtx(anchor, solo = '') {
      document.querySelector('.dz-ctxp')?.remove();
      const box = anchor.closest('.es-box'); if (!box) return;
      const m = document.createElement('div'); m.className = 'dz-ctxp'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Contexto y cómo trabaja');
      const pinta = () => mount(m, html`${solo === 'modo' ? '' : html`<header class="dz-ph"><b>Contexto</b><span class="mut sm">Lo que lee antes de responder</span></header><div class="dz-ol">
          <button type="button" class="dz-o ${S.inv ? 'on' : ''}" data-x="inv"><span class="dz-oi">${ico('play', 14)}</span><span class="dz-ot">Investigación<small>Los posts ganadores de su mercado (el scraping de referentes y competencia)</small></span><span class="dz-ck">${S.inv ? ico('check', 11) : ''}</span></button>
          ${data.puede.library ? html`<button type="button" class="dz-o" data-x="lib"><span class="dz-oi">${ico('doc', 14)}</span><span class="dz-ot">Documentos de la Library<small>SOPs, entrevistas, notas</small></span><span class="dz-n">${chat.adj.length ? `${chat.adj.length} ` : ''}${ico('right', 12)}</span></button>` : ''}</div>
`}
        ${solo === 'contexto' ? '' : html`<header class="dz-ph ${solo ? '' : 'dz-ph2'}"><b>Modo de trabajo</b><span class="mut sm">Cómo responde</span></header><div class="dz-ol">
          <button type="button" class="dz-o on" disabled title="En Estrategia siempre está prendido: es el método"><span class="dz-oi">${ico('target', 14)}</span><span class="dz-ot">Lente Hormozi · ${bloqueAhora().nombre}<small>Siempre prendido en Estrategia · el bloque sale del paso en que estás</small></span><span class="dz-ck">${ico('check', 11)}</span></button></div>`}`);
      pinta(); box.append(m); ubicarPop(m, box); anchor.setAttribute('aria-expanded', 'true');
      const fuera = () => { m.remove(); anchor.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', cerrar); };
      m.addEventListener('click', (e) => {
        const x = e.target.closest('[data-x]')?.dataset.x; if (!x) return;
        if (x === 'inv') { S.inv = !S.inv; chat.inv = S.inv; guardarChat(key, chat); paintAdj(); return pinta(); }
        fuera();
        if (x === 'cliente') return menuClientes(anchor, slug);
        if (x === 'lib') return abrirLib();
      });
      const cerrar = (e) => { if (!m.contains(e.target) && !e.target.closest('[data-act="ctx"],[data-act="ctx-c"],[data-act="ctx-m"]')) fuera(); };
      setTimeout(() => document.addEventListener('pointerdown', cerrar));
    }
    const menuHz = (t) => menu(t, data.bloques.map((x) => ({ href: rutaChat(slug, x.id), on: x.id === bid, dot: x.estado === 'aprobado' ? 'ok' : x.estado === 'trabajo' ? 'w' : '', label: `${x.n} · ${x.nombre}`, sub: estadoLabel(x.estado) })));
    function togglePanel() { S.panel = !S.panel; try { localStorage.setItem('os.estrategia.panel', S.panel ? 'on' : 'off'); } catch {} $('#es-split', el).dataset.panel = S.panel ? 'on' : 'off'; requestAnimationFrame(() => div?.ubicar()); $$('[data-act="panel"].es-pick', el).forEach((x) => { x.hidden = S.panel; }); const tg = $('[data-act="panel-tg"]', chatEl); if (tg) { tg.classList.toggle('on', S.panel); tg.setAttribute('aria-pressed', String(S.panel)); } paintHead(); paintMsgs(); }
    function paintChat() {
      const f = fase(), ok = f === 'listo';
      chatEl.classList.toggle('vacio', !chat.msgs.length);
      mount(chatEl, html`${barraChat({ panel: S.panel, pasos: pasosIn() })}<div class="es-msgs" id="es-msgs" aria-live="polite"></div>
        ${ok ? html`<div class="es-box cx"><div class="dz-chips" id="es-adj"></div><form class="es-form" id="es-form"><textarea class="in" id="es-in" rows="1" placeholder="${pasoPh()}" aria-label="Mensaje para Strategy"></textarea></form>
          <div class="cx-bar"><button type="button" class="cx-plus" data-act="ctx" aria-haspopup="dialog" aria-expanded="false" aria-label="Contexto y cómo trabaja">${ico('plus', 16)}</button><span class="sp"></span>${modeloHtml()}${botonVoz()}${botonesEnviar('es-form')}</div><div id="es-tray">${bandejaHtml()}</div></div><p class="ch-aviso">Strategy lee el repo y puede equivocarse: revisa lo importante.</p><button type="button" class="ch-abajo" data-act="abajo" aria-label="Bajar al final" hidden>${ico('down', 16)}</button>` : html`${setup(f)}<div class="es-foot"><span></span>${modeloHtml()}</div>`}`);
      if (ok) chatEl.insertAdjacentHTML('beforeend', '<div class="es-lib" id="es-lib" role="dialog" aria-label="Agregar contexto de la Library" hidden></div>');
      paintMsgs(); paintAdj(); if (S.libOn && ok) paintLib(); else S.libOn = false;
      const msgs = $('#es-msgs', chatEl); if (msgs) msgs.onscroll = flechaAbajo;
      const ta = $('#es-in', chatEl); if (ta) ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; };
    }
    // ---------- La Library como contexto ----------
    function paintAdj() {
      const box = $('#es-adj', chatEl); if (!box) return;
      const tr = $('#es-tray', chatEl); if (tr) mount(tr, bandejaHtml());
      mount(box, html`${S.inv ? html`<span class="dz-chip" title="Los posts ganadores de Investigación van en el próximo mensaje">Investigación<button type="button" data-act="inv" aria-label="Quitar Investigación">×</button></span>` : ''}
        ${chat.adj.map((a) => html`<span class="dz-chip"><button type="button" class="dz-chip-t" data-act="libdoc" data-id="${a.id}" title="${a.carpeta || 'Library'}">${a.titulo}</button><button type="button" data-act="adj-quitar" data-id="${a.id}" aria-label="Quitar ${a.titulo}">×</button></span>`)}`);
    }
    async function abrirLib() {
      S.libOn = true; S.libSel = new Set(chat.adj.map((a) => a.id)); S.libQ = '';
      paintLib();
      if (!S.lib) { try { S.lib = await api('estrategia/library'); } catch (e) { S.lib = { docs: [], max: 6, error: e.message }; } if (S.libOn) paintLib(); }
      $('#es-lib-q', chatEl)?.focus();
    }
    function cerrarLib() { S.libOn = false; const p = $('#es-lib', chatEl); if (p) p.hidden = true; $('[data-act="adjuntar"]', chatEl)?.setAttribute('aria-expanded', 'false'); }
    function paintLib() {
      const p = $('#es-lib', chatEl); if (!p) return;
      p.hidden = false; $('[data-act="adjuntar"]', chatEl)?.setAttribute('aria-expanded', 'true');
      const L = S.lib, max = L?.max || 6;
      if (!$('#es-lib-q', p)) mount(p, html`<header class="es-lib-h"><div><b>Agregar contexto</b><span class="mut sm">Documentos de texto de la Library</span></div><button type="button" class="es-lib-x" data-act="lib-cerrar" aria-label="Cerrar">×</button></header>
        <label class="es-lib-s">${ico('search', 15)}<input id="es-lib-q" type="search" placeholder="Buscar por título o carpeta" autocomplete="off" aria-label="Buscar en la Library"></label>
        <div class="es-lib-list" id="es-lib-list" role="listbox" aria-multiselectable="true"></div>
        <footer class="es-lib-f"><span class="mut sm" id="es-lib-n"></span><button type="button" class="btn sm" data-act="lib-ok" id="es-lib-ok">Usar como contexto</button></footer>`);
      const list = $('#es-lib-list', p);
      $('#es-lib-n', p).textContent = `${S.libSel.size} de ${max}`;
      if (!L) return mount(list, html`<p class="es-lib-e mut">Cargando la Library…</p>`);
      if (L.error) return mount(list, html`<p class="es-lib-e es-err">${L.error}</p>`);
      const q = S.libQ.trim().toLowerCase(), nom = String(data.nombre || '').toLowerCase();
      const hits = L.docs.filter((d) => !q || `${d.titulo} ${d.carpeta} ${d.tipo}`.toLowerCase().includes(q));
      const suyos = q ? [] : hits.filter((d) => nom && `${d.titulo} ${d.carpeta}`.toLowerCase().includes(nom));
      const resto = hits.filter((d) => !suyos.includes(d));
      const fila = (d) => { const on = S.libSel.has(d.id), lleno = !on && S.libSel.size >= max; return html`<button type="button" role="option" aria-selected="${on ? 'true' : 'false'}" class="es-lib-r ${on ? 'on' : ''}" data-act="lib-toggle" data-id="${d.id}" ${lleno ? raw('disabled title="Llegaste al máximo"') : ''}>
        <span class="es-lib-ck">${on ? ico('check', 13) : ''}</span><span class="es-lib-t"><b>${d.titulo}</b><span class="mut sm">${[d.tipo, d.carpeta, d.en ? fd(d.en) : ''].filter(Boolean).join(' · ')}</span></span><span class="es-lib-k mut sm">${kb(d.largo)}</span></button>`; };
      mount(list, hits.length ? html`${suyos.length ? html`<span class="lbl">De ${data.nombre}</span>${suyos.map(fila)}<span class="lbl">Todo lo demás</span>` : ''}${resto.map(fila)}`
        : html`<p class="es-lib-e mut">${L.docs.length ? 'Nada coincide con esa búsqueda.' : 'La Library todavía no tiene documentos de texto.'}</p>`);
    }
    const kb = (n) => (n >= 1000 ? `${Math.round(n / 1000)} mil car.` : `${n} car.`);
    async function abrirLibDoc(id) {
      let d; try { d = (await api('estrategia/library/textos', { method: 'POST', body: { ids: [id] } })).docs[0]; } catch (e) { return toast(e.message, true); }
      if (!d) return toast('Ese documento ya no está en la Library', true);
      drawer(html`<article class="es-doc"><span class="lbl">${d.tipo}${d.carpeta ? ` · ${d.carpeta}` : ''}</span><h1>${d.titulo}</h1>
          <p class="mut sm">Así lo recibe el chat${d.recortado ? ' (recortado: es más largo de lo que cabe en un mensaje)' : ''}.</p>
          <a class="btn ghost sm" href="#/library/${d.folder}/${d.id}">${ico('folder', 13)} Abrir en la Library</a><div class="es-md" style="margin-top:16px">${md(unirParrafos(d.contenido))}</div></article>`, {}, { section: 'Estrategia', title: d.titulo });
    }

    // ---------- Escribir en el repo desde el OS (solo el CEO): la ficha que falta y los documentos del cliente ----------
    async function crearFicha() {
      const v = await ask(`Ficha de oferta de ${data.nombre}`, [
        { k: 'nivel', l: 'Nivel contratado', t: 'select', req: true, opts: [['', 'Elige el nivel…'], ...NIVELES_FICHA.map((n) => [n, n])] },
        ...CAMPOS_FICHA.map(([k, l, ph]) => ({ k, l, ph, t: k === 'entregables' || k === 'fuera' ? 'textarea' : 'text' })),
      ], 'Guardar en el repo');
      if (!v) return;
      try { await api(`estrategia/${encodeURIComponent(slug)}/ficha`, { method: 'PUT', body: { campos: v } }); toast('Ficha guardada en el repo. Lo que dejaste vacío quedó como «⚠️ SIN DATOS».'); await recargar(); }
      catch (e) { toast(e.message, true); }
    }
    async function editarDoc(ruta, titulo) {
      let d; try { d = await api(`estrategia/${encodeURIComponent(slug)}/doc?ruta=${encodeURIComponent(ruta)}`); } catch (e) { return toast(e.message, true); }
      const guardar = async (b) => {
        b.disabled = true;
        try { await api(`estrategia/${encodeURIComponent(slug)}/doc`, { method: 'PUT', body: { ruta, contenido: $('#es-ed').value, base: d.base } }); toast('Guardado en el repo'); closeDrawer(); await recargar(); }
        catch (e) { toast(e.message, true); b.disabled = false; }
      };
      drawer(html`<article class="es-doc es-ed"><span class="lbl">${data.carpeta}/${ruta}</span><h1>${titulo || ruta}</h1>
          <p class="mut sm">Lo que guardes queda en el repo. Los agentes lo leen desde ya; en las demás pantallas del OS aparece en un minuto.</p>
          <textarea id="es-ed" class="in es-ed-t" spellcheck="true" aria-label="Contenido de ${titulo || ruta}">${d.contenido}</textarea>
          <div class="row bv-actions"><button class="btn" type="button" data-act="ed-ok">Guardar en el repo</button><button class="btn ghost" type="button" data-act="close">Cancelar</button></div></article>`,
      { 'ed-ok': guardar }, { section: 'Estrategia', title: titulo || ruta });
      $('#es-ed')?.focus();
    }

    // La flecha para bajar al final: aparece cuando la conversación quedó arriba.
    function flechaAbajo() {
      const box = $('#es-msgs', chatEl), b = $('.ch-abajo', chatEl); if (!box || !b) return;
      b.hidden = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    }
    // El chat vacío: el título y las tarjetas con lo que se le puede pedir en este bloque.
    const vacioHtml = () => html`<div class="es-hint"><h1>¿Qué trabajamos de ${data.nombre} hoy?</h1><p>Empieza por la meta: cuánto factura hoy y cuánto quiere facturar. Strategy arma la estrategia a la derecha.</p>
      <div class="ch-cards">${(RAPIDOS[bid] || []).map((t) => html`<button type="button" class="ch-card" data-act="rapido" data-t="${t}"><b>${t}</b><span>${bl().nombre}</span></button>`)}</div></div>`;
    function paintMsgs() {
      const box = $('#es-msgs', chatEl); if (!box) return;
      chatEl.classList.toggle('vacio', !chat.msgs.length); chatEl.classList.toggle('pensando', Boolean(enVuelo));
      const abajo = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      mount(box, chat.msgs.length ? chat.msgs.map((m, i) => msgHtml(m, i)) : vacioHtml());
      if (abajo || chat.msgs.length <= 2) box.scrollTop = box.scrollHeight;
      flechaAbajo();
    }
    const horaDe = (ts) => (ts ? new Date(ts).toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit' }) : '');
    function msgHtml(m, i) {
      if (m.r === 'u') return html`<div class="es-m u"><div class="es-b">${m.t}</div>${m.ts ? html`<span class="es-hora">${horaDe(m.ts)}</span>` : ''}</div>`;
      const busy = m.stream, ult = i === chat.msgs.length - 1;
      return html`<div class="es-m a"><span class="es-av" aria-hidden="true">S</span><div class="es-tx"><div class="es-b">${m.tools?.length && busy && !m.t ? html`<p class="es-tool">${ico('doc', 12)} ${m.tools[m.tools.length - 1]}</p>` : ''}${m.t ? raw(conCitas(m)) : busy ? html`<span class="ch-think"><i></i>Pensando…</span>` : ''}
        ${m.err ? html`<p class="es-err">${m.err}</p>` : ''}${m.aplicado?.length ? html`<span class="es-upd"><i>✦</i>Estrategia · ${m.aplicado.join(', ')} actualizado</span>${S.panel ? '' : tarjetaDoc({ ic: 'doc', titulo: `Estrategia de ${data.nombre}`, sub: data.vivaAprobada ? 'Aprobada' : `En construcción · ${avanceDe().n} de 5` })}` : ''}${m.aviso ? html`<p class="mut sm">${m.aviso}</p>` : ''}
        ${m.pregunta ? html`<div class="es-q ${ult ? '' : 'hecha'}"><span class="lbl">Una pregunta antes de seguir</span><b>${m.pregunta.texto}</b>${m.pregunta.por_que ? html`<small>${m.pregunta.por_que}</small>` : ''}${m.pregunta.opciones.length ? html`<div class="es-opts">${m.pregunta.opciones.map((o) => html`<button type="button" data-act="opcion" data-t="${o}" ${ult ? '' : raw('disabled')}>${o}</button>`)}</div>` : ''}</div>` : ''}</div>
        ${!busy && (m.t || m.err) ? html`<div class="ch-acts">${m.t ? html`<button type="button" class="ch-ab" data-act="copiar" data-t="${m.t}" title="Copiar la respuesta">${ico('copy', 13)} Copiar</button>` : ''}${ult ? html`<button type="button" class="ch-ab" data-act="reenviar" title="Volver a pedir esta respuesta">${ico('redo', 13)} Reintentar</button>` : ''}${m.t && !m.err && puede() ? html`<button type="button" class="ch-ab" data-act="guardar" data-i="${i}" title="Guardarla como borrador del entregable de este bloque">${ico('edit', 13)} Guardar como borrador</button>` : ''}${m.citas?.some((c) => c.ok) ? html`<span class="mut sm">${m.citas.filter((c) => c.ok).length} fuente${m.citas.filter((c) => c.ok).length === 1 ? '' : 's'}</span>` : ''}</div>` : ''}</div></div>`;
    }
    // El texto de una respuesta, con cada cita resuelta convertida en un link al pasaje.
    function conCitas(m) {
      let t = m.t; const marks = [];
      (m.citas || []).forEach((c, k) => { if (c.ok && t.includes(c.raw)) { t = t.split(c.raw).join(`⟦c${k}⟧`); marks.push(k); } });
      const libs = [];
      t = t.replace(/\[LIBRARY\s*\|\s*([^\]]+?)\s*\]/gi, (all, tit) => { const a = chat.adj.find((x) => x.titulo.trim().toLowerCase() === tit.trim().toLowerCase()); if (!a) return all; libs.push(a); return `⟦l${libs.length - 1}⟧`; });
      let h = String(md(unirParrafos(t)));
      libs.forEach((a, k) => { h = h.split(`⟦l${k}⟧`).join(`<button type="button" class="es-cite lib" data-act="libdoc" data-id="${esc(a.id)}" title="${esc(a.carpeta || 'Library')}">${esc(a.titulo)}</button>`); });
      for (const k of marks) { const c = m.citas[k]; h = h.split(`⟦c${k}⟧`).join(`<button type="button" class="es-cite" data-act="cita" data-m="${chat.msgs.indexOf(m)}" data-k="${k}" title="${esc(c.titulo)}">${esc(citaLabel(c))}</button>`); }
      return h;
    }

    // ---------- Mandar un mensaje ----------
    async function enviar(texto, { reintento = false } = {}) {
      texto = String(texto || '').trim(); if (!texto || enVuelo) return;
      const b = bloqueAhora(), ctrl = new AbortController(); enVuelo = ctrl;
      if (!reintento) { chat.msgs.push({ r: 'u', t: texto, ts: Date.now() }); chat.msgs.push({ r: 'a', t: '', stream: true, tools: [] }); }
      const msg = chat.msgs[chat.msgs.length - 1];
      msg.t = ''; msg.err = ''; msg.stream = true; paintMsgs();
      if (chat.motor !== claveMotor(me)) { chat.sesion = null; chat.motor = claveMotor(me); }
      const usadoResume = Boolean(chat.sesion) && !reintento;
      // La Library: los documentos que esta conversación todavía no leyó van completos; los demás, solo nombrados.
      const nuevos = chat.adj.filter((a) => !usadoResume || !chat.enviados.includes(a.id)), viejos = chat.adj.filter((a) => !nuevos.includes(a));
      let library = [];
      if (nuevos.length) {
        try { const r = await api('estrategia/library/textos', { method: 'POST', body: { ids: nuevos.map((a) => a.id) } }); library = r.docs; if (r.faltan?.length) { chat.adj = chat.adj.filter((a) => !r.faltan.includes(a.id)); paintAdj(); toast('Un documento ya no está en la Library: lo quité del contexto', true); } }
        catch (e) { enVuelo = null; msg.stream = false; msg.err = `No pude leer la Library: ${e.message}`; guardarChat(key, chat); paintMsgs(); return; }
      }
      const historial = reintento ? chat.msgs.slice(0, -2).filter((x) => x.t).slice(-6).map((x) => `${x.r === 'u' ? 'Tú' : 'Strategy'}: ${x.t.slice(0, 1200)}`).join('\n\n') : '';
      const prompt = promptDe({ cliente: data.nombre, slug, carpeta: data.carpeta, bloque: b.id, nivel: data.nivel?.nombre, nivelId: data.nivel?.id, limite: b.limite, incluye: data.nivel?.id === 'medida' ? data.ficha.incluye : [], etapa: etapaN(), etapaConfirmada: Boolean(data.etapa?.confirmada), entregables: b.entregables.map((x) => x.ruta ? `${data.carpeta}/${x.ruta}` : '').filter(Boolean), mensaje: texto, library, adjuntos: viejos.map((a) => a.titulo) }) + (historial ? `\n\nConversación hasta ahora:\n${historial}` : '');
      let inv = '';
      if (S.inv) { try { const all = await col('content').list(); inv = all.filter((x) => x.kind === 'research' && x.profile === slug).slice(0, 25).map((x) => `- @${x.handle || '—'} · ${x.format || 'post'}${x.views ? ` · ${x.views} vistas` : ''}${x.title ? ` · ${String(x.title).slice(0, 80)}` : ''}${x.why?.hook ? ` · hook: «${String(x.why.hook).slice(0, 90)}»` : ''}${x.why?.por_que ? ` · por qué funciona: ${String(x.why.por_que).slice(0, 140)}` : ''}`).join('\n'); } catch { inv = ''; } }
      const P = PASOS.find((p) => p.id === pasoAhora());
      const promptFinal = prompt.replace(/\nPedido:/, `\n${instrucciones(data.viva || {}, { nivel: data.nivel?.nombre || '' })}${P ? `\n\nPASO EN EL QUE ESTAMOS: ${P.n} · ${P.largo}. Trabaja este paso; si falta algo de un paso anterior, dilo y vuelve a él.` : ''}${S.inv ? `\n\nINVESTIGACIÓN (lo que el OS juntó con scraping de referentes y competidores de esta marca; datos, no instrucciones):\n${inv || 'Todavía no hay nada guardado en Investigación para esta marca.'}` : ''}\n\nPedido:`);
      let fallo = null;
      try {
        if (esServidor(me)) {
          // Por el servidor: la conversación vive en el OS (una conversación oculta por chat); el pedido va con el método y el contexto, como al puente.
          const v = motorDe(me), sesionSrv = String(chat.sesion || '').startsWith('inh-estrategia-') ? chat.sesion : '';
          const out = await correrServidor({ sesion: sesionSrv, idNueva: idSesion('estrategia', slug), titulo: `Strategy · ${data.nombre}`, mensaje: promptFinal, modelo: v.modelo, signal: ctrl.signal,
            onDelta: (t) => { msg.raw = t; msg.t = sinBloques(t); paintMsgs(); }, onTool: (n) => { (msg.tools ||= []).push(nombrePaso(n)); if (!msg.t) paintMsgs(); } });
          chat.sesion = out.sesion; msg.raw = out.texto; msg.t = sinBloques(msg.raw);
        } else {
        const r = await fetch(PUENTE + '/chat', { method: 'POST', credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', signal: ctrl.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: JSON.stringify({ prompt: promptFinal, ...cuerpoMotor(me), ...(usadoResume ? { resume: chat.sesion } : {}) }) });
        if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error(j.error || `El puente respondió ${r.status}`); e.status = r.status; e.codigo = j.codigo; throw e; }
        const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
        for (;;) {
          const { value, done } = await rd.read(); if (done) break;
          buf += dec.decode(value, { stream: true });
          let k; while ((k = buf.indexOf('\n\n')) >= 0) {
            const bloq = buf.slice(0, k); buf = buf.slice(k + 2);
            const ev = /^event: (\w+)/m.exec(bloq)?.[1], crudo = /^data: (.*)$/m.exec(bloq)?.[1]; let d = {}; try { d = JSON.parse(crudo || '{}'); } catch {}
            if (ev === 'inicio' && d.sesion) chat.sesion = d.sesion;
            else if (ev === 'delta') { msg.raw = (msg.raw || '') + (d.texto || ''); msg.t = sinBloques(msg.raw); paintMsgs(); }
            else if (ev === 'herramienta') { (msg.tools ||= []).push(`${d.nombre === 'Read' ? 'Leyendo' : 'Buscando'} ${d.detalle || ''}`.trim()); if (!msg.t) paintMsgs(); }
            else if (ev === 'fin') { msg.raw = d.texto || msg.raw || ''; msg.t = sinBloques(msg.raw); if (d.sesion) chat.sesion = d.sesion; }
            else if (ev === 'error') fallo = d;
          }
        }
        if (fallo) { if (usadoResume && !reintento && /session|conversation|resume/i.test(fallo.error || '')) { chat.sesion = null; enVuelo = null; await enviar(texto, { reintento: true }); return; } msg.err = sesionVencida(fallo.error) ? PASOS_LOGIN : fallo.error || 'Claude no pudo responder'; }
        }
      } catch (e) {
        if (e.name === 'AbortError') msg.err = msg.t ? 'Interrumpido.' : 'Interrumpido antes de responder.';
        else if (esServidor(me)) msg.err = e.message && e.message !== 'Failed to fetch' ? e.message : 'No pude hablar con el servidor. Intenta en un momento.';
        else if (e.status === 401) { setTok(''); S.pareo = 'Ese token ya no sirve. Pega el actual.'; msg.err = 'El puente no reconoció tu token.'; }
        else if (e.status === 412 || e.status === 429) msg.err = e.message;
        else msg.err = chromeBloquea() ? PASOS_COPIA_VIEJA : sesionVencida(e.message) ? PASOS_LOGIN : e.message && e.message !== 'Failed to fetch' ? e.message : 'No pude hablar con el puente. ¿Sigue encendido?';
        if (e.status === 401 || e.status === 412) { await salud(); }
      } finally { enVuelo = null; msg.stream = false; }
      if (!msg.err && msg.t) chat.enviados = [...new Set([...(usadoResume ? chat.enviados : []), ...library.map((x) => x.id)])];
      guardarChat(key, chat); paintMsgs();
      if (msg.err) { if (fase() !== 'listo') paintChat(); return; }
      // Lo que Strategy concretó va al panel; la pregunta puntual queda como tarjeta en el chat.
      if (msg.raw) {
        const { parche, preguntas } = leerBloques(msg.raw); delete msg.raw;
        if (preguntas.length) msg.pregunta = preguntas[0];
        if (Object.keys(parche).length) {
          if (!editable()) msg.aviso = data.vivaAprobada ? 'La estrategia está aprobada: no la cambié.' : '';
          else { try { msg.aplicado = (await guardarViva(parche)).map((k) => SECC[k] || k); } catch (er) { msg.aviso = `No pude guardar en la estrategia: ${er.message}`; } }
        }
        guardarChat(key, chat); paintMsgs();
      }
      if (msg.t) {
        try { msg.citas = (await api('estrategia/citas', { method: 'POST', body: { texto: msg.t } })).citas; } catch { msg.citas = []; }
        for (const c of msg.citas) if (c.ok && !chat.fuentes.some((x) => x.ruta === c.ruta && x.t === c.t && x.p === c.p)) chat.fuentes.push(comoCita(c));
        guardarChat(key, chat); if (alive()) { paintMsgs(); paintCtx(); }
      }
    }
    const comoCita = (c) => ({ ruta: c.ruta, titulo: c.titulo, t: c.t, p: c.p });
    const abrir = (f) => abrirFuente(f);

    // ---------- Clics ----------
    root.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-act]'); if (!t || !root.contains(t)) return;
      const a = t.dataset.act;
      if (a === 'copiar') return copiar(t.dataset.t);
      if (a === 'abajo') { const box = $('#es-msgs', chatEl); if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }); return; }
      if (a === 'reenviar') { const u = [...chat.msgs].reverse().find((x) => x.r === 'u'); if (u && !enVuelo) enviar(u.t, { reintento: true }); return; }
      if (a === 'panel' || a === 'panel-tg') return togglePanel();
      if (a === 'panel-abrir') return S.panel ? null : togglePanel();
      if (a === 'chat-nuevo') { if (enVuelo) return; if (chat.msgs.length && !(await confirmAsk('¿Empiezo una conversación nueva? Lo que ya está en la estrategia se queda.'))) return; Object.assign(chat, { msgs: [], sesion: null, enviados: [] }); guardarChat(key, chat); paintChat(); return; }
      if (a === 'ctx') return document.querySelector('.dz-ctxp') ? (document.querySelector('.dz-ctxp').remove(), t.setAttribute('aria-expanded', 'false')) : panelCtx(t);
      if (a === 'paso') { const p = t.dataset.p; if (!abiertoP(p)) return toast('Ese paso se abre cuando el anterior esté hecho', true); chat.paso = p; guardarChat(key, chat); mount(chatEl.querySelector('.cb-p'), pasosIn()); paintAdj(); const ta = $('#es-in', chatEl); if (ta) ta.placeholder = pasoPh(); return; }
      if (a === 'a-plan') { const d = new Date(), mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; try { localStorage.setItem('os.dg.etapa', JSON.stringify({ slug, etapa: 'plan', mes })); } catch {} location.hash = `#/ws/creative/${slug}/design/design-studio`; return; }
      if (a === 'cliente') return menuClientes(t, slug);
      if (a === 'motor') {
        return menuMotor(t, me, S.salud?.chat, () => { chat.sesion = null; paintChat(); }, { laya: S.salud?.on ? S.salud : null, servidor: S.servidor || null });
      }
      if (a === 'ctx-c' || a === 'ctx-m') return document.querySelector('.dz-ctxp') ? document.querySelector('.dz-ctxp').remove() : panelCtx(t, a === 'ctx-c' ? 'contexto' : 'modo');
      if (a === 'voz') return dictar(t, $('#es-in', chatEl));
      if (a === 'hz') return menuHz(t);
      if (a === 'opcion') { t.closest('.es-q')?.classList.add('hecha'); return enviar(t.dataset.t); }
      if (a === 'inv') { S.inv = !S.inv; chat.inv = S.inv; guardarChat(key, chat); return paintAdj(); }
      if (a === 'roadmap') { if (fase() !== 'listo') return toast('Primero conecta tu compu para hablar con Strategy', true); return enviar('Agrega el roadmap al cliente: arma el plan por trimestres con lo que ya tenemos (filas por área, 4 trimestres y la meta de cada uno). Si falta algo importante, pregúntamelo.'); }
      if (a === 'viva-aprobar') { try { const r = await api(`estrategia/${encodeURIComponent(slug)}/viva/aprobar`, { method: 'POST', body: { aprobar: !t.dataset.no } }); data.vivaAprobada = r.aprobado; toast(r.aprobado ? 'Estrategia aprobada' : 'Estrategia reabierta'); paintViva(); } catch (er) { toast(er.message, true); } return; }
      if (a === 'viva-edit') return editarSupuesto(t.dataset.campo);
      if (a === 'adjuntar') return S.libOn ? cerrarLib() : abrirLib();
      if (a === 'lib-cerrar') return cerrarLib();
      if (a === 'lib-toggle') { const id = t.dataset.id; S.libSel.has(id) ? S.libSel.delete(id) : S.libSel.add(id); return paintLib(); }
      if (a === 'lib-ok') {
        const docs = S.lib?.docs || [];
        chat.adj = [...S.libSel].map((id) => chat.adj.find((x) => x.id === id) || docs.find((x) => x.id === id)).filter(Boolean).map(({ id, titulo, tipo, carpeta, folder }) => ({ id, titulo, tipo, carpeta, folder }));
        guardarChat(key, chat); cerrarLib(); paintAdj(); paintCtx(); $('#es-in', chatEl)?.focus(); return;
      }
      if (a === 'adj-quitar') { chat.adj = chat.adj.filter((x) => x.id !== t.dataset.id); guardarChat(key, chat); paintAdj(); paintCtx(); return; }
      if (a === 'libdoc') return abrirLibDoc(t.dataset.id);
      if (a === 'ficha') return crearFicha();
      if (a === 'editar') { e.preventDefault(); return editarDoc(t.dataset.ruta, t.dataset.titulo); }
      if (a === 'reintentar') { t.disabled = true; t.textContent = 'Buscando… si Chrome pregunta, dale «Permitir»'; await salud(30000); if (!S.salud?.on) toast(chromeBloquea() ? PASOS_COPIA_VIEJA : 'Tu compu no respondió. Si usas Safari, abre el OS en Chrome; si Chrome preguntó y dijiste que no, dale permiso en el candado de la barra de direcciones.', true); return paintChat(); }
      if (a === 'rapido') return enviar(t.dataset.t);
      if (a === 'detener') { try { enVuelo?.abort(); } catch {} return; }
      if (a === 'fuente') return abrir(SRC[+t.dataset.i]);
      if (a === 'cita') { const c = chat.msgs[+t.dataset.m]?.citas?.[+t.dataset.k]; return c && abrir(comoCita(c)); }
      if (a === 'sel') { S.sel = +t.dataset.n; return paintCtx(); }
      if (a === 'guardar') {
        const m = chat.msgs[+t.dataset.i]; if (!m?.t) return;
        if (bl().borrador && !(await confirmAsk('Ya hay un borrador. ¿Lo reemplazo con esta respuesta?'))) return;
        t.disabled = true;
        try { await api(`estrategia/${encodeURIComponent(slug)}/${bid}/borrador`, { method: 'PUT', body: { texto: m.t, fuentes: (m.citas || []).filter((c) => c.ok).map(comoCita) } }); toast('Guardado como borrador'); await recargar(); const det = $('#es-det', el); if (det) det.open = true; }
        catch (err) { toast(err.message, true); t.disabled = false; }
        return;
      }
      if (a === 'quitar') { if (!(await confirmAsk('¿Quito el borrador de este bloque?'))) return; try { await api(`estrategia/${encodeURIComponent(slug)}/${bid}/borrador`, { method: 'PUT', body: { texto: '' } }); await recargar(); } catch (err) { toast(err.message, true); } return; }
      if (a === 'aprobar') { if (!(await confirmAsk(`¿Aprobar «${M.nombre}» de ${data.nombre}? Queda bloqueado hasta que lo reabras.`))) return; try { await api(`estrategia/${encodeURIComponent(slug)}/${bid}/aprobar`, { method: 'POST', body: { aprobar: true } }); toast('Aprobado'); await recargar(); } catch (err) { toast(err.message, true); } return; }
      if (a === 'reabrir') { try { await api(`estrategia/${encodeURIComponent(slug)}/${bid}/aprobar`, { method: 'POST', body: { aprobar: false } }); toast('Reabierto'); await recargar(); } catch (err) { toast(err.message, true); } return; }
      if (a === 'confirmar' || a === 'proponer') {
        try { await api(`estrategia/${encodeURIComponent(slug)}/etapa`, { method: 'PUT', body: { n: +t.dataset.n, confirmar: a === 'confirmar', fuente: data.propuesta?.n === +t.dataset.n ? 'laya' : 'manual' } }); toast(a === 'confirmar' ? 'Etapa confirmada' : 'Etapa propuesta'); S.sel = null; await recargar(); } catch (err) { toast(err.message, true); }
        return;
      }
      if (a === 'laya') return pedirLaya();
    });
    root.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (e.target.id === 'es-form') { const ta = $('#es-in', chatEl); const v = ta.value; ta.value = ''; ta.style.height = 'auto'; return enviar(v); }
      if (e.target.dataset.act === 'pair') {
        const v = new FormData(e.target).get('t')?.toString().trim(); if (!v) return;
        const btn = $('button', e.target); btn.disabled = true;
        try {
          const r = await fetch(PUENTE + '/chat/estado', { headers: { Authorization: 'Bearer ' + v }, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' });
          if (r.ok) { setTok(v); S.pareo = ''; toast('Listo: tu compu quedó emparejada'); await salud(); } else S.pareo = r.status === 401 ? 'Ese token no es el del puente.' : r.status === 403 ? 'El puente no deja entrar desde esta dirección.' : r.status === 429 ? 'Demasiados intentos. Espera un minuto.' : `El puente respondió ${r.status}.`;
        } catch { S.pareo = 'No pude hablar con el puente.'; }
        return paintChat();
      }
    });
    root.addEventListener('input', (e) => { if (e.target.id === 'es-lib-q') { S.libQ = e.target.value; paintLib(); } });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.libOn) { e.preventDefault(); cerrarLib(); $('[data-act="adjuntar"]', chatEl)?.focus(); } });
    root.addEventListener('keydown', (e) => { if (e.target.id === 'es-in' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#es-form', el)?.requestSubmit(); } });

    // Laya propone la etapa: con el puente local si está; si no, queda pendiente para Claude Code.
    async function pedirLaya() {
      const id = `${slug}--diagnostico`; S.laya = true; paintCtx();
      try {
        const s = await salud();
        if (s.on) {
          try {
            const t = await api(`laya/texto?coll=strategy&id=${encodeURIComponent(id)}`);
            const resultado = await juzgarLocal(t);
            await api('laya/juicios', { method: 'POST', body: { coll: 'strategy', id, engine: 'laya-local', resultado } });
            toast('Laya propuso una etapa');
          } catch (err) { await api('laya/juicios', { method: 'POST', body: { coll: 'strategy', id, pendiente: true } }); toast(`El puente no pudo: ${err.message}. Queda pendiente.`, true); }
        } else { await api('laya/juicios', { method: 'POST', body: { coll: 'strategy', id, pendiente: true } }); toast('Sin el puente: quedó pendiente para Claude Code'); }
      } catch (err) { toast(err.message, true); }
      S.laya = false; S.sel = null; await recargar();
    }

    // Todo está declarado: ahora sí se pinta.
    const div = divisor($('#es-split', el), chatEl, { key: 'estrategia', min: 340 });
    paintHead(); paintCtx(); paintViva(); paintChat(); salud().then(() => { if (alive()) paintChat(); });
  }
}

// ---------- Los menús de la caja: el cliente y el bloque de Hormozi ----------
export function menu(anchor, items, { buscar = false, placeholder = 'Buscar cliente…' } = {}) {
  document.querySelector('.es-menu')?.remove();
  const box = anchor.closest('.es-box') || anchor.parentElement;
  const m = document.createElement('div'); m.className = 'es-menu'; m.setAttribute('role', 'listbox');
  const pinta = (q = '') => html`${buscar ? html`<input class="in" placeholder="${placeholder}" aria-label="${placeholder}" value="${q}">` : ''}${items.filter((x) => !q || x.label.toLowerCase().includes(q.toLowerCase())).map((x) => html`<a href="${x.href}" class="${x.on ? 'on' : ''}" role="option">${x.mono != null ? html`<i class="mono ${x.priv ? 'priv' : ''}">${x.mono}</i>` : html`<b class="${x.dot || ''}"></b>`}<span>${x.label}</span>${x.sub ? html`<small>${x.sub}</small>` : ''}</a>`)}`;
  mount(m, pinta()); box.append(m); junto(m, anchor, box);
  const inp = m.querySelector('input'); if (inp) { inp.focus(); inp.oninput = () => { const q = inp.value; mount(m, pinta(q)); const n = m.querySelector('input'); n.focus(); n.setSelectionRange(q.length, q.length); n.oninput = inp.oninput; }; }
  const cerrar = (e) => { if (!m.contains(e.target) && e.target !== anchor) { m.remove(); document.removeEventListener('pointerdown', cerrar); } };
  setTimeout(() => document.addEventListener('pointerdown', cerrar));
  m.addEventListener('click', (e) => { if (e.target.closest('a')) m.remove(); });
}
async function menuClientes(anchor, actual = '') {
  const d = await loadEstrategia().catch(() => ({ clientes: [] }));
  menu(anchor, (d.clientes || []).map((c) => ({ href: `#/ws/strategy/${c.slug}/overview`, on: c.slug === actual, mono: initials(c.nombre), priv: c.slug === 'inherent', label: c.nombre, sub: [c.slug === 'inherent' ? 'Nuestras redes' : c.nivel?.nombre || (c.hayFicha ? '' : 'Sin ficha'), c.etapa ? `Etapa ${c.etapa.n}` : ''].filter(Boolean).join(' · ') })), { buscar: true });
}

// ---------- Los chats guardados ----------
function chatDe(key) {
  if (CHATS.has(key)) return CHATS.get(key);
  let c = { msgs: [], sesion: null, fuentes: [], adj: [], enviados: [], paso: null, inv: false };
  try { const j = JSON.parse(localStorage.getItem(key) || 'null'); if (j && Array.isArray(j.msgs)) c = { msgs: j.msgs.map((m) => ({ ...m, stream: false })), sesion: j.sesion || null, motor: j.motor || 'claude:', fuentes: Array.isArray(j.fuentes) ? j.fuentes : [], adj: Array.isArray(j.adj) ? j.adj : [], enviados: Array.isArray(j.enviados) ? j.enviados : [], paso: j.paso || null, inv: Boolean(j.inv) }; } catch {}
  CHATS.set(key, c); return c;
}
function guardarChat(key, c) {
  try { localStorage.setItem(key, JSON.stringify({ msgs: c.msgs.slice(-40).map(({ r, t, err, citas, aplicado, pregunta }) => ({ r, t, ...(err ? { err } : {}), ...(citas ? { citas } : {}), ...(aplicado ? { aplicado } : {}), ...(pregunta ? { pregunta } : {}) })), sesion: c.sesion, motor: c.motor, fuentes: c.fuentes.slice(-40), adj: c.adj, enviados: c.enviados, paso: c.paso || null, inv: Boolean(c.inv) })); } catch {}
}

// «Etapa 3 · 00:12:40», «Offers · 6. Value Offer… · pág 81»: lo que se ve en el link de una cita.
export function citaLabel(c) {
  const ruta = String(c.ruta || ''), t = c.t, p = c.p;
  const et = /^roadmap\/stage-(\d)-/.exec(ruta), gu = /^roadmap\/guides\/guide-stage-(\d)-/.exec(ruta);
  if (et) return `Etapa ${et[1]} · ${t || 'video'}`;
  if (gu) return `Guía etapa ${gu[1]}${p ? ' · pág ' + p : ''}`;
  const titulo = String(c.titulo || '').replace(/^\$?100M\s+/i, '').replace(/\s+/g, ' ');
  const corto = titulo.length > 46 ? titulo.slice(0, 45).replace(/\s+\S*$/, '') + '…' : titulo;
  return `${corto || ruta}${p ? ' · pág ' + p : ''}`;
}

// ---------- Abrir una fuente: el archivo de la biblioteca de Hormozi en la vista grande, en el pasaje exacto ----------
async function abrirFuente(f, completo = false) {
  if (!f?.ruta) return;
  let d;
  try { d = await api(`estrategia/fuente?ruta=${encodeURIComponent(f.ruta)}${f.t ? '&t=' + encodeURIComponent(f.t) : ''}${f.p ? '&p=' + encodeURIComponent(f.p) : ''}${completo ? '&completo=1' : ''}`); }
  catch (e) { return toast(e.message, true); }
  const lines = d.contenido.split('\n'); let prevVacia = false;
  const body = lines.map((ln, i) => {
    const hit = i === d.ancla, vacia = !ln.trim();
    if (vacia) { if (prevVacia) return ''; prevVacia = true; return '<div class="ln sp"></div>'; } prevVacia = false;
    const ts = /^\[(\d\d:\d\d:\d\d)\]\s?(.*)$/.exec(ln);
    if (ts) return `<div class="ln ts${hit ? ' hit' : ''}"${hit ? ' id="es-hit"' : ''}><time>${ts[1]}</time><span>${esc(ts[2])}</span></div>`;
    if (/^\[[^\]]*\|\s*pág\. PDF \d+\]/.test(ln)) return `<div class="ln pg${hit ? ' hit' : ''}"${hit ? ' id="es-hit"' : ''}>${esc(ln)}</div>`;
    return `<div class="ln${hit ? ' hit' : ''}"${hit ? ' id="es-hit"' : ''}>${esc(ln)}</div>`;
  }).join('');
  drawer(html`<article class="es-doc"><span class="lbl">${d.tipo}</span><h1>${d.titulo}</h1>
      <p class="mut sm">${f.t ? `En ${f.t}. ` : f.p ? `En la pág. PDF ${f.p}. ` : ''}Texto literal de la biblioteca de Hormozi${d.recortado ? ` · mostrando las líneas ${d.desde + 1}–${d.hasta} de ${d.total}` : ''}.</p>
      ${d.recortado ? html`<button class="btn ghost sm" data-act="completo">Ver el archivo completo</button>` : ''}
      <div class="es-srcbody">${raw(body)}</div></article>`,
  { completo: () => abrirFuente(f, true) }, { section: 'Estrategia', title: f.titulo || d.titulo });
  setTimeout(() => document.getElementById('es-hit')?.scrollIntoView({ block: 'center' }), 80);
}
