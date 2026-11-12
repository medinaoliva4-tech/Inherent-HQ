// Vista del Funnel Builder (herramienta funnel-builder de Marketing): el canvas TOF → MOF → captura → cierre → recompra, cada etapa con sus
// activos (piezas por etapa, landings de Tech, etapa del CRM) y su métrica, las barras de caída entre etapas y el plan de mejoras (que se
// vuelven tareas). Solo Growth Partnership: con otro nivel se oculta y dice por qué. Existe para que tool-shell.js pinte el centro de la
// herramienta con un solo contrato (nuevo, pintar, resumen) y para que lo que falta diga «⚠️ SIN DATOS» y de dónde sale, nunca 0.
// Pinta con html`…` (todo se escapa); lo que dice un modelo ya pasó por limpiar(). Las landings siguen en «Sitios y landings» (…/funnel-builder/sitios).
import { html, mount, api, col, ico, today, techDetail } from '../core.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { nombreMes, mesOk } from '../plan-mes.js';
import { mesDe, mesesRecientes, piezasDelMes } from './kpis.js';
import { AREAS } from './reporte.js';
import { rutaHerramienta } from '../herramientas.js';
import { ETAPAS, MAX_MEJORAS, MIN_MEJORAS, vacio, limpiar, caidas, mayorCaida, desdeDatos, motivoOculto, nombreEtapa, recordarFunnel } from './funnel.js';
import { fallo } from '../visual.js';

const enc = encodeURIComponent;
const hoyDe = (ctx) => (/^\d{4}-\d{2}-\d{2}$/.test(String(ctx?.hoy ?? '')) ? ctx.hoy : today());
const num = (n) => Number(n).toLocaleString('en-US');
const ponerRuta = (obj, ruta, v) => { const p = ruta.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[ultimo] = v; };
const base = (contenido) => limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {}));

// ---------- El canvas ----------
function etapaHtml(e, vivo, c, i) {
  const guardada = c.etapas[i], valor = guardada.valor ?? vivo?.valor ?? null, fuente = guardada.valor !== null ? guardada.fuente || vivo?.fuente || '' : vivo?.fuente || '';
  const def = ETAPAS[i];
  return html`<li class="fnl-et" data-id="${def.id}" data-estado="${valor === null ? 'sin-datos' : 'ok'}">
    <b class="fnl-et-n">${def.nombre}</b><span class="fnl-et-m">${def.medida}</span>
    <span class="fnl-et-v">${valor === null ? SIN_DATOS : num(valor)}</span>
    <span class="fnl-et-f mut sm">${valor === null ? String(fuente || `${SIN_DATOS}: sale de ${def.sale_de}`).replace(/^⚠️ SIN DATOS:\s*/, '') : `Fuente: ${fuente || '—'}`}</span>
    <ul class="fnl-act" aria-label="Activos de ${def.nombre}">${(vivo?.activos || []).map((a) => html`<li data-tipo="${a.tipo}">${a.texto}</li>`)}</ul>
    ${guardada.nota ? html`<p class="fnl-nota sm">${guardada.nota}</p>` : ''}</li>`;
}
function barras(c, valores) {
  const mix = { etapas: c.etapas.map((e, i) => ({ id: e.id, valor: e.valor ?? valores[i]?.valor ?? null })) };
  const cs = caidas(mix), mayor = mayorCaida(mix);
  return html`<ol class="fnl-caidas" aria-label="Caída entre etapas">${cs.map((x, i) => html`<li class="fnl-caida" data-mayor="${mayor === i ? 1 : 0}" data-estado="${x.pct === null ? 'sin-datos' : 'ok'}">
    <span class="fnl-caida-t">${nombreEtapa(x.de).split(' · ')[0]} → ${nombreEtapa(x.a).split(' · ')[0]}</span>
    ${x.pct === null ? html`<span class="fnl-sd">${x.razon}</span>`
      : html`<span class="fnl-barra" role="img" aria-label="${x.pct >= 0 ? `Se pierde el ${x.pct}%` : `Sube ${Math.abs(x.pct)}%`}"><i style="width:${Math.max(0, Math.min(100, x.pct))}%"></i></span><b class="fnl-caida-v">${x.pct >= 0 ? `−${x.pct}%` : `+${Math.abs(x.pct)}%`}</b>${mayor === i ? html`<span class="chip sm2">la más grande</span>` : ''}`}</li>`)}</ol>`;
}
const areaOpts = (area) => html`<option value="">— área</option>${AREAS.map(([, n]) => html`<option value="${n}" ${area === n ? 'selected' : ''}>${n}</option>`)}${area && !AREAS.some(([, n]) => n === area) ? html`<option value="${area}" selected>${area}</option>` : ''}`;
function mejorasHtml(c, ed) {
  const n = c.mejoras.length;
  return html`<div class="fnl-campo-h"><span class="lbl">Plan de mejoras</span><span class="mut sm">De ${MIN_MEJORAS} a ${MAX_MEJORAS}, cada una con su etapa, su área y su fecha</span><span class="fnl-cuenta" data-ok="${n >= MIN_MEJORAS && n <= MAX_MEJORAS ? 1 : 0}">${n} de ${MIN_MEJORAS} a ${MAX_MEJORAS}</span></div>
    ${n ? html`<ol class="fnl-lista">${c.mejoras.map((m, i) => html`<li class="fnl-m" data-i="${i}">${ed
      ? html`<div class="fnl-fila"><label><span class="sr-only">Etapa de la mejora ${i + 1}</span><select class="in" data-c="mejoras.${i}.etapa" aria-label="Etapa de la mejora ${i + 1}"><option value="">— etapa</option>${ETAPAS.map((e) => html`<option value="${e.id}" ${m.etapa === e.id ? 'selected' : ''}>${e.nombre}</option>`)}</select></label>
          <label class="fnl-f-ancho"><span class="sr-only">Mejora ${i + 1}</span><input class="in" type="text" data-c="mejoras.${i}.accion" value="${m.accion}" maxlength="240" placeholder="Qué se hace" aria-label="Mejora ${i + 1}" autocomplete="off"></label>
          <label><span class="sr-only">Área de la mejora ${i + 1}</span><select class="in" data-c="mejoras.${i}.area" aria-label="Área de la mejora ${i + 1}">${areaOpts(m.area)}</select></label>
          <label><span class="sr-only">Fecha de la mejora ${i + 1}</span><input class="in" type="date" data-c="mejoras.${i}.fecha" value="${m.fecha}" aria-label="Fecha de la mejora ${i + 1}"></label>
          <button type="button" class="btn ghost" data-a="m-" data-i="${i}" aria-label="Quitar la mejora ${i + 1}">${ico('x', 14)}</button></div>`
      : html`<p class="fnl-ro"><b>${m.etapa ? nombreEtapa(m.etapa) : SIN_DATOS}</b> · ${m.accion}<span class="mut sm"> · ${m.area || SIN_DATOS} · ${m.fecha || SIN_DATOS}</span></p>`}</li>`)}</ol>`
      : html`<p class="fnl-sd">${SIN_DATOS}: faltan las mejoras (cada una ataca una caída del embudo)</p>`}
    ${ed && n < MAX_MEJORAS ? html`<button type="button" class="btn ghost" data-a="m+">${ico('plus', 14)} Agregar una mejora</button>` : ''}
    <p class="mut sm">Un cambio de pauta es una tarea para ⑩ Ads o el OK del CEO: aquí no se hace.</p>`;
}

export const vista = {
  nuevo() { return vacio(); },

  pintar(el, { contenido, editable, onCambio, ctx, me, slug, docId } = {}) {
    const razon = motivoOculto(ctx?.cliente?.nivel);
    if (razon) { mount(el, html`<div class="empty fnl-oculto" role="status"><b>${ico('lock', 16)} Funnel Builder no está en este nivel</b>${razon}</div>`); return; }
    const ed = Boolean(editable), hoy = hoyDe(ctx), c = base(contenido), S = { mes: mesDe(hoy), vivo: null, error: null, tok: 0 };
    mount(el, html`<div class="fnl" data-editable="${ed ? 1 : 0}">
      <section class="fnl-sec" aria-label="El embudo"><div class="fnl-bar"><h3 class="fnl-t">${ico('funnel', 16)} El embudo <span class="fnl-t-m" data-r="mes-n"></span></h3>
        <label class="fnl-mes"><span class="sr-only">Mes</span><select class="in" data-mes aria-label="Mes del embudo">${mesesRecientes(hoy, 12).map((m) => html`<option value="${m}" ${S.mes === m ? 'selected' : ''}>${nombreMes(m)}</option>`)}</select></label>
        <a class="btn ghost" href="${rutaHerramienta('marketing', slug, 'funnel-builder')}/sitios">${ico('link', 14)} Sitios y landings</a>
        ${ed ? html`<button type="button" class="btn ghost" data-a="numeros" disabled>${ico('chart-column', 14)} Usar los números de arriba</button>` : ''}</div>
        <div data-r="canvas"></div><div class="fnl-bloque"><h4 class="fnl-h4">${ico('chart-no-axes-column-increasing', 14)} Dónde se cae</h4><div data-r="caidas"></div></div></section>
      <section class="fnl-sec" aria-label="Mejoras"><div data-r="mejoras"></div></section></div>`);
    const root = el.firstElementChild, region = (n) => root.querySelector(`[data-r="${n}"]`), vivo = () => root.isConnected;
    const emitir = () => { if (ed && typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };
    const valores = () => S.vivo || ETAPAS.map(() => null);
    const pintarCanvas = () => {
      const mn = region('mes-n'); if (mn) mn.textContent = nombreMes(S.mes);
      if (S.error) return mount(region('canvas'), html`${fallo({ titulo: 'No pude leer el embudo', linea: S.error.message || 'Inténtalo de nuevo en un momento.', detalle: techDetail(S.error) })}`);
      if (!S.vivo && !c.etapas.some((e) => e.valor !== null)) return mount(region('canvas'), html`<p class="loading">Leyendo el embudo del mes…</p>`);
      mount(region('canvas'), html`<ol class="fnl-canvas" aria-label="Las 5 etapas, de arriba a abajo">${ETAPAS.map((e, i) => etapaHtml(e, S.vivo?.[i], c, i))}</ol>`);
      pintarCaidas();
    };
    const pintarCaidas = () => mount(region('caidas'), barras(c, S.vivo || []));
    const pintarMejoras = () => mount(region('mejoras'), mejorasHtml(c, ed));

    async function cargar() {
      const tok = ++S.tok, mes = mesOk(S.mes) ? S.mes : mesDe(hoy);
      S.vivo = null; S.error = null; pintarCanvas();
      try {
        // Cada lectura falla por su cuenta: lo que no llegó queda ⚠️ SIN DATOS con su fuente, no tumba el embudo.
        const [kpis, tech, content, leads] = await Promise.all([
          api(`marketing/${enc(slug)}/kpis?mes=${enc(mes)}`), api(`tech?profile=${enc(slug)}`).catch(() => ({ sitios: [] })),
          col('content').list().catch(() => []), col('leads').list().catch(() => null)]);
        if (tok !== S.tok || !vivo()) return;
        const piezas = piezasDelMes({ posts: content, plan: null, slug, mes });
        S.vivo = desdeDatos({ embudo: kpis.embudo, piezas, sitios: tech.sitios || [], leads, slug, mes });
        recordarFunnel(slug, S.vivo);
      } catch (e) { if (tok !== S.tok || !vivo()) return; S.error = e; }
      if (tok !== S.tok || !vivo()) return;
      pintarCanvas();
      const b = root.querySelector('[data-a="numeros"]'); if (b) b.disabled = !S.vivo;
    }
    pintarCanvas(); pintarMejoras();
    cargar().catch(() => {});

    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t?.dataset?.mes !== undefined) { S.mes = t.value; cargar().catch(() => {}); return; }
      const k = t?.dataset?.c; if (!ed || !k || !root.contains(t)) return;
      ponerRuta(c, k, t.value); emitir();
    });
    root.addEventListener('input', (e) => { const t = e.target, k = t?.dataset?.c; if (!ed || !k || !root.contains(t) || t.tagName === 'SELECT') return; ponerRuta(c, k, t.value); emitir(); });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b || !root.contains(b) || !ed) return;
      const a = b.dataset.a, i = Number(b.dataset.i);
      if (a === 'numeros') { if (!S.vivo) return; S.vivo.forEach((v, k) => { c.etapas[k].valor = v.valor; c.etapas[k].fuente = v.valor === null ? '' : v.fuente; }); emitir(); pintarCanvas(); return; }
      if (a === 'm+') {
        if (c.mejoras.length >= MAX_MEJORAS) return;
        const k = mayorCaida({ etapas: c.etapas.map((x, j) => ({ id: x.id, valor: x.valor ?? S.vivo?.[j]?.valor ?? null })) }); // la mejora nace en la etapa donde más se cae
        c.mejoras.push({ etapa: k === null ? '' : ETAPAS[k + 1].id, accion: '', area: '', fecha: '' });
        pintarMejoras(); root.querySelector(`[data-c="mejoras.${c.mejoras.length - 1}.accion"]`)?.focus(); return;
      }
      if (a === 'm-') { c.mejoras.splice(i, 1); emitir(); pintarMejoras(); }
    });
  },

  // Para comparar versiones y para la propuesta de la IA: las etapas con su número y las mejoras.
  resumen(contenido) {
    const c = base(contenido);
    return html`<div class="fnl-res"><ul>${c.etapas.map((e, i) => html`<li>${ETAPAS[i].nombre}: <b>${e.valor === null ? SIN_DATOS : num(e.valor)}</b>${e.nota ? html`<span class="mut sm"> · ${e.nota}</span>` : ''}</li>`)}</ul>
      ${c.mejoras.length ? html`<ul>${c.mejoras.map((m) => html`<li>${m.accion}<span class="mut sm"> · ${m.etapa ? nombreEtapa(m.etapa) : SIN_DATOS} · ${m.area || SIN_DATOS}${m.fecha ? ` · ${m.fecha}` : ''}</span></li>`)}</ul>` : html`<p class="mut sm">${SIN_DATOS}: faltan las mejoras</p>`}</div>`;
  },
};
