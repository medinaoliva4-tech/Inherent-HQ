// La vista del Money Model Lab (financial-scenario-lab de Consulting): 4 pestañas —Modelo de negocio (BMC), Cartera (matriz BCG),
// Modelo de dinero (la escalera de Hormozi) y Escenarios— sobre el módulo puro escenarios.js. Existe para que el Tool Shell solo
// monte `vista` en el centro: aquí se edita cada campo con controles nativos y los números (margen, LTV, LTGP:CAC, caja a 30 días)
// se CALCULAN con escenarios.js, nunca se escriben. Lo que no tiene dato dice ⚠️ SIN DATOS y de dónde saldría. Un cambio de precio
// u oferta no se decide aquí: se manda a Strategy (Offer Architect).
import { html, raw, mount, ico } from '../core.js';
import { hbars, PAL } from '../charts.js';
import { BMC, BCG, TIPOS_OFERTA, SIN_DATOS, miles } from './marcos.js';
import { vacio, limpiar, aplicar, cuadranteBCG, accionSugerida, correrEscenarios, SEMAFOROS, ACCIONES, CAMBIOS, UMBRALES } from './escenarios.js';

const TABS = [['bmc', 'Modelo de negocio'], ['cartera', 'Cartera'], ['dinero', 'Modelo de dinero'], ['escenarios', 'Escenarios']];
const SEMAFORO_TXT = { verde: 'Verde', ambar: 'Ámbar', rojo: 'Rojo' };
const ACCION_TXT = { empujar: 'Empujar', sostener: 'Sostener', revisar: 'Revisar', retirar: 'Retirar' };
const MAX_LINEAS = 12, MAX_ESCENARIOS = 4, MAX_VISIBLE_NOMBRE = 14;
const BASE_CAMPOS = [
  ['precio', 'Precio', 'Por venta'], ['costo', 'Costo', 'Por venta'], ['volumen', 'Volumen', 'Ventas nuevas al mes'],
  ['cac', 'CAC', 'Lo que cuesta conseguir un cliente'], ['retencion', 'Retención', 'Mensual: 80% o 0.8'], ['meses', 'Meses de vida', 'Solo si no hay retención'],
];
const CAMBIO_NOMBRE = { precio: 'Precio', costo: 'Costo', volumen: 'Volumen', cac: 'CAC', retencion: 'Retención' };
const RESULTADOS = [['margen', 'Margen por venta'], ['margenPct', 'Margen %'], ['ltv', 'LTV'], ['ltgpCac', 'LTGP:CAC'], ['caja30', 'Caja a 30 días']];
const GRAFICAS = [['margen', 'Margen por venta'], ['ltv', 'LTV'], ['cac', 'CAC'], ['ltgpCac', 'LTGP:CAC'], ['caja30', 'Caja a 30 días']];
const FORMATO = { margen: 'din', margenPct: 'pct', ltv: 'din', ltgpCac: 'razon', caja30: 'din', cac: 'din' };
const MALAS = new Set(['__proto__', 'constructor', 'prototype']);
const LINEA_NUM = ['ventas', 'margen', 'crecimiento', 'participacion'];

let tabActual = 'bmc'; // la pestaña se conserva cuando el shell vuelve a pintar (guardar, cambiar de estado…)

// ---------- Formato ----------
const hay = (n) => typeof n === 'number' && Number.isFinite(n);
const dinero = (n, m) => (hay(n) ? `${n < 0 ? '−' : ''}${m}${miles(Math.abs(n))}` : '');
const mostrar = (k, n, m) => (!hay(n) ? '' : FORMATO[k] === 'pct' ? `${miles(n)}%` : FORMATO[k] === 'razon' ? `${miles(n)} : 1` : dinero(n, m));
// La moneda sale de la meta de Strategy («Q 120,000 en 12 meses…»); sin ella los números van sin símbolo.
const monedaDe = (ctx) => { const m = /^\s*(US\$|GTQ|USD|[$Q€£])/.exec(String(ctx?.estrategia?.meta || '')); return m ? (/^[A-Z]{3}$/.test(m[1]) ? `${m[1]} ` : m[1]) : ''; };
const recorta = (s, n = MAX_VISIBLE_NOMBRE) => { const t = String(s ?? '').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const redondeo = (x) => Math.round(x * 100) / 100;

// ---------- Lo escrito: ¿se lee como número? (el mismo limpiar que usa el servidor: «1.5M» o «+10%» no pasan) ----------
const sinLeer = (ruta, v) => {
  if (v === null || v === undefined || String(v).trim() === '') return false;
  const p = ruta.split('.');
  if (p[0] === 'base') return limpiar({ base: { [p[1]]: v } }).base[p[1]] === null;
  if (p[0] === 'escenarios' && p[2] === 'cambios') return limpiar({ escenarios: [{ cambios: { [p[3]]: v } }] }).escenarios[0].cambios[p[3]] === undefined;
  if (p[0] === 'cartera' && LINEA_NUM.includes(p[2])) return limpiar({ cartera: [{ [p[2]]: v }] }).cartera[0][p[2]] === null;
  return false;
};
// Lo que falta para que un resultado salga (b = la base ya aplicada: sus insumos son número o null).
function faltaDe(k, b) {
  const f = [], sin = (x) => x === null || x === undefined;
  if (sin(b.precio)) f.push('precio'); else if (k === 'margenPct' && !b.precio) f.push('un precio mayor a 0');
  if (sin(b.costo)) f.push('costo');
  if ((k === 'ltv' || k === 'ltgpCac') && sin(b.retencion) && sin(b.meses)) f.push('retención o meses de vida');
  if (k === 'ltgpCac') { if (sin(b.cac)) f.push('CAC'); else if (!b.cac) f.push('un CAC mayor a 0'); }
  if (k === 'caja30') { if (sin(b.volumen)) f.push('volumen'); if (sin(b.cac)) f.push('CAC'); }
  return f;
}
function fijar(c, ruta, v) {
  const p = ruta.split('.'); if (p.some((k) => MALAS.has(k))) return false;
  let o = c; for (const k of p.slice(0, -1)) { o = o?.[k]; if (o === null || typeof o !== 'object') return false; }
  const ult = p[p.length - 1];
  if (p[p.length - 2] === 'cambios' && (v === null || v === '')) delete o[ult]; else o[ult] = v;
  return true;
}

// ---------- La matriz BCG (SVG): una burbuja por línea, tamaño = ventas, color = margen ----------
function matriz(lineas) {
  const W = 560, H = 380, ml = 58, mr = 16, mt = 18, mb = 54, pw = W - ml - mr, ph = H - mt - mb, cen = UMBRALES.crecimiento, par = UMBRALES.participacion;
  const pts = lineas.map((l, i) => ({ ...l, i })).filter((l) => hay(l.crecimiento) && hay(l.participacion));
  const sinPos = lineas.filter((l) => !(hay(l.crecimiento) && hay(l.participacion))).map((l, i) => l.linea || `Línea ${i + 1}`);
  const aviso = sinPos.length ? html`<p class="mut sm esc-mx-aviso">Sin posición en la matriz: ${sinPos.join(', ')}. ${SIN_DATOS}: falta el crecimiento del mercado o la participación relativa.</p>` : '';
  if (!pts.length) return html`<p class="esc-sin">${SIN_DATOS}: la matriz sale del crecimiento del mercado y la participación relativa de cada línea.</p>${aviso}`;
  const R = Math.max(15, ...pts.map((l) => Math.abs(l.crecimiento - cen) * 1.15)), maxV = Math.max(0, ...pts.map((l) => (hay(l.ventas) ? l.ventas : 0)));
  // x en escala logarítmica (1 al centro, la participación alta a la izquierda); y lineal con el umbral de crecimiento al centro.
  const tx = (p) => (Math.max(-1, Math.min(1, Math.log10(Math.max(p, 0.1) / par))) + 1) / 2;
  const X = (p) => +(ml + (1 - tx(p)) * pw).toFixed(1), Y = (g) => +(mt + (1 - (Math.max(cen - R, Math.min(cen + R, g)) - (cen - R)) / (2 * R)) * ph).toFixed(1);
  const rad = (v) => +(hay(v) && v > 0 && maxV > 0 ? 9 + 25 * Math.sqrt(v / maxV) : 8).toFixed(1);
  const nombre = (id) => BCG.find((b) => b.id === id)?.nombre || id;
  const cuadrante = (id, x, y) => html`<rect class="esc-mx-q" data-q="${id}" x="${x}" y="${y}" width="${pw / 2}" height="${ph / 2}"/><text class="esc-mx-qn" data-q="${id}" x="${x + 8}" y="${y + 16}">${nombre(id)}</text>`;
  const burbujas = [...pts].sort((a, z) => rad(z.ventas) - rad(a.ventas)).map((l) => {
    const q = cuadranteBCG(l.crecimiento, l.participacion), cx = X(l.participacion), cy = Y(l.crecimiento), r = rad(l.ventas), m = hay(l.margen) ? Math.max(0, Math.min(100, Math.round(l.margen))) : null;
    return html`<g class="esc-mx-b" data-q="${q || ''}" data-sin-margen="${m === null ? '1' : '0'}" data-sin-ventas="${hay(l.ventas) ? '0' : '1'}" style="--esc-m:${m ?? 0}">
      <title>${l.linea || `Línea ${l.i + 1}`} · ventas ${hay(l.ventas) ? miles(l.ventas) : SIN_DATOS} · margen ${hay(l.margen) ? `${miles(l.margen)}%` : SIN_DATOS}</title>
      <circle class="esc-mx-c" cx="${cx}" cy="${cy}" r="${r}"/><text class="esc-mx-n" x="${cx}" y="${+(cy + r + 12).toFixed(1)}" text-anchor="middle">${recorta(l.linea || `Línea ${l.i + 1}`)}</text></g>`;
  });
  return html`<svg class="esc-mx" viewBox="0 0 ${W} ${H}" role="img" aria-label="Matriz BCG: ${plural(pts.length, 'línea', 'líneas')} según su crecimiento y su participación">
    ${cuadrante('estrella', ml, mt)}${cuadrante('interrogante', ml + pw / 2, mt)}${cuadrante('vaca', ml, mt + ph / 2)}${cuadrante('perro', ml + pw / 2, mt + ph / 2)}
    <text class="esc-mx-t" x="${ml}" y="${H - mb + 16}" text-anchor="start">10</text><text class="esc-mx-t" x="${ml + pw / 2}" y="${H - mb + 16}" text-anchor="middle">1</text><text class="esc-mx-t" x="${ml + pw}" y="${H - mb + 16}" text-anchor="end">0.1</text>
    <text class="esc-mx-eje" x="${ml + pw / 2}" y="${H - 10}" text-anchor="middle">Participación relativa (1 = igual que el líder)</text>
    <text class="esc-mx-t" x="${ml - 6}" y="${mt + 10}" text-anchor="end">${miles(redondeo(cen + R))}%</text><text class="esc-mx-t" x="${ml - 6}" y="${mt + ph / 2 + 4}" text-anchor="end">${miles(cen)}%</text><text class="esc-mx-t" x="${ml - 6}" y="${mt + ph}" text-anchor="end">${miles(redondeo(cen - R))}%</text>
    <text class="esc-mx-eje" transform="rotate(-90 14 ${mt + ph / 2})" x="14" y="${mt + ph / 2}" text-anchor="middle">Crecimiento del mercado</text>
    ${burbujas}</svg>
    <p class="mut sm esc-mx-leyenda">Tamaño = ventas · color = margen (más oscuro, más margen). Alto = crecimiento desde ${UMBRALES.crecimiento}% al año y participación relativa desde ${UMBRALES.participacion}.</p>${aviso}`;
}

export const vista = {
  // El contenido inicial de un entregable nuevo: el BMC en blanco, sin líneas, sin números y sin escenarios.
  nuevo() { return vacio(); },

  // Re-pinta todo dentro de `el`. `c` es el estado vivo: cada cambio lo actualiza, recalcula lo derivado sin tocar los campos (que
  // no pierdan el foco) y le avisa al shell con el contenido completo.
  pintar(el, { contenido, editable = false, onCambio = () => {}, ctx = {} } = {}) {
    const c = limpiar(contenido), M = monedaDe(ctx), ed = Boolean(editable);
    const avisar = () => onCambio(structuredClone(c));

    // Un campo: editable es un control nativo atado a su ruta; en lectura es texto (o ⚠️ SIN DATOS si no hay nada, salvo que `sin` sea '').
    const ro = (v, sin) => (String(v ?? '').trim() ? html`<span class="esc-ro">${typeof v === 'number' ? miles(v) : v}</span>` : sin === '' ? '' : html`<span class="esc-ro esc-sin">${sin ?? SIN_DATOS}</span>`);
    const campo = (ruta, v, { et = '', ph = '', max, area = false, num = false, sin } = {}) => {
      if (!ed) return ro(v, sin);
      const mx = max ? raw(` maxlength="${Number(max)}"`) : '';
      return area ? html`<textarea class="in esc-in" rows="3" data-ruta="${ruta}" aria-label="${et}" placeholder="${ph}"${mx}>${v ?? ''}</textarea>`
        : html`<input class="in esc-in" type="text" data-ruta="${ruta}" ${num ? raw('data-tipo="num" inputmode="decimal" autocomplete="off"') : ''} aria-label="${et}" placeholder="${ph}" value="${v ?? ''}"${mx}>`;
    };
    const opciones = (lista, actual, sin) => html`<option value="">${sin}</option>${lista.map(([k, n]) => html`<option value="${k}" ${actual === k ? raw('selected') : ''}>${n}</option>`)}`;

    // ---------- 1 · Modelo de negocio ----------
    const panelBmc = () => {
      const b = aplicar(c.base, {}), ing = hay(b.precio) && hay(b.volumen) ? b.precio * b.volumen : null, cos = hay(b.costo) && hay(b.volumen) ? b.costo * b.volumen : null;
      const falta = [!hay(b.precio) && 'precio', !hay(b.costo) && 'costo', !hay(b.volumen) && 'volumen'].filter(Boolean);
      const vacios = BMC.filter((x) => !c.bmc[x.id].texto).length;
      return html`<div class="esc-utilidad"><b>Utilidad = ingresos − costos</b>
          ${ing !== null && cos !== null ? html`<span class="esc-util-n">${dinero(ing, M)} − ${dinero(cos, M)} = <b>${dinero(redondeo(ing - cos), M)}</b></span><span class="mut sm">en las ventas nuevas de un mes, con la base de Escenarios</span>`
            : html`<span class="esc-sin">${SIN_DATOS}: falta ${falta.join(', ')} en la base de Escenarios</span>`}</div>
        <div class="esc-bmc">${BMC.map((x) => { const v = c.bmc[x.id]; return html`<section class="esc-bmc-b" data-bloque="${x.id}" data-semaforo="${v.semaforo}">
          <header><h4>${x.nombre}</h4><span class="mut sm">${x.pregunta}</span></header>
          ${campo(`bmc.${x.id}.texto`, v.texto, { et: x.nombre, ph: 'Lo que hay hoy', max: 400, area: true })}
          <div class="esc-bmc-s">
            ${ed ? html`<label class="esc-f"><span class="lbl">Salud</span><select class="in esc-in" data-ruta="bmc.${x.id}.semaforo" aria-label="Salud de ${x.nombre}">${opciones(SEMAFOROS.map((s) => [s, SEMAFORO_TXT[s]]), v.semaforo, 'Sin evaluar')}</select></label>`
              : html`<span class="chip esc-sem" data-semaforo="${v.semaforo}">${SEMAFORO_TXT[v.semaforo] || 'Sin evaluar'}</span>`}
            <label class="esc-f esc-f-nota">${ed ? html`<span class="lbl">Dónde frena el crecimiento</span>` : ''}${campo(`bmc.${x.id}.nota`, v.nota, { et: `Dónde frena el crecimiento: ${x.nombre}`, ph: 'Una línea', max: 300, sin: '' })}</label>
          </div></section>`; })}</div>
        ${vacios ? html`<p class="esc-sin esc-fuente">${SIN_DATOS}: ${plural(vacios, 'bloque vacío sale', 'bloques vacíos salen')} de la carpeta del cliente (07-oferta-y-ventas) o de lo que cuente el fundador.</p>` : ''}`;
    };

    // ---------- 2 · Cartera ----------
    const celdaCuadrante = (l) => {
      const q = cuadranteBCG(l.crecimiento, l.participacion), sug = accionSugerida(q);
      return q ? html`<span class="chip esc-q" data-q="${q}" title="${BCG.find((x) => x.id === q)?.regla || ''}">${BCG.find((x) => x.id === q)?.nombre}</span> <span class="mut sm">propone ${sug}</span>`
        : html`<span class="esc-sin" title="Falta el crecimiento del mercado o la participación relativa">${SIN_DATOS}</span>`;
    };
    const tablero = () => html`<div class="esc-tablero">${[...ACCIONES, ''].filter((a) => a || c.cartera.some((l) => !l.accion)).map((a) => { const items = c.cartera.filter((l) => l.accion === a);
      return html`<section class="esc-grupo" data-accion="${a}"><h4>${a ? ACCION_TXT[a] : 'Sin decidir'} <span class="mut sm">${items.length}</span></h4>
        ${items.length ? html`<ul>${items.map((l) => { const sug = a ? '' : accionSugerida(cuadranteBCG(l.crecimiento, l.participacion)); return html`<li>${l.linea || 'Sin nombre'}${sug ? html` <span class="mut sm">· propone ${sug}</span>` : ''}</li>`; })}</ul>` : html`<p class="mut sm">Ninguna</p>`}</section>`; })}</div>`;
    const panelCartera = () => html`<div class="esc-scroll"><table class="esc-tabla"><thead><tr><th scope="col">Línea</th><th scope="col">Ventas</th><th scope="col">Margen %</th><th scope="col">Crecimiento %</th><th scope="col">Participación relativa</th><th scope="col">Cuadrante</th><th scope="col">Acción</th>${ed ? html`<th scope="col"><span class="sr-only">Quitar</span></th>` : ''}</tr></thead>
        <tbody>${c.cartera.map((l, i) => html`<tr data-linea="${i}">
          <td>${campo(`cartera.${i}.linea`, l.linea, { et: `Nombre de la línea ${i + 1}`, ph: 'Nombre', max: 100 })}</td>
          <td>${campo(`cartera.${i}.ventas`, l.ventas, { et: `Ventas de ${l.linea || `la línea ${i + 1}`}`, num: true, ph: '0' })}</td>
          <td>${campo(`cartera.${i}.margen`, l.margen, { et: `Margen de ${l.linea || `la línea ${i + 1}`}`, num: true, ph: '0 a 100' })}</td>
          <td>${campo(`cartera.${i}.crecimiento`, l.crecimiento, { et: `Crecimiento del mercado de ${l.linea || `la línea ${i + 1}`}`, num: true, ph: '% al año' })}</td>
          <td>${campo(`cartera.${i}.participacion`, l.participacion, { et: `Participación relativa de ${l.linea || `la línea ${i + 1}`}`, num: true, ph: '1 = el líder' })}</td>
          <td data-celda-q="${i}">${celdaCuadrante(l)}</td>
          <td>${ed ? html`<select class="in esc-in" data-ruta="cartera.${i}.accion" aria-label="Acción para ${l.linea || `la línea ${i + 1}`}">${opciones(ACCIONES.map((a) => [a, ACCION_TXT[a]]), l.accion, 'Sin decidir')}</select>` : html`<span class="esc-ro">${ACCION_TXT[l.accion] || 'Sin decidir'}</span>`}</td>
          ${ed ? html`<td><button type="button" class="btn ghost xs" data-acc="quitar-linea" data-i="${i}" aria-label="Quitar la línea ${i + 1}">${ico('x', 14)}</button></td>` : ''}</tr>`)}</tbody></table></div>
      ${!c.cartera.length ? html`<p class="esc-sin esc-fuente">${SIN_DATOS}: las líneas de producto y sus ventas salen de 07-oferta-y-ventas/numeros.md del cliente (solo lo ve quien ve costos) o de lo que pegue el cliente.</p>` : ''}
      ${ed ? html`<div class="esc-barra"><button type="button" class="btn ghost sm" data-acc="agregar-linea" ${c.cartera.length >= MAX_LINEAS ? raw('disabled') : ''}>${ico('plus', 14)} Agregar línea</button><span class="mut sm">Hasta ${MAX_LINEAS}. Margen de 0 a 100; participación relativa: 1 = igual que el líder.</span></div>` : ''}
      <div class="esc-cartera-vis"><div class="esc-matriz" data-vivo="matriz">${matriz(limpiar(c).cartera)}</div><div data-vivo="tablero"><h3 class="esc-h">Empujar · sostener · revisar · retirar</h3>${tablero()}</div></div>`;

    // ---------- 3 · Modelo de dinero ----------
    const panelDinero = () => html`<p class="mut sm esc-nota">La escalera de $100M Money Models: lo que el cliente ofrece hoy en cada escalón y el hueco. Cada escalón lleva su cita del libro.</p>
      <ol class="esc-escalera">${TIPOS_OFERTA.map((t, i) => { const x = c.escalera[t.id], hueco = !x.hoy || Boolean(x.hueco);
        return html`<li class="esc-peldano" data-tipo="${t.id}" data-hueco="${hueco ? '1' : '0'}">
          <header><span class="esc-paso">${i + 1}</span><div><h4>${t.nombre}</h4><span class="mut sm">${t.que}</span></div><span class="chip esc-hueco" data-visible="${hueco ? '1' : '0'}">Hueco</span></header>
          <label class="esc-f"><span class="lbl">Lo que tiene hoy</span>${campo(`escalera.${t.id}.hoy`, x.hoy, { et: `Lo que el cliente ofrece hoy en ${t.nombre}`, ph: 'Qué ofrece hoy en este escalón', max: 300, area: true, sin: `${SIN_DATOS}: lo que el cliente ofrece hoy en este escalón` })}</label>
          <label class="esc-f"><span class="lbl">El hueco</span>${campo(`escalera.${t.id}.hueco`, x.hueco, { et: `El hueco en ${t.nombre}`, ph: 'Qué falta aquí', max: 300, area: true, sin: '' })}</label>
          <label class="esc-f"><span class="lbl">Cita del libro</span>${campo(`escalera.${t.id}.cita`, x.cita, { et: `Cita del libro para ${t.nombre}`, ph: '[$100M MONEY MODELS | capítulo | pág. PDF N]', max: 200, sin: `${SIN_DATOS}: cita del libro` })}</label>
          <p class="mut sm esc-ruta">Se lee en ${t.ruta.split('/').slice(-2).join('/')}</p></li>`; })}</ol>`;

    // ---------- 4 · Escenarios ----------
    const resultados = () => {
      const r = correrEscenarios(c), cols = [{ nombre: 'Hoy', res: r.base, base: aplicar(c.base, {}), delta: null }, ...r.escenarios.map((e) => ({ nombre: e.nombre, res: e.resultado, base: e.base, delta: e.delta }))];
      const celda = (x, k) => { const v = x.res[k]; if (v === null) { const f = faltaDe(k, x.base); return html`<td class="esc-sin">${SIN_DATOS}${f.length ? html`<span class="esc-falta">: falta ${f.join(', ')}</span>` : ''}</td>`; }
        const d = x.delta?.[k]; return html`<td>${mostrar(k, v, M)}${hay(d) && d !== 0 ? html` <span class="esc-delta" data-signo="${d > 0 ? '+' : '-'}">${d > 0 ? '+' : '−'}${mostrar(k, Math.abs(d), M)}</span>` : ''}</td>`; };
      return html`<div class="esc-scroll"><table class="esc-tabla esc-res-t"><thead><tr><th scope="col"><span class="sr-only">Resultado</span></th>${cols.map((x) => html`<th scope="col">${x.nombre}</th>`)}</tr></thead>
        <tbody>${RESULTADOS.map(([k, n]) => html`<tr><th scope="row">${n}</th>${cols.map((x) => celda(x, k))}</tr>`)}</tbody></table></div>
        <p class="mut sm esc-nota">Estos números se calculan: no se escriben. Con un insumo que falta no sale ninguno (nunca un 0). Debajo de cada valor, la diferencia contra hoy.</p>`;
    };
    const graficas = () => {
      const r = correrEscenarios(c), cols = [{ nombre: 'Hoy', res: r.base, base: aplicar(c.base, {}) }, ...r.escenarios.map((e) => ({ nombre: e.nombre, res: e.resultado, base: e.base }))];
      const valor = (x, k) => (k === 'cac' ? x.base.cac : x.res[k]);
      if (GRAFICAS.every(([k]) => cols.every((x) => valor(x, k) === null))) return html`<p class="esc-sin esc-fuente">${SIN_DATOS}: llena la base de hoy (precio, costo, volumen, CAC y retención) para ver las gráficas.</p>`;
      return html`<div class="esc-graficas">${GRAFICAS.map(([k, n]) => { const vs = cols.map((x) => valor(x, k)), max = Math.max(0, ...vs.filter(hay));
        return html`<section class="esc-grafica" data-metrica="${k}"><h4>${n}</h4>${hbars(cols.map((x, j) => { const v = vs[j]; return { label: x.nombre, pct: v === null ? null : max > 0 && v > 0 ? (v / max) * 100 : 0, text: v === null ? SIN_DATOS : mostrar(k, v, M), c: j === 0 ? PAL.sand : PAL.brown }; }))}</section>`; })}</div>`;
    };
    const panelEscenarios = () => html`<p class="esc-aviso" role="note">${ico('info', 15)} <span>Un cambio de precio u oferta se manda a Strategy (Offer Architect), no se decide aquí.</span></p>
      <h3 class="esc-h">La base de hoy</h3>
      ${ed ? html`<p class="mut sm esc-nota">Números sin letras ni escala: 1200, Q1,200 o 80%. «1.5M» o «+10%» no se leen. Si vas a pegar números del cliente, activa el modo privado.</p>` : ''}
      <div class="esc-base">${BASE_CAMPOS.map(([k, n, ayuda]) => html`<label class="esc-f"><span class="lbl">${n}</span>${campo(`base.${k}`, c.base[k], { et: `${n} de hoy`, num: true, ph: ayuda, sin: `${SIN_DATOS}: lo da el cliente` })}<span class="mut sm">${ayuda}</span></label>`)}</div>
      <h3 class="esc-h">Los escenarios <span class="mut sm">de 2 a 4: en cada uno solo el valor nuevo de lo que cambia; vacío = igual que hoy</span></h3>
      <div class="esc-cols">${c.escenarios.map((e, i) => html`<section class="esc-col" data-esc="${i}">
          <header>${campo(`escenarios.${i}.nombre`, e.nombre, { et: `Nombre del escenario ${i + 1}`, ph: `Escenario ${i + 1}`, max: 80 })}
            ${ed ? html`<button type="button" class="btn ghost xs" data-acc="quitar-esc" data-i="${i}" aria-label="Quitar el escenario ${i + 1}">${ico('x', 14)}</button>` : ''}</header>
          ${CAMBIOS.map((k) => html`<label class="esc-f"><span class="lbl">${CAMBIO_NOMBRE[k]}</span>${ed ? html`<input class="in esc-in" type="text" data-ruta="escenarios.${i}.cambios.${k}" data-tipo="num" data-cambio="${k}" inputmode="decimal" autocomplete="off" aria-label="${CAMBIO_NOMBRE[k]} nuevo en ${e.nombre}" placeholder="${c.base[k] ?? 'igual que hoy'}" value="${e.cambios[k] ?? ''}">`
            : html`<span class="esc-ro">${k in e.cambios ? (k === 'retencion' ? `${redondeo(e.cambios[k] * 100)}%` : miles(e.cambios[k])) : 'Igual que hoy'}</span>`}</label>`)}</section>`)}
        ${ed && c.escenarios.length < MAX_ESCENARIOS ? html`<button type="button" class="esc-agregar" data-acc="agregar-esc">${ico('plus', 14)} Agregar escenario</button>` : ''}</div>
      ${c.escenarios.length < 2 ? html`<p class="esc-sin esc-fuente">${SIN_DATOS}: ${ed ? 'agrega al menos 2 escenarios (subir precio, agregar un upsell, más retención, bajar el CAC); aprobar queda bloqueado con menos.' : 'los escenarios salen de lo que se quiera probar con el cliente.'}</p>` : ''}
      <h3 class="esc-h">Qué pasa en cada uno</h3><div data-vivo="resultados">${resultados()}</div>
      <h3 class="esc-h">Gráficas</h3><div data-vivo="graficas">${graficas()}</div>`;

    const PANELES = { bmc: panelBmc, cartera: panelCartera, dinero: panelDinero, escenarios: panelEscenarios };
    const pintarTodo = () => mount(el, html`<div class="esc" data-tab="${tabActual}">
      <div class="esc-tabs" role="tablist" aria-label="Money Model Lab">${TABS.map(([k, n]) => html`<button type="button" role="tab" id="esc-tab-${k}" class="esc-tab" aria-selected="${String(k === tabActual)}" aria-controls="esc-panel" tabindex="${k === tabActual ? 0 : -1}" data-acc="tab" data-tab="${k}">${n}</button>`)}</div>
      <div id="esc-panel" class="esc-panel" role="tabpanel" aria-labelledby="esc-tab-${tabActual}">${PANELES[tabActual]()}</div></div>`);

    // ---------- Lo derivado se recalcula sin tocar los campos que se están escribiendo ----------
    const vivo = (n) => el.querySelector(`[data-vivo="${n}"]`);
    const derivar = (ruta, t) => {
      const p = ruta.split('.');
      if (p[0] === 'bmc' && p[2] === 'semaforo') t.closest('.esc-bmc-b')?.setAttribute('data-semaforo', t.value);
      else if (p[0] === 'cartera') {
        c.cartera.forEach((l, i) => { const td = el.querySelector(`[data-celda-q="${i}"]`); if (td) mount(td, celdaCuadrante(l)); });
        const m = vivo('matriz'), tb = vivo('tablero');
        if (m) mount(m, matriz(limpiar(c).cartera));
        if (tb) mount(tb, html`<h3 class="esc-h">Empujar · sostener · revisar · retirar</h3>${tablero()}`);
      } else if (p[0] === 'escalera') {
        const x = c.escalera[p[1]], li = t.closest('.esc-peldano'), hueco = !x.hoy || Boolean(x.hueco);
        li?.setAttribute('data-hueco', hueco ? '1' : '0'); li?.querySelector('.esc-hueco')?.setAttribute('data-visible', hueco ? '1' : '0');
      } else if (p[0] === 'base' || p[0] === 'escenarios') {
        if (p[0] === 'base') el.querySelectorAll('input[data-cambio]').forEach((i) => { i.placeholder = String(c.base[i.dataset.cambio] ?? 'igual que hoy'); });
        const r = vivo('resultados'), g = vivo('graficas');
        if (r) mount(r, resultados());
        if (g) mount(g, graficas());
      }
    };
    const cambiar = (t) => {
      const ruta = t.dataset?.ruta; if (!ed || !ruta) return;
      const v = t.dataset.tipo === 'num' ? (t.value.trim() === '' ? null : t.value.trim()) : t.value;
      if (!fijar(c, ruta, v)) return;
      if (t.dataset.tipo === 'num') t.setAttribute('aria-invalid', String(sinLeer(ruta, v)));
      derivar(ruta, t); avisar();
    };
    el.oninput = (e) => { if (e.target.tagName !== 'SELECT') cambiar(e.target); };
    el.onchange = (e) => { if (e.target.tagName === 'SELECT') cambiar(e.target); };
    el.onclick = (e) => {
      const b = e.target.closest?.('[data-acc]'); if (!b || !el.contains(b)) return;
      const i = Number(b.dataset.i), acc = b.dataset.acc;
      if (acc === 'tab') { if (TABS.some(([k]) => k === b.dataset.tab)) { tabActual = b.dataset.tab; pintarTodo(); el.querySelector(`#esc-tab-${tabActual}`)?.focus(); } return; }
      if (!ed) return;
      if (acc === 'agregar-linea' && c.cartera.length < MAX_LINEAS) { c.cartera.push({ linea: '', ventas: null, margen: null, crecimiento: null, participacion: null, accion: '' }); avisar(); pintarTodo(); el.querySelector(`[data-ruta="cartera.${c.cartera.length - 1}.linea"]`)?.focus(); }
      else if (acc === 'quitar-linea' && i >= 0 && i < c.cartera.length) { c.cartera.splice(i, 1); avisar(); pintarTodo(); }
      else if (acc === 'agregar-esc' && c.escenarios.length < MAX_ESCENARIOS) { c.escenarios.push({ nombre: `Escenario ${c.escenarios.length + 1}`, cambios: {} }); avisar(); pintarTodo(); el.querySelector(`[data-ruta="escenarios.${c.escenarios.length - 1}.nombre"]`)?.focus(); }
      else if (acc === 'quitar-esc' && i >= 0 && i < c.escenarios.length) { c.escenarios.splice(i, 1); avisar(); pintarTodo(); }
    };
    // Las flechas mueven entre pestañas (lo normal en un tablist).
    el.onkeydown = (e) => {
      const t = e.target.closest?.('[role="tab"]'); if (!t || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const k = TABS.findIndex(([x]) => x === t.dataset.tab), n = TABS[(k + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0];
      e.preventDefault(); tabActual = n; pintarTodo(); el.querySelector(`#esc-tab-${n}`)?.focus();
    };
    pintarTodo();
  },

  // Una línea o chips para el Overview y para la propuesta de la IA.
  resumen(contenido) {
    const c = limpiar(contenido), r = correrEscenarios(c), n = BMC.filter((b) => c.bmc[b.id].texto).length, l = r.base.ltgpCac;
    return html`<span class="esc-res">${[`BMC ${n}/${BMC.length}`, plural(c.cartera.length, 'línea', 'líneas'), plural(c.escenarios.length, 'escenario', 'escenarios'), l === null ? `LTGP:CAC ${SIN_DATOS}` : `LTGP:CAC hoy ${miles(l)} : 1`].map((x) => html`<span class="chip">${x}</span> `)}</span>`;
  },
};
