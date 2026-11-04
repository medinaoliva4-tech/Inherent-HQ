// El motor del Gateway (PLAN-GATEWAY §5 y D12): lo comparten el ejecutor de línea de comandos (runner.mjs) y el trabajador
// del VPS (worker.mjs).
//   · est(texto)            → tokens estimados (español ≈ 3.4 caracteres por token)
//   · acquire(modelo)       → turno en la cola por proveedor (Featherless: 4 unidades; Kimi K3 y DeepSeek V4 Pro cuestan 4)
//   · chat(...)             → una llamada a LiteLLM en vivo (SSE), con reintentos ante 429/5xx
//   · condense(texto, meta) → resume por bloques con el modelo de preparación, sin inventar
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const here = path.dirname(new URL(import.meta.url).pathname);
export const limits = JSON.parse(fs.readFileSync(path.join(here, 'limits.json'), 'utf8'));
export const BASE = process.env.LITELLM_BASE || 'http://127.0.0.1:4000/v1';
const KEY = () => process.env.LITELLM_MASTER_KEY || '';
export const est = (t) => Math.ceil(String(t ?? '').length / 3.4);
export const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
export const contextoDe = (m) => limits.modelos[m]?.contexto ?? 32768;

// ---------- cola: semáforo por proveedor, con carpetas (sirve entre procesos) ----------
const LOCKDIR = path.join(os.tmpdir(), 'gw-locks'); fs.mkdirSync(LOCKDIR, { recursive: true });
export async function acquire(m, onEspera = () => {}) {
  const info = limits.modelos[m] || { proveedor: 'otro', costo: 1 };
  const cap = Math.max(1, Math.floor((limits.proveedores[info.proveedor]?.unidades ?? 1) / info.costo));
  for (let waited = 0; ; waited += 1) {
    for (let s = 0; s < cap; s++) {
      const f = path.join(LOCKDIR, `${info.proveedor}.${info.costo}.${s}`);
      try { fs.mkdirSync(f); return () => { try { fs.rmdirSync(f); } catch {} }; }
      catch { try { if (Date.now() - fs.statSync(f).mtimeMs > 15 * 60 * 1000) fs.rmdirSync(f); } catch {} } // candado viejo
    }
    if (waited % 10 === 0) onEspera(cap);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

// onAvance({ caracteres, razonando }) se llama cada ~20 s mientras el modelo trabaja.
export async function chat(m, system, user, maxOut, { onAvance = () => {}, onEspera = () => {} } = {}) {
  const release = await acquire(m, onEspera);
  try {
    for (let intento = 1; intento <= 4; intento++) {
      const t0 = Date.now();
      const r = await fetch(`${BASE}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY()}` },
        body: JSON.stringify({ model: m, max_tokens: maxOut, stream: true, stream_options: { include_usage: true }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
      });
      if (r.status === 429 || r.status >= 500) { await r.text().catch(() => {}); log(`  ${m}: HTTP ${r.status}, reintento ${intento}`); await new Promise((x) => setTimeout(x, 4000 * intento)); continue; }
      if (!r.ok) throw new Error(`${m}: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
      // En vivo (SSE): evita el límite de espera de la primera respuesta mientras el modelo «piensa».
      let content = '', thinking = 0, usage = {}, finish = '', buf = '', ultimo = Date.now();
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
            if (d.reasoning_content || d.reasoning) thinking += 1;
            if (j.choices?.[0]?.finish_reason) finish = j.choices[0].finish_reason;
            if (j.usage) usage = j.usage;
          } catch {}
        }
        if (Date.now() - ultimo > 20000) { ultimo = Date.now(); try { await onAvance({ caracteres: content.length, razonando: thinking }); } catch {} }
      }
      if (!content.trim()) throw new Error(`${m} devolvió vacío (finish=${finish}). Sube la salida máxima o usa otro modelo.`);
      return { content, usage, seg: Math.round((Date.now() - t0) / 1000) };
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
    const r = await chat(prepModel, 'Condensas texto sin inventar nada. Conservas reglas, cifras, nombres y condiciones. Español.', `Condensa a un máximo de ${each} tokens, conservando lo operativo:\n\n${c}`, each + 300, opts);
    out.push(r.content);
  }
  return out.join('\n\n');
}
