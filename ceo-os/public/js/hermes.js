// Hermes Agent en la compu de cada persona: el harness que corre los chats del OS con el modelo que cada quien
// eligió (ChatGPT con su cuenta, Claude, o uno local). El OS le habla directo a 127.0.0.1:8642 (su API local, con la
// llave que la app de Mac le pasa sola o que la persona pega una vez). Vercel nunca habla con Hermes.
import { api } from './core.js';

const K = (me) => `os.hermes.${me.email}`;
const URL_BASE = 'http://127.0.0.1:8642';

// La conexión de esta compu: { url, key } · la app de Mac la entrega en window.inherentEscritorio.hermes; en el navegador se pega una vez.
export function hermesDe(me) {
  try { const h = window.inherentEscritorio?.hermes; if (h?.key) return { url: h.url || URL_BASE, key: h.key }; } catch {}
  try { const j = JSON.parse(localStorage.getItem(K(me)) || 'null'); if (j?.key) return { url: j.url || URL_BASE, key: j.key }; } catch {}
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
export async function saludHermes(me) {
  const h = hermesDe(me) || { url: URL_BASE, key: '' };
  try {
    const r = await fetch(h.url + '/health', { credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', signal: AbortSignal.timeout(4000) });
    if (!r.ok) return { on: false };
    const j = await r.json();
    let auth = false; if (h.key) { try { await pide(h, '/v1/capabilities', { ms: 4000 }); auth = true; } catch {} }
    return { on: j.status === 'ok', version: j.version || '', auth };
  } catch { return { on: false }; }
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
export const nombreProveedor = (slug) => ({ 'openai-codex': 'ChatGPT', anthropic: 'Claude', nous: 'Nous Portal', openrouter: 'OpenRouter', openai: 'OpenAI', lmstudio: 'LM Studio', ollama: 'Ollama', llamacpp: 'llama.cpp', custom: 'Endpoint propio', 'github-copilot': 'Copilot', xai: 'Grok' }[slug] || slug);

// Una respuesta en streaming por la API compatible con OpenAI. Mantiene la conversación con X-Hermes-Session-Id
// (Hermes guarda el historial): cada chat del OS manda su propia sesión. onDelta(texto acumulado) · onTool(nombre).
export async function chatHermes(me, { sesion, sistema, mensaje, modelo = {}, signal, onDelta = () => {}, onTool = () => {} }) {
  const h = hermesDe(me); if (!h) throw new Error('Hermes no está conectado en esta compu');
  const r = await pide(h, '/v1/chat/completions', { method: 'POST', signal, ms: 20 * 60 * 1000, headers: { 'X-Hermes-Session-Id': sesion, 'X-Hermes-Session-Key': `inherent:${me.email}` }, body: { model: modelo.model || 'inherent', ...(modelo.provider ? { provider: modelo.provider } : {}), stream: true, messages: [...(sistema ? [{ role: 'system', content: sistema }] : []), { role: 'user', content: mensaje }] } });
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
export const URL_HERMES = URL_BASE;
