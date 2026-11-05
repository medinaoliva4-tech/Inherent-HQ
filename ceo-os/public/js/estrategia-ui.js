// Las mesas de Strategy: Mapa de la Meta y Voz del comprador.
import { html, mount, api, col, ico, toast } from './core.js';
import { cargarContexto, contextoLista, contextoActual, ponerContexto } from './contexto.js';
import { limpiarEstrategia, analizarMeta, resumenVoces, TIPOS_VOZ } from './estrategia-datos.js';
import { limpiarEmbudo, analizarEmbudo, idEmbudo } from './embudo-datos.js';

const C = col('strategy_meta');
const q = (n) => `Q${Math.round(Number(n) || 0).toLocaleString('es-GT')}`;
const pct = (n) => `${Math.round((Number(n) || 0) * 100)}%`;
const valor = (v, u) => (u === 'pct' ? pct(v) : u === 'q' ? q(v) : Math.round(v).toLocaleString('es-GT'));

export async function pintarEstrategia(el, { me, area, tabs, vista, alive }) {
  await cargarContexto(me).catch(() => {});
  if (!alive()) return;
  const lista = contextoLista().filter((c) => c.slug);
  let slug = contextoActual(me) || lista[0]?.slug || '', doc = null, d = null, fuga = null, nueva = { frase: '', tipo: TIPOS_VOZ[0], tema: '', fuente: '' };
  const cargar = async () => {
    doc = await C.get(slug).catch(() => null);
    d = limpiarEstrategia({ ...(doc || {}), client_slug: slug });
    const e = await col('embudos').get(idEmbudo(slug, new Date().toISOString().slice(0, 7))).catch(() => null);
    fuga = e ? analizarEmbudo(limpiarEmbudo(e).etapas, e).fuga : null;
    pintar();
  };
  const guardar = async () => {
    try {
      const datos = limpiarEstrategia({ ...d, client_slug: slug });
      doc = doc ? await C.save({ ...doc, ...datos }) : await api('db/strategy_meta', { method: 'POST', body: { ...datos, id: slug } });
      d = datos; toast('Guardado'); pintar();
    } catch (e) { toast(e.message, true); }
  };
  const barra = () => html`<div class="din-bar"><select class="in" id="d-cl" aria-label="Cliente">${lista.map((c) => html`<option value="${c.slug}" ${c.slug === slug ? 'selected' : ''}>${c.name}</option>`)}</select></div>`;
  const cabeza = (titulo, sub) => html`<div class="hello sp-hero ar-head" style="--ar-c:var(${area.color})"><span class="ar-ico">${ico(area.icono, 22)}</span><div class="ar-tit"><h1>${titulo}</h1><p>${sub}</p></div></div>${tabs(area, 'herramientas')}`;
  const campo = (k, nombre, tipo = 'text', extra = '') => html`<label><span>${nombre}</span><input class="in" type="${tipo}" ${tipo === 'text' ? 'inputmode="numeric"' : ''} data-k="${k}" value="${d[k] || ''}" ${extra}></label>`;

  function meta() {
    const a = analizarMeta(d);
    mount(el, html`${cabeza('Mapa de la Meta', 'Qué tan lejos está y qué tendría que moverse para llegar.')}${barra()}
      <div class="mm-dist"><div class="mm-num"><span>Falta para la meta</span><b>${d.meta ? q(a.falta) : '—'}</b></div><div class="mm-bar" role="img" aria-label="Avance ${pct(a.avance)}"><i style="width:${(a.avance * 100).toFixed(1)}%"></i></div><div class="mm-pie"><span>${q(d.actual)} al mes</span><span>${pct(a.avance)}</span><span>${q(d.meta)}${d.fecha ? ` · ${d.fecha}` : ''}</span></div></div>
      ${fuga ? html`<div class="em-av mal"><b>Cuello de botella: ${fuga.de} → ${fuga.a} (${pct(fuga.tasa)})</b><p>Sale del Embudo de este mes. Arreglarlo primero rinde más que traer más leads a un embudo roto.</p></div>` : ''}
      ${a.palancas.length ? html`<div class="mm-pal">${a.palancas.map((p) => html`<article class="${p.posible ? '' : 'no'}"><span>${p.nombre}</span><b>${valor(p.a, p.unidad)}</b><small>${p.posible ? `Hoy: ${valor(p.de, p.unidad)}` : 'No alcanza sola'}</small></article>`)}</div><p class="em-nota" style="margin:8px 0 14px">Cada una dice qué haría falta moviendo solo esa palanca. Lo normal es mover un poco de varias.</p>` : ''}
      <div class="em"><div class="mk-c mm-pasos"><div class="mm-w"><h3>Los tres pasos de estos 90 días</h3>${d.pasos.map((p, i) => html`<div class="mm-paso"><input type="checkbox" data-p="${i}" data-c="hecho" ${p.hecho ? 'checked' : ''} aria-label="Hecho"><input class="in" data-p="${i}" data-c="texto" value="${p.texto}" aria-label="Paso ${i + 1}"><button class="lat-ib" type="button" data-d="p-quitar" data-i="${i}" aria-label="Quitar paso">${ico('x', 15)}</button></div>`)}${d.pasos.length < 3 ? html`<button class="btn ghost" type="button" data-d="paso">${ico('plus', 14)} Agregar paso</button>` : ''}</div></div>
      <div class="em-lado"><div class="em-f-g">${campo('meta', 'Meta al mes (Q)')}${campo('actual', 'Ingreso actual al mes (Q)')}${campo('ticket', 'Ticket promedio (Q)')}${campo('leads', 'Leads al mes')}${campo('cierre_pct', 'Cierre %')}${campo('fecha', 'Fecha de la meta', 'date')}</div><div class="em-acc"><button class="btn" type="button" data-d="guardar">Guardar</button></div></div></div>`);
  }
  function voz() {
    const r = resumenVoces(d.voces);
    mount(el, html`${cabeza('Voz del comprador', 'Sus palabras exactas, para que la oferta y el copy suenen a quien compra.')}${barra()}
      <div class="ren-k">${TIPOS_VOZ.map((t) => html`<div><span>${t}</span><b>${r.porTipo[t]}</b></div>`)}</div>
      ${r.temas.length ? html`<div class="vz-temas">${r.temas.map((t) => html`<span>${t.tema} · ${t.n}</span>`)}</div>` : ''}
      <div class="mk-c vz-nueva"><div class="em-f-g mm-w"><label class="mk-w"><span>Lo que dijo, tal cual</span><textarea class="in" rows="2" data-n="frase">${nueva.frase}</textarea></label><label><span>Tipo</span><select class="in" data-n="tipo">${TIPOS_VOZ.map((t) => html`<option ${t === nueva.tipo ? 'selected' : ''}>${t}</option>`)}</select></label><label><span>Tema</span><input class="in" data-n="tema" value="${nueva.tema}" placeholder="Precio, confianza…"></label><label class="mk-w"><span>De dónde salió</span><input class="in" data-n="fuente" value="${nueva.fuente}" placeholder="Entrevista, DM, llamada"></label></div><div class="em-acc mm-w"><button class="btn" type="button" data-d="voz">Agregar</button></div></div>
      <div class="vz-lista">${d.voces.map((v, i) => html`<article><blockquote>«${v.frase}»</blockquote><footer><span class="mk-v">${v.tipo}</span>${v.tema ? html`<span>${v.tema}</span>` : ''}${v.fuente ? html`<span>${v.fuente}</span>` : ''}<button class="lat-ib" type="button" data-d="v-quitar" data-i="${i}" aria-label="Quitar frase">${ico('x', 15)}</button></footer></article>`)}</div>
      ${d.voces.length ? '' : html`<div class="empty"><b>Agrega la primera frase</b>Escríbela como la dijo, sin arreglarla. Esas palabras son las que venden.</div>`}`);
  }
  const pintar = () => { if (alive()) (vista === 'voz' ? voz : meta)(); };
  const leer = () => {
    el.querySelectorAll('[data-k]').forEach((i) => { d[i.dataset.k] = i.type === 'date' ? i.value : Number(i.value.replace(/[^\d.]/g, '')) || 0; });
    el.querySelectorAll('[data-p]').forEach((i) => { const p = d.pasos[+i.dataset.p]; if (i.type === 'checkbox') p.hecho = i.checked; else p.texto = i.value; });
    el.querySelectorAll('[data-n]').forEach((i) => { nueva[i.dataset.n] = i.value; });
  };
  el.onchange = (e) => {
    if (e.target.id === 'd-cl') { slug = e.target.value; ponerContexto(me, slug); return cargar(); }
    leer(); if (vista !== 'voz' && e.target.dataset.k) pintar();
  };
  el.onclick = async (e) => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    leer(); const i = +b.dataset.i, k = b.dataset.d;
    if (k === 'guardar') return guardar();
    if (k === 'paso') { d.pasos.push({ texto: '', hecho: false }); return pintar(); }
    if (k === 'p-quitar') { d.pasos.splice(i, 1); return pintar(); }
    if (k === 'v-quitar') { d.voces.splice(i, 1); return guardar(); }
    if (k === 'voz') {
      if (!nueva.frase.trim()) return toast('Escribe lo que dijo', true);
      d.voces.unshift({ ...nueva }); nueva = { frase: '', tipo: nueva.tipo, tema: '', fuente: nueva.fuente }; return guardar();
    }
  };
  try { await cargar(); } catch (e) { if (alive()) mount(el, html`<div class="empty"><b>No pude abrir esta mesa</b>${e.message}</div>`); }
}
