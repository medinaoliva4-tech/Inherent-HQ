// Marca › Planear › Campañas y eventos: las campañas de ③ Marketing (agents/03-marketing-creative/brain/skills/mc-campanas-piezas) con
// nombre propio. Una campaña es un empujón con principio y final: tiene fecha o evento (si no, es un pilar). Un evento es una
// campaña de tipo «evento». Cada una lleva su frase, la MUST BE TRUE que mueve, en qué se va a notar, qué NO es y su
// anticipación (primer aviso, recordatorio y último empujón). Colección «mk_campaigns» (área content), solo por /api/campanas.
// Campaign Architect (Fase 3b) la extiende con el plan de canales (fases × canales), los briefs creativos, los resultados y dos ligas:
// la campaña de pauta (colección «campaigns», por id) y el entregable que la originó. Los montos del plan solo los ve quien ve costos.
// Puro: sin DOM ni red (lo prueban scripts/test-plan.mjs y scripts/test-marketing-camp.mjs). No importa llm/modos.js ni consulting/marcos.js
// (modos.js importa este archivo: un ciclo rompería la carga).
export const COLL_C = 'mk_campaigns';

// La anticipación por defecto de mc-campanas-piezas (§ La anticipación): días antes de la fecha ancla. Se ajusta, pero se declara.
// [clave, nombre, primer aviso, recordatorios, último empujón, sobre qué fecha va el empujón]
export const TIPOS_C = [
  ['evento', 'Evento con cupo', 21, [7], [2, 0], 'ancla'],
  ['apertura', 'Apertura o inauguración', 28, [14, 7], [0], 'ancla'],
  ['lanzamiento', 'Lanzamiento de producto', 28, [14, 7], [0], 'ancla'],
  ['promocion', 'Promoción corta', 7, [2], [0], 'hasta'],
  ['temporada', 'Fecha de temporada', 35, [21, 14, 7], [2], 'ancla'],
  ['campana', 'Campaña del ciclo', 0, [], [], 'ancla'],
];
export const ESTADOS_C = ['Borrador', 'En curso', 'Cerrada', 'Archivada'];
export const tipoDe = (k) => TIPOS_C.find(([x]) => x === k) || TIPOS_C[TIPOS_C.length - 1];

const txt = (s, n = 200) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const fecha = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : '');
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const tipoLibre = (v) => (TIPOS_C.find(([k, n]) => fold(v) === k || fold(v) === fold(n) || (fold(v) && fold(n).startsWith(fold(v)))) || [])[0] || '';

// ---------- Plan de canales, briefs y resultados (Campaign Architect) ----------
// canales[fase][canal] = { activo, fecha, pieza, monto }: siempre las 3 fases × los 6 canales (lo que no vino sale apagado y vacío).
// El monto es un número o null: un monto que falta es null, nunca 0. Solo lo ve (y lo escribe) quien ve costos (sinMontos, canalesConMontos).
export const FASES_C = ['primer-aviso', 'recordatorio', 'ultimo-empujon'];
export const CANALES_C = ['instagram', 'tiktok', 'pauta', 'whatsapp', 'email', 'evento'];
export const NOMBRE_FASE_C = { 'primer-aviso': 'Primer aviso', recordatorio: 'Recordatorio', 'ultimo-empujon': 'Último empujón' };
export const NOMBRE_CANAL_C = { instagram: 'Instagram', tiktok: 'TikTok', pauta: 'Pauta', whatsapp: 'WhatsApp', email: 'Email', evento: 'Evento' };
export const BLOQUE = 'campana'; // el bloque ```campana``` que lee llm/modos.js (leerTarjetas)
export const MAX_BRIEFS = 24, MAX_RESULTADOS = 100, MONTO_MAX = 1e9;

const plano = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const cad = (v) => (typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');
const tx = (v, n) => txt(cad(v), n);
const idRef = (v) => (/^[\w.-]{1,120}$/.test(cad(v)) ? cad(v) : '');
const clave = (s) => fold(cad(s)).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Una fecha que existe en el calendario (2026-02-30 no): '' si no.
const fechaReal = (s) => { const t = cad(s); if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return ''; const d = new Date(t + 'T12:00:00Z'); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t ? t : ''; };
const FASE_ALIAS = { primer: 'primer-aviso', aviso: 'primer-aviso', recordatorios: 'recordatorio', ultimo: 'ultimo-empujon', empujon: 'ultimo-empujon', 'el-dia': 'ultimo-empujon', 'ultimo-dia': 'ultimo-empujon' };
const CANAL_ALIAS = { ig: 'instagram', insta: 'instagram', 'tik-tok': 'tiktok', ads: 'pauta', paid: 'pauta', 'pauta-paga': 'pauta', wa: 'whatsapp', 'e-mail': 'email', correo: 'email', newsletter: 'email', eventos: 'evento', presencial: 'evento' };
// «Primer aviso», «primer-aviso» o «Último empujón» → la clave de FASES_C; '' si no es una fase. Igual con los canales.
export const faseDe = (v) => { const k = clave(v); return FASES_C.includes(k) ? k : FASE_ALIAS[k] || ''; };
export const canalDe = (v) => { const k = clave(v); return CANALES_C.includes(k) ? k : CANAL_ALIAS[k] || ''; };
// Un monto: número ≥ 0 o null («Q1,500» también). Vacío o raro = null, no 0.
export function monto(v) {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v.replace(/[Q$,\s]/gi, '')) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= MONTO_MAX ? Math.round(n * 100) / 100 : null;
}
export const celdaVacia = () => ({ activo: false, fecha: '', pieza: '', monto: null });
const celda = (x) => { const k = plano(x) ? x : {}; return { activo: k.activo === true || k.activo === 'true', fecha: fechaReal(k.fecha), pieza: tx(k.pieza, 160), monto: monto(k.monto) }; };
function limpiarCanales(x) {
  const porFase = new Map();
  for (const [k, v] of Object.entries(plano(x) ? x : {})) { const f = faseDe(k); if (f && plano(v) && !porFase.has(f)) porFase.set(f, v); }
  const out = {};
  for (const f of FASES_C) {
    const porCanal = new Map();
    for (const [k, v] of Object.entries(porFase.get(f) || {})) { const c = canalDe(k); if (c && !porCanal.has(c)) porCanal.set(c, v); }
    out[f] = Object.fromEntries(CANALES_C.map((c) => [c, celda(porCanal.get(c))]));
  }
  return out;
}
// Un brief por celda del plan: { id, fase, canal, objetivo, mensaje, formato, cta }. Hasta MAX_BRIEFS; uno sin ningún texto no es un brief.
function limpiarBriefs(x) {
  const out = [], usados = new Set();
  for (const b of Array.isArray(x) ? x : []) {
    if (out.length >= MAX_BRIEFS) break;
    if (!plano(b)) continue;
    const fase = faseDe(b.fase), canal = canalDe(b.canal); if (!fase || !canal) continue;
    const o = { objetivo: tx(b.objetivo, 200), mensaje: tx(b.mensaje, 400), formato: tx(b.formato, 80), cta: tx(b.cta, 120) };
    if (!Object.values(o).some(Boolean)) continue;
    const base = cad(b.id).replace(/[^\w.-]/g, '').slice(0, 40) || `${fase}.${canal}`; let id = base, n = 2;
    while (usados.has(id)) id = `${base}-${n++}`;
    usados.add(id); out.push({ id, fase, canal, ...o });
  }
  return out;
}
function limpiarResultados(x) {
  return (Array.isArray(x) ? x : []).filter(plano).map((r) => ({ en: tx(r.en, 40), metrica: tx(r.metrica, 120), valor: tx(r.valor, 60), nota: tx(r.nota, 300) })).filter((r) => r.metrica).slice(0, MAX_RESULTADOS);
}

// Lo que llega (del Tablero, del Chat o del conector), limpio: solo campos conocidos y con tipo.
export function limpiarCampana(c = {}) {
  c = plano(c) ? c : {};
  const tipo = tipoLibre(c.tipo) || 'campana';
  const o = {
    nombre: txt(c.nombre, 60), frase: txt(c.frase, 160), tipo,
    mbt: txt(c.mbt ?? c.must_be_true, 80), se_nota: txt(c.se_nota ?? c.en_que_se_nota, 200), no_es: txt(c.no_es ?? c.que_no_es, 200),
    ancla: fecha(c.ancla ?? c.fecha), hasta: fecha(c.hasta), responsable: txt(c.responsable, 120).toLowerCase(),
    estado: ESTADOS_C.find((e) => fold(e) === fold(c.estado)) || 'Borrador', notas: txt(c.notas, 600),
  };
  if (o.hasta && o.ancla && o.hasta < o.ancla) o.hasta = '';
  if (tipo === 'evento') {
    const e = c.evento && typeof c.evento === 'object' ? c.evento : c;
    o.evento = { lugar: txt(e.lugar, 120), cupo: Math.max(0, Math.round(+e.cupo || 0)) || null, objetivo: txt(e.objetivo, 200), proveedores: txt(e.proveedores, 300), medicion: txt(e.medicion, 200), presupuesto_id: txt(e.presupuesto_id, 80) };
  }
  // Campaign Architect: el plan de canales, los briefs, los resultados y las dos ligas (ids de otros docs: el servidor revisa que sean de esta marca).
  o.canales = limpiarCanales(c.canales); o.briefs = limpiarBriefs(c.briefs); o.resultados = limpiarResultados(c.resultados);
  o.pauta_id = idRef(c.pauta_id); o.entregable_ref = idRef(c.entregable_ref);
  return o;
}

// Las fechas de la anticipación: [{ fecha, que, dias }] en orden. Sin fecha ancla, nada.
const masDias = (iso, d) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };
export function anticipacion(c = {}) {
  if (!c.ancla) return [];
  const [, , aviso, recs, emp, sobre] = tipoDe(c.tipo), base = sobre === 'hasta' && c.hasta ? c.hasta : c.ancla;
  const out = [];
  if (aviso) out.push({ fecha: masDias(c.ancla, -aviso), que: 'Primer aviso', dias: aviso });
  for (const d of recs) out.push({ fecha: masDias(c.ancla, -d), que: 'Recordatorio', dias: d });
  for (const d of emp) out.push({ fecha: masDias(base, -d), que: d ? 'Último empujón' : sobre === 'hasta' ? 'Último día' : 'El día', dias: d });
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Lo que le falta o lo que está mal, según mc-campanas-piezas (§ 5 Qué escribe, § 6 Bloqueos y las tres reglas). → [texto]
export function revisarCampana(c = {}, hoy = new Date().toISOString().slice(0, 10)) {
  const out = [];
  if (!c.frase) out.push('Falta la frase: la que el equipo repite de memoria');
  if (!c.mbt) out.push('Falta la MUST BE TRUE que mueve (si no traza a ninguna, es un tema, no una campaña)');
  if (!c.se_nota) out.push('Falta en qué se va a notar al cierre');
  if (!c.no_es) out.push('Falta qué NO es');
  if (!c.ancla) out.push('Falta la fecha: sin fecha después de la cual deje de servir, es un pilar');
  const a = anticipacion(c);
  if (c.ancla && c.tipo !== 'campana' && a.filter((x) => x.que !== 'El día').length < 2) out.push('Nunca un solo aviso');
  // Cae en los primeros 7 días del ciclo y ese ciclo ya empezó: el aviso llegó tarde (se debió planear desde el anterior).
  const antes = a[0] && a[0].fecha.slice(0, 7) < c.ancla.slice(0, 7);
  if (c.ancla && +c.ancla.slice(8, 10) <= 7 && c.tipo !== 'campana' && hoy >= c.ancla.slice(0, 8) + '01') out.push('La fecha cae en los primeros 7 días del ciclo: el aviso llegó tarde. Se trabaja igual y se declara');
  else if (antes) out.push(`El primer aviso (${a[0].fecha}) cae en el ciclo anterior: se planifica desde ahí y se avisa a ① Strategy`);
  if (['Borrador'].includes(c.estado) && a[0] && a[0].fecha < hoy) out.push('El primer aviso ya pasó y sigue en borrador');
  if (c.tipo === 'evento' && !c.evento?.objetivo) out.push('El evento no tiene objetivo comercial');
  if (c.tipo === 'evento' && !c.evento?.medicion) out.push('El evento no dice cómo se mide');
  // Campaign Architect: sin blueprint completo ni al menos un brief no hay qué mandarle a Creative.
  const bp = blueprintFaltas(c);
  if (bp.length) out.push(`Blueprint incompleto (${bp.join(', ')}): sin él no se envía a Creative`);
  if (!briefsPara(c).length) out.push('Sin brief creativo: Creative no tiene qué recibir (un brief por cada celda activa del plan de canales)');
  return out;
}

// Las campañas que tocan un mes (de su primer aviso a su último día). mes = AAAA-MM
export function campanasDelMes(xs = [], mes) {
  return xs.filter((c) => c.estado !== 'Archivada' && c.ancla).filter((c) => {
    const a = anticipacion(c), ini = (a[0]?.fecha || c.ancla).slice(0, 7), fin = (c.hasta || c.ancla).slice(0, 7);
    return ini <= mes && mes <= fin;
  });
}
// Una por ciclo, dos como máximo (mc-campanas-piezas § 2). → aviso del mes o ''
export function revisarMes(xs = [], mes) {
  const n = campanasDelMes(xs, mes).filter((c) => c.estado !== 'Cerrada').length;
  return n > 2 ? `${n} campañas en el mismo ciclo: si parecen tres, ninguna está definida (mc-campanas-piezas § 2)` : '';
}
// La próxima fecha de la anticipación desde hoy (para el panel y los avisos). → { fecha, que } | null
export const proximaFecha = (c, hoy = new Date().toISOString().slice(0, 10)) => anticipacion(c).find((x) => x.fecha >= hoy) || null;
// El bloque ```campana``` del Chat (lo que propone ③ Marketing). → campaña limpia o null
export function leerCampana(j) { const c = limpiarCampana(j || {}); return c.nombre ? c : null; }
// El id: <marca>--<nombre>, sin acentos. Mismo nombre en la misma marca = la misma campaña (no se duplica).
export const idCampana = (slug, nombre) => `${slug}--${fold(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)}`;

// ---------- El blueprint, el plan de canales y los briefs ----------
const BLUEPRINT = [['frase', 'la frase'], ['mbt', 'la MUST BE TRUE'], ['se_nota', 'en qué se nota'], ['no_es', 'qué NO es'], ['ancla', 'la fecha']];
// Lo que falta del blueprint (frase, MUST BE TRUE, en qué se nota, qué NO es y la fecha). → ['la frase', …]
export const blueprintFaltas = (c) => BLUEPRINT.filter(([k]) => !cad(c?.[k]).trim()).map(([, n]) => n);
export const idBrief = (fase, canal) => `${fase}.${canal}`;
// La celda de una fase y un canal (siempre existe: vacía si la campaña no la trae).
export const celdaDe = (c, fase, canal) => limpiarCanales(c?.canales)[fase]?.[canal] || celdaVacia();
// Las celdas encendidas, en orden de lectura (fase y luego canal). → [{ fase, canal, celda }]
export function canalesActivos(c) {
  const can = limpiarCanales(c?.canales);
  return FASES_C.flatMap((fase) => CANALES_C.filter((canal) => can[fase][canal].activo).map((canal) => ({ fase, canal, celda: can[fase][canal] })));
}
// Un patch de celdas (el cuerpo de un PUT) sobre lo guardado: las celdas que no vienen se quedan como estaban.
export function mezclarCanales(actual, nuevo) {
  const out = limpiarCanales(actual);
  for (const [kf, fila] of Object.entries(plano(nuevo) ? nuevo : {})) {
    const f = faseDe(kf); if (!f || !plano(fila)) continue;
    for (const [kc, k] of Object.entries(fila)) { const ca = canalDe(kc); if (ca && plano(k)) out[f][ca] = celda({ ...out[f][ca], ...k }); }
  }
  return out;
}
// Los montos son de quien ve costos. canalesConMontos: el plan nuevo, pero con los montos que ya estaban guardados (quien no los ve no los cambia).
export function canalesConMontos(actual, nuevo) {
  const a = limpiarCanales(actual), n = limpiarCanales(nuevo);
  for (const f of FASES_C) for (const k of CANALES_C) n[f][k].monto = a[f][k].monto;
  return n;
}
// Una métrica de resultados que habla de dinero gastado: también es de quien ve costos.
const esDeCosto = (m) => /gasto|inversion|presupuesto|costo|spend/.test(fold(m));
// La campaña sin los montos (para quien no ve costos): cada celda con monto null y sin los resultados de gasto.
export function sinMontos(c) {
  if (!plano(c)) return c;
  const out = { ...c, costs_hidden: true };
  if (plano(c.canales)) {
    out.canales = limpiarCanales(c.canales);
    for (const f of FASES_C) for (const k of CANALES_C) out.canales[f][k].monto = null;
  }
  if (Array.isArray(c.resultados)) out.resultados = c.resultados.filter((r) => !esDeCosto(r?.metrica));
  return out;
}
// La suma de los montos de las celdas encendidas; null si ninguna tiene monto (sin dato no hay total, nunca un 0 inventado).
export function totalMontos(c) {
  const m = canalesActivos(c).map((x) => x.celda.monto).filter((v) => v !== null);
  return m.length ? Math.round(m.reduce((a, v) => a + v, 0) * 100) / 100 : null;
}
// ¿El plan de canales tiene algo escrito? (una celda encendida o con fecha, pieza o monto)
const planConAlgo = (can) => FASES_C.some((f) => CANALES_C.some((k) => { const x = can[f][k]; return x.activo || x.fecha || x.pieza || x.monto !== null; }));
// Crear (POST) una campaña que ya existe la pone al día: lo que el cuerpo no trae (plan, briefs, ligas) se conserva, no se borra.
export function conservarPlan(actual, nueva) {
  const a = limpiarCampana(actual), out = { ...nueva };
  if (!planConAlgo(limpiarCanales(nueva.canales))) out.canales = a.canales;
  if (!nueva.briefs?.length) out.briefs = a.briefs;
  if (!nueva.pauta_id) out.pauta_id = a.pauta_id;
  if (!nueva.entregable_ref) out.entregable_ref = a.entregable_ref;
  return out;
}
// Los resultados solo se agregan (es el aprendizaje de la campaña): lo guardado se queda, lo que no estaba entra con la hora de ahora.
export function resultadosAlGuardar(actual, nuevo, ahora = new Date().toISOString()) {
  const ya = limpiarResultados(actual), llave = (r) => [r.en, r.metrica, r.valor, r.nota].join('\u0001'), vistas = new Set(ya.map(llave));
  const nuevos = limpiarResultados(nuevo).filter((r) => !vistas.has(llave(r))).map((r) => ({ ...r, en: ahora }));
  return [...ya, ...nuevos].slice(0, MAX_RESULTADOS);
}

// La fase a la que pertenece cada paso de la anticipación (anticipacion().que).
const faseDePaso = (que) => (que === 'Primer aviso' ? 'primer-aviso' : que === 'Recordatorio' ? 'recordatorio' : 'ultimo-empujon');
// La fecha en que empieza una fase según la anticipación de la campaña ('' si no la tiene): sirve de fecha sugerida de la celda.
export const fechaDeFase = (c, fase) => anticipacion(c).find((x) => faseDePaso(x.que) === fase)?.fecha || '';
const diasEntre = (a, z) => Math.round((Date.parse(z + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
// La anticipación como un Gantt simple: una barra por fase entre sus fechas (de su primer paso al primero de la siguiente; la última, hasta
// el final). izq y ancho van en % del tramo completo. null si la campaña no tiene fecha o no avisa con anticipación («campaña del ciclo»).
export function ganttDe(c = {}) {
  const pasos = anticipacion(c); if (!pasos.length) return null;
  const desde = pasos[0].fecha, hasta = [...pasos.map((x) => x.fecha), c.ancla, c.hasta].filter(Boolean).sort().at(-1), total = Math.max(1, diasEntre(desde, hasta));
  const pos = (f) => Math.round((diasEntre(desde, f) / total) * 1000) / 10;
  const fases = FASES_C.map((fase) => ({ fase, pasos: pasos.filter((x) => faseDePaso(x.que) === fase) })).filter((g) => g.pasos.length);
  const filas = fases.map((g, i) => {
    const ini = g.pasos[0].fecha, fin = i < fases.length - 1 ? fases[i + 1].pasos[0].fecha : hasta, izq = pos(ini), ancho = Math.min(100 - izq, Math.max(2.5, pos(fin) - izq));
    return { fase: g.fase, nombre: NOMBRE_FASE_C[g.fase], ini, fin, izq, ancho: Math.round(ancho * 10) / 10, pasos: g.pasos.map((x) => ({ fecha: x.fecha, que: x.que, pos: pos(x.fecha) })) };
  });
  return { desde, hasta, dias: total, filas, ancla: { fecha: c.ancla, pos: pos(c.ancla) } };
}

// Los briefs listos para Creative: solo los de celdas encendidas que dicen algo (objetivo o mensaje), en orden de lectura, con la fecha y la
// pieza de su celda (si la celda no trae fecha, la de su fase). Sin montos. → [{ id, fase, canal, fecha, pieza, objetivo, mensaje, formato, cta }]
export function briefsPara(c = {}) {
  const can = limpiarCanales(c?.canales), orden = (b) => FASES_C.indexOf(b.fase) * 10 + CANALES_C.indexOf(b.canal);
  return limpiarBriefs(c?.briefs).map((b, i) => ({ b, i })).filter(({ b }) => can[b.fase][b.canal].activo && (b.objetivo || b.mensaje))
    .sort((x, y) => orden(x.b) - orden(y.b) || x.i - y.i)
    .map(({ b }) => { const k = can[b.fase][b.canal]; return { id: b.id, fase: b.fase, canal: b.canal, fecha: k.fecha || fechaDeFase(c, b.fase), pieza: k.pieza, objetivo: b.objetivo, mensaje: b.mensaje, formato: b.formato, cta: b.cta }; });
}
// Lo que falta para enviar la campaña a Creative: el blueprint completo, un canal encendido y un brief. → ['…'] (vacío = lista)
export function faltaParaCreative(c = {}) {
  const f = [], bp = blueprintFaltas(c);
  if (bp.length) f.push(`el blueprint (${bp.join(', ')})`);
  if (!canalesActivos(c).length) f.push('al menos un canal encendido en el plan');
  if (!briefsPara(c).length) f.push('al menos un brief');
  return f;
}
// El contenido del entregable de Creative Direction Lab: la campaña con sus briefs (sin montos ni ligas internas).
export const contenidoParaCreative = (c = {}) => ({ campana: { id: cad(c.id), nombre: tx(c.nombre, 60), frase: tx(c.frase, 160), mbt: tx(c.mbt, 80), briefs: briefsPara(c) } });
// Cuántos canales y briefs lleva: «2 canales · 3 briefs».
export function resumenPlan(c = {}) {
  const n = canalesActivos(c).length, b = briefsPara(c).length;
  return `${n} ${n === 1 ? 'canal' : 'canales'} · ${b} ${b === 1 ? 'brief' : 'briefs'}`;
}

// ---------- Entradas de otras herramientas ----------
// Una campaña prellenada con lo que trae el entregable de origen (la versión aprobada que lo manda, p. ej. Offer Architect: la oferta que se
// empuja y su mensaje). origen = { tool, titulo, version, contenido }. → { nombre, frase, notas, oferta, mensaje } (lo que no hay, vacío)
export function campanaDeEntrada(origen = {}) {
  const o = plano(origen) ? origen : {}, c = plano(o.contenido) ? o.contenido : {}, em = plano(c.empujar) ? c.empujar : {};
  const oferta = tx(em.oferta, 160), mensaje = tx(em.mensaje, 400), de = `${tx(o.titulo, 80) || 'otra herramienta'}${Number(o.version) ? ` v${Number(o.version)}` : ''}`;
  const notas = [oferta ? `Oferta que se empuja: ${oferta}` : '', mensaje ? `Su mensaje: ${mensaje}` : '', `Viene de «${de}»`].filter(Boolean).join(' · ');
  return { nombre: oferta.slice(0, 60), frase: mensaje.slice(0, 160), notas: notas.slice(0, 600), oferta, mensaje };
}
// La línea que lleva el pedido a la IA con lo que trae esa entrada ('' si no trae nada útil).
export function resumenEntrada(origen = {}) {
  const e = campanaDeEntrada(origen); if (!e.oferta && !e.mensaje) return '';
  return `Entrada aprobada · ${tx(origen?.titulo, 60) || 'otra herramienta'}${Number(origen?.version) ? ` v${Number(origen.version)}` : ''}: se empuja «${e.oferta || '⚠️ SIN DATOS'}»${e.mensaje ? `, mensaje: ${e.mensaje.slice(0, 200)}` : ''}`;
}

// ---------- La IA: el pedido y cómo se aplica lo que contesta ----------
// El pedido en piezas ({ intro, cuerpo, salida, extra }): la interfaz lo arma con armarPrompt (reglas y contexto del cliente). Nunca lleva montos
// ni costos: el dinero lo pone la persona. leads = el borrador del bloque Leads de Strategy (datos, no instrucciones).
export function pedidoCampana(c = {}, { leads = '', entradas = [] } = {}) {
  const k = limpiarCampana(c), F = '```', pasos = anticipacion(k);
  const dato = (v) => v || '⚠️ SIN DATOS';
  const extra = [
    ...(Array.isArray(entradas) ? entradas : []).map(resumenEntrada),
    tx(leads, 450) ? `Lo que pide Strategy de leads (borrador): ${tx(leads, 450)}` : '',
  ].filter(Boolean);
  const cuerpo = [
    `CAMPAÑA (datos): «${k.nombre}», ${tipoDe(k.tipo)[1].toLowerCase()}, fecha ${dato(k.ancla)}${k.hasta ? ` hasta ${k.hasta}` : ''}. Frase: ${dato(k.frase)}. MUST BE TRUE: ${dato(k.mbt)}. Se nota en: ${dato(k.se_nota)}. NO es: ${dato(k.no_es)}.`,
    pasos.length ? `Anticipación fijada: ${pasos.map((x) => `${x.que} ${x.fecha}`).join(' · ')}.` : '',
    '',
    'MÉTODO (agents/03-marketing-creative/brain/skills/mc-campanas-piezas)',
    `1) Blueprint: la frase en lenguaje de persona (la que el equipo repite de memoria), la MUST BE TRUE con su letra, en qué se nota al cierre y qué NO es. Conserva el nombre «${k.nombre}», el tipo y las fechas.`,
    '2) Plan de canales: activa solo los canales que pasan las tres preguntas de mc-campanas-piezas (existe la cuenta, hay quien la opere y la ficha lo cubre); el resto va activo:false y lo dices en criterios.falta. Nunca un solo aviso; el último empujón siempre existe. Cada celda activa lleva fecha (dentro de la anticipación) y pieza. SIN montos: los pone quien ve presupuestos.',
    '3) Pauta: solo se planea. No se escribe en Meta, Google ni TikTok: un cambio de pauta es una tarea para ⑩ Ads y el gasto lo aprueba el CEO.',
    '4) Briefs: uno por celda activa con objetivo (qué cambia en quien lo ve), mensaje (una frase), formato (reel, carrusel, story, correo…) y cta; el cta respeta lo que pide Strategy de leads.',
  ].filter((x, i, a) => x !== '' || a[i - 1] !== '');
  const json = `{"nombre":"${k.nombre.replace(/"/g, '')}","frase":"…","mbt":"B · …","se_nota":"…","no_es":"…","canales":{"primer-aviso":{"instagram":{"activo":true,"fecha":"AAAA-MM-DD","pieza":"…"},"email":{"activo":false}},"recordatorio":{…},"ultimo-empujon":{…}},"briefs":[{"fase":"primer-aviso","canal":"instagram","objetivo":"…","mensaje":"…","formato":"reel","cta":"…"}]}`;
  const salida = ['Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):', `${F}${BLOQUE}`, json, F, `${F}criterios`, '{"entregable":"Campaign Architect","cumple":["…"],"falta":["… — por qué"]}', F];
  return { intro: `Eres Marketing (③ Marketing) de Inherent. Arma el blueprint, el plan de canales y los briefs creativos de «${k.nombre}» (Campaign Architect).`, cuerpo, salida, extra };
}
// Lo que contesta la IA (ya limpio con limpiarCampana) sobre la campaña de pantalla. Nada de dinero: los montos de lo que había se quedan.
// blueprint:false deja frase, MUST BE TRUE, se nota y NO es como estaban (solo canales y briefs). La fecha solo entra si la campaña no tenía.
// Una celda encendida sin fecha toma la de su fase. Los briefs de la propuesta reemplazan los de su celda; los de las celdas que no toca se quedan.
export function fusionarPropuesta(actual, propuesta, { blueprint = true } = {}) {
  const a = limpiarCampana(actual), p = limpiarCampana(propuesta), out = { ...(plano(actual) ? actual : {}), ...a };
  if (blueprint) {
    for (const k of ['frase', 'mbt', 'se_nota', 'no_es']) if (p[k]) out[k] = p[k];
    if (!a.ancla && p.ancla) { out.ancla = p.ancla; if (p.hasta) out.hasta = p.hasta; }
  }
  out.canales = canalesConMontos(a.canales, p.canales);
  for (const f of FASES_C) for (const k of CANALES_C) { const x = out.canales[f][k]; if (x.activo && !x.fecha) x.fecha = fechaDeFase(out, f); } // sin fecha propuesta: la de su fase
  const tocadas = new Set(p.briefs.map((b) => `${b.fase}|${b.canal}`));
  out.briefs = limpiarBriefs([...p.briefs, ...a.briefs.filter((b) => !tocadas.has(`${b.fase}|${b.canal}`))]);
  return out;
}
