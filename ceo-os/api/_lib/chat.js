import { cambioAviso } from '../../public/js/chat-avisos-datos.js';
import { validarImagenes, guardarImagenes, cargarImagen, IMAGENES } from './chat-imagenes.js';
import { pendiente, seguir } from '../../gateway/ventanas.mjs';
// El Chat en el servidor (PLAN-GATEWAY F3). Las conversaciones viven en la
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
import * as mcpOS from './mcp.js';
import { PROPONIBLES_CHAT, ver as verRun, COLL as RUNS } from './agentes.js';
import { saberEmpresa, equipoPara, equipoDeCliente, instruccionesDe, resumenDeCliente, CLIENTES } from './conocimiento.js';
import { scoper } from './access.js';
import { bloqueEquipo, bloqueInstrucciones, MAX_INSTRUCCIONES } from '../../public/js/conocimiento.js';
import { agenteDeSesion, carpetaDe } from '../../public/js/llm/carpetas.js';
import { conversacionLigada } from '../../public/js/chat-agentes.js';
import { departamentoDe } from '../../public/js/llm/departamentos.js';

export const COLL = 'chat_sesiones';
export const PROYECTOS = 'chat_proyectos';
const GW = 'gateway_estado';
const lc = (x) => String(x || '').toLowerCase();
const txt = (s, n) => String(s ?? '').slice(0, n);
const ahora = () => new Date().toISOString();
const MAX_MSGS = 400, MAX_MSG = 60000;
const enLinea = (g) => Boolean(g?.at && Date.now() - Date.parse(g.at) < 90 * 1000);

const resumenSesion = (s, runs = []) => {
  const ult = [...(s.mensajes || [])].reverse().find((m) => m.role === 'user');
  return { id: s.id, title: s.title || '', preview: txt(ult?.content, 120), model: s.turno?.modelo || '', last_active: s._meta?.updated_at, started_at: s._meta?.created_at, message_count: (s.mensajes || []).length, en_curso: ['en_cola', 'trabajando'].includes(s.turno?.estado), cliente: s.cliente || '', proyecto_id: s.proyecto_id || '', code_session_id: s.code_session_id || '', agente: agenteDeSesion(s.agentes, runs) };
};
async function mia(req, res, u) {
  const s = await db.get(COLL, txt(req.params.id, 120));
  if (!s || lc(s.owner) !== lc(u.email)) { res.status(404).json({ error: 'Esa conversación no existe' }); return null; }
  return s;
}
async function guardar(res, u, s, cambio) {
  const { id, v, _meta, ...data } = s;
  const d = await db.update(COLL, id, { ...data, ...cambio, ...cambioAviso(COLL, s, { ...s, ...cambio }) }, v, u.email);
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
    const [todas, runs] = await Promise.all([db.list(COLL), db.list(RUNS)]);
    const xs = todas.filter((s) => lc(s.owner) === lc(u.email) && !s.archivado && !s.oculto).map((s) => resumenSesion(s, runs))
      .sort((a, b) => String(b.last_active).localeCompare(String(a.last_active)));
    res.json({ sessions: xs.slice(0, 300) });
  });

  on('POST', 'chat/sesiones', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const b = body(req), id = txt(b.id, 120);
    if (!leerIdSesion(id)) return res.status(400).json({ error: 'Id de conversación inválido' });
    if (await db.get(COLL, id)) return res.status(409).json({ error: 'Ya existe' });
    // oculto: las conversaciones que usan otras pantallas por debajo (Strategy, Diseño, las herramientas): no salen en la lista del Chat.
    const proyectoId = txt(b.proyecto_id, 80);
    const proyecto = proyectoId ? await db.get(PROYECTOS, proyectoId) : null;
    if (proyectoId && (!proyecto || lc(proyecto.owner) !== lc(u.email))) return res.status(404).json({ error: 'Esa carpeta no existe' });
    const d = await db.create(COLL, { owner: lc(u.email), title: txt(b.titulo, 120), modo: leerIdSesion(id).modo, mensajes: [], turno: null, archivado: false, oculto: Boolean(b.oculto), ...(proyecto ? { proyecto_id: proyecto.id, cliente: proyecto.cliente } : {}) }, u.email, id);
    res.json(resumenSesion(d));
  });

  on('GET', 'chat/sesiones/:id/imagenes/:imagen', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    const x = await cargarImagen(s, txt(req.params.imagen, 80));
    if (!x) return res.status(404).json({ error: 'Esa imagen no existe en esta conversación' });
    res.setHeader('Content-Type', 'image/jpeg'); res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(Buffer.from(x.data.split(',')[1], 'base64'));
  });

  // La conversación completa. ?desde=N devuelve solo los mensajes a partir de N (la pantalla relee mientras responde).
  on('GET', 'chat/sesiones/:id', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    const desde = Math.max(0, Number(req.query.desde) || 0);
    res.json({ id: s.id, title: s.title, total: (s.mensajes || []).length, messages: (s.mensajes || []).slice(desde), code_session_id: s.code_session_id || '', agentes: s.agentes || [], turno: s.turno ? { estado: s.turno.estado, modelo: s.turno.modelo, error: s.turno.error || '', at: s.turno.at, avance: s.turno.trabajo ? { ventana: s.turno.trabajo.ventana, tarea: pendiente(s.turno.trabajo.plan)?.titulo || '', bloqueo: s.turno.trabajo.plan?.bloqueo || '' } : null } : null });
  });

  on('POST', 'chat/sesiones/:id/code', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    if (s.modo !== 'code') return res.status(400).json({ error: 'Esta conversación no es de Code' });
    const sid = txt(body(req).code_session_id, 80);
    if (!/^[0-9a-f-]{36}$/.test(sid)) return res.status(400).json({ error: 'Sesión de Code inválida' });
    if (s.code_session_id && s.code_session_id !== sid) return res.status(409).json({ error: 'Esta conversación ya tiene una sesión de Code' });
    const d = s.code_session_id ? s : await guardar(res, u, s, { code_session_id: sid });
    if (d) res.json({ code_session_id: sid });
  });

  // F4.5 · un mensaje que no pide respuesta del servidor (el «@agente …» que arrancó un trabajo): queda en la conversación.
  // La página de un cliente: instrucciones y lo que el equipo trabaja hoy. Solo quien puede ver ese cliente.
  const veCliente = async (u, slug) => {
    if (!/^[a-z0-9_-]{2,40}$/.test(slug) || u.role === 'client') return false;
    if (slug === 'personal') return u.role === 'ceo';
    if (slug === 'inherent') return true;
    const sc = await scoper(u); return !sc || sc.client(slug);
  };
  on('GET', 'chat/proyectos', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const xs = (await db.list(PROYECTOS)).filter((p) => lc(p.owner) === lc(u.email));
    res.json({ proyectos: xs.map((p) => ({ id: p.id, nombre: p.nombre, cliente: p.cliente, instrucciones: p.instrucciones || '' })) });
  });
  on('POST', 'chat/proyectos', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const b = body(req), nombre = txt(b.nombre, 80).trim(), cliente = lc(txt(b.cliente || 'inherent', 40));
    if (!nombre) return res.status(400).json({ error: 'Escribe un nombre para la carpeta' });
    if (!(await veCliente(u, cliente))) return res.status(403).json({ error: 'No tienes acceso a ese cliente' });
    const p = await db.create(PROYECTOS, { owner: lc(u.email), nombre, cliente, instrucciones: '' }, u.email);
    res.json({ id: p.id, nombre, cliente, instrucciones: '' });
  });
  on('PATCH', 'chat/proyectos/:id', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const p = await db.get(PROYECTOS, txt(req.params.id, 80));
    if (!p || lc(p.owner) !== lc(u.email)) return res.status(404).json({ error: 'Esa carpeta no existe' });
    const b = body(req), nombre = b.nombre === undefined ? p.nombre : txt(b.nombre, 80).trim();
    if (!nombre) return res.status(400).json({ error: 'Escribe un nombre para la carpeta' });
    const instrucciones = b.instrucciones === undefined ? p.instrucciones : txt(b.instrucciones, MAX_INSTRUCCIONES);
    const actualizado = await db.update(PROYECTOS, p.id, { owner: p.owner, cliente: p.cliente, nombre, instrucciones }, p.v, u.email);
    if (!actualizado) return res.status(409).json({ error: 'La carpeta cambió; recarga e inténtalo de nuevo' });
    res.json({ id: p.id, nombre, cliente: p.cliente, instrucciones });
  });
  on('DELETE', 'chat/proyectos/:id', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const p = await db.get(PROYECTOS, txt(req.params.id, 80));
    if (!p || lc(p.owner) !== lc(u.email)) return res.status(404).json({ error: 'Esa carpeta no existe' });
    const xs = (await db.list(COLL)).filter((s) => lc(s.owner) === lc(u.email) && s.proyecto_id === p.id);
    for (const s of xs) {
      const { id, v, _meta, ...datos } = s;
      const movida = await db.update(COLL, id, { ...datos, proyecto_id: '' }, v, u.email);
      if (!movida) return res.status(409).json({ error: 'Una conversación cambió; vuelve a intentar' });
    }
    await db.remove(PROYECTOS, p.id, u.email);
    res.json({ ok: true, conversaciones: xs.length });
  });
  on('POST', 'chat/sesiones/:id/proyecto', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    const id = txt(body(req).proyecto_id, 80), p = id ? await db.get(PROYECTOS, id) : null;
    if (id && (!p || lc(p.owner) !== lc(u.email))) return res.status(404).json({ error: 'Esa carpeta no existe' });
    const d = await guardar(res, u, s, { proyecto_id: p?.id || '', ...(p ? { cliente: p.cliente } : {}) });
    if (d) res.json({ ok: true, proyecto_id: p?.id || '' });
  });
  on('GET', 'chat/clientes/:slug', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const slug = lc(req.params.slug); if (!(await veCliente(u, slug))) return res.status(404).json({ error: 'Ese cliente no existe' });
    const [instrucciones, equipo] = await Promise.all([instruccionesDe(slug), equipoDeCliente(slug).catch(() => '')]);
    res.json({ instrucciones, equipo: slug === 'personal' ? '' : equipo, editable: ['ceo', 'coo'].includes(u.role), resumen: await resumenDeCliente(slug).catch(() => ({})) });
  });
  on('POST', 'chat/clientes/:slug', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (!['ceo', 'coo'].includes(u.role)) return res.status(403).json({ error: 'Las instrucciones las editan el CEO o el COO' });
    const slug = lc(req.params.slug); if (!(await veCliente(u, slug))) return res.status(404).json({ error: 'Ese cliente no existe' });
    const instrucciones = txt(body(req).instrucciones, MAX_INSTRUCCIONES).trim();
    await db.upsert(CLIENTES, slug, { instrucciones }, u.email);
    res.json({ ok: true });
  });

  // Mover una conversación a otro cliente: cambia su carpeta. Su id no cambia.
  on('POST', 'chat/sesiones/:id/mover', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    const cliente = txt(body(req).cliente, 40).toLowerCase();
    if (!/^[a-z0-9_-]{2,40}$/.test(cliente)) return res.status(400).json({ error: 'Elige un cliente' });
    const d = await guardar(res, u, s, { cliente, proyecto_id: '' });
    if (d) res.json({ ok: true, cliente });
  });

  on('POST', 'chat/sesiones/:id/nota', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    if (['en_cola', 'trabajando'].includes(s.turno?.estado)) return res.status(409).json({ error: 'Todavía está respondiendo el turno anterior' });
    const texto = txt(body(req).texto, MAX_MSG).trim(); if (!texto) return res.status(400).json({ error: 'Mensaje vacío' });
    const d = await guardar(res, u, s, { mensajes: [...(s.mensajes || []), { role: 'user', content: texto, at: ahora() }].slice(-MAX_MSGS) });
    if (d) res.json({ ok: true });
  });

  // Clientes antiguos pasan al modo de voz del mismo Chat. No abrir otra IA sin sus herramientas.
  on('POST', 'chat/voz/token', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    res.status(503).json({ error: 'La voz usa el mismo Chat. Recarga para continuar.', code: 'NO_VOZ' });
  });
  // Lo hablado queda en la conversación, como cualquier mensaje.
  on('POST', 'chat/sesiones/:id/voz', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    const nuevos = (Array.isArray(body(req).mensajes) ? body(req).mensajes : []).slice(0, 200).map((m) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: txt(m?.content, MAX_MSG).trim(), at: ahora() })).filter((m) => m.content);
    if (!nuevos.length) return res.status(400).json({ error: 'Nada que guardar' });
    const d = await guardar(res, u, s, { mensajes: [...(s.mensajes || []), ...nuevos].slice(-MAX_MSGS) });
    if (d) res.json({ ok: true });
  });

  // Un turno de un departamento (llm/departamentos.js): lo responde el puente de Code, pero queda en la conversación del OS
  // con qué departamento y qué nivel, para retomarlo desde cualquier compu y para que el Chat lo tenga como contexto.
  on('POST', 'chat/sesiones/:id/departamento', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const s = await mia(req, res, u); if (!s) return;
    const b = body(req), dep = departamentoDe(b.dep);
    if (!dep) return res.status(400).json({ error: 'Ese departamento no existe' });
    const pedido = txt(b.pedido, MAX_MSG).trim(), respuesta = txt(b.respuesta, MAX_MSG).trim();
    if (!pedido || !respuesta) return res.status(400).json({ error: 'Nada que guardar' });
    const nivel = ['nivel-alto', 'nivel-medio', 'nivel-bajo'].includes(b.nivel) ? b.nivel : '';
    const at = ahora();
    const d = await guardar(res, u, s, { mensajes: [...(s.mensajes || []), { role: 'user', content: pedido, at, dep: dep.id }, { role: 'assistant', content: respuesta, at, dep: dep.id, nivel, modelo: nivel }].slice(-MAX_MSGS) });
    if (d) res.json({ ok: true });
  });

  // F4.5 · los trabajos que nacieron (o se abrieron) en esta conversación: su pestaña y sus eventos en el hilo.
  on('POST', 'chat/sesiones/:id/agentes', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    const run = await db.get(RUNS, txt(body(req).run, 80));
    if (!run || !(await verRun(u, run))) return res.status(404).json({ error: 'Ese trabajo no existe' });
    if ((s.agentes || []).some((x) => x.run === run.id)) return res.json({ agentes: s.agentes });
    const d = await guardar(res, u, s, { agentes: [...(s.agentes || []), { run: run.id, flujo: run.flujo?.id || '', at: ahora() }].slice(-20) });
    if (d) res.json({ agentes: d.agentes });
  });

  // F4.5 · el CEO y el COO pueden leer (no escribir) la conversación ligada a un trabajo que ven. No sale en su lista del Chat.
  on('GET', 'chat/sesiones/:id/lectura', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (!['ceo', 'coo'].includes(u.role)) return res.status(403).json({ error: 'Solo el CEO y el COO' });
    const s = await db.get(COLL, txt(req.params.id, 120));
    if (!s || s.archivado) return res.status(404).json({ error: 'Esa conversación no existe' });
    const runId = txt(req.query.run, 80), run = runId ? await db.get(RUNS, runId) : null;
    const ligada = run && conversacionLigada(run, s) && (await verRun(u, run));
    if (!ligada) return res.status(404).json({ error: 'Esa conversación no está ligada a un trabajo que puedas ver' });
    // Queda en el registro del trabajo quién la leyó.
    const { id, v, _meta, ...data } = run;
    await db.update(RUNS, id, { ...data, historial: [...(data.historial || []), { at: ahora(), quien: u.email, accion: 'leer-chat' }].slice(-500) }, v, u.email).catch(() => null);
    res.json({ owner: s.owner, title: s.title, messages: (s.mensajes || []).filter((m) => m.content && !m.parcial).map((m) => ({ role: m.role, content: m.content, at: m.at })) });
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
    const retoma = mensaje === '/retomar' && s.turno?.trabajo?.objetivo;
    if (mensaje === '/retomar' && !retoma) return res.status(409).json({ error: 'No hay un trabajo guardado para retomar.' });
    const trabajo = retoma ? { ...s.turno.trabajo, ventana: 1, plan: s.turno.trabajo.plan ? { ...s.turno.trabajo.plan, bloqueo: '' } : null } : null;
    let nuevas, repetidas = [];
    try {
      nuevas = validarImagenes(b.imagenes);
      if (b.imagenIds !== undefined) {
        if (!Array.isArray(b.imagenIds) || b.imagenIds.length + nuevas.length > 2) throw new Error('Máximo dos imágenes por mensaje.');
        for (const id of b.imagenIds) {
          const x = await cargarImagen(s, String(id)); if (!x) throw new Error('Esa imagen no pertenece a la conversación.');
          repetidas.push({ id: x.id, nombre: x.nombre, width: x.width, height: x.height });
        }
      }
    } catch (e) { return res.status(400).json({ error: e.message }); }
    if ((nuevas.length || repetidas.length) && !(g.modelos || []).includes('kimi-k3')) return res.status(409).json({ error: 'El modelo de visión no está disponible ahora. Conserva la imagen y reintenta.' });
    const guardadas = await guardarImagenes(nuevas, s.owner, s.id), imagenes = [...guardadas, ...repetidas];
    const mensajes = [...(s.mensajes || []), { role: 'user', content: retoma ? seguir(trabajo.plan) : mensaje, at: ahora(), ...(imagenes.length ? { imagenes } : {}) }].slice(-MAX_MSGS);
    const equipo = await equipoPara(u, verRun).catch(() => ''); // ayuda, pero no detiene la respuesta
    const instrucciones = await instruccionesDe(carpetaDe(s)).catch(() => '');
    const empresa = await saberEmpresa(u).catch(() => '');
    const d = await guardar(res, u, s, { mensajes, turno: { estado: 'en_cola', at: ahora(), modelo, sistema: `${txt(b.sistema, 40000)}${empresa}${bloqueInstrucciones(instrucciones)}${bloqueEquipo(equipo)}`, esfuerzo: txt(b.esfuerzo, 20), desde: mensajes.length, ...(trabajo ? { trabajo } : {}) } });
    if (d) res.json({ ok: true, desde: mensajes.length, imagenes });
    else await Promise.all(guardadas.map((x) => db.remove(IMAGENES, x.id, u.email).catch(() => {})));
  });

  // Una propuesta del servidor (crear una tarea, mover un lead…): la decide el dueño de la conversación, con SU sesión.
  // Aprobar la ejecuta aquí, en el OS, con el MCP del OS como esa persona (sus permisos); el servidor nunca escribe.
  // { decision: 'aprobar' | 'rechazar' } → la propuesta con su estado (aprobada · rechazada · fallo) y lo que respondió el OS.
  on('POST', 'chat/sesiones/:id/propuestas/:pid', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    if (['en_cola', 'trabajando'].includes(s.turno?.estado)) return res.status(409).json({ error: 'Espera a que termine la respuesta para decidir' });
    const pid = txt(req.params.pid, 40), decision = body(req).decision;
    if (!['aprobar', 'rechazar'].includes(decision)) return res.status(400).json({ error: 'Decide aprobar o rechazar' });
    const k = (s.mensajes || []).findIndex((m) => (m.propuestas || []).some((p) => p.id === pid));
    const p = k >= 0 ? s.mensajes[k].propuestas.find((x) => x.id === pid) : null;
    if (!p) return res.status(404).json({ error: 'Esa propuesta no existe' });
    if (p.estado !== 'pendiente') return res.status(409).json({ error: 'Esa propuesta ya se decidió' });
    let nueva = { ...p, decidida_por: u.email, decidida_en: ahora() };
    if (decision === 'rechazar') nueva.estado = 'rechazada';
    else {
      // Doble candado: que sea de las que el Chat puede proponer y que el perfil de la persona la permita (mcp.run lo revisa).
      if (p.conector !== 'inherent' || !PROPONIBLES_CHAT.has(p.tool)) return res.status(403).json({ error: 'Esa acción no se puede aprobar desde el Chat' });
      const usuario = await mcpOS.userOf(u.email);
      if (!usuario) return res.status(403).json({ error: 'Tu perfil no puede hacer esto' });
      const o = await mcpOS.run(usuario, { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: p.tool, arguments: p.args && typeof p.args === 'object' ? p.args : {} } });
      const rr = o.json?.result || {}, texto = (rr.content || []).map((c) => c.text || '').join('\n').slice(0, 2000);
      nueva = rr.isError ? { ...nueva, estado: 'fallo', error: texto.slice(0, 300) } : { ...nueva, estado: 'aprobada', resultado: texto };
    }
    const mensajes = s.mensajes.map((m, i) => (i !== k ? m : { ...m, propuestas: m.propuestas.map((x) => (x.id === pid ? nueva : x)) }));
    const d = await guardar(res, u, s, { mensajes });
    if (d) res.json({ propuesta: nueva });
  });

  on('POST', 'chat/sesiones/:id/detener', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const s = await mia(req, res, u); if (!s) return;
    if (!['en_cola', 'trabajando'].includes(s.turno?.estado)) return res.json({ ok: true });
    const d = await guardar(res, u, s, { turno: { ...s.turno, estado: 'detenido', at: ahora() } });
    if (d) res.json({ ok: true });
  });
}
