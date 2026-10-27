// Las IAs del Chat: qué proveedores de Hermes corren en la compu (el modo privado) y el switch de IA de la caja.
// Puro: sin DOM ni red (lo prueba scripts/test-llm.mjs). hermes.js los reexporta.

// Los proveedores que corren en la compu (el modo privado): lo que se habla no sale de ella. Ollama Cloud no cuenta.
export const LOCALES = ['ollama', 'lmstudio', 'llamacpp', 'llama-cpp', 'vllm', 'local'];
export const esLocal = (slug) => LOCALES.includes(String(slug || ''));

// Las IAs del switch del Chat (qué inteligencia o empresa responde; el modelo se elige aparte, dentro de cada una).
// [id, nombre, ícono de iconos.js, proveedores de Hermes]. «Otras» junta lo que no es Claude, ChatGPT ni local.
export const IAS = [
  ['claude', 'Claude', 'ia-claude', ['anthropic']],
  ['chatgpt', 'ChatGPT', 'ia-openai', ['openai-codex', 'openai']],
  ['local', 'En tu compu', 'lock', LOCALES],
  ['otras', 'Otras', 'sparkles', null],
];
export const iaDe = (slug) => (IAS.find(([, , , ps]) => ps && ps.includes(String(slug || ''))) || IAS[3])[0];
// Las IAs que esta compu tiene listas (con al menos un modelo). «En tu compu» siempre va: es el modo privado.
export const iasListas = (modelos) => {
  const ps = (modelos?.proveedores || []).filter((p) => p.listo && p.modelos.length);
  return IAS.filter(([id]) => id === 'local' || ps.some((p) => iaDe(p.slug) === id));
};
