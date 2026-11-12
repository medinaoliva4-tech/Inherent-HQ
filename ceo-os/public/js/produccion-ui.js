// Production · Costo y entrega: solo el CEO, porque lleva lo que cuesta producir.
import { html, mount, api, col, ico, toast } from './core.js';
import { cargarContexto, contextoLista, contextoActual, ponerContexto } from './contexto.js';
import { idProduccion, limpiarProduccion, analizarPiezas, TIPOS_PIEZA } from './produccion-datos.js';
import { fallo, vacio } from './visual.js';

const C = col('costos_produccion');
const q = (n) => { const v = Math.round(Number(n) || 0); return `${v < 0 ? '-' : ''}Q${Math.abs(v).toLocaleString('es-GT')}`; };
const pct = (n) => `${Math.round((Number(n) || 0) * 100)}%`;
const mesHoy = () => new Date().toISOString().slice(0, 7);
const TONO = { 'A tiempo': 'bien', Tarde: 'mal' };

export async function pintarProduccion(el, { me, area, tabs, alive }) {
  const cabeza = html`<div class="hello sp-hero ar-head" style="--ar-c:var(${area.color})"><span class="ar-ico">${ico(area.icono, 22)}</span><div class="ar-tit"><h1>Costo y entrega</h1><p>Qué cuesta producir cada pieza, qué deja y si llega a tiempo.</p></div></div>${tabs(area, 'herramientas')}`;
  if (me.role !== 'ceo') return mount(el, html`${cabeza}${vacio({ icono: 'lock', titulo: 'Solo el CEO ve esta mesa', linea: 'Lleva costos de producción.' })}`);
  await cargarContexto(me).catch(() => {});
  if (!alive()) return;
  const lista = contextoLista().filter((c) => c.slug);
  let slug = contextoActual(me) || lista[0]?.slug || '', mes = mesHoy(), doc = null, d = null;
  const cargar = async () => { doc = await C.get(idProduccion(slug, mes)).catch(() => null); d = limpiarProduccion({ ...(doc || {}), client_slug: slug, mes }); pintar(); };
  const guardar = async () => {
    try {
      const datos = limpiarProduccion({ ...d, client_slug: slug, mes });
      doc = doc ? await C.save({ ...doc, ...datos }) : await api('db/costos_produccion', { method: 'POST', body: { ...datos, id: idProduccion(slug, mes) } });
      d = datos; toast('Guardado'); pintar();
    } catch (e) { toast(e.message, true); }
  };
  function pintar() {
    if (!alive()) return;
    const r = analizarPiezas(d.piezas, d.costo_hora);
    mount(el, html`${cabeza}<div class="din-bar"><select class="in" id="d-cl" aria-label="Cliente">${lista.map((c) => html`<option value="${c.slug}" ${c.slug === slug ? 'selected' : ''}>${c.name}</option>`)}</select><input class="in" id="d-mes" type="month" value="${mes}" aria-label="Mes"></div>
      <div class="ren-k"><div><span>Costo por pieza</span><b>${q(r.costoPieza)}</b></div><div><span>Margen</span><b>${q(r.margen)}</b><small>${pct(r.pct)}</small></div><div><span>A tiempo</span><b>${r.aTiempo == null ? '—' : pct(r.aTiempo)}</b></div><label class="mk-margen"><span>Costo por hora (Q)</span><input class="in" inputmode="numeric" data-k="costo_hora" value="${d.costo_hora || ''}" placeholder="0"></label></div>
      ${r.peor && r.peor.margen < 0 ? html`<div class="em-av mal"><b>${r.peor.nombre} pierde ${q(-r.peor.margen)}.</b><p>Cambia la mezcla o cotiza extra. No se recortan horas.</p></div>` : ''}
      <div class="mv-t pr-t"><table><thead><tr><th>Pieza</th><th>Tipo</th><th>Horas</th><th>Costo</th><th>Cobrado</th><th>Promesa</th><th>Entrega</th><th>Resultado</th><th></th></tr></thead><tbody>
      ${r.filas.map((p, i) => html`<tr><td data-t="Pieza"><input class="in" data-l="${i}" data-c="nombre" value="${p.nombre}" aria-label="Pieza"></td><td data-t="Tipo"><select class="in" data-l="${i}" data-c="tipo" aria-label="Tipo">${TIPOS_PIEZA.map((t) => html`<option ${t === p.tipo ? 'selected' : ''}>${t}</option>`)}</select></td>${['horas', 'costo', 'cobrado'].map((k) => html`<td data-t="${k[0].toUpperCase() + k.slice(1)}"><input class="in" inputmode="decimal" data-l="${i}" data-c="${k}" value="${p[k] || ''}" aria-label="${k}"></td>`)}<td data-t="Promesa"><input class="in" type="date" data-l="${i}" data-c="promesa" value="${p.promesa}" aria-label="Fecha prometida"></td><td data-t="Entrega"><input class="in" type="date" data-l="${i}" data-c="entrega" value="${p.entrega}" aria-label="Fecha de entrega"></td><td data-t="Resultado"><b class="${p.margen < 0 ? 'ren-mal' : ''}">${q(p.margen)}</b><span class="mk-v ${TONO[p.estado] ?? 'nada'}">${p.estado}</span></td><td class="mk-acc"><button class="lat-ib" type="button" data-d="quitar" data-i="${i}" aria-label="Quitar ${p.nombre}">${ico('x', 15)}</button></td></tr>`)}
      </tbody></table></div>
      ${d.piezas.length ? '' : html`${vacio({ icono: 'inbox', titulo: 'Agrega tu primera pieza', linea: 'Con horas, costo y fechas se ve qué deja dinero y qué llega tarde.' })}`}
      <div class="em-acc" style="margin-top:12px"><button class="btn ghost" type="button" data-d="pieza">${ico('plus', 14)} Agregar</button><button class="btn" type="button" data-d="guardar">Guardar</button></div>`);
  }
  const leer = () => {
    el.querySelectorAll('[data-k]').forEach((i) => { d[i.dataset.k] = Number(i.value.replace(/[^\d.]/g, '')) || 0; });
    el.querySelectorAll('[data-l]').forEach((i) => { const p = d.piezas[+i.dataset.l], c = i.dataset.c; p[c] = ['horas', 'costo', 'cobrado'].includes(c) ? Number(i.value.replace(/[^\d.]/g, '')) || 0 : i.value; });
  };
  el.onchange = (e) => {
    if (e.target.id === 'd-cl') { slug = e.target.value; ponerContexto(me, slug); return cargar(); }
    if (e.target.id === 'd-mes') { mes = e.target.value || mesHoy(); return cargar(); }
    leer(); pintar();
  };
  el.onclick = (e) => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    leer();
    if (b.dataset.d === 'guardar') return guardar();
    if (b.dataset.d === 'pieza') { d.piezas.push({ nombre: '', tipo: TIPOS_PIEZA[0], horas: 0, costo: 0, cobrado: 0, promesa: '', entrega: '' }); return pintar(); }
    if (b.dataset.d === 'quitar') { d.piezas.splice(+b.dataset.i, 1); return pintar(); }
  };
  try { await cargar(); } catch (e) { if (alive()) mount(el, html`${fallo({ titulo: 'No pude abrir esta mesa', linea: e.message })}`); }
}
