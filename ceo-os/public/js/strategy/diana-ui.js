// Vista del Customer Bullseye (herramienta customer-bullseye de Strategy): la diana de audiencia con sus 5 anillos (Centro = ICP · 1 = Prioritario
// · 2 = Secundario · 3 y 4 = Baja prioridad), un panel de segmentos con UN mensaje y UN ángulo por anillo, la mezcla 3/1/1 y, en solo lectura,
// el aprendizaje de los lotes. Existe para que tool-shell.js pinte el centro de la herramienta con un solo contrato (nuevo, pintar, resumen) y
// para que lo vacío diga «⚠️ SIN DATOS» y de dónde sale. Pinta con html`…` (todo se escapa), lee y escribe con inputs nativos y avisa cada
// cambio con el contenido completo y limpio; la diana, los avisos y las búsquedas se recalculan solos sin tocar el campo donde la persona escribe.
import { html, mount, ico, api, toast } from '../core.js';
import { rutaHerramienta } from '../herramientas.js';
import { plano, SIN_DATOS } from '../consulting/marcos.js';
import { ANILLOS, ANGULOS, vacio, limpiar } from './diana.js';

const R = [30, 60, 90, 120, 150], C = 170; // radios del centro hacia afuera, en un lienzo de 340 (los mismos de bullseye.js)
const enc = encodeURIComponent;
// «sale de la ficha» · «sale del CRM»: sin el «de el» que salen al pegar un texto que empieza con «el».
const saleDe = (x) => (/^el\s/i.test(x) ? `sale del ${String(x).slice(3)}` : `sale de ${x}`);
// De dónde sale cada dato cuando falta («⚠️ SIN DATOS: sale de …»).
const SD = {
  centro: 'la entrevista con el cliente (el Chat de Strategy) y lo que ya publica su marca',
  anillo: 'el centro: cada anillo suelta UNA restricción y deja un público real que se puede nombrar',
  mensaje: 'lo que le duele o desea ese público, en la Investigación y en lo que dice el cliente',
  angulo: 'el mensaje: el ángulo de contenido que mejor lo cuenta',
  tema: 'el centro y los anillos 1 y 2: un tema por video del primer lote',
  busqueda: 'lo que ese público busca en TikTok o Instagram (Research)',
  lotes: 'los resultados de cada lote de videos: conversiones por anillo',
};
const ponerRuta = (obj, ruta, v) => { const p = ruta.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[ultimo] = v; };
const lleno = (t) => Boolean(String(t ?? '').trim()); // «   » no cuenta como escrito: limpiar() lo deja vacío
const listaBusquedas = (t) => String(t ?? '').split(/[,\n]/).map((s) => s.trim().slice(0, 60)).filter(Boolean).slice(0, 4); // como limpiar(): hasta 4, de 60 caracteres

// El contenido de trabajo: el limpio (5 anillos, 5 temas) más `m`, un mensaje y un ángulo por anillo (vacíos mientras la persona escribe).
function base(contenido) {
  const c = limpiar(plano(contenido) ? contenido : {});
  c.m = ANILLOS.map((a) => { const x = c.mensajes.find((y) => y.anillo === a.id); return { mensaje: x?.mensaje || '', angulo: x?.angulo || '' }; });
  return c;
}
// Lo que se manda al shell: el contenido completo y limpio (limpiar() arma objetos nuevos: nunca comparte referencias con el de trabajo).
const salida = (c) => limpiar({ ...c, mensajes: c.m.map((x, i) => ({ anillo: i, mensaje: x.mensaje, angulo: x.angulo })) });

// Los campos: un input nativo si se edita; texto plano (o ⚠️ SIN DATOS) si es de solo lectura.
function campos(editable) {
  const ro = (valor, o) => html`<span class="dn-ro" data-vacio="${valor ? 0 : 1}">${valor || (o.sd ? `${SIN_DATOS}: ${saleDe(o.sd)}` : '—')}</span>`;
  return {
    txt: (ruta, valor, o = {}) => (editable ? html`<input class="in" type="text" data-c="${ruta}" value="${valor ?? ''}" maxlength="${o.max || 200}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}" autocomplete="off">` : ro(valor, o)),
    area: (ruta, valor, o = {}) => (editable ? html`<textarea class="in" data-c="${ruta}" rows="${o.filas || 2}" maxlength="${o.max || 400}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">${valor ?? ''}</textarea>` : ro(valor, o)),
    sel: (ruta, lista, actual, o = {}) => (editable
      ? html`<select class="in" data-c="${ruta}" aria-label="${o.label || ''}"><option value="">${o.vacio || '—'}</option>${lista.map(([v, l]) => html`<option value="${v}" ${String(actual ?? '') === String(v) ? 'selected' : ''}>${l}</option>`)}</select>`
      : ro(lista.find(([v]) => String(v) === String(actual ?? ''))?.[1] || '', o)),
  };
}

// ---------- Regiones derivadas: se recalculan solas y nunca contienen un campo editable ----------
// La diana: 5 anillos concéntricos. Cada uno es un solo grupo (anillo + número) con el que se elige su segmento; no lleva datos de la persona
// más que en el aria-label, que se escapa.
function diana({ c }) {
  return html`<svg class="dn-svg" viewBox="0 0 340 340" role="group" aria-label="La diana de audiencia: 5 anillos, del centro hacia afuera">${[4, 3, 2, 1, 0].map((i) => html`<g class="dn-ring" data-act="dn-anillo" data-i="${i}" data-clave="${ANILLOS[i].clave}" data-lleno="${lleno(c.rings[i].label) ? 1 : 0}" tabindex="0" role="button" aria-label="${ANILLOS[i].nombre}: ${lleno(c.rings[i].label) ? c.rings[i].label : 'sin datos'}"><circle cx="${C}" cy="${C}" r="${R[i]}"/><text class="dn-n" x="${C}" y="${i ? C - (R[i] + R[i - 1]) / 2 + 4 : C + 4}" text-anchor="middle">${i ? i : 'ICP'}</text></g>`)}</svg>`;
}
// El estado de un segmento: sin audiencia, ⚠️ SIN DATOS con de dónde sale; con audiencia, qué le falta o «Completo».
function estado({ c, i }) {
  const r = c.rings[i], m = c.m[i], f = [];
  if (!lleno(r.label)) return html`<span class="dn-sd">${SIN_DATOS}: ${saleDe(i ? SD.anillo : SD.centro)}</span>`;
  if (i && !lleno(r.relaxed)) f.push('qué restricción suelta');
  if (!lleno(m.mensaje)) f.push('el mensaje'); else if (!m.angulo) f.push('el ángulo');
  return f.length ? html`<span class="dn-chip" data-ok="0">Falta: ${f.join(' · ')}</span>` : html`<span class="dn-chip" data-ok="1">${ico('check', 12)} Completo</span>`;
}
// Las búsquedas de un anillo, cada una con su enlace a TikTok y a Instagram (la URL se arma con encodeURIComponent y se escapa).
function buscar({ c, i }) {
  const s = c.rings[i].search;
  return s.length ? html`<ul class="dn-bus">${s.map((x) => html`<li class="dn-bus-i"><span>${x}</span><a href="https://www.tiktok.com/search?q=${enc(x)}" target="_blank" rel="noopener noreferrer">TikTok ↗</a><a href="https://www.instagram.com/explore/search/keyword/?q=${enc(x)}" target="_blank" rel="noopener noreferrer">IG ↗</a></li>`)}</ul>`
    : html`<p class="dn-sd">${SIN_DATOS}: ${saleDe(SD.busqueda)}</p>`;
}
// Las salidas: mandar el centro a otras herramientas (enlaces) y, si la diana está vacía, traer la que ya hay en Contenido.
function acciones({ c, editable, slug }) {
  const centro = lleno(c.center) || lleno(c.rings[0].label);
  const enlace = (id, texto) => (centro
    ? html`<a class="btn ghost sm dn-envia" href="${rutaHerramienta('strategy', slug, id)}">${ico('arrow-right', 13)} ${texto}</a>`
    : html`<span class="btn ghost sm dn-envia" aria-disabled="true" title="Primero define el centro">${ico('arrow-right', 13)} ${texto}</span>`);
  return html`<div class="dn-envios">${enlace('customer-avatar-studio', 'Enviar el centro a Avatar Studio')}${enlace('offer-architect', 'Enviar a Offer Architect')}${editable && !centro ? html`<button type="button" class="btn ghost sm dn-traer" data-act="dn-traer">${ico('download', 13)} Traer la diana de Contenido</button>` : ''}</div>`;
}
const REGIONES = { svg: diana, est: estado, bus: buscar, acc: acciones };

// ---------- La vista ----------
function segmento(a, { c }, f, editable) {
  const i = a.id, r = c.rings[i], m = c.m[i];
  return html`<article class="dn-seg" data-i="${i}" data-clave="${a.clave}" data-grupo="${a.grupo}" data-sel="0">
    <header class="dn-seg-h"><span class="dn-dot" aria-hidden="true"></span><div class="dn-seg-t"><h4>${a.nombre}</h4><span class="mut sm">${a.que}</span></div><span class="dn-seg-est" data-r="est" data-i="${i}"></span></header>
    <div class="dn-seg-b">
      <label class="dn-f dn-f-ancho"><span class="lbl">${i ? 'Audiencia de este anillo' : 'Audiencia exacta (el ICP)'}</span>${f.txt(`rings.${i}.label`, r.label, { max: 160, label: `${a.nombre}: audiencia`, ph: i ? 'El público de este anillo' : 'La persona exacta a quien le hablas' })}</label>
      ${i ? html`<label class="dn-f"><span class="lbl">Qué restricción suelta</span>${f.txt(`rings.${i}.relaxed`, r.relaxed, { max: 120, label: `${a.nombre}: restricción que suelta`, ph: 'industria, tamaño, modelo…', sd: SD.anillo })}</label>` : ''}
      <label class="dn-f dn-f-ancho"><span class="lbl">Mensaje <span class="mut sm">una frase: lo que le dices a este público</span></span>${f.area(`m.${i}.mensaje`, m.mensaje, { max: 300, filas: 2, label: `${a.nombre}: mensaje`, ph: 'Una frase, en sus palabras', sd: SD.mensaje })}</label>
      <label class="dn-f"><span class="lbl">Ángulo</span>${f.sel(`m.${i}.angulo`, ANGULOS.map((x) => [x, x]), m.angulo, { vacio: '— sin ángulo', label: `${a.nombre}: ángulo`, sd: SD.angulo })}</label>
      <details class="dn-mas" ${editable ? '' : 'open'}><summary>Tamaño, cercanía, competencia y búsquedas</summary>
        <div class="dn-mas-g">
          <label class="dn-f"><span class="lbl">Tamaño</span>${f.txt(`rings.${i}.size`, r.size, { max: 120, label: `${a.nombre}: tamaño`, ph: 'miles · millones (estimación)' })}</label>
          <label class="dn-f"><span class="lbl">Cercanía a comprar</span>${f.txt(`rings.${i}.conversion`, r.conversion, { max: 120, label: `${a.nombre}: cercanía a comprar`, ph: 'alta · media · baja' })}</label>
          <label class="dn-f"><span class="lbl">Competencia</span>${f.txt(`rings.${i}.competition`, r.competition, { max: 120, label: `${a.nombre}: competencia`, ph: 'vacía · llena…' })}</label>
          ${editable ? html`<label class="dn-f"><span class="lbl">Búsquedas <span class="mut sm">hasta 4, separadas por coma</span></span><input class="in" type="text" data-c="@search.${i}" value="${r.search.join(', ')}" maxlength="240" placeholder="lo que escribiría ese público" aria-label="${a.nombre}: búsquedas" autocomplete="off"></label>` : ''}
        </div>
        <div class="dn-mas-bus" data-r="bus" data-i="${i}"></div>
      </details>
    </div></article>`;
}

function plantilla(E, f, editable) {
  const { c } = E;
  return html`<div class="dn" data-editable="${editable ? 1 : 0}" data-sel="0">
    <section class="dn-sec dn-centro" aria-label="El centro">
      <h3 class="dn-t">${ico('target', 16)} El centro <span class="mut sm">una persona exacta, no «emprendedores»</span></h3>
      <label class="dn-f dn-f-ancho"><span class="lbl">En una frase</span>${f.area('center', c.center, { max: 400, filas: 2, label: 'El centro en una frase', ph: '[persona específica] que [situación] y batalla con [problema]', sd: SD.centro })}</label>
      <label class="dn-f"><span class="lbl">Quien paga <span class="mut sm">solo si no es quien ve</span></span>${f.txt('buyer', c.buyer, { max: 300, label: 'Quien paga', ph: 'Déjalo vacío si quien ve es quien paga' })}</label>
      <div data-r="acc"></div>
    </section>

    <section class="dn-sec dn-cuerpo" aria-label="La diana y sus segmentos">
      <figure class="dn-fig"><div class="dn-svg-w" data-r="svg"></div><figcaption class="mut sm">Toca un anillo para ir a su segmento. Primero precisión, después alcance: apunta al centro y el algoritmo abre el resto.</figcaption></figure>
      <div class="dn-segs">${ANILLOS.map((a) => segmento(a, E, f, editable))}</div>
    </section>

    <section class="dn-sec dn-mix" aria-label="La mezcla 3/1/1">
      <h3 class="dn-t">${ico('layers', 16)} La mezcla 3/1/1 <span class="mut sm">el primer lote de 5 videos</span></h3>
      <p class="mut sm">3 al centro, 1 al anillo 1 y 1 al anillo 2. Los anillos 3 y 4 te los da el algoritmo cuando ya ganaste el centro.</p>
      <ol class="dn-mix-l">${c.mix.map((m, i) => html`<li class="dn-mix-f" data-ring="${m.ring}"><label class="dn-f"><span class="lbl">Video ${i + 1} · ${ANILLOS[m.ring].nombre}</span>${f.txt(`mix.${i}.topic`, m.topic, { max: 240, label: `Video ${i + 1}: tema`, ph: 'Un tema escrito para ese público', sd: SD.tema })}</label></li>`)}</ol>
    </section>

    <section class="dn-sec dn-calib" aria-label="Lo que se aprendió por lote">
      <h3 class="dn-t">${ico('list', 16)} Lo que se aprendió <span class="mut sm">conversiones por anillo en cada lote · solo lectura</span></h3>
      ${c.calib.length ? html`<table class="dn-cal"><caption class="sr-only">Conversiones por anillo en cada lote de videos</caption>
        <thead><tr><th scope="col">Lote</th><th scope="col">Centro</th><th scope="col">Anillo 1</th><th scope="col">Anillo 2</th><th scope="col">Decisión</th></tr></thead>
        <tbody>${c.calib.map((x) => html`<tr><th scope="row">${x.lote || 'Lote'}</th><td>${x.c0}</td><td>${x.c1}</td><td>${x.c2}</td><td>${x.decision || '—'}</td></tr>`)}</tbody></table>`
        : html`<p class="dn-sd">${SIN_DATOS}: ${saleDe(SD.lotes)}</p>`}
    </section>
  </div>`;
}

function pintarDiana(el, args = {}) {
  const { contenido, editable, onCambio, slug } = args, ed = Boolean(editable);
  const c = base(contenido), E = { c, editable: ed, slug };
  let SEL = 0, ocupado = false;
  mount(el, plantilla(E, campos(ed), ed));
  const root = el.firstElementChild, cache = new WeakMap();
  const poner = (nodo, contenidoHtml) => { const s = String(contenidoHtml); if (cache.get(nodo) !== s) { cache.set(nodo, s); mount(nodo, contenidoHtml); } };
  // La selección (anillo ↔ segmento) solo mueve atributos: no vuelve a pintar nada donde la persona escribe.
  const marcar = (i) => {
    SEL = i; root.dataset.sel = String(i);
    for (const x of root.querySelectorAll('.dn-ring, .dn-seg')) x.dataset.sel = Number(x.dataset.i) === i ? '1' : '0';
  };
  const refrescar = () => {
    for (const nodo of root.querySelectorAll('[data-r]')) { const f = REGIONES[nodo.dataset.r]; if (f) poner(nodo, f({ ...E, i: Number(nodo.dataset.i) })); }
    marcar(SEL); // la diana se vuelve a dibujar cuando un anillo se llena o se vacía: se le devuelve la selección
  };
  refrescar();

  // Traer la diana que ya hay en Contenido (la casa de siempre): se carga en pantalla y la persona guarda.
  const traer = async () => {
    if (ocupado || !slug) return;
    ocupado = true;
    try {
      const r = await api(`content/cfg?profile=${enc(slug)}`);
      if (!root.isConnected) return;
      const bx = limpiar(r?.bullseye || {});
      if (!bx.center && !bx.rings[0].label) return toast('En Contenido todavía no hay una diana de este cliente', true);
      if (typeof onCambio === 'function') onCambio(bx);
      pintarDiana(el, { ...args, contenido: bx });
      toast('Traje la diana de Contenido. Guarda para dejarla aquí');
    } catch (e) { toast(e?.message || 'No pude leer la diana de Contenido', true); } finally { ocupado = false; }
  };
  const elegir = (i, foco) => {
    marcar(i);
    const seg = root.querySelector(`.dn-seg[data-i="${i}"]`);
    seg?.scrollIntoView?.({ block: 'nearest' });
    if (foco && ed) seg?.querySelector('[data-c]')?.focus();
  };
  root.addEventListener('click', (e) => {
    const t = e.target.closest?.('[data-act]'); if (!t || !root.contains(t)) return;
    if (t.dataset.act === 'dn-anillo') elegir(Number(t.dataset.i), false);
    else if (t.dataset.act === 'dn-traer') traer();
  });
  root.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.dn-ring')) { e.preventDefault(); elegir(Number(e.target.dataset.i), true); } });
  root.addEventListener('focusin', (e) => { const s = e.target.closest?.('.dn-seg'); if (s) marcar(Number(s.dataset.i)); }); // el anillo sigue al segmento donde escribes
  if (!ed) return;

  const alCambiar = (e) => {
    const t = e.target, k = t?.dataset?.c;
    if (!k || !root.contains(t)) return;
    if (k.startsWith('@search.')) c.rings[Number(k.slice(8))].search = listaBusquedas(t.value);
    else ponerRuta(c, k, t.value);
    if (typeof onCambio === 'function') onCambio(salida(c));
    refrescar();
  };
  root.addEventListener('input', alCambiar);
  root.addEventListener('change', alCambiar);
}

export const vista = {
  // El contenido inicial: vacío, o la diana que el contexto ya trae (ctx.diana) para no empezar de cero.
  nuevo(ctx) {
    const d = plano(ctx) && plano(ctx.diana) ? limpiar(ctx.diana) : null;
    return d && (d.center || d.rings[0].label) ? d : vacio();
  },

  pintar: pintarDiana,

  // Una línea para el Overview: el centro (el ICP).
  resumen(contenido) {
    const c = limpiar(plano(contenido) ? contenido : {}), centro = c.center || c.rings[0].label;
    return html`<span class="dn-res"><span class="chip">Centro · ICP</span> ${centro ? html`<span class="dn-res-c">${centro}</span>` : html`<span class="dn-sd">${SIN_DATOS}: falta definir el centro</span>`}</span>`;
  },
};
