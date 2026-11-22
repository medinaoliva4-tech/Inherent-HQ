// Modo rodaje (#/studio/rodaje): el día de grabación desde el teléfono. Lee el shot list del ciclo (entregable `shot-list-builder` de la
// marca y el mes) y muestra UNA escena a la vez, grande, con dos botones para el pulgar: «Grabada» y «Siguiente». El anillo dice cuántas
// van. Marcar guarda en el mismo entregable (estado 'grabada' | 'pendiente', como en el Shot List Builder). Sin shot list: lo dice.
import { api, toast, confirmAsk } from './core.js';
import { h } from './kit/dom.js';
import { cargarContexto, contextoLista, contextoActual } from './contexto.js';

const mesActual = () => new Date().toISOString().slice(0, 7);
const NS = 'http://www.w3.org/2000/svg';
const s = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); return e; };
function anillo(hechas, total) {
  const R = 42, C = 2 * Math.PI * R, p = total ? hechas / total : 0, svg = s('svg', { viewBox: '0 0 100 100', class: 'rj-anillo', role: 'img', 'aria-label': `${hechas} de ${total} escenas grabadas` });
  svg.append(s('circle', { cx: 50, cy: 50, r: R, class: 'rj-a-f' }), s('circle', { cx: 50, cy: 50, r: R, class: 'rj-a-v', 'stroke-dasharray': `${p * C} ${C}`, transform: 'rotate(-90 50 50)' }));
  const t = s('text', { x: 50, y: 50, 'text-anchor': 'middle', class: 'rj-a-n' }); t.textContent = `${hechas}/${total}`; const l = s('text', { x: 50, y: 66, 'text-anchor': 'middle', class: 'rj-a-l' }); l.textContent = 'grabadas';
  svg.append(t, l); return svg;
}

export async function pintarRodaje(box, { me }) {
  await cargarContexto(me).catch(() => null);
  const marcas = contextoLista().filter((c) => c.slug && c.slug !== 'personal');
  let slug = contextoActual(me) || marcas[0]?.slug || '', mes = mesActual(), ent = null, error = null, i = 0, filtro = '', guardando = false;
  const zona = h('div', { class: 'rj' }); box.replaceChildren(zona);
  const sel = h('select', { class: 'rj-sel', 'aria-label': 'Marca' }, marcas.map((c) => h('option', { value: c.slug, selected: c.slug === slug }, c.name || c.slug)));
  const mesIn = h('input', { class: 'rj-sel', type: 'month', value: mes, 'aria-label': 'Ciclo' });
  sel.addEventListener('change', () => { slug = sel.value; i = 0; cargar(); }); mesIn.addEventListener('change', () => { mes = mesIn.value || mesActual(); i = 0; cargar(); });

  async function cargar() {
    ent = null; error = null; pintar();
    if (!slug) { error = { message: 'Elige una marca' }; return pintar(); }
    try { const r = await api(`entregables?ws=production&slug=${encodeURIComponent(slug)}&tool=shot-list-builder&ciclo=${mes}`); ent = (r.items || []).find((d) => !d.archivado) || { vacio: true, alcance: r.alcance }; const k = (ent.contenido?.escenas || []).findIndex((e) => e.estado !== 'grabada'); i = k >= 0 ? k : 0; }
    catch (e) { error = e; }
    pintar();
  }
  const escenas = () => (ent?.contenido?.escenas || []).filter((e) => !filtro || (e.lugar || 'Sin locación') === filtro);
  async function marcar(e, estado) {
    if (guardando) return;
    // Un shot list aprobado vuelve a borrador si cambia su contenido (así lo cuida el servidor): se pregunta una vez antes.
    if (['Aprobado', 'Entregado'].includes(ent.estado) && !(await confirmAsk('Este shot list está aprobado. Marcar escenas lo regresa a borrador (vuelve a pedir aprobación). ¿Seguimos?'))) return;
    guardando = true;
    const todas = ent.contenido.escenas.map((x) => (x.id === e.id ? { ...x, estado } : x));
    try { const r = await api(`entregables/${encodeURIComponent(ent.id)}`, { method: 'PUT', body: { v: ent.v, contenido: { ...ent.contenido, escenas: todas } } }); ent = r.id ? r : { ...ent, v: (ent.v || 0) + 1, contenido: { ...ent.contenido, escenas: todas } }; if (estado === 'grabada') { navigator.vibrate?.(15); const l = escenas(); const sig = l.findIndex((x, k) => k > i && x.estado !== 'grabada'); if (sig >= 0) i = sig; } }
    catch (x) { toast(x.message || 'No se pudo guardar', true); await cargar(); }
    guardando = false; pintar();
  }

  function pintar() {
    const top = h('div', { class: 'rj-top' }, sel, mesIn);
    if (error) return zona.replaceChildren(top, h('div', { class: 'rj-vacio' }, h('b', {}, 'No pude leer el shot list'), h('p', {}, error.message || ''), h('button', { type: 'button', class: 'btn ghost', onClick: cargar }, 'Reintentar')));
    if (!ent) return zona.replaceChildren(top, h('div', { class: 'rj-esq', 'aria-busy': 'true' }));
    const todas = ent.contenido?.escenas || [];
    if (ent.vacio || !todas.length) return zona.replaceChildren(top, h('div', { class: 'rj-vacio' }, h('b', {}, 'Sin shot list para este ciclo'), h('p', {}, ent.alcance && ent.alcance.abierto === false ? ent.alcance.texto || 'Esta marca no tiene abierto el shot list.' : 'Se arma desde Ideas de contenido («+ al shot list») o en el Shot List Builder de Producción.'), h('a', { class: 'btn', href: '#/studio/ideas' }, 'Ir a Ideas de contenido')));
    const lugares = [...new Set(todas.map((e) => e.lugar || 'Sin locación'))], l = escenas(); i = Math.min(i, Math.max(0, l.length - 1));
    const e = l[i], hechas = todas.filter((x) => x.estado === 'grabada').length, lista = l.filter((x) => x.estado !== 'grabada');
    const chips = lugares.length > 1 ? h('div', { class: 'rj-chips' }, ['', ...lugares].map((x) => { const b = h('button', { type: 'button', class: `rj-chip${filtro === x ? ' on' : ''}` }, x || 'Todas'); b.addEventListener('click', () => { filtro = x; i = 0; pintar(); }); return b; })) : '';
    const hecha = e?.estado === 'grabada';
    const bGrab = h('button', { type: 'button', class: `rj-b rj-b-ok${hecha ? ' on' : ''}`, disabled: guardando }, hecha ? '↺ Deshacer' : '✓ Grabada'); bGrab.addEventListener('click', () => marcar(e, hecha ? 'pendiente' : 'grabada'));
    const bAnt = h('button', { type: 'button', class: 'rj-b rj-b-n', disabled: i === 0, 'aria-label': 'Escena anterior' }, '←'); bAnt.addEventListener('click', () => { i--; pintar(); });
    const bSig = h('button', { type: 'button', class: 'rj-b rj-b-n', disabled: i >= l.length - 1, 'aria-label': 'Escena siguiente' }, '→'); bSig.addEventListener('click', () => { i++; pintar(); });
    const dato = (k, v) => (v ? h('div', {}, h('small', {}, k), h('b', {}, v)) : '');
    zona.replaceChildren(top,
      h('div', { class: 'rj-cab' }, anillo(hechas, todas.length), h('div', {}, h('b', {}, hechas === todas.length ? '¡Todo grabado!' : `Faltan ${todas.length - hechas}`), h('small', {}, `${ent.titulo || 'Shot list'} · ${lista.length} pendientes aquí`))),
      chips,
      e ? h('article', { class: `rj-esc${hecha ? ' rj-hecha' : ''}`, 'aria-live': 'polite' }, h('header', {}, h('span', { class: 'rj-id' }, e.id), h('small', {}, `${i + 1} de ${l.length}`)),
        h('h2', {}, e.escena || e.pieza || 'Escena'), e.pieza && e.escena ? h('p', { class: 'rj-pieza' }, e.pieza) : '', e.accion ? h('p', { class: 'rj-acc' }, e.accion) : '',
        h('div', { class: 'rj-datos' }, dato('Plano', e.plano), dato('Duración', e.duracion_s != null ? `${e.duracion_s} s` : ''), dato('Locación', e.lugar), dato('Talento', e.talento), dato('Setup', e.setup), dato('Producto', e.producto)),
        e.riesgo ? h('p', { class: 'rj-riesgo' }, '⚠ ', e.riesgo) : '') : h('div', { class: 'rj-vacio' }, h('b', {}, 'Nada en esta locación')),
      h('div', { class: 'rj-pulgar' }, bAnt, bGrab, bSig),
      h('ol', { class: 'rj-lista', 'aria-label': 'Todas las escenas' }, l.map((x, k) => { const b = h('button', { type: 'button', class: `${k === i ? 'on' : ''}${x.estado === 'grabada' ? ' ok' : ''}`, 'aria-label': `${x.id} ${x.escena || ''}${x.estado === 'grabada' ? ' · grabada' : ''}` }, h('i', { 'aria-hidden': 'true' }, x.estado === 'grabada' ? '✓' : ''), h('span', {}, x.id), h('small', {}, x.escena || x.pieza || '')); b.addEventListener('click', () => { i = k; pintar(); }); return h('li', {}, b); })));
  }
  pintar(); await cargar();
}
