// Agent Area (#/ai/agentes) · workflows de agentes y runs por etapas, con validación humana obligatoria (AGENTS IN OS.pdf).
//
// Dos colecciones propias (NO pasan por /api/db: collGuard las desconoce → 404; solo estas rutas, que aplican las reglas):
//   · agent_workflows — los workflows del OS. Se crean en blanco o se IMPORTAN de una plantilla (un WORKFLOW.md del repo o el
//     flujo del PDF). Importar copia la estructura y corta el lazo: el repo es la fuente de plantillas, no de verdad.
//     Los editan el CEO y el COO; el equipo los usa.
//   · agent_runs — una corrida de un workflow. Congela sus etapas al crearse.
// Reglas del run: solo se trabaja la etapa activa (409); toda etapa se aprueba para avanzar, aprueban CEO o COO y las 🚦 solo
// el CEO (403); en pausa no se ejecuta; nada se borra (se archiva); el alcance por cliente (`scoper`) filtra; `personal` solo
// CEO. La IA corre en la compu de la persona (Hermes con sus modelos y MCPs, el puente o claude.ai): el servidor guarda lo
// que llega con su vía; la evidencia de un modelo entra SIN VERIFICAR y un campo sin fuente queda como hipótesis.
import * as db from './db.js';
import { guard, scoper } from './access.js';
import { readFile } from './gh.js';
import * as intel from './intel.js';
import { body } from './http.js';
import { AGENTES } from '../../public/js/harness/agentes.js';
import { ESTRATEGIA_GUIADA, leerWorkflow, desdePlantilla, normalizarWorkflow, puede, activa, completo } from '../../public/js/agentes-flujos.js';

export const COLL = 'agent_runs';
export const WF = 'agent_workflows';
const lc = (x) => String(x || '').toLowerCase();
const txt = (s, n) => String(s ?? '').trim().slice(0, n);
const ahora = () => new Date().toISOString();
const editor = (u) => u.role === 'ceo' || u.role === 'coo';
const fecha = (x) => (typeof x === 'string' && !Number.isNaN(Date.parse(x)) ? new Date(x).toISOString() : ahora());

// ---------- Las plantillas: el PDF + los 12 agentes del repo (solo se leen para importar) ----------
let cache = { at: 0, xs: null };
export async function plantillas() {
  if (cache.xs && Date.now() - cache.at < 5 * 60 * 1000) return cache.xs;
  const out = [ESTRATEGIA_GUIADA];
  for (const a of AGENTES) {
    const fuente = `${a.carpeta}brain/WORKFLOW.md`;
    let md = null; try { md = (await readFile(fuente))?.content || null; } catch {}
    const w = md ? leerWorkflow(md, { codigo: a.n }) : { limites: [], recibe: [], entrega: [], etapas: [] };
    out.push({ id: a.id, n: a.n, nombre: a.nombre, depto: a.depto, hace: a.hace, fuente, leido: Boolean(md), ...w });
  }
  cache = { at: Date.now(), xs: out };
  return out;
}

// ---------- Quién ve qué ----------
async function ver(u, run, sc) {
  if (!run) return false;
  if (run.cliente === 'personal') return u.role === 'ceo';
  if (!run.cliente || run.cliente === 'inherent') return true;
  const s = sc === undefined ? await scoper(u) : sc;
  return !s || s.client(run.cliente);
}
const resumen = (r) => ({ id: r.id, v: r.v, titulo: r.titulo, flujo: { id: r.flujo?.id, nombre: r.flujo?.nombre, agente: r.flujo?.agente, depto: r.flujo?.depto, area: r.flujo?.area }, cliente: r.cliente || '', cliente_nombre: r.cliente_nombre || '', archivado: Boolean(r.archivado), pausado: Boolean(r.pausado), completo: completo(r), activa: activa(r), etapas: (r.etapas || []).map((e) => ({ nombre: e.nombre, estado: e.estado, gate: e.gate })), creado_por: r.creado_por, actualizado: r._meta?.updated_at });
const resumenWf = (w, runs = []) => {
  const mios = runs.filter((r) => r.flujo?.id === w.id && !r.archivado);
  const completos = mios.filter((r) => completo(r)).length;
  const esperando = mios.filter((r) => !completo(r) && r.etapas?.[activa(r)]?.estado === 'revision').length;
  return { id: w.id, v: w.v, nombre: w.nombre, agente: w.agente, depto: w.depto, area: w.area || 'strategy', objetivo: w.objetivo || '', descripcion: w.descripcion, estado: w.estado, ia: w.ia || null, archivado: Boolean(w.archivado), origen: w.origen || null, etapas: (w.etapas || []).map((e) => ({ id: e.id, tipo: e.tipo, nombre: e.nombre, gate: e.gate, herramientas: e.herramientas || [] })), trabajos: { total: mios.length, en_curso: mios.length - completos, esperando, completos }, actualizado: w._meta?.updated_at };
};
// La primera vez que el CEO o el COO abren el Agent Area, los agentes del método llegan como agentes del OS (una copia de cada
// plantilla; después son independientes). Si ya hay alguno —aunque esté archivado—, no se vuelve a sembrar.
async function sembrar(u) {
  const out = [];
  for (const p of await plantillas()) if (p.etapas.length) out.push(await db.create(WF, { ...desdePlantilla(p), importado_en: ahora(), archivado: false, creado_por: u.email, historial: [{ at: ahora(), quien: u.email, accion: 'importar' }] }, u.email));
  return out;
}

async function cargar(req, res, u) {
  const r = await db.get(COLL, String(req.params.id || ''));
  if (!r || !(await ver(u, r))) { res.status(404).json({ error: 'Ese run no existe' }); return null; }
  return r;
}
async function guardar(res, u, r, cambio, nota = {}, coll = COLL) {
  const { id, v, _meta, ...data } = r;
  const nuevo = { ...data, ...cambio, historial: [...(data.historial || []), { at: ahora(), quien: u.email, ...nota }].slice(-500) };
  const d = await db.update(coll, id, nuevo, v, u.email);
  if (!d) { res.status(409).json({ error: 'Alguien lo cambió mientras lo veías. Recarga.', code: 'CONFLICTO' }); return null; }
  return d;
}
const motivo = (res, m) => res.status(m.startsWith('🚦') || /Aprueban|Corrigen/.test(m) ? 403 : 409).json({ error: m });

export function rutas(on) {
  // ----- Plantillas -----
  on('GET', 'agentes/plantillas', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    res.json({ plantillas: await plantillas() });
  });

  // ----- Workflows -----
  on('GET', 'agentes/workflows', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    let [ws, runs] = await Promise.all([db.list(WF), db.list(COLL)]);
    if (!ws.length && editor(u)) ws = await sembrar(u);
    const area = String(req.query.area || '');
    const items = ws.filter((w) => (req.query.archivados === '1' || !w.archivado) && (!area || (w.area || 'strategy') === area)).map((w) => resumenWf(w, runs)).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
    res.json({ items, editor: editor(u) });
  });
  on('GET', 'agentes/workflows/:id', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const w = await db.get(WF, String(req.params.id || '')); if (!w) return res.status(404).json({ error: 'Ese workflow no existe' });
    res.json({ workflow: w, editor: editor(u) });
  });
  on('POST', 'agentes/workflows', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (!editor(u)) return res.status(403).json({ error: 'Crean workflows el CEO o el COO' });
    const b = body(req);
    let w;
    if (b.plantilla) {
      const p = (await plantillas()).find((x) => x.id === b.plantilla);
      if (!p || !p.etapas.length) return res.status(400).json({ error: 'Esa plantilla no existe o no tiene etapas' });
      w = { ...desdePlantilla(p), importado_en: ahora() };
      if (b.area) w.area = normalizarWorkflow({ area: b.area }).area;
    } else if (b.desde) {
      const o = await db.get(WF, String(b.desde)); if (!o) return res.status(404).json({ error: 'Ese workflow no existe' });
      w = { ...normalizarWorkflow({ ...o, nombre: `${o.nombre} (copia)`, estado: 'borrador' }), origen: { tipo: 'copia', id: o.id } };
    } else w = { ...normalizarWorkflow({ nombre: b.nombre || 'Agente nuevo', agente: b.agente, area: b.area, descripcion: b.descripcion, etapas: [{ tipo: 'investigacion', nombre: 'Investigación' }] }), origen: { tipo: 'nuevo' } };
    const d = await db.create(WF, { ...w, archivado: false, creado_por: u.email, historial: [{ at: ahora(), quien: u.email, accion: b.plantilla ? 'importar' : 'crear' }] }, u.email);
    res.json({ workflow: d });
  });
  on('POST', 'agentes/workflows/:id/guardar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (!editor(u)) return res.status(403).json({ error: 'Editan workflows el CEO o el COO' });
    const w = await db.get(WF, String(req.params.id || '')); if (!w) return res.status(404).json({ error: 'Ese workflow no existe' });
    const b = body(req);
    if (b.v != null && Number(b.v) !== w.v) return res.status(409).json({ error: 'Alguien cambió este workflow. Recarga.', code: 'CONFLICTO' });
    const limpio = normalizarWorkflow({ ...w, ...b });
    if (!limpio.etapas.length) return res.status(400).json({ error: 'El workflow necesita al menos una etapa' });
    const d = await guardar(res, u, w, limpio, { accion: 'editar' }, WF);
    if (d) res.json({ workflow: d });
  });
  on('POST', 'agentes/workflows/:id/archivar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (!editor(u)) return res.status(403).json({ error: 'Archivan workflows el CEO o el COO' });
    const w = await db.get(WF, String(req.params.id || '')); if (!w) return res.status(404).json({ error: 'Ese workflow no existe' });
    const archivado = body(req).archivado !== false;
    const d = await guardar(res, u, w, { archivado }, { accion: archivado ? 'archivar' : 'restaurar' }, WF);
    if (d) res.json({ workflow: d });
  });

  // ----- Runs -----
  on('GET', 'agentes/runs', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const sc = await scoper(u), todos = await db.list(COLL), out = [];
    const agente = String(req.query.agente || '');
    for (const r of todos) if ((req.query.archivados === '1' || !r.archivado) && (!agente || r.flujo?.id === agente) && (await ver(u, r, sc))) out.push(resumen(r));
    out.sort((a, b) => String(b.actualizado).localeCompare(String(a.actualizado)));
    res.json({ items: out });
  });
  on('GET', 'agentes/runs/:id', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    res.json({ run: r, rol: u.role });
  });
  on('POST', 'agentes/runs', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const b = body(req), w = await db.get(WF, String(b.workflow || ''));
    if (!w || w.archivado || !w.etapas?.length) return res.status(400).json({ error: 'Ese agente no existe o no tiene etapas' });
    if (w.estado === 'pausado') return res.status(409).json({ error: 'El agente está en pausa: actívalo en sus Settings' });
    const slug = lc(txt(b.cliente, 60));
    if (slug === 'personal' && u.role !== 'ceo') return res.status(403).json({ error: 'La marca personal solo la ve el CEO' });
    if (slug && slug !== 'personal' && !(await intel.slugValido(slug))) return res.status(400).json({ error: 'Ese cliente no existe' });
    if (slug && !(await ver(u, { cliente: slug }))) return res.status(403).json({ error: 'Ese cliente no está en tu alcance' });
    const run = {
      titulo: txt(b.titulo, 140) || `${w.nombre} · ${ahora().slice(0, 10)}`,
      objetivo: txt(b.objetivo, 1000), cliente: slug, cliente_nombre: txt(b.cliente_nombre, 120),
      flujo: { id: w.id, v: w.v, nombre: w.nombre, agente: w.agente, depto: w.depto, area: w.area || 'strategy', limites: w.limites || [], origen: w.origen || null, ia: w.ia || null },
      etapas: w.etapas.map((e) => ({ ...e, estado: 'pendiente', intento: 0, actividades: [], campos: [], confianza: 0, faltantes: [], salida: '', via: '', modelo: '', stub: false, ajuste: '', aprobada_por: '', aprobada_en: '' })),
      inputs: [], evidencia: [], creado_por: u.email, archivado: false, pausado: false,
      historial: [{ at: ahora(), quien: u.email, accion: 'crear' }],
    };
    res.json({ run: await db.create(COLL, run, u.email) });
  });

  on('POST', 'agentes/runs/:id/etapa/:n/resultado', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    const n = Number(req.params.n), m = puede(r, n, 'resultado', { rol: u.role }); if (m) return motivo(res, m);
    const b = body(req), e = r.etapas[n], intento = (e.intento || 0) + 1;
    const via = ['os', 'hermes', 'puente', 'claude-web', 'simulado'].includes(b.via) ? b.via : 'simulado';
    const acts = (Array.isArray(b.actividades) ? b.actividades : []).slice(0, 60).map((a) => ({ titulo: txt(a?.titulo ?? a, 160), detalle: txt(a?.detalle, 400), aviso: Boolean(a?.aviso), pasos: (Array.isArray(a?.pasos) ? a.pasos : []).slice(0, 12).map((p) => txt(p, 120)), at: fecha(a?.at), intento })).filter((a) => a.titulo);
    const campos = (Array.isArray(b.campos) ? b.campos : []).slice(0, 20).map((c) => ({ campo: txt(c?.campo, 80), valor: txt(c?.valor, 1200), items: (Array.isArray(c?.items) ? c.items : []).slice(0, 12).map((x) => txt(x, 300)), fuentes: (Array.isArray(c?.fuentes) ? c.fuentes : []).slice(0, 10).map((x) => txt(x, 20)), estado: c?.estado === 'evidencia' && via !== 'simulado' ? 'evidencia' : 'hipotesis' })).filter((c) => c.campo);
    const etapas = r.etapas.map((x, i) => (i !== n ? x : { ...x, estado: 'revision', intento, actividades: [...(e.estado === 'ajuste' ? x.actividades : []), ...acts].slice(-150), campos, confianza: via === 'simulado' ? 0 : Math.max(0, Math.min(100, Number(b.confianza) || 0)), faltantes: (Array.isArray(b.faltantes) ? b.faltantes : []).slice(0, 10).map((x) => txt(x, 300)), salida: txt(b.salida, 60000), via, modelo: txt(b.modelo, 80), stub: via === 'simulado', aprobada_por: '', aprobada_en: '' }));
    const evi = (Array.isArray(b.evidencia) ? b.evidencia : []).slice(0, 30).map((x, k) => ({ id: txt(x.id, 20) || `${n}-${intento}-${k}`, etapa: n, titulo: txt(x.titulo, 200) || 'Fuente', url: txt(x.url, 500), extracto: txt(x.extracto, 600), verificada: false, por: via }));
    const d = await guardar(res, u, r, { etapas, evidencia: [...(r.evidencia || []).filter((x) => x.etapa !== n || x.por === 'persona'), ...evi] }, { accion: 'ejecutar', etapa: n, nota: intento > 1 ? `Intento ${intento} · ${via}` : via });
    if (d) res.json({ run: d });
  });

  on('POST', 'agentes/runs/:id/etapa/:n/aprobar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    const n = Number(req.params.n), m = puede(r, n, 'aprobar', { rol: u.role }); if (m) return motivo(res, m);
    const etapas = r.etapas.map((x, i) => (i !== n ? x : { ...x, estado: 'aprobada', aprobada_por: u.email, aprobada_en: ahora() }));
    const d = await guardar(res, u, r, { etapas }, { accion: 'aprobar', etapa: n, nota: txt(body(req).nota, 500) });
    if (d) res.json({ run: d });
  });
  on('POST', 'agentes/runs/:id/etapa/:n/corregir', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    const n = Number(req.params.n), m = puede(r, n, 'corregir', { rol: u.role }); if (m) return motivo(res, m);
    const b = body(req), etapas = r.etapas.map((x, i) => (i !== n ? x : { ...x, salida: txt(b.salida, 60000) }));
    const d = await guardar(res, u, r, { etapas }, { accion: 'corregir', etapa: n, nota: txt(b.nota, 500) || 'Resultado corregido a mano' });
    if (d) res.json({ run: d });
  });
  on('POST', 'agentes/runs/:id/etapa/:n/ajuste', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    const n = Number(req.params.n), m = puede(r, n, 'ajuste', { rol: u.role }); if (m) return motivo(res, m);
    const nota = txt(body(req).nota, 1000); if (!nota) return res.status(400).json({ error: 'Di qué ajuste necesitas' });
    const etapas = r.etapas.map((x, i) => (i !== n ? x : { ...x, estado: 'ajuste', ajuste: nota }));
    const d = await guardar(res, u, r, { etapas }, { accion: 'ajuste', etapa: n, nota });
    if (d) res.json({ run: d });
  });

  // Inputs del run (lo que el equipo le da al agente: texto pegado, enlaces, archivos de texto). Se archivan, no se borran.
  on('POST', 'agentes/runs/:id/inputs', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    if (r.archivado) return res.status(409).json({ error: 'El run está archivado' });
    const b = body(req);
    if (b.id) {
      const inputs = (r.inputs || []).map((x) => (x.id === b.id ? { ...x, archivado: b.archivado !== false } : x));
      const d = await guardar(res, u, r, { inputs }, { accion: b.archivado !== false ? 'quitar-input' : 'input', nota: b.id });
      return d && res.json({ run: d });
    }
    const tipo = ['texto', 'link', 'archivo'].includes(b.tipo) ? b.tipo : 'texto';
    const url = txt(b.url, 500);
    if (tipo === 'link' && !/^https?:\/\//.test(url)) return res.status(400).json({ error: 'El enlace tiene que empezar con http(s)://' });
    const titulo = txt(b.titulo, 160) || (tipo === 'link' ? url.replace(/^https?:\/\//, '').slice(0, 80) : 'Nota');
    if ((r.inputs || []).length >= 60) return res.status(400).json({ error: 'Máximo 60 inputs por run' });
    const nuevo = { id: `i-${Date.now().toString(36)}`, tipo, titulo, url, texto: txt(b.texto, 40000), meta: txt(b.meta, 120), interna: b.interna !== false, quien: u.email, at: ahora(), archivado: false };
    const d = await guardar(res, u, r, { inputs: [...(r.inputs || []), nuevo] }, { accion: 'input', nota: titulo });
    if (d) res.json({ run: d });
  });

  on('POST', 'agentes/runs/:id/evidencia', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    const b = body(req), n = Number(b.etapa ?? activa(r));
    if (!r.etapas[n]) return res.status(400).json({ error: 'Esa etapa no existe' });
    if (!b.id) return res.status(400).json({ error: 'Las fuentes nuevas se agregan como inputs' });
    const evidencia = (r.evidencia || []).map((x) => (x.id === b.id && x.etapa === n ? { ...x, verificada: Boolean(b.verificada), revisada_por: u.email } : x));
    const d = await guardar(res, u, r, { evidencia }, { accion: b.verificada ? 'verificar' : 'desverificar', etapa: n });
    if (d) res.json({ run: d });
  });

  on('POST', 'agentes/runs/:id/pausa', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    const pausado = body(req).pausado !== false;
    const d = await guardar(res, u, r, { pausado }, { accion: pausado ? 'pausar' : 'reanudar' });
    if (d) res.json({ run: d });
  });
  on('POST', 'agentes/runs/:id/archivar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    if (!editor(u) && lc(r.creado_por) !== lc(u.email)) return res.status(403).json({ error: 'Archiva quien lo creó, el CEO o el COO' });
    const archivado = body(req).archivado !== false;
    const d = await guardar(res, u, r, { archivado }, { accion: archivado ? 'archivar' : 'restaurar' });
    if (d) res.json({ run: d });
  });
}
