#!/usr/bin/env node
// El trabajador del Gateway (PLAN-GATEWAY F2 · D13). Corre en el VPS como servicio y NO recibe llamadas: sale hacia la
// base del OS (Neon), toma las etapas que el OS dejó «en cola», las corre con el motor (umbral, condensado, cola por
// proveedor) y escribe el avance y el resultado en el mismo trabajo. La pantalla del OS solo lee la base.
//
//   · Latido: cada 20 s deja en `gateway_estado/vps` que está en línea y qué modelos ofrece (los de LiteLLM con límites
//     conocidos en limits.json). El OS solo deja encolar si el latido tiene menos de 90 s.
//   · Tomar: cambia la etapa de «en_cola» a «trabajando» con la versión del documento (si alguien lo cambió, no la toma).
//   · Avance: escribe actividades mientras trabaja (en cola, condensando, escribiendo N caracteres).
//   · Resultado: aplicarResultado (las mismas reglas que la ruta del OS) y la etapa queda «Esperando aprobación».
//   · Falla: la etapa vuelve a como estaba, con el error a la vista. Al arrancar, retoma las que quedaron colgadas.
//   · Nunca aprueba, nunca publica, nunca toca otra etapa que la que tomó.
//
// Uso: DATABASE_URL=… LITELLM_MASTER_KEY=… node gateway/worker.mjs
import * as db from '../api/_lib/db.js';
import { activa, pedido as pedidoOS, leerRespuesta, aplicarResultado, soloEvidenciaDeInputs } from '../public/js/agentes-flujos.js';
// El servidor no le da herramientas al modelo: la evidencia se limita a los inputs. Si la etapa pide web, el servidor busca
// y lee antes (web.mjs) y las páginas entran como inputs citables (w1, w2…).
const pedido = (run, n) => pedidoOS(run, n, { sinHerramientas: true, conWeb: (run.inputs || []).some((x) => /^w\d+$/.test(x.id)) });
import { investigar } from './web.mjs';
const MODELO_BUSQUEDAS = process.env.GW_QUERY_MODEL || 'deepseek-v4-flash';
import { limits, BASE, est, log, chat, condense, contextoDe } from './motor.mjs';

const RUNS = 'agent_runs', GW = 'gateway_estado', YO = 'gateway';
const VERSION = 'f3-1';
const PREP = process.env.GW_PREP_MODEL || 'nv-minimax-m3.1-flash';
const MAX_IN = Number(process.env.GW_MAX_IN || 20000), MAX_OUT = Number(process.env.GW_MAX_OUT || 6000);
const PARALELO = Number(process.env.GW_PARALELO || 3);
const COLGADA_MIN = 25; // una etapa «trabajando» sin avance en este tiempo se vuelve a encolar
const ahora = () => new Date().toISOString();
const SISTEMA = 'Eres un agente de Inherent. Escribes en español. No inventas datos: lo que no tenga fuente se marca como hipótesis. Respondes exactamente en el formato que se pide.';

let modelos = [];
const enCurso = new Set();

// ---------- Escribir en un trabajo sin pisar a nadie: relee, aplica, guarda con su versión (hasta 5 intentos) ----------
async function tocar(id, fn) {
  for (let i = 0; i < 5; i++) {
    const r = await db.get(RUNS, id); if (!r) return null;
    const cambio = fn(r); if (!cambio) return null;
    const { id: _i, v, _meta, ...data } = r;
    const d = await db.update(RUNS, id, { ...data, ...cambio, historial: [...(data.historial || []), ...(cambio._nota ? [{ at: ahora(), quien: YO, ...cambio._nota }] : [])].slice(-500), _nota: undefined }, v, YO);
    if (d) return d;
    await new Promise((x) => setTimeout(x, 300 + i * 400));
  }
  throw new Error('No pude guardar en el trabajo (cambió muchas veces seguidas)');
}
const conEtapa = (r, n, f) => r.etapas.map((x, i) => (i === n ? f(x) : x));
async function actividad(id, n, a) {
  // Si la última actividad dice lo mismo (p. ej. «Redactando el resultado»), se actualiza su detalle en vez de repetirla.
  await tocar(id, (r) => (r.etapas[n]?.estado !== 'trabajando' ? null : { etapas: conEtapa(r, n, (x) => {
    const xs = [...(x.actividades || [])], ult = xs.at(-1), nueva = { ...a, at: ahora() };
    if (ult && ult.titulo === a.titulo && !a.aviso) xs[xs.length - 1] = { ...ult, detalle: a.detalle, at: nueva.at }; else xs.push(nueva);
    return { ...x, actividades: xs.slice(-150), gw: { ...(x.gw || {}), visto: ahora() } };
  }) }));
}

// ---------- Latido ----------
async function latido() {
  try {
    const r = await fetch(`${BASE}/models`, { headers: { Authorization: `Bearer ${process.env.LITELLM_MASTER_KEY || ''}` }, signal: AbortSignal.timeout(10000) });
    const ids = r.ok ? ((await r.json()).data || []).map((m) => m.id) : [];
    modelos = ids.filter((m) => limits.modelos[m]); // solo los que tienen límites conocidos (contexto y costo)
  } catch (e) { log('latido: LiteLLM no respondió', e.message); modelos = []; }
  await db.upsert(GW, 'vps', { at: ahora(), modelos, trabajando: enCurso.size, version: VERSION }, YO);
}

// ---------- Armar el pedido dentro del umbral ----------
// Si no cabe, condensa (con el modelo gratis) lo más largo: resultados aprobados de etapas previas y textos de los inputs.
async function pedidoQueCabe(run, n, modelo, onPaso) {
  const cap = Math.min(MAX_IN, contextoDe(modelo) - MAX_OUT - 1500);
  let r = structuredClone(run), texto = pedido(r, n);
  if (est(texto) + est(SISTEMA) <= cap) return texto;
  const piezas = [
    ...r.etapas.slice(0, n).map((x, i) => ({ get: () => r.etapas[i].salida || '', set: (t) => { r.etapas[i].salida = t; } })),
    ...(r.inputs || []).map((x, i) => ({ get: () => r.inputs[i].texto || '', set: (t) => { r.inputs[i].texto = t; } })),
  ].sort((a, b) => b.get().length - a.get().length);
  await onPaso({ titulo: 'Preparando el contexto', detalle: `El pedido mide ~${est(texto).toLocaleString('es-MX')} tokens y el tope es ${cap.toLocaleString('es-MX')}: condensando lo más largo con ${PREP}` });
  for (const p of piezas) {
    if (est(texto) + est(SISTEMA) <= cap) break;
    const largo = est(p.get()); if (largo < 800) continue;
    p.set(await condense(p.get(), Math.max(600, Math.floor(largo * 0.35)), PREP));
    texto = pedido(r, n);
  }
  if (est(texto) + est(SISTEMA) > cap) throw new Error(`El pedido sigue sin caber (~${est(texto)} tokens, tope ${cap}). Quita inputs largos o parte la etapa.`);
  return texto;
}

// ---------- Investigación web (F3): si la etapa pide «Búsqueda web», el servidor busca y lee antes de escribir ----------
async function conWeb(run, n, paso) {
  const e = run.etapas[n];
  if (!(e.herramientas || []).includes('web')) return run;
  const contexto = (run.inputs || []).filter((x) => !x.archivado).map((x) => `${x.titulo}: ${String(x.texto || x.url || '').slice(0, 500)}`).join('\n').slice(0, 1800);
  const tema = [`Etapa: ${e.nombre}`, e.proposito, run.objetivo ? `Objetivo: ${run.objetivo}` : '', run.cliente_nombre || run.cliente ? `Cliente: ${run.cliente_nombre || run.cliente}` : '', contexto ? `Lo que se sabe:\n${contexto}` : ''].filter(Boolean).join('\n');
  const pedirBusquedas = async (t) => {
    const r = await chat(MODELO_BUSQUEDAS, 'Escribes búsquedas web concretas en español. Respondes solo un arreglo JSON de textos.', `Escribe 3 búsquedas web (máximo 10 palabras cada una) para encontrar fuentes públicas y verificables que sirvan a esta etapa. Usa nombres propios, lugar y rubro si los hay.\n\n${t}\n\nResponde solo: ["…","…","…"]`, 300);
    const m = r.content.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]).map((x) => String(x).slice(0, 140)) : [];
  };
  const { fuentes } = await investigar({ tema, pedirBusquedas, maxFuentes: Math.min(8, Math.max(4, (e.fuentes_min || 0) + 2)), onPaso: paso });
  if (!fuentes.length) { await paso({ titulo: 'Sin fuentes web', detalle: 'No se pudo leer ninguna página: la etapa sigue solo con los inputs', aviso: true }); return run; }
  if (fuentes.length < (e.fuentes_min || 0)) await paso({ titulo: 'Menos fuentes de las pedidas', detalle: `${fuentes.length} de ${e.fuentes_min}`, aviso: true });
  const r = structuredClone(run);
  r.inputs = [...(run.inputs || []), ...fuentes.map((f) => ({ id: f.id, tipo: 'link', titulo: f.titulo, url: f.url, texto: f.texto, interna: false }))];
  return r;
}

// ---------- Correr una etapa ----------
async function correr(id, n) {
  const run = await db.get(RUNS, id), e = run.etapas[n], modelo = e.modelo || e.cola?.modelo;
  const paso = (a) => actividad(id, n, a);
  log(`[${id}] etapa ${n + 1} «${e.nombre}» con ${modelo}`);
  try {
    if (!modelos.includes(modelo)) throw new Error(`El modelo ${modelo} no está disponible en el servidor`);
    await paso({ titulo: 'Tomada por el servidor', detalle: `${modelo} · contexto ${contextoDe(modelo).toLocaleString('es-MX')} tokens` });
    const base = await conWeb(run, n, paso);
    const texto = await pedidoQueCabe(base, n, modelo, paso);
    await paso({ titulo: 'Trabajando la etapa', detalle: `~${est(texto).toLocaleString('es-MX')} tokens de entrada` });
    const out = await chat(modelo, SISTEMA, texto, MAX_OUT, {
      onEspera: (cap) => paso({ titulo: 'Esperando turno del proveedor', detalle: `${limits.modelos[modelo]?.proveedor || 'proveedor'}: ${cap} a la vez con este modelo` }),
      onAvance: ({ caracteres, razonando }) => paso({ titulo: caracteres ? 'Redactando el resultado' : 'Pensando', detalle: caracteres ? `${caracteres.toLocaleString('es-MX')} caracteres` : `${razonando} fragmentos de razonamiento` }),
    });
    const r = soloEvidenciaDeInputs(base, leerRespuesta(out.content));
    const b = { ...r, via: 'gateway', modelo, costo: { entrada: out.usage.prompt_tokens || 0, salida: out.usage.completion_tokens || 0, seg: out.seg },
      actividades: [...r.actividades, ...r.faltantes.map((f) => ({ titulo: 'Falta evidencia', detalle: f, aviso: true })), { titulo: 'Listo para revisar', detalle: `${out.seg}s · ${out.usage.prompt_tokens ?? '?'} de entrada · ${out.usage.completion_tokens ?? '?'} de salida` }] };
    await tocar(id, (cur) => {
      if (cur.etapas[n]?.estado !== 'trabajando') return null; // la cancelaron o la movieron: no se pisa
      const res = aplicarResultado(cur, n, b);
      return { etapas: res.etapas, evidencia: res.evidencia, _nota: { accion: 'ejecutar', etapa: n, nota: `gateway · ${modelo}` } };
    });
    log(`[${id}] etapa ${n + 1} lista en ${out.seg}s`);
  } catch (err) {
    log(`[${id}] etapa ${n + 1} falló: ${err.message}`);
    await tocar(id, (cur) => (cur.etapas[n]?.estado !== 'trabajando' ? null : {
      etapas: conEtapa(cur, n, (x) => ({ ...x, estado: x.cola?.antes === 'ajuste' ? 'ajuste' : 'pendiente', via: '', actividades: [...(x.actividades || []), { titulo: 'Falló en el servidor', detalle: String(err.message).slice(0, 380), aviso: true, at: ahora() }].slice(-150) })),
      _nota: { accion: 'fallo', etapa: n, nota: String(err.message).slice(0, 200) },
    })).catch(() => {});
  }
}

// ---------- Tomar trabajo ----------
async function tomar() {
  if (enCurso.size >= PARALELO) return;
  const runs = await db.list(RUNS);
  for (const r of runs) {
    if (enCurso.size >= PARALELO) return;
    if (r.archivado || r.pausado || enCurso.has(r.id)) continue;
    const n = activa(r), e = r.etapas?.[n];
    const colgada = e?.estado === 'trabajando' && e?.via === 'gateway' && Date.now() - Date.parse(e.gw?.visto || e.cola?.at || 0) > COLGADA_MIN * 60 * 1000;
    if (e?.estado !== 'en_cola' && !colgada) continue;
    const tomado = await tocar(r.id, (cur) => {
      const x = cur.etapas[n];
      if (!x || (x.estado !== 'en_cola' && !colgada)) return null;
      return { etapas: conEtapa(cur, n, (y) => ({ ...y, estado: 'trabajando', via: 'gateway', gw: { at: ahora(), visto: ahora(), version: VERSION } })), _nota: { accion: 'tomar', etapa: n, nota: colgada ? 'retomada' : '' } };
    }).catch(() => null);
    if (!tomado) continue;
    enCurso.add(r.id);
    correr(r.id, n).finally(() => enCurso.delete(r.id));
  }
}

// ---------- Ciclo ----------
let ultimoLatido = 0, apagando = false;
async function ciclo() {
  while (!apagando) {
    try {
      if (Date.now() - ultimoLatido > 20000) { await latido(); ultimoLatido = Date.now(); }
      await tomar();
    } catch (e) { log('ciclo:', e.message); }
    await new Promise((r) => setTimeout(r, 3000));
  }
}
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { apagando = true; log(`apagando (${enCurso.size} en curso)`); setTimeout(() => process.exit(0), enCurso.size ? 5000 : 0); });
log(`Gateway ${VERSION} · LiteLLM ${BASE} · hasta ${PARALELO} etapas a la vez`);
ciclo();
