// Lead Engine (servidor): califica un lote de prospectos, deja que un redactor escriba, VALIDA cada borrador y manda el lote a aprobación
// con el motor de workflows. Nada sale antes del OK de una persona (CEO o COO), y el OK es sobre el hash del contenido EXACTO.
//   POST revenue/lotes                       califica y descarta los que no encajan (lote «calificado»)
//   POST revenue/lotes/:id/redactar          redactor(prompt) → validarBorrador; los inválidos quedan marcados y NO se envían
//   PUT  revenue/lotes/:id/borradores/:i     editar un borrador invalida el OK (cancela la corrida que esperaba)
//   POST revenue/lotes/:id/solicitar-envio   crea la corrida `envio-lote` y se detiene en la aprobación
//   POST revenue/lotes/:id/aprobar           el OK sobre el hash → el adaptador `correo-lote` envía lo que la política permite
//   POST revenue/lotes/:id/continuar         lo que quedó en cola (tope diario, horario) sigue saliendo, solo si el contenido es el aprobado
//   POST revenue/respuestas                  clasifica; baja → lista de bajas y cancela lo pendiente; interés → lead en el CRM + respuesta propuesta
// Colecciones propias (lead_*): no están en COLLS, así que NO se leen ni escriben por /api/db.
// Lo externo es inyectable: `redactor` (la IA del gateway) y `correo` (el envío). Sin inyección dicen «disconnected»: no se finge.
// Cumplimiento: baja en un clic (responder BAJA) y lista de no contactar. La ley de correo comercial de cada país la verifica quien lleve lo legal.
import crypto from 'node:crypto';
import * as db from './db.js';
import { guard, scoper } from './access.js';
import { body } from './http.js';
import * as W from './workflow.js';
import { canon } from '../../public/js/entregables.js';
import * as L from '../../public/js/revenue/lead-motor.js';
import { findDup, normalize as normLead, check as checkLead, createOrTouch, mergeActivity, entry } from './leads.js';
import { slugValido } from './intel.js';

export const COLL_LOTE = 'lead_lotes', COLL_BAJA = 'lead_bajas', COLL_ENVIO = 'lead_envios', COLL_RESP = 'lead_respuestas', COLL_EVT = 'lead_eventos', COLL_DOM = 'lead_dominios';
export const MAX_LOTE = 200, VENTANA_STATS_MS = 30 * 864e5;
const sha = (x) => crypto.createHash('sha256').update(typeof x === 'string' ? x : canon(x)).digest('hex');
const lc = (x) => String(x || '').toLowerCase();
const hoy = (ms) => new Date(ms).toISOString().slice(0, 10);
const mas = (ms, dias) => hoy(ms + dias * 864e5);
const fail = (status, code, message) => { throw Object.assign(new Error(message), { status, code }); };
const err = (res, e) => res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo completar. Vuelve a intentar.', code: e.code || 'SERVIDOR', ...(e.errores ? { errores: e.errores } : {}) });

// ---------- la definición del workflow ----------
export const DEF_ENVIO = { id: 'envio-lote', nombre: 'Envío de un lote de correos', pasos: [
  { id: 'ok-lote', tipo: 'aprobacion', aprueba: 'coo' }, // CEO o COO
  { id: 'enviar', tipo: 'accion', adaptador: 'correo-lote', depende: ['ok-lote'], proveedor: 'correo-lote', reintentos: { max: 0 } },
] };
const normPasos = (ps) => ps.map((p) => ({ id: p.id, tipo: p.tipo, adaptador: p.adaptador || '', depende: p.depende || [], params: p.params ?? {}, proveedor: p.proveedor || '', reintentos: { max: p.reintentos?.max || 0 }, aprueba: p.aprueba || 'coo' }));

// ---------- el contenido que se aprueba ----------
// Solo lo que va a salir: a quién, asunto y cuerpo de cada borrador válido, y desde dónde. Cambiar una coma cambia el hash.
export const correosDe = (lote) => lote.items.filter((it) => it.escribir && it.borrador?.ok === true && it.lead?.email).map((it) => ({ i: it.i, para: L.emailKey(it.lead.email), asunto: it.borrador.asunto, cuerpo: it.borrador.cuerpo }));
export const hashLote = (lote) => sha({ slug: lote.slug, de: lote.remitente?.email || '', correos: correosDe(lote) });

// ---------- el adaptador de envío ----------
// deps: { correo:{ capability?(), enviar({de,para,asunto,cuerpo,llave}) → {id?} }, ahora():ms, config }
export function adaptadoresDe(deps = {}) {
  const ahora = () => (typeof deps.ahora === 'function' ? deps.ahora() : Date.now());
  return {
    'correo-lote': {
      externo: true, seguro: false, descripcion: 'Enviar un lote de correos aprobado (con topes, horario y baja)',
      capability: () => (deps.correo ? deps.correo.capability?.() ?? { estado: 'ready' } : { estado: 'disconnected', razon: 'El correo todavía no está conectado al Lead Engine' }),
      execute: async ({ input, llave }) => enviarPendientes(deps, { loteId: input.lote_id, hash: input.hash, llave, ahora: ahora() }),
      // Si el proceso murió a mitad: solo se da por hecho lo que ya está registrado; lo ambiguo lo mira una persona.
      reconcile: async ({ llave }) => {
        const docs = (await db.list(COLL_ENVIO)).filter((e) => e.llave?.startsWith(`${llave}:`));
        return docs.length && docs.every((e) => ['enviado', 'revisar'].includes(e.estado)) ? { hecho: true, resultado: { conciliado: docs.length } } : null;
      },
    },
  };
}
async function cambiarLote(id, fn) {
  for (let i = 0; i < 6; i++) {
    const cur = await db.get(COLL_LOTE, id); if (!cur) return null;
    const next = fn(structuredClone(cur)); if (!next) return cur;
    const ok = await db.update(COLL_LOTE, id, next, cur.v, 'lead-engine'); if (ok) return ok;
  }
  fail(409, 'CONFLICTO', 'El lote cambió justo ahora. Vuelve a intentar.');
}
// El estado que mira la política, sacado de la base (envíos de ese dominio, bajas, rebotes y quejas desde el último reinicio).
async function estadoDe(dominio, destinatario, ahora, cfg) {
  const dom = (await db.get(COLL_DOM, dominio)) || {}, desde = Math.max(ahora - VENTANA_STATS_MS, dom.reiniciado_en || 0);
  const envios = (await db.list(COLL_ENVIO)).filter((e) => e.dominio === dominio && !e.liberado && ['enviando', 'enviado', 'revisar'].includes(e.estado));
  const evt = (await db.list(COLL_EVT)).filter((e) => e.dominio === dominio && e.ts >= desde);
  const bajas = (await db.list(COLL_BAJA)).map((b) => b.email);
  return { destinatario, envios: envios.map((e) => e.ts), bajas, enviadosTotal: envios.filter((e) => e.ts >= desde).length, rebotes: evt.filter((e) => e.tipo === 'rebote').length, quejas: evt.filter((e) => e.tipo === 'queja').length,
    calentado: (cfg.calentados || []).map(lc).includes(dominio), pausado: Boolean(dom.pausado), _envios: envios };
}
// Envía lo aprobado que la política deja salir AHORA. Idempotente: cada destinatario tiene su llave y su registro (primero se reserva, luego se envía).
export async function enviarPendientes(deps, { loteId, hash, llave, ahora }) {
  const cfg = deps.config || {}, lote = await db.get(COLL_LOTE, loteId);
  if (!lote) fail(404, 'NO_EXISTE', 'No existe ese lote');
  if (lote.estado === 'cancelado') fail(409, 'CANCELADO', 'El lote está cancelado');
  if (hashLote(lote) !== hash) fail(409, 'CAMBIO', 'El contenido cambió después del OK: no se envía nada');
  if (!deps.correo) fail(503, 'disconnected', 'El correo todavía no está conectado');
  const de = lote.remitente?.email, dominio = L.dominioDe(de); if (!dominio) fail(409, 'SIN_REMITENTE', 'El lote no tiene remitente');
  const res = { enviados: 0, en_cola: 0, cancelados: 0, errores: 0, revisar: 0 }, estados = {};
  for (const c of correosDe(lote)) {
    const item = (await db.get(COLL_LOTE, loteId)).items.find((x) => x.i === c.i), est = item.envio?.estado;
    if (['enviado', 'cancelado_baja', 'error', 'revisar'].includes(est)) { res[est === 'enviado' ? 'enviados' : est === 'cancelado_baja' ? 'cancelados' : est === 'error' ? 'errores' : 'revisar']++; continue; }
    const llaveI = `${llave}:${c.i}`, id = sha(llaveI).slice(0, 40), t = ahora;
    const st = await estadoDe(dominio, c.para, t, cfg), pol = L.puedeEnviar(st, t, cfg);
    if (!pol.ok) {
      if (pol.motivo === 'baja') { estados[c.i] = { estado: 'cancelado_baja' }; res.cancelados++; }
      else if (pol.motivo === 'auto_pausa') { await db.upsert(COLL_DOM, dominio, { pausado: true, motivo: pol.detalle, en: t }, 'lead-engine'); estados[c.i] = { estado: 'en_cola', motivo: 'auto_pausa', reintentarEn: null }; res.en_cola++; }
      else { estados[c.i] = { estado: 'en_cola', motivo: pol.motivo, reintentarEn: pol.reintentarEn }; res.en_cola++; }
      continue;
    }
    // Reservar (la llave es la clave primaria: dos procesos no reservan lo mismo) y volver a contar con la reserva puesta.
    let reserva;
    try { reserva = await db.create(COLL_ENVIO, { llave: llaveI, lote_id: loteId, i: c.i, dominio, ts: t, estado: 'enviando', liberado: false }, 'lead-engine', id); }
    catch { const ya = await db.get(COLL_ENVIO, id); if (ya?.estado === 'enviado') { estados[c.i] = { estado: 'enviado', en: ya.ts }; res.enviados++; continue; }
      if (ya?.liberado) { reserva = await db.update(COLL_ENVIO, id, { ...ya, liberado: false, estado: 'enviando', ts: t }, ya.v, 'lead-engine'); if (!reserva) { res.en_cola++; continue; } } else { estados[c.i] = { estado: 'revisar', motivo: 'resultado desconocido: lo revisa una persona' }; res.revisar++; continue; } }
    const antes = (await estadoDe(dominio, c.para, t, cfg))._envios.filter((e) => e.id !== id && (e.ts < t || (e.ts === t && e.id < id))).map((e) => e.ts);
    const pol2 = L.puedeEnviar({ ...st, envios: antes }, t, cfg);
    if (!pol2.ok) { await db.update(COLL_ENVIO, id, { ...reserva, liberado: true }, reserva.v, 'lead-engine'); estados[c.i] = { estado: 'en_cola', motivo: pol2.motivo, reintentarEn: pol2.reintentarEn }; res.en_cola++; continue; }
    try {
      const r = await deps.correo.enviar({ de, para: c.para, asunto: c.asunto, cuerpo: c.cuerpo, llave: llaveI });
      await db.update(COLL_ENVIO, id, { ...(await db.get(COLL_ENVIO, id)), estado: 'enviado', id_correo: String(r?.id ?? '').slice(0, 120), email: c.para }, (await db.get(COLL_ENVIO, id)).v, 'lead-engine');
      estados[c.i] = { estado: 'enviado', en: t, id_correo: String(r?.id ?? '').slice(0, 120) }; res.enviados++;
    } catch (e) {
      const cur = await db.get(COLL_ENVIO, id);
      if (e?.noEnviado === true) { await db.update(COLL_ENVIO, id, { ...cur, liberado: true }, cur.v, 'lead-engine'); estados[c.i] = { estado: 'en_cola', motivo: 'error_temporal', reintentarEn: null }; res.en_cola++; }
      else { await db.update(COLL_ENVIO, id, { ...cur, estado: 'revisar' }, cur.v, 'lead-engine'); estados[c.i] = { estado: 'revisar', motivo: W.redactar(e?.message) }; res.revisar++; } // no se sabe si salió: NO se repite
    }
    await cambiarLote(loteId, (l) => { const it = l.items.find((x) => x.i === c.i); it.envio = estados[c.i]; return l; });
    delete estados[c.i];
  }
  // lo que no se envió ahora (cola, baja) también queda anotado en su ficha
  await cambiarLote(loteId, (l) => { for (const [i, e] of Object.entries(estados)) { const it = l.items.find((x) => x.i === Number(i)); if (it.envio?.estado !== 'enviado') it.envio = e; }
    const vivos = correosDe(l).map((c) => l.items.find((x) => x.i === c.i).envio?.estado);
    l.estado = vivos.every((e) => ['enviado', 'cancelado_baja', 'error', 'revisar'].includes(e)) ? 'enviado' : 'parcial'; return l; });
  return res;
}

// ---------- acceso ----------
const SLUG = /^[\w-]{2,60}$/;
async function puedeMarca(u, slug) { if (!SLUG.test(String(slug || ''))) return false; if (slug === 'personal') return u.role === 'ceo'; if (slug === 'inherent') return true; const sc = await scoper(u); return !sc || sc.client(slug); }
const operador = (u) => ['ceo', 'coo'].includes(u.role) || (u.roles || []).includes('ventas');
async function abre(req, res, { write = false } = {}) {
  const u = await guard(req, res, 'sales', { write }); if (!u) return null;
  if (!operador(u)) { res.status(403).json({ error: 'Solo el CEO, el COO y ventas operan el Lead Engine' }); return null; }
  return u;
}
const vista = (l) => ({ id: l.id, v: l.v, slug: l.slug, estado: l.estado, hash: l.hash || null, run_id: l.run_id || null, resumen: l.resumen, remitente: l.remitente ? { nombre: l.remitente.nombre, email: l.remitente.email } : null, aprobado: l.aprobado || null,
  items: l.items.map((it) => ({ i: it.i, lead: it.lead, puntaje: it.puntaje ? { puntaje: it.puntaje.puntaje, nivel: it.puntaje.nivel, razones: it.puntaje.razones } : null, escribir: it.escribir, codigo: it.codigo, motivo: it.motivo, borrador: it.borrador || null, envio: it.envio || null })) });
const cap = (x, def) => (x ? (typeof x === 'function' ? { estado: 'ready' } : x.capability?.() ?? { estado: 'ready' }) : def);

export function rutas(on, deps = {}) {
  const ahora = () => (typeof deps.ahora === 'function' ? deps.ahora() : Date.now());
  const adaptadores = adaptadoresDe(deps);
  const redactor = typeof deps.redactor === 'function' ? { redactar: deps.redactor } : deps.redactor;
  const icpAprobado = deps.icpAprobado || (async (slug) => (await db.list('avatars')).some((a) => a.profile === slug && a.estado === 'aprobado' && !a.archivado));
  const remitenteDe = async (u) => { const r = typeof deps.remitente === 'function' ? await deps.remitente(u) : deps.remitente || {}; const email = lc(r.email || process.env.LEAD_REMITENTE_EMAIL || '');
    return { nombre: r.nombre || process.env.LEAD_REMITENTE_NOMBRE || u.name || '', cargo: r.cargo || '', empresa: r.empresa || process.env.LEAD_REMITENTE_EMPRESA || 'Inherent', direccion: r.direccion || process.env.LEAD_REMITENTE_DIRECCION || '', email }; };
  const lote = async (req, res, o = {}) => {
    const u = await abre(req, res, o); if (!u) return {};
    const l = await db.get(COLL_LOTE, String(req.params.id));
    if (!l || !(await puedeMarca(u, l.slug))) { res.status(404).json({ error: 'No existe ese lote' }); return {}; } // lo de otra marca no se ve
    return { u, l };
  };
  const asegurarDef = async (u) => {
    const ult = (await db.list(W.COLL_DEF)).filter((d) => d.def_id === DEF_ENVIO.id).sort((a, z) => z.version - a.version)[0];
    return ult && canon(ult.pasos) === canon(normPasos(DEF_ENVIO.pasos)) ? ult : W.guardarDefinicion(u, DEF_ENVIO, { adaptadores });
  };

  on('GET', 'revenue/lotes', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const out = []; for (const l of await db.list(COLL_LOTE)) if (await puedeMarca(u, l.slug)) out.push({ id: l.id, slug: l.slug, estado: l.estado, resumen: l.resumen, creado: l._meta?.created_at });
    res.json({ lotes: out, correo: cap(deps.correo, { estado: 'disconnected', razon: 'El correo todavía no está conectado' }), redactor: cap(redactor, { estado: 'disconnected', razon: 'El redactor (IA) todavía no está conectado' }) });
  });
  on('GET', 'revenue/lotes/:id', async (req, res) => { const { l } = await lote(req, res); if (l) res.json(vista(l)); });

  on('POST', 'revenue/lotes', async (req, res) => {
    const u = await abre(req, res, { write: true }); if (!u) return;
    const b = body(req), slug = lc(b.slug);
    try {
      if (!(await puedeMarca(u, slug)) || (slug !== 'personal' && slug !== 'inherent' && !(await slugValido(slug)))) fail(404, 'MARCA', 'Esa marca no está entre las tuyas');
      if (!Array.isArray(b.leads) || !b.leads.length) fail(400, 'LEADS', 'Manda al menos un lead');
      if (b.leads.length > MAX_LOTE) fail(400, 'TOPE', `Un lote admite hasta ${MAX_LOTE} leads (tope de costo)`);
      const icp = b.icp && typeof b.icp === 'object' ? b.icp : null;
      if (!icp || !(L.CRITERIOS.some((c) => ({ industria: icp.industrias, tamano: icp.tamano, ubicacion: icp.ubicaciones, senal: icp.senales, decisor: icp.cargos })[c.id]?.length ?? (icp.tamano && c.id === 'tamano')))) fail(409, 'SIN_ICP', 'Sin ICP no corre: manda los criterios (industrias, ubicaciones, señales…)');
      if (!(await icpAprobado(slug))) fail(409, 'SIN_ICP', 'Esta marca no tiene un ICP aprobado: Strategy lo aprueba antes de buscar clientes');
      const leads = b.leads.map((x) => (x?.raw && x.fuente ? L.normalizarEnriquecimiento(x.raw, x.fuente) : x && typeof x === 'object' ? { ...x, email: lc(x.email) } : null)).filter(Boolean);
      const plan = L.lotePlan(leads, icp, { existentes: await db.list('leads'), bajas: (await db.list(COLL_BAJA)).map((x) => x.email), maxEscribir: deps.config?.maxEscribir });
      const items = [...plan.escribir.map((x) => ({ lead: x.lead, puntaje: x.puntaje, escribir: true })), ...plan.noEscribir.map((x) => ({ lead: x.lead, puntaje: x.puntaje || null, escribir: false, codigo: x.codigo, motivo: x.motivo }))].map((it, i) => ({ i, ...it }));
      const d = await db.create(COLL_LOTE, { slug, estado: 'calificado', creado_por: u.email, icp, items, resumen: plan.resumen }, u.email);
      res.json(vista(d));
    } catch (e) { err(res, e); }
  });

  on('POST', 'revenue/lotes/:id/redactar', async (req, res) => {
    const { u, l } = await lote(req, res, { write: true }); if (!l) return;
    try {
      if (!['calificado', 'redactado'].includes(l.estado)) fail(409, 'ESTADO', `El lote está «${l.estado}»: ya no se redacta`);
      if (!redactor?.redactar || cap(redactor).estado !== 'ready') return res.status(503).json({ error: 'El redactor (IA) todavía no está conectado', code: 'disconnected', estado: 'disconnected' });
      const b = body(req), contexto = { marca: b.contexto?.marca || {}, oferta: b.contexto?.oferta, caso: b.contexto?.caso, evidencias: b.contexto?.evidencias, remitente: await remitenteDe(u) };
      if (!contexto.oferta) fail(400, 'OFERTA', 'Falta la oferta: el correo no tendría de qué hablar');
      const evidencias = L.evidenciasDe(contexto), nuevos = {};
      for (const it of l.items.filter((x) => x.escribir)) {
        const prompt = L.armarPromptCorreo({ lead: it.lead, contexto });
        let crudo;
        try { crudo = await redactor.redactar(prompt); } catch (e) { nuevos[it.i] = { ok: false, estado: 'error', asunto: '', cuerpo: '', fallas: [{ regla: 'redactor', porQue: W.redactar(e?.message || 'el redactor falló'), frase: '' }] }; continue; }
        const sep = L.separarBorrador(crudo), cuerpo = L.asegurarBaja(sep.cuerpo, contexto.remitente), v = L.validarBorrador({ asunto: sep.asunto, cuerpo }, { lead: it.lead, remitente: contexto.remitente, evidencias });
        nuevos[it.i] = { ok: v.ok, estado: v.ok ? 'valido' : 'invalido', asunto: sep.asunto, cuerpo, fallas: v.fallas };
      }
      const d = await cambiarLote(l.id, (x) => { for (const it of x.items) if (nuevos[it.i]) it.borrador = nuevos[it.i]; x.estado = 'redactado'; x.contexto = { oferta: contexto.oferta, caso: contexto.caso || null, evidencias: contexto.evidencias || [] }; x.remitente = contexto.remitente; x.hash = hashLote(x);
        x.resumen = { ...x.resumen, validos: x.items.filter((i) => i.borrador?.ok).length, invalidos: x.items.filter((i) => i.borrador && !i.borrador.ok).length }; return x; });
      res.json(vista(d));
    } catch (e) { err(res, e); }
  });

  on('PUT', 'revenue/lotes/:id/borradores/:i', async (req, res) => {
    const { u, l } = await lote(req, res, { write: true }); if (!l) return;
    try {
      if (!['redactado', 'en_aprobacion'].includes(l.estado)) fail(409, 'ESTADO', `El lote está «${l.estado}»: ya no se edita`);
      const it = l.items.find((x) => x.i === Number(req.params.i)); if (!it?.escribir || !it.borrador) fail(404, 'BORRADOR', 'Ese lead no tiene borrador');
      const b = body(req), sep = { asunto: String(b.asunto ?? it.borrador.asunto).trim().slice(0, 200), cuerpo: String(b.cuerpo ?? it.borrador.cuerpo).trim().slice(0, 6000) };
      const v = L.validarBorrador(sep, { lead: it.lead, remitente: l.remitente, evidencias: L.evidenciasDe(l.contexto || {}) });
      let invalidado = false;
      if (l.estado === 'en_aprobacion' && l.run_id) { // editar invalida el OK: la corrida que esperaba se cancela
        try { await W.cancelar(u, l.run_id); } catch { /* ya no estaba esperando */ } invalidado = true;
      }
      const d = await cambiarLote(l.id, (x) => { const y = x.items.find((q) => q.i === it.i); y.borrador = { ok: v.ok, estado: v.ok ? 'valido' : 'invalido', ...sep, fallas: v.fallas, editado_por: u.email, editado: true };
        x.hash = hashLote(x); if (invalidado) { x.estado = 'redactado'; x.run_id = null; x.ok_invalidado = true; } return x; });
      res.json({ ...vista(d), ok_invalidado: invalidado });
    } catch (e) { err(res, e); }
  });

  on('POST', 'revenue/lotes/:id/solicitar-envio', async (req, res) => {
    const { u, l } = await lote(req, res, { write: true }); if (!l) return;
    try {
      if (l.estado !== 'redactado') fail(409, 'ESTADO', `El lote está «${l.estado}»: redáctalo primero`);
      const correos = correosDe(l); if (!correos.length) fail(409, 'SIN_VALIDOS', 'Ningún borrador pasó la validación: no hay nada que aprobar');
      if (!L.dominioDe(l.remitente?.email)) fail(409, 'SIN_REMITENTE', 'Falta el correo remitente');
      const hash = hashLote(l), def = await asegurarDef(u);
      const { run } = await W.iniciar(u, def, { key: `lote:${l.id}:${hash}`, input: { lote_id: l.id, slug: l.slug, hash, remitente: { email: l.remitente.email }, correos }, client_slug: l.slug });
      const r = await W.avanzar(run.id, { adaptadores });
      await cambiarLote(l.id, (x) => { x.estado = 'en_aprobacion'; x.run_id = r.id; x.hash = hash; x.ok_invalidado = false; return x; });
      res.json({ lote_id: l.id, run_id: r.id, estado: r.estado, v: r.v, hash: r.pasos['ok-lote']?.hash || null, correos: correos.length, aviso: 'Nada sale hasta que el CEO o el COO aprueben este contenido exacto.' });
    } catch (e) { err(res, e); }
  });

  on('POST', 'revenue/lotes/:id/aprobar', async (req, res) => {
    const { u, l } = await lote(req, res, { write: true }); if (!l) return;
    try {
      if (!['ceo', 'coo'].includes(u.role)) fail(403, 'ROL', 'Solo el CEO o el COO aprueban un envío');
      if (l.estado !== 'en_aprobacion' || !l.run_id) fail(409, 'ESTADO', 'Este lote no está esperando aprobación');
      const run = await db.get(W.COLL_RUN, l.run_id), b = body(req);
      if (!run || run.input?.hash !== hashLote(l)) fail(409, 'CAMBIO', 'Lo que ibas a aprobar cambió. Revísalo otra vez.');
      await W.aprobar(u, run.id, 'ok-lote', { hash: b.hash, v: b.v });
      await cambiarLote(l.id, (x) => { x.estado = 'aprobado'; x.aprobado = { por: u.email, en: new Date(ahora()).toISOString(), hash: run.input.hash, run_id: run.id }; return x; });
      const r = await W.avanzar(run.id, { adaptadores });
      const fin = await db.get(COLL_LOTE, l.id);
      res.json({ run_id: r.id, estado: r.estado, paso: r.pasos.enviar, resultado: r.resultados.enviar || null, lote: vista(fin) });
    } catch (e) { err(res, e); }
  });

  on('POST', 'revenue/lotes/:id/continuar', async (req, res) => {
    const { u, l } = await lote(req, res, { write: true }); if (!l) return;
    try {
      if (!['ceo', 'coo'].includes(u.role)) fail(403, 'ROL', 'Solo el CEO o el COO sueltan lo que quedó en cola');
      if (!l.aprobado || l.aprobado.hash !== hashLote(l)) fail(409, 'SIN_OK', 'Solo sale lo que tiene el OK con este contenido exacto');
      if (!['parcial', 'aprobado'].includes(l.estado)) fail(409, 'ESTADO', `El lote está «${l.estado}»`);
      res.json({ resultado: await enviarPendientes(deps, { loteId: l.id, hash: l.aprobado.hash, llave: `${l.aprobado.run_id}:enviar`, ahora: ahora() }) });
    } catch (e) { err(res, e); }
  });

  on('POST', 'revenue/lotes/:id/cancelar', async (req, res) => {
    const { u, l } = await lote(req, res, { write: true }); if (!l) return;
    try {
      if (l.run_id && l.estado === 'en_aprobacion') await W.cancelar(u, l.run_id).catch(() => null);
      res.json(vista(await cambiarLote(l.id, (x) => { x.estado = 'cancelado'; for (const it of x.items) if (!it.envio || it.envio.estado === 'en_cola') it.envio = { estado: 'cancelado' }; return x; })));
    } catch (e) { err(res, e); }
  });

  // Rebotes y quejas (los reporta el correo): alimentan la auto-pausa. Una queja es además una baja.
  on('POST', 'revenue/eventos', async (req, res) => {
    const u = await abre(req, res, { write: true }); if (!u) return;
    const b = body(req), email = L.emailKey(b.email), tipo = b.tipo;
    if (!email || !['rebote', 'queja'].includes(tipo)) return res.status(400).json({ error: 'Manda el correo y el tipo (rebote o queja)' });
    const envio = (await db.list(COLL_ENVIO)).filter((e) => e.email === email).sort((a, z) => z.ts - a.ts)[0], dominio = envio?.dominio || L.dominioDe((await remitenteDe(u)).email);
    await db.create(COLL_EVT, { tipo, email, dominio, ts: ahora() }, u.email);
    if (tipo === 'queja') await darDeBaja(email, 'queja', u.email, ahora());
    res.json({ ok: true, dominio });
  });
  on('POST', 'revenue/dominios/reactivar', async (req, res) => {
    const u = await abre(req, res, { write: true }); if (!u) return;
    if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO reactiva un dominio que se pausó' });
    const dominio = lc(body(req).dominio); if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dominio)) return res.status(400).json({ error: 'Dominio no válido' });
    await db.upsert(COLL_DOM, dominio, { pausado: false, reiniciado_en: ahora(), reactivado_por: u.email }, u.email); res.json({ ok: true });
  });

  async function darDeBaja(email, motivo, quien, t) {
    const id = sha(email).slice(0, 40); if (!(await db.get(COLL_BAJA, id))) await db.create(COLL_BAJA, { email, motivo, en: t }, quien, id);
    let canceladas = 0;
    for (const l of await db.list(COLL_LOTE)) if (l.items.some((it) => L.emailKey(it.lead?.email) === email && (!it.envio || it.envio.estado === 'en_cola'))) {
      await cambiarLote(l.id, (x) => { for (const it of x.items) if (L.emailKey(it.lead?.email) === email && (!it.envio || it.envio.estado === 'en_cola')) { it.envio = { estado: 'cancelado_baja' }; canceladas++; } return x; });
    }
    return canceladas;
  }

  on('POST', 'revenue/respuestas', async (req, res) => {
    const u = await abre(req, res, { write: true }); if (!u) return;
    const b = body(req), email = L.emailKey(b.email); if (!email) return res.status(400).json({ error: 'Falta el correo de quien respondió' });
    try {
      const t = ahora(), c = L.clasificarRespuesta(b.texto), todos = await db.list(COLL_LOTE);
      const ref = todos.flatMap((l) => l.items.filter((it) => L.emailKey(it.lead?.email) === email).map((it) => ({ l, it }))).sort((a, z) => String(z.l._meta?.created_at).localeCompare(String(a.l._meta?.created_at)))[0];
      let canceladas = 0, lead = null, estadoLead = null;
      if (c.clase === 'baja' || c.clase === 'rechazo') canceladas = await darDeBaja(email, c.clase, u.email, t); // la baja se registra SIEMPRE, aunque el lote sea de otra marca
      if (ref && !(await puedeMarca(u, ref.l.slug)) && c.clase !== 'baja') fail(404, 'MARCA', 'Esa respuesta es de una marca que no es tuya');
      const todosLeads = await db.list('leads'), dup = findDup(todosLeads, { email }), base = ref?.it.lead || {};
      const nota = `Respondió al correo en frío · ${c.clase}${c.frase ? ` («${c.frase}»)` : ''}`;
      const sigue = (d, extra) => ({ ...d, ...extra, activity: mergeActivity(d.activity, [entry(u.email, nota)]) });
      const guardar = async (cur, patch) => { const doc = normLead(sigue(cur, patch)), bad = checkLead(doc); if (bad) fail(400, 'CRM', bad); const r = await db.update('leads', cur.id, doc, cur.v, u.email); if (!r) fail(409, 'CONFLICTO', 'El lead cambió justo ahora'); return r; };
      if (c.clase === 'interes') {
        const patch = { stage: 'Contactado', direction: 'out', next_step: 'Responder: la respuesta propuesta está lista', next_date: hoy(t), tags: [...new Set([...(dup?.tags || []), 'lead-engine'])] };
        if (dup) lead = await guardar(dup, ['Prospecto', 'Nuevo'].includes(dup.stage) ? patch : { next_step: patch.next_step, next_date: patch.next_date });
        else lead = (await createOrTouch({ name: base.contact || base.company || base.name || email.split('@')[0], contact: base.contact || '', company: base.company || '', email, phone: base.phone || '', ig: base.ig || '', source: 'Lead Engine', wants: '', notes: `Respondió a un correo en frío: «${c.frase}»`, ...patch, owner_role: 'ventas', activity: [entry(u.email, nota)] }, u.email, 'Lead Engine')).lead;
        estadoLead = lead.stage;
      } else if (dup && ['objecion', 'despues'].includes(c.clase)) {
        lead = await guardar(dup, { next_step: c.clase === 'despues' ? 'Retomar cuando dijo (más adelante)' : 'Responder la objeción con una pregunta', next_date: mas(t, c.clase === 'despues' ? 30 : 3) }); estadoLead = lead.stage;
      } else if (dup && (c.clase === 'rechazo' || c.clase === 'baja')) {
        lead = await guardar(dup, { stage: 'Perdido', lost_reason: 'otro', tags: [...new Set([...(dup.tags || []), 'no-contactar'])] }); estadoLead = lead.stage;
      }
      const propuesta = L.propuestaRespuesta(c.clase, { lead: { ...base, email }, remitente: ref?.l.remitente || await remitenteDe(u), asuntoOriginal: ref?.it.borrador?.asunto });
      const doc = await db.create(COLL_RESP, { email, clase: c.clase, frase: c.frase, regla: c.regla, texto: c.texto, lote_id: ref?.l.id || null, slug: ref?.l.slug || null, lead_id: lead?.id || dup?.id || null, propuesta: { ...propuesta, enviada: false, estado: 'borrador' }, en: t }, u.email);
      res.json({ id: doc.id, clase: c.clase, frase: c.frase, baja: c.clase === 'baja', canceladas, lead_id: doc.lead_id, etapa: estadoLead, propuesta: doc.propuesta });
    } catch (e) { err(res, e); }
  });
}
