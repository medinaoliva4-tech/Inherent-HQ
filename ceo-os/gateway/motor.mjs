// El motor del Gateway (PLAN-GATEWAY §5 y D12): lo comparten el ejecutor de línea de comandos (runner.mjs) y el trabajador
// del VPS (worker.mjs).
//   · est(texto)            → tokens estimados (español ≈ 3.4 caracteres por token)
//   · acquire(modelo)       → turno en la cola por proveedor (Featherless: 4 unidades; Kimi K3 y DeepSeek V4 Pro cuestan 4)
//   · chat(...)             → una llamada a LiteLLM en vivo (SSE), con reintentos ante 429/5xx
//   · condense(texto, meta) → resume por bloques con el modelo de preparación, sin inventar
import fs from 'node:fs';
import path from 'node:path';
import { leerLimite } from './contexto.mjs';
import os from 'node:os';
import { setTimeout as dormir } from 'node:timers/promises';
// Conserva TimeoutError: el worker distingue plazo agotado de cancelación humana.
const pausa = (ms, value, opts) => dormir(ms, value, opts).catch((e) => { throw opts?.signal?.aborted ? opts.signal.reason : e; });

const here = path.dirname(new URL(import.meta.url).pathname);
export const limits = JSON.parse(fs.readFileSync(path.join(here, 'limits.json'), 'utf8'));
export const BASE = process.env.LITELLM_BASE || 'http://127.0.0.1:4000/v1';
const KEY = () => process.env.LITELLM_MASTER_KEY || '';
export const est = (t) => Math.ceil(String(t ?? '').length / 3.4);
export const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
// El tope que el proveedor dijo en un error manda sobre limits.json: sirve para cualquier modelo o plan nuevo.
const aprendido = new Map();
export const contextoDe = (m) => Math.min(limits.modelos[m]?.contexto ?? 32768, aprendido.get(m) ?? Infinity);
export const aprenderTope = (m, n) => { if (n > 1000) aprendido.set(m, n); };
const errorContexto = (m, texto) => { const l = leerLimite(texto); if (!l) return null; if (l.limite) aprenderTope(m, l.limite); return Object.assign(new Error(`${m}: el pedido no cabe en su contexto`), { code: 'CONTEXTO' }); };

// ---------- cola: semáforo por proveedor, con carpetas (sirve entre procesos) ----------
const LOCKDIR = path.join(os.tmpdir(), 'gw-locks'); fs.mkdirSync(LOCKDIR, { recursive: true });
export async function acquire(m, onEspera = () => {}, signal) {
  const proveedor = limits.modelos[m]?.proveedor || 'otro';
  // Conservador: una llamada por proveedor en esta máquina, independientemente del costo.
  // La coordinación Mac/VPS requiere una cola central en el servidor.
  const f = path.join(LOCKDIR, `${proveedor}.turno`);
  for (let waited = 0; ; waited++) {
    signal?.throwIfAborted();
    try {
      fs.mkdirSync(f);
      try { fs.writeFileSync(path.join(f, 'pid'), String(process.pid)); }
      catch (e) { fs.rmdirSync(f); throw e; }
      return () => { try { fs.unlinkSync(path.join(f, 'pid')); fs.rmdirSync(f); } catch {} };
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try {
        const pid = Number(fs.readFileSync(path.join(f, 'pid'), 'utf8'));
        if (Number.isInteger(pid) && pid > 0) {
          try { process.kill(pid, 0); }
          catch (err) { if (err.code === 'ESRCH') { fs.unlinkSync(path.join(f, 'pid')); fs.rmdirSync(f); } }
        }
      } catch (err) {
        // El dueño puede estar escribiendo el pid: no quitar un candado recién creado.
        if (err.code === 'ENOENT') { try { if (Date.now() - fs.statSync(f).mtimeMs > 900000) fs.rmdirSync(f); } catch {} }
      }
    }
    if (waited % 10 === 0) onEspera(1);
    await pausa(1500, undefined, { signal });
  }
}

// onAvance({ caracteres, razonando, texto }) se llama cada `cadaMs` (20 s por defecto) mientras el modelo trabaja.
// messages: si se pasa, reemplaza [system, user] (el Chat manda la conversación completa). signal: para detenerlo.
// tools: herramientas en formato chat/completions; si el modelo pide alguna, vuelven en `toolCalls` (armadas desde el stream).
export async function chat(m, system, user, maxOut, { onAvance = () => {}, onEspera = () => {}, cadaMs = 20000, messages = null, signal: callerSignal, tools = null, timeoutMs = 180000 } = {}) {
  const deadline = AbortSignal.timeout(timeoutMs);
  const signal = callerSignal ? AbortSignal.any([callerSignal, deadline]) : deadline;
  const release = await acquire(m, onEspera, signal);
  try {
    for (let intento = 1; intento <= 4; intento++) {
      const t0 = Date.now();
      const r = await fetch(`${BASE}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY()}` },
        body: JSON.stringify({ model: m, max_tokens: maxOut, stream: true, stream_options: { include_usage: true }, messages: messages || [{ role: 'system', content: system }, { role: 'user', content: user }], ...(tools?.length ? { tools, tool_choice: 'auto' } : {}) }),
        signal,
      });
      if (r.status === 429 || r.status >= 500) { const cuerpo = await r.text().catch(() => ''), ec = errorContexto(m, cuerpo); if (ec) throw ec; log(`  ${m}: HTTP ${r.status}, reintento ${intento}`); if (intento < 4) await pausa(4000 * intento, undefined, { signal }); continue; }
      if (!r.ok) { const cuerpo = await r.text(); throw errorContexto(m, cuerpo) || new Error(`${m}: HTTP ${r.status} ${cuerpo.slice(0, 300)}`); }
      // En vivo (SSE): evita el límite de espera de la primera respuesta mientras el modelo «piensa».
      let content = '', thinking = 0, usage = {}, finish = '', buf = '', ultimo = Date.now();
      const calls = []; // las llamadas a herramientas llegan en pedazos: por índice, nombre y argumentos
      const dec = new TextDecoder();
      for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
          if (!line.startsWith('data:') || line.includes('[DONE]')) continue;
          try {
            const j = JSON.parse(line.slice(5)), d = j.choices?.[0]?.delta || {};
            if (d.content) content += d.content;
            for (const tc of d.tool_calls || []) { const k = tc.index ?? calls.length; calls[k] ||= { id: '', type: 'function', function: { name: '', arguments: '' } }; if (tc.id) calls[k].id = tc.id; if (tc.function?.name) calls[k].function.name += tc.function.name; if (tc.function?.arguments) calls[k].function.arguments += tc.function.arguments; }
            if (d.reasoning_content || d.reasoning) thinking += 1;
            if (j.choices?.[0]?.finish_reason) finish = j.choices[0].finish_reason;
            if (j.usage) usage = j.usage;
          } catch {}
        }
        if (Date.now() - ultimo > cadaMs) { ultimo = Date.now(); try { await onAvance({ caracteres: content.length, razonando: thinking, texto: content }); } catch {} }
      }
      await onAvance({ caracteres: content.length, razonando: thinking, texto: content });
      const toolCalls = calls.filter((c) => c?.function?.name).map((c, i) => ({ ...c, id: c.id || `call_${i}_${Date.now().toString(36)}` }));
      if (!content.trim() && !toolCalls.length) throw new Error(`${m} devolvió vacío (finish=${finish}). Sube la salida máxima o usa otro modelo.`);
      return { content, usage, toolCalls, finish, seg: Math.round((Date.now() - t0) / 1000) };
    }
    throw new Error(`${m}: sin respuesta tras reintentos`);
  } finally { release(); }
}

export async function condense(text, target, prepModel, opts = {}) {
  const piece = 6000 * 3.4, chunks = [];
  for (let i = 0; i < text.length; i += piece) chunks.push(text.slice(i, i + piece));
  const each = Math.max(300, Math.floor(target / chunks.length));
  const out = [];
  for (const [i, c] of chunks.entries()) {
    log(`  condensando bloque ${i + 1}/${chunks.length} -> ~${each} tokens`);
    const r = await chat(prepModel, 'Condensas texto sin inventar nada. Conservas literal reglas, cifras, códigos, nombres, fechas y condiciones. Español.', `Condensa a un máximo de ${each} tokens, conservando lo operativo:\n\n${c}`, each + 300, opts);
    out.push(r.content);
  }
  return out.join('\n\n');
}

// Una vuelta con herramientas (sin streaming: hace falta el mensaje completo con sus tool_calls).
// messages y tools en el formato de chat/completions. → { message, usage, seg }
export async function chatTools(m, messages, tools, maxOut, { onEspera = () => {}, signal: callerSignal, timeoutMs = 180000 } = {}) {
  const deadline = AbortSignal.timeout(timeoutMs);
  const signal = callerSignal ? AbortSignal.any([callerSignal, deadline]) : deadline;
  const release = await acquire(m, onEspera, signal);
  try {
    for (let intento = 1; intento <= 4; intento++) {
      const t0 = Date.now();
      const r = await fetch(`${BASE}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY()}` },
        signal,
        body: JSON.stringify({ model: m, max_tokens: maxOut, messages, ...(tools?.length ? { tools, tool_choice: 'auto' } : {}) }),
      });
      if (r.status === 429 || r.status >= 500) { const cuerpo = await r.text().catch(() => ''), ec = errorContexto(m, cuerpo); if (ec) throw ec; log(`  ${m}: HTTP ${r.status}, reintento ${intento}`); if (intento < 4) await pausa(4000 * intento, undefined, { signal }); continue; }
      if (!r.ok) { const cuerpo = await r.text(); throw errorContexto(m, cuerpo) || new Error(`${m}: HTTP ${r.status} ${cuerpo.slice(0, 300)}`); }
      const j = await r.json();
      return { message: j.choices?.[0]?.message || {}, finish: j.choices?.[0]?.finish_reason || '', usage: j.usage || {}, seg: Math.round((Date.now() - t0) / 1000) };
    }
    throw new Error(`${m}: sin respuesta tras reintentos`);
  } finally { release(); }
}
