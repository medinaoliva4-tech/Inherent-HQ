// Presentación del día 20 (#/studio/presentacion): lo APROBADO del ciclo de una marca, a pantalla completa, un slide por pieza.
// Sale del hilo del cliente (nodos con conocimiento «aprobado») y de cada entregable de ese mes (GET /api/entregables/:id).
// El cliente nunca ve costos ni horas: del contenido se muestran solo nombres y conteos, y cualquier campo de costo, precio, margen,
// tarifa u hora se salta. Sin piezas aprobadas en el mes: lo dice (no se arma una presentación vacía).
import { api } from './core.js';
import { h } from './kit/dom.js';
import { cargarContexto, contextoLista, contextoActual } from './contexto.js';
import { herramientaDe, WORKSPACES } from './herramientas.js';

const PROHIBIDO = /cost|precio|margen|tarifa|hora|presupuesto|fee|pago|factur|interno|nota_interna/i;
const ETIQUETA = ['titulo', 'nombre', 'gancho', 'hook', 'escena', 'pieza', 'idea', 'texto', 'label'];
const mesActual = () => new Date().toISOString().slice(0, 7);
const mesNombre = (m) => { const d = new Date(`${m}-15T12:00`); return Number.isNaN(d.getTime()) ? m : d.toLocaleDateString('es', { month: 'long', year: 'numeric' }); };
// Lo visible de un contenido: hasta 2 listas (con su cuenta y 5 nombres) y una frase. Nunca un campo prohibido.
export function vistaDe(contenido) {
  const out = { listas: [], frase: '' }; if (!contenido || typeof contenido !== 'object') return out;
  for (const [k, v] of Object.entries(contenido)) {
    if (PROHIBIDO.test(k)) continue;
    if (Array.isArray(v) && v.length && out.listas.length < 2) {
      const nombres = v.map((x) => (typeof x === 'string' ? x : ETIQUETA.map((e) => x?.[e]).find((y) => typeof y === 'string' && y.trim()))).filter(Boolean).slice(0, 5);
      out.listas.push({ k: k.replace(/_/g, ' '), n: v.length, nombres });
    } else if (!out.frase && typeof v === 'string' && v.trim().length > 12 && /resumen|objetivo|idea|mensaje|descripcion|promesa|concepto/i.test(k)) out.frase = v.trim().slice(0, 220);
  }
  return out;
}

export async function pintarPresentacion(box, { me }) {
  await cargarContexto(me).catch(() => null);
  const marcas = contextoLista().filter((c) => c.slug && c.slug !== 'personal');
  let slug = contextoActual(me) || marcas[0]?.slug || '', mes = mesActual(), piezas = null, error = null;
  const zona = h('div', { class: 'pz-pre' }); box.replaceChildren(zona);
  const nombreMarca = () => marcas.find((c) => c.slug === slug)?.name || slug;
  const sel = h('select', { class: 'rj-sel', 'aria-label': 'Marca' }, marcas.map((c) => h('option', { value: c.slug, selected: c.slug === slug }, c.name || c.slug)));
  const mesIn = h('input', { class: 'rj-sel', type: 'month', value: mes, 'aria-label': 'Ciclo' });
  sel.addEventListener('change', () => { slug = sel.value; cargar(); }); mesIn.addEventListener('change', () => { mes = mesIn.value || mesActual(); cargar(); });

  async function cargar() {
    piezas = null; error = null; pintar();
    try {
      const hilo = await api(`hilo?slug=${encodeURIComponent(slug)}`), ok = (hilo.nodes || []).filter((n) => n.conocimiento === 'aprobado');
      const docs = (await Promise.all(ok.map((n) => api(`entregables/${encodeURIComponent(n.id)}`).catch(() => null)))).filter((d) => d && d.ciclo === mes && !d.archivado);
      piezas = docs.map((d) => ({ id: d.id, titulo: d.titulo || herramientaDe(d.tool)?.nombre || d.tool, herramienta: herramientaDe(d.tool)?.nombre || d.tool, area: WORKSPACES.find((w) => w.id === d.ws), version: d.version || 1, vista: vistaDe(d.contenido) }));
    } catch (e) { error = e; }
    pintar();
  }

  // ---- A pantalla completa: portada, una pieza por slide, cierre. ←/→, tocar a la derecha o izquierda, Esc sale. ----
  function presentar(desde = 0) {
    const slides = [{ tipo: 'portada' }, ...piezas.map((p) => ({ tipo: 'pieza', p })), { tipo: 'cierre' }];
    let k = desde; const capa = h('div', { class: 'pz', role: 'region', 'aria-label': 'Presentación', tabindex: '-1' }), lienzo = h('div', { class: 'pz-s', 'aria-live': 'polite' }), puntos = h('div', { class: 'pz-dots' });
    const slide = (x) => {
      if (x.tipo === 'portada') return h('div', { class: 'pz-portada' }, h('small', {}, 'Presentación del ciclo'), h('h1', {}, nombreMarca()), h('p', {}, mesNombre(mes)), h('b', { class: 'pz-n' }, `${piezas.length} ${piezas.length === 1 ? 'pieza aprobada' : 'piezas aprobadas'}`));
      if (x.tipo === 'cierre') return h('div', { class: 'pz-portada' }, h('small', {}, 'Siguiente paso'), h('h1', {}, 'Lo presentado se publica desde el día 1'), h('p', {}, `${nombreMarca()} · ${mesNombre(mes)}`));
      const p = x.p;
      return h('div', { class: 'pz-pieza', style: p.area ? `--ac:var(${p.area.color})` : '' }, h('small', { class: 'pz-area' }, p.area?.nombre || '', ' · ', p.herramienta), h('h2', {}, p.titulo),
        p.vista.frase ? h('p', { class: 'pz-frase' }, p.vista.frase) : '',
        h('div', { class: 'pz-listas' }, p.vista.listas.map((l) => h('section', {}, h('b', { class: 'pz-big' }, String(l.n)), h('span', {}, l.k), h('ul', {}, l.nombres.map((n) => h('li', {}, n)))))),
        h('p', { class: 'pz-ok' }, '✓ Aprobado · versión ', String(p.version)));
    };
    const ir = (n) => { k = Math.max(0, Math.min(slides.length - 1, n)); lienzo.replaceChildren(slide(slides[k])); lienzo.classList.remove('pz-in'); void lienzo.offsetWidth; lienzo.classList.add('pz-in'); puntos.replaceChildren(...slides.map((_, j) => h('i', { class: j === k ? 'on' : '' }))); };
    const salir = () => { document.removeEventListener('keydown', tecla, true); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); capa.remove(); };
    const tecla = (e) => { if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); ir(k + 1); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ir(k - 1); } else if (e.key === 'Escape') { e.preventDefault(); salir(); } };
    const x = h('button', { type: 'button', class: 'pz-x', 'aria-label': 'Salir de la presentación' }, '×'); x.addEventListener('click', (e) => { e.stopPropagation(); salir(); });
    const ant = h('button', { type: 'button', class: 'pz-nav pz-ant', 'aria-label': 'Anterior' }, '‹'), sig = h('button', { type: 'button', class: 'pz-nav pz-sig', 'aria-label': 'Siguiente' }, '›');
    ant.addEventListener('click', (e) => { e.stopPropagation(); ir(k - 1); }); sig.addEventListener('click', (e) => { e.stopPropagation(); ir(k + 1); });
    capa.addEventListener('click', (e) => { if (e.target.closest('button')) return; ir(k + (e.clientX > innerWidth / 2 ? 1 : -1)); });
    capa.append(lienzo, ant, sig, puntos, x); document.body.append(capa); document.addEventListener('keydown', tecla, true);
    capa.requestFullscreen?.().catch(() => {}); capa.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && capa.isConnected && innerWidth > 760) { /* sale del modo completo: la capa sigue hasta Esc o × */ } });
    capa.focus(); ir(k);
  }

  function pintar() {
    const top = h('div', { class: 'rj-top' }, sel, mesIn);
    if (error) return zona.replaceChildren(top, h('div', { class: 'rj-vacio' }, h('b', {}, 'No pude leer lo aprobado'), h('p', {}, error.message || ''), h('button', { type: 'button', class: 'btn ghost', onClick: cargar }, 'Reintentar')));
    if (!piezas) return zona.replaceChildren(top, h('div', { class: 'rj-esq', 'aria-busy': 'true' }));
    if (!piezas.length) return zona.replaceChildren(top, h('div', { class: 'rj-vacio' }, h('b', {}, `Sin piezas aprobadas en ${mesNombre(mes)}`), h('p', {}, 'Aquí aparece lo aprobado del ciclo de esta marca. Sin datos, no hay presentación.')));
    const go = h('button', { type: 'button', class: 'btn pz-go' }, '▶ Presentar'); go.addEventListener('click', () => presentar(0));
    zona.replaceChildren(top,
      h('div', { class: 'pz-hero' }, h('div', {}, h('small', {}, mesNombre(mes)), h('h2', {}, nombreMarca()), h('p', {}, `${piezas.length} ${piezas.length === 1 ? 'pieza aprobada' : 'piezas aprobadas'} · sin costos ni horas`)), go),
      h('div', { class: 'pz-mini' }, piezas.map((p, j) => { const b = h('button', { type: 'button', class: 'pz-m', style: p.area ? `--ac:var(${p.area.color})` : '' }, h('small', {}, p.area?.nombre || ''), h('b', {}, p.titulo), h('span', {}, p.herramienta)); b.addEventListener('click', () => presentar(j + 1)); return b; })));
  }
  pintar(); if (slug) await cargar(); else { error = { message: 'Elige una marca' }; pintar(); }
}
