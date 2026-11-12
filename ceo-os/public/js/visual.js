// Visual: lo que vuelve la información fácil de digerir. Anillos de avance, barras, proporciones de una línea, sparklines,
// cuentas regresivas en palabras, grupos por fecha, monogramas, cuadritos de ícono, puntos de estado y estados vacíos.
// Principio (Few, Tufte, NN/g): el ojo lee sin esfuerzo longitud, posición, tamaño y color. Un solo acento por pieza (--vz-col);
// rojo, ámbar y verde solo cuando significan algo; nunca solo color (siempre texto, ícono o aria-label además); sin dato =
// vacío que dice de dónde saldría, nunca un 0 falso.
// Puro: sin DOM ni red (lo prueba scripts/test-visual.mjs). Cada helper devuelve SVG/HTML como texto con todo lo dinámico ya
// escapado: en el navegador sale como html`` listo para interpolar (core.js › raw); en Node, como string. Los estilos viven en
// app.css («VISUAL v1»). Lo único que toca el navegador (contarNumeros, recuerda, recordar) va al final y no corre al importar.
import { diasHasta, fechaLimpia, sumarDias, fechaHoy } from './areas-notas.js';
import { svgIco, tieneIco } from './iconos.js';
const core = typeof document === 'undefined' ? null : await import('./core.js');
const out = (s) => (core ? core.raw(s) : s);

// ---------- Lo mínimo para escribir HTML seguro ----------
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const clamp = (n, a, b) => Math.min(b, Math.max(a, Number(n) || 0));
// Un porcentaje de 0 a 100, o null si no hay dato (null, vacío o no numérico: nunca se vuelve 0).
const pctOk = (v) => (v == null || v === '' || typeof v === 'boolean' || !Number.isFinite(Number(v)) ? null : clamp(v, 0, 100));
// Colores: solo tokens (var(--x)) o hex. Cualquier otra cosa cae al acento del OS: nada raro llega a un atributo style.
const COLOR = /^(?:var\(--[a-z0-9-]+\)|#[0-9a-f]{3,8})$/i;
const color = (c, d = 'var(--ui-acc)') => (COLOR.test(String(c ?? '').trim()) ? String(c).trim() : d);
const claseOk = (c) => String(c ?? '').replace(/[^a-zA-Z0-9_ -]/g, '').trim();
const attrsOk = (a) => Object.entries(a && typeof a === 'object' ? a : {}).filter(([k]) => /^(?:data-[a-z0-9-]+|aria-pressed)$/.test(k)).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const corta = (f) => new Date(`${f}T12:00:00`).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' });
const larga = (f) => new Date(`${f}T12:00:00`).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// ---------- Anillo de avance (como el de Apple Fitness) ----------
// pct de 0 a 100. Sin dato (null): anillo vacío punteado, nunca un 0 falso. Con 0: solo el fondo (sin puntito).
// tam: 28 (en una fila), 46 (en una tarjeta) o 56 (héroe). num: el número al centro (por defecto, solo desde 40 px; con el % desde 44). label: lo que lee el lector de pantalla.
function sAnillo(pct, { tam = 28, grosor = 3, color: c, label, num } = {}) {
  const t = clamp(tam || 28, 16, 160), g = clamp(grosor || 3, 2, t / 3), r = +((t - g) / 2).toFixed(2), m = +(t / 2).toFixed(2);
  const circ = +(2 * Math.PI * r).toFixed(2), p = pctOk(pct), col = color(c);
  const cab = `class="vz-ring" viewBox="0 0 ${t} ${t}" width="${t}" height="${t}" role="img" style="--vz-col:${col};--vz-c:${circ}"`;
  if (p == null) return `<svg ${cab} data-vacio="1" aria-label="${esc(label || 'Sin dato')}"><circle class="vz-ring-off" cx="${m}" cy="${m}" r="${r}" fill="none" stroke-width="${g}" stroke-dasharray="2 4" stroke-linecap="round"/></svg>`;
  const n = Math.round(p), grande = t >= 44, mostrar = num ?? t >= 40, fg = p > 0
    ? `<circle class="vz-ring-fg" cx="${m}" cy="${m}" r="${r}" fill="none" stroke-width="${g}" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${+(circ * (1 - p / 100)).toFixed(2)}" transform="rotate(-90 ${m} ${m})"/>` : '';
  const tx = mostrar ? `<text class="vz-ring-n" x="${m}" y="${m}" text-anchor="middle" dominant-baseline="central" font-size="${+(t * (grande ? 0.27 : 0.3)).toFixed(1)}">${n}${grande ? '%' : ''}</text>` : '';
  return `<svg ${cab} aria-label="${esc(label || `${n}%`)}"><circle class="vz-ring-bg" cx="${m}" cy="${m}" r="${r}" fill="none" stroke-width="${g}"/>${fg}${tx}</svg>`;
}
export const anillo = (pct, o) => out(sAnillo(pct, o));

// ---------- Barra de avance contra meta (bullet de Stephen Few) ----------
// pct de 0 a 100 o null (sin dato: no se pinta nada; quien llama pone «define tu meta» como acción, no una barra vacía).
// marca: la meta o el ritmo esperado (0 a 100), una rayita vertical. Con marca y por debajo: is-bajo (ámbar); al llegar a 100: is-meta (verde).
// El texto de arriba («18k / 25k») y el % lo pone quien llama: el color nunca es la única señal.
function sBarra(pct, o) {
  const op = typeof o === 'string' ? { color: o } : o && typeof o === 'object' ? o : {};
  const p = pctOk(pct); if (p == null) return '';
  const m = pctOk(op.marca), est = p >= 100 ? ' is-meta' : m != null && p < m ? ' is-bajo' : '';
  return `<span class="vz-bar${est}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p)}" aria-label="${esc(op.label || 'Avance')}" style="--vz-col:${color(op.color)};--vz-w:${+p.toFixed(1)}%${m != null ? `;--vz-m:${+m.toFixed(1)}%` : ''}"><i class="vz-bar-f"></i>${m != null ? `<b class="vz-bar-m" title="${esc(op.marcaLabel || 'Ritmo esperado')}"></b>` : ''}</span>`;
}
export const barra = (pct, o) => out(sBarra(pct, o));

// ---------- Barra de proporción apilada (una línea) + leyenda ----------
// items: [{ valor, color, label, clase?, attrs?, partes? }]. Lo que vale 0 (o no es número) no se pinta; sin nada, ''.
// Cada segmento crece en proporción a su valor; con `partes` un segmento se subdivide por dentro (ej. las notas por área).
// attrs (solo data-* y aria-pressed) vuelve clicable su entrada de la leyenda (para filtrar); clase se pone en el segmento y en el punto.
// minimo: cuántos segmentos hacen falta para pintarla (con 2, una barra de un solo color no se pinta: no compara nada).
const itemsOk = (items) => (Array.isArray(items) ? items : []).map((x) => ({ ...x, valor: x?.valor == null || x.valor === '' ? NaN : Number(x.valor) })).filter((x) => Number.isFinite(x.valor) && x.valor > 0);
function sLeyenda(items) {
  const l = itemsOk(items); if (!l.length) return '';
  return `<ul class="vz-ley">${l.map((x) => {
    const a = attrsOk(x.attrs), cl = claseOk(x.clase), dot = `<i class="vz-dot${cl ? ` ${cl}` : ''}"${x.color ? ` style="--seg:${color(x.color)}"` : ''}></i>`;
    const cont = `${dot}<span class="vz-ley-t">${esc(x.label)}</span><b class="vz-ley-n">${x.valor}</b>`;
    return `<li>${a ? `<button type="button" class="vz-ley-i${cl ? ` ${cl}` : ''}" ${a}>${cont}</button>` : `<span class="vz-ley-i${cl ? ` ${cl}` : ''}">${cont}</span>`}</li>`;
  }).join('')}</ul>`;
}
function sProp(items, { leyenda = true, label, minimo = 1 } = {}) {
  const l = itemsOk(items); if (!l.length || l.length < minimo) return '';
  const seg = l.map((x, i) => {
    const partes = itemsOk(x.partes), cl = claseOk(x.clase);
    const st = `flex-grow:${x.valor};--i:${i}${x.color ? `;--seg:${color(x.color)}` : ''}`;
    const dentro = partes.map((p) => `<i style="flex-grow:${p.valor};--seg:${color(p.color)}" title="${esc(p.label)}: ${p.valor}"></i>`).join('');
    return `<span class="vz-seg${partes.length ? ' vz-seg--grupo' : ''}${cl ? ` ${cl}` : ''}" style="${st}" title="${esc(x.label || '')}${x.label ? ': ' : ''}${x.valor}">${dentro}</span>`;
  }).join('');
  const resumen = label || l.map((x) => `${x.label || ''} ${x.valor}`.trim()).join(', ');
  return `<div class="vz-prop"><div class="vz-prop-bar" role="img" aria-label="${esc(resumen)}">${seg}</div>${leyenda ? sLeyenda(l) : ''}</div>`;
}
export const proporcion = (items, o) => out(sProp(items, o));
export const leyenda = (items) => out(sLeyenda(items));

// ---------- Sparkline (palabras con gráfico, de Tufte) ----------
// valores: números en orden (de viejo a nuevo). Con menos de 3 puntos reales no se dibuja (devuelve ''): quien llama dice «aún sin historial».
// La línea llega al último punto (círculo de 2.5 px) y debajo va el área al 12% que se desvanece. Todo con el acento (--vz-col).
let nSpark = 0;
function sSpark(valores, { ancho = 80, alto = 24, color: c, label = 'Tendencia' } = {}) {
  const v = (Array.isArray(valores) ? valores : []).filter((x) => x != null && x !== '' && typeof x !== 'boolean').map(Number).filter(Number.isFinite);
  if (v.length < 3) return '';
  const W = clamp(ancho || 80, 24, 400), H = clamp(alto || 24, 12, 120), mg = 3, lo = Math.min(...v), hi = Math.max(...v), span = hi - lo;
  const pts = v.map((y, i) => [+(mg + (i * (W - 2 * mg)) / (v.length - 1)).toFixed(2), +(span ? H - mg - ((y - lo) / span) * (H - 2 * mg) : H / 2).toFixed(2)]);
  const ult = pts[pts.length - 1], id = `vzg${++nSpark}`, linea = pts.map((p) => p.join(',')).join(' ');
  return `<svg class="vz-spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}" style="--vz-col:${color(c)}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".12"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>`
    + `<path class="vz-spark-a" d="M${pts[0][0]},${H} L${pts.map((p) => p.join(',')).join(' L')} L${ult[0]},${H} Z" fill="url(#${id})" stroke="none"/>`
    + `<polyline class="vz-spark-l" points="${linea}" pathLength="1" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`
    + `<circle class="vz-spark-p" cx="${ult[0]}" cy="${ult[1]}" r="2.5"/></svg>`;
}
export const sparkline = (valores, o) => out(sSpark(valores, o));

// ---------- Cuánto falta, en lenguaje humano ----------
// → { texto, tono, dias } o null si la fecha no es real (no se inventa). tono: tarde (ya pasó, rojo) · hoy (rojo sólido) ·
// pronto (mañana, ámbar) · ok (más adelante, neutro). `hoy` es una fecha AAAA-MM-DD (por defecto, la de la compu).
export function cuenta(fecha, hoy = fechaHoy()) {
  const d = diasHasta(fecha, hoy); if (d == null) return null;
  if (d < 0) { const n = -d; return { dias: d, tono: 'tarde', texto: n >= 60 ? `Pasó hace ${Math.round(n / 30)} meses` : `Pasó hace ${plural(n, 'día', 'días')}` }; }
  if (d === 0) return { dias: 0, tono: 'hoy', texto: 'Hoy' };
  if (d === 1) return { dias: 1, tono: 'pronto', texto: 'Mañana' };
  return { dias: d, tono: 'ok', texto: d < 14 ? `En ${d} días` : d < 60 ? `En ${Math.round(d / 7)} sem.` : `En ${Math.round(d / 30)} meses` };
}
// El chip: reloj + el texto, con la fecha completa en title y aria-label. Sin fecha real no hay chip. hecho: lo que ya se hizo no
// corre (queda gris y con su fecha corta).
function sCuentaChip(fecha, hoy, { hecho = false } = {}) {
  const f = fechaLimpia(fecha), c = f && cuenta(f, hoy); if (!c) return '';
  const tono = hecho ? 'hecho' : c.tono, texto = hecho ? corta(f) : c.texto, abs = larga(f);
  return `<span class="vz-cuenta vz-t-${tono}" title="${esc(abs)}" aria-label="${esc(`${texto} · ${abs}`)}">${svgIco('clock', 11)}<span>${esc(texto)}</span></span>`;
}
export const cuentaChip = (fecha, hoy, o) => out(sCuentaChip(fecha, hoy, o));

// ---------- Agrupar por fecha relativa (como Things y Linear) ----------
export const GRUPOS = ['Pasado', 'Hoy', 'Esta semana', 'Próxima semana', 'Después', 'Sin fecha'];
export const GRUPO_ETIQUETA = { Pasado: 'Atrasado', Hoy: 'Hoy', 'Esta semana': 'Esta semana', 'Próxima semana': 'Próxima semana', Después: 'Después', 'Sin fecha': 'Sin fecha' };
// La semana (lunes a domingo) de una fecha: { from, to }, o null.
export function semanaDe(fecha) {
  const f = fechaLimpia(fecha); if (!f) return null;
  const from = sumarDias(f, -((new Date(`${f}T12:00:00Z`).getUTCDay() + 6) % 7));
  return { from, to: sumarDias(from, 6) };
}
export function grupoRelativo(fecha, hoy = fechaHoy()) {
  const f = fechaLimpia(fecha), h = fechaLimpia(hoy), s = semanaDe(h);
  if (!f || !s) return 'Sin fecha';
  if (f < h) return 'Pasado';
  if (f === h) return 'Hoy';
  return f <= s.to ? 'Esta semana' : f <= sumarDias(s.to, 7) ? 'Próxima semana' : 'Después';
}
// [{ grupo, etiqueta, items }] en el orden de GRUPOS, sin los grupos vacíos; dentro de cada uno, la fecha más cercana primero.
export function agruparPorFecha(items, fechaDe = (x) => x?.fecha, hoy = fechaHoy()) {
  const g = Object.fromEntries(GRUPOS.map((k) => [k, []]));
  for (const it of Array.isArray(items) ? items : []) g[grupoRelativo(fechaDe(it), hoy)].push(it);
  return GRUPOS.filter((k) => g[k].length).map((k) => ({ grupo: k, etiqueta: GRUPO_ETIQUETA[k], items: k === 'Sin fecha' ? g[k] : [...g[k]].sort((a, z) => String(fechaDe(a)).localeCompare(String(fechaDe(z)))) }));
}

// ---------- Monograma de cliente ----------
// Iniciales (1 o 2 letras) en un círculo; el color sale de un hash del nombre a 6 tonos fijos (vz-m-0 a vz-m-5): el mismo
// nombre, siempre el mismo color. Sin nombre no hay nada (nunca una imagen inventada).
export const TONOS = 6;
export function iniciales(nombre) {
  const w = String(nombre ?? '').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '';
  return (w.length === 1 ? Array.from(w[0]).slice(0, 2) : [Array.from(w[0])[0], Array.from(w[1])[0]]).join('').toUpperCase();
}
export function tonoDe(nombre) {
  const s = String(nombre ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h % TONOS;
}
function sMono(nombre, { tam = 'md', solo = false } = {}) {
  const ini = iniciales(nombre); if (!ini) return '';
  return `<span class="vz-mono vz-m-${tonoDe(nombre)}${tam === 'sm' ? ' vz-mono--sm' : ''}"${solo ? ` role="img" aria-label="${esc(nombre)}"` : ' aria-hidden="true"'}>${esc(ini)}</span>`;
}
export const monograma = (nombre, o) => out(sMono(nombre, o));
// Varias personas o clientes: círculos apilados (se encima 6 px, con borde del color del fondo) y «+N» al final.
function sMonos(nombres, { max = 3, tam = 'md' } = {}) {
  const l = [...new Set((Array.isArray(nombres) ? nombres : []).map((x) => String(x ?? '').trim()).filter(Boolean))];
  if (!l.length) return '';
  if (l.length === 1) return sMono(l[0], { tam, solo: true });
  const m = Math.max(1, max | 0), ver = l.slice(0, m), resto = l.length - ver.length;
  return `<span class="vz-monos" role="img" aria-label="${esc(ver.join(', '))}${resto ? esc(` y ${resto} más`) : ''}">${ver.map((n) => sMono(n, { tam })).join('')}${resto ? `<span class="vz-mono vz-m-mas${tam === 'sm' ? ' vz-mono--sm' : ''}" aria-hidden="true">+${resto}</span>` : ''}</span>`;
}
export const monogramas = (nombres, o) => out(sMonos(nombres, o));

// ---------- Punto de estado ----------
// tono: vivo (verde, con pulso) · medio (ámbar) · caido (rojo) · off (hueco, sin configurar) · info. Siempre va con un texto corto al lado.
const TONOS_PUNTO = ['vivo', 'medio', 'caido', 'off', 'info'];
export const punto = (tono = 'off') => out(`<i class="vz-punto vz-p-${TONOS_PUNTO.includes(tono) ? tono : 'off'}" aria-hidden="true"></i>`);
export const estado = (tono, texto) => out(`<span class="vz-estado">${punto(tono)}<span>${esc(texto)}</span></span>`);

// ---------- Cuadrito de ícono (el tipo, en un vistazo) ----------
// El color llega como --tipo-c (un token); el cuadro va tintado al 14% y el ícono en ese color. titulo: lo que dice el ícono (title y aria-label).
export function cuadrito(icono, { color: c, tam = 'md', titulo = '' } = {}) {
  const px = tam === 'sm' ? 14 : tam === 'lg' ? 18 : 16, cl = tam === 'sm' ? ' vz-tipo--sm' : tam === 'lg' ? ' vz-tipo--lg' : '';
  return out(`<span class="vz-tipo${cl}" style="--tipo-c:${color(c)}"${titulo ? ` title="${esc(titulo)}" role="img" aria-label="${esc(titulo)}"` : ' aria-hidden="true"'}>${svgIco(tieneIco(icono) ? icono : 'circle', px)}</span>`);
}

// ---------- Estado vacío: un círculo discontinuo, un ícono, lo que falta, de dónde saldría y una sola acción ----------
// Tres piezas fijas: qué es (titulo) + por qué está vacío (linea) + una acción (boton). Texto guía: «Aún no hay X. ¿Lo armamos en el Chat?».
// boton: { texto, act, data?, href? } o { texto, chat: { modo, borrador?, slug? } } (abre el Chat en ese modo: lo atiende app.js › [data-vac-chat]).
// Sin acción posible, sin botón (y la línea lo dice). animar: aparece con fundido y sube 6 px (solo la primera vez).
// linea puede ser html`…` (con un link); detalle: el html de un «Detalle técnico» (core.js › techDetail), solo en fallos.
// tono: 'error' pinta el fallo (ámbar/rojo, role=alert): un error nunca se pinta como vacío (usa fallo()).
function sVacio({ icono = 'circle', titulo = '', linea = '', boton = null, animar = false, compacto = false, tono = '', detalle = '' } = {}) {
  let b = '';
  const ch = boton?.chat && typeof boton.chat === 'object' ? boton.chat : null;
  if (boton?.texto && ch) {
    b = `<button type="button" class="btn ghost vz-vacio-b" data-vac-chat="${esc(ch.modo || '')}"${ch.slug ? ` data-vac-slug="${esc(ch.slug)}"` : ''}${ch.borrador ? ` data-vac-borrador="${esc(ch.borrador)}"` : ''}>${esc(boton.texto)}</button>`;
  } else if (boton?.texto) {
    const href = typeof boton.href === 'string' && /^(?:#\/|https:\/\/)/.test(boton.href) ? boton.href : '';
    const data = Object.entries(boton.data && typeof boton.data === 'object' ? boton.data : {}).filter(([k]) => /^[a-z][a-z0-9-]*$/.test(k)).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
    b = href ? `<a class="btn ghost vz-vacio-b" href="${esc(href)}">${esc(boton.texto)}</a>` : `<button type="button" class="btn ghost vz-vacio-b" data-act="${esc(boton.act || '')}"${data}>${esc(boton.texto)}</button>`;
  }
  return `<div${tono === 'error' ? ' role="alert"' : ''} class="vz-vacio${compacto ? ' vz-vacio--c' : ''}${tono === 'error' ? ' vz-vacio--err' : ''}${animar ? ' vz-vacio--entra' : ''}"><span class="vz-vacio-ic"><svg class="vz-vacio-ring" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><circle cx="24" cy="24" r="22.25" fill="none" stroke-width="1.5" stroke-dasharray="3 5" stroke-linecap="round"/></svg>${svgIco(tieneIco(icono) ? icono : 'circle', 20)}</span>`
    + `<b class="vz-vacio-t">${esc(titulo)}</b>${linea ? `<span class="vz-vacio-l">${linea && typeof linea === 'object' && typeof linea.s === 'string' ? linea.s : esc(linea)}</span>` : ''}${detalle ? String(detalle) : ''}${b}</div>`;
}
export const vacio = (o) => out(sVacio(o));
// El fallo de una carga: qué no se pudo abrir y por qué (el mensaje del servidor), con botón de reintento si quien llama lo da.
export const fallo = (o) => out(sVacio({ icono: 'triangle-alert', tono: 'error', ...o }));

// ---------- Un número que cuenta (KPI) ----------
// El HTML ya trae el valor final (data-n lo repite): sin JS, con «reducir movimiento» o repintado, se ve igual. contarNumeros lo anima
// de 0 al valor la primera vez. Sin dato: «—», nunca 0 (quien llama dice de dónde saldría).
export const formatear = (v, pre = '', suf = '') => `${Number(v) < 0 ? '-' : ''}${pre}${Math.abs(Math.round(Number(v) || 0)).toLocaleString('en-US')}${suf}`;
export function numero(n, { pre = '', suf = '', clave = '', vacio: v = '—' } = {}) {
  if (n == null || n === '' || typeof n === 'boolean' || !Number.isFinite(Number(n))) return out(`<b class="vz-num is-vacio">${esc(v)}</b>`);
  const x = Math.round(Number(n));
  return out(`<b class="vz-num" data-n="${x}" data-pre="${esc(pre)}" data-suf="${esc(suf)}"${clave ? ` data-k="${esc(clave)}"` : ''}>${esc(formatear(x, pre, suf))}</b>`);
}

// ---------- Resumen de eventos (el calendario de trabajo) ----------
// evs: [{ k, tipo, date, area? }]. Cuenta por tipo (y las notas por área) lo que cae entre `from` y `to`, sin los tipos de `excluir`
// (los hitos del ciclo no son trabajo). Un evento de varios días de Google (clave g12-2026-10-27) cuenta una sola vez.
export function resumenEventos(evs, { from = '', to = '', excluir = ['ciclo'] } = {}) {
  const vistos = new Set(), porTipo = {}, porArea = {};
  let total = 0;
  for (const e of Array.isArray(evs) ? evs : []) {
    if (!e?.tipo || !fechaLimpia(e.date) || (from && e.date < from) || (to && e.date > to) || excluir.includes(e.tipo)) continue;
    const k = String(e.k ?? '').replace(/^(g\d+)-\d{4}-\d{2}-\d{2}$/, '$1');
    if (k) { if (vistos.has(`${e.tipo}|${k}`)) continue; vistos.add(`${e.tipo}|${k}`); }
    porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1; total++;
    if (e.area) porArea[e.area] = (porArea[e.area] || 0) + 1;
  }
  return { total, porTipo, porArea };
}

// ---------- Fin de lo puro: lo único que toca el navegador ----------
// Recordar un detalle de la pantalla (un grupo abierto o cerrado) en este navegador. Si no se puede guardar o leer (ventana privada,
// datos bloqueados), la pantalla sigue igual y simplemente no lo recuerda.
export const recuerda = (llave, def = '') => { try { return localStorage.getItem(llave) ?? def; } catch { return def; } };
export const recordar = (llave, valor) => { try { localStorage.setItem(llave, String(valor)); } catch {} };

// Anima de 0 al valor (600 ms, easeOut) cada .vz-num con data-n dentro de `raiz`. `vistos` (Map clave → { v, t0 }) recuerda cuándo
// empezó cada número: si la pantalla se repinta mientras cuenta (llegan datos), el número nuevo sigue por donde iba en vez de volver a
// 0, y si ya terminó con el mismo valor se queda quieto. Con «reducir movimiento», sin requestAnimationFrame o con valor 0, se queda
// el valor puesto. Devuelve cuántos animó.
export function contarNumeros(raiz, vistos = new Map(), ms = 600) {
  if (typeof document === 'undefined' || !raiz?.querySelectorAll) return 0;
  const quieto = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let n = 0;
  for (const el of raiz.querySelectorAll('.vz-num[data-n]')) {
    const v = Number(el.dataset.n), k = el.dataset.k || '';
    if (!Number.isFinite(v)) continue;
    const hoy = typeof performance !== 'undefined' ? performance.now() : 0;
    let t0 = hoy;
    if (k) {
      const ant = vistos.get(k);
      if (ant && ant.v === v) { if (hoy - ant.t0 >= ms) continue; t0 = ant.t0; } else vistos.set(k, { v, t0 });
    }
    if (quieto || !v || typeof requestAnimationFrame !== 'function') continue;
    const pre = el.dataset.pre || '', suf = el.dataset.suf || '', puesto = (t) => { const p = Math.min(1, Math.max(0, (t - t0) / ms)); el.textContent = formatear(p < 1 ? v * (1 - (1 - p) ** 3) : v, pre, suf); return p; };
    n++; puesto(hoy);
    const paso = (t) => { if (el.isConnected && puesto(t) < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
  }
  return n;
}
