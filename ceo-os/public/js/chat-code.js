// Code dentro del Chat del OS (modo «Code»): el motor es el puente del VPS (code-os/puente), no el gateway de chat.
// Mismo contrato que chat-gateway.js (turno con on.delta / on.tool / on.nota), para que la pantalla del Chat no cambie.
//   · Entrada: el OS (tu sesión de Google) emite un pase corto en POST /api/code/pase; el puente lo acepta como login.
//   · Cada cliente del selector es un PROYECTO de Code (una carpeta en el servidor): projectId = slug del cliente.
//   · Una conversación del Chat ↔ una sesión del puente (vínculo guardado también en la base del OS).
import { api } from './core.js';
import { traducir, proyectoDe } from './chat-code-puro.js';
export { traducir, proyectoDe };

const LLAVE = (email) => `os.code.sesiones.${email}`;
const leer = (email) => { try { return JSON.parse(localStorage.getItem(LLAVE(email)) || '{}') || {}; } catch { return {}; } };
const guardar = (email, m) => { try { localStorage.setItem(LLAVE(email), JSON.stringify(m)); } catch { /* sin almacenamiento */ } };
const sincronizadas = new Set();
export function recordarSesiones(email, sesiones) {
  const m = leer(email);
  for (const s of sesiones || []) if (s.code_session_id) { m[s.id] = s.code_session_id; sincronizadas.add(`${email}:${s.id}`); }
  guardar(email, m);
}
async function vincular(email, idOs, sid) {
  try {
    const r = await api(`chat/sesiones/${encodeURIComponent(idOs)}/code`, { method: 'POST', body: { code_session_id: sid } });
    sincronizadas.add(`${email}:${idOs}`);
    return r.code_session_id;
  } catch (e) {
    if (e.status !== 409) throw e;
    const s = await api(`chat/sesiones/${encodeURIComponent(idOs)}`);
    if (!s.code_session_id) throw e;
    sincronizadas.add(`${email}:${idOs}`);
    return s.code_session_id;
  }
}

// ---- El pase (10 min): se pide al OS y se renueva un minuto antes de caducar ----
let cache = null;
export async function pase(forzar = false) {
  if (!forzar && cache && cache.expira - Date.now() > 60_000) return cache;
  cache = await api('code/pase', { method: 'POST', body: {} });
  return cache;
}
const pedir = async (ruta, init = {}) => {
  const p = await pase();
  const res = await fetch(p.url + ruta, { ...init, headers: { ...(init.headers || {}), authorization: `Bearer ${p.pase}`, ...(init.body ? { 'content-type': 'application/json' } : {}) } });
  if (!res.ok) { let m = `Code respondió ${res.status}`; try { m = (await res.json()).error || m; } catch { /* sin cuerpo */ } throw Object.assign(new Error(m), { status: res.status }); }
  return res;
};

// ---- Sesiones ----
// `sistema`: los lineamientos de un departamento (llm/departamentos.js). El puente solo los acepta al CREAR la sesión (systemPrompt,
// máx. 8000), por eso cada departamento tiene su propia sesión dentro de la conversación: idOs = «<conversación>::<departamento>».
async function sesionDe(email, idOs, { proyecto, modelo, modo = 'code', titulo, sistema = '' }) {
  const m = leer(email);
  if (m[idOs]) {
    if (!idOs.includes('::') && !sincronizadas.has(`${email}:${idOs}`)) { m[idOs] = await vincular(email, idOs, m[idOs]); guardar(email, m); }
    return m[idOs];
  }
  const res = await pedir('/sessions', { method: 'POST', body: JSON.stringify({ projectId: proyectoDe(proyecto), model: modelo || 'nivel-medio', mode: modo, title: titulo, ...(sistema ? { systemPrompt: String(sistema).slice(0, 8000) } : {}) }) });
  const s = await res.json();
  m[idOs] = idOs.includes('::') ? s.id : await vincular(email, idOs, s.id);
  guardar(email, m); return m[idOs];
}

/**
 * Un turno de Code. on = { delta, tool, nota, permiso(p, responder) }. Resuelve al terminar el turno.
 * `responder(decision)` envía allow | deny | allow_all al puente para la tarjeta de permiso.
 */
export async function turnoCode(idOs, { email, mensaje, proyecto, modelo, modo, titulo, sistema, signal, on = {} }) {
  const sid = await sesionDe(email, idOs, { proyecto, modelo, modo, titulo, sistema });
  const ctrl = new AbortController(); signal?.addEventListener('abort', () => { pedir(`/sessions/${sid}/interrupt`, { method: 'POST' }).catch(() => {}); }, { once: true });
  await pedir(`/sessions/${sid}`, { method: 'PATCH', body: JSON.stringify({ ...(modelo ? { model: modelo } : {}), ...(modo ? { mode: modo } : {}) }) }).catch(() => {});
  const { turnId } = await (await pedir(`/sessions/${sid}/messages`, { method: 'POST', body: JSON.stringify({ text: mensaje, queue: false }) })).json();
  const res = await pedir(`/sessions/${sid}/events`, { signal: ctrl.signal });
  const est = { texto: '' }; let buf = '', fin = null;
  const dec = new TextDecoder();
  try {
    for await (const chunk of res.body) {
      if (signal?.aborted) throw Object.assign(new Error('Interrumpido.'), { name: 'AbortError' });
      buf += dec.decode(chunk, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const blk = buf.slice(0, i); buf = buf.slice(i + 2);
        const d = blk.split('\n').find((l) => l.startsWith('data: ')); if (!d) continue;
        const e = JSON.parse(d.slice(6));
        for (const [cb, arg] of traducir(e, est)) {
          if (cb === 'permiso') on.permiso?.(arg, (decision, extra = {}) => pedir(`/sessions/${sid}/permissions/${arg.id}`, { method: 'POST', body: JSON.stringify({ decision, ...extra }) }).catch(() => {}));
          else on[cb]?.(arg);
        }
        if (e.type === 'turn_end' && (!turnId || e.turnId === turnId)) { fin = e; throw new Error('__fin__'); }
      }
    }
  } catch (err) { if (err.message !== '__fin__') { if (err.name === 'AbortError') throw err; throw err; } }
  finally { ctrl.abort(); }
  if (!fin?.ok) throw new Error(fin?.error || 'Code no pudo terminar el turno');
  return { texto: fin.result || est.texto, estado: 'completed', uso: fin.usage };
}

/** La sesión del puente de una conversación (la de Code, o la de un departamento con idOs «<conversación>::<dep>»), o ''. */
export const sesionCode = (email, idOs) => leer(email)[idOs] || '';
/** Archivos y cambios del proyecto de una conversación (el panel de Code). */
export async function archivos(email, idOs) { const sid = leer(email)[idOs]; if (!sid) return []; return (await (await pedir(`/sessions/${sid}/files`)).json()).archivos; }
export async function cambios(email, idOs) { const sid = leer(email)[idOs]; if (!sid) return []; return (await (await pedir(`/sessions/${sid}/diff`)).json()).archivos; }
export async function leerArchivo(email, idOs, ruta) {
  const sid = leer(email)[idOs]; if (!sid) throw new Error('Abre primero una sesión de Code');
  const r = await pedir(`/sessions/${sid}/files?path=${encodeURIComponent(ruta)}`);
  return (await r.json()).contenido;
}
export async function guardarArchivo(email, idOs, ruta, contenido) {
  const sid = leer(email)[idOs]; if (!sid) throw new Error('Abre primero una sesión de Code');
  return (await pedir(`/sessions/${sid}/files?path=${encodeURIComponent(ruta)}`, { method: 'PUT', body: JSON.stringify({ contenido }) })).json();
}
export async function fusionarCode(email, idOs) {
  const sid = leer(email)[idOs]; if (!sid) throw new Error('Abre primero una sesión de Code');
  return (await pedir(`/sessions/${sid}/merge`, { method: 'POST', body: '{}' })).json();
}
export async function terminalCode(email, idOs) {
  const sid = leer(email)[idOs]; if (!sid) throw new Error('Abre primero una sesión de Code');
  const p = await pase();
  const u = new URL(p.url);
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
  u.pathname = `${u.pathname.replace(/\/$/, '')}/sessions/${sid}/terminal`;
  u.search = new URLSearchParams({ pase: p.pase }).toString();
  return u.toString();
}
/** Cuotas y estado de la sesión de Claude (el medidor del Chat). */
export async function estado() { const [me, cuotas] = await Promise.all([pedir('/me').then((r) => r.json()), pedir('/cuotas').then((r) => r.json()).catch(() => null)]); return { me, cuotas }; }
export async function niveles() { const r = await (await pedir('/models')).json(); return r.models.map((m) => m.id); }
