// El calendario de contenido de una marca (Marcas › <marca> › Calendario › Publicación) es la suma de
//   investigación (el referente que se replica) + pilares o campañas + formatos, con el nivel de consciencia de cada pieza.
// Cada pieza (colección content, kind «post») guarda: pillar · campana · format · consciencia · replica_de (id de Research).
// Arriba del calendario va una sola línea con la mezcla del mes (por pilar, por formato y por consciencia), en barras finas.
// Arriba: funciones puras (las usan la pantalla, el conector y las pruebas). Abajo: cómo se pinta (solo en el navegador).
import { estadoDe } from './element.js';
import { campanasDelMes } from './campanas.js';
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
// La etapa del funnel sale del nivel de consciencia: 1-2 → TOF (atraer), 3-4 → MOF (convencer), 5 → BOF (cerrar).
export const ETAPAS = ['TOF', 'MOF', 'BOF'];
export const etapaFunnel = (x) => { const n = nivelConsciencia(x); return !n ? '' : n <= 2 ? 'TOF' : n <= 4 ? 'MOF' : 'BOF'; };
// El avatar de una pieza (id de Cliente ideal) → su nombre, con la lista de avatares de la marca.
export const avatarDe = (p, avatares = []) => (p?.avatar ? avatares.find((a) => a.id === p.avatar)?.nombre || '' : '');
// El formato de una pieza con su nombre de siempre (reel → Reel, estatico → Estático).
export function formatoDe(x) {
  const v = fold(x && typeof x === 'object' ? x.format : x); if (!v) return '';
  return FORMATOS.find((f) => fold(f) === v) || (v === 'estatico' || v === 'imagen' ? 'Estático' : v === 'video' ? 'Reel' : String(x?.format ?? x));
}
// Pilar o campaña: lo que agrupa la pieza en la mezcla. Una pieza con campaña y sin pilar cuenta en su campaña.
export const ejeDe = (p) => (p?.pillar ? p.pillar : p?.campana ? `Campaña · ${p.campana}` : '');

// La mezcla del mes: { total, pilar: [{k, n, pct, color}], formato: [...], consciencia: [...] }, con las piezas del mes `mes`
// (AAAA-MM). Los pilares van en el orden de la marca, los formatos y niveles en su orden; lo demás, de más a menos; «—» al final.
export function mezclaDelMes(posts = [], mes, pillars = [], avatares = []) {
  const list = posts.filter((p) => p && p.kind !== 'research' && String(p.date || '').slice(0, 7) === mes), total = list.length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const cuenta = (f) => { const m = new Map(); for (const p of list) { const k = f(p) || SIN; m.set(k, (m.get(k) || 0) + 1); } return m; };
  const color = Object.fromEntries((pillars || []).map((x) => [x.name, x.color]));
  const orden = (m, keys) => [...keys.filter((k) => m.has(k)), ...[...m.keys()].filter((k) => !keys.includes(k) && k !== SIN).sort((a, z) => m.get(z) - m.get(a)), ...(m.has(SIN) ? [SIN] : [])];
  const fila = (m, keys) => orden(m, keys).map((k) => ({ k, n: m.get(k), pct: pct(m.get(k)), ...(color[k] ? { color: color[k] } : {}) }));
  // Avatar: cuánto le toca a cada uno contra su peso (la meta), para ver si el volumen respeta la prioridad.
  const vivosAv = (avatares || []).filter((a) => !a.archivado), meta = Object.fromEntries(vivosAv.map((a) => [a.nombre, a.peso || 0]));
  const avatar = vivosAv.length ? fila(cuenta((p) => avatarDe(p, vivosAv)), vivosAv.map((a) => a.nombre)).map((r) => (r.k in meta ? { ...r, meta: meta[r.k] } : r)) : [];
  return { total, pilar: fila(cuenta(ejeDe), (pillars || []).map((x) => x.name)), formato: fila(cuenta(formatoDe), FORMATOS), consciencia: fila(cuenta(consciencia), CONSCIENCIA), etapa: fila(cuenta(etapaFunnel), ETAPAS), avatar };
}

// Los filtros del calendario: { eje (pilar o «Campaña · X»), formato, consciencia, replica ('si' | 'no' | '') }.
export function filtrar(posts = [], f = {}) {
  return posts.filter((p) => (!f.eje || (f.eje === SIN ? !ejeDe(p) : ejeDe(p) === f.eje || (p.campana && `Campaña · ${p.campana}` === f.eje)))
    && (!f.formato || (f.formato === SIN ? !formatoDe(p) : formatoDe(p) === f.formato))
    && (!f.consciencia || (f.consciencia === SIN ? !consciencia(p) : consciencia(p) === f.consciencia))
    && (!f.replica || (f.replica === 'si' ? Boolean(p.replica_de) : !p.replica_de))
    && (!f.etapa || (f.etapa === SIN ? !etapaFunnel(p) : etapaFunnel(p) === f.etapa))
    && (!f.avatar || (f.avatar === SIN ? !p.avatar : p.avatar === f.avatar || avatarDe(p, f.avatares || []) === f.avatar)));
}
export const hayFiltro = (f = {}) => Boolean(f.eje || f.formato || f.consciencia || f.replica || f.etapa || f.avatar);

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

// ---------- El candado del brief ----------
// Sin el brief del ciclo de un mes (④ Creatividad lo deja en 04-contenido/AAAA-MM/brief-del-ciclo.md), no se crean piezas con fecha
// de ese mes. El CEO puede abrir un mes sin brief (queda anotado en settings «brief_open»). Las ideas sin fecha siempre se pueden crear.
export const BRIEF = 'brief-del-ciclo.md';
export const mesesConBrief = (months = []) => months.filter((m) => (m.files || []).some((f) => f.name === BRIEF)).map((m) => m.mes);
export function candado(mes, conBrief = [], abiertos = []) {
  if (!/^\d{4}-\d{2}$/.test(String(mes || ''))) return { cerrado: false };
  if (conBrief.includes(mes)) return { cerrado: false, por: 'brief' };
  const ab = (abiertos || []).find((x) => x.mes === mes);
  return ab ? { cerrado: false, por: 'ceo', abierto: ab } : { cerrado: true };
}
export const mesNombre = (mes) => new Date(mes + '-15T12:00').toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });

// ---------- Content Calendar · mejoras (Marketing, Fase 3b) ----------
// Todo puro, sin DOM ni red: lo usan la pantalla (screens/content.js) y scripts/test-marketing-cal.mjs.
//   · Mover una pieza a otro día (arrastrar en la compu, «Mover a…» en el cel): la pieza con su fecha nueva. El servidor decide:
//     el candado del brief (423) y la `v` (409) siguen siendo suyos; aquí solo se arma lo que se guarda y cómo se revierte.
//   · Las bandas de campaña: las mk_campaigns del mes como una franja sobre los días entre su ancla y su hasta.
//   · El badge del slot del Plan del mes (MK-xxx) y las métricas de lo Publicado (solo las que la pieza ya trae).
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
// Una fecha AAAA-MM-DD que existe (2026-02-31 no).
export const fechaOk = (s) => { if (!FECHA.test(String(s || ''))) return false; const d = new Date(`${s}T12:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; };
const pad2 = (n) => String(n).padStart(2, '0');
const ultimoDia = (mes) => { const [y, m] = mes.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
const entreDias = (a, z) => Math.round((Date.parse(`${z}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
const sumaDia = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const esLunes = (iso) => (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7 === 0;

// ---- Mover una pieza de día ----
// Por qué una pieza no se mueve (o '' si sí). Lo que ya salió o está archivado no se reprograma desde el calendario.
export function motivoNoMover(p) {
  if (!p || typeof p !== 'object' || !p.id) return 'No encontré la pieza';
  if (p.kind && p.kind !== 'post') return 'Solo se mueven las piezas';
  const e = estadoDe(p);
  if (e === 'Publicado') return 'Ya salió: no se mueve de día';
  if (e === 'Archivado') return 'Está archivada: recupérala primero';
  return '';
}
// La pieza con la fecha nueva (la `v` que se leyó viaja con ella). Nunca toca lo demás. Fecha que no existe o pieza que no se mueve → null.
export function moverPieza(p, fecha) {
  if (motivoNoMover(p) || !fechaOk(fecha)) return null;
  return { ...p, date: fecha };
}
// La lista con ESA pieza reemplazada (por id). Sirve para las tres cosas: verla ya en su día, ponerle lo que devolvió el servidor
// (con su `v` nueva) y revertirla a como estaba si el servidor dijo que no. Si la pieza ya no está en la lista, no se agrega.
export const ponerPieza = (lista = [], pieza) => (pieza?.id ? lista.map((x) => (x.id === pieza.id ? pieza : x)) : lista);
// Mover en la lista: { lista, nueva, antes } con la pieza ya en su día nuevo (y la de antes, para revertir); null si no se mueve, no cambia de día o no está.
export function moverEnLista(lista = [], id, fecha) {
  const p = lista.find((x) => x.id === id), nueva = p ? moverPieza(p, fecha) : null;
  if (!nueva || nueva.date === p.date) return null;
  return { lista: ponerPieza(lista, nueva), nueva, antes: p };
}
// Qué se le dice a la persona cuando el servidor rechaza el movimiento: su mensaje tal cual (423 sin brief del mes, 409 alguien la
// cambió) y si hay que volver a leer las piezas (409: la que tenemos ya está vieja).
export const falloAlMover = (e) => ({ mensaje: String(e?.message || 'No se pudo mover la pieza').slice(0, 300), recargar: e?.status === 409 });

// ---- Bandas de campaña ----
// Las campañas del mes (campanasDelMes) como franjas sobre los días entre su ancla y su hasta (sin hasta: solo el día del ancla),
// recortadas al mes. Las archivadas no salen. Cada una lleva su carril (para que dos franjas del mismo día no se encimen).
// mes = AAAA-MM → [{ id, nombre, tipo, estado, ancla, hasta, desde, fin, dias, desdeAntes, sigue, carril }]
export function bandasDelMes(campanas = [], mes) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(mes || ''))) return [];
  const ini = `${mes}-01`, fin = `${mes}-${pad2(ultimoDia(mes))}`;
  // La anticipación se calcula con las fechas: solo entran las campañas que las traen bien (una mala no tumba el calendario).
  const buenas = (campanas || []).filter((c) => c && typeof c === 'object' && fechaOk(c.ancla)).map((c) => ({ ...c, hasta: fechaOk(c.hasta) && c.hasta >= c.ancla ? c.hasta : '' }));
  const out = [];
  for (const c of campanasDelMes(buenas, mes)) {
    const hasta = c.hasta || c.ancla;
    if (hasta < ini || c.ancla > fin) continue; // su franja no toca este mes (solo lo avisó antes)
    const desde = c.ancla < ini ? ini : c.ancla, topeMes = hasta > fin ? fin : hasta;
    out.push({ id: String(c.id || ''), nombre: String(c.nombre || 'Campaña').slice(0, 60), tipo: String(c.tipo || 'campana'), estado: String(c.estado || 'Borrador'),
      ancla: c.ancla, hasta, desde, fin: topeMes, dias: entreDias(desde, topeMes) + 1, desdeAntes: c.ancla < ini, sigue: hasta > fin });
  }
  out.sort((a, z) => a.desde.localeCompare(z.desde) || z.fin.localeCompare(a.fin) || a.nombre.localeCompare(z.nombre));
  const libre = []; // el último día de cada carril
  for (const b of out) { let i = libre.findIndex((f) => f < b.desde); if (i < 0) i = libre.length; libre[i] = b.fin; b.carril = i; }
  return out;
}
// Las bandas repartidas por día: { 'AAAA-MM-DD': [{ id, nombre, tipo, estado, carril, ancla, hasta, pos, rotulo, sigueAntes, sigueDespues }] } en orden de carril.
// pos: solo · ini · mid · fin. rotulo: dónde se escribe su nombre (el primer día y cada lunes, o todos los días con rotuloSiempre, para la vista de semana).
export function bandasPorDia(bandas = [], { rotuloSiempre = false } = {}) {
  const out = {};
  for (const b of bandas) {
    for (let d = b.desde, i = 0; d <= b.fin && i < 62; d = sumaDia(d, 1), i++) {
      (out[d] ||= []).push({ id: b.id, nombre: b.nombre, tipo: b.tipo, estado: b.estado, carril: b.carril || 0, ancla: b.ancla, hasta: b.hasta,
        pos: b.desde === b.fin ? 'solo' : d === b.desde ? 'ini' : d === b.fin ? 'fin' : 'mid', rotulo: rotuloSiempre || d === b.desde || esLunes(d),
        sigueAntes: d === b.desde && Boolean(b.desdeAntes), sigueDespues: d === b.fin && Boolean(b.sigue) });
    }
  }
  for (const d of Object.keys(out)) out[d].sort((a, z) => a.carril - z.carril);
  return out;
}

// ---- El slot del Plan del mes ----
// La pieza que viene de un slot (plan-mes.js · slotsAPiezas) guarda `slot: { plan, id: 'MK-001', semana, canal, … }`.
// → { id, plan, mes, semana, canal, funcion, fuera } o null. `fuera`: ya no está en la semana (o el mes) que el plan le dio.
export function slotDe(p) {
  const s = p && typeof p === 'object' ? p.slot : null;
  if (!s || typeof s !== 'object') return null;
  const id = String(s.id ?? '').trim().slice(0, 12);
  if (!id) return null;
  const mes = /(\d{4}-\d{2})$/.exec(String(s.plan || ''))?.[1] || '', semana = Math.min(5, Math.max(0, Math.round(Number(s.semana) || 0)));
  const f = FECHA.test(String(p.date || '')) ? p.date : '', real = f ? Math.min(5, Math.ceil(+f.slice(8, 10) / 7)) : 0;
  const fuera = Boolean(f && ((mes && f.slice(0, 7) !== mes) || (semana && real !== semana)));
  return { id, plan: String(s.plan || ''), mes, semana, canal: String(s.canal || '').slice(0, 40), funcion: String(s.funcion || '').slice(0, 20), fuera };
}
export const tituloSlot = (sl) => (sl ? [`Slot ${sl.id} del Plan del mes`, sl.semana && `semana ${sl.semana}`, sl.canal, sl.funcion, sl.fuera && 'ya no está en su semana del plan'].filter(Boolean).join(' · ') : '');

// ---- Las métricas de lo Publicado ----
// Solo las que la pieza YA trae: en p.metricas, p.metrics o p.analytics (objetos) o sueltas en la pieza. Lo que falta no sale
// (nunca un 0 por un dato que falta; un 0 de verdad sí). Sin métricas, o si no está Publicada → [].
const METRICAS = [
  ['alcance', 'Alcance', ['alcance', 'reach']],
  ['vistas', 'Vistas', ['vistas', 'views', 'plays']],
  ['likes', 'Me gusta', ['likes', 'me_gusta', 'megusta']],
  ['comentarios', 'Comentarios', ['comentarios', 'comments']],
  ['guardados', 'Guardados', ['guardados', 'saves']],
  ['compartidos', 'Compartidos', ['compartidos', 'shares']],
];
const numero = (v) => { if (typeof v === 'string' && v.trim() === '') return null; if (typeof v !== 'number' && typeof v !== 'string') return null; const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : null; };
// 1234 → «1.2K», 2500000 → «2.5M»
export const compacto = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K` : String(Math.round(n)));
export function metricasDe(p) {
  if (!p || typeof p !== 'object' || estadoDe(p) !== 'Publicado') return [];
  const fuentes = [p.metricas, p.metrics, p.analytics, p].filter((o) => o && typeof o === 'object' && !Array.isArray(o));
  const out = [];
  for (const [k, l, alias] of METRICAS) {
    let v = null;
    for (const f of fuentes) { for (const a of alias) { v = numero(f[a]); if (v != null) break; } if (v != null) break; }
    if (v != null) out.push({ k, l, v, t: compacto(v) });
  }
  return out;
}
// «1.2K alcance · 340 me gusta» (las primeras n)
export const resumenMetricas = (ms = [], n = 2) => ms.slice(0, n).map((m) => `${m.t} ${m.l.toLowerCase()}`).join(' · ');

// ---------- Cómo se pinta (solo en el navegador) ----------
// La línea de la mezcla: tres barras finas (pilar · formato · consciencia). Tocar un tramo filtra por él.
const TONOS = ['#795c45', '#a68d77', '#5f7a8c', '#8c6f5a', '#7f9a6a', '#b08a5a', '#6e5a7a', '#9f846d'];
export function mezclaHtml(mz, f = {}, titulo = '') {
  const { html, raw } = core;
  const bar = (key, lbl, rows, short) => html`<div class="cc-mix-g"><span class="cc-mix-l">${lbl}</span><span class="cc-bar" role="img" aria-label="${lbl}: ${rows.map((r) => `${r.k} ${r.pct}%`).join(', ') || 'sin piezas'}">${rows.length ? rows.map((r, i) => html`<button class="cc-seg ${f[key] === r.k ? 'on' : ''} ${r.k === SIN ? 'none' : ''}" data-act="ccmix" data-f="${key}" data-v="${r.k}" title="${r.k}: ${r.n} · ${r.pct}%" ${raw(`style="flex:${r.n} 1 0;${r.k === SIN ? '' : `background:${r.color || TONOS[i % TONOS.length]}`}"`)}></button>`) : html`<i class="cc-seg none" style="flex:1"></i>`}</span>
      <span class="cc-mix-t">${rows.filter((r) => r.k !== SIN).sort((x, z) => z.n - x.n).slice(0, 2).map((r) => `${short ? short(r.k) : r.k} ${r.pct}%`).join(' · ') || 'sin datos'}</span></div>`;
  const corta = (k) => CONSCIENCIA_CORTA[CONSCIENCIA.indexOf(k)] || k;
  return html`<div class="cc-mix" aria-label="Mezcla del mes"><b class="cc-mix-h">${titulo ? html`${titulo} · ` : ''}${mz.total} pieza${mz.total === 1 ? '' : 's'}</b>${bar('eje', 'Pilar', mz.pilar)}${bar('formato', 'Formato', mz.formato)}${bar('consciencia', 'Consciencia', mz.consciencia, corta)}${bar('etapa', 'Etapa', mz.etapa || [])}${mz.avatar?.length ? bar('avatar', 'Avatar', mz.avatar, (k) => { const r = mz.avatar.find((x) => x.k === k); return r?.meta != null ? `${k} (meta ${r.meta}%)` : k; }) : ''}</div>`;
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
