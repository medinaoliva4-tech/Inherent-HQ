// Las IAs del Chat: qué proveedores de Hermes corren en la compu (el modo privado) y el switch de IA de la caja.
// Puro: sin DOM ni red (lo prueba scripts/test-llm.mjs). hermes.js los reexporta.

// Los proveedores que corren en la compu (el modo privado): lo que se habla no sale de ella. Ollama Cloud no cuenta.
export const LOCALES = ['ollama', 'lmstudio', 'llamacpp', 'llama-cpp', 'vllm', 'local'];
export const esLocal = (slug) => LOCALES.includes(String(slug || ''));

// Las pasarelas: una suscripción o una llave que da modelos de varias empresas (Kilo Pass, OpenRouter, Nous Portal,
// Vercel AI Gateway). Ahí la IA no sale del proveedor sino del modelo: «anthropic/claude-…» es Claude.
export const PASARELAS = ['kilocode', 'openrouter', 'nous', 'ai-gateway'];
const EMPRESAS = { anthropic: 'claude', openai: 'chatgpt', google: 'gemini' };

// Las IAs del switch del Chat (qué inteligencia o empresa responde; el modelo se elige aparte, dentro de cada una):
// las frontier (Claude, ChatGPT y Gemini), que llegan con Kilo Pass o con su propia suscripción, y «En tu compu», los
// modelos abiertos y gratis que corren en la compu (el modo privado). «Otras» junta lo demás (Grok, Copilot…).
// [id, nombre, ícono de iconos.js, proveedores de Hermes].
export const IAS = [
  ['claude', 'Claude', 'ia-claude', ['anthropic']],
  ['chatgpt', 'ChatGPT', 'ia-openai', ['openai-codex', 'openai']],
  ['gemini', 'Gemini', 'ia-gemini', ['gemini', 'google']],
  ['local', 'En tu compu', 'lock', LOCALES],
  ['otras', 'Otras', 'sparkles', null],
];
const OTRAS = IAS.find(([id]) => id === 'otras');
// La IA de un modelo. Con una pasarela, la dice la empresa del modelo (lo de antes de la «/»).
export function iaDe(slug, model = '') {
  const s = String(slug || '');
  if (PASARELAS.includes(s)) return EMPRESAS[String(model || '').split('/')[0].toLowerCase()] || 'otras';
  return (IAS.find(([, , , ps]) => ps && ps.includes(s)) || OTRAS)[0];
}
// Los modelos listos de esta compu de una IA, como { provider, model } (sin IA: todos los que no son locales).
export const modelosDeIa = (modelos, id) => (modelos?.proveedores || []).filter((p) => p.listo && p.modelos.length)
  .flatMap((p) => p.modelos.filter((m) => (id ? iaDe(p.slug, m) === id : !esLocal(p.slug))).map((m) => ({ provider: p.slug, model: m })));
// Las IAs que esta compu tiene listas (con al menos un modelo). «En tu compu» siempre va: es el modo privado.
export const iasListas = (modelos) => IAS.filter(([id]) => id === 'local' || modelosDeIa(modelos, id).length);

// En qué área rinde mejor cada familia de modelos, según los rankings públicos de octubre de 2026: Design Arena y WebDev
// Arena para Diseño, Text Arena para Estrategia y los de razonamiento (Humanity's Last Exam, GPQA) para Consulting.
// Marketing no se marca: no hay un ranking confiable de copy. Se actualiza cuando cambian los rankings.
export const FUERTES = [
  [/claude-opus-5[.-]5/, ['estrategia', 'diseno']],
  [/claude-sonnet-5[.-]5/, ['diseno']],
  [/gemini-4/, ['estrategia']],
  [/gpt-6/, ['diseno']],
  [/kimi-k3/, ['diseno', 'consulting']],
  [/muse-(spark|wonder)/, ['diseno']],
];
export const fuertesDe = (model) => {
  const m = String(model || '').toLowerCase();
  return [...new Set(FUERTES.filter(([re]) => re.test(m)).flatMap(([, as]) => as))];
};
