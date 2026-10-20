#!/usr/bin/env node
// Decisiones y texto barato para las skills de contenido, sin gastar créditos de Claude.
//   1. Laya (el puente local, 127.0.0.1:7357)  → decide: elegir plantilla, elegir variante.
//   2. El modelo local (Ollama, 127.0.0.1:11434) → escribe lo que falta: caption, alt text, títulos cortos.
// Si el motor no responde, sale con código 10 y {"ok":false,"motivo":…}: la skill decide con Claude
// (el modelo más barato disponible) y lo anota. Sale por stdout un solo JSON.
//
//   node ia.mjs estado
//   node ia.mjs elegir --texto-archivo pieza.txt --opciones-archivo opciones.json --pregunta "¿Cuál encaja mejor?"
//   node ia.mjs juzgar --texto-archivo pieza.txt --preguntas-archivo q.json   (sí/no, escalas y opciones: {id:{type:"noul"|"score"|"choice", instructions, criteria?}})
//   node ia.mjs local  --prompt-archivo prompt.txt [--sistema "…"] [--modelo gemma3:4b] [--max-tokens 200] [--temperatura 0.4]
import fs from 'node:fs';

const LAYA = process.env.LAYA_PUENTE_URL || 'http://127.0.0.1:7357';
const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const MODELO_LOCAL = process.env.LAYA_MODELO_LOCAL || 'gemma3:4b';
const SALIDA_SIN_MOTOR = 10;

const salir = (obj, code = 0) => { console.log(JSON.stringify(obj, null, 2)); process.exit(code); };
const sinMotor = (motor, motivo) => salir({ ok: false, motor, motivo, siguiente: 'decide con Claude (el modelo más barato disponible) y anota engine: claude' }, SALIDA_SIN_MOTOR);

function leerArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { o._.push(a); continue; }
    const [k, v] = a.slice(2).split(/=(.*)/s);
    o[k] = v !== undefined ? v : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true);
  }
  return o;
}

async function http(url, opts = {}, ms = 5000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal }); } finally { clearTimeout(t); }
}
const leer = (f, que) => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return salir({ ok: false, motivo: `No pude leer ${que} (${f}): ${e.message}` }, 1); } };

async function estadoLaya() {
  try { const r = await http(LAYA + '/health', {}, 2000); const j = await r.json(); return { on: j.status === 'ok', listo: Boolean(j.listo), modelo: j.modelo_cargado || null }; }
  catch { return { on: false, listo: false }; }
}
async function estadoOllama() {
  try { const r = await http(OLLAMA + '/api/tags', {}, 2000); const j = await r.json(); return { on: true, modelos: (j.models || []).map((m) => m.name), modelo_elegido: MODELO_LOCAL, tiene_modelo: (j.models || []).some((m) => m.name === MODELO_LOCAL) }; }
  catch { return { on: false, modelos: [] }; }
}

async function elegir(a) {
  if (!a['texto-archivo'] || !a['opciones-archivo']) return salir({ ok: false, motivo: 'Uso: elegir --texto-archivo t.txt --opciones-archivo o.json --pregunta "…"' }, 1);
  const texto = leer(a['texto-archivo'], 'el texto').slice(0, 19000);
  let opciones; try { opciones = JSON.parse(leer(a['opciones-archivo'], 'las opciones')); } catch (e) { return salir({ ok: false, motivo: 'opciones.json no es JSON: ' + e.message }, 1); }
  if (Array.isArray(opciones)) opciones = Object.fromEntries(opciones.map((o) => [o.id, o.descripcion || o.id]));
  if (Object.keys(opciones).length < 2) return salir({ ok: false, motivo: 'Hacen falta al menos 2 opciones' }, 1);
  const st = await estadoLaya();
  if (!st.on) return sinMotor('laya', 'El puente de Laya no responde en ' + LAYA);
  const questions = { eleccion: { type: 'choice', instructions: a.pregunta || '¿Cuál opción encaja mejor?', criteria: opciones } };
  let r, j;
  try {
    r = await http(LAYA + '/juzgar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto, questions }) }, 180000);
    j = await r.json();
  } catch (e) { return sinMotor('laya', 'Laya no contestó: ' + e.message); }
  if (!r.ok) return sinMotor('laya', `Laya respondió ${r.status}: ${j.error || ''}`);
  const x = j.answers?.eleccion;
  if (!x || !x.choice || !(x.choice in opciones)) return sinMotor('laya', 'Laya contestó algo que no es una de las opciones');
  salir({ ok: true, engine: 'laya-local', eleccion: x.choice, confianza: x.answer_confidence ?? x.confidence ?? null, probabilidades: x.probabilities || null, ms: j.ms ?? null });
}

async function juzgar(a) {
  if (!a['texto-archivo'] || !a['preguntas-archivo']) return salir({ ok: false, motivo: 'Uso: juzgar --texto-archivo t.txt --preguntas-archivo q.json' }, 1);
  const texto = leer(a['texto-archivo'], 'el texto').slice(0, 19000);
  let questions; try { questions = JSON.parse(leer(a['preguntas-archivo'], 'las preguntas')); } catch (e) { return salir({ ok: false, motivo: 'q.json no es JSON: ' + e.message }, 1); }
  const st = await estadoLaya();
  if (!st.on) return sinMotor('laya', 'El puente de Laya no responde en ' + LAYA);
  let r, j;
  try { r = await http(LAYA + '/juzgar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto, questions }) }, 180000); j = await r.json(); }
  catch (e) { return sinMotor('laya', 'Laya no contestó: ' + e.message); }
  if (!r.ok) return sinMotor('laya', `Laya respondió ${r.status}: ${j.error || ''}`);
  const respuestas = {};
  for (const [id, x] of Object.entries(j.answers || {})) {
    respuestas[id] = x.type === 'noul' ? { respuesta: x.noul >= 0.5 ? 'sí' : 'no', prob_si: x.noul } : x.type === 'score' ? { puntaje: x.score, escala: x.legend || null } : { eleccion: x.choice, probabilidades: x.probabilities || null };
  }
  salir({ ok: true, engine: 'laya-local', respuestas, ms: j.ms ?? null });
}

async function local(a) {
  if (!a['prompt-archivo']) return salir({ ok: false, motivo: 'Uso: local --prompt-archivo p.txt' }, 1);
  const prompt = leer(a['prompt-archivo'], 'el prompt');
  const st = await estadoOllama();
  if (!st.on) return sinMotor('ollama', 'El modelo local no responde en ' + OLLAMA);
  const modelo = a.modelo || MODELO_LOCAL;
  if (!st.modelos.includes(modelo)) return sinMotor('ollama', `El modelo ${modelo} no está bajado (hay: ${st.modelos.join(', ') || 'ninguno'})`);
  const body = { model: modelo, prompt, stream: false, think: false, options: { num_predict: +(a['max-tokens'] || 300), temperature: +(a.temperatura ?? 0.4) } };
  if (a.sistema) body.system = a.sistema;
  let r, j;
  try { r = await http(OLLAMA + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 300000); j = await r.json(); }
  catch (e) { return sinMotor('ollama', 'El modelo local no contestó: ' + e.message); }
  if (!r.ok || typeof j.response !== 'string') return sinMotor('ollama', `Ollama respondió ${r.status}: ${j.error || 'sin texto'}`);
  salir({ ok: true, engine: 'modelo-local', modelo, texto: j.response.trim(), ms: Math.round((j.total_duration || 0) / 1e6) });
}

const a = leerArgs(process.argv.slice(2));
const orden = a._[0];
if (orden === 'estado') salir({ ok: true, laya: await estadoLaya(), ollama: await estadoOllama() });
else if (orden === 'elegir') await elegir(a);
else if (orden === 'juzgar') await juzgar(a);
else if (orden === 'local') await local(a);
else salir({ ok: false, motivo: 'Uso: node ia.mjs estado | elegir | juzgar | local   (mira el encabezado de este archivo)' }, 1);
