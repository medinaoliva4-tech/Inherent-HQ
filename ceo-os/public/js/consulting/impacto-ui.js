// La vista del Impact Tracker (impact-tracker de Consulting): ¿el plan movió el negocio? Arriba los tiles (las metas del plan en
// Clientes: en camino, en riesgo, fuera de ruta; y lo interno: horas ahorradas y delta de margen), la ecuación de ingresos
// antes → ahora → meta factor por factor, las metas y el reporte para el cliente. Se apoya en el módulo puro impacto.js: la
// ecuación y el avance se CALCULAN, un factor sin dato sale ⚠️ SIN DATOS (nunca 0) y lo interno (horas, margen, notas) no sale al
// cliente. «Mandar metas a Clientes» escribe en accounts.goals (sin almacén paralelo) y solo lo ve quien edita Clientes.
import { html, raw, mount, col, toast, confirmAsk, ico } from '../core.js';
import { goalsOf, healthOf, sumarMetas } from '../goals.js';
import { canEdit } from '../roleviews.js';
import { SIN_DATOS, miles, sinAcentos } from './marcos.js';
import { FACTORES, vacio, limpiar, ecuacion, avance, avancePorFactor, versionCliente } from './impacto.js';

const MALAS = new Set(['__proto__', 'constructor', 'prototype']);
const COLUMNAS = [['antes', 'Antes'], ['ahora', 'Ahora'], ['meta', 'Meta']];
const SALUD = [['ok', 'En camino'], ['riesgo', 'En riesgo'], ['off', 'Fuera de ruta']];
const MAX_METAS = 12;
const redondeo = (x) => Math.round(x * 100) / 100;
const hay = (n) => typeof n === 'number' && Number.isFinite(n);
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const monedaDe = (ctx) => { const m = /^\s*(US\$|GTQ|USD|[$Q€£])/.exec(String(ctx?.estrategia?.meta || '')); return m ? (/^[A-Z]{3}$/.test(m[1]) ? `${m[1]} ` : m[1]) : ''; };
// Cómo se ve un factor en su campo: las tasas (conversión, retención) van de 0 a 1 y se muestran como porcentaje.
const mostrarF = (f, v) => (!hay(v) ? '' : f.tasa ? `${redondeo(v * 100)}%` : String(v));
const lineas = (t) => String(t || '').split('\n').filter((l) => l.trim()).length;
// El id del entregable abierto: el shell lo pone en la ruta (#/ws/consulting/<cliente>/<pestaña>/impact-tracker/<id>); sin guardar, no hay.
const idDeRuta = () => { try { const p = decodeURIComponent(location.hash).split('/'), i = p.indexOf('impact-tracker'); return i >= 0 ? p[i + 1] || '' : ''; } catch { return ''; } };
const filaDe = (t) => sinAcentos(t).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

// ---------- Las metas del reporte, en la forma de goals.js para accounts.goals ----------
// Una por meta con título. origen 'consulting' + blueprint_ref (el entregable) + blueprint_fila (la meta, por su título) es la clave
// para no duplicar al mandarlas otra vez. note queda vacío: sale en el PDF del cliente.
export function metasParaClientes(contenido, { deliverable_id = '' } = {}) {
  const vistos = new Set(), out = [];
  for (const m of limpiar(contenido).metas) {
    const fila = filaDe(m.titulo); if (!m.titulo || !fila || vistos.has(fila)) continue;
    vistos.add(fila);
    out.push({ goal: m.titulo, metric: m.titulo, baseline: '', target: hay(m.valor) ? String(m.valor) : '', current: hay(m.actual) ? String(m.actual) : '', due: m.fecha || '', status: 'now', note: '', every: '', tasks: [], checks: [],
      origen: 'consulting', blueprint_ref: String(deliverable_id || ''), blueprint_fila: `impacto-${fila}` });
  }
  return out;
}

// ---------- Lo escrito: ¿se lee? (el mismo limpiar que usa el servidor: «1.5M» o «40 h» no pasan) ----------
function sinLeer(ruta, v) {
  if (v === null || v === undefined || String(v).trim() === '') return false;
  const p = ruta.split('.');
  if (['antes', 'ahora', 'meta'].includes(p[0])) return limpiar({ [p[0]]: { [p[1]]: v } })[p[0]][p[1]] === null;
  if (p[0] === 'metas' && ['valor', 'actual'].includes(p[2])) return limpiar({ metas: [{ [p[2]]: v }] }).metas[0][p[2]] === null;
  if (p[0] === 'horas_ahorradas' || p[0] === 'delta_margen') return limpiar({ [p[0]]: v })[p[0]] === null;
  return false;
}
function fijar(c, ruta, v) {
  const p = ruta.split('.'); if (p.some((k) => MALAS.has(k))) return false;
  let o = c; for (const k of p.slice(0, -1)) { o = o?.[k]; if (o === null || typeof o !== 'object') return false; }
  o[p[p.length - 1]] = v; return true;
}

export const vista = {
  // El contenido inicial de un entregable nuevo: los 15 factores sin dato, sin metas y sin reporte.
  nuevo() { return vacio(); },

  // Re-pinta todo dentro de `el`. `c` es el estado vivo: cada cambio lo actualiza, recalcula lo derivado sin tocar los campos y le
  // avisa al shell con el contenido completo. docId (si el shell lo trae) o la ruta dan el id del entregable para mandar metas.
  pintar(el, { contenido, editable = false, onCambio = () => {}, ctx = {}, me, slug, docId = '' } = {}) {
    const c = limpiar(contenido), M = monedaDe(ctx), ed = Boolean(editable), puedeClientes = canEdit(me, 'clients');
    const avisar = () => onCambio(structuredClone(c));
    let cuenta = { k: 'cargando' }; // las metas que ya están en Clientes: se leen aparte, sin frenar el primer pintado

    const ro = (v, sin = SIN_DATOS) => (String(v ?? '').trim() ? html`<span class="im-ro">${v}</span>` : html`<span class="im-ro im-sin">${sin}</span>`);
    // Lo que se escribió y aún no se guardó queda tal cual (texto); lo que ya viene limpio, con su formato.
    const txt = (v, formato) => (typeof v === 'string' ? v : hay(v) ? formato(v) : '');
    const num = (ruta, v, { et, ph = '', sin, formato = (x) => String(x) } = {}) => (ed
      ? html`<input class="in im-in" type="text" inputmode="decimal" autocomplete="off" data-ruta="${ruta}" data-tipo="num" aria-label="${et}" placeholder="${ph}" value="${txt(v, formato)}">`
      : ro(txt(v, formato), sin));

    // ---------- Tiles ----------
    const tilesMetas = () => {
      if (cuenta.k === 'cargando') return html`<p class="mut sm im-leyendo">Leyendo las metas de Clientes…</p>`;
      if (cuenta.k === 'sin-acceso') return html`<p class="im-sin">${SIN_DATOS}: tu perfil no lee las metas de Clientes.</p>`;
      if (cuenta.k === 'sin-cuenta') return html`<p class="im-sin">${SIN_DATOS}: este cliente todavía no tiene cuenta en Clientes, de donde salen las metas.</p>`;
      if (cuenta.k === 'error') return html`<p class="im-sin">${SIN_DATOS}: no se pudieron leer las metas de Clientes (${cuenta.msg}).</p>`;
      const metas = goalsOf(cuenta.acc).filter((g) => g.origen === 'consulting');
      if (!metas.length) return html`<p class="im-sin">${SIN_DATOS}: todavía no hay metas del plan en Clientes. Se mandan con «Mandar metas a Clientes».</p>`;
      const por = (k) => metas.filter((g) => healthOf(g) === k).length, sinRevisar = metas.filter((g) => !healthOf(g)).length;
      return html`${SALUD.map(([k, n]) => html`<div class="im-tile" data-salud="${k}"><span class="lbl">${n}</span><b>${por(k)}</b></div>`)}
        <p class="mut sm im-tiles-nota">${plural(metas.length, 'meta del plan', 'metas del plan')} en Clientes${sinRevisar ? ` · ${plural(sinRevisar, 'sin revisar', 'sin revisar')}` : ''}</p>`;
    };
    const tilesInternos = () => html`<div class="im-tile" data-interno="1" data-k="horas"><span class="lbl">Horas ahorradas</span>
        ${num('horas_ahorradas', c.horas_ahorradas, { et: 'Horas ahorradas al cliente', ph: 'Horas', sin: `${SIN_DATOS}: las da el cliente` })}<span class="mut sm">Interno: no sale al cliente</span></div>
      <div class="im-tile" data-interno="1" data-k="margen"><span class="lbl">Delta de margen</span>
        ${num('delta_margen', c.delta_margen, { et: 'Delta de margen en puntos', ph: 'Puntos', sin: `${SIN_DATOS}: sale de los números del cliente (Money Model Lab)` })}<span class="mut sm">Puntos de margen · interno: no sale al cliente</span></div>`;

    // ---------- La ecuación: leads × conversión × ticket × frecuencia × retención ----------
    const celdaAvance = (p, motivo) => (p === null ? html`<span class="im-sin" title="${motivo}">${SIN_DATOS}</span>` : html`<div class="gbar" role="img" aria-label="Avance ${p}%"><i style="width:${p}%"></i></div><span class="sm im-pct">${p}%</span>`);
    const motivoFactor = (L, f) => { const a = L.antes[f.id], h = L.ahora[f.id], m = L.meta[f.id];
      return a === null || h === null || m === null ? 'Falta el antes, el ahora o la meta de este factor' : 'La meta es igual al punto de partida: no hay avance que medir'; };
    const total = (L, k) => { const v = ecuacion(c[k]), falta = FACTORES.filter((f) => L[k][f.id] === null).map((f) => f.nombre.toLowerCase());
      return v !== null ? html`<b>${M}${miles(v)}</b>` : html`<span class="im-sin">${SIN_DATOS}${falta.length ? `: falta ${falta.join(', ')}` : ''}</span>`; };
    const resultadosEcuacion = () => { const L = limpiar(c), por = avancePorFactor(c.antes, c.ahora, c.meta), tot = avance(c.antes, c.ahora, c.meta);
      return { avances: FACTORES.map((f) => [f, celdaAvance(por[f.id], motivoFactor(L, f))]), totales: COLUMNAS.map(([k]) => [k, total(L, k)]), avanceTotal: celdaAvance(tot, 'Faltan factores: el avance del total necesita los 15 datos') }; };
    const ecuacionHtml = () => { const r = resultadosEcuacion();
      return html`<div class="im-scroll"><table class="im-tabla"><thead><tr><th scope="col">Factor</th>${COLUMNAS.map(([, n]) => html`<th scope="col">${n}</th>`)}<th scope="col">Avance</th></tr></thead>
        <tbody>${r.avances.map(([f, av]) => html`<tr data-factor="${f.id}"><th scope="row">${f.nombre}</th>
          ${COLUMNAS.map(([k, n]) => html`<td>${num(`${k}.${f.id}`, c[k][f.id], { et: `${f.nombre}: ${n.toLowerCase()}`, ph: f.tasa ? '80%' : 'Número', sin: `${SIN_DATOS}: lo da el cliente`, formato: (x) => mostrarF(f, x) })}</td>`)}
          <td data-avance="${f.id}">${av}</td></tr>`)}</tbody>
        <tfoot><tr class="im-total"><th scope="row">Ingresos (el producto)</th>${r.totales.map(([k, t]) => html`<td data-total="${k}">${t}</td>`)}<td data-total="avance">${r.avanceTotal}</td></tr></tfoot></table></div>
        <p class="mut sm im-nota">Los ingresos son el producto de los 5 factores y el avance se calcula: no se escribe. Conversión y retención van en porcentaje (80% o 0.8). Un factor sin dato no cuenta como 0.</p>`; };

    // ---------- Las metas y el reporte ----------
    const metasHtml = () => html`<div class="im-metas">${c.metas.map((m, i) => html`<div class="im-meta" data-meta="${i}">
        <label class="im-c im-c-t"><span class="lbl">Meta</span>${ed ? html`<input class="in im-in" type="text" data-ruta="metas.${i}.titulo" maxlength="120" aria-label="Título de la meta ${i + 1}" placeholder="Ej. CAC" value="${m.titulo}">` : ro(m.titulo)}</label>
        <label class="im-c"><span class="lbl">Valor meta</span>${num(`metas.${i}.valor`, m.valor, { et: `Valor meta de ${m.titulo || `la meta ${i + 1}`}`, ph: 'Número', sin: SIN_DATOS })}</label>
        <label class="im-c"><span class="lbl">Actual</span>${num(`metas.${i}.actual`, m.actual, { et: `Valor actual de ${m.titulo || `la meta ${i + 1}`}`, ph: 'Número', sin: SIN_DATOS })}</label>
        <label class="im-c"><span class="lbl">Fecha</span>${ed ? html`<input class="in im-in" type="date" data-ruta="metas.${i}.fecha" aria-label="Fecha de ${m.titulo || `la meta ${i + 1}`}" value="${m.fecha}">` : ro(m.fecha)}</label>
        ${ed ? html`<button type="button" class="btn ghost sm" data-acc="quitar-meta" data-i="${i}" aria-label="Quitar la meta ${i + 1}">${ico('x', 14)}</button>` : ''}</div>`)}</div>
      ${!c.metas.length ? html`<p class="im-sin im-fuente">${SIN_DATOS}: las metas salen de las métricas del Plan de crecimiento 90 días aprobado.</p>` : ''}
      ${ed ? html`<div class="im-barra"><button type="button" class="btn ghost" data-acc="agregar-meta" ${c.metas.length >= MAX_METAS ? raw('disabled') : ''}>${ico('plus', 14)} Agregar meta</button></div>` : ''}
      <div class="im-mandar">${puedeClientes ? html`<button type="button" class="btn" data-acc="mandar">${ico('send', 14)} Mandar metas a Clientes</button><span class="mut sm">Las agrega a las metas del cliente; las que ya mandaste no se repiten.</span>`
        : html`<p class="mut sm">Para mandar las metas pídeselo al COO o al CEO.</p>`}</div>`;
    const reporteHtml = () => html`<label class="im-c im-c-rep"><span class="lbl">Reporte para el cliente</span>${ed
        ? html`<textarea class="in im-in" rows="9" maxlength="6000" data-ruta="reporte" aria-label="Reporte para el cliente" placeholder="Qué se hizo, qué se movió (con sus números) y qué sigue.">${c.reporte}</textarea>` : ro(c.reporte, `${SIN_DATOS}: se genera con «Generar con IA» y se revisa aquí`)}</label>
      <p class="mut sm im-nota">Esto es lo que ve el cliente: sin costos, márgenes, horas ni notas internas. ${ed ? 'Si lo generas con IA, revísalo antes de aprobar.' : ''}</p>
      <p class="im-aviso" data-d="interno" role="status" hidden></p>`;

    const pintarTodo = () => {
      mount(el, html`<div class="im">
        <div class="im-tiles"><div class="im-tiles-metas" data-vivo="metas-tiles">${tilesMetas()}</div>${tilesInternos()}</div>
        <section class="im-sec"><h3 class="im-h">La ecuación de ingresos: antes → ahora → meta</h3><div data-vivo="ecuacion">${ecuacionHtml()}</div></section>
        <section class="im-sec"><h3 class="im-h">Metas del plan</h3>${metasHtml()}</section>
        <section class="im-sec"><h3 class="im-h">Reporte</h3>${reporteHtml()}</section></div>`);
      avisoInterno();
    };

    // ---------- Lo derivado se recalcula sin tocar los campos que se están escribiendo ----------
    const vivo = (n) => el.querySelector(`[data-vivo="${n}"]`);
    function avisoInterno() {
      const a = el.querySelector('[data-d="interno"]'); if (!a) return;
      const quita = lineas(limpiar(c).reporte) - lineas(versionCliente(c).reporte);
      a.hidden = quita <= 0; a.textContent = quita > 0 ? `${plural(quita, 'línea habla', 'líneas hablan')} de margen, costos u horas: no saldrá${quita === 1 ? '' : 'n'} al cliente. Quítala${quita === 1 ? '' : 's'} para que el reporte quede como lo verá.` : '';
    }
    function derivar(ruta) {
      const k = ruta.split('.')[0];
      if (['antes', 'ahora', 'meta'].includes(k)) {
        const r = resultadosEcuacion();
        r.avances.forEach(([f, av]) => { const td = el.querySelector(`[data-avance="${f.id}"]`); if (td) mount(td, av); });
        r.totales.forEach(([c2, t]) => { const td = el.querySelector(`[data-total="${c2}"]`); if (td) mount(td, t); });
        const ta = el.querySelector('[data-total="avance"]'); if (ta) mount(ta, r.avanceTotal);
      } else if (k === 'reporte') avisoInterno();
    }
    const cambiar = (t) => {
      const ruta = t.dataset?.ruta; if (!ed || !ruta) return;
      const v = t.dataset.tipo === 'num' ? (t.value.trim() === '' ? null : t.value.trim()) : t.value;
      if (!fijar(c, ruta, v)) return;
      if (t.dataset.tipo === 'num') t.setAttribute('aria-invalid', String(sinLeer(ruta, v)));
      derivar(ruta); avisar();
    };

    // ---------- Mandar las metas a Clientes (accounts.goals) ----------
    const leerCuenta = async () => {
      const tok = (el._imTok = Symbol());
      try { cuenta = { k: 'ok', acc: await col('accounts').get(`acc-${slug}`) }; }
      catch (e) { cuenta = e.status === 404 ? { k: 'sin-cuenta' } : e.status === 403 ? { k: 'sin-acceso' } : { k: 'error', msg: e.message || 'sin conexión' }; }
      if (el._imTok !== tok || !el.isConnected) return; // la vista ya se volvió a pintar
      const v = vivo('metas-tiles'); if (v) mount(v, tilesMetas());
    };
    const mandar = async (btn) => {
      const id = docId || idDeRuta();
      if (!id) return toast('Guarda el entregable antes de mandar las metas: la meta se liga a él.', true);
      const nuevas = metasParaClientes(c, { deliverable_id: id });
      if (!nuevas.length) return toast('No hay metas con título para mandar.', true);
      if (!(await confirmAsk(`¿Mandar ${plural(nuevas.length, 'meta', 'metas')} a las metas del cliente en Clientes?`))) return;
      btn.disabled = true;
      try {
        const acc = await col('accounts').get(`acc-${slug}`), r = sumarMetas(goalsOf(acc), nuevas);
        if (!r.agregadas.length) toast('Esas metas ya estaban en Clientes.');
        else { await col('accounts').save({ ...acc, goals: r.goals }); toast(`${plural(r.agregadas.length, 'meta agregada', 'metas agregadas')} a Clientes${r.repetidas.length ? ` · ${plural(r.repetidas.length, 'ya estaba', 'ya estaban')}` : ''}`); }
      } catch (e) {
        toast(e.status === 409 ? 'Alguien cambió la cuenta mientras tanto. Vuelve a intentarlo.' : e.status === 404 ? 'Este cliente todavía no tiene cuenta en Clientes.' : e.message, true);
      } finally { if (el.isConnected) btn.disabled = false; }
      if (el.isConnected) leerCuenta();
    };

    el.oninput = (e) => cambiar(e.target);
    el.onclick = (e) => {
      const b = e.target.closest?.('[data-acc]'); if (!b || !el.contains(b)) return;
      const i = Number(b.dataset.i);
      if (b.dataset.acc === 'mandar') { if (puedeClientes) mandar(b); return; }
      if (!ed) return;
      if (b.dataset.acc === 'agregar-meta' && c.metas.length < MAX_METAS) { c.metas.push({ titulo: '', valor: null, actual: null, fecha: '' }); avisar(); pintarTodo(); el.querySelector(`[data-ruta="metas.${c.metas.length - 1}.titulo"]`)?.focus(); }
      else if (b.dataset.acc === 'quitar-meta' && i >= 0 && i < c.metas.length) { c.metas.splice(i, 1); avisar(); pintarTodo(); }
    };
    pintarTodo();
    leerCuenta();
  },

  // Una línea o chips para el Overview y para la propuesta de la IA.
  resumen(contenido) {
    const c = limpiar(contenido), p = avance(c.antes, c.ahora, c.meta);
    const chips = [p === null ? `Avance ${SIN_DATOS}` : `Avance ${p}%`, plural(c.metas.length, 'meta', 'metas'), c.reporte ? 'Reporte listo' : 'Sin reporte'];
    return html`<span class="im-res">${chips.map((x) => html`<span class="chip">${x}</span> `)}</span>`;
  },
};
