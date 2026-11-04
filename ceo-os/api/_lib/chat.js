// El Chat en el servidor (PLAN-GATEWAY F3). Hace lo mismo que las sesiones de Hermes, pero las conversaciones viven en la
// base del OS (como en Claude: se guardan, se retoman desde cualquier compu) y las responde el trabajador del VPS.
// El OS no llama al VPS (D13): un turno nuevo queda «en_cola» en la conversación; el trabajador lo toma, escribe la respuesta
// en vivo en la misma conversación y la pantalla la relee mientras tanto.
//
// Colección propia `chat_sesiones` (no pasa por /api/db). Cada conversación es de quien la creó: nadie más la ve.
//   { owner, title, modo, mensajes: [{ role: 'user'|'assistant', content, at, tools?, modelo? }],
//     turno: { estado: en_cola|trabajando|listo|error|detenido, at, modelo, sistema, esfuerzo, error?, gw? },
//     resumen?: { hasta, texto } }   ← lo viejo resumido cuando la conversación ya no cabe en el contexto (D7)
import * as db from './db.js';
import { guard } from './access.js';
import { body } from './http.js';
import { leerIdSesion } from '../../public/js/llm/modos.js';

export const COLL = 'chat_sesiones';
const GW = 'gateway_estado';
const lc = (x) => String(x || '').toLowerCase();
const txt = (s, n) => String(s ?? '').slice(0, n);
const ahora = () => new Date().toISOString();
const MAX_MSGS = 400, MAX_MSG = 60000;
const enLinea = (g) => Boolean(g?.at && Date.now() - Date.parse(g.at) < 90 * 1000);

const resumenSesion = (s) => {
  const ult = [...(s.mensajes || [])].reverse().find((m) => m.role === 'user');
  return { id: s.id, title: s.title || '', preview: txt(ult?.content, 120), model: s.turno?.modelo || '', last_active: s._meta?.updated_at, started_at: s._meta?.created_at, message_count: (s.mensajes || []).length, en_curso: ['en_cola', 'trabajando'].includes(s.turno?.estado) };
};
async function mia(req, res, u) {
  const s = await db.get(COLL, txt(req.params.id, 120));
  if (!s || lc(s.owner) !== lc(u.email)) { res.status(404).json({ error: 'Esa conversación no existe' }); return null; }
  return s;
}
async function guardar(res, u, s, cambio) {
  const { id, v, _meta, ...data } = s;
  const d = await db.update(COLL, id, { ...data, ...cambio }, v, u.email);
  if (!d) { res.status(409).json({ error: 'La conversación cambió mientras tanto. Reintenta.', code: 'CONFLICTO' }); return null; }
  return d;
}

export function rutas(on) {
  // El servidor: en línea y con qué modelos (para el selector del Chat).
  on('GET', 'chat/servidor', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const g = await db.get(GW, 'vps').catch(() => null);
    res.json({ en_linea: enLinea(g), modelos: enLinea(g) ? g.modelos || [] : [], version: g?.version || '' });
  });

  on('GET', 'chat/sesiones', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const xs = (await db.list(COLL)).filter((s) => lc(s.owner) === lc(u.email) && !s.archivado).map(resumenSesion)
      .sort((a, b) => String(b.last_active).localeCompare(String(a.last_active)));
    res.json({ sessions: xs.slice(0, 300) });
  });

  on('POST', 'chat/sesiones', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const b = body(req), id = txt(b.id, 120);
    if (!leerIdSesion(id)) return res.status(400).json({ error: 'Id de conversación inválido' });
    if (await db.get(COLL, id)) return res.status(409).json({ error: 'Ya existe' });
    const d = await db.create(COLL, { owner: lc(u.email), title: txt(b.titulo, 120), modo: leerIdSesion(id).modo, mensajes: [], turno: null, archivado: false }, u.email, id);
    res.json(resumenSesion(d));
  });

  // La conversación completa. ?desde=N devuelve solo los mensajes a partir de N (la pantalla relee mientras responde).
  on('GET', 'chat/sesiones/:id', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    const desde = Math.max(0, Number(req.query.desde) || 0);
    res.json({ id: s.id, title: s.title, total: (s.mensajes || []).length, messages: (s.mensajes || []).slice(desde), turno: s.turno ? { estado: s.turno.estado, modelo: s.turno.modelo, error: s.turno.error || '', at: s.turno.at } : null });
  });

  on('DELETE', 'chat/sesiones/:id', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    const d = await guardar(res, u, s, { archivado: true }); // nada se borra: se archiva
    if (d) res.json({ ok: true });
  });

  on('POST', 'chat/sesiones/:id/fork', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    const b = body(req), id = txt(b.id, 120);
    if (!leerIdSesion(id)) return res.status(400).json({ error: 'Id de conversación inválido' });
    const d = await db.create(COLL, { owner: s.owner, title: txt(b.titulo, 120) || `${s.title} · rama`, modo: s.modo, mensajes: (s.mensajes || []).filter((m) => m.content), resumen: s.resumen || null, turno: null, archivado: false, rama_de: s.id }, u.email, id);
    res.json(resumenSesion(d));
  });

  // Un turno: el mensaje de la persona y un lugar para la respuesta, «en cola» para el servidor.
  on('POST', 'chat/sesiones/:id/turno', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    if (['en_cola', 'trabajando'].includes(s.turno?.estado)) return res.status(409).json({ error: 'Todavía está respondiendo el turno anterior' });
    const g = await db.get(GW, 'vps').catch(() => null);
    if (!enLinea(g)) return res.status(503).json({ error: 'El servidor no está en línea', code: 'GATEWAY_OFF' });
    const b = body(req), mensaje = txt(b.mensaje, MAX_MSG).trim(), modelo = txt(b.modelo, 120);
    if (!mensaje) return res.status(400).json({ error: 'Mensaje vacío' });
    if (!(g.modelos || []).includes(modelo)) return res.status(400).json({ error: 'Ese modelo no está en el servidor' });
    const mensajes = [...(s.mensajes || []), { role: 'user', content: mensaje, at: ahora() }].slice(-MAX_MSGS);
    const d = await guardar(res, u, s, { mensajes, turno: { estado: 'en_cola', at: ahora(), modelo, sistema: txt(b.sistema, 40000), esfuerzo: txt(b.esfuerzo, 20), desde: mensajes.length } });
    if (d) res.json({ ok: true, desde: mensajes.length });
  });

  on('POST', 'chat/sesiones/:id/detener', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    if (!['en_cola', 'trabajando'].includes(s.turno?.estado)) return res.json({ ok: true });
    const d = await guardar(res, u, s, { turno: { ...s.turno, estado: 'detenido', at: ahora() } });
    if (d) res.json({ ok: true });
  });
}
