// Política pura compartida por API/UI/MCP. El contexto siempre lo calcula el servidor.
import { reglaDia11, reglaHistorial } from './production/planner.js';
import { estadoDe } from './element.js';
export const necesitaOrigen = (b) => ['post', 'shoot'].includes(b?.kind) && !b.archivado && !['Archivado', 'Cancelado'].includes(b.status) && (b.kind === 'shoot' || Boolean(b.date) || estadoDe(b) !== 'Idea');
export function evaluarContenido(u, b, cur, c = {}) {
  const bad = (code, error, status = 423) => ({ code, error, status });
  const h = reglaHistorial(b, cur); if (h) return bad('HISTORIAL', h, 400);
  if (!['post', 'shoot'].includes(b?.kind)) return null;
  if (b.archivado || ['Archivado', 'Cancelado'].includes(b.status)) return null;
  if (b.date && (!/^\d{4}-\d{2}-\d{2}$/.test(b.date) || Number.isNaN(Date.parse(`${b.date}T12:00:00Z`)) || new Date(`${b.date}T12:00:00Z`).toISOString().slice(0, 10) !== b.date)) return bad('FECHA', 'La fecha no es válida', 400);
  if (!c.ficha) return bad('SIN_FICHA', 'Falta la ficha de oferta de esta marca: define el alcance antes de crear piezas.');
  const d = reglaDia11(b, cur, u.role); if (d) return bad('DIA_11', d);
  if (b.kind === 'post' && b.diseno && b.slot?.plan && !b.idea_chat && !cur?.diseno) return bad('REGLA_PIEZA', 'Esta pieza del plan todavía no tiene idea: primero Ideas, después diseño.');
  if (!necesitaOrigen(b)) return null;
  if (!c.origen) return bad('SIN_ORIGEN', 'Elige una versión aprobada que trace hasta el cliente ideal antes de producir o agendar.');
  if (b.kind === 'post' && b.date && !c.brief) return bad('SIN_BRIEF', `Falta el brief del ciclo de ${String(b.date).slice(0, 7)}. Guárdala como idea sin fecha o pide el brief.`);
  if (c.techo != null && c.total > c.techo) return bad('FUERA_DEL_ALCANCE', `Fuera de ficha: ${c.total} piezas superan el techo de ${c.techo} de este mes.`);
  return null;
}
