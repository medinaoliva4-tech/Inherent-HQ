// Hoy · el tablero: TODO lo importante en UNA vista (sin scroll), en gráficos y con botones. Seis fichas:
// el ciclo (anillo del día 1 al 20 con los hitos 11 y 20), lo que te necesita, entregables por estado, el embudo de Revenue,
// tus agentes y atajos. Cada número viene de los datos reales; sin dato dice «Sin datos», nunca un 0 inventado.
import { api } from '../core.js';
import { h } from '../kit/dom.js';
import { cicloDe, DIAS_CICLO, HITOS } from '../ciclo.js';
import { seleccion } from '../decide.js';
import { cargarContexto, contextoLista, contextoActual } from '../contexto.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...hijos) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); n.append(...hijos.flat().filter(Boolean)); return n; };
const ficha = (titulo, href, ...hijos) => h(href ? 'a' : 'div', { class: 'tb-f', ...(href ? { href } : {}) }, h('header', {}, h('span', {}, titulo), href ? h('i', { 'aria-hidden': 'true' }, '→') : ''), ...hijos);
const sinDatos = (t = 'Sin datos') => h('p', { class: 'tb-nd' }, t);

// Anillo del ciclo: 20 marcas (una por día), las del día actual hacia atrás llenas; los hitos 11 y 20 más largos.
export function anilloCiclo(c) {
  const R = 46, cx = 60, cy = 60, d = Math.min(c.dia, DIAS_CICLO), partes = [];
  for (let i = 1; i <= DIAS_CICLO; i++) {
    const a = ((i - 1) / DIAS_CICLO) * 2 * Math.PI - Math.PI / 2, hito = HITOS.includes(i), r1 = R - (hito ? 9 : 5), r2 = R + (hito ? 6 : 3);
    partes.push(svg('line', { x1: cx + r1 * Math.cos(a), y1: cy + r1 * Math.sin(a), x2: cx + r2 * Math.cos(a), y2: cy + r2 * Math.sin(a), class: `tb-m${c.enCiclo && i <= d ? ' on' : ''}${hito ? ' hito' : ''}` }));
  }
  return svg('svg', { viewBox: '0 0 120 120', class: 'tb-ciclo', role: 'img', 'aria-label': c.enCiclo ? `Día ${c.dia} de 20` : `Fuera del ciclo: faltan ${c.diasAlHito} días` }, ...partes,
    svg('text', { x: cx, y: cy + 2, 'text-anchor': 'middle', class: 'tb-c-n' }, String(c.dia)), svg('text', { x: cx, y: cy + 16, 'text-anchor': 'middle', class: 'tb-c-l' }, c.enCiclo ? 'de 20' : 'del mes'));
}
const ESTADOS = ['Borrador', 'En revisión', 'Aprobado', 'Entregado'];
// Barra apilada por estado (proporciones reales; si no hay entregables, lo dice).
export function barraEstados(items) {
  const n = ESTADOS.map((e) => items.filter((x) => x.estado === e).length), total = n.reduce((a, b) => a + b, 0);
  if (!total) return sinDatos('Aún no hay entregables');
  return h('div', { class: 'tb-est' }, h('div', { class: 'tb-pila', role: 'img', 'aria-label': ESTADOS.map((e, i) => `${e}: ${n[i]}`).join(', ') }, n.map((v, i) => v ? h('i', { class: `tb-s${i}`, style: `flex:${v}` }) : null)),
    h('ul', {}, ESTADOS.map((e, i) => h('li', {}, h('i', { class: `tb-s${i}` }), `${e} `, h('b', {}, String(n[i]))))));
}
const barras = (filas) => { const max = Math.max(1, ...filas.map((f) => f[1])); return h('div', { class: 'tb-emb' }, filas.map(([n, v], i) => h('div', {}, h('span', {}, n), h('span', { class: 'tb-bb' }, h('i', { class: `tb-e${i}`, style: `width:${Math.max(v ? 6 : 0, (v / max) * 100)}%` })), h('b', {}, String(v))))); };

export async function pintarTablero(box, { me }) {
  // Cabe en la vista: toma lo que queda de pantalla desde donde empieza (mínimo 300 px).
  const ajusta = () => { if (box.isConnected) box.style.height = `${Math.max(300, Math.floor(window.innerHeight - box.getBoundingClientRect().top - 16))}px`; };
  if (!window.matchMedia('(max-width:760px)').matches) { ajusta(); window.addEventListener('resize', ajusta, { passive: true }); }
  const hoy = new Date().toISOString().slice(0, 10), c = cicloDe(hoy);
  // Los entregables son por cliente: se toma el cliente que estás viendo (el hilo trae todos sus nodos con su estado).
  await cargarContexto(me).catch(() => null);
  const marca = contextoActual(me) || contextoLista().find((x) => x.slug && x.slug !== 'personal')?.slug || '';
  const [dec, ent, lot, ag] = await Promise.all([api('decide'), marca ? api(`hilo?slug=${encodeURIComponent(marca)}`) : Promise.resolve(null), api('revenue/lotes'), api('sistemas/agentes')].map((p) => p.catch(() => null)));
  const sel = dec ? seleccion(dec.items || [], { movil: false }) : null, items = ent?.nodes || [], lotes = lot?.lotes || null, agentes = ag?.agentes || null;
  const nDec = sel ? sel.visibles.length + (sel.resto || 0) : null;
  const leads = lotes ? lotes.reduce((s, l) => s + (l.resumen?.total || 0), 0) : null, encajan = lotes ? lotes.reduce((s, l) => s + (l.resumen?.escribir || 0), 0) : null;
  box.replaceChildren(
    ficha('Ciclo', '#/calendario/contenido', h('div', { class: 'tb-fila' }, anilloCiclo(c), h('div', { class: 'tb-t' }, h('b', {}, c.fase?.nombre || ''), h('small', {}, c.enCiclo ? (c.hito ? `Hoy es el día ${c.hito}` : `Próximo hito: día ${c.proximoHito}`) : `Faltan ${c.diasAlHito} días para el día 11`)))),
    ficha('Te necesita', '#/decide', nDec == null ? sinDatos() : h('div', { class: 'tb-fila' }, h('span', { class: 'tb-big' }, String(nDec)), h('ul', { class: 'tb-lis' }, nDec ? sel.visibles.slice(0, 3).map((x) => h('li', {}, x.titulo)) : [h('li', {}, 'Nada espera por ti')]))),
    ficha(marca ? `Entregables · ${marca}` : 'Entregables', marca ? `#/ws/${'marketing'}` : null, ent ? barraEstados(items) : sinDatos()),
    ficha('Revenue', '#/revenue', leads == null ? sinDatos() : leads ? barras([['Leads', leads], ['Encajan', encajan], ['Lotes', lotes.length]]) : sinDatos('Aún no hay lotes')),
    ficha('Agentes', '#/sistemas', agentes == null ? sinDatos() : h('div', { class: 'tb-fila' }, h('span', { class: 'tb-big' }, String(agentes.length)), h('div', { class: 'tb-t' }, h('b', {}, `${agentes.filter((a) => a.estado === 'activo').length} activos`), h('small', {}, agentes.length ? 'Cada uno con su tope de costo' : 'Empieza con una plantilla')))),
    h('div', { class: 'tb-f tb-at' }, h('header', {}, h('span', {}, 'Atajos')), h('a', { class: 'tb-btn', href: '#/studio/ideas' }, '✦ Ideas de contenido'), h('a', { class: 'tb-btn', href: '#/revenue/nuevo' }, '＋ Nuevo lote de leads'), h('a', { class: 'tb-btn', href: '#/sistemas' }, '⚙ Construir un agente')));
}
