// Production Planner (herramienta production-planner de Production): las jornadas de grabación (content kind:'shoot', sin migrar), la tira de
// días 1-20 con la línea roja del día 11, el orden de tiro con márgenes de montaje, luz y traslado, los recursos, el medidor contra la ficha y el
// call sheet. Existe para que las reglas (el candado del día 11, el historial que solo se agrega, los montos solo para CEO/COO) vivan en un solo
// módulo puro (sin DOM ni red) que comparten la vista, el servidor (api/index.js) y las pruebas. Lo que falta dice ⚠️ SIN DATOS, nunca 0.
import { plano, corta, numeroONull, textos, sinAcentos, SIN_DATOS } from '../consulting/marcos.js';
import { techo } from '../produccion.js';

export const BLOQUE = 'planner';
export const DIA_LIMITE = 11; // el último día para producir (inherent/05-OPERACION.md §4)
export const DIAS_CICLO = 20;
export const ESTADOS = ['Por grabar', 'Grabado', 'Cancelado'];
const MAX_ESCENAS = 80, MAX_RECURSOS = 40;

export const vacio = () => ({ jornadas: [] });
const FECHA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const esFecha = (s) => FECHA.test(String(s ?? ''));
export const diaDe = (f) => (esFecha(f) ? Number(String(f).slice(8, 10)) : null);
export const mesDe = (f) => (esFecha(f) ? String(f).slice(0, 7) : '');
export const fechaDelCiclo = (mes, dia) => `${mes}-${String(dia).padStart(2, '0')}`;
const hora = (s) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(String(s ?? '').trim()) ? String(s).trim() : '');
export const aMin = (h) => (hora(h) ? Number(h.slice(0, 2)) * 60 + Number(h.slice(3)) : null);
export const deMin = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
const min = (v) => { const n = numeroONull(v, { min: 0, max: 1440 }); return n === null ? null : Math.round(n); };
const horas = (v) => { const n = numeroONull(v, { min: 0, max: 200 }); return n === null ? null : Math.round(n * 100) / 100; };

// ---------- Los campos de producción de un shoot (solo lo conocido, con su tipo y su tamaño) ----------
export const MARGENES = [['montaje', 'Montaje'], ['luz', 'Luz'], ['traslado', 'Traslado']];
export function limpiarRecursos(lista) {
  return (Array.isArray(lista) ? lista : []).filter(plano).slice(0, MAX_RECURSOS)
    .map((r) => ({ nombre: corta(r.nombre, 120), cantidad: numeroONull(r.cantidad, { min: 0, max: 10000 }), monto: numeroONull(r.monto, { min: 0 }) })).filter((r) => r.nombre);
}
export function limpiarEscenas(lista) {
  const vistas = new Set();
  return (Array.isArray(lista) ? lista : []).filter(plano).slice(0, MAX_ESCENAS).map((e) => ({
    id: corta(e.id, 40), id_creativo: corta(e.id_creativo, 40), accion: corta(e.accion, 300), plano: corta(e.plano, 120), lugar: corta(e.lugar, 120), talento: corta(e.talento, 120), min: min(e.min),
  })).filter((e) => e.id && !vistas.has(e.id) && vistas.add(e.id));
}
// Los campos nuevos del shoot. El resto del documento (title, date, time, place, crew, status…) se queda como estaba: así los de hoy aparecen sin migrar.
export function camposProduccion(x) {
  const o = plano(x) ? x : {}, p = plano(o.produccion) ? o.produccion : {}, m = plano(o.margenes) ? o.margenes : {};
  const escenas = limpiarEscenas(o.escenas), ids = new Set(escenas.map((e) => e.id));
  const orden = []; for (const id of Array.isArray(o.orden) ? o.orden : []) { const k = corta(id, 40); if (ids.has(k) && !orden.includes(k)) orden.push(k); }
  for (const e of escenas) if (!orden.includes(e.id)) orden.push(e.id);
  return {
    produccion: { crew: textos(p.crew, 20, 80), talento: textos(p.talento, 20, 80), equipo: textos(p.equipo, 40, 80), recursos: limpiarRecursos(p.recursos), contacto: corta(p.contacto, 120) },
    escenas, orden,
    margenes: { montaje: min(m.montaje), luz: min(m.luz), traslado: min(m.traslado) },
    horas_estimadas: horas(o.horas_estimadas), horas_reales: horas(o.horas_reales),
    archivado: o.archivado === true,
  };
}
// Una jornada completa (los campos de hoy + los nuevos), lista para pintar.
export function limpiarJornada(x) {
  const o = plano(x) ? x : {};
  return {
    id: corta(o.id, 120), title: corta(o.title, 160), date: esFecha(o.date) ? o.date : '', time: hora(o.time), place: corta(o.place, 160),
    crew: corta(o.crew, 160), pieces: String(o.pieces ?? '').slice(0, 2000), notes: String(o.notes ?? '').slice(0, 2000),
    status: ESTADOS.includes(o.status) ? o.status : ESTADOS[0], status_previo: ESTADOS.includes(o.status_previo) ? o.status_previo : '', ...camposProduccion(o),
  };
}
export function limpiar(c) { const o = plano(c) ? c : {}; return { jornadas: (Array.isArray(o.jornadas) ? o.jornadas : []).filter(plano).slice(0, 120).map(limpiarJornada) }; }
export const crewDe = (j) => (j.produccion?.crew?.length ? j.produccion.crew : String(j.crew || '').split(',').map((s) => s.trim()).filter(Boolean));

// ---------- Archivar en vez de borrar ----------
// Un shoot archivado queda «Cancelado» (así el calendario y el aviso del día 11 de hoy lo ignoran sin cambios) y recuerda su estado.
export const archivar = (x) => ({ archivado: true, status_previo: ESTADOS.includes(x?.status) && x.status !== 'Cancelado' ? x.status : x?.status_previo || ESTADOS[0], status: 'Cancelado' });
export const desarchivar = (x) => ({ archivado: false, status: ESTADOS.includes(x?.status_previo) ? x.status_previo : ESTADOS[0], status_previo: '' });
export const vivas = (shoots, slug = '') => (Array.isArray(shoots) ? shoots : []).filter((x) => x?.kind === 'shoot' && x.archivado !== true && (!slug || x.profile === slug));

// ---------- La tira de días 1-20 y el candado del día 11 ----------
export const pasaDia11 = (fecha) => { const d = diaDe(fecha); return d !== null && d > DIA_LIMITE; };
// Los días 1-20 del mes con sus jornadas; `tarde` = las que caen después del 20 (no caben en la tira) y `despues11` las que pasan del 11.
export function tira(shoots, mes) {
  const lista = vivas(shoots).filter((x) => mesDe(x.date) === mes && x.status !== 'Cancelado');
  const dias = Array.from({ length: DIAS_CICLO }, (_, i) => ({ dia: i + 1, fecha: fechaDelCiclo(mes, i + 1), limite: i + 1 === DIA_LIMITE, tarde: i + 1 > DIA_LIMITE, jornadas: lista.filter((x) => diaDe(x.date) === i + 1) }));
  return { dias, fuera: lista.filter((x) => diaDe(x.date) > DIAS_CICLO), despues11: lista.filter((x) => pasaDia11(x.date)), mes };
}
// Regla del servidor (api/index.js): una jornada con fecha después del día 11 da 423, salvo el CEO. Solo cuando la fecha es nueva o cambia
// (lo ya agendado no se toca), y archivar o cancelar siempre se puede. '' = pasa.
export function reglaDia11(b, cur, rol) {
  if (b?.kind !== 'shoot' || rol === 'ceo' || b.archivado === true || b.status === 'Cancelado' || !pasaDia11(b.date) || cur?.date === b.date) return '';
  return `El día ${DIA_LIMITE} es el último para producir: después no se graba nada del ciclo. Pásala al ${DIA_LIMITE} o antes, o pídele al CEO que la autorice.`;
}
// El historial de cumplimiento de una pieza solo se agrega: lo que ya estaba se queda igual y en su lugar. '' = pasa.
export function reglaHistorial(b, cur) {
  const antes = Array.isArray(cur?.cumplimiento?.historial) ? cur.cumplimiento.historial : [];
  if (!antes.length) return '';
  const ahora = b?.cumplimiento?.historial;
  if (!Array.isArray(ahora) || ahora.length < antes.length || antes.some((e, i) => JSON.stringify(e) !== JSON.stringify(ahora[i]))) return 'El historial de cumplimiento solo se agrega: no se reescribe ni se borra ninguna entrada.';
  return '';
}

// ---------- Orden de tiro ----------
// Desde el call time: el montaje una vez, la luz entre escenas y el traslado cuando cambia la locación. Cada escena trae sus minutos de rodaje;
// sin minutos la escena queda en `faltan` (no se inventa). Devuelve { filas, fin, total, faltan, sinMargenes }.
export function ordenDeTiro(j) {
  const c = camposProduccion(j), m = c.margenes, base = aMin(hora(j?.time));
  const por = new Map(c.escenas.map((e) => [e.id, e])), lista = c.orden.map((id) => por.get(id)).filter(Boolean);
  let t = base, anterior = null, total = 0; const filas = [], faltan = [];
  if (t !== null) t += m.montaje ?? 0;
  for (const e of lista) {
    if (e.min === null) faltan.push(e.id);
    if (anterior) { const tr = anterior.lugar && e.lugar && anterior.lugar !== e.lugar ? m.traslado ?? 0 : 0; if (t !== null) t += tr + (m.luz ?? 0); total += tr + (m.luz ?? 0); }
    const dur = e.min ?? 0, ini = t;
    if (t !== null) t += dur; total += dur;
    filas.push({ ...e, inicio: ini === null ? '' : deMin(ini), fin: t === null ? '' : deMin(t) });
    anterior = e;
  }
  total += m.montaje ?? 0;
  return { filas, fin: t === null || !lista.length ? '' : deMin(t), total, horas: Math.round((total / 60) * 100) / 100, faltan, sinMargenes: MARGENES.some(([k]) => m[k] === null), sinCall: base === null };
}
// Sube o baja una escena en el orden (no pierde ninguna).
export function mover(orden, id, delta) {
  const o = [...orden], i = o.indexOf(id), k = i + delta;
  if (i < 0 || k < 0 || k >= o.length) return o;
  [o[i], o[k]] = [o[k], o[i]]; return o;
}
// Las escenas de una jornada (J1…) tomadas de la shot list del mes (sin minutos: eso lo estima Producción).
export function escenasDeShotlist(shotlist, jornada) {
  const l = Array.isArray(shotlist?.escenas) ? shotlist.escenas : [];
  return limpiarEscenas(l.filter((e) => plano(e) && (!jornada || e.jornada === jornada)).map((e) => ({ id: e.id, id_creativo: e.id_creativo, accion: e.accion, plano: e.plano, lugar: e.lugar, talento: e.talento, min: null })));
}

// ---------- El medidor contra la ficha ----------
// Las horas estimadas y las sesiones (jornadas vivas, no canceladas) del mes contra el techo de la ficha (techo() de produccion.js: manda la menor).
export function medidor(jornadas, ficha, mes = '') {
  const l = vivas(jornadas).filter((x) => x.status !== 'Cancelado' && (!mes || mesDe(x.date) === mes)).map(limpiarJornada);
  const t = techo(ficha), suma = (k) => (l.some((x) => x[k] !== null) ? Math.round(l.reduce((a, x) => a + (x[k] ?? 0), 0) * 100) / 100 : null);
  const est = suma('horas_estimadas'), real = suma('horas_reales'), ses = l.length;
  const pct = est !== null && t.horas ? Math.round((est / t.horas) * 100) : null;
  return { estimadas: est, reales: real, techoHoras: t.horas, sesiones: ses, techoSesiones: t.sesiones, pct, pasaHoras: est !== null && t.horas !== null && est > t.horas, pasaSesiones: t.sesiones !== null && ses > t.sesiones,
    sinTecho: t.horas === null && t.sesiones === null, sinEstimar: l.filter((x) => x.horas_estimadas === null).length, fuente: t.fuente };
}

// ---------- Montos: solo CEO y COO ----------
export const veMontos = (rol) => rol === 'ceo' || rol === 'coo';
export const sinMontos = (x) => (plano(x) && plano(x.produccion) && Array.isArray(x.produccion.recursos) ? { ...x, produccion: { ...x.produccion, recursos: x.produccion.recursos.map(({ monto, ...r }) => r) } } : x);
// Lo que mandó quien no ve montos, con el monto guardado puesto de vuelta por nombre (los recursos nuevos salen sin monto).
export function conMontos(actual, nuevo) {
  if (!plano(nuevo?.produccion) || !Array.isArray(nuevo.produccion.recursos)) return nuevo;
  const previo = new Map((Array.isArray(actual?.produccion?.recursos) ? actual.produccion.recursos : []).map((r) => [r?.nombre, r?.monto ?? null]));
  return { ...nuevo, produccion: { ...nuevo.produccion, recursos: nuevo.produccion.recursos.map((r) => ({ ...r, monto: previo.has(r?.nombre) ? previo.get(r.nombre) : null })) } };
}
export const totalRecursos = (j) => { const r = limpiarRecursos(j?.produccion?.recursos); return r.some((x) => x.monto !== null) ? Math.round(r.reduce((a, x) => a + (x.monto ?? 0) * (x.cantidad ?? 1), 0) * 100) / 100 : null; };

// ---------- Faltas, call sheet y export ----------
export function faltas(contenido, extra = {}) {
  const f = [];
  for (const j of limpiar(contenido).jornadas) {
    if (j.status === 'Cancelado' || j.archivado) continue;
    const n = j.title || j.id;
    if (!j.date) f.push(`«${n}» no tiene fecha`);
    else if (pasaDia11(j.date) && extra?.rol !== 'ceo') f.push(`«${n}» cae el ${diaDe(j.date)}: después del día ${DIA_LIMITE} no se graba (solo el CEO lo autoriza)`);
    if (!j.time) f.push(`«${n}» no tiene call time`);
    if (!j.place) f.push(`«${n}» no tiene locación`);
    if (!crewDe(j).length) f.push(`«${n}» no tiene crew`);
    const o = ordenDeTiro(j); if (o.faltan.length) f.push(`«${n}»: faltan los minutos de ${o.faltan.join(', ')}`);
  }
  return f;
}
// El call sheet de una jornada: lo que se imprime y se manda al set. Sin montos (esos son de dirección).
export function callSheet(x, { marca = '' } = {}) {
  const j = limpiarJornada(x), o = ordenDeTiro(j);
  return { marca: corta(marca, 120), titulo: j.title, fecha: j.date, call: j.time, locacion: j.place, crew: crewDe(j), talento: j.produccion.talento, equipo: j.produccion.equipo, contacto: j.produccion.contacto,
    recursos: j.produccion.recursos.map((r) => ({ nombre: r.nombre, cantidad: r.cantidad })), orden: o.filas, fin: o.fin, notas: corta(j.notes, 600), margenes: j.margenes, faltan: o.faltan, sinCall: o.sinCall };
}
const celdaMd = (s) => String(s ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
export function callSheetMd(x, o = {}) {
  const c = callSheet(x, o), dato = (v) => (v === '' || v == null ? SIN_DATOS : v), lista = (l) => (l.length ? l.join(', ') : SIN_DATOS);
  const L = [`# Call sheet · ${c.titulo || 'Jornada'}`, '', c.marca ? `Marca: ${c.marca}` : '', `Fecha: ${dato(c.fecha)} · Call time: ${dato(c.call)} · Locación: ${dato(c.locacion)}`, `Crew: ${lista(c.crew)}`, `Talento: ${lista(c.talento)}`, `Equipo: ${lista(c.equipo)}`, `Contacto: ${dato(c.contacto)}`, ''].filter((l, i, a) => l !== '' || a[i - 1] !== '');
  L.push('## Orden de tiro', '', '| Hora | Escena | Pieza | Acción | Plano | Lugar | Min |', '|---|---|---|---|---|---|---|');
  for (const e of c.orden) L.push(`| ${e.inicio || SIN_DATOS} | ${e.id} | ${celdaMd(e.id_creativo) || SIN_DATOS} | ${celdaMd(e.accion)} | ${celdaMd(e.plano)} | ${celdaMd(e.lugar)} | ${e.min ?? SIN_DATOS} |`);
  if (c.recursos.length) L.push('', '## Recursos', '', ...c.recursos.map((r) => `- ${r.nombre}${r.cantidad !== null ? ` × ${r.cantidad}` : ''}`));
  if (c.notas) L.push('', `Notas: ${c.notas}`);
  return L.join('\n').trim() + '\n';
}
export function aMd(contenido) {
  const c = limpiar(contenido), L = ['# Production Planner', ''];
  for (const j of c.jornadas.filter((x) => !x.archivado).sort((a, z) => String(a.date).localeCompare(String(z.date)))) L.push(`- ${j.date || SIN_DATOS} · ${j.time || SIN_DATOS} · ${celdaMd(j.title)} · ${celdaMd(j.place) || SIN_DATOS} · ${j.status}`);
  return L.join('\n').trim() + '\n';
}
export { sinAcentos };
