// Agent Area (#/ai/agentes) · runs de agentes por etapas, con validación humana obligatoria (AGENTS IN OS.pdf).
// Colección `agent_runs`: NO pasa por /api/db (collGuard la desconoce → 404); solo por estas rutas, que aplican las reglas:
//   · la etapa activa es la primera sin aprobar; ninguna otra se trabaja (409)
//   · toda etapa se aprueba para avanzar; aprueban el CEO o el COO, y las 🚦 (gate del CEO) solo el CEO (403)
//   · nada se borra: el run se archiva; el historial y la evidencia solo se agregan
//   · el alcance por cliente (`scoper`) filtra los runs; la marca `personal`, solo el CEO; el rol `client`, nunca
// La IA corre en la compu de la persona (Hermes, el puente o claude.ai, como toda herramienta): el servidor solo guarda lo que
// llega, marcado con su vía y, si fue simulado, como STUB. La evidencia que dice un modelo entra SIN VERIFICAR.
import * as db from './db.js';
import { guard, scoper } from './access.js';
import { readFile } from './gh.js';
import * as intel from './intel.js';
import { body } from './http.js';
import { AGENTES } from '../../public/js/harness/agentes.js';
import { ESTRATEGIA_GUIADA, leerWorkflow, puede, activa, completo } from '../../public/js/agentes-flujos.js';

export const COLL = 'agent_runs';
const lc = (x) => String(x || '').toLowerCase();
const txt = (s, n) => String(s ?? '').trim().slice(0, n);
const ahora = () => new Date().toISOString();

// ---------- Los flujos: el PDF + los 12 agentes del repo (se leen de su WORKFLOW.md; en Vercel, de la copia del build) ----------
let cache = { at: 0, flujos: null };
export async function flujos() {
  if (cache.flujos && Date.now() - cache.at < 5 * 60 * 1000) return cache.flujos;
  const out = [ESTRATEGIA_GUIADA];
  for (const a of AGENTES) {
    const fuente = `${a.carpeta}brain/WORKFLOW.md`;
    let md = null; try { md = (await readFile(fuente))?.content || null; } catch {}
    const w = md ? leerWorkflow(md, { codigo: a.n }) : { limites: [], recibe: [], entrega: [], etapas: [] };
    out.push({ id: a.id, n: a.n, nombre: a.nombre, depto: a.depto, hace: a.hace, ventana: a.ventana, fuente, leido: Boolean(md), ...w });
  }
  cache = { at: Date.now(), flujos: out };
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
const resumen = (r) => ({ id: r.id, v: r.v, titulo: r.titulo, flujo: { id: r.flujo?.id, n: r.flujo?.n, nombre: r.flujo?.nombre }, cliente: r.cliente || '', cliente_nombre: r.cliente_nombre || '', archivado: Boolean(r.archivado), completo: completo(r), activa: activa(r), etapas: (r.etapas || []).map((e) => ({ nombre: e.nombre, estado: e.estado, gate: e.gate })), creado_por: r.creado_por, actualizado: r._meta?.updated_at });

async function cargar(req, res, u) {
  const r = await db.get(COLL, String(req.params.id || ''));
  if (!r || !(await ver(u, r))) { res.status(404).json({ error: 'Ese run no existe' }); return null; }
  return r;
}
// Guarda con la v leída (409 si alguien lo cambió) y agrega al historial.
async function guardar(res, u, r, cambio, nota = {}) {
  const { id, v, _meta, ...data } = r;
  const nuevo = { ...data, ...cambio, historial: [...(data.historial || []), { at: ahora(), quien: u.email, ...nota }].slice(-500) };
  const d = await db.update(COLL, id, nuevo, v, u.email);
  if (!d) { res.status(409).json({ error: 'Alguien cambió este run mientras lo veías. Recarga.', code: 'CONFLICTO' }); return null; }
  return d;
}
const motivo = (res, m, code = 409) => res.status(m.startsWith('🚦') || /Aprueban|Corrigen/.test(m) ? 403 : code).json({ error: m });

export function rutas(on) {
  on('GET', 'agentes/flujos', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    res.json({ flujos: await flujos(), rol: u.role });
  });

  on('GET', 'agentes/runs', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const sc = await scoper(u), todos = await db.list(COLL), out = [];
    for (const r of todos) if ((req.query.archivados === '1' || !r.archivado) && (await ver(u, r, sc))) out.push(resumen(r));
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
    const b = body(req), f = (await flujos()).find((x) => x.id === b.flujo);
    if (!f || !f.etapas.length) return res.status(400).json({ error: 'Ese flujo no existe o no tiene etapas' });
    const slug = lc(txt(b.cliente, 60));
    if (slug === 'personal' && u.role !== 'ceo') return res.status(403).json({ error: 'La marca personal solo la ve el CEO' });
    if (slug && slug !== 'personal' && !(await intel.slugValido(slug))) return res.status(400).json({ error: 'Ese cliente no existe' });
    if (slug && !(await ver(u, { cliente: slug }))) return res.status(403).json({ error: 'Ese cliente no está en tu alcance' });
    const run = {
      titulo: txt(b.titulo, 140) || `${f.nombre} · ${ahora().slice(0, 10)}`,
      objetivo: txt(b.objetivo, 1000),
      cliente: slug, cliente_nombre: txt(b.cliente_nombre, 120),
      flujo: { id: f.id, n: f.n, nombre: f.nombre, depto: f.depto, fuente: f.fuente, limites: f.limites || [] },
      // La definición de las etapas se congela en el run: lo aprobado sigue siendo trazable aunque cambie el WORKFLOW.md.
      etapas: f.etapas.map((e) => ({ ...e, estado: 'pendiente', intento: 0, actividades: [], salida: '', via: '', modelo: '', stub: false, ajuste: '', aprobada_por: '', aprobada_en: '' })),
      evidencia: [], creado_por: u.email, archivado: false,
      historial: [{ at: ahora(), quien: u.email, accion: 'crear' }],
    };
    const d = await db.create(COLL, run, u.email);
    res.json({ run: d });
  });

  // El resultado de la etapa activa (lo produjo la IA de la persona o el simulado).
  on('POST', 'agentes/runs/:id/etapa/:n/resultado', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    const n = Number(req.params.n), m = puede(r, n, 'resultado', { rol: u.role }); if (m) return motivo(res, m);
    const b = body(req), e = r.etapas[n], intento = (e.intento || 0) + 1, at = ahora();
    const via = ['hermes', 'puente', 'claude-web', 'simulado'].includes(b.via) ? b.via : 'simulado';
    const acts = (Array.isArray(b.actividades) ? b.actividades : []).slice(0, 40).map((t) => ({ t: txt(t, 400), at, intento }));
    const etapas = r.etapas.map((x, i) => (i !== n ? x : { ...x, estado: 'revision', intento, actividades: [...(e.estado === 'ajuste' ? x.actividades : []), ...acts].slice(-120), salida: txt(b.salida, 60000), via, modelo: txt(b.modelo, 80), stub: via === 'simulado', aprobada_por: '', aprobada_en: '' }));
    const evi = (Array.isArray(b.evidencia) ? b.evidencia : []).slice(0, 30).map((x, k) => ({ id: `${n}-${intento}-${k}`, etapa: n, titulo: txt(x.titulo, 200) || 'Fuente', url: txt(x.url, 500), extracto: txt(x.extracto, 600), verificada: via === 'simulado' ? Boolean(x.verificada) : false, por: via }));
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

  on('POST', 'agentes/runs/:id/evidencia', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    const b = body(req), n = Number(b.etapa ?? activa(r));
    if (!r.etapas[n]) return res.status(400).json({ error: 'Esa etapa no existe' });
    if (b.id) { // marcar verificada / sin verificar (un humano lo revisó)
      const evidencia = (r.evidencia || []).map((x) => (x.id === b.id ? { ...x, verificada: Boolean(b.verificada), revisada_por: u.email } : x));
      const d = await guardar(res, u, r, { evidencia }, { accion: b.verificada ? 'verificar' : 'desverificar', etapa: n });
      return d && res.json({ run: d });
    }
    const titulo = txt(b.titulo, 200); if (!titulo) return res.status(400).json({ error: 'La fuente necesita título' });
    const nueva = { id: `p-${Date.now().toString(36)}`, etapa: n, titulo, url: txt(b.url, 500), extracto: txt(b.extracto, 600), verificada: Boolean(b.verificada), por: 'persona', quien: u.email };
    const d = await guardar(res, u, r, { evidencia: [...(r.evidencia || []), nueva] }, { accion: 'fuente', etapa: n, nota: titulo });
    if (d) res.json({ run: d });
  });

  on('POST', 'agentes/runs/:id/archivar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const r = await cargar(req, res, u); if (!r) return;
    if (u.role !== 'ceo' && u.role !== 'coo' && lc(r.creado_por) !== lc(u.email)) return res.status(403).json({ error: 'Archiva quien lo creó, el CEO o el COO' });
    const archivado = body(req).archivado !== false;
    const d = await guardar(res, u, r, { archivado }, { accion: archivado ? 'archivar' : 'restaurar' });
    if (d) res.json({ run: d });
  });
}
