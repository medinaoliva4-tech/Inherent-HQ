// Motor durable de workflows (B2): una máquina de estados en la base (colección `wf_runs`), sin servidor aparte.
//   definición (versionada, inmutable) ──▶ corrida ──▶ pasos con dependencias ──▶ adaptadores (preparar · ejecutar · conciliar)
// Lo que garantiza (cada punto tiene su prueba en scripts/test-vision-workflow.mjs):
//   · IDEMPOTENCIA  — la misma llave devuelve la MISMA corrida; cada paso lleva su llave `<corrida>:<paso>` para el adaptador;
//   · LEASES        — un paso «corriendo» tiene dueño y vencimiento; si el proceso muere, otro lo recupera (y solo se REINTENTA lo que es seguro);
//   · REINTENTOS    — solo adaptadores idempotentes (`seguro`) y solo errores marcados `reintentable`, con espera creciente;
//   · APROBACIÓN    — un paso de aprobación espera a una persona y se aprueba SOBRE un hash del contenido exacto; cambiar algo invalida el OK;
//   · CUMPLIMIENTO  — lo que envía, publica o gasta (adaptador `externo`) no se define sin una aprobación antes: ni el CEO se la salta;
//   · LÍMITES       — cada proveedor tiene un tope por ventana de tiempo;
//   · BITÁCORA      — cada cambio deja un evento, sin secretos; los eventos salen por una bandeja de salida (outbox) que se vacía sin duplicar.
// El OS no gasta ni publica por su cuenta: los adaptadores reales se conectan aparte y dicen `sin_conexion` mientras no lo estén.
import crypto from 'node:crypto';
import * as db from './db.js';
import { canon } from '../../public/js/entregables.js';

export const COLL_DEF = 'wf_defs', COLL_RUN = 'wf_runs', COLL_EVT = 'wf_events', COLL_LIM = 'wf_limits';
export const MAX_PASOS = 40, MAX_EVENTOS = 200, LEASE_MS = 60_000;
export const ESTADOS_PASO = ['pendiente', 'corriendo', 'esperando', 'hecho', 'fallido', 'omitido'];
export const ESTADOS_RUN = ['en_cola', 'corriendo', 'esperando_aprobacion', 'completado', 'fallido', 'cancelado'];
const hash = (x) => crypto.createHash('sha256').update(canon(x)).digest('hex');
const fail = (status, code, message, extra = {}) => { throw Object.assign(new Error(message), { status, code, ...extra }); };
const idOk = (s) => /^[a-z0-9][\w-]{0,59}$/.test(String(s || ''));
const iso = (t) => new Date(t).toISOString();

// ---------- Bitácora sin secretos ----------
const SECRETOS = /(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{12,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}|xox[abp]-[A-Za-z0-9-]{10,}|(?:password|contraseña|secret|token|api[_-]?key)\s*[:=]\s*\S+)/gi;
export const redactar = (x) => String(x ?? '').replace(SECRETOS, '«secreto»').replace(/\s+/g, ' ').trim().slice(0, 300);

// ---------- Definiciones ----------
// def = { id, nombre, pasos:[{ id, tipo:'accion'|'aprobacion', adaptador, depende:[], params, proveedor, reintentos:{max}, aprueba:'ceo'|'coo' }] }
export function validarDefinicion(def, { adaptadores = {} } = {}) {
  const errs = [], pasos = Array.isArray(def?.pasos) ? def.pasos : [];
  if (!idOk(def?.id)) errs.push('el id de la definición no sirve');
  if (!pasos.length || pasos.length > MAX_PASOS) errs.push(`debe tener entre 1 y ${MAX_PASOS} pasos`);
  const ids = new Set();
  for (const p of pasos) {
    if (!idOk(p?.id) || ids.has(p.id)) errs.push(`paso repetido o con id inválido: ${redactar(p?.id)}`); ids.add(p?.id);
    if (!['accion', 'aprobacion'].includes(p?.tipo)) errs.push(`el paso ${p?.id} tiene un tipo desconocido`);
    if (p?.tipo === 'accion' && !adaptadores[p.adaptador]) errs.push(`el paso ${p.id} usa un adaptador que no existe: ${redactar(p.adaptador)}`);
    if (p?.tipo === 'aprobacion' && !['ceo', 'coo'].includes(p.aprueba || 'coo')) errs.push(`el paso ${p.id} dice que aprueba alguien que no existe`);
  }
  for (const p of pasos) for (const d of p?.depende || []) if (!ids.has(d)) errs.push(`el paso ${p.id} depende de «${redactar(d)}», que no existe`);
  // Sin ciclos (Kahn).
  const entra = new Map(pasos.map((p) => [p.id, (p.depende || []).length])); const cola = [...entra].filter(([, n]) => n === 0).map(([k]) => k); let hechos = 0;
  while (cola.length) { const x = cola.shift(); hechos++; for (const p of pasos) if ((p.depende || []).includes(x)) { entra.set(p.id, entra.get(p.id) - 1); if (entra.get(p.id) === 0) cola.push(p.id); } }
  if (hechos < pasos.length && !errs.length) errs.push('hay un ciclo de dependencias');
  // CUMPLIMIENTO: todo paso externo (envía, publica, gasta) tiene una aprobación entre sus ancestros.
  const por = new Map(pasos.map((p) => [p.id, p]));
  const ancestros = (id, vistos = new Set()) => { for (const d of por.get(id)?.depende || []) if (!vistos.has(d)) { vistos.add(d); ancestros(d, vistos); } return vistos; };
  if (!errs.length) for (const p of pasos) if (p.tipo === 'accion' && adaptadores[p.adaptador]?.externo && ![...ancestros(p.id)].some((a) => por.get(a)?.tipo === 'aprobacion'))
    errs.push(`el paso ${p.id} envía, publica o gasta («${p.adaptador}») y no tiene una aprobación antes`);
  return { ok: !errs.length, errores: errs };
}
export async function guardarDefinicion(u, def, { adaptadores }) {
  const v = validarDefinicion(def, { adaptadores }); if (!v.ok) fail(400, 'DEFINICION', v.errores.join(' · '), { errores: v.errores });
  const previas = (await db.list(COLL_DEF)).filter((d) => d.def_id === def.id), version = previas.reduce((m, d) => Math.max(m, d.version), 0) + 1;
  const pasos = def.pasos.map((p) => ({ id: p.id, tipo: p.tipo, adaptador: p.adaptador || '', depende: p.depende || [], params: p.params ?? {}, proveedor: p.proveedor || '', reintentos: { max: Math.min(5, Math.max(0, Number(p.reintentos?.max) || 0)) }, aprueba: p.aprueba || 'coo' }));
  return db.create(COLL_DEF, { def_id: def.id, nombre: String(def.nombre || def.id).slice(0, 120), version, pasos }, u.email, `${def.id}--v${version}`);
}

// ---------- Corridas ----------
export async function iniciar(u, def, { key, input = {}, client_slug = '' } = {}) {
  if (!key || String(key).length > 120) fail(400, 'LLAVE', 'Falta la llave de idempotencia');
  const id = hash({ owner: u.email, def: def.def_id, key }).slice(0, 32), ya = await db.get(COLL_RUN, id);
  if (ya) return { run: ya, repetida: true }; // la misma llave = la misma corrida, sin duplicar nada
  const pasos = Object.fromEntries(def.pasos.map((p) => [p.id, { estado: 'pendiente', intentos: 0 }]));
  const run = await db.create(COLL_RUN, { def_id: def.def_id, def_version: def.version, client_slug, estado: 'en_cola', owner: u.email, input: input ?? {}, pasos, resultados: {}, eventos: [], rev: 1 }, u.email, id);
  await evento(run, 'inicio', '', `Corrida creada con la definición ${def.def_id} v${def.version}`);
  return { run: await db.get(COLL_RUN, id), repetida: false };
}
async function evento(run, tipo, paso, texto) {
  const e = { en: iso(Date.now()), tipo, paso, texto: redactar(texto) };
  const cur = await db.get(COLL_RUN, run.id); if (!cur) return;
  await db.update(COLL_RUN, run.id, { ...cur, eventos: [...(cur.eventos || []), e].slice(-MAX_EVENTOS) }, cur.v, 'workflow').catch(() => null); // la bitácora nunca tumba la corrida
  await db.create(COLL_EVT, { run_id: run.id, ...e, entregado: false }, 'workflow'); // bandeja de salida: se vacía con drenar()
}
// Cambia una corrida con compare-and-set: si alguien la tocó antes, null y se reintenta con lo nuevo.
async function cambiar(run, fn) {
  for (let i = 0; i < 5; i++) {
    const cur = await db.get(COLL_RUN, run.id); if (!cur) return null;
    const next = fn(structuredClone(cur)); if (!next) return cur;
    const ok = await db.update(COLL_RUN, run.id, { ...next, rev: (cur.rev || 1) + 1 }, cur.v, 'workflow'); if (ok) return ok;
  }
  fail(409, 'CONFLICTO', 'La corrida cambió justo ahora. Vuelve a intentar.');
}
const defDe = async (run) => db.get(COLL_DEF, `${run.def_id}--v${run.def_version}`);
const listos = (def, run) => def.pasos.filter((p) => run.pasos[p.id].estado === 'pendiente' && (p.depende || []).every((d) => run.pasos[d].estado === 'hecho'));
// El contenido EXACTO que se aprueba: la definición del paso, la entrada y lo que dieron los pasos de los que depende.
export const hashAprobacion = (def, run, pasoId) => { const p = def.pasos.find((x) => x.id === pasoId); return hash({ def: `${def.def_id}@${def.version}`, paso: p, input: run.input, antes: Object.fromEntries((p.depende || []).map((d) => [d, run.resultados[d] ?? null])) }); };
const recalcular = (def, run) => {
  const ps = Object.values(run.pasos);
  if (run.estado === 'cancelado') return run;
  if (ps.some((p) => p.estado === 'fallido')) { run.estado = 'fallido'; for (const [id, p] of Object.entries(run.pasos)) if (p.estado === 'pendiente') run.pasos[id] = { ...p, estado: 'omitido' }; }
  else if (ps.every((p) => ['hecho', 'omitido'].includes(p.estado))) run.estado = 'completado';
  else if (ps.some((p) => p.estado === 'esperando')) run.estado = 'esperando_aprobacion';
  else run.estado = ps.some((p) => p.estado === 'corriendo') ? 'corriendo' : 'en_cola';
  return run;
};

// ---------- Límites por proveedor ----------
export async function tomarCupo(proveedor, { max, ventanaMs }, ahora = Date.now()) {
  if (!proveedor || !max) return { ok: true };
  const cubo = Math.floor(ahora / ventanaMs), id = `${proveedor}--${cubo}`, d = await db.get(COLL_LIM, id);
  if (!d) { await db.create(COLL_LIM, { proveedor, cubo, n: 1 }, 'workflow', id).catch(() => null); return { ok: true }; }
  if (d.n >= max) return { ok: false, reintentarEn: (cubo + 1) * ventanaMs - ahora };
  return (await db.update(COLL_LIM, id, { ...d, n: d.n + 1 }, d.v, 'workflow')) ? { ok: true } : tomarCupo(proveedor, { max, ventanaMs }, ahora);
}

// ---------- El motor ----------
// adaptadores: { nombre: { externo?:bool, seguro?:bool, capability():{estado,razon}, execute({params,input,resultados,llave}), reconcile?({llave}) } }
// → devuelve la corrida ya avanzada hasta donde se pudo (se detiene en una aprobación, un fallo o la espera de un reintento).
export async function avanzar(runId, { adaptadores, limites = {}, ahora = Date.now(), dueno = `w-${process.pid}` }) {
  let run = await db.get(COLL_RUN, runId); if (!run) fail(404, 'NO_EXISTE', 'No existe esa corrida');
  const def = await defDe(run); if (!def) fail(409, 'DEFINICION', 'La definición de esta corrida ya no existe');
  run = await recuperar(run, def, { adaptadores, ahora });
  for (let vuelta = 0; vuelta < MAX_PASOS * 2; vuelta++) {
    run = await db.get(COLL_RUN, runId); if (['completado', 'fallido', 'cancelado'].includes(run.estado)) break;
    const paso = listos(def, run).find((p) => !(run.pasos[p.id].no_antes > ahora)); if (!paso) break;
    if (paso.tipo === 'aprobacion') { run = await cambiar(run, (r) => { r.pasos[paso.id] = { ...r.pasos[paso.id], estado: 'esperando', hash: hashAprobacion(def, r, paso.id), aprueba: paso.aprueba }; return recalcular(def, r); }); await evento(run, 'espera', paso.id, `Espera la aprobación del ${paso.aprueba.toUpperCase()}`); break; }
    await ejecutarPaso(run, def, paso, { adaptadores, limites, ahora, dueno });
  }
  return db.get(COLL_RUN, runId);
}
async function ejecutarPaso(run, def, paso, { adaptadores, limites, ahora, dueno }) {
  const ad = adaptadores[paso.adaptador], llave = `${run.id}:${paso.id}`;
  const cap = ad?.capability?.() ?? { estado: 'ready' };
  if (!ad || cap.estado !== 'ready') { // sin conexión o sin permiso: se dice, no se finge ni se reintenta
    await cambiar(run, (r) => { r.pasos[paso.id] = { ...r.pasos[paso.id], estado: 'fallido', error: redactar(cap.razon || 'sin conexión'), codigo: cap.estado === 'needs_permission' ? 'necesita_permiso' : 'sin_conexion' }; return recalcular(def, r); });
    return evento(run, 'fallo', paso.id, `${paso.adaptador}: ${cap.estado || 'disconnected'} · ${cap.razon || 'sin conexión'}`);
  }
  const cupo = await tomarCupo(paso.proveedor || paso.adaptador, limites[paso.proveedor || paso.adaptador] || {}, ahora);
  if (!cupo.ok) { await cambiar(run, (r) => { r.pasos[paso.id] = { ...r.pasos[paso.id], no_antes: ahora + cupo.reintentarEn }; return r; }); return evento(run, 'limite', paso.id, `Tope de ${paso.proveedor || paso.adaptador}: espera ${Math.ceil(cupo.reintentarEn / 1000)} s`); }
  // Toma el lease (CAS): si otro proceso lo tomó antes, este no ejecuta.
  const tomado = await cambiar(run, (r) => { const p = r.pasos[paso.id]; if (p.estado !== 'pendiente') return null; r.pasos[paso.id] = { ...p, estado: 'corriendo', intentos: p.intentos + 1, lease: { dueno, exp: ahora + LEASE_MS } }; return recalcular(def, r); });
  if (tomado.pasos[paso.id].lease?.dueno !== dueno || tomado.pasos[paso.id].estado !== 'corriendo') return;
  await evento(run, 'inicio_paso', paso.id, `Intento ${tomado.pasos[paso.id].intentos} de ${paso.adaptador}`);
  try {
    const resultado = await ad.execute({ params: paso.params, input: tomado.input, resultados: tomado.resultados, llave });
    await cambiar(run, (r) => { if (r.estado === 'cancelado') return null; const { lease, ...p } = r.pasos[paso.id]; r.pasos[paso.id] = { ...p, estado: 'hecho', fin: iso(ahora) }; r.resultados[paso.id] = resultado ?? null; return recalcular(def, r); });
    await evento(run, 'hecho', paso.id, 'Paso terminado');
  } catch (e) {
    const reintentable = Boolean(e?.reintentable && ad.seguro && tomado.pasos[paso.id].intentos <= (paso.reintentos?.max || 0));
    await cambiar(run, (r) => { if (r.estado === 'cancelado') return null; const { lease, ...p } = r.pasos[paso.id]; r.pasos[paso.id] = reintentable ? { ...p, estado: 'pendiente', no_antes: ahora + 1000 * 2 ** p.intentos, error: redactar(e?.message) } : { ...p, estado: 'fallido', error: redactar(e?.message), codigo: e?.codigo || 'error' }; return recalcular(def, r); });
    await evento(run, reintentable ? 'reintento' : 'fallo', paso.id, `${e?.message || 'error'}${reintentable ? ' · se reintenta' : ''}`);
  }
}
// Un proceso murió a mitad de un paso: su lease venció. Si el adaptador es seguro (idempotente) se reintenta; si sabe conciliar, concilia;
// si no, NO se repite a ciegas: queda fallido con «resultado desconocido» para que una persona lo mire (nunca doble envío).
async function recuperar(run, def, { adaptadores, ahora }) {
  for (const p of def.pasos) {
    const s = run.pasos[p.id]; if (s.estado !== 'corriendo' || !(s.lease?.exp < ahora)) continue;
    const ad = adaptadores[p.adaptador];
    if (ad?.reconcile) {
      const r = await ad.reconcile({ llave: `${run.id}:${p.id}` }).catch(() => null);
      if (r?.hecho) { run = await cambiar(run, (x) => { const { lease, ...q } = x.pasos[p.id]; x.pasos[p.id] = { ...q, estado: 'hecho', conciliado: true }; x.resultados[p.id] = r.resultado ?? null; return recalcular(def, x); }); await evento(run, 'conciliado', p.id, 'Ya se había hecho: conciliado sin repetir'); continue; }
    }
    const seguro = Boolean(ad?.seguro);
    run = await cambiar(run, (x) => { const { lease, ...q } = x.pasos[p.id]; x.pasos[p.id] = seguro ? { ...q, estado: 'pendiente' } : { ...q, estado: 'fallido', codigo: 'resultado_desconocido', error: 'El proceso se cortó a mitad de este paso y no se sabe si terminó. Revísalo antes de repetirlo.' }; return recalcular(def, x); });
    await evento(run, 'recuperado', p.id, seguro ? 'Lease vencido: vuelve a la cola (es seguro repetirlo)' : 'Lease vencido: resultado desconocido, lo revisa una persona');
  }
  return db.get(COLL_RUN, run.id);
}

// ---------- El despertador: qué corridas ya toca avanzar ----------
// Una corrida está «vencida» si tiene un paso listo (y su espera de reintento ya pasó) o un lease que murió. Las que esperan a una persona NO.
// → [{ run, def, pasosListos }] por antigüedad, hasta `limite`. No ejecuta nada: eso lo hace avanzar().
export async function corridasVencidas({ ahora = Date.now(), limite = 20 } = {}) {
  const out = [];
  for (const run of await db.list(COLL_RUN)) {
    if (!['en_cola', 'corriendo'].includes(run.estado)) continue;
    const def = await defDe(run); if (!def) continue;
    const muerto = def.pasos.some((p) => run.pasos[p.id]?.estado === 'corriendo' && run.pasos[p.id].lease?.exp < ahora);
    const pasosListos = listos(def, run).filter((p) => !(run.pasos[p.id].no_antes > ahora));
    if (muerto || pasosListos.length) out.push({ run, def, pasosListos });
  }
  return out.sort((a, z) => String(a.run._meta?.created_at).localeCompare(String(z.run._meta?.created_at))).slice(0, limite);
}

// ---------- Personas: aprobar y cancelar ----------
export async function aprobar(u, runId, pasoId, { hash: h, v }) {
  const run = await db.get(COLL_RUN, runId); if (!run) fail(404, 'NO_EXISTE', 'No existe esa corrida');
  const def = await defDe(run), p = def?.pasos.find((x) => x.id === pasoId), s = run.pasos[pasoId];
  if (!p || p.tipo !== 'aprobacion' || s?.estado !== 'esperando') fail(409, 'PASO', 'Ese paso no está esperando aprobación');
  if (!(p.aprueba === 'ceo' ? u.role === 'ceo' : ['ceo', 'coo'].includes(u.role))) fail(403, 'ROL', p.aprueba === 'ceo' ? 'Solo el CEO aprueba esto' : 'Solo el CEO o el COO aprueban esto');
  if (v == null || Number(v) !== run.v) fail(409, 'CONFLICTO', 'Alguien cambió la corrida justo ahora. Recarga y vuelve a revisar.');
  if (h !== hashAprobacion(def, run, pasoId) || h !== s.hash) fail(409, 'CAMBIO', 'Lo que ibas a aprobar cambió. Revísalo otra vez.');
  const r = await cambiar(run, (x) => { x.pasos[pasoId] = { ...x.pasos[pasoId], estado: 'hecho', aprobado: { por: u.email, en: iso(Date.now()) } }; x.resultados[pasoId] = { aprobado_por: u.email }; return recalcular(def, x); });
  await evento(r, 'aprobado', pasoId, `Aprobado por ${u.role.toUpperCase()}`); return r;
}
export async function cancelar(u, runId) {
  const run = await db.get(COLL_RUN, runId); if (!run) fail(404, 'NO_EXISTE', 'No existe esa corrida');
  if (!['ceo', 'coo'].includes(u.role) && run.owner !== u.email) fail(403, 'ROL', 'Solo quien la inició, el COO o el CEO la cancelan');
  if (['completado', 'fallido', 'cancelado'].includes(run.estado)) fail(409, 'PASO', `Ya está ${run.estado}`);
  const r = await cambiar(run, (x) => { x.estado = 'cancelado'; for (const [id, p] of Object.entries(x.pasos)) if (['pendiente', 'esperando'].includes(p.estado)) x.pasos[id] = { ...p, estado: 'omitido' }; return x; });
  await evento(r, 'cancelado', '', `Cancelada por ${u.email}`); return r;
}

// ---------- Bandeja de salida (outbox): entrega cada evento UNA vez ----------
export async function drenar(entregar, { limite = 100 } = {}) {
  let n = 0;
  for (const e of (await db.list(COLL_EVT)).filter((x) => !x.entregado).sort((a, z) => String(a.en).localeCompare(String(z.en))).slice(0, limite)) {
    const marcado = await db.update(COLL_EVT, e.id, { ...e, entregado: true }, e.v, 'workflow'); if (!marcado) continue; // otro proceso lo tomó
    try { await entregar(e); n++; } catch { await db.update(COLL_EVT, e.id, { ...marcado, entregado: false }, marcado.v, 'workflow').catch(() => null); }
  }
  return n;
}
