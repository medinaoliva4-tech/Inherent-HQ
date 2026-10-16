// El CRM: las reglas que comparten la app, el conector de Claude y la entrada pública (/api/intake).
// Tres reglas vienen del manual: ningún lead abierto sin siguiente paso y fecha · el historial
// solo se agrega · el responsable es un rol, nunca una persona.
import crypto from 'node:crypto';
import * as db from './db.js';

export const STAGES = ['Prospecto', 'Nuevo', 'Contactado', 'Reunión', 'Propuesta', 'Ganado', 'Perdido'];
export const OPEN = ['Nuevo', 'Contactado', 'Reunión', 'Propuesta']; // abiertos: exigen siguiente paso y fecha
export const LOST = ['precio', 'tiempo', 'no era el momento', 'se fue con otro', 'otro'];
export const SOURCE_TYPES = ['formulario', 'quiz', 'mensajes', 'anuncios', 'scraping', 'importar', 'manual'];
// Lo que una fuente puede llenar de un lead (campo entrante → uno de estos).
export const TARGETS = ['name', 'contact', 'company', 'phone', 'email', 'ig', 'wants', 'notes', 'answers', 'score', 'plan'];
export const DEFAULT_ROLE = 'ventas';
const today = () => new Date().toISOString().slice(0, 10);
export const isoDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));
const s = (v, n) => String(v ?? '').trim().slice(0, n);

// ---------- claves para no duplicar ----------
// WhatsApp: los últimos 8 dígitos (el número local, con o sin código de país). Correo en minúsculas. Cuenta de IG sin @ ni link.
export const phoneKey = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 7 ? d.slice(-8) : ''; };
export const emailKey = (e) => { const x = String(e || '').trim().toLowerCase(); return /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/.test(x) ? x : ''; };
export const igKey = (h) => String(h || '').trim().toLowerCase().replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/^@/, '').replace(/[/?#].*$/, '').replace(/[^a-z0-9._]/g, '').slice(0, 40);
export const keysOf = (l) => ({ phone: phoneKey(l?.phone), email: emailKey(l?.email), ig: igKey(l?.ig) });
export function findDup(list, l, skipId) {
  const k = keysOf(l); if (!k.phone && !k.email && !k.ig) return null;
  return list.find((x) => x.id !== skipId && (() => { const y = keysOf(x); return (k.phone && y.phone === k.phone) || (k.email && y.email === k.email) || (k.ig && y.ig === k.ig); })()) || null;
}

// ---------- el documento ----------
export const entry = (who, text) => ({ at: new Date().toISOString(), who: s(who, 80), text: s(text, 2000) });
// El historial solo se agrega: lo que ya estaba nunca se quita ni se cambia, aunque el cliente mande menos.
export function mergeActivity(cur, next) {
  const old = Array.isArray(cur) ? cur : [], seen = new Set(old.map((a) => `${a.at}|${a.text}`));
  return [...old, ...(Array.isArray(next) ? next : []).filter((a) => a && a.text && !seen.has(`${a.at}|${a.text}`)).map((a) => ({ at: isoDate(String(a.at || '').slice(0, 10)) ? a.at : new Date().toISOString(), who: s(a.who, 80), text: s(a.text, 2000) }))];
}
// Deja el lead con sus campos en orden (tipos, largos, rol por defecto). No decide nada.
export function normalize(d) {
  const o = { ...(d || {}) };
  for (const k of ['name', 'contact', 'company', 'wants', 'next_step', 'source', 'plan']) if (k in o) o[k] = s(o[k], k === 'name' || k === 'company' ? 160 : 200);
  if ('notes' in o) o.notes = s(o.notes, 8000);
  if ('phone' in o) o.phone = s(o.phone, 40);
  if ('email' in o) o.email = s(o.email, 160).toLowerCase();
  if ('ig' in o) o.ig = igKey(o.ig);
  o.stage = STAGES.includes(o.stage) ? o.stage : o.stage ? o.stage : 'Nuevo';
  o.owner_role = s(o.owner_role, 40) || DEFAULT_ROLE;
  o.direction = o.direction === 'out' ? 'out' : 'in';
  if ('interest' in o) o.interest = Math.max(0, Math.min(5, Math.round(+o.interest || 0)));
  if ('value_usd' in o) o.value_usd = o.value_usd === '' || o.value_usd == null ? null : +o.value_usd || 0;
  if ('score' in o) o.score = o.score === '' || o.score == null ? null : Math.max(0, Math.min(100, Math.round(+o.score || 0)));
  if ('next_date' in o) o.next_date = isoDate(o.next_date) ? o.next_date : '';
  if ('lost_reason' in o) o.lost_reason = LOST.includes(o.lost_reason) ? o.lost_reason : '';
  if (o.stage !== 'Perdido') o.lost_reason = '';
  o.tags = (Array.isArray(o.tags) ? o.tags : []).map((t) => s(t, 40)).filter(Boolean).slice(0, 12);
  if (o.answers && typeof o.answers === 'object') { const j = JSON.stringify(o.answers); o.answers = j.length > 6000 ? { texto: j.slice(0, 6000) } : o.answers; } else if (typeof o.answers === 'string') o.answers = o.answers.trim() ? { texto: o.answers.slice(0, 6000) } : undefined;
  if (o.answers === undefined) delete o.answers;
  return o;
}
// El candado. Devuelve el motivo si no se puede guardar; null si está bien.
export function check(doc) {
  const stage = doc.stage || 'Nuevo';
  if (!STAGES.includes(stage)) return `Etapa inválida. Las válidas: ${STAGES.join(', ')}`;
  if (!s(doc.name, 160)) return 'Falta el nombre del lead';
  if (OPEN.includes(stage) && (!s(doc.next_step, 200) || !isoDate(doc.next_date))) return 'Un lead abierto no se guarda sin siguiente paso y fecha';
  if (stage === 'Perdido' && !LOST.includes(doc.lost_reason)) return `Para marcarlo perdido falta el motivo: ${LOST.join(', ')}`;
  return null;
}
const err = (m, status = 400) => Object.assign(new Error(m), { status });

// Crea el lead, o si ya existe (mismo WhatsApp, correo o cuenta de IG) solo le agrega la actividad y
// completa lo que le faltaba. Nunca duplica.
export async function createOrTouch(data, who, via = '') {
  const all = await db.list('leads');
  const d = normalize(data);
  const dup = findDup(all, d);
  if (dup) {
    const fill = {}; for (const k of ['phone', 'email', 'ig', 'company', 'contact', 'wants', 'plan', 'score']) if (!dup[k] && d[k]) fill[k] = d[k];
    if (d.answers && !dup.answers) fill.answers = d.answers;
    const text = `Volvió a entrar${via ? ` por ${via}` : ''}${d.notes ? ` · ${s(d.notes, 300)}` : ''}`;
    const r = await db.update('leads', dup.id, { ...dup, ...fill, activity: mergeActivity(dup.activity, [entry(who, text)]) }, dup.v, who);
    return { lead: r || dup, duplicate: true };
  }
  if (!d.name) d.name = d.contact || d.company || (d.ig ? '@' + d.ig : '') || d.email || d.phone || '';
  const open = OPEN.includes(d.stage);
  if (open && !d.next_step) d.next_step = d.direction === 'out' ? 'Primer mensaje' : 'Responder y calificar';
  if (open && !d.next_date) d.next_date = today();
  const bad = check(d); if (bad) throw err(bad);
  const first = `Lead creado${via ? ` · ${via}` : ''}`;
  const lead = await db.create('leads', { ...d, activity: mergeActivity([], [entry(who, first), ...(Array.isArray(d.activity) ? d.activity : [])]) }, who);
  return { lead, duplicate: false };
}

// ---------- fuentes ----------
export const newKey = () => crypto.randomBytes(24).toString('base64url');
export function cleanSource(b) {
  const type = SOURCE_TYPES.includes(b.type) ? b.type : 'formulario';
  const map = {}; for (const t of TARGETS) { const v = s(b.map?.[t], 60); if (v) map[t] = v; }
  return { name: s(b.name, 80), type, key: /^[\w-]{16,80}$/.test(String(b.key || '')) ? b.key : newKey(), active: b.active !== false, map,
    stage_in: STAGES.includes(b.stage_in) ? b.stage_in : type === 'scraping' ? 'Prospecto' : 'Nuevo', role: s(b.role, 40) || DEFAULT_ROLE,
    direction: b.direction === 'out' || (b.direction == null && type === 'scraping') ? 'out' : 'in', main: Boolean(b.main), notes: s(b.notes, 400), log: Array.isArray(b.log) ? b.log.slice(0, 50) : [] };
}
export async function sourceByKey(key) {
  if (!/^[\w-]{16,80}$/.test(String(key || ''))) return null;
  return (await db.list('lead_sources')).find((x) => x.key === key && x.active !== false) || null;
}
// La fuente del quiz público: la marcada como principal, o la primera activa de tipo quiz.
export async function quizSource() {
  const l = (await db.list('lead_sources')).filter((x) => x.type === 'quiz' && x.active !== false);
  return l.find((x) => x.main) || l[0] || null;
}
// Lo que llegó → los campos del lead, según el mapeo de la fuente (sin mapeo, el campo se llama igual).
// Lo que no cae en ningún campo queda como contexto en las notas.
export function applyMap(src, payload) {
  const p = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const map = src.map || {}, out = {}, used = new Set();
  const get = (k) => { const v = p[k]; return v == null ? undefined : typeof v === 'object' ? v : String(v); };
  for (const t of TARGETS) { const from = map[t] || t; const v = get(from); if (v !== undefined && v !== '') { out[t] = v; used.add(from); } }
  // Alias comunes de formularios y Zapier.
  const AL = { name: ['nombre', 'full_name', 'fullname', 'first_name'], phone: ['whatsapp', 'telefono', 'teléfono', 'tel', 'celular', 'phone_number'], email: ['correo', 'mail', 'e-mail'], ig: ['instagram', 'cuenta', 'handle', 'usuario'], company: ['empresa', 'negocio', 'marca', 'business'], notes: ['mensaje', 'message', 'comentario', 'notas'], wants: ['interes', 'interés', 'servicio', 'quiere'], answers: ['respuestas'] };
  for (const [t, ks] of Object.entries(AL)) if (out[t] === undefined) for (const k of ks) { const v = get(k); if (v !== undefined && v !== '') { out[t] = v; used.add(k); break; } }
  const rest = Object.entries(p).filter(([k, v]) => !used.has(k) && v != null && v !== '' && typeof v !== 'object').map(([k, v]) => `${k}: ${String(v).slice(0, 200)}`).slice(0, 20);
  if (rest.length) out.notes = [out.notes, ...rest].filter(Boolean).join('\n');
  return out;
}
// Una entrada por la puerta de una fuente: mapea, arma el lead y lo crea o lo toca.
export async function intake(src, payload, who = 'intake') {
  const m = applyMap(src, payload);
  if (!m.name && !m.contact && !m.phone && !m.email && !m.ig && !m.company) throw err('No trae nombre ni forma de contacto (WhatsApp, correo o cuenta de IG)');
  const doc = { name: m.name || m.contact || m.company || '', contact: m.contact || '', company: m.company || '', phone: m.phone || '', email: m.email || '', ig: m.ig || '', wants: m.wants || (m.plan ? `Plan sugerido: ${m.plan}` : ''), notes: m.notes || '',
    answers: m.answers, score: m.score, plan: m.plan, source: src.name, source_id: src.id, direction: src.direction || 'in', stage: src.stage_in || 'Nuevo', owner_role: src.role || DEFAULT_ROLE, tags: [], interest: m.score != null ? Math.max(1, Math.min(5, Math.ceil((+m.score || 0) / 20))) : 0 };
  return createOrTouch(doc, who, src.name);
}
// El registro de la fuente: lo último que llegó y lo que falló (50 entradas).
export async function logSource(src, item, who = 'intake') {
  const cur = (await db.get('lead_sources', src.id)) || src;
  const log = [{ at: new Date().toISOString(), ...item }, ...(Array.isArray(cur.log) ? cur.log : [])].slice(0, 50);
  const n = { ok: (cur.n?.ok || 0) + (item.ok ? 1 : 0), fail: (cur.n?.fail || 0) + (item.ok || item.spam ? 0 : 1), spam: (cur.n?.spam || 0) + (item.spam ? 1 : 0), last_at: new Date().toISOString() };
  await db.upsert('lead_sources', src.id, { log, n }, who);
}
