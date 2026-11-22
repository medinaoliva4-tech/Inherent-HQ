// Rutas del motor de workflows (api/_lib/workflow.js). Leer: quien ve Operaciones (`work`). Crear y cancelar definiciones: CEO y COO.
// Los adaptadores reales (publicar, pautar, enviar) NO están conectados: dicen «disconnected» y los pasos que los usan fallan con su motivo.
import * as db from './db.js';
import { guard } from './access.js';
import { body } from './http.js';
import * as W from './workflow.js';

// El catálogo de adaptadores del OS. `externo` = envía, publica o gasta (siempre detrás de una aprobación). Los internos son idempotentes.
export const ADAPTADORES = {
  nota: { seguro: true, descripcion: 'Deja una nota en la bitácora', capability: () => ({ estado: 'ready' }), execute: async ({ params }) => ({ nota: W.redactar(params?.texto) }) },
  'crear-tarea': {
    seguro: true, descripcion: 'Crea una tarea en Operaciones (una sola vez por llave)', capability: () => ({ estado: 'ready' }),
    execute: async ({ params, llave }) => {
      const id = `wf-${llave.replace(/[^\w-]/g, '-')}`.slice(0, 100), ya = await db.get('tasks', id);
      if (ya) return { tarea: id, repetida: true }; // idempotente: el mismo paso no crea dos tareas
      await db.create('tasks', { title: W.redactar(params?.titulo || 'Tarea del workflow'), status: 'Por empezar', tipo: 'Interna', origen: 'workflow', assignee: '' }, 'workflow', id);
      return { tarea: id };
    },
  },
  'zernio-publicar': { externo: true, seguro: false, descripcion: 'Programar o publicar en redes (Zernio)', capability: () => ({ estado: 'disconnected', razon: 'Zernio todavía no está conectado a los workflows' }), execute: async () => { throw new Error('sin conexión'); } },
  'meta-pauta': { externo: true, seguro: false, descripcion: 'Cambiar pauta o presupuesto (Meta)', capability: () => ({ estado: 'disconnected', razon: 'Meta Ads todavía no está conectado a los workflows' }), execute: async () => { throw new Error('sin conexión'); } },
};
const lc = (x) => String(x || '').toLowerCase();
const salida = (r) => ({ id: r.id, def_id: r.def_id, def_version: r.def_version, client_slug: r.client_slug, estado: r.estado, v: r.v, owner: r.owner, pasos: r.pasos, eventos: (r.eventos || []).slice(-30), resultados: r.resultados });
const err = (res, e) => res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo completar', code: e.code || 'SERVIDOR', ...(e.errores ? { errores: e.errores } : {}) });

export function rutas(on, { adaptadores = ADAPTADORES } = {}) {
  const abre = (req, res, write = false) => guard(req, res, 'work', { write });
  const puedeDefinir = (u) => ['ceo', 'coo'].includes(u.role);
  on('GET', 'workflows', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const ult = new Map(); for (const d of await db.list(W.COLL_DEF)) if (!ult.has(d.def_id) || ult.get(d.def_id).version < d.version) ult.set(d.def_id, d);
    res.json({ definiciones: [...ult.values()].map((d) => ({ def_id: d.def_id, nombre: d.nombre, version: d.version, pasos: d.pasos })),
      adaptadores: Object.entries(adaptadores).map(([k, a]) => ({ id: k, externo: Boolean(a.externo), seguro: Boolean(a.seguro), descripcion: a.descripcion || '', ...a.capability?.() })) });
  });
  on('POST', 'workflows', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    if (!puedeDefinir(u)) return res.status(403).json({ error: 'Solo el CEO o el COO definen workflows' });
    try { const d = await W.guardarDefinicion(u, body(req).definicion, { adaptadores }); res.json({ def_id: d.def_id, version: d.version }); } catch (e) { err(res, e); }
  });
  on('POST', 'workflows/:def/run', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const b = body(req), def = (await db.list(W.COLL_DEF)).filter((d) => d.def_id === req.params.def).sort((a, z) => z.version - a.version)[0];
    if (!def) return res.status(404).json({ error: 'No existe esa definición' });
    try { const { run, repetida } = await W.iniciar(u, def, { key: b.key, input: b.input, client_slug: lc(b.client_slug) }); res.json({ ...salida(await W.avanzar(run.id, { adaptadores })), repetida }); } catch (e) { err(res, e); }
  });
  const deRun = async (req, res, write) => {
    const u = await abre(req, res, write); if (!u) return {};
    const run = await db.get(W.COLL_RUN, String(req.params.id)); if (!run) { res.status(404).json({ error: 'No existe esa corrida' }); return {}; }
    if (!['ceo', 'coo'].includes(u.role) && run.owner !== u.email) { res.status(404).json({ error: 'No existe esa corrida' }); return {}; } // lo de otras personas no se ve
    return { u, run };
  };
  on('GET', 'workflow-runs/:id', async (req, res) => { const { run } = await deRun(req, res, false); if (run) res.json(salida(run)); });
  on('POST', 'workflow-runs/:id/avanzar', async (req, res) => { const { run } = await deRun(req, res, true); if (!run) return; try { res.json(salida(await W.avanzar(run.id, { adaptadores }))); } catch (e) { err(res, e); } });
  on('POST', 'workflow-runs/:id/cancelar', async (req, res) => { const { u, run } = await deRun(req, res, true); if (!run) return; try { res.json(salida(await W.cancelar(u, run.id))); } catch (e) { err(res, e); } });
  on('POST', 'workflow-runs/:id/pasos/:paso/aprobar', async (req, res) => {
    const { u, run } = await deRun(req, res, true); if (!run) return;
    const b = body(req);
    try { await W.aprobar(u, run.id, String(req.params.paso), { hash: b.hash, v: b.v }); res.json(salida(await W.avanzar(run.id, { adaptadores }))); } catch (e) { err(res, e); }
  });
}
