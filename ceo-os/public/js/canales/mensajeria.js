// Canales de mensajería (puro: sin DOM ni red). Solo lo usa el servidor (api/_lib/canales.js) y las pruebas; usa node:crypto para firmar.
// Normaliza lo que llega de Telegram y de WhatsApp Cloud, firma los botones y arma las tarjetas de decisión.
// Todo texto que viene de afuera se trata como TEXTO: nunca como HTML ni como formato.
import crypto from 'node:crypto';

export const TOPE_CALLBACK = 64; // bytes: el límite de callback_data de Telegram
export const SENSIBLES = ['ads-intelligence', 'pricing-packages', 'offer-architect', 'financial-scenario-lab', 'campaign-architect'];
const RE_SENSIBLE = /pauta|presupuesto|precio|tarifa|cotiz|\bads?\b|inversi[oó]n/i;
const CODIGO = { aprobar: 'a', cambios: 'c' }, ACCION = { a: 'aprobar', c: 'cambios' };

// ---------- Limpieza ----------
export function limpio(s, max = 4000) {
  return String(s ?? '').replace(/[\u0000-\u0008\u000B-\u001F\u007F‪-‮⁦-⁩​-‏]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}
const igual = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };

// ---------- Verificaciones (tiempo constante) ----------
export function verificarSecretoTelegram(headerValor, secreto) {
  if (!secreto || typeof headerValor !== 'string' || !headerValor) return false;
  return igual(headerValor, secreto);
}
export function verificarFirmaWhatsApp(cuerpoCrudo, firmaHeader, secreto) {
  if (!secreto || typeof firmaHeader !== 'string' || !/^sha256=[0-9a-f]{64}$/i.test(firmaHeader) || cuerpoCrudo == null) return false;
  const esperada = crypto.createHmac('sha256', secreto).update(typeof cuerpoCrudo === 'string' ? cuerpoCrudo : Buffer.from(cuerpoCrudo)).digest();
  return crypto.timingSafeEqual(esperada, Buffer.from(firmaHeader.slice(7).toLowerCase(), 'hex'));
}

// ---------- Botones firmados ----------
export const firmaDe = (accion, id, v, chatId, secreto) => crypto.createHmac('sha256', String(secreto)).update(`${accion}|${id}|${v}|${chatId}`).digest('base64url').slice(0, 8);
export function firmarCallback({ accion, id, v }, chatId, secreto) {
  if (!secreto || !CODIGO[accion] || !/^[\w.-]{1,120}$/.test(String(id)) || !Number.isInteger(Number(v))) return null;
  const data = `${CODIGO[accion]}|${id}|${Number(v)}|${firmaDe(accion, id, Number(v), chatId, secreto)}`;
  return Buffer.byteLength(data) <= TOPE_CALLBACK ? data : null;
}
export function parsearCallback(data) {
  const p = String(data || '').split('|');
  if (p.length !== 4 || !ACCION[p[0]] || !/^[\w.-]{1,120}$/.test(p[1]) || !/^\d{1,9}$/.test(p[2]) || !/^[A-Za-z0-9_-]{8}$/.test(p[3])) return null;
  return { accion: ACCION[p[0]], id: p[1], v: Number(p[2]), firma: p[3] };
}
export function verificarCallback(cb, chatId, secreto) {
  if (!cb || !secreto || !CODIGO[cb.accion]) return false;
  return igual(cb.firma, firmaDe(cb.accion, cb.id, cb.v, chatId, secreto));
}

// ---------- Comandos ----------
export function comandoDe(texto) {
  const m = /^\/([a-zA-Z]+)(?:@\w+)?(?:\s+([\s\S]*))?$/.exec(String(texto || '').trim());
  if (!m) return null;
  const c = m[1].toLowerCase(), alias = { start: 'ayuda', help: 'ayuda' }, ok = ['vincular', 'hoy', 'decide', 'ayuda', 'baja'];
  const comando = ok.includes(alias[c] || c) ? alias[c] || c : 'desconocido';
  return { comando, arg: limpio(m[2] || '', 64) };
}

// ---------- MarkdownV2 ----------
export const formatoTelegram = (t) => String(t ?? '').replace(/[\\_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

// ---------- Parseo ----------
// Telegram → un mensaje normalizado, o null (grupos, bots, edición, cosas que no entendemos).
export function parsearTelegram(update) {
  const base = (chat, from) => (chat?.type === 'private' && from && !from.is_bot && /^\d{1,20}$/.test(String(chat.id)) ? { canal: 'telegram', chatId: String(chat.id), usuarioExterno: String(from.id) } : null);
  const cq = update?.callback_query;
  if (cq) {
    const b = base(cq.message?.chat, cq.from), cb = parsearCallback(cq.data);
    return b && cb ? { ...b, tipo: 'callback', texto: '', callback: cb, callbackId: String(cq.id || '').slice(0, 100) } : null;
  }
  const m = update?.message, b = base(m?.chat, m?.from);
  if (!b) return null;
  const voz = m.voice || m.audio;
  if (voz?.file_id) return { ...b, tipo: 'voz', texto: '', archivoId: String(voz.file_id).slice(0, 200) };
  if (typeof m.text !== 'string') return null;
  const texto = limpio(m.text);
  return texto ? { ...b, tipo: comandoDe(texto) ? 'comando' : 'texto', texto } : null;
}
// WhatsApp Cloud → lista de mensajes normalizados (un webhook puede traer varios o solo estados).
export function parsearWhatsAppCloud(payload) {
  const out = [];
  for (const e of Array.isArray(payload?.entry) ? payload.entry : []) for (const c of Array.isArray(e?.changes) ? e.changes : []) for (const m of Array.isArray(c?.value?.messages) ? c.value.messages : []) {
    if (!/^\d{6,20}$/.test(String(m?.from || ''))) continue;
    const b = { canal: 'whatsapp', chatId: String(m.from), usuarioExterno: String(m.from), ts: Number(m.timestamp) ? Number(m.timestamp) * 1000 : 0 };
    if (m.type === 'text' && typeof m.text?.body === 'string') { const texto = limpio(m.text.body); if (texto) out.push({ ...b, tipo: comandoDe(texto) ? 'comando' : 'texto', texto }); }
    else if (m.type === 'audio' && m.audio?.id) out.push({ ...b, tipo: 'voz', texto: '', archivoId: String(m.audio.id).slice(0, 200) });
    else if (m.type === 'interactive') { const r = m.interactive?.button_reply || m.interactive?.list_reply, cb = parsearCallback(r?.id); if (cb) out.push({ ...b, tipo: 'callback', texto: '', callback: cb }); }
  }
  return out;
}

// ---------- Tarjeta de decisión ----------
export const esSensible = (x) => SENSIBLES.includes(x?.tool) || x?.area === 'ads' || x?.ws === 'ads' || RE_SENSIBLE.test(String(x?.titulo || ''));
export function tarjetaDecision(item, { chatId, secreto, appUrl = '' } = {}) {
  const sensible = esSensible(item), faltas = (Array.isArray(item?.faltas) ? item.faltas : []).map((f) => limpio(f, 120)).filter(Boolean).slice(0, 4);
  const razon = limpio(item?.escaladoPor ? `Te la escalaron${item.escaladoNota ? `: ${item.escaladoNota}` : ''}` : item?.prioridad?.razon || item?.revisar || '', 160);
  const lineas = [limpio(item?.titulo || 'Sin título', 100), `Marca: ${limpio(item?.client_slug || '—', 40)}`, razon, faltas.length ? `Falta: ${faltas.join(' · ')}` : '', sensible ? 'Esto se decide en el OS.' : ''].filter(Boolean);
  const botones = [];
  if (!sensible && secreto) {
    const puede = item?.puede || {};
    if (puede.aprobar && !faltas.length) { const d = firmarCallback({ accion: 'aprobar', id: item.id, v: item.v }, chatId, secreto); if (d) botones.push({ id: 'aprobar', label: 'Aprobar', data: d }); }
    if (puede.cambios) { const d = firmarCallback({ accion: 'cambios', id: item.id, v: item.v }, chatId, secreto); if (d) botones.push({ id: 'cambios', label: 'Pedir cambios', data: d }); }
  }
  if (/^https:\/\//.test(appUrl)) botones.push({ id: 'abrir', label: 'Abrir en el OS', url: `${appUrl.replace(/\/$/, '')}/#/decide` });
  return { texto: lineas.join('\n'), md: lineas.map((l, i) => (i === 0 ? `*${formatoTelegram(l)}*` : formatoTelegram(l))).join('\n'), botones, sensible };
}
export const ventana24h = (ultimoMs, ahoraMs = Date.now()) => Number.isFinite(ultimoMs) && ultimoMs > 0 && ahoraMs - ultimoMs < 864e5;
