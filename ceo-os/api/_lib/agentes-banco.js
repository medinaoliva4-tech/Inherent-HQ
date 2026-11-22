// Constructor de agentes con banco de pruebas + Router de costo (servidor). La lógica pura vive en public/js/sistemas/agente-spec.js.
// Tres colecciones propias — NO pasan por /api/db (collGuard no las conoce → 404); solo estas rutas, que aplican las reglas:
//   · agent_specs      — la especificación de un agente. VERSIONADA E INMUTABLE: editar crea la versión siguiente; nada la actualiza.
//   · agent_benchmarks — lo que pasó con cada versión: bancos corridos (tipo «banco») y activaciones (tipo «activacion»). Solo se agrega.
//   · ai_budgets       — la configuración que aprueba el CEO (precios por modelo, topes por persona y cliente, política de activación),
//                        lo gastado por alcance y mes (con compare-and-set: dos peticiones a la vez no se pasan del tope) y el libro de gasto por tarea.
// Reglas: quien construye es el CEO, el COO o quien tenga el perfil «ai-engineer» con el área `work` en edición; un cliente del portal no ve nada (404);
// el equipo ve solo lo que cae en su alcance. El OS no gasta por su cuenta: el ejecutor (el modelo) se conecta aparte y, sin él, el banco dice
// `disconnected`. Lo que envía, publica o gasta se activa en BORRADOR y sus acciones piden aprobación humana siempre.
import crypto from 'node:crypto';
import * as db from './db.js';
import { guard, scoper, edits } from './access.js';
import { body } from './http.js';
import { redactar } from './workflow.js';
import { canon } from '../../public/js/entregables.js';
import {
  validarSpec, validarCasos, correrBanco, puedeActivar, elegirModelo, tomarPresupuesto, estadoDeTope, costoDe, mesDe,
  MODELOS_IDS, POLITICA_BASE, AVISO_BASE,
} from '../../public/js/sistemas/agente-spec.js';

export const COLL_SPEC = 'agent_specs', COLL_BANCO = 'agent_benchmarks', COLL_PRESUPUESTO = 'ai_budgets';
export const PERFIL_CONSTRUCTOR = 'ai-engineer';
const sha = (x) => crypto.createHash('sha256').update(canon(x)).digest('hex');
const reciente = (z, a) => new Date(z._meta?.created_at).getTime() - new Date(a._meta?.created_at).getTime();
const lc = (x) => String(x || '').toLowerCase();
const idOk = (s) => /^[a-z0-9][\w-]{0,59}$/.test(String(s || ''));
const fail = (status, code, message, extra = {}) => { throw Object.assign(new Error(message), { status, code, ...extra }); };
const err = (res, e) => res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo completar. Vuelve a intentar.', code: e.code || 'SERVIDOR', ...(e.errores ? { errores: e.errores } : {}), ...(e.razones ? { razones: e.razones } : {}) });
const alto = (u) => ['ceo', 'coo'].includes(u.role);
export const puedeConstruir = (u) => alto(u) || ((u.roles || []).includes(PERFIL_CONSTRUCTOR) && edits(u, 'work'));

// ---------- Lo que aprueba el CEO: precios, topes y política ----------
export async function leerConfig() {
  const c = await db.get(COLL_PRESUPUESTO, 'config');
  return { precios: c?.precios || {}, topes: { persona: c?.topes?.persona || {}, cliente: c?.topes?.cliente || {} }, aviso: c?.aviso ?? AVISO_BASE, politica: { ...POLITICA_BASE, ...(c?.politica || {}) }, aprobado: Boolean(c) };
}
const esNum = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
export function validarConfig(b) {
  const errs = [], out = {};
  if (b.precios !== undefined) {
    const p = b.precios, lim = {};
    if (!p || typeof p !== 'object' || Array.isArray(p) || Object.keys(p).length > 60) errs.push('los precios: un objeto con un precio por modelo');
    else for (const [m, v] of Object.entries(p)) { if (!/^[a-z0-9][a-z0-9._:/-]{0,63}$/.test(m) || !esNum(v?.in) || !esNum(v?.out)) errs.push(`el precio de «${m.slice(0, 40)}» debe llevar in y out (USD por 1M de tokens)`); else lim[m] = { in: v.in, out: v.out }; }
    out.precios = lim;
  }
  if (b.topes !== undefined) {
    const t = { persona: {}, cliente: {} };
    for (const k of ['persona', 'cliente']) for (const [clave, v] of Object.entries(b.topes?.[k] || {})) {
      if (!(k === 'persona' ? /^[^\s@]+@[^\s@]+$/.test(clave) : /^[a-z0-9][a-z0-9-]{0,63}$/.test(clave)) || !esNum(v)) errs.push(`el tope de ${k} «${clave.slice(0, 40)}» no es válido`); else t[k][lc(clave)] = v;
    }
    out.topes = t;
  }
  if (b.aviso !== undefined) { if (!(typeof b.aviso === 'number' && b.aviso > 0 && b.aviso <= 1)) errs.push('el aviso es una fracción entre 0 y 1'); else out.aviso = b.aviso; }
  if (b.politica !== undefined) {
    const p = b.politica || {}, pol = {};
    if (p.minCasos !== undefined) { if (Number.isInteger(p.minCasos) && p.minCasos >= 1 && p.minCasos <= 50) pol.minCasos = p.minCasos; else errs.push('minCasos va de 1 a 50'); }
    if (p.calidadMin !== undefined) { if (typeof p.calidadMin === 'number' && p.calidadMin > 0 && p.calidadMin <= 1) pol.calidadMin = p.calidadMin; else errs.push('calidadMin va entre 0 y 1'); }
    if (p.exigirCosto !== undefined) { if (typeof p.exigirCosto === 'boolean') pol.exigirCosto = p.exigirCosto; else errs.push('exigirCosto es sí o no'); }
    out.politica = pol;
  }
  if (!Object.keys(out).length && !errs.length) errs.push('no hay nada que guardar');
  return { ok: !errs.length, errores: errs, config: out };
}

// ---------- Presupuesto: tomar, devolver y liquidar con compare-and-set ----------
const gastoId = (alcance, clave, mes) => `g--${alcance}--${lc(clave)}--${mes}`;
// Toma `monto` del alcance de forma atómica: dos peticiones a la vez no pasan del tope (una gana, la otra se corta).
async function tomarEn(alcance, clave, tope, monto, ahora, aviso) {
  const mes = mesDe(ahora), id = gastoId(alcance, clave, mes);
  for (let i = 0; i < 10; i++) {
    const d = await db.get(COLL_PRESUPUESTO, id);
    const r = tomarPresupuesto({ aviso, [alcance]: { tope, gastado: d?.gastado ?? 0, mes } }, monto, ahora);
    if (!r.ok) return r;
    const nuevo = r.siguiente[alcance].gastado;
    if (!d) { try { await db.create(COLL_PRESUPUESTO, { tipo: 'gasto', alcance, clave: lc(clave), mes, gastado: nuevo }, 'presupuesto', id); return r; } catch (e) { if (/duplicate|unique/i.test(e.message)) continue; throw e; } }
    if (await db.update(COLL_PRESUPUESTO, id, { ...d, gastado: nuevo }, d.v, 'presupuesto')) return r;
  }
  fail(409, 'CONFLICTO', 'El presupuesto cambió justo ahora. Vuelve a intentar.');
}
async function ajustar(alcance, clave, mes, delta) {
  const id = gastoId(alcance, clave, mes);
  for (let i = 0; i < 10; i++) {
    const d = await db.get(COLL_PRESUPUESTO, id); if (!d) return;
    if (await db.update(COLL_PRESUPUESTO, id, { ...d, gastado: Math.max(0, Math.round((d.gastado + delta) * 1e8) / 1e8) }, d.v, 'presupuesto')) return;
  }
}
// Reserva `monto` en cada alcance que tenga tope aprobado (persona, cliente; el agente con su tope mensual). Si uno corta, devuelve lo ya tomado.
export async function reservar({ persona, cliente = '', agente = '', topeAgente = null }, monto, { ahora = Date.now(), config = null } = {}) {
  const cfg = config || await leerConfig(), mes = mesDe(ahora), tomados = [], avisos = [], sinTope = [];
  const alcances = [['persona', persona, cfg.topes?.persona?.[lc(persona)]], ['cliente', cliente, cfg.topes?.cliente?.[lc(cliente)]], ['agente', agente, topeAgente]].filter(([, clave]) => clave);
  for (const [alcance, clave, tope] of alcances) {
    if (!esNum(tope)) { sinTope.push(alcance); continue; }
    const r = await tomarEn(alcance, clave, tope, monto, ahora, cfg.aviso);
    if (!r.ok) { for (const t of tomados) await ajustar(t.alcance, t.clave, mes, -monto); return { ok: false, alcance, mensajes: r.mensajes, estado: r.estado }; }
    tomados.push({ alcance, clave }); if (r.estado === 'aviso') avisos.push(...r.mensajes);
  }
  return { ok: true, tomados, monto, mes, avisos, sinTope };
}
// Al terminar: lo real reemplaza a la reserva. Costo desconocido (null) = se suelta toda la reserva y el libro dice «sin dato».
export async function liquidar(h, real) {
  const delta = (real == null ? 0 : real) - h.monto;
  if (delta !== 0) for (const t of h.tomados) await ajustar(t.alcance, t.clave, h.mes, delta);
}
export const liberar = (h) => liquidar(h, 0);
async function anotarGasto(e) { return db.create(COLL_PRESUPUESTO, { tipo: 'libro', ...e }, 'presupuesto'); }

// ---------- Lecturas ----------
const ultimaVersion = async (agentId) => (await db.list(COLL_SPEC)).filter((d) => d.agent_id === agentId).sort((a, z) => z.version - a.version)[0] || null;
async function deVersion(agentId, version) {
  if (version == null || version === '') return ultimaVersion(agentId);
  return db.get(COLL_SPEC, `${agentId}--v${Number(version)}`);
}
async function enAlcance(u, doc) {
  const slug = doc?.spec?.contexto?.cliente; if (!slug) return true;
  const sc = await scoper(u); return !sc || (typeof sc.client === 'function' ? Boolean(sc.client(slug)) : true);
}
const vistaSpec = (d) => ({ id: d.agent_id, version: d.version, hash: d.hash, spec: d.spec, creado_por: d._meta?.created_by, creado: d._meta?.created_at });
const resumenBanco = (b) => ({ id: b.id, version: b.version, modelo: b.modelo, calidad: b.reporte.calidad, n: b.reporte.n, costo_por_caso: b.reporte.costo_por_caso, costo_etiqueta: b.reporte.costo_etiqueta, p95_ms: b.reporte.p95_ms, fallas_criticas: b.reporte.fallas_criticas, creado: b._meta?.created_at });
async function estadoActivacion(agentId, version, bancos) {
  const act = bancos.filter((b) => b.tipo === 'activacion' && b.agent_id === agentId && b.version === version).sort((a, z) => z.seq - a.seq)[0];
  return act ? { estado: act.modo, desde: act._meta?.created_at, por: act.por } : { estado: 'sin_activar' };
}

export function rutas(on, { ejecutor = null, juez = null, ahora = () => Date.now() } = {}) {
  // Un cliente del portal nunca ve nada de esto (404, ni siquiera sabe que existe); el equipo entra por el área `work`.
  const abre = async (req, res, { write = false } = {}) => {
    const u = await guard(req, res, undefined, { client: true }); if (!u) return null;
    if (u.role === 'client') { res.status(404).json({ error: 'No existe' }); return null; }
    if (!u.areas.includes('work')) { res.status(403).json({ error: 'Sin acceso a esta área' }); return null; }
    if (write && !puedeConstruir(u)) { res.status(403).json({ error: 'Solo el CEO, el COO o el perfil AI engineer construyen agentes' }); return null; }
    return u;
  };
  const deAgente = async (req, res, u) => {
    const id = String(req.params.id);
    const doc = idOk(id) ? await deVersion(id, body(req).version ?? req.query?.version) : null;
    if (!doc || !(await enAlcance(u, doc))) { res.status(404).json({ error: 'No existe ese agente' }); return null; }
    return doc;
  };

  // Crear un agente o su versión siguiente. La misma especificación otra vez devuelve la versión que ya existe.
  on('POST', 'sistemas/agentes', async (req, res) => {
    const u = await abre(req, res, { write: true }); if (!u) return;
    try {
      const v = validarSpec(body(req).spec); if (!v.ok) fail(400, 'SPEC', v.errores.join(' · '), { errores: v.errores });
      const slug = v.spec.contexto.cliente;
      if (slug) { const sc = await scoper(u); if (sc && typeof sc.client === 'function' && !sc.client(slug)) fail(403, 'ALCANCE', 'Ese cliente no está dentro de tu alcance'); }
      const hash = sha(v.spec);
      for (let i = 0; i < 6; i++) {
        const previa = await ultimaVersion(v.spec.id);
        if (previa?.hash === hash) return res.json({ id: previa.agent_id, version: previa.version, hash, repetida: true, externo: v.externo });
        const version = (previa?.version || 0) + 1;
        try { await db.create(COLL_SPEC, { agent_id: v.spec.id, version, hash, spec: v.spec, por: u.email }, u.email, `${v.spec.id}--v${version}`); return res.json({ id: v.spec.id, version, hash, repetida: false, externo: v.externo }); }
        catch (e) { if (!/duplicate|unique/i.test(e.message)) throw e; } // otra persona creó esa versión justo antes: se toma la siguiente
      }
      fail(409, 'CONFLICTO', 'Otra persona está editando este agente. Vuelve a intentar.');
    } catch (e) { err(res, e); }
  });
  on('GET', 'sistemas/agentes', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const ult = new Map(), bancos = await db.list(COLL_BANCO);
    for (const d of await db.list(COLL_SPEC)) if (!ult.has(d.agent_id) || ult.get(d.agent_id).version < d.version) ult.set(d.agent_id, d);
    const out = [];
    for (const d of ult.values()) if (await enAlcance(u, d)) {
      const ultimo = bancos.filter((b) => b.tipo === 'banco' && b.agent_id === d.agent_id && b.version === d.version).sort((a, z) => reciente(z, a))[0];
      out.push({ ...vistaSpec(d), ...(await estadoActivacion(d.agent_id, d.version, bancos)), banco: ultimo ? resumenBanco(ultimo) : null });
    }
    res.json({ agentes: out });
  });
  on('GET', 'sistemas/agentes/:id', async (req, res) => {
    const u = await abre(req, res); if (!u) return; const d = await deAgente(req, res, u); if (!d) return;
    const bancos = (await db.list(COLL_BANCO)).filter((b) => b.agent_id === d.agent_id);
    res.json({ ...vistaSpec(d), ...(await estadoActivacion(d.agent_id, d.version, bancos)), versiones: (await db.list(COLL_SPEC)).filter((x) => x.agent_id === d.agent_id).map((x) => x.version).sort((a, z) => a - z), bancos: bancos.filter((b) => b.tipo === 'banco' && b.version === d.version).map(resumenBanco) });
  });

  // Correr el banco de pruebas: cada caso por el ejecutor, con el presupuesto reservado antes y liquidado después.
  on('POST', 'sistemas/agentes/:id/banco', async (req, res) => {
    const u = await abre(req, res, { write: true }); if (!u) return; const d = await deAgente(req, res, u); if (!d) return;
    try {
      const b = body(req), vc = validarCasos(b.casos); if (!vc.ok) fail(400, 'CASOS', vc.errores.join(' · '), { errores: vc.errores });
      if (typeof ejecutor !== 'function') fail(503, 'disconnected', 'No hay un modelo conectado para correr el banco: dice «disconnected». Conéctalo y vuelve a intentar.');
      let modelo = d.spec.modelo; // se puede probar OTRO modelo con la misma especificación: así el router tiene con qué comparar
      if (b.modelo != null) { modelo = lc(b.modelo); if (!MODELOS_IDS.includes(modelo)) fail(400, 'MODELO', 'Ese modelo no está en la tabla'); }
      const spec = { ...d.spec, modelo }, cfg = await leerConfig(), t = ahora(), mes = mesDe(t), tarea = `banco:${d.agent_id}--v${d.version}`;
      const ctx = { persona: u.email, cliente: spec.contexto.cliente, agente: d.agent_id, topeAgente: spec.presupuesto.por_mes }, gastos = [], avisos = new Set();
      let cortado = null;
      const conPresupuesto = async (sp, caso) => {
        const h = await reservar(ctx, sp.presupuesto.por_corrida, { ahora: t, config: cfg });
        if (!h.ok) { cortado ||= h; throw Object.assign(new Error(h.mensajes?.[0] || 'Presupuesto agotado'), { code: 'PRESUPUESTO' }); }
        h.avisos.forEach((a) => avisos.add(a));
        let r; try { r = await ejecutor(sp, caso); } catch (e) { await liberar(h); throw e; }
        const costo = costoDe(r, cfg.precios, sp.modelo); await liquidar(h, costo);
        gastos.push({ caso: caso.id, monto: costo, modelo: r?.modelo || sp.modelo });
        return r;
      };
      const reporte = await correrBanco(spec, vc.casos, { ejecutar: conPresupuesto, precios: cfg.precios, juez });
      for (const g of gastos) await anotarGasto({ tarea, caso: g.caso, persona: u.email, cliente: spec.contexto.cliente, agente: d.agent_id, modelo: g.modelo, monto: g.monto, mes, en: new Date(t).toISOString() });
      for (const c of reporte.porCaso) c.texto = redactar(c.texto);
      const doc = await db.create(COLL_BANCO, { tipo: 'banco', agent_id: d.agent_id, version: d.version, modelo, casos_hash: sha(vc.casos), por: u.email, mes, reporte }, u.email);
      res.json({ id: doc.id, version: d.version, modelo, reporte, presupuesto: { cortado: Boolean(cortado), avisos: [...avisos], sin_tope: cfg.aprobado ? undefined : 'No hay topes aprobados por el CEO: no se aplicó ninguno.' } });
    } catch (e) { err(res, e); }
  });

  // Activar: solo con un banco que alcance. Lo externo queda en borrador hasta que el CEO/COO lo pase a activo.
  on('POST', 'sistemas/agentes/:id/activar', async (req, res) => {
    const u = await abre(req, res, { write: true }); if (!u) return; const d = await deAgente(req, res, u); if (!d) return;
    try {
      const b = body(req), cfg = await leerConfig(), quiereActivo = b.modo === 'activo';
      const bancosTodos = await db.list(COLL_BANCO), bancos = bancosTodos.filter((x) => x.tipo === 'banco' && x.agent_id === d.agent_id && x.version === d.version);
      const banco = b.banco_id ? bancos.find((x) => x.id === b.banco_id) : bancos.sort((a, z) => reciente(z, a))[0];
      const externo = d.spec.acciones.some((a) => a.externa);
      if (quiereActivo && externo && !alto(u)) fail(403, 'ROL', 'Solo el CEO o el COO pasan a activo un agente que toca algo externo');
      const r = puedeActivar(banco ? { ...banco.reporte, externo } : null, { ...cfg.politica, pasarAActivo: quiereActivo && alto(u) });
      if (!r.ok) fail(409, 'NO_ACTIVA', r.razones.join(' · '), { razones: r.razones });
      const act = await db.create(COLL_BANCO, { tipo: 'activacion', agent_id: d.agent_id, version: d.version, modo: r.modo, banco_id: banco.id, por: u.email, seq: 1 + bancosTodos.filter((x) => x.tipo === 'activacion' && x.agent_id === d.agent_id).reduce((m, x) => Math.max(m, x.seq || 0), 0) }, u.email);
      res.json({ id: act.id, version: d.version, modo: r.modo, avisos: r.razones, costo_por_caso: banco.reporte.costo_por_caso, costo_etiqueta: banco.reporte.costo_etiqueta });
    } catch (e) { err(res, e); }
  });

  // Router de costo: el modelo más barato que cumple la calidad mínima, según los bancos de este agente.
  on('GET', 'sistemas/agentes/:id/modelo', async (req, res) => {
    const u = await abre(req, res); if (!u) return; const d = await deAgente(req, res, u); if (!d) return;
    const cfg = await leerConfig(), calidadMin = Number(req.query?.calidadMin) > 0 && Number(req.query.calidadMin) <= 1 ? Number(req.query.calidadMin) : cfg.politica.calidadMin;
    const historial = (await db.list(COLL_BANCO)).filter((x) => x.tipo === 'banco' && x.agent_id === d.agent_id).map((x) => ({ modelo: x.modelo, calidad: x.reporte.calidad, costo_por_caso: x.reporte.costo_por_caso, n: x.reporte.n }));
    res.json(elegirModelo(historial, { calidadMin }));
  });

  // El panel de costo: gasto del mes por tarea, persona, cliente y agente, con su tope (null donde el CEO no aprobó uno).
  // CEO y COO ven todo; el resto, solo lo que gastó él.
  on('GET', 'sistemas/costo', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const mes = /^\d{4}-\d{2}$/.test(String(req.query?.mes || '')) ? String(req.query.mes) : mesDe(ahora()), cfg = await leerConfig();
    const libro = (await db.list(COLL_PRESUPUESTO)).filter((x) => x.tipo === 'libro' && x.mes === mes && (alto(u) || lc(x.persona) === lc(u.email)));
    const suma = (clave, tope) => {
      const m = new Map();
      for (const e of libro) { const k = clave(e); if (!k) continue; const a = m.get(k) || { clave: k, gastado: 0, sin_dato: 0, corridas: 0 }; a.corridas++; if (e.monto == null) a.sin_dato++; else a.gastado = Math.round((a.gastado + e.monto) * 1e8) / 1e8; m.set(k, a); }
      for (const k of Object.keys(tope || {})) if (!m.has(k) && (alto(u) || k === lc(u.email))) m.set(k, { clave: k, gastado: 0, sin_dato: 0, corridas: 0 });
      return [...m.values()].map((a) => { const t = tope?.[a.clave] ?? null; return { ...a, tope: t, estado: estadoDeTope(a.gastado, t, cfg.aviso), pct: t ? Math.round((a.gastado / t) * 1e4) / 1e4 : null }; }).sort((x, z) => z.gastado - x.gastado);
    };
    res.json({ mes, aviso: cfg.aviso, topes_aprobados: cfg.aprobado, por_tarea: suma((e) => e.tarea, null), por_persona: suma((e) => lc(e.persona), cfg.topes.persona), por_cliente: suma((e) => lc(e.cliente), cfg.topes.cliente), por_agente: suma((e) => e.agente, null), sin_precio: libro.filter((e) => e.monto == null).length });
  });
  // El CEO aprueba precios por modelo, topes por persona y cliente, y la política de activación.
  on('POST', 'sistemas/costo', async (req, res) => {
    const u = await guard(req, res, undefined, { client: true }); if (!u) return;
    if (u.role === 'client') return res.status(404).json({ error: 'No existe' });
    if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO aprueba precios y topes' });
    const v = validarConfig(body(req)); if (!v.ok) return res.status(400).json({ error: v.errores.join(' · '), code: 'CONFIG', errores: v.errores });
    await db.upsert(COLL_PRESUPUESTO, 'config', { tipo: 'config', ...v.config, aprobado_por: u.email }, u.email);
    res.json({ ok: true, guardado: Object.keys(v.config) });
  });
}
