// El calendario de contenido de una marca (Marcas › <marca> › Calendario › Publicación) es la suma de
//   investigación (el referente que se replica) + pilares o campañas + formatos, con el nivel de consciencia de cada pieza.
// Cada pieza (colección content, kind «post») guarda: pillar · campana · format · consciencia · replica_de (id de Research).
// Arriba del calendario va una sola línea con la mezcla del mes (por pilar, por formato y por consciencia), en barras finas.
// Arriba: funciones puras (las usan la pantalla, el conector y las pruebas). Abajo: cómo se pinta (solo en el navegador).
const core = typeof document === 'undefined' ? null : await import('./core.js');

// Los 5 niveles de consciencia (Schwartz), escritos literal como en ③ Marketing (mk-calendario § 1A).
export const CONSCIENCIA = ['Inconsciente', 'Consciente del problema', 'Consciente de la solución', 'Consciente del producto', 'Listo para comprar'];
export const CONSCIENCIA_CORTA = ['Inconsciente', 'Problema', 'Solución', 'Producto', 'Listo'];
export const FORMATOS = ['Reel', 'TikTok', 'Carrusel', 'Story', 'Estático', 'YouTube'];
export const SIN = '—';
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const AW = { inconsciente: 0, unaware: 0, 'consciente del problema': 1, problema: 1, 'problem aware': 1, 'consciente de la solucion': 2, solucion: 2, 'solution aware': 2, 'consciente del producto': 3, producto: 3, 'product aware': 3, 'listo para comprar': 4, listo: 4, 'most aware': 4 };
// El nivel de una pieza (acepta 1-5, el texto literal, el corto o el de Schwartz en inglés). Sin nivel → ''.
export function consciencia(x) {
  const v = x && typeof x === 'object' ? x.consciencia : x;
  if (v == null || v === '') return '';
  const n = Number(v); if (Number.isInteger(n) && n >= 1 && n <= 5) return CONSCIENCIA[n - 1];
  const i = AW[fold(v)]; return i == null ? '' : CONSCIENCIA[i];
}
export const nivelConsciencia = (x) => { const c = consciencia(x); return c ? CONSCIENCIA.indexOf(c) + 1 : 0; };
// El formato de una pieza con su nombre de siempre (reel → Reel, estatico → Estático).
export function formatoDe(x) {
  const v = fold(x && typeof x === 'object' ? x.format : x); if (!v) return '';
  return FORMATOS.find((f) => fold(f) === v) || (v === 'estatico' || v === 'imagen' ? 'Estático' : v === 'video' ? 'Reel' : String(x?.format ?? x));
}
// Pilar o campaña: lo que agrupa la pieza en la mezcla. Una pieza con campaña y sin pilar cuenta en su campaña.
export const ejeDe = (p) => (p?.pillar ? p.pillar : p?.campana ? `Campaña · ${p.campana}` : '');

// La mezcla del mes: { total, pilar: [{k, n, pct, color}], formato: [...], consciencia: [...] }, con las piezas del mes `mes`
// (AAAA-MM). Los pilares van en el orden de la marca, los formatos y niveles en su orden; lo demás, de más a menos; «—» al final.
export function mezclaDelMes(posts = [], mes, pillars = []) {
  const list = posts.filter((p) => p && p.kind !== 'research' && String(p.date || '').slice(0, 7) === mes), total = list.length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const cuenta = (f) => { const m = new Map(); for (const p of list) { const k = f(p) || SIN; m.set(k, (m.get(k) || 0) + 1); } return m; };
  const color = Object.fromEntries((pillars || []).map((x) => [x.name, x.color]));
  const orden = (m, keys) => [...keys.filter((k) => m.has(k)), ...[...m.keys()].filter((k) => !keys.includes(k) && k !== SIN).sort((a, z) => m.get(z) - m.get(a)), ...(m.has(SIN) ? [SIN] : [])];
  const fila = (m, keys) => orden(m, keys).map((k) => ({ k, n: m.get(k), pct: pct(m.get(k)), ...(color[k] ? { color: color[k] } : {}) }));
  return { total, pilar: fila(cuenta(ejeDe), (pillars || []).map((x) => x.name)), formato: fila(cuenta(formatoDe), FORMATOS), consciencia: fila(cuenta(consciencia), CONSCIENCIA) };
}

// Los filtros del calendario: { eje (pilar o «Campaña · X»), formato, consciencia, replica ('si' | 'no' | '') }.
export function filtrar(posts = [], f = {}) {
  return posts.filter((p) => (!f.eje || (f.eje === SIN ? !ejeDe(p) : ejeDe(p) === f.eje || (p.campana && `Campaña · ${p.campana}` === f.eje)))
    && (!f.formato || (f.formato === SIN ? !formatoDe(p) : formatoDe(p) === f.formato))
    && (!f.consciencia || (f.consciencia === SIN ? !consciencia(p) : consciencia(p) === f.consciencia))
    && (!f.replica || (f.replica === 'si' ? Boolean(p.replica_de) : !p.replica_de)));
}
export const hayFiltro = (f = {}) => Boolean(f.eje || f.formato || f.consciencia || f.replica);

// Los referentes que se pueden replicar: los posts de Research de la marca marcados «Usar como formato» (replicar: true).
export const replicasDe = (content = [], slug) => content.filter((x) => x && x.kind === 'research' && x.profile === slug && x.replicar === true);
export const replicaNombre = (r) => `${r?.title || (r?.handle ? '@' + r.handle : 'Referente')}${r?.handle && r?.title ? ' · @' + r.handle : ''}`;
// Research guarda el formato en minúsculas (reel, carrusel, estatico); la pieza, con su nombre.
const FMT_RS = { reel: 'Reel', carrusel: 'Carrusel', estatico: 'Estático' };
// Una pieza que replica un post de Research: guarda replica_de (el id) y, si no tiene formato, toma el del referente.
export function conReplica(p = {}, r) {
  if (!r?.id) { const { replica_de, ...rest } = p; return rest; }
  return { ...p, replica_de: r.id, format: p.format || FMT_RS[r.format] || (r.video === false ? 'Estático' : 'Reel') };
}
// El referente de una pieza (o null si ya no está en Research).
export const replicaDe = (p, refs = []) => (p?.replica_de ? refs.find((r) => r.id === p.replica_de) || null : null);
// Las opciones de pilar o campaña para el filtro: los pilares de la marca, las campañas que ya tienen piezas y las de pauta.
export function ejes(posts = [], pillars = [], campaigns = []) {
  const ps = [...new Set([...(pillars || []).map((x) => x.name), ...posts.map((p) => p.pillar)].filter(Boolean))];
  const cs = [...new Set([...posts.map((p) => p.campana), ...(campaigns || []).map((c) => c.name)].filter(Boolean))];
  return { pilares: ps, campanas: cs };
}

// ---------- Cómo se pinta (solo en el navegador) ----------
// La línea de la mezcla: tres barras finas (pilar · formato · consciencia). Tocar un tramo filtra por él.
const TONOS = ['#795c45', '#a68d77', '#5f7a8c', '#8c6f5a', '#7f9a6a', '#b08a5a', '#6e5a7a', '#9f846d'];
export function mezclaHtml(mz, f = {}, titulo = '') {
  const { html, raw } = core;
  const bar = (key, lbl, rows, short) => html`<div class="cc-mix-g"><span class="cc-mix-l">${lbl}</span><span class="cc-bar" role="img" aria-label="${lbl}: ${rows.map((r) => `${r.k} ${r.pct}%`).join(', ') || 'sin piezas'}">${rows.length ? rows.map((r, i) => html`<button class="cc-seg ${f[key] === r.k ? 'on' : ''} ${r.k === SIN ? 'none' : ''}" data-act="ccmix" data-f="${key}" data-v="${r.k}" title="${r.k}: ${r.n} · ${r.pct}%" ${raw(`style="flex:${r.n} 1 0;${r.k === SIN ? '' : `background:${r.color || TONOS[i % TONOS.length]}`}"`)}></button>`) : html`<i class="cc-seg none" style="flex:1"></i>`}</span>
      <span class="cc-mix-t">${rows.filter((r) => r.k !== SIN).sort((x, z) => z.n - x.n).slice(0, 2).map((r) => `${short ? short(r.k) : r.k} ${r.pct}%`).join(' · ') || 'sin datos'}</span></div>`;
  const corta = (k) => CONSCIENCIA_CORTA[CONSCIENCIA.indexOf(k)] || k;
  return html`<div class="cc-mix" aria-label="Mezcla del mes"><b class="cc-mix-h">${titulo ? html`${titulo} · ` : ''}${mz.total} pieza${mz.total === 1 ? '' : 's'}</b>${bar('eje', 'Pilar', mz.pilar)}${bar('formato', 'Formato', mz.formato)}${bar('consciencia', 'Consciencia', mz.consciencia, corta)}</div>`;
}
// Los filtros: pilar o campaña · formato · consciencia · replica. Selects compactos, en una línea.
export function filtrosHtml(f = {}, { pilares = [], campanas = [] } = {}, nRefs = 0) {
  const { html, raw } = core;
  const sel = (k, lbl, opts) => html`<select class="in cc-f ${f[k] ? 'on' : ''}" data-ccf="${k}" aria-label="${lbl}"><option value="">${lbl}</option>${opts}</select>`;
  const o = (k) => (v, l = v) => html`<option value="${v}" ${f[k] === v ? raw('selected') : ''}>${l}</option>`;
  const oe = o('eje'), of = o('formato'), oc = o('consciencia'), orr = o('replica');
  return html`<div class="cc-filters">
    ${sel('eje', 'Pilar o campaña', html`${pilares.length ? html`<optgroup label="Pilares">${pilares.map((x) => oe(x))}</optgroup>` : ''}${campanas.length ? html`<optgroup label="Campañas">${campanas.map((x) => oe(`Campaña · ${x}`, x))}</optgroup>` : ''}${oe(SIN, 'Sin pilar')}`)}
    ${sel('formato', 'Formato', html`${FORMATOS.map((x) => of(x))}`)}
    ${sel('consciencia', 'Consciencia', html`${CONSCIENCIA.map((x, i) => oc(x, `${i + 1} · ${x}`))}${oc(SIN, 'Sin nivel')}`)}
    ${nRefs ? sel('replica', 'Referente', html`${orr('si', 'Replica un referente')}${orr('no', 'Sin referente')}`) : ''}
    ${hayFiltro(f) ? html`<button class="chip" data-act="ccclear">Quitar filtros</button>` : ''}</div>`;
}
// Lo que cada pieza muestra en su chip: el nivel de consciencia (1-5) y si replica un referente.
export const marcasPieza = (p) => { const { html } = core; const n = nivelConsciencia(p); return html`${n ? html`<span class="cc-aw" title="${consciencia(p)}">${n}</span>` : ''}${p.replica_de ? html`<span class="cc-rep" title="Replica un referente de Research">↻</span>` : ''}`; };
export const tituloPieza = (p, refs = []) => [ejeDe(p) || 'Sin pilar', formatoDe(p), consciencia(p) || 'Sin nivel de consciencia', p.replica_de ? `Replica: ${replicaNombre(replicaDe(p, refs) || {})}` : ''].filter(Boolean).join(' · ');
