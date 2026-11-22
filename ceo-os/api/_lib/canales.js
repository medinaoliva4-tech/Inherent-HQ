// Canales de mensajería: el equipo habla con el OS (y resuelve sus decisiones) desde Telegram; WhatsApp Cloud API e iMessage son adaptadores.
// No es un chat nuevo: es una puerta más al Chat y a «Decide». Reglas que no se rompen:
//   · solo recibe respuesta quien está VINCULADO (código de un solo uso, 10 min, solo su hash en la base, CAS al gastarlo); los demás: silencio;
//   · aprobar / pedir cambios pasan por POST /api/entregables/:id/estado con la sesión de esa persona (mismas reglas que la web: rol, área, ficha, criterios, versión);
//   · pauta, presupuesto y precio NUNCA se resuelven por mensaje: el botón es «Abrir en el OS»;
//   · los botones llevan firma (HMAC) atada a acción + entregable + versión + chat; los secretos vienen del entorno y nunca se devuelven ni se registran;
//   · WhatsApp: solo API oficial (Cloud API), y solo se escribe dentro de las 24 h del último mensaje de la persona; iMessage: sin API de servidor, no se construye.
// Colecciones propias (no salen por /api/db): canal_vinculos, canal_codigos, canal_pendientes.
import crypto from 'node:crypto';
import * as db from './db.js';
import * as session from './session.js';
import { guard, userFor, effective, viewsDoc, domain } from './access.js';
import { body } from './http.js';
import { decisionesDe } from './decide.js';
import { VACIO } from '../../public/js/decide.js';
import { COLL } from '../../public/js/entregables.js';
import * as M from '../../public/js/canales/mensajeria.js';

export const COLL_V = 'canal_vinculos', COLL_C = 'canal_codigos', COLL_P = 'canal_pendientes', CANALES = ['telegram', 'whatsapp', 'imessage'];
const TTL_CODIGO = 10 * 60_000, ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', MAX_TARJETAS = 3;
const env = (k) => String(process.env[k] || '').trim();
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const lc = (x) => String(x || '').toLowerCase();
const fail = (status, code, message) => { throw Object.assign(new Error(message), { status, code }); };
const appUrl = () => env('APP_URL').replace(/\/$/, '');

// ---------- Dependencias inyectables (el gateway del Chat, la transcripción, el envío y la hora) ----------
const deps = { enviarMensaje: null, responder: null, transcribir: null, invocar: null, ahora: () => Date.now(), log: (o) => console.log(JSON.stringify(o)), fetchImpl: null, tope: { max: 20, ventanaMs: 60_000 } };
export function configurar(o = {}) { Object.assign(deps, o, o.tope ? { tope: { ...deps.tope, ...o.tope } } : {}); }
const visitas = new Map();
export const reiniciar = () => visitas.clear();
const registra = (evt, extra = {}) => { try { deps.log({ evt, ...extra }); } catch {} };

// ---------- Adaptadores ----------
const limpiaToken = (s) => String(s || '').split(env('TELEGRAM_BOT_TOKEN') || '\u0000').join('***').split(env('WHATSAPP_TOKEN') || '\u0000').join('***').slice(0, 200);
export const adaptadores = {
  telegram: {
    capability() {
      if (!env('TELEGRAM_BOT_TOKEN')) return { estado: 'disconnected', razon: 'Falta TELEGRAM_BOT_TOKEN (el bot se crea con BotFather).' };
      const falta = ['TELEGRAM_WEBHOOK_SECRET', 'CANALES_SECRETO'].filter((k) => !env(k));
      return falta.length ? { estado: 'needs_permission', razon: `Falta ${falta.join(' y ')} en el entorno.` } : { estado: 'ready', razon: '' };
    },
    async enviar(m) {
      const token = env('TELEGRAM_BOT_TOKEN'); if (!token) return { ok: false, estado: 'disconnected' };
      const f = deps.fetchImpl || globalThis.fetch, url = (met) => `https://api.telegram.org/bot${token}/${met}`;
      const post = (met, b) => f(url(met), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
      try {
        if (m.ack) { await post('answerCallbackQuery', { callback_query_id: m.callbackId }); return { ok: true }; }
        const inline = (m.botones || []).map((b) => [b.url ? { text: b.label, url: b.url } : { text: b.label, callback_data: b.data }]);
        const r = await post('sendMessage', { chat_id: m.chatId, text: (m.md ?? M.formatoTelegram(m.texto)).slice(0, 4000), parse_mode: 'MarkdownV2', disable_web_page_preview: true, ...(inline.length ? { reply_markup: { inline_keyboard: inline } } : {}) });
        return { ok: r.ok !== false };
      } catch (e) { registra('canal_envio_fallo', { canal: 'telegram', error: limpiaToken(e.message) }); return { ok: false, estado: 'error' }; }
    },
  },
  whatsapp: {
    capability() {
      if (!env('WHATSAPP_TOKEN') || !env('WHATSAPP_PHONE_ID')) return { estado: 'disconnected', razon: 'Falta WHATSAPP_TOKEN y WHATSAPP_PHONE_ID (WhatsApp Cloud API oficial: número dedicado y verificación de Meta Business).' };
      const falta = ['WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN', 'CANALES_SECRETO'].filter((k) => !env(k));
      return falta.length ? { estado: 'needs_permission', razon: `Falta ${falta.join(', ')} en el entorno.` } : { estado: 'ready', razon: 'Solo escribe dentro de las 24 h del último mensaje de la persona.' };
    },
    async enviar(m) {
      const token = env('WHATSAPP_TOKEN'), phone = env('WHATSAPP_PHONE_ID'); if (!token || !phone) return { ok: false, estado: 'disconnected' };
      if (m.ack) return { ok: true };
      const f = deps.fetchImpl || globalThis.fetch, botones = (m.botones || []).filter((b) => b.data).slice(0, 3), link = (m.botones || []).find((b) => b.url);
      const texto = [m.texto, link ? `Abrir en el OS: ${link.url}` : ''].filter(Boolean).join('\n').slice(0, 1000);
      const msg = botones.length ? { type: 'interactive', interactive: { type: 'button', body: { text: texto }, action: { buttons: botones.map((b) => ({ type: 'reply', reply: { id: b.data, title: b.label.slice(0, 20) } })) } } } : { type: 'text', text: { body: texto } };
      try {
        const r = await f(`https://graph.facebook.com/v21.0/${encodeURIComponent(phone)}/messages`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ messaging_product: 'whatsapp', to: m.chatId, ...msg }) });
        return { ok: r.ok !== false };
      } catch (e) { registra('canal_envio_fallo', { canal: 'whatsapp', error: limpiaToken(e.message) }); return { ok: false, estado: 'error' }; }
    },
  },
  imessage: {
    capability: () => ({ estado: 'disconnected', razon: 'iMessage solo funciona desde un Mac encendido con un puente local; no hay API de servidor.' }),
    enviar: async () => ({ ok: false, estado: 'disconnected' }),
  },
};
const enviar = async (m) => { try { return deps.enviarMensaje ? await deps.enviarMensaje(m) : await (adaptadores[m.canal]?.enviar(m) ?? { ok: false, estado: 'disconnected' }); } catch (e) { registra('canal_envio_fallo', { canal: m.canal, error: limpiaToken(e.message) }); return { ok: false, estado: 'error' }; } };

// ---------- Personas y vínculos ----------
// Solo el equipo activo del OS (nunca un cliente del portal), con sus áreas y su alcance aplicados.
async function persona(email) {
  const base = await userFor(lc(email));
  if (!base.active || base.role === 'client' || !(base.email.endsWith('@' + domain()) || base.external)) return null;
  return effective(base, await viewsDoc());
}
const idV = (canal, chatId) => `${canal}:${chatId}`;
const vinculosDe = async (email, canal) => (await db.list(COLL_V)).filter((x) => lc(x.email) === lc(email) && (!canal || x.canal === canal));

const normalizar = (c) => String(c || '').toUpperCase().replace(/[\s-]/g, '');
const codigoOk = (c) => /^[A-HJ-NP-Z2-9]{8}$/.test(c);
export async function emitirCodigo(u, canal, { ahoraMs = deps.ahora() } = {}) {
  if (!['telegram', 'whatsapp'].includes(canal)) fail(400, 'CANAL', 'Elige Telegram o WhatsApp.');
  const cap = adaptadores[canal].capability(); if (cap.estado === 'disconnected') fail(409, 'DESCONECTADO', cap.razon);
  for (const x of (await db.list(COLL_C)).filter((c) => lc(c.email) === lc(u.email) && !c.usado)) await db.update(COLL_C, x.id, { ...x, usado: true, reemplazado: true }, x.v, 'canales'); // un solo código vivo por persona
  const bytes = crypto.randomBytes(8), codigo = Array.from(bytes, (b) => ALFABETO[b % 32]).join('');
  await db.create(COLL_C, { email: lc(u.email), canal, exp: ahoraMs + TTL_CODIGO, usado: false }, 'canales', sha(codigo));
  return { codigo: `${codigo.slice(0, 4)}-${codigo.slice(4)}`, expira: new Date(ahoraMs + TTL_CODIGO).toISOString() };
}
// → el correo de la persona. Cualquier fallo es el mismo mensaje.
export async function canjearCodigo({ canal, chatId, codigo }, { ahoraMs = deps.ahora() } = {}) {
  const mal = () => fail(401, 'CODIGO', 'El código no sirve o ya venció. Pide uno nuevo en el OS.');
  const c = normalizar(codigo); if (!codigoOk(c)) mal();
  const id = sha(c), d = await db.get(COLL_C, id);
  if (!d || d.usado || d.exp < ahoraMs || d.canal !== canal) mal();
  if (!(await db.update(COLL_C, id, { ...d, usado: true, usado_en: new Date(ahoraMs).toISOString() }, d.v, 'canales'))) mal(); // CAS: con varios canjes a la vez gana uno
  if (!(await persona(d.email))) mal();
  for (const x of await vinculosDe(d.email, canal)) await db.remove(COLL_V, x.id, 'canales');
  await db.upsert(COLL_V, idV(canal, chatId), { canal, chatId, email: d.email, espera: null, ultimo_entrante: ahoraMs, desde: new Date(ahoraMs).toISOString() }, 'canales');
  return d.email;
}

// ---------- Decisiones ----------
async function invocarRuta(email, method, route, b) {
  if (deps.invocar) return deps.invocar(email, method, route, b);
  const { default: api } = await import('../index.js'), headers = { host: 'localhost', 'x-ceoos': '1' }, jar = new Map();
  const res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, write() {}, end() {} };
  const req = { url: `/api/${route}`, method, headers, body: b, query: {}, params: {} };
  session.issue(req, res, { email }); headers.cookie = jar.get('Set-Cookie').split(';')[0];
  await api(req, res); return { status: res.statusCode, data: res.data };
}
async function resolver(u, { accion, id, v, nota }) {
  const doc = /^[\w.-]{1,120}$/.test(String(id)) ? await db.get(COLL, id) : null;
  if (!doc) return 'Ya no lo encuentro. Ábrelo en el OS.';
  if (M.esSensible({ tool: doc.tool, ws: doc.ws, titulo: doc.titulo })) return 'Esto se decide en el OS: pauta, presupuesto y precio no se resuelven por mensaje.';
  const r = await invocarRuta(u.email, 'POST', `entregables/${encodeURIComponent(id)}/estado`, accion === 'aprobar' ? { a: 'Aprobado', v } : { a: 'Borrador', v, nota: M.limpio(nota, 400) });
  const t = M.limpio(doc.titulo, 80);
  if (r.status === 200) return accion === 'aprobar' ? `Aprobado: ${t}.` : `Listo, pedí cambios en: ${t}.`;
  if (r.data?.code === 'CONFLICTO') return 'Cambió mientras lo veías: ábrelo en el OS.';
  if (r.data?.code === 'PASO') return 'Ya no está esperando tu decisión.';
  if (r.status === 400 && r.data?.code === 'FALTAS') return `No se puede aprobar todavía. Falta: ${M.limpio((r.data.faltas || []).join(' · '), 300)}`;
  return r.status === 403 || r.status === 404 ? 'No puedes decidir esto desde aquí. Ábrelo en el OS.' : 'No pude completarlo. Ábrelo en el OS.';
}
const tarjetas = (items, chatId, canal) => items.slice(0, MAX_TARJETAS).map((it) => ({ canal, chatId, ...M.tarjetaDecision(it, { chatId, secreto: env('CANALES_SECRETO'), appUrl: appUrl() }) }));
async function hoy(u, m) {
  const items = await decisionesDe(u);
  if (!items.length) return [{ canal: m.canal, chatId: m.chatId, texto: VACIO }];
  const out = tarjetas(items, m.chatId, m.canal);
  if (items.length > MAX_TARJETAS) out.push({ canal: m.canal, chatId: m.chatId, texto: `Y ${items.length - MAX_TARJETAS} más. Ábrelas en el OS.` });
  return out;
}

// ---------- Procesar un mensaje ya normalizado ----------
const AYUDA = 'Comandos:\n/hoy o /decide: lo que espera por ti\n/vincular CODIGO: conecta este chat con tu cuenta del OS\n/baja: desconecta este chat\nEscríbeme o mándame una nota de voz y te respondo.';
function excede(m, ahoraMs) {
  const k = `${m.canal}:${m.chatId}`, { max, ventanaMs } = deps.tope, h = (visitas.get(k) || []).filter((t) => ahoraMs - t < ventanaMs);
  h.push(ahoraMs); visitas.set(k, h); return h.length > max ? (h.length === max + 1 ? 'primera' : 'resto') : null;
}
export async function tratar(m) {
  const ahoraMs = deps.ahora(), out = (texto, extra = {}) => ({ canal: m.canal, chatId: m.chatId, texto, ...extra }), enviarTodo = async (xs) => { for (const x of xs) await enviar(x); };
  const tope = excede(m, ahoraMs);
  let vin = await db.get(COLL_V, idV(m.canal, m.chatId));
  const cmd = m.tipo === 'comando' ? M.comandoDe(m.texto) : null;
  if (!vin) { // sin vínculo: silencio, salvo para /vincular (quien lo intenta necesita saber si el código sirvió)
    if (cmd?.comando !== 'vincular' || tope) return;
    try { await canjearCodigo({ canal: m.canal, chatId: m.chatId, codigo: cmd.arg }, { ahoraMs }); return enviarTodo([out('Listo: este chat quedó vinculado a tu cuenta del OS. Escribe /hoy para ver lo que espera por ti.')]); }
    catch (e) { return enviarTodo([out(e.status ? e.message : 'No pude vincular. Intenta de nuevo.')]); }
  }
  const u = await persona(vin.email); if (!u) return; // la persona ya no es del equipo activo: silencio
  if (tope) return tope === 'primera' ? enviarTodo([out('Vas muy rápido. Espera un minuto.')]) : undefined;
  if (ahoraMs - (vin.ultimo_entrante || 0) > 60_000) vin = (await db.update(COLL_V, vin.id, { ...vin, ultimo_entrante: ahoraMs }, vin.v, 'canales')) || vin;
  const ack = m.callbackId ? [{ canal: m.canal, chatId: m.chatId, ack: true, callbackId: m.callbackId }] : [];
  const poneEspera = (espera) => db.update(COLL_V, vin.id, { ...vin, espera }, vin.v, 'canales');

  if (cmd) {
    if (cmd.comando === 'baja') { await enviar(out('Listo, ya no te escribo por aquí.')); await db.remove(COLL_V, vin.id, 'canales'); return; }
    if (cmd.comando === 'hoy' || cmd.comando === 'decide') { if (vin.espera) await poneEspera(null); return enviarTodo(await hoy(u, m)); }
    if (cmd.comando === 'vincular') return enviarTodo([out('Este chat ya está vinculado. Escribe /baja si quieres desconectarlo.')]);
    return enviarTodo([out(AYUDA)]);
  }
  if (m.tipo === 'callback') {
    const cb = m.callback;
    if (!M.verificarCallback(cb, m.chatId, env('CANALES_SECRETO'))) return enviarTodo([...ack, out('Ese botón no sirve. Escribe /hoy para verlo de nuevo.')]);
    if (cb.accion === 'cambios') { await poneEspera({ id: cb.id, v: cb.v, exp: ahoraMs + TTL_CODIGO }); return enviarTodo([...ack, out('¿Qué hay que cambiar? Cuéntamelo en un mensaje.')]); }
    return enviarTodo([...ack, out(await resolver(u, cb))]);
  }
  let texto = m.texto;
  if (m.tipo === 'voz') {
    if (!deps.transcribir) { registra('canal_sin_voz', { canal: m.canal, email: u.email }); return enviarTodo([out('Aún no entiendo notas de voz en este canal. Escríbeme.')]); }
    try { texto = M.limpio(await deps.transcribir({ canal: m.canal, archivoId: m.archivoId, usuario: u }), 2000); } catch { texto = ''; }
    if (!texto) return enviarTodo([out('No pude entender la nota de voz. Escríbeme.')]);
  }
  if (vin.espera) { // el mensaje que sigue a «Pedir cambios» es la nota
    const e = vin.espera; await poneEspera(null);
    if (e.exp >= ahoraMs) return enviarTodo([out(await resolver(u, { accion: 'cambios', id: e.id, v: e.v, nota: texto }))]);
  }
  if (!deps.responder) { registra('canal_sin_chat', { canal: m.canal, email: u.email }); return enviarTodo([out('El chat aún no está conectado a este canal.')]); }
  let r; try { r = await deps.responder(texto, u); } catch { r = 'No pude responder ahora. Intenta de nuevo.'; }
  const t = M.limpio(typeof r === 'string' ? r : r?.texto, 3500) || 'No tengo respuesta para eso.';
  await enviarTodo([out(t)]);
  if (m.canal === 'whatsapp') { // la ventana está abierta: lo que quedó pendiente ya puede salir
    const pend = (await db.list(COLL_P)).filter((p) => lc(p.email) === lc(u.email) && p.canal === 'whatsapp' && !p.entregado);
    if (pend.length) { for (const p of pend) await db.update(COLL_P, p.id, { ...p, entregado: true }, p.v, 'canales'); await enviar(out(`Tenías ${pend.length} aviso(s) pendientes. Escribe /hoy para verlos.`)); }
  }
}

// ---------- Salida hacia el equipo ----------
async function aVinculos(usuarioOS, armar, pendiente) {
  const u = await persona(usuarioOS), res = { enviados: 0, motivo: '' };
  if (!u) return { ...res, motivo: 'sin_permiso' };
  const vs = await vinculosDe(u.email); if (!vs.length) return { ...res, motivo: 'sin_vinculo' };
  for (const v of vs) {
    if (v.canal === 'whatsapp' && !M.ventana24h(v.ultimo_entrante, deps.ahora())) { // fuera de 24 h haría falta una plantilla aprobada por Meta: queda pendiente
      if ((await db.list(COLL_P)).filter((p) => lc(p.email) === lc(u.email) && !p.entregado).length < 20) await db.create(COLL_P, { email: lc(u.email), canal: 'whatsapp', ...pendiente, entregado: false }, 'canales');
      res.motivo = 'ventana_24h'; continue;
    }
    for (const m of armar(v)) if ((await enviar(m)).ok) res.enviados++;
  }
  return res;
}
// Solo sale lo que está en las decisiones DE ESA persona (el servidor trae la versión fresca; lo ajeno no sale).
export async function enviarDecision(usuarioOS, item) {
  const u = await persona(usuarioOS); if (!u) return { enviados: 0, motivo: 'sin_permiso' };
  const mia = (await decisionesDe(u)).find((x) => x.id === item?.id); if (!mia) return { enviados: 0, motivo: 'no_es_tuya' };
  return aVinculos(u.email, (v) => tarjetas([mia], v.chatId, v.canal), { tipo: 'decision', ref: mia.id });
}
export async function enviarAviso(usuarioOS, texto) {
  const t = M.limpio(texto, 600); if (!t) return { enviados: 0, motivo: 'vacio' };
  return aVinculos(usuarioOS, (v) => [{ canal: v.canal, chatId: v.chatId, texto: t }], { tipo: 'aviso', ref: t.slice(0, 120) });
}

// ---------- Rutas ----------
const err = (res, e) => res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo completar. Vuelve a intentar.', code: e.code || 'SERVIDOR' });
const cuerpos = (req) => { // WhatsApp firma los bytes exactos; si el runtime ya los parseó, se prueba también la forma que usa Meta (unicode escapado)
  const crudo = req.rawBody ?? (typeof req.body === 'string' ? req.body : null);
  if (crudo != null) return [crudo];
  const j = JSON.stringify(req.body ?? {});
  return [j, j.replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)];
};
export function rutas(on) {
  on('GET', 'canales', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const mios = await vinculosDe(u.email);
    res.json({ canales: CANALES.map((id) => { const c = adaptadores[id].capability(), v = mios.find((x) => x.canal === id); return { id, estado: c.estado, razon: c.razon, vinculado: Boolean(v), desde: v?.desde || '' }; }) });
  });
  on('POST', 'canales/vincular', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    try { res.json({ ...(await emitirCodigo(u, String(body(req).canal || ''))), aviso: 'Sirve una vez y vence en 10 minutos. Mándalo al bot con /vincular.' }); } catch (e) { err(res, e); }
  });
  on('POST', 'canales/desvincular', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const canal = String(body(req).canal || ''); let n = 0;
    for (const x of await vinculosDe(u.email, canal)) if (await db.remove(COLL_V, x.id, u.email)) n++;
    res.json({ desvinculados: n });
  });
  const procesar = async (ms) => { for (const m of ms) { try { await tratar(m); } catch (e) { registra('canal_error', { canal: m.canal, error: limpiaToken(e.message) }); } } };
  on('POST', 'canales/telegram/webhook', async (req, res) => {
    if (!M.verificarSecretoTelegram(req.headers['x-telegram-bot-api-secret-token'], env('TELEGRAM_WEBHOOK_SECRET'))) return res.status(401).end();
    const m = M.parsearTelegram(body(req)); if (m) await procesar([m]);
    res.status(200).json({ ok: true });
  });
  on('GET', 'canales/whatsapp/webhook', async (req, res) => {
    const q = req.query || {}, ch = String(q['hub.challenge'] || '');
    if (q['hub.mode'] !== 'subscribe' || !env('WHATSAPP_VERIFY_TOKEN') || !M.verificarSecretoTelegram(String(q['hub.verify_token'] || ''), env('WHATSAPP_VERIFY_TOKEN')) || !/^[\w-]{1,200}$/.test(ch)) return res.status(403).end();
    res.setHeader('Content-Type', 'text/plain'); res.status(200).end(ch);
  });
  on('POST', 'canales/whatsapp/webhook', async (req, res) => {
    const firma = req.headers['x-hub-signature-256'], secreto = env('WHATSAPP_APP_SECRET');
    if (!cuerpos(req).some((c) => M.verificarFirmaWhatsApp(c, firma, secreto))) return res.status(401).end();
    await procesar(M.parsearWhatsAppCloud(body(req)));
    res.status(200).json({ ok: true });
  });
}
