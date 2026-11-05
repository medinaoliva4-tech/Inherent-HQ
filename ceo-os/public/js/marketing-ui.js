// Las mesas de Marketing: Resultados decide qué escalar o parar; Radar deja tres oportunidades al mes.
import { html, mount, api, col, ico, toast } from './core.js';
import { cargarContexto, contextoLista, contextoActual, ponerContexto } from './contexto.js';
import { idMarketing, limpiarMarketing, analizarCanales, aMovimiento, MAX_OPORTUNIDADES } from './marketing-datos.js';

const C = col('marketing_mes');
const q = (n) => `Q${Math.round(Number(n) || 0).toLocaleString('es-GT')}`;
const veces = (n) => `${(Number(n) || 0).toFixed(1)}x`;
const mesHoy = () => new Date().toISOString().slice(0, 7);
const TONO = { Escalar: 'bien', Mantener: '', 'Parar o cambiar': 'mal' };

export async function pintarMarketing(el, { me, area, tabs, vista, alive }) {
  await cargarContexto(me).catch(() => {});
  if (!alive()) return;
  const lista = contextoLista().filter((c) => c.slug && (me.role === 'ceo' || c.slug !== 'inherent'));
  const pedido = contextoActual(me);
  let slug = lista.some((c) => c.slug === pedido) ? pedido : lista[0]?.slug || '', mes = mesHoy(), doc = null, d = null;
  const cargar = async () => { doc = await C.get(idMarketing(slug, mes)).catch(() => null); d = limpiarMarketing({ ...(doc || {}), client_slug: slug, mes }); pintar(); };
  const guardar = async () => {
    try {
      const datos = limpiarMarketing({ ...d, client_slug: slug, mes });
      doc = doc ? await C.save({ ...doc, ...datos }) : await api('db/marketing_mes', { method: 'POST', body: { ...datos, id: idMarketing(slug, mes) } });
      d = datos; toast('Guardado'); pintar();
    } catch (e) { toast(e.message, true); }
  };
  const aHoja = async (titulo, espera, costo) => {
    try { await col('movimientos').create(aMovimiento(slug, mes, titulo, espera, costo)); toast('En la Hoja de Movimientos'); } catch (e) { toast(e.message, true); }
  };
  const barra = () => html`<div class="din-bar"><select class="in" id="d-cl" aria-label="Cliente">${lista.map((c) => html`<option value="${c.slug}" ${c.slug === slug ? 'selected' : ''}>${c.name}</option>`)}</select><input class="in" id="d-mes" type="month" value="${mes}" aria-label="Mes"></div>`;
  const cabeza = (titulo, sub) => html`<div class="hello sp-hero ar-head" style="--ar-c:var(${area.color})"><span class="ar-ico">${ico(area.icono, 22)}</span><div class="ar-tit"><h1>${titulo}</h1><p>${sub}</p></div></div>${tabs(area, 'herramientas')}`;

  function resultados() {
    const r = analizarCanales(d.canales, d.margen_pct), parar = r.filas.filter((c) => c.veredicto === 'Parar o cambiar'), escalar = r.filas.filter((c) => c.veredicto === 'Escalar');
    mount(el, html`${cabeza('Resultados', 'Qué escalar y qué parar con el dinero de este mes.')}${barra()}
      <div class="ren-k"><div><span>Invertido</span><b>${q(r.gasto)}</b></div><div><span>Ventas</span><b>${r.ventas.toLocaleString('es-GT')}</b></div><div><span>Vendido por Q1</span><b>${veces(r.roas)}</b></div><label class="mk-margen"><span>Margen %</span><input class="in" inputmode="numeric" data-k="margen_pct" value="${d.margen_pct || ''}" placeholder="0"><small>${r.equilibrio ? `Para no perder: ${veces(r.equilibrio)}` : 'Sin esto no hay veredicto'}</small></label></div>
      ${escalar.length || parar.length ? html`<div class="em-av ${parar.length ? 'mal' : ''}"><b>${escalar.length ? `Escala ${escalar.map((c) => c.nombre).join(', ')}.` : ''} ${parar.length ? `Revisa ${parar.map((c) => c.nombre).join(', ')}: no se paga.` : ''}</b><p>Muestra lo que pasó en cada canal, no prueba que el canal lo causó.</p></div>` : ''}
      <div class="mv-t mk-t"><table><thead><tr><th>Canal o campaña</th><th>Gasto</th><th>Leads</th><th>Ventas</th><th>Ingreso</th><th>Vendido por Q1</th><th>Decisión</th><th></th></tr></thead><tbody>
      ${d.canales.map((c, i) => { const f = analizarCanales([c], d.margen_pct).filas[0]; return html`<tr><td data-t="Canal"><input class="in" data-l="${i}" data-c="nombre" value="${c.nombre}" aria-label="Canal o campaña"></td>${['gasto', 'leads', 'ventas', 'ingreso'].map((k) => html`<td data-t="${k[0].toUpperCase() + k.slice(1)}"><input class="in" inputmode="numeric" data-l="${i}" data-c="${k}" value="${c[k] || ''}" aria-label="${k}"></td>`)}<td data-t="Vendido por Q1"><b>${c.gasto ? veces(f.roas) : '—'}</b>${f.porLead ? html`<small class="mk-sub">${q(f.porLead)} por lead</small>` : ''}</td><td data-t="Decisión"><span class="mk-v ${TONO[f.veredicto] ?? 'nada'}">${f.veredicto}</span></td><td class="mk-acc"><button class="lat-ib" type="button" data-d="hoja" data-i="${i}" aria-label="Pasar ${c.nombre} a la Hoja" title="Pasar a la Hoja">${ico('plus', 15)}</button><button class="lat-ib" type="button" data-d="quitar" data-i="${i}" aria-label="Quitar ${c.nombre}">${ico('x', 15)}</button></td></tr>`; })}
      </tbody></table></div>
      ${d.canales.length ? '' : html`<div class="empty"><b>Agrega tu primer canal o campaña</b>Escribe lo gastado y lo vendido. El OS te dice si escalar, mantener o parar.</div>`}
      <div class="em-acc" style="margin-top:12px"><button class="btn ghost" type="button" data-d="canal">${ico('plus', 14)} Agregar</button><button class="btn" type="button" data-d="guardar">Guardar</button></div>`);
  }
  function radar() {
    mount(el, html`${cabeza('Radar', `Tres oportunidades de la competencia para ${d.mes ? 'este mes' : 'el mes'}.`)}${barra()}
      <div class="mk-op">${d.radar.map((o, i) => html`<article class="mk-c"><span class="mk-n">${i + 1}</span><div class="em-f-g"><label><span>Competidor</span><input class="in" data-r="${i}" data-c="competidor" value="${o.competidor}"></label><label><span>Enlace de evidencia</span><input class="in" type="url" data-r="${i}" data-c="fuente" value="${o.fuente}" placeholder="https://"></label><label class="mk-w"><span>Qué hicieron</span><input class="in" data-r="${i}" data-c="movida" value="${o.movida}"></label><label class="mk-w"><span>Qué haríamos nosotros</span><input class="in" data-r="${i}" data-c="idea" value="${o.idea}"></label></div><div class="em-acc"><button class="btn ghost" type="button" data-d="op-hoja" data-i="${i}">Pasar a la Hoja</button><button class="btn ghost" type="button" data-d="op-quitar" data-i="${i}">Quitar</button></div></article>`)}</div>
      ${d.radar.length ? '' : html`<div class="empty"><b>Agrega la primera oportunidad</b>Lo que hizo un competidor y lo que harías mejor. Tres al mes bastan.</div>`}
      <div class="em-acc" style="margin-top:12px">${d.radar.length < MAX_OPORTUNIDADES ? html`<button class="btn ghost" type="button" data-d="op">${ico('plus', 14)} Agregar</button>` : ''}<button class="btn" type="button" data-d="guardar">Guardar</button><a class="btn ghost" href="#/ws/strategy/${slug}/research/competitor-radar">Abrir Competitor Radar</a></div>`);
  }
  const pintar = () => { if (alive()) (vista === 'radar' ? radar : resultados)(); };
  const leer = () => {
    el.querySelectorAll('[data-k]').forEach((i) => { d[i.dataset.k] = Number(i.value.replace(/[^\d.]/g, '')) || 0; });
    el.querySelectorAll('[data-l]').forEach((i) => { const c = d.canales[+i.dataset.l]; c[i.dataset.c] = i.dataset.c === 'nombre' ? i.value : Number(i.value.replace(/[^\d.]/g, '')) || 0; });
    el.querySelectorAll('[data-r]').forEach((i) => { d.radar[+i.dataset.r][i.dataset.c] = i.value; });
  };
  el.onchange = (e) => {
    if (e.target.id === 'd-cl') { slug = e.target.value; ponerContexto(me, slug); return cargar(); }
    if (e.target.id === 'd-mes') { mes = e.target.value || mesHoy(); return cargar(); }
    leer(); if (vista !== 'radar') pintar();
  };
  el.onclick = async (e) => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    leer(); const i = +b.dataset.i;
    if (b.dataset.d === 'guardar') return guardar();
    if (b.dataset.d === 'canal') { d.canales.push({ nombre: '', gasto: 0, leads: 0, ventas: 0, ingreso: 0 }); return pintar(); }
    if (b.dataset.d === 'quitar') { d.canales.splice(i, 1); return pintar(); }
    if (b.dataset.d === 'op') { d.radar.push({ competidor: '', movida: '', fuente: '', idea: '' }); return pintar(); }
    if (b.dataset.d === 'op-quitar') { d.radar.splice(i, 1); return pintar(); }
    if (b.dataset.d === 'hoja') { const c = d.canales[i]; return aHoja(c.nombre || 'Canal sin nombre', `Decidir qué hacer con ${c.nombre || 'este canal'}`, c.gasto); }
    if (b.dataset.d === 'op-hoja') { const o = d.radar[i]; return aHoja(o.idea || o.movida || 'Oportunidad', `Responder a ${o.competidor || 'la competencia'}: ${o.movida}`.slice(0, 300)); }
  };
  try { await cargar(); } catch (e) { if (alive()) mount(el, html`<div class="empty"><b>No pude abrir esta mesa</b>${e.message}</div>`); }
}
