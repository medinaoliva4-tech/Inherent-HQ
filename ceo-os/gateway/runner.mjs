#!/usr/bin/env node
// Ejecutor basico de workflows de Inherent (PLAN-GATEWAY seccion 13).
// El LLM escribe el contenido de cada paso; el flujo lo lleva este codigo.
// Uso: node runner.mjs <workflow.json> --root <carpeta> [--var k=v ...] [--dry] [--only paso]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const wfPath = args.find(a => !a.startsWith('--') && !a.includes('='));
const flag = n => args.includes('--' + n);
const val = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
const vars = {};
args.forEach((a, i) => { if (args[i - 1] === '--var') { const [k, ...v] = a.split('='); vars[k] = v.join('='); } });
if (!wfPath) { console.error('Falta el workflow.json'); process.exit(2); }

const ROOT = path.resolve(val('root') || '.');
const BASE = process.env.LITELLM_BASE || 'http://127.0.0.1:4000/v1';
const KEY = process.env.LITELLM_MASTER_KEY || '';
const here = path.dirname(new URL(import.meta.url).pathname);
const limits = JSON.parse(fs.readFileSync(path.join(here, 'limits.json'), 'utf8'));
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
const U = wf.umbral || {};
const MAX_IN = U.max_input_tokens ?? 20000;
const MAX_OUT = U.max_output_tokens ?? 6000;
const sub = s => String(s).replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
const est = t => Math.ceil(String(t).length / 3.4); // espanol: ~3.4 caracteres por token
const model = ref => (wf.modelos && wf.modelos[ref]) || ref;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---------- cola: semaforo por proveedor, con archivos ----------
const LOCKDIR = path.join(os.tmpdir(), 'gw-locks'); fs.mkdirSync(LOCKDIR, { recursive: true });
async function acquire(m) {
  const info = limits.modelos[m] || { proveedor: 'otro', costo: 1 };
  const cap = Math.max(1, Math.floor((limits.proveedores[info.proveedor]?.unidades ?? 1) / info.costo));
  for (let waited = 0; ; waited += 1) {
    for (let s = 0; s < cap; s++) {
      const f = path.join(LOCKDIR, `${info.proveedor}.${info.costo}.${s}`);
      try {
        fs.mkdirSync(f);
        return () => { try { fs.rmdirSync(f); } catch {} };
      } catch {
        try { if (Date.now() - fs.statSync(f).mtimeMs > 15 * 60 * 1000) fs.rmdirSync(f); } catch {} // candado viejo
      }
    }
    if (waited % 10 === 0) log(`  en cola (${m}, capacidad ${cap})...`);
    await new Promise(r => setTimeout(r, 1500));
  }
}

async function chat(m, system, user, maxOut) {
  const release = await acquire(m);
  try {
    for (let intento = 1; intento <= 4; intento++) {
      const t0 = Date.now();
      const r = await fetch(`${BASE}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model: m, max_tokens: maxOut, stream: true, stream_options: { include_usage: true }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
      });
      if (r.status === 429 || r.status >= 500) { await r.text().catch(() => {}); log(`  ${m}: HTTP ${r.status}, reintento ${intento}`); await new Promise(x => setTimeout(x, 4000 * intento)); continue; }
      if (!r.ok) throw new Error(`${m}: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
      // lectura en vivo (SSE): evita el limite de espera de la primera respuesta mientras el modelo "piensa"
      let content = '', thinking = 0, usage = {}, finish = '', buf = '', lastLog = Date.now();
      const dec = new TextDecoder();
      for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
          if (!line.startsWith('data:') || line.includes('[DONE]')) continue;
          try {
            const j = JSON.parse(line.slice(5));
            const d = j.choices?.[0]?.delta || {};
            if (d.content) content += d.content;
            if (d.reasoning_content || d.reasoning) thinking += 1;
            if (j.choices?.[0]?.finish_reason) finish = j.choices[0].finish_reason;
            if (j.usage) usage = j.usage;
          } catch {}
        }
        if (Date.now() - lastLog > 30000) { log(`  ${m}: pensando/escribiendo... (${content.length} caracteres, ${thinking} fragmentos de razonamiento)`); lastLog = Date.now(); }
      }
      if (!content.trim()) throw new Error(`${m} devolvio vacio (finish=${finish}). Sube max_output_tokens.`);
      return { content, usage, seg: Math.round((Date.now() - t0) / 1000) };
    }
    throw new Error(`${m}: sin respuesta tras reintentos`);
  } finally { release(); }
}

// ---------- entradas ----------
function readInput(inp) {
  const f = path.join(ROOT, sub(inp.file));
  if (!fs.existsSync(f) && flag('dry')) return `### (salida de un paso previo, estimada)\n${'x'.repeat(Math.round(3.4 * (inp.estimado ?? 3000)))}`;
  if (!fs.existsSync(f)) { if (inp.opcional) return ''; throw new Error(`No existe la entrada: ${sub(inp.file)}`); }
  let t = fs.readFileSync(f, 'utf8');
  if (inp.secciones) { // se queda con los encabezados "## <prefijo>" pedidos
    const parts = t.split(/\n(?=## )/); const keep = parts.filter(p => inp.secciones.some(s => p.startsWith('## ' + s)));
    t = keep.join('\n');
  }
  return `### ARCHIVO: ${sub(inp.file)}\n${t}`;
}

async function condense(text, target, prepModel) {
  const piece = 6000 * 3.4, chunks = [];
  for (let i = 0; i < text.length; i += piece) chunks.push(text.slice(i, i + piece));
  const each = Math.max(300, Math.floor(target / chunks.length));
  const out = [];
  for (const [i, c] of chunks.entries()) {
    log(`  condensando bloque ${i + 1}/${chunks.length} -> ~${each} tokens`);
    const r = await chat(prepModel, 'Condensas texto sin inventar nada. Conservas reglas, cifras, nombres y condiciones. Espanol.', `Condensa a un maximo de ${each} tokens, conservando lo operativo:\n\n${c}`, each + 300);
    out.push(r.content);
  }
  return out.join('\n\n');
}

// ---------- ejecucion ----------
const runLog = path.join(ROOT, 'runs'); fs.mkdirSync(runLog, { recursive: true });
const runFile = path.join(runLog, `${wf.id}-${Date.now()}.jsonl`);
const record = o => fs.appendFileSync(runFile, JSON.stringify(o) + '\n');

const done = new Set();
const steps = wf.steps.filter(s => !val('only') || s.id === val('only'));
let totalTok = 0;
for (const s of steps) {
  const m = model(s.modelo);
  if (flag('reanudar') && s.tipo !== 'gate' && fs.existsSync(path.join(ROOT, sub(s.salida)))) { log(`[${s.id}] ya existe ${sub(s.salida)}, se omite (--reanudar)`); continue; }
  const system = sub(s.system || wf.system || 'Eres un agente de Inherent. Espanol. No inventes datos: marca "por validar" lo que falte.');
  let inputs = (s.inputs || []).map(readInput);
  const instr = sub(s.instruccion);
  let size = est(system) + est(instr) + inputs.reduce((a, b) => a + est(b), 0);
  const ctx = limits.modelos[m]?.contexto ?? 32768;
  const cap = Math.min(MAX_IN, ctx - (s.max_output_tokens ?? MAX_OUT) - 1500);
  log(`[${s.id}] modelo=${m}  entrada~${size} tokens  tope=${cap}  ${size > cap ? 'EXCEDE -> condensar' : 'ok'}`);
  if (flag('dry')) { record({ paso: s.id, modelo: m, entrada_est: size, tope: cap }); continue; }
  if (s.gate && !flag('aprobar-' + s.id)) { log(`  GATE: ${s.gate}. Se detiene aqui hasta aprobar (--aprobar-${s.id}).`); record({ paso: s.id, gate: s.gate }); break; }

  if (size > cap) {
    const prep = model(wf.modelos?.prep || 'prep');
    const over = inputs.map((t, i) => [est(t), i]).sort((a, b) => b[0] - a[0]);
    for (const [tok, i] of over) {
      if (size <= cap) break;
      const target = Math.max(800, Math.floor(tok * 0.35));
      inputs[i] = await condense(inputs[i], target, prep);
      size = est(system) + est(instr) + inputs.reduce((a, b) => a + est(b), 0);
    }
    if (size > cap) throw new Error(`[${s.id}] sigue excediendo el umbral (${size} > ${cap}). Parte el paso en dos.`);
  }
  const prompt = `${inputs.join('\n\n')}\n\n---\nTAREA:\n${instr}`;
  const r = await chat(m, system, prompt, s.max_output_tokens ?? MAX_OUT);
  const out = path.join(ROOT, sub(s.salida));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, r.content.trim() + '\n');
  totalTok += (r.usage.total_tokens || 0);
  record({ paso: s.id, modelo: m, entrada_est: size, usage: r.usage, seg: r.seg, salida: sub(s.salida) });
  log(`  listo en ${r.seg}s  (${r.usage.prompt_tokens ?? '?'} in / ${r.usage.completion_tokens ?? '?'} out)  -> ${sub(s.salida)}`);
}
log(`fin. tokens totales: ${totalTok}. registro: ${path.relative(ROOT, runFile)}`);
