// Hermes Agent en la compu de cada persona: el harness que corre los chats del OS con el modelo que cada quien
// eligió (ChatGPT con su cuenta, Claude, o uno local). El OS le habla directo a 127.0.0.1:8642 (su API local, con la
// llave que la app de Mac le pasa sola o que la persona pega una vez). Vercel nunca habla con Hermes.
import { api } from './core.js';

const K = (me) => `os.hermes.${me.email}`;
const URL_BASE = 'http://127.0.0.1:8642';
// Hermes corre un servicio por compu: la API la abre el perfil principal y atiende al perfil «inherent» en /p/inherent
// (con la llave de ese perfil). Un Hermes de antes (un servicio por perfil) contesta en la raíz.
const PREFIJO = '/p/inherent';
const otraUrl = (u) => (u.endsWith(PREFIJO) ? u.slice(0, -PREFIJO.length) : u + PREFIJO);
// La dirección que sí contestó con esta llave (la encuentra saludHermes). Manda sobre la guardada.
const buena = new Map();

// La conexión de esta compu: { url, key } · la app de Mac la entrega en window.inherentEscritorio.hermes; en el navegador se pega una vez.
export function hermesDe(me) {
  const con = (url, key) => ({ url: buena.get(key) || url || URL_BASE, key });
  try { const h = window.inherentEscritorio?.hermes; if (h?.key) return con(h.url, h.key); } catch {}
  try { const j = JSON.parse(localStorage.getItem(K(me)) || 'null'); if (j?.key) return con(j.url, j.key); } catch {}
  return null;
}
export function setHermes(me, v) { try { if (v?.key) localStorage.setItem(K(me), JSON.stringify({ url: v.url || URL_BASE, key: v.key })); else localStorage.removeItem(K(me)); } catch {} }

const pide = async (h, ruta, { method = 'GET', body, headers = {}, signal, ms = 8000 } = {}) => {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(h.url + ruta, { method, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', signal: signal || c.signal, headers: { Authorization: 'Bearer ' + h.key, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw Object.assign(new Error(j.error?.message || j.error || j.message || `Hermes respondió ${r.status}`), { status: r.status }); }
    return r;
  } finally { clearTimeout(t); }
};

// ¿Hermes está encendido en esta compu? → { on, version, auth (la llave sirve) }
// Prueba la dirección guardada y, si la llave no entra ahí, la otra (/p/inherent o la raíz); se queda con la que contesta.
export async function saludHermes(me) {
  const h = hermesDe(me) || { url: URL_BASE, key: '' };
  let salud = { on: false };
  for (const url of [h.url, otraUrl(h.url)]) {
    try {
      const r = await fetch(url + '/health', { credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', signal: AbortSignal.timeout(4000) });
      if (!r.ok) continue;
      const j = await r.json(), on = j.status === 'ok';
      if (!h.key) return { on, version: j.version || '', auth: false };
      try {
        await pide({ url, key: h.key }, '/v1/capabilities', { ms: 4000 });
        if (url !== h.url) {
          buena.set(h.key, url);
          // En el navegador se guarda la dirección buena; la de la app de Mac la escribe su instalador (api-url).
          let enApp = false; try { enApp = Boolean(window.inherentEscritorio?.hermes?.key); } catch {}
          if (!enApp) setHermes(me, { url, key: h.key });
        }
        return { on, version: j.version || '', auth: true };
      } catch { if (!salud.on) salud = { on, version: j.version || '', auth: false }; }
    } catch {}
  }
  return salud;
}

// Los proveedores y modelos que esta compu tiene conectados (lo mismo que ve el selector de Hermes).
// → { actual: { provider, model }, proveedores: [{ slug, nombre, listo, actual, modelos: [..] }] }
export async function modelosHermes(me, { fresco = false } = {}) {
  const h = hermesDe(me); if (!h) return null;
  const j = await (await pide(h, `/api/model/options${fresco ? '?refresh=1' : ''}`, { ms: 15000 })).json();
  const proveedores = (j.providers || []).map((p) => ({ slug: String(p.slug || p.id || ''), nombre: String(p.name || p.slug || ''), listo: p.authenticated !== false, actual: Boolean(p.is_current), modelos: (p.models || []).map(String) })).filter((p) => p.slug);
  return { actual: { provider: j.provider || '', model: j.model || '' }, proveedores };
}
// Nombres amables de los proveedores de Hermes, para el selector.
export const nombreProveedor = (slug) => ({ 'openai-codex': 'ChatGPT', anthropic: 'Claude', nous: 'Nous Portal', openrouter: 'OpenRouter', openai: 'OpenAI', lmstudio: 'LM Studio', ollama: 'Ollama', llamacpp: 'llama.cpp', 'llama-cpp': 'llama.cpp', vllm: 'vLLM', local: 'Modelo local', 'ollama-cloud': 'Ollama Cloud', custom: 'Endpoint propio', 'github-copilot': 'Copilot', xai: 'Grok', kilocode: 'Kilo', 'ai-gateway': 'Vercel AI Gateway', gemini: 'Gemini' }[slug] || slug);

// Los proveedores locales y las IAs del switch viven en llm/ias.js (puro, lo prueba scripts/test-llm.mjs).
export { LOCALES, esLocal, PASARELAS, IAS, iaDe, modelosDeIa, iasListas, fuertesDe } from './llm/ias.js';

// Una respuesta en streaming por la API compatible con OpenAI. Mantiene la conversación con X-Hermes-Session-Id
// (Hermes guarda el historial): cada chat del OS manda su propia sesión. onDelta(texto acumulado) · onTool(nombre).
export async function chatHermes(me, { sesion, sistema, mensaje, modelo = {}, signal, onDelta = () => {}, onTool = () => {} }) {
  const h = hermesDe(me); if (!h) throw new Error('Hermes no está conectado en esta compu');
  const r = await pide(h, '/v1/chat/completions', { method: 'POST', signal, ms: 20 * 60 * 1000, headers: { 'X-Hermes-Session-Id': sesion }, body: { model: modelo.model || 'inherent', ...(modelo.provider ? { provider: modelo.provider } : {}), stream: true, messages: [...(sistema ? [{ role: 'system', content: sistema }] : []), { role: 'user', content: mensaje }] } });
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', texto = '', fin = '';
  for (;;) {
    const { value, done } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let k; while ((k = buf.indexOf('\n\n')) >= 0) {
      const bloq = buf.slice(0, k); buf = buf.slice(k + 2);
      if (bloq.startsWith(':')) continue; // keepalive
      const ev = /^event: ([\w.]+)/m.exec(bloq)?.[1] || '', crudo = /^data: (.*)$/m.exec(bloq)?.[1];
      if (!crudo || crudo === '[DONE]') continue;
      let d = {}; try { d = JSON.parse(crudo); } catch { continue; }
      if (ev === 'hermes.tool.progress') { const n = d.tool_name || d.tool || d.name; if (n && n !== '_thinking') onTool(String(n)); continue; }
      const ch = d.choices?.[0]; if (!ch) continue;
      if (ch.delta?.content) { texto += ch.delta.content; onDelta(texto); }
      if (ch.finish_reason) fin = ch.finish_reason;
      if (ch.finish_reason === 'error' || d.error) throw new Error(d.error?.message || 'Hermes no pudo responder');
    }
  }
  if (fin === 'cancelled') throw Object.assign(new Error('Interrumpido.'), { name: 'AbortError' });
  return texto;
}
// Nombre de una herramienta de Hermes, en humano, para la lista de pasos del chat.
export const pasoHermes = (n) => ({ read_file: 'Leyendo un archivo', search_files: 'Buscando en el repo', terminal: 'Corriendo un comando', web_search: 'Buscando en la web', web_extract: 'Leyendo una página', memory: 'Guardando en memoria', skill_view: 'Leyendo una skill', skills_list: 'Buscando skills', todo_list: 'Ordenando los pasos' }[n] || n.replace(/_/g, ' '));

// ---------- Las sesiones de Hermes (el Inherent LLM) ----------
// Cada conversación del Inherent LLM es una sesión de Hermes con id «inh-<modo>-…» y su propio system prompt (el harness
// del modo). Hermes guarda el historial: el OS solo la lista, la lee y le manda turnos. CORS de Hermes: solo GET, POST y
// DELETE y las cabeceras Authorization, Content-Type, Idempotency-Key y X-Hermes-Session-Id (nada de PATCH ni Session-Key).
const lista = (j, k) => (Array.isArray(j) ? j : j?.data || j?.[k] || j?.items || []);
const conexion = (me) => { const h = hermesDe(me); if (!h) throw Object.assign(new Error('Hermes no está conectado en esta compu'), { status: 0 }); return h; };

// → [{ id, title, preview, model, last_active, started_at, message_count }]
// tope: true si Hermes devolvió el máximo (puede haber más antiguas que no llegaron).
export async function sesionesHermes(me, { limite = 300, prefijo = 'inh-' } = {}) {
  const j = await (await pide(conexion(me), `/api/sessions?source=api_server&limit=${limite}`, { ms: 10000 })).json(), todas = lista(j, 'sessions');
  return Object.assign(todas.filter((s) => s && String(s.id || '').startsWith(prefijo) && !s.archived && !s.hidden), { tope: todas.length >= limite });
}
export async function crearSesion(me, { id, titulo, sistema, modelo = {} }) {
  const body = { id, source: 'api_server', ...(titulo ? { title: titulo } : {}), ...(sistema ? { system_prompt: sistema } : {}), ...(modelo.model ? { model: modelo.model, provider: modelo.provider || undefined } : {}) };
  return (await pide(conexion(me), '/api/sessions', { method: 'POST', body, ms: 10000 })).json();
}
export async function mensajesSesion(me, id) {
  const j = await (await pide(conexion(me), `/api/sessions/${encodeURIComponent(id)}/messages`, { ms: 15000 })).json();
  return lista(j, 'messages');
}
export async function borrarSesion(me, id) { await pide(conexion(me), `/api/sessions/${encodeURIComponent(id)}`, { method: 'DELETE', ms: 10000 }); }
export async function skillsHermes(me) { const j = await (await pide(conexion(me), '/v1/skills', { ms: 10000 })).json(); return lista(j, 'skills'); }
// Los toolsets de Hermes (web, file, memory, skills…; lo que la IA puede usar) → [{ name, label, enabled, configured, tools: [nombre] }]. [] si Hermes no contesta.
export async function toolsetsHermes(me) {
  try {
    const j = await (await pide(conexion(me), '/v1/toolsets', { ms: 10000 })).json();
    let xs = lista(j, 'toolsets');
    if (!xs.length && j && typeof j === 'object' && !Array.isArray(j)) xs = Object.entries(j).filter(([, v]) => v && typeof v === 'object').map(([name, v]) => ({ name, ...v }));
    return xs.filter((t) => t && typeof t === 'object').map((t) => ({ name: String(t.name || t.id || ''), label: String(t.label || t.title || t.name || t.id || ''), enabled: Boolean(t.enabled), configured: t.configured !== false, tools: (Array.isArray(t.tools) ? t.tools : []).map((x) => String(x?.name ?? x ?? '')).filter(Boolean) })).filter((t) => t.name);
  } catch { return []; }
}

// Un turno en una sesión, en streaming (SSE). Cerrar la conexión (signal) detiene al agente: así funciona «Detener».
// on = { delta(texto acumulado), tool({ fase: 'inicio'|'fin'|'error', nombre, detalle }), nota(texto), aprobacion(evento), run(runId) }
// esfuerzo: cuánto piensa el modelo antes de responder ('low' rápido · 'high' a fondo · '' lo que decida el modelo).
export async function turnoSesion(me, id, { mensaje, sistema, modelo = {}, esfuerzo = '', signal, on = {} }) {
  const h = conexion(me);
  const body = { message: mensaje, ...(sistema ? { system_message: sistema } : {}), ...(modelo.model ? { model: modelo.model, ...(modelo.provider ? { provider: modelo.provider } : {}) } : {}), ...(esfuerzo ? { model_options: { reasoning_effort: esfuerzo } } : {}) };
  const r = await pide(h, `/api/sessions/${encodeURIComponent(id)}/chat/stream`, { method: 'POST', body, signal, ms: 30 * 60 * 1000 });
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', texto = '', final = null, fallo = '', estado = '';
  const emitir = (ev, d) => {
    if (ev === 'run.started' && d.run_id) on.run?.(d.run_id);
    else if (ev === 'assistant.delta') { texto += d.delta || ''; on.delta?.(texto); }
    else if (ev === 'tool.started' || ev === 'tool.completed' || ev === 'tool.failed') on.tool?.({ fase: ev === 'tool.started' ? 'inicio' : ev === 'tool.failed' ? 'error' : 'fin', nombre: String(d.tool_name || ''), detalle: String(d.preview || '').slice(0, 300), args: d.args || null });
    else if (ev === 'assistant.commentary' && d.text && !d.already_streamed) on.nota?.(String(d.text));
    else if (ev === 'approval.request') on.aprobacion?.(d);
    else if (ev === 'assistant.completed') final = String(d.content ?? '');
    else if (ev.startsWith('run.') && ev !== 'run.started') estado = ev.slice(4);
    else if (ev === 'error') fallo = d.message || 'Hermes no pudo responder';
  };
  for (;;) {
    const { value, done } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let k; while ((k = buf.indexOf('\n\n')) >= 0) {
      const bloq = buf.slice(0, k); buf = buf.slice(k + 2);
      if (!bloq.trim() || bloq.startsWith(':')) continue; // keepalive
      const ev = /^event: ([\w.]+)/m.exec(bloq)?.[1] || '', crudo = /^data: (.*)$/m.exec(bloq)?.[1];
      if (!crudo) continue;
      let d = {}; try { d = JSON.parse(crudo); } catch { continue; }
      emitir(ev || d.event || '', d);
    }
  }
  if (fallo) throw new Error(fallo);
  if (estado === 'cancelled') throw Object.assign(new Error('Interrumpido.'), { name: 'AbortError' });
  return { texto: final ?? texto, estado };
}
// Ramificar: una conversación nueva con todo lo hablado, para seguir por otro lado (Hermes da por cerrada la original).
export async function ramificarSesion(me, id, { nuevoId, titulo }) {
  return (await pide(conexion(me), `/api/sessions/${encodeURIComponent(id)}/fork`, { method: 'POST', body: { id: nuevoId, ...(titulo ? { title: titulo } : {}) }, ms: 15000 })).json();
}
// Responder una aprobación (un comando que pide permiso). choice: once · session · always · deny.
export async function responderAprobacion(me, runId, ev, choice) {
  const body = { choice, ...(ev.request_id ? { request_id: ev.request_id } : {}), ...(ev.execution_generation != null ? { execution_generation: ev.execution_generation } : {}) };
  return (await pide(conexion(me), `/v1/runs/${encodeURIComponent(runId)}/approval`, { method: 'POST', body, ms: 15000 })).json();
}
