// Opportunity Map (herramienta opportunity-map de Strategy), vista del Tool Shell: el 2×2 impacto vs dificultad (burbuja = costo, color =
// confianza; arrastra una burbuja para re-puntuar), el ranking con pesos visibles (cambiar un puntaje reordena al instante), comparar, elegir o
// descartar, mandar lo elegido al Roadmap y convertirlo en tareas. Lo FUERA DEL ALCANCE no se elige ni se envía: se escala al CEO.
// El shell guarda, versiona y aprueba; aquí solo se edita el contenido. Pinta con html`…` (todo se escapa; nada de modelo entra a raw()).
import { html, raw, mount, api, col, ico, toast, confirmAsk, ask, $ } from '../core.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { AREAS_RM_INFO, TRIMESTRES, TRIMESTRE_NOMBRE, limpiarItems } from './roadmap.js';
import { PUNTAJES, PESO_MAX, FORMULA, ESTADOS, CUADRANTES, limpiar, vacio, nuevoItem, ranking, cuadrante, puedeEnviar, puedeElegir, aRoadmap, tareasDe, puntajesFaltan, resumenTexto, MAX_ITEMS } from './oportunidades.js';

const enc = encodeURIComponent;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const NIVELES = [1, 2, 3, 4, 5];
const PASOS_PESO = [0, 0.5, 1, 1.5, 2, 2.5, 3];
// El lienzo del 2×2 (dificultad en x, impacto en y; arriba y a la izquierda = lo mejor).
const W = 420, H = 330, X0 = 44, X1 = 400, Y0 = 18, Y1 = 290;
const px = (d) => X0 + ((d - 1) / 4) * (X1 - X0), py = (i) => Y0 + ((5 - i) / 4) * (Y1 - Y0);
const NOMBRE_ESTADO = Object.fromEntries(ESTADOS.map((e) => [e.id, e.nombre]));

function pintarOportunidades(el, { contenido, editable: ed = false, onCambio, me, slug } = {}) {
  const c = limpiar(JSON.parse(JSON.stringify(contenido && typeof contenido === 'object' ? contenido : vacio())));
  const S = { cmp: new Set(), ocupado: false };
  const puedeTareas = Boolean(me?.areas?.includes('work') || me?.areas?.includes('operations'));
  const sale = () => limpiar(JSON.parse(JSON.stringify(c)));
  const cambio = () => { if (typeof onCambio === 'function') onCambio(sale()); };
  const item = (id) => c.items.find((x) => x.id === id);

  mount(el, html`<div class="om" data-editable="${ed ? 1 : 0}"><div class="om-bar" id="om-bar"></div>
    <section class="om-sec om-top"><div id="om-2x2"></div><div id="om-pesos"></div></section>
    <section class="om-sec"><h3>Ranking</h3><div id="om-lista"></div></section><section class="om-sec" id="om-cmp"></section></div>`);
  const root = el.firstElementChild, cache = new WeakMap();
  const poner = (id, contenidoHtml) => { const n = $(`#${id}`, root); if (!n) return; const s = String(contenidoHtml); if (cache.get(n) !== s) { cache.set(n, s); mount(n, contenidoHtml); } };

  // ---------- Barra: agregar, enviar, tareas ----------
  function barra() {
    const r = ranking(c), envia = r.filter(puedeEnviar).length, fuera = r.filter((x) => x.fuera_alcance).length, elegidas = r.filter((x) => ['elegida', 'enviada'].includes(x.estado) && !x.fuera_alcance).length;
    poner('om-bar', html`<div class="om-acts">${ed ? html`<button type="button" class="btn sm" data-act="om-mas" ${c.items.length >= MAX_ITEMS || S.ocupado ? raw('disabled') : ''}>${ico('plus', 14)} Agregar oportunidad</button>` : ''}
      ${ed ? html`<button type="button" class="btn ghost sm" data-act="om-roadmap" ${envia && !S.ocupado ? '' : raw('disabled')} title="${envia ? '' : 'Elige una oportunidad dentro del alcance'}">${ico('arrow-right', 14)} Enviar al Roadmap${envia ? ` (${envia})` : ''}</button>` : ''}
      ${puedeTareas ? html`<button type="button" class="btn ghost sm" data-act="om-tareas" ${elegidas && !S.ocupado ? '' : raw('disabled')}>${ico('list-checks', 14)} Convertir en tareas${elegidas ? ` (${elegidas})` : ''}</button>` : ''}</div>
      ${fuera ? html`<p class="om-fuera" role="status">${ico('lock', 14)} ${plural(fuera, 'oportunidad está', 'oportunidades están')} FUERA DEL ALCANCE contratado: no se envían al Roadmap y se escalan al CEO.</p>` : ''}`);
  }

  // ---------- El 2×2 ----------
  function matriz() {
    const r = ranking(c).filter((x) => x.estado !== 'descartada' && cuadrante(x)), vistos = new Map();
    const puestos = r.map((x) => { const k = `${x.impacto}-${x.dificultad}`, n = vistos.get(k) || 0; vistos.set(k, n + 1); return { x, n }; });
    const sin = ranking(c).filter((x) => x.estado !== 'descartada' && !cuadrante(x)).length;
    const mitad = (px(3) + 0), mitadY = py(3);
    poner('om-2x2', html`<div class="om-mx"><h3>Impacto vs dificultad</h3>
      <svg class="om-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Matriz de impacto contra dificultad: ${plural(puestos.length, 'oportunidad', 'oportunidades')}">
        <rect class="om-q om-q-rapida" x="${X0 - 12}" y="${Y0 - 10}" width="${mitad - X0 + 12}" height="${mitadY - Y0 + 10}"/><rect class="om-q om-q-apuesta" x="${mitad}" y="${Y0 - 10}" width="${X1 - mitad + 12}" height="${mitadY - Y0 + 10}"/>
        <rect class="om-q om-q-relleno" x="${X0 - 12}" y="${mitadY}" width="${mitad - X0 + 12}" height="${Y1 - mitadY + 12}"/><rect class="om-q om-q-evitar" x="${mitad}" y="${mitadY}" width="${X1 - mitad + 12}" height="${Y1 - mitadY + 12}"/>
        ${CUADRANTES.map((q) => html`<text class="om-ql" x="${q.id === 'rapida' || q.id === 'relleno' ? X0 - 6 : X1 + 6}" y="${q.id === 'rapida' || q.id === 'apuesta' ? Y0 + 4 : Y1 + 6}" text-anchor="${q.id === 'rapida' || q.id === 'relleno' ? 'start' : 'end'}">${q.nombre}</text>`)}
        ${NIVELES.map((n) => html`<text class="om-ax" x="${px(n)}" y="${H - 22}" text-anchor="middle">${n}</text><text class="om-ax" x="${X0 - 22}" y="${py(n) + 4}" text-anchor="middle">${n}</text>`)}
        <text class="om-ax" x="${(X0 + X1) / 2}" y="${H - 6}" text-anchor="middle">Dificultad →</text><text class="om-ax" x="12" y="${(Y0 + Y1) / 2}" text-anchor="middle" transform="rotate(-90 12 ${(Y0 + Y1) / 2})">Impacto →</text>
        ${puestos.map(({ x, n }) => html`<g class="om-b" data-id="${x.id}" data-conf="${x.confianza ?? 0}" data-fuera="${x.fuera_alcance ? 1 : 0}" ${ed ? raw('tabindex="0"') : ''}><title>${x.titulo} · impacto ${x.impacto}, dificultad ${x.dificultad}, costo ${x.costo ?? SIN_DATOS}, confianza ${x.confianza ?? SIN_DATOS}</title>
          <circle cx="${px(x.dificultad) + ((n % 3) - 1) * 12}" cy="${py(x.impacto) + (Math.floor(n / 3) % 3 - 1) * 12}" r="${x.costo == null ? 11 : 6 + x.costo * 2.6}" data-sin="${x.costo == null ? 1 : 0}"/></g>`)}
      </svg>
      <div class="om-lg" aria-label="Leyenda"><span>Tamaño = costo</span><span class="om-lg-c">Color = confianza <i data-conf="1"></i><i data-conf="2"></i><i data-conf="3"></i><i data-conf="4"></i><i data-conf="5"></i></span>${ed ? html`<span>Arrastra una burbuja para re-puntuar</span>` : ''}</div>
      ${sin ? html`<p class="om-sd">${plural(sin, 'oportunidad sin ubicar', 'oportunidades sin ubicar')}: ${SIN_DATOS} de impacto o dificultad (sale de la evidencia del cliente).</p>` : ''}</div>`);
  }

  // ---------- Los pesos ----------
  function pesos() {
    poner('om-pesos', html`<div class="om-ps"><h3>Cómo se ordena</h3><p class="om-fm"><b>${FORMULA}</b></p>
      <div class="om-pw">${PUNTAJES.map((p) => html`<label class="om-p" data-sube="${p.sube ? 1 : 0}"><span>${p.nombre} ${p.sube ? '↑' : '↓'}</span><select class="in" data-peso="${p.id}" aria-label="Peso de ${p.nombre}" ${ed ? '' : raw('disabled')}>${PASOS_PESO.map((v) => html`<option value="${v}" ${v === c.pesos[p.id] ? raw('selected') : ''}>${v === 1 ? '1 (normal)' : v}</option>`)}</select></label>`)}</div>
      <p class="mut sm">El peso es el exponente de cada puntaje (máximo ${PESO_MAX}). Impacto y confianza suben el ranking; dificultad, costo y tiempo lo bajan. Costo y tiempo: 1 es barato y rápido, 5 caro y lento.</p></div>`);
  }

  // ---------- La lista ordenada ----------
  const sel = (x, p) => html`<label class="om-s"><span>${p.nombre}</span><select class="in" data-f="${p.id}" data-id="${x.id}" aria-label="${p.nombre} de ${x.titulo}" ${ed ? '' : raw('disabled')}><option value="">—</option>${NIVELES.map((n) => html`<option value="${n}" ${n === x[p.id] ? raw('selected') : ''}>${n}</option>`)}</select></label>`;
  function fila(x) {
    const falta = puntajesFaltan(x), cu = cuadrante(x);
    return html`<li class="om-it" data-id="${x.id}" data-estado="${x.estado}" data-fuera="${x.fuera_alcance ? 1 : 0}">
      <div class="om-it-h"><span class="om-n" aria-label="Lugar">${x.n ?? '—'}</span>${ed ? html`<input class="in om-t" type="text" data-f="titulo" data-id="${x.id}" maxlength="160" value="${x.titulo}" aria-label="Oportunidad" autocomplete="off">` : html`<b class="om-t">${x.titulo}</b>`}
        <span class="om-r" title="${FORMULA}">${x.ranking == null ? html`<span class="om-sd">${SIN_DATOS}</span>` : x.ranking}</span></div>
      <div class="om-it-m"><span class="chip sm2" title="De dónde viene">${x.origen}</span><span class="chip sm2" data-e="${x.estado}">${x.fuera_alcance ? 'FUERA DEL ALCANCE' : NOMBRE_ESTADO[x.estado]}</span>${cu ? html`<span class="chip sm2">${CUADRANTES.find((q) => q.id === cu).nombre}</span>` : ''}</div>
      <div class="om-ps5">${PUNTAJES.map((p) => sel(x, p))}</div>
      ${falta.length ? html`<p class="om-sd">${SIN_DATOS}: falta ${falta.map((k) => PUNTAJES.find((p) => p.id === k).nombre.toLowerCase()).join(', ')}. Sale de la evidencia del cliente o de su CRM.</p>` : ''}
      ${ed ? html`<input class="in om-ev" type="text" data-f="evidencia" data-id="${x.id}" maxlength="400" value="${x.evidencia}" placeholder="Evidencia: la razón de los puntajes y su fuente" aria-label="Evidencia de ${x.titulo}" autocomplete="off">` : x.evidencia ? html`<p class="om-evt">${x.evidencia}</p>` : html`<p class="om-sd">${SIN_DATOS}: falta la evidencia</p>`}
      ${x.fuera_alcance ? html`<p class="om-fuera sm">${ico('lock', 14)} Fuera del alcance contratado: no se envía al Roadmap. Escálalo al CEO.</p>` : ''}
      <div class="om-it-a">${ed ? html`<label class="sw-row"><input type="checkbox" class="switch" data-f="fuera_alcance" data-id="${x.id}" ${x.fuera_alcance ? raw('checked') : ''}> Fuera del alcance</label>` : ''}
        ${ed && puedeElegir(x) && x.estado !== 'elegida' ? html`<button type="button" class="btn ghost xs" data-act="om-elegir" data-id="${x.id}">${ico('check', 14)} Elegir</button>` : ''}
        ${ed && x.estado === 'elegida' ? html`<button type="button" class="btn ghost xs" data-act="om-quitar-eleccion" data-id="${x.id}">Quitar elección</button>` : ''}
        ${ed && x.estado !== 'descartada' && x.estado !== 'enviada' ? html`<button type="button" class="btn ghost xs" data-act="om-descartar" data-id="${x.id}">${ico('x', 14)} Descartar</button>` : ''}
        ${ed && x.estado === 'descartada' ? html`<button type="button" class="btn ghost xs" data-act="om-reabrir" data-id="${x.id}">${ico('refresh-cw', 14)} Reabrir</button>` : ''}
        <label class="om-ck"><input type="checkbox" data-cmp="${x.id}" ${S.cmp.has(x.id) ? raw('checked') : ''}> Comparar</label></div></li>`;
  }
  const enfocado = () => { const a = document.activeElement; return a && root.contains(a) && a.dataset?.id && a.dataset?.f ? [a.dataset.id, a.dataset.f] : null; };
  function lista() {
    const r = ranking(c), f = enfocado();
    poner('om-lista', r.length ? html`<ol class="om-ls">${r.map(fila)}</ol>` : html`<p class="om-sd">${SIN_DATOS}: todavía no hay oportunidades. Salen de «Generar con IA», de los cuellos del Commercial Diagnosis o de agregarlas aquí.</p>`);
    if (f) $(`[data-id="${f[0]}"][data-f="${f[1]}"]`, root)?.focus();
  }
  function comparar() {
    const xs = ranking(c).filter((x) => S.cmp.has(x.id));
    poner('om-cmp', xs.length < 2 ? '' : html`<h3>Comparar</h3><div class="om-cmp-w"><table class="om-cmp" aria-label="Comparación de oportunidades"><thead><tr><th scope="col"></th>${xs.map((x) => html`<th scope="col">${x.titulo}</th>`)}</tr></thead><tbody>
      <tr><th scope="row">Ranking</th>${xs.map((x) => html`<td>${x.ranking ?? SIN_DATOS}</td>`)}</tr>${PUNTAJES.map((p) => html`<tr><th scope="row">${p.nombre}</th>${xs.map((x) => html`<td>${x[p.id] ?? SIN_DATOS}</td>`)}</tr>`)}
      <tr><th scope="row">Origen</th>${xs.map((x) => html`<td>${x.origen}</td>`)}</tr><tr><th scope="row">Estado</th>${xs.map((x) => html`<td>${x.fuera_alcance ? 'FUERA DEL ALCANCE' : NOMBRE_ESTADO[x.estado]}</td>`)}</tr></tbody></table></div>`);
  }
  const todo = () => { barra(); matriz(); pesos(); lista(); comparar(); };
  todo();

  // ---------- Editar ----------
  const poneEstado = (id, estado) => { const x = item(id); if (!x) return; if (x.fuera_alcance && ['elegida', 'enviada'].includes(estado)) return toast('Lo FUERA DEL ALCANCE no se elige: escálalo al CEO.', true); x.estado = estado; cambio(); todo(); };
  async function agregar() {
    if (!ed || c.items.length >= MAX_ITEMS) return;
    const v = await ask('Agregar oportunidad', [{ k: 'titulo', t: 'text', req: true, l: 'Un resultado, no una actividad suelta' }, { k: 'origen', t: 'text', l: 'De dónde sale (business-xray, un dato del cliente, el Chat…)' }], 'Agregar');
    if (!v || !root.isConnected) return;
    c.items.push(nuevoItem({ titulo: v.titulo, origen: v.origen })); cambio(); todo();
  }
  // Enviar al Roadmap: se agregan filas con oportunidad_id a viva.roadmap.items (las que ya estaban no se repiten). Aprobada la estrategia, el servidor responde 409.
  async function alRoadmap() {
    if (!ed || S.ocupado) return;
    const ya = ranking(c).filter(puedeEnviar); if (!ya.length) return toast('Elige una oportunidad dentro del alcance.', true);
    const v = await ask('Enviar al Roadmap', [{ k: 'area', t: 'select', opts: AREAS_RM_INFO.filter((a) => a.id !== 'consulting').map((a) => [a.id, a.nombre]), v: 'strategy', l: 'Área de las filas' }, { k: 'trimestre', t: 'select', opts: TRIMESTRES.map((t) => [t, `${t} · ${TRIMESTRE_NOMBRE[t]}`]), v: 'T1', l: 'Trimestre' }], 'Enviar');
    if (!v || !root.isConnected) return;
    S.ocupado = true; barra();
    try {
      const est = await api(`estrategia/${enc(slug)}`);
      if (est.vivaAprobada) throw new Error('La estrategia está aprobada: el CEO la reabre para agregar filas al Roadmap.');
      const actuales = limpiarItems(est.viva?.roadmap?.items), vistas = new Set(actuales.map((x) => x.oportunidad_id).filter(Boolean));
      const nuevas = aRoadmap(c.items, v).filter((x) => !vistas.has(x.oportunidad_id));
      if (nuevas.length) await api(`estrategia/${enc(slug)}/viva`, { method: 'PUT', body: { parche: { roadmap: { items: [...actuales, ...nuevas] } } } });
      for (const x of c.items) if (puedeEnviar(x)) x.estado = 'enviada';
      cambio(); toast(nuevas.length ? `${plural(nuevas.length, 'fila enviada', 'filas enviadas')} al Roadmap · guarda el mapa para dejar el estado` : 'Esas oportunidades ya estaban en el Roadmap');
    } catch (e) { toast(e?.message || 'No se pudo enviar al Roadmap', true); }
    S.ocupado = false; if (root.isConnected) todo();
  }
  async function aTareas() {
    if (!puedeTareas || S.ocupado) return;
    const lista = tareasDe(c.items, { slug, nombre: slug, email: me?.email || '' });
    if (!lista.length) return toast('Elige una oportunidad dentro del alcance.', true);
    if (!(await confirmAsk(`¿Crear ${plural(lista.length, 'tarea', 'tareas')} en Mis tareas? Son privadas y las que ya creaste no se repiten.`)) || !root.isConnected) return;
    S.ocupado = true; barra();
    try {
      const ts = await col('tasks').list(), ids = new Set(ts.map((t) => t.id)); let creadas = 0, ya = 0, malas = 0;
      for (const t of lista) {
        if (ids.has(t.id)) { ya++; continue; }
        try { await col('tasks').create(t); creadas++; } catch (e) { if (e.status === 409) ya++; else malas++; }
      }
      toast([plural(creadas, 'tarea creada', 'tareas creadas'), ya ? `${ya} ya estaban` : '', malas ? `${malas} no se pudieron crear` : ''].filter(Boolean).join(' · '), Boolean(malas));
    } catch (e) { toast(e?.message || 'No se pudieron crear las tareas', true); }
    S.ocupado = false; if (root.isConnected) todo();
  }

  root.addEventListener('click', (e) => {
    const t = e.target.closest?.('[data-act]'); if (!t || !root.contains(t) || t.disabled) return;
    const a = t.dataset.act, id = t.dataset.id;
    if (a === 'om-mas') agregar(); else if (a === 'om-roadmap') alRoadmap(); else if (a === 'om-tareas') aTareas();
    else if (a === 'om-elegir') poneEstado(id, 'elegida'); else if (a === 'om-quitar-eleccion' || a === 'om-reabrir') poneEstado(id, 'propuesta'); else if (a === 'om-descartar') poneEstado(id, 'descartada');
  });
  // Cambiar un puntaje, un peso o el alcance reordena al instante; el texto solo se guarda en memoria (no se repinta para no perder el foco).
  root.addEventListener('change', (e) => {
    const t = e.target, d = t.dataset || {};
    if (d.cmp) { if (t.checked) { if (S.cmp.size >= 3) { t.checked = false; return toast('Compara hasta 3 a la vez.', true); } S.cmp.add(d.cmp); } else S.cmp.delete(d.cmp); comparar(); return; }
    if (!ed) return;
    if (d.peso) { c.pesos[d.peso] = Number(t.value); cambio(); todo(); return; }
    const x = item(d.id); if (!x || !d.f) return;
    if (PUNTAJES.some((p) => p.id === d.f)) { x[d.f] = t.value === '' ? null : Number(t.value); cambio(); todo(); }
    else if (d.f === 'fuera_alcance') { x.fuera_alcance = t.checked; if (t.checked && ['elegida', 'enviada'].includes(x.estado)) x.estado = 'propuesta'; cambio(); todo(); }
  });
  root.addEventListener('input', (e) => {
    const t = e.target, d = t.dataset || {}; if (!ed || !d.id || !['titulo', 'evidencia'].includes(d.f)) return;
    const x = item(d.id); if (x) { x[d.f] = t.value; cambio(); }
  });

  // ---------- Arrastrar una burbuja: suelta en el punto más cercano de la cuadrícula (dificultad en x, impacto en y) ----------
  if (ed) {
    let arr = null;
    const aSvg = (svg, ev) => { const r = svg.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * H]; };
    const aNivel = (v, a, b) => Math.min(5, Math.max(1, Math.round(1 + ((v - a) / (b - a)) * 4)));
    root.addEventListener('pointerdown', (e) => {
      const g = e.target.closest?.('.om-b'); if (!g || !root.contains(g)) return;
      const svg = g.ownerSVGElement; arr = { g, svg, id: g.dataset.id }; try { g.setPointerCapture(e.pointerId); } catch {} g.classList.add('arrastra'); e.preventDefault();
    });
    root.addEventListener('pointermove', (e) => {
      if (!arr) return; const [x, y] = aSvg(arr.svg, e), c0 = arr.g.querySelector('circle');
      c0.setAttribute('cx', Math.min(X1, Math.max(X0, x))); c0.setAttribute('cy', Math.min(Y1, Math.max(Y0, y)));
    });
    const suelta = (e) => {
      if (!arr) return; const { svg, id, g } = arr; arr = null; g.classList.remove('arrastra');
      const [x, y] = aSvg(svg, e), it = item(id); if (!it) return;
      it.dificultad = aNivel(x, X0, X1); it.impacto = 5 - aNivel(y, Y0, Y1) + 1;
      cache.delete($('#om-2x2', root)); cambio(); todo();
    };
    root.addEventListener('pointerup', suelta); root.addEventListener('pointercancel', () => { if (arr) { arr.g.classList.remove('arrastra'); arr = null; cache.delete($('#om-2x2', root)); matriz(); } });
    // Teclado: con la burbuja enfocada, las flechas mueven un nivel.
    root.addEventListener('keydown', (e) => {
      const g = e.target.closest?.('.om-b'); if (!g || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      const it = item(g.dataset.id); if (!it) return; e.preventDefault();
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      it.dificultad = Math.min(5, Math.max(1, it.dificultad + d[0])); it.impacto = Math.min(5, Math.max(1, it.impacto + d[1])); cambio(); todo();
      $(`.om-b[data-id="${it.id}"]`, root)?.focus();
    });
  }
}

export const vista = {
  // El contenido inicial: sin oportunidades y con los pesos en 1. Si el Commercial Diagnosis dejó cuellos, llegan por la ruta de entregables, no aquí.
  nuevo() { return vacio(); },
  pintar: pintarOportunidades,
  // Una línea para el Overview: cuántas, cuántas elegidas y las primeras del ranking.
  resumen(contenido) { return html`<span class="om-res">${resumenTexto(contenido)}</span>`; },
};
