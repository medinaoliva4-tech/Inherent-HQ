// Eventos sin contenido del cliente. Se guardan junto al resultado, en la misma escritura.
import { activa, completo } from './agentes-flujos.js';

const lc = (x) => String(x || '').toLowerCase();
function estado(coll, d) {
  if (!d || d.archivado || d.oculto) return null;
  if (coll === 'chat_sesiones') {
    if (d.turno?.estado === 'error') return { tipo: 'error', firma: 'error' };
    if (d.turno?.estado !== 'listo') return null;
    const m = [...(d.mensajes || [])].reverse().find((x) => x.role === 'assistant');
    const tipo = m?.propuestas?.some((p) => p.estado === 'pendiente') ? 'decidir' : 'listo';
    return { tipo, firma: tipo };
  }
  if (coll !== 'agent_runs' || d.pausado) return null;
  if (completo(d)) return { tipo: 'listo', firma: 'completo' };
  const n = activa(d), e = d.etapas?.[n];
  const tipo = ['revision', 'pregunta'].includes(e?.estado) ? 'decidir' : e?.estado === 'detenida' ? 'error' : '';
  return tipo ? { tipo, firma: `${n}:${e.estado}` } : null;
}
export function cambioAviso(coll, antes, despues, at = new Date().toISOString()) {
  const a = estado(coll, antes), b = estado(coll, despues);
  if (a?.firma === b?.firma) return {};
  if (!b) return { aviso_chat: null };
  const owner = lc(coll === 'chat_sesiones' ? despues.owner : despues.creado_por);
  if (!owner || !antes.id) return {};
  return { aviso_chat: { id: `${coll}:${antes.id}:${antes.v + 1}`, tipo: b.tipo, owner, at, enviado: false } };
}
export function avisoPublico(coll, id, a) {
  const tipos = { listo: ['Terminó tu trabajo', 'Ya puedes abrir la conversación.'], decidir: ['Necesita tu decisión', 'Abre la conversación para revisar y responder.'], error: ['Tu trabajo se detuvo', 'Abre la conversación para ver el error y reintentar.'] };
  if (!a || !tipos[a.tipo] || !['chat_sesiones', 'agent_runs'].includes(coll)) return null;
  const [title, body] = tipos[a.tipo];
  return { id: a.id, tipo: a.tipo, at: a.at, title, body, tag: a.id, url: `/#/chat/${coll === 'agent_runs' ? 'trabajo/' : ''}${encodeURIComponent(id)}` };
}
