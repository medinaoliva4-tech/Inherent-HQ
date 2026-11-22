// Contexto vivo (servidor): la empresa ya sabe lo que se habló con cada cliente, sin pegarlo a mano.
//   · ctx_fuentes      una fuente = una reunión / llamada / nota / mensaje, con el HASH de su contenido para no duplicar. Solo se agrega: nada se borra.
//   · ctx_compromisos  lo que se prometió, extraído con su CITA literal. Nace como hipótesis; Aceptar crea UNA tarea; Descartar archiva.
// Ninguna de las dos colecciones está en COLLS: /api/db responde 404 («Colección desconocida»). Solo se tocan por /api/contexto/*.
// Acceso: quien ve esa marca (scoper) y trabaja en un área de marca; la marca «personal» solo el CEO; un cliente del portal NUNCA.
// Lo interno (notas del equipo, CRM) solo sale a quien lo ve. Las transcripciones son sensibles: nada de su texto va a los registros.
import crypto from 'node:crypto';
import * as db from './db.js';
import * as results from './results.js';
import * as intel from './intel.js';
import { guardAny, scoper, permiteArea, levelOf, seesCosts } from './access.js';
import { body } from './http.js';
import { AREA_DE } from '../../public/js/entregables.js';
import { construirHilo } from '../../public/js/hilo.js';
import { parsearTranscripcion, extraerCompromisos, extraerSenales, memoriaDelCliente, diaDe, isoDe } from '../../public/js/contexto/extractor.js';

export const COLL_F = 'ctx_fuentes', COLL_C = 'ctx_compromisos';
export const ORIGENES = ['reunion', 'llamada', 'nota', 'mensaje'];
const MAX_CHARS = 400_000;
// «work» (Mis tareas) no abre la memoria: todo el equipo lo tiene y las transcripciones son sensibles.
const AREAS_LEER = ['clients', 'content', 'estrategia', 'sales', 'operations'], AREAS_ESCRIBIR = AREAS_LEER;
const lc = (x) => String(x || '').toLowerCase();
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugOk = (s) => /^[a-z0-9][\w-]{1,59}$/.test(String(s || ''));
const idOk = (s) => /^[a-f0-9]{32}$/.test(String(s || ''));
const ahora = () => new Date().toISOString();
const norm = (t) => String(t).replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
const fail = (status, code, message) => { throw Object.assign(new Error(message), { status, code }); };
const err = (res, e) => res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo completar. Vuelve a intentar.', code: e.code || 'SERVIDOR' });

// ---------- El conector de reuniones (MCP de transcripciones) ----------
// Hoy está desconectado y lo dice; la ingesta manual (POST …/transcripcion) funciona igual. Inyectable para probar el día que se conecte.
export const conectorReuniones = {
  capability: () => ({ conectado: false, nombre: 'Transcripciones de reuniones', ingesta_manual: true, mensaje: 'El conector de transcripciones no está conectado: pega la transcripción y el OS la procesa igual.' }),
};

// ---------- Acceso ----------
const veInterno = (u) => seesCosts(u); // CEO, COO y quien edita Clientes
// Las notas del CRM las ve quien ve Ventas por dentro (no en «resumen»).
const veCrm = (u) => u.role === 'ceo' || (permiteArea(u, 'sales') && levelOf(u, 'sales') !== 'resumen');
const permiteFuente = (u) => (f) => !f.interno || (f.tipo === 'crm' ? veCrm(u) : veInterno(u));

async function entrar(req, res, { write = false } = {}) {
  const areas = write ? AREAS_ESCRIBIR : AREAS_LEER;
  const u = await guardAny(req, res, areas, { write }); if (!u) return null; // un cliente del portal no pasa (403)
  if (u.role !== 'ceo' && !areas.some((a) => permiteArea(u, a, { write }) && levelOf(u, a) !== 'resumen')) { res.status(403).json({ error: 'Tu vista no abre el contexto de los clientes' }); return null; }
  return u;
}
// La marca tiene que existir y estar entre las de quien pregunta; si no, el mismo 404 (no dice cuál de las dos cosas pasó).
async function marca(req, res, u, slug) {
  const no = () => { res.status(404).json({ error: 'Esa marca no está entre las tuyas', code: 'MARCA' }); return false; };
  if (!slugOk(slug)) { res.status(400).json({ error: 'Falta el cliente' }); return false; }
  if (slug === 'personal') return u.role === 'ceo' ? true : no();
  if (!(await intel.slugValido(slug))) return no();
  const sc = await scoper(u);
  return sc && slug !== 'inherent' && !sc.client(slug) ? no() : true;
}

// ---------- Ingesta ----------
const participantesDe = (x) => (Array.isArray(x) ? x : []).slice(0, 30).map((p) => {
  const nombre = String(typeof p === 'string' ? p : p?.nombre || p?.name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const lado = typeof p === 'object' && ['cliente', 'inherent'].includes(p?.lado) ? p.lado : '';
  return nombre ? { nombre, ...(lado ? { lado } : {}) } : null;
}).filter(Boolean);
const publico = (c) => ({ id: c.id, v: c.v, cita: c.cita, quien: c.quien, para_cuando: c.para_cuando, precision: c.precision, tipo: c.tipo, confianza: c.confianza, razon: c.razon, estado: c.estado, tarea_id: c.tarea_id || null, fuente_id: c.fuente_id });

export async function ingerir(u, slug, b, { ahoraMs = Date.now() } = {}) {
  const texto = typeof b.texto === 'string' ? b.texto : '';
  if (!texto.trim()) fail(400, 'TEXTO', 'Falta la transcripción');
  if (texto.length > MAX_CHARS) fail(413, 'GRANDE', 'La transcripción es demasiado larga');
  const origen = b.origen == null || b.origen === '' ? 'reunion' : String(b.origen);
  if (!ORIGENES.includes(origen)) fail(400, 'ORIGEN', `El origen es uno de: ${ORIGENES.join(', ')}`);
  const fecha = b.fecha ? diaDe(b.fecha) : diaDe(new Date(ahoraMs));
  if (!fecha) fail(400, 'FECHA', 'La fecha no es válida (usa AAAA-MM-DD)');
  const fechaIso = typeof b.fecha === 'string' && /[T ]\d{2}:\d{2}/.test(b.fecha) ? b.fecha : isoDe(fecha);
  const participantes = participantesDe(b.participantes), interno = origen === 'nota' || b.interno === true;
  const hash = sha(`${slug}\n${norm(texto)}`), id = hash.slice(0, 32);
  let fuente = await db.get(COLL_F, id), duplicada = Boolean(fuente);
  if (!fuente) {
    const turnos = parsearTranscripcion(texto), senales = extraerSenales(turnos, { participantes });
    try {
      fuente = await db.create(COLL_F, { slug, tipo: origen, origen, titulo: String(b.titulo || '').replace(/\s+/g, ' ').trim().slice(0, 120), fecha: fechaIso, participantes, interno, texto, hash, turnos_n: turnos.length, senales, creado_por: u.email }, u.email, id);
    } catch (e) { fuente = await db.get(COLL_F, id); if (!fuente) throw e; duplicada = true; } // dos envíos a la vez: gana uno
  }
  // Se extrae SIEMPRE de lo que quedó guardado (no de lo que llegó en este envío): un duplicado con otros espacios no cambia las citas ni los ids.
  const compromisos = extraerCompromisos(parsearTranscripcion(fuente.texto), { participantes: fuente.participantes, fecha: fuente.fecha });
  // Los compromisos llevan id fijo (fuente + cita): repetir el envío completa lo que faltó y nunca duplica.
  const de = [];
  for (const c of compromisos) {
    const cid = sha(`${id}|${c.cita}`).slice(0, 32);
    let doc = await db.get(COLL_C, cid);
    if (!doc) {
      try { doc = await db.create(COLL_C, { slug, fuente_id: id, interno: Boolean(fuente.interno), cita: c.cita, quien: c.quien, para_cuando: c.para_cuando, precision: c.precision, tipo: c.tipo, confianza: c.confianza, razon: c.razon, t: c.t, estado: 'hipotesis', tarea_id: null }, u.email, cid); }
      catch (e) { doc = await db.get(COLL_C, cid); if (!doc) throw e; }
    }
    de.push(doc);
  }
  return { fuente: { id, tipo: fuente.tipo, titulo: fuente.titulo, fecha: fuente.fecha, interno: Boolean(fuente.interno), duplicada }, compromisos: de.map(publico), senales: Object.fromEntries(Object.entries(fuente.senales || {}).map(([k, v]) => [k, v.length])) };
}

// ---------- La memoria ----------
const normaliza = (x) => lc(x).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
async function fuentesDe(u, slug) {
  const out = [];
  const [fs, cs] = await Promise.all([db.list(COLL_F), db.list(COLL_C)]);
  const porFuente = new Map();
  for (const c of cs) if (c.slug === slug) (porFuente.get(c.fuente_id) || porFuente.set(c.fuente_id, []).get(c.fuente_id)).push(c);
  for (const f of fs) {
    if (f.slug !== slug) continue;
    out.push({ id: f.id, tipo: f.tipo, titulo: f.titulo, fecha: f.fecha, interno: Boolean(f.interno), participantes: f.participantes, senales: f.senales, compromisos: (porFuente.get(f.id) || []).map((c) => ({ id: c.id, v: c.v, cita: c.cita, quien: c.quien, para_cuando: c.para_cuando, precision: c.precision, tipo: c.tipo, confianza: c.confianza, razon: c.razon, estado: c.estado, tarea_id: c.tarea_id })) });
  }
  // El CRM: no hay vínculo formal lead → cliente; se toma el lead cuya empresa o nombre es exactamente el nombre o el slug de la marca.
  if (veCrm(u)) {
    const cuenta = (await db.list('accounts')).find((a) => lc(a.slug || String(a.id).replace(/^acc-/, '')) === slug), clave = new Set([normaliza(slug), normaliza(cuenta?.name || cuenta?.nombre)].filter(Boolean));
    const sc = await scoper(u);
    for (const l of await db.list('leads')) {
      if (!(lc(l.client_slug) === slug || clave.has(normaliza(l.company)) || clave.has(normaliza(l.name))) || (sc && typeof sc.leads === 'function' && !sc.leads(l))) continue;
      const act = (Array.isArray(l.activity) ? l.activity : []).filter((a) => a?.text);
      const texto = [l.notes, l.wants ? `Quiere: ${l.wants}` : ''].filter(Boolean).join('\n');
      if (texto.trim()) out.push({ id: `crm-${l.id}`, tipo: 'crm', titulo: `CRM · ${l.name || l.company || 'lead'}`, fecha: l._meta?.updated_at || l._meta?.created_at, interno: true, texto });
      for (const [n, a] of act.entries()) if (/[a-záéíóúñ]/i.test(a.text) && !/^Lead creado/.test(a.text)) out.push({ id: `crm-${l.id}-a${n}`, tipo: 'crm', titulo: `CRM · ${l.name || 'lead'}`, fecha: a.at, interno: true, texto: a.text });
    }
  }
  // Entregables: solo los de las áreas que esa persona ve (y no en «resumen»); nunca su contenido ni costos, solo título, aprobación del cliente y resultados.
  const ents = (await db.list('deliverables')).filter((d) => lc(d.client_slug) === slug && AREA_DE[d.ws] && !d.archivado && (u.role === 'ceo' || (permiteArea(u, AREA_DE[d.ws]) && levelOf(u, AREA_DE[d.ws]) !== 'resumen')));
  const hilo = construirHilo(ents, { slug }), revisar = new Map(hilo.nodes.map((n) => [n.id, n.revisar]));
  for (const d of ents) {
    const cliente = d.aprobacion_cliente?.accion === 'aprobar' ? d.aprobacion_cliente : null, resultados = (Array.isArray(d.resultado) ? d.resultado : []).map((r) => ({ metrica: r.metrica, valor: r.valor, nota: r.nota }));
    if (cliente || resultados.length) out.push({ id: `ent-${d.id}`, tipo: 'entregable', titulo: d.titulo, fecha: cliente?.en || d._meta?.updated_at, estado: d.estado, aprobadoPorCliente: Boolean(cliente), resultados, revisar: revisar.get(d.id) });
  }
  return out;
}

// ---------- Aceptar / descartar ----------
const vDe = (b, cur) => (b?.v != null && Number.isInteger(Number(b.v)) ? Number(b.v) : cur.v);
const CONFLICTO = 'Alguien lo cambió justo ahora. Recarga y vuelve a intentar.';
async function compromisoDe(req, res, write) {
  const u = await entrar(req, res, { write }); if (!u) return {};
  const id = String(req.params.id || ''), cur = idOk(id) ? await db.get(COLL_C, id) : null;
  const no = () => { res.status(404).json({ error: 'No existe ese compromiso', code: 'NO_EXISTE' }); return {}; };
  if (!cur || (cur.interno && !veInterno(u))) return no();
  if (!(await marca(req, { status: () => ({ json: () => {} }) }, u, cur.slug))) return no(); // el mismo 404, sin pistas de la marca
  return { u, cur };
}
export async function aceptar(u, cur, b) {
  if (cur.estado === 'aprobado' && cur.tarea_id) return { ok: true, ya: true, tarea_id: cur.tarea_id, compromiso: publico(cur) };
  if (cur.estado === 'descartado') fail(409, 'DESCARTADO', 'Ese compromiso ya se descartó');
  const fuente = await db.get(COLL_F, cur.fuente_id), tareaId = db.newId();
  const marcado = await db.update(COLL_C, cur.id, { ...cur, estado: 'aprobado', tarea_id: tareaId, aprobado_por: u.email, aprobado_en: ahora() }, vDe(b, cur), u.email); // CAS: dos toques a la vez, gana uno
  if (!marcado) {
    const ahoraDoc = await db.get(COLL_C, cur.id);
    if (ahoraDoc?.estado === 'aprobado' && ahoraDoc.tarea_id) return { ok: true, ya: true, tarea_id: ahoraDoc.tarea_id, compromiso: publico(ahoraDoc) };
    fail(409, 'CONFLICTO', CONFLICTO);
  }
  const frase = cur.cita.length > 160 ? `${cur.cita.slice(0, 157)}…` : cur.cita;
  const tarea = {
    title: frase,
    description: [`Compromiso de ${fuente?.tipo || 'reunión'}${fuente?.titulo ? ` «${fuente.titulo}»` : ''}${fuente?.fecha ? ` del ${String(fuente.fecha).slice(0, 10)}` : ''}`, `Cita: «${cur.cita}»`, cur.quien ? `Responsable según la conversación: ${cur.quien}` : '', cur.para_cuando ? `Para: ${cur.para_cuando}` : '', `Confianza ${cur.confianza}`].filter(Boolean).join(' · '),
    status: 'Por empezar', tipo: 'Delivery', dept: '', due: cur.para_cuando || '', assignee: u.email,
    visibility: cur.interno || cur.slug === 'personal' ? 'private' : 'all', project_id: '', client_slug: cur.slug, cliente: cur.slug, area: 'contexto',
    origen: 'contexto', compromiso_id: cur.id,
  };
  try { await db.create('tasks', results.stampDone(null, tarea), u.email, tareaId); }
  catch (e) { await db.update(COLL_C, cur.id, { ...marcado, estado: 'hipotesis', tarea_id: null }, marcado.v, u.email).catch(() => {}); throw e; } // no queda un «aprobado» sin tarea
  return { ok: true, ya: false, tarea_id: tareaId, compromiso: publico(marcado) };
}
export async function descartar(u, cur, b) {
  if (cur.estado === 'descartado') return { ok: true, ya: true, compromiso: publico(cur) };
  if (cur.estado === 'aprobado') fail(409, 'ACEPTADO', 'Ya se aceptó y tiene tarea: se cierra desde la tarea');
  const d = await db.update(COLL_C, cur.id, { ...cur, estado: 'descartado', descartado_por: u.email, descartado_en: ahora() }, vDe(b, cur), u.email);
  if (!d) fail(409, 'CONFLICTO', CONFLICTO);
  return { ok: true, ya: false, compromiso: publico(d) };
}

export function rutas(on, { conector = conectorReuniones } = {}) {
  on('POST', 'contexto/:slug/transcripcion', async (req, res) => {
    const u = await entrar(req, res, { write: true }); if (!u) return;
    const slug = lc(req.params.slug); if (!(await marca(req, res, u, slug))) return;
    try { res.json({ ...(await ingerir(u, slug, body(req))), conector: conector.capability() }); } catch (e) { err(res, e); }
  });
  on('GET', 'contexto/:slug/memoria', async (req, res) => {
    const u = await entrar(req, res); if (!u) return;
    const slug = lc(req.params.slug); if (!(await marca(req, res, u, slug))) return;
    try {
      const fuentes = await fuentesDe(u, slug), interno = veInterno(u);
      res.json({ slug, ...memoriaDelCliente(fuentes, { hoy: new Date(), permite: permiteFuente(u) }), interno, conector: conector.capability() });
    } catch (e) { err(res, e); }
  });
  for (const [ruta, fn] of [['aceptar', aceptar], ['descartar', descartar]]) {
    on('POST', `contexto/compromisos/:id/${ruta}`, async (req, res) => {
      const { u, cur } = await compromisoDe(req, res, true); if (!u) return;
      try { res.json(await fn(u, cur, body(req))); } catch (e) { err(res, e); }
    });
  }
}
