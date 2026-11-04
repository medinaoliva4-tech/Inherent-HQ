// Las IAs que se conectan al OS (Ajustes → IA). Puro: lo usan el servidor (api/_lib/ia.js), Ajustes, el Agent Area y las
// pruebas. Casi todas hablan la API compatible con OpenAI (chat/completions + models), así que el servidor tiene UN solo
// adaptador: cambia la dirección y la llave. Las «locales» (la suscripción de Claude por el puente) corren en la
// compu de cada persona y se conectan desde el Chat, no aquí.
//   forma: 'llave'  → pega una API key
//          'url'    → la dirección de tu servidor (VPS, Ollama, LM Studio, vLLM…) y, si pide, su llave
//          'local'  → corre en tu compu (el puente): se conecta en el Chat
export const PROVEEDORES = [
  { id: 'openrouter', nombre: 'OpenRouter', sub: 'Cientos de modelos (Claude, GPT, Gemini, Llama…) con una sola llave', logo: 'openrouter', forma: 'llave', base: 'https://openrouter.ai/api/v1', llave: 'https://openrouter.ai/keys', busca: true, recomendado: true },
  { id: 'anthropic', nombre: 'Claude', sub: 'La API de Anthropic', logo: 'claude', forma: 'llave', base: 'https://api.anthropic.com/v1', llave: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai', nombre: 'OpenAI', sub: 'GPT y o-series', logo: 'openai', forma: 'llave', base: 'https://api.openai.com/v1', llave: 'https://platform.openai.com/api-keys' },
  { id: 'gemini', nombre: 'Gemini', sub: 'La API de Google AI Studio', logo: 'gemini', forma: 'llave', base: 'https://generativelanguage.googleapis.com/v1beta/openai', llave: 'https://aistudio.google.com/app/apikey' },
  { id: 'perplexity', nombre: 'Perplexity', sub: 'Investiga en la web y cita sus fuentes', logo: 'perplexity', forma: 'llave', base: 'https://api.perplexity.ai', llave: 'https://www.perplexity.ai/account/api/keys', busca: true, modelos: ['sonar', 'sonar-pro', 'sonar-reasoning-pro', 'sonar-deep-research'] },
  { id: 'deepseek', nombre: 'DeepSeek', sub: 'Modelos abiertos, muy baratos', logo: 'deepseek', forma: 'llave', base: 'https://api.deepseek.com/v1', llave: 'https://platform.deepseek.com/api_keys' },
  { id: 'featherless', nombre: 'Featherless', sub: 'Modelos abiertos por suscripción (DeepSeek, Kimi, GLM). Contexto de 32k en el plan actual', logo: 'custom', forma: 'llave', base: 'https://api.featherless.ai/v1', llave: 'https://featherless.ai/account/api-keys', contexto: 32768 },
  { id: 'nvidia', nombre: 'NVIDIA', sub: 'Modelos gratis de build.nvidia.com (MiniMax y otros); lentos, para preparar contexto', logo: 'custom', forma: 'llave', base: 'https://integrate.api.nvidia.com/v1', llave: 'https://build.nvidia.com/settings/api-keys', contexto: 131072 },
  { id: 'mistral', nombre: 'Mistral', sub: 'Modelos europeos', logo: 'mistral', forma: 'llave', base: 'https://api.mistral.ai/v1', llave: 'https://console.mistral.ai/api-keys' },
  { id: 'xai', nombre: 'Grok', sub: 'La API de xAI', logo: 'xai', forma: 'llave', base: 'https://api.x.ai/v1', llave: 'https://console.x.ai' },
  { id: 'groq', nombre: 'Groq', sub: 'Modelos abiertos a gran velocidad', logo: 'groq', forma: 'llave', base: 'https://api.groq.com/openai/v1', llave: 'https://console.groq.com/keys' },
  { id: 'together', nombre: 'Together AI', sub: 'Modelos abiertos en la nube', logo: 'together', forma: 'llave', base: 'https://api.together.xyz/v1', llave: 'https://api.together.ai/settings/api-keys' },
  { id: 'ollama', nombre: 'Ollama · servidor propio', sub: 'Tus modelos en tu VPS: pega su dirección', logo: 'ollama', forma: 'url', ejemplo: 'https://ia.tu-dominio.com/v1' },
  { id: 'lmstudio', nombre: 'LM Studio · servidor', sub: 'LM Studio expuesto en tu red o VPS', logo: 'lmstudio', forma: 'url', ejemplo: 'https://lmstudio.tu-dominio.com/v1' },
  { id: 'custom', nombre: 'Otro (compatible con OpenAI)', sub: 'vLLM, LiteLLM, una pasarela propia…', logo: 'custom', forma: 'url', ejemplo: 'https://gateway.tu-dominio.com/v1' },
  { id: 'puente', nombre: 'Claude · suscripción', sub: 'Tu plan de Claude, por el puente de tu compu', logo: 'claude', forma: 'local', donde: '#/chat' },
];
export const proveedorDe = (id) => PROVEEDORES.find((p) => p.id === id) || null;
// Cuántos tokens acepta un proveedor (si lo declara). Se usa para avisar antes de mandar un pedido que no cabe.
export const contextoDe = (id) => proveedorDe(id)?.contexto || 0;
// Estimación barata de tokens (español ≈ 3.4 caracteres por token). Para el umbral, no para cobrar.
export const tokensDe = (s) => Math.ceil(String(s || '').length / 3.4);
export const logoDe = (id) => `/brand/ia/${proveedorDe(id)?.logo || 'custom'}.svg`;

// Para qué se usa cada IA. Cada uso elige un proveedor y un modelo de los conectados.
export const USOS = [
  { id: 'agents', nombre: 'IA para Agents', sub: 'La que trabaja las etapas de los agentes', icono: 'agents' },
  { id: 'investigacion', nombre: 'IA para investigar', sub: 'Busca en la web y trae fuentes citadas (Perplexity u OpenRouter)', icono: 'globe' },
  { id: 'chat', nombre: 'IA para el Chat', sub: 'Las que aparecen en el selector del Chat', icono: 'chat' },
];
// La IA elegida para un uso, según el estado que devuelve el servidor (GET ia/estado).
export const iaDeUso = (estado, uso) => {
  const u = estado?.usos?.[uso];
  return u?.proveedor && (estado.proveedores || []).some((p) => p.id === u.proveedor && p.conectado) ? u : null;
};

// Una dirección de servidor aceptable: https (o http solo para localhost en desarrollo), sin credenciales en la URL.
export function baseValida(u) {
  try {
    const x = new URL(String(u || '').trim());
    if (x.username || x.password) return '';
    if (x.protocol !== 'https:' && !(x.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(x.hostname))) return '';
    return x.toString().replace(/\/+$/, '');
  } catch { return ''; }
}
// Los últimos 4 de una llave (lo único que se muestra después de conectarla).
export const ultimos4 = (k) => { const s = String(k || '').trim(); return s.length > 8 ? s.slice(-4) : ''; };
// Nombres de modelos amables para listas largas: los de chat primero, sin embeddings/audio/imagen.
export const modelosChat = (xs) => [...new Set((xs || []).map(String))].filter((m) => !/embed|whisper|tts|dall-e|image|moderation|audio|transcrib|rerank|vision-preview/i.test(m)).sort((a, b) => a.localeCompare(b)).slice(0, 300);
