#!/usr/bin/env node
// Ejecutor basico de workflows de Inherent (PLAN-GATEWAY seccion 13).
// El LLM escribe el contenido de cada paso; el flujo lo lleva este codigo.
// Uso: node runner.mjs <workflow.json> --root <carpeta> [--var k=v ...] [--dry] [--only paso]
import fs from 'node:fs';
import path from 'node:path';
import { limits, est, log, chat as chatMotor, condense as condenseMotor } from './motor.mjs';

const args = process.argv.slice(2);
const wfPath = args.find(a => !a.startsWith('--') && !a.includes('='));
const flag = n => args.includes('--' + n);
const val = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
const vars = {};
args.forEach((a, i) => { if (args[i - 1] === '--var') { const [k, ...v] = a.split('='); vars[k] = v.join('='); } });
if (!wfPath) { console.error('Falta el workflow.json'); process.exit(2); }

const ROOT = path.resolve(val('root') || '.');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
const U = wf.umbral || {};
const MAX_IN = U.max_input_tokens ?? 20000;
const MAX_OUT = U.max_output_tokens ?? 6000;
const sub = s => String(s).replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
const model = ref => (wf.modelos && wf.modelos[ref]) || ref;
const enCola = (m) => (cap) => log(`  en cola (${m}, capacidad ${cap})...`);
const chat = (m, system, user, maxOut) => chatMotor(m, system, user, maxOut, { onEspera: enCola(m), onAvance: ({ caracteres, razonando }) => log(`  ${m}: pensando/escribiendo... (${caracteres} caracteres, ${razonando} fragmentos de razonamiento)`) });
const condense = (text, target, prepModel) => condenseMotor(text, target, prepModel, { onEspera: enCola(prepModel) });

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
