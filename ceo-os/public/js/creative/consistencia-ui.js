// Brand Consistency Checker (herramienta brand-consistency-checker de Creative). SIN Tool Shell: trabaja sobre las piezas de la colección «content» y guarda su reporte en
// content.cumplimiento (con un historial que solo se agrega). Muestra la pieza grande y un reporte por sección (Color, Tipografía, Composición y safe zones, Prohibido, Voz y
// Parecido), regla por regla con pasa / no pasa, su corrección y su fuente; la ronda N de M de la ficha y, si ya se pasaron, el aviso de que lo decide el CEO.
// El pase es determinista (sistema visual + el ojo + Laya «suena»); br-guardian (la IA) completa lo que el pase no pudo medir. Nunca se ve en el portal: el cliente no entra aquí.
// Pinta con html`…` (todo se escapa; la salida de un modelo ya pasó por limpiar()). Lo vacío dice «⚠️ SIN DATOS» y de dónde sale.
import { html, mount, api, col, ico, toast, skel, fdate, techDetail } from '../core.js';
import { leerSistema } from '../sistema-visual.js';
import { ojoEstado, verImagen, ojoChip } from '../ojo.js';
import { variacionesDe } from '../diseno.js';
import { estadoDe } from '../element.js';
import { herramientaDe, rutaHerramienta } from '../herramientas.js';
import { armarCtx, correrIA } from '../ia-herramienta.js';
import { canEdit } from '../roleviews.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import * as K from './consistencia.js';
import { vacio, fallo } from '../visual.js';

const enc = encodeURIComponent;
const TOOL_ID = 'brand-consistency-checker';
const ICONO = { pasa: 'check', 'no-pasa': 'x', 'sin-datos': 'triangle-alert' };
const VEREDICTO = { pasa: 'Pasa', 'no-pasa': 'No pasa', incompleto: 'Incompleto' };
const quien = (r) => String(r || '').split('@')[0]; // el rol, nunca el correo
const hexes = (t) => String(t || '').split(/[\s,;]+/).map((x) => x.trim()).filter((x) => /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(x)).map((x) => (x.startsWith('#') ? x : `#${x}`));
const pctN = (v) => { const n = Number(String(v ?? '').replace(',', '.')); return String(v ?? '').trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null; };
const textoDe = (p) => [p.hook, p.title, p.caption, p.copy, p.description].filter((x) => typeof x === 'string' && x.trim()).join('\n');
// Las imágenes de la pieza: las láminas de la variación elegida (Drive) y, si no hay, los archivos de imagen de la pieza.
function imagenesDe(p) {
  const { variaciones, elegida } = variacionesDe(p), v = variaciones.find((x) => x.id === elegida) || variaciones[0];
  const ids = (v?.laminas || []).map((l) => l.drive_id).filter(Boolean);
  const arch = (p.assets || []).filter((a) => /^image\//.test(a.mime || '') && a.id).map((a) => a.id);
  return [...new Set(ids.length ? ids : arch)].slice(0, 12).map((id) => `https://drive.google.com/thumbnail?id=${enc(id)}&sz=w1000`);
}
const urlPublica = (p) => (/^https:\/\/\S+\.(png|jpe?g|webp)(\?\S*)?$/i.test(p.url || '') ? p.url : '');

// host: dónde se monta · me: quien mira · slug/b: la marca · alive(): ¿sigue en pantalla? · resto: [piezaId] si viene en la ruta.
export async function consistenciaTool(host, { me, slug, b, alive, resto = [] } = {}) {
  if (me?.role === 'client') return mount(host, html`${vacio({ icono: 'lock', titulo: 'Esta herramienta es del equipo', linea: 'El reporte de consistencia no se ve en el portal.' })}`);
  mount(host, skel('pagina'));
  const C = col('content');
  const S = { piezas: [], sel: resto[0] || '', sistema: null, sinSistema: '', ficha: null, laya: null, ojo: null, ojoOn: false, reporte: null, obs: { colores: '', fuentes: '', arriba: '', abajo: '', der: '', margen: '' }, ocupado: '', doc: null, error: null };
  let root = null;
  const pieza = () => S.piezas.find((p) => p.id === S.sel) || null;
  const max = () => K.rondasMax(S.ficha);
  const cumpl = () => K.limpiarCumplimiento(S.doc?.cumplimiento);
  const veCeo = me?.role === 'ceo';

  async function cargarBase() {
    const [todas, sis, est] = await Promise.all([C.list(), api(`repo/client/${enc(slug)}/sistema`).catch((e) => ({ md: '', error: e })), api(`estrategia/${enc(slug)}`).catch(() => null)]);
    S.piezas = todas.filter((p) => p.profile === slug && p.kind === 'post' && !p.archivado && estadoDe(p) !== 'Archivado')
      .sort((a, z) => (estadoDe(z) === 'Listo') - (estadoDe(a) === 'Listo') || String(z.date || '').localeCompare(String(a.date || '')));
    S.sistema = sis?.md ? leerSistema(sis.md) : null;
    S.sinSistema = S.sistema ? '' : slug === 'personal' ? 'La marca personal no tiene sistema visual en el repo' : 'sale de clients/<cliente>/02-marca/sistema-visual.md';
    S.ficha = est?.ficha || null;
    if (!pieza()) S.sel = S.piezas[0]?.id || '';
  }
  async function cargarPieza() {
    const p = pieza(); S.laya = null; S.ojo = p?.ojo || null; S.reporte = null; S.doc = null;
    if (!p) return;
    S.ojoOn = Boolean((await ojoEstado().catch(() => ({}))).on);
    const [doc, laya] = await Promise.all([C.get(p.id).catch(() => null), api(`laya/juicios?coll=content&id=${enc(p.id)}`).catch(() => null)]);
    S.doc = doc; S.laya = laya;
    S.reporte = cumpl().ultimo;
  }
  const layaSuena = () => {
    const j = S.laya?.resumen?.ultimos?.suena, q = (S.laya?.puerta?.preguntas || []).find((x) => x.id === 'suena');
    return j && Number.isFinite(j.prob) ? { prob: j.prob, umbral: q?.umbral ?? null } : null;
  };
  const observado = () => ({ colores: hexes(S.obs.colores), fuentes: String(S.obs.fuentes || '').split(/[,;]+/).map((x) => x.trim()).filter(Boolean),
    safe: pctN(S.obs.arriba) !== null && pctN(S.obs.abajo) !== null && pctN(S.obs.der) !== null ? { arriba: pctN(S.obs.arriba), abajo: pctN(S.obs.abajo), der: pctN(S.obs.der) } : null, margen: pctN(S.obs.margen) });
  const base = () => { const p = pieza(); const { variaciones, elegida } = variacionesDe(p || {}); const v = variaciones.find((x) => x.id === elegida) || variaciones[0]; return { titulo: p?.title || '', texto: textoDe(p || {}), formato: p?.format || '', revision: v?.revision || [] }; };
  const haz = async (clave, fn) => { if (S.ocupado) return; S.ocupado = clave; pintar(); try { await fn(); } catch (e) { if (alive()) { toast(e?.message || 'No se pudo completar. Inténtalo de nuevo.', true); if (e?.status === 409) { await cargarPieza().catch(() => {}); } } } S.ocupado = ''; if (alive()) pintar(); };

  // ---------- Pintar ----------
  function regla(r) {
    return html`<li class="cns-r" data-estado="${r.estado}"><span class="cns-r-i" aria-hidden="true">${ico(ICONO[r.estado], 14)}</span>
      <div class="cns-r-c"><b class="cns-r-t">${r.regla}</b><span class="sr-only"> ${K.ESTADOS.find(([k]) => k === r.estado)?.[1]}.</span>
        ${r.detalle ? html`<p class="cns-r-d sm">${r.detalle}</p>` : ''}${r.correccion ? html`<p class="cns-r-x sm"><b>Corrección:</b> ${r.correccion}</p>` : ''}
        <span class="chip sm2 cns-r-f">${r.fuente || `${SIN_DATOS}: sin fuente`}</span>
        ${r.estado === 'sin-datos' && S.puede ? html`<span class="cns-r-m"><label class="sr-only" for="cns-${r.id}">Resolver a ojo: ${r.regla}</label><select class="in" id="cns-${r.id}" data-r="${r.id}"><option value="">Resolver a ojo…</option><option value="pasa">Pasa</option><option value="no-pasa">No pasa</option></select></span>` : ''}</div></li>`;
  }
  function seccion(s) {
    const n = s.reglas.filter((r) => r.estado === 'no-pasa').length, sd = s.reglas.filter((r) => r.estado === 'sin-datos').length;
    return html`<section class="cns-sec" data-sec="${s.id}" data-estado="${n ? 'no-pasa' : sd ? 'sin-datos' : s.reglas.length ? 'pasa' : 'vacio'}"><h4 class="cns-sec-t">${K.nombreSeccion(s.id)}<span class="mut sm"> ${s.reglas.length ? `${n} no pasan · ${sd} sin datos` : SIN_DATOS}</span></h4>
      ${s.reglas.length ? html`<ul class="cns-rs">${s.reglas.map(regla)}</ul>` : html`<p class="cns-sd">${SIN_DATOS}: sin reglas revisadas en esta sección</p>`}
      ${s.id === 'parecido' && S.reporte && S.reporte.parecido === null ? html`<p class="cns-sd">Sin CLIP esta pieza sale sin Parecido: ${S.reporte.razon_parecido || 'el ojo no está encendido en esta compu'}.</p>` : ''}</section>`;
  }
  function rondas() {
    const e = K.estadoRondas({ historial: cumpl().historial, max: max() }), esc = e.escala || cumpl().escalado;
    return html`<div class="cns-rondas" data-escala="${esc ? 1 : 0}"><b>${e.texto}</b>${esc ? html`<p class="cns-alto" role="status">${ico('triangle-alert', 14)} Se pasaron las rondas de la ficha: esta pieza se escala al CEO${veCeo ? '' : ' y no se manda de nuevo hasta que él decida'}.</p>` : ''}</div>`;
  }
  function historial() {
    const h = cumpl().historial.slice().reverse();
    return html`<details class="cns-hist"><summary>Historial · ${h.length} ${h.length === 1 ? 'revisión' : 'revisiones'}</summary>${h.length ? html`<ol class="cns-hist-l">${h.map((x) => html`<li data-v="${x.veredicto}"><b>Ronda ${x.ronda}</b> · ${VEREDICTO[x.veredicto]} · ${x.no_pasa} no pasan · ${x.sin_datos} sin datos${x.en ? ` · ${fdate(String(x.en).slice(0, 10))}` : ''}${x.por ? ` · ${quien(x.por)}` : ''}${x.fallas.length ? html`<ul>${x.fallas.map((f) => html`<li>${K.nombreSeccion(f.seccion)}: ${f.regla}${f.correccion ? html` <span class="mut sm">→ ${f.correccion}</span>` : ''}</li>`)}</ul>` : ''}</li>`)}</ol>` : html`<p class="mut sm">Todavía no hay revisiones guardadas. El historial solo se agrega: nada se borra.</p>`}</details>`;
  }
  function observadoForm() {
    const o = S.obs, c = (k, l, ph, w = '') => html`<label class="cns-o ${w}"><span class="lbl">${l}</span><input class="in" type="text" data-o="${k}" value="${o[k]}" placeholder="${ph}" autocomplete="off"></label>`;
    return html`<details class="cns-obs"><summary>Lo que leí de la lámina <span class="mut sm">(opcional: sin esto, color, tipografía y safe zones quedan sin datos)</span></summary>
      <div class="cns-obs-g">${c('colores', 'Colores usados', '#FF6A00, #0B0B0B', 'cns-o-ancho')}${c('fuentes', 'Tipografías', 'Inter, Fraunces', 'cns-o-ancho')}${c('arriba', 'Margen de arriba (%)', '14')}${c('abajo', 'Margen de abajo (%)', '20')}${c('der', 'Margen derecho (%)', '6')}${c('margen', 'Margen general (%)', '8')}</div></details>`;
  }
  function pintar() {
    if (!alive() || !host.isConnected) return;
    const p = pieza(), r = S.reporte ? K.limpiar(S.reporte) : null, v = r ? K.veredicto(r) : '', k = r ? K.conteo(r) : null;
    if (S.error) return mount(host, html`${fallo({ titulo: 'No pude abrir la consistencia', linea: S.error.message || 'Inténtalo de nuevo en un momento.', detalle: techDetail(S.error) })}`);
    if (!S.piezas.length) return mount(host, html`${vacio({ icono: 'inbox', titulo: `${SIN_DATOS}`, linea: 'Todavía no hay piezas de esta marca. Salen del calendario de contenido y de Design Studio.' })}`);
    const imgs = p ? imagenesDe(p) : [], ocupado = Boolean(S.ocupado);
    mount(host, html`<div class="cns" data-editable="${S.puede ? 1 : 0}">
      <header class="cns-bar"><label class="sr-only" for="cns-pieza">Pieza</label><select class="in" id="cns-pieza" aria-label="Pieza">${S.piezas.map((x) => html`<option value="${x.id}" ${x.id === S.sel ? 'selected' : ''}>${x.title || x.name || 'Sin título'} · ${estadoDe(x)}</option>`)}</select>
        ${r ? html`<span class="cns-ver" data-v="${v}">${VEREDICTO[v]}</span>` : ''}<span class="sp"></span>
        <a class="btn ghost sm" href="${rutaHerramienta('creative', slug, 'design-studio')}">${ico('edit', 14)} Design Studio</a></header>
      <div class="cns-g"><div class="cns-pieza" aria-label="La pieza">${imgs.length ? html`<div class="cns-imgs">${imgs.map((u, i) => html`<img src="${u}" alt="Lámina ${i + 1} de ${p.title || 'la pieza'}" loading="lazy" referrerpolicy="no-referrer">`)}</div>` : html`<div class="cns-sd">${SIN_DATOS}: la pieza no tiene láminas ni imágenes en Drive (salen de Design Studio o de sus archivos)</div>`}
          <p class="cns-meta mut sm">${p.format || 'Formato sin definir'}${p.date ? ` · ${fdate(p.date)}` : ''} · ${estadoDe(p)}</p>
          <div class="cns-chips">${S.ojo ? ojoChip(S.ojo) : html`<span class="chip sm2">Sin CLIP: sin Parecido</span>`}${layaSuena() ? html`<span class="chip sm2">Laya · suena ${Math.round(layaSuena().prob * 100)}%</span>` : html`<span class="chip sm2">Laya · sin juicio</span>`}</div></div>
        <div class="cns-rep">${rondas()}
          ${S.puede ? html`<div class="cns-acc"><button type="button" class="btn" data-a="pase" ${ocupado ? 'disabled' : ''}>${ico('badge-check', 14)} ${S.ocupado === 'pase' ? 'Revisando…' : 'Pasar la revisión'}</button>
            <button type="button" class="btn ghost" data-a="guardian" ${ocupado || !r ? 'disabled' : ''}>${ico('eye', 14)} ${S.ocupado === 'guardian' ? 'br-guardian está leyendo…' : 'Pedir a br-guardian'}</button>
            ${S.ojoOn && urlPublica(p) ? html`<button type="button" class="btn ghost" data-a="ojo" ${ocupado ? 'disabled' : ''}>${ico('eye', 14)} Pasar el ojo</button>` : ''}</div>${observadoForm()}` : html`<p class="mut sm">Tu perfil lee el reporte; la revisión la pasa quien edita Contenido.</p>`}
          ${r ? html`${k ? html`<p class="cns-res"><b>${k.pasa}</b> pasan · <b>${k.noPasa}</b> no pasan · <b>${k.sinDatos}</b> sin datos</p>` : ''}${r.resumen ? html`<p class="cns-resumen">${r.resumen}</p>` : ''}
              <div class="cns-secs">${r.secciones.map(seccion)}</div>
              ${K.faltas(r).length ? html`<ul class="cns-faltas">${K.faltas(r).map((x) => html`<li>${ico('triangle-alert', 13)} ${x}</li>`)}</ul>` : ''}
              <div class="cns-acc"><button type="button" class="btn ghost sm" data-a="copiar" ${k.noPasa ? '' : 'disabled'}>${ico('copy', 14)} Copiar las correcciones</button>
                <button type="button" class="btn ghost sm" data-a="md">${ico('file-text', 14)} Copiar el reporte</button>
                ${S.puede ? html`<button type="button" class="btn sm" data-a="guardar" ${ocupado || K.faltas(r).length ? 'disabled' : ''}>${ico('check', 14)} ${S.ocupado === 'guardar' ? 'Guardando…' : 'Guardar la ronda'}</button>` : ''}</div>`
            : html`<p class="cns-sd">${SIN_DATOS}: esta pieza todavía no tiene reporte. «Pasar la revisión» lo arma con el sistema visual, el ojo y Laya.${S.sinSistema ? ` Sin sistema visual: ${S.sinSistema}.` : ''}</p>`}
          ${historial()}</div></div></div>`);
  }
  S.puede = canEdit(me, 'content'); // refleja el permiso; el servidor decide

  // ---------- Acciones ----------
  const pase = () => K.pase({ sistema: S.sistema, pieza: base(), observado: observado(), ojo: S.ojo, laya: layaSuena() });
  host.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.id === 'cns-pieza') { S.sel = t.value; await haz('cargar', cargarPieza); return; }
    if (t.dataset?.o !== undefined && t.dataset.o in S.obs) { S.obs[t.dataset.o] = t.value; return; }
    if (t.dataset?.r && t.value && S.reporte) { S.reporte = K.resolver(S.reporte, t.dataset.r, t.value); pintar(); }
  });
  host.addEventListener('click', (e) => {
    const bt = e.target.closest('[data-a]'); if (!bt || !host.contains(bt)) return;
    const a = bt.dataset.a, p = pieza(); if (!p) return;
    if (a === 'pase') return haz('pase', async () => { S.reporte = pase(); });
    if (a === 'ojo') return haz('ojo', async () => { S.ojo = await verImagen(slug, { url: urlPublica(p) }); S.reporte = pase(); });
    if (a === 'guardian') return haz('guardian', async () => {
      const tool = { ...herramientaDe(TOOL_ID), bloque: K.BLOQUE, prompt: K.prompt, leer: K.leer };
      const ctx = { ...(await armarCtx(me, { tool, slug })), pieza: base(), sistema: S.sistema, pase: S.reporte };
      const out = await correrIA(me, { tool, ctx }), leido = K.leer(out.texto);
      if (!leido) throw new Error('No pude leer la respuesta de br-guardian: pídela otra vez.');
      S.reporte = K.unir(S.reporte, leido.contenido); toast('br-guardian completó lo que el pase no pudo medir');
    });
    if (a === 'copiar') { const l = K.reglasDe(S.reporte).filter((r) => r.estado === 'no-pasa').map((r) => `- ${K.nombreSeccion(r.seccion)} · ${r.regla}: ${r.correccion}`); navigator.clipboard?.writeText(`Correcciones de «${p.title || 'la pieza'}»:\n${l.join('\n')}`).then(() => toast('Correcciones copiadas'), () => toast('No pude copiar', true)); return; }
    if (a === 'md') { navigator.clipboard?.writeText(K.aMd(S.reporte, { titulo: p.title })).then(() => toast('Reporte copiado'), () => toast('No pude copiar', true)); return; }
    if (a === 'guardar') return haz('guardar', async () => {
      // Se vuelve a leer la pieza: el historial que se agrega es el que hay ahora (no el de cuando se abrió) y con su v.
      const fresca = await C.get(p.id), nuevo = K.conReporte(fresca.cumplimiento, S.reporte, { por: me?.role || '', en: new Date().toISOString(), max: max() });
      if (!K.soloSeAgrega(fresca.cumplimiento, nuevo)) throw new Error('El historial solo se agrega: no se guardó nada.');
      S.doc = await C.save({ ...fresca, cumplimiento: nuevo });
      const i = S.piezas.findIndex((x) => x.id === p.id); if (i >= 0 && S.doc?.id) S.piezas[i] = S.doc;
      toast(nuevo.escalado && !K.limpiarCumplimiento(fresca.cumplimiento).escalado ? 'Ronda guardada: se pasaron las rondas, lo decide el CEO' : 'Ronda guardada');
    });
  });

  try { await cargarBase(); await cargarPieza(); } catch (e) { S.error = e; }
  pintar();
}
