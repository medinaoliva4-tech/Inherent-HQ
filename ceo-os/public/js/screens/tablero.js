// Hoy · el tablero: TODO lo importante en UNA vista (sin scroll), en gráficos y con botones. Seis fichas:
// el ciclo (anillo del día 1 al 20 con los hitos 11 y 20), lo que te necesita (número + 3 decisiones tocables), entregables por
// estado (barra apilada), el embudo de Revenue, tus agentes (avatares + gasto contra su tope) y atajos.
// Cada número viene de los datos reales; sin dato dice «Sin datos», nunca un 0 inventado. Los números cuentan y las barras
// crecen al entrar, salvo con «reducir movimiento».
import { api } from '../core.js';
import { h } from '../kit/dom.js';
import { cicloDe, DIAS_CICLO, HITOS } from '../ciclo.js';
import { seleccion } from '../decide.js';
import { cargarContexto, contextoLista, contextoActual } from '../contexto.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...hijos) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); n.append(...hijos.flat().filter(Boolean)); return n; };
const quieto = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
// La ficha: encabezado (título + flecha si abre algo) y el contenido. Si `href`, toda la ficha es tocable.
const ficha = (titulo, href, clase, ...hijos) => h(href ? 'a' : 'section', { class: `hz-f ${clase || ''}`, ...(href ? { href, 'aria-label': `${titulo}: abrir` } : { 'aria-label': titulo }) },
  h('header', { class: 'hz-fh' }, h('span', {}, titulo), href ? h('i', { 'aria-hidden': 'true' }, '›') : ''), h('div', { class: 'hz-fb' }, ...hijos));
const sinDatos = (t = 'Sin datos', cta) => h('div', { class: 'hz-nd' }, h('p', {}, t), cta || '');
// Número que cuenta de 0 al valor (el texto final ya está puesto: sin JS o con «reducir movimiento» se ve igual).
const num = (n, clase = 'hz-big') => h('b', { class: clase, 'data-hz-n': String(n) }, String(n));
function animar(raiz) {
  if (quieto()) return;
  raiz.classList.add('hz-anim');
  for (const b of raiz.querySelectorAll('[data-hz-n]')) {
    const fin = Number(b.dataset.hzN); if (!(fin > 0)) continue;
    const t0 = performance.now(), paso = (t) => { const k = Math.min(1, (t - t0) / 650), e = 1 - (1 - k) ** 3; b.textContent = String(Math.round(fin * e)); if (k < 1) requestAnimationFrame(paso); };
    b.textContent = '0'; requestAnimationFrame(paso);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => raiz.classList.add('hz-in')));
}

// Anillo del ciclo: 20 marcas (una por día), las del día actual hacia atrás llenas; los hitos 11 y 20 más largos y con su número.
// Fuera del ciclo (21 a fin de mes) el anillo se ve completo y tenue: lo del 20 se está publicando.
export function anilloCiclo(c) {
  const R = 46, cx = 60, cy = 60, d = Math.min(c.dia, DIAS_CICLO), partes = [];
  for (let i = 1; i <= DIAS_CICLO; i++) {
    const a = ((i - 0.5) / DIAS_CICLO) * 2 * Math.PI - Math.PI / 2, hito = HITOS.includes(i), r1 = R - (hito ? 10 : 6), r2 = R + (hito ? 5 : 2);
    const on = c.enCiclo ? i <= d : true, hoy = c.enCiclo && i === d;
    partes.push(svg('line', { x1: cx + r1 * Math.cos(a), y1: cy + r1 * Math.sin(a), x2: cx + r2 * Math.cos(a), y2: cy + r2 * Math.sin(a), class: `hz-m${on ? ' on' : ''}${hito ? ' hito' : ''}${hoy ? ' hoy' : ''}${c.enCiclo ? '' : ' fuera'}`, style: `--i:${i}` }));
    if (hito) { const rt = R + 12; partes.push(svg('text', { x: cx + rt * Math.cos(a), y: cy + rt * Math.sin(a) + 3, 'text-anchor': 'middle', class: 'hz-m-h' }, String(i))); }
  }
  return svg('svg', { viewBox: '-6 -6 132 132', class: 'hz-ciclo', role: 'img', 'aria-label': c.enCiclo ? `Día ${c.dia} de 20 del ciclo` : `Fuera del ciclo: faltan ${c.diasAlHito} días para el día 11` }, ...partes,
    svg('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', class: 'hz-c-n' }, String(c.dia)), svg('text', { x: cx, y: cy + 19, 'text-anchor': 'middle', class: 'hz-c-l' }, c.enCiclo ? 'de 20' : 'del mes'));
}
const ESTADOS = ['Borrador', 'En revisión', 'Aprobado', 'Entregado'];
// Barra apilada por estado (proporciones reales; si no hay entregables, lo dice). Cada estado es tocable si hay a dónde ir.
export function barraEstados(items, href = null) {
  const n = ESTADOS.map((e) => items.filter((x) => x.estado === e).length), total = n.reduce((a, b) => a + b, 0);
  if (!total) return sinDatos('Aún no hay entregables', href ? h('a', { class: 'hz-cta', href }, 'Abrir el área') : '');
  const lado = (i) => h(href ? 'a' : 'span', { class: 'hz-ley-i', ...(href ? { href } : {}) }, h('i', { class: `hz-s${i}` }), h('span', {}, ESTADOS[i]), h('b', { 'data-hz-n': String(n[i]) }, String(n[i])));
  return h('div', { class: 'hz-est' }, h('div', { class: 'hz-tot' }, num(total), h('small', {}, 'en el ciclo')),
    h('div', { class: 'hz-pila', role: 'img', 'aria-label': ESTADOS.map((e, i) => `${e}: ${n[i]}`).join(', ') }, n.map((v, i) => (v ? h('i', { class: `hz-s${i}`, style: `--w:${v}`, title: `${ESTADOS[i]}: ${v}` }) : null))),
    h('div', { class: 'hz-ley' }, ESTADOS.map((e, i) => lado(i))));
}
// Embudo de Revenue: trapecios centrados, cada paso del ancho de lo que pasa esa puerta (todo sale del resumen de los lotes).
export function embudoHoy(pasos) {
  const max = Math.max(1, pasos[0]?.[1] || 0);
  return h('div', { class: 'hz-emb', role: 'img', 'aria-label': pasos.map(([n, v]) => `${n}: ${v}`).join(', ') }, pasos.map(([n, v], i) => h('div', { class: 'hz-emb-f' },
    h('span', { class: 'hz-emb-b' }, h('i', { class: `hz-e${i}`, style: `--w:${Math.max(v ? 8 : 2, (v / max) * 100)}%` })), h('span', { class: 'hz-emb-n' }, n), h('b', { 'data-hz-n': String(v) }, String(v)))));
}
const AREA = { revenue: 'rev', creative: 'mkt', marketing: 'mkt', ads: 'mkt', posting: 'mkt', account: 'cli', production: 'pro' };
const letra = (t) => String(t || '?').trim().charAt(0).toUpperCase();
const usd = (x) => `US$ ${x < 10 ? x.toFixed(2) : Math.round(x)}`;

// Cabe en la vista: el tablero toma lo que queda de pantalla desde donde empieza hasta la barra de abajo (en el iPhone) o el
// borde, dejando lugar a «Más detalle». Mínimo 300 px (en una pantalla muy baja, mejor scroll que fichas ilegibles).
// Busca el tablero cada vez: Hoy se rearma al llegar datos y la sección cambia.
export function ajustarTablero(box = document.getElementById('hoy-tablero')) {
  if (!box?.isConnected || document.querySelector('.hoy-mas[open]')) return; // con «Más detalle» abierto, la página sí baja
  // El contenedor que hace scroll (en el iPhone es .app; en escritorio, el documento).
  let sc = document.scrollingElement; for (let e = box.parentElement; e; e = e.parentElement) if (/auto|scroll/.test(getComputedStyle(e).overflowY) && e.clientHeight < e.scrollHeight + 1 && e.clientHeight > 200) { sc = e; break; }
  const raiz = sc === document.scrollingElement, top = box.getBoundingClientRect().top - (raiz ? 0 : sc.getBoundingClientRect().top) + sc.scrollTop;
  // Primero toma todo lo que queda de pantalla (así la página baja exactamente lo que ocupa lo de debajo: «Más detalle» y los
  // márgenes) y luego se encoge eso mismo. Medido, no adivinado.
  const todo = Math.floor(sc.clientHeight - top);
  box.style.height = `${todo}px`;
  const sobra = Math.max(0, sc.scrollHeight - sc.clientHeight);
  box.style.height = `${Math.max(300, todo - sobra)}px`;
}
let escuchando = false;
export async function pintarTablero(box, { me }) {
  const ajusta = () => ajustarTablero(box.isConnected ? box : undefined);
  if (!escuchando) { escuchando = true; window.addEventListener('resize', () => ajustarTablero(), { passive: true }); }
  ajusta(); requestAnimationFrame(ajusta);
  const hoy = new Date().toISOString().slice(0, 10), c = cicloDe(hoy);
  // Los entregables son por cliente: se toma el cliente que estás viendo (el hilo trae todos sus nodos con su estado).
  await cargarContexto(me).catch(() => null);
  const marca = contextoActual(me) || contextoLista().find((x) => x.slug && x.slug !== 'personal')?.slug || '';
  const [dec, ent, lot, ag, cos] = await Promise.all([api('decide'), marca ? api(`hilo?slug=${encodeURIComponent(marca)}`) : Promise.resolve(null), api('revenue/lotes'), api('sistemas/agentes'), api('sistemas/costo')].map((p) => p.catch(() => null)));
  const sel = dec ? seleccion(dec.items || [], { movil: false }) : null, items = ent?.nodes || [], lotes = lot?.lotes || null, agentes = ag?.agentes || null;
  const nDec = sel ? sel.visibles.length + (sel.resto || 0) : null;
  const suma = (k) => (lotes && lotes.some((l) => l.resumen?.[k] != null) ? lotes.reduce((s, l) => s + (Number(l.resumen?.[k]) || 0), 0) : null);
  const leads = suma('total');
  // Gasto de los agentes contra la suma de sus topes del mes (cada agente nace con el suyo). Sin libro de costo: «Sin datos».
  const gasto = cos ? (cos.por_agente || []).reduce((s, x) => s + (x.gastado || 0), 0) : null, tope = agentes ? agentes.reduce((s, a) => s + (Number(a.spec?.presupuesto?.por_mes) || 0), 0) : null;

  const fCiclo = ficha('Ciclo', '#/calendario/contenido', 'hz-f-ciclo', h('div', { class: 'hz-fila' }, anilloCiclo(c),
    h('div', { class: 'hz-t' }, h('small', { class: 'hz-k' }, c.enCiclo ? `Fase · día ${c.dia}` : 'Fuera del ciclo'), h('b', {}, c.fase?.nombre || ''),
      h('span', { class: `hz-hito hz-p${c.presion}` }, c.hito ? `Hoy es el día ${c.hito}` : `Día ${c.proximoHito} en ${c.diasAlHito} ${c.diasAlHito === 1 ? 'día' : 'días'}`))));

  const decs = sel ? sel.visibles.slice(0, 3) : [];
  const fDec = ficha('Te necesita', null, 'hz-f-dec', nDec == null ? sinDatos() : h('div', { class: 'hz-dec' },
    h('a', { class: 'hz-dec-n', href: '#/decide', 'aria-label': `${nDec} decisiones: abrir Decide` }, num(nDec), h('small', {}, nDec === 1 ? 'decisión' : 'decisiones')),
    nDec ? h('ul', { class: 'hz-dec-l' }, decs.map((x) => h('li', {}, h('a', { href: '#/decide' }, h('span', {}, h('b', {}, x.titulo), h('small', {}, [x.client_slug, x.prioridad?.razon].filter(Boolean).join(' · ') || 'Abrir')), h('i', { 'aria-hidden': 'true' }, '›')))),
      sel.resto ? h('li', { class: 'hz-dec-mas' }, h('a', { href: '#/decide' }, `y ${sel.resto} más`)) : '')
      : h('p', { class: 'hz-ok' }, h('i', { 'aria-hidden': 'true' }, '✓'), 'Nada espera por ti')));

  const hrefEnt = marca ? '#/ws/marketing' : null;
  const fEnt = ficha(marca ? `Entregables · ${contextoLista().find((x) => x.slug === marca)?.name || marca}` : 'Entregables', null, 'hz-f-ent', ent ? barraEstados(items, hrefEnt) : sinDatos());

  const fRev = ficha('Revenue', lotes && lotes.length ? '#/revenue/lotes' : null, 'hz-f-rev', lotes == null ? sinDatos() : lotes.length && leads ? h('div', { class: 'hz-rev' }, embudoHoy([['Leads', leads], ['Encajan', suma('escribir')], ['Correo válido', suma('validos')], ['Enviados', suma('enviados')]].filter(([, v]) => v != null)),
    h('small', { class: 'hz-mut' }, [`${lotes.length} ${lotes.length === 1 ? 'lote' : 'lotes'}`, ...[['en_aprobacion', 'esperando aprobación'], ['redactado', 'redactados'], ['calificado', 'por redactar']].map(([k, t]) => [lotes.filter((l) => l.estado === k).length, t]).filter(([n]) => n).map(([n, t]) => `${n} ${t}`)].join(' · ')))
    : sinDatos('Aún no hay lotes de leads', h('a', { class: 'hz-cta', href: '#/revenue/nuevo' }, '＋ Buscar clientes ideales')));

  const act = agentes ? agentes.filter((a) => a.estado === 'activo').length : 0;
  const fAg = ficha('Agentes', '#/sistemas', 'hz-f-ag', agentes == null ? sinDatos() : !agentes.length ? sinDatos('Aún no tienes agentes', h('span', { class: 'hz-cta' }, 'Empieza con una plantilla')) : h('div', { class: 'hz-ag' },
    h('div', { class: 'hz-ag-top' }, h('span', { class: 'hz-avs' }, agentes.slice(0, 5).map((a) => h('span', { class: `hz-av hz-av-${AREA[a.spec?.contexto?.rol] || 'x'}`, title: `${a.spec?.nombre} · ${a.estado}` }, letra(a.spec?.nombre), h('i', { class: `hz-av-e hz-av-${a.estado}` })))),
      h('span', { class: 'hz-t' }, h('b', {}, `${act} de ${agentes.length} activos`), h('small', {}, [['borrador', 'en borrador'], ['sin_activar', 'sin activar']].map(([k, t]) => [agentes.filter((a) => a.estado === k).length, t]).filter(([n]) => n).map(([n, t]) => `${n} ${t}`).join(' · ') || 'Todos activos'))),
    gasto == null || !tope ? h('small', { class: 'hz-mut' }, 'Gasto del mes: sin datos') : h('div', { class: 'hz-gas' }, h('div', { class: 'hz-gas-t' }, h('span', {}, 'Gasto del mes'), h('b', {}, `${usd(gasto)} de ${usd(tope)}`)),
      h('span', { class: 'hz-bb', role: 'img', 'aria-label': `Gastado ${usd(gasto)} de un tope de ${usd(tope)}` }, h('i', { class: gasto / tope >= 0.8 ? 'hz-alto' : '', style: `--w:${Math.min(100, (gasto / tope) * 100)}%` })))));

  const atajo = (href, ic, t, s) => h('a', { class: 'hz-btn', href }, h('i', { 'aria-hidden': 'true' }, ic), h('span', {}, h('b', {}, t), h('small', {}, s)));
  const fAt = ficha('Atajos', null, 'hz-f-at', h('div', { class: 'hz-ats' }, atajo('#/studio/ideas', '✦', 'Ideas', 'de contenido'), atajo('#/revenue/nuevo', '＋', 'Leads', 'nuevo lote'), atajo('#/sistemas', '⚙', 'Agente', 'construir'), atajo('#/studio/retencion', '◠', 'Retención', 'de un guion')));

  box.replaceChildren(fCiclo, fDec, fEnt, fRev, fAg, fAt);
  ajusta(); animar(box);
}
