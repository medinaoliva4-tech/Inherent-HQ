// El despertador del motor: POST /api/workflow/tick, protegido por un secreto de cabecera (CRON_SECRET).
// Quien lo llame (un cron externo, el cron de Vercel si algún día se activa, o `curl` a mano) hace avanzar, en cada pasada:
//   · las corridas de workflows que ya tocan (paso listo, reintento vencido, lease muerto) — con los topes de proveedor del motor;
//   · los lotes de correos YA aprobados que quedaron en cola (tope diario, horario, bajas, auto-pausa: los decide la política del Lead Engine);
//   · el aviso por Telegram de lo nuevo en Decide (canales.avisarDecisiones).
// Lo que NO hace: aprobar nada, ni saltarse un tope o un horario, ni tocar lo que espera a una persona. Un adaptador sin conexión se SALTA y se dice
// (no se marca la corrida como fallida). Sin CRON_SECRET en el entorno la ruta responde 503: nadie la activa por accidente. No hay cron en vercel.json.
import crypto from 'node:crypto';
import * as db from './db.js';
import * as W from './workflow.js';
import { ADAPTADORES } from './workflow-rutas.js';
import * as LE from './lead-engine.js';
import { avisarDecisiones } from './canales.js';

const deps = { ahora: () => Date.now(), correo: null, config: {}, maxCorridas: 20, maxLotes: 5 };
// correo / config: los mismos que recibe lead-engine (el envío real y la política de horario y topes). Sin correo, los lotes no se tocan.
export function configurar(o = {}) { Object.assign(deps, o); }

const h = (x) => crypto.createHash('sha256').update(String(x)).digest();
export const secretoOk = (dado, real) => Boolean(real) && Boolean(dado) && crypto.timingSafeEqual(h(dado), h(real)); // tiempo constante: se comparan resúmenes del mismo largo
const cabecera = (req) => String(req.headers['x-cron-secret'] || '').trim() || String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();

export async function tick() {
  const ahora = deps.ahora(), adaptadores = { ...ADAPTADORES, ...LE.adaptadoresDe({ correo: deps.correo, config: deps.config, ahora: deps.ahora }) };
  const out = { corridas: { avanzadas: 0, saltadas: [], errores: 0 }, lotes: { enviados: 0, procesados: 0, saltados: [], errores: 0 }, decisiones: null };

  for (const { run, pasosListos } of await W.corridasVencidas({ ahora, limite: deps.maxCorridas })) {
    const caido = pasosListos.map((p) => ({ p, cap: adaptadores[p.adaptador]?.capability?.() ?? { estado: adaptadores[p.adaptador] ? 'ready' : 'disconnected' } })).find((x) => x.p.tipo === 'accion' && x.cap.estado !== 'ready');
    if (caido) { out.corridas.saltadas.push({ run: run.id, motivo: 'sin_conexion', adaptador: caido.p.adaptador }); continue; } // no se falla la corrida: espera a que haya conexión
    try { await W.avanzar(run.id, { adaptadores, ahora, dueno: `tick-${process.pid}` }); out.corridas.avanzadas++; } catch (e) { out.corridas.errores++; }
  }

  const lotes = (await db.list(LE.COLL_LOTE)).filter((l) => ['parcial', 'aprobado'].includes(l.estado) && l.aprobado?.hash && l.aprobado.hash === LE.hashLote(l)).slice(0, deps.maxLotes); // solo el contenido EXACTO que se aprobó
  for (const l of lotes) {
    if (!deps.correo) { out.lotes.saltados.push({ lote: l.id, motivo: 'sin_correo' }); continue; }
    try { const r = await LE.enviarPendientes({ correo: deps.correo, config: deps.config, ahora: deps.ahora }, { loteId: l.id, hash: l.aprobado.hash, llave: `${l.aprobado.run_id}:enviar`, ahora }); out.lotes.procesados++; out.lotes.enviados += r.enviados || 0; } catch (e) { out.lotes.errores++; }
  }

  try { out.decisiones = await avisarDecisiones(); } catch { out.decisiones = { enviados: 0, motivo: 'error' }; }
  return out;
}

export function rutas(on) {
  on('POST', 'workflow/tick', async (req, res) => {
    const real = String(process.env.CRON_SECRET || '').trim();
    if (!real) return res.status(503).json({ error: 'El despertador está apagado: falta CRON_SECRET en el entorno.', code: 'SIN_CRON' });
    if (!secretoOk(cabecera(req), real)) return res.status(401).json({ error: 'No autorizado' });
    try { res.json(await tick()); } catch { res.status(500).json({ error: 'No se pudo completar. Vuelve a intentar.', code: 'SERVIDOR' }); }
  });
}
